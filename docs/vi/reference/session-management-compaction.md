---
read_when:
    - Bạn cần gỡ lỗi ID phiên, sự kiện bản ghi hội thoại hoặc các trường của hàng phiên
    - Bạn đang thay đổi hành vi tự động Compaction hoặc bổ sung tác vụ dọn dẹp "trước Compaction"
    - Bạn muốn triển khai việc đẩy bộ nhớ hoặc các lượt hệ thống im lặng
summary: 'Phân tích chuyên sâu: kho lưu trữ phiên + bản ghi hội thoại, vòng đời và cơ chế nội bộ của Compaction (tự động)'
title: Phân tích chuyên sâu về quản lý phiên
x-i18n:
    generated_at: "2026-07-20T04:32:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ce3f4d5bc40f454f98950ec88230ad5caadb224e25c779f26a7b87f3349de47b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Một **tiến trình Gateway** duy nhất quản lý trạng thái phiên từ đầu đến cuối. Các giao diện người dùng (ứng dụng macOS, Control UI trên web, TUI) truy vấn Gateway để lấy danh sách phiên và số lượng token. Ở chế độ từ xa, các tệp phiên nằm trên máy chủ từ xa, vì vậy việc kiểm tra tệp trên máy Mac cục bộ sẽ không phản ánh dữ liệu mà Gateway đang sử dụng.

Trước tiên, hãy xem các tài liệu tổng quan: [Quản lý phiên](/vi/concepts/session), [Compaction](/vi/concepts/compaction), [Tổng quan về bộ nhớ](/vi/concepts/memory), [Tìm kiếm bộ nhớ](/vi/concepts/memory-search), [Cắt tỉa phiên](/vi/concepts/session-pruning), [Vệ sinh bản ghi](/vi/reference/transcript-hygiene), tài liệu tham chiếu cấu hình đầy đủ tại [Cấu hình tác nhân](/vi/gateway/config-agents).

## Hai lớp lưu trữ bền vững

1. **Các hàng phiên (SQLite theo từng tác nhân)** - ánh xạ khóa/giá trị `sessionKey -> SessionEntry`. Trạng thái thời gian chạy có thể thay đổi do Gateway quản lý. Theo dõi siêu dữ liệu: id phiên hiện tại, hoạt động gần nhất, các tùy chọn bật/tắt, bộ đếm token.
2. **Các sự kiện bản ghi (SQLite theo từng tác nhân)** - chỉ nối thêm, có cấu trúc cây (các mục có `id` + `parentId`). Lưu trữ cuộc hội thoại, các lệnh gọi công cụ và bản tóm tắt Compaction; tái dựng ngữ cảnh mô hình cho các lượt sau. Các điểm kiểm tra Compaction là siêu dữ liệu trên bản ghi kế nhiệm đã được nén gọn - một lần Compaction mới không ghi thêm bản sao `.checkpoint.*.jsonl` thứ hai.

