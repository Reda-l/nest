import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request as ReqOptions, Response } from 'express';
import { HttpStatus, HttpException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  const mockUsersService : any = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn().mockResolvedValue({
      "_id": "64c278fc9e70d8a9130359cd",
      "username": "reda123",
      "email": "reda@moaj.info",
      "password": "$2b$10$qjwY24aoVcKgaiEbB4uSUe.TQoGmbggBEz6DQOwa03Gtf/dm87e8.",
      "firstname": "Reda",
      "lastname": "Da",
      "DOB": null,
      "status": "VALIDATED",
      "gender": "MALE",
      "createdBy": [],
      "emailVerified": false,
      "internalComments": "reda user",
      "phoneNumber": "0607282030",
      "imageUrl": "https://www.thesun.co.uk/wp-content/uploads/2021/12/NINTCHDBPICT000696638839.jpg?strip=all&w=960",
      "deleted": false,
      "created_at": "2023-07-27T14:02:36.466Z",
      "updated_at": "2023-07-27T16:48:20.247Z",
      "__v": 0,
      "lastLoginAt": "2023-07-27T14:07:23.433Z"
    }),
    update: jest.fn(),
    remove: jest.fn().mockResolvedValue({
      "_id": "64c278fc9e70d8a9130359cd",
      "username": "reda123",
      "email": "reda@moaj.info",
      "password": "$2b$10$qjwY24aoVcKgaiEbB4uSUe.TQoGmbggBEz6DQOwa03Gtf/dm87e8.",
      "firstname": "Reda",
      "lastname": "Da",
      "DOB": null,
      "status": "VALIDATED",
      "gender": "MALE",
      "createdBy": [],
      "emailVerified": false,
      "internalComments": "reda user",
      "phoneNumber": "0607282030",
      "imageUrl": "https://www.thesun.co.uk/wp-content/uploads/2021/12/NINTCHDBPICT000696638839.jpg?strip=all&w=960",
      "deleted": true,
      "created_at": "2023-07-27T14:02:36.466Z",
      "updated_at": "2023-07-27T16:48:20.247Z",
      "__v": 0,
      "lastLoginAt": "2023-07-27T14:07:23.433Z"
    }),
    restore: jest.fn(),
    permaRemove: jest.fn(),
    resetPassword: jest.fn(),
    usersDataToCSV: jest.fn(),
    bulkRemove: jest.fn(),
    validateUsers: jest.fn(),
    bulkReject: jest.fn(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService, // Use the mock UsersService here
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  // Mock user object for testing purposes
  const mockUser = {

    "status": "VALIDATED",
    "gender": "MALE",
    "isNewUser": true,
    "imageUrl": "https://www.thesun.co.uk/wp-content/uploads/2021/12/NINTCHDBPICT000696638839.jpg?strip=all&w=960",
    "emailVerified": false,
    "profileCompleted": false,
    "firstname": "john",
    "lastname": "doe",
    "middlename": "",
    "username": "john123",
    "phoneNumber": "0607282030",
    "email": "doe@moaj.info",
    "password": "johndoe123",
    "internalComments": "test user",
    "DOB": null

  }as any;

  describe('create', () => {
    it('should create a new user and return the user object with an auto-generated ID', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        "status": "VALIDATED",
        "gender": "MALE",
        "imageUrl": "https://www.thesun.co.uk/wp-content/uploads/2021/12/NINTCHDBPICT000696638839.jpg?strip=all&w=960",
        "emailVerified": false,
        "profileCompleted": false,
        "firstname": "john",
        "lastname": "doe",
        "middlename": "",
        "username": "john123",
        "phoneNumber": "0607282030",
        "email": "doe@moaj.info",
        "password": "johndoe123",
        "internalComments": "test user",
        "DOB": null
      };

      // Mock the create method of the UsersService to return the user object
      jest.spyOn(service, 'create').mockResolvedValueOnce(mockUser);

      // Act
      const result = await controller.create(createUserDto, { /* mock Request object */ });

      // Assert
      expect(result).toEqual({
        user: mockUser,
        password: createUserDto.password,
      });
    });

    it('should handle errors if user creation fails', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        username: '1',
        firstname: 'john',
        lastname : 'doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      // Mock the create method of the UsersService to throw an error
      jest.spyOn(service, 'create').mockRejectedValueOnce(new HttpException('Error occurred', HttpStatus.INTERNAL_SERVER_ERROR));
      
      // Act and Assert
      await expect(controller.create(createUserDto, { /* mock Request object */ })).rejects.toThrowError(
        new HttpException('Error occurred', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });
  
  // describe('update', () => {
  //   it('should update a user', async () => {
  //     // Arrange: Prepare the data for the test (e.g., user ID, updateUserDto)
  //     const userId = '64c278fc9e70d8a9130359cd';
  //     const updateUserDto: UpdateUserDto = {
  //       lastname :'Reda',
  //     };

  //     // Act: Call the controller method being tested
  //     const updatedUser = await controller.update(userId, updateUserDto);
  //     console.log("🚀 ~🚀~ it ~ updatedUser:", updatedUser)

  //     // Assert: Make assertions to verify the expected behavior
  //     expect(updatedUser).toBeDefined();
  //   });

  // });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      // Arrange: Prepare the data for the test (e.g., user ID)
      const userId = '64c278fc9e70d8a9130359cd';

      // Act: Call the controller method being tested
      const user = await controller.findOne({},userId);

      // Assert: Make assertions to verify the expected behavior
      expect(user).toBeDefined();
      // Add more assertions as needed to check the response or side effects
    });

    // Add more test cases for other scenarios related to the 'findOne' method
    // ...

  });

  describe('remove', () => {
    it('should remove a user', async () => {
      // Arrange: Prepare the data for the test (e.g., user ID)
      const userId = '64c278fc9e70d8a9130359cd';

      // Act: Call the controller method being tested
      const deletedUser = await controller.remove(userId);

      // Assert: Make assertions to verify the expected behavior
      expect(deletedUser).toBeDefined();
    });
  });

});
