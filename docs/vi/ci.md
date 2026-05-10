---
read_when:
    - Bạn cần hiểu vì sao một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions đang thất bại
    - Bạn đang điều phối một lần chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi cơ chế điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị tác vụ CI, các cổng phạm vi, nhóm bao trùm phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-10T19:24:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

CI của OpenClaw chạy trên mọi lần đẩy lên `main` và mọi pull request. Tác vụ `preflight` phân loại phần khác biệt và tắt các làn tốn kém khi chỉ các khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho ứng viên phát hành và xác thực rộng. Các làn Android vẫn là tùy chọn bật qua `include_android`. Phạm vi Plugin chỉ dành cho phát hành nằm trong quy trình làm việc [`Plugin tiền phát hành`](#plugin-prerelease) riêng và chỉ chạy từ [`Xác thực bản phát hành đầy đủ`](#full-release-validation) hoặc một lần điều phối thủ công rõ ràng.

## Tổng quan pipeline

| Tác vụ                           | Mục đích                                                                                                  | Khi chạy                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ về tài liệu, phạm vi đã thay đổi, tiện ích mở rộng đã thay đổi, và dựng manifest CI | Luôn chạy trên push và PR không phải bản nháp |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra quy trình làm việc qua `zizmor`                                        | Luôn chạy trên push và PR không phải bản nháp |
| `security-dependency-audit`      | Kiểm tra lockfile production không cần phụ thuộc dựa trên cảnh báo npm                                     | Luôn chạy trên push và PR không phải bản nháp |
| `security-fast`                  | Tổng hợp bắt buộc cho các tác vụ bảo mật nhanh                                                            | Luôn chạy trên push và PR không phải bản nháp |
| `check-dependencies`             | Lượt kiểm tra Knip chỉ phụ thuộc production cùng bộ bảo vệ danh sách cho phép tệp không dùng               | Thay đổi liên quan đến Node          |
| `build-artifacts`                | Dựng `dist/`, Control UI, kiểm tra artifact đã dựng, và artifact hạ nguồn tái sử dụng được                 | Thay đổi liên quan đến Node          |
| `checks-fast-core`               | Các làn đúng đắn Linux nhanh như kiểm tra bundled/plugin-contract/protocol                                 | Thay đổi liên quan đến Node          |
| `checks-fast-contracts-channels` | Kiểm tra hợp đồng kênh được chia shard với kết quả kiểm tra tổng hợp ổn định                              | Thay đổi liên quan đến Node          |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ làn kênh, bundled, hợp đồng, và tiện ích mở rộng                    | Thay đổi liên quan đến Node          |
| `check`                          | Tương đương cổng cục bộ chính được chia shard: kiểu prod, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt | Thay đổi liên quan đến Node          |
| `check-additional`               | Kiến trúc, drift ranh giới/prompt được chia shard, guard tiện ích mở rộng, ranh giới gói, và gateway watch | Thay đổi liên quan đến Node          |
| `build-smoke`                    | Kiểm thử smoke CLI đã dựng và smoke bộ nhớ khởi động                                                      | Thay đổi liên quan đến Node          |
| `checks`                         | Bộ xác minh cho kiểm thử kênh trên artifact đã dựng                                                       | Thay đổi liên quan đến Node          |
| `checks-node-compat-node22`      | Làn dựng và smoke tương thích Node 22                                                                     | Điều phối CI thủ công cho phát hành  |
| `check-docs`                     | Kiểm tra định dạng tài liệu, lint, và liên kết hỏng                                                       | Tài liệu thay đổi                    |
| `skills-python`                  | Ruff + pytest cho Skills dùng Python hậu thuẫn                                                            | Thay đổi liên quan đến Python-skill  |
| `checks-windows`                 | Kiểm thử quy trình/đường dẫn riêng cho Windows cùng hồi quy specifier import runtime dùng chung           | Thay đổi liên quan đến Windows       |
| `macos-node`                     | Làn kiểm thử TypeScript macOS dùng artifact đã dựng dùng chung                                            | Thay đổi liên quan đến macOS         |
| `macos-swift`                    | Swift lint, dựng, và kiểm thử cho ứng dụng macOS                                                          | Thay đổi liên quan đến macOS         |
| `android`                        | Kiểm thử đơn vị Android cho cả hai flavor cùng một lần dựng APK debug                                     | Thay đổi liên quan đến Android       |
| `test-performance-agent`         | Tối ưu kiểm thử chậm Codex hằng ngày sau hoạt động đáng tin cậy                                           | CI chính thành công hoặc điều phối thủ công |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các làn mock-provider, deep-profile, và GPT 5.4 live | Theo lịch và điều phối thủ công      |

## Thứ tự fail-fast

1. `preflight` quyết định những làn nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong tác vụ này, không phải tác vụ độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các tác vụ artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các làn Linux nhanh để người tiêu thụ hạ nguồn có thể bắt đầu ngay khi bản dựng dùng chung sẵn sàng.
4. Các làn nền tảng và runtime nặng hơn mở rộng sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các tác vụ bị thay thế là `cancelled` khi một push mới hơn xuất hiện trên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` để vẫn báo cáo lỗi shard bình thường nhưng không đưa vào hàng đợi sau khi toàn bộ quy trình làm việc đã bị thay thế. Khóa đồng thời CI tự động được đánh phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy bộ đầy đủ thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang diễn ra.

Tác vụ `ci-timings-summary` tải lên artifact `ci-timings-summary` gọn cho mỗi lần chạy CI không phải bản nháp. Nó ghi lại thời gian tường, thời gian hàng đợi, tác vụ chậm nhất, và tác vụ thất bại cho lần chạy hiện tại, để các kiểm tra sức khỏe CI không cần quét toàn bộ payload Actions lặp đi lặp lại.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Điều phối thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa quy trình làm việc CI** xác thực đồ thị CI Node cùng lint quy trình làm việc, nhưng bản thân chúng không ép các bản dựng native Windows, Android, hoặc macOS; các làn nền tảng đó vẫn được giới hạn phạm vi theo thay đổi nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, chỉnh sửa fixture core-test rẻ đã chọn, và chỉnh sửa helper/test-routing hợp đồng Plugin hẹp** dùng đường dẫn manifest nhanh chỉ Node: `preflight`, bảo mật, và một tác vụ `checks-fast-core`. Đường dẫn đó bỏ qua artifact bản dựng, tương thích Node 22, hợp đồng kênh, shard lõi đầy đủ, shard bundled-plugin, và ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp kiểm tra.
- **Kiểm tra Node Windows** được giới hạn phạm vi vào wrapper quy trình/đường dẫn riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý gói, và các bề mặt quy trình làm việc CI thực thi làn đó; thay đổi nguồn, Plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn ở trên các làn Linux Node.

Các họ kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi tác vụ vẫn nhỏ mà không đặt trước quá nhiều runner: hợp đồng kênh chạy dưới dạng ba shard có trọng số do Blacksmith hậu thuẫn với fallback runner GitHub tiêu chuẩn, các làn fast/support đơn vị lõi chạy riêng, hạ tầng runtime lõi được tách giữa shard state, process/config, cron, và shared, auto-reply chạy như các worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch, và commands/state-routing), và cấu hình gateway/server agentic được tách qua các làn chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã dựng. Các kiểm thử trình duyệt rộng, QA, media, và Plugin miscellaneous dùng cấu hình Vitest chuyên biệt thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi mục thời gian bằng tên shard CI, nên `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với shard đã lọc. `check-additional` giữ công việc compile/canary ranh giới gói cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; danh sách guard ranh giới được rải qua bốn shard ma trận, mỗi shard chạy đồng thời các guard độc lập đã chọn và in thời gian theo từng kiểm tra. Kiểm tra drift snapshot prompt happy-path Codex tốn kém chạy như tác vụ bổ sung riêng cho CI thủ công và chỉ cho các thay đổi ảnh hưởng đến prompt, nên các thay đổi Node bình thường không liên quan không phải chờ sau việc tạo snapshot prompt lạnh và các shard ranh giới vẫn cân bằng trong khi prompt drift vẫn được ghim vào PR gây ra nó; cùng cờ đó bỏ qua tạo snapshot prompt Vitest bên trong shard support-boundary lõi artifact đã dựng. Gateway watch, kiểm thử kênh, và shard support-boundary lõi chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được dựng.

CI Android chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, rồi dựng APK debug Play. Flavor bên thứ ba không có source set hoặc manifest riêng; làn kiểm thử đơn vị của nó vẫn biên dịch flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh tác vụ đóng gói APK debug trùng lặp trên mọi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ phụ thuộc production được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được rà soát hoặc để lại mục danh sách cho phép đã lỗi thời, đồng thời giữ lại các bề mặt Plugin động, được tạo sinh, bản dựng, live-test, và cầu nối gói có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động kho lưu trữ OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Quy trình làm việc tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi điều phối các payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Quy trình làm việc có bốn làn:

- `clawsweeper_item` cho yêu cầu rà soát issue và pull request chính xác;
- `clawsweeper_comment` cho lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho yêu cầu rà soát ở cấp commit trên các push `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Làn `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, kho lưu trữ, số item, URL, tiêu đề, trạng thái, và đoạn trích ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ body Webhook. Quy trình làm việc nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng sự kiện đã chuẩn hóa lên hook Gateway OpenClaw cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải phân phối mặc định. Agent ClawSweeper nhận đích Discord trong prompt của nó và chỉ nên đăng lên `#clawsweeper` khi sự kiện gây bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về vận hành. Các lần mở, chỉnh sửa, biến động bot, nhiễu Webhook trùng lặp, và lưu lượng review bình thường nên trả về `NO_REPLY`.

Xem tiêu đề, bình luận, nội dung, văn bản review, tên nhánh và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy trong toàn bộ đường dẫn này. Chúng là đầu vào cho việc tóm tắt và phân loại, không phải chỉ dẫn cho quy trình làm việc hoặc runtime của agent.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng buộc bật mọi lane có phạm vi không phải Android: các shard Linux Node, shard Plugin tích hợp sẵn, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Python skills, Windows, macOS và i18n Control UI. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Các kiểm tra tĩnh prerelease Plugin, shard chỉ dành cho phát hành `agentic-plugins`, sweep hàng loạt extension đầy đủ và các lane Docker prerelease Plugin bị loại khỏi CI. Bộ prerelease Docker chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với gate release-validation được bật.

Các lần chạy thủ công dùng một nhóm concurrency duy nhất để bộ đầy đủ release-candidate không bị hủy bởi một lần chạy push hoặc PR khác trên cùng ref. Đầu vào tùy chọn `target_ref` cho phép một bên gọi đáng tin cậy chạy đồ thị đó trên một nhánh, thẻ hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ dispatch ref đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các job bảo mật nhanh và tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), kiểm tra nhanh protocol/hợp đồng/tích hợp sẵn, kiểm tra hợp đồng kênh theo shard, các shard `check` ngoại trừ lint, tổng hợp `check-additional`, bộ xác minh tổng hợp kiểm thử Node, kiểm tra tài liệu, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub lưu trữ để ma trận Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension tải nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, các shard kiểm thử Linux Node, shard kiểm thử Plugin tích hợp sẵn, shard `check-additional`, `android`                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (nhạy CPU đủ mức 8 vCPU tốn chi phí hơn phần tiết kiệm được); các bản build Docker install-smoke (thời gian hàng đợi 32-vCPU tốn chi phí hơn phần tiết kiệm được)                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; các fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; các fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                 |

