---
read_when:
    - Chạy hoặc sửa lỗi kiểm thử
summary: Cách chạy kiểm thử cục bộ (vitest) và khi nào nên sử dụng chế độ force/coverage
title: Kiểm thử
x-i18n:
    generated_at: "2026-07-16T15:50:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- Bộ công cụ kiểm thử đầy đủ (bộ kiểm thử, trực tiếp, Docker): [Kiểm thử](/vi/help/testing)
- Xác thực bản cập nhật và gói plugin: [Kiểm thử bản cập nhật và plugin](/vi/help/testing-updates-plugins)

## Mặc định cho agent

Các phiên agent chỉ chạy một hoặc vài kiểm thử tập trung và các bước kiểm tra tĩnh nhẹ
ở máy cục bộ đối với nguồn đáng tin cậy và khi bản cài đặt phần phụ thuộc hiện có đã sẵn sàng. Không bao giờ
thực thi công cụ của kho lưu trữ không đáng tin cậy ở máy cục bộ. Các bộ kiểm thử lớn hơn, cổng kiểm tra thay đổi có
phân tỏa kiểm tra kiểu/lint, bản dựng, Docker, luồng gói, E2E, bằng chứng trực tiếp và
xác thực đa nền tảng được chạy từ xa qua Crabbox. Bằng chứng nặng từ người bảo trì đáng tin cậy
mặc định dùng Blacksmith Testbox. Quy trình Testbox đã cấu hình
nạp thông tin xác thực, vì vậy mã từ cộng tác viên hoặc fork không đáng tin cậy phải dùng
CI fork không chứa bí mật hoặc AWS Crabbox trực tiếp đã được làm sạch.

Không làm nóng trước cho công việc dự kiến. Chỉ lấy backend khi
lệnh nặng đầu tiên đã sẵn sàng, tái sử dụng id `tbx_...` được trả về cho các lệnh nặng
sau đó, đồng bộ checkout hiện tại trong mỗi lần chạy và dừng backend trước khi bàn giao.

