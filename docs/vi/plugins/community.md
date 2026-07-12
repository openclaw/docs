---
doc-schema-version: 1
read_when:
    - Bạn muốn tìm các plugin OpenClaw của bên thứ ba
    - Bạn muốn phát hành hoặc niêm yết Plugin của riêng mình trên ClawHub
summary: Tìm và xuất bản các plugin OpenClaw do cộng đồng duy trì
title: Plugin cộng đồng
x-i18n:
    generated_at: "2026-07-12T08:07:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

Các Plugin cộng đồng là những gói của bên thứ ba giúp mở rộng OpenClaw với
các kênh, công cụ, nhà cung cấp, hook hoặc những khả năng khác. Hãy sử dụng
[ClawHub](/clawhub) làm nơi chính để khám phá các Plugin cộng đồng công khai.

## Tìm Plugin

Tìm kiếm trên ClawHub từ CLI:

```bash
openclaw plugins search "calendar"
```

Cài đặt một Plugin ClawHub bằng tiền tố nguồn rõ ràng:

```bash
openclaw plugins install clawhub:<package-name>
```

npm vẫn là phương thức cài đặt trực tiếp được hỗ trợ trong giai đoạn chuyển đổi khi ra mắt:

```bash
openclaw plugins install npm:<package-name>
```

Xem [Quản lý Plugin](/vi/plugins/manage-plugins) để biết các ví dụ phổ biến về cài đặt, cập nhật,
kiểm tra và gỡ cài đặt. Xem [`openclaw plugins`](/vi/cli/plugins) để biết
tài liệu tham khảo đầy đủ về lệnh và các quy tắc chọn nguồn.

## Phát hành Plugin

Phát hành các Plugin cộng đồng công khai trên ClawHub để người dùng OpenClaw có thể khám phá
và cài đặt chúng. ClawHub quản lý danh sách gói đang hoạt động, lịch sử phát hành,
trạng thái quét và hướng dẫn cài đặt; tài liệu không duy trì danh mục
Plugin tĩnh của bên thứ ba.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Trước khi phát hành, hãy bảo đảm Plugin có siêu dữ liệu gói, bản kê khai Plugin,
tài liệu thiết lập và chủ thể bảo trì được xác định rõ ràng. ClawHub xác thực phạm vi
của chủ sở hữu, tên gói, phiên bản, giới hạn tệp và siêu dữ liệu nguồn trước khi
tạo bản phát hành, sau đó ẩn các bản phát hành mới khỏi những nơi cài đặt và
tải xuống thông thường cho đến khi hoàn tất quy trình đánh giá và xác minh.

Danh sách kiểm tra trước khi phát hành:

| Yêu cầu                  | Lý do                                                        |
| ------------------------ | ------------------------------------------------------------ |
| Được phát hành trên ClawHub | Người dùng cần hướng dẫn `openclaw plugins install` hoạt động |
| Kho GitHub công khai     | Đánh giá mã nguồn, theo dõi vấn đề và bảo đảm tính minh bạch |
| Tài liệu thiết lập và sử dụng | Người dùng cần biết cách cấu hình Plugin                  |
| Bảo trì tích cực         | Có cập nhật gần đây hoặc xử lý vấn đề kịp thời               |

Quy ước phát hành đầy đủ:

- [Phát hành trên ClawHub](/vi/clawhub/publishing) - chủ sở hữu, phạm vi, bản phát hành,
  quy trình đánh giá, xác thực gói và chuyển giao gói
- [Xây dựng Plugin](/vi/plugins/building-plugins) - cấu trúc gói Plugin
  và quy trình phát hành lần đầu
- [Bản kê khai Plugin](/vi/plugins/manifest) - các trường trong bản kê khai Plugin gốc

## Nội dung liên quan

- [Plugin](/vi/tools/plugin) - cài đặt, cấu hình, khởi động lại và khắc phục sự cố
- [Quản lý Plugin](/vi/plugins/manage-plugins) - các ví dụ về lệnh
- [Phát hành trên ClawHub](/vi/clawhub/publishing) - các quy tắc phát hành và tạo bản phát hành
