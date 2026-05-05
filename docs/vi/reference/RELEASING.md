---
read_when:
    - Đang tìm các định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc chấp nhận gói
    - Tìm cách đặt tên phiên bản và nhịp phát hành
summary: Luồng phát hành, danh sách kiểm tra cho người vận hành, máy xác thực, cách đặt tên phiên bản và nhịp độ
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-05T06:18:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9980265c30c6a6571db5512749ec173cca79ac70494fd09968add793be9717a5
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba kênh phát hành công khai:

- stable: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ tiền phát hành phát hành lên npm `beta`
- dev: đầu đang thay đổi của `main`

## Đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản tiền phát hành beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm ổn định hiện tại đã được promoted
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành ổn định và sửa lỗi ổn định mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm rõ ràng tới `latest`, hoặc promote một bản dựng beta đã được thẩm định sau đó
- Mỗi bản phát hành OpenClaw ổn định phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/gói trước, còn
  việc dựng/ký/công chứng ứng dụng mac được dành cho ổn định trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Bản ổn định chỉ theo sau sau khi bản beta mới nhất đã được xác thực
- Maintainer thường cắt bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc phát hành và cần sửa lỗi, maintainer cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho maintainer

## Danh sách kiểm tra của người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag và chi tiết khôi phục khẩn cấp nằm trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: kéo mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thực bằng
   `/changelog`, giữ các mục hướng đến người dùng, commit, đẩy, rồi rebase/kéo
   thêm một lần trước khi tạo nhánh.
3. Xem lại các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do nó được chủ ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, chạy
   `pnpm plugins:sync` để các gói Plugin có thể phát hành dùng chung phiên bản phát hành
   và metadata tương thích, rồi chạy preflight tất định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, và
   `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA nhánh phát hành đầy đủ 40 ký tự được phép dùng cho preflight chỉ xác thực.
   Lưu `preflight_run_id` thành công.
7. Khởi chạy toàn bộ kiểm thử tiền phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, kênh, job workflow,
   hồ sơ gói, provider hoặc allowlist model nhỏ nhất đã thất bại để chứng minh bản sửa.
   Chỉ chạy lại toàn bộ umbrella khi bề mặt thay đổi làm bằng chứng trước đó lỗi thời.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` tương ứng. Nó xác minh `pnpm plugins:sync:check`,
   phát hành tất cả gói Plugin có thể phát hành lên npm trước, phát hành cùng tập hợp đó
   lên ClawHub thứ hai dưới dạng tarball ClawPack npm-pack, rồi promote artifact
   preflight npm OpenClaw đã chuẩn bị với dist-tag tương ứng. Sau khi phát hành,
   chạy kiểm định chấp nhận gói sau phát hành với gói
   `openclaw@YYYY.M.D-beta.N` hoặc `openclaw@beta` đã phát hành. Nếu một tiền phát hành
   đã được đẩy hoặc phát hành cần sửa lỗi, cắt số tiền phát hành tương ứng tiếp theo;
   không xóa hoặc viết lại tiền phát hành cũ.
10. Với ổn định, chỉ tiếp tục sau khi beta đã được thẩm định hoặc release candidate có
    bằng chứng xác thực bắt buộc. Việc phát hành npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công qua
    `preflight_run_id`; mức sẵn sàng phát hành macOS ổn định cũng yêu cầu các gói
    `.zip`, `.dmg`, `.dSYM.zip` và `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy trình xác minh npm sau phát hành, E2E Telegram npm đã phát hành
    độc lập tùy chọn khi bạn cần bằng chứng kênh sau phát hành, promote dist-tag khi cần,
    ghi chú bản phát hành/tiền phát hành GitHub từ phần `CHANGELOG.md` đầy đủ tương ứng,
    và các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước preflight phát hành để TypeScript của kiểm thử vẫn
  được bao phủ bên ngoài gate `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước preflight phát hành để các kiểm tra chu kỳ
  import rộng hơn và ranh giới kiến trúc đều xanh bên ngoài gate cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact
  phát hành `dist/*` dự kiến và bundle Control UI tồn tại cho bước xác thực pack
