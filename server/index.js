import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { connectDB, getDB } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

await connectDB();

const getFeedbackCollection = () => getDB().collection('feedback');
const getAdminSettingsCollection = () => getDB().collection('admin_settings');
const getPlacesCollection = () => getDB().collection('places');

// ─── PLACES ───

// Create a new place
app.post('/api/places', async (req, res) => {
  try {
    const { name, name_ar, address, address_ar, questionnaire_type } = req.body;
    if (!name) return res.status(400).json({ error: 'Place name is required' });

    const slug = crypto.randomBytes(6).toString('hex');
    const place = {
      name,
      name_ar: name_ar || '',
      address: address || '',
      address_ar: address_ar || '',
      questionnaire_type: questionnaire_type || 'food',
      slug,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await getPlacesCollection().insertOne(place);
    res.status(201).json({ ...place, _id: result.insertedId });
  } catch (error) {
    console.error('Error creating place:', error);
    res.status(500).json({ error: 'Failed to create place' });
  }
});

// Get all places
app.get('/api/places', async (req, res) => {
  try {
    const places = await getPlacesCollection()
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

// Get single place by slug (public)
app.get('/api/places/slug/:slug', async (req, res) => {
  try {
    const place = await getPlacesCollection().findOne({ slug: req.params.slug });
    if (!place) return res.status(404).json({ error: 'Place not found' });
    res.json(place);
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({ error: 'Failed to fetch place' });
  }
});

// Update a place
app.put('/api/places/:id', async (req, res) => {
  try {
    const { ObjectId } = (await import('mongodb'));
    const { name, name_ar, address, address_ar, active, questionnaire_type } = req.body;
    const update = {
      ...(name !== undefined && { name }),
      ...(name_ar !== undefined && { name_ar }),
      ...(address !== undefined && { address }),
      ...(address_ar !== undefined && { address_ar }),
      ...(active !== undefined && { active }),
      ...(questionnaire_type !== undefined && { questionnaire_type }),
      updated_at: new Date(),
    };
    await getPlacesCollection().updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating place:', error);
    res.status(500).json({ error: 'Failed to update place' });
  }
});

// Delete a place
app.delete('/api/places/:id', async (req, res) => {
  try {
    const { ObjectId } = (await import('mongodb'));
    await getPlacesCollection().deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).json({ error: 'Failed to delete place' });
  }
});

// ─── FEEDBACK ───

// Submit feedback (now with place_slug and questionnaire_type)
app.post('/api/feedback', async (req, res) => {
  try {
    const { place_slug, questionnaire_type, ...rest } = req.body;

    let place_name = '';
    let place_id = null;
    let resolved_questionnaire_type = questionnaire_type || 'food';
    if (place_slug) {
      const place = await getPlacesCollection().findOne({ slug: place_slug, active: true });
      if (place) {
        place_name = place.name;
        place_id = place._id;
        resolved_questionnaire_type = place.questionnaire_type || questionnaire_type || 'food';
      }
    }

    const feedbackData = {
      ...rest,
      place_slug: place_slug || null,
      place_name: place_name || null,
      place_id: place_id || null,
      questionnaire_type: resolved_questionnaire_type,
      created_at: new Date(),
      feedback_date: rest.feedback_date || new Date().toISOString().split('T')[0],
    };

    const result = await getFeedbackCollection().insertOne(feedbackData);
    res.status(201).json({ id: result.insertedId, success: true });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get feedback with filters
app.get('/api/feedback', async (req, res) => {
  try {
    const { place_slug, meal_time, from_date, to_date, rating, questionnaire_type } = req.query;
    const filter = {};

    if (place_slug) filter.place_slug = place_slug;
    if (meal_time) filter.meal_time = meal_time;
    if (rating) filter.overall_experience = rating;
    if (questionnaire_type) {
      filter.questionnaire_type = questionnaire_type;
    }

    if (from_date || to_date) {
      filter.feedback_date = {};
      if (from_date) filter.feedback_date.$gte = from_date;
      if (to_date) filter.feedback_date.$lte = to_date;
    }

    const feedbacks = await getFeedbackCollection()
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();

    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Get feedback stats/analytics
app.get('/api/feedback/stats', async (req, res) => {
  try {
    const { place_slug, from_date, to_date, questionnaire_type } = req.query;
    const filter = {};

    if (place_slug) filter.place_slug = place_slug;
    if (questionnaire_type) {
      if (questionnaire_type === 'food') {
        // Backward compat: food includes docs without questionnaire_type
        filter.$or = [
          { questionnaire_type: 'food' },
          { questionnaire_type: { $exists: false } },
          { questionnaire_type: null },
        ];
      } else {
        filter.questionnaire_type = questionnaire_type;
      }
    }
    if (from_date || to_date) {
      filter.feedback_date = {};
      if (from_date) filter.feedback_date.$gte = from_date;
      if (to_date) filter.feedback_date.$lte = to_date;
    }

    const feedbacks = await getFeedbackCollection().find(filter).toArray();
    const total = feedbacks.length;

    if (total === 0) {
      return res.json({ total: 0, byRating: {}, byMealTime: {}, byCategory: {}, byField: {}, byDate: [] });
    }

    const qType = questionnaire_type || 'food';

    // Common: date aggregation
    const byDate = {};
    feedbacks.forEach(fb => {
      byDate[fb.feedback_date] = (byDate[fb.feedback_date] || 0) + 1;
    });
    const byDateArray = Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Overall rating field depends on questionnaire type
    const overallRatingFieldMap = {
      food: 'overall_experience',
      housekeeping: 'housekeeping_overall',
      school_canteen: 'sc_overall',
      // backward compat for old data
      toilet: 'toilet_overall_cleanliness',
      laundry: 'laundry_overall_service',
    };
    const overallField = overallRatingFieldMap[qType] || 'overall_experience';

    // Count by overall rating
    const byRating = {};
    feedbacks.forEach(fb => {
      const val = fb[overallField];
      if (val) byRating[val] = (byRating[val] || 0) + 1;
    });

    if (qType === 'food') {
      // Food-specific aggregations
      const byMealTime = {};
      const categories = ['food_temperature', 'food_taste', 'food_aroma', 'menu_variety', 'staff_attitude', 'service_time', 'cleanliness'];
      const byCategory = {};
      categories.forEach(c => { byCategory[c] = { excellent: 0, very_good: 0, good: 0, average: 0, dissatisfied: 0 }; });

      feedbacks.forEach(fb => {
        byMealTime[fb.meal_time] = (byMealTime[fb.meal_time] || 0) + 1;
        categories.forEach(c => {
          if (fb[c] && byCategory[c][fb[c]] !== undefined) {
            byCategory[c][fb[c]]++;
          }
        });
      });

      return res.json({ total, byRating, byMealTime, byCategory, byDate: byDateArray });
    }

    if (qType === 'school_canteen') {
      // School canteen: category-based aggregation (same pattern as food)
      const categories = [
        'sc_food_taste', 'sc_food_temperature', 'sc_food_freshness', 'sc_food_variety', 'sc_portion_size',
        'sc_kitchen_cleanliness', 'sc_dining_area', 'sc_food_handling',
        'sc_staff_behavior', 'sc_waiting_time', 'sc_serving_quality',
      ];
      const byCategory = {};
      categories.forEach(c => { byCategory[c] = { excellent: 0, very_good: 0, good: 0, average: 0, dissatisfied: 0 }; });

      feedbacks.forEach(fb => {
        categories.forEach(c => {
          if (fb[c] && byCategory[c][fb[c]] !== undefined) {
            byCategory[c][fb[c]]++;
          }
        });
      });

      return res.json({ total, byRating, byCategory, byDate: byDateArray });
    }

    // Housekeeping: aggregate radio/choice fields (toilet + laundry combined)
    const radioFieldsMap = {
      housekeeping: [
        'toilet_clean_at_use', 'toilet_supplies_available', 'toilet_unpleasant_smell',
        'toilet_area_needs_cleaning', 'toilet_cleaned_frequently',
        'laundry_properly_cleaned', 'laundry_returned_on_time', 'laundry_fresh_no_odor',
        'laundry_ironing_folding', 'laundry_issues',
      ],
      // backward compat for old data
      toilet: ['toilet_clean_at_use', 'toilet_supplies_available', 'toilet_unpleasant_smell', 'toilet_area_needs_cleaning', 'toilet_cleaned_frequently'],
      laundry: ['laundry_properly_cleaned', 'laundry_returned_on_time', 'laundry_fresh_no_odor', 'laundry_ironing_folding', 'laundry_issues'],
    };

    const radioFields = radioFieldsMap[qType] || [];
    const byField = {};
    radioFields.forEach(f => { byField[f] = {}; });

    feedbacks.forEach(fb => {
      radioFields.forEach(f => {
        const val = fb[f];
        if (val) {
          byField[f][val] = (byField[f][val] || 0) + 1;
        }
      });
    });

    res.json({ total, byRating, byField, byDate: byDateArray });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── ADMIN AUTH ───

app.post('/api/admin/verify', async (req, res) => {
  try {
    const { passcode } = req.body;
    let adminSettings = await getAdminSettingsCollection().findOne({ setting_key: 'admin_passcode' });

    if (!adminSettings) {
      await getAdminSettingsCollection().insertOne({
        setting_key: 'admin_passcode',
        setting_value: '54321',
        created_at: new Date(),
        updated_at: new Date(),
      });
      adminSettings = { setting_value: '54321' };
    }

    // School admin passcode
    const SCHOOL_PASSCODE = '67890';

    if (adminSettings.setting_value === passcode) {
      return res.json({ valid: true, role: 'admin' });
    } else if (passcode === SCHOOL_PASSCODE) {
      return res.json({ valid: true, role: 'school' });
    } else {
      return res.json({ valid: false });
    }
  } catch (error) {
    console.error('Error verifying passcode:', error);
    res.status(500).json({ error: 'Failed to verify passcode' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Food City Feedback API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      places: '/api/places',
      feedback: '/api/feedback',
      stats: '/api/feedback/stats',
      admin: '/api/admin/verify'
    }
  });
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'mongodb' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
