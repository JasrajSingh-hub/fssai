import { User, IUser } from '../models/user.model';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AppError } from '../utils/appError';
import { generateToken } from '../utils/jwt';

export interface AuthResult {
  user: IUser;
  token: string;
}

export class AuthService {
  static async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await User.findOne({ phone: input.phone });
    if (existingUser) {
      throw AppError.conflict('An account with this phone number already exists.');
    }

    const user = await User.create({
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      password: input.password,
      role: input.role || 'VENDOR',
      businessName: input.businessName,
    });

    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
    });

    return { user, token };
  }

  static async login(input: LoginInput): Promise<AuthResult> {
    const user = await User.findOne({ phone: input.phone }).select('+password');

    if (!user) {
      throw AppError.unauthorized('Invalid phone number or password.');
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw AppError.unauthorized('Invalid phone number or password.');
    }

    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
    });

    return { user, token };
  }

  static async getMe(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User account not found.');
    }
    return user;
  }
}