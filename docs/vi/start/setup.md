---
read_when:
    - Thiết lập máy mới
    - Bạn muốn “mới nhất + tốt nhất” mà không phá vỡ thiết lập cá nhân của mình
summary: Thiết lập nâng cao và quy trình phát triển cho OpenClaw
title: Thiết lập
x-i18n:
    generated_at: "2026-06-27T18:12:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
Nếu bạn đang thiết lập lần đầu, hãy bắt đầu với [Bắt đầu](/vi/start/getting-started).
Để biết chi tiết về onboarding, xem [Onboarding (CLI)](/vi/start/wizard).
</Note>

## TL;DR

Chọn quy trình thiết lập dựa trên tần suất bạn muốn cập nhật và việc bạn có muốn tự chạy Gateway hay không:

- **Tùy chỉnh nằm ngoài repo:** giữ cấu hình và workspace của bạn trong `~/.openclaw/openclaw.json` và `~/.openclaw/workspace/` để các bản cập nhật repo không chạm vào chúng.
- **Quy trình ổn định (khuyến nghị cho hầu hết người dùng):** cài đặt ứng dụng macOS và để ứng dụng chạy Gateway đi kèm.
- **Quy trình bleeding edge (dev):** tự chạy Gateway qua `pnpm gateway:watch`, rồi để ứng dụng macOS kết nối ở chế độ Local.

## Điều kiện tiên quyết (từ mã nguồn)

- Khuyến nghị Node 24 (Node 22 LTS, hiện tại là `22.19+`, vẫn được hỗ trợ)
- Cần có `pnpm` cho các checkout từ mã nguồn. OpenClaw tải các Plugin đi kèm từ các gói pnpm workspace
  `extensions/*` ở chế độ dev, nên `npm install` ở root không
  chuẩn bị đầy đủ cây mã nguồn.
- Docker (tùy chọn; chỉ dùng cho thiết lập/e2e bằng container - xem [Docker](/vi/install/docker))

## Chiến lược tùy chỉnh (để cập nhật không gây ảnh hưởng)

Nếu bạn muốn "100% tùy chỉnh cho mình" _và_ dễ cập nhật, hãy giữ phần tùy chỉnh của bạn trong:

- **Cấu hình:** `~/.openclaw/openclaw.json` (JSON/gần giống JSON5)
- **Workspace:** `~/.openclaw/workspace` (skills, prompt, bộ nhớ; hãy biến nó thành repo git riêng tư)

Bootstrap một lần:

```bash
openclaw setup
```

Từ bên trong repo này, dùng entry CLI cục bộ:

```bash
openclaw setup
```

Nếu bạn chưa có bản cài đặt toàn cục, hãy chạy qua `pnpm openclaw setup`.

## Chạy Gateway từ repo này

Sau `pnpm build`, bạn có thể chạy trực tiếp CLI đã đóng gói:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Quy trình ổn định (ứng dụng macOS trước)

1. Cài đặt + khởi chạy **OpenClaw.app** (thanh menu).
2. Hoàn tất danh sách kiểm tra onboarding/quyền (lời nhắc TCC).
3. Đảm bảo Gateway ở chế độ **Local** và đang chạy (ứng dụng quản lý việc này).
4. Liên kết các bề mặt (ví dụ: WhatsApp):

```bash
openclaw channels login
```

5. Kiểm tra nhanh:

```bash
openclaw health
```

Nếu onboarding không có trong bản build của bạn:

- Chạy `openclaw setup`, rồi `openclaw channels login`, rồi khởi động Gateway thủ công (`openclaw gateway`).

## Quy trình bleeding edge (Gateway trong terminal)

Mục tiêu: làm việc trên TypeScript Gateway, có hot reload, giữ UI ứng dụng macOS kết nối.

### 0) (Tùy chọn) Chạy cả ứng dụng macOS từ mã nguồn

Nếu bạn cũng muốn ứng dụng macOS ở bleeding edge:

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

