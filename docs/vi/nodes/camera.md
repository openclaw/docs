---
read_when:
    - Thêm hoặc sửa đổi tính năng chụp ảnh bằng camera trên các nền tảng Node
    - Mở rộng quy trình làm việc với tệp tạm MEDIA mà tác tử có thể truy cập
summary: Chụp ảnh bằng camera trên các Node iOS, Android, macOS và Linux để tạo ảnh và đoạn video ngắn
title: Chụp ảnh bằng camera
x-i18n:
    generated_at: "2026-07-16T15:25:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw hỗ trợ chụp từ camera cho các quy trình làm việc của tác tử trên các Node **iOS**, **Android**, **macOS** và **Linux** đã ghép đôi: chụp ảnh (`jpg`) hoặc quay một đoạn video ngắn (`mp4`, có âm thanh tùy chọn) qua Gateway `node.invoke`.

Mọi quyền truy cập camera đều được kiểm soát bằng một cài đặt do người dùng quản lý trên từng nền tảng.

## Node iOS

### Cài đặt người dùng trên iOS

- Tab iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - Mặc định: **bật** (khóa bị thiếu được coi là đã bật).
  - Khi tắt: các lệnh `camera.*` trả về `CAMERA_DISABLED`.

### Các lệnh iOS (qua Gateway `node.invoke`)

- `camera.list`
  - Nội dung phản hồi: `devices` — mảng gồm các `{ id, name, position, deviceType }`.

- `camera.snap`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `maxWidth`: số (tùy chọn; mặc định `1600`)
    - `quality`: `0..1` (tùy chọn; mặc định `0.9`, được giới hạn ở `[0.05, 1.0]`)
    - `format`: hiện là `jpg`
    - `delayMs`: số (tùy chọn; mặc định `0`, được giới hạn nội bộ ở `10000`)
    - `deviceId`: chuỗi (tùy chọn; từ `camera.list`)
  - Nội dung phản hồi: `format: "jpg"`, `base64`, `width`, `height`.
  - Giới hạn nội dung: ảnh được nén lại để giữ nội dung mã hóa base64 dưới 5MB.

- `camera.clip`
  - Tham số:
    - `facing`: `front|back` (mặc định: `front`)
    - `durationMs`: số (mặc định `3000`, được giới hạn ở `[250, 60000]`)
    - `includeAudio`: boolean (mặc định `true`)
    - `format`: hiện là `mp4`
    - `deviceId`: chuỗi (tùy chọn; từ `camera.list`)
  - Nội dung phản hồi: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### Yêu cầu chạy ở tiền cảnh trên iOS

Tương tự `canvas.*`, Node iOS chỉ cho phép các lệnh `camera.*` ở **tiền cảnh**. Các lệnh gọi trong nền trả về `NODE_BACKGROUND_UNAVAILABLE`.

### Trình hỗ trợ CLI

Cách dễ nhất để lấy tệp phương tiện là dùng trình hỗ trợ CLI, công cụ này ghi phương tiện đã giải mã vào một tệp tạm thời và in ra đường dẫn đã lưu.

```bash
openclaw nodes camera snap --node <id>                 # mặc định: cả camera trước + sau (2 dòng MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` mặc định là `--facing both`, chụp bằng cả camera trước và sau để cung cấp cho tác tử cả hai góc nhìn; truyền `--device-id` với một hướng camera cụ thể duy nhất (`both` bị từ chối khi đặt `--device-id`). Các tệp đầu ra là tạm thời (trong thư mục tạm của hệ điều hành), trừ khi bạn tự xây dựng trình bao bọc.

## Node Android

### Cài đặt người dùng trên Android

- Bảng Android Settings → **Camera** → **Allow Camera** (`camera.enabled`).
  - **Các bản cài đặt mới mặc định là tắt.** Các bản cài đặt hiện có từ trước khi cài đặt này xuất hiện sẽ được di chuyển sang trạng thái **bật**, để quá trình nâng cấp không âm thầm làm mất quyền truy cập camera vốn hoạt động trước đó.
  - Khi tắt: các lệnh `camera.*` trả về `CAMERA_DISABLED: enable Camera in Settings`.

### Quyền

- `CAMERA` là bắt buộc cho cả `camera.snap` và `camera.clip`; nếu quyền bị thiếu hoặc bị từ chối, hệ thống trả về `CAMERA_PERMISSION_REQUIRED`.
- `RECORD_AUDIO` là bắt buộc đối với `camera.clip` khi `includeAudio` là `true`; nếu quyền bị thiếu hoặc bị từ chối, hệ thống trả về `MIC_PERMISSION_REQUIRED`.

Ứng dụng sẽ yêu cầu quyền khi chạy nếu có thể.

### Yêu cầu chạy ở tiền cảnh trên Android

Tương tự `canvas.*`, Node Android chỉ cho phép các lệnh `camera.*` ở **tiền cảnh**. Các lệnh gọi trong nền trả về `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`.

### Các lệnh Android (qua Gateway `node.invoke`)

- `camera.list`
  - Nội dung phản hồi: `devices` — mảng gồm các `{ id, name, position, deviceType }`.

- `camera.snap`
  - Tham số: `facing` (`front|back`, mặc định `front`), `quality` (mặc định `0.95`, được giới hạn ở `[0.1, 1.0]`), `maxWidth` (mặc định `1600`), `deviceId` (tùy chọn; id không xác định sẽ thất bại với `INVALID_REQUEST`).
  - Nội dung phản hồi: `format: "jpg"`, `base64`, `width`, `height`.
  - Giới hạn nội dung: được nén lại để giữ dữ liệu base64 dưới 5MB (cùng giới hạn với iOS).

