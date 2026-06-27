---
read_when:
    - Bạn muốn sử dụng Cohere với OpenClaw
    - Bạn cần biến môi trường khóa API Cohere hoặc lựa chọn xác thực CLI
summary: Thiết lập Cohere (xác thực + chọn mô hình)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:02:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) cung cấp suy luận tương thích với OpenAI thông qua API Tương thích. OpenClaw phân phối nhà cung cấp Cohere trong giai đoạn chuyển đổi tách ra bên ngoài và cũng phát hành nó dưới dạng Plugin bên ngoài chính thức với danh mục mô hình Command A.

| Thuộc tính      | Giá trị                                              |
| --------------- | ---------------------------------------------------- |
| ID nhà cung cấp | `cohere`                                             |
| Plugin          | được đóng gói kèm trong giai đoạn chuyển đổi; gói bên ngoài chính thức |
| Biến môi trường xác thực | `COHERE_API_KEY`                         |
| Cờ thiết lập ban đầu | `--auth-choice cohere-api-key`                   |
| Cờ CLI trực tiếp | `--cohere-api-key <key>`                            |
| API             | tương thích với OpenAI (`openai-completions`)        |
| URL cơ sở       | `https://api.cohere.ai/compatibility/v1`             |
| Mô hình mặc định | `cohere/command-a-03-2025`                          |

## Bắt đầu

1. Cohere được bao gồm trong các gói OpenClaw hiện tại. Nếu không có sẵn, hãy cài đặt gói bên ngoài và khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Tạo khóa API Cohere.
3. Chạy thiết lập ban đầu:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Xác nhận danh mục có sẵn:

```bash
openclaw models list --provider cohere
```

Mô hình mặc định chỉ được đặt khi chưa có mô hình chính nào được cấu hình.

## Thiết lập chỉ bằng môi trường

Cung cấp `COHERE_API_KEY` cho tiến trình Gateway, sau đó chọn mô hình Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Nếu Gateway chạy dưới dạng daemon hoặc trong Docker, hãy cấu hình `COHERE_API_KEY` cho dịch vụ đó. Chỉ xuất biến này trong trình bao tương tác sẽ không cung cấp nó cho Gateway đang chạy.
</Note>

## Liên quan

- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [CLI mô hình](/vi/cli/models)
- [Thư mục nhà cung cấp](/vi/providers)
