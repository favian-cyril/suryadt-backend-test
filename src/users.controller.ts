import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';
import { UserService } from './users.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @Post()
  public async insertUser(
    @Body()
    body: CreateUserDto,
  ) {
    const { firstName, lastName, birthdate, location, email } = body;
    await this.userService.addUser(
      firstName,
      lastName,
      birthdate,
      location,
      email,
    );
  }
  @Delete(':id')
  public async deleteUser(@Param() id: string) {
    await this.userService.deleteUser(id);
  }
}
