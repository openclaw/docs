---
read_when:
    - Đang tìm các định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc nghiệm thu gói
    - Tìm thông tin về cách đặt tên phiên bản và nhịp phát hành
summary: Làn phát hành, danh sách kiểm tra cho người vận hành, hộp xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-07T13:25:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3b9f4875496d7278ba18a8b5cb2735fb870cf32254bfc1fd819e4f233db489e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba luồng phát hành công khai:

- stable: các bản phát hành được gắn thẻ, mặc định xuất bản lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ tiền phát hành xuất bản lên npm `beta`
- dev: đầu nhánh đang thay đổi của `main`

## Cách đặt tên phiên bản

- Phiên bản phát hành stable: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi stable: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản tiền phát hành beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm stable hiện tại đã được quảng bá
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành stable và sửa lỗi stable mặc định xuất bản lên npm `beta`; người vận hành phát hành có thể nhắm rõ ràng tới `latest`, hoặc quảng bá một bản dựng beta đã được thẩm định sau đó
- Mọi bản phát hành stable của OpenClaw đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và xuất bản đường dẫn npm/gói trước, còn
  build/sign/notarize ứng dụng mac được dành cho stable trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Stable chỉ theo sau sau khi beta mới nhất được xác thực
- Maintainer thường cắt bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để quá trình xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc xuất bản và cần sửa lỗi, maintainer cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho maintainer

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, notarization, khôi phục dist-tag và chi tiết rollback khẩn cấp nằm trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: pull mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thực bằng
   `/changelog`, giữ các mục hướng tới người dùng, commit, đẩy, rồi rebase/pull
   thêm một lần trước khi tạo nhánh.
3. Rà soát các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do nó được
   cố ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, chạy
   `pnpm plugins:sync` để các gói Plugin có thể xuất bản dùng chung phiên bản phát hành
   và metadata tương thích, sau đó chạy preflight cục bộ xác định:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, và
   `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA nhánh phát hành đủ 40 ký tự được cho phép cho preflight chỉ xác thực.
   Lưu `preflight_run_id` thành công.
7. Khởi chạy tất cả kiểm thử tiền phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, luồng,
   job workflow, hồ sơ gói, provider hoặc danh sách cho phép model nhỏ nhất đã thất bại
   để chứng minh bản sửa. Chỉ chạy lại toàn bộ lớp bao trùm khi bề mặt thay đổi làm
   bằng chứng trước đó trở nên cũ.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` tương ứng. Workflow này xác minh `pnpm plugins:sync:check`,
   dispatch tất cả gói Plugin có thể xuất bản lên npm và cùng tập đó lên
   ClawHub song song, rồi quảng bá artifact preflight npm OpenClaw đã chuẩn bị
   với dist-tag tương ứng ngay khi xuất bản npm Plugin thành công.
   Xuất bản ClawHub vẫn có thể đang chạy trong khi npm OpenClaw được xuất bản, nhưng
   workflow phát hành không kết thúc cho đến khi cả hai đường dẫn xuất bản Plugin và
   đường dẫn xuất bản npm OpenClaw đều hoàn tất thành công. Sau khi xuất bản, chạy
   quy trình chấp nhận gói sau xuất bản
   đối với gói `openclaw@YYYY.M.D-beta.N` hoặc
   `openclaw@beta` đã xuất bản. Nếu một tiền phát hành đã đẩy hoặc xuất bản cần sửa lỗi,
   cắt số tiền phát hành tương ứng tiếp theo; không xóa hoặc viết lại tiền phát hành cũ.
