import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './users.controller';
import { UserService } from './users.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            addUser: jest.fn(),
            deleteUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('insertUser', () => {
    it('should call userService.addUser with correct data', async () => {
      // Mock data
      const body = {
        firstName: 'John',
        lastName: 'Doe',
        birthdate: '1990-01-01',
        location: 'New York',
        email: 'john@example.com',
      };

      // Call controller method
      await controller.insertUser(body);

      // Verify
      expect(userService.addUser).toHaveBeenCalledWith(
        body.firstName,
        body.lastName,
        body.birthdate,
        body.location,
        body.email,
      );
    });
  });

  describe('deleteUser', () => {
    it('should call userService.deleteUser with correct id', async () => {
      // Mock data
      const id = '123';

      // Call controller method
      await controller.deleteUser(id);

      // Verify
      expect(userService.deleteUser).toHaveBeenCalledWith(id);
    });
  });
});
