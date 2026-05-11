---
read_when:
    - Thiết lập hỗ trợ iMessage
    - Gỡ lỗi gửi/nhận iMessage
summary: Hỗ trợ iMessage gốc qua imsg (JSON-RPC qua stdio), với các thao tác API riêng cho trả lời, tapback, hiệu ứng, tệp đính kèm và quản lý nhóm. Được ưu tiên cho các thiết lập iMessage OpenClaw mới khi đáp ứng yêu cầu về host.
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Đối với triển khai OpenClaw iMessage, hãy dùng `imsg` trên máy chủ macOS Messages đã đăng nhập. Nếu Gateway của bạn chạy trên Linux hoặc Windows, hãy trỏ `channels.imessage.cliPath` đến một trình bao SSH chạy `imsg` trên máy Mac.

**Bắt kịp sau thời gian Gateway ngừng hoạt động là tùy chọn bật.** Khi được bật (`channels.imessage.catchup.enabled: true`), gateway sẽ phát lại các tin nhắn đến đã ghi vào `chat.db` trong lúc nó ngoại tuyến (sự cố, khởi động lại, máy Mac ngủ) ở lần khởi động tiếp theo. Mặc định bị tắt — xem [Bắt kịp sau thời gian gateway ngừng hoạt động](#catching-up-after-gateway-downtime). Đóng [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Hỗ trợ BlueBubbles đã bị gỡ bỏ. Hãy di chuyển cấu hình `channels.bluebubbles` sang `channels.imessage`; OpenClaw chỉ hỗ trợ iMessage thông qua `imsg`. Bắt đầu với [Gỡ bỏ BlueBubbles và đường dẫn imsg iMessage](/vi/announcements/bluebubbles-imessage) để xem thông báo ngắn, hoặc [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) để xem bảng di chuyển đầy đủ.
</Warning>

Trạng thái: tích hợp CLI bên ngoài gốc. Gateway khởi chạy `imsg rpc` và giao tiếp qua JSON-RPC trên stdio (không có daemon/cổng riêng). Các hành động nâng cao yêu cầu `imsg launch` và một lần kiểm tra API riêng tư thành công.

<CardGroup cols={3}>
  <Card title="Hành động API riêng tư" icon="wand-sparkles" href="#private-api-actions">
    Trả lời, tapback, hiệu ứng, tệp đính kèm và quản lý nhóm.
  </Card>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Tin nhắn trực tiếp iMessage mặc định dùng chế độ ghép nối.
  </Card>
  <Card title="Mac từ xa" icon="terminal" href="#remote-mac-over-ssh">
    Dùng trình bao SSH khi Gateway không chạy trên máy Mac Messages.
  </Card>
  <Card title="Tham chiếu cấu hình" icon="settings" href="/vi/gateway/config-channels#imessage">
    Tham chiếu đầy đủ cho các trường iMessage.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Tabs>
  <Tab title="Mac cục bộ (đường nhanh)">
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
    OpenClaw chỉ yêu cầu một `cliPath` tương thích với stdio, nên bạn có thể trỏ `cliPath` đến một script trình bao SSH vào máy Mac từ xa và chạy `imsg`.

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

    Nếu `remoteHost` chưa được đặt, OpenClaw sẽ cố tự động phát hiện bằng cách phân tích script trình bao SSH.
    `remoteHost` phải là `host` hoặc `user@host` (không có khoảng trắng hoặc tùy chọn SSH).
    OpenClaw dùng kiểm tra khóa máy chủ nghiêm ngặt cho SCP, nên khóa máy chủ chuyển tiếp phải đã tồn tại trong `~/.ssh/known_hosts`.
    Đường dẫn tệp đính kèm được xác thực theo các gốc được phép (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Yêu cầu và quyền (macOS)

- Messages phải được đăng nhập trên máy Mac chạy `imsg`.
- Cần Full Disk Access cho ngữ cảnh tiến trình chạy OpenClaw/`imsg` (truy cập DB Messages).
- Cần quyền Automation để gửi tin nhắn qua Messages.app.
- Với các hành động nâng cao (react / edit / unsend / threaded reply / effects / group ops), phải tắt System Integrity Protection — xem [Bật API riêng tư của imsg](#enabling-the-imsg-private-api) bên dưới. Gửi/nhận văn bản và phương tiện cơ bản hoạt động mà không cần tắt.

<Tip>
Quyền được cấp theo từng ngữ cảnh tiến trình. Nếu gateway chạy không đầu (LaunchAgent/SSH), hãy chạy một lệnh tương tác một lần trong cùng ngữ cảnh đó để kích hoạt lời nhắc:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Bật API riêng tư của imsg

`imsg` có hai chế độ vận hành:

- **Chế độ cơ bản** (mặc định, không cần thay đổi SIP): văn bản và phương tiện gửi đi qua `send`, theo dõi/lịch sử tin nhắn đến, danh sách chat. Đây là những gì bạn có sẵn sau một lần `brew install steipete/tap/imsg` mới cùng các quyền macOS chuẩn ở trên.
- **Chế độ API riêng tư**: `imsg` tiêm một dylib trợ giúp vào `Messages.app` để gọi các hàm `IMCore` nội bộ. Chế độ này mở khóa `react`, `edit`, `unsend`, `reply` (theo luồng), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, cùng chỉ báo đang nhập và xác nhận đã đọc.

Để dùng bề mặt hành động nâng cao mà trang kênh này mô tả, bạn cần chế độ API riêng tư. README của `imsg` nêu rõ yêu cầu:

> Các tính năng nâng cao như `read`, `typing`, `launch`, gửi phong phú dựa trên bridge, sửa đổi tin nhắn và quản lý chat là tùy chọn bật. Chúng yêu cầu tắt SIP và tiêm một dylib trợ giúp vào `Messages.app`. `imsg launch` từ chối tiêm khi SIP đang bật.

Kỹ thuật tiêm helper dùng dylib riêng của `imsg` để truy cập các API riêng tư của Messages. Không có máy chủ bên thứ ba hoặc runtime BlueBubbles trong đường dẫn OpenClaw iMessage.

<Warning>
**Tắt SIP là một đánh đổi bảo mật thực sự.** SIP là một trong các lớp bảo vệ cốt lõi của macOS chống việc chạy mã hệ thống đã sửa đổi; tắt nó trên toàn hệ thống sẽ mở thêm bề mặt tấn công và tác dụng phụ. Đáng chú ý, **tắt SIP trên máy Mac Apple Silicon cũng vô hiệu hóa khả năng cài đặt và chạy ứng dụng iOS trên máy Mac của bạn**.

Hãy xem đây là một lựa chọn vận hành có chủ đích, không phải mặc định. Nếu mô hình đe dọa của bạn không chấp nhận việc tắt SIP, iMessage tích hợp sẵn bị giới hạn ở chế độ cơ bản — chỉ gửi/nhận văn bản và phương tiện, không có reactions / edit / unsend / effects / group ops.
</Warning>

### Thiết lập

1. **Cài đặt (hoặc nâng cấp) `imsg`** trên máy Mac chạy Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Đầu ra `imsg status --json` báo cáo `bridge_version`, `rpc_methods` và `selectors` theo từng phương thức để bạn có thể xem bản dựng hiện tại hỗ trợ gì trước khi bắt đầu.

2. **Tắt System Integrity Protection.** Việc này phụ thuộc vào phiên bản macOS vì yêu cầu nền tảng của Apple phụ thuộc vào hệ điều hành và phần cứng:
   - **macOS 10.13–10.15 (Sierra–Catalina):** tắt Library Validation qua Terminal, khởi động lại vào Recovery Mode, chạy `csrutil disable`, rồi khởi động lại.
   - **macOS 11+ (Big Sur trở lên), Intel:** Recovery Mode (hoặc Internet Recovery), `csrutil disable`, khởi động lại.
   - **macOS 11+, Apple Silicon:** dùng chuỗi khởi động bằng nút nguồn để vào Recovery; trên các phiên bản macOS gần đây, giữ phím **Left Shift** khi bạn bấm Continue, rồi `csrutil disable`. Thiết lập máy ảo dùng một quy trình riêng — hãy chụp snapshot VM trước.
   - **macOS 26 / Tahoe:** chính sách library-validation và kiểm tra quyền riêng tư của `imagent` đã siết chặt hơn nữa; `imsg` có thể cần một bản dựng cập nhật để theo kịp. Nếu tiêm `imsg launch` hoặc các `selectors` cụ thể bắt đầu trả về false sau một lần nâng cấp lớn macOS, hãy kiểm tra ghi chú phát hành của `imsg` trước khi cho rằng bước SIP đã thành công.

   Làm theo quy trình Recovery Mode của Apple cho máy Mac của bạn để tắt SIP trước khi chạy `imsg launch`.

3. **Tiêm helper.** Khi SIP đã tắt và Messages.app đã đăng nhập:

   ```bash
   imsg launch
   ```

   `imsg launch` từ chối tiêm khi SIP vẫn đang bật, nên lệnh này cũng đóng vai trò xác nhận bước 2 đã có hiệu lực.

4. **Xác minh bridge từ OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Mục iMessage nên báo cáo `works`, và `imsg status --json | jq '.selectors'` nên hiển thị `retractMessagePart: true` cùng bất kỳ selector edit / typing / read nào mà bản dựng macOS của bạn cung cấp. Cổng theo từng phương thức của Plugin OpenClaw trong `actions.ts` chỉ quảng bá các hành động có selector nền tảng là `true`, nên bề mặt hành động bạn thấy trong danh sách công cụ của agent phản ánh những gì bridge thực sự có thể làm trên máy chủ này.

Nếu `openclaw channels status --probe` báo cáo kênh là `works` nhưng các hành động cụ thể ném lỗi "iMessage `<action>` requires the imsg private API bridge" tại thời điểm dispatch, hãy chạy lại `imsg launch` — helper có thể bị rơi ra (Messages.app khởi động lại, cập nhật hệ điều hành, v.v.) và trạng thái `available: true` được lưu trong bộ nhớ đệm sẽ tiếp tục quảng bá hành động cho đến khi lần kiểm tra tiếp theo làm mới.

### Khi bạn không thể tắt SIP

Nếu việc tắt SIP không phù hợp với mô hình đe dọa của bạn:

- `imsg` quay về chế độ cơ bản — chỉ văn bản + phương tiện + nhận.
- Plugin OpenClaw vẫn quảng bá gửi văn bản/phương tiện và theo dõi tin nhắn đến; nó chỉ ẩn `react`, `edit`, `unsend`, `reply`, `sendWithEffect` và group ops khỏi bề mặt hành động (theo cổng năng lực theo từng phương thức).
- Bạn có thể chạy một máy Mac không phải Apple Silicon riêng (hoặc một máy Mac bot chuyên dụng) với SIP tắt cho khối lượng công việc iMessage, trong khi vẫn bật SIP trên các thiết bị chính. Xem [Người dùng macOS bot chuyên dụng (danh tính iMessage riêng)](#deployment-patterns) bên dưới.

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="Chính sách DM">
    `channels.imessage.dmPolicy` kiểm soát tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    Trường danh sách cho phép: `channels.imessage.allowFrom`.

    Mục danh sách cho phép có thể là handle, nhóm truy cập người gửi tĩnh (`accessGroup:<name>`), hoặc mục tiêu chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Chính sách nhóm + nhắc đến">
    `channels.imessage.groupPolicy` kiểm soát xử lý nhóm:

    - `allowlist` (mặc định khi được cấu hình)
    - `open`
    - `disabled`

    Danh sách cho phép người gửi nhóm: `channels.imessage.groupAllowFrom`.

    Mục `groupAllowFrom` cũng có thể tham chiếu nhóm truy cập người gửi tĩnh (`accessGroup:<name>`).

    Dự phòng runtime: nếu `groupAllowFrom` chưa đặt, kiểm tra người gửi nhóm iMessage sẽ quay về `allowFrom` khi có.
    Ghi chú runtime: nếu hoàn toàn thiếu `channels.imessage`, runtime quay về `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` được đặt).

    <Warning>
    Định tuyến nhóm có **hai** cổng danh sách cho phép chạy liên tiếp, và cả hai đều phải đạt:

    1. **Danh sách cho phép người gửi / mục tiêu chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, hoặc `chat_id`.
    2. **Sổ đăng ký nhóm** (`channels.imessage.groups`) — với `groupPolicy: "allowlist"`, cổng này yêu cầu hoặc một mục ký tự đại diện `groups: { "*": { ... } }` (đặt `allowAll = true`), hoặc một mục rõ ràng theo từng `chat_id` trong `groups`.

    Nếu cổng 2 không có gì, mọi tin nhắn nhóm đều bị bỏ. Plugin phát ra hai tín hiệu mức `warn` ở mức nhật ký mặc định:

    - một lần cho mỗi tài khoản khi khởi động: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - một lần cho mỗi `chat_id` tại runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM tiếp tục hoạt động vì chúng dùng một đường mã khác.

    Cấu hình tối thiểu để giữ nhóm tiếp tục chạy dưới `groupPolicy: "allowlist"`:

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

    Nếu các dòng `warn` đó xuất hiện trong nhật ký gateway, cổng 2 đang bị rớt — hãy thêm khối `groups`.
    </Warning>

    Đề cập đến kiểm soát đề cập cho nhóm:

    - iMessage không có siêu dữ liệu đề cập gốc
    - phát hiện đề cập dùng các mẫu regex (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - khi không có mẫu nào được cấu hình, không thể thực thi kiểm soát đề cập

    Các lệnh điều khiển từ người gửi được ủy quyền có thể bỏ qua kiểm soát đề cập trong nhóm.

    `systemPrompt` theo từng nhóm:

    Mỗi mục trong `channels.imessage.groups.*` chấp nhận một chuỗi `systemPrompt` tùy chọn. Giá trị này được chèn vào system prompt của tác tử ở mỗi lượt xử lý tin nhắn trong nhóm đó. Cách phân giải phản ánh cách phân giải prompt theo từng nhóm được dùng bởi `channels.whatsapp.groups`:

    1. **System prompt riêng cho nhóm** (`groups["<chat_id>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của nó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`) thì wildcard bị chặn và không có system prompt nào được áp dụng cho nhóm đó.
    2. **System prompt wildcard cho nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn không có trong map, hoặc khi nó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

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

  <Tab title="Phiên và trả lời tất định">
    - DM dùng định tuyến trực tiếp; nhóm dùng định tuyến nhóm.
    - Với `session.dmScope=main` mặc định, DM iMessage được gộp vào phiên chính của tác tử.
    - Phiên nhóm được cô lập (`agent:<agentId>:imessage:group:<chat_id>`).
    - Câu trả lời được định tuyến trở lại iMessage bằng siêu dữ liệu kênh/đích gốc.

    Hành vi luồng kiểu nhóm:

    Một số luồng iMessage có nhiều người tham gia có thể đến với `is_group=false`.
    Nếu `chat_id` đó được cấu hình rõ ràng trong `channels.imessage.groups`, OpenClaw coi đó là lưu lượng nhóm (kiểm soát nhóm + cô lập phiên nhóm).

  </Tab>
</Tabs>

## Liên kết cuộc trò chuyện ACP

Các cuộc trò chuyện iMessage cũ cũng có thể được liên kết với phiên ACP.

Luồng thao tác nhanh:

- Chạy `/acp spawn codex --bind here` trong DM hoặc cuộc trò chuyện nhóm được phép.
- Tin nhắn sau này trong cùng cuộc trò chuyện iMessage đó sẽ được định tuyến tới phiên ACP đã tạo.
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

Xem [Tác tử ACP](/vi/tools/acp-agents) để biết hành vi liên kết ACP dùng chung.

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Người dùng macOS chuyên dụng cho bot (danh tính iMessage riêng)">
    Dùng Apple ID và người dùng macOS chuyên dụng để lưu lượng bot được cô lập khỏi hồ sơ Messages cá nhân của bạn.

    Luồng điển hình:

    1. Tạo/đăng nhập một người dùng macOS chuyên dụng.
    2. Đăng nhập vào Messages bằng Apple ID của bot trong người dùng đó.
    3. Cài đặt `imsg` trong người dùng đó.
    4. Tạo wrapper SSH để OpenClaw có thể chạy `imsg` trong ngữ cảnh người dùng đó.
    5. Trỏ `channels.imessage.accounts.<id>.cliPath` và `.dbPath` tới hồ sơ người dùng đó.

    Lần chạy đầu tiên có thể yêu cầu phê duyệt GUI (Automation + Full Disk Access) trong phiên người dùng bot đó.

  </Accordion>

  <Accordion title="Mac từ xa qua Tailscale (ví dụ)">
    Tô pô phổ biến:

    - gateway chạy trên Linux/VM
    - iMessage + `imsg` chạy trên một Mac trong tailnet của bạn
    - wrapper `cliPath` dùng SSH để chạy `imsg`
    - `remoteHost` bật tải tệp đính kèm qua SCP

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

  <Accordion title="Mẫu nhiều tài khoản">
    iMessage hỗ trợ cấu hình theo từng tài khoản trong `channels.imessage.accounts`.

    Mỗi tài khoản có thể ghi đè các trường như `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, cài đặt lịch sử và danh sách cho phép gốc tệp đính kèm.

  </Accordion>
</AccordionGroup>

## Phương tiện, chia đoạn và đích gửi

<AccordionGroup>
  <Accordion title="Tệp đính kèm và phương tiện">
    - nạp tệp đính kèm đầu vào **tắt theo mặc định** — đặt `channels.imessage.includeAttachments: true` để chuyển tiếp ảnh, ghi âm, video và các tệp đính kèm khác tới tác tử. Khi tùy chọn này bị tắt, iMessage chỉ có tệp đính kèm sẽ bị loại bỏ trước khi đến tác tử và có thể hoàn toàn không tạo dòng nhật ký `Inbound message`.
    - đường dẫn tệp đính kèm từ xa có thể được tải qua SCP khi `remoteHost` được đặt
    - đường dẫn tệp đính kèm phải khớp với các gốc được phép:
      - `channels.imessage.attachmentRoots` (cục bộ)
      - `channels.imessage.remoteAttachmentRoots` (chế độ SCP từ xa)
      - mẫu gốc mặc định: `/Users/*/Library/Messages/Attachments`
    - SCP dùng kiểm tra khóa máy chủ nghiêm ngặt (`StrictHostKeyChecking=yes`)
    - kích thước phương tiện đầu ra dùng `channels.imessage.mediaMaxMb` (mặc định 16 MB)

  </Accordion>

  <Accordion title="Chia đoạn đầu ra">
    - giới hạn đoạn văn bản: `channels.imessage.textChunkLimit` (mặc định 4000)
    - chế độ chia đoạn: `channels.imessage.chunkMode`
      - `length` (mặc định)
      - `newline` (tách ưu tiên đoạn văn)

  </Accordion>

  <Accordion title="Định dạng địa chỉ">
    Đích rõ ràng được ưu tiên:

    - `chat_id:123` (khuyến nghị để định tuyến ổn định)
    - `chat_guid:...`
    - `chat_identifier:...`

    Đích handle cũng được hỗ trợ:

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
  <Accordion title="Hành động khả dụng">
    - **react**: Thêm/xóa tapback iMessage (`messageId`, `emoji`, `remove`). Các tapback được hỗ trợ ánh xạ tới yêu thích, thích, không thích, cười, nhấn mạnh và câu hỏi.
    - **reply**: Gửi câu trả lời theo luồng tới một tin nhắn hiện có (`messageId`, `text` hoặc `message`, cộng với `chatGuid`, `chatId`, `chatIdentifier`, hoặc `to`).
    - **sendWithEffect**: Gửi văn bản với hiệu ứng iMessage (`text` hoặc `message`, `effect` hoặc `effectId`).
    - **edit**: Sửa một tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`, `text` hoặc `newText`).
    - **unsend**: Thu hồi một tin nhắn đã gửi trên các phiên bản macOS/API riêng tư được hỗ trợ (`messageId`).
    - **upload-file**: Gửi phương tiện/tệp (`buffer` dạng base64 hoặc `media`/`path`/`filePath` đã được hydrate, `filename`, `asVoice` tùy chọn). Bí danh cũ: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Quản lý cuộc trò chuyện nhóm khi đích hiện tại là một cuộc trò chuyện nhóm.

  </Accordion>

  <Accordion title="ID tin nhắn">
    Ngữ cảnh iMessage đầu vào bao gồm cả giá trị `MessageSid` ngắn và GUID tin nhắn đầy đủ khi có. ID ngắn được giới hạn trong bộ nhớ đệm trả lời gần đây trong bộ nhớ và được kiểm tra với cuộc trò chuyện hiện tại trước khi dùng. Nếu ID ngắn đã hết hạn hoặc thuộc về cuộc trò chuyện khác, hãy thử lại với `MessageSidFull` đầy đủ.

  </Accordion>

  <Accordion title="Phát hiện khả năng">
    OpenClaw chỉ ẩn các hành động API riêng tư khi trạng thái thăm dò được lưu đệm cho biết bridge không khả dụng. Nếu trạng thái chưa biết, các hành động vẫn hiển thị và gửi đi sẽ thăm dò lười để hành động đầu tiên có thể thành công sau `imsg launch` mà không cần làm mới trạng thái thủ công riêng.

  </Accordion>

  <Accordion title="Biên nhận đã đọc và đang nhập">
    Khi bridge API riêng tư đang hoạt động, các cuộc trò chuyện đầu vào được chấp nhận được đánh dấu là đã đọc trước khi gửi đi và bong bóng đang nhập được hiển thị cho người gửi trong khi tác tử tạo câu trả lời. Tắt đánh dấu đã đọc bằng:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Các bản dựng `imsg` cũ hơn có trước danh sách khả năng theo từng phương thức sẽ âm thầm chặn đang nhập/đã đọc; OpenClaw ghi nhật ký cảnh báo một lần mỗi lần khởi động lại để có thể quy nguyên nhân việc thiếu biên nhận.

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

Khi người dùng nhập một lệnh và một URL cùng nhau — ví dụ `Dump https://example.com/article` — ứng dụng Messages của Apple tách lần gửi đó thành **hai hàng `chat.db` riêng biệt**:

1. Một tin nhắn văn bản (`"Dump"`).
2. Một bong bóng xem trước URL (`"https://..."`) với ảnh xem trước OG dưới dạng tệp đính kèm.

Hai hàng đến OpenClaw cách nhau khoảng 0,8-2,0 giây trên hầu hết thiết lập. Nếu không gộp, tác tử nhận riêng lệnh ở lượt 1, trả lời (thường là "gửi URL cho tôi"), và chỉ thấy URL ở lượt 2 — lúc đó ngữ cảnh lệnh đã mất. Đây là pipeline gửi của Apple, không phải thứ OpenClaw hay `imsg` thêm vào.

`channels.imessage.coalesceSameSenderDms` chọn một DM để gộp các hàng liên tiếp từ cùng người gửi thành một lượt tác tử duy nhất. Cuộc trò chuyện nhóm tiếp tục gửi theo từng tin nhắn để giữ nguyên cấu trúc lượt nhiều người dùng.

<Tabs>
  <Tab title="Khi nào bật">
    Bật khi:

    - Bạn triển khai skills cần `command + payload` trong một tin nhắn (dump, paste, save, queue, v.v.).
    - Người dùng của bạn dán URL, hình ảnh hoặc nội dung dài cùng với lệnh.
    - Bạn có thể chấp nhận độ trễ lượt DM tăng thêm (xem bên dưới).

    Giữ tắt khi:

    - Bạn cần độ trễ lệnh tối thiểu cho các kích hoạt DM một từ.
    - Tất cả luồng của bạn là lệnh một lần không có payload theo sau.

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

    Khi bật cờ này và không có `messages.inbound.byChannel.imessage` rõ ràng, cửa sổ debounce mở rộng thành **2500 ms** (mặc định cũ là 0 ms — không debounce). Cửa sổ rộng hơn là cần thiết vì nhịp gửi tách của Apple trong khoảng 0,8-2,0 giây không phù hợp với mặc định chặt hơn.

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
    - **Độ trễ tăng thêm cho tin nhắn DM.** Khi bật cờ này, mọi DM (bao gồm lệnh điều khiển độc lập và phản hồi tiếp nối chỉ có văn bản) sẽ chờ tối đa bằng cửa sổ debounce trước khi được gửi đi, phòng trường hợp có một hàng payload sắp đến. Tin nhắn trò chuyện nhóm vẫn được gửi tức thì.
    - **Đầu ra được gộp có giới hạn.** Văn bản được gộp giới hạn ở 4000 ký tự với dấu `…[truncated]` rõ ràng; tệp đính kèm giới hạn ở 20; mục nguồn giới hạn ở 10 (giữ lại mục đầu tiên và mới nhất nếu vượt quá). Mọi GUID nguồn được theo dõi trong `coalescedMessageGuids` cho telemetry phía sau.
    - **Chỉ dành cho DM.** Trò chuyện nhóm được chuyển qua cơ chế gửi theo từng tin nhắn để bot vẫn phản hồi nhanh khi nhiều người đang nhập.
    - **Bật theo lựa chọn, theo từng kênh.** Các kênh khác (Telegram, WhatsApp, Slack, …) không bị ảnh hưởng. Cấu hình BlueBubbles cũ đặt `channels.bluebubbles.coalesceSameSenderDms` nên di chuyển giá trị đó sang `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Các tình huống và những gì agent nhìn thấy

| Người dùng soạn                                                     | `chat.db` tạo ra      | Tắt cờ (mặc định)                       | Bật cờ + cửa sổ 2500 ms                                                |
| ------------------------------------------------------------------- | --------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `Dump https://example.com` (một lần gửi)                            | 2 hàng cách nhau ~1 s | Hai lượt agent: chỉ có "Dump", rồi URL  | Một lượt: văn bản được gộp `Dump https://example.com`                  |
| `Save this 📎image.jpg caption` (tệp đính kèm + văn bản)            | 2 hàng                | Hai lượt (tệp đính kèm bị bỏ khi gộp)   | Một lượt: giữ nguyên văn bản + ảnh                                     |
| `/status` (lệnh độc lập)                                            | 1 hàng                | Gửi tức thì                             | **Chờ tối đa bằng cửa sổ, rồi gửi**                                    |
| Chỉ dán URL                                                         | 1 hàng                | Gửi tức thì                             | Gửi tức thì (chỉ có một mục trong bucket)                              |
| Văn bản + URL gửi thành hai tin nhắn riêng có chủ ý, cách nhau vài phút | 2 hàng ngoài cửa sổ   | Hai lượt                                | Hai lượt (cửa sổ hết hạn giữa hai tin nhắn)                            |
| Gửi dồn nhanh (>10 DM nhỏ trong cửa sổ)                             | N hàng                | N lượt                                  | Một lượt, đầu ra có giới hạn (áp dụng giới hạn đầu + mới nhất, văn bản/tệp đính kèm) |
| Hai người nhập trong một trò chuyện nhóm                            | N hàng từ M người gửi | M+ lượt (mỗi bucket người gửi một lượt) | M+ lượt — trò chuyện nhóm không được gộp                               |

## Bắt kịp sau thời gian Gateway ngừng hoạt động

Khi gateway ngoại tuyến (sập, khởi động lại, Mac ngủ, máy tắt), `imsg watch` sẽ tiếp tục từ trạng thái `chat.db` hiện tại sau khi gateway hoạt động trở lại — mọi thứ đến trong khoảng gián đoạn, theo mặc định, sẽ không bao giờ được thấy. Catchup phát lại các tin nhắn đó trong lần khởi động tiếp theo để agent không âm thầm bỏ lỡ lưu lượng đến.

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

### Cách nó chạy

Một lượt cho mỗi lần khởi động `monitorIMessageProvider`, được sắp theo trình tự `imsg launch` sẵn sàng → `watch.subscribe` → `performIMessageCatchup` → vòng lặp gửi trực tiếp. Bản thân Catchup dùng `chats.list` + `messages.history` theo từng trò chuyện thông qua cùng JSON-RPC client mà `imsg watch` sử dụng. Mọi thứ đến trong lượt catchup sẽ đi qua gửi trực tiếp như bình thường; cache chống trùng lặp inbound hiện có hấp thụ mọi phần chồng lặp với các hàng được phát lại.

Mỗi hàng được phát lại đi qua đường gửi trực tiếp (`evaluateIMessageInbound` + `dispatchInboundMessage`), nên allowlist, chính sách nhóm, debouncer, cache echo và xác nhận đã đọc hoạt động giống hệt nhau trên tin nhắn được phát lại và tin nhắn trực tiếp.

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

- Con trỏ tiến lên sau mỗi lần gửi thành công và được giữ lại khi việc gửi một hàng ném lỗi — lần khởi động tiếp theo thử lại cùng hàng đó từ con trỏ đã giữ.
- Sau `maxFailureRetries` lần ném lỗi liên tiếp với cùng một `guid`, catchup ghi log `warn` và buộc con trỏ tiến qua tin nhắn bị kẹt để các lần khởi động sau có thể tiếp tục.
- Các guid đã bị bỏ cuộc sẽ được bỏ qua ngay khi thấy (không thử gửi) trong các lần chạy sau và được tính vào `skippedGivenUp` trong phần tóm tắt lượt chạy.

### Tín hiệu hiển thị cho người vận hành

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Dòng `WARN ... capped to perRunLimit` nghĩa là một lần khởi động chưa xử lý hết toàn bộ backlog. Tăng `perRunLimit` (tối đa 500) nếu các khoảng gián đoạn của bạn thường xuyên vượt quá lượt mặc định 50 hàng.

### Khi nào nên để tắt

- Gateway chạy liên tục với watchdog tự động khởi động lại và các khoảng gián đoạn luôn < vài giây — mặc định tắt là ổn.
- Lưu lượng DM thấp và tin nhắn bị lỡ sẽ không thay đổi hành vi agent — cửa sổ ban đầu `firstRunLookbackMinutes` có thể gửi ngữ cảnh cũ bất ngờ trong lần bật đầu tiên.

Khi bạn bật catchup, lần khởi động đầu tiên không có con trỏ chỉ nhìn lại `firstRunLookbackMinutes` (mặc định 30 phút), không phải toàn bộ cửa sổ `maxAgeMinutes` — điều này tránh phát lại một lịch sử dài các tin nhắn trước khi bật.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="không tìm thấy imsg hoặc RPC không được hỗ trợ">
    Xác thực binary và hỗ trợ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Nếu probe báo RPC không được hỗ trợ, hãy cập nhật `imsg`. Nếu các hành động API riêng không khả dụng, hãy chạy `imsg launch` trong phiên người dùng macOS đã đăng nhập và probe lại. Nếu Gateway không chạy trên macOS, hãy dùng thiết lập Remote Mac qua SSH ở trên thay vì đường dẫn `imsg` cục bộ mặc định.

  </Accordion>

  <Accordion title="Gateway không chạy trên macOS">
    `cliPath: "imsg"` mặc định phải chạy trên Mac đã đăng nhập vào Messages. Trên Linux hoặc Windows, đặt `channels.imessage.cliPath` thành một script wrapper SSH vào Mac đó và chạy `imsg "$@"`.

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
    - hành vi allowlist của `channels.imessage.groups`
    - cấu hình mẫu nhắc đến (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Tệp đính kèm từ xa thất bại">
    Kiểm tra:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - xác thực khóa SSH/SCP từ máy chủ gateway
    - khóa máy chủ tồn tại trong `~/.ssh/known_hosts` trên máy chủ gateway
    - quyền đọc đường dẫn từ xa trên Mac đang chạy Messages

  </Accordion>

  <Accordion title="Đã bỏ lỡ lời nhắc quyền của macOS">
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

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Gỡ bỏ BlueBubbles và đường dẫn imsg iMessage](/vi/announcements/bluebubbles-imessage) — thông báo và tóm tắt di chuyển
- [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) — bảng chuyển đổi cấu hình và hướng dẫn chuyển đổi từng bước
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
