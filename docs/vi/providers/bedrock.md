---
read_when:
    - Bạn muốn sử dụng các mô hình Amazon Bedrock với OpenClaw
    - Bạn cần thiết lập thông tin xác thực/khu vực AWS để gọi mô hình
summary: Sử dụng các mô hình Amazon Bedrock (Converse API) với OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-19T05:59:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e5d17e929c303c06985889aa68e7081995fd1ef1211d200a767905d73813e11
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw có thể sử dụng các mô hình **Amazon Bedrock** thông qua nhà cung cấp phát trực tuyến **Bedrock Converse**. Cơ chế xác thực Bedrock sử dụng **chuỗi thông tin xác thực mặc định của AWS SDK**,
không phải khóa API.

| Thuộc tính | Giá trị                                                       |
| -------- | ----------------------------------------------------------- |
| Nhà cung cấp | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Xác thực     | Thông tin xác thực AWS (biến môi trường, cấu hình dùng chung hoặc vai trò phiên bản) |
| Khu vực   | `AWS_REGION` hoặc `AWS_DEFAULT_REGION` (mặc định: `us-east-1`) |

## Bắt đầu

Chọn phương thức xác thực mong muốn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Khóa truy cập / biến môi trường">
    **Phù hợp nhất cho:** máy của nhà phát triển, CI hoặc máy chủ nơi bạn trực tiếp quản lý thông tin xác thực AWS.

    <Steps>
      <Step title="Đặt thông tin xác thực AWS trên máy chủ Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Tùy chọn:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Tùy chọn (khóa API/mã thông báo bearer của Bedrock):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Thêm nhà cung cấp và mô hình Bedrock vào cấu hình">
        Không yêu cầu `apiKey`. Cấu hình nhà cung cấp bằng `auth: "aws-sdk"`:

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
                    id: "us.anthropic.claude-opus-4-6-v1",
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
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1" },
            },
          },
        }
        ```
      </Step>
      <Step title="Xác minh các mô hình khả dụng">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Với xác thực bằng dấu hiệu biến môi trường (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` hoặc `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw tự động bật nhà cung cấp Bedrock ngầm định để khám phá mô hình mà không cần cấu hình bổ sung.
    </Tip>

  </Tab>

  <Tab title="Vai trò phiên bản EC2 (IMDS)">
    **Phù hợp nhất cho:** các phiên bản EC2 được gắn vai trò IAM, sử dụng dịch vụ siêu dữ liệu phiên bản để xác thực.

    <Steps>
      <Step title="Bật tính năng khám phá một cách rõ ràng">
        Khi sử dụng IMDS, OpenClaw không thể phát hiện xác thực AWS chỉ từ các dấu hiệu biến môi trường, vì vậy bạn phải chủ động bật:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Tùy chọn thêm dấu hiệu biến môi trường cho chế độ tự động">
        Nếu bạn cũng muốn đường dẫn tự động phát hiện bằng dấu hiệu biến môi trường hoạt động (ví dụ: cho các bề mặt `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Bạn **không** cần khóa API giả.
      </Step>
      <Step title="Xác minh các mô hình được khám phá">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Vai trò IAM được gắn vào phiên bản EC2 phải có các quyền sau:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (để khám phá tự động)
    - `bedrock:ListInferenceProfiles` (để khám phá hồ sơ suy luận)

    Hoặc gắn chính sách được quản lý `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Bạn chỉ cần `AWS_PROFILE=default` nếu đặc biệt muốn có dấu hiệu biến môi trường cho chế độ tự động hoặc các bề mặt trạng thái. Đường dẫn xác thực thời gian chạy Bedrock thực tế sử dụng chuỗi mặc định của AWS SDK, vì vậy xác thực bằng vai trò phiên bản IMDS vẫn hoạt động ngay cả khi không có dấu hiệu biến môi trường.
    </Note>

  </Tab>
</Tabs>

## Tự động khám phá mô hình

OpenClaw có thể tự động khám phá các mô hình Bedrock hỗ trợ **phát trực tuyến**
và **đầu ra văn bản**. Quá trình khám phá sử dụng `bedrock:ListFoundationModels` và
`bedrock:ListInferenceProfiles`, đồng thời kết quả được lưu vào bộ nhớ đệm (mặc định: 1 giờ).

Cách bật nhà cung cấp ngầm định:

- Nếu `plugins.entries.amazon-bedrock.config.discovery.enabled` là `true`,
  OpenClaw sẽ thử khám phá ngay cả khi không có dấu hiệu biến môi trường AWS.
- Nếu `plugins.entries.amazon-bedrock.config.discovery.enabled` chưa được đặt,
  OpenClaw chỉ tự động thêm
  nhà cung cấp Bedrock ngầm định khi phát hiện một trong các dấu hiệu xác thực AWS sau:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` hoặc `AWS_PROFILE`.
