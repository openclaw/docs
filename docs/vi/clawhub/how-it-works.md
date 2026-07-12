---
read_when:
    - Tìm hiểu về danh sách, phiên bản, cài đặt, xuất bản và kiểm duyệt
summary: Cách hoạt động của danh sách, phiên bản, lượt cài đặt, quy trình phát hành, quét và cập nhật trên ClawHub.
x-i18n:
    generated_at: "2026-07-12T07:45:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp registry cho Skills và plugin của OpenClaw. Nền tảng này cung cấp cho người dùng một nơi để khám phá các gói, cho nhà phát hành một nơi để phát hành phiên bản và cung cấp cho OpenClaw đủ siêu dữ liệu để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi registry

Mỗi mục niêm yết công khai là một bản ghi registry gồm:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- siêu dữ liệu, nội dung tóm tắt, tệp và thông tin ghi nhận nguồn
- thông tin nhật ký thay đổi và thẻ như `latest`
- các tín hiệu về lượt tải xuống, lượt cài đặt và lượt đánh dấu sao
- trạng thái quét bảo mật và kiểm duyệt

Trang niêm yết là nơi chính thức để người dùng xem xét chức năng mà một skill hoặc plugin tuyên bố thực hiện trước khi cài đặt.

## Skills

Một skill là một gói văn bản có phiên bản, xoay quanh `SKILL.md`. Gói này có thể bao gồm các tệp hỗ trợ, ví dụ, mẫu và tập lệnh.

ClawHub đọc frontmatter của `SKILL.md` để xác định tên, mô tả, yêu cầu, biến môi trường và siêu dữ liệu của skill. Siêu dữ liệu chính xác rất quan trọng vì giúp người dùng quyết định có nên cài đặt skill hay không, đồng thời giúp các quá trình quét tự động phát hiện sự không khớp giữa hành vi được khai báo và hành vi quan sát được.

Xem [Định dạng skill](/clawhub/skill-format).

## Plugin

Plugin là các tiện ích mở rộng OpenClaw được đóng gói. ClawHub lưu trữ siêu dữ liệu gói, thông tin tương thích, liên kết nguồn, hiện vật và bản ghi phiên bản.

Khi OpenClaw cài đặt một plugin từ ClawHub, hệ thống sẽ kiểm tra siêu dữ liệu tương thích được công bố trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API, phiên bản Gateway tối thiểu, nền tảng máy chủ đích, yêu cầu môi trường và mã băm hiện vật.

Hãy sử dụng nguồn cài đặt ClawHub tường minh khi bạn muốn registry là nguồn dữ liệu chính thức:

```bash
openclaw plugins install clawhub:<package>
```

## Phát hành

Việc phát hành tạo ra một bản ghi phiên bản mới không thể thay đổi. Nhà phát hành sử dụng CLI `clawhub` cho các quy trình registry đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Hãy sử dụng chế độ chạy thử để xem trước tải dữ liệu đã được phân giải trước khi tải lên. Sau đó, các trang công khai sẽ hiển thị siêu dữ liệu, tệp, thông tin ghi nhận nguồn và trạng thái quét đã phát hành.

## Cài đặt và cập nhật

Các lệnh cài đặt của OpenClaw sử dụng ClawHub làm nguồn gói:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại siêu dữ liệu nguồn cài đặt để các lần cập nhật sau có thể phân giải cùng một gói registry. CLI ClawHub cũng hỗ trợ các quy trình cài đặt và cập nhật skill trực tiếp dành cho người dùng muốn có các thư mục skill do registry quản lý bên ngoài một không gian làm việc OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub cho phép mọi người phát hành, nhưng các bản phát hành vẫn phải tuân theo các cổng kiểm soát tải lên, kiểm tra tự động, báo cáo của người dùng và hành động của người kiểm duyệt.

Các trang công khai hiển thị bản tóm tắt kết quả quét khi có. Nội dung bị tạm giữ, ẩn hoặc chặn có thể biến mất khỏi kết quả tìm kiếm công khai và quy trình cài đặt, nhưng vẫn hiển thị với chủ sở hữu để chẩn đoán.

Xem [Bảo mật](/vi/clawhub/security), [Kiểm toán bảo mật](/clawhub/security-audits), [Kiểm duyệt và an toàn tài khoản](/vi/clawhub/moderation) và [Quy định sử dụng được chấp nhận](/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp các API đọc công khai để khám phá, tìm kiếm, xem thông tin chi tiết về gói và tải xuống. Các danh mục của bên thứ ba có thể sử dụng những API này khi liên kết trở lại mục niêm yết ClawHub chính thức, tuân thủ giới hạn tốc độ và tránh ngụ ý rằng họ được chứng thực.

Xem [API công khai](/clawhub/api) và [API HTTP](/clawhub/http-api).
