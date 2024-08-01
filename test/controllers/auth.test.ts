import * as rest from '../../src/utils/rest'
import { Request, Response } from 'express';
import { createUserAuth, authUser} from '../../src/controllers/auth'
import mysql from 'mysql2'

jest.mock('mysql2', () => {
    const mockPool ={
        query: jest.fn(),
        promise: jest.fn().mockReturnThis(),
    };
    return{
        createPool: jest.fn((config)=>mockPool)
    };
});

jest.mock('../../src/utils/rest', () => ({
    error: jest.fn((msg:string)=>({error: msg})),
    success: jest.fn((data: any)=>({data})),
}))

describe('createUser', ()=>{
    let req: Partial<Request>;
    let res: Partial<Response>;
    const mockPool = mysql.createPool({
        host:'localhost',
        user:'user',
        password:'password',
        database:'databse',
    });

    beforeEach(()=>{
        req = {
            body:{
                username: "Tester1999",
                email: "tester1999@test.com"
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(()=>{
        jest.clearAllMocks();
    });

    it('should return error if user data is not formatted correctly', async () => {
        req.body = { name: 'test test' }; // Incomplete data to trigger validation error
        await createUserAuth(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'User data is not formatted correctly' });
      });

      it('Unable to connect to the Database table', async () => {
        await createUserAuth(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Database Error" });
      });
    
      it('should create user and return success if data is valid and email is unique', async () => {
        (mockPool.query as jest.Mock)
          .mockResolvedValueOnce([[]]) // No existing user with the email
          .mockResolvedValueOnce([{ insertId: 1 }]); // Simulate successful insert
    
        await createUserAuth(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: "User Created!" });
      });
    
})

describe('authUser', ()=>{
    let req: Partial<Request>;
    let res: Partial<Response>;
    const mockPool = mysql.createPool({
        host:'localhost',
        user:'user',
        password:'password',
        database:'databse',
    });

    beforeEach(()=>{
        req = {
            body:{
                username: "Tester1999",
                email: "tester1999@test.com"
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(()=>{
        jest.clearAllMocks();
    });

    it('should return error if ID is not a number', async () => {
        req.params!.id = 'abc';
        await authUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'ID is not a number' });
      });

    it('should return error if no entry for given ID', async () => {
        (mockPool.query as jest.Mock).mockResolvedValueOnce([[]]);
    
        await authUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'No Entry for given ID' });
      });
    
    it('Return Cookie/Token', async () => {
        const mockUser = [{ id: 1, name: 'Bob Tester', email: 'bob@tester.com', place: 'NL', bio: 'Bio' }];
        (mockPool.query as jest.Mock).mockResolvedValueOnce([mockUser]);
    
        await authUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: mockUser });
      });
})


