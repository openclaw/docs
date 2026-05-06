---
read_when:
    - Bạn muốn một cách hình dung nhanh về việc xử lý múi giờ
    - Bạn đang quyết định nên thiết lập hoặc ghi đè múi giờ ở đâu
summary: Nơi múi giờ xuất hiện trong OpenClaw — phong bì, phần tải của công cụ, lời nhắc hệ thống
title: Múi giờ
x-i18n:
    generated_at: "2026-05-06T09:10:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 041b207a0fa2758a20e8f3c4eca852d3dd416560d045459cb4d86709b45449e3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw chuẩn hóa dấu thời gian để mô hình thấy **một thời gian tham chiếu duy nhất** thay vì một tập hợp các đồng hồ cục bộ của nhà cung cấp. Có ba bề mặt nơi múi giờ xuất hiện, mỗi bề mặt có mục đích riêng:

## Ba bề mặt múi giờ

| Bề mặt            | Nội dung hiển thị                                                                                       | Mặc định                              | Cấu hình qua                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| Bao thông điệp    | Bao bọc tin nhắn kênh đến: `[Signal +1555 2026-01-18 00:19 PST] hello`                                  | Cục bộ theo máy chủ                   | `agents.defaults.envelopeTimezone`                      |
| Payload công cụ   | Các công cụ kiểu `readMessages` của kênh trả về thời gian thô của nhà cung cấp + `timestampMs` / `timestampUtc` đã chuẩn hóa | Các trường UTC luôn có mặt            | Không cấu hình được — giữ nguyên dấu thời gian gốc của nhà cung cấp |
| Prompt hệ thống   | Một khối nhỏ `Current Date & Time` chỉ có **múi giờ** (không có giá trị đồng hồ, để ổn định bộ nhớ đệm) | Múi giờ máy chủ nếu chưa đặt `userTimezone` | `agents.defaults.userTimezone`                          |

Prompt hệ thống cố ý bỏ qua đồng hồ trực tiếp để giữ cho bộ nhớ đệm prompt ổn định giữa các lượt. Khi agent cần thời gian hiện tại, nó gọi `session_status`.

## Đặt múi giờ của người dùng

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Nếu chưa đặt `userTimezone`, OpenClaw sẽ phân giải múi giờ của máy chủ khi chạy (không ghi cấu hình). `agents.defaults.timeFormat` (`auto` | `12` | `24`) kiểm soát cách hiển thị 12 giờ/24 giờ trong bao thông điệp và các bề mặt hạ nguồn, không nằm trong phần prompt hệ thống.

## Khi nào cần ghi đè

- **Dùng bao thông điệp UTC** (`envelopeTimezone: "utc"`) khi bạn muốn dấu thời gian ổn định trên các máy chủ ở những khu vực khác nhau, hoặc khi bạn muốn nhật ký căn theo UTC khớp với đầu ra chẩn đoán.
- **Dùng một vùng IANA cố định** (ví dụ `"Europe/Vienna"`) khi máy chủ Gateway ở một vùng nhưng người dùng ở vùng khác và bạn muốn bao thông điệp đọc theo vùng của người dùng bất kể máy chủ di chuyển.
- **Đặt `envelopeTimestamp: "off"`** cho bao thông điệp ít token khi ngữ cảnh dấu thời gian không hữu ích cho cuộc trò chuyện.

Để xem tài liệu tham chiếu đầy đủ về hành vi, ví dụ theo từng nhà cung cấp và định dạng thời gian đã trôi qua, hãy xem [Ngày & Giờ](/vi/date-time).

## Liên quan

- [Ngày & Giờ](/vi/date-time) — hành vi và ví dụ đầy đủ về bao thông điệp/công cụ/prompt.
- [Heartbeat](/vi/gateway/heartbeat) — giờ hoạt động dùng múi giờ để lập lịch.
- [Cron Jobs](/vi/automation/cron-jobs) — biểu thức cron dùng múi giờ để lập lịch.
