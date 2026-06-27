---
read_when:
    - Triển khai OpenClaw lên Upstash Box
    - Bạn muốn một môi trường Linux được quản lý cho OpenClaw với quyền truy cập bảng điều khiển qua đường hầm SSH
summary: Lưu trữ OpenClaw trên Upstash Box với keep-alive và quyền truy cập đường hầm SSH
title: Hộp Upstash
x-i18n:
    generated_at: "2026-06-27T17:38:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Chạy OpenClaw Gateway liên tục trên Upstash Box, một môi trường Linux được quản lý
có hỗ trợ vòng đời keep-alive.

Dùng đường hầm SSH để truy cập bảng điều khiển. Không để lộ trực tiếp cổng Gateway
ra internet công cộng.

## Điều kiện tiên quyết

- Tài khoản Upstash
- Upstash Box keep-alive
- SSH client trên máy cục bộ của bạn

## Tạo Box

Tạo Box keep-alive trong Upstash Console. Ghi lại Box ID, chẳng hạn như
`right-flamingo-14486`, và khóa API Box của bạn.

Upstash duy trì hướng dẫn Box OpenClaw hiện tại tại
[Thiết lập OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Kết nối bằng đường hầm SSH

Chuyển tiếp cổng bảng điều khiển OpenClaw tới máy cục bộ của bạn. Dùng khóa API Box
làm mật khẩu SSH khi được nhắc:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Các tùy chọn keepalive giúp giảm tình trạng đường hầm bị ngắt khi rảnh trong quá trình onboarding.

## Cài đặt OpenClaw

Bên trong Box:

```bash
sudo npm install -g openclaw
```

## Chạy onboarding

```bash
openclaw onboard --install-daemon
```

Làm theo các lời nhắc. Sao chép URL bảng điều khiển và token khi onboarding hoàn tất.

## Khởi động Gateway

Cấu hình Gateway cho mạng Box và khởi động trong nền:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Khi đường hầm SSH đang hoạt động, mở URL bảng điều khiển cục bộ:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Tự động khởi động lại

Đặt lệnh này làm script khởi tạo Box để Gateway khởi động lại khi Box
khởi động:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Khắc phục sự cố

Nếu SSH bị treo trong quá trình onboarding, hãy kết nối lại với cấu hình SSH sạch và
keepalive:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Thao tác này bỏ qua các thiết lập `~/.ssh/config` cục bộ đã lỗi thời và giữ đường hầm hoạt động
qua các khoảng thời gian mạng rảnh.

## Liên quan

- [Truy cập từ xa](/vi/gateway/remote)
- [Bảo mật Gateway](/vi/gateway/security)
- [Cập nhật OpenClaw](/vi/install/updating)
