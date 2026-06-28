---
read_when:
    - Báo cáo sự cố bảo mật ClawHub
    - Tìm hiểu công bố lỗ hổng bảo mật của ClawHub
    - Phân biệt sự cố nền tảng ClawHub với sự cố về skill hoặc plugin của bên thứ ba
sidebarTitle: Security
summary: Cách báo cáo sự cố bảo mật ClawHub và thời điểm các lỗ hổng bảo mật được công bố công khai.
title: Bảo mật
x-i18n:
    generated_at: "2026-06-28T05:08:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bảo mật

Bạn có thể báo cáo các vấn đề bảo mật của ClawHub thông qua GitHub Security Advisories cho
`openclaw/clawhub`.

Hãy dùng GitHub Security Advisories cho các lỗ hổng trong chính ClawHub. Các
báo cáo advisory tốt về ClawHub bao gồm lỗi trong:

- trang web, API hoặc CLI của ClawHub
- việc xuất bản registry, tải xuống, cài đặt hoặc tính toàn vẹn của artifact
- xác thực, phân quyền hoặc token API
- quét, kiểm duyệt hoặc xử lý báo cáo

Không dùng advisory của ClawHub cho các lỗ hổng trong mã nguồn riêng của skill
hoặc Plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà phát hành hoặc kho mã nguồn
được liên kết từ mục niêm yết trên ClawHub.

## Công bố lỗ hổng bảo mật

Vì ClawHub là một ứng dụng đám mây được lưu trữ, các lỗ hổng dịch vụ của ClawHub
mặc định không được công bố công khai. Chúng được công bố công khai khi có bằng
chứng về tác động thực tế đến người dùng hoặc khi người dùng cần thực hiện hành động.

Ví dụ về tác động thực tế đến người dùng bao gồm khai thác đã được xác nhận,
lộ dữ liệu hoặc bí mật của người dùng, nội dung độc hại đến được người dùng do
lỗi nền tảng, hoặc bất kỳ vấn đề nào yêu cầu người dùng xoay vòng thông tin đăng nhập,
cập nhật phần mềm cục bộ, hoặc thực hiện hành động bảo vệ khác.

Các lỗ hổng trong phần mềm do người dùng cài đặt được công bố công khai, chẳng hạn như
các gói CLI, tệp nhị phân, thư viện hoặc artifact phát hành khác của ClawHub mà người dùng
cần cập nhật cục bộ.

## Trang liên quan

Để biết nhãn kiểm tra khi cài đặt, mức rủi ro, phát hiện và cách diễn giải, hãy xem
[Kiểm tra bảo mật](/vi/clawhub/security-audits).

Để biết về báo cáo marketplace, trạng thái giữ để kiểm duyệt, mục niêm yết bị ẩn, lệnh cấm và
trạng thái tài khoản, hãy xem [Kiểm duyệt và An toàn tài khoản](/vi/clawhub/moderation).
