---
read_when:
    - Cập nhật ánh xạ mã định danh kiểu máy thiết bị hoặc các tệp NOTICE/giấy phép
    - Thay đổi cách giao diện Thực thể hiển thị tên thiết bị
summary: Cách OpenClaw đưa kèm các mã định danh mẫu thiết bị Apple để hiển thị tên thân thiện trong ứng dụng macOS.
title: Cơ sở dữ liệu mẫu thiết bị
x-i18n:
    generated_at: "2026-04-29T23:11:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 16
---

Ứng dụng đồng hành macOS hiển thị tên mẫu thiết bị Apple thân thiện trong UI **Phiên bản** bằng cách ánh xạ định danh mẫu Apple (ví dụ: `iPad16,6`, `Mac16,6`) sang tên dễ đọc.

Ánh xạ này được đưa vào mã nguồn dưới dạng JSON tại:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Nguồn dữ liệu

Hiện chúng tôi đưa ánh xạ này vào mã nguồn từ kho lưu trữ được cấp phép MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Để giữ cho các bản dựng có tính xác định, các tệp JSON được ghim vào các commit upstream cụ thể (được ghi trong `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Cập nhật cơ sở dữ liệu

1. Chọn các commit upstream mà bạn muốn ghim vào (một cho iOS, một cho macOS).
2. Cập nhật các hash commit trong `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Tải lại các tệp JSON, được ghim vào các commit đó:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Đảm bảo `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` vẫn khớp với upstream (thay thế nếu giấy phép upstream thay đổi).
5. Xác minh ứng dụng macOS dựng sạch sẽ (không có cảnh báo):

```bash
swift build --package-path apps/macos
```

## Liên quan

- [Node](/vi/nodes)
- [Khắc phục sự cố Node](/vi/nodes/troubleshooting)
