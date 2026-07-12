---
read_when:
    - Tích hợp các công cụ yêu cầu OpenAI Chat Completions
summary: Cung cấp điểm cuối HTTP `/v1/chat/completions` tương thích với OpenAI từ Gateway
title: Hoàn tất trò chuyện OpenAI
x-i18n:
    generated_at: "2026-07-12T07:56:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway có thể cung cấp một bề mặt Chat Completions nhỏ tương thích với OpenAI. Tính năng này **bị tắt theo mặc định**.

Sau khi được bật, Gateway cung cấp tất cả các endpoint sau trên cùng cổng với Gateway (ghép kênh WS + HTTP):

| Phương thức | Đường dẫn              |
| ----------- | ---------------------- |
| POST        | `/v1/chat/completions` |
| GET         | `/v1/models`           |
| GET         | `/v1/models/{id}`      |
| POST        | `/v1/embeddings`       |
| POST        | `/v1/responses`        |

Các yêu cầu chạy như một lượt chạy agent Gateway thông thường (cùng đường dẫn mã với `openclaw agent`), vì vậy cơ chế định tuyến, quyền và cấu hình khớp với Gateway của bạn.

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

Đặt `enabled: false` (hoặc bỏ qua thuộc tính này) để tắt.

## Ranh giới bảo mật (quan trọng)

Hãy coi endpoint này là quyền **truy cập đầy đủ của người vận hành** đối với phiên bản Gateway:

- Token/mật khẩu Gateway hợp lệ cho endpoint này tương đương với thông tin xác thực của chủ sở hữu/người vận hành, không phải phạm vi hẹp dành riêng cho từng người dùng.
- Các yêu cầu chạy qua cùng đường dẫn agent của mặt phẳng điều khiển như các thao tác của người vận hành đáng tin cậy, vì vậy nếu chính sách của agent đích cho phép các công cụ nhạy cảm, endpoint này có thể sử dụng chúng.
- Chỉ duy trì endpoint này trên local loopback/tailnet/điểm vào riêng tư. Không để endpoint tiếp xúc với Internet công cộng.

Ma trận xác thực:

| Đường dẫn xác thực                                                                                   | Hành vi                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gateway.auth.mode="token"` hoặc `"password"` + `Authorization: Bearer ...`                          | Chứng minh quyền sở hữu bí mật dùng chung của Gateway. Bỏ qua mọi header `x-openclaw-scopes` và khôi phục tập phạm vi mặc định đầy đủ của người vận hành: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Xử lý các lượt trò chuyện như lượt của người gửi là chủ sở hữu. |
| HTTP đáng tin cậy có mang danh tính (xác thực trusted-proxy hoặc `gateway.auth.mode="none"` trên điểm vào riêng tư) | Tuân theo `x-openclaw-scopes` khi có; nếu không có, dùng tập phạm vi mặc định của người vận hành. Chỉ mất ngữ nghĩa chủ sở hữu khi bên gọi chủ động thu hẹp phạm vi và bỏ qua `operator.admin`. Yêu cầu `operator.admin` cho các quyền điều khiển cấp chủ sở hữu như `x-openclaw-model`.                                                      |

Xem [Phạm vi của người vận hành](/vi/gateway/operator-scopes), [Bảo mật](/vi/gateway/security) và [Truy cập từ xa](/vi/gateway/remote).

## Xác thực

Sử dụng cấu hình xác thực của Gateway (xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth) để biết chi tiết về chế độ đó):

| Chế độ                              | Cách xác thực                                                                                                                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. Thiết lập qua `gateway.auth.token` hoặc `OPENCLAW_GATEWAY_TOKEN`.                                                                                                        |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. Thiết lập qua `gateway.auth.password` hoặc `OPENCLAW_GATEWAY_PASSWORD`.                                                                                               |
| `gateway.auth.mode="trusted-proxy"` | Định tuyến qua proxy nhận biết danh tính đã cấu hình; proxy này chèn các header danh tính bắt buộc. Proxy local loopback trên cùng máy chủ cần đặt rõ `gateway.auth.trustedProxy.allowLoopback = true`. |
| `gateway.auth.mode="none"`          | Không yêu cầu header xác thực (chỉ dành cho điểm vào riêng tư).                                                                                                                                           |

Lưu ý:

- Bên gọi trên cùng máy chủ bỏ qua proxy của Gateway `trusted-proxy` có thể trực tiếp dùng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` làm phương án dự phòng. Mọi bằng chứng từ header `Forwarded`, `X-Forwarded-*` hoặc `X-Real-IP` sẽ khiến yêu cầu tiếp tục đi theo đường dẫn trusted-proxy.
- Nếu `gateway.auth.rateLimit` được cấu hình và có quá nhiều lần xác thực thất bại, endpoint trả về `429` cùng header `Retry-After`.

