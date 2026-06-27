---
read_when:
    - Đang tìm trạng thái ứng dụng đồng hành cho Linux
    - Lên kế hoạch phạm vi nền tảng hoặc đóng góp
    - Gỡ lỗi các lần Linux OOM kill hoặc thoát mã 137 trên VPS hoặc container
summary: Trạng thái hỗ trợ Linux + ứng dụng đồng hành
title: Ứng dụng Linux
x-i18n:
    generated_at: "2026-06-27T17:41:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Gateway được hỗ trợ đầy đủ trên Linux. **Node là runtime được khuyến nghị**.
Bun không được khuyến nghị cho Gateway (lỗi WhatsApp/Telegram).

Các ứng dụng đồng hành Linux native đang được lên kế hoạch. Chúng tôi hoan nghênh đóng góp nếu bạn muốn giúp xây dựng một ứng dụng như vậy.

## Lộ trình nhanh cho người mới bắt đầu (VPS)

1. Cài đặt Node 24 (khuyến nghị; Node 22 LTS, hiện là `22.19+`, vẫn hoạt động để tương thích)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Từ laptop của bạn: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Mở `http://127.0.0.1:18789/` và xác thực bằng shared secret đã cấu hình (mặc định là token; mật khẩu nếu bạn đặt `gateway.auth.mode: "password"`)

Hướng dẫn đầy đủ cho máy chủ Linux: [Máy chủ Linux](/vi/vps). Ví dụ VPS từng bước: [exe.dev](/vi/install/exe-dev)

## Cài đặt

- [Bắt đầu](/vi/start/getting-started)
- [Cài đặt & cập nhật](/vi/install/updating)
- Luồng tùy chọn: [Bun (thử nghiệm)](/vi/install/bun), [Nix](/vi/install/nix), [Docker](/vi/install/docker)

## Gateway

- [Runbook Gateway](/vi/gateway)
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

## Điều khiển hệ thống (systemd user unit)

OpenClaw mặc định cài đặt một dịch vụ systemd **user**. Dùng dịch vụ **system**
cho máy chủ dùng chung hoặc luôn bật. `openclaw gateway install` và
`openclaw onboard --install-daemon` đã render unit chuẩn hiện tại
cho bạn; chỉ tự viết thủ công khi bạn cần một thiết lập system/service-manager
tùy chỉnh. Hướng dẫn dịch vụ đầy đủ nằm trong [Runbook Gateway](/vi/gateway).

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
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Bật nó:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Áp lực bộ nhớ và OOM kill

Trên Linux, kernel chọn một nạn nhân OOM khi một host, VM hoặc container cgroup
hết bộ nhớ. Gateway có thể là một nạn nhân không phù hợp vì nó sở hữu các
phiên tồn tại lâu và kết nối kênh. Vì vậy, OpenClaw ưu tiên để các tiến trình con
tạm thời bị kill trước Gateway khi có thể.

Với các lần spawn tiến trình con Linux đủ điều kiện, OpenClaw khởi động tiến trình con thông qua một wrapper
`/bin/sh` ngắn, tăng `oom_score_adj` riêng của tiến trình con lên `1000`, rồi
`exec` lệnh thật. Đây là thao tác không cần đặc quyền vì tiến trình con
chỉ đang tăng khả năng chính nó bị OOM kill.

Các bề mặt tiến trình con được bao phủ bao gồm:

- tiến trình con command do supervisor quản lý,
- tiến trình con PTY shell,
- tiến trình con MCP stdio server,
- tiến trình browser/Chrome do OpenClaw khởi chạy.

Wrapper này chỉ dành cho Linux và được bỏ qua khi không có `/bin/sh`. Nó cũng
được bỏ qua nếu env của tiến trình con đặt `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no`, hoặc `off`.

Để xác minh một tiến trình con:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Giá trị kỳ vọng cho các tiến trình con được bao phủ là `1000`. Tiến trình Gateway nên giữ
điểm bình thường của nó, thường là `0`.

Unit systemd được khuyến nghị cũng đặt `OOMPolicy=continue`. Điều này giữ cho
unit Gateway tiếp tục hoạt động khi một tiến trình con tạm thời được OOM killer chọn;
command/session của tiến trình con có thể thất bại và báo lỗi mà systemd không đánh dấu
toàn bộ dịch vụ gateway là thất bại và khởi động lại tất cả các kênh.

Điều này không thay thế việc tinh chỉnh bộ nhớ thông thường. Nếu một VPS hoặc container liên tục
kill tiến trình con, hãy tăng giới hạn bộ nhớ, giảm concurrency, hoặc thêm các
kiểm soát tài nguyên mạnh hơn như systemd `MemoryMax=` hoặc giới hạn bộ nhớ cấp container.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Máy chủ Linux](/vi/vps)
- [Raspberry Pi](/vi/install/raspberry-pi)
