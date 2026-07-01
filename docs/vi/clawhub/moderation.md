---
read_when:
    - Báo cáo một Skills, Plugin hoặc gói
    - Khôi phục từ danh sách bị giữ, bị ẩn hoặc bị chặn
    - Hiểu về kiểm duyệt, lệnh cấm hoặc trạng thái tài khoản trên ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cách hoạt động của báo cáo ClawHub, tạm giữ kiểm duyệt, mục niêm yết bị ẩn, lệnh cấm và trạng thái tài khoản.
title: Kiểm duyệt và An toàn tài khoản
x-i18n:
    generated_at: "2026-07-01T13:06:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Kiểm duyệt và An toàn Tài khoản

ClawHub mở cho việc phát hành, nhưng các bề mặt khám phá công khai và cài đặt vẫn
cần có hàng rào bảo vệ. Báo cáo, giữ kiểm duyệt, danh sách bị ẩn và hành động tài khoản
giúp bảo vệ người dùng khi một bản phát hành hoặc tài khoản có vẻ không an toàn, gây hiểu lầm hoặc nằm ngoài
chính sách.

Trang này trình bày về kiểm duyệt và trạng thái tài khoản. Với các nhãn kiểm toán như
`Pass`, `Review`, `Warn`, `Malicious`, và mức rủi ro, xem
[Kiểm toán Bảo mật](/clawhub/security-audits).

Xem thêm [Bảo mật](/clawhub/security) và
[Cách sử dụng được chấp nhận](/clawhub/acceptable-usage). Với các mối quan ngại về bản quyền hoặc các quyền
nội dung khác, hãy dùng [Yêu cầu về Quyền Nội dung](/clawhub/content-rights).

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo skills, plugins và packages.

Chỉ dùng báo cáo ClawHub cho nội dung marketplace không an toàn, chẳng hạn như:

- danh sách độc hại
- siêu dữ liệu gây hiểu lầm
- thông tin xác thực hoặc yêu cầu quyền chưa khai báo
- hướng dẫn cài đặt đáng ngờ
- mạo danh
- đăng ký thiếu thiện chí hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Cách sử dụng được chấp nhận](/clawhub/acceptable-usage)

Dùng nút **Báo cáo skill** trên trang skill, hoặc lệnh/API báo cáo package
cho packages.

Không dùng báo cáo ClawHub cho lỗ hổng trong mã nguồn riêng của skill hoặc
plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà phát hành hoặc kho mã nguồn
được liên kết từ danh sách. ClawHub không duy trì hoặc vá mã của skill hoặc plugin
bên thứ ba.

GitHub Security Advisories cho `openclaw/clawhub` dành cho lỗ hổng trong chính
ClawHub. Ví dụ bao gồm lỗi trong website, API, CLI, registry, xác thực,
quét, kiểm duyệt hoặc ranh giới tin cậy tải xuống/cài đặt. Không dùng advisories của ClawHub
cho lỗ hổng trong skills hoặc plugins bên thứ ba.

Báo cáo tốt phải cụ thể và có thể hành động. Lạm dụng tính năng báo cáo cũng có thể dẫn đến
hành động tài khoản.

## Khiếu nại về tổ chức và namespace

Tranh chấp về quyền sở hữu tổ chức, thương hiệu, phạm vi package, owner-handle hoặc namespace nên
dùng quy trình [Khiếu nại về Tổ chức và Namespace](/clawhub/namespace-claims), không phải
luồng báo cáo trong sản phẩm hoặc biểu mẫu kháng nghị tài khoản.

Dùng quy trình đó khi bạn cần nhân viên ClawHub xem xét bằng chứng không nhạy cảm rằng một
namespace nên được giữ chỗ, chuyển giao, đổi tên, ẩn, cách ly, đặt bí danh,
hoặc được xem xét theo cách khác. Không đưa bí mật, tài liệu riêng tư, hồ sơ pháp lý riêng tư,
giấy tờ định danh cá nhân, API tokens hoặc DNS challenge tokens vào một
issue công khai.

## Giữ kiểm duyệt

Một số phát hiện nghiêm trọng hoặc vấn đề chính sách có thể đặt nhà phát hành hoặc danh sách vào trạng thái
giữ kiểm duyệt. Khi điều này xảy ra, nội dung bị ảnh hưởng có thể bị ẩn khỏi
khám phá công khai hoặc các lần phát hành sau có thể bắt đầu ở trạng thái ẩn cho đến khi vấn đề được xem xét.

Giữ kiểm duyệt nhằm bảo vệ người dùng trong khi ClawHub xử lý các trường hợp rủi ro cao.
Trạng thái này cũng có thể được gỡ bỏ khi xác nhận là dương tính giả.

## Danh sách bị ẩn hoặc bị chặn

Một danh sách có thể bị giữ, ẩn, cách ly, thu hồi hoặc không khả dụng theo cách khác trên
các bề mặt cài đặt công khai.

Nếu bạn thấy một trong các trạng thái này, đừng cài đặt bản phát hành trừ khi chủ sở hữu
giải quyết vấn đề hoặc kiểm duyệt khôi phục nó.

Chủ sở hữu vẫn có thể thấy chẩn đoán cho các danh sách của chính họ đang bị giữ hoặc bị ẩn. Các
chẩn đoán này giúp giải thích điều gì đã xảy ra và cần thay đổi gì trước khi
danh sách có thể quay lại các bề mặt công khai.

## Lệnh cấm và trạng thái tài khoản

Tài khoản vi phạm chính sách ClawHub có thể mất quyền phát hành. Lạm dụng nghiêm trọng có thể
dẫn đến cấm tài khoản, thu hồi token, nội dung bị ẩn hoặc danh sách bị gỡ.
Các tín hiệu áp lực lạm dụng của nhà phát hành được kiểm tra hằng ngày. Các tín hiệu đạt đến
ngưỡng có thể bị cấm của ClawHub có thể kích hoạt cảnh báo tự động. Nếu lượt quét đủ điều kiện tiếp theo
sau thời hạn cảnh báo vẫn đặt nhà phát hành trong ngưỡng có thể bị cấm,
ClawHub có thể tự động áp dụng hành động tài khoản.
Các tín hiệu đánh giá theo thời gian có độ tin cậy thấp hơn và có giới hạn sẽ không nằm trong
thực thi tự động.

Tài khoản đã xóa, bị cấm hoặc bị vô hiệu hóa không thể dùng ClawHub API tokens. Nếu xác thực CLI
bắt đầu thất bại sau hành động tài khoản, hãy đăng nhập vào giao diện web để xem lại
trạng thái tài khoản. Nếu đăng nhập hoặc truy cập CLI bình thường bị chặn do lệnh cấm hoặc tài khoản bị vô hiệu hóa,
hãy dùng [biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/) để được xem xét khôi phục.

Nếu email do trình quét kích hoạt nêu tên một phiên bản skill hoặc plugin là độc hại,
hãy tải xuống kết quả quét đã lưu cho phiên bản đã gửi bị chặn:
`clawhub scan download <slug> --version <version>`. Với plugins, thêm
`--kind plugin`. Xem lại đầu ra quét, sửa danh sách, tăng số phiên bản,
và tải lên phiên bản đã sửa.

## Hướng dẫn cho nhà phát hành

Để giảm dương tính giả và cải thiện niềm tin của người dùng:

- giữ tên, tóm tắt, thẻ và changelogs chính xác
- khai báo các biến môi trường và quyền bắt buộc
- tránh các lệnh cài đặt bị làm rối
- liên kết tới mã nguồn khi có thể
- dùng dry runs trước khi phát hành plugins
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi bản phát hành
