---
read_when:
    - Hiểu về danh sách, phiên bản, cài đặt, xuất bản và kiểm duyệt
summary: Cách hoạt động của danh sách ClawHub, phiên bản, lượt cài đặt, việc xuất bản, quét và cập nhật.
x-i18n:
    generated_at: "2026-07-04T20:34:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp registry cho Skills và plugin của OpenClaw. Nó cung cấp cho người dùng một
nơi để khám phá các gói, cung cấp cho nhà phát hành một nơi để phát hành phiên bản, và
cung cấp cho OpenClaw đủ siêu dữ liệu để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi registry

Mỗi mục niêm yết công khai là một bản ghi registry với:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- siêu dữ liệu, tóm tắt, tệp và thông tin ghi nhận nguồn
- changelog và thông tin thẻ như `latest`
- tín hiệu tải xuống, cài đặt và đánh dấu sao
- trạng thái quét bảo mật và kiểm duyệt

Trang niêm yết là nơi chính thức để người dùng kiểm tra một kỹ năng hoặc
plugin tuyên bố làm gì trước khi cài đặt.

## Skills

Một kỹ năng là một gói văn bản có phiên bản xoay quanh `SKILL.md`. Nó có thể bao gồm
các tệp hỗ trợ, ví dụ, mẫu và script.

ClawHub đọc frontmatter của `SKILL.md` để hiểu tên kỹ năng,
mô tả, yêu cầu, biến môi trường và siêu dữ liệu. Siêu dữ liệu chính xác
rất quan trọng vì nó giúp người dùng quyết định có cài đặt kỹ năng hay không và
giúp các lượt quét tự động phát hiện sai lệch giữa hành vi đã khai báo và hành vi quan sát được.

Xem [Định dạng kỹ năng](/vi/clawhub/skill-format).

## Plugin

Plugin là các phần mở rộng OpenClaw được đóng gói. ClawHub lưu trữ siêu dữ liệu gói,
thông tin tương thích, liên kết nguồn, artifact và bản ghi phiên bản.

Khi OpenClaw cài đặt một plugin từ ClawHub, nó kiểm tra siêu dữ liệu tương thích
được quảng bá trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API,
phiên bản Gateway tối thiểu, đích máy chủ, yêu cầu môi trường và
bản tóm lược artifact.

Dùng một nguồn cài đặt ClawHub rõ ràng khi bạn muốn registry là
nguồn sự thật:

```bash
openclaw plugins install clawhub:<package>
```

## Phát hành

Phát hành tạo một bản ghi phiên bản bất biến mới. Nhà phát hành dùng CLI `clawhub`
cho các quy trình registry đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng chạy thử để xem trước payload đã được phân giải trước khi tải lên. Sau đó các trang công khai
hiển thị siêu dữ liệu đã phát hành, tệp, thông tin ghi nhận nguồn và trạng thái quét.

## Cài đặt và cập nhật

Các lệnh cài đặt OpenClaw dùng ClawHub làm nguồn gói:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại siêu dữ liệu nguồn cài đặt để các bản cập nhật có thể phân giải cùng
gói registry đó về sau. CLI ClawHub cũng hỗ trợ các quy trình cài đặt và
cập nhật kỹ năng trực tiếp cho người dùng muốn có các thư mục kỹ năng do registry quản lý bên ngoài một
không gian làm việc OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub mở cho việc phát hành, nhưng các bản phát hành vẫn chịu sự kiểm soát của các cổng tải lên,
kiểm tra tự động, báo cáo người dùng và hành động của người kiểm duyệt.

Các trang công khai hiển thị tóm tắt quét khi có. Nội dung bị giữ lại, ẩn,
hoặc chặn có thể biến mất khỏi tìm kiếm công khai và luồng cài đặt trong khi vẫn
hiển thị với chủ sở hữu để chẩn đoán.

Xem [Bảo mật](/clawhub/security), [Kiểm toán bảo mật](/clawhub/security-audits),
[Kiểm duyệt và an toàn tài khoản](/vi/clawhub/moderation), và
[Mức sử dụng chấp nhận được](/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp các API đọc công khai cho khám phá, tìm kiếm, chi tiết gói và
tải xuống. Catalog của bên thứ ba có thể dùng các API này khi chúng liên kết trở lại
mục niêm yết ClawHub chính thức, tôn trọng giới hạn tốc độ và tránh ngụ ý sự chứng thực.

Xem [API công khai](/vi/clawhub/api) và [API HTTP](/clawhub/http-api).
