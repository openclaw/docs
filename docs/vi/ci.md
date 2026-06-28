---
read_when:
    - Bạn cần hiểu vì sao một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lượt chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi việc điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Biểu đồ tác vụ CI, cổng phạm vi, ô bao quát phát hành và các lệnh tương đương cục bộ
title: Quy trình CI
x-i18n:
    generated_at: "2026-06-28T00:10:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần đẩy lên `main` và mọi yêu cầu kéo. Các lần đẩy
`main` chuẩn trước tiên đi qua cửa sổ tiếp nhận hosted-runner 90 giây.
Nhóm đồng thời `CI` hiện có hủy lượt chạy đang chờ đó khi có commit mới hơn
được đưa lên, nên các lần hợp nhất tuần tự không lần nào cũng đăng ký một ma trận
Blacksmith đầy đủ. Yêu cầu kéo và các lần chạy thủ công bỏ qua bước chờ. Job
`preflight` sau đó phân loại diff và tắt các lane tốn kém khi chỉ những khu vực
không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua
phạm vi thông minh và bung toàn bộ đồ thị cho các bản ứng viên phát hành và
xác thực rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`.
Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong quy trình làm việc riêng
[`Plugin Trước phát hành`](#plugin-prerelease) và chỉ chạy từ
[`Xác thực phát hành đầy đủ`](#full-release-validation) hoặc một lần chạy thủ công rõ ràng.

## Tổng quan pipeline

| Job                                | Mục đích                                                                                                   | Khi chạy                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `preflight`                        | Phát hiện thay đổi chỉ tài liệu, phạm vi đã đổi, tiện ích mở rộng đã đổi, và dựng manifest CI              | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `runner-admission`                 | Chống dội hosted 90 giây cho các lần đẩy `main` chuẩn trước khi công việc Blacksmith được đăng ký          | Mọi lần chạy CI; chỉ ngủ trên các lần đẩy `main` chuẩn |
| `security-fast`                    | Phát hiện khóa riêng, kiểm tra quy trình làm việc đã đổi qua `zizmor`, và kiểm tra lockfile production     | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `check-dependencies`               | Lượt kiểm tra Knip chỉ phụ thuộc production cộng với guard danh sách cho phép tệp không dùng               | Thay đổi liên quan đến Node                          |
| `build-artifacts`                  | Dựng `dist/`, Control UI, kiểm tra khói CLI đã dựng, kiểm tra artifact dựng nhúng, và artifact tái sử dụng | Thay đổi liên quan đến Node                          |
| `checks-fast-core`                 | Các lane đúng đắn nhanh trên Linux như bundled, protocol, QA Smoke CI, và kiểm tra định tuyến CI           | Thay đổi liên quan đến Node                          |
| `checks-fast-contracts-plugins-*`  | Hai kiểm tra hợp đồng Plugin được chia shard                                                               | Thay đổi liên quan đến Node                          |
| `checks-fast-contracts-channels-*` | Hai kiểm tra hợp đồng kênh được chia shard                                                                 | Thay đổi liên quan đến Node                          |
| `checks-node-core-*`               | Các shard kiểm thử Node lõi, loại trừ các lane kênh, bundled, hợp đồng, và tiện ích mở rộng               | Thay đổi liên quan đến Node                          |
| `check-*`                          | Tương đương cổng cục bộ chính được chia shard: kiểu prod, lint, guard, kiểu test, và smoke nghiêm ngặt    | Thay đổi liên quan đến Node                          |
| `check-additional-*`               | Kiến trúc, trôi lệch ranh giới/prompt được chia shard, guard tiện ích mở rộng, ranh giới package, và topology runtime | Thay đổi liên quan đến Node                          |
| `checks-node-compat-node22`        | Lane dựng tương thích Node 22 và smoke                                                                     | Chạy CI thủ công cho các bản phát hành               |
| `check-docs`                       | Định dạng tài liệu, lint, và kiểm tra liên kết hỏng                                                        | Tài liệu thay đổi                                    |
| `skills-python`                    | Ruff + pytest cho Skills dựa trên Python                                                                   | Thay đổi liên quan đến Skill Python                  |
| `checks-windows`                   | Kiểm thử process/path đặc thù Windows cộng với hồi quy specifier import runtime dùng chung                 | Thay đổi liên quan đến Windows                       |
| `macos-node`                       | Lane kiểm thử TypeScript trên macOS dùng artifact dựng dùng chung                                          | Thay đổi liên quan đến macOS                         |
| `macos-swift`                      | Swift lint, dựng, và kiểm thử cho ứng dụng macOS                                                           | Thay đổi liên quan đến macOS                         |
| `ios-build`                        | Tạo dự án Xcode cộng với dựng trình giả lập ứng dụng iOS                                                   | Ứng dụng iOS, bộ kit ứng dụng dùng chung, hoặc thay đổi Swabble |
| `android`                          | Kiểm thử đơn vị Android cho cả hai flavor cộng với một bản dựng debug APK                                  | Thay đổi liên quan đến Android                       |
| `test-performance-agent`           | Tối ưu kiểm thử chậm Codex hằng ngày sau hoạt động đáng tin cậy                                            | CI chính thành công hoặc chạy thủ công               |
| `openclaw-performance`             | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile, và GPT 5.5 live | Theo lịch và chạy thủ công                           |

## Thứ tự fail-fast

1. `runner-admission` chỉ chờ các lần đẩy `main` chuẩn; một lần đẩy mới hơn sẽ hủy lượt chạy trước khi đăng ký Blacksmith.
2. `preflight` quyết định những lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
4. `build-artifacts` chạy chồng lên các lane Linux nhanh để các thành phần tiêu thụ hạ nguồn có thể bắt đầu ngay khi bản dựng dùng chung sẵn sàng.
5. Các lane nền tảng và runtime nặng hơn bung ra sau đó: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi có lần đẩy mới hơn trên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lượt chạy mới nhất cho cùng ref cũng đang thất bại. Các job ma trận dùng `fail-fast: false`, và `build-artifacts` báo cáo trực tiếp lỗi embedded channel, core-support-boundary, và gateway-watch thay vì xếp hàng các job xác minh nhỏ. Khóa đồng thời CI tự động được đánh phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lượt chạy main mới hơn. Các lần chạy toàn bộ bộ kiểm thử thủ công dùng `CI-manual-v1-*` và không hủy các lượt chạy đang diễn ra.

Dùng `pnpm ci:timings`, `pnpm ci:timings:recent`, hoặc `node scripts/ci-run-timings.mjs <run-id>` để tóm tắt thời gian thực, thời gian hàng đợi, job chậm nhất, lỗi, và rào chắn fanout `pnpm-store-warmup` từ GitHub Actions. CI cũng tải lên cùng bản tóm tắt lượt chạy dưới dạng artifact `ci-timings-summary`. Với thời gian dựng, kiểm tra bước `Build dist` của job `build-artifacts`: `pnpm build:ci-artifacts` in `[build-all] phase timings:` và bao gồm `ui:build`; job cũng tải lên artifact `startup-memory`.

Đối với các lượt chạy yêu cầu kéo, job timing-summary cuối cùng chạy helper từ revision cơ sở đáng tin cậy trước khi truyền `GH_TOKEN` cho `gh run view`. Điều đó giữ truy vấn có token nằm ngoài mã do nhánh kiểm soát trong khi vẫn tóm tắt lượt chạy CI hiện tại của yêu cầu kéo.

## Ngữ cảnh và bằng chứng PR

PR của người đóng góp bên ngoài chạy một cổng ngữ cảnh và bằng chứng PR từ
`.github/workflows/real-behavior-proof.yml`. Quy trình làm việc checkout commit
cơ sở đáng tin cậy và chỉ đánh giá phần thân PR; nó không thực thi mã từ nhánh
người đóng góp.

Cổng này áp dụng cho tác giả PR không phải là chủ sở hữu kho, thành viên,
cộng tác viên, hoặc bot. Nó đạt khi phần thân PR chứa các mục do tác giả viết
`What Problem This Solves` và `Evidence`. Bằng chứng có thể là một kiểm thử tập trung,
kết quả CI, ảnh chụp màn hình, bản ghi, đầu ra terminal, quan sát live,
log đã biên tập, hoặc liên kết artifact. Phần thân cung cấp ý định và xác thực hữu ích;
người review kiểm tra mã, kiểm thử, và CI để đánh giá tính đúng đắn.

Khi kiểm tra thất bại, hãy cập nhật phần thân PR thay vì đẩy thêm một commit mã khác.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Chạy thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hành xử như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa quy trình làm việc CI** xác thực đồ thị Node CI cộng với lint quy trình làm việc, nhưng tự chúng không ép các bản dựng gốc Windows, iOS, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi mã nguồn nền tảng.
- **Độ lành mạnh của quy trình làm việc** chạy `actionlint`, `zizmor` trên tất cả tệp YAML quy trình làm việc, guard nội suy composite-action, và guard dấu xung đột. Job `security-fast` trong phạm vi PR cũng chạy `zizmor` trên các tệp quy trình làm việc đã đổi để các phát hiện bảo mật quy trình làm việc thất bại sớm trong đồ thị CI chính.
- **Tài liệu trên các lần đẩy `main`** được kiểm tra bởi quy trình làm việc `Docs` độc lập với cùng bản sao tài liệu ClawHub mà CI dùng, nên các lần đẩy hỗn hợp mã+tài liệu không xếp hàng thêm shard `check-docs` của CI. Yêu cầu kéo và CI thủ công vẫn chạy `check-docs` từ CI khi tài liệu thay đổi.
- **TUI PTY** chạy trong shard Linux Node `checks-node-core-runtime-tui-pty` cho các thay đổi TUI. Shard chạy `test/vitest/vitest.tui-pty.config.ts` với `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, nên nó bao phủ cả lane fixture `TuiBackend` xác định và smoke `tui --local` chậm hơn chỉ mock endpoint mô hình bên ngoài.
- **Chỉnh sửa chỉ định tuyến CI, chỉnh sửa fixture core-test rẻ được chọn, và chỉnh sửa helper/test-routing hợp đồng Plugin hẹp** dùng một đường manifest chỉ Node nhanh: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường này bỏ qua artifact dựng, tương thích Node 22, hợp đồng kênh, toàn bộ shard lõi, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp thực thi.
- **Kiểm tra Windows Node** được giới hạn theo các wrapper process/path đặc thù Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package, và các bề mặt quy trình làm việc CI thực thi lane đó; mã nguồn không liên quan, Plugin, install-smoke, và thay đổi chỉ kiểm thử vẫn ở trên các lane Linux Node.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không dự trữ runner quá mức: hợp đồng plugin và hợp đồng kênh mỗi loại chạy dưới dạng hai shard có trọng số được Blacksmith hỗ trợ, kèm fallback runner GitHub tiêu chuẩn; các lane nhanh/hỗ trợ của core unit chạy riêng; hạ tầng runtime core được tách giữa state, process/config, shared và ba shard miền cron; auto-reply chạy dưới dạng các worker được cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch và commands/state-routing); còn cấu hình agentic gateway/server được tách qua các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã build. CI thông thường sau đó chỉ đóng gói các shard include-pattern hạ tầng cô lập vào các bundle xác định tối đa 64 tệp kiểm thử, giảm ma trận Node mà không gộp các bộ command/cron không cô lập, agents-core có trạng thái, hoặc gateway/server; các bộ nặng cố định vẫn dùng 8 vCPU trong khi các lane được bundle và có trọng số thấp hơn dùng 4 vCPU. Pull request trên kho chính tắc dùng thêm một kế hoạch tiếp nhận nhỏ gọn: cùng các nhóm theo cấu hình chạy trong các subprocess cô lập bên trong kế hoạch Linux Node 34 job hiện tại, nên một PR đơn lẻ không đăng ký toàn bộ ma trận Node hơn 70 job. Các lần push lên `main`, dispatch thủ công và cổng release vẫn giữ toàn bộ ma trận. Các kiểm thử trình duyệt diện rộng, QA, media và plugin linh tinh dùng cấu hình Vitest chuyên dụng của chúng thay vì catch-all plugin dùng chung. Các shard include-pattern ghi lại mục timing bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ một cấu hình với một shard đã lọc. `check-additional-*` giữ công việc compile/canary theo ranh giới package cùng nhau và tách kiến trúc topology runtime khỏi phạm vi theo dõi gateway; danh sách boundary guard được chia sọc thành một shard nặng về prompt và một shard kết hợp cho các sọc guard còn lại, mỗi shard chạy đồng thời các guard độc lập đã chọn và in timing cho từng check. Bước kiểm tra drift snapshot prompt happy-path Codex tốn kém chạy như một job bổ sung riêng cho CI thủ công và chỉ cho các thay đổi ảnh hưởng đến prompt, nên các thay đổi Node bình thường không liên quan không phải chờ sau quá trình tạo snapshot prompt lạnh, và các shard boundary vẫn cân bằng trong khi drift prompt vẫn được gắn với PR đã gây ra nó; cùng cờ đó bỏ qua việc tạo Vitest snapshot prompt bên trong shard support-boundary core của artifact đã build. Gateway watch, kiểm thử kênh và shard support-boundary core chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Sau khi được tiếp nhận, CI Linux chính tắc cho phép tối đa 24 job kiểm thử Node chạy đồng thời và
12 cho các lane fast/check nhỏ hơn; Windows và Android vẫn ở mức hai vì
các pool runner đó hẹp hơn.

