---
read_when:
    - Tích hợp các công cụ yêu cầu OpenAI Chat Completions
summary: Cung cấp endpoint HTTP `/v1/chat/completions` tương thích với OpenAI từ Gateway
title: Các lượt hoàn thành trò chuyện của OpenAI
x-i18n:
    generated_at: "2026-07-20T04:25:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc5a1a56972bb9070da0f8f60d6efd673cc1d1d516b730c55bc9d171fc7a5b3
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway có thể cung cấp một bề mặt Chat Completions nhỏ tương thích với OpenAI. Bề mặt này **bị tắt theo mặc định**.

Sau khi được bật, Gateway cung cấp tất cả các mục sau trên cùng cổng với Gateway (ghép kênh WS + HTTP):

| Phương thức | Đường dẫn                   |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

Các yêu cầu chạy như một lượt chạy agent Gateway thông thường (cùng đường dẫn mã với `openclaw agent`), vì vậy việc định tuyến, quyền và cấu hình khớp với Gateway của bạn.

## Bật endpoint

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

Đặt `enabled: false` (hoặc bỏ qua) để tắt.

## Ranh giới bảo mật (quan trọng)

Hãy coi endpoint này là quyền **truy cập đầy đủ của người vận hành** vào phiên bản gateway:

- Token/mật khẩu Gateway hợp lệ cho endpoint này tương đương với thông tin xác thực của chủ sở hữu/người vận hành, không phải phạm vi hẹp theo từng người dùng.
- Các yêu cầu chạy qua cùng đường dẫn agent của mặt phẳng điều khiển như các hành động đáng tin cậy của người vận hành, vì vậy nếu chính sách của agent đích cho phép các công cụ nhạy cảm, endpoint này có thể sử dụng chúng.
- Chỉ giữ endpoint này trên loopback/tailnet/đầu vào riêng tư. Không để endpoint này lộ ra internet công cộng.

Ma trận xác thực:

| Đường dẫn xác thực                                                                                            | Hành vi                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` hoặc `"password"` + `Authorization: Bearer ...`                            | Chứng minh quyền sở hữu bí mật gateway dùng chung. Bỏ qua mọi header `x-openclaw-scopes` và khôi phục toàn bộ tập phạm vi mặc định của người vận hành: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Xử lý các lượt trò chuyện như lượt của người gửi là chủ sở hữu. |
| HTTP đáng tin cậy có mang danh tính (xác thực trusted-proxy hoặc `gateway.auth.mode="none"` trên đầu vào riêng tư) | Tuân theo `x-openclaw-scopes` khi có; nếu không có, dùng tập phạm vi mặc định của người vận hành. Chỉ mất ngữ nghĩa chủ sở hữu khi bên gọi thu hẹp phạm vi một cách rõ ràng và bỏ qua `operator.admin`. Yêu cầu `operator.admin` cho các điều khiển cấp chủ sở hữu như `x-openclaw-model`.                        |

Xem [Phạm vi của người vận hành](/vi/gateway/operator-scopes), [Bảo mật](/vi/gateway/security) và [Truy cập từ xa](/vi/gateway/remote).

## Xác thực

Sử dụng cấu hình xác thực của Gateway (xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth) để biết chi tiết về chế độ đó):

| Chế độ                                | Cách xác thực                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Đặt qua `gateway.auth.token` hoặc `OPENCLAW_GATEWAY_TOKEN`.                                                                                              |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Đặt qua `gateway.auth.password` hoặc `OPENCLAW_GATEWAY_PASSWORD`.                                                                                     |
| `gateway.auth.mode="trusted-proxy"` | Định tuyến qua proxy nhận biết danh tính đã cấu hình; proxy này chèn các header danh tính bắt buộc. Proxy loopback trên cùng máy chủ cần `gateway.auth.trustedProxy.allowLoopback = true` rõ ràng. |
| `gateway.auth.mode="none"`          | Không yêu cầu header xác thực (chỉ dành cho đầu vào riêng tư).                                                                                                                                         |

Lưu ý:

- Các bên gọi trên cùng máy chủ bỏ qua proxy trên gateway `trusted-proxy` có thể dự phòng trực tiếp sang `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Mọi bằng chứng từ header `Forwarded`, `X-Forwarded-*` hoặc `X-Real-IP` đều giữ yêu cầu trên đường dẫn trusted-proxy.
- Nếu `gateway.auth.rateLimit` được cấu hình và có quá nhiều lần xác thực thất bại, endpoint trả về `429` cùng header `Retry-After`.

