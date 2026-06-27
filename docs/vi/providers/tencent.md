---
read_when:
    - Bạn muốn dùng bản xem trước Tencent Hy3 với OpenClaw
    - Bạn cần thiết lập khóa API TokenHub
summary: Thiết lập Tencent Cloud TokenHub cho bản xem trước Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T18:06:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

Cài đặt Plugin nhà cung cấp Tencent Cloud chính thức để truy cập Tencent Hy3 preview thông qua điểm cuối TokenHub (`tencent-tokenhub`) bằng API tương thích với OpenAI.

| Thuộc tính        | Giá trị                                               |
| ----------------- | ----------------------------------------------------- |
| ID nhà cung cấp   | `tencent-tokenhub`                                    |
| Gói               | `@openclaw/tencent-provider`                          |
| Biến môi trường xác thực | `TOKENHUB_API_KEY`                            |
| Cờ thiết lập ban đầu | `--auth-choice tokenhub-api-key`                   |
| Cờ CLI trực tiếp  | `--tokenhub-api-key <key>`                            |
| API               | Tương thích với OpenAI (`openai-completions`)         |
| URL cơ sở mặc định | `https://tokenhub.tencentmaas.com/v1`                |
| URL cơ sở toàn cầu | `https://tokenhub-intl.tencentmaas.com/v1` (ghi đè) |
| Mô hình mặc định  | `tencent-tokenhub/hy3-preview`                        |

## Bắt đầu nhanh

<Steps>
  <Step title="Cài đặt Plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Tạo khóa API TokenHub">
    Tạo khóa API trong Tencent Cloud TokenHub. Nếu bạn chọn phạm vi truy cập giới hạn cho khóa, hãy bao gồm **Hy3 preview** trong các mô hình được phép.
  </Step>
  <Step title="Chạy thiết lập ban đầu">
    <CodeGroup>

```bash Thiết lập ban đầu
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Cờ trực tiếp
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Chỉ env
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Xác minh mô hình">
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

| Tham chiếu mô hình             | Tên                    | Đầu vào | Ngữ cảnh | Đầu ra tối đa | Ghi chú                    |
| ------------------------------ | ---------------------- | ------- | -------- | ------------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text    | 256,000  | 64,000        | Mặc định; hỗ trợ suy luận  |

Hy3 preview là mô hình ngôn ngữ MoE lớn Tencent Hunyuan dành cho suy luận, làm theo hướng dẫn với ngữ cảnh dài, mã và quy trình tác tử. Các ví dụ tương thích OpenAI của Tencent dùng `hy3-preview` làm ID mô hình và hỗ trợ gọi công cụ chat-completions tiêu chuẩn cùng với `reasoning_effort`.

<Tip>
  ID mô hình là `hy3-preview`. Đừng nhầm với các mô hình `HY-3D-*` của Tencent, vốn là API tạo 3D và không phải mô hình trò chuyện OpenClaw được nhà cung cấp này cấu hình.
</Tip>

## Giá theo bậc

Danh mục nhà cung cấp đi kèm siêu dữ liệu chi phí theo bậc, co giãn theo độ dài cửa sổ đầu vào, nên ước tính chi phí được điền mà không cần ghi đè thủ công.

| Phạm vi token đầu vào | Giá đầu vào | Giá đầu ra | Đọc bộ nhớ đệm |
| --------------------- | ----------- | ---------- | -------------- |
| 0 - 16,000            | 0.176       | 0.587      | 0.059          |
| 16,000 - 32,000       | 0.235       | 0.939      | 0.088          |
| 32,000+               | 0.293       | 1.173      | 0.117          |

Mức giá tính theo mỗi triệu token bằng USD như Tencent công bố. Chỉ ghi đè giá trong `models.providers.tencent-tokenhub` khi bạn cần một bề mặt khác.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Ghi đè điểm cuối">
    OpenClaw mặc định dùng điểm cuối `https://tokenhub.tencentmaas.com/v1` của Tencent Cloud. Tencent cũng tài liệu hóa một điểm cuối TokenHub quốc tế:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Chỉ ghi đè điểm cuối khi tài khoản hoặc khu vực TokenHub của bạn yêu cầu.

  </Accordion>

  <Accordion title="Tính khả dụng của môi trường cho daemon">
    Nếu Gateway chạy dưới dạng dịch vụ được quản lý (launchd, systemd, Docker), `TOKENHUB_API_KEY` phải hiển thị với tiến trình đó. Đặt nó trong `~/.openclaw/.env` hoặc qua `env.shellEnv` để các môi trường launchd, systemd hoặc Docker exec có thể đọc được.

    <Warning>
      Các khóa chỉ được export trong shell tương tác sẽ không hiển thị với các tiến trình Gateway được quản lý. Hãy dùng tệp env hoặc cấu hình để có tính khả dụng bền vững.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration" icon="gear">
    Sơ đồ cấu hình đầy đủ, bao gồm cài đặt nhà cung cấp.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Trang sản phẩm TokenHub của Tencent Cloud.
  </Card>
  <Card title="Thẻ mô hình Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Chi tiết và benchmark của Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
