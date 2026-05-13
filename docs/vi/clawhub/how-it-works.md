---
read_when:
    - Tìm hiểu về các mục niêm yết, phiên bản, lượt cài đặt, việc xuất bản và kiểm duyệt
summary: Cách hoạt động của các danh sách, phiên bản, lượt cài đặt, quá trình xuất bản, lượt quét và bản cập nhật của ClawHub.
x-i18n:
    generated_at: "2026-05-13T05:32:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Cách ClawHub hoạt động

ClawHub là lớp registry cho Skills và Plugin của OpenClaw. Nó cung cấp cho người dùng một
nơi để khám phá các gói, cung cấp cho nhà phát hành một nơi để phát hành phiên bản, và
cung cấp cho OpenClaw đủ siêu dữ liệu để cài đặt và cập nhật các gói đó một cách an toàn.

## Bản ghi registry

Mỗi mục niêm yết công khai là một bản ghi registry có:

- chủ sở hữu và slug hoặc tên gói
- một hoặc nhiều phiên bản đã phát hành
- siêu dữ liệu, tóm tắt, tệp và thông tin ghi nguồn
- changelog và thông tin thẻ như `latest`
- tín hiệu tải xuống, cài đặt, đánh dấu sao và bình luận
- trạng thái quét bảo mật và kiểm duyệt

Trang niêm yết là nơi chuẩn để người dùng kiểm tra Skills hoặc
Plugin tuyên bố làm gì trước khi cài đặt.

## Skills

Skills là một gói văn bản có phiên bản, xoay quanh `SKILL.md`. Nó có thể bao gồm
các tệp hỗ trợ, ví dụ, mẫu và script.

ClawHub đọc frontmatter của `SKILL.md` để hiểu tên Skills,
mô tả, yêu cầu, biến môi trường và siêu dữ liệu. Siêu dữ liệu chính xác
rất quan trọng vì nó giúp người dùng quyết định có cài đặt Skills hay không và
giúp các lần quét tự động phát hiện sai lệch giữa hành vi đã khai báo và hành vi quan sát được.

Xem [Định dạng Skills](/vi/clawhub/skill-format).

## Plugin

Plugin là các phần mở rộng OpenClaw được đóng gói. ClawHub lưu trữ siêu dữ liệu gói,
thông tin tương thích, liên kết nguồn, artifact và bản ghi phiên bản.

Khi OpenClaw cài đặt Plugin từ ClawHub, nó kiểm tra siêu dữ liệu tương thích
được công bố trước khi cài đặt. Bản ghi gói có thể bao gồm khả năng tương thích API,
phiên bản Gateway tối thiểu, mục tiêu máy chủ, yêu cầu môi trường và digest
artifact.

Sử dụng nguồn cài đặt ClawHub rõ ràng khi bạn muốn registry là
nguồn sự thật:

```bash
openclaw plugins install clawhub:<package>
```

## Xuất bản

Việc xuất bản tạo một bản ghi phiên bản mới bất biến. Nhà xuất bản dùng CLI `clawhub` cho các quy trình registry đã xác thực:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Dùng chạy thử để xem trước payload đã phân giải trước khi tải lên. Sau đó, các trang công khai hiển thị siêu dữ liệu, tệp, ghi nhận nguồn và trạng thái quét đã được xuất bản.

## Cài đặt và cập nhật

Các lệnh cài đặt của OpenClaw dùng ClawHub làm nguồn gói:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw ghi lại siêu dữ liệu nguồn cài đặt để các bản cập nhật có thể phân giải cùng gói registry đó sau này. CLI ClawHub cũng hỗ trợ quy trình cài đặt và cập nhật kỹ năng trực tiếp cho người dùng muốn có các thư mục kỹ năng do registry quản lý bên ngoài một workspace OpenClaw đầy đủ.

## Trạng thái bảo mật

ClawHub mở cho việc xuất bản, nhưng các bản phát hành vẫn chịu các cổng tải lên, kiểm tra tự động, báo cáo của người dùng và hành động của điều phối viên.

Các trang công khai hiển thị tóm tắt quét khi có. Nội dung bị giữ lại, ẩn hoặc chặn có thể biến mất khỏi các luồng tìm kiếm và cài đặt công khai, trong khi vẫn hiển thị cho chủ sở hữu để chẩn đoán.

Xem [Bảo mật + điều phối](/vi/clawhub/security) và [Cách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage).

## Quyền truy cập API

ClawHub cung cấp các API đọc công khai để khám phá, tìm kiếm, xem chi tiết gói và tải xuống. Các danh mục của bên thứ ba có thể dùng các API này khi chúng liên kết ngược về danh sách ClawHub chính thức, tôn trọng giới hạn tốc độ và tránh ngụ ý được chứng thực.

Xem [API công khai](/vi/clawhub/api) và [API HTTP](/vi/clawhub/http-api).
