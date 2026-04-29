---
read_when:
    - Bạn muốn một khóa API duy nhất cho các LLM mã nguồn mở hàng đầu
    - Bạn muốn chạy các mô hình thông qua API của DeepInfra trong OpenClaw
summary: Sử dụng API hợp nhất của DeepInfra để truy cập các mô hình mã nguồn mở và mô hình tiên tiến hàng đầu phổ biến nhất trong OpenClaw
x-i18n:
    generated_at: "2026-04-29T23:05:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

DeepInfra cung cấp một **API hợp nhất** định tuyến các yêu cầu đến các mô hình nguồn mở và frontier phổ biến nhất phía sau một endpoint và khóa API duy nhất. API này tương thích với OpenAI, nên hầu hết SDK OpenAI hoạt động bằng cách đổi URL cơ sở.

## Lấy khóa API

1. Truy cập [https://deepinfra.com/](https://deepinfra.com/)
2. Đăng nhập hoặc tạo tài khoản
3. Đi tới Dashboard / Keys và tạo khóa API mới hoặc dùng khóa được tạo tự động

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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## Các bề mặt OpenClaw được hỗ trợ

Plugin đi kèm đăng ký tất cả các bề mặt DeepInfra khớp với các hợp đồng nhà cung cấp OpenClaw hiện tại:

| Bề mặt                  | Mô hình mặc định                      | Cấu hình/công cụ OpenClaw                                     |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| Trò chuyện / nhà cung cấp mô hình    | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| Tạo/chỉnh sửa hình ảnh | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Hiểu phương tiện      | `moonshotai/Kimi-K2.5` cho hình ảnh  | hiểu hình ảnh đầu vào                              |
| Chuyển giọng nói thành văn bản           | `openai/whisper-large-v3-turbo`    | phiên âm âm thanh đầu vào                              |
| Chuyển văn bản thành giọng nói           | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| Tạo video         | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| Nhúng bộ nhớ        | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra cũng cung cấp tính năng xếp hạng lại, phân loại, phát hiện đối tượng và các loại mô hình gốc khác. OpenClaw hiện chưa có hợp đồng nhà cung cấp hạng nhất cho các danh mục đó, nên Plugin này chưa đăng ký chúng.

## Các mô hình có sẵn

OpenClaw tự động phát hiện các mô hình DeepInfra có sẵn khi khởi động. Dùng `/models deepinfra` để xem danh sách đầy đủ các mô hình có sẵn.

Bất kỳ mô hình nào có trên [DeepInfra.com](https://deepinfra.com/) đều có thể được dùng với tiền tố `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## Ghi chú

- Tham chiếu mô hình có dạng `deepinfra/<provider>/<model>` (ví dụ: `deepinfra/Qwen/Qwen3-Max`).
- Mô hình mặc định: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- URL cơ sở: `https://api.deepinfra.com/v1/openai`
- Tạo video gốc dùng `https://api.deepinfra.com/v1/inference/<model>`.
