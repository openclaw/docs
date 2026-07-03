---
read_when:
    - Báo cáo một skill, plugin hoặc gói
    - Khôi phục từ một mục niêm yết bị giữ, ẩn hoặc chặn
    - Tìm hiểu về kiểm duyệt, lệnh cấm hoặc trạng thái tài khoản trên ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cách hoạt động của báo cáo ClawHub, tạm giữ kiểm duyệt, mục niêm yết bị ẩn, lệnh cấm và trạng thái tài khoản.
title: Kiểm duyệt và An toàn tài khoản
x-i18n:
    generated_at: "2026-07-03T00:59:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Kiểm duyệt và an toàn tài khoản

ClawHub mở cho việc xuất bản, nhưng các bề mặt khám phá công khai và cài đặt vẫn
cần có rào chắn bảo vệ. Báo cáo, trạng thái giữ để kiểm duyệt, mục niêm yết bị ẩn, và hành động với tài khoản
giúp bảo vệ người dùng khi một bản phát hành hoặc tài khoản có vẻ không an toàn, gây hiểu lầm, hoặc không
tuân thủ chính sách.

Trang này đề cập đến kiểm duyệt và trạng thái tài khoản. Với các nhãn kiểm tra như
`Pass`, `Review`, `Warn`, `Malicious`, và mức rủi ro, xem
[Kiểm tra bảo mật](/clawhub/security-audits).

Xem thêm [Bảo mật](/clawhub/security) và
[Sử dụng được chấp nhận](/clawhub/acceptable-usage). Với các mối quan ngại về bản quyền hoặc quyền nội dung
khác, hãy dùng [Yêu cầu quyền nội dung](/clawhub/content-rights).

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo Skills, plugin, và gói.

Chỉ dùng báo cáo ClawHub cho nội dung marketplace không an toàn, chẳng hạn như:

- mục niêm yết độc hại
- siêu dữ liệu gây hiểu lầm
- thông tin xác thực hoặc yêu cầu quyền chưa khai báo
- hướng dẫn cài đặt đáng ngờ
- mạo danh
- đăng ký thiếu thiện chí hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Sử dụng được chấp nhận](/clawhub/acceptable-usage)

Dùng nút **Báo cáo Skills** trên trang Skills, hoặc lệnh/API báo cáo gói
cho các gói.

Không dùng báo cáo ClawHub cho lỗ hổng trong mã nguồn riêng của Skills hoặc
plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà xuất bản hoặc kho nguồn
được liên kết từ mục niêm yết. ClawHub không bảo trì hoặc vá
mã Skills hoặc plugin bên thứ ba.

GitHub Security Advisories cho `openclaw/clawhub` dành cho các lỗ hổng trong
chính ClawHub. Ví dụ bao gồm lỗi trong website, API, CLI, registry, auth,
quét, kiểm duyệt, hoặc các ranh giới tin cậy khi tải xuống/cài đặt. Không dùng advisory của ClawHub
cho lỗ hổng trong Skills hoặc plugin bên thứ ba.

Báo cáo tốt là báo cáo cụ thể và có thể hành động. Việc lạm dụng báo cáo tự nó cũng có thể dẫn đến
hành động với tài khoản.

## Khiếu nại về tổ chức và namespace

Các tranh chấp về quyền sở hữu tổ chức, thương hiệu, phạm vi gói, handle chủ sở hữu, hoặc namespace nên
sử dụng quy trình [Khiếu nại về tổ chức và namespace](/clawhub/namespace-claims), không phải
luồng báo cáo trong sản phẩm hoặc biểu mẫu kháng nghị tài khoản.

Dùng quy trình đó khi bạn cần nhân viên ClawHub xem xét bằng chứng không nhạy cảm rằng một
namespace nên được giữ chỗ, chuyển giao, đổi tên, ẩn, cách ly, đặt bí danh,
hoặc được xem xét theo cách khác. Không đưa bí mật, tài liệu riêng tư, hồ sơ pháp lý riêng tư,
giấy tờ định danh cá nhân, token API, hoặc token thử thách DNS vào một
issue công khai.

