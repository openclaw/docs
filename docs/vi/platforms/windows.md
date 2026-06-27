---
read_when:
    - Cài đặt OpenClaw trên Windows
    - Chọn giữa Windows Hub, Windows gốc và WSL2
    - Thiết lập ứng dụng đồng hành trên Windows hoặc chế độ node Windows
summary: 'Hỗ trợ Windows: Windows Hub, CLI và Gateway gốc, thiết lập gateway WSL2, chế độ node và xử lý sự cố'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:43:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw cung cấp một ứng dụng đồng hành **Windows Hub** gốc cùng với hỗ trợ CLI trên Windows.
Dùng Windows Hub khi bạn muốn một ứng dụng máy tính để bàn có thiết lập, trạng thái khay hệ thống, chat,
chẩn đoán Command Center và các khả năng Node Windows. Dùng trình cài đặt PowerShell
khi bạn muốn CLI/Gateway trực tiếp. Dùng WSL2 khi bạn muốn môi trường chạy Gateway
tương thích với Linux nhất.

## Khuyến nghị: Windows Hub

Windows Hub là ứng dụng đồng hành WinUI gốc cho Windows 10 20H2+ và Windows 11. Ứng dụng cài đặt không cần quyền quản trị viên và được phát hành với các trình cài đặt
x64 và ARM64 đã ký trên các bản phát hành OpenClaw.

