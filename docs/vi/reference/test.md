---
read_when:
    - Chạy hoặc sửa lỗi kiểm thử
summary: Cách chạy kiểm thử cục bộ (vitest) và khi nào nên sử dụng chế độ bắt buộc/phạm vi bao phủ
title: Kiểm thử
x-i18n:
    generated_at: "2026-07-12T08:21:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Bộ công cụ kiểm thử đầy đủ (các bộ kiểm thử, trực tiếp, Docker): [Kiểm thử](/vi/help/testing)
- Xác thực bản cập nhật và gói plugin: [Kiểm thử bản cập nhật và plugin](/vi/help/testing-updates-plugins)

## Mặc định cho agent

Các phiên agent chạy kiểm thử và hoạt động xác thực tốn nhiều tài nguyên tính toán từ xa
thông qua Crabbox. Mã của người bảo trì đáng tin cậy mặc định sử dụng Blacksmith Testbox. Quy trình
Testbox đã cấu hình sẽ nạp thông tin xác thực, vì vậy mã từ cộng tác viên không đáng tin cậy hoặc
fork phải sử dụng CI của fork không có bí mật hoặc AWS Crabbox trực tiếp đã được làm sạch để thay thế.

Khi một tác vụ mã đáng tin cậy có khả năng cần kiểm thử hoặc bằng chứng chuyên sâu, hãy làm nóng trước
ngay lập tức trong một phiên lệnh nền, tiếp tục làm việc trong khi phiên đó được khởi tạo,
tái sử dụng mã `tbx_...` được trả về, đồng bộ bản checkout hiện tại trong mỗi lần chạy và
dừng phiên trước khi bàn giao:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Sau lần tái sử dụng thành công đầu tiên, trình bao bọc ghi lại dấu vân tay của cơ sở,
phụ thuộc và quy trình Testbox của phiên thuê trong `.crabbox/testbox-leases/`.
Các chỉnh sửa chỉ liên quan đến mã nguồn tiếp tục tái sử dụng môi trường đã làm nóng. Thay đổi cơ sở hợp nhất, tệp khóa,
đầu vào của trình quản lý gói, trình bao bọc hoặc quy trình Testbox sẽ khiến hệ thống dừng an toàn và yêu cầu một
phiên thuê mới. Mỗi lần chạy vẫn đồng bộ bản checkout hiện tại.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` chỉ dành cho chẩn đoán có chủ đích, không dùng làm
bằng chứng phát hành.

Các lệnh kiểm thử cục bộ bên dưới dành cho quy trình của con người hoặc phương án dự phòng rõ ràng cho agent
do người dùng yêu cầu. Phải báo cáo khi nhà cung cấp từ xa không khả dụng; điều đó
không cho phép âm thầm chạy một cổng kiểm tra cục bộ diện rộng.

Đối với mã không đáng tin cậy, hãy làm nóng trước bằng `--provider aws`. Mỗi lần chạy phải đặt
`CRABBOX_ENV_ALLOW=CI`, truyền `--provider aws --no-hydrate` và sử dụng
một `HOME` từ xa tạm thời mới trước khi cài đặt phụ thuộc hoặc chạy
kiểm thử. Sử dụng một phiên thuê mới được làm nóng, dành riêng cho nguồn không đáng tin cậy đó; tuyệt đối không tái sử dụng
phiên thuê đáng tin cậy hoặc đã từng được nạp thông tin xác thực. Khởi chạy một tệp nhị phân Crabbox đáng tin cậy đã cài đặt
từ bản checkout `main` sạch và đáng tin cậy, đồng thời chỉ tìm nạp PR từ xa bằng
`--fresh-pr`; tuyệt đối không thực thi cục bộ trình bao bọc hoặc cấu hình của bản checkout không đáng tin cậy.
Hủy đặt `CRABBOX_AWS_INSTANCE_PROFILE` và dừng an toàn trừ khi giá trị
`aws.instanceProfile` đã phân giải là rỗng. Trước mọi thao tác cài đặt/kiểm thử, hãy dùng các
công cụ đường dẫn tuyệt đối đáng tin cậy để yêu cầu mã thông báo IMDSv2, chứng minh điểm cuối thông tin xác thực IAM
trả về 404 và xác minh `git rev-parse HEAD` từ xa bằng đúng SHA đầu PR đầy đủ
đã được xem xét. Liên kết phiên thuê với SHA đó và dừng/làm nóng lại khi đầu nhánh
thay đổi. Tải `scripts/crabbox-untrusted-bootstrap.sh` đáng tin cậy từ
`main` sạch lên cùng với `--fresh-pr`; tập lệnh này cài đặt Node/pnpm được ghim phiên bản, xác minh SHA
và phiên bản ghim của trình quản lý gói, cô lập `HOME`, cài đặt phụ thuộc, rồi thực thi
kiểm thử được yêu cầu. Nếu trình môi giới không thể chứng minh không có vai trò hoặc không tồn tại PR từ xa,
hãy sử dụng CI của fork không có bí mật. Không sử dụng `hydrate-github`, `--no-sync` hoặc
quy trình Testbox đã được nạp thông tin xác thực.
Hủy đặt mọi giá trị ghi đè `CRABBOX_TAILSCALE*`, bắt buộc `--network public
--tailscale=false`, xóa các cờ nút thoát/LAN và yêu cầu `crabbox inspect`
báo cáo kết nối mạng công cộng không có trạng thái Tailscale trước khi tải lên bất kỳ tập lệnh nào.

## Thứ tự cục bộ thông thường

1. `pnpm test:changed` để cung cấp bằng chứng Vitest trong phạm vi thay đổi.
2. `pnpm test <path-or-filter>` cho một tệp, thư mục hoặc mục tiêu cụ thể.
3. Chỉ dùng `pnpm test` khi bạn chủ ý cần toàn bộ bộ kiểm thử Vitest cục bộ.

Trong worktree Codex hoặc bản checkout được liên kết/thưa, agent tránh chạy trực tiếp cục bộ
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Phương án dự phòng cục bộ do người dùng yêu cầu rõ ràng cho một tệp nhỏ:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Các cổng kiểm tra thay đổi hoặc bằng chứng diện rộng: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` để pnpm chạy bên trong Testbox.
- `exitCode` cuối cùng và JSON thời gian của trình bao bọc là kết quả lệnh. Một lượt chạy Blacksmith GitHub Actions được ủy quyền có thể hiển thị `cancelled` sau khi lệnh SSH thành công vì Testbox bị dừng từ bên ngoài tác vụ duy trì hoạt động; hãy kiểm tra phần tóm tắt của trình bao bọc và đầu ra lệnh trước khi coi đó là lỗi.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: giới hạn việc tuần tự hóa các kiểm tra nặng trong worktree hiện tại thay vì thư mục chung của Git đối với các lệnh như `pnpm check:changed` và `pnpm test ...` có mục tiêu. Chỉ sử dụng trên các máy cục bộ có năng lực cao khi bạn chủ ý chạy các kiểm tra độc lập trên nhiều worktree được liên kết.

