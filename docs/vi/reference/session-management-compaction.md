---
read_when:
    - Bạn cần gỡ lỗi ID phiên, JSONL bản ghi hội thoại hoặc các trường sessions.json
    - Bạn đang thay đổi hành vi tự động Compaction hoặc thêm tác vụ dọn dẹp “trước Compaction”
    - Bạn muốn triển khai cơ chế xả bộ nhớ hoặc các lượt hệ thống im lặng
summary: 'Tìm hiểu chuyên sâu: kho lưu trữ phiên + bản ghi hội thoại, vòng đời và cơ chế nội bộ của Compaction (tự động)'
title: Tìm hiểu chuyên sâu về quản lý phiên
x-i18n:
    generated_at: "2026-05-02T20:57:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8271d7b0786e1c47a8cec6e7bd73c3c86a433d629e17937fdd87fa756ed78d73
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw quản lý các phiên từ đầu đến cuối trên các khu vực sau:

- **Định tuyến phiên** (cách thông điệp đến ánh xạ tới một `sessionKey`)
- **Kho phiên** (`sessions.json`) và những gì nó theo dõi
- **Lưu bền transcript** (`*.jsonl`) và cấu trúc của nó
- **Vệ sinh transcript** (các điều chỉnh theo từng nhà cung cấp trước khi chạy)
- **Giới hạn ngữ cảnh** (cửa sổ ngữ cảnh so với token được theo dõi)
- **Compaction** (Compaction thủ công và tự động) và nơi hook công việc trước Compaction
- **Dọn dẹp âm thầm** (ghi bộ nhớ không nên tạo đầu ra hiển thị cho người dùng)

Nếu bạn muốn xem tổng quan cấp cao trước, hãy bắt đầu với:

- [Quản lý phiên](/vi/concepts/session)
- [Compaction](/vi/concepts/compaction)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Vệ sinh transcript](/vi/reference/transcript-hygiene)

---

## Nguồn sự thật: Gateway

OpenClaw được thiết kế xoay quanh một **tiến trình Gateway** duy nhất sở hữu trạng thái phiên.

- Các UI (ứng dụng macOS, web Control UI, TUI) nên truy vấn Gateway để lấy danh sách phiên và số lượng token.
- Ở chế độ từ xa, các tệp phiên nằm trên máy chủ từ xa; “kiểm tra các tệp cục bộ trên máy Mac của bạn” sẽ không phản ánh những gì Gateway đang dùng.

---

## Hai lớp lưu bền

OpenClaw lưu bền phiên trong hai lớp:

1. **Kho phiên (`sessions.json`)**
   - Bản đồ khóa/giá trị: `sessionKey -> SessionEntry`
   - Nhỏ, có thể thay đổi, an toàn để chỉnh sửa (hoặc xóa mục)
   - Theo dõi siêu dữ liệu phiên (id phiên hiện tại, hoạt động gần nhất, công tắc, bộ đếm token, v.v.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Transcript chỉ ghi thêm với cấu trúc cây (các mục có `id` + `parentId`)
   - Lưu cuộc trò chuyện thực tế + lệnh gọi công cụ + tóm tắt Compaction
   - Được dùng để xây dựng lại ngữ cảnh mô hình cho các lượt sau
   - Các checkpoint gỡ lỗi lớn trước Compaction sẽ bị bỏ qua khi transcript
     đang hoạt động vượt quá giới hạn kích thước checkpoint, tránh tạo thêm một bản sao
     `.checkpoint.*.jsonl` khổng lồ thứ hai.

Trình đọc lịch sử Gateway nên tránh vật chất hóa toàn bộ transcript trừ khi
bề mặt đó cần truy cập lịch sử tùy ý một cách rõ ràng. Lịch sử trang đầu,
lịch sử trò chuyện nhúng, khôi phục khi khởi động lại, và kiểm tra token/mức dùng dùng các lượt đọc đuôi có giới hạn.
Các lượt quét transcript đầy đủ đi qua chỉ mục transcript bất đồng bộ, được
lưu cache theo đường dẫn tệp cộng với `mtimeMs`/`size` và được chia sẻ giữa các trình đọc đồng thời.

---

## Vị trí trên đĩa

Theo từng agent, trên máy chủ Gateway:

- Kho: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Phiên chủ đề Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw phân giải các đường dẫn này qua `src/config/sessions.ts`.

---

## Bảo trì kho và kiểm soát đĩa

Lưu bền phiên có các kiểm soát bảo trì tự động (`session.maintenance`) cho `sessions.json`, hiện vật transcript, và sidecar quỹ đạo:

- `mode`: `warn` (mặc định) hoặc `enforce`
- `pruneAfter`: ngưỡng tuổi mục cũ (mặc định `30d`)
- `maxEntries`: giới hạn số mục trong `sessions.json` (mặc định `500`)
- `resetArchiveRetention`: thời gian giữ lại cho kho lưu trữ transcript `*.reset.<timestamp>` (mặc định: giống `pruneAfter`; `false` tắt dọn dẹp)
- `maxDiskBytes`: ngân sách tùy chọn cho thư mục phiên
- `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp (mặc định `80%` của `maxDiskBytes`)

Các lượt ghi Gateway thông thường đi qua một bộ ghi phiên theo từng kho, tuần tự hóa các thay đổi trong tiến trình mà không lấy khóa tệp runtime. Các helper vá trên đường nóng mượn cache có thể thay đổi đã được xác thực trong khi giữ slot bộ ghi đó, nên các tệp `sessions.json` lớn không bị clone hoặc đọc lại cho mọi lần cập nhật siêu dữ liệu. Mã runtime nên ưu tiên `updateSessionStore(...)` hoặc `updateSessionStoreEntry(...)`; lưu toàn bộ kho trực tiếp là công cụ tương thích và bảo trì ngoại tuyến. Khi có thể truy cập Gateway, `openclaw sessions cleanup` và `openclaw agents delete` không chạy dry-run sẽ ủy nhiệm thay đổi kho cho Gateway để quá trình dọn dẹp tham gia cùng hàng đợi bộ ghi; `--store <path>` là đường dẫn sửa chữa ngoại tuyến rõ ràng cho bảo trì tệp trực tiếp. Dọn dẹp `maxEntries` vẫn được gom lô cho các giới hạn cỡ sản xuất, nên kho có thể tạm thời vượt quá giới hạn đã cấu hình trước khi lần dọn dẹp ngưỡng cao tiếp theo ghi lại để giảm xuống. Các lượt đọc kho phiên không cắt tỉa hoặc giới hạn mục trong lúc Gateway khởi động; dùng các lượt ghi hoặc `openclaw sessions cleanup --enforce` để dọn dẹp. `openclaw sessions cleanup --enforce` vẫn áp dụng giới hạn đã cấu hình ngay lập tức.

Bảo trì giữ lại các con trỏ hội thoại ngoài bền vững như phiên nhóm
và phiên trò chuyện theo thread, nhưng các mục runtime tổng hợp cho cron, hook,
Heartbeat, ACP, và sub-agent vẫn có thể bị xóa khi chúng vượt quá
tuổi, số lượng, hoặc ngân sách đĩa đã cấu hình.

OpenClaw không còn tạo các bản sao lưu xoay vòng `sessions.json.bak.*` tự động trong các lượt ghi Gateway. Khóa `session.maintenance.rotateBytes` cũ bị bỏ qua và `openclaw doctor --fix` xóa nó khỏi các cấu hình cũ.

Các thay đổi transcript dùng khóa ghi phiên trên tệp transcript. Việc lấy khóa chờ tối đa
`session.writeLock.acquireTimeoutMs` trước khi hiển thị lỗi phiên bận; mặc định là `60000`
ms. Chỉ tăng giá trị này khi công việc chuẩn bị, dọn dẹp, Compaction, hoặc phản chiếu transcript hợp lệ tranh chấp
lâu hơn trên máy chậm. Phát hiện khóa cũ và cảnh báo thời gian giữ tối đa vẫn là các chính sách riêng biệt.

Thứ tự thực thi khi dọn dẹp ngân sách đĩa (`mode: "enforce"`):

1. Xóa hiện vật lưu trữ cũ nhất, transcript mồ côi, hoặc quỹ đạo mồ côi trước.
2. Nếu vẫn cao hơn mục tiêu, loại bỏ các mục phiên cũ nhất và tệp transcript/quỹ đạo của chúng.
3. Tiếp tục cho đến khi mức dùng bằng hoặc thấp hơn `highWaterBytes`.

Trong `mode: "warn"`, OpenClaw báo cáo các lượt loại bỏ tiềm năng nhưng không thay đổi kho/tệp.

Chạy bảo trì theo yêu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Phiên Cron và nhật ký chạy

Các lần chạy cron cô lập cũng tạo mục phiên/transcript, và chúng có các kiểm soát giữ lại riêng:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy cron cô lập cũ khỏi kho phiên (`false` tắt).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` cắt tỉa các tệp `~/.openclaw/cron/runs/<jobId>.jsonl` (mặc định: `2_000_000` byte và `2000` dòng).

Khi cron buộc tạo một phiên chạy cô lập mới, nó làm sạch mục phiên
`cron:<jobId>` trước đó trước khi ghi hàng mới. Nó mang theo các tùy chọn an toàn
như thiết lập suy nghĩ/nhanh/chi tiết, nhãn, và các override mô hình/xác thực do
người dùng chọn rõ ràng. Nó bỏ ngữ cảnh hội thoại xung quanh như
định tuyến kênh/nhóm, chính sách gửi hoặc hàng đợi, nâng quyền, nguồn gốc, và ràng buộc runtime ACP
để một lần chạy cô lập mới không thể thừa hưởng quyền gửi hoặc
runtime đã cũ từ một lần chạy cũ hơn.

---

## Khóa phiên (`sessionKey`)

`sessionKey` xác định _bạn đang ở bucket hội thoại nào_ (định tuyến + cô lập).

Các mẫu phổ biến:

- Trò chuyện chính/trực tiếp (theo agent): `agent:<agentId>:<mainKey>` (mặc định `main`)
- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Phòng/kênh (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (trừ khi bị ghi đè)

Các quy tắc chuẩn được ghi lại tại [/concepts/session](/vi/concepts/session).

---

## Id phiên (`sessionId`)

Mỗi `sessionKey` trỏ tới một `sessionId` hiện tại (tệp transcript tiếp tục cuộc trò chuyện).

Quy tắc kinh nghiệm:

- **Đặt lại** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Đặt lại hằng ngày** (mặc định 4:00 sáng giờ cục bộ trên máy chủ Gateway) tạo một `sessionId` mới ở thông điệp tiếp theo sau ranh giới đặt lại.
- **Hết hạn do nhàn rỗi** (`session.reset.idleMinutes` hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi có thông điệp đến sau cửa sổ nhàn rỗi. Khi cả hằng ngày + nhàn rỗi đều được cấu hình, cái nào hết hạn trước sẽ thắng.
- **Sự kiện hệ thống** (Heartbeat, đánh thức cron, thông báo exec, ghi chép sổ sách Gateway) có thể thay đổi hàng phiên nhưng không kéo dài độ mới của đặt lại hằng ngày/nhàn rỗi. Rollover đặt lại loại bỏ các thông báo sự kiện hệ thống đã xếp hàng cho phiên trước trước khi prompt mới được xây dựng.
- **Chính sách fork cha** dùng nhánh đang hoạt động của PI khi tạo một thread hoặc fork subagent. Nếu nhánh đó quá lớn, OpenClaw bắt đầu child với ngữ cảnh cô lập thay vì thất bại hoặc thừa hưởng lịch sử không dùng được. Chính sách định cỡ là tự động; cấu hình cũ `session.parentForkMaxTokens` bị `openclaw doctor --fix` xóa.

Chi tiết triển khai: quyết định diễn ra trong `initSessionState()` ở `src/auto-reply/reply/session.ts`.

---

## Schema kho phiên (`sessions.json`)

Kiểu giá trị của kho là `SessionEntry` trong `src/config/sessions.ts`.

Các trường chính (không đầy đủ):

- `sessionId`: id transcript hiện tại (tên tệp được suy ra từ đây trừ khi `sessionFile` được đặt)
- `sessionStartedAt`: dấu thời gian bắt đầu cho `sessionId` hiện tại; độ mới của đặt lại hằng ngày
  dùng trường này. Các hàng cũ có thể suy ra nó từ header phiên JSONL.
- `lastInteractionAt`: dấu thời gian tương tác người dùng/kênh thực gần nhất; độ mới của đặt lại nhàn rỗi
  dùng trường này để Heartbeat, cron, và sự kiện exec không giữ phiên
  sống. Các hàng cũ không có trường này quay về thời gian bắt đầu phiên đã khôi phục
  cho độ mới nhàn rỗi.
- `updatedAt`: dấu thời gian thay đổi hàng kho gần nhất, dùng cho liệt kê, cắt tỉa, và
  ghi chép sổ sách. Nó không phải nguồn thẩm quyền cho độ mới của đặt lại hằng ngày/nhàn rỗi.
- `sessionFile`: override đường dẫn transcript rõ ràng tùy chọn
- `chatType`: `direct | group | room` (giúp UI và chính sách gửi)
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu cho nhãn nhóm/kênh
- Công tắc:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override theo phiên)
- Chọn mô hình:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (nỗ lực tốt nhất / phụ thuộc nhà cung cấp):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần tự động Compaction hoàn tất cho khóa phiên này
- `memoryFlushAt`: dấu thời gian cho lần flush bộ nhớ trước Compaction gần nhất
- `memoryFlushCompactionCount`: số lần Compaction khi lần flush gần nhất chạy

Kho an toàn để chỉnh sửa, nhưng Gateway là nguồn thẩm quyền: nó có thể ghi lại hoặc tái cấp nước các mục khi phiên chạy.

---

## Cấu trúc transcript (`*.jsonl`)

Transcript được quản lý bởi `SessionManager` của `@mariozechner/pi-coding-agent`.

Tệp là JSONL:

- Dòng đầu tiên: header phiên (`type: "session"`, bao gồm `id`, `cwd`, `timestamp`, `parentSession` tùy chọn)
- Sau đó: các mục phiên với `id` + `parentId` (cây)

Các kiểu mục đáng chú ý:

- `message`: thông điệp người dùng/assistant/toolResult
- `custom_message`: thông điệp do extension chèn vào và _có_ đi vào ngữ cảnh mô hình (có thể bị ẩn khỏi UI)
- `custom`: trạng thái extension _không_ đi vào ngữ cảnh mô hình
- `compaction`: tóm tắt Compaction được lưu bền với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: tóm tắt được lưu bền khi điều hướng một nhánh cây

OpenClaw cố ý **không** “sửa chữa” transcript; Gateway dùng `SessionManager` để đọc/ghi chúng.

---

## Cửa sổ ngữ cảnh so với token được theo dõi

Hai khái niệm khác nhau là quan trọng:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng theo từng mô hình (token hiển thị với mô hình)
2. **Bộ đếm kho phiên**: thống kê cuốn chiếu được ghi vào `sessions.json` (dùng cho /status và dashboard)

Nếu bạn đang tinh chỉnh giới hạn:

- Cửa sổ ngữ cảnh đến từ catalog mô hình (và có thể bị override qua cấu hình).
- `contextTokens` trong kho là giá trị ước tính/báo cáo runtime; đừng xem nó như một bảo đảm nghiêm ngặt.

Để biết thêm, xem [/token-use](/vi/reference/token-use).

---

## Compaction: nó là gì

Compaction tóm tắt hội thoại cũ hơn thành một mục `compaction` được lưu bền trong transcript và giữ nguyên các thông điệp gần đây.

Sau Compaction, các lượt tương lai thấy:

- Tóm tắt Compaction
- Các thông điệp sau `firstKeptEntryId`

Compaction là **lưu bền** (khác với cắt tỉa phiên). Xem [/concepts/session-pruning](/vi/concepts/session-pruning).

## Ranh giới đoạn Compaction và ghép cặp công cụ

Khi OpenClaw chia một bản chép dài thành các đoạn Compaction, nó giữ các lệnh gọi công cụ của trợ lý được ghép cặp với các mục `toolResult` tương ứng.

- Nếu điểm chia theo tỷ lệ token rơi vào giữa một lệnh gọi công cụ và kết quả của nó, OpenClaw sẽ dịch chuyển ranh giới đến thông điệp gọi công cụ của trợ lý thay vì tách cặp đó.
- Nếu một khối kết quả công cụ ở cuối nếu giữ nguyên sẽ làm đoạn vượt mục tiêu, OpenClaw bảo toàn khối công cụ đang chờ đó và giữ nguyên phần đuôi chưa được tóm tắt.
- Các khối gọi công cụ bị hủy/lỗi không giữ một điểm chia đang chờ mở.

---

## Khi nào tự động Compaction xảy ra (runtime Pi)

Trong agent Pi nhúng, tự động Compaction được kích hoạt trong hai trường hợp:

1. **Khôi phục khi tràn**: mô hình trả về lỗi tràn ngữ cảnh
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, và các biến thể tương tự theo dạng nhà cung cấp) → nén → thử lại.
2. **Duy trì theo ngưỡng**: sau một lượt thành công, khi:

`contextTokens > contextWindow - reserveTokens`

Trong đó:

- `contextWindow` là cửa sổ ngữ cảnh của mô hình
- `reserveTokens` là phần dự phòng dành cho prompt + đầu ra mô hình tiếp theo

Đây là ngữ nghĩa runtime Pi (OpenClaw tiêu thụ các sự kiện, nhưng Pi quyết định khi nào nén).

OpenClaw cũng có thể kích hoạt Compaction cục bộ kiểm tra trước trước khi mở lượt chạy tiếp theo khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt và tệp bản chép đang hoạt động đạt đến kích thước đó. Đây là một cơ chế bảo vệ theo kích thước tệp cho chi phí mở lại cục bộ, không phải lưu trữ thô: OpenClaw vẫn chạy Compaction ngữ nghĩa thông thường, và nó yêu cầu `truncateAfterCompaction` để bản tóm tắt đã nén có thể trở thành bản chép kế nhiệm mới.

Đối với các lượt chạy Pi nhúng, `agents.defaults.compaction.midTurnPrecheck.enabled: true` thêm một cơ chế bảo vệ vòng lặp công cụ tùy chọn. Sau khi một kết quả công cụ được thêm vào và trước lệnh gọi mô hình tiếp theo, OpenClaw ước tính áp lực prompt bằng cùng logic ngân sách kiểm tra trước được dùng ở đầu lượt. Nếu ngữ cảnh không còn vừa, cơ chế bảo vệ không nén bên trong hook `transformContext` của Pi. Nó phát một tín hiệu kiểm tra trước giữa lượt có cấu trúc, dừng lần gửi prompt hiện tại, và để vòng lặp chạy bên ngoài dùng đường khôi phục hiện có: cắt bớt kết quả công cụ quá lớn khi như vậy là đủ, hoặc kích hoạt chế độ Compaction đã cấu hình và thử lại. Tùy chọn này bị tắt theo mặc định và hoạt động với cả chế độ Compaction `default` và `safeguard`, bao gồm Compaction safeguard được hỗ trợ bởi nhà cung cấp.
Điều này độc lập với `maxActiveTranscriptBytes`: cơ chế bảo vệ theo kích thước byte chạy trước khi một lượt mở ra, trong khi kiểm tra trước giữa lượt chạy muộn hơn trong vòng lặp công cụ Pi nhúng sau khi các kết quả công cụ mới đã được thêm vào.

---

## Cài đặt Compaction (`reserveTokens`, `keepRecentTokens`)

Cài đặt Compaction của Pi nằm trong cài đặt Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw cũng áp dụng một mức sàn an toàn cho các lượt chạy nhúng:

- Nếu `compaction.reserveTokens < reserveTokensFloor`, OpenClaw sẽ tăng nó lên.
- Mức sàn mặc định là `20000` token.
- Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để tắt mức sàn.
- Nếu nó đã cao hơn, OpenClaw giữ nguyên.
- `/compact` thủ công tôn trọng `agents.defaults.compaction.keepRecentTokens` rõ ràng và giữ điểm cắt phần đuôi gần đây của Pi. Nếu không có ngân sách giữ lại rõ ràng, Compaction thủ công vẫn là một checkpoint cứng và ngữ cảnh được dựng lại bắt đầu từ bản tóm tắt mới.
- Đặt `agents.defaults.compaction.midTurnPrecheck.enabled: true` để chạy kiểm tra trước vòng lặp công cụ tùy chọn sau các kết quả công cụ mới và trước lệnh gọi mô hình tiếp theo. Đây chỉ là một trigger; việc tạo bản tóm tắt vẫn dùng đường Compaction đã cấu hình. Nó độc lập với `maxActiveTranscriptBytes`, vốn là cơ chế bảo vệ theo kích thước byte của bản chép đang hoạt động ở đầu lượt.
- Đặt `agents.defaults.compaction.maxActiveTranscriptBytes` thành một giá trị byte hoặc chuỗi như `"20mb"` để chạy Compaction cục bộ trước một lượt khi bản chép đang hoạt động trở nên lớn. Cơ chế bảo vệ này chỉ hoạt động khi `truncateAfterCompaction` cũng được bật. Để trống hoặc đặt `0` để tắt.
- Khi `agents.defaults.compaction.truncateAfterCompaction` được bật, OpenClaw xoay vòng bản chép đang hoạt động sang JSONL kế nhiệm đã nén sau Compaction. Bản chép đầy đủ cũ vẫn được lưu trữ và liên kết từ checkpoint Compaction thay vì bị ghi lại tại chỗ.

Lý do: chừa đủ khoảng dự phòng cho “công việc duy trì” nhiều lượt (như ghi bộ nhớ) trước khi Compaction trở nên không thể tránh khỏi.

Triển khai: `ensurePiCompactionReserveTokens()` trong `src/agents/pi-settings.ts`
(được gọi từ `src/agents/pi-embedded-runner.ts`).

---

## Nhà cung cấp Compaction có thể cắm được

Các Plugin có thể đăng ký một nhà cung cấp Compaction qua `registerCompactionProvider()` trên API Plugin. Khi `agents.defaults.compaction.provider` được đặt thành một id nhà cung cấp đã đăng ký, phần mở rộng safeguard ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì pipeline `summarizeInStages` tích hợp sẵn.

- `provider`: id của một Plugin nhà cung cấp Compaction đã đăng ký. Để trống để dùng tóm tắt LLM mặc định.
- Đặt một `provider` sẽ buộc `mode: "safeguard"`.
- Các nhà cung cấp nhận cùng chỉ dẫn Compaction và chính sách bảo toàn định danh như đường tích hợp sẵn.
- Safeguard vẫn bảo toàn ngữ cảnh hậu tố lượt gần đây và lượt bị chia sau đầu ra của nhà cung cấp.
- Tóm tắt safeguard tích hợp sẵn chưng cất lại các bản tóm tắt trước đó với các thông điệp mới thay vì giữ nguyên văn toàn bộ bản tóm tắt trước đó.
- Chế độ safeguard bật kiểm toán chất lượng tóm tắt theo mặc định; đặt `qualityGuard.enabled: false` để bỏ qua hành vi thử lại khi đầu ra sai định dạng.
- Nếu nhà cung cấp thất bại hoặc trả về kết quả rỗng, OpenClaw tự động quay về tóm tắt LLM tích hợp sẵn.
- Tín hiệu hủy/hết thời gian chờ được ném lại (không bị nuốt) để tôn trọng việc hủy của bên gọi.

Nguồn: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Bề mặt hiển thị cho người dùng

Bạn có thể quan sát trạng thái Compaction và phiên qua:

- `/status` (trong bất kỳ phiên chat nào)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Chế độ chi tiết: `🧹 Auto-compaction complete` + số lần Compaction

---

## Công việc duy trì im lặng (`NO_REPLY`)

OpenClaw hỗ trợ các lượt “im lặng” cho tác vụ nền khi người dùng không nên thấy đầu ra trung gian.

Quy ước:

- Trợ lý bắt đầu đầu ra bằng token im lặng chính xác `NO_REPLY` /
  `no_reply` để chỉ ra “không gửi phản hồi cho người dùng”.
- OpenClaw loại bỏ/ẩn phần này ở lớp gửi.
- Việc ẩn token im lặng chính xác không phân biệt chữ hoa chữ thường, vì vậy `NO_REPLY` và
  `no_reply` đều được tính khi toàn bộ payload chỉ là token im lặng.
- Điều này chỉ dành cho các lượt nền/không gửi thật sự; nó không phải lối tắt cho các yêu cầu người dùng thông thường có thể hành động.

Kể từ `2026.1.10`, OpenClaw cũng ẩn **luồng nháp/đang nhập** khi một đoạn một phần bắt đầu bằng `NO_REPLY`, để các thao tác im lặng không rò rỉ đầu ra một phần giữa lượt.

---

## "Xả bộ nhớ" trước Compaction (đã triển khai)

Mục tiêu: trước khi tự động Compaction xảy ra, chạy một lượt agentic im lặng ghi trạng thái bền vững xuống đĩa (ví dụ `memory/YYYY-MM-DD.md` trong workspace của agent) để Compaction không thể xóa ngữ cảnh quan trọng.

OpenClaw dùng cách tiếp cận **xả trước ngưỡng**:

1. Giám sát mức sử dụng ngữ cảnh của phiên.
2. Khi nó vượt qua một “ngưỡng mềm” (thấp hơn ngưỡng Compaction của Pi), chạy một chỉ thị “ghi bộ nhớ ngay” im lặng cho agent.
3. Dùng token im lặng chính xác `NO_REPLY` / `no_reply` để người dùng không thấy gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`):

- `enabled` (mặc định: `true`)
- `model` (ghi đè chính xác nhà cung cấp/mô hình tùy chọn cho lượt xả, ví dụ `ollama/qwen3:8b`)
- `softThresholdTokens` (mặc định: `4000`)
- `prompt` (thông điệp người dùng cho lượt xả)
- `systemPrompt` (prompt hệ thống bổ sung được thêm vào cho lượt xả)

Ghi chú:

- Prompt/prompt hệ thống mặc định bao gồm gợi ý `NO_REPLY` để ẩn việc gửi.
- Khi `model` được đặt, lượt xả dùng mô hình đó mà không kế thừa chuỗi fallback của phiên đang hoạt động, để công việc duy trì chỉ cục bộ không âm thầm fallback sang mô hình hội thoại trả phí.
- Lượt xả chạy một lần cho mỗi chu kỳ Compaction (được theo dõi trong `sessions.json`).
- Lượt xả chỉ chạy cho các phiên Pi nhúng (backend CLI bỏ qua).
- Lượt xả bị bỏ qua khi workspace của phiên là chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Bộ nhớ](/vi/concepts/memory) để biết bố cục tệp workspace và mẫu ghi.

Pi cũng cung cấp hook `session_before_compact` trong API phần mở rộng, nhưng logic xả của OpenClaw hiện nằm ở phía Gateway.

---

## Danh sách kiểm tra khắc phục sự cố

- Khóa phiên sai? Bắt đầu với [/concepts/session](/vi/concepts/session) và xác nhận `sessionKey` trong `/status`.
- Store và bản chép không khớp? Xác nhận host Gateway và đường dẫn store từ `openclaw status`.
- Compaction lặp quá nhiều? Kiểm tra:
  - cửa sổ ngữ cảnh của mô hình (quá nhỏ)
  - cài đặt Compaction (`reserveTokens` quá cao so với cửa sổ mô hình có thể gây Compaction sớm hơn)
  - kết quả công cụ phình to: bật/tinh chỉnh việc cắt tỉa phiên
- Lượt im lặng bị rò rỉ? Xác nhận phản hồi bắt đầu bằng `NO_REPLY` (token chính xác không phân biệt chữ hoa chữ thường) và bạn đang dùng bản dựng có bản sửa ẩn luồng.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
