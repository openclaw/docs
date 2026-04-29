---
read_when:
    - Bạn cần gỡ lỗi ID phiên, JSONL bản ghi hội thoại, hoặc các trường sessions.json
    - Bạn đang thay đổi hành vi Compaction tự động hoặc thêm công việc dọn dẹp trước Compaction
    - Bạn muốn triển khai các lần xả bộ nhớ hoặc các lượt hệ thống im lặng
summary: 'Chuyên sâu: kho lưu trữ phiên + bản ghi hội thoại, vòng đời và cơ chế nội bộ của Compaction (tự động)'
title: Phân tích chuyên sâu về quản lý phiên
x-i18n:
    generated_at: "2026-04-29T23:12:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw quản lý phiên từ đầu đến cuối trên các khu vực sau:

- **Định tuyến phiên** (cách thông điệp đến được ánh xạ tới một `sessionKey`)
- **Kho phiên** (`sessions.json`) và những gì nó theo dõi
- **Lưu bền transcript** (`*.jsonl`) và cấu trúc của nó
- **Vệ sinh transcript** (các hiệu chỉnh theo từng nhà cung cấp trước khi chạy)
- **Giới hạn ngữ cảnh** (cửa sổ ngữ cảnh so với token được theo dõi)
- **Compaction** (thủ công và tự động) và nơi móc công việc trước Compaction
- **Dọn dẹp ngầm** (ghi bộ nhớ không nên tạo đầu ra hiển thị cho người dùng)

Nếu bạn muốn xem tổng quan cấp cao hơn trước, hãy bắt đầu với:

- [Quản lý phiên](/vi/concepts/session)
- [Compaction](/vi/concepts/compaction)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Vệ sinh transcript](/vi/reference/transcript-hygiene)

---

## Nguồn chân lý: Gateway

OpenClaw được thiết kế quanh một **tiến trình Gateway** duy nhất sở hữu trạng thái phiên.

- UI (ứng dụng macOS, web Control UI, TUI) nên truy vấn Gateway để lấy danh sách phiên và số lượng token.
- Ở chế độ từ xa, tệp phiên nằm trên máy chủ từ xa; “kiểm tra các tệp cục bộ trên Mac của bạn” sẽ không phản ánh những gì Gateway đang dùng.

---

## Hai lớp lưu bền

OpenClaw lưu bền phiên trong hai lớp:

