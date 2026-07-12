---
read_when:
    - Cập nhật ánh xạ mã định danh mẫu thiết bị hoặc các tệp NOTICE/giấy phép
    - Thay đổi cách giao diện Phiên bản hiển thị tên thiết bị
summary: Cách OpenClaw tích hợp danh sách mã định danh kiểu máy Apple để hiển thị tên dễ đọc trong ứng dụng macOS.
title: Cơ sở dữ liệu mẫu thiết bị
x-i18n:
    generated_at: "2026-07-12T08:20:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

Giao diện người dùng **Instances** của ứng dụng đồng hành trên macOS ánh xạ các mã định danh kiểu máy Apple sang tên dễ nhận biết (`iPad16,6` -> "iPad Pro 13 inch (M4)", `Mac16,6` -> "MacBook Pro (14 inch, 2024)"). `DeviceModelCatalog` cũng sử dụng tiền tố mã định danh (và dùng họ thiết bị làm phương án dự phòng) để chọn một SF Symbol cho mỗi thiết bị.

Các tệp trong `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| Tệp                                    | Mục đích                                  |
| -------------------------------------- | ----------------------------------------- |
| `ios-device-identifiers.json`          | Ánh xạ mã định danh iOS/iPadOS -> tên     |
| `mac-device-identifiers.json`          | Ánh xạ mã định danh Mac -> tên            |
| `NOTICE.md`                            | Các SHA commit thượng nguồn được cố định  |
| `LICENSE.apple-device-identifiers.txt` | Giấy phép MIT của dự án thượng nguồn      |

## Nguồn dữ liệu

Được đưa vào dự án từ kho lưu trữ GitHub `kyle-seongwoo-jun/apple-device-identifiers` có giấy phép MIT. Các tệp JSON được cố định theo các SHA commit ghi trong `NOTICE.md` để bảo đảm các bản dựng có tính xác định.

## Cập nhật cơ sở dữ liệu

1. Chọn các SHA commit thượng nguồn cần cố định (một cho iOS và một cho macOS).
2. Cập nhật `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` bằng các SHA mới.
3. Tải lại các tệp JSON được cố định theo những commit đó:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Xác nhận `LICENSE.apple-device-identifiers.txt` vẫn khớp với bản thượng nguồn; thay thế tệp nếu giấy phép thượng nguồn đã thay đổi.
5. Xác minh ứng dụng macOS được dựng thành công và không có lỗi:

```bash
swift build --package-path apps/macos
```

## Liên quan

- [Node](/vi/nodes)
- [Khắc phục sự cố Node](/vi/nodes/troubleshooting)
