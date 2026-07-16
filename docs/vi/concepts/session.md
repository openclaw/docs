---
read_when:
    - Bạn muốn tìm hiểu về việc định tuyến và cô lập phiên làm việc
    - Bạn muốn cấu hình phạm vi tin nhắn trực tiếp cho các thiết lập nhiều người dùng
    - Bạn đang gỡ lỗi việc đặt lại phiên hằng ngày hoặc khi không hoạt động
summary: Cách OpenClaw quản lý các phiên hội thoại
title: Quản lý phiên
x-i18n:
    generated_at: "2026-07-16T14:20:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw định tuyến mọi tin nhắn đến đến một **phiên** dựa trên nguồn gửi:
tin nhắn trực tiếp, cuộc trò chuyện nhóm, tác vụ cron, v.v. Toàn bộ trạng thái phiên do
**Gateway** sở hữu; các máy khách giao diện người dùng truy vấn Gateway để lấy dữ liệu phiên.

## Cách định tuyến tin nhắn

| Nguồn             | Hành vi                         |
| ----------------- | ------------------------------- |
| Tin nhắn trực tiếp | Mặc định dùng chung một phiên   |
| Cuộc trò chuyện nhóm | Cô lập theo từng nhóm         |
| Phòng/kênh         | Cô lập theo từng phòng          |
| Tác vụ Cron        | Phiên mới cho mỗi lần chạy      |
| Webhook            | Cô lập theo từng hook           |

## Cô lập tin nhắn trực tiếp

Theo mặc định, tất cả tin nhắn trực tiếp dùng chung một phiên để duy trì tính liên tục, điều này phù hợp với
các thiết lập chỉ có một người dùng.

<Warning>
Nếu nhiều người có thể nhắn tin cho agent của bạn, hãy bật chế độ cô lập tin nhắn trực tiếp. Nếu không, tất cả
người dùng sẽ dùng chung ngữ cảnh hội thoại, vì vậy tin nhắn riêng tư của Alice sẽ
hiển thị với Bob.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // cô lập theo kênh + người gửi
  },
}
```

Các tùy chọn `session.dmScope`:

| Giá trị                    | Hành vi                                            |
| -------------------------- | ------------------------------------------------- |
| `main` (mặc định)           | Tất cả tin nhắn trực tiếp dùng chung một phiên    |
| `per-peer`                 | Cô lập theo người gửi, trên mọi kênh               |
| `per-channel-peer`         | Cô lập theo kênh + người gửi (khuyến nghị)         |
| `per-account-channel-peer` | Cô lập theo tài khoản + kênh + người gửi           |

<Tip>
Nếu cùng một người liên hệ với bạn qua nhiều kênh, hãy dùng
`session.identityLinks` để ánh xạ các danh tính của họ vào một mã định danh đối tác chuẩn duy nhất, nhờ đó
họ dùng chung một phiên.
</Tip>

### Neo các kênh được liên kết

Các lệnh neo chuyển tuyến trả lời của phiên trò chuyện trực tiếp hiện tại sang một
kênh được liên kết khác mà không bắt đầu phiên mới. Xem
[Neo kênh](/vi/concepts/channel-docking) để biết ví dụ, cấu hình và
cách khắc phục sự cố.

Xác minh thiết lập bằng `openclaw security audit`.

## Vòng đời phiên

Các phiên được tái sử dụng cho đến khi hết hạn theo `session.reset`:

- **Đặt lại hằng ngày** (mặc định `mode: "daily"`) - phiên mới vào một giờ địa phương
  đã cấu hình (`session.reset.atHour`, mặc định `4`, 0-23) trên máy chủ Gateway. Độ mới
  hằng ngày dựa trên thời điểm `sessionId` hiện tại bắt đầu, không dựa trên các lần
  ghi siêu dữ liệu sau đó.
- **Đặt lại khi không hoạt động** (`mode: "idle"`) - phiên mới sau `session.reset.idleMinutes`
  không hoạt động. Độ mới khi không hoạt động dựa trên lần tương tác thực tế gần nhất của người dùng/kênh,
  vì vậy các sự kiện hệ thống Heartbeat, Cron và exec không duy trì
  phiên hoạt động.
- **Đặt lại thủ công** - nhập `/new` hoặc `/reset` trong cuộc trò chuyện. `/new <model>` cũng
  chuyển đổi mô hình.

Khi cả đặt lại hằng ngày và đặt lại khi không hoạt động đều được cấu hình, điều kiện hết hạn trước sẽ được áp dụng.
Các lượt Heartbeat, Cron, exec và sự kiện hệ thống khác có thể ghi siêu dữ liệu phiên,
nhưng những lần ghi đó không kéo dài độ mới của việc đặt lại hằng ngày hoặc khi không hoạt động. Khi thao tác đặt lại
chuyển sang phiên mới, các thông báo sự kiện hệ thống đang xếp hàng cho phiên cũ sẽ bị
loại bỏ để các bản cập nhật nền cũ không được thêm vào đầu lời nhắc đầu tiên trong
phiên mới.

Các phiên có phiên CLI đang hoạt động do nhà cung cấp sở hữu sẽ không bị cắt bởi giá trị mặc định
hằng ngày ngầm định. Hãy dùng `/reset` hoặc cấu hình rõ ràng `session.reset` khi các
phiên đó cần hết hạn theo bộ hẹn giờ.

Ghi đè giá trị mặc định theo từng loại trò chuyện hoặc từng kênh:

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` hỗ trợ `direct` (bí danh cũ `dm`), `group` và `thread`.
`session.idleMinutes` cấp cao nhất cũ vẫn hoạt động như một bí danh tương thích cho
giá trị mặc định ở chế độ không hoạt động khi không thiết lập khối `session.reset`/`resetByType`.

