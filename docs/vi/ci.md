---
read_when:
    - Bạn cần hiểu vì sao một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions đang thất bại
    - Bạn đang điều phối một lần chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi cơ chế điều phối ClawSweeper hoặc việc chuyển tiếp hoạt động GitHub
summary: Đồ thị công việc CI, cổng phạm vi, nhóm phát hành bao quát và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-06T09:04:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần đẩy lên `main` và mọi pull request. Job `preflight` phân loại diff và tắt các lane tốn kém khi chỉ có những khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và bung toàn bộ đồ thị để kiểm tra ứng viên phát hành và xác thực diện rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong workflow [`Plugin Prerelease`](#plugin-prerelease) riêng biệt và chỉ chạy từ [`Full Release Validation`](#full-release-validation) hoặc một lần dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                              | Mục đích                                                                                                   | Khi chạy                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ liên quan đến tài liệu, phạm vi đã thay đổi, phần mở rộng đã thay đổi, và xây dựng manifest CI                   | Luôn chạy trên các lần đẩy không phải draft và PR |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra workflow qua `zizmor`                                                     | Luôn chạy trên các lần đẩy không phải draft và PR |
| `security-dependency-audit`      | Kiểm tra lockfile production không cần phụ thuộc so với các cảnh báo npm                                          | Luôn chạy trên các lần đẩy không phải draft và PR |
| `security-fast`                  | Tổng hợp bắt buộc cho các job bảo mật nhanh                                                             | Luôn chạy trên các lần đẩy không phải draft và PR |
| `check-dependencies`             | Lượt kiểm tra Knip chỉ phụ thuộc production cùng guard danh sách cho phép tệp không dùng                                 | Thay đổi liên quan đến Node              |
| `build-artifacts`                | Xây dựng `dist/`, Control UI, kiểm tra artifact đã build, và artifact downstream tái sử dụng                       | Thay đổi liên quan đến Node              |
| `checks-fast-core`               | Các lane đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                              | Thay đổi liên quan đến Node              |
| `checks-fast-contracts-channels` | Kiểm tra contract kênh theo shard với kết quả kiểm tra tổng hợp ổn định                                      | Thay đổi liên quan đến Node              |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ các lane kênh, bundled, contract, và phần mở rộng                          | Thay đổi liên quan đến Node              |
| `check`                          | Tương đương gate cục bộ chính theo shard: kiểu production, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt                | Thay đổi liên quan đến Node              |
| `check-additional`               | Kiến trúc, drift boundary/prompt theo shard, guard phần mở rộng, boundary gói, và gateway watch        | Thay đổi liên quan đến Node              |
| `build-smoke`                    | Kiểm thử smoke CLI đã build và smoke bộ nhớ khi khởi động                                                            | Thay đổi liên quan đến Node              |
| `checks`                         | Bộ xác minh cho kiểm thử kênh artifact đã build                                                                 | Thay đổi liên quan đến Node              |
| `checks-node-compat-node22`      | Lane build và smoke tương thích Node 22                                                                | Dispatch CI thủ công cho phát hành    |
| `check-docs`                     | Kiểm tra định dạng tài liệu, lint, và liên kết hỏng                                                             | Tài liệu thay đổi                       |
| `skills-python`                  | Ruff + pytest cho skills được hỗ trợ bằng Python                                                                    | Thay đổi liên quan đến Python-skill      |
| `checks-windows`                 | Kiểm thử process/path riêng cho Windows cùng hồi quy specifier import runtime dùng chung                      | Thay đổi liên quan đến Windows           |
| `macos-node`                     | Lane kiểm thử TypeScript trên macOS dùng artifact đã build dùng chung                                               | Thay đổi liên quan đến macOS             |
| `macos-swift`                    | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                            | Thay đổi liên quan đến macOS             |
| `android`                        | Kiểm thử unit Android cho cả hai flavor cùng một bản build debug APK                                              | Thay đổi liên quan đến Android           |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm hằng ngày của Codex sau hoạt động đáng tin cậy                                                 | CI chính thành công hoặc dispatch thủ công |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile, và GPT 5.4 live | Theo lịch và dispatch thủ công      |

## Thứ tự fail-fast

1. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job ma trận artifact và nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các lane Linux nhanh để các consumer downstream có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn bung ra sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một lần đẩy mới hơn được đưa lên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` để vẫn báo cáo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa concurrency CI tự động có phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang tiến hành.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bằng kiểm thử unit trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và làm manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cùng linting workflow, nhưng tự chúng không ép buộc các bản build native Windows, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, một số chỉnh sửa fixture core-test giá rẻ được chọn, và chỉnh sửa helper/test-routing contract Plugin hẹp** dùng một đường manifest nhanh chỉ Node: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường này bỏ qua artifact build, tương thích Node 22, contract kênh, toàn bộ shard lõi, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp kiểm tra.
- **Kiểm tra Node trên Windows** được giới hạn ở các wrapper process/path riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý gói, và các bề mặt workflow CI thực thi lane đó; thay đổi nguồn, Plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn ở các lane Node trên Linux.

Các họ kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không giữ runner quá mức: contract kênh chạy thành ba shard có trọng số, các lane core unit fast/support chạy riêng, hạ tầng runtime lõi được tách giữa các shard state và process/config, auto-reply chạy dưới dạng worker cân bằng (với subtree reply được tách thành các shard agent-runner, dispatch, và commands/state-routing), và cấu hình agentic gateway/server được tách qua các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã build. Các kiểm thử trình duyệt, QA, media, và Plugin linh tinh diện rộng dùng cấu hình Vitest chuyên dụng thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi mục thời gian bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt một cấu hình toàn phần với một shard đã lọc. `check-additional` giữ công việc biên dịch/canary package-boundary cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; danh sách guard boundary được chia vạch qua bốn shard ma trận, mỗi shard chạy đồng thời các guard độc lập đã chọn và in thời gian từng kiểm tra, bao gồm `pnpm prompt:snapshots:check` để drift prompt happy-path runtime Codex được ghim vào PR đã gây ra nó. Gateway watch, kiểm thử kênh, và shard core support-boundary chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi build Play debug APK. Flavor third-party không có source set hoặc manifest riêng; lane unit-test của nó vẫn biên dịch flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh một job đóng gói debug APK trùng lặp trên mỗi lần đẩy liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt kiểm tra Knip chỉ phụ thuộc production được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh các phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được rà soát hoặc để lại mục allowlist cũ, đồng thời giữ lại các bề mặt Plugin động, đã sinh, build, live-test, và cầu nối gói có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động repository OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho các yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho các yêu cầu review cấp commit trên các lần đẩy `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, repository, số mục, URL, tiêu đề, trạng thái, và đoạn trích ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ thân Webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng sự kiện đã chuẩn hóa lên hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải giao mặc định. Agent ClawSweeper nhận đích Discord trong prompt của nó và chỉ nên đăng lên `#clawsweeper` khi sự kiện gây bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về vận hành. Các lần mở, chỉnh sửa, nhiễu bot, nhiễu Webhook trùng lặp, và lưu lượng review bình thường nên trả về `NO_REPLY`.

Xem tiêu đề, bình luận, thân nội dung, văn bản review, tên nhánh, và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy trong toàn bộ đường này. Chúng là đầu vào cho tóm tắt và triage, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Dispatch thủ công

Các lần điều phối CI thủ công chạy cùng đồ thị job như CI thông thường nhưng buộc bật mọi lane có phạm vi không phải Android: các shard Linux Node, shard plugin đi kèm, hợp đồng kênh, tương thích Node 22, `check`, `check-additional`, build smoke, kiểm tra tài liệu, Python skills, Windows, macOS và Control UI i18n. Các lần điều phối CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh prerelease của Plugin, shard chỉ dành cho phát hành `agentic-plugins`, lượt quét batch extension đầy đủ và các lane Docker prerelease của plugin bị loại khỏi CI. Bộ prerelease Docker chỉ chạy khi `Full Release Validation` điều phối workflow `Plugin Prerelease` riêng với gate release-validation được bật.

Các lần chạy thủ công dùng một nhóm đồng thời duy nhất để bộ đầy đủ release-candidate không bị hủy bởi một lần chạy push hoặc PR khác trên cùng ref. Đầu vào tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag hoặc commit SHA đầy đủ trong khi dùng tệp workflow từ dispatch ref đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Trình chạy

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, các job bảo mật nhanh và job tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), kiểm tra nhanh protocol/contract/bundled, kiểm tra hợp đồng kênh theo shard, các shard `check` trừ lint, các job tổng hợp `check-additional`, trình xác minh tổng hợp kiểm thử Node, kiểm tra tài liệu, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub lưu trữ để ma trận Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Linux Node, các shard kiểm thử plugin đi kèm, các shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (đủ nhạy với CPU đến mức 8 vCPU tốn kém hơn phần tiết kiệm được); các bản dựng Docker install-smoke (thời gian xếp hàng 32-vCPU tốn kém hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; fork quay về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; fork quay về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

## Lệnh tương đương cục bộ

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

`OpenClaw Performance` là workflow hiệu năng sản phẩm/runtime. Workflow này chạy hằng ngày trên `main` và có thể được điều phối thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Điều phối thủ công thường benchmark workflow ref. Đặt `target_ref` để benchmark một tag phát hành hoặc nhánh khác bằng triển khai workflow hiện tại. Các đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được khóa theo ref được kiểm thử, và mỗi `index.md` ghi lại ref/SHA được kiểm thử, workflow ref/SHA, Kova ref, profile, chế độ xác thực lane, mô hình, số lần lặp và bộ lọc kịch bản.

Workflow cài đặt OCM từ một bản phát hành được ghim và Kova từ `openclaw/Kova` tại đầu vào `kova_ref` được ghim, rồi chạy ba lane:

- `mock-provider`: các kịch bản chẩn đoán Kova trên runtime bản dựng cục bộ với xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: lập hồ sơ CPU/heap/trace cho các điểm nóng khi khởi động, gateway và agent-turn.
- `live-gpt54`: một lượt agent OpenAI `openai/gpt-5.4` thật, được bỏ qua khi `OPENAI_API_KEY` không khả dụng.

Lane mock-provider cũng chạy các probe nguồn gốc OpenClaw-native sau lượt Kova: thời gian boot gateway và bộ nhớ trên các trường hợp khởi động mặc định, hook và 50-plugin; các vòng lặp hello `channel-chat-baseline` mock-OpenAI lặp lại; và các lệnh khởi động CLI chạy với gateway đã boot. Bản tóm tắt Markdown của source probe nằm tại `source/index.md` trong gói báo cáo, với JSON thô đặt bên cạnh.

Mọi lane đều tải lên GitHub artifacts. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các bundle, `index.md` và artifact source-probe vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ tested-ref hiện tại được ghi dưới dạng `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực bản phát hành đầy đủ

`Full Release Validation` là workflow umbrella thủ công cho "chạy mọi thứ trước khi phát hành". Workflow này nhận một nhánh, tag hoặc commit SHA đầy đủ, điều phối workflow `CI` thủ công với target đó, điều phối `Plugin Prerelease` để lấy bằng chứng plugin/package/static/Docker chỉ dành cho phát hành, và điều phối `OpenClaw Release Checks` cho install smoke, package acceptance, kiểm tra package đa hệ điều hành, QA Lab parity, Matrix và các lane Telegram. Các lần chạy ổn định/mặc định giữ phạm vi phủ sóng live/E2E đầy đủ và đường phát hành Docker sau `run_release_soak=true`; `release_profile=full` buộc bật phạm vi soak đó để xác thực tư vấn diện rộng vẫn rộng. Với `rerun_group=all` và `release_profile=full`, workflow cũng chạy `NPM Telegram Beta E2E` trên artifact `release-package-under-test` từ release checks. Sau khi xuất bản, truyền `npm_telegram_package_spec` để chạy lại cùng lane package Telegram trên package npm đã xuất bản.

Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết ma trận stage, tên job workflow chính xác, khác biệt giữa các profile, artifact và handle chạy lại tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Điều phối workflow này từ `release/YYYY.M.D` hoặc `main` sau khi tag phát hành tồn tại và sau khi preflight npm OpenClaw đã thành công. Workflow xác minh `pnpm plugins:sync:check`, điều phối `Plugin NPM Release` cho tất cả package plugin có thể xuất bản, điều phối `Plugin ClawHub Release` cho cùng release SHA, và chỉ sau đó mới điều phối `OpenClaw NPM Release` với `preflight_run_id` đã lưu.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit được ghim trên một nhánh thay đổi nhanh, hãy dùng helper thay vì `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Dispatch ref của GitHub workflow phải là nhánh hoặc tag, không phải commit SHA thô. Helper đẩy một nhánh tạm `release-ci/<sha>-...` tại SHA mục tiêu, điều phối `Full Release Validation` từ ref đã ghim đó, xác minh mọi `headSha` của workflow con khớp với target, và xóa nhánh tạm khi lần chạy hoàn tất. Trình xác minh umbrella cũng thất bại nếu bất kỳ workflow con nào chạy ở một SHA khác.

`release_profile` kiểm soát phạm vi live/provider được truyền vào các kiểm tra phát hành. Các
workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn
cố ý muốn ma trận provider/media tư vấn rộng. `run_release_soak`
kiểm soát việc các kiểm tra phát hành stable/mặc định có chạy live/E2E toàn diện và
soak đường dẫn phát hành Docker hay không; `full` buộc bật soak.

- `minimum` giữ các lane phát hành tối quan trọng nhanh nhất của OpenAI/core.
- `stable` thêm tập provider/backend stable.
- `full` chạy ma trận provider/media tư vấn rộng.

Umbrella ghi lại các id lượt chạy con đã dispatch, và job `Verify full validation` cuối cùng kiểm tra lại kết luận hiện tại của các lượt chạy con và thêm các bảng job chậm nhất cho từng lượt chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại job xác minh cha để làm mới kết quả umbrella và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho child CI đầy đủ thông thường, `plugin-prerelease` chỉ cho child prerelease Plugin, `release-checks` cho mọi child phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên umbrella. Điều này giữ lượt chạy lại hộp phát hành bị lỗi trong phạm vi giới hạn sau một bản sửa tập trung. Với một lane cross-OS bị lỗi, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh cross-OS dài phát ra các dòng heartbeat và tóm tắt packaged-upgrade bao gồm thời gian theo từng phase. Các lane kiểm tra phát hành QA là tư vấn, vì vậy lỗi chỉ liên quan đến QA sẽ cảnh báo nhưng không chặn trình xác minh release-check.

`OpenClaw Release Checks` dùng workflow ref đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho các kiểm tra cross-OS và Package Acceptance, cùng với workflow Docker đường dẫn phát hành live/E2E khi chạy phạm vi soak. Điều đó giữ byte package nhất quán trên các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều job con.

Các lượt chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
thay thế umbrella cũ hơn. Trình giám sát cha hủy mọi workflow con mà nó
đã dispatch khi parent bị hủy, vì vậy quá trình xác thực main mới hơn
không nằm sau một lượt chạy release-check cũ kéo dài hai giờ. Việc xác thực branch/tag
phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Shard live và E2E

Child live/E2E phát hành giữ phạm vi bao phủ `pnpm test:live` native rộng, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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

Điều đó giữ nguyên phạm vi bao phủ file trong khi giúp các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lượt chạy lại một lần thủ công.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được xây dựng bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ live có Docker hỗ trợ trên runner Blacksmith thông thường — job container không phải nơi phù hợp để khởi chạy các bài kiểm tra Docker lồng nhau.

Các shard model/backend live có Docker hỗ trợ dùng một image `ghcr.io/openclaw/openclaw-live-test:<sha>` dùng chung riêng cho mỗi commit đã chọn. Workflow phát hành live xây dựng và push image đó một lần, rồi các shard Docker live model, gateway được chia theo provider, backend CLI, bind ACP, và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang các giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout job workflow để container hoặc đường dọn dẹp bị kẹt thất bại nhanh thay vì tiêu thụ toàn bộ ngân sách release-check. Nếu các shard đó tự xây dựng lại target Docker source đầy đủ, lượt chạy phát hành đang cấu hình sai và sẽ lãng phí thời gian thực trên các lần build image trùng lặp.

## Package Acceptance

Dùng `Package Acceptance` khi câu hỏi là "package OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây source, trong khi package acceptance xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng sử dụng sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên package, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in source, workflow ref, package ref, phiên bản, SHA-256, và profile trong tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải xuống artifact đó, xác thực inventory tarball, chuẩn bị các image Docker package-digest khi cần, và chạy các lane Docker đã chọn đối với package đó thay vì đóng gói workflow checkout. Khi một profile chọn nhiều `docker_lanes` có mục tiêu, workflow tái sử dụng chuẩn bị package và image dùng chung một lần, rồi fan out các lane đó thành các job Docker có mục tiêu song song với artifact duy nhất.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một package; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã phát hành.
4. `summary` làm workflow thất bại nếu phân giải package, Docker acceptance, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng nguồn này cho acceptance prerelease/stable đã phát hành.
- `source=ref` đóng gói một branch, tag, hoặc full commit SHA `package_ref` đáng tin cậy. Resolver fetch các branch/tag OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử branch repository hoặc một tag phát hành, cài deps trong một worktree tách rời, và đóng gói nó bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; `package_sha256` là bắt buộc.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy bài kiểm tra. `package_ref` là commit source được đóng gói khi `source=ref`. Điều này cho phép harness kiểm tra hiện tại xác thực các commit source đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng phạm vi bao phủ Plugin offline để xác thực package đã phát hành không bị phụ thuộc vào tình trạng sẵn sàng live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn spec npm đã phát hành được giữ cho các dispatch độc lập.

Để biết chính sách kiểm thử cập nhật và Plugin chuyên dụng, bao gồm lệnh local,
lane Docker, input Package Acceptance, mặc định phát hành, và phân loại lỗi,
xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Release checks gọi Package Acceptance với `source=artifact`, artifact package phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng về migration package, cập nhật, dọn dẹp stale-plugin-dependency, sửa cài đặt configured-plugin, Plugin offline, plugin-update, và Telegram trên cùng tarball package đã phân giải. Đặt `package_acceptance_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks để chạy cùng ma trận đó đối với một package npm đã phát hành thay vì artifact được build từ SHA. Các kiểm tra phát hành cross-OS vẫn bao phủ onboarding, installer, và hành vi nền tảng theo OS; xác thực sản phẩm package/cập nhật nên bắt đầu với Package Acceptance. Lane Docker `published-upgrade-survivor` xác thực một baseline package đã phát hành cho mỗi lượt chạy trong đường dẫn phát hành chặn. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã phát hành dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane lỗi giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng trên bốn bản phát hành npm stable mới nhất cộng với các bản phát hành ranh giới tương thích Plugin được ghim và fixture theo hình dạng issue cho cấu hình Feishu, file bootstrap/persona được giữ lại, cài đặt Plugin OpenClaw đã cấu hình, đường dẫn log dấu ngã, và root dependency Plugin legacy cũ. Các lựa chọn published-upgrade survivor nhiều baseline được shard theo baseline thành các job runner Docker có mục tiêu riêng biệt. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã phát hành toàn diện, không phải phạm vi CI Full Release thông thường. Các lượt chạy tổng hợp local có thể truyền spec package chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận scenario. Lane đã phát hành cấu hình baseline bằng một công thức lệnh `openclaw config set` được nhúng sẵn, ghi lại các bước công thức trong `summary.json`, và probe `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane Windows packaged và installer fresh cũng xác minh rằng một package đã cài đặt có thể import override browser-control từ một đường dẫn Windows tuyệt đối raw. Smoke agent-turn cross-OS OpenAI mặc định là `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì `openai/gpt-5.4`, vì vậy bằng chứng cài đặt và gateway vẫn dùng một model kiểm thử GPT-5 trong khi tránh mặc định GPT-4.x.

### Khoảng tương thích legacy

Package Acceptance có các khoảng tương thích legacy bị giới hạn cho các package đã phát hành. Các package đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các entry QA private đã biết trong `dist/postinstall-inventory.json` có thể trỏ tới các file bị bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase persistence `gateway install --wrapper` khi package không expose flag đó;
- `update-channel-switch` có thể prune `pnpm.patchedDependencies` bị thiếu khỏi fake git fixture bắt nguồn từ tarball và có thể log `update.channel` đã persist bị thiếu;
- smoke Plugin có thể đọc vị trí install-record legacy hoặc chấp nhận thiếu persistence install-record marketplace;
- `plugin-update` có thể cho phép migration metadata cấu hình trong khi vẫn yêu cầu install record và hành vi no-reinstall không thay đổi.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu metadata bản dựng cục bộ đã được phát hành. Các gói về sau phải đáp ứng các hợp đồng hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy kiểm định gói thất bại, hãy bắt đầu từ tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời gian từng pha và lệnh chạy lại. Nên chạy lại hồ sơ gói đã thất bại hoặc đúng các lane Docker thay vì chạy lại toàn bộ quy trình xác thực phát hành.

## Kiểm thử nhanh cài đặt

Workflow `Install Smoke` riêng dùng lại cùng script phạm vi thông qua job `preflight` của nó. Workflow này chia phạm vi kiểm thử nhanh thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường nhanh** chạy cho các pull request chạm tới bề mặt Docker/gói, thay đổi gói/manifest Plugin đi kèm, hoặc các bề mặt Plugin/kênh/Gateway/Plugin SDK lõi mà các job kiểm thử nhanh Docker thực thi. Các thay đổi chỉ ở mã nguồn Plugin đi kèm, chỉnh sửa chỉ ở kiểm thử và chỉnh sửa chỉ ở tài liệu không giữ trước worker Docker. Đường nhanh dựng ảnh Dockerfile gốc một lần, kiểm tra CLI, chạy kiểm thử nhanh CLI agents delete shared-workspace, chạy e2e container gateway-network, xác minh build arg của extension đi kèm, và chạy hồ sơ Docker Plugin đi kèm có giới hạn dưới timeout lệnh tổng hợp 240 giây (mỗi lượt chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update installer cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call và các pull request thật sự chạm tới bề mặt installer/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc dùng lại một ảnh kiểm thử nhanh Dockerfile gốc GHCR theo SHA đích, rồi chạy cài đặt gói QR, kiểm thử nhanh Dockerfile gốc/Gateway, kiểm thử nhanh installer/update và Docker E2E Plugin đi kèm đường nhanh dưới dạng các job riêng để công việc installer không phải chờ sau các kiểm thử nhanh ảnh gốc.

Các push lên `main` (bao gồm merge commit) không ép đường đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một push, workflow giữ kiểm thử nhanh Docker đường nhanh và để kiểm thử nhanh cài đặt đầy đủ cho hằng đêm hoặc xác thực phát hành.

Kiểm thử nhanh provider ảnh cài đặt Bun global chậm được chặn riêng bởi `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn tham gia, nhưng pull request và push lên `main` thì không. Các kiểm thử Docker QR và installer giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng trước một ảnh live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm và dựng hai ảnh `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane installer/update/plugin-dependency;
- một ảnh chức năng cài cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn ảnh theo từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số điều chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                         |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot nhóm chính cho các lane thông thường.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot nhóm đuôi nhạy cảm với provider.                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để provider không điều tiết.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều dịch vụ đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Khoảng giãn giữa các lần bắt đầu lane để tránh tạo bão trên daemon Docker; đặt `0` để không giãn. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Timeout dự phòng theo từng lane (120 phút); các lane live/đuôi được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in kế hoạch bộ lập lịch mà không chạy lane.                                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua kiểm thử nhanh dọn dẹp để agent có thể tái hiện một lane thất bại. |

Một lane nặng hơn giới hạn hiệu lực của nó vẫn có thể bắt đầu từ một nhóm trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Tổng hợp cục bộ kiểm tra trước Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời gian lane để sắp thứ tự dài nhất trước, và theo mặc định dừng lập lịch các lane trong nhóm mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` xem cần gói, loại ảnh, ảnh live, lane và phạm vi credential nào. Sau đó `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại, hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; dựng và đẩy các ảnh Docker E2E GHCR bare/functional được gắn tag theo digest gói thông qua cache lớp Docker của Blacksmith khi kế hoạch cần các lane đã cài gói; và dùng lại input `docker_e2e_bare_image`/`docker_e2e_functional_image` đã cung cấp hoặc ảnh theo digest gói hiện có thay vì dựng lại. Việc pull ảnh Docker được thử lại với timeout giới hạn 180 giây cho mỗi lần thử, để một luồng registry/cache bị kẹt được thử lại nhanh thay vì tiêu tốn phần lớn đường găng CI.

### Phân đoạn đường phát hành

Phạm vi Docker phát hành chạy các job được chia nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phân đoạn chỉ pull loại ảnh nó cần và thực thi nhiều lane qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các phân đoạn Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và từ `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các bí danh Plugin/runtime tổng hợp. Bí danh lane `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai lane installer provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ phân đoạn `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật kênh đi kèm thử lại một lần đối với lỗi mạng npm nhất thời.

Mỗi phân đoạn tải lên `.artifacts/docker-tests/` với nhật ký lane, thời gian, `summary.json`, `failures.json`, thời gian từng pha, JSON kế hoạch bộ lập lịch, bảng lane chậm và lệnh chạy lại theo từng lane. Input `docker_lanes` của workflow chạy các lane được chọn trên các ảnh đã chuẩn bị thay vì các job phân đoạn, giúp việc gỡ lỗi lane thất bại được giới hạn trong một job Docker nhắm mục tiêu và chuẩn bị, tải xuống hoặc dùng lại artifact gói cho lần chạy đó; nếu một lane được chọn là lane Docker live, job nhắm mục tiêu sẽ dựng ảnh live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub theo từng lane được tạo sẽ bao gồm `package_artifact_run_id`, `package_artifact_name` và input ảnh đã chuẩn bị khi các giá trị đó tồn tại, để lane thất bại có thể dùng lại đúng gói và ảnh từ lần chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy bộ Docker release-path đầy đủ hằng ngày.

## Tiền phát hành Plugin

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, push lên `main`, và dispatch CI thủ công độc lập không bật suite đó. Nó cân bằng kiểm thử Plugin đi kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch Plugin nặng import không tạo thêm job CI. Đường tiền phát hành Docker chỉ dành cho phát hành gom nhóm các lane Docker nhắm mục tiêu thành các nhóm nhỏ để tránh giữ trước hàng chục runner cho các job kéo dài một đến ba phút.

## QA Lab

QA Lab có các lane CI chuyên dụng nằm ngoài workflow chính có phạm vi thông minh. Parity kiểu agent được lồng dưới các harness QA rộng và phát hành, không phải một workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi parity nên đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó tỏa ra lane parity mô phỏng, lane Matrix live, và các lane Telegram và Discord live dưới dạng các job song song. Các job live dùng environment `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Kiểm tra phát hành chạy các lane truyền tải Matrix và Telegram live với provider mô phỏng xác định và các model đủ điều kiện mô phỏng (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được cô lập khỏi độ trễ model live và quá trình khởi động provider-plugin thông thường. Gateway truyền tải live tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; kết nối provider được bao phủ bởi các suite model live, provider native và provider Docker riêng.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Giá trị mặc định của CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn chia nhỏ phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab thiết yếu cho phát hành trước khi phê duyệt phát hành; cổng QA parity của nó chạy các gói candidate và baseline dưới dạng các job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ cho phép so sánh parity cuối cùng.

Đối với các PR thông thường, hãy tuân theo bằng chứng CI/kiểm tra theo phạm vi thay vì xem parity là một trạng thái bắt buộc.

## CodeQL

Quy trình `CodeQL` có chủ đích là trình quét bảo mật lượt đầu hẹp, không phải đợt quét toàn bộ kho lưu trữ. Các lượt chạy bảo vệ hằng ngày, thủ công và pull request không ở trạng thái nháp sẽ quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript có rủi ro cao nhất bằng các truy vấn bảo mật độ tin cậy cao, được lọc theo `security-severity` cao/nghiêm trọng.

Bảo vệ pull request vẫn nhẹ: nó chỉ khởi động cho các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. Android và macOS CodeQL không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Xác thực, bí mật, sandbox, Cron và đường cơ sở Gateway                                                                              |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, Gateway, Plugin SDK, bí mật, điểm chạm kiểm toán                            |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF lõi, phân tích IP, bảo vệ mạng, web-fetch và các bề mặt chính sách SSRF của Plugin SDK                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, trình trợ giúp thực thi tiến trình, phân phối ra ngoài và cổng thực thi công cụ của agent                              |
| `/codeql-security-high/plugin-trust-boundary`     | Cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, tải nguồn và các bề mặt tin cậy hợp đồng gói Plugin SDK       |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF đã tải lên và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn runtime ngay cả khi sạch.

### Danh mục Chất lượng Nghiêm trọng

`CodeQL Critical Quality` là shard phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript phi bảo mật mức lỗi trên các bề mặt hẹp có giá trị cao trên runner Blacksmith Linux nhỏ hơn. Bảo vệ pull request của nó có chủ đích nhỏ hơn profile theo lịch: các PR không ở trạng thái nháp chỉ chạy các shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` và `plugin-sdk-reply-runtime` tương ứng cho các thay đổi trong mã thực thi lệnh/mô hình/công cụ của agent và điều phối trả lời, schema/cấu hình/di trú/IO, xác thực/bí mật/sandbox/bảo mật, runtime Plugin kênh lõi và kênh được đóng gói, giao thức Gateway/phương thức máy chủ, runtime bộ nhớ/keo SDK, MCP/tiến trình/phân phối ra ngoài, runtime nhà cung cấp/catalog mô hình, chẩn đoán phiên/hàng đợi phân phối, Plugin loader, Plugin SDK/hợp đồng gói hoặc runtime trả lời Plugin SDK. Các thay đổi cấu hình CodeQL và workflow chất lượng chạy toàn bộ mười hai shard chất lượng PR.

Điều phối thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các profile hẹp là móc hướng dẫn/lặp để chạy riêng một shard chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật cho xác thực, bí mật, sandbox, Cron và Gateway                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Hợp đồng schema cấu hình, di trú, chuẩn hóa và IO                                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                         |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai Plugin kênh lõi và kênh được đóng gói                                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi tự động trả lời, và hợp đồng runtime control-plane ACP                                      |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình và hợp đồng phân phối ra ngoài                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, keo kích hoạt runtime bộ nhớ và lệnh doctor bộ nhớ                                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, trình trợ giúp liên kết/phân phối phiên ra ngoài, bề mặt gói sự kiện/log chẩn đoán và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đến của Plugin SDK, trình trợ giúp payload/chunking/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối và trình trợ giúp liên kết phiên/luồng |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa catalog mô hình, xác thực và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/catalog nhà cung cấp và registry web/tìm kiếm/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI điều khiển, lưu trữ cục bộ, luồng điều khiển Gateway và hợp đồng runtime control-plane tác vụ                                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Web fetch/tìm kiếm lõi, IO phương tiện, hiểu phương tiện, tạo ảnh và hợp đồng runtime tạo phương tiện                                                            |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng entrypoint của loader, registry, bề mặt công khai và Plugin SDK                                                                                         |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và trình trợ giúp hợp đồng gói plugin                                                                                     |

Chất lượng được tách riêng khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và plugin được đóng gói chỉ nên được thêm lại dưới dạng công việc tiếp nối có phạm vi hoặc chia shard sau khi các profile hẹp có runtime và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một lane bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được đưa vào. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và điều phối thủ công có thể chạy trực tiếp. Các lần gọi workflow-run sẽ bỏ qua khi `main` đã tiến tiếp hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ trước. Khi chạy, nó xem xét dải commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lượt chạy hằng giờ có thể bao phủ mọi thay đổi trên main đã tích lũy kể từ lượt tài liệu gần nhất.

### Test Performance Agent

Workflow `Test Performance Agent` là một lane bảo trì Codex theo sự kiện cho các bài kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Điều phối thủ công bỏ qua cổng hoạt động hằng ngày đó. Lane này xây dựng báo cáo hiệu năng Vitest theo nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ nguyên độ bao phủ thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử baseline đang pass. Nếu baseline có kiểm thử thất bại, Codex chỉ có thể sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau agent phải pass trước khi có bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi bot push được đưa vào, lane sẽ rebase bản vá đã xác thực, chạy lại `pnpm check:changed` và thử push lại; các bản vá cũ xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub host để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi merge

Workflow `Duplicate PRs After Merge` là workflow thủ công dành cho maintainer để dọn dẹp trùng lặp sau khi đưa PR vào. Mặc định là chạy thử và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã đưa vào đã được merge và mỗi PR trùng lặp có vấn đề được tham chiếu chung hoặc có các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck core prod và core test cùng lint/guard lõi;
- thay đổi chỉ kiểm thử lõi chỉ chạy typecheck core test cùng lint lõi;
- thay đổi production extension chạy typecheck extension prod và extension test cùng lint extension;
- thay đổi chỉ kiểm thử extension chạy typecheck extension test cùng lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng plugin mở rộng sang typecheck extension vì các extension phụ thuộc vào các hợp đồng lõi đó (các lượt quét extension Vitest vẫn là công việc kiểm thử rõ ràng);
- bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- thay đổi root/cấu hình chưa biết sẽ fail an toàn sang tất cả các lane kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và có chủ đích rẻ hơn `check:changed`: các chỉnh sửa kiểm thử trực tiếp tự chạy chính chúng, chỉnh sửa nguồn ưu tiên ánh xạ rõ ràng, sau đó là kiểm thử cùng cấp và các phần phụ thuộc theo đồ thị import. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ rõ ràng: thay đổi đối với cấu hình trả lời hiển thị trong nhóm, chế độ phân phối trả lời nguồn hoặc prompt hệ thống của message-tool sẽ đi qua các kiểm thử trả lời lõi cùng hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung thất bại trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập ánh xạ rẻ không phải là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ gốc repo và ưu tiên một box mới đã được làm nóng để có bằng chứng diện rộng. Trước khi dành một cổng kiểm tra chậm cho một box đã được tái sử dụng, hết hạn, hoặc vừa báo cáo một lần đồng bộ lớn bất thường, hãy chạy `pnpm testbox:sanity` bên trong box trước.

Kiểm tra sanity sẽ thất bại nhanh khi các tệp gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 lượt xóa tệp đã theo dõi. Điều đó thường có nghĩa là trạng thái đồng bộ từ xa không phải là một bản sao đáng tin cậy của PR; hãy dừng box đó và làm nóng một box mới thay vì gỡ lỗi thất bại kiểm thử sản phẩm. Với các PR cố ý xóa số lượng lớn, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng kết thúc một lệnh gọi Blacksmith CLI cục bộ nếu lệnh đó ở lại giai đoạn đồng bộ quá năm phút mà không có đầu ra sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt cơ chế bảo vệ đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là wrapper box từ xa do repo sở hữu để kiểm chứng Linux cho maintainer. Dùng nó khi một kiểm tra quá rộng cho vòng lặp chỉnh sửa cục bộ, khi cần tương đương CI, hoặc khi bằng chứng cần secret, Docker, các lane gói, box có thể tái sử dụng, hoặc nhật ký từ xa. Backend OpenClaw thông thường là `blacksmith-testbox`; dung lượng AWS/Hetzner sở hữu là phương án dự phòng khi Blacksmith gặp sự cố, vấn đề hạn ngạch, hoặc khi kiểm thử dung lượng sở hữu được yêu cầu rõ ràng.

Trước lần chạy đầu tiên, kiểm tra wrapper từ gốc repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo từ chối một binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider rõ ràng dù `.crabbox.yaml` có mặc định cloud sở hữu.

Cổng kiểm tra thay đổi:

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

Chạy lại bài kiểm thử tập trung:

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

Đọc phần tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Các lần chạy Crabbox một lần dựa trên Blacksmith nên tự động dừng Testbox; nếu một lần chạy bị gián đoạn hoặc việc dọn dẹp không rõ ràng, hãy kiểm tra các box đang hoạt động và chỉ dừng những box bạn đã tạo:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Chỉ dùng tái sử dụng khi bạn cố ý cần nhiều lệnh trên cùng một box đã được hydrate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Nếu Crabbox là lớp bị hỏng nhưng bản thân Blacksmith vẫn hoạt động, dùng Blacksmith trực tiếp làm phương án dự phòng hẹp:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Chỉ nâng cấp sang dung lượng Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn hạn ngạch, thiếu môi trường cần thiết, hoặc dung lượng sở hữu là mục tiêu rõ ràng:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` sở hữu các mặc định provider, đồng bộ, và hydrate GitHub Actions cho các lane cloud sở hữu. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa của chính nó thay vì đồng bộ remote cục bộ của maintainer và object store, đồng thời loại trừ các artifact runtime/build cục bộ vốn không bao giờ nên được truyền đi. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và chuyển giao môi trường không chứa secret cho các lệnh cloud sở hữu `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
