---
read_when:
    - Báo cáo một skill, Plugin hoặc gói
    - Khôi phục từ một mục niêm yết bị giữ, ẩn hoặc chặn
    - Tìm hiểu về kiểm duyệt, lệnh cấm hoặc trạng thái tài khoản trên ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cách hoạt động của báo cáo ClawHub, trạng thái giữ để kiểm duyệt, danh sách bị ẩn, lệnh cấm và tình trạng tài khoản.
title: Kiểm duyệt và An toàn Tài khoản
x-i18n:
    generated_at: "2026-06-27T17:14:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Kiểm duyệt và an toàn tài khoản

ClawHub cho phép xuất bản rộng rãi, nhưng các bề mặt khám phá công khai và cài đặt vẫn
cần có biện pháp kiểm soát. Báo cáo, trạng thái giữ kiểm duyệt, danh sách bị ẩn và hành động đối với tài khoản
giúp bảo vệ người dùng khi một bản phát hành hoặc tài khoản có vẻ không an toàn, gây hiểu lầm hoặc nằm ngoài
chính sách.

Trang này đề cập đến kiểm duyệt và trạng thái tài khoản. Đối với các nhãn kiểm toán như
`Pass`, `Review`, `Warn`, `Malicious` và mức độ rủi ro, hãy xem
[Kiểm toán bảo mật](/vi/clawhub/security-audits).

Xem thêm [Bảo mật](/vi/clawhub/security) và
[Cách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage). Đối với các mối lo ngại về bản quyền hoặc quyền nội dung
khác, hãy dùng [Yêu cầu về quyền nội dung](/vi/clawhub/content-rights).

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo kỹ năng, Plugin và gói.

Chỉ dùng báo cáo ClawHub cho nội dung marketplace không an toàn, chẳng hạn như:

- danh sách độc hại
- siêu dữ liệu gây hiểu lầm
- thông tin xác thực hoặc yêu cầu quyền chưa khai báo
- hướng dẫn cài đặt đáng ngờ
- mạo danh
- đăng ký thiếu thiện chí hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Cách sử dụng được chấp nhận](/vi/clawhub/acceptable-usage)

Dùng nút **Báo cáo kỹ năng** trên trang kỹ năng, hoặc lệnh/API báo cáo gói
cho các gói.

Không dùng báo cáo ClawHub cho lỗ hổng trong mã nguồn riêng của kỹ năng hoặc
Plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà xuất bản hoặc kho nguồn
được liên kết từ danh sách. ClawHub không bảo trì hoặc vá mã kỹ năng hoặc Plugin
bên thứ ba.

GitHub Security Advisories cho `openclaw/clawhub` dành cho các lỗ hổng trong
chính ClawHub. Ví dụ bao gồm lỗi trong website, API, CLI, registry, xác thực,
quét, kiểm duyệt hoặc ranh giới tin cậy tải xuống/cài đặt. Không dùng advisory của ClawHub
cho lỗ hổng trong kỹ năng hoặc Plugin bên thứ ba.

Báo cáo tốt phải cụ thể và có thể hành động. Việc lạm dụng báo cáo cũng có thể dẫn đến
hành động đối với tài khoản.

## Khiếu nại tổ chức và namespace

Tranh chấp về quyền sở hữu tổ chức, thương hiệu, phạm vi gói, định danh chủ sở hữu hoặc namespace nên
dùng quy trình [Khiếu nại tổ chức và Namespace](/vi/clawhub/namespace-claims), không phải
luồng báo cáo trong sản phẩm hoặc biểu mẫu kháng nghị tài khoản.

Dùng quy trình đó khi bạn cần nhân viên ClawHub xem xét bằng chứng không nhạy cảm rằng một
namespace nên được giữ chỗ, chuyển giao, đổi tên, ẩn, cách ly, đặt bí danh
hoặc được xem xét theo cách khác. Không đưa bí mật, tài liệu riêng tư, hồ sơ pháp lý riêng tư,
giấy tờ tùy thân cá nhân, token API hoặc token thử thách DNS vào
một issue công khai.

