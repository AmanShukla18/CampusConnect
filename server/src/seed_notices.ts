import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusconnect';

const NoticeSchema = new mongoose.Schema(
    {
        title: String,
        department: String,
        year: String,
        type: String,
        content: String,
        attachmentUrl: String,
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

const Notice = mongoose.model('Notice', NoticeSchema);

const notices = [
    {
        title: 'Campus Placement Drive: Infosys',
        department: 'CSE',
        year: '4th Year',
        type: 'Placement',
        content: 'Infosys will be conducting an on-campus recruitment drive for final year CSE students on Nov 30th. Eligibility: 7.5 CGPA and above. Register by tomorrow.',
        createdAt: new Date(),
    },
    {
        title: 'Cyber Security Workshop',
        department: 'CSE',
        year: 'All',
        type: 'Event',
        content: 'The OWASP Student Chapter is organizing a hands-on workshop on "Ethical Hacking & Web Security" this Saturday at 10 AM in Lab 2. Open to all years.',
        createdAt: new Date(),
    },
    {
        title: 'Fee Payment Deadline Extended',
        department: 'All',
        year: 'All',
        type: 'General',
        content: 'The last date for payment of the even semester tuition fee has been extended to Dec 5th without late fee. Please pay via the student portal.',
        createdAt: new Date(),
    },
    {
        title: 'Revised Time Table: CSE 3rd Year',
        department: 'CSE',
        year: '3rd Year',
        type: 'Academic',
        content: 'The time table for CSE 3rd Year Section A has been revised effective immediately. The Compiler Design lecture is now scheduled for Tuesday 11 AM.',
        createdAt: new Date(),
    },
    {
        title: 'Library Book Return Due',
        department: 'All',
        year: 'All',
        type: 'General',
        content: 'All students are requested to return borrowed library books before the start of the winter break to avoid fines.',
        createdAt: new Date(),
    }
];

async function seedNotices() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        console.log('Seeding Notices...');
        await Notice.insertMany(notices);
        console.log(`Successfully added ${notices.length} notices.`);
    } catch (e) {
        console.error('Error seeding notices:', e);
    } finally {
        await mongoose.disconnect();
    }
}

seedNotices();
