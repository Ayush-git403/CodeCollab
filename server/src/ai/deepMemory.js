const anthropic = require("./anthropic");
const db = require("../models");

const saveMemory = async (userId, roomId, memoryType, content) => {
  await db.query(
    `INSERT INTO ai_memory (user_id, room_id, memory_type, content)
     VALUES ($1, $2, $3, $4)`,
    [userId, roomId, memoryType, content]
  );
};

const loadMemory = async (userId) => {
  const result = await db.query(
    `SELECT * FROM ai_memory WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [userId]
  );
  return result.rows;
};

const getPersonalisedHelp = async (userId, currentCode, question) => {
  const memories = await loadMemory(userId);
  const memoryContext = memories
    .map((m) => `[${m.memory_type}]: ${m.content}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a personalised coding assistant with memory of this user's past sessions:\n\n${memoryContext}\n\nCurrent code:\n${currentCode}\n\nUser's question: ${question}\n\nGive a helpful, personalised response based on their history.`,
      },
    ],
  });

  await saveMemory(userId, null, "question", question);

  return response.content[0].text;
};

module.exports = { saveMemory, loadMemory, getPersonalisedHelp };