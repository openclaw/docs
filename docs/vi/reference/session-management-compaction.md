---
read_when:
    - Bạn cần gỡ lỗi mã định danh phiên, sự kiện bản ghi hội thoại hoặc các trường trong hàng dữ liệu phiên
    - Bạn đang thay đổi hành vi tự động Compaction hoặc bổ sung tác vụ dọn dẹp "trước Compaction"
    - Bạn muốn triển khai việc xả bộ nhớ hoặc các lượt hệ thống im lặng
summary: 'Phân tích chuyên sâu: kho lưu trữ phiên + bản ghi, vòng đời và cơ chế nội bộ của Compaction (tự động)'
title: Tìm hiểu chuyên sâu về quản lý phiên
x-i18n:
    generated_at: "2026-07-16T15:01:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Một **tiến trình Gateway** duy nhất quản lý trạng thái phiên từ đầu đến cuối. Các giao diện người dùng (ứng dụng macOS, Control UI trên web, TUI) truy vấn Gateway để lấy danh sách phiên và số lượng token. Ở chế độ từ xa, các tệp phiên nằm trên máy chủ từ xa, vì vậy việc kiểm tra các tệp trên máy Mac cục bộ sẽ không phản ánh những gì Gateway đang sử dụng.

Trước tiên, xem các tài liệu tổng quan: [Quản lý phiên](/vi/concepts/session), [Compaction](/vi/concepts/compaction), [Tổng quan về bộ nhớ](/vi/concepts/memory), [Tìm kiếm bộ nhớ](/vi/concepts/memory-search), [Cắt tỉa phiên](/vi/concepts/session-pruning), [Vệ sinh bản ghi hội thoại](/vi/reference/transcript-hygiene), tài liệu tham chiếu cấu hình đầy đủ tại [Cấu hình tác nhân](/vi/gateway/config-agents).

## Hai lớp lưu trữ lâu dài

1. **Các hàng phiên (SQLite theo từng tác nhân)** - ánh xạ khóa/giá trị `sessionKey -> SessionEntry`. Trạng thái thời gian chạy có thể thay đổi do Gateway quản lý. Theo dõi siêu dữ liệu: mã định danh phiên hiện tại, hoạt động gần nhất, các tùy chọn bật/tắt, bộ đếm token.
2. **Các sự kiện bản ghi hội thoại (SQLite theo từng tác nhân)** - chỉ cho phép nối thêm, có cấu trúc cây (các mục có `id` + `parentId`). Lưu trữ cuộc hội thoại, các lệnh gọi công cụ và bản tóm tắt Compaction; tái dựng ngữ cảnh mô hình cho các lượt sau. Các điểm kiểm tra Compaction là siêu dữ liệu trên bản ghi hội thoại kế tiếp đã được thu gọn - một lần Compaction mới không ghi thêm bản sao `.checkpoint.*.jsonl` thứ hai.

