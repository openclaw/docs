---
read_when:
    - Bạn cần biết những biến môi trường nào được tải và theo thứ tự nào
    - Bạn đang gỡ lỗi các khóa API bị thiếu trong Gateway
    - Bạn đang ghi tài liệu về xác thực nhà cung cấp hoặc môi trường triển khai
summary: Nơi OpenClaw tải các biến môi trường và thứ tự ưu tiên
title: Biến môi trường
x-i18n:
    generated_at: "2026-06-27T17:34:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw lấy biến môi trường từ nhiều nguồn. Quy tắc là **không bao giờ ghi đè giá trị hiện có**.
Các tệp `.env` của workspace là nguồn có mức tin cậy thấp hơn: OpenClaw bỏ qua thông tin xác thực của nhà cung cấp và các điều khiển runtime được bảo vệ từ `.env` của workspace trước khi áp dụng thứ tự ưu tiên.

## Thứ tự ưu tiên (cao nhất → thấp nhất)

1. **Môi trường tiến trình** (những gì tiến trình Gateway đã có từ shell/daemon cha).
2. **`.env` trong thư mục làm việc hiện tại** (mặc định của dotenv; không ghi đè; thông tin xác thực của nhà cung cấp và các điều khiển runtime được bảo vệ bị bỏ qua).
3. **`.env` toàn cục** tại `~/.openclaw/.env` (còn gọi là `$OPENCLAW_STATE_DIR/.env`; được khuyến nghị cho khóa API của nhà cung cấp; không ghi đè).
4. **Khối `env` cấu hình** trong `~/.openclaw/openclaw.json` (chỉ áp dụng nếu còn thiếu).
5. **Nhập login-shell tùy chọn** (`env.shellEnv.enabled` hoặc `OPENCLAW_LOAD_SHELL_ENV=1`), chỉ áp dụng cho các khóa dự kiến còn thiếu.

Trên các bản cài đặt Ubuntu mới dùng thư mục trạng thái mặc định, OpenClaw cũng xem `~/.config/openclaw/gateway.env` là fallback tương thích sau `.env` toàn cục. Nếu cả hai tệp đều tồn tại và không khớp nhau, OpenClaw giữ `~/.openclaw/.env` và in cảnh báo.

Nếu tệp cấu hình hoàn toàn không tồn tại, bước 4 bị bỏ qua; nhập shell vẫn chạy nếu được bật.

## Thông tin xác thực của nhà cung cấp và `.env` của workspace

