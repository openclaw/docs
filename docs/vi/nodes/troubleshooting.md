---
read_when:
    - Node đã kết nối nhưng các công cụ camera/canvas/screen/exec không hoạt động
    - Bạn cần mô hình tư duy về ghép nối Node so với phê duyệt
summary: Khắc phục sự cố ghép nối Node, yêu cầu chạy ở nền trước, quyền và lỗi công cụ
title: Khắc phục sự cố Node
x-i18n:
    generated_at: "2026-05-10T19:40:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Dùng trang này khi một Node hiển thị trong trạng thái nhưng công cụ Node bị lỗi.

## Thang lệnh

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó chạy các bước kiểm tra dành riêng cho Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Tín hiệu khỏe mạnh:

- Node đã kết nối và được ghép nối cho vai trò `node`.
- `nodes describe` bao gồm năng lực bạn đang gọi.
- Phê duyệt exec hiển thị chế độ/danh sách cho phép như mong đợi.

## Yêu cầu chạy nền trước

`canvas.*`, `camera.*`, và `screen.*` chỉ hoạt động ở nền trước trên các Node iOS/Android.

Kiểm tra và sửa nhanh:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Nếu bạn thấy `NODE_BACKGROUND_UNAVAILABLE`, đưa ứng dụng Node ra nền trước rồi thử lại.

## Ma trận quyền

| Năng lực                     | iOS                                              | Android                                           | Ứng dụng Node macOS           | Mã lỗi thường gặp              |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Camera (+ mic cho âm thanh clip)                 | Camera (+ mic cho âm thanh clip)                  | Camera (+ mic cho âm thanh clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Screen Recording (+ mic tùy chọn)                | Lời nhắc chụp màn hình (+ mic tùy chọn)           | Screen Recording              | `*_PERMISSION_REQUIRED`        |
| `location.get`               | While Using hoặc Always (tùy chế độ)             | Vị trí nền trước/nền sau dựa trên chế độ          | Quyền vị trí                  | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (đường dẫn máy chủ Node)                     | n/a (đường dẫn máy chủ Node)                      | Cần phê duyệt exec            | `SYSTEM_RUN_DENIED`            |

## Ghép nối so với phê duyệt

Đây là các cổng khác nhau:

1. **Ghép nối thiết bị**: Node này có thể kết nối tới Gateway không?
2. **Chính sách lệnh Node của Gateway**: ID lệnh RPC có được cho phép bởi `gateway.nodes.allowCommands` / `denyCommands` và mặc định nền tảng không?
3. **Phê duyệt exec**: Node này có thể chạy một lệnh shell cụ thể cục bộ không?

Kiểm tra nhanh:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Nếu thiếu ghép nối, hãy phê duyệt thiết bị Node trước.
Nếu `nodes describe` thiếu một lệnh, hãy kiểm tra chính sách lệnh Node của Gateway và liệu Node có thực sự khai báo lệnh đó khi kết nối hay không.
Nếu ghép nối ổn nhưng `system.run` bị lỗi, hãy sửa phê duyệt exec/danh sách cho phép trên Node đó.

Ghép nối Node là cổng danh tính/tin cậy, không phải bề mặt phê duyệt theo từng lệnh. Đối với `system.run`, chính sách theo từng Node nằm trong tệp phê duyệt exec của Node đó (`openclaw approvals get --node ...`), không nằm trong bản ghi ghép nối Gateway.

Đối với các lần chạy `host=node` được hỗ trợ bằng phê duyệt, Gateway cũng ràng buộc việc thực thi với
`systemRunPlan` chính tắc đã chuẩn bị. Nếu một bên gọi sau đó thay đổi command/cwd hoặc
siêu dữ liệu phiên trước khi lần chạy đã phê duyệt được chuyển tiếp, Gateway sẽ từ chối
lần chạy đó như một lỗi không khớp phê duyệt thay vì tin tưởng payload đã chỉnh sửa.

## Mã lỗi Node thường gặp

- `NODE_BACKGROUND_UNAVAILABLE` → ứng dụng đang ở nền sau; đưa ứng dụng ra nền trước.
- `CAMERA_DISABLED` → nút bật/tắt camera bị tắt trong cài đặt Node.
- `*_PERMISSION_REQUIRED` → thiếu/bị từ chối quyền hệ điều hành.
- `LOCATION_DISABLED` → chế độ vị trí đang tắt.
- `LOCATION_PERMISSION_REQUIRED` → chế độ vị trí được yêu cầu chưa được cấp.
- `LOCATION_BACKGROUND_UNAVAILABLE` → ứng dụng đang ở nền sau nhưng chỉ có quyền While Using.
- `SYSTEM_RUN_DENIED: approval required` → yêu cầu exec cần phê duyệt rõ ràng.
- `SYSTEM_RUN_DENIED: allowlist miss` → lệnh bị chặn bởi chế độ danh sách cho phép.
  Trên các máy chủ Node Windows, các dạng shell-wrapper như `cmd.exe /c ...` được xử lý là lỗi không khớp danh sách cho phép trong
  chế độ danh sách cho phép trừ khi được phê duyệt qua luồng hỏi.

## Vòng lặp khôi phục nhanh

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Nếu vẫn bị kẹt:

- Phê duyệt lại ghép nối thiết bị.
- Mở lại ứng dụng Node (nền trước).
- Cấp lại quyền hệ điều hành.
- Tạo lại/điều chỉnh chính sách phê duyệt exec.

## Liên quan

- [Tổng quan về Node](/vi/nodes)
- [Node camera](/vi/nodes/camera)
- [Lệnh vị trí](/vi/nodes/location-command)
- [Phê duyệt exec](/vi/tools/exec-approvals)
- [Ghép nối Gateway](/vi/gateway/pairing)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