Các bản cài đặt cũ hơn có thể vẫn còn tệp `sessions.json` trong thư mục `sessions/` của tác nhân.
Hãy coi các tệp đó là dữ liệu đầu vào để di chuyển hàng phiên cũ hoặc mục tiêu bảo trì ngoại tuyến rõ ràng. Quá trình khởi động Gateway và `openclaw doctor --fix` tự động nhập các hàng cũ đang hoạt động cùng lịch sử bản ghi hội thoại vào kho SQLite theo từng tác nhân. Chạy `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`, sau đó làm theo [quy trình di chuyển của Doctor](/vi/cli/doctor#session-sqlite-migration) khi cần bằng chứng kiểm tra hoặc xác thực rõ ràng. Nếu quá trình di chuyển thất bại sau khi các cấu phần bản ghi hội thoại cũ đã được lưu trữ, hãy sử dụng chế độ khôi phục Doctor trong quy trình đó. Quá trình khôi phục sử dụng các tệp kê khai di chuyển, chỉ khôi phục các cấu phần hỗ trợ đã lưu trữ bị ảnh hưởng, chuẩn bị báo cáo sự cố GitHub đã được loại bỏ dữ liệu nhạy cảm khi có yêu cầu và không khiến thời gian chạy đang hoạt động đọc lại các tệp JSONL.

Các trình đọc lịch sử của Gateway tránh hiện thực hóa toàn bộ bản ghi hội thoại trừ khi bề mặt cần truy cập tùy ý vào lịch sử. Lịch sử trang đầu tiên, lịch sử trò chuyện được nhúng, khôi phục sau khi khởi động lại và kiểm tra token/mức sử dụng dùng các lần đọc phần đuôi có giới hạn từ SQLite. Việc quét toàn bộ bản ghi hội thoại đi qua chỉ mục bản ghi hội thoại bất đồng bộ và được chia sẻ giữa các trình đọc đồng thời.

## Vị trí trên đĩa

Theo từng tác nhân, trên máy chủ Gateway (được phân giải qua `src/config/sessions.ts`):

- Kho hàng phiên thời gian chạy: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Các hàng bản ghi hội thoại thời gian chạy: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Các cấu phần bản ghi hội thoại cũ/lưu trữ: `~/.openclaw/agents/<agentId>/sessions/`
- Dữ liệu đầu vào di chuyển hàng cũ: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Bảo trì kho và kiểm soát đĩa

`session.maintenance` kiểm soát việc bảo trì tự động cho các hàng phiên SQLite, các hàng bản ghi hội thoại SQLite, cấu phần lưu trữ và tệp phụ quỹ đạo:

| Khóa                    | Mặc định              | Ghi chú                                                                                     |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | hoặc `"warn"` (chỉ báo cáo, không thay đổi)                                                      |
| `pruneAfter`            | `"30d"`               | ngưỡng tuổi của mục cũ                                                                      |
| `maxEntries`            | `500`                 | giới hạn số mục phiên                                                                      |
| `resetArchiveRetention` | giữ lại (không có ngưỡng tuổi)  | ngưỡng tuổi cho kho lưu trữ bản ghi hội thoại `*.reset.*`/`*.deleted.*`; một khoảng thời gian sẽ bật tính năng xóa |
| `maxDiskBytes`          | `2gb`                 | hạn mức đĩa cho phiên theo từng tác nhân; `false` sẽ vô hiệu hóa                                            |
| `highWaterBytes`        | 80% của `maxDiskBytes` | mục tiêu sau khi dọn dẹp hạn mức                                                                 |

Theo mặc định, các bản ghi hội thoại đã lưu trữ được giữ lại và nén bằng zstd (`*.jsonl.<reason>.<timestamp>.zst`) khi thời gian chạy hỗ trợ, vì vậy việc xóa hoặc đặt lại phiên không bao giờ âm thầm loại bỏ lịch sử hội thoại. Hạn mức đĩa loại bỏ các kho lưu trữ cũ nhất trước, trước khi tác động đến các phiên đang hoạt động.

Việc thực thi chủ động `maxDiskBytes` của SQLite đo số byte JSON của hàng phiên cộng với số byte JSON của sự kiện bản ghi hội thoại cho mỗi phiên; việc thực thi bảo trì ngoại tuyến cũ đo các tệp trong thư mục phiên đã chọn.

Các phiên thăm dò lần chạy mô hình của Gateway (các khóa khớp với `agent:*:explicit:model-run-<uuid>`) có thời gian lưu giữ `24h` cố định, riêng biệt. Việc cắt tỉa này chỉ chạy khi có áp lực: nó chỉ chạy khi đạt đến áp lực bảo trì/giới hạn số mục phiên và chỉ chạy trước bước dọn dẹp/giới hạn toàn cục cho các mục cũ. Các phiên rõ ràng khác không sử dụng thời gian lưu giữ này.

Thứ tự thực thi khi dọn dẹp hạn mức đĩa (`mode: "enforce"`):

1. Trước tiên, loại bỏ các cấu phần bản ghi hội thoại lưu trữ cũ nhất, cấu phần cũ không còn liên kết hoặc cấu phần quỹ đạo không còn liên kết.
2. Nếu vẫn vượt mục tiêu, loại bỏ các mục phiên cũ nhất cùng các hàng bản ghi hội thoại hoặc cấu phần quỹ đạo của chúng.
3. Lặp lại cho đến khi mức sử dụng bằng hoặc thấp hơn `highWaterBytes`.

`mode: "warn"` báo cáo các mục có thể bị loại bỏ mà không thay đổi kho hoặc tệp.

Chạy bảo trì theo yêu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

Quá trình bảo trì giữ lại các con trỏ hội thoại bên ngoài bền vững như phiên nhóm và phiên trò chuyện theo phạm vi luồng, nhưng các mục thời gian chạy tổng hợp (cron, hook, heartbeat, ACP, tác nhân con) vẫn có thể bị loại bỏ khi vượt quá tuổi, số lượng hoặc hạn mức đĩa đã cấu hình. Các lần chạy cron cô lập sử dụng tùy chọn điều khiển `cron.sessionRetention` riêng biệt, độc lập với thời gian lưu giữ của hoạt động thăm dò lần chạy mô hình.

Các thao tác ghi Gateway thông thường đi qua trình truy cập phiên, trình này tuần tự hóa các thay đổi SQLite theo từng tác nhân qua đường dẫn trình ghi thời gian chạy. Mã thời gian chạy nên ưu tiên các hàm hỗ trợ của trình truy cập trong `src/config/sessions/session-accessor.ts`; các hàm hỗ trợ `sessions.json` cũ là công cụ di chuyển và bảo trì ngoại tuyến. Khi có thể kết nối Gateway, các lệnh `openclaw sessions cleanup` và `openclaw agents delete` không ở chế độ chạy thử sẽ ủy quyền các thay đổi kho cho Gateway để quá trình dọn dẹp tham gia cùng hàng đợi ghi; `--store <path>` là đường dẫn sửa chữa ngoại tuyến rõ ràng cho một kho cũ đã chọn và luôn chạy cục bộ (`--dry-run` cũng vậy). Việc dọn dẹp `maxEntries` được xử lý theo lô cho các kho có quy mô sản xuất, vì vậy một kho có thể tạm thời vượt quá giới hạn đã cấu hình trước khi lần dọn dẹp ngưỡng cao tiếp theo ghi lại để đưa kho xuống dưới giới hạn. Các thao tác đọc không bao giờ cắt tỉa hoặc giới hạn mục trong quá trình khởi động Gateway - chỉ các thao tác ghi hoặc `openclaw sessions cleanup --enforce` thực hiện việc đó; lệnh sau cũng áp dụng giới hạn ngay lập tức và cắt tỉa các cấu phần bản ghi hội thoại, điểm kiểm tra và quỹ đạo cũ không còn được tham chiếu ngay cả khi chưa cấu hình hạn mức đĩa.

OpenClaw không còn tự động tạo bản sao lưu luân phiên `sessions.json.bak.*` trong quá trình Gateway ghi. Lược đồ hiện tại từ chối khóa `session.maintenance.rotateBytes` cũ và `openclaw doctor --fix` loại bỏ khóa đó khỏi các cấu hình cũ hơn.

Các thay đổi bản ghi hội thoại sử dụng hàng đợi ghi phiên cho mục tiêu bản ghi hội thoại SQLite:

| Cài đặt                              | Mặc định   | Ghi đè bằng biến môi trường                                     |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` là thời gian chờ khóa trước khi hiển thị lỗi phiên đang bận rồi từ bỏ; chỉ tăng giá trị này khi công việc chuẩn bị, dọn dẹp, Compaction hoặc phản chiếu bản ghi hội thoại hợp lệ tranh chấp lâu hơn trên các máy chậm. `staleMs` xác định thời điểm một khóa hiện có có thể được thu hồi vì đã cũ. `maxHoldMs` là ngưỡng giải phóng của bộ giám sát trong tiến trình.

### Hạ cấp sau khi chuyển sang SQLite

Khôi phục các cấu phần bản ghi hội thoại cũ đã lưu trữ trước khi chạy phiên bản OpenClaw cũ hơn dựa trên tệp:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Quá trình di chuyển giữ nguyên các tệp `sessions.json` cũ để hỗ trợ và quay lui, nhưng các tệp JSONL bản ghi hội thoại đang hoạt động đã được nhập vào SQLite sẽ được đổi tên thành `session-sqlite-import-archive/`. Các thời gian chạy cũ hơn dựa trên tệp đi theo các đường dẫn `sessionFile` trong `sessions.json`, vì vậy chúng cần khôi phục các cấu phần đó trước khi khởi động. Quá trình khôi phục sử dụng các tệp kê khai di chuyển, chỉ di chuyển các cấu phần đã lưu trữ được ghi nhận mà đường dẫn gốc không còn tồn tại, đồng thời giữ nguyên cơ sở dữ liệu SQLite để phục hồi về sau.

Các phiên được tạo sau khi chuyển sang SQLite chỉ tồn tại trong SQLite và sẽ không xuất hiện trong thời gian chạy cũ hơn dựa trên tệp. Nếu nâng cấp lại sau khi hạ cấp, hãy chạy lại quy trình kiểm tra và xác thực của Doctor để OpenClaw có thể xác minh các cấu phần cũ đã khôi phục trước khi nhập.

## Phiên Cron và nhật ký lần chạy

Các lần chạy cron cô lập tạo mục phiên/bản ghi hội thoại riêng với thời gian lưu giữ chuyên biệt:

- `cron.sessionRetention` (mặc định `"24h"`) cắt tỉa các phiên chạy cron cô lập cũ khỏi kho; `false` sẽ vô hiệu hóa.
- Lịch sử lần chạy giữ lại 2000 hàng kết thúc mới nhất cho mỗi tác vụ cron. Các hàng bị mất vẫn giữ khoảng thời gian dọn dẹp 24 giờ.

Khi cron buộc tạo một phiên chạy cô lập mới, nó làm sạch mục phiên `cron:<jobId>` trước đó trước khi ghi hàng mới: nó giữ lại các tùy chọn an toàn (cài đặt suy nghĩ/nhanh/chi tiết/lập luận, nhãn, tên hiển thị) và các ghi đè mô hình/xác thực do người dùng chọn rõ ràng, nhưng loại bỏ ngữ cảnh hội thoại xung quanh (định tuyến kênh/nhóm, chính sách gửi/hàng đợi, nâng quyền, nguồn gốc, liên kết thời gian chạy ACP) để một lần chạy cô lập mới không thể kế thừa quyền phân phối hoặc quyền thời gian chạy cũ từ lần chạy trước.

## Khóa phiên (`sessionKey`)

Một `sessionKey` xác định vùng hội thoại hiện tại (định tuyến + cô lập). Quy tắc chính tắc: [/concepts/session](/vi/concepts/session).

| Mẫu                          | Ví dụ                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| Trò chuyện chính/trực tiếp (theo từng tác nhân) | `agent:<agentId>:<mainKey>` (mặc định `main`)                |
| Nhóm                         | `agent:<agentId>:<channel>:group:<id>`                      |
| Phòng/kênh (Discord/Slack)   | `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>` |
| Cron                         | `cron:<job.id>`                                             |
| Webhook                      | `hook:<uuid>` (trừ khi được ghi đè)                           |

## Mã định danh phiên (`sessionId`)

Mỗi `sessionKey` trỏ đến một `sessionId` hiện tại (danh tính bản ghi hội thoại SQLite tiếp tục cuộc hội thoại). Logic quyết định nằm trong `initSessionState()` tại `src/auto-reply/reply/session.ts`.

- **Đặt lại** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Đặt lại hằng ngày** (mặc định lúc 4:00 AM theo giờ địa phương trên máy chủ Gateway) tạo một `sessionId` mới khi có tin nhắn tiếp theo sau mốc đặt lại.
- **Hết hạn do không hoạt động** (`session.reset.idleMinutes`, hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi có tin nhắn đến sau khoảng thời gian không hoạt động. Nếu cả đặt lại hằng ngày và hết hạn do không hoạt động đều được cấu hình, điều kiện nào hết hạn trước sẽ được áp dụng.
- **Tiếp tục khi Control UI kết nối lại** giữ nguyên phiên hiện đang hiển thị cho một lần gửi sau khi kết nối lại khi Gateway nhận được `sessionId` khớp từ máy khách UI của người vận hành. Đây là tín hiệu dùng một lần; các lần gửi cũ thông thường vẫn tạo một `sessionId` mới.
- **Sự kiện hệ thống** (Heartbeat, đánh thức Cron, thông báo thực thi, tác vụ ghi sổ của Gateway) có thể thay đổi hàng phiên nhưng không bao giờ kéo dài độ mới cho việc đặt lại hằng ngày/do không hoạt động. Quá trình chuyển phiên khi đặt lại sẽ loại bỏ các thông báo sự kiện hệ thống đang chờ của phiên trước trước khi lời nhắc mới được tạo.
- **Chính sách phân nhánh từ phiên mẹ** sử dụng nhánh đang hoạt động của OpenClaw khi tạo luồng hoặc bản phân nhánh của tác tử con. Nếu nhánh đó quá lớn (vượt quá giới hạn nội bộ cố định, hiện là 100K token), OpenClaw khởi động tiến trình con với ngữ cảnh biệt lập thay vì thất bại hoặc kế thừa lịch sử không thể sử dụng. Việc xác định kích thước diễn ra tự động và không thể cấu hình; cấu hình `session.parentForkMaxTokens` cũ được `openclaw doctor --fix` loại bỏ.
- **Bản phân nhánh của người vận hành**: `sessions.create { parentSessionKey, fork: true }` tạo một phiên mới có bản chép lời phân nhánh từ trạng thái hiện tại của phiên mẹ (cùng cơ chế phân nhánh như khi tạo tác tử con, bao gồm giới hạn kích thước ở trên). Thao tác phân nhánh bị từ chối khi phiên mẹ có một lượt chạy đang hoạt động, kế thừa lựa chọn mô hình của phiên mẹ trừ khi một lựa chọn được truyền vào rõ ràng, đồng thời đánh dấu phiên con là `forkedFromParent` với các bộ đếm token mới.

## Lược đồ kho phiên

Kho thời gian chạy lưu các giá trị `SessionEntry` trong SQLite riêng cho từng tác tử. Kiểu giá trị là `SessionEntry` trong `src/config/sessions.ts`. Các trường chính (không đầy đủ):

- `sessionId`: mã định danh bản chép lời hiện tại dùng để truy cập các hàng bản chép lời SQLite
- `sessionStartedAt`: dấu thời gian bắt đầu cho `sessionId` hiện tại; độ mới khi đặt lại hằng ngày sử dụng trường này. Các hàng cũ có thể suy ra trường này từ phần đầu phiên JSONL.
- `lastInteractionAt`: dấu thời gian tương tác thực gần nhất của người dùng/kênh; độ mới khi đặt lại do không hoạt động sử dụng trường này để các sự kiện Heartbeat, Cron và thực thi không duy trì phiên hoạt động. Các hàng cũ không có trường này sẽ dùng thời gian bắt đầu phiên đã khôi phục làm giá trị dự phòng.
- `updatedAt`: dấu thời gian thay đổi hàng trong kho gần nhất, dùng để liệt kê/cắt tỉa/ghi sổ - không phải nguồn có thẩm quyền về độ mới khi đặt lại hằng ngày/do không hoạt động.
- `archivedAt`: dấu thời gian lưu trữ tùy chọn. Các phiên đã lưu trữ vẫn nằm trong kho với bản chép lời nguyên vẹn và bị loại khỏi danh sách hoạt động thông thường.
- `pinnedAt`: dấu thời gian ghim tùy chọn. Các phiên đang hoạt động được ghim được sắp xếp trước các phiên không ghim; việc lưu trữ phiên sẽ xóa trạng thái ghim.
- Khả năng tương tác với luồng Codex: cả hai trường tuân theo cấu trúc quản lý luồng của Codex - các giá trị boolean `archived`/`pinned` trên đường truyền luôn được suy ra từ dấu thời gian và được đóng dấu phía máy chủ, phù hợp với ngữ nghĩa `threads.archived_at` của Codex và cách tuần tự hóa camelCase. Dấu thời gian OpenClaw dùng mili giây kể từ epoch, còn Codex dùng giây kể từ epoch, vì vậy các cầu nối thực hiện chuyển đổi tại ranh giới Plugin `codex`. Codex chưa có API ghim (chỉ có `thread/archive`/`thread/unarchive`); trạng thái ghim vẫn được giữ phía OpenClaw cho đến khi API đó tồn tại, khi ấy cấu trúc tương ứng cho phép các phiên đã liên kết trao đổi hai chiều trạng thái ghim một cách tự động.
- Chức năng giám sát Codex chỉ liệt kê các luồng gốc chưa được lưu trữ. Một luồng `idle` cục bộ trên Gateway hoặc luồng `notLoaded` không rõ trạng thái hoạt động chỉ có thể được lưu trữ thông qua `thread/archive` gốc sau khi người vận hành xác nhận rõ ràng rằng không có tiến trình Codex nào khác sở hữu luồng đó; Plugin trước tiên thực hiện một lần đọc mới trạng thái cục bộ của tiến trình, sau đó luồng biến mất khỏi danh mục. Lần đọc đó không thể chứng minh rằng một tiến trình App Server khác không sử dụng luồng này. OpenClaw từ chối lưu trữ các hàng đang hoạt động và có lỗi, còn tính năng lưu trữ trên node ghép cặp không khả dụng cho đến khi cầu nối node có thể sở hữu toàn bộ vòng đời luồng được truyền phát. Việc bỏ lưu trữ trong máy khách Codex gốc khiến luồng đủ điều kiện xuất hiện trở lại.
- `lastReadAt` / `markedUnreadAt`: dấu thời gian trạng thái đọc được `sessions.patch { unread }` đóng dấu phía máy chủ - `unread: false` ghi nhận một lần đọc (đặt `lastReadAt`, xóa `markedUnreadAt`); `unread: true` đánh dấu phiên là chưa đọc cho đến lần đọc tiếp theo. Các hàng phiên cung cấp giá trị boolean `unread` được suy ra: được đánh dấu rõ ràng là chưa đọc, hoặc được đọc trước hoạt động gần nhất. Các phiên chưa từng được đánh dấu là đã đọc vẫn là `unread: false`, vì vậy các bản cài đặt hiện có không đột ngột hiển thị thông báo khi nâng cấp.
- `lastActivityAt`: dấu thời gian của lượt chạy tác tử hoàn tất gần nhất được tính là hoạt động đáng đánh dấu chưa đọc (các lượt chạy của người dùng, kênh và Cron). Các lượt Heartbeat và sự kiện nội bộ, cùng với các bản vá siêu dữ liệu, không cập nhật trường này; `updatedAt` không phải là tín hiệu hoạt động.
- `sessionFile`: dấu đánh dấu cũ được giữ lại để tương thích với quá trình di chuyển/lưu trữ; thời gian chạy đang hoạt động sử dụng danh tính SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu nhãn nhóm/kênh
- Tùy chọn bật/tắt: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (ghi đè theo từng phiên)
- Lựa chọn mô hình: `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (nỗ lực tối đa/phụ thuộc nhà cung cấp): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần tự động Compaction hoàn tất cho khóa phiên này
- `memoryFlushAt` / `memoryFlushCompactionCount`: dấu thời gian và số lần Compaction của lần đẩy bộ nhớ trước Compaction gần nhất

Gateway là nguồn có thẩm quyền: nó có thể ghi lại hoặc khôi phục các mục khi phiên
đang chạy. Đối với các bản cài đặt cũ dựa trên tệp, hãy di chuyển bằng
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` thay vì
chỉnh sửa `sessions.json` rồi kỳ vọng thời gian chạy tiếp tục đọc tệp đó.

## Cấu trúc sự kiện bản chép lời

Các bản chép lời được quản lý bởi bộ truy cập phiên OpenClaw và được cung cấp cho mã thời gian chạy thông qua các trình trợ giúp dựa trên danh tính. Luồng sự kiện chỉ cho phép nối thêm:

- Mục đầu tiên: phần đầu phiên - `type: "session"`, `id`, `cwd`, `timestamp`, `parentSession` tùy chọn.
- Sau đó: các mục có `id` + `parentId` (cấu trúc cây).

Các loại mục đáng chú ý:

- `message`: tin nhắn user/assistant/toolResult
- `custom_message`: tin nhắn do phần mở rộng chèn vào và _có_ đi vào ngữ cảnh mô hình (được kết xuất trong TUI khi `display: true`, bị ẩn hoàn toàn khi `display: false`)
- `custom`: trạng thái phần mở rộng _không_ đi vào ngữ cảnh mô hình (để duy trì trạng thái phần mở rộng qua các lần tải lại)
- `compaction`: bản tóm tắt Compaction được duy trì với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: bản tóm tắt được duy trì khi điều hướng một nhánh cây

OpenClaw chủ ý không "sửa lại" các bản chép lời; Gateway sử dụng `SessionManager` để đọc/ghi chúng.

## Cửa sổ ngữ cảnh so với token được theo dõi

Hai khái niệm khác nhau:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng cho từng mô hình (các token hiển thị với mô hình). Giá trị này đến từ danh mục mô hình và có thể được ghi đè qua cấu hình.
2. **Bộ đếm kho phiên**: số liệu thống kê luân phiên được ghi vào hàng phiên (dùng cho `/status` và bảng điều khiển). `contextTokens` là giá trị ước tính/báo cáo thời gian chạy - không được coi đây là bảo đảm nghiêm ngặt.

Thông tin thêm về giới hạn: [/reference/token-use](/vi/reference/token-use).

## Compaction: khái niệm

Compaction tóm tắt cuộc trò chuyện cũ thành một mục `compaction` được duy trì trong bản chép lời và giữ nguyên các tin nhắn gần đây. Sau Compaction, các lượt tiếp theo thấy bản tóm tắt Compaction cùng các tin nhắn sau `firstKeptEntryId`. Compaction mang tính **bền vững**, không giống việc cắt tỉa phiên - xem [/concepts/session-pruning](/vi/concepts/session-pruning).

Việc chèn lại phần AGENTS.md sau Compaction được bật theo lựa chọn qua `agents.defaults.compaction.postCompactionSections`; khi không được đặt hoặc là `[]`, OpenClaw không nối thêm các đoạn trích AGENTS.md lên trên bản tóm tắt Compaction.

### Ranh giới phân đoạn và ghép cặp công cụ

Khi chia một bản chép lời dài thành các phân đoạn Compaction, OpenClaw giữ các lệnh gọi công cụ của trợ lý ghép cặp với các mục `toolResult` tương ứng:

- Nếu phép chia theo tỷ lệ token rơi vào giữa một lệnh gọi công cụ và kết quả của nó, OpenClaw dịch chuyển ranh giới đến tin nhắn lệnh gọi công cụ của trợ lý thay vì tách cặp.
- Nếu một khối kết quả công cụ ở cuối có thể đẩy phân đoạn vượt quá mục tiêu, OpenClaw giữ nguyên khối công cụ đang chờ đó và giữ nguyên phần đuôi chưa được tóm tắt.
- Các khối lệnh gọi công cụ bị hủy/có lỗi không giữ trạng thái chờ phân chia mở.

## Thời điểm tự động Compaction diễn ra

Hai điều kiện kích hoạt trong tác tử OpenClaw nhúng:

1. **Khôi phục khi tràn**: mô hình trả về lỗi tràn ngữ cảnh (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` và các biến thể khác theo cấu trúc của nhà cung cấp) - thực hiện Compaction rồi thử lại. Khi nhà cung cấp báo cáo số token đã thử sử dụng, OpenClaw chuyển tiếp số lượng quan sát được đó vào quá trình Compaction khôi phục khi tràn; nếu nhà cung cấp xác nhận tràn nhưng không cung cấp số lượng có thể phân tích, OpenClaw truyền một số lượng tổng hợp vừa vượt ngân sách tối thiểu cho các công cụ Compaction và chẩn đoán. Nếu quá trình khôi phục khi tràn vẫn thất bại, OpenClaw hiển thị hướng dẫn rõ ràng và giữ nguyên ánh xạ phiên hiện tại thay vì âm thầm chuyển sang mã định danh phiên mới - hãy thử lại tin nhắn, chạy `/compact`, hoặc chạy `/new`.
2. **Duy trì theo ngưỡng**: sau một lượt thành công, khi `contextTokens > contextWindow - reserveTokens`, trong đó `contextWindow` là cửa sổ ngữ cảnh của mô hình và `reserveTokens` là khoảng dự phòng dành cho lời nhắc cùng đầu ra mô hình tiếp theo.

