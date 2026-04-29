---
read_when:
    - Bạn thường chạy OpenClaw bằng Docker và muốn các lệnh hằng ngày ngắn gọn hơn
    - Bạn cần một lớp trợ giúp cho bảng điều khiển, nhật ký, thiết lập token và các luồng ghép nối
summary: Các tiện ích hỗ trợ shell ClawDock cho các bản cài đặt OpenClaw dựa trên Docker
title: ClawDock
x-i18n:
    generated_at: "2026-04-29T22:50:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 308ac338cb8a94d7996489ef9d751a9359b22ddd3c44d64774c6a2275b29aa22
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock là một lớp trợ giúp shell nhỏ cho các bản cài đặt OpenClaw dựa trên Docker.

Nó cung cấp cho bạn các lệnh ngắn như `clawdock-start`, `clawdock-dashboard` và `clawdock-fix-token` thay cho các lệnh gọi `docker compose ...` dài hơn.

Nếu bạn chưa thiết lập Docker, hãy bắt đầu với [Docker](/vi/install/docker).

## Cài đặt

Dùng đường dẫn trợ giúp chuẩn:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Nếu trước đây bạn đã cài đặt ClawDock từ `scripts/shell-helpers/clawdock-helpers.sh`, hãy cài đặt lại từ đường dẫn mới `scripts/clawdock/clawdock-helpers.sh`. Đường dẫn GitHub thô cũ đã bị gỡ bỏ.

## Bạn nhận được gì

### Thao tác cơ bản

| Lệnh               | Mô tả                           |
| ------------------ | ------------------------------- |
| `clawdock-start`   | Khởi động Gateway               |
| `clawdock-stop`    | Dừng Gateway                    |
| `clawdock-restart` | Khởi động lại Gateway           |
| `clawdock-status`  | Kiểm tra trạng thái vùng chứa   |
| `clawdock-logs`    | Theo dõi nhật ký Gateway        |

### Truy cập vùng chứa

| Lệnh                      | Mô tả                                           |
| ------------------------- | ----------------------------------------------- |
| `clawdock-shell`          | Mở shell bên trong vùng chứa Gateway            |
| `clawdock-cli <command>`  | Chạy các lệnh OpenClaw CLI trong Docker         |
| `clawdock-exec <command>` | Thực thi một lệnh tùy ý trong vùng chứa         |

### UI web và ghép đôi

| Lệnh                    | Mô tả                                  |
| ----------------------- | -------------------------------------- |
| `clawdock-dashboard`    | Mở URL Control UI                      |
| `clawdock-devices`      | Liệt kê các ghép đôi thiết bị đang chờ |
| `clawdock-approve <id>` | Phê duyệt yêu cầu ghép đôi             |

### Thiết lập và bảo trì

| Lệnh                 | Mô tả                                         |
| -------------------- | --------------------------------------------- |
| `clawdock-fix-token` | Cấu hình token Gateway bên trong vùng chứa    |
| `clawdock-update`    | Kéo, dựng lại và khởi động lại                |
| `clawdock-rebuild`   | Chỉ dựng lại ảnh Docker                       |
| `clawdock-clean`     | Xóa vùng chứa và ổ đĩa                        |

### Tiện ích

| Lệnh                   | Mô tả                                             |
| ---------------------- | ------------------------------------------------- |
| `clawdock-health`      | Chạy kiểm tra sức khỏe Gateway                    |
| `clawdock-token`       | In token Gateway                                  |
| `clawdock-cd`          | Chuyển đến thư mục dự án OpenClaw                 |
| `clawdock-config`      | Mở `~/.openclaw`                                  |
| `clawdock-show-config` | In các tệp cấu hình với các giá trị đã được che   |
| `clawdock-workspace`   | Mở thư mục không gian làm việc                    |

## Luồng lần đầu

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Nếu trình duyệt báo cần ghép đôi:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Cấu hình và thông tin bí mật

ClawDock hoạt động với cùng cách tách cấu hình Docker được mô tả trong [Docker](/vi/install/docker):

- `<project>/.env` cho các giá trị dành riêng cho Docker như tên ảnh, cổng và token Gateway
- `~/.openclaw/.env` cho khóa nhà cung cấp và token bot dựa trên môi trường
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` cho xác thực OAuth/API-key của nhà cung cấp đã lưu
- `~/.openclaw/openclaw.json` cho cấu hình hành vi

Dùng `clawdock-show-config` khi bạn muốn kiểm tra nhanh các tệp `.env` và `openclaw.json`. Lệnh này che các giá trị `.env` trong đầu ra được in ra.

## Trang liên quan

- [Docker](/vi/install/docker)
- [Thời gian chạy VM Docker](/vi/install/docker-vm-runtime)
- [Cập nhật](/vi/install/updating)
