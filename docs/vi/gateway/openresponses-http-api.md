---
read_when:
    - Tích hợp các máy khách sử dụng API OpenResponses
    - Bạn muốn dữ liệu đầu vào theo từng mục, lệnh gọi công cụ phía máy khách hoặc các sự kiện SSE
summary: Cung cấp endpoint HTTP `/v1/responses` tương thích với OpenResponses từ Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-07-12T07:55:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway có thể cung cấp endpoint `POST /v1/responses` tương thích với OpenResponses. Endpoint này **bị tắt theo mặc định** và dùng chung cổng với Gateway (ghép kênh WS + HTTP): `http://<gateway-host>:<port>/v1/responses`.

Các yêu cầu chạy như một lượt chạy tác tử Gateway thông thường (cùng đường dẫn mã với `openclaw agent`), nên việc định tuyến, quyền hạn và cấu hình khớp với Gateway của bạn.

Bật hoặc tắt bằng `gateway.http.endpoints.responses.enabled`. Khi được bật, cùng bề mặt tương thích này cũng cung cấp `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` và `POST /v1/chat/completions`.

## Xác thực, bảo mật và định tuyến

Hành vi vận hành khớp với [OpenAI Chat Completions](/vi/gateway/openai-http-api):

- Đường dẫn xác thực khớp với `gateway.auth.mode`: chế độ bí mật dùng chung (`token`/`password`) sử dụng `Authorization: Bearer <token-or-password>`; proxy đáng tin cậy sử dụng các header proxy nhận biết danh tính (proxy local loopback trên cùng máy chủ cần `gateway.auth.trustedProxy.allowLoopback = true`, với phương án dự phòng trực tiếp trên cùng máy chủ qua `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` khi không có header `Forwarded`/`X-Forwarded-*`/`X-Real-IP`); chế độ `none` trên đầu vào riêng tư không cần header xác thực. Xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth).
- Hãy coi endpoint này là quyền truy cập đầy đủ của người vận hành đối với phiên bản Gateway.
- Các chế độ xác thực bằng bí mật dùng chung bỏ qua `x-openclaw-scopes` có phạm vi hẹp hơn do bearer khai báo và khôi phục toàn bộ tập phạm vi mặc định của người vận hành: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Các lượt trò chuyện trên endpoint này được xử lý như lượt do chủ sở hữu gửi.
- Các chế độ HTTP mang danh tính đáng tin cậy (proxy đáng tin cậy hoặc `gateway.auth.mode="none"`) tuân theo `x-openclaw-scopes` khi có; nếu không, chúng dùng tập phạm vi mặc định của người vận hành. Ngữ nghĩa chủ sở hữu chỉ bị mất khi bên gọi thu hẹp phạm vi một cách rõ ràng và bỏ qua `operator.admin`.
- Chọn tác tử bằng `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` hoặc header `x-openclaw-agent-id`.
- Dùng `x-openclaw-model` để ghi đè mô hình backend của tác tử đã chọn (yêu cầu `operator.admin` trên các đường dẫn xác thực mang danh tính).
- Dùng `x-openclaw-session-key` để định tuyến phiên rõ ràng (bị từ chối với `400 invalid_request_error` nếu sử dụng không gian tên dành riêng: `subagent:`, `cron:`, `acp:`).
- Dùng `x-openclaw-message-channel` cho ngữ cảnh kênh đầu vào tổng hợp không mặc định.

