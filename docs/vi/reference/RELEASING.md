---
read_when:
    - Đang tìm định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc kiểm nhận gói
    - Tìm thông tin về cách đặt tên phiên bản và nhịp phát hành
summary: Các luồng phát hành, danh sách kiểm tra dành cho người vận hành, các hộp xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-04T07:06:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef50d3ef5d1e23b4e2c2b097fc4ca9f6d46bf8acb9aea0c9bca6d14e213b88b6
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba nhánh phát hành công khai:

- stable: bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: thẻ tiền phát hành được phát hành lên npm `beta`
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
- Các bản phát hành stable và sửa lỗi stable mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm tới `latest` một cách rõ ràng, hoặc quảng bá một bản dựng beta đã được thẩm định sau đó
- Mọi bản phát hành OpenClaw stable đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/package trước, còn
  việc build/ký/notarize ứng dụng mac được dành cho stable trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Stable chỉ theo sau sau khi bản beta mới nhất đã được xác thực
- Maintainer thường cắt bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc phát hành và cần sửa lỗi, maintainer cắt
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
   `/changelog`, giữ các mục hướng tới người dùng, commit, đẩy, rồi rebase/pull
   thêm một lần nữa trước khi tạo nhánh.
3. Rà soát các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do vì sao nó được
   chủ ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành bình thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, chạy
   `pnpm plugins:sync` để các gói Plugin có thể phát hành chia sẻ phiên bản phát hành
   và siêu dữ liệu tương thích, rồi chạy preflight xác định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, và
   `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA nhánh phát hành đủ 40 ký tự được phép dùng cho preflight chỉ để xác thực.
   Lưu `preflight_run_id` thành công.
7. Khởi chạy toàn bộ kiểm thử tiền phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là entrypoint thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, lane,
   job workflow, hồ sơ package, provider hoặc allowlist model nhỏ nhất đã thất bại
   để chứng minh bản sửa. Chỉ chạy lại toàn bộ umbrella khi bề mặt đã thay đổi khiến
   bằng chứng trước đó không còn mới.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` tương ứng. Nó xác minh `pnpm plugins:sync:check`,
   phát hành tất cả gói Plugin có thể phát hành lên npm trước, phát hành cùng tập hợp đó
   lên ClawHub thứ hai dưới dạng tarball ClawPack npm-pack, rồi quảng bá artifact
   preflight npm OpenClaw đã chuẩn bị với dist-tag tương ứng. Sau khi phát hành,
   chạy kiểm tra chấp nhận package sau phát hành
   đối với package `openclaw@YYYY.M.D-beta.N` hoặc
   `openclaw@beta` đã phát hành. Nếu một bản tiền phát hành đã đẩy hoặc đã phát hành cần sửa,
   cắt số tiền phát hành tương ứng tiếp theo; không xóa hoặc viết lại bản tiền phát hành cũ.
10. Với stable, chỉ tiếp tục sau khi beta hoặc release candidate đã được thẩm định có
    bằng chứng xác thực bắt buộc. Việc phát hành npm stable cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công qua
    `preflight_run_id`; trạng thái sẵn sàng phát hành stable macOS cũng yêu cầu
    `.zip`, `.dmg`, `.dSYM.zip` đã được đóng gói, và `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy trình xác minh npm sau phát hành, tùy chọn E2E Telegram
    published-npm độc lập khi bạn cần bằng chứng kênh sau phát hành,
    quảng bá dist-tag khi cần, ghi chú GitHub release/prerelease từ phần
    `CHANGELOG.md` hoàn chỉnh tương ứng, và các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước release preflight để TypeScript của kiểm thử vẫn được
  bao phủ bên ngoài gate `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước release preflight để các kiểm tra rộng hơn về chu
  trình import và ranh giới kiến trúc đều xanh bên ngoài gate cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành
  `dist/*` dự kiến và bundle Control UI tồn tại cho bước xác thực pack
