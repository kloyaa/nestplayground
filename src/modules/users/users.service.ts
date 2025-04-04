import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '@app/shared/dto/request/create-user.dto';
import { UserResponseDto } from '@app/shared/dto/response/user-response.dto';
import { User } from '@app/database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<UserResponseDto | any> {
    const { username, email, password } = createUserDto;

    // Check if username or email already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      salt,
    });

    await this.userRepository.save(user);

    // This is the correct response format based on the pact generated contract
    const { password: _, salt: __, ...userResponse } = user;
    return userResponse;

    // BREAKING CHANGE: This should return error becasue the defined contract does not match the body
    // const { password: _, salt: __, ...userDetails } = user;
    // return {
    //   userId: userDetails.id, // Changed from 'id' to 'userId'
    //   userName: userDetails.username, // Changed from 'username' to 'userName'
    //   email: userDetails.email,
    //   createdOn: userDetails.createdAt, // Changed from 'createdAt' to 'createdOn'
    //   updatedOn: userDetails.updatedAt, // Changed from 'updatedAt' to 'updatedOn'
    // };
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Return user without password and salt
    const { password, salt, ...userResponse } = user;
    return userResponse;
  }

  async getUserByUsername(username: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }

    // Return user without password and salt
    const { password, salt, ...userResponse } = user;
    return userResponse;
  }
}
