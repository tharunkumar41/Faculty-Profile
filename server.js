const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const app = express();
const pdf = require('pdfkit');
const PORT = 3000;

const uri = "mongodb://localhost:27017/prodb"; // MongoDB connection URI

// Middleware
app.use('/uploads', express.static('uploads')); 
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use('/reports', express.static(path.join(__dirname, 'reports')));


const session = require("express-session");
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true
}));

// Route for admin login page
app.get("/admin/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin_login.html"));
});

app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@ssn.edu.in" && password === "Admin@1234") {
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin_login.html", { error: "Invalid email or password" });
  }
});

function requireAdminLogin(req, res, next) {
  if (req.session.isAdminLoggedIn) {
    next();
  } else {
    res.redirect("/admin/login");
  }
}

app.get("/admin", requireAdminLogin, async (req, res) => {
  try {
    const faculties = await Faculty.find({});
    res.render("admin", { faculties });
  } catch (error) {
    console.error("Error fetching faculties:", error);
    res.status(500).send("Error fetching faculties");
  }
});


// Define the schema for Faculty
const facultySchema = new mongoose.Schema({
  name: String,
  role:String,
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
  researchInterest: String,
  bloodGroup: String,
  certificate: String, // filename in uploads folder
  profileImage: String, // filename in uploads folder
});

const Faculty = mongoose.model("Faculty", facultySchema);
const credentialSchema = new mongoose.Schema({ login: String, pass: String });
const Credential = mongoose.model("Login", credentialSchema);

// Connect to MongoDB
async function connectToDB() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Set up Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Route for signup page
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signup.html"));
});

// Route to display faculty list
app.get("/", async (req, res) => {
  try {
    const faculties = await Faculty.find({});
    res.render("indexx", { faculties });
  } catch (error) {
    console.error("Error fetching faculties:", error);
    res.status(500).send("Error fetching faculties");
  }
});

app.get("/admin/dashboard", async (req, res) => {
  try {
    const faculties = await Faculty.find({});
    res.render("admin_dashboard", { faculties });
  } catch (error) {
    console.error("Error fetching faculties:", error);
    res.status(500).send("Error fetching faculties");
  }
});



app.get("/interface", async (req, res) => {
  res.render("interface")
});


// Route to handle signup form submission
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const emailPattern = /^[a-zA-Z0-9._%+-]+@ssn.edu.in$/;
  if (!emailPattern.test(email)) {
    return res.status(400).send("Invalid email domain");
  }

  try {
    const existingUser = await Credential.findOne({ login: email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create a new entry (login info matching with faculty_profile)
    await Credential.collection.insertOne({ login: email, pass: password });

    // Redirect to the faculty profile page
    res.redirect("/faculty_profile.html?ssnid=${encodeURIComponent(email)}`"); // Use res.redirect for redirection
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).send("Error during signup");
  }
});

// Route to handle faculty data submission
app.post(
  "/addData",
  upload.fields([{ name: "certificate" }, { name: "profileImage" }]),
  async (req, res) => {
    console.log("Req Files:", req.files);
    console.log("Req Body:", req.body);
    try {
      const {
        name,
        role,
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
        researchInterest,
        bloodGroup,
      } = req.body;

      const certificateFile = req.files["certificate"]
        ? req.files["certificate"][0]
        : null;
      const profileImageFile = req.files["profileImage"]
        ? req.files["profileImage"][0]
        : null;

      const newFaculty = new Faculty({
        name,
        role,
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
        researchInterest,
        bloodGroup,
        certificate: certificateFile ? certificateFile.filename : null,
        profileImage: profileImageFile ? profileImageFile.filename : null,
      });

      const result = await newFaculty.save();
      console.log("Inserted document:", result._id);
      res.send("Data added successfully!");
    } catch (error) {
      console.error("Error inserting document:", error);
      res.status(500).send("Error adding data to MongoDB");
    }
  }
);

