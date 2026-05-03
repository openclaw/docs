---
read_when:
    - Bạn cần hiểu lý do tại sao một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions đang thất bại
    - Bạn đang điều phối một lần chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi cơ chế điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị công việc CI, các cổng kiểm soát theo phạm vi, các nhóm bao trùm phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-03T21:27:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: e07fc44aa844cb66ce529c570cbbbbf502a61bcbcbc3d9488557abb459ef7678
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần push đến `main` và mọi yêu cầu kéo. Job `preflight` phân loại diff và tắt các lane tốn kém khi chỉ các khu vực không liên quan thay đổi. Các lần chạy thủ công `workflow_dispatch` cố ý bỏ qua phạm vi thông minh và bung toàn bộ đồ thị cho các ứng viên phát hành và xác thực diện rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong workflow riêng [`Plugin Tiền phát hành`](#plugin-prerelease) và chỉ chạy từ [`Xác thực bản phát hành đầy đủ`](#full-release-validation) hoặc một dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                              | Mục đích                                                                                                   | Khi chạy                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ liên quan đến tài liệu, phạm vi đã thay đổi, extension đã thay đổi và dựng manifest CI | Luôn chạy trên push và PR không phải bản nháp |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra workflow qua `zizmor`                                                  | Luôn chạy trên push và PR không phải bản nháp |
| `security-dependency-audit`      | Kiểm tra lockfile production không cần phụ thuộc dựa trên cảnh báo npm                                     | Luôn chạy trên push và PR không phải bản nháp |
| `security-fast`                  | Tổng hợp bắt buộc cho các job bảo mật nhanh                                                                | Luôn chạy trên push và PR không phải bản nháp |
| `check-dependencies`             | Lượt kiểm tra Knip chỉ dành cho phụ thuộc production cùng guard allowlist tệp không dùng                   | Thay đổi liên quan đến Node         |
| `build-artifacts`                | Dựng `dist/`, Control UI, kiểm tra artifact đã dựng và artifact hạ nguồn có thể tái sử dụng               | Thay đổi liên quan đến Node         |
| `checks-fast-core`               | Các lane kiểm tra đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                  | Thay đổi liên quan đến Node         |
| `checks-fast-contracts-channels` | Kiểm tra hợp đồng kênh dạng shard với kết quả kiểm tra tổng hợp ổn định                                   | Thay đổi liên quan đến Node         |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ lane kênh, bundled, contract và extension                            | Thay đổi liên quan đến Node         |
| `check`                          | Tương đương cổng cục bộ chính dạng shard: kiểu production, lint, guard, kiểu kiểm thử và smoke nghiêm ngặt | Thay đổi liên quan đến Node         |
| `check-additional`               | Kiến trúc, drift boundary/prompt dạng shard, guard extension, ranh giới package và gateway watch           | Thay đổi liên quan đến Node         |
| `build-smoke`                    | Kiểm thử smoke CLI đã dựng và smoke bộ nhớ khởi động                                                       | Thay đổi liên quan đến Node         |
| `checks`                         | Bộ xác minh cho kiểm thử kênh artifact đã dựng                                                             | Thay đổi liên quan đến Node         |
| `checks-node-compat-node22`      | Lane dựng và smoke tương thích Node 22                                                                     | Dispatch CI thủ công cho phát hành  |
| `check-docs`                     | Định dạng tài liệu, lint và kiểm tra liên kết hỏng                                                         | Tài liệu thay đổi                   |
| `skills-python`                  | Ruff + pytest cho Skills có nền Python                                                                     | Thay đổi liên quan đến skill Python |
| `checks-windows`                 | Kiểm thử quy trình/đường dẫn riêng cho Windows cùng hồi quy specifier import runtime dùng chung            | Thay đổi liên quan đến Windows      |
| `macos-node`                     | Lane kiểm thử TypeScript trên macOS dùng artifact đã dựng chung                                            | Thay đổi liên quan đến macOS        |
| `macos-swift`                    | Swift lint, build và kiểm thử cho ứng dụng macOS                                                           | Thay đổi liên quan đến macOS        |
| `android`                        | Kiểm thử đơn vị Android cho cả hai flavor cùng một bản dựng APK debug                                      | Thay đổi liên quan đến Android      |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm hằng ngày bằng Codex sau hoạt động đáng tin cậy                                   | CI trên main thành công hoặc dispatch thủ công |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile và GPT 5.4 live | Theo lịch và dispatch thủ công      |

## Thứ tự fail-fast

1. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` và `skills-python` thất bại nhanh mà không chờ các job ma trận artifact và nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấn với các lane Linux nhanh để các bên tiêu thụ hạ nguồn có thể bắt đầu ngay khi bản dựng dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn bung ra sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một push mới hơn đến cùng PR hoặc ref `main`. Xem đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` nên chúng vẫn báo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa đồng thời CI tự động được đánh phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô hạn các lần chạy main mới hơn. Các lần chạy bộ đầy đủ thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang diễn ra.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bằng kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Sửa workflow CI** xác thực đồ thị CI Node cùng lint workflow, nhưng bản thân chúng không ép chạy các bản dựng native Windows, Android hoặc macOS; các lane nền tảng đó vẫn được giới hạn phạm vi theo thay đổi mã nguồn nền tảng.
- **Sửa chỉ định tuyến CI, sửa fixture kiểm thử core rẻ được chọn, và sửa helper/test-routing hợp đồng plugin hẹp** dùng đường manifest nhanh chỉ Node: `preflight`, bảo mật và một tác vụ `checks-fast-core` duy nhất. Đường này bỏ qua artifact dựng, tương thích Node 22, hợp đồng kênh, toàn bộ shard core, shard bundled-plugin và các ma trận guard bổ sung khi thay đổi bị giới hạn trong các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp thực thi.
- **Kiểm tra Node trên Windows** được giới hạn phạm vi vào wrapper quy trình/đường dẫn riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package và các bề mặt workflow CI thực thi lane đó; các thay đổi mã nguồn, plugin, install-smoke và chỉ kiểm thử không liên quan vẫn nằm trên các lane Node Linux.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không đặt trước runner quá mức: hợp đồng kênh chạy dưới dạng ba shard có trọng số, lane core unit fast/support chạy riêng, hạ tầng runtime core được tách giữa shard state và process/config, auto-reply chạy như worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch và commands/state-routing), và cấu hình agentic gateway/server được tách qua các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã dựng. Kiểm thử trình duyệt, QA, media và plugin linh tinh diện rộng dùng cấu hình Vitest chuyên dụng thay vì catch-all plugin dùng chung. Các shard include-pattern ghi mục thời gian bằng tên shard CI, nên `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với một shard đã lọc. `check-additional` giữ công việc biên dịch/canary package-boundary cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; danh sách guard boundary được chia sọc qua bốn shard ma trận, mỗi shard chạy đồng thời các guard độc lập được chọn và in thời gian từng kiểm tra, bao gồm `pnpm prompt:snapshots:check` để drift prompt happy-path runtime Codex được ghim vào PR gây ra nó. Gateway watch, kiểm thử kênh và shard core support-boundary chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được dựng.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi dựng APK debug Play. Flavor bên thứ ba không có source set hoặc manifest riêng; lane kiểm thử đơn vị của nó vẫn biên dịch flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh một job đóng gói APK debug trùng lặp trên mọi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ dành cho phụ thuộc production, được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh các phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được rà soát hoặc để lại một mục allowlist lỗi thời, đồng thời giữ lại các bề mặt plugin động, generated, build, live-test và cầu nối package có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động kho OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã yêu cầu kéo không đáng tin cậy. Workflow tạo GitHub App token từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho yêu cầu rà soát chính xác issue và yêu cầu kéo;
- `clawsweeper_comment` cho lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho yêu cầu rà soát ở cấp commit trên push đến `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, kho, số mục, URL, tiêu đề, trạng thái và trích đoạn ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ thân webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng sự kiện đã chuẩn hóa tới hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải mặc định giao phát. Agent ClawSweeper nhận mục tiêu Discord trong prompt và chỉ nên đăng lên `#clawsweeper` khi sự kiện bất ngờ, có thể hành động, rủi ro hoặc hữu ích về vận hành. Các lần mở, chỉnh sửa, nhiễu bot, nhiễu webhook trùng lặp và lưu lượng review bình thường nên trả về `NO_REPLY`.

