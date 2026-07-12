---
read_when:
    - Bạn cần biết những biến môi trường nào được nạp và theo thứ tự nào
    - Bạn đang gỡ lỗi tình trạng thiếu khóa API trong Gateway
    - Bạn đang viết tài liệu về xác thực nhà cung cấp hoặc môi trường triển khai
summary: Nơi OpenClaw tải các biến môi trường và thứ tự ưu tiên
title: Biến môi trường
x-i18n:
    generated_at: "2026-07-12T07:59:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw nạp các biến môi trường từ nhiều nguồn. Quy tắc là **không bao giờ ghi đè các giá trị hiện có**.
Các tệp `.env` trong không gian làm việc là nguồn có mức độ tin cậy thấp hơn: OpenClaw bỏ qua thông tin xác thực của nhà cung cấp và các tùy chọn điều khiển thời gian chạy được bảo vệ trong `.env` của không gian làm việc trước khi áp dụng thứ tự ưu tiên.

## Thứ tự ưu tiên (từ cao xuống thấp)

1. **Môi trường tiến trình** (những gì tiến trình Gateway đã nhận từ shell/daemon cha).
2. **`.env` trong thư mục làm việc hiện tại** (mặc định của dotenv; không ghi đè; thông tin xác thực của nhà cung cấp và các tùy chọn điều khiển thời gian chạy được bảo vệ bị bỏ qua).
3. **`.env` toàn cục** tại `~/.openclaw/.env` (còn gọi là `$OPENCLAW_STATE_DIR/.env`; được khuyến nghị cho khóa API của nhà cung cấp; không ghi đè).
4. **Khối `env` trong cấu hình** tại `~/.openclaw/openclaw.json` (chỉ áp dụng nếu còn thiếu).
5. **Nhập tùy chọn từ shell đăng nhập** (`env.shellEnv.enabled` hoặc `OPENCLAW_LOAD_SHELL_ENV=1`), chỉ áp dụng cho các khóa dự kiến còn thiếu.

Trên các bản cài đặt Ubuntu mới sử dụng thư mục trạng thái mặc định, OpenClaw cũng coi `~/.config/openclaw/gateway.env` là phương án dự phòng tương thích sau `.env` toàn cục. Nếu cả hai tệp đều tồn tại và có giá trị khác nhau, OpenClaw giữ giá trị từ `~/.openclaw/.env` và hiển thị cảnh báo.

Nếu hoàn toàn không có tệp cấu hình, bước 4 sẽ bị bỏ qua; việc nhập từ shell vẫn chạy nếu được bật.

## Thông tin xác thực của nhà cung cấp và `.env` của không gian làm việc

