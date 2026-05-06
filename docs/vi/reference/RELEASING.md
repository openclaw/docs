---
read_when:
    - Đang tìm các định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc kiểm nhận gói
    - Tìm hiểu quy ước đặt tên phiên bản và nhịp phát hành
summary: Các làn phát hành, danh sách kiểm tra cho người vận hành, các hộp xác thực, quy ước đặt tên phiên bản và nhịp độ
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-06T10:57:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba luồng phát hành công khai:

- stable: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ tiền phát hành được phát hành lên npm `beta`
- dev: đầu nhánh đang thay đổi của `main`

## Đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản tiền phát hành beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm ổn định hiện tại đã được thăng hạng
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Theo mặc định, các bản phát hành ổn định và sửa lỗi ổn định được phát hành lên npm `beta`; người vận hành phát hành có thể nhắm mục tiêu `latest` một cách rõ ràng, hoặc thăng hạng một bản dựng beta đã được kiểm duyệt sau đó
- Mọi bản phát hành OpenClaw ổn định đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/gói trước, với
  việc build/ký/notarize ứng dụng mac chỉ dành cho bản ổn định trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Bản ổn định chỉ theo sau sau khi beta mới nhất được xác thực
- Maintainer thường cắt bản phát hành từ nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc phát hành và cần sửa, maintainer cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho maintainer

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, notarization, khôi phục dist-tag và chi tiết rollback khẩn cấp nằm trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thực bằng
   `/changelog`, giữ các mục hướng đến người dùng, commit, đẩy, rồi rebase/kéo
   thêm một lần nữa trước khi tạo nhánh.
3. Rà soát bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ loại bỏ tương thích
   đã hết hạn khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do nó
   được chủ ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, chạy
   `pnpm plugins:sync` để các gói Plugin có thể phát hành dùng chung phiên bản phát hành
   và metadata tương thích, rồi chạy preflight tất định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, và
   `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA nhánh phát hành đầy đủ 40 ký tự được phép dùng cho preflight
   chỉ để xác thực. Lưu `preflight_run_id` thành công.
7. Khởi động toàn bộ kiểm thử tiền phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là entrypoint thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab, và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, lane,
   job workflow, profile gói, provider, hoặc danh sách cho phép model nhỏ nhất đã thất bại
   để chứng minh bản sửa. Chỉ chạy lại toàn bộ umbrella khi bề mặt thay đổi khiến
   bằng chứng trước đó trở nên cũ.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` khớp. Nó xác minh `pnpm plugins:sync:check`,
   dispatch tất cả các gói Plugin có thể phát hành lên npm và cùng tập đó lên
   ClawHub song song, rồi thăng hạng artifact preflight npm OpenClaw đã chuẩn bị
   với dist-tag khớp ngay khi việc phát hành Plugin npm thành công.
   Việc phát hành ClawHub có thể vẫn đang chạy trong khi OpenClaw npm phát hành, nhưng
   workflow phát hành không hoàn tất cho đến khi cả hai đường dẫn phát hành Plugin và
   đường dẫn phát hành OpenClaw npm đều hoàn tất thành công. Sau khi phát hành, chạy
   bước chấp nhận gói hậu phát hành
   đối với gói `openclaw@YYYY.M.D-beta.N` hoặc
   `openclaw@beta` đã phát hành. Nếu một tiền phát hành đã được đẩy hoặc phát hành cần sửa,
   hãy cắt số tiền phát hành khớp tiếp theo; không xóa hoặc viết lại tiền phát hành cũ.
10. Với bản ổn định, chỉ tiếp tục sau khi beta đã được kiểm duyệt hoặc release candidate có
    bằng chứng xác thực bắt buộc. Phát hành npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công thông qua
    `preflight_run_id`; mức sẵn sàng phát hành macOS ổn định cũng yêu cầu
    `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói, và `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy trình xác minh npm hậu phát hành, E2E Telegram từ npm đã phát hành độc lập tùy chọn
    khi bạn cần bằng chứng kênh hậu phát hành,
    thăng hạng dist-tag khi cần, ghi chú phát hành/tiền phát hành GitHub từ
    toàn bộ phần `CHANGELOG.md` khớp, và các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước preflight phát hành để TypeScript của kiểm thử vẫn được bao phủ bên ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước preflight phát hành để các kiểm tra chu kỳ import và ranh giới kiến trúc rộng hơn đều xanh bên ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực pack
