---
read_when:
    - Đang tìm kiếm các định nghĩa về kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc kiểm định chấp nhận gói
    - Tìm thông tin về cách đặt tên phiên bản và nhịp phát hành
summary: Các luồng phát hành, danh sách kiểm tra cho người vận hành, hộp xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-02T10:52:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce52c9144de3c8b914954db64f6ca5b2196edbbdcc7385984235a39c208bb59e
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba nhánh phát hành công khai:

- ổn định: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ prerelease phát hành lên npm `beta`
- dev: đầu nhánh đang thay đổi của `main`

## Đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản beta prerelease: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm ổn định hiện tại đã được promote
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành ổn định và sửa lỗi ổn định mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm đến `latest` rõ ràng, hoặc promote một bản dựng beta đã được kiểm định sau đó
- Mỗi bản phát hành OpenClaw ổn định đều phân phối gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/gói trước, với
  quá trình build/sign/notarize ứng dụng mac chỉ dành cho bản ổn định trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Bản ổn định chỉ theo sau sau khi bản beta mới nhất được xác thực
- Maintainer thường cắt bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc phát hành và cần sửa lỗi, maintainer cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho maintainer

## Checklist cho người vận hành phát hành

Checklist này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, notarization, khôi phục dist-tag và chi tiết rollback khẩn cấp nằm trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: pull mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần trên cùng của `CHANGELOG.md` từ lịch sử commit thực bằng
   `/changelog`, giữ các mục hướng đến người dùng, commit, push, rồi rebase/pull
   thêm một lần trước khi tạo nhánh.
3. Rà soát hồ sơ tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do vì sao nó được
   cố ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, chạy
   `pnpm plugins:sync` để các gói Plugin có thể phát hành chia sẻ phiên bản phát hành
   và siêu dữ liệu tương thích, rồi chạy preflight tất định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, và
   `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA nhánh phát hành đủ 40 ký tự được phép dùng cho preflight chỉ để xác thực.
   Lưu `preflight_run_id` thành công.
7. Khởi chạy toàn bộ kiểm thử trước phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, lane, job workflow,
   profile gói, provider hoặc allowlist model nhỏ nhất đã thất bại để chứng minh bản sửa.
   Chỉ chạy lại toàn bộ umbrella khi bề mặt thay đổi làm bằng chứng trước đó bị cũ.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` tương ứng. Nó xác minh `pnpm plugins:sync:check`,
   phát hành tất cả các gói Plugin có thể phát hành lên npm trước, phát hành cùng
   tập đó lên ClawHub sau, rồi promote artifact preflight npm OpenClaw đã chuẩn bị
   với dist-tag `beta`. Sau khi phát hành, chạy package acceptance sau phát hành
   đối với gói `openclaw@YYYY.M.D-beta.N` hoặc `openclaw@beta` đã phát hành.
   Nếu một beta đã được đẩy hoặc phát hành cần sửa lỗi, hãy cắt `-beta.N` tiếp theo;
   không xóa hoặc viết lại beta cũ.
10. Với bản ổn định, chỉ tiếp tục sau khi beta đã được kiểm định hoặc release candidate có
    bằng chứng xác thực bắt buộc. Phát hành npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công qua
    `preflight_run_id`; trạng thái sẵn sàng phát hành macOS ổn định cũng yêu cầu
    `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói và `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy trình xác minh npm sau phát hành, E2E Telegram độc lập
    tùy chọn trên npm đã phát hành khi bạn cần bằng chứng kênh sau phát hành,
    promote dist-tag khi cần, ghi chú GitHub release/prerelease từ phần
    `CHANGELOG.md` tương ứng đầy đủ, và các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước bước kiểm tra trước khi phát hành để TypeScript của bài kiểm thử vẫn được bao phủ ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước bước kiểm tra trước khi phát hành để các kiểm tra rộng hơn về vòng lặp import và ranh giới kiến trúc đều xanh ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực đóng gói
