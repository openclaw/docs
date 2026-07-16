---
read_when:
    - Bạn muốn một khóa được quản lý duy nhất cho nhiều nhà cung cấp mô hình
    - Bạn cần tính năng khám phá mô hình hoặc báo cáo hạn mức của ClawRouter trong OpenClaw
summary: Định tuyến các mô hình theo phạm vi thông tin xác thực qua ClawRouter và hiển thị hạn ngạch được quản lý
title: ClawRouter
x-i18n:
    generated_at: "2026-07-16T14:54:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 684405818b701448b37431302b0c2cc66e106c2c6d482545569d9dfc7f7fe8e5
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter cung cấp cho OpenClaw một khóa có phạm vi chính sách để dùng với nhiều
nhà cung cấp mô hình thượng nguồn. Plugin `clawrouter` đi kèm chỉ khám phá
các mô hình được phép dùng với khóa đó, định tuyến từng mô hình qua giao thức đã
khai báo và báo cáo ngân sách cùng tổng mức sử dụng của khóa trên các bề mặt
hiển thị mức sử dụng của OpenClaw.

Thông tin xác thực thượng nguồn và việc chuyển tiếp dành riêng cho từng nhà cung
cấp vẫn nằm trong ClawRouter, vì vậy bạn không bao giờ phải cài đặt hoặc xác thực
từng plugin nhà cung cấp thượng nguồn trên máy chủ OpenClaw. Plugin được đóng gói
kèm OpenClaw (`enabledByDefault: true`); bạn chỉ cần thông tin xác thực ClawRouter đã
được cấp.

| Thuộc tính       | Giá trị                                  |
| ---------------- | ---------------------------------------- |
| Nhà cung cấp     | `clawrouter`                       |
| Plugin           | đi kèm (bao gồm trong OpenClaw)          |
| Xác thực         | `CLAWROUTER_API_KEY`                       |
| URL mặc định     | `https://clawrouter.openclaw.ai`                       |
| Danh mục mô hình | Theo phạm vi thông tin xác thực qua `/v1/catalog` |
| Hạn mức          | Ngân sách và mức sử dụng hằng tháng qua `/v1/usage` |

## Bắt đầu

<Steps>
  <Step title="Lấy thông tin xác thực có phạm vi">
    Yêu cầu quản trị viên ClawRouter cung cấp thông tin xác thực có chính sách
    bao gồm các nhà cung cấp, mô hình và ngân sách hằng tháng mà bạn nên sử dụng.
    Thông tin xác thực chỉ được hiển thị một lần khi cấp.
  </Step>
  <Step title="Cấu hình OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` được đóng gói kèm và bật theo mặc định. Nếu cấu hình của
    bạn đặt `plugins.allow`, hãy thêm `clawrouter` vào danh sách đó
    trước khi bật. Đối với triển khai tùy chỉnh, hãy đặt `models.providers.clawrouter.baseUrl` thành
    nguồn gốc ClawRouter; giá trị mặc định là `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Liệt kê các mô hình được cấp quyền">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Sử dụng chính xác các tham chiếu mô hình được trả về như hiển thị. Chúng giữ
    nguyên không gian tên thượng nguồn, chẳng hạn như `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` hoặc
    `clawrouter/google/gemini-3.5-flash`. Nếu `agents.defaults.models` là danh sách cho phép trong cấu
    hình của bạn, hãy thêm từng tham chiếu ClawRouter đã chọn vào đó.

  </Step>
  <Step title="Chọn một mô hình">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Bạn cũng có thể chọn một mô hình được trả về cho một lần chạy bằng
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Triển khai không tương tác được quản lý

Giữ khóa proxy trong cơ chế chèn bí mật của workload và chỉ lưu một SecretRef
trong `openclaw.json`. Các trường được quản lý chuẩn là:

| Mục đích       | Trường cấu hình hoặc môi trường                                           |
| -------------- | ------------------------------------------------------------------------- |
| Nguồn gốc bộ định tuyến | `models.providers.clawrouter.baseUrl`                                               |
| Thông tin xác thực | `models.providers.clawrouter.apiKey` -> SecretRef môi trường                              |
| Giá trị bí mật | `CLAWROUTER_API_KEY` trong môi trường tiến trình gateway                    |
| Mô hình mặc định | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`                               |
| Thẻ workload   | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (không bắt buộc)                                      |