- Chạy `pnpm plugins:sync` sau khi tăng phiên bản ở root và trước khi gắn tag. Lệnh này
  cập nhật phiên bản package của các plugin có thể publish, metadata tương thích
  peer/API của OpenClaw, metadata build và stub changelog plugin để khớp với phiên bản
  phát hành core. `pnpm plugins:sync:check` là guard phát hành không làm thay đổi dữ liệu;
  workflow publish sẽ thất bại trước bất kỳ thay đổi registry nào nếu bước này bị
  quên.
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi động tất cả test box tiền phát hành từ một entrypoint. Workflow này nhận branch,
  tag hoặc SHA commit đầy đủ, dispatch `CI` thủ công và dispatch
  `OpenClaw Release Checks` cho install smoke, package acceptance, các suite đường dẫn
  phát hành Docker, live/E2E, OpenWebUI, parity QA Lab, Matrix và các lane Telegram. Với
  `release_profile=full` và `rerun_group=all`, nó cũng chạy package Telegram E2E với
  artifact `release-package-under-test` từ release checks. Cung cấp
  `npm_telegram_package_spec` sau khi publish khi cùng Telegram E2E cũng cần chứng minh
  package npm đã publish. Cung cấp `package_acceptance_package_spec` sau khi publish khi
  Package Acceptance cần chạy ma trận package/update của nó với package npm đã ship thay
  vì artifact được build từ SHA. Cung cấp
  `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh validation khớp
  với package npm đã publish mà không bắt buộc Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng kênh phụ cho một
  ứng viên package trong lúc công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành chính xác; `source=ref`
  để pack một branch/tag/SHA `package_ref` tin cậy bằng harness `workflow_ref` hiện tại;
  `source=url` cho tarball HTTPS với SHA-256 bắt buộc; hoặc `source=artifact` cho tarball
  được upload bởi một lần chạy GitHub Actions khác. Workflow phân giải ứng viên thành
  `package-under-test`, tái sử dụng bộ lập lịch Docker E2E release với tarball đó, và có
  thể chạy Telegram QA với cùng tarball bằng `telegram_mode=mock-openai` hoặc
  `telegram_mode=live-frontier`. Khi các lane Docker đã chọn bao gồm
  `published-upgrade-survivor`, artifact package là ứng viên và
  `published_upgrade_survivor_baseline` chọn baseline đã publish.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Hồ sơ phổ biến:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway và tải lại cấu hình
  - `package`: các lane package/update/plugin gốc artifact, không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ package cộng với kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần độ bao phủ CI đầy đủ thông thường
  cho ứng viên phát hành. Các dispatch CI thủ công bỏ qua phạm vi changed và ép các shard
  Linux Node, shard bundled-plugin, hợp đồng kênh, tương thích Node 22, `check`,
  `check-additional`, build smoke, kiểm tra docs, Python skills, Windows, macOS, Android
  và các lane i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này chạy
  QA-lab qua một receiver OTLP/HTTP cục bộ và xác minh tên trace span đã export,
  thuộc tính bị giới hạn và việc biên tập nội dung/định danh mà không cần Opik,
  Langfuse hoặc collector bên ngoài khác.
- Chạy `pnpm release:check` trước mỗi phát hành được gắn tag
- Chạy `OpenClaw Release Publish` cho chuỗi publish có thay đổi sau khi tag tồn tại.
  Dispatch từ `release/YYYY.M.D` (hoặc `main` khi publish một tag có thể truy cập từ
  main), truyền tag phát hành và `preflight_run_id` npm OpenClaw thành công, đồng thời
  giữ phạm vi publish plugin mặc định `all-publishable` trừ khi bạn cố ý chạy một bản sửa
  tập trung. Workflow tuần tự hóa publish npm plugin, publish ClawHub plugin và publish
  npm OpenClaw để package core không được publish trước các plugin đã externalize của nó.
- Release checks hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane parity mock QA Lab cùng với hồ sơ Matrix live
  nhanh và lane Telegram QA trước khi phê duyệt phát hành. Các lane live dùng môi trường
  `qa-live-shared`; Telegram cũng dùng lease thông tin xác thực Convex CI. Chạy workflow
  thủ công `QA-Lab - All Lanes` với `matrix_profile=all` và `matrix_shards=true` khi bạn
  muốn toàn bộ inventory transport, media và E2EE Matrix chạy song song.
- Validation runtime cài đặt và nâng cấp đa hệ điều hành là một phần của
  `OpenClaw Release Checks` công khai và `Full Release Validation`, gọi trực tiếp
  workflow tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ ý: giữ đường dẫn phát hành npm thật ngắn,
  xác định và tập trung vào artifact, trong khi các kiểm tra live chậm hơn nằm trong lane
  riêng để chúng không làm đình trệ hoặc chặn publish
- Các release checks mang secret nên được dispatch qua `Full Release
Validation` hoặc từ workflow ref `main`/release để logic workflow và
  secret vẫn được kiểm soát
- `OpenClaw Release Checks` nhận branch, tag hoặc SHA commit đầy đủ miễn là
  commit được phân giải có thể truy cập từ một branch OpenClaw hoặc tag phát hành
- Preflight chỉ validation của `OpenClaw NPM Release` cũng nhận SHA commit đầy đủ
  40 ký tự của workflow-branch hiện tại mà không yêu cầu tag đã push
- Đường dẫn SHA đó chỉ dành cho validation và không thể được nâng cấp thành publish thật
- Ở chế độ SHA, workflow tổng hợp `v<package.json version>` chỉ cho kiểm tra
  metadata package; publish thật vẫn yêu cầu tag phát hành thật
- Cả hai workflow giữ đường dẫn publish và promotion thật trên runner do GitHub host,
  trong khi đường dẫn validation không làm thay đổi dữ liệu có thể dùng các runner
  Blacksmith Linux lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Preflight phát hành npm không còn chờ lane release checks riêng biệt
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc tag beta/correction tương ứng) trước khi phê duyệt
- Sau khi publish npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/correction tương ứng) để xác minh đường dẫn cài đặt registry đã
  publish trong một temp prefix mới
- Sau khi publish beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding package đã cài đặt, thiết lập Telegram và Telegram E2E thật với
  package npm đã publish bằng pool thông tin xác thực Telegram dùng chung được lease.
  Các lần chạy cục bộ một lần của maintainer có thể bỏ qua các biến Convex và truyền trực
  tiếp ba thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy toàn bộ post-publish beta smoke từ máy maintainer, dùng `pnpm release:beta-smoke -- --beta betaN`. Helper chạy validation npm update/fresh-target trên Parallels, dispatch `NPM Telegram Beta E2E`, poll đúng workflow run, tải xuống artifact và in báo cáo Telegram.
- Maintainer có thể chạy cùng kiểm tra post-publish từ GitHub Actions qua workflow thủ
  công `NPM Telegram Beta E2E`. Workflow này cố ý chỉ chạy thủ công và không chạy trên
  mọi merge.
- Tự động hóa phát hành của maintainer hiện dùng preflight-rồi-promote:
  - publish npm thật phải vượt qua `preflight_run_id` npm thành công
  - publish npm thật phải được dispatch từ cùng branch `main` hoặc
    `release/YYYY.M.D` với lần chạy preflight thành công
  - phát hành npm stable mặc định là `beta`
  - publish npm stable có thể nhắm rõ ràng tới `latest` qua input workflow
  - thay đổi npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    để bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo công khai
    giữ publish chỉ dùng OIDC
  - `macOS Release` công khai chỉ dùng cho validation; khi tag chỉ tồn tại trên một
    branch release nhưng workflow được dispatch từ `main`, đặt
    `public_release_branch=release/YYYY.M.D`
  - publish mac riêng tư thật phải vượt qua `preflight_run_id` mac riêng tư thành công và
    `validate_run_id`
  - các đường dẫn publish thật promote artifact đã chuẩn bị thay vì build lại chúng
- Với các bản phát hành correction stable như `YYYY.M.D-N`, verifier post-publish
  cũng kiểm tra cùng đường dẫn nâng cấp temp-prefix từ `YYYY.M.D` lên `YYYY.M.D-N`
  để các bản sửa phát hành không thể âm thầm để lại bản cài đặt global cũ trên payload
  stable cơ sở
- Preflight phát hành npm thất bại đóng trừ khi tarball bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không ship dashboard trình duyệt trống một lần nữa
- Verification post-publish cũng kiểm tra rằng entrypoint plugin đã publish và
  metadata package có mặt trong bố cục registry đã cài đặt. Một bản phát hành ship thiếu
  payload runtime plugin sẽ làm verifier postpublish thất bại và không thể được promote
  lên `latest`.
- `pnpm test:install:smoke` cũng áp dụng ngân sách `unpackedSize` của npm pack lên
  tarball cập nhật ứng viên, để installer e2e bắt được việc pack phình to ngoài ý muốn
  trước đường dẫn publish phát hành
- Nếu công việc phát hành chạm tới lập kế hoạch CI, manifest thời gian plugin hoặc
  ma trận kiểm thử plugin, hãy tạo lại và review các output ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để release notes không
  mô tả một bố cục CI đã cũ
- Mức sẵn sàng phát hành macOS stable cũng bao gồm các bề mặt updater:
  - GitHub release cuối cùng phải có `.zip`, `.dmg` và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ tới zip stable mới sau khi publish
  - app đã đóng gói phải giữ bundle id không phải debug, URL Sparkle feed không rỗng và
    `CFBundleVersion` bằng hoặc cao hơn mức sàn build Sparkle chuẩn cho phiên bản phát
    hành đó

## Test box phát hành

`Full Release Validation` là cách operator khởi động tất cả kiểm thử tiền phát hành từ
một entrypoint. Để có bằng chứng commit đã pin trên một branch thay đổi nhanh, dùng
helper để mọi workflow con chạy từ một branch tạm thời được cố định ở SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper push `release-ci/<sha>-...`, dispatch `Full Release Validation`
từ branch đó với `ref=<sha>`, xác minh mọi workflow con có `headSha`
khớp với mục tiêu, rồi xóa branch tạm thời. Việc này tránh vô tình chứng minh một lần
chạy con `main` mới hơn.

Để validation branch hoặc tag phát hành, chạy từ workflow ref `main` tin cậy và truyền
branch hoặc tag phát hành làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Quy trình làm việc phân giải ref đích, kích hoạt thủ công `CI` với
`target_ref=<release-ref>`, kích hoạt `OpenClaw Release Checks`, chuẩn bị artifact
cha `release-package-under-test` cho các kiểm tra hướng đến gói, và
kích hoạt Telegram E2E độc lập cho gói khi `release_profile=full` với
`rerun_group=all` hoặc khi `npm_telegram_package_spec` được đặt. Sau đó `OpenClaw Release
Checks` mở rộng thành install smoke, kiểm tra phát hành đa hệ điều hành, phạm vi
live/E2E Docker cho đường dẫn phát hành, Package Acceptance với QA gói Telegram, QA Lab
parity, Matrix live, và Telegram live. Một lượt chạy đầy đủ chỉ được chấp nhận khi
tóm tắt `Full Release Validation`
hiển thị `normal_ci` và `release_checks` thành công. Ở chế độ full/all,
child `npm_telegram` cũng phải thành công; ngoài full/all, nó bị bỏ qua
trừ khi đã cung cấp một `npm_telegram_package_spec` đã phát hành. Tóm tắt
xác minh cuối cùng bao gồm các bảng job chậm nhất cho từng child run, để người quản lý phát hành
có thể thấy đường tới hạn hiện tại mà không cần tải log xuống.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn đầy đủ, tên job workflow chính xác, khác biệt giữa profile stable và full,
artifact, và các handle rerun tập trung.
Các workflow con được kích hoạt từ ref tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` đích trỏ tới một
nhánh hoặc tag phát hành cũ hơn. Không có input workflow-ref riêng cho Full Release Validation;
hãy chọn harness tin cậy bằng cách chọn ref chạy workflow.
Không dùng `--ref main -f ref=<sha>` để làm bằng chứng commit chính xác trên `main` đang dịch chuyển;
SHA commit thô không thể là workflow dispatch ref, vì vậy hãy dùng
`pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn phạm vi live/provider:

- `minimum`: đường dẫn OpenAI/core live và Docker nhanh nhất, quan trọng cho phát hành
- `stable`: minimum cộng với phạm vi provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng với phạm vi provider/media tư vấn rộng

`OpenClaw Release Checks` dùng ref workflow tin cậy để phân giải ref đích
một lần thành `release-package-under-test` và tái sử dụng artifact đó trong cả
kiểm tra Docker đường dẫn phát hành lẫn Package Acceptance. Điều này giữ mọi
box hướng đến gói trên cùng một bộ byte và tránh build gói lặp lại.
Install smoke OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4`, vì lane này đang
chứng minh cài đặt gói, onboarding, khởi động gateway, và một lượt tác nhân live
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

