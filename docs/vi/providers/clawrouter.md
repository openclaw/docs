---
read_when:
    - Bạn muốn dùng một khóa được quản lý cho nhiều nhà cung cấp mô hình
    - Bạn cần tính năng khám phá mô hình ClawRouter hoặc báo cáo hạn ngạch trong OpenClaw
summary: Định tuyến các mô hình theo phạm vi thông tin xác thực qua ClawRouter và hiển thị hạn ngạch được quản lý
title: ClawRouter
x-i18n:
    generated_at: "2026-07-19T05:55:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 929a93e8d1d003e21f792d0fdab9542553ffab374f59d4d0505819b0f719591f
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter cung cấp cho OpenClaw một khóa có phạm vi theo chính sách để sử dụng nhiều nhà cung cấp mô hình thượng nguồn. Plugin `clawrouter` đi kèm chỉ khám phá các mô hình được phép đối với khóa đó, định tuyến từng mô hình qua giao thức đã khai báo và báo cáo ngân sách cùng mức sử dụng tổng hợp của khóa trên các bề mặt hiển thị mức sử dụng của OpenClaw.

Thông tin xác thực thượng nguồn và việc chuyển tiếp dành riêng cho từng nhà cung cấp vẫn nằm trong ClawRouter, vì vậy bạn không bao giờ phải cài đặt hoặc xác thực từng Plugin nhà cung cấp thượng nguồn trên máy chủ OpenClaw. Plugin được đóng gói cùng OpenClaw (`enabledByDefault: true`); bạn chỉ cần thông tin xác thực ClawRouter đã được cấp.

| Thuộc tính    | Giá trị                                  |
| ------------- | ---------------------------------------- |
| Nhà cung cấp  | `clawrouter`                       |
| Plugin        | đi kèm (được bao gồm trong OpenClaw)     |
| Xác thực      | `CLAWROUTER_API_KEY`                       |
| URL mặc định  | `https://clawrouter.openclaw.ai`                       |
| Danh mục mô hình | Theo phạm vi thông tin xác thực qua `/v1/catalog` |
| Hạn mức       | Ngân sách và mức sử dụng hằng tháng qua `/v1/usage` |

## Bắt đầu

<Steps>
  <Step title="Nhận thông tin xác thực có phạm vi">
    Yêu cầu quản trị viên ClawRouter cấp thông tin xác thực có chính sách bao gồm
    các nhà cung cấp, mô hình và ngân sách hằng tháng mà bạn được phép sử dụng. Thông tin xác thực
    chỉ được hiển thị một lần khi cấp.
  </Step>
  <Step title="Cấu hình OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` được đóng gói đi kèm và bật theo mặc định. Nếu cấu hình của bạn đặt
    `plugins.allow`, hãy thêm `clawrouter` vào danh sách đó trước khi bật. Đối với
    triển khai tùy chỉnh, hãy đặt `models.providers.clawrouter.baseUrl` thành
    nguồn ClawRouter; giá trị mặc định là `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Liệt kê các mô hình được cấp quyền">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Sử dụng chính xác các tham chiếu mô hình được trả về như hiển thị. Chúng giữ nguyên không gian tên
    thượng nguồn, chẳng hạn như `clawrouter/openai/gpt-5.5`,
    `clawrouter/anthropic/claude-sonnet-4-6` hoặc
    `clawrouter/google/gemini-3.5-flash`. Nếu `agents.defaults.modelPolicy.allow`
    được cấu hình, hãy thêm từng tham chiếu ClawRouter đã chọn vào đó.

  </Step>
  <Step title="Chọn mô hình">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Bạn cũng có thể chọn một mô hình được trả về cho một lần chạy bằng
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Triển khai không tương tác được quản lý

Giữ khóa proxy trong cơ chế chèn bí mật của tải công việc và chỉ lưu một
SecretRef trong `openclaw.json`. Các trường được quản lý chuẩn là:

| Mục đích      | Trường cấu hình hoặc môi trường                                         |
| ------------- | ------------------------------------------------------------------------ |
| Nguồn bộ định tuyến | `models.providers.clawrouter.baseUrl`                                                  |
| Thông tin xác thực | `models.providers.clawrouter.apiKey` -> SecretRef môi trường                         |
| Giá trị bí mật | `CLAWROUTER_API_KEY` trong môi trường tiến trình Gateway                 |
| Mô hình mặc định | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`                            |
| Thẻ tải công việc | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (tùy chọn)                                       |

