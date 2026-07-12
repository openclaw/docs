---
read_when:
    - Thiết lập hoặc gỡ lỗi điều khiển máy Mac từ xa
summary: Quy trình ứng dụng macOS để điều khiển Gateway OpenClaw từ xa
title: Điều khiển từ xa
x-i18n:
    generated_at: "2026-07-12T08:07:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Luồng này cho phép ứng dụng macOS hoạt động như một bộ điều khiển từ xa đầy đủ cho Gateway OpenClaw đang chạy trên một máy chủ khác (máy tính để bàn/máy chủ). Ứng dụng kết nối trực tiếp với các URL Gateway LAN/Tailnet đáng tin cậy hoặc quản lý đường hầm SSH khi Gateway từ xa chỉ liên kết với local loopback. Các lượt kiểm tra tình trạng, chuyển tiếp Voice Wake và Web Chat dùng lại cùng cấu hình từ xa trong _Settings -> General_.

## Chế độ

- **Cục bộ (máy Mac này)**: mọi thứ chạy trên máy tính xách tay; không sử dụng SSH.
- **Từ xa qua SSH (mặc định)**: các lệnh OpenClaw chạy trên máy chủ từ xa. Ứng dụng mở kết nối SSH với `-o BatchMode`, danh tính/khóa bạn đã chọn và một cổng chuyển tiếp cục bộ.
- **Kết nối trực tiếp từ xa (ws/wss)**: không có đường hầm SSH; ứng dụng kết nối trực tiếp với URL Gateway (LAN, Tailscale, Tailscale Serve hoặc proxy ngược HTTPS công khai).

## Phương thức truyền tải từ xa

- **Đường hầm SSH** (mặc định): sử dụng `ssh -N -L ...` để chuyển tiếp cổng Gateway đến localhost. Gateway thấy địa chỉ IP của Node là `127.0.0.1` vì đường hầm sử dụng loopback.
- **Trực tiếp (ws/wss)**: kết nối thẳng đến URL Gateway. Gateway thấy địa chỉ IP thực của máy khách.

Ứng dụng vô hiệu hóa tính năng ghép kênh kết nối SSH và chạy nền sau khi xác thực đối với các tiến trình SSH của chính ứng dụng để có thể giám sát và khởi động lại chính xác tiến trình đó, ngay cả khi bí danh đã chọn bật `ControlMaster` hoặc `ForkAfterAuthentication`.

Theo mặc định, việc xác minh khóa máy chủ SSH được thực hiện nghiêm ngặt vì thông tin xác thực Gateway được truyền qua đường hầm này. Để chủ động sử dụng cơ chế tin cậy riêng của một bí danh SSH được quản lý, hãy đặt `--ssh-host-key-policy openssh` thông qua `openclaw-mac configure-remote` hoặc đặt trực tiếp `gateway.remote.sshHostKeyPolicy` thành `"openssh"`. Hãy xem xét bí danh cùng mọi cấu hình `Host *` tương ứng hoặc cấu hình hệ thống trước khi chọn sử dụng. Việc thay đổi đích SSH (trong ứng dụng hoặc qua `configure-remote`) sẽ đặt lại chính sách về `strict`, trừ khi bạn chủ động chọn lại cho đích mới.

Trong chế độ đường hầm SSH, tên máy chủ LAN/tailnet được phát hiện sẽ được lưu vào `gateway.remote.sshTarget`. Ứng dụng giữ `gateway.remote.url` trỏ đến điểm cuối đường hầm cục bộ (ví dụ: `ws://127.0.0.1:18789`) để CLI, Web Chat và dịch vụ máy chủ Node cục bộ đều sử dụng cùng phương thức truyền tải loopback. Khi quá trình khám phá trả về cả địa chỉ IP Tailnet thô và tên máy chủ ổn định, ứng dụng ưu tiên tên Tailscale MagicDNS hoặc LAN để kết nối duy trì tốt hơn khi địa chỉ thay đổi. Nếu cổng đường hầm cục bộ khác với cổng Gateway từ xa, hãy đặt `gateway.remote.remotePort` thành cổng trên máy chủ từ xa.

