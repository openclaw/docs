---
read_when:
    - Thiết lập hỗ trợ iMessage
    - Gỡ lỗi gửi/nhận iMessage
summary: Hỗ trợ iMessage gốc thông qua imsg (JSON-RPC qua stdio), với các hành động API riêng tư cho trả lời, tapbacks, hiệu ứng, cuộc thăm dò, tệp đính kèm và quản lý nhóm. Được ưu tiên cho các thiết lập OpenClaw iMessage mới khi yêu cầu về máy chủ phù hợp.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T13:05:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Đối với các triển khai iMessage của OpenClaw, hãy dùng `imsg` trên một máy chủ macOS Messages đã đăng nhập. Nếu Gateway của bạn chạy trên Linux hoặc Windows, trỏ `channels.imessage.cliPath` đến một SSH wrapper chạy `imsg` trên Mac.

**Khôi phục đầu vào là tự động.** Sau khi bridge hoặc gateway khởi động lại, iMessage phát lại các tin nhắn bị bỏ lỡ khi nó ngừng hoạt động và chặn "backlog bomb" cũ mà Apple có thể xả ra sau khi khôi phục Push, đồng thời khử trùng lặp để không có gì được gửi đi hai lần. Không có cấu hình nào cần bật — xem [Khôi phục đầu vào sau khi bridge hoặc gateway khởi động lại](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Hỗ trợ BlueBubbles đã bị gỡ bỏ. Di chuyển cấu hình `channels.bluebubbles` sang `channels.imessage`; OpenClaw chỉ hỗ trợ iMessage thông qua `imsg`. Bắt đầu với [Gỡ bỏ BlueBubbles và đường dẫn iMessage imsg](/vi/announcements/bluebubbles-imessage) để xem thông báo ngắn, hoặc [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) để xem bảng di chuyển đầy đủ.
</Warning>

Trạng thái: tích hợp CLI ngoài gốc. Gateway khởi chạy `imsg rpc` và giao tiếp qua JSON-RPC trên stdio (không có daemon/cổng riêng). Các hành động nâng cao yêu cầu `imsg launch` và một phép thăm dò API riêng tư thành công.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Trả lời, tapback, hiệu ứng, khảo sát, tệp đính kèm và quản lý nhóm.
  </Card>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    DM iMessage mặc định ở chế độ ghép đôi.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Dùng SSH wrapper khi Gateway không chạy trên Mac Messages.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/vi/gateway/config-channels#imessage">
    Tham chiếu đầy đủ các trường iMessage.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Yêu cầu ghép đôi hết hạn sau 1 giờ.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw chỉ yêu cầu `cliPath` tương thích với stdio, vì vậy bạn có thể trỏ `cliPath` đến một wrapper script SSH vào Mac từ xa và chạy `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Cấu hình khuyến nghị khi bật tệp đính kèm:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Nếu `remoteHost` chưa được đặt, OpenClaw cố gắng tự phát hiện bằng cách phân tích SSH wrapper script.
    `remoteHost` phải là `host` hoặc `user@host` (không có dấu cách hoặc tùy chọn SSH).
    OpenClaw dùng kiểm tra host-key nghiêm ngặt cho SCP, vì vậy khóa máy chủ relay phải đã tồn tại trong `~/.ssh/known_hosts`.
    Đường dẫn tệp đính kèm được xác thực theo các gốc được phép (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Bất kỳ `cliPath` wrapper hoặc proxy SSH nào bạn đặt trước `imsg` PHẢI hoạt động như một ống stdio trong suốt cho JSON-RPC chạy lâu dài. OpenClaw trao đổi các thông điệp JSON-RPC nhỏ, đóng khung bằng dòng mới, qua stdin/stdout của wrapper trong suốt vòng đời của kênh:

- Chuyển tiếp từng đoạn/dòng stdin **ngay khi có byte khả dụng** — đừng chờ EOF.
- Chuyển tiếp kịp thời từng đoạn/dòng stdout theo hướng ngược lại.
- Giữ nguyên dòng mới.
- Tránh các lệnh đọc chặn kích thước cố định (`read(4096)`, `cat | buffer`, shell `read` mặc định) có thể làm đói các frame nhỏ.
- Giữ stderr tách khỏi luồng stdout JSON-RPC.

Wrapper đệm stdin cho đến khi một khối lớn đầy sẽ tạo ra triệu chứng giống như sự cố iMessage — `imsg rpc timeout (chats.list)` hoặc kênh khởi động lại lặp lại — dù bản thân `imsg rpc` vẫn khỏe mạnh. `ssh -T host imsg "$@"` (ở trên) là an toàn vì nó chuyển tiếp các đối số `cliPath` của OpenClaw như `rpc` và `--db`. Các pipeline như `ssh host imsg | grep -v '^DEBUG'` thì KHÔNG — công cụ đệm theo dòng vẫn có thể giữ frame; dùng `stdbuf -oL -eL` trên mọi stage nếu bạn bắt buộc phải lọc.
</Warning>

  </Tab>
</Tabs>

## Yêu cầu và quyền (macOS)

- Messages phải được đăng nhập trên Mac chạy `imsg`.
- Cần Full Disk Access cho ngữ cảnh tiến trình chạy OpenClaw/`imsg` (truy cập DB Messages).
- Cần quyền Automation để gửi tin nhắn qua Messages.app.
- Đối với hành động nâng cao (react / edit / unsend / threaded reply / effects / polls / group ops), System Integrity Protection phải bị tắt — xem [Bật API riêng tư của imsg](#enabling-the-imsg-private-api) bên dưới. Gửi/nhận văn bản và phương tiện cơ bản hoạt động mà không cần điều này.

<Tip>
Quyền được cấp theo từng ngữ cảnh tiến trình. Nếu gateway chạy headless (LaunchAgent/SSH), hãy chạy một lệnh tương tác một lần trong cùng ngữ cảnh đó để kích hoạt lời nhắc:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  Một thiết lập remote-SSH có thể đọc cuộc trò chuyện, vượt qua `channels status --probe`, và xử lý tin nhắn đầu vào trong khi gửi đầu ra vẫn thất bại với lỗi ủy quyền AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Kiểm tra cơ sở dữ liệu TCC của người dùng Mac đã đăng nhập hoặc System Settings > Privacy & Security > Automation. Nếu mục Automation được ghi cho `/usr/libexec/sshd-keygen-wrapper` thay vì tiến trình `imsg` hoặc shell cục bộ, macOS có thể không hiển thị nút bật/tắt Messages dùng được cho client phía máy chủ SSH đó:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Ở trạng thái đó, việc lặp lại `tccutil reset AppleEvents` hoặc chạy lại `imsg send` qua cùng SSH wrapper có thể tiếp tục thất bại vì ngữ cảnh tiến trình cần Messages Automation là SSH wrapper, không phải một ứng dụng mà UI có thể cấp quyền.

Thay vào đó, hãy dùng một trong các ngữ cảnh tiến trình `imsg` được hỗ trợ:

- Chạy Gateway, hoặc ít nhất bridge `imsg`, trong phiên cục bộ của người dùng Messages đã đăng nhập.
- Khởi động Gateway bằng LaunchAgent cho người dùng đó sau khi cấp Full Disk Access và Automation từ cùng phiên.
- Nếu bạn giữ cấu trúc SSH hai người dùng, hãy xác minh rằng một lệnh `imsg send` đầu ra thực sự thành công qua đúng wrapper trước khi bật kênh. Nếu không thể cấp Automation, hãy cấu hình lại sang thiết lập `imsg` một người dùng thay vì dựa vào SSH wrapper để gửi.

</Accordion>

## Bật API riêng tư của imsg

`imsg` đi kèm hai chế độ vận hành:

- **Chế độ cơ bản** (mặc định, không cần thay đổi SIP): văn bản và phương tiện đầu ra qua `send`, theo dõi/lịch sử đầu vào, danh sách cuộc trò chuyện. Đây là những gì bạn có ngay sau khi `brew install steipete/tap/imsg` mới cùng các quyền macOS chuẩn ở trên.
- **Chế độ API riêng tư**: `imsg` tiêm một helper dylib vào `Messages.app` để gọi các hàm `IMCore` nội bộ. Điều này mở khóa `react`, `edit`, `unsend`, `reply` (theo luồng), `sendWithEffect`, `poll` và `poll-vote` (khảo sát Messages gốc), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, cùng chỉ báo đang nhập và biên nhận đã đọc.

Để dùng bề mặt hành động nâng cao mà trang kênh này ghi lại, bạn cần chế độ API riêng tư. README của `imsg` nêu rõ yêu cầu:

> Các tính năng nâng cao như `read`, `typing`, `launch`, gửi phong phú dựa trên bridge, sửa đổi tin nhắn và quản lý cuộc trò chuyện là tùy chọn bật. Chúng yêu cầu tắt SIP và tiêm một helper dylib vào `Messages.app`. `imsg launch` từ chối tiêm khi SIP đang bật.

Kỹ thuật tiêm helper dùng dylib riêng của `imsg` để truy cập API riêng tư của Messages. Không có máy chủ bên thứ ba hoặc runtime BlueBubbles trong đường dẫn iMessage của OpenClaw.

<Warning>
**Tắt SIP là một đánh đổi bảo mật thực sự.** SIP là một trong những lớp bảo vệ cốt lõi của macOS chống lại việc chạy mã hệ thống đã sửa đổi; tắt nó trên toàn hệ thống sẽ mở thêm bề mặt tấn công và tác dụng phụ. Đáng chú ý, **tắt SIP trên máy Mac Apple Silicon cũng vô hiệu hóa khả năng cài đặt và chạy ứng dụng iOS trên Mac của bạn**.

Hãy xem đây là một lựa chọn vận hành có chủ đích, không phải mặc định. Nếu mô hình đe dọa của bạn không thể chấp nhận việc SIP bị tắt, iMessage tích hợp chỉ giới hạn ở chế độ cơ bản — chỉ gửi/nhận văn bản và phương tiện, không có reactions / edit / unsend / effects / group ops.
</Warning>

### Thiết lập

1. **Cài đặt (hoặc nâng cấp) `imsg`** trên Mac chạy Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Đầu ra `imsg status --json` báo cáo `bridge_version`, `rpc_methods` và `selectors` theo từng phương thức để bạn có thể thấy bản build hiện tại hỗ trợ gì trước khi bắt đầu.

2. **Tắt System Integrity Protection, và (trên macOS hiện đại) Library Validation.** Việc tiêm một helper dylib không phải của Apple vào `Messages.app` đã ký bởi Apple cần SIP tắt **và** library validation được nới lỏng. Bước SIP trong Recovery-mode phụ thuộc vào phiên bản macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** tắt Library Validation qua Terminal, khởi động lại vào Recovery Mode, chạy `csrutil disable`, khởi động lại.
   - **macOS 11+ (Big Sur trở lên), Intel:** Recovery Mode (hoặc Internet Recovery), `csrutil disable`, khởi động lại.
   - **macOS 11+, Apple Silicon:** trình tự khởi động bằng nút nguồn để vào Recovery; trên các phiên bản macOS gần đây, giữ phím **Left Shift** khi bạn nhấp Continue, rồi `csrutil disable`. Thiết lập máy ảo theo một luồng riêng, nên hãy tạo snapshot VM trước.

   **Trên macOS 11 trở lên, chỉ `csrutil disable` thường là chưa đủ.** Apple vẫn áp dụng library validation đối với `Messages.app` như một platform binary, nên helper ký adhoc bị từ chối (`Library Validation failed: ... platform binary, but mapped file is not`) ngay cả khi SIP đã tắt. Sau khi tắt SIP, cũng tắt library validation và khởi động lại:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), đã xác minh trên 26.5.1:** SIP tắt **cộng với** lệnh `DisableLibraryValidation` ở trên là đủ để tiêm helper trên các phiên bản 26.0 đến 26.5.x. **Không cần boot-args.** Plist là yếu tố quyết định và là bước thiếu phổ biến nhất khi tiêm thất bại trên Tahoe:
   - **Có plist:** `imsg launch` tiêm được và `imsg status` báo cáo `advanced_features: true`.
   - **Không có plist (ngay cả khi SIP tắt):** `imsg launch` thất bại với `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI từ chối helper adhoc khi tải, nên bridge không bao giờ sẵn sàng và quá trình launch hết thời gian chờ. Timeout đó là triệu chứng mà hầu hết mọi người gặp trên Tahoe, và cách sửa là plist ở trên, không phải biện pháp nào mạnh tay hơn.

   Điều này đã được xác nhận bằng kiểm thử trước/sau có kiểm soát trên macOS 26.5.1 (Apple Silicon): có plist thì dylib được map vào `Messages.app` và bridge khởi động; xóa plist rồi khởi động lại thì `imsg launch` tạo ra lỗi timeout ở trên, với dylib không được map.

   Nếu việc tiêm qua `imsg launch` hoặc các `selectors` cụ thể bắt đầu trả về false sau khi nâng cấp macOS, cổng kiểm tra này thường là nguyên nhân. Hãy kiểm tra trạng thái SIP và xác thực thư viện trước khi cho rằng chính bước SIP đã thất bại. Nếu các thiết lập đó đúng mà bridge vẫn không thể tiêm, hãy thu thập `imsg status --json` cùng đầu ra của `imsg launch` và báo cáo cho dự án `imsg` thay vì nới lỏng thêm các kiểm soát bảo mật trên toàn hệ thống.

   Làm theo quy trình Recovery mode của Apple cho máy Mac của bạn để tắt SIP trước khi chạy `imsg launch`.

3. **Tiêm helper.** Khi SIP đã tắt và Messages.app đã đăng nhập:

   ```bash
   imsg launch
   ```

   `imsg launch` từ chối tiêm khi SIP vẫn đang bật, nên lệnh này cũng đóng vai trò xác nhận rằng bước 2 đã có hiệu lực.

4. **Xác minh bridge từ OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Mục iMessage nên báo cáo `works`, và `imsg status --json | jq '{rpc_methods, selectors}'` nên hiển thị các năng lực mà bản dựng macOS của bạn phơi bày. Tạo cuộc thăm dò ý kiến yêu cầu `selectors.pollPayloadMessage`; bỏ phiếu yêu cầu cả `selectors.pollVoteMessage` và phương thức RPC `poll.vote`. Plugin OpenClaw chỉ quảng bá các hành động được probe đã lưu trong bộ nhớ đệm hỗ trợ, trong khi bộ nhớ đệm trống vẫn giữ trạng thái lạc quan và probe ở lần gửi đầu tiên.

Nếu `openclaw channels status --probe` báo cáo kênh là `works` nhưng các hành động cụ thể ném lỗi "iMessage `<action>` requires the imsg private API bridge" tại thời điểm gửi, hãy chạy lại `imsg launch` — helper có thể bị rơi ra (Messages.app khởi động lại, cập nhật hệ điều hành, v.v.) và trạng thái `available: true` đã lưu trong bộ nhớ đệm sẽ tiếp tục quảng bá hành động cho đến khi lần probe tiếp theo làm mới.

### Khi bạn không thể tắt SIP

Nếu việc tắt SIP không phù hợp với mô hình đe dọa của bạn:

- `imsg` quay về chế độ cơ bản — chỉ văn bản + media + nhận.
- Plugin OpenClaw vẫn quảng bá gửi văn bản/media và giám sát đầu vào; nó chỉ ẩn `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, và các thao tác nhóm khỏi bề mặt hành động (theo cổng năng lực từng phương thức).
- Bạn có thể chạy một máy Mac không dùng Apple Silicon riêng (hoặc một máy Mac bot chuyên dụng) với SIP tắt cho khối lượng công việc iMessage, trong khi vẫn bật SIP trên các thiết bị chính của bạn. Xem [Người dùng macOS bot chuyên dụng (danh tính iMessage riêng)](#deployment-patterns) bên dưới.

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` kiểm soát tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    Trường danh sách cho phép: `channels.imessage.allowFrom`.

    Các mục danh sách cho phép phải định danh người gửi: handle hoặc nhóm truy cập người gửi tĩnh (`accessGroup:<name>`). Dùng `channels.imessage.groupAllowFrom` cho các mục tiêu chat như `chat_id:*`, `chat_guid:*`, hoặc `chat_identifier:*`; dùng `channels.imessage.groups` cho các khóa registry `chat_id` dạng số.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` kiểm soát xử lý nhóm:

    - `allowlist` (mặc định khi được cấu hình)
    - `open`
    - `disabled`

    Danh sách cho phép người gửi nhóm: `channels.imessage.groupAllowFrom`.

    Các mục `groupAllowFrom` cũng có thể tham chiếu nhóm truy cập người gửi tĩnh (`accessGroup:<name>`).

    Dự phòng runtime: nếu `groupAllowFrom` chưa được đặt, kiểm tra người gửi nhóm iMessage dùng `allowFrom`; đặt `groupAllowFrom` khi quyền vào DM và nhóm cần khác nhau.
    Ghi chú runtime: nếu `channels.imessage` hoàn toàn thiếu, runtime quay về `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` được đặt).

    <Warning>
    Định tuyến nhóm có **hai** cổng danh sách cho phép chạy nối tiếp, và cả hai đều phải vượt qua:

    1. **Danh sách cho phép người gửi / mục tiêu chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, hoặc `chat_id`.
    2. **Registry nhóm** (`channels.imessage.groups`) — với `groupPolicy: "allowlist"`, cổng này yêu cầu hoặc một mục wildcard `groups: { "*": { ... } }` (đặt `allowAll = true`), hoặc một mục rõ ràng theo từng `chat_id` dưới `groups`.

    Nếu cổng 2 không có gì, mọi tin nhắn nhóm đều bị loại bỏ. Plugin phát ra hai tín hiệu cấp `warn` ở mức nhật ký mặc định:

    - một lần cho mỗi tài khoản khi khởi động: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - một lần cho mỗi `chat_id` tại runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM tiếp tục hoạt động vì chúng đi theo một đường mã khác.

    Cấu hình tối thiểu để giữ nhóm tiếp tục chảy dưới `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Nếu các dòng `warn` đó xuất hiện trong nhật ký Gateway, cổng 2 đang loại bỏ — hãy thêm khối `groups`.
    </Warning>

    Cổng nhắc tên cho nhóm:

    - iMessage không có siêu dữ liệu nhắc tên gốc
    - phát hiện nhắc tên dùng các mẫu regex (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - khi không có mẫu được cấu hình, cổng nhắc tên không thể được thực thi

    Các lệnh điều khiển từ người gửi được ủy quyền có thể bỏ qua cổng nhắc tên trong nhóm.

    `systemPrompt` theo từng nhóm:

    Mỗi mục dưới `channels.imessage.groups.*` chấp nhận chuỗi `systemPrompt` tùy chọn. Giá trị được tiêm vào system prompt của agent ở mọi lượt xử lý tin nhắn trong nhóm đó. Cách phân giải phản chiếu phân giải prompt theo từng nhóm được `channels.whatsapp.groups` dùng:

    1. **System prompt dành riêng cho nhóm** (`groups["<chat_id>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`) thì wildcard bị chặn và không có system prompt nào được áp dụng cho nhóm đó.
    2. **System prompt wildcard nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn vắng mặt khỏi map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompt theo từng nhóm chỉ áp dụng cho tin nhắn nhóm — tin nhắn trực tiếp trong kênh này không bị ảnh hưởng.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM dùng định tuyến trực tiếp; nhóm dùng định tuyến nhóm.
    - Với `session.dmScope=main` mặc định, DM iMessage được gộp vào phiên chính của agent.
    - Phiên nhóm được cô lập (`agent:<agentId>:imessage:group:<chat_id>`).
    - Trả lời được định tuyến ngược về iMessage bằng siêu dữ liệu kênh/mục tiêu gốc.

    Hành vi luồng kiểu nhóm:

    Một số luồng iMessage nhiều người tham gia có thể đến với `is_group=false`.
    Nếu `chat_id` đó được cấu hình rõ ràng dưới `channels.imessage.groups`, OpenClaw xử lý nó như lưu lượng nhóm (cổng nhóm + cô lập phiên nhóm).

  </Tab>
</Tabs>

## Liên kết hội thoại ACP

Các chat iMessage cũ cũng có thể được liên kết với phiên ACP.

Luồng thao tác nhanh:

- Chạy `/acp spawn codex --bind here` bên trong DM hoặc chat nhóm được cho phép.
- Các tin nhắn tương lai trong cùng hội thoại iMessage đó định tuyến tới phiên ACP đã spawn.
- `/new` và `/reset` đặt lại cùng phiên ACP đã liên kết tại chỗ.
- `/acp close` đóng phiên ACP và xóa liên kết.

Liên kết bền vững được cấu hình được hỗ trợ thông qua các mục `bindings[]` cấp cao nhất với `type: "acp"` và `match.channel: "imessage"`.

`match.peer.id` có thể dùng:

- handle DM đã chuẩn hóa như `+15555550123` hoặc `user@example.com`
- `chat_id:<id>` (khuyến nghị cho liên kết nhóm ổn định)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

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
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Xem [Agent ACP](/vi/tools/acp-agents) để biết hành vi liên kết ACP dùng chung.

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Dùng một Apple ID và người dùng macOS chuyên dụng để lưu lượng bot được cô lập khỏi hồ sơ Messages cá nhân của bạn.

    Luồng điển hình:

    1. Tạo/đăng nhập một người dùng macOS chuyên dụng.
    2. Đăng nhập vào Messages bằng Apple ID của bot trong người dùng đó.
    3. Cài đặt `imsg` trong người dùng đó.
    4. Tạo wrapper SSH để OpenClaw có thể chạy `imsg` trong ngữ cảnh người dùng đó.
    5. Trỏ `channels.imessage.accounts.<id>.cliPath` và `.dbPath` tới hồ sơ người dùng đó.

    Lần chạy đầu tiên có thể yêu cầu phê duyệt GUI (Automation + Full Disk Access) trong phiên người dùng bot đó.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Topology phổ biến:

    - Gateway chạy trên Linux/VM
    - iMessage + `imsg` chạy trên một máy Mac trong tailnet của bạn
    - wrapper `cliPath` dùng SSH để chạy `imsg`
    - `remoteHost` bật tìm nạp tệp đính kèm qua SCP

    Ví dụ:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Dùng khóa SSH để cả SSH và SCP đều không tương tác.
    Trước tiên hãy bảo đảm host key đã được tin cậy (ví dụ `ssh bot@mac-mini.tailnet-1234.ts.net`) để `known_hosts` được điền.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage hỗ trợ cấu hình theo từng tài khoản dưới `channels.imessage.accounts`.

    Mỗi tài khoản có thể ghi đè các trường như `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, thiết lập lịch sử, và danh sách cho phép gốc tệp đính kèm.

  </Accordion>

  <Accordion title="Direct-message history">
    Đặt `channels.imessage.dmHistoryLimit` để khởi tạo phiên tin nhắn trực tiếp mới bằng lịch sử `imsg` đã giải mã gần đây cho hội thoại đó. Dùng `channels.imessage.dms["<sender>"].historyLimit` cho ghi đè theo từng người gửi, bao gồm `0` để tắt lịch sử cho một người gửi.

    Lịch sử DM iMessage được tìm nạp theo yêu cầu từ `imsg`. Không đặt `dmHistoryLimit` sẽ tắt khởi tạo lịch sử DM toàn cục, nhưng `channels.imessage.dms["<sender>"].historyLimit` dương theo từng người gửi vẫn bật khởi tạo cho người gửi đó.

  </Accordion>
</AccordionGroup>

## Media, chia nhỏ, và mục tiêu gửi

<AccordionGroup>
  <Accordion title="Tệp đính kèm và phương tiện">
    - nạp tệp đính kèm đầu vào **tắt theo mặc định** — đặt `channels.imessage.includeAttachments: true` để chuyển ảnh, bản ghi âm, video và các tệp đính kèm khác tới tác nhân. Khi tắt, iMessage chỉ có tệp đính kèm sẽ bị loại bỏ trước khi tới tác nhân và có thể hoàn toàn không tạo dòng log `Inbound message`.
    - đường dẫn tệp đính kèm từ xa có thể được lấy qua SCP khi đặt `remoteHost`
    - đường dẫn tệp đính kèm phải khớp với các gốc được phép:
      - `channels.imessage.attachmentRoots` (cục bộ)
      - `channels.imessage.remoteAttachmentRoots` (chế độ SCP từ xa)
      - mẫu gốc mặc định: `/Users/*/Library/Messages/Attachments`
    - SCP dùng kiểm tra khóa máy chủ nghiêm ngặt (`StrictHostKeyChecking=yes`)
    - kích thước phương tiện gửi đi dùng `channels.imessage.mediaMaxMb` (mặc định 16 MB)

  </Accordion>

  <Accordion title="Chia đoạn gửi đi">
    - giới hạn đoạn văn bản: `channels.imessage.textChunkLimit` (mặc định 4000)
    - chế độ chia đoạn: `channels.imessage.chunkMode`
      - `length` (mặc định)
      - `newline` (ưu tiên tách theo đoạn văn)

  </Accordion>

  <Accordion title="Định dạng địa chỉ">
    Đích tường minh được ưu tiên:

    - `chat_id:123` (khuyến nghị để định tuyến ổn định)
    - `chat_guid:...`
    - `chat_identifier:...`

    Đích dạng handle cũng được hỗ trợ:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Hành động API riêng tư

Khi `imsg launch` đang chạy và `openclaw channels status --probe` báo cáo `privateApi.available: true`, công cụ tin nhắn có thể dùng các hành động gốc của iMessage ngoài thao tác gửi văn bản thông thường.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Hành động có sẵn">
    - **react**: Thêm/xóa tapback iMessage (`messageId`, `emoji`, `remove`). Các tapback được hỗ trợ ánh xạ tới love, like, dislike, laugh, emphasize và question.
    - **reply**: Gửi trả lời theo luồng tới một tin nhắn hiện có (`messageId`, `text` hoặc `message`, cùng với `chatGuid`, `chatId`, `chatIdentifier`, hoặc `to`).
    - **sendWithEffect**: Gửi văn bản kèm hiệu ứng iMessage (`text` hoặc `message`, `effect` hoặc `effectId`).
    - **edit**: Sửa một tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`, `text` hoặc `newText`).
    - **unsend**: Thu hồi một tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`).
    - **upload-file**: Gửi phương tiện/tệp (`buffer` ở dạng base64 hoặc `media`/`path`/`filePath` đã được hydrate, `filename`, `asVoice` tùy chọn). Bí danh cũ: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Quản lý trò chuyện nhóm khi đích hiện tại là một cuộc trò chuyện nhóm.
    - **poll**: Tạo một cuộc thăm dò Apple Messages gốc (`pollQuestion`, `pollOption` lặp lại 2 đến 12 lần, cùng với `chatGuid`, `chatId`, `chatIdentifier`, hoặc `to`). Người nhận trên iOS/iPadOS/macOS 26+ thấy và bỏ phiếu trực tiếp theo cách gốc; các phiên bản hệ điều hành cũ hơn nhận văn bản dự phòng "Sent a poll". Yêu cầu `selectors.pollPayloadMessage`.
    - **poll-vote**: Bỏ phiếu cho một cuộc thăm dò hiện có (`pollId` hoặc `messageId`, cùng với đúng một trong `pollOptionIndex`, `pollOptionId`, hoặc `pollOptionText`). Yêu cầu `selectors.pollVoteMessage` và phương thức RPC `poll.vote`.

    Các cuộc thăm dò đầu vào được chấp nhận được hiển thị cho tác nhân với câu hỏi, nhãn lựa chọn đánh số, số phiếu và ID tin nhắn thăm dò cần cho `poll-vote`.

  </Accordion>

  <Accordion title="ID tin nhắn">
    Ngữ cảnh iMessage đầu vào bao gồm cả giá trị `MessageSid` ngắn và GUID tin nhắn đầy đủ khi có. ID ngắn nằm trong phạm vi cache trả lời gần đây dựa trên SQLite và được kiểm tra theo cuộc trò chuyện hiện tại trước khi dùng. Nếu một ID ngắn đã hết hạn hoặc thuộc về cuộc trò chuyện khác, hãy thử lại với `MessageSidFull` đầy đủ.

  </Accordion>

  <Accordion title="Phát hiện năng lực">
    OpenClaw chỉ ẩn các hành động API riêng tư khi trạng thái thăm dò được cache cho biết bridge không khả dụng. Nếu trạng thái chưa biết, các hành động vẫn hiển thị và sẽ thăm dò khi dispatch một cách lười biếng để hành động đầu tiên có thể thành công sau `imsg launch` mà không cần làm mới trạng thái thủ công riêng.

  </Accordion>

  <Accordion title="Thông báo đã đọc và đang nhập">
    Khi bridge API riêng tư hoạt động, các cuộc trò chuyện đầu vào được chấp nhận được đánh dấu là đã đọc và trò chuyện trực tiếp hiển thị bong bóng đang nhập ngay khi lượt được chấp nhận, trong lúc tác nhân chuẩn bị ngữ cảnh và tạo phản hồi. Tắt đánh dấu đã đọc bằng:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Các bản dựng `imsg` cũ hơn danh sách năng lực theo từng phương thức sẽ âm thầm chặn typing/read; OpenClaw ghi log cảnh báo một lần cho mỗi lần khởi động lại để việc thiếu thông báo đã đọc có thể được truy nguyên.

  </Accordion>

  <Accordion title="Tapback đầu vào">
    OpenClaw đăng ký tapback iMessage và định tuyến các phản ứng được chấp nhận dưới dạng sự kiện hệ thống thay vì văn bản tin nhắn thông thường, nên tapback của người dùng không kích hoạt vòng lặp trả lời thông thường.

    Chế độ thông báo được điều khiển bởi `channels.imessage.reactionNotifications`:

    - `"own"` (mặc định): chỉ thông báo khi người dùng phản ứng với tin nhắn do bot viết.
    - `"all"`: thông báo cho tất cả tapback đầu vào từ người gửi được ủy quyền.
    - `"off"`: bỏ qua tapback đầu vào.

    Ghi đè theo tài khoản dùng `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Phản ứng phê duyệt (👍 / 👎)">
    Khi `approvals.exec.enabled` hoặc `approvals.plugin.enabled` là true và yêu cầu được định tuyến tới iMessage, gateway gửi lời nhắc phê duyệt theo cách gốc và chấp nhận tapback để xử lý:

    - `👍` (Like tapback) → `allow-once`
    - `👎` (Dislike tapback) → `deny`
    - `allow-always` vẫn là phương án dự phòng thủ công: gửi `/approve <id> allow-always` như một trả lời thông thường.

    Xử lý phản ứng yêu cầu handle của người phản ứng phải là người phê duyệt tường minh. Danh sách người phê duyệt được đọc từ `channels.imessage.allowFrom` (hoặc `channels.imessage.accounts.<id>.allowFrom`); thêm số điện thoại của người dùng ở dạng E.164 hoặc email Apple ID của họ. Mục wildcard `"*"` được tôn trọng nhưng cho phép bất kỳ người gửi nào phê duyệt. Lối tắt phản ứng cố ý bỏ qua `reactionNotifications`, `dmPolicy` và `groupAllowFrom` vì allowlist người phê duyệt tường minh là cổng duy nhất quan trọng để xử lý phê duyệt.

    **Thay đổi hành vi trong bản phát hành này:** Khi `channels.imessage.allowFrom` không rỗng, lệnh văn bản `/approve <id> <decision>` giờ được ủy quyền theo danh sách người phê duyệt đó (không phải allowlist DM rộng hơn). Người gửi được phép trong allowlist DM nhưng không có trong `allowFrom` sẽ nhận thông báo từ chối tường minh. Thêm mọi operator cần có khả năng phê duyệt qua `/approve` (và qua phản ứng) vào `allowFrom` để giữ hành vi trước đó. Khi `allowFrom` rỗng, "same-chat fallback" cũ vẫn có hiệu lực và `/approve` tiếp tục ủy quyền bất kỳ ai mà allowlist DM cho phép.

    Ghi chú cho operator:
    - Liên kết phản ứng được lưu cả trong bộ nhớ (với TTL khớp với thời điểm hết hạn phê duyệt) và trong kho khóa bền vững của gateway, nên tapback đến ngay sau khi gateway khởi động lại vẫn xử lý được phê duyệt.
    - Tapback liên thiết bị `is_from_me=true` (phản ứng của chính operator trên thiết bị Apple đã ghép đôi) bị cố ý bỏ qua để bot không thể tự phê duyệt.
    - Tapback kiểu văn bản cũ (`Liked "…"` dạng văn bản thuần từ các client Apple rất cũ) không thể xử lý phê duyệt vì chúng không mang GUID tin nhắn; xử lý phản ứng yêu cầu metadata tapback có cấu trúc mà các client macOS / iOS hiện tại phát ra.

  </Accordion>
</AccordionGroup>

## Ghi cấu hình

iMessage cho phép các thao tác ghi cấu hình do kênh khởi tạo theo mặc định (cho `/config set|unset` khi `commands.config: true`).

Tắt:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Gộp DM gửi tách (lệnh + URL trong một lần soạn)

Khi người dùng nhập một lệnh và một URL cùng nhau — ví dụ `Dump https://example.com/article` — ứng dụng Messages của Apple tách lần gửi thành **hai hàng `chat.db` riêng biệt**:

1. Một tin nhắn văn bản (`"Dump"`).
2. Một bong bóng xem trước URL (`"https://..."`) với ảnh xem trước OG dưới dạng tệp đính kèm.

Hai hàng này tới OpenClaw cách nhau khoảng 0,8-2,0 giây trên hầu hết thiết lập. Nếu không gộp, tác nhân nhận riêng lệnh ở lượt 1, trả lời (thường là "send me the URL"), và chỉ thấy URL ở lượt 2 — lúc đó ngữ cảnh lệnh đã mất. Đây là pipeline gửi của Apple, không phải thứ OpenClaw hay `imsg` đưa vào.

`channels.imessage.coalesceSameSenderDms` chọn đưa một DM vào bộ đệm các hàng liên tiếp từ cùng người gửi. Khi `imsg` cung cấp dấu hiệu xem trước URL có cấu trúc `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` trên một trong các hàng nguồn, OpenClaw chỉ gộp lần gửi tách thực sự đó và giữ mọi hàng được đệm khác thành các lượt riêng. Trên các bản dựng `imsg` cũ hơn hoàn toàn không phát metadata bong bóng, OpenClaw không thể phân biệt gửi tách với các lần gửi riêng, nên nó quay về gộp cả bucket. Điều đó giữ hành vi trước khi có metadata thay vì làm thụt lùi các lần gửi tách `Dump <url>` thành hai lượt. Trò chuyện nhóm tiếp tục dispatch theo từng tin nhắn để cấu trúc lượt nhiều người dùng được giữ nguyên.

<Tabs>
  <Tab title="Khi nào bật">
    Bật khi:

    - Bạn cung cấp skills cần `command + payload` trong một tin nhắn (dump, paste, save, queue, v.v.).
    - Người dùng của bạn dán URL cùng với lệnh.
    - Bạn có thể chấp nhận độ trễ lượt DM tăng thêm (xem bên dưới).

    Để tắt khi:

    - Bạn cần độ trễ lệnh tối thiểu cho các trigger DM một từ.
    - Tất cả flow của bạn là lệnh một lần không có payload theo sau.

  </Tab>
  <Tab title="Bật">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Khi bật cờ này và không có `messages.inbound.byChannel.imessage` tường minh hoặc `messages.inbound.debounceMs` toàn cục, cửa sổ debounce mở rộng thành **7000 ms** (mặc định cũ là 0 ms — không debounce). Cửa sổ rộng hơn là bắt buộc vì nhịp gửi tách xem trước URL của Apple có thể kéo dài vài giây trong khi Messages.app phát hàng xem trước.

    Để tự tinh chỉnh cửa sổ:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Đánh đổi">
    - **Hợp nhất chính xác cần siêu dữ liệu tải trọng `imsg` hiện tại.** Khi hàng URL có `balloon_bundle_id`, chỉ lần gửi tách thực sự đó được hợp nhất và các hàng đã đệm khác vẫn tách riêng. Trên các bản dựng `imsg` cũ không hiển thị siêu dữ liệu balloon, OpenClaw quay về hợp nhất bucket đã đệm để các lần gửi tách `Dump <url>` không bị hồi quy thành hai lượt (tương thích ngược tạm thời, sẽ gỡ bỏ khi `imsg` hợp nhất gửi tách ở upstream).
    - **Tăng độ trễ cho tin nhắn DM.** Khi bật cờ, mọi DM (bao gồm lệnh điều khiển độc lập và phản hồi tiếp theo chỉ có một đoạn văn bản) chờ tối đa đến cửa sổ debounce trước khi gửi đi, phòng trường hợp một hàng xem trước URL sắp đến. Tin nhắn trò chuyện nhóm vẫn được gửi tức thì.
    - **Đầu ra hợp nhất có giới hạn.** Văn bản hợp nhất giới hạn ở 4000 ký tự với dấu `…[truncated]` rõ ràng; tệp đính kèm giới hạn ở 20; mục nguồn giới hạn ở 10 (giữ mục đầu tiên cộng mục mới nhất nếu vượt quá). Mọi GUID nguồn được theo dõi trong `coalescedMessageGuids` cho telemetry downstream.
    - **Chỉ DM.** Trò chuyện nhóm đi theo luồng gửi từng tin nhắn để bot vẫn phản hồi nhanh khi nhiều người đang nhập.
    - **Chọn bật, theo từng kênh.** Các kênh khác (Telegram, WhatsApp, Slack, …) không bị ảnh hưởng. Cấu hình BlueBubbles cũ đặt `channels.bluebubbles.coalesceSameSenderDms` nên di chuyển giá trị đó sang `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Kịch bản và những gì tác tử thấy

Cột "Bật cờ" cho biết hành vi trên bản dựng `imsg` phát ra `balloon_bundle_id`. Trên các bản dựng `imsg` cũ hoàn toàn không phát ra siêu dữ liệu balloon, các hàng bên dưới được đánh dấu "Hai lượt" / "N lượt" sẽ quay về hợp nhất kiểu cũ (một lượt): OpenClaw không thể phân biệt về mặt cấu trúc giữa một lần gửi tách và các lần gửi riêng biệt, nên giữ hành vi hợp nhất trước khi có siêu dữ liệu. Tách chính xác được kích hoạt khi bản dựng phát ra siêu dữ liệu balloon.

| Người dùng soạn                                                   | `chat.db` tạo ra                     | Tắt cờ (mặc định)                          | Bật cờ + cửa sổ (imsg phát ra siêu dữ liệu balloon)                                                 |
| ------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (một lần gửi)                           | 2 hàng cách nhau ~1 giây            | Hai lượt tác tử: chỉ "Dump", rồi đến URL    | Một lượt: văn bản hợp nhất `Dump https://example.com`                                               |
| `Save this 📎image.jpg caption` (tệp đính kèm + văn bản)           | 2 hàng không có siêu dữ liệu URL balloon | Hai lượt                               | Hai lượt sau khi quan sát thấy siêu dữ liệu; một lượt hợp nhất trên phiên cũ/trước latch không có siêu dữ liệu |
| `/status` (lệnh độc lập)                                           | 1 hàng                              | Gửi tức thì                                 | **Chờ tối đa đến cửa sổ, rồi gửi**                                                                  |
| URL được dán riêng                                                 | 1 hàng                              | Gửi tức thì                                 | Chờ tối đa đến cửa sổ, rồi gửi                                                                      |
| Văn bản + URL được gửi thành hai tin nhắn riêng có chủ ý, cách nhau vài phút | 2 hàng ngoài cửa sổ        | Hai lượt                                    | Hai lượt (cửa sổ hết hạn giữa chúng)                                                               |
| Lũ nhanh (>10 DM nhỏ trong cửa sổ)                                 | N hàng không có siêu dữ liệu URL balloon | N lượt                                | N lượt sau khi quan sát thấy siêu dữ liệu; một lượt hợp nhất có giới hạn trên phiên cũ/trước latch không có siêu dữ liệu |
| Hai người đang nhập trong một trò chuyện nhóm                      | N hàng từ M người gửi               | M+ lượt (mỗi bucket người gửi một lượt)     | M+ lượt — trò chuyện nhóm không được hợp nhất                                                       |

## Khôi phục inbound sau khi bridge hoặc gateway khởi động lại

iMessage khôi phục các tin nhắn bị lỡ khi gateway ngừng hoạt động, đồng thời chặn "bom backlog" cũ mà Apple có thể xả sau một lần khôi phục Push. Hành vi mặc định luôn bật, được xây dựng trên cơ chế loại trùng inbound.

- **Loại trùng phát lại.** Mọi tin nhắn inbound đã gửi đi được ghi lại bằng Apple GUID của nó trong trạng thái Plugin bền vững (`imessage.inbound-dedupe`), được claim khi nạp vào và commit sau khi xử lý (được thả khi có lỗi tạm thời để có thể thử lại). Bất cứ thứ gì đã xử lý sẽ bị bỏ thay vì gửi đi hai lần. Đây là cơ chế cho phép khôi phục phát lại mạnh tay mà không cần ghi sổ từng tin nhắn.
- **Khôi phục thời gian ngừng hoạt động.** Khi khởi động, bộ giám sát nhớ `chat.db` rowid cuối cùng đã gửi đi (con trỏ theo từng tài khoản được lưu bền vững) và truyền nó cho `imsg watch.subscribe` dưới dạng `since_rowid`, để imsg phát lại các hàng đã đến khi gateway ngừng hoạt động, rồi theo dõi trực tiếp. Phát lại được giới hạn ở các hàng gần nhất và các tin nhắn tối đa khoảng 2 giờ tuổi, và cơ chế loại trùng sẽ bỏ mọi thứ đã xử lý.
- **Hàng rào tuổi backlog cũ.** Các hàng phía trên ranh giới khởi động thực sự là trực tiếp; hàng nào có ngày gửi cũ hơn thời điểm đến hơn khoảng 15 phút là backlog Push-flush và sẽ bị chặn. Các hàng được phát lại (ở hoặc dưới ranh giới) dùng cửa sổ khôi phục rộng hơn, nên tin nhắn mới bị lỡ gần đây vẫn được gửi trong khi lịch sử quá cũ thì không.

Khôi phục hoạt động trên cả thiết lập `cliPath` cục bộ và từ xa, vì phát lại `since_rowid` chạy qua cùng kết nối RPC `imsg`. Khác biệt nằm ở cửa sổ: khi gateway có thể đọc `chat.db` (cục bộ), nó neo ranh giới rowid lúc khởi động, giới hạn khoảng phát lại, và gửi các tin nhắn bị lỡ tối đa vài giờ tuổi. Qua `cliPath` SSH từ xa, nó không thể đọc cơ sở dữ liệu, nên phát lại không bị giới hạn và mọi hàng dùng hàng rào tuổi trực tiếp — vẫn khôi phục các tin nhắn mới bị lỡ gần đây và vẫn chặn backlog cũ, chỉ với cửa sổ trực tiếp hẹp hơn. Chạy gateway trên máy Mac có Messages để có cửa sổ khôi phục rộng hơn.

### Tín hiệu hiển thị cho người vận hành

Backlog bị chặn được ghi log ở mức mặc định, không bao giờ bị bỏ âm thầm (cờ `recovery` cho biết cửa sổ nào đã áp dụng):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Di chuyển

`channels.imessage.catchup.*` đã bị loại bỏ dần — khôi phục thời gian ngừng hoạt động nay tự động và không cần cấu hình cho thiết lập mới. Các cấu hình hiện có với `catchup.enabled: true` vẫn được tôn trọng như một hồ sơ tương thích cho cửa sổ phát lại khôi phục. Các khối catchup bị tắt (`enabled: false` hoặc không có `enabled: true`) đã bị loại bỏ; `openclaw doctor --fix` sẽ xóa chúng.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không tìm thấy imsg hoặc RPC không được hỗ trợ">
    Xác thực binary và hỗ trợ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Nếu probe báo RPC không được hỗ trợ, hãy cập nhật `imsg`. Nếu hành động API riêng không khả dụng, chạy `imsg launch` trong phiên người dùng macOS đã đăng nhập và probe lại. Nếu Gateway không chạy trên macOS, dùng thiết lập máy Mac từ xa qua SSH ở trên thay cho đường dẫn `imsg` cục bộ mặc định.

  </Accordion>

  <Accordion title="Tin nhắn gửi được nhưng iMessage inbound không đến">
    Trước tiên chứng minh tin nhắn có tới máy Mac cục bộ hay không. Nếu `chat.db` không thay đổi, OpenClaw không thể nhận tin nhắn ngay cả khi `imsg status --json` báo bridge khỏe mạnh.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Nếu tin nhắn gửi từ điện thoại không tạo hàng mới, hãy sửa lớp macOS Messages và Apple Push trước khi đổi cấu hình OpenClaw. Làm mới dịch vụ một lần thường là đủ:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Gửi một iMessage mới từ điện thoại và xác nhận có hàng `chat.db` mới hoặc sự kiện `imsg watch` trước khi gỡ lỗi phiên OpenClaw. Đừng chạy việc này như một vòng lặp khởi chạy lại bridge định kỳ; `imsg launch` lặp lại cộng với khởi động lại gateway trong lúc đang làm việc có thể làm gián đoạn việc gửi và mắc kẹt các lượt chạy kênh đang diễn ra.

  </Accordion>

  <Accordion title="Gateway không chạy trên macOS">
    `cliPath: "imsg"` mặc định phải chạy trên máy Mac đã đăng nhập vào Messages. Trên Linux hoặc Windows, đặt `channels.imessage.cliPath` thành một script wrapper SSH vào máy Mac đó và chạy `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Sau đó chạy:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM bị bỏ qua">
    Kiểm tra:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - phê duyệt ghép đôi (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua">
    Kiểm tra:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - hành vi allowlist của `channels.imessage.groups`
    - cấu hình mẫu nhắc đến (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Tệp đính kèm từ xa thất bại">
    Kiểm tra:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - xác thực khóa SSH/SCP từ máy chủ gateway
    - khóa máy chủ tồn tại trong `~/.ssh/known_hosts` trên máy chủ gateway
    - khả năng đọc đường dẫn từ xa trên máy Mac chạy Messages

  </Accordion>

  <Accordion title="Đã bỏ lỡ lời nhắc quyền macOS">
    Chạy lại trong terminal GUI tương tác trong cùng ngữ cảnh người dùng/phiên và phê duyệt lời nhắc:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Xác nhận Full Disk Access + Automation đã được cấp cho ngữ cảnh tiến trình chạy OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Con trỏ tham chiếu cấu hình

- [Tham chiếu cấu hình - iMessage](/vi/gateway/config-channels#imessage)
- [Cấu hình Gateway](/vi/gateway/configuration)
- [Ghép đôi](/vi/channels/pairing)

## Liên quan

- [Tổng quan kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Gỡ bỏ BlueBubbles và đường dẫn imsg iMessage](/vi/announcements/bluebubbles-imessage) — thông báo và tóm tắt di chuyển
- [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) — bảng chuyển đổi cấu hình và từng bước chuyển đổi
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
