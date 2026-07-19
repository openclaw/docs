---
read_when:
    - Gỡ lỗi chế độ xem WebChat trên máy Mac hoặc cổng loopback
summary: Cách ứng dụng Mac nhúng WebChat của Gateway và cách gỡ lỗi ứng dụng này
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-19T05:50:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8a403f5083ccac3d810dc6e103183a6ab73de3fab20abe74a2f7d7e94aed2c25
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Ứng dụng trên thanh menu macOS nhúng giao diện WebChat dưới dạng khung nhìn SwiftUI gốc. Ứng dụng kết nối với Gateway và mặc định dùng phiên chính của agent đã chọn (`main`, hoặc `global` khi `session.scope` là `global`).

Cửa sổ trò chuyện đầy đủ là một khung nhìn chia đôi gốc:

- **Thanh bên phiên**: danh sách phiên có thể tìm kiếm, gồm các phần đã ghim, nhóm do Gateway hỗ trợ và gần đây. Các phiên con được tạo sẽ lồng bên dưới phiên cha trong từng phần; các phiên cha được thu gọn sẽ tóm tắt những phiên con đang chạy, bị lỗi và chưa đọc. Menu ngữ cảnh hỗ trợ thông tin phiên, đổi tên, ghim, phân nhánh, đánh dấu đã đọc/chưa đọc, lưu trữ/khôi phục, sao chép khóa phiên và xóa. Thao tác tạo phiên mới chính (hoặc Cmd-N) tạo ngay qua `sessions.create`; cửa sổ bật lên tùy chọn liền kề cho phép chọn agent và yêu cầu một worktree được quản lý với ref cơ sở tùy chọn.
- **Thanh công cụ cửa sổ**: vòng hiển thị mức sử dụng ngữ cảnh (token và chi phí phiên, kèm một thao tác thu gọn), các điều khiển mô hình và menu thao tác phiên. Các mô hình được nhóm theo nhà cung cấp, với nhà cung cấp mặc định ở đầu, còn các mô hình đã ghim và gần đây vẫn nằm trên cùng. Các điều khiển có thể kế thừa hoặc ghi đè mức độ suy luận của mô hình, chọn độ chi tiết của lệnh gọi công cụ và bật/tắt phản hồi Nhanh. Menu có thể đổi tên hoặc phân nhánh phiên hiện tại và cập nhật trạng thái ghim, đã đọc hoặc lưu trữ của phiên. **Phiên…** (Shift-Cmd-S) mở trình quản lý Đang hoạt động/Đã lưu trữ để tìm kiếm trên Gateway, quản lý nhóm, kiểm tra phiên, đổi tên, ghim, lưu trữ và khôi phục. Chế độ chọn áp dụng thao tác ghim, bỏ ghim, lưu trữ hoặc xóa cho nhiều phiên đang hoạt động, đồng thời vẫn hiển thị từng lỗi riêng lẻ. Các dấu kiểm riêng trong menu cho phép hiển thị hoặc ẩn phần suy luận của trợ lý và hoạt động công cụ; cả hai đều được bật theo mặc định và được ghi nhớ qua các lần khởi chạy.
- **Bản chép lời và trình soạn thảo**: tin nhắn của trợ lý hiển thị dưới dạng văn bản thuần kèm ảnh đại diện, còn tin nhắn của người dùng hiển thị dưới dạng bong bóng màu nhấn. Các câu hỏi đang chờ của agent hiển thị dưới dạng thẻ gốc với tùy chọn chọn đơn hoặc chọn nhiều, câu trả lời văn bản tự do **Khác**, bộ đếm ngược thời hạn và trạng thái kết thúc dùng chung. Các cuộc trò chuyện trống cung cấp lời nhắc khởi đầu trên máy tính. Nhập `/` sẽ mở tính năng tự động hoàn thành lệnh gạch chéo do `commands.list` hỗ trợ, với khả năng điều hướng bằng các phím mũi tên/Tab/Return/Escape. Nhấp chuột phải vào một tin nhắn để sao chép Markdown hiển thị của tin nhắn đó mà không bao gồm phần suy luận ẩn. Các tin nhắn trợ lý bị cắt ngắn cũng cung cấp **Mở toàn bộ tin nhắn**, thao tác này tải trình đọc Markdown có thể chọn văn bản. Dùng **Nghe** cho TTS qua Gateway, với tính năng giọng nói cục bộ làm phương án dự phòng.
- **Điều khiển giọng nói**: trình soạn thảo có thể bắt đầu hoặc dừng Chế độ trò chuyện hiện có của macOS mà không thay thế lớp phủ trên thanh menu. Khi Chế độ trò chuyện đang hoạt động, trình soạn thảo hiển thị trạng thái đang nghe/đang suy luận/đang nói, hoạt động âm thanh trực tiếp và bản chép lời cuộn có thể mở rộng. Nhấp chuột phải vào nút Trò chuyện để chọn **Mặc định hệ thống** hoặc một micrô đã kết nối; đây cũng là lựa chọn micrô được Đánh thức bằng giọng nói và nhấn để nói sử dụng. Nếu micrô đã chọn bị ngắt kết nối, phiên Trò chuyện đang hoạt động sẽ chuyển về micrô mặc định của hệ thống và thử lại lựa chọn đó vào lần tiếp theo Chế độ trò chuyện khởi động. Một thao tác micrô riêng sẽ ghi âm ghi chú thoại khi Chế độ trò chuyện không kiểm soát việc thu âm.

