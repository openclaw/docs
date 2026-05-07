---
read_when:
    - Bạn muốn hiểu về định tuyến và cách ly phiên
    - Bạn muốn cấu hình phạm vi DM cho các thiết lập nhiều người dùng
    - Bạn đang gỡ lỗi các lần đặt lại phiên hằng ngày hoặc khi không hoạt động
summary: Cách OpenClaw quản lý các phiên hội thoại
title: Quản lý phiên
x-i18n:
    generated_at: "2026-05-07T13:15:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e5ec741a33262ce5c42caf021ad81892e89b3315db31ac7b141d5a13e8b22a2
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw sắp xếp các cuộc trò chuyện thành **phiên**. Mỗi tin nhắn được định tuyến đến một phiên dựa trên nơi nó xuất phát -- DM, cuộc trò chuyện nhóm, cron job, v.v.

## Cách tin nhắn được định tuyến

| Nguồn          | Hành vi                  |
| --------------- | ------------------------- |
| Tin nhắn trực tiếp | Theo mặc định dùng chung phiên |
| Cuộc trò chuyện nhóm     | Tách biệt theo từng nhóm        |
| Phòng/kênh  | Tách biệt theo từng phòng         |
| Cron job       | Phiên mới cho mỗi lần chạy     |
| Webhook        | Tách biệt theo từng hook         |

## Tách biệt DM

Theo mặc định, tất cả DM dùng chung một phiên để duy trì tính liên tục. Điều này phù hợp với các thiết lập một người dùng.

<Warning>
Nếu nhiều người có thể nhắn tin cho agent của bạn, hãy bật tách biệt DM. Nếu không, tất cả người dùng sẽ dùng chung cùng một ngữ cảnh trò chuyện -- tin nhắn riêng của Alice sẽ hiển thị với Bob.
</Warning>

**Cách khắc phục:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Các tùy chọn khác:

- `main` (mặc định) -- tất cả DM dùng chung một phiên.
- `per-peer` -- tách biệt theo người gửi (trên các kênh).
- `per-channel-peer` -- tách biệt theo kênh + người gửi (khuyến nghị).
- `per-account-channel-peer` -- tách biệt theo tài khoản + kênh + người gửi.

<Tip>
Nếu cùng một người liên hệ với bạn từ nhiều kênh, hãy dùng `session.identityLinks` để liên kết các danh tính của họ để họ dùng chung một phiên.
</Tip>

### Gắn kênh đã liên kết

Các lệnh dock cho phép người dùng chuyển tuyến trả lời của phiên trò chuyện trực tiếp hiện tại sang một kênh đã liên kết khác mà không bắt đầu phiên mới. Xem [Gắn kênh](/vi/concepts/channel-docking) để biết ví dụ, cấu hình và cách khắc phục sự cố.

Xác minh thiết lập của bạn bằng `openclaw security audit`.

## Vòng đời phiên

Phiên được tái sử dụng cho đến khi hết hạn:

- **Đặt lại hằng ngày** (mặc định) -- phiên mới lúc 4:00 sáng theo giờ địa phương trên máy chủ gateway. Độ mới hằng ngày dựa trên thời điểm `sessionId` hiện tại bắt đầu, không dựa trên các lần ghi siêu dữ liệu sau đó.
- **Đặt lại khi nhàn rỗi** (tùy chọn) -- phiên mới sau một khoảng thời gian không hoạt động. Đặt `session.reset.idleMinutes`. Độ mới khi nhàn rỗi dựa trên lần tương tác thực gần nhất của người dùng/kênh, nên các sự kiện hệ thống heartbeat, cron và exec không giữ phiên tiếp tục hoạt động.
- **Đặt lại thủ công** -- nhập `/new` hoặc `/reset` trong chat. `/new <model>` cũng chuyển đổi model.

Khi cả đặt lại hằng ngày và đặt lại khi nhàn rỗi đều được cấu hình, cơ chế nào hết hạn trước sẽ được áp dụng. Heartbeat, cron, exec và các lượt sự kiện hệ thống khác có thể ghi siêu dữ liệu phiên, nhưng các lần ghi đó không kéo dài độ mới của đặt lại hằng ngày hoặc khi nhàn rỗi. Khi một lần đặt lại chuyển sang phiên mới, các thông báo sự kiện hệ thống đang xếp hàng cho phiên cũ sẽ bị loại bỏ để các cập nhật nền đã cũ không được thêm vào đầu prompt đầu tiên trong phiên mới.

