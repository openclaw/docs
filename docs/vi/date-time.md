---
read_when:
    - Bạn đang thay đổi cách dấu thời gian được hiển thị cho mô hình hoặc người dùng
    - Bạn đang gỡ lỗi định dạng thời gian trong tin nhắn hoặc đầu ra của lời nhắc hệ thống
summary: Xử lý ngày và giờ trong các phong bì, lời nhắc, công cụ và trình kết nối
title: Ngày và giờ
x-i18n:
    generated_at: "2026-07-12T07:51:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6f923022c021c1cf18ba306cd7b9a4873f5df947bb9a8fae9c737a89f64cbf2
    source_path: date-time.md
    workflow: 16
---

OpenClaw sử dụng **giờ cục bộ của máy chủ cho dấu thời gian truyền tải** và chỉ đưa **múi giờ** vào lời nhắc hệ thống.
Dấu thời gian của nhà cung cấp được giữ nguyên để các công cụ duy trì ngữ nghĩa gốc. Khi tác tử cần biết thời gian
hiện tại, tác tử sẽ chạy công cụ `session_status`.

## Phong bì tin nhắn (mặc định theo giờ cục bộ)

Tin nhắn đến được bao bọc bằng dấu thời gian gồm thứ trong tuần và độ chính xác đến giây:

```
[WhatsApp +1555 Mon 2026-01-05 16:26:34 PST] nội dung tin nhắn
```

Dấu thời gian của phong bì **mặc định theo giờ cục bộ của máy chủ**, bất kể múi giờ của nhà cung cấp.
Ghi đè trong `agents.defaults`:

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | múi giờ IANA
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

| Khóa                | Giá trị                                              | Hành vi                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envelopeTimezone`  | `local` (mặc định), `utc`, `user`, tên IANA cụ thể   | `user` sử dụng `agents.defaults.userTimezone` (múi giờ của máy chủ nếu chưa đặt). Tên IANA cụ thể (ví dụ: `"America/Chicago"`) cố định một múi giờ; tên không nhận dạng được sẽ chuyển về UTC. |
| `envelopeTimestamp` | `on` (mặc định), `off`                               | `off` loại bỏ dấu thời gian tuyệt đối khỏi tiêu đề phong bì, tiền tố lời nhắc trực tiếp của tác tử và tiền tố đầu vào mô hình được nhúng.                                                                 |
| `envelopeElapsed`   | `on` (mặc định), `off`                               | `off` loại bỏ hậu tố thời gian đã trôi qua (dạng `+30s` / `+2m`) được hiển thị kể từ tin nhắn trước đó trong phiên.                                                                                       |

### Ví dụ

**Cục bộ (mặc định):**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 PST] xin chào
```

**Múi giờ của người dùng:**

```
[WhatsApp +1555 Sun 2026-01-18 00:19:42 CST] xin chào
```

**Thời gian đã trôi qua với `envelopeTimezone: "utc"`:**

```
[WhatsApp +1555 +30s Sun 2026-01-18T05:19:00Z] tin nhắn tiếp theo
```

## Lời nhắc hệ thống: ngày và giờ hiện tại

Lời nhắc hệ thống bao gồm phần **Ngày & Giờ Hiện Tại** chỉ chứa **múi giờ**
(không có đồng hồ hoặc định dạng thời gian) để bộ nhớ đệm lời nhắc luôn ổn định:

```
Múi giờ: America/Chicago
```

Múi giờ là `agents.defaults.userTimezone` khi được cấu hình, nếu không sẽ là múi giờ của máy chủ.
Lời nhắc cũng hướng dẫn tác tử chạy công cụ `session_status` bất cứ khi nào cần biết
ngày, giờ hoặc thứ trong tuần hiện tại.

## Dòng sự kiện hệ thống (mặc định theo giờ cục bộ)

Các sự kiện hệ thống trong hàng đợi được chèn vào ngữ cảnh của tác tử có tiền tố là dấu thời gian sử dụng
cùng lựa chọn `envelopeTimezone` như phong bì tin nhắn (mặc định: giờ cục bộ của máy chủ).

```
System: [2026-01-12 12:19:17 PST] Đã chuyển mô hình.
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

- `userTimezone` đặt **múi giờ cục bộ của người dùng** cho ngữ cảnh lời nhắc (và cho `envelopeTimezone: "user"`).
- `timeFormat` kiểm soát **cách hiển thị 12 giờ/24 giờ** cho thời gian trong lời nhắc. `auto` tuân theo tùy chọn của hệ điều hành.

## Phát hiện định dạng thời gian (tự động)

Khi `timeFormat: "auto"`, OpenClaw kiểm tra tùy chọn của hệ điều hành (macOS và Windows)
và chuyển về định dạng theo ngôn ngữ địa phương nếu không xác định được. Giá trị được phát hiện sẽ được **lưu vào bộ nhớ đệm theo từng tiến trình**
để tránh lặp lại các lệnh gọi hệ thống.

## Tải dữ liệu công cụ + trình kết nối (giờ gốc của nhà cung cấp + các trường đã chuẩn hóa)

Các công cụ kênh trả về **dấu thời gian gốc của nhà cung cấp** và thêm các trường đã chuẩn hóa để bảo đảm tính nhất quán:

- `timestampMs`: số mili giây tính từ epoch (UTC)
- `timestampUtc`: chuỗi UTC theo ISO 8601

Các trường gốc của nhà cung cấp được giữ nguyên để không mất dữ liệu.

- Discord: dấu thời gian ISO theo UTC
- Slack: chuỗi dạng epoch từ API
- Telegram/WhatsApp: dấu thời gian dạng số/ISO dành riêng cho nhà cung cấp

Nếu cần giờ cục bộ, hãy chuyển đổi ở bước xử lý tiếp theo bằng múi giờ đã biết.

## Tài liệu liên quan

- [Lời nhắc hệ thống](/vi/concepts/system-prompt)
- [Múi giờ](/vi/concepts/timezone)
- [Tin nhắn](/vi/concepts/messages)