## Các lệnh cốt lõi

Các lượt chạy trình bao bọc kiểm thử kết thúc bằng phần tóm tắt ngắn `[test] passed|failed|skipped ... in ...`; dòng thời lượng riêng của Vitest vẫn là chi tiết theo từng phân đoạn.

| Lệnh                                              | Chức năng                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Các mục tiêu tệp/thư mục cụ thể được định tuyến qua các luồng Vitest có phạm vi. Các lượt chạy không chỉ định mục tiêu là bằng chứng cho toàn bộ bộ kiểm thử: các nhóm phân đoạn cố định được mở rộng thành cấu hình lá để thực thi song song cục bộ, với số lượng phân đoạn dự kiến được in ra trước khi bắt đầu. Nhóm tiện ích mở rộng luôn được mở rộng thành cấu hình phân đoạn theo từng tiện ích mở rộng thay vì một tiến trình dự án gốc khổng lồ. |
| `pnpm test:changed`                               | Lượt chạy kiểm thử thay đổi thông minh, ít tốn kém: các mục tiêu chính xác từ chỉnh sửa trực tiếp đối với kiểm thử, các tệp `*.test.ts` cùng cấp, ánh xạ mã nguồn rõ ràng và đồ thị nhập cục bộ. Các thay đổi diện rộng/cấu hình/gói sẽ bị bỏ qua trừ khi chúng ánh xạ đến các kiểm thử cụ thể.                                                                 |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Lượt chạy kiểm thử thay đổi diện rộng rõ ràng; sử dụng khi chỉnh sửa bộ khung kiểm thử/cấu hình/gói cần quay về hành vi kiểm thử thay đổi diện rộng hơn của Vitest.                                                                                                                                                                                       |
| `pnpm test:force`                                 | Giải phóng cổng Gateway OpenClaw đã cấu hình (mặc định `18789`), sau đó chạy toàn bộ bộ kiểm thử với một cổng Gateway cô lập để các kiểm thử máy chủ không xung đột với phiên bản đang chạy.                                                                                                                                                              |
| `pnpm test:coverage`                              | Xuất báo cáo độ bao phủ V8 mang tính thông tin cho luồng đơn vị mặc định (`vitest.unit.config.ts`); không áp dụng ngưỡng độ bao phủ.                                                                                                                                                                                                                     |
| `pnpm test:coverage:changed`                      | Chỉ đo độ bao phủ đơn vị cho các tệp đã thay đổi kể từ `origin/main`.                                                                                                                                                                                                                                                                                  |
| `pnpm changed:lanes`                              | Hiển thị các luồng kiến trúc được kích hoạt bởi phần khác biệt so với `origin/main`.                                                                                                                                                                                                                                                                   |
| `pnpm check:changed`                              | Mặc định ủy quyền cho Crabbox/Testbox bên ngoài CI, sau đó chạy cổng kiểm tra thay đổi thông minh bên trong tiến trình con từ xa: định dạng cùng với kiểm tra kiểu, lint và các lệnh bảo vệ cho các luồng bị ảnh hưởng. Không chạy Vitest; dùng `pnpm test:changed` hoặc `pnpm test <target>` để cung cấp bằng chứng kiểm thử.                                |

