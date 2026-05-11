---
read_when:
    - Bạn cần hiểu lý do một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lượt chạy hoặc chạy lại xác thực bản phát hành
    - Bạn đang thay đổi cơ chế điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị công việc CI, các cổng kiểm soát phạm vi, các nhóm bao trùm cho phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-11T20:22:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần đẩy lên `main` và mọi pull request. Tác vụ `preflight` phân loại diff và tắt các lane tốn kém khi chỉ có những khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và bung toàn bộ đồ thị để dùng cho ứng viên phát hành và xác thực diện rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho bản phát hành nằm trong workflow [`Plugin tiền phát hành`](#plugin-prerelease) riêng và chỉ chạy từ [`Xác thực phát hành đầy đủ`](#full-release-validation) hoặc một dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Tác vụ                           | Mục đích                                                                                                  | Khi chạy                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ dành cho tài liệu, phạm vi đã thay đổi, extension đã thay đổi, và xây dựng manifest CI | Luôn chạy trên các lần đẩy và PR không phải nháp |
| `security-scm-fast`              | Phát hiện khóa riêng và kiểm toán workflow qua `zizmor`                                                   | Luôn chạy trên các lần đẩy và PR không phải nháp |
| `security-dependency-audit`      | Kiểm toán lockfile production không cần dependency dựa trên advisories của npm                            | Luôn chạy trên các lần đẩy và PR không phải nháp |
| `security-fast`                  | Tổng hợp bắt buộc cho các tác vụ bảo mật nhanh                                                            | Luôn chạy trên các lần đẩy và PR không phải nháp |
| `check-dependencies`             | Lượt kiểm tra production Knip chỉ dành cho dependency cùng guard danh sách cho phép tệp không dùng        | Thay đổi liên quan đến Node         |
| `build-artifacts`                | Xây dựng `dist/`, Control UI, kiểm tra artifact đã build, và artifact hạ nguồn có thể tái sử dụng         | Thay đổi liên quan đến Node         |
| `checks-fast-core`               | Các lane đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                          | Thay đổi liên quan đến Node         |
| `checks-fast-contracts-channels` | Kiểm tra contract kênh được shard với kết quả kiểm tra tổng hợp ổn định                                   | Thay đổi liên quan đến Node         |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ các lane kênh, bundled, contract, và extension                      | Thay đổi liên quan đến Node         |
| `check`                          | Tương đương gate local chính được shard: kiểu production, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt | Thay đổi liên quan đến Node         |
| `check-additional`               | Kiến trúc, drift boundary/prompt được shard, guard extension, boundary package, và gateway watch          | Thay đổi liên quan đến Node         |
| `build-smoke`                    | Kiểm thử smoke CLI đã build và smoke bộ nhớ khởi động                                                     | Thay đổi liên quan đến Node         |
| `checks`                         | Bộ xác minh cho kiểm thử kênh artifact đã build                                                           | Thay đổi liên quan đến Node         |
| `checks-node-compat-node22`      | Lane build và smoke tương thích Node 22                                                                   | Dispatch CI thủ công cho phát hành  |
| `check-docs`                     | Định dạng tài liệu, lint, và kiểm tra liên kết hỏng                                                       | Tài liệu thay đổi                   |
| `skills-python`                  | Ruff + pytest cho Skills dựa trên Python                                                                  | Thay đổi liên quan đến skill Python |
| `checks-windows`                 | Kiểm thử process/path đặc thù Windows cùng hồi quy bộ chỉ định import runtime dùng chung                  | Thay đổi liên quan đến Windows      |
| `macos-node`                     | Lane kiểm thử TypeScript trên macOS dùng artifact đã build dùng chung                                     | Thay đổi liên quan đến macOS        |
| `macos-swift`                    | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                         | Thay đổi liên quan đến macOS        |
| `android`                        | Kiểm thử đơn vị Android cho cả hai flavor cùng một bản build debug APK                                    | Thay đổi liên quan đến Android      |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm Codex hằng ngày sau hoạt động đáng tin cậy                                       | CI chính thành công hoặc dispatch thủ công |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile, và GPT 5.4 live | Theo lịch và dispatch thủ công      |

## Thứ tự fail-fast

1. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong tác vụ này, không phải tác vụ độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các tác vụ artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các lane Linux nhanh để các consumer hạ nguồn có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn bung ra sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các tác vụ bị thay thế là `cancelled` khi một lần đẩy mới hơn xuất hiện trên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` để vẫn báo cáo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa concurrency CI tự động được đánh phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô hạn các lần chạy main mới hơn. Các lần chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy những lần chạy đang thực thi.

Tác vụ `ci-timings-summary` tải lên một artifact `ci-timings-summary` nhỏ gọn cho mỗi lần chạy CI không phải nháp. Nó ghi lại thời gian thực, thời gian xếp hàng, các tác vụ chậm nhất, và các tác vụ thất bại cho lần chạy hiện tại, để các kiểm tra sức khỏe CI không cần scrape toàn bộ payload Actions lặp đi lặp lại.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng tự chúng không ép build native Windows, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn vào thay đổi mã nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, chỉnh sửa fixture core-test rẻ được chọn, và chỉnh sửa hẹp helper/test-routing của contract Plugin** dùng đường manifest nhanh chỉ dành cho Node: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường này bỏ qua artifact build, tương thích Node 22, contract kênh, toàn bộ shard lõi, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp thực thi.
- **Kiểm tra Node trên Windows** được giới hạn vào wrapper process/path đặc thù Windows, helper runner npm/pnpm/UI, cấu hình package manager, và các bề mặt workflow CI thực thi lane đó; thay đổi mã nguồn, Plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn ở trên các lane Node Linux.

Các họ kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi tác vụ vẫn nhỏ mà không đặt trước runner quá mức: contract kênh chạy dưới dạng ba shard có trọng số được Blacksmith hỗ trợ với fallback runner GitHub tiêu chuẩn, các lane core unit fast/support chạy riêng, hạ tầng runtime lõi được tách giữa state, process/config, cron, và shard dùng chung, auto-reply chạy dưới dạng worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch, và commands/state-routing), còn cấu hình Gateway/server kiểu agentic được tách qua các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã build. Các kiểm thử trình duyệt rộng, QA, media, và Plugin hỗn hợp dùng cấu hình Vitest riêng thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi mục thời gian bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với một shard đã lọc. `check-additional` giữ công việc compile/canary package-boundary cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; danh sách guard boundary được chia sọc trên bốn shard ma trận, mỗi shard chạy đồng thời các guard độc lập được chọn và in thời gian theo từng kiểm tra. Kiểm tra drift snapshot prompt happy-path Codex tốn kém chạy dưới dạng tác vụ bổ sung riêng cho CI thủ công và chỉ cho các thay đổi ảnh hưởng đến prompt, nên thay đổi Node bình thường không liên quan không phải chờ sau quá trình tạo snapshot prompt lạnh, và các shard boundary vẫn cân bằng trong khi drift prompt vẫn được ghim vào PR gây ra nó; cùng cờ đó bỏ qua việc tạo Vitest snapshot prompt bên trong shard support-boundary lõi artifact đã build. Gateway watch, kiểm thử kênh, và shard support-boundary lõi chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, rồi build Play debug APK. Flavor bên thứ ba không có source set hoặc manifest riêng; lane kiểm thử đơn vị của nó vẫn biên dịch flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh tác vụ đóng gói debug APK trùng lặp trên mọi lần đẩy liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt kiểm tra production Knip chỉ dành cho dependency, được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được rà soát hoặc để lại mục danh sách cho phép đã lỗi thời, đồng thời giữ lại các bề mặt Plugin động, generated, build, live-test, và bridge package có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là bridge phía đích từ hoạt động repository OpenClaw sang ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` nhỏ gọn đến `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho các yêu cầu review chính xác đối với issue và pull request;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho các yêu cầu review ở cấp commit trên các lần đẩy `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, repository, số item, URL, tiêu đề, trạng thái, và trích đoạn ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ body Webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, workflow này đăng sự kiện đã chuẩn hóa lên hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải gửi mặc định. Agent ClawSweeper nhận target Discord trong prompt của nó và chỉ nên đăng lên `#clawsweeper` khi sự kiện gây bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về vận hành. Các lần mở, chỉnh sửa, churn bot thường lệ, nhiễu Webhook trùng lặp, và lưu lượng review bình thường nên dẫn đến `NO_REPLY`.

Xem tiêu đề, bình luận, nội dung, văn bản đánh giá, tên nhánh và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy trong toàn bộ đường dẫn này. Chúng là đầu vào cho việc tóm tắt và phân loại, không phải chỉ dẫn cho quy trình làm việc hoặc thời gian chạy của agent.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng bật cưỡng bức mọi lane có phạm vi không phải Android: các shard Linux Node, các shard Plugin đi kèm, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Python skills, Windows, macOS và i18n Control UI. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh tiền phát hành Plugin, shard chỉ dành cho phát hành `agentic-plugins`, đợt quét extension đầy đủ và các lane Docker tiền phát hành Plugin bị loại khỏi CI. Bộ tiền phát hành Docker chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với cổng release-validation được bật.

Các lần chạy thủ công dùng một concurrency group duy nhất để bộ đầy đủ của release-candidate không bị hủy bởi một lần chạy push hoặc PR khác trên cùng ref. Đầu vào tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, các job bảo mật nhanh và tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), kiểm tra nhanh protocol/contract/bundled, kiểm tra hợp đồng kênh dạng shard, các shard `check` trừ lint, tổng hợp `check-additional`, trình xác minh tổng hợp kiểm thử Node, kiểm tra tài liệu, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub lưu trữ để ma trận Blacksmith có thể vào hàng đợi sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension tải nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, các shard kiểm thử Linux Node, các shard kiểm thử Plugin đi kèm, các shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (nhạy CPU đến mức 8 vCPU tốn kém hơn mức tiết kiệm được); các bản build Docker install-smoke (thời gian hàng đợi 32-vCPU tốn kém hơn mức tiết kiệm được)                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; các fork chuyển về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; các fork chuyển về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                    |

