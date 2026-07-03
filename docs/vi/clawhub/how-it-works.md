---
read_when:
    - Tìm hiểu về danh sách, phiên bản, cài đặt, xuất bản và kiểm duyệt
summary: Cách hoạt động của danh sách ClawHub, phiên bản, cài đặt, xuất bản, quét và cập nhật.
x-i18n:
    generated_at: "2026-07-03T13:34:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp registry cho Skills và Plugin của OpenClaw. Nó cung cấp cho người dùng một
nơi để khám phá các gói, cung cấp cho nhà phát hành một nơi để phát hành các phiên bản, và
cung cấp cho OpenClaw đủ metadata để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi registry

Mỗi listing công khai là một bản ghi registry với:

- owner và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- metadata, tóm tắt, tệp và thông tin ghi nhận nguồn
- changelog và thông tin tag như `latest`
- tín hiệu tải xuống, cài đặt và star
- trạng thái quét bảo mật và kiểm duyệt

Trang listing là nơi chuẩn tắc để người dùng kiểm tra một Skill hoặc
Plugin tuyên bố làm gì trước khi cài đặt.

## Skills

Một Skill là một gói văn bản có phiên bản, xoay quanh `SKILL.md`. Nó có thể bao gồm
các tệp hỗ trợ, ví dụ, template và script.

ClawHub đọc frontmatter của `SKILL.md` để hiểu tên Skill,
mô tả, yêu cầu, biến môi trường và metadata. Metadata chính xác
rất quan trọng vì nó giúp người dùng quyết định có nên cài đặt Skill hay không và
giúp các lượt quét tự động phát hiện sai lệch giữa hành vi đã khai báo và hành vi quan sát được.

Xem [Định dạng Skill](/vi/clawhub/skill-format).

## Plugins

Plugin là các phần mở rộng OpenClaw được đóng gói. ClawHub lưu trữ metadata gói,
thông tin tương thích, liên kết nguồn, artifact và bản ghi phiên bản.

Khi OpenClaw cài đặt một Plugin từ ClawHub, nó kiểm tra metadata tương thích
được quảng bá trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API,
phiên bản Gateway tối thiểu, mục tiêu host, yêu cầu môi trường và digest artifact.

Dùng nguồn cài đặt ClawHub rõ ràng khi bạn muốn registry là
nguồn sự thật:

```bash
openclaw plugins install clawhub:<package>
```

## Phát hành

Việc phát hành tạo một bản ghi phiên bản bất biến mới. Nhà phát hành dùng CLI `clawhub`
cho các workflow registry đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng dry run để xem trước payload đã được phân giải trước khi tải lên. Sau đó các trang công khai
hiển thị metadata đã phát hành, tệp, thông tin ghi nhận nguồn và trạng thái quét.

## Cài đặt và cập nhật

Các lệnh cài đặt của OpenClaw dùng ClawHub làm nguồn gói:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại metadata nguồn cài đặt để các bản cập nhật có thể phân giải cùng
gói registry đó về sau. CLI ClawHub cũng hỗ trợ các workflow cài đặt và
cập nhật Skill trực tiếp cho người dùng muốn có các thư mục Skill do registry quản lý bên ngoài một
workspace OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub mở cho việc phát hành, nhưng các bản phát hành vẫn chịu sự chi phối của cổng tải lên,
kiểm tra tự động, báo cáo người dùng và hành động của moderator.

Các trang công khai hiển thị tóm tắt quét khi có sẵn. Nội dung bị giữ lại, ẩn
hoặc chặn có thể biến mất khỏi tìm kiếm công khai và luồng cài đặt trong khi vẫn
hiển thị với owner để chẩn đoán.

Xem [Bảo mật](/clawhub/security), [Kiểm toán bảo mật](/clawhub/security-audits),
[Kiểm duyệt và an toàn tài khoản](/vi/clawhub/moderation), và
[Mức sử dụng được chấp nhận](/clawhub/acceptable-usage).

## Truy cập API

ClawHub cung cấp các API đọc công khai cho khám phá, tìm kiếm, chi tiết gói và
tải xuống. Catalog bên thứ ba có thể dùng các API này khi họ liên kết lại tới
listing ClawHub chuẩn tắc, tôn trọng giới hạn tần suất và tránh hàm ý được chứng thực.

Xem [API công khai](/clawhub/api) và [HTTP API](/clawhub/http-api).
