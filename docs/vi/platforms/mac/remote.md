---
read_when:
    - Thiết lập hoặc gỡ lỗi điều khiển máy Mac từ xa
summary: luồng ứng dụng macOS để điều khiển Gateway OpenClaw từ xa qua SSH
title: Điều khiển từ xa
x-i18n:
    generated_at: "2026-04-29T22:57:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 16
---

# OpenClaw từ xa (macOS ⇄ máy chủ từ xa)

Luồng này cho phép ứng dụng macOS hoạt động như một bộ điều khiển từ xa đầy đủ cho một OpenClaw gateway đang chạy trên một máy chủ khác (máy tính để bàn/máy chủ). Đây là tính năng **Remote over SSH** (chạy từ xa) của ứng dụng. Tất cả tính năng—kiểm tra tình trạng, chuyển tiếp Voice Wake và Web Chat—đều dùng lại cùng cấu hình SSH từ xa trong _Settings → General_.

## Chế độ

- **Cục bộ (máy Mac này)**: Mọi thứ chạy trên máy tính xách tay. Không dùng SSH.
- **Remote over SSH (mặc định)**: Các lệnh OpenClaw được thực thi trên máy chủ từ xa. Ứng dụng mac mở kết nối SSH với `-o BatchMode` cùng danh tính/khóa bạn chọn và một chuyển tiếp cổng cục bộ.
- **Trực tiếp từ xa (ws/wss)**: Không có đường hầm SSH. Ứng dụng mac kết nối trực tiếp đến URL của gateway (ví dụ qua Tailscale Serve hoặc reverse proxy HTTPS công khai).

## Phương thức truyền tải từ xa

Chế độ từ xa hỗ trợ hai phương thức truyền tải:

- **Đường hầm SSH** (mặc định): Dùng `ssh -N -L ...` để chuyển tiếp cổng gateway đến localhost. Gateway sẽ thấy IP của node là `127.0.0.1` vì đường hầm là loopback.
- **Trực tiếp (ws/wss)**: Kết nối thẳng đến URL của gateway. Gateway thấy IP thật của máy khách.

Ở chế độ đường hầm SSH, các tên máy LAN/tailnet được phát hiện sẽ được lưu dưới dạng
`gateway.remote.sshTarget`. Ứng dụng giữ `gateway.remote.url` trên điểm cuối đường hầm
cục bộ, ví dụ `ws://127.0.0.1:18789`, để CLI, Web Chat và
dịch vụ node-host cục bộ đều dùng cùng phương thức truyền tải local loopback an toàn.

Tự động hóa trình duyệt trong chế độ từ xa thuộc về CLI node host, không thuộc về
node của ứng dụng macOS gốc. Ứng dụng khởi động dịch vụ node host đã cài đặt khi
có thể; nếu bạn cần điều khiển trình duyệt từ máy Mac đó, hãy cài đặt/khởi động bằng
`openclaw node install ...` và `openclaw node start` (hoặc chạy
`openclaw node run ...` ở tiền cảnh), rồi nhắm đến node có khả năng dùng trình duyệt đó.

## Điều kiện tiên quyết trên máy chủ từ xa

1. Cài đặt Node + pnpm và build/cài đặt OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Đảm bảo `openclaw` nằm trong PATH cho shell không tương tác (tạo symlink vào `/usr/local/bin` hoặc `/opt/homebrew/bin` nếu cần).
3. Mở SSH với xác thực bằng khóa. Chúng tôi khuyến nghị IP **Tailscale** để có khả năng truy cập ổn định khi ở ngoài LAN.

## Thiết lập ứng dụng macOS

