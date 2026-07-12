---
read_when:
    - Lập kế hoạch chuyển từ BlueBubbles sang plugin iMessage đi kèm
    - Chuyển đổi các khóa cấu hình BlueBubbles sang các khóa tương đương của iMessage
    - Xác minh imsg trước khi bật plugin iMessage
summary: 'Chuyển đổi cấu hình BlueBubbles cũ sang plugin iMessage đi kèm: ánh xạ khóa, các cổng kiểm soát danh sách cho phép của nhóm và xác minh quá trình chuyển đổi.'
title: Chuyển từ BlueBubbles sang
x-i18n:
    generated_at: "2026-07-12T07:39:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Hỗ trợ BlueBubbles đã bị loại bỏ. OpenClaw chỉ hỗ trợ iMessage thông qua plugin `imessage` đi kèm, plugin này điều khiển [`steipete/imsg`](https://github.com/steipete/imsg) qua JSON-RPC và truy cập cùng bề mặt API riêng tư mà BlueBubbles từng có (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, cuộc thăm dò ý kiến gốc, quản lý nhóm, tệp đính kèm). Một tệp nhị phân CLI thay thế máy chủ BlueBubbles + ứng dụng máy khách + hệ thống Webhook: không có điểm cuối REST, không có xác thực Webhook.

Hướng dẫn này di chuyển cấu hình `channels.bluebubbles` cũ sang `channels.imessage`. Không có lộ trình di chuyển nào khác được hỗ trợ. Trên OpenClaw hiện tại, khối `channels.bluebubbles` còn sót lại không có tác dụng — không có thành phần thời gian chạy nào đọc khối đó.

<Note>
Để xem thông báo ngắn và bản tóm tắt dành cho người vận hành, hãy xem [Loại bỏ BlueBubbles và lộ trình iMessage qua imsg](/vi/announcements/bluebubbles-imessage).
</Note>

## Danh sách kiểm tra di chuyển

Lộ trình an toàn ngắn nhất khi bạn đã biết cấu hình BlueBubbles cũ của mình:

1. Xác minh trực tiếp `imsg` trên máy Mac chạy Messages.app (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Sao chép các khóa hành vi từ `channels.bluebubbles` sang `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` và `actions`.
3. Loại bỏ các khóa truyền tải không còn tồn tại: `serverUrl`, `password`, URL Webhook và thiết lập máy chủ BlueBubbles.
4. Nếu Gateway không chạy trên máy Mac dùng Messages, hãy đặt `channels.imessage.cliPath` thành một trình bao bọc SSH và đặt `remoteHost` để tìm nạp tệp đính kèm từ xa.
5. Bật `channels.imessage`, khởi động lại Gateway, sau đó chạy `openclaw channels status --probe --channel imessage`.
6. Kiểm thử một tin nhắn trực tiếp, một nhóm được phép, tệp đính kèm nếu đã bật và mọi thao tác API riêng tư mà bạn dự kiến tác tử sẽ sử dụng.
7. Xóa máy chủ BlueBubbles và cấu hình `channels.bluebubbles` cũ sau khi đã xác minh lộ trình iMessage.

## Chức năng của imsg

`imsg` là một CLI macOS cục bộ dành cho Messages. OpenClaw khởi chạy `imsg rpc` dưới dạng tiến trình con và giao tiếp bằng JSON-RPC qua stdin/stdout. Không có máy chủ HTTP, URL Webhook, trình nền chạy ngầm, tác tử khởi chạy hoặc cổng cần công khai.

- Dữ liệu được đọc từ `~/Library/Messages/chat.db` bằng một kết nối SQLite chỉ đọc.
- Tin nhắn đến theo thời gian thực được nhận từ `imsg watch` / `watch.subscribe`, theo dõi các sự kiện hệ thống tệp của `chat.db` với cơ chế dự phòng thăm dò định kỳ.
- Thao tác gửi sử dụng tính năng tự động hóa Messages.app để gửi văn bản và tệp thông thường.
- Các thao tác nâng cao sử dụng `imsg launch` để chèn trình trợ giúp `imsg` vào Messages.app. Đây là cơ chế mở khóa xác nhận đã đọc, chỉ báo đang nhập, thao tác gửi đa phương tiện, chỉnh sửa, thu hồi, trả lời theo luồng, phản ứng tapback, cuộc thăm dò ý kiến và quản lý nhóm.
- Bản dựng Linux có thể kiểm tra một bản sao của `chat.db`, nhưng không thể gửi, theo dõi cơ sở dữ liệu trực tiếp trên máy Mac hoặc điều khiển Messages.app. Đối với iMessage của OpenClaw, hãy chạy `imsg` trên máy Mac đã đăng nhập hoặc thông qua một trình bao bọc SSH tới máy Mac đó.

## Trước khi bắt đầu

1. Cài đặt `imsg` trên máy Mac chạy Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Đối với thiết lập cục bộ thông thường, quy trình thiết lập OpenClaw có thể đề xuất cài đặt hoặc cập nhật `imsg` bằng Homebrew sau khi người dùng xác nhận trên máy Mac dùng Messages đã đăng nhập. Các mô hình thiết lập thủ công và trình bao bọc SSH vẫn do người vận hành quản lý: hãy lặp lại thao tác cập nhật Homebrew trong cùng ngữ cảnh người dùng cục bộ hoặc từ xa sẽ chạy `imsg`. Nếu `imsg chats` thất bại với `unable to open database file`, đầu ra trống hoặc `authorization denied`, hãy cấp quyền Full Disk Access cho terminal, trình soạn thảo, tiến trình Node, dịch vụ Gateway hoặc tiến trình cha SSH khởi chạy `imsg`, sau đó mở lại tiến trình cha đó.

2. Xác minh các bề mặt đọc, theo dõi, gửi và RPC trước khi thay đổi cấu hình OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Thay `42` bằng mã định danh cuộc trò chuyện thực tế từ `imsg chats`. Thao tác gửi yêu cầu quyền Automation cho Messages.app. Nếu OpenClaw sẽ chạy qua SSH, hãy chạy các lệnh này thông qua cùng trình bao bọc SSH hoặc ngữ cảnh người dùng mà OpenClaw sẽ sử dụng. Nếu thao tác đọc hoạt động nhưng thao tác gửi thất bại với lỗi AppleEvents `-1743`, hãy kiểm tra xem quyền Automation có được cấp cho `/usr/libexec/sshd-keygen-wrapper` hay không; xem [Thao tác gửi qua trình bao bọc SSH thất bại với lỗi AppleEvents -1743](/vi/channels/imessage#requirements-and-permissions-macos).

3. Bật cầu nối API riêng tư. Việc này đặc biệt được khuyến nghị cho iMessage của OpenClaw vì thao tác trả lời, tapback, hiệu ứng, cuộc thăm dò ý kiến, trả lời tệp đính kèm và thao tác nhóm phụ thuộc vào cầu nối này:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` yêu cầu tắt SIP (và trên macOS hiện đại, nới lỏng xác thực thư viện — xem [Bật API riêng tư của imsg](/vi/channels/imessage#enabling-the-imsg-private-api)). Các chức năng gửi cơ bản, lịch sử và theo dõi vẫn hoạt động khi không có `imsg launch`; toàn bộ bề mặt thao tác iMessage của OpenClaw thì không.

4. Sau khi bật `channels.imessage` và khởi động Gateway, hãy xác minh cầu nối thông qua OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Tài khoản iMessage phải báo cáo `works`; với `--json`, tải trọng thăm dò bao gồm `privateApi.available: true`. Nếu báo cáo `false`, hãy khắc phục vấn đề đó trước — xem [Phát hiện khả năng](/vi/channels/imessage#private-api-actions). Việc thăm dò yêu cầu Gateway có thể truy cập được (nếu không, CLI sẽ quay về đầu ra chỉ dựa trên cấu hình) và chỉ thăm dò các tài khoản đã được cấu hình và bật.

5. Tạo bản chụp cấu hình của bạn:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Chuyển đổi cấu hình

iMessage và BlueBubbles dùng chung phần lớn các khóa hành vi cấp kênh. Phần thay đổi là cơ chế truyền tải (máy chủ REST so với CLI cục bộ) và định dạng khóa sổ đăng ký nhóm.

| BlueBubbles                                                | iMessage tích hợp sẵn                     | Ghi chú                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Cùng ngữ nghĩa (mặc định là `true` sau khi khối này tồn tại).                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.serverUrl`                           | _(đã xóa)_                                | Không có máy chủ REST — Plugin khởi chạy `imsg rpc` qua stdio.                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(đã xóa)_                                | Không cần xác thực Webhook.                                                                                                                                                                                                                                                                                                    |
| _(ngầm định)_                                              | `channels.imessage.cliPath`               | Đường dẫn đến `imsg` (mặc định là `imsg`); sử dụng tập lệnh bọc cho SSH.                                                                                                                                                                                                                                                        |
| _(ngầm định)_                                              | `channels.imessage.dbPath`                | Ghi đè `chat.db` của Messages.app nếu cần; được tự động phát hiện khi bỏ qua.                                                                                                                                                                                                                                                   |
| _(ngầm định)_                                              | `channels.imessage.remoteHost`            | `host` hoặc `user@host` — chỉ cần khi `cliPath` là tập lệnh bọc SSH và bạn muốn tải tệp đính kèm qua SCP.                                                                                                                                                                                                                        |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Cùng các giá trị (`pairing` / `allowlist` / `open` / `disabled`); mặc định là `pairing`.                                                                                                                                                                                                                                        |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Cùng định dạng định danh (`+15555550123`, `user@example.com`). Các phê duyệt trong kho ghép nối không được chuyển sang — xem bên dưới.                                                                                                                                                                                           |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Cùng các giá trị (`allowlist` / `open` / `disabled`); mặc định là `allowlist`.                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Tương tự. Khi chưa đặt, iMessage dùng `allowFrom` làm phương án dự phòng; `groupAllowFrom: []` được đặt rõ ràng sẽ chặn tất cả nhóm khi dùng `groupPolicy: "allowlist"`.                                                                                                                                                          |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | Sao chép nguyên văn mục ký tự đại diện `"*"`; đổi khóa các mục theo nhóm bằng `chat_id` iMessage dạng số — xem “Cạm bẫy sổ đăng ký nhóm”. `requireMention`, `tools`, `toolsBySender`, `systemPrompt` được giữ nguyên.                                                                                                                |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Mặc định là `true`. Với Plugin tích hợp sẵn, tính năng này chỉ kích hoạt khi phép thăm dò API riêng tư đang hoạt động.                                                                                                                                                                                                           |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Cùng cấu trúc, cùng mặc định tắt. Nếu tệp đính kèm đã được chuyển qua BlueBubbles, hãy đặt mục này rõ ràng — ảnh/phương tiện gửi đến sẽ bị loại bỏ âm thầm (không có dòng nhật ký `Inbound message`) cho đến khi bạn thực hiện việc đó.                                                                                               |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Các thư mục gốc cục bộ; cùng quy tắc ký tự đại diện.                                                                                                                                                                                                                                                                            |
| _(Không áp dụng)_                                          | `channels.imessage.remoteAttachmentRoots` | Chỉ được dùng khi đã đặt `remoteHost` để tải tệp qua SCP.                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Mặc định là 16 MB trên iMessage (mặc định của BlueBubbles là 8 MB). Hãy đặt rõ ràng để giữ giới hạn thấp hơn.                                                                                                                                                                                                                    |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Mặc định là 4000 trên cả hai.                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Cùng cơ chế tự nguyện bật. Chỉ dành cho tin nhắn trực tiếp — nhóm vẫn điều phối theo từng tin nhắn. Mở rộng khoảng chống dội mặc định của tin nhắn gửi đến thành 7000 ms, trừ khi đã đặt `messages.inbound.byChannel.imessage` hoặc `messages.inbound.debounceMs` toàn cục. Xem [Gộp các tin nhắn trực tiếp được gửi tách biệt](/vi/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(Không áp dụng)_                          | `imsg` đã cung cấp tên hiển thị của người gửi từ `chat.db`.                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Cùng các nút bật/tắt theo hành động (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`) và thêm `polls` mới. Tất cả đều được bật theo mặc định; các hành động API riêng tư vẫn yêu cầu cầu nối.                                                                                 |

Cấu hình nhiều tài khoản (`channels.bluebubbles.accounts.*`) được chuyển đổi tương ứng một-một thành `channels.imessage.accounts.*`.

## Cạm bẫy sổ đăng ký nhóm

Plugin iMessage tích hợp sẵn chạy liên tiếp hai cổng kiểm soát nhóm. Một tin nhắn nhóm phải vượt qua cả hai để đến được tác tử:

1. **Danh sách cho phép người gửi / đích trò chuyện** (`channels.imessage.groupAllowFrom`) — khớp với định danh người gửi hoặc đích trò chuyện (các mục `chat_id:`, `chat_guid:`, `chat_identifier:`). Khi chưa đặt `groupAllowFrom`, cổng này dùng `allowFrom` làm phương án dự phòng; `groupAllowFrom: []` được đặt rõ ràng sẽ vô hiệu hóa phương án dự phòng đó và loại bỏ mọi tin nhắn nhóm khi dùng `groupPolicy: "allowlist"`.
2. **Sổ đăng ký nhóm** (`channels.imessage.groups`) — được lập khóa theo `chat_id` iMessage dạng số:
   - Không có khối `groups` (hoặc khối này trống): các nhóm vượt qua cổng này miễn là cổng 1 có danh sách cho phép người gửi hiệu lực không trống; việc lọc người gửi kiểm soát quyền truy cập và không phát cảnh báo khởi động về việc loại bỏ tất cả.
   - `groups` có mục nhưng không có `"*"`: chỉ các khóa `chat_id` được liệt kê mới vượt qua. Việc liệt kê bất kỳ nhóm nào cũng biến sổ đăng ký thành danh sách cho phép, ngay cả khi dùng `groupPolicy: "open"`.
   - `groups: { "*": { ... } }`: mọi nhóm đều vượt qua cổng này.

Cạm bẫy khi di chuyển: BlueBubbles lập khóa các mục `groups` theo GUID trò chuyện / mã định danh trò chuyện, trong khi sổ đăng ký iMessage lập khóa theo `chat_id` dạng số. Việc sao chép nguyên văn các mục theo nhóm sẽ tạo ra một sổ đăng ký không trống nhưng có các khóa không bao giờ khớp, vì vậy mọi tin nhắn nhóm đều bị loại bỏ tại cổng 2. Hãy sao chép nguyên văn ký tự đại diện `"*"`; đổi khóa các mục nhóm cụ thể bằng các giá trị `chat_id` từ `imsg chats`.

Cả hai đường dẫn loại bỏ đều hiển thị ở cấp độ nhật ký mặc định qua các dòng `warn`:

- Một lần cho mỗi tài khoản khi khởi động, nếu đã đặt `groupPolicy: "allowlist"` nhưng danh sách cho phép người gửi nhóm hiệu lực trống: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Hãy đặt `groupAllowFrom` (hoặc `allowFrom`) để cho phép người gửi; chỉ thêm `groups` không đáp ứng cổng kiểm soát người gửi.
- Một lần cho mỗi `chat_id` trong thời gian chạy, khi sổ đăng ký loại bỏ một nhóm: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`, đồng thời nêu chính xác khóa cần thêm.

Tin nhắn trực tiếp vẫn hoạt động trong cả hai trường hợp — chúng đi theo một đường dẫn mã khác, vì vậy việc tin nhắn trực tiếp hoạt động không chứng minh rằng định tuyến nhóm hoạt động.

Cấu hình tối thiểu theo phạm vi người gửi với `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

Cấu hình này cho phép những người gửi đã thiết lập trong mọi nhóm. Thêm các mục `groups` để giới hạn các cuộc trò chuyện được phép hoặc đặt các tùy chọn theo từng cuộc trò chuyện như `requireMention`; sao chép nguyên văn mục `"*"` của BlueBubbles, nhưng đổi khóa các mục cụ thể bằng giá trị `chat_id` iMessage dạng số.

## Từng bước

1. Chuyển đổi cấu hình. Giữ khối mới ở trạng thái tắt trong khi chỉnh sửa; khối `channels.bluebubbles` cũ bị OpenClaw hiện tại bỏ qua và có thể được giữ lại bên cạnh để tham khảo:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // flip to true when ready to cut over
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // wildcard copies verbatim; re-key per-chat entries by chat_id
         // actions default to enabled; set individual toggles false to disable
       },
     },
   }
   ```

2. **Chuyển sang hệ thống mới và thăm dò.** Đặt `channels.imessage.enabled: true`, khởi động lại Gateway và xác nhận kênh báo cáo trạng thái khỏe mạnh:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   Thao tác thăm dò yêu cầu Gateway có thể truy cập được và chỉ thăm dò các tài khoản đã cấu hình và bật. Dùng trực tiếp các lệnh `imsg` trong [Trước khi bắt đầu](#before-you-start) để xác thực chính máy Mac.

3. **Xác minh tin nhắn trực tiếp.** Gửi tin nhắn trực tiếp cho tác nhân; xác nhận phản hồi được gửi đến.

4. **Xác minh riêng các nhóm.** Tin nhắn trực tiếp và nhóm đi qua các đường dẫn mã khác nhau — tin nhắn trực tiếp thành công không chứng minh rằng nhóm đang được định tuyến. Gửi tin nhắn trong một cuộc trò chuyện nhóm được phép và xác nhận phản hồi được gửi đến. Nếu nhóm im lặng (không có phản hồi của tác nhân, không có lỗi), hãy kiểm tra nhật ký Gateway để tìm hai dòng `warn` từ phần "Cạm bẫy của sổ đăng ký nhóm" ở trên. Cảnh báo khi khởi động có nghĩa là danh sách người gửi được phép có hiệu lực đang trống; cảnh báo theo từng `chat_id` có nghĩa là sổ đăng ký `groups` đã có dữ liệu nhưng không chứa cuộc trò chuyện đó.

5. **Xác minh bề mặt thao tác.** Từ một tin nhắn trực tiếp đã ghép nối, yêu cầu tác nhân thả cảm xúc, chỉnh sửa, thu hồi, trả lời, gửi ảnh và (trong một nhóm) đổi tên nhóm hoặc thêm/xóa người tham gia. Mỗi thao tác phải xuất hiện theo cách nguyên bản trong Messages.app. Nếu thao tác nào trả về lỗi `iMessage <action> requires the imsg private API bridge`, hãy chạy lại `imsg launch` rồi làm mới bằng `openclaw channels status --probe`.

6. **Xóa máy chủ BlueBubbles và khối `channels.bluebubbles`** sau khi đã xác minh tin nhắn trực tiếp, nhóm và các thao tác của iMessage. OpenClaw không đọc `channels.bluebubbles`.

## Tổng quan nhanh về mức độ tương đương của thao tác

| Thao tác                                             | BlueBubbles cũ     | iMessage tích hợp sẵn                                                          |
| --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| Gửi văn bản / dự phòng bằng SMS                     | ✅                 | ✅                                                                            |
| Gửi nội dung đa phương tiện (ảnh, video, tệp, giọng nói) | ✅             | ✅                                                                            |
| Trả lời theo luồng (`reply_to_guid`)                 | ✅                 | ✅ (khắc phục [#51892](https://github.com/openclaw/openclaw/issues/51892))     |
| Phản ứng Tapback (`react`)                           | ✅                 | ✅                                                                            |
| Chỉnh sửa / thu hồi (người nhận dùng macOS 13+)     | ✅                 | ✅                                                                            |
| Gửi kèm hiệu ứng màn hình                            | ✅                 | ✅ (khắc phục một phần [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Văn bản có định dạng đậm / nghiêng / gạch chân / gạch ngang | ✅          | ✅ (định dạng theo lượt chạy được định kiểu thông qua attributedBody)          |
| Cuộc thăm dò nguyên bản của Messages (tạo và bỏ phiếu) | ❌               | ✅ (`actions.polls`; người nhận cần iOS/macOS 26+ để hiển thị nguyên bản)      |
| Đổi tên nhóm / đặt biểu tượng nhóm                   | ✅                 | ✅                                                                            |
| Thêm / xóa người tham gia, rời nhóm                  | ✅                 | ✅                                                                            |
| Xác nhận đã đọc và chỉ báo đang nhập                 | ✅                 | ✅ (phụ thuộc vào kết quả thăm dò API riêng tư)                               |
| Hợp nhất tin nhắn trực tiếp từ cùng người gửi        | ✅                 | ✅ (chỉ dành cho tin nhắn trực tiếp; phải chủ động bật qua `channels.imessage.coalesceSameSenderDms`) |
| Khôi phục tin nhắn đến sau khi khởi động lại         | ✅                 | ✅ (tự động: phát lại `since_rowid` + loại bỏ trùng lặp theo GUID; cửa sổ rộng hơn khi chạy cục bộ) |

iMessage khôi phục các tin nhắn bị bỏ lỡ trong thời gian Gateway ngừng hoạt động: khi khởi động, hệ thống phát lại từ rowid cuối cùng đã được chuyển tiếp bằng `since_rowid` của `imsg watch.subscribe`, loại bỏ trùng lặp theo GUID và dùng giới hạn tuổi của lượng tồn đọng cũ để ngăn "bom tồn đọng" khi xả Push. Quá trình này chạy qua kết nối RPC của `imsg`, nên cũng hoạt động với các thiết lập `cliPath` dùng SSH từ xa; thiết lập cục bộ có cửa sổ khôi phục rộng hơn vì có thể đọc `chat.db`. Xem [Khôi phục tin nhắn đến sau khi cầu nối hoặc Gateway khởi động lại](/vi/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Ghép nối, phiên và liên kết ACP

- **Danh sách cho phép được chuyển tiếp theo định danh.** `channels.imessage.allowFrom` nhận diện cùng các chuỗi `+15555550123` / `user@example.com` mà BlueBubbles đã dùng — hãy sao chép nguyên văn.
- **Phê duyệt trong kho ghép nối không được chuyển tiếp.** Kho ghép nối là riêng biệt cho từng kênh và không có cơ chế nào di chuyển kho BlueBubbles cũ. Những người gửi chỉ được phê duyệt thông qua ghép nối phải ghép nối lại một lần trong iMessage, hoặc bạn thêm định danh của họ vào `allowFrom`.
- **Các phiên** vẫn được phân phạm vi theo từng tác nhân + cuộc trò chuyện. Theo thiết lập mặc định `session.dmScope=main`, tin nhắn trực tiếp được hợp nhất vào phiên chính của tác nhân; phiên nhóm vẫn được cô lập theo từng `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`). Lịch sử trò chuyện cũ dưới các khóa phiên BlueBubbles không được chuyển sang phiên iMessage.
- **Các liên kết ACP** tham chiếu đến `match.channel: "bluebubbles"` phải được đổi thành `"imessage"`. Các dạng `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, định danh thuần túy) hoàn toàn giống nhau.

## Không có kênh quay lui

Không có môi trường chạy BlueBubbles được hỗ trợ để chuyển ngược về. Nếu việc xác minh iMessage thất bại, hãy đặt `channels.imessage.enabled: false`, khởi động lại Gateway, khắc phục yếu tố chặn `imsg` rồi thử chuyển đổi lại.

Bộ nhớ đệm phản hồi nằm trong trạng thái Plugin SQLite. `openclaw doctor --fix` nhập và lưu trữ tệp phụ `imessage/reply-cache.jsonl` cũ nếu có.

## Liên quan

- [Loại bỏ BlueBubbles và đường dẫn iMessage dùng imsg](/vi/announcements/bluebubbles-imessage) — thông báo ngắn và phần tóm tắt dành cho người vận hành.
- [iMessage](/vi/channels/imessage) — tài liệu tham khảo đầy đủ về kênh iMessage, bao gồm thiết lập `imsg launch` và phát hiện khả năng.
- `/channels/bluebubbles` — URL cũ chuyển hướng đến hướng dẫn di chuyển này.
- [Ghép nối](/vi/channels/pairing) — quy trình xác thực và ghép nối tin nhắn trực tiếp.
- [Định tuyến kênh](/vi/channels/channel-routing) — cách Gateway chọn kênh cho các phản hồi gửi đi.
