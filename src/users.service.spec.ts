import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { PrismaService } from './prisma.service';
import { TaskService } from './task.service';
import { getQueueToken } from '@nestjs/bull';
import { SchedulerRegistry } from '@nestjs/schedule';

export const mockBullQueue: any = {
  add: jest.fn(),
  process: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;
  let taskService: TaskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        PrismaService,
        TaskService,
        SchedulerRegistry,
        {
          provide: getQueueToken('email'),
          useValue: mockBullQueue,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
    taskService = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addUser', () => {
    it('should add a new user and create a birthday on current year at 09:00 UTC if birthdate is not passed', async () => {
      const firstName = 'John';
      const lastName = 'Doe';
      const birthdate = '1990-02-01';
      const location = 'Asia/Jakarta';
      const email = 'john@example.com';
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
      const createSpy = jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue({
          id: 'foo',
          firstName,
          lastName,
          birthdate: new Date(birthdate),
          location,
          email,
        });
      const createTaskSpy = jest
        .spyOn(prismaService.task, 'create')
        .mockResolvedValue({
          id: 'bar',
          name: 'test',
          plannedDate: new Date(),
          isDone: false,
          timezone: location,
          userId: 'foo',
          type: 'BIRTHDAY',
        });
      const taskSpy = jest.spyOn(taskService, 'addTask');

      await service.addUser(firstName, lastName, birthdate, location, email);

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          firstName,
          lastName,
          birthdate: new Date(birthdate),
          location,
          email,
        },
      });
      expect(createTaskSpy).toHaveBeenCalledWith({
        data: {
          name: 'foo-birthday',
          plannedDate: new Date('2020-02-01T02:00:00.000Z'),
          timezone: 'Asia/Jakarta',
          type: 'BIRTHDAY',
          userId: 'foo',
        },
      });
      expect(taskSpy).toHaveBeenCalled();
    });
    it('should add a new user and create a birthday on next year at 09:00 UTC if birthdate is passed', async () => {
      const firstName = 'John';
      const lastName = 'Doe';
      const birthdate = '1990-01-01';
      const location = 'Asia/Jakarta';
      const email = 'john@example.com';
      jest.useFakeTimers().setSystemTime(new Date('2020-01-02'));
      const createSpy = jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue({
          id: 'foo',
          firstName,
          lastName,
          birthdate: new Date(birthdate),
          location,
          email,
        });
      const createTaskSpy = jest
        .spyOn(prismaService.task, 'create')
        .mockResolvedValue({
          id: 'bar',
          name: 'test',
          plannedDate: new Date(),
          isDone: false,
          timezone: location,
          userId: 'foo',
          type: 'BIRTHDAY',
        });
      const taskSpy = jest.spyOn(taskService, 'addTask');
      await service.addUser(firstName, lastName, birthdate, location, email);

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          firstName,
          lastName,
          birthdate: new Date(birthdate),
          location,
          email,
        },
      });
      expect(createTaskSpy).toHaveBeenCalledWith({
        data: {
          name: 'foo-birthday',
          plannedDate: new Date('2021-01-01T02:00:00.000Z'),
          timezone: 'Asia/Jakarta',
          type: 'BIRTHDAY',
          userId: 'foo',
        },
      });
      expect(taskSpy).toHaveBeenCalled();
    });
    it('should create tasks on module start based on pending tasks', async () => {
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue([
        {
          id: 'foo',
          firstName: 'foo1',
          lastName: 'bar',
          birthdate: new Date('1990-01-01'),
          location: 'Asia/Jakarta',
          email: 'foo@bar.com',
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          tasks: [
            {
              id: 'baz',
              isDone: false,
            },
          ],
        },
        {
          id: 'foo2',
          firstName: 'foo2',
          lastName: 'bar',
          birthdate: new Date('1990-01-01'),
          location: 'Asia/Jakarta',
          email: 'foo@bar.com',
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          tasks: [
            {
              id: 'baz2',
              isDone: false,
            },
          ],
        },
      ]);
      const taskSpy = jest.spyOn(taskService, 'addTask');
      const createTaskSpy = jest.spyOn(prismaService.task, 'create');
      await service.onModuleInit();
      expect(taskSpy).toHaveBeenCalledTimes(2);
      expect(createTaskSpy).not.toHaveBeenCalled();
    });
  });
});
