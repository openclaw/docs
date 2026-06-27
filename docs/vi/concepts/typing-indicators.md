---
read_when:
    - Thay đổi hành vi hoặc mặc định của chỉ báo đang nhập
summary: Khi OpenClaw hiển thị chỉ báo đang nhập và cách tinh chỉnh chúng
title: Chỉ báo đang nhập
x-i18n:
    generated_at: "2026-06-27T17:26:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fa76889d0f6262f1092abefee02aee8fe944651dc89d3a697ccc86e16558ed60
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Các chỉ báo đang nhập được gửi đến kênh trò chuyện trong khi một lượt chạy đang hoạt động. Dùng
`agents.defaults.typingMode` để kiểm soát **khi nào** việc đang nhập bắt đầu và `typingIntervalSeconds`
để kiểm soát **tần suất** làm mới.

## Mặc định

Khi `agents.defaults.typingMode` **chưa được đặt**, OpenClaw giữ hành vi cũ:

- **Trò chuyện trực tiếp**: trạng thái đang nhập bắt đầu ngay khi vòng lặp mô hình bắt đầu.
- **Trò chuyện nhóm có nhắc đến**: trạng thái đang nhập bắt đầu ngay lập tức.
- **Trò chuyện nhóm không có nhắc đến**: trạng thái đang nhập bắt đầu khi lượt chạy được chấp nhận có
  hoạt động hiển thị với người dùng, chẳng hạn như hoạt động thực thi bộ khung hoặc văn bản tin nhắn.
- **Lượt chạy Heartbeat**: trạng thái đang nhập bắt đầu khi lượt chạy heartbeat bắt đầu nếu
  đích heartbeat đã phân giải là một cuộc trò chuyện có hỗ trợ đang nhập và trạng thái đang nhập không bị tắt.

## Chế độ

Đặt `agents.defaults.typingMode` thành một trong các giá trị:

- `never` - không bao giờ có chỉ báo đang nhập.
- `instant` - bắt đầu đang nhập **ngay khi vòng lặp mô hình bắt đầu**, ngay cả khi lượt chạy
  sau đó chỉ trả về token phản hồi im lặng.
- `thinking` - bắt đầu đang nhập ở **delta suy luận đầu tiên** hoặc khi có
  thực thi bộ khung đang hoạt động sau khi lượt được chấp nhận.
- `message` - bắt đầu đang nhập ở **hoạt động phản hồi hiển thị với người dùng đầu tiên**, chẳng hạn như
  thực thi bộ khung đang hoạt động hoặc một delta văn bản không im lặng. Các token phản hồi im lặng như
  `NO_REPLY` không được tính là hoạt động văn bản.

Thứ tự về "mức độ kích hoạt sớm":
`never` → `message`/`thinking` → `instant`

## Cấu hình

Đặt mặc định cấp tác nhân:

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

Ghi đè chế độ hoặc nhịp độ theo từng phiên:

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## Ghi chú

- Chế độ `message` không bắt đầu từ các token phản hồi im lặng, nhưng thực thi đang hoạt động
  vẫn có thể hiển thị trạng thái đang nhập trước khi có bất kỳ văn bản trợ lý nào.
- `thinking` vẫn phản ứng với suy luận được truyền trực tuyến (`reasoningLevel: "stream"`),
  và cũng có thể bắt đầu từ thực thi đang hoạt động trước khi các delta suy luận đến.
- Trạng thái đang nhập của Heartbeat là tín hiệu còn hoạt động cho đích phân phối đã phân giải. Nó
  bắt đầu khi lượt chạy heartbeat bắt đầu thay vì tuân theo thời điểm luồng `message` hoặc `thinking`.
  Đặt `typingMode: "never"` để tắt.
- Heartbeat không hiển thị trạng thái đang nhập khi `target: "none"`, khi không thể phân giải
  đích, khi phân phối trò chuyện bị tắt cho heartbeat, hoặc khi
  kênh không hỗ trợ trạng thái đang nhập.
- `typingIntervalSeconds` kiểm soát **nhịp làm mới**, không phải thời điểm bắt đầu.
  Mặc định là 6 giây.

## Liên quan

<CardGroup cols={2}>
  <Card title="Hiện diện" href="/vi/concepts/presence" icon="signal">
    Cách Gateway theo dõi các máy khách đã kết nối và hiển thị chúng trong tab Phiên bản trên macOS.
  </Card>
  <Card title="Truyền trực tuyến và chia đoạn" href="/vi/concepts/streaming" icon="bars-staggered">
    Hành vi truyền trực tuyến gửi đi, ranh giới đoạn và phân phối theo từng kênh.
  </Card>
</CardGroup>