Tải trình cài đặt ổn định mới nhất từ [trang bản phát hành OpenClaw](https://github.com/openclaw/openclaw/releases):

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Tổng kiểm tra](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

Nếu một liên kết tải xuống ở trên trả về 404, hãy truy cập [trang bản phát hành](https://github.com/openclaw/openclaw/releases) và tìm các tài sản `OpenClawCompanion-Setup-*` trong bản phát hành mới nhất.

Sau khi cài đặt, khởi chạy **OpenClaw Companion** từ menu Start hoặc khay hệ thống.
Trình cài đặt cũng thêm lối tắt cho Thiết lập Gateway, Chat, Cài đặt,
Kiểm tra cập nhật và gỡ cài đặt.

### Windows Hub bao gồm những gì

- trạng thái khay hệ thống và khởi chạy khi đăng nhập
- thiết lập lần chạy đầu cho Gateway WSL cục bộ do ứng dụng sở hữu
- cài đặt kết nối cho Gateway cục bộ, từ xa và qua đường hầm SSH
- cửa sổ chat gốc cùng quyền truy cập vào Control UI trên trình duyệt
- chẩn đoán Command Center cho phiên, mức sử dụng, kênh, Node, ghép nối và
  lệnh sửa chữa
- chế độ Node Windows cho canvas, màn hình, camera, thông báo,
  trạng thái thiết bị, chuyển văn bản thành giọng nói, chuyển giọng nói thành văn bản và `system.run` có kiểm soát do agent điều khiển
- chế độ máy chủ MCP cục bộ cho các client MCP như Claude Desktop, Claude Code và
  Cursor

### Lần khởi chạy đầu tiên

Ở lần khởi chạy đầu tiên, Windows Hub mở phần thiết lập khi không có Gateway đã lưu nào dùng được.
Đường dẫn nhanh nhất là **Thiết lập cục bộ**, thao tác này cấp phát một distro WSL
`OpenClawGateway` do ứng dụng sở hữu, cài Gateway bên trong đó và ghép nối ứng dụng.
Việc này không xuất hay sửa đổi distro Ubuntu hiện có của bạn.

Chọn **Thiết lập nâng cao** hoặc mở tab Kết nối khi bạn đã có
Gateway. Bạn có thể kết nối tới:

- một Gateway cục bộ trên PC này
- một Gateway WSL trên PC này
- một Gateway từ xa bằng URL và token hoặc mã thiết lập
- một Gateway được truy cập qua đường hầm SSH

Khi thiết lập hoàn tất, biểu tượng khay chuyển sang màu xanh lá. Mở **Command Center** từ
khay để xác nhận kết nối, ghép nối, trạng thái Node và sức khỏe kênh.

## Chế độ Node Windows

Windows Hub có thể đăng ký như một Node OpenClaw hạng nhất. Sau đó agent có thể dùng
các khả năng gốc Windows đã khai báo thông qua Gateway.

Các lệnh thường dùng gồm:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` và, khi chọn tham gia rõ ràng, `screen.record`
- `camera.list` và, khi chọn tham gia rõ ràng, `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

Chế độ Node yêu cầu ghép nối Gateway. Nếu ứng dụng hiển thị yêu cầu ghép nối, hãy phê duyệt
yêu cầu đó từ máy chủ Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Gateway chỉ chuyển tiếp những lệnh mà Node khai báo và chính sách máy chủ
cho phép. Các lệnh nhạy cảm về quyền riêng tư như `screen.record`, `camera.snap` và
`camera.clip` yêu cầu chọn tham gia `gateway.nodes.allowCommands` rõ ràng.

## Chế độ MCP cục bộ

Windows Hub có thể phơi bày cùng registry khả năng gốc Windows dưới dạng máy chủ
MCP cục bộ trên loopback. Điều này hữu ích khi bạn muốn các client MCP cục bộ điều khiển
các khả năng Windows mà không cần Gateway OpenClaw đang chạy.

Bật tính năng này trong Cài đặt Windows Hub dưới mục nhà phát triển/nâng cao. Ứng dụng
hiển thị endpoint loopback và bearer token sau khi máy chủ được bật.

Ma trận chế độ:

| Chế độ Node | Máy chủ MCP | Hành vi                            |
| --------- | ---------- | ---------------------------------- |
| tắt       | tắt        | Ứng dụng máy tính để bàn chỉ dành cho operator |
| bật       | tắt        | Node Windows đã kết nối Gateway    |
| tắt       | bật        | Chỉ máy chủ MCP cục bộ             |
| bật       | bật        | Node Gateway cùng máy chủ MCP cục bộ |

## CLI và Gateway gốc trên Windows

Để dùng ưu tiên terminal, cài OpenClaw từ PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Xác minh:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Các luồng CLI và Gateway gốc trên Windows được hỗ trợ và tiếp tục được cải thiện.
Khởi động được quản lý dùng Windows Scheduled Tasks khi có sẵn. Task giữ script
`gateway.cmd` dễ đọc trong thư mục trạng thái OpenClaw, nhưng khởi chạy nó qua
wrapper WScript `gateway.vbs` được tạo để Gateway nền không mở
cửa sổ console hiển thị. Nếu việc tạo task bị từ chối, OpenClaw dự phòng sang một
mục đăng nhập thư mục Startup theo từng người dùng.

Để cài đặt dịch vụ Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Nếu bạn chỉ muốn dùng CLI mà không có dịch vụ Gateway được quản lý:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 vẫn là môi trường chạy Gateway tương thích với Linux nhất trên Windows. Windows Hub
có thể thiết lập một Gateway WSL do ứng dụng sở hữu cho bạn, hoặc bạn có thể cài đặt thủ công bên trong
distro của riêng mình.

Thiết lập thủ công:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Bật systemd bên trong WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Khởi động lại WSL từ PowerShell:

```powershell
wsl --shutdown
```

Sau đó cài OpenClaw bên trong WSL bằng hướng dẫn nhanh Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Tự động khởi động Gateway trước khi đăng nhập Windows

Với các thiết lập WSL không giao diện, hãy đảm bảo toàn bộ chuỗi khởi động chạy ngay cả khi không ai đăng nhập
vào Windows.

Bên trong WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

Trong PowerShell với quyền Administrator:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Thay `Ubuntu` bằng tên distro của bạn từ:

```powershell
wsl --list --verbose
```

> **Lưu ý:** Hai thay đổi so với các công thức cũ:
>
> - **`dbus-launch true` thay vì `/bin/true`** — Trên WSL ≥ 2.6.1.0, một hồi quy ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) khiến distro tự dừng khi nhàn rỗi sau 15–20 giây kể từ lúc client cuối cùng thoát, ngay cả khi linger đã bật. `dbus-launch true` giữ một tiến trình con của init còn sống như một cách khắc phục tạm thời ([thảo luận cộng đồng, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` thay vì `/ru SYSTEM`** — Các distro WSL theo từng người dùng (thiết lập mặc định) không hiển thị với tài khoản SYSTEM; task có vẻ chạy nhưng distro không bao giờ được khởi động. Chạy bằng tài khoản của chính bạn tránh được việc này. Windows sẽ nhắc nhập mật khẩu của bạn khi task được tạo.

Sau khi khởi động lại, xác minh từ WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Phơi bày dịch vụ WSL qua LAN

WSL có mạng ảo riêng. Nếu một máy khác cần truy cập một dịch vụ bên trong
WSL, hãy chuyển tiếp một cổng Windows tới IP WSL hiện tại. IP WSL có thể thay đổi sau
khi khởi động lại, vì vậy hãy làm mới quy tắc chuyển tiếp khi cần.

Ví dụ trong PowerShell với quyền Administrator:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Ghi chú:

- SSH từ máy khác nhắm tới IP máy chủ Windows, ví dụ
  `ssh user@windows-host -p 2222`.
- Các Node từ xa phải trỏ tới một URL Gateway có thể truy cập được, không phải `127.0.0.1`.
- Dùng `listenaddress=0.0.0.0` để truy cập LAN. Dùng `127.0.0.1` để chỉ truy cập
  cục bộ.

## Khắc phục sự cố

### Biểu tượng khay không xuất hiện

Kiểm tra Task Manager để tìm `OpenClaw.Tray.WinUI.exe`. Nếu nó đang chạy, hãy mở
khu vực biểu tượng khay ẩn và ghim nó. Nếu nó không chạy, hãy khởi chạy **OpenClaw
Companion** từ menu Start.

### Thiết lập cục bộ thất bại

Mở nhật ký thiết lập từ Windows Hub hoặc kiểm tra:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Nguyên nhân thường gặp là WSL bị tắt, ảo hóa bị chặn, trạng thái WSL
do ứng dụng sở hữu đã cũ, hoặc lỗi mạng trong khi cài đặt gói Gateway.

### Ứng dụng báo cần ghép nối

Phê duyệt yêu cầu operator hoặc Node từ Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

Nếu thiết bị đã có token, hãy kết nối lại từ tab Kết nối sau khi
phê duyệt.

### Web chat không thể truy cập Gateway từ xa

Web chat từ xa cần HTTPS hoặc localhost. Với chứng chỉ tự ký, hãy tin cậy
chứng chỉ trong Windows, hoặc dùng đường hầm SSH tới một URL localhost.

### `screen.snapshot`, camera hoặc lệnh âm thanh thất bại

Xác nhận quyền Windows cho camera, microphone, chụp màn hình và
thông báo. Các bản cài đặt đóng gói khai báo các khả năng được bảo vệ, nhưng Windows
vẫn có thể nhắc trong lần đầu một lệnh sử dụng chúng.

### Kết nối Git hoặc GitHub thất bại

Một số mạng chặn hoặc giới hạn HTTPS tới GitHub. Nếu `git clone` hoặc `gh auth
login` thất bại, hãy thử mạng khác, VPN hoặc proxy HTTP/HTTPS.

Để xác thực `gh` dựa trên token trong phiên hiện tại:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Không bao giờ commit token hoặc dán chúng vào issue hay pull request.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Thiết lập Node.js](/vi/install/node)
- [Nodes](/vi/nodes)
- [Control UI](/vi/web/control-ui)
- [Cấu hình Gateway](/vi/gateway/configuration)
