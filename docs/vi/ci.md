---
read_when:
    - Bạn cần hiểu lý do một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lượt chạy hoặc chạy lại quá trình xác thực bản phát hành
    - Bạn đang thay đổi việc điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị tác vụ CI, các cổng kiểm tra theo phạm vi, các nhóm bao trùm phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-07T01:51:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần đẩy lên `main` và mọi pull request. Job `preflight` phân loại diff và tắt các lane tốn kém khi chỉ những khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho release candidate và xác thực diện rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong workflow [`Plugin trước phát hành`](#plugin-prerelease) riêng và chỉ chạy từ [`Xác thực phát hành đầy đủ`](#full-release-validation) hoặc một dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                              | Mục đích                                                                                                  | Khi chạy                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ liên quan đến tài liệu, phạm vi đã thay đổi, extension đã thay đổi, và xây dựng manifest CI | Luôn chạy trên push và PR không phải bản nháp |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra workflow qua `zizmor`                                                 | Luôn chạy trên push và PR không phải bản nháp |
| `security-dependency-audit`      | Kiểm tra lockfile production không phụ thuộc vào dependency dựa trên cảnh báo npm                         | Luôn chạy trên push và PR không phải bản nháp |
| `security-fast`                  | Tổng hợp bắt buộc cho các job bảo mật nhanh                                                               | Luôn chạy trên push và PR không phải bản nháp |
| `check-dependencies`             | Lượt kiểm tra Knip chỉ dành cho dependency production cùng bộ bảo vệ allowlist tệp không dùng             | Thay đổi liên quan đến Node         |
| `build-artifacts`                | Xây dựng `dist/`, Control UI, kiểm tra artifact đã build, và artifact downstream có thể tái sử dụng       | Thay đổi liên quan đến Node         |
| `checks-fast-core`               | Các lane đúng đắn Linux nhanh như kiểm tra bundled/plugin-contract/protocol                               | Thay đổi liên quan đến Node         |
| `checks-fast-contracts-channels` | Kiểm tra hợp đồng kênh được shard với kết quả kiểm tra tổng hợp ổn định                                  | Thay đổi liên quan đến Node         |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ lane kênh, bundled, hợp đồng, và extension                         | Thay đổi liên quan đến Node         |
| `check`                          | Tương đương cổng cục bộ chính được shard: kiểu production, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt | Thay đổi liên quan đến Node         |
| `check-additional`               | Kiến trúc, drift ranh giới/prompt được shard, guard extension, ranh giới package, và gateway watch        | Thay đổi liên quan đến Node         |
| `build-smoke`                    | Kiểm thử smoke CLI đã build và smoke bộ nhớ khởi động                                                     | Thay đổi liên quan đến Node         |
| `checks`                         | Bộ xác minh cho kiểm thử kênh artifact đã build                                                          | Thay đổi liên quan đến Node         |
| `checks-node-compat-node22`      | Lane build và smoke tương thích Node 22                                                                   | Dispatch CI thủ công cho phát hành  |
| `check-docs`                     | Kiểm tra định dạng tài liệu, lint, và liên kết hỏng                                                       | Tài liệu thay đổi                   |
| `skills-python`                  | Ruff + pytest cho skills dựa trên Python                                                                 | Thay đổi liên quan đến skill Python |
| `checks-windows`                 | Kiểm thử quy trình/đường dẫn đặc thù Windows cùng hồi quy specifier import runtime dùng chung             | Thay đổi liên quan đến Windows      |
| `macos-node`                     | Lane kiểm thử TypeScript macOS dùng artifact đã build dùng chung                                          | Thay đổi liên quan đến macOS        |
| `macos-swift`                    | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                         | Thay đổi liên quan đến macOS        |
| `android`                        | Kiểm thử đơn vị Android cho cả hai flavor cùng một bản build APK debug                                    | Thay đổi liên quan đến Android      |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm hằng ngày của Codex sau hoạt động đáng tin cậy                                   | CI main thành công hoặc dispatch thủ công |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile, và GPT 5.4 live | Theo lịch và dispatch thủ công      |

## Thứ tự fail-fast

1. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không cần chờ các job artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các lane Linux nhanh để các consumer downstream có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn mở rộng sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi có push mới hơn lên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` nên chúng vẫn báo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa đồng thời CI tự động được gắn phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang diễn ra.

Job `ci-timings-summary` tải lên artifact `ci-timings-summary` gọn cho mỗi lần chạy CI không phải bản nháp. Nó ghi lại thời gian thực, thời gian hàng đợi, các job chậm nhất, và các job thất bại cho lần chạy hiện tại, để kiểm tra sức khỏe CI không cần quét lặp lại toàn bộ payload Actions.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và làm manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cùng lint workflow, nhưng tự thân chúng không ép các bản build native Windows, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi mã nguồn nền tảng.
- **Chỉnh sửa chỉ liên quan đến định tuyến CI, chỉnh sửa fixture core-test rẻ được chọn, và chỉnh sửa helper/test-routing hợp đồng plugin hẹp** dùng đường dẫn manifest nhanh chỉ Node: `preflight`, bảo mật, và một tác vụ `checks-fast-core`. Đường dẫn đó bỏ qua artifact build, tương thích Node 22, hợp đồng kênh, các shard lõi đầy đủ, shard bundled-plugin, và ma trận guard bổ sung khi thay đổi bị giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp thực thi.
- **Kiểm tra Node Windows** được giới hạn cho các wrapper quy trình/đường dẫn đặc thù Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package, và các bề mặt workflow CI thực thi lane đó; thay đổi mã nguồn, plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn nằm trên các lane Linux Node.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không giữ runner quá mức: hợp đồng kênh chạy dưới dạng ba shard có trọng số, các lane core unit fast/support chạy riêng, hạ tầng runtime lõi được tách giữa các shard state, process/config, cron, và shared, auto-reply chạy dưới dạng worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch, và commands/state-routing), và cấu hình gateway/server agentic được tách giữa các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã build. Các kiểm thử trình duyệt, QA, media, và plugin hỗn hợp diện rộng dùng cấu hình Vitest chuyên dụng thay vì catch-all plugin dùng chung. Các shard include-pattern ghi entry timing bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt một cấu hình nguyên vẹn với một shard đã lọc. `check-additional` giữ công việc compile/canary ranh giới package cùng nhau và tách kiến trúc topo runtime khỏi phạm vi gateway watch; danh sách guard ranh giới được rải qua bốn shard ma trận, mỗi shard chạy đồng thời các guard độc lập được chọn và in timing theo từng kiểm tra. Kiểm tra drift snapshot prompt happy-path Codex tốn kém chỉ chạy cho CI thủ công và cho các thay đổi ảnh hưởng đến prompt, nên các thay đổi Node bình thường không liên quan không phải chờ sau quá trình tạo snapshot prompt lạnh trong khi drift prompt vẫn được ghim vào PR gây ra nó; cùng flag đó bỏ qua việc tạo Vitest snapshot prompt bên trong shard support-boundary lõi của artifact đã build. Gateway watch, kiểm thử kênh, và shard support-boundary lõi chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, rồi build APK debug Play. Flavor bên thứ ba không có source set hoặc manifest riêng; lane kiểm thử đơn vị của nó vẫn biên dịch flavor với các flag BuildConfig SMS/call-log, đồng thời tránh một job đóng gói APK debug trùng lặp trên mỗi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ dependency production được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, lệnh này so sánh phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được review hoặc để lại entry allowlist đã lỗi thời, đồng thời giữ lại các bề mặt plugin động, generated, build, live-test, và cầu nối package có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động kho OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo GitHub App token từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho yêu cầu review cấp commit trên các push `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, repository, số item, URL, tiêu đề, trạng thái, và trích đoạn ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ webhook body. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng sự kiện đã chuẩn hóa lên OpenClaw Gateway hook cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải gửi theo mặc định. Agent ClawSweeper nhận đích Discord trong prompt và chỉ nên đăng lên `#clawsweeper` khi sự kiện bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về vận hành. Các lần mở, chỉnh sửa, thay đổi bot thường lệ, nhiễu webhook trùng lặp, và lưu lượng review bình thường nên trả về `NO_REPLY`.

Coi tiêu đề, bình luận, nội dung, văn bản đánh giá, tên nhánh và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy trong toàn bộ đường dẫn này. Chúng là đầu vào cho việc tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime của agent.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng bật mọi lane có phạm vi không phải Android: các shard Linux Node, shard Plugin được đóng gói, hợp đồng kênh, tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Python skills, Windows, macOS và Control UI i18n. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Các kiểm tra tĩnh tiền phát hành Plugin, shard chỉ dành cho phát hành `agentic-plugins`, đợt quét batch đầy đủ cho extension và các lane Docker tiền phát hành Plugin bị loại khỏi CI. Bộ tiền phát hành Docker chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với gate release-validation được bật.

Các lần chạy thủ công dùng một nhóm concurrency duy nhất để bộ đầy đủ cho release-candidate không bị hủy bởi một lần push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép một caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag hoặc SHA commit đầy đủ trong khi dùng file workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các job bảo mật nhanh và aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), các kiểm tra nhanh về protocol/contract/bundled, các kiểm tra hợp đồng kênh được chia shard, các shard `check` ngoại trừ lint, các aggregate `check-additional`, trình xác minh aggregate cho kiểm thử Node, kiểm tra tài liệu, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub host để ma trận Blacksmith có thể vào hàng đợi sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                           |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Linux Node, các shard kiểm thử bundled Plugin, các shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (đủ nhạy với CPU nên 8 vCPU tốn nhiều hơn phần tiết kiệm được); các bản build Docker install-smoke (thời gian hàng đợi 32-vCPU tốn nhiều hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |

CI của repo chuẩn giữ Blacksmith làm đường dẫn runner mặc định. Trong `preflight`, `scripts/ci-runner-labels.mjs` kiểm tra các lần chạy Actions gần đây đang xếp hàng và đang chạy để tìm các job Blacksmith đang xếp hàng. Nếu một label Blacksmith cụ thể đã có job đang xếp hàng, các job downstream sẽ dùng đúng label đó sẽ fallback về runner tương ứng do GitHub host (`ubuntu-24.04`, `windows-2025` hoặc `macos-latest`) chỉ cho lần chạy đó. Các kích thước Blacksmith khác trong cùng họ OS vẫn ở trên label chính của chúng. Nếu probe API thất bại, không áp dụng fallback.

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

Dispatch thủ công thường benchmark ref workflow. Đặt `target_ref` để benchmark một tag phát hành hoặc nhánh khác với triển khai workflow hiện tại. Các đường dẫn báo cáo đã xuất bản và con trỏ latest được khóa theo ref được kiểm thử, và mỗi `index.md` ghi lại ref/SHA được kiểm thử, ref/SHA workflow, ref Kova, profile, chế độ auth của lane, model, số lần lặp và bộ lọc scenario.

Workflow cài đặt OCM từ một bản phát hành được pin và Kova từ `openclaw/Kova` tại input `kova_ref` được pin, rồi chạy ba lane:

- `mock-provider`: các scenario chẩn đoán Kova đối với runtime bản build cục bộ với auth giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: profiling CPU/heap/trace cho các điểm nóng startup, Gateway và agent-turn.
- `live-gpt54`: một lượt agent OpenAI `openai/gpt-5.4` thật, được bỏ qua khi không có `OPENAI_API_KEY`.

Lane mock-provider cũng chạy các probe nguồn gốc OpenClaw sau lượt Kova: timing boot Gateway và bộ nhớ qua các trường hợp startup mặc định, hook và 50 Plugin; các vòng hello `channel-chat-baseline` mock-OpenAI lặp lại; và các lệnh startup CLI đối với Gateway đã boot. Tóm tắt Markdown của probe nguồn nằm tại `source/index.md` trong bundle báo cáo, với JSON thô đặt bên cạnh.

Mỗi lane upload artifact GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, bundle, `index.md` và artifact source-probe vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ ref được kiểm thử hiện tại được ghi dưới dạng `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực phát hành đầy đủ

`Full Release Validation` là workflow umbrella thủ công cho "chạy mọi thứ trước khi phát hành." Nó nhận một nhánh, tag hoặc SHA commit đầy đủ, dispatch workflow `CI` thủ công với target đó, dispatch `Plugin Prerelease` cho bằng chứng chỉ dành cho phát hành về Plugin/gói/tĩnh/Docker, và dispatch `OpenClaw Release Checks` cho install smoke, chấp nhận gói, kiểm tra gói đa OS, QA Lab parity, Matrix và các lane Telegram. Các lần chạy ổn định/mặc định giữ phạm vi live/E2E toàn diện và đường dẫn phát hành Docker phía sau `run_release_soak=true`; `release_profile=full` ép bật phạm vi soak đó để xác thực advisory rộng vẫn đủ rộng. Với `rerun_group=all` và `release_profile=full`, nó cũng chạy `NPM Telegram Beta E2E` đối với artifact `release-package-under-test` từ release checks. Sau khi publish, truyền `npm_telegram_package_spec` để chạy lại cùng lane gói Telegram đối với gói npm đã publish.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận stage, tên job workflow chính xác, khác biệt giữa các profile, artifact và
các handle chạy lại tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Dispatch nó
từ `release/YYYY.M.D` hoặc `main` sau khi tag phát hành tồn tại và sau khi
preflight npm OpenClaw đã thành công. Nó xác minh `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` cho mọi gói Plugin có thể publish, dispatch
`Plugin ClawHub Release` cho cùng SHA phát hành, và chỉ sau đó dispatch
`OpenClaw NPM Release` với `preflight_run_id` đã lưu.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit được ghim trên một nhánh thay đổi nhanh, hãy dùng helper thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Refs dispatch của GitHub workflow phải là nhánh hoặc tag, không phải SHA commit thô. Helper đẩy một nhánh tạm thời `release-ci/<sha>-...` tại SHA đích, dispatch `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con `headSha` khớp với đích, và xóa nhánh tạm thời khi lần chạy hoàn tất. Trình xác minh bao trùm cũng thất bại nếu bất kỳ workflow con nào chạy ở một SHA khác.

`release_profile` kiểm soát phạm vi live/provider được truyền vào các kiểm tra phát hành. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn cố ý muốn ma trận provider/media tư vấn rộng. `run_release_soak` kiểm soát liệu các kiểm tra phát hành stable/mặc định có chạy soak live/E2E toàn diện và đường dẫn phát hành Docker hay không; `full` buộc bật soak.

- `minimum` giữ các lane OpenAI/core quan trọng cho phát hành nhanh nhất.
- `stable` thêm tập provider/backend ổn định.
- `full` chạy ma trận provider/media tư vấn rộng.

Umbrella ghi lại các id lần chạy con đã dispatch, và job cuối cùng `Verify full validation` kiểm tra lại kết luận hiện tại của các lần chạy con rồi thêm các bảng job chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển sang xanh, chỉ chạy lại job xác minh cha để làm mới kết quả umbrella và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho workflow con CI đầy đủ thông thường, `plugin-prerelease` chỉ cho workflow con prerelease Plugin, `release-checks` cho mọi workflow con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên umbrella. Điều này giữ phạm vi chạy lại một hộp phát hành lỗi được giới hạn sau một bản sửa tập trung. Với một lane cross-OS lỗi, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh cross-OS dài phát ra dòng heartbeat và các tóm tắt packaged-upgrade bao gồm thời gian theo từng pha. Các lane QA release-check là tư vấn, nên lỗi chỉ riêng QA sẽ cảnh báo nhưng không chặn trình xác minh release-check.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho các kiểm tra cross-OS và Package Acceptance, cộng với workflow Docker đường dẫn phát hành live/E2E khi chạy phạm vi soak. Điều đó giữ byte gói nhất quán trên các hộp phát hành và tránh đóng gói lại cùng ứng viên trong nhiều job con.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
sẽ thay thế umbrella cũ hơn. Bộ giám sát cha hủy mọi workflow con mà nó
đã dispatch khi workflow cha bị hủy, nên xác thực main mới hơn
không phải đứng sau một lần chạy release-check cũ kéo dài hai giờ. Xác thực nhánh/tag
phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Các shard live và E2E

Workflow con live/E2E phát hành giữ phạm vi rộng của `pnpm test:live` gốc, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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

Điều đó giữ nguyên phạm vi file đồng thời giúp các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard media live gốc chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được xây dựng bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên các runner Blacksmith thông thường — job container không phải nơi phù hợp để khởi chạy các bài kiểm thử Docker lồng nhau.

Các shard model/backend live dựa trên Docker dùng một image chia sẻ riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit đã chọn. Workflow phát hành live xây dựng và đẩy image đó một lần, sau đó các shard model live Docker, Gateway được chia theo provider, backend CLI, bind ACP, và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Docker Gateway mang các giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout job workflow để một container bị kẹt hoặc đường dọn dẹp lỗi nhanh thay vì tiêu tốn toàn bộ ngân sách release-check. Nếu các shard đó tự xây dựng lại toàn bộ target Docker nguồn một cách độc lập, lần chạy phát hành bị cấu hình sai và sẽ lãng phí thời gian thực tế vào các lần build image trùng lặp.

## Package Acceptance

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, trong khi package acceptance xác thực một tarball duy nhất qua cùng harness Docker E2E mà người dùng thực hiện sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256, và profile trong tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory tarball, chuẩn bị các image Docker package-digest khi cần, và chạy các lane Docker đã chọn với gói đó thay vì đóng gói checkout workflow. Khi một profile chọn nhiều `docker_lanes` có mục tiêu, workflow tái sử dụng chuẩn bị gói và các image chia sẻ một lần, rồi fan-out các lane đó thành các job Docker có mục tiêu chạy song song với artifact duy nhất.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã xuất bản.
4. `summary` làm workflow thất bại nếu phân giải gói, Docker acceptance, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng tùy chọn này cho acceptance prerelease/stable đã xuất bản.
- `source=ref` đóng gói một nhánh, tag, hoặc SHA commit đầy đủ của `package_ref` đáng tin cậy. Bộ phân giải fetch các nhánh/tag OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử nhánh repository hoặc tag phát hành, cài dependency trong một worktree detached, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` riêng biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng phạm vi Plugin offline để xác thực gói đã xuất bản không bị phụ thuộc vào tính sẵn sàng live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn spec npm đã xuất bản được giữ cho các dispatch độc lập.

Để xem chính sách chuyên biệt về kiểm thử cập nhật và Plugin, bao gồm lệnh cục bộ,
lane Docker, đầu vào Package Acceptance, mặc định phát hành, và phân loại lỗi,
xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Các kiểm tra phát hành gọi Package Acceptance với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng về di trú gói, cập nhật, dọn dẹp dependency Plugin cũ, sửa cài đặt Plugin đã cấu hình, Plugin offline, plugin-update, và Telegram trên cùng tarball gói đã phân giải. Đặt `package_acceptance_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks để chạy cùng ma trận đó với một gói npm đã phát hành thay vì artifact được build từ SHA. Các kiểm tra phát hành cross-OS vẫn bao phủ onboarding, installer, và hành vi nền tảng riêng theo OS; xác thực sản phẩm package/update nên bắt đầu với Package Acceptance. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã xuất bản cho mỗi lần chạy trong đường dẫn phát hành chặn. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã xuất bản dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane lỗi giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng trên bốn bản phát hành npm stable mới nhất cộng với các bản phát hành ranh giới plugin-compatibility được ghim và fixture theo dạng issue cho cấu hình Feishu, các file bootstrap/persona được bảo toàn, cài đặt OpenClaw Plugin đã cấu hình, đường dẫn log tilde, và gốc dependency Plugin legacy cũ. Các lựa chọn published-upgrade survivor nhiều baseline được chia shard theo baseline thành các job runner Docker có mục tiêu riêng. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã xuất bản toàn diện, không phải phạm vi Full Release CI thông thường. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã xuất bản cấu hình baseline bằng công thức lệnh `openclaw config set` được nướng sẵn, ghi lại các bước công thức trong `summary.json`, và thăm dò `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane fresh packaged và installer của Windows cũng xác minh rằng một gói đã cài đặt có thể import override browser-control từ một đường dẫn Windows tuyệt đối thô. Smoke agent-turn cross-OS OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.4`, để bằng chứng cài đặt và Gateway vẫn nằm trên một model kiểm thử GPT-5 trong khi tránh các mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Package Acceptance có các khung thời gian tương thích kế thừa có giới hạn cho những gói đã được phát hành. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến những tệp bị lược bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua trường hợp con duy trì `gateway install --wrapper` khi gói không cung cấp cờ đó;
- `update-channel-switch` có thể cắt bỏ `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả lập bắt nguồn từ tarball và có thể ghi log `update.channel` đã duy trì nhưng bị thiếu;
- các kiểm thử smoke Plugin có thể đọc các vị trí bản ghi cài đặt kế thừa hoặc chấp nhận thiếu việc duy trì bản ghi cài đặt marketplace;
- `plugin-update` có thể cho phép di chuyển metadata cấu hình trong khi vẫn yêu cầu bản ghi cài đặt và hành vi không cài đặt lại giữ nguyên không đổi.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu metadata bản dựng cục bộ đã được phát hành trước đó. Các gói về sau phải thỏa mãn các hợp đồng hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lượt chạy chấp nhận gói thất bại, hãy bắt đầu ở phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lượt chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời lượng từng pha và các lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói bị thất bại hoặc các lane Docker chính xác thay vì chạy lại toàn bộ kiểm định bản phát hành.

## Smoke cài đặt

Workflow `Install Smoke` riêng biệt dùng lại cùng script phạm vi thông qua job `preflight` của riêng nó. Workflow này chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho các pull request chạm đến bề mặt Docker/gói, thay đổi gói/manifest Plugin được đóng gói sẵn, hoặc các bề mặt Plugin/lane/Gateway/Plugin SDK lõi mà các job smoke Docker kiểm thử. Các thay đổi Plugin được đóng gói sẵn chỉ ở mã nguồn, chỉnh sửa chỉ dành cho kiểm thử và chỉnh sửa chỉ dành cho tài liệu không giữ trước Docker worker. Đường dẫn nhanh dựng image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa agents trong workspace dùng chung, chạy e2e gateway-network trong container, xác minh một build arg của plugin được đóng gói sẵn, và chạy hồ sơ Docker Plugin được đóng gói sẵn có giới hạn với thời gian chờ lệnh tổng hợp 240 giây (mỗi lượt chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ phạm vi cài đặt gói QR và cài đặt/cập nhật Docker của installer cho các lượt chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành bằng workflow-call và các pull request thật sự chạm đến bề mặt installer/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc dùng lại một image smoke Dockerfile gốc GHCR theo SHA mục tiêu, rồi chạy cài đặt gói QR, smoke Dockerfile/gateway gốc, smoke installer/cập nhật và Docker E2E Plugin được đóng gói sẵn theo đường dẫn nhanh dưới dạng các job riêng để công việc installer không phải đợi sau các smoke image gốc.

Các push lên `main` (bao gồm merge commit) không ép đường dẫn đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một push, workflow giữ smoke Docker nhanh và để smoke cài đặt đầy đủ cho hằng đêm hoặc kiểm định bản phát hành.

Smoke image-provider cài đặt toàn cục Bun chậm được kiểm soát riêng bởi `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn bật nó, nhưng pull request và push lên `main` thì không. Các kiểm thử Docker QR và installer giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng trước một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, và dựng hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane installer/update/plugin-dependency;
- một image chức năng cài cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn image cho mỗi lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số tinh chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot nhóm chính cho các lane thông thường.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot nhóm đuôi nhạy cảm với nhà cung cấp.                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để nhà cung cấp không bị throttle.                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều dịch vụ đồng thời.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Khoảng lệch giữa các lần bắt đầu lane để tránh bão tạo Docker daemon; đặt `0` để không lệch.  |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Thời gian chờ dự phòng cho mỗi lane (120 phút); các lane live/đuôi được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` in kế hoạch lập lịch mà không chạy lane.                                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agents có thể tái hiện một lane thất bại. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể bắt đầu từ một nhóm trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Các preflight tổng hợp cục bộ kiểm tra Docker, xóa container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, duy trì thời lượng lane để sắp xếp dài nhất trước, và theo mặc định dừng lập lịch lane mới trong nhóm sau thất bại đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` về gói, loại image, image live, lane và phạm vi credential cần thiết. Sau đó `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải artifact gói của lượt chạy hiện tại, hoặc tải artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; dựng và đẩy các image Docker E2E GHCR bare/functional được gắn thẻ theo digest gói thông qua cache lớp Docker của Blacksmith khi kế hoạch cần các lane đã cài gói; và dùng lại input `docker_e2e_bare_image`/`docker_e2e_functional_image` đã cung cấp hoặc image digest gói hiện có thay vì dựng lại. Các lần kéo image Docker được thử lại với thời gian chờ giới hạn 180 giây cho mỗi lần thử để một luồng registry/cache bị kẹt sẽ thử lại nhanh thay vì tiêu tốn phần lớn đường găng CI.

### Các phần của đường dẫn phát hành

Phạm vi Docker phát hành chạy các job chia nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phần chỉ kéo loại image cần thiết và thực thi nhiều lane qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các phần Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và từ `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các alias tổng hợp cho plugin/runtime. Alias lane `install-e2e` vẫn là alias chạy lại thủ công tổng hợp cho cả hai lane installer của nhà cung cấp.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ phần `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật kênh được đóng gói sẵn thử lại một lần đối với lỗi mạng npm tạm thời.

Mỗi phần tải lên `.artifacts/docker-tests/` cùng log lane, thời lượng, `summary.json`, `failures.json`, thời lượng từng pha, JSON kế hoạch lập lịch, bảng lane chậm và các lệnh chạy lại cho từng lane. Input `docker_lanes` của workflow chạy các lane được chọn với những image đã chuẩn bị thay vì các job chia phần, nhờ đó việc gỡ lỗi lane thất bại được giới hạn trong một job Docker có mục tiêu và chuẩn bị, tải xuống hoặc dùng lại artifact gói cho lượt chạy đó; nếu một lane được chọn là lane Docker live, job mục tiêu dựng image live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo cho từng lane bao gồm `package_artifact_run_id`, `package_artifact_name` và input image đã chuẩn bị khi những giá trị đó tồn tại, để một lane thất bại có thể dùng lại đúng gói và image từ lượt chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy bộ Docker release-path đầy đủ hằng ngày.

## Plugin tiền phát hành

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, push lên `main` và dispatch CI thủ công độc lập giữ bộ kiểm thử đó ở trạng thái tắt. Nó cân bằng các kiểm thử Plugin được đóng gói sẵn trên tám extension worker; các job shard extension đó chạy tối đa hai nhóm cấu hình plugin cùng lúc với một Vitest worker cho mỗi nhóm và heap Node lớn hơn để các lô plugin nặng nhập module không tạo thêm job CI. Đường dẫn Docker tiền phát hành chỉ dành cho bản phát hành gom các lane Docker có mục tiêu thành các nhóm nhỏ để tránh giữ hàng chục runner cho những job kéo dài một đến ba phút.

## QA Lab

QA Lab có các lane CI chuyên dụng nằm ngoài workflow thông minh theo phạm vi chính. Tính ngang bằng agentic được lồng dưới các harness QA rộng và phát hành, không phải một workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi tính ngang bằng nên đi cùng một lượt kiểm định rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó mở rộng lane tính ngang bằng mô phỏng, lane Matrix live, và các lane Telegram và Discord live thành các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các bước kiểm tra phát hành chạy các làn truyền tải trực tiếp Matrix và Telegram với nhà cung cấp mô phỏng xác định và các mô hình đủ điều kiện mô phỏng (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được tách biệt khỏi độ trễ mô hình trực tiếp và quá trình khởi động Plugin nhà cung cấp thông thường. Gateway truyền tải trực tiếp tắt tìm kiếm bộ nhớ vì QA parity bao phủ riêng hành vi bộ nhớ; khả năng kết nối nhà cung cấp được bao phủ bởi các bộ kiểm thử mô hình trực tiếp, nhà cung cấp native và nhà cung cấp Docker riêng.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ tùy chọn đó. Mặc định CLI và đầu vào workflow thủ công vẫn là `all`; lệnh dispatch thủ công `matrix_profile=all` luôn chia nhỏ phạm vi bao phủ Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các làn QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; cổng QA parity của nó chạy các gói candidate và baseline dưới dạng các job làn song song, rồi tải cả hai artifact xuống một job báo cáo nhỏ để so sánh parity cuối cùng.

Với PR thông thường, hãy theo bằng chứng CI/kiểm tra theo phạm vi thay vì xem parity là trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` được chủ ý thiết kế là trình quét bảo mật vòng đầu hẹp, không phải lượt quét toàn bộ repository. Các lượt chạy bảo vệ hằng ngày, thủ công và pull request không phải bản nháp quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng các truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Bảo vệ pull request vẫn nhẹ: nó chỉ bắt đầu với các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. Android và macOS CodeQL không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, bí mật, sandbox, Cron và baseline Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, Gateway, Plugin SDK, bí mật, các điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt SSRF lõi, phân tích cú pháp IP, network guard, web-fetch và chính sách SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, helper thực thi tiến trình, gửi ra ngoài và các cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, source-loading và hợp đồng gói Plugin SDK |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên Blacksmith Linux runner nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build dependency khỏi SARIF đã tải lên và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn runtime ngay cả khi sạch.

### Danh mục Chất lượng trọng yếu

`CodeQL Critical Quality` là shard phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không thuộc bảo mật, mức độ lỗi, trên các bề mặt hẹp có giá trị cao bằng Blacksmith Linux runner nhỏ hơn. Bảo vệ pull request của nó được chủ ý thu nhỏ hơn hồ sơ theo lịch: PR không phải bản nháp chỉ chạy các shard tương ứng `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` và `plugin-sdk-reply-runtime` cho mã thực thi lệnh/mô hình/công cụ của agent và dispatch phản hồi, mã schema/migration/IO cấu hình, mã auth/bí mật/sandbox/bảo mật, runtime kênh lõi và Plugin kênh bundled, phương thức giao thức/máy chủ Gateway, runtime bộ nhớ/keo SDK, MCP/tiến trình/gửi ra ngoài, catalog mô hình/runtime nhà cung cấp, chẩn đoán phiên/hàng đợi gửi, loader Plugin, hợp đồng Plugin SDK/gói, hoặc thay đổi runtime phản hồi Plugin SDK. Thay đổi cấu hình CodeQL và workflow chất lượng chạy toàn bộ mười hai shard chất lượng PR.

Dispatch thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là hook hướng dẫn/lặp để chạy riêng một shard chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật auth, bí mật, sandbox, Cron và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Hợp đồng schema cấu hình, migration, chuẩn hóa và IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai Plugin kênh lõi và kênh bundled                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Hợp đồng runtime thực thi lệnh, dispatch mô hình/nhà cung cấp, dispatch và hàng đợi auto-reply, và control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP servers và cầu nối công cụ, helper giám sát tiến trình, và hợp đồng gửi ra ngoài                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, keo kích hoạt runtime bộ nhớ và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi phản hồi, hàng đợi gửi phiên, helper binding/gửi phiên ra ngoài, bề mặt event chẩn đoán/log bundle và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch phản hồi inbound của Plugin SDK, helper payload/chunking/runtime phản hồi, tùy chọn phản hồi kênh, hàng đợi gửi và helper binding phiên/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa catalog mô hình, auth và discovery nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/catalog nhà cung cấp và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lưu trữ cục bộ, luồng điều khiển Gateway và hợp đồng runtime control-plane tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime fetch/search web lõi, media IO, hiểu media, tạo ảnh và tạo media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng loader, registry, public-surface và entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Mã nguồn Plugin SDK phía gói đã phát hành và helper hợp đồng gói Plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, tắt hoặc mở rộng mà không làm mờ tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin bundled chỉ nên được thêm lại dưới dạng công việc tiếp theo theo phạm vi hoặc theo shard sau khi các hồ sơ hẹp có runtime và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một làn bảo trì Codex theo sự kiện để giữ tài liệu hiện có khớp với các thay đổi vừa được land. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và dispatch thủ công có thể chạy trực tiếp. Các invocation từ workflow-run sẽ bỏ qua khi `main` đã tiến tiếp hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ vừa qua. Khi chạy, nó rà soát khoảng commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, nên một lượt chạy hằng giờ có thể bao phủ toàn bộ thay đổi trên main tích lũy từ lần rà tài liệu trước.

### Test Performance Agent

Workflow `Test Performance Agent` là một làn bảo trì Codex theo sự kiện cho các kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một invocation từ workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày đó. Làn này build báo cáo hiệu năng Vitest được nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ phạm vi bao phủ thay vì refactor rộng, rồi chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử baseline đang pass. Nếu baseline có kiểm thử fail, Codex chỉ có thể sửa các lỗi hiển nhiên và báo cáo toàn bộ bộ kiểm thử sau agent phải pass trước khi commit bất cứ thứ gì. Khi `main` tiến lên trước khi bot push được land, làn này rebase patch đã xác thực, chạy lại `pnpm check:changed` và thử push lại; các patch cũ xung đột sẽ bị bỏ qua. Nó dùng GitHub-hosted Ubuntu để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau merge

Workflow `Duplicate PRs After Merge` là workflow thủ công cho maintainer để dọn dẹp trùng lặp sau khi land. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi bản trùng lặp có hoặc issue được tham chiếu chung hoặc các hunk thay đổi chồng lấp.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- các thay đổi production của core chạy typecheck core prod và core test cùng với lint/guards của core;
- các thay đổi chỉ dành cho core test chỉ chạy typecheck core test cùng với lint của core;
- các thay đổi production của phần mở rộng chạy typecheck extension prod và extension test cùng với lint của phần mở rộng;
- các thay đổi chỉ dành cho extension test chạy typecheck extension test cùng với lint của phần mở rộng;
- các thay đổi public Plugin SDK hoặc hợp đồng plugin mở rộng sang typecheck phần mở rộng vì các phần mở rộng phụ thuộc vào các hợp đồng core đó (các lượt quét phần mở rộng bằng Vitest vẫn là công việc kiểm thử tường minh);
- các bản tăng phiên bản chỉ liên quan đến metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc root có mục tiêu;
- các thay đổi root/cấu hình không xác định sẽ fail safe sang tất cả các check lane.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý rẻ hơn `check:changed`: các chỉnh sửa test trực tiếp tự chạy chính chúng, các chỉnh sửa source ưu tiên ánh xạ tường minh, rồi đến test cùng cấp và các phần phụ thuộc theo import-graph. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ tường minh: các thay đổi đối với cấu hình visible-reply của nhóm, chế độ phân phối trả lời nguồn, hoặc prompt hệ thống của message-tool sẽ đi qua các core reply test cùng với các hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung thất bại trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng ở cấp harness khiến tập ánh xạ rẻ không còn là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ repo root và ưu tiên một box mới đã được warm cho bằng chứng rộng. Trước khi tốn một gate chậm trên một box đã được tái sử dụng, hết hạn, hoặc vừa báo cáo một lượt sync lớn bất thường, hãy chạy `pnpm testbox:sanity` bên trong box trước.

Kiểm tra sanity fail nhanh khi các tệp root bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 lượt xóa tracked. Điều đó thường có nghĩa là trạng thái sync từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng box đó và warm một box mới thay vì debug lỗi test sản phẩm. Với các PR cố ý xóa nhiều, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lượt sanity đó.

`pnpm testbox:run` cũng chấm dứt một invocation Blacksmith CLI cục bộ nếu invocation đó ở lại pha sync hơn năm phút mà không có output sau sync. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt guard đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là wrapper remote-box do repo sở hữu để cung cấp bằng chứng Linux cho maintainer. Dùng nó khi một kiểm tra quá rộng cho local edit loop, khi parity với CI là quan trọng, hoặc khi bằng chứng cần secrets, Docker, package lanes, các box tái sử dụng được, hoặc log từ xa. Backend OpenClaw thông thường là `blacksmith-testbox`; dung lượng AWS/Hetzner sở hữu là fallback cho sự cố Blacksmith, vấn đề quota, hoặc kiểm thử rõ ràng trên dung lượng sở hữu.

Trước lần chạy đầu tiên, kiểm tra wrapper từ repo root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo từ chối binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider tường minh dù `.crabbox.yaml` có các mặc định owned-cloud.

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

Chạy lại test có trọng tâm:

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

Toàn bộ suite:

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

Đọc tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Các lượt chạy Crabbox một lần được Blacksmith hậu thuẫn nên tự động dừng Testbox; nếu một lượt chạy bị gián đoạn hoặc cleanup không rõ ràng, hãy kiểm tra các box live và chỉ dừng các box bạn đã tạo:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Chỉ dùng tái sử dụng khi bạn cố ý cần nhiều lệnh trên cùng một box đã được hydrate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Nếu Crabbox là lớp bị hỏng nhưng bản thân Blacksmith hoạt động, hãy dùng Blacksmith trực tiếp làm fallback hẹp:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các warmup mới nằm ở trạng thái `queued` mà không có IP hoặc Actions run URL sau vài phút, hãy xem đó là áp lực provider, queue, billing, hoặc giới hạn tổ chức của Blacksmith. Dừng các queued id bạn đã tạo, tránh khởi động thêm Testbox, và chuyển bằng chứng sang đường dung lượng Crabbox sở hữu bên dưới trong khi có người kiểm tra dashboard, billing, và giới hạn tổ chức của Blacksmith.

Chỉ leo thang sang dung lượng Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn quota, thiếu môi trường cần thiết, hoặc dung lượng sở hữu là mục tiêu rõ ràng:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thật sự cần CPU cấp 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để chạm quota EC2 Spot hoặc On-Demand Standard theo khu vực. `.crabbox.yaml` do repo sở hữu mặc định dùng `standard`, nhiều vùng dung lượng, và `capacity.hints: true` để các lease AWS qua broker in ra vùng/market đã chọn, áp lực quota, fallback Spot, và cảnh báo class áp lực cao. Dùng `fast` cho các kiểm tra rộng nặng hơn, `large` chỉ sau khi standard/fast không đủ, và `beast` chỉ cho các lane CPU-bound ngoại lệ như toàn bộ suite hoặc ma trận Docker của tất cả plugin, xác thực release/blocker tường minh, hoặc profiling hiệu năng nhiều core. Không dùng `beast` cho `pnpm check:changed`, test có trọng tâm, công việc chỉ tài liệu, lint/typecheck thông thường, repro E2E nhỏ, hoặc triage sự cố Blacksmith. Dùng `--market on-demand` cho chẩn đoán dung lượng để nhiễu từ Spot market không lẫn vào tín hiệu.

`.crabbox.yaml` sở hữu các mặc định provider, sync, và hydrate GitHub Actions cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa của chính nó thay vì sync các remote và object store cục bộ của maintainer, và nó loại trừ các artifact runtime/build cục bộ vốn không bao giờ nên được truyền đi. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và handoff môi trường không bí mật cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
