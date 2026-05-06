---
read_when:
    - Thay đổi hành vi hoặc giá trị mặc định của chỉ báo đang nhập
summary: Khi OpenClaw hiển thị chỉ báo đang nhập và cách tinh chỉnh chúng
title: Chỉ báo đang nhập
x-i18n:
    generated_at: "2026-05-06T09:10:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59ee89a2f382b185e520fea178cf1860cbc4cfb8257c3b0ae7552fa4b1c79ef3
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Chỉ báo đang nhập được gửi tới kênh chat trong khi một lượt chạy đang hoạt động. Dùng
`agents.defaults.typingMode` để kiểm soát **khi nào** việc đang nhập bắt đầu và `typingIntervalSeconds`
để kiểm soát **tần suất** làm mới.

## Mặc định

Khi `agents.defaults.typingMode` **chưa được đặt**, OpenClaw giữ hành vi cũ:

- **Chat trực tiếp**: việc đang nhập bắt đầu ngay khi vòng lặp mô hình bắt đầu.
- **Chat nhóm có nhắc đến**: việc đang nhập bắt đầu ngay lập tức.
- **Chat nhóm không nhắc đến**: việc đang nhập chỉ bắt đầu khi văn bản tin nhắn bắt đầu truyền.
- **Lượt chạy Heartbeat**: việc đang nhập bắt đầu khi lượt chạy heartbeat bắt đầu nếu
  đích heartbeat đã phân giải là một chat hỗ trợ hiển thị đang nhập và tính năng đang nhập không bị tắt.

## Chế độ

Đặt `agents.defaults.typingMode` thành một trong các giá trị sau:

- `never` - không bao giờ có chỉ báo đang nhập.
- `instant` - bắt đầu đang nhập **ngay khi vòng lặp mô hình bắt đầu**, ngay cả khi lượt chạy
  sau đó chỉ trả về token phản hồi im lặng.
- `thinking` - bắt đầu đang nhập ở **delta suy luận đầu tiên** (yêu cầu
  `reasoningLevel: "stream"` cho lượt chạy).
- `message` - bắt đầu đang nhập ở **delta văn bản không im lặng đầu tiên** (bỏ qua
  token im lặng `NO_REPLY`).

Thứ tự "kích hoạt sớm đến đâu":
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

Bạn có thể ghi đè chế độ hoặc nhịp cho từng phiên:

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
  payload đúng bằng token im lặng (ví dụ `NO_REPLY` / `no_reply`,
  khớp không phân biệt chữ hoa chữ thường).
- `thinking` chỉ kích hoạt nếu lượt chạy truyền phát suy luận (`reasoningLevel: "stream"`).
  Nếu mô hình không phát delta suy luận, việc đang nhập sẽ không bắt đầu.
- Đang nhập của Heartbeat là tín hiệu còn hoạt động cho đích gửi đã phân giải. Nó
  bắt đầu khi lượt chạy heartbeat bắt đầu thay vì theo thời điểm luồng `message` hoặc `thinking`.
  Đặt `typingMode: "never"` để tắt.
- Heartbeat không hiển thị đang nhập khi `target: "none"`, khi không thể
  phân giải đích, khi việc gửi qua chat bị tắt cho heartbeat, hoặc khi
  kênh không hỗ trợ đang nhập.
- `typingIntervalSeconds` kiểm soát **nhịp làm mới**, không phải thời điểm bắt đầu.
  Mặc định là 6 giây.

## Liên quan

<CardGroup cols={2}>
  <Card title="Hiện diện" href="/vi/concepts/presence" icon="signal">
    Cách Gateway theo dõi các máy khách đã kết nối và hiển thị chúng trong tab Instances của macOS.
  </Card>
  <Card title="Truyền phát và chia đoạn" href="/vi/concepts/streaming" icon="bars-staggered">
    Hành vi truyền phát gửi đi, ranh giới đoạn, và cách gửi riêng theo kênh.
  </Card>
</CardGroup>