1. **Kho phiên (`sessions.json`)**
   - Bản đồ khóa/giá trị: `sessionKey -> SessionEntry`
   - Nhỏ, có thể thay đổi, an toàn để chỉnh sửa (hoặc xóa mục)
   - Theo dõi siêu dữ liệu phiên (id phiên hiện tại, hoạt động gần nhất, nút bật/tắt, bộ đếm token, v.v.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Transcript chỉ ghi thêm với cấu trúc cây (các mục có `id` + `parentId`)
   - Lưu cuộc trò chuyện thực tế + lệnh gọi công cụ + tóm tắt Compaction
   - Được dùng để dựng lại ngữ cảnh mô hình cho các lượt sau
   - Các checkpoint gỡ lỗi lớn trước Compaction được bỏ qua khi transcript đang hoạt động vượt quá giới hạn kích thước checkpoint, tránh tạo thêm một bản sao `.checkpoint.*.jsonl` khổng lồ thứ hai.

---

## Vị trí trên đĩa

Theo từng agent, trên máy chủ Gateway:

- Kho: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Phiên chủ đề Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw phân giải các đường dẫn này qua `src/config/sessions.ts`.

---

## Bảo trì kho và kiểm soát đĩa

Lưu bền phiên có các cơ chế kiểm soát bảo trì tự động (`session.maintenance`) cho `sessions.json`, artifact transcript và sidecar trajectory:

- `mode`: `warn` (mặc định) hoặc `enforce`
- `pruneAfter`: ngưỡng tuổi của mục cũ (mặc định `30d`)
- `maxEntries`: giới hạn số mục trong `sessions.json` (mặc định `500`)
- `resetArchiveRetention`: thời gian lưu trữ cho archive transcript `*.reset.<timestamp>` (mặc định: giống `pruneAfter`; `false` tắt dọn dẹp)
- `maxDiskBytes`: ngân sách tùy chọn cho thư mục phiên
- `highWaterBytes`: mục tiêu tùy chọn sau dọn dẹp (mặc định `80%` của `maxDiskBytes`)

Các lần ghi Gateway bình thường gom dọn dẹp `maxEntries` theo lô cho các giới hạn cỡ production, nên kho có thể tạm thời vượt quá giới hạn đã cấu hình trước khi lần dọn dẹp mức nước cao tiếp theo ghi lại và giảm xuống. `openclaw sessions cleanup --enforce` vẫn áp dụng giới hạn đã cấu hình ngay lập tức.

OpenClaw không còn tạo bản sao lưu xoay vòng tự động `sessions.json.bak.*` trong khi Gateway ghi. Khóa cũ `session.maintenance.rotateBytes` bị bỏ qua và `openclaw doctor --fix` xóa nó khỏi các cấu hình cũ hơn.

Thứ tự thực thi dọn dẹp ngân sách đĩa (`mode: "enforce"`):

1. Xóa artifact archive cũ nhất, transcript mồ côi hoặc trajectory mồ côi trước.
2. Nếu vẫn vượt mục tiêu, loại bỏ các mục phiên cũ nhất và tệp transcript/trajectory của chúng.
3. Tiếp tục cho đến khi mức sử dụng bằng hoặc thấp hơn `highWaterBytes`.

Trong `mode: "warn"`, OpenClaw báo cáo các mục có thể bị loại bỏ nhưng không thay đổi kho/tệp.

Chạy bảo trì theo nhu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Phiên Cron và nhật ký chạy

Các lần chạy Cron cô lập cũng tạo mục phiên/transcript, và chúng có cơ chế kiểm soát thời gian lưu giữ riêng:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy Cron cô lập cũ khỏi kho phiên (`false` tắt).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` cắt tỉa các tệp `~/.openclaw/cron/runs/<jobId>.jsonl` (mặc định: `2_000_000` byte và `2000` dòng).

Khi Cron buộc tạo một phiên chạy cô lập mới, nó làm sạch mục phiên `cron:<jobId>` trước đó trước khi ghi hàng mới. Nó mang theo các tùy chọn an toàn như thiết lập thinking/fast/verbose, nhãn và các ghi đè mô hình/xác thực do người dùng chọn rõ ràng. Nó bỏ ngữ cảnh hội thoại xung quanh như định tuyến kênh/nhóm, chính sách gửi hoặc hàng đợi, quyền nâng cao, nguồn gốc và liên kết runtime ACP để một lần chạy cô lập mới không thể kế thừa cơ chế phân phối hoặc thẩm quyền runtime đã cũ từ lần chạy trước.

---

## Khóa phiên (`sessionKey`)

Một `sessionKey` xác định _bạn đang ở trong bucket cuộc trò chuyện nào_ (định tuyến + cô lập).

Các mẫu phổ biến:

- Trò chuyện chính/trực tiếp (theo agent): `agent:<agentId>:<mainKey>` (mặc định `main`)
- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Phòng/kênh (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (trừ khi bị ghi đè)

Các quy tắc chuẩn được ghi lại tại [/concepts/session](/vi/concepts/session).

---

## ID phiên (`sessionId`)

Mỗi `sessionKey` trỏ tới một `sessionId` hiện tại (tệp transcript tiếp tục cuộc trò chuyện).

Quy tắc kinh nghiệm:

- **Đặt lại** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Đặt lại hằng ngày** (mặc định 4:00 sáng giờ địa phương trên máy chủ Gateway) tạo một `sessionId` mới ở thông điệp kế tiếp sau ranh giới đặt lại.
- **Hết hạn do không hoạt động** (`session.reset.idleMinutes` hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi có thông điệp đến sau cửa sổ không hoạt động. Khi cả đặt lại hằng ngày và không hoạt động đều được cấu hình, điều nào hết hạn trước sẽ thắng.
- **Sự kiện hệ thống** (Heartbeat, đánh thức Cron, thông báo exec, sổ sách Gateway) có thể thay đổi hàng phiên nhưng không kéo dài độ mới của đặt lại hằng ngày/không hoạt động. Khi chuyển kỳ đặt lại, các thông báo sự kiện hệ thống đang xếp hàng cho phiên trước bị loại bỏ trước khi prompt mới được dựng.
- **Bộ bảo vệ rẽ nhánh parent của thread** (`session.parentForkMaxTokens`, mặc định `100000`) bỏ qua việc rẽ nhánh transcript parent khi phiên parent đã quá lớn; thread mới bắt đầu sạch. Đặt `0` để tắt.

Chi tiết triển khai: quyết định diễn ra trong `initSessionState()` ở `src/auto-reply/reply/session.ts`.

---

## Schema kho phiên (`sessions.json`)

Kiểu giá trị của kho là `SessionEntry` trong `src/config/sessions.ts`.

Các trường chính (không đầy đủ):

- `sessionId`: id transcript hiện tại (tên tệp được suy ra từ đây trừ khi `sessionFile` được đặt)
- `sessionStartedAt`: dấu thời gian bắt đầu cho `sessionId` hiện tại; độ mới của đặt lại hằng ngày dùng trường này. Các hàng cũ có thể suy ra nó từ header phiên JSONL.
- `lastInteractionAt`: dấu thời gian tương tác thực của người dùng/kênh gần nhất; độ mới của đặt lại do không hoạt động dùng trường này để Heartbeat, Cron và sự kiện exec không giữ phiên sống. Các hàng cũ không có trường này sẽ quay về thời điểm bắt đầu phiên được khôi phục cho độ mới không hoạt động.
- `updatedAt`: dấu thời gian thay đổi hàng kho gần nhất, dùng cho liệt kê, cắt tỉa và sổ sách. Nó không phải là căn cứ cho độ mới của đặt lại hằng ngày/không hoạt động.
- `sessionFile`: ghi đè đường dẫn transcript tường minh tùy chọn
- `chatType`: `direct | group | room` (giúp UI và chính sách gửi)
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu để gắn nhãn nhóm/kênh
- Nút bật/tắt:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (ghi đè theo từng phiên)
- Chọn mô hình:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (nỗ lực tối đa / phụ thuộc nhà cung cấp):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần tự động Compaction hoàn tất cho khóa phiên này
- `memoryFlushAt`: dấu thời gian của lần flush bộ nhớ trước Compaction gần nhất
- `memoryFlushCompactionCount`: số lần Compaction tại thời điểm lần flush gần nhất chạy

Kho an toàn để chỉnh sửa, nhưng Gateway là nguồn có thẩm quyền: nó có thể ghi lại hoặc tái tạo các mục khi phiên chạy.

---

## Cấu trúc transcript (`*.jsonl`)

Transcript được quản lý bởi `SessionManager` của `@mariozechner/pi-coding-agent`.

Tệp là JSONL:

- Dòng đầu tiên: header phiên (`type: "session"`, bao gồm `id`, `cwd`, `timestamp`, `parentSession` tùy chọn)
- Sau đó: các mục phiên có `id` + `parentId` (cây)

Các kiểu mục đáng chú ý:

- `message`: thông điệp người dùng/assistant/toolResult
- `custom_message`: thông điệp do tiện ích mở rộng chèn vào và _có_ đi vào ngữ cảnh mô hình (có thể ẩn khỏi UI)
- `custom`: trạng thái tiện ích mở rộng _không_ đi vào ngữ cảnh mô hình
- `compaction`: tóm tắt Compaction đã lưu bền với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: tóm tắt đã lưu bền khi điều hướng một nhánh cây

OpenClaw cố ý **không** “hiệu chỉnh” transcript; Gateway dùng `SessionManager` để đọc/ghi chúng.

---

## Cửa sổ ngữ cảnh so với token được theo dõi

Có hai khái niệm khác nhau quan trọng:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng theo từng mô hình (token hiển thị cho mô hình)
2. **Bộ đếm kho phiên**: thống kê cuộn được ghi vào `sessions.json` (dùng cho /status và dashboard)

Nếu bạn đang tinh chỉnh giới hạn:

- Cửa sổ ngữ cảnh đến từ catalog mô hình (và có thể được ghi đè qua cấu hình).
- `contextTokens` trong kho là giá trị ước tính/báo cáo runtime; đừng xem nó là bảo đảm nghiêm ngặt.

Để biết thêm, xem [/token-use](/vi/reference/token-use).

---

## Compaction: đó là gì

Compaction tóm tắt cuộc trò chuyện cũ hơn vào một mục `compaction` được lưu bền trong transcript và giữ nguyên các thông điệp gần đây.

Sau Compaction, các lượt sau thấy:

- Tóm tắt Compaction
- Các thông điệp sau `firstKeptEntryId`

Compaction là **lưu bền** (không giống cắt tỉa phiên). Xem [/concepts/session-pruning](/vi/concepts/session-pruning).

## Ranh giới chunk Compaction và ghép cặp công cụ

Khi OpenClaw chia một transcript dài thành các chunk Compaction, nó giữ các lệnh gọi công cụ của assistant được ghép với các mục `toolResult` tương ứng.

- Nếu điểm chia theo tỷ lệ token rơi vào giữa một lệnh gọi công cụ và kết quả của nó, OpenClaw dịch ranh giới tới thông điệp lệnh gọi công cụ của assistant thay vì tách cặp đó.
- Nếu một khối kết quả công cụ ở cuối nếu giữ nguyên sẽ đẩy chunk vượt mục tiêu, OpenClaw bảo toàn khối công cụ đang chờ đó và giữ nguyên phần đuôi chưa được tóm tắt.
- Các khối lệnh gọi công cụ bị hủy/lỗi không giữ một điểm chia đang chờ mở.

---

## Khi tự động Compaction diễn ra (runtime Pi)

Trong agent Pi nhúng, tự động Compaction kích hoạt trong hai trường hợp:

1. **Khôi phục tràn**: mô hình trả về lỗi tràn ngữ cảnh
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, và các biến thể tương tự theo dạng nhà cung cấp) → compact → thử lại.
2. **Bảo trì theo ngưỡng**: sau một lượt thành công, khi:

`contextTokens > contextWindow - reserveTokens`

Trong đó:

- `contextWindow` là cửa sổ ngữ cảnh của mô hình
- `reserveTokens` là khoảng trống dự phòng dành cho prompt + đầu ra mô hình tiếp theo

Đây là ngữ nghĩa runtime Pi (OpenClaw tiêu thụ các sự kiện, nhưng Pi quyết định khi nào compact).

OpenClaw cũng có thể kích hoạt Compaction cục bộ trước khi chạy trước khi mở lần chạy tiếp theo khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt và tệp transcript đang hoạt động đạt kích thước đó. Đây là bộ bảo vệ kích thước tệp cho chi phí mở lại cục bộ, không phải lưu trữ thô: OpenClaw vẫn chạy Compaction ngữ nghĩa bình thường, và nó yêu cầu `truncateAfterCompaction` để tóm tắt đã compact có thể trở thành transcript kế nhiệm mới.

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

OpenClaw cũng áp dụng một ngưỡng an toàn tối thiểu cho các lượt chạy nhúng:

- Nếu `compaction.reserveTokens < reserveTokensFloor`, OpenClaw sẽ tăng giá trị đó lên.
- Ngưỡng mặc định là `20000` token.
- Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để tắt ngưỡng này.
- Nếu giá trị này đã cao hơn, OpenClaw sẽ giữ nguyên.
- Lệnh thủ công `/compact` tôn trọng `agents.defaults.compaction.keepRecentTokens`
  được đặt rõ ràng và giữ điểm cắt phần đuôi gần đây của Pi. Khi không có ngân sách giữ lại
  được đặt rõ ràng, compact thủ công vẫn là một điểm kiểm tra cứng và ngữ cảnh được dựng lại bắt đầu từ
  bản tóm tắt mới.
- Đặt `agents.defaults.compaction.maxActiveTranscriptBytes` thành một giá trị byte hoặc
  chuỗi như `"20mb"` để chạy compact cục bộ trước một lượt khi transcript đang hoạt động
  trở nên lớn. Cơ chế bảo vệ này chỉ hoạt động khi
  `truncateAfterCompaction` cũng được bật. Để trống hoặc đặt `0` để
  tắt.
- Khi `agents.defaults.compaction.truncateAfterCompaction` được bật,
  OpenClaw xoay transcript đang hoạt động sang một JSONL kế nhiệm đã được compact sau khi
  compact. Transcript đầy đủ cũ vẫn được lưu trữ và liên kết từ
  điểm kiểm tra compact thay vì bị ghi lại tại chỗ.

Lý do: chừa đủ khoảng trống cho “công việc dọn dẹp” nhiều lượt (như ghi bộ nhớ) trước khi việc compact trở nên không thể tránh khỏi.

Triển khai: `ensurePiCompactionReserveTokens()` trong `src/agents/pi-settings.ts`
(được gọi từ `src/agents/pi-embedded-runner.ts`).

---

## Nhà cung cấp compact có thể cắm

Plugin có thể đăng ký nhà cung cấp compact qua `registerCompactionProvider()` trên API plugin. Khi `agents.defaults.compaction.provider` được đặt thành id nhà cung cấp đã đăng ký, tiện ích bảo vệ sẽ ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì pipeline `summarizeInStages` tích hợp.

- `provider`: id của một Plugin nhà cung cấp compact đã đăng ký. Để trống để dùng tóm tắt LLM mặc định.
- Đặt `provider` sẽ buộc `mode: "safeguard"`.
- Nhà cung cấp nhận cùng chỉ dẫn compact và chính sách giữ nguyên mã định danh như đường dẫn tích hợp.
- Cơ chế bảo vệ vẫn giữ ngữ cảnh hậu tố của lượt gần đây và lượt bị tách sau đầu ra của nhà cung cấp.
- Tóm tắt bảo vệ tích hợp chưng cất lại các bản tóm tắt trước đó cùng với tin nhắn mới
  thay vì giữ nguyên văn toàn bộ bản tóm tắt trước đó.
- Chế độ bảo vệ bật kiểm tra chất lượng tóm tắt theo mặc định; đặt
  `qualityGuard.enabled: false` để bỏ qua hành vi thử lại khi đầu ra sai định dạng.
- Nếu nhà cung cấp thất bại hoặc trả về kết quả rỗng, OpenClaw tự động quay về tóm tắt LLM tích hợp.
- Tín hiệu hủy/hết thời gian chờ được ném lại (không bị nuốt) để tôn trọng việc hủy từ bên gọi.

Nguồn: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Bề mặt hiển thị cho người dùng

Bạn có thể quan sát trạng thái compact và phiên qua:

- `/status` (trong bất kỳ phiên trò chuyện nào)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Chế độ chi tiết: `🧹 Auto-compaction complete` + số lần compact

---

## Dọn dẹp im lặng (`NO_REPLY`)

OpenClaw hỗ trợ các lượt “im lặng” cho tác vụ nền, nơi người dùng không nên thấy đầu ra trung gian.

Quy ước:

- Trợ lý bắt đầu đầu ra bằng token im lặng chính xác `NO_REPLY` /
  `no_reply` để cho biết “không gửi câu trả lời cho người dùng”.
- OpenClaw loại bỏ/ẩn phần này ở lớp gửi đi.
- Việc ẩn token im lặng chính xác không phân biệt chữ hoa chữ thường, nên `NO_REPLY` và
  `no_reply` đều được tính khi toàn bộ payload chỉ là token im lặng.
- Cơ chế này chỉ dành cho các lượt nền/không gửi phản hồi thật sự; đây không phải lối tắt cho
  các yêu cầu người dùng thông thường cần hành động.

Kể từ `2026.1.10`, OpenClaw cũng ẩn **luồng nháp/đang nhập** khi một
chunk một phần bắt đầu bằng `NO_REPLY`, để thao tác im lặng không rò rỉ đầu ra một phần
giữa lượt.

---

## “Xả bộ nhớ” trước compact (đã triển khai)

Mục tiêu: trước khi auto-compact xảy ra, chạy một lượt tác nhân im lặng để ghi trạng thái
bền vững xuống đĩa (ví dụ `memory/YYYY-MM-DD.md` trong workspace của tác nhân) để compact không thể
xóa ngữ cảnh quan trọng.

OpenClaw dùng cách tiếp cận **xả trước ngưỡng**:

1. Theo dõi mức sử dụng ngữ cảnh của phiên.
2. Khi vượt qua một “ngưỡng mềm” (thấp hơn ngưỡng compact của Pi), chạy một chỉ thị im lặng
   “ghi bộ nhớ ngay” cho tác nhân.
3. Dùng token im lặng chính xác `NO_REPLY` / `no_reply` để người dùng không thấy
   gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`):