Trong chế độ từ xa, tính năng tự động hóa trình duyệt thuộc quyền quản lý của máy chủ Node CLI, không phải Node của ứng dụng macOS gốc. Ứng dụng khởi động dịch vụ máy chủ Node đã cài đặt khi có thể; để bật tính năng điều khiển trình duyệt từ máy Mac đó, hãy cài đặt/khởi động dịch vụ bằng `openclaw node install ...` và `openclaw node start` (hoặc chạy `openclaw node run ...` ở chế độ nền trước), sau đó chọn Node có khả năng điều khiển trình duyệt đó làm đích.

## Điều kiện tiên quyết trên máy chủ từ xa

1. Cài đặt Node + pnpm rồi xây dựng/cài đặt OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Đảm bảo `openclaw` nằm trong PATH của các shell không tương tác (tạo liên kết tượng trưng vào `/usr/local/bin` hoặc `/opt/homebrew/bin` nếu cần).
3. Đối với phương thức truyền tải SSH: thiết lập xác thực SSH bằng khóa. Nên sử dụng địa chỉ IP Tailscale để duy trì khả năng kết nối ổn định khi ở ngoài LAN.

## Thiết lập ứng dụng macOS

Để cấu hình trước ứng dụng mà không qua luồng chào mừng, thông qua SSH:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Hoặc đối với Gateway đã có thể truy cập trên một LAN hoặc Tailnet đáng tin cậy, hãy bỏ qua hoàn toàn SSH:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Cả hai dạng đều ghi vào `~/.openclaw/openclaw.json`, đánh dấu quá trình làm quen ban đầu là hoàn tất và cho phép ứng dụng quản lý phương thức truyền tải đã chọn trong lần khởi động tiếp theo. `--local-port`/`--remote-port` mặc định là `18789`. Các cờ khác: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Chạy `openclaw-mac configure-remote --help` để xem tài liệu tham khảo đầy đủ.

Để cấu hình từ giao diện người dùng:

1. Mở _Settings -> General_.
2. Trong **OpenClaw runs**, chọn **Remote** và thiết lập:
   - **Transport**: **SSH tunnel** hoặc **Direct (ws/wss)**.
   - **SSH target**: `user@host` (có thể thêm `:port`). Nếu Gateway nằm trên cùng LAN và quảng bá qua Bonjour, hãy chọn Gateway đó trong danh sách được phát hiện để tự động điền trường này.
   - **Gateway URL** (chỉ với Direct): `wss://gateway.example.ts.net` (hoặc `ws://...` cho môi trường cục bộ/LAN).
   - **Identity file** (nâng cao): đường dẫn đến khóa của bạn.
   - **Project root** (nâng cao): đường dẫn bản sao mã nguồn từ xa được dùng cho các lệnh.
   - **CLI path** (nâng cao): đường dẫn tùy chọn đến điểm vào/tệp nhị phân `openclaw` có thể chạy được (tự động điền khi được quảng bá).
3. Nhấn **Test remote**. Thành công có nghĩa là lệnh `openclaw status --json` từ xa đã chạy chính xác. Lỗi thường do vấn đề với PATH/CLI; mã thoát 127 có nghĩa là không tìm thấy CLI trên máy từ xa.
4. Giờ đây, các lượt kiểm tra tình trạng và Web Chat tự động chạy qua phương thức truyền tải đã chọn.

## Web Chat

- **Đường hầm SSH**: kết nối với Gateway qua cổng điều khiển WebSocket được chuyển tiếp (mặc định là 18789).
- **Trực tiếp (ws/wss)**: kết nối thẳng đến URL Gateway đã cấu hình.
- Không có máy chủ HTTP Web Chat riêng biệt.

## Quyền

- Máy chủ từ xa cần các phê duyệt TCC giống như máy cục bộ (Tự động hóa, Trợ năng, Ghi màn hình, Micrô, Nhận dạng giọng nói, Thông báo). Hãy chạy quy trình làm quen ban đầu một lần trên máy đó để cấp các quyền này.
- Các Node công bố trạng thái quyền của chúng qua `node.list` / `node.describe` để các tác tử biết những gì khả dụng.

