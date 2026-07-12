---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin chính sách
summary: Thêm các kiểm tra doctor dựa trên chính sách để bảo đảm không gian làm việc tuân thủ quy định.
title: Plugin chính sách
x-i18n:
    generated_at: "2026-07-12T08:16:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin chính sách

Bổ sung các bước kiểm tra doctor dựa trên chính sách để xác minh mức độ tuân thủ của workspace.

## Phân phối

- Gói: `@openclaw/policy`
- Cách cài đặt: được tích hợp trong OpenClaw

## Bề mặt

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Hành vi

Plugin Chính sách bổ sung các bước kiểm tra tình trạng của doctor cho các cài đặt OpenClaw được quản lý bằng chính sách và các khai báo workspace chịu sự quản trị. Hiện tại, chính sách bao quát mức độ tuân thủ của kênh, siêu dữ liệu công cụ chịu sự quản trị, trạng thái máy chủ MCP, trạng thái nhà cung cấp mô hình, trạng thái truy cập mạng riêng, trạng thái phơi bày Gateway, trạng thái workspace/công cụ của tác nhân, trạng thái công cụ toàn cục/theo tác nhân đã cấu hình, trạng thái môi trường chạy sandbox đã cấu hình, trạng thái truy cập đầu vào/kênh, trạng thái xử lý dữ liệu và trạng thái hồ sơ nhà cung cấp bí mật/xác thực trong cấu hình OpenClaw.

Chính sách lưu các yêu cầu đã biên soạn trong `policy.jsonc`, quan sát các cài đặt và khai báo workspace hiện có của OpenClaw làm bằng chứng, đồng thời báo cáo sai lệch thông qua `openclaw policy check` và `openclaw doctor --lint`. Một lần kiểm tra chính sách không phát hiện vấn đề sẽ xuất ra các hàm băm của chính sách, bằng chứng, phát hiện và chứng thực để người vận hành có thể ghi lại phục vụ kiểm toán.

`openclaw policy compare --baseline <file>` so sánh một tệp chính sách với một tệp chính sách khác. Đây chỉ là kiểm tra tuân thủ ở cấp cấu hình: lệnh sử dụng siêu dữ liệu quy tắc chính sách để xác minh rằng chính sách được kiểm tra không thiếu hoặc yếu hơn đường cơ sở đã biên soạn, và không kiểm tra trạng thái môi trường chạy, thông tin xác thực hoặc giá trị bí mật.

Các quy tắc về trạng thái công cụ có thể yêu cầu hồ sơ được phê duyệt, công cụ hệ thống tệp chỉ dành cho workspace, cài đặt bảo mật/hỏi/máy chủ cho thao tác thực thi nằm trong giới hạn, chế độ đặc quyền bị vô hiệu hóa, các mục `alsoAllow` khớp chính xác và các mục từ chối công cụ bắt buộc. Bằng chứng ghi lại các mục `alsoAllow` bổ sung vì chúng có thể mở rộng trạng thái công cụ có hiệu lực. Các bước kiểm tra này chỉ quan sát mức độ tuân thủ của cấu hình; chúng không đọc trạng thái phê duyệt trong môi trường chạy hoặc bổ sung cơ chế thực thi trong môi trường chạy.

Các quy tắc về trạng thái sandbox có thể yêu cầu chế độ/phần phụ trợ sandbox được phê duyệt, cấm kết nối mạng vùng chứa với máy chủ, cấm tham gia không gian tên vùng chứa, yêu cầu các điểm gắn kết vùng chứa chỉ đọc, cấm gắn kết socket của môi trường chạy vùng chứa và hồ sơ vùng chứa không bị giới hạn, đồng thời yêu cầu các dải nguồn CDP của trình duyệt sandbox.
Các bước kiểm tra này chỉ quan sát mức độ tuân thủ của cấu hình; chúng không đọc trạng thái phê duyệt trong môi trường chạy, kiểm tra các vùng chứa đang hoạt động hoặc bổ sung cơ chế thực thi trong môi trường chạy.

Các quy tắc xử lý dữ liệu có thể yêu cầu che giấu dữ liệu nhạy cảm trong nhật ký, cấm thu thập nội dung đo từ xa, yêu cầu duy trì thời hạn lưu giữ phiên và cấm lập chỉ mục bộ nhớ từ bản ghi phiên. Các bước kiểm tra này chỉ quan sát mức độ tuân thủ của cấu hình; chúng không kiểm tra nhật ký thô, dữ liệu đo từ xa đã xuất, bản ghi, tệp bộ nhớ, bí mật hoặc dữ liệu cá nhân.

Các phạm vi chính sách có tên trong `scopes.<scopeName>` có thể bổ sung các phần chính sách thông thường nghiêm ngặt hơn cho bộ chọn mà chúng liệt kê. `agentIds` hỗ trợ `tools`, `agents.workspace`, `sandbox` và `dataHandling.memory`; `channelIds` hỗ trợ `ingress.channels`.
Các mã định danh tác nhân trong môi trường chạy không được liệt kê rõ ràng trong `agents.list[]` sẽ được kiểm tra theo trạng thái toàn cục/mặc định kế thừa, thay vì mặc nhiên vượt qua mà không có bằng chứng. Mọi phạm vi có trong `policy.jsonc` đều phải hợp lệ và có thể thực thi đối với bộ chọn tương ứng. Các quy tắc lớp phủ là những yêu cầu bổ sung, vì vậy chúng không làm suy yếu chính sách cấp cao nhất và có thể tạo ra các phát hiện riêng khi cùng một cấu hình quan sát được vi phạm cả hai phạm vi.

<!-- openclaw-plugin-reference:manual-end -->

## Tài liệu liên quan

- [chính sách](/vi/cli/policy)
