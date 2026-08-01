import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    file: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
      },
      fileName: {
        type: String,
        required: true,
      },
      fileType: {
        type: String,
      },
      size: {
        type: Number,
      },
    },
    sentTo: {
      type: String,
      enum: ['Admin', 'Teacher', 'Student', 'All'],
      default: 'All',
      required: true,
    },
    targetGrade: {
      type: String,
      default: null,
    },
    targetSection: {
      type: String,
      enum: ['A', 'B', 'C', 'D'],
      default: null,
    },
    generatedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      role: {
        type: String,
        enum: ['Admin', 'Teacher', 'System'],
        required: true,
      },
      name: {
        type: String,
      },
    },
    filtersUsed: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Completed',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Report', reportSchema);