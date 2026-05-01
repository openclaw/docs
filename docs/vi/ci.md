---
read_when:
    - Bạn cần hiểu lý do một tác vụ CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi một kiểm tra GitHub Actions đang thất bại
    - Bạn đang điều phối một lượt chạy hoặc chạy lại xác thực bản phát hành
summary: Đồ thị công việc CI, các cổng kiểm theo phạm vi, các nhóm bao quát phát hành và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-05-01T10:46:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 679913539743f9495fffa010489ec95e05ce875751afa8a93bf8bf7045d6d9de
    source_path: ci.md
    workflow: 16
---

OpenClaw CI chạy trên mọi lần đẩy lên `main` và mọi pull request. Job `preflight` phân loại diff và tắt các lane tốn kém khi chỉ có những khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị cho ứng viên phát hành và xác thực diện rộng. Các lane Android vẫn là tùy chọn thông qua `include_android`. Phạm vi kiểm thử Plugin chỉ dành cho phát hành nằm trong workflow [`Plugin Prerelease`](#plugin-prerelease) riêng biệt và chỉ chạy từ [`Full Release Validation`](#full-release-validation) hoặc một dispatch thủ công rõ ràng.

## Tổng quan pipeline

| Job                              | Mục đích                                                                                      | Khi chạy                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ về docs, phạm vi thay đổi, extension thay đổi, và xây dựng CI manifest      | Luôn chạy trên các push và PR không phải bản nháp |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra workflow qua `zizmor`                                        | Luôn chạy trên các push và PR không phải bản nháp |
| `security-dependency-audit`      | Kiểm tra lockfile production không cần dependency đối chiếu với npm advisories                             | Luôn chạy trên các push và PR không phải bản nháp |
| `security-fast`                  | Tổng hợp bắt buộc cho các job bảo mật nhanh                                                | Luôn chạy trên các push và PR không phải bản nháp |
| `check-dependencies`             | Lượt kiểm tra chỉ dependency production bằng Knip cộng với guard allowlist tệp không dùng                    | Thay đổi liên quan đến Node              |
| `build-artifacts`                | Build `dist/`, Control UI, kiểm tra artifact đã build, và artifact downstream tái sử dụng được          | Thay đổi liên quan đến Node              |
| `checks-fast-core`               | Các lane đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol                 | Thay đổi liên quan đến Node              |
| `checks-fast-contracts-channels` | Kiểm tra contract channel được shard với kết quả kiểm tra tổng hợp ổn định                         | Thay đổi liên quan đến Node              |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ lane channel, bundled, contract, và extension             | Thay đổi liên quan đến Node              |
| `check`                          | Tương đương gate local chính được shard: type production, lint, guard, type kiểm thử, và smoke nghiêm ngặt   | Thay đổi liên quan đến Node              |
| `check-additional`               | Các shard kiến trúc, boundary, guard bề mặt extension, package-boundary, và gateway-watch | Thay đổi liên quan đến Node              |
| `build-smoke`                    | Kiểm thử smoke CLI đã build và smoke bộ nhớ khởi động                                               | Thay đổi liên quan đến Node              |
| `checks`                         | Bộ xác minh cho kiểm thử channel artifact đã build                                                    | Thay đổi liên quan đến Node              |
| `checks-node-compat-node22`      | Lane build và smoke tương thích Node 22                                                   | Dispatch CI thủ công cho phát hành    |
| `check-docs`                     | Kiểm tra định dạng docs, lint, và liên kết hỏng                                                | Docs thay đổi                       |
| `skills-python`                  | Ruff + pytest cho Skills dựa trên Python                                                       | Thay đổi liên quan đến Python Skill      |
| `checks-windows`                 | Kiểm thử process/path riêng cho Windows cộng với hồi quy specifier import runtime dùng chung         | Thay đổi liên quan đến Windows           |
| `macos-node`                     | Lane kiểm thử TypeScript trên macOS dùng artifact đã build dùng chung                                  | Thay đổi liên quan đến macOS             |
| `macos-swift`                    | Swift lint, build, và kiểm thử cho ứng dụng macOS                                               | Thay đổi liên quan đến macOS             |
| `android`                        | Kiểm thử unit Android cho cả hai flavor cộng với một lần build APK debug                                 | Thay đổi liên quan đến Android           |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm hằng ngày bằng Codex sau hoạt động đáng tin cậy                                    | CI chính thành công hoặc dispatch thủ công |

## Thứ tự fail-fast

1. `preflight` quyết định lane nào tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong job này, không phải job độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` fail nhanh mà không chờ các job artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các lane Linux nhanh để các consumer downstream có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn mở rộng sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một push mới hơn đến cùng PR hoặc ref `main`. Hãy coi đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng đang fail. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` để chúng vẫn báo cáo lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế. Khóa concurrency CI tự động có phiên bản (`CI-v7-*`) để một zombie phía GitHub trong nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang diễn ra.

## Phạm vi và định tuyến

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi kiểm thử unit trong `src/scripts/ci-changed-scope.test.ts`. Dispatch thủ công bỏ qua phát hiện changed-scope và khiến preflight manifest hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.

- **Chỉnh sửa workflow CI** xác thực đồ thị Node CI cộng với lint workflow, nhưng bản thân chúng không ép buộc các bản build native Windows, Android, hoặc macOS; các lane nền tảng đó vẫn được giới hạn theo thay đổi nguồn nền tảng.
- **Chỉnh sửa chỉ định tuyến CI, một số chỉnh sửa fixture kiểm thử core rẻ, và chỉnh sửa hẹp helper/test-routing contract Plugin** dùng đường dẫn manifest nhanh chỉ dành cho Node: `preflight`, bảo mật, và một task `checks-fast-core` duy nhất. Đường dẫn đó bỏ qua artifact build, tương thích Node 22, contract channel, shard core đầy đủ, shard bundled-plugin, và các ma trận guard bổ sung khi thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà task nhanh trực tiếp thực thi.
- **Kiểm tra Windows Node** được giới hạn ở các wrapper process/path riêng cho Windows, helper runner npm/pnpm/UI, cấu hình package manager, và các bề mặt workflow CI thực thi lane đó; thay đổi nguồn, Plugin, install-smoke, và chỉ kiểm thử không liên quan vẫn ở trên các lane Linux Node.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không đặt trước runner quá mức: contract channel chạy dưới dạng ba shard có trọng số, các lane unit core nhỏ được ghép cặp, auto-reply chạy dưới dạng bốn worker cân bằng (với cây con reply được tách thành các shard agent-runner, dispatch, và commands/state-routing), còn cấu hình agentic gateway/Plugin được phân bổ trên các job agentic Node chỉ nguồn hiện có thay vì chờ artifact đã build. Các kiểm thử trình duyệt, QA, media, và Plugin khác diện rộng dùng cấu hình Vitest chuyên dụng của chúng thay vì catch-all Plugin dùng chung. Các shard include-pattern ghi mục thời gian bằng tên shard CI, nên `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với một shard đã lọc. `check-additional` giữ công việc compile/canary package-boundary cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; shard boundary guard chạy đồng thời các guard độc lập nhỏ bên trong một job. Gateway watch, kiểm thử channel, và shard core support-boundary chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build.

Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest` rồi build APK debug Play. Flavor bên thứ ba không có source set hoặc manifest riêng; lane unit-test của nó vẫn compile flavor với các cờ BuildConfig SMS/call-log, đồng thời tránh job đóng gói APK debug trùng lặp trên mọi push liên quan đến Android.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies` (một lượt kiểm tra chỉ dependency production bằng Knip được ghim vào phiên bản Knip mới nhất, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`) và `pnpm deadcode:unused-files`, so sánh phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard tệp không dùng fail khi một PR thêm tệp không dùng mới chưa được review hoặc để lại mục allowlist đã lỗi thời, đồng thời bảo toàn các bề mặt Plugin động có chủ ý, generated, build, live-test, và package bridge mà Knip không thể phân giải tĩnh.

