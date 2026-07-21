---
read_when:
    - Gỡ lỗi chế độ xem WebChat trên máy Mac hoặc cổng loopback
summary: Cách ứng dụng Mac nhúng WebChat của Gateway và cách gỡ lỗi ứng dụng này
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-21T13:32:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 222b2ffe3951a499b3d20e2219ac5bf6ec7b3ea894d64d251cbffd909a25f387
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Ứng dụng trên thanh menu macOS nhúng giao diện WebChat dưới dạng một chế độ xem SwiftUI gốc. Ứng dụng kết nối với Gateway và mặc định sử dụng phiên chính của tác nhân đã chọn (`main`, hoặc `global` khi `session.scope` là `global`).

Cửa sổ trò chuyện đầy đủ là một chế độ xem phân chia gốc:

- **Thanh bên phiên**: danh sách phiên có thể tìm kiếm, gồm các phần đã ghim, nhóm được Gateway hỗ trợ và gần đây. Các phiên con được tạo sẽ lồng bên dưới phiên cha trong từng phần; các phiên cha đã thu gọn sẽ tóm tắt các phiên con đang chạy, thất bại và chưa đọc. Menu ngữ cảnh hỗ trợ xem thông tin phiên, đổi tên, ghim, phân nhánh, đánh dấu đã đọc/chưa đọc, lưu trữ/khôi phục, sao chép khóa phiên và xóa. Thao tác tạo phiên mới chính (hoặc Shift-Cmd-N) tạo ngay lập tức qua `sessions.create`; cửa sổ bật lên tùy chọn liền kề cho phép chọn tác nhân và yêu cầu một worktree được quản lý với ref cơ sở tùy chọn.
- **Thanh công cụ cửa sổ**: vòng hiển thị mức sử dụng ngữ cảnh (token và chi phí phiên, kèm một thao tác thu gọn), các điều khiển mô hình và menu thao tác phiên. Các mô hình được nhóm theo nhà cung cấp, với nhà cung cấp mặc định ở đầu, còn các mô hình đã ghim và gần đây vẫn nằm trên cùng. Các điều khiển có thể kế thừa hoặc ghi đè mức suy luận của mô hình, chọn độ chi tiết của lệnh gọi công cụ và bật hoặc tắt phản hồi Nhanh. Menu có thể đổi tên hoặc phân nhánh phiên hiện tại và cập nhật trạng thái ghim, đã đọc hoặc lưu trữ của phiên. **Các phiên…** (Shift-Cmd-S) mở trình quản lý Đang hoạt động/Đã lưu trữ để tìm kiếm qua Gateway, quản lý nhóm, kiểm tra phiên, đổi tên, ghim, lưu trữ và khôi phục. Chế độ chọn áp dụng thao tác ghim, bỏ ghim, lưu trữ hoặc xóa cho nhiều phiên đang hoạt động, đồng thời vẫn hiển thị từng lỗi riêng lẻ. Các dấu kiểm riêng trong menu hiển thị hoặc ẩn quá trình suy luận của trợ lý và hoạt động công cụ; cả hai đều được bật theo mặc định và được ghi nhớ giữa các lần khởi chạy.
- **Bản ghi và trình soạn thảo**: tin nhắn của trợ lý được hiển thị dưới dạng văn bản thuần cùng ảnh đại diện, còn tin nhắn của người dùng dưới dạng bong bóng màu nhấn. Các câu hỏi đang chờ từ tác nhân được hiển thị dưới dạng thẻ gốc với tùy chọn chọn một hoặc nhiều mục, câu trả lời **Khác** dạng văn bản tự do, đồng hồ đếm ngược thời gian hết hạn và trạng thái kết thúc dùng chung. Các cuộc trò chuyện trống cung cấp lời nhắc khởi đầu trên máy tính. Khi nhập `/`, tính năng tự động hoàn thành lệnh gạch chéo dựa trên `commands.list` sẽ mở ra, hỗ trợ điều hướng bằng các phím mũi tên/Tab/Return/Escape. Nhấp chuột phải vào một tin nhắn để sao chép Markdown hiển thị của tin nhắn đó mà không bao gồm phần suy luận ẩn. Các tin nhắn trợ lý bị cắt bớt cũng cung cấp tùy chọn **Mở toàn bộ tin nhắn**, thao tác này tải một trình đọc Markdown cho phép chọn văn bản. Dùng **Nghe** để sử dụng TTS qua Gateway, với tính năng đọc cục bộ làm phương án dự phòng.
- **Điều khiển giọng nói**: trình soạn thảo có thể bắt đầu hoặc dừng Chế độ trò chuyện hiện có của macOS mà không thay thế lớp phủ trên thanh menu. Khi Chế độ trò chuyện đang hoạt động, trình soạn thảo hiển thị trạng thái đang nghe/đang suy luận/đang nói, hoạt động âm thanh trực tiếp và bản ghi cuộn có thể mở rộng. Nhấp chuột phải vào nút Trò chuyện để chọn **Mặc định hệ thống** hoặc một micrô đang kết nối; đây cũng là lựa chọn micrô được Voice Wake và tính năng nhấn để nói sử dụng. Nếu micrô đã chọn bị ngắt kết nối, phiên Trò chuyện đang hoạt động sẽ chuyển về mặc định hệ thống và thử lại lựa chọn đó vào lần tiếp theo Chế độ trò chuyện khởi động. Một thao tác micrô riêng sẽ ghi âm ghi chú thoại khi Chế độ trò chuyện không kiểm soát việc thu âm.

