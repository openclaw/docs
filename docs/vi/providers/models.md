---
read_when:
    - Bạn muốn chọn một nhà cung cấp mô hình
    - Bạn muốn các ví dụ thiết lập nhanh cho xác thực LLM và lựa chọn mô hình
summary: Các nhà cung cấp mô hình (LLM) được OpenClaw hỗ trợ
title: Hướng dẫn bắt đầu nhanh với nhà cung cấp mô hình
x-i18n:
    generated_at: "2026-07-12T08:16:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

Chọn một nhà cung cấp, xác thực, sau đó đặt mô hình mặc định theo dạng `provider/model`.

## Bắt đầu nhanh (hai bước)

1. Xác thực với nhà cung cấp (thường thông qua `openclaw onboard`).
2. Đặt mô hình mặc định:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Các nhà cung cấp được hỗ trợ (danh sách khởi đầu)

- [Alibaba Model Studio](/vi/providers/alibaba)
- [Amazon Bedrock](/vi/providers/bedrock)
- [Anthropic (API + Claude CLI)](/vi/providers/anthropic)
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

Để xem danh mục nhà cung cấp đầy đủ và cấu hình nâng cao, hãy xem
[Danh mục nhà cung cấp](/vi/providers/index) và [Nhà cung cấp mô hình](/vi/concepts/model-providers).

## Các biến thể nhà cung cấp bổ sung

- `anthropic-vertex` - cài đặt `@openclaw/anthropic-vertex-provider` để hỗ trợ ngầm định Anthropic trên Google Vertex khi có thông tin xác thực Vertex; không có lựa chọn xác thực riêng trong quy trình thiết lập ban đầu
- `copilot-proxy` - cầu nối VS Code Copilot Proxy cục bộ; sử dụng `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - quy trình OAuth Gemini CLI không chính thức; yêu cầu cài đặt `gemini` cục bộ (`brew install gemini-cli` hoặc `npm install -g @google/gemini-cli`); mô hình mặc định `google-gemini-cli/gemini-3-flash-preview`; sử dụng `openclaw onboard --auth-choice google-gemini-cli` hoặc `openclaw models auth login --provider google-gemini-cli --set-default`

## Liên quan

- [Danh mục nhà cung cấp](/vi/providers/index)
- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
- [CLI mô hình](/vi/cli/models)