- Chạy `pnpm plugins:sync` sau khi bump phiên bản gốc và trước khi gắn tag. Lệnh này
  cập nhật phiên bản gói Plugin có thể phát hành, metadata tương thích peer/API của
  OpenClaw, metadata build và stub changelog Plugin để khớp với phiên bản phát hành
  lõi. `pnpm plugins:sync:check` là guard phát hành không thay đổi dữ liệu; workflow
  phát hành sẽ thất bại trước bất kỳ thay đổi registry nào nếu bước này bị quên.
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi chạy mọi hộp kiểm thử trước phát hành từ một điểm vào. Workflow này nhận một
  branch, tag hoặc SHA commit đầy đủ, dispatch `CI` thủ công, và dispatch
  `OpenClaw Release Checks` cho install smoke, package acceptance, kiểm tra gói
  cross-OS, tương đồng QA Lab, Matrix và các lane Telegram. Các lần chạy stable/default
  giữ live/E2E đầy đủ và soak đường dẫn phát hành Docker sau `run_release_soak=true`;
  `release_profile=full` buộc bật soak. Với `release_profile=full` và `rerun_group=all`,
  workflow này cũng chạy package Telegram E2E với artifact `release-package-under-test`
  từ release checks. Cung cấp `npm_telegram_package_spec` sau khi phát hành khi cùng
  Telegram E2E cũng cần chứng minh gói npm đã phát hành. Cung cấp
  `package_acceptance_package_spec` sau khi phát hành khi Package Acceptance cần chạy
  ma trận package/update của nó với gói npm đã giao thay vì artifact build từ SHA.
  Cung cấp `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng
  xác thực khớp với một gói npm đã phát hành mà không buộc chạy Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn có bằng chứng kênh phụ
  cho một ứng viên gói trong khi công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành chính xác; `source=ref`
  để pack một branch/tag/SHA `package_ref` đáng tin cậy với harness `workflow_ref`
  hiện tại; `source=url` cho tarball HTTPS với SHA-256 bắt buộc; hoặc `source=artifact`
  cho tarball được tải lên bởi một lần chạy GitHub Actions khác. Workflow phân giải
  ứng viên thành `package-under-test`, tái sử dụng bộ lập lịch phát hành Docker E2E
  với tarball đó, và có thể chạy QA Telegram với cùng tarball bằng
  `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các lane Docker
  được chọn bao gồm `published-upgrade-survivor`, artifact gói là ứng viên và
  `published_upgrade_survivor_baseline` chọn baseline đã phát hành.
  `update-restart-auth` dùng gói ứng viên làm cả CLI đã cài đặt lẫn package-under-test
  để nó kiểm thử đường dẫn restart được quản lý của lệnh update ứng viên.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Các profile phổ biến:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway và tải lại cấu hình
  - `package`: các lane package/update/restart/Plugin native theo artifact không có OpenWebUI hoặc ClawHub live
  - `product`: profile package cộng với kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần mức bao phủ CI bình thường
  đầy đủ cho ứng viên phát hành. Dispatch CI thủ công bỏ qua phạm vi changed và buộc
  các shard Linux Node, shard bundled-plugin, hợp đồng kênh, tương thích Node 22,
  `check`, `check-additional`, build smoke, kiểm tra docs, Python skills, Windows,
  macOS, Android và các lane i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này kiểm thử
  QA-lab thông qua receiver OTLP/HTTP cục bộ và xác minh tên span trace đã xuất,
  thuộc tính có giới hạn, và việc biên tập nội dung/định danh mà không cần Opik,
  Langfuse hoặc collector bên ngoài khác.
- Chạy `pnpm release:check` trước mọi bản phát hành có tag
- Chạy `OpenClaw Release Publish` cho chuỗi publish có thay đổi sau khi tag tồn tại.
  Dispatch nó từ `release/YYYY.M.D` (hoặc `main` khi phát hành một tag có thể truy
  cập từ main), truyền tag phát hành và `preflight_run_id` npm OpenClaw thành công,
  và giữ phạm vi publish Plugin mặc định `all-publishable` trừ khi bạn đang cố ý chạy
  một sửa chữa tập trung. Workflow tuần tự hóa publish npm Plugin, publish ClawHub
  Plugin và publish npm OpenClaw để gói lõi không được phát hành trước các Plugin đã
  được externalize của nó.
- Release checks hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane tương đồng mô phỏng QA Lab cùng với
  profile Matrix live nhanh và lane QA Telegram trước khi phê duyệt phát hành. Các
  lane live dùng môi trường `qa-live-shared`; Telegram cũng dùng lease thông tin xác
  thực Convex CI. Chạy workflow thủ công `QA-Lab - All Lanes` với
  `matrix_profile=all` và `matrix_shards=true` khi bạn muốn đầy đủ inventory vận
  chuyển Matrix, media và E2EE chạy song song.