Bảng trò chuyện thu gọn được neo từ thanh menu duy trì bố cục một cột nhỏ gọn, với cùng các điều khiển mô hình, suy luận, độ chi tiết và Nhanh được đặt nội tuyến, cùng với lời nhắc khởi đầu, Chế độ trò chuyện, ghi chú thoại và Nghe. Phần suy luận của trợ lý và hoạt động công cụ vẫn được ẩn trên giao diện thu gọn này.

## Thanh Trò chuyện nhanh

Nhấn Option-Space (⌥Space) hoặc chọn **Trò chuyện nhanh** từ menu thanh menu để mở trình soạn thảo nổi cho phiên chính. Thay đổi phím tắt toàn cục bằng trình ghi trong **Cài đặt → Chung → Phím tắt Trò chuyện nhanh**.

Trò chuyện nhanh hiển thị agent đích (ảnh đại diện hoặc emoji, với tên agent làm văn bản giữ chỗ) và gửi đến phiên chính của agent đó. Sau khi Return xác nhận gửi, thanh vẫn mở và mở rộng xuống dưới với phản hồi Markdown được truyền trực tuyến cùng bản chép lời gần đây. Trường nhập của thanh vẫn là trình soạn thảo. Nhấn Command-Return để gửi và mở cùng đích đó trong cửa sổ trò chuyện đầy đủ, Shift-Return để xuống dòng hoặc Escape để đóng toàn bộ thanh và vùng phản hồi. Nhấp ra ngoài cũng sẽ đóng thanh. Khi thiếu các quyền macOS liên quan, một dải đính kèm cung cấp các thao tác **Cấp quyền** và **Để sau**.

Dùng nút micrô để đọc chính tả vào trình soạn thảo. Kết quả giọng nói từng phần thay thế trực tiếp đoạn được đọc chính tả trong khi vẫn giữ nguyên văn bản đã có trong trình soạn thảo. Nhấn lại nút, Return hoặc Escape để dừng; việc gửi, ẩn hoặc bỏ lấy nét Trò chuyện nhanh cũng giải phóng micrô. Lần sử dụng đầu tiên sẽ yêu cầu quyền truy cập Micrô và Nhận dạng giọng nói của macOS.

Điều khiển mô hình thu gọn hiển thị mô hình hiện tại và mức suy luận của phiên đích. Việc chọn mô hình sẽ cập nhật phiên đó và do đó được duy trì trong phiên, còn lựa chọn suy luận chỉ áp dụng cho từng tin nhắn được gửi từ lần hiển thị Trò chuyện nhanh hiện tại. Các lựa chọn cục bộ được đặt lại khi thanh bị ẩn. Việc chuyển agent hoặc chọn một phiên gần đây sẽ giữ lại các lựa chọn tường minh nhưng tải lại trạng thái mô hình nền của phiên mới được chọn làm đích.

Nhấp vào nút lịch sử để chọn trong năm phiên được cập nhật gần đây nhất hoặc quay lại **Tin nhắn mới cho &lt;agent&gt;**. Khi chọn một phiên gần đây, tin nhắn sẽ được gửi đến chính xác phiên đó và văn bản giữ chỗ đổi thành **Trả lời trong &lt;session&gt;**. Việc ẩn Trò chuyện nhanh sẽ đặt lại đích tạm thời này về phiên chính của agent đã chọn; chuyển agent từ menu ảnh đại diện cũng sẽ xóa đích này.

Command-Return mở cuộc trò chuyện của agent đã nhận tin nhắn, kể cả khi phạm vi phiên là toàn cục.

Nút camera mở menu cho **Chụp cửa sổ…** hoặc **Chụp vùng…**. Chế độ chụp cửa sổ gắn nhãn mọi cửa sổ đang hiển thị; chế độ chụp vùng làm tối từng màn hình trong khi bạn kéo chọn một vùng và hiển thị trực tiếp kích thước của vùng đó. Ảnh chụp màn hình đã chọn được gửi đến agent đã chọn, kèm mọi văn bản đã nhập làm chú thích. Lần sử dụng đầu tiên sẽ yêu cầu quyền Ghi màn hình của macOS. Escape, nhấp vào vùng trống hoặc nhấp mà không kéo một vùng có ý nghĩa sẽ hủy thao tác.

