/**
 * @file Unit tests for auth.service.js
 * @author
 * @description Tests for authentication service logic (hashPassword, comparePassword, checkMobile, verify)
 */

import authService from '../../../src/api/v1/auth/auth.service.js';
import bcrypt from 'bcrypt';
import prisma from '../../../src/services/prisma.service.js';
import jwtService from '../../../src/services/jwt.service.js';

jest.mock('bcrypt');
jest.mock('../../../src/services/prisma.service.js', () => ({
  __esModule: true,
  default: {
    entity: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    otp: {
      findFirst: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
  },
}));
jest.mock('../../../src/services/jwt.service.js');

describe('auth.service', () => {
  describe('hashPassword', () => {
    it('should hash the password using bcrypt', async () => {
      const password = 'mySecret123';
      const hashed = 'hashedPassword';
      bcrypt.hash.mockResolvedValue(hashed);

      const result = await authService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashed);
    });
  });

  describe('comparePassword', () => {
    it('should return true if passwords match', async () => {
      bcrypt.compare.mockResolvedValue(true);
      const result = await authService.comparePassword('plain', 'hashed');
      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed');
      expect(result).toBe(true);
    });

    it('should return false if passwords do not match', async () => {
      bcrypt.compare.mockResolvedValue(false);
      const result = await authService.comparePassword('plain', 'hashed');
      expect(result).toBe(false);
    });
  });

  describe('checkMobile', () => {
    let generateAndSaveOtpSpy;

    beforeEach(() => {
      // Spy on the actual generateAndSaveOtp function and mock its implementation
      generateAndSaveOtpSpy = jest.spyOn(authService, 'generateAndSaveOtp').mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.clearAllMocks();
      generateAndSaveOtpSpy.mockRestore(); // Restore the original function after each test
    });

    it('should send OTP and return has_password: false, otp_sent: true if user does not exist', async () => {
      prisma.entity.findUnique.mockResolvedValue(null);

      const result = await authService.checkMobile('09120000000');
      expect(prisma.entity.findUnique).toHaveBeenCalledWith({ where: { mobile: '09120000000' } });
      expect(generateAndSaveOtpSpy).toHaveBeenCalledWith('09120000000');
      expect(result).toEqual({ has_password: false, otp_sent: true });
    });

    it('should send OTP and return has_password: false, otp_sent: true if user exists but has no password', async () => {
      prisma.entity.findUnique.mockResolvedValue({ mobile: '09120000000', password: null });

      const result = await authService.checkMobile('09120000000');
      expect(generateAndSaveOtpSpy).toHaveBeenCalledWith('09120000000');
      expect(result).toEqual({ has_password: false, otp_sent: true });
    });

    it('should send OTP and return has_password: true, otp_sent: true if force_otp is true', async () => {
      prisma.entity.findUnique.mockResolvedValue({ mobile: '09120000000', password: 'hashed' });

      const result = await authService.checkMobile('09120000000', true);
      expect(generateAndSaveOtpSpy).toHaveBeenCalledWith('09120000000');
      expect(result).toEqual({ has_password: true, otp_sent: true });
    });

    it('should not send OTP and return has_password: true, otp_sent: false if user exists and has password', async () => {
      prisma.entity.findUnique.mockResolvedValue({ mobile: '09120000000', password: 'hashed' });

      const result = await authService.checkMobile('09120000000');
      expect(generateAndSaveOtpSpy).not.toHaveBeenCalled();
      expect(result).toEqual({ has_password: true, otp_sent: false });
    });
  });

  describe('verify', () => {

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should login with valid password', async () => {
      const user = { id: 1, mobile: '09120000000', password: 'hashed' };
      prisma.entity.findUnique.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwtService.generateToken.mockReturnValue('jwt-token');

      const result = await authService.verify('09120000000', 'plainPassword', undefined);

      expect(prisma.entity.findUnique).toHaveBeenCalledWith({ where: { mobile: '09120000000' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('plainPassword', 'hashed');
      expect(jwtService.generateToken).toHaveBeenCalledWith({ id: 1, mobile: '09120000000' });
      expect(result).toEqual({ token: 'jwt-token', user });
    });

    it('should throw error if password is invalid', async () => {
      const user = { id: 1, mobile: '09120000000', password: 'hashed' };
      prisma.entity.findUnique.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.verify('09120000000', 'wrongPassword', undefined))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user not found for password login', async () => {
      prisma.entity.findUnique.mockResolvedValue(null);

      await expect(authService.verify('09120000000', 'plainPassword', undefined))
        .rejects.toThrow('Invalid credentials');
    });

    it('should login with valid OTP and existing user', async () => {
      const otp = { id: 10, mobile: '09120000000', code: '123456', expires_at: new Date(Date.now() + 60000) };
      const user = { id: 2, mobile: '09120000000' };
      prisma.otp.findFirst.mockResolvedValue(otp);
      prisma.otp.delete.mockResolvedValue();
      prisma.entity.findUnique.mockResolvedValue(user);
      jwtService.generateToken.mockReturnValue('jwt-token');

      const result = await authService.verify('09120000000', undefined, '123456');

      expect(prisma.otp.findFirst).toHaveBeenCalledWith({
        where: {
          mobile: '09120000000',
          code: '123456',
          expires_at: { gt: expect.any(Date) }
        }
      });
      expect(prisma.otp.delete).toHaveBeenCalledWith({ where: { id: otp.id } });
      expect(prisma.entity.findUnique).toHaveBeenCalledWith({ where: { mobile: '09120000000' } });
      expect(jwtService.generateToken).toHaveBeenCalledWith({ id: 2, mobile: '09120000000' });
      expect(result).toEqual({ token: 'jwt-token', user });
    });

    it('should register new user with valid OTP if user does not exist', async () => {
      const otp = { id: 11, mobile: '09120000001', code: '654321', expires_at: new Date(Date.now() + 60000) };
      const user = { id: 3, mobile: '09120000001' };
      prisma.otp.findFirst.mockResolvedValue(otp);
      prisma.otp.delete.mockResolvedValue();
      prisma.entity.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      prisma.entity.create.mockResolvedValue(user);
      jwtService.generateToken.mockReturnValue('jwt-token');

      const result = await authService.verify('09120000001', undefined, '654321');

      expect(prisma.otp.findFirst).toHaveBeenCalled();
      expect(prisma.otp.delete).toHaveBeenCalledWith({ where: { id: otp.id } });
      expect(prisma.entity.create).toHaveBeenCalledWith({ data: { mobile: '09120000001' } });
      expect(jwtService.generateToken).toHaveBeenCalledWith({ id: 3, mobile: '09120000001' });
      expect(result).toEqual({ token: 'jwt-token', user });
    });

    it('should throw error if OTP is invalid or expired', async () => {
      prisma.otp.findFirst.mockResolvedValue(null);

      await expect(authService.verify('09120000000', undefined, 'badcode'))
        .rejects.toThrow('Invalid or expired OTP');
    });

    it('should throw error if neither password nor OTP is provided', async () => {
      await expect(authService.verify('09120000000', undefined, undefined))
        .rejects.toThrow('Either password or OTP code is required for verification.');
    });
  });
});
