---
read_when:
    - Bạn muốn OpenClaw nhận tin nhắn trực tiếp qua Nostr
    - Bạn đang thiết lập hệ thống nhắn tin phi tập trung
summary: Kênh tin nhắn trực tiếp Nostr qua các tin nhắn được mã hóa bằng NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-07-12T07:44:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr là một plugin kênh có thể tải xuống (`@openclaw/nostr`), cho phép OpenClaw nhận và trả lời tin nhắn trực tiếp được mã hóa bằng NIP-04 qua các relay Nostr. Mỗi Gateway chỉ dùng một tài khoản; chỉ hỗ trợ tin nhắn trực tiếp.

## Cài đặt

```bash
openclaw plugins install @openclaw/nostr
```

Dùng đặc tả gói thuần túy để theo thẻ phát hành chính thức hiện tại. Chỉ ghim một phiên bản chính xác khi bạn cần quá trình cài đặt có thể tái lập.

Từ bản mã nguồn cục bộ (quy trình phát triển):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Khởi động lại Gateway sau khi cài đặt hoặc bật plugin. Sau khi plugin được cài đặt, quy trình thiết lập ban đầu (`openclaw onboard`) và `openclaw channels add` sẽ hiển thị Nostr từ danh mục kênh dùng chung.

### Thiết lập không tương tác

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Dùng `--use-env` để giữ `NOSTR_PRIVATE_KEY` trong môi trường thay vì lưu khóa trong cấu hình (chỉ áp dụng cho tài khoản mặc định).

## Thiết lập nhanh

1. Tạo một cặp khóa Nostr (nếu cần):

```bash
# Sử dụng nak
nak key generate
```

2. Thêm vào cấu hình:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Xuất khóa:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Khởi động lại Gateway.

## Tham chiếu cấu hình

| Khóa         | Kiểu     | Mặc định                                    | Mô tả                                                       |
| ------------ | -------- | ------------------------------------------- | ----------------------------------------------------------- |
| `privateKey` | string   | bắt buộc                                    | Khóa riêng tư ở định dạng `nsec` hoặc hex; cho phép tham chiếu bí mật |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL relay (WebSocket)                                       |
| `dmPolicy`   | string   | `pairing`                                   | Chính sách truy cập tin nhắn trực tiếp                      |
| `allowFrom`  | string[] | `[]`                                        | Khóa công khai của người gửi được phép                      |
| `enabled`    | boolean  | `true`                                      | Bật/tắt kênh                                                |
| `name`       | string   | -                                           | Tên hiển thị                                                |
| `profile`    | object   | -                                           | Siêu dữ liệu hồ sơ NIP-01                                   |

## Siêu dữ liệu hồ sơ

Dữ liệu hồ sơ được xuất bản dưới dạng sự kiện NIP-01 `kind:0`. Bạn có thể quản lý dữ liệu này từ giao diện điều khiển (Channels -> Nostr -> Profile) hoặc đặt trực tiếp trong cấu hình.

Ví dụ:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Bot trợ lý cá nhân qua tin nhắn trực tiếp",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Lưu ý:

- URL hồ sơ phải sử dụng `https://`.
- Việc nhập từ các relay sẽ hợp nhất các trường và giữ nguyên các giá trị ghi đè cục bộ.

## Kiểm soát truy cập

### Chính sách tin nhắn trực tiếp

- **ghép nối** (mặc định): người gửi không xác định sẽ nhận được mã ghép nối.
- **danh sách cho phép**: chỉ các khóa công khai trong `allowFrom` mới có thể gửi tin nhắn trực tiếp.
- **mở**: cho phép công khai tin nhắn trực tiếp gửi đến (yêu cầu `allowFrom: ["*"]`).
- **tắt**: bỏ qua tin nhắn trực tiếp gửi đến.

Lưu ý về thực thi:

- Chữ ký của sự kiện gửi đến được xác minh trước khi áp dụng chính sách người gửi và giải mã NIP-04, vì vậy các sự kiện giả mạo bị từ chối sớm.
- Phản hồi ghép nối được gửi mà không giải mã hoặc xử lý nội dung gốc của tin nhắn trực tiếp.
- Tin nhắn trực tiếp gửi đến bị giới hạn tốc độ (trên toàn hệ thống và theo từng người gửi), đồng thời tải trọng quá lớn bị loại bỏ trước khi giải mã.

### Ví dụ về danh sách cho phép

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Định dạng khóa

Các định dạng được chấp nhận:

- **Khóa riêng tư:** `nsec...` hoặc chuỗi hex 64 ký tự
- **Khóa công khai (`allowFrom`):** `npub...` hoặc hex

## Relay

Mặc định: `relay.damus.io` và `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Mẹo:

- Dùng 2-3 relay để dự phòng.
- Tránh dùng quá nhiều relay (độ trễ, trùng lặp).
- Relay trả phí có thể cải thiện độ tin cậy.
- Relay cục bộ phù hợp để kiểm thử (`ws://localhost:7777`).

## Hỗ trợ giao thức

| NIP    | Trạng thái       | Mô tả                                        |
| ------ | ---------------- | -------------------------------------------- |
| NIP-01 | Được hỗ trợ      | Định dạng sự kiện cơ bản + siêu dữ liệu hồ sơ |
| NIP-04 | Được hỗ trợ      | Tin nhắn trực tiếp được mã hóa (`kind:4`)    |
| NIP-17 | Đã lên kế hoạch  | Tin nhắn trực tiếp được bọc kiểu quà tặng    |
| NIP-44 | Đã lên kế hoạch  | Mã hóa có phiên bản                          |

## Kiểm thử

### Relay cục bộ

```bash
# Khởi động strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Kiểm thử thủ công

1. Ghi lại khóa công khai của bot từ nhật ký Gateway hoặc `openclaw channels status` (dạng hex; chuyển đổi sang npub trong ứng dụng khách nếu cần).
2. Mở một ứng dụng khách Nostr (Amethyst, Damus, v.v.).
3. Gửi tin nhắn trực tiếp đến khóa công khai của bot.
4. Xác minh phản hồi.

## Khắc phục sự cố

### Không nhận được tin nhắn

- Xác minh khóa riêng tư hợp lệ.
- Đảm bảo các URL relay có thể truy cập được và sử dụng `wss://` (hoặc `ws://` cho môi trường cục bộ).
- Xác nhận `enabled` không phải là `false`.
- Kiểm tra nhật ký Gateway để tìm lỗi kết nối relay.

### Không gửi được phản hồi

- Kiểm tra xem relay có chấp nhận ghi hay không.
- Xác minh kết nối đi.
- Theo dõi giới hạn tốc độ của relay.

### Phản hồi trùng lặp

- Đây là hành vi dự kiến khi sử dụng nhiều relay.
- Tin nhắn được loại bỏ trùng lặp theo ID sự kiện; chỉ lần chuyển phát đầu tiên kích hoạt phản hồi.

## Bảo mật

- Không bao giờ cam kết khóa riêng tư vào kho mã nguồn.
- Sử dụng biến môi trường cho các khóa.
- Cân nhắc sử dụng `allowlist` cho bot trong môi trường sản xuất.
- Chữ ký được xác minh trước khi áp dụng chính sách người gửi, và chính sách người gửi được thực thi trước khi giải mã, vì vậy các sự kiện giả mạo bị từ chối sớm và người gửi không xác định không thể buộc hệ thống thực hiện toàn bộ tác vụ mật mã.

## Giới hạn (MVP)

- Chỉ hỗ trợ tin nhắn trực tiếp (không hỗ trợ trò chuyện nhóm).
- Không hỗ trợ tệp đính kèm phương tiện.
- Chỉ hỗ trợ NIP-04 (đã lên kế hoạch hỗ trợ cơ chế bọc kiểu quà tặng NIP-17).

## Liên quan

- [Tổng quan về các kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — quy trình xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát bằng lượt đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố bảo mật
