---
read_when:
    - Bạn muốn chọn một nhà cung cấp mô hình
    - Bạn cần thông tin tổng quan nhanh về các phần phụ trợ LLM được hỗ trợ
summary: Các nhà cung cấp mô hình (LLM) được OpenClaw hỗ trợ
title: Thư mục nhà cung cấp
x-i18n:
    generated_at: "2026-07-12T08:18:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw có thể sử dụng nhiều nhà cung cấp LLM. Hãy chọn một nhà cung cấp, xác thực, sau đó đặt
mô hình mặc định theo dạng `provider/model`.

Bạn đang tìm tài liệu về các kênh trò chuyện (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/v.v.)? Xem [Kênh](/vi/channels).

## Bắt đầu nhanh

1. Xác thực với nhà cung cấp (thường qua `openclaw onboard`).
2. Đặt mô hình mặc định:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Tài liệu về nhà cung cấp

- [Alibaba Model Studio](/vi/providers/alibaba)
- [Amazon Bedrock](/vi/providers/bedrock)
- [Amazon Bedrock Mantle](/vi/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/vi/providers/anthropic)
- [Arcee AI (các mô hình Trinity)](/vi/providers/arcee)
- [Azure Speech](/vi/providers/azure-speech)
- [BytePlus (quốc tế)](/vi/concepts/model-providers#byteplus-international)
- [Cerebras](/vi/providers/cerebras)
- [Chutes](/vi/providers/chutes)
- [ClawRouter (định tuyến đa nhà cung cấp được quản lý)](/vi/providers/clawrouter)
- [Cloudflare AI Gateway](/vi/providers/cloudflare-ai-gateway)
- [Cohere](/vi/providers/cohere)
- [ComfyUI](/vi/providers/comfy)
- [DeepSeek](/vi/providers/deepseek)
- [ds4 (DeepSeek V4 cục bộ)](/vi/providers/ds4)
- [ElevenLabs](/vi/providers/elevenlabs)
- [fal](/vi/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/vi/providers/fireworks)
- [GitHub Copilot](/vi/providers/github-copilot)
- [GMI Cloud](/vi/providers/gmi)
- [Google (Gemini)](/vi/providers/google)
- [Gradium](/vi/providers/gradium)
- [Groq (suy luận bằng LPU)](/vi/providers/groq)
- [Hugging Face (suy luận)](/vi/providers/huggingface)
- [inferrs (các mô hình cục bộ)](/vi/providers/inferrs)
- [Kilocode](/vi/providers/kilocode)
- [LiteLLM (Gateway hợp nhất)](/vi/providers/litellm)
- [LM Studio (các mô hình cục bộ)](/vi/providers/lmstudio)
- [LongCat](/vi/providers/longcat)
- [MiniMax](/vi/providers/minimax)
- [Mistral](/vi/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/vi/providers/moonshot)
- [NovitaAI](/vi/providers/novita)
- [NVIDIA](/vi/providers/nvidia)
- [Ollama (các mô hình đám mây + cục bộ)](/vi/providers/ollama)
- [Ollama Cloud](/vi/providers/ollama-cloud)
- [OpenAI (API + Codex)](/vi/providers/openai)
- [OpenCode](/vi/providers/opencode)
- [OpenCode Go](/vi/providers/opencode-go)
- [OpenRouter](/vi/providers/openrouter)
- [Perplexity (tìm kiếm trên web)](/vi/providers/perplexity-provider)
- [Qianfan](/vi/providers/qianfan)
- [Qwen Cloud](/vi/providers/qwen)
- [Qwen OAuth / Portal](/vi/providers/qwen-oauth)
- [Runway](/vi/providers/runway)
- [SenseAudio](/vi/providers/senseaudio)
- [SGLang (các mô hình cục bộ)](/vi/providers/sglang)
- [StepFun](/vi/providers/stepfun)
- [Synthetic](/vi/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/vi/providers/tencent)
- [Together AI](/vi/providers/together)
- [Venice (Venice AI, chú trọng quyền riêng tư)](/vi/providers/venice)
- [Vercel AI Gateway](/vi/providers/vercel-ai-gateway)
- [vLLM (các mô hình cục bộ)](/vi/providers/vllm)
- [Volcengine (Doubao)](/vi/providers/volcengine)
- [Vydra](/vi/providers/vydra)
- [xAI](/vi/providers/xai)
- [Xiaomi](/vi/providers/xiaomi)
- [Z.AI (GLM)](/vi/providers/zai)

## Các trang tổng quan dùng chung

- [Các biến thể nhà cung cấp bổ sung](/vi/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy và Gemini CLI OAuth
- [Tạo hình ảnh](/vi/tools/image-generation) - Công cụ `image_generate` dùng chung, lựa chọn nhà cung cấp và chuyển đổi dự phòng
- [Tạo nhạc](/vi/tools/music-generation) - Công cụ `music_generate` dùng chung, lựa chọn nhà cung cấp và chuyển đổi dự phòng
- [Tạo video](/vi/tools/video-generation) - Công cụ `video_generate` dùng chung, lựa chọn nhà cung cấp và chuyển đổi dự phòng

## Nhà cung cấp dịch vụ phiên âm

- [Deepgram (phiên âm thanh)](/vi/providers/deepgram)
- [ElevenLabs](/vi/providers/elevenlabs#speech-to-text)
- [Mistral](/vi/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/vi/providers/openai)
- [SenseAudio](/vi/providers/senseaudio)
- [xAI](/vi/providers/xai)

## Công cụ cộng đồng

- [Claude Max API Proxy](/vi/providers/claude-max-api-proxy) - Proxy cộng đồng dành cho thông tin xác thực của gói đăng ký Claude (hãy kiểm tra chính sách/điều khoản của Anthropic trước khi sử dụng)

Để xem danh mục đầy đủ các nhà cung cấp (xAI, Groq, Mistral, v.v.) và cấu hình nâng cao,
hãy xem [Nhà cung cấp mô hình](/vi/concepts/model-providers).
