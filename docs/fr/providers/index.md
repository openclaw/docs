---
read_when:
    - Vous voulez choisir un provider de modèle
    - Vous avez besoin d’un aperçu rapide des backends LLM pris en charge
summary: Providers de modèles (LLM) pris en charge par OpenClaw
title: Répertoire des providers
x-i18n:
    generated_at: "2026-04-22T04:26:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d77e5da93d71c48ea97460c6be56fbbe8279d9240a8101e1b35fdafb657737e
    source_path: providers/index.md
    workflow: 15
---

# Providers de modèles

OpenClaw peut utiliser de nombreux providers de LLM. Choisissez un provider, authentifiez-vous, puis définissez le
modèle par défaut sous la forme `provider/model`.

Vous cherchez la documentation des canaux de chat (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/etc.) ? Voir [Canaux](/fr/channels).

## Démarrage rapide

1. Authentifiez-vous auprès du provider (généralement via `openclaw onboard`).
2. Définissez le modèle par défaut :

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentation des providers

- [Alibaba Model Studio](/fr/providers/alibaba)
- [Amazon Bedrock](/fr/providers/bedrock)
- [Anthropic (API + Claude CLI)](/fr/providers/anthropic)
- [Arcee AI (modèles Trinity)](/fr/providers/arcee)
- [BytePlus (International)](/fr/concepts/model-providers#byteplus-international)
- [Chutes](/fr/providers/chutes)
- [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
- [ComfyUI](/fr/providers/comfy)
- [DeepSeek](/fr/providers/deepseek)
- [fal](/fr/providers/fal)
- [Fireworks](/fr/providers/fireworks)
- [GitHub Copilot](/fr/providers/github-copilot)
- [Modèles GLM](/fr/providers/glm)
- [Google (Gemini)](/fr/providers/google)
- [Groq (inférence LPU)](/fr/providers/groq)
- [Hugging Face (Inference)](/fr/providers/huggingface)
- [inferrs (modèles locaux)](/fr/providers/inferrs)
- [Kilocode](/fr/providers/kilocode)
- [LiteLLM (gateway unifiée)](/fr/providers/litellm)
- [LM Studio (modèles locaux)](/fr/providers/lmstudio)
- [MiniMax](/fr/providers/minimax)
- [Mistral](/fr/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot)
- [NVIDIA](/fr/providers/nvidia)
- [Ollama (cloud + modèles locaux)](/fr/providers/ollama)
- [OpenAI (API + Codex)](/fr/providers/openai)
- [OpenCode](/fr/providers/opencode)
- [OpenCode Go](/fr/providers/opencode-go)
- [OpenRouter](/fr/providers/openrouter)
- [Perplexity (recherche web)](/fr/providers/perplexity-provider)
- [Qianfan](/fr/providers/qianfan)
- [Qwen Cloud](/fr/providers/qwen)
- [Runway](/fr/providers/runway)
- [SGLang (modèles locaux)](/fr/providers/sglang)
- [StepFun](/fr/providers/stepfun)
- [Synthetic](/fr/providers/synthetic)
- [Together AI](/fr/providers/together)
- [Venice (Venice AI, axé sur la confidentialité)](/fr/providers/venice)
- [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
- [vLLM (modèles locaux)](/fr/providers/vllm)
- [Volcengine (Doubao)](/fr/providers/volcengine)
- [Vydra](/fr/providers/vydra)
- [xAI](/fr/providers/xai)
- [Xiaomi](/fr/providers/xiaomi)
- [Z.AI](/fr/providers/zai)

## Pages d’ensemble partagées

- [Variantes intégrées supplémentaires](/fr/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy et Gemini CLI OAuth
- [Génération d’images](/fr/tools/image-generation) - Outil `image_generate` partagé, sélection du provider et basculement
- [Génération musicale](/fr/tools/music-generation) - Outil `music_generate` partagé, sélection du provider et basculement
- [Génération vidéo](/fr/tools/video-generation) - Outil `video_generate` partagé, sélection du provider et basculement

## Providers de transcription

- [Deepgram (transcription audio)](/fr/providers/deepgram)

## Outils communautaires

- [Claude Max API Proxy](/fr/providers/claude-max-api-proxy) - Proxy communautaire pour les identifiants d’abonnement Claude (vérifiez la politique/les conditions d’Anthropic avant utilisation)

Pour le catalogue complet des providers (xAI, Groq, Mistral, etc.) et la configuration avancée,
voir [Providers de modèles](/fr/concepts/model-providers).
