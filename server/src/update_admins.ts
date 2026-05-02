/**
 * One-time admin designation migration script (Bug 8 fix)
 * Updates all existing admin users to have the correct designation
 * and department fields.
 *
 * Run once with:
 *   npx ts-node server/src/update_admins.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI!;

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  phone: { type: String },
  designation: { type: String },
  department: { type: String, default: '' },
  school: { type: String },
  photoUrl: { type: String },
  role: { type: String, default: 'student' },
  status: { type: String, default: 'approved' },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function updateAdminDesignations() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      { role: 'admin' },
      {
        $set: {
          designation: 'Global Admin / Administrator',
          department: 'Administration',
          status: 'approved',
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} admin record(s).`);
    console.log('Admin designations updated successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateAdminDesignations();
