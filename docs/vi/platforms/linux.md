---
read_when:
    - Đang tìm trạng thái ứng dụng đồng hành cho Linux
    - Lập kế hoạch hỗ trợ nền tảng hoặc đóng góp
    - Gỡ lỗi tiến trình bị Linux OOM chấm dứt hoặc mã thoát 137 trên VPS hay container
summary: Hỗ trợ Linux + trạng thái ứng dụng đồng hành
title: Ứng dụng Linux
x-i18n:
    generated_at: "2026-07-12T08:04:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway được hỗ trợ đầy đủ trên Linux. Node là runtime được khuyến nghị; Bun
không được khuyến nghị (đã biết có vấn đề với WhatsApp/Telegram).

Hiện chưa có ứng dụng đồng hành gốc cho Linux. Chúng tôi hoan nghênh các đóng góp.

## Cách nhanh (VPS)

1. Cài đặt Node 24 (khuyến nghị) hoặc Node 22.19+ (LTS, vẫn được hỗ trợ).
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Từ máy tính xách tay của bạn: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Mở `http://127.0.0.1:18789/` và xác thực bằng bí mật dùng chung đã cấu hình
   (mặc định là token; mật khẩu nếu `gateway.auth.mode` là `"password"`).

Hướng dẫn máy chủ đầy đủ: [Máy chủ Linux](/vi/vps). Ví dụ VPS từng bước:
[exe.dev](/vi/install/exe-dev).

## Cài đặt

- [Bắt đầu](/vi/start/getting-started)
- [Cài đặt và cập nhật](/vi/install/updating)
- Tùy chọn: [Bun (thử nghiệm)](/vi/install/bun), [Nix](/vi/install/nix), [Docker](/vi/install/docker)

## Dịch vụ Gateway (systemd)

Cài đặt bằng một trong các lệnh sau:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # chọn "Gateway service" khi được nhắc
```

Sửa chữa hoặc di chuyển một bản cài đặt hiện có:

```bash
openclaw doctor
```

Theo mặc định, `openclaw gateway install` tạo một unit systemd cấp **người dùng**. Hướng dẫn
dịch vụ đầy đủ, bao gồm biến thể unit cấp **hệ thống** dành cho các máy chủ dùng chung hoặc
luôn hoạt động, có trong [cẩm nang vận hành Gateway](/vi/gateway#supervision-and-service-lifecycle).

Chỉ tự viết unit cho thiết lập tùy chỉnh. Ví dụ unit người dùng tối thiểu
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Bật unit:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Áp lực bộ nhớ và việc tiến trình bị kết thúc do OOM

Trên Linux, kernel chọn một tiến trình nạn nhân của OOM khi máy chủ, máy ảo hoặc cgroup của
container hết bộ nhớ. Gateway không phải là lựa chọn phù hợp để bị kết thúc vì nó quản lý các
phiên tồn tại lâu dài và kết nối kênh, do đó OpenClaw ưu tiên để các tiến trình con tạm thời
bị kết thúc trước khi có thể.

Đối với các tiến trình con đủ điều kiện trên Linux, OpenClaw bọc lệnh trong một shim
`/bin/sh` ngắn để tăng `oom_score_adj` của chính tiến trình con lên `1000`, sau đó
dùng `exec` chạy lệnh thực tế. Thao tác này không yêu cầu đặc quyền: một tiến trình luôn có thể
tăng điểm OOM của chính nó.

Các bề mặt tiến trình con được áp dụng:

- Tiến trình con của lệnh do trình giám sát quản lý
- Tiến trình con của shell PTY
- Tiến trình con của máy chủ MCP qua stdio
- Các tiến trình trình duyệt/Chrome do OpenClaw khởi chạy (thông qua runtime tiến trình của SDK Plugin)

Trình bọc chỉ dành cho Linux và bị bỏ qua khi `/bin/sh` không khả dụng hoặc khi
môi trường của tiến trình con đặt `OPENCLAW_CHILD_OOM_SCORE_ADJ` thành `0`, `false`, `no` hoặc
`off`.

Xác minh một tiến trình con:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Giá trị dự kiến cho các tiến trình con được áp dụng là `1000`; bản thân tiến trình Gateway
giữ điểm số thông thường (thường là `0`).

`OOMPolicy=continue` của unit systemd giữ cho dịch vụ Gateway tiếp tục hoạt động khi
một tiến trình con tạm thời bị trình kết thúc OOM chọn, thay vì đánh dấu toàn bộ
unit là thất bại và khởi động lại tất cả các kênh; tiến trình con hoặc phiên thất bại sẽ báo cáo
lỗi riêng.

Điều này không thay thế việc tinh chỉnh bộ nhớ thông thường. Nếu VPS hoặc container liên tục
kết thúc các tiến trình con, hãy tăng giới hạn bộ nhớ, giảm mức đồng thời hoặc thêm các biện pháp
kiểm soát tài nguyên mạnh hơn (`MemoryMax=` của systemd, giới hạn bộ nhớ container).

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Máy chủ Linux](/vi/vps)
- [Raspberry Pi](/vi/install/raspberry-pi)
- [Cẩm nang vận hành Gateway](/vi/gateway)
- [Cấu hình Gateway](/vi/gateway/configuration)
