---
read_when:
    - Bạn muốn hiểu agent của mình "sống" ở đâu
    - Bạn mong đợi cùng một ngữ cảnh dù viết trên Telegram, WhatsApp hay web
    - Bạn muốn agent của mình biết điều gì xảy ra trong các nhóm và luồng thảo luận phụ
summary: 'Một cuộc hội thoại liên tục trên tất cả các kênh của bạn: mặc định của trợ lý cá nhân'
title: Phiên chính
x-i18n:
    generated_at: "2026-07-19T17:04:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb77382ebdce269a05a03ab6fa39b44b1e9f1856166f1d9cb79111dccb547f69
    source_path: concepts/main-session.md
    workflow: 16
---

OpenClaw trước hết là một tác tử cá nhân. Ngay khi cài đặt, mọi tin nhắn trực tiếp bạn
gửi cho tác tử — từ Telegram, WhatsApp, iMessage, tin nhắn trực tiếp trên Slack, ứng dụng web, bất cứ đâu —
đều được chuyển vào **một cuộc hội thoại liên tục**: phiên chính. Hỏi điều gì đó trên
điện thoại, tiếp tục trao đổi từ máy tính xách tay, và tác tử có cùng ngữ cảnh ở cả hai
nơi. Chỉ có một bộ não, và đây là nơi nó suy nghĩ.

Bên dưới, phiên chính là một phiên thông thường có khóa
`agent:<agentId>:main` (ví dụ: `agent:main:main`). Điều khiến nó trở nên đặc biệt
là phạm vi tin nhắn trực tiếp mặc định hợp nhất mọi tin nhắn trực tiếp vào đó, đồng thời
phần còn lại của hệ thống coi nó là gốc của tác tử: các heartbeat đánh thức nó,
công việc nền báo cáo kết quả về đó, và hoạt động ở nơi khác được chuyển lên đó.

## Trang chủ

Trong ứng dụng web, phiên chính là trang **Trang chủ** — mục đầu tiên trong
thanh bên. Hàng danh tính ở trên cùng là tác tử của bạn (nhấp vào đó để mở menu
tác tử); Trang chủ là nơi bạn trò chuyện với tác tử. Các phiên tách ra từ cuộc
hội thoại chính xuất hiện trong **Luồng**, các cuộc trò chuyện nhóm trong **Nhóm**, và
các phiên lập trình/CLI trong **Lập trình**.

## Nội dung được chuyển vào phiên chính

Phiên chính không chỉ là nhật ký trò chuyện; đó là nơi thế giới của tác tử
hội tụ:

- **Hoạt động nhóm.** Các phiên nhóm và phòng vẫn được tách biệt (xem bên dưới), nhưng
  trong phạm vi tin nhắn trực tiếp mặc định, phiên chính tự động theo dõi chúng.
  Hoạt động được xếp hàng dưới dạng các thông báo ngắn gọn — được hợp nhất theo từng cuộc hội thoại, tuyệt đối không
  đánh thức một lần cho mỗi tin nhắn — và tác tử sẽ thấy chúng vào lần chạy tiếp theo: khi
  bạn gửi tin nhắn tiếp theo hoặc khi đến heartbeat theo lịch. Tác tử cũng có thể đọc các
  phiên mà nó theo dõi, vì vậy câu hỏi "tôi đã bỏ lỡ điều gì trong nhóm gia đình?" sẽ hoạt động.
- **Công việc nền.** Các tác tử phụ và phiên được tạo sẽ thông báo kết quả
  về phiên đã khởi động chúng, vì vậy công việc mà tác tử bắt đầu từ
  Trang chủ sẽ báo cáo lại về Trang chủ.
- **Heartbeat.** Các heartbeat theo lịch nhắm đến phiên chính, nhờ đó
  các thông báo đang chờ trở thành thông tin mà tác tử nhận biết được ngay cả khi bạn chưa viết gì.

## Bộ nhớ qua các lần đặt lại và cuộc hội thoại

Cuộc hội thoại liên tục bị giới hạn bởi cửa sổ ngữ cảnh của mô hình, vì vậy
tính liên tục đến từ các lớp xung quanh nó:

- `MEMORY.md`, bộ nhớ dài hạn được tác tử tuyển chọn, được nạp vào mọi
  phiên mới. Có thể tìm kiếm các ghi chú hằng ngày (`memory/YYYY-MM-DD.md`) khi cần
  và các ghi chú gần đây được nạp lại sau `/new` hoặc `/reset`. Trước khi Compaction,
  tác tử ghi các dữ kiện cần lưu giữ vào ghi chú hằng ngày để các cuộc hội thoại dài
  không âm thầm làm mất chúng.
- **Khôi phục bộ nhớ giữa các cuộc hội thoại** cho phép tác tử nhớ lại nội dung từ
  các phiên riêng tư khác của nó. Trong các thiết lập cá nhân — `session.dmScope`
  toàn cục được phân giải thành `main` mà không có ghi đè tin nhắn trực tiếp theo liên kết — tính năng này
  được bật theo mặc định; bất kỳ cấu hình tách biệt tin nhắn trực tiếp nào cũng sẽ tắt tính năng này, trừ khi bạn
  chủ động bật lại. Xem [Cấu hình bộ nhớ](/vi/reference/memory-config).

## Một phiên liên tục với lịch sử bền vững

Phiên chính tiếp tục tiến triển qua các lần đặt lại và Compaction thay vì
buộc mô hình phải mang theo toàn bộ lịch sử cùng lúc:

- Theo mặc định, không có thao tác đặt lại tự động; Compaction giữ cho ngữ cảnh đang hoạt động
  nằm trong giới hạn trong khi vẫn duy trì phiên liên tục. Việc đặt lại hằng ngày và khi không hoạt động
  là tùy chọn (xem [Quản lý phiên](/vi/concepts/session)). Khi `/new` và `/reset`,
  phần cuối của cuộc hội thoại sắp kết thúc được lưu vào ghi chú bộ nhớ hằng ngày, và
  phiên tiếp theo sẽ nạp lại các ghi chú gần đây. Thao tác đặt lại gán một mã phiên đang hoạt động mới nhưng
  vẫn giữ bản chép lời SQLite trước đó để có thể tìm kiếm bằng cùng khóa phiên chính.
- Khi cuộc hội thoại tiến gần đến giới hạn cửa sổ ngữ cảnh, Compaction sẽ tóm tắt
  và tiếp tục ngay tại chỗ — lịch sử bản chép lời vẫn nằm trong kho phiên.
- Danh sách phiên hiển thị cuộc hội thoại hiện đang hoạt động, không phải mọi mã
  phiên lịch sử phía sau nó.
- Khi cơ sở dữ liệu vật lý, WAL và các thành phần phiên trong kho của từng tác tử
  vượt quá ngân sách ổ đĩa (mặc định 10 GB), OpenClaw trích xuất phần lịch sử không được tham chiếu
  cũ nhất vào một kho lưu trữ nén đã xác minh trước khi xóa các hàng tương ứng khỏi
  cơ sở dữ liệu. Các phiên đang hoạt động, đang được định tuyến và đang xử lý không bao giờ bị xóa do giới hạn ngân sách.

## Khi cần tách biệt

Phiên chính dùng chung là lựa chọn mặc định phù hợp cho một tác tử mà chỉ mình bạn
trò chuyện. Nếu nhiều người có thể nhắn tin cho tác tử, hãy tách biệt các tin nhắn trực tiếp:

```json5
{
  session: {
    dmScope: "per-channel-peer",
  },
}
```

Với phạm vi tách biệt, mỗi người gửi có phiên riêng, tính năng theo dõi nhóm
từ phiên chính bị tắt và khả năng khôi phục bộ nhớ giữa các cuộc hội thoại
mặc định bị tắt. `openclaw security audit` khuyến nghị tách biệt khi phát hiện
nhiều người gửi tin nhắn trực tiếp. Ma trận phạm vi đầy đủ, liên kết danh tính và các ghi đè
theo từng tuyến được trình bày trong [Quản lý phiên](/vi/concepts/session) và
[Định tuyến kênh](/vi/channels/channel-routing).

## Liên quan

- [Quản lý phiên](/vi/concepts/session) — định tuyến, phạm vi, đặt lại
- [Định tuyến kênh](/vi/channels/channel-routing) — cách chọn tác tử và phiên
- [Bộ nhớ](/vi/concepts/memory) — các lớp bộ nhớ bền vững
- [Đa tác tử](/vi/concepts/multi-agent) — chạy nhiều tác tử tách biệt