Xem tiêu đề, bình luận, thân nội dung, văn bản review, tên nhánh và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy trong toàn bộ đường này. Chúng là đầu vào cho tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Dispatch thủ công

Các lần điều phối CI thủ công chạy cùng đồ thị job như CI bình thường nhưng bật bắt buộc mọi lane có phạm vi không phải Android: các shard Linux Node, shard bundled-plugin, hợp đồng kênh, tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra docs, Python skills, Windows, macOS và i18n Control UI. Các lần điều phối CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella bản phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Các kiểm tra tĩnh prerelease Plugin, shard chỉ dành cho bản phát hành `agentic-plugins`, lượt quét batch extension đầy đủ và các lane Docker prerelease Plugin được loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` điều phối workflow `Plugin Prerelease` riêng với gate release-validation được bật.

Các lần chạy thủ công dùng một nhóm concurrency duy nhất để bộ đầy đủ release-candidate không bị hủy bởi lần chạy push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một branch, tag hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ dispatch ref đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các job bảo mật nhanh và aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), kiểm tra nhanh protocol/contract/bundled, kiểm tra hợp đồng kênh dạng shard, các shard `check` ngoại trừ lint, các shard và aggregate `check-additional`, verifier aggregate kiểm thử Node, kiểm tra docs, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng GitHub-hosted Ubuntu để ma trận Blacksmith có thể vào hàng đợi sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Linux Node, các shard kiểm thử bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (nhạy CPU đủ mức 8 vCPU tốn chi phí nhiều hơn phần tiết kiệm được); các bản build Docker install-smoke (thời gian hàng đợi 32-vCPU tốn chi phí nhiều hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                                                                     |
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

`OpenClaw Performance` là workflow hiệu năng product/runtime. Workflow này chạy hằng ngày trên `main` và có thể được điều phối thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch thủ công thường benchmark workflow ref. Đặt `target_ref` để benchmark một release tag hoặc branch khác bằng implementation workflow hiện tại. Các đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được key theo ref được kiểm thử, và mỗi `index.md` ghi lại ref/SHA được kiểm thử, workflow ref/SHA, Kova ref, profile, chế độ xác thực lane, model, số lần lặp và bộ lọc scenario.

Workflow cài OCM từ một bản phát hành đã pin và Kova từ `openclaw/Kova` tại input `kova_ref` đã pin, rồi chạy ba lane:

- `mock-provider`: các scenario chẩn đoán Kova chạy với runtime local-build cùng xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: profiling CPU/heap/trace cho các điểm nóng startup, Gateway và agent-turn.
- `live-gpt54`: một lượt agent OpenAI thật `openai/gpt-5.4`, được bỏ qua khi không có `OPENAI_API_KEY`.

Lane mock-provider cũng chạy các probe nguồn gốc OpenClaw-native sau lượt Kova: thời gian boot Gateway và bộ nhớ trên các trường hợp startup mặc định, hook và 50-plugin; các vòng hello `channel-chat-baseline` mock-OpenAI lặp lại; và các lệnh startup CLI chạy với Gateway đã boot. Tóm tắt Markdown của source probe nằm tại `source/index.md` trong bundle báo cáo, với JSON thô ở bên cạnh.

Mọi lane đều upload artifact GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, bundle, `index.md` và artifact source-probe vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ tested-ref hiện tại được ghi là `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực bản phát hành đầy đủ