## Dispatch thủ công

Các dispatch CI thủ công chạy cùng đồ thị job như CI bình thường nhưng buộc mọi lane có phạm vi không phải Android bật: shard Linux Node, shard bundled-plugin, contract channel, tương thích Node 22, `check`, `check-additional`, build smoke, kiểm tra docs, Python Skills, Windows, macOS, và Control UI i18n. Các dispatch CI thủ công độc lập chỉ chạy Android với `include_android=true`; ô dù phát hành đầy đủ bật Android bằng cách truyền `include_android=true`. Kiểm tra tĩnh Plugin prerelease, shard `agentic-plugins` chỉ dành cho phát hành, lượt quét batch extension đầy đủ, và các lane Docker Plugin prerelease bị loại khỏi CI. Bộ Docker prerelease chỉ chạy khi `Full Release Validation` dispatch workflow `Plugin Prerelease` riêng biệt với gate release-validation được bật.

Các lần chạy thủ công dùng nhóm concurrency duy nhất để một full suite ứng viên phát hành không bị hủy bởi push hoặc PR khác trên cùng ref. Input `target_ref` tùy chọn cho phép caller đáng tin cậy chạy đồ thị đó với một nhánh, tag, hoặc SHA commit đầy đủ trong khi dùng tệp workflow từ ref dispatch đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Trình chạy                       | Công việc                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các công việc bảo mật nhanh và tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), các kiểm tra nhanh về giao thức/hợp đồng/gói sẵn, kiểm tra hợp đồng kênh được chia shard, các shard `check` ngoại trừ lint, các shard và tổng hợp `check-additional`, trình xác minh tổng hợp kiểm thử Node, kiểm tra tài liệu, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub lưu trữ để ma trận Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard Plugin có trọng số thấp hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, và `check-test-types`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Node trên Linux, các shard kiểm thử Plugin đóng gói sẵn, `android`                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (đủ nhạy với CPU đến mức 8 vCPU tốn kém nhiều hơn phần tiết kiệm được); các bản dựng Docker install-smoke (thời gian xếp hàng 32 vCPU tốn kém nhiều hơn phần tiết kiệm được)                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; các fork quay về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; các fork quay về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

## Các bản tương đương cục bộ

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

`Full Release Validation` là workflow bao trùm thủ công để "chạy mọi thứ trước khi phát hành." Nó chấp nhận một nhánh, tag, hoặc SHA commit đầy đủ, điều phối workflow `CI` thủ công với mục tiêu đó, điều phối `Plugin Prerelease` cho bằng chứng Plugin/gói/tĩnh/Docker chỉ dành cho phát hành, và điều phối `OpenClaw Release Checks` cho install smoke, package acceptance, các bộ kiểm thử đường dẫn phát hành Docker, live/E2E, OpenWebUI, kiểm tra tương đương QA Lab, Matrix, và các lane Telegram. Nó cũng có thể chạy workflow `NPM Telegram Beta E2E` sau phát hành khi có thông số gói đã phát hành.

Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn, tên công việc workflow chính xác, khác biệt giữa các hồ sơ, artifact, và
các điểm xử lý chạy lại tập trung.

