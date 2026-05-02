---
read_when:
    - Bạn muốn sử dụng Arcee AI với OpenClaw
    - Bạn cần biến môi trường khóa API hoặc tùy chọn xác thực CLI
summary: Thiết lập Arcee AI (xác thực + lựa chọn mô hình)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-02T23:39:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 622ee5288aec3ae0b45d3f06ba65fd6f972e07d7a7596ae3905d6fbdac0bf737
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) cung cấp quyền truy cập vào họ mô hình mixture-of-experts Trinity thông qua API tương thích với OpenAI. Tất cả mô hình Trinity đều được cấp phép Apache 2.0.

Có thể truy cập trực tiếp các mô hình Arcee AI qua nền tảng Arcee hoặc thông qua [OpenRouter](/vi/providers/openrouter).

| Thuộc tính | Giá trị                                                                               |
| -------- | ------------------------------------------------------------------------------------- |
| Nhà cung cấp | `arcee`                                                                               |
| Xác thực     | `ARCEEAI_API_KEY` (trực tiếp) hoặc `OPENROUTER_API_KEY` (qua OpenRouter)                   |
| API      | Tương thích với OpenAI                                                                     |
| URL cơ sở | `https://api.arcee.ai/api/v1` (trực tiếp) hoặc `https://openrouter.ai/api/v1` (OpenRouter) |

## Bắt đầu

<Tabs>
  <Tab title="Trực tiếp (nền tảng Arcee)">
    <Steps>
      <Step title="Lấy khóa API">
        Tạo khóa API tại [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Chạy onboarding">
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
      <Step title="Chạy onboarding">
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

        Cùng các tham chiếu mô hình hoạt động cho cả thiết lập trực tiếp và OpenRouter (ví dụ `arcee/trinity-large-thinking`).
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

## Danh mục tích hợp sẵn

OpenClaw hiện đi kèm danh mục Arcee được đóng gói này:

| Tham chiếu mô hình             | Tên                    | Đầu vào | Ngữ cảnh | Chi phí (vào/ra trên 1 triệu) | Ghi chú                                      |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | văn bản | 256K    | $0.25 / $0.90        | Mô hình mặc định; đã bật lập luận; không có công cụ |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | văn bản | 128K    | $0.25 / $1.00        | Đa dụng; 400B tham số, 13B hoạt động   |
| `arcee/trinity-mini`           | Trinity Mini 26B       | văn bản | 128K    | $0.045 / $0.15       | Nhanh và tiết kiệm chi phí; gọi hàm  |

<Tip>
Preset onboarding đặt `arcee/trinity-large-thinking` làm mô hình mặc định. Đây là mô hình chỉ hỗ trợ lập luận/văn bản và không hỗ trợ sử dụng công cụ hoặc gọi hàm.
</Tip>

## Tính năng được hỗ trợ

| Tính năng                                      | Được hỗ trợ                                  |
| --------------------------------------------- | ------------------------------------------- |
| Streaming                                     | Có                                         |
| Sử dụng công cụ / gọi hàm                   | Tùy thuộc mô hình; không phải Trinity Large Thinking |
| Đầu ra có cấu trúc (chế độ JSON và lược đồ JSON) | Có                                         |
| Suy nghĩ mở rộng                             | Có (Trinity Large Thinking)                |

<AccordionGroup>
  <Accordion title="Ghi chú môi trường">
    Nếu Gateway chạy dưới dạng daemon (launchd/systemd), hãy đảm bảo `ARCEEAI_API_KEY`
    (hoặc `OPENROUTER_API_KEY`) có sẵn cho tiến trình đó (ví dụ trong
    `~/.openclaw/.env` hoặc qua `env.shellEnv`).
  </Accordion>

  <Accordion title="Định tuyến OpenRouter">
    Khi sử dụng các mô hình Arcee qua OpenRouter, cùng các tham chiếu mô hình `arcee/*` sẽ được áp dụng.
    OpenClaw xử lý định tuyến một cách minh bạch dựa trên lựa chọn xác thực của bạn. Xem
    [tài liệu nhà cung cấp OpenRouter](/vi/providers/openrouter) để biết chi tiết cấu hình
    dành riêng cho OpenRouter.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/vi/providers/openrouter" icon="shuffle">
    Truy cập các mô hình Arcee và nhiều mô hình khác thông qua một khóa API duy nhất.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
