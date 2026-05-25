import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema({
  start: {
    type: Number,
    required: true,
  },
  end: {
    type: Number,
    required: true,
  },
  speaker: {
    type: String,
    default: 'Speaker 1',
  },
  text: {
    type: String,
    required: true,
  }
});

const transcriptSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UploadedFile',
    default: null,
  },
  sessionType: {
    type: String,
    enum: ['upload', 'archive'],
    required: true,
  },
  rawText: {
    type: String,
    required: true,
  },
  segments: [segmentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Transcript = mongoose.model('Transcript', transcriptSchema);
export default Transcript;
