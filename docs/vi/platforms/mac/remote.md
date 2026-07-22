---
read_when:
    - Thiết lập hoặc gỡ lỗi điều khiển máy Mac từ xa
summary: Luồng ứng dụng macOS để điều khiển Gateway OpenClaw từ xa
title: Điều khiển từ xa
x-i18n:
    generated_at: "2026-07-22T02:12:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7238ff381b93223f96236246a96190ee1d62fa4313bff272ec24be9439fb7a8d
    source_path: platforms/mac/remote.md
    workflow: 16
---

Luồng này cho phép ứng dụng macOS hoạt động như một bộ điều khiển từ xa đầy đủ cho Gateway OpenClaw đang chạy trên một máy chủ khác (máy tính để bàn/máy chủ). Ứng dụng kết nối trực tiếp với các URL Gateway LAN/Tailnet đáng tin cậy hoặc quản lý đường hầm SSH khi Gateway từ xa chỉ liên kết với loopback. Các lượt kiểm tra tình trạng, chuyển tiếp Voice Wake và Web Chat sử dụng lại cùng cấu hình từ xa trong _Settings -> General_.

## Chế độ

- **Cục bộ (máy Mac này)**: mọi thứ chạy trên máy tính xách tay; không sử dụng SSH.
- **Từ xa qua SSH (mặc định)**: các lệnh OpenClaw chạy trên máy chủ từ xa. Ứng dụng mở kết nối SSH bằng `-o BatchMode`, danh tính/khóa bạn đã chọn và một cổng chuyển tiếp cục bộ.
- **Kết nối trực tiếp từ xa (ws/wss)**: không có đường hầm SSH; ứng dụng kết nối trực tiếp với URL Gateway (LAN, Tailscale, Tailscale Serve hoặc proxy ngược HTTPS công khai).

## Phương thức truyền tải từ xa

- **Đường hầm SSH** (mặc định): sử dụng `ssh -N -L ...` để chuyển tiếp cổng Gateway đến localhost. Gateway thấy IP của Node là `127.0.0.1` vì đường hầm sử dụng loopback.
- **Trực tiếp (ws/wss)**: kết nối thẳng đến URL Gateway. Gateway thấy IP thực của máy khách.

Ứng dụng vô hiệu hóa tính năng ghép kênh kết nối SSH và chạy nền sau xác thực cho các tiến trình SSH của chính ứng dụng để có thể giám sát và khởi động lại chính xác tiến trình đó, ngay cả khi bí danh đã chọn bật `ControlMaster` hoặc `ForkAfterAuthentication`.

Theo mặc định, việc xác minh khóa máy chủ SSH được thực hiện nghiêm ngặt vì thông tin xác thực Gateway truyền qua đường hầm này. Để chọn sử dụng cơ chế tin cậy riêng của một bí danh SSH được quản lý, hãy đặt `--ssh-host-key-policy openssh` qua `openclaw-mac configure-remote`, hoặc đặt trực tiếp `gateway.remote.sshHostKeyPolicy` thành `"openssh"`. Hãy xem xét bí danh và mọi cấu hình `Host *` tương ứng hoặc cấu hình hệ thống trước khi chọn sử dụng. Việc thay đổi đích SSH (trong ứng dụng hoặc qua `configure-remote`) sẽ đặt lại chính sách về `strict`, trừ khi bạn chủ động chọn lại cho đích mới.

Ở chế độ đường hầm SSH, tên máy chủ LAN/tailnet được phát hiện sẽ được lưu dưới dạng `gateway.remote.sshTarget`. Ứng dụng giữ `gateway.remote.url` trên điểm cuối đường hầm cục bộ (ví dụ: `ws://127.0.0.1:18789`) để CLI, Web Chat và dịch vụ máy chủ Node cục bộ đều sử dụng cùng phương thức truyền tải loopback. Khi quá trình phát hiện trả về cả IP Tailnet thô và tên máy chủ ổn định, ứng dụng ưu tiên tên Tailscale MagicDNS hoặc LAN để kết nối có khả năng duy trì tốt hơn khi địa chỉ thay đổi. Nếu cổng đường hầm cục bộ khác với cổng Gateway từ xa, hãy đặt `gateway.remote.remotePort` thành cổng trên máy chủ từ xa.

