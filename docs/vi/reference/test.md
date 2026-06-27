---
read_when:
    - Chạy hoặc sửa kiểm thử
summary: Cách chạy kiểm thử cục bộ (vitest) và khi nào dùng các chế độ force/coverage
title: Kiểm thử
x-i18n:
    generated_at: "2026-06-27T18:11:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba6d1665497bebed287e69c865407dfb233ad60d64175558d053a69c72fea217
    source_path: reference/test.md
    workflow: 16
---

- Bộ kiểm thử đầy đủ (bộ kiểm thử, trực tiếp, Docker): [Kiểm thử](/vi/help/testing)
- Xác thực bản cập nhật và gói plugin: [Kiểm thử bản cập nhật và plugin](/vi/help/testing-updates-plugins)

- Thứ tự kiểm thử cục bộ thường lệ:
  1. `pnpm test:changed` để có bằng chứng Vitest theo phạm vi đã thay đổi.
  2. `pnpm test <path-or-filter>` cho một tệp, thư mục hoặc mục tiêu rõ ràng.
  3. `pnpm test` chỉ khi bạn chủ động cần toàn bộ bộ Vitest cục bộ.
- `pnpm test:force`: Dừng mọi tiến trình gateway còn sót lại đang giữ cổng điều khiển mặc định, rồi chạy toàn bộ bộ Vitest với một cổng gateway tách biệt để các bài kiểm thử máy chủ không xung đột với phiên bản đang chạy. Dùng lệnh này khi một lần chạy gateway trước đó để lại cổng 18789 bị chiếm dụng.
- `pnpm test:coverage`: Chạy bộ kiểm thử đơn vị với độ bao phủ V8 (qua `vitest.unit.config.ts`). Đây là cổng độ bao phủ cho làn đơn vị mặc định, không phải độ bao phủ toàn bộ mọi tệp trong repo. Ngưỡng là 70% cho dòng/hàm/câu lệnh và 55% cho nhánh. Vì `coverage.all` là false và phạm vi bao phủ của làn mặc định chỉ bao gồm các bài kiểm thử đơn vị không nhanh có tệp nguồn cùng cấp, cổng này đo nguồn do làn này sở hữu thay vì mọi import bắc cầu mà nó tình cờ tải.
- `pnpm test:coverage:changed`: Chỉ chạy độ bao phủ đơn vị cho các tệp đã thay đổi kể từ `origin/main`.
- `pnpm test:changed`: lần chạy kiểm thử thay đổi thông minh, rẻ. Nó chạy các mục tiêu chính xác từ các chỉnh sửa kiểm thử trực tiếp, tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng và đồ thị import cục bộ. Các thay đổi rộng về cấu hình/gói bị bỏ qua trừ khi chúng ánh xạ tới các bài kiểm thử chính xác.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: lần chạy kiểm thử thay đổi rộng rõ ràng. Dùng khi một chỉnh sửa harness/cấu hình/gói kiểm thử nên quay về hành vi kiểm thử thay đổi rộng hơn của Vitest.
- `pnpm changed:lanes`: hiển thị các làn kiến trúc được kích hoạt bởi diff so với `origin/main`.
- `pnpm check:changed`: mặc định ủy quyền cho Crabbox/Testbox bên ngoài CI, rồi chạy cổng kiểm tra thay đổi thông minh cho diff so với `origin/main` bên trong tiến trình con từ xa. Nó chạy typecheck, lint và các lệnh guard cho các làn kiến trúc bị ảnh hưởng, nhưng không chạy kiểm thử Vitest. Dùng `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử.
- Worktree Codex và checkout liên kết/thưa: tránh chạy trực tiếp cục bộ `pnpm test*`, `pnpm check*` và `pnpm crabbox:run` trừ khi bạn đã xác minh pnpm sẽ không điều hòa lại dependency. Với bằng chứng rất nhỏ trên tệp rõ ràng, dùng `node scripts/run-vitest.mjs <path-or-filter>`; với cổng thay đổi hoặc bằng chứng rộng, dùng `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` để pnpm chạy bên trong Testbox.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: giữ việc tuần tự hóa kiểm tra nặng trong worktree hiện tại thay vì thư mục Git chung cho các lệnh như `pnpm check:changed` và `pnpm test ...` có mục tiêu. Chỉ dùng trên các máy chủ cục bộ dung lượng cao khi bạn chủ động chạy các kiểm tra độc lập trên nhiều worktree liên kết.
- `pnpm test`: định tuyến các mục tiêu tệp/thư mục rõ ràng qua các làn Vitest có phạm vi. Các lần chạy không có mục tiêu là bằng chứng toàn bộ bộ: chúng dùng các nhóm shard cố định, mở rộng thành cấu hình lá để thực thi song song cục bộ, và in fanout shard cục bộ dự kiến trước khi bắt đầu. Nhóm extension luôn mở rộng thành các cấu hình shard theo từng extension thay vì một tiến trình dự án gốc khổng lồ.
- Các lần chạy wrapper kiểm thử kết thúc bằng tóm tắt ngắn dạng `[test] passed|failed|skipped ... in ...`. Dòng thời lượng riêng của Vitest vẫn là chi tiết theo từng shard.
- Trạng thái kiểm thử OpenClaw dùng chung: dùng `src/test-utils/openclaw-test-state.ts` từ Vitest khi một bài kiểm thử cần `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture cấu hình, workspace, thư mục agent hoặc kho auth-profile tách biệt.
- `pnpm test:env-mutations:report`: báo cáo không chặn về các bài kiểm thử và harness sửa đổi trực tiếp `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` hoặc các khóa env OpenClaw liên quan. Dùng để tìm ứng viên cần chuyển sang helper trạng thái kiểm thử dùng chung.
- E2E mô phỏng Control UI: dùng `pnpm test:ui:e2e` cho làn Vitest + Playwright khởi động Vite Control UI và điều khiển một trang Chromium thật với Gateway WebSocket được mô phỏng. Kiểm thử nằm trong `ui/src/**/*.e2e.test.ts`; mock và điều khiển dùng chung nằm trong `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` bao gồm làn này. Trong worktree Codex, ưu tiên `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` cho bằng chứng nhỏ có mục tiêu sau khi dependency đã được cài đặt, hoặc Testbox/Crabbox cho bằng chứng GUI rộng hơn.
- Helper E2E tiến trình: dùng `test/helpers/openclaw-test-instance.ts` khi một bài kiểm thử E2E cấp tiến trình Vitest cần Gateway đang chạy, env CLI, thu log và dọn dẹp ở cùng một nơi.
- Kiểm thử TUI PTY: dùng `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` cho làn PTY backend giả nhanh. Dùng `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` hoặc `pnpm tui:pty:test:watch --mode local` cho smoke `tui --local` chậm hơn, vốn chỉ mô phỏng endpoint mô hình bên ngoài. Assert văn bản hiển thị ổn định hoặc các lệnh gọi fixture, không assert snapshot ANSI thô.
- Helper Docker/Bash E2E: các làn source `scripts/lib/docker-e2e-image.sh` có thể truyền `docker_e2e_test_state_shell_b64 <label> <scenario>` vào container và giải mã bằng `scripts/lib/openclaw-e2e-instance.sh`; các script nhiều home có thể truyền `docker_e2e_test_state_function_b64` và gọi `openclaw_test_state_create <label> <scenario>` trong từng luồng. Caller cấp thấp hơn có thể dùng `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` cho đoạn shell trong container, hoặc `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` cho tệp env máy chủ có thể source. Dấu `--` trước `create` ngăn các runtime Node mới hơn coi `--env-file` là cờ Node. Các làn Docker/Bash khởi chạy Gateway có thể source `scripts/lib/openclaw-e2e-instance.sh` bên trong container để phân giải entrypoint, khởi động OpenAI mock, khởi chạy Gateway foreground/background, probe sẵn sàng, export env trạng thái, dump log và dọn dẹp tiến trình.
- Các lần chạy shard toàn phần, extension và include-pattern cập nhật dữ liệu thời gian cục bộ trong `.artifacts/vitest-shard-timings.json`; các lần chạy toàn cấu hình sau đó dùng các thời gian này để cân bằng shard chậm và nhanh. Các shard CI include-pattern thêm tên shard vào khóa thời gian, giúp thời gian shard đã lọc vẫn hiển thị mà không thay thế dữ liệu thời gian toàn cấu hình. Đặt `OPENCLAW_TEST_PROJECTS_TIMINGS=0` để bỏ qua artifact thời gian cục bộ.
- Các tệp kiểm thử `plugin-sdk` và `commands` được chọn hiện được định tuyến qua các làn nhẹ chuyên dụng chỉ giữ `test/setup.ts`, để các trường hợp nặng về runtime ở lại các làn hiện có của chúng.
- Các tệp nguồn có kiểm thử cùng cấp ánh xạ tới kiểm thử cùng cấp đó trước khi quay về glob thư mục rộng hơn. Các chỉnh sửa helper dưới `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` và `src/plugins/contracts` dùng đồ thị import cục bộ để chạy các kiểm thử đang import thay vì chạy rộng mọi shard khi đường dẫn dependency là chính xác.
- `auto-reply` hiện cũng tách thành ba cấu hình chuyên dụng (`core`, `top-level`, `reply`) để harness reply không lấn át các kiểm thử trạng thái/token/helper top-level nhẹ hơn.
- Cấu hình Vitest cơ sở hiện mặc định là `pool: "threads"` và `isolate: false`, với runner không tách biệt dùng chung được bật trên các cấu hình repo.
- `pnpm test:channels` chạy `vitest.channels.config.ts`.
- `pnpm test:extensions` và `pnpm test extensions` chạy tất cả shard extension/plugin. Các plugin kênh nặng, plugin trình duyệt và OpenAI chạy dưới dạng shard chuyên dụng; các nhóm plugin khác vẫn được gom lô. Dùng `pnpm test extensions/<id>` cho một làn plugin bundled.
- `pnpm test:perf:imports`: bật báo cáo thời lượng import + phân rã import của Vitest, trong khi vẫn dùng định tuyến làn có phạm vi cho các mục tiêu tệp/thư mục rõ ràng.
- `pnpm test:perf:imports:changed`: profiling import tương tự, nhưng chỉ cho các tệp đã thay đổi kể từ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark đường dẫn chế độ thay đổi đã định tuyến so với lần chạy dự án gốc native cho cùng diff git đã commit.
- `pnpm test:perf:changed:bench -- --worktree` benchmark tập thay đổi worktree hiện tại mà không cần commit trước.
- `pnpm test:perf:profile:main`: ghi CPU profile cho luồng chính Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: ghi CPU + heap profile cho runner đơn vị (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: chạy tuần tự mọi cấu hình lá Vitest toàn bộ bộ và ghi dữ liệu thời lượng theo nhóm cùng artifact JSON/log theo từng cấu hình. Test Performance Agent dùng dữ liệu này làm baseline trước khi thử sửa các bài kiểm thử chậm.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: so sánh các báo cáo theo nhóm sau một thay đổi tập trung vào hiệu năng.
- `pnpm test:docker:timings <summary.json>` kiểm tra các làn Docker chậm sau một lần chạy Docker toàn bộ; dùng `pnpm test:docker:rerun <run-id|summary.json|failures.json>` để in các lệnh chạy lại rẻ có mục tiêu từ cùng artifact.
- Tích hợp Gateway: bật chọn qua `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` hoặc `pnpm test:gateway`.
- `pnpm test:e2e`: Chạy tổng hợp E2E của repo: các kiểm thử smoke đầu-cuối Gateway cộng với làn E2E trình duyệt mô phỏng Control UI.
- `pnpm test:e2e:gateway`: Chạy các kiểm thử smoke đầu-cuối Gateway (ghép cặp nhiều phiên bản WS/HTTP/node). Mặc định là `threads` + `isolate: false` với worker thích nghi trong `vitest.e2e.config.ts`; tinh chỉnh bằng `OPENCLAW_E2E_WORKERS=<n>` và đặt `OPENCLAW_E2E_VERBOSE=1` để có log chi tiết.
- `pnpm test:live`: Chạy kiểm thử live của provider (minimax/zai). Yêu cầu API key và `LIVE=1` (hoặc `*_LIVE_TEST=1` theo từng provider) để không bỏ qua.
- `pnpm test:docker:all`: Xây dựng ảnh live-test dùng chung, đóng gói OpenClaw một lần dưới dạng npm tarball, xây dựng/tái sử dụng ảnh runner Node/Git tối giản cùng một ảnh chức năng cài tarball đó vào `/app`, rồi chạy các lane smoke Docker với `OPENCLAW_SKIP_DOCKER_BUILD=1` thông qua bộ lập lịch có trọng số. Ảnh tối giản (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) được dùng cho các lane installer/update/plugin-dependency; các lane đó mount tarball đã dựng sẵn thay vì dùng nguồn repo được sao chép. Ảnh chức năng (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) được dùng cho các lane chức năng ứng dụng đã build thông thường. `scripts/package-openclaw-for-docker.mjs` là trình đóng gói package cục bộ/CI duy nhất và xác thực tarball cùng `dist/postinstall-inventory.json` trước khi Docker sử dụng. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi plan đã chọn. `node scripts/test-docker-all.mjs --plan-json` xuất plan CI do bộ lập lịch sở hữu cho các lane đã chọn, loại ảnh, nhu cầu package/live-image, kịch bản trạng thái và kiểm tra credential mà không build hoặc chạy Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` kiểm soát số slot tiến trình và mặc định là 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` kiểm soát pool tail nhạy với provider và mặc định là 10. Giới hạn lane nặng mặc định là `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; giới hạn provider mặc định là một lane nặng cho mỗi provider thông qua `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, và `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Dùng `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` cho host lớn hơn. Nếu một lane vượt quá trọng số hiệu dụng hoặc giới hạn tài nguyên trên host có mức song song thấp, lane đó vẫn có thể bắt đầu từ pool trống và sẽ chạy một mình cho đến khi giải phóng dung lượng. Theo mặc định, thời điểm bắt đầu lane được giãn cách 2 giây để tránh các đợt tạo container dồn dập trên Docker daemon cục bộ; ghi đè bằng `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner mặc định preflight Docker, dọn các container OpenClaw E2E cũ, xuất trạng thái lane đang hoạt động mỗi 30 giây, chia sẻ cache công cụ CLI của provider giữa các lane tương thích, thử lại lỗi live-provider tạm thời một lần theo mặc định (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), và lưu thời lượng lane trong `.artifacts/docker-tests/lane-timings.json` để chạy theo thứ tự dài nhất trước trong các lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane mà không chạy Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` để tinh chỉnh đầu ra trạng thái, hoặc `OPENCLAW_DOCKER_ALL_TIMINGS=0` để tắt tái sử dụng thời lượng. Dùng `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` chỉ cho các lane xác định/cục bộ hoặc `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` chỉ cho các lane live-provider; alias package là `pnpm test:docker:local:all` và `pnpm test:docker:live:all`. Chế độ chỉ live gộp các lane live chính và tail vào một pool dài nhất trước để các bucket provider có thể gom việc của Claude, Codex và Gemini cùng nhau. Runner dừng lập lịch các lane pooled mới sau lỗi đầu tiên trừ khi đặt `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, và mỗi lane có timeout dự phòng 120 phút có thể ghi đè bằng `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; một số lane live/tail được chọn dùng giới hạn chặt hơn theo từng lane. Các lệnh thiết lập Docker cho backend CLI có timeout riêng qua `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (mặc định 180). Log theo từng lane, `summary.json`, `failures.json`, và thời lượng từng pha được ghi dưới `.artifacts/docker-tests/<run-id>/`; dùng `pnpm test:docker:timings <summary.json>` để kiểm tra các lane chậm và `pnpm test:docker:rerun <run-id|summary.json|failures.json>` để in các lệnh chạy lại có mục tiêu và ít tốn kém.
- `pnpm test:docker:browser-cdp-snapshot`: Xây dựng container E2E nguồn dựa trên Chromium, khởi động CDP thô cùng một Gateway cô lập, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP có URL liên kết, phần tử có thể nhấp được nâng từ con trỏ, tham chiếu iframe và metadata khung.
- `pnpm test:docker:skill-install`: Cài tarball OpenClaw đã đóng gói trong runner Docker tối giản, tắt `skills.install.allowUploadedArchives`, phân giải một slug skill hiện tại từ tìm kiếm live ClawHub, cài đặt qua `openclaw skills install`, và xác minh `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json`, và `skills info --json`.
- Probe Docker live cho backend CLI có thể chạy dưới dạng các lane tập trung, ví dụ `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume`, hoặc `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini có các alias `:resume` và `:mcp` tương ứng.
- `pnpm test:docker:openwebui`: Khởi động OpenClaw + Open WebUI trong Docker, đăng nhập qua Open WebUI, kiểm tra `/api/models`, rồi chạy một cuộc chat proxy thực qua `/api/chat/completions`. Yêu cầu key model live có thể dùng được, kéo một ảnh Open WebUI bên ngoài, và không được kỳ vọng ổn định trên CI như các bộ unit/e2e thông thường.
- `pnpm test:docker:mcp-channels`: Khởi động một container Gateway đã seed và một container client thứ hai sinh `openclaw mcp serve`, rồi xác minh khám phá cuộc hội thoại được định tuyến, đọc transcript, metadata tệp đính kèm, hành vi hàng đợi sự kiện live, định tuyến gửi outbound, và thông báo kiểu Claude về kênh + quyền trên cầu nối stdio thật. Assertion thông báo Claude đọc trực tiếp các frame MCP stdio thô để smoke phản ánh đúng nội dung cầu nối thực sự phát ra.
- `pnpm test:docker:upgrade-survivor`: Cài tarball OpenClaw đã đóng gói đè lên fixture người dùng cũ bẩn, chạy cập nhật package cùng doctor không tương tác mà không có key live provider hoặc kênh, rồi khởi động Gateway local loopback và kiểm tra rằng agent, cấu hình kênh, danh sách cho phép Plugin, tệp workspace/session, trạng thái phụ thuộc Plugin legacy cũ, startup, và trạng thái RPC vẫn sống sót.
- `pnpm test:docker:published-upgrade-survivor`: Mặc định cài `openclaw@latest`, seed các tệp người dùng hiện có thực tế mà không có key live provider hoặc kênh, cấu hình baseline đó bằng một recipe lệnh `openclaw config set` đã nhúng sẵn, cập nhật bản cài đã phát hành đó lên tarball OpenClaw đã đóng gói, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động Gateway local loopback và kiểm tra rằng intent đã cấu hình, tệp workspace/session, cấu hình Plugin cũ và trạng thái phụ thuộc legacy, startup, `/healthz`, `/readyz`, và trạng thái RPC vẫn sống sót hoặc được sửa sạch. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, mở rộng một ma trận cục bộ chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, hoặc thêm fixture kịch bản bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; bộ reported-issues bao gồm `configured-plugin-installs` để xác minh các Plugin OpenClaw bên ngoài đã cấu hình được cài tự động trong quá trình nâng cấp và `stale-source-plugin-shadow` để ngăn shadow Plugin chỉ có nguồn làm hỏng startup. Package Acceptance hiển thị các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, và `published_upgrade_survivor_scenarios`, đồng thời phân giải token meta baseline như `last-stable-4` hoặc `all-since-2026.4.23` trước khi chuyển thông số package chính xác cho các lane Docker.
- `pnpm test:docker:update-migration`: Chạy harness published-upgrade survivor trong kịch bản `plugin-deps-cleanup` nặng về dọn dẹp, mặc định bắt đầu từ `openclaw@2026.4.23`. Workflow `Update Migration` riêng mở rộng lane này với `baselines=all-since-2026.4.23` để mọi package ổn định đã phát hành từ `.23` trở đi cập nhật lên candidate và chứng minh việc dọn dẹp phụ thuộc Plugin đã cấu hình bên ngoài Full Release CI.
- `pnpm test:docker:plugins`: Chạy smoke cài đặt/cập nhật cho đường dẫn cục bộ, package `file:`, package npm registry có phụ thuộc hoisted, ref git di chuyển, fixture ClawHub, cập nhật marketplace, và bật/kiểm tra bundle Claude.

## Cổng PR cục bộ

Để chạy các kiểm tra land/gate PR cục bộ, chạy:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Nếu `pnpm test` chập chờn trên host đang tải nặng, chạy lại một lần trước khi coi đó là hồi quy, rồi cô lập bằng `pnpm test <path/to/test>`. Với các host hạn chế bộ nhớ, dùng:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Bench độ trễ mô hình (khóa cục bộ)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Cách dùng:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Env tùy chọn: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt mặc định: "Trả lời bằng một từ duy nhất: ok. Không có dấu câu hoặc văn bản bổ sung."

Lần chạy gần nhất (2025-12-31, 20 lần chạy):

- minimax trung vị 1279ms (tối thiểu 1114, tối đa 2431)
- opus trung vị 2454ms (tối thiểu 1224, tối đa 3170)

## Bench khởi động CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Cách dùng:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: cả hai preset

Đầu ra bao gồm `sampleCount`, trung bình, p50, p95, tối thiểu/tối đa, phân phối exit-code/signal, và tóm tắt RSS tối đa cho từng lệnh. `--cpu-prof-dir` / `--heap-prof-dir` tùy chọn ghi hồ sơ V8 cho mỗi lần chạy để việc đo thời gian và thu hồ sơ dùng cùng một harness.

Quy ước đầu ra đã lưu:

- `pnpm test:startup:bench:smoke` ghi artifact smoke được nhắm mục tiêu tại `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` ghi artifact full-suite tại `.artifacts/cli-startup-bench-all.json` bằng `runs=5` và `warmup=1`
- `pnpm test:startup:bench:update` làm mới fixture baseline được check-in tại `test/fixtures/cli-startup-bench.json` bằng `runs=5` và `warmup=1`

Fixture được check-in:

- `test/fixtures/cli-startup-bench.json`
- Làm mới bằng `pnpm test:startup:bench:update`
- So sánh kết quả hiện tại với fixture bằng `pnpm test:startup:bench:check`

## Bench khởi động Gateway

Script: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

Benchmark mặc định dùng entry CLI đã build tại `dist/entry.js`; chạy
`pnpm build` trước khi dùng các lệnh package-script. Để đo source
runner thay vào đó, truyền `--entry scripts/run-node.mjs` và giữ các kết quả đó
tách biệt với baseline của entry đã build.

Cách dùng:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

ID case:

- `default`: khởi động Gateway bình thường.
- `skipChannels`: khởi động Gateway với phần khởi động kênh được bỏ qua.
- `oneInternalHook`: một hook nội bộ được cấu hình.
- `allInternalHooks`: tất cả hook nội bộ.
- `fiftyPlugins`: 50 Plugin manifest.
- `fiftyStartupLazyPlugins`: 50 Plugin manifest khởi động lười.

Đầu ra bao gồm đầu ra tiến trình đầu tiên, `/healthz`, `/readyz`, thời gian log lắng nghe HTTP,
thời gian log Gateway sẵn sàng, thời gian CPU, tỷ lệ lõi CPU, RSS tối đa, heap, chỉ số
startup trace, độ trễ event-loop, và chỉ số chi tiết bảng tra cứu Plugin. Script
bật `OPENCLAW_GATEWAY_STARTUP_TRACE=1` trong môi trường Gateway con.

Đọc `/healthz` là liveness: máy chủ HTTP có thể trả lời. Đọc `/readyz` là
usable readiness: các sidecar Plugin khởi động, kênh, và công việc
post-attach ready-critical đã ổn định. Hook khởi động Gateway được dispatch
bất đồng bộ và không thuộc bảo đảm readiness. Thời gian log ready là dấu thời gian
log ready nội bộ của Gateway; nó hữu ích cho quy trách nhiệm phía tiến trình
nhưng không thay thế cho probe `/readyz` bên ngoài.

Dùng đầu ra JSON hoặc `--output` khi so sánh thay đổi. Chỉ dùng `--cpu-prof-dir`
sau khi đầu ra trace chỉ vào import, compile, hoặc công việc giới hạn bởi CPU không thể
giải thích chỉ bằng thời gian pha. Không so sánh kết quả source-runner với
kết quả `dist/entry.js` đã build như cùng một baseline.

## Bench khởi động lại Gateway

Script: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Benchmark khởi động lại chỉ được hỗ trợ trên macOS và Linux. Nó dùng SIGUSR1 cho
khởi động lại trong tiến trình và thất bại ngay lập tức trên Windows.

Benchmark mặc định dùng entry CLI đã build tại `dist/entry.js`; chạy
`pnpm build` trước khi dùng các lệnh package-script. Để đo source
runner thay vào đó, truyền `--entry scripts/run-node.mjs` và giữ các kết quả đó
tách biệt với baseline của entry đã build.

Cách dùng:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

ID case:

- `skipChannels`: khởi động lại với các kênh được bỏ qua.
- `skipChannelsAcpxProbe`: khởi động lại với các kênh được bỏ qua và ACPX startup probe bật.
- `skipChannelsNoAcpxProbe`: khởi động lại với các kênh được bỏ qua và ACPX startup probe tắt.
- `default`: khởi động lại bình thường.
- `fiftyPlugins`: khởi động lại với 50 Plugin manifest.

Đầu ra bao gồm `/healthz` tiếp theo, `/readyz` tiếp theo, thời gian ngừng hoạt động, thời điểm ready sau khởi động lại,
CPU, RSS, chỉ số startup trace cho tiến trình thay thế, và chỉ số restart trace
cho xử lý tín hiệu, xả active-work, các pha đóng, lần start tiếp theo, thời điểm ready,
và snapshot bộ nhớ. Script bật
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` và `OPENCLAW_GATEWAY_RESTART_TRACE=1` trong
môi trường Gateway con.

Dùng benchmark này khi thay đổi chạm đến tín hiệu khởi động lại, close handler,
startup-after-restart, tắt sidecar, chuyển giao dịch vụ, hoặc readiness sau
khởi động lại. Bắt đầu với `skipChannels` khi cô lập cơ chế Gateway khỏi khởi động
kênh. Chỉ dùng `default` hoặc các case nhiều Plugin sau khi case hẹp giải thích được
đường dẫn khởi động lại.

Chỉ số trace là gợi ý quy trách nhiệm, không phải phán quyết. Một thay đổi khởi động lại nên được
đánh giá từ nhiều mẫu, span owner khớp, hành vi `/healthz` và `/readyz`,
và hợp đồng khởi động lại người dùng thấy được.

## Onboarding E2E (Docker)

Docker là tùy chọn; chỉ cần mục này cho các kiểm thử smoke onboarding được container hóa.

Luồng cold-start đầy đủ trong một container Linux sạch:

```bash
scripts/e2e/onboard-docker.sh
```

Script này điều khiển trình hướng dẫn tương tác qua pseudo-tty, xác minh các tệp config/workspace/session, rồi khởi động Gateway và chạy `openclaw health`.

## Smoke nhập QR (Docker)

Đảm bảo helper runtime QR được duy trì tải được dưới các runtime Docker Node được hỗ trợ (Node 24 mặc định, Node 22 tương thích):

```bash
pnpm test:docker:qr
```

## Liên quan

- [Kiểm thử](/vi/help/testing)
- [Kiểm thử live](/vi/help/testing-live)
- [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins)
