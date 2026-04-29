---
read_when:
    - Thiết lập một máy mới
    - Bạn muốn “mới nhất + tốt nhất” mà không làm hỏng thiết lập cá nhân của bạn
summary: Thiết lập nâng cao và quy trình phát triển cho OpenClaw
title: Thiết lập
x-i18n:
    generated_at: "2026-04-29T23:15:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
Nếu bạn thiết lập lần đầu, hãy bắt đầu với [Bắt đầu](/vi/start/getting-started).
Để biết chi tiết về quy trình hướng dẫn ban đầu, xem [Hướng dẫn ban đầu (CLI)](/vi/start/wizard).
</Note>

## Tóm tắt nhanh

Chọn quy trình thiết lập dựa trên tần suất bạn muốn cập nhật và việc bạn có muốn tự chạy Gateway hay không:

- **Tùy chỉnh nằm ngoài repo:** giữ cấu hình và workspace của bạn trong `~/.openclaw/openclaw.json` và `~/.openclaw/workspace/` để các bản cập nhật repo không ảnh hưởng đến chúng.
- **Quy trình ổn định (khuyến nghị cho đa số):** cài đặt ứng dụng macOS và để ứng dụng chạy Gateway được đóng gói kèm.
- **Quy trình mới nhất (dev):** tự chạy Gateway bằng `pnpm gateway:watch`, rồi để ứng dụng macOS kết nối ở chế độ Local.

## Điều kiện tiên quyết (từ mã nguồn)

- Khuyến nghị Node 24 (Node 22 LTS, hiện là `22.14+`, vẫn được hỗ trợ)
- Ưu tiên `pnpm` (hoặc Bun nếu bạn chủ ý dùng [quy trình Bun](/vi/install/bun))
- Docker (tùy chọn; chỉ dành cho thiết lập/e2e bằng container — xem [Docker](/vi/install/docker))

## Chiến lược tùy chỉnh (để cập nhật không gây ảnh hưởng)

Nếu bạn muốn “100% tùy chỉnh cho tôi” _và_ cập nhật dễ dàng, hãy giữ phần tùy chỉnh của bạn trong:

- **Cấu hình:** `~/.openclaw/openclaw.json` (JSON/kiểu JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompt, bộ nhớ; hãy biến nó thành repo git riêng tư)

Khởi tạo một lần:

```bash
openclaw setup
```

Từ bên trong repo này, dùng mục CLI cục bộ:

```bash
openclaw setup
```

Nếu bạn chưa có bản cài đặt toàn cục, hãy chạy qua `pnpm openclaw setup` (hoặc `bun run openclaw setup` nếu bạn đang dùng quy trình Bun).

## Chạy Gateway từ repo này

Sau `pnpm build`, bạn có thể chạy trực tiếp CLI đã đóng gói:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Quy trình ổn định (ứng dụng macOS trước)

1. Cài đặt + khởi chạy **OpenClaw.app** (thanh menu).
2. Hoàn tất danh sách kiểm tra hướng dẫn ban đầu/quyền (lời nhắc TCC).
3. Đảm bảo Gateway là **Local** và đang chạy (ứng dụng quản lý việc này).
4. Liên kết các bề mặt (ví dụ: WhatsApp):

```bash
openclaw channels login
```

5. Kiểm tra nhanh:

```bash
openclaw health
```

Nếu hướng dẫn ban đầu không có trong bản dựng của bạn:

- Chạy `openclaw setup`, sau đó `openclaw channels login`, rồi khởi động Gateway thủ công (`openclaw gateway`).

## Quy trình mới nhất (Gateway trong terminal)

Mục tiêu: làm việc trên Gateway TypeScript, có hot reload, giữ UI ứng dụng macOS đã kết nối.

### 0) (Tùy chọn) Chạy cả ứng dụng macOS từ mã nguồn

Nếu bạn cũng muốn ứng dụng macOS ở bản mới nhất:

```bash
./scripts/restart-mac.sh
```

### 1) Khởi động Gateway dev

