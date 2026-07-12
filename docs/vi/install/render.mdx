---
read_when:
    - Triển khai OpenClaw lên Render
    - Bạn muốn triển khai đám mây theo kiểu khai báo bằng Render Blueprints
summary: Triển khai OpenClaw trên Render bằng Hạ tầng dưới dạng mã nguồn
title: Kết xuất
x-i18n:
    generated_at: "2026-07-12T08:01:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

Triển khai OpenClaw trên [Render](https://render.com) bằng Blueprint `render.yaml` của kho mã nguồn. Tệp này khai báo dịch vụ, ổ đĩa và các biến môi trường trong một tệp duy nhất.

## Điều kiện tiên quyết

- Một [tài khoản Render](https://render.com) (có gói miễn phí)
- Khóa API từ [nhà cung cấp mô hình](/vi/providers) bạn ưu tiên

## Triển khai

[Triển khai lên Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Thao tác này tạo một dịch vụ Render từ `render.yaml`, xây dựng ảnh Docker và triển khai dịch vụ. URL dịch vụ của bạn có dạng `https://<service-name>.onrender.com`.

## Blueprint

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
        generateValue: true # tự động tạo một token bảo mật
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| Tính năng              | Mục đích                                                    |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | Xây dựng từ Dockerfile của kho mã nguồn                    |
| `healthCheckPath`     | Render giám sát `/health` và khởi động lại các phiên bản không khỏe mạnh |
| `generateValue: true` | Tự động tạo một giá trị an toàn về mặt mật mã              |
| `disk`                | Bộ nhớ lưu trữ bền vững, vẫn tồn tại sau khi triển khai lại |

## Chọn gói

| Gói       | Tạm dừng             | Ổ đĩa        | Phù hợp nhất cho              |
| --------- | -------------------- | ------------ | ----------------------------- |
| Free      | Sau 15 phút không hoạt động | Không có | Kiểm thử, bản trình diễn      |
| Starter   | Không bao giờ        | 1GB+         | Sử dụng cá nhân, nhóm nhỏ     |
| Standard+ | Không bao giờ        | 1GB+         | Môi trường sản xuất, nhiều kênh |

Blueprint mặc định sử dụng `starter`. Để dùng gói miễn phí, hãy đổi thành `plan: free` trong `render.yaml` của bản fork — lưu ý rằng khi không có ổ đĩa bền vững, trạng thái OpenClaw sẽ được đặt lại sau mỗi lần triển khai.

## Sau khi triển khai

### Truy cập giao diện điều khiển

Bảng điều khiển web có tại `https://<your-service>.onrender.com/`. Kết nối bằng bí mật dùng chung: `OPENCLAW_GATEWAY_TOKEN` được tạo tự động (tìm trong **Dashboard → your service → Environment**), hoặc mật khẩu của bạn nếu đã chuyển sang xác thực bằng mật khẩu.

### Nhật ký

**Dashboard → your service → Logs** hiển thị nhật ký xây dựng (tạo ảnh Docker), nhật ký triển khai (khởi động dịch vụ) và nhật ký thời gian chạy (đầu ra của ứng dụng).

### Truy cập shell

**Dashboard → your service → Shell** mở một phiên shell. Ổ đĩa bền vững được gắn tại `/data`.

### Biến môi trường

Chỉnh sửa các biến trong **Dashboard → your service → Environment**. Các thay đổi sẽ kích hoạt quá trình tự động triển khai lại.

### Tự động triển khai

Render tự động triển khai lại khi nhánh của kho mã nguồn được kết nối có commit mới. Nếu bạn triển khai trực tiếp từ `openclaw/openclaw` thay vì bản fork của riêng mình, bạn không có quyền đẩy mã để kích hoạt quá trình này; vì vậy, hãy cập nhật bằng cách chạy đồng bộ Blueprint thủ công từ Dashboard hoặc trỏ dịch vụ đến bản fork của riêng bạn.

## Miền tùy chỉnh

1. **Dashboard → your service → Settings → Custom Domains**
2. Thêm miền của bạn
3. Cấu hình DNS theo hướng dẫn (CNAME trỏ đến `*.onrender.com`)
4. Render tự động cấp chứng chỉ TLS

## Mở rộng quy mô

- **Theo chiều dọc**: đổi gói để có thêm CPU/RAM. Thường là đủ cho OpenClaw.
- **Theo chiều ngang**: tăng số lượng phiên bản (gói Standard trở lên). Yêu cầu phiên cố định hoặc quản lý trạng thái bên ngoài vì OpenClaw lưu trạng thái thời gian chạy trên ổ đĩa cục bộ.

## Sao lưu và di chuyển

Từ shell trong Render Dashboard, bạn có thể xuất trạng thái, cấu hình, hồ sơ xác thực và không gian làm việc bất cứ lúc nào:

```bash
openclaw backup create
```

Lệnh này tạo một kho lưu trữ sao lưu có thể di chuyển. Xem [Sao lưu](/vi/cli/backup).

## Khắc phục sự cố

### Dịch vụ không khởi động

Kiểm tra nhật ký triển khai trong Render Dashboard. Các vấn đề thường gặp:

- Thiếu `OPENCLAW_GATEWAY_TOKEN` — xác minh rằng biến này đã được đặt trong **Dashboard → Environment**
- Cổng không khớp — bảo đảm `OPENCLAW_GATEWAY_PORT=8080` để Gateway liên kết với cổng mà Render mong đợi

### Khởi động nguội chậm (gói miễn phí)

Các dịch vụ thuộc gói miễn phí sẽ tạm dừng sau 15 phút không hoạt động; yêu cầu đầu tiên sau khi tạm dừng sẽ mất vài giây trong khi vùng chứa khởi động. Nâng cấp lên Starter để dịch vụ luôn hoạt động.

### Mất dữ liệu sau khi triển khai lại

Điều này xảy ra ở gói miễn phí (không có ổ đĩa bền vững). Nâng cấp lên gói trả phí hoặc thường xuyên xuất bản sao lưu bằng `openclaw backup create` từ shell của Render.

### Kiểm tra tình trạng không thành công

Nếu quá trình xây dựng thành công nhưng triển khai thất bại, dịch vụ có thể mất quá nhiều thời gian để khởi động hoặc không thể truy cập `/health`. Hãy kiểm tra:

- Nhật ký xây dựng để tìm lỗi
- Vùng chứa có chạy cục bộ bằng `docker build && docker run` hay không

## Các bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)
- Duy trì OpenClaw ở phiên bản mới nhất: [Cập nhật](/vi/install/updating)
