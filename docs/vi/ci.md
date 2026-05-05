---
read_when:
    - Bạn cần hiểu vì sao một công việc CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions không thành công
    - Bạn đang điều phối một lần chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi việc điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị tác vụ CI, các cổng theo phạm vi, các nhóm bao trùm phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-05T01:44:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16771940889d1fa944a5bfafe1152a033d96625595a2d89ff2cedbd3022cee66
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần push vào `main` và mọi pull request. Job `preflight` phân loại diff và tắt các lane tốn kém khi chỉ các khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho release candidate và xác thực diện rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho bản phát hành nằm trong workflow [`Plugin Prerelease`](#plugin-prerelease) riêng và chỉ chạy từ [`Full Release Validation`](#full-release-validation) hoặc một lần dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                              | Mục đích                                                                                                   | Khi chạy                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ ở tài liệu, phạm vi đã thay đổi, extension đã thay đổi, và xây dựng manifest CI     | Luôn chạy trên push và PR không phải draft |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra workflow qua `zizmor`                                                  | Luôn chạy trên push và PR không phải draft |
| `security-dependency-audit`      | Kiểm tra lockfile production không cần dependency đối chiếu với advisory npm                               | Luôn chạy trên push và PR không phải draft |
| `security-fast`                  | Kết quả tổng hợp bắt buộc cho các job bảo mật nhanh                                                        | Luôn chạy trên push và PR không phải draft |
| `check-dependencies`             | Lượt kiểm tra chỉ dependency production bằng Knip cùng guard allowlist tệp không dùng                      | Thay đổi liên quan đến Node          |
| `build-artifacts`                | Xây dựng `dist/`, Control UI, kiểm tra artifact đã build, và artifact downstream có thể tái sử dụng        | Thay đổi liên quan đến Node          |
| `checks-fast-core`               | Các lane tính đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                      | Thay đổi liên quan đến Node          |
| `checks-fast-contracts-channels` | Kiểm tra channel contract được chia shard với kết quả kiểm tra tổng hợp ổn định                           | Thay đổi liên quan đến Node          |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ lane channel, bundled, contract, và extension                        | Thay đổi liên quan đến Node          |
| `check`                          | Tương đương cổng local chính được chia shard: kiểu production, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt | Thay đổi liên quan đến Node      |
| `check-additional`               | Kiến trúc, drift boundary/prompt được chia shard, guard extension, ranh giới package, và gateway watch     | Thay đổi liên quan đến Node          |
| `build-smoke`                    | Kiểm thử smoke CLI đã build và smoke bộ nhớ khởi động                                                      | Thay đổi liên quan đến Node          |
| `checks`                         | Trình xác minh cho kiểm thử channel bằng artifact đã build                                                 | Thay đổi liên quan đến Node          |
| `checks-node-compat-node22`      | Lane build và smoke tương thích Node 22                                                                    | Dispatch CI thủ công cho bản phát hành |
| `check-docs`                     | Kiểm tra định dạng tài liệu, lint, và liên kết hỏng                                                        | Tài liệu thay đổi                    |
| `skills-python`                  | Ruff + pytest cho Skills có backend Python                                                                 | Thay đổi liên quan đến Skill Python  |
| `checks-windows`                 | Kiểm thử process/path dành riêng cho Windows cùng hồi quy import specifier runtime dùng chung              | Thay đổi liên quan đến Windows       |
| `macos-node`                     | Lane kiểm thử TypeScript trên macOS dùng artifact đã build chung                                           | Thay đổi liên quan đến macOS         |
| `macos-swift`                    | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                          | Thay đổi liên quan đến macOS         |
| `android`                        | Kiểm thử unit Android cho cả hai flavor cùng một lần build APK debug                                       | Thay đổi liên quan đến Android       |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm hằng ngày bằng Codex sau hoạt động đáng tin cậy                                   | CI main thành công hoặc dispatch thủ công |
| `openclaw-performance`           | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với lane mock-provider, deep-profile, và GPT 5.4 live | Theo lịch và dispatch thủ công      |

## Thứ tự fail-fast

1. `preflight` quyết định lane nào thực sự tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lên các lane Linux nhanh để downstream consumer có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn mở rộng sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một push mới hơn xuất hiện trên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` nên chúng vẫn báo cáo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa concurrency CI tự động được đánh phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang tiến hành.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử unit trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cùng lint workflow, nhưng bản thân chúng không ép buộc build native Windows, Android, hoặc macOS; các lane nền tảng đó vẫn chỉ được kích hoạt theo thay đổi nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, chỉnh sửa fixture core-test rẻ đã chọn, và chỉnh sửa helper/test-routing plugin contract hẹp** dùng đường manifest nhanh chỉ Node: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường này bỏ qua artifact build, tương thích Node 22, channel contract, toàn bộ shard core, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp kiểm tra.
- **Kiểm tra Node trên Windows** được giới hạn ở wrapper process/path dành riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package, và các bề mặt workflow CI thực thi lane đó; thay đổi nguồn, Plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn chạy trên các lane Node Linux.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không giữ runner quá mức: channel contract chạy dưới dạng ba shard có trọng số, lane core unit fast/support chạy riêng, hạ tầng runtime core được tách giữa shard state và process/config, auto-reply chạy dưới dạng worker cân bằng (với subtree reply tách thành shard agent-runner, dispatch, và commands/state-routing), và cấu hình gateway/server agentic được tách qua các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã build. Các kiểm thử trình duyệt, QA, media, và Plugin miscellaneous diện rộng dùng cấu hình Vitest chuyên dụng thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi mục thời gian bằng tên shard CI, nên `.artifacts/vitest-shard-timings.json` có thể phân biệt một cấu hình nguyên vẹn với một shard đã lọc. `check-additional` giữ công việc compile/canary ranh giới package cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; danh sách guard boundary được chia sọc qua bốn shard ma trận, mỗi shard chạy đồng thời các guard độc lập đã chọn và in thời gian từng kiểm tra, bao gồm `pnpm prompt:snapshots:check` để drift prompt đường tốt runtime Codex được ghim vào PR đã gây ra nó. Gateway watch, kiểm thử channel, và shard support-boundary core chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, sau đó build APK debug Play. Flavor third-party không có source set hoặc manifest riêng; lane kiểm thử unit của nó vẫn biên dịch flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh một job đóng gói APK debug trùng lặp trên mọi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt kiểm tra chỉ dependency production bằng Knip được ghim với phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, thao tác này so sánh phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi PR thêm một tệp không dùng mới chưa được rà soát hoặc để lại một mục allowlist lỗi thời, trong khi vẫn giữ các bề mặt Plugin động, generated, build, live-test, và package bridge có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía mục tiêu từ hoạt động repository OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho yêu cầu review cấp commit trên các push vào `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, repository, số mục, URL, tiêu đề, trạng thái, và đoạn trích ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ webhook body. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, workflow này đăng sự kiện đã chuẩn hóa tới hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải mặc định chuyển giao. Agent ClawSweeper nhận đích Discord trong prompt của nó và chỉ nên đăng tới `#clawsweeper` khi sự kiện bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về vận hành. Các thao tác mở, chỉnh sửa, nhiễu bot, nhiễu webhook trùng lặp, và lưu lượng review bình thường nên trả về `NO_REPLY`.

Hãy xem tiêu đề, bình luận, body, văn bản review, tên nhánh, và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy trong toàn bộ đường này. Chúng là đầu vào cho tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Dispatch thủ công

Các lần kích hoạt CI thủ công chạy cùng đồ thị công việc như CI thông thường nhưng buộc bật mọi lane có phạm vi không phải Android: các shard Linux Node, các shard plugin đi kèm, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Python skills, Windows, macOS và i18n Control UI. Các lần kích hoạt CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Các kiểm tra tĩnh prerelease plugin, shard chỉ dành cho phát hành `agentic-plugins`, sweep hàng loạt extension đầy đủ và các lane Docker prerelease plugin bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` kích hoạt workflow `Plugin Prerelease` riêng với cổng release-validation được bật.

Các lần chạy thủ công dùng một nhóm đồng thời duy nhất để một bộ đầy đủ ứng viên phát hành không bị hủy bởi một lần chạy push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép một caller tin cậy chạy đồ thị đó trên một branch, tag hoặc commit SHA đầy đủ trong khi dùng tệp workflow từ dispatch ref đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Trình chạy

| Trình chạy                       | Công việc                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các công việc bảo mật nhanh và aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), các kiểm tra giao thức/hợp đồng/plugin đi kèm nhanh, các kiểm tra hợp đồng kênh dạng shard, các shard `check` ngoại trừ lint, các shard và aggregate `check-additional`, trình xác minh aggregate kiểm thử Node, kiểm tra tài liệu, Python skills, workflow-sanity, labeler, auto-response; install-smoke preflight cũng dùng Ubuntu do GitHub lưu trữ để matrix Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` và `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Linux Node, các shard kiểm thử plugin đi kèm, `android`                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (nhạy CPU đến mức 8 vCPU tốn nhiều hơn phần tiết kiệm được); các bản dựng Docker install-smoke (thời gian xếp hàng 32-vCPU tốn nhiều hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; các fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; các fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |

## Các lệnh tương đương cục bộ

```bash
pnpm changed:lanes                            # kiểm tra bộ phân loại changed-lane cục bộ cho origin/main...HEAD
pnpm check:changed                            # cổng kiểm tra cục bộ thông minh: typecheck/lint/guard đã thay đổi theo lane ranh giới
pnpm check                                    # cổng cục bộ nhanh: prod tsgo + lint dạng shard + guard nhanh song song
pnpm check:test-types
pnpm check:timed                              # cùng cổng với thời gian theo từng giai đoạn
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # kiểm thử vitest
pnpm test:changed                             # các mục tiêu Vitest changed thông minh, chi phí thấp
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # định dạng tài liệu + lint + liên kết hỏng
pnpm build                                    # build dist khi các lane artifact/build-smoke của CI quan trọng
pnpm ci:timings                               # tóm tắt lần chạy CI push origin/main mới nhất
pnpm ci:timings:recent                        # so sánh các lần chạy CI main thành công gần đây
node scripts/ci-run-timings.mjs <run-id>      # tóm tắt wall time, queue time và các công việc chậm nhất
node scripts/ci-run-timings.mjs --latest-main # bỏ qua nhiễu issue/comment và chọn CI push origin/main
node scripts/ci-run-timings.mjs --recent 10   # so sánh các lần chạy CI main thành công gần đây
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

Kích hoạt thủ công thường benchmark workflow ref. Đặt `target_ref` để benchmark một release tag hoặc branch khác bằng implementation workflow hiện tại. Các đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được khóa theo ref đã kiểm thử, và mỗi `index.md` ghi lại ref/SHA đã kiểm thử, workflow ref/SHA, Kova ref, profile, chế độ xác thực lane, model, số lần lặp và bộ lọc kịch bản.

Workflow cài đặt OCM từ một bản phát hành được pin và Kova từ `openclaw/Kova` tại input `kova_ref` đã pin, rồi chạy ba lane:

- `mock-provider`: các kịch bản chẩn đoán Kova trên runtime build cục bộ với xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: profiling CPU/heap/trace cho các hotspot startup, Gateway và agent-turn.
- `live-gpt54`: một lượt agent OpenAI `openai/gpt-5.4` thật, bị bỏ qua khi `OPENAI_API_KEY` không có sẵn.

Lane mock-provider cũng chạy các probe source gốc OpenClaw sau pass Kova: thời gian boot Gateway và bộ nhớ trên các trường hợp startup mặc định, hook và 50-plugin; các vòng lặp hello `channel-chat-baseline` mock-OpenAI lặp lại; và các lệnh startup CLI trên Gateway đã boot. Tóm tắt Markdown của probe source nằm tại `source/index.md` trong gói báo cáo, với JSON thô đặt bên cạnh.

Mỗi lane tải artifact lên GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các bundle, `index.md` và artifact source-probe vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ tested-ref hiện tại được ghi dưới dạng `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực phát hành đầy đủ

`Full Release Validation` là workflow umbrella thủ công cho “chạy mọi thứ trước khi phát hành.” Nó nhận một branch, tag hoặc commit SHA đầy đủ, kích hoạt workflow `CI` thủ công với target đó, kích hoạt `Plugin Prerelease` cho bằng chứng plugin/package/static/Docker chỉ dành cho phát hành, và kích hoạt `OpenClaw Release Checks` cho install smoke, package acceptance, kiểm tra package liên OS, tương đồng QA Lab, Matrix và các lane Telegram. Các lần chạy stable/default giữ phạm vi bao phủ live/E2E đầy đủ và đường dẫn phát hành Docker phía sau `run_release_soak=true`; `release_profile=full` buộc bật phạm vi soak đó để xác thực advisory rộng vẫn giữ phạm vi rộng. Với `rerun_group=all` và `release_profile=full`, nó cũng chạy `NPM Telegram Beta E2E` với artifact `release-package-under-test` từ release checks. Sau khi xuất bản, truyền `npm_telegram_package_spec` để chạy lại cùng lane package Telegram với package npm đã xuất bản.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
matrix giai đoạn, tên công việc workflow chính xác, khác biệt giữa các profile, artifact và
các handle chạy lại có trọng tâm.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Kích hoạt nó
từ `release/YYYY.M.D` hoặc `main` sau khi release tag tồn tại và sau khi
OpenClaw npm preflight đã thành công. Nó xác minh `pnpm plugins:sync:check`,
kích hoạt `Plugin NPM Release` cho mọi package plugin có thể xuất bản, kích hoạt
`Plugin ClawHub Release` cho cùng release SHA, và chỉ sau đó kích hoạt
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

Các ref kích hoạt workflow GitHub phải là branch hoặc tag, không phải commit SHA thô. Helper
push một branch tạm thời `release-ci/<sha>-...` tại target SHA,
kích hoạt `Full Release Validation` từ ref đã pin đó, xác minh mọi workflow con
`headSha` khớp với target, và xóa branch tạm thời khi lần chạy hoàn tất.
Trình xác minh umbrella cũng thất bại nếu bất kỳ workflow con nào chạy ở
SHA khác.

`release_profile` kiểm soát phạm vi live/provider được truyền vào các bước kiểm tra bản phát hành. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn chủ ý muốn ma trận provider/media khuyến nghị rộng. `run_release_soak` kiểm soát việc các bước kiểm tra bản phát hành stable/mặc định có chạy soak exhaustive live/E2E và Docker release-path hay không; `full` buộc bật soak.

- `minimum` giữ các lane OpenAI/core quan trọng cho phát hành nhanh nhất.
- `stable` thêm tập provider/backend ổn định.
- `full` chạy ma trận provider/media khuyến nghị rộng.

Umbrella ghi lại các id lượt chạy con đã dispatch, và job `Verify full validation` cuối cùng kiểm tra lại các kết luận lượt chạy con hiện tại rồi thêm bảng job chậm nhất cho từng lượt chạy con. Nếu một workflow con được chạy lại và chuyển sang xanh, chỉ chạy lại job verifier cha để làm mới kết quả umbrella và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho child CI đầy đủ bình thường, `plugin-prerelease` chỉ cho child phát hành trước plugin, `release-checks` cho mọi child phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên umbrella. Điều này giữ cho việc chạy lại một release box bị lỗi được giới hạn sau một bản sửa tập trung. Với một lane cross-OS bị lỗi, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh cross-OS dài phát ra các dòng Heartbeat và tóm tắt packaged-upgrade bao gồm thời gian theo từng pha. Các lane kiểm tra bản phát hành QA là khuyến nghị, nên lỗi chỉ thuộc QA sẽ cảnh báo nhưng không chặn release-check verifier.

`OpenClaw Release Checks` dùng ref workflow tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho các kiểm tra cross-OS và Package Acceptance, cộng với workflow Docker live/E2E release-path khi chạy phạm vi soak. Điều đó giữ byte package nhất quán trên các release box và tránh đóng gói lại cùng ứng viên trong nhiều job con.

Các lượt chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
thay thế umbrella cũ hơn. Monitor cha hủy mọi workflow con mà nó
đã dispatch khi cha bị hủy, nên xác thực main mới hơn
không phải chờ sau một lượt chạy release-check lỗi thời kéo dài hai giờ. Xác thực nhánh/tag phát hành
và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Shard live và E2E

Child live/E2E phát hành giữ phạm vi `pnpm test:live` native rộng, nhưng chạy nó dưới dạng các shard có tên qua `scripts/test-live-shard.mjs` thay vì một job nối tiếp:

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
- các shard media audio/video tách riêng và các shard music được lọc theo provider

Điều đó giữ cùng phạm vi file trong khi giúp việc chạy lại và chẩn đoán lỗi provider live chậm dễ hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lượt chạy lại thủ công một lần.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên runner Blacksmith thông thường — job container không phải là nơi phù hợp để khởi chạy kiểm thử Docker lồng nhau.

Các shard model/backend live dựa trên Docker dùng một image dùng chung riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit được chọn. Workflow phát hành live build và push image đó một lần, rồi các shard Docker live model, Gateway phân shard theo provider, CLI backend, ACP bind, và Codex harness chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker có giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout job workflow để một container hoặc đường dọn dẹp bị treo sẽ thất bại nhanh thay vì tiêu thụ toàn bộ ngân sách release-check. Nếu các shard đó tự build lại Docker target nguồn đầy đủ, lượt chạy phát hành đang bị cấu hình sai và sẽ lãng phí thời gian thực trên các bản build image trùng lặp.

## Package Acceptance

Dùng `Package Acceptance` khi câu hỏi là "package OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, trong khi package acceptance xác thực một tarball duy nhất thông qua cùng Docker E2E harness mà người dùng dùng sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên package, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256, và profile trong tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory tarball, chuẩn bị image Docker package-digest khi cần, và chạy các lane Docker đã chọn trên package đó thay vì đóng gói checkout workflow. Khi một profile chọn nhiều `docker_lanes` có mục tiêu, workflow tái sử dụng chuẩn bị package và image dùng chung một lần, rồi fan out các lane đó thành các job Docker có mục tiêu chạy song song với artifact riêng.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một package; dispatch Telegram độc lập vẫn có thể cài đặt một npm spec đã phát hành.
4. `summary` làm workflow thất bại nếu phân giải package, Docker acceptance, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng mục này cho acceptance prerelease/stable đã phát hành.
- `source=ref` đóng gói một nhánh, tag, hoặc SHA commit đầy đủ `package_ref` tin cậy. Resolver fetch các nhánh/tag OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử nhánh repository hoặc một release tag, cài deps trong một worktree tách rời, và đóng gói nó bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness tin cậy chạy kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk Docker release-path đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng phạm vi plugin ngoại tuyến để xác thực package đã phát hành không bị phụ thuộc vào tính sẵn sàng live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn npm spec đã phát hành được giữ cho các dispatch độc lập.

Để biết chính sách chuyên dụng về kiểm thử cập nhật và plugin, bao gồm lệnh local,
lane Docker, input Package Acceptance, mặc định phát hành, và phân loại lỗi,
xem [Kiểm thử cập nhật và plugin](/vi/help/testing-updates-plugins).

Release checks gọi Package Acceptance với `source=artifact`, artifact package phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ proof migration package, cập nhật, dọn dẹp phụ thuộc plugin cũ, sửa cài đặt plugin đã cấu hình, plugin ngoại tuyến, cập nhật plugin, và Telegram trên cùng tarball package đã phân giải. Đặt `package_acceptance_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks để chạy cùng ma trận đó trên một package npm đã ship thay vì artifact được build từ SHA. Cross-OS release checks vẫn bao phủ onboarding, installer, và hành vi nền tảng đặc thù theo OS; xác thực sản phẩm package/update nên bắt đầu bằng Package Acceptance. Lane Docker `published-upgrade-survivor` xác thực một baseline package đã phát hành cho mỗi lượt chạy trong đường dẫn phát hành chặn. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã phát hành dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines=all-since-2026.4.23` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng trên mọi bản phát hành npm stable từ `2026.4.23` đến `latest` và các fixture dạng issue cho cấu hình Feishu, file bootstrap/persona được giữ lại, cài đặt plugin OpenClaw đã cấu hình, đường dẫn log tilde, và gốc phụ thuộc plugin legacy cũ. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã phát hành một cách exhaustive, không phải phạm vi CI Full Release bình thường. Các lượt chạy tổng hợp local có thể truyền package spec chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã phát hành cấu hình baseline bằng một công thức lệnh `openclaw config set` được baked, ghi các bước công thức trong `summary.json`, và thăm dò `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane Windows packaged và installer fresh cũng xác minh rằng một package đã cài đặt có thể import một browser-control override từ một đường dẫn Windows tuyệt đối thô. Smoke lượt agent cross-OS OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.4`, để proof cài đặt và Gateway vẫn ở trên model kiểm thử GPT-5 trong khi tránh các mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Package Acceptance có các cửa sổ tương thích legacy có giới hạn cho các package đã phát hành. Các package đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường tương thích:

- các entry QA private đã biết trong `dist/postinstall-inventory.json` có thể trỏ tới các file bị bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase persistence `gateway install --wrapper` khi package không expose flag đó;
- `update-channel-switch` có thể prune `pnpm.patchedDependencies` bị thiếu khỏi fake git fixture dẫn xuất từ tarball và có thể log `update.channel` persisted bị thiếu;
- các smoke plugin có thể đọc vị trí install-record legacy hoặc chấp nhận thiếu persistence install-record marketplace;
- `plugin-update` có thể cho phép migration metadata cấu hình trong khi vẫn yêu cầu install record và hành vi không cài lại giữ nguyên.

Package `2026.4.26` đã phát hành cũng có thể cảnh báo cho các file stamp metadata build local đã được ship. Các package sau đó phải thỏa mãn các hợp đồng hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy kiểm thử chấp nhận gói bị lỗi, hãy bắt đầu từ phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` cùng các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời gian từng pha và lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói bị lỗi hoặc đúng các lane Docker thay vì chạy lại toàn bộ kiểm định bản phát hành.

## Kiểm thử nhanh cài đặt

Workflow `Install Smoke` riêng biệt tái sử dụng cùng script phạm vi thông qua job `preflight` của chính nó. Workflow này chia phạm vi kiểm thử nhanh thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho các pull request chạm tới bề mặt Docker/gói, thay đổi gói/manifest plugin đóng gói sẵn, hoặc các bề mặt plugin/kênh/gateway/Plugin SDK lõi mà các job kiểm thử nhanh Docker thực thi. Các thay đổi plugin đóng gói sẵn chỉ ở mã nguồn, chỉnh sửa chỉ dành cho test và chỉnh sửa chỉ dành cho tài liệu không giữ trước Docker worker. Đường dẫn nhanh xây dựng ảnh Dockerfile gốc một lần, kiểm tra CLI, chạy kiểm thử nhanh CLI xóa agents trong workspace dùng chung, chạy e2e gateway-network trong container, xác minh build arg cho extension đóng gói sẵn và chạy hồ sơ Docker plugin đóng gói sẵn có giới hạn dưới thời gian chờ lệnh tổng hợp 240 giây (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update của bộ cài đặt cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call và pull request thật sự chạm tới bề mặt bộ cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một ảnh kiểm thử nhanh Dockerfile gốc GHCR theo target-SHA, rồi chạy cài đặt gói QR, kiểm thử nhanh Dockerfile/gateway gốc, kiểm thử nhanh bộ cài đặt/update và Docker E2E nhanh cho plugin đóng gói sẵn dưới dạng các job riêng để công việc bộ cài đặt không phải chờ sau các kiểm thử nhanh ảnh gốc.

Các lần push lên `main` (bao gồm merge commit) không ép buộc đường dẫn đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một lần push, workflow giữ kiểm thử nhanh Docker nhanh và để kiểm thử nhanh cài đặt đầy đủ cho kiểm định hằng đêm hoặc kiểm định bản phát hành.

Kiểm thử nhanh image-provider cài đặt Bun toàn cục chậm được kiểm soát riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành; các dispatch `Install Smoke` thủ công có thể chọn tham gia, nhưng pull request và các lần push lên `main` thì không. Các test Docker QR và bộ cài đặt giữ Dockerfile tập trung vào cài đặt của riêng chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng trước một ảnh live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm và xây dựng hai ảnh `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane bộ cài đặt/update/phụ thuộc plugin;
- một ảnh chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs` và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn ảnh theo lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số tinh chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot nhóm chính cho các lane thông thường.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot nhóm đuôi nhạy với provider.                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để provider không bị điều tiết.                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều dịch vụ đồng thời.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ trễ giữa các lần khởi động lane để tránh bão tạo từ Docker daemon; đặt `0` để không trễ.   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Thời gian chờ dự phòng cho từng lane (120 phút); các lane live/đuôi được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` in kế hoạch của bộ lập lịch mà không chạy lane.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua kiểm thử nhanh dọn dẹp để agents có thể tái hiện một lane bị lỗi. |

Một lane nặng hơn giới hạn hiệu lực của nó vẫn có thể bắt đầu từ một nhóm trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Các preflight tổng hợp cục bộ kiểm tra Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời gian lane để sắp xếp dài nhất trước và theo mặc định dừng lập lịch các lane trong nhóm mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` về gói, loại ảnh, ảnh live, lane và phạm vi thông tin xác thực cần thiết. `scripts/docker-e2e.mjs` sau đó chuyển kế hoạch đó thành output và phần tóm tắt của GitHub. Nó đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; xây dựng và đẩy các ảnh Docker E2E GHCR tối giản/chức năng được gắn tag theo digest gói thông qua cache lớp Docker của Blacksmith khi kế hoạch cần các lane đã cài đặt gói; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` đã cung cấp hoặc ảnh theo digest gói hiện có thay vì xây dựng lại. Các lần kéo ảnh Docker được thử lại với thời gian chờ giới hạn 180 giây cho mỗi lần thử để một luồng registry/cache bị kẹt được thử lại nhanh thay vì tiêu tốn phần lớn đường dẫn trọng yếu của CI.

### Chunk đường dẫn phát hành

Phạm vi Docker phát hành chạy các job nhỏ hơn được chia chunk với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi chunk chỉ kéo loại ảnh nó cần và thực thi nhiều lane thông qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các chunk Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` và từ `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` và `plugins-integrations` vẫn là các alias tổng hợp cho plugin/runtime. Alias lane `install-e2e` vẫn là alias chạy lại thủ công tổng hợp cho cả hai lane bộ cài đặt provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu, và chỉ giữ chunk độc lập `openwebui` cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật kênh đóng gói sẵn thử lại một lần đối với lỗi mạng npm tạm thời.

Mỗi chunk tải lên `.artifacts/docker-tests/` với nhật ký lane, thời gian, `summary.json`, `failures.json`, thời gian từng pha, JSON kế hoạch của bộ lập lịch, bảng lane chậm và lệnh chạy lại theo từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn trên các ảnh đã chuẩn bị thay vì các job chunk, giúp việc gỡ lỗi lane hỏng được giới hạn trong một job Docker có mục tiêu và chuẩn bị, tải xuống hoặc tái sử dụng artifact gói cho lần chạy đó; nếu một lane đã chọn là lane Docker live, job mục tiêu xây dựng ảnh live-test cục bộ cho lần chạy lại đó. Các lệnh GitHub chạy lại được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name` và input ảnh đã chuẩn bị khi các giá trị đó tồn tại, để một lane bị lỗi có thể tái sử dụng đúng gói và ảnh từ lần chạy lỗi.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Bản phát hành trước của Plugin

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một người vận hành rõ ràng. Các pull request thông thường, lần push lên `main` và dispatch CI thủ công độc lập không chạy bộ này. Nó cân bằng các test plugin đóng gói sẵn trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình plugin cùng lúc với một Vitest worker cho mỗi nhóm và heap Node lớn hơn để các lô plugin nặng về import không tạo thêm job CI. Đường dẫn Docker prerelease chỉ dành cho phát hành gom nhóm các lane Docker có mục tiêu thành các nhóm nhỏ để tránh giữ trước hàng chục runner cho các job dài một đến ba phút.

## QA Lab

QA Lab có các lane CI chuyên dụng nằm ngoài workflow chính có phạm vi thông minh. Agentic parity được lồng dưới các harness QA và phát hành rộng, không phải một workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi parity cần đi cùng một lần chạy kiểm định rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó mở rộng lane mock parity, lane Matrix live và các lane Telegram và Discord live thành các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các kiểm tra phát hành chạy các lane truyền tải Matrix và Telegram live với provider giả lập xác định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được tách biệt khỏi độ trễ model live và khởi động provider-plugin thông thường. Gateway truyền tải live tắt tìm kiếm bộ nhớ vì QA parity kiểm tra hành vi bộ nhớ riêng; kết nối provider được bao phủ bởi các bộ test provider live model, native provider và Docker provider riêng.

Matrix dùng `--profile fast` cho các gate theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn chia shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; gate QA parity của nó chạy các gói candidate và baseline dưới dạng các job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ cho so sánh parity cuối cùng.

Đối với PR thông thường, hãy dựa vào bằng chứng CI/check theo phạm vi thay vì coi parity là một trạng thái bắt buộc.

## CodeQL

Quy trình làm việc `CodeQL` được chủ ý thiết kế như một trình quét bảo mật vòng đầu hẹp, không phải lượt quét toàn bộ kho lưu trữ. Các lượt chạy bảo vệ hằng ngày, thủ công và pull request không ở trạng thái nháp quét mã workflow của Actions cùng các bề mặt JavaScript/TypeScript có rủi ro cao nhất, bằng các truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Bộ bảo vệ pull request vẫn nhẹ: nó chỉ khởi động với các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. Android và macOS CodeQL không nằm trong mặc định của PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Xác thực, bí mật, sandbox, cron, và đường cơ sở Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cộng với runtime Plugin kênh, Gateway, Plugin SDK, bí mật, điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | Bề mặt chính sách SSRF lõi, phân tích IP, bảo vệ mạng, web-fetch, và SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, trình trợ giúp thực thi tiến trình, phân phối outbound, và cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Bề mặt tin cậy của cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, tải nguồn, và hợp đồng gói Plugin SDK |

### Mảnh bảo mật theo nền tảng

- `CodeQL Android Critical Security` — mảnh bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — mảnh bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc ra khỏi SARIF đã tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn thời gian runtime ngay cả khi sạch.

### Danh mục chất lượng nghiêm trọng

`CodeQL Critical Quality` là mảnh không bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript mức lỗi, không liên quan đến bảo mật, trên các bề mặt hẹp có giá trị cao trên runner Blacksmith Linux nhỏ hơn. Bộ bảo vệ pull request của nó được chủ ý thu nhỏ hơn profile theo lịch: PR không ở trạng thái nháp chỉ chạy các mảnh `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` tương ứng cho các thay đổi trong mã thực thi lệnh/mô hình/công cụ của agent và điều phối trả lời, mã schema/migration/IO cấu hình, mã xác thực/bí mật/sandbox/bảo mật, runtime kênh lõi và Plugin kênh được đóng gói, phương thức máy chủ/giao thức Gateway, runtime bộ nhớ/SDK glue, MCP/tiến trình/phân phối outbound, runtime nhà cung cấp/danh mục mô hình, chẩn đoán phiên/hàng đợi phân phối, loader Plugin, Plugin SDK/hợp đồng gói, hoặc runtime trả lời Plugin SDK. Các thay đổi cấu hình CodeQL và workflow chất lượng chạy tất cả mười hai mảnh chất lượng PR.

Dispatch thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các profile hẹp là hook hướng dẫn/lặp lại để chạy riêng một mảnh chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật xác thực, bí mật, sandbox, cron, và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Schema cấu hình, migration, chuẩn hóa, và hợp đồng IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh được đóng gói                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi tự động trả lời, và hợp đồng runtime control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình, và hợp đồng phân phối outbound                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, glue kích hoạt runtime bộ nhớ, và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, trình trợ giúp binding/phân phối phiên outbound, bề mặt gói sự kiện/log chẩn đoán, và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời inbound Plugin SDK, trình trợ giúp payload/chunking/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối, và trình trợ giúp binding phiên/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, xác thực và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/danh mục nhà cung cấp, và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap UI điều khiển, lưu trữ cục bộ, luồng điều khiển Gateway, và hợp đồng runtime control-plane tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime fetch/search web lõi, IO media, hiểu media, tạo hình ảnh, và tạo media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng loader, registry, bề mặt công khai, và điểm vào Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và trình trợ giúp hợp đồng gói Plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, vô hiệu hóa, hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python, và Plugin được đóng gói chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc được chia mảnh sau khi các profile hẹp có runtime và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một làn bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được merge. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và dispatch thủ công có thể chạy trực tiếp. Các lần gọi workflow-run bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ trước. Khi chạy, nó xem xét dải commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, nên một lượt chạy hằng giờ có thể bao phủ tất cả thay đổi main tích lũy kể từ lượt tài liệu gần nhất.

### Test Performance Agent

Workflow `Test Performance Agent` là một làn bảo trì Codex theo sự kiện cho các bài test chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày đó. Làn này build một báo cáo hiệu năng Vitest toàn bộ suite được nhóm, cho phép Codex chỉ thực hiện các bản sửa hiệu năng test nhỏ vẫn giữ nguyên coverage thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ suite và từ chối các thay đổi làm giảm số lượng test baseline đang pass. Nếu baseline có test lỗi, Codex chỉ có thể sửa các lỗi hiển nhiên và báo cáo toàn bộ suite sau agent phải pass trước khi bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi bot push được đưa vào, làn này rebase bản vá đã xác thực, chạy lại `pnpm check:changed`, và thử push lại; các bản vá cũ bị xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub host để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau merge

Workflow `Duplicate PRs After Merge` là một workflow maintainer thủ công để dọn dẹp bản trùng lặp sau khi land. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi bản trùng lặp có vấn đề được tham chiếu chung hoặc có các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck core prod và core test cộng với lint/guard lõi;
- thay đổi chỉ liên quan đến test lõi chỉ chạy typecheck core test cộng với lint lõi;
- thay đổi production của extension chạy typecheck extension prod và extension test cộng với lint extension;
- thay đổi chỉ liên quan đến test của extension chạy typecheck extension test cộng với lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng Plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (các lượt quét extension Vitest vẫn là công việc test rõ ràng);
- bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc root được nhắm mục tiêu;
- thay đổi root/cấu hình không xác định sẽ fail an toàn sang tất cả làn kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và được chủ ý làm rẻ hơn `check:changed`: chỉnh sửa test trực tiếp tự chạy chính chúng, chỉnh sửa nguồn ưu tiên mapping rõ ràng, rồi đến các test cùng cấp và phần phụ thuộc import-graph. Cấu hình phân phối group-room dùng chung là một trong các mapping rõ ràng: thay đổi đối với cấu hình trả lời hiển thị trong nhóm, chế độ phân phối trả lời nguồn, hoặc prompt hệ thống message-tool được định tuyến qua các test trả lời lõi cộng với regression phân phối Discord và Slack để thay đổi mặc định dùng chung fail trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness khiến tập được map rẻ không còn là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ gốc kho lưu trữ và ưu tiên một box mới đã được khởi động sẵn cho bằng chứng diện rộng. Trước khi tốn một cổng kiểm tra chậm trên một box đã được tái sử dụng, đã hết hạn hoặc vừa báo cáo một lượt đồng bộ lớn bất ngờ, hãy chạy `pnpm testbox:sanity` bên trong box trước.

Kiểm tra sanity sẽ thất bại nhanh khi các tệp gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 tệp được theo dõi đã bị xóa. Điều đó thường có nghĩa là trạng thái đồng bộ từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng box đó và khởi động sẵn một box mới thay vì gỡ lỗi lỗi kiểm thử sản phẩm. Với các PR cố ý xóa số lượng lớn, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng chấm dứt một lệnh gọi Blacksmith CLI cục bộ nếu lệnh đó ở trong giai đoạn đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt cơ chế bảo vệ đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là trình bao bọc box từ xa do kho lưu trữ sở hữu cho bằng chứng Linux của maintainer. Dùng nó khi một kiểm tra quá rộng cho vòng lặp chỉnh sửa cục bộ, khi tính tương đồng với CI là quan trọng, hoặc khi bằng chứng cần secret, Docker, các lane gói, box tái sử dụng được, hoặc log từ xa. Backend OpenClaw thông thường là `blacksmith-testbox`; dung lượng AWS/Hetzner sở hữu là phương án dự phòng cho sự cố Blacksmith, vấn đề hạn ngạch, hoặc kiểm thử dung lượng sở hữu một cách rõ ràng.

Trước lần chạy đầu tiên, kiểm tra trình bao bọc từ gốc kho lưu trữ:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Trình bao bọc của kho lưu trữ từ chối binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider một cách tường minh dù `.crabbox.yaml` có các mặc định owned-cloud.

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

Đọc bản tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Các lần chạy Crabbox một lần dùng Blacksmith làm backend nên tự động dừng Testbox; nếu một lần chạy bị ngắt hoặc việc dọn dẹp chưa rõ ràng, hãy kiểm tra các box đang hoạt động và chỉ dừng các box bạn đã tạo:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Chỉ dùng tái sử dụng khi bạn chủ đích cần nhiều lệnh trên cùng một box đã được hydrate:

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

`.crabbox.yaml` sở hữu các mặc định provider, đồng bộ, và hydrate GitHub Actions cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã được hydrate giữ metadata Git từ xa riêng thay vì đồng bộ các remote và kho đối tượng cục bộ của maintainer, và nó loại trừ các artifact runtime/build cục bộ không bao giờ nên được truyền đi. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không phải secret cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
