---
read_when:
    - Bạn cần biết những biến môi trường nào được nạp và theo thứ tự nào
    - Bạn đang gỡ lỗi các khóa API bị thiếu trong Gateway
    - Bạn đang viết tài liệu về xác thực nhà cung cấp hoặc các môi trường triển khai
summary: Nơi OpenClaw tải các biến môi trường và thứ tự ưu tiên
title: Biến môi trường
x-i18n:
    generated_at: "2026-05-02T10:43:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66787dd6f87dcaf81f721465e88dda519421b1a598179f71bce0239bb4791c46
    source_path: help/environment.md
    workflow: 16
---

OpenClaw lấy biến môi trường từ nhiều nguồn. Quy tắc là **không bao giờ ghi đè giá trị hiện có**.

## Thứ tự ưu tiên (cao nhất → thấp nhất)

1. **Môi trường tiến trình** (những gì tiến trình Gateway đã có từ shell/daemon cha).
2. **`.env` trong thư mục làm việc hiện tại** (mặc định dotenv; không ghi đè).
3. **`.env` toàn cục** tại `~/.openclaw/.env` (còn gọi là `$OPENCLAW_STATE_DIR/.env`; không ghi đè).
4. **Khối cấu hình `env`** trong `~/.openclaw/openclaw.json` (chỉ áp dụng nếu còn thiếu).
5. **Nhập login-shell tùy chọn** (`env.shellEnv.enabled` hoặc `OPENCLAW_LOAD_SHELL_ENV=1`), chỉ áp dụng cho các khóa mong đợi còn thiếu.

Trên các bản cài đặt Ubuntu mới dùng thư mục trạng thái mặc định, OpenClaw cũng xem `~/.config/openclaw/gateway.env` là phương án tương thích dự phòng sau `.env` toàn cục. Nếu cả hai tệp tồn tại và không khớp, OpenClaw giữ `~/.openclaw/.env` và in cảnh báo.

Nếu tệp cấu hình hoàn toàn bị thiếu, bước 4 được bỏ qua; nhập shell vẫn chạy nếu đã bật.

## Khối cấu hình `env`

Hai cách tương đương để đặt biến môi trường nội tuyến (cả hai đều không ghi đè):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Nhập môi trường shell

`env.shellEnv` chạy shell đăng nhập của bạn và chỉ nhập các khóa mong đợi đang **thiếu**:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Các biến môi trường tương đương:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Biến môi trường được chèn khi chạy

OpenClaw cũng chèn các dấu mốc ngữ cảnh vào các tiến trình con được sinh ra:

- `OPENCLAW_SHELL=exec`: được đặt cho các lệnh chạy qua công cụ `exec`.
- `OPENCLAW_SHELL=acp`: được đặt cho các tiến trình backend runtime ACP được sinh ra (ví dụ `acpx`).
- `OPENCLAW_SHELL=acp-client`: được đặt cho `openclaw acp client` khi nó sinh tiến trình cầu nối ACP.
- `OPENCLAW_SHELL=tui-local`: được đặt cho các lệnh shell `!` TUI cục bộ.

Đây là các dấu mốc runtime (không phải cấu hình người dùng bắt buộc). Chúng có thể được dùng trong logic shell/profile
để áp dụng các quy tắc theo từng ngữ cảnh.

## Biến môi trường UI

- `OPENCLAW_THEME=light`: ép dùng bảng màu TUI sáng khi terminal của bạn có nền sáng.
- `OPENCLAW_THEME=dark`: ép dùng bảng màu TUI tối.
- `COLORFGBG`: nếu terminal của bạn xuất biến này, OpenClaw dùng gợi ý màu nền để tự động chọn bảng màu TUI.

## Thay thế biến môi trường trong cấu hình

