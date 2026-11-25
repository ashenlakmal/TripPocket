import mongoose from 'mongoose';

const { Schema } = mongoose;

const tripSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Trip name is required.'],
      trim: true,
      maxlength: [120, 'Trip name cannot exceed 120 characters.'],
    },
    destination: {
      type: String,
      required: [true, 'Destination is required.'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required.'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required.'],
      validate: {
        validator: function (value) {
          if (!this.startDate) return true;
          return value >= this.startDate;
        },
        message: 'End date must be on or after the start date.',
      },
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required.'],
      min: [1, 'Budget must be greater than zero.'],
    },
  },
  { timestamps: true },
);

export default mongoose.models.Trip || mongoose.model('Trip', tripSchema);