CI của repo chính tắc giữ Blacksmith làm đường dẫn runner mặc định. Trong `preflight`, `scripts/ci-runner-labels.mjs` kiểm tra các lần chạy Actions gần đây đang xếp hàng và đang chạy để tìm các job Blacksmith đang xếp hàng. Nếu một nhãn Blacksmith cụ thể đã có job đang xếp hàng, các job hạ nguồn sẽ dùng đúng nhãn đó fallback về runner tương ứng do GitHub lưu trữ (`ubuntu-24.04`, `windows-2025` hoặc `macos-latest`) chỉ cho lần chạy đó. Các kích thước Blacksmith khác trong cùng họ OS vẫn ở trên nhãn chính của chúng. Nếu probe API thất bại, không áp dụng fallback.

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

`OpenClaw Performance` là workflow hiệu năng product/runtime. Nó chạy hằng ngày trên `main` và có thể được dispatch thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Dispatch thủ công thường benchmark workflow ref. Đặt `target_ref` để benchmark một thẻ phát hành hoặc nhánh khác với implementation workflow hiện tại. Các đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được khóa theo ref được kiểm thử, và mỗi `index.md` ghi lại ref/SHA được kiểm thử, workflow ref/SHA, Kova ref, hồ sơ, chế độ xác thực lane, model, số lần lặp và bộ lọc kịch bản.

