---
read_when:
    - Đang tìm các định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc kiểm thử chấp nhận gói
    - Tìm thông tin về cách đặt tên phiên bản và nhịp phát hành
summary: Các làn phát hành, danh sách kiểm tra cho người vận hành, các hộp kiểm định, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-01T10:52:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfe579099a9580e2d0400cd0b24f26d3fa3ee917899423604ebc13aa2519b4ee
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba làn phát hành công khai:

- stable: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ tiền phát hành được phát hành lên npm `beta`
- dev: đầu nhánh luôn thay đổi của `main`

## Cách đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản tiền phát hành beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành ổn định npm hiện tại đã được thăng hạng
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Theo mặc định, các bản phát hành ổn định và phát hành sửa lỗi ổn định được phát hành lên npm `beta`; người vận hành phát hành có thể nhắm rõ ràng tới `latest`, hoặc thăng hạng một bản dựng beta đã được thẩm định sau đó
- Mỗi bản phát hành OpenClaw ổn định đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/gói trước, còn
  việc dựng/ký/công chứng ứng dụng mac được dành cho bản ổn định trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Stable chỉ theo sau sau khi bản beta mới nhất được xác thực
- Maintainer thường cắt bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc phát hành và cần sửa lỗi, maintainer cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho maintainer

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag và chi tiết rollback khẩn cấp được giữ trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI hiện tại của `main` đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thực bằng
   `/changelog`, giữ các mục hướng tới người dùng, commit, đẩy, rồi rebase/pull
   thêm một lần nữa trước khi tạo nhánh.
