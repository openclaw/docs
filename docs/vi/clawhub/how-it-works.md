---
read_when:
    - Hiểu về danh sách, phiên bản, cài đặt, xuất bản và kiểm duyệt
summary: Cách các mục niêm yết, phiên bản, lượt cài đặt, phát hành, quét và cập nhật của ClawHub hoạt động.
x-i18n:
    generated_at: "2026-06-28T20:40:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp sổ đăng ký cho Skills và Plugin của OpenClaw. Nó cung cấp cho người dùng một nơi để khám phá các gói, cung cấp cho nhà xuất bản một nơi để phát hành phiên bản, và cung cấp cho OpenClaw đủ siêu dữ liệu để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi sổ đăng ký

Mỗi danh sách công khai là một bản ghi sổ đăng ký với:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã xuất bản
- siêu dữ liệu, tóm tắt, tệp và ghi nhận nguồn
- nhật ký thay đổi và thông tin thẻ như `latest`
- tín hiệu tải xuống, cài đặt và sao
- trạng thái quét bảo mật và kiểm duyệt

Trang danh sách là nơi chính thức để người dùng kiểm tra một Skill hoặc Plugin tuyên bố làm gì trước khi cài đặt.

## Skills

Skill là một gói văn bản có phiên bản, xoay quanh `SKILL.md`. Nó có thể bao gồm các tệp hỗ trợ, ví dụ, mẫu và script.

ClawHub đọc frontmatter của `SKILL.md` để hiểu tên Skill, mô tả, yêu cầu, biến môi trường và siêu dữ liệu. Siêu dữ liệu chính xác rất quan trọng vì nó giúp người dùng quyết định có cài đặt Skill hay không và giúp các lượt quét tự động phát hiện điểm không khớp giữa hành vi được khai báo và hành vi quan sát được.

Xem [Định dạng Skill](/vi/clawhub/skill-format).

## Plugin

Plugin là các tiện ích mở rộng OpenClaw được đóng gói. ClawHub lưu trữ siêu dữ liệu gói, thông tin tương thích, liên kết nguồn, artifact và bản ghi phiên bản.

Khi OpenClaw cài đặt một Plugin từ ClawHub, nó kiểm tra siêu dữ liệu tương thích được công bố trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API, phiên bản Gateway tối thiểu, mục tiêu máy chủ, yêu cầu môi trường và digest artifact.

Dùng nguồn cài đặt ClawHub rõ ràng khi bạn muốn sổ đăng ký là nguồn sự thật:

```bash
openclaw plugins install clawhub:<package>
```

## Xuất bản

Việc xuất bản tạo một bản ghi phiên bản bất biến mới. Nhà xuất bản dùng CLI `clawhub` cho các quy trình sổ đăng ký đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng chạy thử để xem trước payload đã phân giải trước khi tải lên. Sau đó, các trang công khai hiển thị siêu dữ liệu đã xuất bản, tệp, ghi nhận nguồn và trạng thái quét.

## Cài đặt và cập nhật

Các lệnh cài đặt của OpenClaw dùng ClawHub làm nguồn gói:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại siêu dữ liệu nguồn cài đặt để các lần cập nhật sau có thể phân giải cùng gói sổ đăng ký. CLI ClawHub cũng hỗ trợ các quy trình cài đặt và cập nhật Skill trực tiếp cho người dùng muốn có thư mục Skill do sổ đăng ký quản lý bên ngoài một workspace OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub mở cho việc xuất bản, nhưng các bản phát hành vẫn chịu sự chi phối của cổng tải lên, kiểm tra tự động, báo cáo người dùng và hành động của người kiểm duyệt.

Các trang công khai hiển thị tóm tắt quét khi có. Nội dung bị giữ lại, ẩn hoặc chặn có thể biến mất khỏi tìm kiếm công khai và luồng cài đặt, trong khi vẫn hiển thị với chủ sở hữu để chẩn đoán.

Xem [Bảo mật](/vi/clawhub/security), [Kiểm toán bảo mật](/vi/clawhub/security-audits), [Kiểm duyệt và an toàn tài khoản](/vi/clawhub/moderation), và [Mức sử dụng chấp nhận được](/vi/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp các API đọc công khai cho khám phá, tìm kiếm, chi tiết gói và tải xuống. Các catalog bên thứ ba có thể dùng các API này khi họ liên kết lại danh sách ClawHub chính thức, tôn trọng giới hạn tốc độ và tránh ngụ ý sự chứng thực.

Xem [API công khai](/vi/clawhub/api) và [API HTTP](/vi/clawhub/http-api).
