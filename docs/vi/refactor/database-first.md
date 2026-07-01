---
read_when:
    - Di chuyển dữ liệu thời gian chạy của OpenClaw, bộ nhớ đệm, bản ghi phiên, trạng thái tác vụ hoặc tệp tạm vào SQLite
    - Thiết kế các migration doctor từ tệp JSON hoặc JSONL cũ
    - Thay đổi hành vi sao lưu, khôi phục, VFS hoặc lưu trữ worker
    - Xóa khóa phiên, cắt tỉa, cắt ngắn hoặc các đường dẫn tương thích JSON
summary: Kế hoạch di trú để biến SQLite thành lớp trạng thái bền vững và bộ nhớ đệm chính, đồng thời vẫn giữ cấu hình được hỗ trợ bằng tệp
title: Tái cấu trúc trạng thái ưu tiên cơ sở dữ liệu
x-i18n:
    generated_at: "2026-07-01T20:27:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# Tái cấu trúc trạng thái ưu tiên cơ sở dữ liệu

## Quyết định

Sử dụng bố cục SQLite hai cấp:

- Cơ sở dữ liệu toàn cục: `~/.openclaw/state/openclaw.sqlite`
- Cơ sở dữ liệu tác tử: một cơ sở dữ liệu SQLite cho mỗi tác tử để lưu không gian làm việc do tác tử sở hữu,
  bản chép lời, VFS, tạo tác và trạng thái thời gian chạy lớn theo từng tác tử
- Cấu hình vẫn được lưu bằng tệp: `openclaw.json` vẫn nằm ngoài
  cơ sở dữ liệu. Hồ sơ xác thực thời gian chạy chuyển sang SQLite; tệp thông tin xác thực
  của nhà cung cấp bên ngoài hoặc CLI vẫn do chủ sở hữu quản lý bên ngoài cơ sở dữ liệu của OpenClaw.

Cơ sở dữ liệu toàn cục là cơ sở dữ liệu mặt phẳng điều khiển. Nó sở hữu việc khám phá tác tử,
trạng thái Gateway dùng chung, ghép cặp, trạng thái thiết bị/nút, sổ cái tác vụ và luồng, trạng thái Plugin,
trạng thái thời gian chạy của bộ lập lịch, siêu dữ liệu sao lưu và trạng thái di trú.

Cơ sở dữ liệu tác tử là cơ sở dữ liệu mặt phẳng dữ liệu. Nó sở hữu siêu dữ liệu phiên của tác tử,
luồng sự kiện bản chép lời, không gian làm việc VFS hoặc vùng tên tạm, tạo tác công cụ,
tạo tác lần chạy và dữ liệu bộ nhớ đệm cục bộ của tác tử có thể tìm kiếm/lập chỉ mục.

Điều này cung cấp một khung nhìn toàn cục bền vững mà không buộc các không gian làm việc tác tử lớn,
bản chép lời và dữ liệu tạm nhị phân đi vào làn ghi Gateway dùng chung.

## Hợp đồng cứng

Quá trình di trú này có một dạng thời gian chạy chuẩn duy nhất:

- Các hàng phiên chỉ lưu siêu dữ liệu phiên. Chúng không được lưu
  `transcriptLocator`, đường dẫn tệp bản chép lời, đường dẫn JSONL song song, đường dẫn khóa,
  siêu dữ liệu cắt tỉa hoặc con trỏ tương thích thời kỳ tệp.
- Danh tính bản chép lời luôn là danh tính SQLite: `{agentId, sessionId}` cộng với
  siêu dữ liệu chủ đề tùy chọn khi giao thức cần.
- `sqlite-transcript://...` không phải là danh tính thời gian chạy hoặc giao thức. Mã mới không được
  suy ra, lưu, truyền, phân tích hoặc di trú bộ định vị bản chép lời. Thời gian chạy và
  kiểm thử hoàn toàn không nên chứa bộ định vị giả; tài liệu chỉ có thể nhắc đến chuỗi này
  để cấm nó.
- `sessions.json` cũ, JSONL bản chép lời, `.jsonl.lock`, cắt tỉa, cắt ngắn
  và logic đường dẫn phiên cũ chỉ thuộc về đường dẫn di trú/nhập của doctor.
- Bí danh cấu hình phiên cũ chỉ thuộc về di trú doctor. Thời gian chạy không
  diễn giải `session.idleMinutes`, `session.resetByType.dm` hoặc
  bí danh phiên chính `agent:main:*` xuyên tác tử cho một tác tử đã cấu hình khác.
- Danh tính định tuyến phiên là trạng thái quan hệ có kiểu. Các đường dẫn thời gian chạy nóng và UI
  nên đọc `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` và
  `session_conversations`; chúng không được phân tích `session_key` hoặc khai thác
  `session_entries.entry_json` để lấy danh tính nhà cung cấp, ngoại trừ như một bóng tương thích
  trong khi các điểm gọi cũ đang được xóa.
- Dấu hiệu tin nhắn trực tiếp ở cấp kênh như `dm` so với `direct` là từ vựng định tuyến,
  không phải bộ định vị bản chép lời hoặc tay cầm tương thích kho tệp.
- Cấu hình trình xử lý hook cũ chỉ thuộc về bề mặt cảnh báo/di trú của doctor.
  Thời gian chạy không được tải `hooks.internal.handlers`; hook chỉ chạy qua các
  thư mục hook được phát hiện và siêu dữ liệu `HOOK.md`.
- Khởi động thời gian chạy, đường dẫn trả lời nóng, Compaction, đặt lại, khôi phục, chẩn đoán,
  TTS, hook bộ nhớ, tác tử con, định tuyến lệnh Plugin, ranh giới giao thức và
  hook phải truyền `{agentId, sessionId}` qua thời gian chạy.
- Kiểm thử nên gieo và xác nhận các hàng bản chép lời SQLite thông qua
  `{agentId, sessionId}`. Các kiểm thử chỉ chứng minh việc chuyển tiếp đường dẫn JSONL,
  giữ nguyên bộ định vị do bên gọi cung cấp hoặc tương thích tệp bản chép lời nên
  bị xóa, trừ khi chúng bao phủ nhập doctor, hiện thực hóa hỗ trợ/gỡ lỗi không thuộc phiên,
  hoặc dạng giao thức.
- `runEmbeddedPiAgent(...)`, các lần chạy worker đã chuẩn bị và lần thử nhúng bên trong
  không được chấp nhận bộ định vị bản chép lời. Chúng mở trình quản lý bản chép lời SQLite
  bằng `{agentId, sessionId}` và truyền trình quản lý đó cho phiên tác tử tương thích PI
  đã được nội bộ hóa, để bên gọi cũ không thể khiến runner ghi bản chép lời
  JSON/JSONL.
- Chẩn đoán runner phải lưu các bản ghi dấu vết thời gian chạy/bộ nhớ đệm/payload trong SQLite.
  Chẩn đoán thời gian chạy không được để lộ núm ghi đè tệp JSONL hoặc trình trợ giúp
  xuất JSONL bản chép lời chung; các bản xuất hướng tới người dùng có thể hiện thực hóa tạo tác rõ ràng
  từ các hàng cơ sở dữ liệu mà không đưa tên tệp trở lại thời gian chạy.
- Ghi nhật ký luồng thô dùng `OPENCLAW_RAW_STREAM=1` cộng với các hàng chẩn đoán SQLite.
  Hợp đồng trình ghi tệp pi-mono cũ `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` và
  `raw-openai-completions.jsonl` không phải là một phần của thời gian chạy hoặc kiểm thử OpenClaw.
- Lập chỉ mục bộ nhớ QMD không được xuất bản chép lời SQLite sang tệp markdown.
  QMD chỉ lập chỉ mục các tệp bộ nhớ đã cấu hình; tìm kiếm bản chép lời phiên vẫn
  dựa trên SQLite.
- Đường dẫn con SDK QMD chỉ dành cho QMD trong mã mới. Trình trợ giúp lập chỉ mục
  bản chép lời phiên SQLite nằm trên `memory-core-host-engine-session-transcripts`; mọi
  tái xuất QMD chỉ là tương thích và không được dùng bởi mã thời gian chạy.
- Chỉ mục bộ nhớ tích hợp nằm trong cơ sở dữ liệu tác tử sở hữu. Cấu hình thời gian chạy và
  hợp đồng thời gian chạy đã phân giải không được để lộ `memorySearch.store.path`; doctor
  xóa khóa cấu hình cũ đó và mã hiện tại truyền nội bộ
  `databasePath` của tác tử.

Công việc triển khai nên tiếp tục xóa mã cho đến khi các phát biểu này đúng
không có ngoại lệ ngoài ranh giới doctor/nhập/xuất/gỡ lỗi.

## Trạng thái mục tiêu và tiến độ

### Mục tiêu cứng

- Một cơ sở dữ liệu SQLite toàn cục sở hữu trạng thái mặt phẳng điều khiển:
  `state/openclaw.sqlite`.
- Một cơ sở dữ liệu SQLite theo từng tác tử sở hữu trạng thái mặt phẳng dữ liệu:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Cấu hình vẫn được lưu bằng tệp. `openclaw.json` không phải là một phần của lần
  tái cấu trúc cơ sở dữ liệu này.
- Tệp cũ chỉ là đầu vào di trú doctor.
- Thời gian chạy không bao giờ ghi hoặc đọc JSONL phiên hoặc bản chép lời như trạng thái hoạt động.

### Các trạng thái mục tiêu

- `not-started`: mã thời gian chạy thời kỳ tệp vẫn ghi trạng thái hoạt động.
- `migrating`: mã doctor/nhập có thể chuyển dữ liệu tệp vào SQLite.
- `dual-read`: cầu nối tạm thời đọc cả SQLite và tệp cũ. Trạng thái này
  bị cấm trong lần tái cấu trúc này, trừ khi được ghi rõ là
  chỉ dành cho doctor.
- `sqlite-runtime`: thời gian chạy chỉ đọc và ghi SQLite.
- `clean`: API và kiểm thử thời gian chạy cũ bị xóa, và chốt chặn ngăn
  hồi quy.
- `done`: tài liệu, kiểm thử, sao lưu, di trú doctor và kiểm tra thay đổi chứng minh
  trạng thái sạch.

### Trạng thái hiện tại

- Phiên: `clean` cho thời gian chạy. Các hàng phiên nằm trong cơ sở dữ liệu theo tác tử,
  API thời gian chạy dùng `{agentId, sessionId}` hoặc `{agentId, sessionKey}`, và
  `sessions.json` chỉ là đầu vào cũ dành cho doctor.
- Bản chép lời: `clean` cho thời gian chạy. Sự kiện bản chép lời, danh tính, ảnh chụp nhanh
  và sự kiện thời gian chạy quỹ đạo nằm trong cơ sở dữ liệu theo tác tử. Thời gian chạy
  không còn chấp nhận bộ định vị bản chép lời hoặc đường dẫn bản chép lời JSONL.
- Runner PI nhúng: `clean`. Các lần chạy PI nhúng, worker đã chuẩn bị, Compaction
  và vòng lặp thử lại dùng phạm vi phiên SQLite và từ chối tay cầm bản chép lời cũ.
- Cron: `clean` cho thời gian chạy. Thời gian chạy dùng `cron_jobs` và `cron_run_logs`;
  kiểm thử thời gian chạy dùng cách đặt tên `storeKey` của SQLite, và đường dẫn Cron thời kỳ tệp chỉ còn trong
  kiểm thử di trú cũ của doctor.
- Sổ đăng ký tác vụ: `clean`. Các hàng thời gian chạy của tác vụ và Task Flow nằm trong
  `state/openclaw.sqlite`; các trình nhập SQLite sidecar chưa phát hành đã bị xóa.
- Trạng thái Plugin: `clean`. Các hàng trạng thái/blob của Plugin nằm trong cơ sở dữ liệu
  toàn cục dùng chung; trình trợ giúp SQLite sidecar trạng thái Plugin cũ được chặn.
- Bộ nhớ: `sqlite-runtime` cho bộ nhớ tích hợp và lập chỉ mục bản chép lời phiên.
  Các bảng chỉ mục bộ nhớ nằm trong cơ sở dữ liệu theo tác tử, trạng thái bộ nhớ Plugin dùng
  các hàng trạng thái Plugin dùng chung, và tệp bộ nhớ cũ là đầu vào di trú doctor
  hoặc nội dung không gian làm việc của người dùng.
- Sao lưu: `sqlite-runtime`. Các giai đoạn sao lưu nén ảnh chụp nhanh SQLite, bỏ qua sidecar
  WAL/SHM đang hoạt động, xác minh tính toàn vẹn SQLite và ghi nhận các lần chạy sao lưu trong
  cơ sở dữ liệu toàn cục.
- Di trú doctor: `migrating`, có chủ ý. Doctor nhập JSON,
  JSONL cũ và kho sidecar đã nghỉ hưu vào SQLite, ghi nhận các lần chạy/nguồn di trú,
  và xóa các nguồn thành công.
- Tập lệnh E2E: `clean` cho độ phủ thời gian chạy. Việc gieo Docker MCP ghi các hàng SQLite.
  Tập lệnh Docker runtime-context chỉ tạo JSONL cũ bên trong
  seed di trú doctor và đặt tên rõ ràng cho đường dẫn chỉ mục phiên cũ.

### Công việc còn lại

- [x] Đổi tên các biến kho kiểm thử thời gian chạy Cron khỏi `storePath` trừ khi
      chúng là đầu vào cũ của doctor.
      Tệp: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Bằng chứng: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Xóa hoặc đổi tên mock kiểm thử xuất thời kỳ tệp lỗi thời.
      Tệp: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Bằng chứng: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Làm cho seed JSONL cũ của Docker runtime-context rõ ràng là chỉ dành cho doctor.
      Tệp: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Bằng chứng: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` chỉ hiển thị
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Giữ các kiểu Kysely đã sinh đồng bộ sau mọi thay đổi lược đồ.
      Tệp: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Bằng chứng: không có thay đổi lược đồ trong lượt này; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Chạy lại các kiểm thử tập trung cho kho, lệnh và tập lệnh đã chạm.
      Bằng chứng: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Trước khi tuyên bố `done`, chạy cổng thay đổi hoặc bằng chứng rộng từ xa.
      Bằng chứng: `pnpm check:changed --timed -- <changed extension paths>` đã vượt qua trên
      lần chạy Hetzner Crabbox `run_3f1cabf6b25c` sau khi thiết lập tạm thời Node 24/pnpm và
      định tuyến đường dẫn rõ ràng cho không gian làm việc đã đồng bộ không có `.git`.

### Không được hồi quy

- Không có bộ định vị bản chép lời.
- Không có tệp phiên hoạt động.
- Không có fixture kiểm thử JSONL giả, ngoại trừ kiểm thử di trú cũ của doctor.
- Không truy cập SQLite thô ở nơi Kysely được kỳ vọng.
- Không thêm di trú DB cũ mới. Bố cục này chưa được phát hành; giữ phiên bản lược đồ
  ở `1` trừ khi có lý do mạnh.

## Giả định đọc mã

Không có quyết định sản phẩm tiếp theo nào đang chặn kế hoạch này. Việc triển khai nên
tiến hành với các giả định sau:

- Sử dụng trực tiếp `node:sqlite` và yêu cầu runtime Node 22+ cho đường dẫn lưu trữ
  này.
- Giữ đúng một tệp cấu hình thông thường. Không chuyển config, manifest plugin
  hoặc workspace Git vào SQLite trong lần tái cấu trúc này.
- Không cần các tệp tương thích runtime. Các tệp JSON và JSONL cũ chỉ là đầu vào
  migration. Các SQLite sidecar cục bộ theo nhánh chưa từng được phát hành và sẽ
  bị xóa thay vì nhập vào.
- `openclaw doctor --fix` sở hữu bước migration từ tệp cũ sang cơ sở dữ liệu.
  Khởi động runtime và `openclaw migrate` không nên mang các đường dẫn nâng cấp
  cơ sở dữ liệu OpenClaw cũ.
- Tương thích thông tin xác thực tuân theo cùng quy tắc: thông tin xác thực
  runtime nằm trong SQLite. Các tệp `auth-profiles.json`, `auth.json` theo từng
  agent, và `credentials/oauth.json` dùng chung cũ là đầu vào migration của
  doctor, rồi bị xóa sau khi nhập.
- Trạng thái catalog mô hình được tạo sinh được chống lưng bởi cơ sở dữ liệu. Mã
  runtime không được ghi `agents/<agentId>/agent/models.json`; các tệp
  `models.json` hiện có là đầu vào doctor cũ và sẽ bị xóa sau khi nhập vào
  `agent_model_catalogs`.
- Runtime không được migrate, chuẩn hóa, hoặc bắc cầu locator bản ghi transcript.
  Danh tính transcript đang hoạt động là `{agentId, sessionId}` trong SQLite.
  Đường dẫn tệp chỉ là đầu vào doctor cũ, và `sqlite-transcript://...` phải biến
  mất khỏi các bề mặt runtime, protocol, hook, và plugin thay vì được xem như
  một handle biên.
- Các lần đọc transcript SQLite ở runtime không chạy migration định dạng entry
  JSONL cũ hoặc ghi lại toàn bộ transcript để tương thích. Chuẩn hóa entry cũ ở
  lại trong các tiện ích doctor/import rõ ràng. Doctor chuẩn hóa các tệp
  transcript JSONL cũ trước khi chèn các hàng SQLite; các hàng runtime hiện tại
  đã được ghi theo schema transcript hiện tại. Export trajectory/session đọc
  nguyên trạng các hàng đó và không được thực hiện migration cũ tại thời điểm
  export.
- Các helper parse/migration transcript JSONL cũ chỉ dành cho doctor. Mã định
  dạng transcript runtime chỉ xây dựng ngữ cảnh transcript SQLite hiện tại;
  doctor sở hữu việc nâng cấp entry JSONL cũ trước khi chèn hàng.
- Helper streaming transcript JSONL cũ do runtime sở hữu đã bị xóa. Mã import
  doctor sở hữu các lần đọc tệp cũ rõ ràng; lịch sử phiên runtime đọc các hàng
  SQLite.
- Binding app-server Codex dùng `sessionId` của OpenClaw làm khóa chuẩn trong
  namespace trạng thái plugin Codex. `sessionKey` là metadata cho
  định tuyến/hiển thị và không được thay thế id phiên bền vững hoặc hồi sinh
  danh tính tệp transcript.
- Các engine ngữ cảnh nhận trực tiếp hợp đồng runtime hiện tại. Registry không
  được bọc engine bằng các shim retry xóa `sessionKey`, `transcriptScope`, hoặc
  `prompt`; các engine không thể chấp nhận tham số database-first hiện tại nên
  thất bại rõ ràng thay vì được bắc cầu.
- Đầu ra backup nên tiếp tục là một tệp archive duy nhất. Nội dung cơ sở dữ liệu
  nên đi vào archive đó dưới dạng snapshot SQLite gọn, không phải các sidecar WAL
  sống thô.
- Tìm kiếm transcript hữu ích nhưng không bắt buộc cho lần cắt database-first
  đầu tiên. Thiết kế schema để có thể thêm FTS sau này.
- Thực thi worker nên tiếp tục ở trạng thái thử nghiệm phía sau settings trong
  khi ranh giới cơ sở dữ liệu ổn định.

## Phát hiện khi đọc mã

Nhánh hiện tại đã vượt qua giai đoạn bằng chứng khái niệm. Cơ sở dữ liệu dùng
chung đã tồn tại, Node `node:sqlite` đã được nối qua một helper runtime nhỏ, và
các store trước đây giờ ghi vào `state/openclaw.sqlite` hoặc cơ sở dữ liệu
`openclaw-agent.sqlite` thuộc sở hữu tương ứng.

Công việc còn lại không phải là chọn SQLite; mà là giữ ranh giới mới sạch sẽ và
xóa mọi giao diện mang dáng dấp tương thích vẫn còn trông giống thế giới tệp cũ:

- Session `storePath` không còn là danh tính runtime, hình dạng fixture test, hay
  trường payload trạng thái. Các test runtime và bridge không còn chứa tên hợp
  đồng `storePath`; mã doctor/migration sở hữu từ vựng cũ đó.
- Các lần ghi session không còn đi qua queue `store-writer.ts` in-process cũ.
  Thay vào đó, ghi patch SQLite dùng phát hiện xung đột và retry có giới hạn.
- Khám phá đường dẫn cũ vẫn có các mục đích migration hợp lệ, nhưng mã runtime
  nên ngừng xem `sessions.json` và các tệp transcript JSONL là mục tiêu ghi khả
  dĩ.
- Các bảng do agent sở hữu nằm trong cơ sở dữ liệu SQLite theo từng agent. DB
  toàn cục giữ các hàng registry/control-plane; danh tính transcript là
  `{agentId, sessionId}` trong các hàng transcript theo từng agent. Mã runtime
  không được lưu bền vững đường dẫn tệp transcript hoặc migrate locator
  transcript.
- Doctor đã nhập một số tệp cũ. Phần dọn dẹp là biến việc đó thành một triển
  khai migration rõ ràng duy nhất mà doctor gọi, kèm một báo cáo migration bền
  vững.

Không còn câu hỏi sản phẩm bổ sung nào chặn việc triển khai.

## Hình dạng mã hiện tại

Nhánh này đã có một nền SQLite dùng chung thật sự:

- Mức runtime tối thiểu hiện là Node 22+: `package.json`, bộ bảo vệ runtime của CLI,
  mặc định trình cài đặt, bộ định vị runtime macOS, CI và tài liệu cài đặt công khai
  đều thống nhất. Luồng tương thích Node 22 cũ đã bị loại bỏ.
