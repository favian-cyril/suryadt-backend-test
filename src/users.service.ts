import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Task } from '@prisma/client';
import { Queue } from 'bull';
import * as moment from 'moment-timezone';
import { PrismaService } from './prisma.service';
import { TaskService } from './task.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private task: TaskService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async onModuleInit() {
    const users = await this.prisma.user.findMany({
      where: {
        tasks: {
          some: {
            isDone: false,
          },
        },
      },
      include: {
        tasks: true,
      },
    });
    users.forEach((user) => {
      const { id, firstName, lastName, birthdate, location, email } = user;
      user.tasks.forEach((task) => {
        this.createBirthdayReminderTask(
          id,
          birthdate,
          location,
          email,
          firstName,
          lastName,
          task.id,
          false,
        );
      });
    });
  }

  async addUser(
    firstName: string,
    lastName: string,
    birthdate: string,
    location: string,
    email: string,
  ): Promise<void> {
    const date = new Date(birthdate);
    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        birthdate: date,
        location,
        email,
      },
    });
    await this.createBirthdayReminderTask(
      user.id,
      date,
      location,
      email,
      firstName,
      lastName,
    );
  }

  async sendBirthdayEmail(email: string, name: string, taskId: string) {
    const message = `Hey, ${name} it's ur birthday`;
    await this.emailQueue.add('sendBirthdayEmail', {
      email,
      message,
      taskId,
    });
  }

  async updateTask(id: string) {
    await this.prisma.task.update({
      where: {
        id,
      },
      data: {
        isDone: true,
      },
    });
  }

  async createBirthdayReminderTask(
    userId: string,
    birthdate: Date,
    timezone: string,
    email: string,
    firstName: string,
    lastName: string,
    taskId?: string,
    writeTask = true,
  ) {
    const name = `${userId}-birthday`;
    const fullName = firstName + ' ' + lastName;
    const now = moment().utc();
    const nextBirthday = moment(birthdate, timezone)
      .startOf('day')
      .set('year', now.get('year'))
      .isAfter(now)
      ? moment(birthdate, timezone)
          .set('year', now.get('year'))
          .set('hour', 9)
          .set('minute', 0)
          .set('second', 0)
      : moment(birthdate, timezone)
          .set('year', now.get('year') + 1)
          .set('hour', 9)
          .set('minute', 0)
          .set('second', 0);
    let task: Task;
    if (writeTask) {
      task = await this.prisma.task.create({
        data: {
          plannedDate: nextBirthday.toDate(),
          name,
          timezone,
          type: 'BIRTHDAY',
          userId,
        },
      });
    }
    this.task.addTask(
      name,
      nextBirthday.toDate(),
      () => this.sendBirthdayEmail(email, fullName, name),
      timezone,
      async () => {
        await this.updateTask(taskId || task.id);
        await this.createBirthdayReminderTask(
          userId,
          birthdate,
          timezone,
          email,
          firstName,
          lastName,
        );
      },
    );
  }

  async deleteUser(id: string): Promise<void> {
    const activeTasks = await this.prisma.task.findMany({
      where: {
        userId: id,
        isDone: false,
      },
    });
    activeTasks.forEach((task) => {
      this.task.removeTask(task.name);
    });
    await this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
}
