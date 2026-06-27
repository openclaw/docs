---
read_when:
    - Di chuyển dữ liệu runtime, bộ nhớ đệm, bản ghi hội thoại, trạng thái tác vụ hoặc tệp nháp của OpenClaw vào SQLite
    - Thiết kế các di trú doctor từ tệp JSON hoặc JSONL cũ
    - Thay đổi hành vi sao lưu, khôi phục, VFS hoặc lưu trữ worker
    - Xóa khóa phiên, cắt tỉa, cắt ngắn hoặc các đường dẫn tương thích JSON
summary: Kế hoạch di chuyển để biến SQLite thành lớp trạng thái bền vững và bộ nhớ đệm chính trong khi vẫn giữ cấu hình dựa trên tệp
title: Tái cấu trúc trạng thái ưu tiên cơ sở dữ liệu
x-i18n:
    generated_at: "2026-06-27T18:07:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# Tái cấu trúc trạng thái ưu tiên cơ sở dữ liệu

## Quyết định

Dùng bố cục SQLite hai cấp:

- Cơ sở dữ liệu toàn cục: `~/.openclaw/state/openclaw.sqlite`
- Cơ sở dữ liệu tác tử: một cơ sở dữ liệu SQLite cho mỗi tác tử cho không gian làm việc do tác tử sở hữu,
  bản ghi hội thoại, VFS, tạo tác, và trạng thái thời gian chạy lớn theo từng tác tử
- Cấu hình vẫn dựa trên tệp: `openclaw.json` vẫn nằm ngoài
  cơ sở dữ liệu. Hồ sơ xác thực thời gian chạy chuyển sang SQLite; các tệp thông tin xác thực của nhà cung cấp bên ngoài hoặc CLI
  vẫn do chủ sở hữu quản lý bên ngoài cơ sở dữ liệu của OpenClaw.

Cơ sở dữ liệu toàn cục là cơ sở dữ liệu mặt phẳng điều khiển. Nó sở hữu việc khám phá tác tử,
trạng thái Gateway dùng chung, ghép cặp, trạng thái thiết bị/nút, sổ cái tác vụ và luồng, trạng thái Plugin,
trạng thái thời gian chạy của bộ lập lịch, siêu dữ liệu sao lưu, và trạng thái di chuyển.

Cơ sở dữ liệu tác tử là cơ sở dữ liệu mặt phẳng dữ liệu. Nó sở hữu siêu dữ liệu phiên của tác tử,
luồng sự kiện bản ghi hội thoại, không gian làm việc VFS hoặc không gian tên nháp, tạo tác công cụ,
tạo tác lượt chạy, và dữ liệu bộ nhớ đệm cục bộ của tác tử có thể tìm kiếm/lập chỉ mục.

Điều này tạo ra một khung nhìn toàn cục bền vững mà không buộc các không gian làm việc tác tử lớn,
bản ghi hội thoại, và dữ liệu nháp nhị phân đi vào làn ghi Gateway dùng chung.

## Hợp đồng cứng

Quá trình di chuyển này có một hình dạng thời gian chạy chuẩn duy nhất:

- Các hàng phiên chỉ lưu siêu dữ liệu phiên. Chúng không được lưu
  `transcriptLocator`, đường dẫn tệp bản ghi hội thoại, đường dẫn JSONL đồng cấp, đường dẫn khóa,
  siêu dữ liệu cắt tỉa, hoặc con trỏ tương thích thời kỳ tệp.
- Danh tính bản ghi hội thoại luôn là danh tính SQLite: `{agentId, sessionId}` cộng với
  siêu dữ liệu chủ đề tùy chọn khi giao thức cần.
- `sqlite-transcript://...` không phải là danh tính thời gian chạy hoặc giao thức. Mã mới không được
  suy ra, lưu, truyền, phân tích, hoặc di chuyển bộ định vị bản ghi hội thoại. Thời gian chạy và
  kiểm thử không nên chứa bộ định vị giả nào; tài liệu chỉ có thể nhắc đến chuỗi này
  để cấm nó.
- `sessions.json` cũ, JSONL bản ghi hội thoại, `.jsonl.lock`, cắt tỉa, rút gọn,
  và logic đường dẫn phiên cũ chỉ thuộc về đường dẫn di chuyển/nhập của doctor.
- Bí danh cấu hình phiên cũ chỉ thuộc về di chuyển doctor. Thời gian chạy
  không diễn giải `session.idleMinutes`, `session.resetByType.dm`, hoặc
  bí danh phiên chính `agent:main:*` liên tác tử cho một tác tử đã cấu hình khác.
- Danh tính định tuyến phiên là trạng thái quan hệ có kiểu. Các đường dẫn thời gian chạy nóng và UI
  nên đọc `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations`, và
  `session_conversations`; chúng không được phân tích `session_key` hoặc khai thác
  `session_entries.entry_json` để lấy danh tính nhà cung cấp, ngoại trừ như một bóng tương thích
  trong khi các điểm gọi cũ đang bị xóa.
- Các dấu hiệu tin nhắn trực tiếp ở cấp kênh như `dm` so với `direct` là từ vựng
  định tuyến, không phải bộ định vị bản ghi hội thoại hoặc tay cầm tương thích kho tệp.
- Cấu hình trình xử lý hook cũ chỉ thuộc về các bề mặt cảnh báo/di chuyển của doctor.
  Thời gian chạy không được tải `hooks.internal.handlers`; hook chạy chỉ thông qua các
  thư mục hook đã phát hiện và siêu dữ liệu `HOOK.md`.
- Khởi động thời gian chạy, đường dẫn trả lời nóng, Compaction, đặt lại, khôi phục, chẩn đoán,
  TTS, hook bộ nhớ, tác tử con, định tuyến lệnh Plugin, ranh giới giao thức, và
  hook phải truyền `{agentId, sessionId}` qua thời gian chạy.
- Kiểm thử nên gieo và xác nhận các hàng bản ghi hội thoại SQLite thông qua
  `{agentId, sessionId}`. Các kiểm thử chỉ chứng minh chuyển tiếp đường dẫn JSONL,
  bảo toàn bộ định vị do caller cung cấp, hoặc tương thích tệp bản ghi hội thoại nên
  bị xóa, trừ khi chúng bao phủ nhập doctor, vật liệu hóa hỗ trợ/gỡ lỗi không phải phiên,
  hoặc hình dạng giao thức.
- `runEmbeddedPiAgent(...)`, các lượt chạy worker đã chuẩn bị, và lần thử nhúng bên trong
  không được chấp nhận bộ định vị bản ghi hội thoại. Chúng mở trình quản lý bản ghi hội thoại SQLite
  bằng `{agentId, sessionId}` và truyền trình quản lý đó cho phiên tác tử
  tương thích PI đã nội bộ hóa, để caller lỗi thời không thể khiến runner ghi
  bản ghi hội thoại JSON/JSONL.
- Chẩn đoán runner phải lưu bản ghi dấu vết thời gian chạy/bộ nhớ đệm/payload trong SQLite.
  Chẩn đoán thời gian chạy không được để lộ núm ghi đè tệp JSONL hoặc helper xuất
  JSONL bản ghi hội thoại chung; các bản xuất hướng người dùng có thể vật liệu hóa tạo tác rõ ràng
  từ các hàng cơ sở dữ liệu mà không đưa tên tệp trở lại thời gian chạy.
- Ghi nhật ký luồng thô dùng `OPENCLAW_RAW_STREAM=1` cộng với các hàng chẩn đoán SQLite.
  Hợp đồng bộ ghi tệp pi-mono cũ `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH`, và
  `raw-openai-completions.jsonl` không thuộc thời gian chạy hoặc kiểm thử OpenClaw.
- Lập chỉ mục bộ nhớ QMD không được xuất bản ghi hội thoại SQLite sang tệp markdown.
  QMD chỉ lập chỉ mục các tệp bộ nhớ đã cấu hình; tìm kiếm bản ghi hội thoại phiên vẫn
  dựa trên SQLite.
- Đường dẫn con SDK QMD chỉ dành cho QMD đối với mã mới. Các helper lập chỉ mục bản ghi hội thoại phiên SQLite
  nằm trên `memory-core-host-engine-session-transcripts`; mọi tái xuất QMD
  chỉ là tương thích và không được dùng bởi mã thời gian chạy.
- Các chỉ mục bộ nhớ tích hợp nằm trong cơ sở dữ liệu tác tử sở hữu. Cấu hình thời gian chạy và
  hợp đồng thời gian chạy đã phân giải không được để lộ `memorySearch.store.path`; doctor
  xóa khóa cấu hình cũ đó và mã hiện tại truyền `databasePath` của tác tử
  nội bộ.

Công việc triển khai nên tiếp tục xóa mã cho đến khi các tuyên bố này đúng
mà không có ngoại lệ bên ngoài ranh giới doctor/nhập/xuất/gỡ lỗi.

## Trạng thái mục tiêu và tiến độ

### Mục tiêu cứng

- Một cơ sở dữ liệu SQLite toàn cục sở hữu trạng thái mặt phẳng điều khiển:
  `state/openclaw.sqlite`.
- Một cơ sở dữ liệu SQLite theo từng tác tử sở hữu trạng thái mặt phẳng dữ liệu:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Cấu hình vẫn dựa trên tệp. `openclaw.json` không thuộc phần tái cấu trúc
  cơ sở dữ liệu này.
- Tệp cũ chỉ là đầu vào di chuyển doctor.
- Thời gian chạy không bao giờ ghi hoặc đọc JSONL phiên hoặc bản ghi hội thoại như trạng thái hoạt động.

### Các trạng thái mục tiêu

- `not-started`: mã thời gian chạy thời kỳ tệp vẫn ghi trạng thái hoạt động.
- `migrating`: mã doctor/nhập có thể chuyển dữ liệu tệp vào SQLite.
- `dual-read`: cầu nối tạm thời đọc cả SQLite và tệp cũ. Trạng thái này
  bị cấm đối với lần tái cấu trúc này trừ khi được ghi rõ là
  chỉ dành cho doctor.
- `sqlite-runtime`: thời gian chạy chỉ đọc và ghi SQLite.
- `clean`: API và kiểm thử thời gian chạy cũ bị xóa, và guard ngăn
  hồi quy.
- `done`: tài liệu, kiểm thử, sao lưu, di chuyển doctor, và các kiểm tra đã thay đổi chứng minh
  trạng thái sạch.

### Trạng thái hiện tại

- Phiên: `clean` cho thời gian chạy. Các hàng phiên nằm trong cơ sở dữ liệu theo từng tác tử,
  API thời gian chạy dùng `{agentId, sessionId}` hoặc `{agentId, sessionKey}`, và
  `sessions.json` là đầu vào cũ chỉ dành cho doctor.
- Bản ghi hội thoại: `clean` cho thời gian chạy. Sự kiện bản ghi hội thoại, danh tính, ảnh chụp nhanh,
  và sự kiện thời gian chạy quỹ đạo nằm trong cơ sở dữ liệu theo từng tác tử. Thời gian chạy
  không còn chấp nhận bộ định vị bản ghi hội thoại hoặc đường dẫn bản ghi hội thoại JSONL.
- Runner PI nhúng: `clean`. Lượt chạy PI nhúng, worker đã chuẩn bị, Compaction,
  và vòng lặp thử lại dùng phạm vi phiên SQLite và từ chối tay cầm bản ghi hội thoại lỗi thời.
- Cron: `clean` cho thời gian chạy. Thời gian chạy dùng `cron_jobs` và `cron_run_logs`;
  kiểm thử thời gian chạy dùng cách đặt tên `storeKey` của SQLite, và đường dẫn cron thời kỳ tệp vẫn chỉ nằm trong
  kiểm thử di chuyển cũ của doctor.
- Sổ đăng ký tác vụ: `clean`. Các hàng thời gian chạy tác vụ và Luồng tác vụ nằm trong
  `state/openclaw.sqlite`; các bộ nhập SQLite sidecar chưa phát hành đã bị xóa.
- Trạng thái Plugin: `clean`. Các hàng trạng thái/blob Plugin nằm trong cơ sở dữ liệu toàn cục dùng chung;
  các helper SQLite sidecar trạng thái Plugin cũ được chặn bằng guard.
- Bộ nhớ: `sqlite-runtime` cho bộ nhớ tích hợp và lập chỉ mục bản ghi hội thoại phiên.
  Các bảng chỉ mục bộ nhớ nằm trong cơ sở dữ liệu theo từng tác tử, trạng thái bộ nhớ Plugin dùng
  các hàng trạng thái Plugin dùng chung, và tệp bộ nhớ cũ là đầu vào di chuyển doctor
  hoặc nội dung không gian làm việc của người dùng.
- Sao lưu: `sqlite-runtime`. Các giai đoạn sao lưu nén ảnh chụp nhanh SQLite, bỏ qua sidecar
  WAL/SHM đang hoạt động, xác minh tính toàn vẹn SQLite, và ghi các lượt chạy sao lưu trong
  cơ sở dữ liệu toàn cục.
- Di chuyển doctor: `migrating`, có chủ ý. Doctor nhập JSON,
  JSONL, và các kho sidecar đã nghỉ hưu vào SQLite, ghi lại lượt chạy/nguồn di chuyển,
  và xóa các nguồn thành công.
- Tập lệnh E2E: `clean` cho độ phủ thời gian chạy. Gieo Docker MCP ghi
  các hàng SQLite. Tập lệnh Docker runtime-context chỉ tạo JSONL cũ bên trong
  hạt giống di chuyển doctor và đặt tên rõ ràng cho đường dẫn chỉ mục phiên cũ.

### Công việc còn lại

- [x] Đổi tên các biến kho kiểm thử thời gian chạy cron khỏi `storePath` trừ khi
      chúng là đầu vào cũ của doctor.
      Tệp: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Bằng chứng: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Xóa hoặc đổi tên các mock kiểm thử xuất thời kỳ tệp đã lỗi thời.
      Tệp: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Bằng chứng: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Làm cho hạt giống JSONL cũ của Docker runtime-context rõ ràng là chỉ dành cho doctor.
      Tệp: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Bằng chứng: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` chỉ hiển thị
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Giữ các kiểu được tạo của Kysely đồng bộ sau mọi thay đổi schema.
      Tệp: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Bằng chứng: không có thay đổi schema trong lượt này; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Chạy lại kiểm thử tập trung cho các kho, lệnh, và tập lệnh đã chạm.
      Bằng chứng: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Trước khi tuyên bố `done`, chạy cổng thay đổi hoặc bằng chứng rộng từ xa.
      Bằng chứng: `pnpm check:changed --timed -- <changed extension paths>` đã vượt qua trên
      lượt chạy Hetzner Crabbox `run_3f1cabf6b25c` sau khi thiết lập tạm thời Node 24/pnpm và
      định tuyến đường dẫn rõ ràng cho không gian làm việc đã đồng bộ không có `.git`.

### Không được hồi quy

- Không có bộ định vị bản ghi hội thoại.
- Không có tệp phiên hoạt động.
- Không có fixture kiểm thử JSONL giả ngoại trừ kiểm thử di chuyển cũ của doctor.
- Không truy cập SQLite thô nơi Kysely được kỳ vọng.
- Không có di chuyển DB cũ mới. Bố cục này chưa được phát hành; giữ phiên bản schema
  ở `1` trừ khi có lý do mạnh.

## Giả định đọc mã

Không có quyết định sản phẩm theo dõi nào đang chặn kế hoạch này. Việc triển khai nên
tiến hành với các giả định sau:

- Dùng trực tiếp `node:sqlite` và yêu cầu runtime Node 22+ cho đường dẫn lưu trữ
  này.
- Giữ đúng một tệp cấu hình thông thường. Không chuyển config, manifest plugin
  hoặc workspace Git vào SQLite trong lần refactor này.
- Không cần các tệp tương thích runtime. Các tệp JSON và JSONL cũ chỉ là đầu vào
  migration. Các sidecar SQLite cục bộ theo nhánh chưa từng được phát hành và sẽ
  bị xóa thay vì được import.
- `openclaw doctor --fix` sở hữu bước migration từ tệp cũ sang cơ sở dữ liệu.
  Khởi động runtime và `openclaw migrate` không nên mang các đường dẫn nâng cấp
  cơ sở dữ liệu OpenClaw cũ.
- Tương thích thông tin xác thực tuân theo cùng quy tắc: thông tin xác thực
  runtime nằm trong SQLite. Các tệp `auth-profiles.json`, `auth.json` theo từng
  agent, và `credentials/oauth.json` dùng chung cũ là đầu vào migration của
  doctor, rồi bị xóa sau khi import.
- Trạng thái catalog mô hình được tạo được hậu thuẫn bằng cơ sở dữ liệu. Mã
  runtime không được ghi `agents/<agentId>/agent/models.json`; các tệp
  `models.json` hiện có là đầu vào doctor cũ và bị xóa sau khi import vào
  `agent_model_catalogs`.
- Runtime không được migrate, chuẩn hóa hoặc bắc cầu các locator transcript.
  Định danh transcript đang hoạt động là `{agentId, sessionId}` trong SQLite.
  Đường dẫn tệp chỉ là đầu vào doctor cũ, và `sqlite-transcript://...` phải biến
  mất khỏi các bề mặt runtime, protocol, hook, và plugin thay vì được coi là một
  handle biên.
- Các lần đọc transcript SQLite của runtime không chạy migration hình dạng entry
  JSONL cũ hoặc ghi lại toàn bộ transcript để tương thích. Chuẩn hóa entry cũ ở
  lại trong các tiện ích doctor/import rõ ràng. Doctor chuẩn hóa các tệp
  transcript JSONL cũ trước khi chèn các hàng SQLite; các hàng runtime hiện tại
  đã được ghi theo schema transcript hiện tại. Export trajectory/session đọc
  nguyên các hàng đó và không được thực hiện migration cũ tại thời điểm export.
- Các helper parse/migration transcript JSONL cũ chỉ dành cho doctor. Mã định
  dạng transcript runtime chỉ xây dựng ngữ cảnh transcript SQLite hiện tại;
  doctor sở hữu các nâng cấp entry JSONL cũ trước khi chèn hàng.
- Helper streaming transcript JSONL cũ do runtime sở hữu đã bị xóa. Mã import
  của doctor sở hữu các lần đọc tệp cũ rõ ràng; lịch sử phiên runtime đọc các
  hàng SQLite.
- Các binding app-server Codex dùng `sessionId` của OpenClaw làm khóa chuẩn
  trong namespace plugin-state của Codex. `sessionKey` là metadata cho
  routing/hiển thị và không được thay thế id phiên bền vững hoặc khôi phục định
  danh tệp transcript.
- Các engine ngữ cảnh nhận trực tiếp hợp đồng runtime hiện tại. Registry không
  được bọc engine bằng các shim thử lại xóa `sessionKey`, `transcriptScope`, hoặc
  `prompt`; các engine không thể nhận tham số database-first hiện tại nên thất
  bại rõ ràng thay vì được bắc cầu.
- Đầu ra backup nên vẫn là một tệp archive. Nội dung cơ sở dữ liệu nên đi vào
  archive đó dưới dạng snapshot SQLite gọn, không phải các sidecar WAL thô đang
  chạy.
- Tìm kiếm transcript hữu ích nhưng không bắt buộc cho lần cắt database-first
  đầu tiên. Thiết kế schema để có thể thêm FTS sau.
- Thực thi worker nên vẫn ở trạng thái thử nghiệm phía sau settings trong khi
  biên cơ sở dữ liệu ổn định.

## Phát hiện khi đọc mã

Nhánh hiện tại đã vượt qua giai đoạn proof-of-concept. Cơ sở dữ liệu dùng chung
đã tồn tại, `node:sqlite` của Node được nối qua một helper runtime nhỏ, và các
store trước đây giờ ghi vào `state/openclaw.sqlite` hoặc cơ sở dữ liệu
`openclaw-agent.sqlite` sở hữu tương ứng.

Phần việc còn lại không phải là chọn SQLite; mà là giữ cho biên mới sạch và xóa
mọi giao diện mang hình dạng tương thích vẫn trông giống thế giới tệp cũ:

- `storePath` của phiên không còn là định danh runtime, hình dạng fixture test,
  hoặc trường payload trạng thái. Các test runtime và bridge không còn chứa tên
  hợp đồng `storePath`; mã doctor/migration sở hữu từ vựng cũ đó.
- Các lần ghi phiên không còn đi qua hàng đợi `store-writer.ts` cũ trong cùng
  tiến trình. Các lần ghi patch SQLite dùng phát hiện xung đột và thử lại có giới
  hạn thay vào đó.
- Khám phá đường dẫn cũ vẫn có các mục đích migration hợp lệ, nhưng mã runtime
  nên ngừng coi `sessions.json` và các tệp transcript JSONL là đích ghi có thể
  xảy ra.
- Các bảng do agent sở hữu nằm trong cơ sở dữ liệu SQLite theo từng agent. DB
  toàn cục giữ các hàng registry/control-plane; định danh transcript là
  `{agentId, sessionId}` trong các hàng transcript theo từng agent. Mã runtime
  không được lưu bền vững đường dẫn tệp transcript hoặc migrate locator
  transcript.
- Doctor đã import vài tệp cũ. Việc dọn dẹp là biến đó thành một triển khai
  migration rõ ràng duy nhất mà doctor gọi, cùng với một báo cáo migration bền
  vững.

Không có câu hỏi sản phẩm bổ sung nào đang chặn triển khai.

## Hình dạng mã hiện tại

Nhánh đã có một nền SQLite dùng chung thực sự:

- Mức runtime tối thiểu hiện là Node 22+: `package.json`, bộ bảo vệ runtime của CLI,
  mặc định trình cài đặt, bộ định vị runtime macOS, CI và tài liệu cài đặt công khai
  đều thống nhất. Lane tương thích Node 22 cũ đã bị gỡ bỏ.
- `src/state/openclaw-state-db.ts` mở `openclaw.sqlite`, đặt WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`, và áp dụng
  mô-đun schema được tạo từ
  `src/state/openclaw-state-schema.sql`.
- Các kiểu bảng Kysely và mô-đun schema runtime được tạo từ các cơ sở dữ liệu
  SQLite dùng một lần được tạo từ các tệp `.sql` đã commit; mã runtime không
  còn giữ các chuỗi schema sao chép thủ công cho cơ sở dữ liệu toàn cục, theo
  từng agent hoặc proxy capture.
- Các kho runtime suy ra kiểu hàng được chọn và được chèn từ các giao diện
  Kysely `DB` đã tạo đó thay vì tự tạo bóng hình dạng hàng SQLite thủ công. SQL
  thô vẫn chỉ giới hạn ở việc áp dụng schema, pragma và DDL chỉ dành cho migration.
- Các schema SQLite được thu gọn về `user_version = 1` vì bố cục cơ sở dữ liệu
  này chưa từng được phát hành. Các opener runtime chỉ tạo schema hiện tại;
  nhập từ tệp sang cơ sở dữ liệu vẫn nằm trong mã doctor, và các helper nâng cấp
  cơ sở dữ liệu cục bộ theo nhánh đã bị xóa.
- Quyền sở hữu quan hệ được thực thi ở nơi ranh giới sở hữu là chuẩn:
  hàng migration nguồn cascade từ `migration_runs`, trạng thái phân phối tác vụ
  cascade từ `task_runs`, và hàng định danh bản ghi cascade từ
  sự kiện bản ghi.
- Các bảng dùng chung hiện tại bao gồm `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs`, và `backup_runs`.
- Trạng thái tùy ý do Plugin sở hữu không có bảng có kiểu do host sở hữu. Các
  Plugin đã cài đặt dùng `plugin_state_entries` cho payload JSON có phiên bản và
  `plugin_blob_entries` cho byte, với quyền sở hữu namespace/key, dọn dẹp TTL,
  sao lưu và bản ghi migration Plugin. Trạng thái điều phối Plugin do host sở hữu
  vẫn có thể có bảng có kiểu khi host sở hữu hợp đồng truy vấn, chẳng hạn như
  `plugin_binding_approvals`.
- Migration Plugin là migration dữ liệu trên các namespace do Plugin sở hữu,
  không phải migration schema host. Một Plugin có thể migrate các mục trạng thái/blob
  có phiên bản của chính nó thông qua một provider migration, và host ghi lại
  trạng thái nguồn/lần chạy trong sổ cái migration thông thường. Cài đặt Plugin
  mới không yêu cầu thay đổi `openclaw-state-schema.sql` trừ khi chính host đang
  nhận quyền sở hữu một hợp đồng xuyên Plugin mới.
- `src/state/openclaw-agent-db.ts` mở
  `agents/<agentId>/agent/openclaw-agent.sqlite`, đăng ký cơ sở dữ liệu trong DB
  toàn cục, và sở hữu các bảng cục bộ của agent cho phiên, bản ghi, VFS, artifact,
  cache và chỉ mục bộ nhớ. Discovery runtime dùng chung hiện đọc registry
  `agent_databases` có kiểu được tạo thay vì triển khai lại truy vấn đó ở từng
  điểm gọi.
- Cơ sở dữ liệu toàn cục và theo từng agent ghi một hàng `schema_meta` với vai trò
  cơ sở dữ liệu, phiên bản schema, dấu thời gian và id agent cho cơ sở dữ liệu
  agent. Bố cục vẫn ở `user_version = 1` vì schema SQLite này chưa từng được
  phát hành.
- Định danh phiên theo từng agent hiện có bảng gốc `sessions` chuẩn được khóa bằng
  `session_id`, với `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, dấu thời gian, trường hiển thị, metadata mô hình,
  id harness và liên kết cha/spawn dưới dạng các cột có thể truy vấn. `session_routes`
  là chỉ mục tuyến hoạt động duy nhất từ `session_key` đến `session_id` hiện tại,
  nên một khóa tuyến có thể chuyển sang phiên bền mới mà không khiến các lượt đọc
  nóng phải chọn giữa các hàng `sessions.session_key` trùng lặp. Payload dạng
  tương thích cũ `session_entries.entry_json` được treo dưới gốc `session_id`
  bền bằng khóa ngoại; nó không còn là biểu diễn duy nhất ở cấp schema của một
  phiên.
- Định danh cuộc trò chuyện bên ngoài theo từng agent cũng là quan hệ:
  `conversations` lưu định danh provider/account/conversation đã chuẩn hóa, và
  `session_conversations` liên kết một phiên OpenClaw với một hoặc nhiều cuộc
  trò chuyện bên ngoài. Điều này bao phủ các phiên DM shared-main nơi nhiều peer
  có thể cố ý ánh xạ vào một phiên mà không nói sai trong `session_key`. SQLite
  cũng thực thi tính duy nhất cho định danh provider tự nhiên để cùng một bộ
  channel/account/kind/peer/thread không thể phân nhánh qua các id cuộc trò chuyện.
  Các peer trực tiếp shared-main được liên kết với vai trò `participant`, nên một
  phiên OpenClaw có thể đại diện cho nhiều peer DM bên ngoài mà không hạ các peer
  cũ xuống thành các hàng liên quan mơ hồ. `sessions.primary_conversation_id` vẫn
  trỏ tới mục tiêu phân phối có kiểu hiện tại. Các cột định tuyến/trạng thái đóng
  được thực thi bằng ràng buộc SQLite `CHECK` thay vì chỉ dựa vào union TypeScript.
  Phép chiếu phiên runtime xóa các bóng định tuyến tương thích khỏi
  `session_entries.entry_json` trước khi áp dụng các cột phiên/cuộc trò chuyện có
  kiểu, nên payload JSON cũ không thể khôi phục mục tiêu phân phối.
  Định tuyến thông báo subagent tương tự cũng yêu cầu ngữ cảnh phân phối SQLite có
  kiểu; nó không còn fallback về các trường tuyến `SessionEntry` tương thích.
  Kế thừa phân phối rõ ràng của Gateway `chat.send` đọc ngữ cảnh phân phối SQLite
  có kiểu thay vì các trường tương thích `origin`/`last*`.
  `tools.effective` tương tự suy ra ngữ cảnh provider/account/thread từ các hàng
  phân phối/định tuyến SQLite có kiểu, không phải các bóng session-entry `last*`
  cũ.
  Ngữ cảnh prompt sự kiện hệ thống dựng lại các trường channel/to/account/thread
  từ các trường phân phối có kiểu thay vì bóng `origin`.
  Helper dùng chung `deliveryContextFromSession` và bộ ánh xạ session-to-conversation
  hiện bỏ qua hoàn toàn `SessionEntry.origin`; chỉ các trường phân phối có kiểu và
  hàng cuộc trò chuyện quan hệ mới có thể tạo định danh tuyến nóng.
  Chuẩn hóa mục nhập phiên runtime loại bỏ `origin` trước khi lưu bền hoặc chiếu
  `entry_json`, và ghi metadata inbound vào các trường channel/chat có kiểu cùng
  các hàng cuộc trò chuyện quan hệ thay vì tạo bóng origin mới.
- Sự kiện bản ghi, snapshot bản ghi và sự kiện runtime trajectory hiện tham chiếu
  gốc `sessions` chuẩn theo từng agent và cascade khi xóa phiên. Các hàng định
  danh/idempotency bản ghi tiếp tục cascade từ đúng hàng sự kiện bản ghi.
- Các chỉ mục memory-core hiện dùng các bảng agent-database rõ ràng
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks`, và
  `memory_embedding_cache`, với `memory_index_state` theo dõi thay đổi revision.
  Các chỉ mục phụ FTS/vector tùy chọn được đặt tên là `memory_index_chunks_fts` và
  `memory_index_chunks_vec` thay vì các bảng chung `meta`, `files`, `chunks`,
  `chunks_fts`, hoặc `chunks_vec`. Các tên chuẩn giữ lại hình dạng hàng path/source
  hiện tại và tính tương thích embedding đã tuần tự hóa. Các bảng này là cache
  dẫn xuất/tìm kiếm, không phải lưu trữ bản ghi chuẩn; chúng có thể bị xóa và xây
  dựng lại từ các tệp workspace bộ nhớ và nguồn đã cấu hình.
  Mở một chỉ mục bộ nhớ tên chung đã phát hành sẽ migrate metadata, nguồn, chunk
  và cache embedding của nó vào các bảng chuẩn; các bảng FTS/vector dẫn xuất được
  xây dựng lại dưới tên chuẩn của chúng.
- Trạng thái khôi phục lần chạy subagent hiện nằm trong các hàng dùng chung có kiểu
  `subagent_runs` với các khóa phiên child, requester và controller đã lập chỉ mục.
  Tệp cũ `subagents/runs.json` chỉ là đầu vào migration doctor.
- Các binding cuộc trò chuyện hiện tại hiện nằm trong các hàng dùng chung có kiểu
  `current_conversation_bindings` được khóa bằng id cuộc trò chuyện đã chuẩn hóa,
  với các cột agent/session đích, loại cuộc trò chuyện, trạng thái, thời hạn và
  metadata được lưu dưới dạng cột quan hệ thay vì một bản ghi binding đục bị trùng
  lặp. Khóa binding bền bao gồm loại cuộc trò chuyện đã chuẩn hóa để refs
  direct/group/channel không thể va chạm, và SQLite từ chối các giá trị loại/trạng
  thái binding không hợp lệ. Tệp cũ
  `bindings/current-conversations.json` chỉ là đầu vào migration doctor.
- Khôi phục hàng đợi phân phối hiện phủ các cột hàng đợi có kiểu cho channel,
  target, account, session, retry, error, platform-send và trạng thái khôi phục
  lên JSON replay. `entry_json` giữ các payload replay, hook và payload định dạng,
  nhưng các cột có kiểu là nguồn có thẩm quyền cho định tuyến/trạng thái hàng đợi
  nóng.
- Con trỏ khôi phục phiên gần nhất của TUI hiện nằm trong các hàng dùng chung có
  kiểu `tui_last_sessions` được khóa bằng phạm vi kết nối/phiên TUI đã băm.
  Tệp JSON TUI cũ chỉ là đầu vào migration doctor.
- Tùy chọn TTS mặc định hiện nằm trong các hàng SQLite plugin-state dùng chung được
  khóa dưới Plugin `speech-core`. Tệp cũ `settings/tts.json` chỉ là đầu vào
  migration doctor; runtime không còn đọc hoặc ghi tệp JSON tùy chọn TTS, và bộ
  phân giải đường dẫn cũ nằm trong mô-đun migration doctor.
- Metadata mục tiêu bí mật hiện nói về store thay vì giả vờ mọi mục tiêu credential
  đều là một tệp cấu hình. `openclaw.json` vẫn là store cấu hình; các mục tiêu
  auth-profile dùng hàng SQLite có kiểu `auth_profile_stores` với thông tin xác
  thực theo dạng provider được giữ dưới dạng payload JSON.
- Audit bí mật không còn quét các tệp `auth.json` theo từng agent đã nghỉ hưu.
  Doctor sở hữu việc cảnh báo, nhập và xóa tệp cũ đó.
- Các helper đường dẫn hồ sơ auth cũ hiện nằm trong mã legacy của doctor. Các helper
  đường dẫn hồ sơ auth core phơi bày định danh và vị trí hiển thị của auth-store
  SQLite, không phải các đường dẫn runtime `auth-profiles.json` hoặc
  `auth-state.json`.
- Các mô-đun runtime khôi phục lần chạy subagent và cache năng lực mô hình OpenRouter
  hiện giữ riêng reader/writer snapshot SQLite khỏi các helper nhập JSON legacy chỉ
  dành cho doctor. Năng lực OpenRouter dùng các hàng chung có kiểu
  `model_capability_cache` dưới `provider_id = "openrouter"` thay vì một blob cache
  đục hoặc bảng host dành riêng cho provider. `taskName` của lần chạy subagent được
  lưu trong cột có kiểu `subagent_runs.task_name`; bản sao `payload_json` là dữ liệu
  replay/debug, không phải nguồn cho các trường hiển thị hoặc tra cứu nóng.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` triển khai SQLite VFS trên
  bảng `vfs_entries` của cơ sở dữ liệu agent. Đọc thư mục, xuất đệ quy, xóa và đổi
  tên dùng các dải tiền tố `(namespace, path)` đã lập chỉ mục thay vì quét toàn bộ
  namespace hoặc dựa vào khớp đường dẫn `LIKE`.
- `src/agents/runtime-worker.entry.ts` tạo SQLite VFS, artifact công cụ, artifact
  lần chạy và kho cache có phạm vi theo từng lần chạy cho worker.
- Marker hoàn tất bootstrap workspace hiện nằm trong các hàng dùng chung có kiểu
  `workspace_setup_state` được khóa bằng đường dẫn workspace đã resolve thay vì
  `.openclaw/workspace-state.json`; runtime không còn đọc hoặc ghi lại marker
  workspace cũ, và các API helper không còn truyền quanh một đường dẫn giả
  `.openclaw/setup-state` chỉ để suy ra định danh lưu trữ.
- Phê duyệt exec hiện nằm trong hàng singleton SQLite dùng chung có kiểu
  `exec_approvals_config`. Doctor nhập `~/.openclaw/exec-approvals.json` cũ;
  các lượt ghi runtime không còn tạo, ghi lại hoặc báo cáo tệp đó là vị trí store
  hoạt động của nó. Companion macOS đọc và ghi cùng hàng bảng
  `state/openclaw.sqlite`; nó chỉ giữ Unix prompt socket trên đĩa vì đó là IPC,
  không phải trạng thái runtime bền.
- Các mô-đun runtime định danh thiết bị, auth thiết bị và bootstrap hiện giữ riêng
  reader/writer snapshot SQLite khỏi các helper nhập JSON legacy chỉ dành cho
  doctor. Định danh thiết bị dùng các hàng có kiểu `device_identities` và token
  auth thiết bị dùng các hàng có kiểu `device_auth_tokens`. Các lượt ghi auth thiết
  bị hòa giải hàng theo device/role thay vì cắt ngắn bảng token, và runtime không
  còn định tuyến cập nhật một token qua adapter whole-store cũ. Legacy
  các payload JSON phiên bản 1 chỉ tồn tại dưới dạng các dạng import/export của doctor.
- Bộ nhớ đệm trao đổi token GitHub Copilot dùng bảng trạng thái Plugin SQLite dùng chung
  tại `github-copilot/token-cache/default`. Đây là trạng thái bộ nhớ đệm do nhà cung cấp sở hữu,
  nên chủ ý không thêm bảng schema host.
- Compaction GitHub Copilot không còn ghi các sidecar workspace `openclaw-compaction-*.json`
  nữa. Harness gọi RPC Compaction lịch sử SDK cho phiên SDK
  được theo dõi, và OpenClaw giữ trạng thái phiên/bản ghi lâu bền trong
  SQLite thay vì các tệp đánh dấu tương thích.
- Runtime Swift dùng chung (`OpenClawKit`) sử dụng cùng các hàng
  `state/openclaw.sqlite` cho danh tính thiết bị và xác thực thiết bị. Các helper ứng dụng macOS
  import các helper SQLite dùng chung thay vì sở hữu một đường dẫn JSON hoặc
  SQLite thứ hai. Một `identity/device.json` legacy còn sót lại sẽ chặn việc tạo danh tính
  cho đến khi doctor import nó vào SQLite, khớp với cổng khởi động
  TypeScript và Android.
- Danh tính thiết bị Android dùng cùng vật liệu khóa tương thích TypeScript
  được lưu trong các hàng `state/openclaw.sqlite#table/device_identities` có kiểu. Nó không bao giờ
  đọc hoặc ghi `openclaw/identity/device.json`; một tệp legacy còn sót lại sẽ chặn
  khởi động cho đến khi doctor import nó vào SQLite.
- Token xác thực thiết bị được lưu đệm trên Android cũng dùng các hàng
  `state/openclaw.sqlite#table/device_auth_tokens` có kiểu và chia sẻ cùng
  ngữ nghĩa token phiên bản 1 như TypeScript và Swift. Runtime không còn đọc các khóa tương thích
  `SecurePrefs` `gateway.deviceToken*`; các khóa đó chỉ thuộc về logic migration/doctor.
- Lịch sử gói gần đây của thông báo Android dùng các hàng
  `android_notification_recent_packages` có kiểu. Runtime không còn di chuyển hoặc
  đọc các khóa CSV SharedPreferences cũ.
- Việc tạo danh tính thiết bị thất bại an toàn theo hướng đóng khi `identity/device.json` legacy
  tồn tại, khi hàng danh tính SQLite không hợp lệ, hoặc khi không thể mở kho lưu trữ danh tính
  SQLite. Doctor import và xóa tệp đó trước, nên quá trình khởi động runtime
  không thể âm thầm xoay vòng danh tính ghép nối trước khi migration.
- Việc chọn danh tính thiết bị là một khóa hàng SQLite, không phải bộ định vị tệp JSON. Các bài kiểm thử
  và helper Gateway truyền khóa danh tính tường minh; chỉ migration của doctor và
  cổng khởi động thất bại an toàn theo hướng đóng biết tên tệp `identity/device.json` đã nghỉ hưu.
- Tương thích đặt lại phiên hiện nằm trong migration cấu hình doctor:
  `session.idleMinutes` được chuyển vào `session.reset.idleMinutes`,
  `session.resetByType.dm` được chuyển vào `session.resetByType.direct`, và
  chính sách đặt lại runtime chỉ đọc các khóa đặt lại canonical.
- Tương thích cấu hình legacy hiện nằm dưới `src/commands/doctor/`. Quá trình xác thực
  `readConfigFileSnapshot()` bình thường không import các bộ phát hiện legacy của doctor
  hoặc chú thích các vấn đề legacy; `runDoctorConfigPreflight()` thêm các vấn đề đó cho
  sửa chữa/báo cáo của doctor. Luồng cấu hình doctor import
  `src/commands/doctor/legacy-config.ts`, và sửa chữa profile-id OAuth cũ nằm
  dưới
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Các lệnh không phải doctor không tự động chạy sửa chữa cấu hình legacy. Ví dụ,
  `openclaw update --channel` hiện thất bại khi gặp cấu hình legacy không hợp lệ và yêu cầu
  người dùng chạy doctor, thay vì âm thầm import mã migration của doctor.
- Web push, APNs, Voice Wake, kiểm tra cập nhật và sức khỏe cấu hình hiện dùng các bảng SQLite dùng chung
  có kiểu cho đăng ký, khóa VAPID, đăng ký node, hàng trigger,
  hàng định tuyến, trạng thái thông báo cập nhật và mục sức khỏe cấu hình thay vì
  toàn bộ blob JSON mờ. Các lần ghi snapshot Web push và APNs hiện đối chiếu
  đăng ký/đăng ký node theo khóa chính thay vì xóa sạch bảng của chúng;
  sức khỏe cấu hình cũng làm như vậy theo đường dẫn cấu hình.
  Các module runtime của chúng giữ reader/writer snapshot SQLite tách biệt với
  helper import JSON legacy chỉ dành cho doctor.
- Cấu hình node-host hiện dùng một hàng singleton có kiểu trong cơ sở dữ liệu SQLite dùng chung;
  doctor import tệp `node.json` cũ trước khi runtime sử dụng bình thường.
- Ghép nối thiết bị/node, ghép nối kênh, danh sách cho phép kênh và trạng thái bootstrap
  hiện dùng các hàng SQLite có kiểu thay vì toàn bộ blob JSON mờ. Phê duyệt liên kết Plugin
  và trạng thái tác vụ Cron theo cùng cách tách này: các module runtime expose
  thao tác dựa trên SQLite và helper snapshot trung lập, còn ghi snapshot phê duyệt liên kết Plugin
  cùng ghép nối/bootstrap đối chiếu các hàng theo khóa chính
  thay vì cắt ngắn bảng, trong khi doctor import/xóa các tệp JSON cũ thông qua
  các module `src/commands/doctor/legacy/*`.
- Bản ghi Plugin đã cài đặt hiện nằm trong chỉ mục Plugin đã cài đặt của SQLite.
  Đọc/ghi cấu hình runtime không còn di chuyển hoặc giữ lại dữ liệu cấu hình tác giả cũ
  `plugins.installs`; doctor import dạng cấu hình legacy đó
  vào SQLite trước khi runtime sử dụng bình thường.
- Snapshot khôi phục thông tin xác thực QQBot hiện nằm trong trạng thái Plugin SQLite dưới
  `qqbot/credential-backups`. Runtime không còn ghi
  `qqbot/data/credential-backup*.json`; doctor import và xóa các
  tệp sao lưu legacy đó cùng các input trạng thái QQBot khác.
- Lập kế hoạch tải lại Gateway so sánh các snapshot chỉ mục Plugin đã cài đặt của SQLite dưới
  namespace diff nội bộ `installedPluginIndex.installRecords.*`. Các quyết định
  tải lại runtime không còn bọc các hàng đó trong đối tượng cấu hình `plugins.installs` giả.
- Nâng cấp thông tin xác thực tài khoản được đặt tên Matrix không còn diễn ra trong lúc runtime
  đọc. Doctor sở hữu việc đổi tên `credentials/matrix/credentials.json`
  cấp cao nhất cũ khi có thể phân giải một tài khoản Matrix đơn/mặc định.
