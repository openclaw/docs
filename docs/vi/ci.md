---
read_when:
    - Bạn cần hiểu lý do một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions không thành công
    - Bạn đang điều phối một lượt chạy hoặc chạy lại xác thực bản phát hành
summary: Sơ đồ công việc CI, các cổng theo phạm vi, các nhóm bao quát phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-04-30T18:38:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: a24afc27606ac7f4e9ead89acdd319bffa23336610f8a6cd8b576ea1a5b233dd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần push vào `main` và mọi pull request. Job `preflight` phân loại diff và tắt các lane tốn kém khi chỉ những khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho các release candidate và kiểm định rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong workflow [`Plugin Tiền phát hành`](#plugin-prerelease) riêng và chỉ chạy từ [`Kiểm định Bản phát hành Đầy đủ`](#full-release-validation) hoặc một dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                              | Mục đích                                                                                     | Khi chạy                            |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ ở docs, phạm vi đã thay đổi, plugin đã thay đổi, và xây dựng manifest CI | Luôn chạy trên push và PR không phải draft |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm toán workflow qua `zizmor`                                   | Luôn chạy trên push và PR không phải draft |
| `security-dependency-audit`      | Kiểm toán lockfile production không cần dependency theo advisory của npm                      | Luôn chạy trên push và PR không phải draft |
| `security-fast`                  | Tổng hợp bắt buộc cho các job bảo mật nhanh                                                  | Luôn chạy trên push và PR không phải draft |
| `check-dependencies`             | Lượt kiểm tra Knip chỉ dành cho dependency production cộng với guard allowlist tệp không dùng | Thay đổi liên quan đến Node         |
| `build-artifacts`                | Build `dist/`, Control UI, kiểm tra artifact đã build, và artifact dùng lại cho downstream    | Thay đổi liên quan đến Node         |
| `checks-fast-core`               | Các lane tính đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol         | Thay đổi liên quan đến Node         |
| `checks-fast-contracts-channels` | Kiểm tra contract channel theo shard với kết quả kiểm tra tổng hợp ổn định                   | Thay đổi liên quan đến Node         |
| `checks-node-core-test`          | Các shard test Node lõi, loại trừ lane channel, bundled, contract, và plugin                 | Thay đổi liên quan đến Node         |
| `check`                          | Tương đương gate cục bộ chính theo shard: type prod, lint, guard, type test, và smoke nghiêm ngặt | Thay đổi liên quan đến Node         |
| `check-additional`               | Các shard architecture, boundary, guard bề mặt plugin, package-boundary, và gateway-watch     | Thay đổi liên quan đến Node         |
| `build-smoke`                    | Smoke test CLI đã build và smoke bộ nhớ khởi động                                            | Thay đổi liên quan đến Node         |
| `checks`                         | Bộ xác minh cho các test channel artifact đã build                                           | Thay đổi liên quan đến Node         |
| `checks-node-compat-node22`      | Lane build và smoke tương thích Node 22                                                      | Dispatch CI thủ công cho phát hành  |
| `check-docs`                     | Định dạng docs, lint, và kiểm tra link hỏng                                                  | Docs thay đổi                       |
| `skills-python`                  | Ruff + pytest cho skills dựa trên Python                                                     | Thay đổi liên quan đến skill Python |
| `checks-windows`                 | Test process/path riêng cho Windows cộng với hồi quy shared runtime import specifier         | Thay đổi liên quan đến Windows      |
| `macos-node`                     | Lane test TypeScript macOS dùng các artifact đã build dùng chung                             | Thay đổi liên quan đến macOS        |
| `macos-swift`                    | Swift lint, build, và test cho ứng dụng macOS                                                | Thay đổi liên quan đến macOS        |
| `android`                        | Unit test Android cho cả hai flavor cộng với một bản build debug APK                         | Thay đổi liên quan đến Android      |
| `test-performance-agent`         | Tối ưu hóa test chậm hằng ngày bằng Codex sau hoạt động tin cậy                              | CI main thành công hoặc dispatch thủ công |

## Thứ tự fail-fast

1. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các lane Linux nhanh để downstream consumer có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn mở rộng sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi có push mới hơn vào cùng PR hoặc ref `main`. Hãy coi đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` để vẫn báo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa concurrency CI tự động được đánh phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô hạn các lần chạy main mới hơn. Các lần chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang tiến hành.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi unit test trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến manifest preflight hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị CI Node cộng với lint workflow, nhưng tự chúng không ép build native Windows, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi mã nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, chỉnh sửa fixture core-test rẻ được chọn, và chỉnh sửa helper/test-routing contract Plugin hẹp** dùng đường dẫn manifest nhanh chỉ dành cho Node: `preflight`, bảo mật, và một task `checks-fast-core` duy nhất. Đường dẫn đó bỏ qua build artifact, tương thích Node 22, contract channel, shard lõi đầy đủ, shard bundled-plugin, và ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà task nhanh trực tiếp thực thi.
- **Kiểm tra Node Windows** được giới hạn ở wrapper process/path riêng cho Windows, helper runner npm/pnpm/UI, cấu hình package manager, và các bề mặt workflow CI thực thi lane đó; các thay đổi mã nguồn, Plugin, install-smoke, và chỉ test không liên quan vẫn ở các lane Node Linux.

Các họ test Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không giữ runner quá mức: contract channel chạy dưới dạng ba shard có trọng số, các lane unit lõi nhỏ được ghép đôi, auto-reply chạy dưới dạng bốn worker cân bằng (với subtree reply được tách thành các shard agent-runner, dispatch, và commands/state-routing), và cấu hình gateway/Plugin có tính agentic được phân bổ trên các job Node agentic chỉ nguồn hiện có thay vì chờ artifact đã build. Các test trình duyệt rộng, QA, media, và Plugin linh tinh dùng cấu hình Vitest chuyên dụng của chúng thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi mục timing bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt cả một cấu hình với một shard đã lọc. `check-additional` giữ công việc compile/canary package-boundary cùng nhau và tách architecture topology runtime khỏi phạm vi gateway watch; shard guard boundary chạy các guard độc lập nhỏ của nó đồng thời trong một job. Gateway watch, test channel, và shard support-boundary lõi chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi build Play debug APK. Flavor bên thứ ba không có source set hoặc manifest riêng; lane unit-test của nó vẫn compile flavor với các cờ BuildConfig SMS/call-log, trong khi tránh job đóng gói debug APK trùng lặp trên mỗi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt kiểm tra Knip chỉ dành cho dependency production được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng thất bại khi một PR thêm tệp không dùng mới chưa được review hoặc để lại mục allowlist lỗi thời, trong khi vẫn giữ các bề mặt Plugin động có chủ ý, được tạo sinh, build, live-test, và cầu nối package mà Knip không thể phân giải tĩnh.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI bình thường nhưng ép mọi lane có phạm vi không phải Android bật: shard Linux Node, shard bundled-plugin, contract channel, tương thích Node 22, `check`, `check-additional`, build smoke, kiểm tra docs, Python skills, Windows, macOS, và Control UI i18n. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh Plugin prerelease, shard `agentic-plugins` chỉ dành cho phát hành, lượt quét batch Plugin đầy đủ, và các lane Docker Plugin prerelease bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng với gate release-validation được bật.

Các lần chạy thủ công dùng một nhóm concurrency duy nhất để full suite release-candidate không bị hủy bởi một lần chạy push hoặc PR khác trên cùng ref. Input `target_ref` tùy chọn cho phép caller đáng tin cậy chạy đồ thị đó trên một branch, tag, hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Trình chạy                       | Công việc                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, các công việc bảo mật nhanh và các tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), các kiểm tra nhanh về giao thức/hợp đồng/đóng gói sẵn, các kiểm tra hợp đồng kênh được chia shard, các shard `check` ngoại trừ lint, các shard và tổng hợp `check-additional`, các bộ xác minh tổng hợp kiểm thử Node, kiểm tra tài liệu, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub lưu trữ để ma trận Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard Plugin có trọng lượng thấp hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, và `check-test-types`                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Node trên Linux, các shard kiểm thử Plugin đóng gói sẵn, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (đủ nhạy với CPU đến mức 8 vCPU tốn nhiều hơn phần tiết kiệm được); các bản dựng Docker install-smoke (thời gian xếp hàng 32-vCPU tốn nhiều hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; các fork quay về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; các fork quay về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                                    |

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

`Full Release Validation` là workflow bao trùm thủ công cho việc "chạy mọi thứ trước khi phát hành." Nó chấp nhận một nhánh, thẻ hoặc SHA commit đầy đủ, dispatch workflow `CI` thủ công với đích đó, dispatch `Plugin Prerelease` cho bằng chứng chỉ dành cho phát hành về Plugin/gói/tĩnh/Docker, và dispatch `OpenClaw Release Checks` cho kiểm tra cài đặt, chấp nhận gói, các bộ kiểm thử đường dẫn phát hành Docker, live/E2E, OpenWebUI, tương đồng QA Lab, Matrix và các làn Telegram. Nó cũng có thể chạy workflow `NPM Telegram Beta E2E` sau phát hành khi có thông số gói đã phát hành được cung cấp.

`release_profile` kiểm soát phạm vi live/nhà cung cấp được truyền vào kiểm tra phát hành:

- `minimum` giữ các làn OpenAI/lõi quan trọng với phát hành nhanh nhất.
- `stable` thêm tập nhà cung cấp/backend ổn định.
- `full` chạy ma trận nhà cung cấp/phương tiện tư vấn rộng.

Workflow bao trùm ghi lại các id lần chạy con đã dispatch, và công việc `Verify full validation` cuối cùng kiểm tra lại kết luận hiện tại của các lần chạy con rồi thêm các bảng công việc chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại công việc xác minh cha để làm mới kết quả bao trùm và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho phần con CI đầy đủ thông thường, `release-checks` cho mọi phần con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên workflow bao trùm. Cách này giữ việc chạy lại hộp phát hành bị lỗi trong phạm vi giới hạn sau một bản sửa tập trung.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho cả workflow Docker live/E2E theo đường dẫn phát hành và shard chấp nhận gói. Điều đó giữ byte của gói nhất quán trên các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều công việc con.

## Các shard Live và E2E

Phần con live/E2E của phát hành giữ phạm vi bao phủ `pnpm test:live` gốc rộng, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một công việc tuần tự:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- các công việc `native-live-src-gateway-profiles` được lọc theo nhà cung cấp
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- các shard phương tiện âm thanh/video được tách riêng và các shard nhạc được lọc theo nhà cung cấp

Cách này giữ nguyên phạm vi bao phủ tệp trong khi giúp các lỗi nhà cung cấp live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard phương tiện live gốc chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được xây dựng bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các công việc phương tiện chỉ xác minh các binary trước khi thiết lập. Giữ các bộ kiểm thử live dựa trên Docker trên các runner Blacksmith thông thường - công việc container không phải là nơi phù hợp để khởi chạy kiểm thử Docker lồng nhau.

Các shard live model/backend dựa trên Docker dùng một image dùng chung riêng `ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit đã chọn. Workflow phát hành live xây dựng và đẩy image đó một lần, sau đó các shard Docker live model, Gateway, CLI backend, ACP bind và Codex harness chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Nếu các shard đó tự xây dựng lại đích Docker nguồn đầy đủ, lần chạy phát hành bị cấu hình sai và sẽ lãng phí thời gian thực trên các bản dựng image trùng lặp.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, còn chấp nhận gói xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng thực hiện sau khi cài đặt hoặc cập nhật.

### Công việc

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên làm artifact `package-under-test`, và in nguồn, ref workflow, ref gói, phiên bản, SHA-256, và hồ sơ trong tóm tắt bước GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải xuống artifact đó, xác thực danh mục tarball, chuẩn bị các image Docker package-digest khi cần, và chạy các làn Docker đã chọn trên gói đó thay vì đóng gói checkout workflow. Khi một hồ sơ chọn nhiều `docker_lanes` có mục tiêu, workflow tái sử dụng chuẩn bị gói và image dùng chung một lần, rồi tỏa các làn đó ra thành các công việc Docker có mục tiêu chạy song song với artifact riêng.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một thông số npm đã phát hành.
4. `summary` làm workflow thất bại nếu phân giải gói, chấp nhận Docker, hoặc làn Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng tùy chọn này cho việc chấp nhận bản beta/ổn định đã xuất bản.
- `source=ref` đóng gói một nhánh, thẻ hoặc SHA commit đầy đủ đáng tin cậy của `package_ref`. Bộ phân giải tìm nạp các nhánh/thẻ OpenClaw, xác minh commit được chọn có thể truy cập từ lịch sử nhánh kho lưu trữ hoặc thẻ phát hành, cài đặt các phần phụ thuộc trong một worktree tách rời, rồi đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một tệp HTTPS `.tgz`; bắt buộc phải có `package_sha256`.
- `source=artifact` tải xuống một tệp `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Hồ sơ bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng thêm `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các phần release-path Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Hồ sơ `package` dùng phạm vi kiểm thử Plugin ngoại tuyến để việc xác thực gói đã xuất bản không bị phụ thuộc vào tính khả dụng trực tiếp của ClawHub. Lane Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn đặc tả npm đã xuất bản được giữ cho các lần dispatch độc lập.

Các kiểm tra phát hành gọi Package Acceptance với `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'`, và `telegram_mode=mock-openai`. Các phần Docker release-path bao phủ các lane package/update/plugin chồng lắp; Package Acceptance giữ bằng chứng compat bundled-channel gốc theo artifact, Plugin ngoại tuyến và Telegram trên cùng tarball gói đã phân giải. Các kiểm tra phát hành cross-OS vẫn bao phủ hành vi onboarding, trình cài đặt và nền tảng dành riêng cho từng hệ điều hành; xác thực sản phẩm package/update nên bắt đầu với Package Acceptance. Các lane Windows packaged và installer fresh cũng xác minh rằng một gói đã cài đặt có thể import một override browser-control từ một đường dẫn Windows tuyệt đối thô. Smoke agent-turn cross-OS của OpenAI mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.4-mini`, để bằng chứng cài đặt và Gateway vẫn nhanh và xác định.

### Khoảng tương thích cũ

Package Acceptance có các khoảng tương thích cũ có giới hạn cho các gói đã được xuất bản. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các tệp bị lược khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase lưu bền `gateway install --wrapper` khi gói không cung cấp cờ đó;
- `update-channel-switch` có thể cắt bỏ các `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả được tạo từ tarball và có thể ghi log thiếu `update.channel` đã lưu bền;
- các smoke Plugin có thể đọc các vị trí install-record cũ hoặc chấp nhận thiếu lưu bền install-record marketplace;
- `plugin-update` có thể cho phép di chuyển siêu dữ liệu cấu hình trong khi vẫn yêu cầu install record và hành vi không cài đặt lại không đổi.

Gói `2026.4.26` đã xuất bản cũng có thể cảnh báo về các tệp dấu siêu dữ liệu bản dựng cục bộ đã được phát hành. Các gói về sau phải đáp ứng các hợp đồng hiện đại; cùng các điều kiện đó sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy package acceptance thất bại, hãy bắt đầu từ phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log lane, thời gian từng pha và các lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói thất bại hoặc các lane Docker chính xác thay vì chạy lại toàn bộ xác thực phát hành.

## Smoke cài đặt

Workflow `Install Smoke` riêng biệt tái sử dụng cùng script phạm vi thông qua job `preflight` riêng. Nó chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho pull request chạm đến các bề mặt Docker/package, thay đổi package/manifest của Plugin đi kèm, hoặc các bề mặt Plugin/kênh/Gateway/Plugin SDK lõi mà các job smoke Docker thực thi. Các thay đổi Plugin đi kèm chỉ ở nguồn, chỉnh sửa chỉ kiểm thử và chỉnh sửa chỉ tài liệu không giữ trước worker Docker. Đường dẫn nhanh dựng image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI agents delete shared-workspace, chạy e2e gateway-network trong container, xác minh build arg extension đi kèm, và chạy hồ sơ Docker bundled-plugin có giới hạn dưới timeout lệnh tổng hợp 240 giây (mỗi lần chạy Docker của từng kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ phạm vi cài đặt package QR và Docker/update trình cài đặt cho các lần chạy lịch hằng đêm, dispatch thủ công, kiểm tra phát hành workflow-call và pull request thực sự chạm đến các bề mặt installer/package/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image smoke Dockerfile gốc GHCR theo target-SHA, rồi chạy cài đặt package QR, smoke Dockerfile/gateway gốc, smoke installer/update và Docker E2E bundled-plugin nhanh dưới dạng các job riêng để công việc installer không phải chờ sau các smoke image gốc.

Các lần push lên `main` (bao gồm merge commit) không bắt buộc đường dẫn đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một lần push, workflow giữ smoke Docker nhanh và để smoke cài đặt đầy đủ cho xác thực hằng đêm hoặc phát hành.

Smoke image-provider cài đặt toàn cục Bun chậm được kiểm soát riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn bật nó, nhưng pull request và các lần push lên `main` thì không. Các kiểm thử Docker QR và installer giữ các Dockerfile tập trung vào cài đặt của riêng chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng trước một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, và dựng hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các lane installer/update/plugin-dependency;
- một image chức năng cài cùng tarball đó vào `/app` cho các lane chức năng thông thường.

Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi plan đã chọn. Scheduler chọn image cho từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tùy chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                     |
| -------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số slot main-pool cho các lane thông thường.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số slot tail-pool nhạy cảm với provider.                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn lane live đồng thời để provider không throttle.                                     |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn lane cài đặt npm đồng thời.                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn lane đa dịch vụ đồng thời.                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Độ trễ giữa các lần bắt đầu lane để tránh bão tạo Docker daemon; đặt `0` để không tạo trễ.  |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Timeout dự phòng mỗi lane (120 phút); các lane live/tail được chọn dùng giới hạn chặt hơn.  |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in plan scheduler mà không chạy lane.                                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách lane chính xác phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agent có thể tái tạo một lane thất bại. |

Một lane nặng hơn giới hạn hiệu dụng của nó vẫn có thể bắt đầu từ một pool trống, rồi chạy một mình cho đến khi nhả dung lượng. Tổng hợp cục bộ preflight Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu bền thời gian lane để sắp xếp dài nhất trước, và mặc định dừng lên lịch các lane pooled mới sau lỗi đầu tiên.

### Workflow live/E2E tái sử dụng

Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` xem cần phạm vi package, loại image, image live, lane và credential nào. Sau đó `scripts/docker-e2e.mjs` chuyển plan đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact package của lần chạy hiện tại, hoặc tải xuống artifact package từ `package_artifact_run_id`; xác thực inventory tarball; dựng và push các image Docker E2E bare/functional GHCR được gắn thẻ theo package-digest thông qua cache lớp Docker của Blacksmith khi plan cần các lane đã cài package; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các image package-digest hiện có thay vì dựng lại. Các lần pull image Docker được thử lại với timeout mỗi lần thử có giới hạn 180 giây để một luồng registry/cache bị kẹt sẽ thử lại nhanh thay vì tiêu thụ phần lớn đường găng CI.

### Các phần release-path

Phạm vi Docker phát hành chạy các job chia nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phần chỉ pull loại image nó cần và thực thi nhiều lane thông qua cùng scheduler có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Các chunk Docker của bản phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` đến `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b`, và `bundled-channels-contracts`. Chunk tổng hợp `bundled-channels` vẫn khả dụng cho các lần chạy lại thủ công một lần, và `plugins-runtime-core`, `plugins-runtime`, cùng `plugins-integrations` vẫn là các bí danh Plugin/runtime tổng hợp. Bí danh lane `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai lane trình cài đặt provider. Chunk `bundled-channels` chạy các lane `bundled-channel-*` và `bundled-channel-update-*` đã tách, thay vì lane `bundled-channel-deps` nối tiếp gộp tất cả trong một.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi bao phủ đường dẫn phát hành đầy đủ yêu cầu, và chỉ giữ chunk độc lập `openwebui` cho các dispatch chỉ dành cho OpenWebUI. Các lane cập nhật kênh đi kèm thử lại một lần đối với lỗi mạng npm nhất thời.

Mỗi chunk tải lên `.artifacts/docker-tests/` cùng với nhật ký lane, thời gian chạy, `summary.json`, `failures.json`, thời gian từng pha, JSON kế hoạch bộ lập lịch, bảng lane chậm, và lệnh chạy lại cho từng lane. Input `docker_lanes` của workflow chạy các lane đã chọn trên các image đã chuẩn bị thay vì các job chunk, nhờ đó việc gỡ lỗi lane lỗi được giới hạn trong một job Docker mục tiêu và chuẩn bị, tải xuống, hoặc tái sử dụng artifact gói cho lần chạy đó; nếu một lane đã chọn là lane Docker live, job mục tiêu sẽ build image kiểm thử live cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo cho từng lane bao gồm `package_artifact_run_id`, `package_artifact_name`, và các input image đã chuẩn bị khi những giá trị đó tồn tại, để một lane lỗi có thể tái sử dụng đúng gói và image từ lần chạy lỗi.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Workflow live/E2E theo lịch chạy bộ kiểm thử Docker đầy đủ của đường dẫn phát hành hằng ngày.

## Bản phát hành trước Plugin

`Plugin Prerelease` có phạm vi bao phủ sản phẩm/gói tốn kém hơn, nên đây là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, push lên `main`, và dispatch CI thủ công độc lập không chạy bộ kiểm thử đó. Workflow này cân bằng các kiểm thử Plugin đi kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc, với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch Plugin nặng về import không tạo thêm job CI.

## Phòng kiểm thử QA

Phòng kiểm thử QA có các lane CI riêng nằm ngoài workflow scoped thông minh chính.

- Workflow `Parity gate` chạy trên các thay đổi PR khớp điều kiện và dispatch thủ công; nó build runtime QA riêng và so sánh các pack agentic GPT-5.5 và Opus 4.6 mô phỏng.
- Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó phân tán cổng parity mô phỏng, lane Matrix live, và các lane Telegram cùng Discord live thành các job song song. Các job live dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Các kiểm tra phát hành chạy các lane vận chuyển live Matrix và Telegram với provider mô phỏng xác định và các model đủ điều kiện mô phỏng (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được tách biệt khỏi độ trễ model live và quá trình khởi động Plugin provider thông thường. Gateway vận chuyển live tắt tìm kiếm bộ nhớ vì parity QA bao phủ riêng hành vi bộ nhớ; khả năng kết nối provider được bao phủ bởi các bộ kiểm thử riêng cho model live, provider native, và provider Docker.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi bao phủ Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các lane QA Lab quan trọng cho phát hành trước khi phê duyệt phát hành; cổng parity QA của nó chạy các pack ứng viên và baseline dưới dạng job lane song song, rồi tải cả hai artifact xuống một job báo cáo nhỏ để so sánh parity cuối cùng.

Không đặt đường dẫn landing PR phía sau `Parity gate` trừ khi thay đổi thực sự chạm đến runtime QA, parity model-pack, hoặc một bề mặt do workflow parity sở hữu. Với các bản sửa kênh, cấu hình, tài liệu, hoặc kiểm thử đơn vị thông thường, hãy xem đó là tín hiệu tùy chọn và làm theo bằng chứng CI/kiểm tra theo phạm vi.

## CodeQL

Workflow `CodeQL` cố ý là trình quét bảo mật lượt đầu phạm vi hẹp, không phải quét toàn bộ repository. Các lần chạy hằng ngày, thủ công, và bảo vệ pull request không phải draft quét mã workflow Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng các truy vấn bảo mật độ tin cậy cao được lọc theo `security-severity` cao/nghiêm trọng.

Bảo vệ pull request vẫn nhẹ: nó chỉ bắt đầu với các thay đổi dưới `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như workflow theo lịch. CodeQL Android và macOS không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secret, sandbox, cron, và baseline Gateway                                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Các hợp đồng triển khai kênh lõi cộng với runtime Plugin kênh, Gateway, Plugin SDK, secret, điểm chạm audit                 |
| `/codeql-security-high/network-ssrf-boundary`     | Các bề mặt SSRF lõi, phân tích IP, bảo vệ mạng, web-fetch, và chính sách SSRF Plugin SDK                                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, helper thực thi tiến trình, gửi outbound, và cổng thực thi công cụ agent                                              |
| `/codeql-security-high/plugin-trust-boundary`     | Các bề mặt tin cậy của cài đặt Plugin, loader, manifest, registry, staging dependency runtime, tải nguồn, và hợp đồng gói Plugin SDK |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build dependency ra khỏi SARIF đã tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chiếm phần lớn thời gian chạy ngay cả khi sạch.

### Danh mục Chất lượng Nghiêm trọng

`CodeQL Critical Quality` là shard phi bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không phải bảo mật, mức nghiêm trọng lỗi, trên các bề mặt giá trị cao phạm vi hẹp trên runner Blacksmith Linux nhỏ hơn. Bảo vệ pull request của nó cố ý nhỏ hơn profile theo lịch: PR không phải draft chỉ chạy các shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` tương ứng cho các thay đổi trong mã thực thi lệnh/model/công cụ agent và dispatch phản hồi, mã schema/cấu hình/migration/IO, mã auth/secret/sandbox/bảo mật, runtime Plugin kênh lõi và kênh đi kèm, protocol Gateway/server-method, runtime bộ nhớ/liên kết SDK, MCP/tiến trình/gửi outbound, runtime provider/catalog model, chẩn đoán phiên/hàng đợi gửi, loader Plugin, hợp đồng Plugin SDK/gói, hoặc runtime phản hồi Plugin SDK. Các thay đổi cấu hình CodeQL và workflow chất lượng chạy toàn bộ mười hai shard chất lượng PR.

Dispatch thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các profile hẹp là hook hướng dẫn/lặp để chạy một shard chất lượng riêng lẻ.

| Danh mục                                                | Bề mặt                                                                                                                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật cho xác thực, bí mật, sandbox, Cron và Gateway                                                                                                             |
| `/codeql-critical-quality/config-boundary`              | Hợp đồng lược đồ cấu hình, di trú, chuẩn hóa và IO                                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Lược đồ giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đi kèm                                                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Hợp đồng runtime cho thực thi lệnh, điều phối model/provider, điều phối và hàng đợi tự động trả lời, và mặt phẳng điều khiển ACP                                                |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, helper giám sát tiến trình, và hợp đồng gửi đi                                                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory host SDK, facade runtime bộ nhớ, bí danh Plugin SDK bộ nhớ, phần gắn kích hoạt runtime bộ nhớ, và lệnh doctor bộ nhớ                                                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi gửi phiên, helper liên kết/gửi phiên đi, bề mặt gói sự kiện/nhật ký chẩn đoán, và hợp đồng CLI doctor phiên                                  |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời đầu vào Plugin SDK, helper payload/chia khúc/runtime trả lời, tùy chọn trả lời kênh, hàng đợi gửi, và helper liên kết phiên/luồng                             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục model, xác thực và khám phá provider, đăng ký runtime provider, mặc định/danh mục provider, và registry web/search/fetch/embedding                           |
| `/codeql-critical-quality/ui-control-plane`             | Khởi động Control UI, lưu trữ cục bộ, luồng điều khiển Gateway, và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                                 |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime cho web fetch/search lõi, media IO, hiểu media, tạo ảnh, và tạo media                                                                                          |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng loader, registry, bề mặt công khai, và điểm vào Plugin SDK                                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Mã nguồn Plugin SDK phía gói đã xuất bản và helper hợp đồng gói Plugin                                                                                                          |

Chất lượng được tách riêng khỏi bảo mật để các phát hiện về chất lượng có thể được lên lịch, đo lường, vô hiệu hóa hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc được chia shard sau khi các hồ sơ hẹp có runtime và tín hiệu ổn định.

## Quy trình bảo trì

### Docs Agent

Quy trình `Docs Agent` là một lane bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được merge. Nó không có lịch chạy thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và thao tác dispatch thủ công có thể chạy trực tiếp. Các lượt gọi workflow-run sẽ bỏ qua khi `main` đã tiến lên hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ vừa qua. Khi chạy, nó xem xét phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, nên một lượt chạy mỗi giờ có thể bao phủ toàn bộ thay đổi trên main tích lũy kể từ lượt rà soát tài liệu gần nhất.

### Test Performance Agent

Quy trình `Test Performance Agent` là một lane bảo trì Codex theo sự kiện dành cho các kiểm thử chậm. Nó không có lịch chạy thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó sẽ bỏ qua nếu một lượt gọi workflow-run khác đã chạy hoặc đang chạy trong cùng ngày UTC đó. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày này. Lane tạo báo cáo hiệu năng Vitest toàn bộ bộ kiểm thử theo nhóm, cho phép Codex chỉ thực hiện các sửa đổi hiệu năng kiểm thử nhỏ vẫn giữ nguyên coverage thay vì refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử baseline đang pass. Nếu baseline có kiểm thử đang fail, Codex chỉ có thể sửa các lỗi hiển nhiên và báo cáo toàn bộ bộ kiểm thử sau-agent phải pass trước khi bất kỳ thứ gì được commit. Khi `main` tiến lên trước khi lượt push của bot được đưa lên, lane rebase bản vá đã xác thực, chạy lại `pnpm check:changed`, và thử push lại; các bản vá cũ xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub host để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi merge

Quy trình `Duplicate PRs After Merge` là quy trình maintainer thủ công để dọn dẹp bản trùng lặp sau khi land. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi bản trùng lặp có một issue được tham chiếu chung hoặc các hunk thay đổi chồng lấp.

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
- thay đổi production extension chạy typecheck extension prod và extension test cùng lint extension;
- thay đổi chỉ kiểm thử extension chạy typecheck extension test cùng lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng Plugin mở rộng sang typecheck extension vì các extension phụ thuộc vào những hợp đồng lõi đó (các lượt quét extension Vitest vẫn là công việc kiểm thử rõ ràng);
- bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu;
- thay đổi root/config không xác định fail safe sang mọi lane kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và được cố ý giữ rẻ hơn `check:changed`: chỉnh sửa kiểm thử trực tiếp chạy chính chúng, chỉnh sửa nguồn ưu tiên mapping rõ ràng, sau đó đến kiểm thử sibling và các phụ thuộc import-graph. Cấu hình gửi group-room dùng chung là một trong các mapping rõ ràng: thay đổi đối với cấu hình visible-reply nhóm, chế độ gửi trả lời nguồn, hoặc prompt hệ thống message-tool sẽ đi qua các kiểm thử trả lời lõi cùng regression gửi Discord và Slack để một thay đổi mặc định dùng chung fail trước lượt push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng trên toàn harness đến mức tập mapped rẻ không còn là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ root repo và ưu tiên một box mới đã được warm cho bằng chứng rộng. Trước khi dành một cổng chậm cho một box đã được tái sử dụng, hết hạn, hoặc vừa báo cáo một lượt sync lớn bất thường, hãy chạy `pnpm testbox:sanity` bên trong box trước.

Kiểm tra sanity fail nhanh khi các tệp root bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 lượt xóa tracked. Điều đó thường có nghĩa trạng thái sync từ xa không phải là bản sao đáng tin cậy của PR; hãy dừng box đó và warm một box mới thay vì gỡ lỗi thất bại kiểm thử sản phẩm. Với các PR cố ý xóa số lượng lớn, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lượt chạy sanity đó.

`pnpm testbox:run` cũng chấm dứt một lượt gọi Blacksmith CLI cục bộ nếu nó ở pha sync hơn năm phút mà không có output sau sync. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt guard đó, hoặc dùng giá trị mili giây lớn hơn cho các diff cục bộ lớn bất thường.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