Không chỉ lưu khóa API của nhà cung cấp trong `.env` của workspace. OpenClaw bỏ qua các biến môi trường thông tin xác thực của nhà cung cấp từ tệp `.env` của workspace, bao gồm các khóa phổ biến như `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, và `FIRECRAWL_API_KEY`.

Dùng một trong các nguồn tin cậy sau cho thông tin xác thực của nhà cung cấp:

- Môi trường tiến trình Gateway, chẳng hạn như shell, launchd/systemd unit, secret của container, hoặc secret của CI.
- Tệp dotenv runtime toàn cục tại `~/.openclaw/.env` hoặc `$OPENCLAW_STATE_DIR/.env`.
- Khối `env` cấu hình trong `~/.openclaw/openclaw.json`.
- Nhập login-shell tùy chọn khi `env.shellEnv.enabled` hoặc `OPENCLAW_LOAD_SHELL_ENV=1` được bật.

Nếu trước đây bạn chỉ lưu khóa nhà cung cấp trong `.env` của workspace, hãy chuyển chúng sang một trong các nguồn tin cậy ở trên. `.env` của workspace vẫn có thể cung cấp các biến dự án thông thường không phải là thông tin xác thực, chuyển hướng endpoint, ghi đè host, hoặc điều khiển runtime `OPENCLAW_*`.

Xem [Tệp `.env` của workspace](/vi/gateway/security#workspace-env-files) để biết lý do bảo mật.

## Khối `env` cấu hình

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

Khối `env` cấu hình chỉ chấp nhận giá trị chuỗi literal. Nó không mở rộng
các giá trị `file:...`; ví dụ, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
được truyền cho nhà cung cấp đúng nguyên chuỗi đó.

Với khóa nhà cung cấp dựa trên tệp, hãy dùng SecretRef trên trường thông tin xác thực có hỗ trợ:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

Xem [Quản lý secret](/vi/gateway/secrets) và
[bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) để biết
các trường được hỗ trợ.

## Nhập env từ shell

`env.shellEnv` chạy login shell của bạn và chỉ nhập các khóa dự kiến **còn thiếu**:

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

## Snapshot exec shell

Trên host Gateway không phải Windows, các lệnh `exec` của bash và zsh mặc định dùng snapshot khởi động.
Đặt `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` trong môi trường tiến trình Gateway để tắt đường dẫn này.
Các giá trị `false`, `no`, và `off` cũng tắt nó. Giá trị `exec.env` theo từng lần gọi không thể bật/tắt
snapshot hoặc chuyển hướng bộ nhớ đệm snapshot.

## Biến môi trường được runtime chèn

OpenClaw cũng chèn các dấu mốc ngữ cảnh vào các tiến trình con được tạo:

- `OPENCLAW_SHELL=exec`: đặt cho các lệnh chạy qua công cụ `exec`.
- `OPENCLAW_SHELL=acp`: đặt cho các lần tạo tiến trình backend runtime ACP (ví dụ `acpx`).
- `OPENCLAW_SHELL=acp-client`: đặt cho `openclaw acp client` khi nó tạo tiến trình cầu nối ACP.
- `OPENCLAW_SHELL=tui-local`: đặt cho các lệnh shell `!` của TUI cục bộ.
- `OPENCLAW_CLI=1`: đặt cho các tiến trình con được tạo bởi điểm vào CLI.

Đây là các dấu mốc runtime (không phải cấu hình người dùng bắt buộc). Có thể dùng chúng trong logic shell/profile
để áp dụng các quy tắc theo ngữ cảnh cụ thể.

## Biến môi trường UI

- `OPENCLAW_THEME=light`: ép bảng màu TUI sáng khi terminal của bạn có nền sáng.
- `OPENCLAW_THEME=dark`: ép bảng màu TUI tối.
- `COLORFGBG`: nếu terminal của bạn export biến này, OpenClaw dùng gợi ý màu nền để tự động chọn bảng màu TUI.

## Thay thế biến môi trường trong cấu hình

Bạn có thể tham chiếu trực tiếp biến môi trường trong giá trị chuỗi cấu hình bằng cú pháp `${VAR_NAME}`:

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

- Thay thế chuỗi `${VAR}` trong giá trị cấu hình.
- Đối tượng SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) cho các trường hỗ trợ tham chiếu secret.

Cả hai đều phân giải từ môi trường tiến trình tại thời điểm kích hoạt. Chi tiết SecretRef được ghi lại trong [Quản lý secret](/vi/gateway/secrets).
Bản thân khối `env` cấu hình không phân giải SecretRefs hoặc giá trị viết tắt
`file:...`.

## Biến môi trường liên quan đến đường dẫn

| Biến                     | Mục đích                                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`          | Ghi đè thư mục home dùng cho các mặc định đường dẫn nội bộ của OpenClaw (`~/.openclaw/`, thư mục agent, phiên, thông tin xác thực, onboarding trình cài đặt, và checkout dev mặc định). Hữu ích khi chạy OpenClaw dưới dạng người dùng dịch vụ chuyên dụng. |
| `OPENCLAW_STATE_DIR`     | Ghi đè thư mục trạng thái (mặc định `~/.openclaw`).                                                                                                                                                                                  |
| `OPENCLAW_CONFIG_PATH`   | Ghi đè đường dẫn tệp cấu hình (mặc định `~/.openclaw/openclaw.json`).                                                                                                                                                                |
| `OPENCLAW_INCLUDE_ROOTS` | Danh sách đường dẫn của các thư mục nơi chỉ thị `$include` có thể phân giải tệp bên ngoài thư mục cấu hình (mặc định: không có — `$include` bị giới hạn trong thư mục cấu hình). Có mở rộng dấu ngã.                                  |

## Ghi log

