---
read_when:
    - Bạn muốn có một mô hình tư duy nhanh về cách xử lý múi giờ
    - Bạn đang quyết định nơi đặt hoặc ghi đè múi giờ
summary: Nơi múi giờ xuất hiện trong OpenClaw — envelope, payload của công cụ, prompt hệ thống
title: Múi giờ
x-i18n:
    generated_at: "2026-06-27T17:26:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc5bfe595c81b9c6ffaceac4c86b6f82b82917a506cdd7227e3e8cb1c0eb99a3
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw chuẩn hóa dấu thời gian để mô hình thấy một **thời gian tham chiếu duy nhất** thay vì hỗn hợp các đồng hồ cục bộ theo nhà cung cấp. Có ba bề mặt nơi múi giờ xuất hiện, mỗi bề mặt có mục đích riêng:

## Ba bề mặt múi giờ

| Bề mặt           | Nội dung hiển thị                                                                                           | Mặc định                               | Được cấu hình qua                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| Phong bì tin nhắn | Bao bọc các tin nhắn kênh đến: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                      | Cục bộ theo máy chủ                            | `agents.defaults.envelopeTimezone`                      |
| Tải trọng công cụ     | Các công cụ kiểu `readMessages` của kênh trả về thời gian thô từ nhà cung cấp + `timestampMs` / `timestampUtc` đã chuẩn hóa | Các trường UTC luôn hiện diện             | Không cấu hình được — giữ nguyên dấu thời gian gốc theo nhà cung cấp |
| Prompt hệ thống     | Một khối nhỏ `Ngày & giờ hiện tại` chỉ có **múi giờ** (không có giá trị đồng hồ, để ổn định bộ nhớ đệm)   | Múi giờ của máy chủ nếu chưa đặt `userTimezone` | `agents.defaults.userTimezone`                          |

Prompt hệ thống cố ý bỏ qua đồng hồ trực tiếp để giữ bộ nhớ đệm prompt ổn định qua các lượt. Khi agent cần thời gian hiện tại, nó gọi `session_status`.

## Đặt múi giờ người dùng

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
    },
  },
}
```

Nếu chưa đặt `userTimezone`, OpenClaw phân giải múi giờ máy chủ khi chạy (không ghi cấu hình). `agents.defaults.timeFormat` (`auto` | `12` | `24`) kiểm soát cách hiển thị 12h/24h trong phong bì và các bề mặt hạ nguồn, không áp dụng trong phần prompt hệ thống.

## Khi nào nên ghi đè

- **Dùng phong bì UTC** (`envelopeTimezone: "utc"`) khi bạn muốn dấu thời gian ổn định trên các máy chủ ở những khu vực khác nhau, hoặc khi bạn muốn nhật ký căn theo UTC khớp với đầu ra chẩn đoán.
- **Dùng một vùng IANA cố định** (ví dụ: `"Europe/Vienna"`) khi máy chủ gateway ở một vùng nhưng người dùng ở vùng khác và bạn muốn phong bì được đọc theo vùng của người dùng bất kể máy chủ được di chuyển.
- **Đặt `envelopeTimestamp: "off"`** khi ngữ cảnh dấu thời gian không hữu ích cho cuộc trò chuyện. Thiết lập này loại bỏ dấu thời gian tuyệt đối khỏi phong bì, tiền tố prompt agent trực tiếp, và tiền tố đầu vào mô hình được nhúng.

Để xem tham chiếu hành vi đầy đủ, ví dụ theo từng nhà cung cấp, và định dạng thời gian đã trôi qua, hãy xem [Ngày & giờ](/vi/date-time).

## Liên quan

- [Ngày & giờ](/vi/date-time) — hành vi và ví dụ đầy đủ cho phong bì/công cụ/prompt.
- [Heartbeat](/vi/gateway/heartbeat) — giờ hoạt động dùng múi giờ để lập lịch.
- [Tác vụ Cron](/vi/automation/cron-jobs) — biểu thức cron dùng múi giờ để lập lịch.