Không dùng umbrella đầy đủ làm lượt rerun đầu tiên sau một bản sửa tập trung. Nếu một box
thất bại, hãy dùng workflow con, job, lane Docker, profile gói, provider model,
hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi
bản sửa đã thay đổi điều phối phát hành dùng chung hoặc làm bằng chứng mọi box trước đó
trở nên lỗi thời. Bộ xác minh cuối của umbrella kiểm tra lại các id run workflow con
đã ghi nhận, vì vậy sau khi một workflow con được rerun thành công, chỉ rerun job cha
`Verify full validation` đã thất bại.

Để khôi phục có giới hạn, truyền `rerun_group` cho umbrella. `all` là lượt chạy
release-candidate thực sự, `ci` chỉ chạy child CI bình thường, `plugin-prerelease`
chỉ chạy child plugin chỉ dành cho phát hành, `release-checks` chạy mọi box phát hành,
và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram`.
Các rerun `npm-telegram` tập trung yêu cầu `npm_telegram_package_spec`; các lượt full/all
với `release_profile=full` dùng artifact gói release-checks.

### Vitest

Box Vitest là workflow con `CI` thủ công. CI thủ công cố ý
bỏ qua scoping theo thay đổi và ép đồ thị kiểm thử bình thường cho release
candidate: shard Linux Node, shard Plugin đi kèm, contract kênh, khả năng tương thích Node 22,
`check`, `check-additional`, build smoke, kiểm tra docs, Skills Python, Windows, macOS, Android, và Control UI i18n.

Dùng box này để trả lời "cây nguồn có vượt qua toàn bộ bộ kiểm thử bình thường không?"
Nó không giống xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần giữ:

- tóm tắt `Full Release Validation` hiển thị URL run `CI` đã kích hoạt
- run `CI` xanh trên đúng SHA đích
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact timing Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lượt chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI bình thường tất định nhưng
không cần Docker, QA Lab, live, đa hệ điều hành, hoặc box gói:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow `install-smoke`
chế độ phát hành. Nó xác thực release candidate qua môi trường Docker đóng gói
thay vì chỉ qua kiểm thử cấp nguồn.

Phạm vi Docker phát hành bao gồm:

- install smoke đầy đủ với slow Bun global install smoke được bật
- chuẩn bị/tái sử dụng image smoke Dockerfile gốc theo SHA đích, với các job QR,
  root/gateway, và installer/Bun smoke chạy như các shard install-smoke riêng
- các lane E2E của repository
- các chunk Docker đường dẫn phát hành: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài đặt/gỡ cài đặt Plugin đi kèm đã tách
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các bộ provider live/E2E và phạm vi model live Docker khi release checks
  bao gồm bộ live

Dùng artifact Docker trước khi rerun. Bộ lập lịch đường dẫn phát hành tải lên
`.artifacts/docker-tests/` với log lane, `summary.json`, `failures.json`,
timing pha, JSON kế hoạch scheduler, và lệnh rerun. Để khôi phục tập trung,
dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì
rerun mọi chunk phát hành. Các lệnh rerun được tạo bao gồm
`package_artifact_run_id` trước đó và input image Docker đã chuẩn bị khi có, để một
lane thất bại có thể tái sử dụng cùng tarball và image GHCR.

### QA Lab

Box QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành
hành vi tác nhân và cấp kênh, tách biệt với cơ chế gói của Vitest và Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane parity giả lập so sánh lane candidate OpenAI với baseline Opus 4.6
  bằng agentic parity pack
- profile QA Matrix live nhanh dùng môi trường `qa-live-shared`
- lane QA Telegram live dùng lease thông tin xác thực Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng box này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA và
luồng kênh live không?" Giữ các URL artifact cho các lane parity, Matrix, và Telegram
khi phê duyệt phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng
lượt chạy QA-Lab sharded thủ công thay vì lane mặc định quan trọng cho phát hành.

### Gói

Box Gói là cổng sản phẩm có thể cài đặt. Nó được hậu thuẫn bởi
`Package Acceptance` và resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver chuẩn hóa một
candidate thành tarball `package-under-test` được Docker E2E tiêu thụ, xác thực
inventory gói, ghi lại phiên bản gói và SHA-256, và giữ ref harness workflow
tách biệt với ref nguồn gói.

Các nguồn candidate được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw
  chính xác
- `source=ref`: đóng gói một nhánh `package_ref`, tag, hoặc SHA commit đầy đủ tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng `.tgz` được tải lên bởi một run GitHub Actions khác

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, artifact
gói phát hành đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues`, và
`telegram_mode=mock-openai`. Package Acceptance giữ migration, update, dọn dẹp phụ thuộc Plugin cũ,
fixture Plugin offline, update Plugin, và QA gói Telegram trên cùng tarball đã phân giải. Ma trận nâng cấp bao phủ mọi baseline ổn định đã phát hành npm từ `2026.4.23` đến `latest`; dùng
Package Acceptance với `source=npm` cho một candidate đã phát hành, hoặc
`source=ref`/`source=artifact` cho một tarball npm cục bộ có backing SHA trước khi
publish. Đây là giải pháp thay thế GitHub-native
cho phần lớn phạm vi package/update trước đây cần Parallels. Kiểm tra phát hành đa hệ điều hành vẫn quan trọng cho onboarding,
installer, và hành vi nền tảng theo hệ điều hành, nhưng xác thực sản phẩm package/update nên
ưu tiên Package Acceptance.

