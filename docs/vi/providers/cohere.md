---
read_when:
    - Bạn muốn sử dụng Cohere với OpenClaw
    - Bạn cần biến môi trường chứa khóa API Cohere hoặc tùy chọn xác thực CLI
summary: Thiết lập Cohere (xác thực + lựa chọn mô hình)
title: Cohere
x-i18n:
    generated_at: "2026-07-12T08:19:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) cung cấp khả năng suy luận tương thích với OpenAI thông qua Compatibility API. OpenClaw tích hợp sẵn nhà cung cấp Cohere trong quá trình chuyển đổi sang dạng bên ngoài và cũng phát hành nhà cung cấp này dưới dạng Plugin bên ngoài chính thức.

| Thuộc tính               | Giá trị                                                         |
| ------------------------ | --------------------------------------------------------------- |
| ID nhà cung cấp          | `cohere`                                                        |
| Plugin                   | tích hợp sẵn trong quá trình chuyển đổi; gói bên ngoài chính thức |
| Biến môi trường xác thực | `COHERE_API_KEY`                                                |
| Cờ thiết lập ban đầu     | `--auth-choice cohere-api-key`                                  |
| Cờ CLI trực tiếp         | `--cohere-api-key <key>`                                        |
| API                      | tương thích với OpenAI (`openai-completions`)                    |
| URL cơ sở                | `https://api.cohere.ai/compatibility/v1`                         |
| Mô hình mặc định         | `cohere/command-a-plus-05-2026`                                 |
| Cửa sổ ngữ cảnh          | 128.000 token                                                   |

## Danh mục tích hợp sẵn

| Tham chiếu mô hình                    | Đầu vào       | Ngữ cảnh | Đầu ra tối đa | Ghi chú                                                       |
| ------------------------------------- | ------------- | -------- | ------------ | ------------------------------------------------------------- |
| `cohere/command-a-plus-05-2026`       | văn bản, hình ảnh | 128.000  | 64.000       | Mặc định; mô hình tác tử và suy luận chủ lực                  |
| `cohere/command-a-03-2025`            | văn bản       | 256.000  | 8.000        | Mô hình Command A trước đó                                    |
| `cohere/command-a-reasoning-08-2025`  | văn bản       | 256.000  | 32.000       | Suy luận tác tử và sử dụng công cụ                            |
| `cohere/command-a-vision-07-2025`     | văn bản, hình ảnh | 128.000  | 8.000        | Phân tích hình ảnh và tài liệu; không hỗ trợ sử dụng công cụ  |
| `cohere/north-mini-code-1-0`          | văn bản, hình ảnh | 256.000  | 64.000       | Lập trình tác tử; suy luận; hạn mức miễn phí                  |

Các mô hình Cohere có khả năng suy luận hỗ trợ hai chế độ suy luận của Compatibility API. OpenClaw ánh xạ **tắt** thành `none` và mọi mức tư duy được bật thành `high`. Command A Vision không hỗ trợ sử dụng công cụ, vì vậy OpenClaw giữ các công cụ tác tử ở trạng thái tắt đối với mô hình đó.

## Bắt đầu

1. Cohere được cung cấp cùng các gói OpenClaw hiện tại. Nếu thiếu, hãy cài đặt gói bên ngoài và khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Tạo khóa API Cohere.
3. Chạy quy trình thiết lập ban đầu:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Xác nhận danh mục đã khả dụng:

```bash
openclaw models list --provider cohere
```

Quy trình thiết lập ban đầu chỉ đặt Cohere làm mô hình chính khi chưa có mô hình chính nào được cấu hình.

## Thiết lập chỉ bằng môi trường

Cung cấp `COHERE_API_KEY` cho tiến trình Gateway, sau đó chọn mô hình Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
Nếu Gateway chạy dưới dạng daemon hoặc trong Docker, hãy đặt `COHERE_API_KEY` cho dịch vụ đó. Việc chỉ xuất biến này trong shell tương tác không làm cho nó khả dụng đối với Gateway đang chạy.
</Note>

## Liên quan

- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [CLI mô hình](/vi/cli/models)
- [Danh mục nhà cung cấp](/vi/providers/index)
