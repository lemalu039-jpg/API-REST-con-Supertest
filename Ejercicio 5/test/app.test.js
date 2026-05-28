const request = require('supertest');

const { app, resetData } = require('../src/app');

beforeEach(() => {
  resetData();
});

describe('API Contacts', () => {

  test('GET /api/contacts devuelve 200 y un array', async () => {

    const response = await request(app)
      .get('/api/contacts');

    expect(response.statusCode).toBe(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /api/contacts/:id devuelve contacto correcto', async () => {

    const create = await request(app)
      .post('/api/contacts')
      .send({
        name: 'Lucia',
        email: 'lucia@gmail.com'
      });

    const response = await request(app)
      .get(`/api/contacts/${create.body.id}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.name).toBe('Lucia');
  });

  test('GET /api/contacts/:id devuelve 404', async () => {

    const response = await request(app)
      .get('/api/contacts/999');

    expect(response.statusCode).toBe(404);
  });

  test('POST /api/contacts crea contacto', async () => {

    const response = await request(app)
      .post('/api/contacts')
      .send({
        name: 'Olga',
        email: 'olga@gmail.com',
        phone: '123456'
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.name).toBe('Olga');
  });

  test('POST /api/contacts devuelve 400 si falta name', async () => {

    const response = await request(app)
      .post('/api/contacts')
      .send({
        email: 'test@gmail.com'
      });

    expect(response.statusCode).toBe(400);
  });

  test('POST /api/contacts devuelve 400 si email inválido', async () => {

    const response = await request(app)
      .post('/api/contacts')
      .send({
        name: 'Test',
        email: 'correo-invalido'
      });

    expect(response.statusCode).toBe(400);
  });

  test('PUT /api/contacts/:id actualiza correctamente', async () => {

    const create = await request(app)
      .post('/api/contacts')
      .send({
        name: 'Juan',
        email: 'juan@gmail.com'
      });

    const response = await request(app)
      .put(`/api/contacts/${create.body.id}`)
      .send({
        phone: '999999'
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.phone).toBe('999999');
  });

  test('DELETE /api/contacts/:id elimina contacto', async () => {

    const create = await request(app)
      .post('/api/contacts')
      .send({
        name: 'Delete',
        email: 'delete@gmail.com'
      });

    const response = await request(app)
      .delete(`/api/contacts/${create.body.id}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.message)
      .toBe('Contacto eliminado correctamente');
  });

  test('DELETE /api/contacts/:id devuelve 404', async () => {

    const response = await request(app)
      .delete('/api/contacts/999');

    expect(response.statusCode).toBe(404);
  });

});