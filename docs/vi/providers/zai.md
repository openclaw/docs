---
read_when:
    - Bạn muốn dùng các mô hình Z.AI / GLM trong OpenClaw
    - Bạn cần thiết lập ZAI_API_KEY đơn giản
summary: Sử dụng Z.AI (mô hình GLM) với OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-05-02T10:52:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI là nền tảng API cho các mô hình **GLM**. Nền tảng này cung cấp các REST API cho GLM và dùng khóa API
để xác thực. Tạo khóa API của bạn trong bảng điều khiển Z.AI. OpenClaw dùng nhà cung cấp `zai`
với khóa API Z.AI.

- Nhà cung cấp: `zai`
- Xác thực: `ZAI_API_KEY`
- API: Z.AI Chat Completions (xác thực Bearer)

## Bắt đầu

<Tabs>
  <Tab title="Tự động phát hiện endpoint">
    **Phù hợp nhất cho:** hầu hết người dùng. OpenClaw phát hiện endpoint Z.AI phù hợp từ khóa và tự động áp dụng base URL chính xác.

    <Steps>
      <Step title="Chạy thiết lập ban đầu">
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
      <Step title="Xác minh mô hình có trong danh sách">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint khu vực rõ ràng">
    **Phù hợp nhất cho:** người dùng muốn buộc dùng một Coding Plan cụ thể hoặc bề mặt API chung.

    <Steps>
      <Step title="Chọn đúng lựa chọn thiết lập ban đầu">
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
      <Step title="Xác minh mô hình có trong danh sách">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Danh mục tích hợp sẵn

OpenClaw cung cấp danh mục nhà cung cấp `zai` đi kèm trong manifest Plugin, vì vậy thao tác
liệt kê chỉ đọc có thể hiển thị các hàng GLM đã biết mà không cần tải runtime của nhà cung cấp:

```bash
openclaw models list --all --provider zai
```

Danh mục dựa trên manifest hiện bao gồm:

| Tham chiếu mô hình   | Ghi chú          |
| -------------------- | ---------------- |
| `zai/glm-5.1`        | Mô hình mặc định |
| `zai/glm-5`          |                  |
| `zai/glm-5-turbo`    |                  |
| `zai/glm-5v-turbo`   |                  |
| `zai/glm-4.7`        |                  |
| `zai/glm-4.7-flash`  |                  |
| `zai/glm-4.7-flashx` |                  |
| `zai/glm-4.6`        |                  |
| `zai/glm-4.6v`       |                  |
| `zai/glm-4.5`        |                  |
| `zai/glm-4.5-air`    |                  |
| `zai/glm-4.5-flash`  |                  |
| `zai/glm-4.5v`       |                  |

<Tip>
Các mô hình GLM có sẵn dưới dạng `zai/<model>` (ví dụ: `zai/glm-5`). Tham chiếu mô hình đi kèm mặc định là `zai/glm-5.1`.
</Tip>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Phân giải chuyển tiếp các mô hình GLM-5 chưa biết">
    Các id `glm-5*` chưa biết vẫn được phân giải chuyển tiếp trên đường dẫn nhà cung cấp đi kèm bằng cách
    tổng hợp metadata do nhà cung cấp sở hữu từ mẫu `glm-4.7` khi id
    khớp với dạng họ GLM-5 hiện tại.
  </Accordion>

  <Accordion title="Truyền phát lệnh gọi công cụ">
    `tool_stream` được bật theo mặc định cho truyền phát lệnh gọi công cụ của Z.AI. Để tắt tính năng này:

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
    OpenClaw gửi `thinking: { type: "disabled" }` để tránh phản hồi
    dùng ngân sách đầu ra cho `reasoning_content` trước phần văn bản hiển thị.

    Thinking được giữ lại là tùy chọn bật vì Z.AI yêu cầu phát lại toàn bộ
    `reasoning_content` lịch sử, làm tăng số token của prompt. Bật theo
    từng mô hình:

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
    `reasoning_content` trước đó cho cùng transcript tương thích với OpenAI.

    Người dùng nâng cao vẫn có thể ghi đè payload chính xác của nhà cung cấp bằng
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Hiểu hình ảnh">
    Plugin Z.AI đi kèm đăng ký khả năng hiểu hình ảnh.

    | Thuộc tính    | Giá trị     |
    | ------------- | ----------- |
    | Mô hình       | `glm-4.6v`  |

    Khả năng hiểu hình ảnh được tự động phân giải từ xác thực Z.AI đã cấu hình, không
    cần cấu hình bổ sung.

  </Accordion>

  <Accordion title="Chi tiết xác thực">
    - Z.AI dùng xác thực Bearer với khóa API của bạn.
    - Lựa chọn thiết lập ban đầu `zai-api-key` tự động phát hiện endpoint Z.AI phù hợp từ tiền tố khóa.
    - Dùng các lựa chọn khu vực rõ ràng (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) khi bạn muốn buộc dùng một bề mặt API cụ thể.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Họ mô hình GLM" href="/vi/providers/glm" icon="microchip">
    Tổng quan về họ mô hình GLM.
  </Card>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
</CardGroup>
