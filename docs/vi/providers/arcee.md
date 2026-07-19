---
read_when:
    - Bạn muốn sử dụng Arcee AI với OpenClaw
    - Bạn cần biến môi trường chứa khóa API hoặc lựa chọn xác thực CLI
summary: Thiết lập Arcee AI (xác thực + lựa chọn mô hình)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-19T05:57:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a4c2fc7b8d86dd0d2a300dfc48951657cbcfcd9250016f52c1804777b2966e11
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) cung cấp dòng mô hình hỗn hợp chuyên gia Trinity thông qua API tương thích với OpenAI. Tất cả mô hình Trinity đều được cấp phép theo Apache 2.0. Arcee là Plugin chính thức của OpenClaw, không được đóng gói cùng lõi, vì vậy cần thực hiện bước cài đặt trước khi thiết lập ban đầu.

Truy cập trực tiếp các mô hình Arcee thông qua nền tảng Arcee hoặc qua [OpenRouter](/vi/providers/openrouter).

| Thuộc tính | Giá trị                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Nhà cung cấp | `arcee`                                                                               |
| Xác thực     | `ARCEEAI_API_KEY` (trực tiếp) hoặc `OPENROUTER_API_KEY` (qua OpenRouter)                   |
| API      | Tương thích với OpenAI                                                                     |
| URL cơ sở | `https://api.arcee.ai/api/v1` (trực tiếp) hoặc `https://openrouter.ai/api/v1` (OpenRouter) |

## Cài đặt Plugin

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Bắt đầu

<Tabs>
  <Tab title="Trực tiếp (nền tảng Arcee)">
    <Steps>
      <Step title="Lấy khóa API">
        Tạo khóa API tại [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Chạy thiết lập ban đầu">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Đặt mô hình mặc định">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Qua OpenRouter">
    <Steps>
      <Step title="Lấy khóa API">
        Tạo khóa API tại [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Chạy thiết lập ban đầu">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Đặt mô hình mặc định">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Các tham chiếu mô hình giống nhau hoạt động cho cả cấu hình trực tiếp và qua OpenRouter.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Thiết lập không tương tác

<Tabs>
  <Tab title="Trực tiếp (nền tảng Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Qua OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Danh mục Arcee trực tiếp

| Tham chiếu mô hình                      | Tên                   | Đầu vào | Ngữ cảnh | Đầu ra tối đa | Chi phí (đầu vào/đầu ra trên mỗi 1M) | Công cụ | Ghi chú                                     |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | văn bản  | 256K    | 80K        | $0.25 / $0.90        | Không    | Mô hình mặc định; suy luận mở rộng          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | văn bản  | 128K    | 16K        | $0.25 / $1.00        | Có   | Đa dụng; 400B tham số, 13B hoạt động  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | văn bản  | 128K    | 80K        | $0.045 / $0.15       | Có   | Nhanh và tiết kiệm chi phí; gọi hàm |

<Tip>
Cấu hình thiết lập ban đầu đặt `arcee/trinity-large-thinking` làm mô hình mặc định.
</Tip>

## Danh mục OpenRouter

Quá trình thiết lập ban đầu OpenRouter cung cấp `arcee/trinity-large-preview` và `arcee/trinity-large-thinking`. OpenClaw giữ các tham chiếu mô hình kèm định danh nhà cung cấp đó trong cấu hình và gửi các ID thời gian chạy chính tắc `arcee-ai/*` của OpenRouter. Trinity Mini không còn được OpenRouter cung cấp; hãy sử dụng API Arcee trực tiếp cho mô hình đó.

## Các tính năng được hỗ trợ

| Tính năng                                       | Được hỗ trợ                                    |
| --------------------------------------------- | -------------------------------------------- |
| Truyền phát                                     | Có                                          |
| Sử dụng công cụ / gọi hàm                   | Có (Trinity Mini, Trinity Large Preview)    |
| Đầu ra có cấu trúc (chế độ JSON và lược đồ JSON) | Có                                          |
| Suy luận mở rộng                             | Có (Trinity Large Thinking; công cụ bị tắt) |

<AccordionGroup>
  <Accordion title="Lưu ý về môi trường">
    Nếu Gateway chạy dưới dạng tiến trình nền (launchd/systemd), hãy bảo đảm `ARCEEAI_API_KEY`
    (hoặc `OPENROUTER_API_KEY`) khả dụng cho tiến trình đó, chẳng hạn trong
    `~/.openclaw/.env` hoặc qua `env.shellEnv`.
  </Accordion>

  <Accordion title="Định tuyến OpenRouter">
    OpenRouter sử dụng cùng tham chiếu mô hình OpenClaw `arcee/trinity-large-thinking`.
    OpenClaw định tuyến tham chiếu này bằng ID thời gian chạy OpenRouter chính tắc
    `arcee-ai/trinity-large-thinking`. Xem
    [tài liệu về nhà cung cấp OpenRouter](/vi/providers/openrouter) để biết chi tiết
    cấu hình dành riêng cho OpenRouter.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/vi/providers/openrouter" icon="shuffle">
    Truy cập các mô hình Arcee và nhiều mô hình khác bằng một khóa API duy nhất.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
