---
read_when:
    - Chcesz wybrać dostawcę modelu
    - Potrzebujesz szybkiego przeglądu obsługiwanych backendów LLM
summary: Dostawcy modeli (LLM) obsługiwani przez OpenClaw
title: Katalog dostawców
x-i18n:
    generated_at: "2026-06-27T18:12:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a340f6a48f6f1d50116316f9679b009365cd617b3453ebd9b2b31e70f6b94c31
    source_path: providers/index.md
    workflow: 16
---

OpenClaw może używać wielu dostawców LLM. Wybierz dostawcę, uwierzytelnij się, a następnie ustaw
domyślny model jako `provider/model`.

Szukasz dokumentacji kanałów czatu (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/itp.)? Zobacz [Kanały](/pl/channels).

## Szybki start

1. Uwierzytelnij się u dostawcy (zwykle przez `openclaw onboard`).
2. Ustaw domyślny model:

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
- [BytePlus (międzynarodowy)](/pl/concepts/model-providers#byteplus-international)
- [Cerebras](/pl/providers/cerebras)
- [Chutes](/pl/providers/chutes)
- [Cohere](/pl/providers/cohere)
- [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
- [ComfyUI](/pl/providers/comfy)
- [DeepSeek](/pl/providers/deepseek)
- [ds4 (lokalny DeepSeek V4)](/pl/providers/ds4)
- [ElevenLabs](/pl/providers/elevenlabs)
- [fal](/pl/providers/fal)
- [Fireworks](/pl/providers/fireworks)
- [GitHub Copilot](/pl/providers/github-copilot)
- [GMI Cloud](/pl/providers/gmi)
- [Google (Gemini)](/pl/providers/google)
- [Gradium](/pl/providers/gradium)
- [Groq (inferencja LPU)](/pl/providers/groq)
- [Hugging Face (inferencja)](/pl/providers/huggingface)
- [inferrs (modele lokalne)](/pl/providers/inferrs)
- [Kilocode](/pl/providers/kilocode)
- [LiteLLM (zunifikowany Gateway)](/pl/providers/litellm)
- [LM Studio (modele lokalne)](/pl/providers/lmstudio)
- [MiniMax](/pl/providers/minimax)
- [Mistral](/pl/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
- [NVIDIA](/pl/providers/nvidia)
- [NovitaAI](/pl/providers/novita)
- [Ollama (chmura + modele lokalne)](/pl/providers/ollama)
- [Ollama Cloud](/pl/providers/ollama-cloud)
- [OpenAI (API + Codex)](/pl/providers/openai)
- [OpenCode](/pl/providers/opencode)
- [OpenCode Go](/pl/providers/opencode-go)
- [OpenRouter](/pl/providers/openrouter)
- [Perplexity (wyszukiwanie w sieci)](/pl/providers/perplexity-provider)
- [Qianfan](/pl/providers/qianfan)
- [Qwen Cloud](/pl/providers/qwen)
- [Qwen OAuth / Portal](/pl/providers/qwen-oauth)
- [Runway](/pl/providers/runway)
- [SenseAudio](/pl/providers/senseaudio)
- [SGLang (modele lokalne)](/pl/providers/sglang)
- [StepFun](/pl/providers/stepfun)
- [Synthetic](/pl/providers/synthetic)
- [Tencent Cloud (TokenHub)](/pl/providers/tencent)
- [Together AI](/pl/providers/together)
- [Venice (Venice AI, ukierunkowany na prywatność)](/pl/providers/venice)
- [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
- [vLLM (modele lokalne)](/pl/providers/vllm)
- [Volcengine (Doubao)](/pl/providers/volcengine)
- [Vydra](/pl/providers/vydra)
- [xAI](/pl/providers/xai)
- [Xiaomi](/pl/providers/xiaomi)
- [Z.AI (GLM)](/pl/providers/zai)

## Wspólne strony przeglądowe

- [Dodatkowe dołączone warianty](/pl/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy i Gemini CLI OAuth
- [Generowanie obrazów](/pl/tools/image-generation) - Wspólne narzędzie `image_generate`, wybór dostawcy i przełączanie awaryjne
- [Generowanie muzyki](/pl/tools/music-generation) - Wspólne narzędzie `music_generate`, wybór dostawcy i przełączanie awaryjne
- [Generowanie wideo](/pl/tools/video-generation) - Wspólne narzędzie `video_generate`, wybór dostawcy i przełączanie awaryjne

## Dostawcy transkrypcji

- [Deepgram (transkrypcja audio)](/pl/providers/deepgram)
- [ElevenLabs](/pl/providers/elevenlabs#speech-to-text)
- [Mistral](/pl/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/pl/providers/openai#speech-to-text)
- [SenseAudio](/pl/providers/senseaudio)
- [xAI](/pl/providers/xai#speech-to-text)

## Narzędzia społeczności

- [Claude Max API Proxy](/pl/providers/claude-max-api-proxy) - Społecznościowy proxy dla danych uwierzytelniających subskrypcji Claude (przed użyciem sprawdź zasady/warunki Anthropic)

Pełny katalog dostawców (xAI, Groq, Mistral itp.) i zaawansowaną konfigurację
znajdziesz w [Dostawcy modeli](/pl/concepts/model-providers).
