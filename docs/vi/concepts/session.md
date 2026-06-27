---
read_when:
    - Bạn muốn hiểu về định tuyến và cô lập phiên
    - Bạn muốn cấu hình phạm vi DM cho các thiết lập nhiều người dùng
    - Bạn đang gỡ lỗi các lần đặt lại phiên hằng ngày hoặc khi không hoạt động
summary: Cách OpenClaw quản lý các phiên hội thoại
title: Quản lý phiên
x-i18n:
    generated_at: "2026-06-27T17:26:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw tổ chức các cuộc hội thoại thành **phiên**. Mỗi tin nhắn được định tuyến đến một
phiên dựa trên nguồn gửi đến -- tin nhắn trực tiếp, cuộc trò chuyện nhóm, tác vụ Cron, v.v.

## Cách tin nhắn được định tuyến

| Nguồn                | Hành vi                         |
| -------------------- | ------------------------------- |
| Tin nhắn trực tiếp   | Mặc định dùng phiên dùng chung  |
| Cuộc trò chuyện nhóm | Cô lập theo từng nhóm           |
| Phòng/kênh           | Cô lập theo từng phòng          |
| Tác vụ Cron          | Phiên mới cho mỗi lần chạy      |
| Webhook              | Cô lập theo từng hook           |

## Cô lập DM

Theo mặc định, tất cả DM dùng chung một phiên để duy trì tính liên tục. Cách này phù hợp cho
thiết lập một người dùng.

<Warning>
Nếu nhiều người có thể nhắn tin cho agent của bạn, hãy bật cô lập DM. Nếu không, tất cả
người dùng sẽ dùng chung cùng ngữ cảnh hội thoại -- tin nhắn riêng của Alice sẽ hiển thị
với Bob.
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
- `per-peer` -- cô lập theo người gửi (trên các kênh).
- `per-channel-peer` -- cô lập theo kênh + người gửi (khuyến nghị).
- `per-account-channel-peer` -- cô lập theo tài khoản + kênh + người gửi.

<Tip>
Nếu cùng một người liên hệ với bạn từ nhiều kênh, hãy dùng
`session.identityLinks` để liên kết các danh tính của họ để họ dùng chung một phiên.
</Tip>

### Dock các kênh đã liên kết

Các lệnh dock cho phép người dùng chuyển tuyến trả lời của phiên trò chuyện trực tiếp hiện tại sang
một kênh đã liên kết khác mà không bắt đầu phiên mới. Xem
[Dock kênh](/vi/concepts/channel-docking) để biết ví dụ, cấu hình và
cách khắc phục sự cố.

Xác minh thiết lập của bạn bằng `openclaw security audit`.

## Vòng đời phiên

Các phiên được tái sử dụng cho đến khi hết hạn:

- **Đặt lại hằng ngày** (mặc định) -- phiên mới lúc 4:00 sáng theo giờ địa phương trên máy chủ
  Gateway. Độ mới hằng ngày dựa trên thời điểm `sessionId` hiện tại bắt đầu, không
  dựa trên các lần ghi siêu dữ liệu sau đó.
- **Đặt lại khi rảnh** (tùy chọn) -- phiên mới sau một khoảng thời gian không hoạt động. Đặt
  `session.reset.idleMinutes`. Độ mới khi rảnh dựa trên lần tương tác thực gần nhất của
  người dùng/kênh, vì vậy các sự kiện hệ thống Heartbeat, Cron và exec không
  giữ phiên sống.
- **Đặt lại thủ công** -- nhập `/new` hoặc `/reset` trong trò chuyện. `/new <model>` cũng
  chuyển đổi mô hình.

Khi cả đặt lại hằng ngày và đặt lại khi rảnh đều được cấu hình, điều kiện nào hết hạn trước sẽ được áp dụng.
Các lượt sự kiện hệ thống Heartbeat, Cron, exec và sự kiện hệ thống khác có thể ghi siêu dữ liệu phiên,
nhưng các lần ghi đó không kéo dài độ mới của đặt lại hằng ngày hoặc đặt lại khi rảnh. Khi một lần đặt lại
chuyển sang phiên mới, các thông báo sự kiện hệ thống đã xếp hàng cho phiên cũ sẽ bị
loại bỏ để các cập nhật nền đã cũ không được thêm vào đầu prompt đầu tiên trong
phiên mới.

Các phiên có phiên CLI do provider sở hữu đang hoạt động sẽ không bị cắt bởi mặc định hằng ngày
ngầm định. Dùng `/reset` hoặc cấu hình rõ ràng `session.reset` khi những
phiên đó cần hết hạn theo bộ hẹn giờ.

## Trạng thái nằm ở đâu

Toàn bộ trạng thái phiên thuộc sở hữu của **Gateway**. Các máy khách UI truy vấn Gateway để lấy
dữ liệu phiên.