- Chạy `pnpm plugins:sync` sau khi tăng phiên bản ở root và trước khi gắn tag. Lệnh này cập nhật phiên bản gói Plugin có thể phát hành, metadata tương thích peer/API của OpenClaw, metadata build, và stub changelog của Plugin để khớp với phiên bản phát hành core. `pnpm plugins:sync:check` là guard phát hành không thay đổi dữ liệu; workflow phát hành sẽ thất bại trước mọi thay đổi registry nếu bước này bị quên.
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để khởi chạy mọi test box tiền phát hành từ một entrypoint. Workflow này chấp nhận branch, tag, hoặc full commit SHA, dispatch thủ công `CI`, và dispatch `OpenClaw Release Checks` cho install smoke, package acceptance, kiểm tra gói cross-OS, QA Lab parity, Matrix, và các lane Telegram. Các lần chạy stable/default giữ exhaustive live/E2E và Docker release-path soak phía sau `run_release_soak=true`; `release_profile=full` buộc bật soak. Với `release_profile=full` và `rerun_group=all`, workflow cũng chạy package Telegram E2E trên artifact `release-package-under-test` từ release checks. Cung cấp `npm_telegram_package_spec` sau khi publish khi cùng Telegram E2E cũng cần chứng minh gói npm đã publish. Cung cấp `package_acceptance_package_spec` sau khi publish khi Package Acceptance cần chạy ma trận package/update trên gói npm đã ship thay vì artifact build từ SHA. Cung cấp `evidence_package_spec` khi báo cáo evidence riêng cần chứng minh validation khớp với một gói npm đã publish mà không buộc chạy Telegram E2E. Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng side-channel cho một package candidate trong lúc công việc phát hành tiếp tục. Dùng `source=npm` cho `openclaw@beta`, `openclaw@latest`, hoặc phiên bản phát hành chính xác; `source=ref` để pack một branch/tag/SHA `package_ref` đáng tin cậy với harness `workflow_ref` hiện tại; `source=url` cho tarball HTTPS với SHA-256 bắt buộc; hoặc `source=artifact` cho tarball được tải lên bởi một lần chạy GitHub Actions khác. Workflow resolve candidate thành `package-under-test`, tái sử dụng Docker E2E release scheduler trên tarball đó, và có thể chạy Telegram QA trên cùng tarball với `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các Docker lane đã chọn bao gồm `published-upgrade-survivor`, artifact gói là candidate và `published_upgrade_survivor_baseline` chọn baseline đã publish. `update-restart-auth` dùng gói candidate làm cả CLI đã cài đặt lẫn package-under-test để nó kiểm tra đường dẫn managed restart của lệnh update candidate.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Các profile thường dùng:
  - `smoke`: các lane install/channel/agent, mạng Gateway, và tải lại config
  - `package`: các lane package/update/restart/Plugin gốc artifact không có OpenWebUI hoặc ClawHub live
  - `product`: profile package cộng với kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các chunk release-path Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần bao phủ CI thông thường đầy đủ cho release candidate. Dispatch CI thủ công bỏ qua changed scoping và buộc chạy các shard Linux Node, shard bundled-plugin, channel contracts, tương thích Node 22, `check`, `check-additional`, build smoke, kiểm tra docs, Python skills, Windows, macOS, Android, và các lane i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này kiểm tra QA-lab qua receiver OTLP/HTTP cục bộ và xác minh tên trace span đã export, thuộc tính giới hạn, và biên tập nội dung/identifier mà không cần Opik, Langfuse, hoặc collector bên ngoài khác.
- Chạy `pnpm release:check` trước mọi bản phát hành được gắn tag
- Chạy `OpenClaw Release Publish` cho trình tự publish có thay đổi dữ liệu sau khi tag tồn tại. Dispatch nó từ `release/YYYY.M.D` (hoặc `main` khi publish một tag reachable từ main), truyền tag phát hành và `preflight_run_id` OpenClaw npm thành công, và giữ phạm vi publish Plugin mặc định `all-publishable` trừ khi bạn cố ý chạy một repair tập trung. Workflow tuần tự hóa publish Plugin npm, publish Plugin ClawHub, và publish OpenClaw npm để gói core không được publish trước các Plugin đã externalize.
- Release checks hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane QA Lab mock parity cộng với profile Matrix live nhanh và lane Telegram QA trước khi phê duyệt phát hành. Các lane live dùng môi trường `qa-live-shared`; Telegram cũng dùng các lease credential Convex CI. Chạy workflow thủ công `QA-Lab - All Lanes` với `matrix_profile=all` và `matrix_shards=true` khi bạn muốn inventory đầy đủ về transport, media, và E2EE của Matrix chạy song song.
- Xác thực runtime cài đặt và nâng cấp cross-OS là một phần của `OpenClaw Release Checks` công khai và `Full Release Validation`, vốn gọi trực tiếp reusable workflow `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ đích: giữ đường dẫn phát hành npm thật ngắn, tất định, và tập trung vào artifact, trong khi các kiểm tra live chậm hơn ở lane riêng để chúng không làm đình trệ hoặc chặn publish
- Release checks mang secret nên được dispatch qua `Full Release Validation` hoặc từ workflow ref `main`/release để logic workflow và secret vẫn được kiểm soát
- `OpenClaw Release Checks` chấp nhận branch, tag, hoặc full commit SHA miễn là commit đã resolve reachable từ một branch OpenClaw hoặc release tag
- Preflight validation-only của `OpenClaw NPM Release` cũng chấp nhận full workflow-branch commit SHA 40 ký tự hiện tại mà không yêu cầu tag đã push
- Đường dẫn SHA đó chỉ dành cho validation và không thể được promote thành publish thật
- Trong chế độ SHA, workflow chỉ tổng hợp `v<package.json version>` cho kiểm tra metadata gói; publish thật vẫn yêu cầu release tag thật
- Cả hai workflow giữ đường dẫn publish và promotion thật trên runner GitHub-hosted, trong khi đường dẫn validation không thay đổi dữ liệu có thể dùng các runner Blacksmith Linux lớn hơn
- Workflow đó chạy `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` bằng cả hai workflow secret `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Preflight phát hành npm không còn chờ lane release checks riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (hoặc tag beta/correction tương ứng) trước khi phê duyệt
- Sau khi publish npm, chạy `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D` (hoặc phiên bản beta/correction tương ứng) để xác minh đường dẫn cài đặt registry đã publish trong một temp prefix mới
- Sau khi publish beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` để xác minh onboarding gói đã cài đặt, thiết lập Telegram, và Telegram E2E thật trên gói npm đã publish bằng pool credential Telegram thuê dùng chung. Các lần chạy một lần cục bộ của maintainer có thể bỏ qua các biến Convex và truyền trực tiếp ba credential env `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy smoke beta post-publish đầy đủ từ máy maintainer, dùng `pnpm release:beta-smoke -- --beta betaN`. Helper chạy xác thực Parallels npm update/fresh-target, dispatch `NPM Telegram Beta E2E`, poll đúng workflow run, tải artifact, và in báo cáo Telegram.
- Maintainer có thể chạy cùng kiểm tra post-publish từ GitHub Actions qua workflow thủ công `NPM Telegram Beta E2E`. Workflow này cố ý chỉ thủ công và không chạy trên mọi merge.
- Tự động hóa phát hành cho maintainer hiện dùng preflight-then-promote:
  - publish npm thật phải vượt qua một `preflight_run_id` npm thành công
  - publish npm thật phải được dispatch từ cùng branch `main` hoặc `release/YYYY.M.D` với lần chạy preflight thành công
  - các bản phát hành npm stable mặc định dùng `beta`
  - publish npm stable có thể nhắm đích `latest` rõ ràng qua input workflow
  - thay đổi npm dist-tag dựa trên token hiện nằm trong `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` để bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo công khai giữ publish chỉ OIDC
  - `macOS Release` công khai chỉ dành cho validation; khi tag chỉ tồn tại trên release branch nhưng workflow được dispatch từ `main`, đặt `public_release_branch=release/YYYY.M.D`
  - publish mac riêng thật phải vượt qua `preflight_run_id` mac riêng và `validate_run_id` thành công
  - các đường dẫn publish thật promote artifact đã chuẩn bị thay vì build lại chúng
- Với các bản phát hành correction stable như `YYYY.M.D-N`, verifier post-publish cũng kiểm tra cùng đường dẫn nâng cấp temp-prefix từ `YYYY.M.D` lên `YYYY.M.D-N` để release correction không thể âm thầm để các global install cũ ở lại payload stable gốc
- Preflight phát hành npm fail đóng trừ khi tarball bao gồm cả `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng để chúng ta không ship một dashboard trình duyệt rỗng lần nữa
- Xác minh post-publish cũng kiểm tra entrypoint Plugin đã publish và metadata gói có mặt trong layout registry đã cài đặt. Một bản phát hành ship thiếu payload runtime Plugin sẽ fail verifier postpublish và không thể được promote lên `latest`.
- `pnpm test:install:smoke` cũng thực thi budget `unpackedSize` của npm pack trên tarball update candidate, để installer e2e bắt được pack bloat ngoài ý muốn trước đường dẫn publish phát hành
- Nếu công việc phát hành đã chạm tới lập kế hoạch CI, manifest timing của Plugin, hoặc ma trận kiểm thử Plugin, hãy regenerate và review các output ma trận `plugin-prerelease-extension-shard` do planner sở hữu từ `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để release notes không mô tả một layout CI đã cũ
- Mức sẵn sàng phát hành macOS stable cũng bao gồm các bề mặt updater:
  - GitHub release cuối cùng phải có `.zip`, `.dmg`, và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ tới stable zip mới sau khi publish
  - ứng dụng đã đóng gói phải giữ bundle id không debug, URL Sparkle feed không rỗng, và `CFBundleVersion` bằng hoặc cao hơn canonical Sparkle build floor cho phiên bản phát hành đó

## Release test boxes

`Full Release Validation` là cách operator khởi chạy mọi kiểm thử tiền phát hành từ một entrypoint. Để có bằng chứng commit đã pin trên một branch thay đổi nhanh, dùng helper để mọi workflow con chạy từ một branch tạm thời cố định tại SHA đích:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper push `release-ci/<sha>-...`, dispatch `Full Release Validation` từ branch đó với `ref=<sha>`, xác minh mọi workflow con có `headSha` khớp với đích, rồi xóa branch tạm thời. Điều này tránh vô tình chứng minh một lần chạy con `main` mới hơn.

Để xác thực release branch hoặc tag, chạy từ workflow ref `main` đáng tin cậy và truyền release branch hoặc tag làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Quy trình phân giải ref mục tiêu, kích hoạt `CI` thủ công với
`target_ref=<release-ref>`, kích hoạt `OpenClaw Release Checks`, chuẩn bị artifact
cha `release-package-under-test` cho các kiểm tra dựa trên gói, và kích hoạt E2E
Telegram dạng gói độc lập khi `release_profile=full` với `rerun_group=all` hoặc
khi đặt `npm_telegram_package_spec`. Sau đó `OpenClaw Release Checks` mở rộng
sang kiểm tra smoke cài đặt, kiểm tra phát hành đa hệ điều hành, phạm vi đường
dẫn phát hành Docker live/E2E khi bật kiểm thử ngâm, Package Acceptance với QA
gói Telegram, tương đương QA Lab, Matrix live và Telegram live. Một lần chạy đầy
đủ chỉ được chấp nhận khi phần tóm tắt `Full Release Validation` hiển thị
`normal_ci` và `release_checks` thành công. Ở chế độ full/all, quy trình con
`npm_telegram` cũng phải thành công; ngoài full/all thì nó được bỏ qua trừ khi đã
cung cấp `npm_telegram_package_spec` đã phát hành. Phần tóm tắt xác minh cuối
cùng bao gồm bảng tác vụ chậm nhất cho từng lần chạy con, để người quản lý bản
phát hành có thể thấy đường găng hiện tại mà không cần tải nhật ký xuống.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết ma
trận giai đoạn đầy đủ, tên tác vụ quy trình chính xác, khác biệt giữa hồ sơ
stable và full, artifact và các điểm xử lý chạy lại tập trung.
Các quy trình con được kích hoạt từ ref đáng tin cậy đang chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` mục tiêu trỏ đến một nhánh
hoặc thẻ phát hành cũ hơn. Không có đầu vào workflow-ref riêng cho Full Release
Validation; chọn bộ khung đáng tin cậy bằng cách chọn ref chạy quy trình.
Không dùng `--ref main -f ref=<sha>` để chứng minh commit chính xác trên `main`
đang dịch chuyển; SHA commit thô không thể là ref kích hoạt quy trình, vì vậy hãy
dùng `pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn độ rộng live/nhà cung cấp:

- `minimum`: đường dẫn Docker và live OpenAI/lõi nhanh nhất, quan trọng cho phát hành
- `stable`: minimum cộng thêm phạm vi nhà cung cấp/phần phụ trợ ổn định để phê duyệt phát hành
- `full`: stable cộng thêm phạm vi rộng cho nhà cung cấp/phương tiện mang tính tư vấn

Dùng `run_release_soak=true` với `stable` khi các làn chặn phát hành đã xanh và
bạn muốn kiểm thử live/E2E đầy đủ, đường dẫn phát hành Docker, cùng lượt quét có
giới hạn cho khả năng nâng cấp từ gói đã phát hành vẫn hoạt động trước khi quảng
bá. Lượt quét đó bao phủ bốn gói ổn định mới nhất cộng với các mốc chuẩn đã ghim
`2026.4.23` và `2026.5.2` cùng phạm vi `2026.4.15` cũ hơn, loại bỏ mốc chuẩn trùng
lặp và chia từng mốc chuẩn vào tác vụ chạy Docker riêng. `full` ngầm định
`run_release_soak=true`.

`OpenClaw Release Checks` dùng ref quy trình đáng tin cậy để phân giải ref mục
tiêu một lần thành `release-package-under-test` và tái sử dụng artifact đó trong
các kiểm tra đa hệ điều hành, Package Acceptance và Docker đường dẫn phát hành
khi kiểm thử ngâm chạy. Điều này giữ mọi hộp kiểm tra dựa trên gói trên cùng
một byte và tránh xây dựng gói lặp lại. Kiểm tra smoke cài đặt OpenAI đa hệ điều
hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi biến repo/org được đặt, nếu không
thì dùng `openai/gpt-5.4`, vì làn này đang chứng minh cài đặt gói, onboarding,
khởi động Gateway và một lượt tác tử live thay vì đo chuẩn mô hình mặc định chậm
nhất. Ma trận nhà cung cấp live rộng hơn vẫn là nơi dành cho phạm vi theo mô hình.

Dùng các biến thể này tùy theo giai đoạn phát hành:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Không dùng quy trình bao quát đầy đủ làm lần chạy lại đầu tiên sau một bản sửa
tập trung. Nếu một hộp thất bại, hãy dùng quy trình con, tác vụ, làn Docker, hồ sơ
gói, nhà cung cấp mô hình hoặc làn QA đã thất bại cho lần chứng minh tiếp theo.
Chỉ chạy lại quy trình bao quát đầy đủ khi bản sửa đã thay đổi điều phối phát
hành dùng chung hoặc làm bằng chứng toàn bộ hộp trước đó trở nên lỗi thời. Trình
xác minh cuối của quy trình bao quát kiểm tra lại các id lần chạy quy trình con
đã ghi, vì vậy sau khi một quy trình con được chạy lại thành công, chỉ chạy lại
tác vụ cha `Verify full validation` đã thất bại.

Để phục hồi có giới hạn, truyền `rerun_group` vào quy trình bao quát. `all` là
lần chạy ứng viên phát hành thực sự, `ci` chỉ chạy quy trình con CI bình thường,
`plugin-prerelease` chỉ chạy quy trình con Plugin chỉ dành cho phát hành,
`release-checks` chạy mọi hộp phát hành, và các nhóm phát hành hẹp hơn là
`install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`
và `npm-telegram`. Các lần chạy lại `npm-telegram` tập trung yêu cầu
`npm_telegram_package_spec`; các lần chạy full/all với `release_profile=full`
dùng artifact gói của release-checks. Các lần chạy lại đa hệ điều hành tập trung
có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc bộ lọc hệ điều
hành/bộ kiểm thử khác. Lỗi QA trong release-check là tư vấn; lỗi chỉ riêng QA
không chặn xác thực phát hành.

### Vitest

Hộp Vitest là quy trình con `CI` thủ công. CI thủ công cố ý bỏ qua phạm vi theo
thay đổi và bắt buộc đồ thị kiểm thử bình thường cho ứng viên phát hành: các
phân đoạn Linux Node, các phân đoạn Plugin đóng gói kèm, hợp đồng kênh, tương
thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu,
Skills Python, Windows, macOS, Android và Control UI i18n.

Dùng hộp này để trả lời "cây mã nguồn có vượt qua toàn bộ bộ kiểm thử bình
thường không?" Nó không giống xác thực sản phẩm theo đường dẫn phát hành. Bằng
chứng cần giữ:

- phần tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã kích hoạt
- lần chạy `CI` xanh trên đúng SHA mục tiêu
- tên phân đoạn thất bại hoặc chậm từ các tác vụ CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi một lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI bình thường xác định
nhưng không cần các hộp Docker, QA Lab, live, đa hệ điều hành hoặc gói:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Hộp Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cùng với quy trình `install-smoke`
ở chế độ phát hành. Nó xác thực ứng viên phát hành thông qua môi trường Docker
đóng gói thay vì chỉ kiểm thử ở cấp mã nguồn.

Phạm vi Docker phát hành bao gồm:

- kiểm tra smoke cài đặt đầy đủ với smoke cài đặt Bun toàn cục chậm được bật
- chuẩn bị/tái sử dụng image smoke Dockerfile gốc theo SHA mục tiêu, với các tác vụ smoke QR, root/gateway và installer/Bun chạy dưới dạng các phân đoạn install-smoke riêng biệt
- các làn E2E của kho
- các phân đoạn Docker đường dẫn phát hành: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong phân đoạn `plugins-runtime-services` khi được yêu cầu
- các làn cài đặt/gỡ cài đặt Plugin đóng gói kèm đã tách `bundled-plugin-install-uninstall-0` đến `bundled-plugin-install-uninstall-23`
- các bộ kiểm thử nhà cung cấp live/E2E và phạm vi mô hình live Docker khi release-check bao gồm các bộ kiểm thử live

Dùng artifact Docker trước khi chạy lại. Bộ lập lịch đường dẫn phát hành tải lên
`.artifacts/docker-tests/` với nhật ký làn, `summary.json`, `failures.json`, thời
gian theo pha, JSON kế hoạch bộ lập lịch và lệnh chạy lại. Để phục hồi tập trung,
dùng `docker_lanes=<lane[,lane]>` trên quy trình live/E2E tái sử dụng thay vì
chạy lại tất cả phân đoạn phát hành. Các lệnh chạy lại được tạo bao gồm
`package_artifact_run_id` trước đó và đầu vào image Docker đã chuẩn bị khi có,
để một làn thất bại có thể tái sử dụng cùng gói tar và image GHCR.

### QA Lab

Hộp QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành
cho hành vi tác tử và cấp kênh, tách biệt với cơ chế gói Vitest và Docker.

Phạm vi QA Lab phát hành bao gồm:

- làn tương đương mô phỏng so sánh làn ứng viên OpenAI với mốc chuẩn Opus 4.6 bằng gói kiểm tra tương đương hành vi tác tử
- hồ sơ QA Matrix live nhanh dùng môi trường `qa-live-shared`
- làn QA Telegram live dùng thuê thông tin xác thực CI Convex
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng hộp này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA
và luồng kênh live không?" Giữ URL artifact cho các làn tương đương, Matrix và
Telegram khi phê duyệt phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng một
lần chạy QA-Lab thủ công có phân đoạn, thay vì là làn mặc định quan trọng cho
phát hành.

### Gói

Hộp Gói là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi `Package Acceptance`
và trình phân giải `scripts/resolve-openclaw-package-candidate.mjs`. Trình phân
giải chuẩn hóa ứng viên thành gói `package-under-test` tarball được Docker E2E
tiêu thụ, xác thực danh mục gói, ghi lại phiên bản gói và SHA-256, đồng thời giữ
ref bộ khung quy trình tách biệt với ref nguồn gói.

Các nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành OpenClaw chính xác
- `source=ref`: đóng gói nhánh, thẻ hoặc SHA commit đầy đủ `package_ref` đáng tin cậy bằng bộ khung `workflow_ref` đã chọn
- `source=url`: tải xuống `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng `.tgz` do một lần chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, artifact
gói phát hành đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance giữ migration, cập nhật, khởi
động lại cập nhật auth đã cấu hình, dọn dẹp phụ thuộc Plugin cũ, fixture Plugin
ngoại tuyến, cập nhật Plugin và QA gói Telegram trên cùng một gói đã phân giải.
Các release-check chặn phát hành dùng mốc chuẩn gói đã phát hành mới nhất mặc
định; `run_release_soak=true` hoặc `release_profile=full` mở rộng sang mọi mốc
chuẩn npm ổn định đã phát hành từ `2026.4.23` đến `latest` cộng với bộ dữ liệu
kiểm thử cho sự cố đã báo cáo. Dùng Package Acceptance với `source=npm` cho một
ứng viên đã phát hành, hoặc `source=ref`/`source=artifact` cho một gói npm tarball
cục bộ có SHA trước khi phát hành. Đây là giải pháp thay thế nguyên sinh trên
GitHub cho phần lớn phạm vi gói/cập nhật trước đây cần Parallels. Kiểm tra phát
hành đa hệ điều hành vẫn quan trọng đối với onboarding, trình cài đặt và hành vi
nền tảng theo hệ điều hành, nhưng xác thực sản phẩm gói/cập nhật nên ưu tiên
Package Acceptance.