Sau lần tái sử dụng thành công đầu tiên, wrapper ghi lại dấu vân tay của cơ sở,
phần phụ thuộc và quy trình Testbox của lease trong `.crabbox/testbox-leases/`.
Các chỉnh sửa chỉ liên quan đến mã nguồn tiếp tục tái sử dụng box đã làm nóng. Thay đổi merge base, lockfile,
đầu vào của trình quản lý gói, wrapper hoặc quy trình Testbox sẽ dừng an toàn và yêu cầu
lease mới. Mỗi lần chạy vẫn đồng bộ checkout hiện tại.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` chỉ dành cho chẩn đoán có chủ đích, không dành cho
bằng chứng phát hành.

Các lệnh kiểm thử cục bộ bên dưới dành cho quy trình của con người và bằng chứng agent có giới hạn.
Phải báo cáo khi nhà cung cấp từ xa không khả dụng; điều đó không cho phép
âm thầm chạy một cổng kiểm tra cục bộ rộng.

Đối với bằng chứng nặng không đáng tin cậy, chỉ làm nóng khi cần bằng `--provider aws`. Mỗi lần chạy phải đặt
`CRABBOX_ENV_ALLOW=CI`, truyền `--provider aws --no-hydrate` và dùng
`HOME` từ xa tạm thời mới trước khi cài đặt phần phụ thuộc hoặc chạy
kiểm thử. Dùng lease mới được làm nóng, dành riêng cho nguồn không đáng tin cậy đó; không bao giờ tái sử dụng
lease đáng tin cậy hoặc lease đã được nạp thông tin xác thực trước đó. Khởi chạy tệp nhị phân Crabbox
đáng tin cậy đã cài đặt từ checkout `main` sạch và đáng tin cậy, đồng thời chỉ tìm nạp PR từ xa bằng
`--fresh-pr`; không bao giờ thực thi wrapper hoặc cấu hình của checkout không đáng tin cậy ở máy cục bộ.
Bỏ đặt `CRABBOX_AWS_INSTANCE_PROFILE` và dừng an toàn trừ khi
`aws.instanceProfile` đã phân giải là rỗng. Trước bất kỳ bước cài đặt/kiểm thử nào, dùng
các công cụ đường dẫn tuyệt đối đáng tin cậy để yêu cầu token IMDSv2, chứng minh endpoint thông tin xác thực
IAM trả về 404 và xác minh `git rev-parse HEAD` từ xa bằng SHA đầu PR đầy đủ
đã được xem xét. Ràng buộc lease với SHA đó và dừng/làm nóng lại khi đầu PR
thay đổi. Tải lên `scripts/crabbox-untrusted-bootstrap.sh` đáng tin cậy từ
`main` sạch cùng với `--fresh-pr`; công cụ này cài đặt Node/pnpm được ghim, xác minh SHA
và ghim trình quản lý gói, cô lập `HOME`, cài đặt phần phụ thuộc, rồi thực thi
kiểm thử được yêu cầu. Nếu broker không thể chứng minh không có vai trò hoặc không tồn tại PR từ xa,
hãy dùng CI fork không chứa bí mật. Không dùng `hydrate-github`, `--no-sync` hoặc
quy trình Testbox đã nạp thông tin xác thực.
Bỏ đặt mọi giá trị ghi đè `CRABBOX_TAILSCALE*`, bắt buộc `--network public
--tailscale=false`, xóa các cờ exit-node/LAN và yêu cầu `crabbox inspect`
báo cáo mạng công cộng không có trạng thái Tailscale trước khi tải lên bất kỳ tập lệnh nào.

## Thứ tự cục bộ thường lệ

1. `pnpm test:changed` để làm bằng chứng Vitest trong phạm vi thay đổi.
2. `pnpm test <path-or-filter>` cho một tệp, thư mục hoặc mục tiêu cụ thể.
3. `pnpm test` chỉ khi bạn chủ ý cần toàn bộ bộ kiểm thử Vitest cục bộ.

Trong worktree Codex hoặc checkout liên kết/thưa, agent tránh chạy trực tiếp ở máy cục bộ
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Bằng chứng tập trung có giới hạn với phần phụ thuộc đã sẵn sàng:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Kiểm tra thay đổi theo nguyên tắc phân loại trước: `node scripts/check-changed.mjs`; các kế hoạch chỉ liên quan đến tài liệu,
  không có thay đổi và siêu dữ liệu nhỏ vẫn chạy cục bộ khi phần phụ thuộc đã sẵn sàng,
  còn kế hoạch nặng hoặc thiếu phần phụ thuộc được ủy quyền cho Testbox.
- Bằng chứng rộng với lease được giữ lại rõ ràng: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` để pnpm chạy bên trong Testbox.
- `exitCode` cuối cùng của wrapper và JSON thời gian là kết quả lệnh. Một lượt chạy Blacksmith GitHub Actions được ủy quyền có thể hiển thị `cancelled` sau khi lệnh SSH thành công vì Testbox được dừng từ bên ngoài hành động keepalive; hãy kiểm tra phần tóm tắt của wrapper và đầu ra lệnh trước khi coi đó là lỗi.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: giữ việc tuần tự hóa các bước kiểm tra nặng bên trong worktree hiện tại thay vì thư mục Git dùng chung cho các lệnh như `pnpm check:changed` và `pnpm test ...` có mục tiêu. Chỉ dùng trên máy chủ cục bộ có dung lượng cao khi bạn chủ ý chạy các bước kiểm tra độc lập trên nhiều worktree liên kết.

## Các lệnh cốt lõi

Các lượt chạy wrapper kiểm thử kết thúc bằng phần tóm tắt `[test] passed|failed|skipped ... in ...` ngắn; dòng thời lượng riêng của Vitest vẫn là chi tiết theo từng shard.

