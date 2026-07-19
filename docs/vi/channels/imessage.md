---
read_when:
    - Thiết lập hỗ trợ iMessage
    - Gỡ lỗi gửi/nhận iMessage
summary: Hỗ trợ iMessage nguyên bản thông qua imsg (JSON-RPC qua stdio), với các hành động API riêng tư cho phản hồi, tapback, hiệu ứng, cuộc thăm dò ý kiến, tệp đính kèm và quản lý nhóm. Đây là lựa chọn ưu tiên cho các thiết lập iMessage OpenClaw mới khi đáp ứng các yêu cầu về máy chủ.
title: iMessage
x-i18n:
    generated_at: "2026-07-19T05:36:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 215364b4a0424db3fccb27e29815f2a94c55ebe66d1eec21ed85e4b7947ea1ab
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Đối với cách triển khai OpenClaw iMessage thông thường, hãy chạy Gateway và `imsg` trên cùng máy chủ macOS Messages đã đăng nhập. Nếu Gateway chạy ở nơi khác, hãy trỏ `channels.imessage.cliPath` đến một trình bao bọc SSH trong suốt chạy `imsg` trên máy Mac.

**Quá trình khôi phục tin nhắn đến diễn ra tự động.** Sau khi cầu nối hoặc Gateway khởi động lại, iMessage phát lại các tin nhắn bị bỏ lỡ trong thời gian ngừng hoạt động và chặn loạt tin nhắn tồn đọng cũ mà Apple có thể đẩy ra sau khi khôi phục Push, đồng thời loại bỏ trùng lặp để không có nội dung nào được phân phối hai lần. Không có cấu hình nào cần bật — xem [Khôi phục tin nhắn đến sau khi cầu nối hoặc Gateway khởi động lại](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Hỗ trợ BlueBubbles đã bị loại bỏ. Hãy di chuyển cấu hình `channels.bluebubbles` sang `channels.imessage`; OpenClaw chỉ hỗ trợ iMessage thông qua `imsg`. Hãy bắt đầu với [Loại bỏ BlueBubbles và đường dẫn imsg iMessage](/vi/announcements/bluebubbles-imessage) để xem thông báo ngắn, hoặc [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) để xem bảng di chuyển đầy đủ.
</Warning>

Trạng thái: tích hợp CLI bên ngoài nguyên bản. Gateway khởi chạy `imsg rpc` và giao tiếp bằng JSON-RPC qua stdio — không có daemon hoặc cổng riêng. Chế độ API riêng tư được đặc biệt khuyến nghị để có một kênh iMessage đầy đủ; các thao tác trả lời, tapback, hiệu ứng, cuộc thăm dò ý kiến, trả lời tệp đính kèm và thao tác nhóm yêu cầu `imsg launch` cùng một lần thăm dò API riêng tư thành công.

Đối với thiết lập cục bộ phổ biến, trình thiết lập OpenClaw có thể đề nghị cài đặt hoặc cập nhật `imsg` qua Homebrew sau khi người dùng xác nhận trên máy Mac Messages đã đăng nhập. Việc thiết lập thủ công và các mô hình trình bao bọc SSH vẫn do người vận hành quản lý: hãy cài đặt hoặc cập nhật `imsg` trong cùng ngữ cảnh người dùng sẽ chạy Gateway hoặc trình bao bọc.

<CardGroup cols={3}>
  <Card title="Thao tác API riêng tư" icon="wand-sparkles" href="#private-api-actions">
    Trả lời, tapback, hiệu ứng, cuộc thăm dò ý kiến, tệp đính kèm và quản lý nhóm.
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

      <Step title="Khởi động Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Phê duyệt ghép nối tin nhắn trực tiếp đầu tiên (dmPolicy mặc định)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Yêu cầu ghép nối hết hạn sau 1 giờ.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Máy Mac từ xa qua SSH">
    Hầu hết các thiết lập không cần SSH. Chỉ sử dụng mô hình này khi Gateway không thể chạy trên máy Mac Messages đã đăng nhập. OpenClaw chỉ yêu cầu một `cliPath` tương thích với stdio, vì vậy bạn có thể trỏ `cliPath` đến một tập lệnh bao bọc dùng SSH để kết nối đến máy Mac từ xa và chạy `imsg`.
    Hãy cài đặt và cập nhật `imsg` trên máy Mac từ xa đó, không phải trên máy chủ Gateway:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Cấu hình khuyến nghị khi bật tệp đính kèm:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // dùng để tìm nạp tệp đính kèm qua SCP
      includeAttachments: true,
      // Tùy chọn: các thư mục gốc tệp đính kèm bổ sung được phép (hợp nhất với
      // /Users/*/Library/Messages/Attachments mặc định).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Nếu `remoteHost` chưa được đặt, OpenClaw sẽ cố gắng tự động phát hiện bằng cách phân tích tập lệnh bao bọc SSH.
    `remoteHost` phải là `host` hoặc `user@host` (không có dấu cách hoặc tùy chọn SSH); các giá trị không an toàn sẽ bị bỏ qua.
    OpenClaw sử dụng chế độ kiểm tra khóa máy chủ nghiêm ngặt cho SCP, vì vậy khóa của máy chủ chuyển tiếp phải tồn tại sẵn trong `~/.ssh/known_hosts`.
    Đường dẫn tệp đính kèm được xác thực dựa trên các thư mục gốc được phép (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Mọi trình bao bọc `cliPath` hoặc proxy SSH mà bạn đặt phía trước `imsg` PHẢI hoạt động như một đường ống stdio trong suốt dành cho JSON-RPC tồn tại lâu dài. OpenClaw trao đổi các thông điệp JSON-RPC nhỏ được phân khung bằng dòng mới qua stdin/stdout của trình bao bọc trong toàn bộ thời gian tồn tại của kênh:

- Chuyển tiếp từng đoạn/dòng stdin **ngay khi có byte khả dụng** — không chờ EOF.
- Chuyển tiếp nhanh từng đoạn/dòng stdout theo chiều ngược lại.
- Giữ nguyên các dòng mới.
- Tránh các thao tác đọc chặn theo kích thước cố định (`read(4096)`, `cat | buffer`, `read` mặc định của shell) có thể làm các khung nhỏ bị thiếu dữ liệu.
- Giữ stderr tách biệt khỏi luồng stdout JSON-RPC.

Một trình bao bọc đệm stdin cho đến khi đầy một khối lớn sẽ tạo ra các triệu chứng trông giống như iMessage ngừng hoạt động — `imsg rpc timeout (chats.list)` hoặc kênh khởi động lại nhiều lần — mặc dù bản thân `imsg rpc` vẫn hoạt động bình thường. `ssh -T host imsg "$@"` (ở trên) an toàn vì nó chuyển tiếp các đối số `cliPath` của OpenClaw, chẳng hạn như `rpc` và `--db`. Các pipeline như `ssh host imsg | grep -v '^DEBUG'` thì KHÔNG — các công cụ đệm theo dòng vẫn có thể giữ lại khung; hãy sử dụng `stdbuf -oL -eL` ở mọi giai đoạn nếu bắt buộc phải lọc.
</Warning>

  </Tab>
</Tabs>

## Yêu cầu và quyền (macOS)

- Messages phải được đăng nhập trên máy Mac chạy `imsg`.
- Ngữ cảnh tiến trình chạy OpenClaw/`imsg` phải có quyền Truy cập toàn bộ ổ đĩa (để truy cập cơ sở dữ liệu Messages).
- Cần có quyền Tự động hóa để gửi tin nhắn thông qua Messages.app.
- Đối với các thao tác nâng cao (bày tỏ cảm xúc / chỉnh sửa / thu hồi / trả lời theo luồng / hiệu ứng / cuộc thăm dò ý kiến / thao tác nhóm), phải tắt System Integrity Protection — xem [Bật API riêng tư của imsg](#enabling-the-imsg-private-api). Việc gửi/nhận văn bản và phương tiện cơ bản vẫn hoạt động khi không tắt tính năng này.

<Tip>
Quyền được cấp theo từng ngữ cảnh tiến trình. Nếu Gateway chạy không giao diện (LaunchAgent/SSH), hãy chạy một lệnh tương tác một lần trong cùng ngữ cảnh đó để kích hoạt lời nhắc:

```bash
imsg chats --limit 1
# hoặc
imsg send <handle> "kiểm tra"
```

</Tip>

<Accordion title="Gửi qua trình bao bọc SSH không thành công với AppleEvents -1743">
  Thiết lập SSH từ xa có thể đọc cuộc trò chuyện, vượt qua `channels status --probe` và xử lý tin nhắn đến trong khi quá trình gửi đi vẫn không thành công do lỗi ủy quyền AppleEvents:

```text
Không được ủy quyền gửi sự kiện Apple đến Messages. (-1743)
```

Kiểm tra cơ sở dữ liệu TCC của người dùng đã đăng nhập trên máy Mac hoặc System Settings > Privacy & Security > Automation. Nếu mục Automation được ghi cho `/usr/libexec/sshd-keygen-wrapper` thay vì tiến trình `imsg` hoặc shell cục bộ, macOS có thể không hiển thị nút chuyển Messages có thể sử dụng cho máy khách phía máy chủ SSH đó:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Trong trạng thái đó, việc lặp lại `tccutil reset AppleEvents` hoặc chạy lại `imsg send` thông qua cùng trình bao bọc SSH có thể tiếp tục không thành công vì ngữ cảnh tiến trình cần quyền Tự động hóa Messages là trình bao bọc SSH, không phải một ứng dụng mà giao diện người dùng có thể cấp quyền.

Thay vào đó, hãy sử dụng một trong các ngữ cảnh tiến trình `imsg` được hỗ trợ:

- Chạy Gateway, hoặc ít nhất là cầu nối `imsg`, trong phiên cục bộ của người dùng Messages đã đăng nhập.
- Khởi động Gateway bằng LaunchAgent cho người dùng đó sau khi cấp quyền Truy cập toàn bộ ổ đĩa và Tự động hóa từ cùng phiên.
- Nếu giữ mô hình SSH hai người dùng, hãy xác minh rằng một lệnh `imsg send` gửi đi thực sự thành công thông qua đúng trình bao bọc trước khi bật kênh. Nếu không thể cấp quyền Tự động hóa, hãy cấu hình lại thành thiết lập `imsg` một người dùng thay vì dựa vào trình bao bọc SSH để gửi.

</Accordion>

## Bật API riêng tư của imsg

`imsg` được cung cấp với hai chế độ vận hành. Đối với OpenClaw, chế độ API riêng tư là thiết lập được khuyến nghị vì nó mang đến cho kênh các thao tác iMessage nguyên bản mà người dùng mong đợi. Chế độ cơ bản vẫn hữu ích cho các bản cài đặt ít rủi ro, quá trình xác minh ban đầu hoặc các máy chủ không thể tắt SIP.

- **Chế độ cơ bản** (mặc định, không cần thay đổi SIP): văn bản và phương tiện gửi đi qua `send`, theo dõi/lịch sử tin nhắn đến, danh sách cuộc trò chuyện. Đây là những gì có sẵn ngay từ đầu với một bản `brew install steipete/tap/imsg` mới cùng các quyền macOS tiêu chuẩn ở trên.
- **Chế độ API riêng tư**: `imsg` chèn một dylib trợ giúp vào `Messages.app` để gọi các hàm `IMCore` nội bộ. Chế độ này mở khóa `react`, `edit`, `unsend`, `reply` (theo luồng), `sendWithEffect`, `poll` và `poll-vote` (các cuộc thăm dò ý kiến nguyên bản của Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, cùng chỉ báo đang nhập và xác nhận đã đọc.

Bề mặt thao tác được khuyến nghị trên trang này yêu cầu chế độ API riêng tư. README của `imsg` nêu rõ yêu cầu này:

> Các tính năng nâng cao như `read`, `typing`, `launch`, gửi nội dung phong phú có cầu nối hỗ trợ, thay đổi tin nhắn và quản lý cuộc trò chuyện là tùy chọn chủ động. Chúng yêu cầu tắt SIP và chèn một dylib trợ giúp vào `Messages.app`. `imsg launch` từ chối chèn khi SIP đang bật.

Kỹ thuật chèn trình trợ giúp sử dụng dylib riêng của `imsg` để truy cập các API riêng tư của Messages. Không có máy chủ bên thứ ba hoặc runtime BlueBubbles trong đường dẫn iMessage của OpenClaw.

<Warning>
**Việc tắt SIP là một sự đánh đổi bảo mật thực sự.** SIP là một trong những cơ chế bảo vệ cốt lõi của macOS chống lại việc chạy mã hệ thống đã bị sửa đổi; tắt SIP trên toàn hệ thống sẽ làm tăng bề mặt tấn công và các tác dụng phụ. Đáng chú ý, **việc tắt SIP trên máy Mac dùng Apple Silicon cũng vô hiệu hóa khả năng cài đặt và chạy ứng dụng iOS trên máy Mac**.

Hãy coi đây là một lựa chọn vận hành có chủ đích, đặc biệt trên máy Mac cá nhân chính. Để OpenClaw iMessage đạt chất lượng vận hành thực tế, nên dùng một máy Mac chuyên dụng hoặc người dùng bot macOS mà trên đó bạn thấy phù hợp khi bật cầu nối. Nếu mô hình mối đe dọa của bạn không chấp nhận việc SIP bị tắt ở bất kỳ đâu, iMessage đi kèm sẽ bị giới hạn ở chế độ cơ bản — chỉ gửi/nhận văn bản và phương tiện, không có bày tỏ cảm xúc / chỉnh sửa / thu hồi / hiệu ứng / thao tác nhóm.
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

2. **Tắt System Integrity Protection và (trên macOS hiện đại) Library Validation.** Việc chèn một dylib trợ giúp không phải của Apple vào `Messages.app` được Apple ký yêu cầu phải tắt SIP **và** nới lỏng quy trình xác thực thư viện. Bước SIP trong chế độ Khôi phục phụ thuộc vào phiên bản macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** tắt Library Validation qua Terminal, khởi động lại vào Recovery Mode, chạy `csrutil disable`, rồi khởi động lại.
   - **macOS 11+ (Big Sur trở lên), Intel:** vào Recovery Mode (hoặc Internet Recovery), chạy `csrutil disable`, rồi khởi động lại.
   - **macOS 11+, Apple Silicon:** dùng trình tự khởi động bằng nút nguồn để vào Recovery; trên các phiên bản macOS gần đây, giữ phím **Left Shift** khi bạn nhấp vào Continue, rồi chạy `csrutil disable`. Thiết lập máy ảo tuân theo một quy trình riêng, vì vậy trước tiên hãy tạo ảnh chụp nhanh VM.

   **Trên macOS 11 trở lên, chỉ `csrutil disable` thường là chưa đủ.** Apple vẫn thực thi quy trình xác thực thư viện đối với `Messages.app` dưới dạng tệp nhị phân nền tảng, nên trình trợ giúp được ký adhoc sẽ bị từ chối (`Library Validation failed: ... platform binary, but mapped file is not`) ngay cả khi SIP đã tắt. Sau khi tắt SIP, hãy tắt cả quy trình xác thực thư viện và khởi động lại:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), đã xác minh trên 26.5.1:** tắt SIP **cộng với** lệnh `DisableLibraryValidation` ở trên là đủ để chèn trình trợ giúp trên các phiên bản từ 26.0 đến 26.5.x. **Không cần boot-args.** Plist là yếu tố quyết định và là bước thường bị thiếu nhất khi quá trình chèn thất bại trên Tahoe:
   - **Có plist:** `imsg launch` chèn thành công và `imsg status` báo cáo `advanced_features: true`.
   - **Không có plist (ngay cả khi SIP đã tắt):** `imsg launch` thất bại với `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI từ chối trình trợ giúp adhoc khi tải, nên bridge không bao giờ sẵn sàng và quá trình khởi chạy hết thời gian chờ. Đây là triệu chứng mà phần lớn người dùng gặp trên Tahoe; cách khắc phục là plist ở trên, không phải biện pháp nào quyết liệt hơn.

   Nếu việc chèn `imsg launch` hoặc một số `selectors` cụ thể bắt đầu trả về false sau khi nâng cấp macOS, cổng kiểm tra này thường là nguyên nhân. Hãy kiểm tra trạng thái SIP và xác thực thư viện trước khi cho rằng chính bước SIP đã thất bại. Nếu các cài đặt đó chính xác nhưng bridge vẫn không thể chèn, hãy thu thập `imsg status --json` cùng đầu ra của `imsg launch` và báo cáo cho dự án `imsg` thay vì làm suy yếu thêm các biện pháp kiểm soát bảo mật trên toàn hệ thống.

3. **Chèn trình trợ giúp.** Khi SIP đã tắt và Messages.app đã đăng nhập:

   ```bash
   imsg launch
   ```

   `imsg launch` từ chối chèn khi SIP vẫn được bật, vì vậy thao tác này cũng đồng thời xác nhận rằng bước 2 đã có hiệu lực.

4. **Xác minh bridge từ OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Mục iMessage phải báo cáo `works`, và `imsg status --json | jq '{rpc_methods, selectors}'` phải hiển thị các khả năng được bản dựng macOS của bạn cung cấp. Việc tạo cuộc thăm dò yêu cầu `selectors.pollPayloadMessage`; bỏ phiếu yêu cầu cả `selectors.pollVoteMessage` và phương thức RPC `poll.vote`. Plugin OpenClaw chỉ quảng bá những hành động được probe lưu trong bộ nhớ đệm hỗ trợ, còn bộ nhớ đệm trống vẫn giả định lạc quan và thực hiện probe trong lần điều phối đầu tiên.

Nếu `openclaw channels status --probe` báo cáo kênh là `works` nhưng các hành động cụ thể phát sinh lỗi "iMessage `<action>` requires the imsg private API bridge" tại thời điểm điều phối, hãy chạy lại `imsg launch` — trình trợ giúp có thể bị ngắt kết nối (Messages.app khởi động lại, cập nhật hệ điều hành, v.v.) và trạng thái `available: true` được lưu trong bộ nhớ đệm sẽ tiếp tục quảng bá các hành động cho đến khi probe tiếp theo làm mới trạng thái.

### Khi SIP vẫn được bật

Nếu việc tắt SIP không phù hợp với mô hình mối đe dọa của bạn:

- `imsg` chuyển về chế độ cơ bản — chỉ văn bản + phương tiện + nhận.
- Plugin OpenClaw vẫn quảng bá chức năng gửi văn bản/phương tiện và giám sát đầu vào; Plugin ẩn `react`, `edit`, `unsend`, `reply`, `sendWithEffect` và các thao tác nhóm khỏi bề mặt hành động (theo cổng khả năng của từng phương thức).
- Bạn có thể chạy một máy Mac không dùng Apple Silicon riêng biệt (hoặc máy Mac dành riêng cho bot) với SIP đã tắt để xử lý khối lượng công việc iMessage, trong khi vẫn bật SIP trên các thiết bị chính. Xem [Người dùng macOS dành riêng cho bot (danh tính iMessage riêng)](#deployment-patterns) ở bên dưới.

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="Chính sách DM">
    `channels.imessage.dmPolicy` kiểm soát tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist` (yêu cầu ít nhất một mục `allowFrom`)
    - `open` (yêu cầu `allowFrom` chứa `"*"`)
    - `disabled`

    Trường danh sách cho phép: `channels.imessage.allowFrom`.

    Các mục trong danh sách cho phép phải xác định người gửi: handle hoặc nhóm truy cập người gửi tĩnh (`accessGroup:<name>`). Dùng `channels.imessage.groupAllowFrom` cho các đích trò chuyện như `chat_id:*`, `chat_guid:*` hoặc `chat_identifier:*`; dùng `channels.imessage.groups` cho các khóa sổ đăng ký `chat_id` dạng số.

  </Tab>

  <Tab title="Chính sách nhóm + lượt đề cập">
    `channels.imessage.groupPolicy` kiểm soát việc xử lý nhóm:

    - `allowlist` (mặc định)
    - `open`
    - `disabled`

    Danh sách cho phép người gửi trong nhóm: `channels.imessage.groupAllowFrom`.

    Các mục `groupAllowFrom` cũng có thể tham chiếu đến nhóm truy cập người gửi tĩnh (`accessGroup:<name>`).

    Phương án dự phòng khi chạy: nếu `groupAllowFrom` chưa được đặt, quá trình kiểm tra người gửi trong nhóm iMessage sẽ dùng `allowFrom`; hãy đặt `groupAllowFrom` khi tiêu chí cho phép DM và nhóm cần khác nhau. Một `groupAllowFrom: []` được đặt rõ ràng thành rỗng sẽ không dùng phương án dự phòng — nó chặn mọi người gửi trong nhóm theo `allowlist`.
    Lưu ý khi chạy: nếu hoàn toàn thiếu `channels.imessage`, runtime sẽ dùng dự phòng `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

    <Warning>
    Định tuyến nhóm theo `groupPolicy: "allowlist"` chạy **hai** cổng liên tiếp:

    1. **Danh sách cho phép người gửi** (`channels.imessage.groupAllowFrom`) — handle, `accessGroup:<name>`, `chat_guid`, `chat_identifier` hoặc `chat_id`. Danh sách có hiệu lực trống (không có `groupAllowFrom` và không có phương án dự phòng `allowFrom`) sẽ chặn mọi người gửi trong nhóm.
    2. **Sổ đăng ký nhóm** (`channels.imessage.groups`) — được thực thi khi ánh xạ có mục: cuộc trò chuyện phải khớp với một mục `chat_id` cụ thể hoặc ký tự đại diện `groups: { "*": { ... } }`. Khi `groups` trống hoặc bị thiếu, chỉ danh sách cho phép người gửi quyết định việc cho phép.

    Nếu không cấu hình danh sách cho phép người gửi trong nhóm có hiệu lực, mọi tin nhắn nhóm sẽ bị loại bỏ trước cổng sổ đăng ký. Mỗi cổng có tín hiệu cấp `warn` riêng ở cấp nhật ký mặc định và mỗi tín hiệu nêu một cách khắc phục khác nhau:

    - một lần cho mỗi tài khoản khi khởi động, khi danh sách cho phép người gửi trong nhóm có hiệu lực trống: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — khắc phục bằng cách đặt `channels.imessage.groupAllowFrom` (hoặc `allowFrom`); chỉ thêm các mục `groups` vẫn khiến cổng 1 chặn mọi người gửi.
    - một lần cho mỗi `chat_id` khi chạy, khi người gửi đã vượt qua cổng 1 nhưng cuộc trò chuyện không có trong sổ đăng ký `groups` đã có dữ liệu: `imessage: dropping group message from chat_id=<id> ...` — khắc phục bằng cách thêm `chat_id` đó (hoặc `"*"`) dưới `channels.imessage.groups`.

    DM không bị ảnh hưởng — chúng đi theo một đường dẫn mã khác.

    Cấu hình được khuyến nghị cho luồng nhóm theo `groupPolicy: "allowlist"`:

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

    Chỉ `groupAllowFrom` đã cho phép những người gửi đó trong bất kỳ nhóm nào; thêm khối `groups` để giới hạn những cuộc trò chuyện được phép (và đặt các tùy chọn theo từng cuộc trò chuyện như `requireMention`).
    </Warning>

    Kiểm soát lượt đề cập cho nhóm:

    - iMessage không có siêu dữ liệu lượt đề cập gốc
    - phát hiện lượt đề cập sử dụng các mẫu biểu thức chính quy (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - khi không có mẫu nào được cấu hình, không thể thực thi kiểm soát lượt đề cập
    - các lệnh điều khiển từ người gửi được ủy quyền bỏ qua kiểm soát lượt đề cập

    `systemPrompt` theo từng nhóm:

    Mỗi mục dưới `channels.imessage.groups.*` chấp nhận một chuỗi `systemPrompt` tùy chọn, được chèn vào lời nhắc hệ thống của tác nhân ở mỗi lượt xử lý tin nhắn trong nhóm đó. Cách phân giải tương tự `channels.whatsapp.groups`:

    1. **Lời nhắc hệ thống riêng cho nhóm** (`groups["<chat_id>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong ánh xạ **và** khóa `systemPrompt` của mục đó đã được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`), ký tự đại diện sẽ bị vô hiệu hóa và không áp dụng lời nhắc hệ thống nào cho nhóm đó.
    2. **Lời nhắc hệ thống ký tự đại diện cho nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn không có trong ánh xạ hoặc khi mục đó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

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

    Lời nhắc theo từng nhóm chỉ áp dụng cho tin nhắn nhóm — tin nhắn trực tiếp không bị ảnh hưởng.

  </Tab>

  <Tab title="Phiên và phản hồi xác định">
    - DM dùng định tuyến trực tiếp; nhóm dùng định tuyến nhóm.
    - Với `session.dmScope=main` mặc định, các DM iMessage được gộp vào phiên chính của tác nhân.
    - Các phiên nhóm được cô lập (`agent:<agentId>:imessage:group:<chat_id>`).
    - Phản hồi được định tuyến trở lại iMessage bằng siêu dữ liệu kênh/đích ban đầu.

    Hành vi luồng gần giống nhóm:

    Một số luồng iMessage có nhiều người tham gia có thể đến với `is_group=false`.
    Nếu `chat_id` đó được cấu hình rõ ràng dưới `channels.imessage.groups`, OpenClaw coi đó là lưu lượng nhóm (kiểm soát nhóm + cô lập phiên nhóm).

  </Tab>
</Tabs>

## Liên kết cuộc hội thoại ACP

Các cuộc trò chuyện iMessage có thể được liên kết với phiên ACP.

Luồng thao tác nhanh:

- Chạy `/acp spawn codex --bind here` bên trong DM hoặc cuộc trò chuyện nhóm được phép.
- Các tin nhắn sau đó trong cùng cuộc hội thoại iMessage sẽ được định tuyến đến phiên ACP vừa tạo.
- `/new` và `/reset` đặt lại tại chỗ cùng phiên ACP đã liên kết.
- `/acp close` đóng phiên ACP và xóa liên kết.

Các liên kết bền vững được cấu hình sử dụng các mục `bindings[]` cấp cao nhất với `type: "acp"` và `match.channel: "imessage"`.

`match.peer.id` có thể dùng:

- handle DM đã chuẩn hóa như `+15555550123` hoặc `user@example.com`
- `chat_id:<id>` (được khuyến nghị cho liên kết nhóm ổn định)
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
    Sử dụng Apple ID và người dùng macOS chuyên dụng để lưu lượng bot được tách biệt khỏi hồ sơ Messages cá nhân của bạn.

    Luồng điển hình:

    1. Tạo/đăng nhập vào một người dùng macOS chuyên dụng.
    2. Đăng nhập vào Messages bằng Apple ID của bot trong người dùng đó.
    3. Cài đặt `imsg` trong người dùng đó.
    4. Tạo một trình bao bọc SSH để OpenClaw có thể chạy `imsg` trong ngữ cảnh người dùng đó.
    5. Trỏ `channels.imessage.accounts.<id>.cliPath` và `.dbPath` đến hồ sơ người dùng đó.

    Lần chạy đầu tiên có thể yêu cầu phê duyệt qua GUI (Automation + Full Disk Access) trong phiên của người dùng bot đó.

  </Accordion>

  <Accordion title="Máy Mac từ xa qua Tailscale (ví dụ)">
    Cấu trúc liên kết phổ biến:

    - Gateway chạy trên Linux/VM
    - iMessage + `imsg` chạy trên một máy Mac trong tailnet của bạn
    - Trình bao bọc `cliPath` sử dụng SSH để chạy `imsg`
    - `remoteHost` cho phép tìm nạp tệp đính kèm qua SCP

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
    Trước tiên, hãy đảm bảo khóa máy chủ được tin cậy (ví dụ `ssh bot@mac-mini.tailnet-1234.ts.net`) để `known_hosts` được điền.

  </Accordion>

  <Accordion title="Mẫu nhiều tài khoản">
    iMessage hỗ trợ cấu hình theo từng tài khoản trong `channels.imessage.accounts`.

    Mỗi tài khoản có thể ghi đè các trường như `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, cài đặt lịch sử và danh sách cho phép gốc của tệp đính kèm.

  </Accordion>

  <Accordion title="Lịch sử tin nhắn trực tiếp">
    Đặt `channels.imessage.dmHistoryLimit` để khởi tạo các phiên tin nhắn trực tiếp mới bằng lịch sử `imsg` gần đây đã giải mã của cuộc trò chuyện đó. Sử dụng `channels.imessage.dms["<sender>"].historyLimit` để ghi đè theo từng người gửi, bao gồm `0` để tắt lịch sử cho một người gửi.

    Lịch sử tin nhắn trực tiếp iMessage được tìm nạp theo yêu cầu từ `imsg`. Việc không đặt `dmHistoryLimit` sẽ tắt khởi tạo lịch sử tin nhắn trực tiếp toàn cục, nhưng giá trị `channels.imessage.dms["<sender>"].historyLimit` dương theo từng người gửi vẫn bật khởi tạo cho người gửi đó.

  </Accordion>
</AccordionGroup>

## Phương tiện, phân đoạn và đích gửi

<AccordionGroup>
  <Accordion title="Tệp đính kèm và phương tiện">
    - việc tiếp nhận tệp đính kèm đến **bị tắt theo mặc định** — đặt `channels.imessage.includeAttachments: true` để chuyển tiếp ảnh, bản ghi âm, video và các tệp đính kèm khác đến tác nhân. Khi tùy chọn này bị tắt, các iMessage chỉ chứa tệp đính kèm sẽ bị loại bỏ trước khi đến tác nhân và có thể hoàn toàn không tạo ra dòng nhật ký `Inbound message`.
    - có thể tìm nạp đường dẫn tệp đính kèm từ xa qua SCP khi đặt `remoteHost`
    - đường dẫn tệp đính kèm phải khớp với các gốc được cho phép:
      - `channels.imessage.attachmentRoots` (cục bộ)
      - `channels.imessage.remoteAttachmentRoots` (chế độ SCP từ xa)
      - các gốc đã cấu hình mở rộng mẫu gốc mặc định `/Users/*/Library/Messages/Attachments` (được hợp nhất, không bị thay thế)
    - SCP sử dụng kiểm tra khóa máy chủ nghiêm ngặt (`StrictHostKeyChecking=yes`)
    - kích thước phương tiện gửi đi sử dụng `channels.imessage.mediaMaxMb` (mặc định 16 MB)

  </Accordion>

  <Accordion title="Văn bản gửi đi và phân đoạn">
    - giới hạn phân đoạn văn bản: `channels.imessage.textChunkLimit` (mặc định 4000)
    - chế độ phân đoạn: `channels.imessage.streaming.chunkMode`
      - `length` (mặc định)
      - `newline` (ưu tiên phân tách theo đoạn văn)
    - chữ đậm/nghiêng/gạch chân/gạch ngang Markdown gửi đi được chuyển đổi thành văn bản có kiểu định dạng gốc (người nhận dùng macOS 15+ sẽ thấy định dạng; người nhận dùng phiên bản cũ hơn sẽ thấy văn bản thuần không có các dấu đánh dấu); bảng Markdown được chuyển đổi theo chế độ bảng Markdown của kênh
    - `channels.imessage.sendTransport` (mặc định `auto`, `bridge`, `applescript`) chọn cách `imsg` thực hiện việc gửi

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

Khi `imsg launch` đang chạy và `openclaw channels status --probe` báo cáo `privateApi.available: true`, công cụ tin nhắn có thể sử dụng các hành động gốc của iMessage bên cạnh việc gửi văn bản thông thường.

Tất cả hành động được bật theo mặc định; sử dụng `channels.imessage.actions` để tắt từng hành động riêng lẻ:

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
  <Accordion title="Các hành động khả dụng">
    - **react**: Thêm/xóa tapback iMessage (`messageId`, `emoji`, `remove`). Các tapback được hỗ trợ ánh xạ tới yêu thích, thích, không thích, cười, nhấn mạnh và thắc mắc. Việc xóa mà không có emoji sẽ xóa bất kỳ tapback nào đã được đặt.
    - **reply**: Gửi câu trả lời theo luồng cho một tin nhắn hiện có (`messageId`, `text` hoặc `message`, cùng với `chatGuid`, `chatId`, `chatIdentifier` hoặc `to`). Trả lời kèm tệp đính kèm còn yêu cầu một bản dựng `imsg` có `send-rich` hỗ trợ `--file`.
    - **sendWithEffect**: Gửi văn bản với hiệu ứng iMessage (`text` hoặc `message`, `effect` hoặc `effectId`). Tên ngắn: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Chỉnh sửa tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`, `text` hoặc `newText`). Chỉ có thể chỉnh sửa các tin nhắn do chính Gateway gửi.
    - **unsend**: Thu hồi tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`). Chỉ có thể thu hồi các tin nhắn do chính Gateway gửi.
    - **upload-file**: Gửi phương tiện/tệp (`buffer` dưới dạng base64 hoặc một `media`/`path`/`filePath` đã được nạp đầy đủ, `filename`, `asVoice` không bắt buộc). Bí danh cũ: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Quản lý cuộc trò chuyện nhóm khi đích hiện tại là một cuộc trò chuyện nhóm. Các hành động này thay đổi danh tính Messages của máy chủ, vì vậy chúng yêu cầu người gửi là chủ sở hữu hoặc một máy khách Gateway `operator.admin`.
    - **poll**: Tạo cuộc thăm dò Apple Messages gốc (`pollQuestion`, `pollOption` lặp lại từ 2 đến 12 lần, cùng với `chatGuid`, `chatId`, `chatIdentifier` hoặc `to`). Người nhận dùng iOS/iPadOS/macOS 26+ có thể xem và bỏ phiếu trực tiếp; các phiên bản hệ điều hành cũ hơn nhận được văn bản dự phòng "Đã gửi một cuộc thăm dò". Yêu cầu `selectors.pollPayloadMessage`.
    - **poll-vote**: Bỏ phiếu trong một cuộc thăm dò hiện có (`pollId` hoặc `messageId`, cùng với chính xác một trong `pollOptionIndex`, `pollOptionId` hoặc `pollOptionText`). Yêu cầu `selectors.pollVoteMessage` và phương thức RPC `poll.vote`.

    Các cuộc thăm dò đến được chấp nhận sẽ được hiển thị cho tác nhân cùng với câu hỏi, nhãn tùy chọn được đánh số, số phiếu và ID tin nhắn của cuộc thăm dò mà `poll-vote` cần.

  </Accordion>

  <Accordion title="ID tin nhắn">
    Ngữ cảnh iMessage đến bao gồm cả các giá trị `MessageSid` ngắn và GUID đầy đủ của tin nhắn (`MessageSidFull`) khi có. ID ngắn chỉ có phạm vi trong bộ nhớ đệm trả lời gần đây dựa trên SQLite và được kiểm tra đối chiếu với cuộc trò chuyện hiện tại trước khi sử dụng. Nếu một ID ngắn hết hạn, hãy thử lại bằng `MessageSidFull` của nó trong khi nhắm đến cuộc trò chuyện đã cung cấp ID đó. ID đầy đủ không bỏ qua ràng buộc cuộc trò chuyện hoặc tài khoản, vì vậy hãy thay một ID từ cuộc trò chuyện khác bằng ID từ đích hiện tại. Các lệnh gọi được ủy quyền từ xa có thể từ chối ID đầy đủ đã cũ khi không có bằng chứng về cuộc trò chuyện hiện tại.

  </Accordion>

  <Accordion title="Phát hiện khả năng">
    OpenClaw chỉ ẩn các hành động API riêng tư khi trạng thái thăm dò đã lưu trong bộ nhớ đệm cho biết cầu nối không khả dụng. Nếu trạng thái chưa xác định, các hành động vẫn hiển thị và việc điều phối sẽ thăm dò một cách trì hoãn để hành động đầu tiên có thể thành công sau `imsg launch` mà không cần làm mới trạng thái thủ công riêng biệt.

  </Accordion>

  <Accordion title="Biên nhận đã đọc và trạng thái đang nhập">
    Khi cầu nối API riêng tư hoạt động, các cuộc trò chuyện đến được chấp nhận sẽ được đánh dấu là đã đọc và các cuộc trò chuyện trực tiếp sẽ hiển thị bong bóng đang nhập ngay khi lượt được chấp nhận, trong khi tác nhân chuẩn bị ngữ cảnh và tạo nội dung. Tắt đánh dấu đã đọc bằng:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Các bản dựng `imsg` cũ hơn, có trước danh sách khả năng theo từng phương thức, sẽ âm thầm tắt trạng thái đang nhập/đã đọc; OpenClaw ghi lại cảnh báo một lần cho mỗi lần khởi động lại để có thể xác định nguyên nhân thiếu biên nhận.

  </Accordion>

  <Accordion title="Tapback đến">
    OpenClaw đăng ký nhận tapback iMessage và định tuyến các phản ứng được chấp nhận dưới dạng sự kiện hệ thống thay vì văn bản tin nhắn thông thường, vì vậy tapback của người dùng không kích hoạt vòng lặp trả lời thông thường.

    Chế độ thông báo được kiểm soát bởi `channels.imessage.reactionNotifications`:

    - `"own"` (mặc định): chỉ thông báo khi người dùng phản ứng với tin nhắn do bot tạo.
    - `"all"`: thông báo cho tất cả tapback đến từ những người gửi được ủy quyền.
    - `"off"`: bỏ qua tapback đến.

    Các ghi đè theo từng tài khoản sử dụng `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Phản ứng phê duyệt (👍 / 👎)">
    Khi `approvals.exec.enabled` hoặc `approvals.plugin.enabled` là true và yêu cầu được định tuyến đến iMessage, Gateway gửi lời nhắc phê duyệt theo cách gốc và chấp nhận tapback để giải quyết yêu cầu:

    - `👍` (tapback Thích) → `allow-once`
    - `👎` (tapback Không thích) → `deny`
    - `allow-always` vẫn là phương án dự phòng thủ công: gửi `/approve <id> allow-always` dưới dạng câu trả lời thông thường.

    Việc xử lý phản ứng yêu cầu định danh của người dùng phản ứng phải là người phê duyệt tường minh. Danh sách người phê duyệt được đọc từ `channels.imessage.allowFrom` (hoặc `channels.imessage.accounts.<id>.allowFrom`); thêm số điện thoại của người dùng ở định dạng E.164 hoặc email Apple ID của họ (các đích trò chuyện như `chat_id:*` không phải là mục người phê duyệt hợp lệ). Mục ký tự đại diện `"*"` được chấp nhận nhưng cho phép bất kỳ người gửi nào phê duyệt; danh sách người phê duyệt trống sẽ tắt hoàn toàn lối tắt bằng phản ứng. Lối tắt bằng phản ứng chủ ý bỏ qua `reactionNotifications`, `dmPolicy` và `groupAllowFrom` vì danh sách cho phép người phê duyệt tường minh là cổng kiểm soát duy nhất có ý nghĩa đối với việc giải quyết phê duyệt.

    Việc ủy quyền lệnh văn bản `/approve` tuân theo cùng danh sách: khi `channels.imessage.allowFrom` không trống, `/approve <id> <decision>` được ủy quyền dựa trên danh sách người phê duyệt đó (không phải danh sách cho phép tin nhắn trực tiếp rộng hơn), và những người gửi được phép trong danh sách cho phép tin nhắn trực tiếp nhưng không có trong `allowFrom` sẽ nhận được thông báo từ chối rõ ràng. Khi `allowFrom` trống, phương án dự phòng trong cùng cuộc trò chuyện vẫn có hiệu lực và `/approve` ủy quyền cho bất kỳ ai được danh sách cho phép tin nhắn trực tiếp chấp nhận. Thêm mọi người vận hành cần phê duyệt — qua `/approve` hoặc qua phản ứng — vào `allowFrom`.

    Ghi chú dành cho người vận hành:
    - Liên kết phản ứng được lưu cả trong bộ nhớ lẫn kho khóa bền vững của Gateway (TTL khớp với thời điểm phê duyệt hết hạn), đồng thời Gateway cũng thăm dò các lời nhắc đang chờ để tìm tapback, vì vậy một tapback đến ngay sau khi Gateway khởi động lại vẫn xử lý được yêu cầu phê duyệt.
    - Tapback `is_from_me=true` của chính người vận hành (ví dụ từ một thiết bị Apple đã ghép đôi) xử lý yêu cầu phê duyệt khi handle đó là người phê duyệt được chỉ định rõ ràng.
    - Lời nhắc phê duyệt chỉ được định tuyến vào cuộc trò chuyện nhóm khi đã cấu hình người phê duyệt rõ ràng; nếu không, bất kỳ thành viên nào trong nhóm cũng có thể phê duyệt.
    - Tapback kiểu văn bản cũ (`Liked "…"` văn bản thuần từ các ứng dụng Apple rất cũ) không thể xử lý yêu cầu phê duyệt vì chúng không mang GUID của tin nhắn; việc xử lý phản ứng yêu cầu siêu dữ liệu tapback có cấu trúc do các ứng dụng macOS / iOS hiện tại phát ra.

  </Accordion>

  <Accordion title="Phản ứng cho câu hỏi (1️⃣ / 2️⃣ / 3️⃣ / 4️⃣)">
    Đối với lời nhắc `ask_user` có một câu hỏi không bí mật, chỉ chọn một và từ một đến bốn tùy chọn, OpenClaw thêm các lựa chọn emoji được đánh số. Hãy phản ứng với lời nhắc đã gửi bằng số tương ứng để trả lời. Phản ứng phải mang GUID ổn định của tin nhắn do bot soạn; sau đó OpenClaw ánh xạ số đó tới tùy chọn chuẩn thông qua Gateway. Các lần nhấn cũ hoặc trùng lặp sẽ bị bỏ qua.

    Các lời nhắc có nhiều câu hỏi, cho phép chọn nhiều hoặc yêu cầu văn bản tự do vẫn chỉ có thể trả lời bằng văn bản. Phản ứng cho câu hỏi tuân theo các quy tắc tiếp nhận DM/nhóm thông thường của iMessage. Chúng vẫn được nhận diện ngay cả khi `reactionNotifications` chung là `"off"`, mà không biến các phản ứng không liên quan thành sự kiện của agent.

  </Accordion>
</AccordionGroup>

## Ghi cấu hình

Theo mặc định, iMessage cho phép kênh khởi tạo thao tác ghi cấu hình (cho `/config set|unset` khi `commands.config: true`).

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

## Gộp các DM bị tách khi gửi (lệnh + URL trong cùng một lần soạn)

Khi người dùng nhập lệnh cùng với URL — ví dụ `Dump https://example.com/article` — ứng dụng Messages của Apple tách lần gửi thành **hai hàng `chat.db` riêng biệt**:

1. Một tin nhắn văn bản (`"Dump"`).
2. Một bong bóng xem trước URL (`"https://..."`) có các ảnh xem trước OG dưới dạng tệp đính kèm.

Trên hầu hết hệ thống, hai hàng đến OpenClaw cách nhau khoảng 0.8-2.0 giây. Nếu không gộp, agent nhận riêng lệnh ở lượt 1 (và thường trả lời "hãy gửi URL cho tôi") trước khi URL đến ở lượt 2. Đây là pipeline gửi của Apple, không phải do OpenClaw hay `imsg` tạo ra.

`channels.imessage.coalesceSameSenderDms` cho phép một DM tham gia cơ chế đệm các hàng liên tiếp từ cùng người gửi. Khi `imsg` cung cấp dấu hiệu cấu trúc của bản xem trước URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` trên một trong các hàng nguồn, OpenClaw chỉ gộp đúng lần gửi bị tách thực sự đó và giữ mọi hàng được đệm khác thành các lượt riêng biệt. Trên các bản dựng `imsg` cũ hoàn toàn không phát siêu dữ liệu bong bóng, OpenClaw không thể phân biệt lần gửi bị tách với các lần gửi riêng biệt, nên sẽ dự phòng bằng cách gộp nhóm. Cách này duy trì hành vi trước khi có siêu dữ liệu thay vì làm suy giảm các lần gửi bị tách `Dump <url>` thành hai lượt. Các cuộc trò chuyện nhóm tiếp tục gửi đi theo từng tin nhắn để duy trì cấu trúc lượt của nhiều người dùng.

<Tabs>
  <Tab title="Khi nào nên bật">
    Bật khi:

    - Bạn cung cấp Skills yêu cầu `command + payload` trong một tin nhắn (dump, paste, save, queue, v.v.).
    - Người dùng dán URL cùng với lệnh.
    - Bạn có thể chấp nhận độ trễ lượt DM tăng thêm (xem bên dưới).

    Để tắt khi:

    - Bạn cần độ trễ lệnh tối thiểu cho các trình kích hoạt DM gồm một từ.
    - Mọi luồng của bạn đều là lệnh thực hiện một lần, không có payload tiếp nối.

  </Tab>
  <Tab title="Bật">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // chọn tham gia (mặc định: false)
        },
      },
    }
    ```

    Khi cờ được bật và không có `messages.inbound.byChannel.imessage` rõ ràng hoặc `messages.inbound.debounceMs` toàn cục, cửa sổ chống dội được mở rộng thành **7000 ms** (giá trị mặc định cũ là 0 ms — không chống dội). Cần cửa sổ rộng hơn vì nhịp gửi tách bản xem trước URL của Apple có thể kéo dài vài giây trong lúc Messages.app phát hàng xem trước.

    Để tự điều chỉnh cửa sổ:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms bao phủ độ trễ xem trước URL quan sát được của Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Đánh đổi">
    - **Việc gộp chính xác cần siêu dữ liệu payload `imsg` hiện tại.** Khi có `balloon_bundle_id`, chỉ lần gửi bị tách thực sự được gộp; cơ chế gộp dự phòng không có siêu dữ liệu nêu trên là khả năng tương thích ngược tạm thời và sẽ bị loại bỏ sau khi `imsg` gộp các lần gửi bị tách ở thượng nguồn.
    - **Độ trễ tăng thêm cho tin nhắn DM.** Khi cờ được bật, mọi DM (bao gồm lệnh điều khiển độc lập và phần văn bản tiếp nối đơn lẻ) sẽ chờ tối đa hết cửa sổ chống dội trước khi gửi đi, đề phòng một hàng xem trước URL sắp đến. Tin nhắn trò chuyện nhóm vẫn được gửi đi ngay lập tức.
    - **Đầu ra đã gộp có giới hạn.** Văn bản đã gộp được giới hạn ở 4000 ký tự với dấu `…[truncated]` rõ ràng; tệp đính kèm được giới hạn ở 20; mục nguồn được giới hạn ở 10 (khi vượt quá, giữ lại mục đầu tiên và các mục mới nhất). Mọi GUID nguồn đều được theo dõi trong `coalescedMessageGuids` để phục vụ phép đo từ xa ở hạ nguồn.
    - **Chỉ dành cho DM.** Các cuộc trò chuyện nhóm chuyển thẳng sang gửi đi theo từng tin nhắn để bot luôn phản hồi nhanh khi nhiều người đang nhập.
    - **Chọn tham gia, theo từng kênh.** Các kênh khác (Discord, Slack, Telegram, WhatsApp, …) không bị ảnh hưởng. Các cấu hình BlueBubbles cũ đặt `channels.bluebubbles.coalesceSameSenderDms` nên di chuyển giá trị đó sang `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Các tình huống và nội dung agent nhìn thấy

Cột "Bật cờ" thể hiện hành vi trên bản dựng `imsg` có phát `balloon_bundle_id`. Trên các bản dựng `imsg` cũ hoàn toàn không phát siêu dữ liệu bong bóng, các hàng bên dưới được đánh dấu "Hai lượt" / "N lượt" sẽ dự phòng bằng cơ chế gộp cũ (một lượt): OpenClaw không thể phân biệt về mặt cấu trúc giữa lần gửi bị tách và các lần gửi riêng biệt, nên duy trì hành vi gộp trước khi có siêu dữ liệu. Việc phân tách chính xác được kích hoạt sau khi bản dựng phát siêu dữ liệu bong bóng.

| Người dùng soạn                                                      | `chat.db` tạo ra                  | Tắt cờ (mặc định)                      | Bật cờ + cửa sổ (imsg phát siêu dữ liệu bong bóng)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (một lần gửi)                              | 2 hàng cách nhau khoảng 1 giây                   | Hai lượt agent: riêng "Dump", sau đó là URL | Một lượt: văn bản đã gộp `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (tệp đính kèm + văn bản)                | 2 hàng không có siêu dữ liệu bong bóng URL | Hai lượt                               | Hai lượt sau khi quan sát được siêu dữ liệu; một lượt đã gộp trên các phiên cũ/trước chốt không có siêu dữ liệu       |
| `/status` (lệnh độc lập)                                     | 1 hàng                               | Gửi đi ngay lập tức                        | **Chờ tối đa hết cửa sổ, sau đó gửi đi**                                                                |
| Chỉ dán URL                                                   | 1 hàng                               | Gửi đi ngay lập tức                        | Chờ tối đa hết cửa sổ, sau đó gửi đi                                                                    |
| Văn bản + URL được gửi thành hai tin nhắn riêng biệt có chủ ý, cách nhau vài phút | 2 hàng nằm ngoài cửa sổ               | Hai lượt                               | Hai lượt (cửa sổ hết hạn giữa hai tin nhắn)                                                             |
| Luồng gửi dồn dập (>10 DM nhỏ trong cửa sổ)                          | N hàng không có siêu dữ liệu bong bóng URL | N lượt                                 | N lượt sau khi quan sát được siêu dữ liệu; một lượt đã gộp có giới hạn trên các phiên cũ/trước chốt không có siêu dữ liệu |
| Hai người đang nhập trong một cuộc trò chuyện nhóm                                  | N hàng từ M người gửi               | M+ lượt (mỗi nhóm người gửi một lượt)        | M+ lượt — các cuộc trò chuyện nhóm không được gộp                                                            |

## Khôi phục dữ liệu đến sau khi bridge hoặc Gateway khởi động lại

iMessage khôi phục các tin nhắn bị bỏ lỡ trong khi Gateway ngừng hoạt động, đồng thời ngăn chặn "bom dữ liệu tồn đọng" cũ mà Apple có thể xả ra sau khi khôi phục Push. Hành vi mặc định luôn được bật, dựa trên cơ chế tiếp nhận bền vững và hàng rào tuổi.

- **Bảo vệ bền vững khỏi phát lại.** Trước khi nâng con trỏ khôi phục, OpenClaw ghi nhật ký từng hàng thô vào hàng đợi tiếp nhận SQLite dùng chung, sử dụng GUID Apple của hàng đó làm ID sự kiện. Một hàng đã hoàn tất để lại dấu vết xóa trong khoảng 4 giờ, giới hạn ở 10,000 mục, vì vậy lần phát lại có cùng GUID sẽ bị loại bỏ ngay cả sau khi khởi động lại. Một hàng đang chờ vẫn có thể được khôi phục cho đến khi quá trình gửi đi tiếp nhận hàng đó.
- **Khôi phục thời gian ngừng hoạt động.** Khi khởi động, trình giám sát ghi nhớ rowid của hàng `chat.db` được tiếp nhận bền vững gần nhất (một con trỏ bền vững cho mỗi tài khoản) và truyền nó cho `imsg watch.subscribe` dưới dạng `since_rowid`, để imsg phát lại các hàng chưa được ghi nhật ký rồi theo dõi dữ liệu trực tiếp. Các hàng được ghi nhật ký trước khi xảy ra sự cố sẽ tiếp tục từ SQLite. Việc phát lại được giới hạn ở 500 hàng gần nhất và các tin nhắn có tuổi tối đa khoảng 2 giờ; dấu vết xóa GUID sẽ loại bỏ mọi nội dung đã được xử lý.
- **Hàng rào tuổi cho dữ liệu tồn đọng cũ.** Các hàng phía trên ranh giới khởi động thực sự là dữ liệu trực tiếp; hàng có ngày gửi sớm hơn thời điểm đến quá khoảng 15 phút là dữ liệu tồn đọng do Push xả ra và sẽ bị ngăn chặn. Thay vào đó, các hàng được phát lại (tại hoặc bên dưới ranh giới) sử dụng cửa sổ khôi phục rộng hơn, để tin nhắn vừa bị bỏ lỡ được chuyển đến còn lịch sử quá cũ thì không.

Quá trình khôi phục hoạt động trên cả thiết lập `cliPath` cục bộ lẫn từ xa, vì việc phát lại `since_rowid` chạy qua cùng kết nối RPC `imsg`. Điểm khác biệt là cửa sổ: khi Gateway có thể đọc `chat.db` (cục bộ), nó neo ranh giới rowid khởi động, giới hạn khoảng phát lại và chuyển các tin nhắn bị bỏ lỡ có tuổi tối đa vài giờ. Qua `cliPath` SSH từ xa, nó không thể đọc cơ sở dữ liệu, nên việc phát lại không bị giới hạn và mọi hàng đều sử dụng hàng rào tuổi trực tiếp — cơ chế này vẫn khôi phục các tin nhắn vừa bị bỏ lỡ và vẫn ngăn dữ liệu tồn đọng cũ, chỉ với cửa sổ trực tiếp hẹp hơn. Hãy chạy Gateway trên máy Mac chạy Messages để có cửa sổ khôi phục rộng hơn.

### Tín hiệu hiển thị cho người vận hành

Dữ liệu tồn đọng bị ngăn chặn được ghi nhật ký ở cấp độ mặc định, không bao giờ bị loại bỏ âm thầm (cờ `recovery` cho biết cửa sổ nào đã được áp dụng):

```text
imessage: đã ngăn dữ liệu đến tồn đọng cũ account=<id> sent=<iso> recovery=<bool> (<N> mục bị ngăn kể từ khi khởi động)
```

### Di chuyển

`channels.imessage.catchup.*` đã lỗi thời — quá trình khôi phục thời gian ngừng hoạt động diễn ra tự động và không cần cấu hình cho các thiết lập mới. Các cấu hình hiện có với `catchup.enabled: true` vẫn được tôn trọng dưới dạng hồ sơ tương thích cho cửa sổ phát lại khôi phục. Các khối bắt kịp đã tắt (`enabled: false` hoặc không có `enabled: true`) đã bị loại bỏ; `openclaw doctor --fix` xóa chúng.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không tìm thấy imsg hoặc RPC không được hỗ trợ">
    Xác thực tệp nhị phân và khả năng hỗ trợ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Nếu phép thăm dò báo RPC không được hỗ trợ, hãy cập nhật `imsg`. Nếu các thao tác API riêng tư không khả dụng, hãy chạy `imsg launch` trong phiên người dùng macOS đã đăng nhập rồi thăm dò lại. Nếu Gateway không chạy trên macOS, hãy sử dụng thiết lập Mac từ xa qua SSH ở trên thay cho đường dẫn `imsg` cục bộ mặc định.

  </Accordion>

  <Accordion title="Tin nhắn gửi được nhưng iMessage đến không xuất hiện">
    Trước tiên, hãy xác minh xem tin nhắn đã đến máy Mac cục bộ hay chưa. Nếu `chat.db` không thay đổi, OpenClaw không thể nhận tin nhắn ngay cả khi `imsg status --json` báo cầu nối hoạt động bình thường.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Nếu các tin nhắn gửi từ điện thoại không tạo hàng mới, hãy sửa lớp Messages và Apple Push của macOS trước khi thay đổi cấu hình OpenClaw. Thường chỉ cần làm mới dịch vụ một lần:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Gửi một iMessage mới từ điện thoại và xác nhận có hàng `chat.db` hoặc sự kiện `imsg watch` mới trước khi gỡ lỗi các phiên OpenClaw. Không chạy thao tác này dưới dạng vòng lặp khởi chạy lại cầu nối định kỳ; việc lặp lại `imsg launch` cùng với khởi động lại Gateway trong khi đang hoạt động có thể làm gián đoạn quá trình chuyển phát và khiến các lượt chạy kênh đang xử lý bị mắc kẹt.

  </Accordion>

  <Accordion title="Gateway không chạy trên macOS">
    `cliPath: "imsg"` mặc định phải chạy trên máy Mac đã đăng nhập vào Messages. Trên Linux hoặc Windows, hãy đặt `channels.imessage.cliPath` thành một tập lệnh bao bọc kết nối SSH đến máy Mac đó và chạy `imsg "$@"`.

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
    - phê duyệt ghép nối (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua">
    Kiểm tra:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - hành vi danh sách cho phép của `channels.imessage.groups`
    - cấu hình mẫu đề cập (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Tệp đính kèm từ xa gặp lỗi">
    Kiểm tra:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - xác thực bằng khóa SSH/SCP từ máy chủ Gateway
    - khóa máy chủ tồn tại trong `~/.ssh/known_hosts` trên máy chủ Gateway
    - khả năng đọc đường dẫn từ xa trên máy Mac chạy Messages

  </Accordion>

  <Accordion title="Đã bỏ lỡ lời nhắc cấp quyền của macOS">
    Chạy lại trong terminal GUI tương tác trong cùng ngữ cảnh người dùng/phiên và phê duyệt các lời nhắc:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Xác nhận đã cấp quyền Full Disk Access + Automation cho ngữ cảnh tiến trình chạy OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Tham chiếu cấu hình

- [Tham chiếu cấu hình - iMessage](/vi/gateway/config-channels#imessage)
- [Cấu hình Gateway](/vi/gateway/configuration)
- [Ghép nối](/vi/channels/pairing)

## Liên quan

- [Tổng quan về các kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Việc loại bỏ BlueBubbles và đường dẫn iMessage qua imsg](/vi/announcements/bluebubbles-imessage) — thông báo và tóm tắt quá trình di chuyển
- [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) — bảng chuyển đổi cấu hình và quy trình chuyển đổi từng bước
- [Ghép nối](/vi/channels/pairing) — luồng xác thực tin nhắn trực tiếp và ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cơ chế kiểm soát bằng đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
