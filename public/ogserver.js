const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const PORT = 3000;

const mongoose = require("mongoose");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const uri = "mongodb://localhost:27017/prodb"; // MongoDB connection URI

async function connectToDB() {
  try {
    await mongoose.connect(uri).then(() => {
      console.log("Connected to MongoDB");
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

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
const CredentialSchema = new mongoose.Schema({ login: String, pass: String });
const Credential = mongoose.model("Login", CredentialSchema);

// Create the Faculty model using the schema
const Faculty = mongoose.model("Faculty", facultySchema);

app.post("/addData", async (req, res) => {
  const {
    name,
    age,
    dob,
    dateOfJoining,
    highestQualification,
    ssnid,
    digitalId,
    alternateEid,
    annaUniFacultyId,
    phoneNumber,
    address,
    aicteId,
    bloodGroup,
  } = req.body;
  const formData = req.body;
  console.log(formData);
  res.send("FORM DATA RECEIVED");

  try {
    const result = await Faculty.collection.insertOne({
      name,
      age,
      dob,
      dateOfJoining,
      highestQualification,
      ssnid,
      digitalId,
      alternateEid,
      annaUniFacultyId,
      phoneNumber,
      address,
      aicteId,
      bloodGroup,
    });
    console.log("Inserted document:", result.insertedId);
    res.send("Data added successfully!");
  } catch (error) {
    console.error("Error inserting document:", error);
    res.status(500).send("Error adding data to MongoDB");
  }
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", "views");
/*app.post("/chk", (req, res) => {
  console.log("Request received on /chk route");
  console.log("Request body:", req.body);
  res.send("POST request to /chk received");
});*/
/*app.get("/chk", async (req, res) => {
  const email = req.body.email;
  console.log("Request received on /chk route");
  console.log("Request body:", req.body);
  try {
    // const facultyMember = await Faculty.findOne({ age: "19" });
    const facultyMember = await Faculty.findOne({ digitalId: email });
    console.log(facultyMember);

    if (facultyMember) {
      const { login, pass } = req.body;
      const resul = req.body;
      const finn = await Credential.collection.insertOne(login, pass);
      console.log("ADDED INTO DATABASE");
      res.render("index", (data = facultyMember));

      // Render the EJS template with the fetched data
    } else {
      const { login, pass } = req.body;
      const result = req.body;
      const fin = await Credential.collection.insertOne(login, pass);
      console.log("ADDED INTO DATABASE");
      return res.sendFile(
        "C:/Users/Srinivas/Documents/Faculty_profile/public\faculty_profile.html"
      );
    }
  } catch (error) {
    console.error("Error fetching faculty member:", error);
    res.status(500).send("Error fetching faculty member");
  }
});*/

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectToDB(); // Connect to MongoDB when the server starts
});