Kế hoạch PR nhỏ gọn phát ra 18 job Node cho bộ hiện tại: các nhóm whole-config
được gom batch trong các subprocess cô lập với timeout batch 120 phút,
trong khi các nhóm include-pattern dùng chung cùng ngân sách job có giới hạn.

CI Android chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi build Play debug APK. Flavor bên thứ ba không có source set hoặc manifest riêng; lane unit-test của nó vẫn compile flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh một job đóng gói debug APK trùng lặp trên mọi lần push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ kiểm tra dependency production, ghim theo phiên bản Knip mới nhất, với độ tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, bước so sánh các phát hiện tệp không dùng trong production của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng sẽ fail khi một PR thêm tệp không dùng mới chưa được review hoặc để lại một mục allowlist cũ, đồng thời giữ lại các bề mặt plugin động, generated, build, live-test và package bridge có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động kho OpenClaw sang ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` nhỏ gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho các yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho các yêu cầu review cấp commit trên các lần push `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, actor, kho, số item, URL, tiêu đề, trạng thái và đoạn trích ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ phần thân webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, workflow này đăng sự kiện đã chuẩn hóa tới hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải mặc định gửi đi. Agent ClawSweeper nhận đích Discord trong prompt của nó và chỉ nên đăng lên `#clawsweeper` khi sự kiện gây bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về mặt vận hành. Các lần mở, chỉnh sửa, churn bot, nhiễu webhook trùng lặp và lưu lượng review bình thường nên trả về `NO_REPLY`.

