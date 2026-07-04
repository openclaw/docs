---
read_when:
    - Đánh giá nội dung tải lên để phát hiện lạm dụng hoặc vi phạm chính sách
    - Viết tài liệu kiểm duyệt hoặc runbook cho người đánh giá
    - Quyết định liệu một skill có nên bị ẩn hay một người dùng bị cấm hay không
sidebarTitle: Acceptable Usage
summary: 'Chính sách kho ứng dụng: những gì ClawHub cho phép và những gì ClawHub sẽ không lưu trữ.'
title: Cách sử dụng được chấp nhận
x-i18n:
    generated_at: "2026-07-04T15:23:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Mức sử dụng được chấp nhận

ClawHub lưu trữ Skills, Plugin, gói và siêu dữ liệu chợ ứng dụng cho OpenClaw.
Dùng trang này để quyết định liệu nội dung hoặc hành vi phát hành có thuộc về
ClawHub hay không.

Các quy tắc này áp dụng cho việc một mục niêm yết làm gì, yêu cầu người dùng chạy
gì, tự thể hiện như thế nào, và cách nhà phát hành sử dụng các bề mặt khám phá,
cài đặt và tin cậy của ClawHub. Để biết các trạng thái kiểm duyệt và tình trạng
tài khoản, xem [Kiểm duyệt và an toàn tài khoản](/clawhub/moderation). Đối với
bản quyền hoặc các khiếu nại quyền khác, xem [Yêu cầu quyền nội dung](/vi/clawhub/content-rights).

## Nội dung được phép

ClawHub chào đón nội dung hữu ích, dễ hiểu và được phát hành với thiện chí.

| Danh mục                                         | Được phép khi                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Năng suất của nhà phát triển                     | Mục niêm yết giúp người dùng xây dựng, kiểm thử, di chuyển, gỡ lỗi, viết tài liệu hoặc vận hành phần mềm.                         |
| Quy trình UI, dữ liệu và tự động hóa             | Phạm vi rõ ràng, thông tin xác thực cần thiết được nêu minh bạch, và các hành động rủi ro có đường dẫn xem xét, chạy thử không thực thi, xem trước hoặc xác nhận. |
| Bảo mật phòng vệ, kiểm duyệt và rà soát lạm dụng | Công cụ được trình bày cho hoạt động rà soát được ủy quyền, bảo toàn bằng chứng và giữ rõ ranh giới phê duyệt của con người.      |
| Quy trình cá nhân hoặc nhóm                      | Quy trình sử dụng tài khoản dựa trên sự đồng ý, thiết lập minh bạch và quyền hạn rõ ràng.                                         |
| Danh mục được duy trì                            | Mỗi mục niêm yết riêng biệt, hữu ích, được mô tả chính xác và được duy trì hợp lý.                                                |

Ngữ cảnh rất quan trọng. Cùng một chủ đề có thể được chấp nhận trong bối cảnh
phòng vệ hẹp hoặc dựa trên sự đồng ý, và không được chấp nhận khi được đóng gói
thành quy trình lạm dụng.

## Nội dung không được phép

ClawHub không lưu trữ nội dung có mục đích chính là lạm dụng, lừa dối, thực thi
không an toàn hoặc xâm phạm quyền.

| Danh mục                                                    | Không được phép                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Truy cập trái phép hoặc vượt qua bảo mật                    | Vượt qua xác thực, chiếm đoạt tài khoản, lạm dụng giới hạn tốc độ, chiếm đoạt cuộc gọi trực tiếp hoặc agent, đánh cắp phiên có thể tái sử dụng, hoặc tự động phê duyệt luồng ghép nối cho người dùng chưa được phê duyệt.                                                                                   |
| Lạm dụng nền tảng và né tránh lệnh cấm                      | Tài khoản ẩn sau khi bị cấm, làm nóng hoặc nuôi tài khoản, tương tác giả, tự động hóa nhiều tài khoản, đăng hàng loạt, bot rác, hoặc tự động hóa được xây dựng để tránh bị phát hiện.                                                                                                                          |
| Gian lận, lừa đảo và quy trình tài chính gây hiểu lầm       | Chứng chỉ hoặc hóa đơn giả, luồng thanh toán gây hiểu lầm, tiếp cận lừa đảo, bằng chứng xã hội giả, quy trình danh tính tổng hợp phục vụ gian lận, hoặc công cụ chi tiêu/thu phí không có phê duyệt rõ ràng của con người.                                                                                   |
| Làm giàu dữ liệu xâm phạm quyền riêng tư hoặc giám sát      | Thu thập liên hệ để gửi rác, doxxing, theo dõi, trích xuất khách hàng tiềm năng đi kèm tiếp cận không được yêu cầu, giám sát bí mật, đối sánh sinh trắc học không có sự đồng ý, hoặc sử dụng dữ liệu bị rò rỉ hay gói dữ liệu từ sự cố xâm nhập.                                                              |
| Mạo danh không có sự đồng ý hoặc thao túng danh tính        | Hoán đổi khuôn mặt, bản sao số, người có ảnh hưởng được nhân bản, nhân cách giả, hoặc công cụ khác dùng để mạo danh hoặc gây hiểu lầm.                                                                                                                                                                         |
| Nội dung tình dục rõ ràng hoặc tạo nội dung người lớn đã tắt an toàn | Tạo hình ảnh, video hoặc nội dung NSFW; lớp bọc nội dung người lớn quanh API bên thứ ba; hoặc mục niêm yết có mục đích chính là nội dung tình dục rõ ràng.                                                                                                                                                       |
| Yêu cầu thực thi bị ẩn, không an toàn hoặc gây hiểu lầm      | Lệnh cài đặt bị làm rối, trình cài đặt chuyển thẳng vào shell như nội dung tải xuống chạy bằng `sh` hoặc `bash` mà không có khả năng xem xét rõ ràng, yêu cầu bí mật hoặc khóa riêng không được khai báo, thực thi `npx @latest` từ xa mà không có khả năng xem xét rõ ràng, hoặc siêu dữ liệu che giấu những gì mục niêm yết thật sự cần để chạy. |
| Tài liệu vi phạm bản quyền hoặc vi phạm quyền               | Tái phát hành Skills, Plugin, tài liệu, tài sản thương hiệu hoặc mã độc quyền của người khác mà không có quyền; vi phạm điều khoản giấy phép; hoặc mạo danh tác giả hay nhà phát hành gốc.                                                                                                                    |

