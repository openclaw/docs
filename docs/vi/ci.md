---
read_when:
    - Bạn cần hiểu lý do một tác vụ CI đã chạy hay không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lần chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị công việc CI, cổng phạm vi, phạm vi phát hành bao trùm và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-02T22:17:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần push vào `main` và mọi pull request. Job `preflight` phân loại diff và tắt các lane tốn kém khi chỉ các khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho các release candidate và xác thực rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong workflow [`Plugin Prerelease`](#plugin-prerelease) riêng và chỉ chạy từ [`Full Release Validation`](#full-release-validation) hoặc một lần dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                              | Mục đích                                                                                                             | Khi chạy                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ tài liệu, phạm vi đã thay đổi, extension đã thay đổi, và xây dựng manifest CI                             | Luôn chạy trên push và PR không phải draft |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra workflow qua `zizmor`                                                               | Luôn chạy trên push và PR không phải draft |
| `security-dependency-audit`      | Kiểm tra lockfile production không cần dependency dựa trên advisory npm                                                    | Luôn chạy trên push và PR không phải draft |
| `security-fast`                  | Tổng hợp bắt buộc cho các job bảo mật nhanh                                                                       | Luôn chạy trên push và PR không phải draft |
| `check-dependencies`             | Lượt kiểm tra Knip chỉ dependency production cộng với guard allowlist tệp không dùng                                           | Thay đổi liên quan đến Node              |
| `build-artifacts`                | Xây dựng `dist/`, Control UI, kiểm tra built-artifact, và artifact hạ nguồn có thể tái sử dụng                                 | Thay đổi liên quan đến Node              |
| `checks-fast-core`               | Các lane kiểm tra đúng nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                                        | Thay đổi liên quan đến Node              |
| `checks-fast-contracts-channels` | Kiểm tra hợp đồng kênh được shard với kết quả kiểm tra tổng hợp ổn định                                                | Thay đổi liên quan đến Node              |
| `checks-node-core-test`          | Các shard kiểm thử Node core, không bao gồm lane kênh, bundled, contract, và extension                                    | Thay đổi liên quan đến Node              |
| `check`                          | Tương đương gate local chính được shard: kiểu production, lint, guard, kiểu test, và smoke nghiêm ngặt                          | Thay đổi liên quan đến Node              |
| `check-additional`               | Kiến trúc, boundary, drift snapshot prompt, guard bề mặt extension, package-boundary, và các shard gateway-watch | Thay đổi liên quan đến Node              |
| `build-smoke`                    | Kiểm thử smoke built-CLI và smoke bộ nhớ khởi động                                                                      | Thay đổi liên quan đến Node              |
| `checks`                         | Trình xác minh cho kiểm thử kênh built-artifact                                                                           | Thay đổi liên quan đến Node              |
| `checks-node-compat-node22`      | Lane build và smoke tương thích Node 22                                                                          | Dispatch CI thủ công cho phát hành    |
| `check-docs`                     | Định dạng tài liệu, lint, và kiểm tra liên kết hỏng                                                                       | Tài liệu thay đổi                       |
| `skills-python`                  | Ruff + pytest cho Skills dựa trên Python                                                                              | Thay đổi liên quan đến Python-skill      |
| `checks-windows`                 | Kiểm thử process/path riêng cho Windows cộng với hồi quy import specifier runtime dùng chung                                | Thay đổi liên quan đến Windows           |
| `macos-node`                     | Lane kiểm thử TypeScript macOS dùng các artifact đã build dùng chung                                                         | Thay đổi liên quan đến macOS             |
| `macos-swift`                    | Swift lint, build, và test cho ứng dụng macOS                                                                      | Thay đổi liên quan đến macOS             |
| `android`                        | Kiểm thử unit Android cho cả hai flavor cộng với một bản build debug APK                                                        | Thay đổi liên quan đến Android           |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm Codex hằng ngày sau hoạt động đáng tin cậy                                                           | CI main thành công hoặc dispatch thủ công |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile, và GPT 5.4 live           | Theo lịch và dispatch thủ công      |

## Thứ tự fail-fast

1. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chồng lấp với các lane Linux nhanh để consumer hạ nguồn có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn mở rộng sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một push mới hơn vào cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` nên chúng vẫn báo cáo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa concurrency CI tự động được version hóa (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang diễn ra.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi unit test trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng tự thân chúng không buộc build native Windows, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, một số chỉnh sửa fixture core-test rẻ, và chỉnh sửa hẹp helper/test-routing plugin contract** dùng đường dẫn manifest nhanh chỉ Node: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường dẫn đó bỏ qua build artifact, tương thích Node 22, contract kênh, toàn bộ shard core, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp thực thi.
- **Kiểm tra Node Windows** được giới hạn ở các wrapper process/path riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package, và các bề mặt workflow CI thực thi lane đó; thay đổi nguồn, Plugin, install-smoke, và chỉ test không liên quan vẫn ở trên các lane Linux Node.

Các họ kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không giữ quá nhiều runner: contract kênh chạy dưới dạng ba shard có trọng số, các lane unit core nhỏ được ghép cặp, auto-reply chạy dưới dạng bốn worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch, và commands/state-routing), và cấu hình Gateway/Plugin agentic được trải trên các job Node agentic chỉ source hiện có thay vì chờ built artifact. Các kiểm thử browser, QA, media, và Plugin linh tinh rộng dùng cấu hình Vitest chuyên dụng của chúng thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi mục timing bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với một shard đã lọc. `check-additional` giữ công việc compile/canary package-boundary cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; shard guard boundary chạy các guard độc lập nhỏ của nó đồng thời trong một job, bao gồm `pnpm prompt:snapshots:check` để drift prompt đường dẫn thành công Codex được ghim vào PR gây ra nó. Gateway watch, kiểm thử kênh, và shard support-boundary core chạy đồng thời trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi build Play debug APK. Flavor bên thứ ba không có source set hoặc manifest riêng; lane unit-test của nó vẫn compile flavor với các cờ SMS/call-log BuildConfig, đồng thời tránh một job đóng gói debug APK trùng lặp trên mọi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt kiểm tra Knip chỉ dependency production được ghim vào phiên bản Knip mới nhất, với độ tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được review hoặc để lại mục allowlist cũ, trong khi vẫn giữ các bề mặt Plugin động, generated, build, live-test, và package bridge có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía mục tiêu từ hoạt động repository OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho yêu cầu review chính xác issue và pull request;
- `clawsweeper_comment` cho lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho yêu cầu review cấp commit trên các push `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại event, action, actor, repository, số item, URL, tiêu đề, trạng thái, và đoạn trích ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ body Webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, workflow này đăng event đã chuẩn hóa lên hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải mặc định giao hàng. Agent ClawSweeper nhận mục tiêu Discord trong prompt của nó và chỉ nên đăng lên `#clawsweeper` khi event gây bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về vận hành. Các lần mở, chỉnh sửa, bot churn, nhiễu Webhook trùng lặp, và lưu lượng review bình thường nên trả về `NO_REPLY`.

Xem tiêu đề, bình luận, body, văn bản review, tên branch, và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy xuyên suốt đường dẫn này. Chúng là đầu vào cho tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Dispatch thủ công

Các lần dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng buộc bật mọi lane có phạm vi không phải Android: các shard Linux Node, các shard Plugin được đóng gói, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra docs, Python skills, Windows, macOS và Control UI i18n. Các lần dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh prerelease Plugin, shard chỉ dành cho phát hành `agentic-plugins`, sweep batch extension đầy đủ và các lane Docker prerelease Plugin bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với gate release-validation được bật.

Các lần chạy thủ công dùng một nhóm concurrency duy nhất để bộ đầy đủ của release-candidate không bị hủy bởi một lần push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép một caller đáng tin cậy chạy đồ thị đó với một branch, tag hoặc commit SHA đầy đủ trong khi dùng workflow file từ dispatch ref đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các job bảo mật nhanh và job tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), kiểm tra nhanh protocol/contract/bundled, kiểm tra hợp đồng kênh theo shard, các shard `check` ngoại trừ lint, các shard và job tổng hợp `check-additional`, trình xác minh tổng hợp test Node, kiểm tra docs, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight cũng dùng GitHub-hosted Ubuntu để ma trận Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard test Linux Node, các shard test Plugin được đóng gói, `android`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (đủ nhạy với CPU nên 8 vCPU tốn kém hơn phần tiết kiệm được); các bản build Docker install-smoke (thời gian xếp hàng 32-vCPU tốn kém hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` là workflow hiệu năng sản phẩm/runtime. Workflow này chạy hằng ngày trên `main` và có thể được dispatch thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow cài đặt OCM từ một bản phát hành được ghim và Kova từ input `kova_ref` được ghim, rồi chạy ba lane:

- `mock-provider`: các scenario chẩn đoán Kova chạy với runtime local-build bằng auth giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: profiling CPU/heap/trace cho startup, Gateway và các hotspot agent-turn.
- `live-gpt54`: một lượt agent OpenAI `openai/gpt-5.4` thật, được bỏ qua khi không có `OPENAI_API_KEY`.

Lane mock-provider cũng chạy các probe nguồn gốc OpenClaw-native sau lượt Kova: thời gian boot Gateway và bộ nhớ qua các trường hợp startup mặc định, hook và 50 Plugin; các vòng lặp hello `channel-chat-baseline` mock-OpenAI lặp lại; và các lệnh khởi động CLI chạy với Gateway đã boot. Bản tóm tắt Markdown của source probe nằm tại `source/index.md` trong report bundle, kèm JSON thô bên cạnh.

Mỗi lane upload GitHub artifacts. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, bundles, `index.md` và artifact source-probe vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Con trỏ branch hiện tại được ghi thành `openclaw-performance/<ref>/latest-<lane>.json`.

## Xác thực bản phát hành đầy đủ

`Full Release Validation` là workflow umbrella thủ công cho "chạy mọi thứ trước khi phát hành." Workflow này nhận branch, tag hoặc commit SHA đầy đủ, dispatch workflow thủ công `CI` với target đó, dispatch `Plugin Prerelease` để có bằng chứng Plugin/package/static/Docker chỉ dành cho phát hành, và dispatch `OpenClaw Release Checks` cho install smoke, package acceptance, các bộ release-path Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix và các lane Telegram. Với `rerun_group=all` và `release_profile=full`, workflow cũng chạy `NPM Telegram Beta E2E` với artifact `release-package-under-test` từ release checks. Sau khi publish, truyền `npm_telegram_package_spec` để chạy lại cùng lane package Telegram với package npm đã publish.

Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận stage, tên job workflow chính xác, khác biệt giữa các profile, artifacts và
các handle rerun tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Dispatch workflow này
từ `release/YYYY.M.D` hoặc `main` sau khi tag phát hành tồn tại và sau khi
OpenClaw npm preflight đã thành công. Workflow xác minh `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` cho mọi package Plugin có thể publish, dispatch
`Plugin ClawHub Release` cho cùng release SHA, và chỉ sau đó mới dispatch
`OpenClaw NPM Release` với `preflight_run_id` đã lưu.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit được ghim trên một branch thay đổi nhanh, dùng helper thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub workflow dispatch refs phải là branch hoặc tag, không phải commit SHA thô. Helper
push một branch tạm thời `release-ci/<sha>-...` tại target SHA,
dispatch `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con
`headSha` khớp với target, và xóa branch tạm thời khi lần chạy hoàn tất. Trình xác minh umbrella cũng fail nếu bất kỳ workflow con nào chạy ở
SHA khác.

`release_profile` kiểm soát độ rộng live/provider được truyền vào release checks. Các workflow phát hành
thủ công mặc định là `stable`; chỉ dùng `full` khi bạn
cố ý muốn ma trận provider/media tư vấn rộng.

- `minimum` giữ các lane OpenAI/core release-critical nhanh nhất.
- `stable` thêm tập provider/backend ổn định.
- `full` chạy ma trận provider/media tư vấn rộng.

Umbrella ghi lại các child run id đã dispatch, và job cuối cùng `Verify full validation` kiểm tra lại conclusion hiện tại của các child run và nối thêm bảng job chậm nhất cho từng child run. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại job verifier của parent để làm mới kết quả umbrella và bản tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho bản ứng viên phát hành, `ci` chỉ cho nhánh con CI đầy đủ thông thường, `plugin-prerelease` chỉ cho nhánh con phát hành trước Plugin, `release-checks` cho mọi nhánh con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên workflow bao trùm. Cách này giữ phạm vi chạy lại một hộp phát hành bị lỗi được giới hạn sau một bản sửa tập trung.

`OpenClaw Release Checks` dùng tham chiếu workflow tin cậy để phân giải tham chiếu đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho cả workflow Docker đường dẫn phát hành live/E2E và shard chấp nhận gói. Điều đó giữ các byte của gói nhất quán giữa các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều job con.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
thay thế workflow bao trùm cũ hơn. Bộ giám sát cha hủy mọi workflow con mà nó
đã dispatch khi workflow cha bị hủy, vì vậy quá trình xác thực main mới hơn
không phải chờ sau một lần chạy release-check cũ kéo dài hai giờ. Việc xác thực
nhánh/thẻ phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Các shard live và E2E

Nhánh con live/E2E phát hành giữ phạm vi bao phủ rộng của `pnpm test:live` native, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- các job `native-live-src-gateway-profiles` được lọc theo nhà cung cấp
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- các shard âm thanh/video media được tách riêng và các shard nhạc được lọc theo nhà cung cấp

Cách này giữ cùng phạm vi bao phủ tệp trong khi giúp dễ chạy lại và chẩn đoán các lỗi nhà cung cấp live chậm. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh các binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên các runner Blacksmith thông thường — container job không phải nơi phù hợp để khởi chạy các kiểm thử Docker lồng nhau.

Các shard mô hình/backend live dựa trên Docker dùng một image chia sẻ riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit đã chọn. Workflow phát hành live build và push image đó một lần, rồi các shard mô hình Docker live, Gateway được chia shard theo nhà cung cấp, backend CLI, liên kết ACP, và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker có giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout của job workflow để một container bị kẹt hoặc đường dẫn dọn dẹp bị lỗi nhanh thay vì tiêu thụ toàn bộ ngân sách release-check. Nếu các shard đó tự build lại toàn bộ target Docker nguồn một cách độc lập, lần chạy phát hành đã bị cấu hình sai và sẽ lãng phí thời gian thực tế cho các bản build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng thực thi sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, tham chiếu workflow, tham chiếu gói, phiên bản, SHA-256, và hồ sơ trong phần tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực danh mục tarball, chuẩn bị các image Docker theo digest gói khi cần, và chạy các lane Docker đã chọn trên gói đó thay vì đóng gói checkout workflow. Khi một hồ sơ chọn nhiều `docker_lanes` được nhắm mục tiêu, workflow tái sử dụng chuẩn bị gói và các image chia sẻ một lần, rồi fan out các lane đó thành các job Docker được nhắm mục tiêu song song với artifact riêng biệt.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi chấp nhận gói đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một đặc tả npm đã phát hành.
4. `summary` làm workflow thất bại nếu quá trình phân giải gói, chấp nhận Docker, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@alpha`, `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng nguồn này cho chấp nhận bản phát hành trước/ổn định đã phát hành.
- `source=ref` đóng gói một nhánh, thẻ, hoặc SHA commit đầy đủ `package_ref` tin cậy. Bộ phân giải fetch các nhánh/thẻ OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử nhánh repository hoặc một thẻ phát hành, cài đặt dependency trong một worktree tách rời, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` riêng biệt. `workflow_ref` là mã workflow/harness tin cậy chạy kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn tin cậy cũ hơn mà không chạy logic workflow cũ.

### Hồ sơ bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các phần Docker đường dẫn phát hành đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Hồ sơ `package` dùng phạm vi bao phủ Plugin offline để việc xác thực gói đã phát hành không bị chặn bởi tính khả dụng live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn đặc tả npm đã phát hành được giữ cho các dispatch độc lập.

Để xem chính sách chuyên dụng cho cập nhật và kiểm thử Plugin, bao gồm các lệnh cục bộ,
lane Docker, đầu vào chấp nhận gói, mặc định phát hành, và phân loại lỗi,
xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Release checks gọi chấp nhận gói với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng di chuyển gói, cập nhật, dọn dẹp dependency Plugin cũ, sửa cài đặt Plugin đã cấu hình, Plugin offline, plugin-update, và Telegram trên cùng tarball gói đã phân giải. Đặt `package_acceptance_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks để chạy cùng ma trận đó trên một gói npm đã giao thay vì artifact được build từ SHA. Cross-OS release checks vẫn bao phủ onboarding, trình cài đặt, và hành vi nền tảng dành riêng cho OS; xác thực sản phẩm gói/cập nhật nên bắt đầu bằng chấp nhận gói. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã phát hành cho mỗi lần chạy. Trong chấp nhận gói, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã phát hành dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane bị lỗi giữ nguyên baseline đó. Đặt `published_upgrade_survivor_baselines=all-since-2026.4.23` để mở rộng Full Release CI trên mọi bản phát hành npm ổn định từ `2026.4.23` đến `latest`; `release-history` vẫn có sẵn để lấy mẫu rộng hơn thủ công với mốc trước ngày cũ hơn. Đặt `published_upgrade_survivor_scenarios=reported-issues` để mở rộng cùng các baseline trên các fixture có dạng issue cho cấu hình Feishu, các tệp bootstrap/persona được giữ lại, cài đặt Plugin OpenClaw đã cấu hình, đường dẫn log dấu ngã, và các gốc dependency Plugin kế thừa cũ. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã phát hành một cách toàn diện, không phải độ rộng Full Release CI thông thường. Các lần chạy tổng hợp cục bộ có thể truyền đặc tả gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã phát hành cấu hình baseline bằng một công thức lệnh `openclaw config set` được nhúng sẵn, ghi lại các bước công thức trong `summary.json`, và thăm dò `/healthz`, `/readyz`, cùng trạng thái RPC sau khi Gateway khởi động. Các lane mới của gói Windows và trình cài đặt cũng xác minh rằng một gói đã cài đặt có thể import một override browser-control từ một đường dẫn Windows tuyệt đối thô. Smoke lượt agent cross-OS OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.4`, để bằng chứng cài đặt và Gateway vẫn ở trên một mô hình kiểm thử GPT-5 trong khi tránh các mặc định GPT-4.x.

### Cửa sổ tương thích kế thừa

Chấp nhận gói có các cửa sổ tương thích kế thừa có giới hạn cho các gói đã phát hành. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các tệp bị lược khỏi tarball;
- `doctor-switch` có thể bỏ qua tiểu trường hợp lưu giữ `gateway install --wrapper` khi gói không phơi bày flag đó;
- `update-channel-switch` có thể cắt bớt `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả lập xuất phát từ tarball và có thể ghi log `update.channel` đã lưu giữ bị thiếu;
- các smoke Plugin có thể đọc các vị trí bản ghi cài đặt kế thừa hoặc chấp nhận việc thiếu lưu giữ bản ghi cài đặt marketplace;
- `plugin-update` có thể cho phép di chuyển metadata cấu hình trong khi vẫn yêu cầu bản ghi cài đặt và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu metadata build cục bộ đã được giao. Các gói sau đó phải đáp ứng các hợp đồng hiện đại; cùng các điều kiện sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy chấp nhận gói thất bại, hãy bắt đầu ở phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các tạo tác Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời gian từng pha và các lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói thất bại hoặc đúng các lane Docker thay vì chạy lại toàn bộ xác thực phát hành.

## Smoke cài đặt

Quy trình làm việc `Install Smoke` riêng biệt tái sử dụng cùng script phạm vi thông qua job `preflight` của nó. Nó chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường nhanh** chạy cho pull request chạm tới bề mặt Docker/gói, thay đổi gói/manifest Plugin đi kèm, hoặc các bề mặt Plugin SDK/plugin/channel/gateway lõi mà các job Docker smoke kiểm thử. Các thay đổi Plugin đi kèm chỉ ở mã nguồn, chỉnh sửa chỉ ở kiểm thử và chỉnh sửa chỉ ở tài liệu không giữ trước Docker worker. Đường nhanh xây dựng image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa agents shared-workspace, chạy e2e gateway-network trong container, xác minh một build arg extension đi kèm và chạy hồ sơ Docker Plugin đi kèm có giới hạn dưới timeout lệnh tổng hợp 240 giây (mỗi lần chạy Docker của kịch bản được giới hạn riêng).
- **Đường đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update của trình cài đặt cho các lần chạy theo lịch hằng đêm, điều phối thủ công, kiểm tra phát hành workflow-call và pull request thật sự chạm tới bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image smoke Dockerfile gốc GHCR theo target-SHA, rồi chạy cài đặt gói QR, smoke Dockerfile/gateway gốc, smoke trình cài đặt/cập nhật và E2E Docker Plugin đi kèm nhanh dưới dạng các job riêng để công việc trình cài đặt không phải chờ sau các smoke image gốc.

Các lần push lên `main` (bao gồm merge commit) không ép chạy đường đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một lần push, quy trình làm việc giữ Docker smoke nhanh và để smoke cài đặt đầy đủ cho nightly hoặc xác thực phát hành.

Smoke image-provider cài đặt toàn cục Bun chậm được chặn riêng bởi `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ quy trình làm việc kiểm tra phát hành, và các điều phối thủ công `Install Smoke` có thể chọn tham gia, nhưng pull request và các lần push lên `main` thì không. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## E2E Docker cục bộ

`pnpm test:docker:all` dựng trước một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm và xây dựng hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane trình cài đặt/cập nhật/phụ thuộc Plugin;
- một image chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn image cho từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Thông số có thể điều chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot pool chính cho các lane thông thường.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot pool đuôi nhạy cảm với provider.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để provider không throttle.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều dịch vụ đồng thời.                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ lệch giữa các lần bắt đầu lane để tránh bão tạo Docker daemon; đặt `0` để không lệch.      |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Timeout dự phòng cho từng lane (120 phút); các lane live/tail được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` in kế hoạch bộ lập lịch mà không chạy lane.                                              |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Danh sách lane chính xác phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agents có thể tái hiện một lane thất bại. |

Một lane nặng hơn giới hạn hiệu lực của nó vẫn có thể bắt đầu từ một pool trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Tổng hợp cục bộ preflight Docker, xóa các container E2E OpenClaw cũ, phát trạng thái lane đang hoạt động, lưu thời gian lane để sắp xếp dài nhất trước, và theo mặc định dừng lập lịch các lane trong pool mới sau lỗi đầu tiên.

### Quy trình làm việc live/E2E có thể tái sử dụng

Quy trình làm việc live/E2E có thể tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` để biết phạm vi gói, loại image, image live, lane và thông tin xác thực cần thiết. Sau đó `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải xuống tạo tác gói của lần chạy hiện tại, hoặc tải xuống tạo tác gói từ `package_artifact_run_id`; xác thực inventory tarball; xây dựng và push các image E2E Docker GHCR bare/functional được gắn tag bằng digest gói thông qua cache lớp Docker của Blacksmith khi kế hoạch cần các lane đã cài gói; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các image digest gói hiện có thay vì xây dựng lại. Các lần pull image Docker được thử lại với timeout giới hạn 180 giây cho mỗi lần thử để luồng registry/cache bị kẹt được thử lại nhanh thay vì tiêu tốn phần lớn đường găng CI.

### Các phần của đường phát hành

Phạm vi Docker phát hành chạy các job được chia nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phần chỉ pull loại image nó cần và thực thi nhiều lane thông qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các phần Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các alias Plugin/runtime tổng hợp. Alias lane `install-e2e` vẫn là alias chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu, và chỉ giữ một phần `openwebui` độc lập cho các điều phối chỉ dành cho OpenWebUI. Các lane cập nhật kênh đi kèm thử lại một lần khi có lỗi mạng npm tạm thời.

Mỗi phần tải lên `.artifacts/docker-tests/` cùng nhật ký lane, thời gian, `summary.json`, `failures.json`, thời gian từng pha, JSON kế hoạch bộ lập lịch, bảng lane chậm và lệnh chạy lại theo từng lane. Input `docker_lanes` của quy trình làm việc chạy các lane được chọn trên các image đã chuẩn bị thay vì các job phần, nhờ đó việc gỡ lỗi lane thất bại được giới hạn trong một job Docker nhắm mục tiêu và chuẩn bị, tải xuống hoặc tái sử dụng tạo tác gói cho lần chạy đó; nếu một lane được chọn là lane Docker live, job nhắm mục tiêu xây dựng image live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name` và input image đã chuẩn bị khi các giá trị đó tồn tại, để một lane thất bại có thể tái sử dụng đúng gói và image từ lần chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Quy trình làm việc live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Tiền phát hành Plugin

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, vì vậy đây là một quy trình làm việc riêng được điều phối bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Pull request thông thường, các lần push lên `main` và các điều phối CI thủ công độc lập giữ bộ này tắt. Nó cân bằng kiểm thử Plugin đi kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch Plugin nặng import không tạo thêm job CI. Đường tiền phát hành Docker chỉ dành cho phát hành gom các lane Docker nhắm mục tiêu thành các nhóm nhỏ để tránh giữ hàng chục runner cho các job một đến ba phút.

## QA Lab

QA Lab có các lane CI chuyên dụng bên ngoài quy trình làm việc có phạm vi thông minh chính. Parity agentic được lồng dưới các harness QA và phát hành rộng, không phải một quy trình làm việc PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi parity cần đi cùng một lần chạy xác thực rộng.

- Quy trình làm việc `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi điều phối thủ công; nó fan out lane mock parity, lane Matrix live, và các lane Telegram và Discord live thành các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Kiểm tra phát hành chạy các lane vận chuyển live Matrix và Telegram với provider mock xác định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được tách khỏi độ trễ model live và khởi động Plugin provider thông thường. Gateway vận chuyển live tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; kết nối provider được bao phủ bởi các bộ model live, provider native và provider Docker riêng.

Matrix dùng `--profile fast` cho các gate theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ. Mặc định CLI và input quy trình làm việc thủ công vẫn là `all`; điều phối thủ công `matrix_profile=all` luôn shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; gate QA parity của nó chạy các pack candidate và baseline dưới dạng các job lane song song, rồi tải cả hai tạo tác vào một job báo cáo nhỏ cho lần so sánh parity cuối cùng.

Với PR thông thường, hãy theo bằng chứng CI/check theo phạm vi thay vì xem parity là một trạng thái bắt buộc.

## CodeQL

Quy trình `CodeQL` được chủ ý thiết kế như một trình quét bảo mật bước đầu có phạm vi hẹp, không phải lượt quét toàn bộ kho lưu trữ. Các lượt chạy hằng ngày, thủ công và bảo vệ yêu cầu kéo không phải bản nháp sẽ quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript có rủi ro cao nhất bằng các truy vấn bảo mật có độ tin cậy cao, được lọc theo `security-severity` cao/nghiêm trọng.

Bộ bảo vệ yêu cầu kéo vẫn nhẹ: nó chỉ khởi động với các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` hoặc `src`, và chạy cùng ma trận bảo mật có độ tin cậy cao như workflow đã lên lịch. Android và macOS CodeQL không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron và đường cơ sở gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, gateway, Plugin SDK, secrets, các điểm chạm audit              |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, phân tích IP, network guard, web-fetch và các bề mặt chính sách SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, helper thực thi tiến trình, phân phối ra ngoài và các cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, tải nguồn và hợp đồng gói Plugin SDK |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF được tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chi phối runtime ngay cả khi sạch.

### Danh mục chất lượng nghiêm trọng

`CodeQL Critical Quality` là shard phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript phi bảo mật ở mức độ nghiêm trọng lỗi trên các bề mặt hẹp có giá trị cao trên runner Blacksmith Linux nhỏ hơn. Bộ bảo vệ yêu cầu kéo của nó cố ý nhỏ hơn hồ sơ đã lên lịch: PR không phải bản nháp chỉ chạy các shard tương ứng `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` và `plugin-sdk-reply-runtime` cho mã thực thi lệnh/mô hình/công cụ của agent và gửi trả lời, mã schema/migration/IO cấu hình, mã auth/secrets/sandbox/security, runtime kênh lõi và Plugin kênh đi kèm, giao thức Gateway/server-method, runtime bộ nhớ/keo SDK, MCP/process/phân phối ra ngoài, runtime provider/danh mục mô hình, chẩn đoán phiên/hàng đợi phân phối, loader Plugin, hợp đồng Plugin SDK/gói, hoặc các thay đổi runtime trả lời Plugin SDK. Các thay đổi cấu hình CodeQL và workflow chất lượng sẽ chạy cả mười hai shard chất lượng PR.

Gửi thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là hook hướng dẫn/lặp để chạy riêng một shard chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật auth, secrets, sandbox, cron và gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Schema cấu hình, migration, chuẩn hóa và hợp đồng IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đi kèm                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, điều phối mô hình/provider, điều phối và hàng đợi tự động trả lời, và hợp đồng runtime mặt phẳng điều khiển ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, helper giám sát tiến trình, và hợp đồng phân phối ra ngoài                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, keo kích hoạt runtime bộ nhớ và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, helper binding/phân phối phiên ra ngoài, bề mặt gói sự kiện/log chẩn đoán, và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đến Plugin SDK, helper payload/chunking/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối và helper binding phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, auth và khám phá provider, đăng ký runtime provider, mặc định/danh mục provider, và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap giao diện điều khiển, lưu trữ cục bộ, luồng điều khiển Gateway, và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Web fetch/search lõi, IO phương tiện, hiểu phương tiện, tạo ảnh và hợp đồng runtime tạo phương tiện                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, bề mặt công khai và hợp đồng điểm vào Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và helper hợp đồng gói plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc được chia shard sau khi các hồ sơ hẹp có runtime và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một lane bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi mới được land. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và gửi thủ công có thể chạy trực tiếp. Các lượt gọi workflow-run bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ vừa qua. Khi chạy, nó rà soát phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lượt chạy hằng giờ có thể bao phủ toàn bộ thay đổi main tích lũy kể từ lượt xử lý tài liệu trước.

### Test Performance Agent

Workflow `Test Performance Agent` là một lane bảo trì Codex theo sự kiện cho các bài kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lượt gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Gửi thủ công bỏ qua cổng hoạt động hằng ngày đó. Lane này tạo báo cáo hiệu năng Vitest được nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các sửa lỗi hiệu năng kiểm thử nhỏ vẫn giữ nguyên độ bao phủ thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng bài kiểm thử baseline đang pass. Nếu baseline có bài kiểm thử failing, Codex chỉ có thể sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau agent phải pass trước khi bất cứ thứ gì được commit. Khi `main` tiến lên trước khi bot push được land, lane này rebase bản vá đã xác thực, chạy lại `pnpm check:changed`, và thử push lại; các bản vá cũ bị xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub lưu trữ để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi merge

Workflow `Duplicate PRs After Merge` là workflow thủ công cho maintainer để dọn dẹp bản trùng lặp sau land. Nó mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi bản trùng lặp có issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- các thay đổi production lõi chạy typecheck core prod và core test cộng với lint/guard lõi;
- các thay đổi chỉ kiểm thử lõi chỉ chạy typecheck core test cộng với lint lõi;
- các thay đổi production extension chạy typecheck extension prod và extension test cộng với lint extension;
- các thay đổi chỉ kiểm thử extension chạy typecheck extension test cộng với lint extension;
- các thay đổi Plugin SDK công khai hoặc hợp đồng plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (các lượt quét extension Vitest vẫn là công việc kiểm thử tường minh);
- các lần bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- các thay đổi root/config không xác định fail safe sang tất cả lane kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý rẻ hơn `check:changed`: sửa trực tiếp bài kiểm thử thì chạy chính nó, sửa nguồn ưu tiên ánh xạ tường minh, sau đó là bài kiểm thử cùng cấp và phần phụ thuộc theo import-graph. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ tường minh: thay đổi cấu hình trả lời hiển thị với nhóm, chế độ phân phối trả lời nguồn, hoặc prompt hệ thống message-tool được định tuyến qua các bài kiểm thử trả lời lõi cộng với hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung fail trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập được ánh xạ rẻ không phải proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ thư mục gốc của repo và ưu tiên một box mới đã được làm nóng sẵn cho bằng chứng phạm vi rộng. Trước khi dùng một gate chậm trên một box đã được tái sử dụng, đã hết hạn, hoặc vừa báo cáo một lần đồng bộ lớn bất ngờ, hãy chạy `pnpm testbox:sanity` bên trong box trước.

Kiểm tra sanity thất bại nhanh khi các tệp gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 tệp đã theo dõi bị xóa. Điều đó thường có nghĩa là trạng thái đồng bộ từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng box đó và làm nóng một box mới thay vì gỡ lỗi lỗi kiểm thử sản phẩm. Với các PR cố ý xóa số lượng lớn, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng chấm dứt một lệnh gọi Blacksmith CLI cục bộ nếu lệnh đó ở trong giai đoạn đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt cơ chế bảo vệ đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là đường dẫn remote-box thứ hai do repo sở hữu cho bằng chứng Linux khi Blacksmith không khả dụng hoặc khi ưu tiên dùng dung lượng cloud được sở hữu. Làm nóng một box, hydrate nó thông qua workflow của dự án, rồi chạy lệnh qua Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` sở hữu các mặc định về provider, đồng bộ, và hydrate GitHub Actions. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa riêng của nó thay vì đồng bộ các remote và object store cục bộ của maintainer, đồng thời loại trừ các artifact runtime/build cục bộ không bao giờ nên được chuyển. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và phần chuyển giao môi trường không bí mật mà các lệnh `crabbox run --id <cbx_id>` về sau sẽ source.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
