---
read_when:
    - Bạn đang thay đổi cách hiển thị dấu thời gian cho mô hình hoặc người dùng
    - Bạn đang gỡ lỗi định dạng thời gian trong tin nhắn hoặc đầu ra lời nhắc hệ thống
summary: Xử lý ngày và giờ trên các envelope, prompt, công cụ và trình kết nối
title: Ngày và giờ
x-i18n:
    generated_at: "2026-06-27T17:27:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d40e8626269d26a14506a178080b353529080b6ee5ce523c3281521f1a34bf90
    source_path: date-time.md
    workflow: 16
---

OpenClaw mặc định dùng **giờ cục bộ của máy chủ cho dấu thời gian transport** và **múi giờ người dùng chỉ trong lời nhắc hệ thống**.
Dấu thời gian của nhà cung cấp được giữ nguyên để các công cụ giữ đúng ngữ nghĩa gốc (thời gian hiện tại có sẵn qua `session_status`).

## Phong bì tin nhắn (mặc định là cục bộ)

Tin nhắn đến được bọc bằng một dấu thời gian (độ chính xác đến giây):

```
[Provider ... Mon 2026-01-05 16:26:34 PST] message text
```

Dấu thời gian phong bì này **mặc định là giờ cục bộ của máy chủ**, bất kể múi giờ của nhà cung cấp.

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
- Dùng múi giờ IANA rõ ràng (ví dụ: `"America/Chicago"`) cho một vùng cố định.
- `envelopeTimestamp: "off"` xóa dấu thời gian tuyệt đối khỏi tiêu đề phong bì, tiền tố lời nhắc tác tử trực tiếp, và tiền tố đầu vào mô hình được nhúng.
- `envelopeElapsed: "off"` xóa hậu tố thời gian đã trôi qua (kiểu `+2m`).

### Ví dụ

**Cục bộ (mặc định):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] hello
```

**Múi giờ người dùng:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] hello
```

**Đã bật thời gian đã trôi qua:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] follow-up
```

## Lời nhắc hệ thống: ngày và giờ hiện tại

Nếu biết múi giờ của người dùng, lời nhắc hệ thống sẽ bao gồm một mục
**Ngày & Giờ hiện tại** riêng với **chỉ múi giờ** (không có đồng hồ/định dạng thời gian)
để giữ bộ nhớ đệm lời nhắc ổn định:

```
Time zone: America/Chicago
```

Khi tác tử cần thời gian hiện tại, hãy dùng công cụ `session_status`; thẻ trạng thái
bao gồm một dòng dấu thời gian.

## Dòng sự kiện hệ thống (mặc định là cục bộ)

Các sự kiện hệ thống đã xếp hàng được chèn vào ngữ cảnh tác tử sẽ có tiền tố dấu thời gian bằng
cùng lựa chọn múi giờ như phong bì tin nhắn (mặc định: giờ cục bộ của máy chủ).

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
- `timeFormat` kiểm soát **hiển thị 12h/24h** trong lời nhắc. `auto` tuân theo tùy chọn của hệ điều hành.

## Phát hiện định dạng thời gian (tự động)

Khi `timeFormat: "auto"`, OpenClaw kiểm tra tùy chọn của hệ điều hành (macOS/Windows)
và quay về định dạng theo locale. Giá trị phát hiện được **lưu vào bộ nhớ đệm theo từng tiến trình**
để tránh gọi hệ thống lặp lại.

## Tải dữ liệu công cụ + trình kết nối (thời gian thô của nhà cung cấp + trường đã chuẩn hóa)

Công cụ kênh trả về **dấu thời gian gốc của nhà cung cấp** và thêm các trường đã chuẩn hóa để nhất quán:

- `timestampMs`: mili giây epoch (UTC)
- `timestampUtc`: chuỗi UTC ISO 8601

Các trường thô của nhà cung cấp được giữ nguyên để không mất gì.

- Slack: chuỗi dạng epoch từ API
- Discord: dấu thời gian ISO UTC
- Telegram/WhatsApp: dấu thời gian số/ISO đặc thù theo nhà cung cấp

Nếu bạn cần giờ cục bộ, hãy chuyển đổi ở tầng sau bằng múi giờ đã biết.

## Tài liệu liên quan

- [Lời nhắc hệ thống](/vi/concepts/system-prompt)
- [Múi giờ](/vi/concepts/timezone)
- [Tin nhắn](/vi/concepts/messages)
