import mongoose from 'mongoose';

const { Schema } = mongoose;

const expenseSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip is required.'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required.'],
      trim: true,
      maxlength: [120, 'Expense title cannot exceed 120 characters.'],
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      enum: {
        values: ['Food', 'Transport', 'Accommodation', 'Activities', 'Other'],
        message: '{VALUE} is not a valid category.',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required.'],
      min: [0.01, 'Amount must be greater than zero.'],
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required.'],
      default: Date.now,
    },
  },
  { timestamps: true },
);

expenseSchema.index({ tripId: 1, date: -1 });

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
