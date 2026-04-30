---
read_when:
    - Chạy hoặc sửa các bài kiểm thử
summary: Cách chạy kiểm thử cục bộ (vitest) và khi nào nên dùng chế độ force/coverage
title: Kiểm thử
x-i18n:
    generated_at: "2026-04-30T18:38:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- Bộ công cụ kiểm thử đầy đủ (bộ kiểm thử, trực tiếp, Docker): [Kiểm thử](/vi/help/testing)

- `pnpm test:force`: Diệt mọi tiến trình Gateway còn sót lại đang giữ cổng điều khiển mặc định, sau đó chạy toàn bộ bộ Vitest với một cổng Gateway cô lập để các kiểm thử máy chủ không xung đột với một phiên bản đang chạy. Dùng lệnh này khi một lần chạy Gateway trước đó để lại cổng 18789 bị chiếm dụng.
- `pnpm test:coverage`: Chạy bộ kiểm thử đơn vị với coverage V8 (thông qua `vitest.unit.config.ts`). Đây là cổng coverage đơn vị theo tệp đã được tải, không phải coverage toàn bộ repo cho mọi tệp. Ngưỡng là 70% dòng/hàm/câu lệnh và 55% nhánh. Vì `coverage.all` là false, cổng này đo các tệp được bộ coverage đơn vị tải thay vì coi mọi tệp nguồn theo làn tách là chưa được cover.
- `pnpm test:coverage:changed`: Chỉ chạy coverage đơn vị cho các tệp đã thay đổi kể từ `origin/main`.
- `pnpm test:changed`: lần chạy kiểm thử thay đổi thông minh, rẻ. Nó chạy các mục tiêu chính xác từ chỉnh sửa kiểm thử trực tiếp, các tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng, và đồ thị import cục bộ. Các thay đổi rộng/config/package sẽ bị bỏ qua trừ khi chúng ánh xạ tới kiểm thử chính xác.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: lần chạy kiểm thử thay đổi rộng rõ ràng. Dùng khi một chỉnh sửa test harness/config/package nên fallback về hành vi kiểm thử thay đổi rộng hơn của Vitest.
- `pnpm changed:lanes`: hiển thị các làn kiến trúc được kích hoạt bởi diff so với `origin/main`.
- `pnpm check:changed`: chạy cổng kiểm tra thay đổi thông minh cho diff so với `origin/main`. Nó chạy typecheck, lint, và các lệnh guard cho các làn kiến trúc bị ảnh hưởng, nhưng không chạy kiểm thử Vitest. Dùng `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để lấy bằng chứng kiểm thử.
- `pnpm test`: định tuyến các mục tiêu tệp/thư mục rõ ràng qua các làn Vitest theo phạm vi. Các lần chạy không chỉ định mục tiêu dùng các nhóm shard cố định và mở rộng thành cấu hình lá để thực thi song song cục bộ; nhóm extension luôn mở rộng thành các cấu hình shard theo từng extension thay vì một tiến trình root-project khổng lồ.
- Các lần chạy test wrapper kết thúc bằng tóm tắt ngắn `[test] passed|failed|skipped ... in ...`. Dòng thời lượng riêng của Vitest vẫn là chi tiết theo từng shard.
- Trạng thái kiểm thử OpenClaw dùng chung: dùng `src/test-utils/openclaw-test-state.ts` từ Vitest khi một kiểm thử cần `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture config, workspace, thư mục agent, hoặc kho auth-profile được cô lập.
- Helper E2E tiến trình: dùng `test/helpers/openclaw-test-instance.ts` khi một kiểm thử E2E cấp tiến trình Vitest cần một Gateway đang chạy, env CLI, ghi log, và dọn dẹp ở một nơi.
- Helper E2E Docker/Bash: các làn source `scripts/lib/docker-e2e-image.sh` có thể truyền `docker_e2e_test_state_shell_b64 <label> <scenario>` vào container và giải mã bằng `scripts/lib/openclaw-e2e-instance.sh`; các script nhiều home có thể truyền `docker_e2e_test_state_function_b64` và gọi `openclaw_test_state_create <label> <scenario>` trong từng flow. Các caller cấp thấp hơn có thể dùng `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` cho một snippet shell trong container, hoặc `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` cho một tệp env host có thể source. Dấu `--` trước `create` ngăn các runtime Node mới hơn coi `--env-file` là một cờ Node. Các làn Docker/Bash khởi chạy Gateway có thể source `scripts/lib/openclaw-e2e-instance.sh` bên trong container để phân giải entrypoint, khởi động OpenAI giả lập, khởi chạy Gateway foreground/background, probe readiness, xuất env trạng thái, dump log, và dọn dẹp tiến trình.
- Các lần chạy shard đầy đủ, extension, và include-pattern cập nhật dữ liệu thời gian cục bộ trong `.artifacts/vitest-shard-timings.json`; các lần chạy whole-config sau đó dùng những thời gian này để cân bằng shard chậm và nhanh. Các shard CI include-pattern nối tên shard vào khóa thời gian, giúp thời gian shard đã lọc vẫn hiển thị mà không thay thế dữ liệu thời gian whole-config. Đặt `OPENCLAW_TEST_PROJECTS_TIMINGS=0` để bỏ qua artifact thời gian cục bộ.
- Một số tệp kiểm thử `plugin-sdk` và `commands` được chọn hiện định tuyến qua các làn nhẹ chuyên dụng chỉ giữ `test/setup.ts`, để các ca nặng về runtime ở lại làn hiện có của chúng.
- Các tệp nguồn có kiểm thử cùng cấp ánh xạ tới tệp cùng cấp đó trước khi fallback về các glob thư mục rộng hơn. Các chỉnh sửa helper dưới `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, và `src/plugins/contracts` dùng đồ thị import cục bộ để chạy các kiểm thử import chúng thay vì chạy rộng mọi shard khi đường dẫn dependency chính xác.
- `auto-reply` nay cũng tách thành ba config chuyên dụng (`core`, `top-level`, `reply`) để harness reply không lấn át các kiểm thử trạng thái/token/helper top-level nhẹ hơn.
- Config Vitest cơ sở nay mặc định là `pool: "threads"` và `isolate: false`, với runner không cô lập dùng chung được bật trên các config trong repo.
- `pnpm test:channels` chạy `vitest.channels.config.ts`.
- `pnpm test:extensions` và `pnpm test extensions` chạy mọi shard extension/plugin. Các plugin kênh nặng, plugin trình duyệt, và OpenAI chạy như shard chuyên dụng; các nhóm plugin khác vẫn được gom lô. Dùng `pnpm test extensions/<id>` cho một làn plugin bundled.
- `pnpm test:perf:imports`: bật báo cáo thời lượng import + phân tích import của Vitest, trong khi vẫn dùng định tuyến làn theo phạm vi cho các mục tiêu tệp/thư mục rõ ràng.
- `pnpm test:perf:imports:changed`: cùng profiling import, nhưng chỉ cho các tệp đã thay đổi kể từ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark đường dẫn changed-mode đã định tuyến so với lần chạy root-project native cho cùng diff git đã commit.
- `pnpm test:perf:changed:bench -- --worktree` benchmark tập thay đổi worktree hiện tại mà không cần commit trước.
- `pnpm test:perf:profile:main`: ghi CPU profile cho thread chính của Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: ghi CPU + heap profile cho unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: chạy tuần tự mọi config lá Vitest full-suite và ghi dữ liệu thời lượng theo nhóm cùng các artifact JSON/log theo từng config. Test Performance Agent dùng dữ liệu này làm baseline trước khi thử sửa các kiểm thử chậm.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: so sánh các báo cáo theo nhóm sau một thay đổi tập trung vào hiệu năng.
- Tích hợp Gateway: bật tùy chọn qua `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` hoặc `pnpm test:gateway`.
- `pnpm test:e2e`: Chạy các kiểm thử smoke end-to-end Gateway (ghép cặp multi-instance WS/HTTP/node). Mặc định dùng `threads` + `isolate: false` với worker thích ứng trong `vitest.e2e.config.ts`; tinh chỉnh bằng `OPENCLAW_E2E_WORKERS=<n>` và đặt `OPENCLAW_E2E_VERBOSE=1` để có log chi tiết.
- `pnpm test:live`: Chạy kiểm thử live provider (minimax/zai). Cần API key và `LIVE=1` (hoặc `*_LIVE_TEST=1` riêng theo provider) để bỏ skip.
- `pnpm test:docker:all`: Build image live-test dùng chung, pack OpenClaw một lần dưới dạng npm tarball, build/tái sử dụng một image runner Node/Git trống cùng một image chức năng cài tarball đó vào `/app`, rồi chạy các làn smoke Docker với `OPENCLAW_SKIP_DOCKER_BUILD=1` qua một scheduler có trọng số. Image trống (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) được dùng cho các làn installer/update/plugin-dependency; các làn đó mount tarball đã build sẵn thay vì dùng nguồn repo đã sao chép. Image chức năng (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) được dùng cho các làn chức năng ứng dụng đã build thông thường. `scripts/package-openclaw-for-docker.mjs` là packer package cục bộ/CI duy nhất và xác thực tarball cùng `dist/postinstall-inventory.json` trước khi Docker tiêu thụ nó. Định nghĩa làn Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi plan đã chọn. `node scripts/test-docker-all.mjs --plan-json` phát plan CI do scheduler sở hữu cho các làn, loại image, nhu cầu package/live-image, kịch bản trạng thái, và kiểm tra credential đã chọn mà không build hay chạy Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` điều khiển slot tiến trình và mặc định là 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` điều khiển tail pool nhạy với provider và mặc định là 10. Giới hạn làn nặng mặc định là `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; giới hạn provider mặc định là một làn nặng cho mỗi provider qua `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, và `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Dùng `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` cho các host lớn hơn. Nếu một làn vượt quá giới hạn trọng số hoặc tài nguyên hiệu dụng trên một host có độ song song thấp, nó vẫn có thể bắt đầu từ pool trống và sẽ chạy một mình cho đến khi giải phóng capacity. Việc khởi động làn được giãn cách 2 giây theo mặc định để tránh bão tạo local Docker daemon; ghi đè bằng `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner preflight Docker theo mặc định, dọn các container OpenClaw E2E cũ, phát trạng thái làn đang hoạt động mỗi 30 giây, chia sẻ cache công cụ CLI provider giữa các làn tương thích, thử lại lỗi live-provider tạm thời một lần theo mặc định (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), và lưu thời gian làn trong `.artifacts/docker-tests/lane-timings.json` để sắp xếp longest-first trong các lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest làn mà không chạy Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` để tinh chỉnh output trạng thái, hoặc `OPENCLAW_DOCKER_ALL_TIMINGS=0` để tắt tái sử dụng thời gian. Dùng `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` chỉ cho các làn xác định/cục bộ hoặc `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` chỉ cho các làn live-provider; alias package là `pnpm test:docker:local:all` và `pnpm test:docker:live:all`. Chế độ live-only gộp các làn live chính và tail vào một pool longest-first để các bucket provider có thể đóng gói công việc Claude, Codex, và Gemini cùng nhau. Runner dừng lập lịch các làn pooled mới sau lỗi đầu tiên trừ khi đặt `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, và mỗi làn có timeout fallback 120 phút có thể ghi đè bằng `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; một số làn live/tail được chọn dùng giới hạn theo làn chặt hơn. Các lệnh thiết lập Docker backend CLI có timeout riêng qua `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (mặc định 180). Log theo từng làn, `summary.json`, `failures.json`, và thời gian pha được ghi dưới `.artifacts/docker-tests/<run-id>/`; dùng `pnpm test:docker:timings <summary.json>` để kiểm tra các làn chậm và `pnpm test:docker:rerun <run-id|summary.json|failures.json>` để in các lệnh chạy lại nhắm mục tiêu rẻ.
- `pnpm test:docker:browser-cdp-snapshot`: Build một container E2E nguồn dựa trên Chromium, khởi động CDP raw cùng một Gateway cô lập, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao gồm URL liên kết, phần tử có thể bấm được thăng cấp từ con trỏ, ref iframe, và metadata frame.
- Probe Docker live backend CLI có thể chạy dưới dạng các làn tập trung, ví dụ `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, hoặc `pnpm test:docker:live-cli-backend:codex:mcp`. Claude và Gemini có alias `:resume` và `:mcp` tương ứng.
- `pnpm test:docker:openwebui`: Khởi động OpenClaw + Open WebUI trong Docker, đăng nhập qua Open WebUI, kiểm tra `/api/models`, rồi chạy một cuộc chat được proxy thật qua `/api/chat/completions`. Cần một khóa mô hình live dùng được (ví dụ OpenAI trong `~/.profile`), pull một image Open WebUI bên ngoài, và không được kỳ vọng ổn định trong CI như các bộ unit/e2e thông thường.
- `pnpm test:docker:mcp-channels`: Khởi động một container Gateway đã seed và một container client thứ hai spawn `openclaw mcp serve`, rồi xác minh khám phá hội thoại đã định tuyến, đọc transcript, metadata attachment, hành vi hàng đợi sự kiện live, định tuyến gửi outbound, và thông báo kênh + quyền kiểu Claude qua cầu nối stdio thật. Assertion thông báo Claude đọc trực tiếp các frame MCP stdio raw để smoke phản ánh đúng thứ cầu nối thực sự phát ra.
- `pnpm test:docker:upgrade-survivor`: Cài đặt tarball OpenClaw đã được đóng gói lên một fixture người dùng cũ đang ở trạng thái bẩn, chạy cập nhật package cùng với doctor không tương tác mà không có khóa nhà cung cấp hoặc kênh live, sau đó khởi động một Gateway loopback và kiểm tra rằng các agent, cấu hình kênh, danh sách cho phép Plugin, tệp workspace/session, trạng thái runtime-deps của Plugin đã cũ, quá trình khởi động và trạng thái RPC vẫn tồn tại.

