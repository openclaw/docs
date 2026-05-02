---
read_when:
    - Bạn muốn hiểu về định tuyến phiên và cách ly
    - Bạn muốn cấu hình phạm vi tin nhắn trực tiếp cho các thiết lập nhiều người dùng
    - Bạn đang gỡ lỗi các lần đặt lại phiên hằng ngày hoặc khi phiên không hoạt động
summary: Cách OpenClaw quản lý các phiên hội thoại
title: Quản lý phiên
x-i18n:
    generated_at: "2026-05-02T10:40:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2fd0c9e880242a8d0070c24bd1f7971e4082344240e28632e2e3ca032404807
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw tổ chức các cuộc trò chuyện thành **phiên**. Mỗi tin nhắn được định tuyến đến một
phiên dựa trên nơi nó đến từ -- DM, trò chuyện nhóm, cron job, v.v.

## Cách tin nhắn được định tuyến

| Nguồn             | Hành vi                         |
| ----------------- | ------------------------------- |
| Tin nhắn trực tiếp | Mặc định dùng chung phiên       |
| Trò chuyện nhóm   | Tách biệt theo từng nhóm        |
| Phòng/kênh        | Tách biệt theo từng phòng       |
| Cron job          | Phiên mới cho mỗi lần chạy      |
| Webhook           | Tách biệt theo từng hook        |

## Tách biệt DM

Theo mặc định, tất cả DM dùng chung một phiên để giữ tính liên tục. Cách này phù hợp cho
thiết lập một người dùng.

<Warning>
Nếu nhiều người có thể nhắn tin cho agent của bạn, hãy bật tách biệt DM. Nếu không, tất cả
người dùng sẽ dùng chung cùng một ngữ cảnh trò chuyện -- tin nhắn riêng của Alice sẽ
hiển thị với Bob.
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
- `per-peer` -- tách biệt theo người gửi (trên mọi kênh).
- `per-channel-peer` -- tách biệt theo kênh + người gửi (khuyến nghị).
- `per-account-channel-peer` -- tách biệt theo tài khoản + kênh + người gửi.

<Tip>
Nếu cùng một người liên hệ với bạn từ nhiều kênh, hãy dùng
`session.identityLinks` để liên kết danh tính của họ để họ dùng chung một phiên.
</Tip>

### Neo kênh đã liên kết

Các lệnh neo cho phép người dùng chuyển tuyến trả lời của phiên trò chuyện trực tiếp hiện tại sang
một kênh đã liên kết khác mà không bắt đầu phiên mới. Xem
[Neo kênh](/vi/concepts/channel-docking) để biết ví dụ, cấu hình và
khắc phục sự cố.

Xác minh thiết lập của bạn bằng `openclaw security audit`.

## Vòng đời phiên

Các phiên được tái sử dụng cho đến khi hết hạn:

- **Đặt lại hằng ngày** (mặc định) -- phiên mới lúc 4:00 sáng theo giờ địa phương trên máy chủ Gateway. Độ mới hằng ngày dựa trên thời điểm `sessionId` hiện tại bắt đầu, không dựa trên các lần ghi siêu dữ liệu sau đó.
- **Đặt lại khi nhàn rỗi** (tùy chọn) -- phiên mới sau một khoảng thời gian không hoạt động. Đặt
  `session.reset.idleMinutes`. Độ mới khi nhàn rỗi dựa trên lần tương tác thực gần nhất của
  người dùng/kênh, vì vậy các sự kiện hệ thống Heartbeat, cron và exec không
  giữ phiên sống.
- **Đặt lại thủ công** -- nhập `/new` hoặc `/reset` trong trò chuyện. `/new <model>` cũng
  chuyển đổi mô hình.

Khi cả đặt lại hằng ngày và đặt lại khi nhàn rỗi đều được cấu hình, mốc nào hết hạn trước sẽ được áp dụng.
Các lượt sự kiện hệ thống như Heartbeat, cron, exec và sự kiện khác có thể ghi siêu dữ liệu phiên,
nhưng các lần ghi đó không kéo dài độ mới cho đặt lại hằng ngày hoặc khi nhàn rỗi. Khi một lần đặt lại
chuyển sang phiên mới, các thông báo sự kiện hệ thống đang xếp hàng cho phiên cũ sẽ bị
loại bỏ để các cập nhật nền đã cũ không được thêm vào trước prompt đầu tiên trong
phiên mới.

