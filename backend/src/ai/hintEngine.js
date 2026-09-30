const anthropic = require("./anthropic");

const getHint = async (userCode, targetOutput, language) => {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are a contest hint assistant. The user is trying to write ${language} code that produces this target output:\n\n${targetOutput}\n\nTheir current code is:\n${userCode}\n\nGive ONE helpful hint that nudges them in the right direction WITHOUT revealing the full solution. Keep it short.`,
      },
    ],
  });
  return response.content[0].text;
};

module.exports = getHint;