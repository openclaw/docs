---
read_when:
    - Thiết lập một máy mới
    - Bạn muốn "mới nhất + tốt nhất" mà không làm hỏng thiết lập cá nhân của mình
summary: Thiết lập nâng cao và quy trình phát triển cho OpenClaw
title: Thiết lập
x-i18n:
    generated_at: "2026-05-06T09:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b65443deac92ed74d2fb0d8db9a00bf81b37d60ce25c0c38c1f8d9a7c0cfd3
    source_path: start/setup.md
    workflow: 16
---

<Note>
Nếu bạn thiết lập lần đầu, hãy bắt đầu với [Bắt đầu](/vi/start/getting-started).
Để biết chi tiết về quy trình nhập môn, xem [Nhập môn (CLI)](/vi/start/wizard).
</Note>

## Tóm tắt nhanh

Chọn một quy trình thiết lập dựa trên tần suất bạn muốn cập nhật và việc bạn có muốn tự chạy Gateway hay không:

- **Tùy chỉnh nằm ngoài repo:** giữ cấu hình và không gian làm việc của bạn trong `~/.openclaw/openclaw.json` và `~/.openclaw/workspace/` để các bản cập nhật repo không chạm vào chúng.
- **Quy trình ổn định (khuyến nghị cho hầu hết người dùng):** cài đặt ứng dụng macOS và để ứng dụng chạy Gateway đi kèm.
- **Quy trình mới nhất (dev):** tự chạy Gateway qua `pnpm gateway:watch`, rồi để ứng dụng macOS kết nối ở chế độ Local.

## Điều kiện tiên quyết (từ mã nguồn)

- Khuyến nghị Node 24 (Node 22 LTS, hiện là `22.14+`, vẫn được hỗ trợ)
- Cần `pnpm` cho các checkout từ mã nguồn. OpenClaw tải các Plugin đi kèm từ các gói pnpm workspace `extensions/*` ở chế độ dev, vì vậy `npm install` ở gốc không chuẩn bị đầy đủ toàn bộ cây mã nguồn.
- Docker (tùy chọn; chỉ dành cho thiết lập/e2e dạng container - xem [Docker](/vi/install/docker))

## Chiến lược tùy chỉnh (để cập nhật không gây ảnh hưởng)

Nếu bạn muốn "100% phù hợp với tôi" _và_ dễ cập nhật, hãy giữ tùy chỉnh của bạn trong:

- **Cấu hình:** `~/.openclaw/openclaw.json` (JSON/gần giống JSON5)
- **Không gian làm việc:** `~/.openclaw/workspace` (Skills, prompt, bộ nhớ; biến nó thành một git repo riêng tư)

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

## Quy trình ổn định (ưu tiên ứng dụng macOS)

1. Cài đặt + khởi chạy **OpenClaw.app** (thanh menu).
2. Hoàn tất danh sách kiểm tra nhập môn/quyền (các prompt TCC).
3. Đảm bảo Gateway là **Local** và đang chạy (ứng dụng quản lý nó).
4. Liên kết các bề mặt (ví dụ: WhatsApp):

```bash
openclaw channels login
```

5. Kiểm tra nhanh:

```bash
openclaw health
```

Nếu nhập môn không có trong bản build của bạn:

- Chạy `openclaw setup`, rồi `openclaw channels login`, rồi khởi động Gateway thủ công (`openclaw gateway`).

## Quy trình mới nhất (Gateway trong terminal)

Mục tiêu: làm việc trên Gateway TypeScript, có hot reload, giữ UI ứng dụng macOS được kết nối.

### 0) (Tùy chọn) Chạy cả ứng dụng macOS từ mã nguồn

Nếu bạn cũng muốn ứng dụng macOS ở phiên bản mới nhất:

```bash
./scripts/restart-mac.sh
```

### 1) Khởi động Gateway dev