Trong chế độ từ xa, tính năng tự động hóa trình duyệt do máy chủ Node của CLI sở hữu, không phải Node của ứng dụng macOS gốc. Ứng dụng khởi động dịch vụ máy chủ Node đã cài đặt khi có thể; để bật khả năng điều khiển trình duyệt từ máy Mac đó, hãy cài đặt/khởi động dịch vụ bằng `openclaw node install ...` và `openclaw node start` (hoặc chạy `openclaw node run ...` ở tiền cảnh), sau đó chọn Node có khả năng sử dụng trình duyệt đó làm đích.

## Điều kiện tiên quyết trên máy chủ từ xa

1. Cài đặt Node + pnpm và xây dựng/cài đặt OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Đảm bảo `openclaw` nằm trong PATH của các shell không tương tác (tạo liên kết tượng trưng vào `/usr/local/bin` hoặc `/opt/homebrew/bin` nếu cần).
3. Đối với phương thức truyền tải SSH: thiết lập xác thực SSH dựa trên khóa. Nên dùng IP Tailscale để duy trì khả năng truy cập ổn định khi ở ngoài LAN.

## Thiết lập ứng dụng macOS

Để cấu hình sẵn ứng dụng mà không cần luồng chào mừng, qua SSH:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Hoặc đối với một Gateway đã có thể truy cập trên LAN hoặc Tailnet đáng tin cậy, bỏ qua hoàn toàn SSH:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

`openclaw-mac connect`, `wizard` và `configure-remote` phân giải cấu hình đang hoạt động theo thứ tự sau: `OPENCLAW_CONFIG_PATH`, sau đó `$OPENCLAW_STATE_DIR/openclaw.json`, rồi `~/.openclaw/openclaw.json`. Cả hai hình thức cấu hình đều ghi vào tệp đang hoạt động đó, đánh dấu quá trình thiết lập ban đầu là hoàn tất và cho phép ứng dụng quản lý phương thức truyền tải đã chọn trong lần khởi động tiếp theo. `--local-port`/`--remote-port` mặc định là `18789`. Các cờ khác: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Chạy `openclaw-mac configure-remote --help` để xem tài liệu tham khảo đầy đủ.

Để cấu hình từ giao diện người dùng:

1. Mở _Settings -> General_.
2. Trong **OpenClaw runs**, chọn **Remote** và thiết lập:
   - **Transport**: **SSH tunnel** hoặc **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:port` không bắt buộc). Nếu Gateway nằm trên cùng LAN và quảng bá qua Bonjour, hãy chọn Gateway từ danh sách được phát hiện để tự động điền trường này.
   - **Gateway URL** (chỉ dành cho Direct): `wss://gateway.example.ts.net` (hoặc `ws://...` đối với cục bộ/LAN).
   - **Identity file** (nâng cao): đường dẫn đến khóa của bạn.
   - **Project root** (nâng cao): đường dẫn checkout từ xa được dùng cho các lệnh.
   - **CLI path** (nâng cao): đường dẫn không bắt buộc đến điểm vào/tệp nhị phân `openclaw` có thể chạy (được tự động điền khi được quảng bá).
3. Nhấn **Test remote**. Thành công nghĩa là `openclaw status --json` từ xa đã chạy đúng cách. Lỗi thường do vấn đề về PATH/CLI; mã thoát 127 nghĩa là không tìm thấy CLI trên máy từ xa.
4. Các lượt kiểm tra tình trạng và Web Chat giờ đây tự động chạy qua phương thức truyền tải đã chọn.

## Web Chat

- **Đường hầm SSH**: kết nối với Gateway qua cổng điều khiển WebSocket được chuyển tiếp (mặc định là 18789).
- **Trực tiếp (ws/wss)**: kết nối thẳng đến URL Gateway đã cấu hình.
- Không có máy chủ HTTP Web Chat riêng biệt.

## Quyền

