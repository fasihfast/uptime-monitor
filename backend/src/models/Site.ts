import mongoose , {Document , Schema} from "mongoose"

export interface Isite extends Document {
  owner: mongoose.Types.ObjectId; // reference to the User who added this
  url: string;
  name: string;
  isUp: boolean;
  lastChecked: Date | null;
}


const siteSchema = new Schema<Isite>(
    
    {
    
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required:true
        },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
    },
    isUp: {
      type: Boolean,
      default: true,             // assume up until first ping proves otherwise
    },
    lastChecked: {
      type: Date,
      default: null,             // null means "never been checked yet"
    },

    },
    {
        timestamps:true,
    }
);

export const Site = mongoose.model<Isite>('Site', siteSchema);

