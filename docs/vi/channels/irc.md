---
read_when:
    - Bạn muốn kết nối OpenClaw với các kênh IRC hoặc tin nhắn trực tiếp
    - Bạn đang cấu hình danh sách cho phép IRC, chính sách nhóm hoặc kiểm soát việc nhắc đến
summary: Thiết lập Plugin IRC, kiểm soát quyền truy cập và khắc phục sự cố
title: IRC
x-i18n:
    generated_at: "2026-04-29T22:25:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 16
---

Dùng IRC khi bạn muốn OpenClaw trong các kênh cổ điển (`#room`) và tin nhắn trực tiếp.
IRC được cung cấp dưới dạng Plugin đóng gói kèm, nhưng được cấu hình trong cấu hình chính tại `channels.irc`.

## Bắt đầu nhanh

1. Bật cấu hình IRC trong `~/.openclaw/openclaw.json`.
2. Thiết lập ít nhất:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Nên dùng máy chủ IRC riêng để phối hợp bot. Nếu bạn chủ ý dùng mạng IRC công khai, các lựa chọn phổ biến gồm Libera.Chat, OFTC và Snoonet. Tránh các kênh công khai dễ đoán cho lưu lượng kênh hậu trường của bot hoặc swarm.

3. Khởi động/khởi động lại gateway:

```bash
openclaw gateway run
```

## Mặc định bảo mật

- `channels.irc.dmPolicy` mặc định là `"pairing"`.
- `channels.irc.groupPolicy` mặc định là `"allowlist"`.
- Với `groupPolicy="allowlist"`, hãy đặt `channels.irc.groups` để định nghĩa các kênh được phép.
- Dùng TLS (`channels.irc.tls=true`) trừ khi bạn chủ ý chấp nhận truyền tải văn bản thuần.

## Kiểm soát truy cập

Có hai “cổng” riêng cho các kênh IRC:

1. **Truy cập kênh** (`groupPolicy` + `groups`): bot có chấp nhận tin nhắn từ một kênh hay không.
2. **Truy cập người gửi** (`groupAllowFrom` / `groups["#channel"].allowFrom` theo từng kênh): ai được phép kích hoạt bot bên trong kênh đó.

Khóa cấu hình:

- Danh sách cho phép DM (truy cập người gửi DM): `channels.irc.allowFrom`
- Danh sách cho phép người gửi nhóm (truy cập người gửi trong kênh): `channels.irc.groupAllowFrom`
- Điều khiển theo từng kênh (quy tắc kênh + người gửi + nhắc đến): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` cho phép các kênh chưa cấu hình (**theo mặc định vẫn bị chặn bởi yêu cầu nhắc đến**)

Các mục danh sách cho phép nên dùng danh tính người gửi ổn định (`nick!user@host`).
Khớp nick trần có thể thay đổi và chỉ được bật khi `channels.irc.dangerouslyAllowNameMatching: true`.

### Lỗi thường gặp: `allowFrom` dành cho DM, không phải kênh

Nếu bạn thấy log như:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…điều đó nghĩa là người gửi chưa được phép cho tin nhắn **nhóm/kênh**. Sửa bằng một trong hai cách:

- đặt `channels.irc.groupAllowFrom` (toàn cục cho mọi kênh), hoặc
- đặt danh sách cho phép người gửi theo từng kênh: `channels.irc.groups["#channel"].allowFrom`

Ví dụ (cho phép bất kỳ ai trong `#tuirc-dev` nói chuyện với bot):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Kích hoạt trả lời (nhắc đến)

Ngay cả khi một kênh được phép (qua `groupPolicy` + `groups`) và người gửi được phép, OpenClaw mặc định dùng **cổng nhắc đến** trong ngữ cảnh nhóm.

Điều đó nghĩa là bạn có thể thấy log như `drop channel … (missing-mention)` trừ khi tin nhắn có mẫu nhắc đến khớp với bot.

Để bot trả lời trong một kênh IRC **mà không cần nhắc đến**, hãy tắt cổng nhắc đến cho kênh đó:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Hoặc để cho phép **tất cả** kênh IRC (không có danh sách cho phép theo từng kênh) và vẫn trả lời không cần nhắc đến:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Ghi chú bảo mật (khuyến nghị cho kênh công khai)

Nếu bạn cho phép `allowFrom: ["*"]` trong một kênh công khai, bất kỳ ai cũng có thể nhắc lệnh bot.
Để giảm rủi ro, hãy hạn chế công cụ cho kênh đó.

### Cùng công cụ cho mọi người trong kênh

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Công cụ khác nhau theo từng người gửi (chủ sở hữu có nhiều quyền hơn)

Dùng `toolsBySender` để áp dụng chính sách chặt hơn cho `"*"` và chính sách lỏng hơn cho nick của bạn:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Ghi chú:

- Các khóa `toolsBySender` nên dùng `id:` cho giá trị danh tính người gửi IRC:
  `id:eigen` hoặc `id:eigen!~eigen@174.127.248.171` để khớp chặt hơn.
- Các khóa cũ không có tiền tố vẫn được chấp nhận và chỉ được khớp như `id:`.
- Chính sách người gửi đầu tiên khớp sẽ thắng; `"*"` là phương án dự phòng ký tự đại diện.

Để biết thêm về truy cập nhóm so với cổng nhắc đến (và cách chúng tương tác), xem: [/channels/groups](/vi/channels/groups).

## NickServ

Để định danh với NickServ sau khi kết nối:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Đăng ký một lần tùy chọn khi kết nối:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Tắt `register` sau khi nick đã được đăng ký để tránh các lần thử REGISTER lặp lại.

## Biến môi trường

Tài khoản mặc định hỗ trợ:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (phân tách bằng dấu phẩy)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

Không thể đặt `IRC_HOST` từ `.env` của workspace; xem [tệp `.env` của workspace](/vi/gateway/security).

## Khắc phục sự cố

- Nếu bot kết nối nhưng không bao giờ trả lời trong kênh, hãy xác minh `channels.irc.groups` **và** liệu cổng nhắc đến có đang loại bỏ tin nhắn (`missing-mention`) hay không. Nếu bạn muốn bot trả lời mà không cần ping, hãy đặt `requireMention:false` cho kênh.
- Nếu đăng nhập thất bại, hãy xác minh nick còn khả dụng và mật khẩu máy chủ.
- Nếu TLS thất bại trên mạng tùy chỉnh, hãy xác minh host/port và thiết lập chứng chỉ.

## Liên quan

- [Tổng quan kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
