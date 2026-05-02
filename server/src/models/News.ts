import mongoose from 'mongoose';

const NewsArchiveSchema = new mongoose.Schema({
  article_id: { type: String, required: true },
  source: { type: String, required: true },
  source_label: { type: String, required: true },
  source_color: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  content: String,
  url: { type: String, unique: true, required: true },
  image_url: String,
  author: String,
  author_avatar: String,
  tags: [String],
  read_time: String,
  score: { type: Number, default: 0 },
  comments_count: { type: Number, default: 0 },
  published_at: { type: Date, required: true },
  first_fetched_at: { type: Date, default: Date.now },
  last_updated_at: { type: Date, default: Date.now },
  archive_category: { type: String, enum: ['live', 'recent', 'weekly', 'deep_archive'], default: 'live' },
  is_breaking: { type: Boolean, default: false },
  breaking_keyword: String,
  fetch_count: { type: Number, default: 1 },
}, { timestamps: true });

NewsArchiveSchema.index({ url: 1 }, { unique: true });
NewsArchiveSchema.index({ published_at: -1 });
NewsArchiveSchema.index({ source: 1 });
NewsArchiveSchema.index({ archive_category: 1 });
NewsArchiveSchema.index({ title: 'text', description: 'text' });
NewsArchiveSchema.index({ tags: 1 });

const NewsRefreshLogSchema = new mongoose.Schema({
  refreshed_at: { type: Date, default: Date.now },
  new_count: Number,
  updated_count: Number,
  sources_used: [String],
  duration_ms: Number,
  status: { type: String, enum: ['success', 'partial', 'failed'] }
});

export const NewsArchive = mongoose.model('NewsArchive', NewsArchiveSchema);
export const NewsRefreshLog = mongoose.model('NewsRefreshLog', NewsRefreshLogSchema);
