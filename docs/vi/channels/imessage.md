---
read_when:
    - Thiết lập hỗ trợ iMessage
    - Gỡ lỗi gửi/nhận iMessage
summary: Hỗ trợ iMessage nguyên sinh qua imsg (JSON-RPC qua stdio), với các thao tác API riêng tư cho phản hồi, tapbacks, hiệu ứng, tệp đính kèm và quản lý nhóm. Được ưu tiên cho các thiết lập OpenClaw iMessage mới khi đáp ứng yêu cầu của máy chủ lưu trữ.
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Đối với các triển khai OpenClaw iMessage, hãy dùng `imsg` trên một máy chủ macOS Messages đã đăng nhập. Nếu Gateway của bạn chạy trên Linux hoặc Windows, trỏ `channels.imessage.cliPath` tới một wrapper SSH chạy `imsg` trên máy Mac.

**Bắt kịp sau thời gian Gateway ngừng hoạt động là tùy chọn bật.** Khi được bật (`channels.imessage.catchup.enabled: true`), gateway phát lại các tin nhắn đến đã được ghi vào `chat.db` trong khi gateway ngoại tuyến (sự cố, khởi động lại, máy Mac ngủ) ở lần khởi động tiếp theo. Mặc định bị tắt — xem [Bắt kịp sau thời gian gateway ngừng hoạt động](#catching-up-after-gateway-downtime). Đóng [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Hỗ trợ BlueBubbles đã bị gỡ bỏ. Di chuyển cấu hình `channels.bluebubbles` sang `channels.imessage`; OpenClaw chỉ hỗ trợ iMessage thông qua `imsg`. Bắt đầu với [Việc gỡ bỏ BlueBubbles và đường dẫn imsg iMessage](/vi/announcements/bluebubbles-imessage) để xem thông báo ngắn, hoặc [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) để xem bảng di chuyển đầy đủ.
</Warning>

Trạng thái: tích hợp CLI bên ngoài nguyên bản. Gateway khởi chạy `imsg rpc` và giao tiếp qua JSON-RPC trên stdio (không có daemon/cổng riêng). Các hành động nâng cao yêu cầu `imsg launch` và một lần kiểm tra API riêng thành công.

<CardGroup cols={3}>
  <Card title="Hành động API riêng" icon="wand-sparkles" href="#private-api-actions">
    Trả lời, tapback, hiệu ứng, tệp đính kèm và quản lý nhóm.
  </Card>
  <Card title="Ghép cặp" icon="link" href="/vi/channels/pairing">
    DM iMessage mặc định dùng chế độ ghép cặp.
  </Card>
  <Card title="Máy Mac từ xa" icon="terminal" href="#remote-mac-over-ssh">
    Dùng một wrapper SSH khi Gateway không chạy trên máy Mac Messages.
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

      <Step title="Phê duyệt ghép cặp DM đầu tiên (dmPolicy mặc định)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Yêu cầu ghép cặp hết hạn sau 1 giờ.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Máy Mac từ xa qua SSH">
    OpenClaw chỉ yêu cầu một `cliPath` tương thích với stdio, vì vậy bạn có thể trỏ `cliPath` tới một script wrapper SSH đến máy Mac từ xa và chạy `imsg`.

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

    Nếu `remoteHost` chưa được đặt, OpenClaw cố gắng tự động phát hiện bằng cách phân tích script wrapper SSH.
    `remoteHost` phải là `host` hoặc `user@host` (không có khoảng trắng hoặc tùy chọn SSH).
    OpenClaw dùng kiểm tra host-key nghiêm ngặt cho SCP, vì vậy khóa máy chủ chuyển tiếp phải đã tồn tại trong `~/.ssh/known_hosts`.
    Đường dẫn tệp đính kèm được xác thực theo các gốc được phép (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Yêu cầu và quyền (macOS)

- Messages phải được đăng nhập trên máy Mac chạy `imsg`.
- Cần Full Disk Access cho ngữ cảnh tiến trình chạy OpenClaw/`imsg` (truy cập DB Messages).
- Cần quyền Automation để gửi tin nhắn qua Messages.app.
- Đối với các hành động nâng cao (react / edit / unsend / threaded reply / effects / group ops), System Integrity Protection phải bị tắt — xem [Bật API riêng của imsg](#enabling-the-imsg-private-api) bên dưới. Gửi/nhận văn bản và phương tiện cơ bản hoạt động mà không cần tắt.

<Tip>
Quyền được cấp theo từng ngữ cảnh tiến trình. Nếu gateway chạy không giao diện (LaunchAgent/SSH), hãy chạy một lệnh tương tác một lần trong cùng ngữ cảnh đó để kích hoạt lời nhắc:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Bật API riêng của imsg

`imsg` có hai chế độ vận hành:

- **Chế độ cơ bản** (mặc định, không cần thay đổi SIP): văn bản và phương tiện đi qua `send`, theo dõi/lịch sử đến, danh sách chat. Đây là những gì bạn có ngay từ đầu sau một lần `brew install steipete/tap/imsg` mới cùng các quyền macOS tiêu chuẩn ở trên.
- **Chế độ API riêng**: `imsg` tiêm một dylib trợ giúp vào `Messages.app` để gọi các hàm `IMCore` nội bộ. Chế độ này mở khóa `react`, `edit`, `unsend`, `reply` (theo luồng), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, cùng chỉ báo đang nhập và biên nhận đã đọc.

Để truy cập bề mặt hành động nâng cao mà trang kênh này ghi lại, bạn cần chế độ API riêng. README của `imsg` nêu rõ yêu cầu:

> Các tính năng nâng cao như `read`, `typing`, `launch`, gửi phong phú được hỗ trợ bởi cầu nối, thay đổi tin nhắn và quản lý chat là tùy chọn bật. Chúng yêu cầu SIP bị tắt và một dylib trợ giúp được tiêm vào `Messages.app`. `imsg launch` từ chối tiêm khi SIP đang bật.

Kỹ thuật tiêm trợ giúp dùng dylib riêng của `imsg` để truy cập API riêng của Messages. Không có máy chủ bên thứ ba hoặc runtime BlueBubbles trong đường dẫn OpenClaw iMessage.

<Warning>
**Tắt SIP là một đánh đổi bảo mật thực sự.** SIP là một trong những lớp bảo vệ cốt lõi của macOS chống lại việc chạy mã hệ thống đã bị sửa đổi; tắt nó trên toàn hệ thống sẽ mở thêm bề mặt tấn công và tác dụng phụ. Đáng chú ý, **tắt SIP trên máy Mac Apple Silicon cũng tắt khả năng cài đặt và chạy ứng dụng iOS trên máy Mac của bạn**.

Hãy xem đây là một lựa chọn vận hành có chủ ý, không phải mặc định. Nếu mô hình đe dọa của bạn không thể chấp nhận SIP bị tắt, iMessage đi kèm chỉ giới hạn ở chế độ cơ bản — chỉ gửi/nhận văn bản và phương tiện, không có reactions / edit / unsend / effects / group ops.
</Warning>

### Thiết lập

1. **Cài đặt (hoặc nâng cấp) `imsg`** trên máy Mac chạy Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Đầu ra `imsg status --json` báo cáo `bridge_version`, `rpc_methods` và `selectors` theo từng phương thức để bạn có thể xem bản dựng hiện tại hỗ trợ những gì trước khi bắt đầu.

2. **Tắt System Integrity Protection.** Việc này phụ thuộc vào phiên bản macOS vì yêu cầu nền tảng của Apple phụ thuộc vào hệ điều hành và phần cứng:
   - **macOS 10.13–10.15 (Sierra–Catalina):** tắt Library Validation qua Terminal, khởi động lại vào Recovery Mode, chạy `csrutil disable`, khởi động lại.
   - **macOS 11+ (Big Sur trở lên), Intel:** Recovery Mode (hoặc Internet Recovery), `csrutil disable`, khởi động lại.
   - **macOS 11+, Apple Silicon:** trình tự khởi động bằng nút nguồn để vào Recovery; trên các phiên bản macOS gần đây, giữ phím **Left Shift** khi bạn nhấp Continue, rồi chạy `csrutil disable`. Thiết lập máy ảo dùng một luồng riêng — hãy chụp snapshot VM trước.
   - **macOS 26 / Tahoe:** các chính sách library-validation và kiểm tra quyền riêng `imagent` đã siết chặt hơn nữa; `imsg` có thể cần một bản dựng cập nhật để theo kịp. Nếu việc tiêm `imsg launch` hoặc các `selectors` cụ thể bắt đầu trả về false sau một lần nâng cấp lớn macOS, hãy kiểm tra ghi chú phát hành của `imsg` trước khi giả định bước SIP đã thành công.

   Làm theo luồng Recovery-mode của Apple cho máy Mac của bạn để tắt SIP trước khi chạy `imsg launch`.

3. **Tiêm trình trợ giúp.** Khi SIP đã bị tắt và Messages.app đã đăng nhập:

   ```bash
   imsg launch
   ```

   `imsg launch` từ chối tiêm khi SIP vẫn đang bật, nên thao tác này cũng đồng thời xác nhận rằng bước 2 đã có hiệu lực.

4. **Xác minh cầu nối từ OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Mục iMessage nên báo cáo `works`, và `imsg status --json | jq '.selectors'` nên hiển thị `retractMessagePart: true` cùng bất kỳ selector edit / typing / read nào mà bản dựng macOS của bạn cung cấp. Cơ chế kiểm soát theo từng phương thức của Plugin OpenClaw trong `actions.ts` chỉ quảng bá các hành động có selector nền tảng là `true`, nên bề mặt hành động bạn thấy trong danh sách công cụ của tác tử phản ánh những gì cầu nối thực sự có thể làm trên máy chủ này.

Nếu `openclaw channels status --probe` báo cáo kênh là `works` nhưng các hành động cụ thể ném lỗi "iMessage `<action>` requires the imsg private API bridge" tại thời điểm dispatch, hãy chạy lại `imsg launch` — trình trợ giúp có thể bị rơi khỏi trạng thái hoạt động (Messages.app khởi động lại, cập nhật OS, v.v.) và trạng thái `available: true` đã lưu cache sẽ tiếp tục quảng bá hành động cho đến khi lần probe tiếp theo làm mới.

### Khi bạn không thể tắt SIP

Nếu trạng thái SIP bị tắt không phù hợp với mô hình đe dọa của bạn:

- `imsg` quay về chế độ cơ bản — chỉ văn bản + phương tiện + nhận.
- Plugin OpenClaw vẫn quảng bá gửi văn bản/phương tiện và giám sát tin nhắn đến; nó chỉ ẩn `react`, `edit`, `unsend`, `reply`, `sendWithEffect` và thao tác nhóm khỏi bề mặt hành động (theo cổng năng lực theo từng phương thức).
- Bạn có thể chạy một máy Mac không phải Apple Silicon riêng (hoặc một máy Mac bot chuyên dụng) với SIP tắt cho khối lượng công việc iMessage, trong khi vẫn bật SIP trên các thiết bị chính. Xem [Người dùng macOS bot chuyên dụng (danh tính iMessage riêng)](#deployment-patterns) bên dưới.

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="Chính sách DM">
    `channels.imessage.dmPolicy` kiểm soát tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    Trường allowlist: `channels.imessage.allowFrom`.

    Mục allowlist có thể là handle, nhóm truy cập người gửi tĩnh (`accessGroup:<name>`), hoặc mục tiêu chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Chính sách nhóm + lượt nhắc">
    `channels.imessage.groupPolicy` kiểm soát xử lý nhóm:

    - `allowlist` (mặc định khi được cấu hình)
    - `open`
    - `disabled`

    Allowlist người gửi nhóm: `channels.imessage.groupAllowFrom`.

    Các mục `groupAllowFrom` cũng có thể tham chiếu nhóm truy cập người gửi tĩnh (`accessGroup:<name>`).

    Dự phòng runtime: nếu `groupAllowFrom` chưa được đặt, kiểm tra người gửi nhóm iMessage sẽ quay về `allowFrom` khi có sẵn.
    Ghi chú runtime: nếu `channels.imessage` hoàn toàn bị thiếu, runtime quay về `groupPolicy="allowlist"` và ghi một cảnh báo (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

    <Warning>
    Định tuyến nhóm có **hai** cổng allowlist chạy nối tiếp nhau, và cả hai đều phải đạt:

    1. **Allowlist người gửi / mục tiêu chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, hoặc `chat_id`.
    2. **Sổ đăng ký nhóm** (`channels.imessage.groups`) — với `groupPolicy: "allowlist"`, cổng này yêu cầu hoặc một mục ký tự đại diện `groups: { "*": { ... } }` (đặt `allowAll = true`), hoặc một mục rõ ràng theo từng `chat_id` dưới `groups`.

    Nếu cổng 2 không có gì, mọi tin nhắn nhóm đều bị loại bỏ. Plugin phát ra hai tín hiệu cấp `warn` ở mức log mặc định:

    - một lần cho mỗi tài khoản khi khởi động: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - một lần cho mỗi `chat_id` khi chạy: `imessage: dropping group message from chat_id=<id> ...`

    DM tiếp tục hoạt động vì chúng đi theo một đường dẫn mã khác.

    Cấu hình tối thiểu để giữ cho nhóm tiếp tục hoạt động dưới `groupPolicy: "allowlist"`:

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

    Nếu các dòng `warn` đó xuất hiện trong nhật ký gateway, cổng 2 đang bị loại bỏ — hãy thêm khối `groups`.
    </Warning>

    Kiểm soát theo lượt nhắc cho nhóm:

    - iMessage không có siêu dữ liệu lượt nhắc gốc
    - phát hiện lượt nhắc dùng các mẫu regex (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - khi không có mẫu nào được cấu hình, không thể thực thi kiểm soát theo lượt nhắc

    Các lệnh điều khiển từ người gửi được ủy quyền có thể bỏ qua kiểm soát theo lượt nhắc trong nhóm.

    `systemPrompt` theo từng nhóm:

    Mỗi mục dưới `channels.imessage.groups.*` chấp nhận một chuỗi `systemPrompt` tùy chọn. Giá trị này được chèn vào system prompt của agent ở mọi lượt xử lý tin nhắn trong nhóm đó. Cách phân giải phản ánh cách phân giải prompt theo từng nhóm được dùng bởi `channels.whatsapp.groups`:

    1. **System prompt riêng của nhóm** (`groups["<chat_id>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`) thì wildcard bị chặn và không có system prompt nào được áp dụng cho nhóm đó.
    2. **System prompt wildcard của nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn không có trong map, hoặc khi mục đó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

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
    - Trả lời được định tuyến trở lại iMessage bằng siêu dữ liệu kênh/đích gốc.

    Hành vi luồng giống nhóm:

    Một số luồng iMessage có nhiều người tham gia có thể đến với `is_group=false`.
    Nếu `chat_id` đó được cấu hình rõ ràng dưới `channels.imessage.groups`, OpenClaw sẽ xem nó là lưu lượng nhóm (kiểm soát nhóm + cô lập phiên nhóm).

  </Tab>
</Tabs>

## Liên kết cuộc trò chuyện ACP

Các cuộc trò chuyện iMessage cũ cũng có thể được liên kết với phiên ACP.

Luồng thao tác nhanh:

- Chạy `/acp spawn codex --bind here` bên trong DM hoặc cuộc trò chuyện nhóm được cho phép.
- Các tin nhắn sau này trong cùng cuộc trò chuyện iMessage đó sẽ được định tuyến đến phiên ACP đã tạo.
- `/new` và `/reset` đặt lại cùng phiên ACP đã liên kết tại chỗ.
- `/acp close` đóng phiên ACP và xóa liên kết.

Liên kết bền vững được cấu hình được hỗ trợ qua các mục `bindings[]` cấp cao nhất với `type: "acp"` và `match.channel: "imessage"`.

`match.peer.id` có thể dùng:

- định danh DM đã chuẩn hóa như `+15555550123` hoặc `user@example.com`
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

## Mô hình triển khai

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Dùng một Apple ID và người dùng macOS riêng để lưu lượng bot được cô lập khỏi hồ sơ Messages cá nhân của bạn.

    Luồng điển hình:

    1. Tạo/đăng nhập một người dùng macOS riêng.
    2. Đăng nhập vào Messages bằng Apple ID của bot trong người dùng đó.
    3. Cài đặt `imsg` trong người dùng đó.
    4. Tạo wrapper SSH để OpenClaw có thể chạy `imsg` trong ngữ cảnh người dùng đó.
    5. Trỏ `channels.imessage.accounts.<id>.cliPath` và `.dbPath` đến hồ sơ người dùng đó.

    Lần chạy đầu có thể cần phê duyệt GUI (Automation + Full Disk Access) trong phiên người dùng bot đó.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Cấu trúc liên kết phổ biến:

    - gateway chạy trên Linux/VM
    - iMessage + `imsg` chạy trên một Mac trong tailnet của bạn
    - wrapper `cliPath` dùng SSH để chạy `imsg`
    - `remoteHost` bật việc lấy tệp đính kèm qua SCP

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

    Dùng khóa SSH để cả SSH và SCP đều không cần tương tác.
    Đảm bảo khóa máy chủ đã được tin cậy trước (ví dụ `ssh bot@mac-mini.tailnet-1234.ts.net`) để `known_hosts` được điền.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage hỗ trợ cấu hình theo từng tài khoản dưới `channels.imessage.accounts`.

    Mỗi tài khoản có thể ghi đè các trường như `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, thiết lập lịch sử và danh sách gốc tệp đính kèm được cho phép.

  </Accordion>
</AccordionGroup>

## Phương tiện, chia đoạn và đích gửi

<AccordionGroup>
  <Accordion title="Attachments and media">
    - nạp tệp đính kèm đến **tắt theo mặc định** — đặt `channels.imessage.includeAttachments: true` để chuyển tiếp ảnh, ghi âm thoại, video và các tệp đính kèm khác đến agent. Khi mục này bị tắt, iMessage chỉ có tệp đính kèm sẽ bị loại bỏ trước khi đến agent và có thể hoàn toàn không tạo dòng nhật ký `Inbound message`.
    - đường dẫn tệp đính kèm từ xa có thể được lấy qua SCP khi `remoteHost` được đặt
    - đường dẫn tệp đính kèm phải khớp với các gốc được cho phép:
      - `channels.imessage.attachmentRoots` (cục bộ)
      - `channels.imessage.remoteAttachmentRoots` (chế độ SCP từ xa)
      - mẫu gốc mặc định: `/Users/*/Library/Messages/Attachments`
    - SCP dùng kiểm tra khóa máy chủ nghiêm ngặt (`StrictHostKeyChecking=yes`)
    - kích thước phương tiện gửi đi dùng `channels.imessage.mediaMaxMb` (mặc định 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - giới hạn đoạn văn bản: `channels.imessage.textChunkLimit` (mặc định 4000)
    - chế độ chia đoạn: `channels.imessage.chunkMode`
      - `length` (mặc định)
      - `newline` (tách ưu tiên theo đoạn văn)

  </Accordion>

  <Accordion title="Addressing formats">
    Đích rõ ràng được ưu tiên:

    - `chat_id:123` (khuyến nghị để định tuyến ổn định)
    - `chat_guid:...`
    - `chat_identifier:...`

    Đích theo định danh cũng được hỗ trợ:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Hành động API riêng tư

Khi `imsg launch` đang chạy và `openclaw channels status --probe` báo cáo `privateApi.available: true`, công cụ tin nhắn có thể dùng các hành động gốc của iMessage ngoài gửi văn bản thông thường.

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
  <Accordion title="Available actions">
    - **react**: Thêm/xóa tapback iMessage (`messageId`, `emoji`, `remove`). Các tapback được hỗ trợ ánh xạ đến yêu thích, thích, không thích, cười, nhấn mạnh và câu hỏi.
    - **reply**: Gửi trả lời theo luồng cho một tin nhắn hiện có (`messageId`, `text` hoặc `message`, cộng với `chatGuid`, `chatId`, `chatIdentifier`, hoặc `to`).
    - **sendWithEffect**: Gửi văn bản với hiệu ứng iMessage (`text` hoặc `message`, `effect` hoặc `effectId`).
    - **edit**: Chỉnh sửa một tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`, `text` hoặc `newText`).
    - **unsend**: Thu hồi một tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`).
    - **upload-file**: Gửi phương tiện/tệp (`buffer` ở dạng base64 hoặc `media`/`path`/`filePath` đã được hydrate, `filename`, tùy chọn `asVoice`). Bí danh cũ: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Quản lý cuộc trò chuyện nhóm khi đích hiện tại là một cuộc trò chuyện nhóm.

  </Accordion>

  <Accordion title="Message IDs">
    Ngữ cảnh iMessage đến bao gồm cả giá trị `MessageSid` ngắn và GUID tin nhắn đầy đủ khi có. ID ngắn nằm trong phạm vi cache trả lời gần đây trong bộ nhớ và được kiểm tra theo cuộc trò chuyện hiện tại trước khi dùng. Nếu ID ngắn đã hết hạn hoặc thuộc về cuộc trò chuyện khác, hãy thử lại với `MessageSidFull` đầy đủ.

  </Accordion>

  <Accordion title="Capability detection">
    OpenClaw chỉ ẩn các hành động API riêng tư khi trạng thái probe trong cache cho biết cầu nối không khả dụng. Nếu trạng thái chưa rõ, các hành động vẫn hiển thị và việc điều phối sẽ probe lười để hành động đầu tiên có thể thành công sau `imsg launch` mà không cần làm mới trạng thái thủ công riêng.

  </Accordion>

  <Accordion title="Read receipts and typing">
    Khi cầu nối API riêng tư hoạt động, các cuộc trò chuyện đến được chấp nhận sẽ được đánh dấu là đã đọc trước khi điều phối và bong bóng đang nhập được hiển thị cho người gửi trong khi agent tạo phản hồi. Tắt đánh dấu đã đọc bằng:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Các bản dựng `imsg` cũ hơn, có trước danh sách năng lực theo từng phương thức, sẽ âm thầm chặn nhập/đã đọc; OpenClaw ghi một cảnh báo một lần cho mỗi lần khởi động lại để có thể quy nguyên nhân biên nhận bị thiếu.

  </Accordion>

  <Accordion title="Inbound tapbacks">
    OpenClaw đăng ký các tapback iMessage và định tuyến phản ứng được chấp nhận dưới dạng sự kiện hệ thống thay vì văn bản tin nhắn thông thường, vì vậy tapback của người dùng không kích hoạt vòng lặp trả lời thông thường.

    Chế độ thông báo được điều khiển bởi `channels.imessage.reactionNotifications`:

    - `"own"` (mặc định): chỉ thông báo khi người dùng phản ứng với tin nhắn do bot soạn.
    - `"all"`: thông báo cho tất cả tapback đến từ người gửi được ủy quyền.
    - `"off"`: bỏ qua tapback đến.

    Ghi đè theo từng tài khoản dùng `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>
</AccordionGroup>

## Ghi cấu hình

iMessage cho phép ghi cấu hình do kênh khởi tạo theo mặc định (cho `/config set|unset` khi `commands.config: true`).

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

Hai hàng đến OpenClaw cách nhau khoảng 0.8-2.0 giây trên hầu hết thiết lập. Nếu không gộp, agent nhận riêng lệnh ở lượt 1, trả lời (thường là "hãy gửi URL cho tôi"), và chỉ thấy URL ở lượt 2 — lúc đó ngữ cảnh lệnh đã bị mất. Đây là pipeline gửi của Apple, không phải thứ mà OpenClaw hay `imsg` thêm vào.

`channels.imessage.coalesceSameSenderDms` cho phép một DM gộp các hàng liên tiếp từ cùng người gửi thành một lượt tác nhân duy nhất. Trò chuyện nhóm vẫn tiếp tục phân phối theo từng tin nhắn để giữ nguyên cấu trúc lượt nhiều người dùng.

<Tabs>
  <Tab title="Khi nào bật">
    Bật khi:

    - Bạn cung cấp Skills kỳ vọng `command + payload` trong một tin nhắn (dump, paste, save, queue, v.v.).
    - Người dùng của bạn dán URL, hình ảnh hoặc nội dung dài cùng với lệnh.
    - Bạn có thể chấp nhận độ trễ lượt DM tăng thêm (xem bên dưới).

    Để tắt khi:

    - Bạn cần độ trễ lệnh tối thiểu cho các kích hoạt DM một từ.
    - Tất cả luồng của bạn là lệnh dùng một lần, không có payload theo sau.

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

    Khi bật cờ này và không có `messages.inbound.byChannel.imessage` rõ ràng, cửa sổ debounce mở rộng thành **2500 ms** (mặc định cũ là 0 ms — không debounce). Cửa sổ rộng hơn là bắt buộc vì nhịp gửi tách của Apple trong khoảng 0,8-2,0 giây không phù hợp với mặc định chặt hơn.

    Để tự tinh chỉnh cửa sổ:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Đánh đổi">
    - **Độ trễ tăng thêm cho tin nhắn DM.** Khi bật cờ này, mọi DM (bao gồm lệnh điều khiển độc lập và phản hồi tiếp theo chỉ có văn bản) sẽ đợi tối đa bằng cửa sổ debounce trước khi phân phối, phòng trường hợp một hàng payload sắp đến. Tin nhắn trò chuyện nhóm vẫn được phân phối tức thì.
    - **Đầu ra đã gộp có giới hạn.** Văn bản đã gộp bị giới hạn ở 4000 ký tự với dấu `…[truncated]` rõ ràng; tệp đính kèm giới hạn ở 20; mục nguồn giới hạn ở 10 (giữ mục đầu tiên cộng với các mục mới nhất sau giới hạn đó). Mọi GUID nguồn được theo dõi trong `coalescedMessageGuids` cho telemetry phía sau.
    - **Chỉ DM.** Trò chuyện nhóm đi qua luồng phân phối theo từng tin nhắn để bot vẫn phản hồi nhanh khi nhiều người đang nhập.
    - **Bật theo lựa chọn, theo từng kênh.** Các kênh khác (Telegram, WhatsApp, Slack, …) không bị ảnh hưởng. Cấu hình BlueBubbles cũ đặt `channels.bluebubbles.coalesceSameSenderDms` nên di chuyển giá trị đó sang `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Kịch bản và nội dung tác nhân thấy

| Người dùng soạn                                                     | `chat.db` tạo ra      | Cờ tắt (mặc định)                       | Cờ bật + cửa sổ 2500 ms                                                 |
| ------------------------------------------------------------------- | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (một lần gửi)                            | 2 hàng cách nhau ~1 s | Hai lượt tác nhân: chỉ "Dump", rồi URL  | Một lượt: văn bản đã gộp `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (tệp đính kèm + văn bản)            | 2 hàng                | Hai lượt (tệp đính kèm bị bỏ khi gộp)   | Một lượt: giữ nguyên văn bản + hình ảnh                                 |
| `/status` (lệnh độc lập)                                            | 1 hàng                | Phân phối tức thì                       | **Đợi tối đa bằng cửa sổ, rồi phân phối**                               |
| Chỉ dán URL                                                         | 1 hàng                | Phân phối tức thì                       | Phân phối tức thì (chỉ một mục trong bucket)                            |
| Văn bản + URL được gửi thành hai tin nhắn riêng có chủ ý, cách nhau vài phút | 2 hàng ngoài cửa sổ   | Hai lượt                                | Hai lượt (cửa sổ hết hạn giữa chúng)                                    |
| Gửi dồn dập nhanh (>10 DM nhỏ trong cửa sổ)                         | N hàng                | N lượt                                  | Một lượt, đầu ra có giới hạn (áp dụng giới hạn đầu + mới nhất, văn bản/tệp đính kèm) |
| Hai người đang nhập trong một trò chuyện nhóm                       | N hàng từ M người gửi | M+ lượt (mỗi bucket người gửi một lượt) | M+ lượt — trò chuyện nhóm không được gộp                                |

## Bắt kịp sau thời gian Gateway ngừng hoạt động

Khi Gateway ngoại tuyến (sự cố, khởi động lại, Mac ngủ, máy tắt), `imsg watch` tiếp tục từ trạng thái `chat.db` hiện tại sau khi Gateway hoạt động trở lại — theo mặc định, mọi thứ đến trong khoảng gián đoạn sẽ không bao giờ được thấy. Catchup phát lại các tin nhắn đó trong lần khởi động tiếp theo để tác nhân không âm thầm bỏ lỡ lưu lượng đến.

Catchup **bị tắt theo mặc định**. Bật theo từng kênh:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### Cách hoạt động

Một lượt chạy cho mỗi lần khởi động `monitorIMessageProvider`, được sắp xếp theo thứ tự `imsg launch` sẵn sàng → `watch.subscribe` → `performIMessageCatchup` → vòng lặp phân phối trực tiếp. Bản thân Catchup dùng `chats.list` + `messages.history` theo từng cuộc trò chuyện qua cùng ứng dụng khách JSON-RPC mà `imsg watch` dùng. Mọi thứ đến trong lượt catchup sẽ đi qua phân phối trực tiếp như bình thường; bộ nhớ đệm chống trùng lặp inbound hiện có hấp thụ mọi phần chồng lấn với các hàng được phát lại.

Mỗi hàng được phát lại được đưa qua đường dẫn phân phối trực tiếp (`evaluateIMessageInbound` + `dispatchInboundMessage`), vì vậy allowlist, chính sách nhóm, debouncer, bộ nhớ đệm echo và biên nhận đã đọc hoạt động giống hệt nhau với tin nhắn phát lại và tin nhắn trực tiếp.

### Ngữ nghĩa con trỏ và thử lại

Catchup giữ một con trỏ theo từng tài khoản tại `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (thư mục trạng thái OpenClaw mặc định là `~/.openclaw`, có thể ghi đè bằng `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Con trỏ tiến lên sau mỗi lần phân phối thành công và được giữ nguyên khi phân phối một hàng ném lỗi — lần khởi động tiếp theo thử lại cùng hàng đó từ con trỏ đã giữ.
- Sau `maxFailureRetries` lần ném lỗi liên tiếp với cùng `guid`, catchup ghi nhật ký `warn` và buộc con trỏ tiến qua tin nhắn bị kẹt để các lần khởi động sau có thể tiếp tục.
- Các guid đã bị bỏ cuộc trước đó sẽ bị bỏ qua ngay khi thấy (không cố phân phối) trong các lần chạy sau và được tính trong `skippedGivenUp` ở tóm tắt lượt chạy.

### Tín hiệu hiển thị cho người vận hành

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Một dòng `WARN ... capped to perRunLimit` nghĩa là một lần khởi động chưa xử lý hết toàn bộ tồn đọng. Tăng `perRunLimit` (tối đa 500) nếu các khoảng gián đoạn của bạn thường xuyên vượt quá lượt mặc định 50 hàng.

### Khi nào nên để tắt

- Gateway chạy liên tục với watchdog tự động khởi động lại và khoảng gián đoạn luôn < vài giây — mặc định tắt là ổn.
- Lưu lượng DM thấp và tin nhắn bị bỏ lỡ sẽ không thay đổi hành vi tác nhân — cửa sổ ban đầu `firstRunLookbackMinutes` có thể phân phối ngữ cảnh cũ bất ngờ trong lần bật đầu tiên.

Khi bạn bật catchup, lần khởi động đầu tiên chưa có con trỏ chỉ nhìn lại `firstRunLookbackMinutes` (mặc định 30 phút), không phải toàn bộ cửa sổ `maxAgeMinutes` — điều này tránh phát lại lịch sử dài các tin nhắn trước khi bật.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không tìm thấy imsg hoặc RPC không được hỗ trợ">
    Xác thực binary và hỗ trợ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Nếu probe báo RPC không được hỗ trợ, hãy cập nhật `imsg`. Nếu thao tác API riêng tư không khả dụng, hãy chạy `imsg launch` trong phiên người dùng macOS đã đăng nhập rồi probe lại. Nếu Gateway không chạy trên macOS, hãy dùng thiết lập Remote Mac qua SSH ở trên thay vì đường dẫn `imsg` cục bộ mặc định.

  </Accordion>

  <Accordion title="Gateway không chạy trên macOS">
    `cliPath: "imsg"` mặc định phải chạy trên Mac đã đăng nhập vào Messages. Trên Linux hoặc Windows, đặt `channels.imessage.cliPath` thành script wrapper SSH tới Mac đó và chạy `imsg "$@"`.

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

  <Accordion title="Tệp đính kèm từ xa bị lỗi">
    Kiểm tra:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - xác thực khóa SSH/SCP từ máy chủ Gateway
    - khóa máy chủ tồn tại trong `~/.ssh/known_hosts` trên máy chủ Gateway
    - khả năng đọc đường dẫn từ xa trên Mac đang chạy Messages

  </Accordion>

  <Accordion title="Đã bỏ lỡ lời nhắc quyền của macOS">
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

- [Tổng quan kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Loại bỏ BlueBubbles và đường dẫn imsg iMessage](/vi/announcements/bluebubbles-imessage) — thông báo và tóm tắt di chuyển
- [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) — bảng chuyển đổi cấu hình và các bước chuyển đổi tuần tự
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và chặn theo nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