| Lệnh                                              | Chức năng                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Các mục tiêu tệp/thư mục cụ thể được định tuyến qua các luồng Vitest theo phạm vi. Các lượt chạy không có mục tiêu là bằng chứng toàn bộ bộ kiểm thử: các nhóm shard cố định được mở rộng thành cấu hình lá để thực thi song song cục bộ, với số lượng shard dự kiến được in trước khi bắt đầu. Nhóm extension luôn được mở rộng thành cấu hình shard theo từng extension thay vì một tiến trình dự án gốc khổng lồ. |
| `pnpm test:changed`                               | Lượt chạy kiểm thử thay đổi thông minh, nhẹ: mục tiêu chính xác từ các chỉnh sửa kiểm thử trực tiếp, tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng và đồ thị import cục bộ. Các thay đổi rộng về cấu hình/gói bị bỏ qua trừ khi chúng ánh xạ tới các kiểm thử chính xác.                                                                                         |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Lượt chạy kiểm thử thay đổi rộng, rõ ràng; dùng khi chỉnh sửa bộ khung kiểm thử/cấu hình/gói cần dự phòng về hành vi kiểm thử thay đổi rộng hơn của Vitest.                                                                                                                                                                                                      |
| `pnpm test:force`                                 | Giải phóng cổng Gateway OpenClaw đã cấu hình (mặc định `18789`), rồi chạy toàn bộ bộ kiểm thử với một cổng Gateway cô lập để các kiểm thử máy chủ không xung đột với phiên bản đang chạy.                                                                                                                                                                      |
| `pnpm test:coverage`                              | Xuất báo cáo độ bao phủ V8 mang tính thông tin cho luồng đơn vị mặc định (`vitest.unit.config.ts`); không áp dụng ngưỡng độ bao phủ.                                                                                                                                                                                                                               |
| `pnpm test:coverage:changed`                      | Chỉ đo độ bao phủ đơn vị cho các tệp đã thay đổi kể từ `origin/main`.                                                                                                                                                                                                                                                                                             |
| `pnpm changed:lanes`                              | Hiển thị các luồng kiến trúc được kích hoạt bởi diff so với `origin/main`.                                                                                                                                                                                                                                                                                        |
| `pnpm check:changed`                              | Phân loại các luồng đã thay đổi trước khi chọn cách thực thi. Các kế hoạch chỉ liên quan đến tài liệu, không có thay đổi và siêu dữ liệu nhỏ vẫn chạy cục bộ khi phần phụ thuộc đã sẵn sàng; các kế hoạch có phân tỏa kiểm tra kiểu/lint, các luồng nặng khác hoặc thiếu phần phụ thuộc cục bộ được ủy quyền cho Crabbox/Testbox bên ngoài CI. Không chạy Vitest; dùng `pnpm test:changed` hoặc `pnpm test <target>` để làm bằng chứng kiểm thử. |

## Trạng thái kiểm thử dùng chung và trình trợ giúp tiến trình

- `src/test-utils/openclaw-test-state.ts`: dùng từ Vitest khi một kiểm thử cần `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture cấu hình, workspace, thư mục agent hoặc kho hồ sơ xác thực được cô lập.
- `pnpm test:env-mutations:report`: báo cáo không chặn về các kiểm thử/bộ khung thay đổi trực tiếp `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` hoặc các khóa môi trường liên quan. Dùng công cụ này để tìm các ứng viên di chuyển sang trình trợ giúp trạng thái kiểm thử dùng chung.
- `test/helpers/openclaw-test-instance.ts`: dành cho kiểm thử E2E cấp tiến trình cần Gateway đang chạy, môi trường CLI, thu thập nhật ký và dọn dẹp tại một nơi.
- Các luồng E2E Docker/Bash nạp `scripts/lib/docker-e2e-image.sh` có thể truyền `docker_e2e_test_state_shell_b64 <label> <scenario>` vào container và giải mã bằng `scripts/lib/openclaw-e2e-instance.sh`; các tập lệnh nhiều home có thể truyền `docker_e2e_test_state_function_b64` và gọi `openclaw_test_state_create <label> <scenario>` trong mỗi luồng. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` ghi một tệp môi trường máy chủ có thể được nạp (ký tự `--` trước `create` ngăn các runtime Node mới hơn coi `--env-file` là cờ Node). Các luồng khởi chạy Gateway có thể nạp `scripts/lib/openclaw-e2e-instance.sh` để phân giải entrypoint, khởi động OpenAI giả lập, khởi chạy ở nền trước/nền sau, thăm dò trạng thái sẵn sàng, xuất môi trường trạng thái, kết xuất nhật ký và dọn dẹp tiến trình.

## Các luồng Control UI, TUI và extension

