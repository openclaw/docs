---
read_when:
    - Hiểu về danh sách, phiên bản, cài đặt, xuất bản và kiểm duyệt
summary: Cách hoạt động của các mục đăng, phiên bản, lượt cài đặt, quy trình phát hành, quét và cập nhật trên ClawHub.
x-i18n:
    generated_at: "2026-07-02T14:05:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp registry cho OpenClaw Skills và Plugin. Nó cung cấp cho người dùng một
nơi để khám phá các gói, cung cấp cho nhà phát hành một nơi để phát hành các phiên bản, và
cung cấp cho OpenClaw đủ metadata để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi registry

Mỗi mục niêm yết công khai là một bản ghi registry với:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- metadata, tóm tắt, tệp, và ghi nhận nguồn
- changelog và thông tin tag như `latest`
- tín hiệu tải xuống, cài đặt, và đánh dấu sao
- trạng thái quét bảo mật và kiểm duyệt

Trang niêm yết là nơi chuẩn để người dùng kiểm tra một Skills hoặc
Plugin tuyên bố làm gì trước khi cài đặt.

## Skills

Một skill là một gói văn bản có phiên bản, xoay quanh `SKILL.md`. Nó có thể bao gồm
các tệp hỗ trợ, ví dụ, mẫu, và script.

ClawHub đọc frontmatter của `SKILL.md` để hiểu tên skill,
mô tả, yêu cầu, biến môi trường, và metadata. Metadata chính xác
rất quan trọng vì nó giúp người dùng quyết định có cài đặt skill hay không và
giúp các quy trình quét tự động phát hiện sự không khớp giữa hành vi đã khai báo và hành vi quan sát được.

Xem [Định dạng skill](/vi/clawhub/skill-format).

## Plugin

Plugin là các phần mở rộng OpenClaw được đóng gói. ClawHub lưu metadata gói,
thông tin tương thích, liên kết nguồn, artifact, và bản ghi phiên bản.

Khi OpenClaw cài đặt một Plugin từ ClawHub, nó kiểm tra metadata tương thích
được quảng bá trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API,
phiên bản Gateway tối thiểu, mục tiêu host, yêu cầu môi trường, và
digest artifact.

Dùng nguồn cài đặt ClawHub rõ ràng khi bạn muốn registry là
nguồn sự thật:

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

Dùng dry run để xem trước payload đã phân giải trước khi tải lên. Các trang công khai sau đó
hiển thị metadata đã phát hành, tệp, ghi nhận nguồn, và trạng thái quét.

## Cài đặt và cập nhật

Các lệnh cài đặt OpenClaw dùng ClawHub làm nguồn gói:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại metadata nguồn cài đặt để các bản cập nhật sau này có thể phân giải cùng
gói registry đó. CLI ClawHub cũng hỗ trợ các workflow cài đặt và
cập nhật skill trực tiếp cho người dùng muốn có thư mục skill do registry quản lý bên ngoài một
workspace OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub mở cho việc phát hành, nhưng các bản phát hành vẫn phải chịu các cổng tải lên,
kiểm tra tự động, báo cáo của người dùng, và hành động của kiểm duyệt viên.

Các trang công khai hiển thị tóm tắt quét khi có. Nội dung bị giữ lại, ẩn,
hoặc chặn có thể biến mất khỏi tìm kiếm công khai và luồng cài đặt trong khi vẫn
hiển thị với chủ sở hữu để chẩn đoán.

Xem [Bảo mật](/clawhub/security), [Kiểm toán bảo mật](/clawhub/security-audits),
[Kiểm duyệt và an toàn tài khoản](/vi/clawhub/moderation), và
[Chính sách sử dụng được chấp nhận](/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp các API đọc công khai cho khám phá, tìm kiếm, chi tiết gói, và
tải xuống. Catalog của bên thứ ba có thể dùng các API này khi chúng liên kết trở lại
mục niêm yết ClawHub chuẩn, tôn trọng giới hạn tốc độ, và tránh ngụ ý được chứng thực.

Xem [API công khai](/vi/clawhub/api) và [HTTP API](/clawhub/http-api).