- `src/state/openclaw-state-db.ts` mở `openclaw.sqlite`, đặt WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`, và áp dụng
  mô-đun lược đồ đã tạo, được dẫn xuất từ
  `src/state/openclaw-state-schema.sql`.
- Các kiểu bảng Kysely và mô-đun lược đồ runtime được tạo từ các cơ sở dữ liệu
  SQLite dùng một lần, tạo từ các tệp `.sql` đã commit; mã runtime không còn giữ
  các chuỗi lược đồ sao chép thủ công cho cơ sở dữ liệu toàn cục, theo từng tác nhân
  hoặc ghi lại proxy.
- Kho lưu trữ runtime dẫn xuất các kiểu hàng được chọn và được chèn từ những giao diện
  Kysely `DB` đã tạo đó, thay vì tự sao chép hình dạng hàng SQLite bằng tay. SQL thô
  vẫn chỉ giới hạn ở việc áp dụng lược đồ, pragma và DDL chỉ dành cho di chuyển.
- Các lược đồ SQLite được thu gọn về `user_version = 1` vì bố cục cơ sở dữ liệu này
  chưa được phát hành. Các trình mở runtime chỉ tạo lược đồ hiện tại; nhập từ tệp vào
  cơ sở dữ liệu vẫn nằm trong mã doctor, và các helper nâng cấp cơ sở dữ liệu cục bộ
  theo nhánh đã bị xóa.
- Quyền sở hữu quan hệ được thực thi tại nơi ranh giới sở hữu là chuẩn:
  các hàng di chuyển nguồn cascade từ `migration_runs`, trạng thái phân phối tác vụ
  cascade từ `task_runs`, và các hàng danh tính bản ghi cascade từ
  sự kiện bản ghi.
- Các bảng dùng chung hiện tại gồm `agent_databases`,
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
- Trạng thái tùy ý do Plugin sở hữu không nhận các bảng có kiểu do máy chủ sở hữu.
  Các Plugin đã cài đặt dùng `plugin_state_entries` cho payload JSON có phiên bản và
  `plugin_blob_entries` cho byte, với quyền sở hữu namespace/key, dọn dẹp TTL,
  sao lưu và bản ghi di chuyển Plugin. Trạng thái điều phối Plugin do máy chủ sở hữu
  vẫn có thể có bảng có kiểu khi máy chủ sở hữu hợp đồng truy vấn, chẳng hạn như
  `plugin_binding_approvals`.
- Di chuyển Plugin là di chuyển dữ liệu trên các namespace do Plugin sở hữu, không phải
  di chuyển lược đồ máy chủ. Một Plugin có thể di chuyển các mục state/blob có phiên bản
  của chính nó thông qua một nhà cung cấp di chuyển, và máy chủ ghi lại trạng thái
  nguồn/lần chạy trong sổ cái di chuyển thông thường. Cài đặt Plugin mới không yêu cầu
  thay đổi `openclaw-state-schema.sql` trừ khi chính máy chủ đang nhận quyền sở hữu
  một hợp đồng liên Plugin mới.
- `src/state/openclaw-agent-db.ts` mở
  `agents/<agentId>/agent/openclaw-agent.sqlite`, đăng ký cơ sở dữ liệu trong
  DB toàn cục, và sở hữu các bảng phiên, bản ghi, VFS, artifact, bộ nhớ đệm và
  chỉ mục bộ nhớ cục bộ của tác nhân. Khám phá runtime dùng chung hiện đọc registry
  `agent_databases` có kiểu được tạo, thay vì triển khai lại truy vấn đó tại từng
  vị trí gọi.
- Cơ sở dữ liệu toàn cục và theo từng tác nhân ghi một hàng `schema_meta` với vai trò
  cơ sở dữ liệu, phiên bản lược đồ, dấu thời gian và id tác nhân cho cơ sở dữ liệu
  tác nhân. Bố cục vẫn giữ ở `user_version = 1` vì lược đồ SQLite này chưa được
  phát hành.
- Danh tính phiên theo từng tác nhân hiện có bảng gốc `sessions` chuẩn, được khóa bằng
  `session_id`, với `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, dấu thời gian, trường hiển thị, siêu dữ liệu mô hình,
  id harness và liên kết cha/spawn dưới dạng các cột có thể truy vấn. `session_routes`
  là chỉ mục tuyến hoạt động duy nhất từ `session_key` đến `session_id` hiện tại,
  để một khóa tuyến có thể chuyển sang phiên bền vững mới mà không khiến lượt đọc nóng
  phải chọn giữa các hàng `sessions.session_key` trùng lặp. Payload có hình dạng tương
  thích cũ `session_entries.entry_json` treo dưới gốc `session_id` bền vững bằng khóa
  ngoại; nó không còn là biểu diễn cấp lược đồ duy nhất của một phiên.
- Danh tính cuộc trò chuyện bên ngoài theo từng tác nhân cũng mang tính quan hệ:
  `conversations` lưu danh tính nhà cung cấp/tài khoản/cuộc trò chuyện đã chuẩn hóa, và
  `session_conversations` liên kết một phiên OpenClaw với một hoặc nhiều cuộc trò chuyện
  bên ngoài. Điều này bao phủ các phiên DM shared-main, nơi nhiều peer có thể chủ đích
  ánh xạ tới một phiên mà không nói sai trong `session_key`. SQLite cũng thực thi tính
  duy nhất cho danh tính nhà cung cấp tự nhiên để cùng một bộ
  channel/account/kind/peer/thread không thể tách nhánh qua các id cuộc trò chuyện.
  Các peer trực tiếp shared-main được liên kết với vai trò `participant`, để một phiên
  OpenClaw có thể biểu thị nhiều peer DM bên ngoài mà không hạ cấp peer cũ thành các hàng
  liên quan mơ hồ. `sessions.primary_conversation_id` vẫn trỏ tới mục tiêu phân phối
  có kiểu hiện tại. Các cột định tuyến/trạng thái đóng được thực thi bằng ràng buộc
  SQLite `CHECK` thay vì chỉ dựa vào union TypeScript.
  Phép chiếu mục nhập phiên runtime xóa các bóng định tuyến tương thích khỏi
  `session_entries.entry_json` trước khi áp dụng các cột phiên/cuộc trò chuyện có kiểu,
  để payload JSON cũ không thể khôi phục mục tiêu phân phối.
  Định tuyến thông báo subagent cũng yêu cầu ngữ cảnh phân phối SQLite có kiểu; nó không
  còn fallback về các trường tuyến tương thích `SessionEntry`.
  Kế thừa phân phối tường minh Gateway `chat.send` đọc ngữ cảnh phân phối SQLite có kiểu
  thay vì các trường tương thích `origin`/`last*`.
  `tools.effective` cũng dẫn xuất ngữ cảnh nhà cung cấp/tài khoản/thread từ các hàng
  phân phối/định tuyến SQLite có kiểu, không phải các bóng session-entry `last*` cũ.
  Ngữ cảnh prompt sự kiện hệ thống dựng lại các trường channel/to/account/thread từ
  các trường phân phối có kiểu thay vì bóng `origin`.
  Helper dùng chung `deliveryContextFromSession` và bộ ánh xạ phiên-sang-cuộc-trò-chuyện
  hiện bỏ qua hoàn toàn `SessionEntry.origin`; chỉ các trường phân phối có kiểu và
  các hàng cuộc trò chuyện quan hệ mới có thể tạo danh tính tuyến nóng.
  Chuẩn hóa mục nhập phiên runtime loại bỏ `origin` trước khi lưu hoặc chiếu
  `entry_json`, và ghi siêu dữ liệu đầu vào sẽ ghi các trường channel/chat có kiểu cộng
  với các hàng cuộc trò chuyện quan hệ thay vì tạo bóng origin mới.
- Sự kiện bản ghi, ảnh chụp bản ghi và sự kiện runtime quỹ đạo hiện tham chiếu gốc
  `sessions` chuẩn theo từng tác nhân và cascade khi xóa phiên. Các hàng danh tính/idempotency
  bản ghi tiếp tục cascade từ đúng hàng sự kiện bản ghi.
- Chỉ mục memory-core hiện dùng các bảng cơ sở dữ liệu tác nhân rõ ràng
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks`, và
  `memory_embedding_cache`, với `memory_index_state` theo dõi thay đổi revision.
  Các chỉ mục phụ FTS/vector tùy chọn được đặt tên là `memory_index_chunks_fts` và
  `memory_index_chunks_vec` thay vì các bảng chung `meta`, `files`, `chunks`,
  `chunks_fts`, hoặc `chunks_vec`. Các tên chuẩn giữ lại hình dạng hàng path/source
  hiện tại và khả năng tương thích embedding đã tuần tự hóa. Các bảng này là bộ nhớ đệm
  dẫn xuất/tìm kiếm, không phải lưu trữ bản ghi chuẩn; chúng có thể bị xóa và xây dựng
  lại từ các tệp workspace bộ nhớ và nguồn đã cấu hình.
  Việc mở một chỉ mục bộ nhớ tên chung đã phát hành sẽ di chuyển siêu dữ liệu, nguồn,
  chunk và bộ nhớ đệm embedding của nó vào các bảng chuẩn; các bảng FTS/vector dẫn xuất
  được xây dựng lại dưới tên chuẩn của chúng.
- Trạng thái khôi phục lần chạy subagent hiện nằm trong các hàng dùng chung có kiểu
  `subagent_runs`, với các khóa phiên con, requester và controller đã lập chỉ mục.
  Tệp cũ `subagents/runs.json` chỉ là đầu vào di chuyển doctor.
- Liên kết cuộc trò chuyện hiện tại hiện nằm trong các hàng dùng chung có kiểu
  `current_conversation_bindings`, được khóa bằng id cuộc trò chuyện đã chuẩn hóa,
  với các cột tác nhân/phiên mục tiêu, loại cuộc trò chuyện, trạng thái, thời hạn và
  siêu dữ liệu được lưu dưới dạng cột quan hệ thay vì một bản ghi liên kết mờ bị nhân đôi.
  Khóa liên kết bền vững bao gồm loại cuộc trò chuyện đã chuẩn hóa để ref trực tiếp/nhóm/kênh
  không thể va chạm, và SQLite từ chối các giá trị loại/trạng thái liên kết không hợp lệ.
  Tệp cũ `bindings/current-conversations.json` chỉ là đầu vào di chuyển doctor.
- Khôi phục hàng đợi phân phối hiện phủ các cột hàng đợi có kiểu cho kênh, mục tiêu,
  tài khoản, phiên, retry, lỗi, gửi qua nền tảng và trạng thái khôi phục lên JSON phát lại.
  `entry_json` giữ các payload phát lại, hook và payload định dạng, nhưng các cột có kiểu
  là nguồn có thẩm quyền cho định tuyến/trạng thái hàng đợi nóng.
- Con trỏ khôi phục phiên cuối TUI hiện nằm trong các hàng dùng chung có kiểu
  `tui_last_sessions`, được khóa bằng phạm vi kết nối/phiên TUI đã băm.
  Tệp JSON TUI cũ chỉ là đầu vào di chuyển doctor.
- Tùy chọn TTS mặc định hiện nằm trong các hàng SQLite plugin-state dùng chung, được khóa
  dưới Plugin `speech-core`. Tệp cũ `settings/tts.json` chỉ là đầu vào di chuyển doctor;
  runtime không còn đọc hoặc ghi tệp JSON tùy chọn TTS, và bộ phân giải đường dẫn cũ nằm
  trong mô-đun di chuyển doctor.
- Siêu dữ liệu mục tiêu bí mật hiện nói về store thay vì giả vờ mọi mục tiêu thông tin
  xác thực đều là tệp cấu hình. `openclaw.json` vẫn là store cấu hình; các mục tiêu
  auth-profile dùng hàng SQLite có kiểu `auth_profile_stores`, với thông tin xác thực
  theo hình dạng nhà cung cấp được giữ dưới dạng payload JSON.
- Kiểm toán bí mật không còn quét các tệp `auth.json` theo từng tác nhân đã nghỉ hưu.
  Doctor sở hữu việc cảnh báo, nhập và loại bỏ tệp cũ đó.
- Các helper đường dẫn hồ sơ xác thực cũ hiện nằm trong mã legacy của doctor. Helper
  đường dẫn hồ sơ xác thực lõi phơi bày danh tính auth-store SQLite và vị trí hiển thị,
  không phải đường dẫn runtime `auth-profiles.json` hoặc `auth-state.json`.
- Các mô-đun runtime khôi phục lần chạy subagent và bộ nhớ đệm năng lực mô hình OpenRouter
  hiện tách riêng trình đọc/ghi ảnh chụp SQLite khỏi helper nhập JSON legacy chỉ dành cho
  doctor. Năng lực OpenRouter dùng các hàng chung có kiểu
  `model_capability_cache` dưới `provider_id = "openrouter"` thay vì một blob bộ nhớ đệm
  mờ hoặc một bảng máy chủ riêng cho nhà cung cấp. `taskName` của lần chạy subagent được
  lưu trong cột có kiểu `subagent_runs.task_name`; bản sao `payload_json` là dữ liệu
  phát lại/gỡ lỗi, không phải nguồn cho các trường hiển thị nóng hoặc tra cứu.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` triển khai VFS SQLite trên bảng
  `vfs_entries` của cơ sở dữ liệu tác nhân. Đọc thư mục, xuất đệ quy, xóa và đổi tên
  dùng các dải tiền tố `(namespace, path)` đã lập chỉ mục thay vì quét toàn bộ namespace
  hoặc dựa vào so khớp đường dẫn `LIKE`.
- `src/agents/runtime-worker.entry.ts` tạo VFS SQLite theo từng lần chạy, artifact công cụ,
  artifact lần chạy và store bộ nhớ đệm có phạm vi cho worker.
- Dấu hoàn tất bootstrap workspace hiện nằm trong các hàng dùng chung có kiểu
  `workspace_setup_state`, được khóa bằng đường dẫn workspace đã phân giải, thay vì
  `.openclaw/workspace-state.json`; runtime không còn đọc hoặc ghi lại dấu workspace cũ,
  và API helper không còn truyền quanh một đường dẫn giả `.openclaw/setup-state` chỉ để
  dẫn xuất danh tính lưu trữ.
- Phê duyệt exec hiện nằm trong hàng singleton SQLite dùng chung có kiểu
  `exec_approvals_config`. Doctor nhập `~/.openclaw/exec-approvals.json` legacy;
  các lần ghi runtime không còn tạo, ghi lại hoặc báo cáo tệp đó là vị trí store hoạt động.
  Ứng dụng đồng hành macOS đọc và ghi cùng hàng bảng `state/openclaw.sqlite`; nó chỉ giữ
  socket prompt Unix trên đĩa vì đó là IPC, không phải trạng thái runtime bền vững.
- Các mô-đun runtime danh tính thiết bị, xác thực thiết bị và bootstrap hiện tách riêng
  trình đọc/ghi ảnh chụp SQLite khỏi helper nhập JSON legacy chỉ dành cho doctor.
  Danh tính thiết bị dùng các hàng có kiểu `device_identities` và token xác thực thiết bị
  dùng các hàng có kiểu `device_auth_tokens`. Các lần ghi xác thực thiết bị đối chiếu hàng
  theo thiết bị/vai trò thay vì cắt cụt bảng token, và runtime không còn định tuyến cập nhật
  một token qua adapter toàn store cũ. Legacy
  các payload JSON phiên bản 1 chỉ tồn tại dưới dạng nhập/xuất của doctor.
- Bộ nhớ đệm trao đổi token của GitHub Copilot dùng bảng trạng thái Plugin SQLite dùng chung
  tại `github-copilot/token-cache/default`. Đây là trạng thái bộ nhớ đệm do provider sở hữu,
  nên có chủ ý không thêm bảng schema host.
- Compaction của GitHub Copilot không còn ghi các sidecar không gian làm việc
  `openclaw-compaction-*.json`. Harness gọi RPC Compaction lịch sử SDK cho
  phiên SDK được theo dõi, và OpenClaw giữ trạng thái phiên/bản ghi lâu bền trong
  SQLite thay vì các tệp đánh dấu tương thích.
- Runtime Swift dùng chung (`OpenClawKit`) dùng cùng các hàng
  `state/openclaw.sqlite` cho danh tính thiết bị và xác thực thiết bị. Các helper ứng dụng macOS
  nhập các helper SQLite dùng chung thay vì sở hữu một đường dẫn JSON hoặc
  SQLite thứ hai. Một tệp kế thừa còn sót lại `identity/device.json` chặn việc tạo danh tính
  cho đến khi doctor nhập nó vào SQLite, khớp với cổng khởi động TypeScript và Android.
- Danh tính thiết bị Android dùng cùng vật liệu khóa tương thích TypeScript
  được lưu trong các hàng có kiểu `state/openclaw.sqlite#table/device_identities`. Nó không bao giờ
  đọc hoặc ghi `openclaw/identity/device.json`; một tệp kế thừa còn sót lại sẽ chặn
  khởi động cho đến khi doctor nhập nó vào SQLite.
- Token xác thực thiết bị được lưu đệm của Android cũng dùng các hàng có kiểu
  `state/openclaw.sqlite#table/device_auth_tokens` và chia sẻ cùng ngữ nghĩa token
  phiên bản 1 như TypeScript và Swift. Runtime không còn đọc các khóa tương thích `SecurePrefs`
  `gateway.deviceToken*`; các khóa đó chỉ thuộc về logic migration/doctor.
- Lịch sử gói gần đây của thông báo Android dùng các hàng có kiểu
  `android_notification_recent_packages`. Runtime không còn di chuyển hoặc
  đọc các khóa CSV SharedPreferences cũ.
- Việc tạo danh tính thiết bị thất bại theo hướng đóng khi `identity/device.json` kế thừa
  tồn tại, khi hàng danh tính SQLite không hợp lệ, hoặc khi kho danh tính SQLite
  không thể mở. Doctor nhập và xóa tệp đó trước, nên quá trình khởi động runtime
  không thể âm thầm xoay vòng danh tính ghép nối trước khi migration.
- Việc chọn danh tính thiết bị là khóa hàng SQLite, không phải bộ định vị tệp JSON. Các kiểm thử
  và helper Gateway truyền khóa danh tính rõ ràng; chỉ migration của doctor và cổng khởi động
  thất bại theo hướng đóng biết tên tệp `identity/device.json` đã ngừng dùng.
- Tương thích đặt lại phiên hiện nằm trong migration cấu hình của doctor:
  `session.idleMinutes` được chuyển vào `session.reset.idleMinutes`,
  `session.resetByType.dm` được chuyển vào `session.resetByType.direct`, và
  chính sách đặt lại runtime chỉ đọc các khóa đặt lại chuẩn.
- Tương thích cấu hình kế thừa hiện nằm dưới `src/commands/doctor/`. Việc xác thực
  `readConfigFileSnapshot()` thông thường không nhập các bộ phát hiện kế thừa của doctor
  hoặc chú thích vấn đề kế thừa; `runDoctorConfigPreflight()` thêm các vấn đề đó cho
  sửa chữa/báo cáo của doctor. Luồng cấu hình doctor nhập
  `src/commands/doctor/legacy-config.ts`, và việc sửa profile-id OAuth cũ nằm
  dưới
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Các lệnh không phải doctor không tự động chạy sửa chữa cấu hình kế thừa. Ví dụ,
  `openclaw update --channel` hiện thất bại trên cấu hình kế thừa không hợp lệ và yêu cầu
  người dùng chạy doctor, thay vì âm thầm nhập mã migration của doctor.
- Web push, APNs, Voice Wake, kiểm tra cập nhật và sức khỏe cấu hình hiện dùng các bảng SQLite dùng chung có kiểu
  cho subscription, khóa VAPID, đăng ký Node, hàng trigger,
  hàng định tuyến, trạng thái thông báo cập nhật và mục sức khỏe cấu hình thay vì
  toàn bộ blob JSON mờ. Các lần ghi snapshot Web push và APNs hiện điều hòa
  subscription/đăng ký theo khóa chính thay vì xóa sạch bảng của chúng;
  sức khỏe cấu hình cũng làm tương tự theo đường dẫn cấu hình.
  Các module runtime của chúng giữ reader/writer snapshot SQLite tách biệt khỏi
  các helper nhập JSON kế thừa chỉ dành cho doctor.
- Cấu hình Node-host hiện dùng một hàng singleton có kiểu trong cơ sở dữ liệu SQLite dùng chung;
  doctor nhập tệp `node.json` cũ trước khi runtime sử dụng bình thường.
- Ghép nối thiết bị/Node, ghép nối kênh, allowlist kênh và trạng thái bootstrap
  hiện dùng các hàng SQLite có kiểu thay vì toàn bộ blob JSON mờ. Phê duyệt liên kết Plugin
  và trạng thái Cron job theo cùng cách tách này: các module runtime phơi bày
  thao tác được hậu thuẫn bởi SQLite và helper snapshot trung lập, còn các lần ghi snapshot
  ghép nối/bootstrap cộng với phê duyệt liên kết Plugin điều hòa hàng theo khóa chính
  thay vì cắt cụt bảng, trong khi doctor nhập/xóa các tệp JSON cũ thông qua
  các module `src/commands/doctor/legacy/*`.
- Bản ghi Plugin đã cài đặt hiện nằm trong chỉ mục Plugin đã cài đặt SQLite.
  Đọc/ghi cấu hình runtime không còn migration hoặc giữ dữ liệu cấu hình do tác giả tạo
  `plugins.installs` cũ; doctor nhập dạng cấu hình kế thừa đó vào SQLite trước khi
  runtime sử dụng bình thường.
- Snapshot khôi phục thông tin xác thực QQBot hiện nằm trong trạng thái Plugin SQLite tại
  `qqbot/credential-backups`. Runtime không còn ghi
  `qqbot/data/credential-backup*.json`; hợp đồng doctor của QQBot nhập và
  lưu trữ các tệp sao lưu kế thừa đó từ thư mục trạng thái đang hoạt động.
