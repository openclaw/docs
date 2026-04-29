---
read_when:
    - Bạn muốn sử dụng các mô hình Z.AI / GLM trong OpenClaw
    - Bạn cần một thiết lập ZAI_API_KEY đơn giản
summary: Sử dụng Z.AI (các mô hình GLM) với OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-29T23:10:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI là nền tảng API cho các mô hình **GLM**. Nền tảng này cung cấp REST API cho GLM và sử dụng API key
để xác thực. Tạo API key của bạn trong bảng điều khiển Z.AI. OpenClaw sử dụng nhà cung cấp `zai`
với API key Z.AI.

- Nhà cung cấp: `zai`
- Xác thực: `ZAI_API_KEY`
- API: Z.AI Chat Completions (xác thực Bearer)

## Bắt đầu

<Tabs>
  <Tab title="Tự động phát hiện endpoint">
    **Phù hợp nhất cho:** hầu hết người dùng. OpenClaw phát hiện endpoint Z.AI phù hợp từ key và tự động áp dụng base URL chính xác.

    <Steps>
      <Step title="Chạy onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Đặt mô hình mặc định">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint khu vực rõ ràng">
    **Phù hợp nhất cho:** người dùng muốn ép dùng một Coding Plan hoặc bề mặt API chung cụ thể.

    <Steps>
      <Step title="Chọn lựa chọn onboarding phù hợp">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Đặt mô hình mặc định">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Xác minh mô hình có sẵn">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Danh mục tích hợp sẵn

OpenClaw hiện khởi tạo nhà cung cấp `zai` được đóng gói kèm với:

| Tham chiếu mô hình    | Ghi chú          |
| -------------------- | --------------- |
| `zai/glm-5.1`        | Mô hình mặc định |
| `zai/glm-5`          |                 |
| `zai/glm-5-turbo`    |                 |
| `zai/glm-5v-turbo`   |                 |
| `zai/glm-4.7`        |                 |
| `zai/glm-4.7-flash`  |                 |
| `zai/glm-4.7-flashx` |                 |
| `zai/glm-4.6`        |                 |
| `zai/glm-4.6v`       |                 |
| `zai/glm-4.5`        |                 |
| `zai/glm-4.5-air`    |                 |
| `zai/glm-4.5-flash`  |                 |
| `zai/glm-4.5v`       |                 |

<Tip>
Các mô hình GLM có sẵn dưới dạng `zai/<model>` (ví dụ: `zai/glm-5`). Tham chiếu mô hình mặc định được đóng gói kèm là `zai/glm-5.1`.
</Tip>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Phân giải chuyển tiếp các mô hình GLM-5 chưa biết">
    Các id `glm-5*` chưa biết vẫn được phân giải chuyển tiếp trên đường dẫn nhà cung cấp được đóng gói kèm bằng cách
    tổng hợp siêu dữ liệu do nhà cung cấp sở hữu từ mẫu `glm-4.7` khi id
    khớp với dạng họ GLM-5 hiện tại.
  </Accordion>

  <Accordion title="Streaming lệnh gọi công cụ">
    `tool_stream` được bật theo mặc định cho streaming lệnh gọi công cụ Z.AI. Để tắt tính năng này:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Thinking và thinking được giữ lại">
    Thinking của Z.AI tuân theo các điều khiển `/think` của OpenClaw. Khi tắt thinking,
    OpenClaw gửi `thinking: { type: "disabled" }` để tránh các phản hồi
    tiêu tốn ngân sách đầu ra cho `reasoning_content` trước phần văn bản hiển thị.

    Thinking được giữ lại là tùy chọn bật vì Z.AI yêu cầu phát lại toàn bộ
    `reasoning_content` lịch sử, làm tăng số token prompt. Bật tính năng này
    theo từng mô hình:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Khi được bật và thinking đang bật, OpenClaw gửi
    `thinking: { type: "enabled", clear_thinking: false }` và phát lại
    `reasoning_content` trước đó cho cùng transcript tương thích OpenAI.

    Người dùng nâng cao vẫn có thể ghi đè payload chính xác của nhà cung cấp bằng
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Hiểu hình ảnh">
    Plugin Z.AI được đóng gói kèm đăng ký khả năng hiểu hình ảnh.

    | Thuộc tính     | Giá trị     |
    | -------------- | ----------- |
    | Mô hình        | `glm-4.6v`  |

    Khả năng hiểu hình ảnh được tự động phân giải từ thông tin xác thực Z.AI đã cấu hình — không
    cần cấu hình bổ sung.

  </Accordion>

  <Accordion title="Chi tiết xác thực">
    - Z.AI sử dụng xác thực Bearer với API key của bạn.
    - Lựa chọn onboarding `zai-api-key` tự động phát hiện endpoint Z.AI phù hợp từ tiền tố key.
    - Sử dụng các lựa chọn khu vực rõ ràng (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) khi bạn muốn ép dùng một bề mặt API cụ thể.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Họ mô hình GLM" href="/vi/providers/glm" icon="microchip">
    Tổng quan về họ mô hình cho GLM.
  </Card>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi failover.
  </Card>
</CardGroup>