Các bản cài đặt cũ hơn vẫn có thể chứa các tệp `sessions.json` trong thư mục `sessions/` của tác nhân. Hãy coi các tệp đó là dữ liệu đầu vào để di chuyển hàng phiên cũ hoặc là mục tiêu bảo trì ngoại tuyến rõ ràng. Khi khởi động, Gateway và `openclaw doctor --fix` tự động nhập các hàng cũ đang hoạt động và lịch sử bản ghi vào kho SQLite theo từng tác nhân. Chạy `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`, sau đó làm theo [trình tự di chuyển của Doctor](/vi/cli/doctor#session-sqlite-migration) khi cần kiểm tra rõ ràng hoặc bằng chứng xác thực. Nếu quá trình di chuyển thất bại sau khi các hiện vật bản ghi cũ đã được lưu trữ, hãy sử dụng chế độ khôi phục Doctor trong trình tự đó. Quá trình khôi phục sử dụng bản kê khai di chuyển, chỉ phục hồi các hiện vật hỗ trợ đã lưu trữ bị ảnh hưởng, chuẩn bị báo cáo sự cố GitHub đã được làm sạch khi được yêu cầu và không khiến thời gian chạy đang hoạt động đọc lại các tệp JSONL.

Các trình đọc lịch sử của Gateway tránh nạp toàn bộ bản ghi vào bộ nhớ trừ khi bề mặt cần truy cập tùy ý vào lịch sử. Lịch sử trang đầu tiên, lịch sử trò chuyện được nhúng, khôi phục sau khi khởi động lại và kiểm tra token/mức sử dụng dùng các lượt đọc phần đuôi có giới hạn từ SQLite. Việc quét toàn bộ bản ghi đi qua chỉ mục bản ghi bất đồng bộ và được chia sẻ giữa các trình đọc đồng thời.

## Vị trí trên đĩa

Theo từng tác nhân, trên máy chủ Gateway (được phân giải qua `src/config/sessions.ts`):

- Kho hàng phiên thời gian chạy: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Các hàng bản ghi thời gian chạy: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Các hiện vật bản ghi cũ/lưu trữ: `~/.openclaw/agents/<agentId>/sessions/`
- Dữ liệu đầu vào để di chuyển hàng cũ: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Bảo trì kho và kiểm soát đĩa

`session.maintenance` kiểm soát việc bảo trì tự động cho các hàng phiên SQLite, hàng bản ghi SQLite, hiện vật lưu trữ và tệp phụ quỹ đạo:

| Khóa                    | Mặc định              | Ghi chú                                                                                     |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | hoặc `"warn"` (chỉ báo cáo, không thay đổi)                                                      |
| `pruneAfter`            | `"30d"`               | ngưỡng tuổi của mục cũ                                                                      |
| `maxEntries`            | `500`                 | giới hạn số mục phiên                                                                      |
| `resetArchiveRetention` | giữ lại (không có ngưỡng tuổi)  | ngưỡng tuổi cho kho lưu trữ bản ghi `*.reset.*`/`*.deleted.*`; đặt khoảng thời gian sẽ bật tính năng xóa |
| `maxDiskBytes`          | `10gb`                | ngân sách đĩa cho các phiên theo từng tác nhân; `false` sẽ vô hiệu hóa                                            |
| `highWaterBytes`        | 80% của `maxDiskBytes` | mục tiêu sau khi dọn dẹp ngân sách                                                                 |

Thao tác đặt lại chuyển ánh xạ `sessionKey -> sessionId` đang hoạt động sang trạng thái mới nhưng vẫn giữ phiên SQLite, bản ghi, quỹ đạo và các hàng tìm kiếm trước đó. Lịch sử đó vẫn có thể được tìm kiếm bằng cùng khóa phiên; danh sách mục và phiên thông thường chỉ hiển thị ánh xạ đang hoạt động mới. Lịch sử đặt lại được giữ lại chịu giới hạn bởi ngân sách đĩa, không phải bởi `resetArchiveRetention`, vốn chỉ áp dụng tuổi cho các hiện vật lưu trữ. Xóa rõ ràng thì khác: thao tác này ghi và xác minh một kho lưu trữ bản ghi đã nén (`*.jsonl.deleted.<timestamp>.zst` khi có zstd) trước khi xóa các hàng của phiên bị xóa.

Việc thực thi `maxDiskBytes` sử dụng số byte vật lý: tệp chính SQLite theo từng tác nhân, tệp `-wal` của nó và các tệp được tính trong thư mục phiên của tác nhân. Cơ chế này không bao giờ ước tính kích thước JSON của hàng hoặc trừ kích thước hàng logic khỏi tổng đó.

Các phiên thăm dò lượt chạy mô hình của Gateway (các khóa khớp với `agent:*:explicit:model-run-<uuid>`) có thời gian lưu giữ `24h` cố định và riêng biệt. Việc cắt tỉa này chỉ diễn ra khi có áp lực: nó chỉ chạy khi đạt đến ngưỡng áp lực bảo trì/giới hạn mục phiên và chỉ chạy trước bước dọn dẹp/giới hạn mục cũ toàn cục. Các phiên rõ ràng khác không sử dụng thời gian lưu giữ này.

Khi mức sử dụng vật lý kết hợp vượt quá `maxDiskBytes`, `mode: "enforce"` trước tiên thu hồi không gian cơ sở dữ liệu có thể tạo điểm kiểm tra, sau đó xóa các kho lưu trữ đặt lại/xóa được giữ lại lâu nhất. Nếu mức sử dụng vẫn vượt quá `highWaterBytes`, cơ chế này duyệt các phiên SQLite lịch sử theo `sessions.updated_at`, từ cũ nhất đến mới nhất. Một phiên được coi là lịch sử khi id phiên không được tham chiếu bởi mục phiên đang hoạt động, đích tuyến hoặc lượt chạy đã được chấp nhận/đang diễn ra. Với mỗi đối tượng bị loại, quá trình dọn dẹp ghi, thực hiện fsync và đọc lại kho lưu trữ đã nén trước khi một giao dịch ghi xóa hàng phiên cùng các phép chiếu bản ghi, quỹ đạo, đang hoạt động, chỉ mục và FTS của phiên đó. Điều này bao gồm các phiên có sự kiện quỹ đạo nhưng không có sự kiện bản ghi. Quá trình dọn dẹp kiểm tra lại các tham chiếu tuyến, mục và chấp nhận tại thời điểm xóa, đo lại mức sử dụng vật lý sau mỗi kho lưu trữ hoặc phiên bị loại và dừng tại `highWaterBytes`.

Các thao tác ghi đã commit và thao tác xóa trước tiên được ghi vào WAL. Quá trình dọn dẹp tạo điểm kiểm tra để WAL có thể thu nhỏ ngay lập tức, sau đó sử dụng vacuum gia tăng để trả lại các trang cuối trống đủ điều kiện từ tệp chính; những trang chưa thể thu hồi vẫn nằm trong tệp chính và do đó vẫn được tính trong lần đo vật lý tiếp theo. `mode: "warn"` báo cáo mức vượt quá vật lý hiện tại mà không tạo điểm kiểm tra, ghi kho lưu trữ hoặc xóa hàng.

Chạy bảo trì theo yêu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

Việc bảo trì giữ lại các con trỏ hội thoại bên ngoài bền vững như phiên nhóm và phiên trò chuyện theo luồng, nhưng các mục thời gian chạy tổng hợp (cron, hook, heartbeat, ACP, tác nhân phụ) vẫn có thể bị xóa sau khi vượt quá tuổi, số lượng hoặc ngân sách đĩa đã cấu hình. Các lượt chạy cron cô lập sử dụng một tùy chọn kiểm soát `cron.sessionRetention` riêng, độc lập với thời gian lưu giữ thăm dò lượt chạy mô hình.

Các thao tác ghi Gateway thông thường đi qua trình truy cập phiên, trình này tuần tự hóa các thay đổi SQLite theo từng tác nhân thông qua đường dẫn trình ghi thời gian chạy. Mã thời gian chạy nên ưu tiên các trình trợ giúp truy cập trong `src/config/sessions/session-accessor.ts`; các trình trợ giúp `sessions.json` cũ là công cụ di chuyển và bảo trì ngoại tuyến. Khi có thể kết nối Gateway, các thao tác `openclaw sessions cleanup` và `openclaw agents delete` không phải chạy thử sẽ ủy quyền việc thay đổi kho cho Gateway để quá trình dọn dẹp tham gia cùng hàng đợi ghi; `--store <path>` là đường dẫn sửa chữa ngoại tuyến rõ ràng cho một kho cũ đã chọn và luôn chạy cục bộ (`--dry-run` cũng vậy). Việc dọn dẹp `maxEntries` được xử lý theo lô cho các kho có quy mô sản xuất, vì vậy kho có thể tạm thời vượt quá giới hạn đã cấu hình trước khi lần dọn dẹp ngưỡng cao tiếp theo ghi lại nó xuống dưới giới hạn. Các thao tác đọc không bao giờ cắt tỉa hoặc giới hạn mục trong quá trình khởi động Gateway - chỉ thao tác ghi hoặc `openclaw sessions cleanup --enforce` mới thực hiện việc đó; tùy chọn sau cũng áp dụng giới hạn ngay lập tức và cắt tỉa các hiện vật bản ghi, điểm kiểm tra và quỹ đạo cũ không được tham chiếu ngay cả khi không cấu hình ngân sách đĩa.

OpenClaw không còn tạo các bản sao lưu xoay vòng `sessions.json.bak.*` tự động trong quá trình Gateway ghi. Lược đồ hiện tại từ chối khóa `session.maintenance.rotateBytes` cũ và `openclaw doctor --fix` xóa khóa đó khỏi các cấu hình cũ hơn.

Các thay đổi bản ghi sử dụng hàng đợi ghi phiên cho đích bản ghi SQLite:

Khóa ghi phiên sử dụng các giá trị mặc định cố định cho môi trường sản xuất. Các biến môi trường `OPENCLAW_SESSION_WRITE_LOCK_*` tương ứng vẫn khả dụng để chẩn đoán cấp tiến trình và ghi đè khẩn cấp.

### Hạ cấp sau khi chuyển sang SQLite

Khôi phục các hiện vật bản ghi cũ đã lưu trữ trước khi chạy phiên bản OpenClaw cũ hơn sử dụng tệp:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Quá trình di chuyển giữ nguyên các tệp `sessions.json` cũ để hỗ trợ và khôi phục phiên bản, nhưng các tệp JSONL bản ghi đang hoạt động đã được nhập vào SQLite sẽ được đổi tên vào `session-sqlite-import-archive/`. Các môi trường thời gian chạy cũ sử dụng tệp sẽ theo các đường dẫn `sessionFile` trong `sessions.json`, vì vậy cần khôi phục các hiện vật đó trước khi khởi động. Quá trình khôi phục sử dụng bản kê khai di chuyển, chỉ di chuyển các hiện vật đã lưu trữ được ghi nhận mà đường dẫn gốc của chúng bị thiếu và giữ nguyên cơ sở dữ liệu SQLite để phục hồi khi nâng cấp lại.

Các phiên được tạo sau khi chuyển sang SQLite chỉ tồn tại trong SQLite và sẽ không xuất hiện trong môi trường thời gian chạy cũ sử dụng tệp. Nếu nâng cấp lại sau khi hạ cấp, hãy chạy lại trình tự kiểm tra và xác thực của Doctor để OpenClaw có thể xác minh các hiện vật cũ đã khôi phục trước khi nhập.

## Phiên Cron và nhật ký lượt chạy

Các lượt chạy cron cô lập tạo mục phiên/bản ghi riêng với chính sách lưu giữ chuyên dụng:

- `cron.sessionRetention` (mặc định `"24h"`) cắt tỉa các phiên chạy cron cô lập cũ khỏi kho; `false` sẽ vô hiệu hóa.
- Lịch sử lượt chạy giữ lại 2000 hàng trạng thái kết thúc mới nhất cho mỗi tác vụ cron. Các hàng bị mất vẫn giữ khoảng thời gian dọn dẹp 24 giờ.

Khi cron buộc tạo một phiên chạy cô lập mới, nó làm sạch mục phiên `cron:<jobId>` trước đó trước khi ghi hàng mới: nó mang theo các tùy chọn an toàn (cài đặt suy nghĩ/nhanh/chi tiết/lập luận, nhãn, tên hiển thị) và các ghi đè mô hình/xác thực do người dùng lựa chọn rõ ràng, nhưng loại bỏ ngữ cảnh hội thoại xung quanh (định tuyến kênh/nhóm, chính sách gửi/hàng đợi, nâng quyền, nguồn gốc, liên kết thời gian chạy ACP) để một lượt chạy cô lập mới không thể kế thừa quyền phân phối hoặc thời gian chạy cũ từ lượt chạy trước.

## Khóa phiên (`sessionKey`)

Một `sessionKey` xác định nhóm hội thoại mà bạn đang ở trong đó (định tuyến + cô lập). Quy tắc chuẩn: [/concepts/session](/vi/concepts/session).

| Mẫu                          | Ví dụ                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| Trò chuyện chính/trực tiếp (theo từng tác nhân) | `agent:<agentId>:<mainKey>` (mặc định `main`)                |
| Nhóm                         | `agent:<agentId>:<channel>:group:<id>`                      |
| Phòng/kênh (Discord/Slack)   | `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (trừ khi bị ghi đè)                           |

## Id phiên (`sessionId`)

Mỗi `sessionKey` trỏ đến một `sessionId` hiện tại (định danh bản ghi SQLite tiếp tục cuộc hội thoại). Logic quyết định nằm trong `initSessionState()` tại `src/auto-reply/reply/session.ts`.

- **Đặt lại** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Không tự động đặt lại** là mặc định. `sessionId` hiện tại tiếp tục trong khi Compaction giữ ngữ cảnh mô hình đang hoạt động trong giới hạn.
- **Đặt lại hằng ngày** (`session.reset.mode: "daily"`) tạo một `sessionId` mới ở tin nhắn tiếp theo sau mốc giờ địa phương đã cấu hình (`session.reset.atHour`, mặc định `4`).
- **Hết hạn khi không hoạt động** (`session.reset.mode: "idle"` với `session.reset.idleMinutes`, hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi có tin nhắn đến sau khoảng thời gian không hoạt động. Nếu cả chế độ hằng ngày và không hoạt động đều được cấu hình, chế độ nào hết hạn trước sẽ được áp dụng.
- **Tiếp tục sau khi giao diện điều khiển kết nối lại** giữ nguyên phiên hiện đang hiển thị cho một lần gửi sau khi kết nối lại khi Gateway nhận được `sessionId` tương ứng từ một máy khách giao diện người vận hành. Đây là tín hiệu dùng một lần; các lần gửi cũ thông thường vẫn tạo một `sessionId` mới.
- **Sự kiện hệ thống** (Heartbeat, đánh thức Cron, thông báo thực thi, tác vụ sổ sách của Gateway) có thể thay đổi hàng phiên nhưng không bao giờ kéo dài độ mới của lần đặt lại hằng ngày/khi không hoạt động. Khi chuyển sang phiên mới do đặt lại, các thông báo sự kiện hệ thống đang xếp hàng của phiên trước sẽ bị loại bỏ trước khi lời nhắc mới được tạo.
- **Chính sách phân nhánh từ phiên cha** sử dụng nhánh đang hoạt động của OpenClaw khi tạo một luồng hoặc bản phân nhánh của tác tử con. Nếu nhánh đó quá lớn (vượt quá giới hạn nội bộ cố định, hiện là 100K token), OpenClaw khởi tạo phiên con với ngữ cảnh biệt lập thay vì thất bại hoặc kế thừa lịch sử không thể sử dụng. Việc định cỡ diễn ra tự động và không thể cấu hình; cấu hình `session.parentForkMaxTokens` cũ được `openclaw doctor --fix` loại bỏ.
- **Bản phân nhánh của người vận hành**: `sessions.create { parentSessionKey, fork: true }` tạo một phiên mới có bản chép lời phân nhánh từ trạng thái hiện tại của phiên cha (cùng cơ chế phân nhánh như khi tạo tác tử con, bao gồm giới hạn kích thước ở trên). Việc phân nhánh bị từ chối khi phiên cha đang có một lượt chạy hoạt động, kế thừa lựa chọn mô hình của phiên cha trừ khi một lựa chọn khác được truyền rõ ràng và đánh dấu phiên con là `forkedFromParent` với các bộ đếm token mới.

## Lược đồ kho phiên

Kho thời gian chạy lưu các giá trị `SessionEntry` trong SQLite riêng cho từng tác tử. Kiểu giá trị là `SessionEntry` trong `src/config/sessions.ts`. Các trường chính (không đầy đủ):

- `sessionId`: ID bản chép lời hiện tại dùng để định địa chỉ các hàng bản chép lời SQLite
- `sessionStartedAt`: dấu thời gian bắt đầu của `sessionId` hiện tại; độ mới của lần đặt lại hằng ngày sử dụng giá trị này. Các hàng cũ có thể suy ra giá trị này từ phần đầu phiên JSONL.
- `lastInteractionAt`: dấu thời gian của lần tương tác thực gần nhất với người dùng/kênh; độ mới của lần đặt lại khi không hoạt động sử dụng giá trị này để các sự kiện Heartbeat, Cron và thực thi không giữ cho phiên tiếp tục hoạt động. Các hàng cũ không có trường này sẽ dùng thời gian bắt đầu phiên đã khôi phục làm giá trị dự phòng.
- `updatedAt`: dấu thời gian thay đổi hàng trong kho gần nhất, dùng cho việc liệt kê/dọn dẹp/tác vụ sổ sách — không phải nguồn quyết định độ mới hằng ngày/khi không hoạt động.
- `archivedAt`: dấu thời gian lưu trữ tùy chọn. Các phiên đã lưu trữ vẫn nằm trong kho với bản chép lời nguyên vẹn và bị loại khỏi danh sách hoạt động thông thường.
- `pinnedAt`: dấu thời gian ghim tùy chọn. Các phiên hoạt động đã ghim được sắp xếp trước các phiên chưa ghim; việc lưu trữ một phiên sẽ xóa trạng thái ghim của phiên đó.
- Khả năng tương tác với luồng Codex: cả hai trường tuân theo cấu trúc quản lý luồng của Codex — các giá trị boolean `archived`/`pinned` trên đường truyền luôn được suy ra từ dấu thời gian và được đóng dấu phía máy chủ, phù hợp với ngữ nghĩa `threads.archived_at` của Codex và kiểu tuần tự hóa camelCase. Dấu thời gian OpenClaw tính bằng mili giây kể từ epoch trong khi Codex sử dụng giây kể từ epoch, vì vậy các cầu nối thực hiện chuyển đổi tại đường nối Plugin `codex`. Codex chưa có API ghim (chỉ có `thread/archive`/`thread/unarchive`); trạng thái ghim vẫn ở phía OpenClaw cho đến khi API này tồn tại, khi đó cấu trúc tương ứng cho phép các phiên được liên kết trao đổi trạng thái ghim hai chiều một cách cơ học.
- Chức năng giám sát Codex chỉ liệt kê các luồng gốc chưa được lưu trữ. Một luồng `idle` hoặc `notLoaded` cục bộ của Gateway có trạng thái hoạt động không xác định chỉ có thể được lưu trữ qua `thread/archive` gốc sau khi người vận hành xác nhận rõ ràng rằng không có tiến trình Codex nào khác sở hữu luồng đó; Plugin trước tiên thực hiện một lần đọc mới trạng thái cục bộ của tiến trình, sau đó luồng biến mất khỏi danh mục. Lần đọc đó không thể chứng minh rằng một tiến trình App Server khác không sử dụng luồng. OpenClaw từ chối lưu trữ các hàng đang hoạt động và có lỗi, đồng thời chức năng lưu trữ Node ghép cặp không khả dụng cho đến khi cầu nối Node có thể sở hữu toàn bộ vòng đời luồng được truyền phát. Việc bỏ lưu trữ trong một máy khách Codex gốc khiến luồng đủ điều kiện xuất hiện lại.
- `lastReadAt` / `markedUnreadAt`: các dấu thời gian trạng thái đọc được `sessions.patch { unread }` đóng dấu phía máy chủ — `unread: false` ghi nhận một lần đọc (đặt `lastReadAt`, xóa `markedUnreadAt`); `unread: true` đánh dấu phiên là chưa đọc cho đến lần đọc tiếp theo. Các hàng phiên cung cấp giá trị boolean `unread` được suy ra: được đánh dấu rõ ràng là chưa đọc hoặc đã được đọc trước hoạt động gần nhất. Các phiên chưa từng được đánh dấu là đã đọc vẫn ở trạng thái `unread: false`, vì vậy các bản cài đặt hiện có không hiển thị hàng loạt thông báo khi nâng cấp.
- `lastActivityAt`: dấu thời gian của lượt chạy tác tử hoàn tất gần nhất được tính là hoạt động đáng đánh dấu chưa đọc (các lượt chạy của người dùng, kênh và Cron). Các lượt Heartbeat và sự kiện nội bộ, cùng với các bản vá siêu dữ liệu, không cập nhật giá trị này; `updatedAt` không phải là tín hiệu hoạt động.
- `sessionFile`: dấu hiệu cũ được giữ lại để tương thích với việc di chuyển/lưu trữ; thời gian chạy đang hoạt động sử dụng danh tính SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu nhãn nhóm/kênh
- Các tùy chọn bật/tắt: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (ghi đè theo từng phiên)
- Lựa chọn mô hình: `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (nỗ lực tối đa/phụ thuộc vào nhà cung cấp): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần tự động Compaction hoàn tất cho khóa phiên này
- `memoryFlushAt` / `memoryFlushCompactionCount`: dấu thời gian và số lần Compaction của lần xả bộ nhớ trước Compaction gần nhất

Gateway là nguồn quyết định: Gateway có thể ghi lại hoặc tái tạo các mục trong khi phiên
đang chạy. Đối với các bản cài đặt cũ dùng tệp làm phần phụ trợ, hãy di chuyển bằng
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` thay vì
chỉnh sửa `sessions.json` rồi kỳ vọng thời gian chạy tiếp tục đọc tệp đó.

## Cấu trúc sự kiện bản chép lời

Các bản chép lời được quản lý bởi trình truy cập phiên OpenClaw và được cung cấp cho mã thời gian chạy thông qua các trợ giúp dựa trên danh tính. Luồng sự kiện chỉ cho phép nối thêm:

- Mục đầu tiên: phần đầu phiên — `type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` tùy chọn.
- Sau đó: các mục có `id` + `parentId` (cấu trúc cây).

Các loại mục đáng chú ý:

- `message`: tin nhắn người dùng/trợ lý/toolResult
- `custom_message`: tin nhắn do tiện ích chèn vào và _có_ đi vào ngữ cảnh mô hình (được kết xuất trong TUI khi `display: true`, bị ẩn hoàn toàn khi `display: false`)
- `custom`: trạng thái tiện ích _không_ đi vào ngữ cảnh mô hình (để duy trì trạng thái tiện ích qua các lần tải lại)
- `compaction`: bản tóm tắt Compaction được lưu bền vững với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: bản tóm tắt được lưu bền vững khi điều hướng một nhánh cây

OpenClaw chủ ý không "sửa lại" các bản chép lời; Gateway sử dụng `SessionManager` để đọc/ghi chúng.

## Cửa sổ ngữ cảnh so với số token được theo dõi

Hai khái niệm khác nhau:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng cho mỗi mô hình (các token mà mô hình nhìn thấy). Giá trị này đến từ danh mục mô hình và có thể được ghi đè qua cấu hình.
2. **Bộ đếm trong kho phiên**: số liệu thống kê luân phiên được ghi vào hàng phiên (dùng cho `/status` và bảng điều khiển). `contextTokens` là giá trị ước tính/báo cáo tại thời gian chạy — không được coi đó là một bảo đảm nghiêm ngặt.

Thông tin thêm về giới hạn: [/reference/token-use](/vi/reference/token-use).

## Compaction: khái niệm

Compaction tóm tắt phần hội thoại cũ thành một mục `compaction` được lưu bền vững trong bản chép lời và giữ nguyên các tin nhắn gần đây. Sau Compaction, các lượt tiếp theo thấy bản tóm tắt Compaction cùng các tin nhắn sau `firstKeptEntryId`. Compaction có tính **bền vững**, không giống việc dọn bớt phiên — xem [/concepts/session-pruning](/vi/concepts/session-pruning).

Theo mặc định, Compaction nhúng của OpenClaw kế thừa mức suy luận của phiên. Đặt `agents.defaults.compaction.thinkingLevel` để sử dụng một mức riêng cho các lệnh gọi tóm tắt; thời gian chạy giới hạn mức này theo từng mô hình Compaction cụ thể hoặc mô hình dự phòng. Compaction của app-server Codex gốc tự sở hữu yêu cầu thu gọn và không thể chấp nhận ghi đè mức suy luận cho từng lần Compaction, vì vậy OpenClaw đưa ra cảnh báo và để Codex xử lý cài đặt đó.

Việc chèn lại phần AGENTS.md sau Compaction phải được chủ động bật qua `agents.defaults.compaction.postCompactionSections`; khi không được đặt hoặc là `[]`, OpenClaw không nối thêm các đoạn trích AGENTS.md lên trên bản tóm tắt Compaction.

### Ranh giới phân đoạn và ghép cặp công cụ

Khi chia một bản chép lời dài thành các phân đoạn Compaction, OpenClaw giữ các lệnh gọi công cụ của trợ lý ghép cặp với các mục `toolResult` tương ứng:

- Nếu phép chia theo tỷ lệ token rơi vào giữa một lệnh gọi công cụ và kết quả của lệnh gọi đó, OpenClaw dịch chuyển ranh giới đến tin nhắn gọi công cụ của trợ lý thay vì tách cặp.
- Nếu một khối kết quả công cụ ở cuối lẽ ra đẩy phân đoạn vượt quá mục tiêu, OpenClaw giữ nguyên khối công cụ đang chờ đó và giữ nguyên phần đuôi chưa được tóm tắt.
- Các khối gọi công cụ bị hủy/có lỗi không giữ cho một phép chia đang chờ tiếp tục mở.

## Thời điểm tự động Compaction diễn ra

Hai điều kiện kích hoạt trong tác tử OpenClaw nhúng:

1. **Khôi phục khi tràn**: mô hình trả về lỗi tràn ngữ cảnh (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` và các biến thể khác theo cấu trúc của nhà cung cấp) — thực hiện Compaction rồi thử lại. Khi nhà cung cấp báo cáo số token đã thử sử dụng, OpenClaw chuyển tiếp số lượng quan sát được đó vào quá trình Compaction phục hồi tràn; nếu nhà cung cấp xác nhận tràn nhưng không cung cấp số lượng có thể phân tích, OpenClaw truyền một số lượng tổng hợp chỉ vừa vượt ngân sách cho các công cụ Compaction và chẩn đoán. Nếu quá trình khôi phục khi tràn vẫn thất bại, OpenClaw hiển thị hướng dẫn rõ ràng và giữ nguyên ánh xạ phiên hiện tại thay vì âm thầm chuyển sang một ID phiên mới — hãy thử lại tin nhắn, chạy `/compact` hoặc chạy `/new`.
2. **Duy trì theo ngưỡng**: sau một lượt thành công, khi ngữ cảnh hiện tại vượt quá cửa sổ mô hình trừ đi khoảng dự phòng tích hợp của OpenClaw dành cho lời nhắc và đầu ra mô hình tiếp theo.

