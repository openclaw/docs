---
read_when:
    - Bạn cần gỡ lỗi mã định danh phiên, bản ghi JSONL hoặc các trường sessions.json
    - Bạn đang thay đổi hành vi Compaction tự động hoặc thêm công việc dọn dẹp "trước Compaction"
    - Bạn muốn triển khai thao tác xả bộ nhớ hoặc các lượt hệ thống im lặng
summary: 'Chuyên sâu: kho lưu trữ phiên + bản ghi phiên, vòng đời và cơ chế nội bộ của Compaction (tự động)'
title: Tìm hiểu chuyên sâu về quản lý phiên
x-i18n:
    generated_at: "2026-05-06T09:29:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw quản lý phiên từ đầu đến cuối trên các khu vực sau:

- **Định tuyến phiên** (cách thông điệp đến ánh xạ tới một `sessionKey`)
- **Kho lưu trữ phiên** (`sessions.json`) và những gì nó theo dõi
- **Lưu bền bản ghi hội thoại** (`*.jsonl`) và cấu trúc của nó
- **Vệ sinh bản ghi hội thoại** (các chỉnh sửa theo từng nhà cung cấp trước khi chạy)
- **Giới hạn ngữ cảnh** (cửa sổ ngữ cảnh so với token được theo dõi)
- **Compaction** (Compaction thủ công và tự động) và nơi móc công việc trước Compaction
- **Dọn dẹp âm thầm** (các lần ghi bộ nhớ không nên tạo đầu ra hiển thị với người dùng)

Nếu trước tiên bạn muốn xem tổng quan ở mức cao hơn, hãy bắt đầu với:

- [Quản lý phiên](/vi/concepts/session)
- [Compaction](/vi/concepts/compaction)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Vệ sinh bản ghi hội thoại](/vi/reference/transcript-hygiene)

---

## Nguồn sự thật: Gateway

OpenClaw được thiết kế xoay quanh một **tiến trình Gateway** duy nhất sở hữu trạng thái phiên.

- Các giao diện UI (ứng dụng macOS, Control UI trên web, TUI) nên truy vấn Gateway để lấy danh sách phiên và số lượng token.
- Ở chế độ từ xa, các tệp phiên nằm trên máy chủ từ xa; việc "kiểm tra các tệp Mac cục bộ của bạn" sẽ không phản ánh những gì Gateway đang dùng.

---

## Hai lớp lưu bền

OpenClaw lưu bền phiên trong hai lớp:

1. **Kho lưu trữ phiên (`sessions.json`)**
   - Bản đồ khóa/giá trị: `sessionKey -> SessionEntry`
   - Nhỏ, có thể thay đổi, an toàn để chỉnh sửa (hoặc xóa mục)
   - Theo dõi siêu dữ liệu phiên (id phiên hiện tại, hoạt động gần nhất, công tắc bật/tắt, bộ đếm token, v.v.)

2. **Bản ghi hội thoại (`<sessionId>.jsonl`)**
   - Bản ghi hội thoại chỉ ghi nối tiếp với cấu trúc cây (các mục có `id` + `parentId`)
   - Lưu cuộc hội thoại thực tế + lệnh gọi công cụ + tóm tắt Compaction
   - Dùng để dựng lại ngữ cảnh mô hình cho các lượt sau
   - Các điểm kiểm tra gỡ lỗi lớn trước Compaction sẽ bị bỏ qua sau khi bản ghi hội thoại
     đang hoạt động vượt quá giới hạn kích thước điểm kiểm tra, tránh tạo thêm một bản sao
     `.checkpoint.*.jsonl` khổng lồ thứ hai.

Trình đọc lịch sử của Gateway nên tránh hiện thực hóa toàn bộ bản ghi hội thoại trừ khi
bề mặt đó cần truy cập lịch sử tùy ý một cách rõ ràng. Lịch sử trang đầu,
lịch sử trò chuyện nhúng, khôi phục khi khởi động lại, và kiểm tra token/mức sử dụng dùng các lần
đọc phần đuôi có giới hạn. Quét toàn bộ bản ghi hội thoại đi qua chỉ mục bản ghi hội thoại bất đồng bộ, được
lưu vào bộ nhớ đệm theo đường dẫn tệp cộng với `mtimeMs`/`size` và được chia sẻ giữa các trình đọc đồng thời.