## Hành vi chợ ứng dụng không được phép

ClawHub cũng rà soát cách nhà phát hành sử dụng chợ ứng dụng. Không dùng ClawHub
để thao túng khám phá, chỉ số, tín hiệu tin cậy, hệ thống kiểm duyệt hoặc sự chú
ý của người dùng.

Hành vi chợ ứng dụng không được phép bao gồm:

- phát hành hàng loạt số lượng lớn mục niêm yết sơ sài, trùng lặp, giữ chỗ hoặc
  do máy tạo ra mà không có vẻ mang lại giá trị thực cho người dùng
- làm ngập bề mặt tìm kiếm hoặc danh mục bằng các Skills hoặc Plugin gần như giống hệt nhau
- phát hành hàng trăm mục niêm yết có rất ít hoặc không có mức sử dụng, bảo trì,
  độ rõ ràng về nguồn, hoặc khác biệt có ý nghĩa
- thổi phồng giả tạo lượt cài đặt, tải xuống, sao hoặc các chỉ số tương tác khác
  thông qua tự động hóa, vòng lặp tự cài đặt, tài khoản giả, hoạt động phối hợp,
  tương tác trả phí hoặc hành vi phi tự nhiên khác
- tạo hoặc xoay vòng tài khoản để né tránh kiểm duyệt, lệnh cấm, giới hạn nhà phát hành hoặc
  rà soát chợ ứng dụng
- gây hiểu lầm cho người dùng về quyền sở hữu, nguồn, năng lực, trạng thái bảo mật,
  yêu cầu cài đặt hoặc quan hệ liên kết với dự án hay nhà phát hành khác
- liên tục tải lên nội dung đã bị ẩn, gỡ bỏ hoặc chặn
  mà không khắc phục vấn đề gốc

Phát hành với khối lượng lớn không tự động là lạm dụng. Các danh mục lớn được chấp nhận
khi các mục niêm yết khác biệt có ý nghĩa, được mô tả chính xác, được duy trì
và được người dùng thật sử dụng. Danh mục lớn trở thành vấn đề tin cậy và an toàn khi
khối lượng đi kèm các mục niêm yết mỏng, trùng lặp, gây hiểu lầm, không được duy trì hoặc
được quảng bá giả tạo.

## Quyền nội dung

Nếu bạn tin rằng nội dung trên ClawHub xâm phạm bản quyền hoặc các quyền khác của bạn, hãy dùng
[Yêu cầu quyền nội dung](/vi/clawhub/content-rights). Không dùng báo cáo chợ ứng dụng thông thường
cho khiếu nại bản quyền hoặc quyền, trừ khi mục niêm yết cũng không an toàn,
độc hại hoặc gây hiểu lầm.

## Rà soát và thực thi

ClawHub có thể dùng kiểm tra tự động, tín hiệu lạm dụng thống kê, báo cáo của người dùng và
rà soát của nhân viên để xác định nội dung không an toàn hoặc hành vi phát hành lạm dụng. Một tín hiệu
tự nó không chứng minh lạm dụng; nó giúp ClawHub quyết định điều gì cần được rà soát.

Chúng tôi có thể:

- ẩn, giữ lại, gỡ bỏ, xóa mềm, hoặc, khi loại tài nguyên hỗ trợ,
  xóa cứng các mục niêm yết vi phạm
- chặn tải xuống hoặc cài đặt đối với bản phát hành không an toàn
- thu hồi token API
- xóa mềm nội dung liên quan
- hạn chế quyền truy cập phát hành
- cấm người vi phạm lặp lại hoặc nghiêm trọng

Chúng tôi không bảo đảm sẽ cảnh báo trước khi thực thi đối với hành vi lạm dụng rõ ràng. Xem
[Kiểm duyệt và an toàn tài khoản](/clawhub/moderation) để biết về báo cáo, trạng thái giữ kiểm duyệt,
mục niêm yết bị ẩn, lệnh cấm và tình trạng tài khoản.
