---
read_when:
    - Thay đổi hành vi hoặc giá trị mặc định của chỉ báo đang nhập văn bản
summary: Khi nào OpenClaw hiển thị chỉ báo đang nhập và cách điều chỉnh chúng
title: Chỉ báo đang nhập
x-i18n:
    generated_at: "2026-07-16T15:13:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 55e5ec38f47e0612b25b5561790e9b8a17ea4e215c4038bb89af83f861089e03
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Chỉ báo đang nhập được gửi đến kênh trò chuyện trong khi một lượt chạy đang hoạt động. Dùng `agents.defaults.typingMode` để kiểm soát **thời điểm** bắt đầu hiển thị đang nhập và `typingIntervalSeconds` để kiểm soát **tần suất** làm mới (nhịp duy trì hoạt động, mặc định 6 giây).

## Mặc định

Khi `agents.defaults.typingMode` **chưa được đặt**:

- **Trò chuyện trực tiếp**: bắt đầu hiển thị đang nhập ngay khi vòng lặp mô hình bắt đầu.
- **Trò chuyện nhóm có lượt đề cập**: bắt đầu hiển thị đang nhập ngay lập tức.
- **Trò chuyện nhóm không có lượt đề cập**: bắt đầu hiển thị đang nhập khi lượt chạy được chấp nhận có hoạt động hiển thị với người dùng, chẳng hạn như hoạt động thực thi harness hoặc nội dung tin nhắn.
- **Lượt chạy Heartbeat**: bắt đầu hiển thị đang nhập khi lượt chạy Heartbeat bắt đầu, nếu đích Heartbeat đã phân giải là một cuộc trò chuyện hỗ trợ chỉ báo đang nhập và tính năng này không bị tắt.

## Chế độ

Đặt `agents.defaults.typingMode` thành một trong các giá trị sau:

- `never` - không bao giờ hiển thị chỉ báo đang nhập.
- `instant` - bắt đầu hiển thị đang nhập **ngay khi vòng lặp mô hình bắt đầu**, ngay cả khi sau đó lượt chạy chỉ trả về token phản hồi im lặng.
- `thinking` - bắt đầu hiển thị đang nhập tại **delta suy luận đầu tiên**, hoặc khi harness bắt đầu thực thi sau khi lượt tương tác được chấp nhận.
- `message` - bắt đầu hiển thị đang nhập tại **hoạt động phản hồi hiển thị với người dùng đầu tiên**, chẳng hạn như hoạt động thực thi harness hoặc một delta văn bản không im lặng. Các token phản hồi im lặng như `NO_REPLY` không được tính là hoạt động văn bản.

Thứ tự theo mức độ "kích hoạt sớm": `never` -> `message`/`thinking` -> `instant`.

## Cấu hình

Đặt giá trị mặc định ở cấp tác nhân:

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

- Chế độ `message` không bắt đầu từ các token phản hồi im lặng, nhưng hoạt động thực thi vẫn có thể hiển thị trạng thái đang nhập trước khi có bất kỳ văn bản nào từ trợ lý.
- `thinking` vẫn phản ứng với luồng suy luận (`reasoningLevel: "stream"`) và cũng có thể bắt đầu từ hoạt động thực thi trước khi các delta suy luận xuất hiện.
- Chỉ báo đang nhập của Heartbeat là tín hiệu cho biết đích phân phối đã phân giải vẫn đang hoạt động. Chỉ báo bắt đầu khi lượt chạy Heartbeat bắt đầu thay vì tuân theo thời điểm truyền luồng của `message` hoặc `thinking`. Đặt `typingMode: "never"` để tắt chỉ báo này.
- Heartbeat không hiển thị trạng thái đang nhập khi đích Heartbeat là `"none"`, khi không thể phân giải đích, khi việc phân phối qua trò chuyện bị tắt đối với Heartbeat hoặc khi kênh không hỗ trợ chỉ báo đang nhập.
- `typingIntervalSeconds` kiểm soát **nhịp làm mới**, không phải thời điểm bắt đầu. Mặc định: 6 giây.

## Liên quan

<CardGroup cols={2}>
  <Card title="Trạng thái hiện diện" href="/vi/concepts/presence" icon="signal">
    Cách Gateway theo dõi các máy khách đã kết nối cho trang Thiết bị của Control UI và thẻ Phiên bản macOS.
  </Card>
  <Card title="Truyền luồng và phân đoạn" href="/vi/concepts/streaming" icon="bars-staggered">
    Hành vi truyền luồng gửi đi, ranh giới phân đoạn và cơ chế phân phối riêng theo từng kênh.
  </Card>
</CardGroup>