CI của kho canonical giữ Blacksmith làm đường dẫn runner mặc định. Trong `preflight`, `scripts/ci-runner-labels.mjs` kiểm tra các lần chạy Actions gần đây đang trong hàng đợi và đang chạy để tìm các job Blacksmith đang chờ. Nếu một nhãn Blacksmith cụ thể đã có job trong hàng đợi, các job downstream sẽ dùng đúng nhãn đó sẽ chuyển về runner tương ứng do GitHub lưu trữ (`ubuntu-24.04`, `windows-2025` hoặc `macos-latest`) chỉ cho lần chạy đó. Các kích thước Blacksmith khác trong cùng họ hệ điều hành vẫn dùng nhãn chính của chúng. Nếu probe API thất bại, không áp dụng fallback.

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

`OpenClaw Performance` là workflow hiệu năng sản phẩm/thời gian chạy. Nó chạy hằng ngày trên `main` và có thể được dispatch thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch thủ công thường benchmark ref workflow. Đặt `target_ref` để benchmark một tag phát hành hoặc nhánh khác với triển khai workflow hiện tại. Đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được khóa theo ref được kiểm thử, và mỗi `index.md` ghi lại ref/SHA được kiểm thử, ref/SHA workflow, ref Kova, profile, chế độ xác thực lane, model, số lần lặp và bộ lọc kịch bản.

