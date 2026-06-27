---
read_when:
    - Thiết lập Mattermost
    - Gỡ lỗi định tuyến Mattermost
sidebarTitle: Mattermost
summary: Thiết lập bot Mattermost và cấu hình OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T17:11:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

Trạng thái: Plugin có thể tải xuống (mã thông báo bot + sự kiện WebSocket). Hỗ trợ kênh, nhóm và DM. Mattermost là một nền tảng nhắn tin nhóm có thể tự lưu trữ; xem trang chính thức tại [mattermost.com](https://mattermost.com) để biết chi tiết sản phẩm và tải xuống.

## Cài đặt

Cài đặt Mattermost trước khi cấu hình kênh:

<Tabs>
  <Tab title="sổ đăng ký npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Bản checkout cục bộ">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

<Steps>
  <Step title="Đảm bảo Plugin có sẵn">
    Cài đặt `@openclaw/mattermost` bằng lệnh ở trên, sau đó khởi động lại Gateway nếu Gateway đã chạy.
  </Step>
  <Step title="Tạo bot Mattermost">
    Tạo một tài khoản bot Mattermost và sao chép **mã thông báo bot**.
  </Step>
  <Step title="Sao chép URL cơ sở">
    Sao chép **URL cơ sở** của Mattermost (ví dụ: `https://chat.example.com`).
  </Step>
  <Step title="Cấu hình OpenClaw và khởi động gateway">
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

## Lệnh gạch chéo gốc

Lệnh gạch chéo gốc là tùy chọn bật. Khi được bật, OpenClaw đăng ký các lệnh gạch chéo `oc_*` qua Mattermost API và nhận các POST callback trên máy chủ HTTP của gateway.

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
    - `native: "auto"` mặc định là tắt đối với Mattermost. Đặt `native: true` để bật.
    - Nếu bỏ qua `callbackUrl`, OpenClaw sẽ suy ra một giá trị từ máy chủ/cổng gateway + `callbackPath`.
    - Với thiết lập nhiều tài khoản, có thể đặt `commands` ở cấp cao nhất hoặc dưới `channels.mattermost.accounts.<id>.commands` (giá trị tài khoản ghi đè các trường cấp cao nhất).
    - Callback lệnh được xác thực bằng các mã thông báo theo từng lệnh do Mattermost trả về khi OpenClaw đăng ký các lệnh `oc_*`.
    - OpenClaw làm mới đăng ký lệnh Mattermost hiện tại trước khi chấp nhận từng callback, để các mã thông báo cũ từ lệnh gạch chéo đã bị xóa hoặc tạo lại sẽ ngừng được chấp nhận mà không cần khởi động lại gateway.
    - Xác thực callback đóng khi lỗi nếu Mattermost API không thể xác nhận lệnh vẫn còn hiện hành; các lần xác thực thất bại được lưu bộ nhớ đệm trong thời gian ngắn, các tra cứu đồng thời được gộp lại, và việc bắt đầu tra cứu mới được giới hạn tốc độ theo từng lệnh để giới hạn áp lực phát lại.
    - Callback gạch chéo đóng khi lỗi khi đăng ký thất bại, khởi động chỉ hoàn tất một phần, hoặc mã thông báo callback không khớp với mã thông báo đã đăng ký của lệnh đã phân giải (mã thông báo hợp lệ cho một lệnh không thể đi tới xác thực upstream cho lệnh khác).

  </Accordion>
  <Accordion title="Yêu cầu về khả năng truy cập">
    Điểm cuối callback phải truy cập được từ máy chủ Mattermost.

    - Không đặt `callbackUrl` thành `localhost` trừ khi Mattermost chạy trên cùng máy chủ/không gian tên mạng với OpenClaw.
    - Không đặt `callbackUrl` thành URL cơ sở Mattermost của bạn trừ khi URL đó reverse-proxy `/api/channels/mattermost/command` tới OpenClaw.
    - Cách kiểm tra nhanh là `curl https://<gateway-host>/api/channels/mattermost/command`; một GET phải trả về `405 Method Not Allowed` từ OpenClaw, không phải `404`.

  </Accordion>
  <Accordion title="Danh sách cho phép đầu ra Mattermost">
    Nếu callback của bạn nhắm tới địa chỉ riêng/tailnet/nội bộ, hãy đặt Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` để bao gồm máy chủ/miền callback.

    Dùng mục nhập máy chủ/miền, không dùng URL đầy đủ.

    - Đúng: `gateway.tailnet-name.ts.net`
    - Sai: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Biến môi trường (tài khoản mặc định)

Đặt các biến này trên máy chủ gateway nếu bạn muốn dùng biến môi trường:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Biến môi trường chỉ áp dụng cho tài khoản **mặc định** (`default`). Các tài khoản khác phải dùng giá trị cấu hình.

Không thể đặt `MATTERMOST_URL` từ `.env` của workspace; xem [Tệp `.env` của workspace](/vi/gateway/security).
</Note>

## Chế độ trò chuyện

Mattermost tự động phản hồi DM. Hành vi kênh được điều khiển bởi `chatmode`:

<Tabs>
  <Tab title="oncall (mặc định)">
    Chỉ phản hồi khi được @nhắc đến trong kênh.
  </Tab>
  <Tab title="onmessage">
    Phản hồi mọi tin nhắn kênh.
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

- `onchar` vẫn phản hồi các @nhắc đến rõ ràng.
- `channels.mattermost.requireMention` vẫn được tôn trọng cho cấu hình cũ, nhưng nên dùng `chatmode`.
- Sau khi bot gửi một phản hồi hiển thị trong một luồng kênh, các tin nhắn sau đó trong cùng luồng sẽ được trả lời mà không cần @nhắc đến mới hoặc tiền tố `onchar`, để các cuộc trò chuyện luồng nhiều lượt tiếp tục liền mạch. Việc tham gia được ghi nhớ trong 7 ngày không hoạt động của luồng (được làm mới ở mỗi phản hồi) và vẫn tồn tại qua các lần khởi động lại gateway. Các luồng mà bot chỉ quan sát sẽ không bị ảnh hưởng; bắt đầu một tin nhắn cấp cao mới để lại yêu cầu nhắc đến rõ ràng.

## Luồng và phiên

Dùng `channels.mattermost.replyToMode` để kiểm soát việc phản hồi kênh và nhóm ở lại kênh chính hay bắt đầu một luồng dưới bài đăng kích hoạt.

- `off` (mặc định): chỉ trả lời trong một luồng khi bài đăng đến đã ở trong một luồng.
- `first`: với bài đăng cấp cao trong kênh/nhóm, bắt đầu một luồng dưới bài đăng đó và định tuyến cuộc trò chuyện tới một phiên theo phạm vi luồng.
- `all`: hành vi giống `first` đối với Mattermost hiện nay.
- Tin nhắn trực tiếp bỏ qua thiết lập này và vẫn không theo luồng.

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
- `first` và `all` hiện tương đương vì sau khi Mattermost có gốc luồng, các phần tiếp theo và phương tiện sẽ tiếp tục trong cùng luồng đó.

## Kiểm soát truy cập (DM)

- Mặc định: `channels.mattermost.dmPolicy = "pairing"` (người gửi không xác định nhận mã ghép đôi).
- Phê duyệt qua:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM công khai: `channels.mattermost.dmPolicy="open"` cộng với `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` chấp nhận các mục nhập `accessGroup:<name>`. Xem [Nhóm truy cập](/vi/channels/access-groups).

## Kênh (nhóm)

- Mặc định: `channels.mattermost.groupPolicy = "allowlist"` (được kiểm soát bằng nhắc đến).
- Cho phép người gửi bằng `channels.mattermost.groupAllowFrom` (khuyến nghị dùng ID người dùng).
- `channels.mattermost.groupAllowFrom` chấp nhận các mục nhập `accessGroup:<name>`. Xem [Nhóm truy cập](/vi/channels/access-groups).
- Ghi đè nhắc đến theo từng kênh nằm dưới `channels.mattermost.groups.<channelId>.requireMention` hoặc `channels.mattermost.groups["*"].requireMention` cho mặc định.
- Khớp `@username` là có thể thay đổi và chỉ được bật khi `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Kênh mở: `channels.mattermost.groupPolicy="open"` (được kiểm soát bằng nhắc đến).
- Ghi chú thời gian chạy: nếu thiếu hoàn toàn `channels.mattermost`, thời gian chạy sẽ quay về `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi đã đặt `channels.defaults.groupPolicy`).

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
- `@username` cho một DM (được phân giải qua Mattermost API)

<Warning>
ID mờ không có tiền tố (như `64ifufp...`) là **mơ hồ** trong Mattermost (ID người dùng so với ID kênh).

OpenClaw phân giải chúng theo thứ tự **người dùng trước**:

- Nếu ID tồn tại dưới dạng người dùng (`GET /api/v4/users/<id>` thành công), OpenClaw gửi một **DM** bằng cách phân giải kênh trực tiếp qua `/api/v4/channels/direct`.
- Nếu không, ID được xem là **ID kênh**.

Nếu bạn cần hành vi xác định, luôn dùng các tiền tố rõ ràng (`user:<id>` / `channel:<id>`).
</Warning>

## Thử lại kênh DM

Khi OpenClaw gửi tới một đích DM Mattermost và cần phân giải kênh trực tiếp trước, mặc định OpenClaw sẽ thử lại các lỗi tạo kênh trực tiếp tạm thời.

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

- Điều này chỉ áp dụng cho việc tạo kênh DM (`/api/v4/channels/direct`), không phải mọi lệnh gọi Mattermost API.
- Thử lại áp dụng cho các lỗi tạm thời như giới hạn tốc độ, phản hồi 5xx, và lỗi mạng hoặc hết thời gian chờ.
- Lỗi máy khách 4xx ngoài `429` được xem là vĩnh viễn và không được thử lại.

## Phát trực tuyến bản xem trước

Mattermost phát trực tuyến suy nghĩ, hoạt động công cụ và văn bản phản hồi một phần vào một **bài đăng xem trước nháp** duy nhất, bài đăng này được hoàn tất tại chỗ khi câu trả lời cuối cùng an toàn để gửi. Bản xem trước cập nhật trên cùng id bài đăng thay vì làm tràn kênh bằng tin nhắn theo từng phần. Kết quả cuối cùng dạng phương tiện/lỗi hủy các chỉnh sửa bản xem trước đang chờ và dùng cơ chế gửi thông thường thay vì xả một bài đăng xem trước dùng rồi bỏ.

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
  <Accordion title="Chế độ phát trực tuyến">
    - `partial` là lựa chọn thường dùng: một bài đăng xem trước được chỉnh sửa khi phản hồi dài ra, rồi được hoàn tất với câu trả lời đầy đủ.
    - `block` dùng các phần nháp kiểu nối thêm bên trong bài đăng xem trước.
    - `progress` hiển thị bản xem trước trạng thái trong khi tạo và chỉ đăng câu trả lời cuối cùng khi hoàn tất.
    - `off` tắt phát trực tuyến bản xem trước.

  </Accordion>
  <Accordion title="Ghi chú về hành vi phát trực tuyến">
    - Nếu luồng không thể được hoàn tất tại chỗ (ví dụ bài đăng bị xóa giữa luồng), OpenClaw quay về gửi một bài đăng cuối cùng mới để phản hồi không bao giờ bị mất.
    - Payload chỉ chứa suy nghĩ bị chặn khỏi bài đăng kênh, bao gồm cả văn bản đến dưới dạng blockquote `> Thinking`. Đặt `/reasoning on` để xem suy nghĩ ở các bề mặt khác; bài đăng cuối cùng Mattermost chỉ giữ câu trả lời.
    - Xem [Phát trực tuyến](/vi/concepts/streaming#preview-streaming-modes) để biết ma trận ánh xạ kênh.

  </Accordion>
</AccordionGroup>

## Phản ứng (công cụ tin nhắn)

- Dùng `message action=react` với `channel=mattermost`.
- `messageId` là id bài đăng Mattermost.
- `emoji` chấp nhận tên như `thumbsup` hoặc `:+1:` (dấu hai chấm là tùy chọn).
- Đặt `remove=true` (boolean) để xóa một phản ứng.
- Sự kiện thêm/xóa phản ứng được chuyển tiếp dưới dạng sự kiện hệ thống tới phiên agent đã định tuyến.

Ví dụ:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Cấu hình:

- `channels.mattermost.actions.reactions`: bật/tắt hành động phản ứng (mặc định true).
- Ghi đè theo tài khoản: `channels.mattermost.accounts.<id>.actions.reactions`.

## Nút tương tác (công cụ tin nhắn)

Gửi tin nhắn với các nút có thể nhấp. Khi người dùng nhấp vào một nút, agent nhận lựa chọn và có thể phản hồi.

Các phản hồi thông thường của tác nhân cũng có thể bao gồm các tải trọng `presentation` ngữ nghĩa. OpenClaw hiển thị các nút giá trị dưới dạng nút tương tác Mattermost, giữ các nút URL hiển thị trong nội dung tin nhắn, và hạ cấp menu chọn thành văn bản dễ đọc.

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

Sử dụng `message action=send` với tham số `buttons`. Nút là một mảng 2D (các hàng nút):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Các trường của nút:

<ParamField path="text" type="string" required>
  Nhãn hiển thị.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Giá trị được gửi lại khi nhấp (được dùng làm ID hành động).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Kiểu nút.
</ParamField>

Khi người dùng nhấp vào một nút:

<Steps>
  <Step title="Buttons replaced with confirmation">
    Tất cả các nút được thay bằng một dòng xác nhận (ví dụ: "✓ **Yes** selected by @user").
  </Step>
  <Step title="Agent receives the selection">
    Tác nhân nhận lựa chọn dưới dạng tin nhắn đến và phản hồi.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - Callback của nút sử dụng xác minh HMAC-SHA256 (tự động, không cần cấu hình).
    - Mattermost loại bỏ dữ liệu callback khỏi phản hồi API của nó (tính năng bảo mật), vì vậy tất cả các nút sẽ bị xóa khi nhấp - không thể xóa một phần.
    - ID hành động chứa dấu gạch nối hoặc dấu gạch dưới được tự động làm sạch (giới hạn định tuyến của Mattermost).

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: mảng các chuỗi khả năng. Thêm `"inlineButtons"` để bật mô tả công cụ nút trong prompt hệ thống của tác nhân.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL cơ sở bên ngoài tùy chọn cho callback của nút (ví dụ `https://gateway.example.com`). Dùng tùy chọn này khi Mattermost không thể truy cập trực tiếp Gateway tại máy chủ bind của nó.
    - Trong các thiết lập nhiều tài khoản, bạn cũng có thể đặt cùng trường đó dưới `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Nếu bỏ qua `interactions.callbackBaseUrl`, OpenClaw suy ra URL callback từ `gateway.customBindHost` + `gateway.port`, rồi fallback về `http://localhost:<port>`.
    - Quy tắc khả năng truy cập: URL callback của nút phải truy cập được từ máy chủ Mattermost. `localhost` chỉ hoạt động khi Mattermost và OpenClaw chạy trên cùng máy chủ/không gian tên mạng.
    - Nếu đích callback của bạn là riêng tư/tailnet/nội bộ, hãy thêm máy chủ/miền của nó vào `ServiceSettings.AllowedUntrustedInternalConnections` của Mattermost.

  </Accordion>
</AccordionGroup>

### Tích hợp API trực tiếp (tập lệnh bên ngoài)

Các tập lệnh bên ngoài và Webhook có thể đăng nút trực tiếp qua Mattermost REST API thay vì đi qua công cụ `message` của tác nhân. Sử dụng `buildButtonAttachments()` từ Plugin khi có thể; nếu đăng JSON thô, hãy tuân theo các quy tắc sau:

**Cấu trúc tải trọng:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
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
2. Mọi hành động cần `type: "button"` - nếu thiếu, lượt nhấp sẽ bị nuốt âm thầm.
3. Mọi hành động cần trường `id` - Mattermost bỏ qua các hành động không có ID.
4. `id` của hành động phải **chỉ gồm chữ và số** (`[a-zA-Z0-9]`). Dấu gạch nối và dấu gạch dưới làm hỏng định tuyến hành động phía máy chủ của Mattermost (trả về 404). Hãy loại bỏ chúng trước khi dùng.
5. `context.action_id` phải khớp với `id` của nút để tin nhắn xác nhận hiển thị tên nút (ví dụ: "Approve") thay vì ID thô.
6. `context.action_id` là bắt buộc - trình xử lý tương tác trả về 400 nếu thiếu.

</Warning>

**Tạo token HMAC**

Gateway xác minh lượt nhấp nút bằng HMAC-SHA256. Các tập lệnh bên ngoài phải tạo token khớp với logic xác minh của Gateway:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    Tạo đối tượng context với tất cả các trường **ngoại trừ** `_token`.
  </Step>
  <Step title="Serialize with sorted keys">
    Tuần tự hóa với **khóa đã sắp xếp** và **không có khoảng trắng** (Gateway dùng `JSON.stringify` với khóa đã sắp xếp, tạo ra đầu ra gọn).
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    Thêm chuỗi hex digest thu được dưới dạng `_token` trong context.
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
  <Accordion title="Common HMAC pitfalls">
    - `json.dumps` của Python mặc định thêm khoảng trắng (`{"key": "val"}`). Dùng `separators=(",", ":")` để khớp với đầu ra gọn của JavaScript (`{"key":"val"}`).
    - Luôn ký **tất cả** các trường context (trừ `_token`). Gateway loại bỏ `_token` rồi ký mọi thứ còn lại. Ký một tập con sẽ khiến xác minh thất bại âm thầm.
    - Dùng `sort_keys=True` - Gateway sắp xếp khóa trước khi ký, và Mattermost có thể sắp xếp lại các trường context khi lưu tải trọng.
    - Suy ra secret từ bot token (xác định), không dùng byte ngẫu nhiên. Secret phải giống nhau giữa tiến trình tạo nút và Gateway xác minh.

  </Accordion>
</AccordionGroup>

## Bộ chuyển đổi thư mục

Plugin Mattermost bao gồm một bộ chuyển đổi thư mục phân giải tên kênh và tên người dùng qua Mattermost API. Điều này bật các đích `#channel-name` và `@username` trong `openclaw message send` cũng như các lần gửi Cron/Webhook.

Không cần cấu hình - bộ chuyển đổi dùng bot token từ cấu hình tài khoản.

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
  <Accordion title="No replies in channels">
    Đảm bảo bot có trong kênh và nhắc đến nó (oncall), dùng tiền tố kích hoạt (onchar), hoặc đặt `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - Kiểm tra bot token, URL cơ sở và tài khoản có được bật hay không.
    - Vấn đề nhiều tài khoản: biến môi trường chỉ áp dụng cho tài khoản `default`.

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`: OpenClaw không chấp nhận token callback. Nguyên nhân thường gặp:
      - đăng ký lệnh slash thất bại hoặc chỉ hoàn tất một phần khi khởi động
      - callback đang trỏ đến sai Gateway/tài khoản
      - Mattermost vẫn có các lệnh cũ trỏ đến đích callback trước đó
      - Gateway khởi động lại mà không kích hoạt lại lệnh slash
    - Nếu lệnh slash gốc ngừng hoạt động, hãy kiểm tra log để tìm `mattermost: failed to register slash commands` hoặc `mattermost: native slash commands enabled but no commands could be registered`.
    - Nếu bỏ qua `callbackUrl` và log cảnh báo rằng callback được phân giải thành `http://127.0.0.1:18789/...`, URL đó có lẽ chỉ truy cập được khi Mattermost chạy trên cùng máy chủ/không gian tên mạng với OpenClaw. Thay vào đó, hãy đặt `commands.callbackUrl` rõ ràng có thể truy cập từ bên ngoài.

  </Accordion>
  <Accordion title="Buttons issues">
    - Nút xuất hiện như hộp trắng: tác nhân có thể đang gửi dữ liệu nút sai định dạng. Kiểm tra rằng mỗi nút có cả hai trường `text` và `callback_data`.
    - Nút hiển thị nhưng nhấp không làm gì: xác minh `AllowedUntrustedInternalConnections` trong cấu hình máy chủ Mattermost bao gồm `127.0.0.1 localhost`, và `EnablePostActionIntegration` là `true` trong ServiceSettings.
    - Nút trả về 404 khi nhấp: `id` của nút có thể chứa dấu gạch nối hoặc dấu gạch dưới. Bộ định tuyến hành động của Mattermost bị lỗi với ID không phải chữ-số. Chỉ dùng `[a-zA-Z0-9]`.
    - Log Gateway báo `invalid _token`: HMAC không khớp. Kiểm tra rằng bạn ký tất cả các trường context (không phải một tập con), dùng khóa đã sắp xếp, và dùng JSON gọn (không có khoảng trắng). Xem phần HMAC ở trên.
    - Log Gateway báo `missing _token in context`: trường `_token` không nằm trong context của nút. Đảm bảo trường này được đưa vào khi tạo tải trọng tích hợp.
    - Xác nhận hiển thị ID thô thay vì tên nút: `context.action_id` không khớp với `id` của nút. Đặt cả hai thành cùng một giá trị đã làm sạch.
    - Tác nhân không biết về nút: thêm `capabilities: ["inlineButtons"]` vào cấu hình kênh Mattermost.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và cổng nhắc đến
- [Ghép nối](/vi/channels/pairing) - xác thực DM và luồng ghép nối
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và gia cố
