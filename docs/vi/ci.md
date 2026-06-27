---
read_when:
    - Bạn cần hiểu vì sao một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lượt chạy hoặc chạy lại xác thực bản phát hành
    - Bạn đang thay đổi việc điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Biểu đồ job CI, cổng phạm vi, nhóm phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-06-27T17:13:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần push vào `main` và mọi pull request. Các lần push `main` chính tắc trước tiên đi qua một cửa sổ nhận vào trình chạy được lưu trữ trong 90 giây. Nhóm đồng thời `CI` hiện có sẽ hủy lượt chạy đang chờ đó khi có commit mới hơn được đưa lên, nên các lần merge tuần tự sẽ không lần nào cũng đăng ký một ma trận Blacksmith đầy đủ. Pull request và các lần chạy thủ công bỏ qua bước chờ này. Job `preflight` sau đó phân loại diff và tắt các lane tốn kém khi chỉ có các khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua việc giới hạn phạm vi thông minh và tỏa nhánh toàn bộ đồ thị cho ứng viên phát hành và xác thực diện rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong workflow [`Plugin Prerelease`](#plugin-prerelease) riêng và chỉ chạy từ [`Full Release Validation`](#full-release-validation) hoặc một lần dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                                | Mục đích                                                                                                   | Khi chạy                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | Phát hiện thay đổi chỉ liên quan đến tài liệu, phạm vi đã thay đổi, extension đã thay đổi, và dựng manifest CI | Luôn chạy trên các push và PR không phải nháp        |
| `runner-admission`                 | Debounce 90 giây trên trình chạy được lưu trữ cho các push `main` chính tắc trước khi công việc Blacksmith được đăng ký | Mọi lượt chạy CI; chỉ sleep trên các push `main` chính tắc |
| `security-fast`                    | Phát hiện khóa riêng tư, kiểm tra workflow đã thay đổi qua `zizmor`, và kiểm tra lockfile production       | Luôn chạy trên các push và PR không phải nháp        |
| `check-dependencies`               | Lượt chạy Knip chỉ kiểm tra dependency production cộng với guard danh sách cho phép tệp không dùng         | Các thay đổi liên quan đến Node                      |
| `build-artifacts`                  | Dựng `dist/`, Control UI, smoke check CLI đã build, kiểm tra artifact build nhúng, và artifact tái sử dụng | Các thay đổi liên quan đến Node                      |
| `checks-fast-core`                 | Các lane kiểm tra tính đúng đắn nhanh trên Linux như bundled, protocol, QA Smoke CI, và kiểm tra định tuyến CI | Các thay đổi liên quan đến Node                      |
| `checks-fast-contracts-plugins-*`  | Hai kiểm tra contract Plugin được chia shard                                                               | Các thay đổi liên quan đến Node                      |
| `checks-fast-contracts-channels-*` | Hai kiểm tra contract kênh được chia shard                                                                 | Các thay đổi liên quan đến Node                      |
| `checks-node-core-*`               | Các shard kiểm thử Node lõi, loại trừ lane kênh, bundled, contract, và extension                           | Các thay đổi liên quan đến Node                      |
| `check-*`                          | Tương đương cổng local chính được chia shard: kiểu production, lint, guard, kiểu kiểm thử, và strict smoke | Các thay đổi liên quan đến Node                      |
| `check-additional-*`               | Kiến trúc, drift boundary/prompt được chia shard, guard extension, boundary package, và topology runtime   | Các thay đổi liên quan đến Node                      |
| `checks-node-compat-node22`        | Lane build và smoke tương thích Node 22                                                                    | Dispatch CI thủ công cho phát hành                   |
| `check-docs`                       | Định dạng tài liệu, lint, và kiểm tra liên kết hỏng                                                        | Tài liệu thay đổi                                    |
| `skills-python`                    | Ruff + pytest cho Skills có phần hỗ trợ Python                                                             | Các thay đổi liên quan đến skill Python              |
| `checks-windows`                   | Kiểm thử process/path riêng cho Windows cộng với hồi quy specifier import runtime dùng chung               | Các thay đổi liên quan đến Windows                   |
| `macos-node`                       | Lane kiểm thử TypeScript trên macOS dùng artifact đã build dùng chung                                      | Các thay đổi liên quan đến macOS                     |
| `macos-swift`                      | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                          | Các thay đổi liên quan đến macOS                     |
| `ios-build`                        | Sinh dự án Xcode cộng với build simulator cho ứng dụng iOS                                                 | Ứng dụng iOS, bộ app kit dùng chung, hoặc Swabble thay đổi |
| `android`                          | Kiểm thử đơn vị Android cho cả hai flavor cộng với một build APK debug                                     | Các thay đổi liên quan đến Android                   |
| `test-performance-agent`           | Tối ưu hóa kiểm thử chậm hằng ngày cho Codex sau hoạt động đáng tin cậy                                    | CI chính thành công hoặc dispatch thủ công           |
| `openclaw-performance`             | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile, và GPT 5.5 live | Theo lịch và dispatch thủ công                       |

## Thứ tự fail-fast

1. `runner-admission` chỉ chờ các push `main` chính tắc; một push mới hơn sẽ hủy lượt chạy trước khi đăng ký Blacksmith.
2. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
4. `build-artifacts` chạy chồng với các lane Linux nhanh để các bên tiêu thụ phía sau có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
5. Các lane nền tảng và runtime nặng hơn tỏa nhánh sau đó: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một push mới hơn xuất hiện trên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lượt chạy mới nhất cho cùng ref cũng đang thất bại. Các job ma trận dùng `fail-fast: false`, và `build-artifacts` báo cáo trực tiếp lỗi embedded channel, core-support-boundary, và gateway-watch thay vì xếp hàng các job xác minh nhỏ. Khóa đồng thời CI tự động được gắn phiên bản (`CI-v7-*`) để một lượt chạy mắc kẹt phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lượt chạy main mới hơn. Các lượt chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lượt chạy đang diễn ra.

Dùng `pnpm ci:timings`, `pnpm ci:timings:recent`, hoặc `node scripts/ci-run-timings.mjs <run-id>` để tóm tắt thời gian chạy thực, thời gian xếp hàng, các job chậm nhất, lỗi, và rào cản tỏa nhánh `pnpm-store-warmup` từ GitHub Actions. CI cũng tải lên cùng bản tóm tắt lượt chạy dưới dạng artifact `ci-timings-summary`. Với thời gian build, kiểm tra bước `Build dist` của job `build-artifacts`: `pnpm build:ci-artifacts` in `[build-all] phase timings:` và bao gồm `ui:build`; job này cũng tải lên artifact `startup-memory`.

Với các lượt chạy pull request, job timing-summary cuối cùng chạy helper từ revision cơ sở đáng tin cậy trước khi truyền `GH_TOKEN` cho `gh run view`. Điều đó giữ truy vấn có token nằm ngoài code do nhánh kiểm soát, đồng thời vẫn tóm tắt lượt chạy CI hiện tại của pull request.

## Ngữ cảnh và bằng chứng PR

PR của contributor bên ngoài chạy một cổng ngữ cảnh và bằng chứng PR từ `.github/workflows/real-behavior-proof.yml`. Workflow checkout commit cơ sở đáng tin cậy và chỉ đánh giá nội dung PR; nó không thực thi code từ nhánh của contributor.

Cổng áp dụng cho tác giả PR không phải là chủ sở hữu repository, thành viên, collaborator, hoặc bot. Cổng đạt khi nội dung PR chứa các phần do tác giả viết là `What Problem This Solves` và `Evidence`. Bằng chứng có thể là một kiểm thử tập trung, kết quả CI, ảnh chụp màn hình, bản ghi, output terminal, quan sát live, log đã biên tập, hoặc liên kết artifact. Nội dung cung cấp ý định và xác thực hữu ích; reviewer kiểm tra code, kiểm thử, và CI để đánh giá tính đúng đắn.

Khi check thất bại, hãy cập nhật nội dung PR thay vì push thêm một commit code khác.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng tự thân chúng không ép chạy build native Windows, iOS, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn phạm vi theo thay đổi source nền tảng.
- **Workflow Sanity** chạy `actionlint`, `zizmor` trên mọi tệp YAML workflow, guard nội suy composite-action, và guard conflict-marker. Job `security-fast` theo phạm vi PR cũng chạy `zizmor` trên các tệp workflow đã thay đổi để phát hiện bảo mật workflow thất bại sớm trong đồ thị CI chính.
- **Tài liệu trên các push `main`** được kiểm tra bởi workflow `Docs` độc lập với cùng bản mirror tài liệu ClawHub mà CI dùng, nên các push trộn code+tài liệu không xếp hàng thêm shard `check-docs` của CI. Pull request và CI thủ công vẫn chạy `check-docs` từ CI khi tài liệu thay đổi.
- **TUI PTY** chạy trong shard Linux Node `checks-node-core-runtime-tui-pty` cho các thay đổi TUI. Shard chạy `test/vitest/vitest.tui-pty.config.ts` với `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, nên nó bao phủ cả lane fixture `TuiBackend` xác định được và smoke `tui --local` chậm hơn, chỉ mock endpoint model bên ngoài.
- **Các chỉnh sửa chỉ định tuyến CI, một số chỉnh sửa fixture kiểm thử core rẻ, và các chỉnh sửa hẹp ở helper contract Plugin/định tuyến kiểm thử** dùng đường manifest nhanh chỉ Node: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường này bỏ qua artifact build, tương thích Node 22, contract kênh, các shard core đầy đủ, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi bị giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp kiểm thử.
- **Kiểm tra Windows Node** được giới hạn phạm vi theo các wrapper process/path riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package, và các bề mặt workflow CI thực thi lane đó; các thay đổi source, Plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn ở trên các lane Linux Node.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không giữ runner quá mức: hợp đồng plugin và hợp đồng kênh mỗi loại chạy thành hai shard có trọng số được Blacksmith hỗ trợ với runner GitHub tiêu chuẩn làm phương án dự phòng, các lane core unit nhanh/hỗ trợ chạy riêng, hạ tầng runtime lõi được tách giữa state, process/config, shared và ba shard miền cron, auto-reply chạy dưới dạng các worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch và commands/state-routing), còn cấu hình agentic gateway/server được tách trên các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ các artifact đã build. Sau đó CI thông thường chỉ đóng gói các shard include-pattern hạ tầng cô lập vào các bundle xác định gồm tối đa 64 tệp kiểm thử, giảm ma trận Node mà không gộp các bộ command/cron không cô lập, agents-core có trạng thái hoặc gateway/server; các bộ nặng cố định vẫn dùng 8 vCPU trong khi các lane đã bundle và trọng số thấp hơn dùng 4 vCPU. Pull request trên kho chuẩn dùng thêm một kế hoạch tiếp nhận gọn: các nhóm theo cấu hình tương tự chạy trong các subprocess cô lập bên trong kế hoạch Linux Node 34 job hiện tại, nên một PR đơn lẻ không đăng ký toàn bộ ma trận Node hơn 70 job. Các push lên `main`, dispatch thủ công và cổng release vẫn giữ ma trận đầy đủ. Các kiểm thử trình duyệt, QA, media và plugin linh tinh quy mô rộng dùng cấu hình Vitest chuyên dụng thay vì nhóm bắt tất cả plugin dùng chung. Các shard include-pattern ghi mục thời gian bằng tên shard CI, nên `.artifacts/vitest-shard-timings.json` có thể phân biệt cả cấu hình nguyên vẹn với một shard đã lọc. `check-additional-*` giữ phần biên dịch/canary theo ranh giới package cùng nhau và tách kiến trúc tô pô runtime khỏi phạm vi theo dõi Gateway; danh sách boundary guard được chia sọc thành một shard nặng về prompt và một shard kết hợp cho các sọc guard còn lại, mỗi shard chạy đồng thời các guard độc lập được chọn và in thời gian theo từng check. Kiểm tra drift snapshot prompt happy-path Codex tốn kém chạy như job bổ sung riêng cho CI thủ công và chỉ cho các thay đổi ảnh hưởng prompt, nên các thay đổi Node thông thường không liên quan không phải chờ sau quá trình tạo snapshot prompt lạnh, các shard boundary vẫn cân bằng trong khi drift prompt vẫn được gắn với PR đã gây ra nó; cùng cờ đó bỏ qua việc tạo snapshot prompt bằng Vitest bên trong shard core support-boundary dùng artifact đã build. Gateway watch, kiểm thử kênh và shard core support-boundary chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Sau khi được tiếp nhận, CI Linux chuẩn cho phép tối đa 24 job kiểm thử Node đồng thời và
12 cho các lane fast/check nhỏ hơn; Windows và Android vẫn giữ ở mức hai vì
các pool runner đó hẹp hơn.

Kế hoạch PR gọn phát ra 18 job Node cho bộ hiện tại: các nhóm whole-config
được gom batch trong các subprocess cô lập với thời hạn batch 120 phút,
trong khi các nhóm include-pattern dùng chung ngân sách job có giới hạn tương tự.

CI Android chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi build APK debug Play. Flavor bên thứ ba không có source set hoặc manifest riêng; lane unit-test của nó vẫn biên dịch flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh job đóng gói APK debug trùng lặp trên mọi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ kiểm tra dependency production được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, lệnh này so sánh các phát hiện tệp không dùng trong production của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng sẽ fail khi một PR thêm tệp không dùng mới chưa được review hoặc để lại mục allowlist đã lỗi thời, đồng thời giữ lại các bề mặt plugin động, được tạo, build, live-test và cầu nối package có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động kho OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho các yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho các yêu cầu review ở cấp commit trên các push `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, kho, số item, URL, tiêu đề, trạng thái và trích đoạn ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ nội dung webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, đăng sự kiện đã chuẩn hóa tới hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải mặc định gửi đi. Agent ClawSweeper nhận đích Discord trong prompt và chỉ nên đăng lên `#clawsweeper` khi sự kiện bất ngờ, có thể hành động, rủi ro hoặc hữu ích về vận hành. Các lượt mở, chỉnh sửa, nhiễu bot, nhiễu webhook trùng lặp và lưu lượng review thông thường nên trả về `NO_REPLY`.

Xem tiêu đề, bình luận, nội dung, văn bản review, tên nhánh và thông điệp commit của GitHub là dữ liệu không tin cậy trong suốt đường dẫn này. Chúng là đầu vào cho tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng buộc bật mọi lane có phạm vi không phải Android: shard Linux Node, shard bundled-plugin, shard hợp đồng plugin và kênh, tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra smoke artifact đã build, kiểm tra docs, Skills Python, Windows, macOS, build iOS và i18n Control UI. Dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella release đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh prerelease plugin, shard chỉ dành cho release `agentic-plugins`, lượt quét batch extension đầy đủ và các lane Docker prerelease plugin bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với cổng release-validation được bật.

Các lượt chạy thủ công dùng nhóm đồng thời duy nhất để một bộ đầy đủ release-candidate không bị hủy bởi một lượt push hoặc PR khác trên cùng ref. Đầu vào tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch CI thủ công và dự phòng cho kho không chuẩn, quét chất lượng CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs ngoài CI và preflight install-smoke để ma trận Blacksmith có thể xếp hàng sớm hơn                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard extension trọng số thấp hơn, `checks-fast-core`, shard hợp đồng plugin/kênh, hầu hết shard Linux Node bundled/trọng số thấp hơn, `check-guards`, `check-prod-types`, `check-test-types`, một số shard `check-additional-*` được chọn và `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Các bộ Linux Node nặng được giữ lại, shard `check-additional-*` nặng về boundary/extension và `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (đủ nhạy với CPU đến mức 8 vCPU tốn nhiều hơn phần tiết kiệm được); build Docker install-smoke (thời gian xếp hàng 32 vCPU tốn nhiều hơn phần tiết kiệm được)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` trên `openclaw/openclaw`; fork dùng dự phòng `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` và `ios-build` trên `openclaw/openclaw`; fork dùng dự phòng `macos-26`                                                                                                                                                                                                  |

## Ngân sách đăng ký runner

Bucket đăng ký runner GitHub hiện tại của OpenClaw cho phép 3.000 lượt đăng ký
runner self-hosted mỗi 5 phút. Giới hạn này được chia sẻ bởi tất cả lượt đăng ký runner Blacksmith
trong tổ chức `openclaw`, nên thêm một cài đặt Blacksmith khác không thêm bucket mới.

Xem nhãn Blacksmith là tài nguyên khan hiếm để kiểm soát burst. Các job
chỉ định tuyến, thông báo, tóm tắt, chọn shard hoặc chạy quét CodeQL ngắn nên
giữ trên runner do GitHub host trừ khi chúng có nhu cầu riêng với Blacksmith đã đo lường.
Bất kỳ ma trận Blacksmith mới, `max-parallel` lớn hơn hoặc workflow tần suất cao
nào cũng phải thể hiện số lượt đăng ký trường hợp xấu nhất và giữ mục tiêu cấp tổ chức
dưới 2.000 lượt đăng ký mỗi 5 phút, chừa khoảng trống cho các
kho chạy đồng thời và các job chạy lại.

CI kho chuẩn giữ Blacksmith làm đường dẫn runner mặc định cho các lượt push và pull-request thông thường. Các lượt chạy `workflow_dispatch` và kho không chuẩn dùng runner do GitHub host, nhưng các lượt chạy chuẩn thông thường hiện không thăm dò tình trạng hàng đợi Blacksmith hoặc tự động chuyển dự phòng sang nhãn do GitHub host khi Blacksmith không khả dụng.

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

Kích hoạt thủ công thường benchmark workflow ref. Đặt `target_ref` để benchmark một thẻ phát hành hoặc một nhánh khác với bản triển khai workflow hiện tại. Đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được đánh khóa theo ref được kiểm thử, và mỗi `index.md` ghi lại ref/SHA được kiểm thử, workflow ref/SHA, Kova ref, hồ sơ, chế độ xác thực lane, mô hình, số lần lặp và bộ lọc kịch bản.

Workflow cài OCM từ một bản phát hành đã ghim và Kova từ `openclaw/Kova` tại đầu vào `kova_ref` đã ghim, rồi chạy ba lane:

- `mock-provider`: các kịch bản chẩn đoán Kova chạy trên runtime build cục bộ với xác thực giả tương thích OpenAI có tính xác định.
- `mock-deep-profile`: lập hồ sơ CPU/heap/trace cho các điểm nóng khi khởi động, Gateway và lượt tác tử.
- `live-openai-candidate`: một lượt tác tử OpenAI `openai/gpt-5.5` thật, được bỏ qua khi không có `OPENAI_API_KEY`.

Lane mock-provider cũng chạy các probe nguồn gốc OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ trên các trường hợp khởi động mặc định, hook và 50-plugin; RSS nhập Plugin đóng gói, các vòng lặp hello `channel-chat-baseline` mock-OpenAI lặp lại, lệnh khởi động CLI trên Gateway đã boot và probe hiệu năng smoke trạng thái SQLite. Khi báo cáo nguồn mock-provider đã xuất bản trước đó có sẵn cho ref được kiểm thử, bản tóm tắt nguồn so sánh các giá trị RSS và heap hiện tại với baseline đó và đánh dấu các mức tăng RSS lớn là `watch`. Bản tóm tắt Markdown của probe nguồn nằm tại `source/index.md` trong gói báo cáo, cùng với JSON thô bên cạnh.

Mỗi lane tải lên artifact GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các gói, `index.md` và artifact probe nguồn vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ ref được kiểm thử hiện tại được ghi là `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực bản phát hành đầy đủ

`Full Release Validation` là workflow bao trùm thủ công để “chạy mọi thứ trước khi phát hành”. Nó nhận một nhánh, thẻ hoặc SHA commit đầy đủ, kích hoạt workflow `CI` thủ công với mục tiêu đó, kích hoạt `Plugin Prerelease` cho bằng chứng plugin/gói/tĩnh/Docker chỉ dành cho phát hành, và kích hoạt `OpenClaw Release Checks` cho smoke cài đặt, chấp nhận gói, kiểm tra gói xuyên hệ điều hành, render scorecard trưởng thành từ bằng chứng hồ sơ QA, tương đồng QA Lab, Matrix và các lane Telegram. Hồ sơ stable và full luôn bao gồm phạm vi live/E2E toàn diện và kiểm thử soak đường dẫn phát hành Docker; hồ sơ beta có thể bật bằng `run_release_soak=true`. E2E Telegram gói chuẩn chạy bên trong Package Acceptance, nên một ứng viên đầy đủ không khởi động poller live trùng lặp. Sau khi xuất bản, truyền `release_package_spec` để tái sử dụng gói npm đã phát hành trên release checks, Package Acceptance, Docker, xuyên hệ điều hành và Telegram mà không build lại. Chỉ dùng `npm_telegram_package_spec` cho một lần chạy lại Telegram tập trung trên gói đã xuất bản. Lane gói live của Plugin Codex dùng cùng trạng thái đã chọn theo mặc định: `release_package_spec=openclaw@<tag>` đã xuất bản suy ra `codex_plugin_spec=npm:@openclaw/codex@<tag>`, còn các lần chạy SHA/artifact đóng gói `extensions/codex` từ ref đã chọn. Đặt `codex_plugin_spec` rõ ràng cho các nguồn Plugin tùy chỉnh như đặc tả `npm:`, `npm-pack:` hoặc `git:`.

Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn, tên job workflow chính xác, khác biệt hồ sơ, artifact và
các handle chạy lại tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Kích hoạt nó
từ `release/YYYY.M.PATCH` hoặc `main` sau khi thẻ phát hành tồn tại và sau khi
preflight npm OpenClaw thành công. Nó xác minh `pnpm plugins:sync:check`,
kích hoạt `Plugin NPM Release` cho tất cả gói Plugin có thể xuất bản, kích hoạt
`Plugin ClawHub Release` cho cùng SHA phát hành, và chỉ sau đó kích hoạt
`OpenClaw NPM Release` với `preflight_run_id` đã lưu. Phát hành stable cũng
yêu cầu một `windows_node_tag` chính xác; workflow xác minh bản phát hành nguồn
Windows và so sánh trình cài đặt x64/ARM64 của nó với đầu vào
`windows_node_installer_digests` đã được ứng viên phê duyệt trước bất kỳ workflow con xuất bản nào, rồi quảng bá
và xác minh cùng các digest trình cài đặt đã ghim đó cộng với artifact đồng hành chính xác
và hợp đồng checksum trước khi xuất bản bản nháp phát hành GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit đã ghim trên một nhánh thay đổi nhanh, dùng helper thay vì
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Các ref dispatch workflow GitHub phải là nhánh hoặc thẻ, không phải SHA commit thô. Helper
đẩy một nhánh tạm `release-ci/<sha>-...` tại SHA mục tiêu,
kích hoạt `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con
có `headSha` khớp với mục tiêu, và xóa nhánh tạm khi lần chạy
hoàn tất. Trình xác minh bao trùm cũng thất bại nếu bất kỳ workflow con nào chạy tại một
SHA khác.

`release_profile` kiểm soát độ rộng live/provider được truyền vào release checks. Các
workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn
chủ ý muốn ma trận provider/media tư vấn rộng. Release checks stable và full
luôn chạy kiểm thử soak live/E2E toàn diện và đường dẫn phát hành Docker;
hồ sơ beta có thể bật bằng `run_release_soak=true`.

- `minimum` giữ các lane OpenAI/core nhanh nhất và trọng yếu cho phát hành.
- `stable` thêm tập provider/backend stable.
- `full` chạy ma trận provider/media tư vấn rộng.

Workflow bao trùm ghi lại id các lần chạy con đã dispatch, và job `Verify full validation` cuối cùng kiểm tra lại kết luận hiện tại của các lần chạy con và nối thêm bảng job chậm nhất cho mỗi lần chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại job xác minh cha để làm mới kết quả bao trùm và bản tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho CI con đầy đủ thông thường, `plugin-prerelease` chỉ cho Plugin prerelease con, `release-checks` cho mọi workflow con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên workflow bao trùm. Điều này giữ phạm vi chạy lại hộp phát hành bị lỗi ở mức giới hạn sau một bản sửa tập trung. Với một lane xuyên hệ điều hành bị lỗi, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh xuyên hệ điều hành dài phát ra dòng Heartbeat và bản tóm tắt packaged-upgrade bao gồm thời gian theo từng pha. Các lane QA release-check mang tính tư vấn ngoại trừ cổng phạm vi công cụ runtime tiêu chuẩn, cổng này chặn khi các công cụ động OpenClaw bắt buộc bị lệch hoặc biến mất khỏi bản tóm tắt tầng tiêu chuẩn.

`OpenClaw Release Checks` dùng workflow ref tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho các kiểm tra xuyên hệ điều hành và Package Acceptance, cộng với workflow Docker đường dẫn phát hành live/E2E khi chạy phạm vi soak. Cách này giữ byte gói nhất quán trên các hộp phát hành và tránh đóng gói lại cùng ứng viên trong nhiều job con. Với lane live npm-plugin Codex, release checks sẽ truyền một đặc tả Plugin đã xuất bản khớp được suy ra từ `release_package_spec`, truyền `codex_plugin_spec` do operator cung cấp, hoặc để trống đầu vào để script Docker đóng gói Plugin Codex của checkout đã chọn.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
thay thế workflow bao trùm cũ hơn. Bộ giám sát cha hủy mọi workflow con mà nó
đã dispatch khi workflow cha bị hủy, nên xác thực main mới hơn
không bị xếp sau một lần chạy release-check cũ kéo dài hai giờ. Xác thực
nhánh/thẻ phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Phân mảnh live và E2E

Workflow con live/E2E phát hành giữ phạm vi `pnpm test:live` native rộng, nhưng chạy phạm vi đó dưới dạng các phân mảnh có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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
- các phân mảnh media âm thanh/video được tách và các phân mảnh nhạc được lọc theo provider

Cách này giữ cùng phạm vi file trong khi làm cho các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên phân mảnh tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media` và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các phân mảnh media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi setup. Giữ các bộ kiểm thử live có Docker hỗ trợ trên runner Blacksmith thông thường — job container không phải nơi phù hợp để khởi chạy kiểm thử Docker lồng nhau.

Các phân đoạn mô hình/backend live được Docker hỗ trợ dùng một image chia sẻ riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit được chọn. Quy trình phát hành live build và push image đó một lần, sau đó các phân đoạn mô hình live Docker, Gateway chia theo provider, backend CLI, bind ACP và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các phân đoạn Gateway Docker mang giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout của job workflow, để container bị kẹt hoặc đường dọn dẹp lỗi nhanh thay vì tiêu thụ toàn bộ ngân sách kiểm tra phát hành. Nếu các phân đoạn đó tự build lại toàn bộ target Docker nguồn một cách độc lập, lần chạy phát hành đang bị cấu hình sai và sẽ lãng phí thời gian thực cho các lần build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng harness E2E Docker mà người dùng sử dụng sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256 và profile trong phần tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory tarball, chuẩn bị image Docker package-digest khi cần, và chạy các lane Docker được chọn với gói đó thay vì đóng gói checkout của workflow. Khi một profile chọn nhiều `docker_lanes` được nhắm mục tiêu, workflow tái sử dụng chuẩn bị gói và các image chia sẻ một lần, rồi fan out các lane đó thành các job Docker được nhắm mục tiêu chạy song song với artifact riêng.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã xuất bản.
4. `summary` làm workflow thất bại nếu phân giải gói, chấp nhận Docker, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng nguồn này cho chấp nhận prerelease/stable đã xuất bản.
- `source=ref` đóng gói một nhánh, tag, hoặc commit SHA đầy đủ đáng tin cậy từ `package_ref`. Bộ phân giải fetch các nhánh/tag OpenClaw, xác minh commit được chọn có thể truy cập từ lịch sử nhánh repository hoặc một release tag, cài đặt deps trong một worktree tách rời, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS công khai; bắt buộc có `package_sha256`. Đường dẫn này từ chối thông tin xác thực trong URL, cổng HTTPS không mặc định, hostname hoặc IP đã phân giải thuộc loại private/internal/special-use, và redirect ra ngoài cùng chính sách an toàn công khai.
- `source=trusted-url` tải xuống một `.tgz` HTTPS từ chính sách trusted-source có tên trong `.github/package-trusted-sources.json`; bắt buộc có `package_sha256` và `trusted_source_id`. Chỉ dùng nguồn này cho mirror enterprise do maintainer sở hữu hoặc repository gói riêng tư cần cấu hình host, cổng, tiền tố đường dẫn, host redirect, hoặc phân giải mạng riêng. Nếu chính sách khai báo bearer auth, workflow dùng secret cố định `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; thông tin xác thực nhúng trong URL vẫn bị từ chối.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng phạm vi kiểm tra Plugin offline để xác thực gói đã xuất bản không bị chặn bởi tình trạng sẵn có của ClawHub live. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn spec npm đã xuất bản được giữ cho các dispatch độc lập.

Để biết chính sách chuyên biệt về kiểm thử cập nhật và Plugin, bao gồm các lệnh local,
lane Docker, input Package Acceptance, mặc định phát hành và phân loại lỗi,
xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Kiểm tra phát hành gọi Package Acceptance với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng di chuyển gói, cập nhật, cài đặt skill ClawHub live, dọn dẹp phụ thuộc Plugin lỗi thời, sửa cài đặt Plugin đã cấu hình, Plugin offline, cập nhật Plugin và Telegram trên cùng tarball gói đã phân giải. Đặt `release_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks sau khi xuất bản beta để chạy cùng ma trận với gói npm đã phát hành mà không build lại; chỉ đặt `package_acceptance_package_spec` khi Package Acceptance cần một gói khác với phần còn lại của xác thực phát hành. Kiểm tra phát hành cross-OS vẫn bao phủ onboarding, trình cài đặt và hành vi nền tảng theo OS; xác thực sản phẩm gói/cập nhật nên bắt đầu bằng Package Acceptance. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã xuất bản cho mỗi lần chạy trong đường dẫn phát hành chặn. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã xuất bản để fallback, mặc định là `openclaw@latest`; các lệnh rerun lane thất bại giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng qua bốn bản phát hành npm stable mới nhất cộng với các bản phát hành ranh giới tương thích Plugin được ghim và fixture theo dạng issue cho cấu hình Feishu, các file bootstrap/persona được giữ lại, cài đặt Plugin OpenClaw đã cấu hình, đường dẫn log dấu ngã, và root phụ thuộc Plugin legacy lỗi thời. Các lựa chọn published-upgrade survivor nhiều baseline được sharding theo baseline thành các job runner Docker được nhắm mục tiêu riêng. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã xuất bản một cách đầy đủ, không phải độ rộng CI Full Release thông thường. Các lần chạy tổng hợp local có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã xuất bản cấu hình baseline bằng một công thức lệnh `openclaw config set` được bake sẵn, ghi lại các bước công thức trong `summary.json`, và probe `/healthz`, `/readyz`, cùng trạng thái RPC sau khi Gateway khởi động. Các lane Windows packaged và installer fresh cũng xác minh rằng một gói đã cài đặt có thể import override browser-control từ một đường dẫn Windows tuyệt đối thô. Smoke lượt agent OpenAI cross-OS mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.5`, để bằng chứng cài đặt và Gateway vẫn ở trên mô hình kiểm thử GPT-5 trong khi tránh các mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Package Acceptance có các cửa sổ tương thích legacy có giới hạn cho các gói đã xuất bản. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA private đã biết trong `dist/postinstall-inventory.json` có thể trỏ tới các file bị lược khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase persistence `gateway install --wrapper` khi gói không expose flag đó;
- `update-channel-switch` có thể prune các `patchedDependencies` pnpm bị thiếu khỏi fixture git giả tạo dẫn xuất từ tarball và có thể log thiếu `update.channel` đã persist;
- các smoke Plugin có thể đọc vị trí install-record legacy hoặc chấp nhận thiếu persistence install-record marketplace;
- `plugin-update` có thể cho phép di chuyển metadata cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại không thay đổi.

Gói `2026.4.26` đã xuất bản cũng có thể cảnh báo về các file stamp metadata build local đã được ship. Các gói về sau phải đáp ứng các contract hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi debug một lần chạy chấp nhận gói thất bại, hãy bắt đầu ở phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời gian từng phase và lệnh rerun. Ưu tiên chạy lại profile gói thất bại hoặc các lane Docker chính xác thay vì chạy lại toàn bộ xác thực phát hành.

## Smoke cài đặt

Workflow `Install Smoke` riêng tái sử dụng cùng script phạm vi thông qua job `preflight` riêng. Nó chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường chạy nhanh** chạy cho các pull request chạm tới bề mặt Docker/gói, thay đổi gói/manifest Plugin đi kèm, hoặc các bề mặt Plugin SDK/plugin/kênh/gateway lõi mà các job Docker smoke kiểm thử. Các thay đổi Plugin đi kèm chỉ ở mã nguồn, chỉnh sửa chỉ cho kiểm thử, và chỉnh sửa chỉ cho tài liệu không đặt trước worker Docker. Đường chạy nhanh build image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa agents shared-workspace, chạy e2e container gateway-network, xác minh build arg của extension đi kèm, và chạy profile Docker Plugin đi kèm có giới hạn dưới timeout lệnh tổng hợp 240 giây (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường chạy đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update của trình cài đặt cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call, và các pull request thật sự chạm tới bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image smoke Dockerfile gốc GHCR theo target-SHA, sau đó chạy cài đặt gói QR, smoke Dockerfile/gateway gốc, smoke trình cài đặt/update, và Docker E2E Plugin đi kèm nhanh dưới dạng các job riêng để công việc trình cài đặt không phải chờ sau các smoke image gốc.

Các lần push lên `main` (bao gồm merge commit) không ép dùng đường chạy đầy đủ; khi logic changed-scope yêu cầu phạm vi đầy đủ trên một lần push, workflow giữ Docker smoke nhanh và để smoke cài đặt đầy đủ cho xác thực hằng đêm hoặc phát hành.

Smoke image-provider cài đặt Bun global chậm được chặn riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn tham gia, nhưng pull request và push lên `main` thì không. CI PR bình thường vẫn chạy lane hồi quy trình khởi chạy Bun nhanh cho các thay đổi liên quan đến Node. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` prebuild một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng npm tarball, và build hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane trình cài đặt/update/plugin-dependency;
- một image chức năng cài cùng tarball đó vào `/app` cho các lane chức năng bình thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi plan đã chọn. Scheduler chọn image theo lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Các tham số tinh chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot main-pool cho các lane bình thường.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot tail-pool nhạy với provider.                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để provider không throttle.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5        | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane đa dịch vụ đồng thời.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ giãn giữa các lần bắt đầu lane để tránh bão tạo Docker daemon; đặt `0` để không giãn.      |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Timeout dự phòng theo lane (120 phút); các lane live/tail được chọn dùng giới hạn chặt hơn.   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` in plan của scheduler mà không chạy lane.                                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua cleanup smoke để agents có thể tái hiện một lane lỗi. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể bắt đầu từ pool trống, rồi chạy một mình cho đến khi nó giải phóng dung lượng. Tổng hợp cục bộ preflight Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời gian lane để sắp xếp longest-first, và mặc định dừng lên lịch các lane pooled mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` để biết cần phạm vi gói, loại image, image live, lane, và credential nào. Sau đó `scripts/docker-e2e.mjs` chuyển plan đó thành output và summary của GitHub. Nó đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải xuống package artifact của lần chạy hiện tại, hoặc tải xuống package artifact từ `package_artifact_run_id`; xác thực inventory của tarball; build và push các image Docker E2E GHCR bare/functional gắn tag theo package-digest qua cache lớp Docker của Blacksmith khi plan cần các lane có gói đã cài; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các image theo package-digest hiện có thay vì build lại. Các lần pull image Docker được retry với timeout giới hạn 180 giây mỗi lần thử để luồng registry/cache bị kẹt retry nhanh thay vì tiêu thụ phần lớn đường găng CI.

### Các chunk đường phát hành

Phạm vi Docker phát hành chạy các job chunk nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi chunk chỉ pull loại image nó cần và thực thi nhiều lane qua cùng scheduler có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các chunk Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và từ `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `package-update-openai` bao gồm lane gói Plugin Codex live, lane này cài gói OpenClaw ứng viên, cài Plugin Codex từ `codex_plugin_spec` hoặc tarball cùng ref với phê duyệt cài đặt Codex CLI rõ ràng, chạy preflight Codex CLI, rồi chạy nhiều lượt agent OpenClaw cùng phiên với OpenAI. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các alias tổng hợp plugin/runtime. Alias lane `install-e2e` vẫn là alias rerun thủ công tổng hợp cho cả hai lane trình cài đặt provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu, và chỉ giữ chunk `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật kênh đi kèm retry một lần khi có lỗi mạng npm tạm thời.

Mỗi chunk tải lên `.artifacts/docker-tests/` với log lane, thời gian, `summary.json`, `failures.json`, thời gian pha, JSON plan scheduler, bảng lane chậm, và lệnh rerun theo từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn với image đã chuẩn bị thay vì các job chunk, giúp việc debug lane lỗi được giới hạn trong một job Docker mục tiêu và chuẩn bị, tải xuống, hoặc tái sử dụng package artifact cho lần chạy đó; nếu một lane đã chọn là lane Docker live, job mục tiêu build image live-test cục bộ cho lần rerun đó. Các lệnh rerun GitHub được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name`, và input image đã chuẩn bị khi các giá trị đó tồn tại, để một lane lỗi có thể tái sử dụng đúng gói và image từ lần chạy lỗi.

```bash
pnpm test:docker:rerun <run-id>      # tải xuống Docker artifact và in các lệnh rerun mục tiêu kết hợp/theo từng lane
pnpm test:docker:timings <summary>   # summary lane chậm và đường găng theo pha
```

Workflow live/E2E theo lịch chạy bộ Docker release-path đầy đủ hằng ngày.

## Plugin Prerelease

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Pull request bình thường, push lên `main`, và dispatch CI thủ công độc lập giữ bộ này tắt. Nó cân bằng kiểm thử Plugin đi kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch plugin nặng import không tạo thêm job CI. Đường prerelease Docker chỉ dành cho phát hành gom các lane Docker mục tiêu thành nhóm nhỏ để tránh đặt trước hàng chục runner cho các job một đến ba phút. Workflow cũng tải lên artifact thông tin `plugin-inspector-advisory` từ `@openclaw/plugin-inspector`; các phát hiện của inspector là đầu vào triage và không thay đổi cổng Plugin Prerelease có tính chặn.

## QA Lab

QA Lab có các lane CI chuyên dụng bên ngoài workflow smart-scoped chính. Parity agentic được lồng trong các harness QA rộng và phát hành, không phải một workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi parity nên đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó fan out lane mock parity, lane Matrix live, và các lane Telegram và Discord live dưới dạng các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Kiểm tra phát hành chạy các lane transport Matrix và Telegram live với provider mock xác định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được cô lập khỏi độ trễ model live và khởi động provider-plugin bình thường. Gateway transport live tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; kết nối provider được bao phủ bởi các bộ model live, provider native, và Docker provider riêng.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab quan trọng cho phát hành trước khi phê duyệt phát hành; cổng QA parity của nó chạy các pack ứng viên và baseline dưới dạng các job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ để so sánh parity cuối cùng.

Với PR bình thường, hãy theo bằng chứng CI/check có phạm vi thay vì xem parity là trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` được chủ ý thiết kế là trình quét bảo mật lượt đầu hẹp, không phải lần quét toàn bộ repository. Các lần chạy hằng ngày, thủ công, và guard pull request không phải draft quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất với truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Guard pull request giữ nhẹ: nó chỉ bắt đầu cho các thay đổi dưới `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. CodeQL Android và macOS không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, Cron và đường cơ sở Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, Gateway, Plugin SDK, secrets, điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF lõi, phân tích cú pháp IP, bảo vệ mạng, web-fetch và các bề mặt chính sách SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, trình trợ giúp thực thi tiến trình, phân phối ra ngoài và các cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, nạp nguồn và các bề mặt tin cậy của hợp đồng gói Plugin SDK |

### Các shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android đã lên lịch. Xây dựng ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được kiểm tra hợp lệ của workflow chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Xây dựng ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF đã tải lên và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chi phối runtime ngay cả khi sạch.

### Các danh mục Chất lượng Nghiêm trọng

`CodeQL Critical Quality` là shard không liên quan bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không liên quan bảo mật, mức độ nghiêm trọng lỗi, trên các bề mặt hẹp có giá trị cao trên runner Linux do GitHub lưu trữ để các lượt quét chất lượng không tiêu tốn ngân sách đăng ký runner Blacksmith. Guard pull request của nó cố ý nhỏ hơn hồ sơ đã lên lịch: PR không phải bản nháp chỉ chạy các shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` và `plugin-sdk-reply-runtime` tương ứng cho các thay đổi trong mã thực thi lệnh/mô hình/công cụ của agent và điều phối trả lời, mã schema/migration/IO cấu hình, mã auth/secrets/sandbox/security, runtime kênh lõi và Plugin kênh đi kèm, giao thức Gateway/phương thức máy chủ, runtime bộ nhớ/keo SDK, MCP/tiến trình/phân phối ra ngoài, runtime nhà cung cấp/catalog mô hình, chẩn đoán phiên/hàng đợi phân phối, loader Plugin, Plugin SDK/hợp đồng gói hoặc runtime trả lời Plugin SDK. Các thay đổi cấu hình CodeQL và workflow chất lượng chạy toàn bộ mười hai shard chất lượng PR.

Điều phối thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là hook hướng dẫn/lặp để chạy riêng một shard chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật Auth, secrets, sandbox, Cron và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Schema cấu hình, migration, chuẩn hóa và hợp đồng IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đi kèm                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi tự động trả lời, cùng hợp đồng runtime mặt phẳng điều khiển ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, trình trợ giúp giám sát tiến trình và hợp đồng phân phối ra ngoài                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, keo kích hoạt runtime bộ nhớ và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, trình trợ giúp ràng buộc/phân phối phiên ra ngoài, bề mặt sự kiện chẩn đoán/gói log và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đến của Plugin SDK, trình trợ giúp payload/chia khúc/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối và trình trợ giúp ràng buộc phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa catalog mô hình, auth và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/catalog nhà cung cấp và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lưu trữ cục bộ, luồng điều khiển Gateway và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/tìm kiếm web lõi, IO media, hiểu media, tạo ảnh và hợp đồng runtime tạo media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, bề mặt công khai và hợp đồng điểm vào Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và trình trợ giúp hợp đồng gói Plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không làm mờ tín hiệu bảo mật. Mở rộng CodeQL cho Swift, Python và Plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc được chia shard sau khi các hồ sơ hẹp có runtime và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một lane bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được hợp nhất. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và điều phối thủ công có thể chạy trực tiếp. Các lần gọi workflow-run bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ vừa qua. Khi chạy, nó xem xét phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lượt chạy theo giờ có thể bao phủ mọi thay đổi trên main đã tích lũy kể từ lượt tài liệu gần nhất.

### Test Performance Agent

Workflow `Test Performance Agent` là một lane bảo trì Codex theo sự kiện cho các bài kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Điều phối thủ công bỏ qua cổng hoạt động hằng ngày đó. Lane này xây dựng báo cáo hiệu năng Vitest nhóm theo full-suite, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ nguyên coverage thay vì refactor rộng, sau đó chạy lại báo cáo full-suite và từ chối các thay đổi làm giảm số lượng kiểm thử baseline đang pass. Báo cáo nhóm ghi lại wall time theo từng cấu hình và RSS tối đa trên Linux và macOS, vì vậy so sánh trước/sau hiển thị delta bộ nhớ kiểm thử cạnh delta thời lượng. Nếu baseline có kiểm thử failing, Codex chỉ có thể sửa các lỗi hiển nhiên và báo cáo full-suite sau agent phải pass trước khi bất cứ thứ gì được commit. Khi `main` tiến lên trước khi bot push được hợp nhất, lane này rebase patch đã được xác thực, chạy lại `pnpm check:changed` và thử push lại; các patch cũ xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub lưu trữ để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi hợp nhất

Workflow `Duplicate PRs After Merge` là workflow bảo trì thủ công cho việc dọn dẹp trùng lặp sau khi land. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được hợp nhất và mỗi bản trùng lặp có một issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck prod lõi và kiểm thử lõi cộng lint/guard lõi;
- thay đổi chỉ kiểm thử lõi chỉ chạy typecheck kiểm thử lõi cộng lint lõi;
- thay đổi production extension chạy typecheck prod extension và kiểm thử extension cộng lint extension;
- thay đổi chỉ kiểm thử extension chạy typecheck kiểm thử extension cộng lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng Plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (quét Vitest extension vẫn là công việc kiểm thử tường minh);
- bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- thay đổi gốc/cấu hình không xác định fail safe sang tất cả lane kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý rẻ hơn `check:changed`: chỉnh sửa kiểm thử trực tiếp tự chạy chính chúng, chỉnh sửa nguồn ưu tiên ánh xạ tường minh, sau đó là kiểm thử sibling và phụ thuộc import-graph. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ tường minh: các thay đổi đối với cấu hình trả lời hiển thị trong nhóm, chế độ phân phối trả lời nguồn hoặc prompt hệ thống message-tool được định tuyến qua các kiểm thử trả lời lõi cộng hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung fail trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập đã ánh xạ rẻ không phải là proxy đáng tin cậy.

## Xác thực Testbox

Crabbox là wrapper remote-box do repo sở hữu cho bằng chứng Linux của maintainer. Dùng nó
từ gốc repo khi một kiểm tra quá rộng cho vòng lặp chỉnh sửa cục bộ, khi tính
tương đương CI quan trọng, hoặc khi bằng chứng cần secrets, Docker, lane gói,
box tái sử dụng hoặc log từ xa. Backend OpenClaw thông thường là
`blacksmith-testbox`; dung lượng AWS/Hetzner sở hữu là fallback cho sự cố Blacksmith,
vấn đề quota hoặc kiểm thử dung lượng sở hữu rõ ràng.

Crabbox-backed Blacksmith chạy, giữ ấm, nhận, đồng bộ, chạy, báo cáo và dọn dẹp
các Testbox dùng một lần. Kiểm tra hợp lý đồng bộ tích hợp sẵn sẽ thất bại nhanh khi các tệp
gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short`
hiển thị ít nhất 200 lượt xóa tệp đã được theo dõi. Với các PR cố ý xóa số lượng lớn, hãy đặt
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lệnh từ xa.

Crabbox cũng chấm dứt một lần gọi Blacksmith CLI cục bộ nếu nó ở trong
giai đoạn đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` để tắt cơ chế bảo vệ đó, hoặc dùng một
giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Trước lần chạy đầu tiên, kiểm tra wrapper từ gốc repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper của repo từ chối binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider một cách tường minh dù `.crabbox.yaml` đã có các mặc định owned-cloud. Trong các worktree Codex hoặc checkout liên kết/thưa, tránh script `pnpm crabbox:run` cục bộ vì pnpm có thể điều hòa dependency trước khi Crabbox khởi động; thay vào đó hãy gọi trực tiếp node wrapper:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Các lần chạy dựa trên Blacksmith cần Crabbox 0.22.0 trở lên để wrapper nhận được hành vi đồng bộ, hàng đợi và dọn dẹp Testbox hiện tại. Khi dùng checkout anh em, hãy build lại binary cục bộ bị ignore trước khi làm việc về thời gian hoặc bằng chứng:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Cổng thay đổi:

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

Bộ đầy đủ:

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

Đọc tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` và `totalMs`. Các lần chạy Crabbox dùng một lần dựa trên Blacksmith nên tự động dừng Testbox; nếu một lần chạy bị gián đoạn hoặc việc dọn dẹp không rõ ràng, hãy kiểm tra các box đang hoạt động và chỉ dừng những box bạn đã tạo:

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

Nếu Crabbox là lớp bị hỏng nhưng bản thân Blacksmith vẫn hoạt động, chỉ dùng trực tiếp
Blacksmith cho chẩn đoán như `list`, `status` và dọn dẹp. Sửa đường đi
Crabbox trước khi xem một lần chạy Blacksmith trực tiếp là bằng chứng của maintainer.

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các
warmup mới nằm ở trạng thái `queued` mà không có IP hoặc URL lần chạy Actions sau vài phút,
hãy xem đó là áp lực từ provider Blacksmith, hàng đợi, billing hoặc giới hạn tổ chức. Dừng các
id đang xếp hàng mà bạn đã tạo, tránh khởi động thêm Testbox, và chuyển bằng chứng sang
đường dẫn dung lượng Crabbox sở hữu bên dưới trong khi ai đó kiểm tra dashboard Blacksmith,
billing và giới hạn tổ chức.

Chỉ leo thang sang dung lượng Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn quota, thiếu môi trường cần thiết, hoặc dung lượng sở hữu là mục tiêu tường minh:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thật sự cần CPU hạng 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để chạm giới hạn quota EC2 Spot hoặc On-Demand Standard theo vùng. `.crabbox.yaml` do repo sở hữu mặc định dùng `standard`, nhiều vùng dung lượng và `capacity.hints: true` để các lease AWS qua broker in ra vùng/thị trường đã chọn, áp lực quota, fallback Spot và cảnh báo lớp áp lực cao. Dùng `fast` cho các kiểm tra rộng nặng hơn, `large` chỉ sau khi standard/fast không đủ, và `beast` chỉ cho các lane đặc biệt bị ràng buộc bởi CPU như bộ đầy đủ hoặc ma trận Docker toàn bộ Plugin, xác thực release/blocker tường minh, hoặc profiling hiệu năng nhiều lõi. Không dùng `beast` cho `pnpm check:changed`, kiểm thử tập trung, công việc chỉ về tài liệu, lint/typecheck thông thường, repro E2E nhỏ, hoặc triage sự cố Blacksmith. Dùng `--market on-demand` cho chẩn đoán dung lượng để biến động thị trường Spot không bị trộn vào tín hiệu.

`.crabbox.yaml` sở hữu các mặc định provider, đồng bộ và hydrate GitHub Actions cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa của riêng nó thay vì đồng bộ các remote và object store cục bộ của maintainer, và nó loại trừ các artifact runtime/build cục bộ không bao giờ nên được truyền. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không bí mật cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
