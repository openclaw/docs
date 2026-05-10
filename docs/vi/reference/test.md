---
read_when:
    - Chạy hoặc sửa lỗi kiểm thử
summary: Cách chạy kiểm thử cục bộ (vitest) và khi nào dùng các chế độ force/coverage
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-10T19:50:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- Bộ kiểm thử đầy đủ (bộ kiểm thử, live, Docker): [Kiểm thử](/vi/help/testing)
- Xác thực bản cập nhật và gói Plugin: [Kiểm thử bản cập nhật và Plugin](/vi/help/testing-updates-plugins)

- `pnpm test:force`: Dừng mọi tiến trình gateway còn sót đang giữ cổng điều khiển mặc định, rồi chạy toàn bộ bộ Vitest với một cổng gateway cô lập để các kiểm thử server không xung đột với một phiên bản đang chạy. Dùng lệnh này khi một lần chạy gateway trước đó để lại cổng 18789 bị chiếm dụng.
- `pnpm test:coverage`: Chạy bộ unit với độ bao phủ V8 (thông qua `vitest.unit.config.ts`). Đây là cổng kiểm tra độ bao phủ của default-unit-lane, không phải độ bao phủ toàn bộ repo cho mọi tệp. Ngưỡng là 70% cho dòng/hàm/câu lệnh và 55% cho nhánh. Vì `coverage.all` là false và lane mặc định giới hạn phạm vi bao phủ vào các kiểm thử unit không nhanh có tệp nguồn cùng cấp, cổng này đo phần nguồn do lane này sở hữu thay vì mọi import bắc cầu mà nó tình cờ tải.
- `pnpm test:coverage:changed`: Chạy độ bao phủ unit chỉ cho các tệp đã thay đổi kể từ `origin/main`.
- `pnpm test:changed`: lần chạy kiểm thử thay đổi thông minh, chi phí thấp. Lệnh này chạy các mục tiêu chính xác từ chỉnh sửa trực tiếp vào kiểm thử, các tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng, và đồ thị import cục bộ. Các thay đổi rộng/cấu hình/gói bị bỏ qua trừ khi chúng ánh xạ đến các kiểm thử chính xác.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: lần chạy kiểm thử thay đổi rộng rõ ràng. Dùng khi một chỉnh sửa về test harness/cấu hình/gói nên rơi về hành vi kiểm thử thay đổi rộng hơn của Vitest.
- `pnpm changed:lanes`: hiển thị các lane kiến trúc được kích hoạt bởi diff so với `origin/main`.
- `pnpm check:changed`: chạy cổng kiểm tra thay đổi thông minh cho diff so với `origin/main`. Lệnh này chạy typecheck, lint và các lệnh guard cho các lane kiến trúc bị ảnh hưởng, nhưng không chạy kiểm thử Vitest. Dùng `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để làm bằng chứng kiểm thử.
- `pnpm test`: định tuyến các mục tiêu tệp/thư mục rõ ràng qua các lane Vitest có phạm vi. Các lần chạy không có mục tiêu dùng các nhóm shard cố định và mở rộng thành các cấu hình lá để thực thi song song cục bộ; nhóm extension luôn mở rộng thành các cấu hình shard theo từng extension thay vì một tiến trình root-project khổng lồ.
- Các lần chạy wrapper kiểm thử kết thúc bằng tóm tắt ngắn `[test] passed|failed|skipped ... in ...`. Dòng thời lượng riêng của Vitest vẫn là chi tiết theo từng shard.
- Trạng thái kiểm thử OpenClaw dùng chung: dùng `src/test-utils/openclaw-test-state.ts` từ Vitest khi một kiểm thử cần `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, config fixture, workspace, thư mục agent, hoặc auth-profile store cô lập.
- Helper E2E tiến trình: dùng `test/helpers/openclaw-test-instance.ts` khi một kiểm thử E2E cấp tiến trình Vitest cần một Gateway đang chạy, môi trường CLI, ghi log, và dọn dẹp ở cùng một chỗ.
- Helper E2E Docker/Bash: các lane source `scripts/lib/docker-e2e-image.sh` có thể truyền `docker_e2e_test_state_shell_b64 <label> <scenario>` vào container và giải mã bằng `scripts/lib/openclaw-e2e-instance.sh`; các script nhiều home có thể truyền `docker_e2e_test_state_function_b64` và gọi `openclaw_test_state_create <label> <scenario>` trong từng luồng. Các caller cấp thấp hơn có thể dùng `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` cho một đoạn shell trong container, hoặc `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` cho một tệp env host có thể source. Dấu `--` trước `create` ngăn các runtime Node mới hơn xem `--env-file` là cờ Node. Các lane Docker/Bash khởi chạy Gateway có thể source `scripts/lib/openclaw-e2e-instance.sh` bên trong container để phân giải entrypoint, khởi động OpenAI giả lập, khởi chạy Gateway foreground/background, probe readiness, xuất env trạng thái, dump log, và dọn dẹp tiến trình.
- Các lần chạy shard đầy đủ, extension, và include-pattern cập nhật dữ liệu thời gian cục bộ trong `.artifacts/vitest-shard-timings.json`; các lần chạy whole-config về sau dùng các thời gian đó để cân bằng shard chậm và nhanh. Shard CI include-pattern thêm tên shard vào khóa thời gian, giúp thời gian shard đã lọc vẫn hiển thị mà không thay thế dữ liệu thời gian whole-config. Đặt `OPENCLAW_TEST_PROJECTS_TIMINGS=0` để bỏ qua artifact thời gian cục bộ.
- Các tệp kiểm thử `plugin-sdk` và `commands` được chọn hiện định tuyến qua các lane nhẹ chuyên dụng chỉ giữ `test/setup.ts`, còn các trường hợp nặng runtime vẫn ở các lane hiện có.
- Các tệp nguồn có kiểm thử cùng cấp ánh xạ đến kiểm thử cùng cấp đó trước khi rơi về các glob thư mục rộng hơn. Các chỉnh sửa helper dưới `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers`, và `src/plugins/contracts` dùng đồ thị import cục bộ để chạy các kiểm thử import chúng thay vì chạy rộng mọi shard khi đường dẫn dependency là chính xác.
- `auto-reply` giờ cũng tách thành ba cấu hình chuyên dụng (`core`, `top-level`, `reply`) để harness reply không chi phối các kiểm thử trạng thái/token/helper top-level nhẹ hơn.
- Cấu hình Vitest cơ sở giờ mặc định là `pool: "threads"` và `isolate: false`, với runner không cô lập dùng chung được bật trên toàn bộ các cấu hình repo.
- `pnpm test:channels` chạy `vitest.channels.config.ts`.
- `pnpm test:extensions` và `pnpm test extensions` chạy tất cả shard extension/plugin. Các plugin kênh nặng, plugin trình duyệt, và OpenAI chạy dưới dạng shard chuyên dụng; các nhóm plugin khác vẫn được gom lô. Dùng `pnpm test extensions/<id>` cho một lane plugin đi kèm.
- `pnpm test:perf:imports`: bật báo cáo thời lượng import + phân rã import của Vitest, trong khi vẫn dùng định tuyến lane có phạm vi cho các mục tiêu tệp/thư mục rõ ràng.
- `pnpm test:perf:imports:changed`: cùng cơ chế lập hồ sơ import, nhưng chỉ cho các tệp đã thay đổi kể từ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmark đường dẫn changed-mode đã định tuyến so với lần chạy root-project gốc cho cùng một git diff đã commit.
- `pnpm test:perf:changed:bench -- --worktree` benchmark tập thay đổi worktree hiện tại mà không cần commit trước.
- `pnpm test:perf:profile:main`: ghi một CPU profile cho luồng chính của Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: ghi CPU + heap profile cho unit runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: chạy tuần tự mọi cấu hình lá Vitest full-suite và ghi dữ liệu thời lượng theo nhóm cùng các artifact JSON/log theo từng cấu hình. Test Performance Agent dùng dữ liệu này làm baseline trước khi thử sửa các kiểm thử chậm.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: so sánh các báo cáo theo nhóm sau một thay đổi tập trung vào hiệu năng.
- Tích hợp Gateway: chọn tham gia qua `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` hoặc `pnpm test:gateway`.
- `pnpm test:e2e`: Chạy các kiểm thử smoke end-to-end gateway (ghép cặp nhiều phiên bản WS/HTTP/node). Mặc định là `threads` + `isolate: false` với worker thích ứng trong `vitest.e2e.config.ts`; tinh chỉnh bằng `OPENCLAW_E2E_WORKERS=<n>` và đặt `OPENCLAW_E2E_VERBOSE=1` để có log chi tiết.
- `pnpm test:live`: Chạy kiểm thử live provider (minimax/zai). Yêu cầu API key và `LIVE=1` (hoặc `*_LIVE_TEST=1` theo từng provider) để bỏ skip.
- `pnpm test:docker:all`: Build image live-test dùng chung, đóng gói OpenClaw một lần thành npm tarball, build/tái sử dụng một image runner Node/Git trần cùng một image chức năng cài tarball đó vào `/app`, rồi chạy các lane smoke Docker với `OPENCLAW_SKIP_DOCKER_BUILD=1` qua bộ lập lịch có trọng số. Image trần (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) được dùng cho các lane installer/update/plugin-dependency; các lane đó mount tarball đã build sẵn thay vì dùng nguồn repo được sao chép. Image chức năng (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) được dùng cho các lane chức năng ứng dụng đã build thông thường. `scripts/package-openclaw-for-docker.mjs` là packer gói cục bộ/CI duy nhất và xác thực tarball cùng `dist/postinstall-inventory.json` trước khi Docker tiêu thụ. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. `node scripts/test-docker-all.mjs --plan-json` phát ra kế hoạch CI do scheduler sở hữu cho các lane đã chọn, loại image, nhu cầu package/live-image, kịch bản trạng thái, và kiểm tra credential mà không build hoặc chạy Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` điều khiển slot tiến trình và mặc định là 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` điều khiển pool tail nhạy với provider và mặc định là 10. Giới hạn lane nặng mặc định là `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; giới hạn provider mặc định là một lane nặng trên mỗi provider qua `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`, và `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Dùng `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` cho host lớn hơn. Nếu một lane vượt quá trọng số hiệu dụng hoặc giới hạn tài nguyên trên một host có độ song song thấp, nó vẫn có thể bắt đầu từ một pool trống và sẽ chạy một mình cho đến khi giải phóng dung lượng. Việc bắt đầu lane được giãn cách mặc định 2 giây để tránh bão tạo Docker daemon cục bộ; ghi đè bằng `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Runner mặc định preflight Docker, dọn các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động mỗi 30 giây, chia sẻ cache công cụ CLI provider giữa các lane tương thích, thử lại lỗi live-provider tạm thời một lần theo mặc định (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`), và lưu thời gian lane trong `.artifacts/docker-tests/lane-timings.json` để sắp xếp dài nhất trước trong các lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane mà không chạy Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` để tinh chỉnh đầu ra trạng thái, hoặc `OPENCLAW_DOCKER_ALL_TIMINGS=0` để tắt tái sử dụng thời gian. Dùng `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` chỉ cho các lane xác định/cục bộ hoặc `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` chỉ cho các lane live-provider; alias gói là `pnpm test:docker:local:all` và `pnpm test:docker:live:all`. Chế độ chỉ live hợp nhất các lane live chính và tail vào một pool dài nhất trước để các bucket provider có thể đóng gói công việc Claude, Codex, và Gemini cùng nhau. Runner dừng lập lịch các lane pooled mới sau lỗi đầu tiên trừ khi đặt `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, và mỗi lane có timeout dự phòng 120 phút có thể ghi đè bằng `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; các lane live/tail được chọn dùng giới hạn theo lane chặt hơn. Các lệnh thiết lập Docker backend CLI có timeout riêng qua `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (mặc định 180). Log theo từng lane, `summary.json`, `failures.json`, và thời gian theo pha được ghi dưới `.artifacts/docker-tests/<run-id>/`; dùng `pnpm test:docker:timings <summary.json>` để kiểm tra lane chậm và `pnpm test:docker:rerun <run-id|summary.json|failures.json>` để in các lệnh rerun nhắm mục tiêu chi phí thấp.
- `pnpm test:docker:browser-cdp-snapshot`: Build một container E2E nguồn dựa trên Chromium, khởi động CDP thô cùng một Gateway cô lập, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao gồm URL liên kết, phần tử có thể nhấp được nâng cấp bằng con trỏ, tham chiếu iframe, và metadata frame.
- `pnpm test:docker:skill-install`: Cài tarball OpenClaw đã đóng gói trong một Docker runner trần, tắt `skills.install.allowUploadedArchives`, phân giải một slug skill hiện tại từ tìm kiếm ClawHub live, cài đặt nó qua `openclaw skills install`, và xác minh `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json`, và `skills info --json`.
- Các probe Docker live backend CLI có thể được chạy như các lane tập trung, ví dụ `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume`, hoặc `pnpm test:docker:live-cli-backend:codex:mcp`. Claude và Gemini có các alias `:resume` và `:mcp` tương ứng.
- `pnpm test:docker:openwebui`: Khởi động OpenClaw + Open WebUI trong Docker, đăng nhập qua Open WebUI, kiểm tra `/api/models`, rồi chạy một cuộc chat được proxy thật qua `/api/chat/completions`. Yêu cầu một khóa model live có thể dùng được (ví dụ OpenAI trong `~/.profile`), pull một image Open WebUI bên ngoài, và không được kỳ vọng ổn định trong CI như các bộ unit/e2e thông thường.
- `pnpm test:docker:mcp-channels`: Khởi động một vùng chứa Gateway đã được seed và một vùng chứa client thứ hai sinh ra `openclaw mcp serve`, rồi xác minh việc khám phá hội thoại đã định tuyến, đọc bản ghi, siêu dữ liệu tệp đính kèm, hành vi hàng đợi sự kiện trực tiếp, định tuyến gửi đi, và thông báo kênh + quyền kiểu Claude qua cầu nối stdio thật. Khẳng định thông báo Claude đọc trực tiếp các khung MCP stdio thô để smoke phản ánh đúng những gì cầu nối thật sự phát ra.
- `pnpm test:docker:upgrade-survivor`: Cài đặt tarball OpenClaw đã đóng gói lên trên một fixture người dùng cũ đang bẩn, chạy cập nhật gói cộng với doctor không tương tác mà không có khóa provider hoặc kênh trực tiếp, sau đó khởi động một Gateway local loopback và kiểm tra rằng agent, cấu hình kênh, danh sách cho phép Plugin, tệp workspace/session, trạng thái phụ thuộc Plugin cũ lỗi thời, quá trình khởi động, và trạng thái RPC vẫn tồn tại.
- `pnpm test:docker:published-upgrade-survivor`: Mặc định cài đặt `openclaw@latest`, seed các tệp người dùng hiện có thực tế mà không có khóa provider hoặc kênh trực tiếp, cấu hình baseline đó bằng một công thức lệnh `openclaw config set` được nhúng sẵn, cập nhật bản cài đặt đã phát hành đó lên tarball OpenClaw đã đóng gói, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway local loopback và kiểm tra rằng các intent đã cấu hình, tệp workspace/session, cấu hình Plugin lỗi thời và trạng thái phụ thuộc cũ, quá trình khởi động, `/healthz`, `/readyz`, và trạng thái RPC vẫn tồn tại hoặc được sửa sạch sẽ. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, mở rộng một ma trận cục bộ chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, hoặc thêm fixture kịch bản bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; tập reported-issues bao gồm `configured-plugin-installs` để xác minh các Plugin OpenClaw bên ngoài đã cấu hình được cài đặt tự động trong quá trình nâng cấp và `stale-source-plugin-shadow` để ngăn các bóng Plugin chỉ có nguồn làm hỏng quá trình khởi động. Package Acceptance công bố các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, và `published_upgrade_survivor_scenarios`, đồng thời phân giải các token baseline meta như `last-stable-4` hoặc `all-since-2026.4.23` trước khi chuyển thông số gói chính xác cho các lane Docker.
- `pnpm test:docker:update-migration`: Chạy harness published-upgrade survivor trong kịch bản `plugin-deps-cleanup` nặng về dọn dẹp, mặc định bắt đầu từ `openclaw@2026.4.23`. Workflow `Update Migration` riêng mở rộng lane này bằng `baselines=all-since-2026.4.23` để mọi gói ổn định đã phát hành từ `.23` trở đi đều cập nhật lên ứng viên và chứng minh việc dọn dẹp phụ thuộc Plugin đã cấu hình bên ngoài Full Release CI.
- `pnpm test:docker:plugins`: Chạy smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, các gói npm registry có phụ thuộc được hoist, ref git di chuyển, fixture ClawHub, cập nhật marketplace, và bật/kiểm tra Claude-bundle.