## Khi nào nên sử dụng endpoint này

- Ưu tiên endpoint này thay vì thêm một kênh tích hợp sẵn mới khi tích hợp của bạn chỉ là một bề mặt người vận hành/máy khách khác cho cùng gateway.
- Đối với các máy khách di động gốc kết nối trực tiếp tới gateway từ xa, hãy ưu tiên [WebChat](/vi/web/webchat) hoặc [Giao thức Gateway](/vi/gateway/protocol) với luồng khởi tạo thiết bị ghép đôi/token thiết bị, để thiết bị không cần token/mật khẩu HTTP dùng chung.
- Thay vào đó, hãy xây dựng một plugin kênh khi tích hợp mạng nhắn tin bên ngoài có người dùng, phòng, phương thức phân phối webhook hoặc cơ chế truyền gửi đi riêng. Xem [Xây dựng plugin](/vi/plugins/building-plugins).

## Hợp đồng mô hình ưu tiên agent

OpenClaw xử lý trường `model` của OpenAI như một **đích agent**, không phải id mô hình thô của nhà cung cấp.

| Giá trị `model`                                | Định tuyến tới                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                   | Agent mặc định đã cấu hình                                                                                                 |
| `openclaw/default`                           | Agent mặc định đã cấu hình (bí danh ổn định; có thể mã hóa cứng an toàn ngay cả khi id agent mặc định thực tế thay đổi giữa các môi trường) |
| `openclaw/<agentId>` hoặc `openclaw:<agentId>` | Agent cụ thể                                                                                                           |
| `agent:<agentId>`                            | Agent cụ thể (bí danh tương thích)                                                                                     |

Các header yêu cầu tùy chọn:

