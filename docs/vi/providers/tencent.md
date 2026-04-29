---
read_when:
    - Bạn muốn sử dụng bản xem trước Tencent Hy3 với OpenClaw
    - Bạn cần thiết lập khóa API TokenHub
summary: Thiết lập Tencent Cloud TokenHub cho bản xem trước Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-29T23:09:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 16
---

# Tencent Cloud TokenHub

Tencent Cloud được cung cấp dưới dạng **Plugin nhà cung cấp được đóng gói kèm** trong OpenClaw. Nó cho phép truy cập Tencent Hy3 preview thông qua endpoint TokenHub (`tencent-tokenhub`).

Nhà cung cấp này sử dụng API tương thích OpenAI.

| Thuộc tính       | Giá trị                                    |
| --------------- | ------------------------------------------ |
| Nhà cung cấp     | `tencent-tokenhub`                         |
| Mô hình mặc định | `tencent-tokenhub/hy3-preview`             |
| Xác thực         | `TOKENHUB_API_KEY`                         |
| API             | hoàn tất trò chuyện tương thích OpenAI     |
| URL cơ sở        | `https://tokenhub.tencentmaas.com/v1`      |
| URL toàn cầu     | `https://tokenhub-intl.tencentmaas.com/v1` |

## Bắt đầu nhanh

<Steps>
  <Step title="Create a TokenHub API key">
    Tạo khóa API trong Tencent Cloud TokenHub. Nếu bạn chọn phạm vi truy cập giới hạn cho khóa, hãy bao gồm **Hy3 preview** trong các mô hình được phép.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="Verify the model">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Thiết lập không tương tác

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Danh mục tích hợp sẵn

| Tham chiếu mô hình             | Tên                    | Đầu vào | Ngữ cảnh | Đầu ra tối đa | Ghi chú                       |
| ------------------------------ | ---------------------- | ------- | -------- | ------------- | ----------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | văn bản | 256,000  | 64,000        | Mặc định; hỗ trợ suy luận     |

Hy3 preview là mô hình ngôn ngữ MoE lớn của Tencent Hunyuan dành cho suy luận, làm theo chỉ dẫn ngữ cảnh dài, mã và quy trình agent. Các ví dụ tương thích OpenAI của Tencent dùng `hy3-preview` làm id mô hình và hỗ trợ gọi công cụ chat-completions tiêu chuẩn cùng với `reasoning_effort`.

<Tip>
id mô hình là `hy3-preview`. Đừng nhầm nó với các mô hình `HY-3D-*` của Tencent, vốn là API tạo 3D và không phải mô hình chat OpenClaw được nhà cung cấp này cấu hình.
</Tip>

## Ghi đè endpoint

OpenClaw mặc định dùng endpoint `https://tokenhub.tencentmaas.com/v1` của Tencent Cloud. Tencent cũng ghi tài liệu về một endpoint TokenHub quốc tế:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

Chỉ ghi đè endpoint khi tài khoản hoặc khu vực TokenHub của bạn yêu cầu.

## Ghi chú

- Tham chiếu mô hình TokenHub dùng `tencent-tokenhub/<modelId>`.
- Danh mục đóng gói kèm hiện bao gồm `hy3-preview`.
- Plugin đánh dấu Hy3 preview là có khả năng suy luận và có khả năng sử dụng streaming.
- Plugin đi kèm siêu dữ liệu giá Hy3 theo tầng, vì vậy ước tính chi phí được điền mà không cần ghi đè giá thủ công.
- Chỉ ghi đè siêu dữ liệu giá, ngữ cảnh hoặc endpoint trong `models.providers` khi cần.

## Ghi chú môi trường

Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo `TOKENHUB_API_KEY`
có sẵn cho tiến trình đó (ví dụ, trong `~/.openclaw/.env` hoặc thông qua
`env.shellEnv`).

## Tài liệu liên quan

- [Cấu hình OpenClaw](/vi/gateway/configuration)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Trang sản phẩm Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [Tạo văn bản Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [Thiết lập Tencent TokenHub Cline cho Hy3 preview](https://cloud.tencent.com/document/product/1823/130932)
- [Thẻ mô hình Tencent Hy3 preview](https://huggingface.co/tencent/Hy3-preview)
