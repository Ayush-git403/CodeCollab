const anthropic = require("./anthropic");

const debugHelper = async (code, error, language) => {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a debugging assistant. This ${language} code produced an error. Explain what went wrong in simple terms and suggest a fix.\n\nCode:\n${code}\n\nError:\n${error}`,
      },
    ],
  });
  return response.content[0].text;
};

module.exports = debugHelper;