| Header                                          | Tác dụng                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Ghi đè mô hình backend cho agent đã chọn. Bên gọi bearer dùng bí mật chung có thể sử dụng trực tiếp; bên gọi có mang danh tính (trusted-proxy hoặc đầu vào riêng tư không xác thực với `x-openclaw-scopes`) cần `operator.admin`, nếu không sẽ nhận `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Ghi đè tương thích cho việc chọn agent.                                                                                                                                                                                                                                 |
| `x-openclaw-session-key: <sessionKey>`          | Định tuyến phiên rõ ràng. Bị từ chối với `400 invalid_request_error` nếu sử dụng không gian tên nội bộ được dành riêng (`subagent:`, `cron:`, `acp:`).                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | Đặt ngữ cảnh kênh đầu vào tổng hợp cho prompt/chính sách nhận biết kênh.                                                                                                                                                                                              |

`/v1/models` liệt kê các đích agent cấp cao nhất (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), không phải các mô hình nhà cung cấp backend và cũng không phải các agent con; agent con vẫn là cấu trúc thực thi nội bộ. Nếu bỏ qua `x-openclaw-model`, agent đã chọn sẽ chạy với mô hình được cấu hình thông thường của nó.

`/v1/embeddings` sử dụng cùng các id `model` của đích agent. Gửi `x-openclaw-model` (từ bên gọi dùng bí mật chung hoặc bên gọi có mang danh tính với `operator.admin`) để chọn một mô hình embedding cụ thể; nếu không, yêu cầu sẽ sử dụng thiết lập embedding thông thường của agent đã chọn.

## Hành vi phiên

Theo mặc định, endpoint **không lưu trạng thái cho từng yêu cầu** (mỗi lần gọi tạo một khóa phiên mới).

Nếu yêu cầu chứa chuỗi `user` của OpenAI, Gateway sẽ suy ra một khóa phiên ổn định từ chuỗi đó để các lần gọi lặp lại có thể dùng chung một phiên agent. Đối với ứng dụng tùy chỉnh, hãy sử dụng lại cùng giá trị `user` cho mỗi luồng hội thoại; tránh các mã định danh cấp tài khoản trừ khi bạn muốn nhiều cuộc hội thoại/thiết bị dùng chung một phiên OpenClaw. Chỉ sử dụng `x-openclaw-session-key` khi cần kiểm soát định tuyến rõ ràng trên nhiều máy khách/luồng, với các khóa do ứng dụng sở hữu và tránh các không gian tên dành riêng nêu trên.

## Giới hạn yêu cầu

Endpoint sử dụng các giới hạn tích hợp sẵn gồm 20 MB cho mỗi nội dung yêu cầu, 8 phần `image_url`
từ tin nhắn mới nhất của người dùng và tổng cộng 20 MB dữ liệu hình ảnh đã giải mã.
Chính sách nguồn hình ảnh vẫn có thể được cấu hình trong
`gateway.http.endpoints.chatCompletions.images`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
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

Cài đặt hình ảnh mặc định là:

| Khóa                   | Giá trị mặc định                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `images.allowUrl`     | `false` (các phần `image_url` có nguồn từ URL bị từ chối trừ khi được bật) |
| `images.maxBytes`     | 10MB cho mỗi hình ảnh                                                      |
| `images.maxRedirects` | 3                                                                   |
| `images.timeoutMs`    | 10s                                                                 |

Các nguồn `image_url` HEIC/HEIF được chấp nhận và chuẩn hóa thành JPEG trước khi gửi tới nhà cung cấp thông qua bộ xử lý hình ảnh dùng chung của OpenClaw (Rastermill); bộ xử lý này dự phòng sang trình chuyển đổi hệ thống (`sips`, ImageMagick, GraphicsMagick hoặc ffmpeg) đối với các định dạng cần hỗ trợ codec bên ngoài.

Lưu ý bảo mật: việc đưa tên máy chủ vào danh sách cho phép không bỏ qua cơ chế chặn IP riêng tư/nội bộ. Đối với các gateway tiếp xúc với internet, hãy áp dụng biện pháp kiểm soát lưu lượng mạng đi ra bên cạnh các biện pháp bảo vệ ở cấp ứng dụng. Xem [Bảo mật](/vi/gateway/security).

## Hợp đồng công cụ trò chuyện

`/v1/chat/completions` hỗ trợ một tập con công cụ hàm tương thích với các máy khách OpenAI Chat phổ biến.

### Các trường yêu cầu được hỗ trợ

| Trường                     | Ghi chú                                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | Mảng gồm các `{ "type": "function", "function": { ... } }`                                                                                  |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` hoặc `{ "type": "function", "function": { "name": "..." } }`                                               |
| `messages[*].role: "tool"` | Các lượt tiếp theo                                                                                                                            |
| `messages[*].tool_call_id` | Liên kết kết quả công cụ với một lệnh gọi công cụ trước đó                                                                                    |
| `max_completion_tokens`    | Số; giới hạn tổng số token hoàn thành cho mỗi lệnh gọi (bao gồm token suy luận). Tên trường hiện tại; được dùng khi cả trường này và `max_tokens` đều được gửi. |
| `max_tokens`               | Số; bí danh cũ, bị bỏ qua khi `max_completion_tokens` cũng hiện diện.                                                                         |
| `temperature`              | Số từ 0-2; xử lý theo khả năng tốt nhất, được chuyển tiếp đến nhà cung cấp thượng nguồn. `400 invalid_request_error` nếu nằm ngoài phạm vi.   |
| `top_p`                    | Số từ 0-1; xử lý theo khả năng tốt nhất. `400 invalid_request_error` nếu nằm ngoài phạm vi.                                                   |
| `frequency_penalty`        | Số từ -2.0 đến 2.0; xử lý theo khả năng tốt nhất. `400 invalid_request_error` nếu nằm ngoài phạm vi.                                         |
| `presence_penalty`         | Số từ -2.0 đến 2.0; xử lý theo khả năng tốt nhất. `400 invalid_request_error` nếu nằm ngoài phạm vi.                                         |
| `seed`                     | Số nguyên; xử lý theo khả năng tốt nhất. `400 invalid_request_error` đối với các giá trị không phải số nguyên.                               |
| `stop`                     | Chuỗi hoặc mảng tối đa 4 chuỗi; xử lý theo khả năng tốt nhất. `400 invalid_request_error` nếu có hơn 4 chuỗi hoặc có mục không phải chuỗi/rỗng. |

Tất cả các trường lấy mẫu và giới hạn token đều đi qua cùng một kênh tham số luồng của agent và được chuyển tiếp theo khả năng tốt nhất:

- Giới hạn token: tên trường trên giao thức được lựa chọn theo phương thức truyền tải của nhà cung cấp: `max_completion_tokens` cho các endpoint thuộc họ OpenAI, `max_tokens` cho các nhà cung cấp chỉ chấp nhận tên cũ (Mistral, Chutes).
- `stop` ánh xạ tới trường dừng của phương thức truyền tải: `stop` cho các backend Chat Completions, `stop_sequences` cho Anthropic. API OpenAI Responses không có tham số dừng, vì vậy `stop` không được áp dụng cho các mô hình dùng backend Responses.
- Backend Codex Responses dựa trên ChatGPT sử dụng cơ chế lấy mẫu cố định phía máy chủ và loại bỏ `temperature`/`top_p` (cùng với `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`) trước khi yêu cầu đến backend đó.