3. Xem xét các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do vì sao nó được
   cố ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự kiến, rồi chạy preflight
   xác định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, và `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA nhánh phát hành đủ 40 ký tự được phép dùng cho preflight chỉ để xác thực.
   Lưu `preflight_run_id` thành công.
7. Khởi chạy tất cả kiểm thử trước phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, làn, job workflow,
   hồ sơ gói, nhà cung cấp hoặc danh sách cho phép mô hình nhỏ nhất đã thất bại để
   chứng minh bản sửa. Chỉ chạy lại toàn bộ umbrella khi bề mặt thay đổi khiến
   bằng chứng trước đó không còn phù hợp.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, phát hành với dist-tag npm `beta`, rồi chạy
   kiểm nhận gói sau phát hành với gói `openclaw@YYYY.M.D-beta.N`
   hoặc `openclaw@beta` đã phát hành. Nếu một bản beta đã được đẩy hoặc phát hành cần sửa,
   cắt bản `-beta.N` tiếp theo; không xóa hoặc viết lại bản beta cũ.
10. Với stable, chỉ tiếp tục sau khi bản beta đã được thẩm định hoặc ứng viên phát hành có
    bằng chứng xác thực bắt buộc. Việc phát hành npm stable tái sử dụng artifact
    preflight thành công thông qua `preflight_run_id`; trạng thái sẵn sàng phát hành macOS stable
    cũng yêu cầu `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói và
    `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy trình xác minh sau phát hành npm, E2E Telegram
    published-npm độc lập tùy chọn khi bạn cần bằng chứng kênh sau phát hành,
    thăng hạng dist-tag khi cần, ghi chú phát hành/tiền phát hành GitHub từ
    phần `CHANGELOG.md` khớp đầy đủ, và các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước kiểm tra tiền phát hành để TypeScript của kiểm thử vẫn được
  bao phủ ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước kiểm tra tiền phát hành để các kiểm tra chu trình import
  rộng hơn và ranh giới kiến trúc đều xanh ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành
  `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực đóng gói
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi động tất cả test box tiền phát hành từ một điểm vào. Workflow này nhận một nhánh,
  thẻ, hoặc SHA commit đầy đủ, dispatch `CI` thủ công, và dispatch
  `OpenClaw Release Checks` cho install smoke, package acceptance, các bộ kiểm thử đường dẫn
  phát hành Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix, và các lane Telegram.
  Chỉ cung cấp `npm_telegram_package_spec` sau khi một package đã được
  phát hành và E2E Telegram hậu phát hành cũng cần chạy. Cung cấp
  `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng
  xác thực khớp với package npm đã phát hành mà không bắt buộc Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng kênh phụ
  cho ứng viên package trong khi công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref`
  để đóng gói một nhánh/thẻ/SHA `package_ref` tin cậy bằng harness
  `workflow_ref` hiện tại; `source=url` cho tarball HTTPS với SHA-256 bắt buộc;
  hoặc `source=artifact` cho tarball được tải lên bởi một lần chạy GitHub
  Actions khác. Workflow phân giải ứng viên thành
  `package-under-test`, tái sử dụng bộ lập lịch phát hành Docker E2E với tarball đó,
  và có thể chạy QA Telegram với cùng tarball bằng
  `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các lane Docker
  được chọn bao gồm `published-upgrade-survivor`, artifact package là ứng viên và
  `published_upgrade_survivor_baseline` chọn baseline đã phát hành.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Các hồ sơ phổ biến:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway, và tải lại cấu hình
  - `package`: các lane package/cập nhật/plugin gốc theo artifact không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ package cộng thêm các kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần độ bao phủ CI bình thường đầy đủ
  cho ứng viên phát hành. Các dispatch CI thủ công bỏ qua phân phạm vi theo thay đổi
  và ép các shard Linux Node, shard plugin đóng gói, hợp đồng kênh,
  khả năng tương thích Node 22, `check`, `check-additional`, build smoke,
  kiểm tra tài liệu, Skills Python, Windows, macOS, Android, và các lane i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này thực thi
  QA-lab qua một bộ nhận OTLP/HTTP cục bộ và xác minh tên span trace đã xuất,
  thuộc tính có giới hạn, và việc biên tập nội dung/định danh mà không
  cần Opik, Langfuse, hoặc collector bên ngoài khác.
- Chạy `pnpm release:check` trước mỗi bản phát hành được gắn thẻ
- Các kiểm tra phát hành hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy cổng parity giả lập QA Lab cộng với hồ sơ
  Matrix live nhanh và lane QA Telegram trước khi phê duyệt phát hành. Các lane live
  dùng môi trường `qa-live-shared`; Telegram cũng dùng các lease thông tin xác thực
  Convex CI. Chạy workflow thủ công `QA-Lab - All Lanes` với
  `matrix_profile=all` và `matrix_shards=true` khi bạn muốn toàn bộ kiểm kê
  truyền tải Matrix, media, và E2EE chạy song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của
  `OpenClaw Release Checks` công khai và `Full Release Validation`, gọi trực tiếp
  workflow tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ ý: giữ đường dẫn phát hành npm thật ngắn,
  xác định được, và tập trung vào artifact, trong khi các kiểm tra live chậm hơn
  nằm trong lane riêng để chúng không làm đình trệ hoặc chặn publish
- Các kiểm tra phát hành mang secret nên được dispatch qua `Full Release
Validation` hoặc từ workflow ref `main`/release để logic workflow và
  secret luôn được kiểm soát
- `OpenClaw Release Checks` nhận một nhánh, thẻ, hoặc SHA commit đầy đủ miễn là
  commit đã phân giải có thể truy cập từ một nhánh OpenClaw hoặc thẻ phát hành
- Kiểm tra tiền phát hành chỉ xác thực của `OpenClaw NPM Release` cũng nhận SHA commit
  đầy đủ 40 ký tự của nhánh workflow hiện tại mà không yêu cầu thẻ đã được đẩy
- Đường dẫn SHA đó chỉ dành cho xác thực và không thể được nâng cấp thành publish thật
- Ở chế độ SHA, workflow tổng hợp `v<package.json version>` chỉ cho
  kiểm tra metadata package; publish thật vẫn cần một thẻ phát hành thật
- Cả hai workflow giữ đường dẫn publish và promotion thật trên runner do GitHub lưu trữ,
  trong khi đường dẫn xác thực không gây thay đổi có thể dùng các runner
  Blacksmith Linux lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Kiểm tra tiền phát hành npm không còn chờ lane kiểm tra phát hành riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc thẻ beta/correction tương ứng) trước khi phê duyệt
- Sau khi publish npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/correction tương ứng) để xác minh đường dẫn cài đặt registry
  đã phát hành trong một tiền tố tạm mới
- Sau một lần publish beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding package đã cài đặt, thiết lập Telegram, và E2E Telegram thật
  với package npm đã phát hành bằng pool thông tin xác thực Telegram thuê chung.
  Các lần chạy riêng lẻ cục bộ của maintainer có thể bỏ các biến Convex và truyền trực tiếp
  ba thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Maintainer có thể chạy cùng kiểm tra hậu phát hành từ GitHub Actions qua
  workflow thủ công `NPM Telegram Beta E2E`. Workflow này cố ý chỉ thủ công và
  không chạy trên mọi lần merge.
- Tự động hóa phát hành của maintainer hiện dùng tiền kiểm tra rồi mới promotion:
  - publish npm thật phải vượt qua một `preflight_run_id` npm thành công
  - publish npm thật phải được dispatch từ cùng nhánh `main` hoặc
    `release/YYYY.M.D` với lần chạy tiền kiểm tra thành công
  - các bản phát hành npm ổn định mặc định dùng `beta`
  - publish npm ổn định có thể nhắm rõ tới `latest` qua input workflow
  - mutation npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    vì bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi
    repo công khai giữ publish chỉ dùng OIDC
  - `macOS Release` công khai chỉ xác thực; khi một thẻ chỉ nằm trên
    nhánh phát hành nhưng workflow được dispatch từ `main`, đặt
    `public_release_branch=release/YYYY.M.D`
  - publish mac riêng tư thật phải vượt qua `preflight_run_id` và `validate_run_id`
    mac riêng tư thành công
  - các đường dẫn publish thật promotion các artifact đã chuẩn bị thay vì build lại
    chúng lần nữa
- Với các bản phát hành sửa lỗi ổn định như `YYYY.M.D-N`, bộ xác minh hậu phát hành
  cũng kiểm tra cùng đường dẫn nâng cấp tiền tố tạm từ `YYYY.M.D` lên `YYYY.M.D-N`
  để các bản sửa phát hành không thể âm thầm để các cài đặt global cũ hơn ở lại
  payload ổn định gốc
- Kiểm tra tiền phát hành npm fail đóng trừ khi tarball bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không phát hành lại dashboard trình duyệt rỗng
- Xác minh hậu phát hành cũng kiểm tra rằng bản cài đặt registry đã phát hành
  chứa các runtime dependency plugin đóng gói không rỗng dưới layout `dist/*`
  gốc. Một bản phát hành thiếu hoặc có payload dependency plugin đóng gói rỗng
  sẽ làm bộ xác minh hậu phát hành thất bại và không thể được promotion
  lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của npm pack trên
  tarball cập nhật ứng viên, để e2e trình cài đặt bắt được tình trạng phình to pack
  ngoài ý muốn trước đường dẫn publish phát hành
- Nếu công việc phát hành chạm tới lập kế hoạch CI, manifest thời gian extension, hoặc
  ma trận kiểm thử extension, hãy tạo lại và rà soát các đầu ra ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành
  không mô tả layout CI đã cũ
- Mức sẵn sàng phát hành macOS ổn định cũng bao gồm các bề mặt updater:
  - bản phát hành GitHub phải kết thúc với `.zip`, `.dmg`, và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ tới zip ổn định mới sau khi publish
  - app đã đóng gói phải giữ bundle id không debug, URL feed Sparkle không rỗng,
    và `CFBundleVersion` bằng hoặc cao hơn mức sàn build Sparkle chuẩn
    cho phiên bản phát hành đó

## Test box phát hành

`Full Release Validation` là cách operator khởi động tất cả kiểm thử tiền phát hành từ
một điểm vào. Chạy từ workflow ref `main` tin cậy và truyền nhánh phát hành,
thẻ, hoặc SHA commit đầy đủ làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow phân giải ref mục tiêu, dispatch `CI` thủ công với
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, và
tùy chọn dispatch E2E Telegram hậu phát hành độc lập khi
`npm_telegram_package_spec` được đặt. Sau đó `OpenClaw Release Checks` phân nhánh
install smoke, kiểm tra phát hành đa hệ điều hành, độ bao phủ đường dẫn phát hành Docker
live/E2E, Package Acceptance với QA package Telegram, QA Lab parity, Matrix live, và
Telegram live. Một lần chạy đầy đủ chỉ được chấp nhận khi phần tóm tắt `Full Release Validation`
hiển thị `normal_ci` và `release_checks` thành công, và mọi child
`npm_telegram` tùy chọn đều thành công hoặc được cố ý bỏ qua. Tóm tắt bộ xác minh cuối cùng
bao gồm bảng job chậm nhất cho từng lần chạy con, để release manager có thể thấy
đường dẫn tới hạn hiện tại mà không cần tải log xuống.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận stage đầy đủ, tên job workflow chính xác, khác biệt giữa hồ sơ ổn định và đầy đủ,
artifact, và các handle chạy lại tập trung.
Các workflow con được dispatch từ ref tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` mục tiêu trỏ tới
một nhánh phát hành hoặc thẻ cũ hơn. Không có input workflow-ref riêng cho Full Release Validation;
chọn harness tin cậy bằng cách chọn ref chạy workflow.

Dùng `release_profile` để chọn phạm vi live/provider:

- `minimum`: đường dẫn live OpenAI/core và Docker nhanh nhất nhưng vẫn thiết yếu cho phát hành
- `stable`: minimum cộng thêm độ bao phủ provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng thêm độ bao phủ provider/media tư vấn rộng hơn

`OpenClaw Release Checks` sử dụng workflow ref đáng tin cậy để phân giải ref mục tiêu một lần dưới dạng `release-package-under-test` và tái sử dụng artifact đó trong cả các kiểm tra Docker theo đường dẫn phát hành lẫn Package Acceptance. Điều này giữ tất cả các box hướng tới gói trên cùng một byte và tránh xây dựng gói lặp lại. Smoke cài đặt OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4-mini`, vì lane này đang chứng minh cài đặt gói, onboarding, khởi động gateway và một lượt agent live thay vì benchmark mô hình mặc định chậm nhất. Ma trận nhà cung cấp live rộng hơn vẫn là nơi dành cho coverage riêng theo mô hình.

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
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Không dùng umbrella đầy đủ làm lần chạy lại đầu tiên sau một bản sửa tập trung. Nếu một box thất bại, hãy dùng workflow con, job, Docker lane, hồ sơ gói, nhà cung cấp mô hình hoặc QA lane đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi bản sửa đã thay đổi điều phối phát hành dùng chung hoặc làm bằng chứng tất cả box trước đó trở nên lỗi thời. Trình xác minh cuối cùng của umbrella kiểm tra lại các id lần chạy workflow con đã ghi nhận, vì vậy sau khi một workflow con được chạy lại thành công, chỉ chạy lại job cha `Verify full validation` đã thất bại.

Để khôi phục có giới hạn, truyền `rerun_group` cho umbrella. `all` là lần chạy release-candidate thật, `ci` chỉ chạy CI con thông thường, `plugin-prerelease` chỉ chạy con plugin chỉ dành cho phát hành, `release-checks` chạy mọi box phát hành, và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram` khi lane Telegram gói độc lập được cung cấp.

### Vitest

Box Vitest là workflow con `CI` thủ công. CI thủ công cố ý bỏ qua phạm vi thay đổi và buộc đồ thị kiểm thử thông thường cho release candidate: các shard Linux Node, shard bundled-plugin, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Python skills, Windows, macOS, Android và i18n Control UI.

Dùng box này để trả lời "cây nguồn có vượt qua toàn bộ bộ kiểm thử thông thường không?" Nó không giống xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần giữ:

- Tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã dispatch
- Lần chạy `CI` xanh trên đúng SHA mục tiêu
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi một lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI thông thường xác định nhưng không cần Docker, QA Lab, live, đa hệ điều hành hoặc các box gói:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker nằm trong `OpenClaw Release Checks` thông qua `openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow `install-smoke` ở chế độ phát hành. Nó xác thực release candidate thông qua các môi trường Docker đã đóng gói thay vì chỉ các kiểm thử ở mức nguồn.

Coverage Docker phát hành bao gồm:

- smoke cài đặt đầy đủ với smoke cài đặt Bun global chậm được bật
- chuẩn bị/tái sử dụng image smoke Dockerfile gốc theo SHA mục tiêu, với các job smoke QR, root/gateway và installer/Bun chạy như các shard install-smoke riêng biệt
- các lane E2E của kho mã
- các chunk Docker theo đường dẫn phát hành: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b`, và `bundled-channels-contracts`
- coverage OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane phụ thuộc bundled-channel được tách trên các chunk channel-smoke, update-target và hợp đồng setup/runtime thay vì một job bundled-channel lớn
- các lane cài đặt/gỡ cài đặt bundled plugin được tách từ `bundled-plugin-install-uninstall-0` đến `bundled-plugin-install-uninstall-23`
- các bộ live/E2E của nhà cung cấp và coverage mô hình live Docker khi kiểm tra phát hành bao gồm các bộ live

Dùng artifact Docker trước khi chạy lại. Bộ lập lịch theo đường dẫn phát hành tải lên `.artifacts/docker-tests/` với log lane, `summary.json`, `failures.json`, thời gian pha, JSON kế hoạch bộ lập lịch và lệnh chạy lại. Để khôi phục tập trung, dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì chạy lại tất cả các chunk phát hành. Các lệnh chạy lại được tạo bao gồm `package_artifact_run_id` trước đó và đầu vào image Docker đã chuẩn bị khi có, để một lane thất bại có thể tái sử dụng cùng tarball và image GHCR.

### QA Lab

Box QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành hành vi agentic và cấp kênh, tách biệt với Vitest và cơ chế gói Docker.

Coverage QA Lab phát hành bao gồm:

- cổng parity mock so sánh lane ứng viên OpenAI với baseline Opus 4.6 bằng gói parity agentic
- hồ sơ Matrix QA live nhanh bằng môi trường `qa-live-shared`
- lane QA Telegram live bằng lease thông tin xác thực Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng box này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA và luồng kênh live không?" Giữ các URL artifact cho các lane parity, Matrix và Telegram khi phê duyệt bản phát hành. Coverage Matrix đầy đủ vẫn có sẵn dưới dạng một lần chạy QA-Lab thủ công được shard thay vì lane mặc định quan trọng cho phát hành.

### Gói

Box Gói là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi `Package Acceptance` và bộ phân giải `scripts/resolve-openclaw-package-candidate.mjs`. Bộ phân giải chuẩn hóa một ứng viên thành tarball `package-under-test` được Docker E2E tiêu thụ, xác thực inventory gói, ghi lại phiên bản gói và SHA-256, đồng thời giữ workflow harness ref tách biệt với package source ref.

Các nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác
- `source=ref`: đóng gói một nhánh, tag hoặc SHA commit đầy đủ `package_ref` đáng tin cậy với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` do một lần chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Package Acceptance với `source=ref`, `package_ref=<release-ref>`, `suite_profile=custom`, `docker_lanes=bundled-channel-deps-compat plugins-offline`, và `telegram_mode=mock-openai`. Các chunk Docker theo đường dẫn phát hành bao phủ các lane cài đặt, cập nhật và cập nhật plugin chồng lấn; Package Acceptance giữ compat bundled-channel gốc artifact, fixture plugin offline và QA gói Telegram trên cùng tarball đã phân giải. Đây là phương án thay thế gốc GitHub cho phần lớn coverage gói/cập nhật trước đây cần Parallels. Kiểm tra phát hành đa hệ điều hành vẫn quan trọng đối với onboarding, trình cài đặt và hành vi nền tảng riêng theo OS, nhưng xác thực sản phẩm gói/cập nhật nên ưu tiên Package Acceptance.

Sự khoan nhượng package-acceptance kế thừa được giới hạn thời gian có chủ ý. Các gói đến `2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống metadata đã phát hành lên npm: mục inventory QA riêng tư bị thiếu khỏi tarball, thiếu `gateway install --wrapper`, thiếu patch file trong git fixture dẫn xuất từ tarball, thiếu `update.channel` được lưu giữ, vị trí install-record plugin kế thừa, thiếu lưu giữ marketplace install-record và di chuyển metadata config trong `plugins update`. Gói `2026.4.26` đã phát hành có thể cảnh báo về các file stamp metadata build cục bộ đã được phát hành. Các gói sau đó phải thỏa mãn các hợp đồng gói hiện đại; chính các khoảng trống đó sẽ làm xác thực phát hành thất bại.

Dùng các hồ sơ Package Acceptance rộng hơn khi câu hỏi phát hành liên quan đến một gói thật sự có thể cài đặt:

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

- `smoke`: các lane cài đặt gói/kênh/agent nhanh, mạng gateway và tải lại config
- `package`: hợp đồng gói cài đặt/cập nhật/plugin không có ClawHub live; đây là mặc định release-check
- `product`: `package` cộng với kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI và OpenWebUI
- `full`: các chunk Docker theo đường dẫn phát hành với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để chứng minh Telegram cho ứng viên gói, bật `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball `package-under-test` đã phân giải vào lane Telegram; workflow Telegram độc lập vẫn chấp nhận một spec npm đã phát hành cho các kiểm tra sau phát hành.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do operator kiểm soát sau:

- `tag`: tag phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit nhánh workflow đầy đủ 40 ký tự hiện tại cho preflight chỉ xác thực
- `preflight_only`: `true` cho chỉ xác thực/build/gói, `false` cho đường dẫn phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để workflow tái sử dụng tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: tag mục tiêu npm cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Checks` chấp nhận các đầu vào do operator kiểm soát sau:

- `ref`: nhánh, tag hoặc SHA commit đầy đủ để xác thực. Các kiểm tra mang secret yêu cầu commit đã phân giải có thể truy cập được từ một nhánh OpenClaw hoặc tag phát hành.

Quy tắc:

- Tag ổn định và tag sửa lỗi có thể phát hành lên `beta` hoặc `latest`
- Tag prerelease beta chỉ có thể phát hành lên `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ để xác thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight; workflow xác minh metadata đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi cắt một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi tag tồn tại, bạn có thể dùng SHA commit hiện tại đầy đủ của nhánh workflow
     cho một lần chạy thử chỉ để xác thực của workflow preflight
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc chỉ chọn `latest`
   khi bạn chủ ý muốn publish stable trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, tag phát hành, hoặc SHA
   commit đầy đủ khi bạn muốn CI thông thường cùng với phạm vi kiểm thử live prompt cache, Docker, QA Lab,
   Matrix và Telegram từ một workflow thủ công
4. Nếu bạn chủ ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành thay thế
5. Lưu `preflight_run_id` thành công
6. Chạy lại `OpenClaw NPM Release` với `preflight_only=false`, cùng
   `tag`, cùng `npm_dist_tag`, và `preflight_run_id` đã lưu
7. Nếu bản phát hành đã được đưa lên `beta`, hãy dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để quảng bá phiên bản stable đó từ `beta` lên `latest`
8. Nếu bản phát hành chủ ý publish trực tiếp lên `latest` và `beta`
   cần theo cùng bản build stable ngay lập tức, hãy dùng cùng workflow riêng tư đó
   để trỏ cả hai dist-tags tới phiên bản stable, hoặc để cơ chế đồng bộ tự phục hồi
   theo lịch của nó chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật, vì nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ cơ chế publish chỉ dùng OIDC.

Điều đó giúp cả đường dẫn publish trực tiếp và đường dẫn quảng bá beta-trước đều
được ghi tài liệu và hiển thị cho người vận hành.

Nếu maintainer phải quay về dùng xác thực npm cục bộ, chỉ chạy bất kỳ lệnh
CLI (`op`) nào của 1Password bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell agent chính; việc giữ nó trong tmux giúp các lời nhắc,
cảnh báo và xử lý OTP có thể quan sát được, đồng thời ngăn cảnh báo host lặp lại.

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