## Trạng thái kiểm thử dùng chung và trình trợ giúp tiến trình

- `src/test-utils/openclaw-test-state.ts`: sử dụng từ Vitest khi kiểm thử cần một `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, bản cố định cấu hình, không gian làm việc, thư mục agent hoặc kho hồ sơ xác thực được cô lập.
- `pnpm test:env-mutations:report`: báo cáo không chặn về các kiểm thử/bộ khung làm thay đổi trực tiếp `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` hoặc các khóa môi trường liên quan. Dùng báo cáo này để tìm các ứng viên di chuyển sang trình trợ giúp trạng thái kiểm thử dùng chung.
- `test/helpers/openclaw-test-instance.ts`: dành cho các kiểm thử E2E cấp tiến trình cần một Gateway đang chạy, môi trường CLI, thu thập nhật ký và dọn dẹp tại một nơi.
- Các luồng E2E Docker/Bash nạp `scripts/lib/docker-e2e-image.sh` có thể truyền `docker_e2e_test_state_shell_b64 <label> <scenario>` vào vùng chứa và giải mã bằng `scripts/lib/openclaw-e2e-instance.sh`; các tập lệnh nhiều thư mục chính có thể truyền `docker_e2e_test_state_function_b64` và gọi `openclaw_test_state_create <label> <scenario>` trong mỗi luồng. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` ghi một tệp môi trường máy chủ có thể được nạp bằng `source` (`--` trước `create` ngăn các phiên bản Node mới hơn coi `--env-file` là cờ Node). Các luồng khởi chạy Gateway có thể nạp `scripts/lib/openclaw-e2e-instance.sh` để phân giải điểm vào, khởi động OpenAI mô phỏng, khởi chạy ở nền trước/nền sau, thăm dò trạng thái sẵn sàng, xuất biến môi trường trạng thái, kết xuất nhật ký và dọn dẹp tiến trình.

## Các luồng Control UI, TUI và tiện ích mở rộng

