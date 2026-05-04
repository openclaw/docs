---
read_when:
    - Bạn cần hiểu lý do một tác vụ CI đã chạy hay không chạy
    - Bạn đang gỡ lỗi một bước kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lần chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi việc điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị tác vụ CI, cổng kiểm tra theo phạm vi, các nhóm bao quát phát hành và lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-04T07:03:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần push lên `main` và mọi pull request. Job `preflight` phân loại diff và tắt các lane tốn kém khi chỉ có các khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho release candidate và kiểm thử diện rộng. Các lane Android vẫn là tùy chọn qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong workflow [`Plugin Prerelease`](#plugin-prerelease) riêng và chỉ chạy từ [`Full Release Validation`](#full-release-validation) hoặc một dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                              | Mục đích                                                                                                   | Khi chạy                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ liên quan đến tài liệu, phạm vi đã thay đổi, extension đã thay đổi, và dựng manifest CI | Luôn chạy trên các push và PR không phải draft |
| `security-scm-fast`              | Phát hiện khóa riêng tư và audit workflow qua `zizmor`                                                     | Luôn chạy trên các push và PR không phải draft |
| `security-dependency-audit`      | Audit lockfile production không cần dependency dựa trên advisory của npm                                   | Luôn chạy trên các push và PR không phải draft |
| `security-fast`                  | Tổng hợp bắt buộc cho các job bảo mật nhanh                                                               | Luôn chạy trên các push và PR không phải draft |
| `check-dependencies`             | Lượt kiểm tra Knip production chỉ cho dependency cộng với guard allowlist tệp không dùng                  | Thay đổi liên quan đến Node         |
| `build-artifacts`                | Dựng `dist/`, Control UI, kiểm tra artifact đã dựng, và artifact downstream có thể tái sử dụng             | Thay đổi liên quan đến Node         |
| `checks-fast-core`               | Các lane kiểm tra đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                 | Thay đổi liên quan đến Node         |
| `checks-fast-contracts-channels` | Kiểm tra contract kênh theo shard với kết quả kiểm tra tổng hợp ổn định                                   | Thay đổi liên quan đến Node         |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, không bao gồm lane channel, bundled, contract, và extension                  | Thay đổi liên quan đến Node         |
| `check`                          | Tương đương gate cục bộ chính theo shard: kiểu production, lint, guard, kiểu test, và smoke nghiêm ngặt   | Thay đổi liên quan đến Node         |
| `check-additional`               | Kiến trúc, drift boundary/prompt theo shard, guard extension, boundary package, và gateway watch          | Thay đổi liên quan đến Node         |
| `build-smoke`                    | Smoke test CLI đã dựng và smoke startup-memory                                                            | Thay đổi liên quan đến Node         |
| `checks`                         | Bộ xác minh cho kiểm thử kênh của artifact đã dựng                                                        | Thay đổi liên quan đến Node         |
| `checks-node-compat-node22`      | Lane dựng và smoke tương thích Node 22                                                                    | Dispatch CI thủ công cho bản phát hành |
| `check-docs`                     | Kiểm tra định dạng tài liệu, lint, và liên kết hỏng                                                       | Tài liệu thay đổi                   |
| `skills-python`                  | Ruff + pytest cho skills dựa trên Python                                                                  | Thay đổi liên quan đến skill Python |
| `checks-windows`                 | Kiểm thử process/path dành riêng cho Windows cộng với hồi quy import specifier runtime dùng chung         | Thay đổi liên quan đến Windows      |
| `macos-node`                     | Lane kiểm thử TypeScript trên macOS dùng artifact đã dựng dùng chung                                      | Thay đổi liên quan đến macOS        |
| `macos-swift`                    | Swift lint, build, và test cho ứng dụng macOS                                                             | Thay đổi liên quan đến macOS        |
| `android`                        | Unit test Android cho cả hai flavor cộng với một bản dựng debug APK                                       | Thay đổi liên quan đến Android      |
| `test-performance-agent`         | Tối ưu hóa test chậm Codex hằng ngày sau hoạt động đáng tin cậy                                           | CI trên main thành công hoặc dispatch thủ công |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile, và live GPT 5.4 | Theo lịch và dispatch thủ công      |

## Thứ tự fail-fast

1. `preflight` quyết định lane nào thực sự tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chồng lấp với các lane Linux nhanh để các consumer downstream có thể bắt đầu ngay khi bản dựng dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn mở rộng sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một push mới hơn được đưa lên cùng PR hoặc ref `main`. Hãy coi đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` nên chúng vẫn báo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa concurrency CI tự động được đánh phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô hạn các lần chạy main mới hơn. Các lần chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang diễn ra.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi unit test trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với linting workflow, nhưng không tự ép các bản dựng native Windows, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi nguồn của nền tảng.
- **Chỉnh sửa chỉ liên quan đến định tuyến CI, một số chỉnh sửa fixture core-test rẻ, và chỉnh sửa helper/test-routing contract Plugin hẹp** dùng đường dẫn manifest nhanh chỉ Node: `preflight`, security, và một tác vụ `checks-fast-core` duy nhất. Đường dẫn đó bỏ qua artifact dựng, tương thích Node 22, contract kênh, toàn bộ shard lõi, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn trong các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp thực thi.
- **Kiểm tra Node trên Windows** được giới hạn ở wrapper process/path dành riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package, và các bề mặt workflow CI thực thi lane đó; các thay đổi source, Plugin, install-smoke, và chỉ test không liên quan vẫn ở trên các lane Node Linux.

Các họ test Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không giữ runner quá mức: contract kênh chạy thành ba shard có trọng số, lane core unit fast/support chạy riêng, hạ tầng runtime lõi được tách giữa các shard state và process/config, auto-reply chạy như các worker cân bằng (với cây con reply tách thành các shard agent-runner, dispatch, và commands/state-routing), và cấu hình gateway/server dạng agentic được tách qua các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã dựng. Các test browser, QA, media, và Plugin hỗn hợp diện rộng dùng cấu hình Vitest chuyên dụng thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi mục timing bằng tên shard CI, nên `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ config với một shard đã lọc. `check-additional` giữ công việc compile/canary package-boundary cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; danh sách guard boundary được chia sọc trên bốn shard ma trận, mỗi shard chạy đồng thời các guard độc lập đã chọn và in timing theo từng kiểm tra, bao gồm `pnpm prompt:snapshots:check` để drift prompt happy-path của runtime Codex được ghim vào PR đã gây ra nó. Gateway watch, test kênh, và shard core support-boundary chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được dựng.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, rồi dựng Play debug APK. Flavor third-party không có source set hoặc manifest riêng; lane unit-test của nó vẫn compile flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh một job đóng gói debug APK trùng lặp trên mọi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip production chỉ cho dependency được ghim vào phiên bản Knip mới nhất, với độ tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh các phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được review hoặc để lại mục allowlist cũ, đồng thời giữ lại các bề mặt Plugin động, generated, build, live-test, và package bridge có chủ đích mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động repository OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` nhỏ gọn đến `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho các yêu cầu review chính xác với issue và pull request;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong comment issue;
- `clawsweeper_commit_review` cho các yêu cầu review ở cấp commit trên các push `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại event, action, actor, repository, số item, URL, title, state, và đoạn trích ngắn cho comment hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ body Webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng event đã chuẩn hóa đến hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải mặc định phân phối. Agent ClawSweeper nhận đích Discord trong prompt của nó và chỉ nên đăng vào `#clawsweeper` khi event gây bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về vận hành. Các lượt mở, chỉnh sửa, biến động bot, nhiễu Webhook trùng lặp, và lưu lượng review bình thường nên trả về `NO_REPLY`.

Xem title, comment, body, văn bản review, tên nhánh, và commit message trên GitHub là dữ liệu không đáng tin cậy xuyên suốt đường dẫn này. Chúng là đầu vào cho tóm tắt và triage, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng buộc bật mọi lane có phạm vi không phải Android: các shard Linux Node, các shard Plugin đóng gói sẵn, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Python skills, Windows, macOS và Control UI i18n. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; ô bao phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Các kiểm tra tĩnh tiền phát hành Plugin, shard chỉ dành cho phát hành `agentic-plugins`, lượt quét batch extension đầy đủ và các lane Docker tiền phát hành Plugin bị loại khỏi CI. Bộ tiền phát hành Docker chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với cổng xác thực phát hành được bật.

Các lượt chạy thủ công dùng một nhóm đồng thời duy nhất để một bộ đầy đủ cho ứng viên phát hành không bị hủy bởi một lượt push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một branch, tag hoặc commit SHA đầy đủ trong khi dùng tệp workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các job bảo mật nhanh và tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), các kiểm tra giao thức/hợp đồng/Plugin đóng gói sẵn nhanh, kiểm tra hợp đồng kênh theo shard, các shard `check` ngoại trừ lint, các shard và tổng hợp `check-additional`, trình xác minh tổng hợp kiểm thử Node, kiểm tra tài liệu, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight cũng dùng Ubuntu do GitHub lưu trữ để ma trận Blacksmith có thể vào hàng đợi sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Linux Node, các shard kiểm thử Plugin đóng gói sẵn, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (đủ nhạy với CPU để 8 vCPU tốn chi phí nhiều hơn mức tiết kiệm được); các build Docker install-smoke (thời gian hàng đợi 32-vCPU tốn nhiều hơn mức tiết kiệm được)                                                                                                                                                                                                                                                                                                                     |
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

