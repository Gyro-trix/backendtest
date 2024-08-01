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