Xem tiêu đề GitHub, bình luận, body, văn bản review, tên branch và thông điệp commit là dữ liệu không đáng tin cậy trong toàn bộ đường dẫn này. Chúng là đầu vào cho tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng buộc bật mọi lane theo phạm vi không phải Android: shard Linux Node, shard bundled-plugin, shard hợp đồng plugin và kênh, tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra smoke artifact đã build, kiểm tra tài liệu, Python skills, Windows, macOS, iOS build và Control UI i18n. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella release đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh prerelease plugin, shard `agentic-plugins` chỉ dành cho release, sweep batch extension đầy đủ và các lane Docker prerelease plugin bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với cổng release-validation được bật.

Các lần chạy thủ công dùng một nhóm concurrency duy nhất để một bộ đầy đủ cho release-candidate không bị hủy bởi một lần push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép một caller đáng tin cậy chạy đồ thị đó trên một branch, tag hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch CI thủ công và fallback kho không chính tắc, scan chất lượng CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow tài liệu ngoài CI và preflight install-smoke để ma trận Blacksmith có thể vào hàng đợi sớm hơn                                    |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard extension trọng số thấp hơn, `checks-fast-core`, shard hợp đồng plugin/kênh, hầu hết shard Linux Node bundled/trọng số thấp hơn, `check-guards`, `check-prod-types`, `check-test-types`, các shard `check-additional-*` được chọn và `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Các bộ Linux Node nặng được giữ lại, shard `check-additional-*` nặng về boundary/extension và `android`                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (nhạy CPU đến mức 8 vCPU tốn chi phí nhiều hơn mức tiết kiệm); build Docker install-smoke (thời gian hàng đợi 32 vCPU tốn nhiều hơn mức tiết kiệm)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` trên `openclaw/openclaw`; fork fallback về `macos-15`                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` và `ios-build` trên `openclaw/openclaw`; fork fallback về `macos-26`                                                                                                                                                                                                  |

## Ngân sách đăng ký runner

Bucket đăng ký runner GitHub hiện tại của OpenClaw cho phép 3.000 lượt đăng ký runner self-hosted
mỗi 5 phút. Giới hạn này được chia sẻ bởi tất cả đăng ký runner Blacksmith
trong tổ chức `openclaw`, nên việc thêm một cài đặt Blacksmith khác
không thêm bucket mới.

Xem nhãn Blacksmith là tài nguyên khan hiếm để kiểm soát burst. Các job
chỉ định tuyến, thông báo, tóm tắt, chọn shard hoặc chạy scan CodeQL ngắn nên
ở lại trên runner do GitHub host trừ khi chúng có nhu cầu riêng cho Blacksmith
đã được đo lường. Mọi ma trận Blacksmith mới, `max-parallel` lớn hơn hoặc
workflow tần suất cao phải thể hiện số đăng ký trong trường hợp xấu nhất và giữ
mục tiêu cấp org dưới 2.000 lượt đăng ký mỗi 5 phút, chừa headroom cho các
kho chạy đồng thời và các job được retry.

CI kho chính tắc giữ Blacksmith làm đường dẫn runner mặc định cho các lần chạy push và pull-request thông thường. `workflow_dispatch` và các lần chạy kho không chính tắc dùng runner do GitHub host, nhưng các lần chạy chính tắc thông thường hiện không thăm dò tình trạng hàng đợi Blacksmith hoặc tự động fallback sang nhãn do GitHub host khi Blacksmith không khả dụng.

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

`OpenClaw Performance` là quy trình hiệu năng của sản phẩm/runtime. Quy trình này chạy hằng ngày trên `main` và có thể được kích hoạt thủ công:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Kích hoạt thủ công thường benchmark ref của workflow. Đặt `target_ref` để benchmark một thẻ phát hành hoặc một nhánh khác bằng phần triển khai workflow hiện tại. Các đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được khóa theo ref đã kiểm thử, và mỗi `index.md` ghi lại ref/SHA đã kiểm thử, ref/SHA của workflow, ref Kova, hồ sơ, chế độ xác thực làn, mô hình, số lần lặp và bộ lọc kịch bản.

Workflow cài đặt OCM từ một bản phát hành đã ghim và Kova từ `openclaw/Kova` tại input `kova_ref` đã ghim, rồi chạy ba làn:

- `mock-provider`: các kịch bản chẩn đoán Kova chạy với runtime bản dựng cục bộ bằng xác thực giả lập tương thích OpenAI có tính xác định.
- `mock-deep-profile`: lập hồ sơ CPU/heap/trace cho các điểm nóng khi khởi động, Gateway và lượt agent.
- `live-openai-candidate`: một lượt agent OpenAI `openai/gpt-5.5` thật, được bỏ qua khi không có `OPENAI_API_KEY`.

Làn mock-provider cũng chạy các probe nguồn gốc OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ trên các trường hợp khởi động mặc định, hook và 50 Plugin; RSS khi nhập Plugin đóng gói, các vòng lặp hello `channel-chat-baseline` mock-OpenAI lặp lại, lệnh khởi động CLI với Gateway đã khởi động, và probe hiệu năng smoke trạng thái SQLite. Khi báo cáo nguồn mock-provider đã xuất bản trước đó có sẵn cho ref được kiểm thử, phần tóm tắt nguồn sẽ so sánh các giá trị RSS và heap hiện tại với baseline đó và đánh dấu các mức tăng RSS lớn là `watch`. Bản tóm tắt Markdown của probe nguồn nằm tại `source/index.md` trong gói báo cáo, với JSON thô đặt bên cạnh.

Mỗi làn tải artifact lên GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các gói, `index.md` và artifact probe nguồn vào `openclaw/clawgrit-reports` trong `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ ref đã kiểm thử hiện tại được ghi dưới dạng `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực bản phát hành đầy đủ

`Full Release Validation` là workflow bao quát thủ công cho việc "chạy mọi thứ trước khi phát hành." Nó nhận một nhánh, thẻ hoặc SHA commit đầy đủ, kích hoạt workflow `CI` thủ công với mục tiêu đó, kích hoạt `Plugin Prerelease` cho bằng chứng chỉ dành cho phát hành của Plugin/gói/tĩnh/Docker, và kích hoạt `OpenClaw Release Checks` cho smoke cài đặt, chấp nhận gói, kiểm tra gói đa hệ điều hành, render scorecard mức độ trưởng thành từ bằng chứng hồ sơ QA, tương đương QA Lab, Matrix và các làn Telegram. Hồ sơ stable và full luôn bao gồm phạm vi soak đường dẫn phát hành live/E2E và Docker đầy đủ; hồ sơ beta có thể bật bằng `run_release_soak=true`. Telegram E2E gói chuẩn chạy bên trong Package Acceptance, nên một ứng viên đầy đủ không khởi động poller live trùng lặp. Sau khi xuất bản, truyền `release_package_spec` để dùng lại gói npm đã phát hành trên release checks, Package Acceptance, Docker, đa hệ điều hành và Telegram mà không dựng lại. Chỉ dùng `npm_telegram_package_spec` cho một lần chạy lại Telegram tập trung trên gói đã xuất bản. Làn gói live Plugin Codex dùng cùng trạng thái đã chọn theo mặc định: `release_package_spec=openclaw@<tag>` đã xuất bản suy ra `codex_plugin_spec=npm:@openclaw/codex@<tag>`, còn các lần chạy SHA/artifact đóng gói `extensions/codex` từ ref đã chọn. Đặt rõ `codex_plugin_spec` cho các nguồn Plugin tùy chỉnh như thông số `npm:`, `npm-pack:` hoặc `git:`.

Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết ma trận giai đoạn, tên job workflow chính xác, khác biệt giữa các hồ sơ, artifact và các điểm điều khiển chạy lại tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Kích hoạt workflow này từ `release/YYYY.M.PATCH` hoặc `main` sau khi thẻ phát hành tồn tại và sau khi preflight npm OpenClaw đã thành công. Nó xác minh `pnpm plugins:sync:check`, kích hoạt `Plugin NPM Release` cho tất cả gói Plugin có thể xuất bản, kích hoạt `Plugin ClawHub Release` cho cùng SHA phát hành, và chỉ sau đó mới kích hoạt `OpenClaw NPM Release` với `preflight_run_id` đã lưu. Bản xuất bản stable cũng yêu cầu `windows_node_tag` chính xác; workflow xác minh bản phát hành nguồn Windows và so sánh trình cài đặt x64/ARM64 của nó với input `windows_node_installer_digests` đã được ứng viên phê duyệt trước mọi workflow con xuất bản, rồi promote và xác minh chính các digest trình cài đặt đã ghim đó cùng artifact đồng hành chính xác và hợp đồng checksum trước khi xuất bản bản nháp phát hành GitHub.

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

Ref kích hoạt workflow GitHub phải là nhánh hoặc thẻ, không phải SHA commit thô. Helper đẩy một nhánh tạm thời `release-ci/<sha>-...` tại SHA mục tiêu, kích hoạt `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con có `headSha` khớp với mục tiêu, và xóa nhánh tạm thời khi lần chạy hoàn tất. Trình xác minh bao quát cũng thất bại nếu bất kỳ workflow con nào chạy ở SHA khác.