`OpenClaw Performance` là workflow hiệu năng sản phẩm/runtime. Nó chạy hằng ngày trên `main` và có thể được dispatch thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch thủ công thường benchmark ref của workflow. Đặt `target_ref` để benchmark một tag phát hành hoặc branch khác bằng triển khai workflow hiện tại. Đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được khóa theo ref được kiểm thử, và mỗi `index.md` ghi lại ref/SHA được kiểm thử, ref/SHA workflow, ref Kova, hồ sơ, chế độ xác thực lane, mô hình, số lần lặp và bộ lọc kịch bản.

Workflow cài đặt OCM từ một bản phát hành đã ghim và Kova từ `openclaw/Kova` tại input `kova_ref` đã ghim, rồi chạy ba lane:

- `mock-provider`: Các kịch bản chẩn đoán Kova đối với runtime build cục bộ với xác thực giả tương thích OpenAI mang tính xác định.
- `mock-deep-profile`: Lập hồ sơ CPU/heap/trace cho các hotspot khởi động, Gateway và lượt agent.
- `live-gpt54`: Một lượt agent OpenAI `openai/gpt-5.4` thật, bị bỏ qua khi không có `OPENAI_API_KEY`.

Lane mock-provider cũng chạy các probe nguồn gốc OpenClaw-native sau lượt Kova: thời gian khởi động Gateway và bộ nhớ qua các trường hợp khởi động mặc định, hook và 50-Plugin; các vòng lặp hello `channel-chat-baseline` mock-OpenAI lặp lại; và các lệnh khởi động CLI đối với Gateway đã khởi động. Tóm tắt Markdown của probe nguồn nằm tại `source/index.md` trong gói báo cáo, với JSON thô bên cạnh.

