---
read_when:
    - Bạn cần hiểu lý do một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions không thành công
    - Bạn đang điều phối một lần chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi cơ chế điều phối ClawSweeper hoặc việc chuyển tiếp hoạt động GitHub
summary: Đồ thị công việc CI, cổng kiểm soát phạm vi, nhóm bao trùm phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-02T10:35:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39af4afcb3e7c847c44a9d47513ac4b99c62d13fb139ece0bee979f24687ea38
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần push vào `main` và mọi pull request. Job `preflight` phân loại diff và tắt các lane tốn kém khi chỉ có những khu vực không liên quan thay đổi. Các lần chạy thủ công bằng `workflow_dispatch` cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho các bản phát hành ứng viên và xác thực diện rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong workflow riêng [`Plugin Trước phát hành`](#plugin-prerelease) và chỉ chạy từ [`Xác thực phát hành đầy đủ`](#full-release-validation) hoặc một lần dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                              | Mục đích                                                                                      | Khi chạy                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Phát hiện các thay đổi chỉ liên quan đến docs, phạm vi đã thay đổi, extension đã thay đổi, và xây dựng manifest CI      | Luôn chạy trên các push và PR không phải bản nháp |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra workflow qua `zizmor`                                        | Luôn chạy trên các push và PR không phải bản nháp |
| `security-dependency-audit`      | Kiểm tra lockfile production không cần dependency dựa trên các cảnh báo npm                             | Luôn chạy trên các push và PR không phải bản nháp |
| `security-fast`                  | Tổng hợp bắt buộc cho các job bảo mật nhanh                                                | Luôn chạy trên các push và PR không phải bản nháp |
| `check-dependencies`             | Lượt kiểm tra production Knip chỉ dành cho dependency cộng với guard allowlist tệp không dùng                    | Thay đổi liên quan đến Node              |
| `build-artifacts`                | Xây dựng `dist/`, Control UI, kiểm tra artifact đã build, và artifact hạ nguồn có thể tái sử dụng          | Thay đổi liên quan đến Node              |
| `checks-fast-core`               | Các lane kiểm tra tính đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                 | Thay đổi liên quan đến Node              |
| `checks-fast-contracts-channels` | Kiểm tra contract kênh được chia shard với kết quả kiểm tra tổng hợp ổn định                         | Thay đổi liên quan đến Node              |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ các lane kênh, bundled, contract, và extension             | Thay đổi liên quan đến Node              |
| `check`                          | Tương đương gate cục bộ chính được chia shard: kiểu production, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt   | Thay đổi liên quan đến Node              |
| `check-additional`               | Các shard kiến trúc, ranh giới, guard bề mặt extension, ranh giới package, và gateway-watch | Thay đổi liên quan đến Node              |
| `build-smoke`                    | Kiểm thử smoke Built-CLI và smoke bộ nhớ khi khởi động                                               | Thay đổi liên quan đến Node              |
| `checks`                         | Bộ xác minh cho kiểm thử kênh artifact đã build                                                    | Thay đổi liên quan đến Node              |
| `checks-node-compat-node22`      | Lane build và smoke tương thích Node 22                                                   | Dispatch CI thủ công cho phát hành    |
| `check-docs`                     | Định dạng docs, lint, và kiểm tra liên kết hỏng                                                | Docs thay đổi                       |
| `skills-python`                  | Ruff + pytest cho các skills có nền Python                                                       | Thay đổi liên quan đến skill Python      |
| `checks-windows`                 | Kiểm thử process/path dành riêng cho Windows cộng với hồi quy specifier import runtime dùng chung         | Thay đổi liên quan đến Windows           |
| `macos-node`                     | Lane kiểm thử TypeScript trên macOS dùng artifact đã build dùng chung                                  | Thay đổi liên quan đến macOS             |
| `macos-swift`                    | Swift lint, build, và kiểm thử cho ứng dụng macOS                                               | Thay đổi liên quan đến macOS             |
| `android`                        | Kiểm thử unit Android cho cả hai flavor cộng với một bản build debug APK                                 | Thay đổi liên quan đến Android           |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm hằng ngày bằng Codex sau hoạt động đáng tin cậy                                    | CI chính thành công hoặc dispatch thủ công |

## Thứ tự fail-fast

1. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không cần chờ các job artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các lane Linux nhanh để người tiêu thụ hạ nguồn có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Sau đó, các lane nền tảng và runtime nặng hơn được mở rộng: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một push mới hơn đến cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` nên chúng vẫn báo cáo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa concurrency CI tự động có version (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy thủ công toàn bộ bộ kiểm thử dùng `CI-manual-v1-*` và không hủy các lần chạy đang thực hiện.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử unit trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng tự chúng không ép chạy các build native Windows, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi mã nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, một số chỉnh sửa fixture kiểm thử core giá rẻ, và chỉnh sửa helper/test-routing plugin contract hẹp** dùng đường dẫn manifest nhanh chỉ dành cho Node: `preflight`, bảo mật, và một task `checks-fast-core` duy nhất. Đường dẫn đó bỏ qua artifact build, tương thích Node 22, contract kênh, toàn bộ shard core, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà task nhanh trực tiếp thực thi.
- **Kiểm tra Node trên Windows** được giới hạn vào các wrapper process/path dành riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package, và các bề mặt workflow CI thực thi lane đó; các thay đổi mã nguồn, plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn ở các lane Linux Node.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không đặt trước runner quá mức: contract kênh chạy dưới dạng ba shard có trọng số, các lane unit core nhỏ được ghép cặp, auto-reply chạy dưới dạng bốn worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch, và commands/state-routing), và các cấu hình gateway/plugin mang tính agentic được phân bổ trên các job Node agentic chỉ nguồn hiện có thay vì chờ artifact đã build. Các kiểm thử browser, QA, media, và Plugin linh tinh diện rộng dùng cấu hình Vitest riêng thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi lại mục timing bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt một cấu hình nguyên vẹn với một shard đã lọc. `check-additional` giữ công việc compile/canary ranh giới package cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; shard guard ranh giới chạy các guard độc lập nhỏ của nó đồng thời trong một job. Gateway watch, kiểm thử kênh, và shard ranh giới hỗ trợ core chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi build Play debug APK. Flavor bên thứ ba không có source set hoặc manifest riêng; lane kiểm thử unit của nó vẫn compile flavor với các flag BuildConfig SMS/call-log, đồng thời tránh job đóng gói debug APK trùng lặp trên mọi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt kiểm tra production Knip chỉ dành cho dependency, được pin vào phiên bản Knip mới nhất, với độ tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh các phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi PR thêm một tệp không dùng mới chưa được xem xét hoặc để lại mục allowlist đã lỗi thời, đồng thời giữ nguyên các bề mặt Plugin động, generated, build, live-test, và package bridge có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động repository OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo GitHub App token từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho yêu cầu review cấp commit trên các push vào `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại event, action, actor, repository, số item, URL, tiêu đề, trạng thái, và đoạn trích ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ body webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng event đã chuẩn hóa tới hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải mặc định phân phối. Agent ClawSweeper nhận mục tiêu Discord trong prompt của nó và chỉ nên đăng tới `#clawsweeper` khi event bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về vận hành. Các lần mở, chỉnh sửa, nhiễu bot, nhiễu webhook trùng lặp, và lưu lượng review bình thường nên dẫn đến `NO_REPLY`.

Hãy xem tiêu đề, bình luận, body, văn bản review, tên nhánh, và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy trong toàn bộ đường dẫn này. Chúng là input để tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI bình thường nhưng ép bật mọi lane có phạm vi không phải Android: shard Linux Node, shard bundled-plugin, contract kênh, tương thích Node 22, `check`, `check-additional`, build smoke, kiểm tra docs, Python skills, Windows, macOS, và Control UI i18n. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh prerelease Plugin, shard `agentic-plugins` chỉ dành cho phát hành, sweep batch extension đầy đủ, và các lane Docker prerelease Plugin bị loại khỏi CI. Bộ prerelease Docker chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với gate release-validation được bật.

Các lần chạy thủ công dùng một nhóm concurrency duy nhất để một bộ kiểm thử đầy đủ cho release-candidate không bị hủy bởi push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag, hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Trình chạy

| Trình chạy                       | Công việc                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các công việc và tổng hợp bảo mật nhanh (`security-scm-fast`, `security-dependency-audit`, `security-fast`), các kiểm tra protocol/contract/bundled nhanh, các kiểm tra contract kênh được chia shard, các shard `check` trừ lint, các shard và tổng hợp `check-additional`, các trình xác minh tổng hợp kiểm thử Node, kiểm tra tài liệu, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight cũng dùng Ubuntu do GitHub lưu trữ để ma trận Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard Plugin nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, và `check-test-types`                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Linux Node, các shard kiểm thử Plugin đi kèm, `android`                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (đủ nhạy với CPU đến mức 8 vCPU tốn nhiều chi phí hơn phần tiết kiệm được); các bản dựng Docker install-smoke (thời gian xếp hàng 32-vCPU tốn nhiều chi phí hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; các fork quay về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; các fork quay về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                                                |

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
```

## Xác thực phát hành đầy đủ

`Full Release Validation` là workflow bao quát thủ công để "chạy mọi thứ trước khi phát hành." Nó nhận một nhánh, thẻ, hoặc SHA commit đầy đủ, dispatch workflow `CI` thủ công với mục tiêu đó, dispatch `Plugin Prerelease` cho bằng chứng Plugin/package/static/Docker chỉ dành cho phát hành, và dispatch `OpenClaw Release Checks` cho install smoke, package acceptance, các bộ kiểm thử đường dẫn phát hành Docker, live/E2E, OpenWebUI, tương đồng QA Lab, Matrix, và các lane Telegram. Với `rerun_group=all` và `release_profile=full`, nó cũng chạy `NPM Telegram Beta E2E` với artifact `release-package-under-test` từ release checks. Sau khi phát hành, truyền `npm_telegram_package_spec` để chạy lại cùng lane package Telegram với gói npm đã phát hành.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn, tên công việc workflow chính xác, khác biệt giữa các hồ sơ, artifact, và
các handle chạy lại có trọng tâm.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Dispatch nó
từ `release/YYYY.M.D` hoặc `main` sau khi thẻ phát hành tồn tại và sau khi
OpenClaw npm preflight đã thành công. Nó xác minh `pnpm plugins:sync:check`,
dispatch `Plugin NPM Release` cho tất cả package Plugin có thể phát hành, dispatch
`Plugin ClawHub Release` cho cùng SHA phát hành, và chỉ sau đó dispatch
`OpenClaw NPM Release` với `preflight_run_id` đã lưu.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit đã ghim trên một nhánh thay đổi nhanh, hãy dùng helper thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Các ref dispatch workflow GitHub phải là nhánh hoặc thẻ, không phải SHA commit thô. Helper
đẩy một nhánh tạm thời `release-ci/<sha>-...` tại SHA mục tiêu,
dispatch `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con
`headSha` khớp với mục tiêu, và xóa nhánh tạm thời khi lần chạy hoàn tất. Trình xác minh bao quát cũng thất bại nếu bất kỳ workflow con nào chạy ở một
SHA khác.

`release_profile` kiểm soát phạm vi live/provider được truyền vào release checks. Các
workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn
cố ý muốn ma trận provider/media tư vấn rộng.

- `minimum` giữ các lane OpenAI/core quan trọng cho phát hành nhanh nhất.
- `stable` thêm bộ provider/backend ổn định.
- `full` chạy ma trận provider/media tư vấn rộng.

Workflow bao quát ghi lại id các lần chạy con đã dispatch, và công việc `Verify full validation` cuối cùng kiểm tra lại kết luận hiện tại của các lần chạy con và thêm bảng công việc chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại công việc xác minh cha để làm mới kết quả bao quát và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho CI con đầy đủ thông thường, `plugin-prerelease` chỉ cho Plugin prerelease con, `release-checks` cho mọi release child, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên workflow bao quát. Điều này giữ cho việc chạy lại hộp phát hành bị lỗi được giới hạn sau một bản sửa có trọng tâm.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho cả workflow Docker đường dẫn phát hành live/E2E và shard package acceptance. Điều đó giữ byte package nhất quán giữa các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều công việc con.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
thay thế workflow bao quát cũ hơn. Trình giám sát cha hủy mọi workflow con mà nó
đã dispatch khi workflow cha bị hủy, nên xác thực main mới hơn
không phải chờ sau một lần chạy release-check cũ kéo dài hai giờ. Xác thực
nhánh/thẻ phát hành và các nhóm chạy lại có trọng tâm giữ `cancel-in-progress: false`.

## Shard Live và E2E

Workflow con live/E2E phát hành giữ phạm vi kiểm thử `pnpm test:live` native rộng, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một công việc tuần tự:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- các công việc `native-live-src-gateway-profiles` được lọc theo provider
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- các shard media audio/video được tách và các shard music được lọc theo provider

Điều đó giữ cùng phạm vi tệp trong khi làm cho các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được xây dựng bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các công việc media chỉ xác minh các binary trước khi thiết lập. Giữ các bộ live có Docker hỗ trợ trên các runner Blacksmith thông thường — container jobs không phải nơi phù hợp để khởi chạy các kiểm thử Docker lồng nhau.

Các shard mô hình/phần phụ trợ trực tiếp dựa trên Docker sử dụng một image `ghcr.io/openclaw/openclaw-live-test:<sha>` dùng chung riêng cho mỗi commit được chọn. Workflow phát hành trực tiếp xây dựng và đẩy image đó một lần, sau đó các shard mô hình trực tiếp Docker, Gateway được chia shard theo nhà cung cấp, phần phụ trợ CLI, liên kết ACP và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Docker của Gateway mang các giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout của job workflow để container bị kẹt hoặc đường dọn dẹp lỗi nhanh thay vì tiêu tốn toàn bộ ngân sách kiểm tra phát hành. Nếu các shard đó tự xây dựng lại target Docker nguồn đầy đủ một cách độc lập, lần chạy phát hành đã bị cấu hình sai và sẽ lãng phí thời gian thực cho các lần xây dựng image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng thực hiện sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, ref workflow, ref gói, phiên bản, SHA-256 và hồ sơ trong tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory tarball, chuẩn bị các image Docker package-digest khi cần, và chạy các lane Docker đã chọn với gói đó thay vì đóng gói bản checkout workflow. Khi một hồ sơ chọn nhiều `docker_lanes` được nhắm mục tiêu, workflow tái sử dụng chuẩn bị gói và các image dùng chung một lần, rồi phân tán các lane đó thành các job Docker nhắm mục tiêu song song với artifact duy nhất.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải là `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một đặc tả npm đã phát hành.
4. `summary` làm workflow thất bại nếu phân giải gói, chấp nhận Docker, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng tùy chọn này cho chấp nhận beta/ổn định đã phát hành.
- `source=ref` đóng gói một nhánh, thẻ, hoặc SHA commit đầy đủ đáng tin cậy của `package_ref`. Bộ phân giải fetch các nhánh/thẻ OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử nhánh kho lưu trữ hoặc một thẻ phát hành, cài đặt deps trong một worktree tách rời, và đóng gói nó bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; `package_sha256` là bắt buộc.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy bài kiểm tra. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Hồ sơ bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Hồ sơ `package` dùng phạm vi bao phủ Plugin ngoại tuyến để việc xác thực gói đã phát hành không bị phụ thuộc vào tình trạng sẵn sàng trực tiếp của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn đặc tả npm đã phát hành được giữ cho các dispatch độc lập.

Về chính sách kiểm thử cập nhật và Plugin chuyên dụng, bao gồm các lệnh cục bộ,
lane Docker, đầu vào Package Acceptance, mặc định phát hành, và phân loại lỗi,
xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Các kiểm tra phát hành gọi Package Acceptance với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng di trú gói, cập nhật, dọn dẹp phụ thuộc Plugin lỗi thời, Plugin ngoại tuyến, cập nhật Plugin, và Telegram trên cùng tarball gói đã phân giải. Các kiểm tra phát hành đa hệ điều hành vẫn bao phủ onboarding, trình cài đặt và hành vi nền tảng riêng theo hệ điều hành; xác thực sản phẩm gói/cập nhật nên bắt đầu bằng Package Acceptance. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã phát hành cho mỗi lần chạy. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline dự phòng đã phát hành, mặc định là `openclaw@latest`; các lệnh chạy lại lane lỗi giữ nguyên baseline đó. Đặt `published_upgrade_survivor_baselines=release-history` để mở rộng lane trên một ma trận lịch sử đã khử trùng lặp: sáu bản phát hành ổn định mới nhất, `2026.4.23`, và bản phát hành ổn định mới nhất trước `2026-03-15`. Đặt `published_upgrade_survivor_scenarios=reported-issues` để mở rộng cùng các baseline trên các fixture theo dạng vấn đề cho cấu hình Feishu, tệp bootstrap/persona được giữ lại, đường dẫn log dấu ngã, và gốc phụ thuộc Plugin kế thừa lỗi thời. Workflow `Update Migration` riêng sử dụng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã phát hành một cách toàn diện, không phải độ phủ Full Release CI thông thường. Các lần chạy tổng hợp cục bộ có thể truyền đặc tả gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã phát hành cấu hình baseline bằng một công thức lệnh `openclaw config set` được nướng sẵn, ghi lại các bước công thức trong `summary.json`, và thăm dò `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane mới cho gói và trình cài đặt Windows cũng xác minh rằng một gói đã cài đặt có thể import một ghi đè điều khiển trình duyệt từ một đường dẫn Windows tuyệt đối thô. Smoke lượt tác nhân đa hệ điều hành OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.5`, để bằng chứng cài đặt và Gateway vẫn dùng mô hình kiểm thử GPT-5 được ưu tiên.

### Cửa sổ tương thích kế thừa

Package Acceptance có các cửa sổ tương thích kế thừa có giới hạn cho các gói đã phát hành. Các gói đến hết `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ tới các tệp bị bỏ qua khỏi tarball;
- `doctor-switch` có thể bỏ qua tiểu trường hợp duy trì `gateway install --wrapper` khi gói không cung cấp cờ đó;
- `update-channel-switch` có thể lược bỏ `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả dẫn xuất từ tarball và có thể ghi log `update.channel` đã duy trì bị thiếu;
- các smoke Plugin có thể đọc vị trí bản ghi cài đặt kế thừa hoặc chấp nhận việc thiếu duy trì bản ghi cài đặt marketplace;
- `plugin-update` có thể cho phép di trú siêu dữ liệu cấu hình trong khi vẫn yêu cầu bản ghi cài đặt và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu metadata bản dựng cục bộ đã được phát hành. Các gói sau đó phải thỏa mãn các hợp đồng hiện đại; cùng điều kiện sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy chấp nhận gói thất bại, hãy bắt đầu từ tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời lượng pha, và các lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói bị lỗi hoặc các lane Docker chính xác thay vì chạy lại xác thực phát hành đầy đủ.

## Smoke cài đặt

Workflow `Install Smoke` riêng tái sử dụng cùng script phạm vi thông qua job `preflight` riêng của nó. Nó chia phạm vi bao phủ smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho pull request chạm vào bề mặt Docker/gói, thay đổi gói/manifest Plugin được gói kèm, hoặc bề mặt Plugin/kênh/Gateway/Plugin SDK lõi mà các job smoke Docker thực hiện. Thay đổi Plugin được gói kèm chỉ ở nguồn, chỉnh sửa chỉ kiểm thử, và chỉnh sửa chỉ tài liệu không giữ trước worker Docker. Đường dẫn nhanh xây dựng image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI agents delete shared-workspace, chạy e2e container gateway-network, xác minh một build arg tiện ích mở rộng được gói kèm, và chạy hồ sơ Docker Plugin được gói kèm có giới hạn dưới timeout lệnh tổng hợp 240 giây (mỗi lần chạy Docker của kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ phạm vi cài đặt gói QR và Docker/cập nhật trình cài đặt cho các lần chạy lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call, và pull request thực sự chạm vào bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image smoke Dockerfile gốc GHCR theo SHA đích, sau đó chạy cài đặt gói QR, smoke Dockerfile/Gateway gốc, smoke trình cài đặt/cập nhật, và Docker E2E Plugin được gói kèm nhanh dưới dạng các job riêng để công việc trình cài đặt không phải chờ sau các smoke image gốc.

Các push lên `main` (bao gồm commit merge) không ép đường dẫn đầy đủ; khi logic phạm vi thay đổi sẽ yêu cầu phạm vi bao phủ đầy đủ trên một push, workflow giữ smoke Docker nhanh và để smoke cài đặt đầy đủ cho xác thực hằng đêm hoặc phát hành.

Smoke nhà cung cấp image cài đặt toàn cục Bun chậm được kiểm soát riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn tham gia, nhưng pull request và push lên `main` thì không. Các bài kiểm thử Docker QR và trình cài đặt giữ các Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` xây dựng trước một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, và xây dựng hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối thiểu cho các lane trình cài đặt/cập nhật/phụ thuộc Plugin;
- một image chức năng cài đặt cùng tarball vào `/app` cho các lane chức năng thông thường.

Các định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi plan đã chọn. Scheduler chọn image cho từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Các tham số có thể điều chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                          |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot main-pool cho các lane bình thường.                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot tail-pool nhạy cảm với provider.                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live chạy đồng thời để provider không throttle.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm chạy đồng thời.                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều service chạy đồng thời.                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ lệch giữa các lần bắt đầu lane để tránh bão tạo từ Docker daemon; đặt `0` để không lệch.       |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Timeout dự phòng cho mỗi lane (120 phút); một số lane live/tail được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in plan của scheduler mà không chạy lane.                                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua cleanup smoke để agent tái hiện một lane thất bại. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể bắt đầu từ pool trống, rồi chạy một mình cho đến khi giải phóng capacity. Aggregate cục bộ preflight Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời gian chạy lane để sắp xếp dài nhất trước, và mặc định dừng lên lịch các lane pooled mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` để biết package, loại image, image live, lane, và phạm vi credential nào là bắt buộc. Sau đó `scripts/docker-e2e.mjs` chuyển plan đó thành output và summary của GitHub. Nó hoặc đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact package của lần chạy hiện tại, hoặc tải xuống artifact package từ `package_artifact_run_id`; xác thực inventory của tarball; build và push các image Docker E2E bare/functional GHCR gắn tag bằng package digest qua Docker layer cache của Blacksmith khi plan cần các lane cài từ package; và dùng lại các input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các image theo package digest đã có thay vì build lại. Các lần pull Docker image được retry với timeout giới hạn 180 giây cho mỗi lần thử, để stream registry/cache bị kẹt retry nhanh thay vì tiêu tốn phần lớn critical path của CI.

### Các chunk đường dẫn release

Phạm vi Docker release chạy các job chunk nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi chunk chỉ pull loại image nó cần và thực thi nhiều lane qua cùng weighted scheduler:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các chunk Docker release hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và từ `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các alias aggregate plugin/runtime. Alias lane `install-e2e` vẫn là alias rerun thủ công aggregate cho cả hai lane installer provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ chunk `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật bundled-channel retry một lần cho lỗi mạng npm tạm thời.

Mỗi chunk upload `.artifacts/docker-tests/` với log lane, timing, `summary.json`, `failures.json`, timing theo phase, JSON plan của scheduler, bảng lane chậm, và lệnh rerun theo từng lane. Input `docker_lanes` của workflow chạy các lane được chọn trên các image đã chuẩn bị thay vì các job chunk, nhờ đó việc debug lane thất bại được giới hạn vào một job Docker có mục tiêu và chuẩn bị, tải xuống, hoặc dùng lại artifact package cho lần chạy đó; nếu một lane được chọn là lane Docker live, job mục tiêu sẽ build image live-test cục bộ cho lần rerun đó. Các lệnh rerun GitHub được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name`, và input image đã chuẩn bị khi các giá trị đó tồn tại, để một lane thất bại có thể dùng lại đúng package và image từ lần chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # tải xuống artifact Docker và in các lệnh rerun mục tiêu tổng hợp/theo từng lane
pnpm test:docker:timings <summary>   # summary lane chậm và critical-path theo phase
```

Workflow live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Plugin Prerelease

`Plugin Prerelease` là phạm vi product/package tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi operator rõ ràng. Các pull request thông thường, push lên `main`, và dispatch CI thủ công độc lập giữ bộ đó ở trạng thái tắt. Nó cân bằng test bundled plugin trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch plugin nặng import không tạo thêm job CI. Đường dẫn Docker prerelease chỉ dành cho release gom các lane Docker mục tiêu thành nhóm nhỏ để tránh giữ hàng chục runner cho các job một đến ba phút.

## QA Lab

QA Lab có các lane CI chuyên dụng nằm ngoài workflow smart-scoped chính.

- Workflow `Parity gate` chạy trên các thay đổi PR khớp và dispatch thủ công; nó build runtime QA riêng tư và so sánh các pack agentic mock GPT-5.5 và Opus 4.6.
- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó fan out mock parity gate, lane Matrix live, và các lane Telegram và Discord live thành các job song song. Job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các check release chạy lane transport live Matrix và Telegram với provider mock xác định và model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để contract channel được cô lập khỏi độ trễ model live và startup provider-plugin thông thường. Live transport gateway tắt tìm kiếm memory vì QA parity kiểm tra riêng hành vi memory; kết nối provider được kiểm tra bởi các bộ live model, native provider, và Docker provider riêng.

Matrix dùng `--profile fast` cho các gate theo lịch và release, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho release trước khi phê duyệt release; QA parity gate của nó chạy các pack candidate và baseline dưới dạng job lane song song, rồi tải cả hai artifact vào một job report nhỏ để so sánh parity cuối cùng.

Đừng đặt đường dẫn landing PR phía sau `Parity gate` trừ khi thay đổi thật sự chạm vào runtime QA, parity model-pack, hoặc một surface do workflow parity sở hữu. Với các bản sửa channel, config, tài liệu, hoặc unit-test thông thường, hãy xem nó là tín hiệu tùy chọn và theo bằng chứng CI/check theo phạm vi.

## CodeQL

Workflow `CodeQL` cố ý là scanner bảo mật lượt đầu với phạm vi hẹp, không phải quét toàn bộ repository. Các lần chạy hằng ngày, thủ công, và guard pull request không phải draft quét mã Actions workflow cùng các surface JavaScript/TypeScript rủi ro cao nhất bằng truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` high/critical.

Guard pull request vẫn nhẹ: nó chỉ bắt đầu cho các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. Android và macOS CodeQL không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Surface                                                                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret, sandbox, cron, và baseline gateway                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Contract triển khai channel core cộng với runtime channel plugin, gateway, Plugin SDK, secret, điểm chạm audit                    |
| `/codeql-security-high/network-ssrf-boundary`     | Surface SSRF core, phân tích IP, network guard, web-fetch, và chính sách SSRF của Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP server, helper thực thi process, outbound delivery, và gate thực thi tool của agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Surface tin cậy của cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, source-loading, và contract package Plugin SDK |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Build app Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Upload dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Build app macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build dependency khỏi SARIF được upload, và upload dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chi phối thời gian chạy ngay cả khi sạch.

### Danh mục Chất lượng nghiêm trọng

`CodeQL Critical Quality` là shard phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript phi bảo mật, mức độ lỗi, trên các surface giá trị cao với phạm vi hẹp trên runner Blacksmith Linux nhỏ hơn. Guard pull request của nó cố ý nhỏ hơn profile theo lịch: PR không phải draft chỉ chạy các shard chất lượng PR tương ứng `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` cho thay đổi ở mã thực thi command/model/tool của agent và dispatch reply, mã schema/migration/IO config, mã auth/secrets/sandbox/security, runtime channel core và bundled channel plugin, protocol/server-method gateway, runtime memory/SDK glue, MCP/process/outbound delivery, runtime provider/catalog model, diagnostics session/hàng đợi delivery, plugin loader, contract Plugin SDK/package, hoặc runtime reply Plugin SDK. Các thay đổi workflow chất lượng và config CodeQL chạy cả mười hai shard chất lượng PR.

Dispatch thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các profile hẹp là các hook hướng dẫn/lặp để chạy một phân mảnh chất lượng riêng lẻ trong trạng thái cô lập.

| Danh mục                                                | Bề mặt                                                                                                                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật cho xác thực, bí mật, sandbox, Cron và Gateway                                                                                                                |
| `/codeql-critical-quality/config-boundary`              | Lược đồ cấu hình, migration, chuẩn hóa và hợp đồng IO                                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Lược đồ giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đi kèm                                                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Hợp đồng runtime cho thực thi lệnh, điều phối model/nhà cung cấp, điều phối và hàng đợi tự động trả lời, cùng control-plane ACP                                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, helper giám sát tiến trình và hợp đồng phân phối đi                                                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, alias SDK Plugin bộ nhớ, lớp kết nối kích hoạt runtime bộ nhớ và lệnh doctor bộ nhớ                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, helper liên kết/phân phối phiên đi, bề mặt gói sự kiện/nhật ký chẩn đoán và hợp đồng CLI doctor phiên                           |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đến của SDK Plugin, helper payload/chunking/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối và helper liên kết phiên/luồng                             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa catalog model, xác thực và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/catalog nhà cung cấp và registry web/search/fetch/embedding                     |
| `/codeql-critical-quality/ui-control-plane`             | Khởi động Control UI, lưu trữ cục bộ, luồng điều khiển Gateway và hợp đồng runtime control-plane tác vụ                                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime cho fetch/search web lõi, IO media, hiểu media, tạo hình ảnh và tạo media                                                                                         |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng loader, registry, bề mặt công khai và điểm vào SDK Plugin                                                                                                                 |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Mã nguồn SDK Plugin phía gói đã phát hành và helper hợp đồng gói Plugin                                                                                                            |

Chất lượng được tách riêng khỏi bảo mật để các phát hiện về chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc phân mảnh sau khi các profile hẹp có runtime và tín hiệu ổn định.

## Quy trình bảo trì

### Docs Agent

Workflow `Docs Agent` là một làn bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được đưa vào. Nó không có lịch thuần túy: một lần chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và dispatch thủ công có thể chạy trực tiếp. Các lần gọi workflow-run sẽ bỏ qua khi `main` đã tiến tiếp hoặc khi một lần chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ vừa qua. Khi chạy, nó rà soát phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, nên một lần chạy hằng giờ có thể bao phủ mọi thay đổi trên main được tích lũy từ lượt rà soát tài liệu gần nhất.

### Test Performance Agent

Workflow `Test Performance Agent` là một làn bảo trì Codex theo sự kiện cho các kiểm thử chậm. Nó không có lịch thuần túy: một lần chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày đó. Làn này tạo báo cáo hiệu năng Vitest nhóm toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ nguyên độ phủ thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử nền đang pass. Nếu baseline có kiểm thử lỗi, Codex chỉ có thể sửa các lỗi hiển nhiên và báo cáo toàn bộ bộ kiểm thử sau agent phải pass trước khi bất cứ thứ gì được commit. Khi `main` tiến lên trước khi bot push được đưa vào, làn này rebase bản vá đã xác thực, chạy lại `pnpm check:changed` và thử push lại; các bản vá cũ bị xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub host để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi merge

Workflow `Duplicate PRs After Merge` là workflow thủ công cho maintainer để dọn dẹp trùng lặp sau khi land. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi bản trùng lặp có issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck core prod và core test cùng lint/guard lõi;
- thay đổi chỉ kiểm thử lõi chỉ chạy typecheck core test cùng lint lõi;
- thay đổi production phần mở rộng chạy typecheck extension prod và extension test cùng lint phần mở rộng;
- thay đổi chỉ kiểm thử phần mở rộng chạy typecheck extension test cùng lint phần mở rộng;
- thay đổi SDK Plugin công khai hoặc hợp đồng Plugin mở rộng sang typecheck phần mở rộng vì các phần mở rộng phụ thuộc vào những hợp đồng lõi đó (các lượt quét phần mở rộng Vitest vẫn là công việc kiểm thử tường minh);
- bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- thay đổi root/cấu hình không xác định sẽ fail-safe sang mọi làn kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý nhẹ hơn `check:changed`: chỉnh sửa kiểm thử trực tiếp chạy chính chúng, chỉnh sửa nguồn ưu tiên các ánh xạ tường minh, sau đó đến kiểm thử anh em và các phần phụ thuộc theo đồ thị import. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ tường minh: thay đổi đối với cấu hình trả lời hiển thị cho nhóm, chế độ phân phối trả lời nguồn hoặc system prompt của message-tool sẽ định tuyến qua kiểm thử trả lời lõi cùng hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung fail trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập ánh xạ rẻ không phải là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ repo root và ưu tiên một box mới đã được làm ấm cho bằng chứng rộng. Trước khi dùng một cổng chậm trên box đã được tái sử dụng, hết hạn hoặc vừa báo cáo một lần đồng bộ lớn bất ngờ, trước tiên hãy chạy `pnpm testbox:sanity` bên trong box.

Kiểm tra sanity fail nhanh khi các tệp gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 lượt xóa đã được theo dõi. Điều đó thường có nghĩa là trạng thái đồng bộ từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng box đó và làm ấm một box mới thay vì debug lỗi kiểm thử sản phẩm. Với các PR xóa số lượng lớn có chủ ý, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng kết thúc một lần gọi Blacksmith CLI cục bộ vẫn ở giai đoạn đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để vô hiệu hóa guard đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Crabbox là đường dẫn remote-box thứ hai do repo sở hữu cho bằng chứng Linux khi Blacksmith không khả dụng hoặc khi dung lượng đám mây sở hữu được ưu tiên hơn. Làm ấm một box, hydrate nó qua workflow dự án, rồi chạy lệnh qua Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` sở hữu mặc định về nhà cung cấp, đồng bộ và hydrate GitHub Actions. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa riêng thay vì đồng bộ remote và object store cục bộ của maintainer, đồng thời loại trừ artifact runtime/build cục bộ không bao giờ được chuyển. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main` và bàn giao môi trường không bí mật mà các lệnh `crabbox run --id <cbx_id>` sau đó sẽ source.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