## Cổng PR cục bộ

Để chạy các kiểm tra land/gate PR cục bộ, hãy chạy:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Nếu `pnpm test` bị flaky trên một máy chủ đang tải nặng, hãy chạy lại một lần trước khi xem đó là hồi quy, rồi cô lập bằng `pnpm test <path/to/test>`. Với các máy chủ hạn chế bộ nhớ, hãy dùng:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Bench độ trễ mô hình (khóa cục bộ)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Cách dùng:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env tùy chọn: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt mặc định: “Trả lời bằng một từ duy nhất: ok. Không có dấu câu hoặc văn bản bổ sung.”

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

Bộ thiết lập sẵn:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: cả hai bộ thiết lập sẵn

Đầu ra bao gồm `sampleCount`, trung bình, p50, p95, tối thiểu/tối đa, phân bố mã thoát/tín hiệu, và tóm tắt RSS tối đa cho từng lệnh. `--cpu-prof-dir` / `--heap-prof-dir` tùy chọn ghi các hồ sơ V8 cho mỗi lần chạy để việc đo thời gian và thu thập hồ sơ dùng cùng một harness.

Quy ước đầu ra đã lưu:

- `pnpm test:startup:bench:smoke` ghi artifact smoke mục tiêu tại `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` ghi artifact bộ đầy đủ tại `.artifacts/cli-startup-bench-all.json` bằng `runs=5` và `warmup=1`
- `pnpm test:startup:bench:update` làm mới fixture baseline đã đưa vào repo tại `test/fixtures/cli-startup-bench.json` bằng `runs=5` và `warmup=1`

Fixture đã đưa vào repo:

- `test/fixtures/cli-startup-bench.json`
- Làm mới bằng `pnpm test:startup:bench:update`
- So sánh kết quả hiện tại với fixture bằng `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker là tùy chọn; phần này chỉ cần cho các kiểm thử smoke onboarding trong container.

Luồng khởi động lạnh đầy đủ trong một container Linux sạch:

```bash
scripts/e2e/onboard-docker.sh
```

Script này điều khiển trình hướng dẫn tương tác qua pseudo-tty, xác minh các tệp cấu hình/workspace/session, rồi khởi động Gateway và chạy `openclaw health`.

## Smoke nhập QR (Docker)

Đảm bảo helper runtime QR được duy trì tải được dưới các runtime Docker Node được hỗ trợ (Node 24 mặc định, tương thích Node 22):

```bash
pnpm test:docker:qr
```

## Liên quan

- [Kiểm thử](/vi/help/testing)
- [Kiểm thử trực tiếp](/vi/help/testing-live)
