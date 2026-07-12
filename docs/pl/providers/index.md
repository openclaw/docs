---
read_when:
    - Chcesz wybrać dostawcę modelu
    - Potrzebujesz krótkiego przeglądu obsługiwanych backendów LLM
summary: Dostawcy modeli (LLM) obsługiwani przez OpenClaw
title: Katalog dostawców
x-i18n:
    generated_at: "2026-07-12T15:32:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw może korzystać z wielu dostawców LLM. Wybierz dostawcę, uwierzytelnij się, a następnie ustaw
model domyślny jako `provider/model`.

Szukasz dokumentacji kanałów czatu (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/itp.)? Zobacz [Kanały](/pl/channels).

## Szybki start

1. Uwierzytelnij się u dostawcy (zwykle za pomocą `openclaw onboard`).
2. Ustaw model domyślny:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Dokumentacja dostawców

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Amazon Bedrock](/pl/providers/bedrock)
- [Amazon Bedrock Mantle](/pl/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/pl/providers/anthropic)
- [Arcee AI (modele Trinity)](/pl/providers/arcee)
- [Azure Speech](/pl/providers/azure-speech)
- [BytePlus (wersja międzynarodowa)](/pl/concepts/model-providers#byteplus-international)
- [Cerebras](/pl/providers/cerebras)
- [Chutes](/pl/providers/chutes)
- [ClawRouter (zarządzane trasowanie między wieloma dostawcami)](/pl/providers/clawrouter)
- [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
- [Cohere](/pl/providers/cohere)
- [ComfyUI](/pl/providers/comfy)
- [DeepSeek](/pl/providers/deepseek)
- [ds4 (lokalny DeepSeek V4)](/pl/providers/ds4)
- [ElevenLabs](/pl/providers/elevenlabs)
- [fal](/pl/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/pl/providers/fireworks)
- [GitHub Copilot](/pl/providers/github-copilot)
- [GMI Cloud](/pl/providers/gmi)
- [Google (Gemini)](/pl/providers/google)
- [Gradium](/pl/providers/gradium)
- [Groq (wnioskowanie LPU)](/pl/providers/groq)
- [Hugging Face (wnioskowanie)](/pl/providers/huggingface)
- [inferrs (modele lokalne)](/pl/providers/inferrs)
- [Kilocode](/pl/providers/kilocode)
- [LiteLLM (ujednolicony Gateway)](/pl/providers/litellm)
- [LM Studio (modele lokalne)](/pl/providers/lmstudio)
- [LongCat](/pl/providers/longcat)
- [MiniMax](/pl/providers/minimax)
- [Mistral](/pl/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
- [NovitaAI](/pl/providers/novita)
- [NVIDIA](/pl/providers/nvidia)
- [Ollama (modele chmurowe i lokalne)](/pl/providers/ollama)
- [Ollama Cloud](/pl/providers/ollama-cloud)
- [OpenAI (API + Codex)](/pl/providers/openai)
- [OpenCode](/pl/providers/opencode)
- [OpenCode Go](/pl/providers/opencode-go)
- [OpenRouter](/pl/providers/openrouter)
- [Perplexity (wyszukiwanie w internecie)](/pl/providers/perplexity-provider)
- [Qianfan](/pl/providers/qianfan)
- [Qwen Cloud](/pl/providers/qwen)
- [Qwen OAuth / Portal](/pl/providers/qwen-oauth)
- [Runway](/pl/providers/runway)
- [SenseAudio](/pl/providers/senseaudio)
- [SGLang (modele lokalne)](/pl/providers/sglang)
- [StepFun](/pl/providers/stepfun)
- [Synthetic](/pl/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/pl/providers/tencent)
- [Together AI](/pl/providers/together)
- [Venice (Venice AI, z naciskiem na prywatność)](/pl/providers/venice)
- [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
- [vLLM (modele lokalne)](/pl/providers/vllm)
- [Volcengine (Doubao)](/pl/providers/volcengine)
- [Vydra](/pl/providers/vydra)
- [xAI](/pl/providers/xai)
- [Xiaomi](/pl/providers/xiaomi)
- [Z.AI (GLM)](/pl/providers/zai)

## Wspólne strony przeglądowe

- [Dodatkowe warianty dostawców](/pl/providers/models#additional-provider-variants) — Anthropic Vertex, Copilot Proxy i Gemini CLI OAuth
- [Generowanie obrazów](/pl/tools/image-generation) — wspólne narzędzie `image_generate`, wybór dostawcy i przełączanie awaryjne
- [Generowanie muzyki](/pl/tools/music-generation) — wspólne narzędzie `music_generate`, wybór dostawcy i przełączanie awaryjne
- [Generowanie wideo](/pl/tools/video-generation) — wspólne narzędzie `video_generate`, wybór dostawcy i przełączanie awaryjne

## Dostawcy transkrypcji

- [Deepgram (transkrypcja dźwięku)](/pl/providers/deepgram)
- [ElevenLabs](/pl/providers/elevenlabs#speech-to-text)
- [Mistral](/pl/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/pl/providers/openai)
- [SenseAudio](/pl/providers/senseaudio)
- [xAI](/pl/providers/xai)

## Narzędzia społeczności

- [Claude Max API Proxy](/pl/providers/claude-max-api-proxy) — społecznościowy serwer proxy dla danych uwierzytelniających subskrypcji Claude (przed użyciem sprawdź zasady i warunki Anthropic)

Pełny katalog dostawców (xAI, Groq, Mistral itp.) oraz zaawansowaną konfigurację
znajdziesz na stronie [Dostawcy modeli](/pl/concepts/model-providers).
