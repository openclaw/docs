---
read_when:
    - Bạn muốn một khóa API duy nhất cho các LLM mã nguồn mở hàng đầu
    - Bạn muốn chạy các mô hình thông qua API của DeepInfra trong OpenClaw
summary: Sử dụng API hợp nhất của DeepInfra để truy cập các mô hình mã nguồn mở và tiên tiến phổ biến nhất trong OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T08:20:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra định tuyến yêu cầu đến các mô hình mã nguồn mở phổ biến và mô hình tiên tiến thông qua một điểm cuối tương thích với OpenAI và một khóa API duy nhất. Hầu hết SDK OpenAI đều hoạt động với dịch vụ này khi chuyển đổi URL cơ sở.

## Cài đặt plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Lấy khóa API

1. Đăng nhập tại [deepinfra.com](https://deepinfra.com/)
2. Truy cập Dashboard / Keys và tạo một khóa hoặc sử dụng khóa được tạo tự động

## Thiết lập CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Hoặc đặt biến môi trường:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Đoạn cấu hình

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## Các bề mặt được hỗ trợ

Tính năng trò chuyện, tạo hình ảnh và tạo video làm mới trực tiếp danh mục mô hình từ `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta` sau khi `DEEPINFRA_API_KEY` được cấu hình. Các bề mặt khác sử dụng các giá trị mặc định tĩnh bên dưới cho đến khi được chuyển sang cùng danh mục trực tiếp này.

| Bề mặt | Mô hình mặc định | Cấu hình/công cụ OpenClaw |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Trò chuyện / nhà cung cấp mô hình | mục đầu tiên được gắn thẻ trò chuyện trong danh mục trực tiếp (dự phòng tĩnh `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model` |
| Tạo/chỉnh sửa hình ảnh | mục đầu tiên được gắn thẻ `image-gen` trong danh mục trực tiếp (dự phòng tĩnh `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Hiểu nội dung đa phương tiện | `moonshotai/Kimi-K2.5` cho hình ảnh | hiểu hình ảnh đầu vào |
| Chuyển giọng nói thành văn bản | `openai/whisper-large-v3-turbo` | phiên âm âm thanh đầu vào |
| Chuyển văn bản thành giọng nói | `hexgrad/Kokoro-82M` | `messages.tts.provider: "deepinfra"` |
| Tạo video | dự phòng tĩnh `Pixverse/Pixverse-T2V` (hiện tại DeepInfra không có hàng video-gen trực tiếp) | `video_generate`, `agents.defaults.videoGenerationModel` |
| Vector nhúng bộ nhớ | `BAAI/bge-m3` | `agents.defaults.memorySearch.provider: "deepinfra"` |

DeepInfra cũng cung cấp tính năng xếp hạng lại, phân loại, phát hiện đối tượng và các loại mô hình gốc khác. OpenClaw chưa có hợp đồng nhà cung cấp cho các danh mục đó, vì vậy plugin này không đăng ký chúng.

## Các mô hình có sẵn

OpenClaw tự động khám phá các mô hình DeepInfra sau khi một khóa được cấu hình. Sử dụng `/models deepinfra` hoặc `openclaw models list --provider deepinfra` để xem danh sách hiện tại.

Mọi mô hình trên [deepinfra.com](https://deepinfra.com/) đều hoạt động với tiền tố `deepinfra/`:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...và nhiều mô hình khác
```

## Ghi chú

- Tham chiếu mô hình có dạng `deepinfra/<provider>/<model>` (ví dụ: `deepinfra/Qwen/Qwen3-Max`).
- Mô hình trò chuyện mặc định: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL cơ sở: `https://api.deepinfra.com/v1/openai`
- Tính năng tạo video gốc sử dụng `https://api.deepinfra.com/v1/inference/<model>`.

## Liên quan

- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Tất cả nhà cung cấp](/vi/providers/index)