## Lưu ý về bảo mật

- Ưu tiên liên kết loopback trên máy chủ từ xa và kết nối qua SSH, Tailscale Serve hoặc URL trực tiếp Tailnet/LAN đáng tin cậy.
- Theo mặc định, đường hầm SSH yêu cầu khóa máy chủ đã được tin cậy từ trước. Trước tiên, hãy tin cậy khóa máy chủ (thêm khóa vào tệp máy chủ đã biết được cấu hình) hoặc đặt rõ ràng `gateway.remote.sshHostKeyPolicy: "openssh"` cho một bí danh được quản lý có chính sách tin cậy OpenSSH mà bạn chấp nhận.
- Nếu liên kết Gateway với một giao diện không phải loopback, hãy yêu cầu xác thực Gateway hợp lệ: token, mật khẩu hoặc proxy ngược nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- Xem [Bảo mật](/vi/gateway/security) và [Tailscale](/vi/gateway/tailscale).

## Luồng đăng nhập WhatsApp (từ xa)

- Chạy `openclaw channels login --channel whatsapp --verbose` **trên máy chủ từ xa**. Quét mã QR bằng WhatsApp trên điện thoại của bạn.
- Chạy lại quy trình đăng nhập trên máy chủ đó nếu xác thực hết hạn. Lượt kiểm tra tình trạng sẽ hiển thị các sự cố liên kết.

## Khắc phục sự cố

| Triệu chứng                                      | Nguyên nhân / cách khắc phục                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / không tìm thấy                      | `openclaw` không nằm trong PATH của shell không đăng nhập. Thêm nó vào `/etc/paths`, tệp rc của shell hoặc tạo liên kết tượng trưng vào `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Kiểm tra tình trạng hoạt động thất bại            | Kiểm tra khả năng kết nối qua SSH, PATH và bảo đảm Baileys (WhatsApp) đã đăng nhập (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Trò chuyện web bị treo                           | Xác nhận Gateway đang chạy trên máy chủ từ xa và cổng được chuyển tiếp khớp với cổng WS của Gateway; giao diện người dùng cần kết nối WS hoạt động bình thường.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| IP của Node hiển thị `127.0.0.1`                 | Đây là hành vi dự kiến khi dùng đường hầm SSH. Chuyển **Phương thức truyền tải** sang **Trực tiếp (ws/wss)** nếu bạn muốn Gateway nhận được IP thực của máy khách.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Bảng điều khiển hoạt động nhưng các chức năng của máy Mac đang ngoại tuyến | Kết nối vận hành/điều khiển đang hoạt động bình thường, nhưng kết nối Node đồng hành chưa được thiết lập hoặc thiếu bề mặt lệnh. Mở phần thiết bị trên thanh menu và kiểm tra xem máy Mac có ở trạng thái `đã ghép đôi · đã ngắt kết nối` hay không. Đối với các điểm cuối Tailscale Serve `wss://*.ts.net`, ứng dụng phát hiện các mã ghim chứng thư TLS đầu cuối cũ đã lỗi thời sau khi chứng thư được luân chuyển, xóa mã ghim cũ khi macOS tin cậy chứng thư mới và tự động thử lại. Nếu chứng thư không được hệ thống tin cậy hoặc máy chủ không phải là tên Tailscale Serve, hãy đặt `gateway.remote.tlsFingerprint` thành dấu vân tay dự kiến của chứng thư, xem xét chứng thư hoặc chuyển sang **Từ xa qua SSH**. |
| Đánh thức bằng giọng nói                         | Các cụm từ kích hoạt được tự động chuyển tiếp trong chế độ từ xa; không cần trình chuyển tiếp riêng.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Âm thanh thông báo

Chọn âm thanh cho từng thông báo từ các tập lệnh bằng `openclaw nodes notify`, ví dụ:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Ứng dụng không có nút bật/tắt âm thanh mặc định toàn cục; bên gọi chọn âm thanh (hoặc không dùng âm thanh) cho từng yêu cầu.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Truy cập từ xa](/vi/gateway/remote)