- **E2E mô phỏng của Control UI:** `pnpm test:ui:e2e` chạy luồng Vitest + Playwright, khởi động Vite Control UI và điều khiển một trang Chromium thực với Gateway WebSocket được mô phỏng. Các kiểm thử nằm trong `ui/src/**/*.e2e.test.ts`; các mô phỏng/điều khiển dùng chung nằm trong `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` bao gồm luồng này. Các lượt chạy của tác tử mặc định dùng Testbox/Crabbox, kể cả việc xác minh có mục tiêu; chỉ dùng `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` khi cần phương án dự phòng cục bộ rõ ràng.
- **Kiểm thử PTY của TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` chạy luồng PTY nhanh với phần phụ trợ giả. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` hoặc `pnpm tui:pty:test:watch --mode local` chạy kiểm thử smoke `tui --local` chậm hơn, chỉ mô phỏng điểm cuối mô hình bên ngoài. Hãy xác nhận văn bản hiển thị ổn định hoặc các lệnh gọi fixture, không dùng ảnh chụp nhanh ANSI thô.
- `pnpm test:extensions` và `pnpm test extensions` chạy tất cả các phân đoạn extension/plugin. Các plugin kênh nặng, plugin trình duyệt và OpenAI chạy dưới dạng các phân đoạn riêng; các nhóm plugin khác vẫn được chạy theo lô. `pnpm test extensions/<id>` chạy một luồng plugin đi kèm.
- Các tệp nguồn có kiểm thử cùng cấp được ánh xạ tới kiểm thử cùng cấp đó trước khi chuyển sang các glob thư mục rộng hơn. Các chỉnh sửa trợ giúp trong `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` và `src/plugins/contracts` sử dụng đồ thị nhập cục bộ để chạy các kiểm thử nhập chúng, thay vì chạy rộng tất cả các phân đoạn khi đường dẫn phụ thuộc đã xác định chính xác.
- Các đích thư mục hợp đồng được phân nhánh tới các luồng hợp đồng tương ứng: `pnpm test src/channels/plugins/contracts` chạy bốn cấu hình hợp đồng kênh và `pnpm test src/plugins/contracts` chạy cấu hình hợp đồng plugin, vì các dự án `channels`/`plugins` chung loại trừ `contracts/**`.
- `auto-reply` được chia thành ba cấu hình riêng (`core`, `top-level`, `reply`) để bộ khung phản hồi không lấn át các kiểm thử trạng thái/token/trợ giúp cấp cao nhất nhẹ hơn.
- Các tệp kiểm thử `plugin-sdk` và `commands` được chọn sẽ được định tuyến qua các luồng nhẹ riêng, chỉ giữ lại `test/setup.ts`, còn các trường hợp nặng về thời gian chạy vẫn nằm trên các luồng hiện có.
- Cấu hình Vitest cơ sở mặc định dùng `pool: "threads"` và `isolate: false`, với trình chạy dùng chung không cô lập được bật trên toàn bộ cấu hình của kho lưu trữ.
- `pnpm test:channels` chạy `vitest.channels.config.ts`.

## Gateway và E2E

- Tích hợp Gateway là tùy chọn chủ động: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` hoặc `pnpm test:gateway`.
- `pnpm test:e2e`: tập hợp E2E của kho lưu trữ = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: kiểm thử smoke đầu-cuối Gateway (ghép cặp WS/HTTP/node đa phiên bản). Mặc định dùng `threads` + `isolate: false` với số worker thích ứng trong `vitest.e2e.config.ts`; điều chỉnh bằng `OPENCLAW_E2E_WORKERS=<n>`, bật nhật ký chi tiết bằng `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: kiểm thử trực tiếp nhà cung cấp (Claude/Minimax/DeepSeek/z.ai/v.v., được kiểm soát bởi `*.live.test.ts`). Yêu cầu khóa API và `LIVE=1` (hoặc `OPENCLAW_LIVE_TEST=1`) để không bỏ qua; bật đầu ra chi tiết bằng `OPENCLAW_LIVE_TEST_QUIET=0`.

## Bộ Docker đầy đủ (`pnpm test:docker:all`)

