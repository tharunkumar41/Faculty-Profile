// Faculty.js

const mongoose = require("mongoose");

// Define the schema for Faculty
const facultySchema = new mongoose.Schema({
  name: String,
  age: Number,
  dob: Date,
  dateOfJoining: Date,
  highestQualification: String,
  ssnid: String,
  digitalId: String,
  alternateEid: String,
  annaUniFacultyId: String,
  phoneNumber: String,
  address: String,
  aicteId: String,
  bloodGroup: String,
});

// Create the Faculty model using the schema
const Faculty = mongoose.model("Faculty", facultySchema);

module.exports = Faculty;