```bash
pnpm install
# Chỉ lần chạy đầu tiên (hoặc sau khi đặt lại cấu hình/không gian làm việc OpenClaw cục bộ)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` khởi động hoặc khởi động lại tiến trình theo dõi Gateway trong một phiên tmux được đặt tên và tự động attach từ các terminal tương tác. Shell không tương tác sẽ giữ trạng thái detached và in `tmux attach -t openclaw-gateway-watch-main`; dùng `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` để giữ một lần chạy tương tác ở trạng thái detached, hoặc `pnpm gateway:watch:raw` cho chế độ theo dõi foreground. Trình theo dõi tải lại khi có thay đổi liên quan đến mã nguồn, cấu hình và metadata Plugin đi kèm. Nếu Gateway đang được theo dõi thoát trong khi khởi động, `gateway:watch` chạy `openclaw doctor --fix --non-interactive` một lần và thử lại; đặt `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` để tắt lượt sửa chữa chỉ dành cho dev đó.
`pnpm openclaw setup` là bước khởi tạo cấu hình/không gian làm việc cục bộ một lần cho một checkout mới.
`pnpm gateway:watch` không build lại `dist/control-ui`, vì vậy hãy chạy lại `pnpm ui:build` sau các thay đổi trong `ui/` hoặc dùng `pnpm ui:dev` khi phát triển Control UI.

### 2) Trỏ ứng dụng macOS tới Gateway đang chạy của bạn

Trong **OpenClaw.app**:

- Chế độ kết nối: **Local**
  Ứng dụng sẽ attach vào Gateway đang chạy trên cổng đã cấu hình.

### 3) Xác minh

- Trạng thái Gateway trong ứng dụng nên hiển thị **"Đang dùng gateway hiện có …"**
- Hoặc qua CLI:

```bash
openclaw health
```

### Các lỗi dễ gặp

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
- **Allowlist ghép nối**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (tài khoản mặc định)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (tài khoản không mặc định)
- **Hồ sơ xác thực mô hình**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload bí mật dựa trên tệp (tùy chọn)**: `~/.openclaw/secrets.json`
- **Nhập OAuth cũ**: `~/.openclaw/credentials/oauth.json`
  Chi tiết hơn: [Bảo mật](/vi/gateway/security#credential-storage-map).

## Cập nhật (không làm hỏng thiết lập của bạn)

- Giữ `~/.openclaw/workspace` và `~/.openclaw/` là "phần của bạn"; đừng đưa prompt/cấu hình cá nhân vào repo `openclaw`.
- Cập nhật mã nguồn: `git pull` + `pnpm install` + tiếp tục dùng `pnpm gateway:watch`.

## Linux (dịch vụ người dùng systemd)

Các bản cài đặt Linux dùng dịch vụ **người dùng** systemd. Theo mặc định, systemd dừng dịch vụ người dùng khi đăng xuất/nhàn rỗi, việc này sẽ dừng Gateway. Quy trình nhập môn cố gắng bật lingering cho bạn (có thể yêu cầu sudo). Nếu vẫn tắt, chạy:

```bash
sudo loginctl enable-linger $USER
```

Với máy chủ luôn bật hoặc nhiều người dùng, cân nhắc dùng dịch vụ **hệ thống** thay vì dịch vụ người dùng (không cần lingering). Xem [Runbook Gateway](/vi/gateway) để biết các ghi chú systemd.

## Tài liệu liên quan

- [Runbook Gateway](/vi/gateway) (cờ, giám sát, cổng)
- [Cấu hình Gateway](/vi/gateway/configuration) (schema cấu hình + ví dụ)
- [Discord](/vi/channels/discord) và [Telegram](/vi/channels/telegram) (thẻ trả lời + thiết lập replyToMode)
- [Thiết lập trợ lý OpenClaw](/vi/start/openclaw)
- [Ứng dụng macOS](/vi/platforms/macos) (vòng đời Gateway)
