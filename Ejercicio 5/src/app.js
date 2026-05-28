const express = require('express');

const app = express();

app.use(express.json());

// Base de datos en memoria
let contacts = [];
let currentId = 1;

// Reiniciar datos para tests
const resetData = () => {
  contacts = [];
  currentId = 1;
};

// GET todos
app.get('/api/contacts', (req, res) => {
  res.status(200).json(contacts);
});

// GET por ID
app.get('/api/contacts/:id', (req, res) => {
  const contact = contacts.find(
    c => c.id === parseInt(req.params.id)
  );

  if (!contact) {
    return res.status(404).json({
      error: 'Contacto no encontrado'
    });
  }

  res.status(200).json(contact);
});

// POST crear contacto
app.post('/api/contacts', (req, res) => {

  const { name, email, phone } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'El nombre es requerido'
    });
  }

  if (!email) {
    return res.status(400).json({
      error: 'El email es requerido'
    });
  }

  if (!email.includes('@')) {
    return res.status(400).json({
      error: 'Email inválido'
    });
  }

  const newContact = {
    id: currentId++,
    name,
    email,
    phone: phone || ''
  };

  contacts.push(newContact);

  res.status(201).json(newContact);
});

// PUT actualizar parcialmente
app.put('/api/contacts/:id', (req, res) => {

  const contact = contacts.find(
    c => c.id === parseInt(req.params.id)
  );

  if (!contact) {
    return res.status(404).json({
      error: 'Contacto no encontrado'
    });
  }

  const { name, email, phone } = req.body;

  if (email && !email.includes('@')) {
    return res.status(400).json({
      error: 'Email inválido'
    });
  }

  if (name !== undefined) {
    contact.name = name;
  }

  if (email !== undefined) {
    contact.email = email;
  }

  if (phone !== undefined) {
    contact.phone = phone;
  }

  res.status(200).json(contact);
});

// DELETE contacto
app.delete('/api/contacts/:id', (req, res) => {

  const index = contacts.findIndex(
    c => c.id === parseInt(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      error: 'Contacto no encontrado'
    });
  }

  contacts.splice(index, 1);

  res.status(200).json({
    message: 'Contacto eliminado correctamente'
  });
});

module.exports = {
  app,
  resetData
};