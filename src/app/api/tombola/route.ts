import csv from 'csv-parser';
import { Readable } from 'stream';
import * as admin from 'firebase-admin';

// Inicialización del SDK Admin (Solo si no está inicializado)
if (!admin.apps.length) {
    // Renombramos la variable para reflejar que puede ser contenido o ruta
    const serviceAccountContentOrPath = process.env.FIREBASE_ADMIN_CREDENTIALS_PATH;

    if (serviceAccountContentOrPath) {
        try {
            let serviceAccount;

            // 1. INTENTAR COMO CADENA JSON (Producción/Secret Manager)
            // Si el valor comienza con '{', asumimos que es la cadena JSON completa
            if (serviceAccountContentOrPath.trim().startsWith('{')) {
                serviceAccount = JSON.parse(serviceAccountContentOrPath);
            } else {
                // 2. ASUMIR COMO RUTA DE ARCHIVO (Desarrollo Local)
                // Si no es JSON, asumimos que es una ruta local y usamos require
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                serviceAccount = require(serviceAccountContentOrPath);
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: "proyectotombola-51309",
            });
            console.log("Firebase Admin SDK inicializado correctamente.");

        } catch (error) {
            console.error("ERROR CRÍTICO al inicializar Firebase Admin:", error);
        }
    } else {
        console.error("ERROR: Clave de servicio Admin no configurada.");
    }
}

// *** AHORA LEEMOS LAS VARIABLES DEL ENTORNO ***
const GOOGLE_SHEET_CSV_URL = process.env.GOOGLE_SHEET_CSV_URL || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

/**
 * Función de seguridad para verificar el origen (dominio) de la solicitud.
 */
function isAuthorizedOrigin(request: Request): boolean {
    const referer = request.headers.get('referer');

    // Falla si no se configuró la variable o si el referer no es el dominio permitido.
    return !!(ALLOWED_ORIGIN && referer && referer.startsWith(ALLOWED_ORIGIN));
}

export async function GET(request: Request) {
    // 1. **VERIFICACIÓN DE SEGURIDAD: Origen de la Solicitud**
    if (!isAuthorizedOrigin(request)) {
        return Response.json({ error: "Acceso denegado: Solicitud fuera del dominio autorizado." }, { status: 403 });
    }

    // --- 2. VERIFICACIÓN DE AUTORIZACIÓN (Login y Rol) ---
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return Response.json({ error: "No autorizado. Token de usuario requerido." }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // **Verificación de Rol (El requisito 'admin'):**
        // Comprueba si el token contiene el Claim 'role: sorteador'
        if (decodedToken.role !== 'sorteador') {
            return Response.json({ error: "Permiso denegado. Se requiere el rol 'sorteador'." }, { status: 403 });
        }

    } catch (error) {
        console.error("Error al verificar token:", error);
        return Response.json({ error: "Token inválido o expirado. Vuelve a iniciar sesión." }, { status: 401 });
    }

    // 3. Comprobar que la URL del Sheet esté configurada
    if (!GOOGLE_SHEET_CSV_URL) {
        return Response.json({ error: "URL de Google Sheet no configurada en el servidor." }, { status: 500 });
    }

    try {
        // 4. DESCARGAR Y LEER EL CSV DE GOOGLE SHEETS
        const response = await fetch(GOOGLE_SHEET_CSV_URL);

        if (!response.ok) {
            console.error("Error al descargar la hoja:", response.status, response.statusText);
            return Response.json({ error: 'Error al acceder a Google Sheet. Verifica la configuración de la hoja (pública).' }, { status: 503 });
        }

        const fileContent = await response.text();
        const ids: string[] = [];

        // 5. PROCESAMIENTO CSV Y EXTRACCIÓN DE IDS
        await new Promise<void>((resolve, reject) => {
            Readable.from(fileContent)
                .pipe(csv())
                .on('data', (row) => {
                    // AHORA BUSCAMOS EL CAMPO 'ScotiaID'
                    if (row.ScotiaID && row.ScotiaID.trim() !== '') {
                        ids.push(row.ScotiaID.trim());
                    }
                })
                .on('end', () => resolve())
                .on('error', (error) => reject(error));
        });

        if (ids.length === 0) {
            return Response.json({ error: "No se encontraron IDs válidos en la hoja. (¿Fila de encabezado 'ID'?) " }, { status: 404 });
        }

        // 6. LÓGICA DE SORTEO
        const randomIndex = Math.floor(Math.random() * ids.length);
        const selectedID = ids[randomIndex];

        return Response.json({ selectedID, total: ids.length }, { status: 200 });

    } catch (error) {
        console.error("Error en el sorteo de tómbola:", error);
        return Response.json({ error: "Error interno del servidor al realizar el sorteo." }, { status: 500 });
    }
}