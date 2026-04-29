---
read_when:
    - Bạn muốn kết nối một bot Yuanbao
    - Bạn đang cấu hình kênh Yuanbao
summary: Tổng quan, tính năng và cấu hình bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-04-29T22:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao là nền tảng trợ lý AI của Tencent. Plugin kênh OpenClaw
kết nối các bot Yuanbao với OpenClaw qua WebSocket để chúng có thể tương tác với người dùng
thông qua tin nhắn trực tiếp và cuộc trò chuyện nhóm.

**Trạng thái:** sẵn sàng cho production đối với DM bot + cuộc trò chuyện nhóm. WebSocket là chế độ kết nối duy nhất được hỗ trợ.

---

## Bắt đầu nhanh

> **Yêu cầu OpenClaw 2026.4.10 trở lên.** Chạy `openclaw --version` để kiểm tra. Nâng cấp bằng `openclaw update`.

<Steps>
  <Step title="Thêm kênh Yuanbao bằng thông tin xác thực của bạn">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  Giá trị `--token` dùng định dạng `appKey:appSecret` phân tách bằng dấu hai chấm. Bạn có thể lấy các giá trị này từ ứng dụng Yuanbao bằng cách tạo một robot trong phần cài đặt ứng dụng của bạn.
  </Step>

  <Step title="Sau khi thiết lập hoàn tất, khởi động lại gateway để áp dụng thay đổi">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Thiết lập tương tác (phương án thay thế)

Bạn cũng có thể dùng trình hướng dẫn tương tác:

```bash
openclaw channels login --channel yuanbao
```

Làm theo lời nhắc để nhập App ID và App Secret của bạn.

---

## Kiểm soát truy cập

### Tin nhắn trực tiếp

Cấu hình `dmPolicy` để kiểm soát ai có thể DM bot:

- `"pairing"` — người dùng chưa biết sẽ nhận mã ghép nối; phê duyệt qua CLI
- `"allowlist"` — chỉ người dùng được liệt kê trong `allowFrom` mới có thể trò chuyện
- `"open"` — cho phép tất cả người dùng (mặc định)
- `"disabled"` — tắt tất cả DM

**Phê duyệt yêu cầu ghép nối:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Cuộc trò chuyện nhóm

**Yêu cầu nhắc đến** (`channels.yuanbao.requireMention`):

- `true` — yêu cầu @mention (mặc định)
- `false` — phản hồi mà không cần @mention

Việc trả lời tin nhắn của bot trong cuộc trò chuyện nhóm được xem như một lượt nhắc đến ngầm định.

---

## Ví dụ cấu hình

### Thiết lập cơ bản với chính sách DM mở

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### Giới hạn DM cho người dùng cụ thể

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### Tắt yêu cầu @mention trong nhóm

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Tối ưu hóa việc gửi tin nhắn đi

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Tinh chỉnh chiến lược merge-text

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## Lệnh phổ biến

| Lệnh       | Mô tả                         |
| ---------- | ----------------------------- |
| `/help`    | Hiển thị các lệnh khả dụng    |
| `/status`  | Hiển thị trạng thái bot       |
| `/new`     | Bắt đầu một phiên mới         |
| `/stop`    | Dừng lượt chạy hiện tại       |
| `/restart` | Khởi động lại OpenClaw        |
| `/compact` | Thu gọn ngữ cảnh phiên        |

> Yuanbao hỗ trợ menu lệnh gạch chéo gốc. Các lệnh được tự động đồng bộ với nền tảng khi gateway khởi động.

---

## Khắc phục sự cố

### Bot không phản hồi trong cuộc trò chuyện nhóm

1. Đảm bảo bot đã được thêm vào nhóm
2. Đảm bảo bạn @mention bot (bắt buộc theo mặc định)
3. Kiểm tra nhật ký: `openclaw logs --follow`

### Bot không nhận được tin nhắn

1. Đảm bảo bot đã được tạo và phê duyệt trong ứng dụng Yuanbao
2. Đảm bảo `appKey` và `appSecret` được cấu hình đúng
3. Đảm bảo gateway đang chạy: `openclaw gateway status`
4. Kiểm tra nhật ký: `openclaw logs --follow`

### Bot gửi phản hồi trống hoặc phản hồi dự phòng

1. Kiểm tra xem mô hình AI có trả về nội dung hợp lệ hay không
2. Phản hồi dự phòng mặc định là: "暂时无法解答，你可以换个问题问问我哦"
3. Tùy chỉnh qua `channels.yuanbao.fallbackReply`

### App Secret bị lộ

1. Đặt lại App Secret trong YuanBao APP
2. Cập nhật giá trị trong cấu hình của bạn
3. Khởi động lại gateway: `openclaw gateway restart`

---

## Cấu hình nâng cao