| Biến                             | Mục đích                                                                                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Ghi đè cấp log cho cả tệp và console (ví dụ `debug`, `trace`). Ưu tiên hơn `logging.level` và `logging.consoleLevel` trong cấu hình. Giá trị không hợp lệ bị bỏ qua kèm cảnh báo.             |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Phát chẩn đoán thời gian request/response mô hình có mục tiêu ở cấp `info` mà không bật log debug toàn cục.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Chẩn đoán payload mô hình: `summary`, `tools`, hoặc `full-redacted`. `full-redacted` bị giới hạn và được biên tập nhưng có thể bao gồm văn bản prompt/message.                               |
| `OPENCLAW_DEBUG_SSE`             | Chẩn đoán streaming: `events` cho thời gian first/done, `peek` để bao gồm năm sự kiện SSE đầu tiên đã biên tập.                                                                              |
| `OPENCLAW_DEBUG_CODE_MODE`       | Chẩn đoán bề mặt mô hình chế độ code, bao gồm ẩn provider-tool và thực thi chỉ exec/wait.                                                                                                    |

### `OPENCLAW_HOME`

Khi được đặt, `OPENCLAW_HOME` thay thế thư mục home hệ thống (`$HOME` / `os.homedir()`) cho các mặc định đường dẫn nội bộ của OpenClaw. Điều này bao gồm thư mục trạng thái mặc định, đường dẫn cấu hình, thư mục agent, thông tin xác thực, workspace onboarding trình cài đặt, và checkout dev mặc định dùng bởi `openclaw update --channel dev`.

**Thứ tự ưu tiên:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > fallback home Termux `PREFIX` trên Android > `os.homedir()`

**Ví dụ** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` cũng có thể được đặt thành đường dẫn dấu ngã (ví dụ `~/svc`), đường dẫn này được mở rộng bằng cùng chuỗi fallback home của OS trước khi dùng.

Các biến đường dẫn tường minh như `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, và `OPENCLAW_GIT_DIR` vẫn được ưu tiên. Các tác vụ tài khoản OS như phát hiện tệp khởi động shell, thiết lập trình quản lý gói, và mở rộng host `~` vẫn có thể dùng home hệ thống thực.

## Người dùng nvm: lỗi TLS của web_fetch

Nếu Node.js được cài qua **nvm** (không phải trình quản lý gói hệ thống), `fetch()` tích hợp sẵn dùng
kho CA đi kèm của nvm, kho này có thể thiếu các CA gốc hiện đại (ISRG Root X1/X2 cho Let's Encrypt,
DigiCert Global Root G2, v.v.). Điều này khiến `web_fetch` thất bại với `"fetch failed"` trên hầu hết các trang HTTPS.

Trên Linux, OpenClaw tự động phát hiện nvm và áp dụng bản sửa trong môi trường khởi động thực tế:

- `openclaw gateway install` ghi `NODE_EXTRA_CA_CERTS` vào môi trường dịch vụ systemd
- điểm vào CLI `openclaw` re-exec chính nó với `NODE_EXTRA_CA_CERTS` được đặt trước khi Node khởi động

**Sửa thủ công (cho phiên bản cũ hơn hoặc các lần khởi chạy trực tiếp `node ...`):**

Export biến trước khi khởi động OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Đừng chỉ dựa vào việc ghi biến này vào `~/.openclaw/.env`; Node đọc
`NODE_EXTRA_CA_CERTS` khi tiến trình khởi động.

## Biến môi trường legacy

OpenClaw chỉ đọc các biến môi trường `OPENCLAW_*`. Các tiền tố legacy
`CLAWDBOT_*` và `MOLTBOT_*` từ các bản phát hành trước bị âm thầm
bỏ qua.

Nếu bất kỳ biến nào vẫn được đặt trên tiến trình Gateway khi khởi động, OpenClaw phát ra
một cảnh báo ngừng dùng Node duy nhất (`OPENCLAW_LEGACY_ENV_VARS`) liệt kê
các tiền tố được phát hiện và tổng số lượng. Đổi tên từng giá trị bằng cách thay
tiền tố legacy bằng `OPENCLAW_` (ví dụ `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`); các tên cũ không có hiệu lực.

## Liên quan

- [Cấu hình Gateway](/vi/gateway/configuration)
- [FAQ: biến môi trường và tải .env](/vi/help/faq#env-vars-and-env-loading)
- [Tổng quan về mô hình](/vi/concepts/models)
