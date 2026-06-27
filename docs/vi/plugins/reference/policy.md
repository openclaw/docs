---
read_when:
    - Bạn đang cài đặt, cấu hình hoặc kiểm tra Plugin chính sách
summary: Thêm các kiểm tra doctor dựa trên chính sách để đảm bảo không gian làm việc tuân thủ.
title: Plugin chính sách
x-i18n:
    generated_at: "2026-06-27T17:55:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Plugin chính sách

Thêm các kiểm tra doctor dựa trên chính sách để xác nhận không gian làm việc tuân thủ.

## Phân phối

- Gói: `@openclaw/policy`
- Tuyến cài đặt: được bao gồm trong OpenClaw

## Bề mặt

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Hành vi

Plugin Chính sách đóng góp các kiểm tra tình trạng doctor cho các cài đặt OpenClaw
do chính sách quản lý và các khai báo không gian làm việc được quản trị. Chính sách hiện bao gồm sự
tuân thủ kênh, siêu dữ liệu công cụ được quản trị, trạng thái máy chủ MCP, trạng thái nhà cung cấp mô hình,
trạng thái truy cập mạng riêng, trạng thái phơi lộ Gateway, trạng thái không gian làm việc/công cụ của agent,
trạng thái công cụ toàn cục/theo agent đã cấu hình, trạng thái runtime sandbox đã cấu hình,
trạng thái truy cập ingress/kênh, trạng thái xử lý dữ liệu, và trạng thái nhà cung cấp bí mật
cấu hình OpenClaw/hồ sơ xác thực.

Chính sách lưu các yêu cầu đã soạn trong `policy.jsonc`, quan sát các cài đặt
OpenClaw hiện có và khai báo không gian làm việc làm bằng chứng, rồi báo cáo độ lệch
thông qua `openclaw policy check` và `openclaw doctor --lint`. Một lần kiểm tra chính sách sạch
sẽ phát ra chính sách, bằng chứng, phát hiện, và các hàm băm chứng thực để người vận hành
có thể ghi lại phục vụ kiểm toán.

`openclaw policy compare --baseline <file>` so sánh một tệp chính sách với một
tệp chính sách khác. Đây chỉ là sự tuân thủ ở cấp cấu hình: nó dùng siêu dữ liệu quy tắc chính sách
để xác minh rằng chính sách được kiểm tra không bị thiếu hoặc yếu hơn so với đường cơ sở
đã soạn, và không kiểm tra trạng thái runtime, thông tin xác thực, hoặc giá trị bí mật.

Các quy tắc trạng thái công cụ có thể yêu cầu hồ sơ được phê duyệt, công cụ hệ thống tệp
chỉ trong không gian làm việc, các cài đặt bảo mật/hỏi/máy chủ exec có giới hạn, chế độ nâng cao bị tắt, các mục
`alsoAllow` chính xác, và các mục từ chối công cụ bắt buộc. Các bản ghi bằng chứng ghi nhận
các mục `alsoAllow` bổ sung vì chúng có thể mở rộng trạng thái công cụ hiệu dụng.
Những kiểm tra này chỉ quan sát sự tuân thủ cấu hình; chúng không đọc trạng thái phê duyệt runtime
hoặc thêm cơ chế thực thi runtime.

Các quy tắc trạng thái sandbox có thể yêu cầu chế độ/backend sandbox được phê duyệt, từ chối mạng container
của máy chủ, từ chối tham gia namespace container, yêu cầu mount container chỉ đọc,
từ chối mount socket runtime container và hồ sơ container không bị giới hạn,
và yêu cầu dải nguồn CDP của trình duyệt sandbox.
Những kiểm tra này chỉ quan sát sự tuân thủ cấu hình; chúng không đọc trạng thái phê duyệt runtime,
kiểm tra container đang chạy, hoặc thêm cơ chế thực thi runtime.

Các quy tắc xử lý dữ liệu có thể yêu cầu che giấu nhật ký nhạy cảm, từ chối thu thập
nội dung telemetry, yêu cầu duy trì lưu giữ phiên, và từ chối lập chỉ mục bộ nhớ
bản ghi phiên. Những kiểm tra này chỉ quan sát sự tuân thủ cấu hình; chúng
không kiểm tra nhật ký thô, bản xuất telemetry, bản ghi, tệp bộ nhớ, bí mật,
hoặc dữ liệu cá nhân.

Các phạm vi chính sách được đặt tên dưới `scopes.<scopeName>` có thể thêm các phần chính sách
thông thường nghiêm ngặt hơn cho bộ chọn mà chúng liệt kê. `agentIds` hỗ trợ `tools`,
`agents.workspace`, `sandbox`, và `dataHandling.memory`; `channelIds` hỗ trợ
`ingress.channels`.
Các id agent runtime không được liệt kê rõ trong `agents.list[]` sẽ được kiểm tra
theo trạng thái toàn cục/mặc định được kế thừa thay vì âm thầm đạt mà không có
bằng chứng. Mọi phạm vi có trong `policy.jsonc` phải hợp lệ và có thể thực thi
cho bộ chọn của nó. Quy tắc phủ là các tuyên bố bổ sung, nên chúng không làm suy yếu
chính sách cấp cao nhất và có thể tạo phát hiện riêng khi cùng một cấu hình được quan sát
vi phạm cả hai phạm vi.

<!-- openclaw-plugin-reference:manual-end -->

## Tài liệu liên quan

- [chính sách](/vi/cli/policy)
