---
read_when:
    - Thêm hoặc sửa đổi tính năng chụp ảnh bằng camera trên các Node iOS/Android hoặc macOS
    - Mở rộng quy trình làm việc với tệp tạm MEDIA mà agent có thể truy cập
summary: 'Chụp bằng camera (các Node iOS/Android + ứng dụng macOS) để tác tử sử dụng: ảnh (jpg) và đoạn video ngắn (mp4)'
title: Chụp ảnh bằng camera
x-i18n:
    generated_at: "2026-07-12T08:02:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw hỗ trợ chụp từ camera cho các quy trình tác tử trên các node **iOS**, **Android** và **macOS** đã ghép nối: chụp ảnh (`jpg`) hoặc quay một đoạn video ngắn (`mp4`, có thể kèm âm thanh) thông qua `node.invoke` của Gateway.

Mọi quyền truy cập camera đều được kiểm soát bằng một cài đặt do người dùng quản lý trên từng nền tảng.

## Node iOS

### Cài đặt người dùng trên iOS

- Thẻ iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - Mặc định: **bật** (khóa bị thiếu được coi là đã bật).
  - Khi tắt: các lệnh `camera.*` trả về `CAMERA_DISABLED`.

### Lệnh iOS (thông qua `node.invoke` của Gateway)

- `camera.list`
  - Dữ liệu phản hồi: `devices` — mảng gồm `{ id, name, position, deviceType }`.

- `camera.snap`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `maxWidth`: số (không bắt buộc; mặc định `1600`)
    - `quality`: `0..1` (không bắt buộc; mặc định `0.9`, được giới hạn trong `[0.05, 1.0]`)
    - `format`: hiện là `jpg`
    - `delayMs`: số (không bắt buộc; mặc định `0`, được giới hạn nội bộ tối đa ở `10000`)
    - `deviceId`: chuỗi (không bắt buộc; lấy từ `camera.list`)
  - Dữ liệu phản hồi: `format: "jpg"`, `base64`, `width`, `height`.
  - Giới hạn dữ liệu: ảnh được nén lại để giữ dữ liệu mã hóa base64 dưới 5MB.

- `camera.clip`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `durationMs`: số (mặc định `3000`, được giới hạn trong `[250, 60000]`)
    - `includeAudio`: giá trị boolean (mặc định `true`)
    - `format`: hiện là `mp4`
    - `deviceId`: chuỗi (không bắt buộc; lấy từ `camera.list`)
  - Dữ liệu phản hồi: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Yêu cầu chạy ở tiền cảnh trên iOS

Tương tự `canvas.*`, node iOS chỉ cho phép các lệnh `camera.*` khi ứng dụng ở **tiền cảnh**. Các lệnh gọi trong nền trả về `NODE_BACKGROUND_UNAVAILABLE`.

### Trình hỗ trợ CLI

Cách dễ nhất để lấy tệp phương tiện là dùng trình hỗ trợ CLI. Trình này ghi dữ liệu phương tiện đã giải mã vào một tệp tạm thời và in ra đường dẫn đã lưu.

```bash
openclaw nodes camera snap --node <id>                 # mặc định: cả camera trước + sau (2 dòng MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` mặc định dùng `--facing both`, chụp cả camera trước và sau để cung cấp cho tác tử cả hai góc nhìn; hãy truyền `--device-id` cùng một hướng camera cụ thể (`both` sẽ bị từ chối khi đặt `--device-id`). Các tệp đầu ra là tệp tạm thời (trong thư mục tạm của hệ điều hành), trừ khi bạn tự xây dựng trình bao bọc.

## Node Android

### Cài đặt người dùng trên Android

- Bảng Android Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Các bản cài đặt mới mặc định ở trạng thái tắt.** Các bản cài đặt hiện có từ trước khi cài đặt này được bổ sung sẽ được chuyển sang trạng thái **bật**, để việc nâng cấp không âm thầm làm mất quyền truy cập camera vốn đang hoạt động.
  - Khi tắt: các lệnh `camera.*` trả về `CAMERA_DISABLED: enable Camera in Settings`.