1. Mở _Settings → General_.
2. Trong **OpenClaw runs**, chọn **Remote over SSH** và đặt:
   - **Transport**: **Đường hầm SSH** hoặc **Trực tiếp (ws/wss)**.
   - **SSH target**: `user@host` (tùy chọn `:port`).
     - Nếu gateway nằm trên cùng LAN và quảng bá Bonjour, hãy chọn từ danh sách được phát hiện để tự động điền trường này.
   - **Gateway URL** (chỉ Trực tiếp): `wss://gateway.example.ts.net` (hoặc `ws://...` cho cục bộ/LAN).
   - **Identity file** (nâng cao): đường dẫn đến khóa của bạn.
   - **Project root** (nâng cao): đường dẫn checkout từ xa dùng cho lệnh.
   - **CLI path** (nâng cao): đường dẫn tùy chọn đến entrypoint/binary `openclaw` có thể chạy (tự động điền khi được quảng bá).
3. Nhấn **Test remote**. Thành công cho biết `openclaw status --json` từ xa chạy đúng. Lỗi thường nghĩa là có vấn đề PATH/CLI; mã thoát 127 nghĩa là không tìm thấy CLI ở máy từ xa.
4. Kiểm tra tình trạng và Web Chat giờ sẽ tự động chạy qua đường hầm SSH này.

## Web Chat

- **Đường hầm SSH**: Web Chat kết nối đến gateway qua cổng điều khiển WebSocket đã chuyển tiếp (mặc định 18789).
- **Trực tiếp (ws/wss)**: Web Chat kết nối thẳng đến URL gateway đã cấu hình.
- Không còn máy chủ HTTP WebChat riêng nữa.

## Quyền

- Máy chủ từ xa cần cùng các phê duyệt TCC như cục bộ (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Chạy onboarding trên máy đó để cấp một lần.
- Các node quảng bá trạng thái quyền qua `node.list` / `node.describe` để agent biết những gì sẵn có.

## Ghi chú bảo mật

- Ưu tiên bind loopback trên máy chủ từ xa và kết nối qua SSH hoặc Tailscale.
- Đường hầm SSH dùng kiểm tra host-key nghiêm ngặt; hãy tin cậy host key trước để nó tồn tại trong `~/.ssh/known_hosts`.
- Nếu bạn bind Gateway vào một interface không phải loopback, hãy yêu cầu xác thực Gateway hợp lệ: token, mật khẩu hoặc reverse proxy nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- Xem [Bảo mật](/vi/gateway/security) và [Tailscale](/vi/gateway/tailscale).

## Luồng đăng nhập WhatsApp (từ xa)

- Chạy `openclaw channels login --verbose` **trên máy chủ từ xa**. Quét mã QR bằng WhatsApp trên điện thoại của bạn.
- Chạy lại đăng nhập trên máy chủ đó nếu xác thực hết hạn. Kiểm tra tình trạng sẽ hiển thị các vấn đề liên kết.

## Khắc phục sự cố

- **exit 127 / không tìm thấy**: `openclaw` không nằm trong PATH cho shell không đăng nhập. Thêm nó vào `/etc/paths`, shell rc của bạn, hoặc tạo symlink vào `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: kiểm tra khả năng truy cập SSH, PATH và đảm bảo Baileys đã đăng nhập (`openclaw status --json`).
- **Web Chat bị kẹt**: xác nhận gateway đang chạy trên máy chủ từ xa và cổng được chuyển tiếp khớp với cổng WS của gateway; UI yêu cầu kết nối WS khỏe mạnh.
- **IP node hiển thị 127.0.0.1**: điều này là bình thường với đường hầm SSH. Chuyển **Transport** sang **Trực tiếp (ws/wss)** nếu bạn muốn gateway thấy IP thật của máy khách.
- **Voice Wake**: các cụm từ kích hoạt được tự động chuyển tiếp trong chế độ từ xa; không cần bộ chuyển tiếp riêng.

## Âm thanh thông báo

Chọn âm thanh cho từng thông báo từ script với `openclaw` và `node.invoke`, ví dụ:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Không còn nút bật/tắt “âm thanh mặc định” toàn cục trong ứng dụng nữa; bên gọi chọn âm thanh (hoặc không có) cho từng yêu cầu.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Truy cập từ xa](/vi/gateway/remote)
