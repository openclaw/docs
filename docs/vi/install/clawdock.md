---
read_when:
    - Bạn thường chạy OpenClaw bằng Docker và muốn các lệnh hằng ngày ngắn gọn hơn
    - Bạn muốn một lớp hỗ trợ cho bảng điều khiển, nhật ký, thiết lập mã thông báo và các luồng ghép đôi
summary: Các tiện ích trợ giúp shell ClawDock cho các bản cài đặt OpenClaw dựa trên Docker
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T09:17:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ClawDock là một lớp shell-helper nhỏ cho các bản cài đặt OpenClaw dựa trên Docker.

Nó cung cấp các lệnh ngắn như `clawdock-start`, `clawdock-dashboard` và `clawdock-fix-token` thay cho các lệnh gọi `docker compose ...` dài hơn.

Nếu bạn chưa thiết lập Docker, hãy bắt đầu với [Docker](/vi/install/docker).

## Cài đặt

Dùng đường dẫn helper chuẩn:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Nếu trước đây bạn đã cài đặt ClawDock từ `scripts/shell-helpers/clawdock-helpers.sh`, hãy cài đặt lại từ đường dẫn mới `scripts/clawdock/clawdock-helpers.sh`. Đường dẫn GitHub raw cũ đã bị gỡ bỏ.

## Những gì bạn nhận được

### Thao tác cơ bản

| Lệnh               | Mô tả                         |
| ------------------ | ----------------------------- |
| `clawdock-start`   | Khởi động Gateway             |
| `clawdock-stop`    | Dừng Gateway                  |
| `clawdock-restart` | Khởi động lại Gateway         |
| `clawdock-status`  | Kiểm tra trạng thái container |
| `clawdock-logs`    | Theo dõi nhật ký Gateway      |

### Truy cập container

| Lệnh                      | Mô tả                                         |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | Mở một shell bên trong container Gateway      |
| `clawdock-cli <command>`  | Chạy các lệnh OpenClaw CLI trong Docker       |
| `clawdock-exec <command>` | Thực thi một lệnh bất kỳ trong container      |

### Giao diện web và ghép nối

| Lệnh                    | Mô tả                                  |
| ----------------------- | -------------------------------------- |
| `clawdock-dashboard`    | Mở URL Control UI                      |
| `clawdock-devices`      | Liệt kê các yêu cầu ghép nối thiết bị đang chờ |
| `clawdock-approve <id>` | Phê duyệt một yêu cầu ghép nối         |

### Thiết lập và bảo trì

| Lệnh                 | Mô tả                                             |
| -------------------- | ------------------------------------------------- |
| `clawdock-fix-token` | Cấu hình token Gateway bên trong container        |
| `clawdock-update`    | Pull, dựng lại và khởi động lại                   |
| `clawdock-rebuild`   | Chỉ dựng lại image Docker                         |
| `clawdock-clean`     | Xóa container và volume                           |

### Tiện ích

| Lệnh                   | Mô tả                                           |
| ---------------------- | ----------------------------------------------- |
| `clawdock-health`      | Chạy kiểm tra tình trạng Gateway                |
| `clawdock-token`       | In token Gateway                                |
| `clawdock-cd`          | Chuyển đến thư mục dự án OpenClaw               |
| `clawdock-config`      | Mở `~/.openclaw`                                |
| `clawdock-show-config` | In các tệp cấu hình với các giá trị đã được che |
| `clawdock-workspace`   | Mở thư mục workspace                            |

## Luồng lần đầu

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Nếu trình duyệt báo rằng cần ghép nối:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Cấu hình và bí mật

ClawDock hoạt động với cùng cách tách cấu hình Docker được mô tả trong [Docker](/vi/install/docker):

- `<project>/.env` cho các giá trị riêng của Docker như tên image, cổng và token Gateway
- `~/.openclaw/.env` cho khóa provider dựa trên env và token bot
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` cho xác thực OAuth/API-key của provider đã lưu
- `~/.openclaw/openclaw.json` cho cấu hình hành vi

Dùng `clawdock-show-config` khi bạn muốn nhanh chóng kiểm tra các tệp `.env` và `openclaw.json`. Lệnh này che các giá trị `.env` trong đầu ra được in.

## Liên quan

<CardGroup cols={2}>
  <Card title="Docker" href="/vi/install/docker" icon="docker">
    Bản cài đặt Docker chuẩn cho OpenClaw.
  </Card>
  <Card title="Docker VM runtime" href="/vi/install/docker-vm-runtime" icon="cube">
    Runtime VM do Docker quản lý để cô lập được tăng cường.
  </Card>
  <Card title="Updating" href="/vi/install/updating" icon="arrow-up-right-from-square">
    Cập nhật gói OpenClaw và các dịch vụ được quản lý.
  </Card>
</CardGroup>
