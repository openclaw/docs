---
read_when:
    - Đang tìm trạng thái ứng dụng đồng hành trên Linux
    - Lập kế hoạch phạm vi hỗ trợ nền tảng hoặc các đóng góp
    - Gỡ lỗi các lần Linux OOM kill hoặc mã thoát 137 trên VPS hoặc vùng chứa
summary: Hỗ trợ Linux + trạng thái ứng dụng đồng hành
title: Ứng dụng Linux
x-i18n:
    generated_at: "2026-04-29T22:56:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 16
---

Gateway được hỗ trợ đầy đủ trên Linux. **Node là runtime được khuyến nghị**.
Bun không được khuyến nghị cho Gateway (lỗi WhatsApp/Telegram).

Ứng dụng đồng hành Linux native đang được lên kế hoạch. Chúng tôi hoan nghênh đóng góp nếu bạn muốn giúp xây dựng một ứng dụng như vậy.

## Lộ trình nhanh cho người mới bắt đầu (VPS)

1. Cài đặt Node 24 (khuyến nghị; Node 22 LTS, hiện là `22.14+`, vẫn hoạt động để tương thích)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Từ laptop của bạn: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Mở `http://127.0.0.1:18789/` và xác thực bằng shared secret đã cấu hình (mặc định là token; dùng mật khẩu nếu bạn đặt `gateway.auth.mode: "password"`)

Hướng dẫn máy chủ Linux đầy đủ: [Máy chủ Linux](/vi/vps). Ví dụ VPS từng bước: [exe.dev](/vi/install/exe-dev)

## Cài đặt

- [Bắt đầu](/vi/start/getting-started)
- [Cài đặt & cập nhật](/vi/install/updating)
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

Chọn **dịch vụ Gateway** khi được nhắc.

Sửa chữa/di chuyển:

```
openclaw doctor
```

## Điều khiển hệ thống (systemd user unit)

OpenClaw mặc định cài đặt một dịch vụ systemd **user**. Dùng dịch vụ **system**
cho các máy chủ dùng chung hoặc luôn bật. `openclaw gateway install` và
`openclaw onboard --install-daemon` đã render unit chuẩn hiện tại
cho bạn; chỉ tự viết một unit khi bạn cần thiết lập system/service-manager
tùy chỉnh. Hướng dẫn đầy đủ về dịch vụ nằm trong [Sổ tay vận hành Gateway](/vi/gateway).

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

## Áp lực bộ nhớ và các lần OOM kill

Trên Linux, kernel chọn một nạn nhân OOM khi một host, VM hoặc container cgroup
hết bộ nhớ. Gateway có thể là một nạn nhân không phù hợp vì nó sở hữu các
phiên tồn tại lâu dài và các kết nối kênh. Vì vậy, OpenClaw ưu tiên để các
tiến trình con tạm thời bị kill trước Gateway khi có thể.

Với các lần spawn tiến trình con Linux đủ điều kiện, OpenClaw khởi động tiến trình con thông qua một wrapper
`/bin/sh` ngắn, wrapper này nâng `oom_score_adj` của chính tiến trình con lên `1000`, rồi
`exec` lệnh thật. Đây là thao tác không cần đặc quyền vì tiến trình con
chỉ tăng khả năng chính nó bị OOM kill.

Các bề mặt tiến trình con được bao phủ bao gồm:

- tiến trình con lệnh do supervisor quản lý,
- tiến trình con shell PTY,
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

Điều này không thay thế việc tinh chỉnh bộ nhớ thông thường. Nếu một VPS hoặc container liên tục
kill tiến trình con, hãy tăng giới hạn bộ nhớ, giảm mức đồng thời, hoặc thêm các
biện pháp kiểm soát tài nguyên mạnh hơn như systemd `MemoryMax=` hoặc giới hạn bộ nhớ ở cấp container.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Máy chủ Linux](/vi/vps)
- [Raspberry Pi](/vi/install/raspberry-pi)
