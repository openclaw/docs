---
read_when:
    - Bạn muốn dùng các mô hình Z.AI / GLM trong OpenClaw
    - Bạn cần một thiết lập ZAI_API_KEY đơn giản
summary: Sử dụng Z.AI (các mô hình GLM) với OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:07:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI là nền tảng API cho các mô hình **GLM**. Nền tảng này cung cấp REST API cho GLM và
sử dụng khóa API để xác thực. Tạo khóa API của bạn trong bảng điều khiển Z.AI.
OpenClaw sử dụng nhà cung cấp `zai` với khóa API Z.AI.

| Thuộc tính | Giá trị                                      |
| ---------- | ------------------------------------------- |
| Nhà cung cấp | `zai`                                      |
| Gói        | `@openclaw/zai-provider`                    |
| Xác thực   | `ZAI_API_KEY` (bí danh cũ: `Z_AI_API_KEY`)  |
| API        | Z.AI Chat Completions (xác thực Bearer)     |

## Mô hình GLM

GLM là một họ mô hình, không phải một nhà cung cấp riêng. Trong OpenClaw, các mô hình GLM sử dụng
ref như `zai/glm-5.2`: nhà cung cấp `zai`, id mô hình `glm-5.2`.

## Bắt đầu

Trước tiên, cài đặt Plugin nhà cung cấp:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **Phù hợp nhất cho:** hầu hết người dùng. OpenClaw thăm dò các endpoint Z.AI được hỗ trợ bằng khóa API của bạn và tự động áp dụng URL cơ sở chính xác.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **Phù hợp nhất cho:** người dùng muốn buộc dùng một Coding Plan hoặc bề mặt API chung cụ thể.

    <Steps>
      <Step title="Pick the right onboarding choice">
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
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ví dụ cấu hình

<Tip>
`zai-api-key` cho phép OpenClaw phát hiện endpoint Z.AI phù hợp từ khóa và
tự động áp dụng URL cơ sở chính xác. Dùng các lựa chọn khu vực tường minh khi
bạn muốn buộc dùng một Coding Plan hoặc bề mặt API chung cụ thể.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Danh mục tích hợp sẵn

Plugin nhà cung cấp `zai` đưa danh mục của nó vào manifest Plugin, nên thao tác
liệt kê chỉ đọc có thể hiển thị các hàng GLM đã biết mà không cần tải runtime của nhà cung cấp:

```bash
openclaw models list --all --provider zai
```

Danh mục dựa trên manifest hiện bao gồm:

| Ref mô hình         | Ghi chú                         |
| ------------------- | ------------------------------- |
| `zai/glm-5.2`       | Mặc định Coding Plan; ngữ cảnh 1M |
| `zai/glm-5.1`       | Mặc định API chung              |
| `zai/glm-5`         |                                 |
| `zai/glm-5-turbo`   |                                 |
| `zai/glm-5v-turbo`  |                                 |
| `zai/glm-4.7`       |                                 |
| `zai/glm-4.7-flash` |                                 |
| `zai/glm-4.7-flashx` |                                |
| `zai/glm-4.6`       |                                 |
| `zai/glm-4.6v`      |                                 |
| `zai/glm-4.5`       |                                 |
| `zai/glm-4.5-air`   |                                 |
| `zai/glm-4.5-flash` |                                 |
| `zai/glm-4.5v`      |                                 |

<Tip>
Các mô hình GLM có sẵn dưới dạng `zai/<model>` (ví dụ: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 hỗ trợ các mức thinking `off`, `low`, `high` và `max`. OpenClaw ánh xạ
`low` và `high` sang mức nỗ lực suy luận cao của Z.AI, và `max` sang mức nỗ lực tối đa.
</Tip>

<Note>
Thiết lập Coding Plan mặc định là `zai/glm-5.2`; thiết lập API chung giữ
`zai/glm-5.1`. Tự động phát hiện endpoint sẽ quay về `glm-5.1` hoặc `glm-4.7`
khi gói đã chọn không cung cấp GLM-5.2. Phiên bản và khả năng cung cấp của GLM
có thể thay đổi; chạy `openclaw models list --all --provider zai` để xem danh mục
mà phiên bản đã cài đặt của bạn biết.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    Các id `glm-5*` chưa biết vẫn được phân giải xuôi trên đường dẫn nhà cung cấp bằng cách
    tổng hợp siêu dữ liệu do nhà cung cấp sở hữu từ mẫu `glm-4.7` khi id
    khớp với hình dạng họ GLM-5 hiện tại.
  </Accordion>

  <Accordion title="Tool-call streaming">
    `tool_stream` được bật theo mặc định cho streaming lệnh gọi công cụ của Z.AI. Để tắt:

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

  <Accordion title="Thinking and preserved thinking">
    Thinking của Z.AI tuân theo các điều khiển `/think` của OpenClaw. Khi tắt thinking,
    OpenClaw gửi `thinking: { type: "disabled" }` để tránh các phản hồi
    dùng ngân sách đầu ra cho `reasoning_content` trước phần văn bản hiển thị.

    Preserved thinking là tùy chọn bật thủ công vì Z.AI yêu cầu phát lại toàn bộ
    `reasoning_content` lịch sử, làm tăng token lời nhắc. Bật theo từng mô hình:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Khi được bật và thinking đang bật, OpenClaw gửi
    `thinking: { type: "enabled", clear_thinking: false }` và phát lại
    `reasoning_content` trước đó cho cùng bản ghi tương thích OpenAI.

    Người dùng nâng cao vẫn có thể ghi đè chính xác payload của nhà cung cấp bằng
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Image understanding">
    Plugin Z.AI đăng ký khả năng hiểu hình ảnh.

    | Thuộc tính    | Giá trị     |
    | ------------- | ----------- |
    | Mô hình       | `glm-4.6v`  |

    Khả năng hiểu hình ảnh được tự động phân giải từ xác thực Z.AI đã cấu hình — không
    cần cấu hình bổ sung.

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI sử dụng xác thực Bearer với khóa API của bạn.
    - Lựa chọn onboarding `zai-api-key` tự động phát hiện endpoint Z.AI phù hợp bằng cách thăm dò các endpoint được hỗ trợ bằng khóa của bạn.
    - Dùng các lựa chọn khu vực tường minh (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) khi bạn muốn buộc dùng một bề mặt API cụ thể.
    - Biến môi trường cũ `Z_AI_API_KEY` vẫn được chấp nhận; OpenClaw sao chép nó sang `ZAI_API_KEY` khi khởi động nếu `ZAI_API_KEY` chưa được đặt.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, ref mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Schema cấu hình OpenClaw đầy đủ, bao gồm cài đặt nhà cung cấp và mô hình.
  </Card>
</CardGroup>
