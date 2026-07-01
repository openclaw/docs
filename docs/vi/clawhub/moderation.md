---
read_when:
    - Báo cáo một skill, plugin hoặc gói
    - Khôi phục từ một mục niêm yết bị giữ, ẩn hoặc chặn
    - Tìm hiểu về việc kiểm duyệt, lệnh cấm hoặc trạng thái tài khoản trên ClawHub
sidebarTitle: Moderation and Account Safety
summary: Cách hoạt động của báo cáo trên ClawHub, các lượt giữ để kiểm duyệt, danh sách bị ẩn, lệnh cấm và tình trạng tài khoản.
title: Kiểm duyệt và An toàn Tài khoản
x-i18n:
    generated_at: "2026-07-01T20:23:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Kiểm duyệt và An toàn Tài khoản

ClawHub mở cho việc xuất bản, nhưng các bề mặt khám phá công khai và cài đặt vẫn
cần có rào chắn bảo vệ. Báo cáo, trạng thái giữ để kiểm duyệt, danh sách bị ẩn và
hành động đối với tài khoản giúp bảo vệ người dùng khi một bản phát hành hoặc tài
khoản có vẻ không an toàn, gây hiểu nhầm hoặc không tuân thủ chính sách.

Trang này đề cập đến kiểm duyệt và trạng thái tài khoản. Đối với các nhãn kiểm
toán như `Pass`, `Review`, `Warn`, `Malicious` và mức độ rủi ro, xem
[Kiểm toán Bảo mật](/clawhub/security-audits).

Xem thêm [Bảo mật](/clawhub/security) và
[Cách sử dụng được chấp nhận](/clawhub/acceptable-usage). Đối với các mối quan
ngại về bản quyền hoặc quyền nội dung khác, hãy dùng [Yêu cầu Quyền Nội dung](/clawhub/content-rights).

## Báo cáo

Người dùng đã đăng nhập có thể báo cáo Skills, plugin và gói.

Chỉ dùng báo cáo ClawHub cho nội dung marketplace không an toàn, chẳng hạn như:

- danh sách độc hại
- siêu dữ liệu gây hiểu nhầm
- thông tin xác thực hoặc yêu cầu quyền chưa được khai báo
- hướng dẫn cài đặt đáng ngờ
- mạo danh
- đăng ký thiếu thiện chí hoặc lạm dụng nhãn hiệu
- nội dung vi phạm [Cách sử dụng được chấp nhận](/clawhub/acceptable-usage)

Dùng nút **Báo cáo skill** trên trang skill, hoặc lệnh/API báo cáo gói cho các
gói.

Không dùng báo cáo ClawHub cho lỗ hổng trong mã nguồn riêng của skill hoặc
plugin bên thứ ba. Hãy báo cáo trực tiếp cho nhà xuất bản hoặc kho nguồn được
liên kết từ danh sách. ClawHub không duy trì hoặc vá mã skill hay plugin bên thứ
ba.

GitHub Security Advisories cho `openclaw/clawhub` dành cho các lỗ hổng trong
chính ClawHub. Ví dụ bao gồm lỗi trong trang web, API, CLI, sổ đăng ký, xác thực,
quét, kiểm duyệt hoặc các ranh giới tin cậy khi tải xuống/cài đặt. Không dùng
advisories của ClawHub cho lỗ hổng trong Skills hoặc plugin bên thứ ba.

Báo cáo tốt cần cụ thể và có thể hành động. Việc lạm dụng báo cáo cũng có thể
dẫn đến hành động đối với tài khoản.

## Khiếu nại về tổ chức và namespace

Tranh chấp quyền sở hữu tổ chức, thương hiệu, phạm vi gói, tên định danh chủ sở
hữu hoặc namespace nên dùng quy trình [Khiếu nại về Tổ chức và Namespace](/clawhub/namespace-claims),
không dùng luồng báo cáo trong sản phẩm hoặc biểu mẫu kháng nghị tài khoản.

