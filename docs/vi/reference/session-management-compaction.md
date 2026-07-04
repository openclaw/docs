---
read_when:
    - Bạn cần gỡ lỗi ID phiên, JSONL bản ghi hội thoại, hoặc các trường sessions.json
    - Bạn đang thay đổi hành vi Compaction tự động hoặc thêm tác vụ bảo trì "trước Compaction"
    - Bạn muốn triển khai các lần xả bộ nhớ hoặc các lượt hệ thống âm thầm
summary: 'Chuyên sâu: kho phiên + bản ghi, vòng đời và nội bộ (tự động) Compaction'
title: Phân tích chuyên sâu về quản lý phiên
x-i18n:
    generated_at: "2026-07-04T20:34:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw quản lý phiên từ đầu đến cuối trên các khu vực này:

- **Định tuyến phiên** (cách tin nhắn đến ánh xạ tới một `sessionKey`)
- **Kho phiên** (`sessions.json`) và những gì nó theo dõi
- **Lưu bền bản ghi hội thoại** (`*.jsonl`) và cấu trúc của nó
- **Vệ sinh bản ghi hội thoại** (các chỉnh sửa riêng theo nhà cung cấp trước khi chạy)
- **Giới hạn ngữ cảnh** (cửa sổ ngữ cảnh so với token được theo dõi)
- **Compaction** (Compaction thủ công và tự động) và nơi gắn công việc trước Compaction
- **Dọn dẹp âm thầm** (các lần ghi bộ nhớ không nên tạo đầu ra hiển thị cho người dùng)

Nếu bạn muốn xem tổng quan cấp cao hơn trước, hãy bắt đầu với:

- [Quản lý phiên](/vi/concepts/session)
- [Compaction](/vi/concepts/compaction)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Vệ sinh bản ghi hội thoại](/vi/reference/transcript-hygiene)

---

## Nguồn chân lý: Gateway

OpenClaw được thiết kế xoay quanh một **tiến trình Gateway** duy nhất sở hữu trạng thái phiên.

- Các giao diện người dùng (ứng dụng macOS, Control UI web, TUI) nên truy vấn Gateway để lấy danh sách phiên và số lượng token.
- Ở chế độ từ xa, các tệp phiên nằm trên máy chủ từ xa; "kiểm tra các tệp cục bộ trên Mac của bạn" sẽ không phản ánh những gì Gateway đang sử dụng.

---

## Hai lớp lưu bền

OpenClaw lưu bền phiên ở hai lớp:

1. **Kho phiên (`sessions.json`)**
   - Ánh xạ khóa/giá trị: `sessionKey -> SessionEntry`
   - Nhỏ, có thể thay đổi, an toàn để chỉnh sửa (hoặc xóa mục)
   - Theo dõi siêu dữ liệu phiên (id phiên hiện tại, hoạt động gần nhất, các nút bật/tắt, bộ đếm token, v.v.)

2. **Bản ghi hội thoại (`<sessionId>.jsonl`)**
   - Bản ghi hội thoại chỉ thêm vào với cấu trúc cây (các mục có `id` + `parentId`)
   - Lưu cuộc trò chuyện thực tế + lệnh gọi công cụ + tóm tắt Compaction
   - Được dùng để dựng lại ngữ cảnh mô hình cho các lượt trong tương lai
   - Các điểm kiểm tra Compaction là siêu dữ liệu trên bản ghi hội thoại kế nhiệm đã được thu gọn. Các lần Compaction mới không ghi thêm một bản sao `.checkpoint.*.jsonl` thứ hai.

Các trình đọc lịch sử Gateway nên tránh vật chất hóa toàn bộ bản ghi hội thoại trừ khi bề mặt đó cần truy cập lịch sử tùy ý một cách rõ ràng. Lịch sử trang đầu, lịch sử chat nhúng, khôi phục sau khởi động lại và kiểm tra token/mức sử dụng dùng các lần đọc đuôi có giới hạn. Các lần quét toàn bộ bản ghi hội thoại đi qua chỉ mục bản ghi hội thoại bất đồng bộ, được lưu vào bộ nhớ đệm theo đường dẫn tệp cộng với `mtimeMs`/`size` và được chia sẻ giữa các trình đọc đồng thời.

---

