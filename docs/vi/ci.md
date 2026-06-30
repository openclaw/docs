---
read_when:
    - Bạn cần hiểu lý do vì sao một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lượt chạy hoặc chạy lại xác thực bản phát hành
    - Bạn đang thay đổi việc điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Đồ thị công việc CI, cổng phạm vi, nhóm phát hành bao trùm và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-06-30T14:07:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần push lên `main` và mọi pull request. Các lần
push chuẩn lên `main` trước tiên đi qua cửa sổ tiếp nhận hosted-runner 90 giây.
Nhóm đồng thời `CI` hiện có sẽ hủy lượt chạy đang chờ đó khi có commit mới hơn
được đưa lên, vì vậy các lần merge tuần tự không lần nào cũng đăng ký một ma
trận Blacksmith đầy đủ. Pull request và các lượt dispatch thủ công bỏ qua bước
chờ. Job `preflight` sau đó phân loại diff và tắt các tuyến tốn kém khi chỉ
những khu vực không liên quan thay đổi. Các lượt chạy `workflow_dispatch` thủ
công cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho release
candidate và xác thực diện rộng. Các tuyến Android vẫn là tùy chọn thông qua
`include_android`. Phạm vi kiểm thử Plugin chỉ dành cho bản phát hành nằm trong
workflow [`Plugin Prerelease`](#plugin-prerelease) riêng và chỉ chạy từ
[`Full Release Validation`](#full-release-validation) hoặc một dispatch thủ công
tường minh.

## Tổng quan pipeline

| Job                                | Mục đích                                                                                                      | Khi chạy                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `preflight`                        | Phát hiện thay đổi chỉ liên quan đến tài liệu, phạm vi đã đổi, extension đã đổi, và dựng manifest CI          | Luôn chạy trên push không phải draft và PR                    |
| `runner-admission`                 | Debounce 90 giây trên hosted runner cho các push chuẩn lên `main` trước khi công việc Blacksmith được đăng ký | Mọi lượt chạy CI; chỉ sleep trên các push chuẩn lên `main`    |
| `security-fast`                    | Phát hiện khóa riêng, kiểm toán workflow đã đổi qua `zizmor`, và kiểm toán lockfile production                | Luôn chạy trên push không phải draft và PR                    |
| `check-dependencies`               | Lượt Knip chỉ kiểm tra dependency production cùng guard allowlist cho tệp không dùng                          | Thay đổi liên quan đến Node                                   |
| `build-artifacts`                  | Dựng `dist/`, Control UI, smoke check CLI đã build, kiểm tra artifact build nhúng, và artifact tái sử dụng    | Thay đổi liên quan đến Node                                   |
| `checks-fast-core`                 | Các tuyến đúng đắn Linux nhanh như bundled, protocol, QA Smoke CI, và kiểm tra định tuyến CI                  | Thay đổi liên quan đến Node                                   |
| `checks-fast-contracts-plugins-*`  | Hai kiểm tra hợp đồng Plugin được shard                                                                       | Thay đổi liên quan đến Node                                   |
| `checks-fast-contracts-channels-*` | Hai kiểm tra hợp đồng channel được shard                                                                      | Thay đổi liên quan đến Node                                   |
| `checks-node-core-*`               | Các shard kiểm thử Node lõi, loại trừ channel, bundled, contract, và extension lane                           | Thay đổi liên quan đến Node                                   |
| `check-*`                          | Tương đương cổng local chính được shard: prod types, lint, guards, test types, và strict smoke                | Thay đổi liên quan đến Node                                   |
| `check-additional-*`               | Kiến trúc, drift boundary/prompt được shard, guard extension, boundary package, và topology runtime           | Thay đổi liên quan đến Node                                   |
| `checks-node-compat-node22`        | Tuyến build và smoke tương thích Node 22                                                                      | Dispatch CI thủ công cho bản phát hành                        |
| `check-docs`                       | Kiểm tra định dạng tài liệu, lint, và liên kết hỏng                                                           | Tài liệu thay đổi                                             |
| `skills-python`                    | Ruff + pytest cho các skill có hậu thuẫn Python                                                               | Thay đổi liên quan đến skill Python                           |
| `checks-windows`                   | Kiểm thử process/path đặc thù Windows cộng với hồi quy import specifier runtime dùng chung                    | Thay đổi liên quan đến Windows                                |
| `macos-node`                       | Tuyến kiểm thử TypeScript trên macOS dùng các artifact build dùng chung                                       | Thay đổi liên quan đến macOS                                  |
| `macos-swift`                      | Swift lint, build, và test cho ứng dụng macOS                                                                 | Thay đổi liên quan đến macOS                                  |
| `ios-build`                        | Tạo dự án Xcode cộng với build simulator cho ứng dụng iOS                                                     | Ứng dụng iOS, shared app kit, hoặc thay đổi Swabble           |
| `android`                          | Unit test Android cho cả hai flavor cộng với một bản build debug APK                                          | Thay đổi liên quan đến Android                                |
| `test-performance-agent`           | Tối ưu kiểm thử chậm Codex hằng ngày sau hoạt động đáng tin cậy                                               | CI trên main thành công hoặc dispatch thủ công                |
| `openclaw-performance`             | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với mock-provider, deep-profile, và tuyến live GPT 5.5 | Dispatch theo lịch và thủ công                                |

## Thứ tự fail-fast

1. `runner-admission` chỉ chờ các push chuẩn lên `main`; push mới hơn sẽ hủy lượt chạy trước khi đăng ký Blacksmith.
2. `preflight` quyết định những tuyến nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
4. `build-artifacts` chạy chồng lấp với các tuyến Linux nhanh để consumer downstream có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
5. Các tuyến nền tảng và runtime nặng hơn mở rộng sau đó: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi có push mới hơn trên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lượt chạy mới nhất cho cùng ref cũng đang thất bại. Các job ma trận dùng `fail-fast: false`, và `build-artifacts` báo cáo trực tiếp các lỗi embedded channel, core-support-boundary, và gateway-watch thay vì xếp hàng các job verifier nhỏ. Khóa đồng thời CI tự động được đánh phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lượt chạy main mới hơn. Các lượt chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lượt chạy đang tiến hành.

Dùng `pnpm ci:timings`, `pnpm ci:timings:recent`, hoặc `node scripts/ci-run-timings.mjs <run-id>` để tóm tắt thời gian treo tường, thời gian hàng đợi, các job chậm nhất, lỗi, và rào cản fanout `pnpm-store-warmup` từ GitHub Actions. CI cũng tải lên cùng bản tóm tắt lượt chạy dưới dạng artifact `ci-timings-summary`. Với thời gian build, kiểm tra bước `Build dist` của job `build-artifacts`: `pnpm build:ci-artifacts` in `[build-all] phase timings:` và bao gồm `ui:build`; job cũng tải lên artifact `startup-memory`.

Với các lượt chạy pull request, job timing-summary ở cuối chạy helper từ revision cơ sở đáng tin cậy trước khi truyền `GH_TOKEN` cho `gh run view`. Điều đó giữ truy vấn có token nằm ngoài mã do nhánh kiểm soát trong khi vẫn tóm tắt lượt chạy CI hiện tại của pull request.

## Ngữ cảnh và bằng chứng PR

PR của contributor bên ngoài chạy một cổng ngữ cảnh và bằng chứng PR từ
`.github/workflows/real-behavior-proof.yml`. Workflow checkout commit cơ sở đáng
tin cậy và chỉ đánh giá phần thân PR; nó không thực thi mã từ nhánh của
contributor.

Cổng này áp dụng cho tác giả PR không phải owner, member, collaborator, hoặc bot
của repository. Nó pass khi phần thân PR chứa các phần `What Problem This Solves`
và `Evidence` do tác giả viết. Bằng chứng có thể là một kiểm thử tập trung,
kết quả CI, ảnh chụp màn hình, bản ghi, đầu ra terminal, quan sát live, log đã
biên tập, hoặc liên kết artifact. Phần thân cung cấp ý định và xác thực hữu ích;
reviewer kiểm tra mã, kiểm thử, và CI để đánh giá tính đúng đắn.

Khi check thất bại, hãy cập nhật phần thân PR thay vì push thêm một commit mã.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi unit test trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng tự chúng không ép chạy các bản build native Windows, iOS, Android, hoặc macOS; các tuyến nền tảng đó vẫn được giới hạn theo thay đổi nguồn nền tảng.
- **Workflow Sanity** chạy `actionlint`, `zizmor` trên tất cả tệp YAML workflow, guard nội suy composite-action, và guard marker xung đột. Job `security-fast` có phạm vi PR cũng chạy `zizmor` trên các tệp workflow đã đổi để các phát hiện bảo mật workflow thất bại sớm trong đồ thị CI chính.
- **Tài liệu trên các push `main`** được kiểm tra bởi workflow `Docs` độc lập với cùng mirror tài liệu ClawHub mà CI dùng, vì vậy các push hỗn hợp mã+tài liệu không xếp hàng thêm shard `check-docs` của CI. Pull request và CI thủ công vẫn chạy `check-docs` từ CI khi tài liệu thay đổi.
- **TUI PTY** chạy trong shard Linux Node `checks-node-core-runtime-tui-pty` cho các thay đổi TUI. Shard chạy `test/vitest/vitest.tui-pty.config.ts` với `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, nên nó bao phủ cả tuyến fixture `TuiBackend` xác định và smoke `tui --local` chậm hơn chỉ mock endpoint model bên ngoài.
- **Các chỉnh sửa chỉ liên quan đến định tuyến CI, một số chỉnh sửa fixture kiểm thử lõi giá rẻ, và chỉnh sửa hẹp ở helper hợp đồng Plugin/định tuyến kiểm thử** dùng đường manifest chỉ Node nhanh: `preflight`, security, và một tác vụ `checks-fast-core` duy nhất. Đường này bỏ qua build artifact, tương thích Node 22, hợp đồng channel, toàn bộ shard lõi, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp kiểm tra.
- **Kiểm tra Node Windows** được giới hạn ở wrapper process/path đặc thù Windows, helper runner npm/pnpm/UI, cấu hình package manager, và các bề mặt workflow CI thực thi tuyến đó; các thay đổi nguồn, Plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn ở trên các tuyến Linux Node.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không dự trữ runner quá mức: hợp đồng plugin và hợp đồng kênh, mỗi nhóm chạy dưới dạng hai shard có trọng số được Blacksmith hỗ trợ với fallback runner GitHub tiêu chuẩn; các lane core unit fast/support chạy riêng; hạ tầng runtime lõi được tách giữa state, process/config, shared và ba shard miền cron; auto-reply chạy dưới dạng các worker cân bằng (với subtree reply được tách thành các shard agent-runner, dispatch và commands/state-routing); còn các cấu hình gateway/server tác nhân được tách trên các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã build. CI thông thường sau đó chỉ đóng gói các shard include-pattern hạ tầng cô lập vào các bundle xác định, tối đa 64 tệp kiểm thử, giúp giảm ma trận Node mà không gộp các bộ command/cron không cô lập, agents-core có trạng thái, hoặc gateway/server; các bộ nặng cố định vẫn dùng 8 vCPU trong khi các lane đã bundle và có trọng số thấp hơn dùng 4 vCPU. Pull request trên repository canonical dùng thêm một kế hoạch admission gọn: cùng các nhóm theo cấu hình chạy trong các subprocess cô lập bên trong kế hoạch Linux Node 34 job hiện tại, vì vậy một PR đơn lẻ không đăng ký toàn bộ ma trận Node hơn 70 job. Các lần push lên `main`, dispatch thủ công và cổng release vẫn giữ ma trận đầy đủ. Các kiểm thử trình duyệt rộng, QA, media và plugin linh tinh dùng cấu hình Vitest chuyên dụng của chúng thay vì catch-all plugin dùng chung. Các shard include-pattern ghi mục timing bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ một cấu hình với một shard đã lọc. `check-additional-*` giữ công việc compile/canary theo ranh giới package cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; danh sách boundary guard được chia thành một shard nặng về prompt và một shard kết hợp cho các dải guard còn lại, mỗi shard chạy đồng thời các guard độc lập được chọn và in timing theo từng check. Bài kiểm tra drift snapshot prompt happy-path Codex tốn kém chạy dưới dạng job bổ sung riêng cho CI thủ công và chỉ cho các thay đổi ảnh hưởng đến prompt, nên các thay đổi Node bình thường không liên quan không phải chờ sau quá trình tạo snapshot prompt lạnh, và các boundary shard vẫn cân bằng trong khi drift prompt vẫn được ghim vào PR gây ra nó; cùng flag đó bỏ qua quá trình tạo Vitest snapshot prompt bên trong shard core support-boundary artifact đã build. Gateway watch, kiểm thử kênh và shard core support-boundary chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Sau khi được nhận, CI Linux canonical cho phép tối đa 24 job kiểm thử Node đồng thời và
12 cho các lane fast/check nhỏ hơn; Windows và Android vẫn ở mức hai vì
các pool runner đó hẹp hơn.

Kế hoạch PR gọn phát ra 18 job Node cho bộ hiện tại: các nhóm whole-config
được batch trong subprocess cô lập với timeout batch 120 phút,
trong khi các nhóm include-pattern chia sẻ cùng ngân sách job có giới hạn.

CI Android chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, rồi build APK debug Play. Flavor third-party không có source set hoặc manifest riêng; lane kiểm thử đơn vị của nó vẫn biên dịch flavor với các flag BuildConfig SMS/call-log, đồng thời tránh job đóng gói APK debug trùng lặp trên mỗi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ kiểm tra dependency production, được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho lần cài đặt `dlx`) và `pnpm deadcode:unused-files`, thao tác này so sánh các phát hiện tệp không dùng trong production của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được review hoặc để lại mục allowlist đã cũ, trong khi vẫn giữ các bề mặt plugin động có chủ ý, generated, build, live-test và cầu nối package mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía mục tiêu từ hoạt động repository OpenClaw sang ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong comment issue;
- `clawsweeper_commit_review` cho yêu cầu review cấp commit trên các lần push `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, repository, số mục, URL, tiêu đề, trạng thái và đoạn trích ngắn cho comment hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ thân webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng sự kiện đã chuẩn hóa tới hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải gửi theo mặc định. Agent ClawSweeper nhận mục tiêu Discord trong prompt của nó và chỉ nên đăng lên `#clawsweeper` khi sự kiện bất ngờ, có thể hành động, rủi ro hoặc hữu ích về vận hành. Các lần mở, chỉnh sửa, nhiễu bot, nhiễu webhook trùng lặp và lưu lượng review bình thường nên dẫn tới `NO_REPLY`.

Hãy xem tiêu đề, comment, body, văn bản review, tên nhánh và thông điệp commit của GitHub là dữ liệu không đáng tin cậy trong suốt đường dẫn này. Chúng là đầu vào cho việc tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng buộc bật mọi lane có phạm vi không phải Android: shard Linux Node, shard bundled-plugin, shard hợp đồng plugin và kênh, tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra smoke artifact đã build, kiểm tra docs, Python skills, Windows, macOS, build iOS và Control UI i18n. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella release đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh prerelease plugin, shard chỉ dành cho release `agentic-plugins`, lượt quét batch extension đầy đủ và các lane Docker prerelease plugin bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với cổng release-validation được bật.

Các lần chạy thủ công dùng một concurrency group duy nhất để một bộ đầy đủ release-candidate không bị hủy bởi một lần push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch CI thủ công và fallback repository không canonical, quét chất lượng CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs ngoài CI và preflight install-smoke để ma trận Blacksmith có thể xếp hàng sớm hơn                                      |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard extension trọng số thấp hơn, `checks-fast-core`, shard hợp đồng plugin/kênh, phần lớn shard Linux Node bundled/trọng số thấp hơn, `check-guards`, `check-prod-types`, `check-test-types`, các shard `check-additional-*` được chọn và `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Các bộ Linux Node nặng được giữ lại, shard `check-additional-*` nặng về boundary/extension và `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (đủ nhạy CPU để 8 vCPU tốn nhiều hơn mức tiết kiệm được); build Docker install-smoke (thời gian xếp hàng 32 vCPU tốn nhiều hơn mức tiết kiệm được)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` trên `openclaw/openclaw`; fork fallback về `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` và `ios-build` trên `openclaw/openclaw`; fork fallback về `macos-26`                                                                                                                                                                                                   |

## Ngân sách đăng ký runner

Bucket đăng ký runner GitHub hiện tại của OpenClaw báo cáo 10.000 lượt đăng ký
runner self-hosted mỗi 5 phút trong `ghx api rate_limit`. Kiểm tra lại
`actions_runner_registration` trước mỗi lượt tinh chỉnh vì GitHub có thể thay đổi
bucket này. Giới hạn này được chia sẻ bởi tất cả lượt đăng ký runner Blacksmith trong
tổ chức `openclaw`, nên việc thêm một bản cài đặt Blacksmith khác không thêm
bucket mới.

Xem nhãn Blacksmith là tài nguyên khan hiếm để kiểm soát burst. Các job
chỉ định tuyến, thông báo, tóm tắt, chọn shard hoặc chạy quét CodeQL ngắn nên
ở lại trên runner do GitHub host, trừ khi chúng có nhu cầu riêng cho Blacksmith
đã được đo lường. Bất kỳ ma trận Blacksmith mới, `max-parallel` lớn hơn hoặc
workflow tần suất cao nào cũng phải thể hiện số lượt đăng ký trong trường hợp xấu nhất
và giữ mục tiêu cấp tổ chức dưới khoảng 60% bucket đang hoạt động. Với bucket
10.000 lượt đăng ký hiện tại, điều đó nghĩa là mục tiêu vận hành 6.000 lượt đăng ký,
để lại khoảng dự phòng cho các repository đồng thời, retry và burst chồng lấn.

CI repository canonical giữ Blacksmith làm đường dẫn runner mặc định cho các lần chạy push và pull-request thông thường. `workflow_dispatch` và các lần chạy repository không canonical dùng runner do GitHub host, nhưng các lần chạy canonical thông thường hiện không thăm dò tình trạng hàng đợi Blacksmith hoặc tự động fallback về nhãn do GitHub host khi Blacksmith không khả dụng.

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

## Hiệu năng OpenClaw

`OpenClaw Performance` là quy trình hiệu năng sản phẩm/runtime. Quy trình này chạy hằng ngày trên `main` và có thể được kích hoạt thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Việc kích hoạt thủ công thường benchmark ref của workflow. Đặt `target_ref` để benchmark một thẻ phát hành hoặc nhánh khác bằng triển khai workflow hiện tại. Đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được khóa theo ref được kiểm thử, và mỗi `index.md` ghi lại ref/SHA được kiểm thử, ref/SHA của workflow, ref Kova, hồ sơ, chế độ xác thực lane, model, số lần lặp và bộ lọc kịch bản.

Workflow cài đặt OCM từ một bản phát hành được ghim và Kova từ `openclaw/Kova` tại đầu vào `kova_ref` được ghim, rồi chạy ba lane:

- `mock-provider`: các kịch bản chẩn đoán Kova chạy trên runtime build cục bộ với xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: profiling CPU/heap/trace cho các điểm nóng khi khởi động, Gateway và lượt tác tử.
- `live-openai-candidate`: một lượt tác tử OpenAI `openai/gpt-5.5` thật, bị bỏ qua khi không có `OPENAI_API_KEY`.

Lane mock-provider cũng chạy các probe nguồn gốc OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ trên các trường hợp khởi động mặc định, hook và 50 Plugin; RSS khi nhập Plugin đóng gói, các vòng lặp hello `channel-chat-baseline` mock-OpenAI lặp lại, lệnh khởi động CLI chạy với Gateway đã khởi động, và probe hiệu năng smoke trạng thái SQLite. Khi báo cáo nguồn mock-provider đã xuất bản trước đó có sẵn cho ref được kiểm thử, phần tóm tắt nguồn so sánh các giá trị RSS và heap hiện tại với baseline đó và đánh dấu các mức tăng RSS lớn là `watch`. Tóm tắt Markdown của probe nguồn nằm tại `source/index.md` trong gói báo cáo, với JSON thô đặt cạnh đó.

Mỗi lane tải artifact GitHub lên. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các gói, `index.md` và artifact probe nguồn vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ ref được kiểm thử hiện tại được ghi thành `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực phát hành đầy đủ

`Full Release Validation` là workflow thủ công bao trùm cho việc “chạy mọi thứ trước khi phát hành”. Workflow này nhận một nhánh, thẻ hoặc SHA commit đầy đủ, kích hoạt workflow `CI` thủ công với mục tiêu đó, kích hoạt `Plugin Prerelease` cho bằng chứng Plugin/gói/tĩnh/Docker chỉ dành cho phát hành, và kích hoạt `OpenClaw Release Checks` cho install smoke, chấp nhận gói, kiểm tra gói đa hệ điều hành, render maturity scorecard từ bằng chứng hồ sơ QA, tương đương QA Lab, Matrix và các lane Telegram. Hồ sơ stable và full luôn bao gồm toàn bộ phạm vi soak đường dẫn phát hành live/E2E và Docker; hồ sơ beta có thể bật bằng `run_release_soak=true`. E2E Telegram của gói chuẩn chạy bên trong Package Acceptance, vì vậy một ứng viên đầy đủ sẽ không khởi động poller live trùng lặp. Sau khi xuất bản, truyền `release_package_spec` để tái sử dụng gói npm đã phát hành trên release checks, Package Acceptance, Docker, đa hệ điều hành và Telegram mà không build lại. Chỉ dùng `npm_telegram_package_spec` cho một lần chạy lại Telegram tập trung trên gói đã xuất bản. Lane gói live của Plugin Codex dùng cùng trạng thái đã chọn theo mặc định: `release_package_spec=openclaw@<tag>` đã xuất bản suy ra `codex_plugin_spec=npm:@openclaw/codex@<tag>`, trong khi các lượt chạy SHA/artifact đóng gói `extensions/codex` từ ref đã chọn. Đặt `codex_plugin_spec` tường minh cho nguồn Plugin tùy chỉnh như đặc tả `npm:`, `npm-pack:` hoặc `git:`.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết ma trận giai đoạn, tên job workflow chính xác, khác biệt giữa các hồ sơ, artifact và các handle chạy lại tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Kích hoạt workflow này từ `release/YYYY.M.PATCH` hoặc `main` sau khi thẻ phát hành tồn tại và sau khi preflight npm OpenClaw đã thành công. Workflow xác minh `pnpm plugins:sync:check`, kích hoạt `Plugin NPM Release` cho tất cả gói Plugin có thể xuất bản, kích hoạt `Plugin ClawHub Release` cho cùng SHA phát hành, và chỉ sau đó mới kích hoạt `OpenClaw NPM Release` với `preflight_run_id` đã lưu. Phát hành stable cũng yêu cầu `windows_node_tag` chính xác; workflow xác minh bản phát hành nguồn Windows và so sánh bộ cài x64/ARM64 của nó với đầu vào `windows_node_installer_digests` đã được ứng viên phê duyệt trước mọi workflow con xuất bản, sau đó quảng bá và xác minh cùng các digest bộ cài được ghim đó cùng hợp đồng asset đồng hành và checksum chính xác trước khi xuất bản bản nháp phát hành GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit được ghim trên một nhánh thay đổi nhanh, hãy dùng helper thay vì `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref kích hoạt workflow GitHub phải là nhánh hoặc thẻ, không phải SHA commit thô. Helper đẩy một nhánh tạm `release-ci/<sha>-...` tại SHA mục tiêu, kích hoạt `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con có `headSha` khớp với mục tiêu, và xóa nhánh tạm khi lượt chạy hoàn tất. Bộ xác minh bao trùm cũng thất bại nếu bất kỳ workflow con nào chạy ở SHA khác.

`release_profile` kiểm soát độ rộng live/provider được truyền vào release checks. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn cố ý muốn ma trận provider/media tư vấn rộng. Release checks stable và full luôn chạy toàn bộ soak đường dẫn phát hành live/E2E và Docker; hồ sơ beta có thể bật bằng `run_release_soak=true`.

- `minimum` giữ các lane OpenAI/lõi nhanh nhất có tính trọng yếu với phát hành.
- `stable` thêm tập provider/backend stable.
- `full` chạy ma trận provider/media tư vấn rộng.

Workflow bao trùm ghi lại id lượt chạy con đã kích hoạt, và job cuối cùng `Verify full validation` kiểm tra lại kết luận hiện tại của các lượt chạy con rồi thêm bảng job chậm nhất cho từng lượt chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại job verifier cha để làm mới kết quả bao trùm và tóm tắt thời gian.

Để phục hồi, cả `Full Release Validation` và `OpenClaw Release Checks` đều nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` cho chỉ workflow con full CI bình thường, `plugin-prerelease` cho chỉ workflow con prerelease Plugin, `release-checks` cho mọi workflow con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên workflow bao trùm. Điều này giữ việc chạy lại hộp phát hành bị lỗi trong phạm vi giới hạn sau một bản sửa tập trung. Với một lane đa hệ điều hành bị lỗi, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh đa hệ điều hành dài phát ra dòng Heartbeat và tóm tắt packaged-upgrade bao gồm thời gian theo từng pha. Các lane QA release-check mang tính tư vấn ngoại trừ cổng phạm vi công cụ runtime chuẩn, vốn sẽ chặn khi các công cụ động OpenClaw bắt buộc bị lệch hoặc biến mất khỏi tóm tắt tier chuẩn.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho kiểm tra đa hệ điều hành và Package Acceptance, cộng với workflow Docker đường dẫn phát hành live/E2E khi chạy phạm vi soak. Điều này giữ byte của gói nhất quán trên các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều job con. Với lane live npm-plugin Codex, release checks hoặc truyền một đặc tả Plugin đã xuất bản khớp được suy ra từ `release_package_spec`, truyền `codex_plugin_spec` do operator cung cấp, hoặc để trống đầu vào để script Docker đóng gói Plugin Codex của checkout đã chọn.

Các lượt chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all` thay thế workflow bao trùm cũ hơn. Monitor cha hủy mọi workflow con mà nó đã kích hoạt khi workflow cha bị hủy, vì vậy xác thực main mới hơn không bị kẹt sau một lượt release-check cũ kéo dài hai giờ. Xác thực nhánh/thẻ phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Các shard live và E2E

Workflow con live/E2E phát hành giữ phạm vi `pnpm test:live` native rộng, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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
- các shard media âm thanh/video được tách và các shard nhạc được lọc theo provider

Điều đó giữ nguyên phạm vi file trong khi giúp việc chạy lại và chẩn đoán các lỗi provider live chậm dễ hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media` và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard media native live chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ kiểm thử live dùng Docker trên runner Blacksmith bình thường — job container không phải là nơi phù hợp để khởi chạy kiểm thử Docker lồng nhau.

Các shard mô hình/backend trực tiếp dựa trên Docker dùng một image `ghcr.io/openclaw/openclaw-live-test:<sha>` dùng chung riêng cho mỗi commit được chọn. Quy trình phát hành trực tiếp build và push image đó một lần, sau đó các shard mô hình trực tiếp Docker, Gateway được chia shard theo provider, backend CLI, liên kết ACP và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang giới hạn `timeout` rõ ràng ở cấp script, thấp hơn timeout của job workflow, để container bị kẹt hoặc đường dọn dẹp thất bại nhanh thay vì tiêu hết ngân sách kiểm tra phát hành. Nếu các shard đó tự rebuild toàn bộ target Docker nguồn một cách độc lập, lần chạy phát hành đã cấu hình sai và sẽ lãng phí thời gian thực cho các lần build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng chạy sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256 và profile trong phần tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory của tarball, chuẩn bị image Docker package-digest khi cần, và chạy các lane Docker đã chọn với gói đó thay vì đóng gói checkout workflow. Khi một profile chọn nhiều `docker_lanes` có mục tiêu, workflow tái sử dụng chuẩn bị gói và các image dùng chung một lần, rồi fan out các lane đó thành các job Docker có mục tiêu chạy song song với artifact duy nhất.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Chấp nhận gói đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài một spec npm đã phát hành.
4. `summary` làm workflow thất bại nếu phân giải gói, chấp nhận Docker, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng nguồn này cho chấp nhận bản prerelease/stable đã phát hành.
- `source=ref` đóng gói một nhánh, tag hoặc SHA commit đầy đủ đáng tin cậy trong `package_ref`. Bộ phân giải fetch các nhánh/tag OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử nhánh repository hoặc một tag phát hành, cài deps trong một worktree tách rời, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải một `.tgz` HTTPS công khai; bắt buộc có `package_sha256`. Đường này từ chối thông tin xác thực trong URL, cổng HTTPS không mặc định, hostname hoặc IP đã phân giải thuộc private/internal/special-use, và redirect ra ngoài cùng chính sách an toàn công khai.
- `source=trusted-url` tải một `.tgz` HTTPS từ chính sách trusted-source có tên trong `.github/package-trusted-sources.json`; bắt buộc có `package_sha256` và `trusted_source_id`. Chỉ dùng nguồn này cho mirror doanh nghiệp do maintainer sở hữu hoặc repository gói riêng cần host, cổng, tiền tố đường dẫn, host redirect hoặc phân giải mạng riêng đã cấu hình. Nếu chính sách khai báo xác thực bearer, workflow dùng secret cố định `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; thông tin xác thực nhúng trong URL vẫn bị từ chối.
- `source=artifact` tải một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên cung cấp cho artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy bài kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng độ phủ Plugin ngoại tuyến để xác thực gói đã phát hành không bị phụ thuộc vào khả dụng trực tiếp của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường spec npm đã phát hành được giữ lại cho các dispatch độc lập.

Để biết chính sách kiểm thử cập nhật và Plugin chuyên dụng, bao gồm lệnh cục bộ,
lane Docker, input Chấp nhận gói, mặc định phát hành và phân loại lỗi,
xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Kiểm tra phát hành gọi Chấp nhận gói với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng di trú gói, cập nhật, cài đặt skill ClawHub trực tiếp, dọn dẹp phụ thuộc Plugin cũ, sửa cài đặt Plugin đã cấu hình, Plugin ngoại tuyến, plugin-update và Telegram trên cùng tarball gói đã phân giải. Đặt `release_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks sau khi phát hành beta để chạy cùng ma trận với gói npm đã ship mà không rebuild; chỉ đặt `package_acceptance_package_spec` khi Chấp nhận gói cần một gói khác với phần còn lại của xác thực phát hành. Kiểm tra phát hành cross-OS vẫn bao phủ onboarding, installer và hành vi nền tảng đặc thù theo OS; xác thực sản phẩm gói/cập nhật nên bắt đầu bằng Chấp nhận gói. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã phát hành cho mỗi lần chạy trong đường phát hành chặn. Trong Chấp nhận gói, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã phát hành dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng qua bốn bản npm stable mới nhất cộng với các bản phát hành ranh giới tương thích Plugin được ghim và fixture theo dạng issue cho cấu hình Feishu, các tệp bootstrap/persona được giữ lại, cài đặt OpenClaw Plugin đã cấu hình, đường dẫn log dấu ngã và root phụ thuộc Plugin legacy cũ. Các lựa chọn published-upgrade survivor đa baseline được chia shard theo baseline thành các job runner Docker có mục tiêu riêng. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã phát hành một cách đầy đủ, không phải độ rộng CI Full Release thông thường. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã phát hành cấu hình baseline bằng công thức lệnh `openclaw config set` được bake sẵn, ghi lại các bước công thức trong `summary.json`, và probe `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane fresh cho gói và installer Windows cũng xác minh rằng một gói đã cài đặt có thể import override browser-control từ một đường dẫn Windows tuyệt đối thô. Smoke agent-turn cross-OS OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì `openai/gpt-5.5`, để bằng chứng cài đặt và Gateway vẫn ở trên mô hình kiểm thử GPT-5 trong khi tránh mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Chấp nhận gói có các cửa sổ tương thích legacy có giới hạn cho các gói đã phát hành. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường tương thích:

- các mục QA riêng đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các tệp bị bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua tiểu trường hợp lưu bền `gateway install --wrapper` khi gói không expose flag đó;
- `update-channel-switch` có thể cắt bỏ `patchedDependencies` pnpm bị thiếu khỏi fixture git giả dẫn xuất từ tarball và có thể ghi log `update.channel` được lưu bền bị thiếu;
- các smoke Plugin có thể đọc vị trí install-record legacy hoặc chấp nhận thiếu lưu bền install-record marketplace;
- `plugin-update` có thể cho phép di trú metadata cấu hình trong khi vẫn yêu cầu install record và hành vi không cài lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu metadata build cục bộ đã được ship. Các gói muộn hơn phải đáp ứng các contract hiện đại; cùng điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi debug một lần chạy chấp nhận gói thất bại, hãy bắt đầu ở phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời gian từng phase và lệnh chạy lại. Ưu tiên chạy lại profile gói thất bại hoặc các lane Docker chính xác thay vì chạy lại xác thực phát hành đầy đủ.

## Smoke cài đặt

Workflow `Install Smoke` riêng tái sử dụng cùng script phạm vi thông qua job `preflight` của nó. Nó tách độ phủ smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho các pull request chạm tới các bề mặt Docker/gói, thay đổi gói/manifest Plugin đóng gói kèm, hoặc các bề mặt Plugin SDK/plugin/channel/gateway lõi mà các tác vụ Docker smoke kiểm tra. Các thay đổi Plugin đóng gói kèm chỉ ở nguồn, chỉnh sửa chỉ ở test, và chỉnh sửa chỉ ở tài liệu không giữ trước Docker worker. Đường dẫn nhanh build image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa shared-workspace của agents, chạy e2e gateway-network trong container, xác minh build arg của một extension đóng gói kèm, và chạy profile Docker Plugin đóng gói kèm có giới hạn trong thời gian chờ lệnh tổng hợp 240 giây (mỗi Docker run của từng kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update của installer cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra release qua workflow-call, và các pull request thật sự chạm tới bề mặt installer/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image smoke Dockerfile gốc GHCR theo target-SHA, rồi chạy cài đặt gói QR, smoke Dockerfile/gateway gốc, smoke installer/update, và Docker E2E Plugin đóng gói kèm nhanh dưới dạng các job riêng để công việc installer không phải chờ sau các smoke image gốc.

Các lần push lên `main` (bao gồm merge commit) không ép dùng đường dẫn đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một lần push, workflow giữ Docker smoke nhanh và để install smoke đầy đủ cho xác thực hằng đêm hoặc release.

Smoke image-provider cài đặt Bun toàn cục chậm được chặn riêng bởi `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra release, và các dispatch thủ công `Install Smoke` có thể chọn bật nó, nhưng pull request và push lên `main` thì không. CI PR thông thường vẫn chạy lane hồi quy launcher Bun nhanh cho các thay đổi liên quan đến Node. Các test Docker QR và installer giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` prebuild một image live-test dùng chung, đóng gói OpenClaw một lần thành tarball npm, và build hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane installer/update/plugin-dependency;
- một image chức năng cài cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi plan đã chọn. Scheduler chọn image cho từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số tinh chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot pool chính cho các lane thông thường.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot tail-pool nhạy cảm với provider.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để provider không throttle.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5        | Giới hạn lane cài đặt npm đồng thời.                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều service đồng thời.                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Khoảng giãn giữa các lần khởi động lane để tránh bão tạo Docker daemon; đặt `0` để không giãn. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Thời gian chờ dự phòng cho từng lane (120 phút); các lane live/tail được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in plan của scheduler mà không chạy lane.                                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua cleanup smoke để agents có thể tái hiện một lane lỗi. |

Một lane nặng hơn giới hạn hiệu lực của nó vẫn có thể bắt đầu từ một pool trống, rồi chạy một mình cho đến khi nhả dung lượng. Preflight tổng hợp cục bộ kiểm tra Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời lượng lane để sắp xếp lane dài nhất trước, và mặc định dừng lập lịch lane trong pool mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` xem cần phạm vi gói, loại image, image live, lane và credential nào. Sau đó `scripts/docker-e2e.mjs` chuyển plan đó thành output và summary của GitHub. Nó hoặc đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải artifact gói từ lần chạy hiện tại, hoặc tải artifact gói từ `package_artifact_run_id`; xác thực inventory của tarball; build và push các image Docker E2E GHCR bare/functional gắn tag theo digest gói qua cache layer Docker của Blacksmith khi plan cần các lane có cài gói; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các image theo digest gói hiện có thay vì build lại. Các lần pull image Docker được retry với thời gian chờ giới hạn 180 giây cho mỗi lần thử để một stream registry/cache bị kẹt retry nhanh thay vì tiêu tốn phần lớn critical path của CI.

### Các chunk đường dẫn release

Phạm vi Docker release chạy các job chia chunk nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi chunk chỉ pull loại image nó cần và thực thi nhiều lane qua cùng scheduler có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các chunk Docker release hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `package-update-openai` bao gồm lane gói Plugin Codex live, cài gói OpenClaw ứng viên, cài Plugin Codex từ `codex_plugin_spec` hoặc tarball cùng ref với phê duyệt cài đặt Codex CLI rõ ràng, chạy preflight Codex CLI, rồi chạy nhiều lượt agent OpenClaw trong cùng phiên với OpenAI. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các alias Plugin/runtime tổng hợp. Alias lane `install-e2e` vẫn là alias chạy lại thủ công tổng hợp cho cả hai lane installer provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ chunk `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật bundled-channel retry một lần cho lỗi mạng npm tạm thời.

Mỗi chunk upload `.artifacts/docker-tests/` với log lane, thời lượng, `summary.json`, `failures.json`, thời lượng phase, JSON plan scheduler, bảng lane chậm, và lệnh chạy lại cho từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn trên các image đã chuẩn bị thay vì các job chunk, giúp việc debug lane lỗi được giới hạn trong một job Docker có mục tiêu và chuẩn bị, tải xuống, hoặc tái sử dụng artifact gói cho lần chạy đó; nếu lane đã chọn là lane Docker live, job có mục tiêu sẽ build image live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo cho từng lane bao gồm `package_artifact_run_id`, `package_artifact_name`, và input image đã chuẩn bị khi các giá trị đó tồn tại, để một lane lỗi có thể tái sử dụng đúng gói và image từ lần chạy lỗi.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Plugin Prerelease

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, push lên `main`, và dispatch CI thủ công độc lập giữ bộ này tắt. Nó cân bằng test Plugin đóng gói kèm trên tám extension worker; các job extension shard đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một Vitest worker cho mỗi nhóm và heap Node lớn hơn để các batch Plugin nặng import không tạo thêm job CI. Đường dẫn prerelease Docker chỉ dành cho release gom các lane Docker có mục tiêu thành nhóm nhỏ để tránh giữ trước hàng chục runner cho các job một đến ba phút. Workflow cũng upload artifact thông tin `plugin-inspector-advisory` từ `@openclaw/plugin-inspector`; các phát hiện inspector là đầu vào triage và không thay đổi gate chặn Plugin Prerelease.

## QA Lab

QA Lab có các lane CI chuyên dụng bên ngoài workflow smart-scoped chính. Agentic parity nằm lồng dưới các harness QA rộng và release, không phải workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi parity cần đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó fan out lane mock parity, lane Matrix live, và các lane Telegram và Discord live thành các job song song. Các job live dùng environment `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Kiểm tra release chạy các lane transport live Matrix và Telegram với provider mock xác định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để contract channel được cô lập khỏi độ trễ model live và khởi động provider-plugin thông thường. Gateway transport live tắt memory search vì QA parity bao phủ hành vi bộ nhớ riêng; khả năng kết nối provider được bao phủ bởi các bộ live model, native provider, và Docker provider riêng.

Matrix dùng `--profile fast` cho các gate theo lịch và release, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho release trước khi phê duyệt release; gate QA parity của nó chạy các pack ứng viên và baseline thành các job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ để so sánh parity cuối cùng.

Với PR thông thường, hãy theo bằng chứng CI/check theo phạm vi thay vì coi parity là trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` cố ý là bộ quét bảo mật lượt đầu hẹp, không phải quét toàn bộ repository. Các lần chạy bảo vệ hằng ngày, thủ công, và pull request không phải draft quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Guard pull request vẫn nhẹ: nó chỉ khởi động cho các thay đổi dưới `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. CodeQL Android và macOS không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Đường cơ sở xác thực, bí mật, hộp cát, cron và Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cùng với runtime Plugin kênh, Gateway, Plugin SDK, bí mật, các điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt SSRF lõi, phân tích cú pháp IP, bảo vệ mạng, web-fetch và chính sách SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, helper thực thi tiến trình, phân phối ra ngoài và cổng thực thi công cụ của tác nhân                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của cài đặt Plugin, loader, manifest, registry, cài đặt bằng trình quản lý gói, tải nguồn và hợp đồng gói Plugin SDK |

### Các phân mảnh bảo mật theo nền tảng

- `CodeQL Android Critical Security` — phân mảnh bảo mật Android theo lịch. Xây dựng ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được kiểm tra hợp lệ workflow chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — phân mảnh bảo mật macOS hằng tuần/thủ công. Xây dựng ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF đã tải lên và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn thời gian chạy ngay cả khi sạch.

### Các danh mục Chất lượng Nghiêm trọng

`CodeQL Critical Quality` là phân mảnh phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript phi bảo mật ở mức độ nghiêm trọng lỗi trên các bề mặt hẹp có giá trị cao trên runner Linux do GitHub lưu trữ để các lượt quét chất lượng không tiêu tốn ngân sách đăng ký runner Blacksmith. Chốt bảo vệ pull request của nó cố ý nhỏ hơn hồ sơ theo lịch: PR không phải bản nháp chỉ chạy các phân mảnh `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` và `plugin-sdk-reply-runtime` tương ứng cho thay đổi trong mã thực thi lệnh/mô hình/công cụ của tác nhân và điều phối phản hồi, mã schema/cấu hình/migration/IO, mã xác thực/bí mật/hộp cát/bảo mật, runtime kênh lõi và Plugin kênh đi kèm, giao thức Gateway/phương thức máy chủ, runtime bộ nhớ/keo SDK, MCP/tiến trình/phân phối ra ngoài, runtime nhà cung cấp/danh mục mô hình, hàng đợi chẩn đoán phiên/phân phối, loader Plugin, Plugin SDK/hợp đồng gói hoặc runtime phản hồi Plugin SDK. Thay đổi cấu hình CodeQL và workflow chất lượng chạy đủ mười hai phân mảnh chất lượng PR.

Điều phối thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là móc hướng dẫn/lặp để chạy riêng một phân mảnh chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật xác thực, bí mật, hộp cát, cron và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Hợp đồng schema cấu hình, migration, chuẩn hóa và IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đi kèm                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Hợp đồng runtime thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi tự động trả lời, và mặt phẳng điều khiển ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, helper giám sát tiến trình và hợp đồng phân phối ra ngoài                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, keo kích hoạt runtime bộ nhớ và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi phản hồi, hàng đợi phân phối phiên, helper liên kết/phân phối phiên ra ngoài, bề mặt gói sự kiện/log chẩn đoán và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối phản hồi đến Plugin SDK, helper payload/chia đoạn/runtime phản hồi, tùy chọn phản hồi kênh, hàng đợi phân phối và helper liên kết phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, xác thực và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/danh mục nhà cung cấp và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Khởi động Control UI, lưu bền cục bộ, luồng điều khiển Gateway và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime fetch/search web lõi, IO phương tiện, hiểu phương tiện, tạo ảnh và tạo phương tiện                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng loader, registry, bề mặt công khai và entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và helper hợp đồng gói plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp nối có phạm vi hoặc được phân mảnh sau khi các hồ sơ hẹp đã ổn định về runtime và tín hiệu.

## Workflow bảo trì

### Tác nhân Tài liệu

Workflow `Docs Agent` là một luồng bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được đưa vào. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và điều phối thủ công có thể chạy trực tiếp. Các lần gọi workflow-run sẽ bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ qua. Khi chạy, nó rà soát dải commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, nên một lượt chạy hằng giờ có thể bao phủ mọi thay đổi trên main tích lũy kể từ lượt tài liệu cuối cùng.

### Tác nhân Hiệu năng Kiểm thử

Workflow `Test Performance Agent` là một luồng bảo trì Codex theo sự kiện cho các kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Điều phối thủ công bỏ qua chốt hoạt động hằng ngày đó. Luồng này xây dựng báo cáo hiệu năng Vitest được nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ nguyên độ phủ thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử baseline đang pass. Báo cáo được nhóm ghi lại thời gian treo theo từng cấu hình và RSS tối đa trên Linux và macOS, nên so sánh trước/sau hiển thị delta bộ nhớ kiểm thử cạnh delta thời lượng. Nếu baseline có kiểm thử failing, Codex chỉ có thể sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau tác nhân phải pass trước khi bất cứ thứ gì được commit. Khi `main` tiến lên trước khi bot push được đưa vào, luồng này rebase bản vá đã xác thực, chạy lại `pnpm check:changed` và thử push lại; các bản vá cũ xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub lưu trữ để action Codex có thể giữ cùng tư thế an toàn drop-sudo như tác nhân tài liệu.

### PR trùng lặp sau khi hợp nhất

Workflow `Duplicate PRs After Merge` là workflow maintainer thủ công để dọn dẹp bản trùng lặp sau khi đưa vào. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã đưa vào đã được merge và mỗi bản trùng lặp hoặc có issue được tham chiếu chung hoặc có các hunk thay đổi chồng lấp.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Chốt kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Chốt kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck prod lõi và kiểm thử lõi cộng lint/guard lõi;
- thay đổi chỉ kiểm thử lõi chỉ chạy typecheck kiểm thử lõi cộng lint lõi;
- thay đổi production extension chạy typecheck prod extension và kiểm thử extension cộng lint extension;
- thay đổi chỉ kiểm thử extension chạy typecheck kiểm thử extension cộng lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (các lượt quét Vitest extension vẫn là công việc kiểm thử rõ ràng);
- bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc root có mục tiêu;
- thay đổi root/cấu hình không xác định fail safe sang mọi lane kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý rẻ hơn `check:changed`: chỉnh sửa kiểm thử trực tiếp tự chạy chính chúng, chỉnh sửa nguồn ưu tiên mapping rõ ràng, sau đó đến kiểm thử sibling và phần phụ thuộc import-graph. Cấu hình phân phối group-room dùng chung là một trong các mapping rõ ràng: thay đổi đối với cấu hình phản hồi hiển thị trong nhóm, chế độ phân phối phản hồi nguồn hoặc prompt hệ thống message-tool được định tuyến qua các kiểm thử phản hồi lõi cộng hồi quy phân phối Discord và Slack để thay đổi mặc định dùng chung fail trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập mapped rẻ không còn là proxy đáng tin cậy.

## Xác thực Testbox

Crabbox là wrapper hộp từ xa do repo sở hữu cho proof Linux của maintainer. Dùng nó
từ root repo khi một kiểm tra quá rộng cho vòng lặp chỉnh sửa cục bộ, khi tính
tương đương CI quan trọng, hoặc khi proof cần bí mật, Docker, lane gói,
hộp tái sử dụng hoặc log từ xa. Backend OpenClaw bình thường là
`blacksmith-testbox`; dung lượng AWS/Hetzner sở hữu là phương án dự phòng cho sự cố Blacksmith,
vấn đề quota hoặc kiểm thử dung lượng sở hữu rõ ràng.

Các lần chạy Blacksmith dựa trên Crabbox sẽ khởi động sẵn, nhận, đồng bộ, chạy, báo cáo và dọn dẹp
các Testbox dùng một lần. Kiểm tra độ hợp lệ đồng bộ tích hợp sẽ dừng nhanh khi các tệp
gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short`
hiển thị ít nhất 200 mục xóa đã được theo dõi. Với các PR cố ý xóa số lượng lớn, hãy đặt
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lệnh từ xa.

Crabbox cũng kết thúc một lệnh gọi Blacksmith CLI cục bộ nếu lệnh đó ở trong
giai đoạn đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` để tắt cơ chế bảo vệ đó, hoặc dùng một
giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Trước lần chạy đầu tiên, kiểm tra wrapper từ gốc repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper của repo từ chối một binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider một cách tường minh dù `.crabbox.yaml` đã có mặc định owned-cloud. Trong các worktree Codex hoặc checkout được liên kết/thưa, tránh script cục bộ `pnpm crabbox:run` vì pnpm có thể đồng bộ lại dependency trước khi Crabbox khởi động; thay vào đó hãy gọi trực tiếp node wrapper:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Các lần chạy dựa trên Blacksmith yêu cầu Crabbox 0.22.0 hoặc mới hơn để wrapper nhận được hành vi đồng bộ, hàng đợi và dọn dẹp Testbox hiện tại. Khi dùng checkout anh em, hãy build lại binary cục bộ bị ignore trước khi làm việc về thời gian hoặc bằng chứng:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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
  "corepack pnpm check:changed"
```

Chạy lại bài test tập trung:

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

Đọc tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Với các lần chạy
Blacksmith Testbox được ủy quyền, mã thoát của Crabbox wrapper và tóm tắt JSON là
kết quả lệnh. Lần chạy GitHub Actions được liên kết sở hữu việc hydration và keepalive; nó
có thể kết thúc là `cancelled` khi Testbox bị dừng từ bên ngoài sau khi lệnh SSH
đã trả về. Hãy xem đó là một hiện vật dọn dẹp/trạng thái trừ khi
`exitCode` của wrapper khác 0 hoặc đầu ra lệnh hiển thị test thất bại.
Các lần chạy Crabbox dựa trên Blacksmith dùng một lần nên tự động dừng Testbox;
nếu một lần chạy bị ngắt hoặc việc dọn dẹp không rõ ràng, hãy kiểm tra các box đang hoạt động và chỉ dừng
các box bạn đã tạo:

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

Nếu Crabbox là lớp bị hỏng nhưng chính Blacksmith vẫn hoạt động, chỉ dùng
Blacksmith trực tiếp cho chẩn đoán như `list`, `status`, và dọn dẹp. Sửa đường dẫn
Crabbox trước khi xem một lần chạy Blacksmith trực tiếp là bằng chứng maintainer.

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các
warmup mới nằm ở trạng thái `queued` mà không có IP hoặc URL lần chạy Actions sau vài phút,
hãy xem đó là áp lực từ provider Blacksmith, hàng đợi, billing hoặc giới hạn tổ chức. Dừng các
id đang xếp hàng mà bạn đã tạo, tránh khởi động thêm Testbox, và chuyển bằng chứng sang
đường dẫn dung lượng Crabbox sở hữu bên dưới trong khi có người kiểm tra dashboard Blacksmith,
billing và giới hạn tổ chức.

Chỉ nâng cấp sang dung lượng Crabbox sở hữu khi Blacksmith bị gián đoạn, bị giới hạn hạn ngạch, thiếu môi trường cần thiết, hoặc dung lượng sở hữu là mục tiêu rõ ràng:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thực sự cần CPU cấp 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để chạm hạn ngạch EC2 Spot hoặc On-Demand Standard theo vùng. `.crabbox.yaml` do repo sở hữu mặc định dùng `standard`, nhiều vùng dung lượng, và `capacity.hints: true` để các lease AWS qua broker in ra vùng/thị trường đã chọn, áp lực hạn ngạch, fallback Spot, và cảnh báo lớp chịu áp lực cao. Dùng `fast` cho các kiểm tra rộng nặng hơn, `large` chỉ sau khi standard/fast không đủ, và `beast` chỉ cho các lane đặc biệt bị giới hạn CPU như toàn bộ bộ kiểm thử hoặc ma trận Docker cho mọi plugin, xác thực release/blocker rõ ràng, hoặc phân tích hiệu năng nhiều lõi. Không dùng `beast` cho `pnpm check:changed`, test tập trung, công việc chỉ liên quan đến tài liệu, lint/typecheck thông thường, repro E2E nhỏ, hoặc triage sự cố Blacksmith. Dùng `--market on-demand` cho chẩn đoán dung lượng để biến động thị trường Spot không bị trộn vào tín hiệu.

`.crabbox.yaml` sở hữu các mặc định provider, đồng bộ và hydration GitHub Actions cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa riêng thay vì đồng bộ remote và object store cục bộ của maintainer, và nó loại trừ các hiện vật runtime/build cục bộ không bao giờ nên được truyền đi. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không bí mật cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
