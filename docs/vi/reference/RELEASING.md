---
read_when:
    - Đang tìm định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc kiểm tra chấp nhận gói
    - Tìm cách đặt tên phiên bản và nhịp phát hành
summary: Các luồng phát hành, danh sách kiểm tra cho người vận hành, máy kiểm chứng, cách đặt tên phiên bản và nhịp độ
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-02T23:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba316d1736eae8edd2fb0a71b9a3da345f8895c3b536e9a1f619718ea12fc851
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba nhánh phát hành công khai:

- ổn định: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ tiền phát hành được phát hành lên npm `beta`
- dev: đầu nhánh đang thay đổi của `main`

## Cách đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản tiền phát hành beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm ổn định hiện đang được quảng bá
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành ổn định và sửa lỗi ổn định mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm tới `latest` một cách rõ ràng, hoặc quảng bá một bản dựng beta đã được kiểm chứng sau đó
- Mỗi bản phát hành OpenClaw ổn định đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/gói trước, còn
  việc dựng/ký/công chứng ứng dụng mac được dành cho bản ổn định trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Bản ổn định chỉ theo sau sau khi bản beta mới nhất được xác thực
- Maintainer thường cắt bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực phát hành và sửa lỗi không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc phát hành và cần sửa lỗi, maintainer cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho maintainer

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
việc ký, công chứng, khôi phục dist-tag và chi tiết rollback khẩn cấp nằm trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI hiện tại của `main` đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thực bằng
   `/changelog`, giữ các mục hướng tới người dùng, commit, đẩy lên, rồi rebase/kéo
   thêm một lần trước khi tạo nhánh.