- Chạy `pnpm plugins:sync` sau khi tăng phiên bản gốc và trước khi gắn thẻ. Lệnh này cập nhật phiên bản gói plugin có thể xuất bản, metadata tương thích peer/API của OpenClaw, metadata bản dựng và stub changelog plugin để khớp với phiên bản phát hành lõi. `pnpm plugins:sync:check` là chốt phát hành không làm thay đổi dữ liệu; workflow xuất bản sẽ thất bại trước bất kỳ thay đổi registry nào nếu quên bước này.
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để khởi chạy tất cả hộp kiểm thử tiền phát hành từ một điểm vào. Workflow này chấp nhận một nhánh, thẻ hoặc SHA commit đầy đủ, dispatch `CI` thủ công và dispatch `OpenClaw Release Checks` cho kiểm thử smoke cài đặt, chấp nhận gói, bộ kiểm thử đường dẫn phát hành Docker, live/E2E, OpenWebUI, đối sánh QA Lab, Matrix và các lane Telegram. Với `release_profile=full` và `rerun_group=all`, nó cũng chạy Telegram E2E của gói đối với artifact `release-package-under-test` từ các kiểm tra phát hành. Cung cấp `npm_telegram_package_spec` sau khi xuất bản khi cùng Telegram E2E cũng cần chứng minh gói npm đã xuất bản. Cung cấp `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng việc xác thực khớp với một gói npm đã xuất bản mà không buộc chạy Telegram E2E. Ví dụ: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng kênh phụ cho một ứng viên gói trong lúc công việc phát hành tiếp tục. Dùng `source=npm` cho `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành chính xác; `source=ref` để đóng gói một nhánh/thẻ/SHA `package_ref` đáng tin cậy với bộ kiểm thử `workflow_ref` hiện tại; `source=url` cho tarball HTTPS với SHA-256 bắt buộc; hoặc `source=artifact` cho tarball được tải lên bởi một lần chạy GitHub Actions khác. Workflow phân giải ứng viên thành `package-under-test`, tái sử dụng bộ lập lịch phát hành Docker E2E đối với tarball đó và có thể chạy Telegram QA đối với cùng tarball bằng `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các lane Docker được chọn bao gồm `published-upgrade-survivor`, artifact gói là ứng viên và `published_upgrade_survivor_baseline` chọn baseline đã xuất bản.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Hồ sơ phổ biến:
  - `smoke`: các lane cài đặt/kênh/tác nhân, mạng gateway và tải lại cấu hình
  - `package`: các lane gói/cập nhật/plugin dùng trực tiếp artifact, không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ gói cộng thêm kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn chính xác `docker_lanes` cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần độ bao phủ CI bình thường đầy đủ cho ứng viên phát hành. Dispatch CI thủ công bỏ qua phạm vi theo thay đổi và bắt buộc chạy các shard Linux Node, shard plugin đi kèm, hợp đồng kênh, tương thích Node 22, `check`, `check-additional`, smoke bản dựng, kiểm tra tài liệu, Python skills, Windows, macOS, Android và các lane i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này chạy QA-lab qua một bộ nhận OTLP/HTTP cục bộ và xác minh tên span trace đã xuất, thuộc tính có giới hạn, cũng như việc biên tập nội dung/mã định danh mà không cần Opik, Langfuse hoặc bộ thu thập bên ngoài khác.
- Chạy `pnpm release:check` trước mỗi bản phát hành được gắn thẻ
- Chạy `OpenClaw Release Publish` cho chuỗi xuất bản có thay đổi sau khi thẻ tồn tại. Dispatch từ `release/YYYY.M.D` (hoặc `main` khi xuất bản một thẻ có thể truy cập từ main), truyền thẻ phát hành và `preflight_run_id` npm OpenClaw thành công, đồng thời giữ phạm vi xuất bản plugin mặc định `all-publishable` trừ khi bạn cố ý chạy một lần sửa chữa tập trung. Workflow tuần tự hóa xuất bản npm plugin, xuất bản ClawHub plugin và xuất bản npm OpenClaw để gói lõi không được xuất bản trước các plugin đã được tách ra bên ngoài.
- Các kiểm tra phát hành hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy cổng đối sánh mock QA Lab cùng hồ sơ Matrix live nhanh và lane Telegram QA trước khi phê duyệt phát hành. Các lane live dùng môi trường `qa-live-shared`; Telegram cũng dùng lease thông tin xác thực Convex CI. Chạy workflow thủ công `QA-Lab - All Lanes` với `matrix_profile=all` và `matrix_shards=true` khi bạn muốn kiểm kê đầy đủ transport, media và E2EE của Matrix chạy song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của `OpenClaw Release Checks` công khai và `Full Release Validation`, các workflow này gọi trực tiếp workflow có thể tái sử dụng `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ ý: giữ đường dẫn phát hành npm thật ngắn, xác định được và tập trung vào artifact, trong khi các kiểm tra live chậm hơn nằm trong lane riêng để chúng không làm đình trệ hoặc chặn xuất bản
- Các kiểm tra phát hành mang bí mật nên được dispatch thông qua `Full Release Validation` hoặc từ workflow ref `main`/release để logic workflow và bí mật vẫn được kiểm soát
- `OpenClaw Release Checks` chấp nhận một nhánh, thẻ hoặc SHA commit đầy đủ miễn là commit đã phân giải có thể truy cập từ một nhánh OpenClaw hoặc thẻ phát hành
- Bước kiểm tra trước chỉ xác thực của `OpenClaw NPM Release` cũng chấp nhận SHA commit đầy đủ 40 ký tự hiện tại của nhánh workflow mà không yêu cầu thẻ đã được đẩy lên
- Đường dẫn SHA đó chỉ dành cho xác thực và không thể được nâng cấp thành xuất bản thật
- Ở chế độ SHA, workflow chỉ tổng hợp `v<package.json version>` cho kiểm tra metadata gói; xuất bản thật vẫn yêu cầu thẻ phát hành thật
- Cả hai workflow giữ đường dẫn xuất bản và thăng cấp thật trên runner do GitHub lưu trữ, trong khi đường dẫn xác thực không làm thay đổi dữ liệu có thể dùng các runner Linux Blacksmith lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Bước kiểm tra trước phát hành npm không còn chờ lane kiểm tra phát hành riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc thẻ beta/correction tương ứng) trước khi phê duyệt
- Sau khi xuất bản npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/correction tương ứng) để xác minh đường dẫn cài đặt registry đã xuất bản trong một prefix tạm mới
- Sau khi xuất bản beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding gói đã cài đặt, thiết lập Telegram và Telegram E2E thật đối với gói npm đã xuất bản bằng nhóm thông tin xác thực Telegram dùng chung có lease. Các lần chạy một lần cục bộ của maintainer có thể bỏ qua các biến Convex và truyền trực tiếp ba thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Maintainer có thể chạy cùng kiểm tra sau xuất bản từ GitHub Actions qua workflow thủ công `NPM Telegram Beta E2E`. Workflow này cố ý chỉ chạy thủ công và không chạy trên mọi lần merge.
- Tự động hóa phát hành của maintainer hiện dùng kiểm tra trước rồi thăng cấp:
  - xuất bản npm thật phải vượt qua `preflight_run_id` npm thành công
  - xuất bản npm thật phải được dispatch từ cùng nhánh `main` hoặc `release/YYYY.M.D` như lần chạy kiểm tra trước thành công
  - bản phát hành npm ổn định mặc định là `beta`
  - xuất bản npm ổn định có thể nhắm rõ tới `latest` qua đầu vào workflow
  - việc thay đổi dist-tag npm dựa trên token hiện nằm trong `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` vì lý do bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo công khai giữ xuất bản chỉ dùng OIDC
  - `macOS Release` công khai chỉ dành cho xác thực; khi một thẻ chỉ tồn tại trên nhánh phát hành nhưng workflow được dispatch từ `main`, đặt `public_release_branch=release/YYYY.M.D`
  - xuất bản mac riêng tư thật phải vượt qua `preflight_run_id` và `validate_run_id` mac riêng tư thành công
  - các đường dẫn xuất bản thật thăng cấp artifact đã chuẩn bị thay vì xây dựng lại chúng
