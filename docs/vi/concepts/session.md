---
read_when:
    - Bạn muốn hiểu về định tuyến và cô lập phiên
    - Bạn muốn cấu hình phạm vi tin nhắn trực tiếp cho các thiết lập nhiều người dùng
    - Bạn đang gỡ lỗi các lần đặt lại phiên hằng ngày hoặc khi không hoạt động
summary: Cách OpenClaw quản lý các phiên hội thoại
title: Quản lý phiên
x-i18n:
    generated_at: "2026-04-29T22:39:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bbb8f8fddf8ac942bc24b8b94a6464ec31d0aee035bf367726d2112269095f4
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw tổ chức các cuộc trò chuyện thành **phiên**. Mỗi tin nhắn được định tuyến đến một phiên dựa trên nơi nó đến từ -- DM, nhóm chat, cron job, v.v.

## Cách tin nhắn được định tuyến

| Nguồn          | Hành vi                  |
| --------------- | ------------------------- |
| Tin nhắn trực tiếp | Theo mặc định dùng chung phiên |
| Nhóm chat     | Tách biệt theo từng nhóm        |
| Phòng/kênh  | Tách biệt theo từng phòng         |
| Cron job       | Phiên mới cho mỗi lần chạy     |
| Webhook        | Tách biệt theo từng hook         |

## Cô lập DM

Theo mặc định, tất cả DM dùng chung một phiên để duy trì tính liên tục. Điều này phù hợp cho các thiết lập một người dùng.

<Warning>
Nếu nhiều người có thể nhắn tin cho agent của bạn, hãy bật cô lập DM. Nếu không, tất cả người dùng sẽ dùng chung cùng một ngữ cảnh cuộc trò chuyện -- tin nhắn riêng của Alice sẽ hiển thị với Bob.
</Warning>

**Cách sửa:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Các tùy chọn khác:

- `main` (mặc định) -- tất cả DM dùng chung một phiên.
- `per-peer` -- cô lập theo người gửi (trên nhiều kênh).
- `per-channel-peer` -- cô lập theo kênh + người gửi (khuyến nghị).
- `per-account-channel-peer` -- cô lập theo tài khoản + kênh + người gửi.

<Tip>
Nếu cùng một người liên hệ với bạn từ nhiều kênh, hãy dùng `session.identityLinks` để liên kết các danh tính của họ để họ dùng chung một phiên.
</Tip>

### Ghép kênh đã liên kết

Lệnh ghép cho phép người dùng chuyển tuyến trả lời của phiên chat trực tiếp hiện tại sang một kênh đã liên kết khác mà không bắt đầu phiên mới. Xem [Ghép kênh](/vi/concepts/channel-docking) để biết ví dụ, cấu hình và cách khắc phục sự cố.

Xác minh thiết lập của bạn bằng `openclaw security audit`.

## Vòng đời phiên

Các phiên được tái sử dụng cho đến khi hết hạn:

- **Đặt lại hằng ngày** (mặc định) -- phiên mới lúc 4:00 sáng theo giờ địa phương trên máy chủ Gateway. Độ mới hằng ngày dựa trên thời điểm `sessionId` hiện tại bắt đầu, không dựa trên các lần ghi siêu dữ liệu sau đó.
- **Đặt lại khi nhàn rỗi** (tùy chọn) -- phiên mới sau một khoảng thời gian không hoạt động. Đặt `session.reset.idleMinutes`. Độ mới khi nhàn rỗi dựa trên tương tác người dùng/kênh thực gần nhất, vì vậy Heartbeat, Cron và sự kiện hệ thống exec không giữ phiên tiếp tục hoạt động.
- **Đặt lại thủ công** -- nhập `/new` hoặc `/reset` trong chat. `/new <model>` cũng chuyển đổi model.

Khi cả đặt lại hằng ngày và đặt lại khi nhàn rỗi đều được cấu hình, điều kiện nào hết hạn trước sẽ được áp dụng. Heartbeat, Cron, exec và các lượt sự kiện hệ thống khác có thể ghi siêu dữ liệu phiên, nhưng những lần ghi đó không kéo dài độ mới cho đặt lại hằng ngày hoặc khi nhàn rỗi. Khi một lần đặt lại chuyển sang phiên mới, các thông báo sự kiện hệ thống đang xếp hàng cho phiên cũ sẽ bị loại bỏ để các cập nhật nền đã cũ không được thêm vào trước prompt đầu tiên trong phiên mới.