---

## Vị trí trên đĩa

Theo từng agent, trên máy chủ Gateway:

- Kho lưu trữ: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Bản ghi hội thoại: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Phiên chủ đề Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw phân giải các vị trí này qua `src/config/sessions.ts`.

---

## Bảo trì kho lưu trữ và kiểm soát đĩa

Lưu bền phiên có các kiểm soát bảo trì tự động (`session.maintenance`) cho `sessions.json`, tạo tác bản ghi hội thoại, và sidecar quỹ đạo:

- `mode`: `warn` (mặc định) hoặc `enforce`
- `pruneAfter`: ngưỡng tuổi cho mục cũ (mặc định `30d`)
- `maxEntries`: giới hạn số mục trong `sessions.json` (mặc định `500`)
- `resetArchiveRetention`: thời gian giữ lại cho kho lưu trữ bản ghi hội thoại `*.reset.<timestamp>` (mặc định: giống `pruneAfter`; `false` tắt dọn dẹp)
- `maxDiskBytes`: ngân sách thư mục phiên tùy chọn
- `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp (mặc định `80%` của `maxDiskBytes`)

Các lần ghi Gateway thông thường đi qua một trình ghi phiên theo từng kho lưu trữ, tuần tự hóa các thay đổi trong tiến trình mà không lấy khóa tệp lúc chạy. Các helper vá trên đường nóng mượn bộ đệm có thể thay đổi đã được xác thực trong khi chúng giữ khe ghi đó, nên các tệp `sessions.json` lớn không bị sao chép hoặc đọc lại cho mỗi lần cập nhật siêu dữ liệu. Mã lúc chạy nên ưu tiên `updateSessionStore(...)` hoặc `updateSessionStoreEntry(...)`; lưu toàn bộ kho lưu trữ trực tiếp là công cụ tương thích và bảo trì ngoại tuyến. Khi có thể truy cập Gateway, `openclaw sessions cleanup` không dry-run và `openclaw agents delete` ủy quyền các thay đổi kho lưu trữ cho Gateway để việc dọn dẹp tham gia cùng hàng đợi ghi; `--store <path>` là đường dẫn sửa chữa ngoại tuyến rõ ràng cho bảo trì tệp trực tiếp. Dọn dẹp `maxEntries` vẫn được xử lý theo lô cho các giới hạn cỡ sản xuất, nên một kho lưu trữ có thể tạm thời vượt quá giới hạn đã cấu hình trước khi lần dọn dẹp mốc cao tiếp theo ghi lại nó xuống dưới. Các lần đọc kho lưu trữ phiên không cắt tỉa hoặc giới hạn mục trong khi Gateway khởi động; hãy dùng các lần ghi hoặc `openclaw sessions cleanup --enforce` để dọn dẹp. `openclaw sessions cleanup --enforce` vẫn áp dụng giới hạn đã cấu hình ngay lập tức và cắt tỉa bản ghi hội thoại, điểm kiểm tra, và tạo tác quỹ đạo cũ không được tham chiếu ngay cả khi không cấu hình ngân sách đĩa.

Bảo trì giữ lại các con trỏ hội thoại bên ngoài bền vững như phiên nhóm
và phiên trò chuyện theo phạm vi luồng, nhưng các mục lúc chạy tổng hợp cho Cron, hook,
Heartbeat, ACP, và sub-agent vẫn có thể bị xóa khi chúng vượt quá
tuổi, số lượng, hoặc ngân sách đĩa đã cấu hình.

OpenClaw không còn tạo bản sao lưu xoay vòng `sessions.json.bak.*` tự động trong các lần ghi Gateway. Khóa cũ `session.maintenance.rotateBytes` bị bỏ qua và `openclaw doctor --fix` xóa nó khỏi các cấu hình cũ hơn.

Các thay đổi bản ghi hội thoại dùng khóa ghi phiên trên tệp bản ghi hội thoại. Việc lấy khóa chờ tối đa
`session.writeLock.acquireTimeoutMs` trước khi hiển thị lỗi phiên đang bận; mặc định là `60000`
ms. Chỉ tăng giá trị này khi công việc chuẩn bị, dọn dẹp, Compaction, hoặc phản chiếu bản ghi hội thoại hợp lệ tranh chấp
lâu hơn trên máy chậm. Phát hiện khóa cũ và cảnh báo thời gian giữ tối đa vẫn là các chính sách riêng.

Thứ tự thực thi cho dọn dẹp ngân sách đĩa (`mode: "enforce"`):

1. Trước tiên xóa các tạo tác đã lưu trữ cũ nhất, bản ghi hội thoại mồ côi, hoặc quỹ đạo mồ côi.
2. Nếu vẫn vượt mục tiêu, loại bỏ các mục phiên cũ nhất và tệp bản ghi hội thoại/quỹ đạo của chúng.
3. Tiếp tục cho đến khi mức sử dụng bằng hoặc thấp hơn `highWaterBytes`.

Trong `mode: "warn"`, OpenClaw báo cáo các khả năng loại bỏ nhưng không thay đổi kho lưu trữ/tệp.

Chạy bảo trì theo yêu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Phiên Cron và nhật ký chạy

Các lần chạy Cron cô lập cũng tạo mục phiên/bản ghi hội thoại, và chúng có các kiểm soát giữ lại riêng:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy Cron cô lập cũ khỏi kho lưu trữ phiên (`false` tắt).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` cắt tỉa các tệp `~/.openclaw/cron/runs/<jobId>.jsonl` (mặc định: `2_000_000` byte và `2000` dòng).