- **E2E Control UI mô phỏng:** `pnpm test:ui:e2e` chạy luồng Vitest + Playwright, khởi động Vite Control UI và điều khiển một trang Chromium thực với Gateway WebSocket mô phỏng. Các kiểm thử nằm trong `ui/src/**/*.e2e.test.ts`; các thành phần mô phỏng/điều khiển dùng chung nằm trong `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` bao gồm luồng này. Theo mặc định, các lượt chạy của agent sử dụng Testbox/Crabbox, kể cả kiểm chứng có mục tiêu; chỉ sử dụng `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` khi cần phương án dự phòng cục bộ một cách rõ ràng.
- **Kiểm thử PTY của TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` chạy luồng PTY nhanh với backend giả. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` hoặc `pnpm tui:pty:test:watch --mode local` chạy kiểm thử khói `tui --local` chậm hơn, chỉ mô phỏng điểm cuối mô hình bên ngoài. Hãy xác nhận văn bản hiển thị ổn định hoặc các lệnh gọi fixture, không xác nhận ảnh chụp nhanh ANSI thô.
- `pnpm test:extensions` và `pnpm test extensions` chạy tất cả các phân đoạn tiện ích mở rộng/Plugin. Các Plugin kênh nặng, Plugin trình duyệt và OpenAI chạy dưới dạng các phân đoạn chuyên biệt; các nhóm Plugin khác vẫn được chạy theo lô. `pnpm test extensions/<id>` chạy một luồng Plugin đi kèm.
- Các tệp nguồn có kiểm thử cùng cấp sẽ ánh xạ tới kiểm thử đó trước khi chuyển sang các glob thư mục rộng hơn. Các chỉnh sửa trình trợ giúp trong `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` và `src/plugins/contracts` sử dụng đồ thị nhập cục bộ để chạy các kiểm thử có nhập chúng, thay vì chạy rộng tất cả các phân đoạn khi đường dẫn phụ thuộc đã rõ ràng.
- Các đích thư mục hợp đồng phân nhánh sang các luồng hợp đồng tương ứng: `pnpm test src/channels/plugins/contracts` chạy bốn cấu hình hợp đồng kênh và `pnpm test src/plugins/contracts` chạy cấu hình hợp đồng Plugin, vì các dự án `channels`/`plugins` chung loại trừ `contracts/**`.
- `auto-reply` được chia thành ba cấu hình chuyên biệt (`core`, `top-level`, `reply`) để bộ kiểm thử reply không lấn át các kiểm thử trạng thái/token/trình trợ giúp cấp cao nhất nhẹ hơn.
- Các tệp kiểm thử `plugin-sdk` và `commands` được chọn sẽ được định tuyến qua các luồng nhẹ chuyên biệt chỉ giữ lại `test/setup.ts`, còn các trường hợp nặng về thời gian chạy vẫn nằm trên các luồng hiện có.
- Cấu hình Vitest cơ sở mặc định dùng `pool: "threads"` và `isolate: false`, đồng thời trình chạy không cô lập dùng chung được bật trên các cấu hình của kho lưu trữ.
- `pnpm test:channels` chạy `vitest.channels.config.ts`.

## Gateway và E2E

- Tích hợp Gateway là tùy chọn chủ động: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` hoặc `pnpm test:gateway`.
- `pnpm test:e2e`: tập hợp E2E của kho lưu trữ = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: các kiểm thử khói đầu cuối của Gateway (ghép cặp WS/HTTP/Node đa phiên bản). Mặc định dùng `threads` + `isolate: false` với số worker thích ứng trong `vitest.e2e.config.ts`; điều chỉnh bằng `OPENCLAW_E2E_WORKERS=<n>`, bật nhật ký chi tiết bằng `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: kiểm thử trực tiếp nhà cung cấp (Claude/Minimax/DeepSeek/z.ai/v.v., được kiểm soát bởi `*.live.test.ts`). Yêu cầu khóa API và `LIVE=1` (hoặc `OPENCLAW_LIVE_TEST=1`) để không bỏ qua; bật đầu ra chi tiết bằng `OPENCLAW_LIVE_TEST_QUIET=0`.

## Bộ Docker đầy đủ (`pnpm test:docker:all`)

Xây dựng image kiểm thử trực tiếp dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, xây dựng/tái sử dụng một image trình chạy Node/Git tối giản cùng một image chức năng cài đặt tarball đó vào `/app`, sau đó chạy các luồng kiểm thử khói Docker thông qua bộ lập lịch có trọng số. `scripts/package-openclaw-for-docker.mjs` là trình đóng gói duy nhất cho môi trường cục bộ/CI và xác thực tarball cùng `dist/postinstall-inventory.json` trước khi Docker sử dụng.

