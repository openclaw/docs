---
read_when:
    - تريد اختيار موفّر نموذج
    - تريد أمثلة إعداد سريعة لمصادقة LLM + اختيار النموذج
summary: موفرو النماذج (نماذج اللغة الكبيرة) الذين يدعمهم OpenClaw
title: البدء السريع لموفّر النماذج
x-i18n:
    generated_at: "2026-06-27T18:26:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام مزوّدي نماذج لغة كبيرة كثيرين. اختر واحدًا، وصادِق عليه، ثم عيّن النموذج الافتراضي بصيغة `provider/model`.

## البدء السريع (خطوتان)

1. صادِق مع المزوّد (عادةً عبر `openclaw onboard`).
2. عيّن النموذج الافتراضي:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## المزوّدون المدعومون (مجموعة بداية)

- [Alibaba Model Studio](/ar/providers/alibaba)
- [Amazon Bedrock](/ar/providers/bedrock)
- [Anthropic (API + Claude CLI)](/ar/providers/anthropic)
- [BytePlus (International)](/ar/concepts/model-providers#byteplus-international)
- [Chutes](/ar/providers/chutes)
- [Cohere](/ar/providers/cohere)
- [ComfyUI](/ar/providers/comfy)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [DeepInfra](/ar/providers/deepinfra)
- [fal](/ar/providers/fal)
- [Fireworks](/ar/providers/fireworks)
- [MiniMax](/ar/providers/minimax)
- [Mistral](/ar/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ar/providers/moonshot)
- [OpenAI (API + Codex)](/ar/providers/openai)
- [OpenCode (Zen + Go)](/ar/providers/opencode)
- [OpenRouter](/ar/providers/openrouter)
- [Qianfan](/ar/providers/qianfan)
- [Qwen](/ar/providers/qwen)
- [Runway](/ar/providers/runway)
- [StepFun](/ar/providers/stepfun)
- [Synthetic](/ar/providers/synthetic)
- [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/ar/providers/venice)
- [xAI](/ar/providers/xai)
- [Z.AI (GLM)](/ar/providers/zai)

## متغيرات مزوّدين إضافية

- `anthropic-vertex` - ثبّت `@openclaw/anthropic-vertex-provider` لدعم Anthropic الضمني على Google Vertex عند توفر بيانات اعتماد Vertex؛ لا يوجد خيار مصادقة إعداد منفصل
- `copilot-proxy` - جسر VS Code Copilot Proxy المحلي؛ استخدم `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - تدفق OAuth غير رسمي لـ Gemini CLI؛ يتطلب تثبيت `gemini` محليًا (`brew install gemini-cli` أو `npm install -g @google/gemini-cli`)؛ النموذج الافتراضي `google-gemini-cli/gemini-3-flash-preview`؛ استخدم `openclaw onboard --auth-choice google-gemini-cli` أو `openclaw models auth login --provider google-gemini-cli --set-default`

للحصول على كتالوج المزوّدين الكامل (xAI وGroq وMistral وغيرها) والتكوين المتقدم،
راجع [مزوّدي النماذج](/ar/concepts/model-providers).

## ذو صلة

- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)
- [CLI النماذج](/ar/cli/models)