Workflow cài OCM từ một bản phát hành được ghim và Kova từ `openclaw/Kova` tại đầu vào `kova_ref` được ghim, rồi chạy ba lane:

- `mock-provider`: các kịch bản chẩn đoán Kova trên thời gian chạy bản build cục bộ với xác thực giả tương thích OpenAI có tính quyết định.
- `mock-deep-profile`: profiling CPU/heap/trace cho các điểm nóng startup, Gateway và lượt agent.
- `live-gpt54`: một lượt agent OpenAI `openai/gpt-5.4` thật, được bỏ qua khi `OPENAI_API_KEY` không có sẵn.

Lane mock-provider cũng chạy các probe nguồn gốc OpenClaw-native sau lượt Kova: thời gian khởi động Gateway và bộ nhớ trên các trường hợp startup mặc định, hook và 50-Plugin; các vòng hello `channel-chat-baseline` mock-OpenAI lặp lại; và các lệnh startup CLI chạy với Gateway đã khởi động. Tóm tắt Markdown của source probe nằm tại `source/index.md` trong gói báo cáo, với JSON thô nằm bên cạnh.

Mỗi lane tải artifact lên GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các bundle, `index.md` và artifact source-probe vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ tested-ref hiện tại được ghi là `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực phát hành đầy đủ

`Full Release Validation` là workflow umbrella thủ công cho "chạy mọi thứ trước khi phát hành." Nó nhận một nhánh, tag hoặc SHA commit đầy đủ, dispatch workflow `CI` thủ công với target đó, dispatch `Plugin Prerelease` để cung cấp bằng chứng Plugin/package/static/Docker chỉ dành cho phát hành, và dispatch `OpenClaw Release Checks` cho install smoke, package acceptance, kiểm tra package liên hệ điều hành, tương đồng QA Lab, Matrix và các lane Telegram. Các lần chạy stable/default giữ phạm vi live/E2E đầy đủ và đường dẫn phát hành Docker phía sau `run_release_soak=true`; `release_profile=full` buộc bật phạm vi soak đó để xác thực advisory diện rộng vẫn đủ rộng. Với `rerun_group=all` và `release_profile=full`, nó cũng chạy `NPM Telegram Beta E2E` với artifact `release-package-under-test` từ release checks. Sau khi xuất bản, truyền `release_package_spec` để tái sử dụng package npm đã phát hành trên release checks, Package Acceptance, Docker, liên hệ điều hành và Telegram mà không build lại. Chỉ dùng `npm_telegram_package_spec` khi Telegram phải chứng minh một package khác.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn, tên job workflow chính xác, khác biệt giữa các profile, artifact và
các handle rerun tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Dispatch nó
từ `release/YYYY.M.D` hoặc `main` sau khi tag phát hành tồn tại và sau khi
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

Để có bằng chứng commit được ghim trên một nhánh thay đổi nhanh, hãy dùng helper thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Các ref dispatch workflow GitHub phải là nhánh hoặc tag, không phải SHA commit thô. Helper sẽ đẩy một nhánh tạm thời `release-ci/<sha>-...` tại SHA mục tiêu, dispatch `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con có `headSha` khớp với mục tiêu, rồi xóa nhánh tạm thời khi lần chạy hoàn tất. Bộ xác minh bao trùm cũng thất bại nếu bất kỳ workflow con nào chạy ở SHA khác.

`release_profile` kiểm soát phạm vi live/provider được truyền vào các kiểm tra phát hành. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn cố ý muốn ma trận provider/media tư vấn rộng. `run_release_soak` kiểm soát liệu các kiểm tra phát hành stable/default có chạy soak đường dẫn phát hành live/E2E và Docker toàn diện hay không; `full` buộc bật soak.

- `minimum` giữ các làn OpenAI/core quan trọng cho phát hành nhanh nhất.
- `stable` thêm tập provider/backend stable.
- `full` chạy ma trận provider/media tư vấn rộng.