Bảng trò chuyện thu gọn được neo từ thanh menu vẫn giữ bố cục một cột nhỏ gọn, với cùng các điều khiển mô hình, suy luận, độ chi tiết và Nhanh được đặt nội tuyến, cùng với lời nhắc khởi đầu, Chế độ trò chuyện, ghi chú thoại và Nghe. Quá trình suy luận của trợ lý và hoạt động công cụ vẫn bị ẩn trên giao diện thu gọn này.

## Nhiều cửa sổ Gateway

Mở **Cài đặt → Gateway** để thêm hoặc xóa các hồ sơ Gateway có thể tái sử dụng. Mỗi
hồ sơ chứa một điểm cuối `ws://` hoặc `wss://` cùng token hoặc
mật khẩu tùy chọn; thông tin xác thực được lưu trong Chuỗi khóa macOS. Việc xóa một hồ sơ
cũng đóng các cửa sổ đang mở của hồ sơ đó và ngắt kết nối phụ của hồ sơ.

Chọn **Tệp → Cửa sổ Gateway mới…** hoặc nhấn Cmd-N, sau đó chọn một trong các
hồ sơ đã lưu đó. Trình chọn ghi nhớ hồ sơ được sử dụng gần đây nhất. Mỗi
lựa chọn tạo một cửa sổ độc lập mới, vì vậy cùng một Gateway có thể xuất hiện trong
nhiều cửa sổ với các phiên đang hoạt động và trạng thái điều hướng khác nhau.

Mỗi hồ sơ đã lưu sở hữu một kết nối Gateway dùng chung, phạm vi xác thực thiết bị,
bộ nhớ đệm bản ghi, hộp thư đi ngoại tuyến và các lease định tuyến. Các cửa sổ của hồ sơ đó
tái sử dụng những tài nguyên này trong khi vẫn có thể được điều hướng độc lập. Các cửa sổ của
những hồ sơ khác nhau vẫn kết nối và chạy trò chuyện đồng thời.

Gateway được cấu hình của ứng dụng trên thanh menu vẫn là chủ sở hữu các khả năng của Node Mac
và Chế độ trò chuyện. Các cửa sổ Gateway bổ sung chỉ dành cho người vận hành, vì vậy
Gateway thứ hai không thể âm thầm chuyển hướng các điều khiển micrô hoặc thiết bị toàn cục.
Nghe/TTS và các thao tác trò chuyện thông thường sử dụng kết nối Gateway riêng của cửa sổ.

## Thanh Trò chuyện nhanh

Nhấn Option-Space (⌥Space) hoặc chọn **Trò chuyện nhanh** từ menu trên thanh menu để mở một trình soạn thảo nổi cho phiên chính. Thay đổi phím tắt toàn cục bằng trình ghi phím trong **Cài đặt → Chung → Phím tắt Trò chuyện nhanh**.

