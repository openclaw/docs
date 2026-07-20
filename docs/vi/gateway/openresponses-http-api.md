---
read_when:
    - Tích hợp các máy khách sử dụng API OpenResponses
    - Bạn muốn đầu vào dựa trên mục, lệnh gọi công cụ phía máy khách hoặc sự kiện SSE
summary: Cung cấp endpoint HTTP `/v1/responses` tương thích với OpenResponses từ Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-07-20T04:42:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5bfd6ca3bf0cecd761fde865b41a95cff3fc5681f74f31b3adae5cd2e0b0be95
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway có thể cung cấp endpoint `POST /v1/responses` tương thích với OpenResponses. Endpoint này **bị tắt theo mặc định** và dùng chung cổng với Gateway (ghép kênh WS + HTTP): `http://<gateway-host>:<port>/v1/responses`.

Các yêu cầu chạy như một lượt chạy tác nhân Gateway thông thường (cùng đường dẫn mã với `openclaw agent`), vì vậy việc định tuyến, quyền và cấu hình khớp với Gateway của bạn.

Bật hoặc tắt bằng `gateway.http.endpoints.responses.enabled`. Khi được bật, cùng bề mặt tương thích này cũng cung cấp `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` và `POST /v1/chat/completions`.

## Xác thực, bảo mật và định tuyến

Hành vi vận hành khớp với [OpenAI Chat Completions](/vi/gateway/openai-http-api):

- Đường dẫn xác thực khớp với `gateway.auth.mode`: chế độ bí mật dùng chung (`token`/`password`) sử dụng `Authorization: Bearer <token-or-password>`; proxy đáng tin cậy sử dụng các tiêu đề proxy nhận biết danh tính (proxy loopback trên cùng máy chủ cần `gateway.auth.trustedProxy.allowLoopback = true`, với phương án dự phòng trực tiếp trên cùng máy chủ qua `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` khi không có tiêu đề `Forwarded`/`X-Forwarded-*`/`X-Real-IP`); `none` trên điểm truy cập riêng tư không cần tiêu đề xác thực. Xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth).
- Hãy coi endpoint này là quyền truy cập đầy đủ của người vận hành vào phiên bản Gateway.
- Các chế độ xác thực bằng bí mật dùng chung bỏ qua `x-openclaw-scopes` có phạm vi hẹp hơn được khai báo trong bearer và khôi phục toàn bộ tập phạm vi mặc định của người vận hành: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Các lượt trò chuyện trên endpoint này được xử lý như lượt từ người gửi là chủ sở hữu.
- Các chế độ HTTP đáng tin cậy mang thông tin danh tính (proxy đáng tin cậy hoặc `gateway.auth.mode="none"`) tuân theo `x-openclaw-scopes` khi có, nếu không sẽ dùng tập phạm vi mặc định của người vận hành. Ngữ nghĩa chủ sở hữu chỉ bị mất khi bên gọi thu hẹp phạm vi một cách rõ ràng và bỏ qua `operator.admin`.
- Chọn tác nhân bằng `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` hoặc tiêu đề `x-openclaw-agent-id`.
- Dùng `x-openclaw-model` để ghi đè mô hình backend của tác nhân đã chọn (yêu cầu `operator.admin` trên các đường dẫn xác thực mang thông tin danh tính).
- Dùng `x-openclaw-session-key` để định tuyến phiên một cách rõ ràng (bị từ chối bằng `400 invalid_request_error` nếu sử dụng không gian tên dành riêng: `subagent:`, `cron:`, `acp:`).
- Dùng `x-openclaw-message-channel` cho ngữ cảnh kênh truy cập tổng hợp không mặc định.

