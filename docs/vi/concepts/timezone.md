---
read_when:
    - Bạn cần hiểu cách dấu thời gian được chuẩn hóa cho mô hình
    - Cấu hình múi giờ của người dùng cho lời nhắc hệ thống
summary: Xử lý múi giờ cho tác nhân, phong bì và lời nhắc
title: Múi giờ
x-i18n:
    generated_at: "2026-04-29T22:40:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8318acb0269f446fb3d3198f47811d40490a9ee9593fed82f31353aef2bacb81
    source_path: concepts/timezone.md
    workflow: 16
---

OpenClaw chuẩn hóa dấu thời gian để mô hình thấy một **thời điểm tham chiếu duy nhất**.

## Phong bì tin nhắn (cục bộ theo mặc định)

Tin nhắn đến được bọc trong một phong bì như sau:

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Dấu thời gian trong phong bì **theo giờ cục bộ của máy chủ theo mặc định**, với độ chính xác đến phút.

Bạn có thể ghi đè thiết lập này bằng:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` dùng UTC.
- `envelopeTimezone: "user"` dùng `agents.defaults.userTimezone` (dự phòng về múi giờ của máy chủ).
- Dùng một múi giờ IANA rõ ràng (ví dụ: `"Europe/Vienna"`) để có độ lệch cố định.
- `envelopeTimestamp: "off"` loại bỏ dấu thời gian tuyệt đối khỏi tiêu đề phong bì.
- `envelopeElapsed: "off"` loại bỏ hậu tố thời gian đã trôi qua (kiểu `+2m`).

### Ví dụ

**Cục bộ (mặc định):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**Múi giờ cố định:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**Thời gian đã trôi qua:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## Phần dữ liệu công cụ (dữ liệu thô của nhà cung cấp + các trường đã chuẩn hóa)

Các lệnh gọi công cụ (`channels.discord.readMessages`, `channels.slack.readMessages`, v.v.) trả về **dấu thời gian thô của nhà cung cấp**.
Chúng tôi cũng đính kèm các trường đã chuẩn hóa để đảm bảo tính nhất quán:

- `timestampMs` (mili giây epoch UTC)
- `timestampUtc` (chuỗi UTC ISO 8601)

Các trường thô của nhà cung cấp được giữ nguyên.

## Múi giờ của người dùng cho lời nhắc hệ thống

Đặt `agents.defaults.userTimezone` để cho mô hình biết múi giờ cục bộ của người dùng. Nếu chưa đặt,
OpenClaw sẽ phân giải **múi giờ của máy chủ khi chạy** (không ghi cấu hình).

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

Lời nhắc hệ thống bao gồm:

- Phần `Current Date & Time` với giờ cục bộ và múi giờ
- `Time format: 12-hour` hoặc `24-hour`

Bạn có thể kiểm soát định dạng lời nhắc bằng `agents.defaults.timeFormat` (`auto` | `12` | `24`).

Xem [Ngày & Giờ](/vi/date-time) để biết đầy đủ hành vi và ví dụ.

## Liên quan

- [Heartbeat](/vi/gateway/heartbeat) — giờ hoạt động dùng múi giờ để lập lịch
- [Tác vụ Cron](/vi/automation/cron-jobs) — biểu thức cron dùng múi giờ để lập lịch
- [Ngày & Giờ](/vi/date-time) — đầy đủ hành vi ngày/giờ và ví dụ
