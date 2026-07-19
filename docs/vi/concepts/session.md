---
read_when:
    - Bạn muốn tìm hiểu về định tuyến và cô lập phiên làm việc
    - Bạn muốn cấu hình phạm vi DM cho các thiết lập nhiều người dùng
    - Bạn đang gỡ lỗi việc đặt lại phiên hằng ngày hoặc khi không hoạt động
summary: Cách OpenClaw quản lý các phiên hội thoại
title: Quản lý phiên làm việc
x-i18n:
    generated_at: "2026-07-19T16:58:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f088fe128201a53b10a1b103c9a7be4dd45162e8bbbb174c2a3c4b9663f1eeb6
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw định tuyến mọi tin nhắn đến vào một **phiên** dựa trên nguồn gửi:
tin nhắn trực tiếp, cuộc trò chuyện nhóm, tác vụ cron, v.v. Toàn bộ trạng thái phiên
do **Gateway** sở hữu; các máy khách UI truy vấn Gateway để lấy dữ liệu phiên.

Để tìm hiểu cấu hình mặc định cho tác nhân cá nhân — một cuộc hội thoại liên tục
được tất cả các kênh tin nhắn trực tiếp của bạn dùng chung, đồng thời tiếp nhận hoạt động
nhóm và công việc nền — hãy xem [Phiên chính](/concepts/main-session).

## Cách định tuyến tin nhắn

| Nguồn                 | Hành vi                          |
| --------------------- | -------------------------------- |
| Tin nhắn trực tiếp    | Mặc định dùng chung phiên        |
| Cuộc trò chuyện nhóm  | Tách biệt theo từng nhóm         |
| Phòng/kênh            | Tách biệt theo từng phòng        |
| Tác vụ cron           | Phiên mới cho mỗi lần chạy       |
| Webhook               | Tách biệt theo từng hook         |

## Tách biệt tin nhắn trực tiếp

Theo mặc định, tất cả tin nhắn trực tiếp dùng chung một phiên để duy trì tính
liên tục; cách này phù hợp với cấu hình chỉ có một người dùng.