Xây dựng image kiểm thử trực tiếp dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, xây dựng/tái sử dụng một image trình chạy Node/Git tối giản cùng một image chức năng cài đặt tarball đó vào `/app`, rồi chạy các luồng smoke Docker thông qua bộ lập lịch có trọng số. `scripts/package-openclaw-for-docker.mjs` là trình đóng gói cục bộ/CI duy nhất và xác thực tarball cùng `dist/postinstall-inventory.json` trước khi Docker sử dụng.

- Image tối giản (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): các luồng trình cài đặt/cập nhật/phụ thuộc plugin; gắn tarball đã dựng sẵn thay vì các nguồn kho lưu trữ được sao chép.
- Image chức năng (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): các luồng chức năng ứng dụng đã dựng thông thường.
- Định nghĩa luồng: `scripts/lib/docker-e2e-scenarios.mjs`. Bộ lập kế hoạch: `scripts/lib/docker-e2e-plan.mjs`. Bộ thực thi: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` xuất kế hoạch CI do bộ lập lịch sở hữu (các luồng, loại image, nhu cầu gói/image trực tiếp, kịch bản trạng thái, kiểm tra thông tin xác thực) mà không xây dựng hoặc chạy Docker.

Các nút điều chỉnh lập lịch (biến môi trường, giá trị mặc định trong ngoặc đơn):

| Biến môi trường                                                                                                 | Mặc định            | Mục đích                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Số vị trí tiến trình.                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Nhóm đuôi nhạy cảm với nhà cung cấp.                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Giới hạn luồng nhà cung cấp trực tiếp nặng.                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Giới hạn luồng tài nguyên npm.                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Giới hạn luồng tài nguyên dịch vụ.                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Giới hạn luồng nặng theo từng nhà cung cấp.                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Giới hạn hẹp hơn theo từng nhà cung cấp.                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Ghi đè dành cho máy chủ lớn hơn.                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Độ trễ giữa các lần bắt đầu luồng, tránh tình trạng dồn dập tạo tiến trình trên daemon Docker cục bộ.                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 phút) | Thời gian chờ dự phòng cho mỗi luồng; các luồng trực tiếp/đuôi được chọn sử dụng giới hạn chặt hơn.                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Số lần thử lại đối với lỗi nhà cung cấp trực tiếp tạm thời.                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | tắt                 | In bản kê khai luồng mà không chạy Docker.                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Khoảng thời gian in trạng thái luồng đang hoạt động.                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | bật                 | Tái sử dụng `.artifacts/docker-tests/lane-timings.json` để sắp xếp từ dài nhất trước; đặt thành `0` để tắt.                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` chỉ dành cho các luồng xác định/cục bộ, `only` chỉ dành cho các luồng nhà cung cấp trực tiếp. Bí danh: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Chế độ chỉ trực tiếp hợp nhất các luồng trực tiếp chính và đuôi thành một nhóm dài nhất trước để các nhóm nhà cung cấp đóng gói công việc Claude/Codex/Gemini cùng nhau. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Thời gian chờ thiết lập Docker cho phần phụ trợ CLI.                                                                                                                                                                                                                                        |