`release_profile` kiểm soát độ rộng live/provider truyền vào release checks. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn chủ ý muốn ma trận provider/media tư vấn rộng. Release checks stable và full luôn chạy soak đường dẫn phát hành live/E2E và Docker đầy đủ; hồ sơ beta có thể bật bằng `run_release_soak=true`.

- `minimum` giữ các làn OpenAI/core quan trọng cho phát hành nhanh nhất.
- `stable` thêm bộ provider/backend stable.
- `full` chạy ma trận provider/media tư vấn rộng.

Workflow bao quát ghi lại id các lần chạy con đã kích hoạt, và job cuối cùng `Verify full validation` kiểm tra lại kết luận hiện tại của các lần chạy con và nối thêm bảng job chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển sang xanh, chỉ chạy lại job xác minh cha để làm mới kết quả bao quát và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho workflow con full CI bình thường, `plugin-prerelease` chỉ cho workflow con prerelease Plugin, `release-checks` cho mọi workflow con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` hoặc `npm-telegram` trên workflow bao quát. Điều này giữ phạm vi chạy lại một ô phát hành thất bại sau một bản sửa tập trung. Với một làn đa hệ điều hành thất bại, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh đa hệ điều hành dài phát ra dòng Heartbeat và phần tóm tắt packaged-upgrade bao gồm thời gian theo từng pha. Các làn QA release-check mang tính tư vấn, ngoại trừ cổng phạm vi công cụ runtime chuẩn, cổng này chặn khi các công cụ động OpenClaw bắt buộc bị lệch hoặc biến mất khỏi phần tóm tắt cấp chuẩn.

`OpenClaw Release Checks` dùng ref workflow tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho kiểm tra đa hệ điều hành và Package Acceptance, cùng workflow Docker đường dẫn phát hành live/E2E khi chạy phạm vi soak. Điều này giữ byte của gói nhất quán trên các ô phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều job con. Đối với làn live Plugin npm Codex, release checks hoặc truyền một thông số Plugin đã xuất bản khớp được suy ra từ `release_package_spec`, truyền `codex_plugin_spec` do người vận hành cung cấp, hoặc để trống input để script Docker đóng gói Plugin Codex của checkout đã chọn.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all` thay thế workflow bao quát cũ hơn. Bộ giám sát cha hủy mọi workflow con mà nó đã kích hoạt khi workflow cha bị hủy, nên xác thực main mới hơn không phải chờ sau một lần chạy release-check cũ kéo dài hai giờ. Xác thực nhánh/thẻ phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Các phân đoạn live và E2E

Workflow con live/E2E của phát hành giữ phạm vi `pnpm test:live` native rộng, nhưng chạy nó thành các phân đoạn có tên thông qua `scripts/test-live-shard.mjs` thay vì một job tuần tự:

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
- các phân đoạn media audio/video tách riêng và các phân đoạn music được lọc theo provider