Checklist chuẩn cho xác thực update và Plugin là
[Kiểm thử update và Plugin](/vi/help/testing-updates-plugins). Dùng nó khi
quyết định lane cục bộ, Docker, Package Acceptance, hoặc release-check nào chứng minh một
thay đổi cài đặt/update Plugin, dọn dẹp doctor, hoặc migration gói đã phát hành.
Migration update đã phát hành toàn diện từ mọi gói ổn định `2026.4.23+` là
một workflow `Update Migration` thủ công riêng, không thuộc Full Release CI.

Tính nới lỏng package-acceptance kế thừa được giới hạn thời gian có chủ ý. Các gói đến
`2026.4.25` có thể dùng đường tương thích cho các khoảng trống metadata đã phát hành
lên npm: mục inventory QA private thiếu trong tarball, thiếu
`gateway install --wrapper`, thiếu patch file trong fixture git dẫn xuất từ tarball,
thiếu `update.channel` được lưu bền, vị trí bản ghi cài đặt Plugin cũ,
thiếu lưu bền bản ghi cài đặt marketplace, và migration metadata config
trong `plugins update`. Gói `2026.4.26` đã phát hành có thể cảnh báo
cho các file stamp metadata build cục bộ đã được phát hành. Các gói sau đó
phải đáp ứng các contract gói hiện đại; chính các khoảng trống đó sẽ làm xác thực
phát hành thất bại.