Ví dụ: bộ điều khiển triển khai có thể sở hữu bản vá JSON5 này:

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

Nếu triển khai đặt `plugins.allow`, hãy giữ nguyên các mục hiện có và thêm
`clawrouter`. Xác thực và áp dụng mà không cần trình hướng dẫn tương tác:

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

Lần chạy thử sẽ phân giải SecretRef nhưng không bao giờ in giá trị của nó. Để
luân chuyển thông tin xác thực, hãy cập nhật Secret bên ngoài cung cấp
`CLAWROUTER_API_KEY` và khởi động lại workload gateway để tải môi trường tiến
trình mới. Tệp cấu hình và tham chiếu mô hình không thay đổi.

Đối với gateway Docker độc lập được xây dựng từ mã nguồn, ClawRouter đã được
bao gồm trong runtime gốc. Chỉ chọn plugin kênh cần được đóng gói riêng, chẳng
hạn như `OPENCLAW_EXTENSIONS=clickclack`, `slack` hoặc `msteams`; xem
[các image được xây dựng từ mã nguồn với những plugin đã chọn](/vi/install/docker#source-built-images-with-selected-plugins).
Các triển khai dạng kho lưu trữ/thiết bị phải đóng gói cùng mã nguồn đã được
đưa vào thông qua quy trình tạo artifact riêng thay vì sử dụng image OCI.

## Mức sẵn sàng và bằng chứng trực tiếp

Các bước kiểm tra này chứng minh những ranh giới khác nhau; không thay thế bước
này bằng bước khác:

```bash
# Chỉ kiểm tra tình trạng tiến trình ClawRouter; không sử dụng thông tin xác thực hoặc mô hình thượng nguồn.
curl -fsS https://clawrouter.internal.example/v1/health

# Chỉ kiểm tra mức sẵn sàng khởi động gateway OpenClaw; không thực hiện lệnh gọi mô hình.
curl -fsS http://127.0.0.1:18789/readyz

# Khám phá danh mục theo phạm vi thông tin xác thực.
openclaw models list --all --provider clawrouter --json

# Phép thử suy luận thực tế tối thiểu qua nhà cung cấp ClawRouter đã cấu hình.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Phép thử canary cho workload bằng tham chiếu mô hình chính xác đã được cấp quyền.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Trả lời chính xác: CLAWROUTER_CANARY_OK" \
  --json
```

Hãy sử dụng một mô hình do danh mục có phạm vi trả về thay vì sao chép ví dụ
một cách máy móc. Phản hồi `/readyz` thành công có nghĩa là gateway có
thể phục vụ yêu cầu; điều đó không khẳng định ClawRouter, thông tin xác thực của
nó hoặc nhà cung cấp thượng nguồn đã sẵn sàng. Phép thử mô hình và canary tác
nhân là các bằng chứng suy luận.

Để chẩn đoán trực tiếp, hãy phát hành canary và kiểm tra nhật ký tiêu chuẩn của
gateway. Các chẩn đoán truyền tải mô hình hiện có chỉ chứa siêu dữ liệu sẽ phát
ra các dòng có dạng:

```text
[model-fetch] bắt đầu provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] phản hồi provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Plugin gửi các tiêu đề `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` và
`X-ClawRouter-Session-Id` có độ dài giới hạn khi những mã định danh đó khả dụng. Plugin
cũng ánh xạ `callId` chẩn đoán (`<run-id>:model:<n>`) của lệnh gọi mô
hình sang `X-Request-ID`, để có thể liên kết một sự kiện gọi mô hình OpenClaw
với dấu vết kiểm toán chỉ chứa siêu dữ liệu của ClawRouter. Các giá trị nằm
trong giới hạn mã yêu cầu 128 ký tự sẽ giống hệt nhau. Các giá trị dài hơn giữ
lại hậu tố `:model:<n>` và một hàm băm xác định để các lệnh gọi riêng biệt
vẫn có độ dài giới hạn và có thể liên kết. Siêu dữ liệu triển khai tĩnh như
`X-ClawRouter-Project-Id` có thể được đặt trong ánh xạ `headers` của nhà cung
cấp. Các tiêu đề phân bổ tác nhân và phiên giữ giới hạn riêng là 256 ký tự. Mã
yêu cầu tự động chứa các ký tự ngoài tập mã định danh ASCII của ClawRouter sử
dụng cùng dạng xác định có độ dài giới hạn.
Các tiêu đề được cấu hình rõ ràng, bao gồm mọi biến thể chữ hoa/chữ thường của
`X-Request-ID`, được ưu tiên hơn các giá trị tự động. Chẩn đoán truyền tải
ghi lại siêu dữ liệu định tuyến và phản hồi; nó không ghi nhật ký thông tin xác
thực, mã yêu cầu, lời nhắc hoặc nội dung hoàn thành. Sự kiện kiểm toán riêng của
ClawRouter cung cấp nhà cung cấp thượng nguồn đã chọn và trạng thái lưu giữ nội
dung.

## Khám phá mô hình

`GET /v1/catalog` trả về `{ providers: [...] }`, trong đó mỗi mục nhà cung cấp liệt
kê `models[]` riêng (cùng mã thượng nguồn, các khả năng và giá) và các
tuyến yêu cầu được hỗ trợ. OpenClaw không cung cấp danh sách cố định thứ hai về
các mô hình ClawRouter. Một mô hình trong danh mục được quảng bá là mô hình
OpenClaw khi:

- chính sách của thông tin xác thực cấp quyền cho nhà cung cấp của mô hình;
- mô hình trong danh mục công bố một khả năng LLM được hỗ trợ (`llm.responses`,
  `llm.chat`, `llm.messages` hoặc `llm.stream` với tuyến phát
  trực tuyến phù hợp); và
- nhà cung cấp cung cấp một tuyến phù hợp cho một trong các phương thức truyền tải bên dưới.

Việc thêm một mô hình vào nhà cung cấp ClawRouter được hỗ trợ không cần bản phát
hành OpenClaw: lần làm mới danh mục tiếp theo (được lưu vào bộ nhớ đệm trong 60
giây cho mỗi phạm vi thông tin xác thực) sẽ khám phá mô hình đó. Mô hình cần một
giao thức truyền mới thì trước tiên phải được plugin hỗ trợ.

## Giao thức và plugin nhà cung cấp

ClawRouter sở hữu thông tin xác thực thượng nguồn; danh mục của nó cho OpenClaw
biết phương thức truyền tải cần dùng, vì vậy bạn không bao giờ phải cài đặt
plugin xác thực của từng công ty thượng nguồn.

| Khả năng/tuyến trong danh mục                          | Phương thức truyền tải OpenClaw |
| ------------------------------------------------------ | ------------------------------- |
| `llm.responses` (nhà cung cấp tương thích OpenAI)   | `openai-responses`              |
| `llm.chat` (nhà cung cấp tương thích OpenAI)   | `openai-completions`              |
| `llm.messages` + tuyến `anthropic.messages`          | `anthropic-messages`              |
| `llm.stream` + tuyến `google.generate_content` phát trực tuyến | `google-generative-ai`       |

Plugin cũng áp dụng các chính sách phát lại và lược đồ công cụ tương ứng cho
những họ đó (khả năng tương thích lược đồ công cụ OpenAI/DeepSeek/Gemini/Perplexity;
các chính sách phát lại gốc của Anthropic và Google Gemini). Các mô hình
Perplexity nhận một phép viết lại lược đồ nghiêm ngặt: `patternProperties` và
`additionalProperties` bị loại bỏ và mọi lược đồ đối tượng đều khai báo
`properties`, vì Perplexity từ chối các lược đồ công cụ không có chúng.
Một nhà cung cấp trong danh mục chỉ cung cấp định dạng yêu cầu không được hỗ
trợ sẽ cố ý không được quảng bá là mô hình văn bản OpenClaw. Hãy chuẩn hóa các
nhà cung cấp đó thành một trong những hợp đồng được hỗ trợ trong ClawRouter thay
vì gửi payload không tương thích.

## Hạn mức và mức sử dụng

Phản hồi `/v1/usage` của ClawRouter cung cấp dữ liệu cho các bề mặt mức
sử dụng nhà cung cấp thông thường của OpenClaw: tổng số yêu cầu, token và chi
phí, cùng một kỳ ngân sách hằng tháng khi khóa có giới hạn. Các khóa không đo
lường vẫn hiển thị tổng mức sử dụng mà không có kỳ phần trăm.

Việc tra cứu hạn mức sử dụng cùng khóa có phạm vi như khi khám phá mô hình. Tra
cứu hạn mức thất bại không chặn việc thực thi mô hình.

Kiểm tra ảnh chụp nhanh trực tiếp bằng:

```bash
openclaw status --usage
openclaw models status
```

Ảnh chụp nhanh cùng nhà cung cấp cũng khả dụng cho `/status` trong trò
chuyện và giao diện mức sử dụng của OpenClaw. Ngân sách áp dụng trên toàn bộ
chính sách, vì vậy các yêu cầu do một máy khách khác sử dụng cùng chính sách
ClawRouter thực hiện có thể thay đổi phần trăm còn lại.

## Khắc phục sự cố

| Triệu chứng                              | Kiểm tra                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Không có mô hình ClawRouter              | Xác nhận plugin đã được bật và được `plugins.allow` cho phép, sau đó kiểm tra rằng thông tin xác thực đang hoạt động và cấp quyền cho ít nhất một nhà cung cấp sẵn sàng. |
| Thiếu một mô hình ClawRouter đã cấu hình | Kiểm tra khả năng `/v1/catalog` và hỗ trợ tuyến của mô hình. Các hợp đồng truyền tải không được hỗ trợ sẽ bị lọc có chủ đích.               |
| `Unknown model: clawrouter/...`                       | Thêm tham chiếu danh mục chính xác vào `agents.defaults.models` khi ánh xạ cấu hình đó đang được dùng làm danh sách cho phép.                          |
| `401` hoặc `403` từ danh mục hoặc mức sử dụng | Cấp lại hoặc điều chỉnh lại phạm vi thông tin xác thực ClawRouter; OpenClaw không chuyển sang dùng khóa của nhà cung cấp thượng nguồn. |
| Lệnh gọi mô hình thất bại sau khi khám phá | Kiểm tra kết nối nhà cung cấp và tình trạng thượng nguồn trong ClawRouter, sau đó thử lại khi trạng thái sẵn sàng được khôi phục.              |
| Mức sử dụng có tổng số nhưng không có phần trăm | Chính sách không được đo lường; hãy thêm ngân sách hằng tháng trong ClawRouter để hiển thị kỳ phần trăm.                                  |

## Hành vi bảo mật

- Việc khám phá danh mục được giới hạn theo khóa proxy đã cấu hình và được lưu vào bộ nhớ đệm theo phạm vi thông tin xác thực (thư mục tác nhân, thư mục không gian làm việc, id hồ sơ xác thực và URL cơ sở).
- Khóa proxy chỉ được đính kèm khi gửi yêu cầu; khóa này không được lưu trong siêu dữ liệu mô hình.
- Các giá trị phân bổ tự động và tương quan yêu cầu được loại bỏ khoảng trắng thừa và bị từ chối nếu chứa ký tự điều khiển trước khi gửi. Giá trị phân bổ được giới hạn ở 256 ký tự; id yêu cầu được giới hạn ở 128 ký tự.
- Dữ liệu chẩn đoán truyền tải mô hình chỉ chứa siêu dữ liệu và không bao giờ bao gồm khóa proxy hoặc nội dung mô hình.
- Id mô hình Anthropic và Gemini gốc chỉ được chuyển đổi thành id thượng nguồn tương ứng khi gửi yêu cầu.
- Các hàng danh mục không được hỗ trợ hoặc chưa được cấp quyền sẽ bị từ chối theo cơ chế đóng an toàn và không thể được chọn.

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Cấu hình nhà cung cấp và lựa chọn mô hình.
  </Card>
  <Card title="Theo dõi mức sử dụng" href="/vi/concepts/usage-tracking" icon="chart-line">
    Các giao diện về mức sử dụng và trạng thái của OpenClaw.
  </Card>
</CardGroup>