Khi Cron ép tạo một phiên chạy cô lập mới, nó làm sạch mục phiên
`cron:<jobId>` trước đó trước khi ghi hàng mới. Nó mang theo các tùy chọn an toàn
như thiết lập suy nghĩ/nhanh/chi tiết, nhãn, và các ghi đè mô hình/xác thực do người dùng
chọn rõ ràng. Nó loại bỏ ngữ cảnh hội thoại môi trường xung quanh như
định tuyến kênh/nhóm, chính sách gửi hoặc xếp hàng, nâng quyền, nguồn gốc, và liên kết lúc chạy
ACP để một lần chạy cô lập mới không thể kế thừa trạng thái gửi cũ hoặc
thẩm quyền lúc chạy từ lần chạy cũ hơn.

---

## Khóa phiên (`sessionKey`)

Một `sessionKey` xác định _bạn đang ở bucket hội thoại nào_ (định tuyến + cô lập).

Các mẫu phổ biến:

- Trò chuyện chính/trực tiếp (theo agent): `agent:<agentId>:<mainKey>` (mặc định `main`)
- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Phòng/kênh (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (trừ khi bị ghi đè)

Các quy tắc chuẩn được ghi lại tại [/concepts/session](/vi/concepts/session).

---

## ID phiên (`sessionId`)

Mỗi `sessionKey` trỏ tới một `sessionId` hiện tại (tệp bản ghi hội thoại tiếp tục cuộc hội thoại).

Quy tắc kinh nghiệm:

- **Đặt lại** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Đặt lại hằng ngày** (mặc định 4:00 sáng giờ địa phương trên máy chủ gateway) tạo một `sessionId` mới ở thông điệp tiếp theo sau ranh giới đặt lại.
- **Hết hạn do không hoạt động** (`session.reset.idleMinutes` hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi có thông điệp đến sau cửa sổ không hoạt động. Khi cả hằng ngày + không hoạt động đều được cấu hình, cái nào hết hạn trước sẽ thắng.
- **Sự kiện hệ thống** (Heartbeat, đánh thức Cron, thông báo exec, ghi sổ Gateway) có thể thay đổi hàng phiên nhưng không kéo dài độ mới cho đặt lại hằng ngày/không hoạt động. Chuyển vòng đặt lại loại bỏ các thông báo sự kiện hệ thống đã xếp hàng cho phiên trước đó trước khi prompt mới được xây dựng.
- **Chính sách fork cha** dùng nhánh đang hoạt động của PI khi tạo một luồng hoặc fork subagent. Nếu nhánh đó quá lớn, OpenClaw khởi động con với ngữ cảnh cô lập thay vì thất bại hoặc kế thừa lịch sử không dùng được. Chính sách định cỡ là tự động; cấu hình cũ `session.parentForkMaxTokens` bị `openclaw doctor --fix` xóa.

Chi tiết triển khai: quyết định diễn ra trong `initSessionState()` tại `src/auto-reply/reply/session.ts`.

---

## Schema kho lưu trữ phiên (`sessions.json`)

Kiểu giá trị của kho lưu trữ là `SessionEntry` trong `src/config/sessions.ts`.

Các trường chính (không đầy đủ):

- `sessionId`: id bản ghi hội thoại hiện tại (tên tệp được suy ra từ trường này trừ khi `sessionFile` được đặt)
- `sessionStartedAt`: dấu thời gian bắt đầu cho `sessionId` hiện tại; độ mới đặt lại hằng ngày
  dùng trường này. Các hàng cũ có thể suy ra nó từ header phiên JSONL.
- `lastInteractionAt`: dấu thời gian tương tác người dùng/kênh thật gần nhất; độ mới đặt lại do không hoạt động
  dùng trường này để Heartbeat, Cron, và sự kiện exec không giữ phiên
  sống. Các hàng cũ không có trường này quay về dùng thời gian bắt đầu phiên đã khôi phục
  cho độ mới do không hoạt động.
- `updatedAt`: dấu thời gian thay đổi hàng kho lưu trữ gần nhất, dùng cho liệt kê, cắt tỉa, và
  ghi sổ. Nó không phải là nguồn thẩm quyền cho độ mới đặt lại hằng ngày/do không hoạt động.
- `sessionFile`: ghi đè đường dẫn bản ghi hội thoại rõ ràng tùy chọn
- `chatType`: `direct | group | room` (giúp UI và chính sách gửi)
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu để gắn nhãn nhóm/kênh
- Công tắc bật/tắt:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (ghi đè theo từng phiên)
- Chọn mô hình:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (nỗ lực tối đa / phụ thuộc nhà cung cấp):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần auto-compaction hoàn tất cho khóa phiên này
- `memoryFlushAt`: dấu thời gian cho lần flush bộ nhớ trước Compaction gần nhất
- `memoryFlushCompactionCount`: số lần Compaction khi lần flush gần nhất chạy

Kho lưu trữ an toàn để chỉnh sửa, nhưng Gateway là nguồn thẩm quyền: nó có thể ghi lại hoặc tái nạp mục khi phiên chạy.

---

## Cấu trúc bản ghi hội thoại (`*.jsonl`)

Bản ghi hội thoại được quản lý bởi `SessionManager` của `@mariozechner/pi-coding-agent`.

Tệp là JSONL:

- Dòng đầu tiên: header phiên (`type: "session"`, bao gồm `id`, `cwd`, `timestamp`, `parentSession` tùy chọn)
- Sau đó: các mục phiên có `id` + `parentId` (cây)

Các kiểu mục đáng chú ý:

- `message`: thông điệp người dùng/assistant/toolResult
- `custom_message`: thông điệp do tiện ích mở rộng chèn vào _có_ đi vào ngữ cảnh mô hình (có thể ẩn khỏi UI)
- `custom`: trạng thái tiện ích mở rộng _không_ đi vào ngữ cảnh mô hình
- `compaction`: tóm tắt Compaction được lưu bền với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: tóm tắt được lưu bền khi điều hướng một nhánh cây

OpenClaw cố ý **không** "sửa" bản ghi hội thoại; Gateway dùng `SessionManager` để đọc/ghi chúng.

---

## Cửa sổ ngữ cảnh so với token được theo dõi

Có hai khái niệm khác nhau quan trọng:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng theo từng mô hình (token hiển thị với mô hình)
2. **Bộ đếm kho lưu trữ phiên**: thống kê cuốn chiếu được ghi vào `sessions.json` (dùng cho /status và dashboard)

Nếu bạn đang tinh chỉnh giới hạn:

- Cửa sổ ngữ cảnh đến từ danh mục mô hình (và có thể được ghi đè qua cấu hình).
- `contextTokens` trong kho lưu trữ là giá trị ước tính/báo cáo lúc chạy; đừng coi nó là bảo đảm nghiêm ngặt.

Để biết thêm, xem [/token-use](/vi/reference/token-use).

---

## Compaction: nó là gì

Compaction tóm tắt hội thoại cũ hơn vào một mục `compaction` được lưu bền trong bản ghi hội thoại và giữ nguyên các thông điệp gần đây.

Sau Compaction, các lượt sau thấy:

- Tóm tắt Compaction
- Các thông điệp sau `firstKeptEntryId`

Compaction là **bền vững** (khác với cắt tỉa phiên). Xem [/concepts/session-pruning](/vi/concepts/session-pruning).

## Ranh giới đoạn Compaction và ghép cặp công cụ

Khi OpenClaw chia một bản ghi dài thành các đoạn Compaction, nó giữ các lời gọi công cụ của trợ lý được ghép cặp với các mục `toolResult` tương ứng.

- Nếu điểm chia theo tỷ lệ token rơi vào giữa một lời gọi công cụ và kết quả của nó, OpenClaw dịch chuyển ranh giới về thông điệp lời gọi công cụ của trợ lý thay vì tách cặp đó.
- Nếu một khối kết quả công cụ ở cuối nếu giữ nguyên sẽ đẩy đoạn vượt quá mục tiêu, OpenClaw bảo toàn khối công cụ đang chờ đó và giữ nguyên phần đuôi chưa được tóm tắt.
- Các khối lời gọi công cụ bị hủy/lỗi không giữ một điểm chia đang chờ mở.

---

## Khi auto-compaction diễn ra (runtime Pi)

Trong tác nhân Pi nhúng, auto-compaction kích hoạt trong hai trường hợp:

1. **Khôi phục tràn**: mô hình trả về lỗi tràn ngữ cảnh (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, và các biến thể tương tự theo định dạng nhà cung cấp) → compact → thử lại.
2. **Duy trì ngưỡng**: sau một lượt thành công, khi:

`contextTokens > contextWindow - reserveTokens`

Trong đó:

- `contextWindow` là cửa sổ ngữ cảnh của mô hình
- `reserveTokens` là khoảng dự phòng dành cho prompt + đầu ra mô hình tiếp theo

Đây là ngữ nghĩa runtime Pi (OpenClaw tiêu thụ các sự kiện, nhưng Pi quyết định khi nào compact).

OpenClaw cũng có thể kích hoạt Compaction cục bộ trước khi chạy trước khi mở lượt chạy tiếp theo khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt và tệp bản ghi đang hoạt động đạt kích thước đó. Đây là cơ chế bảo vệ theo kích thước tệp cho chi phí mở lại cục bộ, không phải lưu trữ thô: OpenClaw vẫn chạy Compaction ngữ nghĩa bình thường, và nó yêu cầu `truncateAfterCompaction` để bản tóm tắt đã compact có thể trở thành bản ghi kế nhiệm mới.

Với các lượt chạy Pi nhúng, `agents.defaults.compaction.midTurnPrecheck.enabled: true` thêm một cơ chế bảo vệ vòng lặp công cụ theo lựa chọn. Sau khi một kết quả công cụ được thêm vào và trước lời gọi mô hình tiếp theo, OpenClaw ước tính áp lực prompt bằng cùng logic ngân sách kiểm tra trước được dùng lúc bắt đầu lượt. Nếu ngữ cảnh không còn vừa, cơ chế bảo vệ không compact bên trong hook `transformContext` của Pi. Nó phát tín hiệu kiểm tra trước giữa lượt có cấu trúc, dừng lần gửi prompt hiện tại, và để vòng lặp chạy bên ngoài dùng đường khôi phục hiện có: cắt bớt kết quả công cụ quá lớn khi như vậy là đủ, hoặc kích hoạt chế độ Compaction đã cấu hình và thử lại. Tùy chọn này bị tắt theo mặc định và hoạt động với cả hai chế độ Compaction `default` và `safeguard`, bao gồm Compaction safeguard dựa trên nhà cung cấp.
Điều này độc lập với `maxActiveTranscriptBytes`: cơ chế bảo vệ theo kích thước byte chạy trước khi một lượt mở ra, còn kiểm tra trước giữa lượt chạy muộn hơn trong vòng lặp công cụ Pi nhúng sau khi các kết quả công cụ mới đã được thêm vào.

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

OpenClaw cũng áp dụng một ngưỡng sàn an toàn cho các lượt chạy nhúng:

- Nếu `compaction.reserveTokens < reserveTokensFloor`, OpenClaw nâng nó lên.
- Ngưỡng sàn mặc định là `20000` token.
- Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để tắt ngưỡng sàn.
- Nếu nó đã cao hơn, OpenClaw giữ nguyên.
- `/compact` thủ công tôn trọng `agents.defaults.compaction.keepRecentTokens` rõ ràng và giữ điểm cắt phần đuôi gần đây của Pi. Nếu không có ngân sách giữ lại rõ ràng, Compaction thủ công vẫn là một checkpoint cứng và ngữ cảnh được dựng lại bắt đầu từ bản tóm tắt mới.
- Đặt `agents.defaults.compaction.midTurnPrecheck.enabled: true` để chạy kiểm tra trước vòng lặp công cụ tùy chọn sau các kết quả công cụ mới và trước lời gọi mô hình tiếp theo. Đây chỉ là một trình kích hoạt; việc tạo tóm tắt vẫn dùng đường Compaction đã cấu hình. Nó độc lập với `maxActiveTranscriptBytes`, vốn là cơ chế bảo vệ theo kích thước byte của bản ghi đang hoạt động lúc bắt đầu lượt.
- Đặt `agents.defaults.compaction.maxActiveTranscriptBytes` thành một giá trị byte hoặc chuỗi như `"20mb"` để chạy Compaction cục bộ trước một lượt khi bản ghi đang hoạt động trở nên lớn. Cơ chế bảo vệ này chỉ hoạt động khi `truncateAfterCompaction` cũng được bật. Để không đặt hoặc đặt `0` để tắt.
- Khi `agents.defaults.compaction.truncateAfterCompaction` được bật, OpenClaw xoay vòng bản ghi đang hoạt động sang một JSONL kế nhiệm đã compact sau Compaction. Bản ghi đầy đủ cũ vẫn được lưu trữ và liên kết từ checkpoint Compaction thay vì bị ghi lại tại chỗ.

Lý do: để lại đủ khoảng dự phòng cho “dọn dẹp” nhiều lượt (như ghi bộ nhớ) trước khi Compaction trở nên không thể tránh khỏi.

Triển khai: `ensurePiCompactionReserveTokens()` trong `src/agents/pi-settings.ts`
(được gọi từ `src/agents/pi-embedded-runner.ts`).

---

## Nhà cung cấp Compaction có thể cắm vào

Plugin có thể đăng ký một nhà cung cấp Compaction qua `registerCompactionProvider()` trên API plugin. Khi `agents.defaults.compaction.provider` được đặt thành id của một nhà cung cấp đã đăng ký, phần mở rộng safeguard ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì pipeline `summarizeInStages` tích hợp sẵn.

- `provider`: id của một Plugin nhà cung cấp Compaction đã đăng ký. Để không đặt để dùng tóm tắt LLM mặc định.
- Việc đặt `provider` buộc `mode: "safeguard"`.
- Nhà cung cấp nhận cùng chỉ dẫn Compaction và chính sách bảo toàn định danh như đường tích hợp sẵn.
- Safeguard vẫn bảo toàn ngữ cảnh hậu tố lượt gần đây và lượt bị chia sau đầu ra của nhà cung cấp.
- Tóm tắt safeguard tích hợp sẵn chưng cất lại các bản tóm tắt trước đó với thông điệp mới thay vì bảo toàn nguyên văn toàn bộ bản tóm tắt trước đó.
- Chế độ safeguard bật kiểm toán chất lượng tóm tắt theo mặc định; đặt `qualityGuard.enabled: false` để bỏ qua hành vi thử lại khi đầu ra sai định dạng.
- Nếu nhà cung cấp thất bại hoặc trả về kết quả rỗng, OpenClaw tự động quay lại tóm tắt LLM tích hợp sẵn.
- Tín hiệu hủy/hết thời gian chờ được ném lại (không bị nuốt) để tôn trọng việc hủy của bên gọi.

Nguồn: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Bề mặt hiển thị cho người dùng

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
  `no_reply` để chỉ báo “không gửi phản hồi cho người dùng”.
- OpenClaw loại bỏ/ức chế điều này ở tầng phân phối.
- Việc ức chế token im lặng chính xác không phân biệt hoa thường, nên `NO_REPLY` và
  `no_reply` đều được tính khi toàn bộ payload chỉ là token im lặng.
- Điều này chỉ dành cho các lượt nền/không phân phối thật sự; nó không phải lối tắt cho các yêu cầu người dùng có thể hành động thông thường.

Tính đến `2026.1.10`, OpenClaw cũng ức chế **streaming bản nháp/đang nhập** khi một đoạn một phần bắt đầu bằng `NO_REPLY`, nên các thao tác im lặng không rò rỉ đầu ra một phần giữa lượt.

---

## “Xả bộ nhớ” trước Compaction (đã triển khai)

Mục tiêu: trước khi auto-compaction diễn ra, chạy một lượt tác nhân im lặng ghi trạng thái bền vững xuống đĩa (ví dụ `memory/YYYY-MM-DD.md` trong workspace của tác nhân) để Compaction không thể xóa ngữ cảnh quan trọng.

OpenClaw dùng cách tiếp cận **xả trước ngưỡng**:

1. Theo dõi mức dùng ngữ cảnh của phiên.
2. Khi nó vượt qua một “ngưỡng mềm” (thấp hơn ngưỡng Compaction của Pi), chạy một chỉ thị “ghi bộ nhớ ngay” im lặng cho tác nhân.
3. Dùng token im lặng chính xác `NO_REPLY` / `no_reply` để người dùng không thấy gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`):

- `enabled` (mặc định: `true`)
- `model` (ghi đè nhà cung cấp/mô hình chính xác tùy chọn cho lượt xả, ví dụ `ollama/qwen3:8b`)
- `softThresholdTokens` (mặc định: `4000`)
- `prompt` (thông điệp người dùng cho lượt xả)
- `systemPrompt` (prompt hệ thống bổ sung được nối thêm cho lượt xả)

Ghi chú:

- Prompt/prompt hệ thống mặc định bao gồm gợi ý `NO_REPLY` để ức chế phân phối.
- Khi `model` được đặt, lượt xả dùng mô hình đó mà không kế thừa chuỗi dự phòng của phiên đang hoạt động, để việc dọn dẹp chỉ cục bộ không âm thầm rơi về một mô hình hội thoại trả phí.
- Lượt xả chạy một lần mỗi chu kỳ Compaction (được theo dõi trong `sessions.json`).
- Lượt xả chỉ chạy cho các phiên Pi nhúng (backend CLI bỏ qua nó).
- Lượt xả bị bỏ qua khi workspace của phiên chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Bộ nhớ](/vi/concepts/memory) để biết bố cục tệp workspace và các mẫu ghi.

Pi cũng cung cấp một hook `session_before_compact` trong API phần mở rộng, nhưng logic xả của OpenClaw hiện nằm ở phía Gateway.

---

## Danh sách kiểm tra xử lý sự cố

- Sai khóa phiên? Bắt đầu với [/concepts/session](/vi/concepts/session) và xác nhận `sessionKey` trong `/status`.
- Không khớp kho lưu trữ và bản ghi? Xác nhận máy chủ Gateway và đường dẫn kho lưu trữ từ `openclaw status`.
- Compaction quá nhiều? Kiểm tra:
  - cửa sổ ngữ cảnh của mô hình (quá nhỏ)
  - cài đặt Compaction (`reserveTokens` quá cao so với cửa sổ mô hình có thể gây Compaction sớm hơn)
  - kết quả công cụ phình to: bật/tinh chỉnh cắt tỉa phiên
- Lượt im lặng bị rò rỉ? Xác nhận phản hồi bắt đầu bằng `NO_REPLY` (token chính xác không phân biệt hoa thường) và bạn đang dùng bản build có bao gồm bản sửa ức chế streaming.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
