const express = require("express");
const router = express.Router();
const explainCodebase = require("../ai/explainCodebase");
const debugHelper = require("../ai/debugHelper");
const getHint = require("../ai/hintEngine");
const { getPersonalisedHelp, saveMemory } = require("../ai/deepMemory");

router.post("/explain", async (req, res) => {
  const { code, language } = req.body;
  const explanation = await explainCodebase(code, language);
  res.json({ explanation });
});

router.post("/debug", async (req, res) => {
  const { code, error, language } = req.body;
  const help = await debugHelper(code, error, language);
  res.json({ help });
});

router.post("/hint", async (req, res) => {
  const { userCode, targetOutput, language } = req.body;
  const hint = await getHint(userCode, targetOutput, language);
  res.json({ hint });
});

router.post("/memory", async (req, res) => {
  const { userId, currentCode, question } = req.body;
  const response = await getPersonalisedHelp(userId, currentCode, question);
  res.json({ response });
});

router.post("/memory/save", async (req, res) => {
  const { userId, roomId, memoryType, content } = req.body;
  await saveMemory(userId, roomId, memoryType, content);
  res.json({ success: true });
});

module.exports = router;