const fs = require("fs");
const crypto = require("crypto");

const md5 = (filePath) => {
  if (fs.existsSync(filePath)) {
    const file = fs.readFileSync(filePath);
    const hash = crypto.createHash("md5").update(file).digest("hex");
    return hash;
  } else {
    console.error("Invalid file path");
    return null;
  }
};

console.log("Running feedback check ...");

// get expected feedback file hash
const hash = require("./feedback-hash.json").hash;

// md5 the current feedback file (hopefully updated by students)
const studentFeedbackHash = md5("./feedback.md");

// if hashes match, the file was not changed
if (studentFeedbackHash == hash || !studentFeedbackHash) {
  console.error("Please answer the questions in the feedback file.");
  process.exit(1);
} else {
  console.log("- Feedback file changed.");
  console.log("Feedback check passed.");
  process.exit(0);
}