- Xác thực runtime cài đặt và nâng cấp cross-OS là một phần của
  `OpenClaw Release Checks` và `Full Release Validation` công khai, vốn gọi trực tiếp
  workflow tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ đích: giữ đường dẫn phát hành npm thật ngắn, xác định và
  tập trung vào artifact, trong khi các kiểm tra live chậm hơn ở lane riêng để chúng
  không làm chậm hoặc chặn publish
- Các release checks mang secret nên được dispatch qua `Full Release
Validation` hoặc từ workflow ref `main`/release để logic workflow và
  secret vẫn được kiểm soát
- `OpenClaw Release Checks` nhận một branch, tag hoặc SHA commit đầy đủ miễn là
  commit đã phân giải có thể truy cập từ một branch OpenClaw hoặc tag phát hành
- Preflight chỉ xác thực `OpenClaw NPM Release` cũng nhận SHA commit đầy đủ 40 ký tự
  của workflow-branch hiện tại mà không yêu cầu tag đã được push
- Đường dẫn SHA đó chỉ dành cho xác thực và không thể được thăng cấp thành publish thật
- Ở chế độ SHA, workflow tổng hợp `v<package.json version>` chỉ cho kiểm tra metadata
  gói; publish thật vẫn yêu cầu tag phát hành thật
- Cả hai workflow giữ đường dẫn publish và thăng cấp thật trên runner do GitHub host,
  trong khi đường dẫn xác thực không thay đổi dữ liệu có thể dùng runner Blacksmith
  Linux lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Preflight phát hành npm không còn chờ lane release checks riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc tag beta/correction tương ứng) trước khi phê duyệt
- Sau khi publish npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/correction tương ứng) để xác minh đường dẫn cài đặt registry
  đã phát hành trong một temp prefix mới
- Sau khi publish beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding gói đã cài, thiết lập Telegram và Telegram E2E thật với gói
  npm đã phát hành bằng pool thông tin xác thực Telegram được lease dùng chung. Các
  lần chạy một lần cục bộ của maintainer có thể bỏ các biến Convex và truyền trực tiếp
  ba thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy toàn bộ smoke beta sau publish từ máy maintainer, dùng `pnpm release:beta-smoke -- --beta betaN`. Helper chạy xác thực update npm Parallels/fresh-target, dispatch `NPM Telegram Beta E2E`, poll đúng lần chạy workflow, tải artifact và in báo cáo Telegram.
- Maintainer có thể chạy cùng kiểm tra sau publish từ GitHub Actions thông qua
  workflow thủ công `NPM Telegram Beta E2E`. Workflow này cố ý chỉ chạy thủ công và
  không chạy trên mọi merge.