## Vị trí trên đĩa

Theo từng tác tử, trên máy chủ Gateway:

- Kho: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Bản ghi hội thoại: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Phiên chủ đề Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw phân giải các vị trí này qua `src/config/sessions.ts`.

---

## Bảo trì kho và kiểm soát đĩa

Lưu bền phiên có các điều khiển bảo trì tự động (`session.maintenance`) cho `sessions.json`, tạo tác bản ghi hội thoại và sidecar quỹ đạo:

- `mode`: `enforce` (mặc định) hoặc `warn`
- `pruneAfter`: ngưỡng tuổi của mục đã cũ (mặc định `30d`)
- `maxEntries`: giới hạn mục trong `sessions.json` (mặc định `500`)
- Thời gian giữ lại probe chạy mô hình Gateway ngắn hạn được cố định ở `24h`, nhưng có cổng áp lực: nó chỉ xóa các hàng probe nghiêm ngặt đã cũ khi đạt đến áp lực bảo trì/giới hạn mục phiên. Điều này chỉ áp dụng cho các khóa probe rõ ràng nghiêm ngặt khớp với `agent:*:explicit:model-run-<uuid>` và chạy trước quá trình dọn dẹp/giới hạn mục cũ toàn cục khi nó chạy.
- `resetArchiveRetention`: thời gian giữ lại cho kho lưu trữ bản ghi hội thoại `*.reset.<timestamp>` (mặc định: giống `pruneAfter`; `false` tắt dọn dẹp)
- `maxDiskBytes`: ngân sách thư mục phiên tùy chọn
- `highWaterBytes`: mục tiêu tùy chọn sau dọn dẹp (mặc định `80%` của `maxDiskBytes`)

Các lần ghi Gateway thông thường đi qua một trình ghi phiên theo từng kho, tuần tự hóa các thay đổi trong tiến trình mà không lấy khóa tệp khi chạy. Các trình trợ giúp vá trên đường nóng mượn bộ nhớ đệm có thể thay đổi đã được xác thực trong khi chúng giữ slot trình ghi đó, vì vậy các tệp `sessions.json` lớn không bị sao chép hoặc đọc lại cho mỗi lần cập nhật siêu dữ liệu. Mã runtime nên ưu tiên `updateSessionStore(...)` hoặc `updateSessionStoreEntry(...)`; lưu toàn bộ kho trực tiếp là công cụ tương thích và bảo trì ngoại tuyến. Khi có thể truy cập Gateway, `openclaw sessions cleanup` không phải chạy thử và `openclaw agents delete` ủy quyền các thay đổi kho cho Gateway để dọn dẹp tham gia cùng hàng đợi trình ghi; `--store <path>` là đường sửa chữa ngoại tuyến rõ ràng để bảo trì tệp trực tiếp. Dọn dẹp `maxEntries` vẫn được xử lý theo lô cho các giới hạn quy mô sản xuất, vì vậy một kho có thể tạm thời vượt quá giới hạn đã cấu hình trước khi lần dọn dẹp mức nước cao tiếp theo ghi lại nó xuống dưới giới hạn. Các lần đọc kho phiên không cắt tỉa hoặc giới hạn mục trong khi Gateway khởi động; dùng các lần ghi hoặc `openclaw sessions cleanup --enforce` để dọn dẹp. `openclaw sessions cleanup --enforce` vẫn áp dụng giới hạn đã cấu hình ngay lập tức và cắt tỉa các tạo tác bản ghi hội thoại, checkpoint và quỹ đạo cũ không được tham chiếu ngay cả khi không cấu hình ngân sách đĩa.

Bảo trì giữ các con trỏ hội thoại bên ngoài bền vững như phiên nhóm và phiên chat theo phạm vi luồng, nhưng các mục runtime tổng hợp cho cron, hook, heartbeat, ACP và tác tử con vẫn có thể bị xóa khi chúng vượt quá tuổi, số lượng hoặc ngân sách đĩa đã cấu hình. Các phiên probe chạy mô hình Gateway chỉ dùng thời gian giữ lại chạy mô hình `24h` riêng khi khóa của chúng khớp chính xác với `agent:*:explicit:model-run-<uuid>`; các phiên rõ ràng khác không thuộc phần giữ lại đó. Dọn dẹp chạy mô hình chỉ được áp dụng dưới áp lực giới hạn mục phiên. Các lần chạy cron cô lập giữ điều khiển `cron.sessionRetention` riêng, độc lập với thời gian giữ lại probe chạy mô hình.

