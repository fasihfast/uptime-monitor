import { Iuser } from '../models/User';

// We're telling TypeScript: "Express's Request object
// can have an optional 'user' field of type IUser"
declare global {
  namespace Express {
    interface Request {
      user?: Iuser;
    }
  }
}