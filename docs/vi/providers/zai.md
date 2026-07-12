---
read_when:
    - Bạn muốn sử dụng các mô hình Z.AI / GLM trong OpenClaw
    - Bạn cần thiết lập ZAI_API_KEY đơn giản
summary: Sử dụng Z.AI (các mô hình GLM) với OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T08:20:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI là nền tảng API cho các mô hình **GLM**. Nền tảng này cung cấp các API REST cho GLM và
sử dụng khóa API để xác thực. Hãy tạo khóa API của bạn trong bảng điều khiển Z.AI.
OpenClaw sử dụng nhà cung cấp `zai` cùng với khóa API Z.AI.

| Thuộc tính   | Giá trị                                      |
| ------------ | -------------------------------------------- |
| Nhà cung cấp | `zai`                                        |
| Gói          | `@openclaw/zai-provider`                     |
| Xác thực     | `ZAI_API_KEY` (bí danh cũ: `Z_AI_API_KEY`)   |
| API          | Z.AI Chat Completions (xác thực Bearer)      |

## Các mô hình GLM

GLM là một họ mô hình, không phải một nhà cung cấp riêng biệt. Trong OpenClaw, các mô hình GLM sử dụng
tham chiếu như `zai/glm-5.2`: nhà cung cấp `zai`, mã mô hình `glm-5.2`.

## Bắt đầu

