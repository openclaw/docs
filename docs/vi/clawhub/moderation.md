---
read_when:
    - Báo cáo một skill, plugin hoặc gói phần mềm
    - Khôi phục danh mục bị tạm giữ, ẩn hoặc chặn
    - Tìm hiểu về hoạt động kiểm duyệt, lệnh cấm hoặc trạng thái tài khoản trên ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cách hoạt động của báo cáo ClawHub, trạng thái tạm giữ để kiểm duyệt, mục niêm yết bị ẩn, lệnh cấm và trạng thái tài khoản.
title: Kiểm duyệt và an toàn tài khoản
x-i18n:
    generated_at: "2026-07-19T05:39:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Kiểm duyệt và an toàn tài khoản

ClawHub cho phép xuất bản rộng rãi, nhưng các bề mặt khám phá công khai và cài đặt vẫn
cần có biện pháp bảo vệ. Báo cáo, lệnh tạm giữ để kiểm duyệt, danh sách bị ẩn và các biện pháp xử lý tài khoản
giúp bảo vệ người dùng khi một bản phát hành hoặc tài khoản có vẻ không an toàn, gây hiểu lầm hoặc không
tuân thủ chính sách.

Trang này đề cập đến hoạt động kiểm duyệt và trạng thái tài khoản. Để biết về các nhãn kiểm tra như
`Pass`, `Review`, `Warn`, `Malicious` và mức độ rủi ro, hãy xem
[Kiểm tra bảo mật](/clawhub/security-audits).

Xem thêm [Bảo mật](/clawhub/security) và
[Quy định sử dụng chấp nhận được](/vi/clawhub/acceptable-usage). Đối với các vấn đề về bản quyền hoặc quyền
nội dung khác, hãy sử dụng [Yêu cầu về quyền nội dung](/vi/clawhub/content-rights).

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo skill, plugin và gói.

Chỉ sử dụng báo cáo của ClawHub cho nội dung không an toàn trên marketplace, chẳng hạn như:

- danh sách độc hại
- siêu dữ liệu gây hiểu lầm
- yêu cầu về thông tin xác thực hoặc quyền chưa được khai báo
- hướng dẫn cài đặt đáng ngờ
- mạo danh
- đăng ký có dụng ý xấu hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Quy định sử dụng chấp nhận được](/vi/clawhub/acceptable-usage)

Sử dụng nút **Report skill** trên trang của skill hoặc lệnh/API báo cáo gói
cho các gói.

Không sử dụng báo cáo của ClawHub cho các lỗ hổng trong mã nguồn riêng của một skill hoặc
plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà xuất bản hoặc kho lưu trữ mã nguồn
được liên kết từ danh sách. ClawHub không bảo trì hoặc vá
mã của skill hay plugin bên thứ ba.

GitHub Security Advisories dành cho `openclaw/clawhub` được dùng cho các lỗ hổng trong
chính ClawHub. Ví dụ bao gồm lỗi trong trang web, API, CLI, registry, xác thực,
quét, kiểm duyệt hoặc các ranh giới tin cậy khi tải xuống/cài đặt. Không sử dụng khuyến cáo của ClawHub
cho các lỗ hổng trong skill hoặc plugin bên thứ ba.

Báo cáo tốt phải cụ thể và có thể xử lý. Việc lạm dụng chức năng báo cáo cũng có thể dẫn đến
biện pháp xử lý tài khoản.

## Yêu cầu quyền sở hữu tổ chức và namespace

Các tranh chấp về quyền sở hữu tổ chức, thương hiệu, phạm vi gói, tên định danh chủ sở hữu hoặc namespace nên
sử dụng quy trình [Yêu cầu quyền sở hữu tổ chức và namespace](/clawhub/namespace-claims), thay vì
luồng báo cáo trong sản phẩm hoặc biểu mẫu khiếu nại tài khoản.

Sử dụng quy trình đó khi cần nhân viên ClawHub xem xét bằng chứng không nhạy cảm rằng một
namespace cần được bảo lưu, chuyển giao, đổi tên, ẩn, cách ly, tạo bí danh
hoặc xem xét theo cách khác. Không đưa bí mật, tài liệu riêng tư, hồ sơ pháp lý
riêng tư, giấy tờ định danh cá nhân, token API hoặc token xác minh DNS vào
một issue công khai.