- Lập kế hoạch tải lại Gateway so sánh các snapshot chỉ mục Plugin đã cài đặt SQLite dưới
  namespace diff nội bộ `installedPluginIndex.installRecords.*`. Quyết định
  tải lại runtime không còn bọc các hàng đó trong các đối tượng cấu hình `plugins.installs` giả.
- Nâng cấp thông tin xác thực tài khoản được đặt tên Matrix không còn xảy ra trong quá trình đọc
  runtime. Doctor sở hữu việc đổi tên `credentials/matrix/credentials.json`
  cấp cao nhất cũ khi có thể phân giải một tài khoản Matrix đơn/mặc định.
- Các module runtime ghép nối lõi và Cron không còn xuất các builder đường dẫn JSON kế thừa.
  Các module kế thừa do doctor sở hữu dựng đường dẫn nguồn `pending.json`, `paired.json`,
  `bootstrap.json` và `cron/jobs.json` chỉ cho kiểm thử nhập và
  migration. Việc chuẩn hóa dạng Cron job kế thừa và nhập run-log Cron
  nằm dưới `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` nhập các tệp trạng thái JSON kế thừa,
  bao gồm cấu hình host Node, vào SQLite từ doctor. Các importer tệp kế thừa mới
  tiếp tục nằm dưới `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` nhập `sessions.json` kế thừa và
  bản ghi `*.jsonl` trực tiếp vào SQLite và xóa nguồn khi thành công. Nó
  không còn dàn dựng bản ghi kế thừa ở gốc thông qua
  `agents/<agentId>/sessions/*.jsonl` hoặc tạo mục tiêu JSONL chuẩn trước khi
  nhập.
- Các kiểm tra doctor về tính toàn vẹn trạng thái không còn quét thư mục phiên kế thừa hoặc
  đề xuất xóa JSONL mồ côi. Tệp bản ghi kế thừa chỉ là đầu vào migration,
  và bước migration sở hữu việc nhập cùng xóa nguồn.
- Việc nhập registry sandbox kế thừa nằm dưới
  `src/commands/doctor/legacy/sandbox-registry.ts`; các lần đọc và ghi registry sandbox đang hoạt động
  vẫn chỉ dùng SQLite.
- Sửa chữa sức khỏe/nhập bản ghi phiên kế thừa nằm dưới
  `src/commands/doctor/legacy/session-transcript-health.ts`; các module lệnh runtime
  không còn mang mã phân tích bản ghi JSONL hoặc sửa chữa nhánh đang hoạt động.

Các điểm nổi bật về hợp nhất/xóa đã hoàn tất:

- Trạng thái Plugin hiện dùng cơ sở dữ liệu dùng chung `state/openclaw.sqlite`. Trình nhập sidecar `plugin-state/state.sqlite` cục bộ theo nhánh cũ đã bị xóa vì bố cục SQLite đó chưa từng được phát hành. Các helper probe/test báo cáo `databasePath` dùng chung thay vì để lộ đường dẫn SQLite riêng cho trạng thái Plugin.
- Các bảng runtime của tác vụ và luồng tác vụ hiện nằm trong cơ sở dữ liệu dùng chung `state/openclaw.sqlite` thay vì `tasks/runs.sqlite` và `tasks/flows/registry.sqlite`; các trình nhập sidecar cũ đã bị xóa vì cùng lý do bố cục chưa từng được phát hành.
- `src/config/sessions/store.ts` không còn cần `storePath` cho siêu dữ liệu gửi đến, cập nhật tuyến, hoặc đọc updated-at. Lưu bền lệnh, dọn dẹp phiên CLI, độ sâu subagent, ghi đè xác thực, và định danh phiên transcript dùng các API hàng agent/session. Các lượt ghi được áp dụng dưới dạng bản vá hàng SQLite với thử lại xung đột lạc quan.
- Phân giải đích phiên hiện để lộ các đích cơ sở dữ liệu theo từng agent, không phải các đường dẫn `sessions.json` cũ. Gateway dùng chung, siêu dữ liệu ACP, sửa tuyến bằng doctor, và `openclaw sessions` liệt kê `agent_databases` cùng các agent đã cấu hình.
- Định tuyến phiên Gateway hiện dùng `resolveGatewaySessionDatabaseTarget`; đích được trả về mang `databasePath` và các khóa hàng SQLite ứng viên thay vì đường dẫn tệp kho phiên cũ.
- Các kiểu runtime phiên kênh hiện để lộ `{agentId, sessionKey}` cho đọc updated-at, siêu dữ liệu gửi đến, và cập nhật last-route. Kiểu tương thích `saveSessionStore(storePath, store)` cũ đã bị loại bỏ.
- Runtime Plugin, API extension, và các bề mặt barrel `config/sessions` hiện hướng mã Plugin đến các helper hàng phiên dựa trên SQLite. Các export tương thích thư viện gốc (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) vẫn còn dưới dạng shim đã phản đối cho người dùng hiện có. Helper `resolveLegacySessionStorePath` cũ đã bị xóa; việc dựng đường dẫn `sessions.json` cũ giờ chỉ còn cục bộ trong migration và fixture kiểm thử.
- `src/config/sessions/session-entries.sqlite.ts` hiện lưu các mục phiên chuẩn tắc trong cơ sở dữ liệu theo từng agent và có hỗ trợ bản vá đọc/upsert/xóa ở cấp hàng. Runtime upsert/patch/delete không còn quét biến thể chữ hoa/thường hoặc cắt tỉa khóa bí danh cũ; doctor sở hữu việc chuẩn tắc hóa. Helper nhập JSON độc lập đã bị xóa, và migration hợp nhất bằng cách upsert các hàng mới hơn thay vì thay thế toàn bộ bảng phiên. Các helper đọc/liệt kê/tải công khai chiếu siêu dữ liệu phiên nóng từ các hàng `sessions` và `conversations` có kiểu; `entry_json` là bóng tương thích/gỡ lỗi và có thể lỗi thời hoặc không hợp lệ mà không làm mất định danh phiên có kiểu hoặc ngữ cảnh giao phát.
- `src/config/sessions/delivery-info.ts` hiện phân giải ngữ cảnh giao phát từ các hàng có kiểu theo từng agent `sessions` + `conversations` + `session_conversations`. Nó không còn tái dựng định danh giao phát runtime từ `session_entries.entry_json`; hàng hội thoại có kiểu bị thiếu là vấn đề migration/sửa chữa của doctor, không phải fallback runtime.
- Quyết định đặt lại phiên đã lưu hiện ưu tiên siêu dữ liệu có kiểu `sessions.session_scope`, `sessions.chat_type`, và `sessions.channel`. Việc phân tích `sessionKey` chỉ còn dành cho các hậu tố thread/topic rõ ràng trên đích lệnh; phân loại đặt lại nhóm so với trực tiếp không còn đến từ hình dạng khóa.
- Phân loại hiển thị danh sách/trạng thái phiên hiện dùng siêu dữ liệu chat có kiểu và loại phiên Gateway. Nó không còn coi các chuỗi con `:group:` hoặc `:channel:` bên trong `session_key` là sự thật bền vững về nhóm/trực tiếp.
- Việc chọn chính sách trả lời im lặng hiện chỉ dùng loại hội thoại rõ ràng hoặc siêu dữ liệu bề mặt. Nó không còn đoán chính sách trực tiếp/nhóm từ các chuỗi con `session_key`.
- Phân giải mô hình hiển thị phiên hiện nhận id agent từ đích cơ sở dữ liệu phiên SQLite thay vì tách nó ra khỏi `session_key`.
- Hydrate đích thông báo agent-to-agent hiện chỉ dùng `deliveryContext` có kiểu của `sessions.list`. Nó không còn khôi phục định tuyến kênh/tài khoản/thread từ `origin` cũ, các trường `last*` phản chiếu, hoặc hình dạng `session_key`.
- Từ chối đích thread của `sessions_send` hiện đọc siêu dữ liệu định tuyến SQLite có kiểu. Nó không còn từ chối hoặc chấp nhận đích bằng cách phân tích các hậu tố thread ra khỏi khóa đích.
- Xác thực chính sách công cụ trong phạm vi nhóm hiện đọc định tuyến hội thoại SQLite có kiểu cho phiên hiện tại hoặc phiên được sinh ra. Nó không còn tin định danh nhóm/kênh bằng cách giải mã `sessionKey`; id nhóm do caller cung cấp bị bỏ khi không có hàng phiên có kiểu xác nhận chúng.
- Khớp ghi đè mô hình kênh hiện dùng siêu dữ liệu nhóm và hội thoại cha rõ ràng. Nó không còn giải mã id hội thoại cha từ `parentSessionKey`.
- Kế thừa ghi đè mô hình đã lưu hiện yêu cầu khóa phiên cha rõ ràng từ ngữ cảnh phiên có kiểu. Nó không còn suy ra ghi đè cha từ các hậu tố `:thread:` hoặc `:topic:` trong `sessionKey`.
- Wrapper thread-info phiên cũ và trình phân tích thread của loaded-plugin đã bị xóa; không mã runtime nào import `config/sessions/thread-info`.
- Helper hội thoại kênh không còn để lộ các cầu nối phân tích khóa phiên đầy đủ. Core vẫn chuẩn tắc hóa id hội thoại thô do provider sở hữu thông qua `resolveSessionConversation(...)`, nhưng không tái dựng dữ kiện tuyến từ `sessionKey`.
- Giao phát completion, chính sách gửi, và bảo trì tác vụ không còn suy ra loại chat từ hình dạng `session_key`. Trình phân tích khóa loại chat cũ đã bị xóa; các đường dẫn này yêu cầu siêu dữ liệu phiên có kiểu, ngữ cảnh giao phát có kiểu, hoặc từ vựng đích giao phát rõ ràng.
- Danh sách/trạng thái phiên, chẩn đoán, ràng buộc tài khoản phê duyệt, lọc Heartbeat TUI, và tóm tắt sử dụng không còn khai thác `SessionEntry.origin` để lấy định tuyến provider/tài khoản/thread/hiển thị. Các lượt đọc `origin` runtime còn lại duy nhất là những khái niệm không phải phiên hoặc đối tượng giao phát lượt hiện tại.
- Tra cứu hội thoại gốc của yêu cầu phê duyệt hiện đọc các hàng định tuyến phiên có kiểu theo từng agent. Nó không còn phân tích định danh hội thoại kênh/nhóm/thread từ `sessionKey`; siêu dữ liệu có kiểu bị thiếu là vấn đề migration/sửa chữa.
- Payload sự kiện session changed/chat/session của Gateway không còn lặp lại `SessionEntry.origin` hoặc các bóng tuyến `last*`; client nhận `channel`, `chatType`, và `deliveryContext` có kiểu.
- Phân giải giao phát Heartbeat giờ có thể nhận trực tiếp `deliveryContext` SQLite có kiểu, và runtime heartbeat truyền hàng giao phát phiên theo từng agent thay vì dựa vào các bóng `session_entries` tương thích cho định tuyến hiện tại.
- Phân giải đích giao phát isolated-agent của Cron cũng hydrate tuyến hiện tại từ hàng giao phát phiên có kiểu theo từng agent trước khi fallback sang payload mục tương thích.
- Phân giải origin thông báo subagent hiện luồn ngữ cảnh giao phát phiên requester có kiểu qua `loadRequesterSessionEntry` và ưu tiên hàng đó hơn các bóng tương thích `last*`/`deliveryContext`.
- Cập nhật siêu dữ liệu phiên gửi đến hiện hợp nhất trước với hàng giao phát có kiểu theo từng agent; các trường giao phát `SessionEntry` cũ chỉ là fallback khi không tồn tại hàng hội thoại có kiểu.
- Trích xuất giao phát restart/update hiện để `threadId` giao phát SQLite có kiểu thắng các mảnh topic/thread được phân tích từ `sessionKey`; phân tích chỉ là fallback cho các khóa cũ có dạng thread.
- Id kênh ngữ cảnh hook agent hiện ưu tiên định danh hội thoại SQLite có kiểu, rồi đến siêu dữ liệu thông điệp rõ ràng. Chúng không còn phân tích các mảnh provider/nhóm/kênh từ `sessionKey`.
- Kế thừa tuyến bên ngoài của `chat.send` Gateway hiện đọc siêu dữ liệu định tuyến phiên SQLite có kiểu thay vì suy luận phạm vi kênh/trực tiếp/nhóm từ các phần `sessionKey`. Phiên trong phạm vi kênh chỉ kế thừa khi kênh phiên có kiểu và loại chat khớp với ngữ cảnh giao phát đã lưu; phiên shared-main giữ quy tắc CLI/không-siêu-dữ-liệu-client nghiêm ngặt hơn.
- Đánh thức restart-sentinel và định tuyến tiếp tục hiện đọc các hàng giao phát/định tuyến SQLite có kiểu trước khi xếp hàng đánh thức Heartbeat hoặc tiếp tục lượt agent đã định tuyến. Nó không còn tái dựng ngữ cảnh giao phát từ bóng JSON session-entry.
- Phân giải ngữ cảnh `tools.effective` của Gateway hiện đọc các hàng giao phát/định tuyến SQLite có kiểu cho các đầu vào provider, tài khoản, đích, thread, và chế độ trả lời. Nó không còn khôi phục các trường định tuyến nóng đó từ các bóng origin `session_entries.entry_json` lỗi thời.
- Định tuyến tư vấn giọng nói thời gian thực hiện phân giải giao phát cha/cuộc gọi từ các hàng phiên SQLite có kiểu theo từng agent. Nó không còn fallback sang các bóng tương thích `SessionEntry.deliveryContext` khi chọn tuyến thông điệp agent nhúng.
- Relay Heartbeat spawn ACP và định tuyến parent-stream hiện đọc giao phát cha từ các hàng phiên SQLite có kiểu. Chúng không còn tái dựng ngữ cảnh giao phát cha từ các bóng session-entry tương thích.
- Bảo toàn tuyến giao phát phiên hiện đi theo siêu dữ liệu chat có kiểu và các cột giao phát đã lưu bền. Nó không còn trích xuất gợi ý kênh, marker trực tiếp/main, hoặc hình dạng thread từ `sessionKey`; tuyến webchat nội bộ chỉ kế thừa đích bên ngoài khi SQLite đã có định danh giao phát có kiểu/đã lưu bền cho phiên.
- Trích xuất giao phát phiên generic hiện chỉ đọc đúng hàng giao phát phiên SQLite có kiểu. Nó không còn phân tích hậu tố thread/topic hoặc fallback từ khóa có dạng thread về khóa phiên cơ sở.
- Điều phối trả lời, khôi phục restart sentinel, và định tuyến tư vấn giọng nói thời gian thực hiện dùng đúng các hàng phiên/hội thoại SQLite có kiểu cho định tuyến thread. Chúng không còn khôi phục id thread hoặc ngữ cảnh giao phát phiên cơ sở bằng cách phân tích các khóa phiên có dạng thread.
- Giới hạn lịch sử PI nhúng hiện dùng phép chiếu định tuyến phiên SQLite có kiểu (`sessions` + `conversations` chính) cho provider, loại chat, và định danh peer. Nó không còn phân tích hình dạng provider, DM, nhóm, hoặc thread ra khỏi `sessionKey`.
- Suy luận giao phát công cụ Cron hiện chỉ dùng giao phát rõ ràng hoặc ngữ cảnh giao phát có kiểu hiện tại. Nó không còn giải mã các đích kênh, peer, tài khoản, hoặc thread từ `agentSessionKey`.
- Các hàng phiên runtime không còn mang bí danh tuyến `lastProvider` cũ. Helper và kiểm thử dùng các trường `lastChannel` và `deliveryContext` có kiểu; migration doctor là nơi duy nhất nên dịch các bí danh tuyến cũ hoặc bóng `origin` đã lưu bền.
- Sự kiện transcript, hàng VFS, và hàng artifact công cụ giờ ghi vào cơ sở dữ liệu theo từng agent. Bảng ánh xạ tệp transcript toàn cục chưa từng phát hành đã bị xóa; doctor ghi lại đường dẫn nguồn cũ trong các hàng migration bền vững thay vào đó.
- Tra cứu transcript runtime không còn quét offset byte JSONL hoặc dò các tệp transcript cũ. Các đường dẫn chat/media/history của Gateway đọc hàng transcript từ SQLite; JSONL phiên giờ chỉ là đầu vào doctor cũ, không phải trạng thái runtime hoặc định dạng export.
- Quan hệ cha và nhánh của transcript dùng siêu dữ liệu có cấu trúc `parentTranscriptScope: {agentId, sessionId}` trong header transcript SQLite, không phải chuỗi định vị kiểu đường dẫn `agent-db:...transcript_events...`.
- Hợp đồng trình quản lý transcript không còn để lộ constructor lưu bền ngầm định `create(cwd)` hoặc `continueRecent(cwd)`. Trình quản lý transcript lưu bền được mở với phạm vi rõ ràng `{agentId, sessionId}`; chỉ các trình quản lý trong bộ nhớ còn không cần phạm vi cho kiểm thử và biến đổi transcript thuần túy.
- API kho transcript runtime phân giải phạm vi SQLite, không phải đường dẫn hệ thống tệp. Helper `resolve...ForPath` cũ và các tùy chọn ghi `transcriptPath` không dùng đã biến mất khỏi caller runtime.
- Phân giải phiên runtime hiện dùng `{agentId, sessionId}` và không được suy ra chuỗi `sqlite-transcript://<agent>/<session>` cho ranh giới bên ngoài. Đường dẫn JSONL tuyệt đối cũ chỉ là đầu vào migration doctor.
- Bản ghi direct-bridge của relay hook gốc hiện nằm trong các hàng dùng chung có kiểu `native_hook_relay_bridges` được khóa theo relay id. Runtime không còn ghi registry JSON `/tmp` hoặc bản ghi generic mờ đục cho các bản ghi bridge ngắn hạn đó.
- `runEmbeddedPiAgent(...)` không còn tham số transcript-locator.
  Bộ mô tả worker đã chuẩn bị cũng bỏ qua bộ định vị bản ghi phiên. Trạng thái
  phiên runtime và các lượt chạy theo dõi được xếp hàng mang `{agentId, sessionId}` thay vì
  các handle bản ghi phiên được suy ra.
- Compaction nhúng giờ lấy phạm vi SQLite từ `agentId` và `sessionId`.
  Hook Compaction, lệnh gọi context-engine, ủy quyền CLI và phản hồi giao thức
  không được nhận các handle `sqlite-transcript://...` được suy ra. Mã
  xuất/gỡ lỗi có thể hiện thực hóa các tạo tác người dùng rõ ràng từ các hàng, nhưng nó không cung cấp một
  đường xuất JSONL phiên chung hoặc nạp lại tên tệp vào định danh
  runtime.
- `/export-session` đọc các hàng bản ghi phiên từ SQLite và chỉ ghi chế độ xem HTML
  độc lập được yêu cầu. Trình xem nhúng không còn tái dựng hoặc
  tải xuống JSONL phiên từ các hàng đó.
- Ủy quyền context-engine không còn phân tích bộ định vị bản ghi phiên để khôi phục
  định danh agent. Ngữ cảnh runtime đã chuẩn bị mang `agentId` đã phân giải
  vào bộ điều hợp Compaction tích hợp.
- Ghi lại bản ghi phiên và cắt ngắn kết quả công cụ trực tiếp giờ đọc và lưu bền
  trạng thái bản ghi phiên theo `{agentId, sessionId}` và không suy ra các
  bộ định vị tạm thời cho payload sự kiện cập nhật bản ghi phiên.
- Bề mặt helper trạng thái bản ghi phiên không còn các biến thể dựa trên bộ định vị
  `readTranscriptState`, `replaceTranscriptStateEvents`, hoặc
  `persistTranscriptStateMutation`. Caller runtime phải dùng các API
  `{agentId, sessionId}`. Doctor import đọc các tệp cũ theo đường dẫn tệp rõ ràng
  và ghi các hàng SQLite; nó không di chuyển chuỗi bộ định vị.
- Hợp đồng session-manager runtime không còn phơi bày `open(locator)`,
  `forkFrom(locator)`, hoặc `setTranscriptLocator(...)`. Session manager
  được lưu bền chỉ mở theo `{agentId, sessionId}`; các helper liệt kê/fork nằm trên
  API phiên và checkpoint theo hướng hàng thay vì facade trình quản lý bản ghi phiên.
- API đọc bản ghi phiên của Gateway ưu tiên phạm vi. Chúng nhận
  `{agentId, sessionId}` và không chấp nhận bộ định vị bản ghi phiên theo vị trí có thể
  vô tình trở thành định danh runtime. Việc phân tích bộ định vị bản ghi phiên đang hoạt động
  đã bị loại bỏ; đường dẫn nguồn cũ chỉ được đọc bởi mã doctor import.
- Sự kiện cập nhật bản ghi phiên cũng ưu tiên phạm vi. `emitSessionTranscriptUpdate`
  không còn chấp nhận chuỗi bộ định vị trần, và listener định tuyến theo
  `{agentId, sessionId}` mà không phân tích handle.
- Phát broadcast session-message của Gateway phân giải khóa phiên từ phạm vi agent/phiên,
  không phải từ bộ định vị bản ghi phiên. Bộ phân giải/cache khóa phiên từ bộ định vị bản ghi phiên
  cũ đã bị loại bỏ.
- Bộ lọc SSE session-history của Gateway lọc cập nhật trực tiếp theo phạm vi agent/phiên. Nó không
  còn chuẩn hóa các ứng viên bộ định vị bản ghi phiên, realpath, hoặc định danh bản ghi phiên dạng tệp
  để quyết định một stream có nên nhận cập nhật hay không.
- Hook vòng đời phiên không còn suy ra hoặc phơi bày bộ định vị bản ghi phiên trên
  `session_end`. Người tiêu thụ hook nhận `sessionId`, `sessionKey`, id phiên kế tiếp
  và ngữ cảnh agent; tệp bản ghi phiên không thuộc hợp đồng vòng đời.
