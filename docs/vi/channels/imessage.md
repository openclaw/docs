---
read_when:
    - Thiết lập hỗ trợ iMessage
    - Gỡ lỗi gửi/nhận iMessage
summary: Hỗ trợ iMessage gốc qua imsg (JSON-RPC qua stdio), với các thao tác API riêng tư cho trả lời, phản ứng, hiệu ứng, tệp đính kèm và quản lý nhóm. Được ưu tiên cho các thiết lập iMessage mới của OpenClaw khi đáp ứng yêu cầu về máy chủ.
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:21:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Đối với các triển khai iMessage của OpenClaw, hãy dùng `imsg` trên máy chủ macOS Messages đã đăng nhập. Nếu Gateway của bạn chạy trên Linux hoặc Windows, hãy trỏ `channels.imessage.cliPath` đến một SSH wrapper chạy `imsg` trên máy Mac.

**Tính năng bắt kịp khi Gateway ngừng hoạt động là tùy chọn bật.** Khi được bật (`channels.imessage.catchup.enabled: true`), Gateway phát lại các tin nhắn đến đã rơi vào `chat.db` trong lúc ngoại tuyến (sự cố, khởi động lại, Mac ngủ) ở lần khởi động tiếp theo. Mặc định tắt — xem [Bắt kịp sau thời gian Gateway ngừng hoạt động](#catching-up-after-gateway-downtime). Đóng [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
Hỗ trợ BlueBubbles đã bị gỡ bỏ. Hãy di chuyển cấu hình `channels.bluebubbles` sang `channels.imessage`; OpenClaw chỉ hỗ trợ iMessage thông qua `imsg`.
</Warning>

Trạng thái: tích hợp CLI bên ngoài gốc. Gateway sinh tiến trình `imsg rpc` và giao tiếp qua JSON-RPC trên stdio (không có daemon/cổng riêng). Các hành động nâng cao yêu cầu `imsg launch` và một lần thăm dò API riêng tư thành công.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Trả lời, tapback, hiệu ứng, tệp đính kèm và quản lý nhóm.
  </Card>
  <Card title="Pairing" icon="link" href="/vi/channels/pairing">
    DM iMessage mặc định ở chế độ ghép đôi.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Dùng SSH wrapper khi Gateway không chạy trên máy Mac Messages.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/vi/gateway/config-channels#imessage">
    Tài liệu tham khảo đầy đủ về trường iMessage.
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
    OpenClaw chỉ yêu cầu một `cliPath` tương thích với stdio, nên bạn có thể trỏ `cliPath` đến một script wrapper SSH vào máy Mac từ xa và chạy `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Cấu hình được khuyến nghị khi bật tệp đính kèm:

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

    Nếu `remoteHost` chưa được đặt, OpenClaw cố gắng tự động phát hiện bằng cách phân tích script SSH wrapper.
    `remoteHost` phải là `host` hoặc `user@host` (không có khoảng trắng hoặc tùy chọn SSH).
    OpenClaw dùng kiểm tra host key nghiêm ngặt cho SCP, vì vậy host key của máy chuyển tiếp phải đã tồn tại trong `~/.ssh/known_hosts`.
    Đường dẫn tệp đính kèm được xác thực theo các gốc được phép (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Yêu cầu và quyền (macOS)

- Messages phải được đăng nhập trên máy Mac chạy `imsg`.
- Cần Full Disk Access cho ngữ cảnh tiến trình chạy OpenClaw/`imsg` (truy cập DB của Messages).
- Cần quyền Automation để gửi tin nhắn qua Messages.app.
- Đối với các hành động nâng cao (react / edit / unsend / threaded reply / effects / group ops), phải tắt System Integrity Protection — xem [Bật API riêng tư của imsg](#enabling-the-imsg-private-api) bên dưới. Gửi/nhận văn bản và phương tiện cơ bản vẫn hoạt động khi không tắt.

<Tip>
Quyền được cấp theo từng ngữ cảnh tiến trình. Nếu Gateway chạy không giao diện (LaunchAgent/SSH), hãy chạy một lệnh tương tác một lần trong cùng ngữ cảnh đó để kích hoạt lời nhắc:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Bật API riêng tư của imsg

`imsg` có hai chế độ vận hành:

- **Chế độ cơ bản** (mặc định, không cần thay đổi SIP): văn bản và phương tiện gửi đi qua `send`, theo dõi/lịch sử đến, danh sách chat. Đây là những gì bạn có ngay từ đầu sau một lần `brew install steipete/tap/imsg` mới cùng các quyền macOS tiêu chuẩn ở trên.
- **Chế độ API riêng tư**: `imsg` chèn một dylib trợ giúp vào `Messages.app` để gọi các hàm `IMCore` nội bộ. Chế độ này mở khóa `react`, `edit`, `unsend`, `reply` (theo luồng), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, cùng chỉ báo đang nhập và biên nhận đã đọc.

Để dùng bề mặt hành động nâng cao mà trang kênh này ghi lại, bạn cần chế độ API riêng tư. README của `imsg` nêu rõ yêu cầu:

> Các tính năng nâng cao như `read`, `typing`, `launch`, gửi nội dung phong phú dựa trên cầu nối, chỉnh sửa tin nhắn và quản lý chat là tùy chọn bật. Chúng yêu cầu tắt SIP và chèn một dylib trợ giúp vào `Messages.app`. `imsg launch` từ chối chèn khi SIP đang bật.

Kỹ thuật chèn trợ giúp dùng dylib riêng của `imsg` để truy cập các API riêng tư của Messages. Không có máy chủ bên thứ ba hoặc runtime BlueBubbles trong đường dẫn iMessage của OpenClaw.

<Warning>
**Tắt SIP là một đánh đổi bảo mật thực sự.** SIP là một trong những lớp bảo vệ cốt lõi của macOS chống việc chạy mã hệ thống đã bị sửa đổi; tắt nó trên toàn hệ thống sẽ mở thêm bề mặt tấn công và tác dụng phụ. Đáng chú ý, **tắt SIP trên máy Mac Apple Silicon cũng vô hiệu hóa khả năng cài đặt và chạy ứng dụng iOS trên máy Mac của bạn**.

Hãy xem đây là một lựa chọn vận hành có chủ đích, không phải mặc định. Nếu mô hình đe dọa của bạn không thể chấp nhận việc tắt SIP, iMessage đi kèm sẽ bị giới hạn ở chế độ cơ bản — chỉ gửi/nhận văn bản và phương tiện, không có reaction / edit / unsend / effects / group ops.
</Warning>

### Thiết lập

1. **Cài đặt (hoặc nâng cấp) `imsg`** trên máy Mac chạy Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Đầu ra `imsg status --json` báo cáo `bridge_version`, `rpc_methods` và `selectors` theo từng phương thức để bạn có thể xem bản build hiện tại hỗ trợ gì trước khi bắt đầu.

2. **Tắt System Integrity Protection.** Việc này phụ thuộc vào phiên bản macOS vì yêu cầu nền tảng của Apple phụ thuộc vào hệ điều hành và phần cứng:
   - **macOS 10.13–10.15 (Sierra–Catalina):** tắt Library Validation qua Terminal, khởi động lại vào Recovery Mode, chạy `csrutil disable`, khởi động lại.
   - **macOS 11+ (Big Sur trở lên), Intel:** Recovery Mode (hoặc Internet Recovery), `csrutil disable`, khởi động lại.
   - **macOS 11+, Apple Silicon:** chuỗi khởi động bằng nút nguồn để vào Recovery; trên các phiên bản macOS gần đây, giữ phím **Left Shift** khi bạn nhấp Continue, rồi `csrutil disable`. Thiết lập máy ảo theo một luồng riêng — hãy chụp snapshot VM trước.
   - **macOS 26 / Tahoe:** các chính sách library-validation và kiểm tra private-entitlement của `imagent` đã siết chặt hơn nữa; `imsg` có thể cần bản build cập nhật để theo kịp. Nếu việc chèn `imsg launch` hoặc các `selectors` cụ thể bắt đầu trả về false sau một bản nâng cấp macOS lớn, hãy kiểm tra ghi chú phát hành của `imsg` trước khi cho rằng bước SIP đã thành công.

   Làm theo luồng Recovery-mode của Apple cho máy Mac của bạn để tắt SIP trước khi chạy `imsg launch`.

3. **Chèn trình trợ giúp.** Khi SIP đã tắt và Messages.app đã đăng nhập:

   ```bash
   imsg launch
   ```

   `imsg launch` từ chối chèn khi SIP vẫn đang bật, nên lệnh này cũng đồng thời xác nhận rằng bước 2 đã có hiệu lực.

4. **Xác minh cầu nối từ OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Mục iMessage nên báo cáo `works`, và `imsg status --json | jq '.selectors'` nên hiển thị `retractMessagePart: true` cùng bất kỳ selector edit / typing / read nào mà bản build macOS của bạn phơi bày. Cơ chế chặn theo từng phương thức của Plugin OpenClaw trong `actions.ts` chỉ quảng bá các hành động có selector nền tảng là `true`, vì vậy bề mặt hành động bạn thấy trong danh sách công cụ của agent phản ánh những gì cầu nối thực sự làm được trên host này.

Nếu `openclaw channels status --probe` báo cáo kênh là `works` nhưng các hành động cụ thể ném lỗi "iMessage `<action>` requires the imsg private API bridge" tại thời điểm dispatch, hãy chạy lại `imsg launch` — trình trợ giúp có thể bị rơi ra (Messages.app khởi động lại, cập nhật hệ điều hành, v.v.) và trạng thái `available: true` được lưu trong bộ nhớ đệm sẽ tiếp tục quảng bá hành động cho đến khi lần thăm dò tiếp theo làm mới.

### Khi bạn không thể tắt SIP

Nếu việc tắt SIP không chấp nhận được với mô hình đe dọa của bạn:

- `imsg` quay về chế độ cơ bản — chỉ văn bản + phương tiện + nhận.
- Plugin OpenClaw vẫn quảng bá gửi văn bản/phương tiện và giám sát đến; nó chỉ ẩn `react`, `edit`, `unsend`, `reply`, `sendWithEffect` và group ops khỏi bề mặt hành động (theo cổng năng lực theo từng phương thức).
- Bạn có thể chạy một máy Mac không phải Apple-Silicon riêng (hoặc một máy Mac bot chuyên dụng) với SIP tắt cho khối lượng công việc iMessage, trong khi vẫn bật SIP trên các thiết bị chính của bạn. Xem [Người dùng macOS bot chuyên dụng (danh tính iMessage riêng)](#deployment-patterns) bên dưới.

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` kiểm soát tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    Trường allowlist: `channels.imessage.allowFrom`.

    Mục allowlist có thể là handle, nhóm truy cập người gửi tĩnh (`accessGroup:<name>`), hoặc mục tiêu chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` kiểm soát xử lý nhóm:

    - `allowlist` (mặc định khi được cấu hình)
    - `open`
    - `disabled`

    Allowlist người gửi nhóm: `channels.imessage.groupAllowFrom`.

    Mục `groupAllowFrom` cũng có thể tham chiếu các nhóm truy cập người gửi tĩnh (`accessGroup:<name>`).

    Dự phòng runtime: nếu `groupAllowFrom` chưa được đặt, kiểm tra người gửi nhóm iMessage sẽ quay về `allowFrom` khi có sẵn.
    Ghi chú runtime: nếu `channels.imessage` hoàn toàn bị thiếu, runtime quay về `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` đã được đặt).

    <Warning>
    Định tuyến nhóm có **hai** cổng allowlist chạy nối tiếp, và cả hai đều phải vượt qua:

    1. **Allowlist người gửi / mục tiêu chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier`, hoặc `chat_id`.
    2. **Sổ đăng ký nhóm** (`channels.imessage.groups`) — với `groupPolicy: "allowlist"`, cổng này yêu cầu hoặc một mục wildcard `groups: { "*": { ... } }` (đặt `allowAll = true`), hoặc một mục rõ ràng theo từng `chat_id` dưới `groups`.

    Nếu cổng 2 không có gì, mọi tin nhắn nhóm sẽ bị bỏ. Plugin phát ra hai tín hiệu cấp `warn` ở mức log mặc định:

    - một lần cho mỗi tài khoản khi khởi động: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - một lần cho mỗi `chat_id` khi chạy: `imessage: dropping group message from chat_id=<id> ...`

    DM tiếp tục hoạt động vì chúng đi theo một đường mã khác.

    Cấu hình tối thiểu để giữ nhóm tiếp tục hoạt động dưới `groupPolicy: "allowlist"`:

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

    Nếu các dòng `warn` đó xuất hiện trong log Gateway, cổng 2 đang bỏ tin nhắn — hãy thêm khối `groups`.
    </Warning>

    Chặn theo mention cho nhóm:

    - iMessage không có metadata đề cập gốc
    - phát hiện đề cập dùng các mẫu regex (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - nếu không có mẫu đã cấu hình, không thể thực thi cổng đề cập

    Các lệnh điều khiển từ người gửi được ủy quyền có thể bỏ qua cổng đề cập trong nhóm.

    `systemPrompt` theo từng nhóm:

    Mỗi mục bên dưới `channels.imessage.groups.*` chấp nhận một chuỗi `systemPrompt` tùy chọn. Giá trị này được chèn vào prompt hệ thống của agent ở mọi lượt xử lý tin nhắn trong nhóm đó. Cách phân giải phản ánh cách phân giải prompt theo từng nhóm được `channels.whatsapp.groups` dùng:

    1. **Prompt hệ thống dành riêng cho nhóm** (`groups["<chat_id>"].systemPrompt`): được dùng khi mục nhóm cụ thể tồn tại trong map **và** khóa `systemPrompt` của mục đó được định nghĩa. Nếu `systemPrompt` là chuỗi rỗng (`""`) thì wildcard bị chặn và không có prompt hệ thống nào được áp dụng cho nhóm đó.
    2. **Prompt hệ thống wildcard cho nhóm** (`groups["*"].systemPrompt`): được dùng khi mục nhóm cụ thể hoàn toàn không có trong map, hoặc khi mục đó tồn tại nhưng không định nghĩa khóa `systemPrompt`.

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

  <Tab title="Phiên và phản hồi tất định">
    - DM dùng định tuyến trực tiếp; nhóm dùng định tuyến nhóm.
    - Với `session.dmScope=main` mặc định, DM iMessage được gộp vào phiên chính của agent.
    - Phiên nhóm được cô lập (`agent:<agentId>:imessage:group:<chat_id>`).
    - Phản hồi được định tuyến trở lại iMessage bằng metadata kênh/đích gốc.

    Hành vi luồng kiểu nhóm:

    Một số luồng iMessage có nhiều người tham gia có thể đến với `is_group=false`.
    Nếu `chat_id` đó được cấu hình rõ ràng dưới `channels.imessage.groups`, OpenClaw xử lý nó như lưu lượng nhóm (cổng nhóm + cô lập phiên nhóm).

  </Tab>
</Tabs>

## Liên kết cuộc hội thoại ACP

Các cuộc trò chuyện iMessage cũ cũng có thể được liên kết với phiên ACP.

Luồng nhanh cho operator:

- Chạy `/acp spawn codex --bind here` bên trong DM hoặc cuộc trò chuyện nhóm được phép.
- Các tin nhắn sau này trong cùng cuộc hội thoại iMessage đó sẽ định tuyến đến phiên ACP đã spawn.
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
  <Accordion title="Người dùng macOS bot chuyên dụng (danh tính iMessage riêng)">
    Dùng một Apple ID và người dùng macOS chuyên dụng để lưu lượng bot được cô lập khỏi hồ sơ Messages cá nhân của bạn.

    Luồng điển hình:

    1. Tạo/đăng nhập một người dùng macOS chuyên dụng.
    2. Đăng nhập vào Messages bằng Apple ID của bot trong người dùng đó.
    3. Cài đặt `imsg` trong người dùng đó.
    4. Tạo wrapper SSH để OpenClaw có thể chạy `imsg` trong ngữ cảnh người dùng đó.
    5. Trỏ `channels.imessage.accounts.<id>.cliPath` và `.dbPath` đến hồ sơ người dùng đó.

    Lần chạy đầu tiên có thể cần phê duyệt GUI (Automation + Full Disk Access) trong phiên người dùng bot đó.

  </Accordion>

  <Accordion title="Mac từ xa qua Tailscale (ví dụ)">
    Tô pô thường gặp:

    - gateway chạy trên Linux/VM
    - iMessage + `imsg` chạy trên một Mac trong tailnet của bạn
    - wrapper `cliPath` dùng SSH để chạy `imsg`
    - `remoteHost` bật lấy tệp đính kèm bằng SCP

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
    Đảm bảo khóa máy chủ được tin cậy trước (ví dụ `ssh bot@mac-mini.tailnet-1234.ts.net`) để `known_hosts` được điền.

  </Accordion>

  <Accordion title="Mẫu nhiều tài khoản">
    iMessage hỗ trợ cấu hình theo từng tài khoản dưới `channels.imessage.accounts`.

    Mỗi tài khoản có thể ghi đè các trường như `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, thiết lập lịch sử và danh sách cho phép gốc tệp đính kèm.

  </Accordion>
</AccordionGroup>

## Media, chia đoạn và đích gửi

<AccordionGroup>
  <Accordion title="Tệp đính kèm và media">
    - tiếp nhận tệp đính kèm đầu vào **tắt theo mặc định** — đặt `channels.imessage.includeAttachments: true` để chuyển tiếp ảnh, bản ghi âm, video và các tệp đính kèm khác đến agent. Khi tắt, các iMessage chỉ có tệp đính kèm bị loại bỏ trước khi đến agent và có thể không tạo dòng log `Inbound message` nào.
    - đường dẫn tệp đính kèm từ xa có thể được lấy qua SCP khi `remoteHost` được đặt
    - đường dẫn tệp đính kèm phải khớp với các gốc được phép:
      - `channels.imessage.attachmentRoots` (cục bộ)
      - `channels.imessage.remoteAttachmentRoots` (chế độ SCP từ xa)
      - mẫu gốc mặc định: `/Users/*/Library/Messages/Attachments`
    - SCP dùng kiểm tra khóa máy chủ nghiêm ngặt (`StrictHostKeyChecking=yes`)
    - kích thước media gửi đi dùng `channels.imessage.mediaMaxMb` (mặc định 16 MB)

  </Accordion>

  <Accordion title="Chia đoạn gửi đi">
    - giới hạn đoạn văn bản: `channels.imessage.textChunkLimit` (mặc định 4000)
    - chế độ chia đoạn: `channels.imessage.chunkMode`
      - `length` (mặc định)
      - `newline` (tách ưu tiên đoạn văn)

  </Accordion>

  <Accordion title="Định dạng địa chỉ">
    Đích rõ ràng được ưu tiên:

    - `chat_id:123` (khuyến nghị cho định tuyến ổn định)
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

## Hành động API riêng

Khi `imsg launch` đang chạy và `openclaw channels status --probe` báo cáo `privateApi.available: true`, công cụ nhắn tin có thể dùng các hành động gốc của iMessage bên cạnh gửi văn bản thông thường.

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
    - **reply**: Gửi phản hồi theo luồng tới một tin nhắn hiện có (`messageId`, `text` hoặc `message`, cộng với `chatGuid`, `chatId`, `chatIdentifier` hoặc `to`).
    - **sendWithEffect**: Gửi văn bản với hiệu ứng iMessage (`text` hoặc `message`, `effect` hoặc `effectId`).
    - **edit**: Chỉnh sửa tin nhắn đã gửi trên các phiên bản macOS/API riêng được hỗ trợ (`messageId`, `text` hoặc `newText`).
    - **unsend**: Thu hồi tin nhắn đã gửi trên các phiên bản macOS/API riêng được hỗ trợ (`messageId`).
    - **upload-file**: Gửi media/tệp (`buffer` dưới dạng base64 hoặc `media`/`path`/`filePath` đã hydrate, `filename`, tùy chọn `asVoice`). Bí danh cũ: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Quản lý cuộc trò chuyện nhóm khi đích hiện tại là một cuộc hội thoại nhóm.

  </Accordion>

  <Accordion title="ID tin nhắn">
    Ngữ cảnh iMessage đầu vào bao gồm cả giá trị `MessageSid` ngắn và GUID tin nhắn đầy đủ khi có. ID ngắn được giới hạn phạm vi trong bộ nhớ đệm phản hồi gần đây trong bộ nhớ và được kiểm tra với cuộc trò chuyện hiện tại trước khi dùng. Nếu một ID ngắn đã hết hạn hoặc thuộc về cuộc trò chuyện khác, hãy thử lại bằng `MessageSidFull` đầy đủ.

  </Accordion>

  <Accordion title="Phát hiện năng lực">
    OpenClaw chỉ ẩn các hành động API riêng khi trạng thái probe được lưu trong bộ nhớ đệm cho biết bridge không khả dụng. Nếu trạng thái chưa biết, các hành động vẫn hiển thị và việc dispatch sẽ probe lười để hành động đầu tiên có thể thành công sau `imsg launch` mà không cần làm mới trạng thái thủ công riêng.

  </Accordion>

  <Accordion title="Biên nhận đã đọc và trạng thái đang nhập">
    Khi bridge API riêng hoạt động, các cuộc trò chuyện đầu vào được chấp nhận được đánh dấu là đã đọc trước khi dispatch và bong bóng đang nhập được hiển thị cho người gửi trong khi agent tạo phản hồi. Tắt đánh dấu đã đọc bằng:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Các bản dựng `imsg` cũ hơn có trước danh sách năng lực theo từng phương thức sẽ tắt typing/read một cách im lặng; OpenClaw ghi log cảnh báo một lần mỗi lần khởi động lại để có thể quy nguyên nhân cho biên nhận bị thiếu.

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

## Gộp các DM gửi tách (lệnh + URL trong một lần soạn)

Khi người dùng nhập cùng lúc một lệnh và một URL — ví dụ `Dump https://example.com/article` — ứng dụng Messages của Apple tách lần gửi thành **hai hàng `chat.db` riêng biệt**:

1. Một tin nhắn văn bản (`"Dump"`).
2. Một bong bóng xem trước URL (`"https://..."`) với ảnh xem trước OG dưới dạng tệp đính kèm.

Hai hàng này đến OpenClaw cách nhau khoảng 0.8-2.0 giây trên hầu hết thiết lập. Nếu không gộp, agent nhận riêng lệnh ở lượt 1, phản hồi (thường là "gửi cho tôi URL"), và chỉ thấy URL ở lượt 2 — khi đó ngữ cảnh lệnh đã mất. Đây là pipeline gửi của Apple, không phải thứ OpenClaw hay `imsg` đưa vào.

`channels.imessage.coalesceSameSenderDms` chọn đưa một DM vào việc hợp nhất các hàng liên tiếp từ cùng người gửi thành một lượt agent duy nhất. Cuộc trò chuyện nhóm tiếp tục dispatch theo từng tin nhắn để giữ nguyên cấu trúc lượt nhiều người dùng.

<Tabs>
  <Tab title="Khi nào bật">
    Bật khi:

    - Bạn cung cấp skills mong đợi `command + payload` trong một tin nhắn (dump, paste, save, queue, v.v.).
    - Người dùng của bạn dán URL, hình ảnh hoặc nội dung dài cùng với lệnh.
    - Bạn có thể chấp nhận độ trễ lượt DM tăng thêm (xem bên dưới).

    Để tắt khi:

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

    Khi bật cờ và không có `messages.inbound.byChannel.imessage` rõ ràng, cửa sổ chống dội được mở rộng thành **2500 ms** (mặc định cũ là 0 ms — không chống dội). Cửa sổ rộng hơn là bắt buộc vì nhịp gửi tách của Apple ở mức 0.8-2.0 s không phù hợp với mặc định chặt hơn.

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
    - **Tăng độ trễ cho tin nhắn trực tiếp.** Khi bật cờ, mọi tin nhắn trực tiếp (bao gồm lệnh điều khiển độc lập và tin nhắn văn bản theo sau đơn lẻ) chờ tối đa bằng cửa sổ chống dội trước khi gửi đi, phòng khi một hàng tải trọng đang đến. Tin nhắn trò chuyện nhóm vẫn được gửi tức thì.
    - **Đầu ra đã gộp có giới hạn.** Văn bản đã gộp giới hạn ở 4000 ký tự với dấu `…[truncated]` rõ ràng; tệp đính kèm giới hạn ở 20; mục nguồn giới hạn ở 10 (giữ mục đầu tiên cộng với các mục mới nhất vượt quá giới hạn đó). Mọi nguồn GUID đều được theo dõi trong `coalescedMessageGuids` cho đo lường từ xa phía sau.
    - **Chỉ tin nhắn trực tiếp.** Trò chuyện nhóm chuyển qua gửi từng tin nhắn để bot vẫn phản hồi nhanh khi nhiều người đang nhập.
    - **Bật theo lựa chọn, theo từng kênh.** Các kênh khác (Telegram, WhatsApp, Slack, …) không bị ảnh hưởng. Cấu hình BlueBubbles cũ đặt `channels.bluebubbles.coalesceSameSenderDms` nên di chuyển giá trị đó sang `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Kịch bản và những gì tác tử thấy

| Người dùng soạn                                                   | `chat.db` tạo ra       | Tắt cờ (mặc định)                      | Bật cờ + cửa sổ 2500 ms                                                |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (một lần gửi)                           | 2 hàng cách nhau ~1 s | Hai lượt tác tử: chỉ "Dump", rồi URL    | Một lượt: văn bản đã gộp `Dump https://example.com`                    |
| `Save this 📎image.jpg caption` (tệp đính kèm + văn bản)           | 2 hàng                | Hai lượt (tệp đính kèm bị bỏ khi gộp)  | Một lượt: văn bản + ảnh được giữ lại                                   |
| `/status` (lệnh độc lập)                                           | 1 hàng                | Gửi tức thì                             | **Chờ tối đa bằng cửa sổ, rồi gửi**                                    |
| URL được dán riêng                                                 | 1 hàng                | Gửi tức thì                             | Gửi tức thì (chỉ một mục trong nhóm)                                   |
| Văn bản + URL được gửi thành hai tin nhắn riêng có chủ ý, cách nhau vài phút | 2 hàng ngoài cửa sổ | Hai lượt                               | Hai lượt (cửa sổ hết hạn giữa chúng)                                  |
| Luồng gửi nhanh (>10 tin nhắn trực tiếp nhỏ trong cửa sổ)          | N hàng                | N lượt                                  | Một lượt, đầu ra có giới hạn (áp dụng giới hạn mục đầu + mục mới nhất, văn bản/tệp đính kèm) |
| Hai người đang nhập trong trò chuyện nhóm                          | N hàng từ M người gửi | M+ lượt (mỗi nhóm người gửi một lượt)   | M+ lượt — trò chuyện nhóm không được gộp                               |

## Bắt kịp sau thời gian Gateway ngừng hoạt động

Khi Gateway ngoại tuyến (sự cố, khởi động lại, Mac ngủ, máy tắt), `imsg watch` tiếp tục từ trạng thái `chat.db` hiện tại sau khi Gateway hoạt động trở lại — theo mặc định, mọi thứ đến trong khoảng gián đoạn sẽ không bao giờ được thấy. Bắt kịp phát lại các tin nhắn đó ở lần khởi động kế tiếp để tác tử không âm thầm bỏ lỡ lưu lượng đến.

Bắt kịp bị **tắt theo mặc định**. Bật theo từng kênh:

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

### Cách chạy

Một lượt cho mỗi lần khởi động `monitorIMessageProvider`, được sắp xếp theo thứ tự `imsg launch` sẵn sàng → `watch.subscribe` → `performIMessageCatchup` → vòng lặp gửi trực tiếp. Bắt kịp sử dụng `chats.list` + `messages.history` theo từng cuộc trò chuyện qua cùng máy khách JSON-RPC mà `imsg watch` dùng. Bất kỳ thứ gì đến trong lượt bắt kịp đều đi qua gửi trực tiếp như bình thường; bộ nhớ đệm chống trùng lặp đầu vào hiện có hấp thụ mọi phần chồng lấp với các hàng được phát lại.

Mỗi hàng được phát lại đi qua đường gửi trực tiếp (`evaluateIMessageInbound` + `dispatchInboundMessage`), nên danh sách cho phép, chính sách nhóm, bộ chống dội, bộ nhớ đệm tiếng vọng và xác nhận đã đọc hoạt động giống hệt nhau trên tin nhắn được phát lại và tin nhắn trực tiếp.

### Ngữ nghĩa con trỏ và thử lại

Bắt kịp giữ con trỏ theo từng tài khoản tại `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (thư mục trạng thái OpenClaw mặc định là `~/.openclaw`, có thể ghi đè bằng `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- Con trỏ tiến lên sau mỗi lần gửi thành công và được giữ lại khi việc gửi một hàng phát sinh lỗi — lần khởi động tiếp theo thử lại cùng hàng từ con trỏ đang giữ.
- Sau `maxFailureRetries` lần phát sinh lỗi liên tiếp với cùng `guid`, bắt kịp ghi nhật ký `warn` và cưỡng bức đẩy con trỏ qua tin nhắn bị kẹt để các lần khởi động sau có thể tiếp tục.
- Các guid đã bỏ cuộc trước đó được bỏ qua ngay khi thấy (không thử gửi) trong các lần chạy sau và được tính trong `skippedGivenUp` ở tóm tắt lượt chạy.

### Tín hiệu hiển thị với người vận hành

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Một dòng `WARN ... capped to perRunLimit` nghĩa là một lần khởi động không xả hết toàn bộ tồn đọng. Tăng `perRunLimit` (tối đa 500) nếu các khoảng gián đoạn của bạn thường xuyên vượt quá lượt 50 hàng mặc định.

### Khi nào nên để tắt

- Gateway chạy liên tục với cơ chế tự khởi động lại giám sát và khoảng gián đoạn luôn < vài giây — mặc định tắt là ổn.
- Lượng tin nhắn trực tiếp thấp và tin nhắn bị lỡ sẽ không thay đổi hành vi tác tử — cửa sổ ban đầu `firstRunLookbackMinutes` có thể gửi ngữ cảnh cũ bất ngờ ở lần bật đầu tiên.

Khi bạn bật bắt kịp, lần khởi động đầu tiên không có con trỏ chỉ nhìn lại `firstRunLookbackMinutes` (mặc định 30 phút), không phải toàn bộ cửa sổ `maxAgeMinutes` — điều này tránh phát lại lịch sử dài các tin nhắn trước khi bật.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không tìm thấy imsg hoặc không hỗ trợ RPC">
    Xác thực tệp nhị phân và hỗ trợ RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Nếu thăm dò báo RPC không được hỗ trợ, hãy cập nhật `imsg`. Nếu thao tác API riêng không khả dụng, chạy `imsg launch` trong phiên người dùng macOS đã đăng nhập và thăm dò lại. Nếu Gateway không chạy trên macOS, hãy dùng thiết lập Mac từ xa qua SSH ở trên thay vì đường dẫn `imsg` cục bộ mặc định.

  </Accordion>

  <Accordion title="Gateway không chạy trên macOS">
    `cliPath: "imsg"` mặc định phải chạy trên Mac đã đăng nhập vào Messages. Trên Linux hoặc Windows, đặt `channels.imessage.cliPath` thành một tập lệnh bao bọc SSH vào Mac đó và chạy `imsg "$@"`.

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
    - phê duyệt ghép đôi (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Tin nhắn nhóm bị bỏ qua">
    Kiểm tra:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - hành vi danh sách cho phép `channels.imessage.groups`
    - cấu hình mẫu nhắc đến (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Tệp đính kèm từ xa thất bại">
    Kiểm tra:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - xác thực khóa SSH/SCP từ máy chủ Gateway
    - khóa máy chủ tồn tại trong `~/.ssh/known_hosts` trên máy chủ Gateway
    - khả năng đọc đường dẫn từ xa trên Mac đang chạy Messages

  </Accordion>

  <Accordion title="Đã bỏ lỡ lời nhắc quyền macOS">
    Chạy lại trong terminal GUI tương tác trong cùng ngữ cảnh người dùng/phiên và phê duyệt lời nhắc:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Xác nhận đã cấp Quyền truy cập toàn bộ ổ đĩa + Tự động hóa cho ngữ cảnh tiến trình chạy OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Con trỏ tham chiếu cấu hình

- [Tham chiếu cấu hình - iMessage](/vi/gateway/config-channels#imessage)
- [Cấu hình Gateway](/vi/gateway/configuration)
- [Ghép đôi](/vi/channels/pairing)

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Chuyển từ BlueBubbles](/vi/channels/imessage-from-bluebubbles) — bảng chuyển đổi cấu hình và quy trình chuyển đổi từng bước
- [Ghép đôi](/vi/channels/pairing) — xác thực tin nhắn trực tiếp và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng kiểm soát nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo vệ
