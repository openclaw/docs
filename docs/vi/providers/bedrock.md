---
read_when:
    - Bạn muốn sử dụng các mô hình Amazon Bedrock với OpenClaw
    - Bạn cần thiết lập thông tin xác thực/khu vực AWS cho các lệnh gọi mô hình
summary: Sử dụng các mô hình Amazon Bedrock (Converse API) với OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-06-27T18:01:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3947ad565f3a0adcd62d4ce47c6ed760f73c77ba3f4bd43b0754a412511063f2
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw có thể dùng các mô hình **Amazon Bedrock** thông qua **Bedrock Converse**
streaming provider của nó. Xác thực Bedrock dùng **chuỗi thông tin xác thực mặc định của AWS SDK**,
không phải API key.

| Thuộc tính | Giá trị                                                     |
| -------- | ----------------------------------------------------------- |
| Nhà cung cấp | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Xác thực | Thông tin xác thực AWS (biến môi trường, cấu hình dùng chung, hoặc vai trò instance) |
| Vùng   | `AWS_REGION` hoặc `AWS_DEFAULT_REGION` (mặc định: `us-east-1`) |

## Bắt đầu

Chọn phương thức xác thực bạn muốn dùng và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Access keys / env vars">
    **Phù hợp nhất cho:** máy phát triển, CI, hoặc host nơi bạn quản lý trực tiếp thông tin xác thực AWS.

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Add a Bedrock provider and model to your config">
        Không cần `apiKey`. Cấu hình nhà cung cấp với `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Với xác thực bằng dấu hiệu môi trường (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, hoặc `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw tự động bật nhà cung cấp Bedrock ngầm định để khám phá mô hình mà không cần cấu hình bổ sung.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **Phù hợp nhất cho:** các instance EC2 có gắn vai trò IAM, dùng dịch vụ siêu dữ liệu instance để xác thực.

    <Steps>
      <Step title="Enable discovery explicitly">
        Khi dùng IMDS, OpenClaw không thể chỉ dựa vào dấu hiệu môi trường để phát hiện xác thực AWS, nên bạn phải chủ động bật:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        Nếu bạn cũng muốn đường dẫn tự động phát hiện bằng dấu hiệu môi trường hoạt động (ví dụ cho các bề mặt `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Bạn **không** cần API key giả.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Vai trò IAM gắn với instance EC2 của bạn phải có các quyền sau:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (để khám phá tự động)
    - `bedrock:ListInferenceProfiles` (để khám phá inference profile)

    Hoặc gắn managed policy `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Bạn chỉ cần `AWS_PROFILE=default` nếu bạn đặc biệt muốn có dấu hiệu môi trường cho chế độ tự động hoặc các bề mặt trạng thái. Đường dẫn xác thực runtime thực tế của Bedrock dùng chuỗi mặc định của AWS SDK, nên xác thực bằng vai trò instance qua IMDS vẫn hoạt động ngay cả khi không có dấu hiệu môi trường.
    </Note>

  </Tab>
</Tabs>

## Khám phá mô hình tự động

OpenClaw có thể tự động khám phá các mô hình Bedrock hỗ trợ **streaming**
và **đầu ra văn bản**. Quá trình khám phá dùng `bedrock:ListFoundationModels` và
`bedrock:ListInferenceProfiles`, và kết quả được lưu trong bộ nhớ đệm (mặc định: 1 giờ).

Cách bật nhà cung cấp ngầm định:

- Nếu `plugins.entries.amazon-bedrock.config.discovery.enabled` là `true`,
  OpenClaw sẽ thử khám phá ngay cả khi không có dấu hiệu môi trường AWS.
- Nếu `plugins.entries.amazon-bedrock.config.discovery.enabled` chưa được đặt,
  OpenClaw chỉ tự động thêm
  nhà cung cấp Bedrock ngầm định khi thấy một trong các dấu hiệu xác thực AWS sau:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY`, hoặc `AWS_PROFILE`.
- Đường dẫn xác thực runtime Bedrock thực tế vẫn dùng chuỗi mặc định của AWS SDK, nên
  cấu hình dùng chung, SSO, và xác thực bằng vai trò instance qua IMDS có thể hoạt động ngay cả khi quá trình khám phá
  cần `enabled: true` để chủ động bật.

<Note>
Với các mục `models.providers["amazon-bedrock"]` tường minh, OpenClaw vẫn có thể phân giải sớm xác thực Bedrock bằng dấu hiệu môi trường từ các dấu hiệu môi trường AWS như `AWS_BEARER_TOKEN_BEDROCK` mà không buộc phải tải toàn bộ xác thực runtime. Đường dẫn xác thực lệnh gọi mô hình thực tế vẫn dùng chuỗi mặc định của AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
    Các tùy chọn cấu hình nằm dưới `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Tùy chọn | Mặc định | Mô tả |
    | ------ | ------- | ----------- |
    | `enabled` | auto | Ở chế độ tự động, OpenClaw chỉ bật nhà cung cấp Bedrock ngầm định khi thấy dấu hiệu môi trường AWS được hỗ trợ. Đặt `true` để buộc khám phá. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Vùng AWS dùng cho các lệnh gọi API khám phá. |
    | `providerFilter` | (tất cả) | Khớp tên nhà cung cấp Bedrock (ví dụ `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Thời lượng bộ nhớ đệm tính bằng giây. Đặt thành `0` để tắt lưu bộ nhớ đệm. |
    | `defaultContextWindow` | `32000` | Cửa sổ ngữ cảnh dùng cho các mô hình được khám phá (ghi đè nếu bạn biết giới hạn mô hình của mình). |
    | `defaultMaxTokens` | `4096` | Số token đầu ra tối đa dùng cho các mô hình được khám phá (ghi đè nếu bạn biết giới hạn mô hình của mình). |

  </Accordion>
</AccordionGroup>

## Thiết lập nhanh (đường dẫn AWS)

Hướng dẫn này tạo một vai trò IAM, gắn quyền Bedrock, liên kết
instance profile, và bật khám phá OpenClaw trên host EC2.

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Inference profiles">
    OpenClaw khám phá **inference profile theo vùng và toàn cầu** cùng với
    foundation model. Khi một profile ánh xạ tới một foundation model đã biết,
    profile đó kế thừa các khả năng của mô hình đó (cửa sổ ngữ cảnh, số token tối đa,
    reasoning, vision) và vùng yêu cầu Bedrock chính xác được chèn
    tự động. Điều này nghĩa là các profile Claude liên vùng hoạt động mà không cần ghi đè
    nhà cung cấp thủ công.

    ID inference profile có dạng `us.anthropic.claude-opus-4-6-v1:0` (theo vùng)
    hoặc `anthropic.claude-opus-4-6-v1:0` (toàn cầu). Nếu mô hình nền đã có
    trong kết quả khám phá, profile sẽ kế thừa toàn bộ bộ khả năng của nó;
    nếu không, các giá trị mặc định an toàn sẽ được áp dụng.

    Không cần cấu hình bổ sung. Miễn là khám phá được bật và principal IAM
    có `bedrock:ListInferenceProfiles`, các profile sẽ xuất hiện cùng với
    foundation model trong `openclaw models list`.

  </Accordion>

  <Accordion title="Service tier">
    Một số mô hình Bedrock hỗ trợ tham số `service_tier` để tối ưu chi phí
    hoặc độ trễ. Có các tier sau:

    | Tier | Mô tả |
    |------|-------------|
    | `default` | Tier Bedrock tiêu chuẩn |
    | `flex` | Xử lý được giảm giá cho các workload có thể chấp nhận độ trễ dài hơn |
    | `priority` | Xử lý ưu tiên cho các workload nhạy cảm với độ trễ |
    | `reserved` | Dung lượng dành riêng cho các workload trạng thái ổn định |

    Đặt `serviceTier` (hoặc `service_tier`) qua `agents.defaults.params` cho
    các yêu cầu mô hình Bedrock, hoặc theo từng mô hình trong
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    Các giá trị hợp lệ là `default`, `flex`, `priority`, và `reserved`. Không phải mọi
    mô hình đều hỗ trợ tất cả tier — nếu yêu cầu một tier không được hỗ trợ, Bedrock sẽ
    trả về lỗi xác thực. Lưu ý: thông báo lỗi hơi gây hiểu nhầm;
    có thể nói "The provided model identifier is invalid" thay vì chỉ ra
    tier dịch vụ không được hỗ trợ. Nếu bạn thấy lỗi này, hãy kiểm tra xem mô hình
    có hỗ trợ tier được yêu cầu hay không.

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock từ chối tham số `temperature` cho Claude Opus 4.7. OpenClaw
    tự động bỏ qua `temperature` cho mọi tham chiếu Bedrock Opus 4.7, bao gồm
    ID foundation model, inference profile được đặt tên, inference profile ứng dụng
    có mô hình bên dưới phân giải thành Opus 4.7 qua
    `bedrock:GetInferenceProfile`, và các biến thể `opus-4.7` dạng dấu chấm với
    tiền tố vùng tùy chọn (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Không cần nút cấu hình nào, và việc bỏ qua này áp dụng cho cả
    đối tượng tùy chọn yêu cầu lẫn trường payload `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Dùng `amazon-bedrock/anthropic.claude-fable-5` trong `us-east-1`, hoặc các
    mã suy luận theo khu vực như `us.anthropic.claude-fable-5`.
    OpenClaw áp dụng cửa sổ ngữ cảnh 1M của Fable, giới hạn đầu ra 128K, chế độ
    suy nghĩ thích ứng luôn bật, và ánh xạ mức nỗ lực được hỗ trợ. `/think off` và
    `/think minimal` ánh xạ thành `low`; các điều khiển nhiệt độ không được hỗ trợ
    và lựa chọn công cụ bắt buộc sẽ bị bỏ qua. Đầu ra phát trực tuyến được giữ lại
    cho đến khi Bedrock trả về trạng thái kết thúc để các từ chối giữa luồng không
    làm lộ văn bản một phần. Fable chỉ hỗ trợ tầng dịch vụ tiêu chuẩn; OpenClaw bỏ qua
    các tầng `flex`, `priority`, và `reserved` đã cấu hình cho mô hình này.

    AWS yêu cầu bật chọn tham gia lưu giữ dữ liệu `provider_data_share` một cách rõ ràng
    trước khi Fable khả dụng. Prompt và phần hoàn tất được chia sẻ với Anthropic và
    được lưu giữ tối đa 30 ngày cho mục đích tin cậy và an toàn. Hãy xem xét và cấu hình
    [lưu giữ dữ liệu Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    trước khi bật mô hình.

  </Accordion>

  <Accordion title="Guardrails">
    Bạn có thể áp dụng [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    cho tất cả các lần gọi mô hình Bedrock bằng cách thêm đối tượng `guardrail` vào
    cấu hình Plugin `amazon-bedrock`. Guardrails cho phép bạn thực thi lọc nội dung,
    từ chối chủ đề, bộ lọc từ, bộ lọc thông tin nhạy cảm, và kiểm tra neo ngữ cảnh.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Tùy chọn | Bắt buộc | Mô tả |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Có | ID Guardrail (ví dụ `abc123`) hoặc ARN đầy đủ (ví dụ `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Có | Số phiên bản đã phát hành, hoặc `"DRAFT"` cho bản nháp đang làm việc. |
    | `streamProcessingMode` | Không | `"sync"` hoặc `"async"` để đánh giá guardrail trong khi phát trực tuyến. Nếu bỏ qua, Bedrock dùng mặc định của nó. |
    | `trace` | Không | `"enabled"` hoặc `"enabled_full"` để gỡ lỗi; bỏ qua hoặc đặt `"disabled"` cho môi trường production. |

    <Warning>
    IAM principal được Gateway sử dụng phải có quyền `bedrock:ApplyGuardrail` bên cạnh các quyền gọi tiêu chuẩn.
    </Warning>

  </Accordion>

  <Accordion title="Embedding cho tìm kiếm bộ nhớ">
    Bedrock cũng có thể đóng vai trò nhà cung cấp embedding cho
    [tìm kiếm bộ nhớ](/vi/concepts/memory-search). Cấu hình này tách biệt với
    nhà cung cấp suy luận -- đặt `agents.defaults.memorySearch.provider` thành `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Embedding Bedrock dùng cùng chuỗi thông tin xác thực AWS SDK như suy luận (vai trò
    instance, SSO, khóa truy cập, cấu hình dùng chung, và định danh web). Không cần
    khóa API. Đặt rõ `memorySearch.provider: "bedrock"` để dùng embedding
    Bedrock.

    Các mô hình embedding được hỗ trợ bao gồm Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4), và TwelveLabs Marengo. Xem
    [Tham chiếu cấu hình bộ nhớ -- Bedrock](/vi/reference/memory-config#bedrock-embedding-config)
    để biết danh sách mô hình đầy đủ và các tùy chọn số chiều.

  </Accordion>

  <Accordion title="Ghi chú và lưu ý">
    - Bedrock yêu cầu bật **quyền truy cập mô hình** trong tài khoản/khu vực AWS của bạn.
    - Khám phá tự động cần các quyền `bedrock:ListFoundationModels` và
      `bedrock:ListInferenceProfiles`.
    - Nếu bạn dựa vào chế độ tự động, hãy đặt một trong các dấu env xác thực AWS được hỗ trợ trên
      máy chủ Gateway. Nếu bạn ưu tiên xác thực IMDS/cấu hình dùng chung mà không có dấu env, hãy đặt
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw hiển thị nguồn thông tin xác thực theo thứ tự này: `AWS_BEARER_TOKEN_BEDROCK`,
      rồi `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, rồi `AWS_PROFILE`, rồi
      chuỗi AWS SDK mặc định.
    - Hỗ trợ suy luận phụ thuộc vào mô hình; hãy kiểm tra thẻ mô hình Bedrock để biết
      các khả năng hiện tại.
    - Nếu bạn ưu tiên luồng khóa được quản lý, bạn cũng có thể đặt một proxy tương thích OpenAI
      phía trước Bedrock và cấu hình nó làm nhà cung cấp OpenAI thay thế.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình, và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tìm kiếm bộ nhớ" href="/vi/concepts/memory-search" icon="magnifying-glass">
    Embedding Bedrock cho cấu hình tìm kiếm bộ nhớ.
  </Card>
  <Card title="Tham chiếu cấu hình bộ nhớ" href="/vi/reference/memory-config#bedrock-embedding-config" icon="database">
    Danh sách mô hình embedding Bedrock đầy đủ và các tùy chọn số chiều.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>
