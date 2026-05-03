---
read_when:
    - Bạn muốn kết nối một bot Feishu/Lark
    - Bạn đang cấu hình kênh Feishu
summary: Tổng quan, tính năng và cấu hình bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-05-03T21:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16d8156d215d47fa6e7d810e3a70eb8e84176a681669c27de8f58320be83a7a0
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark là một nền tảng cộng tác tất cả trong một, nơi các nhóm trò chuyện, chia sẻ tài liệu, quản lý lịch và cùng nhau hoàn thành công việc.

**Trạng thái:** sẵn sàng cho production đối với DM bot + cuộc trò chuyện nhóm. WebSocket là chế độ mặc định; chế độ webhook là tùy chọn.

---

## Bắt đầu nhanh

<Note>
Yêu cầu OpenClaw 2026.4.25 trở lên. Chạy `openclaw --version` để kiểm tra. Nâng cấp bằng `openclaw update`.
</Note>

<Steps>
  <Step title="Chạy trình hướng dẫn thiết lập kênh">
  ```bash
  openclaw channels login --channel feishu
  ```
  Quét mã QR bằng ứng dụng di động Feishu/Lark của bạn để tự động tạo bot Feishu/Lark.
  </Step>
  
  <Step title="Sau khi thiết lập hoàn tất, khởi động lại gateway để áp dụng thay đổi">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Kiểm soát truy cập

### Tin nhắn trực tiếp

Cấu hình `dmPolicy` để kiểm soát ai có thể gửi DM cho bot:

- `"pairing"` — người dùng chưa biết sẽ nhận mã ghép đôi; phê duyệt qua CLI
- `"allowlist"` — chỉ người dùng được liệt kê trong `allowFrom` mới có thể trò chuyện (mặc định: chỉ chủ sở hữu bot)
- `"open"` — chỉ cho phép DM công khai khi `allowFrom` bao gồm `"*"`; với các mục hạn chế, chỉ người dùng khớp mới có thể trò chuyện
- `"disabled"` — tắt toàn bộ DM

**Phê duyệt yêu cầu ghép đôi:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Cuộc trò chuyện nhóm

**Chính sách nhóm** (`channels.feishu.groupPolicy`):

| Giá trị       | Hành vi                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| `"open"`      | Phản hồi tất cả tin nhắn trong nhóm                                                                          |
| `"allowlist"` | Chỉ phản hồi các nhóm trong `groupAllowFrom` hoặc được cấu hình rõ ràng trong `groups.<chat_id>`             |
| `"disabled"`  | Tắt toàn bộ tin nhắn nhóm; các mục `groups.<chat_id>` rõ ràng không ghi đè điều này                          |

Mặc định: `allowlist`

**Yêu cầu nhắc đến** (`channels.feishu.requireMention`):

- `true` — yêu cầu @mention (mặc định)
- `false` — phản hồi mà không cần @mention
- Ghi đè theo nhóm: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` và `@_all` chỉ dùng để phát thông báo không được xem là nhắc đến bot. Một tin nhắn nhắc đến cả `@all` và trực tiếp bot vẫn được tính là nhắc đến bot.

---

## Ví dụ cấu hình nhóm

### Cho phép tất cả nhóm, không yêu cầu @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Cho phép tất cả nhóm, vẫn yêu cầu @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Chỉ cho phép các nhóm cụ thể

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

Ở chế độ `allowlist`, bạn cũng có thể cho phép một nhóm bằng cách thêm một mục `groups.<chat_id>` rõ ràng. Các mục rõ ràng không ghi đè `groupPolicy: "disabled"`. Mặc định ký tự đại diện trong `groups.*` cấu hình các nhóm khớp, nhưng bản thân chúng không cho phép nhóm.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Hạn chế người gửi trong một nhóm

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Lấy ID nhóm/người dùng

### ID nhóm (`chat_id`, định dạng: `oc_xxx`)

Mở nhóm trong Feishu/Lark, nhấp vào biểu tượng menu ở góc trên bên phải và vào **Cài đặt**. ID nhóm (`chat_id`) được liệt kê trên trang cài đặt.

![Lấy ID nhóm](/images/feishu-get-group-id.png)

### ID người dùng (`open_id`, định dạng: `ou_xxx`)

Khởi động gateway, gửi DM cho bot, sau đó kiểm tra nhật ký:

```bash
openclaw logs --follow
```

Tìm `open_id` trong đầu ra nhật ký. Bạn cũng có thể kiểm tra các yêu cầu ghép đôi đang chờ:

```bash
openclaw pairing list feishu
```

---

## Lệnh thường dùng

| Lệnh      | Mô tả                        |
| --------- | ---------------------------- |
| `/status` | Hiển thị trạng thái bot      |
| `/reset`  | Đặt lại phiên hiện tại       |
| `/model`  | Hiển thị hoặc đổi mô hình AI |

<Note>
Feishu/Lark không hỗ trợ menu lệnh gạch chéo gốc, vì vậy hãy gửi các lệnh này dưới dạng tin nhắn văn bản thuần.
</Note>

---

## Khắc phục sự cố

### Bot không phản hồi trong cuộc trò chuyện nhóm

1. Đảm bảo bot đã được thêm vào nhóm
2. Đảm bảo bạn @mention bot (mặc định là bắt buộc)
3. Xác minh `groupPolicy` không phải là `"disabled"`
4. Kiểm tra nhật ký: `openclaw logs --follow`

### Bot không nhận được tin nhắn

1. Đảm bảo bot đã được xuất bản và phê duyệt trong Feishu Open Platform / Lark Developer
2. Đảm bảo đăng ký sự kiện bao gồm `im.message.receive_v1`
3. Đảm bảo **kết nối liên tục** (WebSocket) đã được chọn
4. Đảm bảo tất cả phạm vi quyền bắt buộc đã được cấp
5. Đảm bảo gateway đang chạy: `openclaw gateway status`
6. Kiểm tra nhật ký: `openclaw logs --follow`

### App Secret bị rò rỉ

1. Đặt lại App Secret trong Feishu Open Platform / Lark Developer
2. Cập nhật giá trị trong cấu hình của bạn
3. Khởi động lại gateway: `openclaw gateway restart`

---

## Cấu hình nâng cao

### Nhiều tài khoản

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` kiểm soát tài khoản nào được dùng khi API gửi đi không chỉ định `accountId`.
`accounts.<id>.tts` dùng cùng cấu trúc với `messages.tts` và hợp nhất sâu lên trên
cấu hình TTS toàn cục, vì vậy các thiết lập Feishu nhiều bot có thể giữ thông tin xác thực
nhà cung cấp dùng chung ở phạm vi toàn cục trong khi chỉ ghi đè giọng nói, mô hình, persona hoặc chế độ tự động
theo từng tài khoản.

