---
read_when:
    - Tích hợp các công cụ yêu cầu OpenAI Chat Completions
summary: Cung cấp một điểm cuối HTTP /v1/chat/completions tương thích với OpenAI từ Gateway
title: Hoàn tất trò chuyện của OpenAI
x-i18n:
    generated_at: "2026-05-11T20:29:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway của OpenClaw có thể phục vụ một điểm cuối Chat Completions nhỏ tương thích với OpenAI.

Điểm cuối này **bị tắt theo mặc định**. Trước tiên hãy bật nó trong cấu hình.

- `POST /v1/chat/completions`
- Cùng cổng với Gateway (ghép kênh WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Khi bề mặt HTTP tương thích với OpenAI của Gateway được bật, nó cũng phục vụ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Bên dưới, các yêu cầu được thực thi như một lần chạy agent Gateway bình thường (cùng đường dẫn mã với `openclaw agent`), nên định tuyến/quyền/cấu hình khớp với Gateway của bạn.

## Xác thực

Sử dụng cấu hình xác thực của Gateway.

Các đường dẫn xác thực HTTP phổ biến:

- xác thực shared-secret (`gateway.auth.mode="token"` hoặc `"password"`):
  `Authorization: Bearer <token-or-password>`
- xác thực HTTP mang danh tính đáng tin cậy (`gateway.auth.mode="trusted-proxy"`):
  định tuyến qua proxy nhận biết danh tính đã cấu hình và để proxy đó chèn các
  header danh tính bắt buộc
- xác thực mở qua ngõ vào riêng tư (`gateway.auth.mode="none"`):
  không cần header xác thực

Ghi chú:

- Khi `gateway.auth.mode="token"`, dùng `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
- Khi `gateway.auth.mode="password"`, dùng `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
- Khi `gateway.auth.mode="trusted-proxy"`, yêu cầu HTTP phải đến từ một
  nguồn proxy đáng tin cậy đã cấu hình; proxy loopback cùng máy chủ yêu cầu đặt rõ
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Nếu `gateway.auth.rateLimit` được cấu hình và xảy ra quá nhiều lần xác thực thất bại, điểm cuối trả về `429` kèm `Retry-After`.

## Ranh giới bảo mật (quan trọng)

Hãy xem điểm cuối này là một bề mặt **toàn quyền truy cập operator** cho phiên bản gateway.

- Xác thực bearer HTTP ở đây không phải là mô hình phạm vi hẹp theo từng người dùng.
- Token/mật khẩu Gateway hợp lệ cho điểm cuối này nên được xem như thông tin xác thực owner/operator.
- Các yêu cầu chạy qua cùng đường dẫn agent control-plane như các hành động operator đáng tin cậy.
- Không có ranh giới công cụ riêng cho không phải owner/theo từng người dùng trên điểm cuối này; sau khi caller vượt qua xác thực Gateway ở đây, OpenClaw xem caller đó là operator đáng tin cậy cho gateway này.
- Với các chế độ xác thực shared-secret (`token` và `password`), điểm cuối khôi phục các mặc định toàn quyền operator thông thường ngay cả khi caller gửi header `x-openclaw-scopes` hẹp hơn.
- Các chế độ HTTP mang danh tính đáng tin cậy (ví dụ xác thực trusted proxy hoặc `gateway.auth.mode="none"`) tôn trọng `x-openclaw-scopes` khi có mặt và nếu không thì quay về bộ phạm vi mặc định operator thông thường.
- Nếu chính sách agent đích cho phép các công cụ nhạy cảm, điểm cuối này có thể dùng chúng.
- Chỉ giữ điểm cuối này trên loopback/tailnet/ngõ vào riêng tư; không phơi bày trực tiếp ra internet công cộng.

Ma trận xác thực:

- `gateway.auth.mode="token"` hoặc `"password"` + `Authorization: Bearer ...`
  - chứng minh quyền sở hữu shared gateway operator secret
  - bỏ qua `x-openclaw-scopes` hẹp hơn
  - khôi phục bộ phạm vi operator mặc định đầy đủ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - xem các lượt chat trên điểm cuối này là lượt của owner-sender
- các chế độ HTTP mang danh tính đáng tin cậy (ví dụ xác thực trusted proxy, hoặc `gateway.auth.mode="none"` trên ngõ vào riêng tư)
  - xác thực một danh tính đáng tin cậy bên ngoài hoặc ranh giới triển khai
  - tôn trọng `x-openclaw-scopes` khi header có mặt
  - quay về bộ phạm vi mặc định operator thông thường khi header vắng mặt
  - chỉ mất ngữ nghĩa owner khi caller thu hẹp phạm vi rõ ràng và bỏ qua `operator.admin`

Xem [Bảo mật](/vi/gateway/security) và [Truy cập từ xa](/vi/gateway/remote).

## Hợp đồng mô hình ưu tiên agent

OpenClaw xem trường `model` của OpenAI là một **đích agent**, không phải id mô hình provider thô.

- `model: "openclaw"` định tuyến đến agent mặc định đã cấu hình.
- `model: "openclaw/default"` cũng định tuyến đến agent mặc định đã cấu hình.
- `model: "openclaw/<agentId>"` định tuyến đến một agent cụ thể.

Header yêu cầu tùy chọn:

- `x-openclaw-model: <provider/model-or-bare-id>` ghi đè mô hình backend cho agent đã chọn.
- `x-openclaw-agent-id: <agentId>` vẫn được hỗ trợ như một ghi đè tương thích.
- `x-openclaw-session-key: <sessionKey>` kiểm soát hoàn toàn định tuyến phiên.
- `x-openclaw-message-channel: <channel>` đặt ngữ cảnh kênh ngõ vào tổng hợp cho các prompt và chính sách nhận biết kênh.

Các alias tương thích vẫn được chấp nhận:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Bật điểm cuối

Đặt `gateway.http.endpoints.chatCompletions.enabled` thành `true`:

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

## Tắt điểm cuối

Đặt `gateway.http.endpoints.chatCompletions.enabled` thành `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Hành vi phiên

Theo mặc định, điểm cuối là **không trạng thái theo từng yêu cầu** (một khóa phiên mới được tạo ở mỗi lần gọi).

Nếu yêu cầu bao gồm chuỗi `user` của OpenAI, Gateway sẽ suy ra một khóa phiên ổn định từ chuỗi đó, để các lần gọi lặp lại có thể chia sẻ một phiên agent.

## Vì sao bề mặt này quan trọng

Đây là bộ tương thích có đòn bẩy cao nhất cho các frontend và công cụ tự lưu trữ:

- Hầu hết các thiết lập Open WebUI, LobeChat và LibreChat mong đợi `/v1/models`.
- Nhiều hệ thống RAG mong đợi `/v1/embeddings`.
- Các client chat OpenAI hiện có thường có thể bắt đầu với `/v1/chat/completions`.
- Các client thiên về agent-native hơn ngày càng ưu tiên `/v1/responses`.

## Danh sách mô hình và định tuyến agent

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Một danh sách đích agent OpenClaw.

    Các id được trả về là các mục `openclaw`, `openclaw/default` và `openclaw/<agentId>`.
    Dùng chúng trực tiếp làm giá trị `model` của OpenAI.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Nó liệt kê các đích agent cấp cao nhất, không phải mô hình provider backend và không phải sub-agent.

    Sub-agent vẫn là topo thực thi nội bộ. Chúng không xuất hiện dưới dạng mô hình giả.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` là alias ổn định cho agent mặc định đã cấu hình.

    Điều đó có nghĩa là client có thể tiếp tục dùng một id có thể dự đoán ngay cả khi id agent mặc định thực tế thay đổi giữa các môi trường.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Dùng `x-openclaw-model`.

    Ví dụ:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Nếu bạn bỏ qua nó, agent đã chọn sẽ chạy với lựa chọn mô hình được cấu hình bình thường của nó.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` dùng cùng các id `model` đích agent.

    Dùng `model: "openclaw/default"` hoặc `model: "openclaw/<agentId>"`.
    Khi bạn cần một mô hình embedding cụ thể, hãy gửi nó trong `x-openclaw-model`.
    Nếu không có header đó, yêu cầu sẽ được chuyển tiếp đến thiết lập embedding bình thường của agent đã chọn.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Đặt `stream: true` để nhận Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện là `data: <json>`
- Luồng kết thúc bằng `data: [DONE]`

## Hợp đồng công cụ chat

`/v1/chat/completions` hỗ trợ một tập con function-tool tương thích với các client OpenAI Chat phổ biến.

### Các trường yêu cầu được hỗ trợ

- `tools`: mảng `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- lượt theo dõi `messages[*].role: "tool"`
- `messages[*].tool_call_id` để liên kết kết quả công cụ trở lại một lệnh gọi công cụ trước đó

### Các biến thể không được hỗ trợ

Điểm cuối trả về `400 invalid_request_error` cho các biến thể công cụ không được hỗ trợ, bao gồm:

- `tools` không phải mảng
- mục công cụ không phải function
- thiếu `tool.function.name`
- các biến thể `tool_choice` như `allowed_tools` và `custom`
- `tool_choice: "required"` (chưa được thực thi tại runtime; sẽ được hỗ trợ sau khi thực thi cứng được triển khai)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (cùng lý do như `required`)
- các giá trị `tool_choice.function.name` không khớp với `tools` đã cung cấp

### Hình dạng phản hồi công cụ không streaming

Khi agent quyết định gọi công cụ, phản hồi dùng:

- `choices[0].finish_reason = "tool_calls"`
- các mục `choices[0].message.tool_calls[]` với:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (chuỗi JSON)

Bình luận của assistant trước lệnh gọi công cụ được trả về trong `choices[0].message.content` (có thể rỗng).

### Hình dạng phản hồi công cụ streaming

Khi `stream: true`, các lệnh gọi công cụ được phát ra dưới dạng các đoạn SSE tăng dần:

- delta vai trò assistant ban đầu
- các delta bình luận assistant tùy chọn
- một hoặc nhiều đoạn `delta.tool_calls` mang danh tính công cụ và các mảnh đối số
- đoạn cuối cùng với `finish_reason: "tool_calls"`
- `data: [DONE]`

Nếu `stream_options.include_usage=true`, một đoạn usage ở cuối được phát ra trước `[DONE]`.

### Vòng lặp theo dõi công cụ

Sau khi nhận `tool_calls`, client nên thực thi các function được yêu cầu và gửi một yêu cầu theo dõi bao gồm:

- thông điệp gọi công cụ trước đó của assistant
- một hoặc nhiều thông điệp `role: "tool"` với `tool_call_id` khớp

Điều này cho phép lần chạy agent gateway tiếp tục cùng vòng lặp suy luận và tạo câu trả lời cuối cùng của assistant.

## Thiết lập nhanh Open WebUI

Để kết nối Open WebUI cơ bản:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL Docker trên macOS: `http://host.docker.internal:18789/v1`
- Khóa API: token bearer Gateway của bạn
- Mô hình: `openclaw/default`

Hành vi mong đợi:

- `GET /v1/models` nên liệt kê `openclaw/default`
- Open WebUI nên dùng `openclaw/default` làm id mô hình chat
- Nếu bạn muốn một provider/mô hình backend cụ thể cho agent đó, hãy đặt mô hình mặc định bình thường của agent hoặc gửi `x-openclaw-model`

Kiểm tra nhanh:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Nếu lệnh đó trả về `openclaw/default`, hầu hết các thiết lập Open WebUI có thể kết nối với cùng base URL và token.

## Ví dụ

Không streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

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

Liệt kê mô hình:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Lấy một mô hình:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Tạo embeddings:

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

Ghi chú:

- `/v1/models` trả về các đích agent OpenClaw, không phải catalog provider thô.
- `openclaw/default` luôn có mặt để một id ổn định hoạt động trên nhiều môi trường.
- Các ghi đè provider/mô hình backend nằm trong `x-openclaw-model`, không phải trường `model` của OpenAI.
- `/v1/embeddings` hỗ trợ `input` dưới dạng chuỗi hoặc mảng chuỗi.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [OpenAI](/vi/providers/openai)
