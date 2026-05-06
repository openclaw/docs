---
read_when:
    - Bạn đang thay đổi cách hiển thị dấu thời gian cho mô hình hoặc người dùng
    - Bạn đang gỡ lỗi định dạng thời gian trong tin nhắn hoặc đầu ra của lời nhắc hệ thống
summary: Xử lý ngày và giờ trên các phong bì, lời nhắc, công cụ và trình kết nối
title: Ngày và giờ
x-i18n:
    generated_at: "2026-05-06T09:11:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f695a5009c949cc24689bfb8950d96cf72f0b2a1472efe88923182527b56b74
    source_path: date-time.md
    workflow: 16
---

OpenClaw mặc định dùng **giờ cục bộ của máy chủ cho dấu thời gian truyền tải** và **múi giờ của người dùng chỉ trong prompt hệ thống**.
Dấu thời gian của nhà cung cấp được giữ nguyên để công cụ duy trì ngữ nghĩa gốc (thời gian hiện tại có sẵn qua `session_status`).

## Phong bì tin nhắn (mặc định theo giờ cục bộ)

Tin nhắn đến được bọc kèm dấu thời gian (độ chính xác đến phút):

```
[Provider ... 2026-01-05 16:26 PST] message text
```

Dấu thời gian phong bì này **mặc định theo giờ cục bộ của máy chủ**, bất kể múi giờ của nhà cung cấp.

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
- `envelopeTimezone: "user"` dùng `agents.defaults.userTimezone` (dự phòng về múi giờ của máy chủ).
- Dùng một múi giờ IANA rõ ràng (ví dụ: `"America/Chicago"`) cho một vùng cố định.
- `envelopeTimestamp: "off"` xóa dấu thời gian tuyệt đối khỏi tiêu đề phong bì.
- `envelopeElapsed: "off"` xóa hậu tố thời gian đã trôi qua (kiểu `+2m`).

### Ví dụ

**Cục bộ (mặc định):**

```
[WhatsApp +1555 2026-01-18 00:19 PST] hello
```

**Múi giờ của người dùng:**

```
[WhatsApp +1555 2026-01-18 00:19 CST] hello
```

**Bật thời gian đã trôi qua:**

```
[WhatsApp +1555 +30s 2026-01-18T05:19Z] follow-up
```

## Prompt hệ thống: ngày và giờ hiện tại

Nếu đã biết múi giờ của người dùng, prompt hệ thống sẽ bao gồm một phần riêng
**Ngày & giờ hiện tại** chỉ có **múi giờ** (không có đồng hồ/định dạng giờ)
để giữ bộ nhớ đệm prompt ổn định:

```
Time zone: America/Chicago
```

Khi agent cần thời gian hiện tại, hãy dùng công cụ `session_status`; thẻ trạng thái
bao gồm một dòng dấu thời gian.

## Dòng sự kiện hệ thống (mặc định theo giờ cục bộ)

Các sự kiện hệ thống được xếp hàng rồi chèn vào ngữ cảnh agent được thêm tiền tố dấu thời gian bằng
cùng lựa chọn múi giờ như phong bì tin nhắn (mặc định: giờ cục bộ của máy chủ).

```
System: [2026-01-12 12:19:17 PST] Model switched.
```

### Cấu hình múi giờ + định dạng của người dùng

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

- `userTimezone` đặt **múi giờ cục bộ của người dùng** cho ngữ cảnh prompt.
- `timeFormat` kiểm soát **hiển thị 12 giờ/24 giờ** trong prompt. `auto` theo tùy chọn của hệ điều hành.

## Phát hiện định dạng giờ (auto)

Khi `timeFormat: "auto"`, OpenClaw kiểm tra tùy chọn hệ điều hành (macOS/Windows)
và dự phòng về định dạng theo locale. Giá trị phát hiện được **lưu vào bộ nhớ đệm theo từng tiến trình**
để tránh gọi hệ thống lặp lại.

## Tải trọng công cụ + trình kết nối (giờ thô của nhà cung cấp + trường đã chuẩn hóa)

Công cụ kênh trả về **dấu thời gian gốc của nhà cung cấp** và thêm các trường đã chuẩn hóa để nhất quán:

- `timestampMs`: mili giây epoch (UTC)
- `timestampUtc`: chuỗi UTC ISO 8601

Các trường thô của nhà cung cấp được giữ nguyên để không mất dữ liệu.

- Slack: chuỗi dạng epoch từ API
- Discord: dấu thời gian ISO UTC
- Telegram/WhatsApp: dấu thời gian số/ISO riêng của nhà cung cấp

Nếu bạn cần giờ cục bộ, hãy chuyển đổi ở bước sau bằng múi giờ đã biết.

## Tài liệu liên quan

- [Prompt hệ thống](/vi/concepts/system-prompt)
- [Múi giờ](/vi/concepts/timezone)
- [Tin nhắn](/vi/concepts/messages)