## Trạng thái giữ để kiểm duyệt

Một số phát hiện nghiêm trọng hoặc vấn đề chính sách có thể đặt nhà xuất bản hoặc mục niêm yết vào
trạng thái giữ để kiểm duyệt. Khi điều này xảy ra, nội dung bị ảnh hưởng có thể bị ẩn khỏi
khám phá công khai hoặc các lần xuất bản trong tương lai có thể bắt đầu ở trạng thái ẩn cho đến khi vấn đề được xem xét.

Trạng thái giữ để kiểm duyệt nhằm bảo vệ người dùng trong khi ClawHub xử lý các
trường hợp rủi ro cao. Chúng cũng có thể được gỡ bỏ khi xác nhận đó là cảnh báo sai.

## Mục niêm yết bị ẩn hoặc bị chặn

Một mục niêm yết có thể bị giữ, ẩn, cách ly, thu hồi, hoặc không khả dụng theo cách khác trên
các bề mặt cài đặt công khai.

Nếu bạn thấy một trong các trạng thái này, đừng cài đặt bản phát hành trừ khi chủ sở hữu
giải quyết vấn đề hoặc kiểm duyệt khôi phục nó.

Chủ sở hữu vẫn có thể thấy chẩn đoán cho các mục niêm yết bị giữ hoặc bị ẩn của chính họ. Các
chẩn đoán này giúp giải thích điều gì đã xảy ra và cần thay đổi gì trước khi
mục niêm yết có thể quay lại các bề mặt công khai.

## Lệnh cấm và trạng thái tài khoản

Các tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Lạm dụng nghiêm trọng có thể
dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung, hoặc xóa mục niêm yết.
Các tín hiệu áp lực lạm dụng của nhà xuất bản được kiểm tra hằng ngày. Những tín hiệu đạt
ngưỡng có thể cấm của ClawHub có thể kích hoạt cảnh báo tự động. Nếu lần quét
đủ điều kiện tiếp theo sau hạn cảnh báo vẫn đặt nhà xuất bản trong
ngưỡng có thể cấm, ClawHub có thể tự động áp dụng hành động với tài khoản.
Các tín hiệu đánh giá theo thời gian có độ tin cậy thấp hơn và có giới hạn sẽ không tham gia
thực thi tự động.

Tài khoản đã xóa, bị cấm, hoặc bị vô hiệu hóa không thể dùng token API ClawHub. Nếu xác thực CLI
bắt đầu lỗi sau hành động với tài khoản, hãy đăng nhập vào UI web để xem lại
trạng thái tài khoản. Nếu việc đăng nhập hoặc quyền truy cập CLI bình thường bị chặn do lệnh cấm hoặc tài khoản bị vô hiệu hóa,
hãy dùng [biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/) để được xem xét khôi phục.

Nếu email do trình quét kích hoạt nêu một phiên bản Skills hoặc plugin là độc hại,
hãy tải xuống kết quả quét đã lưu cho phiên bản đã gửi bị chặn:
`clawhub scan download <slug> --version <version>`. Với plugin, thêm
`--kind plugin`. Xem lại đầu ra quét, sửa mục niêm yết, tăng số phiên bản,
và tải lên phiên bản đã sửa.

## Hướng dẫn dành cho nhà xuất bản

Để giảm cảnh báo sai và cải thiện độ tin cậy với người dùng:

- giữ tên, tóm tắt, thẻ, và changelog chính xác
- khai báo các biến môi trường và quyền bắt buộc
- tránh các lệnh cài đặt bị làm rối
- liên kết đến nguồn khi có thể
- dùng chạy thử trước khi xuất bản plugin
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi của bản phát hành
