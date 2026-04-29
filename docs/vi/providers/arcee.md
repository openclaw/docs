---
read_when:
    - Bạn muốn sử dụng Arcee AI với OpenClaw
    - Bạn cần biến môi trường chứa khóa API hoặc lựa chọn xác thực CLI
summary: Thiết lập Arcee AI (xác thực + chọn mô hình)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-29T23:04:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) cung cấp quyền truy cập vào họ mô hình mixture-of-experts Trinity thông qua API tương thích OpenAI. Tất cả mô hình Trinity đều được cấp phép Apache 2.0.

Có thể truy cập các mô hình Arcee AI trực tiếp qua nền tảng Arcee hoặc thông qua [OpenRouter](/vi/providers/openrouter).

| Thuộc tính | Giá trị                                                                               |
| -------- | ------------------------------------------------------------------------------------- |
| Nhà cung cấp | `arcee`                                                                           |
| Xác thực | `ARCEEAI_API_KEY` (trực tiếp) hoặc `OPENROUTER_API_KEY` (qua OpenRouter)              |
| API      | Tương thích OpenAI                                                                    |
| URL cơ sở | `https://api.arcee.ai/api/v1` (trực tiếp) hoặc `https://openrouter.ai/api/v1` (OpenRouter) |

## Bắt đầu

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        Tạo khóa API tại [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
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

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Get an API key">
        Tạo khóa API tại [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Cùng các tham chiếu mô hình đó hoạt động cho cả thiết lập trực tiếp và OpenRouter (ví dụ `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Thiết lập không tương tác

<Tabs>
  <Tab title="Direct (Arcee platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Danh mục tích hợp sẵn

OpenClaw hiện đi kèm danh mục Arcee được đóng gói sẵn này:

| Tham chiếu mô hình             | Tên                    | Đầu vào | Ngữ cảnh | Chi phí (vào/ra mỗi 1M) | Ghi chú                                  |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | Mô hình mặc định; đã bật suy luận         |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | Đa dụng; 400B tham số, 13B hoạt động      |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | Nhanh và tiết kiệm chi phí; gọi hàm       |

<Tip>
Preset onboarding đặt `arcee/trinity-large-thinking` làm mô hình mặc định.
</Tip>

## Tính năng được hỗ trợ

| Tính năng                                     | Được hỗ trợ                  |
| --------------------------------------------- | ---------------------------- |
| Streaming                                     | Có                           |
| Sử dụng công cụ / gọi hàm                     | Có                           |
| Đầu ra có cấu trúc (chế độ JSON và lược đồ JSON) | Có                        |
| Suy nghĩ mở rộng                              | Có (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="Environment note">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy bảo đảm `ARCEEAI_API_KEY`
    (hoặc `OPENROUTER_API_KEY`) có sẵn cho tiến trình đó (ví dụ, trong
    `~/.openclaw/.env` hoặc qua `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter routing">
    Khi sử dụng các mô hình Arcee qua OpenRouter, cùng các tham chiếu mô hình `arcee/*` sẽ áp dụng.
    OpenClaw xử lý định tuyến một cách minh bạch dựa trên lựa chọn xác thực của bạn. Xem
    [tài liệu nhà cung cấp OpenRouter](/vi/providers/openrouter) để biết chi tiết cấu hình dành riêng cho OpenRouter.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/vi/providers/openrouter" icon="shuffle">
    Truy cập các mô hình Arcee và nhiều mô hình khác thông qua một khóa API duy nhất.
  </Card>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
