---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Khắc phục sự cố khởi động CDP của Chrome/Brave/Edge/Chromium cho tính năng điều khiển trình duyệt OpenClaw trên Linux
title: Khắc phục sự cố trình duyệt
x-i18n:
    generated_at: "2026-07-20T04:50:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e5db2da2d43129862f0c005213df828f6eae81f5561e57d41795ea90787822a
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## Sự cố: Không thể khởi động Chrome CDP trên cổng 18800

```json
{ "error": "Lỗi: Không thể khởi động Chrome CDP trên cổng 18800 cho hồ sơ \"openclaw\"." }
```

### Nguyên nhân gốc

Trên Ubuntu và hầu hết các bản phân phối Linux, `apt install chromium` cài đặt một trình bao bọc snap,
không phải trình duyệt thực:

```text
Lưu ý, đang chọn 'chromium-browser' thay vì 'chromium'
chromium-browser đã là phiên bản mới nhất (2:1snap1-0ubuntu2).
```

Cơ chế cách ly AppArmor của Snap gây trở ngại cho cách OpenClaw khởi chạy và giám sát
tiến trình trình duyệt.

Các lỗi khởi chạy Linux phổ biến khác:

- `The profile appears to be in use by another Chromium process`: các tệp khóa
  `Singleton*` cũ trong thư mục hồ sơ được quản lý. OpenClaw xóa
  các khóa này và thử lại một lần khi khóa trỏ đến một tiến trình đã dừng hoặc
  trên máy chủ khác.
- `Missing X server or $DISPLAY`: trình duyệt hiển thị đã được yêu cầu rõ ràng
  trên máy chủ không có phiên máy tính để bàn. Các hồ sơ cục bộ được quản lý sẽ chuyển sang
  chế độ không giao diện trên Linux khi cả `DISPLAY` và `WAYLAND_DISPLAY` đều chưa được đặt.
  Nếu đã đặt `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` hoặc
  `browser.profiles.<name>.headless: false`, hãy xóa tùy chọn ghi đè có giao diện đó, đặt
  `OPENCLAW_BROWSER_HEADLESS=1`, khởi động `Xvfb`, chạy
  `openclaw browser start --headless` để khởi chạy được quản lý một lần, hoặc chạy
  OpenClaw trong một phiên máy tính để bàn thực.

### Giải pháp 1: cài đặt Google Chrome (khuyến nghị)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # nếu có lỗi phụ thuộc
```

Cập nhật `~/.openclaw/openclaw.json`:

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

### Giải pháp 2: sử dụng Chromium snap ở chế độ chỉ đính kèm

Nếu phải tiếp tục sử dụng Chromium snap, hãy cấu hình OpenClaw đính kèm vào một
trình duyệt được khởi động thủ công thay vì tự khởi chạy trình duyệt:

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

Khởi động Chromium thủ công:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

Có thể tùy chọn tự động khởi động bằng dịch vụ người dùng systemd:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=Trình duyệt OpenClaw (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### Xác minh trình duyệt hoạt động

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Tham chiếu cấu hình

| Tùy chọn                      | Mô tả                                                          | Mặc định                                                            |
| --------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `browser.enabled`           | Bật điều khiển trình duyệt                                               | `true`                                                             |
| `browser.executablePath`    | Đường dẫn đến tệp nhị phân của trình duyệt dựa trên Chromium (Chrome/Brave/Edge/Chromium) | tự động phát hiện (ưu tiên trình duyệt mặc định của hệ điều hành nếu dựa trên Chromium) |
| `browser.headless`          | Chạy không có GUI                                                      | `false`                                                            |
| `OPENCLAW_BROWSER_HEADLESS` | Ghi đè theo từng tiến trình cho chế độ không giao diện của trình duyệt cục bộ được quản lý         | chưa đặt                                                              |
| `browser.noSandbox`         | Thêm cờ `--no-sandbox` (cần thiết cho một số thiết lập Linux)               | `false`                                                            |
| `browser.attachOnly`        | Không khởi chạy trình duyệt; chỉ đính kèm vào trình duyệt hiện có              | `false`                                                            |

Trên Raspberry Pi, các máy chủ VPS cũ hoặc bộ nhớ lưu trữ chậm, hãy sử dụng trình duyệt được khởi chạy
thủ công với `attachOnly` khi Chrome cần nhiều thời gian hơn để công khai điểm cuối HTTP CDP
hoặc sẵn sàng so với thời hạn của trình duyệt được quản lý.

### Sự cố: Không tìm thấy thẻ Chrome nào cho profile="user"

Bạn đang sử dụng hồ sơ `user` (`existing-session` / Chrome MCP) và không có
thẻ nào đang mở để đính kèm.

Các cách khắc phục:

1. Thay vào đó, sử dụng trình duyệt được quản lý:
   `openclaw browser --browser-profile openclaw start` (hoặc đặt
   `browser.defaultProfile: "openclaw"`).
2. Duy trì Chrome cục bộ chạy với ít nhất một thẻ đang mở, sau đó thử lại với
   `--browser-profile user`.

Lưu ý:

- `user` chỉ hoạt động trên máy chủ cục bộ. Trên máy chủ Linux, vùng chứa hoặc máy chủ từ xa, nên ưu tiên
  hồ sơ CDP.
- `user` và các hồ sơ `existing-session` khác có chung các giới hạn Chrome MCP
  hiện tại: chỉ hỗ trợ thao tác dựa trên tham chiếu, mỗi lần tải lên một tệp, không ghi đè `timeoutMs`
  của hộp thoại, không có `wait --load networkidle`, và không có `responsebody`, xuất PDF,
  chặn tải xuống hoặc thao tác hàng loạt.
- Các hồ sơ trình điều khiển `openclaw` cục bộ tự động gán `cdpPort`/`cdpUrl`; chỉ đặt
  các giá trị đó theo cách thủ công cho CDP từ xa.
- Các hồ sơ CDP từ xa chấp nhận `http://`, `https://`, `ws://` và `wss://`.
  Sử dụng HTTP(S) để khám phá `/json/version`, hoặc WS(S) khi dịch vụ trình duyệt
  cung cấp URL socket DevTools trực tiếp.

## Liên quan

- [Trình duyệt](/vi/tools/browser)
- [Đăng nhập trình duyệt](/vi/tools/browser-login)
- [Khắc phục sự cố WSL2 của trình duyệt](/vi/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