Umbrella ghi lại id các lần chạy con đã dispatch, và job `Verify full validation` cuối cùng kiểm tra lại kết luận hiện tại của các lần chạy con rồi thêm các bảng job chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển sang xanh, chỉ chạy lại job xác minh cha để làm mới kết quả umbrella và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho CI đầy đủ thông thường con, `plugin-prerelease` chỉ cho prerelease Plugin con, `release-checks` cho mọi phần phát hành con, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên umbrella. Cách này giữ việc chạy lại một hộp phát hành thất bại ở phạm vi giới hạn sau một bản sửa tập trung. Với một làn cross-OS thất bại, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh cross-OS dài phát ra các dòng Heartbeat và tóm tắt packaged-upgrade bao gồm thời gian theo từng pha. Các làn kiểm tra phát hành QA mang tính tư vấn, vì vậy lỗi chỉ ở QA sẽ cảnh báo nhưng không chặn bộ xác minh kiểm tra phát hành.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho các kiểm tra cross-OS và Chấp nhận gói, cộng với workflow Docker đường dẫn phát hành live/E2E khi chạy phạm vi soak. Điều đó giữ byte gói nhất quán giữa các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều job con.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
thay thế umbrella cũ hơn. Bộ giám sát cha hủy mọi workflow con mà nó đã dispatch khi cha bị hủy, vì vậy xác thực main mới hơn không bị kẹt sau một lần chạy kiểm tra phát hành cũ kéo dài hai giờ. Xác thực nhánh/tag phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Shard live và E2E

Phần con live/E2E của phát hành giữ phạm vi `pnpm test:live` native rộng, nhưng chạy phạm vi đó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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
- các shard âm thanh/video media được tách và các shard nhạc được lọc theo provider

Cách đó giữ cùng phạm vi file trong khi làm cho các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được xây dựng bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên runner Blacksmith bình thường — job container không phải nơi phù hợp để khởi chạy các kiểm thử Docker lồng nhau.

Các shard model/backend live dựa trên Docker dùng một image chung riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit đã chọn. Workflow phát hành live xây dựng và đẩy image đó một lần, rồi các shard model live Docker, Gateway được chia shard theo provider, backend CLI, bind ACP, và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang các giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout job workflow để một container hoặc đường dẫn dọn dẹp bị kẹt sẽ thất bại nhanh thay vì tiêu tốn toàn bộ ngân sách kiểm tra phát hành. Nếu các shard đó tự xây dựng lại mục tiêu Docker nguồn đầy đủ một cách độc lập, lần chạy phát hành bị cấu hình sai và sẽ lãng phí thời gian thực vào các lần xây dựng image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là “gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?” Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng thực hiện sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, ref workflow, ref gói, phiên bản, SHA-256, và profile trong tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory tarball, chuẩn bị image Docker package-digest khi cần, và chạy các làn Docker đã chọn với gói đó thay vì đóng gói checkout workflow. Khi một profile chọn nhiều `docker_lanes` mục tiêu, workflow tái sử dụng chuẩn bị gói và các image chung một lần, rồi phân nhánh các làn đó thành các job Docker mục tiêu song song với artifact riêng.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Chấp nhận gói đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã phát hành.
4. `summary` làm workflow thất bại nếu phân giải gói, chấp nhận Docker, hoặc làn Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng nguồn này cho chấp nhận prerelease/stable đã phát hành.
- `source=ref` đóng gói một nhánh, tag, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy. Bộ phân giải fetch các nhánh/tag OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử nhánh kho lưu trữ hoặc một tag phát hành, cài dependency trong một worktree tách rời, rồi đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các đoạn đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng phạm vi Plugin offline để xác thực gói đã phát hành không bị phụ thuộc vào khả năng sẵn sàng live của ClawHub. Làn Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn spec npm đã phát hành được giữ cho các dispatch độc lập.

