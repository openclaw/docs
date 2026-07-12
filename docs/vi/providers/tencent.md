---
read_when:
    - Bạn muốn sử dụng Tencent hy3 với OpenClaw
    - Bạn cần thiết lập khóa API TokenHub hoặc TokenPlan
summary: Thiết lập Tencent Cloud TokenHub và TokenPlan cho hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T08:19:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Cài đặt plugin nhà cung cấp Tencent Cloud chính thức để truy cập Tencent Hy3 qua hai điểm cuối — TokenHub (`tencent-tokenhub`) và TokenPlan (`tencent-tokenplan`) — bằng API tương thích với OpenAI.

| Thuộc tính                           | Giá trị                                               |
| ------------------------------------ | ----------------------------------------------------- |
| ID nhà cung cấp                      | `tencent-tokenhub`, `tencent-tokenplan`               |
| Gói                                  | `@openclaw/tencent-provider`                          |
| Biến môi trường xác thực TokenHub    | `TOKENHUB_API_KEY`                                    |
| Biến môi trường xác thực TokenPlan   | `TOKENPLAN_API_KEY`                                   |
| Cờ thiết lập ban đầu cho TokenHub    | `--auth-choice tokenhub-api-key`                      |
| Cờ thiết lập ban đầu cho TokenPlan   | `--auth-choice tokenplan-api-key`                     |
| Cờ CLI trực tiếp cho TokenHub        | `--tokenhub-api-key <key>`                            |
| Cờ CLI trực tiếp cho TokenPlan       | `--tokenplan-api-key <key>`                           |
| API                                  | Tương thích với OpenAI (`openai-completions`)         |
| URL cơ sở của TokenHub               | `https://tokenhub.tencentmaas.com/v1`                 |
| URL cơ sở toàn cầu của TokenHub      | `https://tokenhub-intl.tencentmaas.com/v1` (ghi đè)   |
| URL cơ sở của TokenPlan              | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| Mô hình mặc định                     | `tencent-tokenhub/hy3`                                |

## Bắt đầu nhanh

<Steps>
  <Step title="Tạo khóa API Tencent">
    Tạo khóa API cho Tencent Cloud TokenHub và TokenPlan. Nếu chọn phạm vi truy cập giới hạn cho khóa, hãy đưa **hy3** (và **hy3 preview** nếu bạn dự định sử dụng mô hình này trên TokenHub) vào danh sách mô hình được phép.
  </Step>
  <Step title="Chạy quy trình thiết lập ban đầu">
    <CodeGroup>

```bash TokenHub onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash TokenHub direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash TokenPlan onboarding
openclaw onboard --auth-choice tokenplan-api-key
```

```bash TokenPlan direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Xác minh mô hình">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Thiết lập không tương tác

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
Phải sử dụng `--accept-risk` cùng với `--non-interactive`.
</Note>

## Danh mục tích hợp sẵn

| Tham chiếu mô hình             | Tên                    | Đầu vào | Ngữ cảnh | Đầu ra tối đa | Ghi chú               |
| ------------------------------ | ---------------------- | ------- | -------- | ------------ | --------------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub) | văn bản | 256,000  | 64,000       | hỗ trợ suy luận        |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | văn bản | 256,000  | 64,000       | hỗ trợ suy luận        |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | văn bản | 256,000  | 64,000       | hỗ trợ suy luận        |

hy3 là mô hình ngôn ngữ MoE lớn của Tencent Hunyuan dành cho suy luận, tuân theo chỉ dẫn với ngữ cảnh dài, lập trình và quy trình làm việc của tác nhân. Các ví dụ tương thích với OpenAI của Tencent sử dụng `hy3` làm ID mô hình và hỗ trợ gọi công cụ theo chuẩn chat completions cùng với `reasoning_effort`.

<Tip>
  ID mô hình là `hy3`. Đừng nhầm mô hình này với các mô hình `HY-3D-*` của Tencent; đó là các API tạo nội dung 3D, không phải mô hình trò chuyện OpenClaw do nhà cung cấp này cấu hình.
</Tip>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Ghi đè điểm cuối">
    Danh mục tích hợp sẵn của OpenClaw sử dụng điểm cuối `https://tokenhub.tencentmaas.com/v1` của Tencent Cloud. Chỉ ghi đè điểm cuối này nếu tài khoản hoặc khu vực TokenHub của bạn yêu cầu một điểm cuối khác:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Khả dụng của biến môi trường đối với tiến trình nền">
    Nếu Gateway chạy dưới dạng dịch vụ được quản lý (launchd, systemd, Docker), tiến trình đó phải truy cập được `TOKENHUB_API_KEY` và `TOKENPLAN_API_KEY`. Đặt chúng trong `~/.openclaw/.env` hoặc thông qua `env.shellEnv` để các môi trường thực thi của launchd, systemd hoặc Docker có thể đọc được.

    <Warning>
      Các khóa chỉ được xuất trong shell tương tác sẽ không hiển thị với các tiến trình Gateway được quản lý. Hãy sử dụng tệp môi trường hoặc điểm cấu hình để duy trì khả năng truy cập lâu dài.
    </Warning>

  </Accordion>
</AccordionGroup>

## Nội dung liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tài liệu tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ, bao gồm các thiết lập nhà cung cấp.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Trang sản phẩm TokenHub của Tencent Cloud.
  </Card>
  <Card title="Thẻ mô hình Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Chi tiết và kết quả đánh giá hiệu năng của Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
