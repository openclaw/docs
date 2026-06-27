---
read_when:
    - Tích hợp các client sử dụng API OpenResponses
    - Bạn muốn đầu vào dựa trên mục, lệnh gọi công cụ phía máy khách, hoặc sự kiện SSE
summary: Cung cấp điểm cuối HTTP /v1/responses tương thích với OpenResponses từ Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-06-27T17:31:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway của OpenClaw có thể phục vụ điểm cuối `POST /v1/responses` tương thích với OpenResponses.

Điểm cuối này **bị tắt theo mặc định**. Hãy bật trong cấu hình trước.

- `POST /v1/responses`
- Cùng cổng với Gateway (ghép kênh WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Bên dưới, các yêu cầu được thực thi như một lượt chạy agent Gateway bình thường (cùng codepath với
`openclaw agent`), nên định tuyến/quyền/cấu hình khớp với Gateway của bạn.

## Xác thực, bảo mật và định tuyến

Hành vi vận hành khớp với [OpenAI Chat Completions](/vi/gateway/openai-http-api):

- dùng đường dẫn xác thực HTTP Gateway tương ứng:
  - xác thực shared-secret (`gateway.auth.mode="token"` hoặc `"password"`): `Authorization: Bearer <token-or-password>`
  - xác thực trusted-proxy (`gateway.auth.mode="trusted-proxy"`): các header proxy nhận biết danh tính từ một nguồn trusted proxy đã cấu hình; proxy loopback cùng máy chủ yêu cầu đặt rõ `gateway.auth.trustedProxy.allowLoopback = true`
  - fallback trực tiếp cục bộ trusted-proxy: caller cùng máy chủ không có header `Forwarded`, `X-Forwarded-*`, hoặc `X-Real-IP` có thể dùng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  - xác thực mở private-ingress (`gateway.auth.mode="none"`): không có header xác thực
- xem điểm cuối này như quyền truy cập operator đầy đủ cho phiên bản gateway
- với các chế độ xác thực shared-secret (`token` và `password`), bỏ qua các giá trị `x-openclaw-scopes` hẹp hơn do bearer khai báo và khôi phục các mặc định operator đầy đủ bình thường
- với các chế độ HTTP mang danh tính tin cậy (ví dụ xác thực trusted proxy hoặc `gateway.auth.mode="none"`), tôn trọng `x-openclaw-scopes` khi có và nếu không thì fallback về tập scope operator mặc định bình thường
- chọn agent bằng `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, hoặc `x-openclaw-agent-id`
- dùng `x-openclaw-model` khi bạn muốn ghi đè model backend của agent đã chọn
- dùng `x-openclaw-session-key` để định tuyến phiên rõ ràng
- dùng `x-openclaw-message-channel` khi bạn muốn một ngữ cảnh kênh ingress tổng hợp không mặc định

Ma trận xác thực:

- `gateway.auth.mode="token"` hoặc `"password"` + `Authorization: Bearer ...`
  - chứng minh quyền sở hữu bí mật operator gateway dùng chung
  - bỏ qua `x-openclaw-scopes` hẹp hơn
  - khôi phục tập scope operator mặc định đầy đủ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - xem các lượt chat trên điểm cuối này là các lượt có người gửi là chủ sở hữu
- các chế độ HTTP mang danh tính tin cậy (ví dụ xác thực trusted proxy, hoặc `gateway.auth.mode="none"` trên private ingress)
  - tôn trọng `x-openclaw-scopes` khi header có mặt
  - fallback về tập scope operator mặc định bình thường khi header vắng mặt
  - chỉ mất ngữ nghĩa chủ sở hữu khi caller thu hẹp scope rõ ràng và bỏ qua `operator.admin`

Bật hoặc tắt điểm cuối này bằng `gateway.http.endpoints.responses.enabled`.

Bề mặt tương thích tương tự cũng bao gồm:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Để xem giải thích chuẩn tắc về cách các model nhắm tới agent, `openclaw/default`, pass-through embeddings và ghi đè model backend phối hợp với nhau, hãy xem [OpenAI Chat Completions](/vi/gateway/openai-http-api#agent-first-model-contract) và [Danh sách model và định tuyến agent](/vi/gateway/openai-http-api#model-list-and-agent-routing).

## Hành vi phiên

Theo mặc định, điểm cuối này **không giữ trạng thái theo từng yêu cầu** (một khóa phiên mới được tạo trong mỗi lần gọi).

Nếu yêu cầu bao gồm chuỗi OpenResponses `user`, Gateway suy ra một khóa phiên ổn định
từ chuỗi đó, để các lần gọi lặp lại có thể chia sẻ một phiên agent.

## Hình dạng yêu cầu (được hỗ trợ)

Yêu cầu tuân theo OpenResponses API với đầu vào dựa trên item. Hỗ trợ hiện tại:

- `input`: chuỗi hoặc mảng các object item.
- `instructions`: được hợp nhất vào system prompt.
- `tools`: định nghĩa tool client (function tools).
- `tool_choice`: `"auto"`, `"none"`, `"required"`, hoặc `{ "type": "function", "name": "..." }` để lọc hoặc yêu cầu tool client.
- `stream`: bật SSE streaming.
- `max_output_tokens`: giới hạn đầu ra theo nỗ lực tối đa (phụ thuộc provider).
- `temperature`: nhiệt độ sampling theo nỗ lực tối đa được chuyển tiếp tới provider. Bị backend Codex Responses dựa trên ChatGPT bỏ qua vì backend này dùng sampling cố định phía server.
- `top_p`: nucleus sampling theo nỗ lực tối đa được chuyển tiếp tới provider. Có cùng lưu ý Codex Responses như `temperature`.
- `user`: định tuyến phiên ổn định.

Được chấp nhận nhưng **hiện bị bỏ qua**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Được hỗ trợ:

- `previous_response_id`: OpenClaw tái sử dụng phiên response trước đó khi yêu cầu vẫn nằm trong cùng phạm vi agent/user/requested-session.

## Item (input)

### `message`

Vai trò: `system`, `developer`, `user`, `assistant`.

- `system` và `developer` được nối thêm vào system prompt.
- Item `user` hoặc `function_call_output` gần nhất trở thành "thông điệp hiện tại."
- Các thông điệp user/assistant trước đó được đưa vào làm lịch sử cho ngữ cảnh.

### `function_call_output` (tool theo lượt)

Gửi kết quả tool trở lại model:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` và `item_reference`

Được chấp nhận để tương thích schema nhưng bị bỏ qua khi xây dựng prompt.

## Tool (function tool phía client)

Cung cấp tool bằng `tools: [{ type: "function", name, description?, parameters? }]`.

Nếu agent quyết định gọi tool, response trả về một item đầu ra `function_call`.
Sau đó bạn gửi một yêu cầu tiếp theo với `function_call_output` để tiếp tục lượt.

Với `tool_choice: "required"` và `tool_choice` ghim function, điểm cuối thu hẹp tập function-tool client được phơi bày, chỉ dẫn runtime gọi một tool client trước khi phản hồi, và từ chối lượt nếu lượt đó không bao gồm một lệnh gọi client-tool có cấu trúc khớp. Hợp đồng này áp dụng cho danh sách HTTP `tools` do caller cung cấp, không phải mọi tool agent nội bộ của OpenClaw. Yêu cầu không streaming trả về `502` với `api_error`; yêu cầu streaming phát sự kiện `response.failed`. Điều này khớp với hợp đồng `/v1/chat/completions`.

## Hình ảnh (`input_image`)

Hỗ trợ nguồn base64 hoặc URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Loại MIME được phép (hiện tại): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
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

Loại MIME được phép (hiện tại): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Kích thước tối đa (hiện tại): 5MB.

Hành vi hiện tại:

- Nội dung tệp được giải mã và thêm vào **system prompt**, không phải thông điệp user,
  nên nội dung này vẫn là tạm thời (không được lưu trong lịch sử phiên).
- Văn bản tệp đã giải mã được bọc dưới dạng **nội dung bên ngoài không tin cậy** trước khi được thêm vào,
  nên byte tệp được xử lý như dữ liệu, không phải chỉ dẫn đáng tin cậy.
- Khối được chèn dùng các marker ranh giới rõ ràng như
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` và bao gồm một dòng metadata
  `Source: External`.
- Đường dẫn đầu vào tệp này chủ ý bỏ qua banner dài `SECURITY NOTICE:` để
  giữ ngân sách prompt; các marker ranh giới và metadata vẫn được giữ nguyên.
- PDF được phân tích văn bản trước. Nếu tìm thấy ít văn bản, các trang đầu tiên được
  rasterize thành hình ảnh và chuyển cho model, còn khối tệp được chèn dùng
  placeholder `[PDF content rendered to images]`.

Phân tích PDF được cung cấp bởi Plugin `document-extract` đi kèm, dùng
`clawpdf` và runtime PDFium WebAssembly đóng gói của nó để trích xuất văn bản và
render trang.

Mặc định fetch URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (tổng số phần `input_file` + `input_image` dựa trên URL cho mỗi yêu cầu)
- Yêu cầu được bảo vệ (phân giải DNS, chặn IP riêng, giới hạn redirect, timeout).
- Hỗ trợ allowlist hostname tùy chọn cho từng loại đầu vào (`files.urlAllowlist`, `images.urlAllowlist`).
  - Host chính xác: `"cdn.example.com"`
  - Subdomain wildcard: `"*.assets.example.com"` (không khớp apex)
  - Allowlist rỗng hoặc bị bỏ qua nghĩa là không có hạn chế allowlist hostname.
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
- Nguồn HEIC/HEIF `input_image` được chấp nhận khi có bộ chuyển đổi hệ thống và được chuẩn hóa thành JPEG trước khi chuyển tới provider. Các bộ chuyển đổi được hỗ trợ là `sips` trên macOS, ImageMagick, GraphicsMagick, hoặc ffmpeg.

Ghi chú bảo mật:

- Allowlist URL được thực thi trước khi fetch và trên các hop redirect.
- Việc allowlist một hostname không bỏ qua chặn IP riêng/nội bộ.
- Với gateway phơi ra internet, hãy áp dụng kiểm soát egress mạng bên cạnh các guard cấp ứng dụng.
  Xem [Bảo mật](/vi/gateway/security).

## Streaming (SSE)

Đặt `stream: true` để nhận Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện là `event: <type>` và `data: <json>`
- Stream kết thúc bằng `data: [DONE]`

Các loại sự kiện hiện được phát:

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

## Sử dụng

`usage` được điền khi provider bên dưới báo cáo số lượng token.
OpenClaw chuẩn hóa các alias kiểu OpenAI phổ biến trước khi các bộ đếm đó tới
các bề mặt trạng thái/phiên downstream, bao gồm `input_tokens` / `output_tokens`
và `prompt_tokens` / `completion_tokens`.

## Lỗi

Lỗi dùng một object JSON như:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Các trường hợp phổ biến:

- `401` thiếu/xác thực không hợp lệ
- `400` body yêu cầu không hợp lệ
- `405` sai method

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

- [Hoàn tất trò chuyện OpenAI](/vi/gateway/openai-http-api)
- [OpenAI](/vi/providers/openai)