Dùng nút văn bản tài liệu để đính kèm văn bản từ cửa sổ đang được lấy nét của ứng dụng đang được lấy nét. Trò chuyện nhanh hiển thị kết quả dưới dạng thẻ ngữ cảnh có thể xóa thay vì đặt văn bản đã thu thập vào trình soạn thảo; khi gửi, văn bản của thẻ được nối vào tin nhắn gửi đi rồi thẻ được xóa. Tính năng này yêu cầu quyền Trợ năng của macOS. Văn bản đính kèm cũng được xóa mỗi khi Trò chuyện nhanh đóng, vì vậy ngữ cảnh từ một lần hiển thị không thể lọt vào lần gửi sau.

Sau khi phản hồi hoàn tất, chọn **Dán vào &lt;app&gt;** để sao chép văn bản trợ lý đang hiển thị, không bao gồm phần suy luận ẩn, vào bảng nhớ tạm chung và dán vào ứng dụng ở phía trước. Tính năng này yêu cầu quyền Trợ năng của macOS. Thao tác này thay thế nội dung hiện tại của bảng nhớ tạm rồi ẩn Trò chuyện nhanh.

Tắt hoàn toàn tính năng bằng **Cài đặt → Chung → Trò chuyện nhanh**; cùng phần này cũng chứa trình ghi phím tắt.

- **Chế độ cục bộ**: kết nối trực tiếp với WebSocket của Gateway cục bộ.
- **Chế độ từ xa**: chuyển tiếp cổng điều khiển Gateway qua SSH và dùng đường hầm đó làm mặt phẳng dữ liệu.

## Khởi chạy và gỡ lỗi

- Thủ công: menu Lobster -> "Mở trò chuyện".
- Tự động mở để kiểm thử:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` được chấp nhận làm bí danh cũ.)

- Nhật ký: `./scripts/clawlog.sh` (hệ thống con `ai.openclaw`, danh mục `WebChatSwiftUI`).

## Cách hệ thống được kết nối

- Mặt phẳng dữ liệu: các phương thức Gateway WS `chat.history`, `chat.message.get`, `chat.send`, `chat.abort`, `chat.inject`, cùng với `question.list` và `question.resolve`, và các sự kiện `chat`, `agent`, `presence`, `tick`, `health`; các thẻ câu hỏi theo dõi sự kiện `question.requested` và `question.resolved`, đồng thời làm mới từ `question.list` sau khi kết nối lại.
- `chat.history` trả về bản chép lời đã chuẩn hóa để hiển thị: các thẻ chỉ thị nội tuyến bị loại khỏi văn bản hiển thị, các tải trọng XML của lệnh gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, bao gồm cả các khối bị cắt ngắn) và các token điều khiển mô hình bị rò rỉ đều bị loại bỏ, các hàng trợ lý chỉ chứa token im lặng như chính xác `NO_REPLY`/`no_reply` bị bỏ qua, và các hàng quá lớn có thể được thay bằng một văn bản giữ chỗ bị cắt ngắn.
- Phiên: mặc định dùng phiên chính như mô tả ở trên; giao diện người dùng có thể chuyển đổi giữa các phiên.
- Nhóm phiên: `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` và `sessions.groups.delete` sở hữu danh mục nhóm. Tư cách thành viên là `category` của phiên, được cập nhật qua `sessions.patch`.
- Trạng thái chưa đọc: sau khi một phiên được kích hoạt và lịch sử trực tiếp của phiên tải thành công, ứng dụng sẽ xóa dấu chưa đọc của phiên đó. Việc tải lịch sử thất bại không xóa dấu này; lỗi bản vá tạm thời sẽ được thử lại vào lần kích hoạt tiếp theo.
- Quy trình làm quen ban đầu sử dụng một phiên chuyên dụng để tách biệt thiết lập lần chạy đầu tiên.
- Bộ nhớ đệm ngoại tuyến: ứng dụng duy trì một bộ nhớ đệm nhỏ, chỉ đọc, chứa các phiên trò chuyện và bản chép lời gần đây cho từng Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): khi mở nguội, ứng dụng hiển thị ngay bản chép lời đã biết gần nhất và làm mới sau khi Gateway phản hồi, đồng thời các cuộc trò chuyện gần đây vẫn có thể duyệt khi mất kết nối (chức năng gửi vẫn bị tắt cho đến khi kết nối được khôi phục).

## Bề mặt bảo mật

- Chế độ từ xa chỉ chuyển tiếp cổng điều khiển WebSocket của Gateway qua SSH.

## Hạn chế đã biết

- Giao diện người dùng được tối ưu hóa cho các phiên trò chuyện, không phải một sandbox trình duyệt đầy đủ.

## Liên quan

- [WebChat](/vi/web/webchat)
- [Ứng dụng macOS](/vi/platforms/macos)
