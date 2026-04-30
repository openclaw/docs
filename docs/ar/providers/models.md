---
read_when:
    - تريد اختيار مزوّد نماذج
    - تريد أمثلة إعداد سريعة لمصادقة LLM + اختيار النموذج
summary: مزودو النماذج (النماذج اللغوية الكبيرة) المدعومون من OpenClaw
title: البدء السريع لموفّر النماذج
x-i18n:
    generated_at: "2026-04-30T08:21:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f71f9ab34df2b545128bfeed3cab82f31b741d4a66263113068568ce6b77cd6
    source_path: providers/models.md
    workflow: 16
---

# مزودو النماذج

يمكن لـ OpenClaw استخدام العديد من مزودي LLM. اختر واحدًا، وصادِق، ثم عيّن النموذج الافتراضي
بصيغة `provider/model`.

## البدء السريع (خطوتان)

1. صادِق مع المزود (عادةً عبر `openclaw onboard`).
2. عيّن النموذج الافتراضي:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## المزودون المدعومون (مجموعة البداية)

- [Alibaba Model Studio](/ar/providers/alibaba)
- [Amazon Bedrock](/ar/providers/bedrock)
- [Anthropic (API + Claude CLI)](/ar/providers/anthropic)
- [BytePlus (دولي)](/ar/concepts/model-providers#byteplus-international)
- [Chutes](/ar/providers/chutes)
- [ComfyUI](/ar/providers/comfy)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [DeepInfra](/ar/providers/deepinfra)
- [fal](/ar/providers/fal)
- [Fireworks](/ar/providers/fireworks)
- [نماذج GLM](/ar/providers/glm)
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
- [Z.AI](/ar/providers/zai)

## متغيرات إضافية للمزودين المضمنين

- `anthropic-vertex` - دعم Anthropic الضمني على Google Vertex عند توفر بيانات اعتماد Vertex؛ لا يوجد خيار مصادقة إعداد منفصل
- `copilot-proxy` - جسر وكيل VS Code Copilot Proxy المحلي؛ استخدم `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - تدفق OAuth غير رسمي لـ Gemini CLI؛ يتطلب تثبيت `gemini` محليًا (`brew install gemini-cli` أو `npm install -g @google/gemini-cli`)؛ النموذج الافتراضي `google-gemini-cli/gemini-3-flash-preview`؛ استخدم `openclaw onboard --auth-choice google-gemini-cli` أو `openclaw models auth login --provider google-gemini-cli --set-default`

للاطلاع على كتالوج المزودين الكامل (xAI وGroq وMistral وغيرها) والتكوين المتقدم،
راجع [مزودي النماذج](/ar/concepts/model-providers).

## ذات صلة

- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)
- [Models CLI](/ar/cli/models)