- Hook reset cũng không còn suy ra hoặc phơi bày bộ định vị bản ghi phiên. Payload
  `before_reset` mang các thông điệp SQLite đã khôi phục cùng lý do reset,
  trong khi định danh phiên nằm trong ngữ cảnh hook.
- Reset agent harness không còn chấp nhận bộ định vị bản ghi phiên. Dispatch reset được
  định phạm vi bằng `sessionId`/`sessionKey` cộng với lý do.
- Kiểu phiên của tiện ích mở rộng agent không còn phơi bày `transcriptLocator`; tiện ích mở rộng
  nên dùng ngữ cảnh phiên và API runtime thay vì chạm vào định danh bản ghi phiên
  dạng tệp.
- Hook Compaction của Plugin không còn phơi bày bộ định vị bản ghi phiên. Ngữ cảnh hook
  đã mang định danh phiên, và việc đọc bản ghi phiên phải đi qua các API nhận biết phạm vi
  SQLite thay vì handle dạng tệp.
- Hook `before_agent_finalize` không còn phơi bày `transcriptPath`, bao gồm
  payload chuyển tiếp hook native. Hook hoàn tất chỉ dùng ngữ cảnh phiên.
- Phản hồi reset của Gateway không còn tổng hợp bộ định vị bản ghi phiên trên mục
  được trả về. Reset tạo các hàng bản ghi phiên SQLite, trả về mục phiên sạch,
  và để quyền truy cập bản ghi phiên cho các trình đọc nhận biết phạm vi.
- Kết quả chạy nhúng và Compaction không còn phơi bày bộ định vị bản ghi phiên cho
  kế toán phiên. Compaction tự động chỉ cập nhật `sessionId` đang hoạt động,
  bộ đếm Compaction và siêu dữ liệu token.
- Kết quả lần thử nhúng không còn trả về `transcriptLocatorUsed`, và
  kết quả `compact()` của context-engine không còn trả về bộ định vị bản ghi phiên.
  Vòng lặp thử lại runtime chỉ chấp nhận `sessionId` kế nhiệm.
- Kết quả thêm bản ghi phiên delivery-mirror không còn trả về bộ định vị bản ghi phiên.
  Caller nhận `messageId` đã thêm; tín hiệu cập nhật bản ghi phiên dùng phạm vi SQLite.
- Helper fork phiên cha chỉ trả về `sessionId` đã fork. Chuẩn bị subagent
  truyền phạm vi agent/phiên con cho engine.
- Tham số CLI runner và gieo lại lịch sử không còn chấp nhận bộ định vị bản ghi phiên.
  Việc đọc lịch sử CLI phân giải phạm vi bản ghi phiên SQLite từ `{agentId,
sessionId}` và ngữ cảnh khóa phiên.
- Fixture kiểm thử CLI và embedded-runner giờ gieo và đọc các hàng bản ghi phiên SQLite
  theo id phiên thay vì giả vờ phiên đang hoạt động là các tệp `*.jsonl` hoặc
  truyền chuỗi `sqlite-transcript://...` qua tham số runtime.
- Sự kiện guard kết quả công cụ phiên phát ra từ phạm vi phiên đã biết ngay cả khi
  trình quản lý trong bộ nhớ không có bộ định vị được suy ra. Kiểm thử của nó không còn giả lập các tệp
  bản ghi phiên `/tmp/*.jsonl` đang hoạt động.
- Helper BTW và compaction-checkpoint giờ đọc và fork các hàng bản ghi phiên theo
  phạm vi SQLite. Siêu dữ liệu checkpoint giờ chỉ lưu id phiên và id leaf/entry;
  bộ định vị được suy ra không còn được ghi vào payload checkpoint.
- Tra cứu transcript-key của Gateway dùng phạm vi bản ghi phiên SQLite tại biên giao thức
  và không còn realpath hoặc stat tên tệp bản ghi phiên.
- Xoay bản ghi phiên Compaction tự động ghi các hàng bản ghi phiên kế nhiệm
  trực tiếp qua kho bản ghi phiên SQLite. Hàng phiên chỉ giữ định danh phiên
  kế nhiệm, không phải đường dẫn JSONL bền vững hoặc bộ định vị đã lưu.
- Compaction context-engine nhúng dùng helper xoay bản ghi phiên được đặt tên theo SQLite.
  Kiểm thử xoay không còn dựng đường dẫn JSONL kế nhiệm hoặc mô hình hóa phiên đang hoạt động
  như tệp.
- Lưu giữ ảnh gửi đi được quản lý khóa cache thông điệp bản ghi phiên từ
  thống kê bản ghi phiên SQLite thay vì lệnh gọi stat hệ thống tệp.
- Khóa phiên runtime và lane doctor `.jsonl.lock` độc lập cũ
  đã bị loại bỏ.
- Barrel runtime Microsoft Teams và SDK Plugin công khai không còn tái xuất
  helper khóa tệp cũ; đường dẫn trạng thái Plugin bền vững được hậu thuẫn bởi SQLite.
- Cắt tỉa phiên theo tuổi/số lượng và dọn dẹp phiên rõ ràng đã bị loại bỏ.
  Doctor sở hữu import cũ; phiên cũ được reset hoặc xóa rõ ràng.
- Kiểm tra tính toàn vẹn của Doctor không còn tính tệp JSONL cũ là bản ghi phiên đang hoạt động
  hợp lệ cho hàng phiên SQLite. Sức khỏe bản ghi phiên đang hoạt động chỉ dựa trên SQLite;
  tệp JSONL cũ được báo cáo là đầu vào di chuyển/dọn dẹp mồ côi.
- Doctor không còn xem `agents/<agent>/sessions/` là trạng thái runtime bắt buộc.
  Nó chỉ quét thư mục đó khi thư mục đã tồn tại, như đầu vào import cũ
  hoặc dọn dẹp mồ côi.
- Gateway `sessions.resolve`, các đường dẫn patch/reset/compact phiên, tạo subagent,
  hủy nhanh, siêu dữ liệu ACP, phiên cô lập Heartbeat và vá TUI
  không còn di chuyển hoặc cắt tỉa khóa phiên cũ như tác dụng phụ của
  công việc runtime bình thường.
- Phân giải phiên lệnh CLI giờ trả về `agentId` sở hữu thay vì
  `storePath`, và nó không còn sao chép các hàng main-session cũ trong quá trình phân giải
  `--to` hoặc `--session-id` bình thường. Chuẩn hóa main-row cũ chỉ thuộc về
  doctor.
- Phân giải độ sâu subagent runtime không còn đọc `sessions.json` hoặc kho phiên JSON5.
  Nó đọc `session_entries` SQLite theo id agent, và siêu dữ liệu độ sâu/phiên cũ
  chỉ có thể đi vào qua đường import doctor.
- Ghi đè phiên hồ sơ auth được lưu bền qua upsert hàng trực tiếp `{agentId, sessionKey}`
  thay vì lazy-load runtime kho phiên dạng tệp.
- Cổng verbose auto-reply và helper cập nhật phiên giờ đọc/upsert các hàng phiên SQLite
  theo định danh phiên và không còn yêu cầu đường dẫn kho cũ
  trước khi chạm vào trạng thái hàng đã lưu bền.
- Helper siêu dữ liệu phiên command-run giờ dùng tên và đường dẫn module hướng entry;
  bề mặt helper lệnh `session-store` cũ đã bị loại bỏ.
- Gieo header bootstrap và tăng cứng ranh giới Compaction thủ công giờ sửa đổi
  trực tiếp các hàng bản ghi phiên SQLite. Caller runtime truyền định danh phiên, không phải
  đường dẫn `.jsonl` có thể ghi.
- Phát lại xoay phiên im lặng sao chép các lượt người dùng/assistant gần đây theo
  `{agentId, sessionId}` từ các hàng bản ghi phiên SQLite. Nó không còn chấp nhận
  bộ định vị bản ghi phiên nguồn hoặc đích.
- Hàng phiên runtime mới không còn lưu bộ định vị bản ghi phiên. Caller dùng
  `{agentId, sessionId}` trực tiếp; lệnh xuất/gỡ lỗi có thể chọn tên tệp đầu ra
  khi chúng hiện thực hóa các hàng.
- Bắt đầu một phiên bản ghi phiên đã lưu bền mới giờ luôn mở các hàng SQLite theo
  phạm vi. Session manager không còn tái sử dụng đường dẫn hoặc bộ định vị bản ghi phiên
  thời tệp trước đó làm định danh cho phiên mới.
- Phiên bản ghi phiên đã lưu bền dùng API rõ ràng
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Các facade tĩnh cũ
  `SessionManager.create/openForSession/list/forkFromSession` đã biến mất để
  kiểm thử và mã runtime không thể vô tình tái tạo khám phá phiên thời tệp.
