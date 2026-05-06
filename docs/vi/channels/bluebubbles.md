---
read_when:
    - Thiết lập kênh BlueBubbles
    - Khắc phục sự cố ghép nối Webhook
    - Cấu hình iMessage trên macOS
sidebarTitle: BlueBubbles
summary: iMessage qua máy chủ macOS BlueBubbles (gửi/nhận qua REST, trạng thái đang nhập, phản ứng, ghép đôi, hành động nâng cao).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-06T09:02:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f2308a016826addc1098937d764b753ee08f3e86f39b0657c930a12b486793f
    source_path: channels/bluebubbles.md
    workflow: 16
---

Trạng thái: Plugin được đóng gói kèm, giao tiếp với máy chủ BlueBubbles macOS qua HTTP. **Được khuyến nghị cho tích hợp iMessage** nhờ API phong phú hơn và thiết lập dễ hơn so với kênh imsg cũ.

<Note>
Các bản phát hành OpenClaw hiện tại đóng gói kèm BlueBubbles, nên các bản dựng đóng gói thông thường không cần bước `openclaw plugins install` riêng.
</Note>

## Tổng quan

- Chạy trên macOS thông qua ứng dụng trợ giúp BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Được khuyến nghị/đã kiểm thử: macOS Sequoia (15). macOS Tahoe (26) hoạt động; tính năng chỉnh sửa hiện đang hỏng trên Tahoe, và cập nhật biểu tượng nhóm có thể báo thành công nhưng không đồng bộ.
- OpenClaw giao tiếp với nó qua REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Tin nhắn đến được nhận qua webhooks; trả lời đi, chỉ báo đang nhập, biên nhận đã đọc và tapback là các lệnh gọi REST.
- Tệp đính kèm và nhãn dán được nạp dưới dạng phương tiện đầu vào (và được hiển thị cho agent khi có thể).
- Trả lời Auto-TTS tổng hợp âm thanh MP3 hoặc CAF được gửi dưới dạng bong bóng ghi âm iMessage thay vì tệp đính kèm thông thường.
- Ghép cặp/danh sách cho phép hoạt động giống như các kênh khác (`/channels/pairing` v.v.) với `channels.bluebubbles.allowFrom` + mã ghép cặp.
- Phản ứng được hiển thị dưới dạng sự kiện hệ thống giống như Slack/Telegram để agent có thể "nhắc đến" chúng trước khi trả lời.
- Tính năng nâng cao: chỉnh sửa, thu hồi gửi, luồng trả lời, hiệu ứng tin nhắn, quản lý nhóm.

## Bắt đầu nhanh