Để biết chính sách kiểm thử cập nhật và Plugin chuyên dụng, bao gồm lệnh local,
các làn Docker, đầu vào Chấp nhận gói, mặc định phát hành, và phân loại lỗi,
xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Các bước kiểm tra phát hành gọi Chấp nhận Gói với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ quá trình di trú gói, cập nhật, cài đặt skill ClawHub trực tiếp, dọn dẹp phụ thuộc plugin lỗi thời, sửa cài đặt plugin đã cấu hình, plugin ngoại tuyến, plugin-update và bằng chứng Telegram trên cùng một tarball gói đã phân giải. Đặt `release_package_spec` trên Xác thực Phát hành Đầy đủ hoặc Kiểm tra Phát hành OpenClaw sau khi phát hành beta để chạy cùng ma trận với gói npm đã phát hành mà không cần dựng lại; chỉ đặt `package_acceptance_package_spec` khi Chấp nhận Gói cần một gói khác với phần còn lại của xác thực phát hành. Các bước kiểm tra phát hành đa hệ điều hành vẫn bao phủ onboarding, trình cài đặt và hành vi nền tảng theo từng hệ điều hành; xác thực sản phẩm cho gói/cập nhật nên bắt đầu bằng Chấp nhận Gói. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã phát hành cho mỗi lần chạy trong đường phát hành chặn. Trong Chấp nhận Gói, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã phát hành dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên baseline đó. Xác thực Phát hành Đầy đủ với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng trên bốn bản phát hành npm ổn định mới nhất cộng với các bản phát hành ranh giới tương thích plugin được ghim và các fixture theo dạng issue cho cấu hình Feishu, tệp bootstrap/persona được giữ lại, cài đặt plugin OpenClaw đã cấu hình, đường dẫn log có dấu ngã và gốc phụ thuộc plugin legacy lỗi thời. Các lựa chọn published-upgrade survivor nhiều baseline được chia shard theo baseline thành các job Docker runner nhắm mục tiêu riêng. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã phát hành một cách toàn diện, không phải độ rộng CI Xác thực Phát hành Đầy đủ thông thường. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã phát hành cấu hình baseline bằng một recipe lệnh `openclaw config set` được đóng gói sẵn, ghi các bước recipe vào `summary.json`, và thăm dò `/healthz`, `/readyz`, cùng trạng thái RPC sau khi Gateway khởi động. Các lane mới cho gói và trình cài đặt Windows cũng xác minh rằng một gói đã cài đặt có thể import override điều khiển trình duyệt từ một đường dẫn Windows tuyệt đối thô. Smoke agent-turn đa hệ điều hành OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.4`, để bằng chứng cài đặt và gateway vẫn dùng mô hình kiểm thử GPT-5 trong khi tránh các mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Chấp nhận Gói có các cửa sổ tương thích legacy có giới hạn cho những gói đã phát hành. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường tương thích:

- các mục QA riêng đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các tệp bị lược khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase duy trì `gateway install --wrapper` khi gói không xuất flag đó;
- `update-channel-switch` có thể lược bỏ `patchedDependencies` pnpm bị thiếu khỏi fixture git giả dẫn xuất từ tarball và có thể log `update.channel` đã duy trì bị thiếu;
- các smoke plugin có thể đọc vị trí install-record legacy hoặc chấp nhận thiếu duy trì install-record marketplace;
- `plugin-update` có thể cho phép di trú metadata cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu metadata bản dựng cục bộ đã được phát hành. Các gói sau đó phải thỏa mãn hợp đồng hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy chấp nhận gói thất bại, hãy bắt đầu tại phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời lượng pha và lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói thất bại hoặc các lane Docker chính xác thay vì chạy lại toàn bộ xác thực phát hành.

## Smoke cài đặt

Workflow `Install Smoke` riêng tái sử dụng cùng script phạm vi thông qua job `preflight` riêng của nó. Nó chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường nhanh** chạy cho các pull request chạm đến bề mặt Docker/gói, thay đổi gói/manifest plugin đóng gói, hoặc bề mặt plugin/channel/gateway/Plugin SDK lõi mà các job Docker smoke kiểm thử. Thay đổi plugin đóng gói chỉ ở mã nguồn, chỉnh sửa chỉ cho kiểm thử và chỉnh sửa chỉ cho tài liệu không giữ Docker worker. Đường nhanh dựng image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI agents delete shared-workspace, chạy gateway-network e2e trong container, xác minh một build arg extension đóng gói, và chạy hồ sơ Docker plugin đóng gói có giới hạn dưới timeout lệnh tổng hợp 240 giây (mỗi lần chạy Docker của kịch bản được giới hạn riêng).
- **Đường đầy đủ** giữ phạm vi cài đặt gói QR và Docker/cập nhật trình cài đặt cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call, và pull request thực sự chạm đến bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image smoke Dockerfile gốc GHCR target-SHA, rồi chạy cài đặt gói QR, smoke Dockerfile/gateway gốc, smoke trình cài đặt/cập nhật, và Docker E2E plugin đóng gói nhanh dưới dạng các job riêng để công việc trình cài đặt không phải chờ sau các smoke image gốc.

Các lần push lên `main` (bao gồm merge commit) không ép dùng đường đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một lần push, workflow giữ Docker smoke nhanh và để smoke cài đặt đầy đủ cho nightly hoặc xác thực phát hành.

Smoke image-provider cài đặt toàn cục Bun chậm được kiểm soát riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể bật nó, nhưng pull request và các lần push lên `main` thì không. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng trước một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, và dựng hai image `scripts/e2e/Dockerfile` dùng chung:

- runner Node/Git tối giản cho các lane trình cài đặt/cập nhật/phụ thuộc plugin;
- image chức năng cài đặt cùng tarball vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn image theo từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số điều chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot pool chính cho các lane thông thường.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot pool đuôi nhạy cảm với provider.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để provider không throttle.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều dịch vụ đồng thời.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ lệch giữa các lần bắt đầu lane để tránh bão tạo Docker daemon; đặt `0` để không lệch.      |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Timeout dự phòng theo từng lane (120 phút); các lane live/tail được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in kế hoạch bộ lập lịch mà không chạy lane.                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách lane chính xác phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agent có thể tái hiện một lane thất bại. |

Một lane nặng hơn giới hạn hiệu lực của nó vẫn có thể bắt đầu từ một pool trống, rồi chạy một mình cho đến khi nhả dung lượng. Lần chạy tổng hợp cục bộ preflight Docker, xóa container OpenClaw E2E lỗi thời, phát trạng thái lane đang hoạt động, duy trì thời lượng lane để sắp xếp dài nhất trước, và theo mặc định dừng lập lịch lane mới trong pool sau thất bại đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` xem cần gói, loại image, image live, lane và phạm vi credential nào. `scripts/docker-e2e.mjs` sau đó chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại, hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; dựng và push image Docker E2E GHCR bare/functional được gắn thẻ bằng digest gói thông qua cache layer Docker của Blacksmith khi kế hoạch cần các lane đã cài đặt gói; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc image package-digest hiện có thay vì dựng lại. Các lần pull image Docker được thử lại với timeout giới hạn 180 giây cho mỗi lần thử để stream registry/cache bị kẹt được thử lại nhanh thay vì tiêu tốn phần lớn đường trọng yếu của CI.