Các phiên có một phiên CLI đang hoạt động do provider sở hữu sẽ không bị cắt bởi mặc định hằng ngày ngầm định. Dùng `/reset` hoặc cấu hình rõ ràng `session.reset` khi những phiên đó cần hết hạn theo bộ hẹn giờ.

## Nơi lưu trạng thái

Tất cả trạng thái phiên thuộc sở hữu của **gateway**. Các client UI truy vấn gateway để lấy dữ liệu phiên.

- **Kho lưu trữ:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Bản ghi cuộc trò chuyện:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` giữ các dấu thời gian vòng đời riêng biệt:

- `sessionStartedAt`: thời điểm `sessionId` hiện tại bắt đầu; đặt lại hằng ngày dùng giá trị này.
- `lastInteractionAt`: lần tương tác người dùng/kênh gần nhất kéo dài thời gian sống khi nhàn rỗi.
- `updatedAt`: lần thay đổi hàng trong kho lưu trữ gần nhất; hữu ích cho việc liệt kê và cắt tỉa, nhưng không có thẩm quyền đối với độ mới của đặt lại hằng ngày/khi nhàn rỗi.

Các hàng cũ không có `sessionStartedAt` được phân giải từ header phiên JSONL trong bản ghi cuộc trò chuyện khi có sẵn. Nếu một hàng cũ cũng thiếu `lastInteractionAt`, độ mới khi nhàn rỗi sẽ quay về thời điểm bắt đầu phiên đó, không phải các lần ghi sổ sách sau đó.

## Bảo trì phiên

OpenClaw tự động giới hạn dung lượng lưu trữ phiên theo thời gian. Theo mặc định, nó chạy ở chế độ `warn` (báo cáo những gì sẽ được dọn dẹp). Đặt `session.maintenance.mode` thành `"enforce"` để tự động dọn dẹp:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Đối với các giới hạn `maxEntries` ở quy mô production, các lần ghi của runtime Gateway dùng một bộ đệm high-water nhỏ và dọn lại về mức trần đã cấu hình theo lô. Các lần đọc kho lưu trữ phiên không cắt tỉa hoặc giới hạn mục trong quá trình khởi động Gateway. Điều này tránh chạy dọn dẹp toàn bộ kho lưu trữ ở mỗi lần khởi động hoặc phiên cron tách biệt. `openclaw sessions cleanup --enforce` áp dụng giới hạn ngay lập tức.

Bảo trì giữ lại các con trỏ cuộc trò chuyện bên ngoài bền vững, bao gồm phiên nhóm và phiên chat theo phạm vi luồng, trong khi vẫn cho phép các mục cron, hook, heartbeat, ACP và sub-agent tổng hợp cũ đi và bị loại bỏ.

Nếu trước đây bạn đã dùng tách biệt tin nhắn trực tiếp rồi sau đó đưa `session.dmScope` về `main`, hãy xem trước các hàng DM cũ theo khóa peer bằng `openclaw sessions cleanup --dry-run --fix-dm-scope`. Áp dụng cùng cờ đó sẽ ngừng dùng các hàng direct-DM cũ và giữ bản ghi cuộc trò chuyện của chúng dưới dạng kho lưu trữ đã xóa.

Xem trước bằng `openclaw sessions cleanup --dry-run`.

## Kiểm tra phiên

- `openclaw status` -- đường dẫn kho lưu trữ phiên và hoạt động gần đây.
- `openclaw sessions --json` -- tất cả phiên (lọc bằng `--active <minutes>`).
- `/status` trong chat -- mức sử dụng ngữ cảnh, model và các công tắc.
- `/context list` -- nội dung có trong system prompt.

## Đọc thêm

- [Cắt tỉa phiên](/vi/concepts/session-pruning) -- rút gọn kết quả công cụ
- [Compaction](/vi/concepts/compaction) -- tóm tắt các cuộc trò chuyện dài
- [Công cụ phiên](/vi/concepts/session-tool) -- công cụ agent cho công việc liên phiên
- [Phân tích sâu về quản lý phiên](/vi/reference/session-management-compaction) -- schema kho lưu trữ, bản ghi cuộc trò chuyện, chính sách gửi, siêu dữ liệu nguồn gốc và cấu hình nâng cao
- [Đa agent](/vi/concepts/multi-agent) — định tuyến và tách biệt phiên giữa các agent
- [Tác vụ nền](/vi/automation/tasks) — cách công việc tách rời tạo bản ghi tác vụ với tham chiếu phiên
- [Định tuyến kênh](/vi/channels/channel-routing) — cách tin nhắn đến được định tuyến tới phiên

## Liên quan

- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ phiên](/vi/concepts/session-tool)
- [Hàng đợi lệnh](/vi/concepts/queue)
