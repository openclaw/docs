---
read_when:
    - Tìm hiểu về các mục niêm yết, phiên bản, lượt cài đặt, xuất bản và kiểm duyệt
summary: Cách các danh sách, phiên bản, lượt cài đặt, quy trình xuất bản, quét và cập nhật trên ClawHub hoạt động.
x-i18n:
    generated_at: "2026-05-10T19:25:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp registry cho Skills và plugin của OpenClaw. Nó cung cấp cho người dùng một
nơi để khám phá các gói, cung cấp cho nhà xuất bản một nơi để phát hành phiên bản, và
cung cấp cho OpenClaw đủ metadata để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi registry

Mỗi listing công khai là một bản ghi registry với:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- metadata, tóm tắt, tệp, và ghi nhận nguồn
- changelog và thông tin thẻ như `latest`
- tín hiệu tải xuống, cài đặt, đánh sao, và bình luận
- trạng thái quét bảo mật và kiểm duyệt

Trang listing là nơi chuẩn để người dùng kiểm tra skill hoặc
plugin tuyên bố làm gì trước khi cài đặt.

## Skills

Skill là một gói văn bản có phiên bản, xoay quanh `SKILL.md`. Nó có thể bao gồm
các tệp hỗ trợ, ví dụ, mẫu, và script.

ClawHub đọc frontmatter của `SKILL.md` để hiểu tên skill,
mô tả, yêu cầu, biến môi trường, và metadata. Metadata chính xác
rất quan trọng vì nó giúp người dùng quyết định có cài đặt skill hay không và
giúp các lượt quét tự động phát hiện điểm không khớp giữa hành vi đã khai báo và hành vi quan sát được.

Xem [Định dạng skill](/vi/clawhub/skill-format).

## Plugin

Plugin là các phần mở rộng OpenClaw được đóng gói. ClawHub lưu metadata gói,
thông tin tương thích, liên kết nguồn, artifact, và bản ghi phiên bản.

Khi OpenClaw cài đặt một plugin từ ClawHub, nó kiểm tra metadata tương thích
được quảng bá trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API,
phiên bản Gateway tối thiểu, mục tiêu host, yêu cầu môi trường, và
digest artifact.

Dùng nguồn cài đặt ClawHub rõ ràng khi bạn muốn registry là
nguồn sự thật:

```bash
openclaw plugins install clawhub:<package>
```

## Phát hành

Việc phát hành tạo một bản ghi phiên bản bất biến mới. Nhà xuất bản dùng CLI `clawhub`
cho các quy trình registry đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng chạy thử để xem trước payload đã phân giải trước khi tải lên. Sau đó các trang công khai
hiển thị metadata đã phát hành, tệp, ghi nhận nguồn, và trạng thái quét.

## Cài đặt và cập nhật

Các lệnh cài đặt của OpenClaw dùng ClawHub làm nguồn gói:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại metadata nguồn cài đặt để các bản cập nhật có thể phân giải cùng
gói registry đó về sau. CLI ClawHub cũng hỗ trợ các quy trình cài đặt và
cập nhật skill trực tiếp cho người dùng muốn các thư mục skill do registry quản lý bên ngoài
một workspace OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub mở cho việc phát hành, nhưng các bản phát hành vẫn chịu các cổng tải lên,
kiểm tra tự động, báo cáo người dùng, và hành động của người kiểm duyệt.

Các trang công khai hiển thị tóm tắt quét khi có. Nội dung bị giữ lại, ẩn,
hoặc chặn có thể biến mất khỏi tìm kiếm công khai và luồng cài đặt trong khi vẫn
hiển thị với chủ sở hữu để chẩn đoán hoặc khiếu nại.

Xem [Bảo mật + kiểm duyệt](/vi/clawhub/security) và
[Sử dụng được chấp nhận](/vi/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp các API đọc công khai cho khám phá, tìm kiếm, chi tiết gói, và
tải xuống. Catalog bên thứ ba có thể dùng các API này khi chúng liên kết trở lại
listing ClawHub chuẩn, tôn trọng giới hạn tốc độ, và tránh ngụ ý sự chứng thực.

Xem [API công khai](/vi/clawhub/api) và [HTTP API](/vi/clawhub/http-api).
