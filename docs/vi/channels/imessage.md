---
read_when:
    - Thiết lập hỗ trợ iMessage
    - Gỡ lỗi gửi/nhận iMessage
summary: Hỗ trợ iMessage gốc thông qua imsg (JSON-RPC qua stdio). Được ưu tiên cho các thiết lập OpenClaw iMessage mới khi đáp ứng yêu cầu về máy chủ.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Đối với các triển khai OpenClaw iMessage mới, hãy bắt đầu tại đây khi bạn có thể chạy `imsg` trên một máy chủ macOS Messages đã đăng nhập. BlueBubbles vẫn khả dụng như một phương án dự phòng cũ cho các thiết lập hiện có phụ thuộc vào máy chủ HTTP, webhooks hoặc các hành động API riêng phong phú hơn của nó.
</Note>

Trạng thái: tích hợp CLI bên ngoài gốc. Gateway khởi chạy `imsg rpc` và giao tiếp qua JSON-RPC trên stdio (không có daemon/cổng riêng).

<CardGroup cols={3}>
  <Card title="BlueBubbles (phương án dự phòng cũ)" icon="message-circle" href="/vi/channels/bluebubbles">
    Tiếp tục dùng cho định tuyến hiện có dựa trên BlueBubbles; tránh dùng cho thiết lập mới khi imsg phù hợp.
  </Card>
  <Card title="Ghép nối" icon="link" href="/vi/channels/pairing">
    Tin nhắn riêng iMessage mặc định dùng chế độ ghép nối.
  </Card>
  <Card title="Tham chiếu cấu hình" icon="settings" href="/vi/gateway/config-channels#imessage">
    Tham chiếu đầy đủ các trường iMessage.
  </Card>
</CardGroup>

## Thiết lập nhanh