Hai biện pháp bảo vệ bổ sung chạy bên ngoài hai điều kiện kích hoạt này:

- **Compaction cục bộ trước khi chạy**: đặt `agents.defaults.compaction.maxActiveTranscriptBytes` (số byte hoặc chuỗi như `"20mb"`) để kích hoạt Compaction cục bộ trước khi mở lượt chạy tiếp theo khi bản ghi đang hoạt động đạt đến kích thước đó. Đây là giới hạn kích thước nhằm kiểm soát chi phí mở lại cục bộ, không phải lưu trữ thô — Compaction ngữ nghĩa thông thường vẫn chạy và yêu cầu `truncateAfterCompaction` để bản tóm tắt đã Compaction trở thành bản ghi kế tiếp mới.
- **Kiểm tra trước giữa lượt**: đặt `agents.defaults.compaction.midTurnPrecheck.enabled: true` (mặc định `false`) để thêm cơ chế bảo vệ vòng lặp công cụ. Sau khi kết quả công cụ được nối thêm và trước lần gọi mô hình tiếp theo, OpenClaw ước tính áp lực prompt bằng cùng logic ngân sách kiểm tra trước được sử dụng khi bắt đầu lượt. Nếu ngữ cảnh không còn vừa, cơ chế bảo vệ sẽ không Compaction trực tiếp — nó phát tín hiệu kiểm tra trước giữa lượt có cấu trúc, dừng việc gửi prompt hiện tại và để vòng lặp chạy bên ngoài sử dụng đường khôi phục hiện có (cắt bớt kết quả công cụ quá lớn khi như vậy là đủ, hoặc kích hoạt chế độ Compaction đã cấu hình rồi thử lại). Hoạt động với cả chế độ Compaction `default` và `safeguard`, bao gồm Compaction bảo vệ do nhà cung cấp hỗ trợ. Độc lập với `maxActiveTranscriptBytes`: cơ chế bảo vệ kích thước byte chạy trước khi mở một lượt, còn kiểm tra trước giữa lượt chạy sau đó, sau khi các kết quả công cụ mới được nối thêm.