### Khối đường phát hành

Phạm vi Docker phát hành chạy các job được chia khối nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi khối chỉ pull loại image nó cần và thực thi nhiều lane thông qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các chunk Docker của bản phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các bí danh Plugin/runtime tổng hợp. Bí danh lane `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi yêu cầu bao phủ đầy đủ release-path, và chỉ giữ chunk độc lập `openwebui` cho các lần điều phối chỉ dành cho OpenWebUI. Các lane cập nhật kênh đi kèm thử lại một lần đối với lỗi mạng npm tạm thời.

Mỗi chunk tải lên `.artifacts/docker-tests/` cùng với log lane, thời gian chạy, `summary.json`, `failures.json`, thời gian theo pha, JSON kế hoạch scheduler, bảng lane chậm, và lệnh chạy lại theo từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn trên các image đã chuẩn bị thay vì các job chunk, giúp việc gỡ lỗi lane thất bại được giới hạn trong một job Docker có mục tiêu và chuẩn bị, tải xuống, hoặc tái sử dụng artifact package cho lần chạy đó; nếu một lane được chọn là lane Docker live, job có mục tiêu sẽ build image live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name`, và các input image đã chuẩn bị khi những giá trị đó tồn tại, để một lane thất bại có thể tái sử dụng đúng package và image từ lần chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Plugin Prerelease

`Plugin Prerelease` là phạm vi kiểm tra sản phẩm/package tốn kém hơn, nên nó là một workflow riêng được điều phối bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, push lên `main`, và các lần điều phối CI thủ công độc lập không bật bộ kiểm tra đó. Nó cân bằng các bài test Plugin đi kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc, với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch Plugin nặng import không tạo thêm job CI. Đường dẫn Docker prerelease chỉ dành cho phát hành gom nhóm các lane Docker có mục tiêu thành các nhóm nhỏ để tránh giữ hàng chục runner cho các job kéo dài một đến ba phút. Workflow cũng tải lên artifact thông tin `plugin-inspector-advisory` từ `@openclaw/plugin-inspector`; các phát hiện của inspector là dữ liệu đầu vào cho triage và không thay đổi gate Plugin Prerelease có tính chặn.

## QA Lab

QA Lab có các lane CI chuyên biệt nằm ngoài workflow smart-scoped chính. Agentic parity được lồng dưới các harness QA rộng và release, không phải một workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi parity cần đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi điều phối thủ công; nó fan out lane mock parity, lane Matrix live, và các lane Telegram và Discord live thành các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các kiểm tra release chạy các lane transport Matrix và Telegram live với provider mock tất định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được tách khỏi độ trễ model live và quá trình khởi động provider-plugin thông thường. Gateway transport live vô hiệu hóa tìm kiếm memory vì QA parity bao phủ hành vi memory riêng; kết nối provider được bao phủ bởi các bộ live model, native provider, và Docker provider riêng biệt.

Matrix dùng `--profile fast` cho các gate theo lịch và release, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và input workflow thủ công vẫn là `all`; điều phối thủ công `matrix_profile=all` luôn shard toàn bộ phạm vi Matrix thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho release trước khi phê duyệt release; gate QA parity của nó chạy các pack candidate và baseline dưới dạng các job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ để thực hiện so sánh parity cuối cùng.

Đối với PR thông thường, hãy theo bằng chứng CI/check theo phạm vi thay vì xem parity là một trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` được chủ ý làm trình quét bảo mật lượt đầu có phạm vi hẹp, không phải lần quét toàn bộ repository. Các lần chạy hằng ngày, thủ công, và guard pull request không phải draft quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng các truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Guard pull request được giữ nhẹ: nó chỉ bắt đầu khi có thay đổi dưới `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. Android và macOS CodeQL không nằm trong mặc định PR.

### Nhóm bảo mật

| Nhóm                                              | Bề mặt                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron, và baseline gateway                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, gateway, Plugin SDK, secrets, các điểm chạm audit                           |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF lõi, phân tích IP, network guard, web-fetch, và các bề mặt chính sách SSRF của Plugin SDK                                     |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP servers, helper thực thi process, outbound delivery, và các gate thực thi công cụ của agent                                    |
| `/codeql-security-high/plugin-trust-boundary`     | Cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, source-loading, và các bề mặt tin cậy hợp đồng package Plugin SDK |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build dependency khỏi SARIF được tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn thời gian chạy ngay cả khi sạch.

### Nhóm Critical Quality

