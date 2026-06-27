---
read_when:
    - Tích hợp các công cụ yêu cầu OpenAI Chat Completions
summary: Cung cấp điểm cuối HTTP /v1/chat/completions tương thích với OpenAI từ Gateway
title: Hoàn tất trò chuyện OpenAI
x-i18n:
    generated_at: "2026-06-27T17:30:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway của OpenClaw có thể phục vụ một điểm cuối Chat Completions nhỏ tương thích với OpenAI.

Điểm cuối này **bị tắt theo mặc định**. Trước tiên hãy bật nó trong cấu hình.

- `POST /v1/chat/completions`
- Cùng cổng với Gateway (ghép kênh WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Khi bề mặt HTTP tương thích OpenAI của Gateway được bật, nó cũng phục vụ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Bên dưới, các yêu cầu được thực thi như một lần chạy tác nhân Gateway bình thường (cùng đường mã với `openclaw agent`), nên định tuyến/quyền/cấu hình khớp với Gateway của bạn.

## Xác thực

Sử dụng cấu hình xác thực của Gateway.

Các đường dẫn xác thực HTTP phổ biến:

- xác thực bằng bí mật dùng chung (`gateway.auth.mode="token"` hoặc `"password"`):
  `Authorization: Bearer <token-or-password>`
- xác thực HTTP mang danh tính đáng tin cậy (`gateway.auth.mode="trusted-proxy"`):
  định tuyến qua proxy nhận biết danh tính đã cấu hình và để nó chèn các
  header danh tính bắt buộc
- xác thực mở qua ingress riêng tư (`gateway.auth.mode="none"`):
  không cần header xác thực

Ghi chú:

- Khi `gateway.auth.mode="token"`, dùng `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`).
- Khi `gateway.auth.mode="password"`, dùng `gateway.auth.password` (hoặc `OPENCLAW_GATEWAY_PASSWORD`).
- Khi `gateway.auth.mode="trusted-proxy"`, yêu cầu HTTP phải đến từ một
  nguồn proxy đáng tin cậy đã cấu hình; proxy loopback cùng máy chủ yêu cầu bật rõ ràng
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Các caller nội bộ cùng máy chủ bỏ qua proxy có thể dùng
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` làm phương án dự phòng
  trực tiếp cục bộ. Bất kỳ bằng chứng header `Forwarded`, `X-Forwarded-*`, hoặc `X-Real-IP` nào
  sẽ giữ yêu cầu trên đường dẫn trusted-proxy thay thế.
- Nếu `gateway.auth.rateLimit` được cấu hình và xảy ra quá nhiều lỗi xác thực, điểm cuối trả về `429` kèm `Retry-After`.

## Ranh giới bảo mật (quan trọng)

Hãy xem điểm cuối này là một bề mặt **truy cập đầy đủ của operator** cho phiên bản gateway.

- Xác thực bearer HTTP ở đây không phải là mô hình phạm vi hẹp theo từng người dùng.
- Token/mật khẩu Gateway hợp lệ cho điểm cuối này nên được xem như thông tin xác thực của chủ sở hữu/operator.
- Các yêu cầu chạy qua cùng đường dẫn tác nhân control-plane như các hành động operator đáng tin cậy.
- Không có ranh giới công cụ riêng cho non-owner/theo từng người dùng trên điểm cuối này; một khi caller vượt qua xác thực Gateway ở đây, OpenClaw xem caller đó là operator đáng tin cậy cho gateway này.
- Với các chế độ xác thực bằng bí mật dùng chung (`token` và `password`), điểm cuối khôi phục các mặc định operator đầy đủ bình thường ngay cả khi caller gửi header `x-openclaw-scopes` hẹp hơn.
- Các chế độ HTTP mang danh tính đáng tin cậy (ví dụ xác thực proxy đáng tin cậy hoặc `gateway.auth.mode="none"`) tôn trọng `x-openclaw-scopes` khi có mặt và nếu không thì quay về tập phạm vi operator mặc định bình thường.
- Nếu chính sách tác nhân đích cho phép các công cụ nhạy cảm, điểm cuối này có thể dùng chúng.
- Chỉ giữ điểm cuối này trên loopback/tailnet/ingress riêng tư; không phơi bày trực tiếp ra internet công cộng.

Ma trận xác thực:

- `gateway.auth.mode="token"` hoặc `"password"` + `Authorization: Bearer ...`
  - chứng minh đang sở hữu bí mật operator gateway dùng chung
  - bỏ qua `x-openclaw-scopes` hẹp hơn
  - khôi phục tập phạm vi operator mặc định đầy đủ:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - xem các lượt chat trên điểm cuối này là lượt do chủ sở hữu gửi
- các chế độ HTTP mang danh tính đáng tin cậy (ví dụ xác thực proxy đáng tin cậy, hoặc `gateway.auth.mode="none"` trên ingress riêng tư)
  - xác thực một danh tính đáng tin cậy bên ngoài hoặc ranh giới triển khai
  - tôn trọng `x-openclaw-scopes` khi header có mặt
  - quay về tập phạm vi operator mặc định bình thường khi header vắng mặt
  - chỉ mất ngữ nghĩa chủ sở hữu khi caller thu hẹp phạm vi một cách rõ ràng và bỏ qua `operator.admin`
  - yêu cầu `operator.admin` cho các điều khiển yêu cầu cấp chủ sở hữu như `x-openclaw-model`

Xem [Bảo mật](/vi/gateway/security) và [Truy cập từ xa](/vi/gateway/remote).

## Khi nào dùng điểm cuối này

Dùng `/v1/chat/completions` khi bạn đang tích hợp công cụ hoặc backend phía ứng dụng đáng tin cậy với một gateway hiện có và có thể giữ an toàn thông tin xác thực operator của gateway.

- Ưu tiên cách này thay vì thêm một kênh tích hợp sẵn mới khi tích hợp của bạn chỉ là một bề mặt operator/client khác cho cùng gateway.
- Với client di động native kết nối trực tiếp tới gateway từ xa, hãy ưu tiên [WebChat](/vi/web/webchat) hoặc [Giao thức Gateway](/vi/gateway/protocol) và triển khai luồng bootstrap thiết bị ghép cặp/device-token để thiết bị không cần token/mật khẩu HTTP dùng chung.
- Thay vào đó hãy xây dựng một Plugin kênh khi bạn đang tích hợp một mạng nhắn tin bên ngoài có người dùng, phòng, phân phối Webhook hoặc transport gửi đi riêng. Xem [Xây dựng plugin](/vi/plugins/building-plugins).

## Hợp đồng mô hình ưu tiên tác nhân

OpenClaw xem trường OpenAI `model` là **đích tác nhân**, không phải id mô hình provider thô.

- `model: "openclaw"` định tuyến tới tác nhân mặc định đã cấu hình.
- `model: "openclaw/default"` cũng định tuyến tới tác nhân mặc định đã cấu hình.
- `model: "openclaw/<agentId>"` định tuyến tới một tác nhân cụ thể.

Các header yêu cầu tùy chọn:

- `x-openclaw-model: <provider/model-or-bare-id>` ghi đè mô hình backend cho tác nhân đã chọn. Caller bearer dùng bí mật dùng chung có thể dùng header này. Caller mang danh tính, chẳng hạn yêu cầu trusted-proxy hoặc ingress riêng tư không xác thực có `x-openclaw-scopes`, cần `operator.admin`; caller chỉ có quyền ghi nhận `403 missing scope: operator.admin`.
- `x-openclaw-agent-id: <agentId>` vẫn được hỗ trợ như một ghi đè tương thích.
- `x-openclaw-session-key: <sessionKey>` điều khiển định tuyến phiên một cách rõ ràng. Giá trị không được dùng các namespace phiên nội bộ dành riêng như `subagent:`, `cron:`, hoặc `acp:`; các yêu cầu đó bị từ chối với `400 invalid_request_error`.
- `x-openclaw-message-channel: <channel>` đặt ngữ cảnh kênh ingress tổng hợp cho các prompt và chính sách nhận biết kênh.

Các bí danh tương thích vẫn được chấp nhận:

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

Theo mặc định, điểm cuối là **không trạng thái theo từng yêu cầu** (một khóa phiên mới được tạo cho mỗi lệnh gọi).

Nếu yêu cầu bao gồm chuỗi OpenAI `user`, Gateway dẫn xuất một khóa phiên ổn định từ chuỗi đó, để các lệnh gọi lặp lại có thể dùng chung một phiên tác nhân.

Với ứng dụng tùy chỉnh, mặc định an toàn nhất là dùng lại cùng giá trị `user` cho mỗi luồng hội thoại. Tránh định danh cấp tài khoản trừ khi bạn rõ ràng muốn nhiều cuộc hội thoại hoặc thiết bị dùng chung một phiên OpenClaw. Chỉ dùng `x-openclaw-session-key` khi bạn cần điều khiển định tuyến rõ ràng trên nhiều client hoặc luồng, và chọn các khóa do ứng dụng sở hữu không bắt đầu bằng namespace nội bộ dành riêng như `subagent:`, `cron:`, hoặc `acp:`.

## Vì sao bề mặt này quan trọng

Đây là tập tương thích có đòn bẩy cao nhất cho frontend và công cụ tự lưu trữ:

- Hầu hết thiết lập Open WebUI, LobeChat và LibreChat mong đợi `/v1/models`.
- Nhiều hệ thống RAG mong đợi `/v1/embeddings`.
- Các client chat OpenAI hiện có thường có thể bắt đầu với `/v1/chat/completions`.
- Các client thiên về tác nhân hơn ngày càng ưu tiên `/v1/responses`.

## Danh sách mô hình và định tuyến tác nhân

<AccordionGroup>
  <Accordion title="`/v1/models` trả về gì?">
    Một danh sách đích tác nhân OpenClaw.

    Các id được trả về là các mục `openclaw`, `openclaw/default`, và `openclaw/<agentId>`.
    Dùng chúng trực tiếp làm giá trị OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` liệt kê tác nhân hay tác nhân con?">
    Nó liệt kê các đích tác nhân cấp cao nhất, không phải mô hình provider backend và không phải tác nhân con.

    Tác nhân con vẫn là topo thực thi nội bộ. Chúng không xuất hiện như các pseudo-model.

  </Accordion>
  <Accordion title="Vì sao có `openclaw/default`?">
    `openclaw/default` là bí danh ổn định cho tác nhân mặc định đã cấu hình.

    Điều đó có nghĩa là client có thể tiếp tục dùng một id dự đoán được ngay cả khi id tác nhân mặc định thực tế thay đổi giữa các môi trường.

  </Accordion>
  <Accordion title="Làm cách nào để ghi đè mô hình backend?">
    Dùng `x-openclaw-model`. Đây là ghi đè cấp chủ sở hữu: nó hoạt động với đường dẫn token/mật khẩu bearer dùng bí mật dùng chung của Gateway, và yêu cầu `operator.admin` trên các đường dẫn HTTP mang danh tính như xác thực proxy đáng tin cậy.

    Ví dụ:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Nếu bạn bỏ qua nó, tác nhân được chọn chạy với lựa chọn mô hình đã cấu hình bình thường của nó.

  </Accordion>
  <Accordion title="Embeddings phù hợp với hợp đồng này như thế nào?">
    `/v1/embeddings` dùng cùng các id `model` đích tác nhân.

    Dùng `model: "openclaw/default"` hoặc `model: "openclaw/<agentId>"`.
    Khi cần một mô hình embedding cụ thể, hãy gửi nó trong `x-openclaw-model` từ caller dùng bí mật dùng chung hoặc caller mang danh tính có `operator.admin`.
    Không có header đó, yêu cầu được chuyển tiếp tới thiết lập embedding bình thường của tác nhân đã chọn.

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
- `tool_choice`: `"auto"`, `"none"`, `"required"`, hoặc `{ "type": "function", "function": { "name": "..." } }`
- các lượt theo sau `messages[*].role: "tool"`
- `messages[*].tool_call_id` để liên kết kết quả công cụ trở lại một lệnh gọi công cụ trước đó
- `max_completion_tokens`: số; giới hạn theo mỗi lệnh gọi cho tổng token hoàn tất (bao gồm token suy luận). Tên trường OpenAI Chat Completions hiện tại; được ưu tiên khi cả `max_completion_tokens` và `max_tokens` được gửi.
- `max_tokens`: số; bí danh cũ được chấp nhận để tương thích ngược. Bị bỏ qua khi `max_completion_tokens` cũng có mặt.
- `temperature`: số; nhiệt độ lấy mẫu theo best-effort được chuyển tiếp tới provider upstream qua kênh stream-param của tác nhân.
- `top_p`: số; lấy mẫu nucleus theo best-effort được chuyển tiếp tới provider upstream qua kênh stream-param của tác nhân.
- `frequency_penalty`: số; penalty tần suất theo best-effort được chuyển tiếp tới provider upstream qua kênh stream-param của tác nhân. Khoảng hợp lệ: -2.0 đến 2.0. Trả về `400 invalid_request_error` cho giá trị ngoài khoảng.
- `presence_penalty`: số; penalty hiện diện theo best-effort được chuyển tiếp tới provider upstream qua kênh stream-param của tác nhân. Khoảng hợp lệ: -2.0 đến 2.0. Trả về `400 invalid_request_error` cho giá trị ngoài khoảng.
- `seed`: số (số nguyên); seed theo best-effort được chuyển tiếp tới provider upstream qua kênh stream-param của tác nhân. Trả về `400 invalid_request_error` cho giá trị không phải số nguyên.
- `stop`: chuỗi hoặc mảng tối đa 4 chuỗi; chuỗi dừng theo best-effort được chuyển tiếp tới provider upstream qua kênh stream-param của tác nhân. Trả về `400 invalid_request_error` nếu có hơn 4 chuỗi hoặc mục không phải chuỗi/rỗng.