- `camera.clip`
  - Tham số: `facing` (mặc định `front`), `durationMs` (mặc định `3000`, được giới hạn ở `[200, 60000]`), `includeAudio` (mặc định `true`), `deviceId` (tùy chọn).
  - Nội dung phản hồi: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - Giới hạn nội dung: MP4 thô bị giới hạn ở 18MB trước khi mã hóa base64; các đoạn video vượt kích thước sẽ thất bại với `PAYLOAD_TOO_LARGE` (giảm `durationMs` rồi thử lại).

## Ứng dụng macOS

### Cài đặt người dùng trên macOS

Ứng dụng đồng hành trên macOS cung cấp một hộp kiểm:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - Mặc định: **tắt**.
  - Khi tắt: các yêu cầu camera trả về `CAMERA_DISABLED: enable Camera in Settings`.

### Trình hỗ trợ CLI (gọi Node)

Sử dụng CLI `openclaw` chính để gọi các lệnh camera trên Node macOS.

```bash
openclaw nodes camera list --node <id>                     # liệt kê id camera
openclaw nodes camera snap --node <id>                     # in đường dẫn đã lưu
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # in đường dẫn đã lưu
openclaw nodes camera clip --node <id> --duration-ms 3000   # in đường dẫn đã lưu (cờ cũ)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- `openclaw nodes camera snap` mặc định là `maxWidth=1600` trừ khi bị ghi đè.
- `camera.snap` chờ `delayMs` (mặc định 2000ms, được giới hạn ở `[0, 10000]`) sau khi khởi động và ổn định độ phơi sáng rồi mới chụp.
- Nội dung ảnh được nén lại để giữ dữ liệu base64 dưới 5MB.

## Máy chủ Node Linux

Plugin Node Linux đi kèm bổ sung khả năng chụp từ camera cho dịch vụ CLI `openclaw node`. Plugin hoạt động trên máy chủ không có giao diện đồ họa và không yêu cầu ứng dụng máy tính Linux.

Quyền truy cập camera mặc định bị tắt. Bật quyền này trong mục Plugin, sau đó khởi động lại dịch vụ Node để thông tin quảng bá Gateway của dịch vụ được tạo lại:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

Yêu cầu:

- FFmpeg có đầu vào V4L2, `libx264` và hỗ trợ AAC
- một thiết bị `/dev/video*` mà người dùng chạy dịch vụ Node có thể đọc; trên các bản phân phối phổ biến, hãy thêm người dùng đó vào nhóm `video`
- đối với các đoạn video dùng `includeAudio: true` mặc định, cần có máy chủ PulseAudio hoạt động hoặc lớp tương thích PulseAudio của PipeWire với một nguồn mặc định

Linux trả về các đường dẫn thiết bị V4L2 có khả năng chụp và có thể đọc từ `camera.list`; FFmpeg thăm dò từng ứng viên `/dev/video*` và bỏ qua các Node chỉ có siêu dữ liệu hoặc chỉ có đầu ra. `position` của thiết bị là `unknown`, vì vậy các yêu cầu về hướng camera không có `deviceId` sẽ tạo ra một ảnh hoặc đoạn video ở vị trí `unknown`, thay vì tuyên bố đó là camera trước hoặc sau. Sử dụng `deviceId` khi máy chủ có nhiều camera. `camera.snap` sử dụng quá trình khởi động đầu vào FFmpeg cho `delayMs` và giữ nguyên tỷ lệ khung hình trong khi giới hạn chiều rộng. `camera.clip` ghi âm thanh từ micrô làm rãnh âm thanh MP4; OpenClaw chủ ý không cung cấp lệnh micrô độc lập.

Plugin sử dụng `libx264` cho video MP4 và không âm thầm thay đổi codec. Bản dựng FFmpeg thiếu đầu vào hoặc bộ mã hóa bắt buộc sẽ trả về `CAMERA_UNAVAILABLE`. Ảnh và đoạn video có thể vượt quá giới hạn nội dung base64 25MB sẽ thất bại với `PAYLOAD_TOO_LARGE`.

`camera.snap` và `camera.clip` vẫn là các lệnh nguy hiểm. Chỉ thêm chúng vào `gateway.nodes.allowCommands` khi bạn chủ ý kích hoạt khả năng chụp; chỉ bật Plugin không thể bỏ qua chính sách Gateway.

## An toàn và giới hạn thực tế

- Quyền truy cập camera và micrô kích hoạt các lời nhắc quyền thông thường của hệ điều hành (và yêu cầu chuỗi mô tả mục đích sử dụng trong `Info.plist`).
- Các đoạn video bị giới hạn ở 60s để tránh nội dung Node quá lớn (chi phí bổ sung của base64 cộng với giới hạn tin nhắn).

## Video màn hình macOS (cấp hệ điều hành)

Đối với video _màn hình_ (không phải camera), hãy sử dụng ứng dụng đồng hành trên macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # in đường dẫn đã lưu
```

Yêu cầu quyền **Screen Recording** (TCC) của macOS.

## Liên quan

- [Hỗ trợ hình ảnh và phương tiện](/vi/nodes/images)
- [Nhận hiểu phương tiện](/vi/nodes/media-understanding)
- [Lệnh vị trí](/vi/nodes/location-command)