`CodeQL Critical Quality` là shard không phải bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không phải bảo mật, mức độ lỗi, trên các bề mặt giá trị cao có phạm vi hẹp bằng runner Blacksmith Linux nhỏ hơn. Guard pull request của nó được chủ ý nhỏ hơn profile theo lịch: PR không phải draft chỉ chạy các shard tương ứng `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` cho các thay đổi ở mã thực thi lệnh/model/công cụ của agent và điều phối reply, mã schema/migration/IO cấu hình, mã auth/secrets/sandbox/security, runtime kênh lõi và Plugin kênh đi kèm, giao thức Gateway/server-method, runtime memory/keo dính SDK, MCP/process/outbound delivery, runtime provider/catalog model, chẩn đoán phiên/hàng đợi delivery, loader Plugin, Plugin SDK/hợp đồng package, hoặc runtime reply Plugin SDK. Thay đổi cấu hình CodeQL và workflow chất lượng chạy toàn bộ mười hai shard chất lượng PR.

Điều phối thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các profile hẹp là các hook hướng dẫn/lặp để chạy riêng một shard chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                                  |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật cho xác thực, bí mật, sandbox, cron và Gateway                                                                                                    |
| `/codeql-critical-quality/config-boundary`              | Lược đồ cấu hình, di trú, chuẩn hóa và hợp đồng IO                                                                                                                     |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Lược đồ giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đi kèm                                                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Hợp đồng runtime cho thực thi lệnh, điều phối model/provider, điều phối và hàng đợi tự động trả lời, cùng control-plane ACP                                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình, và hợp đồng gửi đi                                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, alias SDK Plugin bộ nhớ, phần nối kích hoạt runtime bộ nhớ, và lệnh doctor bộ nhớ                                          |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi gửi phiên, trình trợ giúp liên kết/gửi phiên đi, bề mặt sự kiện chẩn đoán/gói nhật ký, và hợp đồng CLI doctor phiên                 |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đến của SDK Plugin, trình trợ giúp payload/chia đoạn/runtime trả lời, tùy chọn trả lời kênh, hàng đợi gửi, và trình trợ giúp liên kết phiên/luồng  |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục model, xác thực và khám phá provider, đăng ký runtime provider, mặc định/danh mục provider, và registry web/search/fetch/embedding                 |
| `/codeql-critical-quality/ui-control-plane`             | Khởi động UI điều khiển, lưu trữ cục bộ, luồng điều khiển Gateway, và hợp đồng runtime control-plane tác vụ                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime cho web fetch/search lõi, IO media, hiểu media, tạo hình ảnh và tạo media                                                                            |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng entrypoint cho loader, registry, bề mặt công khai và SDK Plugin                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn SDK Plugin phía gói đã phát hành và trình trợ giúp hợp đồng gói Plugin                                                                                          |

Chất lượng được tách riêng khỏi bảo mật để các phát hiện về chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không làm mờ tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin đi kèm chỉ nên được bổ sung lại dưới dạng công việc tiếp theo có phạm vi hoặc được chia nhỏ sau khi các profile hẹp đã có runtime và tín hiệu ổn định.

## Quy trình bảo trì

### Docs Agent

Workflow `Docs Agent` là một làn bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được đưa vào. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và dispatch thủ công có thể chạy trực tiếp. Các lần gọi workflow-run sẽ bỏ qua khi `main` đã tiến tiếp hoặc khi một lần chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ vừa qua. Khi chạy, nó rà soát dải commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lượt chạy mỗi giờ có thể bao phủ mọi thay đổi trên main tích lũy từ lần kiểm tra tài liệu gần nhất.

### Test Performance Agent

Workflow `Test Performance Agent` là một làn bảo trì Codex theo sự kiện dành cho các bài kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó sẽ bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày này. Làn này tạo báo cáo hiệu năng Vitest được nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các sửa hiệu năng kiểm thử nhỏ vẫn giữ nguyên độ phủ thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử đạt baseline. Nếu baseline có kiểm thử thất bại, Codex chỉ có thể sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau agent phải đạt trước khi bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi lượt push của bot được đưa vào, làn này rebase bản vá đã xác thực, chạy lại `pnpm check:changed`, và thử push lại; các bản vá cũ bị xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub lưu trữ để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi merge

Workflow `Duplicate PRs After Merge` là workflow bảo trì thủ công dành cho dọn dẹp trùng lặp sau khi land. Mặc định là chạy thử và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi PR trùng lặp có issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck prod lõi và test lõi cùng lint/guard lõi;
- thay đổi chỉ dành cho test lõi chỉ chạy typecheck test lõi cùng lint lõi;
- thay đổi production extension chạy typecheck prod extension và test extension cùng lint extension;
- thay đổi chỉ dành cho test extension chạy typecheck test extension cùng lint extension;
- thay đổi SDK Plugin công khai hoặc hợp đồng Plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (quét Vitest extension vẫn là công việc kiểm thử rõ ràng);
- bản tăng phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc root có mục tiêu;
- thay đổi root/cấu hình không xác định sẽ fail-safe sang mọi làn kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và được chủ ý làm rẻ hơn `check:changed`: chỉnh sửa test trực tiếp tự chạy chính chúng, chỉnh sửa nguồn ưu tiên mapping rõ ràng, rồi đến test cùng cấp và phần phụ thuộc theo đồ thị import. Cấu hình gửi group-room dùng chung là một trong các mapping rõ ràng: thay đổi đối với cấu hình trả lời hiển thị theo nhóm, chế độ gửi trả lời nguồn, hoặc prompt hệ thống message-tool sẽ định tuyến qua các test trả lời lõi cùng hồi quy gửi Discord và Slack để thay đổi mặc định dùng chung thất bại trước lượt push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness khiến tập được map rẻ không còn là proxy đáng tin cậy.