Hai cơ chế bảo vệ bổ sung chạy ngoài hai điều kiện kích hoạt này:

- **Compaction cục bộ trước khi chạy**: đặt `agents.defaults.compaction.maxActiveTranscriptBytes` (byte hoặc một chuỗi như `"20mb"`) để kích hoạt Compaction cục bộ trước khi mở lượt chạy tiếp theo khi bản chép lời đang hoạt động đạt kích thước đó. Đây là cơ chế bảo vệ kích thước cho chi phí mở lại cục bộ, không phải lưu trữ thô - Compaction ngữ nghĩa thông thường vẫn chạy và cần `truncateAfterCompaction` để bản tóm tắt đã Compaction trở thành một bản chép lời kế tiếp mới.
- **Kiểm tra trước giữa lượt**: đặt `agents.defaults.compaction.midTurnPrecheck.enabled: true` (mặc định `false`) để thêm cơ chế bảo vệ vòng lặp công cụ. Sau khi kết quả công cụ được nối thêm và trước lệnh gọi mô hình tiếp theo, OpenClaw ước tính áp lực lời nhắc bằng cùng logic ngân sách trước khi chạy được dùng khi bắt đầu lượt. Nếu ngữ cảnh không còn vừa, cơ chế bảo vệ không thực hiện Compaction nội tuyến - nó phát tín hiệu kiểm tra trước giữa lượt có cấu trúc, dừng lần gửi lời nhắc hiện tại và để vòng lặp chạy bên ngoài sử dụng đường dẫn khôi phục hiện có (cắt ngắn các kết quả công cụ quá lớn khi như vậy là đủ, hoặc kích hoạt chế độ Compaction đã cấu hình rồi thử lại). Hoạt động với cả chế độ Compaction `default` và `safeguard`, bao gồm Compaction bảo vệ do nhà cung cấp hỗ trợ. Độc lập với `maxActiveTranscriptBytes`: cơ chế bảo vệ kích thước byte chạy trước khi một lượt mở ra, còn kiểm tra trước giữa lượt chạy sau đó, sau khi các kết quả công cụ mới được nối thêm.

