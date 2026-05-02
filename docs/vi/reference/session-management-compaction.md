---
read_when:
    - Bạn cần gỡ lỗi ID phiên, JSONL bản ghi hội thoại, hoặc các trường sessions.json
    - Bạn đang thay đổi hành vi tự động Compaction hoặc thêm tác vụ dọn dẹp “trước Compaction”
    - Bạn muốn triển khai các lần xả bộ nhớ hoặc các lượt hệ thống im lặng
summary: 'Tìm hiểu sâu: kho lưu trữ phiên + bản ghi hội thoại, vòng đời và nội bộ Compaction (tự động)'
title: Phân tích chuyên sâu về quản lý phiên
x-i18n:
    generated_at: "2026-05-02T10:52:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ca8a35210625051f5051e90a18a005d6103bc1d65d356c34f818d2bfc0058c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw quản lý phiên từ đầu đến cuối trên các khu vực này:

- **Định tuyến phiên** (cách thông điệp đến ánh xạ tới `sessionKey`)
- **Kho phiên** (`sessions.json`) và những gì nó theo dõi
- **Lưu bền bản ghi hội thoại** (`*.jsonl`) và cấu trúc của nó
- **Vệ sinh bản ghi hội thoại** (các chỉnh sửa theo từng nhà cung cấp trước khi chạy)
- **Giới hạn ngữ cảnh** (cửa sổ ngữ cảnh so với token được theo dõi)
- **Compaction** (Compaction thủ công và tự động) và nơi móc công việc trước Compaction
- **Dọn dẹp ngầm** (các lần ghi bộ nhớ không nên tạo đầu ra hiển thị cho người dùng)

Nếu trước tiên bạn muốn xem tổng quan ở cấp cao hơn, hãy bắt đầu với:

- [Quản lý phiên](/vi/concepts/session)
- [Compaction](/vi/concepts/compaction)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Vệ sinh bản ghi hội thoại](/vi/reference/transcript-hygiene)

---

## Nguồn chân lý: Gateway

OpenClaw được thiết kế xoay quanh một **tiến trình Gateway** duy nhất sở hữu trạng thái phiên.

- Các giao diện người dùng (ứng dụng macOS, Control UI trên web, TUI) nên truy vấn Gateway để lấy danh sách phiên và số lượng token.
- Ở chế độ từ xa, tệp phiên nằm trên máy chủ từ xa; “kiểm tra các tệp cục bộ trên Mac của bạn” sẽ không phản ánh những gì Gateway đang dùng.

---

## Hai lớp lưu bền

OpenClaw lưu bền phiên trong hai lớp:

1. **Kho phiên (`sessions.json`)**
   - Bản đồ khóa/giá trị: `sessionKey -> SessionEntry`
   - Nhỏ, có thể thay đổi, an toàn để chỉnh sửa (hoặc xóa mục)
   - Theo dõi siêu dữ liệu phiên (id phiên hiện tại, hoạt động gần nhất, công tắc, bộ đếm token, v.v.)

2. **Bản ghi hội thoại (`<sessionId>.jsonl`)**
   - Bản ghi hội thoại chỉ thêm vào với cấu trúc cây (các mục có `id` + `parentId`)
   - Lưu cuộc hội thoại thực tế + lệnh gọi công cụ + tóm tắt Compaction
   - Được dùng để dựng lại ngữ cảnh mô hình cho các lượt sau
   - Các checkpoint gỡ lỗi lớn trước Compaction được bỏ qua khi bản ghi hội thoại đang hoạt động vượt quá giới hạn kích thước checkpoint, tránh tạo thêm một bản sao `.checkpoint.*.jsonl` khổng lồ thứ hai.

