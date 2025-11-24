/* Seed five domain-specific admin users into MongoDB (CommonJS).
   Usage:
     node scripts/seed-admins.cjs
   Config:
     - Uses process.env.MONGODB_URI if set, else falls back to the same URI you use in server.js.
*/

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://achi:achi%40456@cluster0.gpd2z4o.mongodb.net/smart_waste_management?retryWrites=true&w=majority&appName=Cluster0';

const UserSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  username: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');

async function upsertUser(u) {
  const existing = await User.findOne({ email: u.email });
  if (existing) {
    console.log(`✔ Skipped (exists): ${u.email} (${existing.role})`);
    return existing;
  }
  const user = new User(u);
  await user.save();
  console.log(`✓ Created: ${u.email} (${u.role})`);
  return user;
}

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const admins = [
    { firstName: 'User',      lastName: 'Admin', username: 'user_admin',      email: 'useradmin@wastewise.com',      password: 'Admin#User123',      role: 'user_admin' },
    { firstName: 'Transport', lastName: 'Admin', username: 'transport_admin', email: 'transportadmin@wastewise.com', password: 'Admin#Transport123', role: 'transport_admin' },
    { firstName: 'Feedback',  lastName: 'Admin', username: 'feedback_admin',  email: 'feedbackadmin@wastewise.com',  password: 'Admin#Feedback123',  role: 'feedback_admin' },
    { firstName: 'Event',     lastName: 'Admin', username: 'event_admin',     email: 'eventadmin@wastewise.com',     password: 'Admin#Event123',     role: 'event_admin' },
    { firstName: 'Financial', lastName: 'Admin', username: 'financial_admin', email: 'financialadmin@wastewise.com', password: 'Admin#Financial123', role: 'financial_admin' }
  ];

  for (const a of admins) {
    await upsertUser(a);
  }

  console.log('\nLogin credentials:');
  admins.forEach(a => console.log(`- ${a.email} / ${a.password} (${a.role})`));

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});


