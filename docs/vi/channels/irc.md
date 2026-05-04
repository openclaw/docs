---
read_when:
    - Bạn muốn kết nối OpenClaw với các kênh IRC hoặc tin nhắn trực tiếp
    - Bạn đang cấu hình danh sách cho phép IRC, chính sách nhóm hoặc kiểm soát việc đề cập
summary: Thiết lập Plugin IRC, kiểm soát truy cập và khắc phục sự cố
title: IRC
x-i18n:
    generated_at: "2026-05-04T02:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43c3098fe49a5e7405443df73e1bf752a579460dc0b2070c3d07f43b512bb555
    source_path: channels/irc.md
    workflow: 16
---

Sử dụng IRC khi bạn muốn dùng OpenClaw trong các kênh cổ điển (`#room`) và tin nhắn trực tiếp.
IRC được phát hành dưới dạng Plugin đi kèm, nhưng được cấu hình trong cấu hình chính dưới `channels.irc`.

## Bắt đầu nhanh

1. Bật cấu hình IRC trong `~/.openclaw/openclaw.json`.
2. Đặt ít nhất:

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

Nên dùng máy chủ IRC riêng cho việc điều phối bot. Nếu bạn chủ ý dùng một mạng IRC công khai, các lựa chọn phổ biến gồm Libera.Chat, OFTC và Snoonet. Tránh các kênh công khai dễ đoán cho lưu lượng backchannel của bot hoặc swarm.

3. Khởi động/bắt đầu lại gateway:

```bash
openclaw gateway run
```

## Mặc định bảo mật

- IRC sử dụng socket TCP/TLS thô bên ngoài định tuyến proxy chuyển tiếp do người vận hành OpenClaw quản lý. Trong các triển khai yêu cầu toàn bộ lưu lượng đi ra phải đi qua proxy chuyển tiếp đó, hãy đặt `channels.irc.enabled=false` trừ khi lưu lượng IRC đi ra trực tiếp được phê duyệt rõ ràng.
- `channels.irc.dmPolicy` mặc định là `"pairing"`.
- `channels.irc.groupPolicy` mặc định là `"allowlist"`.
- Với `groupPolicy="allowlist"`, đặt `channels.irc.groups` để định nghĩa các kênh được phép.
- Dùng TLS (`channels.irc.tls=true`) trừ khi bạn chủ ý chấp nhận truyền tải văn bản thuần.

## Kiểm soát truy cập

Có hai “cổng” riêng cho các kênh IRC:

1. **Truy cập kênh** (`groupPolicy` + `groups`): bot có chấp nhận tin nhắn từ một kênh hay không.
2. **Truy cập người gửi** (`groupAllowFrom` / `groups["#channel"].allowFrom` theo từng kênh): ai được phép kích hoạt bot bên trong kênh đó.

Các khóa cấu hình:

- Danh sách cho phép DM (quyền truy cập của người gửi DM): `channels.irc.allowFrom`
- Danh sách cho phép người gửi trong nhóm (quyền truy cập của người gửi trong kênh): `channels.irc.groupAllowFrom`
- Điều khiển theo từng kênh (quy tắc kênh + người gửi + đề cập): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` cho phép các kênh chưa được cấu hình (**mặc định vẫn bị kiểm soát bằng đề cập**)

Các mục trong danh sách cho phép nên dùng danh tính người gửi ổn định (`nick!user@host`).
Khớp nick trần có thể thay đổi và chỉ được bật khi `channels.irc.dangerouslyAllowNameMatching: true`.

### Lỗi thường gặp: `allowFrom` dành cho DM, không phải kênh

Nếu bạn thấy nhật ký như:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…điều đó nghĩa là người gửi không được phép đối với tin nhắn **nhóm/kênh**. Khắc phục bằng cách:

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

## Kích hoạt trả lời (đề cập)

Ngay cả khi một kênh được phép (qua `groupPolicy` + `groups`) và người gửi được phép, OpenClaw mặc định **kiểm soát bằng đề cập** trong ngữ cảnh nhóm.

Điều đó nghĩa là bạn có thể thấy nhật ký như `drop channel … (missing-mention)` trừ khi tin nhắn có mẫu đề cập khớp với bot.

Để bot trả lời trong một kênh IRC **mà không cần đề cập**, hãy tắt kiểm soát bằng đề cập cho kênh đó:

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

Hoặc để cho phép **tất cả** các kênh IRC (không có danh sách cho phép theo từng kênh) và vẫn trả lời không cần đề cập:

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

Nếu bạn cho phép `allowFrom: ["*"]` trong một kênh công khai, bất kỳ ai cũng có thể prompt bot.
Để giảm rủi ro, hãy hạn chế công cụ cho kênh đó.

### Cùng bộ công cụ cho mọi người trong kênh

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

Dùng `toolsBySender` để áp dụng chính sách chặt hơn cho `"*"` và chính sách thoáng hơn cho nick của bạn:

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
- Chính sách người gửi khớp đầu tiên sẽ thắng; `"*"` là dự phòng ký tự đại diện.

Để biết thêm về truy cập nhóm so với kiểm soát bằng đề cập (và cách chúng tương tác), xem: [/channels/groups](/vi/channels/groups).

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

Tắt `register` sau khi nick đã được đăng ký để tránh lặp lại các lần thử REGISTER.

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

Không thể đặt `IRC_HOST` từ `.env` của workspace; xem [Tệp `.env` của workspace](/vi/gateway/security).

## Khắc phục sự cố

- Nếu bot kết nối nhưng không bao giờ trả lời trong kênh, hãy xác minh `channels.irc.groups` **và** liệu kiểm soát bằng đề cập có đang loại bỏ tin nhắn hay không (`missing-mention`). Nếu bạn muốn bot trả lời không cần ping, đặt `requireMention:false` cho kênh.
- Nếu đăng nhập thất bại, hãy xác minh nick còn khả dụng và mật khẩu máy chủ.
- Nếu TLS thất bại trên mạng tùy chỉnh, hãy xác minh host/port và thiết lập chứng chỉ.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát bằng đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
