---
read_when:
    - Thiết lập hỗ trợ iMessage
    - Gỡ lỗi gửi/nhận iMessage
summary: Hỗ trợ iMessage gốc thông qua imsg (JSON-RPC qua stdio), với các thao tác API riêng tư cho trả lời, tapback, hiệu ứng, tệp đính kèm và quản lý nhóm. Được ưu tiên cho các thiết lập OpenClaw iMessage mới khi đáp ứng yêu cầu về máy chủ.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Đối với các triển khai iMessage của OpenClaw, hãy dùng `imsg` trên một máy chủ Messages macOS đã đăng nhập. Nếu Gateway của bạn chạy trên Linux hoặc Windows, trỏ `channels.imessage.cliPath` đến một wrapper SSH chạy `imsg` trên Mac.

**Khôi phục inbound là tự động.** Sau khi bridge hoặc gateway khởi động lại, iMessage phát lại các tin nhắn bị bỏ lỡ khi nó ngừng hoạt động và chặn "backlog bomb" cũ mà Apple có thể xả ra sau một lần khôi phục Push, đồng thời dedupe để không có gì được gửi hai lần. Không có cấu hình nào cần bật — xem [Khôi phục inbound sau khi bridge hoặc gateway khởi động lại](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Hỗ trợ BlueBubbles đã bị gỡ bỏ. Di chuyển các cấu hình `channels.bluebubbles` sang `channels.imessage`; OpenClaw chỉ hỗ trợ iMessage thông qua `imsg`. Bắt đầu với [Việc gỡ bỏ BlueBubbles và đường dẫn iMessage imsg](/vi/announcements/bluebubbles-imessage) để xem thông báo ngắn, hoặc [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) để xem bảng di chuyển đầy đủ.
</Warning>

Trạng thái: tích hợp CLI bên ngoài native. Gateway khởi chạy `imsg rpc` và giao tiếp qua JSON-RPC trên stdio (không có daemon/cổng riêng). Các hành động nâng cao yêu cầu `imsg launch` và một lần thăm dò private API thành công.

<CardGroup cols={3}>
  <Card title="Hành động private API" icon="wand-sparkles" href="#private-api-actions">
    Trả lời, tapback, hiệu ứng, tệp đính kèm và quản lý nhóm.
  </Card>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    DM iMessage mặc định ở chế độ ghép nối.
  </Card>
  <Card title="Mac từ xa" icon="terminal" href="#remote-mac-over-ssh">
    Dùng wrapper SSH khi Gateway không chạy trên Mac Messages.
  </Card>
  <Card title="Tham chiếu cấu hình" icon="settings" href="/vi/gateway/config-channels#imessage">
    Tham chiếu đầy đủ các trường iMessage.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Tabs>
  <Tab title="Mac cục bộ (đường dẫn nhanh)">
    <Steps>
      <Step title="Cài đặt và xác minh imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

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

      <Step title="Phê duyệt ghép nối DM đầu tiên (dmPolicy mặc định)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Yêu cầu ghép nối hết hạn sau 1 giờ.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac từ xa qua SSH">
    OpenClaw chỉ yêu cầu `cliPath` tương thích với stdio, nên bạn có thể trỏ `cliPath` đến một script wrapper SSH tới Mac từ xa và chạy `imsg`.

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

    Nếu `remoteHost` chưa được đặt, OpenClaw cố gắng tự phát hiện bằng cách phân tích script wrapper SSH.
    `remoteHost` phải là `host` hoặc `user@host` (không có khoảng trắng hoặc tùy chọn SSH).
    OpenClaw dùng kiểm tra host-key nghiêm ngặt cho SCP, vì vậy khóa host relay phải đã tồn tại trong `~/.ssh/known_hosts`.
    Đường dẫn tệp đính kèm được xác thực dựa trên các root được phép (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Mọi wrapper `cliPath` hoặc proxy SSH bạn đặt trước `imsg` PHẢI hoạt động như một pipe stdio trong suốt cho JSON-RPC chạy lâu. OpenClaw trao đổi các thông điệp JSON-RPC nhỏ được phân tách bằng dòng mới qua stdin/stdout của wrapper trong suốt vòng đời của kênh:

- Chuyển tiếp từng đoạn/dòng stdin **ngay khi có byte khả dụng** — đừng chờ EOF.
- Chuyển tiếp từng đoạn/dòng stdout kịp thời theo hướng ngược lại.
- Giữ nguyên dòng mới.
- Tránh các lần đọc chặn kích thước cố định (`read(4096)`, `cat | buffer`, `read` mặc định của shell) có thể làm thiếu dữ liệu cho các frame nhỏ.
- Giữ stderr tách khỏi luồng stdout JSON-RPC.

Một wrapper đệm stdin cho đến khi lấp đầy một khối lớn sẽ tạo ra triệu chứng trông giống như sự cố iMessage — `imsg rpc timeout (chats.list)` hoặc kênh khởi động lại lặp lại — dù bản thân `imsg rpc` vẫn khỏe mạnh. `ssh -T host imsg "$@"` (ở trên) an toàn vì nó chuyển tiếp các đối số `cliPath` của OpenClaw như `rpc` và `--db`. Các pipeline như `ssh host imsg | grep -v '^DEBUG'` thì KHÔNG — công cụ đệm theo dòng vẫn có thể giữ frame; dùng `stdbuf -oL -eL` trên mọi stage nếu bạn buộc phải lọc.
</Warning>

  </Tab>
</Tabs>

## Yêu cầu và quyền (macOS)

- Messages phải được đăng nhập trên Mac chạy `imsg`.
- Cần Full Disk Access cho ngữ cảnh tiến trình chạy OpenClaw/`imsg` (truy cập DB Messages).
- Cần quyền Automation để gửi tin nhắn qua Messages.app.
- Với các hành động nâng cao (react / edit / unsend / threaded reply / effects / group ops), System Integrity Protection phải bị tắt — xem [Bật private API của imsg](#enabling-the-imsg-private-api) bên dưới. Gửi/nhận văn bản và media cơ bản hoạt động mà không cần quyền này.

<Tip>
Quyền được cấp theo từng ngữ cảnh tiến trình. Nếu gateway chạy headless (LaunchAgent/SSH), hãy chạy một lệnh tương tác một lần trong cùng ngữ cảnh đó để kích hoạt prompt:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Gửi qua wrapper SSH thất bại với AppleEvents -1743">
  Một thiết lập SSH từ xa có thể đọc chat, vượt qua `channels status --probe` và xử lý tin nhắn inbound trong khi gửi outbound vẫn thất bại với lỗi ủy quyền AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Kiểm tra cơ sở dữ liệu TCC của người dùng Mac đã đăng nhập hoặc System Settings > Privacy & Security > Automation. Nếu mục Automation được ghi cho `/usr/libexec/sshd-keygen-wrapper` thay vì tiến trình `imsg` hoặc shell cục bộ, macOS có thể không hiển thị công tắc Messages có thể dùng được cho client phía máy chủ SSH đó:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Ở trạng thái đó, lặp lại `tccutil reset AppleEvents` hoặc chạy lại `imsg send` qua cùng wrapper SSH có thể tiếp tục thất bại vì ngữ cảnh tiến trình cần Messages Automation là wrapper SSH, không phải một ứng dụng mà UI có thể cấp quyền.

Thay vào đó, hãy dùng một trong các ngữ cảnh tiến trình `imsg` được hỗ trợ:

- Chạy Gateway, hoặc ít nhất bridge `imsg`, trong phiên cục bộ của người dùng Messages đã đăng nhập.
- Khởi động Gateway bằng LaunchAgent cho người dùng đó sau khi cấp Full Disk Access và Automation từ cùng phiên.
- Nếu bạn giữ topology SSH hai người dùng, hãy xác minh rằng một lệnh `imsg send` outbound thật sự thành công qua đúng wrapper trước khi bật kênh. Nếu không thể cấp Automation, hãy cấu hình lại sang thiết lập `imsg` một người dùng thay vì dựa vào wrapper SSH để gửi.

</Accordion>

## Bật private API của imsg

`imsg` có hai chế độ vận hành:

- **Chế độ cơ bản** (mặc định, không cần thay đổi SIP): văn bản và media outbound qua `send`, theo dõi/lịch sử inbound, danh sách chat. Đây là những gì bạn có ngay từ đầu sau một lần `brew install steipete/tap/imsg` mới cùng các quyền macOS tiêu chuẩn ở trên.
- **Chế độ private API**: `imsg` tiêm một dylib trợ giúp vào `Messages.app` để gọi các hàm `IMCore` nội bộ. Đây là phần mở khóa `react`, `edit`, `unsend`, `reply` (theo luồng), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, cùng chỉ báo đang nhập và biên nhận đã đọc.

Để dùng bề mặt hành động nâng cao mà trang kênh này ghi lại, bạn cần chế độ Private API. README của `imsg` nêu rõ yêu cầu:

> Các tính năng nâng cao như `read`, `typing`, `launch`, gửi phong phú dựa trên bridge, sửa đổi tin nhắn và quản lý chat là tùy chọn bật. Chúng yêu cầu tắt SIP và tiêm một dylib trợ giúp vào `Messages.app`. `imsg launch` từ chối tiêm khi SIP được bật.

Kỹ thuật tiêm helper dùng dylib riêng của `imsg` để truy cập private API của Messages. Không có máy chủ bên thứ ba hoặc runtime BlueBubbles trong đường dẫn iMessage của OpenClaw.

<Warning>
**Tắt SIP là một đánh đổi bảo mật thực sự.** SIP là một trong những cơ chế bảo vệ cốt lõi của macOS chống chạy mã hệ thống đã bị sửa đổi; tắt nó trên toàn hệ thống sẽ mở thêm bề mặt tấn công và tác dụng phụ. Đáng chú ý, **tắt SIP trên Mac Apple Silicon cũng vô hiệu hóa khả năng cài đặt và chạy ứng dụng iOS trên Mac của bạn**.

Hãy xem đây là một lựa chọn vận hành có chủ đích, không phải mặc định. Nếu mô hình đe dọa của bạn không thể chấp nhận SIP bị tắt, iMessage được bundle chỉ giới hạn ở chế độ cơ bản — chỉ gửi/nhận văn bản và media, không có phản ứng / chỉnh sửa / thu hồi gửi / hiệu ứng / thao tác nhóm.
</Warning>

### Thiết lập

1. **Cài đặt (hoặc nâng cấp) `imsg`** trên Mac chạy Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Đầu ra `imsg status --json` báo cáo `bridge_version`, `rpc_methods` và `selectors` theo từng phương thức để bạn có thể xem bản build hiện tại hỗ trợ gì trước khi bắt đầu.

2. **Tắt System Integrity Protection, và (trên macOS hiện đại) Library Validation.** Tiêm một dylib trợ giúp không phải của Apple vào `Messages.app` do Apple ký cần tắt SIP **và** nới lỏng library validation. Bước SIP trong Recovery Mode phụ thuộc vào phiên bản macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** tắt Library Validation qua Terminal, khởi động lại vào Recovery Mode, chạy `csrutil disable`, khởi động lại.
   - **macOS 11+ (Big Sur trở lên), Intel:** Recovery Mode (hoặc Internet Recovery), `csrutil disable`, khởi động lại.
   - **macOS 11+, Apple Silicon:** chuỗi khởi động bằng nút nguồn để vào Recovery; trên các phiên bản macOS gần đây, giữ phím **Left Shift** khi bạn nhấp Continue, rồi `csrutil disable`. Thiết lập máy ảo theo một luồng riêng, vì vậy hãy chụp snapshot VM trước.

   **Trên macOS 11 trở lên, chỉ `csrutil disable` thường là chưa đủ.** Apple vẫn thực thi library validation với `Messages.app` như một platform binary, nên helper được ký adhoc bị từ chối (`Library Validation failed: ... platform binary, but mapped file is not`) ngay cả khi SIP đã tắt. Sau khi tắt SIP, cũng tắt library validation và khởi động lại:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), đã xác minh trên 26.5.1:** tắt SIP **cộng với** lệnh `DisableLibraryValidation` ở trên là đủ để tiêm helper trên các bản 26.0 đến 26.5.x. **Không cần boot-args.** Plist là yếu tố quyết định và là bước thường bị thiếu nhất khi tiêm thất bại trên Tahoe:
   - **Có plist:** `imsg launch` tiêm thành công và `imsg status` báo cáo `advanced_features: true`.
   - **Không có plist (ngay cả khi SIP đã tắt):** `imsg launch` thất bại với `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI từ chối helper adhoc khi tải, nên bridge không bao giờ sẵn sàng và launch bị timeout. Timeout đó là triệu chứng mà hầu hết mọi người gặp trên Tahoe, và cách sửa là plist ở trên, không phải biện pháp mạnh hơn.

   Điều này đã được xác nhận bằng kiểm thử trước/sau có kiểm soát trên macOS 26.5.1 (Apple Silicon): với plist, dylib ánh xạ vào `Messages.app` và bridge khởi động; gỡ plist rồi khởi động lại, và `imsg launch` tạo ra lỗi timeout ở trên với dylib không được ánh xạ.

   Nếu việc tiêm `imsg launch` hoặc các `selectors` cụ thể bắt đầu trả về false sau khi nâng cấp macOS, cổng kiểm tra này thường là nguyên nhân. Hãy kiểm tra trạng thái SIP và library-validation của bạn trước khi cho rằng chính bước SIP đã thất bại. Nếu các thiết lập đó đúng mà bridge vẫn không thể tiêm, hãy thu thập `imsg status --json` cùng đầu ra `imsg launch` và báo cáo cho dự án `imsg` thay vì nới lỏng thêm các kiểm soát bảo mật trên toàn hệ thống.

   Làm theo quy trình Recovery-mode của Apple cho máy Mac của bạn để tắt SIP trước khi chạy `imsg launch`.

3. **Tiêm helper.** Khi SIP đã tắt và Messages.app đã đăng nhập:

   ```bash
   imsg launch
   ```

   `imsg launch` sẽ từ chối tiêm khi SIP vẫn bật, nên lệnh này cũng đồng thời xác nhận rằng bước 2 đã có hiệu lực.

4. **Xác minh bridge từ OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Mục iMessage nên báo cáo `works`, và `imsg status --json | jq '.selectors'` nên hiển thị `retractMessagePart: true` cùng bất kỳ selector chỉnh sửa / nhập / đọc nào mà bản dựng macOS của bạn cung cấp. Cổng theo từng phương thức của Plugin OpenClaw trong `actions.ts` chỉ quảng bá các hành động có selector nền tảng là `true`, vì vậy bề mặt hành động bạn thấy trong danh sách công cụ của agent phản ánh những gì bridge thực sự có thể làm trên máy chủ này.

Nếu `openclaw channels status --probe` báo cáo kênh là `works` nhưng các hành động cụ thể ném lỗi "iMessage `<action>` requires the imsg private API bridge" tại thời điểm dispatch, hãy chạy lại `imsg launch` — helper có thể bị rơi ra ngoài (Messages.app khởi động lại, cập nhật OS, v.v.) và trạng thái `available: true` được lưu trong bộ nhớ đệm sẽ tiếp tục quảng bá hành động cho đến khi lần probe tiếp theo làm mới.

### Khi bạn không thể tắt SIP

Nếu trạng thái tắt SIP không phù hợp với mô hình đe dọa của bạn:

- `imsg` sẽ quay về chế độ cơ bản — chỉ văn bản + phương tiện + nhận.
- Plugin OpenClaw vẫn quảng bá gửi văn bản/phương tiện và giám sát inbound; nó chỉ ẩn `react`, `edit`, `unsend`, `reply`, `sendWithEffect`, và các thao tác nhóm khỏi bề mặt hành động (theo cổng năng lực theo từng phương thức).
- Bạn có thể chạy một máy Mac không phải Apple-Silicon riêng biệt (hoặc một máy Mac bot chuyên dụng) với SIP tắt cho workload iMessage, trong khi vẫn bật SIP trên các thiết bị chính của bạn. Xem [Người dùng bot macOS chuyên dụng (danh tính iMessage riêng)](#deployment-patterns) bên dưới.

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` kiểm soát tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    Trường allowlist: `channels.imessage.allowFrom`.

    Các mục allowlist phải nhận diện người gửi: handle hoặc nhóm truy cập người gửi tĩnh (`accessGroup:<name>`). Dùng `channels.imessage.groupAllowFrom` cho các đích chat như `chat_id:*`, `chat_guid:*`, hoặc `chat_identifier:*`; dùng `channels.imessage.groups` cho các khóa registry `chat_id` dạng số.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` kiểm soát xử lý nhóm:

    - `allowlist` (mặc định khi được cấu hình)
    - `open`
    - `disabled`

    Allowlist người gửi nhóm: `channels.imessage.groupAllowFrom`.

    Các mục `groupAllowFrom` cũng có thể tham chiếu nhóm truy cập người gửi tĩnh (`accessGroup:<name>`).

    Fallback runtime: nếu `groupAllowFrom` chưa được đặt, các kiểm tra người gửi nhóm iMessage dùng `allowFrom`; đặt `groupAllowFrom` khi điều kiện chấp nhận DM và nhóm cần khác nhau.
    Ghi chú runtime: nếu `channels.imessage` hoàn toàn thiếu, runtime quay về `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` được đặt).

    <Warning>
    Định tuyến nhóm có **hai** cổng allowlist chạy liên tiếp, và cả hai đều phải đạt:

    1. **Allowlist người gửi / đích chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, hoặc `chat_id`.
    2. **Registry nhóm** (`channels.imessage.groups`) — với `groupPolicy: "allowlist"`, cổng này yêu cầu hoặc một mục wildcard `groups: { "*": { ... } }` (đặt `allowAll = true`), hoặc một mục rõ ràng theo từng `chat_id` dưới `groups`.

    Nếu cổng 2 không có gì, mọi tin nhắn nhóm đều bị loại bỏ. Plugin phát ra hai tín hiệu cấp `warn` ở mức log mặc định:

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

    Nếu các dòng `warn` đó xuất hiện trong log gateway, cổng 2 đang loại bỏ — hãy thêm khối `groups`.
    </Warning>

    Cổng mention cho nhóm:

    - iMessage không có metadata mention gốc
    - phát hiện mention dùng các mẫu regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - khi không có mẫu được cấu hình, không thể thực thi cổng mention

    Các lệnh điều khiển từ người gửi được ủy quyền có thể bỏ qua cổng mention trong nhóm.

    `systemPrompt` theo từng nhóm:

    Mỗi mục dưới `channels.imessage.groups.*` chấp nhận một chuỗi `systemPrompt` tùy chọn. Giá trị này được tiêm vào system prompt của agent trên mọi lượt xử lý tin nhắn trong nhóm đó. Cách phân giải phản chiếu phân giải prompt theo từng nhóm được dùng bởi `channels.whatsapp.groups`:

    1. **System prompt dành riêng cho nhóm** (`groups["<chat_id>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`) thì wildcard bị chặn và không system prompt nào được áp dụng cho nhóm đó.
    2. **System prompt wildcard cho nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn vắng mặt khỏi map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

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
    - Với mặc định `session.dmScope=main`, DM iMessage được gộp vào phiên chính của agent.
    - Phiên nhóm được cô lập (`agent:<agentId>:imessage:group:<chat_id>`).
    - Trả lời được định tuyến trở lại iMessage bằng metadata kênh/đích gốc.

    Hành vi luồng kiểu nhóm:

    Một số luồng iMessage nhiều người tham gia có thể đến với `is_group=false`.
    Nếu `chat_id` đó được cấu hình rõ ràng dưới `channels.imessage.groups`, OpenClaw xử lý nó như lưu lượng nhóm (cổng nhóm + cô lập phiên nhóm).

  </Tab>
</Tabs>

## Ràng buộc hội thoại ACP

Các cuộc chat iMessage kế thừa cũng có thể được ràng buộc với phiên ACP.

Quy trình nhanh cho operator:

- Chạy `/acp spawn codex --bind here` bên trong DM hoặc cuộc chat nhóm được phép.
- Các tin nhắn trong tương lai trong cùng hội thoại iMessage đó định tuyến tới phiên ACP đã spawn.
- `/new` và `/reset` đặt lại cùng phiên ACP đã ràng buộc tại chỗ.
- `/acp close` đóng phiên ACP và xóa ràng buộc.

Các ràng buộc bền vững được cấu hình được hỗ trợ thông qua các mục `bindings[]` cấp cao nhất với `type: "acp"` và `match.channel: "imessage"`.

`match.peer.id` có thể dùng:

- handle DM đã chuẩn hóa như `+15555550123` hoặc `user@example.com`
- `chat_id:<id>` (khuyến nghị cho ràng buộc nhóm ổn định)
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

Xem [ACP Agents](/vi/tools/acp-agents) để biết hành vi ràng buộc ACP dùng chung.

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Dùng một Apple ID và người dùng macOS chuyên dụng để lưu lượng bot được cô lập khỏi hồ sơ Messages cá nhân của bạn.

    Quy trình điển hình:

    1. Tạo/đăng nhập một người dùng macOS chuyên dụng.
    2. Đăng nhập Messages bằng Apple ID của bot trong người dùng đó.
    3. Cài đặt `imsg` trong người dùng đó.
    4. Tạo SSH wrapper để OpenClaw có thể chạy `imsg` trong ngữ cảnh người dùng đó.
    5. Trỏ `channels.imessage.accounts.<id>.cliPath` và `.dbPath` tới hồ sơ người dùng đó.

    Lần chạy đầu tiên có thể yêu cầu phê duyệt GUI (Automation + Full Disk Access) trong phiên người dùng bot đó.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Tô pô phổ biến:

    - gateway chạy trên Linux/VM
    - iMessage + `imsg` chạy trên một máy Mac trong tailnet của bạn
    - `cliPath` wrapper dùng SSH để chạy `imsg`
    - `remoteHost` bật fetch tệp đính kèm qua SCP

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
    Trước tiên hãy đảm bảo host key được tin cậy (ví dụ `ssh bot@mac-mini.tailnet-1234.ts.net`) để `known_hosts` được điền.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage hỗ trợ cấu hình theo từng tài khoản dưới `channels.imessage.accounts`.

    Mỗi tài khoản có thể ghi đè các trường như `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, thiết lập lịch sử, và allowlist gốc tệp đính kèm.

  </Accordion>

  <Accordion title="Direct-message history">
    Đặt `channels.imessage.dmHistoryLimit` để gieo seed cho các phiên tin nhắn trực tiếp mới bằng lịch sử `imsg` đã giải mã gần đây cho hội thoại đó. Dùng `channels.imessage.dms["<sender>"].historyLimit` cho ghi đè theo từng người gửi, bao gồm `0` để tắt lịch sử cho một người gửi.

    Lịch sử DM iMessage được fetch theo nhu cầu từ `imsg`. Để `dmHistoryLimit` chưa đặt sẽ tắt gieo seed lịch sử DM toàn cục, nhưng một `channels.imessage.dms["<sender>"].historyLimit` theo từng người gửi có giá trị dương vẫn bật gieo seed cho người gửi đó.

  </Accordion>
</AccordionGroup>

## Phương tiện, chia nhỏ, và đích gửi

<AccordionGroup>
  <Accordion title="Tệp đính kèm và phương tiện">
    - thu nạp tệp đính kèm đầu vào **tắt theo mặc định** — đặt `channels.imessage.includeAttachments: true` để chuyển tiếp ảnh, ghi âm thoại, video và các tệp đính kèm khác tới agent. Khi tắt, các iMessage chỉ có tệp đính kèm sẽ bị loại bỏ trước khi tới agent và có thể hoàn toàn không tạo dòng nhật ký `Inbound message`.
    - có thể lấy đường dẫn tệp đính kèm từ xa qua SCP khi `remoteHost` được đặt
    - đường dẫn tệp đính kèm phải khớp với các gốc được phép:
      - `channels.imessage.attachmentRoots` (cục bộ)
      - `channels.imessage.remoteAttachmentRoots` (chế độ SCP từ xa)
      - mẫu gốc mặc định: `/Users/*/Library/Messages/Attachments`
    - SCP dùng kiểm tra host-key nghiêm ngặt (`StrictHostKeyChecking=yes`)
    - kích thước phương tiện gửi đi dùng `channels.imessage.mediaMaxMb` (mặc định 16 MB)

  </Accordion>

  <Accordion title="Chia nhỏ nội dung gửi đi">
    - giới hạn đoạn văn bản: `channels.imessage.textChunkLimit` (mặc định 4000)
    - chế độ chia đoạn: `channels.imessage.chunkMode`
      - `length` (mặc định)
      - `newline` (tách ưu tiên đoạn văn)

  </Accordion>

  <Accordion title="Định dạng địa chỉ">
    Đích tường minh được ưu tiên:

    - `chat_id:123` (khuyến nghị để định tuyến ổn định)
    - `chat_guid:...`
    - `chat_identifier:...`

    Cũng hỗ trợ đích theo handle:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Hành động API riêng tư

Khi `imsg launch` đang chạy và `openclaw channels status --probe` báo cáo `privateApi.available: true`, công cụ tin nhắn có thể dùng các hành động gốc của iMessage ngoài việc gửi văn bản thông thường.

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
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Hành động có sẵn">
    - **react**: Thêm/xóa tapback iMessage (`messageId`, `emoji`, `remove`). Các tapback được hỗ trợ ánh xạ tới yêu thích, thích, không thích, cười, nhấn mạnh và câu hỏi.
    - **reply**: Gửi trả lời theo luồng tới một tin nhắn hiện có (`messageId`, `text` hoặc `message`, cộng với `chatGuid`, `chatId`, `chatIdentifier`, hoặc `to`).
    - **sendWithEffect**: Gửi văn bản kèm hiệu ứng iMessage (`text` hoặc `message`, `effect` hoặc `effectId`).
    - **edit**: Chỉnh sửa tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`, `text` hoặc `newText`).
    - **unsend**: Thu hồi tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`).
    - **upload-file**: Gửi phương tiện/tệp (`buffer` dạng base64 hoặc `media`/`path`/`filePath` đã được nạp, `filename`, tùy chọn `asVoice`). Bí danh cũ: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Quản lý cuộc trò chuyện nhóm khi đích hiện tại là một cuộc hội thoại nhóm.

  </Accordion>

  <Accordion title="ID tin nhắn">
    Ngữ cảnh iMessage đầu vào bao gồm cả giá trị `MessageSid` ngắn và GUID tin nhắn đầy đủ khi có sẵn. ID ngắn nằm trong phạm vi bộ nhớ đệm trả lời gần đây dựa trên SQLite và được kiểm tra với cuộc trò chuyện hiện tại trước khi dùng. Nếu ID ngắn đã hết hạn hoặc thuộc về cuộc trò chuyện khác, hãy thử lại bằng `MessageSidFull` đầy đủ.

  </Accordion>

  <Accordion title="Phát hiện năng lực">
    OpenClaw chỉ ẩn các hành động API riêng tư khi trạng thái thăm dò trong bộ nhớ đệm cho biết bridge không khả dụng. Nếu trạng thái chưa xác định, các hành động vẫn hiển thị và việc gửi sẽ thăm dò lười để hành động đầu tiên có thể thành công sau `imsg launch` mà không cần làm mới trạng thái thủ công riêng.

  </Accordion>

  <Accordion title="Biên nhận đã đọc và đang nhập">
    Khi bridge API riêng tư hoạt động, các cuộc trò chuyện đầu vào được chấp nhận sẽ được đánh dấu đã đọc và các cuộc trò chuyện trực tiếp hiển thị bong bóng đang nhập ngay khi lượt được chấp nhận, trong khi agent chuẩn bị ngữ cảnh và tạo phản hồi. Tắt đánh dấu đã đọc bằng:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Các bản dựng `imsg` cũ hơn, có trước danh sách năng lực theo từng phương thức, sẽ âm thầm chặn tính năng đang nhập/đã đọc; OpenClaw ghi nhật ký cảnh báo một lần mỗi lần khởi động lại để có thể quy nguyên nhân việc thiếu biên nhận.

  </Accordion>

  <Accordion title="Tapback đầu vào">
    OpenClaw đăng ký theo dõi tapback iMessage và định tuyến các phản ứng được chấp nhận dưới dạng sự kiện hệ thống thay vì văn bản tin nhắn thông thường, vì vậy tapback của người dùng không kích hoạt vòng lặp trả lời thông thường.

    Chế độ thông báo được điều khiển bởi `channels.imessage.reactionNotifications`:

    - `"own"` (mặc định): chỉ thông báo khi người dùng phản ứng với tin nhắn do bot viết.
    - `"all"`: thông báo cho mọi tapback đầu vào từ người gửi được ủy quyền.
    - `"off"`: bỏ qua tapback đầu vào.

    Ghi đè theo tài khoản dùng `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Phản ứng phê duyệt (👍 / 👎)">
    Khi `approvals.exec.enabled` hoặc `approvals.plugin.enabled` là true và yêu cầu định tuyến tới iMessage, gateway gửi lời nhắc phê duyệt nguyên bản và chấp nhận một tapback để giải quyết:

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` vẫn là phương án dự phòng thủ công: gửi `/approve <id> allow-always` dưới dạng trả lời thông thường.

    Xử lý phản ứng yêu cầu handle của người phản ứng phải là người phê duyệt tường minh. Danh sách người phê duyệt được đọc từ `channels.imessage.allowFrom` (hoặc `channels.imessage.accounts.<id>.allowFrom`); thêm số điện thoại của người dùng theo dạng E.164 hoặc email Apple ID của họ. Mục ký tự đại diện `"*"` được tôn trọng nhưng cho phép bất kỳ người gửi nào phê duyệt. Lối tắt phản ứng cố ý bỏ qua `reactionNotifications`, `dmPolicy` và `groupAllowFrom` vì danh sách cho phép người phê duyệt tường minh là cổng duy nhất quan trọng cho việc giải quyết phê duyệt.

    **Thay đổi hành vi trong bản phát hành này:** Khi `channels.imessage.allowFrom` không rỗng, lệnh văn bản `/approve <id> <decision>` giờ được ủy quyền dựa trên danh sách người phê duyệt đó (không phải danh sách cho phép DM rộng hơn). Người gửi được phép trong danh sách cho phép DM nhưng không có trong `allowFrom` sẽ nhận được từ chối tường minh. Thêm mọi operator cần có thể phê duyệt qua `/approve` (và qua phản ứng) vào `allowFrom` để giữ hành vi trước đó. Khi `allowFrom` rỗng, "same-chat fallback" cũ vẫn có hiệu lực và `/approve` tiếp tục ủy quyền cho bất kỳ ai mà danh sách cho phép DM cho phép.

    Ghi chú cho operator:
    - Liên kết phản ứng được lưu cả trong bộ nhớ (với TTL khớp với thời hạn phê duyệt) và trong kho khóa bền vững của gateway, vì vậy một tapback đến ngay sau khi gateway khởi động lại vẫn giải quyết được phê duyệt.
    - Các tapback liên thiết bị `is_from_me=true` (phản ứng của chính operator trên thiết bị Apple đã ghép đôi) bị cố ý bỏ qua để bot không thể tự phê duyệt.
    - Tapback kiểu văn bản cũ (`Liked "…"` dạng văn bản thuần từ các client Apple rất cũ) không thể giải quyết phê duyệt vì chúng không mang GUID tin nhắn; giải quyết phản ứng yêu cầu metadata tapback có cấu trúc mà các client macOS / iOS hiện tại phát ra.

  </Accordion>
</AccordionGroup>

## Ghi cấu hình

iMessage cho phép ghi cấu hình do kênh khởi xướng theo mặc định (cho `/config set|unset` khi `commands.config: true`).

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

## Hợp nhất DM gửi tách (lệnh + URL trong một lần soạn)

Khi người dùng nhập một lệnh và một URL cùng nhau — ví dụ `Dump https://example.com/article` — ứng dụng Messages của Apple tách lần gửi thành **hai hàng `chat.db` riêng biệt**:

1. Một tin nhắn văn bản (`"Dump"`).
2. Một bong bóng xem trước URL (`"https://..."`) với ảnh xem trước OG dưới dạng tệp đính kèm.

Hai hàng đến OpenClaw cách nhau khoảng 0,8-2,0 giây trên hầu hết thiết lập. Nếu không hợp nhất, agent nhận riêng lệnh ở lượt 1, trả lời (thường là "gửi URL cho tôi"), và chỉ thấy URL ở lượt 2 — lúc đó ngữ cảnh lệnh đã mất. Đây là pipeline gửi của Apple, không phải thứ OpenClaw hay `imsg` đưa vào.

`channels.imessage.coalesceSameSenderDms` chọn cho một DM vào cơ chế đệm các hàng liên tiếp từ cùng người gửi. Khi `imsg` cung cấp dấu hiệu xem trước URL có cấu trúc `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` trên một trong các hàng nguồn, OpenClaw chỉ hợp nhất lần gửi tách thực sự đó và giữ mọi hàng đã đệm khác thành các lượt riêng. Trên các bản dựng `imsg` cũ hơn hoàn toàn không phát ra metadata bong bóng, OpenClaw không thể phân biệt gửi tách với các lần gửi riêng, nên nó quay về hợp nhất bucket. Điều đó giữ hành vi trước metadata thay vì làm thoái lui các lần gửi tách `Dump <url>` thành hai lượt. Cuộc trò chuyện nhóm tiếp tục gửi theo từng tin nhắn để giữ nguyên cấu trúc lượt nhiều người dùng.

<Tabs>
  <Tab title="Khi nào bật">
    Bật khi:

    - Bạn phát hành Skills kỳ vọng `command + payload` trong một tin nhắn (dump, paste, save, queue, v.v.).
    - Người dùng của bạn dán URL cùng với lệnh.
    - Bạn có thể chấp nhận độ trễ lượt DM tăng thêm (xem bên dưới).

    Để tắt khi:

    - Bạn cần độ trễ lệnh tối thiểu cho các trình kích hoạt DM một từ.
    - Tất cả luồng của bạn là lệnh một lần không có phần tiếp nối payload.

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

    Khi cờ bật và không có `messages.inbound.byChannel.imessage` tường minh hoặc `messages.inbound.debounceMs` toàn cục, cửa sổ debounce mở rộng thành **7000 ms** (mặc định cũ là 0 ms — không debounce). Cửa sổ rộng hơn là bắt buộc vì nhịp gửi tách xem trước URL của Apple có thể kéo dài tới vài giây trong khi Messages.app phát ra hàng xem trước.

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
    - **Hợp nhất chính xác cần metadata payload `imsg` hiện tại.** Khi hàng URL bao gồm `balloon_bundle_id`, chỉ lần gửi tách thực sự đó được hợp nhất và các hàng đã đệm khác vẫn tách riêng. Trên các bản dựng `imsg` cũ hơn không cung cấp metadata bong bóng, OpenClaw quay về hợp nhất bucket đã đệm để các lần gửi tách `Dump <url>` không bị thoái lui thành hai lượt (tương thích ngược tạm thời, sẽ bị loại bỏ khi `imsg` hợp nhất gửi tách ở upstream).
    - **Tăng độ trễ cho tin nhắn DM.** Khi cờ bật, mọi DM (bao gồm lệnh điều khiển độc lập và phần tiếp nối một văn bản) chờ tối đa tới cửa sổ debounce trước khi gửi đi, phòng trường hợp một hàng xem trước URL sắp đến. Tin nhắn trong cuộc trò chuyện nhóm vẫn gửi tức thì.
    - **Đầu ra đã hợp nhất có giới hạn.** Văn bản đã hợp nhất giới hạn ở 4000 ký tự với dấu `…[truncated]` tường minh; tệp đính kèm giới hạn ở 20; mục nguồn giới hạn ở 10 (giữ mục đầu tiên-cộng-mới nhất vượt quá mức đó). Mọi GUID nguồn được theo dõi trong `coalescedMessageGuids` cho telemetry hạ nguồn.
    - **Chỉ DM.** Cuộc trò chuyện nhóm chuyển tiếp sang gửi theo từng tin nhắn để bot vẫn phản hồi nhanh khi nhiều người đang nhập.
    - **Chọn bật, theo từng kênh.** Các kênh khác (Telegram, WhatsApp, Slack, …) không bị ảnh hưởng. Cấu hình BlueBubbles cũ đặt `channels.bluebubbles.coalesceSameSenderDms` nên di chuyển giá trị đó sang `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Kịch bản và nội dung agent thấy

Cột "Flag on" hiển thị hành vi trên bản dựng `imsg` phát ra `balloon_bundle_id`. Trên các bản dựng `imsg` cũ hơn không phát ra metadata balloon nào, các hàng bên dưới được đánh dấu "Hai lượt" / "N lượt" sẽ thay vào đó quay về cơ chế hợp nhất legacy (một lượt): OpenClaw không thể phân biệt về mặt cấu trúc giữa một lần gửi bị tách và các lần gửi riêng biệt, nên nó giữ nguyên cơ chế hợp nhất trước metadata. Việc tách chính xác được kích hoạt khi bản dựng phát ra metadata balloon.

| Người dùng soạn                                                     | `chat.db` tạo ra                    | Tắt cờ (mặc định)                         | Bật cờ + cửa sổ (imsg phát ra metadata balloon)                                                               |
| ------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (một lần gửi)                            | 2 hàng cách nhau ~1 giây            | Hai lượt agent: chỉ "Dump", rồi đến URL   | Một lượt: văn bản đã hợp nhất `Dump https://example.com`                                                      |
| `Save this 📎image.jpg caption` (tệp đính kèm + văn bản)            | 2 hàng không có metadata URL balloon | Hai lượt                                  | Hai lượt sau khi quan sát thấy metadata; một lượt đã hợp nhất trên các phiên cũ/trước latch không có metadata |
| `/status` (lệnh độc lập)                                            | 1 hàng                              | Gửi ngay                                  | **Chờ tối đa đến cửa sổ, rồi gửi**                                                                            |
| URL được dán riêng                                                  | 1 hàng                              | Gửi ngay                                  | Chờ tối đa đến cửa sổ, rồi gửi                                                                                |
| Văn bản + URL được gửi thành hai tin nhắn riêng có chủ ý, cách nhau vài phút | 2 hàng ngoài cửa sổ                 | Hai lượt                                  | Hai lượt (cửa sổ hết hạn giữa chúng)                                                                          |
| Dồn nhanh (>10 DM nhỏ trong cửa sổ)                                 | N hàng không có metadata URL balloon | N lượt                                    | N lượt sau khi quan sát thấy metadata; một lượt đã hợp nhất có giới hạn trên các phiên cũ/trước latch không có metadata |
| Hai người đang nhập trong một cuộc trò chuyện nhóm                  | N hàng từ M người gửi               | M+ lượt (mỗi bucket người gửi một lượt)   | M+ lượt — các cuộc trò chuyện nhóm không được gộp lại                                                         |

## Khôi phục đầu vào sau khi bridge hoặc gateway khởi động lại

iMessage khôi phục các tin nhắn bị lỡ trong lúc gateway ngừng hoạt động, đồng thời chặn "quả bom backlog" cũ mà Apple có thể đẩy ra sau một lần khôi phục Push. Hành vi mặc định luôn bật, được xây dựng trên cơ chế khử trùng lặp đầu vào.

- **Khử trùng lặp phát lại.** Mỗi tin nhắn đầu vào đã được điều phối được ghi lại bằng Apple GUID của nó trong trạng thái plugin bền vững (`imessage.inbound-dedupe`), được claim khi nhập và commit sau khi xử lý (được giải phóng khi gặp lỗi tạm thời để có thể thử lại). Bất kỳ thứ gì đã được xử lý sẽ bị bỏ thay vì được điều phối hai lần. Đây là thứ cho phép khôi phục phát lại mạnh tay mà không cần sổ sách theo từng tin nhắn.
- **Khôi phục thời gian ngừng hoạt động.** Khi khởi động, monitor ghi nhớ `chat.db` rowid được điều phối lần cuối (một con trỏ theo tài khoản được lưu bền vững) và truyền nó cho `imsg watch.subscribe` dưới dạng `since_rowid`, nên imsg phát lại các hàng đã đến trong lúc gateway ngừng hoạt động, rồi theo dõi trực tiếp. Việc phát lại bị giới hạn ở các hàng gần đây nhất và các tin nhắn tối đa khoảng 2 giờ tuổi, còn cơ chế khử trùng lặp sẽ bỏ bất kỳ thứ gì đã được xử lý.
- **Hàng rào tuổi backlog cũ.** Các hàng phía trên ranh giới khởi động là thật sự trực tiếp; hàng nào có ngày gửi cũ hơn thời điểm đến hơn khoảng 15 phút là backlog do Push flush và sẽ bị chặn. Các hàng được phát lại (tại hoặc dưới ranh giới) dùng cửa sổ khôi phục rộng hơn, nên một tin nhắn vừa bị lỡ gần đây sẽ được chuyển giao, còn lịch sử quá cũ thì không.

Khôi phục hoạt động trên cả thiết lập `cliPath` cục bộ và từ xa, vì phát lại `since_rowid` chạy qua cùng kết nối RPC `imsg`. Điểm khác biệt là cửa sổ: khi gateway có thể đọc `chat.db` (cục bộ), nó neo ranh giới rowid khởi động, giới hạn khoảng phát lại, và chuyển giao các tin nhắn bị lỡ tối đa khoảng vài giờ tuổi. Qua `cliPath` SSH từ xa, nó không thể đọc cơ sở dữ liệu, nên phát lại không bị giới hạn và mọi hàng dùng hàng rào tuổi trực tiếp — nó vẫn khôi phục các tin nhắn vừa bị lỡ gần đây và vẫn chặn backlog cũ, chỉ với cửa sổ trực tiếp hẹp hơn. Chạy gateway trên máy Mac Messages để có cửa sổ khôi phục rộng hơn.

### Tín hiệu hiển thị cho operator

Backlog bị chặn được ghi log ở mức mặc định, không bao giờ bị bỏ âm thầm (cờ `recovery` cho biết cửa sổ nào được áp dụng):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Di trú

`channels.imessage.catchup.*` đã deprecated — khôi phục thời gian ngừng hoạt động giờ là tự động và không cần cấu hình cho thiết lập mới. Các cấu hình hiện có với `catchup.enabled: true` vẫn được tôn trọng như một hồ sơ tương thích cho cửa sổ phát lại khôi phục. Các khối catchup bị tắt (`enabled: false` hoặc không có `enabled: true`) đã được loại bỏ; `openclaw doctor --fix` sẽ gỡ bỏ chúng.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không tìm thấy imsg hoặc RPC không được hỗ trợ">
    Xác thực binary và hỗ trợ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Nếu probe báo RPC không được hỗ trợ, hãy cập nhật `imsg`. Nếu các hành động API riêng không khả dụng, chạy `imsg launch` trong phiên người dùng macOS đã đăng nhập và probe lại. Nếu Gateway không chạy trên macOS, hãy dùng thiết lập Remote Mac qua SSH ở trên thay vì đường dẫn `imsg` cục bộ mặc định.

  </Accordion>

  <Accordion title="Messages gửi được nhưng iMessages đầu vào không đến">
    Trước tiên chứng minh liệu tin nhắn đã đến máy Mac cục bộ hay chưa. Nếu `chat.db` không thay đổi, OpenClaw không thể nhận tin nhắn ngay cả khi `imsg status --json` báo bridge khỏe mạnh.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Nếu tin nhắn gửi từ điện thoại không tạo hàng mới, hãy sửa lớp macOS Messages và Apple Push trước khi thay đổi cấu hình OpenClaw. Một lần làm mới dịch vụ thường là đủ:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Gửi một iMessage mới từ điện thoại và xác nhận một hàng `chat.db` mới hoặc sự kiện `imsg watch` trước khi debug các phiên OpenClaw. Không chạy thao tác này như một vòng lặp khởi chạy lại bridge định kỳ; việc lặp lại `imsg launch` cộng với khởi động lại gateway trong lúc đang làm việc có thể làm gián đoạn việc chuyển giao và làm kẹt các lượt kênh đang xử lý.

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
    - phê duyệt ghép nối (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua">
    Kiểm tra:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - hành vi danh sách cho phép `channels.imessage.groups`
    - cấu hình mẫu đề cập (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Tệp đính kèm từ xa thất bại">
    Kiểm tra:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - xác thực khóa SSH/SCP từ máy chủ gateway
    - host key tồn tại trong `~/.ssh/known_hosts` trên máy chủ gateway
    - khả năng đọc đường dẫn từ xa trên máy Mac đang chạy Messages

  </Accordion>

  <Accordion title="Đã bỏ lỡ lời nhắc quyền macOS">
    Chạy lại trong terminal GUI tương tác trong cùng ngữ cảnh người dùng/phiên và phê duyệt các lời nhắc:

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
- [Ghép nối](/vi/channels/pairing)

## Liên quan

- [Tổng quan kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Việc gỡ bỏ BlueBubbles và đường dẫn imsg iMessage](/vi/announcements/bluebubbles-imessage) — thông báo và tóm tắt di trú
- [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) — bảng chuyển đổi cấu hình và hướng dẫn chuyển đổi từng bước
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng theo đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
