---
read_when:
    - Bạn cần biết những biến môi trường nào được tải và theo thứ tự nào
    - Bạn đang gỡ lỗi tình trạng thiếu khóa API trong Gateway
    - Bạn đang viết tài liệu về xác thực nhà cung cấp hoặc môi trường triển khai
summary: Nơi OpenClaw tải các biến môi trường và thứ tự ưu tiên
title: Biến môi trường
x-i18n:
    generated_at: "2026-07-19T05:46:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9f9fdd67ee148931af2e15a12917871a0b85f80f763f0df3a978b7fd39b93eff
    source_path: help/environment.md
    workflow: 16
---

OpenClaw lấy các biến môi trường từ nhiều nguồn. Quy tắc là **không bao giờ ghi đè các giá trị hiện có**.
Các tệp `.env` trong workspace là nguồn có độ tin cậy thấp hơn: OpenClaw bỏ qua thông tin xác thực của nhà cung cấp và các điều khiển runtime được bảo vệ từ `.env` trong workspace trước khi áp dụng thứ tự ưu tiên.

## Thứ tự ưu tiên (từ cao xuống thấp)

1. **Môi trường tiến trình** (những gì tiến trình Gateway đã nhận từ shell/daemon cha).
2. **`.env` trong thư mục làm việc hiện tại** (mặc định của dotenv; không ghi đè; thông tin xác thực của nhà cung cấp và các điều khiển runtime được bảo vệ bị bỏ qua).
3. **`.env` toàn cục** tại `~/.openclaw/.env` (còn gọi là `$OPENCLAW_STATE_DIR/.env`; được khuyến nghị cho khóa API của nhà cung cấp; không ghi đè).
4. **Khối cấu hình `env`** trong `~/.openclaw/openclaw.json` (chỉ áp dụng nếu còn thiếu).
5. **Nhập tùy chọn từ login shell** (`env.shellEnv.enabled` hoặc `OPENCLAW_LOAD_SHELL_ENV=1`), chỉ áp dụng cho các khóa dự kiến còn thiếu.

Trên các bản cài đặt Ubuntu mới sử dụng thư mục trạng thái mặc định, OpenClaw cũng coi `~/.config/openclaw/gateway.env` là phương án dự phòng tương thích sau `.env` toàn cục. Nếu cả hai tệp đều tồn tại và có nội dung không khớp, OpenClaw giữ lại `~/.openclaw/.env` và in cảnh báo.

Nếu hoàn toàn không có tệp cấu hình, bước 4 sẽ bị bỏ qua; việc nhập từ shell vẫn chạy nếu được bật.

## Thông tin xác thực của nhà cung cấp và `.env` trong workspace

Không chỉ lưu các khóa API của nhà cung cấp trong một tệp `.env` ở workspace. OpenClaw chặn một tập hợp lớn các khóa thông tin xác thực của nhà cung cấp và khóa chuyển hướng endpoint từ các tệp `.env` trong workspace, bao gồm mọi biến môi trường xác thực nhà cung cấp đã biết (ví dụ: `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`), cùng với mọi khóa kết thúc bằng `_API_HOST`, `_BASE_URL`, `_ENDPOINT` hoặc `_HOMESERVER`, cũng như toàn bộ không gian tên `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*` và `OPENAI_API_KEY_*`.

Thay vào đó, hãy sử dụng một trong các nguồn đáng tin cậy sau cho thông tin xác thực của nhà cung cấp:

- Môi trường tiến trình Gateway, chẳng hạn như shell, đơn vị launchd/systemd, secret của container hoặc secret của CI.
- Tệp dotenv runtime toàn cục tại `~/.openclaw/.env` hoặc `$OPENCLAW_STATE_DIR/.env`.
- Khối cấu hình `env` trong `~/.openclaw/openclaw.json`.
- Nhập tùy chọn từ login shell khi `env.shellEnv.enabled` hoặc `OPENCLAW_LOAD_SHELL_ENV=1` được bật.

Nếu trước đây bạn chỉ lưu khóa nhà cung cấp hoặc giá trị định tuyến endpoint trong một tệp `.env` ở workspace, hãy chuyển chúng sang một trong các nguồn đáng tin cậy nêu trên. `.env` trong workspace vẫn có thể cung cấp các biến dự án thông thường không phải là thông tin xác thực, chuyển hướng endpoint, ghi đè máy chủ hoặc điều khiển runtime `OPENCLAW_*`.

