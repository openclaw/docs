---
read_when:
    - Di chuyển dữ liệu thời gian chạy, bộ nhớ đệm, bản chép lời, trạng thái tác vụ hoặc tệp tạm của OpenClaw vào SQLite
    - Thiết kế quá trình di chuyển bằng doctor từ các tệp JSON hoặc JSONL cũ
    - Thay đổi hành vi sao lưu, khôi phục, VFS hoặc lưu trữ worker
    - Xóa khóa phiên, tinh gọn, cắt ngắn hoặc các đường dẫn tương thích JSON
summary: Kế hoạch di chuyển để đưa SQLite trở thành lớp trạng thái bền vững và bộ nhớ đệm chính, đồng thời vẫn lưu cấu hình trong tệp
title: Tái cấu trúc trạng thái theo hướng ưu tiên cơ sở dữ liệu
x-i18n:
    generated_at: "2026-07-20T04:30:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e4ce692df8bfd031429b466166ce05d70ad0514a6628d9b3a69bf694c18a5914
    source_path: refactor/database-first.md
    workflow: 16
---

# Tái cấu trúc trạng thái theo hướng ưu tiên cơ sở dữ liệu

## Quyết định

Sử dụng bố cục SQLite hai cấp:

- Cơ sở dữ liệu toàn cục: `~/.openclaw/state/openclaw.sqlite`
- Cơ sở dữ liệu tác nhân: một cơ sở dữ liệu SQLite cho mỗi tác nhân dành cho không gian làm việc,
  bản ghi hội thoại, VFS, hiện vật và trạng thái thời gian chạy lớn thuộc sở hữu của tác nhân
- Cấu hình vẫn được lưu trữ bằng tệp: `openclaw.json` vẫn nằm ngoài
  cơ sở dữ liệu. Các hồ sơ xác thực thời gian chạy chuyển sang SQLite; các tệp
  thông tin xác thực của nhà cung cấp bên ngoài hoặc CLI vẫn do chủ sở hữu quản lý bên ngoài cơ sở dữ liệu của OpenClaw.

Cơ sở dữ liệu toàn cục là cơ sở dữ liệu của mặt phẳng điều khiển. Nó sở hữu việc khám phá tác nhân,
trạng thái Gateway dùng chung, ghép nối, trạng thái thiết bị/Node, sổ cái tác vụ và luồng, trạng thái Plugin,
trạng thái thời gian chạy của bộ lập lịch, siêu dữ liệu sao lưu và trạng thái di chuyển.

Cơ sở dữ liệu tác nhân là cơ sở dữ liệu của mặt phẳng dữ liệu. Nó sở hữu siêu dữ liệu phiên
của tác nhân, luồng sự kiện bản ghi hội thoại, không gian tên làm việc hoặc nháp VFS, hiện vật
công cụ, hiện vật lần chạy và dữ liệu bộ nhớ đệm cục bộ của tác nhân có thể tìm kiếm/lập chỉ mục.

Cách này cung cấp một chế độ xem toàn cục bền vững mà không buộc các không gian làm việc lớn của tác nhân,
bản ghi hội thoại và dữ liệu nháp nhị phân vào làn ghi Gateway dùng chung.

## Hợp đồng bắt buộc

Quá trình di chuyển này có một dạng thời gian chạy chuẩn duy nhất:

- Các hàng phiên chỉ duy trì siêu dữ liệu phiên. Chúng không được duy trì
  `transcriptLocator`, đường dẫn tệp bản ghi hội thoại, đường dẫn JSONL liên quan, đường dẫn khóa,
  siêu dữ liệu cắt tỉa hoặc con trỏ tương thích từ thời kỳ dùng tệp.
- Danh tính bản ghi hội thoại luôn là danh tính SQLite: `{agentId, sessionId}` cộng với
  siêu dữ liệu chủ đề tùy chọn khi giao thức cần.
- `sqlite-transcript://...` không phải là danh tính thời gian chạy hoặc giao thức. Mã mới không được
  suy ra, duy trì, truyền, phân tích cú pháp hoặc di chuyển bộ định vị bản ghi hội thoại. Thời gian chạy và
  kiểm thử hoàn toàn không được chứa bộ định vị giả; tài liệu chỉ có thể đề cập chuỗi này
  để cấm sử dụng.
- `sessions.json` cũ, JSONL bản ghi hội thoại, `.jsonl.lock`, việc cắt tỉa, rút gọn
  và logic đường dẫn phiên cũ chỉ thuộc về đường dẫn di chuyển/nhập của doctor.
- Các bí danh cấu hình phiên cũ chỉ thuộc về quá trình di chuyển của doctor. Thời gian chạy
  không diễn giải `session.idleMinutes`, `session.resetByType.dm` hoặc
  bí danh phiên chính `agent:main:*` xuyên tác nhân cho một tác nhân được cấu hình khác.
- Danh tính định tuyến phiên là trạng thái quan hệ có kiểu. Các đường dẫn thời gian chạy nóng và UI
  phải đọc `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` và
  `session_conversations`; chúng không được phân tích cú pháp `session_key` hoặc khai thác
  `session_entries.entry_json` để lấy danh tính nhà cung cấp, ngoại trừ dưới dạng bản sao tương thích
  trong khi các vị trí gọi cũ đang được xóa.
- Các dấu hiệu tin nhắn trực tiếp cấp kênh như `dm` so với `direct` là từ vựng
  định tuyến, không phải bộ định vị bản ghi hội thoại hoặc phần xử lý tương thích kho tệp.
- Cấu hình trình xử lý hook cũ chỉ thuộc về các bề mặt cảnh báo/di chuyển của doctor.
  Thời gian chạy không được tải `hooks.internal.handlers`; hook chỉ chạy thông qua các
  thư mục hook đã được khám phá và siêu dữ liệu `HOOK.md`.
- Khởi động thời gian chạy, đường dẫn trả lời nóng, Compaction, đặt lại, khôi phục, chẩn đoán,
  TTS, hook bộ nhớ, tác nhân con, định tuyến lệnh Plugin, ranh giới giao thức và
  hook phải truyền `{agentId, sessionId}` xuyên suốt thời gian chạy.
- Kiểm thử phải tạo dữ liệu ban đầu và xác nhận các hàng bản ghi hội thoại SQLite thông qua
  `{agentId, sessionId}`. Các kiểm thử chỉ chứng minh việc chuyển tiếp đường dẫn JSONL,
  bảo toàn bộ định vị do bên gọi cung cấp hoặc tương thích tệp bản ghi hội thoại phải
  bị xóa, trừ khi chúng bao phủ việc nhập của doctor, quá trình vật chất hóa tài liệu
  hỗ trợ/gỡ lỗi ngoài phiên hoặc dạng giao thức.
- `runEmbeddedPiAgent(...)`, các lần chạy worker đã chuẩn bị và lần thử nhúng
  bên trong không được chấp nhận bộ định vị bản ghi hội thoại. Chúng mở trình quản lý bản ghi hội thoại SQLite
  bằng `{agentId, sessionId}` và truyền trình quản lý đó cho phiên tác nhân tương thích PI
  đã được nội bộ hóa, để các bên gọi cũ không thể khiến runner ghi bản ghi hội thoại
  JSON/JSONL.
- Chẩn đoán runner phải lưu các bản ghi dấu vết thời gian chạy/bộ nhớ đệm/payload trong SQLite.
  Chẩn đoán thời gian chạy không được công khai các núm ghi đè tệp JSONL hoặc trình trợ giúp
  xuất JSONL bản ghi hội thoại dùng chung; các tác vụ xuất hướng đến người dùng có thể vật chất hóa các
  hiện vật tường minh từ các hàng cơ sở dữ liệu mà không đưa tên tệp trở lại thời gian chạy.
- Ghi nhật ký luồng thô sử dụng `OPENCLAW_RAW_STREAM=1` cùng với các hàng chẩn đoán SQLite.
  Hợp đồng trình ghi nhật ký tệp pi-mono cũ gồm `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` và
  `raw-openai-completions.jsonl` không thuộc thời gian chạy hoặc kiểm thử của OpenClaw.
- Việc lập chỉ mục bộ nhớ QMD không được xuất bản ghi hội thoại SQLite sang các tệp markdown.
  QMD chỉ lập chỉ mục các tệp bộ nhớ đã cấu hình; tìm kiếm bản ghi hội thoại phiên vẫn
  dựa trên SQLite.
- Đường dẫn con SDK QMD chỉ dành cho QMD trong mã mới. Các trình trợ giúp lập chỉ mục bản ghi hội thoại
  phiên SQLite nằm trên `memory-core-host-engine-session-transcripts`; mọi hoạt động tái xuất
  QMD chỉ nhằm mục đích tương thích và mã thời gian chạy không được sử dụng.
- Các chỉ mục bộ nhớ tích hợp nằm trong cơ sở dữ liệu của tác nhân sở hữu chúng. Cấu hình thời gian chạy và
  hợp đồng thời gian chạy đã phân giải không được công khai `memorySearch.store.path`; doctor
  xóa khóa cấu hình cũ đó và mã hiện tại truyền
  `databasePath` của tác nhân trong nội bộ.

Công việc triển khai phải tiếp tục xóa mã cho đến khi các tuyên bố này đúng
mà không có ngoại lệ nào ngoài các ranh giới doctor/nhập/xuất/gỡ lỗi.

## Trạng thái mục tiêu và tiến độ

### Mục tiêu bắt buộc

- Một cơ sở dữ liệu SQLite toàn cục sở hữu trạng thái mặt phẳng điều khiển:
  `state/openclaw.sqlite`.
- Một cơ sở dữ liệu SQLite cho mỗi tác nhân sở hữu trạng thái mặt phẳng dữ liệu:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Cấu hình vẫn được lưu trữ bằng tệp. `openclaw.json` không thuộc phạm vi tái cấu trúc
  cơ sở dữ liệu này.
- Các tệp cũ chỉ là đầu vào di chuyển của doctor.
- Thời gian chạy không bao giờ ghi hoặc đọc JSONL phiên hay bản ghi hội thoại dưới dạng trạng thái đang hoạt động.

### Các trạng thái mục tiêu

- `not-started`: mã thời gian chạy từ thời kỳ dùng tệp vẫn ghi trạng thái đang hoạt động.
- `migrating`: mã doctor/nhập có thể chuyển dữ liệu tệp vào SQLite.
- `dual-read`: cầu nối tạm thời đọc cả SQLite và tệp cũ. Trạng thái này
  bị cấm đối với lần tái cấu trúc này, trừ khi được ghi rõ là chỉ dành cho
  doctor.
- `sqlite-runtime`: thời gian chạy chỉ đọc và ghi SQLite.
- `clean`: các API thời gian chạy và kiểm thử cũ bị xóa, đồng thời bộ bảo vệ ngăn
  lỗi tái diễn.
- `done`: tài liệu, kiểm thử, sao lưu, di chuyển doctor và các bước kiểm tra thay đổi chứng minh
  trạng thái sạch.

### Trạng thái hiện tại

- Phiên: `clean` cho thời gian chạy. Các hàng phiên nằm trong cơ sở dữ liệu cho mỗi tác nhân,
  API thời gian chạy sử dụng `{agentId, sessionId}` hoặc `{agentId, sessionKey}`, còn
  `sessions.json` là đầu vào cũ chỉ dành cho doctor.
- Bản ghi hội thoại: `clean` cho thời gian chạy. Các sự kiện, danh tính, bản chụp
  và sự kiện thời gian chạy quỹ đạo của bản ghi hội thoại nằm trong cơ sở dữ liệu cho mỗi tác nhân. Thời gian chạy không
  còn chấp nhận bộ định vị bản ghi hội thoại hoặc đường dẫn JSONL bản ghi hội thoại.
- Runner PI nhúng: `clean`. Các lần chạy PI nhúng, worker đã chuẩn bị, Compaction
  và vòng lặp thử lại sử dụng phạm vi phiên SQLite và từ chối các phần xử lý bản ghi hội thoại cũ.
- Cron: `clean` cho thời gian chạy. Thời gian chạy sử dụng `cron_jobs` và `task_runs` thuộc sở hữu của cron;
  kiểm thử thời gian chạy sử dụng cách đặt tên `storeKey` của SQLite, còn các đường dẫn cron từ thời kỳ dùng tệp chỉ còn trong
  kiểm thử di chuyển cũ của doctor.
- Sổ đăng ký tác vụ: `clean`. Các hàng thời gian chạy của tác vụ và Luồng tác vụ nằm trong
  `state/openclaw.sqlite`; các trình nhập SQLite sidecar chưa phát hành đã bị xóa.
- Trạng thái Plugin: `clean`. Các hàng trạng thái/blob của Plugin nằm trong cơ sở dữ liệu
  toàn cục dùng chung; các trình trợ giúp SQLite sidecar trạng thái Plugin cũ được bảo vệ để ngăn sử dụng.
- Bộ nhớ: `sqlite-runtime` cho bộ nhớ tích hợp và lập chỉ mục bản ghi hội thoại phiên.
  Các bảng chỉ mục bộ nhớ nằm trong cơ sở dữ liệu cho mỗi tác nhân, trạng thái bộ nhớ Plugin sử dụng
  các hàng trạng thái Plugin dùng chung, còn các tệp bộ nhớ cũ là đầu vào di chuyển của doctor
  hoặc nội dung không gian làm việc của người dùng.
- Sao lưu: `sqlite-runtime`. Quá trình sao lưu chuẩn bị các bản chụp SQLite đã thu gọn, bỏ qua
  các sidecar WAL/SHM đang hoạt động, xác minh tính toàn vẹn SQLite và ghi lại các lần sao lưu trong
  cơ sở dữ liệu toàn cục.
- Thiết lập không gian làm việc: `sqlite-runtime`. Trạng thái hoàn tất thiết lập, chứng thực không gian làm việc
  và hàm băm bootstrap đã tạo nằm trong các bảng SQLite dùng chung có kiểu. Thời gian chạy
  không đọc hoặc ghi JSON không gian làm việc đã ngừng sử dụng và các sidecar `.attested`;
  Doctor sở hữu việc nhập đã xác thực và xóa đã kiểm chứng chúng.
- Di chuyển doctor: `migrating`, theo chủ đích. Doctor nhập JSON,
  JSONL và các kho sidecar đã ngừng sử dụng vào SQLite, ghi lại các lần chạy/nguồn di chuyển
  và xóa các nguồn đã xử lý thành công.
- Phê duyệt thực thi: `file-runtime`. TypeScript và macOS vẫn đọc và ghi
  `exec-approvals.json` của thư mục trạng thái đang hoạt động; lược đồ
  `exec_approvals_config` dành riêng chưa có chủ sở hữu thời gian chạy. Lần chuyển đổi trong tương lai phải
  bổ sung việc nhập doctor trong cùng trạng thái và di chuyển cả hai thời gian chạy cùng nhau.
- Tập lệnh E2E: `clean` cho phạm vi bao phủ thời gian chạy. Quá trình tạo dữ liệu ban đầu Docker MCP ghi các hàng SQLite.
  Tập lệnh Docker ngữ cảnh thời gian chạy chỉ tạo JSONL cũ bên trong
  dữ liệu ban đầu cho quá trình di chuyển của doctor và đặt tên rõ ràng cho đường dẫn chỉ mục phiên cũ.

### Công việc còn lại

- [x] Đổi tên các biến kho kiểm thử thời gian chạy cron để không còn dùng `storePath`, trừ khi
      chúng là đầu vào cũ của doctor.
      Tệp: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Bằng chứng: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Xóa hoặc đổi tên các mock kiểm thử xuất từ thời kỳ dùng tệp đã lỗi thời.
      Tệp: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Bằng chứng: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Làm rõ rằng dữ liệu JSONL cũ được tạo ban đầu cho ngữ cảnh thời gian chạy Docker chỉ dành cho doctor.
      Tệp: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Bằng chứng: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` chỉ hiển thị
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Giữ cho các kiểu được Kysely tạo ra đồng bộ sau mọi thay đổi lược đồ.
      Tệp: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Bằng chứng: không có thay đổi lược đồ trong lượt này; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Chạy lại các kiểm thử tập trung cho các kho, lệnh và tập lệnh đã chỉnh sửa.
      Bằng chứng: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-session.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Trước khi tuyên bố `done`, chạy cổng kiểm tra thay đổi hoặc kiểm chứng rộng từ xa.
      Bằng chứng: `pnpm check:changed --timed -- <changed extension paths>` đã vượt qua trong
      lần chạy Hetzner Crabbox `run_3f1cabf6b25c` sau khi thiết lập tạm thời Node 24/pnpm và
      định tuyến đường dẫn tường minh cho không gian làm việc đã đồng bộ không có `.git`.

### Không được tái diễn

- Không có bộ định vị bản ghi hội thoại.
- Không có tệp phiên đang hoạt động.
- Không có fixture kiểm thử JSONL giả, ngoại trừ kiểm thử di chuyển dữ liệu cũ của doctor.
- Không truy cập SQLite thô ở nơi cần dùng Kysely.
- Không có quá trình di chuyển cơ sở dữ liệu mới từ thời kỳ dùng tệp. Lược đồ toàn cục vẫn ở phiên bản `1`.
  Lược đồ phiên bản `1` cho mỗi tác nhân đã phát hành có một quá trình di chuyển thời gian chạy giới hạn sang
  phiên bản `2` để duy trì danh tính nguồn bộ nhớ ổn định.

## Các giả định khi đọc mã

Không có quyết định sản phẩm tiếp theo nào cản trở kế hoạch này. Việc triển khai phải
tiến hành với các giả định sau:

- Sử dụng trực tiếp `node:sqlite` và yêu cầu runtime Node an toàn khi đặt lại WAL
  (22.22.3+, 24.15+, hoặc 25.9+) cho đường dẫn lưu trữ này.
- Chỉ giữ đúng một tệp cấu hình thông thường. Không chuyển cấu hình, manifest của plugin
  hoặc workspace Git vào SQLite trong đợt tái cấu trúc này.
- Không cần các tệp tương thích runtime. Các tệp JSON và JSONL cũ chỉ là
  đầu vào di chuyển. Các sidecar SQLite cục bộ theo nhánh chưa từng được phát hành và bị
  xóa thay vì nhập.
- `openclaw doctor --fix` chịu trách nhiệm di chuyển từ tệp cũ sang cơ sở dữ liệu. Quá trình khởi động
  runtime chỉ chịu trách nhiệm cho các nâng cấp có giới hạn giữa các phiên bản lược đồ SQLite đã phát hành;
  quá trình này không được nhập trạng thái từ thời kỳ dùng tệp.
- Khả năng tương thích thông tin xác thực tuân theo cùng quy tắc: thông tin xác thực runtime nằm trong
  SQLite. Các tệp `auth-profiles.json` cũ, `auth.json` theo từng agent và
  `credentials/oauth.json` dùng chung là đầu vào di chuyển của doctor, rồi bị xóa
  sau khi nhập.
- Trạng thái danh mục mô hình được tạo dựa trên cơ sở dữ liệu. Mã runtime không được ghi
  `agents/<agentId>/agent/models.json`; các tệp `models.json` hiện có là đầu vào cũ
  của doctor và bị xóa sau khi nhập vào `agent_model_catalogs`.
- Runtime không được di chuyển, chuẩn hóa hoặc tạo cầu nối cho các bộ định vị bản ghi hội thoại. Danh tính
  bản ghi hội thoại đang hoạt động là `{agentId, sessionId}` trong SQLite. Đường dẫn tệp chỉ là
  đầu vào cũ của doctor, và `sqlite-transcript://...` phải biến mất khỏi
  các bề mặt runtime, giao thức, hook và plugin thay vì được xem là một
  handle biên.
- Hoạt động đọc bản ghi hội thoại SQLite trong runtime không chạy các bước di chuyển hình dạng mục JSONL cũ hoặc
  ghi lại toàn bộ bản ghi hội thoại để đảm bảo tương thích. Việc chuẩn hóa mục cũ chỉ nằm trong
  các tiện ích doctor/nhập rõ ràng. Doctor chuẩn hóa các tệp bản ghi hội thoại JSONL cũ
  trước khi chèn các hàng SQLite; các hàng runtime hiện tại
  đã được ghi theo lược đồ bản ghi hội thoại hiện tại. Việc xuất quỹ đạo/phiên
  đọc nguyên trạng các hàng đó và không được thực hiện di chuyển dữ liệu cũ tại thời điểm xuất.
- Các trình trợ giúp phân tích/di chuyển JSONL bản ghi hội thoại cũ chỉ dành cho doctor. Mã định dạng
  bản ghi hội thoại runtime chỉ xây dựng ngữ cảnh bản ghi hội thoại SQLite hiện tại; doctor
  chịu trách nhiệm nâng cấp các mục JSONL cũ trước khi chèn hàng.
- Trình trợ giúp phát luồng bản ghi hội thoại JSONL cũ do runtime sở hữu đã bị xóa. Mã nhập
  của doctor chịu trách nhiệm đọc rõ ràng các tệp cũ; lịch sử phiên runtime đọc
  các hàng SQLite.
- Các liên kết app-server của Codex sử dụng `sessionId` của OpenClaw làm khóa chuẩn
  trong không gian tên trạng thái plugin của Codex. `sessionKey` là siêu dữ liệu để
  định tuyến/hiển thị và không được thay thế id phiên bền vững hoặc khôi phục
  danh tính tệp bản ghi hội thoại.
- Các công cụ ngữ cảnh nhận trực tiếp hợp đồng runtime hiện tại. Registry
  không được bọc các công cụ bằng shim thử lại có chức năng xóa `sessionKey`,
  `transcriptScope` hoặc `prompt`; các công cụ không thể chấp nhận tham số ưu tiên
  cơ sở dữ liệu hiện tại phải báo lỗi rõ ràng thay vì được tạo cầu nối.
- Đầu ra sao lưu phải vẫn là một tệp lưu trữ duy nhất. Nội dung cơ sở dữ liệu phải được đưa vào
  tệp lưu trữ đó dưới dạng snapshot SQLite nhỏ gọn, không phải các sidecar WAL đang hoạt động ở dạng thô.
- Tìm kiếm bản ghi hội thoại hữu ích nhưng không bắt buộc đối với phiên bản ưu tiên cơ sở dữ liệu
  đầu tiên. Thiết kế lược đồ để sau này có thể bổ sung FTS.
- Việc thực thi worker phải tiếp tục ở trạng thái thử nghiệm phía sau phần cài đặt trong khi ranh giới
  cơ sở dữ liệu ổn định dần.

## Kết quả đọc mã

Nhánh hiện tại đã vượt qua giai đoạn thử nghiệm ý tưởng. Cơ sở dữ liệu dùng chung
đã tồn tại, `node:sqlite` của Node được kết nối thông qua một trình trợ giúp runtime nhỏ, và
các kho lưu trữ trước đây hiện ghi vào `state/openclaw.sqlite` hoặc cơ sở dữ liệu
`openclaw-agent.sqlite` sở hữu chúng.

Công việc còn lại không phải là chọn SQLite; mà là giữ cho ranh giới mới gọn gàng
và xóa mọi giao diện mang hình dạng tương thích vẫn còn giống thế giới
dựa trên tệp cũ:

- `storePath` của phiên không còn là danh tính runtime, hình dạng fixture kiểm thử hoặc
  trường payload trạng thái. Các kiểm thử runtime và cầu nối không còn chứa tên hợp đồng
  `storePath`; mã doctor/di chuyển chịu trách nhiệm cho từ vựng cũ đó.
- Các thao tác ghi phiên không còn đi qua hàng đợi `store-writer.ts` nội bộ
  tiến trình cũ. Các thao tác ghi bản vá SQLite chuẩn bị bên ngoài giao dịch, sau đó sử dụng một giao dịch
  xác thực/áp dụng đồng bộ ngắn với cơ chế phát hiện xung đột rõ ràng.
- Việc khám phá đường dẫn cũ vẫn có các trường hợp sử dụng di chuyển hợp lệ, nhưng mã runtime phải
  ngừng xem `sessions.json` và các tệp JSONL bản ghi hội thoại là đích ghi khả dĩ.
- Các bảng do agent sở hữu nằm trong cơ sở dữ liệu SQLite theo từng agent. Cơ sở dữ liệu toàn cục giữ
  các hàng registry/mặt phẳng điều khiển; danh tính bản ghi hội thoại là `{agentId, sessionId}` trong
  các hàng bản ghi hội thoại theo từng agent. Mã runtime không được lưu bền vững đường dẫn tệp bản ghi
  hội thoại hoặc di chuyển bộ định vị bản ghi hội thoại.
- Doctor đã nhập một số tệp cũ. Việc dọn dẹp nhằm biến quá trình đó thành một
  triển khai di chuyển rõ ràng duy nhất được doctor gọi, với một báo cáo
  di chuyển bền vững.

Không còn câu hỏi sản phẩm nào cản trở việc triển khai.

## Hình dạng mã hiện tại

Nhánh đã có một nền tảng SQLite dùng chung thực sự:

- Mức phiên bản runtime tối thiểu hiện yêu cầu bản dựng Node an toàn khi đặt lại WAL: 22.22.3+,
  24.15+ hoặc 25.9+. `package.json`, cơ chế bảo vệ runtime của CLI, các giá trị mặc định của trình cài đặt,
  trình định vị runtime macOS, CI và tài liệu cài đặt công khai đều thống nhất.
