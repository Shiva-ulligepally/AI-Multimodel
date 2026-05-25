import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const summarySchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UploadedFile',
    default: null,
  },
  summaryText: {
    type: String,
    required: true,
  },
  keyPoints: {
    type: [String],
    default: [],
  },
  flashcards: [flashcardSchema],
  meetingNotes: {
    type: String,
    default: '',
  },
  highlights: {
    type: [String],
    default: [],
  },
  recommendations: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Summary = mongoose.model('Summary', summarySchema);
export default Summary;