`release_profile` kiểm soát độ rộng live/provider được truyền vào các kiểm tra phát hành. Các
workflow phát hành thủ công mặc định là `stable`; chỉ dùng `full` khi bạn
cố ý muốn ma trận provider/phương tiện tư vấn rộng.

- `minimum` giữ các lane OpenAI/lõi quan trọng cho phát hành nhanh nhất.
- `stable` thêm bộ provider/backend ổn định.
- `full` chạy ma trận provider/phương tiện tư vấn rộng.

Workflow bao trùm ghi lại các id lần chạy con đã điều phối, và công việc `Verify full validation` cuối cùng kiểm tra lại kết luận hiện tại của các lần chạy con và thêm các bảng công việc chậm nhất cho từng lần chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại công việc xác minh cha để làm mới kết quả bao trùm và tóm tắt thời gian.

Để phục hồi, cả `Full Release Validation` và `OpenClaw Release Checks` đều chấp nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho CI con đầy đủ thông thường, `plugin-prerelease` chỉ cho con tiền phát hành Plugin, `release-checks` cho mọi con phát hành, hoặc một nhóm hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, hoặc `npm-telegram` trên workflow bao trùm. Điều này giữ phạm vi chạy lại của hộp phát hành bị lỗi ở mức giới hạn sau một bản sửa tập trung.

`OpenClaw Release Checks` dùng ref workflow tin cậy để phân giải ref đã chọn một lần thành tarball `release-package-under-test`, rồi truyền artifact đó cho cả workflow Docker đường dẫn phát hành live/E2E và shard package acceptance. Điều đó giữ các byte gói nhất quán giữa các hộp phát hành và tránh đóng gói lại cùng một ứng viên trong nhiều công việc con.

Các lần chạy `Full Release Validation` trùng lặp cho `ref=main` và `rerun_group=all`
thay thế workflow bao trùm cũ hơn. Trình giám sát cha hủy mọi workflow con mà nó
đã điều phối khi cha bị hủy, nên xác thực main mới hơn
không phải chờ sau một lần chạy release-check cũ kéo dài hai giờ. Xác thực nhánh/tag
phát hành và các nhóm chạy lại tập trung giữ `cancel-in-progress: false`.

## Các shard Live và E2E

Workflow con live/E2E phát hành giữ độ phủ `pnpm test:live` gốc rộng, nhưng chạy nó dưới dạng các shard có tên thông qua `scripts/test-live-shard.mjs` thay vì một công việc nối tiếp:

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
- các shard âm thanh/video phương tiện được tách và các shard nhạc được lọc theo provider

Điều đó giữ cùng độ phủ tệp trong khi giúp các lỗi provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp `native-live-extensions-o-z`, `native-live-extensions-media`, và `native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công một lần.

Các shard phương tiện live gốc chạy trong `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được dựng bởi workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và `ffprobe`; các công việc phương tiện chỉ xác minh các binary trước khi thiết lập. Giữ các bộ live dùng Docker trên runner Blacksmith thông thường — công việc container không phải nơi phù hợp để khởi chạy các kiểm thử Docker lồng nhau.

Các shard mô hình/backend live dùng Docker sử dụng một image `ghcr.io/openclaw/openclaw-live-test:<sha>` dùng chung riêng cho mỗi commit đã chọn. Workflow phát hành live dựng và đẩy image đó một lần, rồi các shard mô hình live Docker, Gateway được chia shard theo provider, backend CLI, bind ACP, và harness Codex chạy với `OPENCLAW_SKIP_DOCKER_BUILD=1`. Các shard Gateway Docker mang giới hạn `timeout` rõ ràng ở cấp script thấp hơn timeout của công việc workflow để container bị kẹt hoặc đường dẫn dọn dẹp thất bại nhanh thay vì tiêu tốn toàn bộ ngân sách release-check. Nếu các shard đó tự dựng lại mục tiêu Docker nguồn đầy đủ một cách độc lập, lần chạy phát hành đã bị cấu hình sai và sẽ lãng phí thời gian thực tế vào các bản dựng image trùng lặp.

## Package Acceptance

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực cây nguồn, trong khi package acceptance xác thực một tarball duy nhất thông qua cùng harness Docker E2E mà người dùng chạy sau khi cài đặt hoặc cập nhật.