10. Với stable, chỉ tiếp tục sau khi beta đã thẩm định hoặc release candidate có
    bằng chứng xác thực bắt buộc. Xuất bản npm stable cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công qua
    `preflight_run_id`; mức sẵn sàng phát hành stable macOS cũng yêu cầu
    `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói, và `appcast.xml` đã cập nhật trên `main`.
11. Sau khi xuất bản, chạy trình xác minh npm sau xuất bản, E2E Telegram npm đã xuất bản độc lập tùy chọn khi bạn cần bằng chứng kênh sau xuất bản,
    quảng bá dist-tag khi cần, ghi chú phát hành/tiền phát hành GitHub từ
    phần `CHANGELOG.md` tương ứng đầy đủ, và các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước preflight phát hành để TypeScript của kiểm thử vẫn được
  bao phủ ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước preflight phát hành để các kiểm tra chu trình import
  và ranh giới kiến trúc rộng hơn đều xanh ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành
  `dist/*` dự kiến và bundle Control UI tồn tại cho bước xác thực đóng gói
- Chạy `pnpm plugins:sync` sau khi tăng phiên bản gốc và trước khi gắn tag. Lệnh này
  cập nhật phiên bản gói plugin có thể publish, metadata tương thích peer/API của OpenClaw,
  metadata build, và stub changelog plugin để khớp với phiên bản phát hành lõi.
  `pnpm plugins:sync:check` là bộ gác phát hành không thay đổi dữ liệu; workflow publish
  sẽ thất bại trước bất kỳ thay đổi registry nào nếu bước này bị quên.
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi động tất cả hộp kiểm thử tiền phát hành từ một điểm vào. Nó chấp nhận branch,
  tag, hoặc SHA commit đầy đủ, dispatch `CI` thủ công, và dispatch
  `OpenClaw Release Checks` cho install smoke, package acceptance, kiểm tra gói đa hệ điều hành,
  QA Lab parity, Matrix, và các lane Telegram. Các lần chạy stable/mặc định giữ
  live/E2E đầy đủ và soak đường dẫn phát hành Docker phía sau
  `run_release_soak=true`; `release_profile=full` buộc bật soak. Với
  `release_profile=full` và `rerun_group=all`, nó cũng chạy package Telegram
  E2E với artifact `release-package-under-test` từ release checks.
  Cung cấp `npm_telegram_package_spec` sau khi publish khi cùng Telegram E2E
  cũng cần chứng minh gói npm đã publish. Cung cấp
  `package_acceptance_package_spec` sau khi publish khi Package Acceptance
  cần chạy ma trận package/update của nó với gói npm đã phát hành thay vì
  artifact được build từ SHA. Cung cấp
  `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng
  xác thực khớp với gói npm đã publish mà không buộc chạy Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng kênh phụ
  cho một ứng viên gói trong khi công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref`
  để đóng gói branch/tag/SHA `package_ref` đáng tin cậy với harness
  `workflow_ref` hiện tại; `source=url` cho tarball HTTPS với SHA-256 bắt buộc;
  hoặc `source=artifact` cho tarball do một lần chạy GitHub Actions khác upload.
  Workflow phân giải ứng viên thành
  `package-under-test`, tái sử dụng bộ lập lịch Docker E2E release với tarball đó,
  và có thể chạy Telegram QA với cùng tarball bằng
  `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các lane
  Docker được chọn bao gồm `published-upgrade-survivor`, artifact gói là ứng viên
  và `published_upgrade_survivor_baseline` chọn baseline đã publish.
  `update-restart-auth` dùng gói ứng viên làm cả CLI đã cài đặt lẫn package-under-test
  để nó thực thi đường dẫn restart được quản lý của lệnh update ứng viên.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Các profile thông dụng:
  - `smoke`: các lane install/channel/agent, mạng gateway, và tải lại config
  - `package`: các lane package/update/restart/plugin gốc-artifact mà không có OpenWebUI hoặc ClawHub live
  - `product`: profile package cộng thêm kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các đoạn đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần bao phủ CI bình thường đầy đủ
  cho ứng viên phát hành. Dispatch CI thủ công bỏ qua phạm vi changed
  và buộc các shard Linux Node, shard bundled-plugin, hợp đồng channel,
  tương thích Node 22, `check`, `check-additional`, build smoke,
  kiểm tra docs, Python skills, Windows, macOS, Android, và các lane i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Nó thực thi
  QA-lab qua một bộ nhận OTLP/HTTP cục bộ và xác minh tên span trace đã export,
  thuộc tính có giới hạn, và biên tập nội dung/định danh mà không cần Opik,
  Langfuse, hoặc collector bên ngoài khác.
- Chạy `pnpm release:check` trước mọi phát hành được gắn tag
- Chạy `OpenClaw Release Publish` cho chuỗi publish có thay đổi dữ liệu sau khi
  tag tồn tại. Dispatch nó từ `release/YYYY.M.D` (hoặc `main` khi publish một
  tag có thể truy cập từ main), truyền tag phát hành và `preflight_run_id`
  OpenClaw npm thành công, và giữ phạm vi publish plugin mặc định
  `all-publishable` trừ khi bạn cố ý chạy sửa chữa tập trung. Workflow tuần tự hóa
  publish npm plugin, publish plugin ClawHub, và publish npm OpenClaw để gói lõi
  không được publish trước các plugin đã externalize của nó.
- Release checks hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane QA Lab mock parity cùng profile Matrix
  live nhanh và lane Telegram QA trước khi phê duyệt phát hành. Các lane live
  dùng môi trường `qa-live-shared`; Telegram cũng dùng lease thông tin xác thực Convex CI.
  Chạy workflow thủ công `QA-Lab - All Lanes` với
  `matrix_profile=all` và `matrix_shards=true` khi bạn muốn đầy đủ inventory vận chuyển,
  media, và E2EE của Matrix chạy song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của
  `OpenClaw Release Checks` công khai và `Full Release Validation`, vốn gọi trực tiếp
  workflow tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ đích: giữ đường dẫn phát hành npm thật ngắn,
  xác định được, và tập trung vào artifact, trong khi các kiểm tra live chậm hơn ở lane riêng
  để chúng không làm đình trệ hoặc chặn publish
- Các release check mang secret nên được dispatch qua `Full Release
Validation` hoặc từ workflow ref `main`/release để logic workflow và
  secret luôn được kiểm soát
- `OpenClaw Release Checks` chấp nhận branch, tag, hoặc SHA commit đầy đủ miễn là
  commit đã phân giải có thể truy cập từ một branch OpenClaw hoặc tag phát hành
- Preflight chỉ xác thực của `OpenClaw NPM Release` cũng chấp nhận SHA commit
  workflow-branch 40 ký tự đầy đủ hiện tại mà không yêu cầu tag đã push
- Đường dẫn SHA đó chỉ dành cho xác thực và không thể được thăng cấp thành publish thật
- Ở chế độ SHA, workflow chỉ tổng hợp `v<package.json version>` cho kiểm tra
  metadata gói; publish thật vẫn yêu cầu tag phát hành thật
- Cả hai workflow giữ đường dẫn publish và thăng cấp thật trên runner do GitHub host,
  trong khi đường dẫn xác thực không thay đổi dữ liệu có thể dùng runner
  Blacksmith Linux lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Preflight phát hành npm không còn chờ lane release checks riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc tag beta/correction tương ứng) trước khi phê duyệt
- Sau khi publish npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/correction tương ứng) để xác minh đường dẫn cài đặt registry
  đã publish trong một prefix tạm mới
- Sau khi publish beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding gói đã cài đặt, thiết lập Telegram, và Telegram E2E thật
  với gói npm đã publish bằng nhóm thông tin xác thực Telegram thuê dùng chung.
  Các lần chạy một lần cục bộ của maintainer có thể bỏ qua biến Convex và truyền trực tiếp ba
  thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy smoke beta hậu publish đầy đủ từ máy maintainer, dùng `pnpm release:beta-smoke -- --beta betaN`. Helper chạy xác thực npm update/fresh-target trên Parallels, dispatch `NPM Telegram Beta E2E`, poll đúng workflow run, tải artifact, và in báo cáo Telegram.
- Maintainer có thể chạy cùng kiểm tra hậu publish từ GitHub Actions qua
  workflow thủ công `NPM Telegram Beta E2E`. Nó cố ý chỉ chạy thủ công và
  không chạy trên mọi lần merge.
- Tự động hóa phát hành của maintainer hiện dùng preflight-rồi-promote:
  - publish npm thật phải vượt qua một npm `preflight_run_id` thành công
  - publish npm thật phải được dispatch từ cùng branch `main` hoặc
    `release/YYYY.M.D` với lần chạy preflight thành công
  - phát hành npm stable mặc định là `beta`
  - publish npm stable có thể nhắm rõ `latest` qua input workflow
  - thay đổi npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    vì lý do bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo
    công khai giữ publish chỉ dùng OIDC
  - `macOS Release` công khai chỉ dùng để xác thực; khi một tag chỉ nằm trên
    branch phát hành nhưng workflow được dispatch từ `main`, đặt
    `public_release_branch=release/YYYY.M.D`
  - publish mac riêng tư thật phải vượt qua `preflight_run_id` và
    `validate_run_id` mac riêng tư thành công
  - các đường dẫn publish thật thăng cấp artifact đã chuẩn bị thay vì build lại
    chúng lần nữa
- Với các bản phát hành sửa lỗi stable như `YYYY.M.D-N`, bộ xác minh hậu publish
  cũng kiểm tra cùng đường dẫn nâng cấp prefix tạm từ `YYYY.M.D` lên `YYYY.M.D-N`
  để các bản sửa phát hành không thể âm thầm để các cài đặt global cũ ở payload
  stable gốc
- Preflight phát hành npm thất bại đóng trừ khi tarball bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không phát hành lại dashboard trình duyệt trống
- Xác minh hậu publish cũng kiểm tra rằng entrypoint plugin đã publish và
  metadata gói có mặt trong bố cục registry đã cài đặt. Một bản phát hành
  thiếu payload runtime plugin sẽ làm bộ xác minh postpublish thất bại và
  không thể được thăng cấp lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của npm pack trên
  tarball update ứng viên, để installer e2e phát hiện phình to gói ngoài ý muốn
  trước đường dẫn publish phát hành
- Nếu công việc phát hành chạm đến lập kế hoạch CI, manifest thời gian extension, hoặc
  ma trận kiểm thử extension, hãy tạo lại và rà soát các output ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để release notes
  không mô tả bố cục CI đã cũ
- Mức sẵn sàng phát hành macOS stable cũng bao gồm các bề mặt updater:
  - GitHub release phải có `.zip`, `.dmg`, và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ đến zip stable mới sau khi publish
  - app đã đóng gói phải giữ bundle id không debug, URL feed Sparkle không rỗng,
    và `CFBundleVersion` bằng hoặc cao hơn sàn build Sparkle canonical
    cho phiên bản phát hành đó

## Hộp kiểm thử phát hành

`Full Release Validation` là cách operator khởi động tất cả kiểm thử tiền phát hành từ
một điểm vào. Để có bằng chứng commit cố định trên một branch thay đổi nhanh, dùng
helper để mọi workflow con chạy từ một branch tạm thời cố định tại SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper push `release-ci/<sha>-...`, dispatch `Full Release Validation`
từ branch đó với `ref=<sha>`, xác minh mọi workflow con `headSha`
khớp với mục tiêu, rồi xóa branch tạm thời. Điều này tránh vô tình chứng minh
một lần chạy con `main` mới hơn.

Để xác thực branch phát hành hoặc tag, chạy nó từ workflow ref `main` đáng tin cậy
và truyền branch phát hành hoặc tag làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Quy trình làm việc phân giải ref mục tiêu, kích hoạt thủ công `CI` với
`target_ref=<release-ref>`, kích hoạt `OpenClaw Release Checks`, chuẩn bị một
artifact cha `release-package-under-test` cho các kiểm tra hướng đến gói, và
kích hoạt Telegram E2E gói độc lập khi `release_profile=full` với
`rerun_group=all` hoặc khi `npm_telegram_package_spec` được đặt. Sau đó `OpenClaw Release
Checks` phân nhánh ra smoke cài đặt, kiểm tra phát hành đa hệ điều hành, phạm vi
đường dẫn phát hành Docker live/E2E khi soak được bật, Package Acceptance với QA
gói Telegram, tính tương đương QA Lab, Matrix live và Telegram live. Một lượt chạy đầy đủ chỉ được chấp nhận khi
tóm tắt `Full Release Validation`
hiển thị `normal_ci` và `release_checks` thành công. Ở chế độ full/all,
luồng con `npm_telegram` cũng phải thành công; ngoài full/all, nó được bỏ qua
trừ khi đã cung cấp một `npm_telegram_package_spec` đã phát hành. Tóm tắt
xác minh cuối cùng bao gồm các bảng công việc chậm nhất cho từng lượt chạy con, để người quản lý phát hành
có thể thấy đường găng hiện tại mà không cần tải nhật ký.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn hoàn chỉnh, tên công việc quy trình làm việc chính xác, khác biệt giữa hồ sơ stable và full,
artifact và các tay nắm chạy lại tập trung.
Các quy trình làm việc con được kích hoạt từ ref tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` mục tiêu trỏ đến một
nhánh hoặc thẻ phát hành cũ hơn. Không có đầu vào ref quy trình làm việc Full Release Validation
riêng; chọn harness tin cậy bằng cách chọn ref chạy quy trình làm việc.
Không dùng `--ref main -f ref=<sha>` để làm bằng chứng commit chính xác trên `main` đang di chuyển;
SHA commit thô không thể là ref kích hoạt quy trình làm việc, vì vậy hãy dùng
`pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn độ rộng live/nhà cung cấp:

- `minimum`: đường dẫn OpenAI/core live và Docker tối thiểu, nhanh nhất, trọng yếu cho phát hành
- `stable`: minimum cộng với phạm vi nhà cung cấp/backend stable để phê duyệt phát hành
- `full`: stable cộng với phạm vi rộng cho nhà cung cấp/media mang tính tư vấn

Dùng `run_release_soak=true` với `stable` khi các lane chặn phát hành đã
xanh và bạn muốn đợt quét live/E2E, đường dẫn phát hành Docker, và
upgrade-survivor đã phát hành có giới hạn nhưng toàn diện trước khi quảng bá. Đợt quét đó bao phủ
bốn gói stable mới nhất cộng với các baseline `2026.4.23` và `2026.5.2`
đã ghim, cộng với phạm vi `2026.4.15` cũ hơn, với baseline trùng lặp được loại bỏ và
mỗi baseline được chia shard vào công việc runner Docker riêng. `full` ngụ ý
`run_release_soak=true`.

`OpenClaw Release Checks` dùng ref quy trình làm việc tin cậy để phân giải ref mục tiêu
một lần thành `release-package-under-test` và tái sử dụng artifact đó trong các kiểm tra đa hệ điều hành,
Package Acceptance và Docker đường dẫn phát hành khi soak chạy. Điều này giữ
tất cả hộp hướng đến gói trên cùng một byte và tránh xây dựng gói lặp lại.
Smoke cài đặt OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4`, vì lane này đang
chứng minh cài đặt gói, onboarding, khởi động Gateway và một lượt tác nhân live
thay vì benchmark mô hình mặc định chậm nhất. Ma trận nhà cung cấp live rộng hơn
vẫn là nơi dành cho phạm vi theo mô hình cụ thể.

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

Đừng dùng umbrella đầy đủ làm lượt chạy lại đầu tiên sau một bản sửa tập trung. Nếu một hộp
thất bại, hãy dùng quy trình làm việc con, công việc, lane Docker, hồ sơ gói, nhà cung cấp
mô hình hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi
bản sửa đã thay đổi điều phối phát hành dùng chung hoặc làm bằng chứng all-box trước đó
trở nên lỗi thời. Bộ xác minh cuối cùng của umbrella kiểm tra lại các id lượt chạy quy trình làm việc con
đã ghi, vì vậy sau khi một quy trình làm việc con được chạy lại thành công, chỉ chạy lại công việc cha
`Verify full validation` đã thất bại.

Để phục hồi có giới hạn, truyền `rerun_group` cho umbrella. `all` là lượt chạy
ứng viên phát hành thực sự, `ci` chỉ chạy luồng con CI thông thường, `plugin-prerelease`
chỉ chạy luồng con Plugin chỉ dành cho phát hành, `release-checks` chạy mọi hộp phát hành,
và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` và `npm-telegram`.
Các lượt chạy lại `npm-telegram` tập trung yêu cầu `npm_telegram_package_spec`; các lượt chạy full/all
với `release_profile=full` dùng artifact gói release-checks. Các lượt chạy lại
đa hệ điều hành tập trung có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc
bộ lọc hệ điều hành/bộ kiểm thử khác. Các lỗi kiểm tra phát hành QA mang tính tư vấn; lỗi chỉ QA
không chặn xác thực phát hành.

### Vitest

Hộp Vitest là quy trình làm việc con `CI` thủ công. CI thủ công cố ý
bỏ qua phạm vi thay đổi và buộc đồ thị kiểm thử thông thường cho ứng viên phát hành:
các shard Linux Node, shard bundled-plugin, hợp đồng kênh, khả năng tương thích Node 22,
`check`, `check-additional`, smoke build, kiểm tra tài liệu, Skills Python,
Windows, macOS, Android và i18n Control UI.

Dùng hộp này để trả lời “cây mã nguồn đã vượt qua bộ kiểm thử thông thường đầy đủ chưa?”
Nó không giống xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần giữ:

- tóm tắt `Full Release Validation` hiển thị URL lượt chạy `CI` đã kích hoạt
- lượt chạy `CI` xanh trên SHA mục tiêu chính xác
- tên shard thất bại hoặc chậm từ các công việc CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lượt chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI thông thường xác định nhưng
không cần các hộp Docker, QA Lab, live, đa hệ điều hành hoặc gói:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Hộp Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với quy trình làm việc
`install-smoke` ở chế độ phát hành. Nó xác thực ứng viên phát hành thông qua các
môi trường Docker đã đóng gói thay vì chỉ các kiểm thử cấp mã nguồn.

Phạm vi Docker phát hành bao gồm:

- smoke cài đặt đầy đủ với smoke cài đặt toàn cục Bun chậm được bật
- chuẩn bị/tái sử dụng ảnh smoke Dockerfile gốc theo SHA mục tiêu, với các công việc smoke QR,
  root/gateway và installer/Bun chạy như các shard install-smoke riêng
- các lane E2E kho lưu trữ
- các chunk Docker đường dẫn phát hành: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài đặt/gỡ cài đặt Plugin đóng gói đã tách
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các bộ kiểm thử nhà cung cấp live/E2E và phạm vi mô hình live Docker khi kiểm tra phát hành
  bao gồm bộ kiểm thử live

Dùng artifact Docker trước khi chạy lại. Bộ lập lịch đường dẫn phát hành tải lên
`.artifacts/docker-tests/` với nhật ký lane, `summary.json`, `failures.json`,
thời gian pha, JSON kế hoạch bộ lập lịch và lệnh chạy lại. Để phục hồi tập trung,
dùng `docker_lanes=<lane[,lane]>` trên quy trình làm việc live/E2E tái sử dụng thay vì
chạy lại tất cả chunk phát hành. Các lệnh chạy lại được tạo bao gồm
`package_artifact_run_id` trước đó và đầu vào ảnh Docker đã chuẩn bị khi có, để một
lane thất bại có thể tái sử dụng cùng tarball và ảnh GHCR.

### QA Lab

Hộp QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành
hành vi tác nhân và cấp kênh, tách biệt với cơ chế gói Vitest và Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane tương đương mock so sánh lane ứng viên OpenAI với baseline Opus 4.6
  bằng gói tương đương tác nhân
- hồ sơ QA Matrix live nhanh dùng môi trường `qa-live-shared`
- lane QA Telegram live dùng lease thông tin xác thực Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng hộp này để trả lời “bản phát hành có hoạt động đúng trong các kịch bản QA và
luồng kênh live không?” Giữ URL artifact cho các lane tương đương, Matrix và Telegram
khi phê duyệt bản phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng
lượt chạy QA-Lab thủ công chia shard thay vì lane trọng yếu phát hành mặc định.

### Gói

Hộp Gói là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và bộ phân giải
`scripts/resolve-openclaw-package-candidate.mjs`. Bộ phân giải chuẩn hóa một
ứng viên thành tarball `package-under-test` được Docker E2E tiêu thụ, xác thực
inventory gói, ghi lại phiên bản gói và SHA-256, và giữ ref harness
quy trình làm việc tách biệt với ref nguồn gói.

Nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành OpenClaw
  chính xác
- `source=ref`: đóng gói một nhánh, thẻ hoặc SHA commit đầy đủ `package_ref` tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` do lượt chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, artifact
gói phát hành đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance giữ migration, update,
khởi động lại update với xác thực đã cấu hình, dọn dẹp dependency Plugin cũ, fixture Plugin offline,
update Plugin và QA gói Telegram trên cùng tarball đã phân giải. Các kiểm tra phát hành chặn dùng
baseline gói đã phát hành mới nhất mặc định; `run_release_soak=true` hoặc
`release_profile=full` mở rộng đến mọi baseline npm-published stable từ
`2026.4.23` đến `latest` cộng với fixture vấn đề đã báo cáo. Dùng
Package Acceptance với `source=npm` cho một ứng viên đã phát hành, hoặc
`source=ref`/`source=artifact` cho tarball npm cục bộ có SHA làm hậu thuẫn trước khi
phát hành. Đây là thay thế gốc GitHub cho phần lớn phạm vi gói/update trước đây cần
Parallels. Kiểm tra phát hành đa hệ điều hành vẫn quan trọng cho onboarding,
trình cài đặt và hành vi nền tảng theo hệ điều hành, nhưng xác thực sản phẩm gói/update nên
ưu tiên Package Acceptance.

Checklist chuẩn cho xác thực update và Plugin là
[Kiểm thử update và Plugin](/vi/help/testing-updates-plugins). Dùng nó khi
quyết định lane cục bộ, Docker, Package Acceptance hoặc release-check nào chứng minh một
thay đổi cài đặt/update Plugin, dọn dẹp doctor hoặc migration gói đã phát hành.
Migration update đã phát hành toàn diện từ mọi gói stable `2026.4.23+` là
một quy trình làm việc `Update Migration` thủ công riêng, không thuộc Full Release CI.

Sự nới lỏng kiểm nhận gói kế thừa được cố ý giới hạn thời gian. Các gói đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống siêu dữ liệu đã được phát hành
lên npm: các mục kiểm kê QA riêng tư bị thiếu trong tarball, thiếu
`gateway install --wrapper`, thiếu tệp bản vá trong fixture git bắt nguồn từ tarball,
thiếu `update.channel` đã lưu, vị trí bản ghi cài đặt Plugin kế thừa,
thiếu lưu trữ bản ghi cài đặt marketplace, và di chuyển siêu dữ liệu cấu hình
trong quá trình `plugins update`. Gói `2026.4.26` đã phát hành có thể cảnh báo
về các tệp dấu siêu dữ liệu bản dựng cục bộ đã được phát hành. Các gói về sau
phải đáp ứng các hợp đồng gói hiện đại; những khoảng trống tương tự sẽ làm
kiểm định phát hành thất bại.

Dùng các hồ sơ Package Acceptance rộng hơn khi câu hỏi phát hành liên quan đến
một gói thực sự có thể cài đặt:

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

- `smoke`: các làn cài đặt gói/kênh/agent nhanh, mạng Gateway, và tải lại
  cấu hình
- `package`: các hợp đồng cài đặt/cập nhật/khởi động lại/gói Plugin không có
  ClawHub trực tiếp; đây là mặc định kiểm tra phát hành
- `product`: `package` cộng với các kênh MCP, dọn dẹp cron/subagent, tìm kiếm
  web OpenAI, và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để có bằng chứng Telegram cho ứng viên gói, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball
`package-under-test` đã phân giải vào làn Telegram; workflow Telegram độc lập
vẫn chấp nhận một đặc tả npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành

`OpenClaw Release Publish` là điểm vào phát hành có thay đổi thông thường. Nó
điều phối các workflow trusted-publisher theo thứ tự mà bản phát hành cần:

1. Check out tag phát hành và phân giải SHA commit của tag đó.
2. Xác minh tag có thể truy cập từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Dispatch `OpenClaw NPM Release` với tag phát hành, dist-tag npm, và
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

Promote bản ổn định trực tiếp lên `latest` là thao tác tường minh:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa hoặc phát hành lại tập trung. Với một lần sửa Plugin được chọn,
truyền `plugin_publish_scope=selected` và `plugins=@openclaw/name` vào
`OpenClaw Release Publish`, hoặc dispatch trực tiếp workflow con khi không được
phát hành gói OpenClaw.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: tag phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit
  đầy đủ 40 ký tự hiện tại của nhánh workflow cho preflight chỉ để kiểm định
- `preflight_only`: `true` chỉ để kiểm định/bản dựng/gói, `false` cho đường dẫn
  phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để workflow tái sử dụng
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: tag đích npm cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: tag phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `npm_dist_tag`: tag đích npm cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa tập trung
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng workflow
  làm bộ điều phối sửa chữa chỉ dành cho Plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `ref`: nhánh, tag, hoặc SHA commit đầy đủ cần kiểm định. Các kiểm tra chứa
  bí mật yêu cầu commit đã phân giải phải có thể truy cập từ một nhánh OpenClaw
  hoặc tag phát hành.
- `run_release_soak`: chọn tham gia soak trực tiếp/E2E toàn diện, đường dẫn phát hành
  Docker, và upgrade-survivor từ đầu đến nay trên các kiểm tra phát hành ổn định/mặc định.
  Nó bị buộc bật bởi `release_profile=full`.

Quy tắc:

- Tag ổn định và tag sửa lỗi có thể phát hành lên `beta` hoặc `latest`
- Tag prerelease beta chỉ có thể phát hành lên `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ để kiểm định
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh siêu dữ liệu đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi cắt một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi có tag, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh workflow
     cho một lần chạy thử workflow preflight chỉ để kiểm định
2. Chọn `npm_dist_tag=beta` cho luồng beta trước thông thường, hoặc `latest` chỉ
   khi bạn cố ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, tag phát hành, hoặc SHA
   commit đầy đủ khi bạn muốn CI thông thường cộng với phạm vi bao phủ bộ nhớ đệm prompt
   trực tiếp, Docker, QA Lab, Matrix, và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, thay vào đó
   chạy workflow `CI` thủ công trên ref phát hành
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`,
   và `preflight_run_id` đã lưu; nó phát hành các Plugin đã externalize lên npm
   và ClawHub trước khi promote gói npm OpenClaw
7. Nếu bản phát hành đã lên `beta`, dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để promote phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý phát hành trực tiếp lên `latest` và `beta`
   nên theo cùng bản dựng ổn định ngay lập tức, dùng cùng workflow riêng tư đó
   để trỏ cả hai dist-tag vào phiên bản ổn định, hoặc để quá trình đồng bộ
   tự phục hồi theo lịch của nó chuyển `beta` sau

Việc thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật, do nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ phát hành chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn phát hành trực tiếp và đường dẫn promote beta trước
đều được ghi tài liệu và hiển thị với người vận hành.

Nếu maintainer phải quay về xác thực npm cục bộ, chỉ chạy mọi lệnh CLI 1Password
(`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op` trực tiếp từ shell agent
chính; giữ nó bên trong tmux giúp các prompt, cảnh báo, và xử lý OTP có thể quan sát
được và ngăn cảnh báo máy chủ lặp lại.

## Tham chiếu công khai

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
