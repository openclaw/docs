---
read_when:
    - Đang phát triển các tính năng kênh Nextcloud Talk
summary: Trạng thái hỗ trợ, khả năng và cấu hình của Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-29T22:26:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcbe8a65adfddc95d2b4944af88f9982e23a1676752efec2bbf40cfc4dd846d2
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Trạng thái: Plugin được đóng gói sẵn (bot Webhook). Tin nhắn trực tiếp, phòng, phản ứng và tin nhắn markdown được hỗ trợ.

## Plugin được đóng gói sẵn

Nextcloud Talk được phát hành dưới dạng Plugin được đóng gói sẵn trong các bản phát hành OpenClaw hiện tại, vì vậy
các bản dựng đóng gói thông thường không cần cài đặt riêng.

Nếu bạn đang dùng bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh loại trừ Nextcloud Talk,
hãy cài đặt gói npm hiện tại khi gói đó được phát hành:

Cài đặt qua CLI (npm registry, khi có gói hiện tại):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Nếu npm báo cáo gói do OpenClaw sở hữu là đã ngừng dùng, hãy dùng bản dựng
OpenClaw được đóng gói hiện tại hoặc đường dẫn checkout cục bộ cho đến khi gói npm mới hơn
được phát hành.

Checkout cục bộ (khi chạy từ repo git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Chi tiết: [Plugins](/vi/tools/plugin)

## Thiết lập nhanh (người mới bắt đầu)

1. Đảm bảo Plugin Nextcloud Talk có sẵn.
   - Các bản phát hành OpenClaw được đóng gói hiện tại đã đóng gói sẵn Plugin này.
   - Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
2. Trên máy chủ Nextcloud của bạn, tạo một bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Bật bot trong phần cài đặt phòng đích.
4. Cấu hình OpenClaw:
   - Cấu hình: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Hoặc env: `NEXTCLOUD_TALK_BOT_SECRET` (chỉ tài khoản mặc định)

   Thiết lập CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Các trường tường minh tương đương:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Secret dựa trên tệp:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Khởi động lại Gateway (hoặc hoàn tất thiết lập).

Cấu hình tối thiểu:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Ghi chú

- Bot không thể chủ động bắt đầu DM. Người dùng phải nhắn tin cho bot trước.
- URL Webhook phải truy cập được bởi Gateway; đặt `webhookPublicUrl` nếu nằm sau proxy.
- API bot không hỗ trợ tải lên phương tiện; phương tiện được gửi dưới dạng URL.
- Payload Webhook không phân biệt DM và phòng; đặt `apiUser` + `apiPassword` để bật tra cứu loại phòng (nếu không, DM được xử lý như phòng).

## Kiểm soát truy cập (DM)

- Mặc định: `channels.nextcloud-talk.dmPolicy = "pairing"`. Người gửi không xác định sẽ nhận mã ghép đôi.
- Phê duyệt qua:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM công khai: `channels.nextcloud-talk.dmPolicy="open"` cộng với `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` chỉ khớp với ID người dùng Nextcloud; tên hiển thị bị bỏ qua.

## Phòng (nhóm)

- Mặc định: `channels.nextcloud-talk.groupPolicy = "allowlist"` (được kiểm soát bằng lượt nhắc đến).
- Đưa phòng vào allowlist bằng `channels.nextcloud-talk.rooms`:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Để không cho phép phòng nào, giữ allowlist trống hoặc đặt `channels.nextcloud-talk.groupPolicy="disabled"`.

## Khả năng

| Tính năng       | Trạng thái         |
| --------------- | ------------------ |
| Tin nhắn trực tiếp | Được hỗ trợ     |
| Phòng           | Được hỗ trợ        |
| Luồng           | Không được hỗ trợ  |
| Phương tiện     | Chỉ URL            |
| Phản ứng        | Được hỗ trợ        |
| Lệnh gốc        | Không được hỗ trợ  |

## Tham chiếu cấu hình (Nextcloud Talk)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.nextcloud-talk.enabled`: bật/tắt khởi động kênh.
- `channels.nextcloud-talk.baseUrl`: URL phiên bản Nextcloud.
- `channels.nextcloud-talk.botSecret`: secret dùng chung của bot.
- `channels.nextcloud-talk.botSecretFile`: đường dẫn secret dạng tệp thông thường. Symlink bị từ chối.
- `channels.nextcloud-talk.apiUser`: người dùng API cho tra cứu phòng (phát hiện DM).
- `channels.nextcloud-talk.apiPassword`: mật khẩu API/ứng dụng cho tra cứu phòng.
- `channels.nextcloud-talk.apiPasswordFile`: đường dẫn tệp mật khẩu API.
- `channels.nextcloud-talk.webhookPort`: cổng trình lắng nghe Webhook (mặc định: 8788).
- `channels.nextcloud-talk.webhookHost`: host Webhook (mặc định: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: đường dẫn Webhook (mặc định: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL Webhook có thể truy cập từ bên ngoài.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist DM (ID người dùng). `open` yêu cầu `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist nhóm (ID người dùng).
- `channels.nextcloud-talk.rooms`: cài đặt và allowlist theo từng phòng.
- `channels.nextcloud-talk.historyLimit`: giới hạn lịch sử nhóm (0 để tắt).
- `channels.nextcloud-talk.dmHistoryLimit`: giới hạn lịch sử DM (0 để tắt).
- `channels.nextcloud-talk.dms`: ghi đè theo từng DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: kích thước đoạn văn bản gửi đi (ký tự).
- `channels.nextcloud-talk.chunkMode`: `length` (mặc định) hoặc `newline` để tách theo dòng trống (ranh giới đoạn văn) trước khi chia đoạn theo độ dài.
- `channels.nextcloud-talk.blockStreaming`: tắt truyền phát block cho kênh này.
- `channels.nextcloud-talk.blockStreamingCoalesce`: tinh chỉnh gộp truyền phát block.
- `channels.nextcloud-talk.mediaMaxMb`: giới hạn phương tiện đến (MB).

## Liên quan

- [Tổng quan kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát bằng lượt nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
