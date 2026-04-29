---
read_when:
    - Bạn muốn chọn một nhà cung cấp mô hình
    - Bạn muốn các ví dụ thiết lập nhanh cho xác thực LLM + lựa chọn mô hình
summary: Các nhà cung cấp mô hình (LLM) được OpenClaw hỗ trợ
title: Hướng dẫn bắt đầu nhanh về nhà cung cấp mô hình
x-i18n:
    generated_at: "2026-04-29T23:07:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f71f9ab34df2b545128bfeed3cab82f31b741d4a66263113068568ce6b77cd6
    source_path: providers/models.md
    workflow: 16
---

# Nhà cung cấp mô hình

OpenClaw có thể dùng nhiều nhà cung cấp LLM. Chọn một nhà cung cấp, xác thực, rồi đặt mô hình mặc định dưới dạng `provider/model`.

## Bắt đầu nhanh (hai bước)

1. Xác thực với nhà cung cấp (thường thông qua `openclaw onboard`).
2. Đặt mô hình mặc định:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Nhà cung cấp được hỗ trợ (bộ khởi đầu)

- [Alibaba Model Studio](/vi/providers/alibaba)
- [Amazon Bedrock](/vi/providers/bedrock)
- [Anthropic (API + Claude CLI)](/vi/providers/anthropic)
- [BytePlus (Quốc tế)](/vi/concepts/model-providers#byteplus-international)
- [Chutes](/vi/providers/chutes)
- [ComfyUI](/vi/providers/comfy)
- [Cloudflare AI Gateway](/vi/providers/cloudflare-ai-gateway)
- [DeepInfra](/vi/providers/deepinfra)
- [fal](/vi/providers/fal)
- [Fireworks](/vi/providers/fireworks)
- [mô hình GLM](/vi/providers/glm)
- [MiniMax](/vi/providers/minimax)
- [Mistral](/vi/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/vi/providers/moonshot)
- [OpenAI (API + Codex)](/vi/providers/openai)
- [OpenCode (Zen + Go)](/vi/providers/opencode)
- [OpenRouter](/vi/providers/openrouter)
- [Qianfan](/vi/providers/qianfan)
- [Qwen](/vi/providers/qwen)
- [Runway](/vi/providers/runway)
- [StepFun](/vi/providers/stepfun)
- [Synthetic](/vi/providers/synthetic)
- [Vercel AI Gateway](/vi/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/vi/providers/venice)
- [xAI](/vi/providers/xai)
- [Z.AI](/vi/providers/zai)

## Các biến thể nhà cung cấp bổ sung được đóng gói sẵn

- `anthropic-vertex` - hỗ trợ Anthropic ngầm định trên Google Vertex khi có thông tin xác thực Vertex; không có lựa chọn xác thực onboarding riêng
- `copilot-proxy` - cầu nối VS Code Copilot Proxy cục bộ; dùng `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - luồng OAuth Gemini CLI không chính thức; yêu cầu bản cài đặt `gemini` cục bộ (`brew install gemini-cli` hoặc `npm install -g @google/gemini-cli`); mô hình mặc định `google-gemini-cli/gemini-3-flash-preview`; dùng `openclaw onboard --auth-choice google-gemini-cli` hoặc `openclaw models auth login --provider google-gemini-cli --set-default`

Để xem danh mục nhà cung cấp đầy đủ (xAI, Groq, Mistral, v.v.) và cấu hình nâng cao, hãy xem [Nhà cung cấp mô hình](/vi/concepts/model-providers).

## Liên quan

- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
- [CLI mô hình](/vi/cli/models)
