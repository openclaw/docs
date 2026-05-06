---
read_when:
    - Thiết lập Mattermost
    - Gỡ lỗi định tuyến Mattermost
sidebarTitle: Mattermost
summary: Thiết lập bot Mattermost và cấu hình OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-06T09:03:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 784138a30529971b4f80a1a764eef8992f6a8290a6032e34abae864e52dc212b
    source_path: channels/mattermost.md
    workflow: 16
---

Trạng thái: Plugin có thể tải xuống (mã thông báo bot + sự kiện WebSocket). Hỗ trợ kênh, nhóm và DM. Mattermost là một nền tảng nhắn tin nhóm có thể tự lưu trữ; xem trang chính thức tại [mattermost.com](https://mattermost.com) để biết chi tiết sản phẩm và tải xuống.

## Cài đặt

Cài đặt Mattermost trước khi cấu hình kênh:

<Tabs>
  <Tab title="npm registry">
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
    Các bản phát hành OpenClaw đóng gói hiện tại đã đi kèm Plugin này. Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
  </Step>
  <Step title="Tạo bot Mattermost">
    Tạo tài khoản bot Mattermost và sao chép **mã thông báo bot**.
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

## Lệnh gạch chéo gốc

Lệnh gạch chéo gốc là tùy chọn bật. Khi được bật, OpenClaw đăng ký các lệnh gạch chéo `oc_*` qua Mattermost API và nhận các POST gọi lại trên máy chủ HTTP của Gateway.

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
    - Nếu bỏ qua `callbackUrl`, OpenClaw suy ra một URL từ máy chủ/cổng Gateway + `callbackPath`.
    - Với thiết lập nhiều tài khoản, có thể đặt `commands` ở cấp cao nhất hoặc dưới `channels.mattermost.accounts.<id>.commands` (giá trị của tài khoản ghi đè các trường cấp cao nhất).
    - Các lệnh gọi lại được xác thực bằng mã thông báo theo từng lệnh do Mattermost trả về khi OpenClaw đăng ký các lệnh `oc_*`.
    - OpenClaw làm mới đăng ký lệnh Mattermost hiện tại trước khi chấp nhận từng lệnh gọi lại để các mã thông báo cũ từ lệnh gạch chéo đã xóa hoặc tạo lại ngừng được chấp nhận mà không cần khởi động lại Gateway.
    - Xác thực lệnh gọi lại đóng khi thất bại nếu Mattermost API không thể xác nhận lệnh vẫn là hiện tại; các lần xác thực thất bại được lưu tạm trong thời gian ngắn, các lượt tra cứu đồng thời được gộp lại, và các lượt bắt đầu tra cứu mới được giới hạn tốc độ theo từng lệnh để giới hạn áp lực phát lại.
    - Lệnh gọi lại gạch chéo đóng khi thất bại nếu đăng ký thất bại, khởi động chỉ hoàn tất một phần, hoặc mã thông báo gọi lại không khớp với mã thông báo đã đăng ký của lệnh đã phân giải (một mã thông báo hợp lệ cho một lệnh không thể tới bước xác thực ngược dòng cho một lệnh khác).

  </Accordion>
  <Accordion title="Yêu cầu về khả năng truy cập">
    Điểm cuối gọi lại phải có thể truy cập được từ máy chủ Mattermost.

    - Không đặt `callbackUrl` thành `localhost` trừ khi Mattermost chạy trên cùng máy chủ/không gian tên mạng với OpenClaw.
    - Không đặt `callbackUrl` thành URL cơ sở Mattermost của bạn trừ khi URL đó reverse-proxy `/api/channels/mattermost/command` tới OpenClaw.
    - Kiểm tra nhanh là `curl https://<gateway-host>/api/channels/mattermost/command`; một yêu cầu GET nên trả về `405 Method Not Allowed` từ OpenClaw, không phải `404`.

  </Accordion>
  <Accordion title="Danh sách cho phép lưu lượng ra Mattermost">
    Nếu lệnh gọi lại của bạn nhắm tới địa chỉ riêng/tailnet/nội bộ, hãy đặt Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` để bao gồm máy chủ/miền gọi lại.

    Dùng mục nhập máy chủ/miền, không dùng URL đầy đủ.

    - Tốt: `gateway.tailnet-name.ts.net`
    - Không tốt: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Biến môi trường (tài khoản mặc định)

Đặt các biến này trên máy chủ Gateway nếu bạn muốn dùng biến môi trường:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Biến môi trường chỉ áp dụng cho tài khoản **mặc định** (`default`). Các tài khoản khác phải dùng giá trị cấu hình.

Không thể đặt `MATTERMOST_URL` từ một `.env` của workspace; xem [Tệp `.env` của workspace](/vi/gateway/security).
</Note>

## Chế độ trò chuyện

Mattermost tự động phản hồi DM. Hành vi kênh được kiểm soát bởi `chatmode`:

<Tabs>
  <Tab title="oncall (mặc định)">
    Chỉ phản hồi khi được @nhắc đến trong kênh.
  </Tab>
  <Tab title="onmessage">
    Phản hồi mọi tin nhắn kênh.
  </Tab>
  <Tab title="onchar">
    Phản hồi khi một tin nhắn bắt đầu bằng tiền tố kích hoạt.
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

- `onchar` vẫn phản hồi các @đề cập rõ ràng.
- `channels.mattermost.requireMention` được tôn trọng cho cấu hình cũ nhưng nên dùng `chatmode`.

## Luồng và phiên

Dùng `channels.mattermost.replyToMode` để kiểm soát việc trả lời trong kênh và nhóm ở lại kênh chính hay bắt đầu một luồng dưới bài đăng kích hoạt.

- `off` (mặc định): chỉ trả lời trong một luồng khi bài đăng đến đã ở trong một luồng.
- `first`: với bài đăng kênh/nhóm cấp cao nhất, bắt đầu một luồng dưới bài đăng đó và định tuyến cuộc trò chuyện tới một phiên theo phạm vi luồng.
- `all`: hiện tại có cùng hành vi như `first` đối với Mattermost.
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

- Các phiên theo phạm vi luồng dùng id bài đăng kích hoạt làm gốc luồng.
- `first` và `all` hiện tương đương vì sau khi Mattermost có gốc luồng, các đoạn tiếp theo và phương tiện tiếp tục trong cùng luồng đó.

## Kiểm soát truy cập (DM)

- Mặc định: `channels.mattermost.dmPolicy = "pairing"` (người gửi không xác định nhận mã ghép nối).
- Phê duyệt qua:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM công khai: `channels.mattermost.dmPolicy="open"` cộng với `channels.mattermost.allowFrom=["*"]`.

## Kênh (nhóm)

- Mặc định: `channels.mattermost.groupPolicy = "allowlist"` (bị chặn bởi yêu cầu đề cập).
- Cho phép người gửi bằng `channels.mattermost.groupAllowFrom` (khuyến nghị dùng ID người dùng).
- Ghi đè đề cập theo từng kênh nằm dưới `channels.mattermost.groups.<channelId>.requireMention` hoặc `channels.mattermost.groups["*"].requireMention` cho mặc định.
- So khớp `@username` có thể thay đổi và chỉ được bật khi `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Kênh mở: `channels.mattermost.groupPolicy="open"` (bị chặn bởi yêu cầu đề cập).
- Ghi chú runtime: nếu `channels.mattermost` hoàn toàn thiếu, runtime quay về `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi `channels.defaults.groupPolicy` được đặt).

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
Các ID mờ không có tiền tố (như `64ifufp...`) là **mơ hồ** trong Mattermost (ID người dùng so với ID kênh).

OpenClaw phân giải chúng theo hướng **người dùng trước**:

- Nếu ID tồn tại dưới dạng người dùng (`GET /api/v4/users/<id>` thành công), OpenClaw gửi một **DM** bằng cách phân giải kênh trực tiếp qua `/api/v4/channels/direct`.
- Nếu không, ID được xem là **ID kênh**.

Nếu bạn cần hành vi xác định, hãy luôn dùng các tiền tố rõ ràng (`user:<id>` / `channel:<id>`).
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

- Điều này chỉ áp dụng cho việc tạo kênh DM (`/api/v4/channels/direct`), không phải mọi lệnh gọi Mattermost API.
- Thử lại áp dụng cho các lỗi tạm thời như giới hạn tốc độ, phản hồi 5xx, và lỗi mạng hoặc hết thời gian chờ.
- Lỗi máy khách 4xx ngoài `429` được xem là vĩnh viễn và không được thử lại.

## Truyền phát bản xem trước

Mattermost truyền phát suy nghĩ, hoạt động công cụ và văn bản trả lời một phần vào một **bài đăng xem trước nháp** duy nhất, được hoàn tất tại chỗ khi câu trả lời cuối cùng an toàn để gửi. Bản xem trước cập nhật trên cùng id bài đăng thay vì làm đầy kênh bằng tin nhắn theo từng đoạn. Kết quả cuối cùng là phương tiện/lỗi sẽ hủy các chỉnh sửa bản xem trước đang chờ và dùng cách gửi bình thường thay vì đẩy ra một bài đăng xem trước dùng một lần.

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
  <Accordion title="Chế độ truyền phát">
    - `partial` là lựa chọn thông thường: một bài đăng xem trước được chỉnh sửa khi câu trả lời dài thêm, rồi được hoàn tất với câu trả lời đầy đủ.
    - `block` dùng các đoạn nháp kiểu nối thêm bên trong bài đăng xem trước.
    - `progress` hiển thị bản xem trước trạng thái trong khi tạo và chỉ đăng câu trả lời cuối cùng khi hoàn tất.
    - `off` tắt truyền phát bản xem trước.

  </Accordion>
  <Accordion title="Ghi chú hành vi truyền phát">
    - Nếu luồng không thể được hoàn tất tại chỗ (ví dụ bài đăng bị xóa giữa luồng), OpenClaw quay về gửi một bài đăng cuối cùng mới để câu trả lời không bao giờ bị mất.
    - Payload chỉ có suy luận bị ẩn khỏi bài đăng kênh, bao gồm văn bản đến dưới dạng blockquote `> Reasoning:`. Đặt `/reasoning on` để xem suy nghĩ ở các bề mặt khác; bài đăng Mattermost cuối cùng chỉ giữ câu trả lời.
    - Xem [Truyền phát](/vi/concepts/streaming#preview-streaming-modes) để biết ma trận ánh xạ kênh.

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

Gửi tin nhắn có nút có thể nhấp. Khi người dùng nhấp vào nút, agent nhận lựa chọn và có thể phản hồi.

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

Trường nút:

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
  <Step title="Các nút được thay bằng xác nhận">
    Tất cả nút được thay bằng một dòng xác nhận (ví dụ: "✓ **Yes** selected by @user").
  </Step>
  <Step title="Agent nhận lựa chọn">
    Agent nhận lựa chọn dưới dạng tin nhắn đến và phản hồi.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Ghi chú triển khai">
    - Callback của nút dùng xác minh HMAC-SHA256 (tự động, không cần cấu hình).
    - Mattermost loại bỏ dữ liệu callback khỏi phản hồi API của nó (tính năng bảo mật), nên tất cả nút bị xóa khi nhấp - không thể xóa một phần.
    - ID hành động chứa dấu gạch nối hoặc dấu gạch dưới được tự động chuẩn hóa (giới hạn định tuyến của Mattermost).

  </Accordion>
  <Accordion title="Cấu hình và khả năng truy cập">
    - `channels.mattermost.capabilities`: mảng các chuỗi capability. Thêm `"inlineButtons"` để bật mô tả công cụ nút trong lời nhắc hệ thống của agent.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL cơ sở bên ngoài tùy chọn cho callback của nút (ví dụ `https://gateway.example.com`). Dùng khi Mattermost không thể truy cập Gateway trực tiếp tại bind host của nó.
    - Trong thiết lập nhiều tài khoản, bạn cũng có thể đặt cùng trường này dưới `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Nếu bỏ qua `interactions.callbackBaseUrl`, OpenClaw suy ra URL callback từ `gateway.customBindHost` + `gateway.port`, rồi dự phòng về `http://localhost:<port>`.
    - Quy tắc khả năng truy cập: URL callback của nút phải có thể truy cập được từ máy chủ Mattermost. `localhost` chỉ hoạt động khi Mattermost và OpenClaw chạy trên cùng host/namespace mạng.
    - Nếu đích callback của bạn là riêng tư/tailnet/nội bộ, hãy thêm host/domain của nó vào Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`.

  </Accordion>
</AccordionGroup>

### Tích hợp API trực tiếp (script bên ngoài)

Script bên ngoài và webhook có thể đăng nút trực tiếp qua Mattermost REST API thay vì đi qua công cụ `message` của agent. Dùng `buildButtonAttachments()` từ Plugin khi có thể; nếu đăng JSON thô, hãy làm theo các quy tắc sau:

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

1. Attachment nằm trong `props.attachments`, không phải `attachments` cấp cao nhất (bị bỏ qua âm thầm).
2. Mọi hành động cần `type: "button"` - nếu không có, lượt nhấp sẽ bị nuốt âm thầm.
3. Mọi hành động cần trường `id` - Mattermost bỏ qua hành động không có ID.
4. `id` của hành động phải **chỉ gồm chữ và số** (`[a-zA-Z0-9]`). Dấu gạch nối và dấu gạch dưới làm hỏng định tuyến hành động phía máy chủ của Mattermost (trả về 404). Hãy loại bỏ chúng trước khi dùng.
5. `context.action_id` phải khớp với `id` của nút để thông báo xác nhận hiển thị tên nút (ví dụ: "Approve") thay vì ID thô.
6. `context.action_id` là bắt buộc - trình xử lý tương tác trả về 400 nếu thiếu.

</Warning>

**Tạo token HMAC**

Gateway xác minh lượt nhấp nút bằng HMAC-SHA256. Script bên ngoài phải tạo token khớp với logic xác minh của Gateway:

<Steps>
  <Step title="Suy ra secret từ bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Tạo đối tượng context">
    Tạo đối tượng context với tất cả trường **ngoại trừ** `_token`.
  </Step>
  <Step title="Serialize với khóa đã sắp xếp">
    Serialize với **khóa đã sắp xếp** và **không có khoảng trắng** (Gateway dùng `JSON.stringify` với khóa đã sắp xếp, tạo đầu ra gọn).
  </Step>
  <Step title="Ký payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Thêm token">
    Thêm hex digest thu được làm `_token` trong context.
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
    - Luôn ký **tất cả** trường context (trừ `_token`). Gateway loại bỏ `_token` rồi ký mọi thứ còn lại. Ký một tập con sẽ gây lỗi xác minh âm thầm.
    - Dùng `sort_keys=True` - Gateway sắp xếp khóa trước khi ký, và Mattermost có thể sắp xếp lại các trường context khi lưu payload.
    - Suy ra secret từ bot token (xác định), không phải byte ngẫu nhiên. Secret phải giống nhau giữa tiến trình tạo nút và Gateway xác minh.

  </Accordion>
</AccordionGroup>

## Bộ chuyển đổi thư mục

Plugin Mattermost bao gồm một bộ chuyển đổi thư mục để phân giải tên kênh và người dùng qua Mattermost API. Điều này cho phép các đích `#channel-name` và `@username` trong `openclaw message send` và các lần gửi cron/webhook.

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
  <Accordion title="Không có phản hồi trong kênh">
    Đảm bảo bot ở trong kênh và nhắc đến nó (oncall), dùng tiền tố kích hoạt (onchar), hoặc đặt `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Lỗi xác thực hoặc nhiều tài khoản">
    - Kiểm tra bot token, URL cơ sở, và tài khoản có được bật hay không.
    - Vấn đề nhiều tài khoản: biến môi trường chỉ áp dụng cho tài khoản `default`.

  </Accordion>
  <Accordion title="Lệnh slash gốc thất bại">
    - `Unauthorized: invalid command token.`: OpenClaw không chấp nhận callback token. Nguyên nhân thường gặp:
      - đăng ký lệnh slash thất bại hoặc chỉ hoàn tất một phần khi khởi động
      - callback đang trỏ tới sai Gateway/tài khoản
      - Mattermost vẫn có lệnh cũ trỏ tới đích callback trước đó
      - Gateway khởi động lại mà không kích hoạt lại lệnh slash
    - Nếu lệnh slash gốc ngừng hoạt động, hãy kiểm tra log để tìm `mattermost: failed to register slash commands` hoặc `mattermost: native slash commands enabled but no commands could be registered`.
    - Nếu bỏ qua `callbackUrl` và log cảnh báo rằng callback được phân giải thành `http://127.0.0.1:18789/...`, URL đó có lẽ chỉ truy cập được khi Mattermost chạy trên cùng host/namespace mạng với OpenClaw. Thay vào đó, hãy đặt `commands.callbackUrl` rõ ràng có thể truy cập từ bên ngoài.

  </Accordion>
  <Accordion title="Vấn đề với nút">
    - Nút xuất hiện dưới dạng hộp trắng: agent có thể đang gửi dữ liệu nút sai định dạng. Kiểm tra rằng mỗi nút có cả hai trường `text` và `callback_data`.
    - Nút hiển thị nhưng nhấp không có tác dụng: xác minh `AllowedUntrustedInternalConnections` trong cấu hình máy chủ Mattermost bao gồm `127.0.0.1 localhost`, và `EnablePostActionIntegration` là `true` trong ServiceSettings.
    - Nút trả về 404 khi nhấp: `id` của nút có thể chứa dấu gạch nối hoặc dấu gạch dưới. Bộ định tuyến hành động của Mattermost hỏng với ID không phải chữ và số. Chỉ dùng `[a-zA-Z0-9]`.
    - Log Gateway báo `invalid _token`: HMAC không khớp. Kiểm tra rằng bạn ký tất cả trường context (không phải một tập con), dùng khóa đã sắp xếp, và dùng JSON gọn (không có khoảng trắng). Xem phần HMAC ở trên.
    - Log Gateway báo `missing _token in context`: trường `_token` không nằm trong context của nút. Đảm bảo nó được đưa vào khi tạo payload tích hợp.
    - Xác nhận hiển thị ID thô thay vì tên nút: `context.action_id` không khớp với `id` của nút. Đặt cả hai thành cùng một giá trị đã chuẩn hóa.
    - Agent không biết về nút: thêm `capabilities: ["inlineButtons"]` vào cấu hình kênh Mattermost.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Tổng quan về kênh](/vi/channels) - tất cả kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và kiểm soát nhắc đến
- [Ghép đôi](/vi/channels/pairing) - xác thực DM và luồng ghép đôi
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và gia cố
