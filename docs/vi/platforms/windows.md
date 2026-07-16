---
read_when:
    - Cài đặt OpenClaw trên Windows
    - Lựa chọn giữa Windows Hub, Windows gốc và WSL2
    - Thiết lập ứng dụng đồng hành Windows hoặc chế độ Node trên Windows
summary: 'Hỗ trợ Windows: Windows Hub, CLI và Gateway gốc, thiết lập Gateway WSL2, chế độ Node và khắc phục sự cố'
title: Windows
x-i18n:
    generated_at: "2026-07-16T14:50:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw cung cấp ứng dụng đồng hành **Windows Hub** gốc cùng khả năng hỗ trợ CLI trên Windows.
Dùng Windows Hub để có ứng dụng máy tính với chức năng thiết lập, trạng thái khay hệ thống, trò chuyện, chẩn đoán Command
Center và các khả năng của Node Windows. Dùng trình cài đặt PowerShell
để cài đặt trực tiếp CLI/Gateway. Dùng WSL2 để có môi trường chạy Gateway
tương thích với Linux nhất.

## Khuyến nghị: Windows Hub

Windows Hub là ứng dụng đồng hành WinUI gốc dành cho Windows 10 20H2+ và
Windows 11. Ứng dụng được cài đặt mà không cần đặc quyền quản trị viên và cung cấp các trình cài đặt x64
và ARM64 đã ký từ trang phát hành riêng.

