import csv from 'csv-parser';
import { Readable } from 'stream';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Inicialización del SDK Admin (Solo si no está inicializado)
if (!admin.apps.length) {
    const serviceAccountContentOrPath = process.env.FIREBASE_ADMIN_CREDENTIALS_PATH;

    if (serviceAccountContentOrPath) {
        try {
            let serviceAccount;

            if (serviceAccountContentOrPath.trim().startsWith('{')) {
                serviceAccount = JSON.parse(serviceAccountContentOrPath);
            } else {
                const fileContent = fs.readFileSync(serviceAccountContentOrPath, 'utf8');
                serviceAccount = JSON.parse(fileContent);
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || "proyectotombola-51309",
            });
            console.log("✅ Admin SDK inicializado.");

        } catch (e: any) {
            console.error("❌ ERROR CRÍTICO EN FIREBASE INIT:", e.message);
        }
    } else {
        console.error("ERROR: Clave de servicio Admin no configurada.");
    }
}

const GOOGLE_SHEET_CSV_URL = process.env.GOOGLE_SHEET_CSV_URL || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

function isAuthorizedOrigin(request: Request): boolean {
    const referer = request.headers.get('referer');
    return !!(ALLOWED_ORIGIN && referer && referer.startsWith(ALLOWED_ORIGIN));
}

export async function GET(request: Request) {
    // 1. VERIFICACIÓN DE SEGURIDAD
    if (!isAuthorizedOrigin(request)) {
        return Response.json({ error: "Acceso denegado." }, { status: 403 });
    }

    // 2. VERIFICACIÓN DE AUTORIZACIÓN
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return Response.json({ error: "No autorizado." }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const ALLOWED_ROLES = ['admin', 'sorteador'];

        if (!ALLOWED_ROLES.includes(decodedToken.role)) {
            return Response.json({ error: "Permiso denegado." }, { status: 403 });
        }
    } catch (error) {
        return Response.json({ error: "Token inválido." }, { status: 401 });
    }

    if (!GOOGLE_SHEET_CSV_URL) {
        return Response.json({ error: "Configuración incompleta." }, { status: 500 });
    }

    try {
        // 4. DESCARGAR CSV
        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        if (!response.ok) {
            return Response.json({ error: 'Error al acceder a la fuente de datos.' }, { status: 503 });
        }

        const fileContent = await response.text();
        const entries: string[] = [];

        // 5. PROCESAMIENTO CSV
        await new Promise<void>((resolve, reject) => {
            Readable.from(fileContent)
                .pipe(csv())
                .on('data', (row) => {
                    // Buscamos cualquier columna que se refiera al Correo o Email
                    // Si no existe, usamos row.ID como último recurso.
                    const value = row.Correo || row.correo || row.Email || row.email || row.EMAIL || row.ID; 
                    
                    if (value && value.trim() !== '') {
                        entries.push(value.trim().toUpperCase());
                    }
                })
                .on('end', () => resolve())
                .on('error', (error) => reject(error));
        });

        if (entries.length === 0) {
            return Response.json({ error: "No se encontraron datos en la hoja." }, { status: 404 });
        }

        // 6. LÓGICA DE SORTEO
        const randomIndex = Math.floor(Math.random() * entries.length);
        const selectedName = entries[randomIndex];

        return Response.json({ selectedName, total: entries.length }, { status: 200 });

    } catch (error) {
        console.error("Error en el sorteo:", error);
        return Response.json({ error: "Error interno del servidor." }, { status: 500 });
    }
}