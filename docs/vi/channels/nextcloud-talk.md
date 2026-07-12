---
read_when:
    - Phát triển các tính năng cho kênh Nextcloud Talk
summary: Trạng thái hỗ trợ, các khả năng và cấu hình của Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T07:40:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk là một plugin kênh có thể tải xuống (`@openclaw/nextcloud-talk`), kết nối OpenClaw với một phiên bản Nextcloud tự lưu trữ thông qua bot Webhook của Talk. Plugin hỗ trợ tin nhắn trực tiếp, phòng, phản ứng và tin nhắn markdown; nội dung đa phương tiện được gửi dưới dạng URL.

## Cài đặt

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Dùng thông số gói trần để theo dõi thẻ phát hành chính thức hiện tại. Chỉ ghim một phiên bản chính xác khi bạn cần một bản cài đặt có thể tái lập.

Từ bản sao mã nguồn cục bộ (quy trình phát triển):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Khởi động lại Gateway sau khi cài đặt. Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh (cho người mới bắt đầu)

1. Cài đặt plugin (ở trên).
2. Trên máy chủ Nextcloud của bạn, tạo một bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Giữ `--feature response`: nếu không có tính năng này, các phản hồi gửi đi sẽ thất bại với mã 401. Sửa một bot hiện có bằng `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Bật bot trong phần cài đặt của phòng đích.
4. Cấu hình OpenClaw:
   - Cấu hình: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Hoặc biến môi trường: `NEXTCLOUD_TALK_BOT_SECRET` (chỉ tài khoản mặc định)

   Thiết lập bằng CLI (`--url`/`--token` là bí danh của các trường tường minh; `nc-talk` và `nc` dùng được làm bí danh kênh):

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

   Bí mật lưu trong tệp:

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

- Bot không thể chủ động bắt đầu tin nhắn trực tiếp. Người dùng phải nhắn tin cho bot trước.
- Nextcloud phải có thể truy cập URL Webhook; đặt `webhookPublicUrl` khi Gateway nằm sau proxy. Các yêu cầu Webhook được ký bằng HMAC-SHA256 với bí mật của bot; chữ ký không hợp lệ sẽ bị từ chối và giới hạn tốc độ.
- API bot không hỗ trợ tải nội dung đa phương tiện lên; nội dung đa phương tiện gửi đi được nối thêm dưới dạng một dòng `Attachment: <url>`.
- Tải trọng Webhook không phân biệt tin nhắn trực tiếp với phòng; đặt `apiUser` + `apiPassword` để bật tra cứu loại phòng (được lưu vào bộ nhớ đệm khoảng 5 phút). Nếu không có các giá trị này, mọi cuộc trò chuyện đều được coi là phòng.
- Các yêu cầu gửi đi đều đi qua lớp bảo vệ SSRF. Đối với máy chủ Nextcloud nằm trên mạng riêng/nội bộ đáng tin cậy, hãy chủ động cho phép bằng `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Khi đã đặt `apiUser`/`apiPassword` và `webhookPublicUrl`, `openclaw channels status` sẽ thăm dò bot và cảnh báo khi thiếu tính năng `response`.

## Kiểm soát truy cập (tin nhắn trực tiếp)

- Mặc định: `channels.nextcloud-talk.dmPolicy = "pairing"`. Người gửi không xác định sẽ nhận được mã ghép nối.
- Phê duyệt bằng:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Tin nhắn trực tiếp công khai: `channels.nextcloud-talk.dmPolicy="open"` cùng với `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` chỉ khớp với ID người dùng Nextcloud (chuyển thành chữ thường); tên hiển thị bị bỏ qua.

## Phòng (nhóm)

- Mặc định: `channels.nextcloud-talk.groupPolicy = "allowlist"` (yêu cầu đề cập).
- Đưa phòng vào danh sách cho phép bằng `channels.nextcloud-talk.rooms`, với khóa là mã thông báo phòng; `"*"` đặt giá trị mặc định dạng ký tự đại diện:

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

