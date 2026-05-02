import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusconnect';

// Schemas (copied from index.ts to ensure compatibility)
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

const ResourceSchema = new mongoose.Schema(
    {
        title: String,
        department: String,
        subject: String,
        year: String,
        tags: [String],
        url: String,
        popularity: { type: Number, default: 0 },
        school: String,
    },
    { timestamps: true }
);

const EventSchema = new mongoose.Schema(
    {
        title: String,
        date: String,
        location: String,
        organizer: String,
        description: String,
        imageUrl: String,
        timings: String,
        school: String,
        createdByEmail: String,
    },
    { timestamps: true }
);

const Notice = mongoose.model('Notice', NoticeSchema);
const Resource = mongoose.model('Resource', ResourceSchema);
const Event = mongoose.model('Event', EventSchema);

const CREATOR_EMAIL = 'testuser@gmail.com';
const SCHOOL = 'SOET'; // School of Engineering and Technology

const sampleNotices = [
    {
        title: 'Mid-Term Exam Schedule Released',
        department: 'CSE',
        year: '3rd Year',
        type: 'Exam',
        content: 'The mid-term examination schedule for the Fall 2025 semester has been released. Exams start from October 15th. Please check the notice board for the detailed timetable.',
        createdAt: new Date(),
    },
    {
        title: 'Holiday Announcement: Diwali Break',
        department: 'All',
        year: 'All',
        type: 'General',
        content: 'The university will remain closed from Nov 1st to Nov 5th on account of Diwali. Classes will resume on Nov 6th.',
        createdAt: new Date(),
    },
    {
        title: 'Guest Lecture on AI & ML',
        department: 'CSE',
        year: '4th Year',
        type: 'Event',
        content: 'A guest lecture by Dr. A. Sharma from Google DeepMind on "The Future of Generative AI" will be held in the Main Auditorium on Friday at 2 PM.',
        createdAt: new Date(),
    },
    {
        title: 'Lab Manual Submission Deadline',
        department: 'CSE',
        year: '2nd Year',
        type: 'Academic',
        content: 'All students are required to submit their DBMS Lab manuals by this Friday. Late submissions will be penalized.',
        createdAt: new Date(),
    }
];

const sampleResources = [
    {
        title: 'Data Structures & Algorithms Notes',
        department: 'CSE',
        subject: 'Data Structures',
        year: '2nd Year',
        tags: ['DSA', 'Notes', 'CSE'],
        url: 'https://www.geeksforgeeks.org/data-structures/', // Placeholder
        school: SCHOOL,
    },
    {
        title: 'Operating Systems: Galvin Textbook Summary',
        department: 'CSE',
        subject: 'Operating Systems',
        year: '3rd Year',
        tags: ['OS', 'Textbook', 'Summary'],
        url: 'https://www.os-book.com/OS10/slide-dir/', // Placeholder
        school: SCHOOL,
    },
    {
        title: 'Computer Networks Lab Manual',
        department: 'CSE',
        subject: 'Computer Networks',
        year: '3rd Year',
        tags: ['CN', 'Lab', 'Manual'],
        url: 'https://nptel.ac.in/courses/106105081', // Placeholder
        school: SCHOOL,
    },
    {
        title: 'Introduction to Python Programming',
        department: 'CSE',
        subject: 'Programming',
        year: '1st Year',
        tags: ['Python', 'Basics', 'Coding'],
        url: 'https://docs.python.org/3/tutorial/', // Placeholder
        school: SCHOOL,
    }
];

const sampleEvents = [
    {
        title: 'HackTheFuture 2025',
        date: new Date('2025-11-15').toISOString(),
        location: 'Innovation Hub, Block B',
        organizer: 'Coding Club',
        description: 'A 24-hour hackathon for building innovative solutions for smart cities. Prizes worth 50k!',
        timings: '10:00 AM onwards',
        school: SCHOOL,
        createdByEmail: CREATOR_EMAIL,
        imageUrl: 'https://images.unsplash.com/photo-1504384308090-c54be3855833?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Generic tech image
    },
    {
        title: 'Workshop: Cloud Computing with AWS',
        date: new Date('2025-11-20').toISOString(),
        location: 'Computer Lab 3',
        organizer: 'CSE Department',
        description: 'Hands-on workshop on deploying applications using AWS EC2 and S3. Bring your laptops.',
        timings: '2:00 PM - 5:00 PM',
        school: SCHOOL,
        createdByEmail: CREATOR_EMAIL,
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Cloud image
    },
    {
        title: 'Tech Quiz: CodeWars',
        date: new Date('2025-11-25').toISOString(),
        location: 'Seminar Hall',
        organizer: 'Tech Society',
        description: 'Test your coding knowledge in this rapid-fire quiz competition. Open to all years.',
        timings: '11:00 AM - 1:00 PM',
        school: SCHOOL,
        createdByEmail: CREATOR_EMAIL,
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Coding image
    }
];

async function seedData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Notices
        console.log('Seeding Notices...');
        await Notice.insertMany(sampleNotices);
        console.log(`Added ${sampleNotices.length} notices.`);

        // Resources
        console.log('Seeding Resources...');
        await Resource.insertMany(sampleResources);
        console.log(`Added ${sampleResources.length} resources.`);

        // Events
        console.log('Seeding Events...');
        await Event.insertMany(sampleEvents);
        console.log(`Added ${sampleEvents.length} events.`);

        console.log('Seeding complete!');
    } catch (e) {
        console.error('Error seeding data:', e);
    } finally {
        await mongoose.disconnect();
    }
}

seedData();
