---
read_when:
    - Bạn đang thay đổi cách hiển thị dấu thời gian cho mô hình hoặc người dùng
    - Bạn đang gỡ lỗi định dạng thời gian trong tin nhắn hoặc đầu ra của lời nhắc hệ thống
summary: Xử lý ngày và giờ trên các gói bao, lời nhắc, công cụ và trình kết nối
title: Ngày và giờ
x-i18n:
    generated_at: "2026-04-29T22:40:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d54da4077ac985ae1209b4364e049afb83b5746276e164181c1a30f0faa06e
    source_path: date-time.md
    workflow: 16
---

# Ngày & giờ

OpenClaw mặc định dùng **giờ cục bộ của máy chủ cho dấu thời gian truyền tải** và **múi giờ của người dùng chỉ trong lời nhắc hệ thống**.
Dấu thời gian của nhà cung cấp được giữ nguyên để công cụ giữ đúng ngữ nghĩa gốc của chúng (giờ hiện tại có sẵn qua `session_status`).

## Phong bì thông điệp (mặc định là cục bộ)

Thông điệp đến được bọc bằng dấu thời gian (độ chính xác đến phút):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Dấu thời gian phong bì này **mặc định là cục bộ theo máy chủ**, bất kể múi giờ của nhà cung cấp.

Bạn có thể ghi đè hành vi này:

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
- `envelopeTimezone: "local"` dùng múi giờ của máy chủ.
- `envelopeTimezone: "user"` dùng `agents.defaults.userTimezone` (quay về múi giờ của máy chủ nếu không có).
- Dùng múi giờ IANA tường minh (ví dụ: `"America/Chicago"`) cho một vùng cố định.
- `envelopeTimestamp: "off"` xóa dấu thời gian tuyệt đối khỏi tiêu đề phong bì.
- `envelopeElapsed: "off"` xóa hậu tố thời gian đã trôi qua (kiểu `+2m`).

### Ví dụ

**Cục bộ (mặc định):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Múi giờ người dùng:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Bật thời gian đã trôi qua:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Lời nhắc hệ thống: Ngày & giờ hiện tại

Nếu đã biết múi giờ của người dùng, lời nhắc hệ thống sẽ bao gồm một phần riêng
**Ngày & giờ hiện tại** chỉ có **múi giờ** (không có định dạng đồng hồ/thời gian)
để giữ bộ nhớ đệm lời nhắc ổn định:

```
Time zone: America/Chicago
```

Khi agent cần giờ hiện tại, hãy dùng công cụ `session_status`; thẻ trạng thái
bao gồm một dòng dấu thời gian.

## Dòng sự kiện hệ thống (mặc định là cục bộ)

Các sự kiện hệ thống được xếp hàng chèn vào ngữ cảnh agent được thêm tiền tố dấu thời gian bằng
cùng lựa chọn múi giờ như phong bì thông điệp (mặc định: cục bộ theo máy chủ).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Cấu hình múi giờ người dùng + định dạng

```json5
{
  agents: {
    defaults: {
      userTimezone: "America/Chicago",
      timeFormat: "auto", // auto | 12 | 24
    },
  },
}
```

- `userTimezone` đặt **múi giờ cục bộ của người dùng** cho ngữ cảnh lời nhắc.
- `timeFormat` kiểm soát **hiển thị 12 giờ/24 giờ** trong lời nhắc. `auto` theo tùy chọn của hệ điều hành.

## Phát hiện định dạng thời gian (tự động)

Khi `timeFormat: "auto"`, OpenClaw kiểm tra tùy chọn của hệ điều hành (macOS/Windows)
và quay về định dạng theo locale. Giá trị được phát hiện sẽ được **lưu đệm theo từng tiến trình**
để tránh lặp lại các lời gọi hệ thống.

## Payload công cụ + trình kết nối (giờ nhà cung cấp thô + trường đã chuẩn hóa)

Công cụ kênh trả về **dấu thời gian gốc của nhà cung cấp** và thêm các trường đã chuẩn hóa để nhất quán:

- `timestampMs`: mili giây epoch (UTC)
- `timestampUtc`: chuỗi UTC ISO 8601

Các trường thô của nhà cung cấp được giữ nguyên để không mất gì.

- Slack: chuỗi giống epoch từ API
- Discord: dấu thời gian ISO UTC
- Telegram/WhatsApp: dấu thời gian số/ISO theo nhà cung cấp

Nếu bạn cần giờ cục bộ, hãy chuyển đổi ở hạ nguồn bằng múi giờ đã biết.

## Tài liệu liên quan

- [Lời nhắc hệ thống](/vi/concepts/system-prompt)
- [Múi giờ](/vi/concepts/timezone)
- [Thông điệp](/vi/concepts/messages)