Workflow cài OCM từ một bản phát hành được ghim và Kova từ `openclaw/Kova` tại đầu vào `kova_ref` được ghim, rồi chạy ba lane:

- `mock-provider`: các kịch bản chẩn đoán Kova trên runtime build cục bộ với xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: profiling CPU/heap/trace cho các hotspot khởi động, Gateway và lượt agent.
- `live-gpt54`: một lượt agent OpenAI `openai/gpt-5.4` thực, được bỏ qua khi không có `OPENAI_API_KEY`.

Lane mock-provider cũng chạy các probe nguồn native của OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ trên các trường hợp khởi động mặc định, hook và 50 Plugin; các vòng hello `channel-chat-baseline` mock-OpenAI lặp lại; và các lệnh khởi động CLI trên Gateway đã khởi động. Tóm tắt Markdown probe nguồn nằm tại `source/index.md` trong gói báo cáo, với JSON thô ở cạnh nó.

Mỗi lane tải lên artifact GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các bundle, `index.md` và artifact probe nguồn vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ tested-ref hiện tại được ghi là `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực phát hành đầy đủ

`Full Release Validation` là workflow umbrella thủ công cho "chạy mọi thứ trước khi phát hành." Nó nhận một nhánh, thẻ hoặc SHA commit đầy đủ, dispatch workflow `CI` thủ công với target đó, dispatch `Plugin Prerelease` cho bằng chứng plugin/gói/tĩnh/Docker chỉ dành cho phát hành, và dispatch `OpenClaw Release Checks` cho install smoke, chấp nhận gói, kiểm tra gói đa OS, ngang bằng QA Lab, Matrix và các lane Telegram. Các lần chạy ổn định/mặc định giữ coverage live/E2E và đường dẫn phát hành Docker toàn diện phía sau `run_release_soak=true`; `release_profile=full` buộc bật coverage soak đó để xác thực advisory rộng vẫn đủ rộng. Với `rerun_group=all` và `release_profile=full`, nó cũng chạy `NPM Telegram Beta E2E` trên artifact `release-package-under-test` từ release checks. Sau khi phát hành, truyền `npm_telegram_package_spec` để chạy lại cùng lane gói Telegram trên gói npm đã xuất bản.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn, tên job workflow chính xác, khác biệt giữa các hồ sơ, artifact và
các handle chạy lại tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Dispatch nó
từ `release/YYYY.M.D` hoặc `main` sau khi thẻ phát hành tồn tại và sau khi
preflight npm OpenClaw đã thành công. Nó xác minh `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` cho tất cả gói Plugin có thể phát hành, dispatch
`Plugin ClawHub Release` cho cùng SHA phát hành, và chỉ sau đó dispatch
`OpenClaw NPM Release` với `preflight_run_id` đã lưu.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit được ghim trên một nhánh thay đổi nhanh, hãy dùng trình trợ giúp thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref dispatch của workflow GitHub phải là nhánh hoặc tag, không phải SHA commit thô. Trình trợ giúp đẩy một nhánh tạm thời `release-ci/<sha>-...` tại SHA đích, dispatch `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con có `headSha` khớp với đích, và xóa nhánh tạm thời khi lần chạy hoàn tất. Bộ xác minh umbrella cũng thất bại nếu bất kỳ workflow con nào chạy ở một SHA khác.

