---
read_when:
    - Node đã được kết nối nhưng các công cụ camera/canvas/screen/exec gặp lỗi
    - Bạn cần mô hình tư duy giữa ghép nối Node và phê duyệt
summary: Khắc phục sự cố ghép nối Node, yêu cầu chạy ở tiền cảnh, quyền và lỗi công cụ
title: Khắc phục sự cố Node
x-i18n:
    generated_at: "2026-04-29T22:55:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Dùng trang này khi một node hiển thị trong trạng thái nhưng công cụ node không hoạt động.

## Chuỗi lệnh kiểm tra

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó chạy các kiểm tra riêng cho node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Tín hiệu hoạt động bình thường:

- Node đã kết nối và được ghép đôi cho vai trò `node`.
- `nodes describe` bao gồm capability mà bạn đang gọi.
- Phê duyệt exec hiển thị chế độ/allowlist như mong đợi.

## Yêu cầu tiền cảnh

`canvas.*`, `camera.*`, và `screen.*` chỉ hoạt động ở tiền cảnh trên node iOS/Android.

Kiểm tra và khắc phục nhanh:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Nếu bạn thấy `NODE_BACKGROUND_UNAVAILABLE`, đưa ứng dụng node lên tiền cảnh rồi thử lại.

## Ma trận quyền

| Capability                   | iOS                                           | Android                                        | Ứng dụng node macOS            | Mã lỗi thường gặp              |
| ---------------------------- | --------------------------------------------- | ---------------------------------------------- | ------------------------------ | ------------------------------ |
| `camera.snap`, `camera.clip` | Camera (+ mic cho âm thanh clip)              | Camera (+ mic cho âm thanh clip)               | Camera (+ mic cho âm thanh clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Screen Recording (+ mic tùy chọn)             | Lời nhắc chụp màn hình (+ mic tùy chọn)        | Screen Recording               | `*_PERMISSION_REQUIRED`        |
| `location.get`               | While Using hoặc Always (tùy theo chế độ)     | Vị trí tiền cảnh/nền dựa trên chế độ           | Quyền vị trí                   | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | không áp dụng (đường dẫn máy chủ node)        | không áp dụng (đường dẫn máy chủ node)         | Cần phê duyệt exec             | `SYSTEM_RUN_DENIED`            |

## Ghép đôi so với phê duyệt

Đây là các cổng kiểm soát khác nhau:

1. **Ghép đôi thiết bị**: node này có thể kết nối với Gateway không?
2. **Chính sách lệnh node của Gateway**: ID lệnh RPC có được `gateway.nodes.allowCommands` / `denyCommands` và mặc định nền tảng cho phép không?
3. **Phê duyệt exec**: node này có thể chạy một lệnh shell cụ thể cục bộ không?

Kiểm tra nhanh:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Nếu thiếu ghép đôi, hãy phê duyệt thiết bị node trước.
Nếu `nodes describe` thiếu một lệnh, hãy kiểm tra chính sách lệnh node của Gateway và liệu node có thực sự khai báo lệnh đó khi kết nối hay không.
Nếu ghép đôi ổn nhưng `system.run` thất bại, hãy sửa phê duyệt exec/allowlist trên node đó.

Ghép đôi node là cổng danh tính/tin cậy, không phải bề mặt phê duyệt theo từng lệnh. Với `system.run`, chính sách theo node nằm trong tệp phê duyệt exec của node đó (`openclaw approvals get --node ...`), không nằm trong bản ghi ghép đôi của Gateway.

Đối với các lần chạy `host=node` dựa trên phê duyệt, Gateway cũng ràng buộc việc thực thi với
`systemRunPlan` chính tắc đã chuẩn bị. Nếu caller sau đó thay đổi command/cwd hoặc
siêu dữ liệu phiên trước khi lần chạy đã được phê duyệt được chuyển tiếp, Gateway sẽ từ chối
lần chạy vì không khớp phê duyệt thay vì tin tưởng payload đã chỉnh sửa.

## Các mã lỗi node thường gặp

- `NODE_BACKGROUND_UNAVAILABLE` → ứng dụng đang chạy nền; đưa ứng dụng lên tiền cảnh.
- `CAMERA_DISABLED` → nút bật/tắt camera bị tắt trong cài đặt node.
- `*_PERMISSION_REQUIRED` → quyền OS bị thiếu/bị từ chối.
- `LOCATION_DISABLED` → chế độ vị trí đang tắt.
- `LOCATION_PERMISSION_REQUIRED` → chế độ vị trí được yêu cầu chưa được cấp.
- `LOCATION_BACKGROUND_UNAVAILABLE` → ứng dụng đang chạy nền nhưng chỉ có quyền While Using.
- `SYSTEM_RUN_DENIED: approval required` → yêu cầu exec cần phê duyệt rõ ràng.
- `SYSTEM_RUN_DENIED: allowlist miss` → lệnh bị chặn bởi chế độ allowlist.
  Trên máy chủ node Windows, các dạng shell-wrapper như `cmd.exe /c ...` được xem là allowlist miss trong
  chế độ allowlist trừ khi được phê duyệt qua luồng hỏi.

## Vòng khôi phục nhanh

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Nếu vẫn bị kẹt:

- Phê duyệt lại ghép đôi thiết bị.
- Mở lại ứng dụng node (tiền cảnh).
- Cấp lại quyền OS.
- Tạo lại/điều chỉnh chính sách phê duyệt exec.

Liên quan:

- [/nodes/index](/vi/nodes/index)
- [/nodes/camera](/vi/nodes/camera)
- [/nodes/location-command](/vi/nodes/location-command)
- [/tools/exec-approvals](/vi/tools/exec-approvals)
- [/gateway/pairing](/vi/gateway/pairing)

## Liên quan

- [Tổng quan về Nodes](/vi/nodes)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
