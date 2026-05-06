---
read_when:
    - Tích hợp các máy khách sử dụng OpenResponses API
    - Bạn muốn đầu vào dựa trên mục, lệnh gọi công cụ của máy khách hoặc sự kiện SSE
summary: Cung cấp một điểm cuối HTTP /v1/responses tương thích với OpenResponses trên Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-05-06T09:13:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway của OpenClaw có thể phục vụ endpoint `POST /v1/responses` tương thích OpenResponses.

Endpoint này **bị tắt theo mặc định**. Trước tiên hãy bật trong cấu hình.

- `POST /v1/responses`
- Cùng cổng với Gateway (ghép kênh WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Bên dưới, các yêu cầu được thực thi như một lần chạy tác tử Gateway thông thường (cùng đường dẫn mã như
`openclaw agent`), nên định tuyến/quyền/cấu hình khớp với Gateway của bạn.

## Xác thực, bảo mật và định tuyến

Hành vi vận hành khớp với [OpenAI Chat Completions](/vi/gateway/openai-http-api):

- dùng đường dẫn xác thực HTTP Gateway tương ứng:
  - xác thực bí mật dùng chung (`gateway.auth.mode="token"` hoặc `"password"`): `Authorization: Bearer <token-or-password>`
  - xác thực proxy tin cậy (`gateway.auth.mode="trusted-proxy"`): các header proxy nhận biết danh tính từ một nguồn proxy tin cậy đã cấu hình; proxy loopback cùng máy chủ yêu cầu bật rõ ràng `gateway.auth.trustedProxy.allowLoopback = true`
  - xác thực mở qua ingress riêng tư (`gateway.auth.mode="none"`): không có header xác thực
- xem endpoint này là quyền truy cập operator đầy đủ cho phiên bản gateway
- với các chế độ xác thực bí mật dùng chung (`token` và `password`), bỏ qua các giá trị `x-openclaw-scopes` hẹp hơn được bearer khai báo và khôi phục các mặc định operator đầy đủ thông thường
- với các chế độ HTTP mang danh tính tin cậy (ví dụ xác thực proxy tin cậy hoặc `gateway.auth.mode="none"`), tôn trọng `x-openclaw-scopes` khi có mặt và nếu không thì quay về tập scope operator mặc định thông thường
- chọn tác tử bằng `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, hoặc `x-openclaw-agent-id`
- dùng `x-openclaw-model` khi bạn muốn ghi đè model backend của tác tử đã chọn
- dùng `x-openclaw-session-key` để định tuyến phiên rõ ràng
- dùng `x-openclaw-message-channel` khi bạn muốn một ngữ cảnh kênh ingress tổng hợp không mặc định

Ma trận xác thực:

- `gateway.auth.mode="token"` hoặc `"password"` + `Authorization: Bearer ...`
  - chứng minh đang sở hữu bí mật operator gateway dùng chung
  - bỏ qua `x-openclaw-scopes` hẹp hơn
  - khôi phục tập scope operator mặc định đầy đủ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - xem các lượt chat trên endpoint này là lượt từ người gửi-chủ sở hữu
- các chế độ HTTP mang danh tính tin cậy (ví dụ xác thực proxy tin cậy, hoặc `gateway.auth.mode="none"` trên ingress riêng tư)
  - tôn trọng `x-openclaw-scopes` khi header có mặt
  - quay về tập scope operator mặc định thông thường khi header vắng mặt
  - chỉ mất ngữ nghĩa chủ sở hữu khi bên gọi thu hẹp scope rõ ràng và bỏ qua `operator.admin`

Bật hoặc tắt endpoint này bằng `gateway.http.endpoints.responses.enabled`.

Bề mặt tương thích tương tự cũng bao gồm:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Để xem phần giải thích chính thức về cách các model nhắm tới tác tử, `openclaw/default`, chuyển tiếp embeddings và ghi đè model backend phối hợp với nhau, hãy xem [OpenAI Chat Completions](/vi/gateway/openai-http-api#agent-first-model-contract) và [Danh sách model và định tuyến tác tử](/vi/gateway/openai-http-api#model-list-and-agent-routing).

## Hành vi phiên

Theo mặc định, endpoint này **không lưu trạng thái theo từng yêu cầu** (một khóa phiên mới được tạo cho mỗi lần gọi).

Nếu yêu cầu bao gồm chuỗi OpenResponses `user`, Gateway sẽ suy ra một khóa phiên ổn định
từ chuỗi đó, để các lần gọi lặp lại có thể dùng chung một phiên tác tử.

## Hình dạng yêu cầu (được hỗ trợ)

Yêu cầu tuân theo API OpenResponses với đầu vào dựa trên item. Hỗ trợ hiện tại:

- `input`: chuỗi hoặc mảng các đối tượng item.
- `instructions`: được hợp nhất vào system prompt.
- `tools`: định nghĩa công cụ phía máy khách (công cụ hàm).
- `tool_choice`: lọc hoặc yêu cầu công cụ phía máy khách.
- `stream`: bật streaming SSE.
- `max_output_tokens`: giới hạn đầu ra theo nỗ lực tối đa (phụ thuộc nhà cung cấp).
- `user`: định tuyến phiên ổn định.

Được chấp nhận nhưng **hiện bị bỏ qua**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Được hỗ trợ:

- `previous_response_id`: OpenClaw tái sử dụng phiên phản hồi trước đó khi yêu cầu vẫn nằm trong cùng phạm vi tác tử/người dùng/phiên được yêu cầu.

## Item (đầu vào)

### `message`

Vai trò: `system`, `developer`, `user`, `assistant`.

- `system` và `developer` được nối thêm vào system prompt.
- Item `user` hoặc `function_call_output` gần nhất trở thành "tin nhắn hiện tại."
- Các tin nhắn user/assistant trước đó được đưa vào làm lịch sử cho ngữ cảnh.

### `function_call_output` (công cụ theo lượt)

Gửi kết quả công cụ trở lại model:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` và `item_reference`

Được chấp nhận để tương thích schema nhưng bị bỏ qua khi xây dựng prompt.

## Công cụ (công cụ hàm phía máy khách)

Cung cấp công cụ bằng `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Nếu tác tử quyết định gọi một công cụ, phản hồi trả về một item đầu ra `function_call`.
Sau đó bạn gửi một yêu cầu tiếp theo với `function_call_output` để tiếp tục lượt.

## Hình ảnh (`input_image`)

Hỗ trợ nguồn base64 hoặc URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Kiểu MIME được phép (hiện tại): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Kích thước tối đa (hiện tại): 10MB.

## Tệp (`input_file`)

Hỗ trợ nguồn base64 hoặc URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Kiểu MIME được phép (hiện tại): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Kích thước tối đa (hiện tại): 5MB.

Hành vi hiện tại:

- Nội dung tệp được giải mã và thêm vào **system prompt**, không phải tin nhắn người dùng,
  nên nó vẫn là tạm thời (không được lưu trong lịch sử phiên).
- Văn bản tệp đã giải mã được bọc dưới dạng **nội dung bên ngoài không tin cậy** trước khi được thêm vào,
  nên byte của tệp được xem là dữ liệu, không phải chỉ dẫn đáng tin cậy.
- Khối được chèn dùng các marker ranh giới rõ ràng như
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` và bao gồm dòng siêu dữ liệu
  `Source: External`.
- Đường dẫn đầu vào tệp này cố ý bỏ qua banner dài `SECURITY NOTICE:` để
  giữ ngân sách prompt; các marker ranh giới và siêu dữ liệu vẫn được giữ nguyên.
- PDF được phân tích văn bản trước. Nếu tìm thấy ít văn bản, các trang đầu tiên được
  raster hóa thành hình ảnh và truyền cho model, và khối tệp được chèn dùng
  placeholder `[PDF content rendered to images]`.

Phân tích PDF do Plugin `document-extract` được đóng gói cung cấp, Plugin này dùng bản dựng legacy
`pdfjs-dist` thân thiện với Node (không worker). Bản dựng PDF.js hiện đại
kỳ vọng worker/trạng thái global DOM của trình duyệt, nên không được dùng trong Gateway.

Mặc định khi fetch URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (tổng số phần `input_file` + `input_image` dựa trên URL trong mỗi yêu cầu)
- Yêu cầu được bảo vệ (phân giải DNS, chặn IP riêng tư, giới hạn chuyển hướng, timeout).
- Hỗ trợ allowlist tên máy chủ tùy chọn theo từng loại đầu vào (`files.urlAllowlist`, `images.urlAllowlist`).
  - Máy chủ chính xác: `"cdn.example.com"`
  - Tên miền phụ wildcard: `"*.assets.example.com"` (không khớp apex)
  - Allowlist trống hoặc bị bỏ qua nghĩa là không có hạn chế allowlist tên máy chủ.
- Để tắt hoàn toàn fetch dựa trên URL, đặt `files.allowUrl: false` và/hoặc `images.allowUrl: false`.

## Giới hạn tệp + hình ảnh (cấu hình)

Có thể tinh chỉnh mặc định dưới `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Mặc định khi bỏ qua:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Nguồn HEIC/HEIF `input_image` được chấp nhận và chuẩn hóa thành JPEG trước khi chuyển giao cho nhà cung cấp.

Ghi chú bảo mật:

- Allowlist URL được thực thi trước khi fetch và trên các bước chuyển hướng.
- Việc allowlist một tên máy chủ không bỏ qua chặn IP riêng tư/nội bộ.
- Với các gateway phơi ra internet, hãy áp dụng kiểm soát egress mạng bên cạnh các lớp bảo vệ ở cấp ứng dụng.
  Xem [Bảo mật](/vi/gateway/security).

## Streaming (SSE)

Đặt `stream: true` để nhận Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện là `event: <type>` và `data: <json>`
- Stream kết thúc bằng `data: [DONE]`

Các loại sự kiện hiện được phát ra:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (khi lỗi)

## Mức sử dụng

`usage` được điền khi nhà cung cấp bên dưới báo cáo số lượng token.
OpenClaw chuẩn hóa các alias phổ biến theo kiểu OpenAI trước khi các bộ đếm đó đi tới
các bề mặt trạng thái/phiên ở hạ lưu, bao gồm `input_tokens` / `output_tokens`
và `prompt_tokens` / `completion_tokens`.

## Lỗi

Lỗi dùng một đối tượng JSON như:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Các trường hợp phổ biến:

- `401` thiếu/xác thực không hợp lệ
- `400` thân yêu cầu không hợp lệ
- `405` phương thức sai

## Ví dụ

Không streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Streaming:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Liên quan

- [OpenAI chat completions](/vi/gateway/openai-http-api)
- [OpenAI](/vi/providers/openai)
