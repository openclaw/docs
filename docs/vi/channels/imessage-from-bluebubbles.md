---
read_when:
    - Lập kế hoạch chuyển từ BlueBubbles sang Plugin iMessage đi kèm
    - Dịch các khóa cấu hình BlueBubbles sang các khóa tương đương của iMessage
    - Xác minh imsg trước khi bật Plugin iMessage
summary: Di chuyển các cấu hình BlueBubbles cũ sang Plugin iMessage được đóng gói kèm mà không làm mất thông tin ghép nối, danh sách cho phép hoặc liên kết nhóm.
title: Chuyển từ BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Plugin `imessage` đi kèm nay truy cập cùng bề mặt API riêng tư như BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, quản lý nhóm, tệp đính kèm) bằng cách điều khiển [`steipete/imsg`](https://github.com/steipete/imsg) qua JSON-RPC. Nếu bạn đã chạy một máy Mac có cài đặt `imsg`, bạn có thể bỏ máy chủ BlueBubbles và để Plugin giao tiếp trực tiếp với Messages.app.

Hỗ trợ BlueBubbles đã bị gỡ bỏ. OpenClaw chỉ hỗ trợ iMessage thông qua `imsg`. Hướng dẫn này dành cho việc di chuyển các cấu hình `channels.bluebubbles` cũ sang `channels.imessage`; không có đường dẫn di chuyển nào khác được hỗ trợ.

<Note>
Để xem thông báo ngắn và bản tóm tắt cho người vận hành, hãy xem [Gỡ bỏ BlueBubbles và đường dẫn iMessage qua imsg](/vi/announcements/bluebubbles-imessage).
</Note>

## Danh sách kiểm tra khi di chuyển

Dùng danh sách kiểm tra này khi bạn đã biết cấu hình BlueBubbles cũ của mình và muốn đường dẫn an toàn ngắn nhất:

1. Xác minh trực tiếp `imsg` trên máy Mac chạy Messages.app (`imsg chats`, `imsg history`, `imsg send` và `imsg rpc --help`).
2. Sao chép các khóa hành vi từ `channels.bluebubbles` sang `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` và `actions`.
3. Bỏ các khóa truyền tải không còn tồn tại: `serverUrl`, `password`, URL Webhook và thiết lập máy chủ BlueBubbles.
4. Nếu Gateway không chạy trên máy Mac Messages, đặt `channels.imessage.cliPath` thành một trình bao bọc SSH và đặt `remoteHost` để tải tệp đính kèm từ xa.
5. Khi Gateway đã dừng, bật `channels.imessage`, rồi chạy `openclaw channels status --probe --channel imessage`.
6. Kiểm thử một DM, một nhóm được phép, tệp đính kèm nếu đã bật, và mọi hành động API riêng tư mà bạn kỳ vọng agent sẽ dùng.
7. Xóa máy chủ BlueBubbles và cấu hình `channels.bluebubbles` cũ sau khi đường dẫn iMessage đã được xác minh.

## Khi nào việc di chuyển này phù hợp

- Bạn đã chạy `imsg` trên cùng máy Mac (hoặc một máy có thể truy cập qua SSH) nơi Messages.app đã đăng nhập.
- Bạn muốn bớt một thành phần cần vận hành — không có máy chủ BlueBubbles riêng, không có endpoint REST cần xác thực, không có hệ thống Webhook. Một tệp nhị phân CLI duy nhất thay cho máy chủ + ứng dụng máy khách + trình trợ giúp.
- Bạn đang dùng [bản dựng macOS / `imsg` được hỗ trợ](/vi/channels/imessage#requirements-and-permissions-macos), nơi phép dò API riêng tư báo cáo `available: true`.

## imsg làm gì

`imsg` là một CLI macOS cục bộ cho Messages. OpenClaw khởi động `imsg rpc` dưới dạng tiến trình con và giao tiếp JSON-RPC qua stdin/stdout. Không có máy chủ HTTP, URL Webhook, daemon nền, launch agent hay cổng nào cần mở.

- Hoạt động đọc lấy dữ liệu từ `~/Library/Messages/chat.db` bằng một handle SQLite chỉ đọc.
- Tin nhắn đến trực tiếp đến từ `imsg watch` / `watch.subscribe`, theo dõi các sự kiện hệ thống tệp của `chat.db` với cơ chế polling dự phòng.
- Hoạt động gửi dùng tự động hóa Messages.app cho gửi văn bản và tệp thông thường.
- Các hành động nâng cao dùng `imsg launch` để inject trình trợ giúp `imsg` vào Messages.app. Điều này mở khóa biên nhận đã đọc, chỉ báo đang nhập, gửi nội dung phong phú, chỉnh sửa, hủy gửi, trả lời theo luồng, tapback và quản lý nhóm.
- Các bản dựng Linux có thể kiểm tra một bản sao `chat.db`, nhưng không thể gửi, theo dõi cơ sở dữ liệu Mac trực tiếp hoặc điều khiển Messages.app. Với OpenClaw iMessage, hãy chạy `imsg` trên máy Mac đã đăng nhập hoặc thông qua một trình bao bọc SSH tới máy Mac đó.

## Trước khi bắt đầu

1. Cài đặt `imsg` trên máy Mac chạy Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Nếu `imsg chats` thất bại với `unable to open database file`, đầu ra trống hoặc `authorization denied`, hãy cấp Full Disk Access cho terminal, trình soạn thảo, tiến trình Node, dịch vụ Gateway hoặc tiến trình cha SSH khởi chạy `imsg`, rồi mở lại tiến trình cha đó.

2. Xác minh các bề mặt đọc, theo dõi, gửi và RPC trước khi thay đổi cấu hình OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Thay `42` bằng một chat id thật từ `imsg chats`. Việc gửi yêu cầu quyền Automation cho Messages.app. Nếu OpenClaw sẽ chạy qua SSH, hãy chạy các lệnh này thông qua cùng trình bao bọc SSH hoặc ngữ cảnh người dùng mà OpenClaw sẽ dùng.

3. Bật cầu nối API riêng tư khi bạn cần các hành động nâng cao:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` yêu cầu tắt SIP. Gửi cơ bản, lịch sử và theo dõi hoạt động mà không cần `imsg launch`; các hành động nâng cao thì không.

4. Sau khi bạn thêm cấu hình `channels.imessage` đã bật, xác minh cầu nối thông qua OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Bạn cần `imessage.privateApi.available: true`. Nếu nó báo `false`, hãy sửa việc đó trước — xem [Phát hiện năng lực](/vi/channels/imessage#private-api-actions). `channels status --probe` chỉ dò các tài khoản đã được cấu hình và bật.

5. Chụp nhanh cấu hình của bạn:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Chuyển đổi cấu hình

iMessage và BlueBubbles chia sẻ nhiều cấu hình cấp kênh. Các khóa thay đổi chủ yếu là truyền tải (máy chủ REST so với CLI cục bộ). Các khóa hành vi (`dmPolicy`, `groupPolicy`, `allowFrom`, v.v.) giữ nguyên ý nghĩa.

| BlueBubbles                                                | iMessage được đóng gói kèm                | Ghi chú                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Cùng ngữ nghĩa.                                                                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.serverUrl`                           | _(đã xóa)_                                | Không có máy chủ REST — Plugin khởi chạy `imsg rpc` qua stdio.                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.password`                            | _(đã xóa)_                                | Không cần xác thực Webhook.                                                                                                                                                                                                                                                                                                                                    |
| _(ngầm định)_                                              | `channels.imessage.cliPath`               | Đường dẫn tới `imsg` (mặc định `imsg`); dùng script bọc cho SSH.                                                                                                                                                                                                                                                                                                |
| _(ngầm định)_                                              | `channels.imessage.dbPath`                | Ghi đè `chat.db` của Messages.app tùy chọn; tự động phát hiện khi bỏ qua.                                                                                                                                                                                                                                                                                       |
| _(ngầm định)_                                              | `channels.imessage.remoteHost`            | `host` hoặc `user@host` — chỉ cần khi `cliPath` là script bọc SSH và bạn muốn lấy tệp đính kèm bằng SCP.                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Cùng giá trị (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Phê duyệt ghép đôi được chuyển tiếp theo handle, không theo token.                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Cùng giá trị (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Giống nhau.                                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Sao chép nguyên văn mục này, bao gồm mọi mục ký tự đại diện `groups: { "*": { ... } }`.** `requireMention`, `tools`, `toolsBySender` theo từng nhóm được chuyển tiếp. Với `groupPolicy: "allowlist"`, khối `groups` trống hoặc thiếu sẽ âm thầm loại bỏ mọi tin nhắn nhóm — xem "Bẫy registry nhóm" bên dưới.                                               |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Mặc định `true`. Với Plugin được đóng gói kèm, tùy chọn này chỉ kích hoạt khi probe API riêng tư đang chạy.                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Cùng cấu trúc, **vẫn tắt theo mặc định**. Nếu bạn đã có tệp đính kèm chạy trên BlueBubbles, bạn phải đặt lại rõ ràng mục này trên khối iMessage — nó không được chuyển tiếp ngầm định, và ảnh/phương tiện đến sẽ bị âm thầm loại bỏ mà không có dòng nhật ký `Inbound message` cho đến khi bạn làm vậy.                                                           |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Thư mục gốc cục bộ; cùng quy tắc ký tự đại diện.                                                                                                                                                                                                                                                                                                                |
| _(N/A)_                                                    | `channels.imessage.remoteAttachmentRoots` | Chỉ được dùng khi `remoteHost` được đặt cho các lần lấy bằng SCP.                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Mặc định 16 MB trên iMessage (mặc định của BlueBubbles là 8 MB). Đặt rõ ràng nếu bạn muốn giữ giới hạn thấp hơn.                                                                                                                                                                                                                                                |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Mặc định 4000 trên cả hai.                                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Cùng tùy chọn bật thủ công. Chỉ dành cho DM — trò chuyện nhóm giữ cách gửi tức thì theo từng tin nhắn trên cả hai kênh. Mở rộng debounce mặc định cho tin nhắn đến lên 2500 ms khi được bật mà không có `messages.inbound.byChannel.imessage` rõ ràng. Xem [tài liệu iMessage § Gộp các DM gửi tách](/vi/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/A)_                                   | iMessage đã đọc tên hiển thị của người gửi từ `chat.db`.                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Công tắc theo từng hành động: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                  |

Cấu hình nhiều tài khoản (`channels.bluebubbles.accounts.*`) chuyển đổi một-một sang `channels.imessage.accounts.*`.

## Bẫy registry nhóm

Plugin iMessage được đóng gói kèm chạy **hai** cổng danh sách cho phép nhóm riêng biệt liên tiếp. Cả hai phải đạt thì tin nhắn nhóm mới tới được agent:

1. **Danh sách cho phép người gửi / đích trò chuyện** (`channels.imessage.groupAllowFrom`) — được kiểm tra bởi `isAllowedIMessageSender`. Khớp tin nhắn đến theo handle người gửi, `chat_guid`, `chat_identifier`, hoặc `chat_id`. Cùng cấu trúc như BlueBubbles.
2. **Registry nhóm** (`channels.imessage.groups`) — được kiểm tra bởi `resolveChannelGroupPolicy` từ `inbound-processing.ts:199`. Với `groupPolicy: "allowlist"`, cổng này yêu cầu một trong hai:
   - mục ký tự đại diện `groups: { "*": { ... } }` (đặt `allowAll = true`), hoặc
   - mục rõ ràng theo từng `chat_id` trong `groups`.

Nếu cổng 1 đạt nhưng cổng 2 không đạt, tin nhắn sẽ bị loại bỏ. Plugin phát ra hai tín hiệu cấp `warn` để việc này không còn im lặng ở cấp nhật ký mặc định:

- Một `warn` khởi động một lần cho mỗi tài khoản khi `groupPolicy: "allowlist"` được đặt nhưng `channels.imessage.groups` trống (không có ký tự đại diện `"*"`, không có mục theo từng `chat_id`) — được kích hoạt trước khi có bất kỳ tin nhắn nào đến.
- Một `warn` một lần theo từng `chat_id` trong lần đầu một nhóm cụ thể bị loại bỏ lúc chạy, nêu tên chat_id và khóa chính xác cần thêm vào `groups` để cho phép nhóm đó.

DM tiếp tục hoạt động vì chúng đi theo đường dẫn mã khác.

Đây là chế độ lỗi phổ biến nhất khi di chuyển từ BlueBubbles sang iMessage được đóng gói kèm: người vận hành sao chép `groupAllowFrom` và `groupPolicy` nhưng bỏ qua khối `groups`, vì `groups: { "*": { "requireMention": true } }` của BlueBubbles trông giống một thiết lập nhắc tên không liên quan. Thực ra nó là phần bắt buộc cho cổng registry.

Cấu hình tối thiểu để duy trì luồng tin nhắn nhóm sau `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` dưới `*` là vô hại khi không cấu hình mẫu nhắc đến nào: runtime đặt `canDetectMention = false` và dừng sớm bước loại bỏ do nhắc đến tại `inbound-processing.ts:512`. Khi đã cấu hình mẫu nhắc đến (`agents.list[].groupChat.mentionPatterns`), nó hoạt động như mong đợi.

Nếu Gateway ghi log `imessage: dropping group message from chat_id=<id>` hoặc dòng khởi động `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, cổng 2 đang loại bỏ — hãy thêm khối `groups`.

## Từng bước

1. Thêm khối iMessage bên cạnh khối BlueBubbles hiện có. Giữ khối này ở trạng thái tắt trong khi Gateway vẫn đang định tuyến lưu lượng BlueBubbles:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Thăm dò trước khi lưu lượng trở nên quan trọng** — dừng Gateway, tạm thời bật khối iMessage, và xác nhận iMessage báo trạng thái khỏe mạnh từ CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` chỉ thăm dò các tài khoản đã cấu hình và đang bật. Không khởi động lại Gateway khi cả BlueBubbles và iMessage đều được bật, trừ khi bạn chủ ý muốn cả hai trình giám sát kênh cùng chạy. Nếu bạn chưa chuyển đổi ngay, hãy đặt `channels.imessage.enabled` trở lại `false` trước khi khởi động lại Gateway. Dùng các lệnh `imsg` trực tiếp trong [Trước khi bắt đầu](#before-you-start) để xác thực Mac trước khi bật lưu lượng OpenClaw.

3. **Chuyển đổi.** Khi tài khoản iMessage đã bật báo trạng thái khỏe mạnh, hãy xóa cấu hình BlueBubbles và giữ iMessage được bật:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Khởi động lại Gateway. Lưu lượng iMessage đến giờ sẽ đi qua Plugin đi kèm.

4. **Xác minh DM.** Gửi cho agent một tin nhắn trực tiếp; xác nhận phản hồi được gửi đến.

5. **Xác minh nhóm riêng.** DM và nhóm đi qua các đường mã khác nhau — DM thành công không chứng minh rằng nhóm đang được định tuyến. Gửi cho agent một tin nhắn trong một cuộc trò chuyện nhóm đã ghép đôi và xác nhận phản hồi được gửi đến. Nếu nhóm im lặng (không có phản hồi từ agent, không có lỗi), hãy kiểm tra log Gateway để tìm `imessage: dropping group message from chat_id=<id>` hoặc dòng khởi động `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — cả hai đều xuất hiện ở mức log mặc định. Nếu một trong hai xuất hiện, khối `groups` của bạn đang thiếu hoặc rỗng — xem "Lỗi dễ vấp ở registry nhóm" ở trên.

6. **Xác minh bề mặt hành động** — từ một DM đã ghép đôi, yêu cầu agent thả phản ứng, chỉnh sửa, thu hồi, trả lời, gửi ảnh, và (trong một nhóm) đổi tên nhóm / thêm hoặc xóa người tham gia. Mỗi hành động phải xuất hiện nguyên bản trong Messages.app. Nếu có hành động nào báo lỗi "iMessage `<action>` requires the imsg private API bridge", hãy chạy lại `imsg launch` và làm mới `channels status --probe`.

7. **Xóa máy chủ và cấu hình BlueBubbles** sau khi đã xác minh DM, nhóm và hành động của iMessage. OpenClaw sẽ không dùng `channels.bluebubbles`.

## Tổng quan nhanh về mức tương đương hành động

| Hành động                                                  | BlueBubbles cũ                       | iMessage đi kèm                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Gửi văn bản / phương án dự phòng SMS                       | ✅                                  | ✅                                                                                                                      |
| Gửi phương tiện (ảnh, video, tệp, thoại)                   | ✅                                  | ✅                                                                                                                      |
| Trả lời theo luồng (`reply_to_guid`)                       | ✅                                  | ✅ (đóng [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                   |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Chỉnh sửa / thu hồi (người nhận macOS 13+)                 | ✅                                  | ✅                                                                                                                      |
| Gửi kèm hiệu ứng màn hình                                  | ✅                                  | ✅ (đóng một phần [#9394](https://github.com/openclaw/openclaw/issues/9394))                                            |
| Văn bản định dạng đậm / nghiêng / gạch chân / gạch ngang   | ✅                                  | ✅ (định dạng typed-run qua attributedBody)                                                                             |
| Đổi tên nhóm / đặt biểu tượng nhóm                         | ✅                                  | ✅                                                                                                                      |
| Thêm / xóa người tham gia, rời nhóm                        | ✅                                  | ✅                                                                                                                      |
| Xác nhận đã đọc và chỉ báo đang nhập                       | ✅                                  | ✅ (được kiểm soát bởi thăm dò API riêng tư)                                                                            |
| Gộp DM cùng người gửi                                      | ✅                                  | ✅ (chỉ DM; bật tùy chọn qua `channels.imessage.coalesceSameSenderDms`)                                                 |
| Bắt kịp tin nhắn đến đã nhận khi gateway tắt               | ✅ (phát lại Webhook + lấy lịch sử) | ✅ (bật tùy chọn qua `channels.imessage.catchup.enabled`; đóng [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

Tính năng bắt kịp iMessage hiện có sẵn dưới dạng tính năng bật tùy chọn trên Plugin đi kèm. Khi Gateway khởi động, nếu `channels.imessage.catchup.enabled` là `true`, Gateway chạy một lượt `chats.list` + `messages.history` cho từng cuộc trò chuyện trên cùng client JSON-RPC được `imsg watch` dùng, phát lại từng hàng đến bị bỏ lỡ qua đường điều phối trực tiếp (allowlist, chính sách nhóm, bộ chống lặp, bộ nhớ đệm echo), và lưu một con trỏ cho mỗi tài khoản để các lần khởi động sau tiếp tục từ điểm đã dừng. Xem [Bắt kịp sau thời gian Gateway ngừng hoạt động](/vi/channels/imessage#catching-up-after-gateway-downtime) để tinh chỉnh.

## Ghép đôi, phiên, và liên kết ACP

- **Phê duyệt ghép đôi** được chuyển tiếp theo handle. Bạn không cần phê duyệt lại người gửi đã biết — `channels.imessage.allowFrom` nhận ra cùng các chuỗi `+15555550123` / `user@example.com` mà BlueBubbles đã dùng.
- **Phiên** vẫn được giới hạn theo từng agent + cuộc trò chuyện. Theo mặc định `session.dmScope=main`, DM được gộp vào phiên chính của agent; phiên nhóm vẫn được cô lập theo từng `chat_id`. Khóa phiên khác nhau (`agent:<id>:imessage:group:<chat_id>` so với khóa tương đương của BlueBubbles) — lịch sử hội thoại cũ dưới khóa phiên BlueBubbles không được chuyển sang phiên iMessage.
- **Liên kết ACP** tham chiếu `match.channel: "bluebubbles"` cần được cập nhật thành `"imessage"`. Dạng của `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle trần) là giống nhau.

## Không có kênh rollback

Không có runtime BlueBubbles được hỗ trợ để chuyển ngược lại. Nếu xác minh iMessage thất bại, hãy đặt `channels.imessage.enabled: false`, khởi động lại Gateway, sửa điểm chặn `imsg`, rồi thử lại quá trình chuyển đổi.

Bộ nhớ đệm trả lời nằm tại `~/.openclaw/state/imessage/reply-cache.jsonl` (chế độ `0600`, thư mục cha `0700`). Có thể xóa an toàn nếu bạn muốn bắt đầu sạch.

## Liên quan

- [Việc loại bỏ BlueBubbles và đường dẫn iMessage imsg](/vi/announcements/bluebubbles-imessage) — thông báo ngắn và tóm tắt cho người vận hành.
- [iMessage](/vi/channels/imessage) — tài liệu tham khảo đầy đủ về kênh iMessage, bao gồm thiết lập `imsg launch` và phát hiện năng lực.
- `/channels/bluebubbles` — URL cũ chuyển hướng đến hướng dẫn di chuyển này.
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi.
- [Định tuyến kênh](/vi/channels/channel-routing) — cách Gateway chọn kênh cho phản hồi đi.
