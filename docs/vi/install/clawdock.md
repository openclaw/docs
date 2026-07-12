---
read_when:
    - Bạn thường xuyên chạy OpenClaw bằng Docker và muốn các lệnh hằng ngày ngắn gọn hơn
    - Bạn muốn có một lớp hỗ trợ cho bảng điều khiển, nhật ký, thiết lập token và các quy trình ghép nối
summary: Các tiện ích shell ClawDock dành cho bản cài đặt OpenClaw dựa trên Docker
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T07:59:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock là một lớp trình trợ giúp shell nhỏ dành cho các bản cài đặt OpenClaw dựa trên Docker.

Nó cung cấp các lệnh ngắn như `clawdock-start`, `clawdock-dashboard` và `clawdock-fix-token` thay cho các lệnh gọi `docker compose ...` dài hơn.

Nếu bạn chưa thiết lập Docker, hãy bắt đầu với [Docker](/vi/install/docker).

## Cài đặt

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Nếu trước đây bạn đã cài đặt ClawDock từ `scripts/shell-helpers/clawdock-helpers.sh`, hãy cài đặt lại từ đường dẫn hiện tại `scripts/clawdock/clawdock-helpers.sh`; đường dẫn GitHub thô cũ đã bị xóa.

Các trình trợ giúp tự động phát hiện thư mục mã nguồn OpenClaw của bạn trong lần sử dụng đầu tiên (bằng cách kiểm tra các đường dẫn phổ biến như `~/openclaw`, `~/projects/openclaw`) và lưu kết quả vào bộ nhớ đệm tại `~/.clawdock/config`. Hãy tự đặt `CLAWDOCK_DIR` nếu thư mục mã nguồn của bạn nằm ở nơi khác.

## Các tính năng được cung cấp

### Thao tác cơ bản

| Lệnh                | Mô tả                         |
| ------------------ | ----------------------------- |
| `clawdock-start`   | Khởi động Gateway             |
| `clawdock-stop`    | Dừng Gateway                  |
| `clawdock-restart` | Khởi động lại Gateway         |
| `clawdock-status`  | Kiểm tra trạng thái container |
| `clawdock-logs`    | Theo dõi nhật ký Gateway      |

### Truy cập container

| Lệnh                       | Mô tả                                        |
| ------------------------- | -------------------------------------------- |
| `clawdock-shell`          | Mở shell bên trong container Gateway         |
| `clawdock-cli <command>`  | Chạy các lệnh CLI của OpenClaw trong Docker  |
| `clawdock-exec <command>` | Thực thi một lệnh tùy ý trong container      |

### Giao diện web và ghép nối

| Lệnh                    | Mô tả                                  |
| ----------------------- | -------------------------------------- |
| `clawdock-dashboard`    | Mở URL của giao diện điều khiển        |
| `clawdock-devices`      | Liệt kê các yêu cầu ghép nối thiết bị đang chờ |
| `clawdock-approve <id>` | Phê duyệt một yêu cầu ghép nối         |

### Thiết lập và bảo trì

| Lệnh                 | Mô tả                                                   |
| -------------------- | ------------------------------------------------------- |
| `clawdock-fix-token` | Ghi token Gateway vào cấu hình container                |
| `clawdock-update`    | Kéo bản mới, dựng lại và khởi động lại                  |
| `clawdock-rebuild`   | Chỉ dựng lại ảnh Docker                                 |
| `clawdock-clean`     | Xóa các container và ổ đĩa                              |

### Tiện ích

| Lệnh                   | Mô tả                                             |
| ---------------------- | ------------------------------------------------- |
| `clawdock-health`      | Chạy kiểm tra tình trạng Gateway                  |
| `clawdock-token`       | In token Gateway                                  |
| `clawdock-cd`          | Chuyển đến thư mục dự án OpenClaw                 |
| `clawdock-config`      | Mở `~/.openclaw`                                  |
| `clawdock-show-config` | In các tệp cấu hình với những giá trị đã được che |
| `clawdock-workspace`   | Mở thư mục không gian làm việc                    |
| `clawdock-help`        | Liệt kê tất cả lệnh ClawDock                      |

## Quy trình lần đầu

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Nếu trình duyệt thông báo rằng cần ghép nối:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Cấu hình và thông tin bí mật

ClawDock đọc hai tệp `.env` riêng biệt, tương ứng với cách phân chia được mô tả trong [Docker](/vi/install/docker):

- Tệp `.env` của dự án nằm cạnh `docker-compose.yml`: các giá trị dành riêng cho Docker như tên ảnh, cổng và `OPENCLAW_GATEWAY_TOKEN`. `clawdock-token` đọc token từ đây.
- `~/.openclaw/.env` (được gắn vào container): các thông tin bí mật dựa trên biến môi trường do chính OpenClaw quản lý, cùng với `openclaw.json` và `agents/<agentId>/agent/auth-profiles.json`.

`clawdock-fix-token` sao chép token từ tệp `.env` của dự án vào các giá trị cấu hình `gateway.remote.token` và `gateway.auth.token` của container, sau đó khởi động lại Gateway.

Sử dụng `clawdock-show-config` để kiểm tra nhanh `openclaw.json` và cả hai tệp `.env`; lệnh này che các giá trị `.env` trong đầu ra được in.

## Liên quan

<CardGroup cols={2}>
  <Card title="Docker" href="/vi/install/docker" icon="docker">
    Quy trình cài đặt Docker chính thức cho OpenClaw.
  </Card>
  <Card title="Môi trường chạy máy ảo Docker" href="/vi/install/docker-vm-runtime" icon="cube">
    Môi trường chạy máy ảo do Docker quản lý để tăng cường khả năng cô lập.
  </Card>
  <Card title="Cập nhật" href="/vi/install/updating" icon="arrow-up-right-from-square">
    Cập nhật gói OpenClaw và các dịch vụ được quản lý.
  </Card>
</CardGroup>