## Nơi lưu trạng thái

- **Các hàng phiên thời gian chạy:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Các tệp bản chép lời đã lưu trữ:** `~/.openclaw/agents/<agentId>/sessions/`
- **Nguồn di chuyển hàng cũ:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Các hàng phiên trong cơ sở dữ liệu SQLite theo từng agent lưu các dấu thời gian vòng đời
riêng biệt:

- `sessionStartedAt`: thời điểm `sessionId` hiện tại bắt đầu; thao tác đặt lại hằng ngày sử dụng giá trị này.
- `lastInteractionAt`: lần tương tác gần nhất của người dùng/kênh làm kéo dài thời gian tồn tại khi không hoạt động.
- `updatedAt`: lần sửa đổi hàng trong kho gần nhất; hữu ích cho việc liệt kê và dọn dẹp, nhưng không
  phải nguồn có thẩm quyền về độ mới của việc đặt lại hằng ngày/khi không hoạt động.

Trong quá trình di chuyển từ các bản cài đặt cũ, khi Gateway khởi động và `openclaw doctor
--fix` sẽ tự động nhập các hàng `sessions.json` cũ cùng lịch sử JSONL bản chép lời đang hoạt động vào
SQLite. Các hàng không có `sessionStartedAt` được phân giải từ
phần đầu phiên trong JSONL bản chép lời cũ khi có. Nếu một hàng cũ cũng
không có `lastInteractionAt`, độ mới khi không hoạt động sẽ dùng thời điểm bắt đầu phiên đó làm giá trị dự phòng,
không dùng các lần ghi sổ sách sau này. Hãy dùng `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` và [trình tự di chuyển của Doctor
](/vi/cli/doctor#session-sqlite-migration) khi bạn muốn có bằng chứng kiểm tra
hoặc xác thực rõ ràng.

## Bảo trì phiên

OpenClaw giới hạn dung lượng lưu trữ phiên theo thời gian thông qua `session.maintenance`, với các giá trị mặc định
như sau:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" thực hiện dọn dẹp; "warn" chỉ báo cáo
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Đối với các giới hạn `maxEntries` ở quy mô sản xuất, các lần ghi thời gian chạy của Gateway sử dụng một vùng đệm
mức cao nhỏ và dọn theo lô trở lại mức trần đã cấu hình.
Việc đọc kho phiên không lược bỏ hoặc giới hạn số mục trong lúc Gateway khởi động, vì vậy
các phiên khởi động và Cron cô lập không phải thực hiện dọn dẹp toàn bộ kho.
`openclaw sessions cleanup --enforce` áp dụng mức trần ngay lập tức.

Các phiên thăm dò lượt chạy mô hình của Gateway mặc định có thời gian tồn tại ngắn. Các hàng khớp với
`agent:*:explicit:model-run-<uuid>` sử dụng thời gian lưu giữ cố định `24h`, nhưng việc dọn dẹp
được kiểm soát theo áp lực: chỉ xóa các hàng thăm dò cũ khi đạt đến
áp lực bảo trì/giới hạn số mục phiên, đồng thời chạy trước ngưỡng
tuổi của các mục cũ và giới hạn số mục rộng hơn. Các phiên trực tiếp, nhóm, luồng, Cron, hook, Heartbeat,
ACP và agent con thông thường không kế thừa thời gian lưu giữ 24h này.

Quá trình bảo trì giữ nguyên các con trỏ hội thoại bên ngoài lâu dài, bao gồm các phiên nhóm
và phiên trò chuyện có phạm vi theo luồng, đồng thời vẫn cho phép các mục Cron tổng hợp,
hook, Heartbeat, ACP và agent con hết hạn theo thời gian.

Nếu trước đây bạn đã sử dụng chế độ cô lập tin nhắn trực tiếp và sau đó đưa `session.dmScope` về
`main`, hãy xem trước các hàng tin nhắn trực tiếp cũ được định danh theo đối tác bằng
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Việc áp dụng cùng cờ đó
sẽ ngừng sử dụng các hàng tin nhắn trực tiếp cũ này và giữ bản chép lời của chúng dưới dạng kho lưu trữ
đã xóa.

Xem trước bất kỳ lần bảo trì nào bằng `openclaw sessions cleanup --dry-run`.

## Kiểm tra phiên

| Lệnh                       | Hiển thị                                             |
| -------------------------- | --------------------------------------------------- |
| `openclaw status`          | Đường dẫn kho phiên và hoạt động gần đây             |
| `openclaw sessions --json` | Tất cả phiên (lọc bằng `--active <minutes>`) |
| `/status` trong cuộc trò chuyện          | Mức sử dụng ngữ cảnh, mô hình và các nút bật/tắt     |
| `/context list`            | Nội dung trong lời nhắc hệ thống                     |

## Đọc thêm

- [Tìm kiếm phiên](/vi/concepts/session-search) - truy hồi toàn văn trên các bản chép lời trước đây
- [Lược bỏ phiên](/vi/concepts/session-pruning) - cắt gọn kết quả công cụ
- [Compaction](/vi/concepts/compaction) - tóm tắt các cuộc hội thoại dài
- [Công cụ phiên](/vi/concepts/session-tool) - công cụ dành cho agent để làm việc xuyên phiên
- [Tìm hiểu chuyên sâu về quản lý phiên](/vi/reference/session-management-compaction) -
  lược đồ kho, bản chép lời, chính sách gửi, siêu dữ liệu nguồn gốc và cấu hình nâng cao
- [Đa agent](/vi/concepts/multi-agent) - định tuyến và cô lập phiên giữa các agent
- [Tác vụ nền](/vi/automation/tasks) - cách công việc tách rời tạo bản ghi tác vụ có tham chiếu phiên
- [Định tuyến kênh](/vi/channels/channel-routing) - cách tin nhắn đến được định tuyến vào các phiên

## Liên quan

- [Lược bỏ phiên](/vi/concepts/session-pruning)
- [Công cụ phiên](/vi/concepts/session-tool)
- [Hàng đợi lệnh](/vi/concepts/queue)
