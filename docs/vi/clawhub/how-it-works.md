---
read_when:
    - Tìm hiểu về danh sách, phiên bản, cài đặt, xuất bản và kiểm duyệt
summary: Cách hoạt động của các mục niêm yết, phiên bản, lượt cài đặt, quy trình phát hành, lượt quét và bản cập nhật trên ClawHub.
x-i18n:
    generated_at: "2026-05-12T15:42:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp registry dành cho Skills và Plugin của OpenClaw. Nó cung cấp cho người dùng một
nơi để khám phá các gói, cung cấp cho nhà phát hành một nơi để phát hành phiên bản, và
cung cấp cho OpenClaw đủ metadata để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi registry

Mỗi mục niêm yết công khai là một bản ghi registry với:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- metadata, tóm tắt, tệp và ghi nhận nguồn
- thông tin changelog và thẻ như `latest`
- tín hiệu tải xuống, cài đặt, gắn sao và bình luận
- trạng thái quét bảo mật và kiểm duyệt

Trang niêm yết là nơi chính thức để người dùng kiểm tra một skill hoặc
Plugin tuyên bố làm gì trước khi cài đặt.

## Skills

Một skill là một gói văn bản có phiên bản, xoay quanh `SKILL.md`. Nó có thể bao gồm
các tệp hỗ trợ, ví dụ, mẫu và script.

ClawHub đọc frontmatter của `SKILL.md` để hiểu tên skill,
mô tả, yêu cầu, biến môi trường và metadata. Metadata chính xác
rất quan trọng vì nó giúp người dùng quyết định có nên cài đặt skill hay không và
giúp các lượt quét tự động phát hiện điểm không khớp giữa hành vi đã khai báo và hành vi quan sát được.

Xem [Định dạng skill](/vi/clawhub/skill-format).

## Plugin

Plugin là các phần mở rộng OpenClaw được đóng gói. ClawHub lưu metadata gói,
thông tin tương thích, liên kết nguồn, artifact và bản ghi phiên bản.

Khi OpenClaw cài đặt một Plugin từ ClawHub, nó kiểm tra metadata tương thích
được quảng bá trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API,
phiên bản Gateway tối thiểu, mục tiêu host, yêu cầu môi trường và
digest của artifact.

Dùng nguồn cài đặt ClawHub rõ ràng khi bạn muốn registry là
source of truth:

```bash
openclaw plugins install clawhub:<package>
```

## Phát hành

Phát hành tạo một bản ghi phiên bản bất biến mới. Nhà phát hành dùng CLI `clawhub`
cho các workflow registry đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng dry run để xem trước payload đã phân giải trước khi tải lên. Sau đó các trang công khai
hiển thị metadata đã phát hành, tệp, ghi nhận nguồn và trạng thái quét.

## Cài đặt và cập nhật

Các lệnh cài đặt của OpenClaw dùng ClawHub làm nguồn gói:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại metadata nguồn cài đặt để các bản cập nhật sau này có thể phân giải cùng
gói registry đó. CLI ClawHub cũng hỗ trợ workflow cài đặt và
cập nhật skill trực tiếp cho người dùng muốn có các thư mục skill do registry quản lý bên ngoài
một workspace OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub mở cho việc phát hành, nhưng các bản phát hành vẫn chịu sự kiểm soát của cổng tải lên,
kiểm tra tự động, báo cáo của người dùng và hành động của moderator.

Các trang công khai hiển thị tóm tắt quét khi có. Nội dung bị giữ lại, ẩn
hoặc chặn có thể biến mất khỏi các luồng tìm kiếm và cài đặt công khai trong khi vẫn
hiển thị với chủ sở hữu để chẩn đoán.

Xem [Bảo mật + kiểm duyệt](/vi/clawhub/security) và
[Cách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp API đọc công khai cho khám phá, tìm kiếm, chi tiết gói và
tải xuống. Catalog của bên thứ ba có thể dùng các API này khi chúng liên kết lại tới
mục niêm yết ClawHub chính thức, tôn trọng giới hạn tốc độ và tránh ngụ ý chứng thực.

Xem [API công khai](/vi/clawhub/api) và [HTTP API](/vi/clawhub/http-api).