## Cài đặt Compaction

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw áp dụng một phần dự trữ tích hợp cho các lượt chạy nhúng và giới hạn phần này theo cửa sổ ngữ cảnh của mô hình đang hoạt động để nó không thể chiếm toàn bộ ngân sách prompt. Điều này ngăn các mô hình cục bộ có ngữ cảnh nhỏ bước vào Compaction ngay từ token đầu tiên, đồng thời vẫn chừa đủ dung lượng cho các tác vụ duy trì qua nhiều lượt như ghi bộ nhớ.

Thao tác `/compact` thủ công tuân theo giá trị `agents.defaults.compaction.keepRecentTokens` được chỉ định rõ ràng và giữ nguyên điểm cắt phần đuôi gần đây của runtime. Nếu không chỉ định ngân sách giữ lại, Compaction thủ công là một điểm kiểm tra cứng và ngữ cảnh được dựng lại sẽ bắt đầu từ bản tóm tắt mới.

Khi `truncateAfterCompaction` được bật, OpenClaw luân chuyển bản ghi đang hoạt động sang bản kế tiếp đã Compaction sau khi Compaction. Các thao tác điểm kiểm tra phân nhánh/khôi phục sử dụng bản kế tiếp đã Compaction đó; các tệp điểm kiểm tra cũ trước Compaction vẫn có thể đọc được khi còn được tham chiếu.

