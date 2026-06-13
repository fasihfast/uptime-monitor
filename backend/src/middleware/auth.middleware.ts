import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Iuser } from '../models/User';


export interface AuthRequest extends Request {
  user?: Iuser; // Or just 'user: Iuser' if you're sure it will be there
}

// How a JWT payload looks when we decode it
interface JwtPayload {
  userId: string;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Step 1: Check if Authorization header exists
  // It should look like: "Bearer eyJhbGciOiJIUzI1..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided, access denied' });
    return;
  }

  // Step 2: Extract the token part (everything after "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // Step 3: Verify the token using our secret key
    // If token is fake or expired, this throws an error → caught below
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // Step 4: Find the user in DB and attach to request
    // select('-password') means "give me everything EXCEPT the password field"
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(401).json({ message: 'User no longer exists' });
      return;
    }

    // Step 5: Attach user to req so route handlers can access it
    req.user = user;

    // Step 6: Call next() to proceed to the actual route handler
    next();

  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};