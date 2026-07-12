---
read_when:
    - Bạn muốn có một mô hình tư duy nhanh về cách xử lý múi giờ
    - Bạn đang quyết định nơi đặt hoặc ghi đè múi giờ
summary: Các múi giờ xuất hiện ở đâu trong OpenClaw — phong bì, tải trọng công cụ, lời nhắc hệ thống
title: Múi giờ
x-i18n:
    generated_at: "2026-07-12T07:53:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d1620b4b2cedba89bd6ab4392018cd48d0ef92a6abc1744011d482557e2c4fc
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw chuẩn hóa dấu thời gian để mô hình thấy **một thời gian tham chiếu duy nhất** thay vì hỗn hợp các đồng hồ cục bộ của nhà cung cấp. Ba bề mặt hiển thị múi giờ, mỗi bề mặt có mục đích riêng:

## Ba bề mặt múi giờ

| Bề mặt            | Nội dung hiển thị                                                                                                    | Mặc định                                      | Cấu hình qua                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| Phong bì tin nhắn | Bao bọc tin nhắn đến từ kênh: `[Signal +1555 Sun 2026-01-18 00:19:42 PST] hello`                                     | Cục bộ theo máy chủ                           | `agents.defaults.envelopeTimezone`                     |
| Payload công cụ   | Các công cụ kiểu `readMessages` của kênh trả về thời gian thô của nhà cung cấp cùng `timestampMs` / `timestampUtc` đã chuẩn hóa | Luôn có các trường UTC                        | Không thể cấu hình; giữ nguyên dấu thời gian gốc của nhà cung cấp |
| Lời nhắc hệ thống | Một khối nhỏ `Ngày & Giờ Hiện tại` chỉ chứa **múi giờ** (không có giá trị đồng hồ, để bộ nhớ đệm ổn định)             | Múi giờ máy chủ nếu chưa đặt `userTimezone`   | `agents.defaults.userTimezone`                         |

Lời nhắc hệ thống chủ ý bỏ qua đồng hồ trực tiếp để giữ bộ nhớ đệm lời nhắc ổn định giữa các lượt. Khi tác tử cần thời gian hiện tại, nó gọi `session_status`.

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

Nếu chưa đặt `userTimezone`, OpenClaw phân giải múi giờ máy chủ trong thời gian chạy qua `Intl.DateTimeFormat().resolvedOptions().timeZone` (không ghi cấu hình). `agents.defaults.timeFormat` (`auto` | `12` | `24`) kiểm soát cách hiển thị 12 giờ/24 giờ trong phong bì và các bề mặt hạ nguồn, nhưng không áp dụng cho phần lời nhắc hệ thống.

## Giá trị múi giờ phong bì

`agents.defaults.envelopeTimezone` chấp nhận:

- `"local"` (mặc định) hoặc `"host"` - múi giờ của máy chủ.
- `"utc"` hoặc `"gmt"` - UTC.
- `"user"` - `agents.defaults.userTimezone` đã phân giải (dùng múi giờ máy chủ làm phương án dự phòng nếu chưa đặt).
- Bất kỳ chuỗi múi giờ IANA tường minh nào, ví dụ: `"Europe/Vienna"`.

## Khi nào nên ghi đè

- **Dùng `"utc"`** để có dấu thời gian ổn định giữa các máy chủ ở những khu vực khác nhau hoặc để khớp với kết quả chẩn đoán/nhật ký được căn chỉnh theo UTC.
- **Dùng `"user"`** để giữ phong bì đồng bộ với múi giờ người dùng đã cấu hình, bất kể máy chủ Gateway chạy ở múi giờ nào.
- **Dùng một múi giờ IANA cố định** khi máy chủ Gateway ở một múi giờ nhưng phong bì phải luôn hiển thị theo múi giờ khác, bất kể máy chủ được di chuyển.
- **Đặt `envelopeTimestamp: "off"`** khi ngữ cảnh dấu thời gian không hữu ích cho cuộc trò chuyện. Thao tác này loại bỏ dấu thời gian tuyệt đối khỏi phong bì, tiền tố lời nhắc trực tiếp của tác tử và tiền tố đầu vào mô hình được nhúng.

Để xem tài liệu tham chiếu đầy đủ về hành vi, ví dụ cho từng nhà cung cấp và định dạng thời gian đã trôi qua, hãy xem [Ngày & Giờ](/vi/date-time).

## Liên quan

- [Ngày & Giờ](/vi/date-time) - hành vi và ví dụ đầy đủ về phong bì/công cụ/lời nhắc.
- [Heartbeat](/vi/gateway/heartbeat) - giờ hoạt động sử dụng múi giờ để lập lịch.
- [Tác vụ Cron](/vi/automation/cron-jobs) - biểu thức cron sử dụng múi giờ để lập lịch.
