---
read_when:
    - Bạn cần hiểu vì sao một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lượt xác thực phát hành hoặc chạy lại
    - Bạn đang thay đổi điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Biểu đồ job CI, cổng phạm vi, nhóm phát hành và lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-07-04T18:05:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần push lên `main` và mọi pull request. Các lần push `main` chuẩn trước tiên đi qua cửa sổ tiếp nhận hosted-runner 90 giây.
Nhóm đồng thời `CI` hiện có sẽ hủy lượt chạy đang chờ đó khi có commit mới hơn
được đưa lên, nên các lần merge tuần tự sẽ không lần lượt đăng ký đầy đủ ma trận Blacksmith.
Pull request và các lần dispatch thủ công bỏ qua bước chờ. Job `preflight`
sau đó phân loại diff và tắt các lane tốn kém khi chỉ có những khu vực không liên quan
thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh
và phân nhánh toàn bộ đồ thị cho release candidate và quá trình xác thực rộng.
Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành
nằm trong workflow [`Plugin phát hành trước`](#plugin-prerelease)
riêng và chỉ chạy từ [`Xác thực phát hành đầy đủ`](#full-release-validation)
hoặc một dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                                | Mục đích                                                                                                   | Khi chạy                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Phát hiện thay đổi chỉ liên quan đến tài liệu, phạm vi đã đổi, extension đã đổi, và xây dựng manifest CI  | Luôn chạy trên push và PR không phải draft                  |
| `runner-admission`                 | Debounce 90 giây trên hosted-runner cho các lần push `main` chuẩn trước khi công việc Blacksmith được đăng ký | Mọi lượt chạy CI; chỉ sleep trên các lần push `main` chuẩn |
| `security-fast`                    | Phát hiện khóa riêng tư, kiểm tra workflow đã đổi qua `zizmor`, và kiểm tra lockfile production                 | Luôn chạy trên push và PR không phải draft                  |
| `check-dependencies`               | Lượt kiểm tra Knip chỉ cho phụ thuộc production cùng bộ bảo vệ allowlist tệp không dùng                                 | Các thay đổi liên quan đến Node                               |
| `build-artifacts`                  | Build `dist/`, Control UI, kiểm tra smoke built-CLI, kiểm tra built-artifact nhúng, và artifact tái sử dụng | Các thay đổi liên quan đến Node                               |
| `checks-fast-core`                 | Các lane kiểm tra đúng nhanh trên Linux như bundled, protocol, QA Smoke CI, và kiểm tra định tuyến CI                | Các thay đổi liên quan đến Node                               |
| `checks-fast-contracts-plugins-*`  | Hai lượt kiểm tra hợp đồng Plugin được chia shard                                                                        | Các thay đổi liên quan đến Node                               |
| `checks-fast-contracts-channels-*` | Hai lượt kiểm tra hợp đồng kênh được chia shard                                                                       | Các thay đổi liên quan đến Node                               |
| `checks-node-core-*`               | Các shard kiểm thử Node lõi, ngoại trừ các lane kênh, bundled, hợp đồng, và extension                          | Các thay đổi liên quan đến Node                               |
| `check-*`                          | Tương đương cổng local chính được chia shard: kiểu production, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt | Các thay đổi liên quan đến Node                               |
| `check-additional-*`               | Kiến trúc, drift boundary/prompt được chia shard, guard extension, boundary package, và topology runtime     | Các thay đổi liên quan đến Node                               |
| `checks-node-compat-node22`        | Lane build và smoke tương thích Node 22                                                                | Dispatch CI thủ công cho các bản phát hành                     |
| `check-docs`                       | Định dạng tài liệu, lint, và kiểm tra liên kết hỏng                                                             | Tài liệu thay đổi                                        |
| `skills-python`                    | Ruff + pytest cho Skills có backend Python                                                                    | Các thay đổi liên quan đến Skill Python                       |
| `checks-windows`                   | Kiểm thử process/path đặc thù Windows cùng hồi quy bộ chỉ định import runtime dùng chung                      | Các thay đổi liên quan đến Windows                            |
| `macos-node`                       | Lane kiểm thử TypeScript trên macOS dùng artifact build dùng chung                                               | Các thay đổi liên quan đến macOS                              |
| `macos-swift`                      | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                            | Các thay đổi liên quan đến macOS                              |
| `ios-build`                        | Tạo project Xcode cùng bản build simulator ứng dụng iOS                                                 | Ứng dụng iOS, shared app kit, hoặc thay đổi Swabble         |
| `android`                          | Kiểm thử unit Android cho cả hai flavor cùng một bản build APK debug                                              | Các thay đổi liên quan đến Android                            |
| `test-performance-agent`           | Tối ưu kiểm thử chậm Codex hằng ngày sau hoạt động đáng tin cậy                                                 | CI main thành công hoặc dispatch thủ công                  |
| `openclaw-performance`             | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile, và GPT 5.5 live | Theo lịch và dispatch thủ công                       |

## Thứ tự fail-fast

1. `runner-admission` chỉ chờ các lần push `main` chuẩn; một push mới hơn sẽ hủy lượt chạy trước khi đăng ký Blacksmith.
2. `preflight` quyết định những lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
4. `build-artifacts` chồng lấp với các lane Linux nhanh để downstream consumer có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
5. Các lane nền tảng và runtime nặng hơn phân nhánh sau đó: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi có push mới hơn trên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lượt chạy mới nhất cho cùng ref cũng đang thất bại. Các job ma trận dùng `fail-fast: false`, và `build-artifacts` báo cáo trực tiếp lỗi embedded channel, core-support-boundary, và gateway-watch thay vì xếp hàng các job xác minh nhỏ. Khóa đồng thời CI tự động được đánh phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô hạn các lượt chạy main mới hơn. Các lượt chạy thủ công toàn bộ bộ kiểm dùng `CI-manual-v1-*` và không hủy các lượt chạy đang diễn ra.

Dùng `pnpm ci:timings`, `pnpm ci:timings:recent`, hoặc `node scripts/ci-run-timings.mjs <run-id>` để tóm tắt thời gian thực, thời gian xếp hàng, job chậm nhất, lỗi, và rào cản fanout `pnpm-store-warmup` từ GitHub Actions. CI cũng tải lên cùng bản tóm tắt lượt chạy dưới dạng artifact `ci-timings-summary`. Với thời gian build, kiểm tra bước `Build dist` của job `build-artifacts`: `pnpm build:ci-artifacts` in ra `[build-all] phase timings:` và bao gồm `ui:build`; job cũng tải lên artifact `startup-memory`.

Đối với lượt chạy pull request, job timing-summary cuối cùng chạy helper từ bản sửa đổi base đáng tin cậy trước khi truyền `GH_TOKEN` cho `gh run view`. Điều đó giữ truy vấn có token khỏi mã do nhánh kiểm soát trong khi vẫn tóm tắt lượt chạy CI hiện tại của pull request.

## Ngữ cảnh và bằng chứng PR

PR từ contributor bên ngoài chạy một cổng ngữ cảnh PR và bằng chứng từ
`.github/workflows/real-behavior-proof.yml`. Workflow checkout commit base đáng tin cậy
và chỉ đánh giá nội dung PR; nó không thực thi mã từ nhánh của contributor.

Cổng này áp dụng cho tác giả PR không phải chủ sở hữu repository, thành viên,
collaborator, hoặc bot. Nó pass khi nội dung PR chứa các phần do tác giả viết
`What Problem This Solves` và `Evidence`. Bằng chứng có thể là một kiểm thử tập trung,
kết quả CI, ảnh chụp màn hình, bản ghi, đầu ra terminal, quan sát live,
log đã biên tập, hoặc liên kết artifact. Nội dung cung cấp ý định và xác thực hữu ích;
reviewer kiểm tra mã, kiểm thử, và CI để đánh giá tính đúng đắn.

Khi kiểm tra thất bại, hãy cập nhật nội dung PR thay vì push thêm một commit mã khác.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi unit test trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cùng lint workflow, nhưng tự chúng không bắt buộc build native Windows, iOS, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi nguồn nền tảng.
- **Workflow Sanity** chạy `actionlint`, `zizmor` trên tất cả tệp YAML workflow, guard nội suy composite-action, và guard conflict-marker. Job `security-fast` theo phạm vi PR cũng chạy `zizmor` trên các tệp workflow đã đổi để phát hiện bảo mật workflow thất bại sớm trong đồ thị CI chính.
- **Tài liệu trên push `main`** được kiểm tra bởi workflow `Docs` độc lập với cùng mirror tài liệu ClawHub mà CI dùng, nên các lần push hỗn hợp mã+tài liệu không đồng thời xếp hàng shard `check-docs` của CI. Pull request và CI thủ công vẫn chạy `check-docs` từ CI khi tài liệu thay đổi.
- **TUI PTY** chạy trong shard Linux Node `checks-node-core-runtime-tui-pty` cho các thay đổi TUI. Shard chạy `test/vitest/vitest.tui-pty.config.ts` với `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, nên nó bao phủ cả lane fixture `TuiBackend` tất định và smoke `tui --local` chậm hơn vốn chỉ mock endpoint model bên ngoài.
- **Các chỉnh sửa chỉ liên quan đến định tuyến CI, một số chỉnh sửa fixture core-test rẻ được chọn, và các chỉnh sửa helper/test-routing hợp đồng Plugin hẹp** dùng đường manifest nhanh chỉ Node: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường này bỏ qua artifact build, tương thích Node 22, hợp đồng kênh, toàn bộ shard lõi, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp kiểm tra.
- **Kiểm tra Node Windows** được giới hạn vào các wrapper process/path đặc thù Windows, helper runner npm/pnpm/UI, cấu hình package manager, và các bề mặt workflow CI thực thi lane đó; các thay đổi nguồn, Plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn ở trên các lane Linux Node.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không đặt trước quá nhiều runner: hợp đồng plugin và hợp đồng kênh mỗi loại chạy dưới dạng hai shard có trọng số được Blacksmith hỗ trợ với fallback runner GitHub tiêu chuẩn, các làn core unit fast/support chạy riêng, hạ tầng core runtime được tách giữa state, process/config, shared và ba shard miền cron, auto-reply chạy dưới dạng worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch và commands/state-routing), và cấu hình agentic gateway/server được tách theo các làn chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã build. CI thông thường sau đó chỉ đóng gói các shard include-pattern hạ tầng cô lập vào các bundle xác định tối đa 64 tệp kiểm thử, giảm ma trận Node mà không gộp các bộ non-isolated command/cron, stateful agents-core hoặc gateway/server; các bộ cố định nặng vẫn dùng 8 vCPU trong khi các làn đã bundle và có trọng số thấp hơn dùng 4 vCPU. Pull request trên kho lưu trữ chính tắc dùng thêm một kế hoạch tiếp nhận gọn: cùng các nhóm theo cấu hình chạy trong các subprocess cô lập bên trong kế hoạch Linux Node 34 job hiện tại, để một PR đơn lẻ không đăng ký toàn bộ ma trận Node hơn 70 job. Các lần push lên `main`, dispatch thủ công và cổng release vẫn giữ toàn bộ ma trận. Các kiểm thử trình duyệt rộng, QA, media và plugin linh tinh dùng cấu hình Vitest chuyên dụng của chúng thay vì catch-all plugin dùng chung. Các shard include-pattern ghi mục timing bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt một cấu hình nguyên vẹn với một shard đã lọc. `check-additional-*` giữ công việc compile/canary theo ranh giới package cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; danh sách boundary guard được chia sọc thành một shard nặng về prompt và một shard kết hợp cho các sọc guard còn lại, mỗi shard chạy đồng thời các guard độc lập đã chọn và in timing theo từng check. Kiểm tra drift snapshot prompt happy-path Codex tốn kém chạy như job bổ sung riêng cho CI thủ công và chỉ cho các thay đổi ảnh hưởng prompt, nên các thay đổi Node không liên quan thông thường không phải chờ sau quá trình tạo snapshot prompt lạnh và các shard boundary vẫn cân bằng trong khi prompt drift vẫn được ghim vào PR đã gây ra nó; cùng cờ đó bỏ qua việc tạo Vitest snapshot prompt bên trong shard support-boundary core artifact đã build. Gateway watch, kiểm thử kênh và shard support-boundary core chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Sau khi được tiếp nhận, CI Linux chính tắc cho phép tối đa 24 job kiểm thử Node chạy đồng thời và
12 cho các làn fast/check nhỏ hơn; Windows và Android giữ ở mức hai vì
các nhóm runner đó hẹp hơn.

Kế hoạch PR gọn phát ra 18 job Node cho bộ hiện tại: các nhóm whole-config
được gom batch trong các subprocess cô lập với timeout batch 120 phút,
trong khi các nhóm include-pattern dùng chung ngân sách job có giới hạn đó.

CI Android chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi build APK debug Play. Flavor third-party không có source set hoặc manifest riêng; làn unit-test của nó vẫn compile flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh một job đóng gói APK debug trùng lặp trên mỗi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ kiểm tra dependency production được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho lần cài `dlx`) và `pnpm deadcode:unused-files`, lệnh này so sánh các phát hiện tệp không dùng trong production của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard unused-file thất bại khi một PR thêm tệp không dùng mới chưa được review hoặc để lại mục allowlist lỗi thời, trong khi vẫn giữ các bề mặt plugin động có chủ ý, generated, build, live-test và cầu nối package mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động kho lưu trữ OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn làn:

- `clawsweeper_item` cho các yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong comment issue;
- `clawsweeper_commit_review` cho các yêu cầu review cấp commit trên các lần push `main`;
- `github_activity` cho hoạt động GitHub chung mà tác tử ClawSweeper có thể kiểm tra.

Làn `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, tác nhân, kho lưu trữ, số item, URL, tiêu đề, trạng thái và đoạn trích ngắn cho comment hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ thân webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng sự kiện đã chuẩn hóa tới hook OpenClaw Gateway cho tác tử ClawSweeper.

Hoạt động chung là quan sát, không phải gửi mặc định. Tác tử ClawSweeper nhận đích Discord trong prompt của nó và chỉ nên đăng lên `#clawsweeper` khi sự kiện bất ngờ, có thể hành động, rủi ro hoặc hữu ích về vận hành. Các lần mở, chỉnh sửa, nhiễu bot, nhiễu webhook trùng lặp và lưu lượng review thông thường nên trả về `NO_REPLY`.

Xem tiêu đề GitHub, comment, body, văn bản review, tên nhánh và commit message là dữ liệu không đáng tin cậy xuyên suốt đường dẫn này. Chúng là đầu vào cho tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime tác tử.

## Dispatch thủ công

Dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng bật bắt buộc mọi làn có phạm vi không phải Android: các shard Linux Node, shard bundled-plugin, shard hợp đồng plugin và kênh, tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra smoke artifact đã build, kiểm tra docs, Python skills, Windows, macOS, build iOS và i18n Control UI. Dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella release đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh prerelease plugin, shard chỉ dành cho release `agentic-plugins`, sweep batch extension đầy đủ và các làn Docker prerelease plugin bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với cổng release-validation được bật.

Các lần chạy thủ công dùng một nhóm concurrency duy nhất để một bộ đầy đủ release-candidate không bị hủy bởi một lần push hoặc PR khác trên cùng ref. Đầu vào tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ dispatch ref đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

Đường dẫn extended-stable hằng tháng chỉ npm là ngoại lệ: dispatch cả preflight `OpenClaw NPM
Release` và `Full Release Validation` từ đúng nhánh
`extended-stable/YYYY.M.33`, giữ lại run ID của chúng và truyền cả hai ID cho lần chạy publish npm
trực tiếp. Xem [Phát hành extended-stable hằng tháng chỉ npm](/vi/reference/RELEASING#monthly-npm-only-extended-stable-publication) để biết
các lệnh, yêu cầu danh tính chính xác, đọc lại registry và quy trình sửa chữa
selector. Đường dẫn này không dispatch plugin, macOS, Windows, GitHub
Release, dist-tag riêng hoặc phát hành nền tảng khác.

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Dispatch CI thủ công và fallback kho lưu trữ không chính tắc, quét chất lượng CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs ngoài CI và preflight install-smoke để ma trận Blacksmith có thể vào hàng đợi sớm hơn                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard extension nhẹ hơn, `checks-fast-core` ngoại trừ QA Smoke CI, shard hợp đồng plugin/kênh, hầu hết shard Linux Node bundled/nhẹ hơn, `check-guards`, `check-prod-types`, `check-test-types`, các shard `check-additional-*` đã chọn và `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Các bộ Linux Node nặng được giữ lại, shard `check-additional-*` nặng về boundary/extension và `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` trong CI và Testbox, `check-lint` (nhạy CPU đến mức 8 vCPU tốn kém hơn phần tiết kiệm được); build Docker install-smoke (thời gian hàng đợi 32 vCPU tốn kém hơn phần tiết kiệm được)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` trên `openclaw/openclaw`; fork fallback về `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` và `ios-build` trên `openclaw/openclaw`; fork fallback về `macos-26`                                                                                                                                                                                                                     |

## Ngân sách đăng ký runner

Bucket đăng ký runner GitHub hiện tại của OpenClaw báo cáo 10.000 đăng ký
runner self-hosted mỗi 5 phút trong `ghx api rate_limit`. Kiểm tra lại
`actions_runner_registration` trước mỗi lượt tinh chỉnh vì GitHub có thể thay đổi
bucket này. Giới hạn được chia sẻ bởi tất cả đăng ký runner Blacksmith trong tổ chức
`openclaw`, nên việc thêm một cài đặt Blacksmith khác không thêm
bucket mới.

Xem nhãn Blacksmith là tài nguyên khan hiếm để kiểm soát burst. Các job
chỉ định tuyến, thông báo, tóm tắt, chọn shard hoặc chạy quét CodeQL ngắn nên
ở lại trên runner do GitHub host trừ khi chúng có nhu cầu riêng cho Blacksmith
đã đo được. Bất kỳ ma trận Blacksmith mới, `max-parallel` lớn hơn hoặc workflow
tần suất cao nào cũng phải thể hiện số đăng ký trường hợp xấu nhất và giữ mục tiêu
cấp tổ chức dưới khoảng 60% bucket trực tiếp. Với bucket 10.000 đăng ký hiện tại,
điều đó nghĩa là mục tiêu vận hành 6.000 đăng ký, để lại khoảng trống cho
các kho lưu trữ đồng thời, retry và burst chồng lấn.

CI kho chính tắc giữ Blacksmith làm đường dẫn runner mặc định cho các lần chạy push và pull-request thông thường. `workflow_dispatch` và các lần chạy kho lưu trữ không chính tắc dùng runner do GitHub host, nhưng các lần chạy chính tắc thông thường hiện không dò tình trạng hàng đợi Blacksmith hoặc tự động fallback sang nhãn do GitHub host khi Blacksmith không khả dụng.

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
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw Performance

`OpenClaw Performance` là quy trình hiệu năng sản phẩm/runtime. Quy trình này chạy hằng ngày trên `main` và có thể được kích hoạt thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Kích hoạt thủ công thường benchmark ref của workflow. Đặt `target_ref` để benchmark một thẻ phát hành hoặc một nhánh khác bằng triển khai workflow hiện tại. Đường dẫn báo cáo đã xuất bản và các con trỏ mới nhất được khóa theo ref được kiểm thử, và mỗi `index.md` ghi lại ref/SHA được kiểm thử, ref/SHA của workflow, ref Kova, profile, chế độ xác thực lane, model, số lần lặp và bộ lọc kịch bản.

Workflow cài đặt OCM từ một bản phát hành được ghim và Kova từ `openclaw/Kova` tại đầu vào `kova_ref` được ghim, rồi chạy ba lane:

- `mock-provider`: các kịch bản chẩn đoán Kova chạy với runtime bản dựng cục bộ bằng xác thực giả lập tương thích OpenAI có tính xác định.
- `mock-deep-profile`: lập hồ sơ CPU/heap/trace cho các điểm nóng khi khởi động, Gateway và lượt agent.
- `live-openai-candidate`: một lượt agent OpenAI `openai/gpt-5.5` thật, được bỏ qua khi không có `OPENAI_API_KEY`.

Lane mock-provider cũng chạy các probe nguồn gốc OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ qua các trường hợp khởi động mặc định, hook và 50 Plugin; RSS khi nhập Plugin được đóng gói, các vòng lặp hello `channel-chat-baseline` mock-OpenAI lặp lại, các lệnh khởi động CLI chạy với Gateway đã boot, và probe hiệu năng smoke cho trạng thái SQLite. Khi báo cáo nguồn mock-provider đã xuất bản trước đó có sẵn cho ref được kiểm thử, phần tóm tắt nguồn so sánh các giá trị RSS và heap hiện tại với baseline đó và đánh dấu các mức tăng RSS lớn là `watch`. Tóm tắt Markdown của probe nguồn nằm tại `source/index.md` trong gói báo cáo, với JSON thô đặt bên cạnh.

Mỗi lane tải artifact lên GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các gói, `index.md` và artifact probe nguồn vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ tested-ref hiện tại được ghi là `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực bản phát hành đầy đủ

`Full Release Validation` là workflow bao trùm thủ công cho “chạy mọi thứ trước khi phát hành.” Workflow này nhận một nhánh, thẻ hoặc SHA commit đầy đủ, kích hoạt workflow `CI` thủ công với mục tiêu đó, kích hoạt `Plugin Prerelease` cho bằng chứng riêng của bản phát hành về Plugin/package/static/Docker, và kích hoạt `OpenClaw Release Checks` cho smoke cài đặt, chấp nhận package, kiểm tra package đa hệ điều hành, render scorecard độ trưởng thành từ bằng chứng profile QA, tương đương QA Lab, Matrix và các lane Telegram. Profile stable và full luôn bao gồm độ phủ soak đường phát hành Docker và live/E2E đầy đủ; profile beta có thể bật bằng `run_release_soak=true`. E2E Telegram package chuẩn chạy bên trong Package Acceptance, vì vậy một ứng viên đầy đủ không khởi động thêm poller live trùng lặp. Sau khi xuất bản, truyền `release_package_spec` để tái sử dụng package npm đã phát hành trên release checks, Package Acceptance, Docker, đa hệ điều hành và Telegram mà không build lại. Chỉ dùng `npm_telegram_package_spec` cho một lần chạy lại Telegram tập trung với package đã xuất bản. Lane package live của Plugin Codex mặc định dùng cùng trạng thái đã chọn: `release_package_spec=openclaw@<tag>` đã xuất bản suy ra `codex_plugin_spec=npm:@openclaw/codex@<tag>`, trong khi các lượt chạy SHA/artifact sẽ đóng gói `extensions/codex` từ ref đã chọn. Đặt `codex_plugin_spec` rõ ràng cho các nguồn Plugin tùy chỉnh như thông số `npm:`, `npm-pack:` hoặc `git:`.

Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết ma trận giai đoạn, tên job workflow chính xác, khác biệt giữa các profile, artifact và các handle chạy lại tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Kích hoạt từ `release/YYYY.M.PATCH` hoặc `main` sau khi thẻ phát hành đã tồn tại và sau khi preflight npm OpenClaw đã thành công. Workflow xác minh `pnpm plugins:sync:check`, kích hoạt `Plugin NPM Release` cho tất cả package Plugin có thể xuất bản, kích hoạt `Plugin ClawHub Release` cho cùng SHA phát hành, rồi chỉ sau đó mới kích hoạt `OpenClaw NPM Release` với `preflight_run_id` đã lưu. Phát hành stable cũng yêu cầu `windows_node_tag` chính xác; workflow xác minh bản phát hành nguồn Windows và so sánh bộ cài x64/ARM64 của nó với đầu vào `windows_node_installer_digests` đã được ứng viên phê duyệt trước bất kỳ workflow con xuất bản nào, rồi quảng bá và xác minh chính các digest bộ cài đã ghim đó cùng artifact đi kèm chính xác và hợp đồng checksum trước khi xuất bản bản nháp phát hành GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit đã ghim trên một nhánh thay đổi nhanh, hãy dùng helper thay vì `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref kích hoạt workflow GitHub phải là nhánh hoặc thẻ, không phải SHA commit thô. Helper đẩy một nhánh tạm `release-ci/<sha>-...` tại SHA mục tiêu, kích hoạt `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con có `headSha` khớp với mục tiêu, và xóa nhánh tạm khi lượt chạy hoàn tất. Bộ xác minh bao trùm cũng thất bại nếu bất kỳ workflow con nào chạy ở SHA khác.

`release_profile` kiểm soát độ rộng live/provider được truyền vào release checks. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn chủ động muốn ma trận provider/media tư vấn rộng. Release checks stable và full luôn chạy soak đường phát hành Docker và live/E2E đầy đủ; profile beta có thể bật bằng `run_release_soak=true`.

- `minimum` giữ các lane OpenAI/core trọng yếu cho phát hành nhanh nhất.
- `stable` thêm tập provider/backend stable.
- `full` chạy ma trận provider/media tư vấn rộng.

Workflow bao trùm ghi lại các id lượt chạy con đã kích hoạt, và job `Verify full validation` cuối cùng kiểm tra lại kết luận hiện tại của các lượt chạy con và nối thêm bảng job chậm nhất cho từng lượt chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại job xác minh cha để làm mới kết quả bao trùm và tóm tắt thời gian.

Để phục hồi, cả `Full Release Validation` và `OpenClaw Release Checks` đều nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho workflow con full CI thông thường, `plugin-prerelease` chỉ cho workflow con prerelease Plugin, `release-checks` cho mọi workflow con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` hoặc `npm-telegram` trên workflow bao trùm. Điều này giữ lượt chạy lại hộp phát hành bị lỗi trong phạm vi sau một bản sửa tập trung. Với một lane đa hệ điều hành bị lỗi, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh đa hệ điều hành dài phát ra dòng Heartbeat và tóm tắt packaged-upgrade bao gồm thời gian theo từng pha. Các lane QA release-check là tư vấn, ngoại trừ cổng độ phủ công cụ runtime tiêu chuẩn, vốn chặn khi công cụ động bắt buộc của OpenClaw bị lệch hoặc biến mất khỏi tóm tắt tầng tiêu chuẩn.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho các kiểm tra đa hệ điều hành và Package Acceptance, cùng workflow Docker đường phát hành live/E2E khi chạy độ phủ soak. Điều đó giữ byte package nhất quán giữa các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều job con. Với lane live Codex npm-plugin, release checks hoặc truyền thông số Plugin đã xuất bản khớp được suy ra từ `release_package_spec`, truyền `codex_plugin_spec` do operator cung cấp, hoặc để trống đầu vào để script Docker đóng gói Plugin Codex của checkout đã chọn.

Các lượt chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all` thay thế workflow bao trùm cũ hơn. Bộ giám sát cha hủy mọi workflow con mà nó đã kích hoạt khi workflow cha bị hủy, vì vậy xác thực main mới hơn không phải chờ sau một lượt chạy release-check cũ kéo dài hai giờ. Xác thực nhánh/thẻ phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Các shard live và E2E

Workflow con live/E2E của phát hành giữ độ phủ `pnpm test:live` native rộng, nhưng chạy dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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
- các shard media âm thanh/video được tách riêng và các shard nhạc được lọc theo provider

Điều đó giữ nguyên độ phủ file trong khi giúp chạy lại và chẩn đoán lỗi provider live chậm dễ hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media` và `native-live-extensions-media-music` vẫn hợp lệ cho các lượt chạy lại thủ công một lần.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên runner Blacksmith thông thường — job container không phải nơi phù hợp để khởi chạy các kiểm thử Docker lồng nhau.

Các phân đoạn mô hình/backend live dựa trên Docker dùng một image dùng chung riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit được chọn. Workflow phát hành live build và push image đó một lần, sau đó các phân đoạn mô hình live Docker, Gateway được chia theo provider, backend CLI, bind ACP và Codex harness chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các phân đoạn Gateway Docker mang giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout của job workflow, để container bị kẹt hoặc đường dọn dẹp lỗi nhanh thay vì tiêu tốn toàn bộ ngân sách kiểm tra phát hành. Nếu các phân đoạn đó tự rebuild toàn bộ target Docker nguồn một cách độc lập, lần chạy phát hành đã bị cấu hình sai và sẽ lãng phí thời gian thực tế vào các lần build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng Docker E2E harness mà người dùng thực hiện sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256 và profile trong phần tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow có thể tái sử dụng tải artifact đó xuống, xác thực inventory của tarball, chuẩn bị image Docker theo digest gói khi cần, và chạy các lane Docker đã chọn trên gói đó thay vì đóng gói checkout của workflow. Khi một profile chọn nhiều `docker_lanes` có mục tiêu, workflow có thể tái sử dụng chuẩn bị gói và các image dùng chung một lần, rồi tỏa các lane đó ra thành các job Docker có mục tiêu chạy song song với artifact riêng.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Chấp nhận gói đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã xuất bản.
4. `summary` làm workflow thất bại nếu phân giải gói, chấp nhận Docker hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng mục này cho chấp nhận prerelease/stable đã xuất bản.
- `source=ref` đóng gói một nhánh, tag hoặc commit SHA đầy đủ đáng tin cậy trong `package_ref`. Bộ phân giải fetch các nhánh/tag OpenClaw, xác minh commit được chọn có thể truy cập từ lịch sử nhánh repository hoặc một tag phát hành, cài đặt dependency trong một worktree tách rời, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS công khai; bắt buộc có `package_sha256`. Đường dẫn này từ chối thông tin xác thực trong URL, cổng HTTPS không mặc định, hostname hoặc IP đã phân giải thuộc private/internal/special-use, và redirect ra ngoài cùng chính sách an toàn công khai.
- `source=trusted-url` tải xuống một `.tgz` HTTPS từ chính sách trusted-source có tên trong `.github/package-trusted-sources.json`; bắt buộc có `package_sha256` và `trusted_source_id`. Chỉ dùng mục này cho mirror doanh nghiệp do maintainer sở hữu hoặc repository gói riêng cần host, cổng, tiền tố đường dẫn, host redirect hoặc phân giải mạng riêng đã cấu hình. Nếu chính sách khai báo bearer auth, workflow dùng secret cố định `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; thông tin xác thực nhúng trong URL vẫn bị từ chối.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy bài test. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness test hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng thêm `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các phần đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng phạm vi Plugin ngoại tuyến để việc xác thực gói đã xuất bản không bị phụ thuộc vào tính sẵn có live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn spec npm đã xuất bản được giữ lại cho các dispatch độc lập.

Để xem chính sách kiểm thử cập nhật và Plugin chuyên dụng, bao gồm lệnh cục bộ,
lane Docker, input Chấp nhận gói, mặc định phát hành và phân loại lỗi,
xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Kiểm tra phát hành gọi Chấp nhận gói với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng về migration gói, cập nhật, cài đặt Skill live từ ClawHub, dọn dẹp dependency Plugin cũ, sửa cài đặt Plugin đã cấu hình, Plugin ngoại tuyến, cập nhật Plugin và Telegram trên cùng tarball gói đã phân giải. Đặt `release_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks sau khi xuất bản beta để chạy cùng ma trận trên gói npm đã ship mà không rebuild; chỉ đặt `package_acceptance_package_spec` khi Chấp nhận gói cần một gói khác với phần còn lại của xác thực phát hành. Các kiểm tra phát hành đa hệ điều hành vẫn bao phủ onboarding, trình cài đặt và hành vi nền tảng đặc thù theo OS; xác thực sản phẩm gói/cập nhật nên bắt đầu bằng Chấp nhận gói. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã xuất bản cho mỗi lần chạy trong đường dẫn phát hành chặn. Trong Chấp nhận gói, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã xuất bản dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng trên bốn bản phát hành npm stable mới nhất cộng với các bản phát hành ranh giới tương thích Plugin được ghim và fixture theo dạng issue cho cấu hình Feishu, file bootstrap/persona được bảo toàn, cài đặt OpenClaw Plugin đã cấu hình, đường dẫn log dấu ngã và root dependency Plugin legacy cũ. Các lựa chọn published-upgrade survivor nhiều baseline được chia theo baseline thành các job runner Docker có mục tiêu riêng. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã xuất bản một cách toàn diện, không phải độ rộng CI Full Release thông thường. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã xuất bản cấu hình baseline bằng công thức lệnh `openclaw config set` đã được baked, ghi các bước công thức trong `summary.json`, và probe `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane fresh Windows packaged và installer cũng xác minh rằng một gói đã cài đặt có thể import override browser-control từ đường dẫn Windows tuyệt đối thô. Smoke lượt agent OpenAI đa hệ điều hành mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.5`, để bằng chứng cài đặt và Gateway vẫn ở trên mô hình test GPT-5 trong khi tránh mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Chấp nhận gói có các cửa sổ tương thích legacy có giới hạn cho các gói đã xuất bản. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến file bị lược khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase persistence `gateway install --wrapper` khi gói không expose flag đó;
- `update-channel-switch` có thể tỉa `patchedDependencies` pnpm bị thiếu khỏi fixture git giả lấy từ tarball và có thể log `update.channel` đã persist bị thiếu;
- các smoke Plugin có thể đọc vị trí install-record legacy hoặc chấp nhận thiếu persistence install-record marketplace;
- `plugin-update` có thể cho phép migration metadata cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã xuất bản cũng có thể cảnh báo về các file dấu metadata build cục bộ đã được ship. Các gói về sau phải thỏa mãn contract hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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
  -f package_ref=release/YYYY.M.PATCH \
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

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
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

Khi debug một lần chạy chấp nhận gói thất bại, bắt đầu ở phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời gian pha và lệnh chạy lại. Ưu tiên chạy lại profile gói bị lỗi hoặc các lane Docker chính xác thay vì chạy lại toàn bộ xác thực phát hành.

## Smoke cài đặt

Workflow `Install Smoke` riêng tái sử dụng cùng script phạm vi thông qua job `preflight` của chính nó. Nó tách phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho các pull request chạm vào bề mặt Docker/package, thay đổi package/manifest của Plugin đi kèm, hoặc các bề mặt Plugin SDK/plugin/channel/gateway lõi mà các tác vụ Docker smoke kiểm tra. Các thay đổi chỉ ở mã nguồn của Plugin đi kèm, chỉnh sửa chỉ ở kiểm thử, và chỉnh sửa chỉ ở tài liệu không giữ trước Docker worker. Đường dẫn nhanh xây dựng ảnh Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa agents shared-workspace, chạy e2e gateway-network trong container, xác minh build arg của extension đi kèm, và chạy hồ sơ Docker Plugin đi kèm có giới hạn trong timeout lệnh tổng hợp 240 giây (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ lại phạm vi cài đặt package QR và Docker/update của trình cài đặt cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call, và các pull request thật sự chạm vào bề mặt installer/package/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một ảnh smoke GHCR root Dockerfile theo target-SHA, rồi chạy cài đặt package QR, smoke root Dockerfile/gateway, smoke installer/update, và Docker E2E Plugin đi kèm nhanh dưới dạng các job riêng để công việc trình cài đặt không phải chờ sau các smoke ảnh gốc.

Các push lên `main` (bao gồm merge commit) không ép dùng đường dẫn đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một push, workflow giữ Docker smoke nhanh và để smoke cài đặt đầy đủ cho xác thực hằng đêm hoặc xác thực phát hành.

Smoke image-provider cài đặt Bun global chậm được chặn riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn bật nó, nhưng pull request và push lên `main` thì không. CI PR thông thường vẫn chạy lane hồi quy trình khởi chạy Bun nhanh cho các thay đổi liên quan đến Node. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile tập trung vào cài đặt của riêng chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` build trước một ảnh live-test dùng chung, đóng gói OpenClaw một lần thành npm tarball, và build hai ảnh `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane installer/update/plugin-dependency;
- một ảnh chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn ảnh cho mỗi lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số điều chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot nhóm chính cho các lane thông thường.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot nhóm cuối nhạy cảm với provider.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để provider không throttle.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5        | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều dịch vụ đồng thời.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ trễ so le giữa các lần bắt đầu lane để tránh bão tạo của Docker daemon; đặt `0` để không so le. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Timeout dự phòng cho mỗi lane (120 phút); các lane live/tail được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` in kế hoạch bộ lập lịch mà không chạy lane.                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Danh sách lane chính xác phân tách bằng dấu phẩy; bỏ qua cleanup smoke để agents có thể tái tạo một lane lỗi. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể bắt đầu từ một nhóm trống, rồi chạy một mình cho đến khi nhả dung lượng. Tổng hợp cục bộ kiểm tra trước Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời gian lane để sắp xếp lane lâu nhất trước, và mặc định dừng lên lịch các lane trong nhóm mới sau lỗi đầu tiên.

### Workflow live/E2E có thể tái sử dụng

Workflow live/E2E có thể tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` cần phạm vi package, loại ảnh, ảnh live, lane và thông tin xác thực nào. Sau đó `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành output và bản tóm tắt GitHub. Nó hoặc đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact package của lần chạy hiện tại, hoặc tải xuống artifact package từ `package_artifact_run_id`; xác thực inventory của tarball; build và push các ảnh Docker E2E GHCR bare/functional được gắn tag theo package digest qua cache lớp Docker của Blacksmith khi kế hoạch cần các lane đã cài package; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` đã cung cấp hoặc ảnh theo package digest hiện có thay vì build lại. Các lần pull ảnh Docker được retry với timeout giới hạn 180 giây cho mỗi lần thử để một luồng registry/cache bị kẹt retry nhanh thay vì tiêu tốn phần lớn đường găng CI.

### Các phần của đường dẫn phát hành

Phạm vi Docker phát hành chạy các job được chia nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phần chỉ pull loại ảnh nó cần và thực thi nhiều lane qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các phần Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `package-update-openai` bao gồm lane package Plugin Codex live, cài đặt package OpenClaw ứng viên, cài đặt Plugin Codex từ `codex_plugin_spec` hoặc một tarball cùng ref với phê duyệt cài đặt Codex CLI rõ ràng, chạy preflight Codex CLI, rồi chạy nhiều lượt agent OpenClaw cùng phiên với OpenAI. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các alias tổng hợp plugin/runtime. Alias lane `install-e2e` vẫn là alias chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ phần `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật bundled-channel retry một lần cho lỗi mạng npm tạm thời.

Mỗi phần tải lên `.artifacts/docker-tests/` cùng log lane, thời gian, `summary.json`, `failures.json`, thời gian theo phase, JSON kế hoạch bộ lập lịch, bảng lane chậm, và lệnh chạy lại theo từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn trên các ảnh đã chuẩn bị thay vì các job theo phần, giúp việc gỡ lỗi lane lỗi được giới hạn trong một job Docker nhắm mục tiêu và chuẩn bị, tải xuống, hoặc tái sử dụng artifact package cho lần chạy đó; nếu một lane đã chọn là lane Docker live, job nhắm mục tiêu build ảnh live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name`, và input ảnh đã chuẩn bị khi các giá trị đó tồn tại, để một lane lỗi có thể tái sử dụng đúng package và ảnh từ lần chạy lỗi.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Plugin Prerelease

`Plugin Prerelease` là phạm vi product/package tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi operator rõ ràng. Pull request thông thường, push lên `main`, và dispatch CI thủ công độc lập giữ bộ này tắt. Nó cân bằng kiểm thử Plugin đi kèm trên tám extension worker; các job extension shard đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một Vitest worker cho mỗi nhóm và heap Node lớn hơn để các lô Plugin nặng import không tạo thêm job CI. Đường dẫn prerelease Docker chỉ dành cho phát hành gom các lane Docker nhắm mục tiêu thành nhóm nhỏ để tránh giữ hàng chục runner cho các job dài một đến ba phút. Workflow cũng tải lên artifact thông tin `plugin-inspector-advisory` từ `@openclaw/plugin-inspector`; các phát hiện của inspector là đầu vào triage và không thay đổi cổng chặn Plugin Prerelease.

## QA Lab

QA Lab có các lane CI chuyên dụng nằm ngoài workflow smart-scoped chính. Tương đương agentic được lồng dưới các harness QA rộng và phát hành, không phải workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi tương đương cần đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó bung lane mock parity, lane live Matrix, và các lane live Telegram và Discord thành các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Kiểm tra phát hành chạy các lane transport live Matrix và Telegram với provider mô phỏng xác định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để contract của channel được cô lập khỏi độ trễ model live và khởi động provider-plugin thông thường. Gateway transport live tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; kết nối provider được bao phủ bởi các bộ live model, native provider, và Docker provider riêng.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu với phát hành trước khi phê duyệt phát hành; cổng QA parity của nó chạy các gói ứng viên và baseline dưới dạng các job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ cho so sánh parity cuối cùng.

Với PR thông thường, hãy theo bằng chứng CI/check theo phạm vi thay vì coi parity là trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` cố ý là trình quét bảo mật vòng đầu hẹp, không phải lượt quét toàn bộ repository. Các lần chạy hằng ngày, thủ công, và guard pull request không phải draft quét mã Actions workflow cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Guard pull request giữ nhẹ: nó chỉ bắt đầu cho các thay đổi dưới `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, hoặc các đường dẫn runtime Plugin đi kèm sở hữu tiến trình, và nó chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. Android và macOS CodeQL không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Đường cơ sở cho xác thực, bí mật, sandbox, Cron và Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cộng với runtime Plugin kênh, Gateway, Plugin SDK, bí mật và các điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt chính sách SSRF lõi, phân tích cú pháp IP, lớp bảo vệ mạng, web-fetch và SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, trình trợ giúp thực thi tiến trình, phân phối đi ra và các cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/process-exec-boundary`     | Shell cục bộ, trình trợ giúp spawn tiến trình, runtime Plugin được đóng gói sở hữu tiến trình con và phần kết nối script workflow                             |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của cài đặt Plugin, loader, manifest, registry, cài đặt bằng package-manager, nạp nguồn và hợp đồng gói Plugin SDK |

### Các shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android chạy theo lịch. Tự build ứng dụng Android cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Tự build ứng dụng macOS cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF được tải lên và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn runtime ngay cả khi sạch.

### Các danh mục Chất lượng Nghiêm trọng

`CodeQL Critical Quality` là shard phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript phi bảo mật, mức độ lỗi, trên các bề mặt hẹp có giá trị cao trên runner Linux do GitHub lưu trữ để các lượt quét chất lượng không tiêu tốn ngân sách đăng ký runner Blacksmith. Bộ bảo vệ pull request của nó cố ý nhỏ hơn hồ sơ chạy theo lịch: PR không phải bản nháp chỉ chạy các shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` và `plugin-sdk-reply-runtime` tương ứng cho thay đổi trong mã thực thi lệnh/mô hình/công cụ của agent và điều phối trả lời, mã schema/migration/IO cấu hình, mã xác thực/bí mật/sandbox/bảo mật, runtime kênh lõi và Plugin kênh được đóng gói, giao thức Gateway/phương thức máy chủ, runtime bộ nhớ/phần kết nối SDK, MCP/tiến trình/phân phối đi ra, catalog runtime/mô hình provider, chẩn đoán phiên/hàng đợi phân phối, loader Plugin, Plugin SDK/hợp đồng gói hoặc runtime trả lời Plugin SDK. Thay đổi cấu hình CodeQL và workflow chất lượng chạy toàn bộ mười hai shard chất lượng PR.

Manual dispatch chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là hook hướng dẫn/lặp để chạy riêng một shard chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã biên bảo mật cho xác thực, bí mật, sandbox, Cron và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Hợp đồng schema cấu hình, migration, chuẩn hóa và IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai Plugin kênh lõi và kênh được đóng gói                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Hợp đồng runtime cho thực thi lệnh, điều phối mô hình/provider, điều phối và hàng đợi tự động trả lời, và control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình và hợp đồng phân phối đi ra                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, phần kết nối kích hoạt runtime bộ nhớ và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, trình trợ giúp liên kết/phân phối phiên đi ra, bề mặt gói sự kiện/log chẩn đoán và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đi vào của Plugin SDK, trình trợ giúp payload/chia đoạn/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối và trình trợ giúp liên kết phiên/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa catalog mô hình, xác thực và khám phá provider, đăng ký runtime provider, mặc định/catalog provider và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Khởi động Control UI, lưu bền cục bộ, luồng điều khiển Gateway và hợp đồng runtime control-plane tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime fetch/search web lõi, IO media, hiểu media, tạo ảnh và tạo media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng entrypoint của loader, registry, bề mặt công khai và Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và trình trợ giúp hợp đồng gói Plugin                                                                                      |

Chất lượng được tách riêng khỏi bảo mật để các phát hiện chất lượng có thể được lập lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin được đóng gói chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc được chia shard sau khi các hồ sơ hẹp đã ổn định về runtime và tín hiệu.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một làn bảo trì Codex hướng sự kiện để giữ tài liệu hiện có khớp với các thay đổi vừa được đưa vào. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và manual dispatch có thể chạy trực tiếp. Các lần gọi workflow-run bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ trước. Khi chạy, nó rà soát dải commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, để một lượt chạy hằng giờ có thể bao phủ toàn bộ thay đổi trên main tích lũy từ lần kiểm tra tài liệu trước.

### Test Performance Agent

Workflow `Test Performance Agent` là một làn bảo trì Codex hướng sự kiện cho các bài kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong cùng ngày UTC đó. Manual dispatch bỏ qua cổng hoạt động hằng ngày đó. Làn này build báo cáo hiệu năng Vitest theo nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các sửa lỗi hiệu năng kiểm thử nhỏ vẫn giữ nguyên độ phủ thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử baseline đang pass. Báo cáo theo nhóm ghi lại wall time theo từng cấu hình và RSS tối đa trên Linux và macOS, nên so sánh trước/sau hiển thị delta bộ nhớ kiểm thử bên cạnh delta thời lượng. Nếu baseline có kiểm thử thất bại, Codex chỉ có thể sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau agent phải pass trước khi có bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi bot push được đưa lên, làn này rebase bản vá đã xác thực, chạy lại `pnpm check:changed` và thử push lại; các bản vá cũ bị xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub lưu trữ để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR Trùng lặp Sau Khi Merge

Workflow `Duplicate PRs After Merge` là một workflow maintainer thủ công để dọn dẹp trùng lặp sau khi land. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi bản trùng lặp có issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về biên kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck prod lõi và kiểm thử lõi cộng với lint/guard lõi;
- thay đổi chỉ kiểm thử lõi chỉ chạy typecheck kiểm thử lõi cộng với lint lõi;
- thay đổi production extension chạy typecheck prod extension và kiểm thử extension cộng với lint extension;
- thay đổi chỉ kiểm thử extension chạy typecheck kiểm thử extension cộng với lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng Plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (các lượt quét Vitest extension vẫn là công việc kiểm thử rõ ràng);
- bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- thay đổi gốc/cấu hình không xác định fail safe sang toàn bộ các làn kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý rẻ hơn `check:changed`: chỉnh sửa kiểm thử trực tiếp chạy chính chúng, chỉnh sửa nguồn ưu tiên ánh xạ rõ ràng, sau đó đến kiểm thử sibling và các dependent trong import-graph. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ rõ ràng: thay đổi đối với cấu hình trả lời hiển thị cho nhóm, chế độ phân phối trả lời nguồn hoặc prompt hệ thống message-tool được định tuyến qua các kiểm thử trả lời lõi cộng với hồi quy phân phối Discord và Slack để thay đổi mặc định dùng chung thất bại trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập được ánh xạ rẻ không phải là proxy đáng tin cậy.

## Xác thực Testbox

Crabbox là trình bao bọc remote-box do repo sở hữu để cung cấp bằng chứng Linux cho maintainer. Dùng nó
từ gốc repo khi một kiểm tra quá rộng cho vòng lặp chỉnh sửa cục bộ, khi tính tương đồng với CI
quan trọng, hoặc khi bằng chứng cần secrets, Docker, package lanes,
box tái sử dụng, hoặc nhật ký từ xa. Backend OpenClaw thông thường là
`blacksmith-testbox`; dung lượng AWS/Hetzner sở hữu là phương án dự phòng khi Blacksmith
ngừng hoạt động, gặp vấn đề hạn mức, hoặc khi cần kiểm thử rõ ràng trên dung lượng sở hữu.

Các lần chạy Blacksmith do Crabbox hỗ trợ sẽ làm ấm, claim, đồng bộ, chạy, báo cáo, và dọn dẹp
các Testbox dùng một lần. Kiểm tra hợp lệ đồng bộ tích hợp sẽ thất bại nhanh khi các tệp
gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short`
hiển thị ít nhất 200 lượt xóa đã được theo dõi. Với các PR cố ý xóa số lượng lớn, đặt
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lệnh từ xa.

Crabbox cũng chấm dứt một lần gọi Blacksmith CLI cục bộ nếu nó ở lại
giai đoạn đồng bộ quá năm phút mà không có đầu ra sau đồng bộ. Đặt
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` để tắt cơ chế bảo vệ đó, hoặc dùng một
giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Trước lần chạy đầu tiên, kiểm tra trình bao bọc từ gốc repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Trình bao bọc repo từ chối binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider tường minh dù `.crabbox.yaml` có mặc định owned-cloud. Trong worktree Codex hoặc checkout liên kết/thưa, tránh script `pnpm crabbox:run` cục bộ vì pnpm có thể đối soát lại dependency trước khi Crabbox khởi động; thay vào đó gọi trực tiếp trình bao bọc node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Các lần chạy do Blacksmith hỗ trợ yêu cầu Crabbox 0.22.0 hoặc mới hơn để trình bao bọc nhận được hành vi đồng bộ, hàng đợi, và dọn dẹp Testbox hiện tại. Khi dùng checkout sibling, build lại binary cục bộ bị bỏ qua trước công việc đo thời gian hoặc chứng minh:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
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
  "corepack pnpm test <path-or-filter>"
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
  "corepack pnpm test"
```

Đọc phần tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Với các lần chạy
Blacksmith Testbox được ủy quyền, mã thoát của trình bao bọc Crabbox và tóm tắt JSON là
kết quả lệnh. Lần chạy GitHub Actions được liên kết sở hữu việc hydrate và keepalive; nó
có thể kết thúc là `cancelled` khi Testbox bị dừng từ bên ngoài sau khi lệnh SSH
đã trả về. Hãy xem đó là một hiện vật dọn dẹp/trạng thái trừ khi
`exitCode` của trình bao bọc khác 0 hoặc đầu ra lệnh cho thấy kiểm thử thất bại.
Các lần chạy Crabbox dùng một lần do Blacksmith hỗ trợ nên tự động dừng Testbox;
nếu một lần chạy bị gián đoạn hoặc việc dọn dẹp không rõ ràng, hãy kiểm tra các box đang hoạt động và chỉ dừng
những box bạn đã tạo:

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

Nếu Crabbox là lớp bị hỏng nhưng bản thân Blacksmith vẫn hoạt động, chỉ dùng trực tiếp
Blacksmith cho chẩn đoán như `list`, `status`, và dọn dẹp. Sửa đường dẫn
Crabbox trước khi xem một lần chạy Blacksmith trực tiếp là bằng chứng maintainer.

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các
warmup mới nằm ở trạng thái `queued` mà không có IP hoặc URL lần chạy Actions sau vài phút,
hãy xem đó là áp lực từ provider Blacksmith, hàng đợi, thanh toán, hoặc giới hạn tổ chức. Dừng các
id đang xếp hàng mà bạn đã tạo, tránh khởi động thêm Testbox, và chuyển bằng chứng sang
đường dẫn dung lượng Crabbox sở hữu bên dưới trong khi ai đó kiểm tra dashboard Blacksmith,
thanh toán, và giới hạn tổ chức.

Chỉ leo thang sang dung lượng Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn hạn mức, thiếu môi trường cần thiết, hoặc dung lượng sở hữu là mục tiêu rõ ràng:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thật sự cần CPU cấp 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để vấp hạn mức EC2 Spot hoặc On-Demand Standard theo khu vực. `.crabbox.yaml` do repo sở hữu mặc định dùng `standard`, nhiều vùng dung lượng, và `capacity.hints: true` để các lease AWS qua broker in ra vùng/thị trường đã chọn, áp lực hạn mức, fallback Spot, và cảnh báo lớp áp lực cao. Dùng `fast` cho các kiểm tra rộng nặng hơn, `large` chỉ sau khi standard/fast không đủ, và `beast` chỉ cho các lane giới hạn bởi CPU ngoại lệ như toàn bộ bộ kiểm thử hoặc ma trận Docker toàn Plugin, xác thực release/blocker rõ ràng, hoặc profiling hiệu năng nhiều lõi. Không dùng `beast` cho `pnpm check:changed`, kiểm thử tập trung, công việc chỉ tài liệu, lint/typecheck thông thường, repro E2E nhỏ, hoặc triage sự cố Blacksmith. Dùng `--market on-demand` để chẩn đoán dung lượng để biến động thị trường Spot không bị trộn vào tín hiệu.

`.crabbox.yaml` sở hữu các mặc định provider, đồng bộ, và hydrate GitHub Actions cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa riêng thay vì đồng bộ remote và object store cục bộ của maintainer, và nó loại trừ các artifact runtime/build cục bộ không bao giờ nên được truyền đi. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và chuyển giao môi trường không bí mật cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
