---
read_when:
    - Bạn muốn sử dụng các mô hình OSS được lưu trữ trên Bedrock Mantle với OpenClaw
    - Bạn cần endpoint tương thích với OpenAI của Mantle cho GPT-OSS, Qwen, Kimi hoặc GLM
    - Bạn muốn sử dụng Claude Sonnet 5 hoặc Mythos 5 thông qua Amazon Bedrock Mantle
summary: Sử dụng các mô hình tương thích với OpenAI và Claude Messages của Amazon Bedrock Mantle với OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T08:14:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

OpenClaw bao gồm nhà cung cấp **Amazon Bedrock Mantle** được tích hợp sẵn, kết nối với
điểm cuối Mantle tương thích với OpenAI. Mantle lưu trữ các mô hình nguồn mở và
mô hình của bên thứ ba (GPT-OSS, Qwen, Kimi, GLM và các mô hình tương tự) thông qua bề mặt
`/v1/chat/completions` tiêu chuẩn dựa trên hạ tầng Bedrock. Mantle cũng
cung cấp các mô hình Anthropic Claude thông qua tuyến Anthropic Messages.

| Thuộc tính      | Giá trị                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| ID nhà cung cấp | `amazon-bedrock-mantle`                                                                              |
| API             | `openai-completions` cho các mô hình OSS được phát hiện, `anthropic-messages` cho các mô hình Claude |
| Xác thực        | `AWS_BEARER_TOKEN_BEDROCK` được chỉ định rõ hoặc tạo bearer token từ chuỗi thông tin xác thực IAM     |
| Khu vực mặc định | `us-east-1` (ghi đè bằng `AWS_REGION` hoặc `AWS_DEFAULT_REGION`)                                    |

## Bắt đầu