`release_profile` kiểm soát phạm vi live/provider được truyền vào các kiểm tra phát hành. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn cố ý muốn ma trận nhà cung cấp/phương tiện tư vấn rộng. `run_release_soak` kiểm soát liệu các kiểm tra phát hành stable/mặc định có chạy soak đầy đủ cho live/E2E và đường dẫn phát hành Docker hay không; `full` bắt buộc bật soak.

- `minimum` giữ các lane OpenAI/core nhanh nhất và trọng yếu cho phát hành.
- `stable` thêm tập nhà cung cấp/backend ổn định.
- `full` chạy ma trận nhà cung cấp/phương tiện tư vấn rộng.

Umbrella ghi lại các id lần chạy con đã dispatch, và job cuối cùng `Verify full validation` kiểm tra lại các kết luận hiện tại của lần chạy con và thêm các bảng job chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển sang xanh, chỉ chạy lại job xác minh cha để làm mới kết quả umbrella và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho workflow con CI đầy đủ thông thường, `plugin-prerelease` chỉ cho workflow con prerelease plugin, `release-checks` cho mọi workflow con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên umbrella. Điều này giữ lần chạy lại của một hộp phát hành thất bại trong phạm vi giới hạn sau một bản sửa tập trung. Với một lane cross-OS thất bại, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh cross-OS dài phát ra các dòng Heartbeat và tóm tắt packaged-upgrade bao gồm thời gian theo từng pha. Các lane QA release-check mang tính tư vấn, nên lỗi chỉ ở QA sẽ cảnh báo nhưng không chặn bộ xác minh release-check.

`OpenClaw Release Checks` dùng ref workflow tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho kiểm tra cross-OS và Chấp nhận gói, cộng với workflow Docker live/E2E đường dẫn phát hành khi chạy độ phủ soak. Điều đó giữ byte của gói nhất quán trên các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều job con.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
thay thế umbrella cũ hơn. Bộ giám sát cha hủy mọi workflow con mà nó đã dispatch khi cha bị hủy, nên xác thực main mới hơn không phải nằm sau một lần chạy release-check cũ kéo dài hai giờ. Xác thực nhánh/tag phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Các shard live và E2E

Workflow con live/E2E phát hành giữ độ phủ `pnpm test:live` native rộng, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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
- các shard phương tiện âm thanh/video được tách và các shard nhạc được lọc theo nhà cung cấp

Điều đó giữ cùng độ phủ tệp trong khi giúp việc chạy lại và chẩn đoán các lỗi nhà cung cấp live chậm dễ hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard phương tiện live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được xây dựng bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job phương tiện chỉ xác minh binary trước khi thiết lập. Giữ các bộ live dùng Docker trên runner Blacksmith thông thường — job container là sai chỗ để khởi chạy các bài kiểm thử Docker lồng nhau.

Các shard model/backend live dùng Docker sử dụng một image dùng chung riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit đã chọn. Workflow phát hành live xây dựng và đẩy image đó một lần, sau đó các shard model live Docker, Gateway được chia theo nhà cung cấp, backend CLI, ACP bind, và Codex harness chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang các giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout job workflow để một container hoặc đường dọn dẹp bị kẹt thất bại nhanh thay vì tiêu thụ toàn bộ ngân sách release-check. Nếu các shard đó tự xây dựng lại toàn bộ mục tiêu Docker nguồn một cách độc lập, lần chạy phát hành đang bị cấu hình sai và sẽ lãng phí thời gian thực vào các lần build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, trong khi chấp nhận gói xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng chạy sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, ref workflow, ref gói, phiên bản, SHA-256, và profile trong tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory tarball, chuẩn bị image Docker theo digest gói khi cần, và chạy các lane Docker đã chọn trên gói đó thay vì đóng gói checkout workflow. Khi một profile chọn nhiều `docker_lanes` đích, workflow tái sử dụng chuẩn bị gói và các image dùng chung một lần, rồi tỏa các lane đó ra thành các job Docker đích song song với artifact duy nhất.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Chấp nhận gói đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã phát hành.
4. `summary` làm workflow thất bại nếu phân giải gói, chấp nhận Docker, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng lựa chọn này cho chấp nhận prerelease/stable đã phát hành.
- `source=ref` đóng gói một nhánh, tag, hoặc SHA commit đầy đủ `package_ref` tin cậy. Bộ phân giải fetch các nhánh/tag OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử nhánh kho lưu trữ hoặc một tag phát hành, cài đặt phụ thuộc trong một worktree tách rời, và đóng gói nó bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness tin cậy chạy bài kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các khúc đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng độ phủ plugin offline để xác thực gói đã phát hành không bị phụ thuộc vào khả dụng live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn spec npm đã phát hành được giữ cho các dispatch độc lập.