### Giới hạn tin nhắn

- `textChunkLimit` — kích thước đoạn văn bản gửi đi (mặc định: `2000` ký tự)
- `mediaMaxMb` — giới hạn tải lên/tải xuống phương tiện (mặc định: `30` MB)

### Phát trực tuyến

Feishu/Lark hỗ trợ phản hồi phát trực tuyến qua thẻ tương tác. Khi được bật, bot cập nhật thẻ theo thời gian thực khi tạo văn bản.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Đặt `streaming: false` để gửi toàn bộ phản hồi trong một tin nhắn. `blockStreaming` mặc định tắt; chỉ bật khi bạn muốn các khối trợ lý đã hoàn tất được đẩy ra trước phản hồi cuối cùng.

### Tối ưu hạn mức

Giảm số lượng lệnh gọi API Feishu/Lark bằng hai cờ tùy chọn:

- `typingIndicator` (mặc định `true`): đặt `false` để bỏ qua các lệnh gọi phản ứng đang nhập
- `resolveSenderNames` (mặc định `true`): đặt `false` để bỏ qua tra cứu hồ sơ người gửi

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Phiên ACP

Feishu/Lark hỗ trợ ACP cho DM và tin nhắn chuỗi trong nhóm. ACP của Feishu/Lark vận hành bằng lệnh văn bản — không có menu lệnh gạch chéo gốc, vì vậy hãy dùng trực tiếp tin nhắn `/acp ...` trong cuộc trò chuyện.

#### Liên kết ACP bền vững

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Tạo ACP từ cuộc trò chuyện