### Nhiều tài khoản

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` kiểm soát tài khoản nào được dùng khi các API gửi đi không chỉ định `accountId`.

### Giới hạn tin nhắn

- `maxChars` — số ký tự tối đa cho một tin nhắn (mặc định: `3000` ký tự)
- `mediaMaxMb` — giới hạn tải lên/tải xuống media (mặc định: `20` MB)
- `overflowPolicy` — hành vi khi tin nhắn vượt quá giới hạn: `"split"` (mặc định) hoặc `"stop"`

### Streaming

Yuanbao hỗ trợ đầu ra streaming ở cấp khối. Khi được bật, bot gửi văn bản theo từng đoạn trong lúc tạo nội dung.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Đặt `disableBlockStreaming: true` để gửi phản hồi hoàn chỉnh trong một tin nhắn.

### Ngữ cảnh lịch sử cuộc trò chuyện nhóm

Kiểm soát số lượng tin nhắn lịch sử được đưa vào ngữ cảnh AI cho cuộc trò chuyện nhóm:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Chế độ trả lời đến

Kiểm soát cách bot trích dẫn tin nhắn khi trả lời trong cuộc trò chuyện nhóm:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Giá trị   | Hành vi                                                   |
| --------- | --------------------------------------------------------- |
| `"off"`   | Không trả lời bằng trích dẫn                              |
| `"first"` | Chỉ trích dẫn phản hồi đầu tiên cho mỗi tin nhắn đến (mặc định) |
| `"all"`   | Trích dẫn mọi phản hồi                                    |

### Chèn gợi ý Markdown

Theo mặc định, bot chèn hướng dẫn vào system prompt để ngăn mô hình AI bọc toàn bộ phản hồi trong các khối mã markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Chế độ gỡ lỗi

Bật đầu ra nhật ký chưa được làm sạch cho các ID bot cụ thể:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Định tuyến đa tác tử

Dùng `bindings` để định tuyến DM hoặc nhóm Yuanbao đến các tác tử khác nhau.

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

Trường định tuyến:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (DM) hoặc `"group"` (cuộc trò chuyện nhóm)
- `match.peer.id`: ID người dùng hoặc mã nhóm

---

## Tham chiếu cấu hình

Cấu hình đầy đủ: [Cấu hình gateway](/vi/gateway/configuration)

| Cài đặt                                   | Mô tả                                                   | Mặc định                               |
| ----------------------------------------- | ------------------------------------------------------- | ------------------------------------- |
| `channels.yuanbao.enabled`                | Bật/tắt kênh                                            | `true`                                |
| `channels.yuanbao.defaultAccount`         | Tài khoản mặc định cho định tuyến gửi đi                | `default`                             |
| `channels.yuanbao.accounts.<id>.appKey`   | App Key (dùng để ký và tạo ticket)                      | —                                     |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (dùng để ký)                                | —                                     |
| `channels.yuanbao.accounts.<id>.token`    | Token đã ký sẵn (bỏ qua ký ticket tự động)              | —                                     |
| `channels.yuanbao.accounts.<id>.name`     | Tên hiển thị của tài khoản                              | —                                     |
| `channels.yuanbao.accounts.<id>.enabled`  | Bật/tắt một tài khoản cụ thể                            | `true`                                |
| `channels.yuanbao.dm.policy`              | Chính sách DM                                           | `open`                                |
| `channels.yuanbao.dm.allowFrom`           | Danh sách cho phép DM (danh sách ID người dùng)         | —                                     |
| `channels.yuanbao.requireMention`         | Yêu cầu @mention trong nhóm                             | `true`                                |
| `channels.yuanbao.overflowPolicy`         | Xử lý tin nhắn dài (`split` hoặc `stop`)                | `split`                               |
| `channels.yuanbao.replyToMode`            | Chiến lược trả lời đến trong nhóm (`off`, `first`, `all`) | `first`                               |
| `channels.yuanbao.outboundQueueStrategy`  | Chiến lược gửi đi (`merge-text` hoặc `immediate`)       | `merge-text`                          |
| `channels.yuanbao.minChars`               | Merge-text: số ký tự tối thiểu để kích hoạt gửi         | `2800`                                |
| `channels.yuanbao.maxChars`               | Merge-text: số ký tự tối đa mỗi tin nhắn                | `3000`                                |
| `channels.yuanbao.idleMs`                 | Merge-text: thời gian chờ nhàn rỗi trước khi tự động flush (ms) | `5000`                                |
| `channels.yuanbao.mediaMaxMb`             | Giới hạn kích thước media (MB)                          | `20`                                  |
| `channels.yuanbao.historyLimit`           | Mục ngữ cảnh lịch sử cuộc trò chuyện nhóm               | `100`                                 |
| `channels.yuanbao.disableBlockStreaming`  | Tắt đầu ra streaming ở cấp khối                         | `false`                               |
| `channels.yuanbao.fallbackReply`          | Phản hồi dự phòng khi AI không trả về nội dung          | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`    | Chèn hướng dẫn chống bọc markdown                       | `true`                                |
| `channels.yuanbao.debugBotIds`            | ID bot trong danh sách cho phép gỡ lỗi (nhật ký chưa làm sạch) | `[]`                                  |

---

## Loại tin nhắn được hỗ trợ

### Nhận

- ✅ Văn bản
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh / Giọng nói
- ✅ Video
- ✅ Sticker / Emoji tùy chỉnh
- ✅ Phần tử tùy chỉnh (thẻ liên kết, v.v.)

### Gửi

- ✅ Văn bản (có hỗ trợ markdown)
- ✅ Hình ảnh
- ✅ Tệp
- ✅ Âm thanh
- ✅ Video
- ✅ Sticker

### Luồng và phản hồi

- ✅ Phản hồi trích dẫn (có thể cấu hình qua `replyToMode`)
- ❌ Phản hồi theo luồng (nền tảng không hỗ trợ)

---

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi cuộc trò chuyện nhóm và kiểm soát nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
