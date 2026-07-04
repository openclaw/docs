---
read_when:
    - Bạn cần hiểu vì sao một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions không đạt
    - Bạn đang điều phối một lượt chạy hoặc chạy lại xác thực bản phát hành
    - Bạn đang thay đổi cơ chế điều phối ClawSweeper hoặc chuyển tiếp hoạt động GitHub
summary: Biểu đồ job CI, cổng phạm vi, ô bao quát phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-07-04T06:38:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần đẩy lên `main` và mọi pull request. Các lần đẩy
`main` chính tắc trước tiên đi qua một cửa sổ tiếp nhận hosted-runner 90 giây.
Nhóm đồng thời `CI` hiện có sẽ hủy lượt chạy đang chờ đó khi có commit mới hơn
được đưa lên, nên các lần hợp nhất tuần tự không đăng ký mỗi lần một ma trận
Blacksmith đầy đủ. Pull request và các lượt dispatch thủ công bỏ qua bước chờ.
Sau đó job `preflight` phân loại diff và tắt các lane tốn kém khi chỉ các vùng
không liên quan thay đổi. Các lượt chạy `workflow_dispatch` thủ công cố ý bỏ qua
phạm vi thông minh và bung toàn bộ đồ thị cho các release candidate và xác thực
rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi bao
phủ Plugin chỉ dành cho phát hành nằm trong workflow [`Plugin Prerelease`](#plugin-prerelease)
riêng biệt và chỉ chạy từ [`Full Release Validation`](#full-release-validation)
hoặc một dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                                | Mục đích                                                                                                   | Khi chạy                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Phát hiện thay đổi chỉ tài liệu, phạm vi đã thay đổi, extension đã thay đổi, và xây dựng manifest CI       | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `runner-admission`                 | Debounce 90 giây trên hosted runner cho các lần đẩy `main` chính tắc trước khi công việc Blacksmith được đăng ký | Mọi lượt chạy CI; chỉ ngủ trên các lần đẩy `main` chính tắc |
| `security-fast`                    | Phát hiện khóa riêng, kiểm toán workflow đã thay đổi qua `zizmor`, và kiểm toán lockfile production        | Luôn chạy trên các lần đẩy và PR không phải bản nháp |
| `check-dependencies`               | Lượt kiểm tra Knip chỉ cho dependency production cộng với guard allowlist tệp không dùng                   | Các thay đổi liên quan đến Node                     |
| `build-artifacts`                  | Xây dựng `dist/`, Control UI, kiểm tra smoke built-CLI, kiểm tra built-artifact nhúng, và artifact tái sử dụng | Các thay đổi liên quan đến Node                     |
| `checks-fast-core`                 | Các lane kiểm tra tính đúng đắn nhanh trên Linux như bundled, protocol, QA Smoke CI, và kiểm tra định tuyến CI | Các thay đổi liên quan đến Node                     |
| `checks-fast-contracts-plugins-*`  | Hai lượt kiểm tra contract Plugin được shard                                                               | Các thay đổi liên quan đến Node                     |
| `checks-fast-contracts-channels-*` | Hai lượt kiểm tra contract channel được shard                                                              | Các thay đổi liên quan đến Node                     |
| `checks-node-core-*`               | Các shard kiểm thử Node lõi, loại trừ các lane channel, bundled, contract, và extension                    | Các thay đổi liên quan đến Node                     |
| `check-*`                          | Tương đương cổng local chính được shard: kiểu production, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt | Các thay đổi liên quan đến Node                     |
| `check-additional-*`               | Kiến trúc, drift boundary/prompt được shard, guard extension, boundary package, và topology runtime        | Các thay đổi liên quan đến Node                     |
| `checks-node-compat-node22`        | Lane build và smoke tương thích Node 22                                                                    | Dispatch CI thủ công cho phát hành                  |
| `check-docs`                       | Kiểm tra định dạng tài liệu, lint, và liên kết hỏng                                                        | Tài liệu thay đổi                                   |
| `skills-python`                    | Ruff + pytest cho skills dựa trên Python                                                                   | Các thay đổi liên quan đến skill Python             |
| `checks-windows`                   | Kiểm thử process/path đặc thù Windows cộng với hồi quy specifier import runtime dùng chung                 | Các thay đổi liên quan đến Windows                  |
| `macos-node`                       | Lane kiểm thử TypeScript trên macOS dùng artifact đã build dùng chung                                      | Các thay đổi liên quan đến macOS                    |
| `macos-swift`                      | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                          | Các thay đổi liên quan đến macOS                    |
| `ios-build`                        | Tạo dự án Xcode cộng với build simulator cho ứng dụng iOS                                                  | Ứng dụng iOS, app kit dùng chung, hoặc thay đổi Swabble |
| `android`                          | Kiểm thử đơn vị Android cho cả hai flavor cộng với một build APK debug                                     | Các thay đổi liên quan đến Android                  |
| `test-performance-agent`           | Tối ưu hóa kiểm thử chậm Codex hằng ngày sau hoạt động đáng tin cậy                                        | CI chính thành công hoặc dispatch thủ công          |
| `openclaw-performance`             | Báo cáo hiệu năng runtime Kova hằng ngày/theo yêu cầu với các lane mock-provider, deep-profile, và GPT 5.5 live | Theo lịch và dispatch thủ công                      |

## Thứ tự fail-fast

1. `runner-admission` chỉ chờ cho các lần đẩy `main` chính tắc; một lần đẩy mới hơn hủy lượt chạy trước khi đăng ký Blacksmith.
2. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
4. `build-artifacts` chạy chồng lấp với các lane Linux nhanh để downstream consumer có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
5. Các lane nền tảng và runtime nặng hơn bung ra sau đó: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một lần đẩy mới hơn vào cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lượt chạy mới nhất cho cùng ref cũng đang thất bại. Các job ma trận dùng `fail-fast: false`, và `build-artifacts` báo cáo trực tiếp lỗi embedded channel, core-support-boundary, và gateway-watch thay vì xếp hàng các job verifier nhỏ. Khóa đồng thời CI tự động được phiên bản hóa (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lượt chạy main mới hơn. Các lượt chạy thủ công toàn bộ suite dùng `CI-manual-v1-*` và không hủy các lượt chạy đang diễn ra.

Dùng `pnpm ci:timings`, `pnpm ci:timings:recent`, hoặc `node scripts/ci-run-timings.mjs <run-id>` để tóm tắt thời gian chạy, thời gian hàng đợi, job chậm nhất, lỗi, và rào cản fanout `pnpm-store-warmup` từ GitHub Actions. CI cũng tải lên cùng bản tóm tắt lượt chạy dưới dạng artifact `ci-timings-summary`. Với thời gian build, hãy kiểm tra bước `Build dist` của job `build-artifacts`: `pnpm build:ci-artifacts` in `[build-all] phase timings:` và bao gồm `ui:build`; job cũng tải lên artifact `startup-memory`.

Đối với các lượt chạy pull request, job timing-summary cuối cùng chạy helper từ revision base đáng tin cậy trước khi truyền `GH_TOKEN` cho `gh run view`. Điều đó giữ truy vấn có token nằm ngoài mã do nhánh kiểm soát trong khi vẫn tóm tắt lượt chạy CI hiện tại của pull request.

## Bối cảnh PR và bằng chứng

PR từ contributor bên ngoài chạy một cổng bối cảnh PR và bằng chứng từ
`.github/workflows/real-behavior-proof.yml`. Workflow checkout commit base đáng tin cậy
và chỉ đánh giá nội dung PR; nó không thực thi mã từ nhánh contributor.

Cổng áp dụng cho tác giả PR không phải là chủ sở hữu repository, member,
collaborator, hoặc bot. Nó đạt khi nội dung PR chứa các phần do tác giả viết
`What Problem This Solves` và `Evidence`. Bằng chứng có thể là một kiểm thử tập trung,
kết quả CI, ảnh chụp màn hình, bản ghi, đầu ra terminal, quan sát trực tiếp,
log đã biên tập, hoặc liên kết artifact. Nội dung cung cấp ý định và xác thực hữu ích;
reviewer kiểm tra mã, kiểm thử, và CI để đánh giá tính đúng đắn.

Khi kiểm tra thất bại, hãy cập nhật nội dung PR thay vì đẩy thêm một commit mã khác.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi vùng có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng tự chúng không ép build native Windows, iOS, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi mã nguồn nền tảng.
- **Workflow Sanity** chạy `actionlint`, `zizmor` trên tất cả tệp YAML workflow, guard nội suy composite-action, và guard dấu xung đột. Job `security-fast` theo phạm vi PR cũng chạy `zizmor` trên các tệp workflow đã thay đổi để các phát hiện bảo mật workflow thất bại sớm trong đồ thị CI chính.
- **Tài liệu trên các lần đẩy `main`** được kiểm tra bởi workflow `Docs` độc lập với cùng bản mirror tài liệu ClawHub được CI dùng, nên các lần đẩy hỗn hợp code+tài liệu không đồng thời xếp hàng shard `check-docs` của CI. Pull request và CI thủ công vẫn chạy `check-docs` từ CI khi tài liệu thay đổi.
- **TUI PTY** chạy trong shard Linux Node `checks-node-core-runtime-tui-pty` cho các thay đổi TUI. Shard chạy `test/vitest/vitest.tui-pty.config.ts` với `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, nên nó bao phủ cả lane fixture `TuiBackend` xác định và smoke `tui --local` chậm hơn chỉ mock endpoint model bên ngoài.
- **Chỉnh sửa chỉ định tuyến CI, các chỉnh sửa fixture kiểm thử core rẻ được chọn, và chỉnh sửa helper/test-routing contract Plugin hẹp** dùng đường dẫn manifest nhanh chỉ Node: `preflight`, security, và một tác vụ `checks-fast-core` duy nhất. Đường dẫn đó bỏ qua build artifact, tương thích Node 22, contract channel, toàn bộ shard core, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp kiểm tra.
- **Kiểm tra Node Windows** được giới hạn theo các wrapper process/path đặc thù Windows, helper runner npm/pnpm/UI, cấu hình package manager, và các bề mặt workflow CI thực thi lane đó; các thay đổi mã nguồn không liên quan, Plugin, install-smoke, và chỉ kiểm thử vẫn nằm trên các lane Linux Node.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job luôn nhỏ mà không đặt trước runner quá mức: hợp đồng plugin và hợp đồng kênh mỗi nhóm chạy dưới dạng hai shard có trọng số được Blacksmith hỗ trợ với runner GitHub tiêu chuẩn làm dự phòng, các lane core unit fast/support chạy riêng, core runtime infra được tách giữa state, process/config, shared, và ba shard miền cron, auto-reply chạy dưới dạng các worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch, và commands/state-routing), còn các cấu hình agentic gateway/server được tách thành các lane chat/auth/model/http-plugin/runtime/startup thay vì chờ các artifact đã build. CI thông thường sau đó chỉ đóng gói các shard mẫu include infra biệt lập vào các bundle xác định tối đa 64 tệp kiểm thử, giảm ma trận Node mà không gộp các bộ command/cron không biệt lập, agents-core có trạng thái, hoặc gateway/server; các bộ cố định nặng vẫn dùng 8 vCPU trong khi các lane đã đóng gói và trọng số thấp hơn dùng 4 vCPU. Pull request trên repository chính tắc dùng thêm một kế hoạch tiếp nhận gọn: cùng các nhóm theo cấu hình chạy trong các subprocess biệt lập bên trong kế hoạch Linux Node 34 job hiện tại, nên một PR đơn lẻ không đăng ký toàn bộ ma trận Node hơn 70 job. Các lần push lên `main`, dispatch thủ công, và cổng release giữ nguyên ma trận đầy đủ. Các kiểm thử trình duyệt rộng, QA, media, và plugin linh tinh dùng cấu hình Vitest chuyên biệt của chúng thay vì catch-all plugin dùng chung. Các shard mẫu include ghi lại mục timing bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt một cấu hình đầy đủ với một shard đã lọc. `check-additional-*` giữ công việc biên dịch/canary theo ranh giới package cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; danh sách boundary guard được chia sọc thành một shard nặng về prompt và một shard kết hợp cho các sọc guard còn lại, mỗi shard chạy đồng thời các guard độc lập được chọn và in timing theo từng check. Kiểm tra drift snapshot prompt happy-path Codex tốn kém chạy dưới dạng additional job riêng cho CI thủ công và chỉ cho các thay đổi ảnh hưởng đến prompt, nên các thay đổi Node bình thường không liên quan không phải chờ sau quá trình tạo snapshot prompt nguội, và các boundary shard vẫn cân bằng trong khi prompt drift vẫn được ghim vào PR đã gây ra nó; cùng cờ đó bỏ qua quá trình tạo snapshot prompt Vitest bên trong shard core support-boundary artifact đã build. Gateway watch, kiểm thử kênh, và shard core support-boundary chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Sau khi được tiếp nhận, CI Linux chính tắc cho phép tối đa 24 job kiểm thử Node đồng thời và
12 cho các lane fast/check nhỏ hơn; Windows và Android giữ ở mức hai vì
các pool runner đó hẹp hơn.

Kế hoạch PR gọn phát ra 18 job Node cho bộ hiện tại: các nhóm whole-config
được batch trong các subprocess biệt lập với timeout batch 120 phút,
trong khi các nhóm mẫu include dùng chung cùng ngân sách job có giới hạn.

CI Android chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi build APK debug Play. Flavor third-party không có source set hoặc manifest riêng; lane unit-test của nó vẫn biên dịch flavor với các cờ SMS/call-log BuildConfig, đồng thời tránh một job đóng gói APK debug trùng lặp trên mỗi lần push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ kiểm tra dependency production, được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho bản cài `dlx`) và `pnpm deadcode:unused-files`, so sánh các phát hiện tệp không dùng trong production của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng sẽ fail khi PR thêm một tệp không dùng mới chưa được review hoặc để lại một mục allowlist đã lỗi thời, trong khi vẫn giữ các bề mặt plugin động, được tạo, build, live-test, và cầu nối package có chủ ý mà Knip không thể phân giải tĩnh.

## Chuyển tiếp hoạt động ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` là cầu nối phía đích từ hoạt động repository OpenClaw vào ClawSweeper. Nó không checkout hoặc thực thi mã pull request không đáng tin cậy. Workflow tạo token GitHub App từ `CLAWSWEEPER_APP_PRIVATE_KEY`, rồi dispatch các payload `repository_dispatch` gọn tới `openclaw/clawsweeper`.

Workflow có bốn lane:

- `clawsweeper_item` cho các yêu cầu review issue và pull request chính xác;
- `clawsweeper_comment` cho các lệnh ClawSweeper rõ ràng trong comment issue;
- `clawsweeper_commit_review` cho các yêu cầu review cấp commit trên các lần push lên `main`;
- `github_activity` cho hoạt động GitHub chung mà agent ClawSweeper có thể kiểm tra.

Lane `github_activity` chỉ chuyển tiếp metadata đã chuẩn hóa: loại event, action, actor, repository, số item, URL, tiêu đề, trạng thái, và các đoạn trích ngắn cho comment hoặc review khi có. Nó cố ý tránh chuyển tiếp toàn bộ phần thân webhook. Workflow nhận trong `openclaw/clawsweeper` là `.github/workflows/github-activity.yml`, workflow này đăng event đã chuẩn hóa lên hook OpenClaw Gateway cho agent ClawSweeper.

Hoạt động chung là quan sát, không phải mặc định sẽ gửi đi. Agent ClawSweeper nhận đích Discord trong prompt của nó và chỉ nên đăng lên `#clawsweeper` khi event gây bất ngờ, có thể hành động, rủi ro, hoặc hữu ích về vận hành. Các lượt mở, chỉnh sửa, nhiễu bot, nhiễu webhook trùng lặp, và lưu lượng review bình thường nên trả về `NO_REPLY`.

Hãy coi tiêu đề, comment, phần thân, văn bản review, tên nhánh, và thông điệp commit trên GitHub là dữ liệu không đáng tin cậy xuyên suốt đường dẫn này. Chúng là đầu vào để tóm tắt và phân loại, không phải chỉ dẫn cho workflow hoặc runtime agent.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI thông thường nhưng ép bật mọi lane có phạm vi không phải Android: shard Linux Node, shard bundled-plugin, shard hợp đồng plugin và kênh, tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra smoke artifact đã build, kiểm tra docs, Python skills, Windows, macOS, build iOS, và i18n Control UI. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella release đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh prerelease plugin, shard chỉ dành cho release `agentic-plugins`, lượt quét batch extension đầy đủ, và các lane Docker prerelease plugin bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với cổng release-validation được bật.

Các lần chạy thủ công dùng một concurrency group duy nhất để bộ đầy đủ của release candidate không bị hủy bởi một lần push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag, hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                          | Job                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Dispatch CI thủ công và fallback repository không chính tắc, quét chất lượng CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflow docs ngoài CI, và preflight install-smoke để ma trận Blacksmith có thể vào hàng đợi sớm hơn                                                          |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shard extension trọng số thấp hơn, `checks-fast-core` ngoại trừ QA Smoke CI, shard hợp đồng plugin/kênh, hầu hết shard Linux Node bundled/trọng số thấp hơn, `check-guards`, `check-prod-types`, `check-test-types`, các shard `check-additional-*` được chọn, và `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Các bộ Linux Node nặng được giữ lại, shard `check-additional-*` nặng về boundary/extension, và `android`                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` trong CI và Testbox, `check-lint` (đủ nhạy với CPU nên 8 vCPU tốn kém hơn mức tiết kiệm được); các build Docker install-smoke (thời gian hàng đợi 32-vCPU tốn kém hơn mức tiết kiệm được)                                                                                                   |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` trên `openclaw/openclaw`; fork fallback về `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` và `ios-build` trên `openclaw/openclaw`; fork fallback về `macos-26`                                                                                                                                                                                                                     |

## Ngân sách đăng ký runner

Bucket đăng ký runner GitHub hiện tại của OpenClaw báo cáo 10.000 lượt đăng ký runner self-hosted
mỗi 5 phút trong `ghx api rate_limit`. Kiểm tra lại
`actions_runner_registration` trước mỗi lượt tinh chỉnh vì GitHub có thể thay đổi
bucket này. Giới hạn này được chia sẻ bởi tất cả lượt đăng ký runner Blacksmith trong tổ chức
`openclaw`, nên thêm một bản cài Blacksmith khác không thêm
bucket mới.

Hãy coi label Blacksmith là tài nguyên khan hiếm để kiểm soát burst. Các job
chỉ định tuyến, thông báo, tóm tắt, chọn shard, hoặc chạy quét CodeQL ngắn nên
ở trên runner do GitHub host trừ khi chúng có nhu cầu riêng với Blacksmith đã được đo lường.
Bất kỳ ma trận Blacksmith mới, `max-parallel` lớn hơn, hoặc workflow tần suất cao nào
đều phải chỉ ra số đăng ký trong trường hợp xấu nhất và giữ mục tiêu cấp tổ chức
dưới khoảng 60% bucket live. Với bucket 10.000 lượt đăng ký hiện tại,
điều đó nghĩa là mục tiêu vận hành 6.000 lượt đăng ký, để lại dư địa cho
các repository đồng thời, retry, và burst chồng lấp.

CI repository chính tắc giữ Blacksmith làm đường runner mặc định cho các lần chạy push và pull-request thông thường. `workflow_dispatch` và các lần chạy repository không chính tắc dùng runner do GitHub host, nhưng các lần chạy chính tắc thông thường hiện không probe tình trạng hàng đợi Blacksmith hoặc tự động fallback về label do GitHub host khi Blacksmith không khả dụng.

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

Kích hoạt thủ công thường benchmark ref của workflow. Đặt `target_ref` để benchmark một thẻ phát hành hoặc một nhánh khác bằng triển khai workflow hiện tại. Các đường dẫn báo cáo đã xuất bản và con trỏ mới nhất được khóa theo ref được kiểm thử, và mỗi `index.md` ghi lại ref/SHA được kiểm thử, ref/SHA của workflow, ref Kova, hồ sơ, chế độ xác thực lane, mô hình, số lần lặp và bộ lọc kịch bản.

Workflow cài đặt OCM từ một bản phát hành được ghim và Kova từ `openclaw/Kova` tại đầu vào `kova_ref` đã ghim, rồi chạy ba lane:

- `mock-provider`: Các kịch bản chẩn đoán Kova chạy với runtime bản dựng cục bộ có xác thực giả lập tương thích OpenAI, mang tính xác định.
- `mock-deep-profile`: Hồ sơ CPU/heap/trace cho các điểm nóng khi khởi động, Gateway và lượt tác tử.
- `live-openai-candidate`: Một lượt tác tử OpenAI thật `openai/gpt-5.5`, được bỏ qua khi không có `OPENAI_API_KEY`.

Lane mock-provider cũng chạy các probe nguồn gốc OpenClaw sau lượt Kova: thời gian khởi động Gateway và bộ nhớ qua các trường hợp khởi động mặc định, hook và 50 Plugin; RSS nhập Plugin đi kèm, các vòng lặp hello `channel-chat-baseline` mock-OpenAI lặp lại, lệnh khởi động CLI chạy với Gateway đã bật, và probe hiệu năng smoke trạng thái SQLite. Khi báo cáo nguồn mock-provider đã xuất bản trước đó có sẵn cho ref được kiểm thử, phần tóm tắt nguồn so sánh các giá trị RSS và heap hiện tại với baseline đó và đánh dấu các mức tăng RSS lớn là `watch`. Tóm tắt Markdown của probe nguồn nằm tại `source/index.md` trong gói báo cáo, với JSON thô nằm cạnh đó.

Mọi lane đều tải lên artifact GitHub. Khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình, workflow cũng commit `report.json`, `report.md`, các bundle, `index.md` và artifact probe nguồn vào `openclaw/clawgrit-reports` dưới `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Con trỏ ref được kiểm thử hiện tại được ghi là `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Xác thực phát hành đầy đủ

`Full Release Validation` là workflow bao trùm thủ công cho việc "chạy mọi thứ trước khi phát hành." Workflow này nhận một nhánh, thẻ hoặc SHA commit đầy đủ, kích hoạt workflow `CI` thủ công với mục tiêu đó, kích hoạt `Plugin Prerelease` cho bằng chứng Plugin/gói/tĩnh/Docker chỉ dành cho phát hành, và kích hoạt `OpenClaw Release Checks` cho smoke cài đặt, chấp nhận gói, kiểm tra gói đa hệ điều hành, render scorecard độ trưởng thành từ bằng chứng hồ sơ QA, tương đương QA Lab, Matrix và các lane Telegram. Hồ sơ ổn định và đầy đủ luôn bao gồm phạm vi soak đường dẫn phát hành live/E2E và Docker toàn diện; hồ sơ beta có thể chọn tham gia bằng `run_release_soak=true`. E2E Telegram gói chuẩn chạy bên trong Package Acceptance, nên một ứng viên đầy đủ sẽ không khởi động poller live trùng lặp. Sau khi xuất bản, truyền `release_package_spec` để tái sử dụng gói npm đã phát hành trong release checks, Package Acceptance, Docker, đa hệ điều hành và Telegram mà không cần dựng lại. Chỉ dùng `npm_telegram_package_spec` cho một lượt chạy lại Telegram tập trung với gói đã xuất bản. Lane gói live của Plugin Codex mặc định dùng cùng trạng thái đã chọn: `release_package_spec=openclaw@<tag>` đã xuất bản suy ra `codex_plugin_spec=npm:@openclaw/codex@<tag>`, còn các lượt chạy SHA/artifact sẽ đóng gói `extensions/codex` từ ref đã chọn. Đặt `codex_plugin_spec` tường minh cho nguồn Plugin tùy chỉnh như các spec `npm:`, `npm-pack:` hoặc `git:`.

Xem [xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết ma trận giai đoạn, tên job workflow chính xác, khác biệt giữa các hồ sơ, artifact và các handle chạy lại tập trung.

`OpenClaw Release Publish` là workflow phát hành thủ công có thay đổi trạng thái. Kích hoạt workflow này từ `release/YYYY.M.PATCH` hoặc `main` sau khi thẻ phát hành đã tồn tại và sau khi preflight npm OpenClaw đã thành công. Workflow xác minh `pnpm plugins:sync:check`, kích hoạt `Plugin NPM Release` cho mọi gói Plugin có thể xuất bản, kích hoạt `Plugin ClawHub Release` cho cùng SHA phát hành, và chỉ sau đó mới kích hoạt `OpenClaw NPM Release` với `preflight_run_id` đã lưu. Xuất bản ổn định cũng yêu cầu `windows_node_tag` chính xác; workflow xác minh bản phát hành nguồn Windows và so sánh trình cài đặt x64/ARM64 của bản đó với đầu vào `windows_node_installer_digests` đã được ứng viên phê duyệt trước bất kỳ workflow con xuất bản nào, rồi quảng bá và xác minh cùng các digest trình cài đặt đã ghim đó cộng với artifact đồng hành chính xác và hợp đồng checksum trước khi xuất bản bản nháp phát hành GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Để có bằng chứng commit đã ghim trên một nhánh thay đổi nhanh, dùng helper thay vì `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Ref kích hoạt workflow GitHub phải là nhánh hoặc thẻ, không phải SHA commit thô. Helper đẩy một nhánh tạm `release-ci/<sha>-...` tại SHA mục tiêu, kích hoạt `Full Release Validation` từ ref đã ghim đó, xác minh mọi workflow con có `headSha` khớp với mục tiêu, và xóa nhánh tạm khi lượt chạy hoàn tất. Trình xác minh bao trùm cũng thất bại nếu bất kỳ workflow con nào chạy ở một SHA khác.

`release_profile` kiểm soát độ rộng live/provider được truyền vào release checks. Các workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn cố ý muốn ma trận provider/media tư vấn rộng. Release checks ổn định và đầy đủ luôn chạy soak đường dẫn phát hành live/E2E và Docker toàn diện; hồ sơ beta có thể chọn tham gia bằng `run_release_soak=true`.

- `minimum` giữ các lane OpenAI/core nhanh nhất và trọng yếu cho phát hành.
- `stable` thêm tập provider/backend ổn định.
- `full` chạy ma trận provider/media tư vấn rộng.

Workflow bao trùm ghi lại ID lượt chạy con đã kích hoạt, và job cuối `Verify full validation` kiểm tra lại kết luận hiện tại của các lượt chạy con và thêm bảng job chậm nhất cho từng lượt chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại job xác minh cha để làm mới kết quả bao trùm và tóm tắt thời gian.

Để phục hồi, cả `Full Release Validation` và `OpenClaw Release Checks` đều nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` cho chỉ workflow con CI đầy đủ thông thường, `plugin-prerelease` cho chỉ workflow con prerelease Plugin, `release-checks` cho mọi workflow con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` hoặc `npm-telegram` trên workflow bao trùm. Điều này giữ phạm vi chạy lại một hộp phát hành lỗi sau một bản sửa tập trung. Với một lane đa hệ điều hành lỗi, kết hợp `rerun_group=cross-os` với `cross_os_suite_filter`, ví dụ `windows/packaged-upgrade`; các lệnh đa hệ điều hành dài phát ra dòng Heartbeat và tóm tắt packaged-upgrade bao gồm thời gian theo từng pha. Các lane QA release-check mang tính tư vấn, ngoại trừ cổng phạm vi công cụ runtime chuẩn, cổng này chặn khi các công cụ động OpenClaw bắt buộc bị lệch hoặc biến mất khỏi tóm tắt tier chuẩn.

`OpenClaw Release Checks` dùng ref workflow tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho kiểm tra đa hệ điều hành và Package Acceptance, cộng với workflow Docker đường dẫn phát hành live/E2E khi chạy phạm vi soak. Điều này giữ byte gói nhất quán giữa các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều job con. Với lane live Plugin npm Codex, release checks hoặc truyền một spec Plugin đã xuất bản khớp được suy ra từ `release_package_spec`, hoặc truyền `codex_plugin_spec` do người vận hành cung cấp, hoặc để trống đầu vào để script Docker đóng gói Plugin Codex của checkout đã chọn.

Các lượt chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all` thay thế workflow bao trùm cũ hơn. Bộ giám sát cha hủy mọi workflow con mà nó đã kích hoạt khi workflow cha bị hủy, nên xác thực main mới hơn không phải nằm sau một lượt release-check cũ kéo dài hai giờ. Xác thực nhánh/thẻ phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

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
- các shard media âm thanh/video đã tách và các shard nhạc được lọc theo provider

Điều này giữ nguyên phạm vi file trong khi giúp chạy lại và chẩn đoán lỗi provider live chậm dễ hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media` và `native-live-extensions-media-music` vẫn hợp lệ cho các lượt chạy lại thủ công một lần.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được dựng bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên runner Blacksmith thông thường — job container là nơi không phù hợp để khởi chạy kiểm thử Docker lồng nhau.

Các shard mô hình/backend live được Docker hậu thuẫn sử dụng một image dùng chung riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit được chọn. Quy trình phát hành live xây dựng và đẩy image đó một lần, sau đó các shard mô hình live Docker, Gateway được chia shard theo provider, backend CLI, ACP bind và Codex harness chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout của job trong workflow, để container bị kẹt hoặc đường dọn dẹp lỗi nhanh thay vì tiêu tốn toàn bộ ngân sách kiểm tra phát hành. Nếu các shard đó tự xây dựng lại toàn bộ target Docker từ mã nguồn một cách độc lập, lần chạy phát hành đã bị cấu hình sai và sẽ lãng phí thời gian thực vào các lượt build image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là “gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?” Nó khác với CI thông thường: CI thông thường xác thực cây mã nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng chạy sau khi cài đặt hoặc cập nhật.

### Công việc

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256 và profile trong phần tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory của tarball, chuẩn bị các image Docker package-digest khi cần, và chạy các lane Docker đã chọn trên gói đó thay vì đóng gói checkout của workflow. Khi một profile chọn nhiều `docker_lanes` được nhắm mục tiêu, workflow tái sử dụng chuẩn bị gói và image dùng chung một lần, rồi fan-out các lane đó thành các job Docker được nhắm mục tiêu chạy song song với artifact duy nhất.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã xuất bản.
4. `summary` làm workflow thất bại nếu phân giải gói, chấp nhận Docker, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng nguồn này cho chấp nhận bản prerelease/stable đã xuất bản.
- `source=ref` đóng gói một nhánh, tag, hoặc SHA commit đầy đủ đáng tin cậy trong `package_ref`. Bộ phân giải fetch các nhánh/tag OpenClaw, xác minh commit được chọn có thể truy tới từ lịch sử nhánh kho lưu trữ hoặc một tag phát hành, cài đặt dependency trong một worktree tách rời, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS công khai; bắt buộc có `package_sha256`. Đường này từ chối thông tin xác thực trong URL, cổng HTTPS không mặc định, hostname hoặc IP đã phân giải thuộc loại riêng tư/nội bộ/sử dụng đặc biệt, và redirect ra ngoài cùng chính sách an toàn công khai.
- `source=trusted-url` tải xuống một `.tgz` HTTPS từ một chính sách trusted-source có tên trong `.github/package-trusted-sources.json`; bắt buộc có `package_sha256` và `trusted_source_id`. Chỉ dùng nguồn này cho mirror enterprise do maintainer sở hữu hoặc kho gói riêng cần cấu hình host, cổng, tiền tố đường dẫn, host redirect, hoặc phân giải mạng riêng. Nếu chính sách khai báo bearer auth, workflow dùng secret cố định `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; thông tin xác thực nhúng trong URL vẫn bị từ chối.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy bài kiểm tra. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn cũ đáng tin cậy mà không chạy logic workflow cũ.

### Profile bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng thêm `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Profile `package` dùng phạm vi kiểm thử plugin ngoại tuyến để xác thực gói đã xuất bản không bị phụ thuộc vào khả dụng live của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, trong khi đường spec npm đã xuất bản được giữ lại cho các dispatch độc lập.

Để xem chính sách kiểm thử cập nhật và plugin chuyên biệt, bao gồm lệnh cục bộ,
lane Docker, đầu vào Package Acceptance, mặc định phát hành và phân loại lỗi,
xem [Kiểm thử cập nhật và plugin](/vi/help/testing-updates-plugins).

Các kiểm tra phát hành gọi Package Acceptance với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'`, và `telegram_mode=mock-openai`. Điều này giữ bằng chứng di chuyển gói, cập nhật, cài đặt skill live ClawHub, dọn dẹp dependency plugin lỗi thời, sửa cài đặt plugin đã cấu hình, plugin ngoại tuyến, plugin-update và Telegram trên cùng tarball gói đã phân giải. Đặt `release_package_spec` trên Full Release Validation hoặc OpenClaw Release Checks sau khi xuất bản beta để chạy cùng ma trận trên gói npm đã phát hành mà không build lại; chỉ đặt `package_acceptance_package_spec` khi Package Acceptance cần một gói khác với phần còn lại của xác thực phát hành. Các kiểm tra phát hành đa hệ điều hành vẫn bao phủ onboarding, trình cài đặt và hành vi nền tảng đặc thù theo hệ điều hành; xác thực sản phẩm gói/cập nhật nên bắt đầu bằng Package Acceptance. Lane Docker `published-upgrade-survivor` xác thực một baseline gói đã xuất bản cho mỗi lần chạy trong đường phát hành chặn. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã xuất bản dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại lane thất bại giữ nguyên baseline đó. Full Release Validation với `run_release_soak=true` hoặc `release_profile=full` đặt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` và `published_upgrade_survivor_scenarios=reported-issues` để mở rộng qua bốn bản phát hành npm stable mới nhất cộng với các bản phát hành ranh giới tương thích plugin được ghim và fixture dạng issue cho cấu hình Feishu, các tệp bootstrap/persona được giữ lại, cài đặt plugin OpenClaw đã cấu hình, đường dẫn log dấu ngã, và root dependency plugin legacy lỗi thời. Các lựa chọn published-upgrade survivor nhiều baseline được chia shard theo baseline thành các job runner Docker được nhắm mục tiêu riêng. Workflow `Update Migration` riêng dùng lane Docker `update-migration` với `all-since-2026.4.23` và `plugin-deps-cleanup` khi câu hỏi là dọn dẹp cập nhật đã xuất bản toàn diện, không phải độ rộng CI Full Release thông thường. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một lane duy nhất bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Lane đã xuất bản cấu hình baseline bằng một công thức lệnh `openclaw config set` được bake sẵn, ghi lại các bước công thức trong `summary.json`, và probe `/healthz`, `/readyz`, cộng với trạng thái RPC sau khi Gateway khởi động. Các lane Windows đóng gói và cài đặt mới cũng xác minh rằng một gói đã cài đặt có thể import override browser-control từ một đường dẫn Windows tuyệt đối thô. Smoke agent-turn OpenAI đa hệ điều hành mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.5`, để bằng chứng cài đặt và Gateway vẫn nằm trên mô hình kiểm thử GPT-5 đồng thời tránh các mặc định GPT-4.x.

### Cửa sổ tương thích legacy

Package Acceptance có các cửa sổ tương thích legacy có giới hạn cho các gói đã xuất bản. Các gói đến hết `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ tới các tệp bị bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua trường hợp con lưu bền `gateway install --wrapper` khi gói không expose flag đó;
- `update-channel-switch` có thể cắt tỉa `patchedDependencies` pnpm bị thiếu khỏi fixture git giả dẫn xuất từ tarball và có thể log thiếu `update.channel` đã lưu bền;
- các smoke plugin có thể đọc vị trí install-record legacy hoặc chấp nhận thiếu lưu bền install-record marketplace;
- `plugin-update` có thể cho phép di chuyển metadata cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã xuất bản cũng có thể cảnh báo về các tệp dấu metadata build cục bộ đã được phát hành. Các gói sau đó phải đáp ứng hợp đồng hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Workflow `Install Smoke` riêng tái sử dụng cùng script scope thông qua job `preflight` của nó. Nó chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho các pull request chạm đến bề mặt Docker/gói, thay đổi gói/manifest Plugin đóng gói kèm, hoặc các bề mặt Plugin SDK/plugin/kênh/gateway lõi mà các job smoke Docker kiểm thử. Các thay đổi Plugin đóng gói kèm chỉ ở mã nguồn, chỉnh sửa chỉ liên quan đến kiểm thử, và chỉnh sửa chỉ liên quan đến tài liệu không giữ trước worker Docker. Đường dẫn nhanh build ảnh Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI xóa agents shared-workspace, chạy e2e container gateway-network, xác minh một đối số build extension đóng gói kèm, và chạy hồ sơ Docker Plugin đóng gói kèm có giới hạn dưới timeout lệnh tổng hợp 240 giây (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update của trình cài đặt cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành workflow-call, và các pull request thật sự chạm đến bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một ảnh smoke GHCR Dockerfile gốc theo target-SHA, rồi chạy cài đặt gói QR, smoke Dockerfile gốc/gateway, smoke trình cài đặt/update, và Docker E2E Plugin đóng gói kèm nhanh dưới dạng các job riêng để công việc trình cài đặt không phải chờ sau các smoke ảnh gốc.

Các lần push lên `main` (bao gồm merge commit) không bắt buộc chạy đường dẫn đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một lần push, workflow giữ smoke Docker nhanh và để smoke cài đặt đầy đủ cho kiểm định hằng đêm hoặc phát hành.

Smoke image-provider cài đặt toàn cục Bun chậm được kiểm soát riêng bởi `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn bật nó, nhưng pull request và các lần push lên `main` thì không. CI PR thông thường vẫn chạy lane hồi quy trình khởi chạy Bun nhanh cho các thay đổi liên quan đến Node. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile tập trung vào cài đặt của riêng chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` prebuild một ảnh live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, và build hai ảnh `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane trình cài đặt/update/phụ thuộc Plugin;
- một ảnh chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch được chọn. Bộ lập lịch chọn ảnh cho từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số điều chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot pool chính cho các lane thông thường.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot pool đuôi nhạy cảm với nhà cung cấp.                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để nhà cung cấp không throttle.                                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5        | Giới hạn lane cài đặt npm đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane đa dịch vụ đồng thời.                                                           |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ lệch giữa các lần bắt đầu lane để tránh bão tạo Docker daemon; đặt `0` để không lệch.      |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Timeout dự phòng cho mỗi lane (120 phút); các lane live/đuôi được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` in kế hoạch bộ lập lịch mà không chạy lane.                                               |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agents có thể tái hiện một lane lỗi. |

Một lane nặng hơn giới hạn hiệu lực của nó vẫn có thể bắt đầu từ một pool trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Tiền kiểm tra tổng hợp cục bộ kiểm tra Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời gian lane để sắp xếp lane dài nhất trước, và mặc định dừng lập lịch các lane trong pool mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` để biết phạm vi gói, loại ảnh, ảnh live, lane, và thông tin xác thực nào là bắt buộc. `scripts/docker-e2e.mjs` sau đó chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại, hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; build và push các ảnh Docker E2E GHCR bare/functional gắn tag theo digest gói qua cache lớp Docker của Blacksmith khi kế hoạch cần các lane đã cài gói; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các ảnh theo digest gói hiện có thay vì build lại. Việc pull ảnh Docker được retry với timeout giới hạn 180 giây cho mỗi lần thử để một luồng registry/cache bị kẹt retry nhanh thay vì tiêu tốn phần lớn đường găng CI.

### Các chunk đường dẫn phát hành

Phạm vi Docker phát hành chạy các job chia chunk nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi chunk chỉ pull đúng loại ảnh cần thiết và thực thi nhiều lane qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Các chunk Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, và `plugins-runtime-install-a` đến `plugins-runtime-install-h`. `package-update-openai` bao gồm lane gói Plugin Codex live, cài đặt gói OpenClaw ứng viên, cài đặt Plugin Codex từ `codex_plugin_spec` hoặc tarball cùng ref với phê duyệt cài đặt Codex CLI rõ ràng, chạy tiền kiểm tra Codex CLI, rồi chạy nhiều lượt agent OpenClaw cùng phiên với OpenAI. `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là alias plugin/runtime tổng hợp. Alias lane `install-e2e` vẫn là alias chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt nhà cung cấp.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu nó, và chỉ giữ chunk `openwebui` độc lập cho các dispatch chỉ dành cho OpenWebUI. Các lane update kênh đóng gói kèm retry một lần cho lỗi mạng npm thoáng qua.

Mỗi chunk tải lên `.artifacts/docker-tests/` cùng log lane, thời gian, `summary.json`, `failures.json`, thời gian pha, JSON kế hoạch bộ lập lịch, bảng lane chậm, và lệnh chạy lại theo từng lane. Input `docker_lanes` của workflow chạy các lane được chọn trên các ảnh đã chuẩn bị thay vì các job chunk, giúp việc debug lane lỗi được giới hạn trong một job Docker nhắm mục tiêu và chuẩn bị, tải xuống, hoặc tái sử dụng artifact gói cho lần chạy đó; nếu một lane được chọn là lane Docker live, job nhắm mục tiêu build ảnh live-test cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub theo từng lane được tạo bao gồm `package_artifact_run_id`, `package_artifact_name`, và input ảnh đã chuẩn bị khi các giá trị đó tồn tại, để một lane lỗi có thể tái sử dụng đúng gói và ảnh từ lần chạy lỗi.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy bộ Docker release-path đầy đủ hằng ngày.

## Tiền phát hành Plugin

`Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, push lên `main`, và dispatch CI thủ công độc lập giữ bộ này tắt. Nó cân bằng kiểm thử Plugin đóng gói kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các lô Plugin nặng import không tạo thêm job CI. Đường dẫn prerelease Docker chỉ dành cho phát hành gom các lane Docker nhắm mục tiêu thành các nhóm nhỏ để tránh giữ trước hàng chục runner cho các job một đến ba phút. Workflow cũng tải lên artifact thông tin `plugin-inspector-advisory` từ `@openclaw/plugin-inspector`; các phát hiện của inspector là đầu vào phân loại và không thay đổi cổng chặn Plugin Prerelease.

## QA Lab

QA Lab có các lane CI chuyên dụng bên ngoài workflow chính được xác định phạm vi thông minh. Tính tương đương agentic được lồng dưới các harness QA rộng và phát hành, không phải một workflow PR độc lập. Dùng `Full Release Validation` với `rerun_group=qa-parity` khi tính tương đương cần đi cùng một lần chạy kiểm định rộng.

- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó fan out lane tương đương mock, lane Matrix live, và các lane Telegram và Discord live thành các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Kiểm tra phát hành chạy các lane transport Matrix và Telegram live với nhà cung cấp mock xác định và các model đủ điều kiện mock (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để contract kênh được tách khỏi độ trễ model live và khởi động provider-plugin thông thường. Gateway transport live tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; kết nối nhà cung cấp được bao phủ bởi các bộ live model, nhà cung cấp native, và nhà cung cấp Docker riêng.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; cổng QA parity của nó chạy các gói ứng viên và baseline dưới dạng các job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ cho so sánh tương đương cuối cùng.

Với PR thông thường, hãy theo bằng chứng CI/check theo phạm vi thay vì coi parity là trạng thái bắt buộc.

## CodeQL

Workflow `CodeQL` có chủ ý là trình quét bảo mật lượt đầu hẹp, không phải quét toàn bộ kho lưu trữ. Các lần chạy bảo vệ hằng ngày, thủ công, và pull request không phải draft quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Bảo vệ pull request vẫn nhẹ: nó chỉ bắt đầu cho các thay đổi dưới `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src`, hoặc các đường dẫn runtime Plugin đóng gói kèm sở hữu tiến trình, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. CodeQL Android và macOS không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Đường cơ sở Auth, secrets, sandbox, Cron và Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, Gateway, Plugin SDK, secrets, các điểm chạm kiểm toán              |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt chính sách SSRF lõi, phân tích IP, bộ bảo vệ mạng, web-fetch và SSRF của Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, helper thực thi tiến trình, gửi đi ra ngoài và các cổng thực thi công cụ của tác nhân                                           |
| `/codeql-security-high/process-exec-boundary`     | Shell cục bộ, helper sinh tiến trình, runtime Plugin đóng gói sở hữu tiến trình con và phần nối script quy trình làm việc                             |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của cài đặt Plugin, loader, manifest, registry, cài đặt bằng package manager, tải nguồn và hợp đồng gói Plugin SDK |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Xây dựng ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được kiểm tra hợp lý của workflow chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Xây dựng ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc ra khỏi SARIF đã tải lên và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn thời gian chạy ngay cả khi sạch.

### Danh mục Chất lượng Nghiêm trọng

`CodeQL Critical Quality` là shard phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript phi bảo mật, mức nghiêm trọng lỗi, trên các bề mặt hẹp có giá trị cao trên runner Linux do GitHub lưu trữ để các lượt quét chất lượng không tiêu tốn ngân sách đăng ký runner Blacksmith. Cổng pull request của nó được cố ý thu nhỏ hơn hồ sơ theo lịch: PR không phải bản nháp chỉ chạy các shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` và `plugin-sdk-reply-runtime` tương ứng cho thay đổi ở mã thực thi lệnh/mô hình/công cụ của tác nhân và điều phối phản hồi, mã schema/cấu hình/di trú/IO, mã auth/secrets/sandbox/bảo mật, kênh lõi và runtime Plugin kênh đóng gói, giao thức Gateway/phương thức máy chủ, runtime bộ nhớ/phần nối SDK, MCP/tiến trình/gửi đi ra ngoài, runtime nhà cung cấp/danh mục mô hình, hàng đợi chẩn đoán phiên/gửi, loader Plugin, Plugin SDK/hợp đồng gói, hoặc runtime phản hồi Plugin SDK. Thay đổi cấu hình CodeQL và workflow chất lượng chạy toàn bộ mười hai shard chất lượng PR.

Điều phối thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các hồ sơ hẹp là hook hướng dẫn/lặp lại để chạy riêng một shard chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật Auth, secrets, sandbox, Cron và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Hợp đồng schema cấu hình, di trú, chuẩn hóa và IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đóng gói                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Hợp đồng runtime cho thực thi lệnh, điều phối mô hình/nhà cung cấp, điều phối và hàng đợi trả lời tự động, cùng mặt phẳng điều khiển ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, helper giám sát tiến trình và hợp đồng gửi đi ra ngoài                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, phần nối kích hoạt runtime bộ nhớ và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi phản hồi, hàng đợi gửi phiên, helper gắn kết/gửi phiên đi ra ngoài, bề mặt gói sự kiện/log chẩn đoán và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối phản hồi đến Plugin SDK, helper payload/chia khúc/runtime phản hồi, tùy chọn phản hồi kênh, hàng đợi gửi và helper gắn kết phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục mô hình, auth và khám phá nhà cung cấp, đăng ký runtime nhà cung cấp, mặc định/danh mục nhà cung cấp và registry web/tìm kiếm/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap Control UI, lưu bền cục bộ, luồng điều khiển Gateway và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime fetch/tìm kiếm web lõi, IO media, hiểu media, tạo ảnh và tạo media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng entrypoint của loader, registry, bề mặt công khai và Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Nguồn Plugin SDK phía gói đã phát hành và helper hợp đồng gói plugin                                                                                      |

Chất lượng được tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin đóng gói chỉ nên được thêm lại dưới dạng công việc tiếp nối có phạm vi hoặc được chia shard sau khi các hồ sơ hẹp có thời gian chạy và tín hiệu ổn định.

## Workflow bảo trì

### Tác nhân tài liệu

Workflow `Docs Agent` là một lane bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được hợp nhất. Nó không có lịch thuần túy: một lượt CI push không phải bot thành công trên `main` có thể kích hoạt nó, và điều phối thủ công có thể chạy trực tiếp. Các lần gọi workflow-run sẽ bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác được tạo trong giờ vừa qua. Khi chạy, nó xem xét khoảng commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, nên một lượt chạy theo giờ có thể bao phủ toàn bộ thay đổi trên main tích lũy từ lần rà tài liệu gần nhất.

### Tác nhân Hiệu năng Kiểm thử

Workflow `Test Performance Agent` là một lane bảo trì Codex theo sự kiện cho các kiểm thử chậm. Nó không có lịch thuần túy: một lượt CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Điều phối thủ công bỏ qua cổng hoạt động hằng ngày đó. Lane này xây dựng báo cáo hiệu năng Vitest toàn bộ bộ kiểm thử theo nhóm, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ nguyên độ bao phủ thay vì các refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối thay đổi làm giảm số lượng kiểm thử nền tảng đang pass. Báo cáo theo nhóm ghi thời gian thực và RSS tối đa theo từng cấu hình trên Linux và macOS, nên so sánh trước/sau làm nổi bật chênh lệch bộ nhớ kiểm thử bên cạnh chênh lệch thời lượng. Nếu baseline có kiểm thử thất bại, Codex chỉ được sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau tác nhân phải pass trước khi bất cứ thứ gì được commit. Khi `main` tiến lên trước khi lượt push của bot được đưa lên, lane này rebase bản vá đã xác thực, chạy lại `pnpm check:changed` và thử push lại; các bản vá cũ xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub lưu trữ để action Codex có thể giữ cùng tư thế an toàn drop-sudo như tác nhân tài liệu.

### PR trùng lặp sau khi merge

Workflow `Duplicate PRs After Merge` là workflow thủ công cho maintainer để dọn dẹp trùng lặp sau khi land. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh PR đã land đã được merge và mỗi bản trùng lặp có issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck production lõi và kiểm thử lõi cùng lint/guard lõi;
- thay đổi chỉ ở kiểm thử lõi chỉ chạy typecheck kiểm thử lõi cùng lint lõi;
- thay đổi production extension chạy typecheck production extension và kiểm thử extension cùng lint extension;
- thay đổi chỉ ở kiểm thử extension chạy typecheck kiểm thử extension cùng lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (các lượt quét Vitest extension vẫn là công việc kiểm thử rõ ràng);
- bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- thay đổi gốc/cấu hình không xác định fail an toàn sang toàn bộ lane kiểm tra.

Định tuyến kiểm thử thay đổi cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý rẻ hơn `check:changed`: chỉnh sửa kiểm thử trực tiếp tự chạy chính chúng, chỉnh sửa nguồn ưu tiên ánh xạ rõ ràng, rồi đến kiểm thử cùng cấp và các phần phụ thuộc theo đồ thị import. Cấu hình gửi phòng nhóm dùng chung là một trong các ánh xạ rõ ràng: thay đổi đối với cấu hình phản hồi hiển thị trong nhóm, chế độ gửi phản hồi nguồn hoặc prompt hệ thống của message-tool sẽ định tuyến qua các kiểm thử phản hồi lõi cùng hồi quy gửi Discord và Slack để thay đổi mặc định dùng chung thất bại trước lượt push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness khiến tập ánh xạ rẻ không còn là đại diện đáng tin cậy.

## Xác thực Testbox

Crabbox là wrapper remote-box do repo sở hữu để cung cấp bằng chứng Linux cho maintainer. Dùng nó
từ gốc repo khi một lần kiểm tra quá rộng cho vòng lặp chỉnh sửa cục bộ, khi cần
tương đồng với CI, hoặc khi bằng chứng cần secrets, Docker, các lane package,
box tái sử dụng, hoặc log từ xa. Backend OpenClaw thông thường là
`blacksmith-testbox`; dung lượng AWS/Hetzner sở hữu là phương án dự phòng khi Blacksmith
ngừng hoạt động, gặp vấn đề quota, hoặc cần kiểm thử rõ ràng trên dung lượng sở hữu.

Các lần chạy Blacksmith dựa trên Crabbox sẽ làm ấm, claim, sync, chạy, báo cáo và dọn dẹp
các Testbox dùng một lần. Kiểm tra sanity sync tích hợp sẽ fail nhanh khi các tệp gốc
bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short`
hiển thị ít nhất 200 lượt xóa tệp đã được theo dõi. Với các PR cố ý xóa số lượng lớn, đặt
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lệnh từ xa.

Crabbox cũng kết thúc một lần gọi Blacksmith CLI cục bộ nếu nó ở lại
giai đoạn sync quá năm phút mà không có đầu ra sau sync. Đặt
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` để tắt guard đó, hoặc dùng một
giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Trước lần chạy đầu tiên, kiểm tra wrapper từ gốc repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Wrapper của repo từ chối binary Crabbox cũ không quảng bá `blacksmith-testbox`. Truyền provider rõ ràng dù `.crabbox.yaml` có mặc định owned-cloud. Trong worktree Codex hoặc checkout linked/sparse, tránh script `pnpm crabbox:run` cục bộ vì pnpm có thể đối chiếu lại dependency trước khi Crabbox khởi động; thay vào đó hãy gọi trực tiếp node wrapper:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Các lần chạy dựa trên Blacksmith yêu cầu Crabbox 0.22.0 trở lên để wrapper nhận được hành vi sync, queue và cleanup Testbox hiện tại. Khi dùng checkout sibling, build lại binary cục bộ bị ignore trước khi làm công việc đo thời gian hoặc bằng chứng:

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
`syncDelegated`, `exitCode`, `commandMs`, và `totalMs`. Với các lần chạy
Blacksmith Testbox được ủy quyền, exit code của wrapper Crabbox và phần tóm tắt JSON là
kết quả lệnh. Lần chạy GitHub Actions được liên kết sở hữu việc hydration và keepalive; nó
có thể kết thúc là `cancelled` khi Testbox bị dừng từ bên ngoài sau khi lệnh SSH
đã trả về. Xem đó là artifact cleanup/trạng thái trừ khi
`exitCode` của wrapper khác không hoặc đầu ra lệnh cho thấy kiểm thử thất bại.
Các lần chạy Crabbox dùng một lần dựa trên Blacksmith nên tự động dừng Testbox;
nếu một lần chạy bị gián đoạn hoặc việc cleanup không rõ ràng, kiểm tra các box live và chỉ dừng
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
Blacksmith cho chẩn đoán như `list`, `status`, và cleanup. Sửa
đường dẫn Crabbox trước khi xem một lần chạy Blacksmith trực tiếp là bằng chứng maintainer.

Nếu `blacksmith testbox list --all` và `blacksmith testbox status` hoạt động nhưng các
warmup mới nằm ở trạng thái `queued` mà không có IP hoặc URL lần chạy Actions sau vài phút,
hãy xem đó là áp lực provider, queue, billing hoặc giới hạn org của Blacksmith. Dừng các
id đang queue mà bạn đã tạo, tránh khởi động thêm Testbox, và chuyển bằng chứng sang
đường dẫn dung lượng Crabbox sở hữu bên dưới trong khi có người kiểm tra dashboard,
billing và giới hạn org của Blacksmith.

Chỉ leo thang sang dung lượng Crabbox sở hữu khi Blacksmith ngừng hoạt động, bị giới hạn quota, thiếu môi trường cần thiết, hoặc dung lượng sở hữu là mục tiêu rõ ràng:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Khi AWS chịu áp lực, tránh `class=beast` trừ khi tác vụ thật sự cần CPU cấp 48xlarge. Một yêu cầu `beast` bắt đầu ở 192 vCPU và là cách dễ nhất để chạm quota EC2 Spot hoặc On-Demand Standard theo vùng. `.crabbox.yaml` do repo sở hữu mặc định dùng `standard`, nhiều vùng dung lượng, và `capacity.hints: true` để các lease AWS qua broker in ra vùng/market đã chọn, áp lực quota, fallback Spot và cảnh báo class áp lực cao. Dùng `fast` cho các kiểm tra rộng nặng hơn, `large` chỉ sau khi standard/fast không đủ, và `beast` chỉ cho các lane ràng buộc CPU đặc biệt như full-suite hoặc ma trận Docker toàn bộ Plugin, xác thực release/blocker rõ ràng, hoặc profiling hiệu năng nhiều core. Không dùng `beast` cho `pnpm check:changed`, kiểm thử tập trung, công việc chỉ liên quan đến tài liệu, lint/typecheck thông thường, repro E2E nhỏ, hoặc triage sự cố Blacksmith. Dùng `--market on-demand` để chẩn đoán dung lượng nhằm tránh trộn nhiễu biến động thị trường Spot vào tín hiệu.

`.crabbox.yaml` sở hữu mặc định provider, sync và GitHub Actions hydration cho các lane owned-cloud. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa của chính nó thay vì sync remote và object store cục bộ của maintainer, đồng thời loại trừ các artifact runtime/build cục bộ không bao giờ nên được chuyển. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và bàn giao môi trường không chứa secret cho các lệnh owned-cloud `crabbox run --id <cbx_id>`.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
