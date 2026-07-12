---
read_when:
    - Phát triển các tính năng cho kênh Google Chat
summary: Trạng thái hỗ trợ, khả năng và cấu hình của ứng dụng Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T07:39:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat hoạt động dưới dạng plugin chính thức `@openclaw/googlechat`: hỗ trợ tin nhắn trực tiếp và không gian thông qua Webhook của Google Chat API (chỉ điểm cuối HTTP, không hỗ trợ Pub/Sub).

## Cài đặt

```bash
openclaw plugins install @openclaw/googlechat
```

Bản mã nguồn cục bộ (khi chạy từ kho git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Thiết lập nhanh (dành cho người mới)

1. Tạo một dự án Google Cloud và bật **Google Chat API**.
   - Truy cập: [Thông tin xác thực Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Bật API nếu chưa được bật.
2. Tạo một **Service Account**:
   - Nhấn **Create Credentials** > **Service Account**.
   - Đặt tên tùy ý (ví dụ: `openclaw-chat`).
   - Để trống quyền và chủ thể (**Continue**, sau đó **Done**).
3. Tạo và tải xuống **khóa JSON**:
   - Nhấp vào tài khoản dịch vụ mới > thẻ **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Lưu tệp JSON đã tải xuống trên máy chủ Gateway của bạn (ví dụ: `~/.openclaw/googlechat-service-account.json`).
5. Tạo ứng dụng Google Chat trong [Cấu hình Chat trên Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Điền **Application info** (tên ứng dụng, URL ảnh đại diện, mô tả).
   - Bật **Interactive features**.
   - Trong **Functionality**, chọn **Join spaces and group conversations**.
   - Trong **Connection settings**, chọn **HTTP endpoint URL**.
   - Trong **Triggers**, chọn **Use a common HTTP endpoint URL for all triggers** và đặt thành URL Gateway công khai của bạn, theo sau là `/googlechat` (xem [URL công khai](#public-url-webhook-only)).
   - Trong **Visibility**, chọn **Make this Chat app available to specific people and groups in `<Your Domain>`** và nhập địa chỉ email của bạn.
   - Nhấp **Save**.
6. Bật trạng thái ứng dụng: làm mới trang, tìm **App status**, đặt thành **Live - available to users**, rồi **Save** lần nữa.
7. Cấu hình OpenClaw bằng tài khoản dịch vụ và đối tượng nhận Webhook (phải khớp với cấu hình ứng dụng Chat):
   - Biến môi trường: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (chỉ dành cho tài khoản mặc định), hoặc
   - Cấu hình: xem [Các điểm chính về cấu hình](#config-highlights). `openclaw channels add --channel googlechat` cũng chấp nhận `--audience-type`, `--audience`, `--webhook-path` và `--webhook-url`.
8. Khởi động Gateway. Google Chat sẽ gửi yêu cầu POST đến đường dẫn Webhook của bạn (mặc định là `/googlechat`).

## Thêm vào Google Chat

Sau khi Gateway đang chạy và email của bạn có trong danh sách hiển thị:

1. Truy cập [Google Chat](https://chat.google.com/).
2. Nhấp vào biểu tượng **+** (dấu cộng) bên cạnh **Direct Messages**.
3. Tìm kiếm theo **App name** mà bạn đã cấu hình trong Google Cloud Console.
   - Bot _không_ xuất hiện trong danh sách duyệt Marketplace vì đây là ứng dụng riêng tư; hãy tìm kiếm theo tên.
4. Chọn bot, nhấp **Add** hoặc **Chat**, rồi gửi tin nhắn.

## URL công khai (chỉ Webhook)

Webhook của Google Chat yêu cầu một điểm cuối HTTPS công khai. Để bảo mật, **chỉ công khai đường dẫn `/googlechat`** trên Internet và giữ bảng điều khiển OpenClaw cùng các điểm cuối khác ở chế độ riêng tư.

### Phương án A: Tailscale Funnel (Khuyên dùng)

Sử dụng Tailscale Serve cho bảng điều khiển riêng tư và Funnel cho đường dẫn Webhook công khai.

1. Kiểm tra địa chỉ mà Gateway đang liên kết:

   ```bash
   ss -tlnp | grep 18789
   ```

   Ghi lại địa chỉ IP (ví dụ: `127.0.0.1`, `0.0.0.0` hoặc địa chỉ Tailscale `100.x.x.x`).

2. Chỉ công khai bảng điều khiển trong tailnet (cổng 8443):

   ```bash
   # Nếu liên kết với localhost (127.0.0.1 hoặc 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Nếu chỉ liên kết với IP Tailscale:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Chỉ công khai đường dẫn Webhook:

   ```bash
   # Nếu liên kết với localhost (127.0.0.1 hoặc 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Nếu chỉ liên kết với IP Tailscale:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Nếu được nhắc, hãy truy cập URL ủy quyền hiển thị trong đầu ra để bật Funnel cho Node này.

5. Xác minh:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

URL Webhook công khai của bạn là `https://<node-name>.<tailnet>.ts.net/googlechat`; bảng điều khiển vẫn chỉ khả dụng trong tailnet tại `https://<node-name>.<tailnet>.ts.net:8443/`. Sử dụng URL công khai (không có `:8443`) trong cấu hình ứng dụng Google Chat.

> Lưu ý: Cấu hình này vẫn được duy trì sau khi khởi động lại. Sau này, có thể xóa cấu hình bằng `tailscale funnel reset` và `tailscale serve reset`.

### Phương án B: Proxy ngược (Caddy)

Chỉ chuyển tiếp đường dẫn Webhook:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Các yêu cầu đến `your-domain.com/` sẽ bị bỏ qua hoặc trả về 404, trong khi `your-domain.com/googlechat` được định tuyến đến OpenClaw.

### Phương án C: Cloudflare Tunnel

Cấu hình các quy tắc đầu vào của đường hầm để chỉ định tuyến đường dẫn Webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## Cách hoạt động

1. Google Chat gửi JSON bằng phương thức POST đến đường dẫn Webhook của Gateway (chỉ POST, bắt buộc loại nội dung JSON và giới hạn tốc độ theo IP).
2. OpenClaw xác thực mọi yêu cầu trước khi chuyển tiếp:
   - Các sự kiện của ứng dụng Chat mang `Authorization: Bearer <token>`; token được xác minh trước khi phân tích toàn bộ phần thân.
   - Các sự kiện Tiện ích bổ sung Google Workspace mang token trong phần thân (`authorizationEventObject.systemIdToken`) và được đọc theo hạn mức tiền xác thực nghiêm ngặt hơn (16 KB, 3 giây) trước khi xác minh.
3. Token được kiểm tra dựa trên `audienceType` + `audience`:
   - `audienceType: "app-url"` → đối tượng nhận là URL Webhook HTTPS của bạn.
   - `audienceType: "project-number"` → đối tượng nhận là số dự án Cloud.
   - Token của tiện ích bổ sung khi dùng `app-url` còn yêu cầu `appPrincipal` được đặt thành mã máy khách OAuth 2.0 dạng số của ứng dụng (21 chữ số, không phải email); nếu không, quá trình xác minh sẽ thất bại và ghi cảnh báo vào nhật ký.
4. Tin nhắn được định tuyến theo không gian:
   - Các không gian có phiên riêng cho từng không gian `agent:<agentId>:googlechat:group:<spaceId>`; phản hồi được gửi đến luồng tin nhắn.
   - Theo mặc định, các tin nhắn trực tiếp được gộp vào phiên chính của tác tử; đặt `session.dmScope` để sử dụng phiên tin nhắn trực tiếp riêng cho từng đối tác (xem [Phiên](/vi/concepts/session)).
5. Theo mặc định, quyền truy cập tin nhắn trực tiếp sử dụng cơ chế ghép nối. Người gửi chưa xác định sẽ nhận mã ghép nối; phê duyệt bằng:
   - `openclaw pairing approve googlechat <code>`
6. Theo mặc định, không gian nhóm yêu cầu đề cập bằng @. Các lượt đề cập được phát hiện từ chú thích `USER_MENTION` của Chat nhắm đến ứng dụng; đặt `botUser` (ví dụ: `users/1234567890`) nếu việc phát hiện cần tên tài nguyên người dùng của ứng dụng.
7. Khi yêu cầu phê duyệt thực thi hoặc Plugin bắt đầu từ Google Chat và đã cấu hình người phê duyệt `users/<id>` ổn định, OpenClaw đăng một thẻ phê duyệt gốc (`cardsV2`) trong không gian hoặc luồng khởi nguồn. Các nút trên thẻ mang token gọi lại không rõ nghĩa; lời nhắc thủ công `/approve <id> <decision>` chỉ xuất hiện khi không thể phân phối theo cách gốc.

## Đích

Sử dụng các mã định danh sau để phân phối và lập danh sách cho phép:

- Tin nhắn trực tiếp: `users/<userId>` (khuyên dùng).
- Không gian: `spaces/<spaceId>`.
- Email thô `name@example.com` có thể thay đổi và chỉ được dùng để đối chiếu danh sách cho phép khi `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Không còn khuyến nghị: `users/<email>` được xem là mã định danh người dùng, không phải mục email trong danh sách cho phép.
- Các tiền tố `googlechat:`, `google-chat:` và `gchat:` được chấp nhận và loại bỏ.

## Các điểm chính về cấu hình

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // add-on verification only; numeric OAuth client ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Lưu ý:

- Thông tin xác thực tài khoản dịch vụ: `serviceAccountFile` (đường dẫn), `serviceAccount` (chuỗi hoặc đối tượng JSON nội tuyến) hoặc `serviceAccountRef` (SecretRef từ biến môi trường/tệp). Các biến môi trường `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON nội tuyến) và `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (đường dẫn) chỉ áp dụng cho tài khoản mặc định. Thiết lập nhiều tài khoản sử dụng `channels.googlechat.accounts.<id>` với cùng các khóa, bao gồm `serviceAccountRef` riêng cho từng tài khoản.
- Đường dẫn Webhook mặc định là `/googlechat` khi chưa đặt `webhookPath`; `webhookUrl` cũng có thể cung cấp đường dẫn.
- Khóa nhóm phải là mã định danh không gian ổn định (`spaces/<spaceId>`). Khóa theo tên hiển thị không còn được khuyến nghị và sẽ được ghi nhận tương ứng trong nhật ký.
- `dangerouslyAllowNameMatching` bật lại việc đối chiếu chủ thể email có thể thay đổi cho danh sách cho phép (chế độ tương thích khẩn cấp); doctor cảnh báo về các mục email.
- Các thao tác phản ứng của Google Chat không được cung cấp. Plugin sử dụng xác thực bằng tài khoản dịch vụ, trong khi các điểm cuối phản ứng của Google Chat yêu cầu xác thực người dùng. Cấu hình `actions.reactions` hiện có được chấp nhận để tương thích nhưng không có tác dụng.
- Thẻ phê duyệt gốc sử dụng lượt nhấp nút `cardsV2` của Google Chat, không sử dụng sự kiện phản ứng. Người phê duyệt lấy từ `dm.allowFrom` hoặc `defaultTo` và phải là giá trị số ổn định `users/<id>`.
- Các thao tác tin nhắn chỉ cung cấp `send` dạng văn bản. Tải tệp đính kèm lên Google Chat yêu cầu xác thực người dùng, trong khi Plugin này sử dụng xác thực bằng tài khoản dịch vụ, vì vậy không cung cấp tính năng tải tệp đi lên.
- `typingIndicator`: `message` (mặc định) đăng phần giữ chỗ `_<Bot> is typing..._` rồi chỉnh sửa thành phản hồi đầu tiên; `none` vô hiệu hóa tính năng này; `reaction` yêu cầu OAuth người dùng và hiện sẽ chuyển về `message`, đồng thời ghi lỗi vào nhật ký khi dùng xác thực bằng tài khoản dịch vụ.
- Tệp đính kèm đến (tệp đầu tiên trong mỗi tin nhắn) được tải xuống thông qua Chat API vào quy trình xử lý phương tiện, với giới hạn `mediaMaxMb` (mặc định là 20).
- Theo mặc định, tin nhắn do bot tạo bị bỏ qua. Với `allowBots: true`, tin nhắn bot được chấp nhận sử dụng [cơ chế bảo vệ vòng lặp bot](/vi/channels/bot-loop-protection) dùng chung: cấu hình `channels.defaults.botLoopProtection`, sau đó ghi đè bằng `channels.googlechat.botLoopProtection` hoặc `channels.googlechat.groups.<space>.botLoopProtection`.

Chi tiết tham chiếu bí mật: [Quản lý bí mật](/vi/gateway/secrets).

## Khắc phục sự cố

### 405 Phương thức không được phép

Nếu Trình khám phá nhật ký Google Cloud hiển thị các lỗi như:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Trình xử lý Webhook chưa được đăng ký. Các nguyên nhân thường gặp:

1. **Kênh chưa được cấu hình**: thiếu phần `channels.googlechat`. Xác minh bằng:

   ```bash
   openclaw config get channels.googlechat
   ```

   Nếu lệnh trả về "Config path not found", hãy thêm cấu hình (xem [Các điểm chính về cấu hình](#config-highlights)).

2. **Plugin chưa được bật**: kiểm tra trạng thái Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Nếu hiển thị "disabled", hãy thêm `plugins.entries.googlechat.enabled: true` vào cấu hình.

3. **Gateway chưa được khởi động lại** sau khi thay đổi cấu hình:

   ```bash
   openclaw gateway restart
   ```

Xác minh kênh đang chạy:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Các sự cố khác

- `openclaw channels status --probe` hiển thị lỗi xác thực và cấu hình đối tượng nhận còn thiếu (bắt buộc phải có cả `audience` và `audienceType`).
- Nếu không nhận được tin nhắn, hãy xác nhận URL Webhook và cấu hình trình kích hoạt của ứng dụng Chat.
- Nếu cơ chế kiểm soát đề cập chặn phản hồi, hãy đặt `botUser` thành tên tài nguyên người dùng của ứng dụng và kiểm tra `requireMention`.
- Chạy `openclaw logs --follow` trong khi gửi tin nhắn thử nghiệm để biết yêu cầu có đến được Gateway hay không.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả các kênh được hỗ trợ
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Cấu hình Gateway](/vi/gateway/configuration)
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cơ chế chỉ phản hồi khi được nhắc đến
- [Ghép nối](/vi/channels/pairing) — quy trình xác thực tin nhắn trực tiếp và ghép nối
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