- Tự động hóa phát hành của maintainer hiện dùng preflight-rồi-promote:
  - publish npm thật phải vượt qua một `preflight_run_id` npm thành công
  - publish npm thật phải được dispatch từ cùng branch `main` hoặc
    `release/YYYY.M.D` với lần chạy preflight thành công
  - các bản phát hành npm stable mặc định là `beta`
  - publish npm stable có thể nhắm đến `latest` tường minh qua input workflow
  - thay đổi npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    vì lý do bảo mật, bởi `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo
    công khai giữ publish chỉ dùng OIDC
  - `macOS Release` công khai chỉ dành cho xác thực; khi tag chỉ tồn tại trên một
    branch phát hành nhưng workflow được dispatch từ `main`, đặt
    `public_release_branch=release/YYYY.M.D`
  - publish mac riêng tư thật phải vượt qua `preflight_run_id` và `validate_run_id`
    mac riêng tư thành công
  - các đường dẫn publish thật promote artifact đã chuẩn bị thay vì build lại chúng
- Với các bản phát hành sửa lỗi stable như `YYYY.M.D-N`, trình xác minh sau publish
  cũng kiểm tra cùng đường dẫn nâng cấp temp-prefix từ `YYYY.M.D` lên `YYYY.M.D-N`
  để các bản sửa phát hành không âm thầm để các cài đặt global cũ ở payload stable gốc
- Preflight phát hành npm thất bại đóng trừ khi tarball bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng để
  chúng ta không giao lại một dashboard trình duyệt rỗng
- Xác minh sau publish cũng kiểm tra rằng entrypoint Plugin đã phát hành và metadata
  gói hiện diện trong layout registry đã cài đặt. Một bản phát hành giao thiếu payload
  runtime Plugin sẽ làm trình xác minh postpublish thất bại và không thể được promote
  lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của npm pack trên
  tarball update ứng viên, để installer e2e bắt được pack bloat ngoài ý muốn trước
  đường dẫn publish phát hành
- Nếu công việc phát hành chạm đến lập kế hoạch CI, manifest thời gian extension hoặc
  ma trận kiểm thử extension, hãy tạo lại và review các output ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để release notes không
  mô tả layout CI đã cũ
- Mức sẵn sàng phát hành macOS stable cũng bao gồm các bề mặt updater:
  - GitHub release phải kết thúc với `.zip`, `.dmg` và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ đến zip stable mới sau publish
  - app đã đóng gói phải giữ bundle id không phải debug, URL Sparkle feed không rỗng,
    và `CFBundleVersion` bằng hoặc cao hơn sàn build Sparkle chuẩn cho phiên bản
    phát hành đó

## Hộp kiểm thử phát hành

`Full Release Validation` là cách operator khởi chạy tất cả kiểm thử trước phát hành
từ một điểm vào. Để có bằng chứng commit đã pin trên một branch thay đổi nhanh, dùng
helper để mọi workflow con chạy từ một branch tạm thời cố định ở SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper push `release-ci/<sha>-...`, dispatch `Full Release Validation` từ branch đó
với `ref=<sha>`, xác minh mọi `headSha` của workflow con khớp với mục tiêu, rồi xóa
branch tạm thời. Điều này tránh vô tình chứng minh một lần chạy con `main` mới hơn.

Để xác thực branch hoặc tag phát hành, chạy nó từ workflow ref `main` đáng tin cậy
và truyền branch hoặc tag phát hành làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow phân giải ref đích, kích hoạt `CI` thủ công với
`target_ref=<release-ref>`, kích hoạt `OpenClaw Release Checks`, chuẩn bị một
artifact cha `release-package-under-test` cho các kiểm tra hướng đến gói, và
kích hoạt Telegram E2E độc lập cho gói khi `release_profile=full` với
`rerun_group=all` hoặc khi `npm_telegram_package_spec` được đặt. Sau đó
`OpenClaw Release Checks` phân nhánh sang install smoke, kiểm tra phát hành đa hệ điều hành, phạm vi live/E2E Docker
cho đường dẫn phát hành khi soak được bật, Package Acceptance với QA gói Telegram,
parity QA Lab, Matrix live và Telegram live. Một lần chạy đầy đủ chỉ được chấp nhận khi
tóm tắt `Full Release Validation`
hiển thị `normal_ci` và `release_checks` thành công. Ở chế độ full/all,
workflow con `npm_telegram` cũng phải thành công; ngoài full/all, nó được bỏ qua
trừ khi đã cung cấp một `npm_telegram_package_spec` đã phát hành. Tóm tắt
xác minh cuối cùng bao gồm các bảng job chậm nhất cho từng lần chạy con, để quản lý phát hành
có thể thấy đường tới hạn hiện tại mà không cần tải xuống log.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn đầy đủ, tên job workflow chính xác, khác biệt giữa hồ sơ stable và full,
artifact và các handle chạy lại tập trung.
Các workflow con được kích hoạt từ ref đáng tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` đích trỏ đến một
nhánh hoặc tag phát hành cũ hơn. Không có input workflow-ref riêng cho Full Release Validation;
hãy chọn harness đáng tin cậy bằng cách chọn ref chạy workflow.
Không dùng `--ref main -f ref=<sha>` để chứng minh commit chính xác trên `main` đang dịch chuyển;
SHA commit thô không thể là ref dispatch workflow, vì vậy hãy dùng
`pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn độ rộng live/provider:

- `minimum`: đường dẫn live OpenAI/core và Docker thiết yếu cho phát hành nhanh nhất
- `stable`: minimum cộng thêm phạm vi provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng thêm phạm vi provider/media tư vấn rộng

Dùng `run_release_soak=true` với `stable` khi các lane chặn phát hành đã
xanh và bạn muốn sweep live/E2E, đường dẫn phát hành Docker, và
nâng cấp sống sót đã phát hành có giới hạn nhưng toàn diện trước khi quảng bá. Sweep đó bao phủ
bốn gói stable mới nhất cộng với các baseline đã ghim `2026.4.23` và `2026.5.2`
cùng phạm vi cũ hơn `2026.4.15`, loại bỏ baseline trùng lặp và
mỗi baseline được shard vào job Docker runner riêng. `full` ngụ ý
`run_release_soak=true`.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref đích
một lần dưới dạng `release-package-under-test` và tái sử dụng artifact đó trong các kiểm tra đa hệ điều hành,
Package Acceptance và Docker đường dẫn phát hành khi soak chạy. Điều này giữ
tất cả box hướng đến gói trên cùng một byte và tránh build gói lặp lại.
Install smoke OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4`, vì lane này
chứng minh cài đặt gói, onboarding, khởi động Gateway và một lượt agent live
thay vì benchmark model mặc định chậm nhất. Ma trận provider live rộng hơn
vẫn là nơi dành cho phạm vi theo model cụ thể.

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