OpenClaw không còn tạo bản sao lưu xoay vòng `sessions.json.bak.*` tự động trong các lần ghi Gateway. Khóa cũ `session.maintenance.rotateBytes` bị bỏ qua và `openclaw doctor --fix` xóa nó khỏi các cấu hình cũ hơn.

Các thay đổi bản ghi hội thoại dùng khóa ghi phiên trên tệp bản ghi hội thoại. Việc lấy khóa chờ tối đa `session.writeLock.acquireTimeoutMs` trước khi hiển thị lỗi phiên đang bận; mặc định là `60000` ms. Chỉ tăng giá trị này khi công việc chuẩn bị, dọn dẹp, Compaction hoặc phản chiếu bản ghi hội thoại hợp lệ cạnh tranh lâu hơn trên máy chậm. `session.writeLock.staleMs` kiểm soát khi nào một khóa hiện có có thể được thu hồi vì đã cũ; mặc định là `1800000` ms. `session.writeLock.maxHoldMs` kiểm soát ngưỡng nhả watchdog trong tiến trình; mặc định là `300000` ms. Các ghi đè env khẩn cấp là `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` và `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Thứ tự thực thi để dọn dẹp ngân sách đĩa (`mode: "enforce"`):

1. Xóa các tạo tác đã lưu trữ cũ nhất, bản ghi hội thoại mồ côi hoặc quỹ đạo mồ côi trước.
2. Nếu vẫn trên mục tiêu, loại bỏ các mục phiên cũ nhất và các tệp bản ghi hội thoại/quỹ đạo của chúng.
3. Tiếp tục cho đến khi mức sử dụng bằng hoặc thấp hơn `highWaterBytes`.

Trong `mode: "warn"`, OpenClaw báo cáo các loại bỏ tiềm năng nhưng không thay đổi kho/tệp.

Chạy bảo trì theo yêu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Phiên cron và nhật ký chạy

Các lần chạy cron cô lập cũng tạo mục phiên/bản ghi hội thoại và có các điều khiển giữ lại chuyên dụng:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy cron cô lập cũ khỏi kho phiên (`false` tắt).
- `cron.runLog.keepLines` cắt tỉa các hàng lịch sử chạy SQLite được giữ lại theo từng công việc cron (mặc định: `2000`). `cron.runLog.maxBytes` vẫn được chấp nhận cho nhật ký chạy dựa trên tệp cũ hơn.

Khi cron buộc tạo một phiên chạy cô lập mới, nó làm sạch mục phiên `cron:<jobId>` trước đó trước khi ghi hàng mới. Nó mang theo các tùy chọn ưu tiên an toàn như cài đặt suy nghĩ/nhanh/chi tiết, nhãn và các ghi đè mô hình/xác thực do người dùng chọn rõ ràng. Nó bỏ ngữ cảnh hội thoại xung quanh như định tuyến kênh/nhóm, chính sách gửi hoặc hàng đợi, nâng quyền, nguồn gốc và ràng buộc runtime ACP để một lần chạy cô lập mới không thể kế thừa quyền phân phối hoặc runtime đã cũ từ một lần chạy cũ hơn.

---

## Khóa phiên (`sessionKey`)

Một `sessionKey` xác định _bạn đang ở vùng chứa hội thoại nào_ (định tuyến + cô lập).

Các mẫu phổ biến:

- Chat chính/trực tiếp (theo tác tử): `agent:<agentId>:<mainKey>` (mặc định `main`)
- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Phòng/kênh (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (trừ khi bị ghi đè)

Các quy tắc chuẩn được ghi lại tại [/concepts/session](/vi/concepts/session).

---

## ID phiên (`sessionId`)

Mỗi `sessionKey` trỏ tới một `sessionId` hiện tại (tệp bản ghi hội thoại tiếp tục cuộc trò chuyện).

Quy tắc kinh nghiệm:

- **Đặt lại** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Đặt lại hằng ngày** (mặc định 4:00 sáng giờ địa phương trên máy chủ gateway) tạo một `sessionId` mới ở tin nhắn tiếp theo sau ranh giới đặt lại.
- **Hết hạn do nhàn rỗi** (`session.reset.idleMinutes` hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi tin nhắn đến sau cửa sổ nhàn rỗi. Khi cả hằng ngày + nhàn rỗi đều được cấu hình, cái nào hết hạn trước sẽ thắng.
- **Tiếp tục sau khi Control UI kết nối lại** có thể giữ phiên hiện đang hiển thị cho một lần gửi sau kết nối lại khi Gateway nhận `sessionId` khớp từ một client giao diện người vận hành. Các lần gửi cũ thông thường vẫn tạo một `sessionId` mới.
- **Sự kiện hệ thống** (heartbeat, đánh thức cron, thông báo exec, ghi sổ Gateway) có thể thay đổi hàng phiên nhưng không kéo dài độ mới đặt lại hằng ngày/nhàn rỗi. Chuyển phiên đặt lại loại bỏ các thông báo sự kiện hệ thống đang xếp hàng cho phiên trước trước khi prompt mới được dựng.
- **Chính sách fork cha** dùng nhánh đang hoạt động của OpenClaw khi tạo một luồng hoặc fork tác tử con. Nếu nhánh đó quá lớn, OpenClaw bắt đầu tác tử con với ngữ cảnh cô lập thay vì thất bại hoặc kế thừa lịch sử không dùng được. Chính sách định cỡ là tự động; cấu hình cũ `session.parentForkMaxTokens` được `openclaw doctor --fix` xóa.

Chi tiết triển khai: quyết định diễn ra trong `initSessionState()` trong `src/auto-reply/reply/session.ts`.

---

## Sơ đồ kho phiên (`sessions.json`)

Kiểu giá trị của kho là `SessionEntry` trong `src/config/sessions.ts`.

Các trường chính (không đầy đủ):

- `sessionId`: id bản ghi hiện tại (tên tệp được suy ra từ giá trị này trừ khi đặt `sessionFile`)
- `sessionStartedAt`: dấu thời gian bắt đầu cho `sessionId` hiện tại; độ mới khi đặt lại hằng ngày
  dùng giá trị này. Các hàng cũ có thể suy ra giá trị này từ phần đầu phiên JSONL.
- `lastInteractionAt`: dấu thời gian tương tác thực gần nhất của người dùng/kênh; độ mới khi đặt lại
  do nhàn rỗi dùng giá trị này để Heartbeat, Cron và sự kiện exec không giữ phiên
  còn sống. Các hàng cũ không có trường này sẽ dùng thời điểm bắt đầu phiên đã khôi phục
  làm dự phòng cho độ mới khi nhàn rỗi.
- `updatedAt`: dấu thời gian đột biến hàng lưu trữ gần nhất, dùng cho liệt kê, cắt tỉa và
  sổ sách. Đây không phải là nguồn thẩm quyền cho độ mới đặt lại hằng ngày/nhàn rỗi.
- `archivedAt`: dấu thời gian lưu trữ tùy chọn. Các phiên đã lưu trữ vẫn ở trong kho
  với bản ghi nguyên vẹn và bị loại khỏi danh sách hoạt động thông thường.
- `pinnedAt`: dấu thời gian ghim tùy chọn. Các phiên đang hoạt động đã ghim được sắp xếp trước
  các phiên chưa ghim; lưu trữ một phiên sẽ xóa ghim của phiên đó.
- Tương tác liên thông luồng Codex: cả hai trường đều theo hình dạng quản lý luồng Codex —
  các boolean `archived`/`pinned` trên dây luôn được suy ra từ
  dấu thời gian và được đóng dấu phía máy chủ, khớp với ngữ nghĩa Codex `threads.archived_at`
  và tuần tự hóa camelCase. Dấu thời gian OpenClaw là mili giây epoch
  còn Codex dùng giây epoch, vì vậy các cầu nối chuyển đổi tại ranh giới plugin codex.
  Codex chưa có API ghim (`thread/archive`/`thread/unarchive`
  בלבד); trạng thái đã ghim vẫn ở phía OpenClaw cho đến khi có API đó, lúc đó
  hình dạng khớp sẽ cho phép các phiên đã liên kết khứ hồi trạng thái ghim một cách cơ học.
- `sessionFile`: ghi đè đường dẫn bản ghi rõ ràng tùy chọn
- `chatType`: `direct | group | room` (giúp UI và chính sách gửi)
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu để gắn nhãn nhóm/kênh
- Công tắc:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (ghi đè theo từng phiên)
- Chọn mô hình:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (nỗ lực tối đa / phụ thuộc nhà cung cấp):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần auto-compaction hoàn tất cho khóa phiên này
- `memoryFlushAt`: dấu thời gian cho lần xả bộ nhớ trước Compaction gần nhất
- `memoryFlushCompactionCount`: số đếm Compaction khi lần xả gần nhất chạy

Kho lưu trữ có thể chỉnh sửa an toàn, nhưng Gateway là nguồn thẩm quyền: nó có thể ghi lại hoặc tái hydrat hóa các mục khi phiên chạy.

---

## Cấu trúc bản ghi (`*.jsonl`)

Bản ghi được quản lý bởi `SessionManager` của `openclaw/plugin-sdk/agent-sessions`.

Tệp là JSONL:

- Dòng đầu tiên: phần đầu phiên (`type: "session"`, bao gồm `id`, `cwd`, `timestamp`, `parentSession` tùy chọn)
- Sau đó: các mục phiên với `id` + `parentId` (cây)

Các kiểu mục đáng chú ý:

- `message`: tin nhắn người dùng/assistant/toolResult
- `custom_message`: tin nhắn do tiện ích mở rộng chèn vào và _có_ đi vào ngữ cảnh mô hình (có thể ẩn khỏi UI)
- `custom`: trạng thái tiện ích mở rộng _không_ đi vào ngữ cảnh mô hình
- `compaction`: bản tóm tắt Compaction đã lưu với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: bản tóm tắt đã lưu khi điều hướng một nhánh cây

OpenClaw cố ý **không** "sửa lại" bản ghi; Gateway dùng `SessionManager` để đọc/ghi chúng.

---

## Cửa sổ ngữ cảnh so với token được theo dõi

Có hai khái niệm khác nhau cần lưu ý:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng theo từng mô hình (token hiển thị với mô hình)
2. **Bộ đếm kho phiên**: thống kê cuộn được ghi vào `sessions.json` (dùng cho /status và bảng điều khiển)

Nếu bạn đang tinh chỉnh giới hạn:

- Cửa sổ ngữ cảnh đến từ danh mục mô hình (và có thể được ghi đè qua cấu hình).
- `contextTokens` trong kho là giá trị ước tính/báo cáo lúc chạy; đừng xem nó như một bảo đảm nghiêm ngặt.

Để biết thêm, xem [/token-use](/vi/reference/token-use).

---

## Compaction: nó là gì

Compaction tóm tắt cuộc hội thoại cũ hơn thành một mục `compaction` được lưu trong bản ghi và giữ nguyên các tin nhắn gần đây.

Sau Compaction, các lượt sau sẽ thấy:

- Bản tóm tắt Compaction
- Tin nhắn sau `firstKeptEntryId`

Việc chèn lại mục AGENTS.md sau Compaction là tùy chọn qua
`agents.defaults.compaction.postCompactionSections`; khi chưa đặt hoặc là `[]`,
OpenClaw không nối các đoạn trích AGENTS.md lên trên bản tóm tắt Compaction.

Compaction là **bền vững** (khác với cắt tỉa phiên). Xem [/concepts/session-pruning](/vi/concepts/session-pruning).

## Ranh giới khúc Compaction và ghép cặp công cụ

Khi OpenClaw tách một bản ghi dài thành các khúc Compaction, nó giữ
các lệnh gọi công cụ của assistant được ghép với các mục `toolResult` tương ứng.

- Nếu điểm tách theo tỷ lệ token rơi vào giữa một lệnh gọi công cụ và kết quả của nó, OpenClaw
  dịch ranh giới về tin nhắn lệnh gọi công cụ của assistant thay vì tách
  cặp đó.
- Nếu một khối kết quả công cụ ở cuối nếu giữ nguyên sẽ đẩy khúc vượt quá mục tiêu,
  OpenClaw bảo toàn khối công cụ đang chờ đó và giữ nguyên phần đuôi chưa tóm tắt.
- Các khối lệnh gọi công cụ bị hủy/lỗi không giữ mở một điểm tách đang chờ.

---

## Khi auto-compaction xảy ra (runtime OpenClaw)

Trong tác tử OpenClaw nhúng, auto-compaction kích hoạt trong hai trường hợp:

1. **Khôi phục tràn**: mô hình trả về lỗi tràn ngữ cảnh
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, và các biến thể tương tự theo hình dạng nhà cung cấp) → compact → thử lại.
   Khi nhà cung cấp báo số token đã thử, OpenClaw chuyển tiếp
   số lượng quan sát được đó vào Compaction khôi phục tràn. Nếu nhà cung cấp xác nhận
   tràn nhưng không hiển thị số lượng có thể phân tích cú pháp, OpenClaw truyền một số lượng tổng hợp
   tối thiểu vượt ngân sách cho các engine Compaction và chẩn đoán.
   Nếu khôi phục tràn vẫn thất bại, OpenClaw hiển thị hướng dẫn rõ ràng cho
   người dùng và giữ nguyên ánh xạ phiên hiện tại thay vì âm thầm xoay
   khóa phiên sang một id phiên mới. Bước tiếp theo do người vận hành kiểm soát:
   thử lại tin nhắn, chạy `/compact`, hoặc chạy `/new` khi muốn một phiên mới.
2. **Bảo trì ngưỡng**: sau một lượt thành công, khi:

`contextTokens > contextWindow - reserveTokens`

Trong đó:

- `contextWindow` là cửa sổ ngữ cảnh của mô hình
- `reserveTokens` là khoảng dự phòng dành cho prompt + đầu ra mô hình tiếp theo

Đây là ngữ nghĩa runtime OpenClaw.

OpenClaw cũng có thể kích hoạt Compaction cục bộ kiểm tra trước trước khi mở
lần chạy tiếp theo khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt và
tệp bản ghi đang hoạt động đạt kích thước đó. Đây là cơ chế bảo vệ kích thước tệp cho
chi phí mở lại cục bộ, không phải lưu trữ thô: OpenClaw vẫn chạy Compaction ngữ nghĩa bình thường,
và nó yêu cầu `truncateAfterCompaction` để bản tóm tắt đã compact có thể trở thành
bản ghi kế nhiệm mới.

Đối với các lần chạy OpenClaw nhúng, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
thêm một cơ chế bảo vệ vòng lặp công cụ tùy chọn. Sau khi kết quả công cụ được nối thêm và trước
lệnh gọi mô hình tiếp theo, OpenClaw ước tính áp lực prompt bằng cùng logic ngân sách kiểm tra trước
được dùng ở đầu lượt. Nếu ngữ cảnh không còn vừa, cơ chế bảo vệ
không compact bên trong hook `transformContext` của runtime OpenClaw. Nó phát tín hiệu kiểm tra trước
giữa lượt có cấu trúc, dừng lần gửi prompt hiện tại và để
vòng lặp chạy bên ngoài dùng đường dẫn khôi phục hiện có: cắt bớt kết quả công cụ quá khổ
khi như vậy là đủ, hoặc kích hoạt chế độ Compaction đã cấu hình và thử lại. Tùy chọn
bị tắt theo mặc định và hoạt động với cả chế độ Compaction `default` và `safeguard`,
bao gồm Compaction safeguard do nhà cung cấp hậu thuẫn.
Điều này độc lập với `maxActiveTranscriptBytes`: cơ chế bảo vệ kích thước byte chạy
trước khi một lượt mở ra, còn kiểm tra trước giữa lượt chạy sau đó trong vòng lặp công cụ OpenClaw nhúng
sau khi kết quả công cụ mới đã được nối thêm.

---

## Cài đặt Compaction (`reserveTokens`, `keepRecentTokens`)

Cài đặt Compaction của runtime OpenClaw nằm trong cài đặt tác tử:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw cũng áp dụng một mức sàn an toàn cho các lần chạy nhúng:

- Nếu `compaction.reserveTokens < reserveTokensFloor`, OpenClaw nâng giá trị đó lên.
- Mức sàn mặc định là `20000` token.
- Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để tắt mức sàn.
- Nếu giá trị đã cao hơn, OpenClaw giữ nguyên.
- `/compact` thủ công tôn trọng `agents.defaults.compaction.keepRecentTokens`
  rõ ràng và giữ điểm cắt phần đuôi gần đây của runtime OpenClaw. Nếu không có ngân sách giữ lại rõ ràng,
  Compaction thủ công vẫn là một checkpoint cứng và ngữ cảnh dựng lại bắt đầu từ
  bản tóm tắt mới.
- Đặt `agents.defaults.compaction.midTurnPrecheck.enabled: true` để chạy
  kiểm tra trước vòng lặp công cụ tùy chọn sau kết quả công cụ mới và trước lệnh gọi
  mô hình tiếp theo. Đây chỉ là bộ kích hoạt; việc tạo bản tóm tắt vẫn dùng đường dẫn
  Compaction đã cấu hình. Nó độc lập với `maxActiveTranscriptBytes`, vốn là
  cơ chế bảo vệ kích thước byte của bản ghi đang hoạt động ở đầu lượt.
- Đặt `agents.defaults.compaction.maxActiveTranscriptBytes` thành một giá trị byte hoặc
  chuỗi như `"20mb"` để chạy Compaction cục bộ trước một lượt khi bản ghi đang hoạt động
  trở nên lớn. Cơ chế bảo vệ này chỉ hoạt động khi
  `truncateAfterCompaction` cũng được bật. Để trống hoặc đặt `0` để
  tắt.
- Khi `agents.defaults.compaction.truncateAfterCompaction` được bật,
  OpenClaw xoay bản ghi đang hoạt động sang một JSONL kế nhiệm đã compact sau
  Compaction. Các hành động checkpoint nhánh/khôi phục dùng kế nhiệm đã compact đó;
  các tệp checkpoint cũ trước Compaction vẫn đọc được khi còn được tham chiếu.

Lý do: chừa đủ khoảng dự phòng cho công việc "dọn dẹp" nhiều lượt (như ghi bộ nhớ) trước khi Compaction trở nên không tránh khỏi.

Triển khai: `applyAgentCompactionSettingsFromConfig()` trong `src/agents/agent-settings.ts`
(được gọi từ các đường dẫn lượt embedded-runner và thiết lập Compaction).

---

## Nhà cung cấp Compaction có thể cắm được

Plugin có thể đăng ký một nhà cung cấp Compaction qua `registerCompactionProvider()` trên API plugin. Khi `agents.defaults.compaction.provider` được đặt thành id nhà cung cấp đã đăng ký, tiện ích mở rộng safeguard ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì pipeline `summarizeInStages` tích hợp.

- `provider`: id của một Plugin nhà cung cấp Compaction đã đăng ký. Để trống để dùng tóm tắt LLM mặc định.
- Đặt `provider` sẽ buộc `mode: "safeguard"`.
- Nhà cung cấp nhận cùng chỉ dẫn Compaction và chính sách bảo toàn định danh như đường dẫn tích hợp.
- Safeguard vẫn bảo toàn ngữ cảnh hậu tố lượt gần đây và lượt bị tách sau đầu ra của nhà cung cấp.
- Tóm tắt safeguard tích hợp tái chưng cất các bản tóm tắt trước đó với tin nhắn mới
  thay vì giữ nguyên văn toàn bộ bản tóm tắt trước đó.
- Chế độ safeguard bật kiểm toán chất lượng bản tóm tắt theo mặc định; đặt
  `qualityGuard.enabled: false` để bỏ qua hành vi thử lại khi đầu ra không đúng định dạng.
- Nếu nhà cung cấp thất bại hoặc trả về kết quả rỗng, OpenClaw tự động quay về tóm tắt LLM tích hợp.
- Tín hiệu hủy/hết thời gian được ném lại (không bị nuốt) để tôn trọng việc hủy của bên gọi.

Nguồn: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Bề mặt hiển thị với người dùng

Bạn có thể quan sát Compaction và trạng thái phiên qua:

- `/status` (trong bất kỳ phiên chat nào)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Nhật ký Gateway (`pnpm gateway:watch` hoặc `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Chế độ chi tiết: `🧹 Auto-compaction complete` + số đếm Compaction