Ví dụ, bộ điều khiển triển khai có thể quản lý bản vá JSON5 này:

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

Lần chạy thử phân giải SecretRef nhưng không bao giờ in giá trị của nó. Để luân chuyển
thông tin xác thực, hãy cập nhật Secret bên ngoài cung cấp `CLAWROUTER_API_KEY` và
khởi động lại tải công việc Gateway để tải môi trường tiến trình mới. Tệp
cấu hình và tham chiếu mô hình không thay đổi.

Đối với Gateway Docker độc lập được xây dựng từ mã nguồn, ClawRouter đã được bao gồm trong
runtime gốc. Chỉ chọn Plugin kênh cần đóng gói riêng,
chẳng hạn như `OPENCLAW_EXTENSIONS=clickclack`, `slack` hoặc `msteams`; xem
[các image được xây dựng từ mã nguồn với những Plugin đã chọn](/vi/install/docker#source-built-images-with-selected-plugins).
Các triển khai dạng kho lưu trữ/thiết bị phải đóng gói cùng mã nguồn đã được đưa vào thông qua
Pipeline tạo sản phẩm riêng thay vì sử dụng image OCI.

## Mức độ sẵn sàng và bằng chứng trực tiếp

Các bước kiểm tra này chứng minh những ranh giới khác nhau; không thay thế bước này bằng bước khác:

```bash
# Chỉ kiểm tra tình trạng tiến trình ClawRouter; không sử dụng thông tin xác thực hoặc mô hình thượng nguồn.
curl -fsS https://clawrouter.internal.example/v1/health

# Chỉ kiểm tra mức độ sẵn sàng khi khởi động Gateway OpenClaw; không thực hiện lệnh gọi mô hình.
curl -fsS http://127.0.0.1:18789/readyz

# Khám phá danh mục theo phạm vi thông tin xác thực.
openclaw models list --all --provider clawrouter --json

# Phép thăm dò suy luận thực tối thiểu qua nhà cung cấp ClawRouter đã cấu hình.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Bản canary tải công việc sử dụng chính xác tham chiếu mô hình được cấp quyền.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Chỉ trả lời chính xác: CLAWROUTER_CANARY_OK" \
  --json
```

Hãy sử dụng một mô hình được danh mục có phạm vi trả về thay vì sao chép máy móc
mô hình ví dụ. Phản hồi `/readyz` thành công có nghĩa là Gateway có thể phục vụ
yêu cầu; điều đó không khẳng định ClawRouter, thông tin xác thực của nó hoặc một nhà cung cấp
thượng nguồn đã sẵn sàng. Phép thăm dò mô hình và canary tác tử là các bằng chứng suy luận.

Để chẩn đoán trực tiếp, hãy gửi canary và kiểm tra nhật ký tiêu chuẩn của Gateway.
Chẩn đoán truyền tải mô hình hiện có chỉ chứa siêu dữ liệu phát ra các dòng có dạng:

```text
[model-fetch] bắt đầu provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] phản hồi provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Plugin gửi các header `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` và
`X-ClawRouter-Session-Id` có giới hạn độ dài khi các mã định danh đó khả dụng. Plugin cũng
ánh xạ `callId` chẩn đoán (`<run-id>:model:<n>`) của lệnh gọi mô hình sang
`X-Request-ID`, nhờ đó một sự kiện gọi mô hình OpenClaw có thể được liên kết với dấu vết kiểm tra
chỉ chứa siêu dữ liệu của ClawRouter. Các giá trị nằm trong giới hạn mã yêu cầu 128 ký tự
thì giống hệt nhau. Các giá trị dài hơn giữ lại hậu tố `:model:<n>` và một hàm băm
xác định để các lệnh gọi riêng biệt vẫn có giới hạn và có thể liên kết. Siêu dữ liệu triển khai tĩnh
như `X-ClawRouter-Project-Id` có thể được đặt trong ánh xạ `headers` của nhà cung cấp.
Các header phân bổ tác tử và phiên giữ nguyên giới hạn riêng là 256 ký tự.
Mã yêu cầu tự động chứa các ký tự ngoài tập mã định danh ASCII của ClawRouter
sử dụng cùng dạng xác định có giới hạn.
Các header được cấu hình rõ ràng, bao gồm mọi biến thể chữ hoa chữ thường của `X-Request-ID`, được ưu tiên
hơn các giá trị tự động. Chẩn đoán truyền tải ghi lại siêu dữ liệu định tuyến và phản hồi;
không ghi nhật ký thông tin xác thực, mã yêu cầu, prompt hoặc nội dung hoàn thành.
Sự kiện kiểm tra riêng của ClawRouter cung cấp nhà cung cấp thượng nguồn đã chọn và
trạng thái lưu giữ nội dung.

## Khám phá mô hình

`GET /v1/catalog` trả về `{ providers: [...] }`, trong đó mỗi mục nhà cung cấp
liệt kê `models[]` riêng (gồm mã thượng nguồn, khả năng và giá) cùng các
tuyến yêu cầu được hỗ trợ. OpenClaw không cung cấp danh sách mô hình ClawRouter
cố định thứ hai. Một mô hình trong danh mục được công bố là mô hình OpenClaw khi:

- chính sách của thông tin xác thực cấp quyền cho nhà cung cấp của mô hình;
- mô hình trong danh mục công bố một khả năng LLM được hỗ trợ (`llm.responses`,
  `llm.chat`, `llm.messages` hoặc `llm.stream` với tuyến truyền trực tiếp
  tương ứng); và
- nhà cung cấp cung cấp một tuyến tương ứng cho một trong các phương thức truyền tải bên dưới.

Việc thêm mô hình vào một nhà cung cấp ClawRouter được hỗ trợ không cần bản phát hành OpenClaw:
lần làm mới danh mục tiếp theo (được lưu vào bộ nhớ đệm 60 giây cho mỗi phạm vi thông tin xác thực) sẽ khám phá
mô hình đó. Mô hình cần giao thức truyền mới thì trước tiên phải được Plugin hỗ trợ.

## Plugin giao thức và nhà cung cấp

ClawRouter quản lý thông tin xác thực thượng nguồn; danh mục của nó cho OpenClaw biết cần dùng
phương thức truyền tải nào, vì vậy bạn không bao giờ phải cài đặt Plugin xác thực của từng công ty thượng nguồn.

| Khả năng/tuyến trong danh mục                           | Phương thức truyền tải OpenClaw |
| -------------------------------------------------------- | ---------------------- |
| `llm.responses` (nhà cung cấp tương thích OpenAI)     | `openai-responses`     |
| `llm.chat` (nhà cung cấp tương thích OpenAI)     | `openai-completions`     |
| `llm.messages` + tuyến `anthropic.messages`            | `anthropic-messages`     |
| `llm.stream` + tuyến truyền trực tiếp `google.generate_content` | `google-generative-ai` |

Plugin cũng áp dụng các chính sách phát lại và lược đồ công cụ tương ứng cho những
họ này (khả năng tương thích lược đồ công cụ OpenAI/DeepSeek/Gemini/Perplexity; các
chính sách phát lại gốc của Anthropic và Google Gemini). Các mô hình Perplexity được viết lại
lược đồ nghiêm ngặt: `patternProperties` và `additionalProperties` bị loại bỏ và
mọi lược đồ đối tượng đều khai báo `properties`, vì Perplexity từ chối các lược đồ công cụ
không có chúng. Nhà cung cấp trong danh mục chỉ cung cấp một
định dạng yêu cầu không được hỗ trợ sẽ chủ ý không được công bố là mô hình văn bản OpenClaw.
Hãy chuẩn hóa các nhà cung cấp đó theo một trong các hợp đồng được hỗ trợ trong
ClawRouter thay vì gửi payload không tương thích.

## Hạn mức và mức sử dụng

Phản hồi `/v1/usage` của ClawRouter cung cấp dữ liệu cho các bề mặt hiển thị mức sử dụng
nhà cung cấp thông thường của OpenClaw: tổng số yêu cầu, token và chi phí, cùng với cửa sổ
ngân sách hằng tháng khi khóa có giới hạn. Các khóa không đo lường vẫn hiển thị mức sử dụng
tổng hợp mà không có cửa sổ phần trăm.

Tra cứu hạn mức sử dụng cùng khóa có phạm vi như khi khám phá mô hình. Tra cứu
hạn mức thất bại không chặn việc thực thi mô hình.

Kiểm tra ảnh chụp trạng thái trực tiếp bằng:

```bash
openclaw status --usage
openclaw models status
```

Ảnh chụp trạng thái nhà cung cấp tương tự có sẵn cho `/status` trong cuộc trò chuyện và giao diện
mức sử dụng của OpenClaw. Ngân sách áp dụng cho toàn bộ chính sách, vì vậy các yêu cầu do một máy khách khác thực hiện bằng
cùng chính sách ClawRouter có thể thay đổi tỷ lệ phần trăm còn lại.

## Khắc phục sự cố

| Triệu chứng                               | Kiểm tra                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Không có mô hình ClawRouter              | Xác nhận Plugin đã được bật và được `plugins.allow` cho phép, sau đó kiểm tra thông tin xác thực đang hoạt động và cấp quyền cho ít nhất một nhà cung cấp sẵn sàng. |
| Thiếu một mô hình ClawRouter đã cấu hình | Kiểm tra khả năng `/v1/catalog` và hỗ trợ tuyến của mô hình. Các hợp đồng truyền tải không được hỗ trợ sẽ chủ ý bị lọc.                    |
| Ghi đè mô hình bị chính sách từ chối     | Thêm chính xác tham chiếu danh mục hoặc `clawrouter/*` vào `agents.defaults.modelPolicy.allow`.                                                             |
| `401` hoặc `403` từ danh mục hoặc mức sử dụng | Cấp lại hoặc thay đổi phạm vi thông tin xác thực ClawRouter; OpenClaw không dự phòng bằng khóa nhà cung cấp thượng nguồn.                      |
| Lệnh gọi mô hình thất bại sau khi khám phá | Kiểm tra kết nối nhà cung cấp và tình trạng thượng nguồn trong ClawRouter, sau đó thử lại khi trạng thái sẵn sàng của nó phục hồi.             |
| Mức sử dụng có tổng số nhưng không có phần trăm | Chính sách không được đo lường; hãy thêm ngân sách hằng tháng trong ClawRouter để hiển thị cửa sổ phần trăm.                                  |

## Hành vi bảo mật

- Việc khám phá danh mục được giới hạn theo khóa proxy đã cấu hình và được lưu vào bộ nhớ đệm theo từng phạm vi thông tin xác thực (thư mục tác nhân, thư mục không gian làm việc, id hồ sơ xác thực và URL cơ sở).
- Khóa proxy chỉ được đính kèm khi gửi yêu cầu; khóa này không được lưu trong siêu dữ liệu mô hình.
- Các giá trị ghi nhận nguồn và tương quan yêu cầu tự động được cắt bỏ khoảng trắng, đồng thời bị từ chối nếu chứa ký tự điều khiển trước khi gửi. Giá trị ghi nhận nguồn được giới hạn ở 256 ký tự; id yêu cầu được giới hạn ở 128 ký tự.
- Thông tin chẩn đoán lớp truyền tải mô hình chỉ chứa siêu dữ liệu và không bao giờ bao gồm khóa proxy hoặc nội dung mô hình.
- Các id mô hình Anthropic và Gemini gốc chỉ được viết lại thành id thượng nguồn tương ứng khi gửi yêu cầu.
- Các hàng danh mục không được hỗ trợ hoặc chưa được cấp quyền sẽ từ chối theo mặc định và không thể được chọn.

## Liên quan

<CardGroup cols={2}>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers" icon="layers">
    Cấu hình nhà cung cấp và lựa chọn mô hình.
  </Card>
  <Card title="Theo dõi mức sử dụng" href="/vi/concepts/usage-tracking" icon="chart-line">
    Các giao diện về mức sử dụng và trạng thái của OpenClaw.
  </Card>
</CardGroup>
