// scripts/mongo-init.js
// Runs once when MongoDB container is first created

db = db.getSiblingDB('codescan');

db.createCollection('reviews');

db.reviews.createIndex({ createdAt: -1 });
db.reviews.createIndex({ score: 1 });
db.reviews.createIndex({ language: 1 });
db.reviews.createIndex({ has_error: 1 });

print('✅ codescan database initialized with indexes');
