import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class TaskService {
  constructor(private scheduler: SchedulerRegistry) {}

  addTask(
    name: string,
    datetime: Date,
    callback: () => Promise<void>,
    timezone: string,
    onComplete?: () => Promise<void>,
  ) {
    const job = new CronJob(datetime, callback, onComplete, true, timezone);
    this.scheduler.addCronJob(name, job);
    job.start();
    console.log(`Task ${name} started`);
  }

  removeTask(name: string) {
    this.scheduler.deleteCronJob(name);
  }
}