## Khi nào nên sử dụng endpoint này

- Ưu tiên endpoint này thay vì thêm một kênh tích hợp mới khi phần tích hợp của bạn chỉ là một bề mặt người vận hành/máy khách khác cho cùng Gateway.
- Với máy khách di động gốc kết nối trực tiếp đến Gateway từ xa, hãy ưu tiên [WebChat](/vi/web/webchat) hoặc [Giao thức Gateway](/vi/gateway/protocol) với quy trình khởi tạo thiết bị đã ghép nối/token thiết bị, để thiết bị không cần token/mật khẩu HTTP dùng chung.
- Thay vào đó, hãy xây dựng Plugin kênh khi tích hợp một mạng nhắn tin bên ngoài có người dùng, phòng, cơ chế phân phối Webhook hoặc phương thức truyền gửi đi riêng. Xem [Xây dựng Plugin](/vi/plugins/building-plugins).

## Hợp đồng mô hình ưu tiên agent

OpenClaw coi trường `model` của OpenAI là một **đích agent**, không phải mã định danh mô hình thô của nhà cung cấp.

| Giá trị `model`                              | Định tuyến đến                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw`                                   | Agent mặc định đã cấu hình                                                                                                                   |
| `openclaw/default`                           | Agent mặc định đã cấu hình (bí danh ổn định; có thể mã hóa cứng an toàn ngay cả khi mã định danh agent mặc định thực tế thay đổi giữa các môi trường) |
| `openclaw/<agentId>` hoặc `openclaw:<agentId>` | Agent cụ thể                                                                                                                               |
| `agent:<agentId>`                            | Agent cụ thể (bí danh tương thích)                                                                                                           |

Các header yêu cầu tùy chọn:

| Header                                          | Tác dụng                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | Ghi đè mô hình backend cho agent đã chọn. Bên gọi sử dụng bearer bí mật dùng chung có thể dùng trực tiếp header này; bên gọi có mang danh tính (trusted-proxy hoặc điểm vào riêng tư không xác thực có `x-openclaw-scopes`) cần `operator.admin`, nếu không sẽ nhận `403 missing scope: operator.admin`. |
| `x-openclaw-agent-id: <agentId>`                | Ghi đè tương thích cho việc chọn agent.                                                                                                                                                                                                                                                                                      |
| `x-openclaw-session-key: <sessionKey>`          | Định tuyến phiên rõ ràng. Bị từ chối với `400 invalid_request_error` nếu sử dụng không gian tên nội bộ dành riêng (`subagent:`, `cron:`, `acp:`).                                                                                                              |
| `x-openclaw-message-channel: <channel>`         | Thiết lập ngữ cảnh kênh điểm vào tổng hợp cho các prompt/chính sách nhận biết kênh.                                                                                                                                                                                                                                         |

`/v1/models` liệt kê các đích agent cấp cao nhất (`openclaw`, `openclaw/default`, `openclaw/<agentId>`), không phải các mô hình backend của nhà cung cấp hay agent con; agent con vẫn là cấu trúc liên kết thực thi nội bộ. Nếu bạn bỏ qua `x-openclaw-model`, agent đã chọn sẽ chạy với mô hình được cấu hình thông thường của nó.

`/v1/embeddings` sử dụng cùng các mã định danh `model` của đích agent. Gửi `x-openclaw-model` (từ bên gọi sử dụng bí mật dùng chung hoặc bên gọi có mang danh tính với `operator.admin`) để chọn một mô hình nhúng cụ thể; nếu không, yêu cầu sẽ sử dụng thiết lập nhúng thông thường của agent đã chọn.

## Hành vi phiên

Theo mặc định, endpoint **không lưu trạng thái cho từng yêu cầu** (mỗi lần gọi sẽ tạo một khóa phiên mới).

Nếu yêu cầu chứa chuỗi `user` của OpenAI, Gateway sẽ suy ra một khóa phiên ổn định từ chuỗi đó để các lần gọi lặp lại có thể dùng chung một phiên agent. Đối với ứng dụng tùy chỉnh, hãy tái sử dụng cùng một giá trị `user` cho mỗi luồng hội thoại; tránh các mã định danh cấp tài khoản trừ khi bạn muốn nhiều cuộc hội thoại/thiết bị dùng chung một phiên OpenClaw. Chỉ sử dụng `x-openclaw-session-key` khi cần kiểm soát định tuyến rõ ràng trên nhiều máy khách/luồng, với các khóa do ứng dụng sở hữu và không sử dụng các không gian tên dành riêng nêu trên.

## Giới hạn yêu cầu (cấu hình)

Có thể tinh chỉnh các giá trị mặc định trong `gateway.http.endpoints.chatCompletions`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
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

Giá trị mặc định khi bỏ qua:

| Khóa                  | Mặc định                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20MB                                                                                          |
| `maxImageParts`       | 8 (số phần `image_url` tối đa được đọc từ tin nhắn mới nhất của người dùng)                    |
| `maxTotalImageBytes`  | 20MB (tổng số byte đã giải mã cộng dồn trên tất cả các phần `image_url` trong một yêu cầu)     |
| `images.allowUrl`     | `false` (các phần `image_url` lấy từ URL sẽ bị từ chối trừ khi được bật)                       |
| `images.maxBytes`     | 10MB cho mỗi ảnh                                                                              |
| `images.maxRedirects` | 3                                                                                             |
| `images.timeoutMs`    | 10 giây                                                                                       |

Các nguồn `image_url` HEIC/HEIF được chấp nhận và chuẩn hóa thành JPEG trước khi chuyển đến nhà cung cấp thông qua bộ xử lý ảnh dùng chung của OpenClaw (Rastermill); bộ xử lý này dùng trình chuyển đổi hệ thống (`sips`, ImageMagick, GraphicsMagick hoặc ffmpeg) làm phương án dự phòng cho các định dạng cần hỗ trợ codec bên ngoài.

Lưu ý bảo mật: việc đưa một tên máy chủ vào danh sách cho phép không vô hiệu hóa cơ chế chặn địa chỉ IP riêng/nội bộ. Đối với các Gateway tiếp xúc với Internet, hãy áp dụng biện pháp kiểm soát lưu lượng mạng đi ra bên cạnh các cơ chế bảo vệ ở cấp ứng dụng. Xem [Bảo mật](/vi/gateway/security).

## Hợp đồng công cụ trò chuyện

`/v1/chat/completions` hỗ trợ một tập con công cụ hàm tương thích với các ứng dụng trò chuyện OpenAI phổ biến.

### Các trường yêu cầu được hỗ trợ

| Trường                     | Ghi chú                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tools`                    | Mảng gồm các phần tử `{ "type": "function", "function": { ... } }`                                                                                                       |
| `tool_choice`              | `"auto"`, `"none"`, `"required"`, hoặc `{ "type": "function", "function": { "name": "..." } }`                                                                            |
| `messages[*].role: "tool"` | Các lượt tiếp theo                                                                                                                                                       |
| `messages[*].tool_call_id` | Liên kết kết quả công cụ với một lệnh gọi công cụ trước đó                                                                                                               |
| `max_completion_tokens`    | Số; giới hạn tổng số token hoàn thành cho mỗi lệnh gọi (bao gồm token suy luận). Tên trường hiện tại; được sử dụng khi gửi cả trường này và `max_tokens`.                  |
| `max_tokens`               | Số; bí danh cũ, bị bỏ qua khi cũng có `max_completion_tokens`.                                                                                                           |
| `temperature`              | Số từ 0 đến 2; áp dụng theo khả năng tốt nhất và chuyển tiếp đến nhà cung cấp thượng nguồn. Trả về `400 invalid_request_error` nếu nằm ngoài phạm vi.                     |
| `top_p`                    | Số từ 0 đến 1; áp dụng theo khả năng tốt nhất. Trả về `400 invalid_request_error` nếu nằm ngoài phạm vi.                                                                  |
| `frequency_penalty`        | Số từ -2.0 đến 2.0; áp dụng theo khả năng tốt nhất. Trả về `400 invalid_request_error` nếu nằm ngoài phạm vi.                                                             |
| `presence_penalty`         | Số từ -2.0 đến 2.0; áp dụng theo khả năng tốt nhất. Trả về `400 invalid_request_error` nếu nằm ngoài phạm vi.                                                             |
| `seed`                     | Số nguyên; áp dụng theo khả năng tốt nhất. Trả về `400 invalid_request_error` đối với giá trị không phải số nguyên.                                                       |
| `stop`                     | Chuỗi hoặc mảng gồm tối đa 4 chuỗi; áp dụng theo khả năng tốt nhất. Trả về `400 invalid_request_error` nếu có hơn 4 chuỗi dừng hoặc phần tử không phải chuỗi/chuỗi rỗng. |

