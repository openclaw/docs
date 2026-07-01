---
read_when:
    - Báo cáo sự cố bảo mật ClawHub
    - Tìm hiểu về công bố lỗ hổng bảo mật của ClawHub
    - Phân biệt các sự cố nền tảng ClawHub với các sự cố Skills hoặc Plugin của bên thứ ba
sidebarTitle: Security
summary: Cách báo cáo các vấn đề bảo mật của ClawHub và thời điểm các lỗ hổng được công khai.
title: Bảo mật
x-i18n:
    generated_at: "2026-07-01T20:26:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bảo mật

Có thể báo cáo các vấn đề bảo mật của ClawHub thông qua GitHub Security Advisories cho
`openclaw/clawhub`.

Sử dụng GitHub Security Advisories cho các lỗ hổng trong chính ClawHub. Các báo cáo
khuyến cáo ClawHub tốt bao gồm lỗi trong:

- trang web, API hoặc CLI của ClawHub
- xuất bản registry, tải xuống, cài đặt hoặc tính toàn vẹn của artifact
- xác thực, phân quyền hoặc API token
- quét, kiểm duyệt hoặc xử lý báo cáo

Không sử dụng khuyến cáo ClawHub cho các lỗ hổng trong mã nguồn riêng của Skills hoặc
plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà xuất bản hoặc kho mã nguồn
được liên kết từ mục niêm yết trên ClawHub.

## Tiết lộ lỗ hổng

Vì ClawHub là một ứng dụng đám mây được lưu trữ, các lỗ hổng dịch vụ ClawHub
mặc định không được tiết lộ công khai. Chúng được tiết lộ công khai khi có
bằng chứng về tác động thực tế đến người dùng hoặc khi người dùng cần hành động.

Ví dụ về tác động thực tế đến người dùng bao gồm khai thác đã được xác nhận, lộ
dữ liệu hoặc bí mật của người dùng, nội dung độc hại đến được người dùng do lỗi
nền tảng, hoặc bất kỳ vấn đề nào yêu cầu người dùng xoay vòng thông tin xác thực,
cập nhật phần mềm cục bộ hoặc thực hiện hành động bảo vệ khác.

Các lỗ hổng trong phần mềm do người dùng cài đặt được tiết lộ công khai, chẳng hạn như
các gói CLI, tệp nhị phân, thư viện hoặc artifact phát hành khác của ClawHub mà người dùng
cần cập nhật cục bộ.

## Trang liên quan

Để biết nhãn kiểm tra tại thời điểm cài đặt, mức độ rủi ro, phát hiện và cách diễn giải, xem
[Kiểm tra bảo mật](/clawhub/security-audits).

Đối với báo cáo trên marketplace, giữ lại để kiểm duyệt, mục niêm yết bị ẩn, lệnh cấm và trạng thái
tài khoản, xem [Kiểm duyệt và an toàn tài khoản](/clawhub/moderation).