`Full Release Validation` là workflow umbrella thủ công để “chạy mọi thứ trước khi phát hành.” Workflow này nhận một branch, tag hoặc SHA commit đầy đủ, điều phối workflow `CI` thủ công với target đó, điều phối `Plugin Prerelease` cho bằng chứng plugin/package/static/Docker chỉ dành cho bản phát hành, và điều phối `OpenClaw Release Checks` cho install smoke, package acceptance, các bộ kiểm thử đường dẫn phát hành Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix và các lane Telegram. Với `rerun_group=all` và `release_profile=full`, workflow cũng chạy `NPM Telegram Beta E2E` với artifact `release-package-under-test` từ release checks. Sau khi xuất bản, truyền `npm_telegram_package_spec` để chạy lại cùng lane package Telegram với package npm đã xuất bản.

Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận stage, tên job workflow chính xác, khác biệt giữa các profile, artifact và
các handle chạy lại có trọng tâm.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Điều phối nó
từ `release/YYYY.M.D` hoặc `main` sau khi release tag tồn tại và sau khi
preflight npm OpenClaw đã thành công. Workflow xác minh `pnpm plugins:sync:check`,
điều phối `Plugin NPM Release` cho tất cả package plugin có thể publish, điều phối
`Plugin ClawHub Release` cho cùng release SHA, và chỉ sau đó mới điều phối
`OpenClaw NPM Release` với `preflight_run_id` đã lưu.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit đã pin trên một branch thay đổi nhanh, hãy dùng helper thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Các ref dispatch workflow GitHub phải là branch hoặc tag, không phải SHA commit thô. Helper
push một branch tạm `release-ci/<sha>-...` tại SHA target,
điều phối `Full Release Validation` từ ref đã pin đó, xác minh mọi
workflow con có `headSha` khớp với target, và xóa branch tạm khi
lần chạy hoàn tất. Umbrella verifier cũng fail nếu bất kỳ workflow con nào chạy tại
SHA khác.

