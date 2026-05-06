---
read_when:
    - Thêm hoặc sửa đổi tính năng chụp bằng camera trên các nút iOS/Android hoặc macOS
    - Mở rộng các quy trình làm việc với tệp tạm thời MEDIA mà tác nhân có thể truy cập
summary: 'Thu nhận từ camera (các Node iOS/Android + ứng dụng macOS) để tác tử sử dụng: ảnh (jpg) và đoạn video ngắn (mp4)'
title: Chụp bằng camera
x-i18n:
    generated_at: "2026-05-06T09:19:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw hỗ trợ **chụp bằng camera** cho các quy trình làm việc của tác nhân:

- **Node iOS** (được ghép đôi qua Gateway): chụp **ảnh** (`jpg`) hoặc **đoạn video ngắn** (`mp4`, có âm thanh tùy chọn) qua `node.invoke`.
- **Node Android** (được ghép đôi qua Gateway): chụp **ảnh** (`jpg`) hoặc **đoạn video ngắn** (`mp4`, có âm thanh tùy chọn) qua `node.invoke`.
- **Ứng dụng macOS** (Node qua Gateway): chụp **ảnh** (`jpg`) hoặc **đoạn video ngắn** (`mp4`, có âm thanh tùy chọn) qua `node.invoke`.

Mọi quyền truy cập camera đều được kiểm soát bằng **cài đặt do người dùng điều khiển**.

## Node iOS

### Cài đặt người dùng (mặc định bật)

- Thẻ Cài đặt iOS → **Camera** → **Allow Camera** (`camera.enabled`)
  - Mặc định: **bật** (khóa bị thiếu được coi là đã bật).
  - Khi tắt: các lệnh `camera.*` trả về `CAMERA_DISABLED`.

### Lệnh (qua Gateway `node.invoke`)

- `camera.list`
  - Tải phản hồi:
    - `devices`: mảng gồm `{ id, name, position, deviceType }`

- `camera.snap`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `maxWidth`: số (tùy chọn; mặc định `1600` trên Node iOS)
    - `quality`: `0..1` (tùy chọn; mặc định `0.9`)
    - `format`: hiện là `jpg`
    - `delayMs`: số (tùy chọn; mặc định `0`)
    - `deviceId`: chuỗi (tùy chọn; từ `camera.list`)
  - Tải phản hồi:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - Bộ giới hạn tải: ảnh được nén lại để giữ tải base64 dưới 5 MB.

- `camera.clip`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `durationMs`: số (mặc định `3000`, được giới hạn tối đa `60000`)
    - `includeAudio`: boolean (mặc định `true`)
    - `format`: hiện là `mp4`
    - `deviceId`: chuỗi (tùy chọn; từ `camera.list`)
  - Tải phản hồi:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### Yêu cầu chạy tiền cảnh

Giống như `canvas.*`, Node iOS chỉ cho phép các lệnh `camera.*` ở **tiền cảnh**. Lời gọi nền trả về `NODE_BACKGROUND_UNAVAILABLE`.

### Trình trợ giúp CLI (tệp tạm + MEDIA)

Cách dễ nhất để nhận tệp đính kèm là dùng trình trợ giúp CLI, công cụ này ghi phương tiện đã giải mã vào tệp tạm và in `MEDIA:<path>`.

Ví dụ:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

Ghi chú:

- `nodes camera snap` mặc định dùng **cả hai** hướng camera để cung cấp cho tác nhân cả hai góc nhìn.
- Tệp đầu ra là tạm thời (trong thư mục tạm của OS) trừ khi bạn tự xây dựng wrapper.

## Node Android

### Cài đặt người dùng Android (mặc định bật)

- Bảng Cài đặt Android → **Camera** → **Allow Camera** (`camera.enabled`)
  - Mặc định: **bật** (khóa bị thiếu được coi là đã bật).
  - Khi tắt: các lệnh `camera.*` trả về `CAMERA_DISABLED`.

### Quyền

- Android yêu cầu quyền khi chạy:
  - `CAMERA` cho cả `camera.snap` và `camera.clip`.
  - `RECORD_AUDIO` cho `camera.clip` khi `includeAudio=true`.

Nếu thiếu quyền, ứng dụng sẽ nhắc khi có thể; nếu bị từ chối, yêu cầu `camera.*` thất bại với lỗi
`*_PERMISSION_REQUIRED`.

### Yêu cầu chạy tiền cảnh trên Android

Giống như `canvas.*`, Node Android chỉ cho phép các lệnh `camera.*` ở **tiền cảnh**. Lời gọi nền trả về `NODE_BACKGROUND_UNAVAILABLE`.

### Lệnh Android (qua Gateway `node.invoke`)

- `camera.list`
  - Tải phản hồi:
    - `devices`: mảng gồm `{ id, name, position, deviceType }`

### Bộ giới hạn tải

Ảnh được nén lại để giữ tải base64 dưới 5 MB.

## Ứng dụng macOS

### Cài đặt người dùng (mặc định tắt)

Ứng dụng đồng hành macOS hiển thị một hộp kiểm:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - Mặc định: **tắt**
  - Khi tắt: yêu cầu camera trả về "Camera disabled by user".

### Trình trợ giúp CLI (gọi Node)

Dùng CLI `openclaw` chính để gọi các lệnh camera trên Node macOS.

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
- Trên macOS, `camera.snap` chờ `delayMs` (mặc định 2000ms) sau khi khởi động và phơi sáng ổn định trước khi chụp.
- Tải ảnh được nén lại để giữ base64 dưới 5 MB.

## An toàn + giới hạn thực tế

- Quyền truy cập camera và micrô kích hoạt các lời nhắc quyền thông thường của OS (và yêu cầu chuỗi mô tả sử dụng trong Info.plist).
- Đoạn video được giới hạn (hiện `<= 60s`) để tránh tải Node quá lớn (chi phí base64 + giới hạn tin nhắn).

## Video màn hình macOS (cấp OS)

Đối với video _màn hình_ (không phải camera), hãy dùng ứng dụng đồng hành macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

Ghi chú:

- Yêu cầu quyền **Screen Recording** của macOS (TCC).

## Liên quan

- [Hỗ trợ hình ảnh và phương tiện](/vi/nodes/images)
- [Hiểu phương tiện](/vi/nodes/media-understanding)
- [Lệnh vị trí](/vi/nodes/location-command)
