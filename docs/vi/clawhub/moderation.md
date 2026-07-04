---
read_when:
    - Báo cáo một skill, plugin hoặc gói
    - Khôi phục khỏi một listing bị giữ, bị ẩn hoặc bị chặn
    - Tìm hiểu về kiểm duyệt, lệnh cấm hoặc trạng thái tài khoản ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cách hoạt động của báo cáo trên ClawHub, tạm giữ kiểm duyệt, mục niêm yết bị ẩn, lệnh cấm và trạng thái tài khoản.
title: Kiểm duyệt và An toàn Tài khoản
x-i18n:
    generated_at: "2026-07-04T18:05:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Kiểm duyệt và an toàn tài khoản

ClawHub mở cho việc xuất bản, nhưng các bề mặt khám phá công khai và cài đặt vẫn
cần có rào chắn bảo vệ. Báo cáo, giữ kiểm duyệt, mục niêm yết bị ẩn và hành động
tài khoản giúp bảo vệ người dùng khi một bản phát hành hoặc tài khoản có vẻ không
an toàn, gây hiểu lầm hoặc vi phạm chính sách.

Trang này trình bày về kiểm duyệt và trạng thái tài khoản. Đối với các nhãn kiểm
toán như `Pass`, `Review`, `Warn`, `Malicious` và mức rủi ro, xem
[Kiểm toán bảo mật](/clawhub/security-audits).

Xem thêm [Bảo mật](/clawhub/security) và
[Mức sử dụng được chấp nhận](/clawhub/acceptable-usage). Đối với các mối quan ngại
về bản quyền hoặc quyền nội dung khác, hãy dùng [Yêu cầu quyền nội dung](/clawhub/content-rights).

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo Skills, Plugin và gói.

Chỉ dùng báo cáo ClawHub cho nội dung chợ không an toàn, chẳng hạn như:

- mục niêm yết độc hại
- siêu dữ liệu gây hiểu lầm
- thông tin xác thực hoặc yêu cầu quyền chưa khai báo
- hướng dẫn cài đặt đáng ngờ
- mạo danh
- đăng ký thiếu thiện chí hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Mức sử dụng được chấp nhận](/clawhub/acceptable-usage)

Dùng nút **Báo cáo Skill** trên trang Skill, hoặc lệnh/API báo cáo gói cho các gói.

Không dùng báo cáo ClawHub cho lỗ hổng trong mã nguồn riêng của Skill hoặc
Plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà phát hành hoặc kho mã nguồn được
liên kết từ mục niêm yết. ClawHub không bảo trì hoặc vá mã của Skill hoặc Plugin
bên thứ ba.

GitHub Security Advisories cho `openclaw/clawhub` dành cho các lỗ hổng trong
chính ClawHub. Ví dụ bao gồm lỗi trong trang web, API, CLI, registry, xác thực,
quét, kiểm duyệt hoặc ranh giới tin cậy tải xuống/cài đặt. Không dùng advisory
ClawHub cho lỗ hổng trong Skills hoặc Plugin bên thứ ba.

Báo cáo tốt cần cụ thể và có thể hành động. Việc lạm dụng báo cáo cũng có thể dẫn
đến hành động tài khoản.

## Yêu cầu xác nhận tổ chức và không gian tên

Tranh chấp về quyền sở hữu tổ chức, thương hiệu, phạm vi gói, định danh chủ sở
hữu hoặc không gian tên nên dùng quy trình [Yêu cầu xác nhận tổ chức và không gian tên](/clawhub/namespace-claims),
không dùng luồng báo cáo trong sản phẩm hoặc biểu mẫu kháng nghị tài khoản.

Dùng quy trình đó khi bạn cần nhân viên ClawHub xem xét bằng chứng không nhạy cảm
rằng một không gian tên nên được giữ riêng, chuyển giao, đổi tên, ẩn, cách ly,
đặt bí danh hoặc được xem xét theo cách khác. Không đưa bí mật, tài liệu riêng tư,
hồ sơ pháp lý riêng tư, giấy tờ định danh cá nhân, token API hoặc token thử thách
DNS vào issue công khai.

## Giữ kiểm duyệt

Một số phát hiện nghiêm trọng hoặc vấn đề chính sách có thể khiến nhà phát hành
hoặc mục niêm yết bị giữ kiểm duyệt. Khi điều này xảy ra, nội dung bị ảnh hưởng
có thể bị ẩn khỏi khám phá công khai hoặc các lần xuất bản trong tương lai có thể
bắt đầu ở trạng thái ẩn cho đến khi vấn đề được xem xét.

Giữ kiểm duyệt nhằm bảo vệ người dùng trong khi ClawHub xử lý các trường hợp rủi
ro cao. Trạng thái này cũng có thể được gỡ bỏ khi xác nhận đó là dương tính giả.

## Mục niêm yết bị ẩn hoặc bị chặn

Một mục niêm yết có thể bị giữ, ẩn, cách ly, thu hồi hoặc không khả dụng theo cách
khác trên các bề mặt cài đặt công khai.

Nếu bạn thấy một trong các trạng thái này, đừng cài đặt bản phát hành trừ khi chủ
sở hữu giải quyết vấn đề hoặc bộ phận kiểm duyệt khôi phục nó.

Chủ sở hữu vẫn có thể thấy chẩn đoán cho các mục niêm yết bị giữ hoặc bị ẩn của
chính họ. Các chẩn đoán này giúp giải thích điều gì đã xảy ra và cần thay đổi gì
trước khi mục niêm yết có thể quay lại các bề mặt công khai.

## Cấm và trạng thái tài khoản

Tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Lạm dụng nghiêm
trọng có thể dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung hoặc gỡ bỏ mục
niêm yết. Các tín hiệu áp lực lạm dụng của nhà phát hành được kiểm tra hằng ngày.
Những tín hiệu đạt ngưỡng có thể bị cấm của ClawHub có thể kích hoạt cảnh báo tự
động. Nếu lần quét đủ điều kiện tiếp theo sau hạn cảnh báo vẫn đặt nhà phát hành
trong ngưỡng có thể bị cấm, ClawHub có thể tự động áp dụng hành động tài khoản.
Các tín hiệu đánh giá tạm thời có độ tin cậy thấp hơn và có giới hạn sẽ không
được đưa vào thực thi tự động.

Tài khoản đã xóa, bị cấm hoặc bị vô hiệu hóa không thể dùng token API ClawHub. Nếu
xác thực CLI bắt đầu lỗi sau hành động tài khoản, hãy đăng nhập vào giao diện web
để xem trạng thái tài khoản. Nếu việc đăng nhập hoặc truy cập CLI thông thường bị
chặn do tài khoản bị cấm hoặc bị vô hiệu hóa, hãy dùng [biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/)
để được xem xét khôi phục.

Nếu email do trình quét kích hoạt nêu một phiên bản Skill hoặc Plugin là độc hại,
hãy tải kết quả quét đã lưu cho phiên bản đã gửi bị chặn:
`clawhub scan download <slug> --version <version>`. Đối với Plugin, thêm
`--kind plugin`. Xem xét đầu ra quét, sửa mục niêm yết, tăng số phiên bản và tải
lên phiên bản đã sửa.

## Hướng dẫn cho nhà phát hành

Để giảm dương tính giả và cải thiện niềm tin của người dùng:

- giữ tên, tóm tắt, thẻ và changelog chính xác
- khai báo các biến môi trường và quyền bắt buộc
- tránh các lệnh cài đặt bị làm rối
- liên kết đến mã nguồn khi có thể
- dùng chạy thử trước khi xuất bản Plugin
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi bản phát hành