Điều đó giữ cùng phạm vi tệp trong khi giúp chạy lại và chẩn đoán các lỗi provider live chậm dễ hơn. Các tên phân đoạn tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media` và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các phân đoạn media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được dựng bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên runner Blacksmith bình thường — job container không phải nơi phù hợp để khởi chạy các kiểm thử Docker lồng nhau.

Các shard mô hình/backend live dựa trên Docker sử dụng một image `ghcr.io/openclaw/openclaw-live-test:<sha>` dùng chung riêng cho mỗi commit được chọn. Workflow phát hành live build và push image đó một lần, sau đó các shard mô hình live Docker, Gateway chia shard theo provider, backend CLI, ACP bind và Codex harness chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang các giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout của job workflow, để container bị kẹt hoặc đường dọn dẹp lỗi nhanh thay vì tiêu thụ toàn bộ ngân sách kiểm tra phát hành. Nếu các shard đó tự build lại toàn bộ target Docker nguồn một cách độc lập, lần chạy phát hành đang bị cấu hình sai và sẽ lãng phí thời gian thực cho các bản build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng Docker E2E harness mà người dùng chạy sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256 và hồ sơ trong phần tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory của tarball, chuẩn bị image Docker package-digest khi cần, và chạy các lane Docker đã chọn với gói đó thay vì đóng gói checkout của workflow. Khi một hồ sơ chọn nhiều `docker_lanes` mục tiêu, workflow tái sử dụng chuẩn bị gói và image dùng chung một lần, rồi fan out các lane đó thành các job Docker mục tiêu song song với artifact riêng.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã xuất bản.
4. `summary` làm workflow thất bại nếu phân giải gói, chấp nhận Docker, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng tùy chọn này cho chấp nhận bản prerelease/stable đã xuất bản.
- `source=ref` đóng gói một nhánh, tag hoặc full commit SHA `package_ref` đáng tin cậy. Bộ phân giải fetch các nhánh/tag OpenClaw, xác minh commit được chọn có thể truy cập từ lịch sử nhánh repository hoặc một release tag, cài đặt dependency trong một worktree tách rời, rồi đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS công khai; bắt buộc có `package_sha256`. Đường dẫn này từ chối thông tin xác thực trong URL, cổng HTTPS không mặc định, hostname hoặc IP được phân giải thuộc loại riêng tư/nội bộ/special-use, và redirect ra ngoài cùng chính sách an toàn công khai.
- `source=trusted-url` tải xuống một `.tgz` HTTPS từ một chính sách trusted-source có tên trong `.github/package-trusted-sources.json`; bắt buộc có `package_sha256` và `trusted_source_id`. Chỉ dùng tùy chọn này cho mirror doanh nghiệp do maintainer sở hữu hoặc repository gói riêng tư cần host, cổng, tiền tố đường dẫn, host redirect hoặc phân giải mạng riêng đã cấu hình. Nếu chính sách khai báo bearer auth, workflow dùng secret cố định `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; thông tin xác thực nhúng trong URL vẫn bị từ chối.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho artifact chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy bài kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép test harness hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Hồ sơ bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Hồ sơ `package` dùng coverage plugin ngoại tuyến để xác thực gói đã xuất bản không bị chặn bởi khả năng sẵn sàng live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, đồng thời giữ đường dẫn spec npm đã xuất bản cho các dispatch độc lập.

Để xem chính sách chuyên biệt cho kiểm thử cập nhật và plugin, bao gồm lệnh cục bộ,
lane Docker, input Package Acceptance, mặc định phát hành và phân loại lỗi,
xem [Kiểm thử cập nhật và plugin](/vi/help/testing-updates-plugins).

Các kiểm tra phát hành gọi Package Acceptance với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ proof cho migration gói, cập nhật, cài đặt skill ClawHub live, dọn dẹp dependency plugin cũ, sửa cài đặt plugin đã cấu hình, plugin ngoại tuyến, plugin-update và Telegram trên cùng tarball gói đã phân giải. Đặt `release_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks sau khi xuất bản beta để chạy cùng ma trận với gói npm đã phát hành mà không build lại; chỉ đặt `package_acceptance_package_spec` khi Package Acceptance cần một gói khác với phần còn lại của xác thực phát hành. Kiểm tra phát hành đa hệ điều hành vẫn bao phủ onboarding, trình cài đặt và hành vi nền tảng đặc thù hệ điều hành; xác thực sản phẩm gói/cập nhật nên bắt đầu với Package Acceptance. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã xuất bản cho mỗi lần chạy trong đường dẫn phát hành chặn. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã xuất bản dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng qua bốn bản phát hành npm stable mới nhất cộng với các bản phát hành ranh giới tương thích plugin được ghim và fixture theo dạng issue cho cấu hình Feishu, file bootstrap/persona được giữ lại, cài đặt plugin OpenClaw đã cấu hình, đường dẫn log dấu ngã và root dependency plugin legacy cũ. Các lựa chọn published-upgrade survivor nhiều baseline được chia shard theo baseline thành các job Docker runner mục tiêu riêng biệt. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã xuất bản toàn diện, không phải độ bao phủ CI Full Release thông thường. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã xuất bản cấu hình baseline bằng một công thức lệnh `openclaw config set` được baked sẵn, ghi lại các bước công thức trong `summary.json`, và probe `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane mới cho gói Windows và trình cài đặt cũng xác minh rằng một gói đã cài đặt có thể import override browser-control từ một đường dẫn Windows tuyệt đối thô. Smoke lượt agent OpenAI đa hệ điều hành mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì `openai/gpt-5.5`, để proof cài đặt và Gateway vẫn dùng một mô hình kiểm thử GPT-5 trong khi tránh các mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Package Acceptance có các cửa sổ tương thích legacy có giới hạn cho những gói đã xuất bản. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ tới các file bị bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase lưu bền `gateway install --wrapper` khi gói không expose flag đó;
- `update-channel-switch` có thể cắt bỏ `patchedDependencies` pnpm bị thiếu khỏi fixture git giả dẫn xuất từ tarball và có thể log `update.channel` đã lưu bền bị thiếu;
- smoke plugin có thể đọc các vị trí install-record legacy hoặc chấp nhận thiếu lưu bền install-record marketplace;
- `plugin-update` có thể cho phép migration metadata cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã xuất bản cũng có thể cảnh báo cho các file stamp metadata build cục bộ đã được phát hành. Các gói sau đó phải thỏa mãn các hợp đồng hiện đại; cùng những điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi debug một lần chạy chấp nhận gói thất bại, hãy bắt đầu từ tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời gian các phase và lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói thất bại hoặc các lane Docker chính xác thay vì chạy lại xác thực phát hành đầy đủ.

## Smoke cài đặt