Để xem chính sách kiểm thử cập nhật và plugin chuyên biệt, bao gồm lệnh cục bộ,
lane Docker, đầu vào Chấp nhận gói, mặc định phát hành, và phân loại lỗi,
xem [Kiểm thử cập nhật và plugin](/vi/help/testing-updates-plugins).

Các kiểm tra phát hành gọi Chấp nhận gói với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng di trú gói, cập nhật, cài đặt skill ClawHub live, dọn dẹp phụ thuộc plugin cũ, sửa cài đặt plugin đã cấu hình, plugin offline, plugin-update, và Telegram trên cùng tarball gói đã phân giải. Đặt `package_acceptance_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks để chạy cùng ma trận đó trên một gói npm đã phát hành thay vì artifact được xây dựng từ SHA. Các kiểm tra phát hành cross-OS vẫn bao phủ hành vi onboarding, trình cài đặt, và nền tảng đặc thù theo OS; xác thực sản phẩm gói/cập nhật nên bắt đầu với Chấp nhận gói. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã phát hành trên mỗi lần chạy trong đường dẫn phát hành chặn. Trong Chấp nhận gói, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã phát hành dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng trên bốn bản phát hành npm stable mới nhất cộng với các bản phát hành ranh giới tương thích plugin được ghim và fixture theo dạng issue cho cấu hình Feishu, các tệp bootstrap/persona được giữ lại, cài đặt Plugin OpenClaw đã cấu hình, đường dẫn log dạng dấu ngã, và root phụ thuộc plugin legacy cũ. Các lựa chọn published-upgrade survivor nhiều baseline được chia theo baseline thành các job runner Docker đích riêng. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã phát hành toàn diện, không phải phạm vi CI Full Release thông thường. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã phát hành cấu hình baseline bằng một công thức lệnh `openclaw config set` được nhúng sẵn, ghi lại các bước công thức trong `summary.json`, và thăm dò `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane packaged và installer fresh trên Windows cũng xác minh rằng một gói đã cài đặt có thể import override điều khiển trình duyệt từ một đường dẫn Windows tuyệt đối thô. Smoke agent-turn cross-OS OpenAI mặc định là `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không là `openai/gpt-5.4`, nên bằng chứng cài đặt và Gateway vẫn ở trên model kiểm thử GPT-5 trong khi tránh các mặc định GPT-4.x.

### Cửa sổ tương thích kế thừa

Package Acceptance có các cửa sổ tương thích kế thừa có giới hạn cho các gói đã được phát hành. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các tệp bị bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua trường hợp con duy trì `gateway install --wrapper` khi gói không công khai cờ đó;
- `update-channel-switch` có thể loại bỏ các `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả được suy ra từ tarball và có thể ghi log `update.channel` đã duy trì bị thiếu;
- các kiểm thử smoke cho Plugin có thể đọc các vị trí install-record kế thừa hoặc chấp nhận thiếu duy trì install-record của marketplace;
- `plugin-update` có thể cho phép di chuyển siêu dữ liệu cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo đối với các tệp dấu metadata bản dựng cục bộ đã được phát hành. Các gói sau đó phải thỏa mãn các hợp đồng hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy package acceptance thất bại, hãy bắt đầu từ phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời gian từng pha và các lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói thất bại hoặc đúng các lane Docker thay vì chạy lại toàn bộ xác thực bản phát hành.

## Smoke cài đặt

