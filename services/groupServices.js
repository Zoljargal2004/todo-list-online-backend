const express = require("express");
const Group = require("../models/groupModel");
const { verifyToken } = require("../handy/jwt");
const { generateGroupCode } = require("../handy/createNewGroupId");
const router = express.Router();

// Get my groups (where I'm a member)
router.get('/groups/my', verifyToken, async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user.userId });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create group (protected)
router.post('/groups', verifyToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const groupCode = generateGroupCode();
        
        // Validate input
        if (!name) {
            return res.status(400).json({ message: "Group name is required" });
        }

        const group = new Group({ 
            _id: groupCode,
            name, 
            description,
            creator: req.user.userId,
            members: [req.user.userId]
        });
        
        await group.save();
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all groups
router.get('/groups', async (req, res) => {
    try {
        const groups = await Group.find({});
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get group by ID
router.get('/groups/:id', async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update group (protected)
router.put('/groups/:id', verifyToken, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is the creator
        if (group.creator.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: "Not authorized to update this group" });
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json(updatedGroup);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete group (protected)
router.delete('/groups/:id', verifyToken, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if user is the creator
        if (group.creator.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this group" });
        }

        await Group.findByIdAndDelete(req.params.id);
        res.json({ message: "Group deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/groups/join', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.body;
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        if (group.members.includes(req.user.userId)) {
            return res.status(400).json({ message: "You are already a member of this group" });
        }
        group.members.push(req.user.userId);
        await group.save();
        res.json(group);
    }catch(error){
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;