- Image tối giản (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): các luồng trình cài đặt/cập nhật/phụ thuộc Plugin; gắn kết tarball dựng sẵn thay vì các nguồn kho lưu trữ được sao chép.
- Image chức năng (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): các luồng chức năng thông thường của ứng dụng đã dựng.
- Định nghĩa luồng: `scripts/lib/docker-e2e-scenarios.mjs`. Trình lập kế hoạch: `scripts/lib/docker-e2e-plan.mjs`. Trình thực thi: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` xuất kế hoạch CI do bộ lập lịch sở hữu (các luồng, loại image, nhu cầu về gói/image trực tiếp, kịch bản trạng thái, kiểm tra thông tin xác thực) mà không xây dựng hoặc chạy Docker.

Các nút điều chỉnh lịch chạy (biến môi trường, giá trị mặc định trong ngoặc đơn):

| Biến môi trường                                                                                                  | Mặc định            | Mục đích                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Số vị trí tiến trình.                                                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Nhóm cuối nhạy cảm với nhà cung cấp.                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Giới hạn các luồng nhà cung cấp trực tiếp nặng.                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Giới hạn các luồng tài nguyên npm.                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Giới hạn các luồng tài nguyên dịch vụ.                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Giới hạn luồng nặng theo từng nhà cung cấp.                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Giới hạn hẹp hơn theo từng nhà cung cấp.                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Ghi đè dành cho máy chủ lớn hơn.                                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Độ trễ giữa các lần khởi động luồng, tránh tình trạng daemon Docker cục bộ bị dồn dập yêu cầu tạo.                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 phút) | Thời gian chờ dự phòng cho mỗi luồng; các luồng trực tiếp/luồng cuối được chọn sử dụng giới hạn chặt hơn.                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Số lần thử lại khi nhà cung cấp trực tiếp gặp lỗi tạm thời.                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | tắt                 | In danh sách luồng mà không chạy Docker.                                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Khoảng thời gian in trạng thái các luồng đang hoạt động.                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | bật                 | Tái sử dụng `.artifacts/docker-tests/lane-timings.json` để sắp xếp từ lâu nhất đến ngắn nhất; đặt thành `0` để tắt.                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` để chỉ chạy các luồng xác định/cục bộ, `only` để chỉ chạy các luồng nhà cung cấp trực tiếp. Bí danh: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Chế độ chỉ trực tiếp hợp nhất các luồng trực tiếp chính và cuối thành một nhóm duy nhất theo thứ tự lâu nhất trước, để các nhóm nhà cung cấp gom công việc Claude/Codex/Gemini cùng nhau. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Thời gian chờ thiết lập Docker cho backend CLI.                                                                                                                                                                                                                                                                    |