## Cài đặt Compaction

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw cũng áp dụng một ngưỡng an toàn tối thiểu cho các lượt chạy nhúng: nếu `compaction.reserveTokens` thấp hơn `reserveTokensFloor` (mặc định `20000`), OpenClaw sẽ nâng giá trị đó lên. Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để vô hiệu hóa ngưỡng tối thiểu. Khi biết cửa sổ ngữ cảnh của mô hình đang hoạt động, cả ngưỡng tối thiểu lẫn phần dự trữ hiệu dụng cuối cùng đều bị giới hạn để phần dự trữ không thể chiếm toàn bộ ngân sách lời nhắc. Điều này ngăn các mô hình có ngữ cảnh nhỏ (ví dụ: mô hình cục bộ 16K token) bước vào Compaction ngay từ token đầu tiên; khi không biết cửa sổ ngữ cảnh, ngân sách dự trữ đã cấu hình và hiện tại vẫn không bị giới hạn. Lý do cần ngưỡng tối thiểu: chừa đủ dư địa cho các tác vụ "dọn dẹp" qua nhiều lượt (như việc đẩy bộ nhớ xuống lưu trữ bên dưới) trước khi không thể tránh khỏi Compaction. Phần triển khai: `applyAgentCompactionSettingsFromConfig()` trong `src/agents/agent-settings.ts`, được gọi từ các đường dẫn thiết lập lượt chạy của trình chạy nhúng và Compaction.