- Các khóa theo từng phòng: `requireMention` (mặc định là true), `enabled` (false sẽ vô hiệu hóa phòng), `allowFrom` (danh sách người gửi được phép theo từng phòng), `tools` (ghi đè quyền cho phép/từ chối công cụ), `skills` (giới hạn các Skills được tải), `systemPrompt`.
- Để không cho phép phòng nào, hãy để trống danh sách cho phép hoặc đặt `channels.nextcloud-talk.groupPolicy="disabled"`.

## Khả năng

| Tính năng          | Trạng thái          |
| ------------------ | ------------------- |
| Tin nhắn trực tiếp | Được hỗ trợ         |
| Phòng              | Được hỗ trợ         |
| Luồng thảo luận    | Không được hỗ trợ   |
| Đa phương tiện     | Chỉ URL             |
| Phản ứng           | Được hỗ trợ         |
| Lệnh gốc           | Không được hỗ trợ   |

## Tham chiếu cấu hình (Nextcloud Talk)

Cấu hình đầy đủ: [Cấu hình](/vi/gateway/configuration)

Các tùy chọn nhà cung cấp:

- `channels.nextcloud-talk.enabled`: bật/tắt quá trình khởi động kênh.
- `channels.nextcloud-talk.baseUrl`: URL phiên bản Nextcloud.
- `channels.nextcloud-talk.botSecret`: bí mật dùng chung của bot (chuỗi hoặc tham chiếu bí mật).
- `channels.nextcloud-talk.botSecretFile`: đường dẫn đến tệp thông thường chứa bí mật. Liên kết tượng trưng bị từ chối.
- `channels.nextcloud-talk.apiUser`: người dùng API để tra cứu phòng (phát hiện tin nhắn trực tiếp) và thăm dò trạng thái.
- `channels.nextcloud-talk.apiPassword`: mật khẩu API/ứng dụng để tra cứu phòng.
- `channels.nextcloud-talk.apiPasswordFile`: đường dẫn đến tệp mật khẩu API.
- `channels.nextcloud-talk.webhookPort`: cổng trình lắng nghe Webhook (mặc định: 8788).
- `channels.nextcloud-talk.webhookHost`: máy chủ Webhook (mặc định: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: đường dẫn Webhook (mặc định: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL Webhook có thể truy cập từ bên ngoài.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing). `open` yêu cầu `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: danh sách cho phép đối với tin nhắn trực tiếp (ID người dùng).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (mặc định: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: danh sách người gửi được phép trong phòng (ID người dùng); dùng `allowFrom` làm phương án dự phòng khi chưa đặt.
- `channels.nextcloud-talk.rooms`: cài đặt và danh sách cho phép theo từng phòng (xem ở trên).
- Có thể tham chiếu các nhóm truy cập người gửi tĩnh từ `allowFrom` và `groupAllowFrom` bằng `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: giới hạn lịch sử nhóm (0 sẽ vô hiệu hóa).
- `channels.nextcloud-talk.dmHistoryLimit`: giới hạn lịch sử tin nhắn trực tiếp (0 sẽ vô hiệu hóa).
- `channels.nextcloud-talk.dms`: các ghi đè theo từng tin nhắn trực tiếp, với khóa là ID người dùng (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: kích thước đoạn văn bản gửi đi tính bằng ký tự (mặc định: 4000).
- `channels.nextcloud-talk.chunkMode`: `length` (mặc định) hoặc `newline` để chia theo các dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài.
- `channels.nextcloud-talk.blockStreaming`: vô hiệu hóa truyền phát theo khối cho kênh này.
- `channels.nextcloud-talk.blockStreamingCoalesce`: tinh chỉnh việc hợp nhất khi truyền phát theo khối.
- `channels.nextcloud-talk.responsePrefix`: tiền tố phản hồi gửi đi.
- `channels.nextcloud-talk.markdown.tables`: chế độ kết xuất bảng markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: giới hạn nội dung đa phương tiện đầu vào (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: cho phép máy chủ Nextcloud riêng/nội bộ vượt qua lớp bảo vệ SSRF.
- `channels.nextcloud-talk.accounts.<id>`: các ghi đè theo từng tài khoản (cùng các khóa); `defaultAccount` chọn tài khoản mặc định. Các biến môi trường `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` chỉ áp dụng cho tài khoản mặc định.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) — quy trình xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cơ chế yêu cầu đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