Mẫu biến môi trường cho giới hạn tài nguyên là `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (tên tài nguyên được viết hoa, các ký tự không phải chữ-số được thu gọn thành `_`).

Hành vi khác: trình chạy mặc định kiểm tra sơ bộ Docker, dọn dẹp các container E2E OpenClaw cũ, chia sẻ bộ nhớ đệm công cụ CLI của nhà cung cấp giữa các lane tương thích và ngừng lên lịch các lane dùng chung mới sau lỗi đầu tiên, trừ khi `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` được đặt. Nếu một lane vượt quá giới hạn trọng số/tài nguyên hiệu dụng trên máy chủ có mức song song thấp, lane đó vẫn có thể bắt đầu từ một pool trống và chạy riêng cho đến khi giải phóng tài nguyên. Nhật ký theo từng lane, `summary.json`, `failures.json` và thời gian của các giai đoạn được ghi trong `.artifacts/docker-tests/<run-id>/`; dùng `pnpm test:docker:timings <summary.json>` để kiểm tra các lane chậm và `pnpm test:docker:rerun <run-id|summary.json|failures.json>` để in các lệnh chạy lại có mục tiêu, ít tốn tài nguyên.

### Các lane Docker đáng chú ý

| Lệnh                                                                        | Xác minh                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Container E2E nguồn dựa trên Chromium với CDP thô + Gateway biệt lập; ảnh chụp nhanh vai trò CDP của `browser doctor --deep` bao gồm URL liên kết, các phần tử có thể nhấp được nâng cấp từ con trỏ, tham chiếu iframe và siêu dữ liệu khung.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | Cài đặt tarball đã đóng gói trong một trình chạy Docker tối giản với `skills.install.allowUploadedArchives: false`, phân giải slug kỹ năng hiện tại từ tìm kiếm ClawHub trực tiếp, cài đặt qua `openclaw skills install` và xác minh `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` và `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Các phép thăm dò trực tiếp có trọng tâm cho backend CLI; Gemini có các bí danh tương ứng là `:resume` và `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI được đóng gói trong Docker: đăng nhập, kiểm tra `/api/models`, chạy một cuộc trò chuyện được ủy quyền thực sự qua `/api/chat/completions`. Yêu cầu khóa mô hình trực tiếp có thể sử dụng và kéo một ảnh bên ngoài; không được kỳ vọng ổn định trong CI như các bộ unit/e2e.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | Container Gateway được khởi tạo dữ liệu cùng một container máy khách sinh `openclaw mcp serve`: khám phá cuộc trò chuyện được định tuyến, đọc bản ghi, siêu dữ liệu tệp đính kèm, hành vi hàng đợi sự kiện trực tiếp, định tuyến gửi đi và thông báo kênh + quyền kiểu Claude qua cầu nối stdio thực (phép xác nhận đọc trực tiếp các khung MCP stdio thô).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | Cài đặt tarball đã đóng gói lên một fixture người dùng cũ không sạch, chạy cập nhật gói cùng doctor không tương tác mà không cần khóa nhà cung cấp/kênh trực tiếp, khởi động Gateway loopback, kiểm tra để bảo đảm tác nhân/cấu hình kênh/danh sách cho phép Plugin/tệp không gian làm việc/phiên/trạng thái phụ thuộc Plugin cũ lỗi thời/trạng thái khởi động/RPC vẫn được giữ nguyên.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | Mặc định cài đặt `openclaw@latest`, khởi tạo các tệp người dùng hiện có thực tế, cấu hình bằng công thức `openclaw config set` tích hợp sẵn, cập nhật lên tarball đã đóng gói, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, kiểm tra `/healthz`, `/readyz`, trạng thái RPC. Ghi đè bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, mở rộng một ma trận bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` hoặc thêm fixture kịch bản bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (bao gồm `configured-plugin-installs` và `stale-source-plugin-shadow`). Package Acceptance cung cấp các mục này dưới dạng `published_upgrade_survivor_baseline(s)` / `_scenarios` và phân giải các token meta như `last-stable-4` hoặc `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Bộ kiểm thử khả năng tồn tại sau nâng cấp đã phát hành trong kịch bản `plugin-deps-cleanup`, mặc định bắt đầu tại `openclaw@2026.4.23`. Quy trình làm việc `Update Migration` mở rộng nội dung này bằng `baselines=all-since-2026.4.23` để chứng minh việc dọn dẹp phần phụ thuộc của Plugin đã cấu hình bên ngoài Full Release CI.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | Kiểm thử nhanh cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, các gói sổ đăng ký npm có phần phụ thuộc được nâng lên cấp trên, tham chiếu git di động, fixture ClawHub, cập nhật marketplace và bật/kiểm tra gói Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## Cổng kiểm tra PR cục bộ

Đối với các bước kiểm tra cổng/đưa PR vào nhánh cục bộ, hãy chạy:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Nếu `pnpm test` không ổn định trên một máy chủ đang chịu tải, hãy chạy lại một lần trước khi coi đó là hồi quy, sau đó cô lập bằng `pnpm test <path/to/test>`. Đối với các máy chủ bị giới hạn bộ nhớ:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Công cụ hiệu năng kiểm thử

- `pnpm test:perf:imports`: bật báo cáo thời lượng nhập + phân tích chi tiết thao tác nhập của Vitest, đồng thời vẫn sử dụng định tuyến lane theo phạm vi cho các mục tiêu tệp/thư mục được chỉ định rõ ràng. `pnpm test:perf:imports:changed` giới hạn cùng hoạt động lập hồ sơ đó vào các tệp đã thay đổi kể từ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` đo điểm chuẩn đường dẫn chế độ thay đổi đã định tuyến so với lần chạy dự án gốc nguyên bản cho cùng một diff git đã commit; `pnpm test:perf:changed:bench -- --worktree` đo điểm chuẩn tập thay đổi của cây làm việc hiện tại mà không cần commit trước.
- `pnpm test:perf:profile:main` ghi hồ sơ CPU cho luồng chính của Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` ghi hồ sơ CPU + heap cho trình chạy unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: chạy tuần tự từng cấu hình lá Vitest của toàn bộ bộ kiểm thử và ghi dữ liệu thời lượng được nhóm cùng các thành phần JSON/nhật ký theo từng cấu hình. Theo mặc định, báo cáo toàn bộ bộ kiểm thử cô lập các tệp để biểu đồ mô-đun được giữ lại và khoảng dừng GC từ các tệp trước không bị tính vào các phép xác nhận sau; chỉ truyền `-- --no-isolate` khi chủ đích lập hồ sơ mức tích lũy của worker dùng chung. Test Performance Agent sử dụng kết quả này làm đường cơ sở trước khi thử sửa các kiểm thử chậm. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` so sánh các báo cáo được nhóm sau một thay đổi tập trung vào hiệu năng.
- Các lần chạy shard theo toàn bộ bộ kiểm thử, phần mở rộng và mẫu bao gồm cập nhật dữ liệu thời gian cục bộ trong `.artifacts/vitest-shard-timings.json`; các lần chạy toàn bộ cấu hình sau đó dùng các thời gian này để cân bằng shard chậm và nhanh. Các shard CI theo mẫu bao gồm nối tên shard vào khóa thời gian, giúp thời gian của shard đã lọc vẫn hiển thị mà không thay thế dữ liệu thời gian của toàn bộ cấu hình. Đặt `OPENCLAW_TEST_PROJECTS_TIMINGS=0` để bỏ qua thành phần dữ liệu thời gian cục bộ.