Danh sách kiểm tra chuẩn cho xác thực cập nhật và Plugin là
[Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins). Dùng nó khi quyết
định làn cục bộ, Docker, Package Acceptance hoặc release-check nào chứng minh
một thay đổi cài đặt/cập nhật Plugin, dọn dẹp doctor hoặc migration gói đã phát
hành. Migration cập nhật đã phát hành đầy đủ từ mọi gói ổn định `2026.4.23+` là
một quy trình `Update Migration` thủ công riêng, không phải một phần của CI phát
hành đầy đủ.

Tính nương tay của package-acceptance cũ được cố ý giới hạn thời gian. Các gói đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống siêu dữ liệu đã được phát hành
lên npm: các mục kho kiểm kê QA riêng tư bị thiếu trong tarball, thiếu
`gateway install --wrapper`, thiếu tệp patch trong fixture git sinh từ tarball,
thiếu `update.channel` được lưu bền vững, các vị trí install-record plugin cũ,
thiếu lưu bền vững install-record marketplace, và di chuyển siêu dữ liệu cấu hình
trong `plugins update`. Gói `2026.4.26` đã phát hành có thể cảnh báo
về các tệp dấu siêu dữ liệu build cục bộ đã được phát hành. Các gói sau đó
phải đáp ứng các hợp đồng gói hiện đại; những khoảng trống tương tự sẽ làm xác thực
bản phát hành thất bại.