<Steps>
  <Step title="Cài đặt BlueBubbles">
    Cài đặt máy chủ BlueBubbles trên Mac của bạn (làm theo hướng dẫn tại [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Bật web API">
    Trong cấu hình BlueBubbles, bật web API và đặt mật khẩu.
  </Step>
  <Step title="Cấu hình OpenClaw">
    Chạy `openclaw onboard` và chọn BlueBubbles, hoặc cấu hình thủ công:

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="Trỏ webhooks đến gateway">
    Trỏ webhooks của BlueBubbles đến gateway của bạn (ví dụ: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Khởi động gateway">
    Khởi động gateway; nó sẽ đăng ký trình xử lý webhook và bắt đầu ghép cặp.
  </Step>
</Steps>

<Warning>
**Bảo mật**

- Luôn đặt mật khẩu webhook.
- Xác thực webhook luôn bắt buộc. OpenClaw từ chối yêu cầu webhook BlueBubbles trừ khi chúng bao gồm password/guid khớp với `channels.bluebubbles.password` (ví dụ `?password=<password>` hoặc `x-password`), bất kể cấu trúc local loopback/proxy.
- Xác thực mật khẩu được kiểm tra trước khi đọc/phân tích cú pháp toàn bộ nội dung webhook.

</Warning>

## Giữ Messages.app hoạt động (thiết lập VM / headless)

Một số thiết lập macOS VM / luôn bật có thể khiến Messages.app chuyển sang trạng thái "nhàn rỗi" (sự kiện đến dừng cho đến khi ứng dụng được mở/đưa lên foreground). Cách xử lý đơn giản là **chạm vào Messages mỗi 5 phút** bằng AppleScript + LaunchAgent.

<Steps>
  <Step title="Lưu AppleScript">
    Lưu nội dung này dưới dạng `~/Scripts/poke-messages.scpt`:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="Cài đặt LaunchAgent">
    Lưu nội dung này dưới dạng `~/Library/LaunchAgents/com.user.poke-messages.plist`:

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    Lệnh này chạy **mỗi 300 giây** và **khi đăng nhập**. Lần chạy đầu tiên có thể kích hoạt lời nhắc **Automation** của macOS (`osascript` → Messages). Hãy phê duyệt chúng trong cùng phiên người dùng chạy LaunchAgent.

  </Step>
  <Step title="Tải nó">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Thiết lập ban đầu

BlueBubbles có sẵn trong quy trình thiết lập ban đầu tương tác:

```
openclaw onboard
```

Trình hướng dẫn sẽ hỏi:

<ParamField path="Server URL" type="string" required>
  Địa chỉ máy chủ BlueBubbles (ví dụ: `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  Mật khẩu API từ cài đặt BlueBubbles Server.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Đường dẫn endpoint Webhook.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open`, hoặc `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Số điện thoại, email hoặc mục tiêu chat.
</ParamField>

Bạn cũng có thể thêm BlueBubbles qua CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kiểm soát truy cập (DM + nhóm)

<Tabs>
  <Tab title="DM">
    - Mặc định: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Người gửi không xác định nhận được mã ghép cặp; tin nhắn bị bỏ qua cho đến khi được phê duyệt (mã hết hạn sau 1 giờ).
    - Phê duyệt qua:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Ghép cặp là cơ chế trao đổi token mặc định. Chi tiết: [Ghép cặp](/vi/channels/pairing)

  </Tab>
  <Tab title="Nhóm">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (mặc định: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` kiểm soát ai có thể kích hoạt trong nhóm khi `allowlist` được đặt.

  </Tab>
</Tabs>

### Làm giàu tên liên hệ (macOS, tùy chọn)

Webhooks nhóm BlueBubbles thường chỉ bao gồm địa chỉ người tham gia thô. Nếu bạn muốn ngữ cảnh `GroupMembers` hiển thị tên liên hệ cục bộ thay vào đó, bạn có thể chọn bật làm giàu từ Contacts cục bộ trên macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` bật tra cứu. Mặc định: `false`.
- Tra cứu chỉ chạy sau khi quyền truy cập nhóm, ủy quyền lệnh và cổng nhắc đến đã cho phép tin nhắn đi qua.
- Chỉ những người tham gia bằng số điện thoại chưa có tên mới được làm giàu.
- Số điện thoại thô vẫn là phương án dự phòng khi không tìm thấy kết quả khớp cục bộ.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Cổng nhắc đến (nhóm)

BlueBubbles hỗ trợ cổng nhắc đến cho chat nhóm, khớp với hành vi iMessage/WhatsApp:

- Dùng `agents.list[].groupChat.mentionPatterns` (hoặc `messages.groupChat.mentionPatterns`) để phát hiện nhắc đến.
- Khi `requireMention` được bật cho một nhóm, agent chỉ phản hồi khi được nhắc đến.
- Lệnh điều khiển từ người gửi được ủy quyền bỏ qua cổng nhắc đến.

Cấu hình theo nhóm:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Cổng lệnh

- Lệnh điều khiển (ví dụ: `/config`, `/model`) yêu cầu ủy quyền.
- Dùng `allowFrom` và `groupAllowFrom` để xác định ủy quyền lệnh.
- Người gửi được ủy quyền có thể chạy lệnh điều khiển ngay cả khi không nhắc đến trong nhóm.

### System prompt theo nhóm

Mỗi mục trong `channels.bluebubbles.groups.*` chấp nhận chuỗi `systemPrompt` tùy chọn. Giá trị này được chèn vào system prompt của agent trong mọi lượt xử lý tin nhắn trong nhóm đó, vì vậy bạn có thể đặt persona hoặc quy tắc hành vi theo nhóm mà không cần chỉnh sửa prompt của agent:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

Khóa khớp với bất kỳ giá trị nào BlueBubbles báo cáo dưới dạng `chatGuid` / `chatIdentifier` / `chatId` dạng số cho nhóm, và mục wildcard `"*"` cung cấp mặc định cho mọi nhóm không có kết quả khớp chính xác (cùng mẫu được dùng bởi `requireMention` và chính sách công cụ theo nhóm). Kết quả khớp chính xác luôn thắng wildcard. DM bỏ qua trường này; thay vào đó hãy dùng tùy chỉnh prompt cấp agent hoặc cấp tài khoản.

#### Ví dụ thực tế: trả lời theo luồng và phản ứng tapback (Private API)

Khi BlueBubbles Private API được bật, tin nhắn đầu vào đi kèm ID tin nhắn ngắn (ví dụ `[[reply_to:5]]`) và agent có thể gọi `action=reply` để đưa trả lời vào luồng của một tin nhắn cụ thể hoặc `action=react` để thả tapback. `systemPrompt` theo nhóm là cách đáng tin cậy để giữ cho agent chọn đúng công cụ:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Cả phản ứng tapback và trả lời theo luồng đều yêu cầu BlueBubbles Private API; xem [Hành động nâng cao](#advanced-actions) và [ID tin nhắn](#message-ids-short-vs-full) để biết cơ chế bên dưới.

## Liên kết cuộc trò chuyện ACP

Chat BlueBubbles có thể được chuyển thành workspace ACP bền vững mà không cần thay đổi lớp truyền tải.

Luồng nhanh cho operator:

- Chạy `/acp spawn codex --bind here` bên trong DM hoặc chat nhóm được cho phép.
- Tin nhắn sau này trong cùng cuộc trò chuyện BlueBubbles đó sẽ được định tuyến đến phiên ACP đã spawn.
- `/new` và `/reset` đặt lại cùng phiên ACP đã liên kết tại chỗ.
- `/acp close` đóng phiên ACP và xóa liên kết.

Liên kết bền vững đã cấu hình cũng được hỗ trợ thông qua các mục `bindings[]` cấp cao nhất với `type: "acp"` và `match.channel: "bluebubbles"`.

`match.peer.id` có thể dùng bất kỳ dạng mục tiêu BlueBubbles nào được hỗ trợ:

- handle DM đã chuẩn hóa như `+15555550123` hoặc `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Đối với liên kết nhóm ổn định, ưu tiên `chat_id:*` hoặc `chat_identifier:*`.

Ví dụ:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Xem [Agent ACP](/vi/tools/acp-agents) để biết hành vi liên kết ACP dùng chung.

## Đang nhập + biên nhận đã đọc

- **Chỉ báo đang nhập**: Được gửi tự động trước và trong khi tạo phản hồi.
- **Biên nhận đã đọc**: Được kiểm soát bởi `channels.bluebubbles.sendReadReceipts` (mặc định: `true`).
- **Chỉ báo đang nhập**: OpenClaw gửi sự kiện bắt đầu đang nhập; BlueBubbles tự động xóa trạng thái đang nhập khi gửi hoặc hết thời gian chờ (dừng thủ công qua DELETE không đáng tin cậy).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
    },
  },
}
```

## Hành động nâng cao

BlueBubbles hỗ trợ các hành động tin nhắn nâng cao khi được bật trong cấu hình:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Các hành động có sẵn">
    - **react**: Thêm/xóa phản ứng tapback (`messageId`, `emoji`, `remove`). Bộ tapback gốc của iMessage là `love`, `like`, `dislike`, `laugh`, `emphasize` và `question`. Khi một agent chọn emoji ngoài bộ đó (ví dụ `👀`), công cụ phản ứng sẽ chuyển dự phòng sang `love` để tapback vẫn hiển thị thay vì làm hỏng toàn bộ yêu cầu. Các phản ứng xác nhận đã cấu hình vẫn được kiểm tra nghiêm ngặt và báo lỗi với giá trị không xác định.
    - **edit**: Chỉnh sửa một tin nhắn đã gửi (`messageId`, `text`).
    - **unsend**: Thu hồi một tin nhắn (`messageId`).
    - **reply**: Trả lời một tin nhắn cụ thể (`messageId`, `text`, `to`).
    - **sendWithEffect**: Gửi kèm hiệu ứng iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Đổi tên một cuộc trò chuyện nhóm (`chatGuid`, `displayName`).
    - **setGroupIcon**: Đặt biểu tượng/ảnh của cuộc trò chuyện nhóm (`chatGuid`, `media`) - không ổn định trên macOS 26 Tahoe (API có thể trả về thành công nhưng biểu tượng không đồng bộ).
    - **addParticipant**: Thêm ai đó vào một nhóm (`chatGuid`, `address`).
    - **removeParticipant**: Xóa ai đó khỏi một nhóm (`chatGuid`, `address`).
    - **leaveGroup**: Rời khỏi một cuộc trò chuyện nhóm (`chatGuid`).
    - **upload-file**: Gửi phương tiện/tệp (`to`, `buffer`, `filename`, `asVoice`).
      - Ghi âm thoại: đặt `asVoice: true` với âm thanh **MP3** hoặc **CAF** để gửi dưới dạng tin nhắn thoại iMessage. BlueBubbles chuyển đổi MP3 → CAF khi gửi ghi âm thoại.
    - Bí danh cũ: `sendAttachment` vẫn hoạt động, nhưng `upload-file` là tên hành động chuẩn.

  </Accordion>
</AccordionGroup>

### ID tin nhắn (ngắn và đầy đủ)

OpenClaw có thể hiển thị ID tin nhắn _ngắn_ (ví dụ `1`, `2`) để tiết kiệm token.

- `MessageSid` / `ReplyToId` có thể là ID ngắn.
- `MessageSidFull` / `ReplyToIdFull` chứa ID đầy đủ của provider.
- ID ngắn nằm trong bộ nhớ; chúng có thể hết hạn khi khởi động lại hoặc khi cache bị loại bỏ.
- Hành động chấp nhận `messageId` ngắn hoặc đầy đủ, nhưng ID ngắn sẽ báo lỗi nếu không còn khả dụng.

Dùng ID đầy đủ cho tự động hóa và lưu trữ bền vững:

- Mẫu: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Ngữ cảnh: `MessageSidFull` / `ReplyToIdFull` trong payload đến

Xem [Cấu hình](/vi/gateway/configuration) để biết các biến mẫu.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Gộp DM gửi tách (lệnh + URL trong một lần soạn)

Khi người dùng nhập một lệnh và một URL cùng nhau trong iMessage - ví dụ `Dump https://example.com/article` - Apple tách lần gửi thành **hai lần gửi webhook riêng biệt**:

1. Một tin nhắn văn bản (`"Dump"`).
2. Một bong bóng xem trước URL (`"https://..."`) với ảnh xem trước OG dưới dạng tệp đính kèm.

Hai webhook đến OpenClaw cách nhau khoảng 0,8-2,0 giây trên hầu hết thiết lập. Nếu không gộp, agent nhận riêng lệnh ở lượt 1, trả lời (thường là "gửi cho tôi URL"), và chỉ thấy URL ở lượt 2 - lúc đó ngữ cảnh lệnh đã bị mất.

`channels.bluebubbles.coalesceSameSenderDms` chọn gộp các webhook liên tiếp từ cùng một người gửi trong DM thành một lượt agent duy nhất. Cuộc trò chuyện nhóm tiếp tục dùng khóa theo từng tin nhắn để giữ nguyên cấu trúc lượt của nhiều người dùng.

<Tabs>
  <Tab title="Khi nào bật">
    Bật khi:

    - Bạn cung cấp Skills kỳ vọng `command + payload` trong một tin nhắn (dump, paste, save, queue, v.v.).
    - Người dùng của bạn dán URL, hình ảnh hoặc nội dung dài cùng với lệnh.
    - Bạn có thể chấp nhận độ trễ lượt DM tăng thêm (xem bên dưới).

    Để tắt khi:

    - Bạn cần độ trễ lệnh tối thiểu cho các kích hoạt DM một từ.
    - Tất cả luồng của bạn là lệnh một lần, không có payload theo sau.

  </Tab>
  <Tab title="Bật">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Khi bật cờ này và không có `messages.inbound.byChannel.bluebubbles` rõ ràng, cửa sổ debounce mở rộng thành **2500 ms** (mặc định khi không gộp là 500 ms). Cửa sổ rộng hơn là bắt buộc - nhịp gửi tách 0,8-2,0 giây của Apple không vừa trong mặc định chặt hơn.

    Để tự tinh chỉnh cửa sổ:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Đánh đổi">
    - **Tăng độ trễ cho lệnh điều khiển DM.** Khi bật cờ này, tin nhắn lệnh điều khiển DM (như `Dump`, `Save`, v.v.) giờ sẽ chờ tối đa bằng cửa sổ debounce trước khi điều phối, phòng trường hợp một webhook payload đang đến. Lệnh trong cuộc trò chuyện nhóm vẫn được điều phối tức thì.
    - **Đầu ra đã gộp có giới hạn** - văn bản đã gộp giới hạn ở 4000 ký tự với dấu `…[truncated]` rõ ràng; tệp đính kèm giới hạn ở 20; mục nguồn giới hạn ở 10 (giữ lại mục đầu tiên cộng với các mục mới nhất sau giới hạn đó). Mọi `messageId` nguồn vẫn đi qua inbound-dedupe để một lần phát lại MessagePoller sau đó của bất kỳ sự kiện riêng lẻ nào cũng được nhận ra là trùng lặp.
    - **Chọn bật theo từng kênh.** Các kênh khác (Telegram, WhatsApp, Slack, …) không bị ảnh hưởng.

  </Tab>
</Tabs>

### Kịch bản và những gì agent thấy

| Người dùng soạn                                                   | Apple gửi                 | Tắt cờ (mặc định)                       | Bật cờ + cửa sổ 2500 ms                                                |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (một lần gửi)                           | 2 webhook cách nhau ~1 giây | Hai lượt agent: chỉ "Dump", rồi URL     | Một lượt: văn bản đã gộp `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (tệp đính kèm + văn bản)           | 2 webhook                 | Hai lượt                               | Một lượt: văn bản + hình ảnh                                           |
| `/status` (lệnh độc lập)                                           | 1 webhook                 | Điều phối tức thì                       | **Chờ tối đa bằng cửa sổ, rồi điều phối**                              |
| Chỉ dán URL                                                        | 1 webhook                 | Điều phối tức thì                       | Điều phối tức thì (chỉ một mục trong bucket)                           |
| Văn bản + URL được gửi dưới dạng hai tin nhắn riêng có chủ ý, cách nhau vài phút | 2 webhook ngoài cửa sổ | Hai lượt                               | Hai lượt (cửa sổ hết hạn giữa chúng)                                   |
| Dồn nhanh (>10 DM nhỏ trong cửa sổ)                                | N webhook                 | N lượt                                 | Một lượt, đầu ra có giới hạn (áp dụng giới hạn mục đầu + mới nhất, văn bản/tệp đính kèm) |

### Khắc phục sự cố gộp gửi tách

Nếu cờ đã bật mà các lần gửi tách vẫn đến thành hai lượt, hãy kiểm tra từng lớp:

<AccordionGroup>
  <Accordion title="Cấu hình thực sự đã được tải">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Sau đó `openclaw gateway restart` - cờ được đọc khi tạo debouncer-registry.

  </Accordion>
  <Accordion title="Cửa sổ debounce đủ rộng cho thiết lập của bạn">
    Xem nhật ký máy chủ BlueBubbles tại `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Đo khoảng cách giữa lần điều phối văn bản kiểu `"Dump"` và lần điều phối `"https://..."; Attachments:` theo sau. Tăng `messages.inbound.byChannel.bluebubbles` để phủ đủ khoảng cách đó một cách thoải mái.

  </Accordion>
  <Accordion title="Dấu thời gian JSONL phiên ≠ thời điểm webhook đến">
    Dấu thời gian sự kiện phiên (`~/.openclaw/agents/<id>/sessions/*.jsonl`) phản ánh lúc gateway chuyển tin nhắn cho agent, **không phải** lúc webhook đến. Tin nhắn thứ hai trong hàng đợi được gắn `[Queued messages while agent was busy]` nghĩa là lượt đầu vẫn đang chạy khi webhook thứ hai đến - bucket gộp đã được xả. Tinh chỉnh cửa sổ dựa trên nhật ký máy chủ BB, không phải nhật ký phiên.
  </Accordion>
  <Accordion title="Áp lực bộ nhớ làm chậm điều phối trả lời">
    Trên máy nhỏ hơn (8 GB), lượt agent có thể mất đủ lâu để bucket gộp xả trước khi trả lời hoàn tất, và URL rơi vào lượt thứ hai trong hàng đợi. Kiểm tra `memory_pressure` và `ps -o rss -p $(pgrep openclaw-gateway)`; nếu gateway vượt khoảng ~500 MB RSS và bộ nén đang hoạt động, hãy đóng các tiến trình nặng khác hoặc chuyển sang host lớn hơn.
  </Accordion>
  <Accordion title="Gửi dạng trích dẫn trả lời là một đường dẫn khác">
    Nếu người dùng chạm vào `Dump` dưới dạng **trả lời** một bong bóng URL hiện có (iMessage hiển thị huy hiệu "1 Reply" trên bong bóng Dump), URL nằm trong `replyToBody`, không nằm trong webhook thứ hai. Gộp không áp dụng - đó là vấn đề của skill/prompt, không phải của debouncer.
  </Accordion>
</AccordionGroup>

## Streaming theo khối

Kiểm soát việc phản hồi được gửi thành một tin nhắn duy nhất hay được stream theo khối:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Phương tiện + giới hạn

- Tệp đính kèm đến được tải xuống và lưu trong cache phương tiện.
- Giới hạn phương tiện qua `channels.bluebubbles.mediaMaxMb` cho phương tiện đến và đi (mặc định: 8 MB).
- Văn bản đi được chia thành các phần theo `channels.bluebubbles.textChunkLimit` (mặc định: 4000 ký tự).

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

<AccordionGroup>
  <Accordion title="Kết nối và webhook">
    - `channels.bluebubbles.enabled`: Bật/tắt kênh.
    - `channels.bluebubbles.serverUrl`: URL cơ sở của REST API BlueBubbles.
    - `channels.bluebubbles.password`: Mật khẩu API.
    - `channels.bluebubbles.webhookPath`: Đường dẫn endpoint Webhook (mặc định: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Chính sách truy cập">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: `pairing`).
    - `channels.bluebubbles.allowFrom`: Allowlist DM (handle, email, số E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (mặc định: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Allowlist người gửi nhóm.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Trên macOS, tùy chọn bổ sung thông tin người tham gia nhóm chưa có tên từ Danh bạ cục bộ sau khi qua bước kiểm soát. Mặc định: `false`.
    - `channels.bluebubbles.groups`: Cấu hình theo từng nhóm (`requireMention`, v.v.).

  </Accordion>
  <Accordion title="Gửi và chia đoạn">
    - `channels.bluebubbles.sendReadReceipts`: Gửi thông báo đã đọc (mặc định: `true`).
    - `channels.bluebubbles.blockStreaming`: Bật phát trực tuyến theo khối (mặc định: `false`; bắt buộc để phát trực tuyến câu trả lời).
    - `channels.bluebubbles.textChunkLimit`: Kích thước đoạn gửi đi tính bằng ký tự (mặc định: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Thời gian chờ cho mỗi yêu cầu tính bằng ms khi gửi văn bản đi qua `/api/v1/message/text` (mặc định: 30000). Tăng trên các thiết lập macOS 26 nơi lệnh gửi iMessage bằng Private API có thể bị treo hơn 60 giây bên trong framework iMessage; ví dụ `45000` hoặc `60000`. Probe, tra cứu chat, reaction, chỉnh sửa và kiểm tra tình trạng hiện vẫn giữ mặc định ngắn hơn là 10 giây; việc mở rộng phạm vi sang reaction và chỉnh sửa được lên kế hoạch cho bước tiếp theo. Ghi đè theo từng tài khoản: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (mặc định) chỉ tách khi vượt quá `textChunkLimit`; `newline` tách theo dòng trống (ranh giới đoạn văn) trước khi chia đoạn theo độ dài.

  </Accordion>
  <Accordion title="Phương tiện và lịch sử">
    - `channels.bluebubbles.mediaMaxMb`: Giới hạn phương tiện gửi đến/gửi đi tính bằng MB (mặc định: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Danh sách cho phép tường minh gồm các thư mục cục bộ tuyệt đối được phép dùng cho đường dẫn phương tiện cục bộ gửi đi. Gửi bằng đường dẫn cục bộ bị từ chối theo mặc định trừ khi mục này được cấu hình. Ghi đè theo từng tài khoản: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Gộp các Webhook DM liên tiếp từ cùng người gửi thành một lượt agent để kiểu gửi tách văn bản+URL của Apple đến dưới dạng một tin nhắn duy nhất (mặc định: `false`). Xem [Gộp các DM gửi tách](#coalescing-split-send-dms-command--url-in-one-composition) để biết kịch bản, tinh chỉnh cửa sổ thời gian và đánh đổi. Khi bật mà không có `messages.inbound.byChannel.bluebubbles` tường minh, cửa sổ debounce mặc định cho tin nhắn đến sẽ được mở rộng từ 500 ms lên 2500 ms.
    - `channels.bluebubbles.historyLimit`: Số tin nhắn nhóm tối đa dùng làm ngữ cảnh (0 để tắt).
    - `channels.bluebubbles.dmHistoryLimit`: Giới hạn lịch sử DM.
    - `channels.bluebubbles.replyContextApiFallback`: Khi một reply gửi đến không có `replyToBody`/`replyToSender` và bộ nhớ đệm ngữ cảnh reply trong bộ nhớ bị miss, lấy tin nhắn gốc từ BlueBubbles HTTP API như một phương án dự phòng best-effort (mặc định: `false`). Hữu ích cho các triển khai nhiều instance dùng chung một tài khoản BlueBubbles, sau khi tiến trình khởi động lại, hoặc sau khi bộ nhớ đệm TTL/LRU tồn tại lâu bị loại bỏ. Lần lấy dữ liệu này được bảo vệ chống SSRF bằng cùng chính sách như mọi yêu cầu client BlueBubbles khác, không bao giờ ném lỗi, và điền vào bộ nhớ đệm để các reply tiếp theo được khấu hao chi phí. Ghi đè theo từng tài khoản: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Thiết lập cấp kênh sẽ lan truyền đến các tài khoản bỏ qua cờ này.

  </Accordion>
  <Accordion title="Hành động và tài khoản">
    - `channels.bluebubbles.actions`: Bật/tắt các hành động cụ thể.
    - `channels.bluebubbles.accounts`: Cấu hình nhiều tài khoản.

  </Accordion>
</AccordionGroup>

Các tùy chọn toàn cục liên quan:

- `agents.list[].groupChat.mentionPatterns` (hoặc `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Định địa chỉ / mục tiêu gửi

Ưu tiên `chat_guid` để định tuyến ổn định:

- `chat_guid:iMessage;-;+15555550123` (ưu tiên cho nhóm)
- `chat_id:123`
- `chat_identifier:...`
- Handle trực tiếp: `+15555550123`, `user@example.com`
  - Nếu handle trực tiếp không có chat DM hiện có, OpenClaw sẽ tạo một chat qua `POST /api/v1/chat/new`. Việc này yêu cầu bật BlueBubbles Private API.

### Định tuyến iMessage so với SMS

Khi cùng một handle có cả chat iMessage và SMS trên máy Mac (ví dụ một số điện thoại đã đăng ký iMessage nhưng cũng đã nhận các fallback bong bóng xanh), OpenClaw ưu tiên chat iMessage và không bao giờ âm thầm hạ cấp xuống SMS. Để buộc dùng chat SMS, hãy dùng tiền tố mục tiêu `sms:` tường minh (ví dụ `sms:+15555550123`). Các handle không có chat iMessage khớp vẫn sẽ gửi qua bất kỳ chat nào mà BlueBubbles báo cáo.

## Bảo mật

- Các yêu cầu Webhook được xác thực bằng cách so sánh tham số truy vấn hoặc header `guid`/`password` với `channels.bluebubbles.password`.
- Giữ bí mật mật khẩu API và endpoint Webhook (xử lý chúng như thông tin xác thực).
- Không có cơ chế bỏ qua localhost cho xác thực Webhook của BlueBubbles. Nếu bạn proxy lưu lượng Webhook, hãy giữ mật khẩu BlueBubbles trên yêu cầu từ đầu đến cuối. `gateway.trustedProxies` không thay thế `channels.bluebubbles.password` ở đây. Xem [Bảo mật Gateway](/vi/gateway/security#reverse-proxy-configuration).
- Bật HTTPS + quy tắc tường lửa trên máy chủ BlueBubbles nếu để lộ nó ra ngoài LAN.

## Khắc phục sự cố

- Nếu sự kiện typing/đã đọc ngừng hoạt động, hãy kiểm tra log Webhook của BlueBubbles và xác minh đường dẫn Gateway khớp với `channels.bluebubbles.webhookPath`.
- Mã ghép đôi hết hạn sau một giờ; dùng `openclaw pairing list bluebubbles` và `openclaw pairing approve bluebubbles <code>`.
- Reaction yêu cầu BlueBubbles private API (`POST /api/v1/message/react`); hãy đảm bảo phiên bản máy chủ có cung cấp API này.
- Chỉnh sửa/thu hồi gửi yêu cầu macOS 13+ và phiên bản máy chủ BlueBubbles tương thích. Trên macOS 26 (Tahoe), chỉnh sửa hiện bị hỏng do các thay đổi Private API.
- Cập nhật biểu tượng nhóm có thể không ổn định trên macOS 26 (Tahoe): API có thể trả về thành công nhưng biểu tượng mới không đồng bộ.
- OpenClaw tự động ẩn các hành động đã biết là bị hỏng dựa trên phiên bản macOS của máy chủ BlueBubbles. Nếu chỉnh sửa vẫn xuất hiện trên macOS 26 (Tahoe), hãy tắt thủ công bằng `channels.bluebubbles.actions.edit=false`.
- `coalesceSameSenderDms` đã bật nhưng các lần gửi tách (ví dụ `Dump` + URL) vẫn đến thành hai lượt: xem checklist [khắc phục sự cố gộp gửi tách](#split-send-coalescing-troubleshooting) - nguyên nhân phổ biến là cửa sổ debounce quá chặt, nhầm timestamp trong session-log là thời điểm Webhook đến, hoặc gửi reply-quote (dùng `replyToBody`, không phải Webhook thứ hai).
- Để xem thông tin trạng thái/tình trạng: `openclaw status --all` hoặc `openclaw status --deep`.

Để tham khảo quy trình kênh chung, xem [Kênh](/vi/channels) và hướng dẫn [Plugins](/vi/tools/plugin).

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Tổng quan về kênh](/vi/channels) - tất cả kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) - hành vi chat nhóm và cổng kiểm soát nhắc đến
- [Ghép đôi](/vi/channels/pairing) - xác thực DM và luồng ghép đôi
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và gia cố
