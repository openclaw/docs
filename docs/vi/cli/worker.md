---
read_when:
    - Vận hành hoặc gỡ lỗi các worker đám mây do Gateway khởi chạy
    - Xác minh việc tiếp nhận worker, phân bổ phiên hoặc cách ly công cụ cục bộ
summary: Tài liệu tham khảo nội bộ dành cho người vận hành về môi trường thực thi worker đám mây bị hạn chế
title: Trình thực thi viên
x-i18n:
    generated_at: "2026-07-16T15:08:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6591eb66c201a56e60638ce832c569b030d2d4a01b984d577e0ea44c10a0fa5e
    source_path: cli/worker.md
    workflow: 16
---

# `openclaw worker`

`openclaw worker` là điểm vào thời gian chạy bị hạn chế để trình điều phối worker đám mây khởi chạy bên trong một môi trường worker đã được chuẩn bị. Đây không phải là lệnh đa dụng để đăng ký worker theo cách thủ công.

Gateway cài đặt gói OpenClaw tương ứng và mở đường hầm SSH ngược được ghim khóa máy chủ. Trình khởi chạy worker khởi động lệnh này với một nhiệm vụ đã được chuẩn bị. Lệnh kết nối qua socket cục bộ được chuyển tiếp qua đường hầm và được tiếp nhận với vai trò chuyên biệt `worker`.

## Hợp đồng khởi chạy

Lệnh đọc chính xác một phong bì khởi chạy JSON có giới hạn từ đầu vào chuẩn. Phong bì chứa vị trí socket cục bộ, thông tin xác thực worker được cấp, danh tính gói và giao thức, epoch của chủ sở hữu, cùng phiên và lượt duy nhất được chỉ định. Thông tin xác thực không bao giờ được chấp nhận qua các đối số dòng lệnh, và trang này chủ ý không cung cấp ví dụ về thông tin xác thực hoặc phong bì được soạn thủ công.

Quá trình tiếp nhận mặc định từ chối nếu phong bì không hợp lệ, thông tin xác thực bị từ chối, các tính năng của gói hoặc giao thức không khớp, hoặc phiên và epoch của chủ sở hữu không còn hiện hành. Người vận hành nên khởi động worker thông qua trình điều phối worker đám mây thay vì gọi trực tiếp điểm vào này.

## Ranh giới thời gian chạy

Tiến trình chạy vòng lặp agent nhúng thông thường với một backend bị hạn chế:

- Các công cụ lập trình `read`, `write`, `edit`, `apply_patch`, `exec` và `process`
  chạy cục bộ trong không gian làm việc của worker.
- Các lệnh gọi mô hình sử dụng proxy suy luận của Gateway. Không tải hồ sơ xác thực mô hình cục bộ.
- Các thao tác ghi bản chép lời sử dụng RPC xác nhận bản chép lời của Gateway.
- Các bản cập nhật luồng và vòng đời công cụ sử dụng RPC sự kiện trực tiếp của Gateway.
- Chỉ phiên và lượt được chỉ định mới được chấp nhận.

Chế độ worker không khởi động các kênh, các bề mặt HTTP của Gateway hoặc tính năng tự động khởi động Plugin ngoài bộ công cụ của phiên được chỉ định. Chế độ này sử dụng một thư mục trạng thái dùng một lần và không có thông tin xác thực thường trực của nhà cung cấp hoặc forge.

Điều phối phiên từ worker đến worker không được cung cấp trong chế độ này. Việc bố trí và điều phối vẫn thuộc quyền sở hữu của Gateway: người vận hành có thể điều phối một phiên cục bộ hiện có sử dụng cây làm việc được quản lý thông qua Gateway, trong khi tiến trình worker không thể tự điều phối chính nó hoặc một worker khác.

Nhiệm vụ đã được chuẩn bị chứa ngữ cảnh bản chép lời, nút lá cơ sở được chấp nhận, trình tự xác nhận và con trỏ sự kiện trực tiếp. Khi đường hầm kết nối lại, tiến trình được tiếp nhận lại với cùng thông tin xác thực và epoch của chủ sở hữu, giữ lại cơ sở bản chép lời đã được chấp nhận, phát lại phần đuôi sự kiện trực tiếp chưa được xác nhận và gắn lại một lượt suy luận đang diễn ra với cùng danh tính. Thông báo suy luận kết thúc có tính quyết định nếu các delta được truyền trực tiếp bị bỏ lỡ. Một epoch chủ sở hữu thay thế sẽ cách ly tiến trình và khiến tiến trình thoát sạch.

Việc từ chối bản chép lời `stale-base-leaf` khiến lượt chạy hiện tại dừng ngay khi gặp lỗi. Chế độ worker không thử lại trình tự bị từ chối với một nút lá khác, vì vậy không tạo ra xác nhận trùng lặp; mọi phần đuôi trong bộ nhớ vẫn chưa được xác nhận từ lượt chạy đó sẽ bị mất. Việc khởi chạy lại thuộc trách nhiệm của chủ sở hữu bố trí milestone-3, bên phải tạo một nhiệm vụ mới từ bản chép lời có thẩm quyền và sổ cái xác nhận của Gateway. Tương tự, việc khởi động lại tiến trình Gateway sẽ kết thúc một lượt suy luận đang chờ bằng lỗi nhà cung cấp; chỉ khi đường hầm hoặc WebSocket của worker kết nối lại mới có thể gắn lại vào một luồng suy luận đang hoạt động trong cùng tiến trình.

Xem [Giao thức Gateway](/vi/gateway/protocol#worker-role-and-closed-protocol) để biết bề mặt RPC worker đóng và [Kế hoạch worker đám mây](/vi/plan/cloud-workers) để biết kiến trúc và mô hình bảo mật.
