import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusconnect';

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String },
    phone: { type: String },
    designation: { type: String },
    school: { type: String },
    photoUrl: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function listUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        const users = await User.find({});
        let output = `Found ${users.length} users:\n`;
        users.forEach(u => {
            output += `- Name: ${u.name}, Email: ${u.email}, Role: ${u.designation}, School: ${u.school}\n`;
        });
        fs.writeFileSync(path.join(__dirname, '..', 'users.txt'), output);
        console.log('Done');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

listUsers();