Các trình đọc lịch sử Gateway nên tránh hiện thực hóa toàn bộ bản ghi hội thoại trừ khi bề mặt đó cần truy cập lịch sử tùy ý một cách rõ ràng. Lịch sử trang đầu, lịch sử trò chuyện nhúng, khôi phục sau khi khởi động lại, và kiểm tra token/mức sử dụng dùng các lần đọc phần đuôi có giới hạn. Các lần quét toàn bộ bản ghi hội thoại đi qua chỉ mục bản ghi hội thoại bất đồng bộ, được lưu đệm theo đường dẫn tệp cộng với `mtimeMs`/`size` và được chia sẻ giữa các trình đọc đồng thời.

---

## Vị trí trên đĩa

Theo từng agent, trên máy chủ Gateway:

- Kho: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Bản ghi hội thoại: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Phiên chủ đề Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw phân giải các vị trí này qua `src/config/sessions.ts`.

---

## Bảo trì kho và kiểm soát đĩa

Lưu bền phiên có các kiểm soát bảo trì tự động (`session.maintenance`) cho `sessions.json`, hiện vật bản ghi hội thoại, và sidecar quỹ đạo:

- `mode`: `warn` (mặc định) hoặc `enforce`
- `pruneAfter`: ngưỡng tuổi của mục cũ (mặc định `30d`)
- `maxEntries`: giới hạn số mục trong `sessions.json` (mặc định `500`)
- `resetArchiveRetention`: thời gian giữ lại cho các kho lưu trữ bản ghi hội thoại `*.reset.<timestamp>` (mặc định: giống `pruneAfter`; `false` tắt dọn dẹp)
- `maxDiskBytes`: ngân sách tùy chọn cho thư mục phiên
- `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp (mặc định `80%` của `maxDiskBytes`)

Các lần ghi Gateway thông thường gom nhóm dọn dẹp `maxEntries` cho các giới hạn cỡ production, nên một kho có thể tạm thời vượt quá giới hạn đã cấu hình trước khi lần dọn dẹp mực nước cao tiếp theo ghi lại để hạ xuống. Các lần đọc kho phiên không cắt tỉa hoặc giới hạn mục trong lúc Gateway khởi động; dùng các lần ghi hoặc `openclaw sessions cleanup --enforce` để dọn dẹp. `openclaw sessions cleanup --enforce` vẫn áp dụng giới hạn đã cấu hình ngay lập tức.

Bảo trì giữ lại các con trỏ cuộc hội thoại bên ngoài bền vững như phiên nhóm và phiên trò chuyện theo luồng, nhưng các mục runtime tổng hợp cho Cron, hook, Heartbeat, ACP, và sub-agent vẫn có thể bị xóa khi chúng vượt quá ngân sách tuổi, số lượng, hoặc đĩa đã cấu hình.

OpenClaw không còn tạo các bản sao lưu xoay vòng `sessions.json.bak.*` tự động trong các lần ghi Gateway. Khóa `session.maintenance.rotateBytes` cũ bị bỏ qua và `openclaw doctor --fix` xóa khóa đó khỏi các cấu hình cũ hơn.

Thứ tự thực thi khi dọn dẹp theo ngân sách đĩa (`mode: "enforce"`):

1. Trước tiên xóa các hiện vật lưu trữ, bản ghi hội thoại mồ côi, hoặc quỹ đạo mồ côi cũ nhất.
2. Nếu vẫn vượt quá mục tiêu, loại bỏ các mục phiên cũ nhất và các tệp bản ghi hội thoại/quỹ đạo của chúng.
3. Tiếp tục cho đến khi mức sử dụng bằng hoặc thấp hơn `highWaterBytes`.

Trong `mode: "warn"`, OpenClaw báo cáo các trường hợp có thể bị loại bỏ nhưng không thay đổi kho/tệp.

Chạy bảo trì theo yêu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Phiên Cron và nhật ký chạy

Các lần chạy Cron cô lập cũng tạo mục phiên/bản ghi hội thoại, và chúng có các kiểm soát giữ lại riêng:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy Cron cô lập cũ khỏi kho phiên (`false` tắt).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` cắt tỉa các tệp `~/.openclaw/cron/runs/<jobId>.jsonl` (mặc định: `2_000_000` byte và `2000` dòng).

