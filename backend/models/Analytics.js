import mongoose from 'mongoose';

const keywordSchema = new mongoose.Schema({
  word: { type: String, required: true },
  count: { type: Number, required: true }
});

const sentimentSchema = new mongoose.Schema({
  label: { type: String, enum: ['Positive', 'Neutral', 'Negative'], required: true },
  score: { type: Number, min: 0, max: 1, default: 0.5 },
  breakdown: {
    positive: { type: Number, default: 0.33 },
    neutral: { type: Number, default: 0.34 },
    negative: { type: Number, default: 0.33 }
  }
});

const analyticsSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UploadedFile',
    default: null,
  },
  topics: {
    type: [String],
    default: [],
  },
  keywords: [keywordSchema],
  sentiment: {
    type: sentimentSchema,
    required: true,
  },
  wordCount: {
    type: Number,
    default: 0,
  },
  extraStats: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;