- Các module runtime ghép nối lõi và Cron không còn export các builder đường dẫn JSON legacy.
  Các module legacy do doctor sở hữu xây dựng đường dẫn nguồn `pending.json`, `paired.json`,
  `bootstrap.json` và `cron/jobs.json` chỉ cho bài kiểm thử import và
  migration. Chuẩn hóa hình dạng tác vụ Cron legacy và import nhật ký chạy Cron
  nằm dưới `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` import các tệp trạng thái JSON legacy,
  bao gồm cấu hình node host, vào SQLite từ doctor. Các importer tệp legacy mới
  nằm dưới `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` import trực tiếp `sessions.json` legacy và
  bản ghi `*.jsonl` vào SQLite và xóa các nguồn đã thành công. Nó
  không còn staging các bản ghi legacy gốc qua
  `agents/<agentId>/sessions/*.jsonl` hoặc tạo đích JSONL canonical trước khi
  import.
- Các kiểm tra doctor về toàn vẹn trạng thái không còn quét thư mục phiên legacy hoặc
  đề xuất xóa JSONL mồ côi. Các tệp bản ghi legacy chỉ là input migration,
  và bước migration sở hữu việc import cùng xóa nguồn.
- Import registry sandbox legacy nằm dưới
  `src/commands/doctor/legacy/sandbox-registry.ts`; việc đọc và ghi registry sandbox
  đang hoạt động vẫn chỉ dùng SQLite.
- Sửa chữa sức khỏe/import bản ghi phiên legacy nằm dưới
  `src/commands/doctor/legacy/session-transcript-health.ts`; các module lệnh runtime
  không còn mang mã phân tích bản ghi JSONL hoặc sửa chữa nhánh hoạt động.

Các điểm nổi bật về hợp nhất/xóa đã hoàn tất:

- Trạng thái Plugin hiện dùng cơ sở dữ liệu dùng chung `state/openclaw.sqlite`. Trình nhập sidecar `plugin-state/state.sqlite` cũ theo nhánh cục bộ đã bị loại bỏ vì bố cục SQLite đó chưa từng được phát hành. Các helper probe/test báo cáo `databasePath` dùng chung thay vì để lộ một đường dẫn SQLite riêng cho plugin-state.
- Các bảng runtime của tác vụ và luồng tác vụ hiện nằm trong cơ sở dữ liệu dùng chung `state/openclaw.sqlite` thay vì `tasks/runs.sqlite` và `tasks/flows/registry.sqlite`; các trình nhập sidecar cũ bị loại bỏ vì cùng lý do bố cục chưa phát hành.
- `src/config/sessions/store.ts` không còn cần `storePath` cho metadata inbound, cập nhật tuyến, hoặc đọc updated-at. Lưu lệnh, dọn dẹp phiên CLI, độ sâu subagent, ghi đè auth, và danh tính phiên transcript dùng các API hàng agent/session. Các lần ghi được áp dụng dưới dạng patch hàng SQLite với retry xung đột lạc quan.
- Phân giải đích phiên hiện để lộ các đích cơ sở dữ liệu theo từng agent, không phải các đường dẫn `sessions.json` legacy. Gateway dùng chung, metadata ACP, sửa tuyến doctor, và `openclaw sessions` liệt kê `agent_databases` cùng các agent đã cấu hình.
- Định tuyến phiên Gateway hiện dùng `resolveGatewaySessionDatabaseTarget`; đích trả về mang `databasePath` và các khóa hàng SQLite ứng viên thay vì đường dẫn tệp session-store legacy.
- Các kiểu runtime phiên kênh hiện để lộ `{agentId, sessionKey}` cho đọc updated-at, metadata inbound, và cập nhật last-route. Kiểu tương thích `saveSessionStore(storePath, store)` cũ đã bị loại bỏ.
- Runtime Plugin, API extension, và các bề mặt barrel `config/sessions` hiện hướng mã Plugin tới các helper hàng phiên dựa trên SQLite. Các export tương thích thư viện gốc (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) vẫn còn dưới dạng shim đã ngừng khuyến nghị cho người dùng hiện có. Helper `resolveLegacySessionStorePath` cũ đã bị loại bỏ; việc dựng đường dẫn `sessions.json` legacy giờ chỉ nằm cục bộ trong migration và fixture test.
- `src/config/sessions/session-entries.sqlite.ts` hiện lưu các mục phiên canonical trong cơ sở dữ liệu theo từng agent và có hỗ trợ patch đọc/upsert/xóa ở cấp hàng. Upsert/patch/xóa runtime không còn quét các biến thể chữ hoa/thường hoặc cắt tỉa khóa alias legacy; doctor sở hữu việc canonical hóa. Helper nhập JSON độc lập đã bị loại bỏ, và migration gộp các hàng mới hơn bằng upsert thay vì thay thế toàn bộ bảng phiên. Các helper đọc/liệt kê/tải công khai chiếu metadata phiên nóng từ các hàng `sessions` và `conversations` có kiểu; `entry_json` là bóng tương thích/gỡ lỗi và có thể lỗi thời hoặc không hợp lệ mà không làm mất danh tính phiên có kiểu hoặc ngữ cảnh phân phối.
- `src/config/sessions/delivery-info.ts` hiện phân giải ngữ cảnh phân phối từ các hàng `sessions` + `conversations` + `session_conversations` có kiểu theo từng agent. Nó không còn dựng lại danh tính phân phối runtime từ `session_entries.entry_json`; thiếu hàng hội thoại có kiểu là vấn đề migration/sửa chữa của doctor, không phải fallback runtime.
- Các quyết định reset phiên đã lưu hiện ưu tiên metadata có kiểu `sessions.session_scope`, `sessions.chat_type`, và `sessions.channel`. Phân tích `sessionKey` chỉ còn dành cho hậu tố thread/topic rõ ràng trên đích lệnh; phân loại reset nhóm so với trực tiếp không còn đến từ hình dạng khóa.
- Phân loại hiển thị danh sách/trạng thái phiên hiện dùng metadata chat có kiểu và loại phiên Gateway. Nó không còn coi các chuỗi con `:group:` hoặc `:channel:` bên trong `session_key` là sự thật bền vững về nhóm/trực tiếp.
- Chọn chính sách trả lời im lặng hiện chỉ dùng kiểu hội thoại rõ ràng hoặc metadata bề mặt. Nó không còn đoán chính sách trực tiếp/nhóm từ các chuỗi con `session_key`.
- Phân giải mô hình hiển thị phiên hiện nhận id agent từ đích cơ sở dữ liệu phiên SQLite thay vì tách nó ra từ `session_key`.
- Hydrate đích thông báo agent-to-agent hiện chỉ dùng `deliveryContext` của `sessions.list` có kiểu. Nó không còn khôi phục định tuyến kênh/tài khoản/thread từ `origin` legacy, các trường `last*` được nhân bản, hoặc hình dạng `session_key`.
- Từ chối đích thread của `sessions_send` hiện đọc metadata định tuyến SQLite có kiểu. Nó không còn từ chối hoặc chấp nhận đích bằng cách phân tích hậu tố thread từ khóa đích.
- Xác thực chính sách công cụ theo phạm vi nhóm hiện đọc định tuyến hội thoại SQLite có kiểu cho phiên hiện tại hoặc phiên được sinh. Nó không còn tin danh tính nhóm/kênh bằng cách giải mã `sessionKey`; các id nhóm do caller cung cấp bị bỏ khi không có hàng phiên có kiểu xác nhận chúng.
- Khớp ghi đè mô hình kênh hiện dùng metadata hội thoại nhóm và cha rõ ràng. Nó không còn giải mã id hội thoại cha từ `parentSessionKey`.
- Kế thừa ghi đè mô hình đã lưu hiện yêu cầu một khóa phiên cha rõ ràng từ ngữ cảnh phiên có kiểu. Nó không còn suy ra ghi đè cha từ hậu tố `:thread:` hoặc `:topic:` trong `sessionKey`.
- Wrapper thread-info phiên cũ và parser thread loaded-plugin đã bị loại bỏ; không có mã runtime nào import `config/sessions/thread-info`.
- Helper hội thoại kênh không còn để lộ các cầu nối phân tích full-session-key. Core vẫn chuẩn hóa id hội thoại thô do provider sở hữu thông qua `resolveSessionConversation(...)`, nhưng không dựng lại dữ kiện tuyến từ `sessionKey`.
- Phân phối hoàn tất, chính sách gửi, và bảo trì tác vụ không còn suy ra kiểu chat từ hình dạng `session_key`. Parser khóa chat-type cũ đã bị xóa; các đường dẫn này yêu cầu metadata phiên có kiểu, ngữ cảnh phân phối có kiểu, hoặc bộ từ vựng đích phân phối rõ ràng.
- Danh sách/trạng thái phiên, chẩn đoán, liên kết tài khoản phê duyệt, lọc Heartbeat TUI, và tóm tắt sử dụng không còn khai thác `SessionEntry.origin` để lấy định tuyến provider/tài khoản/thread/hiển thị. Các lần đọc `origin` runtime còn lại duy nhất là các khái niệm không phải phiên hoặc đối tượng phân phối lượt hiện tại.
- Tra cứu hội thoại native của yêu cầu phê duyệt hiện đọc các hàng định tuyến phiên có kiểu theo từng agent. Nó không còn phân tích danh tính hội thoại kênh/nhóm/thread từ `sessionKey`; thiếu metadata có kiểu là vấn đề migration/sửa chữa.
- Payload sự kiện Gateway session changed/chat/session không còn echo `SessionEntry.origin` hoặc các bóng tuyến `last*`; client nhận `channel`, `chatType`, và `deliveryContext` có kiểu.
- Phân giải phân phối Heartbeat giờ có thể nhận trực tiếp `deliveryContext` SQLite có kiểu, và runtime heartbeat truyền hàng phân phối phiên theo từng agent thay vì dựa vào các bóng `session_entries` tương thích cho định tuyến hiện tại.
- Phân giải đích phân phối agent cô lập Cron cũng hydrate tuyến hiện tại của nó từ hàng phân phối phiên có kiểu theo từng agent trước khi fallback về payload mục tương thích.
- Phân giải origin thông báo subagent giờ truyền xuyên suốt ngữ cảnh phân phối phiên requester có kiểu qua `loadRequesterSessionEntry` và ưu tiên hàng đó hơn các bóng tương thích `last*`/`deliveryContext`.
- Cập nhật metadata phiên inbound giờ gộp trước tiên với hàng phân phối có kiểu theo từng agent; các trường phân phối `SessionEntry` cũ chỉ là fallback khi không tồn tại hàng hội thoại có kiểu.
- Trích xuất phân phối restart/update giờ để `threadId` phân phối SQLite có kiểu thắng các mảnh topic/thread được phân tích từ `sessionKey`; phân tích chỉ là fallback cho các khóa legacy có hình dạng thread.
- Id kênh ngữ cảnh hook agent giờ ưu tiên danh tính hội thoại SQLite có kiểu, rồi đến metadata thông điệp rõ ràng. Chúng không còn phân tích các mảnh provider/nhóm/kênh từ `sessionKey`.
- Kế thừa external-route của Gateway `chat.send` hiện đọc metadata định tuyến phiên SQLite có kiểu thay vì suy luận phạm vi kênh/trực tiếp/nhóm từ các phần của `sessionKey`. Các phiên theo phạm vi kênh chỉ kế thừa khi kênh phiên có kiểu và kiểu chat khớp với ngữ cảnh phân phối đã lưu; các phiên shared-main giữ quy tắc CLI/không-metadata-client nghiêm ngặt hơn.
- Đánh thức restart-sentinel và định tuyến tiếp tục hiện đọc các hàng phân phối/định tuyến SQLite có kiểu trước khi xếp hàng đánh thức heartbeat hoặc các tiếp tục agent-turn đã định tuyến. Nó không còn dựng lại ngữ cảnh phân phối từ bóng JSON session-entry.
- Phân giải ngữ cảnh Gateway `tools.effective` hiện đọc các hàng phân phối/định tuyến SQLite có kiểu cho đầu vào provider, tài khoản, đích, thread, và reply-mode. Nó không còn khôi phục các trường định tuyến nóng đó từ bóng origin `session_entries.entry_json` lỗi thời.
- Định tuyến tham vấn thoại thời gian thực hiện phân giải phân phối cha/cuộc gọi từ các hàng phiên SQLite có kiểu theo từng agent. Nó không còn fallback về các bóng tương thích `SessionEntry.deliveryContext` khi chọn tuyến thông điệp agent nhúng.
- Relay heartbeat sinh bởi ACP và định tuyến parent-stream hiện đọc phân phối cha từ các hàng phiên SQLite có kiểu. Chúng không còn dựng lại ngữ cảnh phân phối cha từ các bóng session-entry tương thích.
- Bảo toàn tuyến phân phối phiên hiện đi theo metadata chat có kiểu và các cột phân phối đã lưu. Nó không còn trích xuất gợi ý kênh, marker trực tiếp/main, hoặc hình dạng thread từ `sessionKey`; các tuyến webchat nội bộ chỉ kế thừa đích bên ngoài khi SQLite đã có danh tính phân phối có kiểu/đã lưu cho phiên.
- Trích xuất phân phối phiên generic hiện chỉ đọc đúng hàng phân phối phiên SQLite có kiểu. Nó không còn phân tích hậu tố thread/topic hoặc fallback từ khóa có hình dạng thread sang khóa phiên cơ sở.
- Dispatch trả lời, khôi phục restart sentinel, và định tuyến tham vấn thoại thời gian thực hiện dùng đúng các hàng phiên/hội thoại SQLite có kiểu cho định tuyến thread. Chúng không còn khôi phục id thread hoặc ngữ cảnh phân phối phiên cơ sở bằng cách phân tích các khóa phiên có hình dạng thread.
- Giới hạn lịch sử PI nhúng hiện dùng projection định tuyến phiên SQLite có kiểu (`sessions` + `conversations` chính) cho provider, kiểu chat, và danh tính peer. Nó không còn phân tích provider, DM, nhóm, hoặc hình dạng thread từ `sessionKey`.
- Suy luận phân phối công cụ Cron hiện chỉ dùng phân phối rõ ràng hoặc ngữ cảnh phân phối có kiểu hiện tại. Nó không còn giải mã các đích kênh, peer, tài khoản, hoặc thread từ `agentSessionKey`.
- Các hàng phiên runtime không còn mang alias tuyến `lastProvider` cũ. Helper và test dùng các trường `lastChannel` và `deliveryContext` có kiểu; migration doctor là nơi duy nhất nên dịch các alias tuyến cũ hơn hoặc bóng `origin` đã lưu.
- Sự kiện transcript, hàng VFS, và hàng artifact công cụ giờ ghi vào cơ sở dữ liệu theo từng agent. Bảng ánh xạ tệp transcript toàn cục chưa phát hành đã bị loại bỏ; doctor ghi lại các đường dẫn nguồn legacy trong các hàng migration bền vững thay vào đó.
- Tra cứu transcript runtime không còn quét offset byte JSONL hoặc probe các tệp transcript legacy. Các đường dẫn chat/media/history Gateway đọc hàng transcript từ SQLite; JSONL phiên giờ chỉ là đầu vào doctor legacy, không phải trạng thái runtime hoặc định dạng export.
- Quan hệ cha và nhánh transcript dùng metadata có cấu trúc `parentTranscriptScope: {agentId, sessionId}` trong header transcript SQLite, không phải chuỗi định vị dạng đường dẫn `agent-db:...transcript_events...`.
- Hợp đồng trình quản lý transcript không còn để lộ các constructor ẩn đã lưu `create(cwd)` hoặc `continueRecent(cwd)`. Trình quản lý transcript đã lưu được mở bằng phạm vi `{agentId, sessionId}` rõ ràng; chỉ trình quản lý trong bộ nhớ còn không cần phạm vi cho test và các phép biến đổi transcript thuần.
- API kho transcript runtime phân giải phạm vi SQLite, không phải đường dẫn hệ thống tệp. Helper `resolve...ForPath` cũ và các tùy chọn ghi `transcriptPath` không dùng nữa đã bị loại khỏi caller runtime.
- Phân giải phiên runtime giờ dùng `{agentId, sessionId}` và không được suy ra chuỗi `sqlite-transcript://<agent>/<session>` cho các ranh giới bên ngoài. Đường dẫn JSONL tuyệt đối legacy chỉ là đầu vào migration doctor.
- Các bản ghi direct-bridge của relay hook native giờ nằm trong các hàng `native_hook_relay_bridges` dùng chung có kiểu, được khóa bằng id relay. Runtime không còn ghi registry JSON `/tmp` hoặc bản ghi generic mờ cho các bản ghi bridge ngắn hạn đó.
- `runEmbeddedPiAgent(...)` không còn có tham số transcript-locator.
  Các mô tả worker đã chuẩn bị cũng bỏ qua các định vị bản ghi. Trạng thái phiên
  thời gian chạy và các lượt chạy follow-up được xếp hàng mang `{agentId, sessionId}` thay vì
  các handle bản ghi được suy ra.
- Compaction nhúng hiện lấy phạm vi SQLite từ `agentId` và `sessionId`.
  Hook Compaction, lời gọi context-engine, ủy quyền CLI, và phản hồi giao thức
  không được nhận các handle `sqlite-transcript://...` được suy ra. Mã
  export/debug có thể hiện thực hóa các hiện vật người dùng rõ ràng từ các hàng, nhưng không cung cấp
  đường dẫn xuất JSONL phiên chung hoặc đưa tên tệp trở lại định danh thời gian chạy.
- `/export-session` đọc các hàng bản ghi từ SQLite và chỉ ghi chế độ xem HTML
  độc lập được yêu cầu. Trình xem nhúng không còn tái dựng hoặc tải xuống
  JSONL phiên từ các hàng đó.
- Ủy quyền context-engine không còn phân tích định vị bản ghi để khôi phục
  định danh tác nhân. Ngữ cảnh thời gian chạy đã chuẩn bị mang `agentId` đã phân giải
  vào bộ điều hợp Compaction tích hợp.
- Việc viết lại bản ghi và cắt ngắn kết quả công cụ trực tiếp hiện đọc và lưu
  trạng thái bản ghi theo `{agentId, sessionId}` và không suy ra các định vị
  tạm thời cho payload sự kiện cập nhật bản ghi.
- Bề mặt helper trạng thái bản ghi không còn các biến thể dựa trên định vị
  `readTranscriptState`, `replaceTranscriptStateEvents`, hoặc
  `persistTranscriptStateMutation`. Các caller thời gian chạy phải dùng API
  `{agentId, sessionId}`. Nhập doctor đọc các tệp legacy bằng đường dẫn tệp
  rõ ràng và ghi các hàng SQLite; nó không di chuyển chuỗi định vị.
- Hợp đồng trình quản lý phiên thời gian chạy không còn phơi bày `open(locator)`,
  `forkFrom(locator)`, hoặc `setTranscriptLocator(...)`. Các trình quản lý phiên
  đã lưu chỉ mở theo `{agentId, sessionId}`; các helper liệt kê/fork nằm trên
  API phiên và checkpoint hướng theo hàng thay vì facade trình quản lý bản ghi.
- API đọc bản ghi của Gateway ưu tiên phạm vi. Chúng nhận
  `{agentId, sessionId}` và không chấp nhận định vị bản ghi theo vị trí có thể
  vô tình trở thành định danh thời gian chạy. Việc phân tích định vị bản ghi
  đang hoạt động đã bị loại bỏ; các đường dẫn nguồn legacy chỉ được đọc bởi mã nhập doctor.
- Sự kiện cập nhật bản ghi cũng ưu tiên phạm vi. `emitSessionTranscriptUpdate`
  không còn chấp nhận chuỗi định vị trần, và listener định tuyến theo
  `{agentId, sessionId}` mà không phân tích handle.
- Phát broadcast thông điệp phiên của Gateway phân giải khóa phiên từ phạm vi
  tác nhân/phiên, không từ định vị bản ghi. Bộ phân giải/cache khóa
  định vị-bản-ghi-sang-phiên cũ đã bị loại bỏ.
- Bộ lọc SSE lịch sử phiên của Gateway lọc cập nhật trực tiếp theo phạm vi tác nhân/phiên. Nó không
  còn chuẩn hóa các ứng viên định vị bản ghi, realpath, hoặc định danh bản ghi
  dạng tệp để quyết định liệu một stream có nên nhận cập nhật hay không.
- Hook vòng đời phiên không còn suy ra hoặc phơi bày định vị bản ghi trên
  `session_end`. Người tiêu thụ hook nhận `sessionId`, `sessionKey`, id
  phiên kế tiếp, và ngữ cảnh tác nhân; tệp bản ghi không nằm trong hợp đồng
  vòng đời.
- Hook reset cũng không còn suy ra hoặc phơi bày định vị bản ghi. Payload
  `before_reset` mang các thông điệp SQLite đã khôi phục cộng với lý do reset,
  trong khi định danh phiên nằm trong ngữ cảnh hook.
- Reset harness tác nhân không còn chấp nhận định vị bản ghi. Dispatch reset
  được giới hạn theo `sessionId`/`sessionKey` cộng với lý do.
- Kiểu phiên tiện ích mở rộng tác nhân không còn phơi bày `transcriptLocator`; tiện ích mở rộng
  nên dùng ngữ cảnh phiên và API thời gian chạy thay vì tìm đến một định danh
  bản ghi dạng tệp.
- Hook Compaction của Plugin không còn phơi bày định vị bản ghi. Ngữ cảnh hook
  đã mang định danh phiên, và việc đọc bản ghi phải đi qua API nhận biết phạm vi
  SQLite thay vì handle dạng tệp.
- Hook `before_agent_finalize` không còn phơi bày `transcriptPath`, bao gồm
  payload relay hook gốc. Hook hoàn tất chỉ dùng ngữ cảnh phiên.