Không chỉ lưu khóa API của nhà cung cấp trong `.env` của không gian làm việc. OpenClaw chặn một tập hợp lớn các khóa thông tin xác thực và khóa chuyển hướng điểm cuối của nhà cung cấp trong các tệp `.env` của không gian làm việc, bao gồm mọi biến môi trường xác thực nhà cung cấp đã biết (ví dụ: `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), cùng với mọi khóa kết thúc bằng `_API_HOST`, `_BASE_URL` hoặc `_HOMESERVER`, và toàn bộ không gian tên `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` và `OPENAI_API_KEY_*`.

Thay vào đó, hãy sử dụng một trong các nguồn đáng tin cậy sau cho thông tin xác thực của nhà cung cấp:

- Môi trường của tiến trình Gateway, chẳng hạn như shell, đơn vị launchd/systemd, bí mật vùng chứa hoặc bí mật CI.
- Tệp dotenv thời gian chạy toàn cục tại `~/.openclaw/.env` hoặc `$OPENCLAW_STATE_DIR/.env`.
- Khối `env` trong cấu hình tại `~/.openclaw/openclaw.json`.
- Tùy chọn nhập từ shell đăng nhập khi `env.shellEnv.enabled` hoặc `OPENCLAW_LOAD_SHELL_ENV=1` được bật.

Nếu trước đây bạn chỉ lưu khóa nhà cung cấp trong `.env` của không gian làm việc, hãy chuyển chúng sang một trong các nguồn đáng tin cậy ở trên. `.env` của không gian làm việc vẫn có thể cung cấp các biến dự án thông thường không phải là thông tin xác thực, chuyển hướng điểm cuối, ghi đè máy chủ hoặc tùy chọn điều khiển thời gian chạy `OPENCLAW_*`.

Xem [Các tệp `.env` của không gian làm việc](/vi/gateway/security#workspace-env-files) để biết cơ sở bảo mật.

## Khối `env` trong cấu hình

Có hai cách tương đương để đặt biến môi trường nội tuyến (cả hai đều không ghi đè):

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

Khối `env` trong cấu hình chỉ chấp nhận các giá trị chuỗi ký tự. Khối này không mở rộng
các giá trị `file:...`; ví dụ, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
được truyền nguyên chuỗi đó cho các nhà cung cấp.

Đối với khóa nhà cung cấp được lưu trong tệp, hãy sử dụng SecretRef trên trường thông tin xác thực
có hỗ trợ tính năng này:

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

Xem [Quản lý bí mật](/vi/gateway/secrets) và
[bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) để biết
các trường được hỗ trợ.

## Nhập môi trường shell

`env.shellEnv` chạy shell đăng nhập của bạn và chỉ nhập các khóa dự kiến **còn thiếu**:

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
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (mặc định `15000`)

## Ảnh chụp nhanh shell của exec

Trên các máy chủ Gateway không chạy Windows, các lệnh `exec` của bash và zsh mặc định sử dụng ảnh chụp nhanh khi khởi động.
Đặt `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` trong môi trường tiến trình Gateway để tắt đường dẫn này.
Các giá trị `false`, `no` và `off` cũng tắt tính năng này. Các giá trị `exec.env` theo từng lệnh gọi không thể bật hoặc tắt
ảnh chụp nhanh hay chuyển hướng bộ nhớ đệm ảnh chụp nhanh.

## Các biến môi trường được chèn khi chạy

OpenClaw cũng chèn các dấu mốc ngữ cảnh vào những tiến trình con được tạo:

- `OPENCLAW_SHELL=exec`: được đặt cho các lệnh chạy thông qua công cụ `exec`.
- `OPENCLAW_SHELL=acp-client`: được đặt cho `openclaw acp client` khi lệnh này tạo tiến trình cầu nối ACP.
- `OPENCLAW_SHELL=tui-local`: được đặt cho các lệnh shell `!` cục bộ của TUI.
- `OPENCLAW_CLI=1`: được đặt cho các tiến trình con được tạo bởi điểm vào CLI.

Đây là các dấu mốc thời gian chạy (không phải cấu hình bắt buộc của người dùng). Chúng có thể được sử dụng trong logic shell/hồ sơ
để áp dụng các quy tắc theo từng ngữ cảnh.

## Các biến môi trường giao diện người dùng

- `OPENCLAW_THEME=light`: buộc sử dụng bảng màu TUI sáng khi thiết bị đầu cuối của bạn có nền sáng.
- `OPENCLAW_THEME=dark`: buộc sử dụng bảng màu TUI tối.
- `COLORFGBG`: nếu thiết bị đầu cuối xuất biến này, OpenClaw sử dụng gợi ý màu nền để tự động chọn bảng màu TUI.

## Thay thế biến môi trường trong cấu hình

Bạn có thể tham chiếu trực tiếp các biến môi trường trong giá trị chuỗi của cấu hình bằng cú pháp `${VAR_NAME}`:

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

## Tham chiếu bí mật so với chuỗi `${ENV}`

OpenClaw hỗ trợ hai mẫu dựa trên môi trường:

- Thay thế chuỗi `${VAR}` trong các giá trị cấu hình.
- Các đối tượng SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) cho những trường hỗ trợ tham chiếu bí mật.

Cả hai đều được phân giải từ môi trường tiến trình tại thời điểm kích hoạt. Chi tiết về SecretRef được ghi lại trong [Quản lý bí mật](/vi/gateway/secrets).
Bản thân khối `env` trong cấu hình không phân giải SecretRef hoặc các giá trị viết tắt
`file:...`.

## Các biến môi trường liên quan đến đường dẫn

| Biến                     | Mục đích                                                                                                                                                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_HOME`          | Ghi đè thư mục chính được dùng cho các đường dẫn mặc định nội bộ của OpenClaw (`~/.openclaw/`, thư mục tác nhân, phiên, thông tin xác thực, quy trình làm quen của trình cài đặt và bản sao làm việc phát triển mặc định). Hữu ích khi chạy OpenClaw bằng người dùng dịch vụ chuyên dụng. |
| `OPENCLAW_STATE_DIR`     | Ghi đè thư mục trạng thái (mặc định `~/.openclaw`).                                                                                                                                                                                                                      |
| `OPENCLAW_CONFIG_PATH`   | Ghi đè đường dẫn tệp cấu hình (mặc định `~/.openclaw/openclaw.json`).                                                                                                                                                                                                    |
| `OPENCLAW_INCLUDE_ROOTS` | Danh sách đường dẫn của các thư mục nơi chỉ thị `$include` có thể phân giải các tệp bên ngoài thư mục cấu hình (mặc định: không có — `$include` bị giới hạn trong thư mục cấu hình). Dấu ngã được mở rộng.                                                                   |

## Ghi nhật ký

| Biến                             | Mục đích                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Ghi đè cấp độ nhật ký cho cả tệp và bảng điều khiển (ví dụ: `debug`, `trace`). Được ưu tiên hơn `logging.level` và `logging.consoleLevel` trong cấu hình. Các giá trị không hợp lệ bị bỏ qua kèm cảnh báo.                  |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Phát thông tin chẩn đoán có mục tiêu về thời gian yêu cầu/phản hồi của mô hình ở cấp độ `info` mà không bật nhật ký gỡ lỗi toàn cục.                                                                                       |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Thông tin chẩn đoán tải trọng mô hình: `summary`, `tools` hoặc `full-redacted`. `full-redacted` bị giới hạn kích thước và được che thông tin nhạy cảm nhưng có thể bao gồm văn bản lời nhắc/tin nhắn.                      |
| `OPENCLAW_DEBUG_SSE`             | Thông tin chẩn đoán truyền phát: `events` để đo thời gian sự kiện đầu tiên/hoàn tất, `peek` để bao gồm năm sự kiện SSE đầu tiên đã được che thông tin nhạy cảm.                                                             |
| `OPENCLAW_DEBUG_CODE_MODE`       | Thông tin chẩn đoán bề mặt mô hình ở chế độ mã, bao gồm việc ẩn công cụ của nhà cung cấp và thực thi trực tiếp/điều khiển gọn nhẹ.                                                                                        |

### `OPENCLAW_HOME`

Khi được đặt, `OPENCLAW_HOME` thay thế thư mục chính của hệ thống (`$HOME` / `os.homedir()`) cho các đường dẫn mặc định nội bộ của OpenClaw. Điều này bao gồm thư mục trạng thái mặc định, đường dẫn cấu hình, thư mục tác nhân, thông tin xác thực, không gian làm việc làm quen của trình cài đặt và bản sao làm việc phát triển mặc định được `openclaw update --channel dev` sử dụng.

**Thứ tự ưu tiên:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > phương án dự phòng thư mục chính từ `PREFIX` của Termux trên Android > `os.homedir()`

**Ví dụ** (LaunchDaemon của macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` cũng có thể được đặt thành đường dẫn có dấu ngã (ví dụ: `~/svc`), dấu ngã sẽ được mở rộng bằng cùng chuỗi phương án dự phòng thư mục chính của hệ điều hành trước khi sử dụng.

Các biến đường dẫn tường minh như `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` và `OPENCLAW_GIT_DIR` vẫn được ưu tiên. Các tác vụ cấp tài khoản hệ điều hành như phát hiện tệp khởi động shell, thiết lập trình quản lý gói và mở rộng `~` trên máy chủ vẫn có thể sử dụng thư mục chính thực của hệ thống.

## Người dùng nvm: lỗi TLS của web_fetch

Nếu Node.js được cài đặt thông qua **nvm** (không phải trình quản lý gói hệ thống), `fetch()` tích hợp sẵn sử dụng
kho CA đi kèm với nvm, có thể thiếu các CA gốc hiện đại (ISRG Root X1/X2 cho Let's Encrypt,
DigiCert Global Root G2, v.v.). Điều này khiến `web_fetch` gặp lỗi `"fetch failed"` trên hầu hết các trang HTTPS.

Trên Linux, OpenClaw tự động phát hiện nvm và áp dụng bản sửa lỗi trong môi trường khởi động thực tế:

- `openclaw gateway install` ghi `NODE_EXTRA_CA_CERTS` vào môi trường dịch vụ systemd
- điểm vào CLI `openclaw` tự thực thi lại với `NODE_EXTRA_CA_CERTS` được đặt trước khi Node khởi động

**Cách sửa thủ công (dành cho phiên bản cũ hơn hoặc khi khởi chạy trực tiếp bằng `node ...`):**

Xuất biến trước khi khởi động OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Không chỉ ghi biến này vào `~/.openclaw/.env`; Node đọc
`NODE_EXTRA_CA_CERTS` khi tiến trình khởi động.

## Các biến môi trường cũ

OpenClaw chỉ đọc các biến môi trường `OPENCLAW_*`. Các tiền tố cũ
`CLAWDBOT_*` và `MOLTBOT_*` từ những bản phát hành trước sẽ bị âm thầm
bỏ qua.

Nếu vẫn còn biến nào được đặt trên tiến trình Gateway khi khởi động, OpenClaw phát ra
một cảnh báo ngừng hỗ trợ duy nhất của Node (`OPENCLAW_LEGACY_ENV_VARS`), liệt kê
các tiền tố được phát hiện và tổng số lượng. Đổi tên từng giá trị bằng cách thay
tiền tố cũ bằng `OPENCLAW_` (ví dụ: `CLAWDBOT_GATEWAY_TOKEN` thành
`OPENCLAW_GATEWAY_TOKEN`); các tên cũ không có hiệu lực.

## Liên quan

- [Cấu hình Gateway](/vi/gateway/configuration)
- [Câu hỏi thường gặp: biến môi trường và cách nạp .env](/vi/help/faq#env-vars-and-env-loading)
- [Tổng quan về mô hình](/vi/concepts/models)