//login page when faculty_profile is not filled but login info is saved(line 199)
app.post("/chk", async (req, res) => {
  console.log("Request received on /chk route");
  console.log("Request body:", req.body);

  const { email, password } = req.body;

  const emailPattern = /^[a-zA-Z0-9._%+-]+@ssn.edu.in$/;
  if (!emailPattern.test(email)) {
    console.log("Invalid email domain");
    return res.status(400).json({ success: false, message: "Invalid email domain" });
  }

  try {
    const credentials = await Credential.findOne({ login: email });
    if (!credentials) {
      console.log("User does not exist");
      return res.status(404).json({ success: false, message: "User does not exist. Try Signing Up" });
    }

    if (credentials.pass !== password) {
      console.log("Invalid login credentials");
      return res.status(401).json({ success: false, message: "Invalid login credentials" });
    }

    const facultyMember = await Faculty.findOne({ ssnid: email });
    if (facultyMember) {
      console.log(`Faculty member found: ${facultyMember._id}`);
      res.json({ success: true, id: facultyMember._id });
    } else {
      console.log("Faculty profile not found. Redirecting to profile creation.");
      res.json({ success: true, message: "Faculty profile not found", redirectToProfileCreation: true });
    }
  } catch (error) {
    console.error("Error fetching faculty member:", error);
    return res.status(500).json({ success: false, message: "Error fetching faculty member" });
  }
});

// Admin Dashboard Routes

// Admin dashboard view
app.get("/admin", async (req, res) => {
  try {
    const faculties = await Faculty.find({});
    res.render("admin", { faculties });
  } catch (error) {
    console.error("Error fetching faculties:", error);
    res.status(500).send("Error fetching faculties");
  }
});

// Route to edit a faculty member
app.get("/admin/edit/:id", async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).send("Faculty not found");
    }
    res.render("edit_faculty", { faculty });
  } catch (error) {
    console.error("Error fetching faculty:", error);
    res.status(500).send("Error fetching faculty");
  }
});

// Route to update a faculty member
app.post("/admin/edit/:id", upload.fields([{ name: "certificate" }, { name: "profileImage" }]), async (req, res) => {
  try {
    const {
      name,
      role,
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
      researchInterest,
      bloodGroup,
    } = req.body;

    const certificateFile = req.files["certificate"] ? req.files["certificate"][0] : null;
    const profileImageFile = req.files["profileImage"] ? req.files["profileImage"][0] : null;

    const updateData = {
      name,
      role,
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
      researchInterest,
      bloodGroup,
      certificate: certificateFile ? certificateFile.filename : req.body.existingCertificate,
      profileImage: profileImageFile ? profileImageFile.filename : req.body.existingProfileImage,
    };

    const updatedFaculty = await Faculty.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedFaculty) {
      return res.status(404).send("Faculty not found");
    }

    res.redirect("/admin");
  } catch (error) {
    console.error("Error updating faculty:", error);
    res.status(500).send("Error updating faculty");
  }
});

// Route to delete a faculty member
app.post("/admin/delete/:id", async (req, res) => {
  try {
    const deletedFaculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!deletedFaculty) {
      return res.status(404).send("Faculty not found");
    }
    res.redirect("/admin");
  } catch (error) {
    console.error("Error deleting faculty:", error);
    res.status(500).send("Error deleting faculty");
  }
});

// Route to view a single faculty member's profile
app.get("/faculty/:id", async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).send("Faculty not found");
    }
    res.render("profile", { faculty });
  } catch (error) {
    console.error("Error fetching faculty:", error);
    res.status(500).send("Error fetching faculty");
  }
});

//signup when email already exists
app.get("/check-email", async (req, res) => {
  const { email } = req.query;

  try {
    const existingUser = await Credential.findOne({ login: email });
    res.json({ exists: !!existingUser });
  } catch (error) {
    console.error("Error checking email existence:", error);
    res.status(500).json({ exists: false });
  }
});

// Route to generate a report for a faculty member
app.post('/admin/generate-report/:id', (req, res) => {
  const facultyId = req.params.id;

  // Find the faculty member by ID
  Faculty.findById(facultyId, (err, faculty) => {
    if (err) {
      return res.status(500).send('Error occurred while finding the faculty member.');
    }
    if (!faculty) {
      return res.status(404).send('Faculty not found');
    }

    // Generate PDF report using pdfkit
    const doc = new pdf();
    const filePath = path.join(__dirname, 'reports', `report-${facultyId}.pdf`);

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text('Faculty Report', { align: 'center' });
    doc.moveDown();
    const profileImagePath = path.join(__dirname, 'uploads', faculty.profileImage);
    if (faculty.profileImage && fs.existsSync(profileImagePath)) {
      doc.image(profileImagePath, {
        fit: [150, 150],
        align: 'center',
        valign: 'center'
      });
      doc.moveDown();
    } else {
      doc.text('Profile Image: Not Available');
      doc.moveDown();
    }

    doc.fontSize(14).text(`Name: ${faculty.name}`);
    doc.text(`Role: ${faculty.role}`);
    doc.text(`Age: ${faculty.age}`);
    doc.text(`Date of Birth: ${faculty.dob.toDateString()}`);
    doc.text(`Date of Joining: ${faculty.dateOfJoining.toDateString()}`);
    doc.text(`Highest Qualification: ${faculty.highestQualification}`);
    doc.text(`SSN ID: ${faculty.ssnid}`);
    doc.text(`Digital ID: ${faculty.digitalId}`);
    doc.text(`Alternate Email ID: ${faculty.alternateEid}`);
    doc.text(`Anna University Faculty ID: ${faculty.annaUniFacultyId}`);
    doc.text(`Phone Number: ${faculty.phoneNumber}`);
    doc.text(`Address: ${faculty.address}`);
    doc.text(`AICTE ID: ${faculty.aicteId}`);
    doc.text(`Research Interest: ${faculty.researchInterest}`);
    doc.text(`Blood Group: ${faculty.bloodGroup}`);

    doc.end();

    res.status(200).send(`Report generated successfully. You can download it from <a href="/reports/report-${facultyId}.pdf">here</a>.`);
  });
});