`release_profile` kiểm soát phạm vi live/provider được truyền vào các bước kiểm tra phát hành. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn cố ý muốn ma trận provider/media tư vấn rộng.

- `minimum` giữ các lane OpenAI/core quan trọng cho phát hành nhanh nhất.
- `stable` thêm bộ provider/backend ổn định.
- `full` chạy ma trận provider/media tư vấn rộng.

Umbrella ghi lại các id lần chạy con đã dispatch, và job `Verify full validation` cuối cùng kiểm tra lại kết luận hiện tại của các lần chạy con rồi thêm các bảng job chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển sang xanh, chỉ chạy lại job verifier của parent để làm mới kết quả umbrella và bản tóm tắt thời gian.

Để phục hồi, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho một release candidate, `ci` chỉ cho workflow con full CI thông thường, `plugin-prerelease` chỉ cho workflow con phát hành trước Plugin, `release-checks` cho mọi workflow con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên umbrella. Điều này giữ phạm vi chạy lại của một hộp phát hành bị lỗi ở mức giới hạn sau một bản sửa tập trung.

`OpenClaw Release Checks` dùng workflow ref đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho cả workflow Docker đường dẫn phát hành live/E2E và shard chấp nhận gói. Điều đó giữ các byte của gói nhất quán trên các hộp phát hành và tránh đóng gói lại cùng một candidate trong nhiều job con.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all` thay thế umbrella cũ hơn. Monitor parent hủy mọi workflow con mà nó đã dispatch khi parent bị hủy, vì vậy lần xác thực main mới hơn không phải chờ sau một lần chạy release-check cũ hai giờ. Việc xác thực branch/tag phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Các shard live và E2E

Workflow con live/E2E phát hành giữ phạm vi kiểm thử native `pnpm test:live` rộng, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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

Điều đó giữ nguyên phạm vi file trong khi làm cho các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên runner Blacksmith thông thường — job container không phải nơi phù hợp để khởi chạy các kiểm thử Docker lồng nhau.

Các shard model/backend live dựa trên Docker dùng một image dùng chung riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit được chọn. Workflow phát hành live build và push image đó một lần, rồi các shard Docker live model, Gateway được chia theo provider, CLI backend, ACP bind và Codex harness chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang các giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout của job workflow để một container hoặc đường dọn dẹp bị kẹt thất bại nhanh thay vì tiêu thụ toàn bộ ngân sách release-check. Nếu các shard đó tự build lại target Docker nguồn đầy đủ, lần chạy phát hành bị cấu hình sai và sẽ lãng phí thời gian thực cho các bản build image trùng lặp.

## Package Acceptance

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, còn package acceptance xác thực một tarball duy nhất thông qua cùng Docker E2E harness mà người dùng sử dụng sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một package candidate, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên làm artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256, và profile trong bản tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory của tarball, chuẩn bị các Docker image package-digest khi cần, và chạy các lane Docker đã chọn với gói đó thay vì đóng gói checkout của workflow. Khi một profile chọn nhiều `docker_lanes` được nhắm mục tiêu, workflow tái sử dụng chuẩn bị gói và các image dùng chung một lần, rồi tỏa các lane đó ra thành các job Docker nhắm mục tiêu song song với artifact riêng biệt.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một artifact; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã xuất bản.
4. `summary` làm workflow thất bại nếu phân giải gói, Docker acceptance, hoặc lane Telegram tùy chọn thất bại.

### Nguồn candidate

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng tùy chọn này cho prerelease/stable acceptance đã xuất bản.
- `source=ref` đóng gói một branch, tag, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy. Resolver fetch các branch/tag OpenClaw, xác minh commit đã chọn có thể truy cập được từ lịch sử branch của repository hoặc một release tag, cài đặt deps trong một worktree tách rời, và đóng gói nó bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` riêng biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy bài kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép test harness hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng phạm vi kiểm thử Plugin ngoại tuyến để việc xác thực gói đã xuất bản không bị phụ thuộc vào tính sẵn sàng live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn spec npm đã xuất bản được giữ cho các dispatch độc lập.

