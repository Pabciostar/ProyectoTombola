// ./src/app/api/setup-admin/route.ts

import * as admin from 'firebase-admin';
import { NextRequest } from 'next/server';

// ⚠️ REEMPLAZA ESTO CON TU CORREO LOGUEADO
const ADMIN_EMAIL_TO_SETUP = 'pablo.lpzh@gmail.com';
const TARGET_ROLE = 'sorteador';

// --- INICIALIZACIÓN DEL SDK ADMIN (Lógica reforzada) ---
function initializeFirebaseAdmin() {
    if (admin.apps.length) {
        console.log("Firebase Admin ya estaba inicializado.");
        return true;
    }
    
    const serviceAccountContentOrPath = process.env.FIREBASE_ADMIN_CREDENTIALS_PATH;

    if (!serviceAccountContentOrPath) {
        console.error("ERROR: Clave de servicio Admin no configurada.");
        return false;
    }

    try {
        let serviceAccount;
        
        // 1. Intentar como JSON puro
        if (serviceAccountContentOrPath.trim().startsWith('{')) {
            serviceAccount = JSON.parse(serviceAccountContentOrPath);
        } else {
            // 2. Intentar como ruta local
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            serviceAccount = require(serviceAccountContentOrPath);
        }
        
        // 3. Inicialización
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id || "proyectotombola-51309",
        });
        console.log("✅ Admin SDK inicializado exitosamente.");
        return true;

    } catch (e: any) {
        // ❌ Este mensaje aparecerá en los logs si falla JSON.parse o initializeApp
        console.error(
            "❌ ERROR FATAL DE INICIALIZACIÓN (Verificar Secret Manager y JSON):", 
            e.message
        );
        return false;
    }
}

// Llama a la función al inicio del módulo
const IS_ADMIN_SDK_INITIALIZED = initializeFirebaseAdmin();
// --------------------------------------------------------------------------

export async function GET(request: NextRequest) {

    if (!IS_ADMIN_SDK_INITIALIZED) {
         return Response.json({ error: "El SDK de Firebase Admin no pudo inicializarse. Revisar logs de Cloud." }, { status: 500 });
    }
    // --- SEGURIDAD ÚNICA: CLAVE TEMPORAL ---
    const secretKey = request.nextUrl.searchParams.get('key');
    const MY_SECR3T_SETUP_KEY = 'MiTombola2025';

    if (secretKey !== MY_SECR3T_SETUP_KEY) {
        return Response.json({ error: "Acceso denegado: Clave secreta incorrecta." }, { status: 403 });
    }
    // ---------------------------------------------------------

    try {
        const userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL_TO_SETUP);

        await admin.auth().setCustomUserClaims(userRecord.uid, { role: TARGET_ROLE });

        return Response.json({
            success: true,
            message: `Rol '${TARGET_ROLE}' asignado. ELIMINE ESTE API ROUTE INMEDIATAMENTE.`,
            userId: userRecord.uid
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error en setup-admin:", error);
        return Response.json({
            success: false,
            error: `Fallo al asignar rol. Causa: ${error.message}. Asegúrate de que el usuario haya iniciado sesión al menos una vez.`
        }, { status: 500 });
    }
}