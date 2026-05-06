---
read_when:
    - Bạn muốn sử dụng bản xem trước Tencent Hy3 với OpenClaw
    - Bạn cần thiết lập khóa API TokenHub
summary: Thiết lập Tencent Cloud TokenHub cho bản xem trước Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T09:28:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud được cung cấp dưới dạng plugin nhà cung cấp được đóng gói kèm trong OpenClaw. Nó cho phép truy cập Tencent Hy3 preview thông qua điểm cuối TokenHub (`tencent-tokenhub`) bằng API tương thích OpenAI.

| Thuộc tính        | Giá trị                                               |
| ----------------- | ----------------------------------------------------- |
| Id nhà cung cấp   | `tencent-tokenhub`                                    |
| Plugin            | được đóng gói kèm, `enabledByDefault: true`           |
| Biến env xác thực | `TOKENHUB_API_KEY`                                    |
| Cờ onboarding     | `--auth-choice tokenhub-api-key`                      |
| Cờ CLI trực tiếp  | `--tokenhub-api-key <key>`                            |
| API               | tương thích OpenAI (`openai-completions`)             |
| URL cơ sở mặc định | `https://tokenhub.tencentmaas.com/v1`                |
| URL cơ sở toàn cầu | `https://tokenhub-intl.tencentmaas.com/v1` (ghi đè)  |
| Mô hình mặc định  | `tencent-tokenhub/hy3-preview`                        |

## Bắt đầu nhanh

<Steps>
  <Step title="Tạo khóa API TokenHub">
    Tạo khóa API trong Tencent Cloud TokenHub. Nếu bạn chọn phạm vi truy cập giới hạn cho khóa, hãy bao gồm **Hy3 preview** trong các mô hình được phép.
  </Step>
  <Step title="Chạy onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
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

## Catalog tích hợp

| Tham chiếu mô hình              | Tên                    | Đầu vào | Ngữ cảnh | Đầu ra tối đa | Ghi chú                      |
| ------------------------------- | ---------------------- | ------- | -------- | ------------- | ---------------------------- |
| `tencent-tokenhub/hy3-preview`  | Hy3 preview (TokenHub) | văn bản | 256,000  | 64,000        | Mặc định; hỗ trợ reasoning   |

Hy3 preview là mô hình ngôn ngữ MoE lớn của Tencent Hunyuan dành cho reasoning, làm theo chỉ dẫn với ngữ cảnh dài, mã và quy trình tác vụ agent. Các ví dụ tương thích OpenAI của Tencent dùng `hy3-preview` làm id mô hình và hỗ trợ gọi công cụ chat-completions tiêu chuẩn cùng với `reasoning_effort`.

<Tip>
  Id mô hình là `hy3-preview`. Đừng nhầm với các mô hình `HY-3D-*` của Tencent, vốn là API tạo 3D và không phải mô hình chat OpenClaw được nhà cung cấp này cấu hình.
</Tip>

## Giá theo bậc

Catalog được đóng gói kèm cung cấp metadata chi phí theo bậc, thay đổi theo độ dài cửa sổ đầu vào, nên các ước tính chi phí được điền sẵn mà không cần ghi đè thủ công.

| Phạm vi token đầu vào | Giá đầu vào | Giá đầu ra | Đọc cache |
| --------------------- | ----------- | ---------- | --------- |
| 0 - 16,000            | 0.176       | 0.587      | 0.059     |
| 16,000 - 32,000       | 0.235       | 0.939      | 0.088     |
| 32,000+               | 0.293       | 1.173      | 0.117     |

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

  <Accordion title="Khả dụng môi trường cho daemon">
    Nếu Gateway chạy như một dịch vụ được quản lý (launchd, systemd, Docker), `TOKENHUB_API_KEY` phải hiển thị với tiến trình đó. Đặt nó trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv` để các môi trường launchd, systemd hoặc Docker exec có thể đọc được.

    <Warning>
      Các khóa chỉ đặt trong `~/.profile` không hiển thị với các tiến trình gateway được quản lý. Dùng tệp env hoặc seam cấu hình để đảm bảo khả dụng lâu dài.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi failover.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration" icon="gear">
    Schema cấu hình đầy đủ, bao gồm cài đặt nhà cung cấp.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Trang sản phẩm TokenHub của Tencent Cloud.
  </Card>
  <Card title="Thẻ mô hình Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Chi tiết và benchmark của Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