### Công việc

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói, ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng artifact `package-under-test`, và in nguồn, workflow ref, package ref, phiên bản, SHA-256, và hồ sơ trong phần tóm tắt bước của GitHub.
2. `docker_acceptance` gọi `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và `package_artifact_name=package-under-test`. Workflow tái sử dụng tải xuống artifact đó, xác thực danh mục tarball, chuẩn bị các image Docker package-digest khi cần, và chạy các làn Docker đã chọn với gói đó thay vì đóng gói workflow checkout. Khi một hồ sơ chọn nhiều `docker_lanes` có mục tiêu, workflow tái sử dụng chuẩn bị gói và các image dùng chung một lần, rồi fan out các làn đó thành các job Docker có mục tiêu chạy song song với artifact riêng.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi `telegram_mode` không phải là `none` và cài đặt cùng artifact `package-under-test` khi Package Acceptance đã phân giải một gói; dispatch Telegram độc lập vẫn có thể cài đặt một spec npm đã phát hành.
4. `summary` làm workflow thất bại nếu phân giải gói, Docker acceptance, hoặc làn Telegram tùy chọn thất bại.

### Nguồn ứng viên

- `source=npm` chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng nguồn này cho acceptance beta/stable đã phát hành.
- `source=ref` đóng gói một nhánh, thẻ, hoặc full commit SHA `package_ref` đáng tin cậy. Bộ phân giải fetch các nhánh/thẻ OpenClaw, xác minh commit đã chọn có thể được truy vết từ lịch sử nhánh của repository hoặc một thẻ phát hành, cài đặt deps trong một worktree detached, và đóng gói nó bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url` tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact` tải xuống một `.tgz` từ `artifact_run_id` và `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là mã workflow/harness đáng tin cậy chạy bài kiểm thử. `package_ref` là commit nguồn được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực các commit nguồn đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

### Hồ sơ bộ kiểm thử

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` cộng thêm `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — các chunk đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom` — `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Hồ sơ `package` dùng phạm vi Plugin ngoại tuyến để việc xác thực gói đã phát hành không bị phụ thuộc vào tính khả dụng trực tiếp của ClawHub. Làn Telegram tùy chọn tái sử dụng artifact `package-under-test` trong `NPM Telegram Beta E2E`, với đường dẫn spec npm đã phát hành được giữ cho các dispatch độc lập.

Kiểm tra phát hành gọi Package Acceptance với `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'`, và `telegram_mode=mock-openai`. Các chunk Docker đường dẫn phát hành bao phủ các làn package/update/Plugin chồng lấn; Package Acceptance giữ bằng chứng compat bundled-channel theo artifact gốc, Plugin ngoại tuyến, và Telegram trên cùng tarball gói đã phân giải. Kiểm tra phát hành Cross-OS vẫn bao phủ onboarding, installer, và hành vi nền tảng theo hệ điều hành; xác thực sản phẩm package/update nên bắt đầu với Package Acceptance. Làn Docker `published-upgrade-survivor` xác thực một baseline gói đã phát hành cho mỗi lần chạy. Trong Package Acceptance, tarball `package-under-test` đã phân giải luôn là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã phát hành dự phòng, mặc định là `openclaw@latest`; các lệnh chạy lại làn thất bại giữ nguyên baseline đó. Đặt `published_upgrade_survivor_baselines=release-history` để mở rộng làn trên một ma trận lịch sử đã khử trùng lặp: sáu bản phát hành stable mới nhất, `2026.4.23`, và bản phát hành stable mới nhất trước `2026-03-15`. Đặt `published_upgrade_survivor_scenarios=reported-issues` để mở rộng cùng các baseline trên các fixture mô phỏng issue cho config/runtime-deps của Feishu, các tệp bootstrap/persona được giữ lại, đường dẫn log có dấu ngã, và các root runtime-deps có phiên bản đã cũ. Các lần chạy tổng hợp cục bộ có thể truyền spec gói chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, giữ một làn duy nhất với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` như `openclaw@2026.4.15`, hoặc đặt `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` cho ma trận kịch bản. Làn đã phát hành cấu hình baseline bằng một công thức lệnh `openclaw config set` được nhúng sẵn, ghi lại các bước công thức trong `summary.json`, và dò `/healthz`, `/readyz`, cùng trạng thái RPC sau khi Gateway khởi động. Các làn fresh cho gói Windows và installer cũng xác minh rằng một gói đã cài đặt có thể import một browser-control override từ một đường dẫn Windows tuyệt đối thô. Smoke agent-turn OpenAI Cross-OS mặc định dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.4-mini`, để bằng chứng cài đặt và Gateway luôn nhanh và tất định.

### Cửa sổ tương thích kế thừa

Package Acceptance có các cửa sổ tương thích kế thừa có giới hạn cho các gói đã phát hành. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`, có thể dùng đường dẫn tương thích:

- các mục QA riêng tư đã biết trong `dist/postinstall-inventory.json` có thể trỏ đến các tệp bị bỏ khỏi tarball;
- `doctor-switch` có thể bỏ qua subcase duy trì `gateway install --wrapper` khi gói không expose flag đó;
- `update-channel-switch` có thể lược bỏ `pnpm.patchedDependencies` bị thiếu khỏi fixture git giả lập lấy từ tarball và có thể ghi log `update.channel` đã duy trì bị thiếu;
- các smoke Plugin có thể đọc vị trí install-record kế thừa hoặc chấp nhận thiếu khả năng duy trì install-record marketplace;
- `plugin-update` có thể cho phép di chuyển metadata config trong khi vẫn yêu cầu install record và hành vi no-reinstall không thay đổi.

Gói `2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp stamp metadata bản dựng cục bộ đã được phát hành. Các gói sau đó phải đáp ứng các hợp đồng hiện đại; cùng các điều kiện sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

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

Khi gỡ lỗi một lần chạy package acceptance thất bại, hãy bắt đầu từ phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản, và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, log làn, thời gian pha, và lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói đã thất bại hoặc các làn Docker chính xác thay vì chạy lại toàn bộ xác thực phát hành.