- Máy chủ từ xa cần các phê duyệt TCC giống như máy cục bộ (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Chạy quy trình thiết lập ban đầu một lần trên máy đó để cấp các quyền này.
- Các Node quảng bá trạng thái quyền của chúng qua `node.list` / `node.describe` để các agent biết những gì khả dụng.

## Lưu ý về bảo mật

- Ưu tiên liên kết loopback trên máy chủ từ xa và kết nối qua SSH, Tailscale Serve hoặc URL trực tiếp Tailnet/LAN đáng tin cậy.
- Theo mặc định, đường hầm SSH yêu cầu khóa máy chủ đã được tin cậy từ trước. Trước tiên, hãy tin cậy khóa máy chủ (thêm khóa vào tệp known-hosts đã cấu hình), hoặc đặt rõ ràng `gateway.remote.sshHostKeyPolicy: "openssh"` cho bí danh được quản lý có chính sách tin cậy OpenSSH mà bạn chấp nhận.
- Nếu bạn liên kết Gateway với một giao diện không phải loopback, hãy yêu cầu xác thực Gateway hợp lệ: token, mật khẩu hoặc proxy ngược nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- Xem [Bảo mật](/vi/gateway/security) và [Tailscale](/vi/gateway/tailscale).

## Luồng đăng nhập WhatsApp (từ xa)

- Chạy `openclaw channels login --channel whatsapp --verbose` **trên máy chủ từ xa**. Quét mã QR bằng WhatsApp trên điện thoại của bạn.
- Chạy lại quy trình đăng nhập trên máy chủ đó nếu xác thực hết hạn. Lượt kiểm tra tình trạng sẽ hiển thị các vấn đề liên kết.

## Khắc phục sự cố

| Triệu chứng                                          | Nguyên nhân / cách khắc phục                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / không tìm thấy                           | `openclaw` không nằm trong PATH đối với shell không đăng nhập. Thêm mục này vào `/etc/paths`, tệp rc của shell hoặc tạo liên kết tượng trưng vào `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Kiểm tra tình trạng không thành công                              | Kiểm tra khả năng kết nối SSH, PATH và bảo đảm Baileys (WhatsApp) đã đăng nhập (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Web Chat bị treo                                   | Xác nhận Gateway đang chạy trên máy chủ từ xa và cổng được chuyển tiếp khớp với cổng WS của Gateway; giao diện người dùng yêu cầu kết nối WS hoạt động bình thường.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| IP của Node hiển thị `127.0.0.1`                        | Đây là hành vi dự kiến khi sử dụng đường hầm SSH. Chuyển **Transport** sang **Direct (ws/wss)** nếu bạn muốn Gateway thấy địa chỉ IP thực của máy khách.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Bảng điều khiển hoạt động nhưng các khả năng của máy Mac ở trạng thái ngoại tuyến | Kết nối vận hành/điều khiển đang hoạt động bình thường, nhưng kết nối Node đồng hành chưa được kết nối hoặc thiếu bề mặt lệnh. Mở phần thiết bị trên thanh menu và kiểm tra xem máy Mac có phải là `paired · disconnected` hay không. Đối với các điểm cuối Tailscale Serve `wss://*.ts.net`, ứng dụng phát hiện các mã ghim chứng chỉ TLS lá cũ đã lỗi thời sau khi xoay vòng chứng chỉ, xóa mã ghim lỗi thời khi macOS tin cậy chứng chỉ mới và tự động thử lại. Nếu chứng chỉ không được hệ thống tin cậy hoặc máy chủ không phải là tên Tailscale Serve, hãy đặt `gateway.remote.tlsFingerprint` thành dấu vân tay chứng chỉ dự kiến, xem xét chứng chỉ hoặc chuyển sang **Remote over SSH**. |
| Voice Wake                                       | Các cụm từ kích hoạt được tự động chuyển tiếp ở chế độ từ xa; không cần trình chuyển tiếp riêng.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Âm thanh thông báo

Chọn âm thanh cho từng thông báo từ các tập lệnh bằng `openclaw nodes notify`, ví dụ:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Gateway từ xa đã sẵn sàng" --sound Glass
```

Ứng dụng không có nút bật/tắt âm thanh mặc định toàn cục; bên gọi chọn âm thanh (hoặc không chọn) cho từng yêu cầu.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Truy cập từ xa](/vi/gateway/remote)