Mọi lane đều tải lên artifact GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, bundle, `index.md` và artifact probe nguồn vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ ref được kiểm thử hiện tại được ghi là `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực bản phát hành đầy đủ

`Full Release Validation` là workflow ô bao thủ công cho "chạy mọi thứ trước khi phát hành." Nó nhận một branch, tag hoặc commit SHA đầy đủ, dispatch workflow `CI` thủ công với target đó, dispatch `Plugin Prerelease` cho bằng chứng Plugin/gói/tĩnh/Docker chỉ dành cho phát hành, và dispatch `OpenClaw Release Checks` cho smoke cài đặt, chấp nhận gói, các bộ đường dẫn phát hành Docker, live/E2E, OpenWebUI, tính tương đồng QA Lab, Matrix và các lane Telegram. Với `rerun_group=all` và `release_profile=full`, nó cũng chạy `NPM Telegram Beta E2E` đối với artifact `release-package-under-test` từ kiểm tra phát hành. Sau khi xuất bản, truyền `npm_telegram_package_spec` để chạy lại cùng lane gói Telegram đối với gói npm đã xuất bản.

Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận stage, tên job workflow chính xác, khác biệt giữa các hồ sơ, artifact và
handle chạy lại có trọng tâm.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Dispatch nó
từ `release/YYYY.M.D` hoặc `main` sau khi tag phát hành tồn tại và sau khi
preflight npm OpenClaw đã thành công. Nó xác minh `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` cho mọi gói Plugin có thể xuất bản, dispatch
`Plugin ClawHub Release` cho cùng release SHA, và chỉ sau đó dispatch
`OpenClaw NPM Release` với `preflight_run_id` đã lưu.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit đã ghim trên một branch thay đổi nhanh, hãy dùng helper thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref dispatch workflow GitHub phải là branch hoặc tag, không phải commit SHA thô. Helper
push một branch tạm thời `release-ci/<sha>-...` tại SHA target,
dispatch `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con
`headSha` khớp với target, và xóa branch tạm thời khi lượt chạy hoàn tất.
Trình xác minh ô bao cũng fail nếu bất kỳ workflow con nào chạy ở
SHA khác.

`release_profile` kiểm soát phạm vi live/provider được truyền vào các bước kiểm tra phát hành. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn cố ý muốn ma trận provider/media tư vấn rộng.

- `minimum` giữ các lane OpenAI/core quan trọng cho phát hành nhanh nhất.
- `stable` thêm tập provider/backend ổn định.
- `full` chạy ma trận provider/media tư vấn rộng.

Umbrella ghi lại các id lần chạy con đã dispatch, và job `Verify full validation` cuối cùng kiểm tra lại kết luận hiện tại của các lần chạy con rồi thêm các bảng job chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại job xác minh của parent để làm mới kết quả umbrella và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho một release candidate, `ci` chỉ cho child CI đầy đủ thông thường, `plugin-prerelease` chỉ cho child prerelease Plugin, `release-checks` cho mọi release child, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên umbrella. Cách này giữ việc chạy lại một hộp phát hành thất bại trong phạm vi giới hạn sau một bản sửa tập trung.

