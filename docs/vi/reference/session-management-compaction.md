---
read_when:
    - Bạn cần gỡ lỗi mã định danh phiên, JSONL bản ghi hội thoại hoặc các trường sessions.json
    - Bạn đang thay đổi hành vi Compaction tự động hoặc thêm công việc dọn dẹp “trước Compaction”
    - Bạn muốn triển khai việc xả bộ nhớ hoặc các lượt hệ thống im lặng
summary: 'Chuyên sâu: kho lưu phiên + bản ghi phiên, vòng đời và cơ chế nội bộ của Compaction (tự động)'
title: Tìm hiểu chuyên sâu về quản lý phiên
x-i18n:
    generated_at: "2026-05-05T08:26:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3161dd9c98bff7ea24266f44a9261693d8a9ee2b47d9af2d152de7057016748b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw quản lý phiên từ đầu đến cuối trên các khu vực sau:

- **Định tuyến phiên** (cách thông điệp đến ánh xạ tới một `sessionKey`)
- **Kho phiên** (`sessions.json`) và những gì nó theo dõi
- **Lưu bền transcript** (`*.jsonl`) và cấu trúc của nó
- **Vệ sinh transcript** (các chỉnh sửa riêng theo provider trước khi chạy)
- **Giới hạn ngữ cảnh** (cửa sổ ngữ cảnh so với token được theo dõi)
- **Compaction** (Compaction thủ công và tự động) và nơi móc công việc trước Compaction
- **Dọn dẹp ngầm** (các lần ghi bộ nhớ không nên tạo đầu ra hiển thị cho người dùng)

Nếu bạn muốn xem tổng quan cấp cao hơn trước, hãy bắt đầu với:

- [Quản lý phiên](/vi/concepts/session)
- [Compaction](/vi/concepts/compaction)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Vệ sinh transcript](/vi/reference/transcript-hygiene)

---

## Nguồn sự thật: Gateway

OpenClaw được thiết kế xoay quanh một **tiến trình Gateway** duy nhất sở hữu trạng thái phiên.

- UI (ứng dụng macOS, Control UI trên web, TUI) nên truy vấn Gateway để lấy danh sách phiên và số lượng token.
- Ở chế độ từ xa, các tệp phiên nằm trên máy chủ từ xa; “kiểm tra các tệp Mac cục bộ của bạn” sẽ không phản ánh những gì Gateway đang sử dụng.

---

## Hai lớp lưu bền

OpenClaw lưu bền phiên trong hai lớp:

1. **Kho phiên (`sessions.json`)**
   - Bản đồ khóa/giá trị: `sessionKey -> SessionEntry`
   - Nhỏ, có thể thay đổi, an toàn để chỉnh sửa (hoặc xóa mục)
   - Theo dõi siêu dữ liệu phiên (id phiên hiện tại, hoạt động cuối, các bật/tắt, bộ đếm token, v.v.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Transcript chỉ ghi nối tiếp với cấu trúc cây (các mục có `id` + `parentId`)
   - Lưu cuộc trò chuyện thực tế + lệnh gọi công cụ + tóm tắt Compaction
   - Được dùng để dựng lại ngữ cảnh mô hình cho các lượt sau
   - Các checkpoint gỡ lỗi lớn trước Compaction được bỏ qua khi transcript
     đang hoạt động vượt quá giới hạn kích thước checkpoint, tránh tạo bản sao
     `.checkpoint.*.jsonl` khổng lồ thứ hai.

Các bộ đọc lịch sử Gateway nên tránh nạp toàn bộ transcript vào bộ nhớ trừ khi
bề mặt đó thật sự cần truy cập lịch sử tùy ý. Lịch sử trang đầu, lịch sử chat
nhúng, khôi phục khi khởi động lại, và kiểm tra token/mức dùng sử dụng các lần
đọc phần đuôi có giới hạn. Quét toàn bộ transcript đi qua chỉ mục transcript bất đồng bộ, được
lưu cache theo đường dẫn tệp cộng với `mtimeMs`/`size` và dùng chung giữa các bộ đọc đồng thời.

---

## Vị trí trên đĩa

Theo từng agent, trên máy chủ Gateway:

- Kho: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Phiên chủ đề Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw phân giải các vị trí này qua `src/config/sessions.ts`.

---

## Bảo trì kho và kiểm soát đĩa

Lưu bền phiên có các kiểm soát bảo trì tự động (`session.maintenance`) cho `sessions.json`, artifact transcript, và sidecar trajectory:

- `mode`: `warn` (mặc định) hoặc `enforce`
- `pruneAfter`: ngưỡng tuổi cho mục cũ (mặc định `30d`)
- `maxEntries`: giới hạn số mục trong `sessions.json` (mặc định `500`)
- `resetArchiveRetention`: thời gian giữ lại cho kho lưu trữ transcript `*.reset.<timestamp>` (mặc định: giống `pruneAfter`; `false` tắt dọn dẹp)
- `maxDiskBytes`: ngân sách thư mục phiên tùy chọn
- `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp (mặc định `80%` của `maxDiskBytes`)

Các lần ghi Gateway thông thường đi qua một bộ ghi phiên theo từng kho, tuần tự hóa các thay đổi trong tiến trình mà không cần khóa tệp runtime. Các helper vá trên đường nóng mượn cache có thể thay đổi đã được xác thực trong khi giữ slot ghi đó, nên các tệp `sessions.json` lớn không bị sao chép hoặc đọc lại cho mọi lần cập nhật siêu dữ liệu. Mã runtime nên ưu tiên `updateSessionStore(...)` hoặc `updateSessionStoreEntry(...)`; lưu toàn bộ kho trực tiếp là công cụ tương thích và bảo trì ngoại tuyến. Khi có thể truy cập Gateway, `openclaw sessions cleanup` không phải dry run và `openclaw agents delete` ủy quyền các thay đổi kho cho Gateway để việc dọn dẹp tham gia cùng hàng đợi ghi; `--store <path>` là đường sửa chữa ngoại tuyến tường minh cho bảo trì tệp trực tiếp. Dọn dẹp `maxEntries` vẫn được gom lô cho các giới hạn cỡ production, nên một kho có thể tạm thời vượt quá giới hạn đã cấu hình trước khi lần dọn dẹp high-water tiếp theo ghi lại nó xuống thấp hơn. Các lần đọc kho phiên không cắt tỉa hoặc giới hạn mục trong lúc Gateway khởi động; hãy dùng các lần ghi hoặc `openclaw sessions cleanup --enforce` để dọn dẹp. `openclaw sessions cleanup --enforce` vẫn áp dụng giới hạn đã cấu hình ngay lập tức và cắt tỉa các artifact transcript, checkpoint, và trajectory cũ không còn được tham chiếu ngay cả khi không cấu hình ngân sách đĩa.

Bảo trì giữ các con trỏ cuộc trò chuyện bên ngoài bền vững như phiên nhóm
và phiên chat theo phạm vi luồng, nhưng các mục runtime tổng hợp cho cron, hook,
heartbeat, ACP, và sub-agent vẫn có thể bị xóa khi vượt quá tuổi,
số lượng, hoặc ngân sách đĩa đã cấu hình.

OpenClaw không còn tạo các bản sao lưu xoay vòng `sessions.json.bak.*` tự động trong các lần ghi Gateway. Khóa `session.maintenance.rotateBytes` cũ bị bỏ qua và `openclaw doctor --fix` xóa nó khỏi cấu hình cũ.

Các thay đổi transcript dùng một khóa ghi phiên trên tệp transcript. Việc lấy khóa chờ tối đa
`session.writeLock.acquireTimeoutMs` trước khi báo lỗi phiên bận; mặc định là `60000`
ms. Chỉ tăng giá trị này khi các công việc chuẩn bị, dọn dẹp, Compaction, hoặc mirror transcript hợp lệ tranh chấp
lâu hơn trên máy chậm. Phát hiện khóa cũ và cảnh báo thời gian giữ tối đa vẫn là các chính sách riêng.

Thứ tự thực thi khi dọn dẹp ngân sách đĩa (`mode: "enforce"`):

1. Xóa các artifact đã lưu trữ, transcript mồ côi, hoặc trajectory mồ côi cũ nhất trước.
2. Nếu vẫn vượt mục tiêu, loại bỏ các mục phiên cũ nhất và các tệp transcript/trajectory của chúng.
3. Tiếp tục cho đến khi mức dùng bằng hoặc thấp hơn `highWaterBytes`.

Trong `mode: "warn"`, OpenClaw báo cáo các trường hợp có thể bị loại bỏ nhưng không thay đổi kho/tệp.

Chạy bảo trì theo yêu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Phiên Cron và nhật ký chạy

Các lần chạy cron cô lập cũng tạo mục phiên/transcript, và chúng có kiểm soát lưu giữ riêng:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy cron cô lập cũ khỏi kho phiên (`false` tắt).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` cắt tỉa các tệp `~/.openclaw/cron/runs/<jobId>.jsonl` (mặc định: `2_000_000` byte và `2000` dòng).

Khi cron buộc tạo một phiên chạy cô lập mới, nó làm sạch mục phiên
`cron:<jobId>` trước đó trước khi ghi hàng mới. Nó mang theo các tùy chọn an toàn
như thiết lập thinking/fast/verbose, nhãn, và các ghi đè model/auth do người dùng
chọn tường minh. Nó bỏ ngữ cảnh cuộc trò chuyện môi trường như định tuyến
channel/group, chính sách gửi hoặc xếp hàng, elevation, origin, và ràng buộc runtime ACP
để một lần chạy cô lập mới không thể kế thừa quyền phân phối hoặc runtime cũ
từ một lần chạy trước.

---

## Khóa phiên (`sessionKey`)

Một `sessionKey` xác định _bạn đang ở trong bucket cuộc trò chuyện nào_ (định tuyến + cô lập).

Các mẫu phổ biến:

- Chat chính/trực tiếp (theo agent): `agent:<agentId>:<mainKey>` (mặc định `main`)
- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Phòng/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (trừ khi bị ghi đè)

Các quy tắc chuẩn được ghi tại [/concepts/session](/vi/concepts/session).

---

## Id phiên (`sessionId`)

Mỗi `sessionKey` trỏ tới một `sessionId` hiện tại (tệp transcript tiếp tục cuộc trò chuyện).

Quy tắc kinh nghiệm:

- **Đặt lại** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Đặt lại hằng ngày** (mặc định 4:00 sáng giờ địa phương trên máy chủ gateway) tạo một `sessionId` mới ở thông điệp tiếp theo sau ranh giới đặt lại.
- **Hết hạn do nhàn rỗi** (`session.reset.idleMinutes` hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi có thông điệp đến sau cửa sổ nhàn rỗi. Khi cả đặt lại hằng ngày và nhàn rỗi đều được cấu hình, mục nào hết hạn trước sẽ thắng.
- **Sự kiện hệ thống** (heartbeat, đánh thức cron, thông báo exec, bookkeeping gateway) có thể thay đổi hàng phiên nhưng không kéo dài độ mới cho đặt lại hằng ngày/nhàn rỗi. Chuyển phiên đặt lại loại bỏ các thông báo sự kiện hệ thống đã xếp hàng cho phiên trước trước khi prompt mới được dựng.
- **Chính sách fork cha** dùng nhánh đang hoạt động của PI khi tạo một luồng hoặc fork subagent. Nếu nhánh đó quá lớn, OpenClaw khởi động con với ngữ cảnh cô lập thay vì thất bại hoặc kế thừa lịch sử không dùng được. Chính sách định cỡ là tự động; cấu hình `session.parentForkMaxTokens` cũ được `openclaw doctor --fix` xóa.

Chi tiết triển khai: quyết định diễn ra trong `initSessionState()` tại `src/auto-reply/reply/session.ts`.

---

## Schema kho phiên (`sessions.json`)

Kiểu giá trị của kho là `SessionEntry` trong `src/config/sessions.ts`.

Các trường chính (không đầy đủ):

- `sessionId`: id transcript hiện tại (tên tệp được suy ra từ giá trị này trừ khi `sessionFile` được đặt)
- `sessionStartedAt`: timestamp bắt đầu cho `sessionId` hiện tại; độ mới của đặt lại hằng ngày
  dùng trường này. Các hàng cũ có thể suy ra nó từ header phiên JSONL.
- `lastInteractionAt`: timestamp tương tác người dùng/channel thật gần nhất; độ mới của đặt lại do nhàn rỗi
  dùng trường này để heartbeat, cron, và sự kiện exec không giữ phiên
  còn sống. Các hàng cũ không có trường này fallback về thời gian bắt đầu phiên đã khôi phục
  cho độ mới nhàn rỗi.
- `updatedAt`: timestamp thay đổi hàng kho gần nhất, được dùng cho liệt kê, cắt tỉa, và
  bookkeeping. Nó không phải nguồn thẩm quyền cho độ mới đặt lại hằng ngày/nhàn rỗi.
- `sessionFile`: ghi đè đường dẫn transcript tường minh tùy chọn
- `chatType`: `direct | group | room` (giúp UI và chính sách gửi)
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu để gắn nhãn nhóm/channel
- Bật/tắt:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (ghi đè theo phiên)
- Chọn mô hình:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (nỗ lực tốt nhất / phụ thuộc provider):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần auto-compaction hoàn tất cho khóa phiên này
- `memoryFlushAt`: timestamp của lần flush bộ nhớ trước Compaction gần nhất
- `memoryFlushCompactionCount`: số lần Compaction khi lần flush gần nhất chạy

Kho an toàn để chỉnh sửa, nhưng Gateway là nguồn thẩm quyền: nó có thể ghi lại hoặc tái hydrate các mục khi phiên chạy.

---

## Cấu trúc transcript (`*.jsonl`)

Transcript được quản lý bởi `SessionManager` của `@mariozechner/pi-coding-agent`.

Tệp là JSONL:

- Dòng đầu tiên: header phiên (`type: "session"`, gồm `id`, `cwd`, `timestamp`, `parentSession` tùy chọn)
- Sau đó: các mục phiên với `id` + `parentId` (cây)

Các kiểu mục đáng chú ý:

- `message`: thông điệp user/assistant/toolResult
- `custom_message`: thông điệp do extension chèn vào và _có_ đi vào ngữ cảnh mô hình (có thể ẩn khỏi UI)
- `custom`: trạng thái extension _không_ đi vào ngữ cảnh mô hình
- `compaction`: tóm tắt Compaction đã lưu bền với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: tóm tắt đã lưu bền khi điều hướng một nhánh cây

OpenClaw cố ý **không** “sửa” transcript; Gateway dùng `SessionManager` để đọc/ghi chúng.

---

## Cửa sổ ngữ cảnh so với token được theo dõi

Có hai khái niệm khác nhau quan trọng:

1. **Cửa sổ ngữ cảnh của mô hình**: giới hạn cứng theo từng mô hình (token hiển thị với mô hình)
2. **Bộ đếm kho phiên**: thống kê cuốn chiếu được ghi vào `sessions.json` (dùng cho /status và dashboard)

Nếu bạn đang tinh chỉnh giới hạn:

- Cửa sổ ngữ cảnh đến từ catalog mô hình (và có thể được ghi đè qua cấu hình).
- `contextTokens` trong kho là giá trị ước tính/báo cáo runtime; đừng xem nó là bảo đảm nghiêm ngặt.

Xem thêm tại [/token-use](/vi/reference/token-use).

---

## Compaction: nó là gì

Compaction tóm tắt cuộc trò chuyện cũ hơn thành một mục `compaction` đã lưu bền trong transcript và giữ nguyên các thông điệp gần đây.

Sau Compaction, các lượt sau thấy:

- Tóm tắt Compaction
- Các thông điệp sau `firstKeptEntryId`

Compaction là **bền vững** (không giống như cắt tỉa phiên). Xem [/concepts/session-pruning](/vi/concepts/session-pruning).

## Ranh giới đoạn Compaction và ghép cặp công cụ

Khi OpenClaw chia một bản ghi dài thành các đoạn Compaction, nó giữ các lệnh gọi công cụ của assistant được ghép cặp với các mục `toolResult` tương ứng.

- Nếu điểm chia theo tỷ lệ token rơi vào giữa một lệnh gọi công cụ và kết quả của nó, OpenClaw dịch ranh giới về thông điệp lệnh gọi công cụ của assistant thay vì tách cặp đó.
- Nếu một khối kết quả công cụ ở cuối nếu không sẽ đẩy đoạn vượt quá mục tiêu, OpenClaw giữ nguyên khối công cụ đang chờ đó và giữ nguyên phần đuôi chưa được tóm tắt.
- Các khối lệnh gọi công cụ bị hủy/lỗi không giữ một điểm chia đang chờ mở.

---

## Khi tự động Compaction diễn ra (thời gian chạy Pi)

Trong tác nhân Pi nhúng, tự động Compaction kích hoạt trong hai trường hợp:

1. **Khôi phục tràn**: mô hình trả về lỗi tràn ngữ cảnh (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, và các biến thể tương tự theo dạng nhà cung cấp) → Compaction → thử lại.
2. **Duy trì ngưỡng**: sau một lượt thành công, khi:

`contextTokens > contextWindow - reserveTokens`

Trong đó:

- `contextWindow` là cửa sổ ngữ cảnh của mô hình
- `reserveTokens` là phần dự phòng dành cho prompt + đầu ra mô hình tiếp theo

Đây là ngữ nghĩa thời gian chạy Pi (OpenClaw tiêu thụ các sự kiện, nhưng Pi quyết định khi nào Compaction).

OpenClaw cũng có thể kích hoạt Compaction cục bộ trước kiểm tra trước khi mở lượt chạy tiếp theo khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt và tệp bản ghi đang hoạt động đạt kích thước đó. Đây là bộ bảo vệ kích thước tệp cho chi phí mở lại cục bộ, không phải lưu trữ thô: OpenClaw vẫn chạy Compaction ngữ nghĩa thông thường, và nó yêu cầu `truncateAfterCompaction` để bản tóm tắt đã Compaction có thể trở thành một bản ghi kế nhiệm mới.

Đối với các lượt chạy Pi nhúng, `agents.defaults.compaction.midTurnPrecheck.enabled: true` thêm một bộ bảo vệ vòng lặp công cụ tùy chọn. Sau khi một kết quả công cụ được thêm vào và trước lệnh gọi mô hình tiếp theo, OpenClaw ước tính áp lực prompt bằng cùng logic ngân sách kiểm tra trước được dùng lúc bắt đầu lượt. Nếu ngữ cảnh không còn vừa, bộ bảo vệ không Compaction bên trong hook `transformContext` của Pi. Nó phát tín hiệu kiểm tra trước giữa lượt có cấu trúc, dừng lần gửi prompt hiện tại, và cho phép vòng lặp chạy bên ngoài dùng đường khôi phục hiện có: cắt ngắn các kết quả công cụ quá lớn khi như vậy là đủ, hoặc kích hoạt chế độ Compaction đã cấu hình và thử lại. Tùy chọn này bị tắt theo mặc định và hoạt động với cả chế độ Compaction `default` và `safeguard`, bao gồm Compaction bảo vệ dựa trên nhà cung cấp.
Điều này độc lập với `maxActiveTranscriptBytes`: bộ bảo vệ kích thước byte chạy trước khi một lượt mở ra, trong khi kiểm tra trước giữa lượt chạy muộn hơn trong vòng lặp công cụ Pi nhúng sau khi các kết quả công cụ mới đã được thêm vào.

---

## Cài đặt Compaction (`reserveTokens`, `keepRecentTokens`)

Các cài đặt Compaction của Pi nằm trong cài đặt Pi:

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

- Nếu `compaction.reserveTokens < reserveTokensFloor`, OpenClaw tăng nó lên.
- Mức sàn mặc định là `20000` token.
- Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để tắt mức sàn.
- Nếu nó đã cao hơn, OpenClaw giữ nguyên.
- `/compact` thủ công tôn trọng `agents.defaults.compaction.keepRecentTokens` rõ ràng và giữ điểm cắt phần đuôi gần đây của Pi. Nếu không có ngân sách giữ lại rõ ràng, Compaction thủ công vẫn là một điểm kiểm tra cứng và ngữ cảnh được dựng lại bắt đầu từ bản tóm tắt mới.
- Đặt `agents.defaults.compaction.midTurnPrecheck.enabled: true` để chạy kiểm tra trước vòng lặp công cụ tùy chọn sau các kết quả công cụ mới và trước lệnh gọi mô hình tiếp theo. Đây chỉ là bộ kích hoạt; việc tạo bản tóm tắt vẫn dùng đường Compaction đã cấu hình. Nó độc lập với `maxActiveTranscriptBytes`, vốn là bộ bảo vệ kích thước byte của bản ghi đang hoạt động lúc bắt đầu lượt.
- Đặt `agents.defaults.compaction.maxActiveTranscriptBytes` thành một giá trị byte hoặc chuỗi như `"20mb"` để chạy Compaction cục bộ trước một lượt khi bản ghi đang hoạt động trở nên lớn. Bộ bảo vệ này chỉ hoạt động khi `truncateAfterCompaction` cũng được bật. Để không đặt hoặc đặt `0` để tắt.
- Khi `agents.defaults.compaction.truncateAfterCompaction` được bật, OpenClaw xoay bản ghi đang hoạt động sang một JSONL kế nhiệm đã Compaction sau khi Compaction. Bản ghi đầy đủ cũ vẫn được lưu trữ và liên kết từ điểm kiểm tra Compaction thay vì bị ghi đè tại chỗ.

Lý do: chừa đủ khoảng trống cho “việc dọn dẹp” nhiều lượt (như ghi bộ nhớ) trước khi Compaction trở nên không thể tránh khỏi.

Triển khai: `ensurePiCompactionReserveTokens()` trong `src/agents/pi-settings.ts`
(được gọi từ `src/agents/pi-embedded-runner.ts`).

---

## Nhà cung cấp Compaction có thể cắm được

Plugin có thể đăng ký một nhà cung cấp Compaction thông qua `registerCompactionProvider()` trên API Plugin. Khi `agents.defaults.compaction.provider` được đặt thành một id nhà cung cấp đã đăng ký, tiện ích mở rộng bảo vệ ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì pipeline `summarizeInStages` tích hợp sẵn.

- `provider`: id của Plugin nhà cung cấp Compaction đã đăng ký. Để trống để dùng tóm tắt LLM mặc định.
- Đặt một `provider` sẽ buộc `mode: "safeguard"`.
- Nhà cung cấp nhận cùng chỉ dẫn Compaction và chính sách bảo toàn định danh như đường tích hợp sẵn.
- Cơ chế bảo vệ vẫn giữ ngữ cảnh hậu tố của lượt gần đây và lượt bị chia sau đầu ra của nhà cung cấp.
- Tóm tắt bảo vệ tích hợp sẵn chưng cất lại các bản tóm tắt trước đó với thông điệp mới thay vì giữ nguyên văn toàn bộ bản tóm tắt trước.
- Chế độ bảo vệ bật kiểm toán chất lượng tóm tắt theo mặc định; đặt `qualityGuard.enabled: false` để bỏ qua hành vi thử lại khi đầu ra sai định dạng.
- Nếu nhà cung cấp thất bại hoặc trả về kết quả rỗng, OpenClaw tự động quay lại tóm tắt LLM tích hợp sẵn.
- Tín hiệu hủy/hết thời gian chờ được ném lại (không bị nuốt) để tôn trọng việc hủy từ bên gọi.

Nguồn: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Bề mặt người dùng thấy được

Bạn có thể quan sát Compaction và trạng thái phiên thông qua:

- `/status` (trong bất kỳ phiên trò chuyện nào)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Chế độ chi tiết: `🧹 Auto-compaction complete` + số lần Compaction

---

## Dọn dẹp âm thầm (`NO_REPLY`)

OpenClaw hỗ trợ các lượt “âm thầm” cho tác vụ nền nơi người dùng không nên thấy đầu ra trung gian.

Quy ước:

- assistant bắt đầu đầu ra bằng token âm thầm chính xác `NO_REPLY` /
  `no_reply` để chỉ ra “không gửi câu trả lời cho người dùng”.
- OpenClaw loại bỏ/ẩn điều này ở lớp gửi.
- Việc ẩn token âm thầm chính xác không phân biệt chữ hoa chữ thường, nên `NO_REPLY` và
  `no_reply` đều được tính khi toàn bộ payload chỉ là token âm thầm.
- Điều này chỉ dành cho các lượt nền/thực sự không gửi; nó không phải lối tắt cho các yêu cầu người dùng thông thường cần hành động.

Kể từ `2026.1.10`, OpenClaw cũng ẩn **phát trực tuyến nháp/đang nhập** khi một đoạn một phần bắt đầu bằng `NO_REPLY`, để các thao tác âm thầm không rò rỉ đầu ra một phần giữa lượt.

---

## "Xả bộ nhớ" trước Compaction (đã triển khai)

Mục tiêu: trước khi tự động Compaction diễn ra, chạy một lượt tác nhân âm thầm ghi trạng thái bền vững vào đĩa (ví dụ `memory/YYYY-MM-DD.md` trong workspace của tác nhân) để Compaction không thể xóa ngữ cảnh quan trọng.

OpenClaw dùng cách tiếp cận **xả trước ngưỡng**:

1. Giám sát mức sử dụng ngữ cảnh phiên.
2. Khi nó vượt qua “ngưỡng mềm” (dưới ngưỡng Compaction của Pi), chạy chỉ thị “ghi bộ nhớ ngay” âm thầm cho tác nhân.
3. Dùng token âm thầm chính xác `NO_REPLY` / `no_reply` để người dùng không thấy gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`):

- `enabled` (mặc định: `true`)
- `model` (ghi đè chính xác nhà cung cấp/mô hình tùy chọn cho lượt xả, ví dụ `ollama/qwen3:8b`)
- `softThresholdTokens` (mặc định: `4000`)
- `prompt` (thông điệp người dùng cho lượt xả)
- `systemPrompt` (prompt hệ thống bổ sung được thêm vào cho lượt xả)

Ghi chú:

- Prompt/prompt hệ thống mặc định bao gồm gợi ý `NO_REPLY` để ẩn việc gửi.
- Khi `model` được đặt, lượt xả dùng mô hình đó mà không kế thừa chuỗi dự phòng của phiên đang hoạt động, để việc dọn dẹp chỉ cục bộ không âm thầm dự phòng sang một mô hình hội thoại trả phí.
- Lượt xả chạy một lần cho mỗi chu kỳ Compaction (được theo dõi trong `sessions.json`).
- Lượt xả chỉ chạy cho các phiên Pi nhúng (backend CLI bỏ qua).
- Lượt xả bị bỏ qua khi workspace phiên ở chế độ chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Bộ nhớ](/vi/concepts/memory) để biết bố cục tệp workspace và mẫu ghi.

Pi cũng cung cấp hook `session_before_compact` trong API tiện ích mở rộng, nhưng logic xả của OpenClaw hiện nằm ở phía Gateway.

---

## Danh sách kiểm tra khắc phục sự cố

- Khóa phiên sai? Bắt đầu với [/concepts/session](/vi/concepts/session) và xác nhận `sessionKey` trong `/status`.
- Kho lưu trữ và bản ghi không khớp? Xác nhận máy chủ Gateway và đường dẫn kho lưu trữ từ `openclaw status`.
- Compaction quá nhiều? Kiểm tra:
  - cửa sổ ngữ cảnh của mô hình (quá nhỏ)
  - cài đặt Compaction (`reserveTokens` quá cao so với cửa sổ mô hình có thể gây Compaction sớm hơn)
  - kết quả công cụ phình to: bật/tinh chỉnh cắt tỉa phiên
- Lượt âm thầm bị rò rỉ? Xác nhận câu trả lời bắt đầu bằng `NO_REPLY` (token chính xác không phân biệt chữ hoa chữ thường) và bạn đang dùng bản dựng có bản sửa ẩn phát trực tuyến.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