Mẫu biến môi trường cho giới hạn tài nguyên là `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (tên tài nguyên được viết hoa, các ký tự không phải chữ và số được thu gọn thành `_`).

Hành vi khác: trình chạy mặc định kiểm tra sơ bộ Docker, dọn dẹp các container E2E OpenClaw cũ, chia sẻ bộ nhớ đệm công cụ CLI của nhà cung cấp giữa các luồng tương thích và ngừng lập lịch các luồng dùng chung mới sau lỗi đầu tiên, trừ khi đặt `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`. Nếu một luồng vượt quá giới hạn trọng số/tài nguyên hiệu dụng trên máy chủ có mức song song thấp, luồng đó vẫn có thể khởi chạy từ một vùng dùng chung trống và chạy riêng cho đến khi giải phóng dung lượng. Nhật ký theo từng luồng, `summary.json`, `failures.json` và thời gian của các giai đoạn được ghi vào `.artifacts/docker-tests/<run-id>/`; dùng `pnpm test:docker:timings <summary.json>` để kiểm tra các luồng chạy chậm và `pnpm test:docker:rerun <run-id|summary.json|failures.json>` để in các lệnh chạy lại có mục tiêu, ít tốn tài nguyên.

### Các luồng Docker đáng chú ý

| Lệnh                                                                        | Nội dung xác minh                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Container E2E nguồn dựa trên Chromium với CDP thô + Gateway cô lập; các ảnh chụp nhanh vai trò CDP của `browser doctor --deep` bao gồm URL liên kết, các phần tử có thể nhấp được nâng cấp từ con trỏ, tham chiếu iframe và siêu dữ liệu khung.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:skill-install`                                            | Cài đặt tarball đã đóng gói trong một trình chạy Docker tối giản với `skills.install.allowUploadedArchives: false`, phân giải slug skill hiện tại từ tìm kiếm ClawHub trực tiếp, cài đặt qua `openclaw skills install` và xác minh `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` cùng `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Các phép thăm dò trực tiếp có trọng tâm cho backend CLI; Gemini có các bí danh `:resume` và `:mcp` tương ứng.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI được đóng gói bằng Docker: đăng nhập, kiểm tra `/api/models`, chạy một cuộc trò chuyện thực được chuyển tiếp qua `/api/chat/completions`. Yêu cầu khóa mô hình trực tiếp có thể sử dụng và tải một ảnh bên ngoài; không được kỳ vọng ổn định trên CI như các bộ kiểm thử đơn vị/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `pnpm test:docker:mcp-channels`                                             | Container Gateway được nạp sẵn dữ liệu cùng một container máy khách khởi chạy `openclaw mcp serve`: khám phá cuộc hội thoại được định tuyến, đọc bản ghi hội thoại, siêu dữ liệu tệp đính kèm, hành vi hàng đợi sự kiện trực tiếp, định tuyến gửi đi và thông báo kênh + quyền theo kiểu Claude qua cầu nối stdio thực (phép khẳng định đọc trực tiếp các khung MCP stdio thô).                                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:upgrade-survivor`                                         | Cài đặt tarball đã đóng gói lên một fixture người dùng cũ không sạch, chạy cập nhật gói cùng doctor không tương tác mà không cần khóa nhà cung cấp/kênh trực tiếp, khởi động một Gateway local loopback, kiểm tra để bảo đảm cấu hình tác nhân/kênh, danh sách cho phép Plugin, tệp không gian làm việc/phiên, trạng thái phụ thuộc Plugin cũ tồn đọng, quá trình khởi động và trạng thái RPC vẫn được giữ nguyên.                                                                                                                                                                                                                                                                                                                                        |
| `pnpm test:docker:published-upgrade-survivor`                               | Mặc định cài đặt `openclaw@latest`, tạo sẵn các tệp người dùng hiện có sát thực tế, cấu hình qua công thức `openclaw config set` được tích hợp sẵn, cập nhật lên tarball đã đóng gói, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, kiểm tra `/healthz`, `/readyz` và trạng thái RPC. Ghi đè bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, mở rộng ma trận bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` hoặc thêm fixture kịch bản bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (bao gồm `configured-plugin-installs` và `stale-source-plugin-shadow`). Package Acceptance cung cấp các mục này dưới dạng `published_upgrade_survivor_baseline(s)` / `_scenarios` và phân giải các token meta như `last-stable-4` hoặc `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Bộ công cụ kiểm thử khả năng duy trì sau nâng cấp từ bản phát hành trong kịch bản `plugin-deps-cleanup`, mặc định bắt đầu từ `openclaw@2026.4.23`. Quy trình `Update Migration` mở rộng bộ này bằng `baselines=all-since-2026.4.23` để chứng minh việc dọn dẹp phụ thuộc của Plugin đã cấu hình bên ngoài CI Phát hành Đầy đủ.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `pnpm test:docker:plugins`                                                  | Kiểm thử nhanh cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, các gói registry npm có phụ thuộc được nâng lên cấp trên, tham chiếu git di động, fixture ClawHub, bản cập nhật marketplace và bật/kiểm tra gói Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Cổng kiểm tra PR cục bộ

Đối với các bước kiểm tra cổng/hợp nhất PR cục bộ, hãy chạy:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Nếu `pnpm test` thỉnh thoảng thất bại trên máy chủ đang chịu tải, hãy chạy lại một lần trước khi xem đó là lỗi hồi quy, sau đó cô lập bằng `pnpm test <path/to/test>`. Đối với các máy chủ bị giới hạn bộ nhớ:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Công cụ đo hiệu năng kiểm thử

