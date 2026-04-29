---
read_when:
    - Thêm hỗ trợ nút vị trí hoặc giao diện quyền
    - Thiết kế quyền truy cập vị trí trên Android hoặc hành vi chạy ở nền trước
summary: Lệnh vị trí cho các nút (location.get), các chế độ quyền và hành vi chạy ở tiền cảnh trên Android
title: Lệnh vị trí
x-i18n:
    generated_at: "2026-04-29T22:54:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 16
---

## Tóm tắt

- `location.get` là một lệnh node (thông qua `node.invoke`).
- Tắt theo mặc định.
- Cài đặt ứng dụng Android dùng một bộ chọn: Tắt / Khi đang dùng.
- Công tắc riêng: Vị trí chính xác.

## Vì sao dùng bộ chọn (không chỉ là công tắc)

Quyền của hệ điều hành có nhiều cấp. Chúng ta có thể hiển thị bộ chọn trong ứng dụng, nhưng hệ điều hành vẫn quyết định quyền cấp thực tế.

- iOS/macOS có thể hiển thị **Khi đang dùng** hoặc **Luôn luôn** trong lời nhắc/Cài đặt hệ thống.
- Ứng dụng Android hiện chỉ hỗ trợ vị trí khi ứng dụng đang ở nền trước.
- Vị trí chính xác là một quyền riêng (iOS 14+ “Chính xác”, Android “fine” so với “coarse”).

Bộ chọn trong UI điều khiển chế độ chúng ta yêu cầu; quyền cấp thực tế nằm trong cài đặt hệ điều hành.

## Mô hình cài đặt

Theo từng thiết bị node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Hành vi UI:

- Chọn `whileUsing` sẽ yêu cầu quyền nền trước.
- Nếu hệ điều hành từ chối cấp độ được yêu cầu, hoàn nguyên về cấp độ cao nhất đã được cấp và hiển thị trạng thái.

## Ánh xạ quyền (`node.permissions`)

Không bắt buộc. Node macOS báo cáo `location` thông qua bản đồ quyền; iOS/Android có thể bỏ qua.

## Lệnh: `location.get`

Được gọi thông qua `node.invoke`.

Tham số (đề xuất):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Tải trọng phản hồi:

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: ứng dụng đang chạy nền nhưng chỉ được phép Khi đang dùng.
- `LOCATION_TIMEOUT`: không có vị trí cố định kịp thời.
- `LOCATION_UNAVAILABLE`: lỗi hệ thống / không có nhà cung cấp.

## Hành vi chạy nền

- Ứng dụng Android từ chối `location.get` khi đang chạy nền.
- Giữ OpenClaw mở khi yêu cầu vị trí trên Android.
- Các nền tảng node khác có thể khác.

## Tích hợp mô hình/công cụ

- Bề mặt công cụ: công cụ `nodes` thêm hành động `location_get` (bắt buộc có node).
- CLI: `openclaw nodes location get --node <id>`.
- Hướng dẫn cho agent: chỉ gọi khi người dùng đã bật vị trí và hiểu phạm vi.

## Nội dung UX (đề xuất)

- Tắt: “Chia sẻ vị trí đã bị tắt.”
- Khi đang dùng: “Chỉ khi OpenClaw đang mở.”
- Chính xác: “Dùng vị trí GPS chính xác. Tắt công tắc để chia sẻ vị trí tương đối.”

## Liên quan

- [Phân tích cú pháp vị trí kênh](/vi/channels/location)
- [Chụp bằng camera](/vi/nodes/camera)
- [Chế độ trò chuyện](/vi/nodes/talk)
