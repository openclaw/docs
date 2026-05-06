---
read_when:
    - Tích hợp các công cụ yêu cầu OpenAI Chat Completions
summary: Cung cấp điểm cuối HTTP /v1/chat/completions tương thích với OpenAI từ Gateway
title: Hoàn tất trò chuyện OpenAI
x-i18n:
    generated_at: "2026-05-06T09:13:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8cd0995cf5f897ae8f99f35fc4b8ea28ebde3cba41da0f3e768ec1de7874b2f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw's Gateway có thể phục vụ một điểm cuối Chat Completions nhỏ tương thích với OpenAI.

Điểm cuối này **bị tắt theo mặc định**. Trước tiên hãy bật nó trong cấu hình.

- `POST /v1/chat/completions`
- Cùng cổng với Gateway (ghép kênh WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Khi bề mặt HTTP tương thích với OpenAI của Gateway được bật, nó cũng phục vụ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Bên dưới, các yêu cầu được thực thi như một lượt chạy tác nhân Gateway thông thường (cùng đường mã với `openclaw agent`), nên định tuyến/quyền/cấu hình khớp với Gateway của bạn.

## Xác thực

Sử dụng cấu hình xác thực của Gateway.

Các đường dẫn xác thực HTTP phổ biến:

- xác thực bằng bí mật dùng chung (`gateway.auth.mode="token"` hoặc `"password"`):
  `Authorization: Bearer <token-or-password>`
- xác thực HTTP có danh tính đáng tin cậy (`gateway.auth.mode="trusted-proxy"`):
  định tuyến qua proxy nhận biết danh tính đã cấu hình và để proxy đó chèn các header danh tính bắt buộc
- xác thực mở qua lối vào riêng tư (`gateway.auth.mode="none"`):
  không cần header xác thực

Ghi chú:

- Khi `gateway.auth.mode="token"`, hãy dùng `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
- Khi `gateway.auth.mode="password"`, hãy dùng `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
- Khi `gateway.auth.mode="trusted-proxy"`, yêu cầu HTTP phải đến từ một nguồn proxy đáng tin cậy đã cấu hình; các proxy loopback cùng máy chủ yêu cầu đặt rõ `gateway.auth.trustedProxy.allowLoopback = true`.
- Nếu `gateway.auth.rateLimit` được cấu hình và xảy ra quá nhiều lỗi xác thực, điểm cuối sẽ trả về `429` kèm `Retry-After`.

## Ranh giới bảo mật (quan trọng)

Hãy xem điểm cuối này là một bề mặt có **quyền truy cập đầy đủ của người vận hành** đối với phiên bản gateway.

- Xác thực bearer HTTP ở đây không phải là mô hình phạm vi hẹp theo từng người dùng.
- Token/mật khẩu Gateway hợp lệ cho điểm cuối này nên được xem như thông tin xác thực của chủ sở hữu/người vận hành.
- Các yêu cầu chạy qua cùng đường tác nhân mặt phẳng điều khiển như các hành động đáng tin cậy của người vận hành.
- Không có ranh giới công cụ riêng cho người không phải chủ sở hữu/theo từng người dùng trên điểm cuối này; khi một bên gọi vượt qua xác thực Gateway ở đây, OpenClaw xem bên gọi đó là người vận hành đáng tin cậy cho gateway này.
- Với các chế độ xác thực bằng bí mật dùng chung (`token` và `password`), điểm cuối khôi phục các mặc định đầy đủ thông thường của người vận hành ngay cả khi bên gọi gửi header `x-openclaw-scopes` hẹp hơn.
- Các chế độ HTTP có danh tính đáng tin cậy (ví dụ xác thực proxy đáng tin cậy hoặc `gateway.auth.mode="none"`) tôn trọng `x-openclaw-scopes` khi có mặt và nếu không thì quay về bộ phạm vi mặc định thông thường của người vận hành.
- Nếu chính sách tác nhân đích cho phép các công cụ nhạy cảm, điểm cuối này có thể sử dụng chúng.
- Chỉ giữ điểm cuối này trên loopback/tailnet/lối vào riêng tư; không phơi bày trực tiếp ra internet công cộng.

Ma trận xác thực:

- `gateway.auth.mode="token"` hoặc `"password"` + `Authorization: Bearer ...`
  - chứng minh quyền sở hữu bí mật dùng chung của người vận hành gateway
  - bỏ qua `x-openclaw-scopes` hẹp hơn
  - khôi phục bộ phạm vi mặc định đầy đủ của người vận hành:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - xem các lượt chat trên điểm cuối này là lượt của người gửi chủ sở hữu
- các chế độ HTTP có danh tính đáng tin cậy (ví dụ xác thực proxy đáng tin cậy, hoặc `gateway.auth.mode="none"` trên lối vào riêng tư)
  - xác thực một danh tính đáng tin cậy bên ngoài hoặc ranh giới triển khai nào đó
  - tôn trọng `x-openclaw-scopes` khi header có mặt
  - quay về bộ phạm vi mặc định thông thường của người vận hành khi header vắng mặt
  - chỉ mất ngữ nghĩa chủ sở hữu khi bên gọi thu hẹp phạm vi một cách rõ ràng và bỏ qua `operator.admin`

Xem [Bảo mật](/vi/gateway/security) và [Truy cập từ xa](/vi/gateway/remote).

## Hợp đồng mô hình ưu tiên tác nhân

OpenClaw xem trường OpenAI `model` là **đích tác nhân**, không phải id mô hình nhà cung cấp thô.

- `model: "openclaw"` định tuyến đến tác nhân mặc định đã cấu hình.
- `model: "openclaw/default"` cũng định tuyến đến tác nhân mặc định đã cấu hình.
- `model: "openclaw/<agentId>"` định tuyến đến một tác nhân cụ thể.

Các header yêu cầu tùy chọn:

- `x-openclaw-model: <provider/model-or-bare-id>` ghi đè mô hình backend cho tác nhân đã chọn.
- `x-openclaw-agent-id: <agentId>` vẫn được hỗ trợ làm ghi đè tương thích.
- `x-openclaw-session-key: <sessionKey>` kiểm soát hoàn toàn định tuyến phiên.
- `x-openclaw-message-channel: <channel>` đặt ngữ cảnh kênh lối vào tổng hợp cho các prompt và chính sách nhận biết kênh.

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

Theo mặc định, điểm cuối này **không lưu trạng thái theo từng yêu cầu** (mỗi lần gọi sẽ tạo một khóa phiên mới).

Nếu yêu cầu bao gồm chuỗi OpenAI `user`, Gateway sẽ dẫn xuất một khóa phiên ổn định từ chuỗi đó, nhờ vậy các lần gọi lặp lại có thể dùng chung một phiên tác nhân.

## Vì sao bề mặt này quan trọng

Đây là bộ tương thích có đòn bẩy cao nhất cho các frontend và công cụ tự lưu trữ:

- Hầu hết các thiết lập Open WebUI, LobeChat và LibreChat mong đợi `/v1/models`.
- Nhiều hệ thống RAG mong đợi `/v1/embeddings`.
- Các client chat OpenAI hiện có thường có thể bắt đầu với `/v1/chat/completions`.
- Các client thiên về tác nhân hơn ngày càng ưu tiên `/v1/responses`.

## Danh sách mô hình và định tuyến tác nhân

<AccordionGroup>
  <Accordion title="`/v1/models` trả về gì?">
    Một danh sách đích tác nhân OpenClaw.

    Các id được trả về là các mục `openclaw`, `openclaw/default` và `openclaw/<agentId>`.
    Hãy dùng chúng trực tiếp làm giá trị OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` liệt kê tác nhân hay tác nhân con?">
    Nó liệt kê các đích tác nhân cấp cao nhất, không phải mô hình nhà cung cấp backend và không phải tác nhân con.

    Các tác nhân con vẫn là cấu trúc thực thi nội bộ. Chúng không xuất hiện dưới dạng mô hình giả.

  </Accordion>
  <Accordion title="Vì sao có `openclaw/default`?">
    `openclaw/default` là alias ổn định cho tác nhân mặc định đã cấu hình.

    Điều đó nghĩa là client có thể tiếp tục dùng một id dự đoán được ngay cả khi id tác nhân mặc định thật thay đổi giữa các môi trường.

  </Accordion>
  <Accordion title="Làm cách nào để ghi đè mô hình backend?">
    Dùng `x-openclaw-model`.

    Ví dụ:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Nếu bạn bỏ qua header này, tác nhân đã chọn sẽ chạy với lựa chọn mô hình được cấu hình thông thường của nó.

  </Accordion>
  <Accordion title="Embeddings khớp với hợp đồng này như thế nào?">
    `/v1/embeddings` dùng cùng các id `model` đích tác nhân.

    Dùng `model: "openclaw/default"` hoặc `model: "openclaw/<agentId>"`.
    Khi bạn cần một mô hình embedding cụ thể, hãy gửi nó trong `x-openclaw-model`.
    Không có header đó, yêu cầu sẽ được chuyển tiếp tới thiết lập embedding thông thường của tác nhân đã chọn.

  </Accordion>
</AccordionGroup>

## Truyền luồng (SSE)

Đặt `stream: true` để nhận Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Mỗi dòng sự kiện là `data: <json>`
- Luồng kết thúc bằng `data: [DONE]`

## Thiết lập nhanh Open WebUI

Để kết nối Open WebUI cơ bản:

- URL cơ sở: `http://127.0.0.1:18789/v1`
- URL cơ sở Docker trên macOS: `http://host.docker.internal:18789/v1`
- Khóa API: token bearer Gateway của bạn
- Mô hình: `openclaw/default`

Hành vi mong đợi:

- `GET /v1/models` nên liệt kê `openclaw/default`
- Open WebUI nên dùng `openclaw/default` làm id mô hình chat
- Nếu bạn muốn một nhà cung cấp/mô hình backend cụ thể cho tác nhân đó, hãy đặt mô hình mặc định thông thường của tác nhân hoặc gửi `x-openclaw-model`

Kiểm tra nhanh:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Nếu lệnh đó trả về `openclaw/default`, hầu hết các thiết lập Open WebUI có thể kết nối bằng cùng URL cơ sở và token.

## Ví dụ

Không truyền luồng:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Truyền luồng:

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

- `/v1/models` trả về các đích tác nhân OpenClaw, không phải catalog nhà cung cấp thô.
- `openclaw/default` luôn hiện diện để một id ổn định có thể hoạt động trên nhiều môi trường.
- Các ghi đè nhà cung cấp/mô hình backend nằm trong `x-openclaw-model`, không phải trường OpenAI `model`.
- `/v1/embeddings` hỗ trợ `input` là một chuỗi hoặc mảng chuỗi.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [OpenAI](/vi/providers/openai)
