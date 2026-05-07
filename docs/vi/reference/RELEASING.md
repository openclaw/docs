---
read_when:
    - Đang tìm các định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc kiểm tra chấp nhận gói
    - Tìm thông tin về cách đặt tên phiên bản và nhịp phát hành
summary: Các luồng phát hành, danh sách kiểm tra cho người vận hành, hộp xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-07T15:08:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6843c7bd0d0a4f3815661f7d392ae7e60b0485a03f1cc53a4c3f13ad3e9a5f8
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba luồng phát hành công khai:

- ổn định: các bản phát hành được gắn thẻ mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ tiền phát hành phát hành lên npm `beta`
- dev: đầu nhánh đang thay đổi của `main`

## Cách đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản tiền phát hành beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số không ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm ổn định hiện tại đã được quảng bá
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành ổn định và sửa lỗi ổn định mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm tới `latest` một cách rõ ràng, hoặc quảng bá một bản dựng beta đã được thẩm định sau đó
- Mỗi bản phát hành OpenClaw ổn định đều đi kèm gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/gói trước, còn
  việc dựng/ký/công chứng ứng dụng mac chỉ dành cho bản ổn định trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Bản ổn định chỉ theo sau sau khi bản beta mới nhất được xác thực
- Maintainer thường tạo bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc phát hành và cần sửa lỗi, maintainer tạo
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho maintainer

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag và chi tiết rollback khẩn cấp được giữ trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: kéo phiên bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thật với
   `/changelog`, giữ các mục hướng tới người dùng, commit, đẩy lên, và rebase/pull
   thêm một lần trước khi tạo nhánh.
3. Xem lại các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do vì sao nó được
   chủ ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, rồi chạy
   `pnpm release:prep`. Lệnh này làm mới phiên bản plugin, kho plugin, schema
   cấu hình, metadata cấu hình kênh đi kèm, baseline tài liệu cấu hình, các bản xuất
   plugin SDK, và baseline API plugin SDK theo đúng thứ tự. Commit mọi sai lệch
   được tạo trước khi gắn thẻ. Sau đó chạy preflight xác định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, và `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi thẻ tồn tại,
   có thể dùng SHA nhánh phát hành đủ 40 ký tự cho preflight chỉ để xác thực.
   Lưu `preflight_run_id` thành công.
7. Khởi động toàn bộ kiểm thử tiền phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại file, luồng,
   job workflow, profile gói, provider, hoặc allowlist model nhỏ nhất đã thất bại để
   chứng minh bản sửa. Chỉ chạy lại toàn bộ umbrella khi bề mặt thay đổi khiến
   bằng chứng trước đó trở nên cũ.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` tương ứng. Lệnh xác minh `pnpm plugins:sync:check`,
   dispatch tất cả gói plugin có thể phát hành lên npm và cùng tập đó lên
   ClawHub song song, rồi quảng bá artifact preflight npm OpenClaw đã chuẩn bị
   với dist-tag tương ứng ngay khi phát hành plugin npm thành công.
   Việc phát hành ClawHub có thể vẫn đang chạy khi OpenClaw npm phát hành, nhưng
   workflow phát hành in các ID lượt chạy con ngay lập tức. Mặc định workflow này
   không chờ ClawHub sau khi dispatch, nên khả năng sẵn sàng của OpenClaw npm
   không bị chặn bởi phê duyệt ClawHub hoặc công việc registry chậm hơn; đặt
   `wait_for_clawhub=true` khi ClawHub phải chặn việc hoàn tất workflow. Đường dẫn
   ClawHub thử lại các lỗi cài đặt phụ thuộc CLI tạm thời, phát hành các plugin
   đã qua preview ngay cả khi một ô preview bị lỗi không ổn định, và kết thúc bằng
   xác minh registry cho mọi phiên bản plugin dự kiến để các phát hành một phần
   vẫn hiển thị và có thể thử lại. Sau khi phát hành, chạy kiểm tra chấp nhận gói
   sau phát hành đối với gói `openclaw@YYYY.M.D-beta.N` hoặc
   `openclaw@beta` đã phát hành. Nếu một tiền phát hành đã đẩy hoặc phát hành cần sửa lỗi,
   tạo số tiền phát hành tương ứng tiếp theo; không xóa hoặc ghi lại tiền phát hành cũ.