`OpenClaw Release Checks` dùng trusted workflow ref để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho cả workflow Docker live/E2E theo đường dẫn phát hành và shard chấp nhận gói. Điều đó giữ byte của gói nhất quán trên các hộp phát hành và tránh đóng gói lại cùng một candidate trong nhiều job con.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
sẽ thay thế umbrella cũ hơn. Parent monitor hủy mọi workflow con mà nó
đã dispatch khi parent bị hủy, nên validation main mới hơn
không bị kẹt sau một lần chạy release-check đã cũ kéo dài hai giờ. Validation branch/tag
phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Các shard Live và E2E

Child live/E2E phát hành giữ phạm vi bao phủ rộng của `pnpm test:live` native, nhưng chạy phạm vi đó dưới dạng các shard có tên qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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

Điều đó giữ nguyên phạm vi bao phủ file trong khi làm cho các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được xây dựng bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ live dựa trên Docker trên runner Blacksmith thông thường — job container không phải là nơi phù hợp để khởi chạy các bài kiểm thử Docker lồng nhau.

Các shard model/backend live dựa trên Docker dùng một image dùng chung riêng biệt `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit được chọn. Workflow live phát hành xây dựng và push image đó một lần, rồi các shard model live Docker, Gateway được shard theo provider, backend CLI, bind ACP, và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang các giới hạn `timeout` rõ ràng ở cấp script, thấp hơn timeout job workflow, để một container bị kẹt hoặc đường dọn dẹp lỗi nhanh thay vì tiêu tốn toàn bộ ngân sách release-check. Nếu các shard đó tự xây dựng lại target Docker nguồn đầy đủ một cách độc lập, lần chạy phát hành đã cấu hình sai và sẽ lãng phí thời gian thực cho các lần build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, trong khi chấp nhận gói xác thực một tarball duy nhất qua cùng harness Docker E2E mà người dùng dùng sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một package candidate, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên làm artifact `package-under-test`, và in source, workflow ref, package ref, version, SHA-256, và profile trong tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory tarball, chuẩn bị image Docker package-digest khi cần, và chạy các lane Docker đã chọn với gói đó thay vì đóng gói workflow checkout. Khi một profile chọn nhiều `docker_lanes` mục tiêu, workflow tái sử dụng chuẩn bị gói và image dùng chung một lần, rồi fan out các lane đó thành các job Docker mục tiêu chạy song song với artifact duy nhất.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã xuất bản.
4. `summary` làm workflow thất bại nếu việc phân giải gói, chấp nhận Docker, hoặc lane Telegram tùy chọn thất bại.

### Nguồn candidate

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một version phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng mục này cho chấp nhận prerelease/stable đã xuất bản.
- `source=ref` đóng gói một branch, tag, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy. Resolver fetch các branch/tag OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử branch repository hoặc một release tag, cài dependency trong một worktree detached, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy bài kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng phạm vi bao phủ Plugin offline để việc xác thực gói đã xuất bản không phụ thuộc vào tính khả dụng live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, còn đường dẫn spec npm đã xuất bản được giữ cho các dispatch độc lập.

Để xem chính sách chuyên biệt về kiểm thử cập nhật và Plugin, bao gồm lệnh cục bộ,
lane Docker, đầu vào Package Acceptance, mặc định phát hành, và phân loại lỗi,
xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Release checks gọi Package Acceptance với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng migration gói, cập nhật, dọn dẹp dependency Plugin cũ, sửa cài đặt Plugin đã cấu hình, Plugin offline, plugin-update, và Telegram trên cùng một tarball gói đã phân giải. Đặt `package_acceptance_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks để chạy cùng ma trận đó với một gói npm đã phát hành thay vì artifact được build từ SHA. Cross-OS release checks vẫn bao phủ onboarding, installer, và hành vi nền tảng đặc thù OS; validation sản phẩm package/update nên bắt đầu với Package Acceptance. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã xuất bản cho mỗi lần chạy. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là candidate và `published_upgrade_survivor_baseline` chọn baseline đã xuất bản dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên baseline đó. Đặt `published_upgrade_survivor_baselines=all-since-2026.4.23` để mở rộng Full Release CI trên mọi bản phát hành npm ổn định từ `2026.4.23` đến `latest`; `release-history` vẫn có sẵn cho việc lấy mẫu thủ công rộng hơn với mốc trước ngày cũ hơn. Đặt `published_upgrade_survivor_scenarios=reported-issues` để mở rộng cùng các baseline trên những fixture giống issue cho cấu hình Feishu, các file bootstrap/persona được giữ lại, cài đặt OpenClaw Plugin đã cấu hình, đường dẫn log tilde, và các root dependency Plugin legacy cũ. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã xuất bản một cách toàn diện, không phải phạm vi Full Release CI thông thường. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã xuất bản cấu hình baseline bằng một recipe lệnh `openclaw config set` được nướng sẵn, ghi lại các bước recipe trong `summary.json`, và probe `/healthz`, `/readyz`, cùng trạng thái RPC sau khi Gateway khởi động. Các lane Windows packaged và installer fresh cũng xác minh rằng một gói đã cài đặt có thể import browser-control override từ một đường dẫn Windows tuyệt đối thô. Smoke agent-turn cross-OS OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.4`, để bằng chứng cài đặt và Gateway vẫn ở trên model kiểm thử GPT-5 trong khi tránh các mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Package Acceptance có các cửa sổ tương thích legacy có giới hạn cho những gói đã xuất bản. Các gói đến hết `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA private đã biết trong `dist/postinstall-inventory.json` có thể trỏ tới các file bị bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase duy trì `gateway install --wrapper` khi gói không expose flag đó;
- `update-channel-switch` có thể prune `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả lập dẫn xuất từ tarball và có thể log `update.channel` đã duy trì bị thiếu;
- các smoke Plugin có thể đọc vị trí install-record legacy hoặc chấp nhận việc thiếu duy trì install-record marketplace;
- `plugin-update` có thể cho phép migration metadata cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã xuất bản cũng có thể cảnh báo về các file stamp metadata build cục bộ đã được phát hành. Các gói sau đó phải đáp ứng các hợp đồng hiện đại; cùng điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy chấp nhận gói bị lỗi, hãy bắt đầu ở phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các tạo tác Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời lượng từng pha và lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói bị lỗi hoặc chính xác các lane Docker thay vì chạy lại toàn bộ xác thực phát hành.

## Smoke cài đặt

Workflow `Install Smoke` riêng biệt tái sử dụng cùng script phạm vi thông qua job `preflight` riêng của nó. Workflow này chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường nhanh** chạy cho các pull request chạm tới bề mặt Docker/gói, thay đổi gói/manifest Plugin được đóng gói kèm, hoặc các bề mặt Plugin/lớp kênh/Gateway/Plugin SDK lõi mà các job smoke Docker kiểm tra. Các thay đổi chỉ ở mã nguồn Plugin được đóng gói kèm, chỉnh sửa chỉ ở kiểm thử và chỉnh sửa chỉ ở tài liệu không giữ trước worker Docker. Đường nhanh xây dựng ảnh Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa agent trong shared-workspace, chạy e2e gateway-network trong container, xác minh tham số build cho extension được đóng gói kèm và chạy hồ sơ Docker bundled-plugin có giới hạn dưới thời gian chờ tổng hợp 240 giây cho lệnh (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update trình cài đặt cho các lần chạy theo lịch hằng đêm, điều phối thủ công, kiểm tra phát hành workflow-call và các pull request thật sự chạm tới bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một ảnh smoke Dockerfile gốc GHCR theo target-SHA, rồi chạy cài đặt gói QR, smoke Dockerfile/gateway gốc, smoke trình cài đặt/update và Docker E2E bundled-plugin nhanh dưới dạng các job riêng để công việc trình cài đặt không phải đợi sau các smoke ảnh gốc.

Các lần push lên `main` (bao gồm cả commit merge) không bắt buộc đường đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một lần push, workflow giữ lại smoke Docker nhanh và để smoke cài đặt đầy đủ cho xác thực hằng đêm hoặc xác thực phát hành.

Smoke image-provider cài đặt toàn cục Bun chậm được kiểm soát riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các lần điều phối thủ công `Install Smoke` có thể chọn tham gia, nhưng pull request và các lần push lên `main` thì không. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng trước một ảnh live-test dùng chung, đóng gói OpenClaw một lần thành tarball npm và dựng hai ảnh `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane trình cài đặt/update/plugin-dependency;
- một ảnh chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn ảnh theo từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tùy chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot của pool chính cho các lane thông thường.                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot của tail-pool nhạy với provider.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để provider không bị throttling.                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều dịch vụ đồng thời.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ giãn cách giữa các lần bắt đầu lane để tránh dồn tạo Docker daemon; đặt `0` để không giãn. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Thời gian chờ dự phòng cho mỗi lane (120 phút); một số lane live/tail dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` in kế hoạch bộ lập lịch mà không chạy lane.                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agent có thể tái hiện một lane lỗi. |

Một lane nặng hơn giới hạn hiệu lực của nó vẫn có thể bắt đầu từ một pool trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Preflight tổng hợp cục bộ kiểm tra Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời lượng lane để sắp xếp dài nhất trước và mặc định dừng lập lịch các lane trong pool mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` để biết gói, loại ảnh, ảnh live, lane và phạm vi thông tin xác thực nào là bắt buộc. Sau đó `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải xuống tạo tác gói của lần chạy hiện tại, hoặc tải xuống tạo tác gói từ `package_artifact_run_id`; xác thực inventory tarball; dựng và push các ảnh Docker E2E bare/functional GHCR được gắn tag theo digest gói thông qua bộ nhớ đệm lớp Docker của Blacksmith khi kế hoạch cần các lane đã cài gói; và tái sử dụng các input `docker_e2e_bare_image`/`docker_e2e_functional_image` đã cung cấp hoặc các ảnh package-digest hiện có thay vì dựng lại. Các lần pull ảnh Docker được thử lại với thời gian chờ có giới hạn 180 giây cho mỗi lần thử để luồng registry/cache bị kẹt được thử lại nhanh thay vì tiêu tốn phần lớn đường găng CI.

### Phân đoạn đường phát hành

Phạm vi Docker phát hành chạy các job nhỏ được chia đoạn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi đoạn chỉ pull loại ảnh cần thiết và thực thi nhiều lane thông qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các đoạn Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` và `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` và `plugins-integrations` vẫn là các bí danh tổng hợp plugin/runtime. Bí danh lane `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ một đoạn `openwebui` độc lập cho các điều phối chỉ dành cho OpenWebUI. Các lane cập nhật kênh được đóng gói kèm thử lại một lần cho lỗi mạng npm nhất thời.

Mỗi đoạn tải lên `.artifacts/docker-tests/` với nhật ký lane, thời lượng, `summary.json`, `failures.json`, thời lượng pha, JSON kế hoạch bộ lập lịch, bảng lane chậm và lệnh chạy lại cho từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn dựa trên các ảnh đã chuẩn bị thay vì các job đoạn, nhờ đó việc gỡ lỗi lane thất bại được giới hạn trong một job Docker mục tiêu và chuẩn bị, tải xuống hoặc tái sử dụng tạo tác gói cho lần chạy đó; nếu một lane đã chọn là lane Docker live, job mục tiêu sẽ dựng ảnh live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo cho từng lane bao gồm `package_artifact_run_id`, `package_artifact_name` và input ảnh đã chuẩn bị khi các giá trị đó tồn tại, để một lane thất bại có thể tái sử dụng chính xác gói và ảnh từ lần chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy toàn bộ bộ kiểm thử Docker release-path hằng ngày.

## Tiền phát hành Plugin

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng do `Full Release Validation` hoặc một operator rõ ràng điều phối. Pull request thông thường, các lần push lên `main` và các lần điều phối CI thủ công độc lập không bật bộ kiểm thử đó. Nó cân bằng các kiểm thử Plugin được đóng gói kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc, với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các lô Plugin nặng import không tạo thêm job CI. Đường Docker prerelease chỉ dành cho phát hành gom các lane Docker mục tiêu thành nhóm nhỏ để tránh giữ hàng chục runner cho các job kéo dài một đến ba phút.

## Phòng thí nghiệm QA

Phòng thí nghiệm QA có các lane CI chuyên dụng bên ngoài workflow chính được định phạm vi thông minh. Parity agentic được lồng dưới các bộ kiểm thử QA rộng và phát hành, không phải workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi parity cần đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi điều phối thủ công; nó tỏa ra lane parity mock, lane Matrix live, và các lane Telegram và Discord live dưới dạng các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các kiểm tra phát hành chạy các lane vận chuyển live Matrix và Telegram với provider mock xác định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được cô lập khỏi độ trễ model live và khởi động provider-plugin thông thường. Gateway vận chuyển live tắt tìm kiếm bộ nhớ vì parity QA kiểm tra hành vi bộ nhớ riêng; kết nối provider được bao phủ bởi các bộ kiểm thử model live, provider native và provider Docker riêng biệt.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và input workflow thủ công vẫn là `all`; điều phối thủ công `matrix_profile=all` luôn chia shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane Phòng thí nghiệm QA quan trọng cho phát hành trước khi phê duyệt phát hành; cổng parity QA của nó chạy các gói candidate và baseline dưới dạng các job lane song song, rồi tải cả hai tạo tác xuống một job báo cáo nhỏ cho bước so sánh parity cuối cùng.

Với các PR thông thường, hãy theo bằng chứng CI/kiểm tra theo phạm vi thay vì xem parity là một trạng thái bắt buộc.

## CodeQL

Quy trình `CodeQL` cố ý là trình quét bảo mật lượt đầu có phạm vi hẹp, không phải lượt quét toàn bộ kho lưu trữ. Hằng ngày, thủ công, và các lần chạy bảo vệ pull request không phải bản nháp sẽ quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng các truy vấn bảo mật có độ tin cậy cao, được lọc theo `security-severity` cao/nghiêm trọng.

Bộ bảo vệ pull request vẫn nhẹ: nó chỉ khởi động với các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật có độ tin cậy cao như workflow theo lịch. Android và macOS CodeQL không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Xác thực, bí mật, sandbox, Cron, và đường cơ sở Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Các hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, Gateway, Plugin SDK, bí mật, điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt chính sách SSRF lõi, phân tích cú pháp IP, bảo vệ mạng, tìm nạp web, và SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, trình trợ giúp thực thi tiến trình, phân phối đi, và cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của cài đặt Plugin, trình tải, manifest, registry, cài đặt trình quản lý gói, tải nguồn, và hợp đồng gói Plugin SDK |

### Các phân đoạn bảo mật riêng theo nền tảng

- `CodeQL Android Critical Security` — phân đoạn bảo mật Android theo lịch. Xây dựng ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — phân đoạn bảo mật macOS hằng tuần/thủ công. Xây dựng ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF được tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chi phối thời gian chạy ngay cả khi sạch.

### Danh mục chất lượng nghiêm trọng

`CodeQL Critical Quality` là phân đoạn không bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không bảo mật ở mức nghiêm trọng lỗi trên các bề mặt giá trị cao có phạm vi hẹp trên runner Blacksmith Linux nhỏ hơn. Bộ bảo vệ pull request của nó cố ý nhỏ hơn hồ sơ theo lịch: PR không phải bản nháp chỉ chạy các phân đoạn `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` tương ứng cho mã thực thi lệnh/mô hình/công cụ của agent và điều phối trả lời, mã lược đồ/cấu hình/di trú/IO, mã xác thực/bí mật/sandbox/bảo mật, runtime Plugin kênh lõi và kênh đóng gói, phương thức máy chủ/giao thức Gateway, runtime bộ nhớ/keo SDK, MCP/tiến trình/phân phối đi, runtime nhà cung cấp/danh mục mô hình, chẩn đoán phiên/hàng đợi phân phối, trình tải Plugin, Plugin SDK/hợp đồng gói, hoặc các thay đổi runtime trả lời của Plugin SDK. Các thay đổi cấu hình CodeQL và workflow chất lượng chạy cả mười hai phân đoạn chất lượng PR.

Điều phối thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là các điểm móc hướng dẫn/lặp để chạy riêng một phân đoạn chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật cho xác thực, bí mật, sandbox, Cron, và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Lược đồ cấu hình, di trú, chuẩn hóa, và hợp đồng IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Lược đồ giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai Plugin kênh lõi và kênh đóng gói                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi tự động trả lời, và hợp đồng runtime mặt phẳng điều khiển ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình, và hợp đồng phân phối đi                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, bí danh Plugin SDK bộ nhớ, keo kích hoạt runtime bộ nhớ, và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, trình trợ giúp liên kết/phân phối phiên đi, bề mặt gói sự kiện/nhật ký chẩn đoán, và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đến của Plugin SDK, trình trợ giúp payload/phân đoạn/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối, và trình trợ giúp liên kết phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, xác thực và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/danh mục nhà cung cấp, và registry web/tìm kiếm/tìm nạp/nhúng    |
| `/codeql-critical-quality/ui-control-plane`             | Khởi động Control UI, lưu trữ cục bộ, luồng điều khiển Gateway, và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime tìm nạp/tìm kiếm web lõi, IO phương tiện, hiểu phương tiện, tạo hình ảnh, và tạo phương tiện                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng trình tải, registry, bề mặt công khai, và điểm vào Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và trình trợ giúp hợp đồng gói plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, vô hiệu hóa, hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python, và plugin đóng gói chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc phân đoạn sau khi các hồ sơ hẹp có thời gian chạy và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một làn bảo trì Codex điều khiển theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi mới được tích hợp. Nó không có lịch thuần túy: một lần chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và điều phối thủ công có thể chạy nó trực tiếp. Các lệnh gọi workflow-run sẽ bỏ qua khi `main` đã tiến lên hoặc khi một lần chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ trước. Khi chạy, nó xem xét phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, nên một lần chạy mỗi giờ có thể bao phủ mọi thay đổi main được tích lũy kể từ lượt xử lý tài liệu gần nhất.

### Test Performance Agent

Workflow `Test Performance Agent` là một làn bảo trì Codex điều khiển theo sự kiện dành cho các bài kiểm thử chậm. Nó không có lịch thuần túy: một lần chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó sẽ bỏ qua nếu một lệnh gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Điều phối thủ công bỏ qua cổng hoạt động hằng ngày đó. Làn này xây dựng báo cáo hiệu năng Vitest được nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các sửa lỗi nhỏ về hiệu năng kiểm thử mà vẫn giữ nguyên độ phủ thay vì tái cấu trúc rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng bài kiểm thử đường cơ sở đang vượt qua. Nếu đường cơ sở có bài kiểm thử thất bại, Codex chỉ được sửa các lỗi hiển nhiên và báo cáo toàn bộ bộ kiểm thử sau agent phải vượt qua trước khi bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi push của bot được tích hợp, làn này rebase bản vá đã xác thực, chạy lại `pnpm check:changed`, và thử lại push; các bản vá cũ bị xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub lưu trữ để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### Duplicate PRs After Merge

Workflow `Duplicate PRs After Merge` là workflow thủ công của maintainer để dọn dẹp bản trùng lặp sau khi tích hợp. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã tích hợp đã được merge và mỗi bản trùng lặp có issue được tham chiếu chung hoặc các hunk thay đổi chồng lấp.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic làn thay đổi cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi sản xuất lõi chạy typecheck prod lõi và kiểm thử lõi cùng lint/bảo vệ lõi;
- thay đổi chỉ kiểm thử lõi chỉ chạy typecheck kiểm thử lõi cùng lint lõi;
- thay đổi sản xuất extension chạy typecheck prod extension và kiểm thử extension cùng lint extension;
- thay đổi chỉ kiểm thử extension chạy typecheck kiểm thử extension cùng lint extension;
- các thay đổi Plugin SDK công khai hoặc hợp đồng plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (các lượt quét extension Vitest vẫn là công việc kiểm thử rõ ràng);
- các lần tăng phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- thay đổi root/cấu hình không xác định fail safe sang tất cả các làn kiểm tra.

Định tuyến kiểm thử thay đổi cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý rẻ hơn `check:changed`: chỉnh sửa kiểm thử trực tiếp sẽ tự chạy chính nó, chỉnh sửa nguồn ưu tiên ánh xạ rõ ràng, sau đó là kiểm thử anh em và phần phụ thuộc đồ thị import. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ rõ ràng: thay đổi đối với cấu hình trả lời hiển thị theo nhóm, chế độ phân phối trả lời nguồn, hoặc prompt hệ thống của công cụ nhắn tin sẽ đi qua kiểm thử trả lời lõi cùng các hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung thất bại trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng ở cấp harness khiến tập được ánh xạ rẻ không còn là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ gốc repo và ưu tiên một box mới đã được khởi động sẵn cho bằng chứng diện rộng. Trước khi dành một gate chậm cho một box đã được tái sử dụng, đã hết hạn, hoặc vừa báo cáo một lần đồng bộ lớn bất ngờ, hãy chạy `pnpm testbox:sanity` bên trong box trước.

Kiểm tra sanity sẽ thất bại nhanh khi các tệp gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 lượt xóa có theo dõi. Điều đó thường có nghĩa là trạng thái đồng bộ từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng box đó và khởi động sẵn một box mới thay vì gỡ lỗi lỗi kiểm thử sản phẩm. Với các PR cố ý xóa số lượng lớn, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng kết thúc một lệnh gọi Blacksmith CLI cục bộ nếu lệnh đó ở lại pha đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt cơ chế bảo vệ đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là wrapper remote-box do repo sở hữu để cung cấp bằng chứng Linux cho maintainer. Dùng nó khi một kiểm tra quá rộng cho local edit loop, khi tính tương đồng với CI là quan trọng, hoặc khi bằng chứng cần secret, Docker, package lane, box có thể tái sử dụng, hoặc log từ xa. Backend OpenClaw thông thường là `blacksmith-testbox`; năng lực AWS/Hetzner sở hữu là phương án dự phòng khi Blacksmith ngừng hoạt động, gặp vấn đề quota, hoặc khi cần kiểm thử rõ ràng trên năng lực sở hữu.

Trước lần chạy đầu tiên, kiểm tra wrapper từ gốc repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper của repo từ chối binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider một cách tường minh dù `.crabbox.yaml` có mặc định owned-cloud.

Changed gate:

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

Đọc tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Các lần chạy Crabbox một lượt được Blacksmith hỗ trợ sẽ tự động dừng Testbox; nếu một lần chạy bị gián đoạn hoặc việc dọn dẹp không rõ ràng, hãy kiểm tra các box đang hoạt động và chỉ dừng các box bạn đã tạo:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Chỉ dùng tái sử dụng khi bạn cố ý cần nhiều lệnh trên cùng một box đã hydrate:

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

Chỉ nâng cấp sang năng lực Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn quota, thiếu môi trường cần thiết, hoặc năng lực sở hữu là mục tiêu rõ ràng:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` sở hữu các mặc định provider, đồng bộ, và hydrate GitHub Actions cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa riêng thay vì đồng bộ các remote và object store cục bộ của maintainer, và nó loại trừ các artifact runtime/build cục bộ không bao giờ nên được truyền đi. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không chứa secret cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
