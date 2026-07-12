---
read_when:
    - تريد اختيار موفّر للنموذج
    - تحتاج إلى نظرة عامة سريعة على واجهات LLM الخلفية المدعومة
summary: موفّرو النماذج (نماذج اللغة الكبيرة) المدعومون من OpenClaw
title: دليل المزوّدين
x-i18n:
    generated_at: "2026-07-12T06:22:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام العديد من مزوّدي نماذج اللغة الكبيرة. اختر مزوّدًا، وأجرِ المصادقة، ثم عيّن
النموذج الافتراضي بصيغة `provider/model`.

هل تبحث عن وثائق قنوات الدردشة (WhatsApp/Telegram/Discord/Slack/Mattermost ‏(Plugin)/إلخ)؟ راجع [القنوات](/ar/channels).

## البدء السريع

1. أجرِ المصادقة لدى المزوّد (عادةً عبر `openclaw onboard`).
2. عيّن النموذج الافتراضي:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## وثائق المزوّدين

- [Alibaba Model Studio](/ar/providers/alibaba)
- [Amazon Bedrock](/ar/providers/bedrock)
- [Amazon Bedrock Mantle](/ar/providers/bedrock-mantle)
- [Anthropic ‏(API + Claude CLI)](/ar/providers/anthropic)
- [Arcee AI ‏(نماذج Trinity)](/ar/providers/arcee)
- [Azure Speech](/ar/providers/azure-speech)
- [BytePlus ‏(الدولي)](/ar/concepts/model-providers#byteplus-international)
- [Cerebras](/ar/providers/cerebras)
- [Chutes](/ar/providers/chutes)
- [ClawRouter ‏(توجيه مُدار متعدد المزوّدين)](/ar/providers/clawrouter)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [Cohere](/ar/providers/cohere)
- [ComfyUI](/ar/providers/comfy)
- [DeepSeek](/ar/providers/deepseek)
- [ds4 ‏(DeepSeek V4 محلي)](/ar/providers/ds4)
- [ElevenLabs](/ar/providers/elevenlabs)
- [fal](/ar/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/ar/providers/fireworks)
- [GitHub Copilot](/ar/providers/github-copilot)
- [GMI Cloud](/ar/providers/gmi)
- [Google ‏(Gemini)](/ar/providers/google)
- [Gradium](/ar/providers/gradium)
- [Groq ‏(استدلال LPU)](/ar/providers/groq)
- [Hugging Face ‏(الاستدلال)](/ar/providers/huggingface)
- [inferrs ‏(نماذج محلية)](/ar/providers/inferrs)
- [Kilocode](/ar/providers/kilocode)
- [LiteLLM ‏(Gateway موحّد)](/ar/providers/litellm)
- [LM Studio ‏(نماذج محلية)](/ar/providers/lmstudio)
- [LongCat](/ar/providers/longcat)
- [MiniMax](/ar/providers/minimax)
- [Mistral](/ar/providers/mistral)
- [Moonshot AI ‏(Kimi + Kimi Coding)](/ar/providers/moonshot)
- [NovitaAI](/ar/providers/novita)
- [NVIDIA](/ar/providers/nvidia)
- [Ollama ‏(نماذج سحابية ومحلية)](/ar/providers/ollama)
- [Ollama Cloud](/ar/providers/ollama-cloud)
- [OpenAI ‏(API + Codex)](/ar/providers/openai)
- [OpenCode](/ar/providers/opencode)
- [OpenCode Go](/ar/providers/opencode-go)
- [OpenRouter](/ar/providers/openrouter)
- [Perplexity ‏(البحث على الويب)](/ar/providers/perplexity-provider)
- [Qianfan](/ar/providers/qianfan)
- [Qwen Cloud](/ar/providers/qwen)
- [Qwen OAuth / Portal](/ar/providers/qwen-oauth)
- [Runway](/ar/providers/runway)
- [SenseAudio](/ar/providers/senseaudio)
- [SGLang ‏(نماذج محلية)](/ar/providers/sglang)
- [StepFun](/ar/providers/stepfun)
- [Synthetic](/ar/providers/synthetic)
- [Tencent Cloud ‏(TokenHub / TokenPlan)](/ar/providers/tencent)
- [Together AI](/ar/providers/together)
- [Venice ‏(Venice AI، يركّز على الخصوصية)](/ar/providers/venice)
- [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
- [vLLM ‏(نماذج محلية)](/ar/providers/vllm)
- [Volcengine ‏(Doubao)](/ar/providers/volcengine)
- [Vydra](/ar/providers/vydra)
- [xAI](/ar/providers/xai)
- [Xiaomi](/ar/providers/xiaomi)
- [Z.AI ‏(GLM)](/ar/providers/zai)

## صفحات النظرة العامة المشتركة

- [أنواع إضافية من المزوّدين](/ar/providers/models#additional-provider-variants) - ‏Anthropic Vertex وCopilot Proxy ومصادقة Gemini CLI عبر OAuth
- [توليد الصور](/ar/tools/image-generation) - أداة `image_generate` المشتركة واختيار المزوّد والتحويل التلقائي عند التعطّل
- [توليد الموسيقى](/ar/tools/music-generation) - أداة `music_generate` المشتركة واختيار المزوّد والتحويل التلقائي عند التعطّل
- [توليد الفيديو](/ar/tools/video-generation) - أداة `video_generate` المشتركة واختيار المزوّد والتحويل التلقائي عند التعطّل

## مزوّدو النسخ الصوتي

- [Deepgram ‏(النسخ الصوتي)](/ar/providers/deepgram)
- [ElevenLabs](/ar/providers/elevenlabs#speech-to-text)
- [Mistral](/ar/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ar/providers/openai)
- [SenseAudio](/ar/providers/senseaudio)
- [xAI](/ar/providers/xai)

## أدوات المجتمع

- [Claude Max API Proxy](/ar/providers/claude-max-api-proxy) - وكيل مجتمعي لبيانات اعتماد اشتراك Claude (تحقّق من سياسة Anthropic وشروطها قبل الاستخدام)

للاطلاع على الكتالوج الكامل للمزوّدين (xAI وGroq وMistral وغيرها) والإعدادات المتقدمة،
راجع [مزوّدي النماذج](/ar/concepts/model-providers).