Workflow `Install Smoke` riêng biệt tái sử dụng cùng script phạm vi thông qua job `preflight` riêng của nó. Workflow này chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho các pull request chạm vào bề mặt Docker/gói, thay đổi gói/manifest của Plugin đi kèm, hoặc các bề mặt Plugin/lane/Gateway/Plugin SDK lõi mà các job Docker smoke kiểm thử. Các thay đổi Plugin đi kèm chỉ ở mã nguồn, chỉnh sửa chỉ dành cho kiểm thử và chỉnh sửa chỉ dành cho tài liệu không giữ trước worker Docker. Đường dẫn nhanh dựng image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa agents shared-workspace, chạy e2e gateway-network trong container, xác minh build arg cho extension đi kèm, và chạy hồ sơ Docker Plugin đi kèm có giới hạn dưới thời hạn tổng hợp 240 giây cho lệnh (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ cài đặt gói QR và phạm vi Docker/update của installer cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành workflow-call và các pull request thật sự chạm vào bề mặt installer/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image smoke Dockerfile gốc GHCR theo target-SHA, rồi chạy cài đặt gói QR, smoke Dockerfile/gateway gốc, smoke installer/update và Docker E2E nhanh cho Plugin đi kèm dưới dạng các job riêng biệt để công việc installer không phải chờ sau các smoke image gốc.

Các lần push lên `main` (bao gồm merge commit) không ép đường dẫn đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một push, workflow giữ Docker smoke nhanh và để smoke cài đặt đầy đủ cho xác thực hằng đêm hoặc bản phát hành.

Smoke image-provider cài đặt toàn cục Bun chậm được chặn riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra bản phát hành, và các dispatch `Install Smoke` thủ công có thể chọn bật nó, nhưng pull request và push lên `main` thì không. Các kiểm thử Docker QR và installer giữ các Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng trước một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, và dựng hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane installer/update/plugin-dependency;
- một image chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi plan đã chọn. Scheduler chọn image cho từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số điều chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot của pool chính cho các lane thông thường.                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot của tail-pool nhạy cảm với provider.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để các provider không throttle.                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane đa dịch vụ đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Khoảng giãn giữa các lần bắt đầu lane để tránh bão tạo Docker daemon; đặt `0` để không giãn. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Thời hạn dự phòng theo từng lane (120 phút); các lane live/tail được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in plan của scheduler mà không chạy lane.                                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agents có thể tái tạo một lane thất bại. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể bắt đầu từ một pool trống, rồi chạy một mình cho đến khi nó giải phóng dung lượng. Các preflight tổng hợp cục bộ kiểm tra Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, duy trì thời gian lane để sắp xếp dài nhất trước, và mặc định dừng lập lịch các lane trong pool mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` cần phạm vi gói, loại image, image live, lane và thông tin xác thực nào. `scripts/docker-e2e.mjs` sau đó chuyển plan đó thành output và tóm tắt GitHub. Nó đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại, hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; dựng và push các image Docker E2E GHCR bare/functional được gắn tag bằng digest gói qua cache layer Docker của Blacksmith khi plan cần các lane đã cài gói; và tái sử dụng các input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các image package-digest hiện có thay vì dựng lại. Việc pull image Docker được thử lại với thời hạn giới hạn 180 giây cho mỗi lần thử để một stream registry/cache bị kẹt được thử lại nhanh thay vì tiêu thụ phần lớn đường găng CI.

### Chunk đường dẫn phát hành

Phạm vi Docker phát hành chạy các job được chia chunk nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi chunk chỉ pull loại image nó cần và thực thi nhiều lane qua cùng scheduler có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các chunk Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và từ `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các bí danh tổng hợp Plugin/runtime. Bí danh lane `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai lane installer provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ chunk độc lập `openwebui` cho các dispatch chỉ dành cho OpenWebUI. Các lane update kênh đi kèm thử lại một lần đối với lỗi mạng npm tạm thời.

Mỗi chunk tải lên `.artifacts/docker-tests/` với log lane, thời gian, `summary.json`, `failures.json`, thời gian từng pha, JSON plan scheduler, bảng lane chậm và các lệnh chạy lại theo từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn trên các image đã chuẩn bị thay vì các job chunk, giúp việc gỡ lỗi lane thất bại được giới hạn trong một job Docker có mục tiêu và chuẩn bị, tải xuống hoặc tái sử dụng artifact gói cho lần chạy đó; nếu một lane đã chọn là lane Docker live, job mục tiêu dựng image live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name` và các input image đã chuẩn bị khi các giá trị đó tồn tại, để một lane thất bại có thể tái sử dụng đúng gói và image từ lần chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Prerelease Plugin

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, push lên `main` và dispatch CI thủ công độc lập giữ bộ này tắt. Nó cân bằng các kiểm thử Plugin đi kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch Plugin nặng import không tạo thêm job CI. Đường dẫn prerelease Docker chỉ dành cho phát hành gom nhóm các lane Docker có mục tiêu theo nhóm nhỏ để tránh giữ trước hàng chục runner cho các job một đến ba phút.

## QA Lab

QA Lab có các lane CI chuyên dụng bên ngoài workflow chính có phạm vi thông minh. Tính tương đương agentic được lồng dưới các harness QA rộng và phát hành, không phải một workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi tính tương đương nên đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó tỏa ra lane tương đương mock, lane Matrix live, và các lane Telegram và Discord live dưới dạng các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các kiểm tra phát hành chạy các lane truyền tải trực tiếp Matrix và Telegram với nhà cung cấp giả lập tất định và các mô hình đạt chuẩn mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được cô lập khỏi độ trễ mô hình trực tiếp và quá trình khởi động Plugin nhà cung cấp thông thường. Gateway truyền tải trực tiếp tắt tìm kiếm bộ nhớ vì tính tương đương QA bao phủ riêng hành vi bộ nhớ; khả năng kết nối nhà cung cấp được bao phủ bởi các bộ kiểm thử mô hình trực tiếp, nhà cung cấp gốc, và nhà cung cấp Docker riêng biệt.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và đầu vào workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn chia nhỏ phạm vi bao phủ Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; cổng tương đương QA của nó chạy các gói ứng viên và đường cơ sở dưới dạng các job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ để so sánh tương đương cuối cùng.

Đối với PR thông thường, hãy theo bằng chứng CI/kiểm tra theo phạm vi thay vì coi tính tương đương là một trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` được cố ý thiết kế là trình quét bảo mật bước đầu phạm vi hẹp, không phải lượt quét toàn bộ kho lưu trữ. Các lượt chạy bảo vệ hằng ngày, thủ công, và pull request không ở trạng thái nháp quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript có rủi ro cao nhất bằng các truy vấn bảo mật có độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Bảo vệ pull request vẫn nhẹ: nó chỉ bắt đầu với các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật có độ tin cậy cao như workflow theo lịch. Android và macOS CodeQL không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Xác thực, bí mật, sandbox, cron, và đường cơ sở Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, Gateway, Plugin SDK, bí mật, các điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF lõi, phân tích IP, bảo vệ mạng, web-fetch, và các bề mặt chính sách SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, trình trợ giúp thực thi tiến trình, phân phối đi, và các cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, tải nguồn, và các bề mặt tin cậy của hợp đồng gói Plugin SDK |

### Các shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được kiểm tra hợp lệ workflow chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF đã tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn runtime ngay cả khi sạch.

### Danh mục chất lượng trọng yếu

`CodeQL Critical Quality` là shard phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript phi bảo mật, mức độ lỗi, trên các bề mặt hẹp có giá trị cao trên runner Blacksmith Linux nhỏ hơn. Bảo vệ pull request của nó được cố ý thu nhỏ hơn profile theo lịch: các PR không ở trạng thái nháp chỉ chạy các shard tương ứng `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` cho các thay đổi về mã thực thi lệnh/mô hình/công cụ của agent và dispatch phản hồi, mã schema/di trú/IO cấu hình, mã xác thực/bí mật/sandbox/bảo mật, runtime kênh lõi và Plugin kênh đóng gói, giao thức Gateway/phương thức máy chủ, runtime bộ nhớ/glue SDK, MCP/tiến trình/phân phối đi, runtime nhà cung cấp/danh mục mô hình, chẩn đoán phiên/hàng đợi phân phối, Plugin loader, Plugin SDK/hợp đồng gói, hoặc runtime phản hồi Plugin SDK. Các thay đổi về cấu hình CodeQL và workflow chất lượng chạy toàn bộ mười hai shard chất lượng PR.

Dispatch thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các profile hẹp là hook hướng dẫn/lặp để chạy riêng một shard chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Xác thực, bí mật, sandbox, cron, và mã biên bảo mật Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Schema cấu hình, di trú, chuẩn hóa, và hợp đồng IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đóng gói                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, dispatch mô hình/nhà cung cấp, dispatch và hàng đợi tự động trả lời, và hợp đồng runtime control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình, và hợp đồng phân phối đi                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, glue kích hoạt runtime bộ nhớ, và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi phản hồi, hàng đợi phân phối phiên, trình trợ giúp bind/phân phối phiên đi, bề mặt gói sự kiện/nhật ký chẩn đoán, và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch phản hồi đến Plugin SDK, trình trợ giúp payload/chia chunk/runtime phản hồi, tùy chọn trả lời kênh, hàng đợi phân phối, và trình trợ giúp bind phiên/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, xác thực và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/danh mục nhà cung cấp, và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Khởi động UI điều khiển, lưu trữ cục bộ, luồng điều khiển Gateway, và hợp đồng runtime control-plane tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web lõi, IO media, hiểu media, tạo ảnh, và hợp đồng runtime tạo media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, bề mặt công khai, và hợp đồng entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và trình trợ giúp hợp đồng gói Plugin                                                                                      |

Chất lượng được tách riêng khỏi bảo mật để các phát hiện chất lượng có thể được lập lịch, đo lường, tắt, hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python, và Plugin đóng gói chỉ nên được thêm lại dưới dạng công việc tiếp theo theo phạm vi hoặc chia shard sau khi các profile hẹp có runtime và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một lane bảo trì Codex dựa trên sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được merge. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và dispatch thủ công có thể chạy trực tiếp. Các lần gọi workflow-run bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác được tạo trong giờ vừa qua. Khi chạy, nó xem xét phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, nên một lượt chạy hằng giờ có thể bao phủ mọi thay đổi main tích lũy từ lượt rà soát tài liệu trước.

### Test Performance Agent

Workflow `Test Performance Agent` là một lane bảo trì Codex dựa trên sự kiện cho các kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày đó. Lane này build báo cáo hiệu năng Vitest theo nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ nguyên phạm vi bao phủ thay vì các refactor rộng, rồi chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử đường cơ sở đang pass. Nếu đường cơ sở có kiểm thử fail, Codex chỉ có thể sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau agent phải pass trước khi bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi lượt push của bot được land, lane này rebase patch đã xác thực, chạy lại `pnpm check:changed`, và thử push lại; các patch cũ xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub host để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi merge

Workflow `Duplicate PRs After Merge` là workflow thủ công cho maintainer để dọn dẹp trùng lặp sau land. Mặc định của nó là dry-run và chỉ đóng các PR được liệt kê rõ khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi bản trùng lặp có issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- các thay đổi production của core chạy typecheck core prod và core test cùng lint/guard của core;
- các thay đổi chỉ liên quan đến test của core chỉ chạy typecheck core test cùng lint của core;
- các thay đổi production của tiện ích mở rộng chạy typecheck extension prod và extension test cùng lint của tiện ích mở rộng;
- các thay đổi chỉ liên quan đến test của tiện ích mở rộng chạy typecheck extension test cùng lint của tiện ích mở rộng;
- các thay đổi Plugin SDK công khai hoặc hợp đồng plugin mở rộng sang typecheck tiện ích mở rộng vì các tiện ích mở rộng phụ thuộc vào những hợp đồng core đó (các lượt quét tiện ích mở rộng Vitest vẫn là công việc test tường minh);
- các lần tăng phiên bản chỉ liên quan đến metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc root có mục tiêu;
- các thay đổi root/cấu hình không xác định sẽ fail an toàn sang tất cả các lane kiểm tra.

Định tuyến test thay đổi cục bộ nằm trong `scripts/test-projects.test-support.mjs` và được chủ ý làm rẻ hơn `check:changed`: các chỉnh sửa test trực tiếp tự chạy chính chúng, các chỉnh sửa mã nguồn ưu tiên ánh xạ tường minh, sau đó là test cùng cấp và các phần phụ thuộc theo đồ thị import. Cấu hình phân phối phòng nhóm dùng chung là một trong các ánh xạ tường minh: các thay đổi với cấu hình trả lời hiển thị trong nhóm, chế độ phân phối trả lời nguồn, hoặc tuyến prompt hệ thống của công cụ tin nhắn sẽ đi qua các test trả lời core cùng các hồi quy phân phối Discord và Slack, để một thay đổi mặc định dùng chung fail trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập ánh xạ rẻ không còn là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ root repo và ưu tiên một box mới đã được làm nóng cho bằng chứng rộng. Trước khi tốn một gate chậm trên box đã được tái sử dụng, hết hạn, hoặc vừa báo một lần đồng bộ lớn bất thường, hãy chạy `pnpm testbox:sanity` bên trong box trước.

Kiểm tra sanity fail nhanh khi các tệp root bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 tệp đã theo dõi bị xóa. Điều đó thường có nghĩa là trạng thái đồng bộ từ xa không phải là bản sao PR đáng tin cậy; hãy dừng box đó và làm nóng một box mới thay vì debug lỗi test sản phẩm. Với các PR xóa số lượng lớn có chủ ý, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng kết thúc một lần gọi Blacksmith CLI cục bộ nếu nó ở lại pha đồng bộ hơn năm phút mà không có output sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt guard đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là wrapper remote-box do repo sở hữu cho bằng chứng Linux của maintainer. Dùng nó khi một kiểm tra quá rộng cho vòng lặp chỉnh sửa cục bộ, khi cần tương đồng CI, hoặc khi bằng chứng cần secret, Docker, các lane package, box tái sử dụng, hoặc log từ xa. Backend OpenClaw thông thường là `blacksmith-testbox`; dung lượng AWS/Hetzner sở hữu là fallback khi Blacksmith ngừng hoạt động, có vấn đề quota, hoặc cần test rõ ràng trên dung lượng sở hữu.

Trước lần chạy đầu tiên, kiểm tra wrapper từ root repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper repo từ chối binary Crabbox lỗi thời không quảng bá `blacksmith-testbox`. Truyền provider tường minh dù `.crabbox.yaml` có mặc định owned-cloud.

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

Đọc phần tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Các lần chạy Crabbox một lần có Blacksmith hỗ trợ nên tự động dừng Testbox; nếu một lần chạy bị gián đoạn hoặc việc dọn dẹp không rõ ràng, hãy kiểm tra các box đang hoạt động và chỉ dừng những box bạn đã tạo:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Chỉ dùng tái sử dụng khi bạn chủ ý cần nhiều lệnh trên cùng một box đã hydrate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Nếu Crabbox là lớp bị hỏng nhưng bản thân Blacksmith vẫn hoạt động, dùng Blacksmith trực tiếp làm fallback hẹp:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các lần warmup mới nằm ở trạng thái `queued` mà không có IP hoặc URL lần chạy Actions sau vài phút, hãy xem đó là áp lực từ provider, hàng đợi, billing, hoặc giới hạn tổ chức của Blacksmith. Dừng các id đang queued mà bạn đã tạo, tránh khởi động thêm Testbox, và chuyển bằng chứng sang đường dẫn dung lượng Crabbox sở hữu bên dưới trong khi có người kiểm tra dashboard, billing, và giới hạn tổ chức của Blacksmith.

Chỉ leo thang sang dung lượng Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn quota, thiếu môi trường cần thiết, hoặc dung lượng sở hữu là mục tiêu tường minh:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thực sự cần CPU cấp 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để chạm quota EC2 Spot hoặc On-Demand Standard theo vùng. `.crabbox.yaml` do repo sở hữu mặc định dùng `standard`, nhiều vùng dung lượng, và `capacity.hints: true` để các lease AWS qua broker in ra vùng/market đã chọn, áp lực quota, fallback Spot, và cảnh báo class áp lực cao. Dùng `fast` cho các kiểm tra rộng nặng hơn, `large` chỉ sau khi standard/fast không đủ, và `beast` chỉ cho các lane đặc biệt bị giới hạn bởi CPU như full-suite hoặc ma trận Docker toàn plugin, xác thực phát hành/blocker tường minh, hoặc profiling hiệu năng nhiều core. Không dùng `beast` cho `pnpm check:changed`, test tập trung, công việc chỉ tài liệu, lint/typecheck thông thường, repro E2E nhỏ, hoặc triage sự cố Blacksmith. Dùng `--market on-demand` để chẩn đoán dung lượng nhằm không trộn biến động thị trường Spot vào tín hiệu.

`.crabbox.yaml` sở hữu các mặc định provider, đồng bộ, và hydrate GitHub Actions cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa của riêng nó thay vì đồng bộ các remote và object store cục bộ của maintainer, và nó loại trừ các artifact runtime/build cục bộ không bao giờ nên được truyền. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không phải secret cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