## Smoke cài đặt

Workflow `Install Smoke` riêng biệt tái sử dụng cùng script phạm vi thông qua job `preflight` của nó. Nó chia phạm vi smoke thành `run_fast_install_smoke` và `run_full_install_smoke`.

- **Đường dẫn nhanh** chạy cho pull request chạm đến bề mặt Docker/package, thay đổi gói/manifest Plugin đi kèm, hoặc các bề mặt Plugin/channel/Gateway/Plugin SDK lõi mà các job Docker smoke thực thi. Thay đổi Plugin đi kèm chỉ ở nguồn, chỉnh sửa chỉ dành cho test, và chỉnh sửa chỉ dành cho docs không giữ trước worker Docker. Đường dẫn nhanh xây dựng image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI agents delete shared-workspace, chạy e2e gateway-network trong container, xác minh một build arg extension đi kèm, và chạy hồ sơ Docker Plugin đi kèm có giới hạn dưới timeout lệnh tổng hợp 240 giây (mỗi lần chạy Docker của kịch bản được giới hạn riêng).
- **Đường dẫn đầy đủ** giữ phạm vi cài đặt gói QR và Docker/update installer cho các lần chạy theo lịch hằng đêm, dispatch thủ công, kiểm tra phát hành workflow-call, và các pull request thực sự chạm đến bề mặt installer/package/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image smoke Dockerfile gốc GHCR target-SHA, rồi chạy cài đặt gói QR, smoke Dockerfile/Gateway gốc, smoke installer/update, và Docker E2E Plugin đi kèm nhanh dưới dạng các job riêng để công việc installer không phải đợi sau các smoke image gốc.

Các push `main` (bao gồm merge commit) không ép chạy đường dẫn đầy đủ; khi logic changed-scope yêu cầu phạm vi đầy đủ trên một push, workflow giữ Docker smoke nhanh và để install smoke đầy đủ cho xác thực hằng đêm hoặc phát hành.

Smoke image-provider cài đặt global Bun chậm được gate riêng bằng `run_bun_global_install_smoke`. Nó chạy theo lịch hằng đêm và từ workflow kiểm tra phát hành, và các dispatch `Install Smoke` thủ công có thể chọn tham gia, nhưng pull request và push `main` thì không. Các kiểm thử Docker QR và installer giữ Dockerfile tập trung vào cài đặt riêng của chúng.

## Docker E2E cục bộ

`pnpm test:docker:all` dựng trước một image live-test dùng chung, đóng gói OpenClaw một lần dưới dạng tarball npm, và xây dựng hai image `scripts/e2e/Dockerfile` dùng chung:

- một runner Node/Git tối giản cho các làn installer/update/plugin-dependency;
- một image chức năng cài đặt cùng tarball đó vào `/app` cho các làn chức năng bình thường.

