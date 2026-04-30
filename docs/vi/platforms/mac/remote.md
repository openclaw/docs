---
read_when:
    - Thiết lập hoặc gỡ lỗi điều khiển Mac từ xa
summary: Luồng ứng dụng macOS để điều khiển một Gateway OpenClaw từ xa qua SSH
title: Điều khiển từ xa
x-i18n:
    generated_at: "2026-04-30T16:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# OpenClaw từ xa (macOS ⇄ máy chủ từ xa)

Luồng này cho phép ứng dụng macOS hoạt động như một bộ điều khiển từ xa đầy đủ cho Gateway OpenClaw đang chạy trên một máy chủ khác (máy tính để bàn/máy chủ). Đây là tính năng **Từ xa qua SSH** (chạy từ xa) của ứng dụng. Tất cả tính năng - kiểm tra tình trạng, chuyển tiếp Voice Wake và Web Chat - đều tái sử dụng cùng cấu hình SSH từ xa trong _Cài đặt → Chung_.

## Chế độ

- **Cục bộ (máy Mac này)**: Mọi thứ chạy trên máy tính xách tay. Không dùng SSH.
- **Từ xa qua SSH (mặc định)**: Các lệnh OpenClaw được thực thi trên máy chủ từ xa. Ứng dụng Mac mở kết nối SSH với `-o BatchMode` cùng danh tính/khóa bạn chọn và một chuyển tiếp cổng cục bộ.
- **Từ xa trực tiếp (ws/wss)**: Không có đường hầm SSH. Ứng dụng Mac kết nối trực tiếp tới URL Gateway (ví dụ: qua Tailscale Serve hoặc proxy ngược HTTPS công khai).

## Giao vận từ xa

Chế độ từ xa hỗ trợ hai giao vận:

- **Đường hầm SSH** (mặc định): Dùng `ssh -N -L ...` để chuyển tiếp cổng Gateway tới localhost. Gateway sẽ thấy IP của node là `127.0.0.1` vì đường hầm là loopback.
- **Trực tiếp (ws/wss)**: Kết nối thẳng tới URL Gateway. Gateway thấy IP máy khách thật.

Ở chế độ đường hầm SSH, tên máy chủ LAN/tailnet được phát hiện sẽ được lưu dưới dạng
`gateway.remote.sshTarget`. Ứng dụng giữ `gateway.remote.url` trên điểm cuối đường hầm
cục bộ, ví dụ `ws://127.0.0.1:18789`, để CLI, Web Chat và
dịch vụ node-host cục bộ đều dùng cùng giao vận loopback an toàn.

Tự động hóa trình duyệt trong chế độ từ xa do CLI node host sở hữu, không phải
node của ứng dụng macOS gốc. Ứng dụng khởi động dịch vụ node host đã cài đặt khi
có thể; nếu bạn cần điều khiển trình duyệt từ máy Mac đó, hãy cài đặt/khởi động bằng
`openclaw node install ...` và `openclaw node start` (hoặc chạy
`openclaw node run ...` ở foreground), rồi nhắm tới node có khả năng trình duyệt đó.

## Điều kiện tiên quyết trên máy chủ từ xa

1. Cài đặt Node + pnpm và build/cài đặt OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Đảm bảo `openclaw` nằm trong PATH cho shell không tương tác (symlink vào `/usr/local/bin` hoặc `/opt/homebrew/bin` nếu cần).
3. Mở SSH với xác thực bằng khóa. Chúng tôi khuyến nghị IP **Tailscale** để có khả năng truy cập ổn định ngoài LAN.

## Thiết lập ứng dụng macOS

1. Mở _Cài đặt → Chung_.
2. Trong **OpenClaw chạy**, chọn **Từ xa qua SSH** và đặt:
   - **Giao vận**: **Đường hầm SSH** hoặc **Trực tiếp (ws/wss)**.
   - **Mục tiêu SSH**: `user@host` (tùy chọn `:port`).
     - Nếu Gateway ở cùng LAN và quảng bá Bonjour, hãy chọn từ danh sách đã phát hiện để tự động điền trường này.
   - **URL Gateway** (chỉ Trực tiếp): `wss://gateway.example.ts.net` (hoặc `ws://...` cho cục bộ/LAN).
   - **Tệp danh tính** (nâng cao): đường dẫn tới khóa của bạn.
   - **Gốc dự án** (nâng cao): đường dẫn checkout từ xa dùng cho lệnh.
   - **Đường dẫn CLI** (nâng cao): đường dẫn tùy chọn tới entrypoint/binary `openclaw` có thể chạy (tự động điền khi được quảng bá).
