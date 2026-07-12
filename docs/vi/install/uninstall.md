---
read_when:
    - Bạn muốn gỡ OpenClaw khỏi một máy tính
    - Dịch vụ Gateway vẫn đang chạy sau khi gỡ cài đặt
summary: Gỡ cài đặt hoàn toàn OpenClaw (CLI, dịch vụ, trạng thái, không gian làm việc)
title: Gỡ cài đặt
x-i18n:
    generated_at: "2026-07-12T08:03:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

Hai cách:

- **Cách đơn giản** nếu `openclaw` vẫn được cài đặt.
- **Gỡ bỏ dịch vụ thủ công** nếu CLI không còn nhưng dịch vụ vẫn đang chạy.

## Cách đơn giản (CLI vẫn được cài đặt)

Khuyến nghị: sử dụng trình gỡ cài đặt tích hợp:

```bash
openclaw uninstall
```

Việc xóa trạng thái vẫn giữ lại các thư mục không gian làm việc đã cấu hình, trừ khi bạn cũng chọn `--workspace`.

Xem trước những nội dung sẽ bị xóa (an toàn):

```bash
openclaw uninstall --dry-run --all
```

Không tương tác (tự động hóa / npx). Hãy thận trọng và chỉ sử dụng sau khi xác nhận các phạm vi:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Các cờ: `--service`, `--state`, `--workspace`, `--app` chọn từng phạm vi riêng lẻ; `--all` chọn cả bốn phạm vi.

Các bước thủ công (cho cùng kết quả):

1. Dừng dịch vụ Gateway:

```bash
openclaw gateway stop
```

2. Gỡ cài đặt dịch vụ Gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Xóa trạng thái và cấu hình:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Nếu bạn đặt `OPENCLAW_CONFIG_PATH` thành một vị trí tùy chỉnh bên ngoài thư mục trạng thái, hãy xóa cả tệp đó.
Nếu muốn giữ lại một không gian làm việc bên trong thư mục trạng thái, chẳng hạn như `~/.openclaw/workspace`, hãy di chuyển nó sang nơi khác trước khi chạy `rm -rf` hoặc chỉ xóa có chọn lọc nội dung trạng thái.

4. Xóa không gian làm việc của bạn (tùy chọn, thao tác này xóa các tệp của tác tử):

```bash
rm -rf ~/.openclaw/workspace
```

5. Gỡ bản cài đặt CLI (chọn lệnh tương ứng với cách bạn đã sử dụng):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Nếu bạn đã cài đặt ứng dụng macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Lưu ý:

- Nếu bạn đã sử dụng hồ sơ (`--profile` / `OPENCLAW_PROFILE`), hãy lặp lại bước 3 cho từng thư mục trạng thái (mặc định là `~/.openclaw-<profile>`).
- Trong chế độ từ xa, thư mục trạng thái nằm trên **máy chủ Gateway**, vì vậy cũng hãy chạy các bước 1–4 tại đó.

## Gỡ bỏ dịch vụ thủ công (CLI chưa được cài đặt)

Sử dụng cách này nếu dịch vụ Gateway vẫn tiếp tục chạy nhưng không có `openclaw`.

### macOS (launchd)

Nhãn mặc định là `ai.openclaw.gateway` (hoặc `ai.openclaw.<profile>` khi sử dụng hồ sơ):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Nếu bạn đã sử dụng hồ sơ, hãy thay nhãn và tên tệp plist bằng `ai.openclaw.<profile>`.

### Linux (đơn vị người dùng systemd)

Tên đơn vị mặc định là `openclaw-gateway.service` (hoặc `openclaw-gateway-<profile>.service`). Đơn vị `clawdbot-gateway.service` từ trước khi đổi tên có thể vẫn tồn tại trên các máy đã nâng cấp từ những bản cài đặt rất cũ; `openclaw uninstall` / `openclaw gateway uninstall` sẽ tự động phát hiện và xóa đơn vị đó.

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Tác vụ theo lịch)

Tên tác vụ mặc định là `OpenClaw Gateway` (hoặc `OpenClaw Gateway (<profile>)`).
Tác vụ khởi chạy tập lệnh `gateway.vbs` không có cửa sổ trong thư mục trạng thái của bạn; tập lệnh này sau đó
chạy `gateway.cmd`; hãy xóa cả hai.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Nếu bạn đã sử dụng hồ sơ, hãy xóa tên tác vụ tương ứng và các tệp `gateway.cmd` /
`gateway.vbs` trong `~\.openclaw-<profile>`.

## Cài đặt thông thường và bản sao mã nguồn

### Cài đặt thông thường (install.sh / npm / pnpm / bun)

Nếu bạn đã sử dụng `https://openclaw.ai/install.sh` hoặc `install.ps1`, CLI được cài đặt bằng `npm install -g openclaw@latest`.
Hãy gỡ bỏ bằng `npm rm -g openclaw` (hoặc `pnpm remove -g` / `bun remove -g` nếu bạn đã cài đặt theo cách đó).

### Bản sao mã nguồn (git clone)

Nếu bạn chạy từ một bản sao kho lưu trữ (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Gỡ cài đặt dịch vụ Gateway **trước khi** xóa kho lưu trữ (sử dụng cách đơn giản ở trên hoặc gỡ bỏ dịch vụ thủ công).
2. Xóa thư mục kho lưu trữ.
3. Xóa trạng thái và không gian làm việc như hướng dẫn ở trên.

## Liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Hướng dẫn di chuyển](/vi/install/migrating)
