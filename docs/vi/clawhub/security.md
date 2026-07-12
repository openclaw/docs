---
read_when:
    - Báo cáo sự cố bảo mật của ClawHub
    - Tìm hiểu về quy trình công bố lỗ hổng của ClawHub
    - Phân biệt sự cố nền tảng ClawHub với sự cố Skills hoặc Plugin của bên thứ ba
sidebarTitle: Security
summary: Cách báo cáo các vấn đề bảo mật của ClawHub và thời điểm các lỗ hổng được công bố công khai.
title: Bảo mật
x-i18n:
    generated_at: "2026-07-12T07:46:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bảo mật

Các vấn đề bảo mật của ClawHub có thể được báo cáo qua GitHub Security Advisories dành cho
`openclaw/clawhub`.

Hãy sử dụng GitHub Security Advisories cho các lỗ hổng trong chính ClawHub. Các
báo cáo tư vấn bảo mật ClawHub chất lượng bao gồm lỗi trong:

- trang web, API hoặc CLI của ClawHub
- hoạt động phát hành lên registry, tải xuống, cài đặt hoặc tính toàn vẹn của tạo phẩm
- xác thực, phân quyền hoặc token API
- hoạt động quét, kiểm duyệt hoặc xử lý báo cáo

Không sử dụng các tư vấn bảo mật ClawHub cho lỗ hổng trong mã nguồn riêng của
Skills hoặc Plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà phát hành hoặc kho
mã nguồn được liên kết từ mục niêm yết trên ClawHub.

## Công bố lỗ hổng

Vì ClawHub là một ứng dụng đám mây được lưu trữ, các lỗ hổng của dịch vụ ClawHub
mặc định không được công bố công khai. Chúng được công bố công khai khi có
bằng chứng về tác động thực tế đến người dùng hoặc khi người dùng cần thực hiện
hành động.

Ví dụ về tác động thực tế đến người dùng bao gồm hành vi khai thác đã được xác nhận,
việc dữ liệu hoặc thông tin bí mật của người dùng bị lộ, nội dung độc hại tiếp cận
người dùng do lỗi nền tảng, hoặc bất kỳ vấn đề nào yêu cầu người dùng xoay vòng
thông tin xác thực, cập nhật phần mềm cục bộ hoặc thực hiện biện pháp bảo vệ khác.

Các lỗ hổng trong phần mềm do người dùng cài đặt được công bố công khai, chẳng hạn như
các gói CLI, tệp nhị phân, thư viện hoặc tạo phẩm phát hành khác của ClawHub mà người
dùng cần cập nhật cục bộ.

## Các trang liên quan

Để biết về nhãn kiểm tra tại thời điểm cài đặt, mức độ rủi ro, phát hiện và cách diễn giải, hãy xem
[Kiểm tra bảo mật](/clawhub/security-audits).

Để biết về báo cáo trên chợ ứng dụng, trạng thái tạm giữ để kiểm duyệt, mục niêm yết bị ẩn, lệnh cấm và
trạng thái tài khoản, hãy xem [Kiểm duyệt và an toàn tài khoản](/vi/clawhub/moderation).
