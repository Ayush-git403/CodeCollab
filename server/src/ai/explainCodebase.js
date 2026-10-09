const anthropic = require("./anthropic");

const explainCodebase = async (code, language) => {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a helpful coding assistant. Explain this ${language} codebase in simple, clear terms. Break it down line by line if needed. Be beginner friendly.\n\nCode:\n${code}`,
      },
    ],
  });
  return response.content[0].text;
};

module.exports = explainCodebase;