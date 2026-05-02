---
read_when:
    - Bạn cần hiểu lý do một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lần chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi việc điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị tác vụ CI, các cổng kiểm tra theo phạm vi, các nhóm phát hành bao quát và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-02T20:42:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần push vào `main` và mọi pull request. Job `preflight` phân loại diff và tắt các luồng tốn kém khi chỉ những khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và bung toàn bộ đồ thị cho các bản ứng viên phát hành và xác thực diện rộng. Các luồng Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong workflow [`Plugin Prerelease`](#plugin-prerelease) riêng và chỉ chạy từ [`Full Release Validation`](#full-release-validation) hoặc một lần kích hoạt thủ công rõ ràng.

## Tổng quan pipeline

| Job                              | Mục đích                                                                                                   | Khi chạy                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ tài liệu, phạm vi đã đổi, extension đã đổi, và xây dựng manifest CI                   | Luôn chạy trên push và PR không phải bản nháp |
| `security-scm-fast`              | Phát hiện khóa riêng và kiểm tra workflow bằng `zizmor`                                                     | Luôn chạy trên push và PR không phải bản nháp |
| `security-dependency-audit`      | Kiểm tra lockfile production không cần dependency dựa trên advisory của npm                                          | Luôn chạy trên push và PR không phải bản nháp |
| `security-fast`                  | Tổng hợp bắt buộc cho các job bảo mật nhanh                                                             | Luôn chạy trên push và PR không phải bản nháp |
| `check-dependencies`             | Lượt chạy Knip chỉ kiểm tra dependency production cộng với bộ bảo vệ allowlist tệp chưa dùng                                 | Thay đổi liên quan đến Node              |
| `build-artifacts`                | Build `dist/`, Control UI, kiểm tra artifact đã build, và artifact hạ nguồn có thể tái sử dụng                       | Thay đổi liên quan đến Node              |
| `checks-fast-core`               | Các luồng kiểm tra đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                              | Thay đổi liên quan đến Node              |
| `checks-fast-contracts-channels` | Kiểm tra contract kênh được phân mảnh với kết quả kiểm tra tổng hợp ổn định                                      | Thay đổi liên quan đến Node              |
| `checks-node-core-test`          | Các phân mảnh kiểm thử Node lõi, loại trừ luồng kênh, bundled, contract, và extension                          | Thay đổi liên quan đến Node              |
| `check`                          | Tương đương cổng local chính được phân mảnh: kiểu production, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt                | Thay đổi liên quan đến Node              |
| `check-additional`               | Kiến trúc, ranh giới, guard bề mặt extension, ranh giới package, và các phân mảnh gateway-watch              | Thay đổi liên quan đến Node              |
| `build-smoke`                    | Kiểm thử smoke CLI đã build và smoke bộ nhớ khởi động                                                            | Thay đổi liên quan đến Node              |
| `checks`                         | Bộ xác minh cho kiểm thử kênh artifact đã build                                                                 | Thay đổi liên quan đến Node              |
| `checks-node-compat-node22`      | Luồng build và smoke tương thích Node 22                                                                | Kích hoạt CI thủ công cho phát hành    |
| `check-docs`                     | Định dạng tài liệu, lint, và kiểm tra liên kết hỏng                                                             | Tài liệu thay đổi                       |
| `skills-python`                  | Ruff + pytest cho Skills dựa trên Python                                                                    | Thay đổi liên quan đến skill Python      |
| `checks-windows`                 | Kiểm thử quy trình/đường dẫn riêng cho Windows cộng với hồi quy bộ chỉ định import runtime dùng chung                      | Thay đổi liên quan đến Windows           |
| `macos-node`                     | Luồng kiểm thử TypeScript trên macOS dùng artifact đã build dùng chung                                               | Thay đổi liên quan đến macOS             |
| `macos-swift`                    | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                            | Thay đổi liên quan đến macOS             |
| `android`                        | Kiểm thử đơn vị Android cho cả hai flavor cộng với một bản build APK debug                                              | Thay đổi liên quan đến Android           |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm hằng ngày bằng Codex sau hoạt động đáng tin cậy                                                 | CI main thành công hoặc kích hoạt thủ công |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các luồng mock-provider, deep-profile, và GPT 5.4 live | Theo lịch và kích hoạt thủ công      |

## Thứ tự fail-fast

1. `preflight` quyết định những luồng nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các luồng Linux nhanh để các bên tiêu thụ hạ nguồn có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các luồng nền tảng và runtime nặng hơn bung ra sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một push mới hơn được đưa lên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra phân mảnh tổng hợp dùng `!cancelled() && always()` để chúng vẫn báo cáo lỗi phân mảnh bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa đồng thời CI tự động được đánh phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy toàn bộ bộ kiểm thử thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang diễn ra.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Kích hoạt thủ công bỏ qua phát hiện phạm vi thay đổi và làm manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng tự thân chúng không buộc build native Windows, Android, hoặc macOS; các luồng nền tảng đó vẫn được giới hạn theo thay đổi nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, một số chỉnh sửa fixture kiểm thử lõi rẻ, và chỉnh sửa helper/test-routing contract Plugin hẹp** dùng đường manifest nhanh chỉ dành cho Node: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường này bỏ qua artifact build, tương thích Node 22, contract kênh, phân mảnh lõi đầy đủ, phân mảnh bundled-plugin, và ma trận guard bổ sung khi thay đổi bị giới hạn trong các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp thực thi.
- **Kiểm tra Node trên Windows** được giới hạn trong wrapper quy trình/đường dẫn riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package, và các bề mặt workflow CI thực thi luồng đó; nguồn, Plugin, install-smoke, và thay đổi chỉ kiểm thử không liên quan vẫn ở trên các luồng Node Linux.

Các họ kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không đặt trước quá nhiều máy chạy: contract kênh chạy thành ba phân mảnh có trọng số, các luồng đơn vị lõi nhỏ được ghép cặp, auto-reply chạy dưới dạng bốn worker cân bằng (với cây con reply được tách thành các phân mảnh agent-runner, dispatch, và commands/state-routing), và cấu hình agentic gateway/plugin được phân bổ trên các job Node agentic chỉ nguồn hiện có thay vì chờ artifact đã build. Các kiểm thử trình duyệt, QA, media, và Plugin linh tinh diện rộng dùng cấu hình Vitest chuyên dụng thay vì catch-all Plugin dùng chung. Các phân mảnh include-pattern ghi mục thời gian bằng tên phân mảnh CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với một phân mảnh đã lọc. `check-additional` giữ công việc biên dịch/canary ranh giới package cùng nhau và tách kiến trúc topo runtime khỏi phạm vi gateway watch; phân mảnh guard ranh giới chạy các guard độc lập nhỏ của nó đồng thời trong một job. Gateway watch, kiểm thử kênh, và phân mảnh ranh giới hỗ trợ lõi chạy đồng thời trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, rồi build APK debug Play. Flavor bên thứ ba không có source set hoặc manifest riêng; luồng kiểm thử đơn vị của nó vẫn biên dịch flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh một job đóng gói APK debug trùng lặp trên mọi push liên quan đến Android.

Phân mảnh `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ kiểm tra dependency production được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho bản cài `dlx`) và `pnpm deadcode:unused-files`, thao tác so sánh các phát hiện tệp production chưa dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp chưa dùng thất bại khi một PR thêm tệp chưa dùng mới chưa được rà soát hoặc để lại mục allowlist lỗi thời, đồng thời vẫn giữ các bề mặt Plugin động có chủ ý, generated, build, live-test, và cầu nối package mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động repository OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn luồng:

- `clawsweeper_item` cho yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho yêu cầu review cấp commit trên push vào `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Luồng `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, repository, số item, URL, tiêu đề, trạng thái, và trích đoạn ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ thân webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, workflow này đăng sự kiện đã chuẩn hóa tới hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải phân phối mặc định. Agent ClawSweeper nhận đích Discord trong prompt và chỉ nên đăng lên `#clawsweeper` khi sự kiện gây bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về mặt vận hành. Các lần mở, chỉnh sửa, hoạt động bot, nhiễu webhook trùng lặp, và lưu lượng review bình thường nên trả về `NO_REPLY`.

Xem tiêu đề, bình luận, thân nội dung, văn bản review, tên nhánh, và thông điệp commit của GitHub là dữ liệu không đáng tin cậy xuyên suốt đường này. Chúng là đầu vào cho việc tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Kích hoạt thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng bật bắt buộc mọi lane có phạm vi không phải Android: các shard Linux Node, shard Plugin đi kèm, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, kiểm thử khói build, kiểm tra tài liệu, Skills Python, Windows, macOS và i18n Control UI. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Các kiểm tra tĩnh prerelease Plugin, shard chỉ dành cho phát hành `agentic-plugins`, lượt quét batch extension đầy đủ và các lane Docker prerelease Plugin bị loại khỏi CI. Bộ prerelease Docker chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với cổng release-validation được bật.

Các lần chạy thủ công dùng một nhóm concurrency duy nhất để bộ đầy đủ release-candidate không bị hủy bởi một lần chạy push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một branch, tag hoặc commit SHA đầy đủ trong khi dùng tệp workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Trình chạy

| Trình chạy                       | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các job bảo mật nhanh và job tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), kiểm tra giao thức/hợp đồng/Plugin đi kèm nhanh, kiểm tra hợp đồng kênh dạng shard, các shard `check` trừ lint, các shard và job tổng hợp `check-additional`, trình xác minh tổng hợp kiểm thử Node, kiểm tra tài liệu, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub host để ma trận Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard kiểm thử Linux Node, shard kiểm thử Plugin đi kèm, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (đủ nhạy CPU đến mức 8 vCPU tốn kém hơn phần tiết kiệm được); build Docker install-smoke (thời gian xếp hàng 32-vCPU tốn kém hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` là workflow hiệu năng sản phẩm/runtime. Nó chạy hằng ngày trên `main` và có thể được dispatch thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow cài đặt OCM từ một bản phát hành được ghim và Kova từ input `kova_ref` được ghim, rồi chạy ba lane:

- `mock-provider`: các kịch bản chẩn đoán Kova trên runtime build cục bộ với xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: profiling CPU/heap/trace cho các điểm nóng khi khởi động, Gateway và lượt agent.
- `live-gpt54`: một lượt agent OpenAI `openai/gpt-5.4` thật, được bỏ qua khi `OPENAI_API_KEY` không khả dụng.

Lane mock-provider cũng chạy các probe nguồn native của OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ trên các trường hợp khởi động mặc định, hook và 50-Plugin; các vòng lặp hello `channel-chat-baseline` mock-OpenAI lặp lại; và các lệnh khởi động CLI trên Gateway đã khởi động. Tóm tắt Markdown của probe nguồn nằm tại `source/index.md` trong gói báo cáo, với JSON thô đặt bên cạnh.

Mỗi lane đều upload artifact GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các bundle, `index.md` và artifact source-probe vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Con trỏ branch hiện tại được ghi dưới dạng `openclaw-performance/<ref>/latest-<lane>.json`.

## Xác thực phát hành đầy đủ

`Full Release Validation` là workflow umbrella thủ công cho "chạy mọi thứ trước khi phát hành". Nó nhận một branch, tag hoặc commit SHA đầy đủ, dispatch workflow `CI` thủ công với target đó, dispatch `Plugin Prerelease` để có bằng chứng Plugin/package/static/Docker chỉ dành cho phát hành, và dispatch `OpenClaw Release Checks` cho install smoke, package acceptance, các bộ release-path Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix và các lane Telegram. Với `rerun_group=all` và `release_profile=full`, nó cũng chạy `NPM Telegram Beta E2E` trên artifact `release-package-under-test` từ release checks. Sau khi publish, truyền `npm_telegram_package_spec` để chạy lại cùng lane package Telegram trên package npm đã publish.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận stage, tên job workflow chính xác, khác biệt giữa các profile, artifact và
các handle chạy lại có trọng tâm.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Dispatch nó
từ `release/YYYY.M.D` hoặc `main` sau khi tag phát hành đã tồn tại và sau khi
preflight npm OpenClaw đã thành công. Nó xác minh `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` cho tất cả package Plugin có thể publish, dispatch
`Plugin ClawHub Release` cho cùng SHA phát hành, và chỉ sau đó mới dispatch
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

Các ref dispatch workflow GitHub phải là branch hoặc tag, không phải commit SHA thô. Helper
push một branch tạm thời `release-ci/<sha>-...` tại SHA target,
dispatch `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con
có `headSha` khớp với target, và xóa branch tạm thời khi lần chạy hoàn tất. Trình xác minh umbrella cũng thất bại nếu bất kỳ workflow con nào chạy ở
SHA khác.

`release_profile` kiểm soát độ rộng live/provider được truyền vào release checks. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn
cố ý muốn ma trận provider/media tư vấn rộng.

- `minimum` giữ các lane OpenAI/core nhanh nhất và thiết yếu cho phát hành.
- `stable` thêm tập provider/backend ổn định.
- `full` chạy ma trận provider/media tư vấn rộng.

Umbrella ghi lại id các lần chạy con đã dispatch, và job cuối cùng `Verify full validation` kiểm tra lại kết luận hiện tại của các lần chạy con và nối thêm bảng job chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại job xác minh cha để làm mới kết quả umbrella và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Use `all` for a release candidate, `ci` for only the normal full CI child, `plugin-prerelease` for only the plugin prerelease child, `release-checks` for every release child, or a narrower group: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, or `npm-telegram` on the umbrella. Điều này giữ cho việc chạy lại một hộp phát hành bị lỗi được giới hạn sau một bản sửa tập trung.

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

Khi gỡ lỗi một lần chạy chấp nhận gói bị lỗi, hãy bắt đầu ở phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời gian từng phase và các lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói bị lỗi hoặc các lane Docker chính xác thay vì chạy lại toàn bộ xác thực bản phát hành.

## Kiểm tra nhanh cài đặt

Workflow `Install Smoke` riêng dùng lại cùng script phạm vi thông qua job `preflight` riêng. Nó chia phạm vi kiểm tra nhanh thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường nhanh** chạy cho các pull request chạm tới bề mặt Docker/gói, thay đổi gói/manifest plugin đi kèm, hoặc các bề mặt plugin/channel/gateway/Plugin SDK lõi mà các job kiểm tra nhanh Docker thực thi. Các thay đổi plugin đi kèm chỉ ở mã nguồn, chỉnh sửa chỉ liên quan đến kiểm thử và chỉnh sửa chỉ liên quan đến tài liệu không giữ trước worker Docker. Đường nhanh build image Dockerfile gốc một lần, kiểm tra CLI, chạy kiểm tra nhanh CLI xóa agents trong shared-workspace, chạy e2e gateway-network trong container, xác minh build arg phần mở rộng đi kèm và chạy hồ sơ Docker plugin đi kèm có giới hạn trong timeout lệnh tổng hợp 240 giây (mỗi Docker run của kịch bản được giới hạn riêng).
- **Đường đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update installer cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call và các pull request thực sự chạm tới bề mặt installer/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc dùng lại một image kiểm tra nhanh Dockerfile gốc GHCR theo target-SHA, rồi chạy cài đặt gói QR, kiểm tra nhanh Dockerfile/gateway gốc, kiểm tra nhanh installer/update và Docker E2E plugin đi kèm đường nhanh dưới dạng các job riêng để công việc installer không phải chờ sau các kiểm tra nhanh image gốc.

Các lần push lên `main` (bao gồm cả merge commit) không ép dùng đường đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một lần push, workflow giữ kiểm tra nhanh Docker đường nhanh và để kiểm tra nhanh cài đặt đầy đủ cho lịch hằng đêm hoặc xác thực bản phát hành.

Kiểm tra nhanh image-provider cài đặt global Bun chậm được kiểm soát riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, đồng thời các dispatch `Install Smoke` thủ công có thể chọn tham gia, nhưng pull request và các lần push lên `main` thì không. Các kiểm thử QR và installer Docker giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` build trước một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm và build hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane installer/update/plugin-dependency;
- một image chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn image cho từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, sau đó chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số tinh chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Số slot pool chính cho các lane thông thường.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Số slot pool đuôi nhạy với provider.                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Giới hạn lane live đồng thời để provider không throttle.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Giới hạn lane đa dịch vụ đồng thời.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Khoảng giãn giữa các lần khởi động lane để tránh bão tạo Docker daemon; đặt `0` để không giãn. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Timeout dự phòng cho mỗi lane (120 phút); các lane live/tail được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` in kế hoạch bộ lập lịch mà không chạy lane.                                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Danh sách lane chính xác phân tách bằng dấu phẩy; bỏ qua kiểm tra nhanh dọn dẹp để agents có thể tái hiện một lane bị lỗi. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể khởi động từ một pool rỗng, rồi chạy một mình cho đến khi nhả dung lượng. Các bước preflight tổng hợp cục bộ kiểm tra Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời gian lane để sắp xếp lane lâu nhất trước, và mặc định dừng lập lịch lane trong pool mới sau lỗi đầu tiên.

### Workflow live/E2E dùng lại được

Workflow live/E2E dùng lại được hỏi `scripts/test-docker-all.mjs --plan-json` để biết gói, loại image, image live, lane và phạm vi credential cần thiết. Sau đó `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại, hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; build và push các image Docker E2E GHCR bare/functional được gắn tag theo digest gói thông qua cache layer Docker của Blacksmith khi kế hoạch cần các lane đã cài đặt gói; và dùng lại input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các image theo digest gói hiện có thay vì build lại. Các lần pull image Docker được thử lại với timeout 180 giây có giới hạn cho mỗi lần thử để một luồng registry/cache bị kẹt sẽ retry nhanh thay vì chiếm phần lớn đường găng CI.

### Các phần trong đường phát hành

Phạm vi Docker phát hành chạy các job chia phần nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phần chỉ pull loại image cần thiết và thực thi nhiều lane qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các phần Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các bí danh tổng hợp plugin/runtime. Bí danh lane `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai lane installer provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu, và chỉ giữ phần `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật bundled-channel thử lại một lần khi gặp lỗi mạng npm tạm thời.

Mỗi phần tải lên `.artifacts/docker-tests/` với nhật ký lane, thời gian, `summary.json`, `failures.json`, thời gian phase, JSON kế hoạch bộ lập lịch, bảng lane chậm và lệnh chạy lại theo từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn trên những image đã chuẩn bị thay vì các job chia phần, giữ việc gỡ lỗi lane bị lỗi trong phạm vi một job Docker có mục tiêu và chuẩn bị, tải xuống hoặc dùng lại artifact gói cho lần chạy đó; nếu một lane được chọn là lane Docker live, job mục tiêu sẽ build image live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name` và các input image đã chuẩn bị khi những giá trị đó tồn tại, để một lane bị lỗi có thể dùng lại chính xác gói và image từ lần chạy lỗi.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Bản phát hành trước Plugin

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, lần push lên `main` và dispatch CI thủ công độc lập không bật bộ này. Nó cân bằng các kiểm thử plugin đi kèm trên tám worker phần mở rộng; các job shard phần mở rộng đó chạy tối đa hai nhóm cấu hình plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các lô plugin nặng import không tạo thêm job CI. Đường phát hành trước Docker chỉ dành cho phát hành gom các lane Docker có mục tiêu thành các nhóm nhỏ để tránh giữ trước hàng chục runner cho các job một đến ba phút.

## QA Lab

QA Lab có các lane CI chuyên dụng bên ngoài workflow chính có phạm vi thông minh. Agentic parity nằm lồng dưới các bộ QA rộng và phát hành, không phải workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi parity nên đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó tỏa ra lane mock parity, lane Matrix live, và các lane Telegram và Discord live dưới dạng các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng Convex lease.

Các kiểm tra phát hành chạy các lane transport live Matrix và Telegram với provider mock xác định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để contract channel được cô lập khỏi độ trễ model live và startup provider-plugin thông thường. Gateway transport live tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; kết nối provider được bao phủ bởi các bộ model live, provider native và provider Docker riêng.

Matrix dùng `--profile fast` cho các gate theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard toàn bộ phạm vi Matrix thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; gate QA parity của nó chạy các gói candidate và baseline dưới dạng các job lane song song, sau đó tải cả hai artifact vào một job báo cáo nhỏ cho so sánh parity cuối cùng.

Với PR thông thường, hãy theo bằng chứng CI/check có phạm vi thay vì coi parity là trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` chủ ý là trình quét bảo mật lượt đầu có phạm vi hẹp, không phải lượt quét toàn bộ kho lưu trữ. Các lượt bảo vệ hằng ngày, thủ công và yêu cầu kéo không phải bản nháp sẽ quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript có rủi ro cao nhất bằng các truy vấn bảo mật độ tin cậy cao, được lọc theo `security-severity` cao/nghiêm trọng.

Cơ chế bảo vệ yêu cầu kéo vẫn nhẹ: nó chỉ khởi động với các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. Android và macOS CodeQL không nằm trong mặc định cho PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Xác thực, bí mật, sandbox, cron và nền tảng Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cộng với runtime Plugin kênh, Gateway, Plugin SDK, bí mật, điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | Bề mặt SSRF lõi, phân tích IP, bảo vệ mạng, web-fetch và chính sách SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, trình trợ giúp thực thi tiến trình, phân phối đi và cổng thực thi công cụ của tác tử                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Bề mặt tin cậy của cài đặt Plugin, trình tải, manifest, registry, cài đặt package-manager, tải nguồn và hợp đồng gói Plugin SDK |

### Mảnh bảo mật theo nền tảng

- `CodeQL Android Critical Security` — mảnh bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — mảnh bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF được tải lên và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chi phối thời gian chạy ngay cả khi sạch.

### Danh mục chất lượng nghiêm trọng

`CodeQL Critical Quality` là mảnh không bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không thuộc bảo mật, mức độ lỗi, trên các bề mặt hẹp có giá trị cao, bằng runner Blacksmith Linux nhỏ hơn. Cơ chế bảo vệ yêu cầu kéo của nó chủ ý nhỏ hơn hồ sơ theo lịch: các PR không phải bản nháp chỉ chạy các mảnh tương ứng `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` và `plugin-sdk-reply-runtime` cho các thay đổi về mã thực thi lệnh/mô hình/công cụ của tác tử và điều phối trả lời, mã lược đồ/cấu hình/di trú/IO, mã xác thực/bí mật/sandbox/bảo mật, runtime kênh lõi và Plugin kênh đi kèm, phương thức máy chủ/giao thức Gateway, runtime bộ nhớ/keo SDK, MCP/tiến trình/phân phối đi, catalog mô hình/runtime nhà cung cấp, hàng đợi chẩn đoán phiên/phân phối, trình tải Plugin, Plugin SDK/hợp đồng gói, hoặc runtime trả lời Plugin SDK. Các thay đổi về cấu hình CodeQL và workflow chất lượng chạy tất cả mười hai mảnh chất lượng PR.

Điều phối thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là móc dạy/lặp để chạy riêng một mảnh chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật xác thực, bí mật, sandbox, cron và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Hợp đồng lược đồ cấu hình, di trú, chuẩn hóa và IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Lược đồ giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đi kèm                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Hợp đồng runtime thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi trả lời tự động, và mặt phẳng điều khiển ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình, và hợp đồng phân phối đi                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, bí danh Plugin SDK bộ nhớ, keo kích hoạt runtime bộ nhớ và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, trình trợ giúp ràng buộc/phân phối phiên đi, bề mặt gói sự kiện/nhật ký chẩn đoán và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời vào Plugin SDK, trình trợ giúp payload/chunking/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối và trình trợ giúp ràng buộc phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa catalog mô hình, xác thực và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/catalog nhà cung cấp và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI điều khiển, lưu trữ cục bộ, luồng điều khiển Gateway và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime fetch/search web lõi, IO media, hiểu media, tạo ảnh và tạo media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng trình tải, registry, bề mặt công khai và điểm vào Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã xuất bản và trình trợ giúp hợp đồng gói plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc phân mảnh sau khi các hồ sơ hẹp có thời gian chạy và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một làn bảo trì Codex theo sự kiện để giữ tài liệu hiện có khớp với các thay đổi mới được đưa vào. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và điều phối thủ công có thể chạy trực tiếp. Các lần gọi workflow-run sẽ bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ gần nhất. Khi chạy, nó xem xét phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, nên một lượt chạy hằng giờ có thể bao phủ tất cả thay đổi trên main được tích lũy kể từ lượt tài liệu gần nhất.

### Test Performance Agent

Workflow `Test Performance Agent` là một làn bảo trì Codex theo sự kiện cho các bài kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Điều phối thủ công bỏ qua cổng hoạt động hằng ngày đó. Làn này build báo cáo hiệu năng Vitest được nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các sửa hiệu năng kiểm thử nhỏ vẫn giữ nguyên phạm vi bao phủ thay vì các refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối thay đổi làm giảm số bài kiểm thử baseline đang pass. Nếu baseline có bài kiểm thử fail, Codex chỉ có thể sửa các lỗi hiển nhiên và báo cáo toàn bộ bộ kiểm thử sau tác tử phải pass trước khi bất cứ thứ gì được commit. Khi `main` tiến lên trước khi lượt push của bot được đưa vào, làn này rebase bản vá đã được xác thực, chạy lại `pnpm check:changed` và thử push lại; các bản vá cũ xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub host để action Codex có thể giữ cùng tư thế an toàn drop-sudo như tác tử tài liệu.

### PR trùng lặp sau khi hợp nhất

Workflow `Duplicate PRs After Merge` là workflow thủ công cho maintainer để dọn dẹp trùng lặp sau khi đưa vào. Mặc định là chạy thử và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã đưa vào đã được hợp nhất và mỗi bản trùng lặp có hoặc một issue tham chiếu chung hoặc các hunk thay đổi chồng lấp.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck production lõi và kiểm thử lõi cộng với lint/guard lõi;
- thay đổi chỉ kiểm thử lõi chỉ chạy typecheck kiểm thử lõi cộng với lint lõi;
- thay đổi production extension chạy typecheck production extension và kiểm thử extension cộng với lint extension;
- thay đổi chỉ kiểm thử extension chạy typecheck kiểm thử extension cộng với lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng plugin mở rộng sang typecheck extension vì extensions phụ thuộc vào các hợp đồng lõi đó (các lượt quét extension Vitest vẫn là công việc kiểm thử rõ ràng);
- các lượt tăng phiên bản chỉ metadata phát hành chạy kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- thay đổi root/cấu hình không xác định fail an toàn sang tất cả các làn kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và chủ ý rẻ hơn `check:changed`: các chỉnh sửa kiểm thử trực tiếp tự chạy chúng, chỉnh sửa nguồn ưu tiên ánh xạ rõ ràng, sau đó là kiểm thử anh em và phần phụ thuộc theo import-graph. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ rõ ràng: thay đổi đối với cấu hình trả lời hiển thị trong nhóm, chế độ phân phối trả lời nguồn, hoặc prompt hệ thống của message-tool được định tuyến qua các bài kiểm thử trả lời lõi cộng với hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung fail trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập ánh xạ rẻ không còn là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ gốc repo và ưu tiên một box mới đã được khởi động sẵn để kiểm chứng diện rộng. Trước khi dành một cổng kiểm tra chậm cho một box đã được tái sử dụng, đã hết hạn, hoặc vừa báo cáo một lần đồng bộ lớn bất thường, hãy chạy `pnpm testbox:sanity` bên trong box trước.

Kiểm tra sanity sẽ thất bại nhanh khi các tệp gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 mục xóa có theo dõi. Điều đó thường có nghĩa là trạng thái đồng bộ từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng box đó và khởi động sẵn một box mới thay vì gỡ lỗi lỗi kiểm thử sản phẩm. Với các PR cố ý xóa số lượng lớn, hãy đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng chấm dứt một lệnh gọi Blacksmith CLI cục bộ nếu lệnh đó ở trong giai đoạn đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt cơ chế bảo vệ đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là hướng box từ xa thứ hai do repo sở hữu để kiểm chứng trên Linux khi Blacksmith không khả dụng hoặc khi nên dùng năng lực đám mây do dự án sở hữu. Khởi động sẵn một box, hydrate nó thông qua workflow của dự án, rồi chạy lệnh qua Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` quản lý các mặc định về nhà cung cấp, đồng bộ và hydrate GitHub Actions. Nó loại trừ `.git` cục bộ để checkout Actions đã được hydrate giữ metadata Git từ xa của riêng nó thay vì đồng bộ các remote và kho đối tượng cục bộ của maintainer, đồng thời loại trừ các artifact runtime/build cục bộ không bao giờ nên được chuyển đi. `.github/workflows/crabbox-hydrate.yml` quản lý checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không bí mật mà các lệnh `crabbox run --id <cbx_id>` sau đó sẽ source.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