`gateway:watch` khởi động hoặc khởi động lại tiến trình theo dõi Gateway trong một phiên tmux có tên
và tự động attach từ các terminal tương tác. Các shell không tương tác sẽ vẫn
detached và in ra `tmux attach -t openclaw-gateway-watch-main`; dùng
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` để giữ một lần chạy tương tác
ở trạng thái detached, hoặc `pnpm gateway:watch:raw` cho chế độ theo dõi foreground. Watcher
tải lại khi có thay đổi liên quan về mã nguồn, cấu hình và siêu dữ liệu Plugin đi kèm. Nếu
Gateway được theo dõi thoát trong quá trình khởi động, `gateway:watch` sẽ chạy
`openclaw doctor --fix --non-interactive` một lần và thử lại; đặt
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` để tắt lượt sửa chữa chỉ dành cho dev đó.
`pnpm openclaw setup` là bước khởi tạo cấu hình/workspace cục bộ một lần cho checkout mới.
`pnpm gateway:watch` không build lại `dist/control-ui`, vì vậy hãy chạy lại `pnpm ui:build` sau các thay đổi trong `ui/` hoặc dùng `pnpm ui:dev` khi phát triển Control UI.

### 2) Trỏ ứng dụng macOS tới Gateway đang chạy của bạn

Trong **OpenClaw.app**:

- Chế độ kết nối: **Local**
  Ứng dụng sẽ attach vào gateway đang chạy trên cổng đã cấu hình.

### 3) Xác minh

- Trạng thái Gateway trong ứng dụng nên hiển thị **"Đang dùng gateway hiện có …"**
- Hoặc qua CLI:

```bash
openclaw health
```

### Các lỗi dễ mắc thường gặp

- **Sai cổng:** Gateway WS mặc định là `ws://127.0.0.1:18789`; giữ ứng dụng + CLI trên cùng một cổng.
- **Nơi lưu trạng thái:**
  - Trạng thái kênh/nhà cung cấp: `~/.openclaw/credentials/`
  - Hồ sơ xác thực mô hình: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Phiên: `~/.openclaw/agents/<agentId>/sessions/`
  - Nhật ký: `/tmp/openclaw/`

## Bản đồ lưu trữ thông tin xác thực

Dùng phần này khi gỡ lỗi xác thực hoặc quyết định cần sao lưu gì:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: config/env hoặc `channels.telegram.tokenFile` (chỉ tệp thông thường; symlink bị từ chối)
- **Token bot Discord**: config/env hoặc SecretRef (nhà cung cấp env/file/exec)
- **Token Slack**: config/env (`channels.slack.*`)
- **Danh sách cho phép ghép nối**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (tài khoản mặc định)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (tài khoản không mặc định)
- **Hồ sơ xác thực mô hình**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload bí mật dựa trên tệp (tùy chọn)**: `~/.openclaw/secrets.json`
- **Nhập OAuth cũ**: `~/.openclaw/credentials/oauth.json`
  Chi tiết hơn: [Bảo mật](/vi/gateway/security#credential-storage-map).

## Cập nhật (mà không làm hỏng thiết lập của bạn)

- Giữ `~/.openclaw/workspace` và `~/.openclaw/` là "đồ của bạn"; đừng đưa prompt/cấu hình cá nhân vào repo `openclaw`.
- Cập nhật mã nguồn: `git pull` + `pnpm install` + tiếp tục dùng `pnpm gateway:watch`.

## Linux (dịch vụ systemd user)

Các bản cài đặt Linux dùng dịch vụ systemd **user**. Theo mặc định, systemd dừng các dịch vụ
người dùng khi đăng xuất/nhàn rỗi, khiến Gateway bị dừng. Onboarding cố gắng bật
lingering cho bạn (có thể nhắc nhập sudo). Nếu vẫn tắt, chạy:

```bash
sudo loginctl enable-linger $USER
```

Với máy chủ luôn bật hoặc nhiều người dùng, hãy cân nhắc dùng dịch vụ **system**
thay vì dịch vụ user (không cần lingering). Xem [Runbook Gateway](/vi/gateway) để biết ghi chú về systemd.

## Tài liệu liên quan

- [Runbook Gateway](/vi/gateway) (cờ, giám sát, cổng)
- [Cấu hình Gateway](/vi/gateway/configuration) (schema cấu hình + ví dụ)
- [Discord](/vi/channels/discord) và [Telegram](/vi/channels/telegram) (thẻ trả lời + cài đặt replyToMode)
- [Thiết lập trợ lý OpenClaw](/vi/start/openclaw)
- [Ứng dụng macOS](/vi/platforms/macos) (vòng đời gateway)