Các phiên có phiên CLI do provider sở hữu đang hoạt động sẽ không bị cắt bởi mặc định hằng ngày ngầm định. Dùng `/reset` hoặc cấu hình `session.reset` một cách rõ ràng khi các phiên đó cần hết hạn theo bộ hẹn giờ.

## Trạng thái nằm ở đâu

Toàn bộ trạng thái phiên thuộc sở hữu của **gateway**. Các UI client truy vấn Gateway để lấy dữ liệu phiên.

- **Kho lưu trữ:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Bản ghi hội thoại:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` lưu các mốc thời gian vòng đời riêng biệt:

- `sessionStartedAt`: thời điểm `sessionId` hiện tại bắt đầu; đặt lại hằng ngày dùng giá trị này.
- `lastInteractionAt`: tương tác người dùng/kênh gần nhất kéo dài thời gian sống khi nhàn rỗi.
- `updatedAt`: lần thay đổi hàng trong kho lưu trữ gần nhất; hữu ích cho việc liệt kê và dọn tỉa, nhưng không phải nguồn có thẩm quyền cho độ mới đặt lại hằng ngày/khi nhàn rỗi.

Các hàng cũ không có `sessionStartedAt` được phân giải từ header phiên trong JSONL bản ghi hội thoại khi có sẵn. Nếu một hàng cũ cũng thiếu `lastInteractionAt`, độ mới khi nhàn rỗi sẽ rơi về thời điểm bắt đầu phiên đó, không phải các lần ghi sổ sách sau này.

## Bảo trì phiên

OpenClaw tự động giới hạn dung lượng lưu trữ phiên theo thời gian. Theo mặc định, nó chạy ở chế độ `warn` (báo cáo những gì sẽ được dọn). Đặt `session.maintenance.mode` thành `"enforce"` để tự động dọn dẹp:

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

Với các giới hạn `maxEntries` ở quy mô production, các lần ghi runtime của Gateway dùng một bộ đệm high-water nhỏ và dọn trở lại mức trần đã cấu hình theo từng lô. Điều này tránh chạy dọn dẹp toàn bộ kho lưu trữ trên mỗi phiên Cron cô lập. `openclaw sessions cleanup --enforce` áp dụng mức trần ngay lập tức.

Xem trước bằng `openclaw sessions cleanup --dry-run`.

## Kiểm tra phiên

- `openclaw status` -- đường dẫn kho lưu trữ phiên và hoạt động gần đây.
- `openclaw sessions --json` -- tất cả phiên (lọc bằng `--active <minutes>`).
- `/status` trong chat -- mức sử dụng ngữ cảnh, model và các công tắc.
- `/context list` -- nội dung có trong system prompt.

## Đọc thêm

- [Dọn tỉa phiên](/vi/concepts/session-pruning) -- cắt gọn kết quả công cụ
- [Compaction](/vi/concepts/compaction) -- tóm tắt các cuộc trò chuyện dài
- [Công cụ phiên](/vi/concepts/session-tool) -- công cụ agent cho công việc liên phiên
- [Đào sâu Quản lý phiên](/vi/reference/session-management-compaction) --
  schema kho lưu trữ, bản ghi hội thoại, chính sách gửi, siêu dữ liệu nguồn gốc và cấu hình nâng cao
- [Đa agent](/vi/concepts/multi-agent) — định tuyến và cô lập phiên giữa các agent
- [Tác vụ nền](/vi/automation/tasks) — cách công việc tách rời tạo bản ghi tác vụ với tham chiếu phiên
- [Định tuyến kênh](/vi/channels/channel-routing) — cách tin nhắn đến được định tuyến tới phiên

## Liên quan

- [Dọn tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ phiên](/vi/concepts/session-tool)
- [Hàng đợi lệnh](/vi/concepts/queue)