- Đường dẫn xác thực thời gian chạy Bedrock thực tế vẫn sử dụng chuỗi mặc định của AWS SDK, vì vậy
  cấu hình dùng chung, SSO và xác thực bằng vai trò phiên bản IMDS vẫn có thể hoạt động ngay cả khi quá trình khám phá
  cần `enabled: true` để chủ động bật.

<Note>
Đối với các mục `models.providers["amazon-bedrock"]` rõ ràng, OpenClaw vẫn có thể sớm phân giải cơ chế xác thực Bedrock bằng dấu hiệu biến môi trường từ các biến môi trường AWS như `AWS_BEARER_TOKEN_BEDROCK` mà không buộc phải tải toàn bộ cơ chế xác thực thời gian chạy. Đường dẫn xác thực cho lệnh gọi mô hình thực tế vẫn sử dụng chuỗi mặc định của AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Các tùy chọn cấu hình khám phá">
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
    | ------ | ------- | ----------- |
    | `enabled` | tự động | Trong chế độ tự động, OpenClaw chỉ bật nhà cung cấp Bedrock ngầm định khi phát hiện dấu hiệu biến môi trường AWS được hỗ trợ. Đặt `true` để buộc khám phá. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Khu vực AWS được dùng cho các lệnh gọi API khám phá. |
    | `providerFilter` | (tất cả) | Khớp với tên nhà cung cấp Bedrock (ví dụ: `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Thời lượng bộ nhớ đệm tính bằng giây. Đặt thành `0` để tắt bộ nhớ đệm. |
    | `defaultContextWindow` | `32000` | Cửa sổ ngữ cảnh được dùng cho các mô hình đã khám phá không có giới hạn token đã biết (ghi đè nếu bạn biết giới hạn của mô hình). |
    | `defaultMaxTokens` | `4096` | Số token đầu ra tối đa được dùng cho các mô hình đã khám phá không có giới hạn token đã biết (ghi đè nếu bạn biết giới hạn của mô hình). |

  </Accordion>

  <Accordion title="Giới hạn cửa sổ ngữ cảnh và token tối đa">
    Các API `ListFoundationModels` và `GetFoundationModel` của Bedrock không trả về
    siêu dữ liệu giới hạn token, mà chỉ trả về ID mô hình, tên, phương thức và trạng thái
    vòng đời. OpenClaw cung cấp sẵn bảng tra cứu các cửa sổ ngữ cảnh và giới hạn đầu ra
    đã biết cho những mô hình Bedrock phổ biến (Claude, Nova, Llama, Mistral, DeepSeek
    và các mô hình khác), nhờ đó việc quản lý phiên, các ngưỡng Compaction và
    phát hiện tràn ngữ cảnh hoạt động chính xác cho những mô hình này.

    Các mô hình đã khám phá nhưng không có trong bảng sẽ dùng dự phòng `defaultContextWindow`
    và `defaultMaxTokens`. Nếu một mô hình bạn sử dụng thiếu giới hạn chính xác,
    hãy ghi đè bằng một mục
    `models.providers["amazon-bedrock"].models` rõ ràng.

  </Accordion>
</AccordionGroup>

## Thiết lập nhanh (đường dẫn AWS)

Hướng dẫn này tạo một vai trò IAM, gắn các quyền Bedrock, liên kết
hồ sơ phiên bản và bật tính năng khám phá của OpenClaw trên máy chủ EC2.

```bash
# 1. Tạo vai trò IAM và hồ sơ phiên bản
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

# 2. Gắn vào phiên bản EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Trên phiên bản EC2, bật tính năng khám phá một cách rõ ràng
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Tùy chọn: thêm dấu hiệu biến môi trường nếu bạn muốn dùng chế độ tự động mà không cần bật rõ ràng
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Xác minh các mô hình được khám phá
openclaw models list
```

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Hồ sơ suy luận">
    OpenClaw khám phá **các hồ sơ suy luận theo khu vực và toàn cầu** cùng với
    các mô hình nền tảng. Khi một hồ sơ ánh xạ đến mô hình nền tảng đã biết,
    hồ sơ sẽ kế thừa các khả năng của mô hình đó (cửa sổ ngữ cảnh, số token tối đa,
    suy luận, thị giác), đồng thời khu vực yêu cầu Bedrock chính xác được chèn
    tự động. Điều này có nghĩa là các hồ sơ Claude liên khu vực hoạt động mà không cần
    ghi đè nhà cung cấp theo cách thủ công. Các hồ sơ liên khu vực toàn cầu (`global.*`) được liệt kê
    đầu tiên trong `openclaw models list` vì nhìn chung chúng cung cấp dung lượng tốt hơn
    và khả năng tự động chuyển đổi dự phòng.

    ID hồ sơ suy luận có dạng `us.anthropic.claude-opus-4-6-v1` (theo khu vực)
    hoặc `anthropic.claude-opus-4-6-v1` (toàn cầu). Nếu mô hình nền đã có
    trong kết quả khám phá, hồ sơ sẽ kế thừa đầy đủ tập hợp khả năng của mô hình đó;
    nếu không, các giá trị mặc định an toàn sẽ được áp dụng.

    Không cần cấu hình bổ sung. Miễn là tính năng khám phá được bật và chủ thể IAM
    có `bedrock:ListInferenceProfiles`, các hồ sơ sẽ xuất hiện cùng với
    các mô hình nền tảng trong `openclaw models list`.

  </Accordion>

  <Accordion title="Cấp dịch vụ">
    Một số mô hình Bedrock hỗ trợ tham số `service_tier` để tối ưu hóa chi phí
    hoặc độ trễ. Có các cấp sau:

    | Cấp | Mô tả |
    |------|-------------|
    | `default` | Cấp Bedrock tiêu chuẩn |
    | `flex` | Xử lý được chiết khấu dành cho khối lượng công việc có thể chấp nhận độ trễ dài hơn |
    | `priority` | Xử lý ưu tiên dành cho khối lượng công việc nhạy cảm với độ trễ |
    | `reserved` | Dung lượng dành riêng cho khối lượng công việc ở trạng thái ổn định |

    Đặt `serviceTier` (hoặc `service_tier`) thông qua `agents.defaults.params` cho
    các yêu cầu mô hình Bedrock hoặc theo từng mô hình trong
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // áp dụng cho tất cả mô hình
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // ghi đè theo từng mô hình
              },
            },
          },
        },
      },
    }
    ```

    Các giá trị hợp lệ là `default`, `flex`, `priority` và `reserved`. Claude
    Fable 5 và Sonnet 5 chỉ hỗ trợ cấp `default`; OpenClaw sẽ cảnh báo và
    bỏ qua `flex`, `priority` hoặc `reserved` được yêu cầu cho các mô hình đó. Đối với
    các mô hình khác, không phải mô hình nào cũng hỗ trợ mọi cấp -- cấp không được hỗ trợ
    sẽ trả về lỗi xác thực Bedrock và thông báo lỗi có thể
    gây hiểu nhầm (ví dụ: "Mã định danh mô hình được cung cấp không hợp lệ"
    thay vì nêu cấp là nguyên nhân). Nếu gặp lỗi này, hãy kiểm tra
    xem mô hình có hỗ trợ cấp được yêu cầu hay không.

  </Accordion>

  <Accordion title="Nhiệt độ của Claude Opus 4.7 và 4.8">
    Bedrock từ chối tham số `temperature` đối với Claude Opus 4.7 và Opus
    4.8. OpenClaw tự động bỏ `temperature` cho mọi tham chiếu Bedrock
    phù hợp, bao gồm mã mô hình nền tảng, hồ sơ suy luận được đặt tên, hồ sơ
    suy luận ứng dụng có mô hình cơ sở được phân giải thành Opus 4.7/4.8 qua
    `bedrock:GetInferenceProfile`, và các biến thể `opus-4.7`/`opus-4.8` có dấu chấm
    với tiền tố khu vực tùy chọn (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Không cần tùy chọn cấu hình nào và việc bỏ qua này áp dụng cho cả
    đối tượng tùy chọn yêu cầu lẫn trường tải trọng `inferenceConfig`.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Sử dụng `amazon-bedrock/anthropic.claude-fable-5` trong `us-east-1`, hoặc các
    mã suy luận khu vực như `us.anthropic.claude-fable-5`.
    OpenClaw áp dụng cửa sổ ngữ cảnh 1M, giới hạn đầu ra 128K, chế độ
    tư duy thích ứng luôn bật và ánh xạ mức nỗ lực được hỗ trợ của Fable. `/think off` và
    `/think minimal` ánh xạ tới `low`; nhiệt độ và các điều khiển buộc chọn công cụ
    bị bỏ qua, tương tự tuyến Opus 4.7/4.8. Đầu ra truyền phát được giữ lại
    cho đến khi Bedrock trả về trạng thái kết thúc để các lần từ chối giữa luồng không
    làm lộ văn bản một phần.

    AWS yêu cầu chủ động chọn tham gia lưu giữ dữ liệu `provider_data_share` một cách rõ ràng trước khi
    Fable khả dụng. Lời nhắc và nội dung hoàn thành được chia sẻ với Anthropic và
    lưu giữ tối đa 30 ngày nhằm đảm bảo độ tin cậy và an toàn. Hãy xem xét và cấu hình
    [việc lưu giữ dữ liệu của Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    trước khi bật mô hình.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 chỉ khả dụng qua Bedrock đối với các tài khoản có
    phê duyệt quyền truy cập hạn chế bắt buộc. OpenClaw nhận diện mô hình nền tảng
    `anthropic.claude-mythos-5` và các hồ sơ suy luận khu vực hoặc toàn cầu như
    `us.anthropic.claude-mythos-5`.

    OpenClaw áp dụng cửa sổ ngữ cảnh 1.000.000 token, giới hạn đầu ra
    128.000 token, đầu vào hình ảnh, bộ nhớ đệm lời nhắc, truyền phát an toàn khi từ chối và
    các mức nỗ lực gốc. Tư duy thích ứng luôn được bật: `/think off` và
    `/think minimal` ánh xạ tới `low`, trong khi `xhigh` và `max` vẫn khả dụng.
    Các giá trị lấy mẫu tùy chỉnh và buộc chọn công cụ bị bỏ qua.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS cung cấp tài liệu về Sonnet 5 cho cả hai
    [điểm cuối `bedrock-runtime` và `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw nhận diện mô hình nền tảng Bedrock
    `anthropic.claude-sonnet-5` và các hồ sơ suy luận khu vực hoặc toàn cầu như
    `us.anthropic.claude-sonnet-5`. OpenClaw áp dụng cửa sổ ngữ cảnh 1.000.000 token,
    giới hạn đầu ra 128.000 token, đầu vào hình ảnh, các mức nỗ lực gốc,
    bộ nhớ đệm lời nhắc và truyền phát an toàn khi từ chối.

    Bedrock duy trì bật tư duy thích ứng cho Sonnet 5. OpenClaw mặc định dùng
    `high`; `/think off` và `/think minimal` ánh xạ tới `low` vì tuyến này
    không thể tắt tư duy. Các giá trị nhiệt độ tùy chỉnh và buộc chọn công cụ
    bị bỏ qua khi tư duy thích ứng đang hoạt động.

  </Accordion>

  <Accordion title="Rào chắn">
    Bạn có thể áp dụng [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    cho mọi lần gọi mô hình Bedrock bằng cách thêm đối tượng `guardrail` vào
    cấu hình Plugin `amazon-bedrock`. Rào chắn cho phép bạn thực thi việc lọc nội dung,
    từ chối chủ đề, lọc từ, lọc thông tin nhạy cảm và kiểm tra
    căn cứ theo ngữ cảnh.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // mã rào chắn hoặc ARN đầy đủ
                guardrailVersion: "1", // số phiên bản hoặc "DRAFT"
                streamProcessingMode: "sync", // tùy chọn: "sync" hoặc "async"
                trace: "enabled", // tùy chọn: "enabled", "disabled" hoặc "enabled_full"
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
    | `guardrailIdentifier` | Mã rào chắn (ví dụ: `abc123`) hoặc ARN đầy đủ (ví dụ: `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Số phiên bản đã phát hành hoặc `"DRAFT"` cho bản nháp đang làm việc. |
    | `streamProcessingMode` | `"sync"` hoặc `"async"` để đánh giá rào chắn trong quá trình truyền phát. Nếu bỏ qua, Bedrock sử dụng giá trị mặc định. |
    | `trace` | `"enabled"` hoặc `"enabled_full"` để gỡ lỗi; bỏ qua hoặc đặt thành `"disabled"` trong môi trường sản xuất. |

    <Warning>
    Thực thể chính IAM mà Gateway sử dụng phải có quyền `bedrock:ApplyGuardrail` ngoài các quyền gọi tiêu chuẩn.
    </Warning>

  </Accordion>

  <Accordion title="Embedding cho tìm kiếm bộ nhớ">
    Bedrock cũng có thể đóng vai trò nhà cung cấp embedding cho
    [tìm kiếm bộ nhớ](/vi/concepts/memory-search). Phần này được cấu hình riêng với
    nhà cung cấp suy luận -- đặt `agents.defaults.memorySearch.provider` thành `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // mặc định
          },
        },
      },
    }
    ```

    Embedding Bedrock sử dụng cùng chuỗi thông tin xác thực AWS SDK như suy luận (vai trò
    phiên bản, SSO, khóa truy cập, cấu hình dùng chung và danh tính web). Không cần
    khóa API.

    Các mô hình embedding được hỗ trợ gồm Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) và TwelveLabs Marengo. Xem
    [Tham chiếu cấu hình bộ nhớ -- Bedrock](/vi/reference/memory-config#bedrock-embedding-config)
    để biết danh sách đầy đủ các mô hình và tùy chọn kích thước.

  </Accordion>

  <Accordion title="Ghi chú và lưu ý">
    - Bedrock yêu cầu bật **quyền truy cập mô hình** trong tài khoản/khu vực AWS của bạn.
    - Tính năng tự động khám phá cần các quyền `bedrock:ListFoundationModels` và
      `bedrock:ListInferenceProfiles`.
    - Nếu dựa vào chế độ tự động, hãy đặt một trong các dấu hiệu biến môi trường xác thực AWS được hỗ trợ trên
      máy chủ Gateway. Nếu muốn dùng xác thực IMDS/cấu hình dùng chung mà không có dấu hiệu biến môi trường, hãy đặt
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw hiển thị nguồn thông tin xác thực theo thứ tự sau: `AWS_BEARER_TOKEN_BEDROCK`,
      sau đó `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, tiếp theo `AWS_PROFILE`, rồi đến
      chuỗi AWS SDK mặc định.
    - Khả năng hỗ trợ suy luận tùy thuộc vào mô hình; hãy kiểm tra thẻ mô hình Bedrock để biết
      các khả năng hiện tại.
    - Nếu muốn dùng luồng khóa được quản lý, bạn cũng có thể đặt một proxy tương thích với OpenAI
      phía trước Bedrock và cấu hình proxy đó làm nhà cung cấp OpenAI.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn mô hình" href="/vi/concepts/model-providers" icon="layers">
    Chọn nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Tìm kiếm bộ nhớ" href="/vi/concepts/memory-search" icon="magnifying-glass">
    Cấu hình embedding Bedrock cho tìm kiếm bộ nhớ.
  </Card>
  <Card title="Tham chiếu cấu hình bộ nhớ" href="/vi/reference/memory-config#bedrock-embedding-config" icon="database">
    Danh sách đầy đủ các mô hình embedding Bedrock và tùy chọn kích thước.
  </Card>
  <Card title="Khắc phục sự cố" href="/vi/help/troubleshooting" icon="wrench">
    Câu hỏi thường gặp và hướng dẫn khắc phục sự cố chung.
  </Card>
</CardGroup>