---

## Dọn dẹp âm thầm (`NO_REPLY`)

OpenClaw hỗ trợ các lượt "im lặng" cho tác vụ nền khi người dùng không nên thấy đầu ra trung gian.

Quy ước:

- Trợ lý bắt đầu đầu ra bằng mã thông báo im lặng chính xác `NO_REPLY` /
  `no_reply` để biểu thị "không gửi phản hồi cho người dùng".
- OpenClaw loại bỏ/chặn mã này ở lớp phân phối.
- Việc chặn mã thông báo im lặng chính xác không phân biệt chữ hoa/thường, nên `NO_REPLY` và
  `no_reply` đều được tính khi toàn bộ payload chỉ là mã thông báo im lặng.
- Cơ chế này chỉ dành cho các lượt chạy nền/thực sự không phân phối; đây không phải là lối tắt cho
  các yêu cầu người dùng thông thường có thể hành động.

Kể từ `2026.1.10`, OpenClaw cũng chặn **phát trực tuyến bản nháp/đang nhập** khi một
phần chunk bắt đầu bằng `NO_REPLY`, để các thao tác im lặng không rò rỉ đầu ra từng phần
giữa lượt.

---

## "Xả bộ nhớ" trước Compaction (đã triển khai)

Mục tiêu: trước khi auto-Compaction xảy ra, chạy một lượt agentic im lặng để ghi trạng thái
bền vững vào ổ đĩa (ví dụ `memory/YYYY-MM-DD.md` trong workspace của agent) để Compaction không thể
xóa ngữ cảnh quan trọng.