Để xem chính sách kiểm thử cập nhật và Plugin chuyên dụng, bao gồm lệnh cục bộ, lane Docker, input Package Acceptance, mặc định phát hành, và phân loại lỗi, xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Release checks gọi Package Acceptance với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng di trú gói, cập nhật, dọn dẹp phụ thuộc Plugin cũ, sửa cài đặt Plugin đã cấu hình, Plugin ngoại tuyến, cập nhật Plugin, và Telegram trên cùng tarball gói đã phân giải. Đặt `package_acceptance_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks để chạy cùng ma trận đó với một gói npm đã shipped thay vì artifact được build từ SHA. Cross-OS release checks vẫn bao phủ hành vi onboarding, installer, và platform theo từng OS; việc xác thực sản phẩm package/update nên bắt đầu với Package Acceptance. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã xuất bản cho mỗi lần chạy. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là candidate và `published_upgrade_survivor_baseline` chọn baseline đã xuất bản dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên baseline đó. Đặt `published_upgrade_survivor_baselines=all-since-2026.4.23` để mở rộng Full Release CI trên mọi bản phát hành npm ổn định từ `2026.4.23` đến `latest`; `release-history` vẫn có sẵn để lấy mẫu thủ công rộng hơn với mốc trước ngày cũ hơn. Đặt `published_upgrade_survivor_scenarios=reported-issues` để mở rộng cùng các baseline đó trên các fixture dạng issue cho cấu hình Feishu, các file bootstrap/persona được giữ lại, cài đặt Plugin OpenClaw đã cấu hình, đường dẫn log có dấu ngã, và các root phụ thuộc Plugin legacy cũ. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã xuất bản một cách toàn diện, không phải phạm vi Full Release CI thông thường. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã xuất bản cấu hình baseline bằng một recipe lệnh `openclaw config set` được nhúng sẵn, ghi lại các bước recipe trong `summary.json`, và thăm dò `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane fresh cho gói Windows và installer cũng xác minh rằng một gói đã cài đặt có thể import một override browser-control từ một đường dẫn Windows tuyệt đối thô. Smoke agent-turn cross-OS OpenAI mặc định là `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không là `openai/gpt-5.4`, vì vậy bằng chứng cài đặt và Gateway vẫn dùng model kiểm thử GPT-5 trong khi tránh các mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Package Acceptance có các cửa sổ tương thích legacy có giới hạn cho các gói đã xuất bản. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các file bị lược khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase lưu bền `gateway install --wrapper` khi gói không expose flag đó;
- `update-channel-switch` có thể lược bỏ `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả được suy ra từ tarball và có thể log `update.channel` đã lưu bền bị thiếu;
- các smoke Plugin có thể đọc vị trí install-record legacy hoặc chấp nhận thiếu lưu bền install-record marketplace;
- `plugin-update` có thể cho phép di trú metadata config trong khi vẫn yêu cầu install record và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã xuất bản cũng có thể cảnh báo về các file dấu metadata build cục bộ đã được shipped. Các gói sau đó phải thỏa mãn các contract hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy chấp nhận gói bị lỗi, hãy bắt đầu từ phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời gian các pha và lệnh chạy lại. Ưu tiên chạy lại profile gói bị lỗi hoặc đúng các lane Docker thay vì chạy lại toàn bộ xác thực bản phát hành.

## Smoke cài đặt

