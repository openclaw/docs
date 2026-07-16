---
read_when:
    - Thêm hỗ trợ Node vị trí hoặc giao diện người dùng về quyền truy cập
    - Thiết kế quyền truy cập vị trí hoặc hành vi chạy ở nền trước trên Android
summary: Lệnh định vị cho các Node, chế độ quyền của nền tảng và thiết lập GeoClue trên Linux
title: Lệnh vị trí
x-i18n:
    generated_at: "2026-07-16T14:37:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## Tóm tắt

- `location.get` là một lệnh Node, được gọi qua `node.invoke` hoặc `openclaw nodes location get`.
- Mặc định tắt.
- Các bản dựng Android của bên thứ ba sử dụng bộ chọn: Tắt / Khi đang sử dụng / Luôn luôn. Các bản dựng Play vẫn chỉ có Tắt / Khi đang sử dụng.
- Vị trí chính xác là một nút bật/tắt riêng biệt.

## Tại sao dùng bộ chọn (thay vì chỉ một công tắc)

Quyền vị trí của hệ điều hành có nhiều cấp độ. Vị trí chính xác cũng là một quyền cấp riêng của hệ điều hành (iOS 14+ dùng "Chính xác", Android dùng "chính xác" so với "gần đúng"). Bộ chọn trong ứng dụng quyết định chế độ được yêu cầu, nhưng hệ điều hành vẫn quyết định quyền thực tế được cấp.

## Mô hình cài đặt

Theo từng thiết bị Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

Hành vi giao diện người dùng:

- Việc chọn `whileUsing` sẽ yêu cầu quyền truy cập khi ứng dụng ở tiền cảnh.
- Việc chọn `always` trong bản dựng Android của bên thứ ba trước tiên sẽ yêu cầu quyền truy cập khi ứng dụng ở tiền cảnh, giải thích về quyền truy cập trong nền, sau đó mở phần cài đặt ứng dụng Android để cấp riêng quyền **Allow all the time**.
- Các bản dựng Android Play không khai báo quyền truy cập vị trí trong nền hoặc hiển thị `always`.
- Nếu hệ điều hành từ chối cấp độ được yêu cầu, ứng dụng sẽ quay về cấp độ cao nhất đã được cấp và hiển thị trạng thái.

## Ánh xạ quyền (node.permissions)

Không bắt buộc. Node macOS báo cáo `location` qua ánh xạ `permissions` trên `node.list`/`node.describe`; iOS/Android có thể bỏ qua thông tin này.

## Lệnh: `location.get`

Được gọi qua `node.invoke` hoặc trình trợ giúp CLI:

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

Các cờ CLI được ánh xạ trực tiếp: `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: ứng dụng đang chạy trong nền nhưng chỉ được cấp quyền Khi đang sử dụng.
- `LOCATION_TIMEOUT`: không xác định được vị trí kịp thời.
- `LOCATION_UNAVAILABLE`: lỗi hệ thống hoặc không có nhà cung cấp.

## Hành vi trong nền

- Các bản dựng Android của bên thứ ba chỉ chấp nhận `location.get` trong nền khi người dùng đã chọn `Always` và Android đã cấp quyền truy cập vị trí trong nền. Dịch vụ Node thường trực hiện có bổ sung loại dịch vụ `location` và hiển thị `Location: Always` khi đang hoạt động.
- Các bản dựng Android Play và chế độ `While Using` từ chối `location.get` khi ứng dụng đang chạy trong nền.
- Các nền tảng Node khác có thể hoạt động khác.

## Máy chủ Node Linux

Plugin Node Linux đi kèm bổ sung `location.get` vào dịch vụ CLI `openclaw node`, bao gồm cả các máy chủ không có giao diện không chạy ứng dụng máy tính Linux. Vị trí mặc định bị tắt. Bật tính năng này trong mục nhập Plugin, sau đó khởi động lại dịch vụ Node:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

Cài đặt GeoClue2 và bản demo `where-am-i` của nó (`geoclue-2-demo` trên Debian và Ubuntu). Người dùng chạy dịch vụ Node phải được chính sách GeoClue và tác nhân ủy quyền của máy chủ cho phép.

Plugin sử dụng `where-am-i` thay vì một chuỗi lệnh gọi `busctl`. GeoClue liên kết việc tạo máy khách, thuộc tính, khởi động, cập nhật và dừng với một kết nối máy khách D-Bus duy nhất; bản demo duy trì toàn bộ vòng đời này cùng nhau, trong khi các tiến trình con `busctl` riêng biệt thì không. Không có phần phụ thuộc npm nào được thêm vào.

Linux ánh xạ `coarse`, `balanced` và `precise` sang các cấp độ chính xác GeoClue `4`, `6` và `8`. Hệ thống xác thực `maxAgeMs` dựa trên dấu thời gian được trả về. Bản demo của GeoClue không cung cấp nhà cung cấp đã chọn, vì vậy `source` là `unknown`; `isPrecise` chỉ là true khi độ chính xác được báo cáo là 100 mét trở xuống.

Linux sử dụng cùng các lỗi ổn định: `LOCATION_DISABLED`, `LOCATION_TIMEOUT` và `LOCATION_UNAVAILABLE`.

## Tích hợp mô hình/công cụ

- Công cụ của tác nhân: hành động `location_get` của công cụ `nodes` (yêu cầu Node).
- CLI: `openclaw nodes location get --node <id>`.
- Hướng dẫn dành cho tác nhân: chỉ gọi khi người dùng đã bật vị trí và hiểu phạm vi.

## Nội dung UX (đề xuất)

- Tắt: "Chia sẻ vị trí đã bị tắt."
- Khi đang sử dụng: "Chỉ khi OpenClaw đang mở."
- Luôn luôn: "Cho phép các yêu cầu kiểm tra vị trí khi OpenClaw đang chạy trong nền."
- Chính xác: "Sử dụng vị trí GPS chính xác. Tắt tùy chọn này để chia sẻ vị trí gần đúng."

## Liên quan

- [Tổng quan về Node](/vi/nodes)
- [Phân tích vị trí của kênh](/vi/channels/location)
- [Chụp ảnh bằng camera](/vi/nodes/camera)
- [Chế độ trò chuyện](/vi/nodes/talk)
