import * as UserController from '../../src/controllers/user'
import { Request, Response } from 'express';




/*
const mockRequest = (body: any) => {
    return {
        body: body,
    } as unknown as Request;
};

const mockRequestParam = (params: any) => {
    return {
        params: params,
    } as unknown as Request;
};


const mockResponse = () => {
    let res = {
        status: jest.fn(),
        json: jest.fn()
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res as unknown as Response;
};

describe('createUser', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('Should create user and return 200', async() => {
        let req = mockRequest({ name: 'John Doe', email: 'john2@doe.ca', place:'NL' });
        let res = mockResponse();
        
        const id = Math.floor(0.5 * 1000000)
        jest.spyOn(Math, 'random').mockReturnValue(0.5);

        await UserController.createUser(req, res);
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            status: "success",
            data: "User John Doe created"
        })
    })

    it('should not create user and return 400 if no email is specified in the request', async() => {
        let req = mockRequest({ name: 'John Doe' });
        let res = mockResponse();

        await UserController.createUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
            status: "error",
            message: "User data is not formatted correctly"
        })
    })
})

describe('updateUser', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should update user with given id and return 200', async() => {
        let req = mockRequestParam({id:1 });
        let reqBody = mockRequest({name: 'Bob', email: 'bob@bob.com', place:'NL',bio:'Testing it out'})
        let res = mockResponse();
        
        const id = parseInt(req.params.id)
        const name = reqBody.body.name
        const email = reqBody.body.email
        const place = reqBody.body.place
        const bio = reqBody.body.bio

        await UserController.updateUser(req, res);
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            status: "success",
            data: {
                email: email,
                id: id,
                name: name,
                place: place,
                bio: bio
            }
        })
    })

    it('should not update user and return 400 if no id is specified in the request', async() => {
        let req = mockRequest({ name: 'John Doe',email:'john@doe.ca' });
        let res = mockResponse();

        await UserController.updateUser(req, res);
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
            status: "error",
            message: "Invalid user ID"
        })
    })

})
*/