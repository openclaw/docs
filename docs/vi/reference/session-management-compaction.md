---
read_when:
    - Bạn cần gỡ lỗi ID phiên, JSONL bản ghi hội thoại hoặc các trường sessions.json
    - Bạn đang thay đổi hành vi tự động Compaction hoặc thêm công việc bảo trì “trước Compaction”
    - Bạn muốn triển khai các lần xả bộ nhớ hoặc các lượt hệ thống im lặng
summary: 'Chuyên sâu: kho phiên + bản ghi hội thoại, vòng đời và nội bộ của Compaction (tự động)'
title: Tìm hiểu chuyên sâu về quản lý phiên
x-i18n:
    generated_at: "2026-05-11T20:36:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw quản lý phiên từ đầu đến cuối trên các khu vực sau:

- **Định tuyến phiên** (cách thông điệp đến được ánh xạ tới `sessionKey`)
- **Kho phiên** (`sessions.json`) và những gì nó theo dõi
- **Lưu bền vững bản ghi hội thoại** (`*.jsonl`) và cấu trúc của nó
- **Vệ sinh bản ghi hội thoại** (các chỉnh sửa theo từng provider trước khi chạy)
- **Giới hạn ngữ cảnh** (cửa sổ ngữ cảnh so với token được theo dõi)
- **Compaction** (Compaction thủ công và tự động) và nơi hook công việc trước Compaction
- **Dọn dẹp im lặng** (các lần ghi bộ nhớ không nên tạo đầu ra hiển thị cho người dùng)

Nếu bạn muốn xem tổng quan cấp cao hơn trước, hãy bắt đầu với:

- [Quản lý phiên](/vi/concepts/session)
- [Compaction](/vi/concepts/compaction)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Vệ sinh bản ghi hội thoại](/vi/reference/transcript-hygiene)

---

## Nguồn chân lý: Gateway

OpenClaw được thiết kế xoay quanh một **tiến trình Gateway duy nhất** sở hữu trạng thái phiên.

- UI (ứng dụng macOS, Control UI trên web, TUI) nên truy vấn Gateway để lấy danh sách phiên và số token.
- Ở chế độ từ xa, các tệp phiên nằm trên máy chủ từ xa; "kiểm tra các tệp Mac cục bộ của bạn" sẽ không phản ánh những gì Gateway đang dùng.

---

## Hai lớp lưu bền vững

OpenClaw lưu bền vững phiên trong hai lớp:

1. **Kho phiên (`sessions.json`)**
   - Bản đồ khóa/giá trị: `sessionKey -> SessionEntry`
   - Nhỏ, có thể thay đổi, an toàn để chỉnh sửa (hoặc xóa mục)
   - Theo dõi siêu dữ liệu phiên (id phiên hiện tại, hoạt động gần nhất, các công tắc, bộ đếm token, v.v.)

2. **Bản ghi hội thoại (`<sessionId>.jsonl`)**
   - Bản ghi hội thoại chỉ ghi nối thêm với cấu trúc cây (các mục có `id` + `parentId`)
   - Lưu cuộc hội thoại thực tế + lời gọi công cụ + tóm tắt Compaction
   - Dùng để dựng lại ngữ cảnh mô hình cho các lượt sau
   - Các checkpoint gỡ lỗi lớn trước Compaction được bỏ qua khi bản ghi hội thoại đang hoạt động
     vượt quá giới hạn kích thước checkpoint, tránh tạo thêm một bản sao
     `.checkpoint.*.jsonl` khổng lồ thứ hai.

Các trình đọc lịch sử Gateway nên tránh vật chất hóa toàn bộ bản ghi hội thoại trừ khi
bề mặt đó cần truy cập lịch sử tùy ý một cách rõ ràng. Lịch sử trang đầu,
lịch sử chat nhúng, khôi phục sau khi khởi động lại, và kiểm tra token/mức sử dụng dùng các lần đọc phần đuôi có giới hạn.
Quét toàn bộ bản ghi hội thoại đi qua chỉ mục bản ghi hội thoại bất đồng bộ, được
lưu vào bộ nhớ đệm theo đường dẫn tệp cùng `mtimeMs`/`size` và được chia sẻ giữa các trình đọc đồng thời.

