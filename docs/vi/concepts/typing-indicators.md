---
read_when:
    - Thay đổi hành vi hoặc giá trị mặc định của chỉ báo đang nhập
summary: Khi OpenClaw hiển thị chỉ báo đang nhập và cách điều chỉnh chúng
title: Chỉ báo đang nhập
x-i18n:
    generated_at: "2026-05-10T19:32:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e26b4008f165527098ffcbf9c39ee7179149063842cc5c6aacb5b7c606eedc26
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Chỉ báo đang nhập được gửi tới kênh chat trong khi một lần chạy đang hoạt động. Dùng
`agents.defaults.typingMode` để kiểm soát **khi nào** bắt đầu hiển thị đang nhập và `typingIntervalSeconds`
để kiểm soát **tần suất** làm mới.

## Mặc định

Khi `agents.defaults.typingMode` **chưa được đặt**, OpenClaw giữ hành vi cũ:

- **Chat trực tiếp**: bắt đầu hiển thị đang nhập ngay khi vòng lặp mô hình bắt đầu.
- **Chat nhóm có nhắc đến**: bắt đầu hiển thị đang nhập ngay lập tức.
- **Chat nhóm không có nhắc đến**: chỉ bắt đầu hiển thị đang nhập khi văn bản tin nhắn bắt đầu streaming.
- **Lần chạy Heartbeat**: bắt đầu hiển thị đang nhập khi lần chạy Heartbeat bắt đầu nếu
  đích Heartbeat đã phân giải là một chat hỗ trợ hiển thị đang nhập và tính năng đang nhập không bị tắt.

## Chế độ

Đặt `agents.defaults.typingMode` thành một trong các giá trị sau:

- `never` - không bao giờ có chỉ báo đang nhập.
- `instant` - bắt đầu hiển thị đang nhập **ngay khi vòng lặp mô hình bắt đầu**, ngay cả khi lần chạy
  sau đó chỉ trả về token trả lời im lặng.
- `thinking` - bắt đầu hiển thị đang nhập ở **delta suy luận đầu tiên** (yêu cầu
  `reasoningLevel: "stream"` cho lần chạy).
- `message` - bắt đầu hiển thị đang nhập ở **delta văn bản không im lặng đầu tiên** (bỏ qua
  token im lặng `NO_REPLY`).

Thứ tự "kích hoạt sớm đến mức nào":
`never` → `message` → `thinking` → `instant`

## Cấu hình

Đặt mặc định ở cấp tác tử:

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

Ghi đè chế độ hoặc nhịp theo từng phiên:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Ghi chú

- Chế độ `message` sẽ không hiển thị đang nhập cho các trả lời chỉ im lặng khi toàn bộ
  payload là token im lặng chính xác (ví dụ `NO_REPLY` / `no_reply`,
  được khớp không phân biệt chữ hoa chữ thường).
- `thinking` chỉ kích hoạt nếu lần chạy stream suy luận (`reasoningLevel: "stream"`).
  Nếu mô hình không phát ra delta suy luận, hiển thị đang nhập sẽ không bắt đầu.
- Hiển thị đang nhập của Heartbeat là tín hiệu hoạt động cho đích phân phối đã phân giải. Nó
  bắt đầu khi lần chạy Heartbeat bắt đầu thay vì theo thời điểm stream của `message` hoặc `thinking`.
  Đặt `typingMode: "never"` để tắt tính năng này.
- Heartbeat không hiển thị đang nhập khi `target: "none"`, khi không thể
  phân giải đích, khi phân phối chat bị tắt cho Heartbeat, hoặc khi
  kênh không hỗ trợ hiển thị đang nhập.
- `typingIntervalSeconds` kiểm soát **nhịp làm mới**, không phải thời điểm bắt đầu.
  Mặc định là 6 giây.

## Liên quan

<CardGroup cols={2}>
  <Card title="Hiện diện" href="/vi/concepts/presence" icon="signal">
    Cách Gateway theo dõi các client đã kết nối và hiển thị chúng trong tab Instances của macOS.
  </Card>
  <Card title="Streaming và chia khúc" href="/vi/concepts/streaming" icon="bars-staggered">
    Hành vi streaming gửi ra, ranh giới khúc và phân phối theo từng kênh.
  </Card>
</CardGroup>