### Các biến thể không được hỗ trợ

Trả về `400 invalid_request_error` đối với:

- `tools` không phải mảng, mục công cụ không phải hàm hoặc thiếu `tool.function.name`
- các biến thể `tool_choice` như `allowed_tools` và `custom`
- các giá trị `tool_choice.function.name` không khớp với công cụ được cung cấp

Đối với `tool_choice: "required"` và `tool_choice` được ghim vào hàm, endpoint thu hẹp tập công cụ hàm phía máy khách được công khai, yêu cầu runtime gọi một công cụ máy khách trước khi phản hồi và báo lỗi nếu phản hồi của agent không có lệnh gọi công cụ máy khách có cấu trúc tương ứng. Điều này áp dụng cho danh sách HTTP `tools` do bên gọi cung cấp, không phải mọi công cụ nội bộ của agent OpenClaw.

### Cấu trúc phản hồi công cụ không phát trực tiếp

Khi agent gọi công cụ, phản hồi sử dụng:

- `choices[0].finish_reason = "tool_calls"`
- các mục `choices[0].message.tool_calls[]` với `id`, `type: "function"`, `function.name`, `function.arguments` (chuỗi JSON)
- Phần diễn giải của trợ lý trước lệnh gọi công cụ, trong `choices[0].message.content` (có thể rỗng)

### Cấu trúc phản hồi công cụ phát trực tiếp

Khi `stream: true`, các lệnh gọi công cụ đến dưới dạng các đoạn SSE tăng dần: một delta vai trò trợ lý ban đầu, các delta diễn giải tùy chọn của trợ lý, một hoặc nhiều đoạn `delta.tool_calls` mang định danh công cụ và các phần đối số, sau đó là đoạn cuối cùng với `finish_reason: "tool_calls"` và `data: [DONE]`.

Nếu `stream_options.include_usage=true`, một đoạn thông tin sử dụng ở cuối được phát ra trước `[DONE]`.

### Vòng lặp tiếp nối công cụ

Sau khi nhận `tool_calls`, hãy thực thi (các) hàm được yêu cầu và gửi một yêu cầu tiếp theo bao gồm thông báo gọi công cụ trước đó của trợ lý cùng một hoặc nhiều thông báo `role: "tool"` có `tool_call_id` tương ứng. Thao tác này tiếp tục cùng một vòng lặp suy luận của agent để tạo ra câu trả lời cuối cùng.

## Phát trực tiếp (SSE)

Đặt `stream: true` để nhận Server-Sent Events:

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện là `data: <json>`
- Luồng kết thúc bằng `data: [DONE]`

## Thiết lập nhanh Open WebUI

- URL cơ sở: `http://127.0.0.1:18789/v1`
- URL cơ sở của Docker trên macOS: `http://host.docker.internal:18789/v1`
- Khóa API: bearer token của Gateway
- Mô hình: `openclaw/default`

Hành vi dự kiến: `GET /v1/models` liệt kê `openclaw/default` và Open WebUI sử dụng giá trị đó làm mã định danh mô hình trò chuyện. Đối với một nhà cung cấp/mô hình backend cụ thể, hãy đặt mô hình mặc định thông thường của agent hoặc gửi `x-openclaw-model` (bên gọi dùng bí mật dùng chung hoặc bên gọi mang danh tính có `operator.admin`).

Kiểm thử nhanh:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Nếu lệnh đó trả về `openclaw/default`, hầu hết cấu hình Open WebUI có thể kết nối bằng cùng URL cơ sở và token.

## Ví dụ

Phiên ổn định cho một cuộc hội thoại của ứng dụng:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

Sử dụng lại cùng giá trị `user` trong các lệnh gọi sau cho cuộc hội thoại đó để tiếp tục cùng một phiên agent.

Không phát trực tiếp:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Phát trực tiếp:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Liệt kê các mô hình:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Lấy một mô hình:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Tạo embedding:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

`/v1/embeddings` hỗ trợ `input` dưới dạng chuỗi hoặc mảng chuỗi.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Phạm vi của toán tử](/vi/gateway/operator-scopes)
- [OpenAI](/vi/providers/openai)
