---
read_when:
    - Bạn cần một bản ghi lâu dài về những gì Gateway đã thực hiện mà không lưu trữ nội dung
    - Bạn đang quyết định có bật tính năng kiểm tra vòng đời tin nhắn hay không
    - Bạn cần giải thích hồ sơ kiểm toán chứng minh và không chứng minh được điều gì
summary: Lịch sử kiểm tra chỉ gồm siêu dữ liệu cho các lượt chạy tác nhân, thao tác công cụ và vòng đời tin nhắn được chủ động bật.
title: Lịch sử kiểm tra
x-i18n:
    generated_at: "2026-07-16T15:13:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1005b214a674f0f888d759837bd627be458cefcf9ed61bda722499333361dc45
    source_path: gateway/audit.md
    workflow: 16
---

# Lịch sử kiểm toán

Gateway duy trì một sổ cái kiểm toán có giới hạn, chỉ chứa siêu dữ liệu trong cơ sở dữ liệu trạng thái dùng chung của OpenClaw. Sổ cái này trả lời các câu hỏi vận hành như "tác tử nào đã chạy, vào lúc nào và kết thúc ra sao", "một lượt chạy đã thực thi những thao tác công cụ nào" và, khi tính năng kiểm toán tin nhắn được bật, "tin nhắn đến đã được chấp nhận có tới bước điều phối hay không" cũng như "tin nhắn đi có đạt trạng thái gửi cuối cùng hay không".

Sổ cái lưu trữ danh tính, thứ tự, nguồn gốc, hành động, trạng thái và các mã kết quả đã chuẩn hóa. Sổ cái không bao giờ lưu lời nhắc, nội dung tin nhắn, đối số công cụ, kết quả công cụ, tệp đính kèm, tên tệp, URL, đầu ra lệnh hoặc văn bản lỗi thô.

## Nhóm bản ghi

Các sự kiện lượt chạy và công cụ được ghi lại bất cứ khi nào tính năng kiểm toán được bật (mặc định). Các sự kiện vòng đời tin nhắn là tùy chọn và bị tắt theo mặc định.

| Nhóm             | Hành động                                                | Mặc định |
| ---------------- | -------------------------------------------------------- | -------- |
| Lượt chạy tác tử | `agent.run.started`, `agent.run.finished`                | bật      |
| Thao tác công cụ | `tool.action.started`, `tool.action.finished`            | bật      |
| Tin nhắn          | `message.inbound.processed`, `message.outbound.finished` | tắt      |

Mỗi bản ghi mang một mã định danh sự kiện ổn định, một số thứ tự sổ cái tăng đơn điệu, dấu thời gian vòng đời, tác nhân, hành động, trạng thái, `schemaVersion: 1` và `redaction: "metadata_only"`. Xem [Bản ghi kiểm toán](/cli/audit) để biết toàn bộ thông tin tham chiếu về trường và bộ lọc truy vấn.

## Sự kiện vòng đời tin nhắn