- `pnpm test:perf:imports`: bật báo cáo thời lượng nhập + phân tích chi tiết quá trình nhập của Vitest, đồng thời vẫn sử dụng định tuyến làn có phạm vi cho các đích tệp/thư mục được chỉ định rõ ràng. `pnpm test:perf:imports:changed` giới hạn cùng hoạt động phân tích hiệu năng này vào các tệp đã thay đổi kể từ `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` đo hiệu năng đường dẫn chế độ thay đổi đã định tuyến so với lần chạy dự án gốc nguyên bản cho cùng một phần chênh lệch git đã commit; `pnpm test:perf:changed:bench -- --worktree` đo hiệu năng tập thay đổi hiện tại trong cây làm việc mà không cần commit trước.
- `pnpm test:perf:profile:main` ghi hồ sơ CPU cho luồng chính của Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` ghi hồ sơ CPU + heap cho trình chạy kiểm thử đơn vị (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: chạy tuần tự mọi cấu hình lá Vitest của toàn bộ bộ kiểm thử và ghi dữ liệu thời lượng theo nhóm cùng các thành phần tạo tác JSON/nhật ký cho từng cấu hình. Theo mặc định, báo cáo toàn bộ bộ kiểm thử cô lập các tệp để đồ thị mô-đun được giữ lại và các lần tạm dừng GC từ những tệp trước không bị tính vào các xác nhận sau đó; chỉ truyền `-- --no-isolate` khi chủ ý phân tích sự tích lũy của worker dùng chung. Tác nhân Hiệu năng Kiểm thử sử dụng kết quả này làm đường cơ sở trước khi thử sửa các kiểm thử chậm. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` so sánh các báo cáo theo nhóm sau một thay đổi tập trung vào hiệu năng.
- Các lần chạy phân mảnh toàn bộ, phần mở rộng và mẫu bao gồm sẽ cập nhật dữ liệu thời gian cục bộ trong `.artifacts/vitest-shard-timings.json`; các lần chạy toàn bộ cấu hình sau đó sử dụng những thời gian này để cân bằng các phân mảnh chậm và nhanh. Các phân mảnh CI theo mẫu bao gồm nối tên phân mảnh vào khóa thời gian, giúp thời gian của phân mảnh đã lọc vẫn hiển thị mà không thay thế dữ liệu thời gian toàn bộ cấu hình. Đặt `OPENCLAW_TEST_PROJECTS_TIMINGS=0` để bỏ qua thành phần tạo tác thời gian cục bộ.

## Đo hiệu năng

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

Cấu hình đặt trước:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: kết hợp cả hai cấu hình đặt trước

Đầu ra bao gồm `sampleCount`, trung bình, p50, p95, tối thiểu/tối đa, phân phối mã thoát/tín hiệu và RSS tối đa cho mỗi lệnh. `--cpu-prof-dir` / `--heap-prof-dir` ghi hồ sơ V8 cho mỗi lần chạy.

Đầu ra đã lưu: `pnpm test:startup:bench:smoke` ghi `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` ghi `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Dữ liệu mẫu được đưa vào kho mã: `test/fixtures/cli-startup-bench.json`, được làm mới bằng `pnpm test:startup:bench:update` và được so sánh bằng `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Khởi động Gateway (scripts/bench-gateway-startup.ts)">

Theo mặc định, sử dụng điểm vào CLI đã dựng tại `dist/entry.js`; trước tiên hãy chạy `pnpm build`. Truyền `--entry scripts/run-node.mjs` để thay vào đó đo trình chạy mã nguồn và giữ các kết quả đó tách biệt với đường cơ sở của điểm vào đã dựng.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Mã trường hợp: `default`, `skipChannels` (bỏ qua việc khởi động kênh), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 Plugin từ manifest), `fiftyStartupLazyPlugins` (50 Plugin từ manifest được tải lười khi khởi động).

