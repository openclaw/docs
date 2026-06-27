---
read_when:
    - تريد اختيار مزوّد نموذج
    - تحتاج إلى نظرة عامة سريعة على واجهات LLM الخلفية المدعومة
summary: موفرو النماذج (LLMs) المدعومون من OpenClaw
title: دليل المزوّدين
x-i18n:
    generated_at: "2026-06-27T18:25:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a340f6a48f6f1d50116316f9679b009365cd617b3453ebd9b2b31e70f6b94c31
    source_path: providers/index.md
    workflow: 16
---

OpenClaw يمكنه استخدام العديد من مزوّدي LLM. اختر مزوّدًا، ثم صادِق، ثم اضبط
النموذج الافتراضي بصيغة `provider/model`.

هل تبحث عن وثائق قنوات الدردشة (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/وغيرها)؟ راجع [القنوات](/ar/channels).

## البدء السريع

1. صادِق مع المزوّد (عادة عبر `openclaw onboard`).
2. اضبط النموذج الافتراضي:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## وثائق المزوّدين

- [Alibaba Model Studio](/ar/providers/alibaba)
- [Amazon Bedrock](/ar/providers/bedrock)
- [Amazon Bedrock Mantle](/ar/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/ar/providers/anthropic)
- [Arcee AI (نماذج Trinity)](/ar/providers/arcee)
- [Azure Speech](/ar/providers/azure-speech)
- [BytePlus (دولي)](/ar/concepts/model-providers#byteplus-international)
- [Cerebras](/ar/providers/cerebras)
- [Chutes](/ar/providers/chutes)
- [Cohere](/ar/providers/cohere)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [ComfyUI](/ar/providers/comfy)
- [DeepSeek](/ar/providers/deepseek)
- [ds4 (DeepSeek V4 محلي)](/ar/providers/ds4)
- [ElevenLabs](/ar/providers/elevenlabs)
- [fal](/ar/providers/fal)
- [Fireworks](/ar/providers/fireworks)
- [GitHub Copilot](/ar/providers/github-copilot)
- [GMI Cloud](/ar/providers/gmi)
- [Google (Gemini)](/ar/providers/google)
- [Gradium](/ar/providers/gradium)
- [Groq (استدلال LPU)](/ar/providers/groq)
- [Hugging Face (الاستدلال)](/ar/providers/huggingface)
- [inferrs (نماذج محلية)](/ar/providers/inferrs)
- [Kilocode](/ar/providers/kilocode)
- [LiteLLM (Gateway موحّد)](/ar/providers/litellm)
- [LM Studio (نماذج محلية)](/ar/providers/lmstudio)
- [MiniMax](/ar/providers/minimax)
- [Mistral](/ar/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
- [NVIDIA](/ar/providers/nvidia)
- [NovitaAI](/ar/providers/novita)
- [Ollama (نماذج سحابية + محلية)](/ar/providers/ollama)
- [Ollama Cloud](/ar/providers/ollama-cloud)
- [OpenAI (API + Codex)](/ar/providers/openai)
- [OpenCode](/ar/providers/opencode)
- [OpenCode Go](/ar/providers/opencode-go)
- [OpenRouter](/ar/providers/openrouter)
- [Perplexity (بحث الويب)](/ar/providers/perplexity-provider)
- [Qianfan](/ar/providers/qianfan)
- [Qwen Cloud](/ar/providers/qwen)
- [Qwen OAuth / Portal](/ar/providers/qwen-oauth)
- [Runway](/ar/providers/runway)
- [SenseAudio](/ar/providers/senseaudio)
- [SGLang (نماذج محلية)](/ar/providers/sglang)
- [StepFun](/ar/providers/stepfun)
- [Synthetic](/ar/providers/synthetic)
- [Tencent Cloud (TokenHub)](/ar/providers/tencent)
- [Together AI](/ar/providers/together)
- [Venice (Venice AI، يركّز على الخصوصية)](/ar/providers/venice)
- [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
- [vLLM (نماذج محلية)](/ar/providers/vllm)
- [Volcengine (Doubao)](/ar/providers/volcengine)
- [Vydra](/ar/providers/vydra)
- [xAI](/ar/providers/xai)
- [Xiaomi](/ar/providers/xiaomi)
- [Z.AI (GLM)](/ar/providers/zai)

## صفحات نظرة عامة مشتركة

- [تنويعات إضافية مضمّنة](/ar/providers/models#additional-bundled-provider-variants) - Anthropic Vertex وCopilot Proxy وGemini CLI OAuth
- [توليد الصور](/ar/tools/image-generation) - أداة `image_generate` المشتركة، واختيار المزوّد، والتحويل عند الفشل
- [توليد الموسيقى](/ar/tools/music-generation) - أداة `music_generate` المشتركة، واختيار المزوّد، والتحويل عند الفشل
- [توليد الفيديو](/ar/tools/video-generation) - أداة `video_generate` المشتركة، واختيار المزوّد، والتحويل عند الفشل

## مزوّدو النسخ

- [Deepgram (نسخ صوتي)](/ar/providers/deepgram)
- [ElevenLabs](/ar/providers/elevenlabs#speech-to-text)
- [Mistral](/ar/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ar/providers/openai#speech-to-text)
- [SenseAudio](/ar/providers/senseaudio)
- [xAI](/ar/providers/xai#speech-to-text)

## أدوات المجتمع

- [Claude Max API Proxy](/ar/providers/claude-max-api-proxy) - وكيل مجتمعي لبيانات اعتماد اشتراك Claude (تحقّق من سياسة/شروط Anthropic قبل الاستخدام)

للاطلاع على كتالوج المزوّدين الكامل (xAI وGroq وMistral وغيرها) والإعدادات المتقدمة،
راجع [مزوّدي النماذج](/ar/concepts/model-providers).
