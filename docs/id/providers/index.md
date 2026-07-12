---
read_when:
    - Anda ingin memilih penyedia model
    - Anda memerlukan ikhtisar singkat tentang backend LLM yang didukung
summary: Penyedia model (LLM) yang didukung oleh OpenClaw
title: Direktori penyedia
x-i18n:
    generated_at: "2026-07-12T14:35:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw dapat menggunakan banyak penyedia LLM. Pilih penyedia, lakukan autentikasi, lalu tetapkan
model default sebagai `provider/model`.

Mencari dokumentasi saluran obrolan (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/dll.)? Lihat [Saluran](/id/channels).

## Mulai cepat

1. Lakukan autentikasi dengan penyedia (biasanya melalui `openclaw onboard`).
2. Tetapkan model default:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Dokumentasi penyedia

- [Alibaba Model Studio](/id/providers/alibaba)
- [Amazon Bedrock](/id/providers/bedrock)
- [Amazon Bedrock Mantle](/id/providers/bedrock-mantle)
- [Anthropic (API + CLI Claude)](/id/providers/anthropic)
- [Arcee AI (model Trinity)](/id/providers/arcee)
- [Azure Speech](/id/providers/azure-speech)
- [BytePlus (Internasional)](/id/concepts/model-providers#byteplus-international)
- [Cerebras](/id/providers/cerebras)
- [Chutes](/id/providers/chutes)
- [ClawRouter (perutean multi-penyedia terkelola)](/id/providers/clawrouter)
- [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
- [Cohere](/id/providers/cohere)
- [ComfyUI](/id/providers/comfy)
- [DeepSeek](/id/providers/deepseek)
- [ds4 (DeepSeek V4 lokal)](/id/providers/ds4)
- [ElevenLabs](/id/providers/elevenlabs)
- [fal](/id/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/id/providers/fireworks)
- [GitHub Copilot](/id/providers/github-copilot)
- [GMI Cloud](/id/providers/gmi)
- [Google (Gemini)](/id/providers/google)
- [Gradium](/id/providers/gradium)
- [Groq (inferensi LPU)](/id/providers/groq)
- [Hugging Face (Inferensi)](/id/providers/huggingface)
- [inferrs (model lokal)](/id/providers/inferrs)
- [Kilocode](/id/providers/kilocode)
- [LiteLLM (Gateway terpadu)](/id/providers/litellm)
- [LM Studio (model lokal)](/id/providers/lmstudio)
- [LongCat](/id/providers/longcat)
- [MiniMax](/id/providers/minimax)
- [Mistral](/id/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
- [NovitaAI](/id/providers/novita)
- [NVIDIA](/id/providers/nvidia)
- [Ollama (model cloud + lokal)](/id/providers/ollama)
- [Ollama Cloud](/id/providers/ollama-cloud)
- [OpenAI (API + Codex)](/id/providers/openai)
- [OpenCode](/id/providers/opencode)
- [OpenCode Go](/id/providers/opencode-go)
- [OpenRouter](/id/providers/openrouter)
- [Perplexity (pencarian web)](/id/providers/perplexity-provider)
- [Qianfan](/id/providers/qianfan)
- [Qwen Cloud](/id/providers/qwen)
- [Qwen OAuth / Portal](/id/providers/qwen-oauth)
- [Runway](/id/providers/runway)
- [SenseAudio](/id/providers/senseaudio)
- [SGLang (model lokal)](/id/providers/sglang)
- [StepFun](/id/providers/stepfun)
- [Synthetic](/id/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/id/providers/tencent)
- [Together AI](/id/providers/together)
- [Venice (Venice AI, berfokus pada privasi)](/id/providers/venice)
- [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
- [vLLM (model lokal)](/id/providers/vllm)
- [Volcengine (Doubao)](/id/providers/volcengine)
- [Vydra](/id/providers/vydra)
- [xAI](/id/providers/xai)
- [Xiaomi](/id/providers/xiaomi)
- [Z.AI (GLM)](/id/providers/zai)

## Halaman ikhtisar bersama

- [Varian penyedia tambahan](/id/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy, dan OAuth CLI Gemini
- [Pembuatan Gambar](/id/tools/image-generation) - Alat bersama `image_generate`, pemilihan penyedia, dan pengalihan saat gagal
- [Pembuatan Musik](/id/tools/music-generation) - Alat bersama `music_generate`, pemilihan penyedia, dan pengalihan saat gagal
- [Pembuatan Video](/id/tools/video-generation) - Alat bersama `video_generate`, pemilihan penyedia, dan pengalihan saat gagal

## Penyedia transkripsi

- [Deepgram (transkripsi audio)](/id/providers/deepgram)
- [ElevenLabs](/id/providers/elevenlabs#speech-to-text)
- [Mistral](/id/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/id/providers/openai)
- [SenseAudio](/id/providers/senseaudio)
- [xAI](/id/providers/xai)

## Alat komunitas

- [Claude Max API Proxy](/id/providers/claude-max-api-proxy) - Proksi komunitas untuk kredensial langganan Claude (verifikasi kebijakan/ketentuan Anthropic sebelum digunakan)

Untuk katalog penyedia lengkap (xAI, Groq, Mistral, dll.) dan konfigurasi lanjutan,
lihat [Penyedia model](/id/concepts/model-providers).
