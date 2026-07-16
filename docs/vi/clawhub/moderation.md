---
read_when:
    - Báo cáo một skill, plugin hoặc gói phần mềm
    - Khôi phục danh sách bị tạm giữ, ẩn hoặc chặn
    - Tìm hiểu về hoạt động kiểm duyệt, lệnh cấm hoặc trạng thái tài khoản trên ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cách hoạt động của tính năng báo cáo trên ClawHub, quy trình tạm giữ để kiểm duyệt, danh sách bị ẩn, lệnh cấm và trạng thái tài khoản.
title: Kiểm duyệt và An toàn Tài khoản
x-i18n:
    generated_at: "2026-07-16T14:10:44Z"
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
cần có biện pháp bảo vệ. Báo cáo, trạng thái tạm giữ để kiểm duyệt, mục niêm yết bị ẩn và hành động đối với tài khoản
giúp bảo vệ người dùng khi một bản phát hành hoặc tài khoản có vẻ không an toàn, gây hiểu lầm hoặc
không tuân thủ chính sách.

Trang này đề cập đến việc kiểm duyệt và trạng thái tài khoản. Đối với các nhãn kiểm tra như
`Pass`, `Review`, `Warn`, `Malicious` và mức độ rủi ro, hãy xem
[Kiểm tra bảo mật](/clawhub/security-audits).

Xem thêm [Bảo mật](/clawhub/security) và
[Quy định sử dụng chấp nhận được](/clawhub/acceptable-usage). Đối với các vấn đề về bản quyền hoặc quyền
nội dung khác, hãy sử dụng [Yêu cầu về quyền nội dung](/clawhub/content-rights).

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo skill, plugin và gói.

Chỉ sử dụng tính năng báo cáo của ClawHub cho nội dung không an toàn trên chợ ứng dụng, chẳng hạn như:

- mục niêm yết độc hại
- siêu dữ liệu gây hiểu lầm
- yêu cầu về thông tin xác thực hoặc quyền chưa được khai báo
- hướng dẫn cài đặt đáng ngờ
- mạo danh
- đăng ký với ý đồ xấu hoặc sử dụng sai nhãn hiệu
- nội dung vi phạm [Quy định sử dụng chấp nhận được](/clawhub/acceptable-usage)

Sử dụng nút **Báo cáo skill** trên trang của skill hoặc lệnh/API báo cáo
gói dành cho các gói.

Không sử dụng tính năng báo cáo của ClawHub cho các lỗ hổng trong mã nguồn riêng của skill hoặc
plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà xuất bản hoặc kho lưu trữ nguồn
được liên kết từ mục niêm yết. ClawHub không bảo trì hoặc vá
mã của skill hay plugin bên thứ ba.

GitHub Security Advisories dành cho `openclaw/clawhub` được dùng để báo cáo các lỗ hổng trong
chính ClawHub. Ví dụ bao gồm lỗi trong trang web, API, CLI, registry, xác thực,
quét, kiểm duyệt hoặc các ranh giới tin cậy khi tải xuống/cài đặt. Không sử dụng cảnh báo bảo mật của ClawHub
cho các lỗ hổng trong skill hoặc plugin bên thứ ba.

Báo cáo tốt cần cụ thể và có thể xử lý. Việc lạm dụng tính năng báo cáo cũng có thể dẫn đến
hành động đối với tài khoản.

## Yêu cầu xác lập tổ chức và namespace

Các tranh chấp về quyền sở hữu tổ chức, thương hiệu, phạm vi gói, định danh chủ sở hữu hoặc namespace nên
sử dụng quy trình [Yêu cầu xác lập tổ chức và namespace](/clawhub/namespace-claims), không sử dụng
luồng báo cáo trong sản phẩm hoặc biểu mẫu kháng nghị tài khoản.

Sử dụng quy trình đó khi cần nhân viên ClawHub xem xét bằng chứng không nhạy cảm cho thấy một
namespace nên được giữ chỗ, chuyển giao, đổi tên, ẩn, cách ly, đặt bí danh
hoặc xem xét theo cách khác. Không đưa bí mật, tài liệu riêng tư, hồ sơ pháp lý
riêng tư, giấy tờ nhận dạng cá nhân, token API hoặc token thử thách DNS vào
vấn đề công khai.

