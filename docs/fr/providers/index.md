---
read_when:
    - Vous voulez choisir un fournisseur de modèles
    - Vous avez besoin d’un aperçu rapide des backends LLM pris en charge
summary: Fournisseurs de modèles (LLM) pris en charge par OpenClaw
title: Répertoire des fournisseurs
x-i18n:
    generated_at: "2026-04-23T07:09:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b038f095480fc2cd4f7eb75500d9d8eb7b03fa90614e122744939e0ddc6996d
    source_path: providers/index.md
    workflow: 15
---

# Fournisseurs de modèles

OpenClaw peut utiliser de nombreux fournisseurs LLM. Choisissez un fournisseur, authentifiez-vous, puis définissez le
modèle par défaut sous la forme `provider/model`.

Vous cherchez la documentation des canaux de discussion (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/etc.) ? Voir [Channels](/fr/channels).

## Démarrage rapide

1. Authentifiez-vous auprès du fournisseur (généralement via `openclaw onboard`).
2. Définissez le modèle par défaut :

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Documentation des fournisseurs

- [Alibaba Model Studio](/fr/providers/alibaba)
- [Amazon Bedrock](/fr/providers/bedrock)
- [Amazon Bedrock Mantle](/fr/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/fr/providers/anthropic)
- [Arcee AI (modèles Trinity)](/fr/providers/arcee)
- [BytePlus (International)](/fr/concepts/model-providers#byteplus-international)
- [Chutes](/fr/providers/chutes)
- [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
- [ComfyUI](/fr/providers/comfy)
- [DeepSeek](/fr/providers/deepseek)
- [ElevenLabs](/fr/providers/elevenlabs)
- [fal](/fr/providers/fal)
- [Fireworks](/fr/providers/fireworks)
- [GitHub Copilot](/fr/providers/github-copilot)
- [Modèles GLM](/fr/providers/glm)
- [Google (Gemini)](/fr/providers/google)
- [Groq (inférence LPU)](/fr/providers/groq)
- [Hugging Face (Inference)](/fr/providers/huggingface)
- [inferrs (modèles locaux)](/fr/providers/inferrs)
- [Kilocode](/fr/providers/kilocode)
- [LiteLLM (Gateway unifiée)](/fr/providers/litellm)
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
- [Tencent Cloud (TokenHub)](/fr/providers/tencent)
- [Together AI](/fr/providers/together)
- [Venice (Venice AI, axé confidentialité)](/fr/providers/venice)
- [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
- [vLLM (modèles locaux)](/fr/providers/vllm)
- [Volcengine (Doubao)](/fr/providers/volcengine)
- [Vydra](/fr/providers/vydra)
- [xAI](/fr/providers/xai)
- [Xiaomi](/fr/providers/xiaomi)
- [Z.AI](/fr/providers/zai)

## Pages d’aperçu partagées

- [Variantes incluses supplémentaires](/fr/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy et OAuth Gemini CLI
- [Génération d’images](/fr/tools/image-generation) - Outil partagé `image_generate`, sélection du fournisseur et basculement
- [Génération musicale](/fr/tools/music-generation) - Outil partagé `music_generate`, sélection du fournisseur et basculement
- [Génération vidéo](/fr/tools/video-generation) - Outil partagé `video_generate`, sélection du fournisseur et basculement

## Fournisseurs de transcription

- [Deepgram (transcription audio)](/fr/providers/deepgram)
- [ElevenLabs](/fr/providers/elevenlabs#speech-to-text)
- [Mistral](/fr/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/fr/providers/openai#speech-to-text)
- [xAI](/fr/providers/xai#speech-to-text)

## Outils communautaires

- [Claude Max API Proxy](/fr/providers/claude-max-api-proxy) - Proxy communautaire pour les identifiants d’abonnement Claude (vérifiez la politique/les conditions Anthropic avant utilisation)

Pour le catalogue complet des fournisseurs (xAI, Groq, Mistral, etc.) et la configuration avancée,
voir [Fournisseurs de modèles](/fr/concepts/model-providers).
