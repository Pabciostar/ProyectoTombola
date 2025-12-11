// ./src/app/api/setup-admin/route.ts

import * as admin from 'firebase-admin';
import { NextRequest } from 'next/server';

// ⚠️ REEMPLAZA ESTO CON TU CORREO LOGUEADO
const ADMIN_EMAIL_TO_SETUP = 'pablo.lpzh@gmail.com'; 
const TARGET_ROLE = 'sorteador';

// --- INICIALIZACIÓN DEL SDK ADMIN (Lógica para Producción/Secret Manager) ---
if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_ADMIN_CREDENTIALS_PATH;
    
    if (serviceAccountJson) {
        try {
            // El valor de la variable de entorno es el JSON string completo
            const serviceAccount = JSON.parse(serviceAccountJson); 
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || "proyectotombola-51309",
            });
        } catch (e) {
            console.error("ERROR: Fallo al parsear o inicializar Firebase Admin en setup-admin.", e);
        }
    }
}
// --------------------------------------------------------------------------

export async function GET(request: NextRequest) {
    
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