- Phản hồi reset Gateway không còn tổng hợp định vị bản ghi trên entry
  được trả về. Reset tạo các hàng bản ghi SQLite, trả về entry phiên sạch,
  và để quyền truy cập bản ghi cho các reader nhận biết phạm vi.
- Kết quả chạy nhúng và Compaction không còn hiển thị định vị bản ghi cho
  kế toán phiên. Compaction tự động chỉ cập nhật `sessionId` đang hoạt động,
  bộ đếm Compaction, và siêu dữ liệu token.
- Kết quả attempt nhúng không còn trả về `transcriptLocatorUsed`, và kết quả
  `compact()` của context-engine không còn trả về định vị bản ghi.
  Vòng lặp retry thời gian chạy chỉ chấp nhận `sessionId` kế nhiệm.
- Kết quả append bản ghi delivery-mirror không còn trả về định vị bản ghi.
  Caller nhận `messageId` đã append; tín hiệu cập nhật bản ghi dùng phạm vi SQLite.
- Helper fork phiên cha chỉ trả về `sessionId` đã fork. Chuẩn bị subagent
  truyền phạm vi tác nhân/phiên con cho engine.
- Tham số runner CLI và gieo lại lịch sử không còn chấp nhận định vị bản ghi.
  Việc đọc lịch sử CLI phân giải phạm vi bản ghi SQLite từ `{agentId,
sessionId}` và ngữ cảnh khóa phiên.
- Fixture kiểm thử CLI và embedded-runner hiện gieo và đọc các hàng bản ghi SQLite
  theo id phiên thay vì giả vờ các phiên đang hoạt động là tệp `*.jsonl` hoặc
  truyền chuỗi `sqlite-transcript://...` qua tham số thời gian chạy.
- Sự kiện bảo vệ kết quả công cụ phiên phát từ phạm vi phiên đã biết ngay cả khi
  trình quản lý trong bộ nhớ không có định vị được suy ra. Các kiểm thử của nó
  không còn giả lập tệp bản ghi `/tmp/*.jsonl` đang hoạt động.
- Helper BTW và compaction-checkpoint hiện đọc và fork các hàng bản ghi theo
  phạm vi SQLite. Siêu dữ liệu checkpoint hiện chỉ lưu id phiên và id leaf/entry;
  định vị được suy ra không còn được ghi vào payload checkpoint.
- Tra cứu transcript-key của Gateway dùng phạm vi bản ghi SQLite tại ranh giới
  giao thức và không còn realpath hoặc stat tên tệp bản ghi.
- Xoay vòng bản ghi Compaction tự động ghi các hàng bản ghi kế nhiệm trực tiếp
  qua kho bản ghi SQLite. Hàng phiên chỉ giữ định danh phiên kế nhiệm, không phải
  đường dẫn JSONL bền vững hoặc định vị đã lưu.
- Compaction context-engine nhúng dùng các helper xoay vòng bản ghi đặt tên theo SQLite.
  Các kiểm thử xoay vòng không còn dựng đường dẫn JSONL kế nhiệm hoặc mô hình hóa
  phiên đang hoạt động như tệp.
- Lưu giữ hình ảnh gửi đi được quản lý tạo khóa cache thông điệp-bản ghi từ
  thống kê bản ghi SQLite thay vì lời gọi stat hệ thống tệp.
- Khóa phiên thời gian chạy và lane doctor `.jsonl.lock` legacy độc lập
  đã bị loại bỏ.
- Barrel thời gian chạy Microsoft Teams và SDK Plugin công khai không còn tái xuất
  helper khóa tệp cũ; đường dẫn trạng thái Plugin bền vững được hỗ trợ bởi SQLite.
- Việc cắt tỉa phiên theo tuổi/số lượng và dọn dẹp phiên rõ ràng đã bị loại bỏ.
  Doctor sở hữu nhập legacy; các phiên cũ được reset hoặc xóa rõ ràng.
- Kiểm tra toàn vẹn doctor không còn tính tệp JSONL legacy là bản ghi đang hoạt động
  hợp lệ cho hàng phiên SQLite. Sức khỏe bản ghi đang hoạt động chỉ dựa trên SQLite;
  tệp JSONL legacy được báo cáo là đầu vào di chuyển/dọn dẹp orphan.
- Doctor không còn xem `agents/<agent>/sessions/` là trạng thái thời gian chạy
  bắt buộc. Nó chỉ quét thư mục đó khi thư mục đã tồn tại, dưới dạng đầu vào
  nhập legacy hoặc dọn dẹp orphan.
- `sessions.resolve` của Gateway, đường dẫn patch/reset/compact phiên, tạo
  subagent, hủy nhanh, siêu dữ liệu ACP, phiên cô lập Heartbeat, và patch TUI
  không còn di chuyển hoặc cắt tỉa khóa phiên legacy như tác dụng phụ của
  công việc thời gian chạy bình thường.
- Phân giải phiên lệnh CLI hiện trả về `agentId` sở hữu thay vì
  `storePath`, và không còn sao chép các hàng phiên chính legacy trong quá trình
  phân giải `--to` hoặc `--session-id` bình thường. Chuẩn hóa hàng chính legacy
  chỉ thuộc về doctor.
- Phân giải độ sâu subagent thời gian chạy không còn đọc `sessions.json` hoặc kho phiên JSON5.
  Nó đọc `session_entries` SQLite theo id tác nhân, và siêu dữ liệu độ sâu/phiên
  legacy chỉ có thể đi vào qua đường dẫn nhập doctor.
- Ghi đè phiên hồ sơ auth được lưu qua upsert hàng `{agentId, sessionKey}`
  trực tiếp thay vì lazy-load thời gian chạy kho phiên dạng tệp.
- Gating verbose auto-reply và helper cập nhật phiên hiện đọc/upsert hàng phiên
  SQLite theo định danh phiên và không còn yêu cầu đường dẫn kho legacy trước khi
  chạm vào trạng thái hàng đã lưu.
- Helper siêu dữ liệu phiên command-run hiện dùng tên và đường dẫn module
  hướng theo entry; bề mặt helper lệnh `session-store` cũ đã bị loại bỏ.
- Gieo header bootstrap và gia cố ranh giới Compaction thủ công hiện thay đổi
  trực tiếp các hàng bản ghi SQLite. Caller thời gian chạy truyền định danh phiên,
  không phải đường dẫn `.jsonl` có thể ghi.
- Replay xoay vòng phiên im lặng sao chép các lượt user/assistant gần đây theo
  `{agentId, sessionId}` từ các hàng bản ghi SQLite. Nó không còn chấp nhận
  định vị bản ghi nguồn hoặc đích.
- Hàng phiên thời gian chạy mới không còn lưu định vị bản ghi. Caller dùng trực tiếp
  `{agentId, sessionId}`; lệnh export/debug có thể chọn tên tệp đầu ra khi
  hiện thực hóa các hàng.
- Bắt đầu một phiên bản ghi đã lưu mới hiện luôn mở các hàng SQLite theo
  phạm vi. Trình quản lý phiên không còn tái sử dụng đường dẫn hoặc định vị bản ghi
  thời kỳ tệp trước đó làm định danh cho phiên mới.
- Phiên bản ghi đã lưu dùng API rõ ràng
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Các facade tĩnh cũ
  `SessionManager.create/openForSession/list/forkFromSession` đã biến mất để
  kiểm thử và mã thời gian chạy không thể vô tình tái tạo cơ chế khám phá phiên thời kỳ tệp.
