---
read_when:
    - می‌خواهید یک ارائه‌دهندهٔ مدل انتخاب کنید
    - به یک نمای کلی سریع از بک‌اندهای LLM پشتیبانی‌شده نیاز دارید
summary: ارائه‌دهندگان مدل (مدل‌های زبانی بزرگ) که OpenClaw از آن‌ها پشتیبانی می‌کند
title: فهرست ارائه‌دهندگان
x-i18n:
    generated_at: "2026-04-29T23:25:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61143200b2e7a74392cf8871bfcd210fe35dbd5118e2e8bc7b15265192fd2bde
    source_path: providers/index.md
    workflow: 16
---

# ارائه‌دهندگان مدل

OpenClaw می‌تواند از ارائه‌دهندگان LLM متعددی استفاده کند. یک ارائه‌دهنده را انتخاب کنید، احراز هویت کنید، سپس مدل پیش‌فرض را به‌صورت `provider/model` تنظیم کنید.

به‌دنبال مستندات کانال‌های چت (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/و غیره) هستید؟ [کانال‌ها](/fa/channels) را ببینید.

## شروع سریع

1. با ارائه‌دهنده احراز هویت کنید (معمولاً از طریق `openclaw onboard`).
2. مدل پیش‌فرض را تنظیم کنید:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## مستندات ارائه‌دهندگان

- [Alibaba Model Studio](/fa/providers/alibaba)
- [Amazon Bedrock](/fa/providers/bedrock)
- [Amazon Bedrock Mantle](/fa/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/fa/providers/anthropic)
- [Arcee AI (مدل‌های Trinity)](/fa/providers/arcee)
- [Azure Speech](/fa/providers/azure-speech)
- [BytePlus (بین‌المللی)](/fa/concepts/model-providers#byteplus-international)
- [Cerebras](/fa/providers/cerebras)
- [Chutes](/fa/providers/chutes)
- [Cloudflare AI Gateway](/fa/providers/cloudflare-ai-gateway)
- [ComfyUI](/fa/providers/comfy)
- [DeepSeek](/fa/providers/deepseek)
- [ElevenLabs](/fa/providers/elevenlabs)
- [fal](/fa/providers/fal)
- [Fireworks](/fa/providers/fireworks)
- [GitHub Copilot](/fa/providers/github-copilot)
- [مدل‌های GLM](/fa/providers/glm)
- [Google (Gemini)](/fa/providers/google)
- [Gradium](/fa/providers/gradium)
- [Groq (استنتاج LPU)](/fa/providers/groq)
- [Hugging Face (استنتاج)](/fa/providers/huggingface)
- [inferrs (مدل‌های محلی)](/fa/providers/inferrs)
- [Kilocode](/fa/providers/kilocode)
- [LiteLLM (Gateway یکپارچه)](/fa/providers/litellm)
- [LM Studio (مدل‌های محلی)](/fa/providers/lmstudio)
- [MiniMax](/fa/providers/minimax)
- [Mistral](/fa/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot)
- [NVIDIA](/fa/providers/nvidia)
- [Ollama (ابر + مدل‌های محلی)](/fa/providers/ollama)
- [OpenAI (API + Codex)](/fa/providers/openai)
- [OpenCode](/fa/providers/opencode)
- [OpenCode Go](/fa/providers/opencode-go)
- [OpenRouter](/fa/providers/openrouter)
- [Perplexity (جست‌وجوی وب)](/fa/providers/perplexity-provider)
- [Qianfan](/fa/providers/qianfan)
- [Qwen Cloud](/fa/providers/qwen)
- [Runway](/fa/providers/runway)
- [SenseAudio](/fa/providers/senseaudio)
- [SGLang (مدل‌های محلی)](/fa/providers/sglang)
- [StepFun](/fa/providers/stepfun)
- [Synthetic](/fa/providers/synthetic)
- [Tencent Cloud (TokenHub)](/fa/providers/tencent)
- [Together AI](/fa/providers/together)
- [Venice (Venice AI، متمرکز بر حریم خصوصی)](/fa/providers/venice)
- [Vercel AI Gateway](/fa/providers/vercel-ai-gateway)
- [vLLM (مدل‌های محلی)](/fa/providers/vllm)
- [Volcengine (Doubao)](/fa/providers/volcengine)
- [Vydra](/fa/providers/vydra)
- [xAI](/fa/providers/xai)
- [Xiaomi](/fa/providers/xiaomi)
- [Z.AI](/fa/providers/zai)

## صفحه‌های نمای کلی مشترک

- [گونه‌های همراه اضافی](/fa/providers/models#additional-bundled-provider-variants) - Anthropic Vertex، Copilot Proxy، و Gemini CLI OAuth
- [تولید تصویر](/fa/tools/image-generation) - ابزار مشترک `image_generate`، انتخاب ارائه‌دهنده، و جایگزینی در صورت خرابی
- [تولید موسیقی](/fa/tools/music-generation) - ابزار مشترک `music_generate`، انتخاب ارائه‌دهنده، و جایگزینی در صورت خرابی
- [تولید ویدئو](/fa/tools/video-generation) - ابزار مشترک `video_generate`، انتخاب ارائه‌دهنده، و جایگزینی در صورت خرابی

## ارائه‌دهندگان رونویسی

- [Deepgram (رونویسی صوت)](/fa/providers/deepgram)
- [ElevenLabs](/fa/providers/elevenlabs#speech-to-text)
- [Mistral](/fa/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/fa/providers/openai#speech-to-text)
- [SenseAudio](/fa/providers/senseaudio)
- [xAI](/fa/providers/xai#speech-to-text)

## ابزارهای جامعه

- [Claude Max API Proxy](/fa/providers/claude-max-api-proxy) - پروکسی جامعه برای اعتبارنامه‌های اشتراک Claude (پیش از استفاده، سیاست/شرایط Anthropic را بررسی کنید)

برای کاتالوگ کامل ارائه‌دهندگان (xAI، Groq، Mistral، و غیره) و پیکربندی پیشرفته، [ارائه‌دهندگان مدل](/fa/concepts/model-providers) را ببینید.
