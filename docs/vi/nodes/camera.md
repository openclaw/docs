---
read_when:
    - Thêm hoặc sửa đổi tính năng chụp bằng camera trên các nút iOS/Android hoặc macOS
    - Mở rộng các quy trình tệp tạm thời MEDIA mà tác tử có thể truy cập
summary: 'Chụp/quay bằng camera (Node iOS/Android + ứng dụng macOS) để tác tử sử dụng: ảnh (jpg) và đoạn video ngắn (mp4)'
title: Chụp bằng camera
x-i18n:
    generated_at: "2026-04-29T22:54:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw hỗ trợ **ghi lại từ camera** cho quy trình làm việc của tác tử:

- **Node iOS** (được ghép nối qua Gateway): chụp **ảnh** (`jpg`) hoặc quay **đoạn video ngắn** (`mp4`, có âm thanh tùy chọn) qua `node.invoke`.
- **Node Android** (được ghép nối qua Gateway): chụp **ảnh** (`jpg`) hoặc quay **đoạn video ngắn** (`mp4`, có âm thanh tùy chọn) qua `node.invoke`.
- **Ứng dụng macOS** (Node qua Gateway): chụp **ảnh** (`jpg`) hoặc quay **đoạn video ngắn** (`mp4`, có âm thanh tùy chọn) qua `node.invoke`.

Mọi quyền truy cập camera đều được kiểm soát bằng **cài đặt do người dùng điều khiển**.

## Node iOS

### Cài đặt người dùng (mặc định bật)

- Thẻ Cài đặt iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Mặc định: **bật** (khóa bị thiếu được xem là đã bật).
  - Khi tắt: các lệnh `camera.*` trả về `CAMERA_DISABLED`.

### Lệnh (qua Gateway `node.invoke`)

- `camera.list`
  - Tải dữ liệu phản hồi:
    - `devices`: mảng `{ id, name, position, deviceType }`

- `camera.snap`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `maxWidth`: số (tùy chọn; mặc định `1600` trên Node iOS)
    - `quality`: `0..1` (tùy chọn; mặc định `0.9`)
    - `format`: hiện là `jpg`
    - `delayMs`: số (tùy chọn; mặc định `0`)
    - `deviceId`: chuỗi (tùy chọn; từ `camera.list`)
  - Tải dữ liệu phản hồi:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Bảo vệ tải dữ liệu: ảnh được nén lại để giữ tải dữ liệu base64 dưới 5 MB.

- `camera.clip`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `durationMs`: số (mặc định `3000`, bị giới hạn tối đa `60000`)
    - `includeAudio`: boolean (mặc định `true`)
    - `format`: hiện là `mp4`
    - `deviceId`: chuỗi (tùy chọn; từ `camera.list`)
  - Tải dữ liệu phản hồi:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Yêu cầu chạy nền trước

Giống như `canvas.*`, Node iOS chỉ cho phép các lệnh `camera.*` ở **nền trước**. Các lời gọi ở nền sau trả về `NODE_BACKGROUND_UNAVAILABLE`.

### Trình trợ giúp CLI (tệp tạm + MEDIA)

Cách dễ nhất để nhận tệp đính kèm là dùng trình trợ giúp CLI, trình này ghi media đã giải mã vào một tệp tạm và in `MEDIA:<path>`.

Ví dụ:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Ghi chú:

- `nodes camera snap` mặc định dùng **cả hai** hướng để cung cấp cho tác tử cả hai góc nhìn.
- Tệp đầu ra là tệp tạm (trong thư mục tạm của hệ điều hành) trừ khi bạn tự xây dựng trình bao bọc riêng.

## Node Android

### Cài đặt người dùng Android (mặc định bật)

- Bảng Cài đặt Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Mặc định: **bật** (khóa bị thiếu được xem là đã bật).
  - Khi tắt: các lệnh `camera.*` trả về `CAMERA_DISABLED`.

### Quyền

- Android yêu cầu quyền thời gian chạy:
  - `CAMERA` cho cả `camera.snap` và `camera.clip`.
  - `RECORD_AUDIO` cho `camera.clip` khi `includeAudio=true`.

Nếu thiếu quyền, ứng dụng sẽ nhắc khi có thể; nếu bị từ chối, yêu cầu `camera.*` sẽ thất bại với lỗi
`*_PERMISSION_REQUIRED`.

### Yêu cầu chạy nền trước trên Android

Giống như `canvas.*`, Node Android chỉ cho phép các lệnh `camera.*` ở **nền trước**. Các lời gọi ở nền sau trả về `NODE_BACKGROUND_UNAVAILABLE`.

### Lệnh Android (qua Gateway `node.invoke`)

- `camera.list`
  - Tải dữ liệu phản hồi:
    - `devices`: mảng `{ id, name, position, deviceType }`

### Bảo vệ tải dữ liệu

Ảnh được nén lại để giữ tải dữ liệu base64 dưới 5 MB.

## Ứng dụng macOS

### Cài đặt người dùng (mặc định tắt)

Ứng dụng đồng hành macOS cung cấp một hộp kiểm:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Mặc định: **tắt**
  - Khi tắt: yêu cầu camera trả về “Camera disabled by user”.

### Trình trợ giúp CLI (lời gọi Node)

Dùng CLI `openclaw` chính để gọi lệnh camera trên Node macOS.

Ví dụ:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

Ghi chú:

- `openclaw nodes camera snap` mặc định là `maxWidth=1600` trừ khi được ghi đè.
- Trên macOS, `camera.snap` chờ `delayMs` (mặc định 2000ms) sau khi khởi động làm nóng/ổn định phơi sáng trước khi chụp.
- Tải dữ liệu ảnh được nén lại để giữ base64 dưới 5 MB.

## An toàn + giới hạn thực tế

- Quyền truy cập camera và micrô kích hoạt các lời nhắc quyền thông thường của hệ điều hành (và yêu cầu chuỗi mô tả sử dụng trong Info.plist).
- Đoạn video được giới hạn (hiện `<= 60s`) để tránh tải dữ liệu Node quá lớn (phần dư base64 + giới hạn tin nhắn).

## Video màn hình macOS (cấp hệ điều hành)

Đối với video _màn hình_ (không phải camera), dùng ứng dụng đồng hành macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Ghi chú:

- Yêu cầu quyền **Screen Recording** của macOS (TCC).

## Liên quan

- [Hỗ trợ hình ảnh và media](/vi/nodes/images)
- [Hiểu media](/vi/nodes/media-understanding)
- [Lệnh vị trí](/vi/nodes/location-command)