Bạn có thể tham chiếu trực tiếp biến môi trường trong các giá trị chuỗi cấu hình bằng cú pháp `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Xem [Cấu hình: Thay thế biến môi trường](/vi/gateway/configuration-reference#env-var-substitution) để biết đầy đủ chi tiết.

## Secret refs so với chuỗi `${ENV}`

OpenClaw hỗ trợ hai mẫu dựa trên biến môi trường:

- Thay thế chuỗi `${VAR}` trong các giá trị cấu hình.
- Đối tượng SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) cho các trường hỗ trợ tham chiếu bí mật.

Cả hai đều được phân giải từ môi trường tiến trình tại thời điểm kích hoạt. Chi tiết SecretRef được ghi trong [Quản lý bí mật](/vi/gateway/secrets).

## Biến môi trường liên quan đến đường dẫn

| Biến                     | Mục đích                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Ghi đè thư mục home dùng cho mọi phân giải đường dẫn nội bộ (`~/.openclaw/`, thư mục agent, phiên, thông tin xác thực). Hữu ích khi chạy OpenClaw dưới dạng người dùng dịch vụ chuyên dụng. |
| `OPENCLAW_STATE_DIR`     | Ghi đè thư mục trạng thái (mặc định `~/.openclaw`).                                                                                                                            |
| `OPENCLAW_CONFIG_PATH`   | Ghi đè đường dẫn tệp cấu hình (mặc định `~/.openclaw/openclaw.json`).                                                                                                             |
| `OPENCLAW_INCLUDE_ROOTS` | Danh sách đường dẫn của các thư mục nơi chỉ thị `$include` có thể phân giải tệp bên ngoài thư mục cấu hình (mặc định: không có — `$include` bị giới hạn trong thư mục cấu hình). Có mở rộng dấu ngã.  |

## Ghi log

| Biến                 | Mục đích                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Ghi đè cấp độ log cho cả tệp và console (ví dụ `debug`, `trace`). Có độ ưu tiên cao hơn `logging.level` và `logging.consoleLevel` trong cấu hình. Giá trị không hợp lệ bị bỏ qua kèm cảnh báo. |

### `OPENCLAW_HOME`

Khi được đặt, `OPENCLAW_HOME` thay thế thư mục home của hệ thống (`$HOME` / `os.homedir()`) cho mọi phân giải đường dẫn nội bộ. Điều này cho phép cô lập hoàn toàn hệ thống tệp cho các tài khoản dịch vụ không giao diện.

**Thứ tự ưu tiên:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Ví dụ** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` cũng có thể được đặt thành đường dẫn dấu ngã (ví dụ `~/svc`), đường dẫn này được mở rộng bằng `$HOME` trước khi dùng.

## Người dùng nvm: lỗi TLS của web_fetch

Nếu Node.js được cài qua **nvm** (không phải trình quản lý gói hệ thống), `fetch()` tích hợp sẵn dùng
kho CA đi kèm của nvm, kho này có thể thiếu các CA gốc hiện đại (ISRG Root X1/X2 cho Let's Encrypt,
DigiCert Global Root G2, v.v.). Điều này khiến `web_fetch` thất bại với `"fetch failed"` trên hầu hết trang HTTPS.

Trên Linux, OpenClaw tự động phát hiện nvm và áp dụng bản sửa trong môi trường khởi động thực tế:

- `openclaw gateway install` ghi `NODE_EXTRA_CA_CERTS` vào môi trường dịch vụ systemd
- entrypoint CLI `openclaw` tự chạy lại với `NODE_EXTRA_CA_CERTS` đã được đặt trước khi Node khởi động

**Cách sửa thủ công (cho phiên bản cũ hơn hoặc các lần khởi chạy trực tiếp `node ...`):**

Xuất biến trước khi khởi động OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Đừng chỉ dựa vào việc ghi biến này vào `~/.openclaw/.env`; Node đọc
`NODE_EXTRA_CA_CERTS` khi tiến trình khởi động.

## Biến môi trường cũ

OpenClaw chỉ đọc các biến môi trường `OPENCLAW_*`. Các tiền tố cũ
`CLAWDBOT_*` và `MOLTBOT_*` từ những bản phát hành trước bị âm thầm
bỏ qua.

Nếu có biến nào vẫn được đặt trên tiến trình Gateway khi khởi động, OpenClaw phát ra một
cảnh báo ngừng dùng duy nhất của Node (`OPENCLAW_LEGACY_ENV_VARS`) liệt kê các
tiền tố được phát hiện và tổng số lượng. Đổi tên từng giá trị bằng cách thay
tiền tố cũ bằng `OPENCLAW_` (ví dụ `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); các tên cũ không có hiệu lực.

## Liên quan

- [Cấu hình Gateway](/vi/gateway/configuration)
- [Câu hỏi thường gặp: biến môi trường và nạp .env](/vi/help/faq#env-vars-and-env-loading)
- [Tổng quan về mô hình](/vi/concepts/models)