- **Kho lưu trữ:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Bản ghi hội thoại:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` giữ các dấu thời gian vòng đời riêng biệt:

- `sessionStartedAt`: thời điểm `sessionId` hiện tại bắt đầu; đặt lại hằng ngày dùng giá trị này.
- `lastInteractionAt`: lần tương tác người dùng/kênh gần nhất kéo dài thời lượng rảnh.
- `updatedAt`: lần đột biến hàng trong kho lưu trữ gần nhất; hữu ích cho việc liệt kê và cắt tỉa, nhưng không
  có thẩm quyền đối với độ mới của đặt lại hằng ngày/khi rảnh.

Các hàng cũ không có `sessionStartedAt` được phân giải từ tiêu đề phiên JSONL của bản ghi hội thoại
khi có. Nếu một hàng cũ cũng thiếu `lastInteractionAt`,
độ mới khi rảnh sẽ dùng dự phòng là thời điểm bắt đầu phiên đó, không phải các lần ghi
sổ sách sau đó.

## Bảo trì phiên

OpenClaw tự động giới hạn dung lượng lưu trữ phiên theo thời gian. Theo mặc định, nó chạy
ở chế độ `enforce` và áp dụng dọn dẹp trong quá trình bảo trì. Đặt
`session.maintenance.mode` thành `"warn"` để báo cáo những gì sẽ được dọn dẹp mà không thay đổi kho lưu trữ/tệp:

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

Đối với các giới hạn `maxEntries` cỡ môi trường sản xuất, các lần ghi runtime của Gateway dùng một vùng đệm ngưỡng cao nhỏ và dọn lại về mức trần đã cấu hình theo lô. Các lần đọc kho lưu trữ phiên không cắt tỉa hoặc giới hạn số mục trong quá trình khởi động Gateway. Cách này tránh chạy dọn dẹp toàn bộ kho lưu trữ ở mỗi lần khởi động hoặc phiên Cron cô lập. `openclaw sessions cleanup --enforce` áp dụng mức trần ngay lập tức.

Các phiên thăm dò lần chạy mô hình của Gateway mặc định có thời gian sống ngắn. Các hàng khớp với
khóa tường minh nghiêm ngặt như `agent:*:explicit:model-run-<uuid>` dùng thời hạn lưu giữ cố định `24h`,
nhưng việc dọn dẹp được kích hoạt theo áp lực: nó chỉ xóa các hàng thăm dò đã cũ khi
đạt đến áp lực bảo trì/giới hạn số mục phiên. Khi dọn dẹp lần chạy mô hình chạy,
nó chạy trước ngưỡng tuổi của mục đã cũ rộng hơn và giới hạn số mục. Các phiên trực tiếp,
nhóm, luồng, Cron, hook, Heartbeat, ACP và sub-agent thông thường không kế thừa
thời hạn lưu giữ 24 giờ này.

Bảo trì giữ lại các con trỏ hội thoại bên ngoài bền vững, bao gồm các phiên nhóm
và phiên trò chuyện theo phạm vi luồng, trong khi vẫn cho phép các mục Cron,
hook, Heartbeat, ACP và sub-agent tổng hợp hết tuổi.

Nếu trước đây bạn dùng cô lập tin nhắn trực tiếp và sau đó đưa
`session.dmScope` về `main`, hãy xem trước các hàng DM cũ dùng khóa peer bằng
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Áp dụng cùng cờ đó
sẽ cho nghỉ các hàng DM trực tiếp cũ đó và giữ bản ghi hội thoại của chúng dưới dạng
kho lưu trữ đã xóa.

Xem trước bằng `openclaw sessions cleanup --dry-run`.

## Kiểm tra phiên

- `openclaw status` -- đường dẫn kho lưu trữ phiên và hoạt động gần đây.
- `openclaw sessions --json` -- tất cả phiên (lọc bằng `--active <minutes>`).
- `/status` trong trò chuyện -- mức sử dụng ngữ cảnh, mô hình và các nút bật/tắt.
- `/context list` -- nội dung trong system prompt.

## Đọc thêm

- [Cắt tỉa phiên](/vi/concepts/session-pruning) -- rút gọn kết quả công cụ
- [Compaction](/vi/concepts/compaction) -- tóm tắt các cuộc hội thoại dài
- [Công cụ phiên](/vi/concepts/session-tool) -- công cụ agent cho công việc liên phiên
- [Phân tích chuyên sâu về quản lý phiên](/vi/reference/session-management-compaction) --
  schema kho lưu trữ, bản ghi hội thoại, chính sách gửi, siêu dữ liệu nguồn gốc và cấu hình nâng cao
- [Đa agent](/vi/concepts/multi-agent) — định tuyến và cô lập phiên giữa các agent
- [Tác vụ nền](/vi/automation/tasks) — cách công việc tách rời tạo bản ghi tác vụ với tham chiếu phiên
- [Định tuyến kênh](/vi/channels/channel-routing) — cách tin nhắn đến được định tuyến đến phiên

## Liên quan

- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ phiên](/vi/concepts/session-tool)
- [Hàng đợi lệnh](/vi/concepts/queue)
