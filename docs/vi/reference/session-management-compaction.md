---
read_when:
    - Bạn cần gỡ lỗi ID phiên, bản ghi JSONL hoặc các trường sessions.json
    - Bạn đang thay đổi hành vi Compaction tự động hoặc thêm công việc dọn dẹp “trước Compaction”
    - Bạn muốn triển khai việc xả bộ nhớ hoặc các lượt hệ thống âm thầm
summary: 'Chuyên sâu: kho lưu trữ phiên + bản ghi, vòng đời và cơ chế nội bộ của Compaction tự động'
title: Tìm hiểu chuyên sâu về quản lý phiên
x-i18n:
    generated_at: "2026-04-30T16:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw quản lý phiên từ đầu đến cuối trên các khu vực sau:

- **Định tuyến phiên** (cách thông điệp đến ánh xạ tới một `sessionKey`)
- **Kho lưu trữ phiên** (`sessions.json`) và những gì nó theo dõi
- **Lưu bền vững bản ghi hội thoại** (`*.jsonl`) và cấu trúc của nó
- **Vệ sinh bản ghi hội thoại** (các chỉnh sửa đặc thù theo nhà cung cấp trước khi chạy)
- **Giới hạn ngữ cảnh** (cửa sổ ngữ cảnh so với token được theo dõi)
- **Compaction** (Compaction thủ công và tự động) và nơi móc công việc tiền Compaction
- **Dọn dẹp ngầm** (các lần ghi bộ nhớ không nên tạo đầu ra hiển thị với người dùng)

Nếu bạn muốn xem tổng quan cấp cao hơn trước, hãy bắt đầu với:

- [Quản lý phiên](/vi/concepts/session)
- [Compaction](/vi/concepts/compaction)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Vệ sinh bản ghi hội thoại](/vi/reference/transcript-hygiene)

---

## Nguồn sự thật: Gateway

OpenClaw được thiết kế xoay quanh một **tiến trình Gateway** duy nhất sở hữu trạng thái phiên.

- UI (ứng dụng macOS, Control UI trên web, TUI) nên truy vấn Gateway để lấy danh sách phiên và số token.
- Ở chế độ từ xa, tệp phiên nằm trên máy chủ từ xa; "kiểm tra các tệp cục bộ trên máy Mac của bạn" sẽ không phản ánh những gì Gateway đang dùng.

---

## Hai lớp lưu bền vững

OpenClaw lưu bền vững phiên theo hai lớp:

1. **Kho lưu trữ phiên (`sessions.json`)**
   - Bản đồ khóa/giá trị: `sessionKey -> SessionEntry`
   - Nhỏ, có thể thay đổi, an toàn để chỉnh sửa (hoặc xóa mục)
   - Theo dõi siêu dữ liệu phiên (id phiên hiện tại, hoạt động gần nhất, công tắc bật/tắt, bộ đếm token, v.v.)

2. **Bản ghi hội thoại (`<sessionId>.jsonl`)**
   - Bản ghi hội thoại chỉ ghi nối thêm với cấu trúc cây (mục có `id` + `parentId`)
   - Lưu cuộc trò chuyện thực tế + lời gọi công cụ + tóm tắt Compaction
   - Được dùng để dựng lại ngữ cảnh mô hình cho các lượt sau
   - Các checkpoint gỡ lỗi lớn trước Compaction sẽ bị bỏ qua khi bản ghi hội thoại
     đang hoạt động vượt quá giới hạn kích thước checkpoint, tránh tạo bản sao
     `.checkpoint.*.jsonl` khổng lồ thứ hai.

---

## Vị trí trên đĩa

Theo từng agent, trên máy chủ Gateway:

- Kho lưu trữ: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Bản ghi hội thoại: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Phiên chủ đề Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw phân giải các đường dẫn này qua `src/config/sessions.ts`.

---

## Bảo trì kho lưu trữ và kiểm soát đĩa

Lưu bền vững phiên có các kiểm soát bảo trì tự động (`session.maintenance`) cho `sessions.json`, tạo phẩm bản ghi hội thoại và các sidecar trajectory:

- `mode`: `warn` (mặc định) hoặc `enforce`
- `pruneAfter`: ngưỡng tuổi của mục cũ (mặc định `30d`)
- `maxEntries`: giới hạn số mục trong `sessions.json` (mặc định `500`)
- `resetArchiveRetention`: thời gian giữ lại kho lưu trữ bản ghi hội thoại `*.reset.<timestamp>` (mặc định: giống `pruneAfter`; `false` tắt dọn dẹp)
- `maxDiskBytes`: ngân sách thư mục phiên tùy chọn
- `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp (mặc định `80%` của `maxDiskBytes`)

Các lần ghi Gateway thông thường gom lô dọn dẹp `maxEntries` cho các giới hạn cỡ production, nên kho lưu trữ có thể tạm thời vượt quá giới hạn đã cấu hình trước khi lần dọn dẹp ngưỡng cao tiếp theo ghi lại để giảm xuống. `openclaw sessions cleanup --enforce` vẫn áp dụng giới hạn đã cấu hình ngay lập tức.

OpenClaw không còn tạo tự động các bản sao lưu xoay vòng `sessions.json.bak.*` trong khi Gateway ghi. Khóa `session.maintenance.rotateBytes` cũ bị bỏ qua và `openclaw doctor --fix` xóa nó khỏi các cấu hình cũ.

Thứ tự thực thi khi dọn dẹp ngân sách đĩa (`mode: "enforce"`):

1. Xóa các tạo phẩm đã lưu trữ cũ nhất, bản ghi hội thoại mồ côi hoặc trajectory mồ côi trước.
2. Nếu vẫn vượt mục tiêu, loại bỏ các mục phiên cũ nhất và các tệp bản ghi hội thoại/trajectory của chúng.
3. Tiếp tục cho đến khi mức sử dụng bằng hoặc thấp hơn `highWaterBytes`.

Trong `mode: "warn"`, OpenClaw báo cáo các loại bỏ tiềm năng nhưng không thay đổi kho lưu trữ/tệp.

Chạy bảo trì theo nhu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Phiên Cron và nhật ký chạy

Các lần chạy cron tách biệt cũng tạo mục phiên/bản ghi hội thoại, và chúng có các kiểm soát giữ lại riêng:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy cron tách biệt cũ khỏi kho lưu trữ phiên (`false` tắt).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` cắt tỉa các tệp `~/.openclaw/cron/runs/<jobId>.jsonl` (mặc định: `2_000_000` byte và `2000` dòng).

Khi cron buộc tạo một phiên chạy tách biệt mới, nó làm sạch mục phiên
`cron:<jobId>` trước đó trước khi ghi hàng mới. Nó mang theo các tùy chọn an toàn
như thiết lập thinking/fast/verbose, nhãn, và các ghi đè mô hình/xác thực do
người dùng chọn rõ ràng. Nó loại bỏ ngữ cảnh hội thoại bao quanh như định tuyến
kênh/nhóm, chính sách gửi hoặc hàng đợi, nâng quyền, nguồn gốc, và ràng buộc
runtime ACP để một lần chạy tách biệt mới không thể kế thừa quyền chuyển phát hoặc
runtime cũ từ lần chạy trước.

---

## Khóa phiên (`sessionKey`)

`sessionKey` xác định _bạn đang ở bucket hội thoại nào_ (định tuyến + tách biệt).

Các mẫu phổ biến:

- Trò chuyện chính/trực tiếp (theo agent): `agent:<agentId>:<mainKey>` (mặc định `main`)
- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Phòng/kênh (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (trừ khi bị ghi đè)

Các quy tắc chuẩn được ghi lại tại [/concepts/session](/vi/concepts/session).

---

## Id phiên (`sessionId`)

Mỗi `sessionKey` trỏ tới một `sessionId` hiện tại (tệp bản ghi hội thoại tiếp tục cuộc trò chuyện).

Quy tắc kinh nghiệm:

- **Đặt lại** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Đặt lại hằng ngày** (mặc định 4:00 sáng theo giờ cục bộ trên máy chủ gateway) tạo một `sessionId` mới ở thông điệp tiếp theo sau ranh giới đặt lại.
- **Hết hạn do nhàn rỗi** (`session.reset.idleMinutes` hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi thông điệp đến sau khoảng thời gian nhàn rỗi. Khi cả đặt lại hằng ngày + nhàn rỗi đều được cấu hình, điều kiện nào hết hạn trước sẽ thắng.
- **Sự kiện hệ thống** (heartbeat, cron wakeup, thông báo exec, ghi sổ gateway) có thể thay đổi hàng phiên nhưng không kéo dài độ mới cho đặt lại hằng ngày/nhàn rỗi. Rollover đặt lại loại bỏ các thông báo sự kiện hệ thống đã xếp hàng cho phiên trước trước khi prompt mới được dựng.
- **Chốt bảo vệ fork cha của luồng** (`session.parentForkMaxTokens`, mặc định `100000`) bỏ qua việc fork bản ghi hội thoại cha khi phiên cha đã quá lớn; luồng mới bắt đầu mới. Đặt `0` để tắt.

Chi tiết triển khai: quyết định này diễn ra trong `initSessionState()` tại `src/auto-reply/reply/session.ts`.

---

## Schema kho lưu trữ phiên (`sessions.json`)

Kiểu giá trị của kho lưu trữ là `SessionEntry` trong `src/config/sessions.ts`.

Các trường chính (không đầy đủ):

- `sessionId`: id bản ghi hội thoại hiện tại (tên tệp được suy ra từ đây trừ khi `sessionFile` được đặt)
- `sessionStartedAt`: dấu thời gian bắt đầu cho `sessionId` hiện tại; độ mới
  khi đặt lại hằng ngày dùng trường này. Các hàng cũ có thể suy ra nó từ header phiên JSONL.
- `lastInteractionAt`: dấu thời gian tương tác người dùng/kênh thực gần nhất; độ mới
  khi đặt lại nhàn rỗi dùng trường này để heartbeat, cron và sự kiện exec không giữ
  phiên sống. Các hàng cũ không có trường này sẽ fallback về thời điểm bắt đầu phiên
  đã khôi phục cho độ mới nhàn rỗi.
- `updatedAt`: dấu thời gian lần thay đổi hàng kho lưu trữ gần nhất, dùng để liệt kê, cắt tỉa và
  ghi sổ. Nó không phải là thẩm quyền cho độ mới đặt lại hằng ngày/nhàn rỗi.
- `sessionFile`: ghi đè đường dẫn bản ghi hội thoại rõ ràng tùy chọn
- `chatType`: `direct | group | room` (giúp UI và chính sách gửi)
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu để gắn nhãn nhóm/kênh
- Công tắc bật/tắt:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (ghi đè theo phiên)
- Chọn mô hình:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (nỗ lực tốt nhất / phụ thuộc nhà cung cấp):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần tự động Compaction hoàn tất cho khóa phiên này
- `memoryFlushAt`: dấu thời gian của lần flush bộ nhớ tiền Compaction gần nhất
- `memoryFlushCompactionCount`: số lần Compaction khi lần flush gần nhất chạy

Kho lưu trữ an toàn để chỉnh sửa, nhưng Gateway là thẩm quyền: nó có thể ghi lại hoặc nạp lại mục khi phiên chạy.

---

## Cấu trúc bản ghi hội thoại (`*.jsonl`)

Bản ghi hội thoại được quản lý bởi `SessionManager` của `@mariozechner/pi-coding-agent`.

Tệp là JSONL:

- Dòng đầu: header phiên (`type: "session"`, bao gồm `id`, `cwd`, `timestamp`, `parentSession` tùy chọn)
- Sau đó: các mục phiên với `id` + `parentId` (cây)

Các kiểu mục đáng chú ý:

- `message`: thông điệp user/assistant/toolResult
- `custom_message`: thông điệp do tiện ích mở rộng chèn vào _có_ đi vào ngữ cảnh mô hình (có thể bị ẩn khỏi UI)
- `custom`: trạng thái tiện ích mở rộng _không_ đi vào ngữ cảnh mô hình
- `compaction`: tóm tắt Compaction được lưu bền vững với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: tóm tắt được lưu bền vững khi điều hướng một nhánh cây

OpenClaw cố ý **không** "chỉnh sửa" bản ghi hội thoại; Gateway dùng `SessionManager` để đọc/ghi chúng.

---

## Cửa sổ ngữ cảnh so với token được theo dõi

Có hai khái niệm khác nhau cần lưu ý:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng theo từng mô hình (token hiển thị với mô hình)
2. **Bộ đếm kho lưu trữ phiên**: thống kê cuộn được ghi vào `sessions.json` (dùng cho /status và dashboard)

Nếu bạn đang tinh chỉnh giới hạn:

- Cửa sổ ngữ cảnh đến từ catalog mô hình (và có thể được ghi đè qua cấu hình).
- `contextTokens` trong kho lưu trữ là giá trị ước tính/báo cáo lúc chạy; đừng xem nó là bảo đảm nghiêm ngặt.

Xem thêm tại [/token-use](/vi/reference/token-use).

---

## Compaction: nó là gì

Compaction tóm tắt hội thoại cũ hơn thành một mục `compaction` được lưu bền vững trong bản ghi hội thoại và giữ nguyên các thông điệp gần đây.

Sau Compaction, các lượt sau sẽ thấy:

- Tóm tắt Compaction
- Các thông điệp sau `firstKeptEntryId`

Compaction là **bền vững** (khác với cắt tỉa phiên). Xem [/concepts/session-pruning](/vi/concepts/session-pruning).

## Ranh giới khối Compaction và ghép cặp công cụ

Khi OpenClaw chia một bản ghi hội thoại dài thành các khối Compaction, nó giữ
các lời gọi công cụ của assistant ghép cặp với các mục `toolResult` khớp tương ứng.

- Nếu điểm chia theo tỷ lệ token rơi vào giữa một lời gọi công cụ và kết quả của nó, OpenClaw
  dịch ranh giới tới thông điệp lời gọi công cụ của assistant thay vì tách
  cặp này.
- Nếu một khối kết quả công cụ ở cuối nếu giữ nguyên sẽ đẩy khối vượt mục tiêu,
  OpenClaw bảo toàn khối công cụ đang chờ đó và giữ nguyên phần đuôi chưa tóm tắt.
- Các khối lời gọi công cụ bị hủy/lỗi không giữ mở một điểm chia đang chờ.

---

## Khi tự động Compaction xảy ra (runtime Pi)

Trong agent Pi nhúng, tự động Compaction kích hoạt trong hai trường hợp:

1. **Khôi phục khi tràn**: mô hình trả về lỗi tràn ngữ cảnh
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, và các biến thể tương tự theo dạng nhà cung cấp) → compact → thử lại.
2. **Bảo trì theo ngưỡng**: sau một lượt thành công, khi:

`contextTokens > contextWindow - reserveTokens`

Trong đó:

- `contextWindow` là cửa sổ ngữ cảnh của mô hình
- `reserveTokens` là khoảng dự phòng dành cho prompt + đầu ra mô hình tiếp theo

Đây là ngữ nghĩa runtime Pi (OpenClaw tiêu thụ sự kiện, nhưng Pi quyết định khi nào compact).

OpenClaw cũng có thể kích hoạt Compaction cục bộ trước khi chạy trước khi mở lượt
chạy tiếp theo khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt và tệp
bản ghi hội thoại đang hoạt động đạt tới kích thước đó. Đây là chốt bảo vệ kích thước tệp cho chi phí
mở lại cục bộ, không phải lưu trữ thô: OpenClaw vẫn chạy Compaction ngữ nghĩa bình thường,
và nó yêu cầu `truncateAfterCompaction` để tóm tắt đã compact có thể trở thành
bản ghi hội thoại kế nhiệm mới.

Đối với các lượt chạy Pi nhúng, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
thêm một cơ chế bảo vệ vòng lặp công cụ dạng tùy chọn bật. Sau khi một kết quả công cụ được thêm vào và trước
lượt gọi mô hình tiếp theo, OpenClaw ước tính áp lực prompt bằng cùng logic ngân sách preflight
được dùng khi bắt đầu lượt. Nếu ngữ cảnh không còn vừa, cơ chế bảo vệ này
không compact bên trong hook `transformContext` của Pi. Nó phát ra một tín hiệu precheck giữa lượt
có cấu trúc, dừng lần gửi prompt hiện tại, và để
vòng lặp chạy bên ngoài dùng đường dẫn khôi phục hiện có: cắt bớt các kết quả công cụ quá lớn
khi như vậy là đủ, hoặc kích hoạt chế độ Compaction đã cấu hình rồi thử lại. Tùy chọn này
bị tắt theo mặc định và hoạt động với cả hai chế độ Compaction `default` và `safeguard`,
bao gồm Compaction safeguard do nhà cung cấp hỗ trợ.
Điều này độc lập với `maxActiveTranscriptBytes`: cơ chế bảo vệ theo kích thước byte chạy
trước khi một lượt mở ra, còn precheck giữa lượt chạy muộn hơn trong vòng lặp công cụ Pi nhúng
sau khi các kết quả công cụ mới đã được thêm vào.

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

OpenClaw cũng áp dụng một ngưỡng sàn an toàn cho các lượt chạy nhúng:

- Nếu `compaction.reserveTokens < reserveTokensFloor`, OpenClaw sẽ nâng nó lên.
- Sàn mặc định là `20000` token.
- Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để tắt sàn.
- Nếu giá trị đã cao hơn, OpenClaw giữ nguyên.
- Lệnh `/compact` thủ công tôn trọng một `agents.defaults.compaction.keepRecentTokens`
  rõ ràng và giữ điểm cắt phần đuôi gần đây của Pi. Nếu không có ngân sách giữ lại rõ ràng,
  Compaction thủ công vẫn là một checkpoint cứng và ngữ cảnh được dựng lại bắt đầu từ
  bản tóm tắt mới.
- Đặt `agents.defaults.compaction.midTurnPrecheck.enabled: true` để chạy precheck vòng lặp công cụ
  tùy chọn sau các kết quả công cụ mới và trước lượt gọi mô hình tiếp theo. Đây chỉ là một trình kích hoạt;
  việc tạo tóm tắt vẫn dùng đường dẫn Compaction đã cấu hình. Nó độc lập với `maxActiveTranscriptBytes`, vốn là
  cơ chế bảo vệ theo kích thước byte active-transcript khi bắt đầu lượt.
- Đặt `agents.defaults.compaction.maxActiveTranscriptBytes` thành một giá trị byte hoặc
  chuỗi như `"20mb"` để chạy Compaction cục bộ trước một lượt khi transcript đang hoạt động
  trở nên lớn. Cơ chế bảo vệ này chỉ hoạt động khi
  `truncateAfterCompaction` cũng được bật. Để trống hoặc đặt `0` để
  tắt.
- Khi `agents.defaults.compaction.truncateAfterCompaction` được bật,
  OpenClaw xoay transcript đang hoạt động sang một JSONL kế nhiệm đã được compact sau
  Compaction. Transcript đầy đủ cũ vẫn được lưu trữ và liên kết từ
  checkpoint Compaction thay vì bị ghi lại tại chỗ.

Lý do: chừa đủ khoảng trống cho các tác vụ “dọn dẹp” nhiều lượt (như ghi bộ nhớ) trước khi Compaction trở nên không thể tránh khỏi.

Triển khai: `ensurePiCompactionReserveTokens()` trong `src/agents/pi-settings.ts`
(được gọi từ `src/agents/pi-embedded-runner.ts`).

---

## Nhà cung cấp Compaction có thể cắm thêm

Các Plugin có thể đăng ký một nhà cung cấp Compaction qua `registerCompactionProvider()` trên API Plugin. Khi `agents.defaults.compaction.provider` được đặt thành id của một nhà cung cấp đã đăng ký, phần mở rộng safeguard ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì pipeline `summarizeInStages` tích hợp sẵn.

- `provider`: id của một Plugin nhà cung cấp Compaction đã đăng ký. Để trống để dùng tóm tắt LLM mặc định.
- Đặt một `provider` sẽ buộc `mode: "safeguard"`.
- Các nhà cung cấp nhận cùng chỉ dẫn Compaction và chính sách giữ nguyên định danh như đường dẫn tích hợp sẵn.
- Safeguard vẫn giữ ngữ cảnh hậu tố của lượt gần đây và lượt bị tách sau đầu ra của nhà cung cấp.
- Tóm tắt safeguard tích hợp sẵn chưng cất lại các bản tóm tắt trước đó cùng với thông điệp mới
  thay vì giữ nguyên văn toàn bộ bản tóm tắt trước.
- Chế độ safeguard bật kiểm tra chất lượng tóm tắt theo mặc định; đặt
  `qualityGuard.enabled: false` để bỏ qua hành vi thử lại khi đầu ra sai định dạng.
- Nếu nhà cung cấp thất bại hoặc trả về kết quả rỗng, OpenClaw tự động quay lại dùng tóm tắt LLM tích hợp sẵn.
- Tín hiệu hủy/hết thời gian chờ được ném lại (không bị nuốt) để tôn trọng việc hủy từ bên gọi.

Nguồn: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Bề mặt người dùng có thể thấy

Bạn có thể quan sát Compaction và trạng thái phiên qua:

- `/status` (trong bất kỳ phiên trò chuyện nào)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Chế độ chi tiết: `🧹 Auto-compaction complete` + số lần Compaction

---

## Dọn dẹp im lặng (`NO_REPLY`)

OpenClaw hỗ trợ các lượt “im lặng” cho tác vụ nền khi người dùng không nên thấy đầu ra trung gian.

Quy ước:

- Trợ lý bắt đầu đầu ra bằng token im lặng chính xác `NO_REPLY` /
  `no_reply` để biểu thị “không gửi phản hồi cho người dùng”.
- OpenClaw loại bỏ/chặn nội dung này ở lớp gửi.
- Việc chặn token im lặng chính xác không phân biệt chữ hoa chữ thường, nên `NO_REPLY` và
  `no_reply` đều được tính khi toàn bộ payload chỉ là token im lặng.
- Cơ chế này chỉ dành cho các lượt nền/không gửi phản hồi thật sự; nó không phải lối tắt cho
  các yêu cầu người dùng thông thường cần hành động.

Kể từ `2026.1.10`, OpenClaw cũng chặn **streaming bản nháp/đang nhập** khi một
chunk một phần bắt đầu bằng `NO_REPLY`, để các thao tác im lặng không rò rỉ đầu ra
một phần giữa lượt.

---

## "Xả bộ nhớ" trước Compaction (đã triển khai)

Mục tiêu: trước khi tự động Compaction xảy ra, chạy một lượt agentic im lặng để ghi trạng thái bền vững
vào đĩa (ví dụ `memory/YYYY-MM-DD.md` trong workspace của agent) để Compaction không thể
xóa ngữ cảnh quan trọng.

OpenClaw dùng cách tiếp cận **xả trước ngưỡng**:

1. Theo dõi mức sử dụng ngữ cảnh của phiên.
2. Khi nó vượt qua một “ngưỡng mềm” (thấp hơn ngưỡng Compaction của Pi), chạy một chỉ thị im lặng
   “ghi bộ nhớ ngay” cho agent.
3. Dùng token im lặng chính xác `NO_REPLY` / `no_reply` để người dùng
   không thấy gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`):

- `enabled` (mặc định: `true`)
- `model` (tùy chọn ghi đè chính xác nhà cung cấp/mô hình cho lượt xả, ví dụ `ollama/qwen3:8b`)
- `softThresholdTokens` (mặc định: `4000`)
- `prompt` (thông điệp người dùng cho lượt xả)
- `systemPrompt` (prompt hệ thống bổ sung được thêm vào cho lượt xả)

Ghi chú:

- Prompt/prompt hệ thống mặc định bao gồm gợi ý `NO_REPLY` để chặn
  việc gửi.
- Khi `model` được đặt, lượt xả dùng mô hình đó mà không kế thừa
  chuỗi fallback của phiên đang hoạt động, nên tác vụ dọn dẹp chỉ cục bộ không âm thầm
  fallback sang một mô hình hội thoại trả phí.
- Lượt xả chạy một lần cho mỗi chu kỳ Compaction (được theo dõi trong `sessions.json`).
- Lượt xả chỉ chạy cho các phiên Pi nhúng (backend CLI bỏ qua nó).
- Lượt xả được bỏ qua khi workspace của phiên ở chế độ chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Memory](/vi/concepts/memory) để biết bố cục tệp workspace và mẫu ghi.

Pi cũng cung cấp một hook `session_before_compact` trong API phần mở rộng, nhưng logic
xả của OpenClaw hiện nằm ở phía Gateway.

---

## Danh sách kiểm tra khắc phục sự cố

- Sai khóa phiên? Bắt đầu với [/concepts/session](/vi/concepts/session) và xác nhận `sessionKey` trong `/status`.
- Không khớp giữa kho lưu trữ và transcript? Xác nhận máy chủ Gateway và đường dẫn kho lưu trữ từ `openclaw status`.
- Compaction quá thường xuyên? Kiểm tra:
  - cửa sổ ngữ cảnh mô hình (quá nhỏ)
  - thiết lập Compaction (`reserveTokens` quá cao so với cửa sổ mô hình có thể gây Compaction sớm hơn)
  - phình to kết quả công cụ: bật/tinh chỉnh cắt tỉa phiên
- Lượt im lặng bị rò rỉ? Xác nhận phản hồi bắt đầu bằng `NO_REPLY` (token chính xác không phân biệt chữ hoa chữ thường) và bạn đang dùng bản dựng có bản sửa chặn streaming.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