Windows Hub được phát hành độc lập với CLI và Gateway của OpenClaw. Tải xuống
trình cài đặt Hub ổn định mới nhất từ
[trang phát hành Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
hoặc trực tiếp qua `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Nếu một liên kết ở trên trả về lỗi 404, hãy truy cập [trang phát hành Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
và mở bản phát hành Windows Hub ổn định mới nhất. Các bản phát hành ổn định thông thường của OpenClaw
cũng sao chép một bản dựng Windows Hub được ghim và xác thực theo bản phát hành; bản sao đó có thể chậm hơn
một bản phát hành Hub độc lập mới hơn.

Sau khi cài đặt, khởi chạy **OpenClaw Companion** từ menu Start hoặc khay
hệ thống. Trình cài đặt cũng thêm các lối tắt cho Gateway Setup, Chat, Settings,
Check for Updates và gỡ cài đặt.

### Windows Hub bao gồm những gì

- Trạng thái khay hệ thống và khởi chạy khi đăng nhập.
- Thiết lập lần chạy đầu tiên cho Gateway WSL cục bộ do ứng dụng sở hữu.
- Cài đặt kết nối cho Gateway cục bộ, từ xa và qua đường hầm SSH.
- Cửa sổ trò chuyện gốc cùng quyền truy cập vào Control UI trên trình duyệt.
- Chẩn đoán Command Center cho phiên, mức sử dụng, kênh, Node, ghép nối
  và các lệnh sửa chữa.
- Chế độ Node Windows cho canvas, màn hình, camera,
  thông báo, trạng thái thiết bị, chức năng nói và `system.run` có kiểm soát do tác nhân điều khiển.
- Chế độ máy chủ MCP cục bộ cho các máy khách MCP như Claude Desktop, Claude Code
  và Cursor.

### Lần khởi chạy đầu tiên

Trong lần khởi chạy đầu tiên, Windows Hub mở phần thiết lập khi không có
Gateway đã lưu nào có thể sử dụng. Cách nhanh nhất là **Set up locally**, thao tác này cung cấp một
bản phân phối WSL `OpenClawGateway` do ứng dụng sở hữu, cài đặt Gateway bên trong và
ghép nối ứng dụng. Thao tác này không xuất hoặc sửa đổi bản phân phối Ubuntu hiện có của bạn.

Chọn **Advanced setup** hoặc mở thẻ Connections khi bạn đã có
Gateway. Bạn có thể kết nối với:

- Gateway cục bộ trên PC này
- Gateway WSL trên PC này
- Gateway từ xa bằng URL và token hoặc mã thiết lập
- Gateway được truy cập qua đường hầm SSH

Khi thiết lập hoàn tất, biểu tượng khay hệ thống chuyển sang màu xanh lục. Mở **Command Center** từ
khay hệ thống để xác nhận kết nối, ghép nối, trạng thái Node và tình trạng kênh.

## Chế độ Node Windows

Windows Hub có thể đăng ký làm Node OpenClaw để tác nhân có thể sử dụng các
khả năng gốc của Windows đã khai báo thông qua Gateway. Các lệnh Node phải được
Node khai báo và được chính sách Gateway cho phép trước khi chạy; xem
[Node](/vi/nodes#command-policy) để biết đầy đủ mô hình cho phép/từ chối.

Các lệnh thường dùng:

| Nhóm | Lệnh                                                                                 |
| ------ | ------------------------------------------------------------------------------------ |
| Canvas | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Màn hình | `screen.snapshot`; `screen.record` yêu cầu bật rõ ràng                          |
| Camera | `camera.list`; `camera.snap`, `camera.clip` yêu cầu bật rõ ràng                  |
| Hệ thống | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Thiết bị | `location.get`, `device.info`, `device.status`                                       |
| Nói   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

Chế độ Node yêu cầu ghép nối Gateway. Nếu ứng dụng hiển thị yêu cầu ghép nối,
hãy phê duyệt yêu cầu đó từ máy chủ Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Gateway chỉ chuyển tiếp những lệnh mà Node khai báo và chính sách máy chủ
cho phép. Các lệnh nhạy cảm về quyền riêng tư như `screen.record`, `camera.snap`
và `camera.clip` cần được bật `gateway.nodes.allowCommands` một cách rõ ràng.

## Chế độ MCP cục bộ

Windows Hub có thể cung cấp cùng một sổ đăng ký khả năng gốc của Windows dưới dạng máy chủ
MCP cục bộ trên địa chỉ loopback, nhờ đó các máy khách MCP cục bộ có thể điều khiển các khả năng của Windows
mà không cần Gateway OpenClaw đang chạy.

Bật chế độ này trong Settings của Windows Hub, ở phần dành cho nhà phát triển/nâng cao. Sau khi máy chủ được bật,
ứng dụng sẽ hiển thị điểm cuối loopback và bearer token.

Ma trận chế độ:

| Chế độ Node | Máy chủ MCP | Hành vi                           |
| --------- | ---------- | ---------------------------------- |
| tắt       | tắt        | Ứng dụng máy tính chỉ dành cho người vận hành          |
| bật        | tắt        | Node Windows kết nối với Gateway     |
| tắt        | bật         | Chỉ máy chủ MCP cục bộ              |
| bật        | bật         | Node Gateway cùng máy chủ MCP cục bộ |

## CLI và Gateway gốc trên Windows

Để ưu tiên sử dụng qua dòng lệnh, hãy cài đặt OpenClaw từ PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Xác minh:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Quy trình khởi động được quản lý sử dụng Windows Scheduled Tasks khi khả dụng. Tác vụ giữ
tập lệnh `gateway.cmd` dễ đọc trong thư mục trạng thái OpenClaw nhưng khởi chạy tập lệnh đó
thông qua trình bao bọc WScript `gateway.vbs` được tạo, nhờ đó Gateway chạy nền
không mở cửa sổ bảng điều khiển hiển thị. Nếu việc tạo tác vụ bị từ chối, OpenClaw
sẽ chuyển sang dùng mục đăng nhập trong thư mục Startup riêng cho từng người dùng.

Cài đặt dịch vụ Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Để chỉ dùng CLI mà không có dịch vụ Gateway được quản lý:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 vẫn là môi trường chạy Gateway tương thích với Linux nhất trên Windows. Windows
Hub có thể thiết lập Gateway WSL do ứng dụng sở hữu cho bạn hoặc bạn có thể cài đặt thủ công bên trong
bản phân phối riêng của mình.

Thiết lập thủ công:

```powershell
wsl --install
# Hoặc chọn rõ một bản phân phối:
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

Sau đó cài đặt OpenClaw bên trong WSL theo hướng dẫn bắt đầu nhanh dành cho Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Tự động khởi động Gateway trước khi đăng nhập Windows

Đối với các thiết lập WSL không giao diện, hãy đảm bảo toàn bộ chuỗi khởi động chạy ngay cả khi không có ai
đăng nhập vào Windows.

Bên trong WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

Trong PowerShell với quyền Quản trị viên:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Thay `Ubuntu` bằng tên bản phân phối của bạn từ:

```powershell
wsl --list --verbose
```

<Note>
Hai thay đổi so với các hướng dẫn cũ:

- **`dbus-launch true` thay vì `/bin/true`**: trên WSL >= 2.6.1.0, một
  lỗi hồi quy ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  chấm dứt bản phân phối khi không hoạt động sau 15-20 giây kể từ lúc máy khách cuối cùng thoát, ngay cả
  khi tính năng duy trì phiên đã được bật. `dbus-launch true` giữ một tiến trình con của init tiếp tục chạy
  để khắc phục tạm thời (thảo luận cộng đồng, [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` thay vì `/ru SYSTEM`**: các bản phân phối WSL riêng cho từng người dùng (
  thiết lập mặc định) không hiển thị với tài khoản SYSTEM, vì vậy tác vụ có vẻ
  đang chạy nhưng bản phân phối không bao giờ khởi động. Chạy bằng tài khoản của chính bạn sẽ tránh
  vấn đề này; Windows nhắc nhập mật khẩu khi tác vụ được tạo.

</Note>

Sau khi khởi động lại, xác minh từ WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Cung cấp dịch vụ WSL qua mạng LAN

WSL có mạng ảo riêng. Nếu một máy khác cần truy cập dịch vụ
bên trong WSL, hãy chuyển tiếp một cổng Windows đến địa chỉ IP WSL hiện tại. Địa chỉ IP WSL có thể
thay đổi sau khi khởi động lại, vì vậy hãy làm mới quy tắc chuyển tiếp khi cần.

Ví dụ trong PowerShell với quyền Quản trị viên:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "Không tìm thấy địa chỉ IP WSL." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Lưu ý:

- Kết nối SSH từ máy khác nhắm đến địa chỉ IP của máy chủ Windows, ví dụ: `ssh user@windows-host -p 2222`.
- Các Node từ xa phải trỏ đến URL Gateway có thể truy cập, không phải `127.0.0.1`.
- Dùng `listenaddress=0.0.0.0` để truy cập qua LAN, `127.0.0.1` để chỉ truy cập cục bộ.

## Khắc phục sự cố

### Biểu tượng khay hệ thống không xuất hiện

Kiểm tra Task Manager để tìm `OpenClaw.Tray.WinUI.exe`. Nếu tiến trình đang chạy, hãy mở
khu vực biểu tượng khay hệ thống bị ẩn và ghim tiến trình đó. Nếu không, hãy khởi chạy **OpenClaw Companion** từ
menu Start.

### Thiết lập cục bộ không thành công

Mở nhật ký thiết lập từ Windows Hub hoặc kiểm tra:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Các nguyên nhân thường gặp: WSL bị tắt, tính năng ảo hóa bị chặn, trạng thái WSL
do ứng dụng sở hữu đã lỗi thời hoặc lỗi mạng trong khi cài đặt gói Gateway.

### Ứng dụng cho biết cần ghép nối

Phê duyệt yêu cầu của người vận hành hoặc Node từ Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Nếu thiết bị đã có token, hãy kết nối lại từ thẻ Connections sau khi
phê duyệt.

### Trò chuyện web không thể truy cập Gateway từ xa

Trò chuyện web từ xa cần HTTPS hoặc localhost. Đối với chứng chỉ tự ký, hãy tin cậy
chứng chỉ trong Windows hoặc sử dụng đường hầm SSH đến URL localhost.

### Các lệnh `screen.snapshot`, camera hoặc âm thanh không thành công

Xác nhận các quyền của Windows đối với camera, micrô, chụp màn hình và
thông báo. Các bản cài đặt đóng gói khai báo những khả năng được bảo vệ, nhưng
Windows vẫn có thể nhắc trong lần đầu tiên một lệnh sử dụng chúng.

### Kết nối Git hoặc GitHub không thành công

Một số mạng chặn hoặc giới hạn HTTPS đến GitHub. Nếu `git clone` hoặc
`gh auth login` không thành công, hãy thử mạng khác, VPN hoặc proxy HTTP/HTTPS.

Để xác thực `gh` dựa trên token trong phiên hiện tại:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Không bao giờ commit token hoặc dán token vào issue hay pull request.

## Liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Thiết lập Node.js](/vi/install/node)
- [Node](/vi/nodes)
- [Control UI](/vi/web/control-ui)
- [Cấu hình Gateway](/vi/gateway/configuration)