- Với các bản phát hành sửa lỗi ổn định như `YYYY.M.D-N`, bộ xác minh sau xuất bản cũng kiểm tra cùng đường dẫn nâng cấp temp-prefix từ `YYYY.M.D` lên `YYYY.M.D-N` để các bản sửa phát hành không thể âm thầm để lại các cài đặt global cũ trên payload ổn định gốc
- Bước kiểm tra trước phát hành npm thất bại đóng trừ khi tarball bao gồm cả `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng để chúng ta không phát hành lại bảng điều khiển trình duyệt rỗng
- Xác minh sau xuất bản cũng kiểm tra rằng entrypoint plugin đã xuất bản và metadata gói có mặt trong bố cục registry đã cài đặt. Một bản phát hành thiếu payload runtime plugin sẽ thất bại trong bộ xác minh sau xuất bản và không thể được thăng cấp lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của npm pack trên tarball cập nhật ứng viên, để installer e2e phát hiện việc phình to gói ngoài ý muốn trước đường dẫn xuất bản phát hành
- Nếu công việc phát hành chạm tới lập kế hoạch CI, manifest thời gian plugin hoặc ma trận kiểm thử plugin, hãy tạo lại và rà soát các đầu ra ma trận `plugin-prerelease-extension-shard` do planner sở hữu từ `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành không mô tả bố cục CI đã cũ
- Mức sẵn sàng phát hành macOS ổn định cũng bao gồm các bề mặt trình cập nhật:
  - bản phát hành GitHub cuối cùng phải có `.zip`, `.dmg` và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ tới zip ổn định mới sau khi xuất bản
  - ứng dụng đã đóng gói phải giữ bundle id không phải debug, URL feed Sparkle không rỗng và `CFBundleVersion` bằng hoặc cao hơn ngưỡng bản dựng Sparkle chuẩn cho phiên bản phát hành đó

