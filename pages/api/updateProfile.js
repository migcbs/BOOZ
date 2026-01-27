// pages/api/updateProfile.js

// 1. Importar el cliente de Prisma para interactuar con la DB
import { PrismaClient } from '@prisma/client';

// 2. Inicializar Prisma fuera del handler para reutilizar la conexión 
// (Optimización para entornos Serverless como Vercel)
const prisma = new PrismaClient(); 

export default async function handler(req, res) {
  
  // A. Solo procesar peticiones POST (cuando se envían datos)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido. Usa POST.' });
  }

  try {
    // B. Extraer los datos enviados desde el frontend (del cuerpo de la petición)
    const { 
      email, 
      nombre, 
      apellido, 
      telefono, 
      tipoSangre, 
      alergias 
    } = req.body;

    // C. Validación básica
    if (!email) {
      return res.status(400).json({ message: 'El email del usuario es obligatorio.' });
    }

    // D. Guardar o Actualizar el perfil en la base de datos (UPSERT)
    // 'upsert' intenta BUSCAR por email; si lo encuentra, ACTUALIZA; si no, CREA.
    const updatedUser = await prisma.user.upsert({
      where: { email: email }, 
      update: { // Si el usuario YA existe
        nombre,
        apellido,
        telefono,
        tipoSangre,
        alergias,
        updatedAt: new Date(),
      },
      create: { // Si el usuario NO existe (crear nuevo registro)
        email,
        nombre,
        apellido,
        telefono,
        tipoSangre,
        alergias,
      },
    });

    // E. Respuesta exitosa
    res.status(200).json({ success: true, user: updatedUser, message: 'Perfil guardado y actualizado correctamente.' });

  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    // F. Respuesta de error
    res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud.' });
  } 
}