Dùng các hồ sơ Package Acceptance rộng hơn khi câu hỏi phát hành liên quan đến
một gói có thể cài đặt thực tế:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Các hồ sơ gói phổ biến:

- `smoke`: các làn cài đặt gói/kênh/agent, mạng Gateway và tải lại cấu hình
  nhanh
- `package`: các hợp đồng cài đặt/cập nhật/khởi động lại/gói plugin không có
  ClawHub trực tiếp; đây là mặc định của kiểm tra phát hành
- `product`: `package` cộng với các kênh MCP, dọn dẹp cron/subagent, tìm kiếm web
  OpenAI và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để có bằng chứng Telegram cho package-candidate, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball
`package-under-test` đã phân giải vào làn Telegram; workflow Telegram độc lập
vẫn chấp nhận một spec npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành

`OpenClaw Release Publish` là điểm vào phát hành có thay đổi trạng thái thông thường. Nó
điều phối các workflow trusted-publisher theo thứ tự bản phát hành cần:

1. Check out thẻ phát hành và phân giải SHA commit của thẻ đó.
2. Xác minh thẻ có thể truy cập từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Dispatch `OpenClaw NPM Release` với thẻ phát hành, npm dist-tag và
   `preflight_run_id` đã lưu.

Ví dụ phát hành beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Phát hành ổn định lên dist-tag beta mặc định:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Quảng bá bản ổn định trực tiếp lên `latest` là thao tác tường minh:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa hoặc phát hành lại tập trung. Với một lần sửa Plugin đã chọn, truyền
`plugin_publish_scope=selected` và `plugins=@openclaw/name` cho
`OpenClaw Release Publish`, hoặc dispatch trực tiếp workflow con khi gói
OpenClaw không được phép phát hành.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit
  đầy đủ 40 ký tự hiện tại của nhánh workflow cho preflight chỉ dùng để xác thực
