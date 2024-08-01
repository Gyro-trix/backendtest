import { type Request, type Response } from 'express';
import { createUserAuth, authUser, hashPassword, verifyPassword } from '../../src/controllers/auth';
import * as rest from '../../src/utils/rest';
import * as mysql from 'mysql2/promise';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

jest.mock('mysql2/promise');
jest.mock('crypto');
jest.mock('jsonwebtoken');
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const mockPool = {
  execute: jest.fn(),
};

(mysql.createPool as jest.Mock).mockReturnValue(mockPool);

describe('hashPassword', () => {
  it('should hash password correctly', async () => {
    const mockSalt = Buffer.from('salt');
    const mockHash = Buffer.from('hashedPassword');
    (crypto.pbkdf2 as jest.Mock).mockImplementation(
      (password, salt, iterations, keylen, digest, callback) => {
        callback(null, mockHash);
      }
    );

    const result = await hashPassword('password', mockSalt);
    expect(result).toBe(mockHash.toString('hex'));
  });
});

describe('verifyPassword', () => {
  it('should verify password correctly', async () => {
    const mockSalt = Buffer.from('salt');
    const mockHash = Buffer.from('hashedPassword');
    (crypto.pbkdf2 as jest.Mock).mockImplementation(
      (password, salt, iterations, keylen, digest, callback) => {
        callback(null, mockHash);
      }
    );

    const result = await verifyPassword('password', mockSalt, mockHash.toString('hex'));
    expect(result).toBe(true);
  });
});

describe('createUserAuth', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {
        username: 'testuser',
        password: 'testpassword',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return 400 if user data is not formatted correctly', async () => {
    req.body = {}; // Invalid data
    await createUserAuth(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(rest.error('User data is not formatted correctly'));
  });

  it('should create a new user and return 200', async () => {
    const mockSalt = Buffer.from('salt');
    const mockHash = 'hashedPassword';
    (crypto.randomBytes as jest.Mock).mockReturnValue(mockSalt);
    (crypto.pbkdf2 as jest.Mock).mockImplementation(
      (password, salt, iterations, keylen, digest, callback) => {
        callback(null, Buffer.from(mockHash));
      }
    );
    mockPool.execute.mockResolvedValueOnce([{ insertId: 1 }]); // Simulate user insert
    mockPool.execute.mockResolvedValueOnce([{ insertId: 2 }]); // Simulate auth insert

    await createUserAuth(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rest.success('User Created!'));
  });

  it('should return 500 on database error', async () => {
    mockPool.execute.mockRejectedValueOnce(new Error('DB Error'));

    await createUserAuth(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(rest.error('Database Error'));
  });
});

describe('authUser', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: {
        username: 'testuser',
        password: 'testpassword',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
  });

  it('should return 400 if user data is not formatted correctly', async () => {
    req.body = {}; // Invalid data
    await authUser(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(rest.error('User data is not formatted correctly'));
  });

  it('should return 400 if no such user exists', async () => {
    mockPool.execute.mockResolvedValueOnce([[]]); // No user found
    await authUser(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(rest.error('No Such User Exists'));
  });

  it('should return 200 and a token on successful login', async () => {
    const mockSalt = Buffer.from('salt');
    const mockHash = 'hashedPassword';
    (crypto.pbkdf2 as jest.Mock).mockImplementation(
      (password, salt, iterations, keylen, digest, callback) => {
        callback(null, Buffer.from(mockHash));
      }
    );
    const mockToken = 'jwtToken';
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);

    mockPool.execute.mockResolvedValueOnce([
      [
        {
          id: 1,
          username: 'testuser',
          password_hash: mockHash,
          salt: mockSalt,
        },
      ],
    ]);

    await authUser(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(rest.success(mockToken));
    expect(res.cookie).toHaveBeenCalledWith('token', mockToken, { httpOnly: true });
  });

  it('should return 400 on invalid username or password', async () => {
    const mockSalt = Buffer.from('salt');
    const mockHash = 'hashedPassword';
    (crypto.pbkdf2 as jest.Mock).mockImplementation(
      (password, salt, iterations, keylen, digest, callback) => {
        callback(null, Buffer.from('wrongHash'));
      }
    );

    mockPool.execute.mockResolvedValueOnce([
      [
        {
          id: 1,
          username: 'testuser',
          password_hash: mockHash,
          salt: mockSalt,
        },
      ],
    ]);

    await authUser(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(rest.error('Invalid Username or Password'));
  });
});