## Cổng kiểm tra PR cục bộ

Để chạy kiểm tra land/gate PR cục bộ, hãy chạy:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Nếu `pnpm test` bị flaky trên một host đang tải nặng, hãy chạy lại một lần trước khi xem đó là hồi quy, rồi cô lập bằng `pnpm test <path/to/test>`. Với các host bị giới hạn bộ nhớ, hãy dùng:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark độ trễ mô hình (khóa cục bộ)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Cách dùng:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Biến môi trường tùy chọn: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt mặc định: "Trả lời bằng một từ duy nhất: ok. Không có dấu câu hoặc văn bản bổ sung."

Lần chạy gần nhất (2025-12-31, 20 lần chạy):

- minimax trung vị 1279ms (tối thiểu 1114, tối đa 2431)
- opus trung vị 2454ms (tối thiểu 1224, tối đa 3170)

## Benchmark khởi động CLI

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

Đầu ra bao gồm `sampleCount`, trung bình, p50, p95, tối thiểu/tối đa, phân bố mã thoát/tín hiệu, và tóm tắt RSS tối đa cho từng lệnh. Tùy chọn `--cpu-prof-dir` / `--heap-prof-dir` ghi profile V8 cho mỗi lần chạy để đo thời gian và thu thập profile dùng cùng một harness.