- `src/state/openclaw-state-db.ts` mở `openclaw.sqlite`, thiết lập WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` và áp dụng
  mô-đun lược đồ được tạo từ
  `src/state/openclaw-state-schema.sql`.
- Các kiểu bảng Kysely và mô-đun lược đồ runtime được tạo từ những
  cơ sở dữ liệu SQLite dùng một lần, được tạo từ các tệp `.sql` đã commit; mã runtime
  không còn duy trì các chuỗi lược đồ sao chép-dán cho cơ sở dữ liệu toàn cục, theo từng tác nhân hoặc
  cơ sở dữ liệu ghi lại proxy.
- Các kho lưu trữ runtime suy ra kiểu hàng được chọn và chèn từ những giao diện
  Kysely `DB` đã tạo đó thay vì tự tạo thủ công các hình dạng hàng SQLite trùng lặp. SQL thô
  vẫn chỉ giới hạn ở việc áp dụng lược đồ, pragma và DDL chỉ dành cho di chuyển.
- Lược đồ SQLite toàn cục vẫn ở `user_version = 1`. Lược đồ theo từng tác nhân
  ở phiên bản `2`; trình mở của nó di chuyển nguyên tử khóa nguồn bộ nhớ phiên bản `1`
  đã phát hành sang một danh tính số nguyên ổn định. Việc nhập từ tệp vào cơ sở dữ liệu
  vẫn nằm trong mã doctor.
- Quyền sở hữu quan hệ được thực thi tại nơi ranh giới sở hữu là chuẩn tắc:
  các hàng di chuyển nguồn xóa lan truyền từ `migration_runs`, trạng thái phân phối tác vụ
  xóa lan truyền từ `task_runs`, và các hàng danh tính bản chép lời xóa lan truyền từ
  các sự kiện bản chép lời.
- Các bảng dùng chung hiện tại bao gồm `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `workspace_path_aliases`, `workspace_attestations`,
  `workspace_generated_bootstrap_hashes`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` và `backup_runs`.
- Trạng thái tùy ý do plugin sở hữu không được cấp các bảng có kiểu do máy chủ sở hữu. Các
  plugin đã cài đặt sử dụng `plugin_state_entries` cho tải trọng JSON có phiên bản và
  `plugin_blob_entries` cho byte, với quyền sở hữu không gian tên/khóa, dọn dẹp TTL,
  sao lưu và các bản ghi di chuyển plugin. Trạng thái điều phối plugin do máy chủ sở hữu
  vẫn có thể có bảng có kiểu khi máy chủ sở hữu hợp đồng truy vấn, chẳng hạn như
  `plugin_binding_approvals`.
- Di chuyển plugin là di chuyển dữ liệu trên các không gian tên do plugin sở hữu, không phải di chuyển
  lược đồ máy chủ. Plugin có thể di chuyển các mục trạng thái/blob có phiên bản của riêng mình
  thông qua trình cung cấp di chuyển, và máy chủ ghi lại trạng thái nguồn/lần chạy trong
  sổ cái di chuyển thông thường. Các lượt cài đặt plugin mới không yêu cầu thay đổi
  `openclaw-state-schema.sql` trừ khi chính máy chủ đang tiếp nhận quyền sở hữu một
  hợp đồng liên plugin mới.
- `src/state/openclaw-agent-db.ts` mở
  `agents/<agentId>/agent/openclaw-agent.sqlite`, đăng ký cơ sở dữ liệu trong
  DB toàn cục và sở hữu các bảng phiên cục bộ của tác nhân, bản chép lời, VFS, cấu phần, bộ nhớ đệm
  và chỉ mục bộ nhớ. Hoạt động khám phá runtime dùng chung hiện đọc sổ đăng ký
  `agent_databases` có kiểu đã tạo thay vì triển khai lại truy vấn đó tại mỗi
  vị trí gọi.
- Cơ sở dữ liệu toàn cục và theo từng tác nhân ghi một hàng `schema_meta` với vai trò cơ sở dữ liệu,
  phiên bản lược đồ, dấu thời gian và ID tác nhân cho cơ sở dữ liệu tác nhân. DB toàn cục
  vẫn ở `user_version = 1`; DB theo từng tác nhân sử dụng phiên bản `2` sau lần
  di chuyển danh tính nguồn bộ nhớ có giới hạn.
- Danh tính phiên theo từng tác nhân hiện có bảng gốc `sessions` chuẩn tắc, được định khóa bằng
  `session_id`, với `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, dấu thời gian, trường hiển thị, siêu dữ liệu mô hình,
  ID bộ khung và liên kết cha/sinh dưới dạng các cột có thể truy vấn. `session_routes`
  là chỉ mục tuyến đang hoạt động duy nhất từ `session_key` đến
  `session_id` hiện tại, vì vậy khóa tuyến có thể chuyển sang một phiên bền vững mới mà không
  khiến các lượt đọc nóng phải chọn giữa những hàng `sessions.session_key` trùng lặp. Tải trọng cũ
  `session_entries.entry_json` có hình dạng tương thích được gắn vào
  gốc `session_id` bền vững bằng khóa ngoại; nó không còn là biểu diễn
  duy nhất của phiên ở cấp lược đồ.
- Danh tính cuộc hội thoại bên ngoài theo từng tác nhân cũng mang tính quan hệ:
  `conversations` lưu danh tính nhà cung cấp/tài khoản/cuộc hội thoại đã chuẩn hóa, và
  `session_conversations` liên kết một phiên OpenClaw với một hoặc nhiều cuộc hội thoại
  bên ngoài. Điều này bao quát các phiên DM chính dùng chung, nơi nhiều đối tác có thể
  được ánh xạ có chủ ý vào một phiên mà không khai báo sai trong `session_key`. SQLite cũng
  thực thi tính duy nhất cho danh tính nhà cung cấp tự nhiên để cùng một bộ
  kênh/tài khoản/loại/đối tác/luồng không thể phân nhánh qua nhiều ID cuộc hội thoại.
  Các đối tác trực tiếp trong phiên chính dùng chung được liên kết bằng vai trò `participant`, để một
  phiên OpenClaw có thể đại diện cho nhiều đối tác DM bên ngoài mà không hạ
  các đối tác cũ thành những hàng liên quan mơ hồ. `sessions.primary_conversation_id` vẫn
  trỏ đến đích phân phối có kiểu hiện tại. Các cột định tuyến/trạng thái đóng
  được thực thi bằng ràng buộc `CHECK` của SQLite thay vì chỉ dựa vào
  các union TypeScript.
  Phép chiếu phiên runtime xóa các bản sao định tuyến tương thích khỏi
  `session_entries.entry_json` trước khi áp dụng các cột phiên/cuộc hội thoại có kiểu,
  vì vậy tải trọng JSON cũ không thể khôi phục các đích phân phối.
  Tương tự, định tuyến thông báo của tác nhân con yêu cầu ngữ cảnh phân phối SQLite có kiểu;
  nó không còn dự phòng về các trường tuyến `SessionEntry` tương thích.
  Kế thừa phân phối tường minh `chat.send` của Gateway đọc ngữ cảnh phân phối SQLite có kiểu
  thay vì các trường tương thích `origin`/`last*`.
  `tools.effective` tương tự suy ra ngữ cảnh nhà cung cấp/tài khoản/luồng từ các hàng
  phân phối/định tuyến SQLite có kiểu, không phải từ các bản sao mục phiên `last*` cũ.
  Ngữ cảnh prompt sự kiện hệ thống dựng lại các trường kênh/đích/tài khoản/luồng từ
  các trường phân phối có kiểu thay vì các bản sao `origin`.
  Trình trợ giúp `deliveryContextFromSession` dùng chung và trình ánh xạ phiên sang cuộc hội thoại
  hiện hoàn toàn bỏ qua `SessionEntry.origin`; chỉ các trường phân phối có kiểu
  và hàng cuộc hội thoại quan hệ mới có thể tạo danh tính tuyến nóng.
  Quá trình chuẩn hóa mục phiên runtime loại bỏ `origin` trước khi duy trì hoặc
  chiếu `entry_json`, và siêu dữ liệu đầu vào ghi các trường kênh/trò chuyện
  có kiểu cùng các hàng cuộc hội thoại quan hệ thay vì tạo các bản sao nguồn gốc mới.
- Các sự kiện bản chép lời, ảnh chụp nhanh bản chép lời và sự kiện runtime quỹ đạo hiện
  tham chiếu gốc `sessions` chuẩn tắc theo từng tác nhân và xóa lan truyền khi xóa phiên.
  Các hàng danh tính/tính lũy đẳng của bản chép lời tiếp tục xóa lan truyền từ chính xác
  hàng sự kiện bản chép lời.
- Các chỉ mục lõi bộ nhớ hiện sử dụng các bảng cơ sở dữ liệu tác nhân tường minh
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` và
  `memory_embedding_cache`, trong đó `memory_index_state` theo dõi các thay đổi bản sửa đổi.
  Các chỉ mục phụ FTS/vector tùy chọn được đặt tên là `memory_index_chunks_fts` và
  `memory_index_chunks_vec` thay vì các bảng chung `meta`, `files`, `chunks`,
  `chunks_fts` hoặc `chunks_vec`. Các tên chuẩn tắc giữ nguyên hình dạng hàng
  đường dẫn/nguồn hiện tại và khả năng tương thích embedding tuần tự hóa. Các bảng này
  là bộ nhớ đệm dẫn xuất/tìm kiếm, không phải kho lưu trữ bản chép lời chuẩn tắc; có thể
  xóa và dựng lại chúng từ các tệp không gian làm việc bộ nhớ và các nguồn đã cấu hình.
  Việc mở một chỉ mục bộ nhớ tên chung đã phát hành sẽ di chuyển siêu dữ liệu, nguồn,
  phân đoạn và bộ nhớ đệm embedding của nó vào các bảng chuẩn tắc; các bảng FTS/vector
  dẫn xuất được dựng lại dưới tên chuẩn tắc.
- Trạng thái khôi phục lần chạy tác nhân con hiện nằm trong các hàng `subagent_runs` dùng chung có kiểu,
  với các khóa phiên con, bên yêu cầu và bộ điều khiển được lập chỉ mục. Tệp
  `subagents/runs.json` cũ chỉ là đầu vào dọn dẹp của Doctor. Các mục lần chạy của tệp này là
  trạng thái khôi phục tạm thời, vì vậy Doctor ghi biên nhận ngừng sử dụng và
  loại bỏ tệp mà không nhập. Vì tệp không thể chứng minh các mục của nó
  còn hoạt động hay đã cũ sau khi các hàng SQLite bị lược bỏ, người vận hành
  phải để các lần chạy đang hoạt động từ thời kỳ dùng tệp hoàn tất trước khi nâng cấp qua ranh giới này.
- Các liên kết cuộc hội thoại hiện tại giờ nằm trong các hàng
  `current_conversation_bindings` dùng chung có kiểu, được định khóa bằng ID cuộc hội thoại đã chuẩn hóa, với
  các cột tác nhân/phiên đích, loại cuộc hội thoại, trạng thái, thời hạn và siêu dữ liệu
  được lưu dưới dạng cột quan hệ thay vì bản ghi liên kết mờ đục bị trùng lặp.
  Khóa liên kết bền vững bao gồm loại cuộc hội thoại đã chuẩn hóa để
  các tham chiếu trực tiếp/nhóm/kênh không thể xung đột, và SQLite từ chối các giá trị
  loại/trạng thái liên kết không hợp lệ. Tệp
  `bindings/current-conversations.json` cũ chỉ là đầu vào di chuyển của doctor.
- Khôi phục hàng đợi phân phối hiện phủ các cột hàng đợi có kiểu dành cho kênh, đích,
  tài khoản, phiên, thử lại, lỗi, gửi qua nền tảng và trạng thái khôi phục lên
  JSON phát lại. `entry_json` giữ các tải trọng phát lại, hook và tải trọng
  định dạng, nhưng các cột có kiểu là nguồn có thẩm quyền cho định tuyến/trạng thái hàng đợi nóng.
- Các con trỏ khôi phục phiên gần nhất của TUI hiện nằm trong các hàng
  `tui_last_sessions` dùng chung có kiểu, được định khóa bằng phạm vi kết nối/phiên TUI đã băm.
  Runtime chỉ đọc và ghi SQLite, upsert nguyên tử từng phạm vi và
  loại trừ các phiên heartbeat. `openclaw doctor --fix` xác thực nghiêm ngặt
  tệp JSON TUI cũ, giữ các hàng SQLite mới hơn, xác minh kết quả chuẩn tắc
  và xóa tệp cũ không thay đổi thay vì để lại bản lưu trữ.
- Các hàm băm triển khai lệnh Discord hiện nằm trong kho SQLite trạng thái plugin
  dùng chung. Runtime chỉ đọc và ghi chính xác các khóa theo phạm vi ứng dụng. Doctor
  xóa tệp cũ có thể dựng lại `discord/command-deploy-cache.json`
  mà không nhập, vì vậy lần khởi động tiếp theo thực hiện một lần đối soát chuẩn tắc.
- Các tùy chọn TTS mặc định hiện nằm trong các hàng SQLite trạng thái plugin dùng chung, được định khóa dưới
  plugin `speech-core`. Tệp `settings/tts.json` cũ chỉ là đầu vào di chuyển của doctor;
  runtime không còn đọc hoặc ghi các tệp JSON tùy chọn TTS, và
  trình phân giải đường dẫn cũ nằm trong mô-đun di chuyển của doctor.
- Siêu dữ liệu đích bí mật hiện đề cập đến các kho thay vì giả định mọi
  đích thông tin xác thực đều là tệp cấu hình. `openclaw.json` vẫn là kho cấu hình;
  các đích hồ sơ xác thực sử dụng hàng SQLite `auth_profile_stores` có kiểu, trong đó
  thông tin xác thực theo hình dạng nhà cung cấp được giữ dưới dạng tải trọng JSON.
- Kiểm tra bí mật không còn quét các tệp `auth.json` theo từng tác nhân đã ngừng sử dụng. Doctor sở hữu
  việc cảnh báo, nhập và xóa tệp cũ đó.
- Các trình trợ giúp đường dẫn hồ sơ xác thực cũ hiện nằm trong mã kế thừa của doctor. Các trình trợ giúp đường dẫn
  hồ sơ xác thực lõi hiển thị danh tính kho xác thực SQLite và vị trí hiển thị,
  không phải các đường dẫn runtime `auth-profiles.json` hoặc `auth-state.json`.
- Các mô-đun runtime khôi phục lần chạy tác nhân con và bộ nhớ đệm khả năng mô hình OpenRouter
  hiện tách biệt trình đọc/ghi ảnh chụp nhanh SQLite khỏi các trình trợ giúp nhập JSON cũ
  chỉ dành cho doctor. Các khả năng OpenRouter sử dụng các hàng chung có kiểu
  `model_capability_cache` dưới `provider_id = "openrouter"` thay vì
  một blob bộ nhớ đệm mờ đục hoặc bảng máy chủ dành riêng cho nhà cung cấp. `taskName`
  của lần chạy tác nhân con được lưu trong cột `subagent_runs.task_name` có kiểu; bản sao
  `payload_json` là dữ liệu phát lại/gỡ lỗi, không phải nguồn cho các trường hiển thị nóng hoặc
  tra cứu.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` triển khai VFS SQLite
  trên bảng `vfs_entries` của cơ sở dữ liệu tác nhân. Các thao tác đọc thư mục, xuất đệ quy,
  xóa và đổi tên sử dụng các phạm vi tiền tố `(namespace, path)` đã lập chỉ mục
  thay vì quét toàn bộ không gian tên hoặc dựa vào đối sánh đường dẫn `LIKE`.
- `src/agents/runtime-worker.entry.ts` tạo các kho SQLite VFS, hiện vật công cụ,
  hiện vật lượt chạy và bộ nhớ đệm có phạm vi cho từng lượt chạy của worker.
- Trạng thái hoàn tất khởi tạo workspace, độ mới của chứng thực và các hàm băm khởi tạo
  đã tạo giờ nằm trong các hàng `workspace_setup_state`,
  `workspace_path_aliases`, `workspace_attestations` và
  `workspace_generated_bootstrap_hashes` dùng chung có kiểu, được định danh bằng danh tính
  workspace chuẩn. Các bí danh từ vựng và đường dẫn thực được lưu bền vững giúp cơ chế
  bảo vệ workspace đã biến mất duy trì ổn định sau khi một symlink đã cấu hình biến mất; các bí danh
  được trỏ lại sẽ đóng khi lỗi. Runtime không còn đọc hoặc ghi
  `openclaw-workspace-state.json`, `.openclaw/workspace-state.json`, `workspace-attestations/*.attested`
  trong thư mục trạng thái hoặc các tệp sidecar `<workspace>.attested`
  cùng cấp. `openclaw doctor --fix` xác thực và tiếp nhận các nguồn cũ,
  nhập chúng vào SQLite kèm biên nhận di chuyển, xác minh các hàng chuẩn
  và chỉ sau đó mới xóa các tệp đã tiếp nhận.
- Lược đồ dùng chung dành riêng một hàng singleton `exec_approvals_config`, nhưng việc
  chuyển đổi runtime vẫn đang chờ xử lý. TypeScript và ứng dụng đồng hành trên macOS vẫn sử dụng
  tệp JSON theo phạm vi trạng thái và phải cùng chuyển sang SQLite.
- Danh tính thiết bị TypeScript giờ sử dụng các hàng `device_identities` có kiểu, trong đó
  việc nhập JSON cũ chỉ dành cho doctor được giữ bên ngoài chủ sở hữu runtime. Xác thực thiết bị
  vẫn dựa trên tệp trong khi chờ một lược đồ được phối hợp và quá trình di chuyển xuyên runtime;
  `device_auth_tokens` vẫn được dành riêng cho phần tiếp nối đó.
- Bộ nhớ đệm trao đổi token GitHub Copilot sử dụng bảng trạng thái Plugin SQLite dùng chung
  dưới `github-copilot/token-cache/default`. Đây là trạng thái bộ nhớ đệm thuộc sở hữu của nhà cung cấp,
  nên chủ ý không thêm bảng lược đồ máy chủ.
- Compaction của GitHub Copilot không còn ghi các tệp sidecar workspace
  `openclaw-compaction-*.json`. Harness gọi RPC Compaction lịch sử của SDK cho
  phiên SDK đang được theo dõi, còn OpenClaw giữ trạng thái phiên/bản chép lời bền vững trong
  SQLite thay vì các tệp đánh dấu tương thích.
- Runtime Swift dùng chung (`OpenClawKit`) sử dụng cùng
  hình dạng `state/openclaw.sqlite#table/device_identities` và các khóa hàng cho danh tính
  thiết bị. Các tệp cũ trong vùng chứa Apple được chủ sở hữu di chuyển Swift nhập
  vì Doctor TypeScript không thể truy cập các vùng chứa đó. Xác thực thiết bị Swift
  vẫn dựa trên tệp cho phần tiếp nối xác thực được phối hợp.
- Danh tính thiết bị Android và xác thực thiết bị được lưu đệm vẫn là các kho cục bộ của ứng dụng. Chúng
  yêu cầu một quá trình di chuyển riêng thuộc sở hữu của Android; các tuyên bố SQLite của máy chủ không
  mô tả hành vi Android hiện tại.
- Lịch sử gói gần đây của thông báo Android sử dụng các hàng
  `android_notification_recent_packages` có kiểu. Runtime không còn di chuyển hoặc
  đọc các khóa CSV SharedPreferences cũ.
- Việc tạo danh tính thiết bị sẽ đóng khi lỗi nếu `identity/device.json` cũ
  tồn tại, nếu hàng danh tính SQLite không hợp lệ hoặc nếu không thể mở kho danh tính
  SQLite. Doctor nhập rồi xóa tệp đó trước, do đó quá trình khởi động runtime
  không thể âm thầm xoay vòng danh tính ghép nối trước khi di chuyển.
- Lựa chọn danh tính thiết bị là một khóa hàng SQLite, không phải trình định vị tệp JSON. Các bài kiểm thử
  và trình trợ giúp Gateway truyền các khóa danh tính tường minh; chỉ quá trình di chuyển của doctor và
  cổng khởi động đóng khi lỗi mới biết tên tệp `identity/device.json` đã ngừng dùng.
- Khả năng tương thích khi đặt lại phiên giờ nằm trong quá trình di chuyển cấu hình của doctor:
  `session.idleMinutes` được chuyển vào `session.reset.idleMinutes`,
  `session.resetByType.dm` được chuyển vào `session.resetByType.direct`, và chính sách
  đặt lại runtime chỉ đọc các khóa đặt lại chuẩn.
- Khả năng tương thích cấu hình cũ giờ nằm dưới `src/commands/doctor/`. Quá trình
  xác thực `readConfigFileSnapshot()` thông thường không nhập các bộ phát hiện cũ của doctor
  hoặc chú thích các sự cố cũ; `runDoctorConfigPreflight()` thêm các sự cố đó để
  doctor sửa chữa/báo cáo. Luồng cấu hình doctor nhập
  `src/commands/doctor/legacy-config.ts`, còn việc sửa chữa ID hồ sơ OAuth cũ nằm
  dưới
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Các lệnh không phải doctor không tự động chạy sửa chữa cấu hình cũ. Ví dụ,
  `openclaw update --channel` giờ thất bại khi cấu hình cũ không hợp lệ và yêu cầu
  người dùng chạy doctor, thay vì âm thầm nhập mã di chuyển của doctor.
- Web push, APNs, Voice Wake, kiểm tra cập nhật và tình trạng cấu hình giờ sử dụng các bảng SQLite dùng chung
  có kiểu cho đăng ký, khóa VAPID, đăng ký Node, hàng kích hoạt,
  hàng định tuyến, trạng thái thông báo cập nhật và mục tình trạng cấu hình thay vì
  toàn bộ blob JSON mờ đục. Các thao tác ghi Web Push và APNs chỉ upsert hàng
  khóa chính bị ảnh hưởng; tình trạng cấu hình đối soát theo đường dẫn cấu hình. Các mô-đun runtime
  của chúng vẫn tách biệt với các trình trợ giúp nhập JSON cũ chỉ dành cho Doctor.
- Runtime APNs chỉ đọc và ghi `apns_registrations`. Lệnh
  `openclaw doctor --fix` tường minh nhập nghiêm ngặt
  `push/apns-registrations.json` đã ngừng dùng, bảo toàn các hàng chuẩn hiện có, xác minh
  giao dịch, ghi lại biên nhận và xóa JSON chứa bí mật.
  Các lần thử lại dựa trên biên nhận chỉ thực hiện dọn dẹp, còn
  `apns_registration_tombstones` bao phủ các lần vô hiệu hóa trước lần sửa chữa đầu tiên, để
  các quyền cấp relay hoặc token thiết bị cũ không thể hồi sinh.
- Cấu hình máy chủ Node giờ sử dụng một hàng singleton có kiểu trong cơ sở dữ liệu SQLite dùng chung.
  Runtime đóng khi lỗi trong khi tệp `node.json` cũ hoặc một lần tiếp nhận bị gián đoạn
  vẫn còn; `openclaw doctor --fix` tường minh nhập nghiêm ngặt rồi xóa tệp đó
  trước khi runtime sử dụng bình thường.
- Ghép nối thiết bị/Node, ghép nối kênh, danh sách cho phép của kênh và trạng thái khởi tạo
  giờ sử dụng các hàng SQLite có kiểu thay vì toàn bộ blob JSON mờ đục. Các phê duyệt liên kết
  Plugin và trạng thái tác vụ Cron cũng tuân theo cách phân tách này: các mô-đun runtime cung cấp
  thao tác dựa trên SQLite và trình trợ giúp snapshot trung lập, còn các thao tác ghi snapshot
  ghép nối/khởi tạo cùng phê duyệt liên kết Plugin đối soát hàng theo khóa chính
  thay vì cắt ngắn bảng, trong khi doctor nhập/xóa các tệp JSON cũ thông qua
  các mô-đun `src/commands/doctor/legacy/*`.
- Các bản ghi Plugin đã cài đặt giờ nằm trong chỉ mục Plugin đã cài đặt của SQLite.
  Việc đọc/ghi cấu hình runtime không còn di chuyển hoặc giữ lại dữ liệu cấu hình do
  `plugins.installs` cũ tạo ra; doctor nhập hình dạng cấu hình cũ đó
  vào SQLite trước khi runtime sử dụng bình thường.
- Các snapshot khôi phục thông tin xác thực QQBot giờ nằm trong trạng thái Plugin SQLite dưới
  `qqbot/credential-backups`. Runtime không còn ghi
  `qqbot/data/credential-backup*.json`; hợp đồng doctor của QQBot nhập và
  lưu trữ các tệp sao lưu cũ đó từ thư mục trạng thái đang hoạt động.
- Lập kế hoạch tải lại Gateway so sánh các snapshot chỉ mục Plugin đã cài đặt của SQLite dưới
  một không gian tên diff `installedPluginIndex.installRecords.*` nội bộ. Các quyết định
  tải lại runtime không còn bọc các hàng đó trong những đối tượng cấu hình `plugins.installs`
  giả.
- Thông tin xác thực tài khoản Matrix giờ nằm trong trạng thái Plugin SQLite. Runtime chỉ đọc
  kho chuẩn đó; Doctor nhập, xác minh và lưu trữ các tệp
  `credentials/matrix/credentials*.json` đã ngừng dùng khi có thể phân giải tài khoản của chúng.
