import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient(); 
const saltRounds = 10; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido. Usa POST.' });
  }

  try {
    const { 
      email, nombre, apellido, telefono, password, 
      tipoSangre, alergias, contactoEmergencia, fechaNacimiento 
    } = req.body;

    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(), 
        nombre, 
        apellido, 
        telefono, 
        contactoEmergencia,
        // Conversión crítica: De string "YYYY-MM-DD" a objeto Date de PostgreSQL
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        tipoSangre, 
        alergias, 
        password: hashedPassword,
        role: "cliente" 
      },
    });

    const { password: _, ...safeUser } = newUser;

    res.status(200).json({ 
        success: true, 
        user: safeUser, 
        message: 'Registro exitoso.' 
    });

  } catch (error) {
    if (error.code === 'P2002') {
        return res.status(400).json({ message: 'El correo ya está registrado.' });
    }
    console.error("Error en registro:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  } 
}