## Nhà cung cấp Compaction có thể cắm thêm

Các Plugin đăng ký nhà cung cấp Compaction qua `registerCompactionProvider()` trên API Plugin. Khi `agents.defaults.compaction.provider` được đặt thành id của một nhà cung cấp đã đăng ký, phần mở rộng bảo vệ sẽ ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì pipeline `summarizeInStages` tích hợp.

- `provider`: id của Plugin nhà cung cấp Compaction đã đăng ký. Để trống để sử dụng tính năng tóm tắt LLM mặc định. Việc đặt `provider` sẽ buộc `mode: "safeguard"`.
- Các nhà cung cấp nhận cùng chỉ dẫn Compaction và chính sách bảo toàn mã định danh như đường dẫn tích hợp; cơ chế bảo vệ vẫn giữ ngữ cảnh hậu tố của các lượt gần đây và lượt bị chia tách sau đầu ra của nhà cung cấp.
- Tính năng tóm tắt bảo vệ tích hợp chưng lọc lại các bản tóm tắt trước cùng với thông điệp mới thay vì giữ nguyên từng chữ toàn bộ bản tóm tắt trước đó.
- Chế độ bảo vệ mặc định bật kiểm tra chất lượng bản tóm tắt; đặt `qualityGuard.enabled: false` để bỏ qua hành vi thử lại khi đầu ra sai định dạng.
- Nếu nhà cung cấp gặp lỗi hoặc trả về kết quả rỗng, OpenClaw tự động chuyển về tính năng tóm tắt LLM tích hợp. Các tín hiệu hủy/hết thời gian do bên gọi kích hoạt rõ ràng sẽ được ném lại thay vì bị bỏ qua, nên yêu cầu hủy luôn được tôn trọng.

