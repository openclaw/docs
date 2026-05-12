---
read_when:
    - Tìm hiểu về mục niêm yết, phiên bản, lượt cài đặt, xuất bản và kiểm duyệt
summary: Cách hoạt động của các danh sách trên ClawHub, phiên bản, cài đặt, xuất bản, quét và cập nhật.
x-i18n:
    generated_at: "2026-05-12T00:57:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# ClawHub hoạt động như thế nào

ClawHub là lớp registry cho Skills và Plugin của OpenClaw. Nó cung cấp cho người dùng một
nơi để khám phá các gói, cung cấp cho nhà phát hành một nơi để phát hành phiên bản, và
cung cấp cho OpenClaw đủ siêu dữ liệu để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi registry

Mỗi mục niêm yết công khai là một bản ghi registry với:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- siêu dữ liệu, tóm tắt, tệp và nguồn gốc mã nguồn
- thông tin changelog và thẻ như `latest`
- tín hiệu tải xuống, cài đặt, gắn sao và bình luận
- trạng thái quét bảo mật và kiểm duyệt

Trang niêm yết là nơi chính thức để người dùng kiểm tra một skill hoặc
Plugin tuyên bố sẽ làm gì trước khi cài đặt.

## Skills

Một skill là một gói văn bản có phiên bản, xoay quanh `SKILL.md`. Nó có thể bao gồm
các tệp hỗ trợ, ví dụ, mẫu và script.

ClawHub đọc frontmatter của `SKILL.md` để hiểu tên skill,
mô tả, yêu cầu, biến môi trường và siêu dữ liệu. Siêu dữ liệu chính xác
rất quan trọng vì nó giúp người dùng quyết định có cài đặt skill hay không và
giúp các lượt quét tự động phát hiện điểm không khớp giữa hành vi đã khai báo và hành vi quan sát được.

Xem [Định dạng skill](/vi/clawhub/skill-format).

## Plugin

Plugin là các phần mở rộng OpenClaw đã được đóng gói. ClawHub lưu trữ siêu dữ liệu gói,
thông tin tương thích, liên kết mã nguồn, artifact và bản ghi phiên bản.

Khi OpenClaw cài đặt một Plugin từ ClawHub, nó kiểm tra siêu dữ liệu tương thích
được quảng bá trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API,
phiên bản Gateway tối thiểu, mục tiêu host, yêu cầu môi trường và
digest artifact.

Sử dụng nguồn cài đặt ClawHub rõ ràng khi bạn muốn registry là
nguồn chân lý:

```bash
openclaw plugins install clawhub:<package>
```

## Phát hành

Phát hành tạo một bản ghi phiên bản bất biến mới. Nhà phát hành sử dụng CLI `clawhub`
cho các quy trình registry đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Sử dụng chạy thử để xem trước payload đã được phân giải trước khi tải lên. Sau đó, các trang công khai
hiển thị siêu dữ liệu đã phát hành, tệp, nguồn gốc mã nguồn và trạng thái quét.

## Cài đặt và cập nhật

Các lệnh cài đặt OpenClaw sử dụng ClawHub làm nguồn gói:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại siêu dữ liệu nguồn cài đặt để các bản cập nhật có thể phân giải cùng
gói registry đó về sau. CLI ClawHub cũng hỗ trợ các quy trình cài đặt và
cập nhật skill trực tiếp cho người dùng muốn các thư mục skill do registry quản lý nằm ngoài một
workspace OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub mở cho việc phát hành, nhưng các bản phát hành vẫn chịu sự kiểm soát của cổng tải lên,
kiểm tra tự động, báo cáo của người dùng và hành động của người kiểm duyệt.

Các trang công khai hiển thị tóm tắt quét khi có sẵn. Nội dung bị giữ lại, ẩn
hoặc chặn có thể biến mất khỏi tìm kiếm công khai và luồng cài đặt, trong khi vẫn
hiển thị với chủ sở hữu để chẩn đoán.

Xem [Bảo mật + kiểm duyệt](/vi/clawhub/security) và
[Chính sách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp các API đọc công khai cho khám phá, tìm kiếm, chi tiết gói và
tải xuống. Các danh mục bên thứ ba có thể sử dụng các API này khi họ liên kết ngược về
mục niêm yết ClawHub chính thức, tuân thủ giới hạn tốc độ và tránh hàm ý được chứng thực.

Xem [API công khai](/vi/clawhub/api) và [HTTP API](/vi/clawhub/http-api).
