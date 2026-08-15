import Anthropic from "@anthropic-ai/sdk";

// Reads ANTHROPIC_API_KEY from the environment; never hardcode the key here.
const anthropic = new Anthropic();

export default anthropic;
