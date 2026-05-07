---
read_when:
    - Đang tìm trạng thái ứng dụng đồng hành cho Linux
    - Lập kế hoạch phạm vi hỗ trợ nền tảng hoặc đóng góp
    - Gỡ lỗi tình trạng Linux chấm dứt tiến trình do OOM hoặc mã thoát 137 trên VPS hoặc vùng chứa
summary: Hỗ trợ Linux + trạng thái ứng dụng đồng hành
title: Ứng dụng Linux
x-i18n:
    generated_at: "2026-05-07T13:21:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

Gateway được hỗ trợ đầy đủ trên Linux. **Node là runtime được khuyến nghị**.
Bun không được khuyến nghị cho Gateway (lỗi WhatsApp/Telegram).

Ứng dụng đồng hành gốc cho Linux đã được lên kế hoạch. Rất hoan nghênh đóng góp nếu bạn muốn giúp xây dựng một ứng dụng như vậy.

## Lộ trình nhanh cho người mới bắt đầu (VPS)

1. Cài đặt Node 24 (khuyến nghị; Node 22 LTS, hiện là `22.16+`, vẫn hoạt động để tương thích)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Từ laptop của bạn: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Mở `http://127.0.0.1:18789/` và xác thực bằng bí mật dùng chung đã cấu hình (token theo mặc định; mật khẩu nếu bạn đặt `gateway.auth.mode: "password"`)

Hướng dẫn máy chủ Linux đầy đủ: [Máy chủ Linux](/vi/vps). Ví dụ VPS từng bước: [exe.dev](/vi/install/exe-dev)

## Cài đặt

- [Bắt đầu](/vi/start/getting-started)
- [Cài đặt và cập nhật](/vi/install/updating)
- Luồng tùy chọn: [Bun (thử nghiệm)](/vi/install/bun), [Nix](/vi/install/nix), [Docker](/vi/install/docker)

## Gateway

- [Sổ tay vận hành Gateway](/vi/gateway)
- [Cấu hình](/vi/gateway/configuration)

## Cài đặt dịch vụ Gateway (CLI)

Dùng một trong các lệnh sau:

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

## Điều khiển hệ thống (đơn vị người dùng systemd)

OpenClaw cài đặt dịch vụ **người dùng** systemd theo mặc định. Dùng dịch vụ **hệ thống**
cho các máy chủ dùng chung hoặc luôn bật. `openclaw gateway install` và
`openclaw onboard --install-daemon` đã kết xuất đơn vị chuẩn hiện tại
cho bạn; chỉ tự viết khi bạn cần thiết lập hệ thống/trình quản lý dịch vụ
tùy chỉnh. Hướng dẫn dịch vụ đầy đủ nằm trong [sổ tay vận hành Gateway](/vi/gateway).

Thiết lập tối thiểu:

Tạo `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Bật dịch vụ:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Áp lực bộ nhớ và tiến trình bị OOM kết thúc

Trên Linux, kernel chọn một nạn nhân OOM khi cgroup của máy chủ, VM hoặc container
hết bộ nhớ. Gateway có thể là nạn nhân không phù hợp vì nó sở hữu các
phiên chạy dài hạn và kết nối kênh. Vì vậy OpenClaw ưu tiên để các tiến trình con
tạm thời bị kết thúc trước Gateway khi có thể.

Với các tiến trình con Linux đủ điều kiện, OpenClaw khởi động tiến trình con thông qua một
trình bao bọc `/bin/sh` ngắn, tăng `oom_score_adj` của chính tiến trình con lên `1000`, rồi
`exec` lệnh thật. Đây là thao tác không cần đặc quyền vì tiến trình con
chỉ tăng khả năng chính nó bị OOM kết thúc.

Các bề mặt tiến trình con được bao phủ gồm:

- tiến trình con lệnh do supervisor quản lý,
- tiến trình con shell PTY,
- tiến trình con máy chủ MCP stdio,
- tiến trình trình duyệt/Chrome do OpenClaw khởi chạy.

Trình bao bọc chỉ dành cho Linux và được bỏ qua khi không có `/bin/sh`. Nó
cũng được bỏ qua nếu môi trường của tiến trình con đặt `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no`, hoặc `off`.

Để xác minh một tiến trình con:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Giá trị mong đợi cho các tiến trình con được bao phủ là `1000`. Tiến trình Gateway nên giữ
điểm bình thường của nó, thường là `0`.

Điều này không thay thế việc tinh chỉnh bộ nhớ thông thường. Nếu VPS hoặc container liên tục
kết thúc tiến trình con, hãy tăng giới hạn bộ nhớ, giảm mức đồng thời, hoặc thêm các
biện pháp kiểm soát tài nguyên mạnh hơn như `MemoryMax=` của systemd hoặc giới hạn bộ nhớ cấp container.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Máy chủ Linux](/vi/vps)
- [Raspberry Pi](/vi/install/raspberry-pi)
