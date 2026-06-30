---
read_when:
    - Tìm hiểu danh sách, phiên bản, cài đặt, xuất bản và kiểm duyệt
summary: Cách hoạt động của các mục niêm yết, phiên bản, lượt cài đặt, hoạt động xuất bản, quét và cập nhật trên ClawHub.
x-i18n:
    generated_at: "2026-06-30T14:07:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp sổ đăng ký cho Skills và Plugin của OpenClaw. Nó cung cấp cho người dùng một
nơi để khám phá các gói, cung cấp cho nhà phát hành một nơi để phát hành phiên bản, và
cung cấp cho OpenClaw đủ siêu dữ liệu để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi sổ đăng ký

Mỗi mục niêm yết công khai là một bản ghi sổ đăng ký với:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- siêu dữ liệu, tóm tắt, tệp và thông tin ghi nguồn
- nhật ký thay đổi và thông tin thẻ như `latest`
- tín hiệu tải xuống, cài đặt và gắn sao
- trạng thái quét bảo mật và kiểm duyệt

Trang mục niêm yết là nơi chuẩn để người dùng xem xét một skill hoặc
plugin tuyên bố sẽ làm gì trước khi cài đặt.

## Skills

Skill là một gói văn bản có phiên bản, xoay quanh `SKILL.md`. Nó có thể bao gồm
các tệp hỗ trợ, ví dụ, mẫu và tập lệnh.

ClawHub đọc frontmatter của `SKILL.md` để hiểu tên skill,
mô tả, yêu cầu, biến môi trường và siêu dữ liệu. Siêu dữ liệu chính xác
rất quan trọng vì nó giúp người dùng quyết định có cài đặt skill hay không và
giúp các quá trình quét tự động phát hiện sự không khớp giữa hành vi đã khai báo và hành vi quan sát được.

Xem [Định dạng skill](/vi/clawhub/skill-format).

## Plugin

Plugin là các tiện ích mở rộng OpenClaw được đóng gói. ClawHub lưu trữ siêu dữ liệu gói,
thông tin tương thích, liên kết nguồn, hiện vật và bản ghi phiên bản.

Khi OpenClaw cài đặt một plugin từ ClawHub, nó kiểm tra siêu dữ liệu tương thích
được quảng bá trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API,
phiên bản gateway tối thiểu, mục tiêu máy chủ, yêu cầu môi trường và bản tóm lược hiện vật.

Dùng nguồn cài đặt ClawHub rõ ràng khi bạn muốn sổ đăng ký là
nguồn sự thật:

```bash
openclaw plugins install clawhub:<package>
```

## Phát hành

Phát hành tạo một bản ghi phiên bản bất biến mới. Nhà phát hành dùng CLI `clawhub`
cho các quy trình làm việc sổ đăng ký đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng chạy thử để xem trước payload đã phân giải trước khi tải lên. Các trang công khai sau đó
hiển thị siêu dữ liệu đã phát hành, tệp, thông tin ghi nguồn và trạng thái quét.

## Cài đặt và cập nhật

Các lệnh cài đặt OpenClaw dùng ClawHub làm nguồn gói:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại siêu dữ liệu nguồn cài đặt để các bản cập nhật có thể phân giải cùng
gói sổ đăng ký đó về sau. CLI ClawHub cũng hỗ trợ quy trình làm việc cài đặt và
cập nhật skill trực tiếp cho người dùng muốn có thư mục skill do sổ đăng ký quản lý bên ngoài
một không gian làm việc OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub mở cho việc phát hành, nhưng các bản phát hành vẫn chịu các cổng tải lên,
kiểm tra tự động, báo cáo của người dùng và hành động của điều phối viên.

Các trang công khai hiển thị tóm tắt quét khi có. Nội dung bị giữ lại, ẩn,
hoặc bị chặn có thể biến mất khỏi quy trình tìm kiếm công khai và cài đặt trong khi vẫn
hiển thị với chủ sở hữu để chẩn đoán.

Xem [Bảo mật](/clawhub/security), [Kiểm toán bảo mật](/clawhub/security-audits),
[Kiểm duyệt và an toàn tài khoản](/vi/clawhub/moderation), và
[Sử dụng được chấp nhận](/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp các API đọc công khai cho khám phá, tìm kiếm, chi tiết gói và
tải xuống. Danh mục của bên thứ ba có thể dùng các API này khi chúng liên kết lại đến
mục niêm yết ClawHub chuẩn, tôn trọng giới hạn tốc độ và tránh ngụ ý sự chứng thực.

Xem [API công khai](/clawhub/api) và [HTTP API](/clawhub/http-api).
