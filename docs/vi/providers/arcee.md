---
read_when:
    - Bạn muốn sử dụng Arcee AI với OpenClaw
    - Bạn cần biến môi trường khóa API hoặc lựa chọn xác thực CLI
summary: Thiết lập Arcee AI (xác thực + chọn mô hình)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) cung cấp quyền truy cập vào dòng mô hình mixture-of-experts Trinity thông qua API tương thích với OpenAI. Tất cả mô hình Trinity đều được cấp phép Apache 2.0.

Có thể truy cập các mô hình Arcee AI trực tiếp qua nền tảng Arcee hoặc thông qua [OpenRouter](/vi/providers/openrouter).

| Thuộc tính | Giá trị                                                                               |
| -------- | ------------------------------------------------------------------------------------- |
| Provider | `arcee`                                                                               |
| Xác thực | `ARCEEAI_API_KEY` (trực tiếp) hoặc `OPENROUTER_API_KEY` (qua OpenRouter)              |
| API      | Tương thích với OpenAI                                                                |
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

        Các model ref tương tự hoạt động cho cả thiết lập trực tiếp và qua OpenRouter (ví dụ `arcee/trinity-large-thinking`).
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

OpenClaw hiện đi kèm danh mục Arcee được đóng gói này:

| Model ref                      | Tên                    | Đầu vào | Ngữ cảnh | Chi phí (vào/ra trên 1 triệu) | Ghi chú                                   |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | Mô hình mặc định; đã bật reasoning        |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | Đa dụng; 400B tham số, 13B active         |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | Nhanh và tiết kiệm chi phí; gọi hàm       |

<Tip>
Preset onboarding đặt `arcee/trinity-large-thinking` làm mô hình mặc định.
</Tip>

## Tính năng được hỗ trợ

| Tính năng                                      | Được hỗ trợ                                  |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Có                                           |
| Sử dụng công cụ / gọi hàm                     | Có (Trinity Mini, Trinity Large Preview)     |
| Đầu ra có cấu trúc (chế độ JSON và schema JSON) | Có                                         |
| Extended thinking                             | Có (Trinity Large Thinking; đã tắt công cụ)  |

<AccordionGroup>
  <Accordion title="Environment note">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo `ARCEEAI_API_KEY`
    (hoặc `OPENROUTER_API_KEY`) khả dụng cho tiến trình đó (ví dụ, trong
    `~/.openclaw/.env` hoặc qua `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter routing">
    Khi sử dụng mô hình Arcee qua OpenRouter, các model ref `arcee/*` tương tự được áp dụng.
    OpenClaw xử lý định tuyến một cách trong suốt dựa trên lựa chọn xác thực của bạn. Xem
    [tài liệu provider OpenRouter](/vi/providers/openrouter) để biết chi tiết cấu hình
    dành riêng cho OpenRouter.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/vi/providers/openrouter" icon="shuffle">
    Truy cập các mô hình Arcee và nhiều mô hình khác thông qua một khóa API duy nhất.
  </Card>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn provider, model ref và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