Trong DM hoặc chuỗi Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` hoạt động cho DM và tin nhắn chuỗi Feishu/Lark. Các tin nhắn tiếp theo trong cuộc trò chuyện đã liên kết sẽ được định tuyến trực tiếp đến phiên ACP đó.

### Định tuyến đa tác nhân

Dùng `bindings` để định tuyến DM hoặc nhóm Feishu/Lark đến các tác nhân khác nhau.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Trường định tuyến:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) hoặc `"group"` (cuộc trò chuyện nhóm)
- `match.peer.id`: Open ID người dùng (`ou_xxx`) hoặc ID nhóm (`oc_xxx`)

Xem [Lấy ID nhóm/người dùng](#get-groupuser-ids) để biết mẹo tra cứu.

---

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình Gateway](/vi/gateway/configuration)

| Cài đặt                                          | Mô tả                                                                                         | Mặc định         |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Bật/tắt kênh                                                                                  | `true`           |
| `channels.feishu.domain`                          | Miền API (`feishu` hoặc `lark`)                                                               | `feishu`         |
| `channels.feishu.connectionMode`                  | Phương thức vận chuyển sự kiện (`websocket` hoặc `webhook`)                                   | `websocket`      |
| `channels.feishu.defaultAccount`                  | Tài khoản mặc định để định tuyến gửi đi                                                       | `default`        |
| `channels.feishu.verificationToken`               | Bắt buộc đối với chế độ Webhook                                                               | —                |
| `channels.feishu.encryptKey`                      | Bắt buộc đối với chế độ Webhook                                                               | —                |
| `channels.feishu.webhookPath`                     | Đường dẫn tuyến Webhook                                                                       | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Máy chủ bind Webhook                                                                          | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Cổng bind Webhook                                                                             | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID ứng dụng                                                                                   | —                |
| `channels.feishu.accounts.<id>.appSecret`         | Secret ứng dụng                                                                               | —                |
| `channels.feishu.accounts.<id>.domain`            | Ghi đè miền theo từng tài khoản                                                               | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Ghi đè TTS theo từng tài khoản                                                                | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Chính sách DM                                                                                 | `allowlist`      |
| `channels.feishu.allowFrom`                       | Danh sách cho phép DM (danh sách open_id)                                                     | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Chính sách nhóm                                                                               | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Danh sách cho phép nhóm                                                                       | —                |
| `channels.feishu.requireMention`                  | Yêu cầu @mention trong nhóm                                                                   | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Ghi đè @mention theo từng nhóm; ID rõ ràng cũng cho phép nhóm trong chế độ danh sách cho phép | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Bật/tắt một nhóm cụ thể                                                                       | `true`           |
| `channels.feishu.textChunkLimit`                  | Kích thước đoạn tin nhắn                                                                      | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Giới hạn kích thước phương tiện                                                               | `30`             |
| `channels.feishu.streaming`                       | Đầu ra thẻ phát trực tuyến                                                                    | `true`           |
| `channels.feishu.blockStreaming`                  | Phát trực tuyến trả lời theo khối đã hoàn tất                                                 | `false`          |
| `channels.feishu.typingIndicator`                 | Gửi phản ứng đang nhập                                                                        | `true`           |
| `channels.feishu.resolveSenderNames`              | Phân giải tên hiển thị của người gửi                                                          | `true`           |

---

## Loại tin nhắn được hỗ trợ

### Nhận

- ✅ Văn bản
- ✅ Văn bản phong phú (bài đăng)
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh
- ✅ Video/phương tiện
- ✅ Nhãn dán

Tin nhắn âm thanh Feishu/Lark gửi đến được chuẩn hóa thành phần giữ chỗ phương tiện thay vì JSON `file_key` thô. Khi `tools.media.audio` được cấu hình, OpenClaw tải xuống tài nguyên ghi chú thoại và chạy phiên âm âm thanh dùng chung trước lượt agent, để agent nhận được bản chép lời nội dung nói. Nếu Feishu đưa văn bản chép lời trực tiếp vào payload âm thanh, văn bản đó được dùng mà không cần gọi ASR khác. Nếu không có nhà cung cấp phiên âm âm thanh, agent vẫn nhận được phần giữ chỗ `<media:audio>` cộng với tệp đính kèm đã lưu, không phải payload tài nguyên Feishu thô.

### Gửi

- ✅ Văn bản
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh
- ✅ Video/phương tiện
- ✅ Thẻ tương tác (bao gồm cập nhật phát trực tuyến)
- ⚠️ Văn bản phong phú (định dạng kiểu bài đăng; không hỗ trợ đầy đủ khả năng biên soạn của Feishu/Lark)

Bong bóng âm thanh gốc Feishu/Lark dùng loại tin nhắn `audio` của Feishu và yêu cầu phương tiện tải lên Ogg/Opus (`file_type: "opus"`). Phương tiện `.opus` và `.ogg` hiện có được gửi trực tiếp dưới dạng âm thanh gốc. MP3/WAV/M4A và các định dạng có khả năng là âm thanh khác được chuyển mã sang Ogg/Opus 48kHz bằng `ffmpeg` chỉ khi câu trả lời yêu cầu gửi bằng giọng nói (`audioAsVoice` / công cụ tin nhắn `asVoice`, bao gồm trả lời ghi chú thoại TTS). Tệp đính kèm MP3 thông thường vẫn là tệp bình thường. Nếu thiếu `ffmpeg` hoặc chuyển đổi thất bại, OpenClaw chuyển sang dùng tệp đính kèm và ghi log lý do.

### Luồng và trả lời

- ✅ Trả lời nội tuyến
- ✅ Trả lời trong luồng
- ✅ Trả lời phương tiện vẫn nhận biết luồng khi trả lời một tin nhắn trong luồng

Đối với `groupSessionScope: "group_topic"` và `"group_topic_sender"`, nhóm chủ đề gốc Feishu/Lark dùng `thread_id` (`omt_*`) của sự kiện làm khóa phiên chủ đề chuẩn. Các trả lời nhóm bình thường mà OpenClaw chuyển thành luồng tiếp tục dùng ID tin nhắn gốc của trả lời (`om_*`) để lượt đầu tiên và lượt tiếp theo vẫn ở cùng một phiên.

---

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng kiểm soát nhắc tên
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
