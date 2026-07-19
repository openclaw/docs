---
read_when:
    - Bạn muốn sử dụng các mô hình Z.AI / GLM trong OpenClaw
    - Bạn cần thiết lập ZAI_API_KEY đơn giản
summary: Sử dụng Z.AI (các mô hình GLM) với OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-19T06:00:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0ca3e7ef743e908550f4d96ba6f78167e38cabd15b14044683b02493ebbf3025
    source_path: providers/zai.md
    workflow: 16
---

Z.AI là nền tảng API dành cho các mô hình **GLM**. Nền tảng này cung cấp các API REST cho GLM và
sử dụng khóa API để xác thực. Hãy tạo khóa API trong bảng điều khiển Z.AI.
OpenClaw sử dụng nhà cung cấp `zai` với khóa API Z.AI.

| Thuộc tính | Giá trị                                      |
| ---------- | -------------------------------------------- |
| Nhà cung cấp | `zai`                                        |
| Gói        | `@openclaw/zai-provider`                     |
| Xác thực   | `ZAI_API_KEY` (bí danh cũ: `Z_AI_API_KEY`) |
| API        | Z.AI Chat Completions (xác thực Bearer)      |

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
      <Step title="Xác minh mô hình xuất hiện trong danh sách">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Chỉ định rõ điểm cuối theo khu vực">
    **Phù hợp nhất cho:** người dùng muốn buộc sử dụng một Coding Plan hoặc bề mặt API chung cụ thể.

    <Steps>
      <Step title="Chọn đúng tùy chọn thiết lập ban đầu">
        ```bash
        # Coding Plan Toàn cầu (khuyến nghị cho người dùng Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (khu vực Trung Quốc)
        openclaw onboard --auth-choice zai-coding-cn

        # API chung
        openclaw onboard --auth-choice zai-global

        # API chung CN (khu vực Trung Quốc)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Xác minh mô hình xuất hiện trong danh sách">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### Điểm cuối

| Tùy chọn thiết lập ban đầu | URL cơ sở                                    | Mô hình mặc định |
| -------------------------- | -------------------------------------------- | ---------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

Z.AI cũng công bố URL cơ sở Coding Plan tương thích với Anthropic
`https://api.z.ai/api/anthropic`. Các tùy chọn Z.AI của OpenClaw sử dụng
các điểm cuối OpenAI Chat Completions được ghi lại ở trên; URL Anthropic dành cho các máy khách
giao tiếp trực tiếp bằng Anthropic Messages.

`zai-api-key` tự động phát hiện một trong bốn điểm cuối này bằng cách thăm dò khóa của bạn với API
chat-completions của từng điểm cuối, kiểm tra các điểm cuối chung (`zai-global`,
sau đó `zai-cn`) trước các điểm cuối Coding Plan (`zai-coding-global`, sau đó
`zai-coding-cn`), rồi dừng tại điểm cuối đầu tiên chấp nhận yêu cầu.
Hãy sử dụng `--auth-choice` rõ ràng để buộc dùng một điểm cuối Coding Plan nếu khóa của bạn
hoạt động trên cả hai loại.

## Giới hạn tốc độ và tình trạng quá tải

Z.AI mô tả Coding Plan và các công cụ tác nhân đa dụng là những dịch vụ
được quản lý theo năng lực. Theo tài liệu của chính Z.AI:

- [Các công cụ tác nhân đa dụng](https://docs.z.ai/devpack/tool/others),
  bao gồm OpenClaw, được phục vụ theo khả năng tốt nhất. Trong thời gian tải suy luận
  cao, thường vào khoảng 2-6 giờ chiều theo giờ Singapore, một số yêu cầu có thể gặp
  giới hạn tốc độ tạm thời.
- [Giới hạn tốc độ và số yêu cầu đồng thời của Coding Plan](https://docs.z.ai/devpack/usage-policy)
  phụ thuộc vào cấp gói và có thể được điều chỉnh linh hoạt dựa trên tài nguyên
  sẵn có. Ngoài giờ cao điểm có thể cho phép số yêu cầu đồng thời cao hơn.
- [Mã lỗi API `1302`](https://docs.z.ai/api-reference/api-code) có nghĩa là "Đã đạt
  giới hạn tốc độ yêu cầu". Mã lỗi API `1305` có nghĩa là "Dịch vụ có thể đang
  tạm thời quá tải, vui lòng thử lại sau".

Nếu bạn thấy phản hồi `429` hoặc `1305` tạm thời trong thời gian bận, hãy chờ rồi
thử lại yêu cầu. Nếu lỗi lặp lại ngoài giờ cao điểm hoặc chỉ
xảy ra với một điểm cuối, mô hình hay cấu trúc yêu cầu, trước tiên hãy kiểm tra điểm cuối
và mô hình đã cấu hình:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

Khóa Coding Plan phải sử dụng điểm cuối Coding Plan như
`https://api.z.ai/api/coding/paas/v4`; khóa API chung phải sử dụng điểm cuối API chung
như `https://api.z.ai/api/paas/v4`. Lỗi kéo dài với cùng một khóa và điểm cuối
có thể cho thấy nhà cung cấp từ chối hoặc gói có giới hạn,
không phải điều tiết tải cao điểm thông thường.

## Ví dụ cấu hình

<Tip>
`zai-api-key` cho phép OpenClaw phát hiện điểm cuối Z.AI khớp với khóa và
tự động áp dụng URL cơ sở chính xác. Hãy dùng các tùy chọn khu vực rõ ràng khi
bạn muốn buộc sử dụng một Coding Plan hoặc bề mặt API chung cụ thể.
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

Plugin nhà cung cấp `zai` cung cấp danh mục của mình trong bản kê khai Plugin, vì vậy thao tác
liệt kê chỉ đọc có thể hiển thị các hàng GLM đã biết mà không cần tải môi trường thời gian chạy của nhà cung cấp:

```bash
openclaw models list --all --provider zai
```

Danh mục dựa trên bản kê khai hiện bao gồm:

| Tham chiếu mô hình   | Ghi chú                         |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Mặc định của Coding Plan; ngữ cảnh 1M |
| `zai/glm-5.1`        | Mặc định của API chung          |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

Siêu dữ liệu chi phí token của danh mục tuân theo
[giá trả theo mức sử dụng](https://docs.z.ai/guides/overview/pricing) hiện tại của Z.AI. Các gói đăng ký Coding Plan
sử dụng hạn ngạch gói thay vì tính phí theo token; hãy xem
[trang đăng ký](https://z.ai/subscribe) trực tiếp để biết giá và khả năng cung cấp của gói.

<Tip>
Các mô hình GLM có sẵn dưới dạng `zai/<model>` (ví dụ: `zai/glm-5`).
</Tip>

<Note>
Thiết lập Coding Plan mặc định là `zai/glm-5.2`; thiết lập API chung giữ nguyên
`zai/glm-5.1`. Trên các điểm cuối Coding Plan, tính năng tự động phát hiện sẽ chuyển sang
`glm-5.1` rồi `glm-4.7` khi khóa/gói không cung cấp GLM-5.2. Các phiên bản
và khả năng cung cấp GLM có thể thay đổi; hãy chạy `openclaw models list --all --provider zai`
để xem danh mục mà phiên bản bạn đã cài đặt nhận biết.
</Note>

## Mức độ suy luận

<Tabs>
  <Tab title="GLM-5.2">
    Toàn bộ phạm vi: `off`, `low`, `high`, `max` (mặc định `off`). OpenClaw ánh xạ
    `low` và `high` sang mức nỗ lực suy luận `high` của Z.AI, còn `max` sang
    mức nỗ lực `max` của Z.AI, thông qua `reasoning_effort` trong tải trọng yêu cầu.
  </Tab>
  <Tab title="Các mô hình GLM khác">
    Chỉ có nút chuyển đổi nhị phân: `off` và `low` (được hiển thị là `on` trong trình chọn), mặc định
    `off`. Đặt mức suy luận thành `off` sẽ gửi `thinking: { type: "disabled" }`;
    mọi mức khác đều không thay đổi tải trọng yêu cầu (hành vi
    suy luận mặc định của chính Z.AI được áp dụng).
  </Tab>
</Tabs>

Đặt mức suy luận thành `off` giúp tránh các phản hồi sử dụng hết ngân sách đầu ra cho
`reasoning_content` trước khi có văn bản hiển thị.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Phân giải chuyển tiếp các mô hình GLM-5 chưa biết">
    Các mã `glm-5*` chưa biết vẫn được phân giải chuyển tiếp trên đường dẫn nhà cung cấp bằng cách
    tổng hợp siêu dữ liệu do nhà cung cấp sở hữu từ mẫu `glm-4.7` khi mã
    khớp với cấu trúc họ GLM-5 hiện tại.
  </Accordion>

  <Accordion title="Truyền phát lệnh gọi công cụ">
    `tool_stream` được bật theo mặc định cho tính năng truyền phát lệnh gọi công cụ của Z.AI. Để tắt tính năng này:

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

  <Accordion title="Duy trì quá trình suy luận">
    Việc duy trì quá trình suy luận là tùy chọn vì Z.AI yêu cầu phát lại toàn bộ
    `reasoning_content` trước đó, làm tăng số token lời nhắc. Bật tính năng này
    theo từng mô hình:

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

    Khi được bật và chế độ suy luận đang hoạt động, OpenClaw sẽ gửi
    `thinking: { type: "enabled", clear_thinking: false }` và phát lại
    `reasoning_content` trước đó cho cùng một bản ghi hội thoại tương thích với OpenAI. Khóa tham số dạng snake_case
    `preserve_thinking` hoạt động như một bí danh.

    Người dùng nâng cao vẫn có thể ghi đè tải trọng chính xác của nhà cung cấp bằng
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Hiểu hình ảnh">
    Plugin Z.AI đăng ký khả năng hiểu hình ảnh.

    | Thuộc tính    | Giá trị     |
    | ------------- | ----------- |
    | Mô hình       | `glm-4.6v`  |

    Khả năng hiểu hình ảnh được tự động phân giải từ thông tin xác thực Z.AI đã cấu hình —
    không cần cấu hình bổ sung.

  </Accordion>

  <Accordion title="Chi tiết xác thực">
    - Z.AI sử dụng xác thực Bearer với khóa API của bạn.
    - Tùy chọn thiết lập ban đầu `zai-api-key` tự động phát hiện điểm cuối Z.AI phù hợp bằng cách thăm dò các điểm cuối được hỗ trợ với khóa của bạn.
    - Hãy sử dụng các tùy chọn khu vực rõ ràng (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) khi bạn muốn buộc sử dụng một bề mặt API cụ thể.
    - Biến môi trường cũ `Z_AI_API_KEY` vẫn được chấp nhận; OpenClaw sao chép biến này sang `ZAI_API_KEY` khi khởi động nếu `ZAI_API_KEY` chưa được đặt.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình OpenClaw đầy đủ, bao gồm các thiết lập nhà cung cấp và mô hình.
  </Card>
</CardGroup>