Workflow `Install Smoke` riêng tái sử dụng cùng script phạm vi thông qua job `preflight` của nó. Nó chia coverage smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Luồng nhanh** chạy cho các yêu cầu kéo chạm đến các bề mặt Docker/gói, thay đổi gói/manifest Plugin được đóng gói kèm, hoặc các bề mặt Plugin SDK/kênh/plugin/lõi/Gateway mà các tác vụ smoke Docker kiểm tra. Các thay đổi Plugin được đóng gói kèm chỉ ở mã nguồn, chỉnh sửa chỉ kiểm thử, và chỉnh sửa chỉ tài liệu không giữ trước worker Docker. Luồng nhanh dựng ảnh Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa workspace dùng chung của agent, chạy e2e gateway-network trong container, xác minh một tham số dựng extension được đóng gói kèm, và chạy hồ sơ Docker Plugin được đóng gói kèm có giới hạn trong thời gian chờ lệnh tổng hợp 240 giây (mỗi lần chạy Docker của kịch bản được giới hạn riêng).
- **Luồng đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update trình cài đặt cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call, và các yêu cầu kéo thực sự chạm đến các bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một ảnh smoke Dockerfile gốc GHCR theo SHA mục tiêu, sau đó chạy cài đặt gói QR, smoke Dockerfile/gateway gốc, smoke trình cài đặt/update, và Docker E2E Plugin được đóng gói kèm luồng nhanh dưới dạng các tác vụ riêng để công việc trình cài đặt không phải chờ sau các smoke ảnh gốc.

Các lần push lên `main` (bao gồm commit merge) không ép dùng luồng đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một lần push, quy trình vẫn giữ smoke Docker nhanh và để smoke cài đặt đầy đủ cho xác thực hằng đêm hoặc phát hành.

Smoke image-provider cài đặt Bun global chậm được chặn riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ quy trình kiểm tra phát hành, và các dispatch thủ công `Install Smoke` có thể bật nó, nhưng yêu cầu kéo và các lần push lên `main` thì không. CI yêu cầu kéo thông thường vẫn chạy lane hồi quy trình khởi chạy Bun nhanh cho các thay đổi liên quan đến Node. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng sẵn một ảnh live-test dùng chung, đóng gói OpenClaw một lần thành tarball npm, và dựng hai ảnh `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane trình cài đặt/update/phụ thuộc-plugin;
- một ảnh chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn ảnh theo từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, sau đó chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số tinh chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot của pool chính cho các lane thông thường.                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot của pool đuôi nhạy với nhà cung cấp.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để nhà cung cấp không throttle.                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5        | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều dịch vụ đồng thời.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ lệch giữa các lần bắt đầu lane để tránh bão tạo Docker daemon; đặt `0` để không lệch.      |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Thời gian chờ dự phòng theo lane (120 phút); các lane live/đuôi được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in kế hoạch bộ lập lịch mà không chạy lane.                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agent có thể tái hiện một lane lỗi. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể bắt đầu từ một pool trống, sau đó chạy một mình cho đến khi nhả dung lượng. Preflight tổng hợp cục bộ kiểm tra Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời gian lane để sắp xếp dài nhất trước, và mặc định dừng lên lịch các lane trong pool mới sau lỗi đầu tiên.

### Quy trình live/E2E tái sử dụng

Quy trình live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` cần phạm vi gói, loại ảnh, ảnh live, lane, và thông tin xác thực nào. `scripts/docker-e2e.mjs` sau đó chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại, hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; dựng và push các ảnh Docker E2E GHCR bare/functional được gắn thẻ theo digest gói qua cache lớp Docker của Blacksmith khi kế hoạch cần các lane đã cài đặt gói; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các ảnh theo digest gói hiện có thay vì dựng lại. Các lần pull ảnh Docker được thử lại với thời gian chờ giới hạn 180 giây cho mỗi lần thử để một luồng registry/cache bị kẹt sẽ thử lại nhanh thay vì tiêu thụ phần lớn đường găng CI.

### Các phần của luồng phát hành

Phạm vi Docker phát hành chạy các tác vụ chia nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phần chỉ pull loại ảnh cần thiết và thực thi nhiều lane qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các phần Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `package-update-openai` bao gồm lane gói Plugin Codex live, cài đặt gói OpenClaw ứng viên, cài đặt Plugin Codex từ `codex_plugin_spec` hoặc tarball cùng ref với phê duyệt cài đặt Codex CLI rõ ràng, chạy preflight Codex CLI, rồi chạy nhiều lượt agent OpenClaw cùng phiên với OpenAI. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các alias Plugin/runtime tổng hợp. Alias lane `install-e2e` vẫn là alias chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt nhà cung cấp.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ phần `openwebui` độc lập cho các dispatch chỉ OpenWebUI. Các lane update kênh được đóng gói kèm thử lại một lần cho lỗi mạng npm tạm thời.

Mỗi phần tải lên `.artifacts/docker-tests/` với log lane, thời gian, `summary.json`, `failures.json`, thời gian pha, JSON kế hoạch bộ lập lịch, bảng lane chậm, và lệnh chạy lại theo từng lane. Input `docker_lanes` của quy trình chạy các lane đã chọn với các ảnh đã chuẩn bị thay vì các tác vụ phần, giữ việc gỡ lỗi lane lỗi trong phạm vi một tác vụ Docker mục tiêu và chuẩn bị, tải xuống, hoặc tái sử dụng artifact gói cho lần chạy đó; nếu một lane được chọn là lane Docker live, tác vụ mục tiêu dựng ảnh live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name`, và input ảnh đã chuẩn bị khi các giá trị đó tồn tại, để một lane lỗi có thể tái sử dụng đúng gói và ảnh từ lần chạy lỗi.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Quy trình live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Plugin Prerelease

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, vì vậy nó là một quy trình riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các yêu cầu kéo thông thường, các lần push lên `main`, và các dispatch CI thủ công độc lập không bật bộ này. Nó cân bằng kiểm thử Plugin được đóng gói kèm trên tám worker extension; các tác vụ shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch Plugin nặng import không tạo thêm tác vụ CI. Luồng Docker prerelease chỉ phát hành batch các lane Docker mục tiêu thành nhóm nhỏ để tránh giữ trước hàng chục runner cho các tác vụ kéo dài một đến ba phút. Quy trình cũng tải lên artifact thông tin `plugin-inspector-advisory` từ `@openclaw/plugin-inspector`; các phát hiện inspector là đầu vào phân loại và không thay đổi cổng chặn Plugin Prerelease.

## QA Lab

QA Lab có các lane CI chuyên dụng bên ngoài quy trình smart-scoped chính. Tính tương đương agentic được lồng dưới các harness QA rộng và phát hành, không phải một quy trình PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi tính tương đương nên đi cùng một lần chạy xác thực rộng.

- Quy trình `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó phân tán lane mock parity, lane Matrix live, và các lane Telegram và Discord live thành các tác vụ song song. Các tác vụ live dùng môi trường `qa-live-shared`, và Telegram/Discord dùng lease Convex.