## Tạm giữ để kiểm duyệt

Một số phát hiện nghiêm trọng hoặc vấn đề chính sách có thể khiến nhà xuất bản hoặc mục niêm yết bị
tạm giữ để kiểm duyệt. Khi điều này xảy ra, nội dung bị ảnh hưởng có thể bị ẩn khỏi
kênh khám phá công khai hoặc các lần xuất bản sau có thể bắt đầu ở trạng thái ẩn cho đến khi vấn đề được xem xét.

Việc tạm giữ để kiểm duyệt nhằm bảo vệ người dùng trong khi ClawHub giải quyết các trường hợp
rủi ro cao. Trạng thái này cũng có thể được gỡ bỏ khi xác nhận đó là kết quả dương tính giả.

## Mục niêm yết bị ẩn hoặc chặn

Một mục niêm yết có thể bị tạm giữ, ẩn, cách ly, thu hồi hoặc không khả dụng theo cách khác trên
các bề mặt cài đặt công khai.

Nếu thấy một trong các trạng thái này, không cài đặt bản phát hành trừ khi chủ sở hữu
giải quyết vấn đề hoặc bộ phận kiểm duyệt khôi phục bản phát hành.

Chủ sở hữu vẫn có thể xem thông tin chẩn đoán cho các mục niêm yết bị tạm giữ hoặc ẩn của mình. Những
thông tin chẩn đoán này giúp giải thích điều gì đã xảy ra và cần thay đổi gì trước khi
mục niêm yết có thể trở lại các bề mặt công khai.

## Lệnh cấm và trạng thái tài khoản

Các tài khoản vi phạm chính sách của ClawHub có thể mất quyền xuất bản. Hành vi lạm dụng nghiêm trọng có thể
dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung hoặc gỡ bỏ mục niêm yết.
Các tín hiệu về áp lực lạm dụng từ nhà xuất bản được kiểm tra hằng ngày. Những tín hiệu đạt đến
ngưỡng có khả năng bị cấm của ClawHub có thể kích hoạt cảnh báo tự động. Nếu lần quét
đủ điều kiện tiếp theo sau thời hạn cảnh báo vẫn xếp nhà xuất bản vào
ngưỡng có khả năng bị cấm, ClawHub có thể tự động áp dụng hành động đối với tài khoản.
Các tín hiệu có độ tin cậy thấp hơn và tín hiệu xem xét theo thời gian có giới hạn không thuộc phạm vi
thực thi tự động.

Các tài khoản đã bị xóa, cấm hoặc vô hiệu hóa không thể sử dụng token API của ClawHub. Nếu xác thực CLI
bắt đầu thất bại sau hành động đối với tài khoản, hãy đăng nhập vào giao diện web để xem lại
trạng thái tài khoản. Nếu việc đăng nhập hoặc quyền truy cập CLI thông thường bị chặn do lệnh cấm hoặc tài khoản bị vô hiệu hóa,
hãy sử dụng [biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/) để yêu cầu xem xét khôi phục.

Nếu email do trình quét kích hoạt xác định một phiên bản skill hoặc plugin là độc hại,
hãy tải xuống kết quả quét đã lưu cho phiên bản gửi lên bị chặn:
`clawhub scan download <slug> --version <version>`. Đối với plugin, hãy thêm
`--kind plugin`. Xem lại kết quả quét, sửa mục niêm yết, tăng số
phiên bản và tải phiên bản đã sửa lên.

## Hướng dẫn dành cho nhà xuất bản

Để giảm kết quả dương tính giả và cải thiện niềm tin của người dùng:

- duy trì tính chính xác của tên, nội dung tóm tắt, thẻ và nhật ký thay đổi
- khai báo các biến môi trường và quyền bắt buộc
- tránh các lệnh cài đặt bị làm rối
- liên kết đến mã nguồn khi có thể
- sử dụng chế độ chạy thử trước khi xuất bản plugin
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi của bản phát hành