Xem [Các tệp `.env` trong workspace](/vi/gateway/security#workspace-env-files) để biết cơ sở lý luận về bảo mật.

## Khối cấu hình `env`

Có hai cách tương đương để thiết lập biến môi trường nội tuyến (cả hai đều không ghi đè):

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

Khối cấu hình `env` chỉ chấp nhận các giá trị chuỗi nguyên văn. Khối này không mở rộng
các giá trị `file:...`; ví dụ, `XAI_API_KEY: "file:secrets/xai-api-key.txt"`
được truyền cho các nhà cung cấp dưới dạng chính xác chuỗi đó.

Đối với khóa nhà cung cấp được lưu trong tệp, hãy sử dụng SecretRef trên trường thông tin xác thực có
hỗ trợ:

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
[Bề mặt thông tin xác thực SecretRef](/vi/reference/secretref-credential-surface) để biết
các trường được hỗ trợ.

## Nhập biến môi trường từ shell

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
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000` (mặc định `15000`)

## Ảnh chụp nhanh shell khi thực thi

Trên các máy chủ Gateway không chạy Windows, các lệnh `exec` của bash và zsh mặc định sử dụng ảnh chụp nhanh khi khởi động.
Đặt `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` trong môi trường tiến trình Gateway để tắt đường dẫn này.
Các giá trị `false`, `no` và `off` cũng tắt đường dẫn này. Các giá trị `exec.env` theo từng lần gọi không thể bật/tắt
ảnh chụp nhanh hoặc chuyển hướng bộ nhớ đệm ảnh chụp nhanh.

## Các biến môi trường được chèn trong runtime

OpenClaw cũng chèn các dấu mốc ngữ cảnh vào những tiến trình con được tạo:

- `OPENCLAW_SHELL=exec`: được đặt cho các lệnh chạy qua công cụ `exec`.
- `OPENCLAW_SHELL=acp-client`: được đặt cho `openclaw acp client` khi tiến trình cầu nối ACP được tạo.
- `OPENCLAW_SHELL=tui-local`: được đặt cho các lệnh shell `!` của TUI cục bộ.
- `OPENCLAW_CLI=1`: được đặt cho các tiến trình con do điểm vào CLI tạo.

Đây là các dấu mốc runtime (không phải cấu hình bắt buộc của người dùng). Có thể sử dụng chúng trong logic shell/profile
để áp dụng các quy tắc dành riêng cho từng ngữ cảnh.

## Các biến môi trường của giao diện người dùng

- `OPENCLAW_THEME=light`: bắt buộc dùng bảng màu TUI sáng khi terminal có nền sáng.
- `OPENCLAW_THEME=dark`: bắt buộc dùng bảng màu TUI tối.
- `COLORFGBG`: nếu terminal xuất biến này, OpenClaw sử dụng gợi ý màu nền để tự động chọn bảng màu TUI.

## Thay thế biến môi trường trong cấu hình

Bạn có thể tham chiếu trực tiếp các biến môi trường trong giá trị chuỗi cấu hình bằng cú pháp `${VAR_NAME}`:

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

## Tham chiếu secret so với chuỗi `${ENV}`

OpenClaw hỗ trợ hai mẫu dựa trên biến môi trường:

- Thay thế chuỗi `${VAR}` trong các giá trị cấu hình.
- Đối tượng SecretRef (`{ source: "env", provider: "default", id: "VAR" }`) cho các trường hỗ trợ tham chiếu secret.

Cả hai đều được phân giải từ môi trường tiến trình tại thời điểm kích hoạt. Chi tiết về SecretRef được ghi trong [Quản lý secret](/vi/gateway/secrets).
Bản thân khối cấu hình `env` không phân giải SecretRef hoặc các giá trị viết tắt
`file:...`.

## Các biến môi trường liên quan đến đường dẫn

| Biến                     | Mục đích                                                                                                                                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | Ghi đè thư mục home dùng cho các đường dẫn mặc định nội bộ của OpenClaw (`~/.openclaw/`, thư mục agent, phiên, thông tin xác thực, quy trình làm quen của trình cài đặt và checkout phát triển mặc định). Hữu ích khi chạy OpenClaw bằng người dùng dịch vụ chuyên dụng. |
| `OPENCLAW_STATE_DIR`     | Ghi đè thư mục trạng thái (mặc định `~/.openclaw`).                                                                                                                                                                                            |
| `OPENCLAW_CONFIG_PATH`   | Ghi đè đường dẫn tệp cấu hình (mặc định `~/.openclaw/openclaw.json`).                                                                                                                                                                                        |
| `OPENCLAW_INCLUDE_ROOTS` | Danh sách đường dẫn gồm các thư mục nơi chỉ thị `$include` có thể phân giải tệp bên ngoài thư mục cấu hình (mặc định: không có - `$include` bị giới hạn trong thư mục cấu hình). Có mở rộng dấu ngã.                                          |

## Tải xuống công cụ trợ giúp cho agent

Đặt `OPENCLAW_OFFLINE=1` để ngăn OpenClaw tải xuống các tệp nhị phân trợ giúp `fd`
và `ripgrep` đã được ghim phiên bản. Các công cụ trợ giúp hiện có trong thư mục công cụ của OpenClaw
và các tệp nhị phân hệ thống đang hoạt động vẫn đủ điều kiện sử dụng; một công cụ trợ giúp còn thiếu sẽ tiếp tục
không khả dụng thay vì kích hoạt yêu cầu mạng.

## Ghi log

| Biến                             | Mục đích                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | Ghi đè cấp độ log cho cả tệp và bảng điều khiển (ví dụ: `debug`, `trace`). Được ưu tiên hơn `logging.level` và `logging.consoleLevel` trong cấu hình. Các giá trị không hợp lệ bị bỏ qua kèm cảnh báo. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | Phát chẩn đoán thời gian yêu cầu/phản hồi mô hình có mục tiêu ở cấp độ `info` mà không bật log gỡ lỗi toàn cục.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | Chẩn đoán payload mô hình: `summary`, `tools` hoặc `full-redacted`. `full-redacted` bị giới hạn và biên tập nhưng có thể bao gồm văn bản prompt/tin nhắn.                            |
| `OPENCLAW_DEBUG_SSE`             | Chẩn đoán truyền phát: `events` cho thời gian đầu tiên/hoàn tất, `peek` để bao gồm năm sự kiện SSE đầu tiên đã được biên tập.                                                        |
| `OPENCLAW_DEBUG_CODE_MODE`       | Chẩn đoán bề mặt mô hình ở chế độ mã, bao gồm ẩn công cụ của nhà cung cấp và thực thi trực tiếp/điều khiển nhỏ gọn.                                                                                       |

### `OPENCLAW_HOME`

Khi được đặt, `OPENCLAW_HOME` thay thế thư mục home hệ thống (`$HOME` / `os.homedir()`) cho các đường dẫn mặc định nội bộ của OpenClaw. Điều này bao gồm thư mục trạng thái mặc định, đường dẫn cấu hình, thư mục agent, thông tin xác thực, workspace làm quen của trình cài đặt và checkout phát triển mặc định được `openclaw update --channel dev` sử dụng.

**Thứ tự ưu tiên:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > phương án dự phòng thư mục home `PREFIX` của Termux trên Android > `os.homedir()`

**Ví dụ** (LaunchDaemon trên macOS):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` cũng có thể được đặt thành một đường dẫn có dấu ngã (ví dụ: `~/svc`), đường dẫn này được mở rộng bằng cùng chuỗi dự phòng thư mục home của hệ điều hành trước khi sử dụng.

Các biến đường dẫn tường minh như `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH` và `OPENCLAW_GIT_DIR` vẫn được ưu tiên. Các tác vụ cấp tài khoản hệ điều hành như phát hiện tệp khởi động shell, thiết lập trình quản lý gói và mở rộng `~` của máy chủ vẫn có thể sử dụng thư mục home hệ thống thực.

## Người dùng nvm: lỗi TLS của web_fetch

Nếu Node.js được cài đặt qua **nvm** (không phải trình quản lý gói hệ thống), `fetch()` tích hợp sẵn sử dụng
kho CA đi kèm với nvm, có thể thiếu các CA gốc hiện đại (ISRG Root X1/X2 cho Let's Encrypt,
DigiCert Global Root G2, v.v.). Điều này khiến `web_fetch` gặp lỗi `"fetch failed"` trên hầu hết các trang HTTPS.

Trên Linux, OpenClaw tự động phát hiện nvm và áp dụng bản sửa lỗi trong môi trường khởi động thực tế:

- `openclaw gateway install` ghi `NODE_EXTRA_CA_CERTS` vào môi trường dịch vụ systemd
- điểm vào CLI `openclaw` tự thực thi lại với `NODE_EXTRA_CA_CERTS` được đặt trước khi Node khởi động

**Cách khắc phục thủ công (dành cho các phiên bản cũ hơn hoặc khi khởi chạy trực tiếp `node ...`):**

Xuất biến trước khi khởi động OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Đối với biến này, không nên chỉ ghi vào `~/.openclaw/.env`; Node đọc
`NODE_EXTRA_CA_CERTS` khi tiến trình khởi động.

## Các biến môi trường cũ

OpenClaw chỉ đọc các biến môi trường `OPENCLAW_*`. Các tiền tố cũ
`CLAWDBOT_*` và `MOLTBOT_*` từ các bản phát hành trước sẽ bị âm thầm
bỏ qua.

Nếu bất kỳ biến nào trong số đó vẫn được đặt trên tiến trình Gateway khi khởi động, OpenClaw sẽ phát ra
một cảnh báo ngừng hỗ trợ duy nhất của Node (`OPENCLAW_LEGACY_ENV_VARS`), liệt kê các
tiền tố được phát hiện và tổng số lượng. Đổi tên từng giá trị bằng cách thay
tiền tố cũ bằng `OPENCLAW_` (ví dụ: từ `CLAWDBOT_GATEWAY_TOKEN` thành
`OPENCLAW_GATEWAY_TOKEN`); các tên cũ không có hiệu lực.

## Liên quan

- [Cấu hình Gateway](/vi/gateway/configuration)
- [Câu hỏi thường gặp: biến môi trường và cách tải .env](/vi/help/faq#env-vars-and-env-loading)
- [Tổng quan về mô hình](/vi/concepts/models)