Thao tác `/compact` thủ công tôn trọng `agents.defaults.compaction.keepRecentTokens` được chỉ định rõ ràng và giữ nguyên điểm cắt phần đuôi gần đây của runtime. Nếu không có ngân sách lưu giữ được chỉ định rõ ràng, Compaction thủ công là một điểm kiểm tra cứng và ngữ cảnh được dựng lại sẽ bắt đầu từ bản tóm tắt mới.

Khi bật `truncateAfterCompaction`, OpenClaw luân chuyển bản ghi hội thoại đang hoạt động sang bản kế nhiệm đã được nén sau Compaction. Các thao tác điểm kiểm tra phân nhánh/khôi phục sử dụng bản kế nhiệm đã nén đó; các tệp điểm kiểm tra cũ trước Compaction vẫn có thể đọc được trong khi còn được tham chiếu.

## Nhà cung cấp Compaction có thể cắm thêm

Các Plugin đăng ký một nhà cung cấp Compaction qua `registerCompactionProvider()` trên API Plugin. Khi `agents.defaults.compaction.provider` được đặt thành mã định danh của một nhà cung cấp đã đăng ký, tiện ích bảo vệ sẽ ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì quy trình `summarizeInStages` tích hợp sẵn.

- `provider`: mã định danh của một Plugin nhà cung cấp Compaction đã đăng ký. Để trống để sử dụng tính năng tóm tắt LLM mặc định. Việc đặt `provider` sẽ buộc `mode: "safeguard"`.
- Các nhà cung cấp nhận cùng hướng dẫn Compaction và chính sách bảo toàn mã định danh như đường dẫn tích hợp sẵn, đồng thời tiện ích bảo vệ vẫn giữ lại ngữ cảnh hậu tố của các lượt gần đây và lượt bị chia tách sau đầu ra của nhà cung cấp.
- Tính năng tóm tắt bảo vệ tích hợp sẵn chắt lọc lại các bản tóm tắt trước đó cùng với thông điệp mới thay vì giữ nguyên văn toàn bộ bản tóm tắt trước.
- Chế độ bảo vệ mặc định bật kiểm tra chất lượng bản tóm tắt; đặt `qualityGuard.enabled: false` để bỏ qua hành vi thử lại khi đầu ra không đúng định dạng.
- Nếu nhà cung cấp thất bại hoặc trả về kết quả trống, OpenClaw sẽ tự động quay về tính năng tóm tắt LLM tích hợp sẵn. Các tín hiệu hủy/hết thời gian do bên gọi kích hoạt rõ ràng sẽ được phát sinh lại thay vì bị bỏ qua, nhờ đó thao tác hủy luôn được tôn trọng.

