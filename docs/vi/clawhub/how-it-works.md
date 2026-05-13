---
read_when:
    - Tìm hiểu về danh sách, phiên bản, lượt cài đặt, xuất bản và kiểm duyệt
summary: Cách hoạt động của các mục niêm yết, phiên bản, lượt cài đặt, việc xuất bản, quét và cập nhật trên ClawHub.
x-i18n:
    generated_at: "2026-05-13T04:17:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp registry cho Skills và Plugin của OpenClaw. Nó cung cấp cho người dùng
một nơi để khám phá các gói, cung cấp cho nhà xuất bản một nơi để phát hành phiên bản, và
cung cấp cho OpenClaw đủ siêu dữ liệu để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi registry

Mỗi mục niêm yết công khai là một bản ghi registry có:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- siêu dữ liệu, tóm tắt, tệp và thông tin ghi nhận nguồn
- changelog và thông tin thẻ như `latest`
- tín hiệu tải xuống, cài đặt, đánh dấu sao và bình luận
- trạng thái quét bảo mật và kiểm duyệt

Trang niêm yết là nơi chính thức để người dùng kiểm tra một Skill hoặc
Plugin tuyên bố sẽ làm gì trước khi cài đặt.

## Skills

Một Skill là một gói văn bản có phiên bản, xoay quanh `SKILL.md`. Nó có thể bao gồm
các tệp hỗ trợ, ví dụ, mẫu và script.

ClawHub đọc frontmatter của `SKILL.md` để hiểu tên Skill,
mô tả, yêu cầu, biến môi trường và siêu dữ liệu. Siêu dữ liệu chính xác
rất quan trọng vì nó giúp người dùng quyết định có cài đặt Skill hay không và
giúp các quá trình quét tự động phát hiện sự không khớp giữa hành vi đã khai báo và hành vi quan sát được.

Xem [Định dạng Skill](/vi/clawhub/skill-format).

## Plugin

Plugin là các tiện ích mở rộng OpenClaw được đóng gói. ClawHub lưu trữ siêu dữ liệu gói,
thông tin tương thích, liên kết nguồn, artifact và bản ghi phiên bản.

Khi OpenClaw cài đặt một Plugin từ ClawHub, nó kiểm tra siêu dữ liệu tương thích
đã công bố trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API,
phiên bản Gateway tối thiểu, mục tiêu host, yêu cầu môi trường và
digest artifact.

Sử dụng nguồn cài đặt ClawHub rõ ràng khi bạn muốn registry là
nguồn chân lý:

```bash
openclaw plugins install clawhub:<package>
```

## Xuất bản

Việc xuất bản tạo một bản ghi phiên bản mới bất biến. Nhà xuất bản sử dụng CLI `clawhub`
cho các quy trình registry đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Sử dụng chạy thử để xem trước payload đã phân giải trước khi tải lên. Sau đó, các trang công khai
hiển thị siêu dữ liệu đã xuất bản, tệp, thông tin ghi nhận nguồn và trạng thái quét.

## Cài đặt và cập nhật

Các lệnh cài đặt OpenClaw sử dụng ClawHub làm nguồn gói:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại siêu dữ liệu nguồn cài đặt để các bản cập nhật có thể phân giải cùng
gói registry đó về sau. CLI ClawHub cũng hỗ trợ các quy trình cài đặt và
cập nhật Skill trực tiếp cho người dùng muốn các thư mục Skill do registry quản lý bên ngoài một
workspace OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub mở cho việc xuất bản, nhưng các bản phát hành vẫn chịu sự chi phối của cổng tải lên,
kiểm tra tự động, báo cáo của người dùng và hành động của người kiểm duyệt.

Các trang công khai hiển thị tóm tắt quét khi có. Nội dung bị giữ lại, ẩn,
hoặc chặn có thể biến mất khỏi tìm kiếm công khai và luồng cài đặt trong khi vẫn
hiển thị với chủ sở hữu để chẩn đoán.

Xem [Bảo mật + kiểm duyệt](/vi/clawhub/security) và
[Mức sử dụng chấp nhận được](/vi/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp API đọc công khai cho khám phá, tìm kiếm, chi tiết gói và
tải xuống. Các catalog của bên thứ ba có thể sử dụng các API này khi chúng liên kết trở lại
mục niêm yết ClawHub chính thức, tôn trọng giới hạn tốc độ và tránh ngụ ý sự chứng thực.

Xem [API công khai](/vi/clawhub/api) và [API HTTP](/vi/clawhub/http-api).
