---
read_when:
    - Thêm hỗ trợ Node vị trí hoặc giao diện người dùng về quyền
    - Thiết kế quyền vị trí Android hoặc hành vi nền trước
summary: Lệnh vị trí cho các Node (location.get), các chế độ quyền và hành vi chạy ở tiền cảnh của Android
title: Lệnh vị trí
x-i18n:
    generated_at: "2026-05-06T09:20:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
---

## Tóm tắt

- `location.get` là lệnh Node (qua `node.invoke`).
- Mặc định tắt.
- Cài đặt ứng dụng Android dùng một bộ chọn: Tắt / Khi đang sử dụng.
- Nút bật/tắt riêng: Vị trí chính xác.

## Vì sao dùng bộ chọn (không chỉ là công tắc)

Quyền của hệ điều hành có nhiều cấp. Chúng ta có thể hiển thị bộ chọn trong ứng dụng, nhưng hệ điều hành vẫn quyết định quyền thực tế được cấp.

- iOS/macOS có thể hiển thị **Khi đang sử dụng** hoặc **Luôn luôn** trong lời nhắc hệ thống/Cài đặt.
- Ứng dụng Android hiện chỉ hỗ trợ vị trí khi chạy ở foreground.
- Vị trí chính xác là một quyền riêng (iOS 14+ "Precise", Android "fine" so với "coarse").

Bộ chọn trong UI điều khiển chế độ mà chúng ta yêu cầu; quyền thực tế nằm trong cài đặt hệ điều hành.

## Mô hình cài đặt

Theo từng thiết bị Node:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

Hành vi UI:

- Chọn `whileUsing` sẽ yêu cầu quyền foreground.
- Nếu hệ điều hành từ chối cấp độ được yêu cầu, hoàn nguyên về cấp độ cao nhất đã được cấp và hiển thị trạng thái.

## Ánh xạ quyền (`node.permissions`)

Không bắt buộc. Node macOS báo cáo `location` qua bản đồ quyền; iOS/Android có thể bỏ qua mục này.

## Lệnh: `location.get`

Được gọi qua `node.invoke`.

Tham số (đề xuất):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

Payload phản hồi:

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: ứng dụng đang ở background nhưng chỉ cho phép Khi đang sử dụng.
- `LOCATION_TIMEOUT`: không lấy được vị trí kịp thời.
- `LOCATION_UNAVAILABLE`: lỗi hệ thống / không có nhà cung cấp.

## Hành vi background

- Ứng dụng Android từ chối `location.get` khi ở background.
- Giữ OpenClaw mở khi yêu cầu vị trí trên Android.
- Các nền tảng Node khác có thể khác.

## Tích hợp mô hình/công cụ

- Bề mặt công cụ: công cụ `nodes` thêm hành động `location_get` (bắt buộc có Node).
- CLI: `openclaw nodes location get --node <id>`.
- Hướng dẫn cho agent: chỉ gọi khi người dùng đã bật vị trí và hiểu phạm vi.

## Nội dung UX (đề xuất)

- Tắt: "Chia sẻ vị trí đã bị tắt."
- Khi đang sử dụng: "Chỉ khi OpenClaw đang mở."
- Chính xác: "Sử dụng vị trí GPS chính xác. Tắt để chia sẻ vị trí gần đúng."

## Liên quan

- [Phân tích vị trí trong kênh](/vi/channels/location)
- [Chụp bằng camera](/vi/nodes/camera)
- [Chế độ trò chuyện](/vi/nodes/talk)