Dùng quy trình đó khi bạn cần nhân viên ClawHub xem xét bằng chứng không nhạy cảm
rằng một namespace nên được giữ trước, chuyển giao, đổi tên, ẩn, cách ly, đặt bí
danh hoặc xem xét theo cách khác. Không đưa bí mật, tài liệu riêng tư, hồ sơ pháp
lý riêng tư, giấy tờ định danh cá nhân, token API hoặc token thử thách DNS vào
một issue công khai.

## Trạng thái giữ để kiểm duyệt

Một số phát hiện nghiêm trọng hoặc vấn đề chính sách có thể đặt nhà xuất bản
hoặc danh sách vào trạng thái giữ để kiểm duyệt. Khi điều này xảy ra, nội dung bị
ảnh hưởng có thể bị ẩn khỏi khám phá công khai hoặc các lần xuất bản trong tương
lai có thể bắt đầu ở trạng thái ẩn cho đến khi vấn đề được xem xét.

Trạng thái giữ để kiểm duyệt nhằm bảo vệ người dùng trong khi ClawHub giải quyết
các trường hợp rủi ro cao. Chúng cũng có thể được gỡ bỏ khi xác nhận đó là báo
động giả.

## Danh sách bị ẩn hoặc bị chặn

Một danh sách có thể bị giữ, ẩn, cách ly, thu hồi hoặc không khả dụng theo cách
khác trên các bề mặt cài đặt công khai.

Nếu bạn thấy một trong các trạng thái này, đừng cài đặt bản phát hành trừ khi chủ
sở hữu giải quyết vấn đề hoặc kiểm duyệt khôi phục nó.

Chủ sở hữu vẫn có thể thấy chẩn đoán cho danh sách bị giữ hoặc bị ẩn của chính
họ. Các chẩn đoán này giúp giải thích điều đã xảy ra và những gì cần thay đổi
trước khi danh sách có thể quay lại các bề mặt công khai.

## Lệnh cấm và trạng thái tài khoản

Tài khoản vi phạm chính sách ClawHub có thể mất quyền xuất bản. Lạm dụng nghiêm
trọng có thể dẫn đến cấm tài khoản, thu hồi token, ẩn nội dung hoặc xóa danh
sách. Các tín hiệu áp lực lạm dụng của nhà xuất bản được kiểm tra hằng ngày. Tín
hiệu đạt ngưỡng có thể bị cấm của ClawHub có thể kích hoạt cảnh báo tự động. Nếu
lượt quét đủ điều kiện tiếp theo sau hạn cảnh báo vẫn đặt nhà xuất bản trong
ngưỡng có thể bị cấm, ClawHub có thể tự động áp dụng hành động đối với tài khoản.
Các tín hiệu đánh giá theo thời gian có độ tin cậy thấp hơn và có giới hạn không
được đưa vào thực thi tự động.

Tài khoản đã xóa, bị cấm hoặc bị vô hiệu hóa không thể dùng token API của
ClawHub. Nếu xác thực CLI bắt đầu thất bại sau hành động đối với tài khoản, hãy
đăng nhập vào giao diện web để xem trạng thái tài khoản. Nếu việc đăng nhập hoặc
truy cập CLI thông thường bị chặn do lệnh cấm hoặc tài khoản bị vô hiệu hóa, hãy
dùng [biểu mẫu kháng nghị ClawHub](https://appeals.openclaw.ai/) để được xem xét
khôi phục.

Nếu email do trình quét kích hoạt nêu một phiên bản skill hoặc plugin là độc hại,
hãy tải xuống kết quả quét đã lưu cho phiên bản đã gửi bị chặn:
`clawhub scan download <slug> --version <version>`. Đối với plugin, thêm
`--kind plugin`. Xem lại đầu ra quét, sửa danh sách, tăng số phiên bản và tải lên
phiên bản đã sửa.

## Hướng dẫn cho nhà xuất bản

Để giảm báo động giả và cải thiện niềm tin của người dùng:

- giữ tên, tóm tắt, thẻ và changelog chính xác
- khai báo các biến môi trường và quyền bắt buộc
- tránh các lệnh cài đặt bị làm rối
- liên kết đến nguồn khi có thể
- dùng chạy thử trước khi xuất bản plugin
- phản hồi rõ ràng nếu người dùng hoặc người kiểm duyệt hỏi về hành vi của bản phát hành