- Thời gian chạy Plugin không còn phơi bày `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  mã Plugin dùng helper hàng SQLite và giá trị phạm vi.
- Bề mặt SDK công khai `session-store-runtime` hiện chỉ xuất helper hàng phiên
  và hàng bản ghi. Helper tập trung cho schema/đường dẫn/giao dịch SQLite
  nằm trong `sqlite-runtime`; helper mở/đóng/reset thô vẫn chỉ cục bộ cho
  kiểm thử first-party.
- Bộ phân loại tên tệp quỹ đạo/checkpoint `.jsonl` legacy hiện nằm trong module
  tệp phiên legacy của doctor. Xác thực phiên core không còn nhập helper hiện vật tệp
  để quyết định id phiên SQLite bình thường.
- Các lượt chạy subagent chặn active-memory dùng các hàng bản ghi SQLite thay vì
  tạo tệp `session.jsonl` tạm thời hoặc đã lưu dưới trạng thái Plugin. Tùy chọn
  `transcriptDir` cũ đã bị xóa.
- Sinh slug một lần và lượt chạy planner Crestodian dùng các hàng bản ghi SQLite
  thay vì tạo tệp `session.jsonl` tạm thời.
- Lượt chạy helper `llm-task` và trích xuất cam kết ẩn cũng dùng các hàng bản ghi
  SQLite, nên các phiên helper chỉ dành cho mô hình này không còn tạo
  tệp bản ghi JSON/JSONL tạm thời.
- `TranscriptSessionManager` hiện chỉ là một phạm vi bản ghi SQLite đã mở.
  Mã thời gian chạy mở nó bằng `openTranscriptSessionManagerForSession({agentId,
sessionId})`; các luồng tạo, branch, tiếp tục, liệt kê, và fork nằm trong
  helper hàng SQLite sở hữu chúng thay vì facade manager tĩnh.
  Mã doctor/import/debug xử lý các tệp nguồn legacy rõ ràng bên ngoài
  trình quản lý phiên thời gian chạy.
- Các phương thức facade cũ `SessionManager.newSession()` và
  `SessionManager.createBranchedSession()` đã bị xóa. Phiên mới và hậu duệ
  bản ghi được tạo bởi workflow SQLite sở hữu chúng thay vì biến đổi một manager
  đã mở thành một phiên đã lưu khác.
- Quyết định fork bản ghi cha và tạo fork không còn chấp nhận
  `storePath` hoặc `sessionsDir`; chúng dùng phạm vi bản ghi SQLite
  `{agentId, sessionId}` thay vì siêu dữ liệu đường dẫn hệ thống tệp được giữ lại.
- Memory-host không còn xuất helper phân loại bản ghi thư mục phiên no-op;
  lọc bản ghi hiện được suy ra từ siêu dữ liệu hàng SQLite trong quá trình dựng entry.
- Kiểm thử xuất phiên memory-host và QMD dùng phạm vi bản ghi SQLite. Đường dẫn cũ
  `agents/<agentId>/sessions/*.jsonl` chỉ còn được bao phủ ở nơi kiểm thử cố ý
  chứng minh tương thích doctor/import/export.
- Kiểm tra phiên thô QA-lab hiện dùng `sessions.list` qua Gateway
  thay vì đọc `agents/qa/sessions/sessions.json`; phản hồi MSteams
  ghi nối trực tiếp vào bản ghi SQLite mà không dựng đường dẫn JSONL.
- Các lượt kênh đến dùng chung giờ mang `{agentId, sessionKey}` thay vì
  `storePath` cũ. Các đường dẫn ghi của LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch và QQBot giờ đọc siêu dữ liệu updated-at và ghi
  các hàng phiên đến thông qua định danh SQLite.
- Việc lưu bền bộ định vị bản ghi đã bị loại khỏi các hàng phiên đang hoạt động.
  `resolveSessionTranscriptTarget` trả về `agentId`, `sessionId` và siêu dữ liệu
  chủ đề tùy chọn; doctor là mã duy nhất nhập các tên tệp bản ghi cũ.
- Tiêu đề bản ghi thời gian chạy bắt đầu ở phiên bản SQLite `1`. Các nâng cấp
  dạng JSONL V1/V2/V3 cũ chỉ nằm trong nhập doctor và chuẩn hóa các tiêu đề đã nhập về
  phiên bản bản ghi SQLite hiện tại trước khi lưu hàng.
- Bộ bảo vệ ưu tiên cơ sở dữ liệu giờ cấm `SessionManager.listAll` và
  `SessionManager.forkFromSession`; các quy trình liệt kê phiên và fork/khôi phục
  phải ở trên API SQLite theo hàng/phạm vi.
- Bộ bảo vệ cũng cấm các tên helper phân tích cú pháp bản ghi JSONL cũ/sửa nhánh hoạt động
  bên ngoài mã doctor/import, để thời gian chạy không thể phát sinh đường dẫn di trú
  bản ghi cũ thứ hai.
- Các lượt chạy PI nhúng từ chối các handle bản ghi đến. Chúng dùng định danh SQLite
  `{agentId, sessionId}` trước khi khởi chạy worker và một lần nữa trước khi lần thử
  chạm vào trạng thái bản ghi. Đầu vào `/tmp/*.jsonl` lỗi thời không thể chọn
  đích ghi thời gian chạy.
- Bản ghi cache trace, payload Anthropic, luồng thô và dòng thời gian chẩn đoán
  giờ ghi vào các hàng SQLite `diagnostic_events` có kiểu. Các gói ổn định Gateway
  giờ ghi vào các hàng SQLite `diagnostic_stability_bundles` có kiểu. Các đường dẫn
  ghi đè JSONL cũ `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` và
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` đã bị loại bỏ, và việc thu thập ổn định bình thường
  không còn ghi các tệp `logs/stability/*.json`.
- Lưu bền Cron giờ đối chiếu các hàng SQLite `cron_jobs` thay vì
  xóa/chèn lại toàn bộ bảng job trên mỗi lần lưu. Các writeback đích Plugin
  cập nhật trực tiếp các hàng cron khớp và giữ trạng thái cron thời gian chạy trong
  cùng giao dịch cơ sở dữ liệu trạng thái.
- Các caller thời gian chạy Cron giờ dùng khóa kho cron SQLite ổn định. Các đường dẫn
  `cron.store` cũ chỉ là đầu vào nhập doctor; các đường dẫn production Gateway,
  bảo trì task, trạng thái, run-log và writeback đích Telegram dùng
  `resolveCronStoreKey` và không còn chuẩn hóa đường dẫn cho khóa. Trạng thái Cron giờ
  báo cáo `storeKey` thay vì trường `storePath` có dạng tệp cũ.
- Tải và lập lịch thời gian chạy Cron không còn chuẩn hóa các dạng job đã lưu bền cũ
  như `jobId`, `schedule.cron`, `atMs` dạng số, boolean dạng chuỗi hoặc
  thiếu `sessionTarget`. Nhập legacy của doctor sở hữu các sửa chữa đó trước khi
  hàng được chèn vào SQLite.
- ACP spawn không còn phân giải hoặc lưu bền đường dẫn tệp bản ghi JSONL. Thiết lập spawn
  và thread-bind lưu bền trực tiếp hàng phiên SQLite và giữ id phiên làm
  định danh bản ghi được giữ lại.
- Các API siêu dữ liệu phiên ACP giờ đọc/liệt kê/upsert các hàng SQLite theo `agentId` và
  không còn phơi bày `storePath` như một phần của hợp đồng mục nhập phiên ACP.
- Kế toán mức dùng phiên và tổng hợp mức dùng Gateway giờ chỉ phân giải bản ghi
  bằng `{agentId, sessionId}`. Cache chi phí/mức dùng và các tóm tắt phiên đã phát hiện
  không còn tổng hợp hoặc trả về chuỗi bộ định vị bản ghi.
- Ghi nối chat Gateway, lưu bền abort-partial, `/sessions.send` và
  các lần ghi bản ghi phương tiện webchat ghi nối trực tiếp qua phạm vi bản ghi SQLite.
  Helper chèn bản ghi Gateway không còn nhận tham số
  `transcriptLocator`.
- Khám phá bản ghi SQLite giờ chỉ liệt kê phạm vi và thống kê bản ghi:
  `{agentId, sessionId, updatedAt, eventCount}`. Helper tương thích đã chết
  `listSqliteSessionTranscriptLocators` và trường `locator` theo hàng đã bị xóa.
- Thời gian chạy sửa chữa bản ghi giờ chỉ phơi bày
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Helper sửa chữa
  dựa trên bộ định vị cũ đã bị xóa; mã doctor/debug đọc các đường dẫn tệp nguồn
  rõ ràng và không bao giờ di trú chuỗi bộ định vị.
- Thời gian chạy sổ cái phát lại ACP giờ lưu các hàng phát lại theo phiên trong cơ sở dữ liệu
  trạng thái SQLite dùng chung thay vì `acp/event-ledger.json`; doctor nhập và
  loại bỏ tệp cũ.
- Các helper đọc bản ghi Gateway giờ nằm trong
  `src/gateway/session-transcript-readers.ts` thay vì tên module cũ
  `session-utils.fs`. Kiểm tra lịch sử thử lại fallback được đặt tên theo
  nội dung bản ghi SQLite thay vì bề mặt helper tệp cũ.
- Các helper injected-chat và Compaction của Gateway giờ truyền phạm vi bản ghi SQLite
  qua các API helper nội bộ thay vì đặt tên giá trị là đường dẫn bản ghi hoặc
  tệp nguồn.
- Phát hiện tiếp tục bootstrap giờ kiểm tra các hàng bản ghi SQLite thông qua
  `hasCompletedBootstrapTranscriptTurn`; nó không còn phơi bày tên helper có dạng tệp.
- Các kiểm thử embedded-runner giờ dùng định danh bản ghi SQLite, và việc mở trình quản lý
  bản ghi mới luôn yêu cầu `sessionId` rõ ràng.
- Các helper lập chỉ mục bộ nhớ giờ dùng thuật ngữ bản ghi SQLite từ đầu đến cuối:
  host xuất `listSessionTranscriptScopesForAgent` và
  `sessionTranscriptKeyForScope`, hàng đợi đồng bộ có mục tiêu là `sessionTranscripts`,
  các kết quả session-search công khai phơi bày đường dẫn mờ `transcript:<agent>:<session>`,
  và khóa nguồn DB nội bộ là `session:<session>` dưới
  `source_kind='sessions'` thay vì đường dẫn tệp giả.
- Helper persistent-dedupe chung của SDK Plugin không còn phơi bày các tùy chọn có dạng tệp.
  Caller cung cấp khóa phạm vi SQLite và các hàng dedupe bền vững nằm trong
  trạng thái Plugin dùng chung.
- Token SSO Microsoft Teams đã chuyển từ tệp JSON bị khóa sang trạng thái Plugin SQLite.
  Doctor nhập `msteams-sso-tokens.json`, dựng lại các khóa token SSO chuẩn tắc
  từ payload và loại bỏ tệp nguồn. Token OAuth được ủy quyền vẫn ở trên ranh giới
  tệp thông tin xác thực riêng tư hiện có.
- Trạng thái cache đồng bộ Matrix đã chuyển từ `bot-storage.json` sang trạng thái Plugin
  SQLite. Doctor nhập payload đồng bộ thô hoặc được bọc cũ và loại bỏ
  tệp nguồn. Các client Matrix và QA Matrix đang hoạt động truyền thư mục gốc sync-store
  SQLite, không phải đường dẫn giả `sync-store.json` hoặc `bot-storage.json`.
- Trạng thái di trú crypto legacy của Matrix đã chuyển từ
  `legacy-crypto-migration.json` sang trạng thái Plugin SQLite. Doctor nhập
  tệp trạng thái cũ; các snapshot IndexedDB của Matrix SDK đã chuyển từ
  `crypto-idb-snapshot.json` sang blob Plugin SQLite. Khóa khôi phục và
  thông tin xác thực Matrix là các hàng trạng thái Plugin SQLite; các tệp JSON cũ của chúng
  chỉ là đầu vào di trú doctor.
- Log hoạt động Memory Wiki giờ dùng trạng thái Plugin SQLite thay vì
  `.openclaw-wiki/log.jsonl`. Provider di trú Memory Wiki nhập các log JSONL cũ;
  markdown wiki và nội dung vault của người dùng vẫn được tệp hậu thuẫn như
  nội dung workspace.
- Memory Wiki không còn tạo `.openclaw-wiki/state.json` hoặc thư mục
  `.openclaw-wiki/locks` không dùng. Provider di trú loại bỏ các tệp siêu dữ liệu
  Plugin đã ngừng dùng đó nếu vault cũ hơn vẫn có chúng.
- Các mục audit Crestodian giờ dùng trạng thái Plugin SQLite lõi thay vì
  `audit/crestodian.jsonl`. Doctor nhập log audit JSONL cũ và
  loại bỏ nó sau khi nhập thành công.
- Các mục audit ghi/quan sát config giờ dùng trạng thái Plugin SQLite lõi thay vì
  `logs/config-audit.jsonl`. Doctor nhập log audit JSONL cũ và
  loại bỏ nó sau khi nhập thành công.
- Companion macOS không còn ghi sidecar `logs/config-audit.jsonl` hoặc
  `logs/config-health.json` cục bộ của app khi chỉnh sửa `openclaw.json`. Tệp config
  vẫn được tệp hậu thuẫn, snapshot khôi phục vẫn nằm cạnh tệp config,
  và trạng thái audit/health config bền vững thuộc về kho SQLite của Gateway.
- Các phê duyệt đang chờ cứu hộ Crestodian giờ dùng trạng thái Plugin SQLite lõi thay vì
  `crestodian/rescue-pending/*.json`. Doctor nhập các tệp phê duyệt đang chờ cũ
  và loại bỏ chúng sau khi nhập thành công.
- Trạng thái arm tạm thời của Phone Control giờ dùng trạng thái Plugin SQLite thay vì
  `plugins/phone-control/armed.json`. Doctor nhập tệp trạng thái armed cũ
  vào namespace `phone-control/arm-state` và loại bỏ tệp.
- Doctor không còn sửa bản ghi JSONL tại chỗ hoặc tạo tệp JSONL sao lưu.
  Nó nhập nhánh hoạt động vào SQLite và loại bỏ nguồn cũ.
- Tra cứu bản ghi hook session-memory dùng các lần đọc SQLite chỉ theo phạm vi
  `{agentId, sessionId}`. Helper của nó không còn nhận hoặc suy ra bộ định vị bản ghi,
  lần đọc tệp cũ hoặc tùy chọn ghi lại tệp.
- Các binding hội thoại của app-server Codex giờ khóa trạng thái Plugin SQLite theo
  khóa phiên OpenClaw hoặc phạm vi `{agentId, sessionId}` rõ ràng. Chúng không được
  giữ lại các binding fallback theo đường dẫn bản ghi.
- Các lần đọc lịch sử được phản chiếu của app-server Codex chỉ dùng phạm vi bản ghi SQLite;
  chúng không được khôi phục định danh từ đường dẫn tệp bản ghi.
- Các đường dẫn role-ordering và đặt lại Compaction không còn unlink tệp bản ghi cũ;
  đặt lại chỉ xoay hàng phiên SQLite và định danh bản ghi.
- Các phản hồi đặt lại và checkpoint của Gateway trả về hàng phiên sạch cộng với id phiên.
  Chúng không còn tổng hợp bộ định vị bản ghi SQLite cho client.
- Dreaming của memory-core không còn cắt tỉa hàng phiên bằng cách dò tệp JSONL bị thiếu.
  Dọn dẹp subagent đi qua API thời gian chạy phiên thay vì
  kiểm tra sự tồn tại của hệ thống tệp. Các kiểm thử transcript-ingestion của nó seed trực tiếp
  các hàng SQLite thay vì tạo fixture `agents/<id>/sessions` hoặc placeholder bộ định vị.
- Lập chỉ mục bản ghi bộ nhớ có thể phơi bày `transcript:<agentId>:<sessionId>` như một
  đường dẫn kết quả tìm kiếm ảo cho các helper trích dẫn/đọc. Nguồn chỉ mục bền vững là
  quan hệ (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), vì vậy giá trị này không phải bộ định vị bản ghi thời gian chạy,
  không phải đường dẫn hệ thống tệp, và tuyệt đối không được truyền ngược vào API thời gian chạy phiên.
- Trạng thái bộ nhớ của Gateway doctor đọc số lượng short-term recall và phase-signal
  từ các hàng trạng thái Plugin SQLite thay vì `memory/.dreams/*.json`; đầu ra CLI và
  doctor giờ gắn nhãn lưu trữ đó là kho SQLite, không phải đường dẫn.
- Thời gian chạy memory-core, trạng thái CLI, phương thức Gateway doctor và facade SDK
  Plugin không còn audit hoặc lưu trữ các tệp `.dreams/session-corpus` cũ.
  Các tệp đó chỉ là đầu vào di trú; doctor nhập chúng vào SQLite và
  xóa nguồn sau khi xác minh. Các hàng bằng chứng session-ingestion đang hoạt động
  giờ dùng đường dẫn SQLite ảo `memory/session-ingestion/<day>.txt`; thời gian chạy
  không bao giờ ghi hoặc suy ra trạng thái từ `.dreams/session-corpus`.
- Artifact công khai của memory-core phơi bày sự kiện host SQLite dưới dạng artifact JSON
  ảo `memory/events/memory-host-events.json`; chúng không còn tái sử dụng
  đường dẫn nguồn `.dreams/events.jsonl` cũ.
- Các registry container/browser sandbox giờ dùng bảng SQLite dùng chung
  `sandbox_registry_entries` với các cột phiên, image, timestamp,
  backend/config và cổng browser có kiểu. Doctor nhập các tệp registry JSON nguyên khối
  và phân mảnh cũ, rồi loại bỏ các nguồn thành công. Các lần đọc thời gian chạy dùng
  các cột hàng có kiểu làm nguồn sự thật; `entry_json` chỉ là bản sao phát lại/debug.
- Commitments giờ dùng bảng dùng chung `commitments` có kiểu thay vì blob JSON
  toàn kho. Lưu snapshot upsert theo id commitment và chỉ xóa
  các hàng bị thiếu thay vì xóa sạch rồi chèn lại bảng. Thời gian chạy tải
  commitments từ các cột phạm vi, delivery-window, trạng thái, lần thử và văn bản
  có kiểu; `record_json` chỉ là bản sao phát lại/debug. Doctor nhập
  `commitments.json` cũ và loại bỏ nó sau khi nhập thành công.
- Định nghĩa job Cron, trạng thái lịch và lịch sử chạy không còn có writer hoặc reader
  JSON thời gian chạy. Thời gian chạy dùng các hàng `cron_jobs` với lịch có kiểu,
  các cột payload, phân phối, cảnh báo lỗi, phiên, trạng thái và trạng thái thời gian chạy cùng với siêu dữ liệu
  `cron_run_logs` có kiểu cho trạng thái, tóm tắt chẩn đoán, trạng thái/lỗi phân phối,
  phiên/lần chạy, mô hình và tổng số token. `job_json` chỉ là bản sao phát lại/gỡ lỗi; `state_json` giữ các chẩn đoán
  thời gian chạy lồng nhau chưa có trường truy vấn nóng, trong khi thời gian chạy
  tái tạo các trường trạng thái nóng từ các cột có kiểu. Doctor nhập
  các tệp `jobs.json`, `jobs-state.json` và `runs/*.jsonl` cũ rồi xóa
  các nguồn đã nhập. Các thao tác ghi ngược đích Plugin cập nhật những hàng `cron_jobs`
  khớp thay vì tải và thay thế toàn bộ kho cron.
- Khởi động Gateway bỏ qua các dấu `notify: true` cũ trong phép chiếu
  thời gian chạy. Doctor chuyển chúng thành phân phối SQLite rõ ràng khi
  `cron.webhook` hợp lệ, xóa các dấu không hoạt động khi chưa đặt giá trị này, và giữ lại
  chúng kèm cảnh báo khi webhook đã cấu hình không hợp lệ.
- Các hàng đợi phân phối gửi đi và phiên hiện lưu trạng thái hàng đợi, loại mục,
  khóa phiên, kênh, đích, id tài khoản, số lần thử lại, lần thử/lỗi gần nhất,
  trạng thái khôi phục và dấu gửi nền tảng dưới dạng cột có kiểu trong bảng dùng chung
  `delivery_queue_entries`. Khôi phục thời gian chạy đọc các trường nóng đó từ
  các cột có kiểu, và các đột biến thử lại/khôi phục cập nhật trực tiếp những cột đó
  mà không ghi lại JSON phát lại. Payload JSON đầy đủ chỉ còn là blob
  phát lại/gỡ lỗi cho nội dung tin nhắn và dữ liệu phát lại lạnh khác.
- Các bản ghi hình ảnh gửi đi được quản lý hiện dùng các hàng dùng chung có kiểu
  `managed_outgoing_image_records`, còn byte phương tiện vẫn được lưu trong
  `media_blobs`. Bản ghi JSON chỉ còn là bản sao phát lại/gỡ lỗi.
- Tùy chọn bộ chọn mô hình Discord, hàm băm triển khai lệnh và liên kết luồng
  hiện dùng trạng thái Plugin SQLite dùng chung. Các kế hoạch nhập JSON cũ của chúng nằm trong
  bề mặt thiết lập/di trú doctor của Plugin Discord, không nằm trong mã di trú lõi.
- Các bộ phát hiện nhập cũ của Plugin dùng các mô-đun được đặt tên theo doctor như
  `doctor-legacy-state.ts` hoặc `doctor-state-imports.ts`; các mô-đun thời gian chạy
  kênh thông thường không được nhập bộ phát hiện JSON cũ.
- Con trỏ bắt kịp BlueBubbles và dấu chống trùng lặp đầu vào hiện dùng trạng thái Plugin
  SQLite dùng chung. Các kế hoạch nhập JSON cũ của chúng nằm trong bề mặt
  thiết lập/di trú doctor của Plugin BlueBubbles, không nằm trong mã di trú lõi.
- Offset cập nhật Telegram, hàng cache nhãn dán, hàng cache tin nhắn đã gửi,
  hàng cache tên chủ đề và liên kết luồng hiện dùng trạng thái Plugin SQLite
  dùng chung. Các kế hoạch nhập JSON cũ của chúng nằm trong bề mặt
  thiết lập/di trú doctor của Plugin Telegram, không nằm trong mã di trú lõi.
- Con trỏ bắt kịp iMessage, ánh xạ short-id trả lời và các hàng chống trùng lặp sent-echo
  hiện dùng trạng thái Plugin SQLite dùng chung. Các tệp cũ `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` và `imessage/sent-echoes.jsonl` chỉ là
  đầu vào cho doctor.
- Các hàng chống trùng lặp tin nhắn Feishu hiện dùng trạng thái Plugin SQLite dùng chung thay vì
  các tệp `feishu/dedup/*.json`. Kế hoạch nhập JSON cũ của nó nằm trong bề mặt
  thiết lập/di trú doctor của Plugin Feishu, không nằm trong mã di trú lõi.
- Các cuộc trò chuyện, bình chọn, bộ đệm tải lên đang chờ và dữ liệu học từ phản hồi của
  Microsoft Teams hiện dùng các bảng trạng thái/blob Plugin SQLite dùng chung. Đường dẫn tải lên đang chờ
  dùng `plugin_blob_entries` nên bộ đệm phương tiện được lưu dưới dạng SQLite BLOB
  thay vì JSON base64. Tên helper thời gian chạy hiện dùng cách đặt tên SQLite/trạng thái
  thay vì cách đặt tên kho tệp `*-fs`, và shim `storePath` cũ đã bị xóa
  khỏi các kho này. Kế hoạch nhập JSON cũ của nó nằm trong bề mặt
  thiết lập/di trú doctor của Plugin Microsoft Teams.
- Phương tiện gửi đi được lưu trữ bởi Zalo hiện dùng `plugin_blob_entries` SQLite dùng chung
  thay vì các sidecar tạm JSON/bin `openclaw-zalo-outbound-media`.
- HTML và siêu dữ liệu của trình xem diff hiện dùng `plugin_blob_entries` SQLite dùng chung
  thay vì các tệp tạm `meta.json`/`viewer.html`. Đầu ra PNG/PDF đã render vẫn là
  materialization tạm vì phân phối kênh vẫn cần đường dẫn tệp.
- Tài liệu được quản lý của Canvas hiện dùng `plugin_blob_entries` SQLite dùng chung
  thay vì thư mục mặc định `state/canvas/documents`. Máy chủ Canvas phục vụ trực tiếp
  các blob đó; tệp cục bộ chỉ được tạo cho nội dung toán tử `host.root`
  rõ ràng hoặc materialization tạm khi trình đọc phương tiện downstream
  yêu cầu đường dẫn.
- Quyết định kiểm toán File Transfer hiện dùng `plugin_state_entries` SQLite dùng chung
  thay vì nhật ký thời gian chạy không giới hạn `audit/file-transfer.jsonl`. Doctor
  nhập tệp kiểm toán JSONL cũ vào trạng thái Plugin và xóa nguồn
  sau khi nhập sạch.
- Lease tiến trình ACPX và định danh phiên bản Gateway hiện dùng trạng thái Plugin SQLite dùng chung.
  Doctor nhập tệp `gateway-instance-id` cũ vào trạng thái Plugin
  và xóa nguồn.
- Script wrapper được tạo bởi ACPX và home Codex cô lập là materialization tạm
  dưới gốc tạm OpenClaw, không phải trạng thái OpenClaw bền vững. Các
  bản ghi thời gian chạy ACPX bền vững là các hàng lease SQLite và gateway-instance;
  bề mặt cấu hình `stateDir` ACPX cũ bị xóa vì không còn trạng thái thời gian chạy nào
  được ghi ở đó nữa.
- Tệp đính kèm phương tiện Gateway hiện dùng bảng SQLite dùng chung `media_blobs` làm
  kho byte chuẩn tắc. Đường dẫn cục bộ trả về cho kênh và bề mặt tương thích
  sandbox là materialization tạm của hàng cơ sở dữ liệu, không phải kho phương tiện
  bền vững. Allowlist phương tiện thời gian chạy không còn bao gồm các gốc cũ
  `$OPENCLAW_STATE_DIR/media` hoặc `media` trong thư mục cấu hình; các thư mục đó
  chỉ là nguồn nhập của doctor.
- Hoàn thành shell không còn ghi các tệp cache `$OPENCLAW_STATE_DIR/completions/*`.
  Các đường dẫn smoke cài đặt, doctor, cập nhật và phát hành dùng đầu ra hoàn thành
  được tạo hoặc nạp profile thay vì các tệp cache hoàn thành bền vững.
- Staging tải Skills lên Gateway hiện dùng các hàng `skill_uploads` dùng chung. Siêu dữ liệu tải lên,
  khóa idempotency và byte lưu trữ nằm trong SQLite; trình cài đặt
  chỉ nhận đường dẫn kho lưu trữ đã materialize tạm thời trong khi quá trình cài đặt
  đang chạy.
- Tệp đính kèm nội tuyến của subagent không còn materialize dưới
  `.openclaw/attachments/*` trong workspace. Đường dẫn spawn chuẩn bị các mục seed SQLite VFS,
  các lần chạy nội tuyến seed những mục đó vào namespace scratch thời gian chạy theo từng agent,
  và các công cụ dựa trên đĩa phủ scratch SQLite đó cho đường dẫn tệp đính kèm. Các
  cột registry thư mục tệp đính kèm của lần chạy subagent và hook dọn dẹp cũ đã bị xóa.
- Hydration hình ảnh CLI không còn duy trì các tệp cache ổn định `openclaw-cli-images`.
  Backend CLI bên ngoài vẫn nhận đường dẫn tệp, nhưng những đường dẫn đó là
  materialization tạm theo từng lần chạy kèm dọn dẹp.
- Chẩn đoán cache-trace, chẩn đoán payload Anthropic, chẩn đoán luồng mô hình thô,
  sự kiện dòng thời gian chẩn đoán và gói ổn định Gateway hiện ghi các hàng SQLite
  thay vì các tệp `logs/*.jsonl` hoặc
  `logs/stability/*.json`.
  Các cờ và biến môi trường ghi đè đường dẫn thời gian chạy đã bị xóa; các lệnh export/gỡ lỗi
  có thể materialize tệp rõ ràng từ các hàng cơ sở dữ liệu.
- Ứng dụng đồng hành macOS không còn trình ghi xoay vòng `diagnostics.jsonl`. Nhật ký ứng dụng
  đi vào logging hợp nhất, và chẩn đoán Gateway bền vững vẫn dựa trên SQLite.
- Danh sách bản ghi port-guardian macOS hiện dùng các hàng SQLite dùng chung có kiểu
  `macos_port_guardian_records` thay vì tệp JSON Application Support
  hoặc blob singleton mờ.
- Khóa singleton Gateway hiện dùng các hàng SQLite dùng chung có kiểu `state_leases` trong
  phạm vi `gateway_locks` thay vì các tệp khóa trong thư mục tạm. Tài liệu khắc phục sự cố
  Fly và OAuth hiện trỏ tới lease SQLite/khóa làm mới auth thay vì dọn dẹp khóa tệp
  lỗi thời.
- Trạng thái sentinel khởi động lại Gateway hiện dùng các hàng SQLite dùng chung có kiểu
  `gateway_restart_sentinel` thay vì `restart-sentinel.json`; thời gian chạy
  đọc loại sentinel, trạng thái, định tuyến, tin nhắn, tiếp tục và thống kê từ
  các cột có kiểu. `payload_json` chỉ là bản sao phát lại/gỡ lỗi. Mã thời gian chạy xóa
  trực tiếp hàng SQLite và không còn mang hệ thống dọn dẹp tệp.
- Ý định khởi động lại Gateway và trạng thái bàn giao supervisor hiện dùng các hàng SQLite dùng chung có kiểu
  `gateway_restart_intent` và `gateway_restart_handoff` thay vì
  các sidecar `gateway-restart-intent.json` và
  `gateway-supervisor-restart-handoff.json`.
- Điều phối singleton Gateway hiện dùng các hàng `state_leases` có kiểu trong
  `gateway_locks` thay vì ghi các tệp `gateway.<hash>.lock`. Hàng lease
  sở hữu chủ khóa, thời hạn, Heartbeat và payload gỡ lỗi; SQLite sở hữu
  ranh giới acquire/release nguyên tử. Tùy chọn thư mục khóa tệp đã nghỉ hưu
  bị xóa; kiểm thử dùng trực tiếp định danh hàng SQLite.
- Helper báo cáo sử dụng cron cũ không còn được tham chiếu, vốn quét các tệp `cron/runs/*.jsonl`,
  đã bị xóa. Báo cáo lịch sử lần chạy Cron nên đọc các hàng SQLite có kiểu
  `cron_run_logs`.
- Khôi phục khởi động lại phiên chính hiện phát hiện các agent ứng viên thông qua registry
  SQLite `agent_databases` thay vì quét các thư mục `agents/*/sessions`.
- Khôi phục hỏng phiên Gemini hiện chỉ xóa hàng phiên SQLite;
  nó không còn cần gate `storePath` cũ hoặc cố unlink một đường dẫn
  transcript JSONL được suy ra.
- Xử lý ghi đè đường dẫn hiện coi các giá trị môi trường literal `undefined`/`null`
  là chưa đặt, ngăn vô tình tạo cơ sở dữ liệu `undefined/state/*.sqlite`
  ở repo root trong khi kiểm thử hoặc bàn giao shell.
- Dấu vân tay sức khỏe cấu hình hiện dùng các hàng SQLite dùng chung có kiểu `config_health_entries`
  thay vì `logs/config-health.json`, giữ tệp cấu hình thông thường là
  tài liệu cấu hình không phải credential duy nhất. Ứng dụng đồng hành macOS chỉ giữ
  trạng thái sức khỏe cục bộ theo tiến trình và không tạo lại sidecar JSON cũ.
- Thời gian chạy hồ sơ auth không còn nhập hoặc ghi các tệp JSON credential. Kho credential
  chuẩn tắc là SQLite; `auth-profiles.json`, `auth.json` theo từng agent
  và `credentials/oauth.json` dùng chung là đầu vào di trú doctor
  và bị xóa sau khi nhập.
- Kiểm thử lưu/trạng thái hồ sơ auth hiện assert trực tiếp các bảng auth SQLite có kiểu
  và chỉ dùng tên tệp auth-profile cũ làm đầu vào di trú doctor.
- `openclaw secrets apply` chỉ làm sạch tệp cấu hình, tệp env và kho
  auth-profile SQLite. Nó không còn mang logic tương thích chỉnh sửa
  `auth.json` theo từng agent đã nghỉ hưu; doctor sở hữu việc nhập và xóa tệp đó.
- Kế hoạch di trú secret Hermes và thao tác áp dụng nhập trực tiếp các hồ sơ API-key
  vào kho auth-profile SQLite. Nó không còn ghi hoặc xác minh
  `auth-profiles.json` như mục tiêu trung gian.
- Tài liệu auth hướng người dùng hiện mô tả
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` thay vì
  bảo người dùng kiểm tra hoặc sao chép `auth-profiles.json`; tên JSON OAuth/auth cũ
  chỉ còn được ghi tài liệu như đầu vào nhập của doctor.
- Helper đường dẫn trạng thái lõi không còn để lộ tệp `credentials/oauth.json`
  đã nghỉ hưu. Tên tệp cũ là cục bộ trong đường dẫn nhập auth của doctor.
- Tài liệu cài đặt, bảo mật, onboarding, auth mô hình và SecretRef hiện mô tả
  các hàng auth-profile SQLite và sao lưu/di trú toàn bộ trạng thái thay vì
  các tệp JSON auth-profile theo từng agent.
- Khám phá mô hình PI hiện truyền credential chuẩn tắc vào bộ lưu trữ auth
  `pi-coding-agent` trong bộ nhớ. Nó không còn tạo, làm sạch hoặc ghi
  `auth.json` theo từng agent trong quá trình khám phá.
- Cài đặt kích hoạt và định tuyến Voice Wake hiện dùng các bảng SQLite dùng chung có kiểu
  thay vì `settings/voicewake.json`, `settings/voicewake-routing.json` hoặc
  các hàng chung mờ; doctor nhập các tệp JSON cũ và xóa chúng sau khi
  di trú thành công.
- Trạng thái kiểm tra cập nhật hiện dùng một hàng dùng chung có kiểu `update_check_state` thay vì
  `update-check.json` hoặc một blob chung mờ; doctor nhập
  tệp JSON cũ và xóa nó sau khi di trú thành công.
- Trạng thái sức khỏe cấu hình hiện dùng các hàng dùng chung có kiểu `config_health_entries`
  thay vì `logs/config-health.json` hoặc một blob chung mờ; doctor
  nhập tệp JSON cũ và xóa nó sau khi di trú thành công.
- Phê duyệt liên kết cuộc trò chuyện Plugin hiện dùng các hàng có kiểu
  `plugin_binding_approvals` thay vì trạng thái SQLite dùng chung mờ hoặc
  `plugin-binding-approvals.json`; tệp kế thừa là đầu vào di chuyển của doctor.
- Các liên kết cuộc trò chuyện hiện tại dạng tổng quát hiện lưu các hàng
  `current_conversation_bindings` có kiểu thay vì ghi lại
  `bindings/current-conversations.json`; doctor nhập tệp JSON kế thừa và
  xóa tệp đó sau khi di chuyển thành công.
- Các sổ cái đồng bộ nguồn đã nhập của Memory Wiki hiện lưu một hàng trạng thái Plugin SQLite
  cho mỗi khóa vault/source thay vì ghi lại `.openclaw-wiki/source-sync.json`;
  trình cung cấp di chuyển nhập và xóa sổ cái JSON kế thừa.
- Các bản ghi lần chạy nhập ChatGPT của Memory Wiki hiện lưu một hàng trạng thái Plugin SQLite
  cho mỗi vault/run id thay vì ghi `.openclaw-wiki/import-runs/*.json`.
  Các ảnh chụp khôi phục vẫn là tệp vault tường minh cho đến khi việc lưu trữ
  ảnh chụp lần chạy nhập được chuyển vào blob storage.
- Các bản tóm lược đã biên dịch của Memory Wiki hiện lưu các hàng blob Plugin SQLite thay vì
  ghi `.openclaw-wiki/cache/agent-digest.json` và
  `.openclaw-wiki/cache/claims.jsonl`. Trình cung cấp di chuyển nhập các tệp cache
  cũ và xóa thư mục cache khi thư mục đó trống.
- Theo dõi cài đặt skill của ClawHub hiện lưu một hàng trạng thái Plugin SQLite cho mỗi
  workspace/skill thay vì ghi hoặc đọc các sidecar `.clawhub/lock.json` và
  `.clawhub/origin.json` trong thời gian chạy. Mã thời gian chạy dùng các đối tượng trạng thái
  cài đặt được theo dõi thay vì các trừu tượng lockfile/origin theo hình dạng tệp. Doctor
  nhập các sidecar kế thừa từ các workspace agent đã cấu hình và xóa chúng
  sau khi nhập sạch.
- Chỉ mục Plugin đã cài đặt hiện đọc và ghi hàng singleton `installed_plugin_index`
  SQLite dùng chung có kiểu thay vì `plugins/installs.json`; tệp JSON
  kế thừa chỉ là đầu vào di chuyển của doctor và được xóa sau khi nhập.
- Trình trợ giúp đường dẫn `plugins/installs.json` kế thừa hiện nằm trong mã kế thừa
  của doctor. Các mô-đun chỉ mục Plugin thời gian chạy chỉ phơi bày các tùy chọn lưu bền vững
  dựa trên SQLite, không phải đường dẫn tệp JSON.
- Sentinel khởi động lại Gateway, ý định khởi động lại, và trạng thái bàn giao supervisor hiện dùng
  các hàng SQLite dùng chung có kiểu (`gateway_restart_sentinel`,
  `gateway_restart_intent`, và `gateway_restart_handoff`) thay vì các blob mờ
  dạng tổng quát. Mã khởi động lại thời gian chạy không còn hợp đồng sentinel/intent/handoff
  theo hình dạng tệp.
- Cache đồng bộ Matrix, siêu dữ liệu lưu trữ, liên kết luồng, dấu chống trùng lặp inbound,
  trạng thái cooldown xác minh khởi động, ảnh chụp crypto IndexedDB của SDK,
  thông tin xác thực, và khóa khôi phục hiện dùng các bảng trạng thái/blob Plugin SQLite dùng chung.
  Các struct đường dẫn thời gian chạy không còn phơi bày đường dẫn siêu dữ liệu `storage-meta.json`;
  tên tệp đó chỉ là đầu vào di chuyển kế thừa. Kế hoạch nhập JSON kế thừa của chúng
  nằm trong bề mặt thiết lập/di chuyển doctor của Plugin Matrix.
- Khởi động Matrix không còn quét, báo cáo, hoặc hoàn tất trạng thái tệp Matrix kế thừa.
  Phát hiện tệp Matrix, tạo ảnh chụp crypto kế thừa, trạng thái di chuyển khôi phục room-key,
  nhập, và xóa nguồn đều do doctor sở hữu.
- Các barrel di chuyển thời gian chạy Matrix đã bị xóa. Các trình trợ giúp phát hiện và chỉnh sửa
  trạng thái/crypto kế thừa được Matrix doctor nhập trực tiếp thay vì là một phần
  của bề mặt API thời gian chạy.
- Các dấu tái sử dụng ảnh chụp di chuyển Matrix hiện nằm trong trạng thái Plugin SQLite
  thay vì `matrix/migration-snapshot.json`; doctor vẫn có thể tái sử dụng cùng
  kho lưu trữ trước di chuyển đã xác minh mà không ghi tệp trạng thái sidecar.
- Cursor bus Nostr và trạng thái xuất bản hồ sơ hiện dùng trạng thái Plugin SQLite dùng chung.
  Kế hoạch nhập JSON kế thừa của chúng nằm trong bề mặt thiết lập/di chuyển doctor
  của Plugin Nostr.
- Các công tắc phiên Active Memory hiện dùng trạng thái Plugin SQLite dùng chung thay vì
  `session-toggles.json`; bật lại bộ nhớ sẽ xóa hàng thay vì
  ghi lại một đối tượng JSON.
- Các đề xuất Skill Workshop và bộ đếm đánh giá hiện dùng trạng thái Plugin SQLite dùng chung
  thay vì các kho `skill-workshop/<workspace>.json` theo từng workspace. Mỗi
  đề xuất là một hàng riêng dưới `skill-workshop/proposals`, và bộ đếm đánh giá
  là một hàng riêng dưới `skill-workshop/reviews`.
- Các lần chạy subagent đánh giá Skill Workshop hiện dùng trình phân giải transcript phiên
  thời gian chạy thay vì tạo các đường dẫn phiên sidecar `skill-workshop/<sessionId>.json`.
- Các lease tiến trình ACPX hiện dùng trạng thái Plugin SQLite dùng chung dưới
  `acpx/process-leases` thay vì registry toàn tệp `process-leases.json`.
  Mỗi lease được lưu dưới dạng hàng riêng, giữ nguyên việc dọn các tiến trình cũ
  khi khởi động mà không có đường dẫn ghi lại JSON trong thời gian chạy.
- Các script wrapper ACPX và Codex home cô lập được tạo trong thư mục tạm gốc
  của OpenClaw. Chúng được tạo lại khi cần và không phải đầu vào sao lưu hoặc
  di chuyển.
- Lưu bền vững registry lần chạy subagent dùng các hàng `subagent_runs` dùng chung có kiểu. Đường dẫn
  `subagents/runs.json` cũ hiện chỉ là đầu vào di chuyển của doctor, và
  tên trình trợ giúp thời gian chạy không còn mô tả lớp trạng thái là dựa trên đĩa.
  Các kiểm thử thời gian chạy không còn tạo fixture `runs.json` không hợp lệ hoặc trống để chứng minh
  hành vi registry; chúng seed/đọc trực tiếp các hàng SQLite.
- Backup dàn dựng thư mục trạng thái trước khi lưu trữ, sao chép các tệp không phải cơ sở dữ liệu,
  chụp nhanh cơ sở dữ liệu `*.sqlite` bằng `VACUUM INTO`, bỏ qua các sidecar WAL/SHM
  đang hoạt động, ghi siêu dữ liệu ảnh chụp trong manifest lưu trữ, và ghi
  các lần chạy backup đã hoàn tất trong SQLite cùng với manifest lưu trữ. `openclaw backup
create` xác thực kho lưu trữ đã ghi theo mặc định; `--no-verify` là đường dẫn nhanh
  tường minh.
- `openclaw backup restore` xác thực kho lưu trữ trước khi giải nén, tái sử dụng
  manifest đã chuẩn hóa của trình xác minh, và khôi phục các tài sản manifest đã xác minh về
  đường dẫn nguồn đã ghi. Lệnh yêu cầu `--yes` để ghi và hỗ trợ `--dry-run`
  cho kế hoạch khôi phục.
- Bộ lọc đường dẫn biến động backup cũ bị xóa. Backup không còn cần danh sách bỏ qua
  live-tar cho các tệp JSON/JSONL phiên hoặc cron kế thừa vì ảnh chụp SQLite
  được dàn dựng trước khi tạo kho lưu trữ.
- Chuẩn bị workspace cho thiết lập thường và onboarding không còn tạo các thư mục
  `agents/<agentId>/sessions/`. Chúng chỉ tạo config/workspace;
  các hàng phiên SQLite và hàng transcript được tạo theo nhu cầu trong
  cơ sở dữ liệu theo từng agent.
- Sửa quyền bảo mật hiện nhắm đến cơ sở dữ liệu SQLite toàn cục và theo từng agent
  cộng với các sidecar WAL/SHM thay vì `sessions.json` và các tệp transcript
  JSONL.
- Tên thời gian chạy registry sandbox hiện mô tả trực tiếp các loại registry SQLite
  thay vì mang thuật ngữ registry JSON kế thừa qua kho đang hoạt động.
- `openclaw reset --scope config+creds+sessions` xóa các cơ sở dữ liệu
  `openclaw-agent.sqlite` theo từng agent cộng với các sidecar WAL/SHM, không chỉ các thư mục
  `sessions/` kế thừa.
- Các trình trợ giúp phiên tổng hợp Gateway hiện dùng tên hướng theo mục:
  `loadCombinedSessionEntriesForGateway` trả về `{ databasePath, entries }`.
  Cách đặt tên combined-store cũ đã bị xóa khỏi các caller thời gian chạy.
- Seeding kênh Docker MCP hiện ghi hàng phiên chính và các sự kiện transcript
  vào cơ sở dữ liệu SQLite theo từng agent thay vì tạo
  `sessions.json` và transcript JSONL.
- Hook session-memory đóng gói hiện phân giải ngữ cảnh phiên trước từ
  SQLite theo `{agentId, sessionId}`. Nó không còn quét, lưu trữ, hoặc tổng hợp
  đường dẫn transcript hay thư mục `workspace/sessions`.
- Hook command-logger đóng gói hiện ghi các hàng audit lệnh vào bảng SQLite dùng chung
  `command_log_entries` thay vì nối thêm vào
  `logs/commands.log`.
- Allowlist ghép nối kênh hiện chỉ phơi bày các trình trợ giúp đọc/ghi dựa trên SQLite
  trong thời gian chạy và trong Plugin SDK. Trình phân giải đường dẫn `*-allowFrom.json`
  cũ và trình đọc tệp chỉ nằm dưới mã nhập kế thừa của doctor.
- `migration_runs` ghi lại các lần thực thi di chuyển trạng thái kế thừa với trạng thái,
  dấu thời gian, và báo cáo JSON.
- `migration_sources` ghi lại từng nguồn tệp kế thừa đã nhập với hash, kích thước,
  số lượng bản ghi, bảng đích, run id, trạng thái, và trạng thái xóa nguồn.
- `backup_runs` ghi lại đường dẫn kho lưu trữ backup, trạng thái, và manifest JSON.
- Schema toàn cục không giữ bảng registry `agents` không dùng đến. Phát hiện
  cơ sở dữ liệu agent là registry `agent_databases` chuẩn cho đến khi thời gian chạy
  có chủ sở hữu bản ghi agent thực sự.
- Config catalog model được tạo được lưu trong các hàng SQLite toàn cục có kiểu
  `agent_model_catalogs` được khóa theo thư mục agent. Các caller thời gian chạy dùng
  `ensureOpenClawModelCatalog`; không có API tương thích `models.json` trong
  mã thời gian chạy. Phần triển khai ghi SQLite và registry PI nhúng được
  hydrate từ payload đã lưu đó mà không tạo tệp `models.json`.
- Xuất markdown transcript phiên QMD và config `memory.qmd.sessions` đã bị
  xóa. Không có bộ sưu tập transcript QMD, không có đường dẫn thời gian chạy
  `qmd/sessions*`, và không có cầu nối bộ nhớ phiên dựa trên tệp.
- Thời gian chạy memory-core nhập các trình trợ giúp lập chỉ mục transcript SQLite từ
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, không phải
  subpath SDK QMD. Subpath QMD giữ một re-export tương thích chỉ cho
  các caller bên ngoài cho đến khi một lần dọn dẹp SDK lớn có thể xóa nó.
- `index.sqlite` riêng của QMD hiện là một materialization thời gian chạy tạm được chống lưng bởi
  bảng SQLite chính `plugin_blob_entries`. Thời gian chạy không còn tạo sidecar
  `~/.openclaw/agents/<agentId>/qmd` bền vững.
- Plugin tùy chọn `memory-lancedb` không còn tạo
  `~/.openclaw/memory/lancedb` như một kho do OpenClaw quản lý ngầm định. Nó là một
  backend LanceDB bên ngoài và vẫn bị tắt cho đến khi operator cấu hình
  `dbPath` tường minh.
- `check:database-first-legacy-stores` làm thất bại nguồn thời gian chạy mới ghép
  tên kho kế thừa với API hệ thống tệp kiểu ghi. Nó cũng làm thất bại nguồn
  thời gian chạy tái giới thiệu các dấu cầu nối transcript đã nghỉ hưu
  `transcriptLocator` hoặc `sqlite-transcript://...`. Mã di chuyển, doctor, nhập,
  và xuất không phải phiên tường minh vẫn được phép. Các tên hợp đồng kế thừa rộng hơn
  như `sessionFile`, `storePath`, và các facade thời kỳ tệp `SessionManager` cũ
  vẫn có chủ sở hữu hiện tại và cần công việc guard di chuyển riêng
  trước khi chúng có thể trở thành kiểm tra preflight bắt buộc. Guard hiện cũng bao phủ
  các kho `cache/*.json` thời gian chạy, sidecar
  `thread-bindings.json` tổng quát, JSON trạng thái/run-log cron, JSON sức khỏe config,
  sidecar khởi động lại và khóa, cài đặt Voice Wake, phê duyệt liên kết Plugin,
  JSON chỉ mục Plugin đã cài đặt, JSONL audit File Transfer, nhật ký hoạt động
  Memory Wiki, nhật ký văn bản `command-logger` đóng gói cũ, và các núm chẩn đoán JSONL
  luồng thô pi-mono. Nó cũng cấm các tên mô-đun kế thừa doctor cấp gốc cũ để
  mã tương thích nằm dưới `src/commands/doctor/`. Các handler debug Android
  cũng dùng logcat/đầu ra trong bộ nhớ thay vì dàn dựng các tệp cache `camera_debug.log` hoặc
  `debug_logs.txt`.

## Hình dạng lược đồ đích

Giữ lược đồ tường minh. Trạng thái runtime do host sở hữu dùng các bảng có kiểu. Trạng thái mờ do Plugin sở hữu dùng `plugin_state_entries` / `plugin_blob_entries`; không có bảng host `kv` chung.

Cơ sở dữ liệu toàn cục:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Cơ sở dữ liệu agent:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

Tìm kiếm trong tương lai có thể thêm các bảng FTS mà không thay đổi các bảng sự kiện chuẩn tắc:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Các giá trị lớn nên dùng cột `blob`, không mã hóa chuỗi JSON. Giữ `value_json` cho dữ liệu có cấu trúc nhỏ cần tiếp tục có thể kiểm tra bằng công cụ SQLite thuần.

`agent_databases` là registry chuẩn tắc cho nhánh này. Không thêm bảng `agents` cho đến khi có chủ sở hữu bản ghi agent thực sự; cấu hình agent vẫn nằm trong `openclaw.json`.

## Hình dạng di trú của Doctor

Doctor nên gọi một bước di trú tường minh, có thể báo cáo và an toàn để chạy lại:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` gọi triển khai di trú trạng thái sau bước kiểm tra sơ bộ cấu hình thông thường và tạo bản sao lưu đã xác minh trước khi nhập. Khởi động runtime và `openclaw migrate` không được nhập các tệp trạng thái OpenClaw cũ.

Thuộc tính di trú:

- Một lượt di trú phát hiện tất cả nguồn tệp cũ và tạo kế hoạch trước khi thay đổi bất cứ thứ gì.
- Doctor tạo kho lưu trữ sao lưu trước di trú đã xác minh trước khi nhập các tệp cũ.
- Các lượt nhập có tính lũy đẳng và được định danh bằng đường dẫn nguồn, mtime, kích thước, hash và bảng đích.
- Các tệp nguồn thành công được xóa hoặc lưu trữ sau khi cơ sở dữ liệu đích đã commit.
- Các lượt nhập thất bại giữ nguyên nguồn và ghi cảnh báo trong `migration_runs`.
- Mã runtime chỉ đọc SQLite sau khi cơ chế di trú tồn tại.
- Không cần đường dẫn hạ cấp/xuất sang tệp runtime.

## Bản kiểm kê di trú

Chuyển các mục này vào cơ sở dữ liệu toàn cục:

- Các thao tác ghi lúc chạy của sổ đăng ký tác vụ nay dùng cơ sở dữ liệu dùng chung; trình nhập file phụ trợ `tasks/runs.sqlite` chưa phát hành đã bị xóa. Lưu ảnh chụp nhanh sẽ upsert theo id tác vụ và chỉ xóa các hàng tác vụ/phân phối bị thiếu.
- Các thao tác ghi lúc chạy của luồng tác vụ nay dùng cơ sở dữ liệu dùng chung; trình nhập file phụ trợ `tasks/flows/registry.sqlite` chưa phát hành đã bị xóa. Lưu ảnh chụp nhanh sẽ upsert theo id luồng và chỉ xóa các hàng luồng bị thiếu.
- Các thao tác ghi lúc chạy của trạng thái Plugin nay dùng cơ sở dữ liệu dùng chung; trình nhập file phụ trợ `plugin-state/state.sqlite` chưa phát hành đã bị xóa.
- Tìm kiếm bộ nhớ tích hợp sẵn không còn mặc định về `memory/<agentId>.sqlite`; các bảng chỉ mục của nó nằm trong cơ sở dữ liệu agent sở hữu, và tùy chọn file phụ trợ tường minh `memorySearch.store.path` đã được chuyển sang di chuyển cấu hình doctor.
- Đánh chỉ mục lại bộ nhớ tích hợp sẵn chỉ đặt lại các bảng do bộ nhớ sở hữu trong cơ sở dữ liệu agent. Nó không được thay thế toàn bộ file SQLite, vì cùng cơ sở dữ liệu đó sở hữu phiên, bản ghi hội thoại, hàng VFS, hiện vật và bộ nhớ đệm lúc chạy.
- Sổ đăng ký container/trình duyệt sandbox từ JSON nguyên khối và phân mảnh. Các thao tác ghi lúc chạy nay dùng cơ sở dữ liệu dùng chung; nhập JSON kế thừa vẫn được giữ lại.
- Định nghĩa công việc Cron, trạng thái lịch và lịch sử chạy nay dùng SQLite dùng chung; doctor nhập/xóa các file kế thừa `jobs.json`, `jobs-state.json` và `cron/runs/*.jsonl`
- Định danh/xác thực thiết bị, push, kiểm tra cập nhật, cam kết, bộ nhớ đệm mô hình OpenRouter, chỉ mục Plugin đã cài đặt và liên kết máy chủ ứng dụng
- Bản ghi ghép nối và khởi động thiết bị/node nay dùng các bảng SQLite có kiểu
- Người đăng ký thông báo ghép nối thiết bị và dấu mốc yêu cầu đã phân phối nay dùng bảng trạng thái Plugin SQLite dùng chung thay vì `device-pair-notify.json`.
- Bản ghi cuộc gọi thoại nay dùng bảng trạng thái Plugin SQLite dùng chung dưới không gian tên `voice-call` / `calls` thay vì `calls.jsonl`; CLI của Plugin theo dõi và tóm tắt lịch sử cuộc gọi được SQLite hỗ trợ.
- Phiên Gateway QQBot, bản ghi người dùng đã biết và bộ nhớ đệm trích dẫn ref-index nay dùng trạng thái Plugin SQLite dưới các không gian tên `qqbot` (`sessions`, `known-users`, `ref-index`) thay vì `session-*.json`, `known-users.json` và `ref-index.jsonl`; di chuyển doctor/setup của QQBot nhập và xóa các file kế thừa.
- Tùy chọn bộ chọn mô hình Discord, hash triển khai lệnh và liên kết luồng nay dùng trạng thái Plugin SQLite dưới các không gian tên `discord` (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`) thay vì `model-picker-preferences.json`, `command-deploy-cache.json` và `thread-bindings.json`; di chuyển doctor/setup của Discord nhập và xóa các file kế thừa.
- Con trỏ bắt kịp BlueBubbles và dấu mốc khử trùng lặp đầu vào nay dùng trạng thái Plugin SQLite dưới các không gian tên `bluebubbles` (`catchup-cursors`, `inbound-dedupe`) thay vì `bluebubbles/catchup/*.json` và `bluebubbles/inbound-dedupe/*.json`; di chuyển doctor/setup của BlueBubbles nhập và xóa các file kế thừa.
- Offset cập nhật Telegram, mục bộ nhớ đệm nhãn dán, mục bộ nhớ đệm chuỗi trả lời, mục bộ nhớ đệm tin nhắn đã gửi, mục bộ nhớ đệm tên chủ đề và liên kết luồng nay dùng trạng thái Plugin SQLite dưới các không gian tên `telegram` (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`, `topic-names`, `thread-bindings`) thay vì `update-offset-*.json`, `sticker-cache.json`, `*.telegram-messages.json`, `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` và `thread-bindings-*.json`; di chuyển doctor/setup của Telegram nhập và xóa các file kế thừa.
- Con trỏ bắt kịp iMessage, ánh xạ id ngắn trả lời và các hàng khử trùng lặp sent-echo nay dùng trạng thái Plugin SQLite dưới các không gian tên `imessage` (`catchup-cursors`, `reply-cache`, `sent-echoes`) thay vì `imessage/catchup/*.json`, `imessage/reply-cache.jsonl` và `imessage/sent-echoes.jsonl`; di chuyển doctor/setup của iMessage nhập và xóa các file kế thừa.
- Cuộc hội thoại, bình chọn, token SSO và kiến thức phản hồi của Microsoft Teams nay dùng các không gian tên trạng thái Plugin SQLite (`conversations`, `polls`, `sso-tokens`, `feedback-learnings`) thay vì `msteams-conversations.json`, `msteams-polls.json`, `msteams-sso-tokens.json` và `*.learnings.json`; di chuyển doctor/setup của Microsoft Teams nhập và lưu trữ các file kế thừa. Các bản tải lên đang chờ là bộ nhớ đệm SQLite ngắn hạn và các file bộ nhớ đệm JSON cũ không được di chuyển.
- Bộ nhớ đệm đồng bộ Matrix, metadata lưu trữ, liên kết luồng, dấu mốc khử trùng lặp đầu vào, trạng thái cooldown xác minh khởi động, thông tin xác thực, khóa khôi phục và ảnh chụp nhanh crypto IndexedDB của SDK nay dùng các không gian tên trạng thái/blob Plugin SQLite dưới `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`, `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`) thay vì `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`, `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`, `recovery-key.json` và `crypto-idb-snapshot.json`; di chuyển doctor/setup của Matrix nhập và xóa các file kế thừa đó khỏi các gốc lưu trữ Matrix theo phạm vi tài khoản.
- Con trỏ bus Nostr và trạng thái xuất bản hồ sơ nay dùng trạng thái Plugin SQLite dưới các không gian tên `nostr` (`bus-state`, `profile-state`) thay vì `bus-state-*.json` và `profile-state-*.json`; di chuyển doctor/setup của Nostr nhập và xóa các file kế thừa.
- Công tắc phiên Active Memory nay dùng trạng thái Plugin SQLite dưới `active-memory/session-toggles` thay vì `session-toggles.json`.
- Hàng đợi đề xuất và bộ đếm đánh giá Skill Workshop nay dùng trạng thái Plugin SQLite dưới `skill-workshop/proposals` và `skill-workshop/reviews` thay vì các file `skill-workshop/<workspace>.json` theo từng workspace.
- Hàng đợi phân phối đi và phân phối phiên nay dùng chung bảng SQLite toàn cục `delivery_queue_entries` dưới các tên hàng đợi riêng (`outbound-delivery`, `session-delivery`) thay vì các file bền vững `delivery-queue/*.json`, `delivery-queue/failed/*.json` và `session-delivery-queue/*.json`. Bước legacy-state của doctor nhập các hàng đang chờ và thất bại, xóa các dấu mốc đã phân phối cũ, rồi xóa các file JSON cũ sau khi nhập. Các trường định tuyến nóng và thử lại là cột có kiểu; payload JSON chỉ được giữ lại để phát lại/gỡ lỗi.
- Hợp đồng thuê tiến trình ACPX nay dùng trạng thái Plugin SQLite dưới `acpx/process-leases` thay vì `process-leases.json`.
- Metadata chạy sao lưu và di chuyển

Chuyển các mục này vào cơ sở dữ liệu agent:

- Gốc phiên agent và payload mục phiên theo dạng tương thích. Đã hoàn tất cho các thao tác ghi lúc chạy: metadata phiên nóng có thể truy vấn trong `sessions`, còn payload `SessionEntry` đầy đủ theo dạng kế thừa vẫn nằm trong `session_entries`.
- Sự kiện bản ghi hội thoại agent. Đã hoàn tất cho các thao tác ghi lúc chạy.
- Điểm kiểm tra Compaction và ảnh chụp nhanh bản ghi hội thoại. Đã hoàn tất cho các thao tác ghi lúc chạy: bản sao bản ghi hội thoại của điểm kiểm tra là các hàng bản ghi hội thoại SQLite và metadata điểm kiểm tra được ghi trong `transcript_snapshots`. Các helper điểm kiểm tra Gateway nay gọi các giá trị này là ảnh chụp nhanh bản ghi hội thoại thay vì file nguồn.
- Không gian tên scratch/workspace VFS của agent. Đã hoàn tất cho các thao tác ghi VFS lúc chạy.
- Payload tệp đính kèm subagent. Đã hoàn tất cho các thao tác ghi lúc chạy: chúng là các mục seed VFS SQLite và không bao giờ là file workspace bền vững.
- Hiện vật công cụ. Đã hoàn tất cho các thao tác ghi lúc chạy.
- Hiện vật chạy. Đã hoàn tất cho các thao tác ghi lúc chạy của worker thông qua bảng `run_artifacts` theo từng agent.
- Bộ nhớ đệm lúc chạy cục bộ của agent. Đã hoàn tất cho các thao tác ghi bộ nhớ đệm theo phạm vi lúc chạy của worker thông qua bảng `cache_entries` theo từng agent. Bộ nhớ đệm mô hình toàn Gateway vẫn nằm trong cơ sở dữ liệu toàn cục trừ khi chúng trở thành đặc thù theo agent.
- Nhật ký luồng cha ACP. Đã hoàn tất cho các thao tác ghi lúc chạy.
- Phiên sổ cái phát lại ACP. Đã hoàn tất cho các thao tác ghi lúc chạy qua `acp_replay_sessions` và `acp_replay_events`; `acp/event-ledger.json` kế thừa chỉ còn là đầu vào cho doctor.
- Metadata phiên ACP. Đã hoàn tất cho các thao tác ghi lúc chạy qua `acp_sessions`; các khối `entry.acp` kế thừa trong `sessions.json` chỉ là đầu vào di chuyển của doctor.
- File phụ trợ quỹ đạo khi chúng không phải file xuất rõ ràng. Đã hoàn tất cho các thao tác ghi lúc chạy: ghi bắt quỹ đạo tạo các hàng `trajectory_runtime_events` trong cơ sở dữ liệu agent và phản chiếu hiện vật theo phạm vi lần chạy vào SQLite. File phụ trợ kế thừa chỉ là đầu vào nhập của doctor; xuất có thể vật thể hóa đầu ra gói hỗ trợ JSONL mới nhưng không đọc hoặc di chuyển file phụ trợ quỹ đạo/bản ghi hội thoại cũ lúc chạy. Bắt quỹ đạo lúc chạy phơi bày phạm vi SQLite; helper đường dẫn JSONL được cô lập cho hỗ trợ xuất/gỡ lỗi và không được tái xuất từ mô-đun runtime. Metadata quỹ đạo embedded-runner ghi định danh `{agentId, sessionId, sessionKey}` thay vì lưu một bộ định vị bản ghi hội thoại.

Tạm thời giữ các mục này dựa trên file:

- `openclaw.json`
- file thông tin xác thực provider hoặc CLI
- manifest Plugin/gói
- workspace người dùng và kho Git khi chọn chế độ đĩa
- nhật ký dành cho operator tailing, trừ khi một bề mặt nhật ký cụ thể được chuyển đi

## Kế hoạch di chuyển

### Giai đoạn 0: Đóng băng ranh giới

Làm rõ ranh giới trạng thái bền vững trước khi chuyển thêm hàng:

- Thêm bảng `migration_runs` vào cơ sở dữ liệu toàn cục.
  Đã hoàn tất cho báo cáo thực thi di chuyển legacy-state.
- Thêm một dịch vụ di chuyển trạng thái do doctor sở hữu duy nhất để nhập từ file sang cơ sở dữ liệu.
  Đã hoàn tất: `openclaw doctor --fix` dùng triển khai di chuyển legacy-state.
- Làm cho `plan` chỉ đọc và làm cho `apply` tạo bản sao lưu, nhập, xác minh, rồi xóa hoặc cách ly các file cũ.
  Đã hoàn tất: doctor tạo bản sao lưu trước di chuyển đã xác minh, truyền đường dẫn sao lưu vào `migration_runs` và tái sử dụng các đường dẫn nhập/xóa.
- Thêm lệnh cấm tĩnh để mã runtime mới không thể ghi file trạng thái kế thừa trong khi mã di chuyển và kiểm thử vẫn có thể seed/đọc chúng.
  Đã hoàn tất cho các kho lưu trữ kế thừa hiện đã di chuyển; guard cũng quét các kiểm thử lồng nhau để tìm hợp đồng bộ định vị bản ghi hội thoại runtime bị cấm.

### Giai đoạn 1: Hoàn tất mặt phẳng điều khiển toàn cục

Giữ trạng thái phối hợp dùng chung trong `state/openclaw.sqlite`:

- Agent và sổ đăng ký cơ sở dữ liệu agent
- Sổ cái tác vụ và luồng tác vụ
- Trạng thái Plugin
- Sổ đăng ký container/trình duyệt sandbox
- Lịch sử chạy Cron/bộ lập lịch
- Ghép nối, thiết bị, push, kiểm tra cập nhật, TUI, bộ nhớ đệm OpenRouter/mô hình và trạng thái runtime nhỏ khác theo phạm vi Gateway
- Metadata sao lưu và di chuyển
- Byte tệp đính kèm media Gateway. Đã hoàn tất cho các thao tác ghi lúc chạy; đường dẫn file trực tiếp là vật thể hóa tạm thời để tương thích với trình gửi kênh và staging sandbox. Danh sách cho phép runtime chấp nhận đường dẫn vật thể hóa SQLite, không phải gốc media trạng thái/cấu hình kế thừa. Doctor nhập các file media kế thừa vào `media_blobs` và xóa file nguồn sau khi ghi hàng thành công.
- Phiên bắt debug proxy, sự kiện và blob payload. Đã hoàn tất: các bản bắt nằm trong DB trạng thái dùng chung và mở qua bootstrap DB trạng thái dùng chung, schema, WAL và thiết lập busy-timeout. Byte payload được nén gzip trong `capture_blobs.data`; không có ghi đè DB phụ trợ runtime debug proxy, thư mục blob hoặc đích schema/codegen được tạo riêng cho proxy-capture. Di chuyển doctor/khởi động nhập các hàng `debug-proxy/capture.sqlite` đã phát hành và blob payload được tham chiếu, bao gồm ghi đè môi trường DB/blob kế thừa đang hoạt động, rồi lưu trữ các nguồn đó trong khi vẫn giữ nguyên chứng chỉ CA.

Giai đoạn này cũng xóa các trình mở file phụ trợ trùng lặp, helper quyền, thiết lập WAL, dọn dẹp hệ thống file và trình ghi tương thích khỏi các hệ thống con đó.

### Giai đoạn 2: Giới thiệu cơ sở dữ liệu theo từng agent

Tạo một cơ sở dữ liệu cho mỗi agent và đăng ký nó từ DB toàn cục:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Hàng `agent_databases` toàn cục lưu đường dẫn, phiên bản schema, dấu thời gian lần thấy gần nhất và metadata cơ bản về kích thước/tính toàn vẹn. Mã runtime hỏi sổ đăng ký để lấy DB agent thay vì tự suy ra đường dẫn file trực tiếp.

DB agent sở hữu:

- `sessions` làm gốc phiên chuẩn, với `session_entries` là bảng tải trọng có hình dạng tương thích được gắn vào gốc đó, và
  `session_routes` là tra cứu `session_key` đang hoạt động duy nhất
- `conversations` và `session_conversations` làm danh tính định tuyến nhà cung cấp đã chuẩn hóa
  được gắn vào các phiên
- `transcript_events`
- ảnh chụp bản ghi và điểm kiểm tra Compaction. Đã xong cho ghi runtime.
- `vfs_entries`
- `tool_artifacts` và hiện vật lượt chạy
- các hàng runtime/bộ nhớ đệm cục bộ của tác tử. Đã xong cho bộ nhớ đệm phạm vi worker.
- sự kiện luồng cha ACP
- sự kiện runtime quỹ đạo khi chúng không phải là hiện vật xuất rõ ràng

### Giai Đoạn 3: Thay Thế API Kho Phiên

Đã xong cho runtime. Bề mặt kho phiên dạng tệp không phải là hợp đồng runtime
đang hoạt động:

- Runtime không còn gọi `loadSessionStore(storePath)` hoặc coi `storePath` là
  danh tính phiên.
- Các thao tác hàng runtime là `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry`, và `listSessionEntries`.
- Các helper ghi lại toàn bộ kho, trình ghi tệp, kiểm thử hàng đợi, cắt tỉa alias, và
  tham số xóa khóa legacy đã bị loại khỏi runtime.
- Các export tương thích root-package đã ngừng dùng vẫn điều chỉnh các đường dẫn
  `sessions.json` chuẩn sang API hàng SQLite.
- Việc phân tích cú pháp `sessions.json` chỉ còn trong mã di trú/nhập của doctor và
  kiểm thử doctor.
- Fallback vòng đời runtime đọc tiêu đề bản ghi SQLite, không phải dòng đầu JSONL.

Tiếp tục xóa bất kỳ thứ gì đưa lại tham số khóa tệp,
từ vựng cắt tỉa/cắt ngắn-như-bảo trì-tệp, danh tính đường dẫn kho, hoặc các kiểm thử
chỉ khẳng định tính bền vững JSON.

### Giai Đoạn 4: Di Chuyển Bản Ghi, Luồng ACP, Quỹ Đạo, Và VFS

Biến mọi luồng dữ liệu tác tử thành gốc cơ sở dữ liệu:

- Ghi nối bản ghi đi qua một giao dịch SQLite bảo đảm tiêu đề phiên, kiểm tra tính lũy đẳng của thông điệp, chọn đuôi cha, chèn
  vào `transcript_events`, và ghi siêu dữ liệu danh tính có thể truy vấn trong
  `transcript_event_identities`. Đã xong cho ghi nối thông điệp bản ghi trực tiếp và
  ghi nối `TranscriptSessionManager` được lưu bền vững thông thường; các thao tác nhánh rõ ràng
  giữ lựa chọn cha rõ ràng của chúng và vẫn ghi các hàng SQLite
  mà không suy ra bất kỳ bộ định vị tệp nào.
- Nhật ký luồng cha ACP trở thành hàng, không phải tệp `.acp-stream.jsonl`. Đã xong.
- Thiết lập spawn ACP không còn lưu bền vững đường dẫn JSONL bản ghi. Đã xong.
- Thu thập quỹ đạo runtime ghi trực tiếp các hàng sự kiện/hiện vật. Lệnh hỗ trợ/xuất rõ ràng
  vẫn có thể tạo hiện vật JSONL gói hỗ trợ dưới dạng định dạng xuất, nhưng xuất phiên
  không tái tạo JSONL phiên. Đã xong.
- Không gian làm việc trên đĩa vẫn ở trên đĩa khi được cấu hình là chế độ đĩa.
- Scratch VFS và chế độ không gian làm việc thử nghiệm chỉ-VFS dùng DB tác tử.

Quá trình di trú nhập các tệp JSONL cũ một lần, ghi số lượng/hàm băm trong
`migration_runs`, và xóa các tệp đã nhập sau kiểm tra toàn vẹn.

### Giai Đoạn 5: Sao Lưu, Khôi Phục, Vacuum, Và Xác Minh

Sao lưu vẫn là một tệp lưu trữ duy nhất:

- Tạo checkpoint cho mọi cơ sở dữ liệu toàn cục và tác tử.
- Chụp nhanh từng DB bằng ngữ nghĩa sao lưu SQLite hoặc `VACUUM INTO`.
- Lưu trữ ảnh chụp DB gọn, cấu hình, thông tin xác thực bên ngoài, và các bản xuất
  không gian làm việc được yêu cầu.
- Bỏ qua các tệp live thô `*.sqlite-wal` và `*.sqlite-shm`.
- Xác minh bằng cách mở mọi ảnh chụp DB và chạy `PRAGMA integrity_check`.
  `openclaw backup create` thực hiện xác minh kho lưu trữ này theo mặc định;
  `--no-verify` chỉ bỏ qua lượt kiểm tra kho lưu trữ sau ghi, không bỏ qua kiểm tra toàn vẹn
  khi tạo ảnh chụp.
- Khôi phục sao chép ảnh chụp trở lại đường dẫn đích của chúng. Nhánh này đặt lại bố cục SQLite
  chưa phát hành về `user_version = 1`; các thay đổi schema đã phát hành trong tương lai
  có thể thêm di trú rõ ràng khi cần.

### Giai Đoạn 6: Runtime Worker

Giữ chế độ worker ở trạng thái thử nghiệm trong khi tách cơ sở dữ liệu được đưa vào:

- Worker nhận id tác tử, id lượt chạy, chế độ hệ thống tệp, và danh tính sổ đăng ký DB.
- Mỗi worker mở kết nối SQLite riêng.
- Cha giữ quyền phân phối kênh, phê duyệt, cấu hình, và hủy.
- Bắt đầu với một worker cho mỗi lượt chạy đang hoạt động; chỉ thêm pooling sau khi vòng đời và quyền sở hữu kết nối DB ổn định.

### Giai Đoạn 7: Xóa Thế Giới Cũ

Đã xong cho quản lý phiên runtime. Thế giới cũ chỉ được phép làm đầu vào doctor rõ ràng
hoặc đầu ra hỗ trợ/xuất:

- Không có ghi runtime `sessions.json`, JSONL bản ghi, JSON sổ đăng ký sandbox, SQLite sidecar tác vụ,
  hoặc SQLite sidecar trạng thái Plugin.
- Không có cắt tỉa tệp JSON/phiên, cắt ngắn bản ghi tệp, khóa tệp phiên,
  hoặc kiểm thử phiên có dạng khóa.
- Không có export tương thích runtime nhằm giữ các tệp phiên cũ luôn cập nhật.
- Các bản xuất hỗ trợ rõ ràng vẫn là định dạng lưu trữ/vật thể hóa do người dùng yêu cầu
  và không được đưa tên tệp trở lại danh tính runtime.

## Sao Lưu Và Khôi Phục

Sao lưu nên là một tệp lưu trữ duy nhất, nhưng việc thu thập cơ sở dữ liệu nên theo cách
gốc SQLite:

1. Dừng hoạt động ghi chạy lâu hoặc vào một rào sao lưu ngắn.
2. Với mọi cơ sở dữ liệu toàn cục và tác tử, chạy checkpoint.
3. Chụp nhanh từng cơ sở dữ liệu bằng ngữ nghĩa sao lưu SQLite hoặc `VACUUM INTO` vào một
   thư mục sao lưu tạm thời.
4. Lưu trữ các ảnh chụp cơ sở dữ liệu đã nén, tệp cấu hình, thư mục thông tin xác thực,
   các không gian làm việc đã chọn, và manifest.
5. Xác minh kho lưu trữ bằng cách mở mọi ảnh chụp SQLite được bao gồm và chạy
   `PRAGMA integrity_check`.
   `openclaw backup create` thực hiện việc này theo mặc định; `--no-verify` chỉ dùng để
   cố ý bỏ qua lượt kiểm tra kho lưu trữ sau ghi.

Không dựa vào bản sao live thô `*.sqlite`, `*.sqlite-wal`, và `*.sqlite-shm` làm
định dạng sao lưu chính. Manifest kho lưu trữ nên ghi vai trò cơ sở dữ liệu,
id tác tử, phiên bản schema, đường dẫn nguồn, đường dẫn ảnh chụp, kích thước byte, và trạng thái
toàn vẹn.

Khôi phục nên dựng lại các tệp cơ sở dữ liệu toàn cục và cơ sở dữ liệu tác tử từ
ảnh chụp trong kho lưu trữ. Vì bố cục SQLite chưa được phát hành, refactor này
chỉ giữ schema phiên bản 1 cộng với nhập từ tệp sang cơ sở dữ liệu của doctor. Lệnh khôi phục
xác thực kho lưu trữ trước, rồi thay thế từng tài sản trong manifest từ tải trọng đã trích xuất
và xác minh.

## Kế Hoạch Refactor Runtime

1. Thêm API sổ đăng ký cơ sở dữ liệu.
   - Phân giải đường dẫn DB toàn cục và DB theo từng tác tử.
   - Giữ các schema chưa phát hành ở `user_version = 1`; không thêm mã runner di trú
     schema cho đến khi một schema đã phát hành cần đến nó.
   - Thêm helper đóng/checkpoint/toàn vẹn được dùng bởi kiểm thử, sao lưu, và doctor.

2. Thu gọn các kho SQLite sidecar.
   - Di chuyển bảng trạng thái Plugin vào cơ sở dữ liệu toàn cục. Đã xong cho ghi runtime;
     trình nhập sidecar legacy chưa phát hành đã bị xóa.
   - Di chuyển bảng sổ đăng ký tác vụ vào cơ sở dữ liệu toàn cục. Đã xong cho ghi runtime;
     trình nhập sidecar legacy chưa phát hành đã bị xóa.
   - Di chuyển bảng Task Flow vào cơ sở dữ liệu toàn cục. Đã xong cho ghi runtime;
     trình nhập sidecar legacy chưa phát hành đã bị xóa.
   - Di chuyển bảng tìm kiếm bộ nhớ tích hợp vào từng cơ sở dữ liệu tác tử. Đã xong; `memorySearch.store.path`
     tùy chỉnh rõ ràng hiện được loại bỏ bởi di trú cấu hình doctor.
     Reindex đầy đủ chạy tại chỗ chỉ trên các bảng bộ nhớ; đường dẫn hoán đổi toàn-tệp cũ
     và helper hoán đổi chỉ mục sidecar đã bị xóa.
   - Xóa các trình mở cơ sở dữ liệu trùng lặp, thiết lập WAL, helper quyền, và
     đường dẫn đóng khỏi các phân hệ đó.

3. Di chuyển các bảng do tác tử sở hữu vào cơ sở dữ liệu theo từng tác tử.
   - Tạo DB tác tử theo nhu cầu thông qua sổ đăng ký cơ sở dữ liệu toàn cục. Đã xong.
   - Di chuyển mục phiên runtime, sự kiện bản ghi, hàng VFS, và hiện vật công cụ
     sang DB tác tử. Đã xong.
   - Không di trú mục phiên, sự kiện bản ghi, hàng VFS, hoặc hiện vật công cụ trong shared-DB cục bộ nhánh;
     bố cục đó chưa từng được phát hành. Chỉ giữ nhập từ tệp legacy sang cơ sở dữ liệu trong doctor.

4. Thay thế API kho phiên.
   - Loại bỏ `storePath` làm danh tính runtime. Đã xong cho runtime và được bảo vệ
     bởi `check:database-first-legacy-stores`: siêu dữ liệu phiên, cập nhật tuyến,
     lưu bền vững lệnh, dọn dẹp phiên CLI, bản xem trước suy luận Feishu,
     lưu bền vững trạng thái bản ghi, độ sâu subagent, ghi đè phiên hồ sơ xác thực,
     logic fork cha, và kiểm tra QA-lab hiện phân giải
     cơ sở dữ liệu từ khóa tác tử/phiên chuẩn.
     Phản hồi danh sách phiên Gateway/TUI/UI/macOS hiện expose `databasePath`
     thay vì `path` legacy; bề mặt debug macOS hiển thị cơ sở dữ liệu theo từng tác tử
     như trạng thái chỉ đọc thay vì ghi cấu hình `session.store`.
     `/status`, xuất quỹ đạo do chat dẫn dắt, và proxy phụ thuộc CLI
     không còn truyền đường dẫn kho legacy; fallback sử dụng bản ghi đọc
     SQLite theo danh tính tác tử/phiên. Kiểm thử runtime và bridge không còn expose
     `storePath`; đầu vào doctor/di trú sở hữu tên trường legacy đó.
     Tải phiên kết hợp Gateway không còn nhánh runtime đặc biệt cho
     giá trị `session.store` không theo mẫu; nó tổng hợp các hàng SQLite theo từng tác tử.
     Lane doctor khóa phiên legacy và helper dọn dẹp `.jsonl.lock` của nó
     đã bị loại bỏ; SQLite hiện là ranh giới đồng thời của phiên.
     Các điểm gọi runtime nóng dùng tên helper hướng hàng như
     `resolveSessionRowEntry`; alias tương thích `resolveSessionStoreEntry` cũ
     đã bị loại khỏi runtime và export Plugin SDK.

- Dùng thao tác hàng `{ agentId, sessionKey }`.
  Đã xong: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry`, và `listSessionEntries` là API ưu tiên SQLite, không
  yêu cầu đường dẫn kho phiên. Tóm tắt trạng thái, trạng thái tác tử cục bộ, health,
  và lệnh liệt kê `openclaw sessions` hiện đọc trực tiếp các hàng theo từng tác tử
  và hiển thị đường dẫn cơ sở dữ liệu SQLite theo từng tác tử thay vì đường dẫn `sessions.json`.
- Thay thế xóa/chèn toàn bộ kho bằng `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries`, và truy vấn dọn dẹp SQL.
  Đã xong cho runtime: các đường dẫn nóng hiện dùng API hàng và patch hàng có thử lại khi xung đột;
  các helper nhập/thay thế toàn bộ kho còn lại được giới hạn trong mã nhập di trú
  và kiểm thử backend SQLite.
  - Xóa `store-writer.ts` và kiểm thử hàng đợi writer. Đã xong.
  - Xóa cắt tỉa khóa legacy runtime và tham số xóa alias khỏi upsert/patch
    hàng phiên. Đã xong.

5. Xóa hành vi sổ đăng ký JSON runtime.
   - Biến đọc và ghi sổ đăng ký sandbox thành chỉ SQLite. Đã xong.
   - Chỉ nhập JSON nguyên khối và phân mảnh từ bước di trú. Đã xong.
   - Xóa khóa sổ đăng ký phân mảnh và ghi JSON. Đã xong.

- Giữ một bảng sổ đăng ký có kiểu thay vì lưu các hàng sổ đăng ký dưới dạng JSON mờ đục chung
  nếu hình dạng vẫn là trạng thái vận hành đường dẫn nóng. Đã xong.

6. Xóa đột biến phiên có dạng khóa tệp.
   - Đã xong cho tạo khóa runtime và API khóa runtime.
   - Lane dọn dẹp doctor `.jsonl.lock` legacy độc lập đã bị loại bỏ.
   - `session.writeLock` là cấu hình legacy được doctor di trú, không phải thiết lập runtime
     có kiểu.
   - Toàn vẹn trạng thái không còn đường dẫn cắt tỉa tệp bản ghi mồ côi riêng;
     di trú doctor nhập/xóa nguồn JSONL legacy ở một nơi.
   - Điều phối singleton Gateway dùng các hàng `state_leases` SQLite có kiểu dưới
     `gateway_locks` và không còn expose seam thư mục khóa tệp.
   - Lưu bền vững chống trùng lặp Plugin SDK chung không còn dùng khóa tệp hoặc tệp JSON;
     nó ghi các hàng trạng thái Plugin SQLite dùng chung. Đã xong.
   - Điều phối nhúng QMD dùng state lease SQLite thay vì
     `qmd/embed.lock`. Đã xong.

7. Làm cho worker nhận biết cơ sở dữ liệu.
   - Worker mở kết nối SQLite riêng.
   - Cha sở hữu phân phối, callback kênh, và cấu hình.
   - Worker nhận id tác tử, id lượt chạy, chế độ hệ thống tệp, và danh tính sổ đăng ký DB,
     không phải handle live.
   - `vfs-only` vẫn là thử nghiệm và dùng cơ sở dữ liệu tác tử làm gốc lưu trữ.
   - Trước tiên giữ một worker cho mỗi lượt chạy đang hoạt động. Pooling có thể chờ đến khi vòng đời
     kết nối DB và hành vi hủy trở nên ổn định.

8. Tích hợp sao lưu.
   - Dạy sao lưu chụp ảnh nhanh cơ sở dữ liệu toàn cục và cơ sở dữ liệu tác nhân qua bản sao lưu SQLite hoặc
     `VACUUM INTO`. Đã hoàn tất cho các tệp `*.sqlite` được phát hiện dưới tài sản trạng thái.
   - Thêm xác minh sao lưu cho tính toàn vẹn SQLite và phiên bản lược đồ. Đã hoàn tất cho
     quá trình tạo sao lưu và các kiểm tra tính toàn vẹn mặc định khi xác minh kho lưu trữ.
   - Ghi siêu dữ liệu lượt chạy sao lưu trong SQLite. Đã hoàn tất qua bảng `backup_runs`
     dùng chung với đường dẫn kho lưu trữ, trạng thái và JSON bản kê khai.
   - Thêm khôi phục từ các ảnh nhanh kho lưu trữ đã xác minh. Đã hoàn tất: `openclaw backup
restore` xác thực trước khi giải nén, dùng bản kê khai đã chuẩn hóa của trình xác minh, hỗ trợ `--dry-run`, và yêu cầu `--yes` trước khi thay thế
     các đường dẫn nguồn đã ghi nhận.
   - Chỉ bao gồm xuất VFS/không gian làm việc khi được yêu cầu; không xuất nội bộ phiên
     dưới dạng JSON hoặc JSONL.

9. Xóa các kiểm thử và mã lỗi thời. Đã hoàn tất cho các bề mặt phiên runtime đã biết.

- Xóa các kiểm thử khẳng định runtime tạo `sessions.json` hoặc các tệp bản ghi
  JSONL. Đã hoàn tất cho kho lưu trữ phiên lõi, chat, sự kiện bản ghi gateway,
  bản xem trước, vòng đời, cập nhật mục phiên lệnh, đặt lại/truy vết trả lời tự động, và
  fixture dreaming của memory-core, định tuyến đích phê duyệt, sửa chữa bản ghi phiên,
  sửa chữa quyền bảo mật, xuất quỹ đạo, và xuất phiên.
  Các kiểm thử bản ghi active-memory giờ khẳng định phạm vi SQLite và không tạo tệp JSONL
  tạm thời hoặc được lưu bền.
  Hồi quy cắt tỉa bản ghi heartbeat cũ đã bị xóa vì
  runtime không còn cắt ngắn bản ghi JSONL.
  Các kiểm thử công cụ danh sách phiên tác nhân không còn mô hình hóa các đường dẫn `sessions.json`
  kế thừa làm hình dạng phản hồi gateway; các kiểm thử app/UI/macOS dùng `databasePath`.
  Các kiểm thử sử dụng bản ghi `/status` giờ gieo trực tiếp các hàng bản ghi SQLite
  thay vì ghi tệp JSONL.
  Các kiểm thử vòng đời phiên gateway giờ dùng trực tiếp các helper gieo bản ghi SQLite;
  hình dạng fixture tệp phiên một dòng cũ đã biến mất khỏi phạm vi đặt lại
  và xóa.
  `sessions.delete` không còn trả về trường thời kỳ tệp `archived: []`; thao tác xóa
  chỉ báo cáo kết quả đột biến hàng. Tùy chọn `deleteTranscript` cũ
  cũng đã biến mất: xóa một phiên sẽ xóa gốc `sessions` chuẩn tắc và để
  SQLite cascade các hàng bản ghi, ảnh nhanh và quỹ đạo do phiên sở hữu, nên không
  caller nào có thể để sót bản ghi mồ côi hoặc quên một nhánh dọn dẹp.
  Các kiểm thử chụp quỹ đạo context-engine giờ đọc các hàng `trajectory_runtime_events`
  từ một cơ sở dữ liệu tác nhân cô lập thay vì đọc
  `session.trajectory.jsonl`.
  Các script gieo kênh Docker MCP giờ gieo trực tiếp các hàng SQLite. Việc ghi trực tiếp
  `sessions.json` được giới hạn trong các fixture doctor.
  Tool Search Gateway E2E đọc bằng chứng lệnh gọi công cụ từ các hàng bản ghi SQLite
  thay vì quét các tệp `agents/<agentId>/sessions/*.jsonl`.
  Các sự kiện host memory-core và hàng nháp session-corpus giờ nằm trong plugin-state
  SQLite dùng chung; `events.jsonl` và `session-corpus/*.txt` chỉ là đầu vào di trú
  doctor kế thừa. Các hàng đang hoạt động dùng đường dẫn ảo `memory/session-ingestion/`,
  không phải `.dreams/session-corpus`. Module sửa chữa dreaming memory-core cũ
  và các kiểm thử CLI/Gateway của nó đã bị xóa vì runtime không còn sở hữu
  sửa chữa kho lưu trữ tệp cho kho ngữ liệu đó. Các kiểm thử cầu nối/tạo phẩm công khai
  memory-core không còn hiển thị `.dreams/events.jsonl`; chúng dùng tên tạo phẩm JSON ảo
  được SQLite hậu thuẫn.
  Tài liệu kiểm thử SDK/Codex công khai giờ nói trạng thái phiên SQLite thay vì tệp phiên,
  và ví dụ channel-turn không còn phơi bày đối số `storePath`.
  Trạng thái đồng bộ Matrix giờ dùng trực tiếp kho plugin-state SQLite. Các hợp đồng
  client/runtime đang hoạt động truyền gốc lưu trữ tài khoản, không phải đường dẫn `bot-storage.json`,
  và doctor nhập `bot-storage.json` kế thừa vào SQLite trước khi xóa
  nguồn. Các kịch bản QA Matrix khởi động lại/phá hủy giờ đột biến trực tiếp hàng đồng bộ SQLite
  thay vì tạo hoặc xóa các tệp `bot-storage.json` giả, và
  nền E2EE truyền gốc kho đồng bộ thay vì đường dẫn `sync-store.json`
  giả.
  Việc chọn storage-root của Matrix không còn chấm điểm các gốc theo tệp JSON đồng bộ/luồng
  kế thừa; nó dùng siêu dữ liệu gốc bền vững cộng với trạng thái mã hóa thật.
  Bộ kiểm thử backend phiên SQLite runtime không còn dựng giả
  `sessions.json`; các fixture nguồn kế thừa giờ nằm trong các kiểm thử doctor
  nhập chúng.
  Các kiểm thử phiên Gateway không còn phơi bày helper `createSessionStoreDir` hoặc
  thiết lập đường dẫn kho phiên tạm không dùng đến; thư mục fixture là tường minh, và thiết lập
  hàng trực tiếp dùng cách đặt tên hàng phiên SQLite.
  Phạm vi kiểm thử parser kho phiên JSON5 chỉ dành cho doctor đã chuyển khỏi kiểm thử hạ tầng và
  vào kiểm thử di trú doctor, nên các bộ kiểm thử runtime không còn sở hữu việc phân tích cú pháp
  tệp phiên kế thừa.
  Các kiểm thử SSO/tải lên đang chờ của runtime Microsoft Teams không còn mang fixture sidecar
  JSON hoặc parser; việc phân tích token SSO kế thừa chỉ nằm trong module
  di trú Plugin. Các kiểm thử Telegram không còn gieo các đường dẫn kho
  `/tmp/*.json` giả; chúng đặt lại trực tiếp bộ nhớ đệm tin nhắn được SQLite hậu thuẫn. Helper
  trạng thái kiểm thử OpenClaw chung không còn phơi bày writer `auth-profiles.json`
  kế thừa; kiểm thử di trú auth doctor sở hữu fixture đó cục bộ.
  Các kiểm thử runtime cho con trỏ phiên cuối của TUI, phê duyệt exec, bật/tắt active-memory,
  xác minh dedupe/khởi động Matrix, đồng bộ nguồn Memory Wiki,
  liên kết cuộc trò chuyện hiện tại, auth onboarding, và nhập secret Hermes không còn
  chế tạo các tệp sidecar cũ hoặc khẳng định tên tệp cũ vắng mặt. Chúng
  chứng minh hành vi qua các hàng SQLite và API kho công khai; kiểm thử doctor/di trú
  là nơi duy nhất các tên tệp nguồn kế thừa thuộc về.
  Các kiểm thử runtime cho ghép cặp thiết bị/node, channel allowFrom, ý định khởi động lại,
  bàn giao khởi động lại, mục hàng đợi phân phối phiên, sức khỏe cấu hình, bộ nhớ đệm iMessage,
  công việc cron, tiêu đề bản ghi PI, sổ đăng ký subagent, và tệp đính kèm ảnh được quản lý
  cũng không còn tạo các tệp JSON/JSONL đã ngừng dùng chỉ để chứng minh
  chúng bị bỏ qua hoặc vắng mặt.
  Khôi phục tràn PI không còn có fallback ghi lại/cắt ngắn SessionManager:
  việc cắt ngắn kết quả công cụ và ghi lại bản ghi context-engine đột biến
  các hàng bản ghi SQLite, rồi làm mới trạng thái prompt đang hoạt động từ cơ sở dữ liệu.
  Các lần thêm thông điệp SessionManager được lưu bền ủy quyền cho helper thêm bản ghi SQLite
  nguyên tử để chọn cha và đảm bảo tính lũy đẳng. Các lần thêm mục metadata/custom
  thông thường cũng chọn cha hiện tại bên trong SQLite, nên
  các instance manager lỗi thời không hồi sinh các cuộc đua chuỗi cha trước SQLite.
  Dọn đuôi PI tổng hợp cho precheck giữa lượt và `sessions_yield` giờ
  cắt trực tiếp trạng thái bản ghi SQLite; cầu nối xóa đuôi SessionManager cũ
  và các kiểm thử của nó đã bị xóa.
  Chụp checkpoint Compaction cũng chỉ chụp từ SQLite; caller không còn
  truyền SessionManager sống làm nguồn bản ghi thay thế.
- Giữ các kiểm thử gieo tệp kế thừa chỉ cho di trú.
- Bằng chứng tệp JSON đã được thay bằng bằng chứng hàng SQL cho các bề mặt runtime
  đang hoạt động.

- Thêm các lệnh cấm tĩnh đối với runtime ghi vào đường dẫn JSON phiên/bộ nhớ đệm kế thừa.
  Đã hoàn tất cho guard repo.

10. Làm cho báo cáo di trú có thể kiểm toán.
    - Ghi các lượt chạy di trú trong SQLite với timestamp bắt đầu/kết thúc, đường dẫn
      nguồn, hash nguồn, số lượng, cảnh báo và đường dẫn sao lưu.
      Đã hoàn tất: các lần thực thi di trú trạng thái kế thừa giờ lưu bền báo cáo `migration_runs`
      với kiểm kê đường dẫn nguồn/bảng, SHA-256 tệp nguồn, kích thước,
      số lượng bản ghi, cảnh báo và đường dẫn sao lưu.
      Đã hoàn tất: các lần thực thi di trú trạng thái kế thừa cũng lưu bền các hàng `migration_sources`
      để kiểm toán cấp nguồn và quyết định bỏ qua/backfill trong tương lai.
    - Làm cho apply có tính lũy đẳng. Chạy lại sau một lần nhập một phần nên
      bỏ qua nguồn đã được nhập hoặc hợp nhất theo khóa ổn định.
      Đã hoàn tất: chỉ mục phiên, bản ghi, hàng đợi phân phối, trạng thái Plugin, sổ cái tác vụ,
      và các hàng SQLite toàn cục do tác nhân sở hữu nhập qua khóa ổn định hoặc
      ngữ nghĩa upsert/replace, nên các lần chạy lại hợp nhất mà không nhân đôi
      các hàng bền vững.
    - Nhập thất bại phải giữ nguyên tệp nguồn ban đầu tại chỗ.
      Đã hoàn tất: các lần nhập bản ghi thất bại giờ để nguồn JSONL ban đầu tại
      đường dẫn được phát hiện, và `migration_sources` ghi nguồn là
      `warning` với `removed_source=0` cho lần chạy doctor tiếp theo.

## Quy tắc hiệu năng

- Một kết nối cho mỗi luồng/quy trình là ổn; không chia sẻ handle giữa
  các worker.
- Dùng WAL, `foreign_keys=ON`, timeout bận 30 giây, và các giao dịch ghi `BEGIN IMMEDIATE`
  ngắn.
- Giữ các helper giao dịch ghi đồng bộ trừ khi/cho đến khi API giao dịch bất đồng bộ
  thêm ngữ nghĩa mutex/backpressure tường minh.
- Giữ các lần ghi phân phối cha nhỏ và có giao dịch.
- Tránh ghi lại toàn bộ kho; dùng upsert/delete cấp hàng.
- Thêm chỉ mục cho đường dẫn liệt kê-theo-tác-nhân, liệt kê-theo-phiên, updated-at, run id, và
  hết hạn trước khi chuyển mã nóng.
- Lưu tạo phẩm lớn, phương tiện và vector dưới dạng BLOB hoặc hàng BLOB chia khúc, không phải
  JSON base64 hoặc mảng số.
- Giữ các mục plugin-state mờ nhỏ và có phạm vi.
- Thêm dọn dẹp SQL cho TTL/hết hạn thay vì cắt tỉa hệ thống tệp.
  Đã hoàn tất cho các kho runtime do cơ sở dữ liệu sở hữu: media, trạng thái Plugin, blob Plugin,
  dedupe bền vững, và bộ nhớ đệm tác nhân đều hết hạn qua các hàng SQLite. Việc dọn dẹp
  hệ thống tệp còn lại được giới hạn trong các vật thể hóa tạm thời hoặc lệnh
  xóa tường minh.

## Lệnh cấm tĩnh

Thêm một kiểm tra repo làm thất bại các lần ghi runtime mới vào đường dẫn trạng thái kế thừa:

- `sessions.json`
- `*.trajectory.jsonl` ngoại trừ các đầu ra gói hỗ trợ đã được vật chất hóa
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- các tệp bộ nhớ đệm runtime `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` và `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- các tệp JSON phân mảnh sổ đăng ký sandbox
- các tệp JSON cầu nối `/tmp` của native hook relay
- `plugin-state/state.sqlite`
- các sidecar runtime `openclaw-state.sqlite` tùy biến
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- phần trang trí hồ sơ trình duyệt `.openclaw-profile-decorated`
- các trình mở phiên dựa trên tệp `SessionManager.open(...)`
- các facade liệt kê bản ghi `SessionManager.listAll(...)` và `TranscriptSessionManager.listAll(...)`
- các facade fork bản ghi `SessionManager.forkFromSession(...)` và
  `TranscriptSessionManager.forkFromSession(...)`
- các facade thay thế phiên có thể thay đổi `SessionManager.newSession(...)` và `TranscriptSessionManager.newSession(...)`
- các facade phiên nhánh `SessionManager.createBranchedSession(...)` và
  `TranscriptSessionManager.createBranchedSession(...)`

Lệnh cấm nên cho phép kiểm thử tạo fixture kế thừa và cho phép mã di chuyển
đọc/nhập/xóa các nguồn tệp kế thừa. Các sidecar SQLite chưa được phát hành vẫn bị cấm
và không được hưởng ngoại lệ nhập trong doctor.

## Tiêu Chí Hoàn Thành

- Dữ liệu runtime và các lần ghi bộ nhớ đệm đi vào cơ sở dữ liệu SQLite toàn cục hoặc của agent.
- Runtime không còn ghi chỉ mục phiên, JSONL bản ghi, JSON sổ đăng ký sandbox,
  SQLite sidecar tác vụ, hoặc SQLite sidecar plugin-state. Các trình nhập SQLite sidecar tác vụ
  và plugin-state chưa được phát hành bị xóa.
- Việc nhập tệp kế thừa chỉ dành cho doctor.
- Sao lưu tạo một kho lưu trữ với các snapshot SQLite gọn và bằng chứng toàn vẹn.
- Agent worker có thể chạy với đĩa, vùng nháp VFS, hoặc lưu trữ chỉ VFS thử nghiệm.
- Tệp cấu hình và tệp thông tin xác thực rõ ràng vẫn là các tệp điều khiển lâu dài
  không phải cơ sở dữ liệu duy nhất được kỳ vọng.
- Các kiểm tra repo ngăn tái đưa các kho tệp runtime kế thừa.
