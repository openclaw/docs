---
read_when:
    - Bạn muốn dùng một khóa API duy nhất cho nhiều LLM
    - Bạn cần hướng dẫn thiết lập Baidu Qianfan
summary: Sử dụng API hợp nhất của Qianfan để truy cập nhiều mô hình trong OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-12T08:17:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan là nền tảng MaaS của Baidu: một API hợp nhất, tương thích với OpenAI, định tuyến yêu cầu đến nhiều mô hình thông qua một điểm cuối và khóa API duy nhất. OpenClaw cung cấp nền tảng này dưới dạng Plugin bên ngoài chính thức `@openclaw/qianfan-provider`.

| Thuộc tính       | Giá trị                                  |
| ---------------- | ---------------------------------------- |
| Nhà cung cấp     | `qianfan`                                |
| Xác thực         | `QIANFAN_API_KEY`                        |
| API              | Tương thích với OpenAI (`openai-completions`) |
| URL cơ sở        | `https://qianfan.baidubce.com/v2`        |
| Mô hình mặc định | `qianfan/deepseek-v3.2`                  |

## Cài đặt Plugin

Cài đặt Plugin chính thức, sau đó khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Tạo tài khoản Baidu Cloud">
    Đăng ký hoặc đăng nhập tại [Bảng điều khiển Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) và đảm bảo quyền truy cập API Qianfan đã được bật.
  </Step>
  <Step title="Tạo khóa API">
    Tạo một ứng dụng mới hoặc chọn ứng dụng hiện có, sau đó tạo khóa API. Khóa Baidu Cloud sử dụng định dạng `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Chạy quy trình thiết lập ban đầu">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    Các lần chạy không tương tác đọc khóa từ `--qianfan-api-key <key>` hoặc
    `QIANFAN_API_KEY`. Quy trình thiết lập ban đầu ghi cấu hình nhà cung cấp, thêm bí danh
    `QIANFAN` cho mô hình mặc định và đặt `qianfan/deepseek-v3.2`
    làm mô hình mặc định khi chưa có mô hình nào được cấu hình.

  </Step>
  <Step title="Xác minh mô hình khả dụng">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Danh mục tích hợp sẵn

| Tham chiếu mô hình                   | Đầu vào      | Ngữ cảnh | Đầu ra tối đa | Suy luận | Ghi chú           |
| ------------------------------------ | ------------ | -------- | ------------- | ------- | ----------------- |
| `qianfan/deepseek-v3.2`              | văn bản      | 98,304   | 32,768        | Có      | Mô hình mặc định  |
| `qianfan/ernie-5.0-thinking-preview` | văn bản, ảnh | 119,000  | 64,000        | Có      | Đa phương thức    |

Danh mục này là tĩnh; không có tính năng khám phá mô hình trực tiếp.

<Tip>
Bạn chỉ cần ghi đè `models.providers.qianfan` khi cần URL cơ sở hoặc siêu dữ liệu mô hình tùy chỉnh.
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

<Note>
Tham chiếu mô hình sử dụng tiền tố `qianfan/` (ví dụ: `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Cơ chế truyền tải và khả năng tương thích">
    Qianfan hoạt động thông qua đường dẫn truyền tải tương thích với OpenAI, không sử dụng cách định dạng yêu cầu OpenAI nguyên bản. Các tính năng tiêu chuẩn của OpenAI SDK vẫn hoạt động, nhưng các tham số dành riêng cho nhà cung cấp có thể không được chuyển tiếp.
  </Accordion>

  <Accordion title="Khắc phục sự cố">
    - Đảm bảo khóa API của bạn bắt đầu bằng `bce-v3/ALTAK-` và quyền truy cập API Qianfan đã được bật trong bảng điều khiển Baidu Cloud.
    - Nếu các mô hình không được liệt kê, hãy xác nhận tài khoản của bạn đã kích hoạt dịch vụ Qianfan.
    - Chỉ thay đổi URL cơ sở nếu bạn sử dụng điểm cuối hoặc proxy tùy chỉnh.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình OpenClaw đầy đủ.
  </Card>
  <Card title="Thiết lập tác tử" href="/vi/concepts/agent" icon="robot">
    Cấu hình giá trị mặc định của tác tử và việc gán mô hình.
  </Card>
  <Card title="Tài liệu API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Tài liệu API Qianfan chính thức.
  </Card>
</CardGroup>
