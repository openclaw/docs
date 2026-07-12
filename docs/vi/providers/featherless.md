---
read_when:
    - Bạn muốn sử dụng Featherless AI với OpenClaw
    - Bạn cần biến môi trường chứa khóa API Featherless hoặc định dạng tham chiếu mô hình
summary: Thiết lập Featherless AI, lựa chọn mô hình và gọi công cụ
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T08:15:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) cung cấp các mô hình mở thông qua một
API tương thích với OpenAI. OpenClaw cài đặt Featherless dưới dạng Plugin nhà
cung cấp bên ngoài chính thức và duy trì danh mục tích hợp ở quy mô nhỏ, đồng
thời chấp nhận mã định danh mô hình chính xác từ Featherless trong thời gian chạy.

| Thuộc tính                  | Giá trị                                  |
| --------------------------- | ---------------------------------------- |
| Mã định danh nhà cung cấp   | `featherless`                            |
| Gói                         | `@openclaw/featherless-provider`         |
| Biến môi trường xác thực    | `FEATHERLESS_API_KEY`                    |
| Cờ thiết lập ban đầu        | `--auth-choice featherless-api-key`      |
| Cờ CLI trực tiếp            | `--featherless-api-key <key>`            |
| API                         | Tương thích OpenAI (`openai-completions`) |
| URL cơ sở                   | `https://api.featherless.ai/v1`          |
| Mô hình mặc định            | `featherless/Qwen/Qwen3-32B`             |

## Thiết lập

Cài đặt Plugin và khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

Chạy quy trình thiết lập ban đầu:

```bash
openclaw onboard --auth-choice featherless-api-key
```

Để thiết lập không tương tác:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

Hoặc cung cấp khóa cho tiến trình Gateway:

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

Xác minh nhà cung cấp:

```bash
openclaw models list --provider featherless
```

## Mô hình mặc định

Plugin sử dụng `Qwen/Qwen3-32B` làm mô hình mặc định khi thiết lập vì tài liệu
Featherless nêu rõ khả năng gọi công cụ nguyên bản cho họ Qwen 3. OpenClaw cấu
hình cửa sổ ngữ cảnh 32.768 token, giới hạn đầu ra thận trọng ở mức 4.096 token
và các cơ chế điều khiển suy luận của mẫu trò chuyện Qwen.

Các trường chi phí trong danh mục có giá trị bằng không vì Featherless hỗ trợ
nhiều phương thức thanh toán và OpenClaw không nhúng mức giá theo gói tài khoản
hoặc theo yêu cầu cụ thể.

## Các mô hình Featherless khác

Sử dụng mã định danh mô hình Featherless chính xác sau tiền tố nhà cung cấp
`featherless/`:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw chủ ý không sao chép toàn bộ chỉ mục mô hình công khai của Featherless
vào trình chọn. Chỉ mục này có quy mô lớn và không cung cấp đủ siêu dữ liệu có
cấu trúc về khả năng để phân loại an toàn mọi mô hình văn bản, thị giác, nhúng
và suy luận. Do đó, các mã định danh không xác định được phân giải bằng các giá
trị mặc định thận trọng: chỉ hỗ trợ văn bản, không suy luận, cửa sổ ngữ cảnh
4.096 token và giới hạn đầu ra 1.024 token.

Thêm một mục mô hình nhà cung cấp rõ ràng khi mô hình cần siêu dữ liệu khác:

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

Kiểm tra danh mục mô hình của Featherless để biết tính khả dụng hiện tại và các
thẻ khả năng của mô hình trước khi thêm siêu dữ liệu tùy chỉnh.

## Khắc phục sự cố

- `401` hoặc `403`: xác nhận `FEATHERLESS_API_KEY` hiển thị với tiến trình
  Gateway hoặc chạy lại quy trình thiết lập ban đầu.
- Mô hình không xác định: sử dụng mã định danh phân biệt chữ hoa chữ thường
  chính xác từ Featherless sau tiền tố `featherless/`.
- Lệnh gọi công cụ được trả về dưới dạng văn bản: chọn một họ mô hình mà tài
  liệu Featherless xác nhận hỗ trợ gọi hàm nguyên bản, chẳng hạn như Qwen 3.
- Gateway được quản lý không thể truy cập khóa: đặt khóa vào
  `~/.openclaw/.env` hoặc một nguồn môi trường khác được dịch vụ tải, sau đó
  khởi động lại Gateway.

## Liên quan

- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Tất cả nhà cung cấp](/vi/providers/index)
- [Chế độ suy luận](/vi/tools/thinking)