Định nghĩa làn Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi plan đã chọn. Scheduler chọn image cho từng làn bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các làn với `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Tham số điều chỉnh

| Biến                                   | Mặc định | Mục đích                                                                                                           |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Số lượng slot của nhóm chính cho các làn thông thường.                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Số lượng slot của nhóm tail nhạy cảm với nhà cung cấp.                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Giới hạn làn trực tiếp đồng thời để nhà cung cấp không điều tiết.                                                   |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Giới hạn làn cài đặt npm đồng thời.                                                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Giới hạn làn nhiều dịch vụ đồng thời.                                                                              |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Khoảng giãn giữa các lần khởi động làn để tránh tạo bão trên daemon Docker; đặt `0` để không giãn.                 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Thời gian chờ dự phòng cho mỗi làn (120 phút); một số làn trực tiếp/tail được chọn dùng giới hạn chặt hơn.         |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | chưa đặt | `1` in kế hoạch bộ lập lịch mà không chạy các làn.                                                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | chưa đặt | Danh sách làn chính xác, phân tách bằng dấu phẩy; bỏ qua smoke dọn dẹp để agent có thể tái hiện một làn thất bại. |

Một làn nặng hơn giới hạn hiệu dụng của nó vẫn có thể bắt đầu từ một nhóm trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Bộ tổng hợp cục bộ kiểm tra sơ bộ Docker, xóa các container E2E OpenClaw cũ, phát trạng thái làn đang hoạt động, lưu thời gian làn để sắp xếp theo thời gian dài nhất trước, và theo mặc định dừng lập lịch các làn trong nhóm mới sau lỗi đầu tiên.

### Quy trình làm việc live/E2E tái sử dụng

Quy trình làm việc live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` để biết cần phạm vi bao phủ package, loại image, image trực tiếp, làn và thông tin xác thực nào. Sau đó `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành output và tóm tắt của GitHub. Nó đóng gói OpenClaw thông qua `scripts/package-openclaw-for-docker.mjs`, tải artifact package của lần chạy hiện tại, hoặc tải artifact package từ `package_artifact_run_id`; xác thực inventory tarball; build và đẩy các image Docker E2E GHCR bare/functional được gắn thẻ theo digest package qua bộ nhớ đệm lớp Docker của Blacksmith khi kế hoạch cần các làn cài từ package; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các image theo digest package hiện có thay vì build lại. Việc pull image Docker được thử lại với thời gian chờ giới hạn 180 giây cho mỗi lần thử để luồng registry/bộ nhớ đệm bị kẹt sẽ thử lại nhanh thay vì tiêu tốn phần lớn đường găng CI.

### Các phần của đường dẫn phát hành

Phạm vi bao phủ Docker phát hành chạy các job được chia nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phần chỉ pull loại image nó cần và thực thi nhiều làn qua cùng bộ lập lịch có trọng số:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Các phần Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` đến `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b`, và `bundled-channels-contracts`. Phần tổng hợp `bundled-channels` vẫn có sẵn cho các lần chạy lại thủ công một lần, và `plugins-runtime-core`, `plugins-runtime`, cùng `plugins-integrations` vẫn là các bí danh Plugin/runtime tổng hợp. Bí danh làn `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai làn trình cài đặt nhà cung cấp. Phần `bundled-channels` chạy các làn `bundled-channel-*` và `bundled-channel-update-*` đã tách thay vì làn `bundled-channel-deps` tuần tự gộp tất cả.

OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi bao phủ release-path đầy đủ yêu cầu, và chỉ giữ một phần `openwebui` độc lập cho các lần dispatch chỉ dành cho OpenWebUI. Các làn cập nhật kênh đi kèm thử lại một lần khi gặp lỗi mạng npm tạm thời.

Mỗi phần tải lên `.artifacts/docker-tests/` với nhật ký làn, thời gian, `summary.json`, `failures.json`, thời gian pha, JSON kế hoạch bộ lập lịch, bảng làn chậm và lệnh chạy lại cho từng làn. Input `docker_lanes` của quy trình làm việc chạy các làn được chọn trên những image đã chuẩn bị thay vì các job theo phần, giúp việc debug làn thất bại được giới hạn trong một job Docker có mục tiêu và chuẩn bị, tải xuống hoặc tái sử dụng artifact package cho lần chạy đó; nếu làn được chọn là làn Docker trực tiếp, job có mục tiêu build image kiểm thử trực tiếp cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được tạo cho từng làn bao gồm `package_artifact_run_id`, `package_artifact_name` và input image đã chuẩn bị khi những giá trị đó tồn tại, để một làn thất bại có thể tái sử dụng đúng package và image từ lần chạy thất bại.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Quy trình làm việc live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày.

## Plugin Prerelease

`Plugin Prerelease` là phạm vi bao phủ sản phẩm/package tốn kém hơn, nên nó là một quy trình làm việc riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, push lên `main`, và các dispatch CI thủ công độc lập giữ bộ đó tắt. Nó cân bằng kiểm thử Plugin đi kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình Plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các lô Plugin nặng import không tạo thêm job CI. Đường dẫn Docker prerelease chỉ dành cho phát hành gom các làn Docker có mục tiêu thành nhóm nhỏ để tránh giữ hàng chục runner cho các job kéo dài một đến ba phút.

## QA Lab

QA Lab có các làn CI chuyên dụng bên ngoài quy trình làm việc chính có phạm vi thông minh.

- Quy trình làm việc `Parity gate` chạy trên các thay đổi PR phù hợp và dispatch thủ công; nó build runtime QA riêng tư và so sánh các gói agentic GPT-5.5 và Opus 4.6 mô phỏng.
- Quy trình làm việc `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó tỏa ra cổng parity mô phỏng, làn Matrix trực tiếp, cùng các làn Telegram và Discord trực tiếp thành các job song song. Các job trực tiếp dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex.