10. Với bản ổn định, chỉ tiếp tục sau khi bản beta hoặc release candidate đã được thẩm định có
    bằng chứng xác thực bắt buộc. Phát hành npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công thông qua
    `preflight_run_id`; trạng thái sẵn sàng phát hành macOS ổn định cũng yêu cầu
    `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói, và `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy trình xác minh npm sau phát hành, E2E Telegram độc lập
    dùng published-npm tùy chọn khi cần bằng chứng kênh sau phát hành,
    quảng bá dist-tag khi cần, ghi chú GitHub release/prerelease từ phần
    `CHANGELOG.md` tương ứng hoàn chỉnh, và các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước preflight phát hành để TypeScript của kiểm thử vẫn
  được bao phủ bên ngoài gate `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước preflight phát hành để các bước kiểm tra rộng hơn về
  chu trình import và ranh giới kiến trúc đều xanh bên ngoài gate cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành
  `dist/*` dự kiến và bundle Control UI tồn tại cho bước xác thực pack
- Chạy `pnpm release:prep` sau khi tăng phiên bản root và trước khi gắn tag. Lệnh này
  chạy mọi trình tạo phát hành xác định thường bị trôi sau thay đổi
  version/config/API: phiên bản Plugin, inventory Plugin, schema cấu hình cơ sở,
  metadata cấu hình kênh được bundle, baseline tài liệu cấu hình, export SDK Plugin,
  và baseline API SDK Plugin. `pnpm release:check` chạy lại các guard đó
  ở chế độ check và báo cáo mọi lỗi trôi generated mà nó tìm thấy trong một
  lượt trước khi chạy kiểm tra phát hành package.
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi chạy toàn bộ test box tiền phát hành từ một entrypoint. Workflow này nhận một branch,
  tag, hoặc full commit SHA, dispatch `CI` thủ công, và dispatch
  `OpenClaw Release Checks` cho install smoke, package acceptance, kiểm tra package đa OS,
  QA Lab parity, Matrix, và các lane Telegram. Các lần chạy stable/default
  giữ live/E2E đầy đủ và soak đường dẫn phát hành Docker phía sau
  `run_release_soak=true`; `release_profile=full` buộc bật soak. Với
  `release_profile=full` và `rerun_group=all`, workflow cũng chạy package Telegram
  E2E trên artifact `release-package-under-test` từ release checks.
  Cung cấp `npm_telegram_package_spec` sau khi publish khi cùng Telegram E2E
  cũng cần chứng minh package npm đã publish. Cung cấp
  `package_acceptance_package_spec` sau khi publish khi Package Acceptance
  nên chạy ma trận package/update của nó trên package npm đã ship thay vì
  artifact được build từ SHA. Cung cấp
  `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng
  validation khớp với một package npm đã publish mà không buộc chạy Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng side-channel
  cho một ứng viên package trong lúc công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref`
  để pack một branch/tag/SHA `package_ref` đáng tin cậy bằng harness
  `workflow_ref` hiện tại; `source=url` cho một tarball HTTPS có SHA-256 bắt buộc;
  hoặc `source=artifact` cho một tarball được upload bởi một lần chạy GitHub
  Actions khác. Workflow resolve ứng viên thành
  `package-under-test`, tái sử dụng Docker E2E release scheduler trên tarball đó,
  và có thể chạy Telegram QA trên cùng tarball với
  `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các lane
  Docker đã chọn bao gồm `published-upgrade-survivor`, artifact package là
  ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã publish.
  `update-restart-auth` dùng package ứng viên làm cả CLI đã cài đặt và
  package-under-test để nó kiểm thử đường dẫn managed restart của lệnh update
  ứng viên.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Các hồ sơ thường dùng:
  - `smoke`: các lane cài đặt/kênh/agent, mạng gateway, và reload cấu hình
  - `package`: các lane package/update/restart/plugin gốc artifact, không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ package cộng thêm các kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần độ bao phủ CI bình thường đầy đủ
  cho ứng viên phát hành. Dispatch CI thủ công bỏ qua phạm vi changed
  và buộc các shard Linux Node, shard bundled-plugin, contract kênh,
  tương thích Node 22, `check`, `check-additional`, build smoke,
  kiểm tra tài liệu, Python skills, Windows, macOS, Android, và các lane i18n
  Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này kiểm thử
  QA-lab thông qua một OTLP/HTTP receiver cục bộ và xác minh tên span trace
  đã export, thuộc tính có giới hạn, và việc redact nội dung/identifier mà không
  cần Opik, Langfuse, hoặc collector bên ngoài khác.
- Chạy `pnpm release:check` trước mọi bản phát hành đã gắn tag
- Chạy `OpenClaw Release Publish` cho chuỗi publish có thay đổi sau khi
  tag tồn tại. Dispatch từ `release/YYYY.M.D` (hoặc `main` khi publish một
  tag reachable từ main), truyền release tag và OpenClaw npm
  `preflight_run_id` thành công, và giữ scope publish Plugin mặc định
  `all-publishable` trừ khi bạn cố ý chạy một repair tập trung. Workflow
  tuần tự hóa publish npm Plugin, publish ClawHub Plugin, và publish npm OpenClaw
  để package core không được publish trước các Plugin đã externalize của nó.
- Release checks hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane QA Lab mock parity cộng với hồ sơ
  Matrix live nhanh và lane Telegram QA trước khi phê duyệt phát hành. Các lane live
  dùng môi trường `qa-live-shared`; Telegram cũng dùng credential lease Convex CI.
  Chạy workflow thủ công `QA-Lab - All Lanes` với
  `matrix_profile=all` và `matrix_shards=true` khi bạn muốn toàn bộ inventory
  transport, media, và E2EE của Matrix chạy song song.
- Xác thực runtime cài đặt và nâng cấp đa OS là một phần của
  `OpenClaw Release Checks` công khai và `Full Release Validation`, gọi trực tiếp
  workflow tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ ý: giữ đường dẫn phát hành npm thật ngắn,
  xác định, và tập trung vào artifact, trong khi các kiểm tra live chậm hơn ở trong
  lane riêng để chúng không làm đình trệ hoặc chặn publish
- Các release check có chứa secret nên được dispatch thông qua `Full Release
Validation` hoặc từ workflow ref `main`/release để logic workflow và
  secret vẫn được kiểm soát
- `OpenClaw Release Checks` nhận một branch, tag, hoặc full commit SHA miễn là
  commit đã resolve reachable từ một branch OpenClaw hoặc release tag
- Preflight validation-only `OpenClaw NPM Release` cũng nhận SHA commit đầy đủ
  40 ký tự của workflow-branch hiện tại mà không yêu cầu một tag đã push
- Đường dẫn SHA đó chỉ dành cho validation và không thể được nâng thành publish thật
- Ở chế độ SHA, workflow tổng hợp `v<package.json version>` chỉ cho
  bước kiểm tra metadata package; publish thật vẫn yêu cầu một release tag thật
- Cả hai workflow giữ đường dẫn publish và promotion thật trên runner do GitHub host,
  trong khi đường dẫn validation không thay đổi dữ liệu có thể dùng các runner
  Blacksmith Linux lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai workflow secret `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Preflight phát hành npm không còn chờ lane release checks riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc tag beta/correction tương ứng) trước khi phê duyệt
- Sau khi publish npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/correction tương ứng) để xác minh đường dẫn cài đặt registry
  đã publish trong một temp prefix mới
- Sau một lần publish beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding package đã cài đặt, thiết lập Telegram, và E2E Telegram thật
  trên package npm đã publish bằng shared leased Telegram credential
  pool. Các lần chạy một lần cục bộ của maintainer có thể bỏ qua các biến Convex
  và truyền trực tiếp ba credential env `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy full post-publish beta smoke từ máy maintainer, dùng `pnpm release:beta-smoke -- --beta betaN`. Helper chạy xác thực Parallels npm update/fresh-target, dispatch `NPM Telegram Beta E2E`, poll đúng workflow run, tải artifact, và in báo cáo Telegram.
- Maintainer có thể chạy cùng kiểm tra post-publish từ GitHub Actions qua
  workflow thủ công `NPM Telegram Beta E2E`. Workflow này cố ý chỉ chạy thủ công
  và không chạy trên mọi merge.
- Tự động hóa phát hành của maintainer hiện dùng preflight-then-promote:
  - publish npm thật phải vượt qua một npm `preflight_run_id` thành công
  - publish npm thật phải được dispatch từ cùng branch `main` hoặc
    `release/YYYY.M.D` với lần chạy preflight thành công
  - phát hành npm stable mặc định là `beta`
  - publish npm stable có thể nhắm rõ đến `latest` qua input workflow
  - mutation npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    vì lý do bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo
    công khai giữ publish chỉ dùng OIDC
  - `macOS Release` công khai chỉ dành cho validation; khi một tag chỉ tồn tại trên
    branch release nhưng workflow được dispatch từ `main`, đặt
    `public_release_branch=release/YYYY.M.D`
  - publish mac riêng tư thật phải vượt qua private mac
    `preflight_run_id` và `validate_run_id` thành công
  - các đường dẫn publish thật promote artifact đã chuẩn bị thay vì build lại
    chúng lần nữa
- Với các bản phát hành correction stable như `YYYY.M.D-N`, verifier post-publish
  cũng kiểm tra cùng đường dẫn nâng cấp temp-prefix từ `YYYY.M.D` lên `YYYY.M.D-N`
  để các correction phát hành không thể âm thầm để các cài đặt global cũ ở lại
  payload stable cơ sở
- Preflight phát hành npm fail closed trừ khi tarball bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không ship lại dashboard trình duyệt trống
- Xác minh post-publish cũng kiểm tra rằng entrypoint Plugin đã publish và
  metadata package hiện diện trong layout registry đã cài đặt. Một bản phát hành
  ship thiếu payload runtime Plugin sẽ fail verifier postpublish và
  không thể được promote lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách npm pack `unpackedSize` trên
  tarball update ứng viên, để installer e2e bắt được pack bloat ngoài ý muốn
  trước đường dẫn publish phát hành
- Nếu công việc phát hành chạm vào kế hoạch CI, manifest timing của plugin, hoặc
  ma trận kiểm thử plugin, hãy tạo lại và review các output ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để release notes
  không mô tả layout CI cũ
- Readiness phát hành macOS stable cũng bao gồm các bề mặt updater:
  - GitHub release phải kết thúc với `.zip`, `.dmg`, và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ tới stable zip mới sau khi publish
  - app đã đóng gói phải giữ bundle id không debug, URL Sparkle feed không rỗng,
    và `CFBundleVersion` bằng hoặc cao hơn canonical Sparkle build floor
    cho phiên bản phát hành đó

## Release test boxes

`Full Release Validation` là cách operator khởi chạy tất cả kiểm thử tiền phát hành từ
một entrypoint. Để có bằng chứng commit đã pin trên một branch thay đổi nhanh, hãy dùng
helper để mọi workflow con chạy từ một branch tạm thời cố định ở SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper push `release-ci/<sha>-...`, dispatch `Full Release Validation`
từ branch đó với `ref=<sha>`, xác minh `headSha` của mọi workflow con
khớp với mục tiêu, rồi xóa branch tạm thời. Điều này tránh vô tình chứng minh
một lần chạy con `main` mới hơn.

Để xác thực nhánh hoặc thẻ phát hành, hãy chạy từ ref workflow `main` đáng tin cậy và truyền nhánh hoặc thẻ phát hành dưới dạng `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow phân giải ref mục tiêu, dispatch `CI` thủ công với `target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, chuẩn bị artifact cha `release-package-under-test` cho các kiểm tra hướng tới package, và dispatch package Telegram E2E độc lập khi `release_profile=full` với `rerun_group=all` hoặc khi `npm_telegram_package_spec` được đặt. Sau đó `OpenClaw Release Checks` mở rộng sang install smoke, kiểm tra phát hành đa hệ điều hành, phạm vi release-path live/E2E Docker khi soak được bật, Package Acceptance với Telegram package QA, QA Lab parity, live Matrix và live Telegram. Một lượt chạy đầy đủ chỉ được chấp nhận khi tóm tắt `Full Release Validation` hiển thị `normal_ci` và `release_checks` thành công. Ở chế độ full/all, child `npm_telegram` cũng phải thành công; ngoài full/all, nó được bỏ qua trừ khi đã cung cấp `npm_telegram_package_spec` đã phát hành. Tóm tắt verifier cuối cùng bao gồm các bảng job chậm nhất cho từng lượt chạy child, để release manager có thể thấy critical path hiện tại mà không cần tải log.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết ma trận giai đoạn đầy đủ, tên job workflow chính xác, khác biệt giữa hồ sơ stable và full, artifact và các handle rerun tập trung.
Các workflow child được dispatch từ ref đáng tin cậy chạy `Full Release Validation`, thường là `--ref main`, ngay cả khi `ref` mục tiêu trỏ tới một nhánh hoặc thẻ phát hành cũ hơn. Không có input workflow-ref riêng cho Full Release Validation; hãy chọn harness đáng tin cậy bằng cách chọn ref chạy workflow.
Không dùng `--ref main -f ref=<sha>` để làm bằng chứng commit chính xác trên `main` đang di chuyển; SHA commit thô không thể là workflow dispatch ref, vì vậy hãy dùng `pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn độ rộng live/provider:

- `minimum`: đường dẫn OpenAI/core live và Docker tối thiểu, nhanh nhất, trọng yếu cho phát hành
- `stable`: minimum cộng với phạm vi provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng với phạm vi provider/media tư vấn rộng

Dùng `run_release_soak=true` với `stable` khi các lane chặn phát hành đã xanh và bạn muốn sweep live/E2E toàn diện, Docker release-path, và published upgrade-survivor có giới hạn trước khi quảng bá. Sweep đó bao phủ bốn package stable mới nhất cộng với các baseline được ghim `2026.4.23` và `2026.5.2` cộng với phạm vi cũ hơn `2026.4.15`, với các baseline trùng lặp được loại bỏ và mỗi baseline được shard vào job Docker runner riêng. `full` ngầm định `run_release_soak=true`.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref mục tiêu một lần dưới dạng `release-package-under-test` và tái sử dụng artifact đó trong các kiểm tra đa hệ điều hành, Package Acceptance và release-path Docker khi soak chạy. Điều này giữ mọi box hướng tới package trên cùng một byte và tránh build package lặp lại.
Install smoke OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4`, vì lane này chứng minh cài đặt package, onboarding, khởi động gateway và một lượt agent live thay vì benchmark model mặc định chậm nhất. Ma trận live provider rộng hơn vẫn là nơi dành cho phạm vi theo model cụ thể.

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

Không dùng umbrella đầy đủ làm lượt rerun đầu tiên sau một bản sửa tập trung. Nếu một box thất bại, hãy dùng workflow child, job, lane Docker, hồ sơ package, provider model hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi bản sửa thay đổi điều phối phát hành dùng chung hoặc làm bằng chứng all-box trước đó trở nên cũ. Verifier cuối cùng của umbrella kiểm tra lại các id lượt chạy workflow child đã ghi nhận, vì vậy sau khi một workflow child được rerun thành công, chỉ rerun job cha `Verify full validation` đã thất bại.

Để phục hồi có giới hạn, truyền `rerun_group` cho umbrella. `all` là lượt chạy release-candidate thật, `ci` chỉ chạy child CI bình thường, `plugin-prerelease` chỉ chạy child plugin chỉ dành cho phát hành, `release-checks` chạy mọi box phát hành, và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` và `npm-telegram`.
Các rerun `npm-telegram` tập trung yêu cầu `npm_telegram_package_spec`; các lượt chạy full/all với `release_profile=full` dùng artifact package của release-checks. Các rerun cross-OS tập trung có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc bộ lọc OS/suite khác. Lỗi release-check QA có tính tư vấn; lỗi chỉ ở QA không chặn xác thực phát hành.

### Vitest

Box Vitest là workflow child `CI` thủ công. CI thủ công cố ý bỏ qua phạm vi changed và buộc đồ thị test bình thường cho ứng viên phát hành: các shard Linux Node, shard plugin đóng gói, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, build smoke, kiểm tra docs, Python skills, Windows, macOS, Android và Control UI i18n.

Dùng box này để trả lời "cây nguồn đã vượt qua bộ test bình thường đầy đủ chưa?" Nó không giống xác thực sản phẩm release-path. Bằng chứng cần giữ:

- tóm tắt `Full Release Validation` hiển thị URL lượt chạy `CI` đã dispatch
- lượt chạy `CI` xanh trên SHA mục tiêu chính xác
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi một lượt chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI bình thường xác định nhưng không cần các box Docker, QA Lab, live, cross-OS hoặc package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker nằm trong `OpenClaw Release Checks` thông qua `openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow `install-smoke` ở chế độ phát hành. Nó xác thực ứng viên phát hành qua các môi trường Docker đóng gói thay vì chỉ các test ở cấp nguồn.

Phạm vi Docker phát hành bao gồm:

- install smoke đầy đủ với smoke cài đặt toàn cục Bun chậm được bật
- chuẩn bị/tái sử dụng image smoke Dockerfile gốc theo SHA mục tiêu, với các job smoke QR, root/gateway và installer/Bun chạy dưới dạng các shard install-smoke riêng
- các lane E2E của repository
- các chunk Docker release-path: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g` và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài đặt/gỡ cài đặt plugin đóng gói đã tách `bundled-plugin-install-uninstall-0` đến `bundled-plugin-install-uninstall-23`
- các bộ live/E2E provider và phạm vi model live Docker khi release checks bao gồm các bộ live

Dùng artifact Docker trước khi rerun. Scheduler release-path tải lên `.artifacts/docker-tests/` với log lane, `summary.json`, `failures.json`, thời gian từng pha, JSON kế hoạch scheduler và lệnh rerun. Để phục hồi tập trung, dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì rerun mọi chunk phát hành. Các lệnh rerun được tạo bao gồm `package_artifact_run_id` trước đó và input image Docker đã chuẩn bị khi có, để một lane thất bại có thể tái sử dụng cùng tarball và image GHCR.

### QA Lab

Box QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành hành vi agentic và cấp kênh, tách biệt khỏi Vitest và cơ chế package Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane parity mock so sánh lane ứng viên OpenAI với baseline Opus 4.6 bằng gói agentic parity
- hồ sơ QA Matrix live nhanh dùng môi trường `qa-live-shared`
- lane QA Telegram live dùng lease credential Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng box này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA và luồng kênh live không?" Giữ URL artifact cho các lane parity, Matrix và Telegram khi phê duyệt phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng lượt chạy QA-Lab shard thủ công thay vì lane trọng yếu mặc định cho phát hành.

### Package

Box Package là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi `Package Acceptance` và resolver `scripts/resolve-openclaw-package-candidate.mjs`. Resolver chuẩn hóa một ứng viên thành tarball `package-under-test` được Docker E2E tiêu thụ, xác thực inventory package, ghi lại phiên bản package và SHA-256, đồng thời giữ ref harness workflow tách biệt khỏi ref nguồn package.

Các nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành OpenClaw chính xác
- `source=ref`: đóng gói một nhánh, thẻ hoặc SHA commit đầy đủ `package_ref` đáng tin cậy với harness `workflow_ref` đã chọn
- `source=url`: tải xuống `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng `.tgz` được tải lên bởi một lượt chạy GitHub Actions khác

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, artifact package phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai`. Package Acceptance giữ migration, update, khởi động lại sau update với auth đã cấu hình, dọn dẹp dependency plugin cũ, fixture plugin offline, cập nhật plugin và QA package Telegram trên cùng một tarball đã phân giải. Các release check chặn phát hành dùng baseline package đã phát hành mới nhất theo mặc định; `run_release_soak=true` hoặc `release_profile=full` mở rộng sang mọi baseline npm-published stable từ `2026.4.23` đến `latest` cộng với các fixture issue đã báo cáo. Dùng Package Acceptance với `source=npm` cho ứng viên đã phát hành, hoặc `source=ref`/`source=artifact` cho tarball npm cục bộ có SHA hỗ trợ trước khi phát hành. Đây là thay thế GitHub-native cho hầu hết phạm vi package/update trước đây cần Parallels. Các kiểm tra phát hành đa hệ điều hành vẫn quan trọng cho onboarding, installer và hành vi nền tảng theo OS, nhưng xác thực sản phẩm package/update nên ưu tiên Package Acceptance.

Checklist chuẩn cho xác thực update và plugin là [Kiểm thử update và plugin](/vi/help/testing-updates-plugins). Dùng nó khi quyết định lane cục bộ, Docker, Package Acceptance hoặc release-check nào chứng minh thay đổi cài đặt/cập nhật plugin, dọn dẹp doctor hoặc migration package đã phát hành. Migration update đã phát hành toàn diện từ mọi package stable `2026.4.23+` là workflow `Update Migration` thủ công riêng, không phải một phần của Full Release CI.

Độ nới lỏng package-acceptance cũ được cố ý giới hạn thời gian. Các gói đến
`2026.4.25` có thể dùng đường dẫn tương thích cho những khoảng trống metadata đã được xuất bản
lên npm: các mục bản kê QA riêng tư thiếu trong tarball, thiếu
`gateway install --wrapper`, thiếu tệp patch trong fixture git suy ra từ tarball,
thiếu `update.channel` được lưu bền vững, các vị trí install-record plugin cũ,
thiếu lưu bền vững install-record marketplace, và di chuyển metadata cấu hình
trong khi chạy `plugins update`. Gói `2026.4.26` đã xuất bản có thể cảnh báo
về các tệp dấu metadata bản dựng cục bộ đã được phát hành. Các gói về sau
phải đáp ứng các hợp đồng gói hiện đại; cùng những khoảng trống đó sẽ làm hỏng
xác thực phát hành.

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

- `smoke`: các lane cài đặt gói/kênh/agent nhanh, mạng Gateway, và tải lại
  cấu hình
- `package`: các hợp đồng cài đặt/cập nhật/khởi động lại/gói plugin không có
  ClawHub live; đây là mặc định kiểm tra phát hành
- `product`: `package` cộng với các kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI,
  và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để có bằng chứng Telegram cho package-candidate, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball
`package-under-test` đã phân giải vào lane Telegram; workflow Telegram độc lập
vẫn chấp nhận một spec npm đã xuất bản cho các kiểm tra sau xuất bản.

## Tự động hóa xuất bản phát hành

`OpenClaw Release Publish` là điểm vào xuất bản có thay đổi trạng thái thông thường. Nó
điều phối các workflow trusted-publisher theo thứ tự mà bản phát hành cần:

1. Check out thẻ phát hành và phân giải commit SHA của thẻ đó.
2. Xác minh thẻ có thể truy cập được từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Dispatch `OpenClaw NPM Release` với thẻ phát hành, npm dist-tag, và
   `preflight_run_id` đã lưu.

Ví dụ xuất bản beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Xuất bản stable tới dist-tag beta mặc định:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Quảng bá stable trực tiếp tới `latest` là thao tác tường minh:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa hoặc xuất bản lại tập trung. Đối với một lần sửa plugin được chọn, truyền
`plugin_publish_scope=selected` và `plugins=@openclaw/name` cho
`OpenClaw Release Publish`, hoặc dispatch trực tiếp workflow con khi
gói OpenClaw không được xuất bản.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do operator kiểm soát này:

- `tag`: thẻ phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là commit SHA
  đầy đủ 40 ký tự hiện tại của nhánh workflow cho preflight chỉ để xác thực
- `preflight_only`: `true` chỉ cho xác thực/bản dựng/gói, `false` cho đường dẫn
  xuất bản thật
- `preflight_run_id`: bắt buộc trên đường dẫn xuất bản thật để workflow dùng lại
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: thẻ mục tiêu npm cho đường dẫn xuất bản; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do operator kiểm soát này:

- `tag`: thẻ phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `npm_dist_tag`: thẻ mục tiêu npm cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa tập trung
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng workflow
  làm trình điều phối sửa chữa chỉ cho plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do operator kiểm soát này:

- `ref`: nhánh, thẻ, hoặc commit SHA đầy đủ để xác thực. Các kiểm tra mang secret
  yêu cầu commit đã phân giải phải truy cập được từ một nhánh OpenClaw hoặc
  thẻ phát hành.
- `run_release_soak`: chọn tham gia soak live/E2E toàn diện, đường dẫn phát hành Docker, và
  upgrade-survivor all-since trên các kiểm tra phát hành stable/mặc định. Nó bị buộc
  bật bởi `release_profile=full`.

Quy tắc:

- Các thẻ stable và correction có thể xuất bản tới `beta` hoặc `latest`
- Các thẻ prerelease beta chỉ có thể xuất bản tới `beta`
- Đối với `OpenClaw NPM Release`, đầu vào commit SHA đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ để xác thực
- Đường dẫn xuất bản thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh metadata đó trước khi quá trình xuất bản tiếp tục

## Trình tự phát hành npm stable

Khi cắt một bản phát hành npm stable:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi có thẻ, bạn có thể dùng commit SHA đầy đủ hiện tại của nhánh workflow
     cho một lần chạy thử không xuất bản, chỉ xác thực, của workflow preflight
2. Chọn `npm_dist_tag=beta` cho luồng beta-first thông thường, hoặc chỉ chọn `latest`
   khi bạn cố ý muốn xuất bản stable trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành, hoặc commit SHA đầy đủ
   khi bạn muốn CI thông thường cộng với phạm vi kiểm thử live prompt cache, Docker, QA Lab,
   Matrix, và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`,
   và `preflight_run_id` đã lưu; nó xuất bản các plugin được externalize lên npm
   và ClawHub trước khi quảng bá gói npm OpenClaw
7. Nếu bản phát hành đã lên `beta`, hãy dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để quảng bá phiên bản stable đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý được xuất bản trực tiếp tới `latest` và `beta`
   nên theo cùng bản dựng stable ngay lập tức, hãy dùng cùng workflow riêng tư đó
   để trỏ cả hai dist-tag tới phiên bản stable, hoặc để đồng bộ tự phục hồi theo lịch của nó
   chuyển `beta` sau

Việc thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật bởi nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ việc xuất bản chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn xuất bản trực tiếp và đường dẫn quảng bá beta-first
đều được ghi tài liệu và hiển thị với operator.

Nếu một maintainer phải fallback sang xác thực npm cục bộ, chỉ chạy mọi lệnh 1Password
CLI (`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell agent chính; việc giữ nó trong tmux giúp các prompt,
cảnh báo, và xử lý OTP có thể quan sát được và ngăn cảnh báo host lặp lại.

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
