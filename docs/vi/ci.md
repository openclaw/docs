---
read_when:
    - Bạn cần hiểu vì sao một công việc CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions bị lỗi
    - Bạn đang điều phối một lượt chạy hoặc chạy lại quy trình xác thực bản phát hành
    - Bạn đang thay đổi cơ chế điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Biểu đồ công việc CI, cổng phạm vi, ô phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-07-02T14:05:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần đẩy lên `main` và mọi yêu cầu kéo. Các lần đẩy
`main` chính thức trước tiên đi qua khoảng chờ tiếp nhận hosted-runner 90 giây.
Nhóm đồng thời `CI` hiện có hủy lượt chạy đang chờ đó khi có commit mới hơn
được đưa vào, vì vậy các lần hợp nhất tuần tự không đăng ký từng ma trận
Blacksmith đầy đủ. Yêu cầu kéo và lượt kích hoạt thủ công bỏ qua bước chờ. Job
`preflight` sau đó phân loại diff và tắt các lane tốn kém khi chỉ những khu vực
không liên quan thay đổi. Các lượt chạy `workflow_dispatch` thủ công cố ý bỏ qua
phạm vi thông minh và bung toàn bộ đồ thị cho các ứng viên phát hành và xác thực
rộng. Các lane Android vẫn là tùy chọn qua `include_android`. Phạm vi kiểm thử
Plugin chỉ dành cho bản phát hành nằm trong workflow [`Plugin Prerelease`](#plugin-prerelease)
riêng biệt và chỉ chạy từ [`Full Release Validation`](#full-release-validation)
hoặc một lượt kích hoạt thủ công rõ ràng.

## Tổng quan pipeline

| Job                                | Mục đích                                                                                                  | Khi chạy                                             |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Phát hiện thay đổi chỉ liên quan đến docs, phạm vi đã thay đổi, tiện ích mở rộng đã thay đổi, và xây dựng manifest CI | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `runner-admission`                 | Debounce 90 giây trên hosted-runner cho các lần đẩy `main` chính thức trước khi công việc Blacksmith được đăng ký | Mọi lượt chạy CI; chỉ ngủ trên các lần đẩy `main` chính thức |
| `security-fast`                    | Phát hiện khóa riêng tư, kiểm tra workflow đã thay đổi bằng `zizmor`, và kiểm tra lockfile production      | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `check-dependencies`               | Lượt kiểm tra chỉ phụ thuộc production bằng Knip cộng với guard danh sách cho phép tệp không dùng          | Thay đổi liên quan đến Node                          |
| `build-artifacts`                  | Xây dựng `dist/`, Control UI, kiểm tra smoke CLI đã build, kiểm tra artifact đã build nhúng, và artifact tái sử dụng | Thay đổi liên quan đến Node                          |
| `checks-fast-core`                 | Các lane đúng đắn Linux nhanh như bundled, protocol, QA Smoke CI, và kiểm tra định tuyến CI                | Thay đổi liên quan đến Node                          |
| `checks-fast-contracts-plugins-*`  | Hai kiểm tra hợp đồng Plugin được shard                                                                    | Thay đổi liên quan đến Node                          |
| `checks-fast-contracts-channels-*` | Hai kiểm tra hợp đồng channel được shard                                                                   | Thay đổi liên quan đến Node                          |
| `checks-node-core-*`               | Các shard kiểm thử Node lõi, loại trừ các lane channel, bundled, contract, và extension                    | Thay đổi liên quan đến Node                          |
| `check-*`                          | Tương đương cổng cục bộ chính được shard: kiểu production, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt | Thay đổi liên quan đến Node                          |
| `check-additional-*`               | Kiến trúc, drift boundary/prompt được shard, guard extension, boundary package, và topology runtime        | Thay đổi liên quan đến Node                          |
| `checks-node-compat-node22`        | Lane build và smoke tương thích Node 22                                                                    | Kích hoạt CI thủ công cho bản phát hành              |
| `check-docs`                       | Định dạng docs, lint, và kiểm tra liên kết hỏng                                                           | Docs thay đổi                                        |
| `skills-python`                    | Ruff + pytest cho Skills có nền Python                                                                    | Thay đổi liên quan đến Skill Python                  |
| `checks-windows`                   | Kiểm thử process/path riêng cho Windows cộng với hồi quy specifier import runtime dùng chung               | Thay đổi liên quan đến Windows                       |
| `macos-node`                       | Lane kiểm thử TypeScript trên macOS dùng artifact đã build dùng chung                                     | Thay đổi liên quan đến macOS                         |
| `macos-swift`                      | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                         | Thay đổi liên quan đến macOS                         |
| `ios-build`                        | Sinh dự án Xcode cộng với build simulator ứng dụng iOS                                                    | Ứng dụng iOS, shared app kit, hoặc Swabble thay đổi  |
| `android`                          | Kiểm thử đơn vị Android cho cả hai flavor cộng với một bản build APK debug                                | Thay đổi liên quan đến Android                       |
| `test-performance-agent`           | Tối ưu hóa kiểm thử chậm Codex hằng ngày sau hoạt động đáng tin cậy                                       | CI main thành công hoặc kích hoạt thủ công           |
| `openclaw-performance`             | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile, và GPT 5.5 live | Theo lịch và kích hoạt thủ công                      |

## Thứ tự fail-fast

1. `runner-admission` chỉ chờ các lần đẩy `main` chính thức; một lần đẩy mới hơn hủy lượt chạy trước khi đăng ký Blacksmith.
2. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
4. `build-artifacts` chồng lấp với các lane Linux nhanh để các bên tiêu thụ hạ nguồn có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
5. Các lane nền tảng và runtime nặng hơn bung ra sau đó: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi có lần đẩy mới hơn vào cùng PR hoặc ref `main`. Xem đó là nhiễu CI trừ khi lượt chạy mới nhất cho cùng ref cũng đang thất bại. Các job ma trận dùng `fail-fast: false`, và `build-artifacts` báo cáo trực tiếp các lỗi embedded channel, core-support-boundary, và gateway-watch thay vì xếp hàng các job xác minh nhỏ. Khóa đồng thời CI tự động được gắn phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô hạn các lượt chạy main mới hơn. Các lượt chạy bộ đầy đủ thủ công dùng `CI-manual-v1-*` và không hủy các lượt chạy đang diễn ra.

Dùng `pnpm ci:timings`, `pnpm ci:timings:recent`, hoặc `node scripts/ci-run-timings.mjs <run-id>` để tóm tắt thời gian thực, thời gian hàng đợi, job chậm nhất, lỗi, và rào fanout `pnpm-store-warmup` từ GitHub Actions. CI cũng tải lên cùng bản tóm tắt lượt chạy dưới dạng artifact `ci-timings-summary`. Để xem thời gian build, kiểm tra bước `Build dist` của job `build-artifacts`: `pnpm build:ci-artifacts` in `[build-all] phase timings:` và bao gồm `ui:build`; job cũng tải lên artifact `startup-memory`.

Đối với các lượt chạy yêu cầu kéo, job timing-summary cuối cùng chạy helper từ bản sửa đổi base đáng tin cậy trước khi truyền `GH_TOKEN` cho `gh run view`. Điều đó giữ truy vấn có token nằm ngoài mã do nhánh kiểm soát trong khi vẫn tóm tắt lượt chạy CI hiện tại của yêu cầu kéo.

## Ngữ cảnh PR và bằng chứng

PR của cộng tác viên bên ngoài chạy một cổng ngữ cảnh PR và bằng chứng từ
`.github/workflows/real-behavior-proof.yml`. Workflow checkout commit base đáng
tin cậy và chỉ đánh giá phần thân PR; nó không thực thi mã từ nhánh của cộng tác
viên.

Cổng áp dụng cho tác giả PR không phải là chủ sở hữu repository, thành viên,
cộng tác viên, hoặc bot. Nó đạt khi phần thân PR chứa các phần do tác giả viết
`What Problem This Solves` và `Evidence`. Bằng chứng có thể là một kiểm thử tập
trung, kết quả CI, ảnh chụp màn hình, bản ghi, đầu ra terminal, quan sát live,
log đã biên tập, hoặc liên kết artifact. Phần thân cung cấp ý định và xác thực
hữu ích; người review kiểm tra mã, kiểm thử, và CI để đánh giá tính đúng đắn.

Khi kiểm tra thất bại, hãy cập nhật phần thân PR thay vì đẩy thêm một commit mã khác.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Kích hoạt thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng tự thân chúng không bắt buộc build native Windows, iOS, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi nguồn nền tảng.
- **Kiểm tra hợp lệ Workflow** chạy `actionlint`, `zizmor` trên tất cả tệp YAML workflow, guard nội suy composite-action, và guard marker xung đột. Job `security-fast` theo phạm vi PR cũng chạy `zizmor` trên các tệp workflow đã thay đổi để các phát hiện bảo mật workflow thất bại sớm trong đồ thị CI chính.
- **Docs trên các lần đẩy `main`** được kiểm tra bởi workflow `Docs` độc lập với cùng bản mirror docs ClawHub mà CI dùng, vì vậy các lần đẩy hỗn hợp code+docs không đồng thời xếp hàng shard `check-docs` của CI. Yêu cầu kéo và CI thủ công vẫn chạy `check-docs` từ CI khi docs thay đổi.
- **TUI PTY** chạy trong shard Linux Node `checks-node-core-runtime-tui-pty` cho các thay đổi TUI. Shard chạy `test/vitest/vitest.tui-pty.config.ts` với `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, vì vậy nó bao phủ cả lane fixture `TuiBackend` xác định và smoke `tui --local` chậm hơn chỉ mock endpoint model bên ngoài.
- **Chỉnh sửa chỉ định tuyến CI, chỉnh sửa fixture kiểm thử lõi rẻ được chọn, và chỉnh sửa helper/định tuyến kiểm thử hợp đồng Plugin hẹp** dùng một đường manifest chỉ Node nhanh: `preflight`, bảo mật, và một tác vụ `checks-fast-core` duy nhất. Đường này bỏ qua artifact build, tương thích Node 22, hợp đồng channel, toàn bộ shard lõi, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp thực thi.
- **Kiểm tra Node Windows** được giới hạn cho wrapper process/path riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package, và các bề mặt workflow CI thực thi lane đó; nguồn không liên quan, Plugin, install-smoke, và thay đổi chỉ liên quan đến kiểm thử vẫn ở trên các lane Linux Node.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job luôn nhỏ mà không đặt trước runner quá mức: hợp đồng plugin và hợp đồng kênh mỗi loại chạy thành hai shard có trọng số, được Blacksmith hỗ trợ với fallback runner GitHub tiêu chuẩn; các lane core unit fast/support chạy riêng; hạ tầng runtime core được tách giữa state, process/config, shared và ba shard miền cron; auto-reply chạy dưới dạng các worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch và commands/state-routing); còn cấu hình agentic gateway/server được tách trên các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ artifact đã build. Sau đó CI thông thường chỉ đóng gói các shard include-pattern hạ tầng cô lập vào các bundle tất định có tối đa 64 tệp kiểm thử, giúp giảm ma trận Node mà không gộp các bộ command/cron không cô lập, agents-core có trạng thái, hoặc gateway/server; các bộ cố định nặng vẫn ở 8 vCPU trong khi các lane đã bundle và có trọng số thấp hơn dùng 4 vCPU. Pull request trên kho lưu trữ chuẩn dùng thêm một kế hoạch tiếp nhận gọn: cùng các nhóm theo từng cấu hình chạy trong các subprocess cô lập bên trong kế hoạch Linux Node 34 job hiện tại, nên một PR đơn lẻ không đăng ký toàn bộ ma trận Node hơn 70 job. Các lần push lên `main`, dispatch thủ công và cổng release vẫn giữ ma trận đầy đủ. Các kiểm thử trình duyệt rộng, QA, media và plugin hỗn hợp dùng cấu hình Vitest chuyên dụng của chúng thay vì catch-all plugin dùng chung. Các shard include-pattern ghi lại mục timing bằng tên shard CI, nên `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với một shard đã lọc. `check-additional-*` giữ công việc biên dịch/canary theo ranh giới package đi cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; danh sách boundary guard được chia sọc thành một shard nặng về prompt và một shard kết hợp cho các sọc guard còn lại, mỗi shard chạy đồng thời các guard độc lập đã chọn và in timing theo từng check. Kiểm tra drift snapshot prompt happy-path Codex tốn kém chạy dưới dạng job bổ sung riêng chỉ cho CI thủ công và các thay đổi ảnh hưởng đến prompt, nên các thay đổi Node thông thường không liên quan không phải chờ phía sau việc tạo snapshot prompt lạnh, và các shard boundary vẫn cân bằng trong khi prompt drift vẫn được ghim vào PR gây ra nó; cùng flag đó bỏ qua việc tạo snapshot prompt Vitest bên trong shard core support-boundary artifact đã build. Gateway watch, kiểm thử kênh và shard core support-boundary chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Sau khi được tiếp nhận, CI Linux chuẩn cho phép tối đa 24 job kiểm thử Node chạy đồng thời và
12 cho các lane fast/check nhỏ hơn; Windows và Android giữ ở mức hai vì
các pool runner đó hẹp hơn.

Kế hoạch PR gọn phát ra 18 job Node cho bộ hiện tại: các nhóm toàn cấu hình
được gom batch trong các subprocess cô lập với timeout batch 120 phút,
trong khi các nhóm include-pattern dùng chung ngân sách job có giới hạn đó.

CI Android chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi build APK debug Play. Flavor bên thứ ba không có source set hay manifest riêng; lane unit-test của nó vẫn biên dịch flavor với các flag BuildConfig SMS/call-log, đồng thời tránh một job đóng gói APK debug trùng lặp trên mọi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ kiểm tra dependency production được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh các phát hiện tệp không dùng trong production của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng sẽ fail khi một PR thêm tệp không dùng mới chưa được review hoặc để lại một mục allowlist đã lỗi thời, đồng thời vẫn giữ các bề mặt plugin động có chủ ý, generated, build, live-test và cầu nối package mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động kho lưu trữ OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho các yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong bình luận issue;
- `clawsweeper_commit_review` cho các yêu cầu review ở cấp commit trên các lần push `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại sự kiện, hành động, tác nhân, kho lưu trữ, số item, URL, tiêu đề, trạng thái và các trích đoạn ngắn cho bình luận hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ phần thân webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, workflow này đăng sự kiện đã chuẩn hóa tới hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải mặc định là phân phối. Agent ClawSweeper nhận đích Discord trong prompt của nó và chỉ nên đăng lên `#clawsweeper` khi sự kiện bất ngờ, có thể hành động, rủi ro hoặc hữu ích về mặt vận hành. Các lần mở, chỉnh sửa, nhiễu bot, nhiễu webhook trùng lặp và lưu lượng review bình thường nên dẫn đến `NO_REPLY`.

Xem tiêu đề, bình luận, phần thân, văn bản review, tên nhánh và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy trong toàn bộ đường dẫn này. Chúng là đầu vào để tóm tắt và phân loại, không phải chỉ dẫn cho workflow hay runtime agent.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng buộc bật mọi lane có phạm vi không phải Android: shard Linux Node, shard bundled-plugin, shard hợp đồng plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, smoke check artifact đã build, kiểm tra tài liệu, Python skills, Windows, macOS, build iOS và Control UI i18n. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; ô release đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh plugin prerelease, shard chỉ dành cho release `agentic-plugins`, sweep batch extension đầy đủ và các lane Docker plugin prerelease bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với cổng release-validation được bật.

Các lần chạy thủ công dùng một nhóm concurrency duy nhất để một bộ đầy đủ release-candidate không bị hủy bởi một lần push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ dispatch ref đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch CI thủ công và fallback kho lưu trữ không chuẩn, quét chất lượng CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow tài liệu ngoài CI và preflight install-smoke để ma trận Blacksmith có thể xếp hàng sớm hơn                                  |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, các shard extension nhẹ hơn, `checks-fast-core`, shard hợp đồng plugin/kênh, hầu hết shard Linux Node bundled/nhẹ hơn, `check-guards`, `check-prod-types`, `check-test-types`, các shard `check-additional-*` đã chọn và `check-dependencies`         |
| `blacksmith-8vcpu-ubuntu-2404`  | Các bộ Linux Node nặng được giữ lại, các shard `check-additional-*` nặng về boundary/extension và `android`                                                                                                                                                                         |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (đủ nhạy CPU đến mức 8 vCPU tốn nhiều hơn phần tiết kiệm được); build Docker install-smoke (thời gian hàng đợi 32 vCPU tốn nhiều hơn phần tiết kiệm được)                                                                                           |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` trên `openclaw/openclaw`; fork fallback về `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` và `ios-build` trên `openclaw/openclaw`; fork fallback về `macos-26`                                                                                                                                                                                                   |

## Ngân sách đăng ký runner

Bucket đăng ký runner GitHub hiện tại của OpenClaw báo cáo 10.000 lượt đăng ký
runner self-hosted mỗi 5 phút trong `ghx api rate_limit`. Kiểm tra lại
`actions_runner_registration` trước mỗi lượt tinh chỉnh vì GitHub có thể thay đổi
bucket này. Giới hạn được chia sẻ bởi mọi lượt đăng ký runner Blacksmith trong tổ chức
`openclaw`, nên việc thêm một cài đặt Blacksmith khác không thêm
bucket mới.

Xem nhãn Blacksmith là tài nguyên khan hiếm để kiểm soát burst. Các job
chỉ định tuyến, thông báo, tóm tắt, chọn shard hoặc chạy các lượt quét CodeQL ngắn nên
ở trên runner GitHub-hosted trừ khi chúng có nhu cầu riêng của Blacksmith đã được đo lường.
Mọi ma trận Blacksmith mới, `max-parallel` lớn hơn hoặc workflow tần suất cao
phải cho thấy số lượt đăng ký ở tình huống xấu nhất và giữ mục tiêu cấp tổ chức
dưới khoảng 60% bucket live. Với bucket 10.000 lượt đăng ký hiện tại,
điều đó có nghĩa là mục tiêu vận hành 6.000 lượt đăng ký, chừa headroom cho
các kho lưu trữ đồng thời, retry và chồng lấn burst.

CI kho chuẩn giữ Blacksmith làm đường dẫn runner mặc định cho các lần chạy push và pull-request thông thường. `workflow_dispatch` và các lần chạy kho lưu trữ không chuẩn dùng runner GitHub-hosted, nhưng các lần chạy chuẩn thông thường hiện không thăm dò tình trạng hàng đợi Blacksmith hoặc tự động fallback sang nhãn GitHub-hosted khi Blacksmith không khả dụng.

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

Kích hoạt thủ công thường đo chuẩn ref của quy trình. Đặt `target_ref` để đo chuẩn một thẻ phát hành hoặc một nhánh khác bằng phần triển khai quy trình hiện tại. Đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được khóa theo ref được kiểm thử, và mỗi `index.md` ghi lại ref/SHA được kiểm thử, ref/SHA của quy trình, ref Kova, hồ sơ, chế độ xác thực lane, mô hình, số lần lặp và bộ lọc kịch bản.

Quy trình cài đặt OCM từ một bản phát hành được ghim và Kova từ `openclaw/Kova` tại đầu vào `kova_ref` đã ghim, rồi chạy ba lane:

- `mock-provider`: các kịch bản chẩn đoán Kova chạy với runtime bản dựng cục bộ cùng xác thực giả tương thích OpenAI có tính quyết định.
- `mock-deep-profile`: lập hồ sơ CPU/heap/trace cho các điểm nóng khi khởi động, Gateway và lượt tác nhân.
- `live-openai-candidate`: một lượt tác nhân OpenAI `openai/gpt-5.5` thật, được bỏ qua khi không có `OPENAI_API_KEY`.

Lane mock-provider cũng chạy các probe nguồn gốc OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ trên các trường hợp khởi động mặc định, hook và 50 Plugin; RSS khi nhập Plugin đóng gói, các vòng hello `channel-chat-baseline` dùng mock-OpenAI lặp lại, lệnh khởi động CLI đối với Gateway đã khởi động và probe hiệu năng smoke cho trạng thái SQLite. Khi báo cáo nguồn mock-provider đã xuất bản trước đó có sẵn cho ref được kiểm thử, bản tóm tắt nguồn sẽ so sánh các giá trị RSS và heap hiện tại với baseline đó và đánh dấu các mức tăng RSS lớn là `watch`. Bản tóm tắt Markdown của probe nguồn nằm tại `source/index.md` trong gói báo cáo, với JSON thô đặt bên cạnh.

Mỗi lane tải lên artifact GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, quy trình cũng commit `report.json`, `report.md`, các gói, `index.md` và artifact probe nguồn vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ ref được kiểm thử hiện tại được ghi là `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực phát hành đầy đủ

`Full Release Validation` là quy trình bao trùm thủ công để “chạy mọi thứ trước khi phát hành.” Quy trình nhận một nhánh, thẻ hoặc SHA commit đầy đủ, kích hoạt quy trình `CI` thủ công với mục tiêu đó, kích hoạt `Plugin Prerelease` cho bằng chứng chỉ dành cho phát hành về Plugin/gói/tĩnh/Docker, và kích hoạt `OpenClaw Release Checks` cho smoke cài đặt, chấp nhận gói, kiểm tra gói đa hệ điều hành, dựng thẻ điểm trưởng thành từ bằng chứng hồ sơ QA, tính tương đương QA Lab, Matrix và các lane Telegram. Hồ sơ ổn định và đầy đủ luôn bao gồm phạm vi bao phủ live/E2E toàn diện và soak đường dẫn phát hành Docker; hồ sơ beta có thể bật bằng `run_release_soak=true`. E2E Telegram gói chuẩn chạy bên trong Package Acceptance, nên một ứng viên đầy đủ không khởi động một poller live trùng lặp. Sau khi xuất bản, truyền `release_package_spec` để tái sử dụng gói npm đã phát hành trong các kiểm tra phát hành, Package Acceptance, Docker, đa hệ điều hành và Telegram mà không cần dựng lại. Chỉ dùng `npm_telegram_package_spec` cho một lần chạy lại Telegram tập trung trên gói đã xuất bản. Lane gói live của Plugin Codex dùng cùng trạng thái đã chọn theo mặc định: `release_package_spec=openclaw@<tag>` đã xuất bản suy ra `codex_plugin_spec=npm:@openclaw/codex@<tag>`, trong khi các lần chạy SHA/artifact đóng gói `extensions/codex` từ ref đã chọn. Đặt `codex_plugin_spec` rõ ràng cho nguồn Plugin tùy chỉnh như spec `npm:`, `npm-pack:` hoặc `git:`.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết ma trận giai đoạn, tên job quy trình chính xác, khác biệt giữa các hồ sơ, artifact và các handle chạy lại tập trung.

`OpenClaw Release Publish` là quy trình phát hành thủ công có thay đổi trạng thái. Kích hoạt quy trình này từ `release/YYYY.M.PATCH` hoặc `main` sau khi thẻ phát hành tồn tại và sau khi preflight npm OpenClaw đã thành công. Quy trình xác minh `pnpm plugins:sync:check`, kích hoạt `Plugin NPM Release` cho tất cả các gói Plugin có thể xuất bản, kích hoạt `Plugin ClawHub Release` cho cùng SHA phát hành, và chỉ sau đó mới kích hoạt `OpenClaw NPM Release` với `preflight_run_id` đã lưu. Xuất bản ổn định cũng yêu cầu một `windows_node_tag` chính xác; quy trình xác minh bản phát hành nguồn Windows và so sánh các trình cài đặt x64/ARM64 của bản đó với đầu vào `windows_node_installer_digests` đã được ứng viên phê duyệt trước bất kỳ quy trình con xuất bản nào, rồi quảng bá và xác minh chính các digest trình cài đặt đã ghim đó cùng artifact đồng hành chính xác và hợp đồng checksum trước khi xuất bản bản nháp phát hành GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit được ghim trên một nhánh thay đổi nhanh, dùng helper thay vì `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref kích hoạt quy trình GitHub phải là nhánh hoặc thẻ, không phải SHA commit thô. Helper đẩy một nhánh tạm `release-ci/<sha>-...` tại SHA mục tiêu, kích hoạt `Full Release Validation` từ ref đã ghim đó, xác minh mọi `headSha` của quy trình con khớp với mục tiêu, và xóa nhánh tạm khi lần chạy hoàn tất. Bộ xác minh bao trùm cũng thất bại nếu bất kỳ quy trình con nào chạy ở SHA khác.

`release_profile` kiểm soát độ rộng live/provider được truyền vào các kiểm tra phát hành. Các quy trình phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn chủ ý muốn ma trận provider/media tư vấn rộng. Kiểm tra phát hành ổn định và đầy đủ luôn chạy soak live/E2E toàn diện và đường dẫn phát hành Docker; hồ sơ beta có thể bật bằng `run_release_soak=true`.

- `minimum` giữ các lane OpenAI/core nhanh nhất và quan trọng với phát hành.
- `stable` thêm tập provider/backend ổn định.
- `full` chạy ma trận provider/media tư vấn rộng.

Quy trình bao trùm ghi lại id lần chạy con đã kích hoạt, và job cuối `Verify full validation` kiểm tra lại kết luận hiện tại của các lần chạy con và bổ sung bảng job chậm nhất cho từng lần chạy con. Nếu một quy trình con được chạy lại và chuyển sang xanh, chỉ chạy lại job xác minh cha để làm mới kết quả bao trùm và bản tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho quy trình con CI đầy đủ thông thường, `plugin-prerelease` chỉ cho quy trình con tiền phát hành Plugin, `release-checks` cho mọi quy trình con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` hoặc `npm-telegram` trên quy trình bao trùm. Điều này giữ cho việc chạy lại một hộp phát hành thất bại được giới hạn sau một bản sửa tập trung. Với một lane đa hệ điều hành thất bại, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh đa hệ điều hành dài phát ra dòng Heartbeat và bản tóm tắt packaged-upgrade bao gồm thời gian từng pha. Các lane kiểm tra phát hành QA mang tính tư vấn, ngoại trừ cổng phạm vi công cụ runtime tiêu chuẩn, vốn sẽ chặn khi các công cụ động OpenClaw bắt buộc bị lệch hoặc biến mất khỏi bản tóm tắt tầng tiêu chuẩn.

`OpenClaw Release Checks` dùng ref quy trình đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho kiểm tra đa hệ điều hành và Package Acceptance, cộng với quy trình Docker live/E2E đường dẫn phát hành khi chạy phạm vi soak. Điều này giữ byte gói nhất quán giữa các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều job con. Với lane live Plugin npm Codex, kiểm tra phát hành sẽ truyền một spec Plugin đã xuất bản khớp được suy ra từ `release_package_spec`, truyền `codex_plugin_spec` do người vận hành cung cấp, hoặc để trống đầu vào để script Docker đóng gói Plugin Codex của checkout đã chọn.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all` thay thế quy trình bao trùm cũ hơn. Bộ giám sát cha hủy bất kỳ quy trình con nào mà nó đã kích hoạt khi cha bị hủy, nên xác thực main mới hơn không bị kẹt sau một lần chạy release-check cũ kéo dài hai giờ. Xác thực nhánh/thẻ phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Shard live và E2E

Quy trình con live/E2E của phát hành giữ phạm vi bao phủ `pnpm test:live` gốc rộng, nhưng chạy phạm vi đó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một job nối tiếp:

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
- các shard media âm thanh/video tách riêng và shard nhạc được lọc theo provider

Điều này giữ cùng phạm vi bao phủ tệp trong khi làm cho các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media` và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard media live gốc chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được dựng bởi quy trình `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên runner Blacksmith bình thường; job container không phải là nơi phù hợp để khởi chạy kiểm thử Docker lồng nhau.

Các shard mô hình/backend live dựa trên Docker dùng một image dùng chung riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit được chọn. Workflow phát hành live build và push image đó một lần, rồi các shard mô hình live Docker, Gateway chia shard theo provider, backend CLI, bind ACP và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang các giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout của job workflow để container bị treo hoặc đường dọn dẹp bị kẹt sẽ lỗi nhanh thay vì tiêu tốn toàn bộ ngân sách kiểm tra phát hành. Nếu các shard đó tự rebuild toàn bộ target Docker của mã nguồn một cách độc lập, lần chạy phát hành đang bị cấu hình sai và sẽ lãng phí thời gian thực cho các bản build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây mã nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng thực thi sau khi cài đặt hoặc cập nhật.

### Job

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, ref workflow, ref gói, phiên bản, SHA-256 và profile trong phần tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory tarball, chuẩn bị các image Docker theo digest gói khi cần, và chạy các lane Docker đã chọn với gói đó thay vì đóng gói checkout của workflow. Khi một profile chọn nhiều `docker_lanes` được nhắm mục tiêu, workflow tái sử dụng chuẩn bị gói và các image dùng chung một lần, rồi fan-out các lane đó thành các job Docker nhắm mục tiêu chạy song song với artifact riêng.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi chấp nhận gói đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã phát hành.
4. `summary` làm workflow thất bại nếu phân giải gói, chấp nhận Docker, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng lựa chọn này cho chấp nhận bản prerelease/stable đã phát hành.
- `source=ref` đóng gói một nhánh, tag, hoặc full commit SHA `package_ref` đáng tin cậy. Bộ phân giải fetch các nhánh/tag OpenClaw, xác minh commit đã chọn có thể truy cập từ lịch sử nhánh repository hoặc một release tag, cài đặt deps trong một worktree tách rời, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS công khai; bắt buộc có `package_sha256`. Đường này từ chối thông tin xác thực trong URL, cổng HTTPS không mặc định, hostname hoặc IP đã phân giải thuộc private/internal/special-use, và redirect ra ngoài cùng chính sách an toàn công khai.
- `source=trusted-url` tải xuống một `.tgz` HTTPS từ chính sách trusted-source có tên trong `.github/package-trusted-sources.json`; bắt buộc có `package_sha256` và `trusted_source_id`. Chỉ dùng lựa chọn này cho mirror doanh nghiệp do maintainer sở hữu hoặc repository gói riêng tư cần cấu hình host, cổng, tiền tố đường dẫn, host redirect, hoặc phân giải mạng riêng. Nếu chính sách khai báo bearer auth, workflow dùng secret cố định `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; thông tin xác thực nhúng trong URL vẫn bị từ chối.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy bài kiểm tra. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng thêm `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng coverage Plugin offline để xác thực gói đã phát hành không bị chặn bởi trạng thái sẵn có live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, trong khi đường spec npm đã phát hành được giữ cho các dispatch độc lập.

Để xem chính sách kiểm thử cập nhật và Plugin chuyên dụng, bao gồm lệnh cục bộ,
lane Docker, input chấp nhận gói, mặc định phát hành, và phân loại lỗi,
xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

Các kiểm tra phát hành gọi chấp nhận gói với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng di trú gói, cập nhật, cài đặt Skills live từ ClawHub, dọn dẹp phụ thuộc Plugin cũ, sửa cài đặt Plugin đã cấu hình, Plugin offline, cập nhật Plugin, và Telegram trên cùng tarball gói đã phân giải. Đặt `release_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks sau khi phát hành beta để chạy cùng ma trận với gói npm đã ship mà không rebuild; chỉ đặt `package_acceptance_package_spec` khi chấp nhận gói cần một gói khác với phần còn lại của xác thực phát hành. Các kiểm tra phát hành đa hệ điều hành vẫn bao phủ onboarding, installer và hành vi nền tảng đặc thù từng OS; xác thực sản phẩm gói/cập nhật nên bắt đầu với chấp nhận gói. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã phát hành cho mỗi lần chạy trong đường phát hành chặn. Trong chấp nhận gói, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã phát hành dùng làm fallback, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng trên bốn bản phát hành npm stable mới nhất cộng với các bản phát hành ranh giới tương thích Plugin được ghim và fixture theo dạng issue cho cấu hình Feishu, các file bootstrap/persona được giữ lại, cài đặt Plugin OpenClaw đã cấu hình, đường dẫn log có dấu ngã, và các root phụ thuộc Plugin legacy cũ. Các lựa chọn published-upgrade survivor nhiều baseline được chia shard theo baseline thành các job runner Docker nhắm mục tiêu riêng. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã phát hành một cách toàn diện, không phải độ rộng CI Full Release thông thường. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã phát hành cấu hình baseline bằng một công thức lệnh `openclaw config set` được baked sẵn, ghi các bước công thức trong `summary.json`, và probe `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane gói hóa và installer fresh trên Windows cũng xác minh rằng một gói đã cài đặt có thể import một browser-control override từ đường dẫn Windows tuyệt đối thô. Smoke lượt agent đa hệ điều hành OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.5`, để bằng chứng cài đặt và Gateway vẫn nằm trên mô hình kiểm thử GPT-5 trong khi tránh mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Chấp nhận gói có các cửa sổ tương thích legacy giới hạn cho những gói đã phát hành. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường tương thích:

- các mục QA riêng đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các file bị lược khỏi tarball;
- `doctor-switch` có thể bỏ qua tiểu trường hợp persistence `gateway install --wrapper` khi gói không expose flag đó;
- `update-channel-switch` có thể cắt tỉa `patchedDependencies` pnpm bị thiếu khỏi fixture git giả dẫn xuất từ tarball và có thể log `update.channel` đã persist bị thiếu;
- các smoke Plugin có thể đọc vị trí install-record legacy hoặc chấp nhận thiếu persistence install-record marketplace;
- `plugin-update` có thể cho phép di trú metadata cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các file stamp metadata build cục bộ đã được ship. Các gói mới hơn phải thỏa mãn các contract hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi debug một lần chạy chấp nhận gói thất bại, hãy bắt đầu từ tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời gian từng phase, và lệnh chạy lại. Ưu tiên chạy lại profile gói thất bại hoặc các lane Docker chính xác thay vì chạy lại xác thực phát hành đầy đủ.

## Smoke cài đặt

Workflow `Install Smoke` riêng tái sử dụng cùng script phạm vi thông qua job `preflight` riêng của nó. Nó chia coverage smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường chạy nhanh** chạy cho các pull request chạm đến bề mặt Docker/gói, thay đổi gói/manifest Plugin đi kèm, hoặc các bề mặt Plugin SDK lõi/plugin/kênh/gateway mà các tác vụ Docker smoke kiểm tra. Các thay đổi Plugin đi kèm chỉ ở mã nguồn, chỉnh sửa chỉ dành cho kiểm thử, và chỉnh sửa chỉ dành cho tài liệu không giữ trước Docker worker. Đường chạy nhanh build ảnh Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa agents trong shared-workspace, chạy e2e gateway-network trong container, xác minh một build arg của extension đi kèm, và chạy hồ sơ Docker Plugin đi kèm có giới hạn trong tổng thời gian chờ lệnh 240 giây (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường chạy đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update của trình cài đặt cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành qua workflow-call, và các pull request thật sự chạm đến bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một ảnh smoke Dockerfile gốc GHCR theo target-SHA, rồi chạy cài đặt gói QR, smoke Dockerfile/gateway gốc, smoke trình cài đặt/update, và Docker E2E Plugin đi kèm nhanh dưới dạng các job riêng biệt để công việc trình cài đặt không phải chờ sau các smoke ảnh gốc.

Các push lên `main` (bao gồm merge commit) không ép dùng đường chạy đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một push, workflow giữ Docker smoke nhanh và để smoke cài đặt đầy đủ cho xác thực hằng đêm hoặc phát hành.

Smoke image-provider cài đặt Bun toàn cục chậm được kiểm soát riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch thủ công `Install Smoke` có thể chọn tham gia, nhưng pull request và push lên `main` thì không. CI PR thông thường vẫn chạy lane hồi quy trình khởi chạy Bun nhanh cho các thay đổi liên quan đến Node. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` prebuild một ảnh live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, và build hai ảnh `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane trình cài đặt/update/phụ thuộc Plugin;
- một ảnh chức năng cài cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn ảnh cho mỗi lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tùy chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot pool chính cho các lane thông thường.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot tail-pool nhạy với provider.                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để provider không throttle.                                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5        | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane nhiều dịch vụ đồng thời.                                                        |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ lệch giữa các lần khởi động lane để tránh bão tạo Docker daemon; đặt `0` để không lệch.    |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Thời gian chờ dự phòng cho mỗi lane (120 phút); các lane live/tail được chọn dùng mức chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in kế hoạch của bộ lập lịch mà không chạy lane.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agents có thể tái hiện một lane lỗi. |

Một lane nặng hơn giới hạn hiệu lực của nó vẫn có thể khởi động từ pool trống, rồi chạy một mình cho đến khi nhả dung lượng. Tổng preflight cục bộ kiểm tra Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời lượng lane để sắp xếp dài nhất trước, và mặc định dừng lập lịch các lane trong pool mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` để biết gói, loại ảnh, ảnh live, lane, và phạm vi credential nào cần thiết. Sau đó `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại, hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; build và đẩy các ảnh Docker E2E GHCR bare/functional được gắn thẻ theo digest gói qua cache layer Docker của Blacksmith khi kế hoạch cần các lane đã cài gói; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các ảnh theo digest gói hiện có thay vì build lại. Các lần pull ảnh Docker được retry với thời gian chờ giới hạn 180 giây cho mỗi lần thử để một luồng registry/cache bị kẹt retry nhanh thay vì tiêu thụ phần lớn đường găng CI.

### Các chunk đường phát hành

Phạm vi Docker phát hành chạy các job được chia chunk nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi chunk chỉ pull loại ảnh nó cần và thực thi nhiều lane qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các chunk Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và từ `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `package-update-openai` bao gồm lane gói Plugin Codex live, cài đặt gói OpenClaw ứng viên, cài Plugin Codex từ `codex_plugin_spec` hoặc tarball cùng ref với phê duyệt cài đặt Codex CLI rõ ràng, chạy preflight Codex CLI, rồi chạy nhiều lượt agent OpenClaw cùng phiên với OpenAI. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các alias tổng hợp cho plugin/runtime. Alias lane `install-e2e` vẫn là alias rerun thủ công tổng hợp cho cả hai lane trình cài đặt provider.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu, và chỉ giữ chunk `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane update kênh đi kèm retry một lần cho lỗi mạng npm nhất thời.

Mỗi chunk tải lên `.artifacts/docker-tests/` với log lane, thời lượng, `summary.json`, `failures.json`, thời lượng pha, JSON kế hoạch bộ lập lịch, bảng lane chậm, và lệnh rerun cho từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn trên các ảnh đã chuẩn bị thay vì các job chunk, nhờ đó việc debug lane lỗi được giới hạn trong một job Docker có mục tiêu và chuẩn bị, tải xuống, hoặc tái sử dụng artifact gói cho lần chạy đó; nếu một lane được chọn là lane Docker live, job có mục tiêu build ảnh live-test cục bộ cho lần rerun đó. Các lệnh rerun GitHub được tạo cho từng lane bao gồm `package_artifact_run_id`, `package_artifact_name`, và input ảnh đã chuẩn bị khi các giá trị đó tồn tại, để một lane lỗi có thể tái sử dụng đúng gói và ảnh từ lần chạy lỗi.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Plugin Prerelease

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, push lên `main`, và dispatch CI thủ công độc lập không bật bộ này. Nó cân bằng kiểm thử Plugin đi kèm trên tám extension worker; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một Vitest worker cho mỗi nhóm và heap Node lớn hơn để các lô Plugin nặng import không tạo thêm job CI. Đường prerelease Docker chỉ dành cho phát hành gom các lane Docker có mục tiêu thành nhóm nhỏ để tránh giữ trước hàng chục runner cho các job dài một đến ba phút. Workflow cũng tải lên artifact thông tin `plugin-inspector-advisory` từ `@openclaw/plugin-inspector`; phát hiện của inspector là đầu vào triage và không thay đổi cổng chặn Plugin Prerelease.

## QA Lab

QA Lab có các lane CI chuyên dụng bên ngoài workflow chính có phạm vi thông minh. Tương đương agentic được lồng dưới các harness QA rộng và phát hành, không phải workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi tương đương nên đi cùng một lần chạy xác thực rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó fan out lane tương đương mock, lane Matrix live, và các lane Telegram và Discord live dưới dạng job song song. Job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Kiểm tra phát hành chạy các lane transport live Matrix và Telegram với provider mock xác định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được cô lập khỏi độ trễ model live và khởi động provider-plugin thông thường. Gateway transport live tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; kết nối provider được bao phủ bởi các bộ live model, native provider, và Docker provider riêng.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu với phát hành trước phê duyệt phát hành; cổng QA parity của nó chạy các pack ứng viên và baseline dưới dạng job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ cho so sánh parity cuối cùng.

Với PR thông thường, hãy theo bằng chứng CI/check theo phạm vi thay vì xem parity là một trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` cố ý là scanner bảo mật lượt đầu hẹp, không phải lượt quét toàn bộ repository. Các lần chạy hằng ngày, thủ công, và guard pull request không phải bản nháp quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng các truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Guard pull request được giữ nhẹ: nó chỉ khởi động cho các thay đổi dưới `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, hoặc các đường dẫn runtime Plugin đi kèm sở hữu tiến trình, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. Android và macOS CodeQL không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secrets, sandbox, cron và baseline gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, gateway, Plugin SDK, secrets, các điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF lõi, phân tích IP, bảo vệ mạng, web-fetch và các bề mặt chính sách SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, helper thực thi tiến trình, phân phối outbound và các cổng thực thi công cụ của agent                                           |
| `/codeql-security-high/process-exec-boundary`     | Shell cục bộ, helper spawn tiến trình, runtime Plugin đóng gói sở hữu subprocess và phần nối script workflow                             |
| `/codeql-security-high/plugin-trust-boundary`     | Cài đặt Plugin, loader, manifest, registry, cài đặt package-manager, nạp nguồn và các bề mặt tin cậy hợp đồng gói Plugin SDK |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được kiểm tra sanity workflow chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF đã tải lên và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chi phối thời gian chạy ngay cả khi sạch.

### Danh mục Chất lượng Nghiêm trọng

`CodeQL Critical Quality` là shard không liên quan bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không liên quan bảo mật, mức độ lỗi, trên các bề mặt hẹp có giá trị cao trên runner Linux do GitHub-hosted để các lần quét chất lượng không tiêu tốn ngân sách đăng ký runner Blacksmith. Guard pull request của nó cố ý nhỏ hơn profile theo lịch: PR không phải draft chỉ chạy các shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` và `plugin-sdk-reply-runtime` tương ứng cho thay đổi trong mã thực thi lệnh/mô hình/công cụ agent và điều phối trả lời, mã schema/migration/IO cấu hình, mã auth/secrets/sandbox/bảo mật, runtime kênh lõi và Plugin kênh đóng gói, giao thức gateway/phương thức máy chủ, runtime bộ nhớ/phần nối SDK, MCP/tiến trình/phân phối outbound, runtime nhà cung cấp/danh mục mô hình, chẩn đoán phiên/hàng đợi phân phối, loader Plugin, hợp đồng Plugin SDK/gói hoặc runtime trả lời Plugin SDK. Các thay đổi cấu hình CodeQL và workflow chất lượng chạy toàn bộ mười hai shard chất lượng PR.

Dispatch thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các profile hẹp là hook hướng dẫn/lặp để chạy riêng một shard chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secrets, sandbox, cron và mã ranh giới bảo mật gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Hợp đồng schema cấu hình, migration, chuẩn hóa và IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai Plugin kênh lõi và kênh đóng gói                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi tự động trả lời, cùng hợp đồng runtime control-plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, helper giám sát tiến trình và hợp đồng phân phối outbound                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK host bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, phần nối kích hoạt runtime bộ nhớ và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, helper binding/phân phối phiên outbound, bề mặt gói sự kiện/log chẩn đoán và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời inbound Plugin SDK, helper payload/chunking/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối và helper binding phiên/thread             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, auth và discovery nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/danh mục nhà cung cấp và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lưu trữ cục bộ, luồng điều khiển gateway và hợp đồng runtime control-plane tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web lõi, IO media, hiểu media, tạo ảnh và hợp đồng runtime tạo media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registry, bề mặt công khai và hợp đồng entrypoint Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và helper hợp đồng gói plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, tắt hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin đóng gói chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc chia shard sau khi các profile hẹp có runtime và tín hiệu ổn định.

## Workflow bảo trì

### Docs Agent

Workflow `Docs Agent` là lane bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được land. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và dispatch thủ công có thể chạy trực tiếp. Các invocation workflow-run bỏ qua khi `main` đã tiến tiếp hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác được tạo trong giờ vừa qua. Khi chạy, nó rà soát khoảng commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lượt chạy hằng giờ có thể bao phủ mọi thay đổi main tích lũy kể từ lượt tài liệu gần nhất.

### Test Performance Agent

Workflow `Test Performance Agent` là lane bảo trì Codex theo sự kiện cho các test chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một invocation workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày đó. Lane build một báo cáo hiệu năng Vitest theo nhóm cho toàn bộ suite, cho phép Codex chỉ thực hiện các bản sửa hiệu năng test nhỏ vẫn giữ coverage thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ suite và từ chối các thay đổi làm giảm số lượng test baseline đang pass. Báo cáo theo nhóm ghi thời gian wall time theo từng cấu hình và RSS tối đa trên Linux và macOS, nên so sánh trước/sau hiển thị delta bộ nhớ test bên cạnh delta thời lượng. Nếu baseline có test fail, Codex chỉ có thể sửa các lỗi rõ ràng và báo cáo toàn bộ suite sau-agent phải pass trước khi bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi bot push được land, lane rebase bản vá đã được xác thực, chạy lại `pnpm check:changed` và thử push lại; các bản vá stale bị xung đột sẽ được bỏ qua. Nó dùng Ubuntu do GitHub-hosted để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi merge

Workflow `Duplicate PRs After Merge` là workflow thủ công của maintainer để dọn dẹp trùng lặp sau khi land. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi bản trùng lặp có hoặc issue được tham chiếu chung hoặc các hunk thay đổi chồng lấp.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck prod lõi và test lõi cùng lint/guard lõi;
- thay đổi chỉ test lõi chỉ chạy typecheck test lõi cùng lint lõi;
- thay đổi production extension chạy typecheck prod extension và test extension cùng lint extension;
- thay đổi chỉ test extension chạy typecheck test extension cùng lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (các lượt quét Vitest extension vẫn là công việc test rõ ràng);
- bump phiên bản chỉ metadata release chạy các kiểm tra phiên bản/cấu hình/phụ thuộc root có mục tiêu;
- thay đổi root/cấu hình chưa rõ fail-safe sang mọi lane kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý rẻ hơn `check:changed`: chỉnh sửa test trực tiếp tự chạy chính nó, chỉnh sửa nguồn ưu tiên mapping rõ ràng, sau đó là test cùng cấp và dependent theo import graph. Cấu hình phân phối group-room dùng chung là một trong các mapping rõ ràng: thay đổi cấu hình trả lời hiển thị nhóm, chế độ phân phối trả lời nguồn hoặc system prompt của message-tool được định tuyến qua các test trả lời lõi cùng hồi quy phân phối Discord và Slack để một thay đổi mặc định dùng chung fail trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng ở cấp harness đến mức tập mapped rẻ không phải là proxy đáng tin cậy.

## Xác thực Testbox

Crabbox là trình bao bọc hộp từ xa do repo sở hữu để cung cấp bằng chứng Linux cho maintainer. Dùng nó
từ gốc repo khi một lượt kiểm tra quá rộng cho vòng lặp chỉnh sửa cục bộ, khi tính tương đồng với CI
là quan trọng, hoặc khi bằng chứng cần secrets, Docker, package lanes,
hộp có thể tái sử dụng, hoặc nhật ký từ xa. Backend OpenClaw thông thường là
`blacksmith-testbox`; dung lượng AWS/Hetzner sở hữu là phương án dự phòng cho sự cố Blacksmith,
vấn đề quota, hoặc kiểm thử dung lượng sở hữu rõ ràng.

Các lượt chạy Blacksmith được Crabbox hỗ trợ sẽ warm, claim, sync, run, report, và dọn dẹp
Testbox một lần. Kiểm tra độ hợp lệ sync tích hợp sẽ thất bại sớm khi các tệp gốc bắt buộc
như `pnpm-lock.yaml` biến mất hoặc khi `git status --short`
hiển thị ít nhất 200 tệp đã theo dõi bị xóa. Với các PR xóa số lượng lớn có chủ đích, đặt
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lệnh từ xa.

Crabbox cũng kết thúc một lệnh gọi Blacksmith CLI cục bộ nếu nó ở lại
giai đoạn sync hơn năm phút mà không có đầu ra sau sync. Đặt
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` để tắt guard đó, hoặc dùng một
giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Trước lần chạy đầu tiên, kiểm tra trình bao bọc từ gốc repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Trình bao bọc repo từ chối một binary Crabbox lỗi thời không quảng bá `blacksmith-testbox`. Truyền provider một cách tường minh dù `.crabbox.yaml` có mặc định owned-cloud. Trong các worktree Codex hoặc checkout liên kết/thưa, tránh script `pnpm crabbox:run` cục bộ vì pnpm có thể điều hòa dependency trước khi Crabbox khởi động; thay vào đó hãy gọi trực tiếp trình bao bọc node:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Các lượt chạy được Blacksmith hỗ trợ yêu cầu Crabbox 0.22.0 hoặc mới hơn để trình bao bọc nhận được hành vi sync, queue, và cleanup hiện tại của Testbox. Khi dùng checkout sibling, dựng lại binary cục bộ bị bỏ qua trước công việc đo thời gian hoặc bằng chứng:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

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

Bộ kiểm thử đầy đủ:

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
`syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Với các lượt chạy Blacksmith Testbox
được ủy quyền, mã thoát của trình bao bọc Crabbox và tóm tắt JSON là
kết quả lệnh. Lượt chạy GitHub Actions được liên kết sở hữu hydration và keepalive; nó
có thể kết thúc ở trạng thái `cancelled` khi Testbox bị dừng từ bên ngoài sau khi lệnh SSH
đã trả về. Hãy coi đó là artifact dọn dẹp/trạng thái trừ khi
`exitCode` của trình bao bọc khác 0 hoặc đầu ra lệnh cho thấy kiểm thử thất bại.
Các lượt chạy Crabbox một lần được Blacksmith hỗ trợ nên tự động dừng Testbox;
nếu một lượt chạy bị gián đoạn hoặc việc dọn dẹp không rõ ràng, kiểm tra các hộp đang hoạt động và chỉ dừng
các hộp bạn đã tạo:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Chỉ dùng tái sử dụng khi bạn chủ động cần nhiều lệnh trên cùng một hộp đã hydrated:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Nếu Crabbox là lớp bị hỏng nhưng bản thân Blacksmith vẫn hoạt động, chỉ dùng
Blacksmith trực tiếp cho chẩn đoán như `list`, `status`, và cleanup. Sửa
đường Crabbox trước khi coi một lượt chạy Blacksmith trực tiếp là bằng chứng maintainer.

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các warmup mới
nằm ở `queued` mà không có IP hoặc URL lượt chạy Actions sau vài phút,
hãy coi đó là áp lực từ provider Blacksmith, queue, billing, hoặc giới hạn org. Dừng các
id đang queued mà bạn đã tạo, tránh khởi động thêm Testbox, và chuyển bằng chứng sang
đường dung lượng Crabbox sở hữu bên dưới trong khi ai đó kiểm tra dashboard Blacksmith,
billing, và giới hạn org.

Chỉ escalte sang dung lượng Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn quota, thiếu môi trường cần thiết, hoặc dung lượng sở hữu là mục tiêu rõ ràng:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thật sự cần CPU lớp 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để vấp quota EC2 Spot hoặc On-Demand Standard theo vùng. `.crabbox.yaml` do repo sở hữu mặc định là `standard`, nhiều vùng dung lượng, và `capacity.hints: true` để các lease AWS qua broker in ra vùng/market đã chọn, áp lực quota, phương án dự phòng Spot, và cảnh báo lớp áp lực cao. Dùng `fast` cho các kiểm tra rộng nặng hơn, `large` chỉ sau khi standard/fast không đủ, và `beast` chỉ cho các lane đặc biệt bị ràng buộc CPU như full-suite hoặc ma trận Docker toàn bộ Plugin, xác thực release/blocker rõ ràng, hoặc profiling hiệu năng nhiều lõi. Không dùng `beast` cho `pnpm check:changed`, kiểm thử tập trung, công việc chỉ liên quan docs, lint/typecheck thông thường, repro E2E nhỏ, hoặc triage sự cố Blacksmith. Dùng `--market on-demand` cho chẩn đoán dung lượng để biến động thị trường Spot không bị trộn vào tín hiệu.

`.crabbox.yaml` sở hữu các mặc định provider, sync, và hydration GitHub Actions cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrated giữ metadata Git từ xa của riêng nó thay vì sync remotes và object stores cục bộ của maintainer, và nó loại trừ các artifact runtime/build cục bộ không bao giờ nên được chuyển đi. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không phải secret cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