---

## Vị trí trên đĩa

Theo từng agent, trên máy chủ Gateway:

- Kho: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Bản ghi hội thoại: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Phiên chủ đề Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw phân giải các vị trí này qua `src/config/sessions.ts`.

---

## Bảo trì kho và kiểm soát đĩa

Lưu bền vững phiên có các điều khiển bảo trì tự động (`session.maintenance`) cho `sessions.json`, artifact bản ghi hội thoại, và trajectory sidecar:

- `mode`: `warn` (mặc định) hoặc `enforce`
- `pruneAfter`: ngưỡng tuổi mục cũ (mặc định `30d`)
- `maxEntries`: giới hạn số mục trong `sessions.json` (mặc định `500`)
- `resetArchiveRetention`: thời gian lưu trữ cho archive bản ghi hội thoại `*.reset.<timestamp>` (mặc định: giống `pruneAfter`; `false` tắt dọn dẹp)
- `maxDiskBytes`: ngân sách thư mục phiên tùy chọn
- `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp (mặc định `80%` của `maxDiskBytes`)

Các lần ghi Gateway bình thường đi qua một trình ghi phiên theo từng kho, tuần tự hóa các thay đổi trong tiến trình mà không lấy khóa tệp runtime. Các helper vá trên đường nóng mượn bộ nhớ đệm có thể thay đổi đã xác thực trong khi giữ slot trình ghi đó, nên các tệp `sessions.json` lớn không bị clone hoặc đọc lại cho mỗi lần cập nhật siêu dữ liệu. Mã runtime nên ưu tiên `updateSessionStore(...)` hoặc `updateSessionStoreEntry(...)`; lưu toàn bộ kho trực tiếp là công cụ tương thích và bảo trì ngoại tuyến. Khi có thể truy cập Gateway, `openclaw sessions cleanup` không phải dry-run và `openclaw agents delete` ủy quyền các thay đổi kho cho Gateway để việc dọn dẹp tham gia cùng hàng đợi trình ghi; `--store <path>` là đường sửa chữa ngoại tuyến rõ ràng cho bảo trì tệp trực tiếp. Dọn dẹp `maxEntries` vẫn được gom lô cho các giới hạn quy mô production, nên kho có thể tạm thời vượt quá giới hạn đã cấu hình trước khi lần dọn dẹp high-water tiếp theo ghi lại để hạ xuống. Các lần đọc kho phiên không cắt tỉa hoặc giới hạn mục trong lúc Gateway khởi động; hãy dùng các lần ghi hoặc `openclaw sessions cleanup --enforce` để dọn dẹp. `openclaw sessions cleanup --enforce` vẫn áp dụng giới hạn đã cấu hình ngay lập tức và cắt tỉa các artifact bản ghi hội thoại, checkpoint, và trajectory cũ không được tham chiếu ngay cả khi không cấu hình ngân sách đĩa.

Bảo trì giữ lại các con trỏ hội thoại bên ngoài bền vững như phiên nhóm
và phiên chat theo phạm vi luồng, nhưng các mục runtime tổng hợp cho cron, hook,
heartbeat, ACP, và sub-agent vẫn có thể bị xóa khi chúng vượt quá
ngân sách tuổi, số lượng, hoặc đĩa đã cấu hình.

OpenClaw không còn tạo các bản sao lưu xoay vòng `sessions.json.bak.*` tự động trong khi Gateway ghi. Khóa `session.maintenance.rotateBytes` cũ bị bỏ qua và `openclaw doctor --fix` xóa nó khỏi các cấu hình cũ hơn.

Các thay đổi bản ghi hội thoại dùng khóa ghi phiên trên tệp bản ghi hội thoại. Việc lấy khóa chờ tối đa
`session.writeLock.acquireTimeoutMs` trước khi hiển thị lỗi phiên đang bận; mặc định là `60000`
ms. Chỉ tăng giá trị này khi công việc chuẩn bị, dọn dẹp, Compaction, hoặc mirror bản ghi hội thoại hợp lệ tranh chấp
lâu hơn trên các máy chậm. Phát hiện khóa cũ và cảnh báo thời gian giữ tối đa vẫn là các chính sách riêng biệt.

Thứ tự thực thi khi dọn dẹp ngân sách đĩa (`mode: "enforce"`):

1. Trước tiên xóa các artifact archive, bản ghi hội thoại mồ côi, hoặc trajectory mồ côi cũ nhất.
2. Nếu vẫn vượt mục tiêu, loại bỏ các mục phiên cũ nhất và tệp bản ghi hội thoại/trajectory của chúng.
3. Tiếp tục cho đến khi mức sử dụng bằng hoặc thấp hơn `highWaterBytes`.

Ở `mode: "warn"`, OpenClaw báo cáo các loại bỏ tiềm năng nhưng không thay đổi kho/tệp.

Chạy bảo trì theo yêu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Phiên Cron và nhật ký chạy

Các lần chạy cron biệt lập cũng tạo mục phiên/bản ghi hội thoại, và chúng có các điều khiển lưu giữ riêng:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy cron biệt lập cũ khỏi kho phiên (`false` tắt).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` cắt tỉa các tệp `~/.openclaw/cron/runs/<jobId>.jsonl` (mặc định: `2_000_000` byte và `2000` dòng).