Nguồn: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Các bề mặt hiển thị cho người dùng

- `/status` trong mọi phiên trò chuyện
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Nhật ký Gateway (`pnpm gateway:watch` hoặc `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Chế độ chi tiết: `🧹 Auto-compaction complete` cộng với số lần Compaction

## Dọn dẹp im lặng (`NO_REPLY`)

OpenClaw hỗ trợ các lượt "im lặng" cho tác vụ nền mà người dùng không nên thấy đầu ra trung gian.

- Trợ lý bắt đầu đầu ra bằng chính xác token im lặng `NO_REPLY` / `no_reply` để biểu thị "không gửi phản hồi cho người dùng". OpenClaw loại bỏ/ngăn nội dung này tại lớp phân phối.
- Việc ngăn token im lặng chính xác không phân biệt chữ hoa chữ thường: cả `NO_REPLY` và `no_reply` đều được tính khi toàn bộ tải dữ liệu chỉ là token im lặng.
- Kể từ `2026.1.10`, OpenClaw cũng ngăn luồng bản nháp/chỉ báo đang nhập khi một đoạn dữ liệu từng phần bắt đầu bằng `NO_REPLY`, để các thao tác im lặng không làm rò rỉ đầu ra từng phần giữa lượt.
- Cơ chế này chỉ dành cho các lượt nền thực sự/không phân phối - đây không phải là lối tắt cho các yêu cầu thông thường cần người dùng hành động.

## Đẩy bộ nhớ xuống lưu trữ trước Compaction

Trước khi tự động Compaction, OpenClaw có thể chạy một lượt tác tử im lặng để ghi trạng thái bền vững vào đĩa (ví dụ: `memory/YYYY-MM-DD.md` trong không gian làm việc của tác tử), nhờ đó Compaction không thể xóa ngữ cảnh quan trọng. OpenClaw giám sát mức sử dụng ngữ cảnh của phiên và khi mức này vượt qua một ngưỡng mềm thấp hơn ngưỡng Compaction, hệ thống sẽ gửi chỉ thị im lặng "ghi bộ nhớ ngay" bằng chính xác token im lặng `NO_REPLY` / `no_reply` để người dùng không nhìn thấy gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`), tài liệu tham khảo đầy đủ tại [/gateway/config-agents](/vi/gateway/config-agents#agentsdefaultscompaction):

| Khóa                        | Mặc định         | Ghi chú                                                                                                                                |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | chưa đặt         | ghi đè chính xác nhà cung cấp/mô hình chỉ cho lượt đẩy xuống lưu trữ, ví dụ `ollama/qwen3:8b`                                           |
| `softThresholdTokens`       | `4000`           | khoảng cách dưới ngưỡng Compaction kích hoạt một lần đẩy xuống lưu trữ                                                                 |
| `forceFlushTranscriptBytes` | chưa đặt (đã tắt) | buộc đẩy xuống lưu trữ khi tệp bản ghi hội thoại đạt kích thước byte này (hoặc chuỗi như `"2mb"`), ngay cả khi bộ đếm token đã lỗi thời; `0` sẽ vô hiệu hóa |
| `prompt`                    | tích hợp sẵn      | thông điệp người dùng cho lượt đẩy xuống lưu trữ                                                                                        |
| `systemPrompt`              | tích hợp sẵn      | lời nhắc hệ thống bổ sung được nối thêm cho lượt đẩy xuống lưu trữ                                                                      |

Ghi chú:

- Lời nhắc/lời nhắc hệ thống mặc định bao gồm gợi ý `NO_REPLY` để ngăn phân phối.
- Khi đặt `model`, lượt đẩy xuống lưu trữ sử dụng mô hình đó mà không kế thừa chuỗi dự phòng của phiên đang hoạt động, nhờ đó tác vụ dọn dẹp chỉ chạy cục bộ không âm thầm chuyển sang mô hình trò chuyện trả phí khi thất bại.
- Việc đẩy xuống lưu trữ chạy một lần trong mỗi chu kỳ Compaction (được theo dõi trong hàng của phiên).
- Việc đẩy xuống lưu trữ chỉ chạy cho các phiên OpenClaw nhúng; các phần phụ trợ CLI và lượt Heartbeat sẽ bỏ qua.
- Việc đẩy xuống lưu trữ bị bỏ qua khi không gian làm việc của phiên ở chế độ chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Bộ nhớ](/vi/concepts/memory) để biết bố cục tệp trong không gian làm việc và các mẫu ghi.