/*app.post('/admin/generate-report/:id', (req, res) => {
  const facultyId = req.params.id;

  // Find the faculty member by ID
  Faculty.findById(facultyId, (err, faculty) => {
    if (err) {
      return res.status(500).send('Error occurred while finding the faculty member.');
    }
    if (!faculty) {
      return res.status(404).send('Faculty not found');
    }

    // Generate PDF report using pdfkit
    const doc = new pdf();
    const filePath = path.join(__dirname, 'reports', `report-${facultyId}.pdf`);

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text('Faculty Report', { align: 'center' });
    doc.moveDown();
    const profileImagePath = path.join(__dirname, 'uploads', faculty.profileImage);
    if (faculty.profileImage && fs.existsSync(profileImagePath)) {
      console.log('Profile Image Path:', profileImagePath);  // Debugging line
      doc.image(profileImagePath, {
        fit: [150, 150],
        align: 'center',
        valign: 'center'
      });
      doc.moveDown(); //increase space between image and text
      doc.moveDown();
      doc.moveDown();
      doc.moveDown();
      doc.moveDown();
      doc.moveDown();
      doc.moveDown();
      doc.moveDown();
    } else {
      console.log('Profile Image not available or path is incorrect');  // Debugging line
      doc.text('Profile Image: Not Available');
      doc.moveDown();
    }
    
    doc.fontSize(14).text(`Name: ${faculty.name}`);
    doc.text(`Role: ${faculty.role}`);
    doc.text(`Age: ${faculty.age}`);
    doc.text(`Date of Birth: ${faculty.dob.toDateString()}`);
    doc.text(`Date of Joining: ${faculty.dateOfJoining.toDateString()}`);
    doc.text(`Highest Qualification: ${faculty.highestQualification}`);
    doc.text(`SSN ID: ${faculty.ssnid}`);
    doc.text(`Digital ID: ${faculty.digitalId}`);
    doc.text(`Alternate Email ID: ${faculty.alternateEid}`);
    doc.text(`Anna University Faculty ID: ${faculty.annaUniFacultyId}`);
    doc.text(`Phone Number: ${faculty.phoneNumber}`);
    doc.text(`Address: ${faculty.address}`);
    doc.text(`AICTE ID: ${faculty.aicteId}`);
    doc.text(`Research Interest: ${faculty.researchInterest}`);
    doc.text(`Blood Group: ${faculty.bloodGroup}`);
    // doc.text(`Certificate: ${faculty.certificate}`);

    doc.end();

    res.status(200).send(`Report generated successfully. You can download it from <a href="/reports/report-${facultyId}.pdf">here</a>.`);
  });
});
app.get()*/
// Start the server and connect to the database



app.get('/admin/filter', async (req, res) => {
  const { filterBy, query } = req.query;
  
  try {
    // Fetch all faculty documents from the database
    const faculties = await Faculty.find();
    
    // Filter the faculties based on the filterBy and query parameters
    let filteredFaculties = faculties.filter(faculty => {
      let textValue;
      if (filterBy === 'name') {
        textValue = faculty.name.toLowerCase();
      } else if (filterBy === 'age') {
        textValue = faculty.age.toString();
      } else if (filterBy === 'dateOfJoining') {
        textValue = new Date(faculty.dateOfJoining).toLocaleDateString();
      } else if (filterBy === 'annaUniFacultyId') {
        textValue = faculty.annaUniFacultyId.toLowerCase();
      }
      return textValue.includes(query.toLowerCase());
    });

    // Render the admin dashboard with the filtered faculties
    res.render('admin_dashboard', { faculties: filteredFaculties });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



app.listen(PORT, async () => {
  await connectToDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
