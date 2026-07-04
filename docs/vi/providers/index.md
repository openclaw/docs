---
read_when:
    - Bạn muốn chọn một nhà cung cấp mô hình
    - Bạn cần tổng quan nhanh về các backend LLM được hỗ trợ
summary: Các nhà cung cấp mô hình (LLM) được OpenClaw hỗ trợ
title: Thư mục nhà cung cấp
x-i18n:
    generated_at: "2026-07-04T03:53:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3386b41b340048f7ace61077e724a70af36dda83c65d211dde5081b378b1b448
    source_path: providers/index.md
    workflow: 16
---

OpenClaw có thể sử dụng nhiều nhà cung cấp LLM. Chọn một nhà cung cấp, xác thực, rồi đặt
mô hình mặc định dưới dạng `provider/model`.

Bạn đang tìm tài liệu về kênh chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/v.v.)? Xem [Kênh](/vi/channels).

## Bắt đầu nhanh

1. Xác thực với nhà cung cấp (thường qua `openclaw onboard`).
2. Đặt mô hình mặc định:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Tài liệu nhà cung cấp

- [Alibaba Model Studio](/vi/providers/alibaba)
- [Amazon Bedrock](/vi/providers/bedrock)
- [Amazon Bedrock Mantle](/vi/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/vi/providers/anthropic)
- [Arcee AI (mô hình Trinity)](/vi/providers/arcee)
- [Azure Speech](/vi/providers/azure-speech)
- [BytePlus (Quốc tế)](/vi/concepts/model-providers#byteplus-international)
- [Cerebras](/vi/providers/cerebras)
- [Chutes](/vi/providers/chutes)
- [ClawRouter (định tuyến đa nhà cung cấp được quản lý)](/providers/clawrouter)
- [Cohere](/vi/providers/cohere)
- [Cloudflare AI Gateway](/vi/providers/cloudflare-ai-gateway)
- [ComfyUI](/vi/providers/comfy)
- [DeepSeek](/vi/providers/deepseek)
- [ds4 (DeepSeek V4 cục bộ)](/vi/providers/ds4)
- [ElevenLabs](/vi/providers/elevenlabs)
- [fal](/vi/providers/fal)
- [Fireworks](/vi/providers/fireworks)
- [GitHub Copilot](/vi/providers/github-copilot)
- [GMI Cloud](/vi/providers/gmi)
- [Google (Gemini)](/vi/providers/google)
- [Gradium](/vi/providers/gradium)
- [Groq (suy luận LPU)](/vi/providers/groq)
- [Hugging Face (Suy luận)](/vi/providers/huggingface)
- [inferrs (mô hình cục bộ)](/vi/providers/inferrs)
- [Kilocode](/vi/providers/kilocode)
- [LiteLLM (gateway hợp nhất)](/vi/providers/litellm)
- [LM Studio (mô hình cục bộ)](/vi/providers/lmstudio)
- [MiniMax](/vi/providers/minimax)
- [Mistral](/vi/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/vi/providers/moonshot)
- [NVIDIA](/vi/providers/nvidia)
- [NovitaAI](/vi/providers/novita)
- [Ollama (đám mây + mô hình cục bộ)](/vi/providers/ollama)
- [Ollama Cloud](/vi/providers/ollama-cloud)
- [OpenAI (API + Codex)](/vi/providers/openai)
- [OpenCode](/vi/providers/opencode)
- [OpenCode Go](/vi/providers/opencode-go)
- [OpenRouter](/vi/providers/openrouter)
- [Perplexity (tìm kiếm web)](/vi/providers/perplexity-provider)
- [Qianfan](/vi/providers/qianfan)
- [Qwen Cloud](/vi/providers/qwen)
- [Qwen OAuth / Cổng thông tin](/vi/providers/qwen-oauth)
- [Runway](/vi/providers/runway)
- [SenseAudio](/vi/providers/senseaudio)
- [SGLang (mô hình cục bộ)](/vi/providers/sglang)
- [StepFun](/vi/providers/stepfun)
- [Synthetic](/vi/providers/synthetic)
- [Tencent Cloud (TokenHub)](/vi/providers/tencent)
- [Together AI](/vi/providers/together)
- [Venice (Venice AI, tập trung vào quyền riêng tư)](/vi/providers/venice)
- [Vercel AI Gateway](/vi/providers/vercel-ai-gateway)
- [vLLM (mô hình cục bộ)](/vi/providers/vllm)
- [Volcengine (Doubao)](/vi/providers/volcengine)
- [Vydra](/vi/providers/vydra)
- [xAI](/vi/providers/xai)
- [Xiaomi](/vi/providers/xiaomi)
- [Z.AI (GLM)](/vi/providers/zai)

## Trang tổng quan chung

- [Biến thể đi kèm bổ sung](/vi/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy và Gemini CLI OAuth
- [Tạo hình ảnh](/vi/tools/image-generation) - Công cụ `image_generate` dùng chung, lựa chọn nhà cung cấp và chuyển đổi dự phòng
- [Tạo nhạc](/vi/tools/music-generation) - Công cụ `music_generate` dùng chung, lựa chọn nhà cung cấp và chuyển đổi dự phòng
- [Tạo video](/vi/tools/video-generation) - Công cụ `video_generate` dùng chung, lựa chọn nhà cung cấp và chuyển đổi dự phòng

## Nhà cung cấp phiên âm

- [Deepgram (phiên âm âm thanh)](/vi/providers/deepgram)
- [ElevenLabs](/vi/providers/elevenlabs#speech-to-text)
- [Mistral](/vi/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/vi/providers/openai#speech-to-text)
- [SenseAudio](/vi/providers/senseaudio)
- [xAI](/vi/providers/xai#speech-to-text)

## Công cụ cộng đồng

- [Claude Max API Proxy](/vi/providers/claude-max-api-proxy) - Proxy cộng đồng cho thông tin đăng nhập gói đăng ký Claude (xác minh chính sách/điều khoản của Anthropic trước khi sử dụng)

Để xem danh mục nhà cung cấp đầy đủ (xAI, Groq, Mistral, v.v.) và cấu hình nâng cao,
xem [Nhà cung cấp mô hình](/vi/concepts/model-providers).