- Runtime Plugin không còn phơi bày `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  mã Plugin dùng helper hàng SQLite và giá trị phạm vi.
- Bề mặt SDK `session-store-runtime` công khai giờ chỉ xuất helper hàng phiên
  và hàng bản ghi phiên. Helper SQLite tập trung cho schema/đường dẫn/giao dịch
  nằm trong `sqlite-runtime`; helper mở/đóng/reset thô vẫn chỉ cục bộ cho
  kiểm thử first-party.
- Bộ phân loại tên tệp trajectory/checkpoint `.jsonl` cũ giờ nằm trong
  module tệp phiên cũ của doctor. Xác thực phiên lõi không còn import
  helper tạo tác tệp để quyết định id phiên SQLite bình thường.
- Các lượt chạy subagent chặn active-memory dùng hàng bản ghi phiên SQLite thay vì
  tạo các tệp `session.jsonl` tạm thời hoặc đã lưu bền dưới trạng thái Plugin. Tùy chọn
  `transcriptDir` cũ bị loại bỏ.
- Tạo slug một lần và các lượt chạy bộ lập kế hoạch Crestodian dùng các hàng bản ghi phiên SQLite
  thay vì tạo tệp `session.jsonl` tạm thời.
- Các lượt chạy helper `llm-task` và trích xuất cam kết ẩn cũng dùng các hàng
  bản ghi phiên SQLite, nên các phiên helper chỉ dành cho mô hình này không còn tạo
  tệp bản ghi phiên JSON/JSONL tạm thời.
- `TranscriptSessionManager` giờ chỉ là một phạm vi bản ghi phiên SQLite đã mở.
  Mã runtime mở nó bằng `openTranscriptSessionManagerForSession({agentId,
sessionId})`; các luồng tạo, nhánh, tiếp tục, liệt kê và fork nằm trong
  helper hàng SQLite sở hữu chúng thay vì facade manager tĩnh.
  Mã doctor/import/debug xử lý các tệp nguồn cũ rõ ràng bên ngoài
  session manager runtime.
- Các phương thức facade cũ `SessionManager.newSession()` và
  `SessionManager.createBranchedSession()` đã bị loại bỏ. Phiên mới
  và hậu duệ bản ghi phiên được tạo bởi workflow SQLite sở hữu chúng
  thay vì sửa đổi một manager đã mở thành một phiên đã lưu bền khác.
- Quyết định fork bản ghi phiên cha và tạo fork không còn chấp nhận
  `storePath` hoặc `sessionsDir`; chúng dùng phạm vi bản ghi phiên SQLite
  `{agentId, sessionId}` thay vì siêu dữ liệu đường dẫn hệ thống tệp được giữ lại.
- Memory-host không còn xuất helper phân loại bản ghi phiên thư mục phiên no-op;
  việc lọc bản ghi phiên giờ được suy ra từ siêu dữ liệu hàng SQLite trong quá trình dựng entry.
- Kiểm thử xuất phiên Memory-host và QMD dùng phạm vi bản ghi phiên SQLite. Các đường dẫn
  `agents/<agentId>/sessions/*.jsonl` cũ chỉ còn được bao phủ khi kiểm thử
  cố ý chứng minh khả năng tương thích doctor/import/export.
- Kiểm tra phiên thô QA-lab giờ dùng `sessions.list` qua gateway
  thay vì đọc `agents/qa/sessions/sessions.json`; phản hồi MSteams
  được thêm trực tiếp vào bản ghi SQLite mà không tạo giả một đường dẫn JSONL.
- Các lượt kênh đến dùng chung giờ mang `{agentId, sessionKey}` thay vì
  `storePath` cũ. Các đường dẫn ghi của LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch và QQBot giờ đọc siêu dữ liệu updated-at và ghi
  các hàng phiên đến thông qua định danh SQLite.
- Tính bền vững của bộ định vị bản ghi được loại bỏ khỏi các hàng phiên đang hoạt động.
  `resolveSessionTranscriptTarget` trả về `agentId`, `sessionId` và siêu dữ liệu
  chủ đề tùy chọn; doctor là mã duy nhất nhập các tên tệp bản ghi cũ.
- Tiêu đề bản ghi runtime bắt đầu ở phiên bản SQLite `1`. Các bản nâng cấp
  dạng JSONL V1/V2/V3 cũ chỉ nằm trong nhập doctor và chuẩn hóa các tiêu đề đã nhập về
  phiên bản bản ghi SQLite hiện tại trước khi các hàng được lưu.
- Bộ chặn ưu tiên cơ sở dữ liệu giờ cấm `SessionManager.listAll` và
  `SessionManager.forkFromSession`; các quy trình liệt kê phiên và fork/khôi phục
  phải tiếp tục dùng API SQLite theo hàng/phạm vi.
- Bộ chặn cũng cấm các tên helper phân tích JSONL bản ghi cũ/sửa nhánh hoạt động
  bên ngoài mã doctor/import, để runtime không thể phát triển một đường dẫn di trú
  bản ghi cũ thứ hai.
- Các lần chạy PI nhúng từ chối handle bản ghi đến. Chúng dùng định danh SQLite
  `{agentId, sessionId}` trước khi khởi chạy worker và một lần nữa trước khi
  lần thử chạm vào trạng thái bản ghi. Đầu vào `/tmp/*.jsonl` cũ không thể chọn
  mục tiêu ghi runtime.
- Các bản ghi dấu vết cache, payload Anthropic, luồng thô và timeline chẩn đoán
  giờ ghi vào các hàng SQLite có kiểu `diagnostic_events`. Các gói ổn định Gateway
  giờ ghi vào các hàng SQLite có kiểu `diagnostic_stability_bundles`. Các đường dẫn
  ghi đè JSONL cũ `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` và
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` đã bị loại bỏ, và việc ghi ổn định thông thường
  không còn ghi các tệp `logs/stability/*.json`.
- Tính bền vững Cron giờ đối chiếu các hàng SQLite `cron_jobs` thay vì
  xóa/chèn lại toàn bộ bảng job ở mỗi lần lưu. Các lần ghi ngược mục tiêu Plugin
  cập nhật trực tiếp các hàng cron khớp và giữ trạng thái cron runtime trong
  cùng giao dịch cơ sở dữ liệu trạng thái.
- Các caller runtime Cron giờ dùng một khóa kho cron SQLite ổn định. Các đường dẫn
  `cron.store` cũ chỉ là đầu vào nhập doctor; các đường dẫn production gateway,
  bảo trì tác vụ, trạng thái, run-log và ghi ngược mục tiêu Telegram dùng
  `resolveCronStoreKey` và không còn chuẩn hóa đường dẫn cho khóa. Trạng thái Cron giờ
  báo cáo `storeKey` thay vì trường dạng tệp cũ `storePath`.
- Tải và lập lịch runtime Cron không còn chuẩn hóa các dạng job được lưu cũ
  như `jobId`, `schedule.cron`, `atMs` dạng số, boolean dạng chuỗi hoặc
  thiếu `sessionTarget`. Nhập cũ của doctor sở hữu các sửa chữa đó trước khi
  các hàng được chèn vào SQLite.
- ACP spawn không còn phân giải hoặc lưu bền vững các đường dẫn tệp JSONL bản ghi.
  Thiết lập spawn và thread-bind lưu bền vững trực tiếp hàng phiên SQLite và giữ
  session id làm định danh bản ghi được giữ lại.
- Các API siêu dữ liệu phiên ACP giờ đọc/liệt kê/upsert các hàng SQLite theo `agentId` và
  không còn để lộ `storePath` như một phần của hợp đồng mục nhập phiên ACP.
- Kế toán mức sử dụng phiên và tổng hợp mức sử dụng Gateway giờ chỉ phân giải bản ghi
  theo `{agentId, sessionId}`. Cache chi phí/mức sử dụng và các tóm tắt phiên được phát hiện
  không còn tổng hợp hoặc trả về chuỗi bộ định vị bản ghi.
- Gateway chat append, lưu bền vững abort-partial, `/sessions.send` và
  các lần ghi bản ghi phương tiện webchat thêm trực tiếp thông qua phạm vi bản ghi SQLite.
  Helper transcript-injection của gateway không còn chấp nhận tham số
  `transcriptLocator`.
- Khám phá bản ghi SQLite giờ chỉ liệt kê phạm vi và thống kê bản ghi:
  `{agentId, sessionId, updatedAt, eventCount}`. Helper tương thích
  `listSqliteSessionTranscriptLocators` đã chết và trường `locator` theo hàng
  đã bị loại bỏ.
- Runtime sửa bản ghi giờ chỉ để lộ
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Helper sửa dựa trên
  locator cũ đã bị xóa; mã doctor/debug đọc các đường dẫn tệp nguồn tường minh
  và không bao giờ di trú chuỗi locator.
- Runtime sổ cái phát lại ACP giờ lưu các hàng phát lại theo phiên trong cơ sở dữ liệu
  trạng thái SQLite dùng chung thay vì `acp/event-ledger.json`; doctor nhập và
  loại bỏ tệp cũ.
- Các helper đọc bản ghi Gateway giờ nằm trong
  `src/gateway/session-transcript-readers.ts` thay vì tên mô-đun cũ
  `session-utils.fs`. Kiểm tra lịch sử thử lại fallback được đặt tên theo
  nội dung bản ghi SQLite thay vì bề mặt helper tệp cũ.
- Các helper injected-chat và compaction của Gateway giờ truyền phạm vi bản ghi SQLite
  qua các API helper nội bộ thay vì đặt tên giá trị là đường dẫn bản ghi hoặc
  tệp nguồn.
- Phát hiện tiếp tục bootstrap giờ kiểm tra các hàng bản ghi SQLite thông qua
  `hasCompletedBootstrapTranscriptTurn`; nó không còn để lộ tên helper dạng tệp.
- Các kiểm thử embedded-runner giờ dùng định danh bản ghi SQLite, và việc mở
  trình quản lý bản ghi mới luôn yêu cầu `sessionId` tường minh.
- Các helper lập chỉ mục bộ nhớ giờ dùng thuật ngữ bản ghi SQLite xuyên suốt:
  host xuất `listSessionTranscriptScopesForAgent` và
  `sessionTranscriptKeyForScope`, hàng đợi đồng bộ có mục tiêu là `sessionTranscripts`,
  các hit tìm kiếm phiên công khai để lộ đường dẫn mờ `transcript:<agent>:<session>`,
  và khóa nguồn DB nội bộ là `session:<session>` dưới
  `source_kind='sessions'` thay vì đường dẫn tệp giả.
- Helper persistent-dedupe chung của Plugin SDK không còn để lộ tùy chọn dạng tệp.
  Caller cung cấp khóa phạm vi SQLite và các hàng dedupe bền vững nằm trong
  trạng thái plugin dùng chung.
- Token SSO Microsoft Teams đã chuyển từ các tệp JSON bị khóa sang trạng thái plugin
  SQLite. Doctor nhập `msteams-sso-tokens.json`, dựng lại các khóa token SSO chuẩn tắc
  từ payload và loại bỏ tệp nguồn. Token OAuth được ủy quyền vẫn ở ranh giới
  tệp thông tin xác thực riêng hiện có của chúng.
- Trạng thái cache đồng bộ Matrix đã chuyển từ `bot-storage.json` sang trạng thái plugin
  SQLite. Doctor nhập các payload đồng bộ thô hoặc được bọc cũ và loại bỏ
  tệp nguồn. Các client Matrix và QA Matrix đang hoạt động truyền một thư mục gốc
  sync-store SQLite, không phải đường dẫn giả `sync-store.json` hoặc `bot-storage.json`.
- Trạng thái di trú crypto cũ của Matrix đã chuyển từ
  `legacy-crypto-migration.json` sang trạng thái plugin SQLite. Doctor nhập
  tệp trạng thái cũ; snapshot IndexedDB của Matrix SDK đã chuyển từ
  `crypto-idb-snapshot.json` sang blob plugin SQLite. Khóa khôi phục và
  thông tin xác thực Matrix là các hàng trạng thái plugin SQLite; các tệp JSON cũ
  của chúng chỉ là đầu vào di trú doctor.
- Nhật ký hoạt động Memory Wiki giờ dùng trạng thái plugin SQLite thay vì
  `.openclaw-wiki/log.jsonl`. Nhà cung cấp di trú Memory Wiki nhập nhật ký JSONL cũ;
  markdown wiki và nội dung vault của người dùng vẫn được tệp hậu thuẫn như
  nội dung workspace.
- Memory Wiki không còn tạo `.openclaw-wiki/state.json` hoặc thư mục
  `.openclaw-wiki/locks` không dùng nữa. Nhà cung cấp di trú loại bỏ các tệp
  siêu dữ liệu plugin đã ngừng dùng đó nếu một vault cũ vẫn có chúng.
- Các mục kiểm toán Crestodian giờ dùng trạng thái plugin SQLite lõi thay vì
  `audit/crestodian.jsonl`. Doctor nhập nhật ký kiểm toán JSONL cũ và
  loại bỏ nó sau khi nhập thành công.
- Các mục kiểm toán ghi/theo dõi cấu hình giờ dùng trạng thái plugin SQLite lõi
  thay vì `logs/config-audit.jsonl`. Doctor nhập nhật ký kiểm toán JSONL cũ và
  loại bỏ nó sau khi nhập thành công.
- Ứng dụng đồng hành macOS không còn ghi các sidecar cục bộ của ứng dụng `logs/config-audit.jsonl` hoặc
  `logs/config-health.json` trong khi chỉnh sửa `openclaw.json`. Tệp cấu hình
  vẫn được tệp hậu thuẫn, snapshot khôi phục ở cạnh tệp cấu hình,
  và trạng thái kiểm toán/sức khỏe cấu hình bền vững thuộc về kho SQLite của Gateway.
- Các phê duyệt đang chờ cứu hộ Crestodian giờ dùng trạng thái plugin SQLite lõi thay vì
  `crestodian/rescue-pending/*.json`. Doctor nhập các tệp phê duyệt đang chờ cũ
  và loại bỏ chúng sau khi nhập thành công.
- Trạng thái arm tạm thời của Phone Control giờ dùng trạng thái plugin SQLite thay vì
  `plugins/phone-control/armed.json`. Doctor nhập tệp trạng thái arm cũ
  vào namespace `phone-control/arm-state` và loại bỏ tệp.
- Doctor không còn sửa bản ghi JSONL tại chỗ hoặc tạo tệp JSONL sao lưu.
  Nó nhập nhánh hoạt động vào SQLite và loại bỏ nguồn cũ.
- Tra cứu bản ghi hook session-memory dùng các lần đọc SQLite chỉ theo phạm vi
  `{agentId, sessionId}`. Helper của nó không còn chấp nhận hoặc suy ra bộ định vị bản ghi,
  đọc tệp cũ, hoặc tùy chọn ghi lại tệp.
- Các binding hội thoại app-server Codex giờ khóa trạng thái plugin SQLite theo
  khóa phiên OpenClaw hoặc phạm vi `{agentId, sessionId}` tường minh. Chúng không được
  giữ lại binding fallback đường dẫn bản ghi.
- Các lần đọc mirrored-history của app-server Codex chỉ dùng phạm vi bản ghi SQLite;
  chúng không được khôi phục định danh từ đường dẫn tệp bản ghi.
- Các đường dẫn sắp xếp vai trò và đặt lại compaction không còn unlink các tệp
  bản ghi cũ; đặt lại chỉ xoay hàng phiên SQLite và định danh bản ghi.
- Các phản hồi đặt lại và checkpoint của Gateway trả về các hàng phiên sạch cộng với session
  id. Chúng không còn tổng hợp bộ định vị bản ghi SQLite cho client.
- Dreaming của memory-core không còn cắt tỉa hàng phiên bằng cách thăm dò các tệp
  JSONL bị thiếu. Dọn dẹp subagent đi qua API runtime phiên thay vì
  kiểm tra sự tồn tại trên hệ thống tệp. Các kiểm thử transcript-ingestion của nó seed trực tiếp
  các hàng SQLite thay vì tạo fixture `agents/<id>/sessions` hoặc placeholder
  locator.
- Lập chỉ mục bản ghi bộ nhớ có thể để lộ `transcript:<agentId>:<sessionId>` như một
  đường dẫn hit tìm kiếm ảo cho helper trích dẫn/đọc. Nguồn chỉ mục bền vững là
  quan hệ (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), vì vậy giá trị này không phải là bộ định vị bản ghi runtime,
  không phải đường dẫn hệ thống tệp, và tuyệt đối không được truyền ngược vào API runtime phiên.
- Trạng thái bộ nhớ doctor Gateway đọc số lượng short-term recall và phase-signal
  từ các hàng trạng thái plugin SQLite thay vì `memory/.dreams/*.json`; đầu ra CLI và
  doctor giờ gắn nhãn bộ lưu trữ đó là kho SQLite, không phải đường dẫn.
- Runtime memory-core, trạng thái CLI, phương thức doctor Gateway và facade Plugin SDK
  không còn kiểm toán hoặc lưu trữ các tệp `.dreams/session-corpus` cũ.
  Các tệp đó chỉ là đầu vào di trú; doctor nhập chúng vào SQLite và
  xóa nguồn sau khi xác minh. Các hàng bằng chứng session-ingestion đang hoạt động
  giờ dùng đường dẫn SQLite ảo `memory/session-ingestion/<day>.txt`; runtime
  không bao giờ ghi hoặc suy ra trạng thái từ `.dreams/session-corpus`.
- Hiện vật công khai memory-core để lộ sự kiện host SQLite dưới dạng hiện vật JSON ảo
  `memory/events/memory-host-events.json`; chúng không còn tái sử dụng
  đường dẫn nguồn `.dreams/events.jsonl` cũ.
- Các registry sandbox container/browser giờ dùng bảng SQLite dùng chung
  `sandbox_registry_entries` với các cột phiên, image, timestamp,
  backend/config và cổng browser có kiểu. Doctor nhập các tệp registry JSON nguyên khối và
  chia mảnh cũ rồi loại bỏ các nguồn thành công. Các lần đọc runtime dùng
  các cột hàng có kiểu làm nguồn sự thật; `entry_json` chỉ là bản sao phát lại/debug.
- Commitments giờ dùng bảng dùng chung có kiểu `commitments` thay vì
  blob JSON toàn kho. Lưu snapshot upsert theo commitment id và chỉ xóa
  các hàng bị thiếu thay vì xóa sạch rồi chèn lại bảng. Runtime tải
  commitments từ các cột phạm vi, cửa sổ phân phối, trạng thái, lần thử và văn bản
  có kiểu; `record_json` chỉ là bản sao phát lại/debug. Doctor nhập
  `commitments.json` cũ và loại bỏ nó sau khi nhập thành công.
- Định nghĩa job Cron, trạng thái lịch và lịch sử chạy không còn có writer hoặc reader JSON
  trong runtime. Runtime dùng các hàng `cron_jobs` với lịch có kiểu,
  payload, phân phối, cảnh báo lỗi, phiên, trạng thái, và các cột trạng thái runtime cùng siêu dữ liệu
  `cron_run_logs` có kiểu cho trạng thái, tóm tắt chẩn đoán, trạng thái/lỗi phân phối,
  phiên/lần chạy, mô hình, và tổng số token. `job_json` chỉ là bản sao phát lại/gỡ lỗi; `state_json` giữ các chẩn đoán
  runtime lồng nhau chưa có trường truy vấn nóng, trong khi runtime
  tái nạp các trường trạng thái nóng từ các cột có kiểu. Doctor nhập
  các tệp `jobs.json`, `jobs-state.json`, và `runs/*.jsonl` cũ rồi xóa
  các nguồn đã nhập. Các thao tác ghi ngược đích Plugin cập nhật các hàng `cron_jobs`
  khớp thay vì tải và thay thế toàn bộ kho cron.
- Khởi động Gateway bỏ qua các dấu `notify: true` cũ trong phép chiếu runtime. Doctor chuyển chúng thành phân phối SQLite rõ ràng khi
  `cron.webhook` hợp lệ, xóa các dấu không hoạt động khi chưa đặt, và giữ lại
  chúng cùng cảnh báo khi webhook đã cấu hình không hợp lệ.
- Các hàng đợi phân phối đi và phân phối phiên hiện lưu trạng thái hàng đợi, loại mục,
  khóa phiên, kênh, đích, id tài khoản, số lần thử lại, lần thử/lỗi gần nhất,
  trạng thái khôi phục, và các dấu gửi theo nền tảng dưới dạng cột có kiểu trong bảng dùng chung
  `delivery_queue_entries`. Khôi phục runtime đọc các trường nóng đó từ
  các cột có kiểu, và các đột biến thử lại/khôi phục cập nhật trực tiếp các cột đó
  mà không ghi lại JSON phát lại. Payload JSON đầy đủ chỉ còn là blob
  phát lại/gỡ lỗi cho thân thông điệp và dữ liệu phát lại lạnh khác.
- Các bản ghi ảnh gửi đi được quản lý hiện dùng các hàng dùng chung có kiểu
  `managed_outgoing_image_records`, còn byte phương tiện vẫn được lưu trong
  `media_blobs`. Bản ghi JSON chỉ còn là bản sao phát lại/gỡ lỗi.
- Tùy chọn bộ chọn mô hình của Discord, hash triển khai lệnh, và liên kết luồng
  hiện dùng trạng thái Plugin SQLite dùng chung. Các kế hoạch nhập JSON cũ của chúng nằm trong
  bề mặt thiết lập/di trú doctor của Plugin Discord, không nằm trong mã di trú lõi.
- Bộ phát hiện nhập cũ của Plugin dùng các mô-đun được đặt tên theo doctor như
  `doctor-legacy-state.ts` hoặc `doctor-state-imports.ts`; các mô-đun runtime kênh thông thường
  không được nhập bộ phát hiện JSON cũ.
- Con trỏ bắt kịp và dấu chống trùng lặp đầu vào của BlueBubbles hiện dùng trạng thái Plugin SQLite
  dùng chung. Các kế hoạch nhập JSON cũ của chúng nằm trong bề mặt thiết lập/di trú doctor của Plugin BlueBubbles, không nằm trong mã di trú lõi.
- Offset cập nhật Telegram, hàng bộ nhớ đệm sticker, hàng bộ nhớ đệm thông điệp đã gửi,
  hàng bộ nhớ đệm tên chủ đề, và liên kết luồng hiện dùng trạng thái Plugin SQLite dùng chung.
  Các kế hoạch nhập JSON cũ của chúng nằm trong bề mặt thiết lập/di trú doctor của Plugin Telegram, không nằm trong mã di trú lõi.
- Con trỏ bắt kịp iMessage, ánh xạ short-id trả lời, và hàng chống trùng lặp sent-echo
  hiện dùng trạng thái Plugin SQLite dùng chung. Các tệp cũ `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, và `imessage/sent-echoes.jsonl`
  chỉ là đầu vào doctor.
- Các hàng chống trùng lặp thông điệp Feishu hiện dùng trạng thái Plugin SQLite dùng chung thay vì
  các tệp `feishu/dedup/*.json`. Kế hoạch nhập JSON cũ của nó nằm trong bề mặt thiết lập/di trú doctor của Plugin Feishu, không nằm trong mã di trú lõi.
- Hội thoại, cuộc thăm dò, bộ đệm tải lên đang chờ, và dữ liệu học từ phản hồi của Microsoft Teams
  hiện dùng các bảng trạng thái/blob Plugin SQLite dùng chung. Đường dẫn tải lên đang chờ
  dùng `plugin_blob_entries` để bộ đệm phương tiện được lưu dưới dạng SQLite BLOB
  thay vì JSON base64. Tên helper runtime hiện dùng cách đặt tên SQLite/trạng thái
  thay vì cách đặt tên kho tệp `*-fs`, và shim `storePath` cũ đã bị xóa
  khỏi các kho này. Kế hoạch nhập JSON cũ của nó nằm trong bề mặt thiết lập/di trú doctor của Plugin Microsoft Teams.
- Phương tiện gửi đi được lưu trữ của Zalo hiện dùng SQLite dùng chung `plugin_blob_entries`
  thay vì các sidecar tạm JSON/bin `openclaw-zalo-outbound-media`.
- HTML trình xem diff và siêu dữ liệu hiện dùng SQLite dùng chung `plugin_blob_entries`
  thay vì các tệp tạm `meta.json`/`viewer.html`. Các đầu ra PNG/PDF đã render vẫn là
  các bản vật chất hóa tạm vì phân phối kênh vẫn cần đường dẫn tệp.
- Tài liệu được quản lý của Canvas hiện dùng SQLite dùng chung `plugin_blob_entries` thay
  vì thư mục mặc định `state/canvas/documents`. Máy chủ Canvas phục vụ trực tiếp các blob đó; tệp cục bộ chỉ được tạo cho nội dung toán tử `host.root`
  rõ ràng hoặc vật chất hóa tạm thời khi trình đọc phương tiện hạ nguồn
  yêu cầu đường dẫn.
- Quyết định kiểm toán File Transfer hiện dùng SQLite dùng chung `plugin_state_entries`
  thay vì log runtime không giới hạn `audit/file-transfer.jsonl`. Doctor
  nhập tệp kiểm toán JSONL cũ vào trạng thái Plugin và xóa nguồn
  sau khi nhập sạch.
- Lease tiến trình ACPX và danh tính phiên bản Gateway hiện dùng trạng thái Plugin SQLite dùng chung. Doctor nhập tệp `gateway-instance-id` cũ vào trạng thái Plugin
  và xóa nguồn.
- Các script wrapper do ACPX tạo và Codex home cô lập là vật chất hóa tạm
  dưới gốc tạm OpenClaw, không phải trạng thái OpenClaw bền vững. Các
  bản ghi runtime ACPX bền vững là các hàng lease SQLite và gateway-instance;
  bề mặt cấu hình ACPX `stateDir` cũ bị xóa vì không còn trạng thái runtime nào
  được ghi ở đó.
- Tệp đính kèm phương tiện của Gateway hiện dùng bảng SQLite dùng chung `media_blobs` làm
  kho byte chuẩn. Các đường dẫn cục bộ trả về cho kênh và bề mặt tương thích sandbox
  là vật chất hóa tạm của hàng cơ sở dữ liệu, không phải kho phương tiện bền vững. Danh sách cho phép phương tiện runtime không còn bao gồm
  các gốc cũ `$OPENCLAW_STATE_DIR/media` hoặc `media` trong thư mục cấu hình; các thư mục đó chỉ là
  nguồn nhập doctor.
- Hoàn thành shell không còn ghi các tệp bộ nhớ đệm `$OPENCLAW_STATE_DIR/completions/*`.
  Các đường dẫn smoke cài đặt, doctor, cập nhật, và phát hành dùng đầu ra hoàn thành
  được tạo hoặc sourcing hồ sơ thay vì các tệp bộ nhớ đệm hoàn thành bền vững.
- Staging tải lên Skills của Gateway hiện dùng các hàng dùng chung `skill_uploads`. Siêu dữ liệu
  tải lên, khóa idempotency, và byte archive nằm trong SQLite; trình cài đặt
  chỉ nhận đường dẫn archive được vật chất hóa tạm thời khi một lượt cài đặt đang
  chạy.
- Tệp đính kèm nội tuyến của subagent không còn được vật chất hóa dưới
  `.openclaw/attachments/*` của workspace. Đường dẫn spawn chuẩn bị các mục seed SQLite VFS,
  các lượt chạy nội tuyến seed các mục đó vào namespace scratch runtime theo agent,
  và công cụ dựa trên đĩa overlay scratch SQLite đó cho đường dẫn tệp đính kèm. Các cột registry attachment-dir của subagent-run và hook dọn dẹp cũ đã bị xóa.
- Hydration ảnh CLI không còn duy trì các tệp bộ nhớ đệm ổn định `openclaw-cli-images`.
  Backend CLI bên ngoài vẫn nhận đường dẫn tệp, nhưng các đường dẫn đó là
  vật chất hóa tạm theo từng lượt chạy kèm dọn dẹp.
- Chẩn đoán cache-trace, chẩn đoán payload Anthropic, chẩn đoán stream mô hình thô,
  sự kiện dòng thời gian chẩn đoán, và gói ổn định Gateway hiện
  ghi hàng SQLite thay vì các tệp `logs/*.jsonl` hoặc
  `logs/stability/*.json`.
  Các cờ ghi đè đường dẫn runtime và biến môi trường đã bị xóa; các lệnh xuất/gỡ lỗi
  có thể vật chất hóa tệp rõ ràng từ các hàng cơ sở dữ liệu.
- Ứng dụng đồng hành macOS không còn có writer `diagnostics.jsonl` cuộn. Log ứng dụng
  đi vào unified logging, và chẩn đoán Gateway bền vững vẫn dựa trên SQLite.
- Danh sách bản ghi port-guardian của macOS hiện dùng các hàng SQLite dùng chung có kiểu
  `macos_port_guardian_records` thay vì tệp JSON Application Support
  hoặc blob singleton mờ.
- Khóa singleton Gateway hiện dùng các hàng SQLite dùng chung có kiểu `state_leases` dưới
  phạm vi `gateway_locks` thay vì các tệp khóa trong thư mục tạm. Tài liệu khắc phục sự cố Fly và OAuth
  hiện trỏ tới lease SQLite/khóa làm mới auth thay vì thao tác dọn dẹp khóa tệp đã lỗi thời.
- Trạng thái sentinel khởi động lại Gateway hiện dùng các hàng SQLite dùng chung có kiểu
  `gateway_restart_sentinel` thay vì `restart-sentinel.json`; runtime
  đọc loại sentinel, trạng thái, định tuyến, thông điệp, tiếp tục, và thống kê từ
  các cột có kiểu. `payload_json` chỉ là bản sao phát lại/gỡ lỗi. Mã runtime xóa
  trực tiếp hàng SQLite và không còn mang theo hệ thống dọn dẹp tệp.
- Ý định khởi động lại Gateway và trạng thái bàn giao supervisor hiện dùng các hàng SQLite dùng chung có kiểu
  `gateway_restart_intent` và `gateway_restart_handoff` thay vì
  các sidecar `gateway-restart-intent.json` và
  `gateway-supervisor-restart-handoff.json`.
- Điều phối singleton Gateway hiện dùng các hàng có kiểu `state_leases` dưới
  `gateway_locks` thay vì ghi các tệp `gateway.<hash>.lock`. Hàng lease
  sở hữu chủ khóa, thời điểm hết hạn, Heartbeat, và payload gỡ lỗi; SQLite sở hữu
  ranh giới acquire/release nguyên tử. Tùy chọn thư mục khóa tệp đã nghỉ hưu
  không còn; các bài kiểm thử dùng trực tiếp danh tính hàng SQLite.
- Helper báo cáo sử dụng cron cũ không còn được tham chiếu, vốn quét các tệp `cron/runs/*.jsonl`,
  đã bị xóa. Báo cáo lịch sử lượt chạy Cron nên đọc các hàng SQLite có kiểu
  `cron_run_logs`.
- Khôi phục khởi động lại phiên chính hiện phát hiện agent ứng viên thông qua
  registry SQLite `agent_databases` thay vì quét các thư mục `agents/*/sessions`.
- Khôi phục lỗi hỏng phiên Gemini hiện chỉ xóa hàng phiên SQLite;
  nó không còn cần cổng `storePath` cũ hoặc cố unlink đường dẫn
  JSONL transcript dẫn xuất.
- Xử lý ghi đè đường dẫn hiện xem các giá trị môi trường literal `undefined`/`null`
  là chưa đặt, ngăn cơ sở dữ liệu repo-root `undefined/state/*.sqlite`
  bị tạo vô tình trong kiểm thử hoặc bàn giao shell.
- Dấu vân tay sức khỏe cấu hình hiện dùng các hàng SQLite dùng chung có kiểu `config_health_entries`
  thay vì `logs/config-health.json`, giữ tệp cấu hình thông thường làm
  tài liệu cấu hình không phải thông tin xác thực duy nhất. Ứng dụng đồng hành macOS chỉ giữ
  trạng thái sức khỏe cục bộ theo tiến trình và không tạo lại sidecar JSON cũ.
- Runtime hồ sơ auth không còn nhập hoặc ghi tệp JSON thông tin xác thực. Kho
  thông tin xác thực chuẩn là SQLite; `auth-profiles.json`, `auth.json` theo agent,
  và `credentials/oauth.json` dùng chung là đầu vào di trú doctor
  được xóa sau khi nhập.
- Kiểm thử lưu/trạng thái hồ sơ auth hiện assert trực tiếp các bảng auth SQLite có kiểu
  và chỉ dùng tên tệp auth-profile cũ cho đầu vào di trú doctor.
- `openclaw secrets apply` chỉ scrub tệp cấu hình, tệp env, và kho hồ sơ auth SQLite.
  Nó không còn mang logic tương thích chỉnh sửa `auth.json` theo agent đã nghỉ hưu; doctor sở hữu việc nhập và xóa tệp đó.
- Các kế hoạch di trú bí mật Hermes và thao tác áp dụng nhập trực tiếp các hồ sơ API-key
  vào kho hồ sơ auth SQLite. Nó không còn ghi hoặc xác minh
  `auth-profiles.json` như một đích trung gian.
- Tài liệu auth hướng người dùng hiện mô tả
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` thay vì
  bảo người dùng kiểm tra hoặc sao chép `auth-profiles.json`; tên JSON OAuth/auth cũ
  chỉ còn được ghi tài liệu như đầu vào nhập doctor.
- Helper đường dẫn trạng thái lõi không còn phơi bày tệp `credentials/oauth.json`
  đã nghỉ hưu. Tên tệp cũ chỉ cục bộ trong đường dẫn nhập auth doctor.
- Tài liệu cài đặt, bảo mật, onboarding, auth mô hình, và SecretRef hiện mô tả
  các hàng hồ sơ auth SQLite và sao lưu/di trú toàn bộ trạng thái thay vì
  các tệp JSON hồ sơ auth theo agent.
- Khám phá mô hình PI hiện truyền thông tin xác thực chuẩn vào bộ lưu trữ auth
  `pi-coding-agent` trong bộ nhớ. Nó không còn tạo, scrub, hoặc ghi
  `auth.json` theo agent trong quá trình khám phá.
- Thiết lập kích hoạt và định tuyến Voice Wake hiện dùng các bảng SQLite dùng chung có kiểu
  thay vì `settings/voicewake.json`, `settings/voicewake-routing.json`, hoặc
  các hàng generic mờ; doctor nhập các tệp JSON cũ và xóa chúng sau khi
  di trú thành công.
- Trạng thái kiểm tra cập nhật hiện dùng một hàng dùng chung có kiểu `update_check_state` thay vì
  `update-check.json` hoặc một blob generic mờ; doctor nhập
  tệp JSON cũ và xóa nó sau khi di trú thành công.
- Trạng thái sức khỏe cấu hình hiện dùng các hàng dùng chung có kiểu `config_health_entries` thay vì
  `logs/config-health.json` hoặc một blob generic mờ; doctor
  nhập tệp JSON cũ và xóa nó sau khi di trú thành công.
- Phê duyệt liên kết hội thoại Plugin hiện dùng các hàng có kiểu
  `plugin_binding_approvals` thay vì trạng thái SQLite dùng chung mờ hoặc
  `plugin-binding-approvals.json`; tệp cũ là đầu vào di chuyển của doctor.
- Các ràng buộc cuộc trò chuyện hiện tại dùng chung giờ lưu các hàng
  `current_conversation_bindings` có kiểu thay vì ghi lại
  `bindings/current-conversations.json`; doctor nhập tệp JSON cũ và
  xóa tệp đó sau khi di chuyển thành công.
- Các sổ cái đồng bộ nguồn đã nhập của Memory Wiki giờ lưu một hàng trạng thái Plugin SQLite
  cho mỗi khóa vault/nguồn thay vì ghi lại `.openclaw-wiki/source-sync.json`;
  nhà cung cấp di chuyển nhập và xóa sổ cái JSON cũ.
- Các bản ghi lần chạy nhập ChatGPT của Memory Wiki giờ lưu một hàng trạng thái Plugin SQLite
  cho mỗi id vault/lần chạy thay vì ghi `.openclaw-wiki/import-runs/*.json`.
  Các ảnh chụp rollback vẫn là tệp vault rõ ràng cho đến khi việc lưu trữ ảnh chụp
  lần chạy nhập được chuyển vào kho blob.
- Các bản tóm tắt đã biên dịch của Memory Wiki giờ lưu các hàng blob Plugin SQLite thay vì
  ghi `.openclaw-wiki/cache/agent-digest.json` và
  `.openclaw-wiki/cache/claims.jsonl`. Nhà cung cấp di chuyển nhập các tệp bộ nhớ đệm cũ
  và xóa thư mục bộ nhớ đệm khi thư mục đó trống.
- Theo dõi cài đặt Skills của ClawHub giờ lưu một hàng trạng thái Plugin SQLite cho mỗi
  workspace/skill thay vì ghi hoặc đọc các sidecar `.clawhub/lock.json` và
  `.clawhub/origin.json` lúc chạy. Mã runtime dùng các đối tượng trạng thái
  cài đặt đã theo dõi thay vì các trừu tượng lockfile/origin dạng tệp. Doctor
  nhập các sidecar cũ từ các workspace tác nhân đã cấu hình và xóa chúng
  sau khi nhập sạch.
- Chỉ mục Plugin đã cài đặt giờ đọc và ghi hàng singleton SQLite dùng chung có kiểu
  `installed_plugin_index` thay vì `plugins/installs.json`; tệp JSON cũ
  chỉ là đầu vào di chuyển của doctor và bị xóa sau khi nhập.
- Trình trợ giúp đường dẫn `plugins/installs.json` cũ giờ nằm trong mã cũ của doctor.
  Các mô-đun chỉ mục Plugin runtime chỉ cung cấp các tùy chọn lưu bền
  dựa trên SQLite, không phải đường dẫn tệp JSON.
- Sentinel khởi động lại Gateway, ý định khởi động lại và trạng thái bàn giao supervisor giờ dùng
  các hàng SQLite dùng chung có kiểu (`gateway_restart_sentinel`,
  `gateway_restart_intent`, và `gateway_restart_handoff`) thay vì các blob mờ đục
  dùng chung. Mã khởi động lại runtime không có hợp đồng sentinel/intent/handoff
  dạng tệp.
- Bộ nhớ đệm đồng bộ Matrix, siêu dữ liệu lưu trữ, ràng buộc luồng, dấu khử trùng lặp inbound,
  trạng thái cooldown xác minh khởi động, ảnh chụp mã hóa SDK IndexedDB,
  thông tin đăng nhập và khóa khôi phục giờ dùng các bảng trạng thái/blob Plugin SQLite
  dùng chung. Các struct đường dẫn runtime không còn hiển thị đường dẫn siêu dữ liệu
  `storage-meta.json`; tên tệp đó chỉ là đầu vào di chuyển cũ. Kế hoạch nhập JSON cũ
  của chúng nằm trong bề mặt thiết lập/di chuyển doctor của Plugin Matrix.
- Khởi động Matrix không còn quét, báo cáo hoặc hoàn tất trạng thái tệp Matrix cũ.
  Phát hiện tệp Matrix, tạo ảnh chụp mã hóa cũ, trạng thái di chuyển khôi phục room-key,
  nhập và xóa nguồn đều do doctor sở hữu.
- Các barrel di chuyển runtime của Matrix đã bị xóa. Các trình trợ giúp phát hiện
  và sửa đổi trạng thái/mã hóa cũ được Matrix doctor nhập trực tiếp thay vì là
  một phần của bề mặt API runtime.
- Các dấu tái sử dụng ảnh chụp di chuyển Matrix giờ nằm trong trạng thái Plugin SQLite
  thay vì `matrix/migration-snapshot.json`; doctor vẫn có thể tái sử dụng cùng
  kho lưu trữ trước di chuyển đã xác minh mà không ghi tệp trạng thái sidecar.
- Con trỏ bus Nostr và trạng thái xuất bản hồ sơ giờ dùng trạng thái Plugin SQLite
  dùng chung. Kế hoạch nhập JSON cũ của chúng nằm trong bề mặt thiết lập/di chuyển doctor
  của Plugin Nostr.
- Các nút bật/tắt phiên Active Memory giờ dùng trạng thái Plugin SQLite dùng chung thay vì
  `session-toggles.json`; bật lại bộ nhớ sẽ xóa hàng thay vì
  ghi lại một đối tượng JSON.
- Các đề xuất Skill Workshop và bộ đếm đánh giá giờ dùng trạng thái Plugin SQLite dùng chung
  thay vì các kho `skill-workshop/<workspace>.json` theo workspace. Mỗi
  đề xuất là một hàng riêng dưới `skill-workshop/proposals`, và bộ đếm đánh giá
  là một hàng riêng dưới `skill-workshop/reviews`.
- Các lần chạy tác nhân con đánh giá Skill Workshop giờ dùng trình phân giải bản ghi phiên
  runtime thay vì tạo các đường dẫn phiên sidecar `skill-workshop/<sessionId>.json`.
- Các lease tiến trình ACPX giờ dùng trạng thái Plugin SQLite dùng chung dưới
  `acpx/process-leases` thay vì registry nguyên tệp `process-leases.json`.
  Mỗi lease được lưu dưới dạng hàng riêng, giữ nguyên việc dọn tiến trình cũ khi khởi động
  mà không có đường dẫn ghi lại JSON ở runtime.
- Các script wrapper ACPX và home Codex cô lập được tạo trong root tạm của
  OpenClaw. Chúng được tạo lại khi cần và không phải là đầu vào sao lưu hoặc
  di chuyển.
- Lưu bền registry lần chạy tác nhân con dùng các hàng dùng chung có kiểu `subagent_runs`.
  Đường dẫn `subagents/runs.json` cũ giờ chỉ là đầu vào di chuyển của doctor, và
  tên trình trợ giúp runtime không còn mô tả lớp trạng thái là dựa trên đĩa.
  Các bài kiểm thử runtime không còn tạo fixture `runs.json` không hợp lệ hoặc trống để chứng minh
  hành vi registry; chúng gieo/đọc các hàng SQLite trực tiếp.
- Sao lưu sẽ dựng thư mục trạng thái trước khi lưu trữ, sao chép các tệp không phải cơ sở dữ liệu,
  chụp nhanh cơ sở dữ liệu `*.sqlite` bằng `VACUUM INTO`, bỏ qua các sidecar WAL/SHM
  đang hoạt động, ghi siêu dữ liệu ảnh chụp vào manifest kho lưu trữ, và ghi
  các lần chạy sao lưu đã hoàn tất vào SQLite cùng manifest kho lưu trữ. `openclaw backup
create` xác thực kho lưu trữ đã ghi theo mặc định; `--no-verify` là đường dẫn nhanh
  rõ ràng.
- `openclaw backup restore` xác thực kho lưu trữ trước khi giải nén, tái sử dụng
  manifest đã chuẩn hóa của trình xác minh, và khôi phục các tài sản manifest đã xác minh về
  đường dẫn nguồn đã ghi. Lệnh yêu cầu `--yes` để ghi và hỗ trợ `--dry-run`
  cho kế hoạch khôi phục.
- Bộ lọc đường dẫn biến động sao lưu cũ đã bị xóa. Sao lưu không còn cần
  danh sách bỏ qua live-tar cho các tệp JSON/JSONL phiên hoặc cron cũ vì các ảnh chụp SQLite
  được dựng trước khi tạo kho lưu trữ.
- Chuẩn bị workspace thiết lập và onboarding thuần không còn tạo
  các thư mục `agents/<agentId>/sessions/`. Chúng chỉ tạo config/workspace;
  các hàng phiên SQLite và hàng bản ghi được tạo theo nhu cầu trong
  cơ sở dữ liệu theo tác nhân.
- Sửa quyền bảo mật giờ nhắm vào các cơ sở dữ liệu SQLite toàn cục và theo tác nhân
  cùng các sidecar WAL/SHM thay vì `sessions.json` và các tệp bản ghi
  JSONL.
- Tên runtime registry sandbox giờ mô tả trực tiếp các loại registry SQLite
  thay vì mang thuật ngữ registry JSON cũ qua kho đang hoạt động.
- `openclaw reset --scope config+creds+sessions` xóa các cơ sở dữ liệu
  `openclaw-agent.sqlite` theo tác nhân cùng các sidecar WAL/SHM, không chỉ các thư mục
  `sessions/` cũ.
- Các trình trợ giúp phiên tổng hợp Gateway giờ dùng tên hướng theo mục nhập:
  `loadCombinedSessionEntriesForGateway` trả về `{ databasePath, entries }`.
  Cách đặt tên combined-store cũ đã bị xóa khỏi các caller runtime.
- Gieo kênh Docker MCP giờ ghi hàng phiên chính và các sự kiện bản ghi
  vào cơ sở dữ liệu SQLite theo tác nhân thay vì tạo
  `sessions.json` và một bản ghi JSONL.
- Hook bộ nhớ phiên tích hợp giờ phân giải ngữ cảnh phiên trước đó từ
  SQLite theo `{agentId, sessionId}`. Nó không còn quét, lưu hoặc tổng hợp
  đường dẫn bản ghi hay thư mục `workspace/sessions`.
- Hook ghi log lệnh tích hợp giờ ghi các hàng kiểm toán lệnh vào bảng SQLite dùng chung
  `command_log_entries` thay vì nối thêm vào
  `logs/commands.log`.
- Allowlist ghép cặp kênh giờ chỉ hiển thị các trình trợ giúp đọc/ghi dựa trên SQLite
  ở runtime và trong Plugin SDK. Trình phân giải đường dẫn `*-allowFrom.json` cũ và
  trình đọc tệp chỉ nằm dưới mã nhập cũ của doctor.
- `migration_runs` ghi lại các lần thực thi di chuyển trạng thái cũ với trạng thái,
  dấu thời gian và báo cáo JSON.
- `migration_sources` ghi lại từng nguồn tệp cũ đã nhập với hash, kích thước,
  số bản ghi, bảng đích, id lần chạy, trạng thái và trạng thái xóa nguồn.
- `backup_runs` ghi lại đường dẫn kho lưu trữ sao lưu, trạng thái và manifest JSON.
- Schema toàn cục không giữ bảng registry `agents` không dùng đến. Phát hiện
  cơ sở dữ liệu tác nhân là registry `agent_databases` chuẩn cho đến khi runtime
  có một chủ sở hữu bản ghi tác nhân thật sự.
- Config danh mục mô hình đã tạo được lưu trong các hàng SQLite toàn cục có kiểu
  `agent_model_catalogs` được khóa theo thư mục tác nhân. Các caller runtime dùng
  `ensureOpenClawModelCatalog`; không có API tương thích `models.json` trong
  mã runtime. Triển khai ghi SQLite và registry PI nhúng được hydrate từ payload
  đã lưu đó mà không tạo tệp `models.json`.
- Xuất markdown bản ghi phiên QMD và config `memory.qmd.sessions` đã bị xóa.
  Không có bộ sưu tập bản ghi QMD, không có đường dẫn runtime `qmd/sessions*`,
  và không có cầu nối bộ nhớ phiên dựa trên tệp.
- Runtime memory-core nhập các trình trợ giúp lập chỉ mục bản ghi SQLite từ
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, không phải
  subpath QMD SDK. Subpath QMD giữ một re-export tương thích chỉ cho
  caller bên ngoài cho đến khi một lần dọn dẹp SDK lớn có thể xóa nó.
- `index.sqlite` riêng của QMD giờ là một vật liệu hóa runtime tạm được chống lưng bởi
  bảng SQLite chính `plugin_blob_entries`. Runtime không còn tạo sidecar bền
  `~/.openclaw/agents/<agentId>/qmd`.
- Plugin tùy chọn `memory-lancedb` không còn tạo
  `~/.openclaw/memory/lancedb` như một kho do OpenClaw quản lý ngầm định. Nó là một
  backend LanceDB bên ngoài và vẫn bị tắt cho đến khi operator cấu hình
  `dbPath` rõ ràng.
- `check:database-first-legacy-stores` làm thất bại nguồn runtime mới ghép
  tên kho cũ với API hệ thống tệp kiểu ghi. Nó cũng làm thất bại nguồn
  runtime đưa lại các dấu cầu nối bản ghi đã nghỉ hưu
  `transcriptLocator` hoặc `sqlite-transcript://...`. Mã di chuyển, doctor, nhập,
  và mã xuất không phải phiên rõ ràng vẫn được phép. Các tên hợp đồng cũ rộng hơn
  như `sessionFile`, `storePath`, và các facade thời tệp `SessionManager` cũ
  vẫn có chủ sở hữu hiện tại và cần công việc guard di chuyển riêng
  trước khi chúng có thể trở thành kiểm tra preflight bắt buộc. Guard giờ cũng bao phủ
  các kho runtime `cache/*.json`, sidecar
  `thread-bindings.json` dùng chung, trạng thái/run-log cron JSON, JSON tình trạng config,
  sidecar khởi động lại và khóa, cài đặt Voice Wake, phê duyệt ràng buộc Plugin,
  JSON chỉ mục Plugin đã cài đặt, JSONL kiểm toán File Transfer, nhật ký hoạt động Memory Wiki,
  log văn bản `command-logger` tích hợp cũ, và các núm chẩn đoán JSONL raw-stream pi-mono.
  Nó cũng cấm tên mô-đun doctor cũ ở cấp root để mã tương thích ở lại dưới
  `src/commands/doctor/`. Các handler gỡ lỗi Android cũng dùng logcat/đầu ra trong bộ nhớ
  thay vì dựng các tệp bộ nhớ đệm `camera_debug.log` hoặc
  `debug_logs.txt`.

## Hình dạng lược đồ mục tiêu

Giữ lược đồ tường minh. Trạng thái thời gian chạy do host sở hữu dùng các bảng có kiểu. Trạng thái mờ đục do Plugin sở hữu dùng `plugin_state_entries` / `plugin_blob_entries`; không có bảng `kv` host chung.

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

Tìm kiếm trong tương lai có thể thêm bảng FTS mà không thay đổi các bảng sự kiện chuẩn tắc:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Các giá trị lớn nên dùng cột `blob`, không mã hóa chuỗi JSON. Giữ `value_json` cho dữ liệu có cấu trúc nhỏ cần vẫn có thể kiểm tra bằng công cụ SQLite thuần.

`agent_databases` là registry chuẩn tắc cho nhánh này. Không thêm bảng `agents` cho đến khi có chủ sở hữu bản ghi agent thực sự; cấu hình agent vẫn nằm trong `openclaw.json`.

## Hình dạng di chuyển Doctor

Doctor nên gọi một bước di chuyển tường minh, có thể báo cáo và an toàn khi chạy lại:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` gọi triển khai di chuyển trạng thái sau bước kiểm tra trước cấu hình thông thường và tạo bản sao lưu đã xác minh trước khi nhập. Khởi động thời gian chạy và `openclaw migrate` không được nhập các tệp trạng thái OpenClaw cũ.

Thuộc tính di chuyển:

- Một lượt di chuyển phát hiện tất cả nguồn tệp cũ và tạo kế hoạch trước khi thay đổi bất cứ thứ gì.
- Doctor tạo kho lưu trữ sao lưu trước di chuyển đã xác minh trước khi nhập các tệp cũ.
- Các lượt nhập có tính lũy đẳng và được khóa theo đường dẫn nguồn, mtime, kích thước, hash và bảng đích.
- Các tệp nguồn thành công được xóa hoặc lưu trữ sau khi cơ sở dữ liệu đích đã commit.
- Các lượt nhập thất bại giữ nguyên nguồn và ghi cảnh báo trong `migration_runs`.
- Mã thời gian chạy chỉ đọc SQLite sau khi di chuyển tồn tại.
- Không cần đường dẫn hạ cấp/xuất-sang-tệp-thời-gian-chạy.

## Kiểm kê di chuyển

Di chuyển các mục này vào cơ sở dữ liệu toàn cục:

- Các lượt ghi thời gian chạy của sổ đăng ký tác vụ hiện dùng cơ sở dữ liệu dùng chung; trình nhập phụ trợ `tasks/runs.sqlite` chưa được phát hành đã bị xóa. Lưu ảnh chụp nhanh sẽ chèn hoặc cập nhật theo id tác vụ và chỉ xóa các hàng tác vụ/phân phối bị thiếu.
- Các lượt ghi thời gian chạy của Luồng tác vụ hiện dùng cơ sở dữ liệu dùng chung; trình nhập phụ trợ `tasks/flows/registry.sqlite` chưa được phát hành đã bị xóa. Lưu ảnh chụp nhanh sẽ chèn hoặc cập nhật theo id luồng và chỉ xóa các hàng luồng bị thiếu.
- Các lượt ghi thời gian chạy của trạng thái Plugin hiện dùng cơ sở dữ liệu dùng chung; trình nhập phụ trợ `plugin-state/state.sqlite` chưa được phát hành đã bị xóa.
- Tìm kiếm bộ nhớ tích hợp không còn mặc định là `memory/<agentId>.sqlite`; các bảng chỉ mục của nó nằm trong cơ sở dữ liệu agent sở hữu, và tùy chọn phụ trợ tường minh `memorySearch.store.path` đã được đưa về quá trình di chuyển cấu hình doctor.
- Tái lập chỉ mục bộ nhớ tích hợp chỉ đặt lại các bảng do bộ nhớ sở hữu trong cơ sở dữ liệu agent. Nó không được thay thế toàn bộ tệp SQLite, vì cùng cơ sở dữ liệu đó sở hữu phiên, bản ghi hội thoại, hàng VFS, hiện vật và bộ nhớ đệm thời gian chạy.
- Các sổ đăng ký container/trình duyệt sandbox từ JSON nguyên khối và phân mảnh. Các lượt ghi thời gian chạy hiện dùng cơ sở dữ liệu dùng chung; nhập JSON cũ vẫn được giữ lại.
- Định nghĩa tác vụ Cron, trạng thái lịch và lịch sử chạy hiện dùng SQLite dùng chung; doctor nhập/xóa các tệp cũ `jobs.json`, `jobs-state.json` và `cron/runs/*.jsonl`
- Danh tính/xác thực thiết bị, đẩy, kiểm tra cập nhật, cam kết, bộ nhớ đệm mô hình OpenRouter, chỉ mục Plugin đã cài đặt và liên kết app-server
- Các bản ghi ghép cặp và bootstrap thiết bị/node hiện dùng bảng SQLite có kiểu
- Người đăng ký thông báo ghép cặp thiết bị và dấu yêu cầu đã phân phối hiện dùng bảng plugin-state SQLite dùng chung thay cho `device-pair-notify.json`.
- Bản ghi cuộc gọi voice-call hiện dùng bảng plugin-state SQLite dùng chung trong không gian tên `voice-call` / `calls` thay cho `calls.jsonl`; CLI của Plugin theo dõi phần đuôi và tóm tắt lịch sử cuộc gọi dựa trên SQLite.
- Phiên Gateway QQBot, bản ghi người dùng đã biết và bộ nhớ đệm trích dẫn ref-index hiện dùng trạng thái Plugin SQLite trong các không gian tên `qqbot` (`gateway-sessions`, `known-users`, `ref-index`) thay cho `session-*.json`, `known-users.json` và `ref-index.jsonl`. Các tệp cũ đó là bộ nhớ đệm và không được di chuyển.
- Tùy chọn bộ chọn mô hình Discord, băm triển khai lệnh và liên kết luồng hiện dùng trạng thái Plugin SQLite trong các không gian tên `discord` (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`) thay cho `model-picker-preferences.json`, `command-deploy-cache.json` và `thread-bindings.json`; quá trình di chuyển doctor/setup của Discord nhập và xóa các tệp cũ.
- Con trỏ bắt kịp BlueBubbles và dấu chống trùng lặp chiều vào hiện dùng trạng thái Plugin SQLite trong các không gian tên `bluebubbles` (`catchup-cursors`, `inbound-dedupe`) thay cho `bluebubbles/catchup/*.json` và `bluebubbles/inbound-dedupe/*.json`; quá trình di chuyển doctor/setup của BlueBubbles nhập và xóa các tệp cũ.
- Offset cập nhật Telegram, mục bộ nhớ đệm nhãn dán, mục bộ nhớ đệm thông điệp chuỗi trả lời, mục bộ nhớ đệm thông điệp đã gửi, mục bộ nhớ đệm tên chủ đề và liên kết luồng hiện dùng trạng thái Plugin SQLite trong các không gian tên `telegram` (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`, `topic-names`, `thread-bindings`) thay cho `update-offset-*.json`, `sticker-cache.json`, `*.telegram-messages.json`, `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` và `thread-bindings-*.json`; quá trình di chuyển doctor/setup của Telegram nhập và xóa các tệp cũ.
- Con trỏ bắt kịp iMessage, ánh xạ id ngắn của trả lời và hàng chống trùng lặp sent-echo hiện dùng trạng thái Plugin SQLite trong các không gian tên `imessage` (`catchup-cursors`, `reply-cache`, `sent-echoes`) thay cho `imessage/catchup/*.json`, `imessage/reply-cache.jsonl` và `imessage/sent-echoes.jsonl`; quá trình di chuyển doctor/setup của iMessage nhập và xóa các tệp cũ.
- Hội thoại, cuộc thăm dò, token SSO và dữ liệu học phản hồi của Microsoft Teams hiện dùng các không gian tên trạng thái Plugin SQLite (`conversations`, `polls`, `sso-tokens`, `feedback-learnings`) thay cho `msteams-conversations.json`, `msteams-polls.json`, `msteams-sso-tokens.json` và `*.learnings.json`; quá trình di chuyển doctor/setup của Microsoft Teams nhập và lưu trữ các tệp cũ. Các lượt tải lên đang chờ là bộ nhớ đệm SQLite ngắn hạn và các tệp bộ nhớ đệm JSON cũ không được di chuyển.
- Bộ nhớ đệm đồng bộ Matrix, siêu dữ liệu lưu trữ, liên kết luồng, dấu chống trùng lặp chiều vào, trạng thái hạ nhiệt xác minh khởi động, thông tin xác thực, khóa khôi phục và ảnh chụp nhanh mã hóa IndexedDB của SDK hiện dùng các không gian tên trạng thái/blob Plugin SQLite trong `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`, `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`) thay cho `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`, `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`, `recovery-key.json` và `crypto-idb-snapshot.json`; quá trình di chuyển doctor/setup của Matrix nhập và xóa các tệp cũ đó khỏi các gốc lưu trữ Matrix theo phạm vi tài khoản.
- Con trỏ bus Nostr và trạng thái xuất bản hồ sơ hiện dùng trạng thái Plugin SQLite trong các không gian tên `nostr` (`bus-state`, `profile-state`) thay cho `bus-state-*.json` và `profile-state-*.json`; quá trình di chuyển doctor/setup của Nostr nhập và xóa các tệp cũ.
- Công tắc bật/tắt phiên Active Memory hiện dùng trạng thái Plugin SQLite trong `active-memory/session-toggles` thay cho `session-toggles.json`.
- Hàng đợi đề xuất Skill Workshop và bộ đếm đánh giá hiện dùng trạng thái Plugin SQLite trong `skill-workshop/proposals` và `skill-workshop/reviews` thay cho các tệp `skill-workshop/<workspace>.json` theo workspace.
- Hàng đợi phân phối đi và phân phối phiên hiện dùng chung bảng SQLite toàn cục `delivery_queue_entries` dưới các tên hàng đợi riêng (`outbound-delivery`, `session-delivery`) thay cho các tệp bền vững `delivery-queue/*.json`, `delivery-queue/failed/*.json` và `session-delivery-queue/*.json`. Bước legacy-state của doctor nhập các hàng đang chờ và đã lỗi, xóa các dấu đã phân phối lỗi thời và xóa các tệp JSON cũ sau khi nhập. Các trường định tuyến nóng và thử lại là cột có kiểu; payload JSON chỉ được giữ lại để phát lại/gỡ lỗi.
- Lease tiến trình ACPX hiện dùng trạng thái Plugin SQLite trong `acpx/process-leases` thay cho `process-leases.json`.
- Siêu dữ liệu chạy sao lưu và di chuyển

Di chuyển các mục này vào cơ sở dữ liệu agent:

- Gốc phiên agent và payload mục phiên có dạng tương thích. Đã hoàn tất cho các lượt ghi thời gian chạy: siêu dữ liệu phiên nóng có thể truy vấn trong `sessions`, trong khi payload đầy đủ `SessionEntry` có dạng cũ vẫn nằm trong `session_entries`.
- Sự kiện bản ghi hội thoại agent. Đã hoàn tất cho các lượt ghi thời gian chạy.
- Điểm kiểm tra Compaction và ảnh chụp nhanh bản ghi hội thoại. Đã hoàn tất cho các lượt ghi thời gian chạy: bản sao bản ghi hội thoại của điểm kiểm tra là các hàng bản ghi hội thoại SQLite và siêu dữ liệu điểm kiểm tra được ghi trong `transcript_snapshots`. Các helper điểm kiểm tra Gateway hiện gọi các giá trị này là ảnh chụp nhanh bản ghi hội thoại thay vì tệp nguồn.
- Không gian tên scratch/workspace VFS của agent. Đã hoàn tất cho các lượt ghi VFS thời gian chạy.
- Payload tệp đính kèm subagent. Đã hoàn tất cho các lượt ghi thời gian chạy: chúng là các mục seed VFS SQLite và không bao giờ là tệp workspace bền vững.
- Hiện vật công cụ. Đã hoàn tất cho các lượt ghi thời gian chạy.
- Hiện vật chạy. Đã hoàn tất cho các lượt ghi thời gian chạy worker thông qua bảng `run_artifacts` theo agent.
- Bộ nhớ đệm thời gian chạy cục bộ của agent. Đã hoàn tất cho các lượt ghi bộ nhớ đệm theo phạm vi thời gian chạy worker thông qua bảng `cache_entries` theo agent. Bộ nhớ đệm mô hình toàn Gateway vẫn ở cơ sở dữ liệu toàn cục trừ khi chúng trở thành theo agent.
- Nhật ký luồng cha ACP. Đã hoàn tất cho các lượt ghi thời gian chạy.
- Phiên sổ cái phát lại ACP. Đã hoàn tất cho các lượt ghi thời gian chạy thông qua `acp_replay_sessions` và `acp_replay_events`; `acp/event-ledger.json` cũ chỉ còn là đầu vào doctor.
- Siêu dữ liệu phiên ACP. Đã hoàn tất cho các lượt ghi thời gian chạy thông qua `acp_sessions`; các khối `entry.acp` cũ trong `sessions.json` chỉ là đầu vào di chuyển doctor.
- Các tệp phụ trợ quỹ đạo khi chúng không phải là tệp xuất tường minh. Đã hoàn tất cho các lượt ghi thời gian chạy: thu thập quỹ đạo ghi các hàng `trajectory_runtime_events` trong cơ sở dữ liệu agent và phản chiếu hiện vật theo phạm vi lượt chạy vào SQLite. Các tệp phụ trợ cũ chỉ là đầu vào nhập của doctor; xuất có thể tạo mới đầu ra gói hỗ trợ JSONL nhưng không đọc hoặc di chuyển tệp phụ trợ quỹ đạo/bản ghi hội thoại cũ trong thời gian chạy. Thu thập quỹ đạo thời gian chạy phơi bày phạm vi SQLite; các helper đường dẫn JSONL được cô lập cho hỗ trợ xuất/gỡ lỗi và không được tái xuất từ mô-đun thời gian chạy. Siêu dữ liệu quỹ đạo embedded-runner ghi danh tính `{agentId, sessionId, sessionKey}` thay vì lưu một bộ định vị bản ghi hội thoại.

Hiện vẫn giữ các mục này dựa trên tệp:

- `openclaw.json`
- tệp thông tin xác thực provider hoặc CLI
- manifest Plugin/gói
- workspace người dùng và kho Git khi chế độ đĩa được chọn
- nhật ký dành cho việc theo dõi phần đuôi của người vận hành, trừ khi một bề mặt nhật ký cụ thể được di chuyển

## Kế hoạch di chuyển

### Giai đoạn 0: Đóng băng ranh giới

Làm rõ ranh giới trạng thái bền vững trước khi di chuyển thêm hàng:

- Thêm bảng `migration_runs` vào cơ sở dữ liệu toàn cục.
  Đã hoàn tất cho báo cáo thực thi di chuyển trạng thái cũ.
- Thêm một dịch vụ di chuyển trạng thái từ tệp sang cơ sở dữ liệu do doctor sở hữu.
  Đã hoàn tất: `openclaw doctor --fix` dùng triển khai di chuyển trạng thái cũ.
- Đặt `plan` thành chỉ đọc và khiến `apply` tạo bản sao lưu, nhập, xác minh, rồi xóa hoặc cách ly các tệp cũ.
  Đã hoàn tất: doctor tạo bản sao lưu trước di chuyển đã xác minh, truyền đường dẫn sao lưu vào `migration_runs` và tái sử dụng các đường dẫn nhập/xóa.
- Thêm các lệnh cấm tĩnh để mã thời gian chạy mới không thể ghi tệp trạng thái cũ trong khi mã di chuyển và kiểm thử vẫn có thể seed/đọc chúng.
  Đã hoàn tất cho các kho trạng thái cũ hiện đã được di chuyển; bộ bảo vệ cũng quét các kiểm thử lồng nhau để tìm các hợp đồng bộ định vị bản ghi hội thoại thời gian chạy bị cấm.

### Giai đoạn 1: Hoàn tất mặt phẳng điều khiển toàn cục

Giữ trạng thái điều phối dùng chung trong `state/openclaw.sqlite`:

- Agent và sổ đăng ký cơ sở dữ liệu agent
- Sổ cái tác vụ và Luồng tác vụ
- Trạng thái Plugin
- Sổ đăng ký container/trình duyệt sandbox
- Lịch sử chạy Cron/bộ lập lịch
- Ghép cặp, thiết bị, đẩy, kiểm tra cập nhật, TUI, bộ nhớ đệm OpenRouter/mô hình và trạng thái thời gian chạy nhỏ khác theo phạm vi Gateway
- Siêu dữ liệu sao lưu và di chuyển
- Byte tệp đính kèm phương tiện Gateway. Đã hoàn tất cho các lượt ghi thời gian chạy; đường dẫn tệp trực tiếp là các bản hiện thực hóa tạm thời để tương thích với bộ gửi kênh và staging sandbox. Danh sách cho phép thời gian chạy chấp nhận đường dẫn hiện thực hóa SQLite, không phải gốc phương tiện trạng thái/cấu hình cũ. Doctor nhập các tệp phương tiện cũ vào `media_blobs` và xóa tệp nguồn sau khi ghi hàng thành công.
- Phiên, sự kiện và blob payload thu thập proxy gỡ lỗi. Đã hoàn tất: các bản thu thập nằm trong DB trạng thái dùng chung và mở thông qua bootstrap, schema, WAL và thiết lập busy-timeout của DB trạng thái dùng chung. Byte payload được nén gzip trong `capture_blobs.data`; không có ghi đè DB phụ trợ thời gian chạy proxy gỡ lỗi, thư mục blob hay mục tiêu schema/codegen được tạo riêng cho proxy-capture. Quá trình di chuyển doctor/khởi động nhập các hàng `debug-proxy/capture.sqlite` đã phát hành và các blob payload được tham chiếu, bao gồm các ghi đè môi trường DB/blob cũ đang hoạt động, rồi lưu trữ các nguồn đó trong khi vẫn giữ nguyên chứng chỉ CA.

Giai đoạn này cũng xóa các trình mở phụ trợ trùng lặp, helper quyền, thiết lập WAL, cắt tỉa hệ thống tệp và trình ghi tương thích khỏi các hệ thống con đó.

### Giai đoạn 2: Giới thiệu cơ sở dữ liệu theo agent

Tạo một cơ sở dữ liệu cho mỗi agent và đăng ký nó từ DB toàn cục:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Hàng `agent_databases` toàn cục lưu đường dẫn, phiên bản schema, dấu thời gian lần cuối thấy và siêu dữ liệu kích thước/tính toàn vẹn cơ bản. Mã thời gian chạy hỏi sổ đăng ký để lấy DB agent thay vì tự suy ra đường dẫn tệp trực tiếp.

DB agent sở hữu:

- `sessions` làm gốc phiên chuẩn, với `session_entries` là bảng tải trọng có hình dạng tương thích được gắn vào gốc đó, và `session_routes` là tra cứu `session_key` đang hoạt động duy nhất
- `conversations` và `session_conversations` làm danh tính định tuyến nhà cung cấp đã chuẩn hóa được gắn vào phiên
- `transcript_events`
- ảnh chụp bản ghi hội thoại và điểm kiểm tra Compaction. Đã xong cho các thao tác ghi runtime.
- `vfs_entries`
- `tool_artifacts` và hiện vật lượt chạy
- các hàng runtime/bộ nhớ đệm cục bộ của agent. Đã xong cho bộ nhớ đệm trong phạm vi worker.
- sự kiện luồng cha ACP
- sự kiện runtime quỹ đạo khi chúng không phải là hiện vật xuất rõ ràng

### Giai đoạn 3: Thay thế API kho phiên

Đã xong cho runtime. Bề mặt kho phiên dạng tệp không phải là hợp đồng runtime đang hoạt động:

- Runtime không còn gọi `loadSessionStore(storePath)` hoặc coi `storePath` là danh tính phiên.
- Các thao tác hàng runtime là `getSessionEntry`, `upsertSessionEntry`, `patchSessionEntry`, `deleteSessionEntry`, và `listSessionEntries`.
- Các helper ghi lại toàn bộ kho, trình ghi tệp, kiểm thử hàng đợi, cắt tỉa bí danh, và tham số xóa khóa cũ đã bị loại khỏi runtime.
- Các export tương thích đã ngừng dùng ở gói gốc vẫn chuyển đổi đường dẫn `sessions.json` chuẩn sang API hàng SQLite.
- Việc phân tích cú pháp `sessions.json` chỉ còn trong mã di chuyển/nhập của doctor và kiểm thử doctor.
- Fallback vòng đời runtime đọc header bản ghi hội thoại SQLite, không đọc các dòng đầu JSONL trước.

Tiếp tục xóa mọi thứ tái đưa vào tham số khóa tệp, thuật ngữ cắt tỉa/cắt ngắn như bảo trì tệp, danh tính đường dẫn kho, hoặc các kiểm thử chỉ khẳng định duy trì JSON.

### Giai đoạn 4: Chuyển Bản ghi hội thoại, Luồng ACP, Quỹ đạo, Và VFS

Biến mọi luồng dữ liệu agent thành gốc cơ sở dữ liệu:

- Các thao tác ghi nối bản ghi hội thoại đi qua một giao dịch SQLite đảm bảo header phiên, kiểm tra tính lũy đẳng của mã định danh tin nhắn, chọn đuôi cha, chèn vào `transcript_events`, và ghi siêu dữ liệu danh tính có thể truy vấn trong `transcript_event_identities`. Đã xong cho thao tác nối tin nhắn bản ghi hội thoại trực tiếp và thao tác nối `TranscriptSessionManager` được duy trì bình thường; các thao tác nhánh rõ ràng giữ lựa chọn cha rõ ràng của chúng và vẫn ghi hàng SQLite mà không suy ra bất kỳ bộ định vị tệp nào.
- Nhật ký luồng cha ACP trở thành các hàng, không phải tệp `.acp-stream.jsonl`. Đã xong.
- Thiết lập spawn ACP không còn duy trì đường dẫn JSONL của bản ghi hội thoại. Đã xong.
- Thu thập quỹ đạo runtime ghi trực tiếp các hàng sự kiện/hiện vật. Lệnh hỗ trợ/xuất rõ ràng vẫn có thể tạo hiện vật JSONL gói hỗ trợ như một định dạng xuất, nhưng xuất phiên không tái tạo JSONL phiên. Đã xong.
- Workspace trên đĩa vẫn ở trên đĩa khi được cấu hình ở chế độ đĩa.
- Scratch VFS và chế độ workspace chỉ VFS thử nghiệm dùng DB của agent.

Quá trình di chuyển nhập các tệp JSONL cũ một lần, ghi số lượng/hash trong `migration_runs`, và xóa các tệp đã nhập sau khi kiểm tra tính toàn vẹn.

### Giai đoạn 5: Sao lưu, Khôi phục, Vacuum, Và Xác minh

Bản sao lưu vẫn là một tệp lưu trữ duy nhất:

- Tạo checkpoint cho mọi cơ sở dữ liệu toàn cục và agent.
- Chụp nhanh từng DB bằng ngữ nghĩa sao lưu SQLite hoặc `VACUUM INTO`.
- Lưu trữ các ảnh chụp DB gọn, cấu hình, thông tin xác thực bên ngoài, và các export workspace được yêu cầu.
- Bỏ qua các tệp live thô `*.sqlite-wal` và `*.sqlite-shm`.
- Xác minh bằng cách mở từng ảnh chụp DB và chạy `PRAGMA integrity_check`.
  `openclaw backup create` thực hiện xác minh lưu trữ này theo mặc định;
  `--no-verify` chỉ bỏ qua lượt kiểm tra lưu trữ sau khi ghi, không bỏ qua kiểm tra tính toàn vẹn khi tạo ảnh chụp.
- Khôi phục sao chép ảnh chụp trở lại đường dẫn đích. Nhánh này đặt lại bố cục SQLite chưa phát hành về `user_version = 1`; các thay đổi schema đã phát hành trong tương lai có thể thêm di chuyển rõ ràng khi cần.

### Giai đoạn 6: Runtime Worker

Giữ chế độ worker ở trạng thái thử nghiệm trong khi việc tách cơ sở dữ liệu được đưa vào:

- Worker nhận mã định danh agent, mã định danh lượt chạy, chế độ hệ thống tệp, và danh tính registry DB.
- Mỗi worker mở kết nối SQLite riêng.
- Cha giữ quyền phân phối kênh, phê duyệt, cấu hình, và hủy.
- Bắt đầu với một worker cho mỗi lượt chạy đang hoạt động; chỉ thêm pooling sau khi vòng đời và quyền sở hữu kết nối DB ổn định.

### Giai đoạn 7: Xóa Thế Giới Cũ

Đã xong cho quản lý phiên runtime. Thế giới cũ chỉ được phép làm đầu vào doctor rõ ràng hoặc đầu ra hỗ trợ/xuất:

- Không có thao tác ghi runtime `sessions.json`, JSONL bản ghi hội thoại, JSON registry sandbox, SQLite sidecar tác vụ, hoặc SQLite sidecar trạng thái Plugin.
- Không cắt tỉa tệp JSON/phiên, cắt ngắn bản ghi hội thoại dạng tệp, khóa tệp phiên, hoặc kiểm thử phiên dạng khóa.
- Không có export tương thích runtime có mục đích giữ các tệp phiên cũ luôn cập nhật.
- Export hỗ trợ rõ ràng vẫn là định dạng lưu trữ/vật chất hóa do người dùng yêu cầu và không được đưa tên tệp trở lại danh tính runtime.

## Sao lưu Và Khôi phục

Bản sao lưu nên là một tệp lưu trữ duy nhất, nhưng việc thu thập cơ sở dữ liệu nên dùng cơ chế gốc SQLite:

1. Dừng hoạt động ghi chạy lâu hoặc vào một rào chắn sao lưu ngắn.
2. Với mọi cơ sở dữ liệu toàn cục và agent, chạy checkpoint.
3. Chụp nhanh từng cơ sở dữ liệu bằng ngữ nghĩa sao lưu SQLite hoặc `VACUUM INTO` vào một thư mục sao lưu tạm thời.
4. Lưu trữ các ảnh chụp cơ sở dữ liệu đã nén gọn, tệp cấu hình, thư mục thông tin xác thực, workspace được chọn, và manifest.
5. Xác minh kho lưu trữ bằng cách mở từng ảnh chụp SQLite được bao gồm và chạy `PRAGMA integrity_check`.
   `openclaw backup create` thực hiện việc này theo mặc định; `--no-verify` chỉ dùng để cố ý bỏ qua lượt kiểm tra lưu trữ sau khi ghi.

Không dựa vào bản sao live thô `*.sqlite`, `*.sqlite-wal`, và `*.sqlite-shm` làm định dạng sao lưu chính. Manifest lưu trữ nên ghi vai trò cơ sở dữ liệu, mã định danh agent, phiên bản schema, đường dẫn nguồn, đường dẫn ảnh chụp, kích thước byte, và trạng thái toàn vẹn.

Khôi phục nên dựng lại cơ sở dữ liệu toàn cục và các tệp cơ sở dữ liệu agent từ ảnh chụp trong kho lưu trữ. Vì bố cục SQLite chưa được phát hành, refactor này chỉ giữ schema phiên bản 1 cộng với nhập từ tệp sang cơ sở dữ liệu của doctor. Lệnh khôi phục xác thực kho lưu trữ trước, sau đó thay thế từng tài sản trong manifest từ tải trọng đã giải nén và xác minh.

## Kế hoạch Refactor Runtime

1. Thêm API registry cơ sở dữ liệu.
   - Phân giải đường dẫn DB toàn cục và DB theo agent.
   - Giữ các schema chưa phát hành ở `user_version = 1`; không thêm mã runner di chuyển schema cho đến khi một schema đã phát hành cần đến.
   - Thêm helper đóng/checkpoint/toàn vẹn được dùng bởi kiểm thử, sao lưu, và doctor.

2. Thu gọn các kho SQLite sidecar.
   - Chuyển bảng trạng thái Plugin vào cơ sở dữ liệu toàn cục. Đã xong cho thao tác ghi runtime; trình nhập sidecar cũ chưa phát hành đã bị xóa.
   - Chuyển bảng registry tác vụ vào cơ sở dữ liệu toàn cục. Đã xong cho thao tác ghi runtime; trình nhập sidecar cũ chưa phát hành đã bị xóa.
   - Chuyển bảng Task Flow vào cơ sở dữ liệu toàn cục. Đã xong cho thao tác ghi runtime; trình nhập sidecar cũ chưa phát hành đã bị xóa.
   - Chuyển bảng tìm kiếm bộ nhớ tích hợp sẵn vào từng cơ sở dữ liệu agent. Đã xong; `memorySearch.store.path` tùy chỉnh rõ ràng hiện đã được doctor config migration xóa bỏ.
     Tái lập chỉ mục đầy đủ chạy tại chỗ chỉ trên bảng bộ nhớ; đường dẫn hoán đổi toàn bộ tệp cũ và helper hoán đổi chỉ mục sidecar đã bị xóa.
   - Xóa các trình mở cơ sở dữ liệu trùng lặp, thiết lập WAL, helper quyền, và đường đóng khỏi các hệ thống con đó.

3. Chuyển bảng do agent sở hữu vào cơ sở dữ liệu theo agent.
   - Tạo DB agent theo nhu cầu thông qua registry cơ sở dữ liệu toàn cục. Đã xong.
   - Chuyển mục nhập phiên runtime, sự kiện bản ghi hội thoại, hàng VFS, và hiện vật công cụ sang DB agent. Đã xong.
   - Không di chuyển mục nhập phiên DB dùng chung cục bộ theo nhánh, sự kiện bản ghi hội thoại, hàng VFS, hoặc hiện vật công cụ; bố cục đó chưa từng được phát hành. Chỉ giữ nhập từ tệp cũ sang cơ sở dữ liệu trong doctor.

4. Thay thế API kho phiên.
   - Loại bỏ `storePath` làm danh tính runtime. Đã xong cho runtime và được bảo vệ bởi `check:database-first-legacy-stores`: siêu dữ liệu phiên, cập nhật tuyến, duy trì lệnh, dọn dẹp phiên CLI, bản xem trước reasoning Feishu, duy trì trạng thái bản ghi hội thoại, độ sâu subagent, ghi đè phiên hồ sơ xác thực, logic fork cha, và kiểm tra QA-lab giờ phân giải cơ sở dữ liệu từ khóa agent/phiên chuẩn.
     Phản hồi danh sách phiên Gateway/TUI/UI/macOS giờ hiển thị `databasePath` thay vì `path` cũ; bề mặt debug macOS hiển thị cơ sở dữ liệu theo agent dưới dạng trạng thái chỉ đọc thay vì ghi cấu hình `session.store`.
     `/status`, export quỹ đạo do chat điều khiển, và proxy phụ thuộc CLI không còn truyền đường dẫn kho cũ; fallback sử dụng bản ghi hội thoại đọc SQLite theo danh tính agent/phiên. Kiểm thử runtime và bridge không còn hiển thị `storePath`; đầu vào doctor/di chuyển sở hữu tên trường cũ đó.
     Tải phiên kết hợp Gateway không còn có nhánh runtime đặc biệt cho giá trị `session.store` không được tạo theo template; nó tổng hợp các hàng SQLite theo agent.
     Làn doctor khóa phiên cũ và helper dọn dẹp `.jsonl.lock` của nó đã bị xóa; SQLite hiện là ranh giới đồng thời phiên.
     Các điểm gọi runtime nóng dùng tên helper hướng hàng như `resolveSessionRowEntry`; bí danh tương thích cũ `resolveSessionStoreEntry` đã bị loại khỏi runtime và export Plugin SDK.

- Dùng thao tác hàng `{ agentId, sessionKey }`.
  Đã xong: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`, `patchSessionEntry`, và `listSessionEntries` là API ưu tiên SQLite không yêu cầu đường dẫn kho phiên. Tóm tắt trạng thái, trạng thái agent cục bộ, health, và lệnh liệt kê `openclaw sessions` giờ đọc trực tiếp các hàng theo agent và hiển thị đường dẫn cơ sở dữ liệu SQLite theo agent thay vì đường dẫn `sessions.json`.
- Thay thế xóa/chèn toàn bộ kho bằng `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries`, và truy vấn dọn dẹp SQL.
  Đã xong cho runtime: đường dẫn nóng giờ dùng API hàng và bản vá hàng có thử lại khi xung đột;
  các helper nhập/thay thế toàn bộ kho còn lại bị giới hạn trong mã nhập di chuyển và kiểm thử backend SQLite.
  - Xóa `store-writer.ts` và kiểm thử hàng đợi trình ghi. Đã xong.
  - Xóa cắt tỉa khóa cũ runtime và tham số xóa bí danh khỏi upsert/patch hàng phiên. Đã xong.

5. Xóa hành vi registry JSON runtime.
   - Chuyển đọc và ghi registry sandbox sang chỉ SQLite. Đã xong.
   - Chỉ nhập JSON nguyên khối và phân mảnh từ bước di chuyển. Đã xong.
   - Xóa khóa registry phân mảnh và thao tác ghi JSON. Đã xong.

- Giữ một bảng registry có kiểu thay vì lưu hàng registry dưới dạng JSON mờ tổng quát nếu hình dạng vẫn là trạng thái vận hành trên đường dẫn nóng. Đã xong.

6. Xóa đột biến phiên dạng khóa tệp.
   - Đã xong cho tạo khóa runtime và API khóa runtime.
   - Làn dọn dẹp doctor `.jsonl.lock` cũ độc lập đã bị xóa.
   - `session.writeLock` là cấu hình cũ được doctor di chuyển, không phải cài đặt runtime có kiểu.
   - Tính toàn vẹn trạng thái không còn đường cắt tỉa tệp bản ghi hội thoại mồ côi riêng; di chuyển doctor nhập/xóa nguồn JSONL cũ ở một nơi.
   - Phối hợp singleton Gateway dùng các hàng SQLite `state_leases` có kiểu dưới `gateway_locks` và không còn hiển thị đường nối thư mục khóa tệp.
   - Duy trì chống trùng lặp Plugin SDK tổng quát không còn dùng khóa tệp hoặc tệp JSON; nó ghi các hàng trạng thái Plugin SQLite dùng chung. Đã xong.
   - Phối hợp nhúng QMD dùng lease trạng thái SQLite thay vì `qmd/embed.lock`. Đã xong.

7. Làm cho worker nhận biết cơ sở dữ liệu.
   - Worker mở kết nối SQLite riêng.
   - Cha sở hữu việc phân phối, callback kênh, và cấu hình.
   - Worker nhận mã định danh agent, mã định danh lượt chạy, chế độ hệ thống tệp, và danh tính registry DB, không nhận handle live.
   - `vfs-only` vẫn là thử nghiệm và dùng cơ sở dữ liệu agent làm gốc lưu trữ.
   - Trước tiên giữ một worker cho mỗi lượt chạy đang hoạt động. Pooling có thể đợi đến khi vòng đời kết nối DB và hành vi hủy trở nên ổn định.

8. Tích hợp sao lưu.
   - Dạy cơ chế sao lưu chụp nhanh cơ sở dữ liệu toàn cục và cơ sở dữ liệu của agent qua SQLite backup hoặc
     `VACUUM INTO`. Đã hoàn tất cho các tệp `*.sqlite` được phát hiện dưới tài sản trạng thái.
   - Thêm xác minh sao lưu cho tính toàn vẹn SQLite và phiên bản schema. Đã hoàn tất cho
     quá trình tạo bản sao lưu và các kiểm tra tính toàn vẹn xác minh kho lưu trữ mặc định.
   - Ghi metadata của lần chạy sao lưu trong SQLite. Đã hoàn tất qua bảng `backup_runs`
     dùng chung với đường dẫn kho lưu trữ, trạng thái và manifest JSON.
   - Thêm khôi phục từ các bản chụp nhanh kho lưu trữ đã xác minh. Đã hoàn tất: `openclaw backup
restore` xác thực trước khi trích xuất, dùng manifest đã chuẩn hóa của bộ xác minh,
     hỗ trợ `--dry-run`, và yêu cầu `--yes` trước khi thay thế
     các đường dẫn nguồn đã ghi nhận.
   - Chỉ bao gồm xuất VFS/workspace khi được yêu cầu; không xuất phần nội bộ của phiên
     dưới dạng JSON hoặc JSONL.

9. Xóa các kiểm thử và mã lỗi thời. Đã hoàn tất cho các bề mặt phiên runtime đã biết.

- Xóa các kiểm thử khẳng định runtime tạo `sessions.json` hoặc các tệp transcript
  JSONL. Đã hoàn tất cho core session store, chat, sự kiện transcript Gateway,
  preview, lifecycle, cập nhật command session-entry, reset/trace auto-reply, và
  fixture memory-core dreaming, định tuyến mục tiêu phê duyệt, sửa chữa transcript phiên,
  sửa chữa quyền bảo mật, xuất trajectory, và xuất phiên.
  Các kiểm thử transcript active-memory hiện khẳng định phạm vi SQLite và không tạo tệp JSONL
  tạm thời hoặc được lưu bền.
  Hồi quy cắt tỉa transcript heartbeat cũ đã bị xóa vì
  runtime không còn cắt ngắn transcript JSONL.
  Kiểm thử công cụ danh sách phiên của agent không còn mô hình hóa các đường dẫn `sessions.json` cũ
  làm dạng phản hồi Gateway; kiểm thử app/UI/macOS dùng `databasePath`.
  Kiểm thử sử dụng transcript `/status` hiện gieo trực tiếp các hàng transcript SQLite
  thay vì ghi tệp JSONL.
  Kiểm thử vòng đời phiên Gateway hiện dùng trực tiếp các helper gieo transcript SQLite;
  dạng fixture tệp phiên một dòng cũ đã biến mất khỏi phạm vi reset
  và delete.
  `sessions.delete` không còn trả về trường thời kỳ tệp `archived: []`; việc xóa
  chỉ báo cáo kết quả đột biến hàng. Tùy chọn `deleteTranscript` cũ
  cũng đã biến mất: xóa một phiên sẽ xóa gốc `sessions` chuẩn tắc và để
  SQLite cascade các hàng transcript, snapshot, và trajectory do phiên sở hữu, nên không
  caller nào có thể để lại transcript mồ côi hoặc quên một nhánh dọn dẹp.
  Kiểm thử chụp trajectory của context-engine hiện đọc các hàng `trajectory_runtime_events`
  từ một cơ sở dữ liệu agent cô lập thay vì đọc
  `session.trajectory.jsonl`.
  Các script gieo Docker MCP channel hiện gieo trực tiếp các hàng SQLite. Việc ghi trực tiếp
  `sessions.json` được giới hạn ở các fixture doctor.
  Tool Search Gateway E2E đọc bằng chứng tool-call từ các hàng transcript SQLite
  thay vì quét các tệp `agents/<agentId>/sessions/*.jsonl`.
  Sự kiện host memory-core và các hàng nháp session-corpus hiện nằm trong plugin-state SQLite
  dùng chung; `events.jsonl` và `session-corpus/*.txt` chỉ là đầu vào migration
  doctor kế thừa. Các hàng hoạt động dùng đường dẫn ảo `memory/session-ingestion/`,
  không phải `.dreams/session-corpus`. Module sửa chữa memory-core dreaming
  cũ và các kiểm thử CLI/Gateway của nó đã bị xóa vì runtime không
  còn sở hữu sửa chữa kho lưu trữ tệp cho corpus đó. Kiểm thử
  bridge/public-artifact của memory-core không còn hiển thị `.dreams/events.jsonl`; chúng
  dùng tên artifact JSON ảo dựa trên SQLite.
  Tài liệu kiểm thử Public SDK/Codex hiện nói trạng thái phiên SQLite thay vì tệp phiên,
  và ví dụ channel-turn không còn để lộ đối số `storePath`.
  Trạng thái đồng bộ Matrix hiện dùng trực tiếp kho plugin-state SQLite. Các hợp đồng
  client/runtime hoạt động truyền vào gốc lưu trữ tài khoản, không phải đường dẫn `bot-storage.json`,
  và doctor nhập `bot-storage.json` kế thừa vào SQLite trước khi xóa
  nguồn. Các kịch bản khởi động lại/phá hủy QA Matrix hiện đột biến trực tiếp hàng đồng bộ SQLite
  thay vì tạo hoặc xóa các tệp `bot-storage.json` giả, và
  nền E2EE truyền vào một gốc sync-store thay vì đường dẫn
  `sync-store.json` giả.
  Lựa chọn storage-root của Matrix không còn chấm điểm các gốc theo tệp JSON đồng bộ/thread kế thừa;
  nó dùng metadata gốc bền vững cộng với trạng thái crypto thực.
  Bộ kiểm thử backend phiên SQLite runtime không còn tạo giả
  `sessions.json`; các fixture nguồn kế thừa hiện nằm trong các kiểm thử doctor
  nhập chúng.
  Kiểm thử phiên Gateway không còn để lộ helper `createSessionStoreDir` hoặc
  thiết lập đường dẫn session-store tạm không dùng; thư mục fixture là tường minh, và thiết lập
  hàng trực tiếp dùng cách đặt tên session-row SQLite.
  Phạm vi kiểm thử parser session-store JSON5 chỉ dành cho doctor đã chuyển khỏi kiểm thử infra và
  vào kiểm thử migration doctor, nên các bộ kiểm thử runtime không còn sở hữu phân tích
  tệp phiên kế thừa.
  Kiểm thử runtime SSO/pending-upload Microsoft Teams không còn mang fixture sidecar
  JSON hoặc parser; phân tích token SSO kế thừa chỉ nằm trong module migration
  của Plugin. Kiểm thử Telegram không còn gieo các đường dẫn store `/tmp/*.json`
  giả; chúng reset trực tiếp cache tin nhắn dựa trên SQLite. Helper test-state OpenClaw
  generic không còn để lộ writer `auth-profiles.json`
  kế thừa; kiểm thử migration auth của doctor sở hữu fixture đó cục bộ.
  Kiểm thử runtime cho con trỏ phiên cuối TUI, phê duyệt exec, toggle active-memory,
  xác minh dedupe/startup Matrix, đồng bộ nguồn Memory Wiki,
  binding current-conversation, auth onboarding, và nhập bí mật Hermes không
  còn tạo các tệp sidecar cũ hoặc khẳng định tên tệp cũ vắng mặt. Chúng
  chứng minh hành vi qua các hàng SQLite và API store công khai; kiểm thử doctor/migration
  là nơi duy nhất các tên tệp nguồn kế thừa thuộc về.
  Kiểm thử runtime cho ghép cặp device/node, channel allowFrom, ý định restart,
  handoff restart, mục hàng đợi giao phiên, sức khỏe config, cache iMessage,
  cron job, header transcript PI, registry subagent, và tệp đính kèm ảnh được quản lý
  cũng không còn tạo các tệp JSON/JSONL đã nghỉ hưu chỉ để chứng minh
  chúng bị bỏ qua hoặc vắng mặt.
  Khôi phục tràn PI không còn có fallback ghi lại/cắt ngắn SessionManager:
  việc cắt ngắn tool-result và ghi lại transcript context-engine đột biến
  các hàng transcript SQLite, rồi làm mới trạng thái prompt hoạt động từ cơ sở dữ liệu.
  Các append thông điệp SessionManager được lưu bền ủy quyền cho helper append transcript SQLite
  nguyên tử để chọn cha và đảm bảo idempotency. Các append mục
  metadata/custom thông thường cũng chọn cha hiện tại bên trong SQLite, nên
  các instance manager cũ không hồi sinh các cuộc đua parent-chain trước SQLite.
  Dọn dẹp đuôi PI tổng hợp cho precheck giữa lượt và `sessions_yield` hiện
  cắt tỉa trực tiếp trạng thái transcript SQLite; bridge xóa đuôi SessionManager cũ
  và các kiểm thử của nó đã bị xóa.
  Chụp checkpoint Compaction cũng chỉ chụp nhanh từ SQLite; caller không
  còn truyền SessionManager sống làm nguồn transcript thay thế.
- Giữ các kiểm thử chỉ gieo tệp kế thừa cho migration.
- Bằng chứng tệp JSON đã được thay bằng bằng chứng hàng SQL cho các bề mặt runtime
  hoạt động.

- Thêm các lệnh cấm tĩnh đối với việc runtime ghi vào đường dẫn JSON phiên/cache kế thừa.
  Đã hoàn tất cho guard của repo.

10. Làm cho báo cáo migration có thể kiểm toán.
    - Ghi các lần chạy migration trong SQLite với dấu thời gian bắt đầu/kết thúc, đường dẫn nguồn,
      hash nguồn, số lượng, cảnh báo, và đường dẫn sao lưu.
      Đã hoàn tất: các lần thực thi migration legacy-state hiện lưu bền một báo cáo `migration_runs`
      với inventory đường dẫn/bảng nguồn, SHA-256 của tệp nguồn, kích thước,
      số lượng bản ghi, cảnh báo, và đường dẫn sao lưu.
      Đã hoàn tất: các lần thực thi migration legacy-state cũng lưu bền các hàng `migration_sources`
      để kiểm toán ở cấp nguồn và quyết định bỏ qua/backfill trong tương lai.
    - Làm cho apply có tính idempotent. Chạy lại sau một lần nhập một phần phải
      bỏ qua nguồn đã được nhập hoặc hợp nhất theo khóa ổn định.
      Đã hoàn tất: chỉ mục phiên, transcript, hàng đợi giao, plugin state, sổ cái task,
      và các hàng SQLite toàn cục do agent sở hữu nhập qua khóa ổn định hoặc
      ngữ nghĩa upsert/replace, nên các lần chạy lại hợp nhất mà không nhân đôi
      các hàng bền vững.
    - Các lần nhập thất bại phải giữ nguyên tệp nguồn ban đầu tại chỗ.
      Đã hoàn tất: các lần nhập transcript thất bại hiện để nguồn JSONL ban đầu tại
      đường dẫn đã phát hiện, và `migration_sources` ghi nguồn là
      `warning` với `removed_source=0` cho lần chạy doctor tiếp theo.

## Quy tắc hiệu năng

- Một kết nối cho mỗi thread/process là ổn; không chia sẻ handle giữa
  các worker.
- Dùng WAL, `foreign_keys=ON`, timeout bận 30 giây, và các transaction ghi `BEGIN IMMEDIATE`
  ngắn.
- Giữ các helper transaction ghi đồng bộ trừ khi/cho đến khi API transaction async
  thêm ngữ nghĩa mutex/backpressure tường minh.
- Giữ các thao tác ghi giao cha nhỏ và có transaction.
- Tránh ghi lại toàn bộ store; dùng upsert/delete ở cấp hàng.
- Thêm chỉ mục cho các đường dẫn list-by-agent, list-by-session, updated-at, run id, và
  expiration trước khi chuyển mã nóng.
- Lưu artifact lớn, media, và vector dưới dạng BLOB hoặc các hàng BLOB phân khúc, không phải
  base64 hoặc JSON mảng số.
- Giữ các mục plugin-state opaque nhỏ và có phạm vi.
- Thêm dọn dẹp SQL cho TTL/expiration thay vì cắt tỉa filesystem.
  Đã hoàn tất cho các store runtime do cơ sở dữ liệu sở hữu: media, plugin state, plugin blobs,
  persistent dedupe, và agent cache đều hết hạn qua các hàng SQLite. Phần dọn dẹp
  filesystem còn lại được giới hạn ở các materialization tạm thời hoặc lệnh
  xóa tường minh.

## Lệnh cấm tĩnh

Thêm một kiểm tra repo làm thất bại các thao tác ghi runtime mới vào đường dẫn trạng thái kế thừa:

- `sessions.json`
- `*.trajectory.jsonl` ngoại trừ các đầu ra support-bundle đã vật thể hóa
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- các tệp bộ nhớ đệm thời gian chạy `cache/*.json`
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
- các tệp JSON cầu nối `/tmp` của relay native hook
- `plugin-state/state.sqlite`
- các sidecar thời gian chạy `openclaw-state.sqlite` tùy biến
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
- trang trí hồ sơ trình duyệt `.openclaw-profile-decorated`
- trình mở phiên dựa trên tệp `SessionManager.open(...)`
- các facade liệt kê transcript `SessionManager.listAll(...)` và `TranscriptSessionManager.listAll(...)`
- các facade fork transcript `SessionManager.forkFromSession(...)` và
  `TranscriptSessionManager.forkFromSession(...)`
- các facade thay thế phiên có thể thay đổi `SessionManager.newSession(...)` và `TranscriptSessionManager.newSession(...)`
- các facade phiên nhánh `SessionManager.createBranchedSession(...)` và
  `TranscriptSessionManager.createBranchedSession(...)`

Lệnh cấm nên cho phép kiểm thử tạo fixture kế thừa và cho phép mã di trú
đọc/nhập/xóa các nguồn tệp kế thừa. Các sidecar SQLite chưa phát hành vẫn bị cấm
và không được cấp quyền nhập qua doctor.

## Tiêu chí hoàn tất

- Dữ liệu thời gian chạy và các lần ghi bộ nhớ đệm đi vào cơ sở dữ liệu SQLite toàn cục hoặc của tác tử.
- Thời gian chạy không còn ghi chỉ mục phiên, transcript JSONL, JSON sổ đăng ký sandbox,
  SQLite sidecar tác vụ, hoặc SQLite sidecar trạng thái Plugin. Các trình nhập SQLite sidecar tác vụ
  và trạng thái Plugin chưa phát hành bị xóa.
- Việc nhập tệp kế thừa chỉ diễn ra trong doctor.
- Sao lưu tạo một kho lưu trữ với các snapshot SQLite gọn nhẹ và bằng chứng toàn vẹn.
- Agent worker có thể chạy với ổ đĩa, vùng nháp VFS, hoặc
  bộ lưu trữ chỉ VFS thử nghiệm.
- Cấu hình và các tệp thông tin đăng nhập rõ ràng vẫn là các tệp điều khiển bền vững
  không phải cơ sở dữ liệu duy nhất được kỳ vọng.
- Các kiểm tra repo ngăn đưa lại các kho lưu trữ tệp thời gian chạy kế thừa.
