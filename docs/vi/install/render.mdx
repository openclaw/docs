---
read_when:
    - Triển khai OpenClaw lên Render
    - Bạn muốn triển khai đám mây dạng khai báo bằng Render Blueprints
summary: Triển khai OpenClaw trên Render bằng Hạ tầng dưới dạng mã
title: Kết xuất
x-i18n:
    generated_at: "2026-04-29T22:53:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 16
---

# Render

Triển khai OpenClaw trên Render bằng Infrastructure as Code. Blueprint `render.yaml` đi kèm định nghĩa toàn bộ stack của bạn theo cách khai báo, gồm service, disk, biến môi trường, để bạn có thể triển khai chỉ bằng một cú nhấp và quản lý phiên bản hạ tầng cùng với mã nguồn.

## Điều kiện tiên quyết

- Một [tài khoản Render](https://render.com) (có gói miễn phí)
- Một khóa API từ [nhà cung cấp mô hình](/vi/providers) bạn ưu tiên

## Triển khai bằng Render Blueprint

[Triển khai lên Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Khi nhấp vào liên kết này, hệ thống sẽ:

1. Tạo một Render service mới từ Blueprint `render.yaml` ở thư mục gốc của repo này.
2. Build Docker image và triển khai

Sau khi triển khai, URL service của bạn có dạng `https://<service-name>.onrender.com`.

## Tìm hiểu Blueprint

Render Blueprints là các tệp YAML định nghĩa hạ tầng của bạn. `render.yaml` trong
repository này cấu hình mọi thứ cần thiết để chạy OpenClaw:

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # auto-generates a secure token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

Các tính năng Blueprint chính được sử dụng:

| Tính năng             | Mục đích                                                   |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | Build từ Dockerfile của repo                               |
| `healthCheckPath`     | Render giám sát `/health` và khởi động lại instance lỗi    |
| `generateValue: true` | Tự động tạo một giá trị bảo mật bằng mật mã học            |
| `disk`                | Lưu trữ bền vững tồn tại qua các lần triển khai lại        |

## Chọn gói

| Gói       | Tạm dừng          | Disk          | Phù hợp nhất cho              |
| --------- | ----------------- | ------------- | ----------------------------- |
| Free      | Sau 15 phút rảnh  | Không có      | Kiểm thử, demo                |
| Starter   | Không bao giờ     | 1GB+          | Sử dụng cá nhân, nhóm nhỏ     |
| Standard+ | Không bao giờ     | 1GB+          | Production, nhiều kênh        |

Blueprint mặc định dùng `starter`. Để dùng gói miễn phí, hãy đổi `plan: free` trong
`render.yaml` của fork của bạn (nhưng lưu ý: không có disk bền vững nghĩa là trạng thái OpenClaw
sẽ đặt lại ở mỗi lần triển khai).

## Sau khi triển khai

### Truy cập Control UI

Bảng điều khiển web có tại `https://<your-service>.onrender.com/`.

Kết nối bằng shared secret đã cấu hình. Mẫu triển khai này tự động tạo
`OPENCLAW_GATEWAY_TOKEN` (tìm trong **Dashboard → service của bạn →
Environment**); nếu bạn thay bằng xác thực mật khẩu, hãy dùng mật khẩu đó
thay vào.

## Tính năng Render Dashboard

### Nhật ký

Xem nhật ký thời gian thực trong **Dashboard → service của bạn → Logs**. Lọc theo:

- Nhật ký build (tạo Docker image)
- Nhật ký triển khai (khởi động service)
- Nhật ký runtime (đầu ra ứng dụng)

### Truy cập shell

Để debug, mở một phiên shell qua **Dashboard → service của bạn → Shell**. Disk bền vững được mount tại `/data`.

### Biến môi trường

Sửa đổi biến trong **Dashboard → service của bạn → Environment**. Các thay đổi sẽ kích hoạt triển khai lại tự động.

### Tự động triển khai

Nếu bạn dùng repository OpenClaw gốc, Render sẽ không tự động triển khai OpenClaw của bạn. Để cập nhật, hãy chạy đồng bộ Blueprint thủ công từ dashboard.

## Miền tùy chỉnh

1. Vào **Dashboard → service của bạn → Settings → Custom Domains**
2. Thêm miền của bạn
3. Cấu hình DNS theo hướng dẫn (CNAME tới `*.onrender.com`)
4. Render tự động cấp chứng chỉ TLS

## Mở rộng quy mô

Render hỗ trợ mở rộng theo chiều ngang và chiều dọc:

- **Chiều dọc**: Đổi gói để có thêm CPU/RAM
- **Chiều ngang**: Tăng số lượng instance (gói Standard trở lên)

Với OpenClaw, mở rộng theo chiều dọc thường là đủ. Mở rộng theo chiều ngang yêu cầu sticky sessions hoặc quản lý trạng thái bên ngoài.

## Sao lưu và di chuyển

Xuất trạng thái, cấu hình, hồ sơ xác thực và workspace của bạn bất cứ lúc nào bằng
quyền truy cập shell trong Render Dashboard:

```bash
openclaw backup create
```

Lệnh này tạo một kho lưu trữ sao lưu có thể di chuyển, gồm trạng thái OpenClaw cùng mọi
workspace đã cấu hình. Xem [Sao lưu](/vi/cli/backup) để biết chi tiết.

## Khắc phục sự cố

### Service không khởi động

Kiểm tra nhật ký triển khai trong Render Dashboard. Các vấn đề thường gặp:

- Thiếu `OPENCLAW_GATEWAY_TOKEN` — xác minh rằng nó đã được đặt trong **Dashboard → Environment**
- Không khớp cổng — đảm bảo `OPENCLAW_GATEWAY_PORT=8080` được đặt để gateway bind vào cổng Render mong đợi

### Khởi động lạnh chậm (gói miễn phí)

Service gói miễn phí tạm dừng sau 15 phút không hoạt động. Yêu cầu đầu tiên sau khi tạm dừng mất vài giây trong khi container khởi động. Nâng cấp lên gói Starter để luôn bật.

### Mất dữ liệu sau khi triển khai lại

Điều này xảy ra trên gói miễn phí (không có disk bền vững). Nâng cấp lên gói trả phí, hoặc
thường xuyên xuất bản sao lưu đầy đủ bằng `openclaw backup create` trong Render shell.

### Lỗi health check

Render mong đợi phản hồi 200 từ `/health` trong vòng 30 giây. Nếu build thành công nhưng triển khai thất bại, service có thể mất quá lâu để khởi động. Kiểm tra:

- Nhật ký build để tìm lỗi
- Container có chạy cục bộ với `docker build && docker run` hay không

## Bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)
- Luôn cập nhật OpenClaw: [Cập nhật](/vi/install/updating)
