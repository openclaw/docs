---
read_when:
    - Tích hợp các máy khách giao tiếp bằng OpenResponses API
    - Bạn muốn đầu vào dựa trên mục, lệnh gọi công cụ phía máy khách hoặc sự kiện SSE
summary: Cung cấp một điểm cuối HTTP /v1/responses tương thích với OpenResponses từ Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-29T22:45:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway của OpenClaw có thể phục vụ endpoint `POST /v1/responses` tương thích với OpenResponses.

Endpoint này **bị tắt theo mặc định**. Trước tiên hãy bật trong cấu hình.

- `POST /v1/responses`
- Cùng cổng với Gateway (ghép kênh WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Bên dưới, các yêu cầu được thực thi như một lần chạy tác nhân Gateway thông thường (cùng codepath với
`openclaw agent`), nên định tuyến/quyền/cấu hình khớp với Gateway của bạn.

## Xác thực, bảo mật và định tuyến

Hành vi vận hành khớp với [OpenAI Chat Completions](/vi/gateway/openai-http-api):

- dùng đường dẫn xác thực HTTP Gateway tương ứng:
  - xác thực shared-secret (`gateway.auth.mode="token"` hoặc `"password"`): `Authorization: Bearer <token-or-password>`
  - xác thực trusted-proxy (`gateway.auth.mode="trusted-proxy"`): các header proxy có nhận biết danh tính từ một nguồn proxy tin cậy đã cấu hình; proxy local loopback cùng máy chủ yêu cầu bật rõ ràng `gateway.auth.trustedProxy.allowLoopback = true`
  - xác thực mở private-ingress (`gateway.auth.mode="none"`): không có header xác thực
- xem endpoint này như quyền truy cập đầy đủ của người vận hành cho phiên bản gateway
- với các chế độ xác thực shared-secret (`token` và `password`), bỏ qua các giá trị `x-openclaw-scopes` hẹp hơn được bearer khai báo và khôi phục các mặc định người vận hành đầy đủ thông thường
- với các chế độ HTTP mang danh tính tin cậy (ví dụ xác thực trusted proxy hoặc `gateway.auth.mode="none"`), tôn trọng `x-openclaw-scopes` khi có mặt và nếu không thì quay về tập phạm vi mặc định người vận hành thông thường
- chọn tác nhân bằng `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, hoặc `x-openclaw-agent-id`
- dùng `x-openclaw-model` khi bạn muốn ghi đè mô hình backend của tác nhân đã chọn
- dùng `x-openclaw-session-key` để định tuyến phiên rõ ràng
- dùng `x-openclaw-message-channel` khi bạn muốn một ngữ cảnh kênh ingress tổng hợp không mặc định

Ma trận xác thực:

- `gateway.auth.mode="token"` hoặc `"password"` + `Authorization: Bearer ...`
  - chứng minh quyền sở hữu bí mật người vận hành gateway dùng chung
  - bỏ qua `x-openclaw-scopes` hẹp hơn
  - khôi phục tập phạm vi người vận hành mặc định đầy đủ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - xem các lượt chat trên endpoint này là các lượt owner-sender
- các chế độ HTTP mang danh tính tin cậy (ví dụ xác thực trusted proxy, hoặc `gateway.auth.mode="none"` trên private ingress)
  - tôn trọng `x-openclaw-scopes` khi header có mặt
  - quay về tập phạm vi mặc định người vận hành thông thường khi header vắng mặt
  - chỉ mất ngữ nghĩa owner khi caller thu hẹp phạm vi rõ ràng và bỏ qua `operator.admin`

Bật hoặc tắt endpoint này bằng `gateway.http.endpoints.responses.enabled`.

Bề mặt tương thích này cũng bao gồm:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Để xem phần giải thích chuẩn về cách các mô hình nhắm tới tác nhân, `openclaw/default`, truyền qua embeddings, và ghi đè mô hình backend khớp với nhau, xem [OpenAI Chat Completions](/vi/gateway/openai-http-api#agent-first-model-contract) và [Danh sách mô hình và định tuyến tác nhân](/vi/gateway/openai-http-api#model-list-and-agent-routing).

## Hành vi phiên

Theo mặc định endpoint này **không trạng thái theo từng yêu cầu** (mỗi lần gọi tạo một khóa phiên mới).

Nếu yêu cầu bao gồm một chuỗi OpenResponses `user`, Gateway dẫn xuất một khóa phiên ổn định
từ chuỗi đó, để các lần gọi lặp lại có thể dùng chung một phiên tác nhân.

## Hình dạng yêu cầu (được hỗ trợ)

Yêu cầu tuân theo API OpenResponses với input dựa trên item. Hỗ trợ hiện tại:

- `input`: chuỗi hoặc mảng các đối tượng item.
- `instructions`: được hợp nhất vào system prompt.
- `tools`: định nghĩa công cụ phía client (function tools).
- `tool_choice`: lọc hoặc yêu cầu công cụ phía client.
- `stream`: bật streaming SSE.
- `max_output_tokens`: giới hạn đầu ra theo nỗ lực tốt nhất (phụ thuộc provider).
- `user`: định tuyến phiên ổn định.

Được chấp nhận nhưng **hiện bị bỏ qua**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Được hỗ trợ:

- `previous_response_id`: OpenClaw tái sử dụng phiên phản hồi trước đó khi yêu cầu vẫn nằm trong cùng phạm vi tác nhân/người dùng/phiên được yêu cầu.

## Item (input)

### `message`

Vai trò: `system`, `developer`, `user`, `assistant`.

- `system` và `developer` được nối vào system prompt.
- Item `user` hoặc `function_call_output` gần nhất trở thành “thông điệp hiện tại.”
- Các thông điệp user/assistant trước đó được đưa vào làm lịch sử cho ngữ cảnh.

### `function_call_output` (công cụ theo lượt)

Gửi kết quả công cụ trở lại mô hình:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` và `item_reference`

Được chấp nhận để tương thích schema nhưng bị bỏ qua khi dựng prompt.

## Công cụ (công cụ function phía client)

Cung cấp công cụ bằng `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Nếu tác nhân quyết định gọi một công cụ, phản hồi trả về một item đầu ra `function_call`.
Sau đó bạn gửi yêu cầu tiếp theo với `function_call_output` để tiếp tục lượt.

## Hình ảnh (`input_image`)

Hỗ trợ nguồn base64 hoặc URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Các loại MIME được phép (hiện tại): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
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

Các loại MIME được phép (hiện tại): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Kích thước tối đa (hiện tại): 5MB.

Hành vi hiện tại:

- Nội dung tệp được giải mã và thêm vào **system prompt**, không phải thông điệp người dùng,
  nên vẫn mang tính tạm thời (không được lưu trong lịch sử phiên).
- Văn bản tệp đã giải mã được bọc dưới dạng **nội dung bên ngoài không đáng tin cậy** trước khi được thêm vào,
  nên byte của tệp được xem là dữ liệu, không phải chỉ dẫn đáng tin cậy.
- Khối được chèn dùng các dấu mốc ranh giới rõ ràng như
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` và bao gồm một dòng siêu dữ liệu
  `Source: External`.
- Đường dẫn input tệp này cố ý bỏ qua banner dài `SECURITY NOTICE:` để
  giữ ngân sách prompt; các dấu mốc ranh giới và siêu dữ liệu vẫn được giữ nguyên.
- PDF được phân tích văn bản trước. Nếu tìm thấy ít văn bản, các trang đầu tiên được
  raster hóa thành hình ảnh và truyền cho mô hình, còn khối tệp được chèn dùng
  placeholder `[PDF content rendered to images]`.

Việc phân tích PDF được cung cấp bởi Plugin `document-extract` đi kèm, sử dụng bản dựng legacy
`pdfjs-dist` thân thiện với Node (không có worker). Bản dựng PDF.js hiện đại
kỳ vọng browser workers/DOM globals, nên không được dùng trong Gateway.

Mặc định fetch URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (tổng số phần `input_file` + `input_image` dựa trên URL mỗi yêu cầu)
- Các yêu cầu được bảo vệ (phân giải DNS, chặn IP riêng tư, giới hạn chuyển hướng, timeout).
- Hỗ trợ allowlist hostname tùy chọn theo từng loại input (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host chính xác: `"cdn.example.com"`
  - Subdomain wildcard: `"*.assets.example.com"` (không khớp apex)
  - Allowlist trống hoặc bị bỏ qua nghĩa là không có hạn chế allowlist hostname.
- Để tắt hoàn toàn fetch dựa trên URL, đặt `files.allowUrl: false` và/hoặc `images.allowUrl: false`.

## Giới hạn tệp + hình ảnh (cấu hình)

Có thể tinh chỉnh mặc định trong `gateway.http.endpoints.responses`:

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

Mặc định khi bị bỏ qua:

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
- Nguồn HEIC/HEIF `input_image` được chấp nhận và chuẩn hóa sang JPEG trước khi chuyển tới provider.

Ghi chú bảo mật:

- Allowlist URL được thực thi trước khi fetch và trên các bước chuyển hướng.
- Việc allowlist một hostname không bỏ qua cơ chế chặn IP riêng tư/nội bộ.
- Với các gateway phơi ra internet, áp dụng kiểm soát egress mạng bên cạnh các cơ chế bảo vệ cấp ứng dụng.
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

`usage` được điền khi provider bên dưới báo cáo số lượng token.
OpenClaw chuẩn hóa các bí danh kiểu OpenAI phổ biến trước khi các bộ đếm đó tới
các bề mặt trạng thái/phiên downstream, bao gồm `input_tokens` / `output_tokens`
và `prompt_tokens` / `completion_tokens`.

## Lỗi

Lỗi dùng một đối tượng JSON như:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Các trường hợp thường gặp:

- `401` thiếu/xác thực không hợp lệ
- `400` thân yêu cầu không hợp lệ
- `405` sai phương thức

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