Không dùng umbrella đầy đủ làm lần chạy lại đầu tiên sau một bản sửa tập trung. Nếu một box
thất bại, hãy dùng workflow con, job, lane Docker, hồ sơ gói, provider model
hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi
bản sửa đã thay đổi điều phối phát hành dùng chung hoặc khiến bằng chứng toàn bộ box trước đó
trở nên cũ. Bộ xác minh cuối cùng của umbrella kiểm tra lại các ID lần chạy workflow con đã ghi,
vì vậy sau khi workflow con được chạy lại thành công, chỉ chạy lại job cha
`Verify full validation` đã thất bại.

Để khôi phục có giới hạn, truyền `rerun_group` cho umbrella. `all` là lần chạy
ứng viên phát hành thực sự, `ci` chỉ chạy workflow con CI thông thường, `plugin-prerelease`
chỉ chạy workflow con Plugin chỉ dành cho phát hành, `release-checks` chạy mọi box phát hành,
và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram`.
Các lần chạy lại `npm-telegram` tập trung yêu cầu `npm_telegram_package_spec`; các lần chạy full/all
với `release_profile=full` dùng artifact gói của release-checks. Các lần chạy lại
đa hệ điều hành tập trung có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc
bộ lọc hệ điều hành/bộ kiểm thử khác. Lỗi release-check chỉ riêng QA là tư vấn; lỗi chỉ ở QA
không chặn xác thực phát hành.

### Vitest

Box Vitest là workflow con `CI` thủ công. CI thủ công cố ý
bỏ qua phạm vi thay đổi và ép chạy đồ thị kiểm thử thông thường cho ứng viên phát hành:
các shard Linux Node, shard bundled-plugin, hợp đồng kênh, tương thích Node 22,
`check`, `check-additional`, build smoke, kiểm tra tài liệu, Skills Python,
Windows, macOS, Android và i18n Control UI.

Dùng box này để trả lời “cây mã nguồn đã vượt qua bộ kiểm thử thông thường đầy đủ chưa?”
Nó không giống với xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần giữ:

- tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã kích hoạt
- lần chạy `CI` xanh trên SHA đích chính xác
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI thông thường xác định nhưng
không cần các box Docker, QA Lab, live, đa hệ điều hành hoặc gói:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow
`install-smoke` ở chế độ phát hành. Nó xác thực ứng viên phát hành thông qua môi trường
Docker đã đóng gói thay vì chỉ các kiểm thử cấp mã nguồn.

Phạm vi Docker phát hành bao gồm:

- install smoke đầy đủ với smoke cài đặt toàn cục Bun chậm được bật
- chuẩn bị/tái sử dụng image smoke Dockerfile gốc theo SHA đích, với các job QR,
  root/Gateway và installer/Bun smoke chạy dưới dạng các shard install-smoke riêng
- các lane E2E của repository
- các chunk Docker đường dẫn phát hành: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài đặt/gỡ cài đặt Plugin bundled đã tách
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các bộ kiểm thử provider live/E2E và phạm vi model live Docker khi release checks
  bao gồm các bộ live

Dùng artifact Docker trước khi chạy lại. Bộ lập lịch đường dẫn phát hành tải lên
`.artifacts/docker-tests/` với log lane, `summary.json`, `failures.json`,
thời gian pha, JSON kế hoạch bộ lập lịch và lệnh chạy lại. Để khôi phục tập trung,
dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì
chạy lại tất cả chunk phát hành. Các lệnh chạy lại được tạo bao gồm
`package_artifact_run_id` trước đó và input image Docker đã chuẩn bị khi có, để một
lane thất bại có thể tái sử dụng cùng tarball và image GHCR.

### QA Lab

Box QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành
hành vi agentic và cấp kênh, tách biệt với Vitest và cơ chế gói Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane mock parity so sánh lane ứng viên OpenAI với baseline Opus 4.6
  bằng agentic parity pack
- hồ sơ QA Matrix live nhanh dùng môi trường `qa-live-shared`
- lane QA Telegram live dùng lease thông tin xác thực Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng box này để trả lời “bản phát hành có hoạt động đúng trong các kịch bản QA và
luồng kênh live không?” Giữ URL artifact cho các lane parity, Matrix và Telegram
khi phê duyệt phát hành. Phạm vi Matrix đầy đủ vẫn khả dụng dưới dạng lần chạy QA-Lab thủ công được shard
thay vì lane thiết yếu cho phát hành theo mặc định.

### Gói

Box Gói là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver chuẩn hóa một
ứng viên thành tarball `package-under-test` được Docker E2E tiêu thụ, xác thực
inventory gói, ghi lại phiên bản gói và SHA-256, đồng thời giữ ref harness workflow
tách biệt với ref nguồn gói.

Các nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác
- `source=ref`: đóng gói một nhánh, tag hoặc SHA commit đầy đủ `package_ref` đáng tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` được tải lên bởi lần chạy GitHub Actions khác

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, artifact
gói phát hành đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance giữ migration, update,
khởi động lại update auth đã cấu hình, dọn dẹp phụ thuộc Plugin cũ, fixture Plugin offline,
update Plugin và QA gói Telegram trên cùng một tarball đã phân giải. Các kiểm tra phát hành chặn dùng
baseline gói đã phát hành mới nhất mặc định; `run_release_soak=true` hoặc
`release_profile=full` mở rộng sang mọi baseline npm đã phát hành stable từ
`2026.4.23` đến `latest` cộng với fixture sự cố đã báo cáo. Dùng
Package Acceptance với `source=npm` cho một ứng viên đã phát hành, hoặc
`source=ref`/`source=artifact` cho tarball npm cục bộ có SHA trước khi
phát hành. Đây là giải pháp thay thế gốc GitHub
cho phần lớn phạm vi gói/update trước đây cần Parallels. Kiểm tra phát hành đa hệ điều hành vẫn quan trọng cho onboarding,
installer và hành vi nền tảng theo hệ điều hành, nhưng xác thực sản phẩm gói/update nên
ưu tiên Package Acceptance.

