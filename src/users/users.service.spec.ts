/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  // Objeto global para ser usado nos testes
  // Objeto global para ser usado nos testes
  const team = {
    id: 1,
    name: 'Team A',
    logo: 'logo.png',
    createdAt: new Date(),
  };

  const user: User = {
    id: 1,
    name: 'User A',
    authUserId: 'b5298cda-4a9d-4b94-90d1-5c129f5e99a2',
    profilePhoto: 'http://example.com/photo.jpg',
    email: 'user@email.com',
    favoriteTeam: team,
    isAthlete: true,
    username: 'user.a',
    birthDate: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto = {
        name: 'User A',
        authUserId: 'b5298cda-4a9d-4b94-90d1-5c129f5e99a2',
        email: 'user@email.com',
        profilePhoto: 'http://example.com/photo.jpg',
        favoriteTeamId: 1,
        isAthlete: true,
        birthDate: new Date(),
      };

      // Mocks para findOne retornando null (não existe email nem authUserId)
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null); // Para email
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null); // Para authUserId

      jest.spyOn(userRepository, 'create').mockReturnValue(user);
      jest.spyOn(userRepository, 'save').mockResolvedValue(user);

      const result = await service.create(createUserDto);

      expect(result).toBe(user);
      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });
  });

  it('should throw ConflictException if email already exists', async () => {
    const createUserDto = {
      name: 'User B',
      authUserId: 'auth-id-2',
      email: 'existing@email.com',
      profilePhoto: '',
      favoriteTeamId: 1,
      isAthlete: false,
      birthDate: new Date(),
    };

    jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user); // Retorna user na primeira busca (email)

    await expect(service.create(createUserDto)).rejects.toThrow(
      ConflictException,
    );
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { email: createUserDto.email },
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users: User[] = [user, user];

      jest.spyOn(userRepository, 'find').mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toBe(users);
      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['favoriteTeam'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      const result = await service.findOne(user.id);

      expect(result).toBe(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
        relations: ['favoriteTeam'],
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(user.id)).rejects.toThrow(
        new NotFoundException(`User with ID ${user.id} not found`),
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto = { name: 'Updated User A' };

      jest.spyOn(service, 'findOne').mockResolvedValue(user);
      jest.spyOn(userRepository, 'save').mockResolvedValue({
        ...user,
        ...updateUserDto,
      });

      const result = await service.update(user.id, updateUserDto);

      expect(result).toEqual({ ...user, ...updateUserDto });
      expect(service.findOne).toHaveBeenCalledWith(user.id);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        ...updateUserDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(user);
      jest.spyOn(userRepository, 'remove').mockResolvedValue(user);

      await service.remove(user.id);

      expect(service.findOne).toHaveBeenCalledWith(user.id);
      expect(userRepository.remove).toHaveBeenCalledWith(user);
    });
  });
});
