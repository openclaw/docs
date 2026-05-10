---
read_when:
    - Lên kế hoạch chuyển từ BlueBubbles sang Plugin iMessage đi kèm
    - Dịch các khóa cấu hình BlueBubbles sang các tương đương của iMessage
    - Xác minh imsg trước khi bật Plugin iMessage
summary: Di chuyển cấu hình BlueBubbles cũ sang Plugin iMessage được tích hợp sẵn mà không làm mất ghép nối, danh sách cho phép hoặc liên kết nhóm.
title: Chuyển từ BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Plugin `imessage` đi kèm hiện truy cập cùng bề mặt API riêng tư như BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, quản lý nhóm, tệp đính kèm) bằng cách điều khiển [`steipete/imsg`](https://github.com/steipete/imsg) qua JSON-RPC. Nếu bạn đã chạy một máy Mac có cài `imsg`, bạn có thể bỏ máy chủ BlueBubbles và để Plugin giao tiếp trực tiếp với Messages.app.

Hỗ trợ BlueBubbles đã bị gỡ bỏ. OpenClaw chỉ hỗ trợ iMessage thông qua `imsg`. Hướng dẫn này dành cho việc di chuyển cấu hình `channels.bluebubbles` cũ sang `channels.imessage`; không có đường dẫn di chuyển nào khác được hỗ trợ.

## Khi việc di chuyển này phù hợp

- Bạn đã chạy `imsg` trên cùng máy Mac (hoặc một máy có thể truy cập qua SSH) nơi Messages.app đã đăng nhập.
- Bạn muốn giảm một thành phần vận hành — không có máy chủ BlueBubbles riêng, không có endpoint REST để xác thực, không có phần nối Webhook. Một tệp nhị phân CLI duy nhất thay vì máy chủ + ứng dụng khách + trình trợ giúp.
- Bạn đang dùng [bản dựng macOS / `imsg` được hỗ trợ](/vi/channels/imessage#requirements-and-permissions-macos), nơi phép thăm dò API riêng tư báo cáo `available: true`.

## imsg làm gì

`imsg` là một CLI macOS cục bộ cho Messages. OpenClaw khởi động `imsg rpc` như một tiến trình con và giao tiếp JSON-RPC qua stdin/stdout. Không có máy chủ HTTP, URL Webhook, daemon nền, launch agent, hoặc cổng nào cần mở.

- Dữ liệu đọc đến từ `~/Library/Messages/chat.db` bằng một handle SQLite chỉ đọc.
- Tin nhắn đến trực tiếp đến từ `imsg watch` / `watch.subscribe`, theo dõi các sự kiện hệ thống tệp của `chat.db` với cơ chế dự phòng bằng polling.
- Gửi dùng tự động hóa Messages.app cho văn bản thông thường và gửi tệp.
- Các hành động nâng cao dùng `imsg launch` để tiêm trình trợ giúp `imsg` vào Messages.app. Đây là cơ chế mở khóa biên nhận đã đọc, chỉ báo đang nhập, gửi nội dung phong phú, chỉnh sửa, thu hồi, trả lời theo luồng, tapback, và quản lý nhóm.
- Các bản dựng Linux có thể kiểm tra một bản sao `chat.db`, nhưng không thể gửi, theo dõi cơ sở dữ liệu Mac trực tiếp, hoặc điều khiển Messages.app. Với OpenClaw iMessage, hãy chạy `imsg` trên máy Mac đã đăng nhập hoặc thông qua một wrapper SSH đến máy Mac đó.

## Trước khi bắt đầu

1. Cài đặt `imsg` trên máy Mac chạy Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Nếu `imsg chats` thất bại với `unable to open database file`, đầu ra rỗng, hoặc `authorization denied`, hãy cấp quyền Truy cập toàn bộ ổ đĩa cho terminal, trình soạn thảo, tiến trình Node, dịch vụ Gateway, hoặc tiến trình cha SSH khởi chạy `imsg`, rồi mở lại tiến trình cha đó.

2. Xác minh các bề mặt đọc, theo dõi, gửi, và RPC trước khi thay đổi cấu hình OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Thay `42` bằng một chat id thật từ `imsg chats`. Việc gửi yêu cầu quyền Tự động hóa cho Messages.app. Nếu OpenClaw sẽ chạy qua SSH, hãy chạy các lệnh này thông qua cùng wrapper SSH hoặc ngữ cảnh người dùng mà OpenClaw sẽ dùng.

3. Bật cầu nối API riêng tư khi bạn cần các hành động nâng cao:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` yêu cầu tắt SIP. Gửi cơ bản, lịch sử, và theo dõi hoạt động mà không cần `imsg launch`; các hành động nâng cao thì không.

4. Xác minh cầu nối thông qua OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Bạn cần `imessage.privateApi.available: true`. Nếu nó báo cáo `false`, hãy sửa điều đó trước — xem [Phát hiện khả năng](/vi/channels/imessage#private-api-actions).

5. Chụp nhanh cấu hình của bạn:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Dịch cấu hình

iMessage và BlueBubbles chia sẻ nhiều cấu hình cấp kênh. Các khóa thay đổi chủ yếu là phần truyền tải (máy chủ REST so với CLI cục bộ). Các khóa hành vi (`dmPolicy`, `groupPolicy`, `allowFrom`, v.v.) giữ nguyên ý nghĩa.

| BlueBubbles                                                | iMessage tích hợp sẵn                     | Ghi chú                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Cùng ngữ nghĩa.                                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.serverUrl`                           | _(đã xóa)_                                | Không có máy chủ REST — plugin khởi chạy `imsg rpc` qua stdio.                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.password`                            | _(đã xóa)_                                | Không cần xác thực Webhook.                                                                                                                                                                                                                                                                                                                             |
| _(ngầm định)_                                              | `channels.imessage.cliPath`               | Đường dẫn đến `imsg` (mặc định `imsg`); dùng tập lệnh bọc cho SSH.                                                                                                                                                                                                                                                                                       |
| _(ngầm định)_                                              | `channels.imessage.dbPath`                | Ghi đè `chat.db` của Messages.app tùy chọn; tự phát hiện khi bỏ qua.                                                                                                                                                                                                                                                                                     |
| _(ngầm định)_                                              | `channels.imessage.remoteHost`            | `host` hoặc `user@host` — chỉ cần khi `cliPath` là một tập lệnh bọc SSH và bạn muốn tải tệp đính kèm bằng SCP.                                                                                                                                                                                                                                           |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Cùng các giá trị (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Phê duyệt ghép cặp được chuyển tiếp theo handle, không theo token.                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Cùng các giá trị (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Giống nhau.                                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Sao chép nguyên văn mục này, bao gồm mọi mục ký tự đại diện `groups: { "*": { ... } }`.** `requireMention`, `tools`, `toolsBySender` theo từng nhóm được chuyển tiếp. Với `groupPolicy: "allowlist"`, khối `groups` trống hoặc bị thiếu sẽ âm thầm loại bỏ mọi tin nhắn nhóm — xem "Bẫy registry nhóm" bên dưới.                                      |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Mặc định `true`. Với plugin tích hợp sẵn, mục này chỉ kích hoạt khi phép dò API riêng tư đang hoạt động.                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Cùng dạng, **vẫn tắt theo mặc định**. Nếu bạn từng có tệp đính kèm chạy trên BlueBubbles, bạn phải đặt lại mục này rõ ràng trong khối iMessage — nó không tự động chuyển tiếp ngầm định, và ảnh/phương tiện đi vào sẽ bị âm thầm loại bỏ mà không có dòng nhật ký `Inbound message` cho đến khi bạn làm vậy.                                             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Các gốc cục bộ; cùng quy tắc ký tự đại diện.                                                                                                                                                                                                                                                                                                             |
| _(không áp dụng)_                                          | `channels.imessage.remoteAttachmentRoots` | Chỉ dùng khi `remoteHost` được đặt cho việc tải bằng SCP.                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Mặc định 16 MB trên iMessage (mặc định của BlueBubbles là 8 MB). Đặt rõ ràng nếu bạn muốn giữ giới hạn thấp hơn.                                                                                                                                                                                                                                         |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Mặc định 4000 trên cả hai.                                                                                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Cùng là tùy chọn bật rõ ràng. Chỉ dành cho DM — trò chuyện nhóm vẫn giữ cách chuyển từng tin nhắn tức thì trên cả hai kênh. Mở rộng debounce mặc định cho tin nhắn đến thành 2500 ms khi được bật mà không có `messages.inbound.byChannel.imessage` rõ ràng. Xem [tài liệu iMessage § Gộp các DM gửi tách rời](/vi/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(không áp dụng)_                         | iMessage đã đọc tên hiển thị của người gửi từ `chat.db`.                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Các nút bật/tắt theo từng hành động: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                    |

Cấu hình nhiều tài khoản (`channels.bluebubbles.accounts.*`) chuyển đổi một-một sang `channels.imessage.accounts.*`.

## Bẫy registry nhóm

Plugin iMessage tích hợp sẵn chạy **hai** cổng allowlist nhóm riêng biệt nối tiếp nhau. Cả hai đều phải vượt qua thì tin nhắn nhóm mới đến được agent:

1. **Allowlist người gửi / mục tiêu trò chuyện** (`channels.imessage.groupAllowFrom`) — được kiểm tra bởi `isAllowedIMessageSender`. Khớp tin nhắn đến theo handle người gửi, `chat_guid`, `chat_identifier`, hoặc `chat_id`. Cùng dạng với BlueBubbles.
2. **Registry nhóm** (`channels.imessage.groups`) — được kiểm tra bởi `resolveChannelGroupPolicy` từ `inbound-processing.ts:199`. Với `groupPolicy: "allowlist"`, cổng này yêu cầu một trong hai:
   - một mục ký tự đại diện `groups: { "*": { ... } }` (đặt `allowAll = true`), hoặc
   - một mục theo từng `chat_id` rõ ràng trong `groups`.

Nếu cổng 1 vượt qua nhưng cổng 2 thất bại, tin nhắn sẽ bị loại bỏ. Plugin phát ra hai tín hiệu cấp `warn` để việc này không còn âm thầm ở mức nhật ký mặc định:

- Một `warn` một lần khi khởi động cho mỗi tài khoản khi `groupPolicy: "allowlist"` được đặt nhưng `channels.imessage.groups` trống (không có ký tự đại diện `"*"`, không có mục theo từng `chat_id`) — kích hoạt trước khi có bất kỳ tin nhắn nào đến.
- Một `warn` một lần theo từng `chat_id` vào lần đầu một nhóm cụ thể bị loại bỏ lúc chạy, nêu tên chat_id và khóa chính xác cần thêm vào `groups` để cho phép nhóm đó.

DM tiếp tục hoạt động vì chúng đi theo một đường mã khác.

Đây là chế độ lỗi phổ biến nhất khi di chuyển từ BlueBubbles sang iMessage tích hợp sẵn: người vận hành sao chép `groupAllowFrom` và `groupPolicy` nhưng bỏ qua khối `groups`, vì `groups: { "*": { "requireMention": true } }` của BlueBubbles trông như một thiết lập nhắc tên không liên quan. Thực ra nó là phần thiết yếu cho cổng registry.

Cấu hình tối thiểu để giữ tin nhắn nhóm tiếp tục hoạt động sau `groupPolicy: "allowlist"`:

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

`requireMention: true` dưới `*` là vô hại khi chưa cấu hình mẫu đề cập: runtime đặt `canDetectMention = false` và thoát sớm khỏi bước bỏ qua do đề cập tại `inbound-processing.ts:512`. Khi đã cấu hình mẫu đề cập (`agents.list[].groupChat.mentionPatterns`), nó hoạt động như mong đợi.

Nếu nhật ký Gateway có `imessage: dropping group message from chat_id=<id>` hoặc dòng khởi động `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, cổng 2 đang chặn — hãy thêm khối `groups`.

## Từng bước

1. Thêm một khối iMessage bên cạnh khối BlueBubbles hiện có. Chỉ giữ khối cũ làm nguồn sao chép cho đến khi đường dẫn mới được xác minh:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
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

2. **Thăm dò chạy thử** — khởi động Gateway và xác nhận iMessage báo trạng thái khỏe mạnh:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   Vì `imessage.enabled` vẫn là `false`, chưa có lưu lượng iMessage đầu vào nào được định tuyến — nhưng `--probe` kiểm tra cầu nối để bạn phát hiện vấn đề về quyền/cài đặt trước khi chuyển đổi.

3. **Chuyển đổi.** Xóa cấu hình BlueBubbles và bật iMessage trong cùng một lần chỉnh sửa cấu hình:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Khởi động lại Gateway. Lưu lượng iMessage đầu vào giờ sẽ đi qua Plugin đi kèm.

4. **Xác minh DM.** Gửi cho agent một tin nhắn trực tiếp; xác nhận phản hồi được gửi đến.

5. **Xác minh nhóm riêng.** DM và nhóm đi qua các đường dẫn mã khác nhau — DM thành công không chứng minh nhóm đang được định tuyến. Gửi cho agent một tin nhắn trong cuộc trò chuyện nhóm đã ghép đôi và xác nhận phản hồi được gửi đến. Nếu nhóm im lặng (không có phản hồi từ agent, không có lỗi), kiểm tra nhật ký Gateway để tìm `imessage: dropping group message from chat_id=<id>` hoặc dòng khởi động `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — cả hai đều xuất hiện ở mức nhật ký mặc định. Nếu một trong hai xuất hiện, khối `groups` của bạn đang thiếu hoặc rỗng — xem "Bẫy đăng ký nhóm" ở trên.

6. **Xác minh bề mặt hành động** — từ một DM đã ghép đôi, yêu cầu agent thả phản ứng, chỉnh sửa, thu hồi, trả lời, gửi ảnh, và (trong nhóm) đổi tên nhóm / thêm hoặc xóa người tham gia. Mỗi hành động phải xuất hiện nguyên bản trong Messages.app. Nếu hành động nào báo lỗi "iMessage `<action>` requires the imsg private API bridge", hãy chạy lại `imsg launch` và làm mới `channels status --probe`.

7. **Gỡ bỏ máy chủ và cấu hình BlueBubbles** sau khi đã xác minh DM, nhóm và hành động của iMessage. OpenClaw sẽ không dùng `channels.bluebubbles`.

## Tổng quan tương đương hành động

| Hành động                                                  | BlueBubbles cũ                      | iMessage đi kèm                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Gửi văn bản / dự phòng SMS                                 | ✅                                  | ✅                                                                                                                      |
| Gửi phương tiện (ảnh, video, tệp, thoại)                   | ✅                                  | ✅                                                                                                                      |
| Trả lời theo luồng (`reply_to_guid`)                       | ✅                                  | ✅ (đóng [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                   |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Chỉnh sửa / thu hồi (người nhận macOS 13+)                 | ✅                                  | ✅                                                                                                                      |
| Gửi kèm hiệu ứng màn hình                                  | ✅                                  | ✅ (đóng một phần [#9394](https://github.com/openclaw/openclaw/issues/9394))                                            |
| Văn bản định dạng đậm / nghiêng / gạch dưới / gạch ngang   | ✅                                  | ✅ (định dạng typed-run qua attributedBody)                                                                             |
| Đổi tên nhóm / đặt biểu tượng nhóm                         | ✅                                  | ✅                                                                                                                      |
| Thêm / xóa người tham gia, rời nhóm                        | ✅                                  | ✅                                                                                                                      |
| Biên nhận đã đọc và chỉ báo đang nhập                      | ✅                                  | ✅ (được kiểm soát bởi thăm dò API riêng tư)                                                                            |
| Gộp DM cùng người gửi                                      | ✅                                  | ✅ (chỉ DM; chọn bật qua `channels.imessage.coalesceSameSenderDms`)                                                     |
| Bắt kịp tin nhắn đầu vào nhận được khi Gateway ngừng chạy  | ✅ (phát lại Webhook + lấy lịch sử) | ✅ (chọn bật qua `channels.imessage.catchup.enabled`; đóng [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

Bắt kịp iMessage hiện khả dụng như một tính năng chọn bật trên Plugin đi kèm. Khi Gateway khởi động, nếu `channels.imessage.catchup.enabled` là `true`, Gateway chạy một lượt `chats.list` + `messages.history` theo từng cuộc trò chuyện trên cùng client JSON-RPC mà `imsg watch` sử dụng, phát lại từng hàng đầu vào bị bỏ lỡ qua đường dẫn điều phối trực tiếp (danh sách cho phép, chính sách nhóm, bộ chống dội, bộ nhớ đệm echo), và lưu một con trỏ theo từng tài khoản để các lần khởi động tiếp theo tiếp tục từ nơi đã dừng. Xem [Bắt kịp sau thời gian Gateway ngừng hoạt động](/vi/channels/imessage#catching-up-after-gateway-downtime) để tinh chỉnh.

## Ghép đôi, phiên và liên kết ACP

- **Phê duyệt ghép đôi** được chuyển tiếp theo handle. Bạn không cần phê duyệt lại người gửi đã biết — `channels.imessage.allowFrom` nhận diện cùng các chuỗi `+15555550123` / `user@example.com` mà BlueBubbles đã dùng.
- **Phiên** vẫn được giới hạn theo từng agent + cuộc trò chuyện. DM được gộp vào phiên chính của agent theo mặc định `session.dmScope=main`; phiên nhóm vẫn tách biệt theo từng `chat_id`. Khóa phiên khác nhau (`agent:<id>:imessage:group:<chat_id>` so với khóa tương đương của BlueBubbles) — lịch sử hội thoại cũ dưới các khóa phiên BlueBubbles không được chuyển vào phiên iMessage.
- **Liên kết ACP** tham chiếu `match.channel: "bluebubbles"` cần được cập nhật thành `"imessage"`. Các dạng `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle trần) là giống hệt nhau.

## Không có kênh rollback

Không có runtime BlueBubbles được hỗ trợ để chuyển lại. Nếu xác minh iMessage thất bại, đặt `channels.imessage.enabled: false`, khởi động lại Gateway, sửa điểm chặn `imsg`, rồi thử chuyển đổi lại.

Bộ nhớ đệm trả lời nằm tại `~/.openclaw/state/imessage/reply-cache.jsonl` (chế độ `0600`, thư mục cha `0700`). Có thể xóa an toàn nếu bạn muốn bắt đầu sạch.

## Liên quan

- [iMessage](/vi/channels/imessage) — tham chiếu đầy đủ cho kênh iMessage, bao gồm thiết lập `imsg launch` và phát hiện năng lực.
- `/channels/bluebubbles` — URL cũ chuyển hướng đến hướng dẫn di chuyển này.
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi.
- [Định tuyến kênh](/vi/channels/channel-routing) — cách Gateway chọn kênh cho phản hồi đầu ra.