OpenClaw cung cấp hook `session_before_compact` trong API tiện ích mở rộng, nhưng logic đẩy xuống lưu trữ nêu trên nằm ở phía Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), không nằm trên hook đó.

## Danh sách kiểm tra khắc phục sự cố

- **Khóa phiên không đúng?** Bắt đầu với [/concepts/session](/vi/concepts/session) và xác nhận `sessionKey` trong `/status`.
- **Kho lưu trữ và bản ghi hội thoại không khớp?** Xác nhận máy chủ Gateway và đường dẫn kho lưu trữ từ `openclaw status`.
- **Compaction diễn ra liên tục?** Kiểm tra cửa sổ ngữ cảnh của mô hình (quá nhỏ sẽ buộc Compaction thường xuyên), `reserveTokens` (quá cao so với cửa sổ mô hình sẽ khiến Compaction diễn ra sớm hơn) và tình trạng phình to do kết quả công cụ (điều chỉnh việc cắt tỉa phiên).
- **Mọi lời nhắc dường như đều bị tràn trên mô hình cục bộ nhỏ?** Xác nhận nhà cung cấp báo cáo đúng cửa sổ ngữ cảnh của mô hình. OpenClaw chỉ có thể giới hạn phần dự trữ hiệu dụng khi biết cửa sổ đó.
- **Lượt im lặng bị rò rỉ?** Xác nhận phản hồi bắt đầu bằng chính xác token im lặng `NO_REPLY` (không phân biệt chữ hoa chữ thường) và bạn đang sử dụng bản dựng có bản sửa lỗi ngăn luồng dữ liệu (`2026.1.10`+).

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
- [Tài liệu tham khảo cấu hình tác tử](/vi/gateway/config-agents)