Nguồn: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Các bề mặt hiển thị cho người dùng

- `/status` trong bất kỳ phiên trò chuyện nào
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Nhật ký Gateway (`pnpm gateway:watch` hoặc `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Chế độ chi tiết: `🧹 Auto-compaction complete` cùng số lần Compaction

## Duy trì ngầm (`NO_REPLY`)

OpenClaw hỗ trợ các lượt "im lặng" cho tác vụ nền mà người dùng không nên thấy đầu ra trung gian.

- Trợ lý bắt đầu đầu ra bằng chính xác token im lặng `NO_REPLY` / `no_reply` để biểu thị "không gửi phản hồi cho người dùng". OpenClaw loại bỏ/ẩn nội dung này ở lớp phân phối.
- Việc ẩn chính xác token im lặng không phân biệt chữ hoa chữ thường: `NO_REPLY` và `no_reply` đều được tính khi toàn bộ payload chỉ là token im lặng.
- Kể từ `2026.1.10`, OpenClaw cũng ẩn luồng bản nháp/đang nhập khi một đoạn chưa hoàn chỉnh bắt đầu bằng `NO_REPLY`, nhờ đó các thao tác im lặng không làm rò rỉ đầu ra chưa hoàn chỉnh giữa lượt.
- Cơ chế này chỉ dành cho các lượt thực sự chạy nền/không phân phối — đây không phải lối tắt cho các yêu cầu thông thường mà người dùng mong muốn được xử lý.

## Ghi bộ nhớ trước Compaction

Trước khi tự động Compaction, OpenClaw có thể chạy một lượt tác tử im lặng để ghi trạng thái bền vững ra đĩa (ví dụ `memory/YYYY-MM-DD.md` trong không gian làm việc của tác tử), nhờ đó Compaction không thể xóa ngữ cảnh quan trọng. OpenClaw theo dõi mức sử dụng ngữ cảnh của phiên; khi mức này vượt qua ngưỡng mềm thấp hơn ngưỡng Compaction, hệ thống gửi chỉ dẫn im lặng "ghi bộ nhớ ngay" bằng chính xác token im lặng `NO_REPLY` / `no_reply` để người dùng không thấy gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`), tham chiếu đầy đủ tại [/gateway/config-agents](/vi/gateway/config-agents#agentsdefaultscompaction):

| Khóa                        | Mặc định         | Ghi chú                                                                                                                                |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | chưa đặt         | ghi đè chính xác nhà cung cấp/mô hình chỉ cho lượt ghi, ví dụ `ollama/qwen3:8b`                                                        |
| `softThresholdTokens`       | `4000`           | khoảng cách dưới ngưỡng Compaction kích hoạt một lần ghi                                                                                |
| `forceFlushTranscriptBytes` | chưa đặt (đã tắt) | buộc ghi một lần khi tệp bản ghi đạt đến kích thước byte này (hoặc chuỗi như `"2mb"`), ngay cả khi bộ đếm token đã lỗi thời; `0` sẽ tắt |
| `prompt`                    | tích hợp          | thông điệp người dùng cho lượt ghi                                                                                                      |
| `systemPrompt`              | tích hợp          | prompt hệ thống bổ sung được nối thêm cho lượt ghi                                                                                      |

Ghi chú:

- Prompt/prompt hệ thống mặc định chứa gợi ý `NO_REPLY` để ẩn việc phân phối.
- Khi `model` được đặt, lượt ghi sử dụng mô hình đó mà không kế thừa chuỗi dự phòng của phiên đang hoạt động, nhờ đó tác vụ duy trì chỉ chạy cục bộ không âm thầm chuyển sang mô hình hội thoại trả phí khi gặp lỗi.
- Thao tác ghi chạy một lần trong mỗi chu kỳ Compaction (được theo dõi trong hàng của phiên).
- Thao tác ghi chỉ chạy cho các phiên OpenClaw nhúng; các backend CLI và lượt Heartbeat sẽ bỏ qua.
- Thao tác ghi bị bỏ qua khi không gian làm việc của phiên chỉ có quyền đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Bộ nhớ](/vi/concepts/memory) để biết bố cục tệp trong không gian làm việc và các mẫu ghi.