Trò chuyện nhanh hiển thị tác nhân đích (ảnh đại diện hoặc emoji, với tên tác nhân làm văn bản giữ chỗ) và gửi tới phiên chính của tác nhân đó. Sau khi Return xác nhận gửi, thanh này vẫn mở và mở rộng xuống dưới với phản hồi Markdown được truyền trực tiếp cùng bản ghi gần đây. Trường nhập của thanh vẫn là trình soạn thảo. Nhấn Command-Return để gửi và mở cùng đích đó trong cửa sổ trò chuyện đầy đủ, Shift-Return để xuống dòng hoặc Escape để đóng toàn bộ thanh và vùng phản hồi. Nhấp ra bên ngoài cũng sẽ đóng thanh. Khi thiếu các quyền macOS liên quan, một dải đính kèm cung cấp các thao tác **Cấp quyền** và **Để sau**.

Dùng nút micrô để đọc chính tả vào trình soạn thảo. Kết quả giọng nói từng phần thay thế trực tiếp đoạn được đọc chính tả, đồng thời giữ nguyên văn bản đã có trong trình soạn thảo. Nhấn lại nút, Return hoặc Escape để dừng; việc gửi, ẩn hoặc bỏ lấy nét Trò chuyện nhanh cũng giải phóng micrô. Lần sử dụng đầu tiên sẽ yêu cầu quyền truy cập Micrô và Nhận dạng giọng nói của macOS.

Điều khiển mô hình thu gọn hiển thị mô hình và mức suy luận hiện tại của phiên đích. Việc chọn mô hình sẽ cập nhật phiên đó và do đó được duy trì tại đó, còn lựa chọn suy luận chỉ áp dụng cho từng tin nhắn được gửi từ lần hiển thị Trò chuyện nhanh hiện tại. Các lựa chọn cục bộ được đặt lại khi thanh bị ẩn. Việc chuyển tác nhân hoặc chọn một phiên gần đây vẫn giữ các lựa chọn rõ ràng nhưng tải lại trạng thái mô hình nền của phiên mới được nhắm tới.

Nhấp vào nút lịch sử để chọn trong năm phiên được cập nhật gần đây nhất hoặc quay lại **Tin nhắn mới tới &lt;agent&gt;**. Việc chọn một phiên gần đây sẽ gửi tới chính xác phiên đó và thay đổi văn bản giữ chỗ thành **Trả lời trong &lt;session&gt;**. Việc ẩn Trò chuyện nhanh sẽ đặt lại đích tạm thời này về phiên chính của tác nhân đã chọn; chuyển tác nhân từ menu ảnh đại diện cũng xóa đích này.

Command-Return mở cuộc trò chuyện của tác nhân đã nhận nội dung gửi, kể cả khi phạm vi phiên là toàn cục.

Nút camera mở menu cho **Chụp cửa sổ…** hoặc **Chụp vùng…**. Tính năng chụp cửa sổ gắn nhãn cho mọi cửa sổ đang hiển thị; tính năng chụp vùng làm tối từng màn hình trong khi bạn kéo chọn một vùng và hiển thị kích thước trực tiếp của vùng đó. Ảnh chụp màn hình đã chọn được gửi tới tác nhân được chọn, với mọi văn bản đã nhập làm chú thích. Lần sử dụng đầu tiên sẽ yêu cầu quyền Ghi màn hình của macOS. Nhấn Escape, nhấp vào vùng trống hoặc nhấp mà không kéo chọn một vùng có ý nghĩa sẽ hủy thao tác.

Dùng nút văn bản tài liệu để đính kèm văn bản từ cửa sổ đang được lấy nét của ứng dụng đang được lấy nét. Trò chuyện nhanh hiển thị kết quả dưới dạng một chip ngữ cảnh có thể xóa thay vì đặt văn bản đã thu thập vào trình soạn thảo; khi gửi, văn bản của chip được nối vào tin nhắn gửi đi rồi chip được xóa. Tính năng này yêu cầu quyền Trợ năng của macOS. Văn bản đính kèm cũng bị xóa mỗi khi Trò chuyện nhanh đóng, vì vậy ngữ cảnh từ một lần hiển thị không thể rò rỉ vào lần gửi sau.