## Hộp kiểm thử phát hành

`Full Release Validation` là cách người vận hành khởi chạy tất cả kiểm thử tiền phát hành từ một điểm vào. Để có bằng chứng commit được ghim trên một nhánh thay đổi nhanh, hãy dùng helper để mọi workflow con chạy từ một nhánh tạm cố định tại SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper đẩy `release-ci/<sha>-...`, dispatch `Full Release Validation` từ nhánh đó với `ref=<sha>`, xác minh mọi `headSha` của workflow con khớp với mục tiêu, rồi xóa nhánh tạm. Điều này tránh vô tình chứng minh một lần chạy con `main` mới hơn.

Để xác thực nhánh phát hành hoặc thẻ, chạy từ workflow ref `main` đáng tin cậy và truyền nhánh phát hành hoặc thẻ làm `ref`:

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
`target_ref=<release-ref>`, kích hoạt `OpenClaw Release Checks`, và kích hoạt
Telegram E2E gói độc lập khi `release_profile=full` với
`rerun_group=all` hoặc khi `npm_telegram_package_spec` được đặt. Sau đó
`OpenClaw Release Checks` phân tán sang kiểm thử cài đặt nhanh, kiểm tra phát hành
đa hệ điều hành, phạm vi đường dẫn phát hành live/E2E Docker, Package Acceptance
với QA gói Telegram, QA Lab parity, Matrix live, và Telegram live. Một lần chạy đầy đủ chỉ được chấp nhận khi
tóm tắt `Full Release Validation`
hiển thị `normal_ci` và `release_checks` là thành công. Ở chế độ full/all,
child `npm_telegram` cũng phải thành công; bên ngoài full/all, nó bị bỏ qua
trừ khi đã cung cấp một `npm_telegram_package_spec` đã phát hành. Tóm tắt
verifier cuối cùng bao gồm các bảng job chậm nhất cho từng child run, để release
manager có thể thấy critical path hiện tại mà không cần tải nhật ký.
Xem [xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn hoàn chỉnh, tên job workflow chính xác, khác biệt giữa profile stable và full,
artifact, và các handle rerun tập trung.
Các child workflow được kích hoạt từ ref đáng tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` mục tiêu trỏ đến một
nhánh phát hành hoặc tag cũ hơn. Không có input workflow-ref Full Release Validation
riêng; chọn harness đáng tin cậy bằng cách chọn ref chạy workflow.
Không dùng `--ref main -f ref=<sha>` để có bằng chứng commit chính xác trên `main` đang di chuyển;
raw commit SHA không thể là workflow dispatch ref, nên hãy dùng
`pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn phạm vi live/provider:

- `minimum`: đường dẫn Docker và live OpenAI/core quan trọng cho phát hành, nhanh nhất
- `stable`: minimum cộng với phạm vi provider/backend stable để phê duyệt phát hành
- `full`: stable cộng với phạm vi provider/media tư vấn rộng

`OpenClaw Release Checks` dùng workflow ref đáng tin cậy để phân giải ref mục tiêu
một lần thành `release-package-under-test` và tái sử dụng artifact đó trong cả
kiểm tra Docker đường dẫn phát hành và Package Acceptance. Điều này giữ tất cả
box hướng đến package trên cùng một byte và tránh build package lặp lại.
Kiểm thử nhanh cài đặt OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.5`, vì lane này đang
chứng minh cài đặt package, onboarding, khởi động Gateway, và một lượt agent live
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

Đừng dùng umbrella đầy đủ làm lần rerun đầu tiên sau một bản sửa tập trung. Nếu một box
thất bại, hãy dùng child workflow, job, Docker lane, package profile, model
provider, hoặc QA lane đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi
bản sửa thay đổi điều phối phát hành dùng chung hoặc làm bằng chứng all-box trước đó
không còn mới. Verifier cuối cùng của umbrella kiểm tra lại các child workflow run
id đã ghi, nên sau khi một child workflow được rerun thành công, chỉ rerun job parent
`Verify full validation` đã thất bại.

Để khôi phục có giới hạn, truyền `rerun_group` cho umbrella. `all` là lần chạy
release-candidate thực sự, `ci` chỉ chạy child CI bình thường, `plugin-prerelease`
chỉ chạy child plugin chỉ dành cho phát hành, `release-checks` chạy mọi release
box, và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram`.
Các rerun `npm-telegram` tập trung yêu cầu `npm_telegram_package_spec`; các lần chạy full/all
với `release_profile=full` dùng artifact package của release-checks.

### Vitest

Box Vitest là child workflow `CI` thủ công. CI thủ công cố ý
bỏ qua scoping theo thay đổi và ép chạy đồ thị kiểm thử bình thường cho release
candidate: các shard Linux Node, shard bundled-plugin, hợp đồng channel, khả năng tương thích Node 22,
`check`, `check-additional`, build smoke, kiểm tra tài liệu, Python
skills, Windows, macOS, Android, và Control UI i18n.

Dùng box này để trả lời "cây nguồn có vượt qua toàn bộ bộ kiểm thử bình thường không?"
Nó không giống với xác thực sản phẩm đường dẫn phát hành. Bằng chứng cần giữ:

- tóm tắt `Full Release Validation` hiển thị URL run `CI` đã kích hoạt
- run `CI` xanh trên SHA mục tiêu chính xác
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một run cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI bình thường có tính xác định nhưng
không cần các box Docker, QA Lab, live, cross-OS, hoặc package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow
`install-smoke` ở chế độ phát hành. Nó xác thực release candidate thông qua
môi trường Docker đã đóng gói thay vì chỉ kiểm thử ở cấp nguồn.

Phạm vi Docker phát hành bao gồm:

- kiểm thử nhanh cài đặt đầy đủ với kiểm thử nhanh cài đặt global Bun chậm được bật
- chuẩn bị/tái sử dụng image smoke root Dockerfile theo SHA mục tiêu, với các job QR,
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
- các lane cài đặt/gỡ cài đặt bundled plugin được tách
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các bộ provider live/E2E và phạm vi model live Docker khi release checks
  bao gồm các bộ live

Dùng artifact Docker trước khi rerun. Scheduler đường dẫn phát hành tải lên
`.artifacts/docker-tests/` với nhật ký lane, `summary.json`, `failures.json`,
thời gian pha, JSON kế hoạch scheduler, và các lệnh rerun. Để khôi phục tập trung,
dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E reusable thay vì
rerun tất cả chunk phát hành. Các lệnh rerun được tạo bao gồm
`package_artifact_run_id` trước đó và input image Docker đã chuẩn bị khi có sẵn, để một
lane thất bại có thể tái sử dụng cùng tarball và GHCR image.

### QA Lab

Box QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành
hành vi agentic và cấp channel, tách biệt với Vitest và cơ chế package Docker.

Phạm vi QA Lab phát hành bao gồm:

- cổng mock parity so sánh lane candidate OpenAI với baseline Opus 4.6
  bằng agentic parity pack
- profile QA Matrix live nhanh dùng môi trường `qa-live-shared`
- lane QA Telegram live dùng lease thông tin xác thực Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng box này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA và
luồng channel live không?" Giữ URL artifact cho các lane parity, Matrix, và Telegram
khi phê duyệt bản phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn như một lần chạy QA-Lab
sharded thủ công thay vì lane quan trọng cho phát hành mặc định.

### Package

Box Package là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver chuẩn hóa một
candidate thành tarball `package-under-test` được Docker E2E sử dụng, xác thực
inventory package, ghi lại phiên bản package và SHA-256, và giữ ref harness
workflow tách biệt với ref nguồn package.

Các nguồn candidate được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw
  chính xác
- `source=ref`: đóng gói một nhánh, tag, hoặc full commit SHA `package_ref` đáng tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` đã được tải lên bởi một GitHub Actions run khác

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, artifact
package phát hành đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=release-history`,
`published_upgrade_survivor_scenarios=reported-issues`, và
`telegram_mode=mock-openai`. Package Acceptance giữ migration, update, dọn dẹp
dependency plugin cũ, fixture plugin offline, cập nhật plugin, và QA package Telegram
trên cùng một tarball đã phân giải. Đây là lựa chọn thay thế GitHub-native
cho phần lớn phạm vi package/update trước đây cần Parallels. Cross-OS release checks
vẫn quan trọng đối với onboarding, installer, và hành vi nền tảng theo hệ điều hành,
nhưng xác thực sản phẩm package/update nên ưu tiên Package Acceptance.

Checklist chuẩn cho xác thực update và plugin là
[kiểm thử update và plugin](/vi/help/testing-updates-plugins). Dùng nó khi
quyết định lane local, Docker, Package Acceptance, hoặc release-check nào chứng minh
thay đổi cài đặt/cập nhật plugin, dọn dẹp doctor, hoặc migration package đã phát hành.
Migration update đã phát hành toàn diện từ mọi package stable `2026.4.23+` là
workflow thủ công `Update Migration` riêng, không thuộc Full Release CI.

Sự nới lỏng package-acceptance kế thừa được giới hạn thời gian có chủ ý. Các package đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống metadata đã được phát hành
lên npm: các mục inventory QA riêng tư thiếu trong tarball, thiếu
`gateway install --wrapper`, thiếu file patch trong git fixture suy ra từ tarball,
thiếu `update.channel` được lưu bền, vị trí install-record plugin kế thừa,
thiếu lưu bền install-record marketplace, và migration metadata config trong
`plugins update`. Package `2026.4.26` đã phát hành có thể cảnh báo
với các file stamp metadata build cục bộ đã được phát hành. Các package sau đó
phải thỏa mãn hợp đồng package hiện đại; các khoảng trống tương tự sẽ làm
xác thực phát hành thất bại.

Dùng các profile Package Acceptance rộng hơn khi câu hỏi phát hành là về một
package có thể cài đặt thực tế:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Các profile package phổ biến:

- `smoke`: các lane cài đặt package/channel/agent nhanh, mạng gateway, và reload
  config
- `package`: hợp đồng package cài đặt/update/plugin không có ClawHub live; đây là mặc định
  release-check
- `product`: `package` cộng với MCP channels, dọn dẹp cron/subagent, web
  search OpenAI, và OpenWebUI
- `full`: các chunk đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các rerun tập trung

Để kiểm chứng Telegram cho gói ứng viên, hãy bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball
`package-under-test` đã phân giải vào lane Telegram; workflow Telegram độc lập
vẫn chấp nhận một đặc tả npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành bản phát hành

`OpenClaw Release Publish` là điểm vào phát hành có thay đổi trạng thái thông thường. Nó
điều phối các workflow nhà phát hành tin cậy theo thứ tự mà bản phát hành cần:

1. Check out tag phát hành và phân giải SHA commit của nó.
2. Xác minh tag có thể truy cập từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Dispatch `OpenClaw NPM Release` với tag phát hành, npm dist-tag, và
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

Việc promote bản ổn định trực tiếp lên `latest` là tường minh:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa có trọng tâm hoặc phát hành lại. Để sửa chữa một Plugin được chọn, truyền
`plugin_publish_scope=selected` và `plugins=@openclaw/name` cho
`OpenClaw Release Publish`, hoặc dispatch trực tiếp workflow con khi không được
phát hành gói OpenClaw.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do operator kiểm soát sau:

- `tag`: tag phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit
  đầy đủ 40 ký tự hiện tại của nhánh workflow cho preflight chỉ xác thực
- `preflight_only`: `true` để chỉ xác thực/build/đóng gói, `false` cho đường dẫn
  phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để workflow tái sử dụng
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: tag đích npm cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do operator kiểm soát sau:

- `tag`: tag phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `npm_dist_tag`: tag đích npm cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa có trọng tâm
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng
  workflow làm bộ điều phối sửa chữa chỉ dành cho Plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do operator kiểm soát sau:

- `ref`: nhánh, tag, hoặc SHA commit đầy đủ cần xác thực. Các kiểm tra mang secret
  yêu cầu commit đã phân giải có thể truy cập từ một nhánh OpenClaw hoặc
  tag phát hành.

Quy tắc:

- Tag ổn định và tag sửa lỗi có thể phát hành lên `beta` hoặc `latest`
- Tag phát hành trước beta chỉ có thể phát hành lên `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn
  chỉ xác thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh metadata đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi cắt một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi tag tồn tại, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh workflow
     cho một lần chạy thử chỉ xác thực của workflow preflight
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc `latest` chỉ
   khi bạn cố ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, tag phát hành, hoặc SHA
   commit đầy đủ khi bạn muốn CI thông thường cùng với phạm vi bao phủ live prompt cache,
   Docker, QA Lab, Matrix, và Telegram từ một workflow thủ công duy nhất
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`,
   và `preflight_run_id` đã lưu; nó phát hành các Plugin đã externalize lên npm
   và ClawHub trước khi promote gói npm OpenClaw
7. Nếu bản phát hành đã hạ cánh trên `beta`, hãy dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để promote phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý phát hành trực tiếp lên `latest` và `beta`
   nên theo cùng bản build ổn định ngay lập tức, hãy dùng cùng workflow riêng tư đó
   để trỏ cả hai dist-tag vào phiên bản ổn định, hoặc để quá trình đồng bộ tự chữa lành
   theo lịch của nó chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật, vì nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ phát hành chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn phát hành trực tiếp và đường dẫn promote beta-trước
đều được ghi tài liệu và hiển thị với operator.

Nếu maintainer phải quay về xác thực npm cục bộ, chỉ chạy mọi lệnh CLI 1Password
(`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell agent chính; giữ nó bên trong tmux giúp các prompt,
cảnh báo, và xử lý OTP có thể quan sát được, đồng thời ngăn cảnh báo host lặp lại.

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