- Các mô-đun runtime ghép nối lõi và Cron không còn sử dụng các trình tạo đường dẫn JSON cũ.
  Trình trợ giúp SDK đường dẫn ghép nối đã ngừng dùng vẫn chỉ còn để tương thích khi di chuyển;
  quá trình di chuyển trạng thái của doctor sở hữu việc đọc và nhập tệp. Các mô-đun cũ
  thuộc sở hữu của Doctor tạo các đường dẫn nguồn `pending.json`, `paired.json`, `bootstrap.json` và
  `cron/jobs.json` chỉ cho kiểm thử nhập và di chuyển. Việc chuẩn hóa hình dạng tác vụ Cron
  cũ và nhập lịch sử JSONL nằm dưới
  `src/commands/doctor/cron/`; quá trình hoàn tất lịch sử SQLite cũ chạy khi
  mở cơ sở dữ liệu trạng thái.
- `src/commands/doctor/legacy/runtime-state.ts` nhập các tệp trạng thái JSON cũ,
  bao gồm cấu hình máy chủ Node, vào SQLite từ doctor. Các trình nhập tệp cũ mới
  vẫn nằm dưới `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` nhập trực tiếp các bản chép lời `sessions.json` và
  `*.jsonl` cũ vào SQLite rồi xóa các nguồn đã nhập thành công. Nó
  không còn đưa các bản chép lời cũ ở thư mục gốc qua vùng đệm
  `agents/<agentId>/sessions/*.jsonl` hoặc tạo đích JSONL chuẩn trước khi
  nhập.
- Các kiểm tra tình trạng toàn vẹn trạng thái của doctor không còn quét các thư mục phiên cũ hoặc
  cung cấp tùy chọn xóa JSONL mồ côi. Các tệp bản chép lời cũ chỉ là đầu vào di chuyển,
  và bước di chuyển sở hữu cả việc nhập lẫn xóa nguồn.
- Việc nhập registry sandbox cũ nằm dưới
  `src/commands/doctor/legacy/sandbox-registry.ts`; thao tác đọc và ghi registry sandbox
  đang hoạt động vẫn chỉ dùng SQLite.
- Việc sửa chữa tình trạng/nhập bản chép lời phiên cũ nằm dưới
  `src/commands/doctor/legacy/session-transcript-health.ts`; các mô-đun lệnh runtime
  không còn chứa mã phân tích bản chép lời JSONL hoặc sửa chữa nhánh đang hoạt động.

Các điểm nổi bật về việc hợp nhất/xóa đã hoàn tất:

- Trạng thái Plugin hiện sử dụng cơ sở dữ liệu `state/openclaw.sqlite` dùng chung. Trình nhập sidecar `plugin-state/state.sqlite` cũ cục bộ theo nhánh đã bị loại bỏ vì bố cục SQLite đó chưa từng được phát hành. Các trợ giúp thăm dò/kiểm thử báo cáo `databasePath` dùng chung thay vì để lộ đường dẫn SQLite dành riêng cho trạng thái Plugin.
- Các bảng thời gian chạy của tác vụ và luồng tác vụ hiện nằm trong cơ sở dữ liệu `state/openclaw.sqlite` dùng chung thay vì `tasks/runs.sqlite` và `tasks/flows/registry.sqlite`; các trình nhập sidecar cũ bị loại bỏ vì cùng lý do bố cục chưa được phát hành.
- `src/config/sessions/store.ts` không còn cần `storePath` cho siêu dữ liệu đầu vào, cập nhật tuyến hoặc thao tác đọc thời điểm cập nhật. Việc lưu bền lệnh, dọn dẹp phiên CLI, độ sâu tác tử con, ghi đè xác thực và danh tính phiên bản chép lời sử dụng các API hàng tác tử/phiên. Các thao tác ghi được áp dụng dưới dạng bản vá hàng SQLite với cơ chế thử lại khi xảy ra xung đột lạc quan.
- Việc phân giải đích phiên hiện để lộ các đích cơ sở dữ liệu theo từng tác tử, thay vì các đường dẫn `sessions.json` cũ. Gateway dùng chung, siêu dữ liệu ACP, sửa chữa tuyến của doctor và `openclaw sessions` liệt kê `agent_databases` cùng các tác tử đã cấu hình.
- Định tuyến phiên Gateway hiện sử dụng `resolveGatewaySessionDatabaseTarget`; đích được trả về mang `databasePath` và các khóa hàng SQLite ứng viên thay vì đường dẫn tệp kho phiên cũ.
- Các kiểu thời gian chạy phiên kênh hiện để lộ `{agentId, sessionKey}` cho thao tác đọc thời điểm cập nhật, siêu dữ liệu đầu vào và cập nhật tuyến gần nhất. Kiểu tương thích `saveSessionStore(storePath, store)` cũ đã bị loại bỏ.
- Các bề mặt phiên của thời gian chạy Plugin, API tiện ích mở rộng và SDK Plugin hiện để lộ các trợ giúp hàng phiên dựa trên SQLite thay vì các trợ giúp tương thích toàn bộ kho/tệp của phiên đang hoạt động. Các bản xuất tương thích của thư viện gốc chỉ còn khả dụng bên ngoài SDK Plugin cho các trình gọi nội bộ cũ và trình gọi di chuyển. Trợ giúp `resolveLegacySessionStorePath` cũ đã bị loại bỏ; việc tạo đường dẫn `sessions.json` cũ hiện chỉ nằm cục bộ trong các fixture di chuyển và kiểm thử.
- `src/config/sessions/session-entries.sqlite.ts` hiện lưu trữ các mục nhập phiên chuẩn tắc trong cơ sở dữ liệu theo từng tác tử và hỗ trợ bản vá đọc/upsert/xóa ở cấp hàng. Thao tác upsert/vá/xóa trong thời gian chạy không còn quét các biến thể chữ hoa chữ thường hoặc lược bỏ khóa bí danh cũ; doctor chịu trách nhiệm chuẩn hóa. Trợ giúp nhập JSON độc lập đã bị loại bỏ và quá trình di chuyển hợp nhất bằng cách upsert các hàng mới hơn thay vì thay thế toàn bộ bảng phiên. Các trợ giúp đọc/liệt kê/tải công khai chiếu siêu dữ liệu phiên nóng từ các hàng `sessions` và `conversations` có kiểu; `entry_json` là bản bóng tương thích/gỡ lỗi và có thể cũ hoặc không hợp lệ mà không làm mất danh tính phiên có kiểu hoặc ngữ cảnh phân phối.
- `src/config/sessions/delivery-info.ts` hiện phân giải ngữ cảnh phân phối từ các hàng `sessions` + `conversations` + `session_conversations` có kiểu theo từng tác tử. Nó không còn tái dựng danh tính phân phối thời gian chạy từ `session_entries.entry_json`; việc thiếu hàng hội thoại có kiểu là vấn đề di chuyển/sửa chữa của doctor, không phải phương án dự phòng thời gian chạy.
- Các quyết định đặt lại phiên đã lưu hiện ưu tiên siêu dữ liệu `sessions.session_scope`, `sessions.chat_type` và `sessions.channel` có kiểu. Việc phân tích cú pháp `sessionKey` chỉ còn dành cho các hậu tố luồng/chủ đề tường minh trên đích lệnh; việc phân loại đặt lại nhóm so với trực tiếp không còn xuất phát từ hình dạng khóa.
- Việc phân loại hiển thị danh sách/trạng thái phiên hiện sử dụng siêu dữ liệu trò chuyện có kiểu và loại phiên Gateway. Nó không còn coi các chuỗi con `:group:` hoặc `:channel:` bên trong `session_key` là thông tin nhóm/trực tiếp bền vững.
- Việc chọn chính sách trả lời im lặng hiện chỉ sử dụng loại hội thoại hoặc siêu dữ liệu bề mặt tường minh. Nó không còn phỏng đoán chính sách trực tiếp/nhóm từ các chuỗi con `session_key`.
- Việc phân giải mô hình hiển thị phiên hiện nhận mã định danh tác tử từ đích cơ sở dữ liệu phiên SQLite thay vì tách nó khỏi `session_key`.
- Việc bổ sung dữ liệu đích thông báo giữa các tác tử hiện chỉ sử dụng `sessions.list` `deliveryContext` có kiểu. Nó không còn khôi phục định tuyến kênh/tài khoản/luồng từ `origin` cũ, các trường `last*` được sao chiếu hoặc hình dạng `session_key`.
- Việc từ chối đích luồng của `sessions_send` hiện đọc siêu dữ liệu định tuyến SQLite có kiểu. Nó không còn từ chối hoặc chấp nhận đích bằng cách phân tích các hậu tố luồng từ khóa đích.
- Việc xác thực chính sách công cụ theo phạm vi nhóm hiện đọc định tuyến hội thoại SQLite có kiểu cho phiên hiện tại hoặc phiên được tạo. Nó không còn tin vào danh tính nhóm/kênh bằng cách giải mã `sessionKey`; các mã định danh nhóm do trình gọi cung cấp bị loại bỏ khi không có hàng phiên có kiểu xác nhận chúng.
- Việc khớp ghi đè mô hình kênh hiện sử dụng siêu dữ liệu hội thoại nhóm và hội thoại cha tường minh. Nó không còn giải mã mã định danh hội thoại cha từ `parentSessionKey`.
- Việc kế thừa ghi đè mô hình đã lưu hiện yêu cầu khóa phiên cha tường minh từ ngữ cảnh phiên có kiểu. Nó không còn suy ra các ghi đè của phiên cha từ hậu tố `:thread:` hoặc `:topic:` trong `sessionKey`.
- Trình bao bọc thông tin luồng phiên cũ và trình phân tích luồng Plugin đã tải đã bị loại bỏ; không mã thời gian chạy nào nhập `config/sessions/thread-info`.
- Trợ giúp hội thoại kênh không còn để lộ các cầu nối phân tích khóa phiên đầy đủ. Phần lõi vẫn chuẩn hóa mã định danh hội thoại thô do nhà cung cấp sở hữu thông qua `resolveSessionConversation(...)`, nhưng không tái dựng dữ kiện tuyến từ `sessionKey`.
- Hoạt động phân phối khi hoàn tất, chính sách gửi và bảo trì tác vụ không còn suy ra loại trò chuyện từ hình dạng `session_key`. Trình phân tích khóa loại trò chuyện cũ đã bị xóa; các đường dẫn này yêu cầu siêu dữ liệu phiên có kiểu, ngữ cảnh phân phối có kiểu hoặc từ vựng đích phân phối tường minh.
- Danh sách/trạng thái phiên, chẩn đoán, liên kết tài khoản phê duyệt, lọc Heartbeat TUI và tóm tắt mức sử dụng không còn khai thác `SessionEntry.origin` để lấy định tuyến nhà cung cấp/tài khoản/luồng/hiển thị. Các thao tác đọc `origin` thời gian chạy duy nhất còn lại là các khái niệm không thuộc phiên hoặc các đối tượng phân phối của lượt hiện tại.
- Việc tra cứu hội thoại gốc cho yêu cầu phê duyệt hiện đọc các hàng định tuyến phiên có kiểu theo từng tác tử. Nó không còn phân tích danh tính hội thoại kênh/nhóm/luồng từ `sessionKey`; thiếu siêu dữ liệu có kiểu là vấn đề di chuyển/sửa chữa.
- Payload sự kiện thay đổi phiên/trò chuyện/phiên của Gateway không còn lặp lại các bản bóng tuyến `SessionEntry.origin` hoặc `last*`; máy khách nhận `channel`, `chatType` và `deliveryContext` có kiểu.
- Việc phân giải phân phối Heartbeat giờ có thể nhận trực tiếp `deliveryContext` SQLite có kiểu, và thời gian chạy Heartbeat truyền hàng phân phối phiên theo từng tác tử thay vì dựa vào các bản bóng tương thích `session_entries` cho định tuyến hiện tại.
- Việc phân giải đích phân phối của tác tử cô lập Cron cũng bổ sung dữ liệu tuyến hiện tại từ hàng phân phối phiên có kiểu theo từng tác tử trước khi chuyển sang payload mục nhập tương thích làm phương án dự phòng.
- Việc phân giải nguồn thông báo của tác tử con hiện luồn ngữ cảnh phân phối phiên của bên yêu cầu có kiểu qua `loadRequesterSessionEntry` và ưu tiên hàng đó hơn các bản bóng tương thích `last*`/`deliveryContext`.
- Các bản cập nhật siêu dữ liệu phiên đầu vào hiện hợp nhất với hàng phân phối có kiểu theo từng tác tử trước; các trường phân phối `SessionEntry` cũ chỉ là phương án dự phòng khi không có hàng hội thoại có kiểu.
- Việc trích xuất phân phối khi khởi động lại/cập nhật hiện để `threadId` phân phối SQLite có kiểu được ưu tiên hơn các mảnh chủ đề/luồng được phân tích từ `sessionKey`; việc phân tích chỉ là phương án dự phòng cho các khóa cũ có hình dạng luồng.
- Các mã định danh kênh trong ngữ cảnh tác tử hook hiện ưu tiên danh tính hội thoại SQLite có kiểu, sau đó là siêu dữ liệu tin nhắn tường minh. Chúng không còn phân tích các mảnh nhà cung cấp/nhóm/kênh từ `sessionKey`.
- Việc kế thừa tuyến bên ngoài `chat.send` của Gateway hiện đọc siêu dữ liệu định tuyến phiên SQLite có kiểu thay vì suy luận phạm vi kênh/trực tiếp/nhóm từ các phần `sessionKey`. Các phiên theo phạm vi kênh chỉ kế thừa khi kênh phiên và loại trò chuyện có kiểu khớp với ngữ cảnh phân phối đã lưu; các phiên chính dùng chung giữ nguyên quy tắc CLI/không có siêu dữ liệu máy khách nghiêm ngặt hơn.
- Việc đánh thức bằng dấu hiệu khởi động lại và định tuyến tiếp tục hiện đọc các hàng phân phối/định tuyến SQLite có kiểu trước khi xếp hàng các lần đánh thức Heartbeat hoặc các lượt tiếp tục của tác tử đã định tuyến. Nó không còn tái dựng ngữ cảnh phân phối từ bản bóng JSON của mục nhập phiên.
- Việc phân giải ngữ cảnh `tools.effective` của Gateway hiện đọc các hàng phân phối/định tuyến SQLite có kiểu cho đầu vào nhà cung cấp, tài khoản, đích, luồng và chế độ trả lời. Nó không còn khôi phục các trường định tuyến nóng đó từ các bản bóng nguồn `session_entries.entry_json` đã cũ.
- Định tuyến tư vấn thoại thời gian thực hiện phân giải phân phối của phiên cha/cuộc gọi từ các hàng phiên SQLite có kiểu theo từng tác tử. Nó không còn chuyển sang các bản bóng tương thích `SessionEntry.deliveryContext` làm phương án dự phòng khi chọn tuyến tin nhắn tác tử nhúng.
- Chuyển tiếp Heartbeat khi tạo ACP và định tuyến luồng cha hiện đọc thông tin phân phối của phiên cha từ các hàng phiên SQLite có kiểu. Chúng không còn tái dựng ngữ cảnh phân phối của phiên cha từ các bản bóng mục nhập phiên tương thích.
- Việc bảo toàn tuyến phân phối phiên hiện tuân theo siêu dữ liệu trò chuyện có kiểu và các cột phân phối được lưu bền. Nó không còn trích xuất gợi ý kênh, dấu hiệu trực tiếp/chính hoặc hình dạng luồng từ `sessionKey`; các tuyến webchat nội bộ chỉ kế thừa đích bên ngoài khi SQLite đã có danh tính phân phối có kiểu/được lưu bền cho phiên.
- Việc trích xuất phân phối phiên chung hiện chỉ đọc đúng hàng phân phối phiên SQLite có kiểu. Nó không còn phân tích hậu tố luồng/chủ đề hoặc chuyển từ khóa có hình dạng luồng sang khóa phiên cơ sở làm phương án dự phòng.
- Điều phối trả lời, khôi phục dấu hiệu khởi động lại và định tuyến tư vấn thoại thời gian thực hiện sử dụng chính xác các hàng phiên/hội thoại SQLite có kiểu để định tuyến luồng. Chúng không còn khôi phục mã định danh luồng hoặc ngữ cảnh phân phối phiên cơ sở bằng cách phân tích các khóa phiên có hình dạng luồng.
- Việc giới hạn lịch sử PI nhúng hiện sử dụng phép chiếu định tuyến phiên SQLite có kiểu (`sessions` + `conversations` chính) cho nhà cung cấp, loại trò chuyện và danh tính đối tác. Nó không còn phân tích hình dạng nhà cung cấp, tin nhắn trực tiếp, nhóm hoặc luồng từ `sessionKey`.
- Việc suy luận phân phối của công cụ Cron hiện chỉ sử dụng phân phối tường minh hoặc ngữ cảnh phân phối có kiểu hiện tại. Nó không còn giải mã các đích kênh, đối tác, tài khoản hoặc luồng từ `agentSessionKey`.
- Các hàng phiên thời gian chạy không còn mang bí danh tuyến `lastProvider` cũ. Các trợ giúp và kiểm thử sử dụng các trường `lastChannel` và `deliveryContext` có kiểu; di chuyển của doctor là nơi duy nhất nên chuyển đổi các bí danh tuyến cũ hoặc các bản bóng `origin` được lưu bền.
- Các sự kiện bản chép lời, hàng VFS và hàng hiện vật công cụ hiện ghi vào cơ sở dữ liệu theo từng tác tử. Bảng ánh xạ tệp bản chép lời toàn cục chưa được phát hành đã bị loại bỏ; thay vào đó, doctor ghi lại các đường dẫn nguồn cũ trong các hàng di chuyển bền vững.
- Việc tra cứu bản chép lời trong thời gian chạy không còn quét độ lệch byte JSONL hoặc thăm dò các tệp bản chép lời cũ. Các đường dẫn trò chuyện/phương tiện/lịch sử của Gateway đọc các hàng bản chép lời từ SQLite; JSONL phiên giờ chỉ là đầu vào cũ của doctor, không phải trạng thái thời gian chạy hoặc định dạng xuất.
- Các quan hệ cha và nhánh của bản chép lời sử dụng siêu dữ liệu `parentTranscriptScope: {agentId, sessionId}` có cấu trúc trong tiêu đề bản chép lời SQLite, không dùng các chuỗi định vị `agent-db:...transcript_events...` giống đường dẫn.
- Hợp đồng trình quản lý bản chép lời không còn để lộ các hàm khởi tạo `create(cwd)` hoặc `continueRecent(cwd)` được lưu bền ngầm định. Các trình quản lý bản chép lời được lưu bền được mở với phạm vi `{agentId, sessionId}` tường minh; chỉ
  các trình quản lý trong bộ nhớ vẫn không bị ràng buộc phạm vi cho kiểm thử và các phép biến đổi bản ghi hội thoại thuần túy.
- Các API kho lưu trữ bản ghi hội thoại lúc chạy phân giải phạm vi SQLite, không phải đường dẫn hệ thống tệp. Trình trợ giúp `resolve...ForPath` cũ và các tùy chọn ghi `transcriptPath` không dùng đến đã bị loại bỏ khỏi các bên gọi lúc chạy.
- Việc phân giải phiên lúc chạy hiện sử dụng `{agentId, sessionId}` và không được suy ra các chuỗi `sqlite-transcript://<agent>/<session>` cho các ranh giới bên ngoài.
  Các đường dẫn JSONL tuyệt đối cũ chỉ là đầu vào di chuyển của doctor.
- Các bản ghi cầu nối trực tiếp của chuyển tiếp hook gốc hiện nằm trong các hàng `native_hook_relay_bridges` dùng chung, có kiểu và được lập khóa theo mã định danh chuyển tiếp. Runtime không còn ghi sổ đăng ký JSON `/tmp` hoặc các bản ghi chung không rõ cấu trúc cho những bản ghi cầu nối tồn tại ngắn này.
- `runEmbeddedPiAgent(...)` không còn tham số định vị bản ghi hội thoại.
  Các bộ mô tả worker đã chuẩn bị cũng bỏ qua bộ định vị bản ghi hội thoại. Trạng thái phiên lúc chạy và các lượt chạy tiếp nối trong hàng đợi mang `{agentId, sessionId}` thay vì các handle bản ghi hội thoại được suy ra.
- Compaction nhúng hiện lấy phạm vi SQLite từ `agentId` và `sessionId`.
  Các hook Compaction, lệnh gọi công cụ ngữ cảnh, ủy quyền CLI và phản hồi giao thức không được nhận các handle `sqlite-transcript://...` được suy ra. Mã xuất/gỡ lỗi có thể hiện thực hóa các tạo phẩm người dùng rõ ràng từ các hàng, nhưng không cung cấp đường dẫn xuất JSONL phiên chung hoặc đưa tên tệp trở lại danh tính lúc chạy.
- `/export-session` đọc các hàng bản ghi hội thoại từ SQLite và chỉ ghi chế độ xem HTML độc lập được yêu cầu. Trình xem nhúng không còn tái tạo hoặc tải xuống JSONL phiên từ các hàng đó.
- Việc ủy quyền công cụ ngữ cảnh không còn phân tích bộ định vị bản ghi hội thoại để khôi phục danh tính tác nhân. Ngữ cảnh lúc chạy đã chuẩn bị mang `agentId` đã phân giải vào bộ điều hợp Compaction tích hợp.
- Việc ghi lại bản ghi hội thoại và cắt ngắn kết quả công cụ trực tiếp hiện đọc và lưu trạng thái bản ghi hội thoại theo `{agentId, sessionId}` và không suy ra các bộ định vị tạm thời cho tải trọng sự kiện cập nhật bản ghi hội thoại.
- Bề mặt trình trợ giúp trạng thái bản ghi hội thoại không còn các biến thể dựa trên bộ định vị `readTranscriptState`, `replaceTranscriptStateEvents` hoặc `persistTranscriptStateMutation`. Các bên gọi lúc chạy phải sử dụng các API `{agentId, sessionId}`. Tiến trình nhập của doctor đọc các tệp cũ theo đường dẫn tệp rõ ràng và ghi các hàng SQLite; tiến trình này không di chuyển các chuỗi bộ định vị.
- Hợp đồng trình quản lý phiên lúc chạy không còn cung cấp `open(locator)`, `forkFrom(locator)` hoặc `setTranscriptLocator(...)`. Các trình quản lý phiên được lưu bền vững chỉ mở theo `{agentId, sessionId}`; các trình trợ giúp liệt kê/phân nhánh nằm trên API phiên và điểm kiểm tra hướng hàng thay vì facade trình quản lý bản ghi hội thoại.
- Các API trình đọc bản ghi hội thoại của Gateway ưu tiên phạm vi. Chúng nhận `{agentId, sessionId}` và không chấp nhận bộ định vị bản ghi hội thoại theo vị trí có thể vô tình trở thành danh tính lúc chạy. Việc phân tích bộ định vị bản ghi hội thoại đang hoạt động đã bị loại bỏ; các đường dẫn nguồn cũ chỉ được mã nhập của doctor đọc.
- Các sự kiện cập nhật bản ghi hội thoại cũng ưu tiên phạm vi. `emitSessionTranscriptUpdate` không còn chấp nhận chuỗi bộ định vị thuần và các listener định tuyến theo `{agentId, sessionId}` mà không phân tích handle.
- Hoạt động phát rộng thông báo phiên của Gateway phân giải khóa phiên từ phạm vi tác nhân/phiên, không phải từ bộ định vị bản ghi hội thoại. Bộ phân giải/bộ nhớ đệm cũ từ bộ định vị bản ghi hội thoại sang khóa phiên đã bị loại bỏ.
- SSE lịch sử phiên của Gateway lọc các bản cập nhật trực tiếp theo phạm vi tác nhân/phiên. Nó không còn chuẩn hóa các ứng viên bộ định vị bản ghi hội thoại, realpath hoặc danh tính bản ghi hội thoại có dạng tệp để quyết định liệu một luồng có nên nhận bản cập nhật hay không.
- Các hook vòng đời phiên không còn suy ra hoặc cung cấp bộ định vị bản ghi hội thoại trên `session_end`. Bên sử dụng hook nhận `sessionId`, `sessionKey`, mã định danh phiên tiếp theo và ngữ cảnh tác nhân; các tệp bản ghi hội thoại không thuộc hợp đồng vòng đời.
- Các hook đặt lại cũng không còn suy ra hoặc cung cấp bộ định vị bản ghi hội thoại. Tải trọng `before_reset` mang các thông báo SQLite đã khôi phục cùng lý do đặt lại, trong khi danh tính phiên vẫn nằm trong ngữ cảnh hook.
- Việc đặt lại bộ khung tác nhân không còn chấp nhận bộ định vị bản ghi hội thoại. Hoạt động điều phối đặt lại được giới hạn phạm vi theo `sessionId`/`sessionKey` cùng lý do.
- Các kiểu phiên tiện ích mở rộng tác nhân không còn cung cấp `transcriptLocator`; các tiện ích mở rộng nên dùng ngữ cảnh phiên và API lúc chạy thay vì truy cập danh tính bản ghi hội thoại có dạng tệp.
- Các hook Compaction của Plugin không còn cung cấp bộ định vị bản ghi hội thoại. Ngữ cảnh hook đã mang danh tính phiên và việc đọc bản ghi hội thoại phải thông qua các API nhận biết phạm vi SQLite thay vì các handle có dạng tệp.
- Các hook `before_agent_finalize` không còn cung cấp `transcriptPath`, bao gồm cả tải trọng chuyển tiếp hook gốc. Các hook hoàn tất chỉ sử dụng ngữ cảnh phiên.
- Phản hồi đặt lại của Gateway không còn tổng hợp bộ định vị bản ghi hội thoại trên mục trả về. Hoạt động đặt lại tạo các hàng bản ghi hội thoại SQLite, trả về mục phiên sạch và để quyền truy cập bản ghi hội thoại cho các trình đọc nhận biết phạm vi.
- Kết quả lượt chạy nhúng và Compaction không còn đưa bộ định vị bản ghi hội thoại ra cho việc hạch toán phiên. Compaction tự động chỉ cập nhật `sessionId` đang hoạt động, bộ đếm Compaction và siêu dữ liệu token.
- Kết quả lần thử nhúng không còn trả về `transcriptLocatorUsed` và kết quả `compact()` của công cụ ngữ cảnh không còn trả về bộ định vị bản ghi hội thoại.
  Các vòng lặp thử lại lúc chạy chỉ chấp nhận `sessionId` kế nhiệm.