<Warning>
Nếu nhiều người có thể nhắn tin cho tác nhân của bạn, hãy bật tính năng tách biệt
tin nhắn trực tiếp. Nếu không, mọi người dùng sẽ chia sẻ cùng một ngữ cảnh hội thoại,
do đó Bob có thể thấy các tin nhắn riêng tư của Alice.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // tách biệt theo kênh + người gửi
  },
}
```

Các tùy chọn `session.dmScope`:

| Giá trị                    | Hành vi                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `main` (mặc định) | Tất cả tin nhắn trực tiếp dùng chung [phiên chính](/concepts/main-session) |
| `per-peer`         | Tách biệt theo người gửi, trên tất cả các kênh                    |
| `per-channel-peer`         | Tách biệt theo kênh + người gửi (khuyến nghị)                     |
| `per-account-channel-peer`         | Tách biệt theo tài khoản + kênh + người gửi                       |

<Tip>
Nếu cùng một người liên hệ với bạn qua nhiều kênh, hãy dùng
`session.identityLinks` để ánh xạ các danh tính của họ tới một mã định danh đối tác
chuẩn duy nhất, nhờ đó họ dùng chung một phiên.
</Tip>

### Gắn các kênh đã liên kết

Các lệnh gắn chuyển tuyến trả lời của phiên trò chuyện trực tiếp hiện tại sang
một kênh đã liên kết khác mà không bắt đầu phiên mới. Xem
[Gắn kênh](/vi/concepts/channel-docking) để biết ví dụ, cấu hình và cách
khắc phục sự cố.

Xác minh cấu hình của bạn bằng `openclaw security audit`.

## Ghi nhớ giữa các cuộc hội thoại

Các bản ghi riêng biệt kiểm soát lịch sử cục bộ của từng cuộc hội thoại. Đối với
tác nhân cá nhân hoặc tác nhân hoàn toàn đáng tin cậy, `memorySearch.rememberAcrossConversations: true`
thêm một bước truy xuất tùy chọn trên các cuộc hội thoại riêng tư khác của tác nhân
đó; tính năng này không kết hợp các bản ghi của chúng.

Các cuộc hội thoại trực tiếp riêng tư và các cuộc hội thoại UI tường minh, lâu dài
có thể cung cấp ngữ cảnh liên quan cho nhau. Nhóm và kênh vẫn tách biệt theo cả hai
chiều: bản ghi của chúng không phải là nguồn hồi tưởng riêng tư và các câu trả lời
trong những cuộc hội thoại đó không nhận ngữ cảnh bản ghi riêng tư. Cuộc hội thoại
hiện tại cũng bị loại trừ vì lịch sử của nó đã được tải.

Cài đặt này không thay đổi khóa phiên, phạm vi tin nhắn trực tiếp, định tuyến, phân phối
hoặc `tools.sessions.visibility`. Bộ nhớ không gian làm việc dùng chung trong
`MEMORY.md` và `memory/*.md` cũng giữ nguyên hành vi hiện có. Nhà cung cấp
bộ nhớ hiện tại phải hỗ trợ khả năng hồi tưởng bản ghi riêng tư được bảo vệ; các công cụ
ngữ cảnh như Lossless Claw vẫn hoạt động độc lập và có thể chạy song song với tính năng
này. Xem [Active Memory](/vi/concepts/active-memory#remember-across-conversations) để biết
chi tiết về cấu hình và thời gian chạy.

## Vòng đời phiên

Các phiên được tái sử dụng cho đến khi bạn đặt lại chúng theo cách thủ công hoặc chọn
dùng một chính sách đặt lại tự động:

- **Không tự động đặt lại** (mặc định `mode: "none"`) - các phiên giữ nguyên
  `sessionId`; Compaction quản lý ngữ cảnh đang hoạt động khi cuộc hội thoại dài thêm.
- **Đặt lại hằng ngày** (`mode: "daily"`) - chọn bắt đầu phiên mới vào một
  giờ địa phương đã cấu hình (`session.reset.atHour`, mặc định `4`, 0-23) trên
  máy chủ Gateway. Độ mới hằng ngày dựa trên thời điểm `sessionId` hiện tại bắt đầu,
  không dựa trên các lần ghi siêu dữ liệu sau đó.
- **Đặt lại khi không hoạt động** (`mode: "idle"`) - chọn bắt đầu phiên mới
  sau `session.reset.idleMinutes` không hoạt động. Độ mới khi không hoạt động dựa trên lần tương tác
  thực gần nhất của người dùng/kênh, vì vậy các sự kiện hệ thống Heartbeat, cron và exec
  không duy trì phiên.
- **Đặt lại thủ công** - nhập `/new` hoặc `/reset`
  trong cuộc trò chuyện. `/new <model>` cũng chuyển đổi mô hình.

Khi cấu hình cả đặt lại hằng ngày lẫn đặt lại khi không hoạt động, điều kiện nào hết hạn
trước sẽ được áp dụng. Các lượt Heartbeat, cron, exec và sự kiện hệ thống khác có thể ghi
siêu dữ liệu phiên, nhưng những lần ghi đó không kéo dài độ mới của chế độ đặt lại hằng
ngày hoặc khi không hoạt động. Khi thao tác đặt lại chuyển sang phiên mới, các thông báo
sự kiện hệ thống đang xếp hàng cho phiên cũ sẽ bị loại bỏ để các bản cập nhật nền lỗi thời
không bị thêm vào đầu prompt đầu tiên trong phiên mới.

Các phiên có một phiên CLI đang hoạt động do nhà cung cấp sở hữu cũng tuân theo mặc định
không tự động đặt lại. Dùng `/reset` hoặc cấu hình rõ ràng
`session.reset` khi các phiên đó cần hết hạn theo bộ hẹn giờ.

Bật tính năng đặt lại tự động trên toàn hệ thống, sau đó ghi đè theo loại cuộc trò chuyện
hoặc kênh:

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
mặc định chế độ không hoạt động khi chưa đặt khối `session.reset`/`resetByType`.

## Nơi lưu trữ trạng thái

- **Các hàng phiên thời gian chạy:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Các tệp bản ghi đã lưu trữ:** `~/.openclaw/agents/<agentId>/sessions/`
- **Nguồn di chuyển hàng cũ:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Các hàng phiên trong cơ sở dữ liệu SQLite theo từng tác nhân lưu các dấu thời gian
vòng đời riêng biệt:

- `sessionStartedAt`: thời điểm `sessionId` hiện tại bắt đầu; thao tác đặt lại hằng ngày sử dụng giá trị này.
- `lastInteractionAt`: lần tương tác gần nhất của người dùng/kênh giúp kéo dài thời gian tồn tại khi không hoạt động.
- `updatedAt`: lần sửa đổi hàng lưu trữ gần nhất; hữu ích cho việc liệt kê và dọn dẹp, nhưng không
  phải là nguồn xác thực cho độ mới của thao tác đặt lại hằng ngày/khi không hoạt động.

Trong quá trình di chuyển từ các bản cài đặt cũ, lúc khởi động Gateway và
`openclaw doctor
--fix` sẽ tự động nhập các hàng `sessions.json` cũ cùng lịch sử JSONL
bản ghi đang hoạt động vào SQLite. Các hàng không có `sessionStartedAt` được phân giải
từ tiêu đề phiên JSONL của bản ghi cũ khi có. Nếu một hàng cũ cũng không có
`lastInteractionAt`, độ mới khi không hoạt động sẽ dự phòng về thời điểm bắt đầu phiên đó,
không phải các lần ghi quản trị sổ sách sau này. Dùng `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` và [trình tự di
chuyển của Doctor](/vi/cli/doctor#session-sqlite-migration) khi bạn muốn có bằng chứng kiểm
tra hoặc xác thực rõ ràng.

## Bảo trì phiên

OpenClaw giới hạn dung lượng lưu trữ phiên theo thời gian thông qua
`session.maintenance`; các giá trị mặc định được hiển thị dưới đây:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" áp dụng dọn dẹp; "warn" chỉ báo cáo
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Đối với giới hạn `maxEntries` có quy mô sản xuất, các lần ghi trong thời gian chạy
của Gateway sử dụng một vùng đệm ngưỡng cao nhỏ và dọn theo lô để giảm về mức trần đã
cấu hình. Các lần đọc kho phiên không cắt bỏ hoặc giới hạn số mục trong lúc Gateway khởi
động, vì vậy quá trình khởi động và các phiên cron biệt lập không phải chịu chi phí dọn
dẹp toàn bộ kho. `openclaw sessions cleanup --enforce` áp dụng mức trần ngay lập tức.

Theo mặc định, các phiên thăm dò lần chạy mô hình của Gateway có thời gian tồn tại ngắn.
Các hàng khớp với `agent:*:explicit:model-run-<uuid>` sử dụng thời gian lưu giữ cố định
`24h`, nhưng việc dọn dẹp phụ thuộc vào áp lực: hệ thống chỉ xóa các hàng
thăm dò cũ khi đạt tới áp lực bảo trì/mức trần mục phiên, đồng thời thực hiện việc này
trước ngưỡng tuổi rộng hơn dành cho mục cũ và trước mức trần số mục. Các phiên trực tiếp,
nhóm, luồng, cron, hook, Heartbeat, ACP và tác nhân phụ thông thường không kế thừa thời
gian lưu giữ 24h này.

Hoạt động bảo trì giữ nguyên các con trỏ hội thoại bên ngoài lâu dài, bao gồm phiên nhóm
và phiên trò chuyện theo phạm vi luồng, đồng thời vẫn cho phép các mục cron tổng hợp,
hook, Heartbeat, ACP và tác nhân phụ hết hạn theo thời gian.

Nếu trước đây bạn từng dùng tính năng tách biệt tin nhắn trực tiếp rồi sau đó đưa
`session.dmScope` trở lại `main`, hãy xem trước các hàng tin nhắn trực tiếp
cũ được định khóa theo đối tác bằng `openclaw sessions cleanup --dry-run --fix-dm-scope`. Việc áp dụng cùng cờ đó sẽ
ngừng sử dụng các hàng tin nhắn trực tiếp cũ này và giữ bản ghi của chúng dưới dạng
bản lưu trữ đã xóa.

Xem trước bất kỳ lần bảo trì nào bằng `openclaw sessions cleanup --dry-run`.

## Kiểm tra các phiên

| Lệnh                       | Hiển thị                                                  |
| -------------------------- | --------------------------------------------------------- |
| `openclaw status`         | Đường dẫn kho phiên và hoạt động gần đây                  |
| `openclaw sessions --json`         | Tất cả các phiên (lọc bằng `--active <minutes>`)            |
| `/status` trong cuộc trò chuyện | Mức sử dụng ngữ cảnh, mô hình và các tùy chọn bật/tắt |
| `/context list`         | Nội dung trong prompt hệ thống                            |

## Đọc thêm

- [Tìm kiếm phiên](/vi/concepts/session-search) - hồi tưởng toàn văn trên các bản ghi trước đây
- [Cắt bỏ phiên](/vi/concepts/session-pruning) - rút gọn kết quả công cụ
- [Compaction](/vi/concepts/compaction) - tóm tắt các cuộc hội thoại dài
- [Công cụ phiên](/vi/concepts/session-tool) - công cụ tác nhân dành cho công việc xuyên phiên
- [Tìm hiểu chuyên sâu về quản lý phiên](/vi/reference/session-management-compaction) -
  lược đồ kho, bản ghi, chính sách gửi, siêu dữ liệu nguồn và cấu hình nâng cao
- [Đa tác nhân](/vi/concepts/multi-agent) - định tuyến và tách biệt phiên giữa các tác nhân
- [Tác vụ nền](/vi/automation/tasks) - cách công việc tách rời tạo bản ghi tác vụ kèm tham chiếu phiên
- [Định tuyến kênh](/vi/channels/channel-routing) - cách tin nhắn đến được định tuyến tới các phiên

## Liên quan

- [Cắt bỏ phiên](/vi/concepts/session-pruning)
- [Công cụ phiên](/vi/concepts/session-tool)
- [Hàng đợi lệnh](/vi/concepts/queue)
