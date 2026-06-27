---
read_when:
    - Bạn muốn một khóa API duy nhất cho các LLM mã nguồn mở hàng đầu
    - Bạn muốn chạy các mô hình thông qua API của DeepInfra trong OpenClaw
summary: Sử dụng API hợp nhất của DeepInfra để truy cập các mô hình nguồn mở phổ biến nhất và các mô hình frontier trong OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:02:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra cung cấp một **API hợp nhất** định tuyến yêu cầu đến các mô hình nguồn mở và frontier phổ biến nhất phía sau một
endpoint và khóa API duy nhất. API này tương thích với OpenAI, nên hầu hết OpenAI SDKs hoạt động bằng cách chuyển đổi URL cơ sở.

## Cài đặt Plugin

Cài đặt Plugin chính thức, rồi khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Lấy khóa API

1. Truy cập [https://deepinfra.com/](https://deepinfra.com/)
2. Đăng nhập hoặc tạo tài khoản
3. Đi tới Dashboard / Keys và tạo khóa API mới hoặc dùng khóa được tự động tạo

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

## Các bề mặt OpenClaw được hỗ trợ

Plugin đăng ký tất cả bề mặt DeepInfra khớp với các hợp đồng nhà cung cấp
OpenClaw hiện tại. Trò chuyện, tạo hình ảnh và tạo video
làm mới danh mục mô hình trực tiếp từ `/v1/openai/models?sort_by=openclaw&filter=with_meta`
khi `DEEPINFRA_API_KEY` được cấu hình; các bề mặt khác dùng các giá trị mặc định tĩnh
được tuyển chọn bên dưới.

| Bề mặt                   | Mô hình mặc định                                                                                             | Cấu hình/công cụ OpenClaw                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Trò chuyện / nhà cung cấp mô hình | mục đầu tiên có thẻ chat từ danh mục trực tiếp (dự phòng theo manifest `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model`                                  |
| Tạo/chỉnh sửa hình ảnh | mục đầu tiên có thẻ `image-gen` từ danh mục trực tiếp (dự phòng tĩnh `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Hiểu nội dung đa phương tiện | `moonshotai/Kimi-K2.5` cho hình ảnh                                                                      | hiểu hình ảnh đầu vào                                    |
| Chuyển giọng nói thành văn bản | `openai/whisper-large-v3-turbo`                                                                       | phiên âm âm thanh đầu vào                                |
| Chuyển văn bản thành giọng nói | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Tạo video               | mục đầu tiên có thẻ `video-gen` từ danh mục trực tiếp (dự phòng tĩnh `Pixverse/Pixverse-T2V`)              | `video_generate`, `agents.defaults.videoGenerationModel` |
| Nhúng bộ nhớ            | `BAAI/bge-m3`                                                                                                | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra cũng cung cấp xếp hạng lại, phân loại, phát hiện đối tượng và các
kiểu mô hình native khác. OpenClaw hiện chưa có hợp đồng nhà cung cấp hạng nhất
cho các danh mục đó, nên Plugin này chưa đăng ký chúng.

## Các mô hình có sẵn

OpenClaw tự động phát hiện các mô hình DeepInfra có sẵn khi khởi động. Dùng
`/models deepinfra` để xem danh sách đầy đủ các mô hình có sẵn.

Bất kỳ mô hình nào có trên [DeepInfra.com](https://deepinfra.com/) đều có thể dùng với tiền tố `deepinfra/`:

```
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
- Mô hình mặc định: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL cơ sở: `https://api.deepinfra.com/v1/openai`
- Tạo video native dùng `https://api.deepinfra.com/v1/inference/<model>`.

## Liên quan

- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Tất cả nhà cung cấp](/vi/providers/index)
