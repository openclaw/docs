---
read_when:
    - Bạn muốn chạy OpenClaw với các mô hình GMI Cloud
    - Bạn cần id, khóa hoặc endpoint của nhà cung cấp GMI
summary: Sử dụng API tương thích với OpenAI của GMI Cloud với OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-06-27T18:03:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119db777a2285259d646c9b5ab7e3885e3c7c714039277fa06a5a881e46284b9
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud là một nền tảng suy luận được lưu trữ cho các mô hình tiên phong và mô hình trọng số mở
phía sau một API tương thích với OpenAI. Trong OpenClaw, đây là một Plugin nhà cung cấp bên ngoài chính thức,
nghĩa là bạn cài đặt một lần, chọn bằng id nhà cung cấp `gmi`,
lưu thông tin xác thực thông qua xác thực mô hình thông thường, và dùng các tham chiếu mô hình như
`gmi/google/gemini-3.1-flash-lite`.

Dùng GMI khi bạn muốn một khóa API cho nhiều họ mô hình được lưu trữ, bao gồm
các tuyến Google, Anthropic, OpenAI, DeepSeek, Moonshot và Z.AI do danh mục của GMI
cung cấp. Nó hữu ích như một nhà cung cấp phụ để dự phòng mô hình, để so sánh
các tuyến được lưu trữ giữa các nhà cung cấp, hoặc khi GMI có sẵn một mô hình trước
nhà cung cấp chính của bạn.

Nhà cung cấp này dùng ngữ nghĩa chat tương thích với OpenAI. OpenClaw sở hữu
id nhà cung cấp, hồ sơ xác thực, bí danh, hạt giống danh mục mô hình và URL cơ sở; GMI sở hữu
tính khả dụng mô hình trực tiếp, thanh toán, giới hạn tốc độ và mọi chính sách định tuyến phía nhà cung cấp.

## Thiết lập

Cài đặt Plugin, khởi động lại gateway, rồi tạo khóa API trong GMI Cloud:

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Sau đó chạy:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Hoặc đặt:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Mặc định

- Nhà cung cấp: `gmi`
- Bí danh: `gmi-cloud`, `gmicloud`
- URL cơ sở: `https://api.gmi-serving.com/v1`
- Biến môi trường: `GMI_API_KEY`
- Mô hình mặc định: `gmi/google/gemini-3.1-flash-lite`

## Khi nào chọn GMI

- Bạn muốn một điểm cuối được lưu trữ tương thích với OpenAI thay vì máy chủ mô hình cục bộ.
- Bạn muốn thử nhiều họ mô hình thương mại và trọng số mở thông qua một
  tài khoản nhà cung cấp.
- Bạn muốn một nhà cung cấp dự phòng có định tuyến thượng nguồn khác với OpenRouter,
  DeepInfra, Together hoặc API trực tiếp của nhà cung cấp.
- Bạn cần id mô hình, giá hoặc kiểm soát tài khoản riêng của GMI.

Hãy chọn nhà cung cấp trực tiếp của nhà cung cấp gốc thay vào đó khi bạn cần các tính năng gốc của nhà cung cấp
mà GMI không cung cấp qua tuyến tương thích với OpenAI của mình. Chọn một nhà cung cấp cục bộ
như Ollama, LM Studio, vLLM hoặc SGLang khi tính cục bộ dữ liệu hoặc quyền kiểm soát
GPU cục bộ quan trọng hơn sự tiện lợi của dịch vụ được lưu trữ.

## Mô hình

Danh mục Plugin gieo sẵn các id tuyến GMI Cloud thường có sẵn, bao gồm:

- `gmi/zai-org/GLM-5.1-FP8`
- `gmi/deepseek-ai/DeepSeek-V3.2`
- `gmi/moonshotai/Kimi-K2.5`
- `gmi/google/gemini-3.1-flash-lite`
- `gmi/anthropic/claude-sonnet-4.6`
- `gmi/openai/gpt-5.4`

Danh mục là hạt giống, không phải cam kết rằng mọi tài khoản đều có thể gọi mọi mô hình vào
mọi thời điểm. Dùng lệnh liệt kê mô hình của OpenClaw để xem nhà cung cấp đã cấu hình
báo cáo gì trong môi trường của bạn:

```bash
openclaw models list --provider gmi
```

## Khắc phục sự cố

- `401` hoặc `403`: kiểm tra rằng `GMI_API_KEY` đã được đặt cho tiến trình đang chạy
  OpenClaw, hoặc chạy lại quy trình nhập môn để lưu khóa trong hồ sơ xác thực nhà cung cấp.
- Lỗi mô hình không xác định: xác nhận mô hình tồn tại trong tài khoản GMI của bạn và dùng
  tham chiếu `gmi/<route-id>` đầy đủ được hiển thị bởi `openclaw models list --provider gmi`.
- Lỗi nhà cung cấp không liên tục: thử một tuyến GMI khác hoặc cấu hình GMI làm
  dự phòng thay vì là nhà cung cấp mô hình chính duy nhất.

## Liên quan

- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Tất cả nhà cung cấp](/vi/providers/index)
