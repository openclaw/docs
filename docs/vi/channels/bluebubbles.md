---
read_when:
    - Thiết lập kênh BlueBubbles
    - Khắc phục sự cố ghép đôi Webhook
    - Cấu hình iMessage trên macOS
sidebarTitle: BlueBubbles
summary: iMessage thông qua máy chủ macOS BlueBubbles (gửi/nhận qua REST, trạng thái đang nhập, phản ứng, ghép đôi, hành động nâng cao).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-29T22:24:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a77b248ed86eb4114f8b7f1fc6bd4cea004d65095a0439a4a8c814bc180082c
    source_path: channels/bluebubbles.md
    workflow: 16
---

Trạng thái: Plugin đi kèm giao tiếp với máy chủ BlueBubbles macOS qua HTTP. **Được khuyến nghị cho tích hợp iMessage** nhờ API phong phú hơn và thiết lập dễ hơn so với kênh imsg cũ.

<Note>
Các bản phát hành OpenClaw hiện tại đi kèm BlueBubbles, nên các bản dựng đóng gói thông thường không cần bước `openclaw plugins install` riêng.
</Note>

## Tổng quan

- Chạy trên macOS thông qua ứng dụng trợ giúp BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Khuyến nghị/đã kiểm thử: macOS Sequoia (15). macOS Tahoe (26) hoạt động; chỉnh sửa hiện đang hỏng trên Tahoe, và cập nhật biểu tượng nhóm có thể báo thành công nhưng không đồng bộ.
- OpenClaw giao tiếp với nó thông qua REST API (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Tin nhắn đến đi qua webhooks; trả lời gửi đi, chỉ báo đang nhập, xác nhận đã đọc và tapback là các lệnh gọi REST.
- Tệp đính kèm và sticker được nạp dưới dạng media đến (và được hiển thị cho agent khi có thể).
- Các trả lời Auto-TTS tổng hợp âm thanh MP3 hoặc CAF được gửi dưới dạng bong bóng ghi âm iMessage thay vì tệp đính kèm thường.
- Cơ chế ghép đôi/danh sách cho phép hoạt động giống các kênh khác (`/channels/pairing` v.v.) với `channels.bluebubbles.allowFrom` + mã ghép đôi.
- Phản ứng được hiển thị dưới dạng sự kiện hệ thống giống Slack/Telegram để agent có thể "nhắc đến" chúng trước khi trả lời.
- Tính năng nâng cao: chỉnh sửa, thu hồi gửi, luồng trả lời, hiệu ứng tin nhắn, quản lý nhóm.

## Bắt đầu nhanh

<Steps>
  <Step title="Install BlueBubbles">
    Cài đặt máy chủ BlueBubbles trên máy Mac của bạn (làm theo hướng dẫn tại [bluebubbles.app/install](https://bluebubbles.app/install)).
  </Step>
  <Step title="Enable the web API">
    Trong cấu hình BlueBubbles, bật web API và đặt mật khẩu.
  </Step>
  <Step title="Configure OpenClaw">
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
  <Step title="Point webhooks at the gateway">
    Trỏ webhooks BlueBubbles đến Gateway của bạn (ví dụ: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Khởi động Gateway; nó sẽ đăng ký trình xử lý Webhook và bắt đầu ghép đôi.
  </Step>
</Steps>

<Warning>
**Bảo mật**

- Luôn đặt mật khẩu Webhook.
- Xác thực Webhook luôn bắt buộc. OpenClaw từ chối yêu cầu Webhook BlueBubbles trừ khi chúng bao gồm mật khẩu/guid khớp với `channels.bluebubbles.password` (ví dụ `?password=<password>` hoặc `x-password`), bất kể cấu trúc liên kết local loopback/proxy.
- Xác thực mật khẩu được kiểm tra trước khi đọc/phân tích toàn bộ phần thân Webhook.

</Warning>

## Giữ Messages.app hoạt động (thiết lập VM / headless)

Một số thiết lập macOS VM / luôn bật có thể khiến Messages.app chuyển sang trạng thái "idle" (sự kiện đến dừng cho đến khi ứng dụng được mở/đưa ra foreground). Cách xử lý đơn giản là **chạm vào Messages mỗi 5 phút** bằng AppleScript + LaunchAgent.

<Steps>
  <Step title="Save the AppleScript">
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
  <Step title="Install a LaunchAgent">
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

    Thao tác này chạy **mỗi 300 giây** và **khi đăng nhập**. Lần chạy đầu tiên có thể kích hoạt lời nhắc **Automation** của macOS (`osascript` → Messages). Phê duyệt chúng trong cùng phiên người dùng chạy LaunchAgent.

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles có sẵn trong onboarding tương tác:

```
openclaw onboard
```

Trình hướng dẫn yêu cầu:

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
  Số điện thoại, email, hoặc mục tiêu chat.
</ParamField>

Bạn cũng có thể thêm BlueBubbles qua CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Kiểm soát truy cập (DM + nhóm)

<Tabs>
  <Tab title="DMs">
    - Mặc định: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Người gửi không xác định nhận mã ghép đôi; tin nhắn bị bỏ qua cho đến khi được phê duyệt (mã hết hạn sau 1 giờ).
    - Phê duyệt bằng:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Ghép đôi là trao đổi token mặc định. Chi tiết: [Ghép đôi](/vi/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (mặc định: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom` kiểm soát ai có thể kích hoạt trong nhóm khi `allowlist` được đặt.

  </Tab>
</Tabs>

### Bổ sung tên liên hệ (macOS, tùy chọn)

Webhook nhóm BlueBubbles thường chỉ bao gồm địa chỉ người tham gia thô. Nếu bạn muốn ngữ cảnh `GroupMembers` hiển thị tên liên hệ cục bộ thay vào đó, bạn có thể chọn bật bổ sung từ Contacts cục bộ trên macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` bật tra cứu. Mặc định: `false`.
- Tra cứu chỉ chạy sau khi quyền truy cập nhóm, ủy quyền lệnh và cổng nhắc đến đã cho phép tin nhắn đi qua.
- Chỉ người tham gia bằng số điện thoại chưa có tên mới được bổ sung.
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
- Khi `requireMention` được bật cho một nhóm, agent chỉ trả lời khi được nhắc đến.
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

Mỗi mục dưới `channels.bluebubbles.groups.*` chấp nhận chuỗi `systemPrompt` tùy chọn. Giá trị này được chèn vào system prompt của agent ở mọi lượt xử lý tin nhắn trong nhóm đó, để bạn có thể đặt persona hoặc quy tắc hành vi theo nhóm mà không cần chỉnh sửa prompt của agent:

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

Khóa khớp với bất cứ gì BlueBubbles báo cáo là `chatGuid` / `chatIdentifier` / `chatId` dạng số cho nhóm, và mục ký tự đại diện `"*"` cung cấp mặc định cho mọi nhóm không có kết quả khớp chính xác (cùng mẫu được dùng bởi `requireMention` và chính sách công cụ theo nhóm). Kết quả khớp chính xác luôn thắng ký tự đại diện. DM bỏ qua trường này; thay vào đó hãy dùng tùy chỉnh prompt cấp agent hoặc cấp tài khoản.

#### Ví dụ hoàn chỉnh: trả lời theo luồng và phản ứng tapback (Private API)

Khi bật BlueBubbles Private API, tin nhắn đến đi kèm ID tin nhắn ngắn (ví dụ `[[reply_to:5]]`) và agent có thể gọi `action=reply` để trả lời theo luồng vào một tin nhắn cụ thể hoặc `action=react` để thả tapback. `systemPrompt` theo nhóm là cách đáng tin cậy để giữ agent chọn đúng công cụ:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Phản ứng tapback và trả lời theo luồng đều yêu cầu BlueBubbles Private API; xem [Hành động nâng cao](#advanced-actions) và [ID tin nhắn](#message-ids-short-vs-full) để biết cơ chế nền tảng.

## Liên kết cuộc trò chuyện ACP

Chat BlueBubbles có thể được chuyển thành workspace ACP bền vững mà không cần thay đổi lớp vận chuyển.

Luồng thao tác nhanh:

- Chạy `/acp spawn codex --bind here` bên trong DM hoặc chat nhóm được phép.
- Các tin nhắn tương lai trong cùng cuộc trò chuyện BlueBubbles đó được định tuyến đến phiên ACP đã sinh.
- `/new` và `/reset` đặt lại cùng phiên ACP đã liên kết tại chỗ.
- `/acp close` đóng phiên ACP và xóa liên kết.

Cũng hỗ trợ liên kết bền vững đã cấu hình thông qua các mục `bindings[]` cấp cao nhất với `type: "acp"` và `match.channel: "bluebubbles"`.

`match.peer.id` có thể dùng bất kỳ dạng mục tiêu BlueBubbles được hỗ trợ nào:

- handle DM đã chuẩn hóa như `+15555550123` hoặc `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Đối với liên kết nhóm ổn định, nên dùng `chat_id:*` hoặc `chat_identifier:*`.

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

## Đang nhập + xác nhận đã đọc

- **Chỉ báo đang nhập**: Được gửi tự động trước và trong quá trình tạo phản hồi.
- **Biên nhận đã đọc**: Được kiểm soát bởi `channels.bluebubbles.sendReadReceipts` (mặc định: `true`).
- **Chỉ báo đang nhập**: OpenClaw gửi sự kiện bắt đầu nhập; BlueBubbles tự động xóa trạng thái đang nhập khi gửi hoặc hết thời gian chờ (dừng thủ công qua DELETE không đáng tin cậy).

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
    - **react**: Thêm/xóa phản ứng tapback (`messageId`, `emoji`, `remove`). Bộ tapback gốc của iMessage là `love`, `like`, `dislike`, `laugh`, `emphasize`, và `question`. Khi một tác nhân chọn emoji nằm ngoài bộ đó (ví dụ `👀`), công cụ phản ứng sẽ quay về `love` để tapback vẫn hiển thị thay vì làm hỏng toàn bộ yêu cầu. Các phản ứng xác nhận đã cấu hình vẫn được kiểm tra nghiêm ngặt và báo lỗi với giá trị không xác định.
    - **edit**: Chỉnh sửa tin nhắn đã gửi (`messageId`, `text`).
    - **unsend**: Thu hồi tin nhắn (`messageId`).
    - **reply**: Trả lời một tin nhắn cụ thể (`messageId`, `text`, `to`).
    - **sendWithEffect**: Gửi với hiệu ứng iMessage (`text`, `to`, `effectId`).
    - **renameGroup**: Đổi tên cuộc trò chuyện nhóm (`chatGuid`, `displayName`).
    - **setGroupIcon**: Đặt biểu tượng/ảnh của cuộc trò chuyện nhóm (`chatGuid`, `media`) — không ổn định trên macOS 26 Tahoe (API có thể trả về thành công nhưng biểu tượng không đồng bộ).
    - **addParticipant**: Thêm ai đó vào nhóm (`chatGuid`, `address`).
    - **removeParticipant**: Xóa ai đó khỏi nhóm (`chatGuid`, `address`).
    - **leaveGroup**: Rời cuộc trò chuyện nhóm (`chatGuid`).
    - **upload-file**: Gửi phương tiện/tệp (`to`, `buffer`, `filename`, `asVoice`).
      - Ghi âm thoại: đặt `asVoice: true` với âm thanh **MP3** hoặc **CAF** để gửi dưới dạng tin nhắn thoại iMessage. BlueBubbles chuyển đổi MP3 → CAF khi gửi ghi âm thoại.
    - Bí danh cũ: `sendAttachment` vẫn hoạt động, nhưng `upload-file` là tên hành động chuẩn.

  </Accordion>
</AccordionGroup>

### ID tin nhắn (ngắn so với đầy đủ)

OpenClaw có thể hiển thị ID tin nhắn _ngắn_ (ví dụ: `1`, `2`) để tiết kiệm token.

- `MessageSid` / `ReplyToId` có thể là ID ngắn.
- `MessageSidFull` / `ReplyToIdFull` chứa ID đầy đủ của nhà cung cấp.
- ID ngắn nằm trong bộ nhớ; chúng có thể hết hạn khi khởi động lại hoặc khi bộ nhớ đệm bị loại bỏ.
- Hành động chấp nhận `messageId` ngắn hoặc đầy đủ, nhưng ID ngắn sẽ báo lỗi nếu không còn khả dụng.

Dùng ID đầy đủ cho tự động hóa và lưu trữ bền vững:

- Mẫu: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Ngữ cảnh: `MessageSidFull` / `ReplyToIdFull` trong payload gửi đến

Xem [Cấu hình](/vi/gateway/configuration) để biết các biến mẫu.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Gộp DM gửi tách (lệnh + URL trong một lần soạn)

Khi người dùng nhập một lệnh và một URL cùng nhau trong iMessage — ví dụ `Dump https://example.com/article` — Apple tách lần gửi thành **hai lần phân phối Webhook riêng biệt**:

1. Một tin nhắn văn bản (`"Dump"`).
2. Một bong bóng xem trước URL (`"https://..."`) với ảnh xem trước OG dưới dạng tệp đính kèm.

Hai Webhook đến OpenClaw cách nhau khoảng 0,8-2,0 giây trên hầu hết thiết lập. Nếu không gộp, tác nhân nhận riêng lệnh ở lượt 1, trả lời (thường là "send me the URL"), và chỉ thấy URL ở lượt 2 — lúc đó ngữ cảnh lệnh đã bị mất.

`channels.bluebubbles.coalesceSameSenderDms` chọn cho DM hợp nhất các Webhook liên tiếp từ cùng người gửi thành một lượt tác nhân duy nhất. Trò chuyện nhóm tiếp tục khóa theo từng tin nhắn để giữ nguyên cấu trúc lượt của nhiều người dùng.

<Tabs>
  <Tab title="Khi nào bật">
    Bật khi:

    - Bạn phát hành Skills mong đợi `command + payload` trong một tin nhắn (dump, paste, save, queue, v.v.).
    - Người dùng của bạn dán URL, hình ảnh hoặc nội dung dài cùng với lệnh.
    - Bạn có thể chấp nhận độ trễ lượt DM tăng thêm (xem bên dưới).

    Để tắt khi:

    - Bạn cần độ trễ lệnh tối thiểu cho các trình kích hoạt DM một từ.
    - Tất cả luồng của bạn là lệnh một lần không có payload theo sau.

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

    Khi bật cờ và không có `messages.inbound.byChannel.bluebubbles` rõ ràng, cửa sổ debounce mở rộng thành **2500 ms** (mặc định khi không gộp là 500 ms). Cửa sổ rộng hơn là bắt buộc — nhịp gửi tách 0,8-2,0 giây của Apple không vừa với mặc định chặt hơn.

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
    - **Tăng độ trễ cho các lệnh điều khiển DM.** Khi bật cờ, tin nhắn lệnh điều khiển DM (như `Dump`, `Save`, v.v.) giờ sẽ chờ tối đa đến cửa sổ debounce trước khi điều phối, phòng khi Webhook payload sắp đến. Lệnh trong trò chuyện nhóm vẫn được điều phối tức thì.
    - **Đầu ra đã gộp có giới hạn** — văn bản đã gộp giới hạn ở 4000 ký tự với dấu `…[truncated]` rõ ràng; tệp đính kèm giới hạn ở 20; mục nguồn giới hạn ở 10 (giữ mục đầu tiên cộng với mới nhất nếu vượt quá). Mọi `messageId` nguồn vẫn đi tới chống trùng lặp đầu vào, vì vậy bản phát lại MessagePoller sau này của bất kỳ sự kiện riêng lẻ nào cũng được nhận diện là trùng lặp.
    - **Chọn bật theo từng kênh.** Các kênh khác (Telegram, WhatsApp, Slack, …) không bị ảnh hưởng.

  </Tab>
</Tabs>

### Kịch bản và tác nhân sẽ thấy gì

| Người dùng soạn                                                    | Apple phân phối            | Tắt cờ (mặc định)                         | Bật cờ + cửa sổ 2500 ms                                                 |
| ------------------------------------------------------------------ | -------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (một lần gửi)                           | 2 Webhook cách nhau ~1 giây | Hai lượt tác nhân: chỉ "Dump", rồi URL    | Một lượt: văn bản đã gộp `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (tệp đính kèm + văn bản)           | 2 Webhook                  | Hai lượt                                  | Một lượt: văn bản + hình ảnh                                            |
| `/status` (lệnh độc lập)                                           | 1 Webhook                  | Điều phối tức thì                         | **Chờ tối đa đến cửa sổ, rồi điều phối**                                |
| Chỉ dán URL                                                        | 1 Webhook                  | Điều phối tức thì                         | Điều phối tức thì (chỉ một mục trong bucket)                            |
| Văn bản + URL được gửi thành hai tin nhắn riêng có chủ ý, cách nhau vài phút | 2 Webhook ngoài cửa sổ | Hai lượt                                  | Hai lượt (cửa sổ hết hạn giữa chúng)                                    |
| Dồn dập nhanh (>10 DM nhỏ trong cửa sổ)                            | N Webhook                  | N lượt                                    | Một lượt, đầu ra có giới hạn (áp dụng giới hạn mục đầu + mới nhất, văn bản/tệp đính kèm) |

### Khắc phục sự cố gộp gửi tách

Nếu cờ đã bật mà các lần gửi tách vẫn đến thành hai lượt, hãy kiểm tra từng lớp:

<AccordionGroup>
  <Accordion title="Cấu hình đã thực sự được tải">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Sau đó `openclaw gateway restart` — cờ được đọc khi tạo debouncer-registry.

  </Accordion>
  <Accordion title="Cửa sổ debounce đủ rộng cho thiết lập của bạn">
    Xem nhật ký máy chủ BlueBubbles dưới `~/Library/Logs/bluebubbles-server/main.log`:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    Đo khoảng cách giữa lần điều phối văn bản kiểu `"Dump"` và lần điều phối `"https://..."; Attachments:` theo sau. Tăng `messages.inbound.byChannel.bluebubbles` để bao phủ thoải mái khoảng cách đó.

  </Accordion>
  <Accordion title="Dấu thời gian JSONL phiên ≠ thời điểm Webhook đến">
    Dấu thời gian sự kiện phiên (`~/.openclaw/agents/<id>/sessions/*.jsonl`) phản ánh thời điểm Gateway trao tin nhắn cho tác nhân, **không phải** thời điểm Webhook đến. Một tin nhắn thứ hai trong hàng đợi được gắn `[Queued messages while agent was busy]` nghĩa là lượt đầu tiên vẫn đang chạy khi Webhook thứ hai đến — bucket gộp đã flush rồi. Tinh chỉnh cửa sổ dựa trên nhật ký máy chủ BB, không phải nhật ký phiên.
  </Accordion>
  <Accordion title="Áp lực bộ nhớ làm chậm điều phối phản hồi">
    Trên máy nhỏ hơn (8 GB), lượt tác nhân có thể mất đủ lâu để bucket gộp flush trước khi phản hồi hoàn tất, và URL được đưa vào hàng đợi thành lượt thứ hai. Kiểm tra `memory_pressure` và `ps -o rss -p $(pgrep openclaw-gateway)`; nếu Gateway vượt quá ~500 MB RSS và bộ nén đang hoạt động, hãy đóng các quy trình nặng khác hoặc chuyển sang máy chủ lớn hơn.
  </Accordion>
  <Accordion title="Gửi trích dẫn trả lời là một đường đi khác">
    Nếu người dùng chạm `Dump` dưới dạng **trả lời** cho một bong bóng URL hiện có (iMessage hiển thị huy hiệu "1 Reply" trên bong bóng Dump), URL nằm trong `replyToBody`, không nằm trong Webhook thứ hai. Gộp không áp dụng — đó là vấn đề của skill/prompt, không phải vấn đề của debouncer.
  </Accordion>
</AccordionGroup>

## Phát trực tuyến theo khối

Kiểm soát việc phản hồi được gửi dưới dạng một tin nhắn duy nhất hay được phát trực tuyến theo các khối:

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

- Tệp đính kèm gửi đến được tải xuống và lưu trong bộ nhớ đệm phương tiện.
- Giới hạn phương tiện qua `channels.bluebubbles.mediaMaxMb` cho phương tiện gửi đến và gửi đi (mặc định: 8 MB).
- Văn bản gửi đi được chia thành đoạn theo `channels.bluebubbles.textChunkLimit` (mặc định: 4000 ký tự).

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

<AccordionGroup>
  <Accordion title="Kết nối và Webhook">
    - `channels.bluebubbles.enabled`: Bật/tắt kênh.
    - `channels.bluebubbles.serverUrl`: URL cơ sở của API REST BlueBubbles.
    - `channels.bluebubbles.password`: Mật khẩu API.
    - `channels.bluebubbles.webhookPath`: Đường dẫn endpoint Webhook (mặc định: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Chính sách truy cập">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: `pairing`).
    - `channels.bluebubbles.allowFrom`: Danh sách cho phép DM (định danh, email, số E.164, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (mặc định: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Danh sách cho phép người gửi nhóm.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: Trên macOS, tùy chọn làm giàu người tham gia nhóm chưa đặt tên từ Danh bạ cục bộ sau khi qua cổng kiểm soát. Mặc định: `false`.
    - `channels.bluebubbles.groups`: Cấu hình theo từng nhóm (`requireMention`, v.v.).

  </Accordion>
  <Accordion title="Phân phối và chia khúc">
    - `channels.bluebubbles.sendReadReceipts`: Gửi biên nhận đã đọc (mặc định: `true`).
    - `channels.bluebubbles.blockStreaming`: Bật truyền phát theo khối (mặc định: `false`; bắt buộc để truyền phát phản hồi).
    - `channels.bluebubbles.textChunkLimit`: Kích thước khúc gửi đi tính bằng ký tự (mặc định: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: Thời gian chờ theo từng yêu cầu tính bằng ms cho các lần gửi văn bản đi qua `/api/v1/message/text` (mặc định: 30000). Tăng trên các thiết lập macOS 26 nơi các lần gửi Private API iMessage có thể bị treo hơn 60 giây bên trong framework iMessage; ví dụ `45000` hoặc `60000`. Các phép thăm dò, tra cứu trò chuyện, phản ứng, chỉnh sửa và kiểm tra sức khỏe hiện vẫn giữ mặc định ngắn hơn là 10 giây; việc mở rộng phạm vi sang phản ứng và chỉnh sửa được lên kế hoạch làm phần tiếp theo. Ghi đè theo tài khoản: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (mặc định) chỉ tách khi vượt quá `textChunkLimit`; `newline` tách theo dòng trống (ranh giới đoạn văn) trước khi chia khúc theo độ dài.

  </Accordion>
  <Accordion title="Phương tiện và lịch sử">
    - `channels.bluebubbles.mediaMaxMb`: Giới hạn phương tiện vào/ra tính bằng MB (mặc định: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Danh sách cho phép rõ ràng gồm các thư mục cục bộ tuyệt đối được phép dùng cho đường dẫn phương tiện cục bộ gửi đi. Các lần gửi đường dẫn cục bộ bị từ chối theo mặc định trừ khi cấu hình mục này. Ghi đè theo tài khoản: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Gộp các DM Webhook liên tiếp từ cùng người gửi thành một lượt agent để lần gửi tách văn bản+URL của Apple đến dưới dạng một tin nhắn duy nhất (mặc định: `false`). Xem [Gộp các DM gửi tách](#coalescing-split-send-dms-command--url-in-one-composition) để biết các kịch bản, điều chỉnh cửa sổ và các đánh đổi. Mở rộng cửa sổ debounce mặc định cho tin nhắn vào từ 500 ms lên 2500 ms khi được bật mà không có `messages.inbound.byChannel.bluebubbles` rõ ràng.
    - `channels.bluebubbles.historyLimit`: Số tin nhắn nhóm tối đa cho ngữ cảnh (0 sẽ tắt).
    - `channels.bluebubbles.dmHistoryLimit`: Giới hạn lịch sử DM.

  </Accordion>
  <Accordion title="Hành động và tài khoản">
    - `channels.bluebubbles.actions`: Bật/tắt các hành động cụ thể.
    - `channels.bluebubbles.accounts`: Cấu hình nhiều tài khoản.

  </Accordion>
</AccordionGroup>

Các tùy chọn toàn cục liên quan:

- `agents.list[].groupChat.mentionPatterns` (hoặc `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Địa chỉ hóa / đích phân phối

Ưu tiên `chat_guid` để định tuyến ổn định:

- `chat_guid:iMessage;-;+15555550123` (ưu tiên cho nhóm)
- `chat_id:123`
- `chat_identifier:...`
- Tay cầm trực tiếp: `+15555550123`, `user@example.com`
  - Nếu tay cầm trực tiếp không có cuộc trò chuyện DM hiện có, OpenClaw sẽ tạo một cuộc trò chuyện qua `POST /api/v1/chat/new`. Điều này yêu cầu bật BlueBubbles Private API.

### Định tuyến iMessage so với SMS

Khi cùng một tay cầm có cả cuộc trò chuyện iMessage và SMS trên máy Mac (ví dụ một số điện thoại đã đăng ký iMessage nhưng cũng đã nhận các phương án dự phòng bong bóng xanh), OpenClaw ưu tiên cuộc trò chuyện iMessage và không bao giờ âm thầm hạ cấp xuống SMS. Để buộc dùng cuộc trò chuyện SMS, hãy dùng tiền tố đích `sms:` rõ ràng (ví dụ `sms:+15555550123`). Các tay cầm không có cuộc trò chuyện iMessage khớp vẫn gửi qua bất kỳ cuộc trò chuyện nào BlueBubbles báo cáo.

## Bảo mật

- Các yêu cầu Webhook được xác thực bằng cách so sánh tham số truy vấn hoặc header `guid`/`password` với `channels.bluebubbles.password`.
- Giữ bí mật mật khẩu API và endpoint Webhook (xem chúng như thông tin xác thực).
- Không có cơ chế bỏ qua localhost cho xác thực Webhook của BlueBubbles. Nếu bạn proxy lưu lượng Webhook, hãy giữ mật khẩu BlueBubbles trên yêu cầu từ đầu đến cuối. `gateway.trustedProxies` không thay thế `channels.bluebubbles.password` ở đây. Xem [Bảo mật Gateway](/vi/gateway/security#reverse-proxy-configuration).
- Bật HTTPS + quy tắc tường lửa trên máy chủ BlueBubbles nếu đưa nó ra ngoài LAN của bạn.

## Khắc phục sự cố

- Nếu sự kiện đang nhập/đã đọc ngừng hoạt động, hãy kiểm tra nhật ký Webhook của BlueBubbles và xác minh đường dẫn gateway khớp với `channels.bluebubbles.webhookPath`.
- Mã ghép nối hết hạn sau một giờ; dùng `openclaw pairing list bluebubbles` và `openclaw pairing approve bluebubbles <code>`.
- Phản ứng yêu cầu BlueBubbles private API (`POST /api/v1/message/react`); đảm bảo phiên bản máy chủ cung cấp API đó.
- Chỉnh sửa/thu hồi yêu cầu macOS 13+ và phiên bản máy chủ BlueBubbles tương thích. Trên macOS 26 (Tahoe), chỉnh sửa hiện bị hỏng do các thay đổi private API.
- Cập nhật biểu tượng nhóm có thể không ổn định trên macOS 26 (Tahoe): API có thể trả về thành công nhưng biểu tượng mới không đồng bộ.
- OpenClaw tự động ẩn các hành động đã biết là hỏng dựa trên phiên bản macOS của máy chủ BlueBubbles. Nếu chỉnh sửa vẫn xuất hiện trên macOS 26 (Tahoe), hãy tắt thủ công bằng `channels.bluebubbles.actions.edit=false`.
- Đã bật `coalesceSameSenderDms` nhưng các lần gửi tách (ví dụ `Dump` + URL) vẫn đến dưới dạng hai lượt: xem danh sách kiểm tra [khắc phục sự cố gộp gửi tách](#split-send-coalescing-troubleshooting) — các nguyên nhân phổ biến là cửa sổ debounce quá chặt, timestamp nhật ký phiên bị đọc nhầm là thời điểm Webhook đến, hoặc một lần gửi trích dẫn phản hồi (dùng `replyToBody`, không phải Webhook thứ hai).
- Để biết thông tin trạng thái/sức khỏe: `openclaw status --all` hoặc `openclaw status --deep`.

Để tham khảo quy trình kênh chung, xem hướng dẫn [Kênh](/vi/channels) và [Plugins](/vi/tools/plugin).

## Liên quan

- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng kiểm soát nhắc tên
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
