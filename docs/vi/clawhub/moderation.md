---
read_when:
    - Báo cáo một kỹ năng, plugin hoặc gói
    - Khôi phục từ một listing bị giữ lại, bị ẩn hoặc bị chặn
    - Tìm hiểu về kiểm duyệt, lệnh cấm hoặc trạng thái tài khoản trên ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cách hoạt động của báo cáo ClawHub, giữ lại để kiểm duyệt, mục niêm yết bị ẩn, lệnh cấm và trạng thái tài khoản.
title: Kiểm duyệt và An toàn Tài khoản
x-i18n:
    generated_at: "2026-07-02T01:00:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Kiểm duyệt và an toàn tài khoản

ClawHub mở cho việc xuất bản, nhưng các bề mặt khám phá công khai và cài đặt vẫn
cần rào chắn bảo vệ. Báo cáo, giữ kiểm duyệt, mục đăng bị ẩn và hành động tài khoản
giúp bảo vệ người dùng khi một bản phát hành hoặc tài khoản có vẻ không an toàn, gây hiểu lầm hoặc nằm ngoài
chính sách.

Trang này trình bày về kiểm duyệt và trạng thái tài khoản. Với các nhãn kiểm toán như
`Pass`, `Review`, `Warn`, `Malicious` và mức rủi ro, xem
[Kiểm toán bảo mật](/clawhub/security-audits).

Xem thêm [Bảo mật](/clawhub/security) và
[Sử dụng được chấp nhận](/clawhub/acceptable-usage). Với các lo ngại về bản quyền hoặc quyền nội dung
khác, dùng [Yêu cầu về quyền nội dung](/clawhub/content-rights).

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo Skills, plugins và gói.

Chỉ dùng báo cáo ClawHub cho nội dung chợ ứng dụng không an toàn, chẳng hạn như:

- mục đăng độc hại
- siêu dữ liệu gây hiểu lầm
- thông tin xác thực hoặc yêu cầu quyền chưa được khai báo
- hướng dẫn cài đặt đáng ngờ
- mạo danh
- đăng ký với ý đồ xấu hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Sử dụng được chấp nhận](/clawhub/acceptable-usage)

Dùng nút **Báo cáo skill** trên trang skill, hoặc lệnh/API báo cáo gói
cho các gói.

Không dùng báo cáo ClawHub cho lỗ hổng trong mã nguồn riêng của skill hoặc
plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà xuất bản hoặc kho mã nguồn
được liên kết từ mục đăng. ClawHub không bảo trì hoặc vá mã của skill hoặc plugin
bên thứ ba.

GitHub Security Advisories cho `openclaw/clawhub` dành cho các lỗ hổng trong chính
ClawHub. Ví dụ bao gồm lỗi trong trang web, API, CLI, sổ đăng ký, xác thực,
quét, kiểm duyệt hoặc ranh giới tin cậy khi tải xuống/cài đặt. Không dùng khuyến cáo
ClawHub cho lỗ hổng trong Skills hoặc plugins bên thứ ba.

Báo cáo tốt phải cụ thể và có thể xử lý. Việc lạm dụng báo cáo tự nó có thể dẫn đến
hành động tài khoản.

## Khiếu nại tổ chức và namespace

Tranh chấp về quyền sở hữu tổ chức, thương hiệu, phạm vi gói, định danh chủ sở hữu hoặc namespace nên
sử dụng quy trình [Khiếu nại tổ chức và namespace](/clawhub/namespace-claims), không phải
luồng báo cáo trong sản phẩm hoặc biểu mẫu kháng nghị tài khoản.

Dùng quy trình đó khi bạn cần nhân viên ClawHub xem xét bằng chứng không nhạy cảm rằng một
namespace nên được bảo lưu, chuyển giao, đổi tên, ẩn, cách ly, tạo bí danh
hoặc được xem xét theo cách khác. Không đưa bí mật, tài liệu riêng tư, hồ sơ pháp lý riêng tư,
giấy tờ định danh cá nhân, token API hoặc token thử thách DNS vào
vấn đề công khai.

## Giữ kiểm duyệt

Một số phát hiện nghiêm trọng hoặc vấn đề chính sách có thể đặt nhà xuất bản hoặc mục đăng vào trạng thái
giữ kiểm duyệt. Khi điều này xảy ra, nội dung bị ảnh hưởng có thể bị ẩn khỏi
khám phá công khai hoặc các lần xuất bản trong tương lai có thể bắt đầu ở trạng thái ẩn cho đến khi vấn đề được xem xét.

Giữ kiểm duyệt nhằm bảo vệ người dùng trong khi ClawHub xử lý các trường hợp rủi ro cao.
Chúng cũng có thể được gỡ bỏ khi xác nhận là dương tính giả.

## Mục đăng bị ẩn hoặc bị chặn

Một mục đăng có thể bị giữ, ẩn, cách ly, thu hồi hoặc không khả dụng theo cách khác trên
các bề mặt cài đặt công khai.

Nếu bạn thấy một trong các trạng thái này, đừng cài đặt bản phát hành trừ khi chủ sở hữu
giải quyết vấn đề hoặc kiểm duyệt khôi phục nó.

Chủ sở hữu vẫn có thể thấy chẩn đoán cho các mục đăng của chính họ đang bị giữ hoặc bị ẩn. Các
chẩn đoán này giúp giải thích điều gì đã xảy ra và cần thay đổi gì trước khi
mục đăng có thể quay lại các bề mặt công khai.

## Lệnh cấm và trạng thái tài khoản

Tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Lạm dụng nghiêm trọng có thể
dẫn đến cấm tài khoản, thu hồi token, nội dung bị ẩn hoặc mục đăng bị gỡ bỏ.
Các tín hiệu nguy cơ lạm dụng của nhà xuất bản được kiểm tra hằng ngày. Các tín hiệu đạt
ngưỡng có khả năng bị cấm của ClawHub có thể kích hoạt cảnh báo tự động. Nếu lần quét
đủ điều kiện tiếp theo sau hạn chót cảnh báo vẫn đặt nhà xuất bản trong
ngưỡng có khả năng bị cấm, ClawHub có thể tự động áp dụng hành động tài khoản.
Các tín hiệu đánh giá có độ tin cậy thấp hơn và có giới hạn theo thời gian không nằm trong
thực thi tự động.

Tài khoản đã xóa, bị cấm hoặc bị vô hiệu hóa không thể dùng token API ClawHub. Nếu xác thực CLI
bắt đầu thất bại sau hành động tài khoản, hãy đăng nhập vào giao diện web để xem lại trạng thái
tài khoản. Nếu việc đăng nhập hoặc truy cập CLI bình thường bị chặn bởi lệnh cấm hoặc tài khoản bị vô hiệu hóa,
hãy dùng [biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/) để được xem xét khôi phục.

Nếu email do trình quét kích hoạt nêu một phiên bản skill hoặc plugin là độc hại,
hãy tải xuống kết quả quét đã lưu cho phiên bản đã gửi bị chặn:
`clawhub scan download <slug> --version <version>`. Với plugins, thêm
`--kind plugin`. Xem lại đầu ra quét, sửa mục đăng, tăng số phiên bản
và tải lên phiên bản đã sửa.

## Hướng dẫn cho nhà xuất bản

Để giảm dương tính giả và cải thiện niềm tin của người dùng:

- giữ cho tên, tóm tắt, thẻ và nhật ký thay đổi chính xác
- khai báo các biến môi trường và quyền cần thiết
- tránh các lệnh cài đặt bị làm rối
- liên kết đến nguồn khi có thể
- dùng chạy thử trước khi xuất bản plugins
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi của bản phát hành
