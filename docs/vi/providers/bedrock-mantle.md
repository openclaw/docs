---
read_when:
    - Bạn muốn sử dụng các mô hình OSS do Bedrock Mantle lưu trữ với OpenClaw
    - Bạn cần điểm cuối tương thích với OpenAI của Mantle cho GPT-OSS, Qwen, Kimi hoặc GLM
summary: Sử dụng các mô hình Amazon Bedrock Mantle (tương thích với OpenAI) với OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-05-10T19:47:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 721eef5b7ff606b8c5e02234dae1b8d846b43ff9f3d7bf871f701bb3136fec0e
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw bao gồm nhà cung cấp **Amazon Bedrock Mantle** được tích hợp sẵn, kết nối tới
điểm cuối tương thích OpenAI của Mantle. Mantle lưu trữ các mô hình mã nguồn mở và
bên thứ ba (GPT-OSS, Qwen, Kimi, GLM và tương tự) thông qua bề mặt
`/v1/chat/completions` tiêu chuẩn được hỗ trợ bởi hạ tầng Bedrock.

| Thuộc tính       | Giá trị                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| ID nhà cung cấp    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (tương thích OpenAI) hoặc `anthropic-messages` (tuyến Anthropic Messages) |
| Xác thực           | `AWS_BEARER_TOKEN_BEDROCK` rõ ràng hoặc tạo bearer-token từ chuỗi thông tin xác thực IAM         |
| Vùng mặc định | `us-east-1` (ghi đè bằng `AWS_REGION` hoặc `AWS_DEFAULT_REGION`)                            |

## Bắt đầu

Chọn phương thức xác thực bạn muốn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Bearer token rõ ràng">
    **Phù hợp nhất cho:** các môi trường nơi bạn đã có bearer token Mantle.

    <Steps>
      <Step title="Đặt bearer token trên máy chủ gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Tùy chọn đặt một vùng (mặc định là `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Xác minh các mô hình đã được phát hiện">
        ```bash
        openclaw models list
        ```

        Các mô hình được phát hiện xuất hiện dưới nhà cung cấp `amazon-bedrock-mantle`. Không
        cần cấu hình bổ sung trừ khi bạn muốn ghi đè các mặc định.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Thông tin xác thực IAM">
    **Phù hợp nhất cho:** sử dụng thông tin xác thực tương thích AWS SDK (cấu hình chia sẻ, SSO, web identity, vai trò instance hoặc task).

    <Steps>
      <Step title="Cấu hình thông tin xác thực AWS trên máy chủ gateway">
        Mọi nguồn xác thực tương thích AWS SDK đều hoạt động:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Xác minh các mô hình đã được phát hiện">
        ```bash
        openclaw models list
        ```

        OpenClaw tự động tạo bearer token Mantle từ chuỗi thông tin xác thực.
      </Step>
    </Steps>

    <Tip>
    Khi `AWS_BEARER_TOKEN_BEDROCK` chưa được đặt, OpenClaw tạo bearer token cho bạn từ chuỗi thông tin xác thực mặc định của AWS, bao gồm thông tin xác thực/cấu hình hồ sơ chia sẻ, SSO, web identity và vai trò instance hoặc task.
    </Tip>

  </Tab>
</Tabs>

## Tự động phát hiện mô hình

Khi `AWS_BEARER_TOKEN_BEDROCK` được đặt, OpenClaw dùng trực tiếp token đó. Nếu không,
OpenClaw cố gắng tạo bearer token Mantle từ chuỗi thông tin xác thực
mặc định của AWS. Sau đó, OpenClaw phát hiện các mô hình Mantle khả dụng bằng cách truy vấn
điểm cuối `/v1/models` của vùng.

| Hành vi          | Chi tiết                    |
| ----------------- | ------------------------- |
| Bộ nhớ đệm phát hiện   | Kết quả được lưu trong bộ nhớ đệm trong 1 giờ |
| Làm mới token IAM | Hằng giờ                    |

Để giữ Plugin Mantle được bật nhưng chặn việc tự động phát hiện và tạo
bearer-token IAM, hãy tắt công tắc phát hiện do Plugin sở hữu:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Bearer token là cùng `AWS_BEARER_TOKEN_BEDROCK` được nhà cung cấp [Amazon Bedrock](/vi/providers/bedrock) tiêu chuẩn sử dụng.
</Note>

### Các vùng được hỗ trợ

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Cấu hình thủ công

Nếu bạn muốn dùng cấu hình rõ ràng thay vì tự động phát hiện:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Hỗ trợ reasoning">
    Hỗ trợ reasoning được suy ra từ ID mô hình chứa các mẫu như
    `thinking`, `reasoner` hoặc `gpt-oss-120b`. OpenClaw tự động đặt `reasoning: true`
    cho các mô hình khớp trong quá trình phát hiện.
  </Accordion>

  <Accordion title="Điểm cuối không khả dụng">
    Nếu điểm cuối Mantle không khả dụng hoặc không trả về mô hình nào, nhà cung cấp sẽ
    được bỏ qua âm thầm. OpenClaw không báo lỗi; các nhà cung cấp đã cấu hình khác
    tiếp tục hoạt động bình thường.
  </Accordion>

  <Accordion title="Claude Opus 4.7 qua tuyến Anthropic Messages">
    Mantle cũng cung cấp một tuyến Anthropic Messages để truyền các mô hình Claude qua cùng đường dẫn phát trực tuyến được xác thực bằng bearer. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) có thể được gọi qua tuyến này với streaming do nhà cung cấp sở hữu, vì vậy bearer token AWS không được xử lý như khóa API Anthropic.

    Khi bạn ghim một mô hình Anthropic Messages trên nhà cung cấp Mantle, OpenClaw sử dụng bề mặt API `anthropic-messages` thay vì `openai-completions` cho mô hình đó. Xác thực vẫn đến từ `AWS_BEARER_TOKEN_BEDROCK` (hoặc bearer token IAM được tạo).

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Quan hệ với nhà cung cấp Amazon Bedrock">
    Bedrock Mantle là một nhà cung cấp riêng biệt với nhà cung cấp
    [Amazon Bedrock](/vi/providers/bedrock) tiêu chuẩn. Mantle sử dụng một
    bề mặt `/v1` tương thích OpenAI, trong khi nhà cung cấp Bedrock tiêu chuẩn sử dụng
    API Bedrock gốc.

    Cả hai nhà cung cấp dùng chung cùng thông tin xác thực `AWS_BEARER_TOKEN_BEDROCK` khi
    có mặt.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/vi/providers/bedrock" icon="cloud">
    Nhà cung cấp Bedrock gốc cho Anthropic Claude, Titan và các mô hình khác.
  </Card>
  <Card title="Chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="OAuth và xác thực" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Các vấn đề thường gặp và cách giải quyết.
  </Card>
</CardGroup>
