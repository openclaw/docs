---
read_when:
    - Thay đổi hành vi hoặc giá trị mặc định của chỉ báo đang nhập văn bản
summary: Khi nào OpenClaw hiển thị chỉ báo đang nhập và cách điều chỉnh chúng
title: Chỉ báo đang nhập
x-i18n:
    generated_at: "2026-07-20T04:24:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cdaad6345ebf20ff3142020e584985c2dcc04e25f2ae4f11585e30903c9e4729
    source_path: concepts/typing-indicators.md
    workflow: 16
---

Chỉ báo đang nhập được gửi đến kênh trò chuyện trong khi một lượt chạy đang hoạt động. Dùng `agents.defaults.typingMode` để kiểm soát **thời điểm** bắt đầu hiển thị trạng thái đang nhập và `typingIntervalSeconds` để kiểm soát **tần suất** làm mới trạng thái đó (nhịp duy trì hoạt động, mặc định 6 giây).

## Mặc định

Khi `agents.defaults.typingMode` **chưa được đặt**:

- **Trò chuyện trực tiếp**: trạng thái đang nhập bắt đầu ngay khi vòng lặp mô hình khởi chạy.
- **Trò chuyện nhóm có lượt đề cập**: trạng thái đang nhập bắt đầu ngay lập tức.
- **Trò chuyện nhóm không có lượt đề cập**: trạng thái đang nhập bắt đầu khi lượt chạy đã được chấp nhận có hoạt động hiển thị với người dùng, chẳng hạn như hoạt động thực thi harness hoặc văn bản tin nhắn.
- **Lượt chạy Heartbeat**: trạng thái đang nhập bắt đầu khi lượt chạy Heartbeat khởi chạy, nếu đích Heartbeat đã phân giải là một cuộc trò chuyện hỗ trợ trạng thái đang nhập và trạng thái này không bị vô hiệu hóa.

## Chế độ

Đặt `agents.defaults.typingMode` thành một trong các giá trị sau:

- `never` - không bao giờ hiển thị chỉ báo đang nhập.
- `instant` - bắt đầu hiển thị trạng thái đang nhập **ngay khi vòng lặp mô hình khởi chạy**, ngay cả khi lượt chạy sau đó chỉ trả về token phản hồi im lặng.
- `thinking` - bắt đầu hiển thị trạng thái đang nhập khi có **delta suy luận đầu tiên**, hoặc khi harness bắt đầu thực thi sau khi lượt tương tác được chấp nhận.
- `message` - bắt đầu hiển thị trạng thái đang nhập khi có **hoạt động phản hồi hiển thị với người dùng đầu tiên**, chẳng hạn như hoạt động thực thi harness hoặc một delta văn bản không im lặng. Các token phản hồi im lặng như `NO_REPLY` không được tính là hoạt động văn bản.

Thứ tự theo "mức độ kích hoạt sớm": `never` -> `message`/`thinking` -> `instant`.

## Cấu hình

Đặt giá trị mặc định ở cấp tác tử:

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

Ghi đè chế độ cho từng phiên:

```json5
{
  session: {
    typingMode: "message",
  },
}
```

## Lưu ý

- Chế độ `message` không bắt đầu từ các token phản hồi im lặng, nhưng hoạt động thực thi vẫn có thể hiển thị trạng thái đang nhập trước khi có bất kỳ văn bản nào từ trợ lý.
- `thinking` vẫn phản ứng với luồng suy luận (`reasoningLevel: "stream"`), đồng thời cũng có thể bắt đầu từ hoạt động thực thi trước khi các delta suy luận xuất hiện.
- Trạng thái đang nhập của Heartbeat là tín hiệu cho biết đích phân phối đã phân giải vẫn đang hoạt động. Trạng thái này bắt đầu khi lượt chạy Heartbeat khởi chạy thay vì tuân theo thời điểm truyền luồng của `message` hoặc `thinking`. Đặt `typingMode: "never"` để vô hiệu hóa trạng thái này.
- Heartbeat không hiển thị trạng thái đang nhập khi đích Heartbeat là `"none"`, khi không thể phân giải đích, khi tính năng phân phối trò chuyện bị vô hiệu hóa cho Heartbeat hoặc khi kênh không hỗ trợ trạng thái đang nhập.
- `agents.defaults.typingIntervalSeconds` kiểm soát **nhịp làm mới**, không phải thời điểm bắt đầu. Mặc định: 6 giây.

## Liên quan

<CardGroup cols={2}>
  <Card title="Trạng thái hiện diện" href="/vi/concepts/presence" icon="signal">
    Cách Gateway theo dõi các máy khách đã kết nối cho trang Thiết bị trong Control UI và thẻ Phiên bản macOS.
  </Card>
  <Card title="Truyền luồng và phân đoạn" href="/vi/concepts/streaming" icon="bars-staggered">
    Hành vi truyền luồng đi, ranh giới phân đoạn và cơ chế phân phối dành riêng cho từng kênh.
  </Card>
</CardGroup>
