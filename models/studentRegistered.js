const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password:{
      type:String,
      required: true
    },
    group:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group"
    }],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Student = mongoose.model("Student", studentSchema);

module.exports = { Student };
