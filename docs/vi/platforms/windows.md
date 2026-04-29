---
read_when:
    - Cài đặt OpenClaw trên Windows
    - Lựa chọn giữa Windows gốc và WSL2
    - Đang tìm trạng thái của ứng dụng đồng hành trên Windows
summary: 'Hỗ trợ Windows: các đường dẫn cài đặt gốc và WSL2, tiến trình nền và các lưu ý hiện tại'
title: Windows
x-i18n:
    generated_at: "2026-04-29T22:58:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw hỗ trợ cả **Windows native** và **WSL2**. WSL2 là lộ trình ổn định hơn và được khuyến nghị để có trải nghiệm đầy đủ — CLI, Gateway và công cụ chạy bên trong Linux với khả năng tương thích đầy đủ. Windows native hoạt động cho việc dùng CLI lõi và Gateway, với một số lưu ý được nêu bên dưới.

Các ứng dụng đồng hành Windows native đang được lên kế hoạch.

## WSL2 (khuyến nghị)

- [Bắt đầu](/vi/start/getting-started) (dùng bên trong WSL)
- [Cài đặt & cập nhật](/vi/install/updating)
- Hướng dẫn WSL2 chính thức (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Trạng thái Windows native

Các luồng CLI trên Windows native đang được cải thiện, nhưng WSL2 vẫn là lộ trình được khuyến nghị.

Những thứ hiện hoạt động tốt trên Windows native:

- trình cài đặt website qua `install.ps1`
- sử dụng CLI cục bộ như `openclaw --version`, `openclaw doctor` và `openclaw plugins list --json`
- kiểm tra smoke local-agent/provider nhúng, chẳng hạn:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Các lưu ý hiện tại:

- `openclaw onboard --non-interactive` vẫn yêu cầu một gateway cục bộ có thể truy cập được, trừ khi bạn truyền `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` và `openclaw gateway install` thử Windows Scheduled Tasks trước
- nếu việc tạo Scheduled Task bị từ chối, OpenClaw sẽ chuyển sang mục đăng nhập trong thư mục Startup theo từng người dùng và khởi động gateway ngay lập tức
- nếu chính `schtasks` bị kẹt hoặc ngừng phản hồi, OpenClaw hiện sẽ nhanh chóng hủy đường dẫn đó và chuyển sang phương án dự phòng thay vì treo mãi mãi
- Scheduled Tasks vẫn được ưu tiên khi khả dụng vì chúng cung cấp trạng thái giám sát tốt hơn

Nếu bạn chỉ muốn CLI native, không cài đặt dịch vụ gateway, hãy dùng một trong các lệnh sau:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Nếu bạn muốn khởi động được quản lý trên Windows native:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Nếu việc tạo Scheduled Task bị chặn, chế độ dịch vụ dự phòng vẫn tự khởi động sau khi đăng nhập thông qua thư mục Startup của người dùng hiện tại.

## Gateway

- [Runbook Gateway](/vi/gateway)
- [Cấu hình](/vi/gateway/configuration)

## Cài đặt dịch vụ Gateway (CLI)

Bên trong WSL2:

```
openclaw onboard --install-daemon
```

Hoặc:

```
openclaw gateway install
```

Hoặc:

```
openclaw configure
```

Chọn **Dịch vụ Gateway** khi được nhắc.

Sửa chữa/di chuyển:

```
openclaw doctor
```

## Tự động khởi động Gateway trước khi đăng nhập Windows

Đối với thiết lập không màn hình, hãy đảm bảo toàn bộ chuỗi khởi động chạy ngay cả khi không có ai đăng nhập vào Windows.

### 1) Giữ dịch vụ người dùng chạy mà không cần đăng nhập

Bên trong WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Cài đặt dịch vụ người dùng gateway của OpenClaw

Bên trong WSL:

```bash
openclaw gateway install
```

### 3) Tự động khởi động WSL khi Windows khởi động

Trong PowerShell với quyền Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Thay `Ubuntu` bằng tên distro của bạn từ:

```powershell
wsl --list --verbose
```

### Xác minh chuỗi khởi động

Sau khi khởi động lại (trước khi đăng nhập Windows), kiểm tra từ WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Nâng cao: đưa dịch vụ WSL ra LAN (portproxy)

WSL có mạng ảo riêng. Nếu một máy khác cần truy cập một dịch vụ đang chạy **bên trong WSL** (SSH, máy chủ TTS cục bộ hoặc Gateway), bạn phải chuyển tiếp một cổng Windows đến IP WSL hiện tại. IP WSL thay đổi sau khi khởi động lại, vì vậy bạn có thể cần làm mới quy tắc chuyển tiếp.

Ví dụ (PowerShell **với quyền Administrator**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Cho phép cổng đi qua Windows Firewall (một lần):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Làm mới portproxy sau khi WSL khởi động lại:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Ghi chú:

- SSH từ một máy khác nhắm đến **IP máy chủ Windows** (ví dụ: `ssh user@windows-host -p 2222`).
- Các nút từ xa phải trỏ đến URL Gateway **có thể truy cập được** (không phải `127.0.0.1`); dùng `openclaw status --all` để xác nhận.
- Dùng `listenaddress=0.0.0.0` để truy cập LAN; `127.0.0.1` chỉ giữ cục bộ.
- Nếu bạn muốn việc này tự động, hãy đăng ký Scheduled Task để chạy bước làm mới khi đăng nhập.

## Cài đặt WSL2 từng bước

### 1) Cài đặt WSL2 + Ubuntu

Mở PowerShell (Admin):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Khởi động lại nếu Windows yêu cầu.

### 2) Bật systemd (bắt buộc để cài đặt gateway)

Trong terminal WSL của bạn:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Sau đó từ PowerShell:

```powershell
wsl --shutdown
```

Mở lại Ubuntu, sau đó xác minh:

```bash
systemctl --user status
```

### 3) Cài đặt OpenClaw (bên trong WSL)

Đối với thiết lập lần đầu thông thường bên trong WSL, hãy làm theo luồng Bắt đầu trên Linux:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Nếu bạn đang phát triển từ mã nguồn thay vì onboarding lần đầu, hãy dùng vòng lặp phát triển từ nguồn trong [Thiết lập](/vi/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Hướng dẫn đầy đủ: [Bắt đầu](/vi/start/getting-started)

## Ứng dụng đồng hành Windows

Chúng tôi chưa có ứng dụng đồng hành Windows. Chúng tôi hoan nghênh đóng góp nếu bạn muốn góp phần biến điều đó thành hiện thực.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Nền tảng](/vi/platforms)