## Giữ kiểm duyệt

Một số phát hiện nghiêm trọng hoặc vấn đề chính sách có thể khiến nhà xuất bản hoặc danh sách bị
giữ kiểm duyệt. Khi điều này xảy ra, nội dung bị ảnh hưởng có thể bị ẩn khỏi
khám phá công khai hoặc các lần xuất bản trong tương lai có thể bắt đầu ở trạng thái ẩn cho đến khi vấn đề được xem xét.

Giữ kiểm duyệt nhằm bảo vệ người dùng trong khi ClawHub xử lý các trường hợp rủi ro cao.
Trạng thái này cũng có thể được gỡ bỏ khi xác nhận đó là dương tính giả.

## Danh sách bị ẩn hoặc bị chặn

Một danh sách có thể bị giữ, ẩn, cách ly, thu hồi hoặc không khả dụng theo cách khác trên
các bề mặt cài đặt công khai.

Nếu bạn thấy một trong các trạng thái này, không cài đặt bản phát hành trừ khi chủ sở hữu
giải quyết vấn đề hoặc bộ phận kiểm duyệt khôi phục nó.

Chủ sở hữu vẫn có thể thấy chẩn đoán cho danh sách của chính họ đang bị giữ hoặc bị ẩn. Các
chẩn đoán này giúp giải thích điều gì đã xảy ra và cần thay đổi gì trước khi
danh sách có thể quay lại các bề mặt công khai.

## Lệnh cấm và trạng thái tài khoản

Tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Hành vi lạm dụng nghiêm trọng có thể
dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung hoặc xóa danh sách.
Các tín hiệu áp lực lạm dụng của nhà xuất bản được kiểm tra hằng ngày. Các tín hiệu đạt đến
ngưỡng có khả năng bị cấm của ClawHub có thể kích hoạt cảnh báo tự động. Nếu lần quét
đủ điều kiện tiếp theo sau thời hạn cảnh báo vẫn đặt nhà xuất bản trong
ngưỡng có khả năng bị cấm, ClawHub có thể tự động áp dụng hành động đối với tài khoản.
Các tín hiệu đánh giá có độ tin cậy thấp hơn và bị giới hạn theo thời gian không được đưa vào
thực thi tự động.

Tài khoản đã bị xóa, bị cấm hoặc bị vô hiệu hóa không thể dùng token API ClawHub. Nếu xác thực CLI
bắt đầu thất bại sau hành động đối với tài khoản, hãy đăng nhập vào giao diện web để xem xét
trạng thái tài khoản. Nếu việc đăng nhập hoặc quyền truy cập CLI thông thường bị chặn do lệnh cấm hoặc tài khoản bị vô hiệu hóa,
hãy dùng [biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/) để được xem xét khôi phục.

Nếu email do scanner kích hoạt nêu một phiên bản kỹ năng hoặc Plugin là độc hại,
hãy tải xuống kết quả quét đã lưu cho phiên bản đã gửi bị chặn:
`clawhub scan download <slug> --version <version>`. Đối với Plugin, thêm
`--kind plugin`. Xem lại đầu ra quét, sửa danh sách, tăng số phiên bản
và tải lên phiên bản đã sửa.

## Hướng dẫn cho nhà xuất bản

Để giảm dương tính giả và cải thiện niềm tin của người dùng:

- giữ tên, tóm tắt, thẻ và changelog chính xác
- khai báo các biến môi trường và quyền bắt buộc
- tránh các lệnh cài đặt bị làm rối
- liên kết đến nguồn khi có thể
- dùng chạy thử trước khi xuất bản Plugin
- phản hồi rõ ràng nếu người dùng hoặc kiểm duyệt viên hỏi về hành vi của bản phát hành
