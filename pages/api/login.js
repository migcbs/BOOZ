// pages/api/login.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient(); 

export default async function handler(req, res) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido. Usa POST.' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
    }

    // 1. Buscar al usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Usar un mensaje genérico por seguridad
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // 2. Comparar la contraseña ingresada con el hash guardado
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // 3. Login Exitoso
    
    // Remover el hash de la respuesta
    const { password: userPassword, ...safeUser } = user;

    res.status(200).json({ 
        success: true, 
        user: safeUser, // Devolvemos el usuario sin la contraseña
        message: 'Inicio de sesión exitoso.' 
    });

  } catch (error) {
    console.error("Error durante el login:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } 
}