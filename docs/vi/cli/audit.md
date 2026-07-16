---
read_when:
    - Bạn cần trả lời ai đã chạy tác tử hoặc công cụ, thời điểm chạy và kết quả kết thúc ra sao
    - Bạn cần siêu dữ liệu vòng đời của tin nhắn đến hoặc đi không chứa nội dung
    - Bạn cần một bản xuất hoạt động có phạm vi giới hạn và an toàn khi che thông tin nhạy cảm
summary: Tài liệu tham khảo CLI cho các bản ghi kiểm tra vòng đời của lượt chạy, công cụ và tin nhắn chỉ chứa siêu dữ liệu
title: Bản ghi kiểm tra
x-i18n:
    generated_at: "2026-07-16T14:11:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

Truy vấn sổ cái kiểm toán chỉ chứa siêu dữ liệu của Gateway về các lượt chạy tác tử, thao tác công cụ và bản ghi vòng đời tin nhắn được bật theo lựa chọn.

Sổ cái được bật mặc định cho các sự kiện lượt chạy và công cụ. Đặt
[`audit.enabled: false`](/vi/gateway/configuration-reference#audit) rồi khởi động lại
Gateway để ngừng mọi bản ghi sự kiện mới. Bản ghi tin nhắn được tắt riêng theo
mặc định; đặt `audit.messages` thành `direct` hoặc `all` rồi khởi động lại Gateway để
ghi lại chúng. Các bản ghi hiện có vẫn có thể truy vấn cho đến khi hết hạn (30 ngày).

Sổ cái tách biệt với bản chép lại cuộc hội thoại: sổ cái ghi lại danh tính,
thứ tự, nguồn gốc, hành động, trạng thái và mã kết quả đã chuẩn hóa, nhưng không bao giờ
lưu nội dung; mã định danh tin nhắn chỉ xuất hiện dưới dạng bí danh có khóa
cục bộ theo bản cài đặt. [Lịch sử kiểm toán](/gateway/audit) quy định toàn bộ mô hình dữ liệu,
ngữ nghĩa quyền riêng tư, giới hạn lưu trữ/lưu giữ và giới hạn phạm vi bao phủ; trang này
trình bày bề mặt lệnh.

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## Bộ lọc

- `--agent <id>`: mã tác tử chính xác
- `--session <key>`: khóa phiên chính xác
- `--run <id>`: mã lượt chạy chính xác
- `--kind <kind>`: `agent_run`, `tool_action` hoặc `message`
- `--status <status>`: `started`, `succeeded`, `failed`, `cancelled`,
  `timed_out`, `blocked` hoặc `unknown`
- `--direction <direction>`: hướng tin nhắn, `inbound` hoặc `outbound`
- `--channel <channel>`: kênh tin nhắn chính xác
- `--after <timestamp>` / `--before <timestamp>`: dấu thời gian ISO có tính cả giá trị biên hoặc
  mili giây Unix
- `--limit <count>`: kích thước trang từ 1 đến 500; mặc định `100`
- `--cursor <sequence>`: tiếp tục truy vấn trước đó theo thứ tự mới nhất trước
- `--json`: in trang có giới hạn dưới dạng JSON

CLI truy vấn RPC hoạt động có phiên bản để một lệnh hiển thị toàn bộ
sổ cái đã cấu hình. Đầu ra văn bản hiển thị thời gian, loại, hướng, kênh, trạng thái,
tác tử, lượt chạy và hành động. Nguồn gốc tin nhắn bị thiếu được hiển thị là `-`; OpenClaw
không tự tạo mã tác tử hoặc mã lượt chạy. Thao tác công cụ cũng hiển thị tên công cụ. Đầu ra
JSON bao gồm `nextCursor` khi còn trang khác. Truyền giá trị đó cho
`--cursor` để tiếp tục mà không sắp xếp lại các bản ghi xuất hiện trong quá trình phân trang.

Các bản xuất này vẫn là siêu dữ liệu vận hành nhạy cảm dù không có nội dung tin nhắn
và các trường danh tính tin nhắn thô. Mã tác tử, phiên và lượt chạy, thời điểm,
kênh, kết quả và tham chiếu HMAC ổn định có thể được dùng để đối chiếu hoạt động. Hãy bảo vệ
chúng bằng cùng các biện pháp kiểm soát truy cập và quy trình lưu giữ như các bản ghi khác
của người vận hành.

## Sự kiện được ghi lại

Gateway chiếu các luồng vòng đời đáng tin cậy thành sáu hành động:

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

Mỗi bản ghi trả về có một mã sự kiện ổn định, một số thứ tự sổ cái
tăng đơn điệu, dấu thời gian vòng đời, chủ thể, hành động, trạng thái, một dấu
`schemaVersion: 1`, số thứ tự nguồn và `redaction: "metadata_only"`.
Nguồn gốc tác tử/phiên/lượt chạy và các trường dành riêng cho sự kiện chỉ xuất hiện khi
nguồn đáng tin cậy cung cấp chúng. Bản ghi tin nhắn chủ ý bỏ qua
`sessionKey` và `sessionId`, vì vậy bộ lọc `--session` chỉ áp dụng cho bản ghi lượt chạy và công cụ.

Bản ghi lượt chạy và công cụ ở trạng thái kết thúc phân biệt thành công, thất bại, hủy,
hết thời gian chờ và bị chính sách chặn bằng trạng thái đóng và mã lỗi. `unknown` là một
kết quả không thành công tường minh khi môi trường thực thi ngược dòng không cung cấp
kết quả kết thúc có thẩm quyền. Mã lệnh gọi công cụ chỉ được xuất dưới dạng
dấu vân tay ổn định. Tên công cụ phải khớp với hợp đồng tên rút gọn
dành cho mô hình; các giá trị khác trở thành `unknown`.

Bản ghi tin nhắn bổ sung hướng, kênh, loại cuộc hội thoại, kết quả và
tùy chọn loại phân phối, giai đoạn thất bại, thời lượng, số lượng kết quả, mã
lý do đã chuẩn hóa và các bí danh có khóa của tài khoản/cuộc hội thoại/tin nhắn/đích. Ranh giới
đầu vào hiện tại bao phủ các tin nhắn được chấp nhận và đến bước điều phối lõi,
bao gồm kết quả xử lý trùng lặp và kết thúc của lõi. Ranh giới đầu ra
ghi một hàng kết thúc cho mỗi tải trọng phản hồi logic ban đầu đi đến
quy trình phân phối bền vững dùng chung; việc chia khúc và phân nhánh bộ điều hợp được tổng hợp trong
`resultCount`. Các lần gửi được xếp hàng có thể thử lại hoặc có kết quả không rõ ràng chỉ được ghi lại sau khi
xác nhận, chuyển vào hàng thư lỗi hoặc đối soát khiến kết quả trở thành kết thúc.
Các đường dẫn cục bộ của Plugin và đường dẫn gửi trực tiếp bỏ qua những ranh giới dùng chung đó hiện
chưa được bao phủ; việc không có hàng nào không chứng minh rằng không tồn tại tin nhắn.

Sổ cái kiểm toán không thay thế bản chép lại, lịch sử tác vụ, lịch sử lượt chạy cron
hoặc nhật ký. Sổ cái cung cấp một chỉ mục nhỏ xuyên suốt các lượt chạy để giải đáp câu hỏi của người vận hành mà không
sao chép nội dung cuộc hội thoại sang kho lưu trữ khác.

Đối với các hàng đầu vào, `durationMs` đo quá trình điều phối lõi và `resultCount` đếm
các tải trọng công cụ, khối và phản hồi đã hoàn tất trong hàng đợi. Đối với các hàng đầu ra,
`durationMs` bao gồm quyền sở hữu phân phối cho đến trạng thái kết thúc (và do đó bao gồm
thời gian chờ trong hàng đợi), trong khi `resultCount` đếm các lần gửi vật lý đã xác định trên nền tảng.
`deliveryKind`, khi có, mô tả tải trọng có hiệu lực sau hook,
sau kết xuất; các hàng bị chặn và có kết quả không rõ ràng do sự cố không chứa trường này.

## RPC của Gateway

`audit.activity.list` yêu cầu `operator.read` và chấp nhận cùng các bộ lọc. RPC này
trả về hợp kiểu sự kiện hoạt động V1 có tên, bao gồm bản ghi lượt chạy, công cụ, tin nhắn
đầu vào và tin nhắn đầu ra.

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

Kết quả là `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.
Kết quả được sắp xếp mới nhất trước và giới hạn ở 500 bản ghi cho mỗi yêu cầu.

RPC `audit.list` đã phát hành vẫn không thay đổi dành cho các máy khách lượt chạy/công cụ cũ. Khi
`audit.activity.list` không khả dụng trên Gateway cũ, CLI chỉ thử lại
`audit.list` nếu phương thức cũ đó hỗ trợ mọi bộ lọc được yêu cầu. `--kind message`,
`--direction` và `--channel` sẽ thất bại kèm thông báo nâng cấp trên Gateway cũ
thay vì bị âm thầm loại bỏ.

## Liên quan

- [Lịch sử kiểm toán](/gateway/audit)
- [Giao thức Gateway](/vi/gateway/protocol#audit-ledger-rpc)
- [Phiên](/vi/cli/sessions)
- [Tác vụ](/vi/cli/tasks)
- [Công việc Cron](/vi/automation/cron-jobs)
