---
read_when:
    - Thêm hỗ trợ Node vị trí hoặc giao diện người dùng quản lý quyền hạn
    - Thiết kế quyền truy cập vị trí hoặc hành vi chạy ở nền trước trên Android
summary: Lệnh vị trí cho các Node (location.get), các chế độ quyền và hành vi chạy nền trước trên Android
title: Lệnh vị trí
x-i18n:
    generated_at: "2026-07-12T08:04:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## Tóm tắt

- `location.get` là một lệnh của Node, được gọi qua `node.invoke` hoặc `openclaw nodes location get`.
- Mặc định tắt.
- Các bản dựng Android của bên thứ ba sử dụng bộ chọn: Tắt / Khi đang sử dụng / Luôn luôn. Các bản dựng Play vẫn chỉ có Tắt / Khi đang sử dụng.
- Vị trí chính xác là một nút bật/tắt riêng.

## Tại sao dùng bộ chọn (thay vì chỉ dùng công tắc)

Quyền truy cập vị trí của hệ điều hành có nhiều cấp độ. Vị trí chính xác cũng là một quyền cấp riêng của hệ điều hành (iOS 14+ là "Chính xác", Android là "fine" so với "coarse"). Bộ chọn trong ứng dụng xác định chế độ được yêu cầu, nhưng hệ điều hành vẫn quyết định quyền thực tế được cấp.

## Mô hình cài đặt

Theo từng thiết bị Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Hành vi giao diện người dùng:

- Chọn `whileUsing` sẽ yêu cầu quyền truy cập khi ứng dụng ở nền trước.
- Khi chọn `always`, bản dựng Android của bên thứ ba trước tiên yêu cầu quyền truy cập khi ứng dụng ở nền trước, giải thích về quyền truy cập trong nền, rồi mở phần cài đặt ứng dụng Android để cấp riêng quyền **Allow all the time**.
- Các bản dựng Android Play không khai báo quyền truy cập vị trí trong nền hoặc hiển thị `always`.
- Nếu hệ điều hành từ chối cấp độ được yêu cầu, ứng dụng sẽ quay về cấp độ cao nhất đã được cấp và hiển thị trạng thái.

## Ánh xạ quyền (`node.permissions`)

Không bắt buộc. Node macOS báo cáo `location` qua ánh xạ `permissions` trên `node.list`/`node.describe`; iOS/Android có thể bỏ qua thông tin này.

## Lệnh: `location.get`

Được gọi qua `node.invoke` hoặc trình hỗ trợ CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Tham số:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Các cờ CLI ánh xạ trực tiếp như sau: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

Dữ liệu phản hồi:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

Lỗi (mã ổn định):

- `LOCATION_DISABLED`: bộ chọn đang tắt.
- `LOCATION_PERMISSION_REQUIRED`: thiếu quyền cho chế độ được yêu cầu.
- `LOCATION_BACKGROUND_UNAVAILABLE`: ứng dụng đang chạy trong nền nhưng chỉ được cấp quyền Khi đang sử dụng.
- `LOCATION_TIMEOUT`: không xác định được vị trí kịp thời.
- `LOCATION_UNAVAILABLE`: lỗi hệ thống hoặc không có nhà cung cấp vị trí.

## Hành vi trong nền

- Các bản dựng Android của bên thứ ba chỉ chấp nhận `location.get` trong nền khi người dùng chọn `Always` và Android đã cấp quyền truy cập vị trí trong nền. Dịch vụ Node liên tục hiện có sẽ thêm loại dịch vụ `location` và hiển thị `Location: Always` khi đang hoạt động.
- Các bản dựng Android Play và chế độ `While Using` từ chối `location.get` khi ứng dụng chạy trong nền.
- Các nền tảng Node khác có thể hoạt động khác.

## Tích hợp mô hình/công cụ

- Công cụ của tác tử: hành động `location_get` của công cụ `nodes` (bắt buộc có Node).
- CLI: `openclaw nodes location get --node <id>`.
- Hướng dẫn dành cho tác tử: chỉ gọi khi người dùng đã bật vị trí và hiểu phạm vi chia sẻ.

## Nội dung UX (đề xuất)

- Tắt: "Tính năng chia sẻ vị trí đã bị tắt."
- Khi đang sử dụng: "Chỉ khi OpenClaw đang mở."
- Luôn luôn: "Cho phép kiểm tra vị trí theo yêu cầu khi OpenClaw đang chạy trong nền."
- Chính xác: "Sử dụng vị trí GPS chính xác. Tắt tùy chọn này để chia sẻ vị trí gần đúng."

## Liên quan

- [Tổng quan về Node](/vi/nodes)
- [Phân tích vị trí của kênh](/vi/channels/location)
- [Chụp ảnh bằng camera](/vi/nodes/camera)
- [Chế độ trò chuyện](/vi/nodes/talk)