## Điểm chuẩn

<Accordion title="Độ trễ mô hình (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Biến môi trường tùy chọn: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Lời nhắc mặc định: "Chỉ trả lời bằng một từ: ok. Không có dấu câu hoặc văn bản bổ sung."

</Accordion>

<Accordion title="Khởi động CLI (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

Các cấu hình đặt trước:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: kết hợp cả hai cấu hình đặt trước

Đầu ra bao gồm `sampleCount`, trung bình, p50, p95, tối thiểu/tối đa, phân bố mã thoát/tín hiệu và RSS tối đa cho mỗi lệnh. `--cpu-prof-dir` / `--heap-prof-dir` ghi hồ sơ V8 cho mỗi lần chạy.

Đầu ra đã lưu: `pnpm test:startup:bench:smoke` ghi `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` ghi `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture được đưa vào kho mã: `test/fixtures/cli-startup-bench.json`, được làm mới bởi `pnpm test:startup:bench:update`, được so sánh bởi `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Khởi động Gateway (scripts/bench-gateway-startup.ts)">

Mặc định dùng điểm vào CLI đã dựng tại `dist/entry.js`; trước tiên hãy chạy `pnpm build`. Truyền `--entry scripts/run-node.mjs` để đo trình chạy mã nguồn thay thế và giữ các kết quả đó tách biệt với đường cơ sở của điểm vào đã dựng.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

ID trường hợp: `default`, `skipChannels` (bỏ qua khởi động kênh), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 Plugin manifest), `fiftyStartupLazyPlugins` (50 Plugin manifest tải lười khi khởi động).