OpenClaw sử dụng cách tiếp cận **xả trước ngưỡng**:

1. Theo dõi mức sử dụng ngữ cảnh của phiên.
2. Khi vượt qua một "ngưỡng mềm" (thấp hơn ngưỡng Compaction của runtime OpenClaw), chạy một chỉ thị im lặng
   "ghi bộ nhớ ngay" cho agent.
3. Sử dụng mã thông báo im lặng chính xác `NO_REPLY` / `no_reply` để người dùng
   không thấy gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`):

- `enabled` (mặc định: `true`)
- `model` (ghi đè provider/model chính xác tùy chọn cho lượt xả, ví dụ `ollama/qwen3:8b`)
- `softThresholdTokens` (mặc định: `4000`)
- `prompt` (thông điệp người dùng cho lượt xả)
- `systemPrompt` (system prompt bổ sung được nối thêm cho lượt xả)

Ghi chú:

- Prompt/system prompt mặc định bao gồm gợi ý `NO_REPLY` để chặn
  phân phối.
- Khi đặt `model`, lượt xả sử dụng model đó mà không kế thừa chuỗi fallback của phiên
  đang hoạt động, để các tác vụ dọn dẹp chỉ chạy cục bộ không âm thầm
  fallback sang model hội thoại trả phí.
- Lượt xả chạy một lần cho mỗi chu kỳ Compaction (được theo dõi trong `sessions.json`).
- Lượt xả chỉ chạy cho các phiên OpenClaw nhúng (các backend CLI bỏ qua).
- Lượt xả bị bỏ qua khi workspace của phiên ở chế độ chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Bộ nhớ](/vi/concepts/memory) để biết bố cục tệp workspace và các mẫu ghi.

OpenClaw cũng cung cấp hook `session_before_compact` trong API extension, nhưng logic
xả của OpenClaw hiện nằm ở phía Gateway.

---

## Danh sách kiểm tra khắc phục sự cố

- Khóa phiên sai? Bắt đầu với [/concepts/session](/vi/concepts/session) và xác nhận `sessionKey` trong `/status`.
- Store và transcript không khớp? Xác nhận host Gateway và đường dẫn store từ `openclaw status`.
- Compaction spam? Kiểm tra:
  - cửa sổ ngữ cảnh của model (quá nhỏ)
  - cài đặt Compaction (`reserveTokens` quá cao so với cửa sổ model có thể gây Compaction sớm hơn)
  - tool-result phình to: bật/tinh chỉnh cắt tỉa phiên
- Lượt im lặng bị rò rỉ? Xác nhận phản hồi bắt đầu bằng `NO_REPLY` (mã chính xác không phân biệt chữ hoa/thường) và bạn đang dùng bản build có bản sửa chặn streaming.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
