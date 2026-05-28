const express = require('express');
const app = express();
app.use(express.json());

// ── Validación de email con regex básica
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContact({ name, email }) {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'El campo name es requerido.' };
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'El formato del email es inválido.' };
  }
  return { valid: true };
}
//

// ── Datos iniciales en memoria (estructura mejorada)
let contacts = [
  { id: 1, name: 'Ana García',   email: 'ana@example.com',  phone: '555-0001', favorite: false, createdAt: '2024-01-10T08:00:00.000Z' },
  { id: 2, name: 'Luis Pérez',   email: 'luis@example.com', phone: '555-0002', favorite: true,  createdAt: '2024-01-11T09:00:00.000Z' },
  { id: 3, name: 'Eva Martínez', email: 'eva@example.com',  phone: null,       favorite: false, createdAt: '2024-01-12T10:00:00.000Z' },
];
let nextId = 4;

// Permite a los tests reiniciar el estado
function resetContacts() {
  contacts = [
    { id: 1, name: 'Ana García',   email: 'ana@example.com',  phone: '555-0001', favorite: false, createdAt: '2024-01-10T08:00:00.000Z' },
    { id: 2, name: 'Luis Pérez',   email: 'luis@example.com', phone: '555-0002', favorite: true,  createdAt: '2024-01-11T09:00:00.000Z' },
    { id: 3, name: 'Eva Martínez', email: 'eva@example.com',  phone: null,       favorite: false, createdAt: '2024-01-12T10:00:00.000Z' },
  ];
  nextId = 4;
}

// ── GET /api/contacts (con búsqueda y filtro de favoritos)
app.get('/api/contacts', (req, res) => {
  const { search, favorite } = req.query;
  let result = [...contacts];

  // Filtro por texto (nombre o email) - case insensitive
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    result = result.filter(
      c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }

  // Filtro por favoritos
  if (favorite === 'true') {
    result = result.filter(c => c.favorite === true);
  }

  res.json(result);
});

// ── GET /api/contacts/:id
app.get('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(c => c.id === Number(req.params.id));
  if (!contact) return res.status(404).json({ status: 404, error: 'Contacto no encontrado.' });
  res.json(contact);
});

// ── POST /api/contacts
app.post('/api/contacts', (req, res) => {
  const { name, email, phone } = req.body;

  // Validación con regex
  const validation = validateContact({ name, email });
  if (!validation.valid) {
    return res.status(400).json({ status: 400, error: validation.error });
  }

  // Verificar duplicado (case-insensitive)
  const duplicate = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
  if (duplicate) {
    return res.status(409).json({ status: 409, error: 'Ya existe un contacto con ese email.' });
  }

  const newContact = {
    id: nextId++,
    name: name.trim(),
    email: email.toLowerCase(),
    phone: phone?.trim() || null,
    favorite: false,
    createdAt: new Date().toISOString(),
  };
  contacts.push(newContact);
  res.status(201).json(newContact);
});

// ── PUT /api/contacts/:id (actualización parcial)
app.put('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(c => c.id === Number(req.params.id));
  if (!contact) return res.status(404).json({ status: 404, error: 'Contacto no encontrado.' });

  const { name, email, phone } = req.body;

  // Validar email si se proporciona
  if (email !== undefined) {
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ status: 400, error: 'El formato del email es inválido.' });
    }
    // Verificar duplicado excluyendo el propio contacto
    const duplicate = contacts.find(
      c => c.id !== contact.id && c.email.toLowerCase() === email.toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({ status: 409, error: 'Ya existe un contacto con ese email.' });
    }
    contact.email = email.toLowerCase();
  }

  // Actualizar name si se proporciona
  if (name !== undefined) {
    if (name.trim() === '') {
      return res.status(400).json({ status: 400, error: 'El campo name no puede estar vacío.' });
    }
    contact.name = name.trim();
  }

  // Actualizar phone si se proporciona
  if (phone !== undefined) contact.phone = phone?.trim() || null;

  res.json(contact);
});

// ── PATCH /api/contacts/:id/favorite (toggle de favorito) ⭐ NUEVO
app.patch('/api/contacts/:id/favorite', (req, res) => {
  const contact = contacts.find(c => c.id === Number(req.params.id));
  if (!contact) return res.status(404).json({ status: 404, error: 'Contacto no encontrado.' });
  contact.favorite = !contact.favorite;
  res.json(contact);
});

// ── DELETE /api/contacts/:id
app.delete('/api/contacts/:id', (req, res) => {
  const index = contacts.findIndex(c => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ status: 404, error: 'Contacto no encontrado.' });
  contacts.splice(index, 1);
  res.json({ message: 'Contacto eliminado.' });
});

// ── Middleware: Ruta no encontrada (404 genérico) ⭐ NUEVO
app.use((req, res) => {
  res.status(404).json({ status: 404, error: 'Ruta no encontrada.' });
});

// ── Middleware: Manejador de errores inesperados ⭐ NUEVO
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 500, error: 'Error interno del servidor.' });
});

module.exports = { app, resetContacts };

// ..