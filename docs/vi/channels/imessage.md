---
read_when:
    - Thiết lập hỗ trợ iMessage
    - Gỡ lỗi gửi/nhận iMessage
summary: Hỗ trợ iMessage nguyên bản thông qua imsg (JSON-RPC qua stdio), với các thao tác API riêng tư dành cho trả lời, phản ứng tapback, hiệu ứng, cuộc thăm dò ý kiến, tệp đính kèm và quản lý nhóm. Đây là lựa chọn ưu tiên cho các thiết lập iMessage mới của OpenClaw khi đáp ứng các yêu cầu về máy chủ.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T14:01:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Đối với cách triển khai OpenClaw iMessage thông thường, hãy chạy Gateway và `imsg` trên cùng máy chủ macOS Messages đã đăng nhập. Nếu Gateway chạy ở nơi khác, hãy trỏ `channels.imessage.cliPath` đến một trình bao bọc SSH trong suốt chạy `imsg` trên máy Mac.

**Quá trình khôi phục thư đến diễn ra tự động.** Sau khi bridge hoặc gateway khởi động lại, iMessage phát lại các tin nhắn bị bỏ lỡ trong thời gian ngừng hoạt động và chặn "quả bom tin tồn đọng" cũ mà Apple có thể đẩy ra sau khi khôi phục Push, đồng thời loại bỏ trùng lặp để không có nội dung nào được chuyển tiếp hai lần. Không có cấu hình nào cần bật — xem [Khôi phục thư đến sau khi bridge hoặc gateway khởi động lại](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Hỗ trợ BlueBubbles đã bị loại bỏ. Hãy di chuyển cấu hình `channels.bluebubbles` sang `channels.imessage`; OpenClaw chỉ hỗ trợ iMessage thông qua `imsg`. Hãy bắt đầu với [Việc loại bỏ BlueBubbles và đường dẫn imsg iMessage](/vi/announcements/bluebubbles-imessage) để đọc thông báo ngắn, hoặc [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) để xem bảng di chuyển đầy đủ.
</Warning>

Trạng thái: tích hợp CLI bên ngoài gốc. Gateway khởi chạy `imsg rpc` và giao tiếp JSON-RPC qua stdio — không có daemon hoặc cổng riêng. Chế độ API riêng tư rất được khuyến nghị để có một kênh iMessage đầy đủ; nội dung trả lời, tapback, hiệu ứng, cuộc thăm dò, trả lời tệp đính kèm và thao tác nhóm yêu cầu `imsg launch` cùng một lần thăm dò API riêng tư thành công.

Đối với thiết lập cục bộ phổ biến, trình thiết lập OpenClaw có thể đề xuất cài đặt hoặc cập nhật `imsg` qua Homebrew sau khi người dùng xác nhận trên máy Mac Messages đã đăng nhập. Cấu trúc thiết lập thủ công và trình bao bọc SSH vẫn do người vận hành quản lý: hãy cài đặt hoặc cập nhật `imsg` trong cùng ngữ cảnh người dùng sẽ chạy Gateway hoặc trình bao bọc.

<CardGroup cols={3}>
  <Card title="Thao tác API riêng tư" icon="wand-sparkles" href="#private-api-actions">
    Nội dung trả lời, tapback, hiệu ứng, cuộc thăm dò, tệp đính kèm và quản lý nhóm.
  </Card>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Tin nhắn trực tiếp iMessage mặc định sử dụng chế độ ghép nối.
  </Card>
  <Card title="Máy Mac từ xa" icon="terminal" href="#remote-mac-over-ssh">
    Sử dụng trình bao bọc SSH khi Gateway không chạy trên máy Mac Messages.
  </Card>
  <Card title="Tham chiếu cấu hình" icon="settings" href="/vi/gateway/config-channels#imessage">
    Tham chiếu đầy đủ các trường iMessage.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Tabs>
  <Tab title="Máy Mac cục bộ (đường dẫn nhanh)">
    <Steps>
      <Step title="Cài đặt và xác minh imsg">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        Khi trình hướng dẫn thiết lập cục bộ phát hiện thiếu lệnh `imsg` mặc định, trình này có thể nhắc cài đặt `steipete/tap/imsg` qua Homebrew. Nếu phát hiện `imsg` do Homebrew quản lý, trình này có thể nhắc cài đặt lại hoặc cập nhật. Các trình bao bọc `cliPath` tùy chỉnh không bị sửa đổi.

      </Step>

      <Step title="Cấu hình OpenClaw">

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

      <Step title="Khởi động gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Phê duyệt lần ghép nối tin nhắn trực tiếp đầu tiên (dmPolicy mặc định)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Yêu cầu ghép nối hết hạn sau 1 giờ.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Máy Mac từ xa qua SSH">
    Hầu hết các thiết lập không cần SSH. Chỉ sử dụng cấu trúc này khi Gateway không thể chạy trên máy Mac Messages đã đăng nhập. OpenClaw chỉ yêu cầu một `cliPath` tương thích với stdio, vì vậy bạn có thể trỏ `cliPath` đến một tập lệnh bao bọc dùng SSH kết nối đến máy Mac từ xa và chạy `imsg`.
    Hãy cài đặt và cập nhật `imsg` trên máy Mac từ xa đó, không phải trên máy chủ Gateway:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Cấu hình được khuyến nghị khi bật tệp đính kèm:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // dùng để tìm nạp tệp đính kèm qua SCP
      includeAttachments: true,
      // Tùy chọn: các thư mục gốc tệp đính kèm được phép bổ sung (được hợp nhất với
      // /Users/*/Library/Messages/Attachments mặc định).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Nếu chưa đặt `remoteHost`, OpenClaw sẽ cố gắng tự động phát hiện bằng cách phân tích tập lệnh bao bọc SSH.
    `remoteHost` phải là `host` hoặc `user@host` (không có dấu cách hoặc tùy chọn SSH); các giá trị không an toàn sẽ bị bỏ qua.
    OpenClaw sử dụng cơ chế kiểm tra khóa máy chủ nghiêm ngặt cho SCP, vì vậy khóa của máy chủ chuyển tiếp phải tồn tại sẵn trong `~/.ssh/known_hosts`.
    Đường dẫn tệp đính kèm được xác thực dựa trên các thư mục gốc được phép (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Mọi trình bao bọc `cliPath` hoặc proxy SSH bạn đặt phía trước `imsg` PHẢI hoạt động như một đường ống stdio trong suốt cho kết nối JSON-RPC tồn tại lâu dài. OpenClaw trao đổi các thông báo JSON-RPC nhỏ được phân khung bằng dòng mới qua stdin/stdout của trình bao bọc trong toàn bộ thời gian hoạt động của kênh:

- Chuyển tiếp từng đoạn/dòng stdin **ngay khi có byte** — đừng chờ EOF.
- Chuyển tiếp kịp thời từng đoạn/dòng stdout theo chiều ngược lại.
- Giữ nguyên các ký tự xuống dòng.
- Tránh các thao tác đọc chặn có kích thước cố định (`read(4096)`, `cat | buffer`, `read` mặc định của shell) có thể khiến các khung nhỏ không được xử lý.
- Giữ stderr tách biệt khỏi luồng stdout JSON-RPC.

Một trình bao bọc lưu stdin vào bộ đệm cho đến khi lấp đầy một khối lớn sẽ tạo ra các triệu chứng trông giống như sự cố iMessage — `imsg rpc timeout (chats.list)` hoặc kênh liên tục khởi động lại — mặc dù bản thân `imsg rpc` vẫn hoạt động bình thường. `ssh -T host imsg "$@"` (ở trên) an toàn vì chuyển tiếp các đối số `cliPath` của OpenClaw, chẳng hạn như `rpc` và `--db`. Các pipeline như `ssh host imsg | grep -v '^DEBUG'` thì KHÔNG — các công cụ dùng bộ đệm theo dòng vẫn có thể giữ lại các khung; hãy sử dụng `stdbuf -oL -eL` ở mọi giai đoạn nếu bắt buộc phải lọc.
</Warning>

  </Tab>
</Tabs>

## Yêu cầu và quyền (macOS)

- Messages phải được đăng nhập trên máy Mac chạy `imsg`.
- Ngữ cảnh tiến trình chạy OpenClaw/`imsg` cần có quyền Full Disk Access (để truy cập cơ sở dữ liệu Messages).
- Cần có quyền Automation để gửi tin nhắn thông qua Messages.app.
- Đối với các thao tác nâng cao (bày tỏ cảm xúc / chỉnh sửa / thu hồi / trả lời theo luồng / hiệu ứng / cuộc thăm dò / thao tác nhóm), phải tắt System Integrity Protection — xem [Bật API riêng tư của imsg](#enabling-the-imsg-private-api). Chức năng gửi/nhận văn bản và phương tiện cơ bản hoạt động mà không cần tắt tính năng này.

<Tip>
Quyền được cấp theo từng ngữ cảnh tiến trình. Nếu gateway chạy không có giao diện (LaunchAgent/SSH), hãy chạy một lệnh tương tác một lần trong cùng ngữ cảnh đó để kích hoạt lời nhắc:

```bash
imsg chats --limit 1
# hoặc
imsg send <handle> "kiểm tra"
```

</Tip>

<Accordion title="Gửi qua trình bao bọc SSH thất bại với AppleEvents -1743">
  Một thiết lập SSH từ xa có thể đọc cuộc trò chuyện, vượt qua `channels status --probe` và xử lý tin nhắn đến trong khi việc gửi đi vẫn thất bại do lỗi ủy quyền AppleEvents:

```text
Không được ủy quyền gửi sự kiện Apple đến Messages. (-1743)
```

Kiểm tra cơ sở dữ liệu TCC của người dùng máy Mac đã đăng nhập hoặc System Settings > Privacy & Security > Automation. Nếu mục Automation được ghi nhận cho `/usr/libexec/sshd-keygen-wrapper` thay vì `imsg` hoặc tiến trình shell cục bộ, macOS có thể không hiển thị nút chuyển đổi Messages có thể sử dụng cho ứng dụng khách phía máy chủ SSH đó:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Trong trạng thái đó, việc lặp lại `tccutil reset AppleEvents` hoặc chạy lại `imsg send` qua cùng trình bao bọc SSH có thể tiếp tục thất bại vì ngữ cảnh tiến trình cần quyền Messages Automation là trình bao bọc SSH, không phải ứng dụng mà giao diện người dùng có thể cấp quyền.

Thay vào đó, hãy sử dụng một trong các ngữ cảnh tiến trình `imsg` được hỗ trợ:

- Chạy Gateway, hoặc ít nhất là bridge `imsg`, trong phiên cục bộ của người dùng Messages đã đăng nhập.
- Khởi động Gateway bằng LaunchAgent cho người dùng đó sau khi cấp Full Disk Access và Automation từ cùng phiên.
- Nếu giữ cấu trúc SSH hai người dùng, hãy xác minh rằng thao tác gửi đi thực tế bằng `imsg send` thành công qua đúng trình bao bọc trước khi bật kênh. Nếu không thể cấp quyền Automation, hãy cấu hình lại thành thiết lập `imsg` một người dùng thay vì dựa vào trình bao bọc SSH để gửi.

</Accordion>

## Bật API riêng tư của imsg

`imsg` được cung cấp với hai chế độ vận hành. Đối với OpenClaw, chế độ API riêng tư là thiết lập được khuyến nghị vì cung cấp cho kênh các thao tác iMessage gốc mà người dùng mong đợi. Chế độ cơ bản vẫn hữu ích cho các bản cài đặt ít rủi ro, quá trình xác minh ban đầu hoặc máy chủ không thể tắt SIP.

- **Chế độ cơ bản** (mặc định, không cần thay đổi SIP): gửi văn bản và phương tiện qua `send`, theo dõi/lịch sử tin nhắn đến, danh sách cuộc trò chuyện. Đây là những gì có sẵn ngay khi dùng `brew install steipete/tap/imsg` mới cùng các quyền macOS tiêu chuẩn nêu trên.
- **Chế độ API riêng tư**: `imsg` chèn một dylib trợ giúp vào `Messages.app` để gọi các hàm `IMCore` nội bộ. Chế độ này mở khóa `react`, `edit`, `unsend`, `reply` (theo luồng), `sendWithEffect`, `poll` và `poll-vote` (cuộc thăm dò Messages gốc), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, cùng chỉ báo đang nhập và biên nhận đã đọc.

Tập hợp thao tác được khuyến nghị trên trang này yêu cầu chế độ API riêng tư. README của `imsg` nêu rõ yêu cầu này:

> Các tính năng nâng cao như `read`, `typing`, `launch`, gửi nội dung phong phú dựa trên bridge, thay đổi tin nhắn và quản lý cuộc trò chuyện là tùy chọn. Chúng yêu cầu tắt SIP và chèn một dylib trợ giúp vào `Messages.app`. `imsg launch` từ chối chèn khi SIP đang bật.

Kỹ thuật chèn trình trợ giúp sử dụng dylib riêng của `imsg` để truy cập các API riêng tư của Messages. Không có máy chủ bên thứ ba hoặc môi trường chạy BlueBubbles trong đường dẫn iMessage của OpenClaw.

<Warning>
**Việc tắt SIP là một sự đánh đổi thực sự về bảo mật.** SIP là một trong những biện pháp bảo vệ cốt lõi của macOS chống lại việc chạy mã hệ thống đã sửa đổi; việc tắt tính năng này trên toàn hệ thống làm tăng bề mặt tấn công và các tác dụng phụ. Đáng chú ý, **tắt SIP trên máy Mac dùng Apple Silicon cũng vô hiệu hóa khả năng cài đặt và chạy ứng dụng iOS trên máy Mac**.

Hãy coi đây là một lựa chọn vận hành có chủ đích, đặc biệt trên máy Mac cá nhân chính. Để vận hành OpenClaw iMessage với chất lượng production, nên sử dụng một máy Mac chuyên dụng hoặc người dùng bot macOS mà bạn thấy phù hợp để bật bridge. Nếu mô hình mối đe dọa không thể chấp nhận việc SIP bị tắt ở bất kỳ đâu, iMessage đi kèm chỉ được giới hạn ở chế độ cơ bản — chỉ gửi/nhận văn bản và phương tiện, không có bày tỏ cảm xúc / chỉnh sửa / thu hồi / hiệu ứng / thao tác nhóm.
</Warning>

### Thiết lập

1. **Cài đặt (hoặc nâng cấp) `imsg`** trên máy Mac chạy Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   Đầu ra `imsg status --json` báo cáo `bridge_version`, `rpc_methods` và `selectors` theo từng phương thức để bạn có thể xem bản dựng hiện tại hỗ trợ những gì trước khi bắt đầu.

2. **Tắt System Integrity Protection và (trên macOS hiện đại) Library Validation.** Việc chèn một dylib trợ giúp không phải của Apple vào `Messages.app` do Apple ký yêu cầu tắt SIP **và** nới lỏng xác thực thư viện. Bước SIP trong chế độ Recovery phụ thuộc vào phiên bản macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** tắt Library Validation qua Terminal, khởi động lại vào Recovery Mode, chạy `csrutil disable`, rồi khởi động lại.
   - **macOS 11+ (Big Sur trở lên), Intel:** vào Recovery Mode (hoặc Internet Recovery), chạy `csrutil disable`, rồi khởi động lại.
   - **macOS 11+, Apple Silicon:** dùng trình tự khởi động bằng nút nguồn để vào Recovery; trên các phiên bản macOS gần đây, giữ phím **Left Shift** khi nhấp vào Continue, sau đó chạy `csrutil disable`. Thiết lập máy ảo sử dụng một quy trình riêng, vì vậy trước tiên hãy tạo snapshot cho máy ảo.

   **Trên macOS 11 trở lên, chỉ `csrutil disable` thường là chưa đủ.** Apple vẫn áp dụng xác thực thư viện đối với `Messages.app` dưới dạng tệp nhị phân nền tảng, vì vậy trình trợ giúp được ký adhoc sẽ bị từ chối (`Library Validation failed: ... platform binary, but mapped file is not`) ngay cả khi đã tắt SIP. Sau khi tắt SIP, hãy tắt cả xác thực thư viện rồi khởi động lại:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), đã xác minh trên 26.5.1:** tắt SIP **cộng với** lệnh `DisableLibraryValidation` ở trên là đủ để chèn trình trợ giúp trên các phiên bản từ 26.0 đến 26.5.x. **Không cần boot-args.** Tệp plist là yếu tố quyết định và là bước bị thiếu phổ biến nhất khi việc chèn thất bại trên Tahoe:
   - **Có plist:** `imsg launch` chèn thành công và `imsg status` báo cáo `advanced_features: true`.
   - **Không có plist (ngay cả khi đã tắt SIP):** `imsg launch` thất bại với `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI từ chối trình trợ giúp adhoc khi tải, vì vậy bridge không bao giờ sẵn sàng và quá trình khởi chạy hết thời gian chờ. Đây là triệu chứng mà hầu hết người dùng gặp trên Tahoe; cách khắc phục là plist ở trên, không phải biện pháp nào quyết liệt hơn.

   Nếu việc chèn `imsg launch` hoặc các `selectors` cụ thể bắt đầu trả về false sau khi nâng cấp macOS, cổng kiểm tra này thường là nguyên nhân. Hãy kiểm tra trạng thái SIP và xác thực thư viện trước khi cho rằng chính bước SIP đã thất bại. Nếu các thiết lập đó chính xác nhưng bridge vẫn không thể chèn, hãy thu thập `imsg status --json` cùng với đầu ra của `imsg launch` và báo cáo cho dự án `imsg` thay vì làm suy yếu thêm các biện pháp kiểm soát bảo mật trên toàn hệ thống.

3. **Chèn trình trợ giúp.** Khi SIP đã bị tắt và Messages.app đã đăng nhập:

   ```bash
   imsg launch
   ```

   `imsg launch` từ chối chèn khi SIP vẫn được bật, vì vậy thao tác này cũng đồng thời xác nhận rằng bước 2 đã có hiệu lực.

4. **Xác minh bridge từ OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Mục iMessage phải báo cáo `works`, và `imsg status --json | jq '{rpc_methods, selectors}'` phải hiển thị các khả năng do bản dựng macOS của bạn cung cấp. Việc tạo cuộc thăm dò yêu cầu `selectors.pollPayloadMessage`; bỏ phiếu yêu cầu cả `selectors.pollVoteMessage` và phương thức RPC `poll.vote`. Plugin OpenClaw chỉ công bố các hành động được probe đã lưu trong bộ nhớ đệm hỗ trợ, trong khi bộ nhớ đệm trống vẫn giả định lạc quan và thực hiện probe ở lần gửi đầu tiên.

Nếu `openclaw channels status --probe` báo cáo kênh là `works` nhưng các hành động cụ thể phát sinh lỗi "iMessage `<action>` requires the imsg private API bridge" tại thời điểm gửi, hãy chạy lại `imsg launch` — trình trợ giúp có thể bị ngắt (Messages.app khởi động lại, cập nhật hệ điều hành, v.v.) và trạng thái `available: true` đã lưu trong bộ nhớ đệm sẽ tiếp tục công bố các hành động cho đến khi lần probe tiếp theo làm mới trạng thái.

### Khi SIP vẫn được bật

Nếu việc tắt SIP không phù hợp với mô hình đe dọa của bạn:

- `imsg` chuyển sang chế độ cơ bản — chỉ văn bản + phương tiện + nhận.
- Plugin OpenClaw vẫn công bố khả năng gửi văn bản/phương tiện và giám sát tin nhắn đến; Plugin ẩn `react`, `edit`, `unsend`, `reply`, `sendWithEffect` và các thao tác nhóm khỏi bề mặt hành động (theo cổng khả năng của từng phương thức).
- Bạn có thể chạy một máy Mac không dùng Apple Silicon riêng biệt (hoặc một máy Mac chuyên dụng cho bot) với SIP bị tắt để xử lý khối lượng công việc iMessage, đồng thời vẫn bật SIP trên các thiết bị chính. Xem [Người dùng macOS dành riêng cho bot (danh tính iMessage riêng)](#deployment-patterns) bên dưới.

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="Chính sách DM">
    `channels.imessage.dmPolicy` kiểm soát tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một mục `allowFrom`)
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    Trường danh sách cho phép: `channels.imessage.allowFrom`.

    Các mục trong danh sách cho phép phải xác định người gửi: handle hoặc nhóm truy cập người gửi tĩnh (`accessGroup:<name>`). Dùng `channels.imessage.groupAllowFrom` cho các đích trò chuyện như `chat_id:*`, `chat_guid:*` hoặc `chat_identifier:*`; dùng `channels.imessage.groups` cho các khóa sổ đăng ký `chat_id` dạng số.

  </Tab>

  <Tab title="Chính sách nhóm + lượt đề cập">
    `channels.imessage.groupPolicy` kiểm soát việc xử lý nhóm:

    - `allowlist` (mặc định)
    - `open`
    - `disabled`

    Danh sách người gửi nhóm được phép: `channels.imessage.groupAllowFrom`.

    Các mục `groupAllowFrom` cũng có thể tham chiếu đến các nhóm truy cập người gửi tĩnh (`accessGroup:<name>`).

    Cơ chế dự phòng khi chạy: nếu `groupAllowFrom` chưa được đặt, việc kiểm tra người gửi nhóm iMessage sử dụng `allowFrom`; hãy đặt `groupAllowFrom` khi tiêu chí chấp nhận DM và nhóm cần khác nhau. Một `groupAllowFrom: []` rỗng được đặt rõ ràng sẽ không dùng cơ chế dự phòng — nó chặn mọi người gửi nhóm theo `allowlist`.
    Lưu ý khi chạy: nếu hoàn toàn không có `channels.imessage`, hệ thống sẽ chuyển sang `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

    <Warning>
    Định tuyến nhóm theo `groupPolicy: "allowlist"` chạy liên tiếp **hai** cổng kiểm tra:

    1. **Danh sách người gửi được phép** (`channels.imessage.groupAllowFrom`) — handle, `accessGroup:<name>`, `chat_guid`, `chat_identifier` hoặc `chat_id`. Danh sách hiệu lực rỗng (không có `groupAllowFrom` và không có cơ chế dự phòng `allowFrom`) sẽ chặn mọi người gửi nhóm.
    2. **Sổ đăng ký nhóm** (`channels.imessage.groups`) — được áp dụng khi bản đồ có mục: cuộc trò chuyện phải khớp với một mục `chat_id` cụ thể hoặc ký tự đại diện `groups: { "*": { ... } }`. Khi `groups` trống hoặc không tồn tại, chỉ danh sách người gửi được phép quyết định việc chấp nhận.

    Nếu không cấu hình danh sách người gửi nhóm hiệu lực, mọi tin nhắn nhóm sẽ bị loại bỏ trước cổng sổ đăng ký. Mỗi cổng có tín hiệu cấp `warn` riêng ở mức nhật ký mặc định và mỗi tín hiệu nêu một cách khắc phục khác nhau:

    - một lần cho mỗi tài khoản khi khởi động, khi danh sách người gửi nhóm hiệu lực trống: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — khắc phục bằng cách đặt `channels.imessage.groupAllowFrom` (hoặc `allowFrom`); chỉ thêm các mục `groups` vẫn khiến cổng 1 chặn mọi người gửi.
    - một lần cho mỗi `chat_id` khi chạy, khi người gửi đã vượt qua cổng 1 nhưng cuộc trò chuyện không có trong sổ đăng ký `groups` đã được điền: `imessage: dropping group message from chat_id=<id> ...` — khắc phục bằng cách thêm `chat_id` đó (hoặc `"*"`) vào `channels.imessage.groups`.

    DM không bị ảnh hưởng — chúng đi theo một đường dẫn mã khác.

    Cấu hình được đề xuất cho luồng nhóm theo `groupPolicy: "allowlist"`:

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

    Chỉ riêng `groupAllowFrom` cho phép những người gửi đó trong bất kỳ nhóm nào; hãy thêm khối `groups` để giới hạn các cuộc trò chuyện được phép (và đặt các tùy chọn cho từng cuộc trò chuyện như `requireMention`).
    </Warning>

    Cổng đề cập cho nhóm:

    - iMessage không có siêu dữ liệu đề cập gốc
    - việc phát hiện lượt đề cập sử dụng các mẫu biểu thức chính quy (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - khi không có mẫu nào được cấu hình, không thể áp dụng cổng đề cập
    - các lệnh điều khiển từ người gửi được ủy quyền bỏ qua cổng đề cập

    `systemPrompt` theo từng nhóm:

    Mỗi mục trong `channels.imessage.groups.*` chấp nhận một chuỗi `systemPrompt` tùy chọn, được chèn vào lời nhắc hệ thống của tác nhân ở mỗi lượt xử lý tin nhắn trong nhóm đó. Cách phân giải tương tự `channels.whatsapp.groups`:

    1. **Lời nhắc hệ thống dành riêng cho nhóm** (`groups["<chat_id>"].systemPrompt`): được sử dụng khi mục nhóm cụ thể tồn tại trong bản đồ **và** khóa `systemPrompt` của mục đó đã được xác định. Nếu `systemPrompt` là chuỗi rỗng (`""`), ký tự đại diện bị vô hiệu hóa và không có lời nhắc hệ thống nào được áp dụng cho nhóm đó.
    2. **Lời nhắc hệ thống ký tự đại diện cho nhóm** (`groups["*"].systemPrompt`): được sử dụng khi mục nhóm cụ thể hoàn toàn không có trong bản đồ, hoặc khi mục đó tồn tại nhưng không xác định khóa `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Sử dụng chính tả Anh-Anh." },
            "8421": {
              requireMention: true,
              systemPrompt: "Đây là cuộc trò chuyện luân phiên trực. Giữ câu trả lời dưới 3 câu.",
            },
            "9907": {
              // vô hiệu hóa rõ ràng: ký tự đại diện "Sử dụng chính tả Anh-Anh." không áp dụng ở đây
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Lời nhắc theo từng nhóm chỉ áp dụng cho tin nhắn nhóm — tin nhắn trực tiếp không bị ảnh hưởng.

  </Tab>

  <Tab title="Phiên và câu trả lời tất định">
    - DM sử dụng định tuyến trực tiếp; nhóm sử dụng định tuyến nhóm.
    - Với `session.dmScope=main` mặc định, các DM iMessage được gộp vào phiên chính của tác nhân.
    - Các phiên nhóm được cô lập (`agent:<agentId>:imessage:group:<chat_id>`).
    - Câu trả lời được định tuyến trở lại iMessage bằng siêu dữ liệu kênh/đích ban đầu.

    Hành vi của luồng giống nhóm:

    Một số luồng iMessage có nhiều người tham gia có thể đến với `is_group=false`.
    Nếu `chat_id` đó được cấu hình rõ ràng trong `channels.imessage.groups`, OpenClaw coi đó là lưu lượng nhóm (cổng nhóm + cô lập phiên nhóm).

  </Tab>
</Tabs>

## Liên kết cuộc trò chuyện ACP

Các cuộc trò chuyện iMessage có thể được liên kết với phiên ACP.

Quy trình nhanh cho người vận hành:

- Chạy `/acp spawn codex --bind here` trong DM hoặc cuộc trò chuyện nhóm được phép.
- Các tin nhắn trong tương lai thuộc cùng cuộc trò chuyện iMessage đó sẽ được định tuyến đến phiên ACP đã khởi tạo.
- `/new` và `/reset` đặt lại tại chỗ cùng phiên ACP đã liên kết.
- `/acp close` đóng phiên ACP và xóa liên kết.

Các liên kết cố định được cấu hình sử dụng các mục `bindings[]` cấp cao nhất với `type: "acp"` và `match.channel: "imessage"`.

`match.peer.id` có thể sử dụng:

- handle DM đã chuẩn hóa như `+15555550123` hoặc `user@example.com`
- `chat_id:<id>` (được đề xuất cho liên kết nhóm ổn định)
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

Xem [Tác nhân ACP](/vi/tools/acp-agents) để biết hành vi liên kết ACP dùng chung.

## Mô hình triển khai

<AccordionGroup>
  <Accordion title="Người dùng macOS dành riêng cho bot (danh tính iMessage riêng)">
    Sử dụng Apple ID và người dùng macOS riêng để lưu lượng bot được cô lập khỏi hồ sơ Messages cá nhân.

    Quy trình điển hình:

    1. Tạo/đăng nhập một người dùng macOS chuyên dụng.
    2. Đăng nhập Messages bằng Apple ID của bot trong tài khoản người dùng đó.
    3. Cài đặt `imsg` trong tài khoản người dùng đó.
    4. Tạo một trình bao bọc SSH để OpenClaw có thể chạy `imsg` trong ngữ cảnh của người dùng đó.
    5. Trỏ `channels.imessage.accounts.<id>.cliPath` và `.dbPath` đến hồ sơ người dùng đó.

    Lần chạy đầu tiên có thể yêu cầu phê duyệt qua GUI (Automation + Full Disk Access) trong phiên của người dùng bot đó.

  </Accordion>

  <Accordion title="Máy Mac từ xa qua Tailscale (ví dụ)">
    Cấu trúc liên kết phổ biến:

    - Gateway chạy trên Linux/VM
    - iMessage + `imsg` chạy trên một máy Mac trong tailnet của bạn
    - Trình bao bọc `cliPath` sử dụng SSH để chạy `imsg`
    - `remoteHost` cho phép tải tệp đính kèm qua SCP

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

    Sử dụng khóa SSH để cả SSH và SCP đều không cần tương tác.
    Trước tiên, hãy bảo đảm khóa máy chủ được tin cậy (ví dụ `ssh bot@mac-mini.tailnet-1234.ts.net`) để `known_hosts` được điền.

  </Accordion>

  <Accordion title="Mô hình nhiều tài khoản">
    iMessage hỗ trợ cấu hình theo từng tài khoản trong `channels.imessage.accounts`.

    Mỗi tài khoản có thể ghi đè các trường như `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, các cài đặt lịch sử và danh sách cho phép thư mục gốc của tệp đính kèm.

  </Accordion>

  <Accordion title="Lịch sử tin nhắn trực tiếp">
    Đặt `channels.imessage.dmHistoryLimit` để khởi tạo các phiên tin nhắn trực tiếp mới bằng lịch sử `imsg` gần đây đã giải mã của cuộc trò chuyện đó. Sử dụng `channels.imessage.dms["<sender>"].historyLimit` để ghi đè theo từng người gửi, bao gồm `0` để tắt lịch sử cho một người gửi.

    Lịch sử tin nhắn trực tiếp iMessage được tìm nạp theo yêu cầu từ `imsg`. Nếu không đặt `dmHistoryLimit`, việc khởi tạo lịch sử tin nhắn trực tiếp toàn cục sẽ bị tắt, nhưng giá trị `channels.imessage.dms["<sender>"].historyLimit` dương theo từng người gửi vẫn bật việc khởi tạo cho người gửi đó.

  </Accordion>
</AccordionGroup>

## Phương tiện, phân đoạn và đích gửi

<AccordionGroup>
  <Accordion title="Tệp đính kèm và phương tiện">
    - tiếp nhận tệp đính kèm đến **bị tắt theo mặc định** — đặt `channels.imessage.includeAttachments: true` để chuyển tiếp ảnh, bản ghi âm, video và các tệp đính kèm khác đến tác tử. Khi tùy chọn này bị tắt, iMessage chỉ chứa tệp đính kèm sẽ bị loại bỏ trước khi đến tác tử và có thể hoàn toàn không tạo ra dòng nhật ký `Inbound message`.
    - có thể tìm nạp đường dẫn tệp đính kèm từ xa qua SCP khi đặt `remoteHost`
    - đường dẫn tệp đính kèm phải khớp với các thư mục gốc được phép:
      - `channels.imessage.attachmentRoots` (cục bộ)
      - `channels.imessage.remoteAttachmentRoots` (chế độ SCP từ xa)
      - các thư mục gốc được cấu hình mở rộng mẫu thư mục gốc mặc định `/Users/*/Library/Messages/Attachments` (được hợp nhất, không bị thay thế)
    - SCP sử dụng kiểm tra khóa máy chủ nghiêm ngặt (`StrictHostKeyChecking=yes`)
    - kích thước phương tiện gửi đi sử dụng `channels.imessage.mediaMaxMb` (mặc định 16 MB)

  </Accordion>

  <Accordion title="Văn bản gửi đi và phân đoạn">
    - giới hạn đoạn văn bản: `channels.imessage.textChunkLimit` (mặc định 4000)
    - chế độ phân đoạn: `channels.imessage.streaming.chunkMode`
      - `length` (mặc định)
      - `newline` (ưu tiên phân tách theo đoạn văn)
    - chữ đậm/nghiêng/gạch chân/gạch ngang Markdown gửi đi được chuyển đổi thành văn bản có kiểu định dạng gốc (người nhận dùng macOS 15+ sẽ thấy định dạng; người nhận dùng phiên bản cũ hơn sẽ thấy văn bản thuần túy không có dấu đánh dấu); bảng Markdown được chuyển đổi theo chế độ bảng Markdown của kênh
    - `channels.imessage.sendTransport` (`auto` mặc định, `bridge`, `applescript`) chọn cách `imsg` thực hiện việc gửi

  </Accordion>

  <Accordion title="Định dạng địa chỉ">
    Các đích tường minh được ưu tiên:

    - `chat_id:123` (khuyến nghị để định tuyến ổn định)
    - `chat_guid:...`
    - `chat_identifier:...`

    Các đích dạng định danh cũng được hỗ trợ:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Hành động API riêng tư

Khi `imsg launch` đang chạy và `openclaw channels status --probe` báo cáo `privateApi.available: true`, công cụ nhắn tin có thể sử dụng các hành động gốc của iMessage ngoài việc gửi văn bản thông thường.

Tất cả hành động đều được bật theo mặc định; sử dụng `channels.imessage.actions` để tắt từng hành động:

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
  <Accordion title="Các hành động có sẵn">
    - **react**: Thêm/xóa phản hồi tapback của iMessage (`messageId`, `emoji`, `remove`). Các tapback được hỗ trợ ánh xạ tới yêu thích, thích, không thích, cười, nhấn mạnh và thắc mắc. Xóa mà không có biểu tượng cảm xúc sẽ xóa bất kỳ tapback nào đã đặt.
    - **reply**: Gửi câu trả lời theo luồng cho một tin nhắn hiện có (`messageId`, `text` hoặc `message`, cùng với `chatGuid`, `chatId`, `chatIdentifier` hoặc `to`). Trả lời kèm tệp đính kèm còn yêu cầu một bản dựng `imsg` có `send-rich` hỗ trợ `--file`.
    - **sendWithEffect**: Gửi văn bản với hiệu ứng iMessage (`text` hoặc `message`, `effect` hoặc `effectId`). Tên ngắn: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Chỉnh sửa tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`, `text` hoặc `newText`). Chỉ có thể chỉnh sửa các tin nhắn do chính Gateway gửi.
    - **unsend**: Thu hồi tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`). Chỉ có thể thu hồi các tin nhắn do chính Gateway gửi.
    - **upload-file**: Gửi phương tiện/tệp (`buffer` dưới dạng base64 hoặc một `media`/`path`/`filePath` đã được nạp dữ liệu, `filename`, tùy chọn `asVoice`). Bí danh cũ: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Quản lý cuộc trò chuyện nhóm khi đích hiện tại là một cuộc trò chuyện nhóm. Các hành động này thay đổi danh tính Messages của máy chủ, vì vậy chúng yêu cầu người gửi là chủ sở hữu hoặc một máy khách Gateway `operator.admin`.
    - **poll**: Tạo cuộc thăm dò gốc của Apple Messages (`pollQuestion`, `pollOption` lặp lại từ 2 đến 12 lần, cùng với `chatGuid`, `chatId`, `chatIdentifier` hoặc `to`). Người nhận dùng iOS/iPadOS/macOS 26+ có thể xem và bỏ phiếu trực tiếp; các phiên bản hệ điều hành cũ hơn sẽ nhận văn bản dự phòng "Sent a poll". Yêu cầu `selectors.pollPayloadMessage`.
    - **poll-vote**: Bỏ phiếu trong một cuộc thăm dò hiện có (`pollId` hoặc `messageId`, cùng với chính xác một trong các giá trị `pollOptionIndex`, `pollOptionId` hoặc `pollOptionText`). Yêu cầu `selectors.pollVoteMessage` và phương thức RPC `poll.vote`.

    Các cuộc thăm dò đến được chấp nhận sẽ được hiển thị cho tác tử cùng với câu hỏi, nhãn tùy chọn được đánh số, số phiếu và ID tin nhắn cuộc thăm dò mà `poll-vote` cần.

  </Accordion>

  <Accordion title="ID tin nhắn">
    Ngữ cảnh iMessage đến bao gồm cả các giá trị `MessageSid` ngắn và GUID tin nhắn đầy đủ (`MessageSidFull`) khi có. ID ngắn chỉ có phạm vi trong bộ nhớ đệm trả lời gần đây dùng SQLite và được kiểm tra với cuộc trò chuyện hiện tại trước khi sử dụng. Nếu ID ngắn hết hạn, hãy thử lại bằng `MessageSidFull` của nó trong khi nhắm đến cuộc trò chuyện đã cung cấp ID đó. ID đầy đủ không bỏ qua ràng buộc cuộc trò chuyện hoặc tài khoản, vì vậy hãy thay ID từ một cuộc trò chuyện khác bằng ID từ đích hiện tại. Các lệnh gọi được ủy quyền từ xa có thể từ chối ID đầy đủ đã cũ khi không có bằng chứng về cuộc trò chuyện hiện tại.

  </Accordion>

  <Accordion title="Phát hiện khả năng">
    OpenClaw chỉ ẩn các hành động API riêng tư khi trạng thái thăm dò được lưu trong bộ nhớ đệm cho biết cầu nối không khả dụng. Nếu trạng thái chưa xác định, các hành động vẫn hiển thị và việc điều phối sẽ thăm dò theo cơ chế tải lười để hành động đầu tiên có thể thành công sau `imsg launch` mà không cần làm mới trạng thái thủ công riêng biệt.

  </Accordion>

  <Accordion title="Biên nhận đã đọc và trạng thái đang nhập">
    Khi cầu nối API riêng tư hoạt động, các cuộc trò chuyện đến được chấp nhận sẽ được đánh dấu là đã đọc và các cuộc trò chuyện trực tiếp sẽ hiển thị bong bóng đang nhập ngay khi lượt được chấp nhận, trong lúc tác tử chuẩn bị ngữ cảnh và tạo nội dung. Tắt việc đánh dấu đã đọc bằng:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Các bản dựng `imsg` cũ có trước danh sách khả năng theo từng phương thức sẽ âm thầm tắt trạng thái đang nhập/đã đọc; OpenClaw ghi một cảnh báo một lần sau mỗi lần khởi động lại để có thể xác định nguyên nhân thiếu biên nhận.

  </Accordion>

  <Accordion title="Tapback đến">
    OpenClaw đăng ký nhận tapback iMessage và định tuyến các phản ứng được chấp nhận dưới dạng sự kiện hệ thống thay vì văn bản tin nhắn thông thường, vì vậy tapback của người dùng không kích hoạt vòng lặp trả lời thông thường.

    Chế độ thông báo được kiểm soát bởi `channels.imessage.reactionNotifications`:

    - `"own"` (mặc định): chỉ thông báo khi người dùng phản ứng với tin nhắn do bot soạn.
    - `"all"`: thông báo cho tất cả tapback đến từ người gửi được ủy quyền.
    - `"off"`: bỏ qua tapback đến.

    Ghi đè theo từng tài khoản sử dụng `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Phản ứng phê duyệt (👍 / 👎)">
    Khi `approvals.exec.enabled` hoặc `approvals.plugin.enabled` là true và yêu cầu được định tuyến đến iMessage, Gateway gửi lời nhắc phê duyệt theo cách gốc và chấp nhận tapback để xử lý yêu cầu:

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` vẫn là phương án dự phòng thủ công: gửi `/approve <id> allow-always` dưới dạng câu trả lời thông thường.

    Việc xử lý phản ứng yêu cầu định danh của người dùng phản ứng phải là một người phê duyệt tường minh. Danh sách người phê duyệt được đọc từ `channels.imessage.allowFrom` (hoặc `channels.imessage.accounts.<id>.allowFrom`); thêm số điện thoại của người dùng theo định dạng E.164 hoặc email Apple ID của họ (các đích trò chuyện như `chat_id:*` không phải là mục người phê duyệt hợp lệ). Mục ký tự đại diện `"*"` được chấp nhận nhưng cho phép bất kỳ người gửi nào phê duyệt; danh sách người phê duyệt trống sẽ tắt hoàn toàn lối tắt phản ứng. Lối tắt phản ứng cố ý bỏ qua `reactionNotifications`, `dmPolicy` và `groupAllowFrom` vì danh sách cho phép người phê duyệt tường minh là cổng kiểm soát duy nhất có ý nghĩa đối với việc xử lý phê duyệt.

    Việc ủy quyền lệnh văn bản `/approve` tuân theo cùng danh sách: khi `channels.imessage.allowFrom` không trống, `/approve <id> <decision>` được ủy quyền dựa trên danh sách người phê duyệt đó (không phải danh sách cho phép tin nhắn trực tiếp rộng hơn), và những người gửi được phép trong danh sách cho phép tin nhắn trực tiếp nhưng không có trong `allowFrom` sẽ nhận được thông báo từ chối rõ ràng. Khi `allowFrom` trống, phương án dự phòng trong cùng cuộc trò chuyện vẫn có hiệu lực và `/approve` ủy quyền cho bất kỳ ai được danh sách cho phép tin nhắn trực tiếp chấp nhận. Thêm mọi người vận hành cần phê duyệt — qua `/approve` hoặc qua phản ứng — vào `allowFrom`.

    Ghi chú dành cho người vận hành:
    - Liên kết phản ứng được lưu cả trong bộ nhớ lẫn kho khóa bền vững của gateway (TTL khớp với thời điểm phê duyệt hết hạn), đồng thời gateway cũng thăm dò các lời nhắc đang chờ để tìm tapback, vì vậy một tapback đến ngay sau khi gateway khởi động lại vẫn giải quyết được yêu cầu phê duyệt.
    - Tapback `is_from_me=true` của chính người vận hành (ví dụ: từ một thiết bị Apple đã ghép đôi) giải quyết yêu cầu phê duyệt khi handle đó là người phê duyệt được chỉ định rõ ràng.
    - Lời nhắc phê duyệt chỉ được định tuyến vào cuộc trò chuyện nhóm khi đã cấu hình rõ người phê duyệt; nếu không, bất kỳ thành viên nào trong nhóm cũng có thể phê duyệt.
    - Tapback kiểu văn bản cũ (`Liked "…"` văn bản thuần từ các máy khách Apple rất cũ) không thể giải quyết yêu cầu phê duyệt vì chúng không mang GUID của tin nhắn; việc phân giải phản ứng yêu cầu siêu dữ liệu tapback có cấu trúc do các máy khách macOS / iOS hiện tại phát ra.

  </Accordion>
</AccordionGroup>

## Ghi cấu hình

Theo mặc định, iMessage cho phép việc ghi cấu hình do kênh khởi tạo (cho `/config set|unset` khi `commands.config: true`).

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

## Gộp các DM bị tách khi gửi (lệnh + URL trong cùng một nội dung soạn thảo)

Khi người dùng nhập lệnh và URL cùng nhau — ví dụ: `Dump https://example.com/article` — ứng dụng Messages của Apple tách lần gửi thành **hai hàng `chat.db` riêng biệt**:

1. Một tin nhắn văn bản (`"Dump"`).
2. Một bong bóng xem trước URL (`"https://..."`) với các ảnh xem trước OG dưới dạng tệp đính kèm.

Trên hầu hết thiết lập, hai hàng đến OpenClaw cách nhau khoảng 0.8-2.0 giây. Nếu không gộp, tác nhân chỉ nhận được lệnh ở lượt 1 (và thường trả lời "hãy gửi URL cho tôi") trước khi URL đến ở lượt 2. Đây là quy trình gửi của Apple, không phải do OpenClaw hay `imsg` tạo ra.

`channels.imessage.coalesceSameSenderDms` cho phép một DM chọn dùng bộ đệm cho các hàng liên tiếp từ cùng người gửi. Khi `imsg` cung cấp dấu hiệu xem trước URL có cấu trúc `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` trên một trong các hàng nguồn, OpenClaw chỉ hợp nhất lần gửi thực sự bị tách đó và giữ mọi hàng khác trong bộ đệm thành các lượt riêng biệt. Trên các bản dựng `imsg` cũ không phát ra bất kỳ siêu dữ liệu bong bóng nào, OpenClaw không thể phân biệt một lần gửi bị tách với các lần gửi riêng biệt, nên sẽ dự phòng bằng cách hợp nhất nhóm. Cách này duy trì hành vi trước khi có siêu dữ liệu thay vì làm thoái lui các lần gửi bị tách `Dump <url>` thành hai lượt. Trò chuyện nhóm tiếp tục điều phối theo từng tin nhắn để giữ nguyên cấu trúc lượt của nhiều người dùng.

<Tabs>
  <Tab title="Khi nào nên bật">
    Bật khi:

    - Bạn cung cấp các skill cần `command + payload` trong một tin nhắn (dump, dán, lưu, đưa vào hàng đợi, v.v.).
    - Người dùng của bạn dán URL cùng với lệnh.
    - Bạn có thể chấp nhận độ trễ lượt DM tăng thêm (xem bên dưới).

    Để tắt khi:

    - Bạn cần độ trễ lệnh tối thiểu cho các trình kích hoạt DM chỉ có một từ.
    - Tất cả luồng của bạn đều là lệnh dùng một lần không có phần dữ liệu tiếp theo.

  </Tab>
  <Tab title="Bật">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // chọn dùng (mặc định: false)
        },
      },
    }
    ```

    Khi cờ được bật và không có `messages.inbound.byChannel.imessage` tường minh hoặc `messages.inbound.debounceMs` toàn cục, cửa sổ debounce được mở rộng thành **7000 ms** (mặc định cũ là 0 ms — không debounce). Cửa sổ rộng hơn là cần thiết vì nhịp gửi tách phần xem trước URL của Apple có thể kéo dài đến vài giây trong khi Messages.app phát ra hàng xem trước.

    Để tự điều chỉnh cửa sổ:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms bao quát độ trễ xem trước URL đã quan sát được của Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Đánh đổi">
    - **Việc hợp nhất chính xác cần siêu dữ liệu payload `imsg` hiện tại.** Khi có `balloon_bundle_id`, chỉ lần gửi thực sự bị tách mới được hợp nhất; cách hợp nhất dự phòng không có siêu dữ liệu mô tả ở trên là khả năng tương thích ngược tạm thời, sẽ bị loại bỏ khi `imsg` gộp các lần gửi bị tách ở thượng nguồn.
    - **Tăng độ trễ cho tin nhắn DM.** Khi cờ được bật, mọi DM (bao gồm các lệnh điều khiển độc lập và tin nhắn văn bản tiếp theo riêng lẻ) đều chờ tối đa bằng cửa sổ debounce trước khi được điều phối, phòng trường hợp một hàng xem trước URL sắp đến. Tin nhắn trò chuyện nhóm vẫn được điều phối tức thì.
    - **Đầu ra hợp nhất có giới hạn.** Văn bản hợp nhất được giới hạn ở 4000 ký tự với dấu `…[truncated]` tường minh; tệp đính kèm được giới hạn ở 20; mục nguồn được giới hạn ở 10 (ngoài giới hạn đó sẽ giữ mục đầu tiên cùng các mục mới nhất). Mỗi GUID nguồn được theo dõi trong `coalescedMessageGuids` để phục vụ dữ liệu đo từ xa ở hạ nguồn.
    - **Chỉ dành cho DM.** Trò chuyện nhóm chuyển sang điều phối theo từng tin nhắn để bot vẫn phản hồi nhanh khi nhiều người đang nhập.
    - **Chọn dùng theo từng kênh.** Các kênh khác (Discord, Slack, Telegram, WhatsApp, …) không bị ảnh hưởng. Các cấu hình BlueBubbles cũ đặt `channels.bluebubbles.coalesceSameSenderDms` nên di chuyển giá trị đó sang `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Các tình huống và nội dung tác nhân nhìn thấy

