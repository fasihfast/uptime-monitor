import mongoose, {Document,Schema} from "mongoose"
import bcrypt from "bcryptjs"

export interface Iuser extends Document {
  name: string;
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<Iuser>(
    {
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    } ,

    email: {
        type: String,
        required:[true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password:{
        type:String,
        required:[true, "Password is required"],
        minlength:6,
    },    
},
{
    timestamps:true,
}
);

userSchema.pre('save', async function (this: any) {
  const user = this as Iuser;
  if (!user.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  } catch (err) {
    throw err; // In async hooks, throwing an error is same as next(err)
  }
});


userSchema.methods.comparePassword = async function(candidatePassword : string): Promise<boolean>{
 return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<Iuser>('User',userSchema);