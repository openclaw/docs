---
read_when:
    - Tích hợp các công cụ yêu cầu OpenAI Chat Completions
summary: Cung cấp điểm cuối HTTP /v1/chat/completions tương thích với OpenAI từ Gateway
title: Hoàn tất trò chuyện của OpenAI
x-i18n:
    generated_at: "2026-05-12T15:43:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway của OpenClaw có thể phục vụ một endpoint Chat Completions nhỏ tương thích với OpenAI.

Endpoint này **bị tắt theo mặc định**. Hãy bật trong cấu hình trước.

- `POST /v1/chat/completions`
- Cùng cổng với Gateway (ghép kênh WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Khi bề mặt HTTP tương thích với OpenAI của Gateway được bật, nó cũng phục vụ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Bên dưới, các yêu cầu được thực thi như một lượt chạy tác nhân Gateway thông thường (cùng đường mã như `openclaw agent`), vì vậy định tuyến/quyền/cấu hình khớp với Gateway của bạn.

## Xác thực

Sử dụng cấu hình xác thực của Gateway.

Các đường dẫn xác thực HTTP phổ biến:

- xác thực bằng bí mật dùng chung (`gateway.auth.mode="token"` hoặc `"password"`):
  `Authorization: Bearer <token-or-password>`
- xác thực HTTP mang danh tính tin cậy (`gateway.auth.mode="trusted-proxy"`):
  định tuyến qua proxy nhận biết danh tính đã cấu hình và để proxy đó chèn các
  header danh tính bắt buộc
- xác thực mở cho private-ingress (`gateway.auth.mode="none"`):
  không cần header xác thực

Ghi chú:

- Khi `gateway.auth.mode="token"`, hãy dùng `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
- Khi `gateway.auth.mode="password"`, hãy dùng `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
- Khi `gateway.auth.mode="trusted-proxy"`, yêu cầu HTTP phải đến từ một
  nguồn proxy tin cậy đã cấu hình; proxy loopback cùng máy chủ yêu cầu đặt rõ
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Nếu `gateway.auth.rateLimit` được cấu hình và xảy ra quá nhiều lỗi xác thực, endpoint trả về `429` kèm `Retry-After`.

## Ranh giới bảo mật (quan trọng)

Hãy xem endpoint này là một bề mặt có **toàn quyền truy cập của operator** cho phiên bản gateway.

- Xác thực bearer HTTP ở đây không phải là mô hình phạm vi hẹp theo từng người dùng.
- Token/mật khẩu Gateway hợp lệ cho endpoint này nên được xem như thông tin xác thực của chủ sở hữu/operator.
- Các yêu cầu chạy qua cùng đường tác nhân control-plane như các hành động operator tin cậy.
- Không có ranh giới công cụ riêng cho non-owner/theo từng người dùng trên endpoint này; một khi caller vượt qua xác thực Gateway tại đây, OpenClaw coi caller đó là operator tin cậy cho gateway này.
- Với các chế độ xác thực bằng bí mật dùng chung (`token` và `password`), endpoint khôi phục các mặc định operator đầy đủ thông thường ngay cả khi caller gửi header `x-openclaw-scopes` hẹp hơn.
- Các chế độ HTTP mang danh tính tin cậy (ví dụ xác thực proxy tin cậy hoặc `gateway.auth.mode="none"`) tôn trọng `x-openclaw-scopes` khi có mặt và nếu không thì quay về tập phạm vi mặc định operator thông thường.
- Nếu chính sách của tác nhân mục tiêu cho phép công cụ nhạy cảm, endpoint này có thể sử dụng chúng.
- Chỉ giữ endpoint này trên loopback/tailnet/private ingress; không phơi trực tiếp ra Internet công cộng.

Ma trận xác thực:

- `gateway.auth.mode="token"` hoặc `"password"` + `Authorization: Bearer ...`
  - chứng minh việc sở hữu bí mật operator gateway dùng chung
  - bỏ qua `x-openclaw-scopes` hẹp hơn
  - khôi phục tập phạm vi operator mặc định đầy đủ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - coi các lượt chat trên endpoint này là lượt gửi của chủ sở hữu
- các chế độ HTTP mang danh tính tin cậy (ví dụ xác thực proxy tin cậy, hoặc `gateway.auth.mode="none"` trên private ingress)
  - xác thực một danh tính tin cậy bên ngoài hoặc ranh giới triển khai nào đó
  - tôn trọng `x-openclaw-scopes` khi header này có mặt
  - quay về tập phạm vi mặc định operator thông thường khi header vắng mặt
  - chỉ mất ngữ nghĩa chủ sở hữu khi caller thu hẹp phạm vi một cách rõ ràng và bỏ qua `operator.admin`

Xem [Bảo mật](/vi/gateway/security) và [Truy cập từ xa](/vi/gateway/remote).

## Hợp đồng mô hình ưu tiên tác nhân

OpenClaw coi trường `model` của OpenAI là **mục tiêu tác nhân**, không phải id mô hình nhà cung cấp thô.

- `model: "openclaw"` định tuyến đến tác nhân mặc định đã cấu hình.
- `model: "openclaw/default"` cũng định tuyến đến tác nhân mặc định đã cấu hình.
- `model: "openclaw/<agentId>"` định tuyến đến một tác nhân cụ thể.

Header yêu cầu tùy chọn:

- `x-openclaw-model: <provider/model-or-bare-id>` ghi đè mô hình backend cho tác nhân đã chọn.
- `x-openclaw-agent-id: <agentId>` vẫn được hỗ trợ như một ghi đè tương thích.
- `x-openclaw-session-key: <sessionKey>` kiểm soát hoàn toàn việc định tuyến phiên.
- `x-openclaw-message-channel: <channel>` đặt ngữ cảnh kênh ingress tổng hợp cho prompt và chính sách nhận biết kênh.

Các bí danh tương thích vẫn được chấp nhận:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Bật endpoint

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

## Tắt endpoint

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

Theo mặc định, endpoint này **không trạng thái theo từng yêu cầu** (mỗi lần gọi tạo một khóa phiên mới).

Nếu yêu cầu bao gồm chuỗi `user` của OpenAI, Gateway suy ra một khóa phiên ổn định từ đó, để các lần gọi lặp lại có thể chia sẻ một phiên tác nhân.

## Vì sao bề mặt này quan trọng

Đây là tập tương thích có đòn bẩy cao nhất cho frontend và công cụ tự lưu trữ:

- Hầu hết các thiết lập Open WebUI, LobeChat và LibreChat mong đợi `/v1/models`.
- Nhiều hệ thống RAG mong đợi `/v1/embeddings`.
- Các client chat OpenAI hiện có thường có thể bắt đầu với `/v1/chat/completions`.
- Ngày càng nhiều client thiên về tác nhân hơn ưu tiên `/v1/responses`.

## Danh sách mô hình và định tuyến tác nhân

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Một danh sách mục tiêu tác nhân OpenClaw.

    Các id được trả về là `openclaw`, `openclaw/default` và các mục `openclaw/<agentId>`.
    Hãy dùng chúng trực tiếp làm giá trị `model` của OpenAI.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Endpoint này liệt kê các mục tiêu tác nhân cấp cao nhất, không phải mô hình nhà cung cấp backend và không phải tác nhân con.

    Tác nhân con vẫn là cấu trúc thực thi nội bộ. Chúng không xuất hiện dưới dạng mô hình giả.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` là bí danh ổn định cho tác nhân mặc định đã cấu hình.

    Điều đó nghĩa là client có thể tiếp tục dùng một id dự đoán được ngay cả khi id tác nhân mặc định thật thay đổi giữa các môi trường.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Dùng `x-openclaw-model`.

    Ví dụ:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Nếu bạn bỏ qua nó, tác nhân đã chọn chạy với lựa chọn mô hình được cấu hình thông thường của nó.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` dùng cùng các id `model` mục tiêu tác nhân.

    Dùng `model: "openclaw/default"` hoặc `model: "openclaw/<agentId>"`.
    Khi cần một mô hình embedding cụ thể, hãy gửi nó trong `x-openclaw-model`.
    Nếu không có header đó, yêu cầu được chuyển tiếp đến thiết lập embedding thông thường của tác nhân đã chọn.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Đặt `stream: true` để nhận Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện là `data: <json>`
- Luồng kết thúc bằng `data: [DONE]`

## Hợp đồng công cụ chat

`/v1/chat/completions` hỗ trợ một tập con công cụ hàm tương thích với các client OpenAI Chat phổ biến.

### Các trường yêu cầu được hỗ trợ

- `tools`: mảng gồm `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- các lượt tiếp theo `messages[*].role: "tool"`
- `messages[*].tool_call_id` để gắn kết quả công cụ trở lại lời gọi công cụ trước đó
- `max_completion_tokens`: số; giới hạn theo từng lần gọi cho tổng số token hoàn tất (bao gồm token suy luận). Tên trường OpenAI Chat Completions hiện tại; được ưu tiên khi cả `max_completion_tokens` và `max_tokens` đều được gửi.
- `max_tokens`: số; bí danh cũ được chấp nhận để tương thích ngược. Bị bỏ qua khi `max_completion_tokens` cũng có mặt.

Khi một trong hai trường được đặt, giá trị được chuyển tiếp đến nhà cung cấp upstream qua kênh stream-param của tác nhân. Tên trường wire thực tế gửi đến nhà cung cấp upstream do transport của nhà cung cấp chọn: `max_completion_tokens` cho các endpoint họ OpenAI, và `max_tokens` cho các nhà cung cấp chỉ chấp nhận tên cũ (chẳng hạn như Mistral và Chutes).

### Các biến thể không được hỗ trợ

Endpoint trả về `400 invalid_request_error` cho các biến thể công cụ không được hỗ trợ, bao gồm:

- `tools` không phải mảng
- mục công cụ không phải hàm
- thiếu `tool.function.name`
- các biến thể `tool_choice` như `allowed_tools` và `custom`
- `tool_choice: "required"` (chưa được cưỡng chế tại runtime; sẽ được hỗ trợ sau khi triển khai cưỡng chế cứng)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (cùng lý do như `required`)
- các giá trị `tool_choice.function.name` không khớp với `tools` đã cung cấp

### Dạng phản hồi công cụ không streaming

Khi tác nhân quyết định gọi công cụ, phản hồi dùng:

- `choices[0].finish_reason = "tool_calls"`
- các mục `choices[0].message.tool_calls[]` với:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (chuỗi JSON)

Bình luận của assistant trước lời gọi công cụ được trả về trong `choices[0].message.content` (có thể trống).

### Dạng phản hồi công cụ streaming

Khi `stream: true`, các lời gọi công cụ được phát ra dưới dạng các chunk SSE tăng dần:

- delta vai trò assistant ban đầu
- các delta bình luận assistant tùy chọn
- một hoặc nhiều chunk `delta.tool_calls` mang danh tính công cụ và các mảnh đối số
- chunk cuối với `finish_reason: "tool_calls"`
- `data: [DONE]`

Nếu `stream_options.include_usage=true`, một chunk usage ở cuối được phát ra trước `[DONE]`.

### Vòng lặp tiếp nối công cụ

Sau khi nhận `tool_calls`, client nên thực thi các hàm được yêu cầu và gửi một yêu cầu tiếp nối bao gồm:

- thông điệp lời gọi công cụ của assistant trước đó
- một hoặc nhiều thông điệp `role: "tool"` với `tool_call_id` khớp

Điều này cho phép lượt chạy tác nhân gateway tiếp tục cùng vòng lặp suy luận và tạo câu trả lời assistant cuối cùng.

## Thiết lập nhanh Open WebUI

Cho kết nối Open WebUI cơ bản:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL Docker trên macOS: `http://host.docker.internal:18789/v1`
- Khóa API: token bearer Gateway của bạn
- Mô hình: `openclaw/default`

Hành vi kỳ vọng:

- `GET /v1/models` nên liệt kê `openclaw/default`
- Open WebUI nên dùng `openclaw/default` làm id mô hình chat
- Nếu bạn muốn một nhà cung cấp/mô hình backend cụ thể cho tác nhân đó, hãy đặt mô hình mặc định thông thường của tác nhân hoặc gửi `x-openclaw-model`

Kiểm tra nhanh:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Nếu lệnh đó trả về `openclaw/default`, hầu hết các thiết lập Open WebUI có thể kết nối với cùng Base URL và token.

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

Ghi chú:

- `/v1/models` trả về các đích agent OpenClaw, không phải danh mục nhà cung cấp thô.
- `openclaw/default` luôn hiện diện để một id ổn định hoạt động trên nhiều môi trường.
- Ghi đè nhà cung cấp/mô hình backend thuộc về `x-openclaw-model`, không phải trường `model` của OpenAI.
- `/v1/embeddings` hỗ trợ `input` dưới dạng một chuỗi hoặc mảng chuỗi.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [OpenAI](/vi/providers/openai)