Tất cả các trường lấy mẫu và giới hạn token đều đi qua cùng một kênh tham số luồng của tác nhân và được chuyển tiếp theo khả năng tốt nhất:

- Giới hạn token: tên trường trên giao thức truyền được chọn theo cơ chế truyền tải của nhà cung cấp: `max_completion_tokens` cho các điểm cuối thuộc họ OpenAI, `max_tokens` cho các nhà cung cấp chỉ chấp nhận tên cũ (Mistral, Chutes).
- `stop` ánh xạ tới trường dừng của cơ chế truyền tải: `stop` cho các phần phụ trợ Chat Completions, `stop_sequences` cho Anthropic. OpenAI Responses API không có tham số dừng, vì vậy `stop` không được áp dụng cho các mô hình dựa trên Responses.
- Phần phụ trợ Codex Responses dựa trên ChatGPT sử dụng cấu hình lấy mẫu cố định ở phía máy chủ và loại bỏ `temperature`/`top_p` (cùng với `max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`) trước khi yêu cầu đến phần phụ trợ đó.

### Các biến thể không được hỗ trợ

Trả về `400 invalid_request_error` đối với:

- `tools` không phải mảng, phần tử công cụ không phải hàm, hoặc thiếu `tool.function.name`
- các biến thể `tool_choice` như `allowed_tools` và `custom`
- các giá trị `tool_choice.function.name` không khớp với công cụ đã cung cấp