Khi một trong hai trường giới hạn token được đặt, giá trị sẽ được chuyển tiếp tới nhà cung cấp upstream qua kênh stream-param của tác tử. Tên trường wire thực tế được gửi tới nhà cung cấp upstream do transport của nhà cung cấp chọn: `max_completion_tokens` cho các endpoint họ OpenAI, và `max_tokens` cho các nhà cung cấp chỉ chấp nhận tên kế thừa (chẳng hạn như Mistral và Chutes). Các trường sampling (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) đi theo cùng kênh stream-param; backend Codex Responses dựa trên ChatGPT sẽ loại bỏ chúng ở phía máy chủ vì backend này dùng sampling cố định. `stop` cũng đi qua kênh stream-param và ánh xạ tới trường stop của transport (`stop` cho các backend Chat Completions, `stop_sequences` cho Anthropic); API OpenAI Responses không có tham số stop, vì vậy `stop` không được áp dụng trên các model dùng backend Responses.

### Các biến thể không được hỗ trợ

Endpoint trả về `400 invalid_request_error` cho các biến thể công cụ không được hỗ trợ, bao gồm:

- `tools` không phải mảng
- các mục công cụ không phải function
- thiếu `tool.function.name`
- các biến thể `tool_choice` như `allowed_tools` và `custom`
- các giá trị `tool_choice.function.name` không khớp với `tools` được cung cấp

