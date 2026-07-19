---
read_when:
    - Theo dõi tiếp sau phản hồi từ Barnacle hoặc ClawSweeper
    - Yêu cầu ClawSweeper review
    - Gỡ lỗi Barnacle, ClawSweeper, nhãn lỗi thời hoặc thao tác tự động đóng
sidebarTitle: PR review flow
summary: Cách phản hồi của Barnacle và ClawSweeper giúp đưa các pull request của OpenClaw tiến triển trong quá trình review.
title: Luồng review pull request
x-i18n:
    generated_at: "2026-07-19T05:57:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e9bec4578d55d2279450e991480467946db7da5ca956f85c35b4221190b2babe
    source_path: reference/pull-request-review-flow.md
    workflow: 16
---

Trang này giải thích luồng review sau khi bạn mở hoặc cập nhật một pull
request OpenClaw: Barnacle và ClawSweeper làm gì, cách cải thiện PR dựa trên
phản hồi của chúng, và những gì cần kiểm tra khi hệ thống tự động không phản hồi.

Barnacle và ClawSweeper giúp các maintainer duy trì hàng đợi review ở trạng thái có thể xử lý. Chúng
không thay thế phán đoán của maintainer.

## Barnacle

Barnacle là hệ thống phân loại GitHub có tính xác định. Nó tìm kiếm các trường hợp
quản lý hàng đợi đã biết và phản hồi bằng nhãn, bình luận hoặc thao tác đóng.

Barnacle có thể hành động khi:

- phần nội dung PR hầu như trống hoặc thiếu bối cảnh vấn đề;
- PR không có bằng chứng hữu ích;
- thay đổi chỉ liên quan đến tài liệu, kiểm thử, tái cấu trúc, CI hoặc hạ tầng thiếu bối cảnh
  maintainer được liên kết;
- thay đổi có vẻ phù hợp với ClawHub hoặc một plugin thay vì phần lõi;
- nhánh chứa công việc không liên quan;
- tác giả có hơn 20 PR đang mở.

Barnacle chạy từ mã quy trình làm việc đáng tin cậy của kho lưu trữ. Nó không checkout hoặc
chạy mã của người đóng góp.

Hầu hết các nhãn định tuyến là tín hiệu dành cho maintainer hoặc hệ thống tự động, vì vậy người đóng góp
không cần tự thêm nhãn.

## ClawSweeper

ClawSweeper là bot review và bảo trì có sự hỗ trợ của AI dành cho các kho lưu trữ
OpenClaw. Nó có thể review PR, đánh giá bằng chứng, để lại các bình luận review lâu dài
và hỗ trợ maintainer với các luồng sửa chữa hoặc tự động hợp nhất có biện pháp bảo vệ.

Kết quả ClawSweeper tích cực là bằng chứng hỗ trợ, không phải sự phê duyệt của maintainer.
Maintainer vẫn quyết định liệu PR đã sẵn sàng để hợp nhất hay chưa và khi nào thì hợp nhất.

ClawSweeper hoạt động theo hàng đợi. Đừng mong đợi phản hồi ngay sau khi mở
PR, đẩy commit hoặc thêm yêu cầu review. Việc cập nhật nhãn sau một lần chạy
ClawSweeper cũng có thể mất thời gian.

Các PR mới được đưa vào hàng đợi review của ClawSweeper. Maintainer cũng có thể đưa các luồng
review, sửa chữa hoặc tự động hợp nhất vào hàng đợi bằng nhãn hoặc lệnh. Đối với các cập nhật thông thường
của người đóng góp, chỉ yêu cầu ClawSweeper review lại sau khi bạn đã cập nhật
nhánh, mô tả PR, bằng chứng hoặc mã. Sau đó yêu cầu một lượt review mới bằng một
bình luận PR mới:

```text
@clawsweeper re-review
```

Tác giả PR cũng có thể dùng `@clawsweeper re-run`; người dùng có quyền ghi vào kho lưu trữ
có thể dùng một trong hai lệnh trên bất kỳ mục đang mở nào. Lệnh
`@clawsweeper review` thuần túy chỉ dành cho maintainer. Hãy kiên nhẫn: yêu cầu lại
trước khi có các thay đổi được yêu cầu chỉ làm tăng nhiễu trong hàng đợi.

Khi ClawSweeper để lại các cuộc hội thoại review, hãy xử lý chúng như phản hồi review
thông thường và sử dụng danh sách kiểm tra tiếp theo bên dưới.

Nếu một người đóng góp hoặc maintainer đã tiếp quản PR và đang tích cực
làm việc trên đó, đừng triệu gọi ClawSweeper hoặc thực hiện công việc khác trên PR cùng
lúc. Hãy để người đó hoàn thành việc review hoặc sửa chữa trước. Nếu hoạt động dừng lại, hãy kiểm tra
xem tác giả có được yêu cầu cung cấp bằng chứng hoặc thực hiện các cập nhật khác hay không.

## Cải thiện PR trong quá trình review

Sau khi Barnacle, ClawSweeper hoặc maintainer phản hồi, hãy dùng phản hồi đó làm
danh sách kiểm tra bước tiếp theo cho PR.

1. Đọc `Rank-up moves:` và `Proof guidance:` của ClawSweeper như danh sách hành động
   cho PR đó. Điểm đánh giá và nhãn là tín hiệu review, không phải mục tiêu hợp nhất cố định.
2. Đẩy thay đổi mã hoặc tài liệu được yêu cầu và cập nhật mô tả PR khi
   vấn đề, giải pháp, tác động đến người dùng hoặc bằng chứng đã thay đổi.
