---
read_when:
    - Tìm hiểu danh sách, phiên bản, cài đặt, xuất bản và kiểm duyệt
summary: Cách hoạt động của danh sách ClawHub, phiên bản, cài đặt, xuất bản, quét và cập nhật.
x-i18n:
    generated_at: "2026-07-01T18:13:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp đăng ký cho Skills và Plugin của OpenClaw. Nó cung cấp cho người dùng một
nơi để khám phá các gói, cung cấp cho nhà phát hành một nơi để phát hành phiên bản, và
cung cấp cho OpenClaw đủ siêu dữ liệu để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi đăng ký

Mỗi mục công khai là một bản ghi đăng ký với:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- siêu dữ liệu, tóm tắt, tệp và ghi nhận nguồn
- changelog và thông tin thẻ như `latest`
- tín hiệu tải xuống, cài đặt và gắn sao
- trạng thái quét bảo mật và kiểm duyệt

Trang mục là nơi chính tắc để người dùng kiểm tra một skill hoặc
Plugin tuyên bố làm gì trước khi cài đặt.

## Skills

Một skill là một gói văn bản có phiên bản, xoay quanh `SKILL.md`. Nó có thể bao gồm
các tệp hỗ trợ, ví dụ, mẫu và tập lệnh.

ClawHub đọc frontmatter của `SKILL.md` để hiểu tên skill,
mô tả, yêu cầu, biến môi trường và siêu dữ liệu. Siêu dữ liệu chính xác
rất quan trọng vì nó giúp người dùng quyết định có cài đặt skill hay không và
giúp các quy trình quét tự động phát hiện điểm không khớp giữa hành vi đã khai báo và hành vi quan sát được.

Xem [Định dạng skill](/vi/clawhub/skill-format).

## Plugin

Plugin là các phần mở rộng OpenClaw được đóng gói. ClawHub lưu trữ siêu dữ liệu gói,
thông tin tương thích, liên kết nguồn, tạo phẩm và bản ghi phiên bản.

Khi OpenClaw cài đặt một Plugin từ ClawHub, nó kiểm tra siêu dữ liệu tương thích
được công bố trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API,
phiên bản Gateway tối thiểu, mục tiêu máy chủ, yêu cầu môi trường và mã băm tạo phẩm.

Dùng nguồn cài đặt ClawHub rõ ràng khi bạn muốn registry là
nguồn sự thật:

```bash
openclaw plugins install clawhub:<package>
```

## Xuất bản

Việc xuất bản tạo một bản ghi phiên bản bất biến mới. Nhà xuất bản dùng CLI `clawhub` cho các quy trình đăng ký đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng các lần chạy thử để xem trước payload đã phân giải trước khi tải lên. Các trang công khai sau đó hiển thị siêu dữ liệu đã xuất bản, tệp, ghi nhận nguồn và trạng thái quét.

## Cài đặt và cập nhật

Các lệnh cài đặt OpenClaw dùng ClawHub làm nguồn gói:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại siêu dữ liệu nguồn cài đặt để về sau các bản cập nhật có thể phân giải cùng gói đăng ký đó. CLI ClawHub cũng hỗ trợ trực tiếp các quy trình cài đặt và cập nhật skill cho người dùng muốn có các thư mục skill do registry quản lý bên ngoài một không gian làm việc OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub mở cho việc xuất bản, nhưng các bản phát hành vẫn chịu các cổng kiểm soát tải lên, kiểm tra tự động, báo cáo của người dùng và hành động của điều phối viên.

Các trang công khai hiển thị tóm tắt quét khi có. Nội dung bị giữ lại, ẩn hoặc chặn có thể biến mất khỏi luồng tìm kiếm và cài đặt công khai, trong khi vẫn hiển thị với chủ sở hữu để chẩn đoán.

Xem [Bảo mật](/clawhub/security), [Kiểm toán bảo mật](/clawhub/security-audits), [Điều phối và an toàn tài khoản](/vi/clawhub/moderation), và [Sử dụng được chấp nhận](/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp các API đọc công khai để khám phá, tìm kiếm, xem chi tiết gói và tải xuống. Các danh mục của bên thứ ba có thể dùng các API này khi liên kết lại danh sách ClawHub chính thức, tôn trọng giới hạn tốc độ và tránh ngụ ý sự chứng thực.

Xem [API công khai](/vi/clawhub/api) và [API HTTP](/clawhub/http-api).
