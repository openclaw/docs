---
read_when:
    - Tìm hiểu về danh sách, phiên bản, lượt cài đặt, việc xuất bản và kiểm duyệt
summary: Cách hoạt động của danh sách, phiên bản, quá trình cài đặt, phát hành, quét và cập nhật trên ClawHub.
x-i18n:
    generated_at: "2026-07-19T05:41:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp registry dành cho các skill và plugin của OpenClaw. Nền tảng này cung cấp cho người dùng
nơi khám phá các gói, cho nhà phát hành nơi phát hành các phiên bản và
cung cấp cho OpenClaw đủ siêu dữ liệu để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi registry

Mỗi mục niêm yết công khai là một bản ghi registry gồm:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- siêu dữ liệu, bản tóm tắt, tệp và thông tin ghi nhận nguồn
- nhật ký thay đổi và thông tin thẻ như `latest`
- các tín hiệu về lượt tải xuống, lượt cài đặt và lượt gắn sao
- trạng thái quét bảo mật và kiểm duyệt

Trang niêm yết là nơi chính thức để người dùng xem xét một skill hoặc
plugin tuyên bố thực hiện những gì trước khi cài đặt.

## Skills

Một skill là gói văn bản có phiên bản, xoay quanh `SKILL.md`. Gói này có thể bao gồm
các tệp hỗ trợ, ví dụ, mẫu và tập lệnh.

ClawHub đọc frontmatter `SKILL.md` để hiểu tên skill,
mô tả, yêu cầu, biến môi trường và siêu dữ liệu. Siêu dữ liệu chính xác
rất quan trọng vì giúp người dùng quyết định có nên cài đặt skill hay không và
giúp các quy trình quét tự động phát hiện điểm không khớp giữa hành vi được khai báo và hành vi quan sát được.

Xem [Định dạng skill](/clawhub/skill-format).

## Plugin

Plugin là các phần mở rộng OpenClaw được đóng gói. ClawHub lưu trữ siêu dữ liệu gói,
thông tin tương thích, liên kết nguồn, thành phần tạo tác và bản ghi phiên bản.

Khi OpenClaw cài đặt một plugin từ ClawHub, hệ thống kiểm tra siêu dữ liệu tương thích
được công bố trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API,
phiên bản Gateway tối thiểu, nền tảng máy chủ đích, yêu cầu môi trường và mã băm
của thành phần tạo tác.

Hãy dùng nguồn cài đặt ClawHub tường minh khi bạn muốn registry là
nguồn thông tin xác thực:

```bash
openclaw plugins install clawhub:<package>
```

## Phát hành

Thao tác phát hành tạo một bản ghi phiên bản mới không thể thay đổi. Nhà phát hành sử dụng CLI `clawhub`
cho các quy trình registry đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Hãy dùng chế độ chạy thử để xem trước payload đã phân giải trước khi tải lên. Sau đó, các trang công khai
hiển thị siêu dữ liệu đã phát hành, các tệp, thông tin ghi nhận nguồn và trạng thái quét.

## Cài đặt và cập nhật

Các lệnh cài đặt của OpenClaw sử dụng ClawHub làm nguồn gói:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại siêu dữ liệu nguồn cài đặt để sau này các bản cập nhật có thể phân giải cùng
gói registry đó. CLI ClawHub cũng hỗ trợ các quy trình cài đặt và
cập nhật skill trực tiếp cho người dùng muốn có các thư mục skill do registry quản lý bên ngoài
một không gian làm việc OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub cho phép phát hành công khai, nhưng các bản phát hành vẫn phải tuân theo các cổng kiểm tra khi tải lên,
quy trình kiểm tra tự động, báo cáo của người dùng và hành động của người kiểm duyệt.

Các trang công khai hiển thị bản tóm tắt kết quả quét khi có. Nội dung bị giữ lại, ẩn
hoặc chặn có thể biến mất khỏi quy trình tìm kiếm và cài đặt công khai nhưng vẫn
hiển thị cho chủ sở hữu để chẩn đoán.

Xem [Bảo mật](/clawhub/security), [Kiểm tra bảo mật](/vi/clawhub/security-audits),
[Kiểm duyệt và an toàn tài khoản](/clawhub/moderation) và
[Quy định sử dụng được chấp nhận](/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp các API đọc công khai để khám phá, tìm kiếm, xem chi tiết gói và
tải xuống. Các danh mục của bên thứ ba có thể sử dụng những API này khi liên kết trở lại
mục niêm yết ClawHub chính thức, tuân thủ giới hạn tốc độ và tránh ngụ ý rằng họ được chứng thực.

Xem [API công khai](/vi/clawhub/api) và [API HTTP](/clawhub/http-api).