## Tạm giữ để kiểm duyệt

Một số phát hiện nghiêm trọng hoặc vấn đề chính sách có thể khiến nhà xuất bản hoặc danh sách bị
tạm giữ để kiểm duyệt. Khi điều này xảy ra, nội dung bị ảnh hưởng có thể bị ẩn khỏi
khám phá công khai hoặc các lần xuất bản trong tương lai có thể bắt đầu ở trạng thái ẩn cho đến khi vấn đề được xem xét.

Lệnh tạm giữ để kiểm duyệt nhằm bảo vệ người dùng trong khi ClawHub giải quyết các trường hợp
có rủi ro cao. Lệnh này cũng có thể được gỡ bỏ khi xác nhận đó là kết quả dương tính giả.

## Danh sách bị ẩn hoặc chặn

Một danh sách có thể bị tạm giữ, ẩn, cách ly, thu hồi hoặc không khả dụng theo cách khác trên
các bề mặt cài đặt công khai.

Nếu thấy một trong các trạng thái này, không cài đặt bản phát hành trừ khi chủ sở hữu
giải quyết vấn đề hoặc bộ phận kiểm duyệt khôi phục bản phát hành đó.

Chủ sở hữu vẫn có thể thấy thông tin chẩn đoán cho các danh sách của họ đang bị tạm giữ hoặc ẩn. Những
thông tin chẩn đoán này giúp giải thích điều đã xảy ra và những gì cần thay đổi trước khi
danh sách có thể trở lại các bề mặt công khai.

## Lệnh cấm và trạng thái tài khoản

Các tài khoản vi phạm chính sách của ClawHub có thể mất quyền xuất bản. Hành vi lạm dụng nghiêm trọng có thể
dẫn đến tài khoản bị cấm, token bị thu hồi, nội dung bị ẩn hoặc danh sách bị xóa.
Các tín hiệu áp lực do hành vi lạm dụng của nhà xuất bản được kiểm tra hằng ngày. Những tín hiệu đạt đến
ngưỡng có khả năng bị cấm của ClawHub có thể kích hoạt cảnh báo tự động. Nếu lần
quét đủ điều kiện tiếp theo sau thời hạn cảnh báo vẫn xếp nhà xuất bản vào
ngưỡng có khả năng bị cấm, ClawHub có thể tự động áp dụng biện pháp xử lý tài khoản.
Các tín hiệu xem xét có độ tin cậy thấp hơn và bị giới hạn theo thời gian không được đưa vào quy trình
thực thi tự động.

Các tài khoản đã bị xóa, bị cấm hoặc bị vô hiệu hóa không thể sử dụng token API của ClawHub. Nếu xác thực CLI
bắt đầu thất bại sau khi tài khoản bị xử lý, hãy đăng nhập vào giao diện web để xem lại
trạng thái tài khoản. Nếu việc đăng nhập hoặc truy cập CLI thông thường bị chặn do tài khoản bị cấm hoặc vô hiệu hóa,
hãy sử dụng [biểu mẫu khiếu nại ClawHub](https://appeals.openclaw.ai/) để được xem xét khôi phục.

Nếu email do trình quét kích hoạt xác định một phiên bản skill hoặc plugin là độc hại,
hãy tải xuống kết quả quét đã lưu cho phiên bản gửi lên bị chặn:
`clawhub scan download <slug> --version <version>`. Đối với plugin, hãy thêm
`--kind plugin`. Xem lại kết quả quét, sửa danh sách, tăng số
phiên bản và tải phiên bản đã sửa lên.

## Hướng dẫn dành cho nhà xuất bản

Để giảm kết quả dương tính giả và tăng mức độ tin cậy của người dùng:

- duy trì độ chính xác của tên, bản tóm tắt, thẻ và nhật ký thay đổi
- khai báo các biến môi trường và quyền bắt buộc
- tránh các lệnh cài đặt bị làm rối
- liên kết đến mã nguồn khi có thể
- sử dụng chế độ chạy thử trước khi xuất bản plugin
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi của bản phát hành