Quy ước đầu ra đã lưu:

- `pnpm test:startup:bench:smoke` ghi artifact smoke có mục tiêu tại `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` ghi artifact toàn bộ bộ kiểm thử tại `.artifacts/cli-startup-bench-all.json` bằng `runs=5` và `warmup=1`
- `pnpm test:startup:bench:update` làm mới fixture baseline được đưa vào repo tại `test/fixtures/cli-startup-bench.json` bằng `runs=5` và `warmup=1`

Fixture được đưa vào repo:

- `test/fixtures/cli-startup-bench.json`
- Làm mới bằng `pnpm test:startup:bench:update`
- So sánh kết quả hiện tại với fixture bằng `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker là tùy chọn; phần này chỉ cần cho các kiểm thử smoke onboarding được container hóa.

Luồng cold-start đầy đủ trong một container Linux sạch:

```bash
scripts/e2e/onboard-docker.sh
```

Script này điều khiển wizard tương tác qua pseudo-tty, xác minh các tệp cấu hình/workspace/session, sau đó khởi động Gateway và chạy `openclaw health`.

## Smoke nhập QR (Docker)

Đảm bảo helper runtime QR được bảo trì tải được trong các runtime Docker Node được hỗ trợ (mặc định Node 24, tương thích Node 22):

```bash
pnpm test:docker:qr
```

## Liên quan

- [Kiểm thử](/vi/help/testing)
- [Kiểm thử trực tiếp](/vi/help/testing-live)
- [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins)
