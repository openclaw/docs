---
read_when:
    - Thay đổi hành vi hoặc giá trị mặc định của chỉ báo đang nhập
summary: Khi nào OpenClaw hiển thị các chỉ báo đang nhập và cách điều chỉnh chúng
title: Chỉ báo đang nhập
x-i18n:
    generated_at: "2026-04-29T22:40:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 80f5c3bb79cf87f79db5336978b877f4a01025f59c9e822ab66198f00907123f
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Chỉ báo đang nhập được gửi đến kênh trò chuyện trong khi một lượt chạy đang hoạt động. Dùng
`agents.defaults.typingMode` để kiểm soát **khi nào** bắt đầu hiển thị đang nhập và `typingIntervalSeconds`
để kiểm soát **tần suất** làm mới.

## Mặc định

Khi `agents.defaults.typingMode` **chưa được đặt**, OpenClaw giữ hành vi cũ:

- **Trò chuyện trực tiếp**: đang nhập bắt đầu ngay khi vòng lặp mô hình bắt đầu.
- **Trò chuyện nhóm có nhắc đến**: đang nhập bắt đầu ngay lập tức.
- **Trò chuyện nhóm không có nhắc đến**: đang nhập chỉ bắt đầu khi văn bản tin nhắn bắt đầu truyền luồng.
- **Lượt chạy Heartbeat**: đang nhập bắt đầu khi lượt chạy Heartbeat bắt đầu nếu
  mục tiêu Heartbeat đã phân giải là một cuộc trò chuyện hỗ trợ đang nhập và đang nhập không bị tắt.

## Chế độ

Đặt `agents.defaults.typingMode` thành một trong các giá trị sau:

- `never` — không bao giờ có chỉ báo đang nhập.
- `instant` — bắt đầu đang nhập **ngay khi vòng lặp mô hình bắt đầu**, kể cả khi lượt chạy
  sau đó chỉ trả về token trả lời im lặng.
- `thinking` — bắt đầu đang nhập ở **delta suy luận đầu tiên** (yêu cầu
  `reasoningLevel: "stream"` cho lượt chạy).
- `message` — bắt đầu đang nhập ở **delta văn bản không im lặng đầu tiên** (bỏ qua
  token im lặng `NO_REPLY`).

Thứ tự “kích hoạt sớm đến mức nào”:
`never` → `message` → `thinking` → `instant`

## Cấu hình

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

Bạn có thể ghi đè chế độ hoặc nhịp theo từng phiên:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Ghi chú

- Chế độ `message` sẽ không hiển thị đang nhập cho các phản hồi chỉ im lặng khi toàn bộ
  tải trọng là token im lặng chính xác (ví dụ `NO_REPLY` / `no_reply`,
  khớp không phân biệt chữ hoa chữ thường).
- `thinking` chỉ kích hoạt nếu lượt chạy truyền luồng suy luận (`reasoningLevel: "stream"`).
  Nếu mô hình không phát ra các delta suy luận, đang nhập sẽ không bắt đầu.
- Đang nhập của Heartbeat là tín hiệu sống cho mục tiêu gửi đã phân giải. Nó
  bắt đầu khi lượt chạy Heartbeat bắt đầu thay vì tuân theo thời điểm luồng `message` hoặc `thinking`.
  Đặt `typingMode: "never"` để tắt.
- Heartbeat không hiển thị đang nhập khi `target: "none"`, khi không thể
  phân giải mục tiêu, khi việc gửi trò chuyện bị tắt cho Heartbeat, hoặc khi
  kênh không hỗ trợ đang nhập.
- `typingIntervalSeconds` kiểm soát **nhịp làm mới**, không phải thời điểm bắt đầu.
  Mặc định là 6 giây.

## Liên quan

- [Hiện diện](/vi/concepts/presence)
- [Truyền luồng và chia đoạn](/vi/concepts/streaming)
