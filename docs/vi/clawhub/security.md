---
read_when:
    - Báo cáo một vấn đề bảo mật ClawHub
    - Tìm hiểu về công bố lỗ hổng bảo mật ClawHub
    - Phân biệt sự cố nền tảng ClawHub với sự cố skill hoặc plugin của bên thứ ba
sidebarTitle: Security
summary: Cách báo cáo các vấn đề bảo mật của ClawHub và thời điểm các lỗ hổng được công bố công khai.
title: Bảo mật
x-i18n:
    generated_at: "2026-07-02T14:06:06Z"
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
cố vấn ClawHub tốt bao gồm lỗi trong:

- trang web, API hoặc CLI của ClawHub
- phát hành lên registry, tải xuống, cài đặt hoặc tính toàn vẹn của artifact
- xác thực, phân quyền hoặc token API
- quét, kiểm duyệt hoặc xử lý báo cáo

Không sử dụng cố vấn ClawHub cho các lỗ hổng trong mã nguồn riêng của skill hoặc
plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà phát hành hoặc kho nguồn được
liên kết từ mục niêm yết ClawHub.

## Tiết lộ lỗ hổng

Vì ClawHub là một ứng dụng đám mây được lưu trữ, các lỗ hổng dịch vụ ClawHub
không được công khai theo mặc định. Chúng được công khai khi có bằng chứng về
tác động thực sự đến người dùng hoặc khi người dùng cần thực hiện hành động.

Ví dụ về tác động thực sự đến người dùng bao gồm việc khai thác đã được xác nhận,
lộ dữ liệu hoặc bí mật của người dùng, nội dung độc hại đến được người dùng do
lỗi nền tảng, hoặc bất kỳ vấn đề nào yêu cầu người dùng xoay vòng thông tin xác
thực, cập nhật phần mềm cục bộ hoặc thực hiện hành động bảo vệ khác.

Các lỗ hổng trong phần mềm do người dùng cài đặt được công khai, chẳng hạn như
các gói CLI, binary, thư viện của ClawHub hoặc các artifact phát hành khác mà
người dùng cần cập nhật cục bộ.

## Trang liên quan

Để biết nhãn kiểm tra tại thời điểm cài đặt, mức rủi ro, phát hiện và cách diễn
giải, hãy xem [Kiểm tra bảo mật](/clawhub/security-audits).

Để biết báo cáo marketplace, tạm giữ kiểm duyệt, mục niêm yết bị ẩn, lệnh cấm
và trạng thái tài khoản, hãy xem [Kiểm duyệt và an toàn tài khoản](/clawhub/moderation).
