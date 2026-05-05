---
read_when:
    - Bạn cần hiểu vì sao một công việc CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions không đạt
    - Bạn đang điều phối một lượt chạy hoặc chạy lại xác thực bản phát hành
    - Bạn đang thay đổi việc điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị tác vụ CI, các cổng kiểm soát phạm vi, các nhóm bao trùm bản phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-05T06:16:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần đẩy lên `main` và mọi yêu cầu kéo. Tác vụ `preflight` phân loại phần khác biệt và tắt các làn tốn tài nguyên khi chỉ các khu vực không liên quan thay đổi. Các lần chạy thủ công `workflow_dispatch` cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho các ứng viên phát hành và xác thực diện rộng. Các làn Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong quy trình làm việc [`Plugin Prerelease`](#plugin-prerelease) riêng biệt và chỉ chạy từ [`Full Release Validation`](#full-release-validation) hoặc một lệnh điều phối thủ công rõ ràng.

## Tổng quan pipeline

| Tác vụ                           | Mục đích                                                                                                  | Khi chạy                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ liên quan đến tài liệu, phạm vi đã thay đổi, phần mở rộng đã thay đổi, và xây dựng manifest CI | Luôn chạy trên các lần đẩy và yêu cầu kéo không phải bản nháp |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm toán workflow thông qua `zizmor`                                          | Luôn chạy trên các lần đẩy và yêu cầu kéo không phải bản nháp |
| `security-dependency-audit`      | Kiểm toán lockfile production không cần phụ thuộc theo advisory npm                                       | Luôn chạy trên các lần đẩy và yêu cầu kéo không phải bản nháp |
| `security-fast`                  | Tổng hợp bắt buộc cho các tác vụ bảo mật nhanh                                                            | Luôn chạy trên các lần đẩy và yêu cầu kéo không phải bản nháp |
| `check-dependencies`             | Lượt kiểm tra Knip chỉ dành cho phụ thuộc production cộng với bộ bảo vệ danh sách cho phép tệp không dùng | Các thay đổi liên quan đến Node     |
| `build-artifacts`                | Xây dựng `dist/`, Control UI, kiểm tra artifact đã xây dựng, và artifact hạ nguồn tái sử dụng             | Các thay đổi liên quan đến Node     |
| `checks-fast-core`               | Các làn đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                           | Các thay đổi liên quan đến Node     |
| `checks-fast-contracts-channels` | Kiểm tra hợp đồng kênh dạng shard với kết quả kiểm tra tổng hợp ổn định                                   | Các thay đổi liên quan đến Node     |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ làn kênh, bundled, hợp đồng, và phần mở rộng                        | Các thay đổi liên quan đến Node     |
| `check`                          | Tương đương cổng cục bộ chính dạng shard: kiểu production, lint, bộ bảo vệ, kiểu kiểm thử, và smoke nghiêm ngặt | Các thay đổi liên quan đến Node     |
| `check-additional`               | Kiến trúc, drift boundary/prompt dạng shard, bộ bảo vệ phần mở rộng, boundary gói, và gateway watch       | Các thay đổi liên quan đến Node     |
| `build-smoke`                    | Kiểm thử smoke CLI đã xây dựng và smoke bộ nhớ khởi động                                                  | Các thay đổi liên quan đến Node     |
| `checks`                         | Bộ xác minh cho kiểm thử kênh artifact đã xây dựng                                                        | Các thay đổi liên quan đến Node     |
| `checks-node-compat-node22`      | Làn build và smoke tương thích Node 22                                                                    | Điều phối CI thủ công cho phát hành |
| `check-docs`                     | Định dạng tài liệu, lint, và kiểm tra liên kết hỏng                                                       | Tài liệu đã thay đổi                |
| `skills-python`                  | Ruff + pytest cho Skills dựa trên Python                                                                  | Các thay đổi liên quan đến skill Python |
| `checks-windows`                 | Kiểm thử quy trình/đường dẫn đặc thù Windows cộng với hồi quy bộ định danh import runtime dùng chung      | Các thay đổi liên quan đến Windows  |
| `macos-node`                     | Làn kiểm thử TypeScript trên macOS dùng artifact đã xây dựng dùng chung                                   | Các thay đổi liên quan đến macOS    |
| `macos-swift`                    | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                         | Các thay đổi liên quan đến macOS    |
| `android`                        | Kiểm thử đơn vị Android cho cả hai flavor cộng với một lần build APK debug                                | Các thay đổi liên quan đến Android  |
| `test-performance-agent`         | Tối ưu kiểm thử chậm hằng ngày bằng Codex sau hoạt động đáng tin cậy                                      | CI chính thành công hoặc điều phối thủ công |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với làn mock-provider, deep-profile, và GPT 5.4 live | Theo lịch và điều phối thủ công     |

## Thứ tự fail-fast

1. `preflight` quyết định những làn nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong tác vụ này, không phải tác vụ độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các tác vụ artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chồng lấp với các làn Linux nhanh để các consumer hạ nguồn có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Sau đó các làn nền tảng và runtime nặng hơn sẽ mở rộng: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các tác vụ bị thay thế là `cancelled` khi một lần đẩy mới hơn xuất hiện trên cùng yêu cầu kéo hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` nên chúng vẫn báo cáo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa đồng thời CI tự động có phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy thủ công toàn bộ bộ kiểm thử dùng `CI-manual-v1-*` và không hủy các lần chạy đang diễn ra.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Điều phối thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng bản thân chúng không buộc chạy build native Windows, Android, hoặc macOS; các làn nền tảng đó vẫn được giới hạn phạm vi theo thay đổi nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, một số chỉnh sửa fixture kiểm thử lõi rẻ, và chỉnh sửa hẹp ở helper/test-routing hợp đồng plugin** dùng đường dẫn manifest chỉ Node nhanh: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường dẫn đó bỏ qua artifact build, tương thích Node 22, hợp đồng kênh, shard lõi đầy đủ, shard bundled-plugin, và các ma trận bảo vệ bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp thực thi.
- **Kiểm tra Node trên Windows** được giới hạn phạm vi vào wrapper quy trình/đường dẫn đặc thù Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý gói, và các bề mặt workflow CI thực thi làn đó; thay đổi nguồn, plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn ở trên các làn Node Linux.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi tác vụ vẫn nhỏ mà không đặt trước runner quá mức: hợp đồng kênh chạy thành ba shard có trọng số, làn nhanh/hỗ trợ đơn vị lõi chạy riêng, hạ tầng runtime lõi được tách giữa shard trạng thái và quy trình/cấu hình, auto-reply chạy dưới dạng worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch, và commands/state-routing), còn cấu hình agentic gateway/server được tách trên các làn chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã xây dựng. Kiểm thử trình duyệt diện rộng, QA, media, và plugin linh tinh dùng cấu hình Vitest chuyên biệt của chúng thay vì catch-all plugin dùng chung. Các shard include-pattern ghi nhận mục thời gian bằng tên shard CI, nên `.artifacts/vitest-shard-timings.json` có thể phân biệt một cấu hình đầy đủ với một shard đã lọc. `check-additional` giữ công việc biên dịch/canary package-boundary cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; danh sách bộ bảo vệ boundary được chia sọc trên bốn shard ma trận, mỗi shard chạy đồng thời các bộ bảo vệ độc lập được chọn và in thời gian cho từng kiểm tra, bao gồm `pnpm prompt:snapshots:check` để drift prompt đường dẫn thành công runtime Codex được ghim vào yêu cầu kéo đã gây ra nó. Gateway watch, kiểm thử kênh, và shard support-boundary lõi chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được xây dựng.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi sau đó build APK debug Play. Flavor bên thứ ba không có source set hoặc manifest riêng; làn kiểm thử đơn vị của nó vẫn biên dịch flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh một tác vụ đóng gói APK debug trùng lặp trên mọi lần đẩy liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ dành cho phụ thuộc production được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh các phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Bộ bảo vệ tệp không dùng thất bại khi một yêu cầu kéo thêm một tệp không dùng mới chưa được xem xét hoặc để lại một mục danh sách cho phép đã cũ, đồng thời giữ lại các bề mặt plugin động, sinh tự động, build, live-test, và cầu nối gói có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động kho lưu trữ OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã yêu cầu kéo không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi điều phối payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn làn:

- `clawsweeper_item` cho các yêu cầu review chính xác đối với issue và yêu cầu kéo;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho các yêu cầu review cấp commit trên các lần đẩy `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Làn `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, kho lưu trữ, số mục, URL, tiêu đề, trạng thái, và đoạn trích ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ thân webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng sự kiện đã chuẩn hóa lên hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải gửi mặc định. Agent ClawSweeper nhận đích Discord trong prompt của nó và chỉ nên đăng lên `#clawsweeper` khi sự kiện bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về vận hành. Các lần mở, chỉnh sửa, biến động bot, nhiễu webhook trùng lặp, và lưu lượng review bình thường nên cho kết quả `NO_REPLY`.

Hãy xem tiêu đề, bình luận, thân, văn bản review, tên nhánh, và thông điệp commit của GitHub là dữ liệu không đáng tin cậy xuyên suốt đường dẫn này. Chúng là đầu vào để tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Điều phối thủ công

Các lượt kích hoạt CI thủ công chạy cùng đồ thị tác vụ như CI thông thường nhưng buộc bật mọi lane có phạm vi không phải Android: các shard Linux Node, các shard bundled-plugin, hợp đồng kênh, tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Python Skills, Windows, macOS và i18n Control UI. Các lượt kích hoạt CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh prerelease Plugin, shard chỉ dành cho phát hành `agentic-plugins`, lượt quét batch extension đầy đủ và các lane Docker prerelease Plugin được loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` kích hoạt workflow `Plugin Prerelease` riêng với gate release-validation được bật.

Các lượt chạy thủ công dùng một nhóm concurrency duy nhất để bộ đầy đủ release-candidate không bị hủy bởi một lượt push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một branch, tag hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ dispatch ref đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Tác vụ                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các tác vụ bảo mật nhanh và aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), kiểm tra protocol/contract/bundled nhanh, kiểm tra hợp đồng kênh dạng shard, các shard `check` ngoại trừ lint, các shard và aggregate `check-additional`, verifier aggregate kiểm thử Node, kiểm tra tài liệu, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight cũng dùng Ubuntu do GitHub host để ma trận Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension tải thấp hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Linux Node, các shard kiểm thử bundled Plugin, `android`                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (đủ nhạy với CPU đến mức 8 vCPU tốn nhiều hơn phần tiết kiệm được); các build Docker install-smoke (thời gian xếp hàng 32-vCPU tốn nhiều hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Các lệnh tương đương cục bộ

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

Kích hoạt thủ công thường benchmark workflow ref. Đặt `target_ref` để benchmark một release tag hoặc branch khác với triển khai workflow hiện tại. Các đường dẫn báo cáo đã publish và con trỏ latest được key theo ref đã kiểm thử, và mỗi `index.md` ghi lại ref/SHA đã kiểm thử, workflow ref/SHA, Kova ref, profile, chế độ xác thực lane, model, số lần lặp và bộ lọc kịch bản.

Workflow cài đặt OCM từ một release đã pin và Kova từ `openclaw/Kova` tại input `kova_ref` đã pin, sau đó chạy ba lane:

- `mock-provider`: Các kịch bản chẩn đoán Kova chạy trên runtime build cục bộ với xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: Profiling CPU/heap/trace cho các điểm nóng startup, Gateway và agent-turn.
- `live-gpt54`: Một lượt agent OpenAI `openai/gpt-5.4` thật, được bỏ qua khi `OPENAI_API_KEY` không có sẵn.

Lane mock-provider cũng chạy các source probe gốc OpenClaw sau lượt Kova: thời gian boot Gateway và bộ nhớ qua các trường hợp startup mặc định, hook và 50-Plugin; các vòng hello lặp lại của mock-OpenAI `channel-chat-baseline`; và các lệnh khởi động CLI chạy với Gateway đã boot. Tóm tắt Markdown của source probe nằm tại `source/index.md` trong gói báo cáo, kèm JSON thô bên cạnh.

Mỗi lane tải lên GitHub artifacts. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các bundle, `index.md` và artifact source-probe vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ tested-ref hiện tại được ghi thành `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực phát hành đầy đủ

`Full Release Validation` là workflow umbrella thủ công cho việc "chạy mọi thứ trước khi phát hành." Nó nhận một branch, tag hoặc SHA commit đầy đủ, kích hoạt workflow `CI` thủ công với target đó, kích hoạt `Plugin Prerelease` để cung cấp bằng chứng chỉ dành cho phát hành về Plugin/package/static/Docker, và kích hoạt `OpenClaw Release Checks` cho install smoke, chấp nhận package, kiểm tra package đa hệ điều hành, QA Lab parity, Matrix và các lane Telegram. Các lượt chạy stable/default giữ phạm vi live/E2E toàn diện và đường phát hành Docker phía sau `run_release_soak=true`; `release_profile=full` buộc bật phạm vi soak đó để xác thực advisory rộng vẫn giữ được độ bao phủ rộng. Với `rerun_group=all` và `release_profile=full`, nó cũng chạy `NPM Telegram Beta E2E` trên artifact `release-package-under-test` từ release checks. Sau khi publish, truyền `npm_telegram_package_spec` để chạy lại cùng lane package Telegram trên package npm đã publish.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận stage, tên tác vụ workflow chính xác, khác biệt giữa các profile, artifacts và
các handle rerun tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Kích hoạt nó
từ `release/YYYY.M.D` hoặc `main` sau khi release tag tồn tại và sau khi
OpenClaw npm preflight đã thành công. Nó xác minh `pnpm plugins:sync:check`,
kích hoạt `Plugin NPM Release` cho mọi package Plugin có thể publish, kích hoạt
`Plugin ClawHub Release` cho cùng release SHA, và chỉ sau đó mới kích hoạt
`OpenClaw NPM Release` với `preflight_run_id` đã lưu.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit đã pin trên một branch thay đổi nhanh, dùng helper thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Các workflow dispatch ref của GitHub phải là branch hoặc tag, không phải SHA commit thô. Helper
push một branch tạm `release-ci/<sha>-...` tại SHA target,
kích hoạt `Full Release Validation` từ ref đã pin đó, xác minh mọi workflow con
có `headSha` khớp với target, và xóa branch tạm khi lượt chạy
hoàn tất. Umbrella verifier cũng fail nếu bất kỳ workflow con nào chạy tại
SHA khác.

`release_profile` kiểm soát phạm vi live/provider được truyền vào các kiểm tra phát hành. Các workflow phát hành thủ công mặc định dùng `stable`; chỉ dùng `full` khi bạn chủ ý muốn ma trận provider/media tư vấn rộng. `run_release_soak` kiểm soát việc các kiểm tra phát hành stable/mặc định có chạy bước soak release-path Docker và live/E2E toàn diện hay không; `full` bắt buộc bật soak.

- `minimum` giữ các lane OpenAI/core nhanh nhất và thiết yếu cho phát hành.
- `stable` thêm tập provider/backend ổn định.
- `full` chạy ma trận provider/media tư vấn rộng.

Umbrella ghi lại id của các lượt chạy con đã dispatch, và job cuối cùng `Verify full validation` kiểm tra lại conclusion hiện tại của các lượt chạy con và nối thêm bảng job chậm nhất cho từng lượt chạy con. Nếu một workflow con được chạy lại và chuyển sang xanh, chỉ chạy lại job verifier cha để làm mới kết quả umbrella và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho child CI đầy đủ bình thường, `plugin-prerelease` chỉ cho child prerelease Plugin, `release-checks` cho mọi child phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên umbrella. Điều này giữ phạm vi chạy lại hộp phát hành bị lỗi ở mức giới hạn sau một bản sửa tập trung. Với một lane cross-OS bị lỗi, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh cross-OS dài phát ra dòng Heartbeat và các tóm tắt packaged-upgrade bao gồm thời gian theo từng phase. Các lane kiểm tra phát hành QA mang tính tư vấn, nên lỗi chỉ ở QA sẽ cảnh báo nhưng không chặn verifier kiểm tra phát hành.

`OpenClaw Release Checks` dùng workflow ref đáng tin cậy để resolve ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho kiểm tra cross-OS và Chấp nhận gói, cùng workflow Docker release-path live/E2E khi chạy phạm vi soak. Điều này giữ byte gói nhất quán trên các hộp phát hành và tránh đóng gói lại cùng ứng viên trong nhiều job con.

Các lượt chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
sẽ thay thế umbrella cũ hơn. Monitor cha hủy mọi workflow con mà nó
đã dispatch khi parent bị hủy, nên validation main mới hơn
không bị kẹt sau một lượt chạy kiểm tra phát hành cũ kéo dài hai giờ. Validation branch/tag phát hành
và các nhóm rerun tập trung giữ `cancel-in-progress: false`.

## Các shard live và E2E

Child live/E2E phát hành giữ phạm vi bao phủ `pnpm test:live` native rộng, nhưng chạy phạm vi đó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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
- các shard media audio/video được tách riêng và các shard music được lọc theo provider

Điều đó giữ nguyên phạm vi bao phủ file đồng thời giúp các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần rerun thủ công một lần.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi setup. Giữ các suite live dựa trên Docker trên runner Blacksmith bình thường — container job không phải nơi phù hợp để khởi chạy các kiểm thử Docker lồng nhau.

Các shard model/backend live dựa trên Docker dùng một image dùng chung riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit đã chọn. Workflow phát hành live build và push image đó một lần, rồi các shard model live Docker, Gateway được chia theo provider, backend CLI, bind ACP, và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Docker Gateway mang các giới hạn `timeout` rõ ràng ở cấp script, thấp hơn timeout job workflow, để container hoặc đường dọn dẹp bị kẹt thất bại nhanh thay vì tiêu hết ngân sách kiểm tra phát hành. Nếu các shard đó tự build lại đầy đủ target Docker nguồn một cách độc lập, lượt chạy phát hành đã bị cấu hình sai và sẽ lãng phí thời gian thực tế vào các build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI bình thường: CI bình thường xác thực cây nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng dùng sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, resolve một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, upload cả hai dưới dạng artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256, và profile trong tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory tarball, chuẩn bị các image Docker package-digest khi cần, và chạy các lane Docker đã chọn trên gói đó thay vì đóng gói workflow checkout. Khi một profile chọn nhiều `docker_lanes` có mục tiêu, workflow tái sử dụng chuẩn bị gói và image dùng chung một lần, rồi fan out các lane đó thành các job Docker có mục tiêu song song với artifact duy nhất.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Chấp nhận gói đã resolve một artifact; dispatch Telegram độc lập vẫn có thể cài đặt một npm spec đã phát hành.
4. `summary` làm workflow thất bại nếu resolve gói, chấp nhận Docker, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng nguồn này cho chấp nhận prerelease/stable đã phát hành.
- `source=ref` đóng gói một branch, tag, hoặc SHA commit đầy đủ đáng tin cậy trong `package_ref`. Resolver fetch các branch/tag OpenClaw, xác minh commit đã chọn có thể truy cập được từ lịch sử branch repository hoặc một tag phát hành, cài đặt dependency trong một worktree tách rời, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng thêm `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk Docker release-path đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng phạm vi bao phủ Plugin offline để validation gói đã phát hành không bị phụ thuộc vào tình trạng sẵn sàng live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, đồng thời giữ đường dẫn npm spec đã phát hành cho các dispatch độc lập.

Để xem chính sách kiểm thử cập nhật và Plugin chuyên biệt, bao gồm các lệnh cục bộ,
lane Docker, input Chấp nhận gói, mặc định phát hành, và phân loại lỗi,
xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Kiểm tra phát hành gọi Chấp nhận gói với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ proof migration gói, cập nhật, dọn dẹp dependency Plugin cũ, sửa cài đặt Plugin đã cấu hình, Plugin offline, plugin-update, và Telegram trên cùng tarball gói đã resolve. Đặt `package_acceptance_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks để chạy cùng ma trận đó với một gói npm đã phát hành thay vì artifact build từ SHA. Kiểm tra phát hành cross-OS vẫn bao phủ onboarding, installer, và hành vi nền tảng theo OS; validation sản phẩm gói/cập nhật nên bắt đầu bằng Chấp nhận gói. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã phát hành cho mỗi lượt chạy trong đường dẫn phát hành chặn. Trong Chấp nhận gói, tarball `package-under-test` đã resolve luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã phát hành để fallback, mặc định là `openclaw@latest`; các lệnh rerun lane thất bại giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng trên bốn bản phát hành npm stable mới nhất cộng với các bản phát hành ranh giới tương thích Plugin được ghim và fixture theo dạng issue cho cấu hình Feishu, các file bootstrap/persona được giữ lại, cài đặt Plugin OpenClaw đã cấu hình, đường dẫn log dấu ngã, và các root dependency Plugin legacy cũ. Các lựa chọn published-upgrade survivor nhiều baseline được shard theo baseline thành các job runner Docker có mục tiêu riêng biệt. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã phát hành toàn diện, không phải phạm vi CI Full Release bình thường. Các lượt chạy tổng hợp cục bộ có thể truyền package spec chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã phát hành cấu hình baseline bằng một công thức lệnh `openclaw config set` được nướng sẵn, ghi lại các bước công thức trong `summary.json`, và probe `/healthz`, `/readyz`, cùng trạng thái RPC sau khi Gateway khởi động. Các lane Windows packaged và installer fresh cũng xác minh rằng một gói đã cài đặt có thể import override browser-control từ đường dẫn Windows tuyệt đối thô. Smoke lượt agent cross-OS OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.4`, để proof cài đặt và Gateway vẫn dùng model kiểm thử GPT-5 đồng thời tránh các mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Chấp nhận gói có các cửa sổ tương thích legacy có giới hạn cho các gói đã phát hành. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ tới các file bị bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase persistence `gateway install --wrapper` khi gói không expose flag đó;
- `update-channel-switch` có thể prune `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả bắt nguồn từ tarball và có thể log `update.channel` đã persist bị thiếu;
- các smoke Plugin có thể đọc vị trí install-record legacy hoặc chấp nhận thiếu persistence install-record marketplace;
- `plugin-update` có thể cho phép migration metadata cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu metadata bản dựng cục bộ đã được phát hành. Các gói về sau phải đáp ứng các hợp đồng hiện đại; trong cùng điều kiện, chúng sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy kiểm nhận gói thất bại, hãy bắt đầu từ phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời lượng từng pha và các lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói đã thất bại hoặc chính xác các lane Docker thay vì chạy lại toàn bộ xác thực phát hành.

## Kiểm thử nhanh cài đặt

Workflow `Install Smoke` riêng biệt tái sử dụng cùng script phạm vi thông qua job `preflight` riêng. Nó chia phạm vi kiểm thử nhanh thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường nhanh** chạy cho pull request chạm đến bề mặt Docker/gói, thay đổi gói/manifest Plugin đi kèm, hoặc các bề mặt Plugin/lõi kênh/Gateway/Plugin SDK mà các job kiểm thử nhanh Docker thực thi. Thay đổi chỉ ở mã nguồn Plugin đi kèm, chỉnh sửa chỉ liên quan đến kiểm thử và chỉnh sửa chỉ tài liệu không giữ trước worker Docker. Đường nhanh dựng ảnh Dockerfile gốc một lần, kiểm tra CLI, chạy kiểm thử nhanh CLI xóa tác tử trong workspace dùng chung, chạy e2e Gateway mạng container, xác minh một tham số dựng phần mở rộng đi kèm, và chạy hồ sơ Docker Plugin đi kèm có giới hạn dưới timeout lệnh tổng hợp 240 giây (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường đầy đủ** giữ lại kiểm thử cài đặt gói QR và phạm vi Docker/cập nhật trình cài đặt cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call và pull request thực sự chạm đến bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một ảnh kiểm thử nhanh Dockerfile gốc GHCR theo SHA mục tiêu, rồi chạy cài đặt gói QR, kiểm thử nhanh Dockerfile gốc/Gateway, kiểm thử nhanh trình cài đặt/cập nhật và Docker E2E Plugin đi kèm đường nhanh dưới dạng các job riêng để công việc trình cài đặt không phải chờ sau các kiểm thử nhanh ảnh gốc.

Các lần push lên `main` (bao gồm commit merge) không ép buộc đường đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một push, workflow giữ kiểm thử nhanh Docker đường nhanh và để kiểm thử nhanh cài đặt đầy đủ cho hằng đêm hoặc xác thực phát hành.

Kiểm thử nhanh nhà cung cấp ảnh cài đặt toàn cục Bun chậm được kiểm soát riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, đồng thời các dispatch thủ công của `Install Smoke` có thể chọn bật nó, nhưng pull request và push lên `main` thì không. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng tập trung vào cài đặt.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng trước một ảnh live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, và dựng hai ảnh `scripts/e2e/Dockerfile` dùng chung:

- một trình chạy Node/Git tối giản cho các lane trình cài đặt/cập nhật/phụ thuộc Plugin;
- một ảnh chức năng cài đặt cùng tarball vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn ảnh theo từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số điều chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot nhóm chính cho các lane thông thường.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot nhóm cuối nhạy với nhà cung cấp.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để nhà cung cấp không bị throttle.                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane đa dịch vụ đồng thời.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Khoảng giãn giữa các lần bắt đầu lane để tránh bão tạo trên daemon Docker; đặt `0` để không giãn. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Timeout dự phòng theo từng lane (120 phút); một số lane live/cuối được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` in kế hoạch bộ lập lịch mà không chạy lane.                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Danh sách lane chính xác phân tách bằng dấu phẩy; bỏ qua kiểm thử nhanh dọn dẹp để tác tử có thể tái hiện một lane thất bại. |

Một lane nặng hơn giới hạn hiệu lực của nó vẫn có thể bắt đầu từ một nhóm trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Tiền kiểm cục bộ tổng hợp kiểm tra Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời lượng lane để sắp xếp dài nhất trước, và mặc định dừng lập lịch các lane trong nhóm mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` để biết cần gói nào, loại ảnh nào, ảnh live nào, lane nào và phạm vi thông tin xác thực nào. Sau đó `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại, hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; dựng và đẩy các ảnh Docker E2E GHCR tối giản/chức năng được gắn tag theo digest gói thông qua bộ nhớ đệm lớp Docker của Blacksmith khi kế hoạch cần các lane đã cài gói; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` đã cung cấp hoặc ảnh theo digest gói hiện có thay vì dựng lại. Các lần pull ảnh Docker được thử lại với timeout giới hạn 180 giây cho mỗi lần thử để một luồng registry/cache bị kẹt thử lại nhanh chóng thay vì tiêu tốn phần lớn đường tới hạn CI.

### Các đoạn đường phát hành

Phạm vi Docker phát hành chạy các job chia nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi đoạn chỉ pull loại ảnh cần thiết và thực thi nhiều lane qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các đoạn Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các alias Plugin/runtime tổng hợp. Alias lane `install-e2e` vẫn là alias chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt nhà cung cấp.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ đoạn `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật kênh đi kèm thử lại một lần đối với lỗi mạng npm tạm thời.

Mỗi đoạn tải lên `.artifacts/docker-tests/` với nhật ký lane, thời lượng, `summary.json`, `failures.json`, thời lượng từng pha, JSON kế hoạch bộ lập lịch, bảng lane chậm và lệnh chạy lại theo từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn trên các ảnh đã chuẩn bị thay vì các job đoạn, nhờ đó việc gỡ lỗi lane thất bại được giới hạn trong một job Docker có mục tiêu và chuẩn bị, tải xuống hoặc tái sử dụng artifact gói cho lần chạy đó; nếu lane đã chọn là lane Docker live, job có mục tiêu sẽ dựng ảnh live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name`, và input ảnh đã chuẩn bị khi các giá trị đó tồn tại, để một lane thất bại có thể tái sử dụng chính xác gói và ảnh từ lần chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy bộ Docker release-path đầy đủ hằng ngày.

## Plugin Trước phát hành

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, push lên `main`, và dispatch CI thủ công độc lập giữ bộ kiểm thử đó ở trạng thái tắt. Nó cân bằng các kiểm thử Plugin đi kèm trên tám worker phần mở rộng; các job shard phần mở rộng đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch Plugin nặng import không tạo thêm job CI. Đường Docker trước phát hành chỉ dành cho phát hành gom các lane Docker có mục tiêu thành các nhóm nhỏ để tránh giữ trước hàng chục runner cho các job kéo dài một đến ba phút.

## QA Lab

QA Lab có các lane CI chuyên dụng nằm ngoài workflow chính được phân phạm vi thông minh. Tính tương đương tác tử được lồng dưới các harness QA và phát hành rộng, không phải một workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi tính tương đương cần đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó phân tán lane tương đương mock, lane Matrix live, và các lane Telegram và Discord live thành các job song song. Job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các kiểm tra phát hành chạy các lane truyền tải Matrix và Telegram live với nhà cung cấp mock xác định và các mô hình đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được tách khỏi độ trễ mô hình live và khởi động Plugin nhà cung cấp thông thường. Gateway truyền tải live tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; kết nối nhà cung cấp được bao phủ bởi các bộ kiểm thử live model, nhà cung cấp native và nhà cung cấp Docker riêng.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; cổng QA parity của nó chạy các gói ứng viên và baseline dưới dạng các job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ cho lần so sánh tương đương cuối cùng.

Đối với các PR thông thường, hãy làm theo bằng chứng CI/kiểm tra theo phạm vi thay vì coi parity là trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` được chủ ý thiết kế như một trình quét bảo mật lượt đầu có phạm vi hẹp, không phải lượt quét toàn bộ kho lưu trữ. Các lượt chạy bảo vệ hằng ngày, thủ công và trên pull request không phải bản nháp quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript có rủi ro cao nhất bằng các truy vấn bảo mật độ tin cậy cao, được lọc theo `security-severity` mức cao/nghiêm trọng.

Bảo vệ pull request vẫn nhẹ: nó chỉ khởi chạy cho các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. CodeQL Android và macOS không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Xác thực, bí mật, sandbox, cron, và đường cơ sở Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cộng với runtime Plugin kênh, Gateway, Plugin SDK, bí mật, điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt SSRF lõi, phân tích cú pháp IP, bảo vệ mạng, web-fetch, và chính sách SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, trình trợ giúp thực thi tiến trình, phân phối đi, và cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của cài đặt Plugin, trình nạp, manifest, registry, cài đặt package-manager, nạp nguồn, và hợp đồng gói Plugin SDK |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Xây dựng ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Xây dựng ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc ra khỏi SARIF được tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chi phối thời gian chạy ngay cả khi sạch.

### Danh mục chất lượng nghiêm trọng

`CodeQL Critical Quality` là shard không liên quan đến bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không liên quan đến bảo mật, mức độ lỗi, trên các bề mặt giá trị cao có phạm vi hẹp trên runner Blacksmith Linux nhỏ hơn. Bảo vệ pull request của nó được chủ ý nhỏ hơn hồ sơ theo lịch: PR không phải bản nháp chỉ chạy các shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` tương ứng cho mã thực thi lệnh/mô hình/công cụ của agent và điều phối phản hồi, mã schema/migration/IO cấu hình, mã xác thực/bí mật/sandbox/bảo mật, runtime kênh lõi và Plugin kênh được đóng gói, giao thức Gateway/phương thức máy chủ, runtime bộ nhớ/keo SDK, MCP/tiến trình/phân phối đi, runtime nhà cung cấp/danh mục mô hình, chẩn đoán phiên/hàng đợi phân phối, trình nạp Plugin, Plugin SDK/hợp đồng gói, hoặc các thay đổi runtime phản hồi Plugin SDK. Các thay đổi cấu hình CodeQL và workflow chất lượng chạy toàn bộ mười hai shard chất lượng PR.

Điều phối thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là móc dạy/lặp để chạy riêng một shard chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật xác thực, bí mật, sandbox, cron, và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Hợp đồng schema cấu hình, migration, chuẩn hóa, và IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh được đóng gói                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi tự động phản hồi, và hợp đồng runtime mặt phẳng điều khiển ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình, và hợp đồng phân phối đi                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, keo kích hoạt runtime bộ nhớ, và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi phản hồi, hàng đợi phân phối phiên, trình trợ giúp gắn kết/phân phối phiên đi, bề mặt sự kiện chẩn đoán/gói log, và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối phản hồi đến Plugin SDK, trình trợ giúp payload/chunking/runtime phản hồi, tùy chọn phản hồi kênh, hàng đợi phân phối, và trình trợ giúp gắn kết phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, xác thực và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/danh mục nhà cung cấp, và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI điều khiển, lưu trữ cục bộ, luồng điều khiển Gateway, và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime fetch/search web lõi, IO phương tiện, hiểu phương tiện, tạo ảnh, và tạo phương tiện                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng trình nạp, registry, bề mặt công khai, và điểm vào Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và trình trợ giúp hợp đồng gói Plugin                                                                                      |

Chất lượng được tách riêng khỏi bảo mật để các phát hiện về chất lượng có thể được lên lịch, đo lường, vô hiệu hóa, hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python, và Plugin được đóng gói chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc chia shard sau khi các hồ sơ hẹp có thời gian chạy và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một lane bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được merge. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và điều phối thủ công có thể chạy trực tiếp. Các invocation từ workflow-run bỏ qua khi `main` đã tiến tiếp hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ vừa qua. Khi chạy, nó rà soát dải commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lượt chạy hằng giờ có thể bao phủ mọi thay đổi trên main được tích lũy kể từ lượt tài liệu gần nhất.

### Test Performance Agent

Workflow `Test Performance Agent` là một lane bảo trì Codex theo sự kiện cho các kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một invocation workflow-run khác đã chạy hoặc đang chạy trong cùng ngày UTC. Điều phối thủ công bỏ qua cổng hoạt động hằng ngày đó. Lane này tạo báo cáo hiệu năng Vitest gom nhóm toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các sửa lỗi hiệu năng kiểm thử nhỏ vẫn giữ phạm vi bao phủ thay vì refactor rộng, rồi chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử pass ở đường cơ sở. Nếu đường cơ sở có kiểm thử thất bại, Codex chỉ có thể sửa các lỗi hiển nhiên và báo cáo toàn bộ bộ kiểm thử sau agent phải pass trước khi bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi bot push hoàn tất, lane này rebase bản vá đã được xác thực, chạy lại `pnpm check:changed`, và thử push lại; các bản vá cũ bị xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub host để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi merge

Workflow `Duplicate PRs After Merge` là workflow maintainer thủ công để dọn dẹp bản trùng lặp sau khi land. Mặc định là chạy thử và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi bản trùng lặp có một issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- các thay đổi sản xuất lõi chạy typecheck sản xuất lõi và kiểm thử lõi cộng với lint/bảo vệ lõi;
- các thay đổi chỉ liên quan đến kiểm thử lõi chỉ chạy typecheck kiểm thử lõi cộng với lint lõi;
- các thay đổi sản xuất extension chạy typecheck sản xuất extension và kiểm thử extension cộng với lint extension;
- các thay đổi chỉ liên quan đến kiểm thử extension chạy typecheck kiểm thử extension cộng với lint extension;
- các thay đổi Plugin SDK công khai hoặc hợp đồng Plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (các lượt quét extension Vitest vẫn là công việc kiểm thử rõ ràng);
- các bump phiên bản chỉ liên quan đến metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- các thay đổi root/cấu hình không xác định fail an toàn sang tất cả các lane kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và được chủ ý làm rẻ hơn `check:changed`: các chỉnh sửa kiểm thử trực tiếp tự chạy chính chúng, chỉnh sửa nguồn ưu tiên ánh xạ rõ ràng, rồi đến kiểm thử cùng cấp và phần phụ thuộc của import-graph. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ rõ ràng: các thay đổi đối với cấu hình visible-reply của nhóm, chế độ phân phối phản hồi nguồn, hoặc system prompt của message-tool định tuyến qua kiểm thử phản hồi lõi cộng với hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung thất bại trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập ánh xạ rẻ không phải proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ gốc repo và ưu tiên một box mới đã được làm nóng để có bằng chứng rộng. Trước khi dành một gate chậm cho một box đã được tái sử dụng, hết hạn, hoặc vừa báo cáo một lần đồng bộ lớn bất thường, hãy chạy `pnpm testbox:sanity` bên trong box trước.

Kiểm tra sanity sẽ thất bại nhanh khi các tệp gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 lượt xóa có theo dõi. Điều đó thường có nghĩa là trạng thái đồng bộ từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng box đó và làm nóng một box mới thay vì gỡ lỗi lỗi kiểm thử sản phẩm. Với các PR chủ ý xóa số lượng lớn, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng kết thúc một lệnh gọi Blacksmith CLI cục bộ nếu nó ở lại giai đoạn đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt bảo vệ đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là wrapper remote-box do repo sở hữu cho bằng chứng Linux của maintainer. Dùng nó khi một kiểm tra quá rộng cho local loopback chỉnh sửa cục bộ, khi tính tương đương với CI quan trọng, hoặc khi bằng chứng cần secret, Docker, các lane gói, box tái sử dụng được, hoặc nhật ký từ xa. Backend OpenClaw thông thường là `blacksmith-testbox`; năng lực AWS/Hetzner sở hữu là phương án dự phòng khi Blacksmith ngừng hoạt động, gặp vấn đề quota, hoặc cần kiểm thử rõ ràng trên năng lực sở hữu.

Trước lần chạy đầu tiên, kiểm tra wrapper từ gốc repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper của repo từ chối binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider rõ ràng dù `.crabbox.yaml` có mặc định owned-cloud.

Gate thay đổi:

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

Bộ kiểm thử đầy đủ:

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

Đọc phần tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Các lần chạy Crabbox dùng một lần được Blacksmith hỗ trợ nên tự động dừng Testbox; nếu một lần chạy bị gián đoạn hoặc việc dọn dẹp chưa rõ ràng, kiểm tra các box đang hoạt động và chỉ dừng các box bạn đã tạo:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Chỉ dùng tái sử dụng khi bạn chủ ý cần nhiều lệnh trên cùng một box đã được hydrate:

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

Chỉ leo thang sang năng lực Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn quota, thiếu môi trường cần thiết, hoặc năng lực sở hữu là mục tiêu rõ ràng:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` sở hữu các mặc định provider, đồng bộ, và hydrate GitHub Actions cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa riêng thay vì đồng bộ remote và kho đối tượng cục bộ của maintainer, và nó loại trừ các artifact runtime/build cục bộ không bao giờ nên được truyền đi. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không phải secret cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
