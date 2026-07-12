---
read_when:
    - تريد اختيار موفّر نموذج
    - تريد أمثلة سريعة لإعداد مصادقة نماذج اللغة الكبيرة واختيار النموذج
summary: موفّرو النماذج (نماذج اللغة الكبيرة) الذين يدعمهم OpenClaw
title: البدء السريع مع موفّر النموذج
x-i18n:
    generated_at: "2026-07-12T06:30:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

اختر موفّرًا، وصادِق، ثم عيّن النموذج الافتراضي بالصيغة `provider/model`.

## البدء السريع (خطوتان)

1. صادِق لدى الموفّر (عادةً عبر `openclaw onboard`).
2. عيّن النموذج الافتراضي:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## الموفّرون المدعومون (المجموعة الأولية)

- [Alibaba Model Studio](/ar/providers/alibaba)
- [Amazon Bedrock](/ar/providers/bedrock)
- [Anthropic ‏(API ‏+ Claude CLI)](/ar/providers/anthropic)
- [BytePlus (الدولي)](/ar/concepts/model-providers#byteplus-international)
- [Chutes](/ar/providers/chutes)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [Cohere](/ar/providers/cohere)
- [ComfyUI](/ar/providers/comfy)
- [DeepInfra](/ar/providers/deepinfra)
- [fal](/ar/providers/fal)
- [Fireworks](/ar/providers/fireworks)
- [MiniMax](/ar/providers/minimax)
- [Mistral](/ar/providers/mistral)
- [Moonshot AI ‏(Kimi ‏+ Kimi Coding)](/ar/providers/moonshot)
- [NovitaAI](/ar/providers/novita)
- [OpenAI ‏(API ‏+ Codex)](/ar/providers/openai)
- [OpenCode ‏(Zen ‏+ Go)](/ar/providers/opencode)
- [OpenRouter](/ar/providers/openrouter)
- [Qianfan](/ar/providers/qianfan)
- [Qwen](/ar/providers/qwen)
- [Runway](/ar/providers/runway)
- [StepFun](/ar/providers/stepfun)
- [Synthetic](/ar/providers/synthetic)
- [Venice ‏(Venice AI)](/ar/providers/venice)
- [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
- [xAI](/ar/providers/xai)
- [Z.AI ‏(GLM)](/ar/providers/zai)

للاطّلاع على الكتالوج الكامل للموفّرين والإعدادات المتقدمة، راجع
[دليل الموفّرين](/ar/providers/index) و[موفّري النماذج](/ar/concepts/model-providers).

## متغيرات إضافية للموفّرين

- `anthropic-vertex` - ثبّت `@openclaw/anthropic-vertex-provider` لدعم Anthropic الضمني على Google Vertex عند توفر بيانات اعتماد Vertex؛ ولا يوجد خيار مصادقة منفصل أثناء الإعداد الأولي
- `copilot-proxy` - جسر محلي لـ VS Code Copilot Proxy؛ استخدم `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - تدفق OAuth غير رسمي لـ Gemini CLI؛ يتطلب تثبيت `gemini` محليًا (`brew install gemini-cli` أو `npm install -g @google/gemini-cli`)؛ النموذج الافتراضي هو `google-gemini-cli/gemini-3-flash-preview`؛ استخدم `openclaw onboard --auth-choice google-gemini-cli` أو `openclaw models auth login --provider google-gemini-cli --set-default`

## ذو صلة

- [دليل الموفّرين](/ar/providers/index)
- [اختيار النموذج](/ar/concepts/model-providers)
- [التبديل الاحتياطي للنموذج](/ar/concepts/model-failover)
- [CLI للنماذج](/ar/cli/models)
