import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../server.js';

describe('Omnikey Backend APIs Integration & Zero-Knowledge Verification', () => {
  let authToken = '';
  let userId = '';
  let testItemId = '';
  const testUser = {
    name: 'College Examiner',
    email: `examiner-${Date.now()}@gmail.com`,
    password: 'MasterPassword2026!'
  };

  const getDbPath = () => path.resolve('mock_db.json');

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe(testUser.email.toLowerCase());
    userId = res.body.id;
  });

  it('should authenticate user and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;
  });

  it('should create a new Cards category item and verify dynamic fields', async () => {
    const cardItemPayload = {
      website: 'College Exam Visa Card',
      url: 'https://college.edu/pay',
      category: 'Cards',
      password: '987',
      notes: JSON.stringify({
        cardholderName: 'College Examiner',
        cardNumber: '4111 5555 6666 7777',
        cardExpiry: '12/28',
        cardCvv: '987',
        notesText: 'Super secret notes'
      })
    };

    const res = await request(app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${authToken}`)
      .send(cardItemPayload);

    expect(res.status).toBe(201);
    expect(res.body.website).toBe(cardItemPayload.website);
    expect(res.body.password).toBe('987'); // Defaults CVV as password fallback
    testItemId = res.body.id || res.body._id;

    // Zero-Knowledge Verification: Read mock_db.json file directly to verify encryption-at-rest
    const rawData = fs.readFileSync(getDbPath(), 'utf8');
    const db = JSON.parse(rawData);
    const dbItem = db.vault.find(item => item._id === testItemId);

    expect(dbItem).toBeDefined();
    // Fields must NOT be stored in plaintext
    expect(dbItem.password).not.toBe('987');
    expect(dbItem.password.startsWith('U2FsdGVk')).toBe(true); // AES-256 encrypted block signature
    expect(dbItem.notes).not.toBe('Super secret notes');
    expect(dbItem.notes.startsWith('U2FsdGVk')).toBe(true);
  });

  it('should retrieve vault items transparently decrypted', async () => {
    const res = await request(app)
      .get('/api/vault')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const decryptedItem = res.body.find(item => (item.id || item._id) === testItemId);
    expect(decryptedItem).toBeDefined();
    // Transparently decrypted password & notes
    expect(decryptedItem.password).toBe('987');
    
    // Notes parsing verification for serialized cards
    const parsedNotes = JSON.parse(decryptedItem.notes);
    expect(parsedNotes.cardNumber).toBe('4111 5555 6666 7777');
    expect(parsedNotes.cardCvv).toBe('987');
    expect(parsedNotes.notesText).toBe('Super secret notes');
  });

  it('should update user account settings profile', async () => {
    const updatePayload = {
      name: 'College Head Dean',
      email: testUser.email
    };

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(updatePayload.name);

    // Verify database value update
    const db = JSON.parse(fs.readFileSync(getDbPath(), 'utf8'));
    const dbUser = db.users.find(u => u._id === userId);
    expect(dbUser.name).toBe('College Head Dean');
  });

  it('should purge vault items successfully', async () => {
    const res = await request(app)
      .delete('/api/vault/purge')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);

    const db = JSON.parse(fs.readFileSync(getDbPath(), 'utf8'));
    const userItems = db.vault.filter(item => item.user === userId);
    expect(userItems.length).toBe(0);
  });

  it('should delete user account and associated metadata completely', async () => {
    const res = await request(app)
      .delete('/api/auth/delete-account')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);

    const db = JSON.parse(fs.readFileSync(getDbPath(), 'utf8'));
    const dbUserExists = db.users.some(u => u._id === userId);
    expect(dbUserExists).toBe(false);
  });
});