Kiểm tra phát hành chạy các lane transport live Matrix và Telegram với nhà cung cấp mock xác định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được tách khỏi độ trễ model live và khởi động provider-plugin thông thường. Gateway transport live tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; kết nối nhà cung cấp được bao phủ bởi các bộ model live, nhà cung cấp native, và nhà cung cấp Docker riêng.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và input quy trình thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard toàn bộ phạm vi Matrix thành các tác vụ `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho phát hành trước phê duyệt phát hành; cổng QA parity của nó chạy các gói ứng viên và baseline dưới dạng tác vụ lane song song, rồi tải cả hai artifact xuống một tác vụ báo cáo nhỏ để so sánh parity cuối cùng.

Với các yêu cầu kéo thông thường, hãy theo bằng chứng CI/kiểm tra theo phạm vi thay vì xem parity là một trạng thái bắt buộc.

## CodeQL

Quy trình `CodeQL` cố ý là trình quét bảo mật lượt đầu hẹp, không phải quét toàn bộ kho. Các lần chạy hằng ngày, thủ công, và guard yêu cầu kéo không phải bản nháp quét mã quy trình Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng các truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Guard yêu cầu kéo vẫn nhẹ: nó chỉ bắt đầu cho các thay đổi dưới `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như quy trình theo lịch. CodeQL Android và macOS không nằm trong mặc định yêu cầu kéo.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                                    |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Xác thực, bí mật, sandbox, Cron và đường cơ sở Gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Các hợp đồng triển khai kênh lõi cùng với runtime Plugin kênh, Gateway, Plugin SDK, bí mật và các điểm chạm kiểm toán                    |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt SSRF lõi, phân tích cú pháp IP, bảo vệ mạng, web-fetch và chính sách SSRF của Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, helper thực thi quy trình, phân phối ra ngoài và cổng thực thi công cụ của tác nhân                                         |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của cài đặt Plugin, loader, manifest, registry, cài đặt bằng trình quản lý gói, tải nguồn và hợp đồng gói Plugin SDK |

### Các phân mảnh bảo mật theo nền tảng

- `CodeQL Android Critical Security` — phân mảnh bảo mật Android theo lịch. Xây dựng ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được kiểm tra hợp lệ workflow chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — phân mảnh bảo mật macOS hằng tuần/thủ công. Xây dựng ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF được tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chi phối thời gian chạy ngay cả khi sạch.

### Danh mục Chất lượng Nghiêm trọng

`CodeQL Critical Quality` là phân mảnh phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không liên quan đến bảo mật, mức độ lỗi, trên các bề mặt hẹp có giá trị cao trên runner Linux do GitHub lưu trữ để các lần quét chất lượng không tiêu tốn ngân sách đăng ký runner Blacksmith. Guard pull request của nó cố ý nhỏ hơn hồ sơ theo lịch: PR không phải nháp chỉ chạy các phân mảnh `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` và `plugin-sdk-reply-runtime` tương ứng cho các thay đổi về mã thực thi lệnh/mô hình/công cụ của tác nhân và điều phối trả lời, mã schema/di chuyển/IO cấu hình, mã xác thực/bí mật/sandbox/bảo mật, runtime kênh lõi và Plugin kênh được đóng gói, giao thức Gateway/phương thức máy chủ, runtime bộ nhớ/keo nối SDK, MCP/quy trình/phân phối ra ngoài, danh mục runtime/mô hình nhà cung cấp, chẩn đoán phiên/hàng đợi phân phối, loader Plugin, Plugin SDK/hợp đồng gói, hoặc runtime trả lời Plugin SDK. Các thay đổi cấu hình CodeQL và workflow chất lượng chạy cả mười hai phân mảnh chất lượng PR.

Điều phối thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là hook hướng dẫn/lặp để chạy riêng một phân mảnh chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật cho xác thực, bí mật, sandbox, Cron và Gateway                                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Các hợp đồng schema cấu hình, di chuyển, chuẩn hóa và IO                                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Các hợp đồng triển khai Plugin kênh lõi và Plugin kênh được đóng gói                                                                                                       |
| `/codeql-critical-quality/agent-runtime-boundary`       | Các hợp đồng runtime cho thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi tự động trả lời, và mặt phẳng điều khiển ACP                                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, helper giám sát quy trình, và hợp đồng phân phối ra ngoài                                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, bí danh Plugin SDK bộ nhớ, keo nối kích hoạt runtime bộ nhớ, và lệnh doctor bộ nhớ                                             |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, helper ràng buộc/phân phối phiên ra ngoài, bề mặt gói sự kiện/log chẩn đoán, và hợp đồng CLI doctor phiên             |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đến Plugin SDK, helper payload/chunking/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối, và helper ràng buộc phiên/luồng                    |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, xác thực và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/danh mục nhà cung cấp, và registry web/tìm kiếm/fetch/embedding     |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lưu trữ cục bộ, luồng điều khiển Gateway, và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Các hợp đồng runtime cho fetch/tìm kiếm web lõi, IO phương tiện, hiểu phương tiện, tạo hình ảnh, và tạo phương tiện                                                        |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng loader, registry, bề mặt công khai, và điểm vào Plugin SDK                                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và helper hợp đồng gói Plugin                                                                                                      |

Chất lượng được tách riêng khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không làm mờ tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin được đóng gói chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc được phân mảnh sau khi các hồ sơ hẹp có runtime và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là một làn bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được đưa vào. Nó không có lịch thuần túy: một lần chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và điều phối thủ công có thể chạy trực tiếp. Các lời gọi workflow-run bỏ qua khi `main` đã tiến lên hoặc khi một lần chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ vừa qua. Khi chạy, nó rà soát phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, nên một lần chạy theo giờ có thể bao phủ mọi thay đổi main tích lũy kể từ lần rà soát tài liệu gần nhất.

### Test Performance Agent

Workflow `Test Performance Agent` là một làn bảo trì Codex theo sự kiện dành cho các bài kiểm thử chậm. Nó không có lịch thuần túy: một lần chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lời gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Điều phối thủ công bỏ qua cổng hoạt động hằng ngày đó. Làn này xây dựng báo cáo hiệu năng Vitest được nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ phạm vi phủ thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng bài kiểm thử pass ở baseline. Báo cáo được nhóm ghi lại wall time theo từng cấu hình và RSS tối đa trên Linux và macOS, nên phép so sánh trước/sau hiển thị delta bộ nhớ kiểm thử bên cạnh delta thời lượng. Nếu baseline có bài kiểm thử thất bại, Codex chỉ được sửa các lỗi hiển nhiên và báo cáo toàn bộ bộ kiểm thử sau-agent phải pass trước khi bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi bot push được đưa vào, làn này rebase bản vá đã được xác thực, chạy lại `pnpm check:changed`, và thử push lại; các bản vá cũ bị xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub lưu trữ để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi merge

