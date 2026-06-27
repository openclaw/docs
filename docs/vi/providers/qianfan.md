---
read_when:
    - Bạn muốn một khóa API duy nhất cho nhiều LLM
    - Bạn cần hướng dẫn thiết lập Baidu Qianfan
summary: Sử dụng API hợp nhất của Qianfan để truy cập nhiều mô hình trong OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T18:05:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan là nền tảng MaaS của Baidu, cung cấp một **API hợp nhất** định tuyến yêu cầu đến nhiều mô hình phía sau một
endpoint và khóa API duy nhất. Nền tảng này tương thích với OpenAI, nên hầu hết các SDK OpenAI đều hoạt động bằng cách đổi URL cơ sở.

| Thuộc tính | Giá trị                           |
| ---------- | --------------------------------- |
| Nhà cung cấp | `qianfan`                       |
| Xác thực   | `QIANFAN_API_KEY`                 |
| API        | Tương thích với OpenAI            |
| URL cơ sở  | `https://qianfan.baidubce.com/v2` |

## Cài đặt Plugin

Cài đặt Plugin chính thức, rồi khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Create a Baidu Cloud account">
    Đăng ký hoặc đăng nhập tại [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) và đảm bảo bạn đã bật quyền truy cập API Qianfan.
  </Step>
  <Step title="Generate an API key">
    Tạo một ứng dụng mới hoặc chọn một ứng dụng hiện có, rồi tạo khóa API. Định dạng khóa là `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Danh mục tích hợp sẵn

| Tham chiếu mô hình                   | Đầu vào     | Ngữ cảnh | Đầu ra tối đa | Suy luận | Ghi chú       |
| ------------------------------------ | ----------- | -------- | ------------- | -------- | ------------- |
| `qianfan/deepseek-v3.2`              | văn bản     | 98,304   | 32,768        | Có       | Mô hình mặc định |
| `qianfan/ernie-5.0-thinking-preview` | văn bản, hình ảnh | 119,000 | 64,000     | Có       | Đa phương thức |

<Tip>
Tham chiếu mô hình mặc định là `qianfan/deepseek-v3.2`. Bạn chỉ cần ghi đè `models.providers.qianfan` khi cần URL cơ sở tùy chỉnh hoặc siêu dữ liệu mô hình.
</Tip>

## Ví dụ cấu hình

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Qianfan chạy qua đường dẫn truyền tải tương thích với OpenAI, không phải cơ chế định hình yêu cầu OpenAI gốc. Điều này có nghĩa là các tính năng SDK OpenAI tiêu chuẩn hoạt động, nhưng các tham số riêng của nhà cung cấp có thể không được chuyển tiếp.
  </Accordion>

  <Accordion title="Catalog and overrides">
    Danh mục tĩnh hiện bao gồm `deepseek-v3.2` và `ernie-5.0-thinking-preview`. Chỉ thêm hoặc ghi đè `models.providers.qianfan` khi bạn cần URL cơ sở tùy chỉnh hoặc siêu dữ liệu mô hình.

    <Note>
    Tham chiếu mô hình dùng tiền tố `qianfan/` (ví dụ `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Đảm bảo khóa API của bạn bắt đầu bằng `bce-v3/ALTAK-` và đã bật quyền truy cập API Qianfan trong bảng điều khiển Baidu Cloud.
    - Nếu các mô hình không được liệt kê, hãy xác nhận tài khoản của bạn đã kích hoạt dịch vụ Qianfan.
    - URL cơ sở mặc định là `https://qianfan.baidubce.com/v2`. Chỉ thay đổi URL này nếu bạn dùng endpoint hoặc proxy tùy chỉnh.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Tài liệu tham chiếu cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Agent setup" href="/vi/concepts/agent" icon="robot">
    Cấu hình mặc định cho agent và gán mô hình.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Tài liệu API Qianfan chính thức.
  </Card>
</CardGroup>