Khi cron buộc tạo một phiên chạy biệt lập mới, nó làm sạch mục phiên
`cron:<jobId>` trước đó trước khi ghi hàng mới. Nó mang theo các tùy chọn an toàn
như cài đặt thinking/fast/verbose, nhãn, và các ghi đè model/auth do người dùng
chọn rõ ràng. Nó loại bỏ ngữ cảnh hội thoại xung quanh như định tuyến channel/group,
chính sách gửi hoặc xếp hàng, elevation, nguồn gốc, và binding runtime ACP
để một lần chạy biệt lập mới không thể kế thừa trạng thái gửi cũ hoặc
quyền runtime từ lần chạy cũ hơn.

---

## Khóa phiên (`sessionKey`)

`sessionKey` xác định _bạn đang ở trong nhóm hội thoại nào_ (định tuyến + cô lập).

Các mẫu phổ biến:

- Chat chính/trực tiếp (theo agent): `agent:<agentId>:<mainKey>` (mặc định `main`)
- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Phòng/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (trừ khi được ghi đè)

Các quy tắc chuẩn được ghi tại [/concepts/session](/vi/concepts/session).

---

## ID phiên (`sessionId`)

Mỗi `sessionKey` trỏ tới một `sessionId` hiện tại (tệp bản ghi hội thoại tiếp tục cuộc hội thoại).

Quy tắc thực hành:

- **Reset** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Reset hằng ngày** (mặc định 4:00 AM giờ địa phương trên máy chủ gateway) tạo một `sessionId` mới ở thông điệp tiếp theo sau ranh giới reset.
- **Hết hạn do không hoạt động** (`session.reset.idleMinutes` hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi có thông điệp đến sau cửa sổ không hoạt động. Khi cả hằng ngày + không hoạt động đều được cấu hình, cái nào hết hạn trước sẽ thắng.
- **Sự kiện hệ thống** (heartbeat, đánh thức cron, thông báo exec, ghi sổ gateway) có thể thay đổi hàng phiên nhưng không kéo dài độ mới của reset hằng ngày/không hoạt động. Rollover reset loại bỏ các thông báo sự kiện hệ thống đã xếp hàng cho phiên trước trước khi prompt mới được dựng.
- **Chính sách fork cha** dùng nhánh đang hoạt động của PI khi tạo luồng hoặc fork subagent. Nếu nhánh đó quá lớn, OpenClaw khởi động con với ngữ cảnh biệt lập thay vì thất bại hoặc kế thừa lịch sử không dùng được. Chính sách định cỡ là tự động; cấu hình `session.parentForkMaxTokens` cũ bị `openclaw doctor --fix` xóa.

Chi tiết triển khai: quyết định diễn ra trong `initSessionState()` ở `src/auto-reply/reply/session.ts`.

---

## Schema kho phiên (`sessions.json`)

Kiểu giá trị của kho là `SessionEntry` trong `src/config/sessions.ts`.

Các trường chính (không đầy đủ):

- `sessionId`: id bản ghi hội thoại hiện tại (tên tệp được suy ra từ đây trừ khi `sessionFile` được đặt)
- `sessionStartedAt`: timestamp bắt đầu cho `sessionId` hiện tại; độ mới của reset hằng ngày
  dùng trường này. Các hàng cũ có thể suy ra nó từ header phiên JSONL.
- `lastInteractionAt`: timestamp tương tác người dùng/channel thực gần nhất; độ mới của reset không hoạt động
  dùng trường này để heartbeat, cron, và sự kiện exec không giữ phiên
  còn sống. Các hàng cũ không có trường này fallback về thời gian bắt đầu phiên đã khôi phục
  cho độ mới không hoạt động.
- `updatedAt`: timestamp thay đổi hàng kho gần nhất, dùng cho liệt kê, cắt tỉa, và
  ghi sổ. Nó không phải nguồn thẩm quyền cho độ mới của reset hằng ngày/không hoạt động.
- `sessionFile`: ghi đè đường dẫn bản ghi hội thoại rõ ràng tùy chọn
- `chatType`: `direct | group | room` (giúp UI và chính sách gửi)
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu để gắn nhãn group/channel
- Công tắc:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (ghi đè theo phiên)
- Chọn mô hình:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (best-effort / phụ thuộc provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần auto-compaction hoàn tất cho khóa phiên này
- `memoryFlushAt`: timestamp cho lần flush bộ nhớ trước Compaction gần nhất
- `memoryFlushCompactionCount`: số Compaction khi lần flush gần nhất chạy

Kho an toàn để chỉnh sửa, nhưng Gateway là nguồn thẩm quyền: nó có thể ghi lại hoặc tái hydrat hóa các mục khi phiên chạy.

---

## Cấu trúc bản ghi hội thoại (`*.jsonl`)

Bản ghi hội thoại được quản lý bởi `SessionManager` của `@earendil-works/pi-coding-agent`.

Tệp là JSONL:

- Dòng đầu tiên: header phiên (`type: "session"`, bao gồm `id`, `cwd`, `timestamp`, `parentSession` tùy chọn)
- Sau đó: các mục phiên với `id` + `parentId` (cây)

Các kiểu mục đáng chú ý:

- `message`: thông điệp user/assistant/toolResult
- `custom_message`: thông điệp do extension chèn vào _có_ đi vào ngữ cảnh mô hình (có thể bị ẩn khỏi UI)
- `custom`: trạng thái extension _không_ đi vào ngữ cảnh mô hình
- `compaction`: tóm tắt Compaction đã lưu bền vững với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: tóm tắt đã lưu bền vững khi điều hướng một nhánh cây

OpenClaw cố ý **không** "sửa" bản ghi hội thoại; Gateway dùng `SessionManager` để đọc/ghi chúng.

---

## Cửa sổ ngữ cảnh so với token được theo dõi

Có hai khái niệm khác nhau cần quan tâm:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng theo từng mô hình (token hiển thị cho mô hình)
2. **Bộ đếm kho phiên**: thống kê cuộn được ghi vào `sessions.json` (dùng cho /status và dashboard)

Nếu bạn đang tinh chỉnh giới hạn:

- Cửa sổ ngữ cảnh đến từ catalog mô hình (và có thể được ghi đè qua cấu hình).
- `contextTokens` trong kho là giá trị ước tính/báo cáo runtime; đừng xem nó là bảo đảm nghiêm ngặt.

Để biết thêm, xem [/token-use](/vi/reference/token-use).

---

## Compaction: là gì

Compaction tóm tắt hội thoại cũ hơn vào một mục `compaction` được lưu bền vững trong bản ghi hội thoại và giữ nguyên các thông điệp gần đây.

Sau Compaction, các lượt sau sẽ thấy:

- Tóm tắt Compaction
- Các thông điệp sau `firstKeptEntryId`

Compaction là **bền vững** (khác với cắt tỉa phiên). Xem [/concepts/session-pruning](/vi/concepts/session-pruning).

## Ranh giới khối Compaction và ghép cặp công cụ

Khi OpenClaw chia một bản ghi dài thành các khối Compaction, nó giữ các lệnh gọi công cụ của assistant được ghép cặp với các mục `toolResult` tương ứng.

- Nếu điểm chia theo tỷ lệ token rơi vào giữa một lệnh gọi công cụ và kết quả của nó, OpenClaw dịch ranh giới về thông điệp lệnh gọi công cụ của assistant thay vì tách cặp đó.
- Nếu một khối kết quả công cụ ở cuối nếu không sẽ khiến khối vượt quá mục tiêu, OpenClaw giữ nguyên khối công cụ đang chờ đó và giữ phần đuôi chưa được tóm tắt nguyên vẹn.
- Các khối lệnh gọi công cụ bị hủy/lỗi không giữ một điểm chia đang chờ mở.

---

## Khi tự động Compaction xảy ra (runtime Pi)

Trong tác nhân Pi nhúng, tự động Compaction được kích hoạt trong hai trường hợp:

1. **Khôi phục tràn**: mô hình trả về lỗi tràn ngữ cảnh (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, và các biến thể tương tự theo dạng nhà cung cấp) → nén → thử lại.
2. **Bảo trì theo ngưỡng**: sau một lượt thành công, khi:

`contextTokens > contextWindow - reserveTokens`

Trong đó:

- `contextWindow` là cửa sổ ngữ cảnh của mô hình
- `reserveTokens` là khoảng trống dự phòng dành cho prompt + đầu ra mô hình tiếp theo

Đây là ngữ nghĩa runtime Pi (OpenClaw tiêu thụ các sự kiện, nhưng Pi quyết định thời điểm nén).

OpenClaw cũng có thể kích hoạt Compaction cục bộ trước khi chạy trước khi mở lượt chạy tiếp theo khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt và tệp bản ghi đang hoạt động đạt đến kích thước đó. Đây là chốt chặn kích thước tệp cho chi phí mở lại cục bộ, không phải lưu trữ thô: OpenClaw vẫn chạy Compaction ngữ nghĩa bình thường, và nó yêu cầu `truncateAfterCompaction` để bản tóm tắt đã nén có thể trở thành bản ghi kế nhiệm mới.

Đối với các lượt chạy Pi nhúng, `agents.defaults.compaction.midTurnPrecheck.enabled: true` thêm một chốt chặn vòng lặp công cụ tùy chọn. Sau khi một kết quả công cụ được thêm vào và trước lệnh gọi mô hình tiếp theo, OpenClaw ước tính áp lực prompt bằng cùng logic ngân sách trước khi chạy được dùng lúc bắt đầu lượt. Nếu ngữ cảnh không còn vừa, chốt chặn không nén bên trong hook `transformContext` của Pi. Nó phát tín hiệu kiểm tra trước giữa lượt có cấu trúc, dừng việc gửi prompt hiện tại và để vòng lặp chạy bên ngoài dùng đường khôi phục hiện có: cắt bớt kết quả công cụ quá lớn khi như vậy là đủ, hoặc kích hoạt chế độ Compaction đã cấu hình và thử lại. Tùy chọn này mặc định bị tắt và hoạt động với cả chế độ Compaction `default` và `safeguard`, bao gồm Compaction bảo vệ do nhà cung cấp hậu thuẫn.
Điều này độc lập với `maxActiveTranscriptBytes`: chốt chặn kích thước byte chạy trước khi một lượt mở ra, còn kiểm tra trước giữa lượt chạy muộn hơn trong vòng lặp công cụ Pi nhúng sau khi các kết quả công cụ mới đã được thêm vào.

---

## Thiết lập Compaction (`reserveTokens`, `keepRecentTokens`)

Thiết lập Compaction của Pi nằm trong thiết lập Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw cũng thực thi một mức sàn an toàn cho các lượt chạy nhúng:

- Nếu `compaction.reserveTokens < reserveTokensFloor`, OpenClaw tăng giá trị đó.
- Mức sàn mặc định là `20000` token.
- Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để tắt mức sàn.
- Nếu giá trị đó đã cao hơn, OpenClaw giữ nguyên.
- `/compact` thủ công tôn trọng `agents.defaults.compaction.keepRecentTokens` rõ ràng và giữ điểm cắt phần đuôi gần đây của Pi. Khi không có ngân sách giữ lại rõ ràng, Compaction thủ công vẫn là một điểm kiểm tra cứng và ngữ cảnh được dựng lại bắt đầu từ bản tóm tắt mới.
- Đặt `agents.defaults.compaction.midTurnPrecheck.enabled: true` để chạy kiểm tra trước vòng lặp công cụ tùy chọn sau các kết quả công cụ mới và trước lệnh gọi mô hình tiếp theo. Đây chỉ là một trigger; việc tạo tóm tắt vẫn dùng đường Compaction đã cấu hình. Nó độc lập với `maxActiveTranscriptBytes`, vốn là chốt chặn kích thước byte bản ghi đang hoạt động lúc bắt đầu lượt.
- Đặt `agents.defaults.compaction.maxActiveTranscriptBytes` thành một giá trị byte hoặc chuỗi như `"20mb"` để chạy Compaction cục bộ trước một lượt khi bản ghi đang hoạt động trở nên lớn. Chốt chặn này chỉ hoạt động khi `truncateAfterCompaction` cũng được bật. Để trống hoặc đặt `0` để tắt.
- Khi `agents.defaults.compaction.truncateAfterCompaction` được bật, OpenClaw xoay vòng bản ghi đang hoạt động sang một JSONL kế nhiệm đã nén sau Compaction. Bản ghi đầy đủ cũ vẫn được lưu trữ và liên kết từ điểm kiểm tra Compaction thay vì bị ghi lại tại chỗ.

Lý do: chừa đủ khoảng trống cho “dọn dẹp” nhiều lượt (như ghi bộ nhớ) trước khi Compaction trở nên không thể tránh khỏi.

Triển khai: `ensurePiCompactionReserveTokens()` trong `src/agents/pi-settings.ts`
(được gọi từ `src/agents/pi-embedded-runner.ts`).

---

## Nhà cung cấp Compaction có thể cắm vào

Plugin có thể đăng ký nhà cung cấp Compaction thông qua `registerCompactionProvider()` trên API plugin. Khi `agents.defaults.compaction.provider` được đặt thành id nhà cung cấp đã đăng ký, tiện ích mở rộng bảo vệ ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì pipeline `summarizeInStages` tích hợp sẵn.

- `provider`: id của Plugin nhà cung cấp Compaction đã đăng ký. Để trống để dùng tóm tắt LLM mặc định.
- Đặt `provider` buộc `mode: "safeguard"`.
- Nhà cung cấp nhận cùng các chỉ dẫn Compaction và chính sách bảo toàn định danh như đường tích hợp sẵn.
- Bảo vệ vẫn giữ ngữ cảnh hậu tố của lượt gần đây và lượt bị chia sau đầu ra của nhà cung cấp.
- Tóm tắt bảo vệ tích hợp sẵn chưng cất lại các bản tóm tắt trước đó với thông điệp mới thay vì giữ nguyên văn toàn bộ bản tóm tắt trước đó.
- Chế độ bảo vệ bật kiểm tra chất lượng tóm tắt theo mặc định; đặt `qualityGuard.enabled: false` để bỏ qua hành vi thử lại khi đầu ra sai định dạng.
- Nếu nhà cung cấp thất bại hoặc trả về kết quả rỗng, OpenClaw tự động quay về tóm tắt LLM tích hợp sẵn.
- Tín hiệu hủy/hết thời gian chờ được ném lại (không bị nuốt) để tôn trọng việc hủy của bên gọi.

Nguồn: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Bề mặt người dùng thấy được

Bạn có thể quan sát Compaction và trạng thái phiên qua:

- `/status` (trong bất kỳ phiên trò chuyện nào)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Nhật ký Gateway (`pnpm gateway:watch` hoặc `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Chế độ chi tiết: `🧹 Auto-compaction complete` + số lần Compaction

---

## Dọn dẹp im lặng (`NO_REPLY`)

OpenClaw hỗ trợ các lượt “im lặng” cho tác vụ nền nơi người dùng không nên thấy đầu ra trung gian.

Quy ước:

- Assistant bắt đầu đầu ra bằng token im lặng chính xác `NO_REPLY` / `no_reply` để biểu thị “không gửi phản hồi tới người dùng”.
- OpenClaw loại bỏ/ẩn điều này ở lớp phân phối.
- Việc ẩn token im lặng chính xác không phân biệt chữ hoa chữ thường, nên `NO_REPLY` và `no_reply` đều được tính khi toàn bộ payload chỉ là token im lặng.
- Điều này chỉ dành cho các lượt nền/không phân phối thực sự; nó không phải lối tắt cho các yêu cầu người dùng thông thường có thể hành động.

Kể từ `2026.1.10`, OpenClaw cũng ẩn **streaming bản nháp/đang nhập** khi một khối một phần bắt đầu bằng `NO_REPLY`, nên các thao tác im lặng không rò rỉ đầu ra một phần giữa lượt.

---

## “Xả bộ nhớ” trước Compaction (đã triển khai)

Mục tiêu: trước khi tự động Compaction xảy ra, chạy một lượt tác nhân im lặng ghi trạng thái bền vững vào đĩa (ví dụ `memory/YYYY-MM-DD.md` trong workspace của tác nhân) để Compaction không thể xóa ngữ cảnh quan trọng.

OpenClaw dùng cách tiếp cận **xả trước ngưỡng**:

1. Theo dõi mức sử dụng ngữ cảnh phiên.
2. Khi nó vượt qua một “ngưỡng mềm” (dưới ngưỡng Compaction của Pi), chạy chỉ thị “ghi bộ nhớ ngay” im lặng cho tác nhân.
3. Dùng token im lặng chính xác `NO_REPLY` / `no_reply` để người dùng không thấy gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`):

- `enabled` (mặc định: `true`)
- `model` (ghi đè nhà cung cấp/mô hình chính xác tùy chọn cho lượt xả, ví dụ `ollama/qwen3:8b`)
- `softThresholdTokens` (mặc định: `4000`)
- `prompt` (thông điệp người dùng cho lượt xả)
- `systemPrompt` (prompt hệ thống bổ sung được thêm vào cho lượt xả)

Ghi chú:

- Prompt/prompt hệ thống mặc định bao gồm gợi ý `NO_REPLY` để ẩn phân phối.
- Khi `model` được đặt, lượt xả dùng mô hình đó mà không kế thừa chuỗi fallback của phiên đang hoạt động, nên việc dọn dẹp chỉ cục bộ không âm thầm quay về mô hình trò chuyện trả phí.
- Lượt xả chạy một lần cho mỗi chu kỳ Compaction (được theo dõi trong `sessions.json`).
- Lượt xả chỉ chạy cho các phiên Pi nhúng (backend CLI bỏ qua).
- Lượt xả bị bỏ qua khi workspace phiên ở chế độ chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Memory](/vi/concepts/memory) để biết bố cục tệp workspace và các mẫu ghi.

Pi cũng cung cấp hook `session_before_compact` trong API tiện ích mở rộng, nhưng logic xả của OpenClaw hiện nằm ở phía Gateway.

---

## Danh sách kiểm tra khắc phục sự cố

- Khóa phiên sai? Bắt đầu với [/concepts/session](/vi/concepts/session) và xác nhận `sessionKey` trong `/status`.
- Kho lưu trữ và bản ghi không khớp? Xác nhận máy chủ Gateway và đường dẫn kho lưu trữ từ `openclaw status`.
- Compaction lặp quá nhiều? Kiểm tra:
  - cửa sổ ngữ cảnh mô hình (quá nhỏ)
  - thiết lập Compaction (`reserveTokens` quá cao so với cửa sổ mô hình có thể gây Compaction sớm hơn)
  - kết quả công cụ phình to: bật/tinh chỉnh cắt tỉa phiên
- Lượt im lặng bị rò rỉ? Xác nhận phản hồi bắt đầu bằng `NO_REPLY` (token chính xác không phân biệt chữ hoa chữ thường) và bạn đang dùng bản dựng có bao gồm bản sửa ẩn streaming.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