Để xem phần giải thích chuẩn về các mô hình đích của tác tử, `openclaw/default`, chuyển tiếp embeddings và ghi đè mô hình backend, hãy xem [OpenAI Chat Completions](/vi/gateway/openai-http-api#agent-first-model-contract).

Xem [Phạm vi của người vận hành](/vi/gateway/operator-scopes) và [Bảo mật](/vi/gateway/security).

## Hành vi phiên

Theo mặc định, endpoint **không lưu trạng thái giữa các yêu cầu** (mỗi lần gọi sẽ tạo một khóa phiên mới).

Nếu yêu cầu bao gồm chuỗi OpenResponses `user`, Gateway sẽ suy ra một khóa phiên ổn định từ chuỗi đó để các lần gọi lặp lại có thể dùng chung một phiên tác tử.

`previous_response_id` sử dụng lại phiên của phản hồi trước đó khi yêu cầu vẫn nằm trong cùng phạm vi tác tử/người dùng/phiên được yêu cầu (được đối chiếu theo chủ thể xác thực, mã định danh tác tử và `x-openclaw-session-key`).

## Cấu trúc yêu cầu

| Trường                                                           | Hỗ trợ                                                                                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`                                                          | Chuỗi hoặc mảng các đối tượng mục.                                                                                                                       |
| `instructions`                                                   | Được hợp nhất vào lời nhắc hệ thống.                                                                                                                     |
| `tools`                                                          | Định nghĩa công cụ của máy khách (công cụ hàm).                                                                                                          |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` hoặc `{ "type": "function", "name": "..." }` để lọc hoặc bắt buộc sử dụng công cụ của máy khách.                       |
| `stream`                                                         | Bật truyền phát SSE.                                                                                                                                     |
| `max_output_tokens`                                              | Giới hạn đầu ra theo khả năng tốt nhất (phụ thuộc nhà cung cấp).                                                                                         |
| `temperature`                                                    | Nhiệt độ lấy mẫu theo khả năng tốt nhất. Bị backend Codex Responses dựa trên ChatGPT bỏ qua vì backend này sử dụng cơ chế lấy mẫu cố định phía máy chủ. |
| `top_p`                                                          | Lấy mẫu hạt nhân theo khả năng tốt nhất. Có cùng lưu ý về Codex Responses như `temperature`.                                                            |
| `user`                                                           | Định tuyến phiên ổn định.                                                                                                                                |
| `previous_response_id`                                           | Tính liên tục của phiên (xem ở trên).                                                                                                                    |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Được chấp nhận nhưng hiện bị bỏ qua.                                                                                                                     |

## Các mục (đầu vào)

### `message`

Vai trò: `system`, `developer`, `user`, `assistant`.

- `system` và `developer` được nối thêm vào lời nhắc hệ thống.
- Mục `user` hoặc `function_call_output` gần nhất trở thành "tin nhắn hiện tại".
- Các tin nhắn người dùng/trợ lý trước đó được đưa vào làm lịch sử để cung cấp ngữ cảnh.

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

Được chấp nhận để tương thích với lược đồ nhưng bị bỏ qua khi xây dựng lời nhắc.

## Công cụ (công cụ hàm phía máy khách)

Cung cấp công cụ bằng `tools: [{ type: "function", name, description?, parameters? }]`.

Nếu tác tử gọi một công cụ, phản hồi sẽ trả về một mục đầu ra `function_call`. Gửi yêu cầu tiếp theo với `function_call_output` để tiếp tục lượt.

Đối với `tool_choice: "required"` và `tool_choice` được ghim vào hàm, endpoint thu hẹp tập công cụ hàm phía máy khách được cung cấp, chỉ thị runtime gọi công cụ máy khách trước khi phản hồi và từ chối lượt nếu lượt đó không bao gồm lệnh gọi công cụ máy khách có cấu trúc phù hợp, theo đúng hợp đồng `/v1/chat/completions`. Yêu cầu không truyền phát trả về `502` với `api_error`; yêu cầu truyền phát phát ra sự kiện `response.failed`.

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

- Nội dung tệp được giải mã và thêm vào **lời nhắc hệ thống**, không phải tin nhắn người dùng, nên nội dung này chỉ tồn tại tạm thời (không được lưu trong lịch sử phiên).
- Văn bản tệp đã giải mã được bọc dưới dạng **nội dung bên ngoài không đáng tin cậy** trước khi được thêm vào, nên các byte của tệp được xử lý như dữ liệu, không phải chỉ thị đáng tin cậy. Khối được chèn sử dụng các dấu mốc ranh giới rõ ràng (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) và dòng siêu dữ liệu `Source: External`. Khối này chủ ý bỏ qua biểu ngữ dài `SECURITY NOTICE:` để tiết kiệm dung lượng lời nhắc; các dấu mốc ranh giới và siêu dữ liệu vẫn được áp dụng.
- PDF được phân tích để trích xuất văn bản trước. Nếu tìm thấy quá ít văn bản, các trang đầu tiên sẽ được raster hóa thành hình ảnh và truyền cho mô hình, đồng thời khối tệp được chèn sử dụng phần giữ chỗ `[PDF content rendered to images]`.

Việc phân tích PDF do Plugin `document-extract` đi kèm cung cấp; Plugin này sử dụng `clawpdf` và runtime PDFium WebAssembly đóng gói của nó để trích xuất văn bản và kết xuất trang.

Giá trị mặc định khi truy xuất URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (tổng số phần `input_file` + `input_image` dựa trên URL trong mỗi yêu cầu)
- Các yêu cầu được bảo vệ (phân giải DNS, chặn địa chỉ IP riêng tư, giới hạn chuyển hướng, thời gian chờ).
- Hỗ trợ danh sách máy chủ cho phép tùy chọn theo từng loại đầu vào (`files.urlAllowlist`, `images.urlAllowlist`): máy chủ chính xác (`"cdn.example.com"`) hoặc tên miền phụ bằng ký tự đại diện (`"*.assets.example.com"`, không khớp với miền gốc). Danh sách cho phép trống hoặc bị bỏ qua có nghĩa là không áp dụng hạn chế theo danh sách máy chủ cho phép.
- Để tắt hoàn toàn việc truy xuất dựa trên URL, hãy đặt `files.allowUrl: false` và/hoặc `images.allowUrl: false`.

## Giới hạn tệp và hình ảnh (cấu hình)

Có thể điều chỉnh các giá trị mặc định trong `gateway.http.endpoints.responses`:

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

| Khóa                     | Mặc định  |
| ------------------------ | --------- |
| `maxBodyBytes`           | 20MB      |
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

Các nguồn `input_image` HEIC/HEIF được chuẩn hóa thành JPEG trước khi chuyển đến nhà cung cấp thông qua bộ xử lý hình ảnh dùng chung của OpenClaw (Rastermill); bộ xử lý này sử dụng dự phòng một trình chuyển đổi hệ thống (`sips`, ImageMagick, GraphicsMagick hoặc ffmpeg) cho các định dạng cần hỗ trợ codec bên ngoài.

Lưu ý bảo mật: danh sách URL cho phép được thực thi trước khi truy xuất và tại từng bước chuyển hướng. Việc đưa tên máy chủ vào danh sách cho phép không bỏ qua cơ chế chặn địa chỉ IP riêng tư/nội bộ. Đối với các Gateway được công khai trên Internet, hãy áp dụng biện pháp kiểm soát lưu lượng mạng đi ra ngoài bên cạnh các cơ chế bảo vệ ở cấp ứng dụng. Xem [Bảo mật](/vi/gateway/security).

## Truyền phát (SSE)

Đặt `stream: true` để nhận các sự kiện do máy chủ gửi:

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện có dạng `event: <type>` và `data: <json>`
- Luồng kết thúc bằng `data: [DONE]`

Các loại sự kiện hiện được phát: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (khi xảy ra lỗi).

## Mức sử dụng

`usage` được điền khi nhà cung cấp nền tảng báo cáo số lượng token. OpenClaw chuẩn hóa các bí danh phổ biến theo kiểu OpenAI trước khi các bộ đếm này được chuyển đến các bề mặt trạng thái/phiên ở hạ nguồn, bao gồm `input_tokens` / `output_tokens` và `prompt_tokens` / `completion_tokens`.

## Lỗi

Lỗi sử dụng một đối tượng JSON như sau:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Các trường hợp thường gặp: `400` nội dung yêu cầu không hợp lệ, `401` thiếu/thông tin xác thực không hợp lệ, `403` thiếu phạm vi người vận hành, `405` phương thức không đúng, `429` có quá nhiều lần xác thực thất bại (kèm `Retry-After`).

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

- [Hoàn tất trò chuyện OpenAI](/vi/gateway/openai-http-api)
- [Phạm vi người vận hành](/vi/gateway/operator-scopes)
- [OpenAI](/vi/providers/openai)
