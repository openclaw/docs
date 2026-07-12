---
read_when:
    - Bạn muốn sử dụng các mô hình Amazon Bedrock với OpenClaw
    - Bạn cần thiết lập thông tin xác thực/khu vực AWS để gọi mô hình
summary: Sử dụng các mô hình Amazon Bedrock (Converse API) với OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T08:19:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw có thể sử dụng các mô hình **Amazon Bedrock** thông qua trình cung cấp phát trực tuyến **Bedrock Converse**. Việc xác thực Bedrock sử dụng **chuỗi thông tin xác thực mặc định của AWS SDK**, không phải khóa API.

| Thuộc tính | Giá trị                                                     |
| ---------- | ----------------------------------------------------------- |
| Trình cung cấp | `amazon-bedrock`                                        |
| API        | `bedrock-converse-stream`                                   |
| Xác thực   | Thông tin xác thực AWS (biến môi trường, cấu hình dùng chung hoặc vai trò phiên bản máy) |
| Khu vực    | `AWS_REGION` hoặc `AWS_DEFAULT_REGION` (mặc định: `us-east-1`) |

## Bắt đầu

Chọn phương thức xác thực bạn muốn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Access keys / env vars">
    **Phù hợp nhất cho:** máy của nhà phát triển, CI hoặc máy chủ nơi bạn trực tiếp quản lý thông tin xác thực AWS.

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
        Không cần `apiKey`. Cấu hình trình cung cấp với `auth: "aws-sdk"`:

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
    Với xác thực bằng dấu hiệu biến môi trường (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` hoặc `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw tự động bật trình cung cấp Bedrock ngầm định để khám phá mô hình mà không cần cấu hình bổ sung.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **Phù hợp nhất cho:** các phiên bản máy EC2 có gắn vai trò IAM, sử dụng dịch vụ siêu dữ liệu phiên bản máy để xác thực.

    <Steps>
      <Step title="Enable discovery explicitly">
        Khi sử dụng IMDS, OpenClaw không thể chỉ dựa vào các dấu hiệu biến môi trường để phát hiện xác thực AWS, vì vậy bạn phải chủ động bật tính năng này:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        Nếu bạn cũng muốn cơ chế tự động phát hiện dấu hiệu biến môi trường hoạt động (ví dụ: đối với các giao diện `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Bạn **không** cần khóa API giả.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Vai trò IAM được gắn vào phiên bản máy EC2 của bạn phải có các quyền sau:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (để tự động khám phá)
    - `bedrock:ListInferenceProfiles` (để khám phá hồ sơ suy luận)

    Hoặc gắn chính sách được quản lý `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Bạn chỉ cần `AWS_PROFILE=default` nếu đặc biệt muốn có dấu hiệu biến môi trường cho chế độ tự động hoặc các giao diện trạng thái. Luồng xác thực thực tế khi chạy Bedrock sử dụng chuỗi mặc định của AWS SDK, vì vậy xác thực bằng vai trò phiên bản máy qua IMDS vẫn hoạt động ngay cả khi không có dấu hiệu biến môi trường.
    </Note>

  </Tab>
</Tabs>

## Tự động khám phá mô hình

OpenClaw có thể tự động khám phá các mô hình Bedrock hỗ trợ **phát trực tuyến**
và **đầu ra văn bản**. Quá trình khám phá sử dụng `bedrock:ListFoundationModels` và
`bedrock:ListInferenceProfiles`, đồng thời kết quả được lưu vào bộ nhớ đệm (mặc định: 1 giờ).

Cách bật trình cung cấp ngầm định:

- Nếu `plugins.entries.amazon-bedrock.config.discovery.enabled` là `true`,
  OpenClaw sẽ thử khám phá ngay cả khi không có dấu hiệu biến môi trường AWS.
- Nếu `plugins.entries.amazon-bedrock.config.discovery.enabled` chưa được đặt,
  OpenClaw chỉ tự động thêm
  trình cung cấp Bedrock ngầm định khi phát hiện một trong các dấu hiệu xác thực AWS sau:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` hoặc `AWS_PROFILE`.
- Luồng xác thực thực tế khi chạy Bedrock vẫn sử dụng chuỗi mặc định của AWS SDK, vì vậy
  cấu hình dùng chung, SSO và xác thực bằng vai trò phiên bản máy qua IMDS vẫn có thể hoạt động ngay cả khi quá trình khám phá
  cần `enabled: true` để chủ động bật.

<Note>
Đối với các mục `models.providers["amazon-bedrock"]` tường minh, OpenClaw vẫn có thể sớm phân giải xác thực Bedrock bằng dấu hiệu biến môi trường từ các biến môi trường AWS như `AWS_BEARER_TOKEN_BEDROCK` mà không buộc phải tải toàn bộ cơ chế xác thực khi chạy. Luồng xác thực thực tế cho lệnh gọi mô hình vẫn sử dụng chuỗi mặc định của AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
    Các tùy chọn cấu hình nằm trong `plugins.entries.amazon-bedrock.config.discovery`:

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
    | -------- | -------- | ----- |
    | `enabled` | tự động | Trong chế độ tự động, OpenClaw chỉ bật trình cung cấp Bedrock ngầm định khi phát hiện dấu hiệu biến môi trường AWS được hỗ trợ. Đặt thành `true` để buộc thực hiện khám phá. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Khu vực AWS được sử dụng cho các lệnh gọi API khám phá. |
    | `providerFilter` | (tất cả) | Khớp với tên trình cung cấp Bedrock (ví dụ: `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Thời lượng bộ nhớ đệm tính bằng giây. Đặt thành `0` để tắt lưu vào bộ nhớ đệm. |
    | `defaultContextWindow` | `32000` | Cửa sổ ngữ cảnh được sử dụng cho các mô hình đã khám phá nhưng không có giới hạn token đã biết (hãy ghi đè nếu bạn biết giới hạn của mô hình). |
    | `defaultMaxTokens` | `4096` | Số token đầu ra tối đa được sử dụng cho các mô hình đã khám phá nhưng không có giới hạn token đã biết (hãy ghi đè nếu bạn biết giới hạn của mô hình). |

  </Accordion>

  <Accordion title="Context window and max-token limits">
    Các API `ListFoundationModels` và `GetFoundationModel` của Bedrock không trả về
    siêu dữ liệu về giới hạn token mà chỉ trả về ID mô hình, tên, phương thức dữ liệu và trạng thái
    vòng đời. OpenClaw cung cấp sẵn một bảng tra cứu các cửa sổ ngữ cảnh và giới hạn
    đầu ra đã biết cho các mô hình Bedrock phổ biến (Claude, Nova, Llama, Mistral, DeepSeek
    và các mô hình khác), nhờ đó việc quản lý phiên, ngưỡng Compaction và
    phát hiện tràn ngữ cảnh hoạt động chính xác cho các mô hình đó.

    Các mô hình được khám phá nhưng không có trong bảng sẽ dùng giá trị dự phòng `defaultContextWindow`
    và `defaultMaxTokens`. Nếu một mô hình bạn sử dụng không có giới hạn chính xác,
    hãy ghi đè bằng một mục
    `models.providers["amazon-bedrock"].models` tường minh.

  </Accordion>
</AccordionGroup>

## Thiết lập nhanh (luồng AWS)

Hướng dẫn này tạo một vai trò IAM, gắn các quyền Bedrock, liên kết
hồ sơ phiên bản máy và bật tính năng khám phá của OpenClaw trên máy chủ EC2.

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
    OpenClaw khám phá **các hồ sơ suy luận theo khu vực và toàn cầu** cùng với
    các mô hình nền tảng. Khi một hồ sơ ánh xạ đến một mô hình nền tảng đã biết,
    hồ sơ sẽ kế thừa các khả năng của mô hình đó (cửa sổ ngữ cảnh, số token tối đa,
    suy luận, thị giác), đồng thời khu vực yêu cầu Bedrock chính xác được tự động
    chèn vào. Điều này cho phép các hồ sơ Claude liên khu vực hoạt động mà không cần
    ghi đè trình cung cấp theo cách thủ công. Các hồ sơ liên khu vực toàn cầu (`global.*`) được liệt kê
    trước trong `openclaw models list` vì nhìn chung chúng cung cấp dung lượng tốt hơn
    và khả năng chuyển đổi dự phòng tự động.

    ID hồ sơ suy luận có dạng `us.anthropic.claude-opus-4-6-v1:0` (theo khu vực)
    hoặc `anthropic.claude-opus-4-6-v1:0` (toàn cầu). Nếu mô hình nền đã có
    trong kết quả khám phá, hồ sơ sẽ kế thừa toàn bộ tập hợp khả năng của mô hình đó;
    nếu không, các giá trị mặc định an toàn sẽ được áp dụng.

    Không cần cấu hình bổ sung. Miễn là tính năng khám phá được bật và chủ thể IAM
    có quyền `bedrock:ListInferenceProfiles`, các hồ sơ sẽ xuất hiện cùng với
    các mô hình nền tảng trong `openclaw models list`.

  </Accordion>

  <Accordion title="Service tier">
    Một số mô hình Bedrock hỗ trợ tham số `service_tier` để tối ưu hóa chi phí
    hoặc độ trễ. Có các cấp dịch vụ sau:

    | Cấp | Mô tả |
    |-----|-------|
    | `default` | Cấp Bedrock tiêu chuẩn |
    | `flex` | Xử lý với chi phí thấp hơn cho các khối lượng công việc có thể chấp nhận độ trễ dài hơn |
    | `priority` | Xử lý ưu tiên cho các khối lượng công việc nhạy cảm với độ trễ |
    | `reserved` | Dung lượng dành riêng cho các khối lượng công việc ở trạng thái ổn định |

    Đặt `serviceTier` (hoặc `service_tier`) thông qua `agents.defaults.params` cho
    các yêu cầu mô hình Bedrock hoặc theo từng mô hình trong
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

    Các giá trị hợp lệ là `default`, `flex`, `priority` và `reserved`. Claude
    Fable 5 và Sonnet 5 chỉ hỗ trợ tầng `default`; OpenClaw sẽ cảnh báo và
    bỏ qua `flex`, `priority` hoặc `reserved` được yêu cầu cho các mô hình đó. Với
    các mô hình khác, không phải mô hình nào cũng hỗ trợ mọi tầng -- tầng không được hỗ trợ
    sẽ trả về lỗi xác thực của Bedrock và thông báo lỗi có thể
    gây hiểu nhầm (ví dụ: "Mã định danh mô hình được cung cấp không hợp lệ"
    thay vì nêu rõ tầng là nguyên nhân). Nếu bạn gặp lỗi này, hãy kiểm tra
    xem mô hình có hỗ trợ tầng được yêu cầu hay không.

  </Accordion>

  <Accordion title="Claude Opus 4.7 and 4.8 temperature">
    Bedrock từ chối tham số `temperature` đối với Claude Opus 4.7 và Opus
    4.8. OpenClaw tự động bỏ qua `temperature` cho mọi tham chiếu Bedrock
    phù hợp, bao gồm mã mô hình nền tảng, hồ sơ suy luận có tên, hồ sơ
    suy luận ứng dụng có mô hình nền tảng được phân giải thành Opus 4.7/4.8 thông qua
    `bedrock:GetInferenceProfile`, và các biến thể `opus-4.7`/`opus-4.8` có dấu chấm
    với tiền tố khu vực tùy chọn (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Không cần tùy chọn cấu hình nào và việc bỏ qua này áp dụng cho cả
    đối tượng tùy chọn yêu cầu lẫn trường tải trọng `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Sử dụng `amazon-bedrock/anthropic.claude-fable-5` tại `us-east-1`, hoặc
    các mã suy luận khu vực như `us.anthropic.claude-fable-5`.
    OpenClaw áp dụng cửa sổ ngữ cảnh 1 triệu token, giới hạn đầu ra 128 nghìn token,
    chế độ suy nghĩ thích ứng luôn bật và ánh xạ mức độ nỗ lực được hỗ trợ của Fable. `/think off` và
    `/think minimal` được ánh xạ thành `low`; các điều khiển nhiệt độ và buộc chọn công cụ
    bị bỏ qua, tương tự tuyến Opus 4.7/4.8. Đầu ra truyền phát được giữ lại
    cho đến khi Bedrock trả về trạng thái kết thúc để các lần từ chối giữa luồng không
    làm lộ văn bản chưa hoàn chỉnh.

    AWS yêu cầu bạn chủ động đồng ý lưu giữ dữ liệu bằng `provider_data_share` trước khi
    Fable khả dụng. Lời nhắc và nội dung hoàn thành được chia sẻ với Anthropic và
    lưu giữ tối đa 30 ngày nhằm phục vụ mục đích tin cậy và an toàn. Hãy xem xét và cấu hình
    [chính sách lưu giữ dữ liệu của Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    trước khi bật mô hình.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 chỉ khả dụng thông qua Bedrock đối với các tài khoản đã
    được phê duyệt quyền truy cập hạn chế theo yêu cầu. OpenClaw nhận diện mô hình nền tảng
    `anthropic.claude-mythos-5` và các hồ sơ suy luận khu vực hoặc toàn cầu như
    `us.anthropic.claude-mythos-5`.

    OpenClaw áp dụng cửa sổ ngữ cảnh 1.000.000 token, giới hạn đầu ra
    128.000 token, đầu vào hình ảnh, bộ nhớ đệm lời nhắc, truyền phát an toàn khi từ chối và
    các mức độ nỗ lực gốc. Chế độ suy nghĩ thích ứng luôn được bật: `/think off` và
    `/think minimal` được ánh xạ thành `low`, còn `xhigh` và `max` vẫn khả dụng.
    Các giá trị lấy mẫu tùy chỉnh và buộc chọn công cụ bị bỏ qua.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS cung cấp tài liệu về Sonnet 5 cho cả hai điểm cuối
    [`bedrock-runtime` và `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw nhận diện mô hình nền tảng Bedrock
    `anthropic.claude-sonnet-5` và các hồ sơ suy luận khu vực hoặc toàn cầu như
    `us.anthropic.claude-sonnet-5`. OpenClaw áp dụng cửa sổ ngữ cảnh 1.000.000 token,
    giới hạn đầu ra 128.000 token, đầu vào hình ảnh, các mức độ nỗ lực gốc,
    bộ nhớ đệm lời nhắc và truyền phát an toàn khi từ chối.

    Bedrock duy trì chế độ suy nghĩ thích ứng cho Sonnet 5. OpenClaw mặc định sử dụng
    `high`; `/think off` và `/think minimal` được ánh xạ thành `low` vì tuyến này
    không thể tắt chế độ suy nghĩ. Các giá trị nhiệt độ tùy chỉnh và buộc chọn công cụ
    bị bỏ qua khi chế độ suy nghĩ thích ứng đang hoạt động.

  </Accordion>

  <Accordion title="Guardrails">
    Bạn có thể áp dụng [các biện pháp bảo vệ Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    cho mọi lần gọi mô hình Bedrock bằng cách thêm đối tượng `guardrail` vào
    cấu hình plugin `amazon-bedrock`. Các biện pháp bảo vệ cho phép bạn thực thi việc lọc nội dung,
    từ chối chủ đề, lọc từ ngữ, lọc thông tin nhạy cảm và kiểm tra
    tính xác thực theo ngữ cảnh.

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

    `guardrailIdentifier` và `guardrailVersion` là bắt buộc.

    | Tùy chọn | Mô tả |
    | ------ | ----------- |
    | `guardrailIdentifier` | Mã biện pháp bảo vệ (ví dụ: `abc123`) hoặc ARN đầy đủ (ví dụ: `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Số phiên bản đã phát hành hoặc `"DRAFT"` cho bản nháp đang làm việc. |
    | `streamProcessingMode` | `"sync"` hoặc `"async"` để đánh giá biện pháp bảo vệ trong quá trình truyền phát. Nếu bỏ qua, Bedrock sử dụng giá trị mặc định. |
    | `trace` | `"enabled"` hoặc `"enabled_full"` để gỡ lỗi; hãy bỏ qua hoặc đặt thành `"disabled"` trong môi trường sản xuất. |

    <Warning>
    Danh tính IAM mà Gateway sử dụng phải có quyền `bedrock:ApplyGuardrail` ngoài các quyền gọi tiêu chuẩn.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings for memory search">
    Bedrock cũng có thể đóng vai trò là nhà cung cấp embedding cho
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

    Embedding Bedrock sử dụng cùng chuỗi thông tin xác thực AWS SDK như suy luận (vai trò
    phiên bản, SSO, khóa truy cập, cấu hình dùng chung và danh tính web). Không cần
    khóa API.

    Các mô hình embedding được hỗ trợ bao gồm Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) và TwelveLabs Marengo. Xem
    [Tham chiếu cấu hình bộ nhớ -- Bedrock](/vi/reference/memory-config#bedrock-embedding-config)
    để biết danh sách đầy đủ các mô hình và tùy chọn số chiều.

  </Accordion>

  <Accordion title="Notes and caveats">
    - Bedrock yêu cầu **quyền truy cập mô hình** được bật trong tài khoản/khu vực AWS của bạn.
    - Tính năng tự động khám phá cần các quyền `bedrock:ListFoundationModels` và
      `bedrock:ListInferenceProfiles`.
    - Nếu bạn dựa vào chế độ tự động, hãy đặt một trong các dấu hiệu biến môi trường xác thực AWS được hỗ trợ trên
      máy chủ Gateway. Nếu bạn muốn sử dụng xác thực IMDS/cấu hình dùng chung mà không có dấu hiệu biến môi trường, hãy đặt
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw hiển thị nguồn thông tin xác thực theo thứ tự sau: `AWS_BEARER_TOKEN_BEDROCK`,
      tiếp theo là `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, rồi `AWS_PROFILE`, sau đó là
      chuỗi AWS SDK mặc định.
    - Khả năng hỗ trợ suy luận phụ thuộc vào mô hình; hãy kiểm tra thẻ mô hình Bedrock để biết
      các khả năng hiện tại.
    - Nếu muốn dùng quy trình khóa được quản lý, bạn cũng có thể đặt một proxy tương thích với OpenAI
      phía trước Bedrock và cấu hình proxy đó làm nhà cung cấp OpenAI.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Memory search" href="/vi/concepts/memory-search" icon="magnifying-glass">
    Embedding Bedrock cho cấu hình tìm kiếm bộ nhớ.
  </Card>
  <Card title="Memory config reference" href="/vi/reference/memory-config#bedrock-embedding-config" icon="database">
    Danh sách đầy đủ các mô hình embedding Bedrock và tùy chọn số chiều.
  </Card>
  <Card title="Troubleshooting" href="/vi/help/troubleshooting" icon="wrench">
    Hướng dẫn khắc phục sự cố chung và câu hỏi thường gặp.
  </Card>
</CardGroup>
