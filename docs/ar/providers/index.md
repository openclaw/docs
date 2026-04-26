---
read_when:
    - أنت تريد اختيار مزوّد نماذج
    - أنت بحاجة إلى نظرة عامة سريعة على الواجهات الخلفية المدعومة لـ LLMs
summary: مزوّدو النماذج (LLMs) المدعومون في OpenClaw
title: دليل المزوّدين
x-i18n:
    generated_at: "2026-04-26T11:39:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5d3bf5b30bd7a1dbd8b1348f4f07f178fea9bfea523afa96cad2a30d566a139
    source_path: providers/index.md
    workflow: 15
---

# مزوّدو النماذج

يمكن لـ OpenClaw استخدام العديد من مزوّدي LLM. اختر مزوّدًا، ثم قم بالمصادقة، ثم اضبط
النموذج الافتراضي على هيئة `provider/model`.

هل تبحث عن وثائق قنوات الدردشة (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/إلخ.)؟ راجع [القنوات](/ar/channels).

## البدء السريع

1. قم بالمصادقة مع المزوّد (عادةً عبر `openclaw onboard`).
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
- [BytePlus (الدولي)](/ar/concepts/model-providers#byteplus-international)
- [Chutes](/ar/providers/chutes)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [ComfyUI](/ar/providers/comfy)
- [DeepSeek](/ar/providers/deepseek)
- [ElevenLabs](/ar/providers/elevenlabs)
- [fal](/ar/providers/fal)
- [Fireworks](/ar/providers/fireworks)
- [GitHub Copilot](/ar/providers/github-copilot)
- [Gradium](/ar/providers/gradium)
- [نماذج GLM](/ar/providers/glm)
- [Google (Gemini)](/ar/providers/google)
- [Groq (استدلال LPU)](/ar/providers/groq)
- [Hugging Face (الاستدلال)](/ar/providers/huggingface)
- [inferrs (النماذج المحلية)](/ar/providers/inferrs)
- [Kilocode](/ar/providers/kilocode)
- [LiteLLM (بوابة موحدة)](/ar/providers/litellm)
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
- [Venice (Venice AI، مع تركيز على الخصوصية)](/ar/providers/venice)
- [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
- [vLLM (النماذج المحلية)](/ar/providers/vllm)
- [Volcengine (Doubao)](/ar/providers/volcengine)
- [Vydra](/ar/providers/vydra)
- [xAI](/ar/providers/xai)
- [Xiaomi](/ar/providers/xiaomi)
- [Z.AI](/ar/providers/zai)

## صفحات النظرة العامة المشتركة

- [المتغيرات المضمنة الإضافية](/ar/providers/models#additional-bundled-provider-variants) - Anthropic Vertex، وCopilot Proxy، وGemini CLI OAuth
- [إنشاء الصور](/ar/tools/image-generation) - أداة `image_generate` المشتركة، واختيار المزوّد، والرجوع الاحتياطي
- [إنشاء الموسيقى](/ar/tools/music-generation) - أداة `music_generate` المشتركة، واختيار المزوّد، والرجوع الاحتياطي
- [إنشاء الفيديو](/ar/tools/video-generation) - أداة `video_generate` المشتركة، واختيار المزوّد، والرجوع الاحتياطي

## مزوّدو النسخ

- [Deepgram (نسخ صوتي)](/ar/providers/deepgram)
- [ElevenLabs](/ar/providers/elevenlabs#speech-to-text)
- [Mistral](/ar/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ar/providers/openai#speech-to-text)
- [SenseAudio](/ar/providers/senseaudio)
- [xAI](/ar/providers/xai#speech-to-text)

## أدوات المجتمع

- [Claude Max API Proxy](/ar/providers/claude-max-api-proxy) - proxy مجتمعي لبيانات اعتماد اشتراك Claude ‏(تحقق من سياسة/شروط Anthropic قبل الاستخدام)

للاطلاع على كتالوج المزوّدين الكامل (xAI، وGroq، وMistral، وغير ذلك) والتكوين المتقدم،
راجع [مزوّدو النماذج](/ar/concepts/model-providers).