Khi Cron buộc tạo một phiên chạy cô lập mới, nó làm sạch mục phiên `cron:<jobId>` trước đó trước khi ghi hàng mới. Nó mang theo các tùy chọn an toàn như thiết lập thinking/fast/verbose, nhãn, và các ghi đè mô hình/xác thực do người dùng chọn rõ ràng. Nó bỏ ngữ cảnh cuộc hội thoại môi trường như định tuyến kênh/nhóm, chính sách gửi hoặc hàng đợi, nâng quyền, nguồn gốc, và liên kết runtime ACP để một lần chạy cô lập mới không thể kế thừa thẩm quyền phân phối hoặc runtime đã cũ từ một lần chạy cũ hơn.

---

## Khóa phiên (`sessionKey`)

`sessionKey` xác định _bạn đang ở nhóm cuộc hội thoại nào_ (định tuyến + cô lập).

Các mẫu phổ biến:

- Trò chuyện chính/trực tiếp (theo agent): `agent:<agentId>:<mainKey>` (mặc định `main`)
- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Phòng/kênh (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (trừ khi bị ghi đè)

Các quy tắc chuẩn được ghi lại tại [/concepts/session](/vi/concepts/session).

---

## Id phiên (`sessionId`)

Mỗi `sessionKey` trỏ tới một `sessionId` hiện tại (tệp bản ghi hội thoại tiếp tục cuộc hội thoại).

Quy tắc kinh nghiệm:

- **Đặt lại** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Đặt lại hằng ngày** (mặc định 4:00 sáng giờ địa phương trên máy chủ gateway) tạo một `sessionId` mới ở thông điệp tiếp theo sau ranh giới đặt lại.
- **Hết hạn do nhàn rỗi** (`session.reset.idleMinutes` hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi có thông điệp đến sau cửa sổ nhàn rỗi. Khi cả hằng ngày + nhàn rỗi đều được cấu hình, cái nào hết hạn trước sẽ thắng.
- **Sự kiện hệ thống** (heartbeat, đánh thức Cron, thông báo exec, ghi sổ Gateway) có thể thay đổi hàng phiên nhưng không kéo dài độ mới cho đặt lại hằng ngày/nhàn rỗi. Chuyển vòng đặt lại loại bỏ các thông báo sự kiện hệ thống đã xếp hàng cho phiên trước trước khi prompt mới được tạo.
- **Chính sách fork cha** dùng nhánh đang hoạt động của Pi khi tạo một luồng hoặc fork subagent. Nếu nhánh đó quá lớn, OpenClaw khởi động con với ngữ cảnh cô lập thay vì thất bại hoặc kế thừa lịch sử không dùng được. Chính sách định cỡ là tự động; cấu hình `session.parentForkMaxTokens` cũ bị `openclaw doctor --fix` xóa.

Chi tiết triển khai: quyết định diễn ra trong `initSessionState()` ở `src/auto-reply/reply/session.ts`.

---

## Schema kho phiên (`sessions.json`)

Kiểu giá trị của kho là `SessionEntry` trong `src/config/sessions.ts`.

Các trường chính (không đầy đủ):

- `sessionId`: id bản ghi hội thoại hiện tại (tên tệp được suy ra từ trường này trừ khi `sessionFile` được đặt)
- `sessionStartedAt`: timestamp bắt đầu cho `sessionId` hiện tại; độ mới của đặt lại hằng ngày dùng trường này. Các hàng cũ có thể suy ra trường này từ header phiên JSONL.
- `lastInteractionAt`: timestamp của tương tác người dùng/kênh thực gần nhất; độ mới của đặt lại do nhàn rỗi dùng trường này để Heartbeat, Cron, và sự kiện exec không giữ phiên sống. Các hàng cũ không có trường này sẽ quay về thời gian bắt đầu phiên đã khôi phục cho độ mới nhàn rỗi.
- `updatedAt`: timestamp thay đổi hàng kho gần nhất, dùng cho liệt kê, cắt tỉa, và ghi sổ. Đây không phải thẩm quyền cho độ mới của đặt lại hằng ngày/nhàn rỗi.
- `sessionFile`: ghi đè đường dẫn bản ghi hội thoại rõ ràng tùy chọn
- `chatType`: `direct | group | room` (giúp giao diện người dùng và chính sách gửi)
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu để gắn nhãn nhóm/kênh
- Công tắc:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (ghi đè theo từng phiên)
- Chọn mô hình:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (nỗ lực tốt nhất / phụ thuộc nhà cung cấp):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần Compaction tự động hoàn tất cho khóa phiên này
- `memoryFlushAt`: timestamp cho lần xả bộ nhớ trước Compaction gần nhất
- `memoryFlushCompactionCount`: số đếm Compaction khi lần xả gần nhất chạy

Kho này an toàn để chỉnh sửa, nhưng Gateway là thẩm quyền: nó có thể ghi lại hoặc tái cấp nước các mục khi phiên chạy.

---

## Cấu trúc bản ghi hội thoại (`*.jsonl`)

Bản ghi hội thoại được quản lý bởi `SessionManager` của `@mariozechner/pi-coding-agent`.

Tệp là JSONL:

- Dòng đầu tiên: header phiên (`type: "session"`, bao gồm `id`, `cwd`, `timestamp`, tùy chọn `parentSession`)
- Sau đó: các mục phiên với `id` + `parentId` (cây)

Các kiểu mục đáng chú ý:

- `message`: thông điệp người dùng/assistant/toolResult
- `custom_message`: thông điệp do plugin chèn vào _có_ đi vào ngữ cảnh mô hình (có thể ẩn khỏi giao diện người dùng)
- `custom`: trạng thái plugin _không_ đi vào ngữ cảnh mô hình
- `compaction`: tóm tắt Compaction được lưu bền với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: tóm tắt được lưu bền khi điều hướng một nhánh cây

OpenClaw cố ý **không** “chỉnh sửa” bản ghi hội thoại; Gateway dùng `SessionManager` để đọc/ghi chúng.

---

## Cửa sổ ngữ cảnh so với token được theo dõi

Có hai khái niệm khác nhau quan trọng:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng theo từng mô hình (token hiển thị cho mô hình)
2. **Bộ đếm kho phiên**: thống kê cuộn được ghi vào `sessions.json` (dùng cho /status và bảng điều khiển)

Nếu bạn đang điều chỉnh giới hạn:

- Cửa sổ ngữ cảnh đến từ danh mục mô hình (và có thể bị ghi đè qua cấu hình).
- `contextTokens` trong kho là giá trị ước tính/báo cáo runtime; đừng xem nó là bảo đảm nghiêm ngặt.

Để biết thêm, xem [/token-use](/vi/reference/token-use).

---

## Compaction: đó là gì

Compaction tóm tắt cuộc hội thoại cũ hơn vào một mục `compaction` được lưu bền trong bản ghi hội thoại và giữ nguyên các thông điệp gần đây.

Sau Compaction, các lượt trong tương lai thấy:

- Tóm tắt Compaction
- Các thông điệp sau `firstKeptEntryId`

Compaction là **lưu bền** (không giống cắt tỉa phiên). Xem [/concepts/session-pruning](/vi/concepts/session-pruning).

## Ranh giới khối Compaction và ghép cặp công cụ

Khi OpenClaw chia một bản ghi hội thoại dài thành các khối Compaction, nó giữ các lệnh gọi công cụ của assistant được ghép với các mục `toolResult` tương ứng.

- Nếu điểm chia theo tỷ lệ token rơi vào giữa một lệnh gọi công cụ và kết quả của nó, OpenClaw dịch ranh giới tới thông điệp lệnh gọi công cụ của assistant thay vì tách cặp đó.
- Nếu một khối kết quả công cụ ở cuối nếu không sẽ đẩy khối vượt quá mục tiêu, OpenClaw bảo toàn khối công cụ đang chờ đó và giữ nguyên phần đuôi chưa tóm tắt.
- Các khối lệnh gọi công cụ bị hủy/lỗi không giữ mở một điểm chia đang chờ.

---

## Khi Compaction tự động xảy ra (runtime Pi)

Trong agent Pi nhúng, Compaction tự động kích hoạt trong hai trường hợp:

1. **Khôi phục khi tràn**: mô hình trả về lỗi tràn ngữ cảnh
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, và các biến thể tương tự theo dạng của nhà cung cấp) → Compaction → thử lại.
2. **Duy trì ngưỡng**: sau một lượt thành công, khi:

`contextTokens > contextWindow - reserveTokens`

Trong đó:

- `contextWindow` là cửa sổ ngữ cảnh của mô hình
- `reserveTokens` là phần dung lượng dự phòng dành cho prompt + đầu ra mô hình tiếp theo

Đây là ngữ nghĩa runtime của Pi (OpenClaw tiêu thụ các sự kiện, nhưng Pi quyết định thời điểm Compaction).

OpenClaw cũng có thể kích hoạt Compaction cục bộ trước khi chạy trước khi mở lượt chạy tiếp theo
khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt và tệp bản ghi hoạt động
đạt kích thước đó. Đây là cơ chế bảo vệ theo kích thước tệp để giảm chi phí mở lại cục bộ,
không phải lưu trữ thô: OpenClaw vẫn chạy Compaction ngữ nghĩa thông thường,
và cơ chế này yêu cầu `truncateAfterCompaction` để bản tóm tắt đã Compaction có thể trở thành
bản ghi kế nhiệm mới.

Đối với các lượt chạy Pi nhúng, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
thêm một cơ chế bảo vệ vòng lặp công cụ tùy chọn. Sau khi kết quả công cụ được thêm vào và trước
lệnh gọi mô hình tiếp theo, OpenClaw ước tính áp lực prompt bằng cùng logic ngân sách kiểm tra trước
được dùng lúc bắt đầu lượt. Nếu ngữ cảnh không còn vừa, cơ chế bảo vệ không
Compaction bên trong hook `transformContext` của Pi. Nó phát tín hiệu kiểm tra trước giữa lượt
có cấu trúc, dừng lần gửi prompt hiện tại, và để vòng lặp chạy bên ngoài dùng đường khôi phục
hiện có: cắt bớt kết quả công cụ quá lớn khi như vậy là đủ, hoặc kích hoạt chế độ
Compaction đã cấu hình và thử lại. Tùy chọn này bị tắt theo mặc định và hoạt động với cả hai chế độ
Compaction `default` và `safeguard`, bao gồm Compaction safeguard do nhà cung cấp hỗ trợ.
Điều này độc lập với `maxActiveTranscriptBytes`: cơ chế bảo vệ theo kích thước byte chạy
trước khi một lượt mở ra, còn kiểm tra trước giữa lượt chạy muộn hơn trong vòng lặp công cụ Pi nhúng
sau khi các kết quả công cụ mới đã được thêm vào.

---

## Thiết lập Compaction (`reserveTokens`, `keepRecentTokens`)

Thiết lập Compaction của Pi nằm trong phần thiết lập Pi:

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

- Nếu `compaction.reserveTokens < reserveTokensFloor`, OpenClaw tăng giá trị đó lên.
- Mức sàn mặc định là `20000` token.
- Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để tắt mức sàn.
- Nếu giá trị này đã cao hơn, OpenClaw giữ nguyên.
- `/compact` thủ công tôn trọng `agents.defaults.compaction.keepRecentTokens`
  được đặt rõ ràng và giữ điểm cắt phần đuôi gần đây của Pi. Khi không có ngân sách giữ lại rõ ràng,
  Compaction thủ công vẫn là một checkpoint cứng và ngữ cảnh được xây dựng lại bắt đầu từ
  bản tóm tắt mới.
- Đặt `agents.defaults.compaction.midTurnPrecheck.enabled: true` để chạy kiểm tra trước
  vòng lặp công cụ tùy chọn sau các kết quả công cụ mới và trước lệnh gọi mô hình tiếp theo.
  Đây chỉ là một trigger; việc tạo tóm tắt vẫn dùng đường Compaction đã cấu hình.
  Nó độc lập với `maxActiveTranscriptBytes`, vốn là cơ chế bảo vệ theo kích thước byte
  của bản ghi hoạt động lúc bắt đầu lượt.
- Đặt `agents.defaults.compaction.maxActiveTranscriptBytes` thành một giá trị byte hoặc
  chuỗi như `"20mb"` để chạy Compaction cục bộ trước một lượt khi bản ghi hoạt động
  trở nên lớn. Cơ chế bảo vệ này chỉ hoạt động khi
  `truncateAfterCompaction` cũng được bật. Để không đặt hoặc đặt `0` để
  tắt.
- Khi `agents.defaults.compaction.truncateAfterCompaction` được bật,
  OpenClaw xoay vòng bản ghi hoạt động sang JSONL kế nhiệm đã Compaction sau
  Compaction. Bản ghi đầy đủ cũ vẫn được lưu trữ và liên kết từ
  checkpoint Compaction thay vì bị ghi đè tại chỗ.

Lý do: chừa đủ khoảng trống cho “dọn dẹp” nhiều lượt (như ghi bộ nhớ) trước khi Compaction trở nên không thể tránh khỏi.

Triển khai: `ensurePiCompactionReserveTokens()` trong `src/agents/pi-settings.ts`
(được gọi từ `src/agents/pi-embedded-runner.ts`).

---

## Nhà cung cấp Compaction có thể cắm được

Plugin có thể đăng ký nhà cung cấp Compaction thông qua `registerCompactionProvider()` trên API Plugin. Khi `agents.defaults.compaction.provider` được đặt thành id nhà cung cấp đã đăng ký, phần mở rộng safeguard ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì pipeline `summarizeInStages` tích hợp sẵn.

- `provider`: id của một Plugin nhà cung cấp Compaction đã đăng ký. Để trống để dùng tóm tắt LLM mặc định.
- Việc đặt `provider` buộc `mode: "safeguard"`.
- Nhà cung cấp nhận cùng hướng dẫn Compaction và chính sách bảo toàn định danh như đường tích hợp sẵn.
- Safeguard vẫn bảo toàn ngữ cảnh hậu tố của lượt gần đây và lượt tách sau đầu ra của nhà cung cấp.
- Tóm tắt safeguard tích hợp sẵn chưng cất lại các bản tóm tắt trước đó cùng với thông điệp mới
  thay vì giữ nguyên văn toàn bộ bản tóm tắt trước.
- Chế độ safeguard bật kiểm tra chất lượng tóm tắt theo mặc định; đặt
  `qualityGuard.enabled: false` để bỏ qua hành vi thử lại khi đầu ra sai định dạng.
- Nếu nhà cung cấp thất bại hoặc trả về kết quả rỗng, OpenClaw tự động quay về tóm tắt LLM tích hợp sẵn.
- Tín hiệu hủy/hết thời gian chờ được ném lại (không bị nuốt) để tôn trọng việc hủy từ bên gọi.

Nguồn: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Bề mặt người dùng có thể thấy

Bạn có thể quan sát Compaction và trạng thái phiên qua:

- `/status` (trong bất kỳ phiên chat nào)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Chế độ chi tiết: `🧹 Auto-compaction complete` + số lần Compaction

---

## Dọn dẹp âm thầm (`NO_REPLY`)

OpenClaw hỗ trợ các lượt “im lặng” cho tác vụ nền, nơi người dùng không nên thấy đầu ra trung gian.

Quy ước:

- Trợ lý bắt đầu đầu ra bằng token im lặng chính xác `NO_REPLY` /
  `no_reply` để biểu thị “không gửi phản hồi cho người dùng”.
- OpenClaw loại bỏ/chặn nội dung này ở lớp phân phối.
- Việc chặn token im lặng chính xác không phân biệt chữ hoa chữ thường, vì vậy `NO_REPLY` và
  `no_reply` đều được tính khi toàn bộ payload chỉ là token im lặng.
- Cơ chế này chỉ dành cho các lượt nền/không phân phối thật sự; nó không phải lối tắt cho
  các yêu cầu người dùng thông thường cần hành động.

Kể từ `2026.1.10`, OpenClaw cũng chặn **streaming nháp/đang nhập** khi một
phần chunk bắt đầu bằng `NO_REPLY`, nên các thao tác im lặng không rò rỉ đầu ra từng phần
giữa lượt.

---

## “Xả bộ nhớ” trước Compaction (đã triển khai)

Mục tiêu: trước khi Compaction tự động xảy ra, chạy một lượt tác nhân im lặng để ghi trạng thái
bền vững vào đĩa (ví dụ `memory/YYYY-MM-DD.md` trong workspace của tác nhân) để Compaction không thể
xóa ngữ cảnh quan trọng.

OpenClaw dùng cách tiếp cận **xả trước ngưỡng**:

1. Giám sát mức sử dụng ngữ cảnh của phiên.
2. Khi vượt qua một “ngưỡng mềm” (thấp hơn ngưỡng Compaction của Pi), chạy một chỉ thị im lặng
   “ghi bộ nhớ ngay” cho tác nhân.
3. Dùng token im lặng chính xác `NO_REPLY` / `no_reply` để người dùng không thấy
   gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`):

- `enabled` (mặc định: `true`)
- `model` (ghi đè nhà cung cấp/mô hình chính xác tùy chọn cho lượt xả, ví dụ `ollama/qwen3:8b`)
- `softThresholdTokens` (mặc định: `4000`)
- `prompt` (thông điệp người dùng cho lượt xả)
- `systemPrompt` (prompt hệ thống bổ sung được nối thêm cho lượt xả)

Ghi chú:

- Prompt/prompt hệ thống mặc định bao gồm gợi ý `NO_REPLY` để chặn
  phân phối.
- Khi `model` được đặt, lượt xả dùng mô hình đó mà không kế thừa chuỗi fallback
  của phiên hoạt động, vì vậy việc dọn dẹp chỉ cục bộ không âm thầm
  quay về mô hình hội thoại trả phí.
- Lượt xả chạy một lần mỗi chu kỳ Compaction (được theo dõi trong `sessions.json`).
- Lượt xả chỉ chạy cho các phiên Pi nhúng (backend CLI bỏ qua).
- Lượt xả bị bỏ qua khi workspace của phiên ở chế độ chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Memory](/vi/concepts/memory) để biết bố cục tệp workspace và mẫu ghi.

Pi cũng cung cấp hook `session_before_compact` trong API phần mở rộng, nhưng logic
xả của OpenClaw hiện nằm ở phía Gateway.

---

## Danh sách kiểm tra khắc phục sự cố

- Sai khóa phiên? Bắt đầu với [/concepts/session](/vi/concepts/session) và xác nhận `sessionKey` trong `/status`.
- Không khớp store và bản ghi? Xác nhận host Gateway và đường dẫn store từ `openclaw status`.
- Compaction quá thường xuyên? Kiểm tra:
  - cửa sổ ngữ cảnh của mô hình (quá nhỏ)
  - thiết lập Compaction (`reserveTokens` quá cao so với cửa sổ mô hình có thể khiến Compaction xảy ra sớm hơn)
  - kết quả công cụ phình to: bật/tinh chỉnh cắt tỉa phiên
- Lượt im lặng bị rò rỉ? Xác nhận phản hồi bắt đầu bằng `NO_REPLY` (token chính xác không phân biệt chữ hoa chữ thường) và bạn đang dùng bản dựng có bao gồm bản sửa chặn streaming.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Bộ máy ngữ cảnh](/vi/concepts/context-engine)
