import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Trip name is required.'],
      trim: true,
      maxlength: [100, 'Trip name must be 100 characters or fewer.'],
    },
    destination: {
      type: String,
      required: [true, 'Destination is required.'],
      trim: true,
      maxlength: [100, 'Destination must be 100 characters or fewer.'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required.'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required.'],
      validate: {
        validator(value) {
          return !this.startDate || !value || value >= this.startDate;
        },
        message: 'End date must be on or after the start date.',
      },
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required.'],
      min: [0.01, 'Budget must be a positive amount.'],
    },
  },
  { timestamps: true },
);

export default mongoose.model('Trip', tripSchema);
