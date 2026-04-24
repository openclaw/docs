---
read_when:
    - تريد اختيار مزود نموذج
    - تحتاج إلى نظرة عامة سريعة على خلفيات LLM المدعومة
summary: مزودو النماذج (LLMs) المدعومون في OpenClaw
title: دليل Providers
x-i18n:
    generated_at: "2026-04-24T07:59:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e76c2688398e12a4467327505bf5fe8b40cf66c74a66dd586c0ccadd50e6705
    source_path: providers/index.md
    workflow: 15
---

# مزودو النماذج

يمكن لـ OpenClaw استخدام العديد من مزودي LLM. اختر مزودًا، ثم قم بالمصادقة، ثم اضبط
النموذج الافتراضي بالشكل `provider/model`.

هل تبحث عن وثائق قنوات الدردشة (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/إلخ)؟ راجع [القنوات](/ar/channels).

## بدء سريع

1. صادق مع المزود (عادةً عبر `openclaw onboard`).
2. اضبط النموذج الافتراضي:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## وثائق المزودين

- [Alibaba Model Studio](/ar/providers/alibaba)
- [Amazon Bedrock](/ar/providers/bedrock)
- [Amazon Bedrock Mantle](/ar/providers/bedrock-mantle)
- [Anthropic ‏(API + Claude CLI)](/ar/providers/anthropic)
- [Arcee AI ‏(نماذج Trinity)](/ar/providers/arcee)
- [BytePlus ‏(دولي)](/ar/concepts/model-providers#byteplus-international)
- [Chutes](/ar/providers/chutes)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [ComfyUI](/ar/providers/comfy)
- [DeepSeek](/ar/providers/deepseek)
- [ElevenLabs](/ar/providers/elevenlabs)
- [fal](/ar/providers/fal)
- [Fireworks](/ar/providers/fireworks)
- [GitHub Copilot](/ar/providers/github-copilot)
- [نماذج GLM](/ar/providers/glm)
- [Google ‏(Gemini)](/ar/providers/google)
- [Groq ‏(استدلال LPU)](/ar/providers/groq)
- [Hugging Face ‏(Inference)](/ar/providers/huggingface)
- [inferrs ‏(نماذج محلية)](/ar/providers/inferrs)
- [Kilocode](/ar/providers/kilocode)
- [LiteLLM ‏(بوابة موحدة)](/ar/providers/litellm)
- [LM Studio ‏(نماذج محلية)](/ar/providers/lmstudio)
- [MiniMax](/ar/providers/minimax)
- [Mistral](/ar/providers/mistral)
- [Moonshot AI ‏(Kimi + Kimi Coding)](/ar/providers/moonshot)
- [NVIDIA](/ar/providers/nvidia)
- [Ollama ‏(نماذج سحابية + محلية)](/ar/providers/ollama)
- [OpenAI ‏(API + Codex)](/ar/providers/openai)
- [OpenCode](/ar/providers/opencode)
- [OpenCode Go](/ar/providers/opencode-go)
- [OpenRouter](/ar/providers/openrouter)
- [Perplexity ‏(بحث الويب)](/ar/providers/perplexity-provider)
- [Qianfan](/ar/providers/qianfan)
- [Qwen Cloud](/ar/providers/qwen)
- [Runway](/ar/providers/runway)
- [SGLang ‏(نماذج محلية)](/ar/providers/sglang)
- [StepFun](/ar/providers/stepfun)
- [Synthetic](/ar/providers/synthetic)
- [Tencent Cloud ‏(TokenHub)](/ar/providers/tencent)
- [Together AI](/ar/providers/together)
- [Venice ‏(Venice AI، يركز على الخصوصية)](/ar/providers/venice)
- [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
- [vLLM ‏(نماذج محلية)](/ar/providers/vllm)
- [Volcengine ‏(Doubao)](/ar/providers/volcengine)
- [Vydra](/ar/providers/vydra)
- [xAI](/ar/providers/xai)
- [Xiaomi](/ar/providers/xiaomi)
- [Z.AI](/ar/providers/zai)

## صفحات النظرة العامة المشتركة

- [المتغيرات المضمنة الإضافية](/ar/providers/models#additional-bundled-provider-variants) - Anthropic Vertex، وCopilot Proxy، وGemini CLI OAuth
- [توليد الصور](/ar/tools/image-generation) - الأداة المشتركة `image_generate`، واختيار المزود، وfailover
- [توليد الموسيقى](/ar/tools/music-generation) - الأداة المشتركة `music_generate`، واختيار المزود، وfailover
- [توليد الفيديو](/ar/tools/video-generation) - الأداة المشتركة `video_generate`، واختيار المزود، وfailover

## مزودو التحويل إلى نص

- [Deepgram ‏(تحويل الصوت إلى نص)](/ar/providers/deepgram)
- [ElevenLabs](/ar/providers/elevenlabs#speech-to-text)
- [Mistral](/ar/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ar/providers/openai#speech-to-text)
- [xAI](/ar/providers/xai#speech-to-text)

## أدوات المجتمع

- [Claude Max API Proxy](/ar/providers/claude-max-api-proxy) - وكيل مجتمعي لبيانات اعتماد اشتراك Claude ‏(تحقق من سياسة/شروط Anthropic قبل الاستخدام)

للحصول على فهرس المزودين الكامل (xAI، وGroq، وMistral، وغير ذلك) والإعدادات المتقدمة،
راجع [مزودو النماذج](/ar/concepts/model-providers).
