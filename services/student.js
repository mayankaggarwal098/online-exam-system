//const { Student } = require("../models/studentRegistered");
const { User } = require("../models/user");
const TestPaper = require("../models/testpaper");
const Question = require("../models/question");
const Options = require("../models/options");
const { sendMail } = require("./sendMail");
const ResponseSheet = require("../models/responseSheet");
const Response = require("../models/response");
const { validateStudent } = require("./validation");
const bcrypt = require("bcrypt");

const registerStudent = async (req, res) => {
  const { error } = validateStudent(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // const { name, email, phoneNum, link, testId } = req.body;
  const { email, password, link, testId } = req.body;

  const paper = await TestPaper.findOne({
    _id: testId,
    isRegistrationAvailable: true,
  });

  console.log(paper)
  if (!paper)
    return res.status(422).send("Registration for this test has been closed");

  // let student = await Student.findOne({ email, testId });
  // if (student) return res.status(422).send("User already registered");

  let student = await User.findOne({ email });
  if (!student) return res.status(401).send("Invalid email or password");

  const validPassword = await bcrypt.compare(password, student.password);
  if (!validPassword) return res.status(401).send("Invalid email or password");

  // student = await User.findOne({email, {testId: { $in:[testId]}});
  const check = await User.find({ email, testId: { $in: [testId] } });

  if (check.length !== 0)
    return res.status(422).send("Student has Already Registered");
  // student = new Student({ name, email, phoneNum, testId });
  //await student.save();
  student.testId.push(testId);
  await student.save();

  sendMail(
    email,
    "Registered Successfully",
    `You have been successfully registered for the test.Test starts on ${paper.startTime} and duration is ${paper.duration} minutes.<br><br>
     Click on the link given to take test  "${link}student/test?testid=${testId}&studentid=${student._id}"`
  );
  res.send("Successfully Registered Check your mail");
};

const getTestQuestions = async (req, res) => {
  const paper = await TestPaper.findById(req.body.id)
    .select("pdf questions duration isSnapshots startTime isAudioRec category")
    .populate("questions")
    .populate({
      path: "questions",
      populate: {
        path: "options",
        //model: Options,
        select: { optionBody: 1 },
      },
    });

  if (!paper) return res.status(404).send("Testpaper not found");
  res.send(paper);
};

const getStudent = async (req, res) => {
  const student = await User.findById(req.body.id);
  if (!student) return res.status(404).send("Student not exist");

  res.send(student);
};

const responseSheet = async (req, res) => {
  const { studentId, testId } = req.body;

  const student = await User.findOne({ _id: studentId });
  const paper = await TestPaper.findOne({
    _id: testId,
    isTestBegins: true,
    isTestConducted: false,
  });

  if (!student || !paper) return res.status(404).send("Invalid Request");

  let responseSheet = await ResponseSheet.findOne({ studentId, testId })
    .select("responses")
    .populate({
      path: "responses",
      select: {
        chosenOption: 1,
      },
    });

  if (responseSheet) return res.send(responseSheet);
  let responses = null;
  let questions = null,
    pdf = null;
  if (paper.category === "MCQ") {
    questions = paper.questions;

    responses = questions.map((id) => {
      return {
        questionId: id,
        chosenOption: [],
        studentId,
        testId,
      };
    });
    responses = await Response.insertMany(responses);
  }
  //const startTime = new Date();
  responseSheet = new ResponseSheet({
    testId,
    studentId,
    questions,
    responses,
    pdf,
    // startTime,
  });
  await responseSheet.save();
  res.send("Test Starts");
};

const updateResponse = async (req, res) => {
  const { testId, studentId, questionId, chosenOption } = req.body;
  const paper = await TestPaper.findById(testId);
  const responseSheet = await ResponseSheet.findOne({
    testId,
    studentId,
    isCompleted: false,
  });

  if (!paper || !responseSheet) return res.status(404).send("Invalid Request");
  //const currentDate = new Date();
  // const pendingTime =
  //   paper.duration * 60000 - (currentDate - responseSheet.startTime);
  //if (pendingTime > 0) {
  const response = await Response.findOneAndUpdate(
    { questionId, studentId, testId },
    { chosenOption }
  );
  
  if (!response) return res.status(404).send("Question not exist");

  res.send("Response Updated");
  // } else {
  //   const responseSheet = await ResponseSheet.findOneAndUpdate(
  //     { testId, studentId },
  //     { isCompleted: true }
  //   );
  //   if (!responseSheet) return res.status(400).send("Invalid Request");
  //   res.send("Time is up");
  // }
};

const endTest = async (req, res) => {
  const { testId, studentId } = req.body;
  const responseSheet = await ResponseSheet.findOneAndUpdate(
    { testId, studentId },
    { isCompleted: true }
  );
  if (!responseSheet) return res.status(404).send("Unable to submit response");
  res.send("Test Submitted Successfully");
};

const getTestStartTime = async (req, res) => {
  console.log(req.body.testId)
  const { testId } = req.body;
  const paper = await TestPaper.findById(testId).select("startTime");
  if (!paper) return res.status(404).send("Testpaper not found");

  console.log(paper)
  res.send(paper);
};

const getTestCategory = async (req, res) => {
  const { testId } = req.body;
  const paper = await TestPaper.findById(testId).select("category");
  if (!paper) return res.status(404).send("Testpaper not found");

  res.send(paper.category);
};

// const getPdf = async (req, res) => {
//   const paper = await TestPaper.findById(req.body.id).select(
//     "pdf duration isSnapshots startTime isAudioRec"
//   );

//   if (!paper) return res.status(404).send("Testpaper not found");
//   res.send(paper);
// };

const uploadPdfResponse = async (req, res) => {
  const { studentId, testId, pdf } = req.body;
  const student = await User.findOne({ _id: studentId, testId });
  const paper = await TestPaper.findOne({
    _id: testId,
    isTestBegins: true,
    isTestConducted: false,
  });

  if (!student || !paper) return res.status(404).send("Invalid Request");

  const responseSheet = await ResponseSheet.findOneAndUpdate(
    { testId, studentId },
    { pdf }
  );
  if (!responseSheet) return res.status(404).send("ResponseSheet not exist");
  res.send("Response Updated");
};

const getResponsePdf = async (req, res) => {
  const { studentId, testId } = req.body;
  const responseSheet = await ResponseSheet.findOne({ studentId, testId });
  if (!responseSheet) return res.send("Student has not attempt this test");
  // console.log(responseSheet);
  res.send(responseSheet.pdf);
};

// const checkTestComplete = async (req, res) =>{
//   const {testId, studentId} = req.body;
//   const responseSheet = await ResponseSheet.findOne({studentId,testId}).select('isCompleted');
//   if (!responseSheet) return res.send(false);

//   res.send(responseSheet.isCompleted);
// }

const getStudentAllTest = async (req, res) => {
  const testPaper = await User.findById(req.user._id)
    .select("testId group")
    .populate({
      path: "testId",
      select: {
        isTestConducted: 1,
        title: 1,
        duration: 1,
        category: 1,
        paperType: 1,
        startTime: 1,
        subject: 1,
      },
    })
    .populate({
      path: "group",
      select: {
        tests: 1,
      },
      populate: {
        path: "tests",
        select: {
          isTestConducted: 1,
          title: 1,
          duration: 1,
          category: 1,
          paperType: 1,
          startTime: 1,
          subject: 1,
        },
      },
    });
  if (!testPaper) return res.status(404).send("Tests Not Found");

  let organisationtest = testPaper.testId.map((t) => t);

  if (testPaper.group.length) {
    let grouptest = testPaper.group.map((t) => t.tests);
    grouptest = [].concat(...grouptest);
    res.send([...grouptest, ...organisationtest]);
  } else res.send(organisationtest);
};

module.exports = {
  getResponsePdf,
  uploadPdfResponse,
  //getPdf,
  getTestCategory,
  getTestStartTime,
  updateResponse,
  endTest,
  responseSheet,
  getStudent,
  registerStudent,
  getTestQuestions,
  getStudentAllTest,
};