Kiểm tra phát hành chạy các làn truyền tải trực tiếp Matrix và Telegram với nhà cung cấp mô phỏng xác định và các model đủ điều kiện mô phỏng (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được cô lập khỏi độ trễ model trực tiếp và khởi động Plugin nhà cung cấp thông thường. Gateway truyền tải trực tiếp tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; kết nối nhà cung cấp được bao phủ bởi các bộ model trực tiếp, nhà cung cấp native và nhà cung cấp Docker riêng biệt.

Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ. Mặc định CLI và input quy trình làm việc thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi bao phủ Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`.

`OpenClaw Release Checks` cũng chạy các làn QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; cổng QA parity của nó chạy các gói candidate và baseline như các job làn song song, rồi tải cả hai artifact vào một job báo cáo nhỏ để so sánh parity cuối cùng.

Không đặt đường dẫn landing PR phía sau `Parity gate` trừ khi thay đổi thật sự chạm đến runtime QA, parity gói model, hoặc một bề mặt do quy trình làm việc parity sở hữu. Với các bản sửa kênh, cấu hình, tài liệu hoặc kiểm thử đơn vị thông thường, hãy xem đó là tín hiệu tùy chọn và theo bằng chứng CI/kiểm tra theo phạm vi.

## CodeQL

Quy trình làm việc `CodeQL` cố ý là trình quét bảo mật vòng đầu có phạm vi hẹp, không phải lượt quét toàn bộ repository. Các lần chạy hằng ngày, thủ công và bảo vệ pull request không phải draft quét mã quy trình làm việc Actions cùng các bề mặt JavaScript/TypeScript rủi ro cao nhất bằng các truy vấn bảo mật có độ tin cậy cao, được lọc theo `security-severity` cao/nghiêm trọng.

Bảo vệ pull request vẫn nhẹ: nó chỉ bắt đầu cho các thay đổi trong `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, hoặc `src`, và chạy cùng ma trận bảo mật độ tin cậy cao như quy trình làm việc theo lịch. CodeQL Android và macOS không nằm trong mặc định PR.

### Danh mục bảo mật

| Danh mục                                          | Bề mặt                                                                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Xác thực, bí mật, sandbox, Cron và baseline Gateway                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Hợp đồng triển khai kênh lõi cộng với runtime Plugin kênh, Gateway, Plugin SDK, bí mật, điểm chạm kiểm toán                            |
| `/codeql-security-high/network-ssrf-boundary`     | SSRF lõi, phân tích cú pháp IP, bộ bảo vệ mạng, web-fetch và các bề mặt chính sách SSRF của Plugin SDK                                  |
| `/codeql-security-high/mcp-process-tool-boundary` | Máy chủ MCP, helper thực thi tiến trình, phân phối outbound và cổng thực thi công cụ của agent                                          |
| `/codeql-security-high/plugin-trust-boundary`     | Cài đặt Plugin, loader, manifest, registry, staging phụ thuộc runtime, tải nguồn và các bề mặt tin cậy hợp đồng package của Plugin SDK |

### Shard bảo mật theo nền tảng

- `CodeQL Android Critical Security` — shard bảo mật Android theo lịch. Build ứng dụng Android thủ công cho CodeQL trên runner Linux Blacksmith nhỏ nhất được workflow sanity chấp nhận. Tải lên dưới `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard bảo mật macOS hằng tuần/thủ công. Build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF được tải lên, và tải lên dưới `/codeql-critical-security/macos`. Được giữ ngoài mặc định hằng ngày vì build macOS chi phối thời gian chạy ngay cả khi sạch.

### Danh mục chất lượng trọng yếu

`CodeQL Critical Quality` là shard không thuộc bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không thuộc bảo mật, mức lỗi, trên các bề mặt giá trị cao có phạm vi hẹp trên runner Linux Blacksmith nhỏ hơn. Bảo vệ pull request của nó cố ý nhỏ hơn profile theo lịch: PR không phải draft chỉ chạy các shard `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, và `plugin-sdk-reply-runtime` tương ứng cho mã thực thi lệnh/model/công cụ của agent và dispatch reply, mã schema/di chuyển/IO cấu hình, mã xác thực/bí mật/sandbox/bảo mật, runtime kênh lõi và Plugin kênh đi kèm, protocol/server-method của Gateway, runtime bộ nhớ/keo SDK, phân phối MCP/tiến trình/outbound, runtime nhà cung cấp/catalog model, chẩn đoán phiên/hàng đợi phân phối, loader Plugin, hợp đồng package/Plugin SDK, hoặc thay đổi runtime reply của Plugin SDK. Các thay đổi cấu hình CodeQL và quy trình làm việc chất lượng chạy toàn bộ mười hai shard chất lượng PR.

Dispatch thủ công chấp nhận:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Các profile hẹp là các hook hướng dẫn/lặp lại để chạy riêng một phân đoạn chất lượng.

| Danh mục                                                | Bề mặt                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Mã ranh giới bảo mật cho xác thực, bí mật, sandbox, cron và Gateway                                                                                               |
| `/codeql-critical-quality/config-boundary`              | Hợp đồng schema cấu hình, di chuyển, chuẩn hóa và IO                                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Schema giao thức Gateway và hợp đồng phương thức máy chủ                                                                                                          |
| `/codeql-critical-quality/channel-runtime-boundary`     | Hợp đồng triển khai kênh lõi và Plugin kênh đi kèm                                                                                                                |
| `/codeql-critical-quality/agent-runtime-boundary`       | Thực thi lệnh, điều phối model/provider, điều phối và hàng đợi tự động trả lời, và hợp đồng runtime mặt phẳng điều khiển ACP                                     |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Máy chủ MCP và cầu nối công cụ, helper giám sát tiến trình, và hợp đồng phân phối đi                                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK memory host, facade runtime memory, alias Plugin SDK memory, lớp kết nối kích hoạt runtime memory, và lệnh doctor memory                                      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Nội bộ hàng đợi trả lời, hàng đợi phân phối phiên, helper gắn kết/phân phối phiên đi, bề mặt gói sự kiện/log chẩn đoán, và hợp đồng CLI doctor phiên             |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Điều phối trả lời vào Plugin SDK, helper payload/chunking/runtime trả lời, tùy chọn trả lời kênh, hàng đợi phân phối, và helper gắn kết phiên/luồng              |
| `/codeql-critical-quality/provider-runtime-boundary`    | Chuẩn hóa danh mục model, xác thực và khám phá provider, đăng ký runtime provider, mặc định/danh mục provider, và registry web/search/fetch/embedding             |
| `/codeql-critical-quality/ui-control-plane`             | Khởi động Control UI, lưu trữ cục bộ, luồng điều khiển Gateway, và hợp đồng runtime mặt phẳng điều khiển tác vụ                                                   |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Hợp đồng runtime cho web fetch/search lõi, media IO, hiểu media, tạo ảnh và tạo media                                                                              |
| `/codeql-critical-quality/plugin-boundary`              | Hợp đồng loader, registry, bề mặt công khai và entrypoint Plugin SDK                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Mã nguồn Plugin SDK phía gói đã phát hành và helper hợp đồng gói Plugin                                                                                           |

Chất lượng được tách riêng khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, tắt hoặc mở rộng mà không làm mờ tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và Plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp nối có phạm vi hoặc được chia shard sau khi các profile hẹp đã có runtime và tín hiệu ổn định.

## Quy trình bảo trì

### Docs Agent

Workflow `Docs Agent` là một làn bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa được hợp nhất. Nó không có lịch thuần túy: một lần chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và manual dispatch có thể chạy trực tiếp. Các lần gọi từ workflow-run sẽ bỏ qua khi `main` đã tiến lên hoặc khi một lần chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ vừa qua. Khi chạy, nó xem xét dải commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, nên một lần chạy hằng giờ có thể bao phủ toàn bộ thay đổi trên main đã tích lũy kể từ lượt xử lý tài liệu gần nhất.

### Test Performance Agent

Workflow `Test Performance Agent` là một làn bảo trì Codex theo sự kiện cho các bài test chậm. Nó không có lịch thuần túy: một lần chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Manual dispatch bỏ qua cổng hoạt động hằng ngày đó. Làn này xây dựng báo cáo hiệu năng Vitest toàn bộ bộ test theo nhóm, cho phép Codex chỉ thực hiện các bản sửa hiệu năng test nhỏ vẫn giữ nguyên coverage thay vì các refactor rộng, sau đó chạy lại báo cáo toàn bộ bộ test và từ chối thay đổi làm giảm số lượng test baseline đang pass. Nếu baseline có test thất bại, Codex chỉ được sửa các lỗi hiển nhiên và báo cáo toàn bộ bộ test sau agent phải pass trước khi có bất kỳ commit nào. Khi `main` tiến lên trước khi bot push được hợp nhất, làn này rebase bản vá đã xác thực, chạy lại `pnpm check:changed`, và thử push lại; các bản vá cũ bị xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub-hosted cung cấp để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

### PR trùng lặp sau khi merge

Workflow `Duplicate PRs After Merge` là workflow thủ công cho maintainer để dọn dẹp trùng lặp sau khi land. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi PR trùng lặp có một issue được tham chiếu chung hoặc các hunk thay đổi chồng lấn.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Cổng kiểm tra cục bộ và định tuyến thay đổi

Logic changed-lane cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng:

- thay đổi production lõi chạy typecheck core prod và core test cùng lint/guard lõi;
- thay đổi chỉ test lõi chỉ chạy typecheck core test cùng lint lõi;
- thay đổi production extension chạy typecheck extension prod và extension test cùng lint extension;
- thay đổi chỉ test extension chạy typecheck extension test cùng lint extension;
- thay đổi Plugin SDK công khai hoặc hợp đồng Plugin mở rộng sang typecheck extension vì extension phụ thuộc vào các hợp đồng lõi đó (các lượt quét Vitest extension vẫn là công việc test rõ ràng);
- bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/root-dependency có mục tiêu;
- thay đổi root/config không xác định fail an toàn sang tất cả làn kiểm tra.

Định tuyến changed-test cục bộ nằm trong `scripts/test-projects.test-support.mjs` và cố ý rẻ hơn `check:changed`: chỉnh sửa test trực tiếp chạy chính chúng, chỉnh sửa nguồn ưu tiên mapping rõ ràng, sau đó là test sibling và các phụ thuộc import-graph. Cấu hình phân phối group-room dùng chung là một trong các mapping rõ ràng: thay đổi đối với cấu hình visible-reply nhóm, chế độ phân phối trả lời nguồn, hoặc prompt hệ thống message-tool sẽ đi qua các test trả lời lõi cùng các hồi quy phân phối Discord và Slack để thay đổi mặc định dùng chung thất bại trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng ở mức harness khiến tập mapped rẻ không phải là proxy đáng tin cậy.

## Xác thực Testbox

Chạy Testbox từ repo root và ưu tiên một box đã warm mới cho bằng chứng rộng. Trước khi dùng một cổng chậm trên box đã được tái sử dụng, hết hạn, hoặc vừa báo một lần sync lớn bất thường, trước tiên hãy chạy `pnpm testbox:sanity` bên trong box.

Kiểm tra sanity fail nhanh khi các tệp root bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200 xóa theo dõi. Điều đó thường có nghĩa trạng thái sync từ xa không phải là bản sao PR đáng tin cậy; hãy dừng box đó và warm một box mới thay vì debug lỗi test sản phẩm. Với các PR xóa lớn có chủ ý, đặt `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó.

`pnpm testbox:run` cũng chấm dứt một lần gọi Blacksmith CLI cục bộ nếu nó ở trong giai đoạn sync hơn năm phút mà không có output sau sync. Đặt `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt guard đó, hoặc dùng giá trị mili giây lớn hơn cho diff cục bộ lớn bất thường.

Crabbox là đường dẫn remote-box thứ hai do repo sở hữu cho bằng chứng Linux khi Blacksmith không khả dụng hoặc khi nên dùng năng lực cloud sở hữu. Warm một box, hydrate nó qua workflow dự án, rồi chạy lệnh qua Crabbox CLI:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` sở hữu mặc định provider, sync và hydrate GitHub Actions. Nó loại trừ `.git` cục bộ để checkout Actions đã hydrate giữ metadata Git từ xa riêng thay vì sync remote và object store cục bộ của maintainer, và nó loại trừ artifact runtime/build cục bộ vốn không bao giờ nên được truyền đi. `.github/workflows/crabbox-hydrate.yml` sở hữu checkout, thiết lập Node/pnpm, fetch `origin/main`, và handoff môi trường không bí mật mà các lệnh `crabbox run --id <cbx_id>` sau đó sẽ source.

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát triển](/vi/install/development-channels)