3. Rà soát các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do vì sao nó được
   cố ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, chạy
   `pnpm plugins:sync` để các gói Plugin có thể phát hành dùng chung phiên bản
   phát hành và siêu dữ liệu tương thích, sau đó chạy preflight xác định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, và
   `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA nhánh phát hành đầy đủ 40 ký tự được phép dùng cho preflight chỉ để xác thực.
   Lưu `preflight_run_id` thành công.
7. Khởi động tất cả các bài kiểm thử tiền phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, làn, job workflow,
   hồ sơ gói, provider, hoặc allowlist model nhỏ nhất đã thất bại để chứng minh
   bản sửa. Chỉ chạy lại toàn bộ umbrella khi bề mặt thay đổi làm bằng chứng trước đó
   không còn mới.
9. Đối với beta, gắn thẻ `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` tương ứng. Nó xác minh `pnpm plugins:sync:check`,
   phát hành tất cả các gói Plugin có thể phát hành lên npm trước, phát hành cùng
   tập hợp đó lên ClawHub thứ hai, rồi quảng bá artifact preflight npm OpenClaw đã chuẩn bị
   với dist-tag tương ứng. Sau khi phát hành, chạy kiểm nhận gói sau phát hành
   đối với gói `openclaw@YYYY.M.D-beta.N` hoặc `openclaw@beta` đã phát hành.
   Nếu một tiền phát hành đã được đẩy hoặc phát hành cần sửa lỗi,
   cắt số tiền phát hành tương ứng tiếp theo; không xóa hoặc viết lại tiền phát hành cũ.
10. Đối với bản ổn định, chỉ tiếp tục sau khi beta hoặc release candidate đã được kiểm chứng có
    bằng chứng xác thực bắt buộc. Việc phát hành npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công thông qua
    `preflight_run_id`; mức sẵn sàng phát hành macOS ổn định cũng yêu cầu
    `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói và `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy trình xác minh sau phát hành npm, E2E Telegram độc lập
    tùy chọn cho npm đã phát hành khi bạn cần bằng chứng kênh sau phát hành,
    quảng bá dist-tag khi cần, ghi chú release/prerelease trên GitHub từ
    toàn bộ phần `CHANGELOG.md` tương ứng, và các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước bước kiểm tra sơ bộ phát hành để TypeScript trong kiểm thử vẫn được bao phủ ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước bước kiểm tra sơ bộ phát hành để các kiểm tra rộng hơn về chu trình import và ranh giới kiến trúc đều xanh ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành `dist/*` dự kiến và bundle Control UI tồn tại cho bước xác thực đóng gói
- Chạy `pnpm plugins:sync` sau khi tăng phiên bản ở root và trước khi gắn thẻ. Lệnh này cập nhật phiên bản các package Plugin có thể phát hành, metadata tương thích peer/API của OpenClaw, metadata build, và các stub changelog Plugin để khớp với phiên bản phát hành core. `pnpm plugins:sync:check` là chốt phát hành không làm thay đổi dữ liệu; workflow phát hành sẽ thất bại trước mọi thay đổi registry nếu bước này bị quên.
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để khởi chạy tất cả hộp kiểm thử tiền phát hành từ một điểm vào. Workflow này chấp nhận một nhánh, thẻ, hoặc SHA commit đầy đủ, dispatch `CI` thủ công, và dispatch `OpenClaw Release Checks` cho smoke cài đặt, chấp nhận package, các bộ kiểm thử đường dẫn phát hành Docker, live/E2E, OpenWebUI, đối sánh QA Lab, Matrix, và các lane Telegram. Với `release_profile=full` và `rerun_group=all`, workflow cũng chạy package Telegram E2E dựa trên artifact `release-package-under-test` từ các kiểm tra phát hành. Cung cấp `npm_telegram_package_spec` sau khi phát hành khi cùng Telegram E2E cũng cần chứng minh package npm đã phát hành. Cung cấp `package_acceptance_package_spec` sau khi phát hành khi Package Acceptance cần chạy ma trận package/cập nhật của nó dựa trên package npm đã xuất xưởng thay vì artifact được build từ SHA. Cung cấp `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng việc xác thực khớp với một package npm đã phát hành mà không buộc chạy Telegram E2E. Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng kênh phụ cho một ứng viên package trong lúc công việc phát hành tiếp tục. Dùng `source=npm` cho `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref` để đóng gói một nhánh/thẻ/SHA `package_ref` đáng tin cậy bằng harness `workflow_ref` hiện tại; `source=url` cho tarball HTTPS với SHA-256 bắt buộc; hoặc `source=artifact` cho tarball được tải lên bởi một lần chạy GitHub Actions khác. Workflow phân giải ứng viên thành `package-under-test`, tái sử dụng bộ lập lịch phát hành Docker E2E dựa trên tarball đó, và có thể chạy Telegram QA dựa trên cùng tarball với `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các lane Docker được chọn bao gồm `published-upgrade-survivor`, artifact package là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã phát hành.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Hồ sơ phổ biến:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway, và tải lại cấu hình
  - `package`: các lane package/cập nhật/Plugin gốc artifact không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ package cộng với kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần độ bao phủ CI thông thường đầy đủ cho ứng viên phát hành. Dispatch CI thủ công bỏ qua phạm vi changed và buộc chạy các shard Linux Node, shard Plugin đóng gói, hợp đồng kênh, tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Python skills, Windows, macOS, Android, và các lane i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này chạy QA-lab qua một bộ nhận OTLP/HTTP cục bộ và xác minh tên span trace được xuất, thuộc tính có giới hạn, và việc biên tập nội dung/định danh mà không yêu cầu Opik, Langfuse, hoặc một collector bên ngoài khác.
- Chạy `pnpm release:check` trước mọi bản phát hành đã gắn thẻ
- Chạy `OpenClaw Release Publish` cho chuỗi phát hành có thay đổi sau khi thẻ đã tồn tại. Dispatch workflow này từ `release/YYYY.M.D` (hoặc `main` khi phát hành một thẻ có thể truy cập từ main), truyền thẻ phát hành và `preflight_run_id` npm OpenClaw thành công, và giữ phạm vi phát hành Plugin mặc định `all-publishable` trừ khi bạn cố ý chạy một bản sửa chữa tập trung. Workflow tuần tự hóa phát hành npm Plugin, phát hành ClawHub Plugin, và phát hành npm OpenClaw để package core không được phát hành trước các Plugin đã được externalize.
- Các kiểm tra phát hành hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane đối sánh mock QA Lab cùng với hồ sơ Matrix live nhanh và lane Telegram QA trước khi phê duyệt phát hành. Các lane live dùng môi trường `qa-live-shared`; Telegram cũng dùng lease thông tin xác thực Convex CI. Chạy workflow thủ công `QA-Lab - All Lanes` với `matrix_profile=all` và `matrix_shards=true` khi bạn muốn toàn bộ inventory truyền tải Matrix, media, và E2EE chạy song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của `OpenClaw Release Checks` và `Full Release Validation` công khai, vốn gọi trực tiếp workflow tái sử dụng `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ ý: giữ đường dẫn phát hành npm thật ngắn, xác định được, và tập trung vào artifact, trong khi các kiểm tra live chậm hơn ở lane riêng để chúng không làm đình trệ hoặc chặn phát hành
- Các kiểm tra phát hành mang bí mật nên được dispatch thông qua `Full Release Validation` hoặc từ workflow ref `main`/release để logic workflow và bí mật vẫn được kiểm soát
- `OpenClaw Release Checks` chấp nhận một nhánh, thẻ, hoặc SHA commit đầy đủ miễn là commit đã phân giải có thể truy cập từ một nhánh OpenClaw hoặc thẻ phát hành
- Kiểm tra sơ bộ chỉ xác thực `OpenClaw NPM Release` cũng chấp nhận SHA commit đầy đủ 40 ký tự của nhánh workflow hiện tại mà không yêu cầu thẻ đã được đẩy
- Đường dẫn SHA đó chỉ dành cho xác thực và không thể được thăng cấp thành phát hành thật
- Ở chế độ SHA, workflow chỉ tổng hợp `v<package.json version>` cho kiểm tra metadata package; phát hành thật vẫn yêu cầu thẻ phát hành thật
- Cả hai workflow giữ đường dẫn phát hành và thăng cấp thật trên runner do GitHub host, trong khi đường dẫn xác thực không làm thay đổi dữ liệu có thể dùng các runner Linux Blacksmith lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Kiểm tra sơ bộ phát hành npm không còn chờ lane kiểm tra phát hành riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc thẻ beta/correction tương ứng) trước khi phê duyệt
- Sau khi phát hành npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/correction tương ứng) để xác minh đường dẫn cài đặt registry đã phát hành trong một prefix tạm mới
- Sau một bản phát hành beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding package đã cài đặt, thiết lập Telegram, và Telegram E2E thật dựa trên package npm đã phát hành bằng pool thông tin xác thực Telegram thuê dùng chung. Các lần chạy một lần cục bộ của maintainer có thể bỏ qua các biến Convex và truyền trực tiếp ba thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Maintainer có thể chạy cùng kiểm tra sau phát hành từ GitHub Actions qua workflow thủ công `NPM Telegram Beta E2E`. Workflow này cố ý chỉ chạy thủ công và không chạy trên mọi merge.
- Tự động hóa phát hành của maintainer hiện dùng kiểm tra sơ bộ rồi thăng cấp:
  - phát hành npm thật phải vượt qua một npm `preflight_run_id` thành công
  - phát hành npm thật phải được dispatch từ cùng nhánh `main` hoặc `release/YYYY.M.D` với lần chạy kiểm tra sơ bộ thành công
  - phát hành npm ổn định mặc định là `beta`
  - phát hành npm ổn định có thể nhắm rõ ràng tới `latest` qua input workflow
  - thay đổi npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    vì lý do bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo công khai giữ phát hành chỉ dùng OIDC
  - `macOS Release` công khai chỉ dành cho xác thực; khi một thẻ chỉ tồn tại trên nhánh phát hành nhưng workflow được dispatch từ `main`, đặt `public_release_branch=release/YYYY.M.D`
  - phát hành mac riêng tư thật phải vượt qua `preflight_run_id` và `validate_run_id` mac riêng tư thành công
  - các đường dẫn phát hành thật thăng cấp artifact đã chuẩn bị thay vì build lại chúng
- Với các bản phát hành sửa lỗi ổn định như `YYYY.M.D-N`, bộ xác minh sau phát hành cũng kiểm tra cùng đường dẫn nâng cấp temp-prefix từ `YYYY.M.D` lên `YYYY.M.D-N` để các bản sửa lỗi phát hành không thể âm thầm để các bản cài đặt global cũ ở payload ổn định gốc
- Kiểm tra sơ bộ phát hành npm thất bại đóng nếu tarball không chứa cả `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng, để chúng ta không phát hành lại một dashboard trình duyệt rỗng
- Xác minh sau phát hành cũng kiểm tra rằng các entrypoint Plugin đã phát hành và metadata package có mặt trong bố cục registry đã cài đặt. Một bản phát hành thiếu payload runtime Plugin sẽ thất bại ở bộ xác minh postpublish và không thể được thăng cấp lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của npm pack trên tarball cập nhật ứng viên, để installer e2e bắt được việc phình to gói ngoài ý muốn trước đường dẫn phát hành
- Nếu công việc phát hành đã chạm tới lập kế hoạch CI, manifest thời gian của Plugin, hoặc ma trận kiểm thử Plugin, hãy tạo lại và rà soát các output ma trận `plugin-prerelease-extension-shard` do planner sở hữu từ `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành không mô tả một bố cục CI lỗi thời
- Mức sẵn sàng phát hành macOS ổn định cũng bao gồm các bề mặt updater:
  - GitHub release phải kết thúc với `.zip`, `.dmg`, và `.dSYM.zip` đã được đóng gói
  - `appcast.xml` trên `main` phải trỏ tới zip ổn định mới sau khi phát hành
  - app đã đóng gói phải giữ bundle id không phải debug, URL feed Sparkle không rỗng, và `CFBundleVersion` bằng hoặc cao hơn mức sàn build Sparkle chuẩn cho phiên bản phát hành đó

## Hộp kiểm thử phát hành

`Full Release Validation` là cách các operator khởi chạy tất cả kiểm thử tiền phát hành từ một điểm vào. Để có bằng chứng commit đã ghim trên một nhánh thay đổi nhanh, dùng helper để mọi workflow con chạy từ một nhánh tạm cố định tại SHA đích:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper đẩy `release-ci/<sha>-...`, dispatch `Full Release Validation` từ nhánh đó với `ref=<sha>`, xác minh mọi workflow con có `headSha` khớp với mục tiêu, rồi xóa nhánh tạm. Điều này tránh việc vô tình chứng minh một lần chạy con `main` mới hơn.

Để xác thực nhánh phát hành hoặc thẻ, chạy workflow từ ref workflow `main` đáng tin cậy và truyền nhánh phát hành hoặc thẻ làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Quy trình làm việc phân giải ref mục tiêu, dispatch `CI` thủ công với
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, và dispatch
Telegram E2E gói độc lập khi `release_profile=full` với `rerun_group=all` hoặc
khi `npm_telegram_package_spec` được đặt. Sau đó `OpenClaw Release
Checks` mở rộng ra install smoke, kiểm tra phát hành đa hệ điều hành, phạm vi
đường dẫn phát hành Docker live/E2E, Package Acceptance với QA gói Telegram, QA
Lab parity, Matrix live, và Telegram live. Một lần chạy đầy đủ chỉ được chấp
nhận khi bản tóm tắt `Full Release Validation` hiển thị `normal_ci` và
`release_checks` là thành công. Ở chế độ full/all, child `npm_telegram` cũng
phải thành công; ngoài full/all thì nó bị bỏ qua trừ khi đã cung cấp
`npm_telegram_package_spec` đã xuất bản. Bản tóm tắt trình xác minh cuối cùng
bao gồm các bảng job chậm nhất cho từng lần chạy child, để release manager có
thể thấy đường găng hiện tại mà không cần tải logs.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết ma
trận stage đầy đủ, tên job workflow chính xác, khác biệt giữa profile stable và
full, artifacts, và các handle rerun tập trung.
Các workflow child được dispatch từ ref tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` mục tiêu trỏ tới một
nhánh hoặc tag phát hành cũ hơn. Không có input workflow-ref riêng cho Full Release Validation; chọn harness tin cậy bằng cách chọn ref chạy workflow.
Không dùng `--ref main -f ref=<sha>` để làm bằng chứng commit chính xác trên
`main` đang di chuyển; SHA commit thô không thể là workflow dispatch refs, vì
vậy hãy dùng `pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn phạm vi live/provider:

- `minimum`: đường dẫn live và Docker OpenAI/core quan trọng cho phát hành nhanh nhất
- `stable`: minimum cộng thêm phạm vi provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng thêm phạm vi provider/media tư vấn rộng

`OpenClaw Release Checks` dùng ref workflow tin cậy để phân giải ref mục tiêu
một lần thành `release-package-under-test` và tái sử dụng artifact đó trong cả
kiểm tra Docker đường dẫn phát hành lẫn Package Acceptance. Điều này giữ tất cả
box hướng tới gói trên cùng một bytes và tránh build gói lặp lại.
OpenAI install smoke đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4`, vì lane này chứng
minh cài đặt gói, onboarding, khởi động gateway, và một lượt agent live thay vì
benchmark model mặc định chậm nhất. Ma trận provider live rộng hơn vẫn là nơi
cho phạm vi riêng theo model.

Dùng các biến thể này tùy theo stage phát hành:

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

Không dùng umbrella đầy đủ làm lần rerun đầu tiên sau một bản sửa tập trung.
Nếu một box thất bại, hãy dùng workflow child, job, lane Docker, profile gói,
provider model, hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại
umbrella đầy đủ khi bản sửa đã thay đổi điều phối phát hành dùng chung hoặc làm
bằng chứng toàn bộ box trước đó trở nên lỗi thời. Trình xác minh cuối cùng của
umbrella kiểm tra lại các id lần chạy workflow child đã ghi, vì vậy sau khi một
workflow child được rerun thành công, chỉ rerun job cha `Verify full validation`
đã thất bại.

Để khôi phục có giới hạn, truyền `rerun_group` cho umbrella. `all` là lần chạy
release-candidate thực sự, `ci` chỉ chạy child CI bình thường, `plugin-prerelease`
chỉ chạy child plugin chỉ dành cho phát hành, `release-checks` chạy mọi box phát
hành, và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram`.
Rerun `npm-telegram` tập trung yêu cầu `npm_telegram_package_spec`; các lần chạy
full/all với `release_profile=full` dùng artifact gói release-checks.

### Vitest

Box Vitest là workflow child `CI` thủ công. CI thủ công cố ý bỏ qua phạm vi
changed và buộc đồ thị kiểm thử bình thường cho release candidate: Linux Node
shards, bundled-plugin shards, channel contracts, tương thích Node 22, `check`,
`check-additional`, build smoke, kiểm tra docs, Python skills, Windows, macOS,
Android, và i18n Control UI.

Dùng box này để trả lời "source tree có vượt qua bộ kiểm thử bình thường đầy đủ
không?" Nó không giống xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng
cần giữ:

- bản tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã dispatch
- lần chạy `CI` xanh trên SHA mục tiêu chính xác
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi một lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi phát hành cần CI bình thường có tính xác định
nhưng không cần các box Docker, QA Lab, live, đa hệ điều hành, hoặc gói:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow `install-smoke`
ở chế độ phát hành. Nó xác thực release candidate thông qua môi trường Docker
đóng gói thay vì chỉ kiểm thử cấp source.

Phạm vi Docker phát hành bao gồm:

- install smoke đầy đủ với smoke cài đặt global Bun chậm được bật
- chuẩn bị/tái sử dụng image smoke Dockerfile gốc theo SHA mục tiêu, với các job QR, root/gateway, và installer/Bun smoke chạy dưới dạng install-smoke shards riêng
- các lane E2E repository
- các chunk Docker đường dẫn phát hành: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài đặt/gỡ cài đặt bundled plugin được tách riêng
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- bộ provider live/E2E và phạm vi model live Docker khi release checks bao gồm bộ live

Dùng artifacts Docker trước khi rerun. Bộ lập lịch đường dẫn phát hành upload
`.artifacts/docker-tests/` với logs lane, `summary.json`, `failures.json`, thời
gian phase, JSON kế hoạch scheduler, và lệnh rerun. Để khôi phục tập trung, dùng
`docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì rerun
tất cả chunk phát hành. Các lệnh rerun được tạo bao gồm `package_artifact_run_id`
trước đó và input image Docker đã chuẩn bị khi có, vì vậy lane thất bại có thể
tái sử dụng cùng tarball và image GHCR.

### QA Lab

Box QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát
hành về hành vi agentic và cấp channel, tách biệt với cơ chế gói Vitest và
Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane parity mock so sánh lane candidate OpenAI với baseline Opus 4.6 bằng agentic parity pack
- profile QA Matrix live nhanh dùng môi trường `qa-live-shared`
- lane QA Telegram live dùng lease credentials Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng box này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA
và luồng channel live không?" Giữ URL artifact cho các lane parity, Matrix, và
Telegram khi phê duyệt phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng
lần chạy QA-Lab thủ công chia shard thay vì lane mặc định quan trọng cho phát
hành.

### Gói

Box Gói là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver chuẩn hóa một
candidate thành tarball `package-under-test` được Docker E2E tiêu thụ, xác thực
inventory gói, ghi lại phiên bản gói và SHA-256, và giữ ref harness workflow
tách biệt với ref source gói.

Nguồn candidate được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác
- `source=ref`: đóng gói một nhánh, tag, hoặc SHA commit đầy đủ `package_ref` tin cậy với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` được upload bởi một lần chạy GitHub Actions khác

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, artifact
gói phát hành đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues`, và
`telegram_mode=mock-openai`. Package Acceptance giữ migration, update, dọn dẹp
phụ thuộc Plugin cũ, fixture Plugin offline, update Plugin, và QA gói Telegram
trên cùng một tarball đã phân giải. Ma trận upgrade bao phủ mọi baseline ổn định
đã xuất bản npm từ `2026.4.23` đến `latest`; dùng Package Acceptance với
`source=npm` cho candidate đã được phát hành, hoặc `source=ref`/`source=artifact`
cho tarball npm cục bộ có SHA hậu thuẫn trước khi publish. Đây là phương án
GitHub-native thay thế cho hầu hết phạm vi gói/update trước đây cần Parallels.
Kiểm tra phát hành đa hệ điều hành vẫn quan trọng cho onboarding, installer, và
hành vi nền tảng đặc thù hệ điều hành, nhưng xác thực sản phẩm gói/update nên ưu
tiên Package Acceptance.

Checklist chuẩn cho xác thực update và Plugin là
[Kiểm thử update và Plugin](/vi/help/testing-updates-plugins). Dùng checklist đó
khi quyết định lane cục bộ, Docker, Package Acceptance, hoặc release-check nào
chứng minh một thay đổi cài đặt/update Plugin, dọn dẹp doctor, hoặc migration
gói đã xuất bản. Migration update đã xuất bản toàn diện từ mọi gói ổn định
`2026.4.23+` là workflow `Update Migration` thủ công riêng, không phải một phần
của Full Release CI.

Sự nới lỏng package-acceptance legacy được cố ý giới hạn thời gian. Các gói đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống metadata đã
xuất bản lên npm: mục inventory QA riêng tư bị thiếu khỏi tarball, thiếu
`gateway install --wrapper`, thiếu patch files trong fixture git dẫn xuất từ
tarball, thiếu `update.channel` đã lưu, vị trí install-record Plugin legacy,
thiếu lưu install-record marketplace, và migration metadata config trong
`plugins update`. Gói `2026.4.26` đã xuất bản có thể cảnh báo về các file stamp
metadata build cục bộ đã được phát hành. Các gói về sau phải đáp ứng hợp đồng
gói hiện đại; cùng các khoảng trống đó sẽ làm xác thực phát hành thất bại.

Dùng các profile Package Acceptance rộng hơn khi câu hỏi phát hành liên quan
đến một gói thực sự có thể cài đặt:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Các profile gói phổ biến:

- `smoke`: lane cài đặt gói/channel/agent nhanh, mạng gateway, và reload config
- `package`: hợp đồng cài đặt/update/gói Plugin không có ClawHub live; đây là mặc định của release-check
- `product`: `package` cộng thêm MCP channels, dọn dẹp cron/subagent, tìm kiếm web OpenAI, và OpenWebUI
- `full`: chunk đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho rerun tập trung

Để có bằng chứng Telegram cho gói ứng viên, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Quy trình làm việc truyền tarball
`package-under-test` đã phân giải vào làn Telegram; quy trình làm việc Telegram độc lập
vẫn chấp nhận một đặc tả npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành bản phát hành

`OpenClaw Release Publish` là điểm vào phát hành có thay đổi trạng thái thông thường. Nó
điều phối các quy trình làm việc trusted publisher theo thứ tự mà bản phát hành cần:

1. Checkout thẻ phát hành và phân giải SHA commit của thẻ đó.
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

Phát hành ổn định tới dist-tag beta mặc định:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Thăng hạng ổn định trực tiếp lên `latest` là hành động tường minh:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Chỉ dùng các quy trình làm việc cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa tập trung hoặc phát hành lại. Để sửa chữa một Plugin đã chọn, truyền
`plugin_publish_scope=selected` và `plugins=@openclaw/name` cho
`OpenClaw Release Publish`, hoặc kích hoạt trực tiếp quy trình làm việc con khi
gói OpenClaw không được phát hành.

## Đầu vào quy trình làm việc NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc, chẳng hạn như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit
  đầy đủ 40 ký tự hiện tại của nhánh quy trình làm việc cho preflight chỉ xác thực
- `preflight_only`: `true` cho chỉ xác thực/xây dựng/đóng gói, `false` cho đường dẫn
  phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để quy trình làm việc tái sử dụng
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: thẻ đích npm cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `npm_dist_tag`: thẻ đích npm cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa tập trung
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng quy trình làm việc
  làm bộ điều phối sửa chữa chỉ dành cho Plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `ref`: nhánh, thẻ hoặc SHA commit đầy đủ để xác thực. Các kiểm tra mang bí mật
  yêu cầu commit đã phân giải phải có thể truy cập từ một nhánh OpenClaw hoặc
  thẻ phát hành.

Quy tắc:

- Thẻ ổn định và thẻ sửa lỗi có thể phát hành tới `beta` hoặc `latest`
- Thẻ beta prerelease chỉ có thể phát hành tới `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn luôn
  chỉ xác thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  quy trình làm việc xác minh siêu dữ liệu đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi cắt một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi thẻ tồn tại, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh quy trình làm việc
     để chạy thử khô chỉ xác thực cho quy trình làm việc preflight
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc `latest` chỉ
   khi bạn chủ ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành hoặc SHA commit đầy đủ
   khi bạn muốn CI thông thường cùng với phạm vi bao phủ live prompt cache, Docker, QA Lab,
   Matrix và Telegram từ một quy trình làm việc thủ công
4. Nếu bạn chủ ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   quy trình làm việc `CI` thủ công trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`,
   và `preflight_run_id` đã lưu; nó phát hành các Plugin đã ngoại hóa lên npm
   và ClawHub trước khi thăng hạng gói npm OpenClaw
7. Nếu bản phát hành đã vào `beta`, dùng quy trình làm việc riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để thăng hạng phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành chủ ý được phát hành trực tiếp lên `latest` và `beta`
   nên trỏ ngay tới cùng bản dựng ổn định đó, hãy dùng cùng quy trình làm việc riêng tư
   để trỏ cả hai dist-tag tới phiên bản ổn định, hoặc để đồng bộ tự phục hồi theo lịch của nó
   chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật, vì nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ phát hành chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn phát hành trực tiếp và đường dẫn thăng hạng beta-trước
đều được ghi tài liệu và hiển thị với người vận hành.

Nếu một maintainer phải fallback sang xác thực npm cục bộ, chỉ chạy bất kỳ lệnh CLI
1Password (`op`) nào bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell agent chính; giữ nó bên trong tmux làm cho các prompt,
cảnh báo và xử lý OTP có thể quan sát được và ngăn cảnh báo máy chủ lặp lại.

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
