---
read_when:
    - Bạn cần gỡ lỗi ID phiên, JSONL bản ghi hội thoại, hoặc các trường sessions.json
    - Bạn đang thay đổi hành vi tự động Compaction hoặc thêm công việc dọn dẹp "trước Compaction"
    - Bạn muốn triển khai việc xả bộ nhớ hoặc các lượt hệ thống im lặng
summary: 'Chuyên sâu: kho phiên + bản ghi, vòng đời và nội bộ Compaction (tự động)'
title: Tìm hiểu chuyên sâu về quản lý phiên
x-i18n:
    generated_at: "2026-06-27T18:09:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw quản lý phiên từ đầu đến cuối trên các khu vực này:

- **Định tuyến phiên** (cách thông điệp đến được ánh xạ tới một `sessionKey`)
- **Kho phiên** (`sessions.json`) và những gì nó theo dõi
- **Lưu bền transcript** (`*.jsonl`) và cấu trúc của nó
- **Vệ sinh transcript** (các chỉnh sửa riêng theo nhà cung cấp trước khi chạy)
- **Giới hạn ngữ cảnh** (cửa sổ ngữ cảnh so với token được theo dõi)
- **Compaction** (Compaction thủ công và tự động) và nơi móc nối công việc trước Compaction
- **Dọn dẹp âm thầm** (các lần ghi bộ nhớ không nên tạo đầu ra hiển thị cho người dùng)

Nếu trước tiên bạn muốn có phần tổng quan cấp cao hơn, hãy bắt đầu với:

- [Quản lý phiên](/vi/concepts/session)
- [Compaction](/vi/concepts/compaction)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Vệ sinh transcript](/vi/reference/transcript-hygiene)

---

## Nguồn chân lý: Gateway

OpenClaw được thiết kế xoay quanh một **tiến trình Gateway** duy nhất sở hữu trạng thái phiên.

- Các UI (ứng dụng macOS, Control UI web, TUI) nên truy vấn Gateway để lấy danh sách phiên và số lượng token.
- Ở chế độ từ xa, tệp phiên nằm trên máy chủ từ xa; "kiểm tra các tệp cục bộ trên Mac của bạn" sẽ không phản ánh những gì Gateway đang sử dụng.

---

## Hai lớp lưu bền

OpenClaw lưu bền phiên trong hai lớp:

1. **Kho phiên (`sessions.json`)**
   - Bản đồ khóa/giá trị: `sessionKey -> SessionEntry`
   - Nhỏ, có thể thay đổi, an toàn để chỉnh sửa (hoặc xóa mục)
   - Theo dõi siêu dữ liệu phiên (id phiên hiện tại, hoạt động gần nhất, công tắc bật/tắt, bộ đếm token, v.v.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Transcript chỉ ghi nối tiếp với cấu trúc cây (các mục có `id` + `parentId`)
   - Lưu cuộc trò chuyện thực tế + lệnh gọi công cụ + tóm tắt Compaction
   - Được dùng để dựng lại ngữ cảnh mô hình cho các lượt sau
   - Điểm kiểm tra Compaction là siêu dữ liệu trên transcript kế nhiệm đã được nén.
     Các lần Compaction mới không ghi thêm một bản sao `.checkpoint.*.jsonl`
     thứ hai.

Trình đọc lịch sử Gateway nên tránh vật thể hóa toàn bộ transcript trừ khi
bề mặt rõ ràng cần truy cập lịch sử tùy ý. Lịch sử trang đầu tiên,
lịch sử trò chuyện nhúng, khôi phục khi khởi động lại, và kiểm tra token/mức dùng dùng các lần đọc đuôi
có giới hạn. Quét toàn bộ transcript đi qua chỉ mục transcript bất đồng bộ, được
lưu cache theo đường dẫn tệp cộng với `mtimeMs`/`size` và được chia sẻ giữa các trình đọc đồng thời.

---

## Vị trí trên đĩa

Theo từng tác nhân, trên máy chủ Gateway:

- Kho: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Phiên chủ đề Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw phân giải các vị trí này qua `src/config/sessions.ts`.

---

## Bảo trì kho và điều khiển đĩa

Lưu bền phiên có các điều khiển bảo trì tự động (`session.maintenance`) cho `sessions.json`, tạo tác transcript, và sidecar quỹ đạo:

- `mode`: `enforce` (mặc định) hoặc `warn`
- `pruneAfter`: ngưỡng tuổi của mục cũ (mặc định `30d`)
- `maxEntries`: giới hạn số mục trong `sessions.json` (mặc định `500`)
- Thời gian giữ lại probe chạy mô hình Gateway ngắn hạn được cố định ở `24h`, nhưng được chặn theo áp lực: nó chỉ xóa các hàng probe nghiêm ngặt đã cũ khi đạt tới áp lực bảo trì/giới hạn mục phiên. Điều này chỉ áp dụng cho các khóa probe rõ ràng nghiêm ngặt khớp `agent:*:explicit:model-run-<uuid>` và chạy trước thao tác dọn dẹp/giới hạn mục cũ toàn cục khi nó chạy.
- `resetArchiveRetention`: thời gian giữ lại cho các kho lưu trữ transcript `*.reset.<timestamp>` (mặc định: giống `pruneAfter`; `false` tắt dọn dẹp)
- `maxDiskBytes`: ngân sách thư mục phiên tùy chọn
- `highWaterBytes`: mục tiêu tùy chọn sau dọn dẹp (mặc định `80%` của `maxDiskBytes`)

Các lần ghi Gateway bình thường đi qua một trình ghi phiên theo từng kho, tuần tự hóa các đột biến trong tiến trình mà không lấy khóa tệp runtime. Các helper vá đường nóng mượn cache có thể thay đổi đã xác thực trong khi giữ slot trình ghi đó, nên các tệp `sessions.json` lớn không bị sao chép hoặc đọc lại cho mỗi lần cập nhật siêu dữ liệu. Mã runtime nên ưu tiên `updateSessionStore(...)` hoặc `updateSessionStoreEntry(...)`; lưu toàn bộ kho trực tiếp là công cụ tương thích và bảo trì ngoại tuyến. Khi có thể truy cập Gateway, `openclaw sessions cleanup` và `openclaw agents delete` không ở chế độ dry-run ủy quyền đột biến kho cho Gateway để việc dọn dẹp tham gia cùng hàng đợi trình ghi; `--store <path>` là đường sửa chữa ngoại tuyến rõ ràng để bảo trì tệp trực tiếp. Dọn dẹp `maxEntries` vẫn được xử lý theo lô cho các giới hạn cỡ sản xuất, nên một kho có thể tạm thời vượt quá giới hạn đã cấu hình trước khi lần dọn dẹp high-water tiếp theo ghi lại nó xuống thấp hơn. Đọc kho phiên không cắt tỉa hoặc giới hạn mục trong khi Gateway khởi động; dùng các lần ghi hoặc `openclaw sessions cleanup --enforce` để dọn dẹp. `openclaw sessions cleanup --enforce` vẫn áp dụng giới hạn đã cấu hình ngay lập tức và cắt tỉa các tạo tác transcript, điểm kiểm tra, và quỹ đạo cũ không được tham chiếu ngay cả khi không cấu hình ngân sách đĩa.

Bảo trì giữ lại các con trỏ hội thoại bên ngoài bền vững như phiên nhóm
và phiên trò chuyện theo phạm vi luồng, nhưng các mục runtime tổng hợp cho cron, hook,
Heartbeat, ACP, và tác nhân phụ vẫn có thể bị xóa khi chúng vượt quá
tuổi, số lượng, hoặc ngân sách đĩa đã cấu hình. Phiên probe chạy mô hình Gateway dùng
thời gian giữ lại model-run `24h` riêng chỉ khi khóa của chúng khớp chính xác
`agent:*:explicit:model-run-<uuid>`; các phiên rõ ràng khác không thuộc về
thời gian giữ lại đó. Dọn dẹp model-run chỉ được áp dụng dưới áp lực giới hạn
mục phiên. Các lần chạy cron cô lập giữ điều khiển `cron.sessionRetention` riêng,
độc lập với thời gian giữ lại probe model-run.

OpenClaw không còn tạo bản sao lưu xoay vòng `sessions.json.bak.*` tự động trong các lần ghi Gateway. Khóa `session.maintenance.rotateBytes` cũ bị bỏ qua và `openclaw doctor --fix` xóa nó khỏi các cấu hình cũ hơn.

Đột biến transcript dùng khóa ghi phiên trên tệp transcript. Việc lấy khóa chờ tối đa
`session.writeLock.acquireTimeoutMs` trước khi hiển thị lỗi phiên bận; mặc định là `60000`
ms. Chỉ tăng giá trị này khi công việc chuẩn bị, dọn dẹp, Compaction, hoặc phản chiếu transcript hợp lệ tranh chấp
lâu hơn trên máy chậm. `session.writeLock.staleMs` kiểm soát khi nào một khóa hiện có có thể được
thu hồi vì đã cũ; mặc định là `1800000` ms. `session.writeLock.maxHoldMs` kiểm soát
ngưỡng nhả watchdog trong tiến trình; mặc định là `300000` ms. Các ghi đè env khẩn cấp là
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`, và
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Thứ tự thực thi cho dọn dẹp ngân sách đĩa (`mode: "enforce"`):

1. Trước tiên xóa các tạo tác lưu trữ, transcript mồ côi, hoặc quỹ đạo mồ côi cũ nhất.
2. Nếu vẫn cao hơn mục tiêu, loại bỏ các mục phiên cũ nhất và tệp transcript/quỹ đạo của chúng.
3. Tiếp tục cho đến khi mức dùng bằng hoặc thấp hơn `highWaterBytes`.

Trong `mode: "warn"`, OpenClaw báo cáo các lần loại bỏ tiềm năng nhưng không thay đổi kho/tệp.

Chạy bảo trì theo yêu cầu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Phiên Cron và nhật ký chạy

Các lần chạy cron cô lập cũng tạo mục phiên/transcript, và chúng có điều khiển giữ lại chuyên biệt:

- `cron.sessionRetention` (mặc định `24h`) cắt tỉa các phiên chạy cron cô lập cũ khỏi kho phiên (`false` tắt).
- `cron.runLog.keepLines` cắt tỉa các hàng lịch sử chạy SQLite được giữ lại theo từng công việc cron (mặc định: `2000`). `cron.runLog.maxBytes` vẫn được chấp nhận cho nhật ký chạy dựa trên tệp cũ hơn.

Khi cron buộc tạo một phiên chạy cô lập mới, nó làm sạch mục phiên
`cron:<jobId>` trước đó trước khi ghi hàng mới. Nó mang theo các tùy chọn an toàn
như thiết lập thinking/fast/verbose, nhãn, và ghi đè mô hình/xác thực do
người dùng chọn rõ ràng. Nó bỏ ngữ cảnh hội thoại xung quanh như
định tuyến kênh/nhóm, chính sách gửi hoặc hàng đợi, nâng quyền, nguồn gốc, và ràng buộc runtime
ACP để một lần chạy cô lập mới không thể kế thừa quyền phân phối hoặc
runtime đã cũ từ lần chạy cũ hơn.

---

## Khóa phiên (`sessionKey`)

Một `sessionKey` xác định _bạn đang ở bucket hội thoại nào_ (định tuyến + cô lập).

Các mẫu phổ biến:

- Trò chuyện chính/trực tiếp (theo tác nhân): `agent:<agentId>:<mainKey>` (mặc định `main`)
- Nhóm: `agent:<agentId>:<channel>:group:<id>`
- Phòng/kênh (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` hoặc `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (trừ khi bị ghi đè)

Các quy tắc chuẩn được ghi tài liệu tại [/concepts/session](/vi/concepts/session).

---

## Id phiên (`sessionId`)

Mỗi `sessionKey` trỏ tới một `sessionId` hiện tại (tệp transcript tiếp tục cuộc trò chuyện).

Quy tắc kinh nghiệm:

- **Đặt lại** (`/new`, `/reset`) tạo một `sessionId` mới cho `sessionKey` đó.
- **Đặt lại hằng ngày** (mặc định 4:00 AM giờ địa phương trên máy chủ gateway) tạo một `sessionId` mới vào thông điệp tiếp theo sau ranh giới đặt lại.
- **Hết hạn do nhàn rỗi** (`session.reset.idleMinutes` hoặc `session.idleMinutes` cũ) tạo một `sessionId` mới khi một thông điệp đến sau cửa sổ nhàn rỗi. Khi cả hằng ngày + nhàn rỗi đều được cấu hình, điều nào hết hạn trước sẽ thắng.
- **Tiếp tục khi Control UI kết nối lại** có thể giữ phiên hiện đang hiển thị cho một lần gửi sau kết nối lại khi Gateway nhận được `sessionId` khớp từ một máy khách UI của operator. Các lần gửi cũ thông thường vẫn tạo một `sessionId` mới.
- **Sự kiện hệ thống** (Heartbeat, đánh thức cron, thông báo exec, ghi sổ Gateway) có thể thay đổi hàng phiên nhưng không kéo dài độ mới của đặt lại hằng ngày/nhàn rỗi. Rollover đặt lại loại bỏ các thông báo sự kiện hệ thống đã xếp hàng cho phiên trước đó trước khi prompt mới được dựng.
- **Chính sách fork cha** dùng nhánh đang hoạt động của OpenClaw khi tạo một luồng hoặc fork tác nhân phụ. Nếu nhánh đó quá lớn, OpenClaw khởi động con với ngữ cảnh cô lập thay vì thất bại hoặc kế thừa lịch sử không dùng được. Chính sách định cỡ là tự động; cấu hình `session.parentForkMaxTokens` cũ được `openclaw doctor --fix` xóa.

Chi tiết triển khai: quyết định diễn ra trong `initSessionState()` tại `src/auto-reply/reply/session.ts`.

---

## Lược đồ kho phiên (`sessions.json`)

Kiểu giá trị của kho là `SessionEntry` trong `src/config/sessions.ts`.

Các trường chính (không đầy đủ):

- `sessionId`: id transcript hiện tại (tên tệp được suy ra từ giá trị này trừ khi `sessionFile` được đặt)
- `sessionStartedAt`: dấu thời gian bắt đầu cho `sessionId` hiện tại; độ mới của đặt lại hằng ngày
  dùng giá trị này. Các hàng cũ có thể suy ra nó từ header phiên JSONL.
- `lastInteractionAt`: dấu thời gian tương tác người dùng/kênh thực gần nhất; độ mới của đặt lại nhàn rỗi
  dùng giá trị này để Heartbeat, cron, và sự kiện exec không giữ phiên
  sống. Các hàng cũ không có trường này sẽ fallback về thời gian bắt đầu phiên đã khôi phục
  cho độ mới nhàn rỗi.
- `updatedAt`: dấu thời gian đột biến hàng kho gần nhất, được dùng để liệt kê, cắt tỉa, và
  ghi sổ. Nó không phải thẩm quyền cho độ mới của đặt lại hằng ngày/nhàn rỗi.
- `sessionFile`: ghi đè đường dẫn transcript rõ ràng tùy chọn
- `chatType`: `direct | group | room` (giúp UI và chính sách gửi)
- `provider`, `subject`, `room`, `space`, `displayName`: siêu dữ liệu để gắn nhãn nhóm/kênh
- Công tắc bật/tắt:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (ghi đè theo từng phiên)
- Chọn mô hình:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Bộ đếm token (best-effort / phụ thuộc nhà cung cấp):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: số lần auto-Compaction hoàn tất cho khóa phiên này
- `memoryFlushAt`: dấu thời gian cho lần flush bộ nhớ trước Compaction gần nhất
- `memoryFlushCompactionCount`: số lần Compaction khi lần flush gần nhất chạy

Kho an toàn để chỉnh sửa, nhưng Gateway là thẩm quyền: nó có thể ghi lại hoặc tái hydrat hóa các mục khi phiên chạy.

---

## Cấu trúc transcript (`*.jsonl`)

Transcript được quản lý bởi `SessionManager` của `openclaw/plugin-sdk/agent-sessions`.

Tệp là JSONL:

- Dòng đầu tiên: header phiên (`type: "session"`, bao gồm `id`, `cwd`, `timestamp`, `parentSession` tùy chọn)
- Sau đó: các mục phiên với `id` + `parentId` (cây)

Các kiểu mục đáng chú ý:

- `message`: thông điệp user/assistant/toolResult
- `custom_message`: thông điệp do tiện ích mở rộng chèn và _có_ đi vào ngữ cảnh mô hình (có thể bị ẩn khỏi UI)
- `custom`: trạng thái tiện ích mở rộng _không_ đi vào ngữ cảnh mô hình
- `compaction`: bản tóm tắt Compaction được lưu bền vững với `firstKeptEntryId` và `tokensBefore`
- `branch_summary`: bản tóm tắt được lưu bền vững khi điều hướng một nhánh cây

OpenClaw cố ý **không** "chỉnh sửa lại" bản ghi hội thoại; Gateway dùng `SessionManager` để đọc/ghi chúng.

---

## Cửa sổ ngữ cảnh so với token được theo dõi

Có hai khái niệm khác nhau cần quan tâm:

1. **Cửa sổ ngữ cảnh mô hình**: giới hạn cứng theo từng mô hình (token hiển thị với mô hình)
2. **Bộ đếm kho phiên**: thống kê cuốn chiếu được ghi vào `sessions.json` (dùng cho /status và bảng điều khiển)

Nếu bạn đang tinh chỉnh giới hạn:

- Cửa sổ ngữ cảnh đến từ danh mục mô hình (và có thể được ghi đè qua cấu hình).
- `contextTokens` trong kho là giá trị ước tính/báo cáo khi chạy; đừng xem nó là một bảo đảm nghiêm ngặt.

Xem thêm tại [/token-use](/vi/reference/token-use).

---

## Compaction: đó là gì

Compaction tóm tắt cuộc trò chuyện cũ hơn thành một mục `compaction` được lưu bền vững trong bản ghi hội thoại và giữ nguyên các thông điệp gần đây.

Sau Compaction, các lượt sau sẽ thấy:

- Bản tóm tắt Compaction
- Các thông điệp sau `firstKeptEntryId`

Việc chèn lại phần AGENTS.md sau Compaction là tùy chọn qua
`agents.defaults.compaction.postCompactionSections`; khi chưa đặt hoặc là `[]`,
OpenClaw không nối thêm trích đoạn AGENTS.md lên trên bản tóm tắt Compaction.

Compaction là **bền vững** (khác với cắt tỉa phiên). Xem [/concepts/session-pruning](/vi/concepts/session-pruning).

## Ranh giới khối Compaction và ghép cặp công cụ

Khi OpenClaw chia một bản ghi hội thoại dài thành các khối Compaction, nó giữ
các lời gọi công cụ của assistant được ghép với các mục `toolResult` tương ứng.

- Nếu điểm chia theo tỷ lệ token rơi vào giữa một lời gọi công cụ và kết quả của nó, OpenClaw
  dịch ranh giới về thông điệp lời gọi công cụ của assistant thay vì tách
  cặp đó.
- Nếu một khối tool-result ở cuối nếu giữ nguyên sẽ đẩy khối vượt mục tiêu,
  OpenClaw giữ nguyên khối công cụ đang chờ đó và giữ nguyên phần đuôi chưa tóm tắt.
- Các khối lời gọi công cụ bị hủy/lỗi không giữ mở một điểm chia đang chờ.

---

## Khi nào auto-compaction diễn ra (runtime OpenClaw)

Trong tác tử OpenClaw nhúng, auto-compaction kích hoạt trong hai trường hợp:

1. **Khôi phục khi tràn**: mô hình trả về lỗi tràn ngữ cảnh
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, và các biến thể tương tự theo dạng nhà cung cấp) → compact → thử lại.
   Khi nhà cung cấp báo số token đã thử, OpenClaw chuyển tiếp số đếm quan sát được đó
   vào Compaction khôi phục tràn. Nếu nhà cung cấp xác nhận tràn
   nhưng không cung cấp số đếm có thể phân tích, OpenClaw truyền một số đếm tổng hợp
   vừa vượt ngân sách tối thiểu cho các công cụ Compaction và chẩn đoán.
   Nếu khôi phục tràn vẫn thất bại, OpenClaw hiển thị hướng dẫn rõ ràng cho
   người dùng và giữ nguyên ánh xạ phiên hiện tại thay vì âm thầm xoay
   khóa phiên sang một id phiên mới. Bước tiếp theo do người vận hành kiểm soát:
   thử lại thông điệp, chạy `/compact`, hoặc chạy `/new` khi muốn có một phiên mới.
2. **Bảo trì theo ngưỡng**: sau một lượt thành công, khi:

`contextTokens > contextWindow - reserveTokens`

Trong đó:

- `contextWindow` là cửa sổ ngữ cảnh của mô hình
- `reserveTokens` là phần dự trữ dành cho prompt + đầu ra mô hình tiếp theo

Đây là ngữ nghĩa runtime của OpenClaw.

OpenClaw cũng có thể kích hoạt Compaction cục bộ trước kiểm tra trước khi mở
lượt chạy tiếp theo khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt và
tệp bản ghi hội thoại đang hoạt động đạt kích thước đó. Đây là cơ chế bảo vệ theo kích thước tệp cho
chi phí mở lại cục bộ, không phải lưu trữ thô: OpenClaw vẫn chạy Compaction ngữ nghĩa bình thường,
và nó yêu cầu `truncateAfterCompaction` để bản tóm tắt đã compact có thể trở thành
bản ghi hội thoại kế nhiệm mới.

Đối với các lượt chạy OpenClaw nhúng, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
thêm một cơ chế bảo vệ vòng lặp công cụ tùy chọn. Sau khi kết quả công cụ được nối thêm và trước
lời gọi mô hình tiếp theo, OpenClaw ước tính áp lực prompt bằng cùng logic ngân sách trước kiểm tra
được dùng khi bắt đầu lượt. Nếu ngữ cảnh không còn vừa, cơ chế bảo vệ
không compact bên trong hook `transformContext` của runtime OpenClaw. Nó phát tín hiệu
trước kiểm tra giữa lượt có cấu trúc, dừng lần gửi prompt hiện tại, và để
vòng lặp chạy bên ngoài dùng đường khôi phục hiện có: cắt bớt kết quả công cụ quá lớn
khi như vậy là đủ, hoặc kích hoạt chế độ Compaction đã cấu hình và thử lại. Tùy chọn này
bị tắt theo mặc định và hoạt động với cả chế độ Compaction `default` và `safeguard`,
bao gồm Compaction safeguard dựa trên nhà cung cấp.
Điều này độc lập với `maxActiveTranscriptBytes`: cơ chế bảo vệ theo kích thước byte chạy
trước khi mở một lượt, còn trước kiểm tra giữa lượt chạy muộn hơn trong vòng lặp công cụ OpenClaw nhúng
sau khi các kết quả công cụ mới đã được nối thêm.

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

OpenClaw cũng áp dụng một sàn an toàn cho các lượt chạy nhúng:

- Nếu `compaction.reserveTokens < reserveTokensFloor`, OpenClaw tăng nó lên.
- Sàn mặc định là `20000` token.
- Đặt `agents.defaults.compaction.reserveTokensFloor: 0` để tắt sàn.
- Nếu nó đã cao hơn, OpenClaw giữ nguyên.
- `/compact` thủ công tôn trọng `agents.defaults.compaction.keepRecentTokens`
  rõ ràng và giữ điểm cắt phần đuôi gần đây của runtime OpenClaw. Khi không có ngân sách giữ lại rõ ràng,
  Compaction thủ công vẫn là một điểm kiểm tra cứng và ngữ cảnh được dựng lại bắt đầu từ
  bản tóm tắt mới.
- Đặt `agents.defaults.compaction.midTurnPrecheck.enabled: true` để chạy
  trước kiểm tra vòng lặp công cụ tùy chọn sau các kết quả công cụ mới và trước lời gọi mô hình
  tiếp theo. Đây chỉ là cơ chế kích hoạt; việc tạo bản tóm tắt vẫn dùng đường
  Compaction đã cấu hình. Nó độc lập với `maxActiveTranscriptBytes`, là
  cơ chế bảo vệ theo kích thước byte của bản ghi hội thoại đang hoạt động khi bắt đầu lượt.
- Đặt `agents.defaults.compaction.maxActiveTranscriptBytes` thành một giá trị byte hoặc
  chuỗi như `"20mb"` để chạy Compaction cục bộ trước một lượt khi bản ghi hội thoại đang hoạt động
  trở nên lớn. Cơ chế bảo vệ này chỉ hoạt động khi
  `truncateAfterCompaction` cũng được bật. Để trống hoặc đặt `0` để
  tắt.
- Khi `agents.defaults.compaction.truncateAfterCompaction` được bật,
  OpenClaw xoay bản ghi hội thoại đang hoạt động sang một JSONL kế nhiệm đã compact sau
  Compaction. Các hành động điểm kiểm tra nhánh/khôi phục dùng bản kế nhiệm đã compact đó;
  các tệp điểm kiểm tra tiền Compaction cũ vẫn đọc được khi còn được tham chiếu.

Lý do: chừa đủ khoảng trống cho "việc dọn dẹp" nhiều lượt (như ghi bộ nhớ) trước khi Compaction trở nên không thể tránh khỏi.

Triển khai: `applyAgentCompactionSettingsFromConfig()` trong `src/agents/agent-settings.ts`
(được gọi từ các đường thiết lập lượt embedded-runner và Compaction).

---

## Nhà cung cấp Compaction có thể cắm thêm

Plugin có thể đăng ký một nhà cung cấp Compaction qua `registerCompactionProvider()` trên API plugin. Khi `agents.defaults.compaction.provider` được đặt thành id nhà cung cấp đã đăng ký, tiện ích mở rộng safeguard ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì pipeline `summarizeInStages` tích hợp sẵn.

- `provider`: id của một Plugin nhà cung cấp Compaction đã đăng ký. Để trống để dùng tóm tắt LLM mặc định.
- Đặt `provider` sẽ buộc `mode: "safeguard"`.
- Nhà cung cấp nhận cùng chỉ dẫn Compaction và chính sách bảo toàn định danh như đường tích hợp sẵn.
- Safeguard vẫn giữ ngữ cảnh hậu tố lượt gần đây và lượt bị chia sau đầu ra của nhà cung cấp.
- Tóm tắt safeguard tích hợp sẵn chưng cất lại các bản tóm tắt trước đó với thông điệp mới
  thay vì giữ nguyên văn toàn bộ bản tóm tắt trước.
- Chế độ safeguard bật kiểm tra chất lượng bản tóm tắt theo mặc định; đặt
  `qualityGuard.enabled: false` để bỏ qua hành vi thử lại khi đầu ra sai định dạng.
- Nếu nhà cung cấp thất bại hoặc trả về kết quả rỗng, OpenClaw tự động quay về tóm tắt LLM tích hợp sẵn.
- Tín hiệu hủy/hết thời gian chờ được ném lại (không bị nuốt) để tôn trọng việc hủy của bên gọi.

Nguồn: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Bề mặt hiển thị với người dùng

Bạn có thể quan sát Compaction và trạng thái phiên qua:

- `/status` (trong bất kỳ phiên chat nào)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Nhật ký Gateway (`pnpm gateway:watch` hoặc `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Chế độ chi tiết: `🧹 Auto-compaction complete` + số lần Compaction

---

## Dọn dẹp im lặng (`NO_REPLY`)

OpenClaw hỗ trợ các lượt "im lặng" cho tác vụ nền mà người dùng không nên thấy đầu ra trung gian.

Quy ước:

- Assistant bắt đầu đầu ra bằng token im lặng chính xác `NO_REPLY` /
  `no_reply` để chỉ ra "không gửi phản hồi cho người dùng".
- OpenClaw loại bỏ/ức chế nội dung này ở lớp gửi.
- Việc ức chế token im lặng chính xác không phân biệt chữ hoa chữ thường, nên `NO_REPLY` và
  `no_reply` đều được tính khi toàn bộ payload chỉ là token im lặng.
- Điều này chỉ dành cho các lượt nền/không gửi thật sự; nó không phải lối tắt cho
  các yêu cầu người dùng có thể hành động thông thường.

Kể từ `2026.1.10`, OpenClaw cũng ức chế **luồng phát nháp/đang nhập** khi một
khối một phần bắt đầu bằng `NO_REPLY`, nên các thao tác im lặng không rò rỉ đầu ra
một phần giữa lượt.

---

## "Ghi xả bộ nhớ" trước Compaction (đã triển khai)

Mục tiêu: trước khi auto-compaction diễn ra, chạy một lượt tác tử im lặng ghi trạng thái
bền vững ra đĩa (ví dụ `memory/YYYY-MM-DD.md` trong workspace tác tử) để Compaction không thể
xóa ngữ cảnh quan trọng.

OpenClaw dùng cách tiếp cận **ghi xả trước ngưỡng**:

1. Theo dõi mức sử dụng ngữ cảnh phiên.
2. Khi nó vượt qua một "ngưỡng mềm" (thấp hơn ngưỡng Compaction của runtime OpenClaw), chạy một chỉ thị
   "ghi bộ nhớ ngay" im lặng cho tác tử.
3. Dùng token im lặng chính xác `NO_REPLY` / `no_reply` để người dùng không thấy
   gì.

Cấu hình (`agents.defaults.compaction.memoryFlush`):

- `enabled` (mặc định: `true`)
- `model` (ghi đè nhà cung cấp/mô hình chính xác tùy chọn cho lượt ghi xả, ví dụ `ollama/qwen3:8b`)
- `softThresholdTokens` (mặc định: `4000`)
- `prompt` (thông điệp người dùng cho lượt ghi xả)
- `systemPrompt` (prompt hệ thống bổ sung được nối thêm cho lượt ghi xả)

Ghi chú:

- Prompt/prompt hệ thống mặc định bao gồm gợi ý `NO_REPLY` để ức chế
  việc gửi.
- Khi `model` được đặt, lượt ghi xả dùng mô hình đó mà không kế thừa chuỗi dự phòng
  của phiên đang hoạt động, nên việc dọn dẹp chỉ cục bộ không âm thầm
  dự phòng sang mô hình trò chuyện trả phí.
- Ghi xả chạy một lần mỗi chu kỳ Compaction (được theo dõi trong `sessions.json`).
- Ghi xả chỉ chạy cho các phiên OpenClaw nhúng (backend CLI bỏ qua).
- Ghi xả bị bỏ qua khi workspace phiên là chỉ đọc (`workspaceAccess: "ro"` hoặc `"none"`).
- Xem [Bộ nhớ](/vi/concepts/memory) để biết bố cục tệp workspace và mẫu ghi.

OpenClaw cũng cung cấp một hook `session_before_compact` trong API tiện ích mở rộng, nhưng logic
ghi xả của OpenClaw hiện nằm ở phía Gateway.

---

## Danh sách kiểm tra xử lý sự cố

- Khóa phiên sai? Bắt đầu với [/concepts/session](/vi/concepts/session) và xác nhận `sessionKey` trong `/status`.
- Kho và bản ghi hội thoại không khớp? Xác nhận máy chủ Gateway và đường dẫn kho từ `openclaw status`.
- Compaction quá thường xuyên? Kiểm tra:
  - cửa sổ ngữ cảnh mô hình (quá nhỏ)
  - cài đặt Compaction (`reserveTokens` quá cao so với cửa sổ mô hình có thể gây Compaction sớm hơn)
  - phình to kết quả công cụ: bật/tinh chỉnh cắt tỉa phiên
- Lượt im lặng bị rò rỉ? Xác nhận phản hồi bắt đầu bằng `NO_REPLY` (token chính xác, không phân biệt chữ hoa chữ thường) và bạn đang dùng bản dựng có bản sửa ức chế streaming.

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