OpenClaw cung cấp hook `session_before_compact` trong API phần mở rộng, nhưng logic ghi nêu trên nằm ở phía Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), không nằm trên hook đó.

## Danh sách kiểm tra khắc phục sự cố

- **Khóa phiên không đúng?** Bắt đầu với [/concepts/session](/vi/concepts/session) và xác nhận `sessionKey` trong `/status`.
- **Kho lưu trữ và bản ghi không khớp?** Xác nhận máy chủ Gateway và đường dẫn kho lưu trữ từ `openclaw status`.
- **Compaction diễn ra liên tục?** Kiểm tra cửa sổ ngữ cảnh của mô hình (quá nhỏ sẽ buộc Compaction thường xuyên) và tình trạng phình to của kết quả công cụ (điều chỉnh việc cắt tỉa phiên).
- **Mọi prompt dường như đều bị tràn trên mô hình cục bộ nhỏ?** Xác nhận nhà cung cấp báo cáo đúng cửa sổ ngữ cảnh của mô hình. OpenClaw chỉ có thể giới hạn phần dự trữ hiệu dụng khi biết cửa sổ đó.
- **Các lượt im lặng bị rò rỉ?** Xác nhận phản hồi bắt đầu bằng chính xác token im lặng `NO_REPLY` (không phân biệt chữ hoa chữ thường) và bạn đang dùng bản dựng có bản sửa lỗi ẩn luồng (`2026.1.10`+).

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
- [Tham chiếu cấu hình tác tử](/vi/gateway/config-agents)
