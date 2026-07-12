---
read_when:
    - Triển khai OpenClaw trên EasyRunner
    - Chạy Gateway phía sau proxy Caddy của EasyRunner
    - Lựa chọn ổ đĩa lưu trữ bền vững và phương thức xác thực cho Gateway được lưu trữ
summary: Chạy OpenClaw Gateway trên EasyRunner bằng Podman và Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T08:03:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner lưu trữ Gateway OpenClaw dưới dạng một ứng dụng nhỏ được đóng gói trong container, đặt sau proxy Caddy. Hướng dẫn này giả định máy chủ EasyRunner chạy các ứng dụng Compose tương thích với Podman và kết thúc HTTPS thông qua Caddy.

## Trước khi bắt đầu

- Một máy chủ EasyRunner có tên miền được định tuyến đến máy chủ đó.
- Image OpenClaw chính thức (`ghcr.io/openclaw/openclaw`) hoặc bản dựng của riêng bạn.
- Một volume cấu hình bền vững cho `/home/node/.openclaw`.
- Một volume không gian làm việc bền vững cho `/home/node/.openclaw/workspace`.
- Một mã thông báo hoặc mật khẩu Gateway mạnh.

Hãy bật xác thực thiết bị khi có thể. Nếu proxy ngược không thể truyền chính xác danh tính thiết bị, trước tiên hãy sửa các thiết lập proxy đáng tin cậy (xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth)); chỉ sử dụng các biện pháp bỏ qua xác thực nguy hiểm trên mạng hoàn toàn riêng tư do người vận hành kiểm soát.

## Ứng dụng Compose

Tạo một ứng dụng EasyRunner với tệp Compose có cấu trúc như sau:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Thay `openclaw.example.com` bằng tên máy chủ Gateway của bạn. Lưu `OPENCLAW_GATEWAY_TOKEN` trong trình quản lý bí mật/môi trường của EasyRunner thay vì đưa mã này vào định nghĩa ứng dụng. Theo mặc định, image liên kết với địa chỉ loopback, vì vậy `--bind lan --port 1455` tường minh trong `command` là bắt buộc để Caddy có thể truy cập container.

## Cấu hình OpenClaw

Bên trong volume cấu hình bền vững, hãy đảm bảo chỉ có thể truy cập Gateway thông qua proxy và bắt buộc xác thực:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Nếu Caddy kết thúc TLS cho Gateway, hãy cấu hình các thiết lập proxy đáng tin cậy cho chính xác đường dẫn proxy thay vì vô hiệu hóa toàn bộ các bước kiểm tra xác thực. Xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth).

## Xác minh

Từ máy trạm của bạn:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

Từ máy chủ EasyRunner, `GET /healthz` (trạng thái hoạt động) và `GET /readyz` (trạng thái sẵn sàng) không yêu cầu xác thực và được dùng cho cơ chế kiểm tra tình trạng container tích hợp sẵn của image. Đồng thời, hãy kiểm tra nhật ký ứng dụng để xác nhận Gateway đang lắng nghe và không có lỗi khởi động liên quan đến SecretRef, plugin hoặc xác thực kênh.

## Cập nhật và sao lưu

- Kéo về hoặc dựng image OpenClaw mới, sau đó triển khai lại ứng dụng EasyRunner.
- Sao lưu volume `openclaw-config` trước khi cập nhật. Volume này chứa `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` và trạng thái gói plugin đã cài đặt.
- Sao lưu `openclaw-workspace` nếu các tác nhân ghi dữ liệu dự án cần lưu giữ lâu dài tại đó.
- Chạy `openclaw doctor` sau các bản cập nhật lớn để phát hiện các quá trình di chuyển cấu hình và cảnh báo dịch vụ.

## Khắc phục sự cố

- `gateway probe` không thể kết nối: xác nhận tên máy chủ Caddy trỏ đến ứng dụng và container đang lắng nghe trên `0.0.0.0:1455`.
- Xác thực thất bại: đồng thời xoay vòng mã thông báo trong trình quản lý bí mật của EasyRunner và lệnh máy khách cục bộ.
- Các tệp thuộc sở hữu của root sau khi khôi phục: image chạy dưới người dùng `node` (uid 1000); sửa quyền của các volume được gắn kết để người dùng đó có thể ghi vào `/home/node/.openclaw` và `/home/node/.openclaw/workspace`.
- Plugin trình duyệt hoặc plugin kênh gặp lỗi: kiểm tra xem các tệp nhị phân bên ngoài bắt buộc, quyền truy cập mạng ra ngoài và thông tin xác thực được gắn kết có khả dụng bên trong container hay không.
