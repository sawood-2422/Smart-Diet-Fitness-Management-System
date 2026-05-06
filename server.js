require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');

// Import models
const User = require('./models/User');
const Body = require('./models/Body');
const Diet = require('./models/Diet');
const Workout = require('./models/Workout');
const Wellness = require('./models/Wellness');
const Contact = require('./models/Contact');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/diet-system';

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ok: true});
});

// -------------------- AUTH --------------------

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, gender, country } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'A user with that email already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = new User({ username, email: email.toLowerCase(), passwordHash, gender, country });
    await user.save();

    res.json({ user: { id: user._id, username: user.username, email: user.email, gender: user.gender, country: user.country } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'No user found with that email' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------- USER --------------------

app.get('/api/user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ 
      username: user.username, 
      email: user.email,
      gender: user.gender,
      country: user.country 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/:email', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Missing username' });
    const user = await User.findOneAndUpdate(
      { email: req.params.email.toLowerCase() },
      { username },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- BODY --------------------
app.post('/api/body', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    const today = new Date();
    today.setHours(0,0,0,0);
    const filter = { email, date: { $gte: today, $lt: new Date(today.getTime() + 86400000) } };
    const update = { ...req.body, date: today };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const body = await Body.findOneAndUpdate(filter, update, options);
    res.json(body);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/body/:email', async (req, res) => {
  try {
    const body = await Body.findOne({ email: req.params.email }).sort({ date: -1 });
    if (!body) return res.status(404).json({ error: 'No body data found' });
    res.json(body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- DIET --------------------
app.post('/api/diet', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    const today = new Date();
    today.setHours(0,0,0,0);
    const filter = { email, date: { $gte: today, $lt: new Date(today.getTime() + 86400000) } };
    const update = { ...req.body, date: today };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const diet = await Diet.findOneAndUpdate(filter, update, options);
    res.json(diet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/diet/:email', async (req, res) => {
  try {
    const diet = await Diet.findOne({ email: req.params.email }).sort({ date: -1 });
    if (!diet) return res.status(404).json({ error: 'No diet data found' });
    res.json(diet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/diet/:email/history', async (req, res) => {
  try {
    const diets = await Diet.find({ email: req.params.email }).sort({ date: -1 }).limit(7);
    res.json(diets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



//  Save workout
app.post('/api/workouts', async (req, res) => {
  try {
    const { email, exercises, totalDuration, caloriesBurned } = req.body;

    if (!email || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: 'Email and at least one exercise required' });
    }

    const workout = new Workout({
      email,
      exercises,
      totalDuration: Number(totalDuration) || 0,
      caloriesBurned: Number(caloriesBurned) || 0,
    });

    await workout.save();
    console.log(' Workout saved for:', email);

    res.json({ message: 'Workout saved successfully', data: workout });
  } catch (err) {
    console.error(' Workout Save Error:', err);
    res.status(500).json({ error: 'Failed to save workout' });
  }
});

// ✅ Get all workouts for a user
app.get('/api/workouts/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const workouts = await Workout.find({ email }).sort({ date: -1 });
    res.json(workouts);
  } catch (err) {
    console.error(' Error fetching workouts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove a single exercise from a workout
app.delete('/api/workouts/:workoutId/exercises/:exerciseId', async (req, res) => {
  try {
    const { workoutId, exerciseId } = req.params;
    if (!workoutId || !exerciseId) return res.status(400).json({ error: 'Missing ids' });

    const updated = await Workout.findByIdAndUpdate(
      workoutId,
      { $pull: { exercises: { _id: exerciseId } } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Workout not found' });

    res.json({ message: 'Exercise removed', data: updated });
  } catch (err) {
    console.error(' Error removing exercise:', err);
    res.status(500).json({ error: 'Failed to remove exercise' });
  }
});

// -------------------- CONTACT --------------------
// Save contact form submission. If RECAPTCHA_SECRET is set in env, the server will
// verify the recaptcha token before saving.
app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone, email, subject, comments, recaptchaToken } = req.body;
    if (!name || !phone || !comments) return res.status(400).json({ error: 'Missing required fields' });

    // Optional recaptcha verification
    if (process.env.RECAPTCHA_SECRET) {
      if (!recaptchaToken) return res.status(400).json({ error: 'Recaptcha token missing' });
      const verified = await (async function verify(token, remoteip) {
        return new Promise((resolve) => {
          try {
            const https = require('https');
            const postData = `secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET)}&response=${encodeURIComponent(token)}${remoteip ? '&remoteip=' + encodeURIComponent(remoteip) : ''}`;
            const options = {
              hostname: 'www.google.com',
              path: '/recaptcha/api/siteverify',
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
            };
            const r = https.request(options, resp => {
              let body = '';
              resp.on('data', c => body += c);
              resp.on('end', () => {
                try { const json = JSON.parse(body); resolve(Boolean(json.success)); } catch (e) { resolve(false); }
              });
            });
            r.on('error', () => resolve(false));
            r.write(postData);
            r.end();
          } catch (e) { resolve(false); }
        });
      })(recaptchaToken, req.ip);

      if (!verified) return res.status(400).json({ error: 'Recaptcha verification failed' });
    }

    const contact = new Contact({ name, phone, email, subject, comments });
    await contact.save();
    console.log(' Contact saved:', contact._id, contact.email || contact.phone);
    res.json({ message: 'Contact saved', data: contact });
  } catch (err) {
    console.error(' Contact Save Error:', err);
    res.status(500).json({ error: 'Failed to save contact' });
  }
});



// -------------------- WELLNESS --------------------
app.post('/api/wellness', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    const today = new Date();
    today.setHours(0,0,0,0);
    const filter = { email, date: { $gte: today, $lt: new Date(today.getTime() + 86400000) } };
    const update = { ...req.body, date: today };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const wellness = await Wellness.findOneAndUpdate(filter, update, options);
    res.json(wellness);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/wellness/:email', async (req, res) => {
  try {
    const wellness = await Wellness.findOne({ email: req.params.email }).sort({ date: -1 });
    if (!wellness) return res.status(404).json({ error: 'No wellness data found' });
    res.json(wellness);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/wellness/:email/history', async (req, res) => {
  try {
    const wellnessHistory = await Wellness.find({ email: req.params.email }).sort({ date: -1 }).limit(7);
    res.json(wellnessHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- DELETE --------------------
app.delete('/api/diet/:id', async (req, res) => {
  try {
    const doc = await Diet.findByIdAndDelete(req.params.id);
    if(!doc) return res.status(404).json({ error: 'Diet entry not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/workout/:id', async (req, res) => {
  try {
    const doc = await Workout.findByIdAndDelete(req.params.id);
    if(!doc) return res.status(404).json({ error: 'Workout entry not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/wellness/:id', async (req, res) => {
  try {
    const doc = await Wellness.findByIdAndDelete(req.params.id);
    if(!doc) return res.status(404).json({ error: 'Wellness entry not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- DASHBOARD --------------------
app.get('/api/dashboard/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today.getTime() + 86400000);

    const [bodyToday, bodyLatest, latestDiet, dietHistory, latestWorkout, workoutHistory, latestWellness, wellnessHistory] = await Promise.all([
      Body.findOne({ email, date: { $gte: today, $lt: tomorrow } }),
      Body.findOne({ email }).sort({ date: -1 }),
      Diet.findOne({ email, date: { $gte: today, $lt: tomorrow } }),
      Diet.find({ email }).sort({ date: -1 }).limit(7),
      Workout.findOne({ email, date: { $gte: today, $lt: tomorrow } }),
      Workout.find({ email }).sort({ date: -1 }).limit(7),
      Wellness.findOne({ email, date: { $gte: today, $lt: tomorrow } }),
      Wellness.find({ email }).sort({ date: -1 }).limit(7)
    ]);

    res.json({
      body: bodyToday || bodyLatest || null,
      diet: {
        latest: latestDiet || null,
        history: dietHistory || []
      },
      workout: {
        latest: latestWorkout || null,
        history: workoutHistory || []
      },
      wellness: {
        latest: latestWellness || null,
        history: wellnessHistory || []
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- STATIC --------------------
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);

  // Optional self-test: when RUN_SELF_TEST=1 is set, post a sample workout to the server
  // Useful for quickly verifying the POST /api/workouts route without running a separate node process.
  if (process.env.RUN_SELF_TEST === '1') {
    try {
      const http = require('http');
      const postData = JSON.stringify({
        email: 'selftest@example.com',
        exercises: [{ name: 'Auto Test', sets: 1, reps: 5, weight: 0, duration: 10 }],
        totalDuration: 10,
        caloriesBurned: 50
      });

      const opts = {
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/workouts',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(opts, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => console.log('[self-test] response', res.statusCode, body));
      });
      req.on('error', err => console.error('[self-test] error', err));
      req.write(postData);
      req.end();
    } catch (err) {
      console.error('[self-test] failed to run', err);
    }
  }
});