Dùng các profile Package Acceptance rộng hơn khi câu hỏi phát hành liên quan đến một
gói thực sự có thể cài đặt:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Các profile gói thường dùng:

- `smoke`: các làn cài đặt nhanh gói/kênh/agent, mạng Gateway và tải lại cấu hình
- `package`: các hợp đồng cài đặt/cập nhật/gói Plugin không có ClawHub trực tiếp; đây là mặc định kiểm tra phát hành
- `product`: `package` cộng với các kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để có bằng chứng Telegram cho ứng viên gói, hãy bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Quy trình truyền tarball
`package-under-test` đã phân giải vào làn Telegram; quy trình Telegram độc lập
vẫn chấp nhận đặc tả npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành bản xuất bản

`OpenClaw Release Publish` là điểm vào xuất bản có thay đổi trạng thái thông thường. Nó
điều phối các quy trình trusted-publisher theo thứ tự mà bản phát hành cần:

1. Checkout thẻ phát hành và phân giải SHA commit của thẻ đó.
2. Xác minh thẻ có thể truy cập từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Dispatch `OpenClaw NPM Release` với thẻ phát hành, npm dist-tag và
   `preflight_run_id` đã lưu.

Ví dụ xuất bản beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Xuất bản ổn định lên dist-tag beta mặc định:

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

