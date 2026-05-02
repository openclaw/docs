---
read_when:
    - Bạn muốn OpenClaw nhận tin nhắn trực tiếp qua Nostr
    - Bạn đang thiết lập nhắn tin phi tập trung
summary: Kênh DM Nostr qua tin nhắn được mã hóa NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-05-02T22:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6158c22c0ffc5aea56d0ac2b68955f30c3a785013dba5410cbd70f9b689dc3c
    source_path: channels/nostr.md
    workflow: 16
---

**Trạng thái:** Plugin đi kèm tùy chọn (mặc định bị tắt cho đến khi được cấu hình).

Nostr là một giao thức phi tập trung cho mạng xã hội. Kênh này cho phép OpenClaw nhận và phản hồi tin nhắn trực tiếp (DM) được mã hóa qua NIP-04.

## Plugin đi kèm

Các bản phát hành OpenClaw hiện tại cung cấp Nostr dưới dạng Plugin đi kèm, vì vậy các bản dựng đóng gói
thông thường không cần cài đặt riêng.

### Bản cài đặt cũ/tùy chỉnh

- Onboarding (`openclaw onboard`) và `openclaw channels add` vẫn hiển thị
  Nostr từ danh mục kênh dùng chung.
- Nếu bản dựng của bạn không bao gồm Nostr đi kèm, hãy cài đặt trực tiếp gói npm.

```bash
openclaw plugins install @openclaw/nostr
```

Dùng gói trần để theo thẻ phát hành chính thức hiện tại. Chỉ ghim một
phiên bản chính xác khi bạn cần một bản cài đặt có thể tái lập.

Dùng checkout cục bộ (quy trình dev):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Khởi động lại Gateway sau khi cài đặt hoặc bật Plugin.

### Thiết lập không tương tác

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Dùng `--use-env` để giữ `NOSTR_PRIVATE_KEY` trong môi trường thay vì lưu khóa trong cấu hình.

## Thiết lập nhanh

1. Tạo một cặp khóa Nostr (nếu cần):

```bash
# Using nak
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

| Khóa         | Kiểu     | Mặc định                                    | Mô tả                                    |
| ------------ | -------- | ------------------------------------------- | ---------------------------------------- |
| `privateKey` | string   | bắt buộc                                    | Khóa riêng ở định dạng `nsec` hoặc hex   |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL relay (WebSocket)                    |
| `dmPolicy`   | string   | `pairing`                                   | Chính sách truy cập DM                   |
| `allowFrom`  | string[] | `[]`                                        | Pubkey người gửi được phép               |
| `enabled`    | boolean  | `true`                                      | Bật/tắt kênh                             |
| `name`       | string   | -                                           | Tên hiển thị                             |
| `profile`    | object   | -                                           | Siêu dữ liệu hồ sơ NIP-01                |

## Siêu dữ liệu hồ sơ

Dữ liệu hồ sơ được xuất bản dưới dạng sự kiện NIP-01 `kind:0`. Bạn có thể quản lý dữ liệu này từ Control UI (Channels -> Nostr -> Profile) hoặc đặt trực tiếp trong cấu hình.

Ví dụ:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
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

Ghi chú:

- URL hồ sơ phải dùng `https://`.
- Nhập từ relay sẽ hợp nhất các trường và giữ nguyên các ghi đè cục bộ.

## Kiểm soát truy cập

### Chính sách DM

- **pairing** (mặc định): người gửi không xác định nhận được mã ghép đôi.
- **allowlist**: chỉ pubkey trong `allowFrom` mới có thể DM.
- **open**: DM công khai gửi vào (yêu cầu `allowFrom: ["*"]`).
- **disabled**: bỏ qua DM gửi vào.

Ghi chú thực thi:

- Chữ ký sự kiện gửi vào được xác minh trước chính sách người gửi và giải mã NIP-04, vì vậy sự kiện giả mạo bị từ chối sớm.
- Phản hồi ghép đôi được gửi mà không xử lý nội dung DM gốc.
- DM gửi vào bị giới hạn tốc độ và payload quá lớn bị loại bỏ trước khi giải mã.

### Ví dụ danh sách cho phép

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

Định dạng được chấp nhận:

- **Khóa riêng:** `nsec...` hoặc hex 64 ký tự
- **Pubkey (`allowFrom`):** `npub...` hoặc hex

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

| NIP    | Trạng thái | Mô tả                                      |
| ------ | ---------- | ------------------------------------------ |
| NIP-01 | Được hỗ trợ | Định dạng sự kiện cơ bản + siêu dữ liệu hồ sơ |
| NIP-04 | Được hỗ trợ | DM được mã hóa (`kind:4`)                  |
| NIP-17 | Đã lên kế hoạch | DM bọc quà                              |
| NIP-44 | Đã lên kế hoạch | Mã hóa có phiên bản                     |

## Kiểm thử

### Relay cục bộ

```bash
# Start strfry
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

1. Ghi lại pubkey của bot (npub) từ log.
2. Mở một ứng dụng khách Nostr (Damus, Amethyst, v.v.).
3. Gửi DM tới pubkey của bot.
4. Xác minh phản hồi.

## Khắc phục sự cố

### Không nhận được tin nhắn

- Xác minh khóa riêng hợp lệ.
- Đảm bảo URL relay có thể truy cập và dùng `wss://` (hoặc `ws://` cho cục bộ).
- Xác nhận `enabled` không phải là `false`.
- Kiểm tra log Gateway để tìm lỗi kết nối relay.

### Không gửi được phản hồi

- Kiểm tra relay có chấp nhận ghi hay không.
- Xác minh kết nối gửi ra.
- Theo dõi giới hạn tốc độ của relay.

### Phản hồi trùng lặp

- Đây là hành vi dự kiến khi dùng nhiều relay.
- Tin nhắn được khử trùng lặp theo ID sự kiện; chỉ lần gửi đầu tiên kích hoạt phản hồi.

## Bảo mật

- Không bao giờ commit khóa riêng.
- Dùng biến môi trường cho khóa.
- Cân nhắc `allowlist` cho bot production.
- Chữ ký được xác minh trước chính sách người gửi, và chính sách người gửi được thực thi trước khi giải mã, vì vậy sự kiện giả mạo bị từ chối sớm và người gửi không xác định không thể buộc thực hiện toàn bộ công việc mật mã.

## Giới hạn (MVP)

- Chỉ tin nhắn trực tiếp (không có trò chuyện nhóm).
- Không có tệp đính kèm phương tiện.
- Chỉ NIP-04 (đã lên kế hoạch gift-wrap NIP-17).

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
