---
read_when:
    - Bạn muốn chọn một nhà cung cấp mô hình
    - Bạn muốn các ví dụ thiết lập nhanh cho xác thực LLM + chọn mô hình
summary: Các nhà cung cấp mô hình (LLM) được OpenClaw hỗ trợ
title: Hướng dẫn nhanh về nhà cung cấp mô hình
x-i18n:
    generated_at: "2026-06-27T18:04:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw có thể sử dụng nhiều nhà cung cấp LLM. Chọn một nhà cung cấp, xác thực, rồi đặt mô hình mặc định
dưới dạng `provider/model`.

## Bắt đầu nhanh (hai bước)

1. Xác thực với nhà cung cấp (thường qua `openclaw onboard`).
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
- [Cohere](/vi/providers/cohere)
- [ComfyUI](/vi/providers/comfy)
- [Cloudflare AI Gateway](/vi/providers/cloudflare-ai-gateway)
- [DeepInfra](/vi/providers/deepinfra)
- [fal](/vi/providers/fal)
- [Fireworks](/vi/providers/fireworks)
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
- [Z.AI (GLM)](/vi/providers/zai)

## Các biến thể nhà cung cấp bổ sung

- `anthropic-vertex` - cài đặt `@openclaw/anthropic-vertex-provider` để hỗ trợ Anthropic ngầm định trên Google Vertex khi có sẵn thông tin xác thực Vertex; không có lựa chọn xác thực thiết lập ban đầu riêng
- `copilot-proxy` - cầu nối VS Code Copilot Proxy cục bộ; dùng `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - luồng OAuth Gemini CLI không chính thức; yêu cầu cài đặt `gemini` cục bộ (`brew install gemini-cli` hoặc `npm install -g @google/gemini-cli`); mô hình mặc định `google-gemini-cli/gemini-3-flash-preview`; dùng `openclaw onboard --auth-choice google-gemini-cli` hoặc `openclaw models auth login --provider google-gemini-cli --set-default`

Để xem danh mục nhà cung cấp đầy đủ (xAI, Groq, Mistral, v.v.) và cấu hình nâng cao,
hãy xem [Nhà cung cấp mô hình](/vi/concepts/model-providers).

## Liên quan

- [Chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
- [CLI mô hình](/vi/cli/models)