Đặt [`audit.messages`](/vi/gateway/configuration-reference#audit) để chọn nội dung được ghi lại, sau đó khởi động lại Gateway:

- `off` (mặc định): không có bản ghi tin nhắn.
- `direct`: chỉ các tin nhắn trong cuộc trò chuyện trực tiếp.
- `all`: tin nhắn trực tiếp, nhóm và kênh.

Hai ranh giới có thẩm quyền tạo ra các bản ghi tin nhắn:

- Các hàng **đến** được ghi khi một tin nhắn đã được chấp nhận tới bước điều phối lõi, bao gồm cả kết quả xử lý trùng lặp và kết quả xử lý cuối cùng.
- Các hàng **đi** được ghi khi quá trình gửi bền vững dùng chung đạt kết quả cuối cùng: đã gửi, bị chặn, thất bại hoặc một `unknown` rõ ràng đối với các lần gửi có trạng thái không rõ ràng do sự cố. Các kết quả khôi phục hàng đợi và hàng đợi thư chết cũng được bao gồm. Mỗi tải trọng phản hồi lô-gic ban đầu nhận được một hàng cuối cùng; việc chia khối và phân nhánh bộ điều hợp được tổng hợp vào `resultCount`.

### Phân loại kiểu cuộc trò chuyện

Chế độ `direct` là một ranh giới quyền riêng tư, vì vậy một tin nhắn chỉ được phân loại là cuộc trò chuyện trực tiếp khi các dữ kiện về đích chứng minh điều đó: đường dẫn gửi đã khai báo kiểu cuộc trò chuyện đích hoặc tuyến phiên gửi nêu chính xác kênh và đối tượng ngang hàng đang được gửi tới. Các tín hiệu yếu hơn, chẳng hạn như trạng thái chính sách hoặc cuộc trò chuyện khởi nguồn, có thể phân loại tin nhắn là `group` (loại tin nhắn đó khỏi việc thu thập `direct`) nhưng không bao giờ có thể khẳng định `direct`. Những tin nhắn không thể được chứng minh là trực tiếp được phân loại là `unknown` và không được ghi lại trong chế độ `direct`. Do đó, các kênh không khai báo loại trò chuyện có thể ghi ít hàng hơn trong chế độ `direct` so với chế độ `all`.

## Mô hình quyền riêng tư

Các hàng tin nhắn không bao giờ lưu mã định danh nền tảng thô. Khi có thể tương quan, mã định danh tài khoản, cuộc trò chuyện, tin nhắn và đích chỉ được xuất dưới dạng bút danh có khóa cục bộ theo bản cài đặt (`hmac-sha256:v1:<keyId>:<digest>`):

- Khóa HMAC được tạo trong lần sử dụng đầu tiên, được phân tách miền theo từng loại mã định danh và nằm trong cùng cơ sở dữ liệu trạng thái với sổ cái.
- Các bút danh ổn định trong phạm vi một bản cài đặt, vì vậy các hàng về cùng một cuộc trò chuyện có thể tương quan mà không làm lộ mã định danh nền tảng.
- Đây là **sự tương quan, không phải ẩn danh hóa**: bất kỳ ai có quyền đọc cơ sở dữ liệu trạng thái cũng có khóa và có thể kiểm tra các mã định danh thô ứng viên với bút danh. Các bản xuất RPC và CLI không bao giờ bao gồm khóa.
- Nếu vật liệu khóa bị thiếu hoặc hỏng trong khi các hàng tin nhắn vẫn được giữ lại, Gateway sẽ đóng khi gặp lỗi và loại bỏ các bản ghi tin nhắn mới thay vì âm thầm xoay vòng sang khóa mới, điều sẽ chia tách sự tương quan.

Các bản ghi lượt chạy và công cụ giữ lại `sessionKey` và `sessionId` để tương quan; bản thân các khóa phiên chuẩn tắc có thể chứa mã định danh tài khoản nền tảng hoặc đối tượng ngang hàng. Các bản ghi tin nhắn chủ ý bỏ qua cả hai.

Các bản xuất kiểm toán vẫn là siêu dữ liệu vận hành nhạy cảm ngay cả khi không có nội dung: thời gian, kênh, kết quả và bút danh ổn định có thể được dùng để tương quan hoạt động. Hãy bảo vệ các bản xuất bằng cùng biện pháp kiểm soát truy cập và thông lệ lưu giữ như những bản ghi khác của người vận hành.

## Giới hạn phạm vi bao phủ và bằng chứng

Sổ cái hoạt động theo nỗ lực tối đa và được giới hạn có chủ đích. Hãy coi sổ cái là bằng chứng về nội dung đã được ghi lại, không phải bằng chứng về những gì đã xảy ra:

- **Việc không có hàng nào không chứng minh được điều gì.** Các tin nhắn đến bị loại bỏ trước khi tiếp nhận, các lần gửi từ tiến trình CLI không có trình ghi Gateway đang chạy và các đường dẫn cục bộ của Plugin hoặc gửi trực tiếp bỏ qua cơ chế gửi bền vững dùng chung sẽ không để lại bản ghi.
- Các thao tác ghi đi qua một trình xử lý nền có giới hạn; lỗi trình xử lý hoặc hàng đợi bão hòa sẽ làm mất bản ghi và ghi một cảnh báo vận hành.
- Các lần gửi đi có trạng thái không rõ ràng do sự cố được ghi là `unknown` thay vì tạo ra các kết quả không có căn cứ.

Sổ cái này hỗ trợ gỡ lỗi và đánh giá vận hành. Đây không phải là kho lưu trữ tuân thủ không mất dữ liệu; nếu cần một kho như vậy, hãy sử dụng hệ thống bên ngoài nhận dữ liệu từ [OpenTelemetry](/vi/gateway/opentelemetry) hoặc công cụ cấp kênh.

## Lưu trữ, thời hạn lưu giữ và di chuyển

Các bản ghi nằm trong cơ sở dữ liệu trạng thái dùng chung (`state/openclaw.sqlite`) và được ghi ngoài đường dẫn nóng của quá trình gửi. Các truy vấn không bao giờ trả về bản ghi cũ hơn 30 ngày và sổ cái được giới hạn ở 100,000 hàng; các hàng hết hạn được dọn dẹp trong lúc khởi động, bảo trì hằng giờ và các lần ghi sau đó. Việc bảo trì lưu giữ vẫn tiếp tục chạy ngay cả khi tính năng thu thập bị tắt.

Khi nâng cấp từ Gateway có sổ cái trước đây chỉ dành cho lượt chạy/công cụ, lược đồ sẽ tự động được di chuyển lúc khởi động (hoặc thông qua `openclaw doctor --fix`); các hàng hiện có và số thứ tự sổ cái của chúng được giữ nguyên.

## Truy vấn

- CLI: [`openclaw audit`](/cli/audit) với các bộ lọc theo tác tử, phiên, lượt chạy, loại, trạng thái, hướng, kênh, giới hạn thời gian và phân trang bằng con trỏ.
- RPC của Gateway: `audit.activity.list` (yêu cầu `operator.read`) trả về hợp kiểu sự kiện hoạt động V1 có phiên bản; RPC `audit.list` đã phát hành không thay đổi đối với các máy khách lượt chạy/công cụ cũ hơn. Xem [Giao thức Gateway](/vi/gateway/protocol#audit-ledger-rpc).

## Liên quan

- [CLI bản ghi kiểm toán](/cli/audit)
- [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference#audit)
- [Giao thức Gateway](/vi/gateway/protocol#audit-ledger-rpc)
- [OpenTelemetry](/vi/gateway/opentelemetry)