Đối với `tool_choice: "required"` và `tool_choice` được ghim theo function, endpoint thu hẹp tập function-tool của client được hiển thị, hướng dẫn runtime gọi một công cụ client trước khi phản hồi, và trả về lỗi nếu phản hồi của tác tử không bao gồm lệnh gọi client-tool có cấu trúc khớp. Hợp đồng này áp dụng cho danh sách HTTP `tools` do bên gọi cung cấp, không phải mọi công cụ tác tử nội bộ của OpenClaw.

### Hình dạng phản hồi công cụ không streaming

Khi tác tử quyết định gọi công cụ, phản hồi dùng:

- các mục `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` với:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (chuỗi JSON)

Bình luận của assistant trước lệnh gọi công cụ được trả về trong `choices[0].message.content` (có thể trống).

### Hình dạng phản hồi công cụ streaming

Khi `stream: true`, các lệnh gọi công cụ được phát ra dưới dạng các chunk SSE tăng dần:

- delta vai trò assistant ban đầu
- các delta bình luận assistant tùy chọn
- một hoặc nhiều chunk `delta.tool_calls` mang danh tính công cụ và các mảnh đối số
- chunk cuối cùng với `finish_reason: "tool_calls"`
- `data: [DONE]`

Nếu `stream_options.include_usage=true`, một chunk usage ở cuối sẽ được phát ra trước `[DONE]`.