- Kết quả nối thêm bản ghi hội thoại của bản sao phân phối không còn trả về bộ định vị bản ghi hội thoại. Bên gọi nhận `messageId` đã nối thêm; các tín hiệu cập nhật bản ghi hội thoại sử dụng phạm vi SQLite.
- Các trình trợ giúp phân nhánh phiên cha chỉ trả về `sessionId` đã phân nhánh. Quá trình chuẩn bị tác nhân con chuyển phạm vi tác nhân/phiên con cho các công cụ.
- Tham số trình chạy CLI và việc gieo lại lịch sử không còn chấp nhận bộ định vị bản ghi hội thoại.
  Hoạt động đọc lịch sử CLI phân giải phạm vi bản ghi hội thoại SQLite từ `{agentId,
sessionId}` và ngữ cảnh khóa phiên.
- Các fixture kiểm thử CLI và trình chạy nhúng hiện gieo và đọc các hàng bản ghi hội thoại SQLite theo mã định danh phiên thay vì giả vờ các phiên đang hoạt động là tệp `*.jsonl` hoặc chuyển chuỗi `sqlite-transcript://...` qua các tham số lúc chạy.
- Các sự kiện bảo vệ kết quả công cụ phiên được phát từ phạm vi phiên đã biết ngay cả khi trình quản lý trong bộ nhớ không có bộ định vị được suy ra. Các kiểm thử của nó không còn giả lập các tệp bản ghi hội thoại `/tmp/*.jsonl` đang hoạt động.
- Các trình trợ giúp BTW và điểm kiểm tra Compaction hiện đọc và phân nhánh các hàng bản ghi hội thoại theo phạm vi SQLite. Siêu dữ liệu điểm kiểm tra hiện chỉ lưu mã định danh phiên và mã định danh lá/mục; các bộ định vị được suy ra không còn được ghi vào tải trọng điểm kiểm tra.
- Tra cứu khóa bản ghi hội thoại của Gateway sử dụng phạm vi bản ghi hội thoại SQLite tại các ranh giới giao thức và không còn gọi realpath hoặc stat trên tên tệp bản ghi hội thoại.
- Hoạt động xoay vòng bản ghi hội thoại của Compaction tự động ghi trực tiếp các hàng bản ghi hội thoại kế nhiệm thông qua kho lưu trữ bản ghi hội thoại SQLite. Các hàng phiên chỉ giữ danh tính phiên kế nhiệm, không giữ đường dẫn JSONL bền vững hoặc bộ định vị đã lưu.
- Compaction của công cụ ngữ cảnh nhúng sử dụng các trình trợ giúp xoay vòng bản ghi hội thoại được đặt tên theo SQLite. Các kiểm thử xoay vòng không còn xây dựng đường dẫn JSONL kế nhiệm hoặc mô hình hóa phiên đang hoạt động dưới dạng tệp.
- Việc lưu giữ hình ảnh gửi đi được quản lý lập khóa bộ nhớ đệm thông báo bản ghi hội thoại từ số liệu thống kê bản ghi hội thoại SQLite thay vì các lệnh gọi stat của hệ thống tệp.
- Các khóa phiên lúc chạy và làn doctor `.jsonl.lock` độc lập cũ đã bị loại bỏ.
- Barrel lúc chạy của Microsoft Teams và SDK Plugin công khai không còn tái xuất trình trợ giúp khóa tệp cũ; các đường dẫn trạng thái Plugin bền vững được SQLite hỗ trợ.
- Việc dọn dẹp phiên theo tuổi/số lượng và dọn dẹp phiên rõ ràng đã bị loại bỏ.
  Doctor sở hữu hoạt động nhập dữ liệu cũ; các phiên cũ được đặt lại hoặc xóa một cách rõ ràng.
- Các bước kiểm tra tính toàn vẹn của doctor không còn coi tệp JSONL cũ là bản ghi hội thoại đang hoạt động hợp lệ cho một hàng phiên SQLite. Tình trạng bản ghi hội thoại đang hoạt động chỉ dựa trên SQLite; các tệp JSONL cũ được báo cáo là đầu vào di chuyển/dọn dẹp tệp mồ côi.
- Doctor không còn coi `agents/<agent>/sessions/` là trạng thái lúc chạy bắt buộc.
  Nó chỉ quét thư mục đó khi thư mục đã tồn tại, dưới dạng đầu vào nhập dữ liệu cũ hoặc dọn dẹp tệp mồ côi.
- `sessions.resolve` của Gateway, các đường dẫn vá/đặt lại/Compaction phiên, việc tạo tác nhân con, hủy nhanh, siêu dữ liệu ACP, các phiên được Heartbeat cô lập và hoạt động vá TUI không còn di chuyển hoặc dọn dẹp khóa phiên cũ như tác dụng phụ của công việc lúc chạy thông thường.
- Việc phân giải phiên lệnh CLI hiện trả về `agentId` sở hữu thay vì `storePath` và không còn sao chép các hàng phiên chính cũ trong quá trình phân giải `--to` hoặc `--session-id` thông thường. Việc chuẩn hóa hàng chính cũ chỉ thuộc về doctor.
- Việc phân giải độ sâu tác nhân con lúc chạy không còn đọc `sessions.json` hoặc kho phiên JSON5. Nó đọc `session_entries` SQLite theo mã định danh tác nhân và siêu dữ liệu độ sâu/phiên cũ chỉ có thể đi vào qua đường dẫn nhập của doctor.
- Các giá trị ghi đè phiên của hồ sơ xác thực được lưu bền vững thông qua upsert hàng `{agentId, sessionKey}` trực tiếp thay vì tải lười runtime kho phiên có dạng tệp.
- Cơ chế kiểm soát chế độ chi tiết của trả lời tự động và các trình trợ giúp cập nhật phiên hiện đọc/upsert các hàng phiên SQLite theo danh tính phiên và không còn yêu cầu đường dẫn kho cũ trước khi tác động đến trạng thái hàng được lưu bền vững.
- Các trình trợ giúp siêu dữ liệu phiên chạy lệnh hiện sử dụng tên và đường dẫn mô-đun hướng mục; bề mặt trình trợ giúp lệnh `session-store` cũ đã bị loại bỏ.
- Việc gieo phần đầu khởi động và củng cố ranh giới Compaction thủ công hiện sửa đổi trực tiếp các hàng bản ghi hội thoại SQLite. Các bên gọi lúc chạy chuyển danh tính phiên, không phải đường dẫn `.jsonl` có thể ghi.
- Hoạt động phát lại xoay vòng phiên im lặng sao chép các lượt người dùng/trợ lý gần đây theo `{agentId, sessionId}` từ các hàng bản ghi hội thoại SQLite. Nó không còn chấp nhận bộ định vị bản ghi hội thoại nguồn hoặc đích.
- Các hàng phiên lúc chạy mới không còn lưu bộ định vị bản ghi hội thoại. Bên gọi sử dụng trực tiếp `{agentId, sessionId}`; các lệnh xuất/gỡ lỗi có thể chọn tên tệp đầu ra khi hiện thực hóa các hàng.
- Việc bắt đầu phiên bản ghi hội thoại bền vững mới hiện luôn mở các hàng SQLite theo phạm vi. Trình quản lý phiên không còn tái sử dụng đường dẫn hoặc bộ định vị bản ghi hội thoại từ thời kỳ tệp trước đó làm danh tính cho phiên mới.
- Các phiên bản ghi hội thoại bền vững sử dụng API `openTranscriptSessionManagerForSession({agentId, sessionId})` rõ ràng. Các facade tĩnh `SessionManager.create/openForSession/list/forkFromSession` cũ đã bị loại bỏ để mã kiểm thử và mã lúc chạy không thể vô tình tái tạo cơ chế khám phá phiên từ thời kỳ tệp.
- Runtime Plugin không còn cung cấp `api.runtime.agent.session.resolveTranscriptLocatorPath`; mã Plugin sử dụng các trình trợ giúp hàng SQLite và giá trị phạm vi.
- Bề mặt SDK `session-store-runtime` công khai hiện chỉ xuất các trình trợ giúp hàng phiên và hàng bản ghi hội thoại. Các trình trợ giúp tập trung cho lược đồ/đường dẫn/giao dịch SQLite nằm trong `sqlite-runtime`; các trình trợ giúp mở/đóng/đặt lại thô vẫn chỉ dùng nội bộ cho kiểm thử chính chủ.
- Các bộ phân loại tên tệp quỹ đạo/điểm kiểm tra `.jsonl` cũ hiện nằm trong mô-đun tệp phiên cũ của doctor. Quy trình xác thực phiên cốt lõi không còn nhập các trình trợ giúp tạo phẩm tệp để quyết định mã định danh phiên SQLite thông thường.
- Các lượt chạy tác nhân con chặn Active Memory sử dụng các hàng bản ghi hội thoại SQLite thay vì tạo các tệp `session.jsonl` tạm thời hoặc bền vững trong trạng thái Plugin. Tùy chọn `transcriptDir` cũ đã bị loại bỏ.
- Hoạt động tạo slug dùng một lần và các lượt chạy bộ lập kế hoạch tác nhân hệ thống sử dụng các hàng bản ghi hội thoại SQLite thay vì tạo các tệp `session.jsonl` tạm thời.
- `llm-task` helper chạy và việc trích xuất cam kết ẩn cũng sử dụng các hàng bản ghi hội thoại SQLite,
  vì vậy các phiên helper chỉ dành cho mô hình này không còn tạo
  các tệp bản ghi hội thoại JSON/JSONL tạm thời.
- `TranscriptSessionManager` giờ chỉ là một phạm vi bản ghi hội thoại SQLite đã mở.
  Mã runtime mở phạm vi này bằng `openTranscriptSessionManagerForSession({agentId,
sessionId})`; các luồng tạo, phân nhánh, tiếp tục, liệt kê và fork nằm trong
  các helper hàng SQLite sở hữu chúng thay vì các facade trình quản lý tĩnh.
  Mã doctor/import/gỡ lỗi xử lý các tệp nguồn cũ rõ ràng bên ngoài
  trình quản lý phiên runtime.
- Các phương thức facade `SessionManager.newSession()` và
  `SessionManager.createBranchedSession()` lỗi thời đã bị xóa. Các
  phiên mới và hậu duệ bản ghi hội thoại được tạo bởi quy trình SQLite
  sở hữu chúng thay vì biến đổi một trình quản lý đã mở thành một
  phiên được lưu trữ khác.
- Các quyết định fork bản ghi hội thoại cha và việc tạo fork không còn chấp nhận
  `storePath` hoặc `sessionsDir`; chúng sử dụng phạm vi bản ghi hội thoại SQLite
  `{agentId, sessionId}` thay cho siêu dữ liệu đường dẫn hệ thống tệp được giữ lại.
- Memory-host không còn xuất các helper không thao tác để phân loại bản ghi hội thoại
  theo thư mục phiên; việc lọc bản ghi hội thoại giờ được suy ra từ siêu dữ liệu hàng SQLite
  trong quá trình tạo mục nhập.
- Các kiểm thử xuất phiên của Memory-host và QMD sử dụng phạm vi bản ghi hội thoại SQLite. Các
  đường dẫn `agents/<agentId>/sessions/*.jsonl` cũ chỉ tiếp tục được bao phủ khi kiểm thử
  cố ý chứng minh khả năng tương thích của doctor/import/export.
- Việc kiểm tra phiên thô trong QA-lab giờ sử dụng `sessions.list` thông qua Gateway
  thay vì đọc `agents/qa/sessions/sessions.json`; phản hồi MSteams
  được nối trực tiếp vào bản ghi hội thoại SQLite mà không tạo đường dẫn JSONL giả.
- Các lượt kênh đến dùng chung giờ mang `{agentId, sessionKey}` thay vì
  `storePath` cũ. Các đường ghi của LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch và QQBot giờ đọc siêu dữ liệu thời điểm cập nhật và ghi
  các hàng phiên đến thông qua danh tính SQLite.
- Việc lưu trữ bộ định vị bản ghi hội thoại đã bị xóa khỏi các hàng phiên đang hoạt động.
  `resolveSessionTranscriptTarget` trả về `agentId`, `sessionId` và siêu dữ liệu
  chủ đề tùy chọn; doctor là mã duy nhất nhập tên tệp bản ghi hội thoại cũ.
- Tiêu đề bản ghi hội thoại runtime bắt đầu ở phiên bản SQLite `1`. Việc nâng cấp
  các dạng JSONL V1/V2/V3 cũ chỉ nằm trong thao tác nhập của doctor và chuẩn hóa các tiêu đề đã nhập
  thành phiên bản bản ghi hội thoại SQLite hiện tại trước khi lưu các hàng.
- Cơ chế bảo vệ ưu tiên cơ sở dữ liệu giờ cấm `SessionManager.listAll` và
  `SessionManager.forkFromSession`; các quy trình liệt kê phiên và fork/khôi phục
  phải tiếp tục sử dụng API SQLite theo hàng/phạm vi.
- Cơ chế bảo vệ cũng cấm các tên helper phân tích cú pháp JSONL bản ghi hội thoại cũ/sửa chữa nhánh hoạt động
  bên ngoài mã doctor/import, để runtime không thể phát triển một đường
  di chuyển bản ghi hội thoại cũ thứ hai.
- Các lượt chạy PI nhúng từ chối handle bản ghi hội thoại đầu vào. Chúng sử dụng danh tính SQLite
  `{agentId, sessionId}` trước khi khởi chạy worker và một lần nữa trước khi
  lần thử tác động đến trạng thái bản ghi hội thoại. Đầu vào `/tmp/*.jsonl` lỗi thời không thể chọn
  đích ghi runtime.
