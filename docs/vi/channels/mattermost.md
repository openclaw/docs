---
read_when:
    - Thiết lập Mattermost
    - Gỡ lỗi định tuyến Mattermost
sidebarTitle: Mattermost
summary: Thiết lập bot Mattermost và cấu hình OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-02T10:34:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 319af8ba1cb8ff1aa5b52a57e809e6c76d3723012dc9cae7c456b89687dd6810
    source_path: channels/mattermost.md
    workflow: 16
---

Trạng thái: Plugin có thể tải xuống (token bot + sự kiện WebSocket). Hỗ trợ kênh, nhóm và DM. Mattermost là một nền tảng nhắn tin nhóm có thể tự host; xem trang chính thức tại [mattermost.com](https://mattermost.com) để biết chi tiết sản phẩm và tải xuống.

## Cài đặt

Cài đặt Mattermost trước khi cấu hình kênh:

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

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

<Steps>
  <Step title="Đảm bảo Plugin khả dụng">
    Các bản phát hành OpenClaw đóng gói hiện tại đã bundle sẵn Plugin này. Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
  </Step>
  <Step title="Tạo bot Mattermost">
    Tạo một tài khoản bot Mattermost và sao chép **token bot**.
  </Step>
  <Step title="Sao chép URL gốc">
    Sao chép **URL gốc** của Mattermost (ví dụ: `https://chat.example.com`).
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

Lệnh slash gốc là tùy chọn bật. Khi được bật, OpenClaw đăng ký các lệnh slash `oc_*` qua API Mattermost và nhận POST callback trên máy chủ HTTP Gateway.

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
  <Accordion title="Ghi chú hành vi">
    - `native: "auto"` mặc định bị tắt cho Mattermost. Đặt `native: true` để bật.
    - Nếu bỏ qua `callbackUrl`, OpenClaw suy ra URL này từ host/cổng Gateway + `callbackPath`.
    - Với thiết lập nhiều tài khoản, có thể đặt `commands` ở cấp cao nhất hoặc dưới `channels.mattermost.accounts.<id>.commands` (giá trị của tài khoản ghi đè các trường cấp cao nhất).
    - Callback lệnh được xác thực bằng token theo từng lệnh do Mattermost trả về khi OpenClaw đăng ký các lệnh `oc_*`.
    - OpenClaw làm mới đăng ký lệnh Mattermost hiện tại trước khi chấp nhận mỗi callback, để các token cũ từ lệnh slash đã xóa hoặc tạo lại sẽ ngừng được chấp nhận mà không cần khởi động lại Gateway.
    - Xác thực callback thất bại theo hướng đóng nếu API Mattermost không thể xác nhận lệnh vẫn hiện hành; các lần xác thực thất bại được lưu cache trong thời gian ngắn, các lượt tra cứu đồng thời được gộp lại, và các lượt tra cứu mới được giới hạn tần suất theo từng lệnh để giới hạn áp lực replay.
    - Callback slash thất bại theo hướng đóng khi đăng ký thất bại, quá trình khởi động chỉ hoàn tất một phần, hoặc token callback không khớp với token đã đăng ký của lệnh đã phân giải (token hợp lệ cho một lệnh không thể đi tới xác thực upstream cho lệnh khác).

  </Accordion>
  <Accordion title="Yêu cầu về khả năng truy cập">
    Endpoint callback phải truy cập được từ máy chủ Mattermost.

    - Không đặt `callbackUrl` thành `localhost` trừ khi Mattermost chạy trên cùng host/namespace mạng với OpenClaw.
    - Không đặt `callbackUrl` thành URL gốc Mattermost của bạn trừ khi URL đó reverse-proxy `/api/channels/mattermost/command` tới OpenClaw.
    - Cách kiểm tra nhanh là `curl https://<gateway-host>/api/channels/mattermost/command`; GET phải trả về `405 Method Not Allowed` từ OpenClaw, không phải `404`.

  </Accordion>
  <Accordion title="Danh sách cho phép egress Mattermost">
    Nếu callback của bạn nhắm tới địa chỉ riêng/tailnet/nội bộ, hãy đặt `ServiceSettings.AllowedUntrustedInternalConnections` của Mattermost để bao gồm host/domain callback.

    Dùng mục host/domain, không dùng URL đầy đủ.

    - Đúng: `gateway.tailnet-name.ts.net`
    - Sai: `https://gateway.tailnet-name.ts.net`

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

## Chế độ trò chuyện

Mattermost tự động phản hồi DM. Hành vi trong kênh được kiểm soát bởi `chatmode`:

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

- `onchar` vẫn phản hồi các @mention rõ ràng.
- `channels.mattermost.requireMention` vẫn được tôn trọng cho cấu hình cũ, nhưng nên dùng `chatmode`.

## Luồng hội thoại và phiên

Dùng `channels.mattermost.replyToMode` để kiểm soát việc phản hồi trong kênh và nhóm ở lại kênh chính hay bắt đầu một luồng dưới bài đăng kích hoạt.

- `off` (mặc định): chỉ phản hồi trong một luồng khi bài đăng đến đã nằm trong luồng.
- `first`: với bài đăng kênh/nhóm cấp cao nhất, bắt đầu một luồng dưới bài đăng đó và định tuyến cuộc trò chuyện tới phiên theo phạm vi luồng.
- `all`: hiện nay có cùng hành vi như `first` đối với Mattermost.
- Tin nhắn trực tiếp bỏ qua thiết lập này và vẫn không dùng luồng.

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

- Phiên theo phạm vi luồng dùng id bài đăng kích hoạt làm gốc luồng.
- `first` và `all` hiện tương đương vì một khi Mattermost có gốc luồng, các đoạn tiếp theo và media tiếp tục trong cùng luồng đó.

## Kiểm soát truy cập (DM)

- Mặc định: `channels.mattermost.dmPolicy = "pairing"` (người gửi chưa biết sẽ nhận mã ghép đôi).
- Phê duyệt bằng:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM công khai: `channels.mattermost.dmPolicy="open"` cộng với `channels.mattermost.allowFrom=["*"]`.

## Kênh (nhóm)

- Mặc định: `channels.mattermost.groupPolicy = "allowlist"` (gated bằng mention).
- Cho phép người gửi bằng `channels.mattermost.groupAllowFrom` (khuyến nghị dùng ID người dùng).
- Ghi đè mention theo từng kênh nằm dưới `channels.mattermost.groups.<channelId>.requireMention` hoặc `channels.mattermost.groups["*"].requireMention` cho mặc định.
- Khớp `@username` có thể thay đổi và chỉ được bật khi `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Kênh mở: `channels.mattermost.groupPolicy="open"` (gated bằng mention).
- Ghi chú runtime: nếu thiếu hoàn toàn `channels.mattermost`, runtime sẽ quay về `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

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

## Mục tiêu cho gửi đi

Dùng các định dạng mục tiêu này với `openclaw message send` hoặc cron/webhook:

- `channel:<id>` cho một kênh
- `user:<id>` cho DM
- `@username` cho DM (được phân giải qua API Mattermost)

<Warning>
ID mờ không có tiền tố (như `64ifufp...`) là **mơ hồ** trong Mattermost (ID người dùng so với ID kênh).

OpenClaw phân giải chúng theo thứ tự **người dùng trước**:

- Nếu ID tồn tại dưới dạng người dùng (`GET /api/v4/users/<id>` thành công), OpenClaw gửi **DM** bằng cách phân giải kênh trực tiếp qua `/api/v4/channels/direct`.
- Nếu không, ID được xử lý như **ID kênh**.

Nếu bạn cần hành vi xác định, luôn dùng tiền tố rõ ràng (`user:<id>` / `channel:<id>`).
</Warning>

## Thử lại kênh DM

Khi OpenClaw gửi tới mục tiêu DM Mattermost và cần phân giải kênh trực tiếp trước, mặc định nó sẽ thử lại các lỗi tạm thời khi tạo kênh trực tiếp.

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
- Thử lại áp dụng cho lỗi tạm thời như giới hạn tần suất, phản hồi 5xx, và lỗi mạng hoặc timeout.
- Lỗi client 4xx ngoài `429` được xem là vĩnh viễn và không được thử lại.

## Streaming bản xem trước

Mattermost stream phần suy nghĩ, hoạt động công cụ và văn bản trả lời từng phần vào một **bài đăng nháp xem trước** duy nhất, rồi hoàn tất tại chỗ khi câu trả lời cuối cùng an toàn để gửi. Bản xem trước cập nhật trên cùng id bài đăng thay vì làm đầy kênh bằng tin nhắn theo từng đoạn. Kết quả cuối cùng media/lỗi sẽ hủy các chỉnh sửa bản xem trước đang chờ và dùng cách gửi thông thường thay vì flush một bài đăng xem trước dùng một lần.

Bật bằng `channels.mattermost.streaming`:

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
    - `partial` là lựa chọn thông thường: một bài đăng xem trước được chỉnh sửa khi câu trả lời dài thêm, rồi được hoàn tất với câu trả lời đầy đủ.
    - `block` dùng các đoạn nháp kiểu append bên trong bài đăng xem trước.
    - `progress` hiển thị bản xem trước trạng thái trong khi tạo và chỉ đăng câu trả lời cuối cùng khi hoàn tất.
    - `off` tắt streaming bản xem trước.

  </Accordion>
  <Accordion title="Ghi chú hành vi streaming">
    - Nếu không thể hoàn tất stream tại chỗ (ví dụ bài đăng bị xóa giữa lúc stream), OpenClaw quay về gửi một bài đăng cuối cùng mới để câu trả lời không bao giờ bị mất.
    - Payload chỉ có reasoning bị chặn khỏi bài đăng kênh, bao gồm văn bản đến dưới dạng blockquote `> Reasoning:`. Đặt `/reasoning on` để xem suy nghĩ ở các bề mặt khác; bài đăng cuối cùng trên Mattermost chỉ giữ câu trả lời.
    - Xem [Streaming](/vi/concepts/streaming#preview-streaming-modes) để biết ma trận ánh xạ kênh.

  </Accordion>
</AccordionGroup>

## Reaction (công cụ tin nhắn)

- Dùng `message action=react` với `channel=mattermost`.
- `messageId` là id bài đăng Mattermost.
- `emoji` chấp nhận tên như `thumbsup` hoặc `:+1:` (dấu hai chấm là tùy chọn).
- Đặt `remove=true` (boolean) để xóa reaction.
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

Bật nút bằng cách thêm `inlineButtons` vào capability của kênh:

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

Trường nút:

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
  <Step title="Nút được thay bằng xác nhận">
    Tất cả nút được thay bằng một dòng xác nhận (ví dụ: "✓ **Yes** được @user chọn").
  </Step>
  <Step title="Tác tử nhận lựa chọn">
    Tác tử nhận lựa chọn dưới dạng tin nhắn đến và phản hồi.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Ghi chú triển khai">
    - Callback của nút dùng xác minh HMAC-SHA256 (tự động, không cần cấu hình).
    - Mattermost loại bỏ dữ liệu callback khỏi phản hồi API của nó (tính năng bảo mật), nên tất cả nút đều bị xóa khi nhấp — không thể xóa một phần.
    - ID hành động chứa dấu gạch nối hoặc dấu gạch dưới được tự động làm sạch (giới hạn định tuyến của Mattermost).

  </Accordion>
  <Accordion title="Cấu hình và khả năng truy cập">
    - `channels.mattermost.capabilities`: mảng các chuỗi khả năng. Thêm `"inlineButtons"` để bật mô tả công cụ nút trong lời nhắc hệ thống của tác tử.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL cơ sở bên ngoài tùy chọn cho callback của nút (ví dụ `https://gateway.example.com`). Dùng mục này khi Mattermost không thể truy cập trực tiếp Gateway tại host liên kết của Gateway.
    - Trong thiết lập nhiều tài khoản, bạn cũng có thể đặt cùng trường này dưới `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Nếu bỏ qua `interactions.callbackBaseUrl`, OpenClaw suy ra URL callback từ `gateway.customBindHost` + `gateway.port`, rồi dự phòng về `http://localhost:<port>`.
    - Quy tắc khả năng truy cập: URL callback của nút phải truy cập được từ máy chủ Mattermost. `localhost` chỉ hoạt động khi Mattermost và OpenClaw chạy trên cùng host/không gian tên mạng.
    - Nếu đích callback của bạn là riêng/mạng Tailscale/nội bộ, hãy thêm host/miền của nó vào Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### Tích hợp API trực tiếp (script bên ngoài)

Các script bên ngoài và Webhook có thể đăng nút trực tiếp qua Mattermost REST API thay vì đi qua công cụ `message` của tác tử. Dùng `buildButtonAttachments()` từ Plugin khi có thể; nếu đăng JSON thô, hãy tuân theo các quy tắc sau:

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

1. Attachment nằm trong `props.attachments`, không phải `attachments` cấp cao nhất (sẽ bị bỏ qua âm thầm).
2. Mỗi hành động cần `type: "button"` — nếu thiếu, lượt nhấp sẽ bị nuốt âm thầm.
3. Mỗi hành động cần trường `id` — Mattermost bỏ qua hành động không có ID.
4. `id` của hành động phải **chỉ gồm chữ và số** (`[a-zA-Z0-9]`). Dấu gạch nối và dấu gạch dưới làm hỏng định tuyến hành động phía máy chủ của Mattermost (trả về 404). Hãy loại bỏ chúng trước khi dùng.
5. `context.action_id` phải khớp với `id` của nút để thông báo xác nhận hiển thị tên nút (ví dụ: "Approve") thay vì ID thô.
6. `context.action_id` là bắt buộc — trình xử lý tương tác trả về 400 nếu thiếu.

</Warning>

**Tạo token HMAC**

Gateway xác minh lượt nhấp nút bằng HMAC-SHA256. Các script bên ngoài phải tạo token khớp với logic xác minh của Gateway:

<Steps>
  <Step title="Suy ra bí mật từ token bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Xây dựng đối tượng ngữ cảnh">
    Xây dựng đối tượng ngữ cảnh với tất cả trường **ngoại trừ** `_token`.
  </Step>
  <Step title="Tuần tự hóa với khóa đã sắp xếp">
    Tuần tự hóa với **khóa đã sắp xếp** và **không có khoảng trắng** (Gateway dùng `JSON.stringify` với khóa đã sắp xếp, tạo đầu ra gọn).
  </Step>
  <Step title="Ký payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Thêm token">
    Thêm bản băm hex kết quả dưới dạng `_token` trong ngữ cảnh.
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
  <Accordion title="Lỗi HMAC thường gặp">
    - `json.dumps` của Python mặc định thêm khoảng trắng (`{"key": "val"}`). Dùng `separators=(",", ":")` để khớp với đầu ra gọn của JavaScript (`{"key":"val"}`).
    - Luôn ký **tất cả** trường ngữ cảnh (trừ `_token`). Gateway loại bỏ `_token` rồi ký mọi thứ còn lại. Ký một tập con sẽ gây lỗi xác minh âm thầm.
    - Dùng `sort_keys=True` — Gateway sắp xếp khóa trước khi ký, và Mattermost có thể sắp xếp lại các trường ngữ cảnh khi lưu payload.
    - Suy ra bí mật từ token bot (xác định), không phải byte ngẫu nhiên. Bí mật phải giống nhau giữa tiến trình tạo nút và Gateway xác minh.

  </Accordion>
</AccordionGroup>

## Adapter thư mục

Plugin Mattermost bao gồm một adapter thư mục phân giải tên kênh và tên người dùng qua Mattermost API. Điều này cho phép đích `#channel-name` và `@username` trong `openclaw message send` và các lần gửi Cron/Webhook.

Không cần cấu hình — adapter dùng token bot từ cấu hình tài khoản.

## Nhiều tài khoản

Mattermost hỗ trợ nhiều tài khoản dưới `channels.mattermost.accounts`:

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
    Đảm bảo bot ở trong kênh và nhắc đến bot (oncall), dùng tiền tố kích hoạt (onchar), hoặc đặt `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Lỗi xác thực hoặc nhiều tài khoản">
    - Kiểm tra token bot, URL cơ sở và tài khoản có được bật hay không.
    - Sự cố nhiều tài khoản: biến môi trường chỉ áp dụng cho tài khoản `default`.

  </Accordion>
  <Accordion title="Lệnh slash gốc thất bại">
    - `Unauthorized: invalid command token.`: OpenClaw không chấp nhận token callback. Nguyên nhân thường gặp:
      - đăng ký lệnh slash thất bại hoặc chỉ hoàn tất một phần khi khởi động
      - callback đang đi đến sai Gateway/tài khoản
      - Mattermost vẫn có lệnh cũ trỏ đến đích callback trước đó
      - Gateway khởi động lại mà không kích hoạt lại lệnh slash
    - Nếu lệnh slash gốc ngừng hoạt động, hãy kiểm tra nhật ký để tìm `mattermost: failed to register slash commands` hoặc `mattermost: native slash commands enabled but no commands could be registered`.
    - Nếu bỏ qua `callbackUrl` và nhật ký cảnh báo rằng callback phân giải thành `http://127.0.0.1:18789/...`, URL đó có lẽ chỉ truy cập được khi Mattermost chạy trên cùng host/không gian tên mạng với OpenClaw. Thay vào đó, hãy đặt `commands.callbackUrl` bên ngoài có thể truy cập rõ ràng.

  </Accordion>
  <Accordion title="Sự cố nút">
    - Nút xuất hiện như ô trắng: tác tử có thể đang gửi dữ liệu nút sai định dạng. Kiểm tra mỗi nút có cả hai trường `text` và `callback_data`.
    - Nút hiển thị nhưng nhấp không có tác dụng: xác minh `AllowedUntrustedInternalConnections` trong cấu hình máy chủ Mattermost bao gồm `127.0.0.1 localhost`, và `EnablePostActionIntegration` là `true` trong ServiceSettings.
    - Nút trả về 404 khi nhấp: `id` của nút có khả năng chứa dấu gạch nối hoặc dấu gạch dưới. Bộ định tuyến hành động của Mattermost hỏng với ID không phải chữ và số. Chỉ dùng `[a-zA-Z0-9]`.
    - Nhật ký Gateway ghi `invalid _token`: HMAC không khớp. Kiểm tra rằng bạn ký tất cả trường ngữ cảnh (không phải tập con), dùng khóa đã sắp xếp và dùng JSON gọn (không có khoảng trắng). Xem phần HMAC ở trên.
    - Nhật ký Gateway ghi `missing _token in context`: trường `_token` không có trong ngữ cảnh của nút. Đảm bảo trường này được đưa vào khi xây dựng payload tích hợp.
    - Xác nhận hiển thị ID thô thay vì tên nút: `context.action_id` không khớp với `id` của nút. Đặt cả hai thành cùng giá trị đã làm sạch.
    - Tác tử không biết về nút: thêm `capabilities: ["inlineButtons"]` vào cấu hình kênh Mattermost.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Tổng quan về kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng nhắc đến
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
