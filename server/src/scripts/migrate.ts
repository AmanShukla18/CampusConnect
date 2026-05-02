import mongoose from 'mongoose';

const SOURCE_URI = 'mongodb://127.0.0.1:27017/campusconnect';
const TARGET_URI = 'mongodb+srv://pranav3460om_db_user:uGHHtOYPO9blqa4w@campusconnect.j3xuslb.mongodb.net/campusconnect';

async function migrate() {
    console.log('Starting migration...');

    const srcClient = new mongoose.mongo.MongoClient(SOURCE_URI);
    const targetClient = new mongoose.mongo.MongoClient(TARGET_URI);

    try {
        await srcClient.connect();
        console.log('Connected to Source DB');

        await targetClient.connect();
        console.log('Connected to Target DB');

        const srcDb = srcClient.db();
        const targetDb = targetClient.db();

        const collections = await srcDb.listCollections().toArray();

        for (const colInfo of collections) {
            const colName = colInfo.name;
            if (colName === 'system.indexes') continue;

            console.log(`Migrating collection: ${colName}`);

            const docs = await srcDb.collection(colName).find().toArray();

            if (docs.length > 0) {
                try {
                    // Use ordered: false to continue inserting even if some docs fail (e.g. duplicates)
                    const result = await targetDb.collection(colName).insertMany(docs, { ordered: false });
                    console.log(`  -> Inserted ${result.insertedCount} documents into ${colName}`);
                } catch (e: any) {
                    if (e.code === 11000) {
                        console.log(`  -> Some documents were duplicates and skipped in ${colName}. Inserted: ${e.result?.insertedCount || 0}`);
                    } else {
                        console.error(`  -> Error inserting into ${colName}:`, e.message);
                    }
                }
            } else {
                console.log(`  -> Collection ${colName} is empty.`);
            }
        }

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await srcClient.close();
        await targetClient.close();
    }
}

migrate();
