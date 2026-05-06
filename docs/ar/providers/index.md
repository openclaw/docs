---
read_when:
    - تريد اختيار مزوّد نموذج
    - تحتاج إلى نظرة عامة سريعة على الخدمات الخلفية المدعومة للنماذج اللغوية الكبيرة
summary: موفرو النماذج (نماذج اللغة الكبيرة) الذين يدعمهم OpenClaw
title: دليل المزوّدين
x-i18n:
    generated_at: "2026-05-06T08:10:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc3a15880a5e1881c1a58c60c9ad7e5624350a8db848d03c7cef6ee18c14b81
    source_path: providers/index.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام العديد من موفري LLM. اختر موفرًا، وصادق، ثم عيّن
النموذج الافتراضي بصيغة `provider/model`.

تبحث عن وثائق قنوات الدردشة (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/إلخ)؟ راجع [القنوات](/ar/channels).

## البدء السريع

1. صادق مع الموفر (عادةً عبر `openclaw onboard`).
2. عيّن النموذج الافتراضي:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## وثائق الموفرين

- [Alibaba Model Studio](/ar/providers/alibaba)
- [Amazon Bedrock](/ar/providers/bedrock)
- [Amazon Bedrock Mantle](/ar/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/ar/providers/anthropic)
- [Arcee AI (نماذج Trinity)](/ar/providers/arcee)
- [Azure Speech](/ar/providers/azure-speech)
- [BytePlus (الدولي)](/ar/concepts/model-providers#byteplus-international)
- [Cerebras](/ar/providers/cerebras)
- [Chutes](/ar/providers/chutes)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [ComfyUI](/ar/providers/comfy)
- [DeepSeek](/ar/providers/deepseek)
- [ElevenLabs](/ar/providers/elevenlabs)
- [fal](/ar/providers/fal)
- [Fireworks](/ar/providers/fireworks)
- [GitHub Copilot](/ar/providers/github-copilot)
- [نماذج GLM](/ar/providers/glm)
- [Google (Gemini)](/ar/providers/google)
- [Gradium](/ar/providers/gradium)
- [Groq (استدلال LPU)](/ar/providers/groq)
- [Hugging Face (الاستدلال)](/ar/providers/huggingface)
- [inferrs (النماذج المحلية)](/ar/providers/inferrs)
- [Kilocode](/ar/providers/kilocode)
- [LiteLLM (Gateway موحد)](/ar/providers/litellm)
- [LM Studio (النماذج المحلية)](/ar/providers/lmstudio)
- [MiniMax](/ar/providers/minimax)
- [Mistral](/ar/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
- [NVIDIA](/ar/providers/nvidia)
- [Ollama (النماذج السحابية + المحلية)](/ar/providers/ollama)
- [OpenAI (API + Codex)](/ar/providers/openai)
- [OpenCode](/ar/providers/opencode)
- [OpenCode Go](/ar/providers/opencode-go)
- [OpenRouter](/ar/providers/openrouter)
- [Perplexity (بحث الويب)](/ar/providers/perplexity-provider)
- [Qianfan](/ar/providers/qianfan)
- [Qwen Cloud](/ar/providers/qwen)
- [Runway](/ar/providers/runway)
- [SenseAudio](/ar/providers/senseaudio)
- [SGLang (النماذج المحلية)](/ar/providers/sglang)
- [StepFun](/ar/providers/stepfun)
- [Synthetic](/ar/providers/synthetic)
- [Tencent Cloud (TokenHub)](/ar/providers/tencent)
- [Together AI](/ar/providers/together)
- [Venice (Venice AI، يركز على الخصوصية)](/ar/providers/venice)
- [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
- [vLLM (النماذج المحلية)](/ar/providers/vllm)
- [Volcengine (Doubao)](/ar/providers/volcengine)
- [Vydra](/ar/providers/vydra)
- [xAI](/ar/providers/xai)
- [Xiaomi](/ar/providers/xiaomi)
- [Z.AI](/ar/providers/zai)

## صفحات النظرة العامة المشتركة

- [المتغيرات الإضافية المضمّنة](/ar/providers/models#additional-bundled-provider-variants) - Anthropic Vertex وCopilot Proxy وGemini CLI OAuth
- [إنشاء الصور](/ar/tools/image-generation) - أداة `image_generate` المشتركة، واختيار الموفر، والتجاوز عند الفشل
- [إنشاء الموسيقى](/ar/tools/music-generation) - أداة `music_generate` المشتركة، واختيار الموفر، والتجاوز عند الفشل
- [إنشاء الفيديو](/ar/tools/video-generation) - أداة `video_generate` المشتركة، واختيار الموفر، والتجاوز عند الفشل

## موفرو النسخ الصوتي

- [Deepgram (النسخ الصوتي)](/ar/providers/deepgram)
- [ElevenLabs](/ar/providers/elevenlabs#speech-to-text)
- [Mistral](/ar/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ar/providers/openai#speech-to-text)
- [SenseAudio](/ar/providers/senseaudio)
- [xAI](/ar/providers/xai#speech-to-text)

## أدوات المجتمع

- [Claude Max API Proxy](/ar/providers/claude-max-api-proxy) - وسيط مجتمعي لبيانات اعتماد اشتراك Claude (تحقق من سياسة/شروط Anthropic قبل الاستخدام)

للاطلاع على كتالوج الموفرين الكامل (xAI وGroq وMistral وغيرها) والتهيئة المتقدمة،
راجع [موفري النماذج](/ar/concepts/model-providers).