Đầu ra bao gồm đầu ra tiến trình đầu tiên, `/healthz`, `/readyz`, thời gian nhật ký bắt đầu lắng nghe HTTP, thời gian nhật ký Gateway sẵn sàng, thời gian CPU, tỷ lệ lõi CPU, RSS tối đa, heap, các chỉ số theo dõi khởi động, độ trễ vòng lặp sự kiện và các chỉ số chi tiết của bảng tra cứu Plugin. Tập lệnh đặt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` trong môi trường Gateway con.

`/healthz` biểu thị trạng thái đang hoạt động (máy chủ HTTP có thể phản hồi). `/readyz` biểu thị trạng thái sẵn sàng sử dụng (các tiến trình phụ của Plugin khi khởi động, các kênh và công việc sau khi đính kèm có tính thiết yếu đối với trạng thái sẵn sàng đã ổn định). Các hook khởi động được điều phối bất đồng bộ và không thuộc phạm vi bảo đảm về trạng thái sẵn sàng. Thời gian nhật ký sẵn sàng là dấu thời gian nội bộ của Gateway, hữu ích cho việc quy kết ở phía tiến trình nhưng không thay thế cho phép thăm dò `/readyz` bên ngoài.

Sử dụng đầu ra JSON hoặc `--output` khi so sánh các thay đổi. Chỉ sử dụng `--cpu-prof-dir` sau khi đầu ra theo dõi chỉ ra hoạt động nhập, biên dịch hoặc công việc bị giới hạn bởi CPU mà chỉ riêng thời gian từng giai đoạn không thể giải thích.

</Accordion>

<Accordion title="Khởi động lại Gateway (scripts/bench-gateway-restart.ts)">

Chỉ dành cho macOS và Linux (sử dụng SIGUSR1 để khởi động lại trong tiến trình; thất bại ngay lập tức trên Windows). Có cùng điểm vào đã dựng mặc định và tùy chọn ghi đè `--entry scripts/run-node.mjs` như phần khởi động Gateway ở trên.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Mã trường hợp: `skipChannels`, `skipChannelsAcpxProbe` (bật phép thăm dò ACPX khi khởi động), `skipChannelsNoAcpxProbe` (tắt phép thăm dò), `default`, `fiftyPlugins`.

Đầu ra bao gồm `/healthz` tiếp theo, `/readyz` tiếp theo, thời gian ngừng hoạt động, thời gian sẵn sàng sau khi khởi động lại, CPU, RSS, các chỉ số theo dõi khởi động cho tiến trình thay thế và các chỉ số theo dõi khởi động lại cho việc xử lý tín hiệu, chờ công việc đang hoạt động hoàn tất, các giai đoạn đóng, lần khởi động tiếp theo, thời gian sẵn sàng và ảnh chụp nhanh bộ nhớ. Tập lệnh đặt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` và `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Sử dụng phép đo hiệu năng này khi một thay đổi ảnh hưởng đến tín hiệu khởi động lại, trình xử lý đóng, khởi động sau khi khởi động lại, tắt tiến trình phụ, chuyển giao dịch vụ hoặc trạng thái sẵn sàng sau khi khởi động lại. Bắt đầu với `skipChannels` để cô lập cơ chế Gateway khỏi việc khởi động kênh; chỉ sử dụng `default` hoặc các trường hợp có nhiều Plugin sau khi trường hợp hẹp đã giải thích được đường dẫn khởi động lại. Các chỉ số theo dõi là gợi ý quy kết, không phải kết luận — hãy đánh giá thay đổi khởi động lại dựa trên nhiều mẫu, khoảng đo tương ứng của thành phần sở hữu, hành vi `/healthz`/`/readyz` và hợp đồng khởi động lại mà người dùng nhìn thấy.

</Accordion>

## E2E quy trình thiết lập ban đầu (Docker)

Tùy chọn; chỉ cần thiết cho các kiểm thử nhanh quy trình thiết lập ban đầu trong vùng chứa. Luồng khởi động nguội đầy đủ trong một vùng chứa Linux sạch:

```bash
scripts/e2e/onboard-docker.sh
```

Điều khiển trình hướng dẫn tương tác qua một tty giả, xác minh các tệp cấu hình/không gian làm việc/phiên, sau đó khởi động Gateway và chạy `openclaw health`.

## Kiểm thử nhanh nhập mã QR (Docker)

Bảo đảm trình trợ giúp môi trường chạy QR được duy trì có thể tải trong các môi trường chạy Docker Node được hỗ trợ (Node 24 mặc định, tương thích với Node 22):

```bash
pnpm test:docker:qr
```

## Liên quan

- [Kiểm thử](/vi/help/testing)
- [Kiểm thử trực tiếp](/vi/help/testing-live)
- [Kiểm thử bản cập nhật và Plugin](/vi/help/testing-updates-plugins)