Workflow `Install Smoke` riêng biệt tái sử dụng cùng script phạm vi thông qua job `preflight` riêng của nó. Workflow này chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho pull request chạm tới bề mặt Docker/gói, thay đổi gói/manifest Plugin đi kèm, hoặc các bề mặt Plugin/kênh/Gateway/Plugin SDK lõi mà các job Docker smoke kiểm thử. Các thay đổi Plugin đi kèm chỉ ở mã nguồn, chỉnh sửa chỉ dành cho kiểm thử và chỉnh sửa chỉ dành cho tài liệu không giữ trước worker Docker. Đường dẫn nhanh build image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa agents trong shared-workspace, chạy e2e gateway-network trong container, xác minh build arg của extension đi kèm và chạy profile Docker Plugin đi kèm có giới hạn trong timeout lệnh tổng hợp 240 giây (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update trình cài đặt cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call và pull request thực sự chạm tới bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image smoke Dockerfile gốc GHCR theo target-SHA, rồi chạy cài đặt gói QR, smoke Dockerfile/gateway gốc, smoke trình cài đặt/update và Docker E2E Plugin đi kèm nhanh dưới dạng các job riêng để công việc trình cài đặt không phải chờ sau các smoke image gốc.

Các push lên `main` (bao gồm merge commit) không ép dùng đường dẫn đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một push, workflow giữ Docker smoke nhanh và để smoke cài đặt đầy đủ cho xác thực hằng đêm hoặc xác thực bản phát hành.

Smoke image-provider cài đặt toàn cục Bun chậm được kiểm soát riêng bởi `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn tham gia, nhưng pull request và push lên `main` thì không. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` prebuild một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm và build hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane trình cài đặt/update/phụ thuộc Plugin;
- một image chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng bình thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi plan đã chọn. Scheduler chọn image cho mỗi lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số tinh chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                       |
| -------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot main-pool cho các lane bình thường.                                                    |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot tail-pool nhạy với provider.                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để provider không throttle.                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane đa dịch vụ đồng thời.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ lệch giữa các lần bắt đầu lane để tránh bão tạo Docker daemon; đặt `0` để không lệch.       |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Timeout dự phòng cho mỗi lane (120 phút); các lane live/tail được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in plan scheduler mà không chạy lane.                                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách lane chính xác phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agents tái hiện một lane lỗi. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể bắt đầu từ một pool trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Tổng hợp cục bộ preflight Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời gian lane để sắp xếp lâu nhất trước và mặc định dừng lên lịch các lane trong pool mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` về gói, loại image, image live, lane và phạm vi credential cần thiết. Sau đó `scripts/docker-e2e.mjs` chuyển plan đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải artifact gói của lần chạy hiện tại, hoặc tải artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; build và push các image Docker E2E GHCR bare/functional được gắn tag theo digest gói qua cache layer Docker của Blacksmith khi plan cần các lane đã cài gói; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các image theo digest gói hiện có thay vì build lại. Các lần pull image Docker được retry với timeout giới hạn 180 giây cho mỗi lần thử để stream registry/cache bị kẹt được retry nhanh thay vì tiêu thụ phần lớn đường găng CI.

### Chunk đường dẫn phát hành

Phạm vi Docker phát hành chạy các job được chia chunk nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi chunk chỉ pull loại image cần thiết và thực thi nhiều lane qua cùng scheduler có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các chunk Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các alias tổng hợp Plugin/runtime. Alias lane `install-e2e` vẫn là alias chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu, và chỉ giữ chunk `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane update kênh đi kèm retry một lần cho lỗi mạng npm thoáng qua.

Mỗi chunk upload `.artifacts/docker-tests/` với nhật ký lane, thời gian, `summary.json`, `failures.json`, thời gian các pha, JSON plan scheduler, bảng lane chậm và lệnh chạy lại theo từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn trên các image đã chuẩn bị thay vì các job chunk, giúp việc gỡ lỗi lane lỗi được giới hạn trong một job Docker có mục tiêu và chuẩn bị, tải xuống hoặc tái sử dụng artifact gói cho lần chạy đó; nếu một lane đã chọn là lane Docker live, job có mục tiêu sẽ build image live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub sinh theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name` và input image đã chuẩn bị khi các giá trị đó tồn tại, để một lane lỗi có thể tái sử dụng đúng gói và image từ lần chạy lỗi.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Plugin phát hành trước

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi operator rõ ràng. Pull request bình thường, push lên `main` và dispatch CI thủ công độc lập không chạy bộ này. Nó cân bằng kiểm thử Plugin đi kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các lô Plugin nặng import không tạo thêm job CI. Đường dẫn prerelease Docker chỉ dành cho phát hành gom các lane Docker có mục tiêu thành nhóm nhỏ để tránh giữ hàng chục runner cho các job kéo dài một đến ba phút.

## QA Lab

QA Lab có các lane CI chuyên dụng nằm ngoài workflow smart-scoped chính. Parity agentic được lồng dưới các harness QA và phát hành rộng, không phải một workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi parity cần đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó fan out lane parity mock, lane Matrix live, và các lane Telegram và Discord live thành các job song song. Job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các kiểm tra phát hành chạy các lane transport live Matrix và Telegram với provider mock xác định và model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để contract kênh được cô lập khỏi độ trễ model live và khởi động provider-plugin bình thường. Gateway transport live tắt tìm kiếm bộ nhớ vì QA parity kiểm phủ hành vi bộ nhớ riêng; kết nối provider được bao phủ bởi các bộ model live, provider gốc và provider Docker riêng.

Matrix dùng `--profile fast` cho các gate theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; gate QA parity của nó chạy các gói candidate và baseline dưới dạng các job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ để so sánh parity cuối cùng.

Đối với PR bình thường, hãy theo bằng chứng CI/check theo phạm vi thay vì xem parity là trạng thái bắt buộc.

## CodeQL

Quy trình làm việc `CodeQL` có chủ đích là trình quét bảo mật lượt đầu phạm vi hẹp, không phải lượt quét toàn bộ kho lưu trữ. Các lượt chạy bảo vệ hằng ngày, thủ công và cho yêu cầu kéo không phải bản nháp quét mã quy trình làm việc Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng các truy vấn bảo mật độ tin cậy cao, được lọc theo `security-severity` cao/nghiêm trọng.

Bảo vệ yêu cầu kéo được giữ nhẹ: nó chỉ khởi động cho các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như quy trình làm việc theo lịch. CodeQL cho Android và macOS không nằm trong mặc định của yêu cầu kéo.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, bí mật, sandbox, cron, và đường cơ sở gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cộng với runtime Plugin kênh, gateway, Plugin SDK, bí mật, điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | Bề mặt SSRF lõi, phân tích cú pháp IP, bảo vệ mạng, web-fetch, và chính sách SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, trình trợ giúp thực thi tiến trình, phân phối đi, và cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Bề mặt tin cậy cho cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, tải nguồn, và hợp đồng gói Plugin SDK |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Xây dựng ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được kiểm tra tính hợp lệ quy trình làm việc chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Xây dựng ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF được tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chi phối thời gian chạy ngay cả khi sạch.

### Danh mục Chất lượng Nghiêm trọng

`CodeQL Critical Quality` là shard phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không bảo mật, mức độ lỗi, trên các bề mặt hẹp có giá trị cao trên runner Blacksmith Linux nhỏ hơn. Bảo vệ yêu cầu kéo của nó có chủ đích nhỏ hơn hồ sơ theo lịch: các yêu cầu kéo không phải bản nháp chỉ chạy các shard tương ứng `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` cho mã thực thi lệnh/mô hình/công cụ của agent và điều phối phản hồi, mã schema/di chuyển/IO cấu hình, mã auth/bí mật/sandbox/bảo mật, runtime kênh lõi và Plugin kênh đi kèm, giao thức Gateway/server-method, runtime bộ nhớ/keo SDK, MCP/tiến trình/phân phối đi, danh mục runtime/mô hình của provider, hàng đợi chẩn đoán/phân phối phiên, loader Plugin, Plugin SDK/hợp đồng gói, hoặc thay đổi runtime phản hồi Plugin SDK. Các thay đổi cấu hình CodeQL và quy trình làm việc chất lượng chạy tất cả mười hai shard chất lượng cho yêu cầu kéo.

Điều phối thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là móc dạy/lặp để chạy riêng một shard chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật cho auth, bí mật, sandbox, cron, và gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Schema cấu hình, di chuyển, chuẩn hóa, và hợp đồng IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đi kèm                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, điều phối mô hình/provider, điều phối và hàng đợi tự động trả lời, và hợp đồng runtime mặt phẳng điều khiển ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình, và hợp đồng phân phối đi                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, bí danh Plugin SDK bộ nhớ, keo kích hoạt runtime bộ nhớ, và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi phản hồi, hàng đợi phân phối phiên, trình trợ giúp liên kết/phân phối phiên đi, bề mặt gói sự kiện/nhật ký chẩn đoán, và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối phản hồi vào Plugin SDK, trình trợ giúp payload/chia đoạn/runtime phản hồi, tùy chọn phản hồi kênh, hàng đợi phân phối, và trình trợ giúp liên kết phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, auth và khám phá provider, đăng ký runtime provider, mặc định/danh mục provider, và registry web/tìm kiếm/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI điều khiển, lưu bền vững cục bộ, luồng điều khiển gateway, và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime cho fetch/tìm kiếm web lõi, IO media, hiểu media, tạo ảnh, và tạo media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng loader, registry, bề mặt công khai, và entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và trình trợ giúp hợp đồng gói Plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lập lịch, đo lường, vô hiệu hóa, hoặc mở rộng mà không làm mờ tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python, và Plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc phân shard sau khi các hồ sơ hẹp có thời gian chạy và tín hiệu ổn định.

## Quy trình làm việc bảo trì

### Docs Agent

Quy trình làm việc `Docs Agent` là một lane bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được hợp nhất. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và điều phối thủ công có thể chạy trực tiếp. Các lần gọi workflow-run bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ trước. Khi chạy, nó rà soát phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lượt chạy hằng giờ có thể bao phủ tất cả thay đổi trên main đã tích lũy từ lượt tài liệu cuối.

### Test Performance Agent

Quy trình làm việc `Test Performance Agent` là một lane bảo trì Codex theo sự kiện dành cho các kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Điều phối thủ công bỏ qua cổng hoạt động hằng ngày đó. Lane này tạo báo cáo hiệu năng Vitest nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các sửa hiệu năng kiểm thử nhỏ vẫn giữ nguyên độ phủ thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử baseline đang pass. Nếu baseline có kiểm thử thất bại, Codex chỉ có thể sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau agent phải pass trước khi có bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi push của bot hạ cánh, lane này rebase bản vá đã xác thực, chạy lại `pnpm check:changed`, và thử push lại; các bản vá cũ bị xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub lưu trữ để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### Yêu cầu kéo trùng lặp sau khi hợp nhất

Quy trình làm việc `Duplicate PRs After Merge` là quy trình làm việc thủ công cho maintainer để dọn dẹp trùng lặp sau khi hạ cánh. Mặc định là dry-run và chỉ đóng các yêu cầu kéo được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng yêu cầu kéo đã hạ cánh đã được hợp nhất và mỗi bản trùng lặp hoặc có issue được tham chiếu chung hoặc có các hunk thay đổi chồng lấp.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck prod lõi và kiểm thử lõi cộng với lint/guard lõi;
- thay đổi chỉ kiểm thử lõi chỉ chạy typecheck kiểm thử lõi cộng với lint lõi;
- thay đổi production extension chạy typecheck prod extension và kiểm thử extension cộng với lint extension;
- thay đổi chỉ kiểm thử extension chạy typecheck kiểm thử extension cộng với lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (các lượt quét extension Vitest vẫn là công việc kiểm thử rõ ràng);
- bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- thay đổi root/cấu hình không xác định fail safe sang tất cả lane kiểm tra.

Định tuyến kiểm thử thay đổi cục bộ nằm trong `scripts/test-projects.test-support.mjs` và có chủ đích rẻ hơn `check:changed`: chỉnh sửa kiểm thử trực tiếp tự chạy chính chúng, chỉnh sửa nguồn ưu tiên ánh xạ rõ ràng, sau đó là kiểm thử anh em và phụ thuộc import-graph. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ rõ ràng: các thay đổi với cấu hình phản hồi hiển thị trong nhóm, chế độ phân phối phản hồi nguồn, hoặc prompt hệ thống message-tool được định tuyến qua các kiểm thử phản hồi lõi cộng với hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung thất bại trước lần push yêu cầu kéo đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness khiến tập ánh xạ rẻ không phải là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ thư mục gốc của repo và ưu tiên một box mới đã được làm nóng để có bằng chứng rộng. Trước khi dùng một gate chậm trên box đã được tái sử dụng, hết hạn, hoặc vừa báo cáo một lượt đồng bộ lớn bất ngờ, hãy chạy `pnpm testbox:sanity` bên trong box trước.

Kiểm tra sanity sẽ thất bại nhanh khi các tệp gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 lượt xóa có theo dõi. Điều đó thường có nghĩa là trạng thái đồng bộ từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng box đó và làm nóng một box mới thay vì gỡ lỗi lỗi kiểm thử sản phẩm. Với các PR cố ý xóa số lượng lớn, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lượt chạy sanity đó.

`pnpm testbox:run` cũng kết thúc một lệnh gọi Blacksmith CLI cục bộ nếu nó ở lại pha đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt chốt bảo vệ đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là đường dẫn remote-box thứ hai do repo sở hữu để cung cấp bằng chứng Linux khi Blacksmith không khả dụng hoặc khi nên dùng dung lượng cloud do dự án sở hữu. Làm nóng một box, hydrate nó thông qua workflow của dự án, rồi chạy lệnh qua Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` sở hữu các mặc định về provider, đồng bộ và hydrate qua GitHub Actions. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa riêng của nó thay vì đồng bộ các remote và kho đối tượng cục bộ của maintainer, đồng thời loại trừ các artifact runtime/build cục bộ không bao giờ nên được truyền đi. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không bí mật mà các lệnh `crabbox run --id <cbx_id>` sau đó sẽ source.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
