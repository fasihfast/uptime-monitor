import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router= Router();


// Helper: generate a signed JWT token for a user
// We encode the userId inside the token — this is how we identify
// who is making a request without hitting the DB on every call
const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }   // token expires in 7 days
  );
};

router.post("/register",async(req:Request,res:Response):Promise<void> =>{
    try{
    
    const {  name, email, password } = req.body;

          // Check if all fields were provided
    if (!name || !email || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

 // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

     // Create the user — the pre-save hook in User.ts hashes the password
    const user = await User.create({ name, email, password });

    res.status(201).json({
      message: 'Account created successfully',
      token: generateToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });


    }catch(error){
        console.error("Register error: ",error);
        res.status(500).json({ message: 'Server error during registration' });

    }
});

router.post('/login' , async(req:Request,res:Response): Promise<void> =>{
try{

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Use a vague message — don't reveal whether email exists or not
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Compare entered password with the hashed one in DB
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    res.json({
      message: 'Login successful',
      token: generateToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });


}catch(error){
        console.error("Login error: ",error);
        res.status(500).json({ message: 'Server error during Login' });
}
});


export default router;