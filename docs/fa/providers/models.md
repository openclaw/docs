---
read_when:
    - می‌خواهید یک ارائه‌دهندهٔ مدل انتخاب کنید
    - نمونه‌های راه‌اندازی سریع برای احراز هویت LLM و انتخاب مدل می‌خواهید
summary: ارائه‌دهندگان مدل (LLMها) پشتیبانی‌شده توسط OpenClaw
title: شروع سریع ارائه‌دهندهٔ مدل
x-i18n:
    generated_at: "2026-06-27T18:41:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw می‌تواند از ارائه‌دهندگان LLM متعددی استفاده کند. یکی را انتخاب کنید، احراز هویت کنید، سپس مدل پیش‌فرض را به‌صورت `provider/model` تنظیم کنید.

## شروع سریع (دو مرحله)

1. با ارائه‌دهنده احراز هویت کنید (معمولاً از طریق `openclaw onboard`).
2. مدل پیش‌فرض را تنظیم کنید:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## ارائه‌دهندگان پشتیبانی‌شده (مجموعه آغازین)

- [Alibaba Model Studio](/fa/providers/alibaba)
- [Amazon Bedrock](/fa/providers/bedrock)
- [Anthropic (API + Claude CLI)](/fa/providers/anthropic)
- [BytePlus (بین‌المللی)](/fa/concepts/model-providers#byteplus-international)
- [Chutes](/fa/providers/chutes)
- [Cohere](/fa/providers/cohere)
- [ComfyUI](/fa/providers/comfy)
- [Cloudflare AI Gateway](/fa/providers/cloudflare-ai-gateway)
- [DeepInfra](/fa/providers/deepinfra)
- [fal](/fa/providers/fal)
- [Fireworks](/fa/providers/fireworks)
- [MiniMax](/fa/providers/minimax)
- [Mistral](/fa/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/fa/providers/moonshot)
- [OpenAI (API + Codex)](/fa/providers/openai)
- [OpenCode (Zen + Go)](/fa/providers/opencode)
- [OpenRouter](/fa/providers/openrouter)
- [Qianfan](/fa/providers/qianfan)
- [Qwen](/fa/providers/qwen)
- [Runway](/fa/providers/runway)
- [StepFun](/fa/providers/stepfun)
- [Synthetic](/fa/providers/synthetic)
- [Vercel AI Gateway](/fa/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/fa/providers/venice)
- [xAI](/fa/providers/xai)
- [Z.AI (GLM)](/fa/providers/zai)

## گونه‌های اضافی ارائه‌دهنده

- `anthropic-vertex` - برای پشتیبانی ضمنی از Anthropic روی Google Vertex، وقتی اعتبارنامه‌های Vertex در دسترس هستند، `@openclaw/anthropic-vertex-provider` را نصب کنید؛ گزینه احراز هویت جداگانه‌ای در فرایند راه‌اندازی ندارد
- `copilot-proxy` - پل محلی VS Code Copilot Proxy؛ از `openclaw onboard --auth-choice copilot-proxy` استفاده کنید
- `google-gemini-cli` - جریان غیررسمی OAuth برای Gemini CLI؛ به نصب محلی `gemini` نیاز دارد (`brew install gemini-cli` یا `npm install -g @google/gemini-cli`)؛ مدل پیش‌فرض `google-gemini-cli/gemini-3-flash-preview`؛ از `openclaw onboard --auth-choice google-gemini-cli` یا `openclaw models auth login --provider google-gemini-cli --set-default` استفاده کنید

برای کاتالوگ کامل ارائه‌دهندگان (xAI، Groq، Mistral و غیره) و پیکربندی پیشرفته، به [ارائه‌دهندگان مدل](/fa/concepts/model-providers) مراجعه کنید.

## مرتبط

- [انتخاب مدل](/fa/concepts/model-providers)
- [جابه‌جایی خودکار مدل هنگام خرابی](/fa/concepts/model-failover)
- [CLI مدل‌ها](/fa/cli/models)