- Các bản ghi dấu vết bộ nhớ đệm, payload Anthropic, luồng thô và dòng thời gian chẩn đoán
  giờ ghi vào các hàng SQLite `diagnostic_events` có kiểu. Các gói ổn định Gateway
  giờ ghi vào các hàng SQLite `diagnostic_stability_bundles` có kiểu. Các đường dẫn ghi đè JSONL
  `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` và
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` cũ đã bị xóa, và việc thu thập ổn định
  thông thường không còn ghi các tệp `logs/stability/*.json`.
- Việc lưu trữ Cron giờ đối soát các hàng SQLite `cron_jobs` thay vì
  xóa/chèn lại toàn bộ bảng tác vụ sau mỗi lần lưu. Việc ghi ngược đích Plugin
  cập nhật trực tiếp các hàng cron khớp và giữ trạng thái cron runtime trong
  cùng giao dịch cơ sở dữ liệu trạng thái.
- Các bên gọi Cron runtime giờ sử dụng khóa kho cron SQLite ổn định. Các đường dẫn
  `cron.store` cũ chỉ là đầu vào nhập của doctor; các đường dẫn Gateway sản xuất, bảo trì
  tác vụ, trạng thái, lịch sử chạy và ghi ngược đích Telegram sử dụng
  `resolveCronStoreKey` và không còn chuẩn hóa khóa theo đường dẫn. Trạng thái Cron giờ
  báo cáo `storeKey` thay vì trường `storePath` có dạng tệp cũ.
- Việc tải và lập lịch Cron runtime không còn chuẩn hóa các dạng tác vụ cũ đã lưu trữ
  như `jobId`, `schedule.cron`, `atMs` dạng số, boolean dạng chuỗi hoặc
  thiếu `sessionTarget`. Thao tác nhập dữ liệu cũ của doctor sở hữu các sửa chữa đó trước khi các hàng
  được chèn vào SQLite.
- Việc sinh ACP không còn phân giải hoặc lưu trữ đường dẫn tệp JSONL bản ghi hội thoại. Quá trình thiết lập
  sinh và liên kết luồng lưu trực tiếp hàng phiên SQLite và giữ
  id phiên làm danh tính bản ghi hội thoại được duy trì.
- Các API siêu dữ liệu phiên ACP giờ đọc/liệt kê/upsert các hàng SQLite theo `agentId` và
  không còn công khai `storePath` như một phần của hợp đồng mục nhập phiên ACP.
- Việc tính toán mức sử dụng phiên và tổng hợp mức sử dụng Gateway giờ chỉ phân giải bản ghi hội thoại
  bằng `{agentId, sessionId}`. Bộ nhớ đệm chi phí/mức sử dụng và các bản tóm tắt phiên
  đã phát hiện không còn tổng hợp hoặc trả về chuỗi bộ định vị bản ghi hội thoại.
- Thao tác nối trò chuyện Gateway, lưu trữ phần chưa hoàn tất khi hủy, `/sessions.send` và
  ghi phương tiện webchat vào bản ghi hội thoại được nối trực tiếp thông qua phạm vi bản ghi hội thoại
  SQLite. Helper chèn bản ghi hội thoại của Gateway không còn chấp nhận tham số
  `transcriptLocator`.
- Việc khám phá bản ghi hội thoại SQLite giờ chỉ liệt kê phạm vi và thống kê bản ghi hội thoại:
  `{agentId, sessionId, updatedAt, eventCount}`. Helper tương thích
  `listSqliteSessionTranscriptLocators` không còn dùng và trường
  `locator` theo từng hàng đã bị xóa.
- Runtime sửa chữa bản ghi hội thoại giờ chỉ công khai
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Helper sửa chữa
  dựa trên bộ định vị cũ đã bị xóa; mã doctor/gỡ lỗi đọc các đường dẫn
  tệp nguồn rõ ràng và không bao giờ di chuyển chuỗi bộ định vị.
- Runtime sổ cái phát lại ACP giờ lưu các hàng phát lại theo từng phiên trong cơ sở dữ liệu
  trạng thái SQLite dùng chung thay vì `acp/event-ledger.json`; doctor nhập và
  xóa tệp cũ.
- Các helper đọc bản ghi hội thoại Gateway giờ nằm trong
  `src/gateway/session-transcript-readers.ts` thay vì tên mô-đun cũ
  `session-utils.fs`. Kiểm tra lịch sử thử lại dự phòng được đặt tên theo
  nội dung bản ghi hội thoại SQLite thay vì bề mặt helper tệp cũ.
- Các helper trò chuyện được chèn và Compaction của Gateway giờ truyền phạm vi bản ghi hội thoại SQLite
  qua các API helper nội bộ thay vì đặt tên giá trị là đường dẫn bản ghi hội thoại hoặc
  tệp nguồn.
- Việc phát hiện tiếp tục bootstrap giờ kiểm tra các hàng bản ghi hội thoại SQLite thông qua
  `hasCompletedBootstrapTranscriptTurn`; nó không còn công khai tên
  helper có dạng tệp.
- Các kiểm thử trình chạy nhúng giờ sử dụng danh tính bản ghi hội thoại SQLite, và việc mở một
  trình quản lý bản ghi hội thoại mới luôn yêu cầu `sessionId` rõ ràng.
- Các helper lập chỉ mục bộ nhớ giờ sử dụng thuật ngữ bản ghi hội thoại SQLite xuyên suốt:
  host xuất `listSessionTranscriptScopesForAgent` và
  `sessionTranscriptKeyForScope`, đồng bộ có đích đưa `sessionTranscripts` vào hàng đợi,
  các kết quả tìm kiếm phiên công khai công khai đường dẫn `transcript:<agent>:<session>` không trong suốt,
  và khóa nguồn DB nội bộ là `session:<session>` dưới
  `source_kind='sessions'` thay vì một đường dẫn tệp giả.
- Helper chống trùng lặp bền vững của SDK Plugin chung không còn công khai các tùy chọn
  có dạng tệp. Các bên gọi cung cấp khóa phạm vi SQLite và các hàng chống trùng lặp bền vững nằm trong
  trạng thái Plugin dùng chung.
- Token SSO của Microsoft Teams đã chuyển từ các tệp JSON bị khóa sang trạng thái Plugin
  SQLite. Doctor nhập `msteams-sso-tokens.json`, xây dựng lại các khóa token SSO
  chuẩn từ payload và xóa tệp nguồn. Token OAuth được ủy quyền vẫn
  ở ranh giới tệp thông tin xác thực riêng hiện có.
- Trạng thái bộ nhớ đệm đồng bộ Matrix đã chuyển từ `bot-storage.json` sang trạng thái Plugin
  SQLite. Doctor nhập payload đồng bộ thô hoặc được bao bọc cũ và xóa
  tệp nguồn. Các máy khách bộ điều hợp Matrix đang hoạt động và QA Lab Matrix truyền một thư mục gốc
  kho đồng bộ SQLite, không phải đường dẫn `sync-store.json` hoặc `bot-storage.json` giả.
- Trạng thái di chuyển mật mã cũ của Matrix đã chuyển từ
  `legacy-crypto-migration.json` sang trạng thái Plugin SQLite. Doctor nhập
  tệp trạng thái cũ; các ảnh chụp nhanh IndexedDB của SDK Matrix đã chuyển từ
  `crypto-idb-snapshot.json` sang blob Plugin SQLite. Khóa khôi phục và
  thông tin xác thực Matrix là các hàng trạng thái Plugin SQLite; các tệp JSON cũ của chúng chỉ là
  đầu vào di chuyển của doctor.
- Nhật ký hoạt động Memory Wiki giờ sử dụng trạng thái Plugin SQLite thay vì
  `.openclaw-wiki/log.jsonl`. Nhà cung cấp di chuyển Memory Wiki nhập các
  nhật ký JSONL cũ; markdown wiki và nội dung kho lưu trữ của người dùng vẫn được lưu
  trên tệp dưới dạng nội dung không gian làm việc.
- Memory Wiki không còn tạo `.openclaw-wiki/state.json` hoặc thư mục
  `.openclaw-wiki/locks` không dùng đến. Nhà cung cấp di chuyển xóa các tệp
  siêu dữ liệu Plugin đã ngừng sử dụng đó nếu một kho lưu trữ cũ vẫn còn chúng.
- Các mục kiểm tra system-agent giờ sử dụng trạng thái Plugin SQLite cốt lõi thay vì
  `audit/crestodian.jsonl`. Doctor nhập nhật ký kiểm tra JSONL cũ và
  xóa nó sau khi nhập thành công.
- Các mục kiểm tra ghi/quan sát cấu hình giờ sử dụng trạng thái Plugin SQLite cốt lõi thay vì
  `logs/config-audit.jsonl`. Doctor nhập nhật ký kiểm tra JSONL cũ và
  xóa nó sau khi nhập thành công.
- Ứng dụng đồng hành macOS không còn ghi các sidecar `logs/config-audit.jsonl` hoặc
  `logs/config-health.json` cục bộ của ứng dụng trong khi chỉnh sửa `openclaw.json`. Tệp cấu hình
  vẫn được lưu trên tệp, các ảnh chụp nhanh khôi phục vẫn nằm cạnh tệp cấu hình,
  và trạng thái kiểm tra/tình trạng cấu hình bền vững thuộc về kho SQLite của Gateway.
- Các phê duyệt đang chờ cứu hộ của system-agent giờ sử dụng trạng thái Plugin SQLite cốt lõi thay vì
  `crestodian/rescue-pending/*.json` hoặc `openclaw/rescue-pending/*.json`.
  Các năng lực bảo mật tồn tại ngắn này không bao giờ được nhập; doctor loại bỏ
  cả hai thư mục đã ngừng sử dụng để việc nâng cấp không thể kích hoạt lại một thao tác ghi lỗi thời.
- Trạng thái kích hoạt tạm thời của Phone Control giờ sử dụng trạng thái Plugin SQLite thay vì
  `plugins/phone-control/armed.json`. Doctor nhập tệp trạng thái đã kích hoạt cũ
  vào không gian tên `phone-control/arm-state` và xóa tệp.
- Doctor không còn sửa chữa bản ghi hội thoại JSONL tại chỗ hoặc tạo các tệp JSONL
  sao lưu. Nó nhập nhánh đang hoạt động vào SQLite và xóa nguồn cũ.
- Tra cứu bản ghi hội thoại của hook bộ nhớ phiên sử dụng thao tác đọc SQLite chỉ theo phạm vi
  `{agentId, sessionId}`. Helper của nó không còn chấp nhận hoặc suy ra bộ định vị bản ghi hội thoại,
  thao tác đọc tệp cũ hay tùy chọn ghi lại tệp.
- Các liên kết cuộc trò chuyện app-server Codex giờ tạo khóa trạng thái Plugin SQLite theo
  khóa phiên OpenClaw hoặc phạm vi `{agentId, sessionId}` rõ ràng. Chúng không được
  giữ lại các liên kết dự phòng theo đường dẫn bản ghi hội thoại.
- Thao tác đọc lịch sử phản chiếu của app-server Codex chỉ sử dụng phạm vi bản ghi hội thoại SQLite;
  chúng không được khôi phục danh tính từ đường dẫn tệp bản ghi hội thoại.
- Các đường sắp xếp vai trò và đặt lại Compaction không còn hủy liên kết các tệp bản ghi hội thoại
  cũ; thao tác đặt lại chỉ luân chuyển hàng phiên SQLite và danh tính bản ghi hội thoại.
- Phản hồi đặt lại và điểm kiểm tra Gateway trả về các hàng phiên sạch cùng id phiên.
  Chúng không còn tổng hợp bộ định vị bản ghi hội thoại SQLite cho máy khách.
- Dreaming của memory-core không còn cắt tỉa các hàng phiên bằng cách dò tìm
  tệp JSONL bị thiếu. Việc dọn dẹp subagent đi qua API runtime phiên thay vì
  kiểm tra sự tồn tại của hệ thống tệp. Các kiểm thử nhập bản ghi hội thoại của nó tạo dữ liệu hàng SQLite
  trực tiếp thay vì tạo fixture `agents/<id>/sessions` hoặc placeholder
  bộ định vị.
- Việc lập chỉ mục bản ghi hội thoại bộ nhớ có thể công khai `transcript:<agentId>:<sessionId>` dưới dạng
  đường dẫn kết quả tìm kiếm ảo cho các helper trích dẫn/đọc. Nguồn chỉ mục bền vững có
  tính quan hệ (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), vì vậy giá trị này không phải là bộ định vị bản ghi phiên chạy, không phải là đường dẫn hệ thống tệp và tuyệt đối không được truyền trở lại các API thời gian chạy phiên.
- Trạng thái bộ nhớ của Gateway doctor đọc số lượng truy hồi ngắn hạn và tín hiệu pha từ các hàng trạng thái Plugin trong SQLite thay vì `memory/.dreams/*.json`; đầu ra CLI và doctor giờ đây ghi nhãn kho lưu trữ đó là kho SQLite, không phải đường dẫn.
- Thời gian chạy memory-core, trạng thái CLI, các phương thức Gateway doctor và các facade SDK Plugin không còn kiểm tra hay lưu trữ các tệp `.dreams/session-corpus` cũ.
  Các tệp đó chỉ là đầu vào di chuyển; doctor nhập chúng vào SQLite và xóa nguồn sau khi xác minh. Các hàng bằng chứng thu nạp phiên đang hoạt động giờ đây sử dụng đường dẫn SQLite ảo `memory/session-ingestion/<day>.txt`; thời gian chạy không bao giờ ghi hoặc suy ra trạng thái từ `.dreams/session-corpus`.
- Các tạo tác công khai của memory-core cung cấp sự kiện máy chủ SQLite dưới dạng tạo tác JSON ảo `memory/events/memory-host-events.json`; chúng không còn tái sử dụng đường dẫn nguồn cũ `.dreams/events.jsonl`.
- Các sổ đăng ký container/trình duyệt sandbox giờ đây sử dụng bảng SQLite dùng chung `sandbox_registry_entries` với các cột có kiểu cho phiên, ảnh, dấu thời gian, backend/cấu hình và cổng trình duyệt. Doctor nhập các tệp đăng ký JSON nguyên khối và phân mảnh cũ, rồi xóa các nguồn đã nhập thành công. Các lượt đọc thời gian chạy dùng các cột hàng có kiểu làm nguồn dữ liệu chuẩn; `entry_json` chỉ là bản sao phát lại/gỡ lỗi.
- Các cam kết giờ đây sử dụng bảng dùng chung có kiểu `commitments` thay vì một blob JSON cho toàn bộ kho. Thời gian chạy sử dụng các truy vấn được lập chỉ mục cho phạm vi, cửa sổ phân phối, giới hạn luân phiên, trạng thái và lần thử, cùng với các giao dịch SQLite đồng bộ; `record_json` chỉ là bản sao phát lại/gỡ lỗi. Thao tác sửa chữa doctor tường minh xác thực toàn bộ `commitments.json` cũ, giữ lại các hàng SQLite mới hơn, xác minh kết quả và chỉ sau đó mới xóa nguồn không thay đổi. Thời gian chạy không bao giờ đọc hoặc ghi tệp đã ngừng sử dụng.
- Các đăng ký Web Push và danh tính VAPID được tạo giờ đây sử dụng các hàng dùng chung có kiểu `web_push_subscriptions` và `web_push_vapid_keys`. Việc đăng ký trong thời gian chạy, dọn dẹp khi hết hạn và tạo khóa trong lần sử dụng đầu tiên dùng các giao dịch SQLite cấp hàng. Thao tác sửa chữa Doctor tường minh xác thực cả hai kho JSON đã ngừng sử dụng, xác lập quyền sở hữu chúng trước khi ghi SQLite, nhập chúng theo cách nguyên tử, từ chối các danh tính VAPID xung đột, xác minh kết quả và chỉ sau đó mới xóa các xác lập quyền sở hữu. Doctor giữ khóa bảo trì thư mục trạng thái trong suốt quá trình nhập để một Gateway cũ không thể tạo lại các tệp đã ngừng sử dụng. Việc đăng ký, phân phối, xóa và phân giải khóa sẽ đóng khi lỗi cho đến khi Doctor xử lý các nguồn cũ đang chờ hoặc các xác lập quyền sở hữu bị gián đoạn.
- Định nghĩa tác vụ Cron, trạng thái lịch và lịch sử chạy không còn trình ghi hoặc trình đọc JSON trong thời gian chạy. Thời gian chạy sử dụng các hàng `cron_jobs` với các cột có kiểu cho lịch, tải trọng, phân phối, cảnh báo lỗi, phiên, trạng thái và trạng thái thời gian chạy, cùng với chi tiết `task_runs` do cron sở hữu dành cho chẩn đoán, phân phối, phiên/lần chạy, mô hình và tổng số token. `job_json` chỉ là bản sao phát lại/gỡ lỗi; `state_json` lưu các chẩn đoán thời gian chạy lồng nhau chưa có trường truy vấn nóng, trong khi thời gian chạy khôi phục các trường trạng thái nóng từ các cột có kiểu. Doctor nhập các tệp `jobs.json`, `jobs-state.json` và `runs/*.jsonl` cũ rồi xóa các nguồn đã nhập. Các thao tác ghi ngược đích Plugin cập nhật các hàng `cron_jobs` khớp thay vì tải và thay thế toàn bộ kho cron.
- Quá trình khởi động Gateway bỏ qua các dấu `notify: true` cũ trong phép chiếu thời gian chạy. Doctor chỉ đọc `cron.webhook` thô đã ngừng sử dụng trong khi chuyển đổi các dấu đó thành hoạt động phân phối SQLite tường minh, rồi xóa khóa cấu hình.
- Các hàng đợi phân phối đi và phân phối phiên giờ đây lưu trạng thái hàng đợi, loại mục, khóa phiên, kênh, đích, mã định danh tài khoản, số lần thử lại, lần thử/lỗi gần nhất, trạng thái khôi phục và dấu gửi của nền tảng dưới dạng các cột có kiểu trong bảng dùng chung `delivery_queue_entries`. Quá trình khôi phục thời gian chạy đọc các trường nóng đó từ các cột có kiểu, còn các thay đổi thử lại/khôi phục cập nhật trực tiếp những cột đó mà không ghi lại JSON phát lại. Tải trọng JSON đầy đủ chỉ được giữ lại làm blob phát lại/gỡ lỗi cho nội dung thông báo và dữ liệu phát lại nguội khác.
- Các bản ghi ảnh gửi đi được quản lý giờ đây sử dụng các hàng dùng chung có kiểu `managed_outgoing_image_records`. Thời gian chạy chỉ đọc các cột có kiểu; cột JSON là bản sao phát lại/gỡ lỗi. Các byte ảnh gốc vẫn là tạo tác tệp đính kèm có tên trong thư mục nội dung đa phương tiện được quản lý.
- Các tùy chọn bộ chọn mô hình, hàm băm triển khai lệnh và liên kết luồng của Discord giờ đây sử dụng trạng thái Plugin SQLite dùng chung. Các kế hoạch nhập JSON cũ của chúng nằm trong bề mặt di chuyển thiết lập/doctor của Plugin Discord, không nằm trong mã di chuyển lõi.
- Các bộ phát hiện nhập dữ liệu cũ của Plugin sử dụng các mô-đun có tên theo doctor như `doctor-legacy-state.ts` hoặc `doctor-state-imports.ts`; các mô-đun thời gian chạy kênh thông thường không được nhập bộ phát hiện JSON cũ.
- Con trỏ bắt kịp và dấu chống trùng lặp đầu vào của BlueBubbles giờ đây sử dụng trạng thái Plugin SQLite dùng chung. Các kế hoạch nhập JSON cũ của chúng nằm trong bề mặt di chuyển thiết lập/doctor của Plugin BlueBubbles, không nằm trong mã di chuyển lõi.
- Các độ lệch cập nhật, hàng bộ nhớ đệm nhãn dán, hàng bộ nhớ đệm thông báo đã gửi, hàng bộ nhớ đệm tên chủ đề và liên kết luồng của Telegram giờ đây sử dụng trạng thái Plugin SQLite dùng chung. Các kế hoạch nhập JSON cũ của chúng nằm trong bề mặt di chuyển thiết lập/doctor của Plugin Telegram, không nằm trong mã di chuyển lõi.
- Con trỏ bắt kịp, ánh xạ mã định danh ngắn của phản hồi và các hàng chống trùng lặp tiếng vọng đã gửi của iMessage giờ đây sử dụng trạng thái Plugin SQLite dùng chung. Các tệp `imessage/catchup/*.json`, `imessage/reply-cache.jsonl` và `imessage/sent-echoes.jsonl` cũ chỉ là đầu vào của doctor.
- Các hàng chống trùng lặp thông báo Feishu giờ đây sử dụng cơ chế chống trùng lặp có thể xác lập quyền sở hữu của lõi (các không gian tên `feishu.dedup.*` trong trạng thái Plugin SQLite dùng chung) thay vì các tệp `feishu/dedup/*.json` hoặc kho `dedup.*` tự triển khai đã ngừng sử dụng, không cần nhập dữ liệu cũ vì bộ nhớ đệm chống phát lại được xây dựng lại sau khi nâng cấp.
- Các cuộc hội thoại, cuộc thăm dò, bộ đệm tải lên đang chờ và kiến thức học được từ phản hồi của Microsoft Teams giờ đây sử dụng các bảng trạng thái/blob Plugin SQLite dùng chung. Đường dẫn tải lên đang chờ sử dụng `plugin_blob_entries` để các bộ đệm nội dung đa phương tiện được lưu dưới dạng BLOB SQLite thay vì JSON base64. Tên các trình trợ giúp thời gian chạy giờ đây dùng cách đặt tên SQLite/trạng thái thay vì cách đặt tên kho tệp `*-fs`, và shim `storePath` cũ đã bị loại bỏ khỏi các kho này. Kế hoạch nhập JSON cũ của nó nằm trong bề mặt di chuyển thiết lập/doctor của Plugin Microsoft Teams.
- Nội dung đa phương tiện gửi đi được lưu trữ của Zalo giờ đây sử dụng `plugin_blob_entries` SQLite dùng chung thay vì các sidecar tạm JSON/bin `openclaw-zalo-outbound-media`.
- HTML và siêu dữ liệu của trình xem khác biệt giờ đây sử dụng `plugin_blob_entries` SQLite dùng chung thay vì các tệp tạm `meta.json`/`viewer.html`. HTML của trình xem được lưu dưới dạng blob gzip và chỉ hàm băm token URL được lưu bền vững. Các đầu ra PNG/PDF đã kết xuất vẫn là bản cụ thể hóa tạm thời vì việc phân phối qua kênh vẫn cần đường dẫn tệp; siêu dữ liệu hết hạn của chúng do SQLite sở hữu mà không có sidecar JSON.
- Các tài liệu Canvas được quản lý giờ đây sử dụng `plugin_blob_entries` SQLite dùng chung thay vì thư mục `state/canvas/documents` mặc định. Máy chủ Canvas phục vụ trực tiếp các blob đó; tệp cục bộ chỉ được tạo cho nội dung vận hành `host.root` tường minh hoặc để cụ thể hóa tạm thời khi trình đọc nội dung đa phương tiện hạ nguồn yêu cầu đường dẫn.
- Các quyết định kiểm tra File Transfer giờ đây sử dụng `plugin_state_entries` SQLite dùng chung thay vì nhật ký thời gian chạy `audit/file-transfer.jsonl` không giới hạn. Doctor nhập tệp kiểm tra JSONL cũ vào trạng thái Plugin và xóa nguồn sau khi nhập sạch.
- Các lease tiến trình ACPX và danh tính phiên bản Gateway giờ đây sử dụng trạng thái Plugin SQLite dùng chung. Doctor nhập tệp `gateway-instance-id` cũ vào trạng thái Plugin và xóa nguồn.
- Các tập lệnh wrapper do ACPX tạo và thư mục gốc Codex được cô lập là bản cụ thể hóa tạm thời trong thư mục gốc tạm thời của OpenClaw, không phải trạng thái OpenClaw bền vững. Các bản ghi thời gian chạy ACPX bền vững là các hàng lease SQLite và phiên bản Gateway; bề mặt cấu hình ACPX `stateDir` cũ bị loại bỏ vì không còn trạng thái thời gian chạy nào được ghi ở đó.
- Các tệp đính kèm nội dung đa phương tiện của Gateway giờ đây sử dụng bảng SQLite dùng chung `media_blobs` làm kho byte chuẩn. Các đường dẫn cục bộ trả về cho các bề mặt tương thích kênh và sandbox là bản cụ thể hóa tạm thời của hàng cơ sở dữ liệu, không phải kho nội dung đa phương tiện bền vững. Danh sách cho phép nội dung đa phương tiện trong thời gian chạy không còn bao gồm các thư mục gốc `$OPENCLAW_STATE_DIR/media` cũ hoặc `media` trong thư mục cấu hình; những thư mục đó chỉ là nguồn nhập của doctor.
- Tính năng hoàn thành shell không còn ghi các tệp bộ nhớ đệm `$OPENCLAW_STATE_DIR/completions/*`. Các đường dẫn kiểm tra nhanh cài đặt, doctor, cập nhật và phát hành sử dụng đầu ra hoàn thành được tạo hoặc nạp từ hồ sơ thay vì các tệp bộ nhớ đệm hoàn thành bền vững.
- Khu vực tạm tải lên Skills của Gateway giờ đây sử dụng các hàng dùng chung `skill_uploads` và `skill_upload_chunks`. Các phân đoạn vẫn có giao dịch riêng trong khi tải lên, sau đó thao tác commit ghép thành một BLOB lưu trữ đã xác minh và xóa các hàng phân đoạn. Trình cài đặt chỉ nhận đường dẫn lưu trữ được cụ thể hóa tạm thời trong khi quá trình cài đặt đang chạy. Doctor loại bỏ cây lưu tạm một giờ trên hệ thống tệp đã ngừng sử dụng thay vì nhập các lượt tải lên tạm thời.
- Các tệp đính kèm nội tuyến của tác tử con không còn được cụ thể hóa trong `.openclaw/attachments/*` của không gian làm việc. Đường dẫn sinh tác tử chuẩn bị các mục hạt giống VFS SQLite, các lượt chạy nội tuyến gieo các mục đó vào không gian tên tạm thời của thời gian chạy theo từng tác tử, còn các công cụ dựa trên đĩa phủ lớp tạm SQLite đó cho các đường dẫn tệp đính kèm. Các cột sổ đăng ký thư mục tệp đính kèm của lượt chạy tác tử con và hook dọn dẹp cũ đã bị loại bỏ.
- Quá trình hydrat hóa ảnh CLI không còn duy trì các tệp bộ nhớ đệm `openclaw-cli-images` ổn định. Các backend CLI bên ngoài vẫn nhận đường dẫn tệp, nhưng những đường dẫn đó là bản cụ thể hóa tạm thời theo từng lượt chạy và được dọn dẹp.
- Chẩn đoán dấu vết bộ nhớ đệm, chẩn đoán tải trọng Anthropic, chẩn đoán luồng mô hình thô, sự kiện dòng thời gian chẩn đoán và các gói ổn định Gateway giờ đây ghi các hàng SQLite thay vì các tệp `logs/*.jsonl` hoặc `logs/stability/*.json`.
  Các cờ và biến môi trường ghi đè đường dẫn thời gian chạy đã bị loại bỏ; các lệnh xuất/gỡ lỗi có thể cụ thể hóa tệp một cách tường minh từ các hàng cơ sở dữ liệu.
- Ứng dụng đồng hành trên macOS không còn trình ghi luân phiên `diagnostics.jsonl`. Nhật ký ứng dụng được chuyển vào hệ thống ghi nhật ký hợp nhất, còn chẩn đoán Gateway bền vững tiếp tục được SQLite hỗ trợ.
- Danh sách bản ghi bảo vệ cổng macOS giờ đây sử dụng các hàng SQLite dùng chung có kiểu `macos_port_guardian_records` thay vì tệp JSON trong Application Support hoặc blob đơn thể không rõ cấu trúc. Tất cả hồ sơ ứng dụng macOS sử dụng cùng một cơ sở dữ liệu gốc toàn máy vì chúng phối hợp các cổng cục bộ của máy. Mọi thao tác sổ cái đều chặn trong khi một bản sao ứng dụng cũ còn ghi JSON đang chạy. Quá trình di chuyển chỉ tham gia giao thức khóa tệp ổn định của sổ cái cũ để chụp nhanh và sau đó xác thực lại nguồn. Nó phân giải mọi hàng cũ từ dữ kiện trực tiếp về lệnh và thời điểm bắt đầu tiến trình mà không giữ khóa đó, sau đó đọc lại các hàng SQLite có thẩm quyền, áp dụng kế hoạch, xác minh mọi biên nhận và xóa nguồn. Các lần thử xóa lại sẽ lập lại kế hoạch cho các hàng bị thiếu để biên nhận lỗi thời đã ngừng sử dụng không thể xuất hiện trở lại. Khóa chỉ tồn tại trong thời gian ngắn để không thể làm mắc kẹt trình ghi cũ sau khi SSH đã sinh tiến trình. Việc chuyển đổi có chủ ý theo một chiều: thời gian chạy ở trạng thái ổn định không bao giờ đọc, chiếu hoặc ghi JSON, và việc quay lui về các bản dựng chỉ dùng JSON không bảo toàn các biên nhận SQLite mới hơn.
- Các khóa đơn thể Gateway giờ đây sử dụng các hàng SQLite dùng chung có kiểu `state_leases` trong phạm vi `gateway_locks` thay vì các tệp khóa trong thư mục tạm. Tài liệu khắc phục sự cố Fly và OAuth giờ đây trỏ đến khóa lease/làm mới xác thực SQLite thay vì thao tác dọn dẹp khóa tệp lỗi thời.
- Trạng thái sentinel khởi động lại Gateway hiện sử dụng các hàng SQLite dùng chung có kiểu
  `gateway_restart_sentinel` thay cho `restart-sentinel.json`; runtime
  đọc loại, trạng thái, định tuyến, thông báo, phần tiếp tục và số liệu thống kê của sentinel từ
  các cột có kiểu. Các cột đó là nguồn dữ liệu chuẩn; `payload_json` chỉ là
  bản sao bóng phục vụ phát lại/gỡ lỗi. Các đường dẫn đọc, ghi và xóa của runtime chỉ dùng SQLite.
  Một mô-đun di chuyển trạng thái có phạm vi giới hạn chạy trong quá trình khởi động và Doctor để nhập
  một sentinel hậu cập nhật cũ hơn đã được xác thực trước khi thực hiện khôi phục khởi động lại thông thường, xác minh
  hàng có kiểu và xóa tệp nguồn. Không mô-đun runtime ở trạng thái ổn định nào
  đọc, ghi hoặc dọn dẹp tệp cũ.
- Ý định khởi động lại Gateway và trạng thái bàn giao cho trình giám sát hiện sử dụng các hàng SQLite dùng chung
  có kiểu `gateway_restart_intent` và `gateway_restart_handoff` thay cho
  các tệp sidecar `gateway-restart-intent.json` và
  `gateway-supervisor-restart-handoff.json`.
- Điều phối singleton của Gateway hiện sử dụng các hàng `state_leases` có kiểu trong
  `gateway_locks` thay vì ghi các tệp `gateway.<hash>.lock`. Hàng lease
  sở hữu chủ thể khóa, thời điểm hết hạn, Heartbeat và payload gỡ lỗi; SQLite sở hữu
  ranh giới thu nhận/giải phóng nguyên tử. Tùy chọn thư mục khóa tệp đã ngừng sử dụng
  đã bị loại bỏ; các kiểm thử sử dụng trực tiếp danh tính hàng SQLite.
- Trình trợ giúp báo cáo mức sử dụng Cron cũ không còn được tham chiếu, vốn quét các tệp `cron/runs/*.jsonl`,
  đã bị xóa. Báo cáo lịch sử chạy Cron đọc các hàng `task_runs` do Cron sở hữu.
- Khôi phục sau khởi động lại phiên chính hiện phát hiện các agent ứng viên thông qua
  registry SQLite `agent_databases` thay vì quét các thư mục `agents/*/sessions`.
- Khôi phục lỗi hỏng phiên Gemini hiện chỉ xóa hàng phiên SQLite;
  không còn cần cổng kiểm soát `storePath` cũ hoặc cố hủy liên kết một
  đường dẫn transcript JSONL dẫn xuất.
- Xử lý ghi đè đường dẫn hiện coi các giá trị môi trường `undefined`/`null` theo nghĩa đen
  là chưa đặt, ngăn việc vô tình tạo cơ sở dữ liệu `undefined/state/*.sqlite`
  tại thư mục gốc của repo trong quá trình kiểm thử hoặc bàn giao shell.
- Dấu vân tay tình trạng cấu hình hiện sử dụng các hàng SQLite dùng chung có kiểu `config_health_entries`
  thay cho `logs/config-health.json`, duy trì tệp cấu hình thông thường là
  tài liệu cấu hình không chứa thông tin xác thực duy nhất. Ứng dụng đồng hành macOS chỉ giữ
  trạng thái tình trạng cục bộ trong tiến trình và không tạo lại tệp sidecar JSON cũ.
- Runtime hồ sơ xác thực không còn nhập hoặc ghi các tệp JSON thông tin xác thực. Kho
  thông tin xác thực chuẩn là SQLite; `auth-profiles.json`, `auth.json`
  theo từng agent và `credentials/oauth.json` dùng chung là các đầu vào di chuyển của Doctor
  được xóa sau khi nhập.
- Các kiểm thử lưu/trạng thái hồ sơ xác thực hiện xác nhận trực tiếp các bảng xác thực SQLite có kiểu
  và chỉ sử dụng tên tệp hồ sơ xác thực cũ làm đầu vào di chuyển cho Doctor.
- `openclaw secrets apply` chỉ làm sạch tệp cấu hình, tệp môi trường và kho
  hồ sơ xác thực SQLite. Nó không còn chứa logic tương thích chỉnh sửa
  `auth.json` theo từng agent đã ngừng sử dụng; Doctor chịu trách nhiệm nhập và xóa tệp đó.
- Các kế hoạch di chuyển bí mật Hermes nhập và áp dụng trực tiếp các hồ sơ khóa API
  đã nhập vào kho hồ sơ xác thực SQLite. Chúng không còn ghi hoặc xác minh
  `auth-profiles.json` làm đích trung gian.
- Tài liệu xác thực dành cho người dùng hiện mô tả
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` thay vì
  yêu cầu người dùng kiểm tra hoặc sao chép `auth-profiles.json`; các tên JSON OAuth/xác thực
  cũ chỉ còn được ghi lại trong tài liệu dưới dạng đầu vào nhập của Doctor.
- Các phiên OAuth MCP hiện sử dụng các hàng `mcp_oauth_stores` có phiên bản trong
  `state/openclaw.sqlite` dùng chung. Các đối tượng token, đăng ký máy khách và khám phá
  do SDK sở hữu vẫn là một payload JSON đã được xác thực để các trường mở rộng của phần phụ thuộc
  được giữ nguyên, trong khi mọi thao tác đọc/sửa đổi/ghi đều commit trong một giao dịch Kysely
  ngắn. Một lease SQLite dùng chung tuần tự hóa việc làm mới, đăng nhập và đăng xuất;
  các transport MCP nhúng không còn cho phép SDK MCP làm mới bên ngoài
  lease đó. Doctor độc quyền nhập và xóa các kho `mcp-oauth/*.json`
  đã ngừng sử dụng kèm biên nhận nguồn, và runtime không có phương án dự phòng bằng tệp.
- Các trình trợ giúp đường dẫn trạng thái lõi không còn cung cấp tệp `credentials/oauth.json`
  đã ngừng sử dụng. Tên tệp cũ chỉ cục bộ trong đường dẫn nhập xác thực của Doctor.
- Tài liệu cài đặt, bảo mật, hướng dẫn thiết lập ban đầu, xác thực mô hình và SecretRef hiện mô tả
  các hàng hồ sơ xác thực SQLite và sao lưu/di chuyển toàn bộ trạng thái thay vì
  các tệp JSON hồ sơ xác thực theo từng agent.
- Khám phá mô hình PI hiện truyền thông tin xác thực chuẩn vào kho lưu trữ xác thực
  `pi-coding-agent` trong bộ nhớ. Nó không còn tạo, làm sạch hoặc ghi
  `auth.json` theo từng agent trong quá trình khám phá.
- Cài đặt kích hoạt và định tuyến Voice Wake hiện sử dụng các bảng SQLite dùng chung có kiểu
  thay cho `settings/voicewake.json`, `settings/voicewake-routing.json` hoặc
  các hàng chung không rõ kiểu; Doctor nhập các tệp JSON cũ và xóa chúng sau khi
  di chuyển thành công.
- Trạng thái kiểm tra cập nhật hiện sử dụng một hàng dùng chung có kiểu `update_check_state` thay cho
  `update-check.json` hoặc một blob chung không rõ kiểu; Doctor nhập
  tệp JSON cũ và xóa nó sau khi di chuyển thành công.
- Trạng thái tình trạng cấu hình hiện sử dụng các hàng dùng chung có kiểu `config_health_entries`
  thay cho `logs/config-health.json` hoặc một blob chung không rõ kiểu; Doctor
  nhập tệp JSON cũ và xóa nó sau khi di chuyển thành công.
- Phê duyệt liên kết cuộc trò chuyện của Plugin hiện sử dụng các hàng
  `plugin_binding_approvals` có kiểu thay cho trạng thái SQLite dùng chung không rõ kiểu hoặc
  `plugin-binding-approvals.json`; tệp cũ là đầu vào di chuyển của Doctor.
- Các liên kết cuộc trò chuyện hiện tại dùng chung hiện lưu trữ các hàng
  `current_conversation_bindings` có kiểu thay vì ghi lại
  `bindings/current-conversations.json`; Doctor nhập tệp JSON cũ và
  xóa nó sau khi di chuyển thành công.
- Sổ cái đồng bộ nguồn đã nhập của Memory Wiki hiện lưu trữ một hàng trạng thái Plugin SQLite
  cho mỗi khóa vault/nguồn thay vì ghi lại `.openclaw-wiki/source-sync.json`;
  trình cung cấp di chuyển nhập và xóa sổ cái JSON cũ.
- Các bản ghi lượt nhập ChatGPT của Memory Wiki hiện lưu trữ một hàng trạng thái Plugin SQLite
  cho mỗi id vault/lượt chạy thay vì ghi `.openclaw-wiki/import-runs/*.json`.
  Các snapshot rollback vẫn là các tệp vault rõ ràng cho đến khi việc lưu trữ snapshot
  của lượt nhập được chuyển sang kho blob.
- Các bản tổng hợp đã biên dịch của Memory Wiki hiện lưu trữ các hàng blob Plugin SQLite đã nén
  thay vì ghi `.openclaw-wiki/cache/agent-digest.json` và
  `.openclaw-wiki/cache/claims.jsonl`. Bộ nhớ đệm có thể tái tạo, vì vậy Doctor
  xóa các tệp bộ nhớ đệm cũ mà không nhập chúng.
- Theo dõi cài đặt skill của ClawHub hiện lưu trữ một hàng trạng thái Plugin SQLite cho mỗi
  workspace/skill thay vì ghi hoặc đọc các tệp sidecar `.clawhub/lock.json` và
  `.clawhub/origin.json` tại runtime. Mã runtime sử dụng các đối tượng trạng thái cài đặt
  được theo dõi thay cho các lớp trừu tượng lockfile/nguồn có hình dạng tệp. Doctor
  nhập các tệp sidecar cũ từ các workspace agent đã cấu hình và xóa chúng
  sau khi nhập sạch.
- Chỉ mục Plugin đã cài đặt hiện đọc và ghi hàng singleton SQLite dùng chung có kiểu
  `installed_plugin_index` thay cho `plugins/installs.json`; tệp JSON
  cũ chỉ là đầu vào di chuyển của Doctor và được xóa sau khi nhập.
- Trình trợ giúp đường dẫn `plugins/installs.json` cũ hiện nằm trong mã cũ
  của Doctor. Các mô-đun chỉ mục Plugin runtime chỉ cung cấp các tùy chọn lưu trữ bền vững
  dựa trên SQLite, không cung cấp đường dẫn tệp JSON.
- Sentinel khởi động lại Gateway, ý định khởi động lại và trạng thái bàn giao cho trình giám sát hiện sử dụng
  các hàng SQLite dùng chung có kiểu (`gateway_restart_sentinel`,
  `gateway_restart_intent` và `gateway_restart_handoff`) thay cho các blob chung
  không rõ kiểu. Mã khởi động lại runtime không còn hợp đồng sentinel/ý định/bàn giao
  có hình dạng tệp.
- Bộ nhớ đệm đồng bộ Matrix, siêu dữ liệu lưu trữ, liên kết luồng, dấu mốc chống trùng lặp đầu vào,
  trạng thái thời gian chờ xác minh khi khởi động, snapshot mã hóa IndexedDB của SDK,
  thông tin xác thực và khóa khôi phục hiện sử dụng các bảng trạng thái/blob Plugin SQLite
  dùng chung. Các cấu trúc đường dẫn runtime không còn cung cấp đường dẫn siêu dữ liệu `storage-meta.json`;
  tên tệp đó chỉ là đầu vào di chuyển cũ. Kế hoạch nhập JSON cũ của chúng
  nằm trong bề mặt di chuyển thiết lập/Doctor của Plugin Matrix. Các dấu mốc
  chống trùng lặp đầu vào sử dụng cơ chế chống trùng lặp có thể xác nhận quyền sở hữu của lõi (các không gian tên `matrix.inbound-dedupe.*`
  trong DB trạng thái dùng chung); quá trình di chuyển trạng thái của Doctor Matrix nhập
  một lần các hàng `inbound-dedupe` theo từng thư mục gốc đã ngừng sử dụng và `inbound-dedupe.json`,
  sau đó runtime chỉ đọc kho chống trùng lặp có thể xác nhận quyền sở hữu.
- Quá trình khởi động Matrix không còn quét, báo cáo hoặc hoàn tất trạng thái tệp Matrix
  cũ. Việc phát hiện tệp Matrix, tạo snapshot mã hóa cũ, trạng thái di chuyển
  khôi phục khóa phòng, nhập và xóa nguồn đều do Doctor sở hữu.
- Các barrel di chuyển runtime Matrix đã bị xóa. Các trình trợ giúp phát hiện
  và sửa đổi trạng thái/mã hóa cũ được Doctor Matrix nhập trực tiếp thay vì là
  một phần của bề mặt API runtime.
- Các dấu mốc tái sử dụng snapshot di chuyển Matrix hiện nằm trong trạng thái Plugin SQLite
  thay cho `matrix/migration-snapshot.json`; Doctor vẫn có thể tái sử dụng cùng một
  kho lưu trữ trước di chuyển đã xác minh mà không ghi tệp trạng thái sidecar.
- Con trỏ bus Nostr và trạng thái xuất bản hồ sơ hiện sử dụng trạng thái Plugin SQLite
  dùng chung. Kế hoạch nhập JSON cũ của chúng nằm trong bề mặt di chuyển
  thiết lập/Doctor của Plugin Nostr.
- Các nút bật/tắt phiên Active Memory hiện sử dụng trạng thái Plugin SQLite dùng chung thay cho
  `session-toggles.json`; bật lại bộ nhớ sẽ xóa hàng thay vì
  ghi lại một đối tượng JSON.
- Các đề xuất và bộ đếm review của Skill Workshop hiện sử dụng trạng thái Plugin SQLite dùng chung
  thay cho các kho `skill-workshop/<workspace>.json` theo từng workspace. Mỗi
  đề xuất là một hàng riêng biệt trong `skill-workshop/proposals`, và bộ đếm
  review là một hàng riêng biệt trong `skill-workshop/reviews`.
- Các lượt chạy subagent review của Skill Workshop hiện sử dụng trình phân giải transcript phiên
  runtime thay vì tạo các đường dẫn phiên sidecar `skill-workshop/<sessionId>.json`.
- Các lease tiến trình ACPX hiện sử dụng trạng thái Plugin SQLite dùng chung trong
  `acpx/process-leases` thay cho một registry toàn tệp `process-leases.json`.
  Mỗi lease được lưu dưới dạng hàng riêng, duy trì việc thu hồi tiến trình cũ
  khi khởi động mà không cần đường dẫn ghi lại JSON trong runtime.
- Các script wrapper ACPX và thư mục chính Codex cô lập được tạo trong
  thư mục gốc tạm thời của OpenClaw. Chúng được tạo lại khi cần và không phải là đầu vào
  sao lưu hoặc di chuyển.
- Lưu trữ bền vững registry lượt chạy subagent sử dụng các hàng dùng chung có kiểu `subagent_runs`. Đường dẫn
  `subagents/runs.json` cũ hiện chỉ là đầu vào dọn dẹp của Doctor. Doctor
  xác nhận quyền sở hữu nó trong khóa bảo trì trạng thái, ghi lại quyết định loại bỏ trong
  SQLite và xóa nó mà không nhập trạng thái lượt chạy tạm thời. Không còn trình đọc,
  trình ghi, bộ nhớ đệm hoặc phương án dự phòng JSON nào trong runtime; việc khôi phục giữa các phiên bản đối với
  các lượt chạy đang thực hiện chỉ tồn tại trong tệp được chủ ý không hỗ trợ tại ranh giới ngừng sử dụng này.
  Các kiểm thử runtime không còn tạo các fixture `runs.json` không hợp lệ hoặc trống để chứng minh
  hành vi registry; chúng khởi tạo/đọc trực tiếp các hàng SQLite.
- Sao lưu tạo vùng tạm cho thư mục trạng thái trước khi lưu trữ, sao chép các tệp không phải cơ sở dữ liệu,
  chụp snapshot cơ sở dữ liệu bằng `VACUUM INTO`, bỏ qua các tệp sidecar WAL/SHM đang hoạt động, ghi
  siêu dữ liệu snapshot vào manifest kho lưu trữ và ghi lại
  các lượt sao lưu đã hoàn tất trong SQLite cùng với manifest kho lưu trữ. `openclaw backup
create` mặc định xác thực kho lưu trữ đã ghi; `--no-verify` là
  đường dẫn nhanh tường minh.
- `openclaw backup restore` xác thực kho lưu trữ trước khi giải nén, tái sử dụng
  manifest đã chuẩn hóa của trình xác minh và khôi phục các tài sản manifest đã xác minh về
  các đường dẫn nguồn đã ghi nhận. Nó yêu cầu `--yes` để ghi và hỗ trợ `--dry-run`
  cho kế hoạch khôi phục.
- Bộ lọc đường dẫn biến động của bản sao lưu cũ đã bị xóa. Sao lưu không còn cần
  danh sách bỏ qua khi tar trực tiếp cho các tệp JSON/JSONL phiên hoặc Cron cũ vì các snapshot
  SQLite được tạo vùng tạm trước khi tạo kho lưu trữ.
- Việc chuẩn bị không gian làm việc cho thiết lập và quy trình làm quen thông thường không còn tạo
  các thư mục `agents/<agentId>/sessions/`. Chúng chỉ tạo cấu hình/không gian làm việc;
  các hàng phiên SQLite và hàng bản ghi hội thoại được tạo theo nhu cầu trong
  cơ sở dữ liệu riêng của từng tác nhân.
- Việc sửa chữa quyền bảo mật hiện nhắm đến các cơ sở dữ liệu SQLite toàn cục và riêng của từng tác nhân
  cùng các tệp phụ WAL/SHM thay vì `sessions.json` và các tệp JSONL
  bản ghi hội thoại.
- Tên thời gian chạy của sổ đăng ký sandbox hiện mô tả trực tiếp các loại sổ đăng ký SQLite
  thay vì đưa thuật ngữ sổ đăng ký JSON cũ vào kho đang hoạt động.
- `openclaw reset --scope config+creds+sessions` xóa các cơ sở dữ liệu
  `openclaw-agent.sqlite` riêng của từng tác nhân cùng các tệp phụ WAL/SHM, không chỉ các thư mục
  `sessions/` cũ.
- Các trình trợ giúp phiên tổng hợp của Gateway hiện sử dụng tên hướng theo mục nhập:
  `loadCombinedSessionEntriesForGateway` trả về `{ databasePath, entries }`.
  Cách đặt tên kho kết hợp cũ đã bị loại bỏ khỏi các bên gọi thời gian chạy.
- Việc khởi tạo dữ liệu kênh MCP Docker hiện ghi hàng phiên chính và các sự kiện bản ghi hội thoại
  vào cơ sở dữ liệu SQLite riêng của từng tác nhân thay vì tạo
  `sessions.json` và một bản ghi hội thoại JSONL.
- Hook bộ nhớ phiên đi kèm hiện phân giải ngữ cảnh phiên trước từ
  SQLite theo `{agentId, sessionId}`. Hook này không còn quét, lưu trữ hoặc tổng hợp
  đường dẫn bản ghi hội thoại hay các thư mục `workspace/sessions`.
- Hook trình ghi nhật ký lệnh đi kèm hiện ghi các hàng kiểm toán lệnh vào bảng
  SQLite dùng chung `command_log_entries` thay vì nối thêm vào
  `logs/commands.log`.
- Danh sách cho phép ghép nối kênh hiện chỉ cung cấp các trình trợ giúp đọc/ghi dựa trên SQLite tại
  thời gian chạy. Trình phân giải đường dẫn SDK Plugin đã ngừng dùng vẫn được giữ lại để tương thích
  di chuyển; trình đọc tệp chỉ tồn tại trong mã di chuyển trạng thái của doctor.
- `migration_runs` ghi lại các lần thực thi di chuyển trạng thái cũ cùng trạng thái,
  dấu thời gian và báo cáo JSON.
- `migration_sources` ghi lại từng nguồn tệp cũ được nhập cùng hàm băm, kích thước,
  số lượng bản ghi, bảng đích, id lần chạy, trạng thái và trạng thái xóa nguồn.
- `backup_runs` ghi lại đường dẫn kho lưu trữ sao lưu, trạng thái và tệp kê khai JSON.
- Lược đồ toàn cục không giữ bảng sổ đăng ký `agents` không được sử dụng. Việc khám phá
  cơ sở dữ liệu tác nhân là sổ đăng ký `agent_databases` chuẩn cho đến khi thời gian chạy
  có một chủ sở hữu bản ghi tác nhân thực sự.
- Cấu hình danh mục mô hình được tạo được lưu trong các hàng SQLite toàn cục có kiểu
  `agent_model_catalogs`, với khóa là thư mục tác nhân. Các bên gọi thời gian chạy sử dụng
  `ensureOpenClawModelCatalog`; không có API tương thích `models.json` trong
  mã thời gian chạy. Phần triển khai ghi vào SQLite và sổ đăng ký PI nhúng được
  nạp từ tải trọng đã lưu đó mà không tạo tệp `models.json`.
- Tính năng xuất `memory.qmd.sessions` tùy chọn đọc các hàng bản ghi hội thoại chuẩn từ
  cơ sở dữ liệu riêng của từng tác nhân và hiện thực hóa Markdown đã làm sạch bên dưới thư mục chính QMD
  dưới dạng một tạo tác đầu vào QMD rõ ràng. Vì vậy, các bộ sưu tập phiên QMD và ánh xạ
  danh tính tạo tác vẫn là một phần của cầu nối công cụ bên ngoài đã cấu hình;
  chúng không phải là kho bản ghi hội thoại chuẩn thứ hai.
- `index.sqlite` riêng của QMD, cấu hình bộ sưu tập YAML và các bản tải xuống mô hình vẫn là
  tạo tác công cụ bên ngoài bên dưới `~/.openclaw/agents/<agentId>/qmd`; chúng không được
  phản chiếu vào `plugin_blob_entries`. Hoạt động điều phối QMD do OpenClaw sở hữu
  ưu tiên cơ sở dữ liệu: `state_leases` dùng chung tuần tự hóa các thao tác nhúng trên toàn cục và
  `state_leases` riêng của từng tác nhân tuần tự hóa các trình ghi bộ sưu tập/cập nhật/nhúng. Thời gian chạy không tạo
  tệp phụ khóa QMD.
- Plugin `memory-lancedb` tùy chọn không còn tạo
  `~/.openclaw/memory/lancedb` làm kho ngầm định do OpenClaw quản lý. Đây là một
  phần phụ trợ LanceDB bên ngoài và vẫn bị vô hiệu hóa cho đến khi người vận hành cấu hình một
  `dbPath` rõ ràng.
- `check:database-first-legacy-stores` đánh dấu lỗi đối với mã nguồn thời gian chạy mới ghép
  tên kho cũ với API hệ thống tệp kiểu ghi. Nó cũng đánh dấu lỗi đối với mã nguồn thời gian chạy
  đưa trở lại các dấu cầu nối bản ghi hội thoại đã ngừng sử dụng
  `transcriptLocator` hoặc `sqlite-transcript://...`. Mã di chuyển, doctor, nhập
  và xuất rõ ràng không liên quan đến phiên vẫn được phép. Các tên hợp đồng cũ rộng hơn
  như `sessionFile`, `storePath` và các facade thời kỳ tệp `SessionManager` cũ
  vẫn có chủ sở hữu hiện tại và cần công việc bảo vệ di chuyển riêng
  trước khi có thể trở thành bước kiểm tra trước bắt buộc. Cơ chế bảo vệ hiện cũng bao phủ
  các kho `cache/*.json` thời gian chạy, các tệp phụ
  `thread-bindings.json` chung, trạng thái/nhật ký chạy Cron dạng JSON, JSON tình trạng cấu hình,
  các tệp phụ khởi động lại và khóa, cài đặt Voice Wake, phê duyệt liên kết Plugin,
  JSON chỉ mục Plugin đã cài đặt, JSONL kiểm toán File Transfer, nhật ký hoạt động
  Memory Wiki, nhật ký văn bản `command-logger` đi kèm cũ và các núm điều khiển chẩn đoán JSONL
  luồng thô pi-mono. Cơ chế này cũng cấm các tên mô-đun doctor cũ ở cấp gốc để
  mã tương thích nằm trong `src/commands/doctor/`. Các trình xử lý gỡ lỗi Android
  cũng sử dụng đầu ra logcat/trong bộ nhớ thay vì tạo tạm các tệp bộ nhớ đệm `camera_debug.log` hoặc
  `debug_logs.txt`.

## Hình dạng lược đồ đích

Giữ các lược đồ tường minh. Trạng thái thời gian chạy do máy chủ sở hữu sử dụng các bảng có kiểu. Trạng thái
không rõ cấu trúc do Plugin sở hữu sử dụng `plugin_state_entries` / `plugin_blob_entries`; không có
bảng máy chủ dùng chung `kv`.

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
skill_upload_chunks(upload_id, byte_offset, size_bytes, chunk_blob)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, relay_origin, topic, environment, distribution, token_debug_suffix, updated_at_ms)
apns_registration_tombstones(node_id, deleted_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, gateway_context_path, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
workspace_path_aliases(alias_key, alias_path, workspace_key, workspace_path, updated_at_ms)
workspace_attestations(workspace_key, attested_at_ms, updated_at_ms)
workspace_generated_bootstrap_hashes(workspace_key, filename, sha256)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, agent_id, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json, cleanup_pending)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Cơ sở dữ liệu tác tử:

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
memory_index_sources(id, path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

`memory_index_sources.id` là khóa chính số nguyên ổn định; `(path, source)` vẫn là duy nhất.

Tính năng tìm kiếm trong tương lai có thể bổ sung các bảng FTS mà không thay đổi các bảng sự kiện chuẩn tắc:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Các giá trị lớn nên sử dụng cột `blob`, không mã hóa thành chuỗi JSON. Giữ
`value_json` cho dữ liệu có cấu trúc nhỏ cần tiếp tục có thể kiểm tra bằng công cụ
SQLite thông thường.

`agent_databases` là sổ đăng ký chuẩn tắc cho nhánh này. Không thêm bảng
`agents` cho đến khi có chủ sở hữu thực sự của bản ghi tác tử; cấu hình tác tử vẫn nằm trong
`openclaw.json`.

## Hình dạng di chuyển của Doctor

Doctor nên gọi một bước di chuyển tường minh, có thể báo cáo và an toàn khi
chạy lại:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` gọi phần triển khai di chuyển trạng thái sau bước
kiểm tra sơ bộ cấu hình thông thường và tạo bản sao lưu đã xác minh trước khi nhập. Quá trình
khởi động thời gian chạy và `openclaw migrate` không được nhập các tệp trạng thái OpenClaw cũ.

Các thuộc tính di chuyển:

- Một lượt di chuyển phát hiện tất cả nguồn tệp cũ và tạo kế hoạch
  trước khi thay đổi bất kỳ nội dung nào.
- Doctor tạo một kho lưu trữ sao lưu trước di chuyển đã được xác minh trước khi nhập
  các tệp cũ.
- Các lần nhập có tính lũy đẳng và được định danh bằng đường dẫn nguồn, mtime, kích thước, hàm băm và bảng
  đích.
- Các tệp nguồn được xử lý thành công sẽ bị xóa hoặc lưu trữ sau khi cơ sở dữ liệu đích
  đã commit.
- Các lần nhập thất bại giữ nguyên nguồn và ghi lại cảnh báo trong
  `migration_runs`.
- Mã thời gian chạy chỉ đọc SQLite sau khi cơ chế di chuyển đã tồn tại.
- Không yêu cầu đường dẫn hạ cấp/xuất trở lại các tệp thời gian chạy.

## Danh mục di chuyển

Di chuyển các mục sau vào cơ sở dữ liệu toàn cục:

- Các thao tác ghi khi chạy sổ đăng ký tác vụ hiện sử dụng cơ sở dữ liệu dùng chung; trình nhập sidecar chưa phát hành
  `tasks/runs.sqlite` đã bị xóa. Khi lưu ảnh chụp nhanh, hệ thống upsert theo id tác vụ
  và chỉ xóa các hàng tác vụ/phân phối bị thiếu.
- Các thao tác ghi khi chạy Task Flow hiện sử dụng cơ sở dữ liệu dùng chung; trình nhập sidecar chưa phát hành
  `tasks/flows/registry.sqlite` đã bị xóa. Khi lưu ảnh chụp nhanh, hệ thống
  upsert theo id luồng và chỉ xóa các hàng luồng bị thiếu.
- Các thao tác ghi trạng thái Plugin khi chạy hiện sử dụng cơ sở dữ liệu dùng chung; trình nhập sidecar chưa phát hành
  `plugin-state/state.sqlite` đã bị xóa.
- Tính năng tìm kiếm bộ nhớ tích hợp không còn mặc định dùng `memory/<agentId>.sqlite`; các
  bảng chỉ mục của nó nằm trong cơ sở dữ liệu của tác nhân sở hữu, còn tùy chọn chủ động bật sidecar
  `memorySearch.store.path` rõ ràng đã được chuyển sang quy trình di chuyển cấu hình
  của doctor.
- Việc lập chỉ mục lại bộ nhớ tích hợp chỉ đặt lại các bảng do bộ nhớ sở hữu trong cơ sở dữ liệu tác nhân.
  Thao tác này không được thay thế toàn bộ tệp SQLite vì cùng cơ sở dữ liệu đó còn sở hữu
  các phiên, bản chép lời, hàng VFS, tạo phẩm và bộ nhớ đệm khi chạy.
- Các sổ đăng ký vùng cách ly cho bộ chứa/trình duyệt được chuyển từ JSON nguyên khối và phân mảnh. Các thao tác
  ghi khi chạy hiện sử dụng cơ sở dữ liệu dùng chung; chức năng nhập JSON cũ vẫn được giữ lại.
- Định nghĩa tác vụ Cron, trạng thái lịch và lịch sử chạy hiện sử dụng SQLite dùng chung;
  doctor nhập/xóa các tệp `jobs.json`, `jobs-state.json` và
  `cron/runs/*.jsonl` cũ
- Danh tính/xác thực thiết bị, thông báo đẩy, kiểm tra cập nhật, cam kết, bộ nhớ đệm mô hình OpenRouter,
  chỉ mục Plugin đã cài đặt và các liên kết máy chủ ứng dụng
- Các bản ghi ghép cặp và khởi tạo thiết bị/Node hiện sử dụng các bảng SQLite có kiểu
- Người đăng ký thông báo ghép cặp thiết bị và dấu mốc yêu cầu đã phân phối hiện sử dụng
  bảng trạng thái Plugin SQLite dùng chung thay cho `device-pair-notify.json`.
- Các bản ghi cuộc gọi thoại hiện sử dụng bảng trạng thái Plugin SQLite dùng chung trong
  không gian tên `voice-call` / `calls` thay cho `calls.jsonl`; CLI của Plugin
  theo dõi nối tiếp và tóm tắt lịch sử cuộc gọi được SQLite hỗ trợ.
- Các phiên Gateway QQBot, bản ghi người dùng đã biết và bộ nhớ đệm trích dẫn ref-index hiện sử dụng
  trạng thái Plugin SQLite trong các không gian tên `qqbot` (`gateway-sessions`,
  `known-users`, `ref-index`) thay cho `session-*.json`, `known-users.json`
  và `ref-index.jsonl`. Các tệp cũ đó là bộ nhớ đệm và không được di chuyển.
- Tùy chọn bộ chọn mô hình, hàm băm triển khai lệnh và liên kết luồng của Discord
  hiện sử dụng trạng thái Plugin SQLite trong các không gian tên `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  thay cho `model-picker-preferences.json`, `command-deploy-cache.json` và
  `thread-bindings.json`; quy trình di chuyển doctor/thiết lập của Discord sẽ nhập và
  xóa các tệp cũ.
- Con trỏ bắt kịp và dấu mốc khử trùng lặp đầu vào của BlueBubbles hiện sử dụng trạng thái Plugin
  SQLite trong các không gian tên `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  thay cho `bluebubbles/catchup/*.json` và
  `bluebubbles/inbound-dedupe/*.json`; quy trình di chuyển doctor/thiết lập của BlueBubbles
  sẽ nhập và xóa các tệp cũ.
- Độ lệch cập nhật, mục bộ nhớ đệm nhãn dán, mục bộ nhớ đệm chuỗi trả lời,
  mục bộ nhớ đệm tin nhắn đã gửi, mục bộ nhớ đệm tên chủ đề và liên kết luồng
  của Telegram hiện sử dụng trạng thái Plugin SQLite trong các không gian tên `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) thay cho `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` và
  `thread-bindings-*.json`; quy trình di chuyển doctor/thiết lập của Telegram sẽ nhập và
  xóa các tệp cũ.
- Con trỏ bắt kịp, ánh xạ id ngắn của câu trả lời và các hàng khử trùng lặp tiếng vọng đã gửi
  của iMessage hiện sử dụng trạng thái Plugin SQLite trong các không gian tên `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) thay cho `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` và `imessage/sent-echoes.jsonl`; quy trình di chuyển
  doctor/thiết lập của iMessage sẽ nhập và xóa các tệp cũ.
- Các cuộc hội thoại, cuộc thăm dò, token SSO và kiến thức học được từ phản hồi của Microsoft Teams hiện
  sử dụng các không gian tên trạng thái Plugin SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) thay cho `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` và `*.learnings.json`; quy trình di chuyển
  doctor/thiết lập của Microsoft Teams sẽ nhập và lưu trữ các tệp cũ.
  Các nội dung tải lên đang chờ là bộ nhớ đệm SQLite tồn tại trong thời gian ngắn và các tệp bộ nhớ đệm JSON cũ
  không được di chuyển.
- Bộ nhớ đệm đồng bộ, siêu dữ liệu lưu trữ, liên kết luồng, dấu mốc khử trùng lặp đầu vào,
  trạng thái thời gian chờ xác minh khi khởi động, thông tin xác thực, khóa khôi phục và ảnh chụp nhanh
  mật mã IndexedDB của SDK trong Matrix hiện sử dụng các không gian tên trạng thái/blob của Plugin SQLite trong
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`,
  `matrix.inbound-dedupe.*` thông qua cơ chế khử trùng lặp có thể xác nhận của lõi,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  thay cho `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` và `crypto-idb-snapshot.json`; quy trình di chuyển doctor/thiết lập của Matrix
  sẽ nhập và xóa các tệp cũ đó (cùng các hàng SQLite `inbound-dedupe`
  theo từng thư mục gốc đã ngừng sử dụng) khỏi các thư mục gốc lưu trữ Matrix theo phạm vi tài khoản.
- Con trỏ bus và trạng thái xuất bản hồ sơ của Nostr hiện sử dụng trạng thái Plugin SQLite trong
  các không gian tên `nostr` (`bus-state`, `profile-state`) thay cho
  `bus-state-*.json` và `profile-state-*.json`; quy trình di chuyển doctor/thiết lập
  của Nostr sẽ nhập và xóa các tệp cũ.
- Các nút bật/tắt phiên Active Memory hiện sử dụng trạng thái Plugin SQLite trong
  `active-memory/session-toggles` thay cho `session-toggles.json`.
- Hàng đợi đề xuất và bộ đếm review của Skill Workshop hiện sử dụng trạng thái Plugin SQLite
  trong `skill-workshop/proposals` và `skill-workshop/reviews` thay cho
  các tệp `skill-workshop/<workspace>.json` theo từng không gian làm việc.
- Các hàng đợi phân phối đầu ra và phân phối phiên hiện dùng chung bảng SQLite toàn cục
  `delivery_queue_entries` dưới các tên hàng đợi riêng biệt
  (`outbound-delivery`, `session-delivery`) thay cho các tệp bền vững
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` và
  `session-delivery-queue/*.json`. Bước xử lý trạng thái cũ của doctor sẽ nhập
  các hàng đang chờ và thất bại, xóa dấu mốc đã phân phối lỗi thời và xóa các
  tệp JSON cũ sau khi nhập. Các trường định tuyến nóng và thử lại là các cột có kiểu;
  tải trọng JSON chỉ được giữ lại để phát lại/gỡ lỗi.
- Các lease tiến trình ACPX hiện sử dụng trạng thái Plugin SQLite trong `acpx/process-leases`
  thay cho `process-leases.json`.
- Siêu dữ liệu chạy sao lưu và di chuyển

Chuyển các mục sau vào cơ sở dữ liệu tác nhân:

- Thư mục gốc phiên tác nhân và tải trọng mục nhập phiên có hình dạng tương thích. Đã hoàn tất cho
  thao tác ghi khi chạy: siêu dữ liệu phiên nóng có thể được truy vấn trong `sessions`, trong khi
  tải trọng `SessionEntry` đầy đủ theo hình dạng cũ vẫn nằm trong `session_entries`.
- Sự kiện bản chép lời của tác nhân. Đã hoàn tất cho thao tác ghi khi chạy.
- Điểm kiểm tra Compaction và ảnh chụp nhanh bản chép lời. Đã hoàn tất cho thao tác ghi khi chạy:
  các bản sao bản chép lời tại điểm kiểm tra là các hàng bản chép lời SQLite và siêu dữ liệu điểm kiểm tra
  được ghi trong `transcript_snapshots`. Các trình trợ giúp điểm kiểm tra của Gateway
  hiện gọi các giá trị này là ảnh chụp nhanh bản chép lời thay vì tệp nguồn.
- Không gian tên nháp/không gian làm việc VFS của tác nhân. Đã hoàn tất cho thao tác ghi VFS khi chạy.
- Tải trọng tệp đính kèm của tác nhân con. Đã hoàn tất cho thao tác ghi khi chạy: chúng là các mục khởi tạo
  VFS SQLite và không bao giờ là tệp không gian làm việc bền vững.
- Tạo phẩm công cụ. Đã hoàn tất cho thao tác ghi khi chạy.
- Tạo phẩm lần chạy. Đã hoàn tất cho thao tác ghi khi chạy của worker thông qua bảng
  `run_artifacts` theo từng tác nhân.
- Bộ nhớ đệm khi chạy cục bộ của tác nhân. Đã hoàn tất cho thao tác ghi bộ nhớ đệm theo phạm vi khi chạy của worker thông qua
  bảng `cache_entries` theo từng tác nhân. Bộ nhớ đệm mô hình trên toàn Gateway vẫn nằm trong
  cơ sở dữ liệu toàn cục trừ khi chúng trở thành dành riêng cho tác nhân.
- Nhật ký luồng cha ACP. Đã hoàn tất cho thao tác ghi khi chạy.
- Các phiên sổ cái phát lại ACP. Đã hoàn tất cho thao tác ghi khi chạy qua
  `acp_replay_sessions` và `acp_replay_events`; `acp/event-ledger.json` cũ
  chỉ còn là đầu vào cho doctor.
- Siêu dữ liệu phiên ACP. Đã hoàn tất cho thao tác ghi khi chạy qua `acp_sessions`; các khối
  `entry.acp` cũ trong `sessions.json` chỉ là đầu vào cho quy trình di chuyển của doctor.
- Các sidecar quỹ đạo khi chúng không phải là tệp xuất rõ ràng. Đã hoàn tất cho thao tác
  ghi khi chạy: tính năng thu thập quỹ đạo ghi các hàng `trajectory_runtime_events`
  vào cơ sở dữ liệu tác nhân và phản chiếu các tạo phẩm theo phạm vi lần chạy vào SQLite. Các sidecar cũ chỉ là
  đầu vào nhập của doctor; thao tác xuất có thể tạo mới các đầu ra gói hỗ trợ JSONL
  nhưng không đọc hoặc di chuyển các sidecar quỹ đạo/bản chép lời cũ khi chạy.
  Tính năng thu thập quỹ đạo khi chạy cung cấp phạm vi SQLite; các trình trợ giúp đường dẫn JSONL được
  cô lập cho hỗ trợ xuất/gỡ lỗi và không được tái xuất từ mô-đun khi chạy.
  Siêu dữ liệu quỹ đạo của trình chạy nhúng ghi danh tính `{agentId, sessionId, sessionKey}`
  thay vì lưu bền vững một bộ định vị bản chép lời.

Tạm thời tiếp tục lưu các mục sau trong tệp:

- `openclaw.json`
- các tệp thông tin xác thực của nhà cung cấp hoặc CLI
- manifest Plugin/gói
- không gian làm việc của người dùng và kho Git khi chế độ đĩa được chọn
- nhật ký dành cho người vận hành theo dõi nối tiếp, trừ khi một bề mặt nhật ký cụ thể được di chuyển

## Kế hoạch di chuyển

### Giai đoạn 0: Cố định ranh giới

Làm rõ ranh giới trạng thái bền vững trước khi di chuyển thêm hàng:

- Thêm bảng `migration_runs` vào cơ sở dữ liệu toàn cục.
  Đã hoàn tất cho báo cáo thực thi di chuyển trạng thái cũ.
- Thêm một dịch vụ di chuyển trạng thái từ tệp sang cơ sở dữ liệu duy nhất do doctor sở hữu.
  Đã hoàn tất: `openclaw doctor --fix` sử dụng phần triển khai di chuyển trạng thái cũ.
- Đặt `plan` thành chỉ đọc và để `apply` tạo bản sao lưu, nhập, xác minh, sau đó
  xóa hoặc cách ly các tệp cũ.
  Đã hoàn tất: doctor tạo bản sao lưu trước di chuyển đã được xác minh, truyền đường dẫn sao lưu
  vào `migration_runs` và tái sử dụng các đường dẫn nhập/xóa.
- Thêm các lệnh cấm tĩnh để mã khi chạy mới không thể ghi tệp trạng thái cũ, trong khi
  mã di chuyển và kiểm thử vẫn có thể khởi tạo/đọc chúng.
  Đã hoàn tất cho các kho lưu trữ cũ hiện đã được di chuyển; cơ chế bảo vệ cũng quét các
  kiểm thử lồng nhau để tìm các hợp đồng bộ định vị bản chép lời khi chạy bị cấm.

### Giai đoạn 1: Hoàn thiện mặt phẳng điều khiển toàn cục

Giữ trạng thái điều phối dùng chung trong `state/openclaw.sqlite`:

- Tác nhân và sổ đăng ký cơ sở dữ liệu tác nhân
- Sổ cái tác vụ và Task Flow
- Trạng thái Plugin
- Sổ đăng ký vùng cách ly cho bộ chứa/trình duyệt
- Lịch sử chạy Cron/bộ lập lịch
- Ghép cặp, thiết bị, thông báo đẩy, kiểm tra cập nhật, TUI, bộ nhớ đệm OpenRouter/mô hình và các
  trạng thái nhỏ khác khi chạy theo phạm vi Gateway
- Siêu dữ liệu sao lưu và di chuyển
- Dữ liệu byte của tệp đính kèm phương tiện Gateway. Đã hoàn tất cho thao tác ghi khi chạy; đường dẫn tệp trực tiếp
  là các bản hiện thực hóa tạm thời để tương thích với trình gửi kênh và quá trình chuẩn bị vùng cách ly.
  Danh sách cho phép khi chạy chấp nhận đường dẫn hiện thực hóa SQLite, không chấp nhận các thư mục gốc
  phương tiện trạng thái/cấu hình cũ. Doctor nhập các tệp phương tiện cũ vào
  `media_blobs` và xóa các tệp nguồn sau khi ghi hàng thành công.
- Các phiên, sự kiện và blob tải trọng thu thập của proxy gỡ lỗi. Đã hoàn tất: dữ liệu thu thập nằm
  trong cơ sở dữ liệu trạng thái dùng chung và được mở thông qua các thiết lập khởi tạo, lược đồ,
  WAL và thời gian chờ bận của cơ sở dữ liệu trạng thái dùng chung. Dữ liệu byte của tải trọng được nén bằng gzip trong
  `capture_blobs.data`; không có cơ sở dữ liệu sidecar thay thế cho proxy gỡ lỗi khi chạy,
  thư mục blob hoặc đích lược đồ/sinh mã chỉ dành cho thu thập proxy.
  Quy trình di chuyển của doctor/khi khởi động nhập các hàng `debug-proxy/capture.sqlite` đã phát hành
  và các blob tải trọng được tham chiếu, bao gồm cả các giá trị ghi đè môi trường cho cơ sở dữ liệu/blob cũ đang hoạt động,
  sau đó lưu trữ các nguồn đó nhưng vẫn giữ nguyên chứng chỉ CA.

Giai đoạn này cũng xóa các trình mở cơ sở dữ liệu phụ trùng lặp, trình trợ giúp quyền, thiết lập WAL, thao tác dọn dẹp hệ thống tệp và trình ghi tương thích khỏi các hệ thống con đó.

### Giai đoạn 2: Giới thiệu cơ sở dữ liệu cho từng agent

Tạo một cơ sở dữ liệu cho mỗi agent và đăng ký cơ sở dữ liệu đó từ DB toàn cục:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Hàng `agent_databases` toàn cục lưu đường dẫn, phiên bản lược đồ, dấu thời gian nhìn thấy gần nhất và siêu dữ liệu cơ bản về kích thước/tính toàn vẹn. Mã runtime yêu cầu registry cung cấp DB của agent thay vì trực tiếp suy ra đường dẫn tệp.

DB của agent sở hữu:

- `sessions` làm gốc phiên chuẩn, với `session_entries` là bảng payload có hình dạng tương thích được gắn với gốc đó, và
  `session_routes` là phép tra cứu `session_key` đang hoạt động duy nhất
- `conversations` và `session_conversations` làm danh tính định tuyến nhà cung cấp đã chuẩn hóa được gắn với các phiên
- `transcript_events`
- ảnh chụp bản ghi hội thoại và checkpoint Compaction. Đã hoàn tất cho các thao tác ghi runtime.
- `vfs_entries`
- `tool_artifacts` và các artifact của lượt chạy
- các hàng runtime/bộ nhớ đệm cục bộ của agent. Đã hoàn tất cho các bộ nhớ đệm theo phạm vi worker.
- các sự kiện luồng cha ACP
- các sự kiện runtime quỹ đạo khi chúng không phải là artifact xuất rõ ràng

### Giai đoạn 3: Thay thế API kho phiên

Đã hoàn tất cho runtime. Bề mặt kho phiên có hình dạng tệp không còn là hợp đồng runtime đang hoạt động:

- Runtime không còn gọi `loadSessionStore(storePath)` hoặc coi `storePath` là danh tính phiên.
- Các thao tác hàng runtime là `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` và `listSessionEntries`.
- Các trình trợ giúp ghi lại toàn bộ kho, trình ghi tệp, kiểm thử hàng đợi, dọn dẹp bí danh và tham số xóa khóa cũ đã bị loại khỏi runtime.
- Các export tương thích đã lỗi thời của gói gốc vẫn điều chỉnh các đường dẫn `sessions.json` chuẩn sang API hàng SQLite.
- Việc phân tích `sessions.json` chỉ còn trong mã di chuyển/nhập của doctor và các kiểm thử doctor.
- Các lượt đọc dự phòng vòng đời runtime đọc header bản ghi hội thoại SQLite, không đọc các dòng đầu tiên của JSONL.

Tiếp tục xóa mọi nội dung đưa trở lại các tham số khóa tệp, thuật ngữ dọn dẹp/cắt ngắn như hoạt động bảo trì tệp, danh tính dựa trên đường dẫn kho hoặc các kiểm thử chỉ xác nhận khả năng lưu bền JSON.

### Giai đoạn 4: Di chuyển bản ghi hội thoại, luồng ACP, quỹ đạo và VFS

Chuyển mọi luồng dữ liệu của agent sang dạng thuần cơ sở dữ liệu:

- Các thao tác nối thêm bản ghi hội thoại đi qua một giao dịch SQLite duy nhất để bảo đảm header phiên tồn tại, kiểm tra tính lũy đẳng của thông báo, chọn phần đuôi cha, chèn vào `transcript_events` và ghi siêu dữ liệu danh tính có thể truy vấn vào
  `transcript_event_identities`. Đã hoàn tất cho các thao tác nối thêm trực tiếp thông báo bản ghi hội thoại và các thao tác nối thêm `TranscriptSessionManager` được lưu bền thông thường; các thao tác nhánh rõ ràng giữ nguyên lựa chọn cha rõ ràng và vẫn ghi các hàng SQLite mà không suy ra bất kỳ bộ định vị tệp nào.
- Nhật ký luồng cha ACP trở thành các hàng, không phải tệp `.acp-stream.jsonl`. Đã hoàn tất.
- Thiết lập sinh ACP không còn lưu bền các đường dẫn JSONL của bản ghi hội thoại. Đã hoàn tất.
- Hoạt động ghi lại quỹ đạo runtime ghi trực tiếp các hàng sự kiện/artifact. Lệnh hỗ trợ/xuất rõ ràng vẫn có thể tạo artifact JSONL của gói hỗ trợ dưới dạng định dạng xuất, nhưng thao tác xuất phiên không tạo lại JSONL của phiên. Đã hoàn tất.
- Workspace trên đĩa vẫn nằm trên đĩa khi được cấu hình ở chế độ đĩa.
- Không gian tạm VFS và chế độ workspace thử nghiệm chỉ dùng VFS sử dụng DB của agent.

Quá trình di chuyển nhập các tệp JSONL cũ một lần, ghi số lượng/hàm băm vào
`migration_runs` và xóa các tệp đã nhập sau khi kiểm tra tính toàn vẹn.

### Giai đoạn 5: Sao lưu, khôi phục, vacuum và xác minh

Bản sao lưu vẫn là một tệp lưu trữ duy nhất:

- Tạo checkpoint cho mọi cơ sở dữ liệu toàn cục và cơ sở dữ liệu agent.
- Chụp ảnh mỗi DB bằng ngữ nghĩa sao lưu SQLite hoặc `VACUUM INTO`.
- Lưu trữ các ảnh chụp DB đã thu gọn, cấu hình, thông tin xác thực bên ngoài và các bản xuất workspace được yêu cầu.
- Bỏ qua các tệp `*.sqlite-wal` và `*.sqlite-shm` thô đang hoạt động.
- Xác minh bằng cách mở từng ảnh chụp DB và chạy `PRAGMA integrity_check`.
  `openclaw backup create` mặc định thực hiện việc xác minh tệp lưu trữ này;
  `--no-verify` chỉ bỏ qua lượt kiểm tra tệp lưu trữ sau khi ghi, không bỏ qua kiểm tra tính toàn vẹn khi tạo ảnh chụp.
- Khôi phục sao chép các ảnh chụp trở lại đường dẫn đích. DB toàn cục được khôi phục sử dụng phiên bản `1`; DB cho từng agent được khôi phục sử dụng phiên bản `2`, trong đó các ảnh chụp phiên bản `1` được nâng cấp nguyên tử khi mở.

### Giai đoạn 6: Runtime worker

Duy trì chế độ worker ở trạng thái thử nghiệm trong khi triển khai việc phân tách cơ sở dữ liệu:

- Worker nhận mã định danh agent, mã định danh lượt chạy, chế độ hệ thống tệp và danh tính registry DB.
- Mỗi worker mở kết nối SQLite riêng.
- Tiến trình cha giữ quyền phân phối kênh, phê duyệt, cấu hình và hủy.
- Bắt đầu với một worker cho mỗi lượt chạy đang hoạt động; chỉ thêm pooling sau khi vòng đời và quyền sở hữu kết nối DB ổn định.

### Giai đoạn 7: Xóa thế giới cũ

Đã hoàn tất đối với hoạt động quản lý phiên runtime. Thế giới cũ chỉ được phép tồn tại dưới dạng đầu vào doctor rõ ràng hoặc đầu ra hỗ trợ/xuất:

- Không có thao tác ghi runtime vào `sessions.json`, JSONL bản ghi hội thoại, JSON registry sandbox, SQLite phụ của tác vụ hoặc SQLite phụ của trạng thái plugin.
- Không dọn dẹp tệp JSON/phiên, cắt ngắn bản ghi hội thoại trong tệp, khóa tệp phiên hoặc kiểm thử phiên có hình dạng khóa.
- Không có export tương thích runtime nhằm duy trì cập nhật các tệp phiên cũ.
- Các bản xuất hỗ trợ rõ ràng vẫn là định dạng lưu trữ/hiện thực hóa do người dùng yêu cầu và tuyệt đối không được đưa tên tệp trở lại danh tính runtime.

## Sao lưu và khôi phục

Bản sao lưu nên là một tệp lưu trữ duy nhất, nhưng việc thu thập cơ sở dữ liệu nên dùng cơ chế thuần SQLite:

1. Dừng hoạt động ghi kéo dài hoặc đi vào một hàng rào sao lưu ngắn.
2. Chạy checkpoint cho mọi cơ sở dữ liệu toàn cục và cơ sở dữ liệu agent.
3. Chụp ảnh cơ sở dữ liệu bằng `VACUUM INTO` vào một thư mục sao lưu tạm thời.
   Các lược đồ Plugin yêu cầu khả năng SQLite do chủ sở hữu xác định sẽ từ chối an toàn cho đến khi chủ sở hữu cung cấp một hợp đồng chụp ảnh an toàn.
4. Lưu trữ các ảnh chụp cơ sở dữ liệu, tệp cấu hình, thư mục thông tin xác thực, các workspace được chọn và một manifest.
5. Xác minh hình dạng tệp của từng ảnh chụp SQLite, sau đó mở các cơ sở dữ liệu OpenClaw chuẩn và chạy `PRAGMA integrity_check` cùng thao tác xác thực vai trò. Các lược đồ Plugin chuyên dụng vẫn không rõ nội dung trừ khi chủ sở hữu cung cấp trình xác minh.
   `openclaw backup create` mặc định thực hiện việc này; `--no-verify` chỉ dành cho trường hợp cố ý bỏ qua lượt kiểm tra tệp lưu trữ sau khi ghi.

Không dựa vào các bản sao thô đang hoạt động của `*.sqlite`, `*.sqlite-wal` và `*.sqlite-shm` làm định dạng sao lưu chính. Manifest của tệp lưu trữ phải ghi lại vai trò cơ sở dữ liệu, mã định danh agent, phiên bản lược đồ, đường dẫn nguồn, đường dẫn ảnh chụp, kích thước byte và trạng thái toàn vẹn.

Quá trình khôi phục phải xây dựng lại cơ sở dữ liệu toàn cục và các tệp cơ sở dữ liệu agent từ ảnh chụp trong tệp lưu trữ. Lược đồ toàn cục vẫn ở phiên bản `1`; các ảnh chụp cho từng agent phiên bản `1` nhận bản nâng cấp runtime có giới hạn lên phiên bản `2`. Doctor vẫn là chủ sở hữu duy nhất của thao tác nhập từ tệp vào cơ sở dữ liệu. Lệnh khôi phục xác thực tệp lưu trữ trước, sau đó thay thế từng tài sản trong manifest bằng payload đã giải nén và xác minh.

## Kế hoạch tái cấu trúc runtime

1. Thêm API registry cơ sở dữ liệu.
   - Phân giải đường dẫn DB toàn cục và DB cho từng agent.
   - Giữ lược đồ toàn cục ở `user_version = 1`. DB cho từng agent sử dụng phiên bản `2`
     với một lần di chuyển nguyên tử từ hình dạng nguồn bộ nhớ phiên bản `1` đã phát hành.
   - Thêm các trình trợ giúp đóng/checkpoint/tính toàn vẹn được kiểm thử, sao lưu và doctor sử dụng.

2. Hợp nhất các kho SQLite phụ.
   - Di chuyển các bảng trạng thái plugin vào cơ sở dữ liệu toàn cục. Đã hoàn tất cho các thao tác ghi runtime; trình nhập cơ sở dữ liệu phụ cũ chưa từng phát hành đã bị xóa.
   - Di chuyển các bảng registry tác vụ vào cơ sở dữ liệu toàn cục. Đã hoàn tất cho các thao tác ghi runtime; trình nhập cơ sở dữ liệu phụ cũ chưa từng phát hành đã bị xóa.
   - Di chuyển các bảng Task Flow vào cơ sở dữ liệu toàn cục. Đã hoàn tất cho các thao tác ghi runtime; trình nhập cơ sở dữ liệu phụ cũ chưa từng phát hành đã bị xóa.
   - Di chuyển các bảng tìm kiếm bộ nhớ tích hợp vào từng cơ sở dữ liệu agent. Đã hoàn tất; `memorySearch.store.path` tùy chỉnh rõ ràng hiện được xóa bằng quá trình di chuyển cấu hình của doctor.
     Hoạt động lập chỉ mục lại toàn phần chạy tại chỗ chỉ trên các bảng bộ nhớ; đường dẫn hoán đổi toàn bộ tệp cũ và trình trợ giúp hoán đổi chỉ mục phụ đã bị xóa.
   - Xóa các trình mở cơ sở dữ liệu, thiết lập WAL, trình trợ giúp quyền và đường dẫn đóng trùng lặp khỏi các hệ thống con đó.

3. Di chuyển các bảng thuộc sở hữu agent vào cơ sở dữ liệu cho từng agent.
   - Tạo DB của agent theo yêu cầu thông qua registry cơ sở dữ liệu toàn cục. Đã hoàn tất.
   - Di chuyển các mục phiên runtime, sự kiện bản ghi hội thoại, hàng VFS và artifact công cụ vào DB của agent. Đã hoàn tất.
   - Không di chuyển các mục phiên DB dùng chung cục bộ theo nhánh, sự kiện bản ghi hội thoại, hàng VFS hoặc artifact công cụ; bố cục đó chưa từng được phát hành. Chỉ giữ lại thao tác nhập cũ từ tệp vào cơ sở dữ liệu trong doctor.

4. Thay thế API kho phiên.
   - Loại bỏ `storePath` khỏi vai trò danh tính runtime. Đã hoàn tất cho runtime và được bảo vệ bởi `check:database-first-legacy-stores`: siêu dữ liệu phiên, cập nhật tuyến, lưu bền lệnh, dọn dẹp phiên CLI, bản xem trước suy luận Feishu, lưu bền trạng thái bản ghi hội thoại, độ sâu subagent, ghi đè phiên hồ sơ xác thực, logic phân nhánh từ cha và hoạt động kiểm tra QA-lab giờ đây phân giải cơ sở dữ liệu từ khóa agent/phiên chuẩn.
     Phản hồi danh sách phiên của Gateway/TUI/UI/macOS hiện công khai `databasePath`
     thay vì `path` cũ; các bề mặt gỡ lỗi macOS hiển thị cơ sở dữ liệu cho từng agent dưới dạng trạng thái chỉ đọc thay vì ghi cấu hình `session.store`.
     `/status`, thao tác xuất quỹ đạo từ cuộc trò chuyện và các proxy phụ thuộc CLI không còn truyền đường dẫn kho cũ; lượt đọc dự phòng mức sử dụng bản ghi hội thoại đọc SQLite theo danh tính agent/phiên. Các kiểm thử runtime và cầu nối không còn công khai
     `storePath`; đầu vào doctor/di chuyển sở hữu tên trường cũ đó.
     Hoạt động tải phiên kết hợp của Gateway không còn nhánh runtime đặc biệt cho các giá trị `session.store` không theo mẫu; nó tổng hợp các hàng SQLite cho từng agent.
     Lane doctor dành cho khóa phiên cũ và trình trợ giúp dọn dẹp `.jsonl.lock` của nó đã bị loại bỏ; SQLite giờ là ranh giới đồng thời của phiên.
     Các vị trí gọi runtime nóng sử dụng tên trình trợ giúp hướng hàng như
     `resolveSessionRowEntry`; bí danh tương thích `resolveSessionStoreEntry` cũ đã bị loại khỏi các export runtime và SDK Plugin.

- Sử dụng các thao tác hàng `{ agentId, sessionKey }`.
  Đã hoàn tất: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` và `listSessionEntries` là các API ưu tiên SQLite không yêu cầu đường dẫn kho phiên. Bản tóm tắt trạng thái, trạng thái agent cục bộ, tình trạng hệ thống và lệnh liệt kê `openclaw sessions` giờ đọc trực tiếp các hàng cho từng agent và hiển thị đường dẫn cơ sở dữ liệu SQLite cho từng agent thay vì đường dẫn `sessions.json`.
- Thay thế thao tác xóa/chèn toàn bộ kho bằng `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` và các truy vấn dọn dẹp SQL.
  Đã hoàn tất cho runtime: các đường dẫn nóng giờ sử dụng API hàng và các bản vá hàng có thử lại khi xung đột; các trình trợ giúp nhập/thay thế toàn bộ kho còn lại chỉ giới hạn trong mã nhập di chuyển và kiểm thử backend SQLite.
  - Xóa `store-writer.ts` và các kiểm thử hàng đợi trình ghi. Đã hoàn tất.
  - Xóa hoạt động dọn dẹp khóa cũ trong runtime và các tham số xóa bí danh khỏi thao tác upsert/vá hàng phiên. Đã hoàn tất.

5. Xóa hành vi registry JSON trong runtime.
   - Chuyển hoạt động đọc và ghi registry sandbox sang chỉ dùng SQLite. Đã hoàn tất.
   - Chỉ nhập JSON nguyên khối và phân mảnh từ bước di chuyển. Đã hoàn tất.
   - Loại bỏ khóa registry phân mảnh và hoạt động ghi JSON. Đã hoàn tất.

- Duy trì một bảng registry có kiểu thay vì lưu các hàng registry dưới dạng JSON mờ đục
  chung chung nếu cấu trúc này vẫn là trạng thái vận hành trên đường dẫn nóng. Đã hoàn tất.

6. Xóa thao tác biến đổi phiên theo mô hình khóa tệp.
   - Đã hoàn tất đối với việc tạo khóa trong runtime và các API khóa trong runtime.
   - Luồng dọn dẹp doctor `.jsonl.lock` độc lập kiểu cũ đã bị loại bỏ.
   - Tính toàn vẹn trạng thái không còn đường dẫn riêng để loại bỏ các tệp bản chép lời
     mồ côi; quá trình di chuyển của doctor nhập/xóa các nguồn JSONL cũ tại một nơi duy nhất.
   - Cơ chế phối hợp singleton của Gateway sử dụng các hàng SQLite `state_leases` có kiểu trong
     `gateway_locks` và không còn cung cấp điểm nối thư mục khóa tệp.
   - Cơ chế lưu bền chống trùng lặp của SDK plugin chung không còn sử dụng khóa tệp hoặc tệp
     JSON; cơ chế này ghi các hàng trạng thái plugin vào SQLite dùng chung. Đã hoàn tất.
   - Cơ chế phối hợp QMD sử dụng một lease SQLite dùng chung cho các embed và một lease SQLite
     theo từng tác nhân cho mọi trình ghi collection/update/embed. Runtime không còn
     tạo `qmd/embed.lock.lock` hoặc `agents/<agentId>/qmd-write.lock.lock`;
     Doctor chỉ xóa các sidecar đã ngừng dùng chắc chắn là cũ. Đã hoàn tất.

7. Làm cho worker nhận biết cơ sở dữ liệu.
   - Worker mở các kết nối SQLite riêng.
   - Tiến trình cha sở hữu hoạt động phân phối, callback kênh và cấu hình.
   - Worker nhận ID tác nhân, ID lượt chạy, chế độ hệ thống tệp và định danh registry
     DB, không nhận các handle đang hoạt động.
   - `vfs-only` vẫn ở trạng thái thử nghiệm và sử dụng cơ sở dữ liệu tác nhân làm thư mục gốc
     lưu trữ.
   - Trước tiên, duy trì một worker cho mỗi lượt chạy đang hoạt động. Có thể trì hoãn pooling cho đến khi
     vòng đời kết nối DB và hành vi hủy trở nên ổn định.

8. Tích hợp sao lưu.
   - Cho phép tính năng sao lưu chụp nhanh cơ sở dữ liệu toàn cục, tác nhân và plugin bằng
     `VACUUM INTO`. Đã hoàn tất cho các tệp `*.sqlite` được phát hiện trong tài sản trạng thái;
     các schema plugin yêu cầu năng lực chủ sở hữu không khả dụng sẽ đóng khi lỗi.
   - Thêm xác minh sao lưu cho tính toàn vẹn SQLite chuẩn và định danh schema,
     cùng với xác thực cấu trúc tệp chung cho các bản chụp nhanh plugin chuyên dụng. Đã hoàn tất cho
     việc tạo bản sao lưu và xác minh kho lưu trữ mặc định.
   - Ghi siêu dữ liệu lượt chạy sao lưu vào SQLite. Đã hoàn tất thông qua bảng `backup_runs`
     dùng chung với đường dẫn kho lưu trữ, trạng thái và JSON manifest.
   - Thêm khả năng khôi phục từ các bản chụp nhanh kho lưu trữ đã xác minh. Đã hoàn tất: `openclaw backup
restore` xác thực trước khi giải nén, sử dụng manifest đã chuẩn hóa
     của trình xác minh, hỗ trợ `--dry-run` và yêu cầu `--yes` trước khi thay thế
     các đường dẫn nguồn đã ghi nhận.
   - Chỉ bao gồm bản xuất VFS/workspace khi được yêu cầu; không xuất dữ liệu nội bộ
     của phiên dưới dạng JSON hoặc JSONL.

9. Xóa mã và kiểm thử lỗi thời. Đã hoàn tất cho các bề mặt phiên runtime đã biết.

- Loại bỏ các kiểm thử xác nhận runtime tạo `sessions.json` hoặc tệp JSONL
  bản chép lời. Đã hoàn tất cho kho phiên lõi, trò chuyện, sự kiện bản chép lời Gateway,
  bản xem trước, vòng đời, cập nhật mục nhập phiên của lệnh, đặt lại/theo dõi phản hồi tự động và
  fixture Dreaming của memory-core, định tuyến đích phê duyệt, sửa chữa bản chép lời
  phiên, sửa chữa quyền bảo mật, xuất quỹ đạo và xuất phiên.
  Các kiểm thử bản chép lời Active Memory giờ xác nhận phạm vi SQLite và không tạo
  tệp JSONL tạm thời hoặc được lưu bền.
  Kiểm thử hồi quy cắt tỉa bản chép lời Heartbeat cũ đã bị loại bỏ vì
  runtime không còn cắt ngắn bản chép lời JSONL.
  Các kiểm thử công cụ danh sách phiên tác nhân không còn mô hình hóa đường dẫn `sessions.json` cũ
  làm cấu trúc phản hồi Gateway; các kiểm thử ứng dụng/UI/macOS sử dụng `databasePath`.
  Các kiểm thử mức sử dụng bản chép lời `/status` giờ gieo trực tiếp các hàng bản chép lời SQLite
  thay vì ghi tệp JSONL.
  Các kiểm thử vòng đời phiên Gateway giờ sử dụng trực tiếp trình trợ giúp gieo bản chép lời SQLite;
  cấu trúc fixture tệp phiên một dòng cũ đã bị loại khỏi phạm vi kiểm thử đặt lại
  và xóa.
  `sessions.delete` không còn trả về trường `archived: []` từ thời kỳ dùng tệp; thao tác xóa
  chỉ báo cáo kết quả biến đổi hàng. Tùy chọn `deleteTranscript` cũ
  cũng đã bị loại bỏ: xóa một phiên sẽ xóa thư mục gốc `sessions` chuẩn và để
  SQLite xóa liên đới các hàng bản chép lời, bản chụp nhanh và quỹ đạo thuộc sở hữu phiên, nhờ đó không
  bên gọi nào có thể để lại bản chép lời mồ côi hoặc quên một nhánh dọn dẹp.
  Các kiểm thử ghi lại quỹ đạo của công cụ ngữ cảnh giờ đọc các hàng `trajectory_runtime_events`
  từ cơ sở dữ liệu tác nhân biệt lập thay vì đọc
  `session.trajectory.jsonl`.
  Các script gieo dữ liệu kênh MCP Docker giờ gieo trực tiếp các hàng SQLite. Hoạt động ghi trực tiếp
  `sessions.json` chỉ giới hạn ở fixture doctor.
  E2E của Tool Search Gateway đọc bằng chứng lệnh gọi công cụ từ các hàng bản chép lời SQLite
  thay vì quét các tệp `agents/<agentId>/sessions/*.jsonl`.
  Sự kiện máy chủ memory-core và các hàng nháp kho ngữ liệu phiên giờ nằm trong trạng thái plugin
  SQLite dùng chung; `events.jsonl` và `session-corpus/*.txt` chỉ là đầu vào
  di chuyển doctor cũ. Các hàng đang hoạt động sử dụng đường dẫn ảo `memory/session-ingestion/`,
  không phải `.dreams/session-corpus`. Mô-đun sửa chữa Dreaming của memory-core cũ
  và các kiểm thử CLI/Gateway của mô-đun này đã bị loại bỏ vì runtime không
  còn sở hữu việc sửa chữa kho lưu trữ tệp cho kho ngữ liệu đó. Các kiểm thử
  cầu nối/tạo phẩm công khai của memory-core không còn cung cấp `.dreams/events.jsonl`; chúng
  sử dụng tên tạo phẩm JSON ảo dựa trên SQLite.
  Tài liệu kiểm thử SDK/Codex công khai giờ ghi trạng thái phiên SQLite thay vì các tệp phiên,
  và ví dụ lượt kênh không còn cung cấp đối số `storePath`.
  Trạng thái đồng bộ Matrix giờ sử dụng trực tiếp kho trạng thái plugin SQLite. Các hợp đồng
  máy khách/runtime đang hoạt động truyền thư mục gốc lưu trữ tài khoản, không phải đường dẫn `bot-storage.json`,
  và doctor nhập `bot-storage.json` cũ vào SQLite trước khi xóa
  nguồn. Các kịch bản khởi động lại/phá hủy Matrix của QA Lab giờ trực tiếp biến đổi hàng đồng bộ SQLite
  thay vì tạo hoặc xóa các tệp `bot-storage.json` giả, và lớp nền E2EE
  truyền thư mục gốc kho đồng bộ thay vì đường dẫn `sync-store.json` giả.
  Việc lựa chọn thư mục gốc lưu trữ Matrix không còn chấm điểm các thư mục gốc dựa trên tệp JSON đồng bộ/luồng
  cũ; cơ chế này sử dụng siêu dữ liệu thư mục gốc bền vững cùng trạng thái mật mã thực.
  Bộ kiểm thử backend phiên SQLite trong runtime không còn tạo giả
  `sessions.json`; các fixture nguồn cũ giờ nằm trong kiểm thử doctor
  nhập chúng.
  Các kiểm thử phiên Gateway không còn cung cấp trình trợ giúp `createSessionStoreDir` hoặc
  thiết lập đường dẫn kho phiên tạm thời không dùng đến; các thư mục fixture được chỉ định rõ ràng và hoạt động
  thiết lập hàng trực tiếp sử dụng cách đặt tên hàng phiên SQLite.
  Phạm vi kiểm thử trình phân tích cú pháp kho phiên JSON5 chỉ dành cho doctor đã được chuyển khỏi kiểm thử hạ tầng
  sang kiểm thử di chuyển doctor, vì vậy các bộ kiểm thử runtime không còn sở hữu việc phân tích cú pháp
  tệp phiên cũ.
  Các kiểm thử SSO/tải lên đang chờ trong runtime của Microsoft Teams không còn mang theo fixture
  hoặc trình phân tích cú pháp sidecar JSON; việc phân tích cú pháp token SSO cũ chỉ nằm trong mô-đun
  di chuyển plugin. Các kiểm thử Telegram không còn gieo đường dẫn kho `/tmp/*.json` giả;
  chúng trực tiếp đặt lại bộ nhớ đệm tin nhắn dựa trên SQLite. Trình trợ giúp trạng thái kiểm thử
  OpenClaw chung không còn cung cấp trình ghi `auth-profiles.json` cũ;
  các kiểm thử di chuyển xác thực của doctor sở hữu fixture đó cục bộ.
  Các kiểm thử runtime cho con trỏ phiên cuối của TUI, phê duyệt thực thi, công tắc Active Memory,
  chống trùng lặp/xác minh khởi động Matrix, đồng bộ nguồn Memory Wiki,
  liên kết cuộc hội thoại hiện tại, xác thực khi thiết lập ban đầu và nhập secret Hermes không
  còn tạo các tệp sidecar cũ hoặc xác nhận tên tệp cũ không tồn tại. Chúng
  chứng minh hành vi thông qua các hàng SQLite và API kho công khai; kiểm thử doctor/di chuyển
  là nơi duy nhất các tên tệp nguồn cũ được phép xuất hiện.
  Các kiểm thử runtime cho ghép cặp thiết bị/Node, allowFrom của kênh, ý định khởi động lại,
  bàn giao khởi động lại, mục nhập hàng đợi phân phối phiên, tình trạng cấu hình, bộ nhớ đệm iMessage,
  công việc Cron, tiêu đề bản chép lời PI, registry tác nhân con và tệp đính kèm
  hình ảnh được quản lý cũng không còn tạo các tệp JSON/JSONL đã ngừng dùng chỉ để chứng minh
  chúng bị bỏ qua hoặc không tồn tại.
  Cơ chế khôi phục tràn PI không còn phương án dự phòng ghi lại/cắt ngắn SessionManager:
  việc cắt ngắn kết quả công cụ và ghi lại bản chép lời của công cụ ngữ cảnh biến đổi
  các hàng bản chép lời SQLite, sau đó làm mới trạng thái prompt đang hoạt động từ cơ sở dữ liệu.
  Hoạt động nối thêm thông điệp SessionManager được lưu bền ủy quyền cho trình trợ giúp nối thêm
  bản chép lời SQLite nguyên tử để chọn phần tử cha và bảo đảm tính lũy đẳng. Hoạt động nối thêm
  mục siêu dữ liệu/tùy chỉnh thông thường cũng chọn phần tử cha hiện tại bên trong SQLite, nhờ đó
  các phiên bản trình quản lý cũ không làm sống lại tình trạng tranh chấp chuỗi phần tử cha trước SQLite.
  Việc dọn dẹp phần đuôi PI tổng hợp cho các bước kiểm tra trước giữa lượt và `sessions_yield` giờ
  cắt trực tiếp trạng thái bản chép lời SQLite; cầu nối loại bỏ phần đuôi
  SessionManager cũ và các kiểm thử của nó đã bị xóa.
  Hoạt động ghi lại checkpoint Compaction cũng chỉ chụp nhanh từ SQLite; bên gọi không
  còn truyền SessionManager đang hoạt động làm nguồn bản chép lời thay thế.
- Chỉ duy trì các kiểm thử gieo tệp cũ cho mục đích di chuyển.
- Bằng chứng bằng tệp JSON đã được thay thế bằng bằng chứng hàng SQL cho các bề mặt
  runtime đang hoạt động.

- Thêm lệnh cấm tĩnh đối với hoạt động ghi trong runtime vào các đường dẫn JSON phiên/bộ nhớ đệm cũ.
  Đã hoàn tất cho cơ chế bảo vệ kho mã nguồn.

10. Làm cho báo cáo di chuyển có thể kiểm tra.
    - Ghi các lượt chạy di chuyển vào SQLite với dấu thời gian bắt đầu/kết thúc, đường dẫn
      nguồn, hàm băm nguồn, số lượng, cảnh báo và đường dẫn sao lưu.
      Đã hoàn tất: các lần thực thi di chuyển trạng thái cũ giờ lưu bền báo cáo `migration_runs`
      với danh mục đường dẫn/bảng nguồn, SHA-256 của tệp nguồn, kích thước,
      số lượng bản ghi, cảnh báo và đường dẫn sao lưu.
      Đã hoàn tất: các lần thực thi di chuyển trạng thái cũ cũng lưu bền các hàng `migration_sources`
      để kiểm tra ở cấp nguồn và phục vụ quyết định bỏ qua/điền bù trong tương lai.
    - Làm cho thao tác áp dụng có tính lũy đẳng. Việc chạy lại sau khi nhập một phần phải
      bỏ qua nguồn đã được nhập hoặc hợp nhất theo khóa ổn định.
      Đã hoàn tất: chỉ mục phiên, bản chép lời, hàng đợi phân phối, trạng thái plugin, sổ cái
      tác vụ và các hàng SQLite toàn cục thuộc sở hữu tác nhân được nhập thông qua khóa ổn định hoặc
      ngữ nghĩa upsert/thay thế, vì vậy các lần chạy lại sẽ hợp nhất mà không sao chép trùng
      các hàng bền vững.
    - Các lần nhập thất bại phải giữ nguyên tệp nguồn ban đầu tại chỗ.
      Đã hoàn tất: các lần nhập bản chép lời thất bại giờ để nguyên nguồn JSONL ban đầu tại
      đường dẫn được phát hiện, và `migration_sources` ghi nguồn là
      `warning` với `removed_source=0` cho lần chạy doctor tiếp theo.

## Quy tắc hiệu năng

- Có thể dùng một kết nối cho mỗi luồng/tiến trình; không chia sẻ handle giữa các
  worker.
- Sử dụng WAL, `foreign_keys=ON`, thời gian chờ bận 5s và các giao dịch ghi `BEGIN IMMEDIATE`
  ngắn. Không xếp chồng các lần thử lại khóa đồng bộ lên trên một lần chờ bận duy nhất
  của SQLite.
- Duy trì tính đồng bộ của các trình trợ giúp giao dịch ghi trừ khi/cho đến khi API giao dịch
  bất đồng bộ bổ sung ngữ nghĩa mutex/backpressure rõ ràng.
- Giữ các thao tác ghi phân phối của tiến trình cha nhỏ gọn và có tính giao dịch.
- Tránh ghi lại toàn bộ kho; sử dụng upsert/xóa ở cấp hàng.
- Thêm chỉ mục cho các đường dẫn liệt kê theo tác nhân, liệt kê theo phiên, thời điểm cập nhật, ID lượt chạy và
  thời hạn trước khi di chuyển mã trên đường dẫn nóng.
- Lưu các tạo phẩm lớn, nội dung đa phương tiện và vector dưới dạng BLOB hoặc hàng BLOB phân đoạn, không phải
  base64 hoặc JSON mảng số.
- Giữ các mục trạng thái plugin mờ đục nhỏ gọn và giới hạn phạm vi.
- Thêm hoạt động dọn dẹp SQL cho TTL/thời hạn thay vì cắt tỉa hệ thống tệp.
  Đã hoàn tất cho các kho runtime thuộc sở hữu cơ sở dữ liệu: nội dung đa phương tiện, trạng thái plugin, blob plugin,
  chống trùng lặp bền vững và bộ nhớ đệm tác nhân đều hết hạn thông qua các hàng SQLite. Hoạt động
  dọn dẹp hệ thống tệp còn lại chỉ giới hạn ở các bản hiện thực hóa tạm thời hoặc lệnh
  xóa rõ ràng.

## Lệnh cấm tĩnh

Thêm một bước kiểm tra kho mã nguồn để báo lỗi khi có hoạt động ghi mới trong runtime vào các đường dẫn trạng thái cũ:

- `sessions.json`
- `*.trajectory.jsonl` ngoại trừ các đầu ra gói hỗ trợ đã được hiện thực hóa
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` các tệp bộ nhớ đệm thời gian chạy
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `openclaw-workspace-state.json`
- `workspace-state.json`
- `workspace-attestations/*.attested`
- cùng cấp `<workspace>.attested`
- Matrix `credentials*.json` và `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json` / `devices/paired.json` / `devices/bootstrap.json`
  (đã ngừng sử dụng trong 2026.7: kho lưu trữ thời gian chạy là `device_pairing_*` /
  `device_bootstrap_tokens` trong cơ sở dữ liệu trạng thái dùng chung; các bản ghi đã ghép cặp được nhập khi
  gateway khởi động, các hàng đang chờ/khởi tạo tạm thời bị loại bỏ)
- `nodes/pending.json` / `nodes/paired.json` (đã ngừng sử dụng trong 2026.7: được hợp nhất vào các bản ghi thiết bị đã ghép cặp khi gateway khởi động)
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json` (đã ngừng sử dụng; chỉ Doctor nhập vào `web_push_subscriptions`)
- `push/vapid-keys.json` (đã ngừng sử dụng; chỉ Doctor nhập vào `web_push_vapid_keys`)
- `push/apns-registrations.json` (đã ngừng sử dụng; chỉ Doctor nhập vào `apns_registrations`)
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
- Xưởng Skill `skill-workshop/<workspace>.json`
- Xưởng Skill `skill-workshop/skill-workshop-review-*.json`
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
- `plugin-state/state.sqlite`
- các tệp phụ trợ thời gian chạy `openclaw-state.sqlite` tùy biến
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock.lock`
- `agents/<agentId>/qmd-write.lock.lock`
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
- `openclaw/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Wiki bộ nhớ `.openclaw-wiki/log.jsonl`
- Wiki bộ nhớ `.openclaw-wiki/state.json`
- Wiki bộ nhớ `.openclaw-wiki/locks/`
- Wiki bộ nhớ `.openclaw-wiki/source-sync.json`
- Wiki bộ nhớ `.openclaw-wiki/import-runs/*.json`
- Wiki bộ nhớ `.openclaw-wiki/cache/agent-digest.json`
- Wiki bộ nhớ `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- Trang trí hồ sơ trình duyệt `.openclaw-profile-decorated`
- `SessionManager.open(...)` các trình mở phiên dựa trên tệp
- `SessionManager.listAll(...)` và `TranscriptSessionManager.listAll(...)`
  các facade liệt kê bản ghi hội thoại
- `SessionManager.forkFromSession(...)` và
  `TranscriptSessionManager.forkFromSession(...)` các facade phân nhánh bản ghi hội thoại
- `SessionManager.newSession(...)` và `TranscriptSessionManager.newSession(...)`
  các facade thay thế phiên có thể thay đổi
- `SessionManager.createBranchedSession(...)` và
  `TranscriptSessionManager.createBranchedSession(...)` các facade phiên nhánh

Lệnh cấm nên cho phép các bài kiểm thử tạo fixture cũ và cho phép mã di chuyển
đọc/nhập/xóa các nguồn tệp cũ. Các tệp phụ trợ SQLite chưa phát hành vẫn bị cấm
và không được cấp ngoại lệ nhập qua doctor.

## Tiêu chí hoàn thành

- Dữ liệu thời gian chạy và các thao tác ghi bộ nhớ đệm được chuyển vào cơ sở dữ liệu SQLite toàn cục hoặc của tác nhân.
- Thời gian chạy không còn ghi chỉ mục phiên, JSONL bản ghi hội thoại, JSON sổ đăng ký
  sandbox, SQLite tệp phụ trợ tác vụ hoặc SQLite tệp phụ trợ trạng thái plugin. Các trình nhập
  SQLite tệp phụ trợ tác vụ và trạng thái plugin chưa phát hành bị xóa.
- Việc nhập tệp cũ chỉ được thực hiện qua doctor.
- Sao lưu tạo ra một tệp lưu trữ duy nhất với các ảnh chụp nhanh SQLite nhỏ gọn và bằng chứng toàn vẹn.
- Các worker tác nhân có thể chạy với ổ đĩa, vùng nháp VFS hoặc bộ nhớ
  thử nghiệm chỉ dùng VFS.
- Cấu hình và các tệp thông tin xác thực rõ ràng vẫn là những tệp điều khiển
  không thuộc cơ sở dữ liệu duy nhất được kỳ vọng sẽ tồn tại lâu dài.
- Các bước kiểm tra kho mã ngăn việc đưa lại các kho tệp thời gian chạy cũ.