Các phiên có phiên CLI do nhà cung cấp sở hữu đang hoạt động sẽ không bị cắt bởi mặc định hằng ngày
ngầm định. Dùng `/reset` hoặc cấu hình `session.reset` rõ ràng khi các
phiên đó cần hết hạn theo bộ hẹn giờ.

## Trạng thái nằm ở đâu

Toàn bộ trạng thái phiên do **Gateway** sở hữu. Các máy khách UI truy vấn Gateway để lấy
dữ liệu phiên.

- **Kho lưu trữ:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Bản ghi hội thoại:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` giữ các dấu thời gian vòng đời riêng biệt:

- `sessionStartedAt`: thời điểm `sessionId` hiện tại bắt đầu; đặt lại hằng ngày dùng giá trị này.
- `lastInteractionAt`: lần tương tác người dùng/kênh gần nhất giúp kéo dài thời lượng nhàn rỗi.
- `updatedAt`: lần thay đổi hàng trong kho lưu trữ gần nhất; hữu ích cho việc liệt kê và dọn bớt, nhưng không
  phải nguồn có thẩm quyền cho độ mới của đặt lại hằng ngày/khi nhàn rỗi.

Các hàng cũ không có `sessionStartedAt` được phân giải từ header phiên JSONL của bản ghi hội thoại
khi có. Nếu một hàng cũ cũng thiếu `lastInteractionAt`,
độ mới khi nhàn rỗi sẽ quay về thời điểm bắt đầu phiên đó, không phải các lần ghi sổ sách
sau này.

## Bảo trì phiên

OpenClaw tự động giới hạn dung lượng lưu trữ phiên theo thời gian. Theo mặc định, nó chạy
ở chế độ `warn` (báo cáo những gì sẽ được dọn). Đặt `session.maintenance.mode`
thành `"enforce"` để tự động dọn dẹp:

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

Với các giới hạn `maxEntries` cỡ production, các lần ghi runtime của Gateway dùng một bộ đệm ngưỡng cao nhỏ và dọn xuống mức trần đã cấu hình theo lô. Các lần đọc kho phiên không dọn bớt hoặc giới hạn mục trong lúc Gateway khởi động. Điều này tránh chạy dọn dẹp toàn bộ kho trong mỗi lần khởi động hoặc phiên cron tách biệt. `openclaw sessions cleanup --enforce` áp dụng giới hạn ngay lập tức.

Bảo trì giữ lại các con trỏ cuộc trò chuyện bên ngoài bền vững, bao gồm các phiên nhóm
và phiên trò chuyện theo phạm vi luồng, trong khi vẫn cho phép các mục cron tổng hợp,
hook, Heartbeat, ACP và tác tử phụ cũ đi theo thời gian.

Xem trước bằng `openclaw sessions cleanup --dry-run`.

## Kiểm tra phiên

- `openclaw status` -- đường dẫn kho phiên và hoạt động gần đây.
- `openclaw sessions --json` -- tất cả phiên (lọc bằng `--active <minutes>`).
- `/status` trong trò chuyện -- mức dùng ngữ cảnh, mô hình và các bật/tắt.
- `/context list` -- những gì có trong prompt hệ thống.

## Đọc thêm

- [Cắt tỉa phiên](/vi/concepts/session-pruning) -- rút gọn kết quả công cụ
- [Compaction](/vi/concepts/compaction) -- tóm tắt các cuộc trò chuyện dài
- [Công cụ phiên](/vi/concepts/session-tool) -- công cụ agent cho công việc xuyên phiên
- [Đi sâu quản lý phiên](/vi/reference/session-management-compaction) --
  schema kho lưu trữ, bản ghi hội thoại, chính sách gửi, siêu dữ liệu nguồn gốc và cấu hình nâng cao
- [Đa agent](/vi/concepts/multi-agent) — định tuyến và tách biệt phiên giữa các agent
- [Tác vụ nền](/vi/automation/tasks) — cách công việc tách rời tạo bản ghi tác vụ có tham chiếu phiên
- [Định tuyến kênh](/vi/channels/channel-routing) — cách tin nhắn đến được định tuyến đến phiên

## Liên quan

- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ phiên](/vi/concepts/session-tool)
- [Hàng đợi lệnh](/vi/concepts/queue)
