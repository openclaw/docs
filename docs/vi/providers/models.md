---
read_when:
    - Bạn muốn chọn một nhà cung cấp mô hình
    - Bạn muốn các ví dụ thiết lập nhanh cho xác thực LLM + lựa chọn mô hình
summary: Các nhà cung cấp mô hình (LLM) được OpenClaw hỗ trợ
title: Hướng dẫn bắt đầu nhanh về nhà cung cấp mô hình
x-i18n:
    generated_at: "2026-07-19T05:58:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3988d6985cbe203a6a3357d59160190990b1b53245ea25f1538dbc6f567afec1
    source_path: providers/models.md
    workflow: 16
---

Chọn một nhà cung cấp, xác thực, rồi đặt mô hình mặc định thành `provider/model`.

## Bắt đầu nhanh (hai bước)

1. Xác thực với nhà cung cấp (thường thông qua `openclaw onboard`).
2. Đặt mô hình mặc định:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Các nhà cung cấp được hỗ trợ (bộ khởi đầu)

- [Alibaba Model Studio](/vi/providers/alibaba)
- [Amazon Bedrock](/vi/providers/bedrock)
- [Anthropic (API + Claude CLI)](/vi/providers/anthropic)
- [Baseten (Inkling + API mô hình)](/providers/baseten)
- [BytePlus (Quốc tế)](/vi/concepts/model-providers#byteplus-international)
- [Chutes](/vi/providers/chutes)
- [Cloudflare AI Gateway](/vi/providers/cloudflare-ai-gateway)
- [Cohere](/vi/providers/cohere)
- [ComfyUI](/vi/providers/comfy)
- [DeepInfra](/vi/providers/deepinfra)
- [fal](/vi/providers/fal)
- [Fireworks](/vi/providers/fireworks)
- [MiniMax](/vi/providers/minimax)
- [Mistral](/vi/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/vi/providers/moonshot)
- [NovitaAI](/vi/providers/novita)
- [OpenAI (API + Codex)](/vi/providers/openai)
- [OpenCode (Zen + Go)](/vi/providers/opencode)
- [OpenRouter](/vi/providers/openrouter)
- [Qianfan](/vi/providers/qianfan)
- [Qwen](/vi/providers/qwen)
- [Runway](/vi/providers/runway)
- [StepFun](/vi/providers/stepfun)
- [Synthetic](/vi/providers/synthetic)
- [Venice (Venice AI)](/vi/providers/venice)
- [Vercel AI Gateway](/vi/providers/vercel-ai-gateway)
- [xAI](/vi/providers/xai)
- [Z.AI (GLM)](/vi/providers/zai)

Để xem danh mục đầy đủ các nhà cung cấp và cấu hình nâng cao, hãy xem
[Thư mục nhà cung cấp](/vi/providers/index) và [Nhà cung cấp mô hình](/vi/concepts/model-providers).

## Các biến thể nhà cung cấp bổ sung

- `anthropic-vertex` - cài đặt `@openclaw/anthropic-vertex-provider` để hỗ trợ ngầm định Anthropic trên Google Vertex khi có thông tin xác thực Vertex; không có lựa chọn xác thực nhập môn riêng
- `copilot-proxy` - cầu nối VS Code Copilot Proxy cục bộ; sử dụng `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - luồng OAuth Gemini CLI không chính thức; yêu cầu cài đặt `gemini` cục bộ (`brew install gemini-cli` hoặc `npm install -g @google/gemini-cli`); mô hình mặc định `google-gemini-cli/gemini-3-flash-preview`; sử dụng `openclaw onboard --auth-choice google-gemini-cli` hoặc `openclaw models auth login --provider google-gemini-cli --set-default`

## Liên quan

- [Thư mục nhà cung cấp](/vi/providers/index)
- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
- [CLI mô hình](/vi/cli/models)