<Tabs>
  <Tab title="Máy Mac cục bộ (đường nhanh)">
    <Steps>
      <Step title="Cài đặt và xác minh imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
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

      <Step title="Phê duyệt ghép nối tin nhắn riêng đầu tiên (dmPolicy mặc định)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Yêu cầu ghép nối hết hạn sau 1 giờ.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Máy Mac từ xa qua SSH">
    OpenClaw chỉ yêu cầu một `cliPath` tương thích stdio, vì vậy bạn có thể trỏ `cliPath` đến một tập lệnh wrapper SSH vào máy Mac từ xa và chạy `imsg`.

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

    Nếu `remoteHost` chưa được đặt, OpenClaw cố gắng tự động phát hiện bằng cách phân tích tập lệnh wrapper SSH.
    `remoteHost` phải là `host` hoặc `user@host` (không có khoảng trắng hoặc tùy chọn SSH).
    OpenClaw dùng kiểm tra host-key nghiêm ngặt cho SCP, vì vậy khóa máy chủ chuyển tiếp phải đã tồn tại trong `~/.ssh/known_hosts`.
    Đường dẫn tệp đính kèm được xác thực theo các gốc được phép (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Yêu cầu và quyền (macOS)

- Messages phải được đăng nhập trên máy Mac chạy `imsg`.
- Full Disk Access là bắt buộc cho ngữ cảnh tiến trình chạy OpenClaw/`imsg` (truy cập DB Messages).
- Quyền Automation là bắt buộc để gửi tin nhắn qua Messages.app.

<Tip>
Quyền được cấp theo từng ngữ cảnh tiến trình. Nếu gateway chạy không có giao diện (LaunchAgent/SSH), hãy chạy một lệnh tương tác một lần trong cùng ngữ cảnh đó để kích hoạt lời nhắc:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Kiểm soát truy cập và định tuyến

<Tabs>
  <Tab title="Chính sách tin nhắn riêng">
    `channels.imessage.dmPolicy` kiểm soát tin nhắn trực tiếp:

    - `pairing` (mặc định)
    - `allowlist`
    - `open` (yêu cầu `allowFrom` bao gồm `"*"`)
    - `disabled`

    Trường danh sách cho phép: `channels.imessage.allowFrom`.

    Mục trong danh sách cho phép có thể là handle hoặc đích trò chuyện (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Chính sách nhóm + lượt nhắc">
    `channels.imessage.groupPolicy` kiểm soát xử lý nhóm:

    - `allowlist` (mặc định khi được cấu hình)
    - `open`
    - `disabled`

    Danh sách cho phép người gửi nhóm: `channels.imessage.groupAllowFrom`.

    Phương án dự phòng khi chạy: nếu `groupAllowFrom` chưa được đặt, kiểm tra người gửi nhóm iMessage sẽ dùng lại `allowFrom` khi có.
    Ghi chú khi chạy: nếu `channels.imessage` hoàn toàn bị thiếu, runtime dùng lại `groupPolicy="allowlist"` và ghi cảnh báo (ngay cả khi `channels.defaults.groupPolicy` được đặt).

    Gating theo lượt nhắc cho nhóm:

    - iMessage không có siêu dữ liệu lượt nhắc gốc
    - phát hiện lượt nhắc dùng các mẫu regex (`agents.list[].groupChat.mentionPatterns`, dự phòng `messages.groupChat.mentionPatterns`)
    - khi không có mẫu nào được cấu hình, không thể thực thi gating theo lượt nhắc

    Lệnh điều khiển từ người gửi được ủy quyền có thể bỏ qua gating theo lượt nhắc trong nhóm.

  </Tab>

  <Tab title="Phiên và phản hồi xác định">
    - Tin nhắn riêng dùng định tuyến trực tiếp; nhóm dùng định tuyến nhóm.
    - Với `session.dmScope=main` mặc định, tin nhắn riêng iMessage gộp vào phiên chính của agent.
    - Phiên nhóm được cô lập (`agent:<agentId>:imessage:group:<chat_id>`).
    - Phản hồi được định tuyến trở lại iMessage bằng siêu dữ liệu kênh/đích gốc.

    Hành vi luồng giống nhóm:

    Một số luồng iMessage nhiều người tham gia có thể đến với `is_group=false`.
    Nếu `chat_id` đó được cấu hình rõ ràng trong `channels.imessage.groups`, OpenClaw xử lý nó như lưu lượng nhóm (gating nhóm + cô lập phiên nhóm).

  </Tab>
</Tabs>

## Liên kết hội thoại ACP

Các cuộc trò chuyện iMessage cũ cũng có thể được liên kết với phiên ACP.

Luồng thao tác nhanh:

- Chạy `/acp spawn codex --bind here` bên trong tin nhắn riêng hoặc cuộc trò chuyện nhóm được phép.
- Các tin nhắn sau này trong cùng hội thoại iMessage đó được định tuyến đến phiên ACP đã khởi tạo.
- `/new` và `/reset` đặt lại cùng phiên ACP đã liên kết tại chỗ.
- `/acp close` đóng phiên ACP và xóa liên kết.

Các liên kết bền vững được cấu hình được hỗ trợ thông qua các mục `bindings[]` cấp cao nhất với `type: "acp"` và `match.channel: "imessage"`.

`match.peer.id` có thể dùng:

- handle tin nhắn riêng đã chuẩn hóa như `+15555550123` hoặc `user@example.com`
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

Xem [ACP Agents](/vi/tools/acp-agents) để biết hành vi liên kết ACP dùng chung.

## Mẫu triển khai

<AccordionGroup>
  <Accordion title="Người dùng macOS bot chuyên dụng (danh tính iMessage riêng)">
    Dùng Apple ID và người dùng macOS chuyên dụng để lưu lượng bot được cô lập khỏi hồ sơ Messages cá nhân của bạn.

    Luồng điển hình:

    1. Tạo/đăng nhập một người dùng macOS chuyên dụng.
    2. Đăng nhập vào Messages bằng Apple ID của bot trong người dùng đó.
    3. Cài đặt `imsg` trong người dùng đó.
    4. Tạo wrapper SSH để OpenClaw có thể chạy `imsg` trong ngữ cảnh người dùng đó.
    5. Trỏ `channels.imessage.accounts.<id>.cliPath` và `.dbPath` đến hồ sơ người dùng đó.

    Lần chạy đầu tiên có thể yêu cầu phê duyệt GUI (Automation + Full Disk Access) trong phiên người dùng bot đó.

  </Accordion>

  <Accordion title="Máy Mac từ xa qua Tailscale (ví dụ)">
    Cấu trúc liên kết phổ biến:

    - gateway chạy trên Linux/VM
    - iMessage + `imsg` chạy trên máy Mac trong tailnet của bạn
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

    Dùng khóa SSH để cả SSH và SCP đều không tương tác.
    Đảm bảo khóa máy chủ được tin cậy trước (ví dụ `ssh bot@mac-mini.tailnet-1234.ts.net`) để `known_hosts` được điền.

  </Accordion>

  <Accordion title="Mẫu nhiều tài khoản">
    iMessage hỗ trợ cấu hình theo từng tài khoản trong `channels.imessage.accounts`.

    Mỗi tài khoản có thể ghi đè các trường như `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, cài đặt lịch sử và danh sách cho phép gốc tệp đính kèm.

  </Accordion>
</AccordionGroup>

## Phương tiện, chia đoạn và đích gửi

<AccordionGroup>
  <Accordion title="Tệp đính kèm và phương tiện">
    - thu nạp tệp đính kèm đầu vào là tùy chọn: `channels.imessage.includeAttachments`
    - đường dẫn tệp đính kèm từ xa có thể được tải qua SCP khi `remoteHost` được đặt
    - đường dẫn tệp đính kèm phải khớp với các gốc được phép:
      - `channels.imessage.attachmentRoots` (cục bộ)
      - `channels.imessage.remoteAttachmentRoots` (chế độ SCP từ xa)
      - mẫu gốc mặc định: `/Users/*/Library/Messages/Attachments`
    - SCP dùng kiểm tra host-key nghiêm ngặt (`StrictHostKeyChecking=yes`)
    - kích thước phương tiện gửi đi dùng `channels.imessage.mediaMaxMb` (mặc định 16 MB)

  </Accordion>

  <Accordion title="Chia đoạn gửi đi">
    - giới hạn đoạn văn bản: `channels.imessage.textChunkLimit` (mặc định 4000)
    - chế độ chia đoạn: `channels.imessage.chunkMode`
      - `length` (mặc định)
      - `newline` (tách ưu tiên đoạn văn)

  </Accordion>

  <Accordion title="Định dạng định địa chỉ">
    Đích rõ ràng được ưu tiên:

    - `chat_id:123` (được khuyến nghị cho định tuyến ổn định)
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

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Không tìm thấy imsg hoặc RPC không được hỗ trợ">
    Xác thực binary và hỗ trợ RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Nếu probe báo RPC không được hỗ trợ, hãy cập nhật `imsg`.

  </Accordion>

  <Accordion title="Tin nhắn riêng bị bỏ qua">
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
    - cấu hình mẫu lượt nhắc (`agents.list[].groupChat.mentionPatterns`)

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
- [Ghép nối](/vi/channels/pairing)
- [BlueBubbles](/vi/channels/bluebubbles)

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cơ chế kiểm soát theo lượt nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố bảo mật
