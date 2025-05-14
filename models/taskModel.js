const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: { 
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  group: {
    type: [String],
    ref: 'Group'
  }
});

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

module.exports = Task;
