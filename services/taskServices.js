const express = require("express");
const Task = require("../models/taskModel");
const { verifyToken } = require("../handy/jwt");
const Group = require("../models/groupModel");
const router = express.Router();

router.post("/tasks", verifyToken, async (req, res) => {
  try {
    const { name, description, deadline, group } = req.body;
    let groupIds = [];
    if (!group.length) {
      groupIds = await Group.find({ members: req.user.userId }).select("_id");
    }
    const task = new Task({
      name,
      description,
      deadline,
      creator: req.user.userId,
      completed: false,
      group: groupIds,
    });
    await task.save();

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/tasks", verifyToken, async (req, res) => {
  try {
    const { deadline, completed, createdAt } = req.query;
    const creator = req.user.userId;
    const query = {};
    if (deadline) {
      query.deadline = { $lte: deadline };
    }
    if (completed) {
      query.completed = completed;
    }
    if (createdAt) {
      query.createdAt = { $gte: createdAt };
    }
    if (creator) {
      query.creator = creator;
    }
    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/tasks/:id", verifyToken, async (req, res) => {
  try {
    const { name, description, deadline } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { name, description, deadline },
      { new: true }
    );
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/tasks/:id", verifyToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.creator.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/tasks/complete/:id", verifyToken, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: true },
      { new: true }
    );
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/tasks/incomplete/:id", verifyToken, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: false },
      { new: true }
    );
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/tasks/group/:id", verifyToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (!group.members.includes(req.user.userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { deadline, completed, createdAt, creator } = req.query;
    const query = { group: req.params.id };

    if (deadline) {
      query.deadline = { $lte: deadline };
    }
    if (completed !== undefined) {
      query.completed = completed;
    }
    if (createdAt) {
      query.createdAt = { $gte: createdAt };
    }
    if (creator) {
      query.creator = creator;
    }

    const grouped = await Task.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$creator",
          tasks: { $push: "$$ROOT" },
        },
      },
    ]);
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
