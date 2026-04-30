---
read_when:
    - Bạn cần hiểu lý do một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một lượt kiểm tra GitHub Actions không thành công
    - Bạn đang điều phối một lượt chạy hoặc chạy lại xác thực bản phát hành
summary: Đồ thị công việc CI, các cổng phạm vi, nhóm bao quát phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-04-30T09:34:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9c18f0801864ca1030aac9ea81117b011bd7936388984a1809ce3ae6e906e62
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần push vào `main` và mọi pull request. Job `preflight` phân loại diff và tắt các lane tốn kém khi chỉ có các khu vực không liên quan thay đổi. Các lần chạy thủ công bằng `workflow_dispatch` cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho release candidate và xác thực diện rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm tra Plugin chỉ dành cho phát hành nằm trong workflow [`Plugin Prerelease`](#plugin-prerelease) riêng và chỉ chạy từ [`Full Release Validation`](#full-release-validation) hoặc một lần dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                              | Mục đích                                                                                      | Khi chạy                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ trong tài liệu, phạm vi đã thay đổi, extension đã thay đổi và xây dựng manifest CI      | Luôn chạy trên push và PR không phải draft |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm toán workflow qua `zizmor`                                        | Luôn chạy trên push và PR không phải draft |
| `security-dependency-audit`      | Kiểm toán lockfile production không cần dependency dựa trên advisory npm                             | Luôn chạy trên push và PR không phải draft |
| `security-fast`                  | Tổng hợp bắt buộc cho các job bảo mật nhanh                                                | Luôn chạy trên push và PR không phải draft |
| `check-dependencies`             | Lượt kiểm tra Knip chỉ dành cho dependency production cùng bộ bảo vệ danh sách cho phép tệp không dùng                    | Thay đổi liên quan đến Node              |
| `build-artifacts`                | Build `dist/`, Control UI, kiểm tra artifact đã build và artifact downstream có thể tái sử dụng          | Thay đổi liên quan đến Node              |
| `checks-fast-core`               | Các lane kiểm tra đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                 | Thay đổi liên quan đến Node              |
| `checks-fast-contracts-channels` | Kiểm tra contract channel được chia shard với kết quả kiểm tra tổng hợp ổn định                         | Thay đổi liên quan đến Node              |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ lane channel, bundled, contract và extension             | Thay đổi liên quan đến Node              |
| `check`                          | Tương đương cổng local chính được chia shard: kiểu production, lint, guard, kiểu test và smoke nghiêm ngặt   | Thay đổi liên quan đến Node              |
| `check-additional`               | Các shard kiến trúc, boundary, guard bề mặt extension, package-boundary và gateway-watch | Thay đổi liên quan đến Node              |
| `build-smoke`                    | Kiểm thử smoke CLI đã build và smoke bộ nhớ khởi động                                               | Thay đổi liên quan đến Node              |
| `checks`                         | Bộ xác minh cho kiểm thử channel artifact đã build                                                    | Thay đổi liên quan đến Node              |
| `checks-node-compat-node22`      | Lane build và smoke tương thích Node 22                                                   | Dispatch CI thủ công cho phát hành    |
| `check-docs`                     | Định dạng tài liệu, lint và kiểm tra liên kết hỏng                                                | Tài liệu thay đổi                       |
| `skills-python`                  | Ruff + pytest cho Skills dựa trên Python                                                       | Thay đổi liên quan đến Python-skill      |
| `checks-windows`                 | Kiểm thử process/path riêng cho Windows cùng hồi quy specifier import runtime dùng chung         | Thay đổi liên quan đến Windows           |
| `macos-node`                     | Lane kiểm thử TypeScript trên macOS dùng artifact đã build dùng chung                                  | Thay đổi liên quan đến macOS             |
| `macos-swift`                    | Swift lint, build và test cho ứng dụng macOS                                               | Thay đổi liên quan đến macOS             |
| `android`                        | Kiểm thử đơn vị Android cho cả hai flavor cộng một bản build debug APK                                 | Thay đổi liên quan đến Android           |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm hằng ngày bằng Codex sau hoạt động đáng tin cậy                                    | CI main thành công hoặc dispatch thủ công |

## Thứ tự fail-fast

1. `preflight` quyết định những lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải các job độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các lane Linux nhanh để consumer downstream có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn mở rộng sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một push mới hơn được đưa lên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` để vẫn báo cáo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa đồng thời CI tự động được version hóa (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy thủ công toàn bộ bộ kiểm thử dùng `CI-manual-v1-*` và không hủy các lần chạy đang tiến hành.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng tự chúng không ép build native Windows, Android hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi mã nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, một số chỉnh sửa fixture core-test rẻ được chọn và chỉnh sửa helper/test-routing contract Plugin hẹp** dùng đường dẫn manifest nhanh chỉ dành cho Node: `preflight`, bảo mật và một tác vụ `checks-fast-core` duy nhất. Đường dẫn đó bỏ qua build artifact, tương thích Node 22, contract channel, toàn bộ shard lõi, shard bundled-plugin và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp thực thi.
- **Kiểm tra Node trên Windows** được giới hạn vào wrapper process/path riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý package và các bề mặt workflow CI thực thi lane đó; mã nguồn, Plugin, install-smoke và thay đổi chỉ dành cho test không liên quan vẫn nằm trên các lane Node Linux.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không giữ runner quá mức: contract channel chạy thành ba shard có trọng số, các lane unit lõi nhỏ được ghép cặp, auto-reply chạy thành bốn worker cân bằng (với subtree reply được tách thành các shard agent-runner, dispatch và commands/state-routing), và cấu hình agentic gateway/plugin được phân bổ trên các job Node agentic chỉ dùng mã nguồn hiện có thay vì chờ artifact đã build. Các kiểm thử trình duyệt, QA, media và Plugin khác diện rộng dùng cấu hình Vitest chuyên dụng thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi lại mục timing bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với một shard đã lọc. `check-additional` giữ công việc compile/canary package-boundary cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; shard boundary guard chạy đồng thời các guard độc lập nhỏ của nó trong một job. Gateway watch, kiểm thử channel và shard support-boundary lõi chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi build Play debug APK. Flavor bên thứ ba không có source set hoặc manifest riêng; lane unit-test của nó vẫn compile flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh một job đóng gói debug APK trùng lặp trên mỗi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt Knip chỉ dành cho dependency production được pin vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh các phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được review hoặc để lại mục allowlist đã lỗi thời, đồng thời giữ lại các bề mặt Plugin động có chủ ý, generated, build, live-test và package bridge mà Knip không thể phân giải tĩnh.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI bình thường nhưng buộc mọi lane có phạm vi không phải Android bật: shard Node Linux, shard bundled-plugin, contract channel, tương thích Node 22, `check`, `check-additional`, build smoke, kiểm tra tài liệu, Python skills, Windows, macOS và Control UI i18n. Dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh prerelease Plugin, shard `agentic-plugins` chỉ dành cho phát hành, lượt quét batch extension đầy đủ và lane Docker prerelease Plugin bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với cổng release-validation được bật.

Các lần chạy thủ công dùng một nhóm đồng thời duy nhất để một bộ kiểm thử đầy đủ cho release-candidate không bị hủy bởi một lần push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép caller đáng tin cậy chạy đồ thị đó trên một nhánh, tag hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Bộ chạy                         | Công việc                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các công việc bảo mật nhanh và tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), các kiểm tra protocol/contract/bundled nhanh, kiểm tra contract kênh theo shard, các shard `check` trừ lint, các shard và tổng hợp `check-additional`, trình xác minh tổng hợp kiểm thử Node, kiểm tra tài liệu, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub lưu trữ để ma trận Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension nhẹ hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, và `check-test-types`                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Linux Node, các shard kiểm thử plugin bundled, `android`                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (nhạy với CPU đến mức 8 vCPU tốn nhiều chi phí hơn phần tiết kiệm được); các bản dựng Docker install-smoke (thời gian xếp hàng 32-vCPU tốn nhiều chi phí hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; các fork quay về dùng `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; các fork quay về dùng `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

## Lệnh tương đương cục bộ

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

`Full Release Validation` là workflow bao trùm thủ công cho việc "chạy mọi thứ trước khi phát hành." Nó nhận một nhánh, tag hoặc SHA commit đầy đủ, dispatch workflow `CI` thủ công với mục tiêu đó, dispatch `Plugin Prerelease` cho bằng chứng chỉ dành cho phát hành về plugin/package/static/Docker, và dispatch `OpenClaw Release Checks` cho install smoke, package acceptance, các bộ kiểm thử đường dẫn phát hành Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix và các lane Telegram. Nó cũng có thể chạy workflow hậu xuất bản `NPM Telegram Beta E2E` khi một thông số gói đã xuất bản được cung cấp.

`release_profile` kiểm soát độ rộng live/provider được truyền vào release checks:

- `minimum` giữ các lane OpenAI/core nhanh nhất và trọng yếu cho phát hành.
- `stable` thêm tập provider/backend ổn định.
- `full` chạy ma trận provider/media tư vấn rộng.

Workflow bao trùm ghi lại id của các lần chạy con đã dispatch, và công việc cuối cùng `Verify full validation` kiểm tra lại kết luận hiện tại của các lần chạy con rồi nối thêm các bảng công việc chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại công việc xác minh cha để làm mới kết quả bao trùm và bản tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều nhận `rerun_group`. Dùng `all` cho một release candidate, `ci` chỉ cho CI con đầy đủ thông thường, `release-checks` cho mọi công việc con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên workflow bao trùm. Cách này giữ phạm vi chạy lại của một hộp phát hành bị lỗi sau một bản sửa tập trung.

`OpenClaw Release Checks` dùng workflow ref đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho cả workflow Docker đường dẫn phát hành live/E2E và shard package acceptance. Điều đó giữ byte của gói nhất quán trên các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều công việc con.

## Các shard live và E2E

Công việc con live/E2E của bản phát hành giữ độ phủ rộng của `pnpm test:live` native, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một công việc nối tiếp:

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
- các shard media audio/video được tách riêng và các shard music được lọc theo provider

Cách này giữ cùng độ phủ tệp trong khi giúp các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard media live native chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được dựng bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các công việc media chỉ xác minh binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên runner Blacksmith bình thường — công việc container không phải nơi phù hợp để khởi chạy kiểm thử Docker lồng nhau.

Các shard model/backend live dựa trên Docker dùng một image dùng chung riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit đã chọn. Workflow phát hành live dựng và đẩy image đó một lần, sau đó các shard Docker live model, gateway, CLI backend, ACP bind và Codex harness chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Nếu các shard đó tự dựng lại target Docker nguồn đầy đủ một cách độc lập, lần chạy phát hành đã cấu hình sai và sẽ lãng phí thời gian thực trên các bản dựng image trùng lặp.

## Package Acceptance

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, còn package acceptance xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng thực hiện sau khi cài đặt hoặc cập nhật.

### Công việc

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256, và profile trong bản tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải artifact đó xuống, xác thực inventory tarball, chuẩn bị image Docker package-digest khi cần, và chạy các lane Docker đã chọn với gói đó thay vì đóng gói checkout của workflow. Khi một profile chọn nhiều `docker_lanes` được nhắm mục tiêu, workflow tái sử dụng chuẩn bị gói và image dùng chung một lần, rồi fan out các lane đó thành các công việc Docker nhắm mục tiêu song song với artifact duy nhất.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một thông số npm đã xuất bản.
4. `summary` làm workflow thất bại nếu phân giải gói, Docker acceptance, hoặc lane Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng mục này cho quá trình chấp nhận beta/ổn định đã phát hành.
- `source=ref` đóng gói một nhánh, thẻ, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy. Bộ phân giải lấy các nhánh/thẻ OpenClaw, xác minh commit được chọn có thể truy ngược từ lịch sử nhánh kho lưu trữ hoặc thẻ phát hành, cài đặt phụ thuộc trong một worktree tách rời, rồi đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` riêng biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy bài kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Hồ sơ bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng với `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các phần đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Hồ sơ `package` dùng phạm vi phủ Plugin ngoại tuyến để quá trình xác thực gói đã phát hành không bị chặn bởi khả năng sẵn sàng trực tiếp của ClawHub. Lane Telegram tùy chọn dùng lại artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn spec npm đã phát hành được giữ cho các lần dispatch độc lập.

Kiểm tra phát hành gọi Package Acceptance với `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'`, và `telegram_mode=mock-openai`. Các phần Docker đường dẫn phát hành bao phủ các lane package/update/plugin trùng lặp; Package Acceptance giữ bằng chứng compat kênh tích hợp sẵn theo artifact gốc, Plugin ngoại tuyến, và Telegram trên cùng tarball gói đã phân giải. Kiểm tra phát hành đa hệ điều hành vẫn bao phủ onboarding, trình cài đặt, và hành vi nền tảng đặc thù hệ điều hành; xác thực sản phẩm package/update nên bắt đầu bằng Package Acceptance. Các lane Windows packaged và installer fresh cũng xác minh rằng một gói đã cài đặt có thể import một browser-control override từ đường dẫn Windows tuyệt đối thô. Smoke agent-turn OpenAI đa hệ điều hành mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.4-mini`, để bằng chứng cài đặt và Gateway vẫn nhanh và xác định.

### Khoảng tương thích cũ

Package Acceptance có các khoảng tương thích cũ có giới hạn cho những gói đã phát hành. Các gói đến hết `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến những tệp bị bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua trường hợp con về tính bền vững `gateway install --wrapper` khi gói không cung cấp cờ đó;
- `update-channel-switch` có thể lược bỏ `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả bắt nguồn từ tarball và có thể ghi log `update.channel` đã lưu bền vững bị thiếu;
- các smoke Plugin có thể đọc vị trí install-record cũ hoặc chấp nhận thiếu tính bền vững install-record của marketplace;
- `plugin-update` có thể cho phép di trú siêu dữ liệu cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại giữ nguyên.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu mốc siêu dữ liệu build cục bộ đã được phát hành. Các gói sau đó phải thỏa mãn các hợp đồng hiện đại; cùng những điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy chấp nhận gói thất bại, hãy bắt đầu từ phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản, và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời lượng pha, và lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói thất bại hoặc các lane Docker chính xác thay vì chạy lại toàn bộ xác thực phát hành.

## Smoke cài đặt

Workflow `Install Smoke` riêng biệt dùng lại cùng script phạm vi thông qua job `preflight` riêng của nó. Nó chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho các pull request chạm tới bề mặt Docker/package, thay đổi gói/manifest Plugin tích hợp sẵn, hoặc các bề mặt core plugin/channel/gateway/Plugin SDK mà các job smoke Docker thực thi. Các thay đổi chỉ ở nguồn Plugin tích hợp sẵn, chỉnh sửa chỉ kiểm thử, và chỉnh sửa chỉ tài liệu không đặt trước worker Docker. Đường dẫn nhanh build image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI agents delete shared-workspace, chạy e2e gateway-network trong container, xác minh một build arg phần mở rộng tích hợp sẵn, và chạy hồ sơ Docker Plugin tích hợp sẵn có giới hạn dưới timeout lệnh tổng hợp 240 giây (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ cài đặt gói QR và phạm vi Docker/update của trình cài đặt cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành workflow-call, và các pull request thực sự chạm tới bề mặt installer/package/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc dùng lại một image smoke Dockerfile gốc GHCR theo target-SHA, rồi chạy cài đặt gói QR, smoke Dockerfile/gateway gốc, smoke installer/update, và Docker E2E Plugin tích hợp sẵn nhanh dưới dạng các job riêng để công việc trình cài đặt không phải chờ sau các smoke image gốc.

Các push lên `main` (bao gồm merge commit) không ép buộc đường dẫn đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi phủ đầy đủ trên một push, workflow giữ smoke Docker nhanh và để smoke cài đặt đầy đủ cho xác thực hằng đêm hoặc phát hành.

Smoke image-provider cài đặt toàn cục Bun chậm được kiểm soát riêng bởi `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn bật nó, nhưng pull request và push lên `main` thì không. Các kiểm thử Docker QR và trình cài đặt giữ các Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng sẵn một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, và build hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane installer/update/plugin-dependency;
- một image chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn image cho mỗi lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tùy chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                      |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot nhóm chính cho các lane thông thường.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot nhóm đuôi nhạy với nhà cung cấp.                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để các nhà cung cấp không điều tiết.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane đa dịch vụ đồng thời.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ giãn cách giữa các lần khởi động lane để tránh bão tạo Docker daemon; đặt `0` để không giãn cách. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Timeout dự phòng cho mỗi lane (120 phút); các lane live/tail được chọn dùng giới hạn chặt hơn. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in kế hoạch bộ lập lịch mà không chạy lane.                                                |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách lane chính xác, phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agent có thể tái hiện một lane thất bại. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể bắt đầu từ một nhóm trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Tổng hợp cục bộ preflight Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu thời lượng lane để sắp xếp dài nhất trước, và mặc định dừng lập lịch các lane trong nhóm mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` xem cần gói, loại image, image live, lane, và phạm vi thông tin xác thực nào. Sau đó `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành GitHub outputs và tóm tắt. Nó hoặc đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact gói của lần chạy hiện tại, hoặc tải xuống artifact gói từ `package_artifact_run_id`; xác thực inventory tarball; build và push image Docker E2E bare/functional GHCR được gắn thẻ theo digest gói thông qua cache lớp Docker của Blacksmith khi kế hoạch cần các lane đã cài gói; và dùng lại các input `docker_e2e_bare_image`/`docker_e2e_functional_image` đã cung cấp hoặc các image theo digest gói hiện có thay vì build lại. Các lần pull image Docker được thử lại với timeout mỗi lần thử có giới hạn 180 giây để một luồng registry/cache bị kẹt được thử lại nhanh chóng thay vì tiêu tốn phần lớn đường găng CI.

### Các phần đường dẫn phát hành

Phạm vi Docker phát hành chạy các job nhỏ hơn theo từng phần với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phần chỉ pull loại image nó cần và thực thi nhiều lane thông qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Các khối Docker của bản phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` đến `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b`, và `bundled-channels-contracts`. Khối tổng hợp `bundled-channels` vẫn khả dụng cho các lần chạy lại thủ công một lần, còn `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn là các bí danh plugin/runtime tổng hợp. Bí danh làn `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai làn trình cài đặt nhà cung cấp. Khối `bundled-channels` chạy các làn tách `bundled-channel-*` và `bundled-channel-update-*` thay vì làn tuần tự tất cả trong một `bundled-channel-deps`.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi phủ đường dẫn phát hành đầy đủ yêu cầu, và chỉ giữ một khối độc lập `openwebui` cho các lượt dispatch chỉ dành cho OpenWebUI. Các làn cập nhật kênh đi kèm thử lại một lần đối với lỗi mạng npm tạm thời.

Mỗi khối tải lên `.artifacts/docker-tests/` với nhật ký làn, thời gian chạy, `summary.json`, `failures.json`, thời gian từng pha, JSON kế hoạch của bộ lập lịch, bảng làn chậm, và các lệnh chạy lại theo từng làn. Đầu vào `docker_lanes` của workflow chạy các làn đã chọn trên các image đã chuẩn bị thay vì các job khối, giúp việc gỡ lỗi làn thất bại được giới hạn trong một job Docker có mục tiêu và chuẩn bị, tải xuống, hoặc tái sử dụng artifact gói cho lần chạy đó; nếu một làn được chọn là làn Docker live, job có mục tiêu sẽ build image kiểm thử live cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo theo từng làn bao gồm `package_artifact_run_id`, `package_artifact_name`, và các đầu vào image đã chuẩn bị khi những giá trị đó tồn tại, để một làn thất bại có thể tái sử dụng đúng gói và image từ lần chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # tải xuống artifact Docker và in các lệnh chạy lại có mục tiêu dạng kết hợp/theo từng làn
pnpm test:docker:timings <summary>   # tóm tắt làn chậm và đường găng theo pha
```

Workflow live/E2E theo lịch chạy toàn bộ bộ Docker đường dẫn phát hành hằng ngày.

## Bản phát hành trước Plugin

`Plugin Prerelease` là phạm vi phủ sản phẩm/gói tốn kém hơn, nên đây là workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một người vận hành rõ ràng. Các pull request thông thường, lượt push lên `main`, và các lượt dispatch CI thủ công độc lập không bật bộ này. Nó cân bằng các bài kiểm thử plugin đi kèm trên tám worker tiện ích mở rộng; các job shard tiện ích mở rộng đó chạy tối đa hai nhóm cấu hình plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các lô plugin nặng về import không tạo thêm job CI.

## QA Lab

QA Lab có các làn CI chuyên dụng nằm ngoài workflow chính có phạm vi thông minh.

- Workflow `Parity gate` chạy trên các thay đổi PR khớp và dispatch thủ công; nó build runtime QA riêng tư và so sánh các gói agentic GPT-5.5 và Opus 4.6 giả lập.
- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó tỏa ra cổng parity giả lập, làn Matrix live, và các làn Telegram và Discord live dưới dạng các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các kiểm tra phát hành chạy các làn truyền tải Matrix và Telegram live với nhà cung cấp giả lập xác định và các model đủ điều kiện giả lập (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được cô lập khỏi độ trễ model live và khởi động plugin nhà cung cấp thông thường. Gateway truyền tải live tắt tìm kiếm bộ nhớ vì QA parity bao phủ riêng hành vi bộ nhớ; kết nối nhà cung cấp được bao phủ bởi các bộ model live, nhà cung cấp native, và nhà cung cấp Docker riêng biệt.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ nó. Mặc định CLI và đầu vào workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn chia nhỏ phạm vi phủ Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các làn QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; cổng QA parity của nó chạy các gói ứng viên và baseline dưới dạng các job làn song song, rồi tải xuống cả hai artifact vào một job báo cáo nhỏ cho phép so sánh parity cuối cùng.

Không đặt đường dẫn landing PR sau `Parity gate` trừ khi thay đổi thực sự chạm tới runtime QA, parity gói model, hoặc một bề mặt do workflow parity sở hữu. Với các bản sửa kênh, cấu hình, tài liệu, hoặc kiểm thử đơn vị thông thường, hãy xem đó là tín hiệu tùy chọn và đi theo bằng chứng CI/kiểm tra có phạm vi.

## CodeQL

Workflow `CodeQL` cố ý là trình quét bảo mật lượt đầu có phạm vi hẹp, không phải quét toàn bộ kho lưu trữ. Các lần chạy bảo vệ hằng ngày, thủ công, và pull request không phải draft quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng các truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Bảo vệ pull request vẫn nhẹ: nó chỉ khởi động cho các thay đổi dưới `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. CodeQL Android và macOS không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Xác thực, secret, sandbox, cron, và baseline gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cùng runtime plugin kênh, Gateway, Plugin SDK, secret, các điểm chạm kiểm toán                 |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt SSRF lõi, phân tích IP, bảo vệ mạng, web-fetch, và chính sách SSRF của Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, helper thực thi tiến trình, phân phối gửi ra ngoài, và cổng thực thi công cụ của agent                                              |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của cài đặt Plugin, loader, manifest, registry, staging phụ thuộc runtime, tải nguồn, và hợp đồng gói Plugin SDK |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF được tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn thời gian chạy ngay cả khi sạch.

### Danh mục Chất lượng Nghiêm trọng

`CodeQL Critical Quality` là shard không liên quan đến bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không bảo mật, mức độ lỗi, trên các bề mặt hẹp có giá trị cao trên runner Blacksmith Linux nhỏ hơn. Bảo vệ pull request của nó cố ý nhỏ hơn profile theo lịch: các PR không phải draft chỉ chạy các shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` tương ứng cho mã thực thi lệnh/model/công cụ của agent và dispatch phản hồi, mã schema/cấu hình/di trú/IO, mã auth/secret/sandbox/bảo mật, runtime kênh lõi và plugin kênh đi kèm, giao thức Gateway/phương thức máy chủ, runtime bộ nhớ/glue SDK, MCP/tiến trình/phân phối gửi ra ngoài, runtime nhà cung cấp/danh mục model, chẩn đoán phiên/hàng đợi phân phối, loader plugin, hợp đồng Plugin SDK/gói, hoặc thay đổi runtime phản hồi Plugin SDK. Các thay đổi cấu hình CodeQL và workflow chất lượng chạy cả mười hai shard chất lượng PR.

Dispatch thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các profile hẹp là các hook hướng dẫn/lặp để chạy một shard chất lượng riêng lẻ.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật cho xác thực, bí mật, sandbox, Cron và Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Hợp đồng về lược đồ cấu hình, di chuyển, chuẩn hóa và IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Lược đồ giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đi kèm                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Hợp đồng runtime cho thực thi lệnh, điều phối model/provider, điều phối và hàng đợi tự động trả lời, cùng control plane ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, helper giám sát tiến trình, và hợp đồng gửi đi                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK máy chủ bộ nhớ, facade runtime bộ nhớ, bí danh SDK Plugin bộ nhớ, phần nối kích hoạt runtime bộ nhớ, và lệnh doctor bộ nhớ                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi gửi phiên, helper liên kết/gửi phiên ra ngoài, bề mặt gói sự kiện/nhật ký chẩn đoán, và hợp đồng CLI doctor phiên |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đến SDK Plugin, helper payload/chunking/runtime cho trả lời, tùy chọn trả lời kênh, hàng đợi gửi, và helper liên kết phiên/luồng             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục model, xác thực và khám phá provider, đăng ký runtime provider, mặc định/danh mục provider, và registry web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap giao diện điều khiển, lưu trữ cục bộ, luồng điều khiển Gateway, và hợp đồng runtime control plane tác vụ                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime cho web fetch/search lõi, IO media, hiểu media, tạo hình ảnh, và tạo media                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng loader, registry, bề mặt công khai, và entrypoint SDK Plugin                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Mã nguồn SDK Plugin phía gói đã phát hành và helper hợp đồng gói plugin                                                                                      |

Chất lượng được tách riêng khỏi bảo mật để các phát hiện về chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp nối có phạm vi hoặc được chia mảnh sau khi các hồ sơ hẹp đã có runtime và tín hiệu ổn định.

## Quy trình bảo trì

### Docs Agent

Quy trình `Docs Agent` là một làn bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được merge. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và dispatch thủ công có thể chạy trực tiếp. Các lần gọi workflow-run sẽ bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ trước đó. Khi chạy, nó xem xét dải commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lượt chạy hằng giờ có thể bao phủ mọi thay đổi trên main đã tích lũy kể từ lần rà soát tài liệu gần nhất.

### Test Performance Agent

Quy trình `Test Performance Agent` là một làn bảo trì Codex theo sự kiện dành cho các bài kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó sẽ bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày này. Làn này tạo báo cáo hiệu năng Vitest toàn bộ bộ kiểm thử theo nhóm, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ nguyên độ bao phủ thay vì refactor rộng, rồi chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng bài kiểm thử baseline đang pass. Nếu baseline có bài kiểm thử thất bại, Codex chỉ được sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau agent phải pass trước khi bất cứ thứ gì được commit. Khi `main` tiến lên trước khi bot push được merge, làn này rebase bản vá đã xác thực, chạy lại `pnpm check:changed`, và thử push lại; các bản vá cũ có xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub-hosted cung cấp để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi merge

Quy trình `Duplicate PRs After Merge` là một quy trình maintainer thủ công để dọn dẹp trùng lặp sau khi merge. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã landed đã được merge và mỗi bản trùng lặp có issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- các thay đổi production lõi chạy typecheck prod lõi và test lõi cộng với lint/guard lõi;
- các thay đổi chỉ dành cho test lõi chỉ chạy typecheck test lõi cộng với lint lõi;
- các thay đổi production extension chạy typecheck prod extension và test extension cộng với lint extension;
- các thay đổi chỉ dành cho test extension chạy typecheck test extension cộng với lint extension;
- các thay đổi SDK Plugin công khai hoặc hợp đồng plugin mở rộng sang typecheck extension vì extensions phụ thuộc vào các hợp đồng lõi đó (các đợt quét Vitest extension vẫn là công việc kiểm thử rõ ràng);
- các bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc root có mục tiêu;
- các thay đổi root/cấu hình không xác định fail safe sang tất cả làn kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý nhẹ hơn `check:changed`: các chỉnh sửa test trực tiếp tự chạy chính chúng, chỉnh sửa source ưu tiên ánh xạ rõ ràng, rồi đến test anh em và các phần phụ thuộc theo import-graph. Cấu hình gửi group-room dùng chung là một trong các ánh xạ rõ ràng: thay đổi đối với cấu hình trả lời hiển thị trong nhóm, chế độ gửi trả lời nguồn, hoặc prompt hệ thống của message-tool sẽ đi qua các test trả lời lõi cộng với các hồi quy gửi Discord và Slack để một thay đổi mặc định dùng chung thất bại trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập ánh xạ rẻ không phải là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ root repo và ưu tiên một box mới đã được warm cho bằng chứng rộng. Trước khi dùng một cổng chậm trên một box đã được tái sử dụng, hết hạn, hoặc vừa báo cáo một lượt đồng bộ lớn bất ngờ, hãy chạy `pnpm testbox:sanity` bên trong box trước.

Kiểm tra sanity thất bại nhanh khi các file root bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 file đã theo dõi bị xóa. Điều đó thường có nghĩa trạng thái đồng bộ từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng box đó và warm một box mới thay vì gỡ lỗi thất bại test sản phẩm. Với các PR xóa lớn có chủ ý, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng kết thúc một lần gọi Blacksmith CLI cục bộ nếu nó ở trong giai đoạn đồng bộ quá năm phút mà không có output sau đồng bộ. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để vô hiệu hóa guard đó, hoặc dùng một giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
