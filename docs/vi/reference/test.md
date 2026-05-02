---
read_when:
    - Chạy hoặc sửa lỗi kiểm thử
summary: Cách chạy kiểm thử cục bộ (vitest) và khi nào dùng các chế độ bắt buộc/phủ mã
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-02T10:52:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1100eb4c5990de1a56c8fd65c6152318316232414078cdaad122d4525bf27fee
    source_path: reference/test.md
    workflow: 16
---

- Bộ công cụ kiểm thử đầy đủ (bộ kiểm thử, trực tiếp, Docker): [Kiểm thử](/vi/help/testing)
- Xác thực bản cập nhật và gói Plugin: [Kiểm thử bản cập nhật và Plugin](/vi/help/testing-updates-plugins)

- `pnpm test:force`: Dừng mọi tiến trình Gateway còn sót lại đang giữ cổng điều khiển mặc định, sau đó chạy toàn bộ bộ Vitest bằng một cổng Gateway cô lập để các bài kiểm thử máy chủ không xung đột với một phiên bản đang chạy. Dùng lệnh này khi một lần chạy Gateway trước đó khiến cổng 18789 bị chiếm dụng.
- `pnpm test:coverage`: Chạy bộ đơn vị với V8 coverage (qua `vitest.unit.config.ts`). Đây là cổng bao phủ đơn vị theo tệp đã tải, không phải bao phủ toàn bộ tệp trong toàn repo. Các ngưỡng là 70% cho dòng/hàm/câu lệnh và 55% cho nhánh. Vì `coverage.all` là false, cổng này đo các tệp được bộ bao phủ đơn vị tải thay vì coi mọi tệp nguồn thuộc lane tách riêng là chưa được bao phủ.
- `pnpm test:coverage:changed`: Chỉ chạy bao phủ đơn vị cho các tệp đã thay đổi kể từ `origin/main`.
- `pnpm test:changed`: lần chạy kiểm thử thay đổi thông minh, nhẹ. Lệnh này chạy các mục tiêu chính xác từ các chỉnh sửa kiểm thử trực tiếp, các tệp `*.test.ts` cùng cấp, ánh xạ nguồn tường minh, và đồ thị import cục bộ. Các thay đổi rộng/cấu hình/gói bị bỏ qua trừ khi chúng ánh xạ tới các bài kiểm thử chính xác.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: lần chạy kiểm thử thay đổi rộng tường minh. Dùng lệnh này khi một chỉnh sửa harness/cấu hình/gói kiểm thử nên quay về hành vi kiểm thử thay đổi rộng hơn của Vitest.
- `pnpm changed:lanes`: hiển thị các lane kiến trúc được kích hoạt bởi diff so với `origin/main`.
- `pnpm check:changed`: chạy cổng kiểm tra thay đổi thông minh cho diff so với `origin/main`. Lệnh này chạy typecheck, lint, và các lệnh guard cho các lane kiến trúc bị ảnh hưởng, nhưng không chạy kiểm thử Vitest. Dùng `pnpm test:changed` hoặc `pnpm test <target>` tường minh để có bằng chứng kiểm thử.
- `pnpm test`: định tuyến các mục tiêu tệp/thư mục tường minh qua các lane Vitest theo phạm vi. Các lần chạy không có mục tiêu dùng các nhóm shard cố định và mở rộng thành cấu hình lá để thực thi song song cục bộ; nhóm phần mở rộng luôn mở rộng thành các cấu hình shard theo từng phần mở rộng thay vì một tiến trình root-project khổng lồ.
- Các lần chạy test wrapper kết thúc bằng một tóm tắt ngắn dạng `[test] passed|failed|skipped ... in ...`. Dòng thời lượng riêng của Vitest vẫn là chi tiết theo từng shard.
- Trạng thái kiểm thử OpenClaw dùng chung: dùng `src/test-utils/openclaw-test-state.ts` từ Vitest khi một bài kiểm thử cần `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture cấu hình, workspace, thư mục agent, hoặc kho auth-profile cô lập.
- Helper E2E tiến trình: dùng `test/helpers/openclaw-test-instance.ts` khi một bài kiểm thử E2E cấp tiến trình Vitest cần một Gateway đang chạy, môi trường CLI, thu thập log, và dọn dẹp tại một nơi.
- Helper E2E Docker/Bash: các lane source `scripts/lib/docker-e2e-image.sh` có thể truyền `docker_e2e_test_state_shell_b64 <label> <scenario>` vào container và giải mã bằng `scripts/lib/openclaw-e2e-instance.sh`; các script nhiều home có thể truyền `docker_e2e_test_state_function_b64` và gọi `openclaw_test_state_create <label> <scenario>` trong mỗi luồng. Các caller cấp thấp hơn có thể dùng `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` cho một đoạn shell trong container, hoặc `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` cho một tệp env host có thể source. Dấu `--` trước `create` ngăn các runtime Node mới hơn coi `--env-file` là cờ Node. Các lane Docker/Bash khởi chạy Gateway có thể source `scripts/lib/openclaw-e2e-instance.sh` bên trong container để phân giải entrypoint, khởi động OpenAI giả lập, khởi chạy Gateway foreground/background, thăm dò readiness, xuất env trạng thái, đổ log, và dọn dẹp tiến trình.
- Các lần chạy shard đầy đủ, phần mở rộng, và include-pattern cập nhật dữ liệu thời gian cục bộ trong `.artifacts/vitest-shard-timings.json`; các lần chạy toàn cấu hình sau đó dùng những mốc thời gian này để cân bằng shard chậm và nhanh. Các shard CI include-pattern thêm tên shard vào khóa thời gian, nhờ đó thời gian của shard đã lọc vẫn hiển thị mà không thay thế dữ liệu thời gian toàn cấu hình. Đặt `OPENCLAW_TEST_PROJECTS_TIMINGS=0` để bỏ qua artifact thời gian cục bộ.
- Các tệp kiểm thử `plugin-sdk` và `commands` được chọn nay định tuyến qua các lane nhẹ chuyên dụng chỉ giữ `test/setup.ts`, còn các trường hợp nặng runtime vẫn ở các lane hiện có.
- Các tệp nguồn có kiểm thử cùng cấp ánh xạ tới tệp cùng cấp đó trước khi quay về các glob thư mục rộng hơn. Các chỉnh sửa helper dưới `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, và `src/plugins/contracts` dùng đồ thị import cục bộ để chạy các bài kiểm thử import chúng thay vì chạy rộng mọi shard khi đường dẫn phụ thuộc là chính xác.
- `auto-reply` nay cũng tách thành ba cấu hình chuyên dụng (`core`, `top-level`, `reply`) để harness phản hồi không lấn át các bài kiểm thử trạng thái/token/helper top-level nhẹ hơn.
- Cấu hình Vitest cơ sở nay mặc định là `pool: "threads"` và `isolate: false`, với runner không cô lập dùng chung được bật trên các cấu hình trong repo.
- `pnpm test:channels` chạy `vitest.channels.config.ts`.
- `pnpm test:extensions` và `pnpm test extensions` chạy tất cả shard phần mở rộng/plugin. Các plugin kênh nặng, plugin trình duyệt, và OpenAI chạy dưới dạng shard chuyên dụng; các nhóm plugin khác vẫn được gom batch. Dùng `pnpm test extensions/<id>` cho một lane plugin đóng gói.
- `pnpm test:perf:imports`: bật báo cáo thời lượng import + phân tích import của Vitest, trong khi vẫn dùng định tuyến lane theo phạm vi cho các mục tiêu tệp/thư mục tường minh.
- `pnpm test:perf:imports:changed`: cùng cơ chế profiling import, nhưng chỉ cho các tệp đã thay đổi kể từ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark đường dẫn chế độ thay đổi đã định tuyến so với lần chạy root-project gốc cho cùng diff git đã commit.
- `pnpm test:perf:changed:bench -- --worktree` benchmark tập thay đổi trong worktree hiện tại mà không cần commit trước.
- `pnpm test:perf:profile:main`: ghi CPU profile cho luồng chính của Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: ghi CPU + heap profile cho runner đơn vị (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: chạy tuần tự mọi cấu hình lá Vitest full-suite và ghi dữ liệu thời lượng theo nhóm cùng các artifact JSON/log theo từng cấu hình. Test Performance Agent dùng dữ liệu này làm baseline trước khi thử sửa các bài kiểm thử chậm.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: so sánh các báo cáo theo nhóm sau một thay đổi tập trung vào hiệu năng.
- Tích hợp Gateway: chọn tham gia qua `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` hoặc `pnpm test:gateway`.
- `pnpm test:e2e`: Chạy các kiểm thử smoke end-to-end Gateway (ghép cặp nhiều phiên bản WS/HTTP/node). Mặc định là `threads` + `isolate: false` với worker thích ứng trong `vitest.e2e.config.ts`; tinh chỉnh bằng `OPENCLAW_E2E_WORKERS=<n>` và đặt `OPENCLAW_E2E_VERBOSE=1` để có log chi tiết.
- `pnpm test:live`: Chạy kiểm thử live của provider (minimax/zai). Cần khóa API và `LIVE=1` (hoặc `*_LIVE_TEST=1` riêng theo provider) để bỏ qua trạng thái skip.
- `pnpm test:docker:all`: Xây dựng image live-test dùng chung, đóng gói OpenClaw một lần thành npm tarball, xây dựng/tái sử dụng một image runner Node/Git tối giản cùng một image chức năng cài tarball đó vào `/app`, rồi chạy các lane smoke Docker với `OPENCLAW_SKIP_DOCKER_BUILD=1` qua một bộ lập lịch có trọng số. Image tối giản (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) được dùng cho các lane installer/update/plugin-dependency; các lane đó mount tarball đã dựng sẵn thay vì dùng nguồn repo đã sao chép. Image chức năng (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) được dùng cho các lane chức năng ứng dụng đã build thông thường. `scripts/package-openclaw-for-docker.mjs` là bộ đóng gói package cục bộ/CI duy nhất và xác thực tarball cùng `dist/postinstall-inventory.json` trước khi Docker sử dụng. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi plan đã chọn. `node scripts/test-docker-all.mjs --plan-json` phát ra plan CI do scheduler sở hữu cho các lane đã chọn, loại image, nhu cầu package/live-image, kịch bản trạng thái, và kiểm tra thông tin xác thực mà không build hoặc chạy Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` điều khiển slot tiến trình và mặc định là 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` điều khiển pool đuôi nhạy cảm với provider và mặc định là 10. Giới hạn lane nặng mặc định là `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; giới hạn provider mặc định là một lane nặng cho mỗi provider qua `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, và `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Dùng `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` cho host lớn hơn. Nếu một lane vượt quá trọng số hiệu lực hoặc giới hạn tài nguyên trên host có mức song song thấp, lane đó vẫn có thể bắt đầu từ một pool rỗng và sẽ chạy một mình cho đến khi giải phóng dung lượng. Các lượt bắt đầu lane mặc định được giãn cách 2 giây để tránh bão tạo container trên Docker daemon cục bộ; ghi đè bằng `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner mặc định preflight Docker, dọn các container E2E OpenClaw cũ, phát trạng thái lane đang hoạt động mỗi 30 giây, chia sẻ cache công cụ CLI của provider giữa các lane tương thích, mặc định thử lại lỗi live-provider tạm thời một lần (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), và lưu thời gian lane trong `.artifacts/docker-tests/lane-timings.json` để sắp xếp dài nhất trước trong các lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane mà không chạy Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` để tinh chỉnh đầu ra trạng thái, hoặc `OPENCLAW_DOCKER_ALL_TIMINGS=0` để tắt tái sử dụng thời gian. Dùng `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` để chỉ chạy các lane xác định/cục bộ hoặc `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` để chỉ chạy các lane live-provider; các alias package là `pnpm test:docker:local:all` và `pnpm test:docker:live:all`. Chế độ chỉ live hợp nhất các lane live chính và đuôi vào một pool dài nhất trước để các bucket provider có thể xếp công việc Claude, Codex, và Gemini cùng nhau. Runner dừng lập lịch các lane pooled mới sau lỗi đầu tiên trừ khi đặt `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, và mỗi lane có timeout dự phòng 120 phút có thể ghi đè bằng `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; một số lane live/đuôi được chọn dùng giới hạn chặt hơn theo từng lane. Các lệnh thiết lập Docker backend CLI có timeout riêng qua `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (mặc định 180). Log theo từng lane, `summary.json`, `failures.json`, và thời gian theo phase được ghi dưới `.artifacts/docker-tests/<run-id>/`; dùng `pnpm test:docker:timings <summary.json>` để kiểm tra các lane chậm và `pnpm test:docker:rerun <run-id|summary.json|failures.json>` để in các lệnh chạy lại có mục tiêu, nhẹ.
- `pnpm test:docker:browser-cdp-snapshot`: Xây dựng một container E2E nguồn dựa trên Chromium, khởi động CDP thô cùng một Gateway cô lập, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao gồm URL liên kết, phần tử có thể nhấp được nâng cấp từ con trỏ, tham chiếu iframe, và metadata frame.
- Các probe Docker live cho backend CLI có thể chạy dưới dạng lane tập trung, ví dụ `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, hoặc `pnpm test:docker:live-cli-backend:codex:mcp`. Claude và Gemini có các alias `:resume` và `:mcp` tương ứng.
- `pnpm test:docker:openwebui`: Khởi động OpenClaw + Open WebUI trong Docker, đăng nhập qua Open WebUI, kiểm tra `/api/models`, rồi chạy một cuộc trò chuyện được proxy thật qua `/api/chat/completions`. Cần một khóa mô hình live dùng được (ví dụ OpenAI trong `~/.profile`), kéo một image Open WebUI bên ngoài, và không được kỳ vọng ổn định trong CI như các bộ unit/e2e thông thường.
- `pnpm test:docker:mcp-channels`: Khởi động một container Gateway đã seed và một container client thứ hai sinh `openclaw mcp serve`, rồi xác minh khám phá cuộc hội thoại đã định tuyến, đọc transcript, metadata tệp đính kèm, hành vi hàng đợi sự kiện live, định tuyến gửi ra ngoài, và thông báo kênh + quyền kiểu Claude qua cầu stdio thật. Assertion thông báo Claude đọc trực tiếp các frame MCP stdio thô để smoke phản ánh đúng những gì cầu thực sự phát ra.
- `pnpm test:docker:upgrade-survivor`: Cài đặt tarball OpenClaw đã đóng gói lên trên một fixture người dùng cũ đã bị thay đổi, chạy cập nhật gói cùng doctor không tương tác mà không cần khóa nhà cung cấp hoặc kênh live, sau đó khởi động một Gateway loopback và kiểm tra rằng các agent, cấu hình kênh, danh sách cho phép Plugin, tệp workspace/session, trạng thái phụ thuộc Plugin cũ lỗi thời, quá trình khởi động và trạng thái RPC vẫn tồn tại.
- `pnpm test:docker:published-upgrade-survivor`: Cài đặt `openclaw@latest` theo mặc định, gieo các tệp người dùng hiện có thực tế mà không cần khóa nhà cung cấp hoặc kênh live, cấu hình baseline đó bằng một công thức lệnh `openclaw config set` được nhúng sẵn, cập nhật bản cài đặt đã phát hành đó lên tarball OpenClaw đã đóng gói, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, sau đó khởi động một Gateway loopback và kiểm tra rằng các intent đã cấu hình, tệp workspace/session, cấu hình Plugin lỗi thời và trạng thái phụ thuộc cũ, quá trình khởi động, `/healthz`, `/readyz` và trạng thái RPC vẫn tồn tại hoặc được sửa chữa sạch sẽ. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, mở rộng một ma trận chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, hoặc thêm fixture kịch bản bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; Package Acceptance hiển thị các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` và `published_upgrade_survivor_scenarios`.
- `pnpm test:docker:update-migration`: Chạy harness published-upgrade survivor trong kịch bản `plugin-deps-cleanup` tập trung nhiều vào dọn dẹp, bắt đầu từ `openclaw@2026.4.23` theo mặc định. Workflow `Update Migration` riêng biệt mở rộng lane này với `baselines=all-since-2026.4.23` để mọi gói ổn định đã phát hành từ `.23` trở đi đều cập nhật lên candidate và chứng minh việc dọn dẹp phụ thuộc của Plugin đã cấu hình bên ngoài Full Release CI.
- `pnpm test:docker:plugins`: Chạy smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, các gói npm registry có phụ thuộc được hoist, ref git di động, fixture ClawHub, cập nhật marketplace và bật/kiểm tra gói Claude.

## Cổng kiểm tra PR cục bộ

Đối với các bước kiểm tra hợp nhất/cổng kiểm tra PR cục bộ, chạy:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Nếu `pnpm test` bị lỗi không ổn định trên máy chủ đang tải nặng, chạy lại một lần trước khi xem đó là hồi quy, rồi cô lập bằng `pnpm test <path/to/test>`. Đối với máy chủ bị giới hạn bộ nhớ, dùng:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Đo độ trễ mô hình (khóa cục bộ)

Tập lệnh: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Cách dùng:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env tùy chọn: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt mặc định: “Trả lời bằng một từ duy nhất: ok. Không dùng dấu câu hoặc văn bản bổ sung.”

Lần chạy gần nhất (2025-12-31, 20 lượt chạy):

- minimax trung vị 1279ms (tối thiểu 1114, tối đa 2431)
- opus trung vị 2454ms (tối thiểu 1224, tối đa 3170)

## Đo thời gian khởi động CLI

Tập lệnh: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

Đầu ra bao gồm `sampleCount`, trung bình, p50, p95, tối thiểu/tối đa, phân bố mã thoát/tín hiệu và tóm tắt RSS tối đa cho từng lệnh. `--cpu-prof-dir` / `--heap-prof-dir` tùy chọn ghi hồ sơ V8 cho mỗi lượt chạy để đo thời gian và thu thập hồ sơ dùng cùng một harness.

Quy ước đầu ra đã lưu:

- `pnpm test:startup:bench:smoke` ghi artifact smoke mục tiêu tại `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` ghi artifact bộ đầy đủ tại `.artifacts/cli-startup-bench-all.json` bằng `runs=5` và `warmup=1`
- `pnpm test:startup:bench:update` làm mới fixture baseline đã được commit tại `test/fixtures/cli-startup-bench.json` bằng `runs=5` và `warmup=1`

Fixture đã được commit:

- `test/fixtures/cli-startup-bench.json`
- Làm mới bằng `pnpm test:startup:bench:update`
- So sánh kết quả hiện tại với fixture bằng `pnpm test:startup:bench:check`

## E2E onboarding (Docker)

Docker là tùy chọn; chỉ cần phần này cho các kiểm thử smoke onboarding trong container.

Luồng khởi động lạnh đầy đủ trong container Linux sạch:

```bash
scripts/e2e/onboard-docker.sh
```

Tập lệnh này điều khiển trình hướng dẫn tương tác thông qua pseudo-tty, xác minh các tệp cấu hình/workspace/session, sau đó khởi động Gateway và chạy `openclaw health`.

## Smoke nhập QR (Docker)

Đảm bảo helper runtime QR được duy trì tải được trong các runtime Docker Node được hỗ trợ (mặc định Node 24, tương thích Node 22):

```bash
pnpm test:docker:qr
```

## Liên quan

- [Kiểm thử](/vi/help/testing)
- [Kiểm thử live](/vi/help/testing-live)
- [Kiểm thử cập nhật và plugin](/vi/help/testing-updates-plugins)