Chọn phương thức xác thực bạn muốn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Explicit bearer token">
    **Phù hợp nhất cho:** các môi trường mà bạn đã có bearer token Mantle.

    <Steps>
      <Step title="Set the bearer token on the gateway host">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Bạn có thể tùy chọn đặt khu vực (mặc định là `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```

        Các mô hình được phát hiện xuất hiện dưới nhà cung cấp `amazon-bedrock-mantle`. Không
        cần cấu hình bổ sung, trừ khi bạn muốn ghi đè các giá trị mặc định.
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM credentials">
    **Phù hợp nhất cho:** sử dụng thông tin xác thực tương thích với AWS SDK (cấu hình dùng chung, SSO, danh tính web, vai trò phiên bản máy hoặc tác vụ).

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
    Khi `AWS_BEARER_TOKEN_BEDROCK` chưa được đặt, OpenClaw tạo bearer token cho bạn từ chuỗi thông tin xác thực mặc định của AWS, bao gồm thông tin xác thực/cấu hình dùng chung, SSO, danh tính web và vai trò phiên bản máy hoặc tác vụ.
    </Tip>

  </Tab>
</Tabs>

## Tự động phát hiện mô hình

Khi `AWS_BEARER_TOKEN_BEDROCK` được đặt, OpenClaw sử dụng trực tiếp giá trị đó. Nếu không,
OpenClaw sẽ cố gắng tạo bearer token Mantle từ chuỗi thông tin xác thực
mặc định của AWS. Sau đó, OpenClaw phát hiện các mô hình Mantle khả dụng bằng cách truy vấn
điểm cuối `/v1/models` của khu vực.

| Hành vi              | Chi tiết                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Bộ nhớ đệm phát hiện | Kết quả được lưu vào bộ nhớ đệm trong 1 giờ cho mỗi khu vực; lỗi truy xuất trả về kết quả được lưu gần nhất |
| Làm mới token IAM    | Mỗi 2 giờ, được lưu vào bộ nhớ đệm theo khu vực                                                       |

Để tiếp tục bật Plugin Mantle nhưng vô hiệu hóa tính năng tự động phát hiện và
tạo bearer token IAM, hãy tắt tùy chọn phát hiện do Plugin sở hữu:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
Bearer token này chính là `AWS_BEARER_TOKEN_BEDROCK` được nhà cung cấp [Amazon Bedrock](/vi/providers/bedrock) tiêu chuẩn sử dụng.
</Note>

### Các khu vực được hỗ trợ

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Cấu hình thủ công

Nếu bạn muốn sử dụng cấu hình rõ ràng thay vì tự động phát hiện:

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

Danh sách `models` rõ ràng và không rỗng có tính quyết định, đồng thời thay thế mọi
mục được phát hiện, bao gồm cả các mục Claude bên dưới. Bỏ qua `models` để giữ lại
danh mục Mantle tự động hoặc cung cấp đầy đủ các mục mô hình Claude mà bạn
muốn sử dụng.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Reasoning support">
    Khả năng hỗ trợ suy luận được suy ra từ các ID mô hình chứa những mẫu như
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` hoặc
    `gpt-oss-safeguard-120b`. OpenClaw tự động đặt `reasoning: true` cho
    các mô hình khớp trong quá trình phát hiện.
  </Accordion>

  <Accordion title="Endpoint unavailability">
    Nếu điểm cuối Mantle không khả dụng, không trả về mô hình nào hoặc quá trình
    phân giải bearer token thất bại, việc phát hiện sẽ trả về kết quả rỗng và
    nhà cung cấp ngầm định sẽ bị bỏ qua. OpenClaw không báo lỗi; các nhà cung cấp
    đã cấu hình khác tiếp tục hoạt động bình thường.
  </Accordion>

  <Accordion title="Claude via the Anthropic Messages route">
    Khi tính năng tự động phát hiện quản lý danh sách mô hình, OpenClaw nối thêm bốn mô hình
    Claude sau khi tra cứu thành công, bất kể `/v1/models` trả về nội dung gì:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) và
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), cùng với
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos
    Preview). Chúng sử dụng bề mặt API `anthropic-messages` và truyền phát qua
    cùng một điểm cuối tương thích với Anthropic được xác thực bằng bearer token
    (`<mantle-base>/anthropic`), vì vậy bearer token AWS không được xem như
    khóa API Anthropic.

    Claude Sonnet 5 luôn sử dụng chế độ suy luận thích ứng và mặc định dùng mức nỗ lực `high`.
    `/think off` và `/think minimal` được ánh xạ thành `low` vì tuyến Mantle
    không thể vô hiệu hóa suy luận. OpenClaw cũng bỏ qua nhiệt độ tùy chỉnh đối với
    các yêu cầu Sonnet 5.

    Claude Mythos 5 có quyền truy cập hạn chế. Mô hình này công bố cửa sổ ngữ cảnh
    1.000.000 token và giới hạn đầu ra 128.000 token, luôn sử dụng chế độ suy luận thích ứng,
    ánh xạ `/think off` và `/think minimal` thành `low`, đồng thời bỏ qua các
    tham số lấy mẫu do bên gọi chọn.

    Claude Mythos Preview luôn yêu cầu suy luận, mặc định dùng mức nỗ lực `high`
    khi không đặt mức `/think` (ánh xạ `xhigh`/`max` xuống
    `high` và `minimal` lên `low`). Opus 4.7 trên Mantle truyền phát mà không có
    dữ liệu suy luận do mô hình cung cấp, và OpenClaw bỏ qua tham số `temperature`
    vì Opus 4.7 không chấp nhận ghi đè việc lấy mẫu trên tuyến này; Mythos
    Preview vẫn chấp nhận ghi đè `temperature` như bình thường.

    Danh sách `models.providers["amazon-bedrock-mantle"].models` rõ ràng và không rỗng
    thay thế toàn bộ danh mục được phát hiện. Bỏ qua danh sách đó khi bạn
    muốn sử dụng các mục Claude tích hợp sẵn này.

  </Accordion>

  <Accordion title="Relationship to Amazon Bedrock provider">
    Bedrock Mantle là một nhà cung cấp tách biệt với nhà cung cấp
    [Amazon Bedrock](/vi/providers/bedrock) tiêu chuẩn. Mantle sử dụng bề mặt `/v1`
    tương thích với OpenAI cho danh mục OSS của mình, trong khi nhà cung cấp
    Bedrock tiêu chuẩn sử dụng API Bedrock Converse gốc.

    Cả hai nhà cung cấp đều dùng chung thông tin xác thực `AWS_BEARER_TOKEN_BEDROCK` khi
    giá trị này hiện diện.

  </Accordion>
</AccordionGroup>

## Nội dung liên quan

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/vi/providers/bedrock" icon="cloud">
    Nhà cung cấp Bedrock gốc dành cho Anthropic Claude, Titan và các mô hình khác.
  </Card>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Cách chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="OAuth and auth" href="/vi/gateway/authentication" icon="key">
    Chi tiết xác thực và các quy tắc tái sử dụng thông tin xác thực.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Các sự cố thường gặp và cách giải quyết.
  </Card>
</CardGroup>
