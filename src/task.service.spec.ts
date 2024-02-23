import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { TaskService } from './task.service';
import { CronJob } from 'cron';

const schedulerRegistryMock = {
  addCronJob: jest.fn(),
  deleteCronJob: jest.fn(),
};

jest.mock('cron', () => ({
  CronJob: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
  })),
}));

describe('TaskService', () => {
  let taskService: TaskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: SchedulerRegistry, useValue: schedulerRegistryMock },
      ],
    }).compile();

    taskService = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addTask', () => {
    it('should add and start a new task', () => {
      const name = 'test-task';
      const datetime = new Date();
      const callback = jest.fn().mockResolvedValue(undefined);
      const timezone = 'UTC';
      const onComplete = jest.fn().mockResolvedValue(undefined);

      taskService.addTask(name, datetime, callback, timezone, onComplete);

      expect(CronJob).toHaveBeenCalledWith(
        datetime,
        callback,
        onComplete,
        true,
        timezone,
      );
      expect(schedulerRegistryMock.addCronJob).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeTask', () => {
    it('should remove a task', () => {
      const name = 'test-task';

      taskService.removeTask(name);

      expect(schedulerRegistryMock.deleteCronJob).toHaveBeenCalledWith(name);
      expect(schedulerRegistryMock.deleteCronJob).toHaveBeenCalledTimes(1);
    });
  });
});
