---
read_when:
    - Bạn cần hiểu tại sao một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lượt chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi việc điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị tác vụ CI, các cổng kiểm tra phạm vi, các nhóm bao trùm phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-07T13:13:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần đẩy lên `main` và mọi pull request. Tác vụ `preflight` phân loại phần khác biệt và tắt các lane tốn kém khi chỉ các khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua việc giới hạn phạm vi thông minh và mở rộng toàn bộ đồ thị cho các ứng viên phát hành và xác thực diện rộng. Các lane Android vẫn là tùy chọn bật qua `include_android`. Mức bao phủ Plugin chỉ dành cho phát hành nằm trong workflow [`Plugin Prerelease`](#plugin-prerelease) riêng và chỉ chạy từ [`Full Release Validation`](#full-release-validation) hoặc một lần dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Tác vụ                           | Mục đích                                                                                                                   | Khi chạy                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ ở tài liệu, phạm vi đã thay đổi, extension đã thay đổi, và xây dựng CI manifest                     | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra workflow qua `zizmor`                                                                  | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `security-dependency-audit`      | Kiểm tra lockfile sản xuất không cần cài dependency dựa trên các khuyến cáo npm                                            | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `security-fast`                  | Tổng hợp bắt buộc cho các tác vụ bảo mật nhanh                                                                             | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `check-dependencies`             | Lượt kiểm dependency sản xuất bằng Knip và bộ bảo vệ danh sách cho phép tệp không dùng                                     | Thay đổi liên quan đến Node                   |
| `build-artifacts`                | Xây dựng `dist/`, Control UI, kiểm tra artifact đã build, và artifact hạ nguồn có thể tái sử dụng                          | Thay đổi liên quan đến Node                   |
| `checks-fast-core`               | Các lane kiểm tra tính đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                             | Thay đổi liên quan đến Node                   |
| `checks-fast-contracts-channels` | Kiểm tra hợp đồng kênh dạng shard với kết quả kiểm tra tổng hợp ổn định                                                    | Thay đổi liên quan đến Node                   |
| `checks-node-core-test`          | Các shard kiểm thử Node cốt lõi, loại trừ lane kênh, bundled, hợp đồng, và extension                                       | Thay đổi liên quan đến Node                   |
| `check`                          | Tương đương cổng kiểm cục bộ chính dạng shard: kiểu sản xuất, lint, bộ bảo vệ, kiểu kiểm thử, và smoke nghiêm ngặt         | Thay đổi liên quan đến Node                   |
| `check-additional`               | Kiến trúc, boundary/prompt drift dạng shard, bộ bảo vệ extension, boundary gói, và gateway watch                           | Thay đổi liên quan đến Node                   |
| `build-smoke`                    | Kiểm thử smoke cho CLI đã build và smoke bộ nhớ khởi động                                                                  | Thay đổi liên quan đến Node                   |
| `checks`                         | Bộ xác minh cho kiểm thử kênh trên artifact đã build                                                                       | Thay đổi liên quan đến Node                   |
| `checks-node-compat-node22`      | Lane build và smoke tương thích Node 22                                                                                    | Dispatch CI thủ công cho phát hành            |
| `check-docs`                     | Kiểm tra định dạng, lint, và liên kết hỏng của tài liệu                                                                     | Tài liệu thay đổi                             |
| `skills-python`                  | Ruff + pytest cho skills có hậu thuẫn Python                                                                               | Thay đổi liên quan đến skill Python           |
| `checks-windows`                 | Kiểm thử quy trình/đường dẫn đặc thù Windows cộng với hồi quy bộ chỉ định import runtime dùng chung                        | Thay đổi liên quan đến Windows                |
| `macos-node`                     | Lane kiểm thử TypeScript trên macOS dùng artifact đã build dùng chung                                                      | Thay đổi liên quan đến macOS                  |
| `macos-swift`                    | Lint, build, và kiểm thử Swift cho ứng dụng macOS                                                                          | Thay đổi liên quan đến macOS                  |
| `android`                        | Kiểm thử đơn vị Android cho cả hai flavor cộng với một bản build APK debug                                                 | Thay đổi liên quan đến Android                |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm hằng ngày bằng Codex sau hoạt động đáng tin cậy                                                   | CI trên main thành công hoặc dispatch thủ công |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile, và live GPT 5.4            | Theo lịch và dispatch thủ công                |

## Thứ tự dừng sớm khi lỗi

1. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong tác vụ này, không phải các tác vụ độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các tác vụ artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các lane Linux nhanh để các bên tiêu thụ hạ nguồn có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn mở rộng sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các tác vụ bị thay thế là `cancelled` khi một lần đẩy mới hơn xuất hiện trên cùng PR hoặc ref `main`. Hãy coi đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang lỗi. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` để vẫn báo cáo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa đồng thời CI tự động được đánh phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô hạn các lần chạy main mới hơn. Các lần chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang diễn ra.

Tác vụ `ci-timings-summary` tải lên artifact `ci-timings-summary` gọn cho mỗi lần chạy CI không phải bản nháp. Artifact này ghi lại thời gian thực, thời gian hàng đợi, các tác vụ chậm nhất, và các tác vụ thất bại của lần chạy hiện tại, để các kiểm tra sức khỏe CI không cần quét lại toàn bộ payload Actions nhiều lần.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và làm cho preflight manifest hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Các chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng bản thân chúng không bắt buộc build native Windows, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi mã nguồn nền tảng.
- **Các chỉnh sửa chỉ về định tuyến CI, các chỉnh sửa fixture core-test rẻ được chọn, và các chỉnh sửa helper/test-routing hợp đồng Plugin hẹp** dùng đường dẫn manifest nhanh chỉ cho Node: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường dẫn đó bỏ qua artifact build, tương thích Node 22, hợp đồng kênh, toàn bộ shard core, shard bundled-plugin, và các ma trận bộ bảo vệ bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp kiểm tra.
- **Các kiểm tra Node Windows** được giới hạn cho wrapper quy trình/đường dẫn đặc thù Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý gói, và các bề mặt workflow CI thực thi lane đó; các thay đổi mã nguồn, Plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn ở trên các lane Node Linux.

Các họ kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi tác vụ vẫn nhỏ mà không đặt trước runner quá mức: hợp đồng kênh chạy dưới dạng ba shard có trọng số được Blacksmith hậu thuẫn với runner GitHub tiêu chuẩn làm dự phòng, các lane core unit fast/support chạy riêng, hạ tầng runtime core được tách giữa các shard state, process/config, cron, và shared, auto-reply chạy dưới dạng các worker cân bằng (với cây con reply tách thành các shard agent-runner, dispatch, và commands/state-routing), và cấu hình gateway/server kiểu agentic được tách qua các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã build. Các kiểm thử trình duyệt diện rộng, QA, media, và Plugin linh tinh dùng cấu hình Vitest chuyên dụng thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi mục thời gian bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt cả một cấu hình với một shard đã lọc. `check-additional` giữ công việc biên dịch/canary package-boundary cùng nhau và tách kiến trúc topology runtime khỏi mức bao phủ gateway watch; danh sách bộ bảo vệ boundary được chia sọc qua bốn shard ma trận, mỗi shard chạy đồng thời các bộ bảo vệ độc lập được chọn và in thời gian theo từng kiểm tra. Kiểm tra drift snapshot prompt happy-path tốn kém của Codex chạy như một tác vụ bổ sung riêng cho CI thủ công và chỉ cho các thay đổi ảnh hưởng đến prompt, để các thay đổi Node không liên quan thông thường không phải chờ quá trình tạo snapshot prompt lạnh và các shard boundary vẫn cân bằng trong khi prompt drift vẫn được ghim vào PR đã gây ra nó; cùng cờ đó bỏ qua việc tạo Vitest snapshot prompt bên trong shard built-artifact core support-boundary. Gateway watch, kiểm thử kênh, và shard core support-boundary chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, rồi build APK debug Play. Flavor bên thứ ba không có source set hoặc manifest riêng; lane kiểm thử đơn vị của nó vẫn biên dịch flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh tác vụ đóng gói APK debug trùng lặp trên mọi lần đẩy liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt kiểm dependency sản xuất bằng Knip, được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, vốn so sánh các phát hiện tệp sản xuất không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Bộ bảo vệ tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được rà soát hoặc để lại một mục allowlist lỗi thời, đồng thời giữ lại các bề mặt Plugin động, generated, build, live-test, và package bridge có chủ đích mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động repository OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho các yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong comment issue;
- `clawsweeper_commit_review` cho các yêu cầu review ở cấp commit trên các lần đẩy lên `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, repository, số item, URL, tiêu đề, trạng thái, và các trích đoạn ngắn cho comment hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ webhook body. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng sự kiện đã chuẩn hóa lên hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải mặc định phân phối. Agent ClawSweeper nhận đích Discord trong prompt của nó và chỉ nên đăng lên `#clawsweeper` khi sự kiện gây bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về mặt vận hành. Các lượt mở, chỉnh sửa, churn bot, nhiễu webhook trùng lặp, và lưu lượng review bình thường nên cho kết quả `NO_REPLY`.

Treat tiêu đề, bình luận, nội dung, văn bản review, tên nhánh và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy trong toàn bộ đường dẫn này. Chúng là đầu vào cho việc tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime của agent.

## Kích hoạt thủ công

Các lần kích hoạt CI thủ công chạy cùng đồ thị công việc như CI bình thường nhưng buộc bật mọi lane có phạm vi không phải Android: các shard Linux Node, shard Plugin đóng gói, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Skills Python, Windows, macOS và i18n Control UI. Các lần kích hoạt CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Các kiểm tra tĩnh prerelease Plugin, shard chỉ dành cho phát hành `agentic-plugins`, sweep batch đầy đủ cho extension, và các lane Docker prerelease Plugin bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` kích hoạt workflow `Plugin Prerelease` riêng với cổng release-validation được bật.

Các lần chạy thủ công dùng một nhóm đồng thời duy nhất để bộ đầy đủ release-candidate không bị hủy bởi một lần chạy push hoặc PR khác trên cùng ref. Đầu vào tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ ref kích hoạt đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Trình chạy

| Trình chạy                       | Công việc                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các công việc bảo mật nhanh và aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), kiểm tra nhanh giao thức/hợp đồng/đóng gói, kiểm tra hợp đồng kênh theo shard, các shard `check` ngoại trừ lint, aggregate `check-additional`, trình xác minh aggregate kiểm thử Node, kiểm tra tài liệu, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub lưu trữ để ma trận Blacksmith có thể vào hàng đợi sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension tải nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Linux Node, shard kiểm thử Plugin đóng gói, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (nhạy CPU đến mức 8 vCPU tốn nhiều hơn phần tiết kiệm được); các build Docker install-smoke (thời gian chờ hàng đợi 32-vCPU tốn nhiều hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; các fork dùng fallback sang `macos-latest`                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; các fork dùng fallback sang `macos-latest`                                                                                                                                                                                                                                                                                                                                                                            |

CI của repo chuẩn giữ Blacksmith làm đường dẫn trình chạy mặc định. Trong `preflight`, `scripts/ci-runner-labels.mjs` kiểm tra các lần chạy Actions gần đây đang chờ và đang chạy để tìm các công việc Blacksmith đang chờ. Nếu một nhãn Blacksmith cụ thể đã có công việc đang chờ, các công việc downstream vốn sẽ dùng đúng nhãn đó sẽ fallback sang trình chạy do GitHub lưu trữ tương ứng (`ubuntu-24.04`, `windows-2025` hoặc `macos-latest`) chỉ cho lần chạy đó. Các kích thước Blacksmith khác trong cùng họ hệ điều hành vẫn ở trên nhãn chính của chúng. Nếu probe API thất bại, không áp dụng fallback nào.

## Tương đương cục bộ

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Hiệu năng OpenClaw

`OpenClaw Performance` là workflow hiệu năng sản phẩm/runtime. Nó chạy hằng ngày trên `main` và có thể được kích hoạt thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Kích hoạt thủ công thường benchmark ref workflow. Đặt `target_ref` để benchmark một tag phát hành hoặc nhánh khác với triển khai workflow hiện tại. Các đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được khóa theo ref đã kiểm thử, và mỗi `index.md` ghi lại ref/SHA đã kiểm thử, ref/SHA workflow, ref Kova, profile, chế độ xác thực lane, model, số lần lặp và bộ lọc kịch bản.

Workflow cài OCM từ một bản phát hành được ghim và Kova từ `openclaw/Kova` tại đầu vào `kova_ref` được ghim, rồi chạy ba lane:

- `mock-provider`: Các kịch bản chẩn đoán Kova trên runtime build cục bộ với xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: Profiling CPU/heap/trace cho các hotspot khởi động, Gateway và lượt agent.
- `live-gpt54`: Một lượt agent OpenAI `openai/gpt-5.4` thật, bị bỏ qua khi không có `OPENAI_API_KEY`.

Lane mock-provider cũng chạy các probe nguồn native của OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ trên các trường hợp khởi động mặc định, hook và 50 Plugin; các vòng hello `channel-chat-baseline` mock-OpenAI lặp lại; và các lệnh khởi động CLI trên Gateway đã khởi động. Tóm tắt Markdown của probe nguồn nằm tại `source/index.md` trong bundle báo cáo, kèm JSON thô bên cạnh.

Mọi lane đều tải artifact lên GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các bundle, `index.md` và artifact probe nguồn vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ tested-ref hiện tại được ghi thành `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực phát hành đầy đủ

`Full Release Validation` là workflow umbrella thủ công để "chạy mọi thứ trước khi phát hành." Nó nhận một nhánh, tag hoặc SHA commit đầy đủ, kích hoạt workflow `CI` thủ công với target đó, kích hoạt `Plugin Prerelease` cho bằng chứng Plugin/gói/tĩnh/Docker chỉ dành cho phát hành, và kích hoạt `OpenClaw Release Checks` cho smoke cài đặt, chấp nhận gói, kiểm tra gói đa hệ điều hành, tính tương đương QA Lab, Matrix và các lane Telegram. Các lần chạy stable/default giữ phạm vi phủ live/E2E toàn diện và đường dẫn phát hành Docker phía sau `run_release_soak=true`; `release_profile=full` buộc bật phạm vi soak đó để xác thực advisory rộng vẫn giữ độ phủ rộng. Với `rerun_group=all` và `release_profile=full`, nó cũng chạy `NPM Telegram Beta E2E` trên artifact `release-package-under-test` từ các kiểm tra phát hành. Sau khi xuất bản, truyền `npm_telegram_package_spec` để chạy lại cùng lane gói Telegram trên gói npm đã xuất bản.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn, tên công việc workflow chính xác, khác biệt giữa các profile, artifact và
các handle chạy lại có trọng tâm.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Kích hoạt nó
từ `release/YYYY.M.D` hoặc `main` sau khi tag phát hành tồn tại và sau khi
preflight npm OpenClaw đã thành công. Nó xác minh `pnpm plugins:sync:check`,
kích hoạt `Plugin NPM Release` cho tất cả gói Plugin có thể xuất bản, kích hoạt
`Plugin ClawHub Release` cho cùng SHA phát hành, và chỉ sau đó kích hoạt
`OpenClaw NPM Release` với `preflight_run_id` đã lưu.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Để chứng minh commit được ghim trên một nhánh thay đổi nhanh, hãy dùng helper thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Các ref dispatch workflow GitHub phải là nhánh hoặc thẻ, không phải SHA commit thô. Helper đẩy một nhánh tạm thời `release-ci/<sha>-...` tại SHA đích, dispatch `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con có `headSha` khớp với đích, và xóa nhánh tạm thời khi lượt chạy hoàn tất. Bộ xác minh umbrella cũng thất bại nếu bất kỳ workflow con nào chạy ở SHA khác.

`release_profile` kiểm soát phạm vi live/provider được truyền vào các kiểm tra phát hành. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn chủ ý muốn ma trận advisory provider/media rộng. `run_release_soak` kiểm soát việc các kiểm tra phát hành stable/mặc định có chạy soak live/E2E và đường dẫn phát hành Docker đầy đủ hay không; `full` bắt buộc bật soak.

- `minimum` giữ các lane OpenAI/core nhanh nhất nhưng trọng yếu cho phát hành.
- `stable` thêm tập provider/backend ổn định.
- `full` chạy ma trận advisory provider/media rộng.

Umbrella ghi lại các id lượt chạy con đã dispatch, và job cuối cùng `Verify full validation` kiểm tra lại kết luận hiện tại của các lượt chạy con rồi thêm các bảng job chậm nhất cho từng lượt chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại job xác minh cha để làm mới kết quả umbrella và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho workflow con full CI thông thường, `plugin-prerelease` chỉ cho workflow con phát hành trước plugin, `release-checks` cho mọi workflow con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên umbrella. Điều này giữ phạm vi chạy lại một box phát hành bị lỗi ở mức giới hạn sau một bản sửa tập trung. Với một lane cross-OS bị lỗi, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh cross-OS dài phát ra dòng heartbeat và tóm tắt packaged-upgrade bao gồm thời gian theo từng pha. Các lane kiểm tra phát hành QA là advisory, nên lỗi chỉ ở QA sẽ cảnh báo nhưng không chặn bộ xác minh release-check.

`OpenClaw Release Checks` dùng ref workflow tin cậy để resolve ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho các kiểm tra cross-OS và Package Acceptance, cùng workflow Docker đường dẫn phát hành live/E2E khi chạy coverage soak. Điều đó giữ cho byte của package nhất quán giữa các box phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều job con.

Các lượt chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
thay thế umbrella cũ hơn. Bộ giám sát cha hủy bất kỳ workflow con nào nó đã dispatch khi cha bị hủy, nên xác thực main mới hơn không phải chờ sau một lượt release-check cũ kéo dài hai giờ. Xác thực nhánh/thẻ phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Các shard live và E2E

Workflow con live/E2E phát hành giữ coverage `pnpm test:live` native rộng, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- các job `native-live-src-gateway-profiles` được lọc theo provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- các shard media audio/video được tách và các shard music được lọc theo provider

Điều đó giữ nguyên coverage tệp trong khi khiến lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ live dựa trên Docker trên runner Blacksmith thông thường — job container là nơi không phù hợp để khởi chạy các bài kiểm thử Docker lồng nhau.

Các shard model/backend live dựa trên Docker dùng một image chia sẻ riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit đã chọn. Workflow phát hành live build và đẩy image đó một lần, sau đó các shard Docker live model, Gateway theo provider, CLI backend, ACP bind, và Codex harness chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang các giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout job workflow, để container hoặc đường dọn dẹp bị kẹt thất bại nhanh thay vì tiêu thụ toàn bộ ngân sách release-check. Nếu các shard đó tự build lại toàn bộ Docker target nguồn một cách độc lập, lượt chạy phát hành đã bị cấu hình sai và sẽ lãng phí thời gian thực tế vào các lượt build image trùng lặp.

## Package Acceptance

Dùng `Package Acceptance` khi câu hỏi là "package OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác CI thông thường: CI thông thường xác thực cây nguồn, còn package acceptance xác thực một tarball duy nhất qua cùng Docker E2E harness mà người dùng dùng sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, resolve một ứng viên package, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256, và profile trong tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải xuống artifact đó, xác thực inventory tarball, chuẩn bị image Docker package-digest khi cần, và chạy các lane Docker đã chọn với package đó thay vì đóng gói checkout workflow. Khi một profile chọn nhiều `docker_lanes` mục tiêu, workflow tái sử dụng chuẩn bị package và image chia sẻ một lần, rồi fan out các lane đó thành các job Docker mục tiêu song song với artifact duy nhất.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã resolve một artifact; dispatch Telegram độc lập vẫn có thể cài một spec npm đã xuất bản.
4. `summary` làm workflow thất bại nếu bước resolve package, Docker acceptance, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng tùy chọn này cho acceptance bản phát hành trước/stable đã xuất bản.
- `source=ref` đóng gói một nhánh, thẻ, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy. Resolver fetch các nhánh/thẻ OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử nhánh repository hoặc một thẻ phát hành, cài đặt dependency trong một worktree tách rời, và đóng gói nó bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness tin cậy chạy bài kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng coverage plugin offline để xác thực package đã xuất bản không bị phụ thuộc vào tính sẵn sàng live của ClawHub. Lane Telegram tùy chọn dùng lại artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn spec npm đã xuất bản được giữ cho các dispatch độc lập.

Để xem chính sách kiểm thử cập nhật và plugin chuyên biệt, bao gồm lệnh cục bộ, lane Docker, input Package Acceptance, mặc định phát hành, và phân loại lỗi, hãy xem [Kiểm thử cập nhật và plugin](/vi/help/testing-updates-plugins).

Release checks gọi Package Acceptance với `source=artifact`, artifact package phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng di trú package, cập nhật, dọn dẹp dependency plugin cũ, sửa cài đặt plugin đã cấu hình, plugin offline, cập nhật plugin, và Telegram trên cùng tarball package đã resolve. Đặt `package_acceptance_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks để chạy cùng ma trận đó với một package npm đã phát hành thay vì artifact được build từ SHA. Các kiểm tra phát hành cross-OS vẫn bao phủ onboarding, trình cài đặt, và hành vi nền tảng đặc thù OS; xác thực sản phẩm package/cập nhật nên bắt đầu với Package Acceptance. Lane Docker `published-upgrade-survivor` xác thực một baseline package đã xuất bản cho mỗi lượt chạy trong đường dẫn phát hành chặn. Trong Package Acceptance, tarball `package-under-test` đã resolve luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã xuất bản dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane lỗi giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng trên bốn bản phát hành npm stable mới nhất cộng với các bản phát hành ranh giới tương thích plugin đã ghim và fixture theo dạng issue cho cấu hình Feishu, các tệp bootstrap/persona được giữ lại, cài đặt plugin OpenClaw đã cấu hình, đường dẫn log dấu ngã, và root dependency plugin legacy cũ. Các lựa chọn published-upgrade survivor nhiều baseline được shard theo baseline thành các job runner Docker mục tiêu riêng biệt. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã xuất bản toàn diện, không phải phạm vi Full Release CI thông thường. Các lượt chạy tổng hợp cục bộ có thể truyền spec package chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã xuất bản cấu hình baseline bằng công thức lệnh `openclaw config set` được nướng sẵn, ghi lại các bước công thức trong `summary.json`, và probe `/healthz`, `/readyz`, cùng trạng thái RPC sau khi Gateway khởi động. Các lane packaged và installer fresh trên Windows cũng xác minh rằng một package đã cài đặt có thể import override browser-control từ một đường dẫn Windows tuyệt đối thô. Smoke agent-turn cross-OS OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì `openai/gpt-5.4`, để bằng chứng cài đặt và Gateway vẫn dùng model kiểm thử GPT-5 trong khi tránh các mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Package Acceptance có các khoảng thời gian tương thích với phiên bản cũ có giới hạn cho những gói đã được phát hành. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể sử dụng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các tệp bị bỏ qua khỏi tarball;
- `doctor-switch` có thể bỏ qua trường hợp con duy trì `gateway install --wrapper` khi gói không cung cấp cờ đó;
- `update-channel-switch` có thể lược bỏ `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả lập được suy ra từ tarball và có thể ghi log `update.channel` đã duy trì bị thiếu;
- các kiểm thử khói Plugin có thể đọc vị trí bản ghi cài đặt cũ hoặc chấp nhận việc thiếu duy trì bản ghi cài đặt marketplace;
- `plugin-update` có thể cho phép di chuyển siêu dữ liệu cấu hình trong khi vẫn yêu cầu bản ghi cài đặt và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu thời gian siêu dữ liệu bản dựng cục bộ đã được phát hành trước đó. Các gói về sau phải đáp ứng các hợp đồng hiện đại; các điều kiện tương tự sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

### Ví dụ

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Khi gỡ lỗi một lượt chạy chấp nhận gói thất bại, hãy bắt đầu từ phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lượt chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời gian từng pha và lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói bị lỗi hoặc các lane Docker chính xác thay vì chạy lại toàn bộ xác thực phát hành.

## Kiểm thử khói cài đặt

Workflow `Install Smoke` riêng biệt tái sử dụng cùng script phạm vi thông qua job `preflight` riêng. Nó chia phạm vi kiểm thử khói thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho các pull request chạm đến bề mặt Docker/gói, thay đổi gói/manifest Plugin được đóng gói sẵn, hoặc các bề mặt Plugin/kênh/Gateway/Plugin SDK lõi mà các job kiểm thử khói Docker thực thi. Các thay đổi chỉ ở nguồn của Plugin được đóng gói sẵn, chỉnh sửa chỉ dành cho kiểm thử và chỉnh sửa chỉ dành cho tài liệu không giữ trước worker Docker. Đường dẫn nhanh xây dựng image Dockerfile gốc một lần, kiểm tra CLI, chạy kiểm thử khói CLI xóa agents trong workspace dùng chung, chạy e2e gateway-network trong container, xác minh một build arg cho extension được đóng gói sẵn và chạy hồ sơ Docker Plugin được đóng gói sẵn có giới hạn trong thời gian chờ lệnh tổng hợp 240 giây (mỗi lượt chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ phạm vi cài đặt gói QR và cài đặt/cập nhật Docker cho các lượt chạy định kỳ hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call và các pull request thật sự chạm đến bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image kiểm thử khói Dockerfile gốc GHCR theo SHA đích, rồi chạy cài đặt gói QR, kiểm thử khói Dockerfile gốc/Gateway, kiểm thử khói trình cài đặt/cập nhật và E2E Docker Plugin được đóng gói sẵn nhanh dưới dạng các job riêng biệt để công việc trình cài đặt không phải chờ sau các kiểm thử khói image gốc.

Các push lên `main` (bao gồm merge commit) không ép buộc đường dẫn đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một push, workflow giữ kiểm thử khói Docker nhanh và để kiểm thử khói cài đặt đầy đủ cho hằng đêm hoặc xác thực phát hành.

Kiểm thử khói image-provider cài đặt Bun toàn cục chậm được kiểm soát riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn bật nó, nhưng pull request và push lên `main` thì không. Các kiểm thử Docker QR và trình cài đặt giữ các Dockerfile tập trung vào cài đặt riêng của chúng.

## E2E Docker cục bộ

`pnpm test:docker:all` dựng trước một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm và xây dựng hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane trình cài đặt/cập nhật/phụ thuộc Plugin;
- một image chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng bình thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn image cho mỗi lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số điều chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot pool chính cho các lane bình thường.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot pool đuôi nhạy với nhà cung cấp.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để nhà cung cấp không throttle.                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều dịch vụ đồng thời.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ trễ so le giữa các lần bắt đầu lane để tránh bão tạo Docker daemon; đặt `0` để không so le. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Thời gian chờ dự phòng cho mỗi lane (120 phút); các lane live/đuôi được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` in kế hoạch bộ lập lịch mà không chạy lane.                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua kiểm thử khói dọn dẹp để agents có thể tái hiện một lane thất bại. |

Một lane nặng hơn giới hạn hiệu lực của nó vẫn có thể bắt đầu từ một pool trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Các preflight tổng hợp cục bộ kiểm tra Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, duy trì thời gian lane để sắp xếp dài nhất trước và mặc định dừng lập lịch các lane mới trong pool sau lỗi đầu tiên.

### Workflow live/E2E có thể tái sử dụng

Workflow live/E2E có thể tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` xem cần gói, loại image, image live, lane và phạm vi thông tin xác thực nào. Sau đó `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lượt chạy hiện tại hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; xây dựng và đẩy image Docker E2E bare/functional GHCR được gắn thẻ theo digest gói thông qua cache lớp Docker của Blacksmith khi kế hoạch cần các lane có cài gói; và tái sử dụng các input `docker_e2e_bare_image`/`docker_e2e_functional_image` đã cung cấp hoặc các image theo digest gói hiện có thay vì xây dựng lại. Các lần kéo image Docker được thử lại với thời gian chờ có giới hạn 180 giây cho mỗi lần thử, để một luồng registry/cache bị kẹt sẽ thử lại nhanh thay vì tiêu tốn phần lớn đường tới hạn CI.

### Các phần của đường dẫn phát hành

Phạm vi Docker phát hành chạy các job được chia nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phần chỉ kéo loại image cần thiết và thực thi nhiều lane thông qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các phần Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` và `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` và `plugins-integrations` vẫn là các bí danh tổng hợp Plugin/runtime. Bí danh lane `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt nhà cung cấp.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ một phần `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật kênh được đóng gói sẵn thử lại một lần khi có lỗi mạng npm tạm thời.

Mỗi phần tải lên `.artifacts/docker-tests/` với log lane, thời gian, `summary.json`, `failures.json`, thời gian từng pha, JSON kế hoạch bộ lập lịch, bảng lane chậm và lệnh chạy lại cho từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn trên các image đã chuẩn bị thay vì các job theo phần, giúp việc gỡ lỗi lane thất bại được giới hạn trong một job Docker có mục tiêu và chuẩn bị, tải xuống hoặc tái sử dụng artifact gói cho lượt chạy đó; nếu một lane được chọn là lane Docker live, job có mục tiêu xây dựng image live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo cho từng lane bao gồm `package_artifact_run_id`, `package_artifact_name` và input image đã chuẩn bị khi những giá trị đó tồn tại, để một lane thất bại có thể tái sử dụng đúng gói và image từ lượt chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy toàn bộ bộ kiểm thử Docker release-path hằng ngày.

## Phát hành trước Plugin

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request bình thường, push lên `main` và dispatch CI thủ công độc lập giữ cho bộ kiểm thử đó không chạy. Nó cân bằng các kiểm thử Plugin được đóng gói sẵn trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch Plugin nặng về import không tạo thêm job CI. Đường dẫn phát hành trước Docker chỉ dành cho phát hành gom các lane Docker có mục tiêu thành các nhóm nhỏ để tránh giữ trước hàng chục runner cho các job kéo dài một đến ba phút.

## QA Lab

QA Lab có các lane CI chuyên dụng bên ngoài workflow chính theo phạm vi thông minh. Tính tương đương agentic được lồng dưới các harness QA và phát hành rộng, không phải một workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi tính tương đương nên đi cùng một lượt xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó fan out lane tương đương mock, lane Matrix live và các lane Telegram và Discord live dưới dạng các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các kiểm tra phát hành chạy các lane truyền tải trực tiếp Matrix và Telegram với provider mô phỏng xác định và các mô hình đủ điều kiện mô phỏng (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để contract của kênh được tách biệt khỏi độ trễ mô hình trực tiếp và quá trình khởi động provider-Plugin thông thường. Gateway truyền tải trực tiếp tắt tìm kiếm bộ nhớ vì tính tương đương QA bao phủ riêng hành vi bộ nhớ; kết nối provider được bao phủ bởi các bộ kiểm thử riêng cho mô hình trực tiếp, provider gốc và provider Docker.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và đầu vào workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn chia nhỏ phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; cổng tương đương QA của nó chạy các gói ứng viên và baseline dưới dạng các job lane song song, sau đó tải cả hai artifact vào một job báo cáo nhỏ để so sánh tương đương cuối cùng.

Đối với các PR thông thường, hãy theo bằng chứng CI/kiểm tra theo phạm vi thay vì xem tính tương đương là một trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` được chủ ý thiết kế là một trình quét bảo mật bước đầu có phạm vi hẹp, không phải lượt quét toàn bộ kho lưu trữ. Các lượt chạy bảo vệ hằng ngày, thủ công và pull request không phải bản nháp quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript có rủi ro cao nhất bằng các truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Bảo vệ pull request vẫn nhẹ: nó chỉ bắt đầu với các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. CodeQL cho Android và macOS không nằm trong mặc định của PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron, và baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Các contract triển khai kênh lõi cùng runtime Plugin kênh, gateway, Plugin SDK, secrets, các điểm chạm audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt chính sách SSRF lõi, phân tích IP, bảo vệ mạng, web-fetch, và SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, helper thực thi tiến trình, phân phối outbound, và các cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy cho cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, source-loading, và contract package của Plugin SDK |

### Các phân đoạn bảo mật theo nền tảng

- `CodeQL Android Critical Security` — phân đoạn bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — phân đoạn bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build dependency khỏi SARIF được tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn thời gian chạy ngay cả khi sạch.

### Danh mục Critical Quality

`CodeQL Critical Quality` là phân đoạn không bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không bảo mật, mức nghiêm trọng lỗi, trên các bề mặt hẹp có giá trị cao trên runner Blacksmith Linux nhỏ hơn. Bảo vệ pull request của nó được chủ ý nhỏ hơn hồ sơ theo lịch: các PR không phải bản nháp chỉ chạy các phân đoạn tương ứng `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` cho mã thực thi lệnh/mô hình/công cụ của agent và điều phối trả lời, mã schema/migration/IO của config, mã auth/secrets/sandbox/security, kênh lõi và runtime Plugin kênh đi kèm, gateway protocol/server-method, runtime bộ nhớ/keo nối SDK, MCP/process/phân phối outbound, runtime provider/danh mục mô hình, chẩn đoán phiên/hàng đợi phân phối, Plugin loader, Plugin SDK/contract-package, hoặc thay đổi runtime trả lời Plugin SDK. Các thay đổi config CodeQL và workflow chất lượng chạy toàn bộ mười hai phân đoạn chất lượng PR.

Dispatch thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là hook hướng dẫn/lặp lại để chạy riêng một phân đoạn chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật auth, secrets, sandbox, cron, và gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Schema config, migration, normalization, và contract IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và contract phương thức server                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contract triển khai kênh lõi và Plugin kênh đi kèm                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, điều phối mô hình/provider, điều phối và hàng đợi auto-reply, và contract runtime mặt phẳng điều khiển ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers và cầu nối công cụ, helper giám sát tiến trình, và contract phân phối outbound                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, keo nối kích hoạt runtime bộ nhớ, và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, helper binding/phân phối phiên outbound, bề mặt event/log bundle chẩn đoán, và contract CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời inbound của Plugin SDK, helper payload/chunking/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối, và helper binding phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, auth và discovery provider, đăng ký runtime provider, mặc định/danh mục provider, và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lưu trữ cục bộ, luồng điều khiển gateway, và contract runtime mặt phẳng điều khiển task                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web lõi, IO media, hiểu media, image-generation, và contract runtime media-generation                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contract loader, registry, bề mặt công khai, và entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía package đã xuất bản và helper contract package Plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, tắt, hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python, và Plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp nối có phạm vi hoặc phân đoạn sau khi các hồ sơ hẹp có thời gian chạy và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một lane bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi mới được land. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và dispatch thủ công có thể chạy trực tiếp. Các lần gọi workflow-run bị bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ qua. Khi chạy, nó xem xét phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, để một lượt chạy hằng giờ có thể bao phủ toàn bộ thay đổi trên main tích lũy từ lượt tài liệu trước.

### Test Performance Agent

Workflow `Test Performance Agent` là một lane bảo trì Codex theo sự kiện cho các kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày đó. Lane này build báo cáo hiệu năng Vitest được nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ phạm vi bao phủ thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng baseline kiểm thử đang pass. Nếu baseline có kiểm thử lỗi, Codex chỉ có thể sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau agent phải pass trước khi có bất cứ thứ gì được commit. Khi `main` tiến lên trước khi bot push được land, lane rebase bản vá đã xác thực, chạy lại `pnpm check:changed`, và thử lại push; các bản vá cũ xung đột bị bỏ qua. Nó dùng Ubuntu do GitHub host để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` là workflow maintainer thủ công để dọn dẹp duplicate sau khi land. Nó mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi duplicate có issue được tham chiếu chung hoặc các hunk thay đổi chồng lấp.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- các thay đổi mã sản xuất lõi chạy kiểm tra kiểu mã sản xuất lõi và kiểm tra kiểu kiểm thử lõi, cộng với lint/bộ bảo vệ lõi;
- các thay đổi chỉ dành cho kiểm thử lõi chỉ chạy kiểm tra kiểu kiểm thử lõi, cộng với lint lõi;
- các thay đổi mã sản xuất của phần mở rộng chạy kiểm tra kiểu mã sản xuất phần mở rộng và kiểm tra kiểu kiểm thử phần mở rộng, cộng với lint phần mở rộng;
- các thay đổi chỉ dành cho kiểm thử phần mở rộng chạy kiểm tra kiểu kiểm thử phần mở rộng, cộng với lint phần mở rộng;
- các thay đổi Plugin SDK công khai hoặc hợp đồng plugin mở rộng sang kiểm tra kiểu phần mở rộng vì các phần mở rộng phụ thuộc vào những hợp đồng lõi đó (các lượt quét phần mở rộng Vitest vẫn là công việc kiểm thử tường minh);
- các lần tăng phiên bản chỉ cho siêu dữ liệu phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- các thay đổi gốc/cấu hình không xác định sẽ an toàn mặc định sang tất cả các làn kiểm tra.

Định tuyến kiểm thử đã thay đổi cục bộ nằm trong `scripts/test-projects.test-support.mjs` và được cố ý làm nhẹ hơn `check:changed`: các chỉnh sửa kiểm thử trực tiếp tự chạy chính chúng, chỉnh sửa nguồn ưu tiên ánh xạ tường minh, rồi đến các kiểm thử cùng cấp và phần phụ thuộc trong đồ thị import. Cấu hình gửi phòng nhóm dùng chung là một trong các ánh xạ tường minh: các thay đổi đối với cấu hình trả lời hiển thị trong nhóm, chế độ gửi trả lời nguồn, hoặc prompt hệ thống của công cụ tin nhắn sẽ định tuyến qua các kiểm thử trả lời lõi cùng với các hồi quy gửi Discord và Slack, để thay đổi mặc định dùng chung thất bại trước lần đẩy PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập ánh xạ rẻ không còn là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ gốc repo và ưu tiên một hộp mới đã được làm nóng cho bằng chứng diện rộng. Trước khi dùng một cổng chậm trên hộp đã được tái sử dụng, hết hạn, hoặc vừa báo một lần đồng bộ lớn bất thường, hãy chạy `pnpm testbox:sanity` bên trong hộp trước.

Kiểm tra sanity thất bại nhanh khi các tệp gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 tệp đã theo dõi bị xóa. Điều đó thường có nghĩa trạng thái đồng bộ từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng hộp đó và làm nóng một hộp mới thay vì gỡ lỗi thất bại kiểm thử sản phẩm. Với các PR cố ý xóa số lượng lớn, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng chấm dứt một lệnh gọi Blacksmith CLI cục bộ nếu nó ở trong pha đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt bộ bảo vệ đó, hoặc dùng giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là wrapper hộp từ xa do repo sở hữu cho bằng chứng Linux của maintainer. Dùng nó khi một kiểm tra quá rộng cho vòng lặp chỉnh sửa cục bộ, khi tính tương đương CI quan trọng, hoặc khi bằng chứng cần bí mật, Docker, các làn gói, hộp tái sử dụng, hoặc log từ xa. Backend OpenClaw thông thường là `blacksmith-testbox`; dung lượng AWS/Hetzner sở hữu là phương án dự phòng cho sự cố Blacksmith, vấn đề hạn mức, hoặc kiểm thử dung lượng sở hữu tường minh.

Trước lần chạy đầu tiên, kiểm tra wrapper từ gốc repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo từ chối một binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider tường minh dù `.crabbox.yaml` có các mặc định đám mây sở hữu.

Cổng đã thay đổi:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Chạy lại kiểm thử tập trung:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Bộ đầy đủ:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Đọc tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Các lần chạy Crabbox một lần được Blacksmith hỗ trợ nên tự động dừng Testbox; nếu một lần chạy bị ngắt hoặc việc dọn dẹp không rõ ràng, kiểm tra các hộp đang hoạt động và chỉ dừng các hộp bạn đã tạo:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Chỉ dùng tái sử dụng khi bạn cố ý cần nhiều lệnh trên cùng một hộp đã hydrate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Nếu Crabbox là lớp bị hỏng nhưng bản thân Blacksmith hoạt động, dùng Blacksmith trực tiếp làm phương án dự phòng hẹp:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các lần
warmup mới nằm ở trạng thái `queued` mà không có IP hoặc URL lần chạy Actions sau vài phút,
hãy xem đó là áp lực từ provider Blacksmith, hàng đợi, thanh toán, hoặc giới hạn tổ chức. Dừng các
id đang xếp hàng mà bạn đã tạo, tránh khởi động thêm Testbox, và chuyển bằng chứng sang
đường dẫn dung lượng Crabbox sở hữu bên dưới trong khi có người kiểm tra bảng điều khiển Blacksmith,
thanh toán, và giới hạn tổ chức.

Chỉ nâng cấp sang dung lượng Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn hạn mức, thiếu môi trường cần thiết, hoặc dung lượng sở hữu là mục tiêu tường minh:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thật sự cần CPU cấp 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để chạm hạn mức EC2 Spot hoặc On-Demand Standard theo khu vực. `.crabbox.yaml` do repo sở hữu mặc định dùng `standard`, nhiều khu vực dung lượng, và `capacity.hints: true` để các lease AWS qua broker in ra khu vực/thị trường đã chọn, áp lực hạn mức, phương án dự phòng Spot, và cảnh báo lớp áp lực cao. Dùng `fast` cho các kiểm tra diện rộng nặng hơn, `large` chỉ sau khi standard/fast không đủ, và `beast` chỉ cho các làn đặc biệt bị ràng buộc CPU như bộ đầy đủ hoặc ma trận Docker toàn plugin, xác thực phát hành/chặn tường minh, hoặc phân tích hiệu năng nhiều lõi. Không dùng `beast` cho `pnpm check:changed`, kiểm thử tập trung, công việc chỉ tài liệu, lint/kiểm tra kiểu thông thường, tái hiện E2E nhỏ, hoặc phân loại sự cố Blacksmith. Dùng `--market on-demand` để chẩn đoán dung lượng để biến động thị trường Spot không bị trộn vào tín hiệu.

`.crabbox.yaml` sở hữu các mặc định provider, đồng bộ, và hydrate GitHub Actions cho các làn đám mây sở hữu. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ siêu dữ liệu Git từ xa riêng của nó thay vì đồng bộ remote và kho đối tượng cục bộ của maintainer, đồng thời loại trừ các artifact runtime/build cục bộ không bao giờ được chuyển. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không bí mật cho các lệnh đám mây sở hữu `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
