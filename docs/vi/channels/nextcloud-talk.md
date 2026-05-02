---
read_when:
    - Đang phát triển các tính năng kênh Nextcloud Talk
summary: Trạng thái hỗ trợ, khả năng và cấu hình của Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-05-02T22:16:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4956586ae8622118dcf136f4279c6ed1c2895fd4bb4576a7f5799de600a95740
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Trạng thái: Plugin đi kèm (webhook bot). Hỗ trợ tin nhắn trực tiếp, phòng, phản ứng và tin nhắn markdown.

## Plugin đi kèm

Nextcloud Talk được phát hành dưới dạng Plugin đi kèm trong các bản phát hành OpenClaw hiện tại, vì vậy
các bản dựng đóng gói thông thường không cần cài đặt riêng.

Nếu bạn đang dùng bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh loại trừ Nextcloud Talk,
hãy cài đặt trực tiếp gói npm:

Cài đặt qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Dùng gói trần để theo dõi thẻ phát hành chính thức hiện tại. Chỉ ghim một
phiên bản chính xác khi bạn cần bản cài đặt có thể tái lập.

Bản checkout cục bộ (khi chạy từ git repo):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Chi tiết: [Plugins](/vi/tools/plugin)

## Thiết lập nhanh (người mới bắt đầu)

1. Đảm bảo Plugin Nextcloud Talk có sẵn.
   - Các bản phát hành OpenClaw đóng gói hiện tại đã đi kèm Plugin này.
   - Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
2. Trên máy chủ Nextcloud của bạn, tạo một bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Bật bot trong phần cài đặt phòng đích.
4. Cấu hình OpenClaw:
   - Cấu hình: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Hoặc env: `NEXTCLOUD_TALK_BOT_SECRET` (chỉ tài khoản mặc định)

   Thiết lập bằng CLI:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Các trường rõ ràng tương đương:

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

- Bot không thể khởi tạo DM. Người dùng phải nhắn tin cho bot trước.
- URL Webhook phải có thể được Gateway truy cập; đặt `webhookPublicUrl` nếu ở sau proxy.
- API bot không hỗ trợ tải lên phương tiện; phương tiện được gửi dưới dạng URL.
- Payload webhook không phân biệt DM với phòng; đặt `apiUser` + `apiPassword` để bật tra cứu loại phòng (nếu không, DM được xử lý như phòng).

## Kiểm soát truy cập (DM)

- Mặc định: `channels.nextcloud-talk.dmPolicy = "pairing"`. Người gửi không xác định sẽ nhận mã ghép nối.
- Phê duyệt qua:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DM công khai: `channels.nextcloud-talk.dmPolicy="open"` cộng với `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` chỉ khớp ID người dùng Nextcloud; tên hiển thị bị bỏ qua.

## Phòng (nhóm)

- Mặc định: `channels.nextcloud-talk.groupPolicy = "allowlist"` (yêu cầu nhắc đến).
- Đưa phòng vào danh sách cho phép bằng `channels.nextcloud-talk.rooms`:

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

- Để không cho phép phòng nào, giữ danh sách cho phép trống hoặc đặt `channels.nextcloud-talk.groupPolicy="disabled"`.

## Khả năng

| Tính năng          | Trạng thái          |
| --------------- | ------------- |
| Tin nhắn trực tiếp | Được hỗ trợ        |
| Phòng              | Được hỗ trợ        |
| Luồng              | Không được hỗ trợ  |
| Phương tiện        | Chỉ URL            |
| Phản ứng           | Được hỗ trợ        |
| Lệnh gốc           | Không được hỗ trợ  |

## Tham chiếu cấu hình (Nextcloud Talk)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.nextcloud-talk.enabled`: bật/tắt khởi động kênh.
- `channels.nextcloud-talk.baseUrl`: URL phiên bản Nextcloud.
- `channels.nextcloud-talk.botSecret`: secret dùng chung của bot.
- `channels.nextcloud-talk.botSecretFile`: đường dẫn secret dạng tệp thông thường. Symlink bị từ chối.
- `channels.nextcloud-talk.apiUser`: người dùng API để tra cứu phòng (phát hiện DM).
- `channels.nextcloud-talk.apiPassword`: mật khẩu API/ứng dụng để tra cứu phòng.
- `channels.nextcloud-talk.apiPasswordFile`: đường dẫn tệp mật khẩu API.
- `channels.nextcloud-talk.webhookPort`: cổng trình nghe webhook (mặc định: 8788).
- `channels.nextcloud-talk.webhookHost`: host webhook (mặc định: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: đường dẫn webhook (mặc định: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL webhook có thể truy cập từ bên ngoài.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: danh sách cho phép DM (ID người dùng). `open` yêu cầu `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: danh sách cho phép nhóm (ID người dùng).
- `channels.nextcloud-talk.rooms`: cài đặt theo từng phòng và danh sách cho phép.
- `channels.nextcloud-talk.historyLimit`: giới hạn lịch sử nhóm (0 tắt).
- `channels.nextcloud-talk.dmHistoryLimit`: giới hạn lịch sử DM (0 tắt).
- `channels.nextcloud-talk.dms`: ghi đè theo từng DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: kích thước đoạn văn bản gửi đi (ký tự).
- `channels.nextcloud-talk.chunkMode`: `length` (mặc định) hoặc `newline` để tách theo dòng trống (ranh giới đoạn văn) trước khi chia đoạn theo độ dài.
- `channels.nextcloud-talk.blockStreaming`: tắt block streaming cho kênh này.
- `channels.nextcloud-talk.blockStreamingCoalesce`: tinh chỉnh gộp block streaming.
- `channels.nextcloud-talk.mediaMaxMb`: giới hạn phương tiện gửi vào (MB).

## Liên quan

- [Tổng quan kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — xác thực DM và luồng ghép nối
- [Nhóm](/vi/channels/groups) — hành vi chat nhóm và yêu cầu nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và gia cố