Sau khi phản hồi hoàn tất, chọn **Dán vào &lt;app&gt;** để sao chép văn bản trợ lý hiển thị, không bao gồm phần suy luận ẩn, vào bảng nhớ tạm chung rồi dán vào ứng dụng đang ở phía trước. Tính năng này yêu cầu quyền Trợ năng của macOS. Thao tác này thay thế nội dung hiện tại của bảng nhớ tạm rồi ẩn Trò chuyện nhanh.

Tắt hoàn toàn tính năng bằng **Cài đặt → Chung → Trò chuyện nhanh**; cùng phần này cũng chứa trình ghi phím tắt.

- **Chế độ cục bộ**: kết nối trực tiếp với WebSocket của Gateway cục bộ.
- **Chế độ từ xa**: chuyển tiếp cổng điều khiển Gateway qua SSH và sử dụng đường hầm đó làm mặt phẳng dữ liệu.

## Khởi chạy và gỡ lỗi

- Thủ công: menu Lobster -> "Mở trò chuyện".
- Tự động mở để kiểm thử:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` được chấp nhận làm bí danh cũ.)

- Nhật ký: `./scripts/clawlog.sh` (hệ thống con `ai.openclaw`, danh mục `WebChatSwiftUI`).

## Cách hệ thống được kết nối

- Mặt phẳng dữ liệu: các phương thức Gateway WS `chat.history`, `chat.message.get`, `chat.send`, `chat.abort`, `chat.inject`, cùng `question.list` và `question.resolve`, và các sự kiện `chat`, `agent`, `presence`, `tick`, `health`; các thẻ câu hỏi tuân theo các sự kiện `question.requested` và `question.resolved`, đồng thời làm mới từ `question.list` sau khi kết nối lại.
- `chat.history` trả về một bản ghi đã được chuẩn hóa để hiển thị: các thẻ chỉ thị nội tuyến bị loại khỏi văn bản hiển thị, các tải trọng XML của lệnh gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, bao gồm cả các khối bị cắt bớt) và các token điều khiển mô hình bị rò rỉ đều bị loại bỏ, các hàng trợ lý chỉ chứa token im lặng như chính xác `NO_REPLY`/`no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng một văn bản giữ chỗ đã cắt bớt.
- Phiên: mặc định sử dụng phiên chính như trên; giao diện có thể chuyển đổi giữa các phiên.
- Nhóm phiên: `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` và `sessions.groups.delete` sở hữu danh mục nhóm. Tư cách thành viên là `category` của phiên, được cập nhật qua `sessions.patch`.
- Trạng thái chưa đọc: sau khi một phiên được kích hoạt và lịch sử trực tiếp của phiên tải thành công, ứng dụng sẽ xóa dấu chưa đọc của phiên đó. Việc tải lịch sử thất bại không xóa dấu này; lỗi vá tạm thời sẽ được thử lại vào lần kích hoạt tiếp theo.
- Quy trình làm quen ban đầu sử dụng một phiên chuyên biệt để tách biệt thiết lập lần chạy đầu tiên.
- Bộ nhớ đệm ngoại tuyến: ứng dụng duy trì một bộ nhớ đệm nhỏ chỉ đọc cho các phiên trò chuyện và bản ghi gần đây trên mỗi Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): khi mở nguội, ứng dụng hiển thị ngay bản ghi được biết gần nhất và làm mới sau khi Gateway phản hồi, còn các cuộc trò chuyện gần đây vẫn có thể duyệt khi mất kết nối (việc gửi vẫn bị vô hiệu hóa cho đến khi kết nối được khôi phục).

## Bề mặt bảo mật

- Chế độ từ xa chỉ chuyển tiếp cổng điều khiển WebSocket của Gateway qua SSH.

## Các giới hạn đã biết

- Giao diện được tối ưu hóa cho các phiên trò chuyện, không phải một sandbox trình duyệt đầy đủ.

## Liên quan

- [WebChat](/vi/web/webchat)
- [Ứng dụng macOS](/vi/platforms/macos)
