const request = require('supertest');
const { app, resetContacts } = require('../src/app');

beforeEach(() => {
  resetContacts();
});

describe('API Contacts - Ejercicio 6 Avanzado', () => {
  
  // ── Bloque A: Validación de email con regex
  describe('POST /api/contacts - Validación de email', () => {
    test('devuelve 400 cuando email es "@"', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: '@' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    test('devuelve 400 cuando email es "usuario@"', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'usuario@' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    test('devuelve 400 cuando email es "@dominio.com"', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: '@dominio.com' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    test('devuelve 400 cuando email no tiene @', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'sin-arroba' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/email/i);
    });

    test('devuelve 201 con email válido "usuario@dominio.com"', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'usuario@dominio.com' });
      expect(res.statusCode).toBe(201);
      expect(res.body.email).toBe('usuario@dominio.com');
    });
  });

  // ── Bloque B: Detección de email duplicado (409 Conflict)
  describe('POST /api/contacts - Duplicados', () => {
    test('devuelve 409 al crear contacto con email existente', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Duplicado', email: 'ana@example.com' });
      expect(res.statusCode).toBe(409);
      expect(res.body.error).toContain('email');
    });

    test('devuelve 409 con email en mayúsculas (case-insensitive)', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Duplicado', email: 'ANA@EXAMPLE.COM' });
      expect(res.statusCode).toBe(409);
    });

    test('no aumenta el total de contactos tras 409', async () => {
      await request(app)
        .post('/api/contacts')
        .send({ name: 'Duplicado', email: 'ana@example.com' });
      
      const listRes = await request(app).get('/api/contacts');
      expect(listRes.body).toHaveLength(3);
    });
  });

  // ── Bloque C: Búsqueda y filtros en GET /api/contacts
  describe('GET /api/contacts - Búsqueda y filtros', () => {
    test('?search=ana devuelve contactos con "ana" en nombre o email', async () => {
      const res = await request(app).get('/api/contacts?search=ana');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every(c => 
        c.name.toLowerCase().includes('ana') || c.email.toLowerCase().includes('ana')
      )).toBe(true);
    });

    test('?search=ANA es case-insensitive', async () => {
      const resLower = await request(app).get('/api/contacts?search=ana');
      const resUpper = await request(app).get('/api/contacts?search=ANA');
      expect(resLower.body).toEqual(resUpper.body);
    });

    test('?search=example filtra por email', async () => {
      const res = await request(app).get('/api/contacts?search=example');
      expect(res.body.every(c => c.email.includes('example'))).toBe(true);
    });

    test('?search=xyznoexiste devuelve array vacío', async () => {
      const res = await request(app).get('/api/contacts?search=xyznoexiste');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('?favorite=true devuelve solo favoritos', async () => {
      const res = await request(app).get('/api/contacts?favorite=true');
      expect(res.statusCode).toBe(200);
      expect(res.body.every(c => c.favorite === true)).toBe(true);
      expect(res.body.length).toBe(1); // Solo Luis es favorito
    });

    test('sin query params devuelve todos los contactos', async () => {
      const res = await request(app).get('/api/contacts');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(3);
    });
  });

  // ── Bloque D: Toggle de favorito (PATCH)
  describe('PATCH /api/contacts/:id/favorite', () => {
    test('toggle: false → true para Ana (id=1)', async () => {
      const res = await request(app).patch('/api/contacts/1/favorite');
      expect(res.statusCode).toBe(200);
      expect(res.body.favorite).toBe(true);
    });

    test('toggle doble: true → false para Ana', async () => {
      await request(app).patch('/api/contacts/1/favorite'); // false → true
      const res = await request(app).patch('/api/contacts/1/favorite'); // true → false
      expect(res.body.favorite).toBe(false);
    });

    test('toggle: true → false para Luis (id=2)', async () => {
      const res = await request(app).patch('/api/contacts/2/favorite');
      expect(res.statusCode).toBe(200);
      expect(res.body.favorite).toBe(false);
    });

    test('devuelve 404 para ID inexistente', async () => {
      const res = await request(app).patch('/api/contacts/999/favorite');
      expect(res.statusCode).toBe(404);
    });

    test('el cambio persiste: GET refleja el toggle', async () => {
      await request(app).patch('/api/contacts/1/favorite');
      const getRes = await request(app).get('/api/contacts/1');
      expect(getRes.body.favorite).toBe(true);
    });
  });

  // ── Bloque E: PUT mejorado con validación y duplicados
  describe('PUT /api/contacts/:id - Actualización mejorada', () => {
    test('actualizar solo name devuelve 200', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ name: 'Ana Actualizada' });
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Ana Actualizada');
    });

    test('actualizar con email inválido devuelve 400', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ email: 'invalido' });
      expect(res.statusCode).toBe(400);
    });

    test('actualizar con email de otro contacto devuelve 409', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ email: 'luis@example.com' });
      expect(res.statusCode).toBe(409);
    });

    test('actualizar con el mismo email del contacto devuelve 200', async () => {
      const res = await request(app)
        .put('/api/contacts/1')
        .send({ email: 'ana@example.com' });
      expect(res.statusCode).toBe(200);
    });

    test('actualizar ID inexistente devuelve 404', async () => {
      const res = await request(app)
        .put('/api/contacts/999')
        .send({ name: 'Test' });
      expect(res.statusCode).toBe(404);
    });
  });

  //. 

  // ── Bloque F: Middleware de error y formato uniforme
  describe('Middleware de error - Formato uniforme', () => {
    test('ruta inexistente devuelve 404 con JSON', async () => {
      const res = await request(app).get('/api/ruta-que-no-existe');
      expect(res.statusCode).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toHaveProperty('error');
    });

    test('errores de negocio incluyen campo status', async () => {
      const res = await request(app).get('/api/contacts/9999');
      expect(res.body).toHaveProperty('status', 404);
    });

    test('POST con error 400 incluye status', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'invalido' });
      expect(res.body).toHaveProperty('status', 400);
    });

    test('POST con duplicado 409 incluye status', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Test', email: 'ana@example.com' });
      expect(res.body).toHaveProperty('status', 409);
    });
  });

  // ── Tests base del CRUD (regresión)
  describe('CRUD básico - Tests de regresión', () => {
    test('GET /api/contacts devuelve 200 y array', async () => {
      const res = await request(app).get('/api/contacts');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('GET /api/contacts/:id devuelve contacto correcto', async () => {
      const res = await request(app).get('/api/contacts/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Ana García');
    });

    test('GET /api/contacts/:id devuelve 404', async () => {
      const res = await request(app).get('/api/contacts/999');
      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe(404);
    });

    test('POST /api/contacts crea contacto con estructura completa', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .send({ name: 'Nuevo', email: 'nuevo@test.com', phone: '123' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('favorite', false);
      expect(res.body).toHaveProperty('createdAt');
    });

    test('DELETE /api/contacts/:id elimina contacto', async () => {
      const createRes = await request(app)
        .post('/api/contacts')
        .send({ name: 'Eliminar', email: 'del@test.com' });
      
      const delRes = await request(app)
        .delete(`/api/contacts/${createRes.body.id}`);
      
      expect(delRes.statusCode).toBe(200);
      expect(delRes.body).toHaveProperty('message');
    });
  });
});

//..