---
read_when:
    - تريد اختيار مزود نموذج
    - تريد أمثلة إعداد سريعة لمصادقة LLM + اختيار النموذج
summary: مزودو النماذج (LLMs) المدعومون في OpenClaw
title: البدء السريع لمزودي النماذج
x-i18n:
    generated_at: "2026-04-24T07:59:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b824a664e0e7a7a5b0ea640ea7329ea3d1e3d12b85d9310231c76014b2ae01cc
    source_path: providers/models.md
    workflow: 15
---

# مزودو النماذج

يمكن لـ OpenClaw استخدام العديد من مزودي LLM. اختر واحدًا، ثم قم بالمصادقة، ثم اضبط
النموذج الافتراضي بالشكل `provider/model`.

## بدء سريع (خطوتان)

1. صادق مع المزود (عادةً عبر `openclaw onboard`).
2. اضبط النموذج الافتراضي:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## المزودون المدعومون (المجموعة الأساسية)

- [Alibaba Model Studio](/ar/providers/alibaba)
- [Amazon Bedrock](/ar/providers/bedrock)
- [Anthropic ‏(API + Claude CLI)](/ar/providers/anthropic)
- [BytePlus ‏(دولي)](/ar/concepts/model-providers#byteplus-international)
- [Chutes](/ar/providers/chutes)
- [ComfyUI](/ar/providers/comfy)
- [Cloudflare AI Gateway](/ar/providers/cloudflare-ai-gateway)
- [fal](/ar/providers/fal)
- [Fireworks](/ar/providers/fireworks)
- [نماذج GLM](/ar/providers/glm)
- [MiniMax](/ar/providers/minimax)
- [Mistral](/ar/providers/mistral)
- [Moonshot AI ‏(Kimi + Kimi Coding)](/ar/providers/moonshot)
- [OpenAI ‏(API + Codex)](/ar/providers/openai)
- [OpenCode ‏(Zen + Go)](/ar/providers/opencode)
- [OpenRouter](/ar/providers/openrouter)
- [Qianfan](/ar/providers/qianfan)
- [Qwen](/ar/providers/qwen)
- [Runway](/ar/providers/runway)
- [StepFun](/ar/providers/stepfun)
- [Synthetic](/ar/providers/synthetic)
- [Vercel AI Gateway](/ar/providers/vercel-ai-gateway)
- [Venice ‏(Venice AI)](/ar/providers/venice)
- [xAI](/ar/providers/xai)
- [Z.AI](/ar/providers/zai)

## متغيرات المزودين المضمنة الإضافية

- `anthropic-vertex` - دعم Anthropic الضمني على Google Vertex عند توفر بيانات اعتماد Vertex؛ ولا يوجد خيار مصادقة منفصل في onboarding
- `copilot-proxy` - جسر Copilot Proxy محلي في VS Code؛ استخدم `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - تدفق OAuth غير رسمي لـ Gemini CLI؛ ويتطلب تثبيت `gemini` محليًا (`brew install gemini-cli` أو `npm install -g @google/gemini-cli`)؛ النموذج الافتراضي `google-gemini-cli/gemini-3-flash-preview`؛ استخدم `openclaw onboard --auth-choice google-gemini-cli` أو `openclaw models auth login --provider google-gemini-cli --set-default`

للحصول على فهرس المزودين الكامل (xAI، وGroq، وMistral، وغير ذلك) والإعدادات المتقدمة،
راجع [مزودو النماذج](/ar/concepts/model-providers).

## ذو صلة

- [اختيار النموذج](/ar/concepts/model-providers)
- [Failover النموذج](/ar/concepts/model-failover)
- [CLI الخاص بالنماذج](/ar/cli/models)
