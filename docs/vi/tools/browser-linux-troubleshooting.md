---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Khắc phục sự cố khởi động CDP của Chrome/Brave/Edge/Chromium cho tính năng điều khiển trình duyệt OpenClaw trên Linux
title: Khắc phục sự cố trình duyệt
x-i18n:
    generated_at: "2026-04-29T23:16:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9a91ea42a8a600163bcf66ad398677175bd0c5186d3e1dddb629a55c2ea66ed
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Sự cố: "Failed to start Chrome CDP on port 18800"

Máy chủ điều khiển trình duyệt của OpenClaw không khởi chạy được Chrome/Brave/Edge/Chromium với lỗi:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Nguyên nhân gốc

Trên Ubuntu (và nhiều bản phân phối Linux), bản cài đặt Chromium mặc định là một **gói snap**. Cơ chế cô lập AppArmor của Snap can thiệp vào cách OpenClaw sinh và giám sát tiến trình trình duyệt.

Lệnh `apt install chromium` cài đặt một gói stub chuyển hướng sang snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Đây KHÔNG phải là trình duyệt thật - nó chỉ là một wrapper.

Các lỗi khởi chạy Linux phổ biến khác:

- `The profile appears to be in use by another Chromium process` nghĩa là Chrome
  tìm thấy các tệp khóa `Singleton*` cũ trong thư mục hồ sơ được quản lý. OpenClaw
  xóa các khóa đó và thử lại một lần khi khóa trỏ tới một tiến trình đã chết hoặc
  tiến trình trên máy chủ khác.
- `Missing X server or $DISPLAY` nghĩa là một trình duyệt hiển thị đã được yêu cầu rõ ràng
  trên máy chủ không có phiên desktop. Theo mặc định, các hồ sơ được quản lý cục bộ
  hiện chuyển về chế độ headless trên Linux khi cả `DISPLAY` và
  `WAYLAND_DISPLAY` đều chưa được đặt. Nếu bạn đặt `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless: false`, hoặc `browser.profiles.<name>.headless: false`,
  hãy xóa ghi đè headed đó, đặt `OPENCLAW_BROWSER_HEADLESS=1`, khởi động `Xvfb`,
  chạy `openclaw browser start --headless` cho một lần khởi chạy được quản lý, hoặc chạy
  OpenClaw trong một phiên desktop thật.

### Giải pháp 1: Cài đặt Google Chrome (Khuyến nghị)

Cài đặt gói `.deb` chính thức của Google Chrome, không bị sandbox bởi snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
```

Sau đó cập nhật cấu hình OpenClaw của bạn (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Giải pháp 2: Dùng Snap Chromium với chế độ Chỉ đính kèm

Nếu bạn buộc phải dùng snap Chromium, hãy cấu hình OpenClaw để đính kèm vào một trình duyệt được khởi động thủ công:

1. Cập nhật cấu hình:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Khởi động Chromium thủ công:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. Tùy chọn tạo một dịch vụ systemd người dùng để tự động khởi động Chrome:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Bật bằng: `systemctl --user enable --now openclaw-browser.service`

### Xác minh trình duyệt hoạt động

Kiểm tra trạng thái:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Kiểm thử duyệt web:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Tham chiếu cấu hình

| Tùy chọn                         | Mô tả                                                                | Mặc định                                                     |
| -------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`                | Bật điều khiển trình duyệt                                           | `true`                                                      |
| `browser.executablePath`         | Đường dẫn đến binary trình duyệt dựa trên Chromium (Chrome/Brave/Edge/Chromium) | được tự động phát hiện (ưu tiên trình duyệt mặc định khi dựa trên Chromium) |
| `browser.headless`               | Chạy không có GUI                                                    | `false`                                                     |
| `OPENCLAW_BROWSER_HEADLESS`      | Ghi đè theo từng tiến trình cho chế độ headless của trình duyệt được quản lý cục bộ | chưa đặt                                                    |
| `browser.noSandbox`              | Thêm cờ `--no-sandbox` (cần cho một số thiết lập Linux)              | `false`                                                     |
| `browser.attachOnly`             | Không khởi chạy trình duyệt, chỉ đính kèm vào trình duyệt hiện có    | `false`                                                     |
| `browser.cdpPort`                | Cổng Chrome DevTools Protocol                                        | `18800`                                                     |
| `browser.localLaunchTimeoutMs`   | Thời gian chờ phát hiện Chrome được quản lý cục bộ                   | `15000`                                                     |
| `browser.localCdpReadyTimeoutMs` | Thời gian chờ CDP sẵn sàng sau khi khởi chạy được quản lý cục bộ     | `8000`                                                      |

Trên Raspberry Pi, các máy chủ VPS cũ hơn, hoặc lưu trữ chậm, hãy tăng
`browser.localLaunchTimeoutMs` khi Chrome cần thêm thời gian để mở endpoint HTTP
CDP của nó. Tăng `browser.localCdpReadyTimeoutMs` khi khởi chạy thành công nhưng
`openclaw browser start` vẫn báo `not reachable after start`. Giá trị phải là
số nguyên dương tối đa `120000` ms; các giá trị cấu hình không hợp lệ sẽ bị từ chối.

### Sự cố: "No Chrome tabs found for profile=\"user\""

Bạn đang dùng hồ sơ `existing-session` / Chrome MCP. OpenClaw có thể thấy Chrome cục bộ,
nhưng không có tab đang mở nào để đính kèm.

Các tùy chọn khắc phục:

1. **Dùng trình duyệt được quản lý:** `openclaw browser start --browser-profile openclaw`
   (hoặc đặt `browser.defaultProfile: "openclaw"`).
2. **Dùng Chrome MCP:** bảo đảm Chrome cục bộ đang chạy với ít nhất một tab đang mở, rồi thử lại với `--browser-profile user`.

Ghi chú:

- `user` chỉ dành cho máy chủ cục bộ. Với máy chủ Linux, container, hoặc máy chủ từ xa, nên dùng hồ sơ CDP.
- `user` / các hồ sơ `existing-session` khác giữ các giới hạn Chrome MCP hiện tại:
  hành động dựa trên ref, hook tải lên một tệp, không có ghi đè thời gian chờ hộp thoại, không có
  `wait --load networkidle`, và không có `responsebody`, xuất PDF, chặn tải xuống,
  hoặc hành động hàng loạt.
- Các hồ sơ `openclaw` cục bộ tự động gán `cdpPort`/`cdpUrl`; chỉ đặt các giá trị đó cho CDP từ xa.
- Hồ sơ CDP từ xa chấp nhận `http://`, `https://`, `ws://`, và `wss://`.
  Dùng HTTP(S) cho phát hiện `/json/version`, hoặc WS(S) khi dịch vụ trình duyệt của bạn
  cung cấp URL socket DevTools trực tiếp.

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Đăng nhập trình duyệt](/vi/tools/browser-login)
- [Khắc phục sự cố Browser WSL2](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