## Xác thực Testbox

Crabbox là wrapper remote-box thuộc sở hữu repo cho proof Linux của maintainer. Dùng nó từ root repo khi một kiểm tra quá rộng cho vòng lặp chỉnh sửa cục bộ, khi cần tương đương CI, hoặc khi proof cần bí mật, Docker, làn gói, box tái sử dụng, hoặc nhật ký từ xa. Backend OpenClaw bình thường là `blacksmith-testbox`; dung lượng AWS/Hetzner sở hữu là phương án dự phòng cho sự cố Blacksmith, vấn đề quota, hoặc kiểm thử dung lượng sở hữu rõ ràng.

Các lượt chạy Blacksmith được Crabbox hậu thuẫn sẽ warm, claim, sync, run, report và dọn dẹp Testbox dùng một lần. Kiểm tra sanity sync tích hợp sẽ fail nhanh khi các tệp root bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 xóa theo dõi. Với PR xóa lớn có chủ ý, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lệnh từ xa.

Crabbox cũng chấm dứt một lần gọi Blacksmith CLI cục bộ nếu nó ở lại pha sync hơn năm phút mà không có output sau sync. Đặt `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` để tắt guard đó, hoặc dùng giá trị mili giây lớn hơn cho diff cục bộ lớn bất thường.

Trước lần chạy đầu tiên, kiểm tra wrapper từ root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo từ chối binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider một cách rõ ràng dù `.crabbox.yaml` có mặc định owned-cloud.

Cổng changed:

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

Chạy lại test tập trung:

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

Toàn bộ bộ kiểm thử:

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

Đọc tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Các lượt chạy Crabbox một lần được Blacksmith hậu thuẫn nên tự động dừng Testbox; nếu một lượt chạy bị gián đoạn hoặc việc dọn dẹp không rõ ràng, kiểm tra các box đang hoạt động và chỉ dừng những box bạn đã tạo:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Chỉ dùng tái sử dụng khi bạn cố ý cần nhiều lệnh trên cùng một box đã hydrate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Nếu Crabbox là lớp bị hỏng nhưng bản thân Blacksmith hoạt động, chỉ dùng Blacksmith trực tiếp cho chẩn đoán như `list`, `status` và dọn dẹp. Sửa đường dẫn Crabbox trước khi coi một lượt chạy Blacksmith trực tiếp là proof của maintainer.

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các warmup mới ở trạng thái `queued` mà không có IP hoặc URL lượt chạy Actions sau vài phút, hãy coi đó là áp lực từ provider Blacksmith, hàng đợi, billing hoặc giới hạn tổ chức. Dừng các id đã xếp hàng mà bạn đã tạo, tránh khởi động thêm Testbox, và chuyển proof sang đường dẫn dung lượng Crabbox sở hữu bên dưới trong khi có người kiểm tra dashboard, billing và giới hạn tổ chức của Blacksmith.

Chỉ leo thang sang dung lượng Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn quota, thiếu môi trường cần thiết, hoặc dung lượng sở hữu là mục tiêu rõ ràng:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thực sự cần CPU cấp 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để chạm hạn mức EC2 Spot hoặc On-Demand Standard theo vùng. `.crabbox.yaml` do repo sở hữu mặc định dùng `standard`, nhiều vùng dung lượng và `capacity.hints: true` để các lease AWS qua broker in ra vùng/thị trường đã chọn, áp lực hạn mức, fallback Spot và cảnh báo lớp chịu áp lực cao. Dùng `fast` cho các kiểm tra rộng nặng hơn, chỉ dùng `large` sau khi standard/fast không đủ, và chỉ dùng `beast` cho các lane đặc biệt bị ràng buộc bởi CPU như ma trận Docker toàn bộ bộ kiểm thử hoặc toàn bộ Plugin, xác thực phát hành/chặn lỗi rõ ràng, hoặc profiling hiệu năng nhiều nhân. Không dùng `beast` cho `pnpm check:changed`, kiểm thử tập trung, công việc chỉ liên quan tài liệu, lint/typecheck thông thường, repro E2E nhỏ, hoặc phân tích sự cố Blacksmith. Dùng `--market on-demand` để chẩn đoán dung lượng nhằm tránh việc biến động thị trường Spot bị trộn vào tín hiệu.

`.crabbox.yaml` sở hữu các mặc định provider, đồng bộ hóa và hydrat hóa GitHub Actions cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrat hóa giữ metadata Git remote riêng thay vì đồng bộ remote và kho đối tượng cục bộ của maintainer, đồng thời loại trừ các tạo tác runtime/build cục bộ không bao giờ nên được truyền đi. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main` và bàn giao môi trường không chứa bí mật cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