Cột "Bật cờ" cho biết hành vi trên một bản dựng `imsg` phát ra `balloon_bundle_id`. Trên các bản dựng `imsg` cũ không phát ra bất kỳ siêu dữ liệu bong bóng nào, các hàng được đánh dấu "Hai lượt" / "N lượt" bên dưới sẽ dự phòng bằng cách hợp nhất kiểu cũ (một lượt): OpenClaw không thể phân biệt về mặt cấu trúc một lần gửi bị tách với các lần gửi riêng biệt, nên duy trì cách hợp nhất trước khi có siêu dữ liệu. Việc phân tách chính xác được kích hoạt khi bản dựng bắt đầu phát ra siêu dữ liệu bong bóng.

| Người dùng soạn                                                      | `chat.db` tạo ra                  | Tắt cờ (mặc định)                      | Bật cờ + cửa sổ (imsg phát ra siêu dữ liệu bong bóng)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (một lần gửi)                              | 2 hàng cách nhau khoảng 1 giây                   | Hai lượt tác nhân: chỉ có "Dump", sau đó là URL | Một lượt: văn bản hợp nhất `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (tệp đính kèm + văn bản)                | 2 hàng không có siêu dữ liệu bong bóng URL | Hai lượt                               | Hai lượt sau khi quan sát thấy siêu dữ liệu; một lượt hợp nhất trên các phiên cũ/trước khi chốt không có siêu dữ liệu       |
| `/status` (lệnh độc lập)                                     | 1 hàng                               | Điều phối tức thì                        | **Chờ tối đa bằng cửa sổ, sau đó điều phối**                                                                |
| Chỉ dán URL                                                   | 1 hàng                               | Điều phối tức thì                        | Chờ tối đa bằng cửa sổ, sau đó điều phối                                                                    |
| Văn bản + URL được gửi thành hai tin nhắn riêng biệt có chủ ý, cách nhau vài phút | 2 hàng ngoài cửa sổ               | Hai lượt                               | Hai lượt (cửa sổ hết hạn giữa hai tin nhắn)                                                             |
| Gửi dồn dập (>10 DM nhỏ trong cửa sổ)                          | N hàng không có siêu dữ liệu bong bóng URL | N lượt                                 | N lượt sau khi quan sát thấy siêu dữ liệu; một lượt hợp nhất có giới hạn trên các phiên cũ/trước khi chốt không có siêu dữ liệu |
| Hai người nhập trong một cuộc trò chuyện nhóm                                  | N hàng từ M người gửi               | M+ lượt (một lượt cho mỗi nhóm người gửi)        | M+ lượt — trò chuyện nhóm không được gộp                                                            |

## Khôi phục tin nhắn đến sau khi bridge hoặc gateway khởi động lại

iMessage khôi phục các tin nhắn bị bỏ lỡ khi gateway ngừng hoạt động, đồng thời ngăn chặn "quả bom backlog" cũ mà Apple có thể đẩy ra sau khi khôi phục Push. Hành vi mặc định luôn được bật và xây dựng trên cơ chế loại bỏ trùng lặp đầu vào.

- **Loại bỏ trùng lặp khi phát lại.** Mọi tin nhắn đến đã điều phối đều được ghi lại bằng GUID Apple trong trạng thái plugin bền vững (`imessage.inbound-dedupe`), được xác nhận quyền xử lý lúc tiếp nhận và ghi nhận sau khi xử lý (được giải phóng khi có lỗi tạm thời để có thể thử lại). Mọi nội dung đã xử lý đều bị loại bỏ thay vì được điều phối hai lần. Đây là cơ chế cho phép quá trình khôi phục phát lại tích cực mà không cần theo dõi riêng từng tin nhắn.
- **Khôi phục thời gian ngừng hoạt động.** Khi khởi động, trình giám sát ghi nhớ rowid của hàng `chat.db` được điều phối gần nhất (một con trỏ bền vững cho mỗi tài khoản) và truyền nó cho `imsg watch.subscribe` dưới dạng `since_rowid`, để imsg phát lại các hàng đến trong khi gateway ngừng hoạt động, rồi tiếp tục theo dõi dữ liệu trực tiếp. Việc phát lại được giới hạn ở 500 hàng gần nhất và các tin nhắn có tuổi tối đa khoảng 2 giờ, còn cơ chế loại bỏ trùng lặp sẽ loại bỏ mọi nội dung đã xử lý.
- **Hàng rào tuổi cho backlog cũ.** Các hàng nằm trên ranh giới khởi động thực sự là dữ liệu trực tiếp; hàng nào có ngày gửi sớm hơn thời điểm đến hơn khoảng 15 phút là backlog do Push đẩy dồn và sẽ bị ngăn chặn. Các hàng được phát lại (ở tại hoặc dưới ranh giới) dùng cửa sổ khôi phục rộng hơn, nhờ đó tin nhắn vừa bị bỏ lỡ được chuyển giao còn lịch sử quá cũ thì không.

Quá trình khôi phục hoạt động trên cả thiết lập `cliPath` cục bộ và từ xa, vì việc phát lại `since_rowid` chạy qua cùng kết nối RPC `imsg`. Điểm khác biệt là cửa sổ: khi gateway có thể đọc `chat.db` (cục bộ), nó neo ranh giới rowid lúc khởi động, giới hạn khoảng phát lại và chuyển giao các tin nhắn bị bỏ lỡ có tuổi tối đa khoảng hai giờ. Qua `cliPath` SSH từ xa, nó không thể đọc cơ sở dữ liệu, nên quá trình phát lại không bị giới hạn và mọi hàng đều dùng hàng rào tuổi trực tiếp — vẫn khôi phục các tin nhắn vừa bị bỏ lỡ và vẫn ngăn backlog cũ, nhưng với cửa sổ trực tiếp hẹp hơn. Chạy gateway trên máy Mac dùng Messages để có cửa sổ khôi phục rộng hơn.

### Tín hiệu hiển thị cho người vận hành

Backlog bị ngăn chặn được ghi nhật ký ở cấp mặc định, không bao giờ bị loại bỏ âm thầm (cờ `recovery` cho biết cửa sổ nào đã được áp dụng):

```text
imessage: đã ngăn backlog tin nhắn đến cũ account=<id> sent=<iso> recovery=<bool> (<N> đã bị ngăn kể từ khi khởi động)
```

### Di chuyển

`channels.imessage.catchup.*` đã lỗi thời — quá trình khôi phục thời gian ngừng hoạt động diễn ra tự động và không cần cấu hình cho các thiết lập mới. Các cấu hình hiện có với `catchup.enabled: true` vẫn được tôn trọng dưới dạng hồ sơ tương thích cho cửa sổ phát lại khôi phục. Các khối bắt kịp đã tắt (`enabled: false` hoặc không có `enabled: true`) đã ngừng sử dụng; `openclaw doctor --fix` sẽ loại bỏ chúng.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không tìm thấy imsg hoặc RPC không được hỗ trợ">
    Xác thực tệp nhị phân và khả năng hỗ trợ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Nếu quá trình thăm dò báo RPC không được hỗ trợ, hãy cập nhật `imsg`. Nếu các thao tác API riêng tư không khả dụng, hãy chạy `imsg launch` trong phiên người dùng macOS đã đăng nhập và thăm dò lại. Nếu Gateway không chạy trên macOS, hãy dùng thiết lập máy Mac từ xa qua SSH ở trên thay cho đường dẫn `imsg` cục bộ mặc định.

  </Accordion>

  <Accordion title="Gửi được tin nhắn nhưng không nhận được iMessage đến">
    Trước tiên, hãy xác minh tin nhắn có đến máy Mac cục bộ hay không. Nếu `chat.db` không thay đổi, OpenClaw không thể nhận tin nhắn ngay cả khi `imsg status --json` báo bridge hoạt động bình thường.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Nếu các tin nhắn gửi từ điện thoại không tạo hàng mới, hãy sửa lớp Messages và Apple Push của macOS trước khi thay đổi cấu hình OpenClaw. Việc làm mới dịch vụ một lần thường là đủ:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Gửi một iMessage mới từ điện thoại và xác nhận có hàng `chat.db` mới hoặc sự kiện `imsg watch` trước khi gỡ lỗi các phiên OpenClaw. Không chạy thao tác này như một vòng lặp khởi chạy lại cầu nối định kỳ; việc lặp lại `imsg launch` cùng với khởi động lại Gateway trong khi đang hoạt động có thể làm gián đoạn quá trình gửi và khiến các lượt chạy kênh đang xử lý bị mắc kẹt.

  </Accordion>

  <Accordion title="Gateway không chạy trên macOS">
    `cliPath: "imsg"` mặc định phải chạy trên máy Mac đã đăng nhập vào Messages. Trên Linux hoặc Windows, đặt `channels.imessage.cliPath` thành một tập lệnh bao bọc dùng SSH để kết nối với máy Mac đó và chạy `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Sau đó chạy:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Tin nhắn trực tiếp bị bỏ qua">
    Kiểm tra:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - các phê duyệt ghép nối (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua">
    Kiểm tra:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` hành vi của danh sách cho phép
    - cấu hình mẫu đề cập (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Tệp đính kèm từ xa không hoạt động">
    Kiểm tra:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - xác thực bằng khóa SSH/SCP từ máy chủ Gateway
    - khóa máy chủ tồn tại trong `~/.ssh/known_hosts` trên máy chủ Gateway
    - quyền đọc đường dẫn từ xa trên máy Mac chạy Messages

  </Accordion>

  <Accordion title="Đã bỏ lỡ lời nhắc cấp quyền của macOS">
    Chạy lại trong một terminal GUI tương tác với cùng ngữ cảnh người dùng/phiên và chấp thuận các lời nhắc:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Xác nhận rằng Quyền truy cập toàn bộ ổ đĩa + Tự động hóa đã được cấp cho ngữ cảnh tiến trình chạy OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Tham chiếu cấu hình

- [Tham chiếu cấu hình - iMessage](/vi/gateway/config-channels#imessage)
- [Cấu hình Gateway](/vi/gateway/configuration)
- [Ghép nối](/vi/channels/pairing)

## Liên quan

- [Tổng quan về các kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Việc loại bỏ BlueBubbles và lộ trình iMessage qua imsg](/vi/announcements/bluebubbles-imessage) — thông báo và tóm tắt quá trình di chuyển
- [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) — bảng chuyển đổi cấu hình và quy trình chuyển đổi từng bước
- [Ghép nối](/vi/channels/pairing) — quy trình xác thực DM và ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cơ chế kiểm soát bằng đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
