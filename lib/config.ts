// Configuração central. O modelo da Anthropic fica aqui pra trocar fácil.

export const AI = {
  /** Modelo de texto + visão (análise do criativo e copy/brief). */
  model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
};

/** Geração de imagem (opcional). Só ativa se GEMINI_API_KEY estiver presente. */
export const GEMINI = {
  imageModel: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
  textModel: process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
};

export const APP = {
  nome: "Performance Criativa",
  descricao: "Analise criativos de referência e recrie com o seu produto.",
};