3. Nhấn **Kiểm tra từ xa**. Thành công cho biết `openclaw status --json` từ xa chạy đúng. Lỗi thường là vấn đề PATH/CLI; mã thoát 127 nghĩa là không tìm thấy CLI trên máy từ xa.
4. Kiểm tra tình trạng và Web Chat giờ sẽ tự động chạy qua đường hầm SSH này.

## Web Chat

- **Đường hầm SSH**: Web Chat kết nối tới Gateway qua cổng điều khiển WebSocket được chuyển tiếp (mặc định 18789).
- **Trực tiếp (ws/wss)**: Web Chat kết nối thẳng tới URL Gateway đã cấu hình.
- Không còn máy chủ HTTP WebChat riêng nữa.

## Quyền

- Máy chủ từ xa cần cùng các phê duyệt TCC như cục bộ (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Chạy onboarding trên máy đó để cấp quyền một lần.
- Các node quảng bá trạng thái quyền qua `node.list` / `node.describe` để agent biết những gì có sẵn.

## Ghi chú bảo mật

- Ưu tiên bind loopback trên máy chủ từ xa và kết nối qua SSH hoặc Tailscale.
- Đường hầm SSH dùng kiểm tra host-key nghiêm ngặt; hãy tin cậy host key trước để nó tồn tại trong `~/.ssh/known_hosts`.
- Nếu bạn bind Gateway vào một giao diện không phải loopback, hãy yêu cầu xác thực Gateway hợp lệ: token, mật khẩu hoặc proxy ngược nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- Xem [Bảo mật](/vi/gateway/security) và [Tailscale](/vi/gateway/tailscale).

## Luồng đăng nhập WhatsApp (từ xa)

- Chạy `openclaw channels login --verbose` **trên máy chủ từ xa**. Quét mã QR bằng WhatsApp trên điện thoại của bạn.
- Chạy lại đăng nhập trên máy chủ đó nếu xác thực hết hạn. Kiểm tra tình trạng sẽ hiển thị các vấn đề liên kết.

## Khắc phục sự cố

- **exit 127 / không tìm thấy**: `openclaw` không nằm trong PATH cho shell không đăng nhập. Thêm nó vào `/etc/paths`, rc shell của bạn, hoặc symlink vào `/usr/local/bin`/`/opt/homebrew/bin`.
- **Thăm dò tình trạng thất bại**: kiểm tra khả năng truy cập SSH, PATH, và Baileys đã đăng nhập (`openclaw status --json`).
- **Web Chat bị kẹt**: xác nhận Gateway đang chạy trên máy chủ từ xa và cổng được chuyển tiếp khớp với cổng WS của Gateway; UI yêu cầu kết nối WS khỏe mạnh.
- **IP node hiển thị 127.0.0.1**: đây là điều dự kiến với đường hầm SSH. Chuyển **Giao vận** sang **Trực tiếp (ws/wss)** nếu bạn muốn Gateway thấy IP máy khách thật.
- **Dashboard hoạt động nhưng khả năng của Mac ngoại tuyến**: điều này nghĩa là kết nối điều hành/điều khiển của ứng dụng khỏe mạnh, nhưng kết nối node đồng hành chưa được kết nối hoặc thiếu bề mặt lệnh. Mở phần thiết bị trên thanh menu và kiểm tra xem Mac có đang `paired · disconnected` không. Với các điểm cuối Tailscale Serve `wss://*.ts.net`, ứng dụng phát hiện các ghim lá TLS cũ lỗi thời sau khi xoay vòng chứng chỉ, xóa ghim lỗi thời khi macOS tin cậy chứng chỉ mới và tự động thử lại. Nếu chứng chỉ không được hệ thống tin cậy hoặc máy chủ không phải tên Tailscale Serve, hãy xem lại chứng chỉ hoặc chuyển sang **Từ xa qua SSH**.
- **Voice Wake**: các cụm từ kích hoạt được tự động chuyển tiếp trong chế độ từ xa; không cần trình chuyển tiếp riêng.

## Âm thanh thông báo

Chọn âm thanh theo từng thông báo từ script với `openclaw` và `node.invoke`, ví dụ:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Không còn công tắc “âm thanh mặc định” toàn cục trong ứng dụng nữa; bên gọi chọn âm thanh (hoặc không có) theo từng yêu cầu.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Truy cập từ xa](/vi/gateway/remote)
