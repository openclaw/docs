---
doc-schema-version: 1
read_when:
    - Bạn muốn tìm các Plugin OpenClaw của bên thứ ba
    - Bạn muốn phát hành hoặc liệt kê Plugin của riêng mình trên ClawHub
summary: Tìm và phát hành các plugin OpenClaw do cộng đồng duy trì
title: Plugin cộng đồng
x-i18n:
    generated_at: "2026-06-27T17:45:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

Plugin cộng đồng là các gói của bên thứ ba mở rộng OpenClaw bằng các kênh,
công cụ, nhà cung cấp, hook hoặc các năng lực khác. Sử dụng [ClawHub](/vi/clawhub) làm bề mặt khám phá
chính cho các Plugin cộng đồng công khai.

## Tìm Plugin

Tìm kiếm ClawHub từ CLI:

```bash
openclaw plugins search "calendar"
```

Cài đặt một Plugin ClawHub với tiền tố nguồn rõ ràng:

```bash
openclaw plugins install clawhub:<package-name>
```

npm vẫn là một đường dẫn cài đặt trực tiếp được hỗ trợ trong giai đoạn chuyển đổi ra mắt:

```bash
openclaw plugins install npm:<package-name>
```

Sử dụng [Quản lý Plugin](/vi/plugins/manage-plugins) để xem các ví dụ phổ biến về cài đặt, cập nhật,
kiểm tra và gỡ cài đặt. Sử dụng [`openclaw plugins`](/vi/cli/plugins) để xem
tham chiếu lệnh đầy đủ và các quy tắc chọn nguồn.

## Xuất bản Plugin

Xuất bản Plugin cộng đồng công khai trên ClawHub khi bạn muốn người dùng OpenClaw
khám phá và cài đặt chúng. ClawHub sở hữu danh sách gói trực tiếp, lịch sử phát hành,
trạng thái quét và gợi ý cài đặt; tài liệu không duy trì danh mục
Plugin bên thứ ba tĩnh.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Trước khi xuất bản, hãy bảo đảm Plugin có siêu dữ liệu gói, manifest Plugin,
tài liệu thiết lập và chủ sở hữu bảo trì rõ ràng. ClawHub xác thực phạm vi chủ sở hữu,
tên gói, phiên bản, giới hạn tệp và siêu dữ liệu nguồn trước khi tạo
bản phát hành, sau đó giữ các bản phát hành mới ẩn khỏi các bề mặt cài đặt và tải xuống
thông thường cho đến khi hoàn tất đánh giá và xác minh.

Sử dụng danh sách kiểm tra này trước khi bạn xuất bản:

| Yêu cầu              | Lý do                                                 |
| -------------------- | --------------------------------------------------- |
| Được xuất bản trên ClawHub | Người dùng cần gợi ý `openclaw plugins install` hoạt động |
| Kho GitHub công khai | Đánh giá mã nguồn, theo dõi vấn đề, tính minh bạch         |
| Tài liệu thiết lập và sử dụng | Người dùng cần biết cách cấu hình nó              |
| Bảo trì tích cực     | Cập nhật gần đây hoặc xử lý vấn đề nhanh chóng         |

Sử dụng các trang này để xem hợp đồng xuất bản đầy đủ:

- [Xuất bản ClawHub](/vi/clawhub/publishing) giải thích về chủ sở hữu, phạm vi, bản phát hành,
  đánh giá, xác thực gói và chuyển nhượng gói.
- [Xây dựng Plugin](/vi/plugins/building-plugins) trình bày hình dạng gói Plugin
  và quy trình xuất bản đầu tiên.
- [Manifest Plugin](/vi/plugins/manifest) định nghĩa các trường manifest Plugin gốc.

## Liên quan

- [Plugin](/vi/tools/plugin) - cài đặt, cấu hình, khởi động lại và khắc phục sự cố
- [Quản lý Plugin](/vi/plugins/manage-plugins) - ví dụ lệnh
- [Xuất bản ClawHub](/vi/clawhub/publishing) - quy tắc xuất bản và phát hành