```bash
pnpm install
# Chỉ lần chạy đầu tiên (hoặc sau khi đặt lại cấu hình/workspace OpenClaw cục bộ)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` khởi động hoặc khởi động lại tiến trình theo dõi Gateway trong một phiên tmux
có tên và tự động đính kèm từ các terminal tương tác. Shell không tương tác sẽ giữ
trạng thái tách rời và in `tmux attach -t openclaw-gateway-watch-main`; dùng
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` để giữ một lần chạy tương tác
ở trạng thái tách rời, hoặc `pnpm gateway:watch:raw` cho chế độ theo dõi foreground. Bộ theo dõi
tải lại khi nguồn, cấu hình và siêu dữ liệu Plugin được đóng gói có liên quan thay đổi.
`pnpm openclaw setup` là bước khởi tạo cấu hình/workspace cục bộ một lần cho một checkout mới.
`pnpm gateway:watch` không dựng lại `dist/control-ui`, vì vậy hãy chạy lại `pnpm ui:build` sau các thay đổi trong `ui/` hoặc dùng `pnpm ui:dev` khi phát triển Control UI.

Nếu bạn chủ ý dùng quy trình Bun, các lệnh tương đương là:

```bash
bun install
# Chỉ lần chạy đầu tiên (hoặc sau khi đặt lại cấu hình/workspace OpenClaw cục bộ)
bun run openclaw setup
bun run gateway:watch
```

### 2) Trỏ ứng dụng macOS tới Gateway đang chạy của bạn

Trong **OpenClaw.app**:

- Chế độ kết nối: **Local**
  Ứng dụng sẽ kết nối tới gateway đang chạy trên cổng đã cấu hình.

### 3) Xác minh

- Trạng thái Gateway trong ứng dụng nên hiển thị **“Đang dùng gateway hiện có …”**
- Hoặc qua CLI:

```bash
openclaw health
```

### Các lỗi thường gặp

- **Sai cổng:** Gateway WS mặc định là `ws://127.0.0.1:18789`; giữ ứng dụng + CLI trên cùng một cổng.
- **Nơi lưu trạng thái:**
  - Trạng thái kênh/nhà cung cấp: `~/.openclaw/credentials/`
  - Hồ sơ xác thực mô hình: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Phiên: `~/.openclaw/agents/<agentId>/sessions/`
  - Nhật ký: `/tmp/openclaw/`

## Bản đồ lưu trữ thông tin xác thực

Dùng phần này khi gỡ lỗi xác thực hoặc quyết định cần sao lưu gì:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: cấu hình/env hoặc `channels.telegram.tokenFile` (chỉ tệp thông thường; symlink bị từ chối)
- **Token bot Discord**: cấu hình/env hoặc SecretRef (nhà cung cấp env/file/exec)
- **Token Slack**: cấu hình/env (`channels.slack.*`)
- **Danh sách cho phép ghép đôi**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (tài khoản mặc định)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (tài khoản không mặc định)
- **Hồ sơ xác thực mô hình**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload bí mật dựa trên tệp (tùy chọn)**: `~/.openclaw/secrets.json`
- **Nhập OAuth cũ**: `~/.openclaw/credentials/oauth.json`
  Chi tiết hơn: [Bảo mật](/vi/gateway/security#credential-storage-map).

## Cập nhật (không làm hỏng thiết lập của bạn)

- Giữ `~/.openclaw/workspace` và `~/.openclaw/` làm “đồ của bạn”; đừng đưa prompt/cấu hình cá nhân vào repo `openclaw`.
- Cập nhật mã nguồn: `git pull` + bước cài đặt package manager bạn chọn (`pnpm install` theo mặc định; `bun install` cho quy trình Bun) + tiếp tục dùng lệnh `gateway:watch` tương ứng.

## Linux (dịch vụ người dùng systemd)

Các bản cài đặt Linux dùng dịch vụ **người dùng** systemd. Theo mặc định, systemd dừng các dịch vụ
người dùng khi đăng xuất/nhàn rỗi, điều này sẽ tắt Gateway. Quy trình hướng dẫn ban đầu sẽ cố gắng bật
lingering cho bạn (có thể yêu cầu sudo). Nếu vẫn tắt, hãy chạy:

```bash
sudo loginctl enable-linger $USER
```

Với máy chủ luôn bật hoặc nhiều người dùng, hãy cân nhắc dịch vụ **hệ thống** thay vì
dịch vụ người dùng (không cần lingering). Xem [runbook Gateway](/vi/gateway) để biết ghi chú về systemd.

## Tài liệu liên quan

- [Runbook Gateway](/vi/gateway) (cờ, giám sát, cổng)
- [Cấu hình Gateway](/vi/gateway/configuration) (schema cấu hình + ví dụ)
- [Discord](/vi/channels/discord) và [Telegram](/vi/channels/telegram) (thẻ trả lời + thiết lập replyToMode)
- [Thiết lập trợ lý OpenClaw](/vi/start/openclaw)
- [Ứng dụng macOS](/vi/platforms/macos) (vòng đời gateway)