Trước tiên, hãy cài đặt Plugin nhà cung cấp:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Tự động phát hiện điểm cuối">
    **Phù hợp nhất cho:** hầu hết người dùng. OpenClaw thăm dò các điểm cuối Z.AI được hỗ trợ bằng khóa API của bạn và tự động áp dụng URL cơ sở chính xác.

    <Steps>
      <Step title="Chạy quy trình thiết lập ban đầu">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Xác minh mô hình có trong danh sách">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Điểm cuối khu vực cụ thể">
    **Phù hợp nhất cho:** người dùng muốn buộc sử dụng một Coding Plan hoặc bề mặt API chung cụ thể.

    <Steps>
      <Step title="Chọn tùy chọn thiết lập ban đầu phù hợp">
        ```bash
        # Coding Plan toàn cầu (khuyến nghị cho người dùng Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (khu vực Trung Quốc)
        openclaw onboard --auth-choice zai-coding-cn

        # API chung
        openclaw onboard --auth-choice zai-global

        # API chung CN (khu vực Trung Quốc)
        openclaw onboard --auth-choice zai-cn
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

### Các điểm cuối

| Tùy chọn thiết lập ban đầu | URL cơ sở                                     | Mô hình mặc định |
| -------------------------- | --------------------------------------------- | ---------------- |
| `zai-global`               | `https://api.z.ai/api/paas/v4`                | `glm-5.1`        |
| `zai-cn`                   | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`        |
| `zai-coding-global`        | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`        |
| `zai-coding-cn`            | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`        |

`zai-api-key` tự động phát hiện một trong bốn điểm cuối này bằng cách thăm dò khóa của bạn trên API
hoàn thành hội thoại của từng điểm cuối, kiểm tra các điểm cuối chung (`zai-global`,
sau đó là `zai-cn`) trước các điểm cuối Coding Plan (`zai-coding-global`, sau đó là
`zai-coding-cn`) và dừng tại điểm cuối đầu tiên chấp nhận yêu cầu.
Hãy sử dụng một `--auth-choice` cụ thể để buộc dùng điểm cuối Coding Plan nếu khóa của bạn
hoạt động trên cả hai loại.

## Ví dụ cấu hình

<Tip>
`zai-api-key` cho phép OpenClaw phát hiện điểm cuối Z.AI phù hợp từ khóa và
tự động áp dụng URL cơ sở chính xác. Hãy sử dụng các lựa chọn khu vực cụ thể khi
bạn muốn buộc dùng một Coding Plan hoặc bề mặt API chung cụ thể.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 sử dụng điểm cuối Coding Plan.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Danh mục tích hợp sẵn

Plugin nhà cung cấp `zai` cung cấp danh mục trong bản kê khai Plugin, nhờ đó thao tác liệt kê
chỉ đọc có thể hiển thị các hàng GLM đã biết mà không cần tải môi trường thực thi của nhà cung cấp:

```bash
openclaw models list --all --provider zai
```

Danh mục dựa trên bản kê khai hiện bao gồm:

| Tham chiếu mô hình   | Ghi chú                            |
| -------------------- | ---------------------------------- |
| `zai/glm-5.2`        | Mặc định của Coding Plan; ngữ cảnh 1M |
| `zai/glm-5.1`        | Mặc định của API chung             |
| `zai/glm-5`          |                                    |
| `zai/glm-5-turbo`    |                                    |
| `zai/glm-5v-turbo`   |                                    |
| `zai/glm-4.7`        |                                    |
| `zai/glm-4.7-flash`  |                                    |
| `zai/glm-4.7-flashx` |                                    |
| `zai/glm-4.6`        |                                    |
| `zai/glm-4.6v`       |                                    |
| `zai/glm-4.5`        |                                    |
| `zai/glm-4.5-air`    |                                    |
| `zai/glm-4.5-flash`  |                                    |
| `zai/glm-4.5v`       |                                    |

<Tip>
Các mô hình GLM có sẵn dưới dạng `zai/<model>` (ví dụ: `zai/glm-5`).
</Tip>

<Note>
Quy trình thiết lập Coding Plan mặc định dùng `zai/glm-5.2`; quy trình thiết lập API chung giữ
`zai/glm-5.1`. Trên các điểm cuối Coding Plan, tính năng tự động phát hiện sẽ chuyển dự phòng sang
`glm-5.1`, rồi đến `glm-4.7` khi khóa/gói không cung cấp GLM-5.2. Các phiên bản GLM
và khả năng cung cấp có thể thay đổi; hãy chạy `openclaw models list --all --provider zai`
để xem danh mục mà phiên bản bạn đã cài đặt nhận biết.
</Note>

## Các mức suy luận

<Tabs>
  <Tab title="GLM-5.2">
    Toàn bộ phạm vi: `off`, `low`, `high`, `max` (mặc định là `off`). OpenClaw ánh xạ
    `low` và `high` sang mức nỗ lực suy luận `high` của Z.AI, còn `max` sang mức nỗ lực
    `max` của Z.AI, thông qua `reasoning_effort` trong nội dung yêu cầu.
  </Tab>
  <Tab title="Các mô hình GLM khác">
    Chỉ có công tắc nhị phân: `off` và `low` (được hiển thị là `on` trong trình chọn), mặc định
    là `off`. Đặt chế độ suy luận thành `off` sẽ gửi `thinking: { type: "disabled" }`;
    mọi mức khác sẽ giữ nguyên nội dung yêu cầu (hành vi suy luận mặc định của chính Z.AI
    sẽ được áp dụng).
  </Tab>
</Tabs>

Đặt chế độ suy luận thành `off` giúp tránh các phản hồi tiêu tốn ngân sách đầu ra cho
`reasoning_content` trước khi tạo ra văn bản hiển thị.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Phân giải chuyển tiếp các mô hình GLM-5 chưa xác định">
    Các mã `glm-5*` chưa xác định vẫn được phân giải chuyển tiếp trên đường dẫn nhà cung cấp bằng cách
    tổng hợp siêu dữ liệu do nhà cung cấp sở hữu từ mẫu `glm-4.7` khi mã đó
    khớp với cấu trúc hiện tại của họ GLM-5.
  </Accordion>

  <Accordion title="Truyền phát lệnh gọi công cụ">
    `tool_stream` được bật mặc định cho tính năng truyền phát lệnh gọi công cụ của Z.AI. Để tắt tính năng này:

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

  <Accordion title="Duy trì nội dung suy luận">
    Việc duy trì nội dung suy luận là tùy chọn vì Z.AI yêu cầu phát lại toàn bộ
    `reasoning_content` trong lịch sử, làm tăng số token của lời nhắc. Bật tính năng này
    cho từng mô hình:

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

    Khi tính năng này được bật và chế độ suy luận đang hoạt động, OpenClaw sẽ gửi
    `thinking: { type: "enabled", clear_thinking: false }` và phát lại
    `reasoning_content` trước đó cho cùng một bản ghi hội thoại tương thích với OpenAI. Khóa tham số dạng snake_case
    `preserve_thinking` hoạt động như một bí danh.

    Người dùng nâng cao vẫn có thể ghi đè chính xác nội dung gửi đến nhà cung cấp bằng
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Hiểu hình ảnh">
    Plugin Z.AI đăng ký khả năng hiểu hình ảnh.

    | Thuộc tính | Giá trị    |
    | ---------- | ---------- |
    | Mô hình    | `glm-4.6v` |

    Khả năng hiểu hình ảnh được tự động phân giải từ thông tin xác thực Z.AI đã cấu hình — không
    cần cấu hình bổ sung.

  </Accordion>

  <Accordion title="Chi tiết xác thực">
    - Z.AI sử dụng xác thực Bearer với khóa API của bạn.
    - Tùy chọn thiết lập ban đầu `zai-api-key` tự động phát hiện điểm cuối Z.AI phù hợp bằng cách thăm dò các điểm cuối được hỗ trợ với khóa của bạn.
    - Hãy sử dụng các lựa chọn khu vực cụ thể (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) khi bạn muốn buộc dùng một bề mặt API cụ thể.
    - Biến môi trường cũ `Z_AI_API_KEY` vẫn được chấp nhận; OpenClaw sao chép biến này sang `ZAI_API_KEY` khi khởi động nếu `ZAI_API_KEY` chưa được đặt.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình OpenClaw đầy đủ, bao gồm các thiết lập nhà cung cấp và mô hình.
  </Card>
</CardGroup>
