---
read_when:
    - Triển khai OpenClaw lên Upstash Box
    - Bạn muốn một môi trường Linux được quản lý cho OpenClaw với quyền truy cập bảng điều khiển qua đường hầm SSH
summary: Lưu trữ OpenClaw trên Upstash Box với chế độ duy trì hoạt động và quyền truy cập qua đường hầm SSH
title: Hộp Upstash
x-i18n:
    generated_at: "2026-07-12T08:01:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Chạy Gateway OpenClaw thường trực trên Upstash Box, một môi trường Linux được quản lý
có hỗ trợ vòng đời duy trì hoạt động.

Sử dụng đường hầm SSH để truy cập bảng điều khiển. Không để lộ trực tiếp cổng Gateway
ra internet công cộng.

## Điều kiện tiên quyết

- Tài khoản Upstash
- Upstash Box có chế độ duy trì hoạt động
- Máy khách SSH trên máy cục bộ

## Tạo Box

Tạo một Box có chế độ duy trì hoạt động trong Upstash Console. Ghi lại ID Box (ví dụ
`right-flamingo-14486`) và khóa API Box của bạn.

Upstash duy trì hướng dẫn OpenClaw Box hiện tại tại
[Thiết lập OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Kết nối bằng đường hầm SSH

Chuyển tiếp cổng bảng điều khiển OpenClaw đến máy cục bộ. Sử dụng khóa API Box
làm mật khẩu SSH khi được nhắc:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Các tùy chọn duy trì kết nối giúp giảm tình trạng đường hầm bị ngắt khi không hoạt động trong quá trình thiết lập ban đầu.

## Cài đặt OpenClaw

Bên trong Box:

```bash
sudo npm install -g openclaw
```

## Chạy quy trình thiết lập ban đầu

```bash
openclaw onboard --install-daemon
```

Làm theo các lời nhắc. Sao chép URL và mã thông báo của bảng điều khiển khi quá trình thiết lập ban đầu hoàn tất.

## Khởi động Gateway

Cấu hình Gateway cho mạng Box và khởi động trong nền:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Khi đường hầm SSH đang hoạt động, mở URL bảng điều khiển trên máy cục bộ:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Tự động khởi động lại

Đặt lệnh này làm tập lệnh khởi tạo Box để Gateway khởi động lại khi Box
khởi động:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Khắc phục sự cố

Nếu SSH bị treo trong quá trình thiết lập ban đầu, hãy kết nối lại bằng cấu hình SSH sạch và
các tùy chọn duy trì kết nối:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Thao tác này bỏ qua các thiết lập `~/.ssh/config` cục bộ đã lỗi thời và giữ cho đường hầm hoạt động
trong các khoảng thời gian mạng không hoạt động.

## Liên quan

- [Truy cập từ xa](/vi/gateway/remote)
- [Bảo mật Gateway](/vi/gateway/security)
- [Cập nhật OpenClaw](/vi/install/updating)
