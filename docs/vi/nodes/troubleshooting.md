---
read_when:
    - Node đã được kết nối nhưng các công cụ camera/canvas/screen/exec không hoạt động
    - Bạn cần hiểu mô hình tư duy về việc ghép cặp Node so với phê duyệt
summary: Khắc phục sự cố ghép đôi Node, yêu cầu chạy ở nền trước, quyền và lỗi công cụ
title: Khắc phục sự cố Node
x-i18n:
    generated_at: "2026-07-12T08:04:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Hãy dùng trang này khi một Node hiển thị trong trạng thái nhưng các công cụ của Node không hoạt động.

## Trình tự lệnh

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó, chạy các bước kiểm tra dành riêng cho Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Các dấu hiệu hoạt động bình thường:

- Node đã kết nối và ghép đôi cho vai trò `node`.
- `nodes describe` bao gồm khả năng mà bạn đang gọi.
- Phê duyệt thực thi hiển thị chế độ/danh sách cho phép như mong đợi.

## Yêu cầu chạy ở nền trước

`canvas.*`, `camera.*` và `screen.*` chỉ hoạt động ở nền trước trên các Node iOS/Android.

Kiểm tra và khắc phục nhanh:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Nếu thấy `NODE_BACKGROUND_UNAVAILABLE`, hãy đưa ứng dụng Node lên nền trước rồi thử lại.

## Ma trận quyền

| Khả năng                      | iOS                                               | Android                                                | Ứng dụng Node trên macOS                   | Mã lỗi thường gặp                             |
| ---------------------------- | ------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------- | --------------------------------------------- |
| `camera.snap`, `camera.clip` | Camera (+ micrô cho âm thanh của đoạn video)      | Camera (+ micrô cho âm thanh của đoạn video)           | Camera (+ micrô cho âm thanh đoạn video)    | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | Ghi màn hình (+ micrô tùy chọn)                   | Lời nhắc chụp màn hình (+ micrô tùy chọn)              | Ghi màn hình                                | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | không áp dụng                                     | không áp dụng                                          | Trợ năng + Ghi màn hình                     | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | Khi sử dụng hoặc Luôn luôn (tùy thuộc chế độ)     | Vị trí nền trước/nền sau tùy theo chế độ               | Quyền truy cập vị trí                       | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | không áp dụng (đường dẫn máy chủ Node)            | không áp dụng (đường dẫn máy chủ Node)                 | Cần phê duyệt thực thi                      | `SYSTEM_RUN_DENIED`                           |

## Ghép đôi và phê duyệt

Ba cổng riêng biệt kiểm soát việc một lệnh Node có thành công hay không:

1. **Ghép đôi thiết bị**: Node này có thể kết nối với Gateway không?
2. **Chính sách lệnh Node của Gateway**: mã lệnh RPC có được `gateway.nodes.allowCommands` / `denyCommands` và các giá trị mặc định của nền tảng cho phép không?
3. **Phê duyệt thực thi**: Node này có thể chạy cục bộ một lệnh shell cụ thể không?

Ghép đôi Node là một cổng danh tính/tin cậy, không phải giao diện phê duyệt cho từng lệnh. Đối với `system.run`, chính sách của từng Node nằm trong tệp phê duyệt thực thi của Node đó (`openclaw approvals get --node ...`), không nằm trong bản ghi ghép đôi của Gateway.

Kiểm tra nhanh:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Thiếu ghép đôi: trước tiên hãy phê duyệt thiết bị Node.
- `nodes describe` thiếu một lệnh: hãy kiểm tra chính sách lệnh Node của Gateway và liệu Node có thực sự khai báo lệnh đó khi kết nối hay không.
- Ghép đôi bình thường nhưng `system.run` thất bại: hãy sửa phê duyệt thực thi/danh sách cho phép trên Node đó.

Đối với các lần chạy `host=node` dựa trên phê duyệt, Gateway cũng ràng buộc việc thực thi với `systemRunPlan` chuẩn đã được chuẩn bị. Nếu một bên gọi sau đó sửa đổi lệnh, thư mục làm việc hoặc siêu dữ liệu phiên trước khi lần chạy đã được phê duyệt được chuyển tiếp, Gateway sẽ từ chối lần chạy do phê duyệt không khớp thay vì tin cậy tải trọng đã chỉnh sửa.

## Các mã lỗi Node phổ biến

| Mã                                     | Ý nghĩa                                                                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | Ứng dụng đang chạy ở nền sau; hãy đưa ứng dụng lên nền trước.                                                                                                                                                             |
| `CAMERA_DISABLED`                      | Nút bật/tắt Camera bị tắt trong cài đặt Node.                                                                                                                                                                             |
| `*_PERMISSION_REQUIRED`                | Quyền của hệ điều hành bị thiếu/bị từ chối.                                                                                                                                                                               |
| `LOCATION_DISABLED`                    | Chế độ vị trí đang tắt.                                                                                                                                                                                                   |
| `LOCATION_PERMISSION_REQUIRED`         | Chế độ vị trí được yêu cầu chưa được cấp quyền.                                                                                                                                                                           |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | Ứng dụng đang chạy ở nền sau nhưng chỉ có quyền Khi sử dụng.                                                                                                                                                              |
| `COMPUTER_DISABLED`                    | Bật **Allow Computer Control** trong ứng dụng macOS, sau đó phê duyệt bản cập nhật ghép đôi.                                                                                                                              |
| `ACCESSIBILITY_REQUIRED`               | Cấp quyền Trợ năng cho gói ứng dụng OpenClaw hiện tại trong phần Cài đặt hệ thống của macOS.                                                                                                                              |
| `SYSTEM_RUN_DENIED: approval required` | Yêu cầu thực thi cần được phê duyệt rõ ràng.                                                                                                                                                                              |
| `SYSTEM_RUN_DENIED: allowlist miss`    | Lệnh bị chặn bởi chế độ danh sách cho phép. Trên các máy chủ Node Windows, các dạng trình bao shell như `cmd.exe /c ...` được xem là không khớp danh sách cho phép trong chế độ danh sách cho phép, trừ khi được phê duyệt qua luồng yêu cầu. |

## Vòng lặp khôi phục nhanh

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Nếu vẫn gặp sự cố:

- Phê duyệt lại việc ghép đôi thiết bị.
- Mở lại ứng dụng Node (ở nền trước).
- Cấp lại quyền của hệ điều hành.
- Tạo lại/điều chỉnh chính sách phê duyệt thực thi.

Đối với điều khiển máy tính, cũng hãy xác minh rằng một tác nhân có khả năng thị giác cung cấp công cụ `computer`, `screen.snapshot` thành công khi có quyền Ghi màn hình và `/phone status` hiển thị quyền Gateway tạm thời hoặc lâu dài mà bạn dự định sử dụng. Một mục trong `gateway.nodes.denyCommands` luôn ghi đè `allowCommands`.

## Liên quan

- [Tổng quan về Node](/vi/nodes)
- [Node Camera](/vi/nodes/camera)
- [Lệnh vị trí](/vi/nodes/location-command)
- [Sử dụng máy tính](/vi/nodes/computer-use)
- [Phê duyệt thực thi](/vi/tools/exec-approvals)
- [Ghép đôi Gateway](/vi/gateway/pairing)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)
- [Khắc phục sự cố kênh](/vi/channels/troubleshooting)