Đối với `tool_choice: "required"` và `tool_choice` được ghim vào một hàm, điểm cuối sẽ thu hẹp tập công cụ hàm phía máy khách được cung cấp, yêu cầu môi trường thời gian chạy gọi một công cụ máy khách trước khi phản hồi và trả về lỗi nếu phản hồi của tác nhân không có lệnh gọi công cụ máy khách có cấu trúc tương ứng. Điều này áp dụng cho danh sách HTTP `tools` do bên gọi cung cấp, không phải mọi công cụ nội bộ của tác nhân OpenClaw.

### Cấu trúc phản hồi công cụ không truyền phát

Khi tác nhân gọi công cụ, phản hồi sử dụng:

- `choices[0].finish_reason = "tool_calls"`
- các phần tử `choices[0].message.tool_calls[]` gồm `id`, `type: "function"`, `function.name`, `function.arguments` (chuỗi JSON)
- Nội dung giải thích của trợ lý trước lệnh gọi công cụ trong `choices[0].message.content` (có thể rỗng)

### Cấu trúc phản hồi công cụ truyền phát

Khi `stream: true`, các lệnh gọi công cụ đến dưới dạng những đoạn SSE tăng dần: một delta vai trò trợ lý ban đầu, các delta nội dung giải thích tùy chọn của trợ lý, một hoặc nhiều đoạn `delta.tool_calls` chứa danh tính công cụ và các phần đối số, sau đó là đoạn cuối cùng với `finish_reason: "tool_calls"` và `data: [DONE]`.

Nếu `stream_options.include_usage=true`, một đoạn thông tin sử dụng cuối luồng được phát ra trước `[DONE]`.

### Vòng lặp tiếp nối công cụ

Sau khi nhận được `tool_calls`, hãy thực thi các hàm được yêu cầu và gửi một yêu cầu tiếp theo bao gồm thông báo gọi công cụ trước đó của trợ lý cùng một hoặc nhiều thông báo `role: "tool"` có `tool_call_id` tương ứng. Thao tác này tiếp tục cùng một vòng lặp suy luận của tác nhân để tạo ra câu trả lời cuối cùng.

## Truyền phát (SSE)

Đặt `stream: true` để nhận Sự kiện do máy chủ gửi:

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện có dạng `data: <json>`
- Luồng kết thúc bằng `data: [DONE]`

## Thiết lập nhanh Open WebUI

- URL cơ sở: `http://127.0.0.1:18789/v1`
- URL cơ sở Docker trên macOS: `http://host.docker.internal:18789/v1`
- Khóa API: token bearer của Gateway
- Mô hình: `openclaw/default`

Hành vi dự kiến: `GET /v1/models` liệt kê `openclaw/default` và Open WebUI sử dụng giá trị đó làm mã mô hình trò chuyện. Đối với một nhà cung cấp/mô hình phần phụ trợ cụ thể, hãy đặt mô hình mặc định thông thường của tác nhân hoặc gửi `x-openclaw-model` (bên gọi dùng bí mật dùng chung hoặc bên gọi mang danh tính với `operator.admin`).

Kiểm tra nhanh:

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

Dùng lại cùng giá trị `user` trong các lệnh gọi sau cho cuộc hội thoại đó để tiếp tục cùng một phiên tác nhân.

Không truyền phát:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Truyền phát:

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

Truy xuất một mô hình:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Tạo vector nhúng:

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
- [Phạm vi của người vận hành](/vi/gateway/operator-scopes)
- [OpenAI](/vi/providers/openai)