Workflow `Duplicate PRs After Merge` là một workflow thủ công cho maintainer để dọn dẹp bản trùng lặp sau khi land. Nó mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi bản trùng lặp có issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck core prod và core test cùng lint/guard lõi;
- thay đổi chỉ dành cho kiểm thử lõi chỉ chạy typecheck core test cùng lint lõi;
- thay đổi production extension chạy typecheck extension prod và extension test cùng lint extension;
- thay đổi chỉ dành cho kiểm thử extension chạy typecheck extension test cùng lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng Plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (các lần quét extension Vitest vẫn là công việc kiểm thử rõ ràng);
- bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- thay đổi root/cấu hình không xác định fail safe sang mọi làn kiểm tra.

Định tuyến kiểm thử thay đổi cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý rẻ hơn `check:changed`: chỉnh sửa trực tiếp bài kiểm thử sẽ tự chạy chính chúng, chỉnh sửa nguồn ưu tiên các ánh xạ rõ ràng, sau đó đến bài kiểm thử sibling và các phần phụ thuộc theo import-graph. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ rõ ràng: thay đổi đối với cấu hình trả lời hiển thị trong nhóm, chế độ phân phối trả lời nguồn, hoặc prompt hệ thống message-tool được định tuyến qua các bài kiểm thử trả lời lõi cùng hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung thất bại trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập được ánh xạ rẻ không phải proxy đáng tin cậy.

## Xác thực Testbox

Crabbox là wrapper remote-box do repo sở hữu cho bằng chứng Linux của maintainer. Dùng nó
từ repo root khi một kiểm tra quá rộng cho vòng lặp chỉnh sửa cục bộ, khi tính
tương đồng CI quan trọng, hoặc khi bằng chứng cần bí mật, Docker, làn gói,
box tái sử dụng, hoặc log từ xa. Backend OpenClaw thông thường là
`blacksmith-testbox`; dung lượng AWS/Hetzner được sở hữu là phương án dự phòng cho sự cố Blacksmith,
vấn đề hạn ngạch, hoặc kiểm thử dung lượng sở hữu rõ ràng.

Crabbox dựa trên Blacksmith chạy, khởi động sẵn, nhận, đồng bộ, chạy, báo cáo và dọn dẹp các Testbox dùng một lần. Kiểm tra hợp lý đồng bộ tích hợp sẽ fail fast khi các tệp gốc bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 lượt xóa được theo dõi. Với các PR chủ ý xóa số lượng lớn, hãy đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lệnh từ xa.

Crabbox cũng chấm dứt một lần gọi Blacksmith CLI cục bộ nếu nó ở trong giai đoạn đồng bộ quá năm phút mà không có đầu ra sau đồng bộ. Đặt `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` để tắt cơ chế bảo vệ đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Trước lần chạy đầu tiên, kiểm tra wrapper từ gốc repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper của repo từ chối binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider một cách tường minh dù `.crabbox.yaml` có các mặc định owned-cloud. Trong các worktree Codex hoặc checkout liên kết/thưa, tránh script `pnpm crabbox:run` cục bộ vì pnpm có thể đối chiếu lại dependency trước khi Crabbox khởi động; thay vào đó hãy gọi trực tiếp node wrapper:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Các lần chạy dựa trên Blacksmith yêu cầu Crabbox 0.22.0 trở lên để wrapper nhận được hành vi đồng bộ, hàng đợi và dọn dẹp Testbox hiện tại. Khi dùng checkout sibling, hãy build lại binary cục bộ bị ignore trước công việc đo thời gian hoặc chứng minh:

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

Đọc bản tóm tắt JSON cuối cùng. Các trường hữu ích là `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` và `totalMs`. Với các lần chạy Blacksmith Testbox được ủy quyền, mã thoát của Crabbox wrapper và bản tóm tắt JSON là kết quả lệnh. Lần chạy GitHub Actions được liên kết sở hữu hydration và keepalive; nó có thể kết thúc ở trạng thái `cancelled` khi Testbox bị dừng từ bên ngoài sau khi lệnh SSH đã trả về. Hãy coi đó là artifact dọn dẹp/trạng thái trừ khi `exitCode` của wrapper khác 0 hoặc đầu ra lệnh cho thấy một kiểm thử thất bại. Các lần chạy Crabbox dựa trên Blacksmith dùng một lần nên tự động dừng Testbox; nếu một lần chạy bị gián đoạn hoặc việc dọn dẹp không rõ ràng, hãy kiểm tra các box đang hoạt động và chỉ dừng các box bạn đã tạo:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Chỉ dùng lại khi bạn chủ ý cần nhiều lệnh trên cùng một box đã được hydrate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Nếu Crabbox là tầng bị hỏng nhưng bản thân Blacksmith hoạt động, chỉ dùng Blacksmith trực tiếp cho chẩn đoán như `list`, `status` và dọn dẹp. Sửa đường dẫn Crabbox trước khi xem một lần chạy Blacksmith trực tiếp là bằng chứng maintainer.

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các warmup mới ở trạng thái `queued` mà không có IP hoặc URL lần chạy Actions sau vài phút, hãy coi đó là áp lực từ provider Blacksmith, hàng đợi, billing hoặc giới hạn tổ chức. Dừng các id đang xếp hàng do bạn tạo, tránh khởi động thêm Testbox, và chuyển phần chứng minh sang đường dẫn dung lượng Crabbox sở hữu bên dưới trong khi có người kiểm tra dashboard Blacksmith, billing và giới hạn tổ chức.

Chỉ leo thang sang dung lượng Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn hạn mức, thiếu môi trường cần thiết, hoặc dung lượng sở hữu là mục tiêu tường minh:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thật sự cần CPU cấp 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để chạm hạn mức EC2 Spot hoặc On-Demand Standard theo vùng. `.crabbox.yaml` do repo sở hữu mặc định là `standard`, nhiều vùng dung lượng và `capacity.hints: true` để các lease AWS qua broker in ra vùng/market đã chọn, áp lực hạn mức, fallback Spot và cảnh báo lớp chịu áp lực cao. Dùng `fast` cho các kiểm tra rộng nặng hơn, `large` chỉ sau khi standard/fast không đủ, và `beast` chỉ cho các lane đặc biệt bị ràng buộc CPU như full-suite hoặc ma trận Docker toàn bộ plugin, xác thực release/blocker tường minh, hoặc profiling hiệu năng nhiều lõi. Không dùng `beast` cho `pnpm check:changed`, kiểm thử tập trung, công việc chỉ liên quan docs, lint/typecheck thông thường, repro E2E nhỏ, hoặc triage sự cố Blacksmith. Dùng `--market on-demand` để chẩn đoán dung lượng nhằm tránh trộn biến động thị trường Spot vào tín hiệu.

`.crabbox.yaml` sở hữu các mặc định provider, đồng bộ và hydration GitHub Actions cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa của chính nó thay vì đồng bộ remote và object store cục bộ của maintainer, và nó loại trừ các artifact runtime/build cục bộ không bao giờ nên được truyền. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không bí mật cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