### Quyền

- `CAMERA` là bắt buộc cho cả `camera.snap` và `camera.clip`; quyền bị thiếu hoặc bị từ chối sẽ trả về `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` là bắt buộc đối với `camera.clip` khi `includeAudio` là `true`; quyền bị thiếu hoặc bị từ chối sẽ trả về `MIC_PERMISSION_REQUIRED`.

Ứng dụng sẽ yêu cầu quyền khi chạy nếu có thể.

### Yêu cầu chạy ở tiền cảnh trên Android

Tương tự `canvas.*`, node Android chỉ cho phép các lệnh `camera.*` khi ứng dụng ở **tiền cảnh**. Các lệnh gọi trong nền trả về `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Lệnh Android (thông qua `node.invoke` của Gateway)

- `camera.list`
  - Dữ liệu phản hồi: `devices` — mảng gồm `{ id, name, position, deviceType }`.

- `camera.snap`
  - Tham số: `facing` (`front|back`, mặc định `front`), `quality` (mặc định `0.95`, được giới hạn trong `[0.1, 1.0]`), `maxWidth` (mặc định `1600`), `deviceId` (không bắt buộc; mã không xác định sẽ thất bại với `INVALID_REQUEST`).
  - Dữ liệu phản hồi: `format: "jpg"`, `base64`, `width`, `height`.
  - Giới hạn dữ liệu: được nén lại để giữ base64 dưới 5MB (cùng giới hạn với iOS).

- `camera.clip`
  - Tham số: `facing` (mặc định `front`), `durationMs` (mặc định `3000`, được giới hạn trong `[200, 60000]`), `includeAudio` (mặc định `true`), `deviceId` (không bắt buộc).
  - Dữ liệu phản hồi: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Giới hạn dữ liệu: MP4 thô được giới hạn ở 18MB trước khi mã hóa base64; các đoạn video vượt quá kích thước sẽ thất bại với `PAYLOAD_TOO_LARGE` (hãy giảm `durationMs` rồi thử lại).

## Ứng dụng macOS

### Cài đặt người dùng trên macOS

Ứng dụng đồng hành macOS cung cấp một hộp kiểm:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Mặc định: **tắt**.
  - Khi tắt: các yêu cầu camera trả về `CAMERA_DISABLED: enable Camera in Settings`.

### Trình hỗ trợ CLI (gọi node)

Dùng CLI `openclaw` chính để gọi các lệnh camera trên node macOS.

```bash
openclaw nodes camera list --node <id>                     # liệt kê mã camera
openclaw nodes camera snap --node <id>                     # in đường dẫn đã lưu
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # in đường dẫn đã lưu
openclaw nodes camera clip --node <id> --duration-ms 3000   # in đường dẫn đã lưu (cờ cũ)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` mặc định dùng `maxWidth=1600`, trừ khi bị ghi đè.
- `camera.snap` chờ `delayMs` (mặc định 2000ms, được giới hạn trong `[0, 10000]`) sau khi quá trình làm nóng và ổn định phơi sáng hoàn tất rồi mới chụp.
- Dữ liệu ảnh được nén lại để giữ base64 dưới 5MB.

## An toàn và giới hạn thực tế

- Quyền truy cập camera và micrô kích hoạt các lời nhắc cấp quyền thông thường của hệ điều hành (và yêu cầu các chuỗi mô tả mục đích sử dụng trong `Info.plist`).
- Các đoạn video được giới hạn ở 60 giây để tránh dữ liệu node quá lớn (chi phí bổ sung của base64 cộng với giới hạn tin nhắn).

## Video màn hình macOS (cấp hệ điều hành)

Để quay video _màn hình_ (không phải camera), hãy dùng ứng dụng đồng hành macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # in đường dẫn đã lưu
```

Yêu cầu quyền **Screen Recording** của macOS (TCC).

## Liên quan

- [Hỗ trợ hình ảnh và phương tiện](/vi/nodes/images)
- [Hiểu nội dung phương tiện](/vi/nodes/media-understanding)
- [Lệnh vị trí](/vi/nodes/location-command)
