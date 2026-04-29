---
read_when:
    - Thiết lập Mattermost
    - Gỡ lỗi định tuyến Mattermost
sidebarTitle: Mattermost
summary: Thiết lập bot Mattermost và cấu hình OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-29T22:26:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

Trạng thái: Plugin được đóng gói kèm (token bot + sự kiện WebSocket). Hỗ trợ kênh, nhóm và DM. Mattermost là nền tảng nhắn tin nhóm có thể tự lưu trữ; xem trang chính thức tại [mattermost.com](https://mattermost.com) để biết chi tiết sản phẩm và tải xuống.

## Plugin được đóng gói kèm

<Note>
Mattermost được phát hành dưới dạng Plugin đóng gói kèm trong các bản phát hành OpenClaw hiện tại, vì vậy các bản dựng đóng gói thông thường không cần cài đặt riêng.
</Note>

Nếu bạn đang dùng bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh loại trừ Mattermost, hãy cài đặt gói npm hiện tại khi có gói được phát hành:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Nếu npm báo gói do OpenClaw sở hữu là không còn được khuyến nghị, hãy dùng bản dựng OpenClaw đóng gói hiện tại hoặc đường dẫn checkout cục bộ cho đến khi gói npm mới hơn được phát hành.

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

<Steps>
  <Step title="Đảm bảo Plugin có sẵn">
    Các bản phát hành OpenClaw đóng gói hiện tại đã đóng gói kèm Plugin này. Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
  </Step>
  <Step title="Tạo bot Mattermost">
    Tạo một tài khoản bot Mattermost và sao chép **token bot**.
  </Step>
  <Step title="Sao chép URL cơ sở">
    Sao chép **URL cơ sở** của Mattermost (ví dụ: `https://chat.example.com`).
  </Step>
  <Step title="Cấu hình OpenClaw và khởi động Gateway">
    Cấu hình tối thiểu:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

  </Step>
</Steps>

## Lệnh slash gốc

Lệnh slash gốc là tùy chọn bật. Khi được bật, OpenClaw đăng ký các lệnh slash `oc_*` qua API Mattermost và nhận callback POST trên máy chủ HTTP của Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ghi chú về hành vi">
    - `native: "auto"` mặc định là tắt cho Mattermost. Đặt `native: true` để bật.
    - Nếu bỏ qua `callbackUrl`, OpenClaw suy ra URL từ host/port của Gateway + `callbackPath`.
    - Với thiết lập nhiều tài khoản, có thể đặt `commands` ở cấp cao nhất hoặc dưới `channels.mattermost.accounts.<id>.commands` (giá trị tài khoản ghi đè các trường cấp cao nhất).
    - Callback lệnh được xác thực bằng token theo từng lệnh do Mattermost trả về khi OpenClaw đăng ký các lệnh `oc_*`.
    - Callback slash sẽ fail closed khi đăng ký thất bại, khởi động chỉ hoàn tất một phần, hoặc token callback không khớp với một trong các lệnh đã đăng ký.

  </Accordion>
  <Accordion title="Yêu cầu về khả năng truy cập">
    Endpoint callback phải truy cập được từ máy chủ Mattermost.

    - Không đặt `callbackUrl` thành `localhost` trừ khi Mattermost chạy trên cùng host/namespace mạng với OpenClaw.
    - Không đặt `callbackUrl` thành URL cơ sở Mattermost của bạn trừ khi URL đó reverse-proxy `/api/channels/mattermost/command` tới OpenClaw.
    - Kiểm tra nhanh là `curl https://<gateway-host>/api/channels/mattermost/command`; yêu cầu GET nên trả về `405 Method Not Allowed` từ OpenClaw, không phải `404`.

  </Accordion>
  <Accordion title="Danh sách cho phép egress của Mattermost">
    Nếu callback của bạn nhắm tới địa chỉ riêng/tailnet/nội bộ, hãy đặt `ServiceSettings.AllowedUntrustedInternalConnections` của Mattermost để bao gồm host/miền callback.

    Dùng mục nhập host/miền, không dùng URL đầy đủ.

    - Tốt: `gateway.tailnet-name.ts.net`
    - Không tốt: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Biến môi trường (tài khoản mặc định)

Đặt các biến này trên host Gateway nếu bạn muốn dùng biến môi trường:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Biến môi trường chỉ áp dụng cho tài khoản **mặc định** (`default`). Các tài khoản khác phải dùng giá trị cấu hình.

Không thể đặt `MATTERMOST_URL` từ `.env` của workspace; xem [Tệp `.env` của workspace](/vi/gateway/security).
</Note>

## Chế độ chat

Mattermost tự động phản hồi DM. Hành vi kênh được kiểm soát bởi `chatmode`:

<Tabs>
  <Tab title="oncall (mặc định)">
    Chỉ phản hồi khi được @nhắc đến trong kênh.
  </Tab>
  <Tab title="onmessage">
    Phản hồi mọi tin nhắn trong kênh.
  </Tab>
  <Tab title="onchar">
    Phản hồi khi tin nhắn bắt đầu bằng tiền tố kích hoạt.
  </Tab>
</Tabs>

Ví dụ cấu hình:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Ghi chú:

- `onchar` vẫn phản hồi các lượt @nhắc đến rõ ràng.
- `channels.mattermost.requireMention` vẫn được tôn trọng cho cấu hình cũ nhưng nên dùng `chatmode`.

## Thread và phiên

Dùng `channels.mattermost.replyToMode` để kiểm soát việc trả lời trong kênh và nhóm ở lại kênh chính hay bắt đầu một thread dưới bài đăng kích hoạt.

- `off` (mặc định): chỉ trả lời trong thread khi bài đăng đến đã nằm trong một thread.
- `first`: với bài đăng kênh/nhóm cấp cao nhất, bắt đầu một thread dưới bài đăng đó và định tuyến cuộc trò chuyện tới phiên theo phạm vi thread.
- `all`: hiện tại có cùng hành vi như `first` đối với Mattermost.
- Tin nhắn trực tiếp bỏ qua thiết lập này và vẫn không dùng thread.

Ví dụ cấu hình:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Ghi chú:

- Phiên theo phạm vi thread dùng id bài đăng kích hoạt làm gốc thread.
- `first` và `all` hiện tương đương vì sau khi Mattermost có gốc thread, các chunk theo sau và media tiếp tục trong cùng thread đó.

## Kiểm soát truy cập (DM)

- Mặc định: `channels.mattermost.dmPolicy = "pairing"` (người gửi chưa biết sẽ nhận mã ghép đôi).
- Phê duyệt qua:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM công khai: `channels.mattermost.dmPolicy="open"` cộng với `channels.mattermost.allowFrom=["*"]`.

## Kênh (nhóm)

- Mặc định: `channels.mattermost.groupPolicy = "allowlist"` (bị chặn bằng yêu cầu nhắc đến).
- Cho phép người gửi bằng `channels.mattermost.groupAllowFrom` (khuyến nghị dùng ID người dùng).
- Ghi đè yêu cầu nhắc đến theo kênh nằm dưới `channels.mattermost.groups.<channelId>.requireMention` hoặc `channels.mattermost.groups["*"].requireMention` cho mặc định.
- Khớp `@username` có thể thay đổi và chỉ được bật khi `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Kênh mở: `channels.mattermost.groupPolicy="open"` (bị chặn bằng yêu cầu nhắc đến).
- Ghi chú runtime: nếu hoàn toàn thiếu `channels.mattermost`, runtime quay về `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

Ví dụ:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Đích để gửi đi

Dùng các định dạng đích này với `openclaw message send` hoặc cron/webhook:

- `channel:<id>` cho một kênh
- `user:<id>` cho một DM
- `@username` cho một DM (được phân giải qua API Mattermost)

<Warning>
ID mờ không có tiền tố (như `64ifufp...`) là **mơ hồ** trong Mattermost (ID người dùng so với ID kênh).

OpenClaw phân giải chúng theo thứ tự **ưu tiên người dùng**:

- Nếu ID tồn tại dưới dạng người dùng (`GET /api/v4/users/<id>` thành công), OpenClaw gửi **DM** bằng cách phân giải kênh trực tiếp qua `/api/v4/channels/direct`.
- Nếu không, ID được xử lý như **ID kênh**.

Nếu bạn cần hành vi xác định, hãy luôn dùng tiền tố rõ ràng (`user:<id>` / `channel:<id>`).
</Warning>

## Thử lại kênh DM

Khi OpenClaw gửi tới đích DM Mattermost và cần phân giải kênh trực tiếp trước, mặc định nó sẽ thử lại các lỗi tạo kênh trực tiếp tạm thời.

Dùng `channels.mattermost.dmChannelRetry` để tinh chỉnh hành vi đó trên toàn cục cho Plugin Mattermost, hoặc `channels.mattermost.accounts.<id>.dmChannelRetry` cho một tài khoản.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Ghi chú:

- Điều này chỉ áp dụng cho việc tạo kênh DM (`/api/v4/channels/direct`), không phải mọi lệnh gọi API Mattermost.
- Thử lại áp dụng cho các lỗi tạm thời như giới hạn tốc độ, phản hồi 5xx, và lỗi mạng hoặc timeout.
- Lỗi máy khách 4xx ngoài `429` được xem là vĩnh viễn và không được thử lại.

## Streaming bản xem trước

Mattermost stream phần suy nghĩ, hoạt động công cụ và văn bản phản hồi một phần vào một **bài đăng bản nháp xem trước** duy nhất, bài đăng này được hoàn tất tại chỗ khi câu trả lời cuối cùng an toàn để gửi. Bản xem trước cập nhật trên cùng id bài đăng thay vì làm tràn kênh bằng tin nhắn theo từng chunk. Kết quả cuối chứa media/lỗi sẽ hủy các chỉnh sửa bản xem trước đang chờ và dùng cách gửi thông thường thay vì flush một bài đăng xem trước tạm.

Bật qua `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Chế độ streaming">
    - `partial` là lựa chọn thông thường: một bài đăng xem trước được chỉnh sửa khi phản hồi dài thêm, rồi được hoàn tất với câu trả lời đầy đủ.
    - `block` dùng các chunk bản nháp kiểu nối thêm bên trong bài đăng xem trước.
    - `progress` hiển thị bản xem trước trạng thái trong khi tạo và chỉ đăng câu trả lời cuối cùng khi hoàn tất.
    - `off` tắt streaming bản xem trước.

  </Accordion>
  <Accordion title="Ghi chú về hành vi streaming">
    - Nếu stream không thể được hoàn tất tại chỗ (ví dụ bài đăng bị xóa giữa luồng), OpenClaw quay về gửi một bài đăng cuối mới để phản hồi không bao giờ bị mất.
    - Payload chỉ chứa reasoning bị chặn khỏi bài đăng kênh, bao gồm văn bản đến dưới dạng blockquote `> Reasoning:`. Đặt `/reasoning on` để xem phần suy nghĩ trên các bề mặt khác; bài đăng cuối của Mattermost chỉ giữ câu trả lời.
    - Xem [Streaming](/vi/concepts/streaming#preview-streaming-modes) để biết ma trận ánh xạ kênh.

  </Accordion>
</AccordionGroup>

## Reactions (công cụ tin nhắn)

- Dùng `message action=react` với `channel=mattermost`.
- `messageId` là id bài đăng Mattermost.
- `emoji` chấp nhận tên như `thumbsup` hoặc `:+1:` (dấu hai chấm là tùy chọn).
- Đặt `remove=true` (boolean) để xóa một reaction.
- Sự kiện thêm/xóa reaction được chuyển tiếp dưới dạng sự kiện hệ thống tới phiên agent đã định tuyến.

Ví dụ:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Cấu hình:

- `channels.mattermost.actions.reactions`: bật/tắt hành động reaction (mặc định true).
- Ghi đè theo tài khoản: `channels.mattermost.accounts.<id>.actions.reactions`.

## Nút tương tác (công cụ tin nhắn)

Gửi tin nhắn với các nút có thể nhấp. Khi người dùng nhấp vào một nút, agent nhận lựa chọn và có thể phản hồi.

Bật nút bằng cách thêm `inlineButtons` vào khả năng của kênh:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Dùng `message action=send` với tham số `buttons`. Nút là mảng 2D (các hàng nút):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Trường của nút:

<ParamField path="text" type="string" required>
  Nhãn hiển thị.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Giá trị được gửi lại khi nhấp (dùng làm ID hành động).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Kiểu nút.
</ParamField>

Khi người dùng nhấp vào một nút:

<Steps>
  <Step title="Các nút được thay bằng xác nhận">
    Tất cả các nút được thay bằng một dòng xác nhận (ví dụ: "✓ **Yes** selected by @user").
  </Step>
  <Step title="Agent nhận lựa chọn">
    Agent nhận lựa chọn dưới dạng tin nhắn đến và phản hồi.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Ghi chú triển khai">
    - Callback của nút dùng xác minh HMAC-SHA256 (tự động, không cần cấu hình).
    - Mattermost loại bỏ dữ liệu callback khỏi phản hồi API của nó (tính năng bảo mật), nên tất cả các nút sẽ bị xóa khi nhấp — không thể xóa một phần.
    - ID hành động chứa dấu gạch nối hoặc dấu gạch dưới sẽ được tự động làm sạch (giới hạn định tuyến của Mattermost).

  </Accordion>
  <Accordion title="Cấu hình và khả năng truy cập">
    - `channels.mattermost.capabilities`: mảng các chuỗi năng lực. Thêm `"inlineButtons"` để bật mô tả công cụ nút trong system prompt của agent.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL cơ sở bên ngoài tùy chọn cho callback của nút (ví dụ `https://gateway.example.com`). Dùng tùy chọn này khi Mattermost không thể truy cập trực tiếp gateway tại host bind của gateway.
    - Trong thiết lập nhiều tài khoản, bạn cũng có thể đặt cùng trường này dưới `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Nếu bỏ qua `interactions.callbackBaseUrl`, OpenClaw suy ra URL callback từ `gateway.customBindHost` + `gateway.port`, sau đó fallback về `http://localhost:<port>`.
    - Quy tắc khả năng truy cập: URL callback của nút phải truy cập được từ máy chủ Mattermost. `localhost` chỉ hoạt động khi Mattermost và OpenClaw chạy trên cùng host/namespace mạng.
    - Nếu đích callback của bạn là riêng tư/tailnet/nội bộ, hãy thêm host/domain của nó vào `ServiceSettings.AllowedUntrustedInternalConnections` của Mattermost.

  </Accordion>
</AccordionGroup>

### Tích hợp API trực tiếp (script bên ngoài)

Các script và Webhook bên ngoài có thể đăng nút trực tiếp qua Mattermost REST API thay vì đi qua công cụ `message` của agent. Dùng `buildButtonAttachments()` từ Plugin khi có thể; nếu đăng JSON thô, hãy tuân theo các quy tắc sau:

**Cấu trúc payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only — see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Quy tắc quan trọng**

1. Attachment nằm trong `props.attachments`, không phải `attachments` ở cấp cao nhất (bị bỏ qua âm thầm).
2. Mọi hành động đều cần `type: "button"` — nếu không có, lần nhấp sẽ bị nuốt âm thầm.
3. Mọi hành động đều cần trường `id` — Mattermost bỏ qua các hành động không có ID.
4. `id` của hành động phải **chỉ gồm chữ và số** (`[a-zA-Z0-9]`). Dấu gạch nối và dấu gạch dưới làm hỏng định tuyến hành động phía máy chủ của Mattermost (trả về 404). Hãy loại bỏ chúng trước khi dùng.
5. `context.action_id` phải khớp với `id` của nút để thông báo xác nhận hiển thị tên nút (ví dụ: "Approve") thay vì ID thô.
6. Bắt buộc có `context.action_id` — trình xử lý tương tác trả về 400 nếu thiếu.

</Warning>

**Tạo token HMAC**

Gateway xác minh lần nhấp nút bằng HMAC-SHA256. Các script bên ngoài phải tạo token khớp với logic xác minh của gateway:

<Steps>
  <Step title="Suy ra secret từ bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Xây dựng đối tượng context">
    Xây dựng đối tượng context với tất cả các trường **ngoại trừ** `_token`.
  </Step>
  <Step title="Serialize với khóa đã sắp xếp">
    Serialize với **khóa đã sắp xếp** và **không có khoảng trắng** (gateway dùng `JSON.stringify` với khóa đã sắp xếp, tạo đầu ra dạng compact).
  </Step>
  <Step title="Ký payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Thêm token">
    Thêm hex digest thu được dưới dạng `_token` trong context.
  </Step>
</Steps>

Ví dụ Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Các lỗi HMAC thường gặp">
    - `json.dumps` của Python mặc định thêm khoảng trắng (`{"key": "val"}`). Dùng `separators=(",", ":")` để khớp với đầu ra compact của JavaScript (`{"key":"val"}`).
    - Luôn ký **tất cả** các trường context (trừ `_token`). Gateway loại bỏ `_token` rồi ký mọi thứ còn lại. Ký một tập con sẽ khiến xác minh thất bại âm thầm.
    - Dùng `sort_keys=True` — gateway sắp xếp khóa trước khi ký, và Mattermost có thể sắp xếp lại các trường context khi lưu payload.
    - Suy ra secret từ bot token (xác định), không phải byte ngẫu nhiên. Secret phải giống nhau giữa tiến trình tạo nút và gateway xác minh.

  </Accordion>
</AccordionGroup>

## Bộ chuyển đổi thư mục

Plugin Mattermost bao gồm một bộ chuyển đổi thư mục phân giải tên kênh và tên người dùng qua Mattermost API. Điều này cho phép dùng đích `#channel-name` và `@username` trong `openclaw message send` và các lần gửi cron/webhook.

Không cần cấu hình — bộ chuyển đổi dùng bot token từ cấu hình tài khoản.

## Nhiều tài khoản

Mattermost hỗ trợ nhiều tài khoản trong `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không có phản hồi trong kênh">
    Đảm bảo bot đã ở trong kênh và mention bot (oncall), dùng tiền tố kích hoạt (onchar), hoặc đặt `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Lỗi xác thực hoặc nhiều tài khoản">
    - Kiểm tra bot token, URL cơ sở và tài khoản có được bật hay không.
    - Vấn đề nhiều tài khoản: biến môi trường chỉ áp dụng cho tài khoản `default`.

  </Accordion>
  <Accordion title="Lệnh slash gốc thất bại">
    - `Unauthorized: invalid command token.`: OpenClaw không chấp nhận callback token. Nguyên nhân điển hình:
      - đăng ký lệnh slash thất bại hoặc chỉ hoàn tất một phần khi khởi động
      - callback đang đi tới sai gateway/tài khoản
      - Mattermost vẫn có các lệnh cũ trỏ tới đích callback trước đó
      - gateway khởi động lại mà không kích hoạt lại lệnh slash
    - Nếu lệnh slash gốc ngừng hoạt động, hãy kiểm tra log để tìm `mattermost: failed to register slash commands` hoặc `mattermost: native slash commands enabled but no commands could be registered`.
    - Nếu bỏ qua `callbackUrl` và log cảnh báo rằng callback được phân giải thành `http://127.0.0.1:18789/...`, URL đó có lẽ chỉ truy cập được khi Mattermost chạy trên cùng host/namespace mạng với OpenClaw. Thay vào đó, hãy đặt `commands.callbackUrl` rõ ràng và có thể truy cập từ bên ngoài.

  </Accordion>
  <Accordion title="Vấn đề với nút">
    - Nút xuất hiện dưới dạng ô trắng: agent có thể đang gửi dữ liệu nút sai định dạng. Kiểm tra rằng mỗi nút có cả hai trường `text` và `callback_data`.
    - Nút hiển thị nhưng nhấp không có tác dụng: xác minh `AllowedUntrustedInternalConnections` trong cấu hình máy chủ Mattermost bao gồm `127.0.0.1 localhost`, và `EnablePostActionIntegration` là `true` trong ServiceSettings.
    - Nút trả về 404 khi nhấp: `id` của nút có khả năng chứa dấu gạch nối hoặc dấu gạch dưới. Router hành động của Mattermost bị hỏng với ID không phải chữ và số. Chỉ dùng `[a-zA-Z0-9]`.
    - Log Gateway báo `invalid _token`: HMAC không khớp. Kiểm tra rằng bạn ký tất cả các trường context (không phải một tập con), dùng khóa đã sắp xếp và dùng JSON compact (không có khoảng trắng). Xem phần HMAC ở trên.
    - Log Gateway báo `missing _token in context`: trường `_token` không có trong context của nút. Đảm bảo trường này được đưa vào khi xây dựng payload tích hợp.
    - Xác nhận hiển thị ID thô thay vì tên nút: `context.action_id` không khớp với `id` của nút. Đặt cả hai về cùng một giá trị đã làm sạch.
    - Agent không biết về nút: thêm `capabilities: ["inlineButtons"]` vào cấu hình kênh Mattermost.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) — hành vi chat nhóm và kiểm soát mention
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
