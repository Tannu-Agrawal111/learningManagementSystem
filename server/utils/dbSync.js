const User = require('../models/User');
const Course = require('../models/Course');
const db = require('../db');

/**
 * Ensure a user exists in MongoDB. If not, fetch from SQLite and create in MongoDB.
 * @param {string|number} userId 
 * @returns {Promise<object|null>} Mongoose User document or null
 */
const getOrCreateMongoUser = async (userId) => {
  if (!userId) return null;
  const idStr = userId.toString();
  
  try {
    let user = await User.findById(idStr);
    if (!user) {
      // Fetch user from SQLite
      const sqliteUser = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (sqliteUser) {
        user = new User({
          _id: idStr,
          name: sqliteUser.name,
          email: sqliteUser.email,
          password: sqliteUser.password,
          role: sqliteUser.role === 'instructor' ? 'Instructor' : 'Student',
          xp: 0,
          learningStreak: 0,
          lastActiveDate: new Date()
        });
        await user.save();
        console.log(`Created MongoDB User document for SQLite user ${idStr}`);
      }
    }
    return user;
  } catch (err) {
    console.error(`Error in getOrCreateMongoUser for user ${idStr}:`, err);
    return null;
  }
};

/**
 * Ensure a course exists in MongoDB. If not, fetch from SQLite and create in MongoDB.
 * @param {string|number} courseId 
 * @returns {Promise<object|null>} Mongoose Course document or null
 */
const getOrCreateMongoCourse = async (courseId) => {
  if (!courseId) return null;
  const idStr = courseId.toString();

  try {
    let course = await Course.findById(idStr);
    if (!course) {
      // Fetch course from SQLite
      const sqliteCourse = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM courses WHERE id = ?', [courseId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (sqliteCourse) {
        course = new Course({
          _id: idStr,
          title: sqliteCourse.title,
          description: sqliteCourse.description || '',
          instructor: sqliteCourse.instructor_id.toString(),
          isPaid: sqliteCourse.is_paid === 1,
          price: sqliteCourse.price || 0,
          averageRating: sqliteCourse.average_rating || 0,
          totalRatings: sqliteCourse.total_ratings || 0,
          benefits: JSON.parse(sqliteCourse.benefits || '[]')
        });
        await course.save();
        console.log(`Created MongoDB Course document for SQLite course ${idStr}`);
      }
    }
    return course;
  } catch (err) {
    console.error(`Error in getOrCreateMongoCourse for course ${idStr}:`, err);
    return null;
  }
};

module.exports = {
  getOrCreateMongoUser,
  getOrCreateMongoCourse
};