- `preflight_only`: `true` chỉ cho xác thực/build/gói, `false` cho đường dẫn
  phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để workflow tái sử dụng
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: thẻ npm đích cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `npm_dist_tag`: thẻ npm đích cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa tập trung
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng workflow
  làm bộ điều phối sửa chữa chỉ dành cho plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `ref`: nhánh, thẻ hoặc SHA commit đầy đủ cần xác thực. Các kiểm tra có chứa secret
  yêu cầu commit đã phân giải phải có thể truy cập từ một nhánh OpenClaw hoặc
  thẻ phát hành.
- `run_release_soak`: chọn tham gia kiểm thử soak đầy đủ live/E2E, đường dẫn phát hành Docker và
  upgrade-survivor từ trước đến nay trên các kiểm tra phát hành ổn định/mặc định. Nó bị bắt buộc
  bật bởi `release_profile=full`.

Quy tắc:

- Thẻ ổn định và thẻ sửa lỗi có thể phát hành lên `beta` hoặc `latest`
- Thẻ beta prerelease chỉ có thể phát hành lên `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ dùng để
  xác thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh siêu dữ liệu đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi cắt một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi thẻ tồn tại, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh workflow
     cho một lần chạy thử chỉ xác thực của workflow preflight
2. Chọn `npm_dist_tag=beta` cho luồng beta-first thông thường, hoặc `latest` chỉ
   khi bạn cố ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành hoặc SHA commit đầy đủ
   khi bạn muốn CI thông thường cộng với phạm vi bao phủ bộ nhớ đệm prompt trực tiếp, Docker, QA Lab,
   Matrix và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`,
   và `preflight_run_id` đã lưu; nó phát hành các plugin đã tách ra lên npm
   và ClawHub trước khi quảng bá gói npm OpenClaw
7. Nếu bản phát hành được đưa lên `beta`, dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để quảng bá phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý được phát hành trực tiếp lên `latest` và `beta`
   nên theo cùng build ổn định đó ngay lập tức, dùng cùng workflow riêng tư đó
   để trỏ cả hai dist-tag đến phiên bản ổn định, hoặc để đồng bộ tự phục hồi theo lịch
   của nó chuyển `beta` sau

Việc thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật, bởi nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ quy trình phát hành chỉ dùng OIDC.

Điều đó giúp cả đường dẫn phát hành trực tiếp và đường dẫn quảng bá beta-first đều
được ghi tài liệu và hiển thị rõ cho người vận hành.

Nếu một maintainer phải quay về xác thực npm cục bộ, chỉ chạy bất kỳ lệnh CLI
1Password (`op`) nào bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell agent chính; giữ nó trong tmux giúp prompt, cảnh báo và xử lý
OTP quan sát được và ngăn cảnh báo máy chủ lặp lại.

## Tài liệu tham khảo công khai

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainer dùng tài liệu phát hành riêng tư trong
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
cho runbook thực tế.

## Liên quan

- [Kênh phát hành](/vi/install/development-channels)