Để xem giải thích chuẩn về các mô hình đích của tác nhân, `openclaw/default`, việc chuyển tiếp embedding và ghi đè mô hình backend, hãy xem [OpenAI Chat Completions](/vi/gateway/openai-http-api#agent-first-model-contract).

Xem [Phạm vi của người vận hành](/vi/gateway/operator-scopes) và [Bảo mật](/vi/gateway/security).

## Hành vi phiên

Theo mặc định, endpoint **không lưu trạng thái theo từng yêu cầu** (mỗi lần gọi tạo một khóa phiên mới).

Nếu yêu cầu chứa chuỗi OpenResponses `user`, Gateway sẽ suy ra một khóa phiên ổn định từ chuỗi đó để các lần gọi lặp lại có thể dùng chung một phiên tác nhân.

`previous_response_id` tái sử dụng phiên của phản hồi trước đó khi yêu cầu vẫn nằm trong cùng phạm vi tác nhân/người dùng/phiên được yêu cầu (được đối chiếu theo chủ thể xác thực, ID tác nhân và `x-openclaw-session-key`).

## Cấu trúc yêu cầu

| Trường                                                            | Hỗ trợ                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | Chuỗi hoặc mảng đối tượng mục.                                                                                               |
| `instructions`                                                   | Được hợp nhất vào lời nhắc hệ thống.                                                                                                 |
| `tools`                                                          | Định nghĩa công cụ phía máy khách (công cụ hàm).                                                                                      |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` hoặc `{ "type": "function", "name": "..." }` để lọc hoặc yêu cầu công cụ phía máy khách.                |
| `stream`                                                         | Bật truyền phát SSE.                                                                                                         |
| `max_output_tokens`                                              | Giới hạn đầu ra theo khả năng tốt nhất (phụ thuộc vào nhà cung cấp).                                                                                 |
| `temperature`                                                    | Nhiệt độ lấy mẫu theo khả năng tốt nhất. Bị backend Codex Responses dựa trên ChatGPT bỏ qua vì backend này sử dụng cơ chế lấy mẫu cố định phía máy chủ. |
| `top_p`                                                          | Lấy mẫu nucleus theo khả năng tốt nhất. Áp dụng cùng lưu ý về Codex Responses như với `temperature`.                                                    |
| `user`                                                           | Định tuyến phiên ổn định.                                                                                                        |
| `previous_response_id`                                           | Tính liên tục của phiên (xem ở trên).                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Được chấp nhận nhưng hiện bị bỏ qua.                                                                                                |

## Các mục (đầu vào)

### `message`

Vai trò: `system`, `developer`, `user`, `assistant`.

- `system` và `developer` được nối thêm vào lời nhắc hệ thống.
- Mục `user` hoặc `function_call_output` gần nhất trở thành "thông điệp hiện tại".
- Các thông điệp người dùng/trợ lý trước đó được đưa vào làm lịch sử để cung cấp ngữ cảnh.

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

Được chấp nhận để tương thích với lược đồ nhưng bị bỏ qua khi tạo lời nhắc.

## Công cụ (công cụ hàm phía máy khách)

Cung cấp công cụ bằng `tools: [{ type: "function", name, description?, parameters? }]`.

Nếu tác nhân gọi một công cụ, phản hồi sẽ trả về một mục đầu ra `function_call`. Gửi yêu cầu tiếp theo với `function_call_output` để tiếp tục lượt.

Đối với `tool_choice: "required"` và `tool_choice` được ghim vào hàm, endpoint thu hẹp tập công cụ hàm phía máy khách được cung cấp, chỉ thị runtime gọi một công cụ phía máy khách trước khi phản hồi và từ chối lượt nếu lượt đó không chứa lệnh gọi công cụ phía máy khách có cấu trúc phù hợp, theo hợp đồng `/v1/chat/completions`. Các yêu cầu không truyền phát trả về `502` cùng với `api_error`; các yêu cầu truyền phát phát ra sự kiện `response.failed`.

## Hình ảnh (`input_image`)

Hỗ trợ nguồn base64 hoặc URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Các loại MIME được phép (mặc định): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Kích thước tối đa (mặc định): 10MB.

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

Các loại MIME được phép (mặc định): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Kích thước tối đa (mặc định): 5MB.

Hành vi hiện tại:

- Nội dung tệp được giải mã và thêm vào **lời nhắc hệ thống**, không phải thông điệp người dùng, vì vậy nội dung này chỉ tồn tại tạm thời (không được lưu trong lịch sử phiên).
- Văn bản tệp đã giải mã được bao bọc dưới dạng **nội dung bên ngoài không đáng tin cậy** trước khi được thêm vào, vì vậy các byte của tệp được xử lý như dữ liệu, không phải chỉ thị đáng tin cậy. Khối được chèn sử dụng các dấu phân cách ranh giới rõ ràng (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) và một dòng siêu dữ liệu `Source: External`. Khối này chủ ý bỏ qua biểu ngữ `SECURITY NOTICE:` dài để tiết kiệm ngân sách lời nhắc; các dấu phân cách ranh giới và siêu dữ liệu vẫn được áp dụng.
- PDF được phân tích để trích xuất văn bản trước. Nếu tìm thấy ít văn bản, các trang đầu tiên được raster hóa thành hình ảnh và chuyển đến mô hình, đồng thời khối tệp được chèn sử dụng phần giữ chỗ `[PDF content rendered to images]`.

Việc phân tích PDF do Plugin `document-extract` đi kèm cung cấp; Plugin này sử dụng `clawpdf` và runtime WebAssembly PDFium được đóng gói cùng để trích xuất văn bản và kết xuất trang.

Giá trị mặc định khi tìm nạp URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (tổng số phần `input_file` + `input_image` dựa trên URL trong mỗi yêu cầu)
- Các yêu cầu được bảo vệ (phân giải DNS, chặn IP riêng tư, giới hạn chuyển hướng, thời gian chờ).
- Hỗ trợ danh sách cho phép tên máy chủ tùy chọn cho từng loại đầu vào (`files.urlAllowlist`, `images.urlAllowlist`): máy chủ chính xác (`"cdn.example.com"`) hoặc miền con ký tự đại diện (`"*.assets.example.com"`, không khớp với miền gốc). Danh sách cho phép trống hoặc bị bỏ qua có nghĩa là không có hạn chế theo danh sách cho phép tên máy chủ.
- Để tắt hoàn toàn việc tìm nạp dựa trên URL, hãy đặt `files.allowUrl: false` và/hoặc `images.allowUrl: false`.

## Giới hạn tệp và hình ảnh

Endpoint sử dụng giới hạn tích hợp 20 MB cho phần thân yêu cầu. Chính sách nguồn tệp và hình ảnh
vẫn có thể cấu hình trong `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
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
            maxChars: 60000,
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

Giá trị mặc định khi bị bỏ qua:

| Khóa                      | Mặc định   |
| ------------------------ | --------- |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5MB       |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10s       |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4,000,000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10MB      |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10s       |

Các nguồn HEIC/HEIF `input_image` được chuẩn hóa thành JPEG trước khi chuyển đến nhà cung cấp thông qua trình xử lý hình ảnh dùng chung của OpenClaw (Rastermill); trình xử lý này sẽ dùng trình chuyển đổi hệ thống (`sips`, ImageMagick, GraphicsMagick hoặc ffmpeg) làm phương án dự phòng cho các định dạng cần hỗ trợ codec bên ngoài.

Lưu ý bảo mật: danh sách URL cho phép được thực thi trước khi tìm nạp và tại mỗi bước chuyển hướng. Việc cho phép một tên máy chủ không vô hiệu hóa cơ chế chặn địa chỉ IP riêng/nội bộ. Đối với các Gateway tiếp xúc với Internet, hãy áp dụng biện pháp kiểm soát lưu lượng mạng đi ra bên cạnh các biện pháp bảo vệ ở cấp ứng dụng. Xem [Bảo mật](/vi/gateway/security).

## Truyền phát (SSE)

Đặt `stream: true` để nhận Server-Sent Events:

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện là `event: <type>` và `data: <json>`
- Luồng kết thúc bằng `data: [DONE]`

Các loại sự kiện hiện được phát: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (khi xảy ra lỗi).

## Mức sử dụng

`usage` được điền khi nhà cung cấp bên dưới báo cáo số lượng token. OpenClaw chuẩn hóa các bí danh phổ biến theo kiểu OpenAI trước khi các bộ đếm này được chuyển đến các bề mặt trạng thái/phiên ở hạ nguồn, bao gồm `input_tokens` / `output_tokens` và `prompt_tokens` / `completion_tokens`.

## Lỗi

Lỗi sử dụng một đối tượng JSON như sau:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Các trường hợp phổ biến: `400` nội dung yêu cầu không hợp lệ, `401` thiếu/xác thực không hợp lệ, `403` thiếu phạm vi operator, `405` sai phương thức, `429` có quá nhiều lần xác thực thất bại (kèm `Retry-After`).

## Ví dụ

Không truyền phát:

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

Truyền phát:

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

- [Hoàn tất cuộc trò chuyện OpenAI](/vi/gateway/openai-http-api)
- [Phạm vi operator](/vi/gateway/operator-scopes)
- [OpenAI](/vi/providers/openai)
