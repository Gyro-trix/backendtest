import * as rest from '../../src/utils/rest'
import { Request, Response } from 'express';
import { getUser, createUser, updateUser, deleteUser} from '../../src/controllers/user'
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
                name: "test test",
                email: "test@test.com",
                place: "NL",
                bio: "Testing so database stuff",
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
        await createUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'User data is not formatted correctly' });
      });
    
      it('should return error if user ID is present in request body', async () => {
        req.body.id = 1; // Adding ID to trigger the error
        await createUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'User ID will be generated automatically' });
      });
    
      it('should return error if email already exists in the database', async () => {
        (mockPool.query as jest.Mock).mockResolvedValueOnce([[{ id: 1, name: 'Test Bob', email: 'test@test.com', place: 'TS', bio: 'test' }]]);
    
        await createUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email already in use' });
      });
    
      it('should create user and return success if data is valid and email is unique', async () => {
        (mockPool.query as jest.Mock)
          .mockResolvedValueOnce([[]]) // No existing user with the email
          .mockResolvedValueOnce([{ insertId: 1 }]); // Simulate successful insert
    
        await createUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: 'test test' });
      });
    
})

describe('getUser', ()=>{
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
            params:{
                id: '1',
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
        await getUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'ID is not a number' });
      });

    it('should return error if no entry for given ID', async () => {
        (mockPool.query as jest.Mock).mockResolvedValueOnce([[]]);
    
        await getUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'No Entry for given ID' });
      });
    
    it('should return user data if ID exists', async () => {
        const mockUser = [{ id: 1, name: 'John Doe', email: 'john@example.com', place: 'NY', bio: 'Bio' }];
        (mockPool.query as jest.Mock).mockResolvedValueOnce([mockUser]);
    
        await getUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: mockUser });
      });
})

describe('updateUser', ()=>{
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
                name: "test test",
                email: "test@test.com",
                place: "NL",
                bio: "Testing so database stuff",
            },
            params:{
                id: '1'
            }
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
        req.body = { name: 'Test Bob' }; // Incomplete data to trigger validation error
        await updateUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'User data is not formatted correctly' });
      });
    
      it('should return error if ID is not a number', async () => {
        req.params!.id = 'abc'; // Invalid ID to trigger the error
        await updateUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'ID is not a number' });
      });
    
      it('should return error if email already exists in the database', async () => {
        (mockPool.query as jest.Mock).mockResolvedValueOnce([[{ id: 1, name: 'Test Test', email: 'test@test.com', place: 'TS', bio: 'Still testing' }]]);
    
        await updateUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email already in use' });
      });
    
      it('should return error if no entry for the given ID', async () => {
        (mockPool.query as jest.Mock)
          .mockResolvedValueOnce([[]]) // No existing user with the email
          .mockResolvedValueOnce([[]]); // Simulate no update due to ID not existing
    
        await updateUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'No Entry for given ID' });
      });
    
      it('should update user and return success if data is valid and email is unique', async () => {
        (mockPool.query as jest.Mock)
          .mockResolvedValueOnce([[]]) // No existing user with the email
          .mockResolvedValueOnce([{ affectedRows: 1 }]) // Simulate successful update
          .mockResolvedValueOnce([[{ id: 1, name: 'Bob Tester', email: 'bob@tester.com', place: 'NL', bio: 'Bio' }]]); // Simulate fetching the updated user
    
        await updateUser(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: [{ id: 1, name: 'Bob Tester', email: 'bob@tester.com', place: 'NL', bio: 'Bio' }] });
      });
    })
    describe('deleteUser', ()=>{
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
                params:{
                    id: '1'
                }
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
            req.params!.id = 'abc'; // Invalid ID to trigger the error
            await deleteUser(req as Request, res as Response);
        
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'ID is not a number' });
          });

        it('should return error if no entry for the given ID', async () => {
            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce([[]]); // Simulate no update due to ID not existing
        
            await deleteUser(req as Request, res as Response);
        
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'No Entry for given ID' });
        });

        it('should delete user and return success if data is valid and email is unique', async () => {
            (mockPool.query as jest.Mock)
              .mockResolvedValueOnce([{ affectedRows: 1 }]) // Simulate successful update
              //.mockResolvedValueOnce([[{ id: 1, name: 'Bob Tester', email: 'bob@tester.com', place: 'NL', bio: 'Bio' }]]); // Simulate fetching the updated user
        
            await deleteUser(req as Request, res as Response);
        
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ data: { affectedRows: 1 } });
          });

    })