Checklist chuẩn cho xác thực update và Plugin là
[Kiểm thử update và Plugin](/vi/help/testing-updates-plugins). Dùng nó khi
quyết định lane cục bộ, Docker, Package Acceptance hoặc release-check nào chứng minh một
thay đổi cài đặt/update Plugin, dọn dẹp doctor hoặc migration gói đã phát hành.
Migration update đã phát hành toàn diện từ mọi gói stable `2026.4.23+` là
workflow `Update Migration` thủ công riêng, không phải một phần của Full Release CI.

Tính nới lỏng package-acceptance cũ được cố ý giới hạn thời gian. Các gói đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các thiếu sót siêu dữ liệu đã
được phát hành lên npm: các mục kiểm kê QA riêng tư bị thiếu khỏi tarball, thiếu
`gateway install --wrapper`, thiếu tệp vá trong fixture git dẫn xuất từ tarball,
thiếu `update.channel` được lưu bền vững, vị trí bản ghi cài đặt Plugin cũ,
thiếu tính lưu bền vững bản ghi cài đặt marketplace, và di chuyển siêu dữ liệu
cấu hình trong khi chạy `plugins update`. Gói `2026.4.26` đã phát hành có thể
cảnh báo về các tệp dấu siêu dữ liệu bản dựng cục bộ đã được phát hành. Các gói
sau đó phải đáp ứng các hợp đồng gói hiện đại; chính những thiếu sót đó sẽ làm
hỏng xác thực phát hành.

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

- `smoke`: các luồng cài đặt gói/kênh/tác tử, mạng Gateway và tải lại cấu hình
  nhanh
