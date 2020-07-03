const fs = require("fs");
const crypto = require("crypto");

const file = fs.readFileSync("feedback.md");
const hash = crypto.createHash("md5").update(file).digest("hex");

const hashResult = { hash };

console.log(hashResult);
fs.writeFileSync("test/feedback-hash.json", JSON.stringify(hashResult));
process.exit(0);
