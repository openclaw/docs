---
read_when:
    - Bạn muốn sử dụng các mô hình OSS do Bedrock Mantle lưu trữ với OpenClaw
    - Bạn cần endpoint tương thích OpenAI của Mantle cho GPT-OSS, Qwen, Kimi hoặc GLM
summary: Sử dụng các mô hình Amazon Bedrock Mantle (tương thích với OpenAI) với OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-29T23:05:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5e9fb65cd5f5151470f0d8eeb9edceb9b035863dcd863d2bcabe233c1cfce41
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw bao gồm nhà cung cấp **Amazon Bedrock Mantle** được tích hợp sẵn, kết nối đến
điểm cuối Mantle tương thích với OpenAI. Mantle lưu trữ các mô hình mã nguồn mở và
mô hình bên thứ ba (GPT-OSS, Qwen, Kimi, GLM, và tương tự) thông qua bề mặt
`/v1/chat/completions` tiêu chuẩn được hỗ trợ bởi hạ tầng Bedrock.

| Thuộc tính       | Giá trị                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| ID nhà cung cấp    | `amazon-bedrock-mantle`                                                                     |
| API            | `openai-completions` (tương thích với OpenAI) hoặc `anthropic-messages` (tuyến Anthropic Messages) |
| Xác thực           | `AWS_BEARER_TOKEN_BEDROCK` rõ ràng hoặc tạo bearer token bằng chuỗi thông tin xác thực IAM         |
| Vùng mặc định | `us-east-1` (ghi đè bằng `AWS_REGION` hoặc `AWS_DEFAULT_REGION`)                            |

## Bắt đầu

Chọn phương thức xác thực bạn muốn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Explicit bearer token">
    **Phù hợp nhất cho:** môi trường mà bạn đã có bearer token Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Tùy chọn đặt một vùng (mặc định là `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Các mô hình được phát hiện sẽ xuất hiện dưới nhà cung cấp `amazon-bedrock-mantle`. Không
        cần cấu hình bổ sung trừ khi bạn muốn ghi đè các giá trị mặc định.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Phù hợp nhất cho:** sử dụng thông tin xác thực tương thích với AWS SDK (cấu hình dùng chung, SSO, web identity, vai trò instance hoặc task).

    <Steps>
      <Step title="Configure AWS credentials on the gateway host">
        Mọi nguồn xác thực tương thích với AWS SDK đều hoạt động:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        OpenClaw tự động tạo bearer token Mantle từ chuỗi thông tin xác thực.
      </Step>
    </Steps>

    <Tip>
    Khi `AWS_BEARER_TOKEN_BEDROCK` chưa được đặt, OpenClaw sẽ cấp bearer token cho bạn từ chuỗi thông tin xác thực mặc định của AWS, bao gồm thông tin xác thực dùng chung/cấu hình hồ sơ, SSO, web identity, và vai trò instance hoặc task.
    </Tip>

  </Tab>
</Tabs>

## Tự động phát hiện mô hình

Khi `AWS_BEARER_TOKEN_BEDROCK` được đặt, OpenClaw sử dụng trực tiếp giá trị đó. Nếu không,
OpenClaw cố gắng tạo bearer token Mantle từ chuỗi thông tin xác thực mặc định
của AWS. Sau đó, OpenClaw phát hiện các mô hình Mantle khả dụng bằng cách truy vấn
điểm cuối `/v1/models` của vùng.

| Hành vi          | Chi tiết                    |
| ----------------- | ------------------------- |
| Bộ nhớ đệm phát hiện   | Kết quả được lưu đệm trong 1 giờ |
| Làm mới token IAM | Hàng giờ                    |

<Note>
Bearer token là cùng `AWS_BEARER_TOKEN_BEDROCK` được nhà cung cấp [Amazon Bedrock](/vi/providers/bedrock) tiêu chuẩn sử dụng.
</Note>

### Vùng được hỗ trợ

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
  <Accordion title="Reasoning support">
    Khả năng hỗ trợ suy luận được suy ra từ các ID mô hình chứa những mẫu như
    `thinking`, `reasoner`, hoặc `gpt-oss-120b`. OpenClaw tự động đặt `reasoning: true`
    cho các mô hình khớp trong quá trình phát hiện.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Nếu điểm cuối Mantle không khả dụng hoặc không trả về mô hình nào, nhà cung cấp sẽ
    được bỏ qua một cách im lặng. OpenClaw không báo lỗi; các nhà cung cấp đã cấu hình khác
    vẫn tiếp tục hoạt động bình thường.
  </Accordion>

  <Accordion title="Claude Opus 4.7 via the Anthropic Messages route">
    Mantle cũng cung cấp một tuyến Anthropic Messages để truyền các mô hình Claude qua cùng đường truyền phát trực tuyến được xác thực bằng bearer token. Claude Opus 4.7 (`amazon-bedrock-mantle/claude-opus-4.7`) có thể được gọi qua tuyến này với cơ chế phát trực tuyến do nhà cung cấp sở hữu, nên bearer token AWS không được xem như khóa API Anthropic.

    Khi bạn ghim một mô hình Anthropic Messages trên nhà cung cấp Mantle, OpenClaw sử dụng bề mặt API `anthropic-messages` thay vì `openai-completions` cho mô hình đó. Xác thực vẫn đến từ `AWS_BEARER_TOKEN_BEDROCK` (hoặc bearer token IAM được cấp).

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

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle là một nhà cung cấp riêng biệt với nhà cung cấp
    [Amazon Bedrock](/vi/providers/bedrock) tiêu chuẩn. Mantle sử dụng bề mặt
    `/v1` tương thích với OpenAI, trong khi nhà cung cấp Bedrock tiêu chuẩn sử dụng
    API Bedrock gốc.

    Cả hai nhà cung cấp dùng chung cùng thông tin xác thực `AWS_BEARER_TOKEN_BEDROCK` khi
    có mặt.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/vi/providers/bedrock" icon="cloud">
    Nhà cung cấp Bedrock gốc cho Anthropic Claude, Titan, và các mô hình khác.
  </Card>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="OAuth and auth" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và quy tắc tái sử dụng thông tin xác thực.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và cách giải quyết.
  </Card>
</CardGroup>
