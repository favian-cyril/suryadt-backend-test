import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { SchedulerRegistry } from '@nestjs/schedule';
import { DoneCallback, Job } from 'bull';

@Processor('email')
export class EmailConsumer {
  private BASE_URL_EMAIL =
    'https://email-service.digitalenvision.com.au/send-email';
  constructor(private scheduler: SchedulerRegistry) {}

  @Process('sendBirthdayEmail')
  async sendBirthdayEmail(job: Job<unknown>, done: DoneCallback) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { email, message, taskId } = job.data;
    console.log('Job starting');
    try {
      const res = await fetch(this.BASE_URL_EMAIL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          message,
        }),
      });
      if (res.status === 200) {
        const data = await res.json();
        const task = this.scheduler.getCronJob(taskId);
        task.stop();
        done(null, data);
      } else {
        throw new Error('API returns error');
      }
    } catch (err) {
      done(new Error('API returns an error'));
    }
  }
  @OnQueueFailed()
  onError(job: Job, error: any) {
    console.log(`Job ${job.id} errored with error: ${error.message}`);
  }
  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    console.log(
      `Job ${job.id} completed with result: ${JSON.stringify(result)}`,
    );
  }
  @OnQueueActive()
  onProgress(job: Job) {
    console.log(`Job ${job.id} is running`);
  }
}