3. Thêm bằng chứng được yêu cầu, sử dụng bằng chứng phù hợp với thay đổi.
4. Tự giải quyết các cuộc hội thoại review đã được xử lý. Chỉ trả lời và để
   cuộc hội thoại ở trạng thái mở khi bạn cần phán đoán của maintainer hoặc người review.
5. Chỉ yêu cầu review lại sau khi nhánh, mô tả PR, bằng chứng và
   các kết quả CI liên quan đã được cập nhật. Nhiều chu kỳ cập nhật và review giữa
   tác giả, maintainer và ClawSweeper là điều bình thường.
6. Duy trì thảo luận trên PR khi có thể. Chỉ chuyển sang `#clawtributors` trên Discord
   khi PR cần sự phối hợp của maintainer, hệ thống tự động có vẻ bị chặn,
   hoặc quyết định tiếp theo khó giải quyết trong bình luận GitHub. Hãy cung cấp liên kết PR,
   trạng thái hiện tại và câu hỏi cụ thể hoặc bằng chứng còn thiếu.

Duy trì nội dung PR ở trạng thái cập nhật. Bình luận hữu ích cho việc thảo luận, nhưng mô tả
PR là bản tóm tắt lâu dài mà maintainer và hệ thống tự động sẽ xem lại.

`status: ⏳ waiting on author` có nghĩa là hành động tiếp theo thuộc về tác giả PR:
cập nhật nhánh, mô tả PR, bằng chứng hoặc trả lời với bối cảnh còn thiếu
trước khi yêu cầu một lượt review khác.

Bằng chứng hữu ích bao gồm đầu ra kiểm thử tập trung, kết quả CI, ảnh chụp màn hình,
bản ghi, đầu ra terminal, quan sát trực tiếp, nhật ký đã loại bỏ dữ liệu nhạy cảm hoặc liên kết
artifact. Đối với thay đổi trực quan, hãy cung cấp ảnh chụp màn hình trước và sau khi khả thi.
Đối với tệp bằng chứng, ưu tiên liên kết artifact CI, ảnh chụp màn hình hoặc
bản ghi được tải lên GitHub, hoặc một đoạn trích nhật ký ngắn đã loại bỏ dữ liệu nhạy cảm. Không commit các tệp bằng chứng
được tạo ra trừ khi chúng là một phần của thay đổi thực tế đối với tài liệu, kiểm thử hoặc sản phẩm.

Người đóng góp chịu trách nhiệm loại bỏ dữ liệu nhạy cảm. Hãy xóa secret,
token, URL riêng tư, dữ liệu người dùng và nhật ký không liên quan trước khi đăng bằng chứng.

OpenClaw cũng sử dụng hệ thống tự động riêng để xử lý mục cũ. Các issue và PR chưa được chỉ định có thể bị
đánh dấu là cũ sau 14 ngày không hoạt động, sau đó bị đóng sau 7 ngày không hoạt động nữa.
Các PR đã được chỉ định được đánh dấu là cũ sau 27 ngày kể từ khi mở, bất kể các
cập nhật sau đó, rồi bị đóng sau 7 ngày ở trạng thái cũ mà không có hoạt động. Nếu một PR đã được chỉ định
vẫn đang hoạt động, hãy phối hợp với maintainer đang làm việc trên PR đó.

## Khi hệ thống tự động không phản hồi

Hệ thống tự động có thể không phản hồi khi maintainer đã xử lý mục đó, một
yêu cầu review hoặc sửa chữa vẫn đang trong hàng đợi, sự kiện là thao tác thường lệ hoặc
luồng ClawSweeper chưa được cấu hình cho hành động được yêu cầu.

Nó cũng có thể không hành động khi một quy trình làm việc đáng tin cậy sẽ phải chạy mã không đáng tin cậy
của người đóng góp. Trong trường hợp đó, maintainer sẽ sử dụng quy trình review thông thường hoặc một
quy trình làm việc an toàn hơn.

## Khắc phục sự cố

Nếu ClawSweeper không phản hồi ngay lập tức, hãy chờ trước khi thử lại. Dịch vụ
hoạt động theo hàng đợi, và việc lặp lại bình luận hoặc thay đổi nhãn có thể khiến luồng thảo luận khó
review hơn mà không làm hàng đợi chạy nhanh hơn.

Trước khi yêu cầu trợ giúp, hãy kiểm tra:

- mô tả PR đã được cập nhật;
- commit mới nhất chứa thay đổi được yêu cầu;
- CI đã hoàn tất hoặc nội dung PR giải thích lý do mọi lỗi còn lại
  không liên quan đến PR;
- yêu cầu review mới nhất được gửi dưới dạng bình luận PR:
  `@clawsweeper re-review`;
- maintainer hoặc người đóng góp chưa tích cực làm việc trên PR;
- yêu cầu mới nhất không còn nằm trong khoảng trì hoãn thông thường của hàng đợi ClawSweeper.

Nếu vẫn không có phản hồi từ ClawSweeper sau vài giờ kể từ khi PR đã được cập nhật,
hoặc nếu PR có vẻ bị hệ thống tự động chặn, hãy hỏi trong `#clawtributors` trên Discord.
Hãy cung cấp liên kết PR, điều bạn mong đợi, thời điểm bạn yêu cầu và những gì đã thay đổi kể từ
bình luận cuối cùng của bot.

## Phân nhánh hệ thống tự động

Các dự án muốn có hệ thống tự động review tương tự có thể nghiên cứu hoặc phân nhánh ClawSweeper:

- [openclaw/clawsweeper](https://github.com/openclaw/clawsweeper)
- [Tài liệu ClawSweeper](https://clawsweeper.bot/)

## Liên quan

- [Đóng góp](https://github.com/openclaw/openclaw/blob/main/CONTRIBUTING.md)
- [Pipeline CI](/vi/ci)