Đầu ra bao gồm đầu ra đầu tiên của tiến trình, `/healthz`, `/readyz`, thời gian ghi nhật ký lắng nghe HTTP, thời gian ghi nhật ký Gateway sẵn sàng, thời gian CPU, tỷ lệ lõi CPU, RSS tối đa, heap, chỉ số theo dõi khởi động, độ trễ vòng lặp sự kiện và các chỉ số chi tiết của bảng tra cứu Plugin. Tập lệnh đặt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` trong môi trường Gateway con.

`/healthz` biểu thị trạng thái còn hoạt động (máy chủ HTTP có thể phản hồi). `/readyz` biểu thị trạng thái sẵn sàng sử dụng (các sidecar Plugin khởi động, kênh và tác vụ hậu đính kèm thiết yếu cho trạng thái sẵn sàng đã ổn định). Các hook khởi động được điều phối bất đồng bộ và không thuộc phạm vi bảo đảm trạng thái sẵn sàng. Thời gian nhật ký sẵn sàng là dấu thời gian nội bộ của Gateway, hữu ích để quy nguyên nhân ở phía tiến trình nhưng không thay thế cho phép thăm dò `/readyz` bên ngoài.

Dùng đầu ra JSON hoặc `--output` khi so sánh các thay đổi. Chỉ dùng `--cpu-prof-dir` sau khi đầu ra theo dõi chỉ ra tác vụ nhập, biên dịch hoặc bị giới hạn bởi CPU mà chỉ riêng thời gian từng giai đoạn không thể giải thích.

</Accordion>

<Accordion title="Khởi động lại Gateway (scripts/bench-gateway-restart.ts)">

Chỉ dành cho macOS và Linux (dùng SIGUSR1 để khởi động lại trong tiến trình; thất bại ngay lập tức trên Windows). Có cùng điểm vào đã dựng mặc định và tùy chọn ghi đè `--entry scripts/run-node.mjs` như phần khởi động Gateway ở trên.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

ID trường hợp: `skipChannels`, `skipChannelsAcpxProbe` (bật phép thăm dò khởi động ACPX), `skipChannelsNoAcpxProbe` (tắt phép thăm dò), `default`, `fiftyPlugins`.

Đầu ra bao gồm `/healthz` tiếp theo, `/readyz` tiếp theo, thời gian ngừng hoạt động, thời gian sẵn sàng sau khi khởi động lại, CPU, RSS, các chỉ số theo dõi khởi động cho tiến trình thay thế và các chỉ số theo dõi khởi động lại cho việc xử lý tín hiệu, hoàn tất công việc đang hoạt động, các giai đoạn đóng, lần khởi động tiếp theo, thời gian sẵn sàng và ảnh chụp nhanh bộ nhớ. Tập lệnh đặt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` và `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Dùng phép đo hiệu năng này khi thay đổi liên quan đến tín hiệu khởi động lại, trình xử lý đóng, khởi động sau khi khởi động lại, tắt sidecar, chuyển giao dịch vụ hoặc trạng thái sẵn sàng sau khi khởi động lại. Bắt đầu với `skipChannels` để tách biệt cơ chế Gateway khỏi quá trình khởi động kênh; chỉ dùng `default` hoặc các trường hợp có nhiều Plugin sau khi trường hợp hẹp đã giải thích được đường dẫn khởi động lại. Các chỉ số theo dõi là gợi ý quy nguyên nhân, không phải kết luận — hãy đánh giá thay đổi về khởi động lại dựa trên nhiều mẫu, khoảng thời gian của thành phần sở hữu tương ứng, hành vi `/healthz`/`/readyz` và hợp đồng khởi động lại hiển thị với người dùng.

</Accordion>

## E2E quy trình thiết lập ban đầu (Docker)

Không bắt buộc; chỉ cần cho các bài kiểm tra nhanh quy trình thiết lập ban đầu trong vùng chứa. Toàn bộ quy trình khởi động nguội trong một vùng chứa Linux sạch:

```bash
scripts/e2e/onboard-docker.sh
```

Điều khiển trình hướng dẫn tương tác qua pseudo-tty, xác minh các tệp cấu hình/không gian làm việc/phiên, sau đó khởi động Gateway và chạy `openclaw health`.

## Kiểm tra nhanh việc nhập QR (Docker)

Đảm bảo trình trợ giúp môi trường chạy QR được duy trì có thể tải trong các môi trường chạy Docker Node được hỗ trợ (Node 24 mặc định, tương thích với Node 22):

```bash
pnpm test:docker:qr
```

## Liên quan

- [Kiểm thử](/vi/help/testing)
- [Kiểm thử trực tiếp](/vi/help/testing-live)
- [Kiểm thử bản cập nhật và Plugin](/vi/help/testing-updates-plugins)
