---
read_when:
    - Vous souhaitez choisir un fournisseur de modèles
    - Vous avez besoin d’un aperçu rapide des backends LLM pris en charge
summary: Fournisseurs de modèles (LLM) pris en charge par OpenClaw
title: Répertoire des fournisseurs
x-i18n:
    generated_at: "2026-07-12T03:15:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw peut utiliser de nombreux fournisseurs de LLM. Choisissez un fournisseur, authentifiez-vous, puis définissez le
modèle par défaut au format `provider/model`.

Vous recherchez la documentation des canaux de discussion (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/etc.) ? Consultez [Canaux](/fr/channels).

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
- [Anthropic (API + CLI Claude)](/fr/providers/anthropic)
- [Arcee AI (modèles Trinity)](/fr/providers/arcee)
- [Azure Speech](/fr/providers/azure-speech)
- [BytePlus (international)](/fr/concepts/model-providers#byteplus-international)
- [Cerebras](/fr/providers/cerebras)
- [Chutes](/fr/providers/chutes)
- [ClawRouter (routage multifournisseur géré)](/fr/providers/clawrouter)
- [Cloudflare AI Gateway](/fr/providers/cloudflare-ai-gateway)
- [Cohere](/fr/providers/cohere)
- [ComfyUI](/fr/providers/comfy)
- [DeepSeek](/fr/providers/deepseek)
- [ds4 (DeepSeek V4 local)](/fr/providers/ds4)
- [ElevenLabs](/fr/providers/elevenlabs)
- [fal](/fr/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/fr/providers/fireworks)
- [GitHub Copilot](/fr/providers/github-copilot)
- [GMI Cloud](/fr/providers/gmi)
- [Google (Gemini)](/fr/providers/google)
- [Gradium](/fr/providers/gradium)
- [Groq (inférence LPU)](/fr/providers/groq)
- [Hugging Face (inférence)](/fr/providers/huggingface)
- [inferrs (modèles locaux)](/fr/providers/inferrs)
- [Kilocode](/fr/providers/kilocode)
- [LiteLLM (Gateway unifié)](/fr/providers/litellm)
- [LM Studio (modèles locaux)](/fr/providers/lmstudio)
- [LongCat](/fr/providers/longcat)
- [MiniMax](/fr/providers/minimax)
- [Mistral](/fr/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/fr/providers/moonshot)
- [NovitaAI](/fr/providers/novita)
- [NVIDIA](/fr/providers/nvidia)
- [Ollama (modèles dans le cloud et locaux)](/fr/providers/ollama)
- [Ollama Cloud](/fr/providers/ollama-cloud)
- [OpenAI (API + Codex)](/fr/providers/openai)
- [OpenCode](/fr/providers/opencode)
- [OpenCode Go](/fr/providers/opencode-go)
- [OpenRouter](/fr/providers/openrouter)
- [Perplexity (recherche sur le Web)](/fr/providers/perplexity-provider)
- [Qianfan](/fr/providers/qianfan)
- [Qwen Cloud](/fr/providers/qwen)
- [Qwen OAuth / Portal](/fr/providers/qwen-oauth)
- [Runway](/fr/providers/runway)
- [SenseAudio](/fr/providers/senseaudio)
- [SGLang (modèles locaux)](/fr/providers/sglang)
- [StepFun](/fr/providers/stepfun)
- [Synthetic](/fr/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/fr/providers/tencent)
- [Together AI](/fr/providers/together)
- [Venice (Venice AI, axé sur la confidentialité)](/fr/providers/venice)
- [Vercel AI Gateway](/fr/providers/vercel-ai-gateway)
- [vLLM (modèles locaux)](/fr/providers/vllm)
- [Volcengine (Doubao)](/fr/providers/volcengine)
- [Vydra](/fr/providers/vydra)
- [xAI](/fr/providers/xai)
- [Xiaomi](/fr/providers/xiaomi)
- [Z.AI (GLM)](/fr/providers/zai)

## Pages de présentation communes

- [Variantes supplémentaires des fournisseurs](/fr/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy et OAuth de la CLI Gemini
- [Génération d’images](/fr/tools/image-generation) - Outil `image_generate` partagé, sélection du fournisseur et basculement
- [Génération musicale](/fr/tools/music-generation) - Outil `music_generate` partagé, sélection du fournisseur et basculement
- [Génération de vidéos](/fr/tools/video-generation) - Outil `video_generate` partagé, sélection du fournisseur et basculement

## Fournisseurs de transcription

- [Deepgram (transcription audio)](/fr/providers/deepgram)
- [ElevenLabs](/fr/providers/elevenlabs#speech-to-text)
- [Mistral](/fr/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/fr/providers/openai)
- [SenseAudio](/fr/providers/senseaudio)
- [xAI](/fr/providers/xai)

## Outils communautaires

- [Claude Max API Proxy](/fr/providers/claude-max-api-proxy) - Proxy communautaire pour les identifiants d’abonnement Claude (vérifiez la politique et les conditions d’Anthropic avant utilisation)

Pour consulter le catalogue complet des fournisseurs (xAI, Groq, Mistral, etc.) et les options de configuration avancées,
consultez [Fournisseurs de modèles](/fr/concepts/model-providers).