- `package`: các hợp đồng cài đặt/cập nhật/khởi động lại/gói Plugin không cần
  ClawHub trực tiếp; đây là mặc định kiểm tra phát hành
- `product`: `package` cộng với các kênh MCP, dọn dẹp cron/tác tử con, tìm kiếm
  web OpenAI và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để chứng minh Telegram cho ứng viên gói, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball
`package-under-test` đã phân giải vào luồng Telegram; workflow Telegram độc lập
vẫn chấp nhận đặc tả npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành

`OpenClaw Release Publish` là điểm vào phát hành có thay đổi trạng thái thông
thường. Nó điều phối các workflow trusted-publisher theo thứ tự mà bản phát hành
cần:

1. Check out thẻ phát hành và phân giải SHA commit của thẻ.
2. Xác minh thẻ có thể truy cập từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Kích hoạt `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Kích hoạt `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Kích hoạt `OpenClaw NPM Release` với thẻ phát hành, npm dist-tag và
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

Quảng bá ổn định trực tiếp lên `latest` là thao tác tường minh:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và
`Plugin ClawHub Release` cho công việc sửa chữa hoặc phát hành lại tập trung. Với
một lần sửa Plugin được chọn, truyền `plugin_publish_scope=selected` và
`plugins=@openclaw/name` cho `OpenClaw Release Publish`, hoặc kích hoạt trực tiếp
workflow con khi không được phát hành gói OpenClaw.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc, chẳng hạn `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit
  đầy đủ 40 ký tự hiện tại của nhánh workflow để chỉ xác thực preflight
- `preflight_only`: `true` để chỉ xác thực/bản dựng/gói, `false` cho đường dẫn
  phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để workflow dùng
  lại tarball đã chuẩn bị từ lần chạy preflight thành công
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
  làm bộ điều phối sửa chữa chỉ dành cho Plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `ref`: nhánh, thẻ hoặc SHA commit đầy đủ để xác thực. Các kiểm tra chứa secret
  yêu cầu commit đã phân giải phải có thể truy cập từ một nhánh OpenClaw hoặc
  thẻ phát hành.
- `run_release_soak`: chọn tham gia soak trực tiếp/E2E toàn diện, đường dẫn phát
  hành Docker và tất cả upgrade-survivor kể từ trước trong các kiểm tra phát
  hành ổn định/mặc định. Nó bị buộc bật bởi `release_profile=full`.

Quy tắc:

- Thẻ ổn định và thẻ chỉnh sửa có thể phát hành lên `beta` hoặc `latest`
- Thẻ prerelease beta chỉ có thể phát hành lên `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ để xác thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh siêu dữ liệu đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi tạo một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi có thẻ, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh
     workflow cho một lần chạy thử chỉ xác thực của workflow preflight
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc `latest` chỉ
   khi bạn cố ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành hoặc SHA
   commit đầy đủ khi bạn muốn CI thông thường cộng với phạm vi bao phủ cache
   prompt trực tiếp, Docker, QA Lab, Matrix và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag` và
   `preflight_run_id` đã lưu; nó phát hành các Plugin đã externalize lên npm và
   ClawHub trước khi quảng bá gói npm OpenClaw
7. Nếu bản phát hành đã vào `beta`, dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` để
   quảng bá phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý được phát hành trực tiếp lên `latest` và `beta` cần
   trỏ ngay tới cùng bản dựng ổn định, hãy dùng cùng workflow riêng tư đó để trỏ
   cả hai dist-tag tới phiên bản ổn định, hoặc để đồng bộ tự phục hồi theo lịch
   của nó di chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật, vì nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ việc phát hành chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn phát hành trực tiếp và đường dẫn quảng bá beta-trước
đều được ghi tài liệu và hiển thị với người vận hành.

Nếu maintainer phải quay về xác thực npm cục bộ, chỉ chạy mọi lệnh CLI 1Password
(`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op` trực tiếp từ shell
tác tử chính; việc giữ nó bên trong tmux giúp các prompt, cảnh báo và xử lý OTP
có thể quan sát được và ngăn cảnh báo máy chủ lặp lại.

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

Maintainer dùng tài liệu phát hành riêng tư tại
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
cho runbook thực tế.

## Liên quan

- [Kênh phát hành](/vi/install/development-channels)
