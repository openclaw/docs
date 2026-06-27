---
read_when:
    - Thêm hoặc sửa đổi tính năng chụp camera trên các nút iOS/Android hoặc macOS
    - Mở rộng quy trình làm việc tệp tạm thời MEDIA mà agent có thể truy cập
summary: 'Chụp bằng camera (nút iOS/Android + ứng dụng macOS) để agent sử dụng: ảnh (jpg) và đoạn video ngắn (mp4)'
title: Ghi hình từ camera
x-i18n:
    generated_at: "2026-06-27T17:39:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw hỗ trợ **chụp/quay bằng camera** cho quy trình làm việc của agent:

- **Nút iOS** (ghép đôi qua Gateway): chụp **ảnh** (`jpg`) hoặc quay **đoạn video ngắn** (`mp4`, có âm thanh tùy chọn) qua `node.invoke`.
- **Nút Android** (ghép đôi qua Gateway): chụp **ảnh** (`jpg`) hoặc quay **đoạn video ngắn** (`mp4`, có âm thanh tùy chọn) qua `node.invoke`.
- **Ứng dụng macOS** (nút qua Gateway): chụp **ảnh** (`jpg`) hoặc quay **đoạn video ngắn** (`mp4`, có âm thanh tùy chọn) qua `node.invoke`.

Mọi quyền truy cập camera đều được kiểm soát bằng **cài đặt do người dùng điều khiển**.

## Nút iOS

### Cài đặt người dùng (bật theo mặc định)

- Thẻ Cài đặt iOS → **Camera** → **Cho phép Camera** (`camera.enabled`)
  - Mặc định: **bật** (khóa bị thiếu được xem là đã bật).
  - Khi tắt: các lệnh `camera.*` trả về `CAMERA_DISABLED`.

### Lệnh (qua Gateway `node.invoke`)

- `camera.list`
  - Tải trọng phản hồi:
    - `devices`: mảng `{ id, name, position, deviceType }`

- `camera.snap`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `maxWidth`: số (tùy chọn; mặc định `1600` trên nút iOS)
    - `quality`: `0..1` (tùy chọn; mặc định `0.9`)
    - `format`: hiện là `jpg`
    - `delayMs`: số (tùy chọn; mặc định `0`)
    - `deviceId`: chuỗi (tùy chọn; từ `camera.list`)
  - Tải trọng phản hồi:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Bảo vệ tải trọng: ảnh được nén lại để giữ tải trọng base64 dưới 5 MB.

- `camera.clip`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `durationMs`: số (mặc định `3000`, bị giới hạn tối đa `60000`)
    - `includeAudio`: boolean (mặc định `true`)
    - `format`: hiện là `mp4`
    - `deviceId`: chuỗi (tùy chọn; từ `camera.list`)
  - Tải trọng phản hồi:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Yêu cầu chạy ở tiền cảnh

Giống như `canvas.*`, nút iOS chỉ cho phép các lệnh `camera.*` ở **tiền cảnh**. Lệnh gọi nền trả về `NODE_BACKGROUND_UNAVAILABLE`.

### Trình trợ giúp CLI

Cách dễ nhất để lấy tệp media là dùng trình trợ giúp CLI, công cụ này ghi media đã giải mã vào tệp tạm và in đường dẫn đã lưu.

Ví dụ:

```bash
openclaw nodes camera snap --node <id>               # mặc định: cả trước + sau (2 dòng MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Ghi chú:

- `nodes camera snap` mặc định dùng **cả hai** hướng camera để cung cấp cho agent cả hai góc nhìn.
- Tệp đầu ra là tệp tạm thời (trong thư mục tạm của HĐH) trừ khi bạn tự xây dựng wrapper riêng.

## Nút Android

### Cài đặt người dùng Android (bật theo mặc định)

- Trang Cài đặt Android → **Camera** → **Cho phép Camera** (`camera.enabled`)
  - Mặc định: **bật** (khóa bị thiếu được xem là đã bật).
  - Khi tắt: các lệnh `camera.*` trả về `CAMERA_DISABLED`.

### Quyền

- Android yêu cầu quyền khi chạy:
  - `CAMERA` cho cả `camera.snap` và `camera.clip`.
  - `RECORD_AUDIO` cho `camera.clip` khi `includeAudio=true`.

Nếu thiếu quyền, ứng dụng sẽ nhắc khi có thể; nếu bị từ chối, yêu cầu `camera.*` sẽ thất bại với lỗi
`*_PERMISSION_REQUIRED`.

### Yêu cầu chạy ở tiền cảnh trên Android

Giống như `canvas.*`, nút Android chỉ cho phép các lệnh `camera.*` ở **tiền cảnh**. Lệnh gọi nền trả về `NODE_BACKGROUND_UNAVAILABLE`.

### Lệnh Android (qua Gateway `node.invoke`)

- `camera.list`
  - Tải trọng phản hồi:
    - `devices`: mảng `{ id, name, position, deviceType }`

### Bảo vệ tải trọng

Ảnh được nén lại để giữ tải trọng base64 dưới 5 MB.

## Ứng dụng macOS

### Cài đặt người dùng (tắt theo mặc định)

Ứng dụng đồng hành macOS hiển thị một hộp kiểm:

- **Cài đặt → Chung → Cho phép Camera** (`openclaw.cameraEnabled`)
  - Mặc định: **tắt**
  - Khi tắt: yêu cầu camera trả về "Camera disabled by user".

### Trình trợ giúp CLI (node invoke)

Dùng CLI `openclaw` chính để gọi các lệnh camera trên nút macOS.

Ví dụ:

```bash
openclaw nodes camera list --node <id>            # liệt kê id camera
openclaw nodes camera snap --node <id>            # in đường dẫn đã lưu
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # in đường dẫn đã lưu
openclaw nodes camera clip --node <id> --duration-ms 3000      # in đường dẫn đã lưu (cờ cũ)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Ghi chú:

- `openclaw nodes camera snap` mặc định là `maxWidth=1600` trừ khi bị ghi đè.
- Trên macOS, `camera.snap` chờ `delayMs` (mặc định 2000ms) sau khi khởi động/lấy phơi sáng ổn định rồi mới chụp.
- Tải trọng ảnh được nén lại để giữ base64 dưới 5 MB.

## An toàn + giới hạn thực tế

- Quyền truy cập camera và microphone kích hoạt lời nhắc cấp quyền thông thường của HĐH (và yêu cầu chuỗi mô tả sử dụng trong Info.plist).
- Đoạn video bị giới hạn (hiện là `<= 60s`) để tránh tải trọng nút quá lớn (chi phí base64 + giới hạn tin nhắn).

## Video màn hình macOS (cấp HĐH)

Đối với video _màn hình_ (không phải camera), hãy dùng ứng dụng đồng hành macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # in đường dẫn đã lưu
```

Ghi chú:

- Yêu cầu quyền **Ghi màn hình** của macOS (TCC).

## Liên quan

- [Hỗ trợ hình ảnh và media](/vi/nodes/images)
- [Hiểu media](/vi/nodes/media-understanding)
- [Lệnh vị trí](/vi/nodes/location-command)