- `enabled` (mặc định: `true`)
- `model` (ghi đè chính xác nhà cung cấp/mô hình tùy chọn cho lượt xả, ví dụ `ollama/qwen3:8b`)
- `softThresholdTokens` (mặc định: `4000`)
- `prompt` (tin nhắn người dùng cho lượt xả)
- `systemPrompt` (system prompt bổ sung được nối thêm cho lượt xả)

Ghi chú:

- Prompt/system prompt mặc định bao gồm gợi ý `NO_REPLY` để ẩn
  việc gửi phản hồi.
- Khi `model` được đặt, lượt xả dùng mô hình đó mà không kế thừa chuỗi dự phòng của
  phiên đang hoạt động, để công việc dọn dẹp chỉ cục bộ không âm thầm
  chuyển về một mô hình hội thoại trả phí.
- Lượt xả chạy một lần cho mỗi chu kỳ compact (được theo dõi trong `sessions.json`).
- Lượt xả chỉ chạy cho các phiên Pi nhúng (backend CLI bỏ qua).
- Lượt xả bị bỏ qua khi workspace của phiên ở chế độ chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Bộ nhớ](/vi/concepts/memory) để biết bố cục tệp workspace và mẫu ghi.

Pi cũng cung cấp hook `session_before_compact` trong API extension, nhưng logic
xả của OpenClaw hiện nằm ở phía Gateway.

---

## Danh sách kiểm tra khắc phục sự cố

- Khóa phiên sai? Bắt đầu với [/concepts/session](/vi/concepts/session) và xác nhận `sessionKey` trong `/status`.
- Kho lưu trữ và transcript không khớp? Xác nhận máy chủ Gateway và đường dẫn kho lưu trữ từ `openclaw status`.
- Compact quá nhiều? Kiểm tra:
  - cửa sổ ngữ cảnh mô hình (quá nhỏ)
  - thiết lập compact (`reserveTokens` quá cao so với cửa sổ mô hình có thể khiến compact xảy ra sớm hơn)
  - kết quả công cụ phình to: bật/tinh chỉnh việc cắt tỉa phiên
- Lượt im lặng bị rò rỉ? Xác nhận câu trả lời bắt đầu bằng `NO_REPLY` (token chính xác không phân biệt chữ hoa chữ thường) và bạn đang dùng bản dựng có bản sửa ẩn luồng.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Bộ máy ngữ cảnh](/vi/concepts/context-engine)