Chỉ dùng các quy trình cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa hoặc xuất bản lại tập trung. Để sửa chữa một Plugin đã chọn, truyền
`plugin_publish_scope=selected` và `plugins=@openclaw/name` cho
`OpenClaw Release Publish`, hoặc dispatch trực tiếp quy trình con khi không được xuất bản
gói OpenClaw.

## Đầu vào quy trình NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do operator kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1` hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit
  đầy đủ 40 ký tự hiện tại của nhánh quy trình cho preflight chỉ xác thực
- `preflight_only`: `true` để chỉ xác thực/xây dựng/đóng gói, `false` cho đường dẫn
  xuất bản thật
- `preflight_run_id`: bắt buộc trên đường dẫn xuất bản thật để quy trình dùng lại
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: thẻ đích npm cho đường dẫn xuất bản; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do operator kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `npm_dist_tag`: thẻ đích npm cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa tập trung
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng quy trình
  như một bộ điều phối sửa chữa chỉ dành cho Plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do operator kiểm soát sau:

- `ref`: nhánh, thẻ hoặc SHA commit đầy đủ để xác thực. Các kiểm tra có chứa secret
  yêu cầu commit đã phân giải có thể truy cập từ một nhánh OpenClaw hoặc
  thẻ phát hành.

Quy tắc:

- Thẻ ổn định và thẻ sửa lỗi có thể xuất bản lên `beta` hoặc `latest`
- Thẻ prerelease beta chỉ có thể xuất bản lên `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ dùng để xác thực
- Đường dẫn xuất bản thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  quy trình xác minh metadata đó trước khi tiếp tục xuất bản

## Trình tự phát hành npm ổn định

Khi tạo một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi thẻ tồn tại, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh quy trình
     cho một lần chạy thử chỉ xác thực của quy trình preflight
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc `latest` chỉ
   khi bạn cố ý muốn xuất bản ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành hoặc SHA
   commit đầy đủ khi bạn muốn CI thông thường cộng với prompt cache trực tiếp, Docker, QA Lab,
   Matrix và phạm vi Telegram từ một quy trình thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   quy trình thủ công `CI` trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`,
   và `preflight_run_id` đã lưu; nó xuất bản các Plugin đã externalize lên npm
   và ClawHub trước khi quảng bá gói npm OpenClaw
7. Nếu bản phát hành đã lên `beta`, hãy dùng quy trình riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để quảng bá phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý được xuất bản trực tiếp lên `latest` và `beta`
   nên theo cùng bản dựng ổn định ngay lập tức, hãy dùng cùng quy trình riêng tư đó
   để trỏ cả hai dist-tag vào phiên bản ổn định, hoặc để đồng bộ tự phục hồi theo lịch của nó
   chuyển `beta` sau

Việc thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật, vì nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ xuất bản chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn xuất bản trực tiếp và đường dẫn quảng bá beta-trước
đều được ghi tài liệu và hiển thị với operator.

Nếu maintainer phải quay về xác thực npm cục bộ, chỉ chạy mọi lệnh 1Password
CLI (`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell agent chính; giữ nó bên trong tmux giúp các prompt,
cảnh báo và xử lý OTP có thể quan sát được, đồng thời ngăn các cảnh báo host lặp lại.

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