### Vòng lặp theo dõi công cụ

Sau khi nhận `tool_calls`, client nên thực thi function được yêu cầu và gửi một yêu cầu tiếp theo bao gồm:

- tin nhắn gọi công cụ trước đó của assistant
- một hoặc nhiều tin nhắn `role: "tool"` với `tool_call_id` khớp

Điều này cho phép lượt chạy tác tử Gateway tiếp tục cùng vòng lặp suy luận và tạo câu trả lời assistant cuối cùng.

## Thiết lập nhanh Open WebUI

Đối với kết nối Open WebUI cơ bản:

- URL cơ sở: `http://127.0.0.1:18789/v1`
- URL cơ sở Docker trên macOS: `http://host.docker.internal:18789/v1`
- Khóa API: token bearer Gateway của bạn
- Model: `openclaw/default`

Hành vi mong đợi:

- `GET /v1/models` nên liệt kê `openclaw/default`
- Open WebUI nên dùng `openclaw/default` làm id model chat
- Nếu bạn muốn một nhà cung cấp/model backend cụ thể cho tác tử đó, hãy đặt model mặc định thông thường của tác tử hoặc gửi `x-openclaw-model` từ bên gọi dùng shared-secret hoặc bên gọi có danh tính với `operator.admin`

Smoke nhanh:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Nếu lệnh đó trả về `openclaw/default`, hầu hết thiết lập Open WebUI có thể kết nối bằng cùng URL cơ sở và token.

## Ví dụ

Phiên ổn định cho một cuộc hội thoại ứng dụng:

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

Dùng lại cùng giá trị `user` trong các lệnh gọi sau cho cuộc hội thoại đó để tiếp tục cùng phiên tác tử.

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

Liệt kê model:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Lấy một model:

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

- `/v1/models` trả về các mục tiêu tác tử OpenClaw, không phải catalog nhà cung cấp thô.
- `openclaw/default` luôn hiện diện để một id ổn định hoạt động trên nhiều môi trường.
- Các ghi đè nhà cung cấp/model backend thuộc về `x-openclaw-model`, không phải trường OpenAI `model`. Trên các đường dẫn xác thực HTTP có danh tính, header này yêu cầu `operator.admin`.
- `/v1/embeddings` hỗ trợ `input` là chuỗi hoặc mảng chuỗi.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [OpenAI](/vi/providers/openai)
