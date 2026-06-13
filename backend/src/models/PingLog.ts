import mongoose , {Document,Schema} from "mongoose"

export interface IpingLog extends Document {
  siteId: mongoose.Types.ObjectId;
  isUp: boolean;
  statusCode: number;
  responseTime: number;         // in milliseconds
  checkedAt: Date;
}


const pingLogSchema = new Schema<IpingLog>({
    siteId: {
    type: Schema.Types.ObjectId,
    ref: 'Site',
    required: true,
    index: true,                // we query by siteId often, so index it for speed
  },
  isUp: {
    type: Boolean,
    required: true,
  },
  statusCode: {
    type: Number,
    default: 0,                 // 0 means no response (timeout/refused)
  },
  responseTime: {
    type: Number,               // milliseconds e.g. 243
    required: true,
  },
  checkedAt: {
    type: Date,
    default: Date.now,
    index:true,
  },
});

export const PingLog = mongoose.model<IpingLog>('PingLog', pingLogSchema);