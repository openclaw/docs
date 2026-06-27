---
read_when:
    - Bạn muốn gỡ bỏ OpenClaw khỏi một máy
    - Dịch vụ gateway vẫn đang chạy sau khi gỡ cài đặt
summary: Gỡ cài đặt OpenClaw hoàn toàn (CLI, dịch vụ, trạng thái, workspace)
title: Gỡ cài đặt
x-i18n:
    generated_at: "2026-06-27T17:38:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0f63bde2769b3d35d928aed1668121086a2952338f2634d45d55da8cc637025b
    source_path: install/uninstall.md
    workflow: 16
---

Hai đường dẫn:

- **Đường dẫn dễ** nếu `openclaw` vẫn được cài đặt.
- **Gỡ bỏ dịch vụ thủ công** nếu CLI đã mất nhưng dịch vụ vẫn đang chạy.

## Đường dẫn dễ (CLI vẫn được cài đặt)

Khuyến nghị: dùng trình gỡ cài đặt tích hợp sẵn:

```bash
openclaw uninstall
```

Khi dùng CLI, thao tác gỡ bỏ trạng thái sẽ giữ nguyên các thư mục workspace đã cấu hình trừ khi bạn cũng chọn `--workspace`.

Xem trước những gì sẽ bị gỡ bỏ (an toàn):

```bash
openclaw uninstall --dry-run --all
```

Không tương tác (tự động hóa / npx). Hãy thận trọng và chỉ dùng sau khi xác nhận phạm vi:

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Các bước thủ công (cùng kết quả):

1. Dừng dịch vụ gateway:

```bash
openclaw gateway stop
```

2. Gỡ cài đặt dịch vụ gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Xóa trạng thái + cấu hình:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Nếu bạn đặt `OPENCLAW_CONFIG_PATH` thành vị trí tùy chỉnh bên ngoài thư mục trạng thái, hãy xóa cả tệp đó.
Nếu bạn muốn giữ một workspace bên trong thư mục trạng thái, chẳng hạn `~/.openclaw/workspace`, hãy chuyển nó sang chỗ khác trước khi chạy `rm -rf` hoặc xóa chọn lọc nội dung trạng thái.

4. Xóa workspace của bạn (tùy chọn, xóa các tệp agent):

```bash
rm -rf ~/.openclaw/workspace
```

5. Gỡ bản cài đặt CLI (chọn lệnh bạn đã dùng):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Nếu bạn đã cài ứng dụng macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Ghi chú:

- Nếu bạn dùng hồ sơ (`--profile` / `OPENCLAW_PROFILE`), hãy lặp lại bước 3 cho từng thư mục trạng thái (mặc định là `~/.openclaw-<profile>`).
- Ở chế độ từ xa, thư mục trạng thái nằm trên **máy chủ gateway**, vì vậy hãy chạy cả các bước 1-4 ở đó.

## Gỡ bỏ dịch vụ thủ công (CLI chưa được cài đặt)

Dùng cách này nếu dịch vụ gateway vẫn tiếp tục chạy nhưng thiếu `openclaw`.

### macOS (launchd)

Nhãn mặc định là `ai.openclaw.gateway` (hoặc `ai.openclaw.<profile>`; bản cũ `com.openclaw.*` vẫn có thể còn tồn tại):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Nếu bạn dùng hồ sơ, hãy thay nhãn và tên plist bằng `ai.openclaw.<profile>`. Gỡ mọi plist cũ `com.openclaw.*` nếu có.

### Linux (systemd user unit)

Tên unit mặc định là `openclaw-gateway.service` (hoặc `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Tên tác vụ mặc định là `OpenClaw Gateway` (hoặc `OpenClaw Gateway (<profile>)`).
Tập lệnh tác vụ nằm trong thư mục trạng thái của bạn dưới tên `gateway.cmd`; các bản cài đặt hiện tại cũng có thể
tạo trình khởi chạy không cửa sổ `gateway.vbs` mà Task Scheduler chạy thay vì
mở trực tiếp `gateway.cmd`.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

Nếu bạn dùng hồ sơ, hãy xóa tên tác vụ tương ứng và các tệp `gateway.cmd` /
`gateway.vbs` trong `~\.openclaw-<profile>`.

## Bản cài đặt thông thường so với source checkout

### Bản cài đặt thông thường (install.sh / npm / pnpm / bun)

Nếu bạn dùng `https://openclaw.ai/install.sh` hoặc `install.ps1`, CLI đã được cài bằng `npm install -g openclaw@latest`.
Gỡ bằng `npm rm -g openclaw` (hoặc `pnpm remove -g` / `bun remove -g` nếu bạn đã cài theo cách đó).

### Source checkout (git clone)

Nếu bạn chạy từ repo checkout (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Gỡ cài đặt dịch vụ gateway **trước khi** xóa repo (dùng đường dẫn dễ ở trên hoặc gỡ bỏ dịch vụ thủ công).
2. Xóa thư mục repo.
3. Xóa trạng thái + workspace như đã trình bày ở trên.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Hướng dẫn di chuyển](/vi/install/migrating)
