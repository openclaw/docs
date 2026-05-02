---
read_when:
    - Bạn cần hiểu vì sao một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions bị thất bại
    - Bạn đang điều phối một lượt chạy hoặc chạy lại xác thực bản phát hành
    - Bạn đang thay đổi cơ chế điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị công việc CI, cổng phạm vi, nhóm phát hành bao quát và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-02T23:39:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần đẩy lên `main` và mọi pull request. Tác vụ `preflight` phân loại diff và tắt các luồng tốn kém khi chỉ những khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho các ứng viên phát hành và xác thực rộng. Các luồng Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong quy trình [`Plugin Prerelease`](#plugin-prerelease) riêng và chỉ chạy từ [`Full Release Validation`](#full-release-validation) hoặc một lần kích hoạt thủ công rõ ràng.

## Tổng quan pipeline

| Tác vụ                           | Mục đích                                                                                                            | Khi chạy                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ liên quan đến tài liệu, phạm vi đã thay đổi, extension đã thay đổi, và dựng manifest CI      | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra workflow qua `zizmor`                                                           | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `security-dependency-audit`      | Kiểm tra lockfile production không cần dependency dựa trên advisories của npm                                       | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `security-fast`                  | Tác vụ tổng hợp bắt buộc cho các tác vụ bảo mật nhanh                                                               | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `check-dependencies`             | Lượt kiểm tra Knip chỉ dành cho dependency production cộng với guard allowlist tệp không dùng                       | Các thay đổi liên quan đến Node               |
| `build-artifacts`                | Dựng `dist/`, Control UI, kiểm tra artifact đã dựng, và artifact downstream có thể tái sử dụng                      | Các thay đổi liên quan đến Node               |
| `checks-fast-core`               | Các luồng kiểm tra đúng đắn Linux nhanh như kiểm tra bundled/plugin-contract/protocol                               | Các thay đổi liên quan đến Node               |
| `checks-fast-contracts-channels` | Kiểm tra contract của kênh theo shard với kết quả kiểm tra tổng hợp ổn định                                        | Các thay đổi liên quan đến Node               |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, không gồm các luồng kênh, bundled, contract, và extension                             | Các thay đổi liên quan đến Node               |
| `check`                          | Tương đương cổng kiểm tra cục bộ chính theo shard: kiểu production, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt | Các thay đổi liên quan đến Node               |
| `check-additional`               | Kiến trúc, ranh giới, drift snapshot prompt, guard bề mặt extension, ranh giới package, và các shard gateway-watch | Các thay đổi liên quan đến Node               |
| `build-smoke`                    | Kiểm thử smoke CLI đã dựng và smoke bộ nhớ khởi động                                                                | Các thay đổi liên quan đến Node               |
| `checks`                         | Bộ xác minh cho kiểm thử kênh artifact đã dựng                                                                      | Các thay đổi liên quan đến Node               |
| `checks-node-compat-node22`      | Luồng build và smoke tương thích Node 22                                                                            | Kích hoạt CI thủ công cho phát hành           |
| `check-docs`                     | Định dạng tài liệu, lint, và kiểm tra liên kết hỏng                                                                 | Tài liệu thay đổi                             |
| `skills-python`                  | Ruff + pytest cho Skills có nền tảng Python                                                                         | Các thay đổi liên quan đến Python-skill       |
| `checks-windows`                 | Kiểm thử process/path dành riêng cho Windows cộng với hồi quy specifier import runtime dùng chung                   | Các thay đổi liên quan đến Windows            |
| `macos-node`                     | Luồng kiểm thử TypeScript trên macOS dùng artifact đã dựng dùng chung                                               | Các thay đổi liên quan đến macOS              |
| `macos-swift`                    | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                                   | Các thay đổi liên quan đến macOS              |
| `android`                        | Kiểm thử unit Android cho cả hai flavor cộng với một bản build APK debug                                            | Các thay đổi liên quan đến Android            |
| `test-performance-agent`         | Tối ưu kiểm thử chậm hằng ngày bằng Codex sau hoạt động đáng tin cậy                                                | CI chính thành công hoặc kích hoạt thủ công   |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các luồng mock-provider, deep-profile, và GPT 5.4 live    | Theo lịch và kích hoạt thủ công               |

## Thứ tự fail-fast

1. `preflight` quyết định những luồng nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong tác vụ này, không phải tác vụ độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các tác vụ artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các luồng Linux nhanh để các bên tiêu thụ downstream có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các luồng nền tảng và runtime nặng hơn mở rộng sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các tác vụ bị thay thế là `cancelled` khi một lần đẩy mới hơn xuất hiện trên cùng PR hoặc ref `main`. Hãy coi đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` để vẫn báo cáo lỗi shard thông thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa đồng thời CI tự động được tạo phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang diễn ra.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử unit trong `src/scripts/ci-changed-scope.test.ts`. Kích hoạt thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị Node CI cộng với lint workflow, nhưng tự chúng không buộc build native Windows, Android, hoặc macOS; các luồng nền tảng đó vẫn được giới hạn theo thay đổi mã nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, chỉnh sửa fixture core-test rẻ được chọn, và chỉnh sửa helper/test-routing hẹp cho contract Plugin** dùng đường dẫn manifest nhanh chỉ dành cho Node: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường dẫn đó bỏ qua build artifact, tương thích Node 22, contract kênh, toàn bộ shard lõi, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp thực thi.
- **Kiểm tra Node trên Windows** được giới hạn vào các wrapper process/path dành riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package, và các bề mặt workflow CI thực thi luồng đó; các thay đổi mã nguồn, Plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn nằm trên các luồng Linux Node.

Các họ kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi tác vụ vẫn nhỏ mà không đặt trước runner quá mức: contract kênh chạy dưới dạng ba shard có trọng số, các luồng unit lõi nhỏ được ghép cặp, auto-reply chạy dưới dạng bốn worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch, và commands/state-routing), và cấu hình gateway/plugin dạng agentic được phân bổ trên các tác vụ Node agentic chỉ theo mã nguồn hiện có thay vì chờ artifact đã dựng. Các kiểm thử trình duyệt rộng, QA, media, và Plugin khác dùng cấu hình Vitest chuyên biệt của chúng thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi mục thời gian bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với shard đã lọc. `check-additional` giữ công việc biên dịch/canary package-boundary cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; shard guard ranh giới chạy các guard độc lập nhỏ của nó đồng thời bên trong một tác vụ, bao gồm `pnpm prompt:snapshots:check` để drift prompt đường dẫn thành công của runtime Codex được ghim vào PR đã gây ra nó. Gateway watch, kiểm thử kênh, và shard support-boundary lõi chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được dựng.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi dựng APK debug Play. Flavor bên thứ ba không có source set hoặc manifest riêng; luồng kiểm thử unit của nó vẫn biên dịch flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh tác vụ đóng gói APK debug trùng lặp trên mọi lần đẩy liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt kiểm tra Knip chỉ dành cho dependency production được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho bản cài `dlx`) và `pnpm deadcode:unused-files`, so sánh các phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được rà soát hoặc để lại mục allowlist cũ, trong khi vẫn giữ các bề mặt Plugin động, generated, build, live-test, và cầu nối package có chủ đích mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động repository OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi gửi payload `repository_dispatch` gọn đến `openclaw/clawsweeper`.

Workflow có bốn luồng:

- `clawsweeper_item` cho yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho yêu cầu review cấp commit trên các lần đẩy `main`;
- `github_activity` cho hoạt động GitHub chung mà tác nhân ClawSweeper có thể kiểm tra.

Luồng `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, repository, số mục, URL, tiêu đề, trạng thái, và các đoạn trích ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ thân webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng sự kiện đã chuẩn hóa tới hook OpenClaw Gateway cho tác nhân ClawSweeper.

Hoạt động chung là quan sát, không phải gửi mặc định. Tác nhân ClawSweeper nhận đích Discord trong prompt và chỉ nên đăng lên `#clawsweeper` khi sự kiện bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về mặt vận hành. Các lần mở, chỉnh sửa, biến động bot, nhiễu webhook trùng lặp, và lưu lượng review thông thường nên trả về `NO_REPLY`.

Hãy coi tiêu đề, bình luận, thân nội dung, văn bản review, tên nhánh, và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy xuyên suốt đường dẫn này. Chúng là đầu vào cho tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime tác nhân.

## Kích hoạt thủ công

Các lần điều phối CI thủ công chạy cùng đồ thị công việc như CI thông thường nhưng buộc bật mọi lane có phạm vi không phải Android: các shard Linux Node, shard Plugin đóng gói, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Skills Python, Windows, macOS và i18n Control UI. Các lần điều phối CI thủ công độc lập chỉ chạy Android với `include_android=true`; ô bao phủ phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Các kiểm tra tĩnh tiền phát hành Plugin, shard chỉ dành cho phát hành `agentic-plugins`, đợt quét toàn bộ extension đầy đủ và các lane Docker tiền phát hành Plugin bị loại khỏi CI. Bộ kiểm thử tiền phát hành Docker chỉ chạy khi `Full Release Validation` điều phối workflow `Plugin Prerelease` riêng với cổng xác thực phát hành được bật.

Các lần chạy thủ công dùng một nhóm đồng thời duy nhất để bộ đầy đủ của release-candidate không bị hủy bởi một lần chạy push hoặc PR khác trên cùng ref. Input `target_ref` tùy chọn cho phép một caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ ref điều phối đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Công việc                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các công việc bảo mật nhanh và tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), các kiểm tra giao thức/hợp đồng/đóng gói nhanh, các kiểm tra hợp đồng kênh được chia shard, các shard `check` ngoại trừ lint, các shard và tổng hợp `check-additional`, trình xác minh tổng hợp kiểm thử Node, kiểm tra tài liệu, Skills Python, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub lưu trữ để ma trận Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Linux Node, các shard kiểm thử Plugin đóng gói, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (nhạy CPU đến mức 8 vCPU tốn nhiều hơn phần tiết kiệm được); các build Docker install-smoke (thời gian xếp hàng 32-vCPU tốn nhiều hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; các fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; các fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` là workflow hiệu năng sản phẩm/runtime. Nó chạy hằng ngày trên `main` và có thể được điều phối thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Workflow cài đặt OCM từ một bản phát hành được ghim và Kova từ input `kova_ref` được ghim, rồi chạy ba lane:

- `mock-provider`: Các kịch bản chẩn đoán Kova trên runtime build cục bộ với xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: Profiling CPU/heap/trace cho các điểm nóng khi khởi động, Gateway và lượt tác tử.
- `live-gpt54`: Một lượt tác tử OpenAI `openai/gpt-5.4` thật, được bỏ qua khi `OPENAI_API_KEY` không khả dụng.

Lane mock-provider cũng chạy các probe nguồn native của OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ trên các trường hợp khởi động mặc định, hook và 50-Plugin; các vòng hello `channel-chat-baseline` mock-OpenAI lặp lại; và các lệnh khởi động CLI trên Gateway đã boot. Tóm tắt Markdown của probe nguồn nằm tại `source/index.md` trong gói báo cáo, với JSON thô bên cạnh.

Mỗi lane tải artifact GitHub lên. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, bundles, `index.md` và artifact source-probe vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Con trỏ nhánh hiện tại được ghi dưới dạng `openclaw-performance/<ref>/latest-<lane>.json`.

## Xác thực phát hành đầy đủ

`Full Release Validation` là workflow ô bao phủ thủ công cho "chạy mọi thứ trước khi phát hành." Nó nhận một nhánh, tag hoặc SHA commit đầy đủ, điều phối workflow `CI` thủ công với target đó, điều phối `Plugin Prerelease` cho bằng chứng Plugin/gói/tĩnh/Docker chỉ dành cho phát hành, và điều phối `OpenClaw Release Checks` cho install smoke, package acceptance, các bộ kiểm thử đường dẫn phát hành Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix và các lane Telegram. Với `rerun_group=all` và `release_profile=full`, nó cũng chạy `NPM Telegram Beta E2E` trên artifact `release-package-under-test` từ release checks. Sau khi phát hành, truyền `npm_telegram_package_spec` để chạy lại cùng lane gói Telegram trên gói npm đã phát hành.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn, tên công việc workflow chính xác, khác biệt giữa các profile, artifact và
các handle chạy lại tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Điều phối nó
từ `release/YYYY.M.D` hoặc `main` sau khi tag phát hành tồn tại và sau khi
preflight npm OpenClaw đã thành công. Nó xác minh `pnpm plugins:sync:check`,
điều phối `Plugin NPM Release` cho tất cả các gói Plugin có thể publish, điều phối
`Plugin ClawHub Release` cho cùng SHA phát hành, và chỉ sau đó điều phối
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

Các ref điều phối workflow GitHub phải là nhánh hoặc tag, không phải SHA commit thô. Helper
đẩy một nhánh tạm thời `release-ci/<sha>-...` tại SHA target,
điều phối `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con
`headSha` khớp với target, và xóa nhánh tạm thời khi lần chạy hoàn tất. Trình xác minh ô bao phủ cũng thất bại nếu bất kỳ workflow con nào đã chạy ở một
SHA khác.

`release_profile` kiểm soát độ rộng live/provider được truyền vào release checks. Các
workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn
cố ý muốn ma trận provider/media tư vấn rộng.

- `minimum` giữ các lane OpenAI/core nhanh nhất và trọng yếu cho phát hành.
- `stable` thêm bộ provider/backend ổn định.
- `full` chạy ma trận provider/media tư vấn rộng.

Ô bao phủ ghi lại các id lần chạy con đã điều phối, và công việc cuối cùng `Verify full validation` kiểm tra lại kết luận hiện tại của các lần chạy con và thêm các bảng công việc chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại công việc xác minh cha để làm mới kết quả ô bao phủ và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho tiến trình con CI đầy đủ thông thường, `plugin-prerelease` chỉ cho tiến trình con phát hành trước của plugin, `release-checks` cho mọi tiến trình con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên workflow bao trùm. Điều này giữ cho việc chạy lại một hộp phát hành bị lỗi được giới hạn sau một bản sửa tập trung.

`OpenClaw Release Checks` dùng tham chiếu workflow tin cậy để phân giải tham chiếu đã chọn một lần thành tarball `release-package-under-test`, rồi truyền hiện vật đó cho cả workflow Docker đường dẫn phát hành live/E2E và shard chấp nhận gói. Điều đó giữ cho byte của gói nhất quán trên các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều tác vụ con.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
thay thế workflow bao trùm cũ hơn. Trình giám sát cha hủy mọi workflow con mà nó
đã dispatch khi tiến trình cha bị hủy, vì vậy xác thực main mới hơn
không phải chờ sau một lần chạy release-check cũ kéo dài hai giờ. Xác thực nhánh/tag
phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Các shard live và E2E

Tiến trình con live/E2E của phát hành giữ phạm vi bao phủ rộng của `pnpm test:live` native, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một tác vụ nối tiếp:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- các tác vụ `native-live-src-gateway-profiles` được lọc theo provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- các shard media audio/video được tách riêng và các shard music được lọc theo provider

Điều đó giữ cùng phạm vi bao phủ tệp trong khi giúp các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lượt.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các tác vụ media chỉ xác minh các binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên runner Blacksmith thông thường — tác vụ container là nơi không phù hợp để khởi chạy các kiểm thử Docker lồng nhau.

Các shard model/backend live dựa trên Docker dùng một image dùng chung riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit được chọn. Workflow phát hành live build và push image đó một lần, rồi các shard model live Docker, Gateway được chia shard theo provider, backend CLI, bind ACP, và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Docker Gateway mang giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout của tác vụ workflow để một container bị kẹt hoặc đường dẫn dọn dẹp lỗi nhanh thay vì tiêu thụ toàn bộ ngân sách release-check. Nếu các shard đó tự build lại target Docker nguồn đầy đủ một cách độc lập, lần chạy phát hành đang bị cấu hình sai và sẽ lãng phí thời gian chạy thực tế vào các bản build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, trong khi chấp nhận gói xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng chạy sau khi cài đặt hoặc cập nhật.

### Tác vụ

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng hiện vật `package-under-test`, và in nguồn, tham chiếu workflow, tham chiếu gói, phiên bản, SHA-256, và profile trong tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải hiện vật đó xuống, xác thực inventory tarball, chuẩn bị image Docker theo digest gói khi cần, và chạy các lane Docker đã chọn trên gói đó thay vì đóng gói checkout workflow. Khi một profile chọn nhiều `docker_lanes` được nhắm mục tiêu, workflow tái sử dụng chuẩn bị gói và các image dùng chung một lần, rồi fan out các lane đó thành các tác vụ Docker được nhắm mục tiêu chạy song song với hiện vật riêng.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng hiện vật `package-under-test` khi Package Acceptance đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã phát hành.
4. `summary` làm workflow thất bại nếu phân giải gói, chấp nhận Docker, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng mục này cho chấp nhận bản phát hành trước/ổn định đã phát hành.
- `source=ref` đóng gói một nhánh, tag, hoặc SHA commit đầy đủ `package_ref` tin cậy. Trình phân giải fetch các nhánh/tag OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử nhánh kho lưu trữ hoặc một tag phát hành, cài đặt dependency trong một worktree tách rời, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; `package_sha256` là bắt buộc.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các hiện vật được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness tin cậy chạy kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các phần Docker đường dẫn phát hành đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng phạm vi bao phủ plugin offline để xác thực gói đã phát hành không bị phụ thuộc vào tính sẵn sàng live của ClawHub. Lane Telegram tùy chọn tái sử dụng hiện vật `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn spec npm đã phát hành được giữ cho các dispatch độc lập.

Để xem chính sách kiểm thử dành riêng cho cập nhật và plugin, bao gồm các lệnh cục bộ,
lane Docker, input Package Acceptance, mặc định phát hành, và phân loại lỗi,
xem [Kiểm thử cập nhật và plugin](/vi/help/testing-updates-plugins).

Release checks gọi Package Acceptance với `source=artifact`, hiện vật gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng di chuyển gói, cập nhật, dọn dẹp dependency plugin cũ, sửa cài đặt plugin đã cấu hình, plugin offline, plugin-update, và Telegram trên cùng tarball gói đã phân giải. Đặt `package_acceptance_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks để chạy cùng ma trận đó với một gói npm đã phát hành thay vì hiện vật được build theo SHA. Cross-OS release checks vẫn bao phủ onboarding, trình cài đặt, và hành vi nền tảng theo OS; xác thực sản phẩm package/update nên bắt đầu bằng Package Acceptance. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã phát hành cho mỗi lần chạy. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã phát hành dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên baseline đó. Đặt `published_upgrade_survivor_baselines=all-since-2026.4.23` để mở rộng Full Release CI trên mọi bản phát hành npm ổn định từ `2026.4.23` đến `latest`; `release-history` vẫn khả dụng cho việc lấy mẫu thủ công rộng hơn với mốc ngày cũ hơn. Đặt `published_upgrade_survivor_scenarios=reported-issues` để mở rộng cùng các baseline đó trên các fixture theo dạng issue cho cấu hình Feishu, các tệp bootstrap/persona được giữ lại, cài đặt plugin OpenClaw đã cấu hình, đường dẫn log dấu ngã, và các gốc dependency plugin legacy cũ. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã phát hành toàn diện, không phải phạm vi CI Full Release thông thường. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã phát hành cấu hình baseline bằng công thức lệnh `openclaw config set` được nhúng sẵn, ghi lại các bước công thức trong `summary.json`, và dò `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane mới của gói Windows và trình cài đặt cũng xác minh rằng một gói đã cài đặt có thể import một override browser-control từ một đường dẫn Windows tuyệt đối thô. Smoke agent-turn cross-OS OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.4`, để bằng chứng cài đặt và Gateway vẫn dùng model kiểm thử GPT-5 trong khi tránh các mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Package Acceptance có các cửa sổ tương thích legacy được giới hạn cho các gói đã phát hành. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các tệp bị bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase duy trì `gateway install --wrapper` khi gói không expose flag đó;
- `update-channel-switch` có thể loại bỏ `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả được dẫn xuất từ tarball và có thể ghi log `update.channel` được duy trì bị thiếu;
- các smoke plugin có thể đọc vị trí install-record legacy hoặc chấp nhận thiếu duy trì install-record marketplace;
- `plugin-update` có thể cho phép di chuyển metadata cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu metadata build cục bộ đã được phát hành. Các gói sau đó phải đáp ứng các hợp đồng hiện đại; cùng các điều kiện sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy chấp nhận gói bị lỗi, hãy bắt đầu từ phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời gian từng pha và lệnh chạy lại. Ưu tiên chạy lại profile gói bị lỗi hoặc các lane Docker chính xác thay vì chạy lại toàn bộ xác thực phát hành.

## Smoke cài đặt

Workflow `Install Smoke` riêng biệt tái sử dụng cùng script phạm vi thông qua job `preflight` riêng của nó. Nó chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường nhanh** chạy cho các pull request chạm đến bề mặt Docker/gói, thay đổi gói/manifest Plugin được đóng gói kèm, hoặc các bề mặt Plugin/lõi kênh/Gateway/Plugin SDK mà các job Docker smoke thực thi. Các thay đổi Plugin được đóng gói kèm chỉ ở mã nguồn, chỉnh sửa chỉ liên quan đến kiểm thử và chỉnh sửa chỉ liên quan đến tài liệu không giữ trước worker Docker. Đường nhanh xây dựng image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa agent trong workspace dùng chung, chạy e2e Gateway-network trong container, xác minh một đối số build cho extension được đóng gói kèm, và chạy profile Docker Plugin được đóng gói kèm có giới hạn dưới thời gian chờ lệnh tổng hợp 240 giây (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update của trình cài đặt cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call, và các pull request thực sự chạm đến bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image smoke Dockerfile gốc GHCR theo SHA mục tiêu, sau đó chạy cài đặt gói QR, smoke Dockerfile gốc/Gateway, smoke trình cài đặt/cập nhật, và Docker E2E Plugin được đóng gói kèm đường nhanh dưới dạng các job riêng để công việc trình cài đặt không phải chờ sau các smoke image gốc.

Các lần push lên `main` (bao gồm cả merge commit) không bắt buộc chạy đường đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một lần push, workflow giữ Docker smoke đường nhanh và để smoke cài đặt đầy đủ cho hằng đêm hoặc xác thực phát hành.

Smoke nhà cung cấp image cài đặt toàn cục Bun chậm được kiểm soát riêng bởi `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn tham gia, nhưng các pull request và các lần push lên `main` thì không. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng sẵn một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, và xây dựng hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane trình cài đặt/cập nhật/phụ thuộc Plugin;
- một image chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn image theo từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, sau đó chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số tinh chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot pool chính cho các lane thông thường.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot pool đuôi nhạy cảm với nhà cung cấp.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để nhà cung cấp không bị throttle.                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều dịch vụ đồng thời.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ giãn cách giữa các lần khởi động lane để tránh bão tạo Docker daemon; đặt `0` để không giãn cách. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Thời gian chờ dự phòng theo từng lane (120 phút); các lane live/đuôi được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in kế hoạch của bộ lập lịch mà không chạy lane.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agent có thể tái hiện một lane bị lỗi. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể bắt đầu từ một pool trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Tổng hợp cục bộ chạy preflight Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời gian lane để sắp xếp lâu nhất trước, và mặc định dừng lập lịch các lane trong pool mới sau lỗi đầu tiên.

### Workflow live/E2E có thể tái sử dụng

Workflow live/E2E có thể tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` để biết phạm vi gói, loại image, image live, lane và thông tin xác thực nào là bắt buộc. `scripts/docker-e2e.mjs` sau đó chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại, hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; xây dựng và đẩy các image Docker E2E bare/functional GHCR được gắn thẻ theo digest gói thông qua bộ nhớ đệm lớp Docker của Blacksmith khi kế hoạch cần các lane đã cài gói; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các image theo digest gói hiện có thay vì xây dựng lại. Các lần pull image Docker được thử lại với thời gian chờ giới hạn 180 giây cho mỗi lần thử để luồng registry/cache bị kẹt được thử lại nhanh thay vì tiêu thụ phần lớn đường tới hạn của CI.

### Chunk đường phát hành

Phạm vi Docker phát hành chạy các job được chia chunk nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi chunk chỉ pull loại image nó cần và thực thi nhiều lane thông qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các chunk Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và từ `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là alias tổng hợp Plugin/runtime. Alias lane `install-e2e` vẫn là alias chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt nhà cung cấp.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ chunk độc lập `openwebui` cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật kênh được đóng gói kèm thử lại một lần đối với lỗi mạng npm tạm thời.

Mỗi chunk tải lên `.artifacts/docker-tests/` với nhật ký lane, thời gian, `summary.json`, `failures.json`, thời gian từng pha, JSON kế hoạch bộ lập lịch, bảng lane chậm và lệnh chạy lại theo từng lane. Input `docker_lanes` của workflow chạy các lane được chọn trên các image đã chuẩn bị thay vì các job chunk, giúp việc gỡ lỗi lane thất bại được giới hạn trong một job Docker nhắm mục tiêu và chuẩn bị, tải xuống hoặc tái sử dụng artifact gói cho lần chạy đó; nếu một lane được chọn là lane Docker live, job nhắm mục tiêu sẽ xây dựng image live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name`, và input image đã chuẩn bị khi các giá trị đó tồn tại, để một lane bị lỗi có thể tái sử dụng đúng gói và image từ lần chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Tiền phát hành Plugin

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, các lần push lên `main`, và các dispatch CI thủ công độc lập giữ suite đó ở trạng thái tắt. Nó cân bằng các kiểm thử Plugin được đóng gói kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các lô Plugin nặng về import không tạo thêm job CI. Đường tiền phát hành Docker chỉ dành cho phát hành gom nhóm các lane Docker nhắm mục tiêu thành các nhóm nhỏ để tránh giữ hàng chục runner cho những job kéo dài một đến ba phút.

## QA Lab

QA Lab có các lane CI chuyên dụng bên ngoài workflow chính có phạm vi thông minh. Tính tương đồng agentic được lồng dưới các bộ chạy QA và phát hành rộng, không phải một workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi tính tương đồng cần đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó fan out lane tương đồng mock, lane Matrix live, và các lane Telegram và Discord live dưới dạng các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các kiểm tra phát hành chạy các lane vận chuyển Matrix và Telegram live với nhà cung cấp mock xác định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được cô lập khỏi độ trễ model live và quá trình khởi động Plugin nhà cung cấp thông thường. Gateway vận chuyển live tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; kết nối nhà cung cấp được bao phủ bởi các bộ live model, nhà cung cấp native và nhà cung cấp Docker riêng.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab quan trọng cho phát hành trước khi phê duyệt phát hành; cổng QA parity của nó chạy các pack candidate và baseline dưới dạng các job lane song song, sau đó tải cả hai artifact xuống một job báo cáo nhỏ cho so sánh tương đồng cuối cùng.

Đối với PR thông thường, hãy theo bằng chứng CI/kiểm tra có phạm vi thay vì xem parity là một trạng thái bắt buộc.

## CodeQL

Quy trình làm việc `CodeQL` được thiết kế có chủ ý như một trình quét bảo mật bước đầu có phạm vi hẹp, không phải đợt quét toàn bộ kho lưu trữ. Các lượt chạy hằng ngày, thủ công và bảo vệ yêu cầu kéo không phải bản nháp sẽ quét mã quy trình làm việc Actions cùng các bề mặt JavaScript/TypeScript có rủi ro cao nhất bằng các truy vấn bảo mật có độ tin cậy cao, được lọc theo `security-severity` cao/nghiêm trọng.

Cơ chế bảo vệ yêu cầu kéo vẫn nhẹ: nó chỉ khởi động cho các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật có độ tin cậy cao như quy trình làm việc theo lịch. Android và macOS CodeQL không nằm trong mặc định cho yêu cầu kéo.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron, và đường cơ sở Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Các hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, Gateway, Plugin SDK, secrets, các điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt SSRF lõi, phân tích IP, bảo vệ mạng, web-fetch, và chính sách SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, helper thực thi tiến trình, phân phối đi ra, và cổng thực thi công cụ của tác nhân                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, nạp nguồn, và hợp đồng gói Plugin SDK |

### Phân đoạn bảo mật theo nền tảng

- `CodeQL Android Critical Security` — phân đoạn bảo mật Android theo lịch. Xây dựng ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — phân đoạn bảo mật macOS hằng tuần/thủ công. Xây dựng ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build dependency khỏi SARIF được tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn thời gian chạy ngay cả khi sạch.

### Danh mục chất lượng nghiêm trọng

`CodeQL Critical Quality` là phân đoạn tương ứng không thuộc bảo mật. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không thuộc bảo mật, mức lỗi, trên các bề mặt hẹp có giá trị cao trên runner Blacksmith Linux nhỏ hơn. Cơ chế bảo vệ yêu cầu kéo của nó cố ý nhỏ hơn profile theo lịch: các yêu cầu kéo không phải bản nháp chỉ chạy các phân đoạn tương ứng `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` cho các thay đổi trong mã thực thi lệnh/mô hình/công cụ của tác nhân và phân phối phản hồi, schema config/migration/IO, auth/secrets/sandbox/security, runtime kênh lõi và Plugin kênh đi kèm, protocol/server-method của Gateway, runtime bộ nhớ/SDK glue, MCP/process/phân phối đi ra, runtime provider/danh mục mô hình, chẩn đoán phiên/hàng đợi phân phối, loader Plugin, Plugin SDK/hợp đồng gói, hoặc runtime phản hồi Plugin SDK. Các thay đổi config CodeQL và quy trình làm việc chất lượng sẽ chạy cả mười hai phân đoạn chất lượng cho yêu cầu kéo.

Dispatch thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các profile hẹp là các hook giảng dạy/lặp lại để chạy riêng một phân đoạn chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật auth, secrets, sandbox, Cron, và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Schema config, migration, chuẩn hóa, và hợp đồng IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema protocol Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đi kèm                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, dispatch mô hình/provider, dispatch và hàng đợi tự động trả lời, và hợp đồng runtime control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, helper giám sát tiến trình, và hợp đồng phân phối đi ra                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, glue kích hoạt runtime bộ nhớ, và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi phản hồi, hàng đợi phân phối phiên, helper liên kết/phân phối phiên đi ra, bề mặt gói sự kiện/log chẩn đoán, và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Dispatch phản hồi đến của Plugin SDK, helper payload/chunking/runtime phản hồi, tùy chọn phản hồi kênh, hàng đợi phân phối, và helper liên kết phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, auth và discovery của provider, đăng ký runtime provider, mặc định/danh mục provider, và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI điều khiển, lưu trữ cục bộ, luồng điều khiển Gateway, và hợp đồng runtime control-plane tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime fetch/search web lõi, IO media, hiểu media, tạo ảnh, và tạo media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, bề mặt công khai, và hợp đồng entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và helper hợp đồng gói Plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, tắt, hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python, và Plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc được phân đoạn sau khi các profile hẹp có thời gian chạy và tín hiệu ổn định.

## Quy trình làm việc bảo trì

### Docs Agent

Quy trình làm việc `Docs Agent` là một làn bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được hợp nhất. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và dispatch thủ công có thể chạy trực tiếp. Các lời gọi workflow-run sẽ bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ vừa qua. Khi chạy, nó xem xét phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lượt chạy hằng giờ có thể bao phủ tất cả thay đổi trên main được tích lũy từ lần kiểm tra tài liệu trước.

### Test Performance Agent

Quy trình làm việc `Test Performance Agent` là một làn bảo trì Codex theo sự kiện cho các kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó sẽ bỏ qua nếu một lời gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày đó. Làn này xây dựng một báo cáo hiệu năng Vitest được nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ nguyên độ bao phủ thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử vượt qua ở baseline. Nếu baseline có kiểm thử thất bại, Codex chỉ được sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau agent phải vượt qua trước khi bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi push của bot được đưa lên, làn này rebase bản vá đã được xác thực, chạy lại `pnpm check:changed`, và thử push lại; các bản vá cũ có xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub-hosted để hành động Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### Yêu cầu kéo trùng lặp sau khi hợp nhất

Quy trình làm việc `Duplicate PRs After Merge` là một quy trình làm việc thủ công cho maintainer để dọn dẹp trùng lặp sau khi hợp nhất. Mặc định là dry-run và chỉ đóng các yêu cầu kéo được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng yêu cầu kéo đã landed đã được hợp nhất và mỗi bản trùng lặp có hoặc một issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- các thay đổi production lõi chạy typecheck core prod và core test cộng với lint/guard lõi;
- các thay đổi chỉ dành cho kiểm thử lõi chỉ chạy typecheck core test cộng với lint lõi;
- các thay đổi production extension chạy typecheck extension prod và extension test cộng với lint extension;
- các thay đổi chỉ dành cho kiểm thử extension chạy typecheck extension test cộng với lint extension;
- các thay đổi Plugin SDK công khai hoặc hợp đồng Plugin mở rộng sang typecheck extension vì các extension phụ thuộc vào các hợp đồng lõi đó (các đợt quét extension Vitest vẫn là công việc kiểm thử rõ ràng);
- các lần tăng phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/config/root-dependency có mục tiêu;
- các thay đổi root/config không xác định sẽ fail safe sang tất cả các làn kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý rẻ hơn `check:changed`: các chỉnh sửa kiểm thử trực tiếp chạy chính chúng, chỉnh sửa nguồn ưu tiên ánh xạ rõ ràng, sau đó là kiểm thử sibling và các phần phụ thuộc trong import-graph. Config phân phối group-room dùng chung là một trong các ánh xạ rõ ràng: các thay đổi đối với config visible-reply của nhóm, chế độ phân phối phản hồi nguồn, hoặc prompt hệ thống message-tool sẽ đi qua các kiểm thử phản hồi lõi cộng với các hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung thất bại trước lần push yêu cầu kéo đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập ánh xạ rẻ không phải là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ gốc repo và ưu tiên một máy mới đã được khởi động sẵn cho xác minh diện rộng. Trước khi dành một cổng kiểm tra chậm cho một máy đã được tái sử dụng, đã hết hạn, hoặc vừa báo cáo một lần đồng bộ lớn bất thường, hãy chạy `pnpm testbox:sanity` bên trong máy đó trước.

Kiểm tra sanity sẽ thất bại nhanh khi các tệp gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 lượt xóa đã được theo dõi. Điều đó thường có nghĩa là trạng thái đồng bộ từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng máy đó và khởi động sẵn một máy mới thay vì gỡ lỗi lỗi kiểm thử sản phẩm. Với các PR cố ý xóa số lượng lớn, hãy đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng kết thúc một lệnh gọi Blacksmith CLI cục bộ nếu lệnh đó ở lại giai đoạn đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt cơ chế bảo vệ đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là đường dẫn máy từ xa thứ hai do repo sở hữu để xác minh Linux khi Blacksmith không khả dụng hoặc khi nên ưu tiên năng lực đám mây do dự án sở hữu. Khởi động sẵn một máy, hydrate máy đó thông qua quy trình công việc của dự án, rồi chạy lệnh qua Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` sở hữu các mặc định về provider, đồng bộ và hydrate GitHub Actions. Tệp này loại trừ `.git` cục bộ để bản checkout Actions đã hydrate giữ siêu dữ liệu Git từ xa riêng của nó thay vì đồng bộ các remote và kho đối tượng cục bộ của maintainer, đồng thời loại trừ các artifact runtime/build cục bộ không bao giờ nên được chuyển. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không chứa bí mật mà các lệnh `crabbox run --id <cbx_id>` sau này sẽ source.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
