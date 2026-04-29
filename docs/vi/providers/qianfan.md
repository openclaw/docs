---
read_when:
    - Bạn muốn một khóa API duy nhất cho nhiều LLM
    - Bạn cần hướng dẫn thiết lập Baidu Qianfan
summary: Sử dụng API hợp nhất của Qianfan để truy cập nhiều mô hình trong OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-29T23:08:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan là nền tảng MaaS của Baidu, cung cấp một **API hợp nhất** định tuyến yêu cầu đến nhiều mô hình phía sau một endpoint và khóa API duy nhất. Nền tảng này tương thích với OpenAI, nên hầu hết OpenAI SDK hoạt động bằng cách chuyển đổi base URL.

| Thuộc tính | Giá trị                           |
| ---------- | --------------------------------- |
| Nhà cung cấp | `qianfan`                       |
| Xác thực   | `QIANFAN_API_KEY`                 |
| API        | Tương thích với OpenAI            |
| Base URL   | `https://qianfan.baidubce.com/v2` |

## Bắt đầu

<Steps>
  <Step title="Tạo tài khoản Baidu Cloud">
    Đăng ký hoặc đăng nhập tại [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) và đảm bảo bạn đã bật quyền truy cập Qianfan API.
  </Step>
  <Step title="Tạo khóa API">
    Tạo một ứng dụng mới hoặc chọn một ứng dụng hiện có, sau đó tạo khóa API. Định dạng khóa là `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Chạy quy trình onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Xác minh mô hình có sẵn">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Danh mục tích hợp sẵn

| Tham chiếu mô hình                  | Đầu vào      | Ngữ cảnh | Đầu ra tối đa | Suy luận | Ghi chú       |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | văn bản     | 98,304  | 32,768     | Có        | Mô hình mặc định |
| `qianfan/ernie-5.0-thinking-preview` | văn bản, hình ảnh | 119,000 | 64,000     | Có        | Đa phương thức |

<Tip>
Tham chiếu mô hình tích hợp mặc định là `qianfan/deepseek-v3.2`. Bạn chỉ cần ghi đè `models.providers.qianfan` khi cần base URL tùy chỉnh hoặc metadata mô hình.
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
  <Accordion title="Truyền tải và tương thích">
    Qianfan chạy qua đường truyền tải tương thích với OpenAI, không phải định dạng yêu cầu OpenAI gốc. Điều này nghĩa là các tính năng OpenAI SDK tiêu chuẩn hoạt động, nhưng tham số dành riêng cho nhà cung cấp có thể không được chuyển tiếp.
  </Accordion>

  <Accordion title="Danh mục và ghi đè">
    Danh mục tích hợp hiện bao gồm `deepseek-v3.2` và `ernie-5.0-thinking-preview`. Chỉ thêm hoặc ghi đè `models.providers.qianfan` khi bạn cần base URL tùy chỉnh hoặc metadata mô hình.

    <Note>
    Tham chiếu mô hình sử dụng tiền tố `qianfan/` (ví dụ `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Đảm bảo khóa API của bạn bắt đầu bằng `bce-v3/ALTAK-` và đã bật quyền truy cập Qianfan API trong bảng điều khiển Baidu Cloud.
    - Nếu mô hình không được liệt kê, hãy xác nhận tài khoản của bạn đã kích hoạt dịch vụ Qianfan.
    - Base URL mặc định là `https://qianfan.baidubce.com/v2`. Chỉ thay đổi nếu bạn dùng endpoint hoặc proxy tùy chỉnh.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi failover.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Thiết lập agent" href="/vi/concepts/agent" icon="robot">
    Cấu hình mặc định của agent và việc gán mô hình.
  </Card>
  <Card title="Tài liệu Qianfan API" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Tài liệu Qianfan API chính thức.
  </Card>
</CardGroup>
