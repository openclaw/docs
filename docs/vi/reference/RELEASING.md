---
read_when:
    - Đang tìm các định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc kiểm thử chấp nhận gói
    - Tìm thông tin về cách đặt tên phiên bản và nhịp phát hành
summary: Luồng phát hành, danh sách kiểm tra cho người vận hành, các hộp xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-03T21:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566088d826e1e2bac21b11443b82b62cb73ed1fd9c508c3fb865149cf8a428ba
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba kênh phát hành công khai:

- ổn định: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ tiền phát hành được phát hành lên npm `beta`
- phát triển: đầu nhánh đang thay đổi của `main`

## Đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản tiền phát hành beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm ổn định hiện được quảng bá
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành ổn định và sửa lỗi ổn định mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm đích rõ ràng đến `latest`, hoặc quảng bá một bản dựng beta đã được thẩm định sau đó
- Mỗi bản phát hành OpenClaw ổn định đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/gói trước, còn
  việc dựng/ký/công chứng ứng dụng mac được dành cho bản ổn định trừ khi được yêu cầu rõ ràng

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

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình thức công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag và chi tiết rollback khẩn cấp nằm trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thực với
   `/changelog`, giữ các mục hướng đến người dùng, commit, đẩy, rồi rebase/kéo
   thêm một lần trước khi tạo nhánh.
3. Xem lại các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do vì sao nó được
   cố ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, chạy
   `pnpm plugins:sync` để các gói Plugin có thể phát hành dùng chung phiên bản phát hành
   và siêu dữ liệu tương thích, rồi chạy preflight cục bộ có tính xác định:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, và
   `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA nhánh phát hành đầy đủ 40 ký tự được phép dùng cho preflight chỉ để xác thực.
   Lưu `preflight_run_id` thành công.
7. Khởi chạy tất cả kiểm thử tiền phát hành với `Full Release Validation` cho
   nhánh phát hành, thẻ hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, kênh, job workflow,
   hồ sơ gói, nhà cung cấp hoặc danh sách cho phép mô hình nhỏ nhất đã thất bại
   để chứng minh bản sửa. Chỉ chạy lại toàn bộ lớp bao khi bề mặt thay đổi khiến
   bằng chứng trước đó không còn mới.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` tương ứng. Nó xác minh `pnpm plugins:sync:check`,
   phát hành tất cả gói Plugin có thể phát hành lên npm trước, phát hành cùng
   tập hợp đó lên ClawHub sau dưới dạng tarball ClawPack npm-pack, rồi quảng bá
   hiện vật preflight npm OpenClaw đã chuẩn bị với dist-tag tương ứng. Sau khi
   phát hành, chạy chấp nhận gói hậu phát hành đối với gói
   `openclaw@YYYY.M.D-beta.N` hoặc `openclaw@beta` đã phát hành. Nếu một bản tiền phát hành
   đã được đẩy hoặc phát hành cần sửa lỗi, cắt số tiền phát hành tương ứng tiếp theo;
   không xóa hoặc viết lại bản tiền phát hành cũ.
10. Với bản ổn định, chỉ tiếp tục sau khi beta đã thẩm định hoặc ứng viên phát hành có
    bằng chứng xác thực bắt buộc. Việc phát hành npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng hiện vật preflight thành công thông qua
    `preflight_run_id`; trạng thái sẵn sàng phát hành macOS ổn định cũng yêu cầu
    các gói `.zip`, `.dmg`, `.dSYM.zip`, và `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy trình xác minh npm hậu phát hành, E2E Telegram
    npm đã phát hành độc lập tùy chọn khi bạn cần bằng chứng kênh sau phát hành,
    quảng bá dist-tag khi cần, ghi chú phát hành/tiền phát hành GitHub từ
    phần `CHANGELOG.md` tương ứng đầy đủ, và các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước bước kiểm tra sơ bộ phát hành để TypeScript của kiểm thử vẫn được
  bao phủ ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước bước kiểm tra sơ bộ phát hành để các kiểm tra rộng hơn về chu trình
  import và ranh giới kiến trúc đều xanh ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các tạo tác phát hành
  `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực đóng gói
- Chạy `pnpm plugins:sync` sau khi tăng phiên bản gốc và trước khi gắn thẻ. Lệnh này
  cập nhật phiên bản gói plugin có thể phát hành, siêu dữ liệu tương thích
  peer/API của OpenClaw, siêu dữ liệu bản dựng, và khung changelog plugin để khớp với phiên bản
  phát hành lõi. `pnpm plugins:sync:check` là chốt phát hành không thay đổi dữ liệu;
  quy trình phát hành sẽ thất bại trước mọi thay đổi registry nếu bước này bị
  quên.
- Chạy quy trình thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi động tất cả hộp kiểm thử trước phát hành từ một điểm vào. Quy trình này chấp nhận một nhánh,
  thẻ, hoặc SHA commit đầy đủ, điều phối `CI` thủ công, và điều phối
  `OpenClaw Release Checks` cho kiểm thử khói cài đặt, chấp nhận gói, các bộ kiểm thử
  đường dẫn phát hành Docker, trực tiếp/E2E, OpenWebUI, QA Lab parity, Matrix, và các
  lane Telegram. Với `release_profile=full` và `rerun_group=all`, quy trình này cũng chạy package
  Telegram E2E trên tạo tác `release-package-under-test` từ các kiểm tra phát hành.
  Cung cấp `npm_telegram_package_spec` sau khi phát hành khi cùng kiểm thử
  Telegram E2E cũng cần chứng minh gói npm đã phát hành. Cung cấp
  `package_acceptance_package_spec` sau khi phát hành khi Package Acceptance
  cần chạy ma trận gói/cập nhật của nó trên gói npm đã xuất xưởng thay vì
  tạo tác được dựng từ SHA. Cung cấp
  `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng
  quá trình xác thực khớp với một gói npm đã phát hành mà không bắt buộc Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy quy trình thủ công `Package Acceptance` khi bạn muốn có bằng chứng kênh phụ
  cho một ứng viên gói trong khi công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref`
  để đóng gói một nhánh/thẻ/SHA `package_ref` đáng tin cậy với bộ kiểm thử
  `workflow_ref` hiện tại; `source=url` cho tarball HTTPS với SHA-256 bắt buộc;
  hoặc `source=artifact` cho tarball được tải lên bởi một lượt chạy GitHub
  Actions khác. Quy trình phân giải ứng viên thành
  `package-under-test`, tái sử dụng bộ lập lịch phát hành Docker E2E trên
  tarball đó, và có thể chạy QA Telegram trên cùng tarball với
  `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các lane
  Docker đã chọn bao gồm `published-upgrade-survivor`, tạo tác gói là ứng viên và
  `published_upgrade_survivor_baseline` chọn baseline đã phát hành.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Các hồ sơ thường dùng:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway, và tải lại cấu hình
  - `package`: các lane gói/cập nhật/plugin gốc theo tạo tác, không có OpenWebUI hoặc ClawHub trực tiếp
  - `product`: hồ sơ gói cộng thêm các kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lượt chạy lại tập trung
- Chạy trực tiếp quy trình thủ công `CI` khi bạn chỉ cần độ bao phủ CI bình thường đầy đủ
  cho ứng viên phát hành. Các lượt điều phối CI thủ công bỏ qua phạm vi thay đổi
  và buộc chạy các shard Linux Node, shard plugin đi kèm, hợp đồng kênh,
  tương thích Node 22, `check`, `check-additional`, kiểm thử khói bản dựng,
  kiểm tra tài liệu, Python skills, Windows, macOS, Android, và các lane i18n
  của Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này thực thi
  QA-lab qua bộ nhận OTLP/HTTP cục bộ và xác minh tên span trace đã xuất,
  thuộc tính có giới hạn, và việc biên tập nội dung/định danh mà không cần
  Opik, Langfuse, hoặc bộ thu thập bên ngoài khác.
- Chạy `pnpm release:check` trước mọi bản phát hành đã gắn thẻ
- Chạy `OpenClaw Release Publish` cho chuỗi phát hành có thay đổi sau khi
  thẻ tồn tại. Điều phối từ `release/YYYY.M.D` (hoặc `main` khi phát hành một
  thẻ có thể truy cập từ main), truyền thẻ phát hành và `preflight_run_id` npm
  OpenClaw thành công, và giữ phạm vi phát hành plugin mặc định
  `all-publishable` trừ khi bạn chủ ý chạy một sửa chữa tập trung. Quy trình
  tuần tự hóa phát hành npm plugin, phát hành ClawHub plugin, và phát hành npm
  OpenClaw để gói lõi không được phát hành trước các plugin đã tách ngoài.
- Các kiểm tra phát hành hiện chạy trong một quy trình thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane QA Lab mock parity cộng với hồ sơ
  Matrix trực tiếp nhanh và lane QA Telegram trước khi phê duyệt phát hành. Các lane
  trực tiếp dùng môi trường `qa-live-shared`; Telegram cũng dùng các lease thông tin xác thực
  Convex CI. Chạy quy trình thủ công `QA-Lab - All Lanes` với
  `matrix_profile=all` và `matrix_shards=true` khi bạn muốn toàn bộ kiểm kê
  vận chuyển Matrix, phương tiện, và E2EE chạy song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của
  `OpenClaw Release Checks` và `Full Release Validation` công khai, gọi trực tiếp
  quy trình tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ ý: giữ đường dẫn phát hành npm thật ngắn,
  xác định, và tập trung vào tạo tác, trong khi các kiểm tra trực tiếp chậm hơn nằm trong
  lane riêng để chúng không làm đình trệ hoặc chặn phát hành
- Các kiểm tra phát hành mang bí mật nên được điều phối qua `Full Release
Validation` hoặc từ workflow ref `main`/phát hành để logic quy trình và
  bí mật vẫn được kiểm soát
- `OpenClaw Release Checks` chấp nhận một nhánh, thẻ, hoặc SHA commit đầy đủ miễn là
  commit đã phân giải có thể truy cập từ một nhánh OpenClaw hoặc thẻ phát hành
- Kiểm tra sơ bộ chỉ-xác-thực `OpenClaw NPM Release` cũng chấp nhận SHA commit
  đầy đủ 40 ký tự của nhánh quy trình hiện tại mà không cần thẻ đã được đẩy
- Đường dẫn SHA đó chỉ dành cho xác thực và không thể được nâng cấp thành phát hành thật
- Ở chế độ SHA, quy trình tổng hợp `v<package.json version>` chỉ cho kiểm tra
  siêu dữ liệu gói; phát hành thật vẫn yêu cầu một thẻ phát hành thật
- Cả hai quy trình giữ đường dẫn phát hành và quảng bá thật trên runner do GitHub lưu trữ,
  trong khi đường dẫn xác thực không thay đổi dữ liệu có thể dùng các runner Linux
  Blacksmith lớn hơn
- Quy trình đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai bí mật quy trình `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Kiểm tra sơ bộ phát hành npm không còn chờ lane kiểm tra phát hành riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc thẻ beta/sửa lỗi tương ứng) trước khi phê duyệt
- Sau khi phát hành npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/sửa lỗi tương ứng) để xác minh đường dẫn cài đặt registry
  đã phát hành trong một tiền tố tạm mới
- Sau khi phát hành beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding gói đã cài đặt, thiết lập Telegram, và Telegram E2E thật
  trên gói npm đã phát hành bằng pool thông tin xác thực Telegram thuê dùng chung.
  Các lượt chạy một lần cục bộ của maintainer có thể bỏ các biến Convex và truyền trực tiếp ba
  thông tin xác thực môi trường `OPENCLAW_QA_TELEGRAM_*`.
- Maintainer có thể chạy cùng kiểm tra sau phát hành từ GitHub Actions qua quy trình thủ công
  `NPM Telegram Beta E2E`. Quy trình này cố ý chỉ thủ công và
  không chạy trên mọi lần merge.
- Tự động hóa phát hành của maintainer hiện dùng kiểm tra sơ bộ rồi quảng bá:
  - phát hành npm thật phải vượt qua một `preflight_run_id` npm thành công
  - phát hành npm thật phải được điều phối từ cùng nhánh `main` hoặc
    `release/YYYY.M.D` với lượt chạy kiểm tra sơ bộ thành công
  - bản phát hành npm ổn định mặc định dùng `beta`
  - phát hành npm ổn định có thể nhắm tới `latest` rõ ràng qua đầu vào quy trình
  - thay đổi dist-tag npm dựa trên token hiện nằm trong
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    vì lý do bảo mật, bởi `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi
    repo công khai giữ phát hành chỉ dùng OIDC
  - `macOS Release` công khai chỉ dành cho xác thực; khi một thẻ chỉ tồn tại trên một
    nhánh phát hành nhưng quy trình được điều phối từ `main`, đặt
    `public_release_branch=release/YYYY.M.D`
  - phát hành mac riêng tư thật phải vượt qua `preflight_run_id` và
    `validate_run_id` mac riêng tư thành công
  - các đường dẫn phát hành thật quảng bá tạo tác đã chuẩn bị thay vì dựng lại
    chúng một lần nữa
- Với các bản phát hành sửa lỗi ổn định như `YYYY.M.D-N`, trình xác minh sau phát hành
  cũng kiểm tra cùng đường dẫn nâng cấp tiền tố tạm từ `YYYY.M.D` lên `YYYY.M.D-N`
  để các bản sửa lỗi phát hành không thể âm thầm để các bản cài đặt toàn cục cũ hơn ở lại
  payload ổn định gốc
- Kiểm tra sơ bộ phát hành npm thất bại đóng nếu tarball không bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không phát hành lại dashboard trình duyệt rỗng
- Xác minh sau phát hành cũng kiểm tra rằng entrypoint plugin đã phát hành và
  siêu dữ liệu gói hiện diện trong bố cục registry đã cài đặt. Một bản phát hành
  thiếu payload runtime plugin sẽ thất bại ở trình xác minh sau phát hành và
  không thể được quảng bá lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của gói npm trên
  tarball cập nhật ứng viên, để e2e trình cài đặt phát hiện phình to gói ngoài ý muốn
  trước đường dẫn phát hành
- Nếu công việc phát hành đã chạm vào lập kế hoạch CI, manifest thời gian plugin, hoặc
  ma trận kiểm thử plugin, hãy tạo lại và rà soát các đầu ra ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành
  không mô tả một bố cục CI đã cũ
- Mức sẵn sàng phát hành macOS ổn định cũng bao gồm các bề mặt trình cập nhật:
  - GitHub release cuối cùng phải có các gói `.zip`, `.dmg`, và `.dSYM.zip`
  - `appcast.xml` trên `main` phải trỏ tới zip ổn định mới sau khi phát hành
  - ứng dụng đã đóng gói phải giữ bundle id không phải debug, URL feed Sparkle
    không rỗng, và `CFBundleVersion` bằng hoặc cao hơn sàn bản dựng Sparkle chuẩn
    cho phiên bản phát hành đó

## Hộp kiểm thử phát hành

`Full Release Validation` là cách operator khởi động tất cả kiểm thử trước phát hành từ
một điểm vào. Để có bằng chứng commit đã ghim trên một nhánh thay đổi nhanh, dùng
helper để mọi quy trình con chạy từ một nhánh tạm cố định tại SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Helper đẩy `release-ci/<sha>-...`, điều phối `Full Release Validation`
từ nhánh đó với `ref=<sha>`, xác minh mọi `headSha` của quy trình con
khớp với mục tiêu, rồi xóa nhánh tạm. Điều này tránh vô tình chứng minh một
lượt chạy con `main` mới hơn.

Để xác thực nhánh hoặc thẻ phát hành, chạy từ workflow ref `main` đáng tin cậy
và truyền nhánh hoặc thẻ phát hành làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Quy trình phân giải ref đích, kích hoạt `CI` thủ công với
`target_ref=<release-ref>`, kích hoạt `OpenClaw Release Checks`, chuẩn bị một
tạo phẩm mẹ `release-package-under-test` cho các kiểm tra hướng đến gói, và
kích hoạt E2E Telegram gói độc lập khi `release_profile=full` với
`rerun_group=all` hoặc khi `npm_telegram_package_spec` được đặt. Sau đó
`OpenClaw Release Checks` tỏa ra các kiểm tra cài đặt smoke, kiểm tra bản phát
hành đa hệ điều hành, phạm vi đường dẫn phát hành Docker live/E2E, Package
Acceptance với QA gói Telegram, kiểm tra tương đồng QA Lab, Matrix live và
Telegram live. Một lần chạy đầy đủ chỉ được chấp nhận khi tóm tắt
`Full Release Validation`
hiển thị `normal_ci` và `release_checks` thành công. Ở chế độ full/all, tiến
trình con `npm_telegram` cũng phải thành công; ngoài full/all, tiến trình này bị
bỏ qua trừ khi đã cung cấp một `npm_telegram_package_spec` đã phát hành. Tóm tắt
xác minh cuối cùng bao gồm các bảng công việc chậm nhất cho từng lần chạy con,
để người quản lý bản phát hành có thể thấy đường găng hiện tại mà không cần tải
nhật ký.
Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn hoàn chỉnh, tên công việc quy trình chính xác, khác biệt giữa
hồ sơ stable và full, tạo phẩm, và các handle chạy lại tập trung.
Các quy trình con được kích hoạt từ ref đáng tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` đích trỏ đến một nhánh
hoặc thẻ bản phát hành cũ hơn. Không có đầu vào workflow-ref riêng cho Full
Release Validation; hãy chọn bộ điều phối đáng tin cậy bằng cách chọn ref chạy
quy trình. Không dùng `--ref main -f ref=<sha>` để chứng minh commit chính xác
trên `main` đang di chuyển; SHA commit thô không thể là ref kích hoạt quy trình,
vì vậy hãy dùng `pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn độ rộng live/nhà cung cấp:

- `minimum`: đường dẫn OpenAI/core live và Docker quan trọng cho phát hành, nhanh nhất
- `stable`: minimum cộng với phạm vi nhà cung cấp/backend stable để phê duyệt phát hành
- `full`: stable cộng với phạm vi nhà cung cấp/phương tiện tư vấn rộng

`OpenClaw Release Checks` dùng ref quy trình đáng tin cậy để phân giải ref đích
một lần dưới dạng `release-package-under-test` và tái sử dụng tạo phẩm đó trong
cả kiểm tra Docker đường dẫn phát hành lẫn Package Acceptance. Điều này giữ mọi
máy hướng đến gói trên cùng một byte và tránh dựng gói lặp lại.
Kiểm tra cài đặt OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL`
khi biến repo/org được đặt, nếu không dùng `openai/gpt-5.4`, vì lane này đang
chứng minh cài đặt gói, onboarding, khởi động Gateway, và một lượt agent live
thay vì đo benchmark mô hình mặc định chậm nhất. Ma trận nhà cung cấp live rộng
hơn vẫn là nơi dành cho phạm vi theo mô hình cụ thể.

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

Đừng dùng ô dù đầy đủ làm lần chạy lại đầu tiên sau một bản sửa tập trung. Nếu
một máy thất bại, hãy dùng quy trình con, công việc, lane Docker, hồ sơ gói, nhà
cung cấp mô hình, hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy
lại ô dù đầy đủ khi bản sửa thay đổi điều phối phát hành dùng chung hoặc làm
bằng chứng tất cả máy trước đó trở nên cũ. Trình xác minh cuối cùng của ô dù
kiểm tra lại các id lần chạy quy trình con đã ghi nhận, vì vậy sau khi một quy
trình con được chạy lại thành công, chỉ chạy lại công việc mẹ
`Verify full validation` đã thất bại.

Để khôi phục có giới hạn, truyền `rerun_group` cho ô dù. `all` là lần chạy ứng
viên phát hành thật, `ci` chỉ chạy tiến trình con CI thông thường,
`plugin-prerelease` chỉ chạy tiến trình con Plugin chỉ dành cho phát hành,
`release-checks` chạy mọi máy phát hành, và các nhóm phát hành hẹp hơn là
`install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`
và `npm-telegram`. Các lần chạy lại `npm-telegram` tập trung yêu cầu
`npm_telegram_package_spec`; các lần chạy full/all với `release_profile=full`
dùng tạo phẩm gói release-checks.

### Vitest

Máy Vitest là quy trình con `CI` thủ công. CI thủ công cố ý bỏ qua phạm vi thay
đổi và ép đồ thị kiểm thử thông thường cho ứng viên phát hành: các shard Linux
Node, các shard Plugin đóng gói, hợp đồng kênh, khả năng tương thích Node 22,
`check`, `check-additional`, smoke build, kiểm tra tài liệu, Skills Python,
Windows, macOS, Android, và i18n Control UI.

Dùng máy này để trả lời “cây mã nguồn có vượt qua toàn bộ bộ kiểm thử thông
thường không?” Nó không giống xác thực sản phẩm theo đường dẫn phát hành. Bằng
chứng cần giữ:

- Tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã kích hoạt
- Lần chạy `CI` xanh trên đúng SHA đích
- Tên shard thất bại hoặc chậm từ các công việc CI khi điều tra hồi quy
- Tạo phẩm thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi một
  lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI thông thường xác định
nhưng không cần các máy Docker, QA Lab, live, đa hệ điều hành, hoặc gói:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Máy Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với quy trình
`install-smoke` ở chế độ phát hành. Nó xác thực ứng viên phát hành qua các môi
trường Docker đã đóng gói thay vì chỉ kiểm thử cấp mã nguồn.

Phạm vi Docker phát hành bao gồm:

- smoke cài đặt đầy đủ với smoke cài đặt Bun toàn cục chậm được bật
- chuẩn bị/tái sử dụng ảnh smoke Dockerfile gốc theo SHA đích, với các công việc
  smoke QR, root/gateway, và installer/Bun chạy dưới dạng các shard install-smoke riêng
- các lane E2E của kho mã
- các chunk Docker đường dẫn phát hành: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài đặt/gỡ cài đặt Plugin đóng gói đã tách
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các bộ nhà cung cấp live/E2E và phạm vi mô hình live Docker khi release checks
  bao gồm các bộ live

Dùng tạo phẩm Docker trước khi chạy lại. Bộ lập lịch đường dẫn phát hành tải lên
`.artifacts/docker-tests/` với nhật ký lane, `summary.json`, `failures.json`,
thời gian pha, JSON kế hoạch bộ lập lịch, và lệnh chạy lại. Để khôi phục tập
trung, dùng `docker_lanes=<lane[,lane]>` trên quy trình live/E2E tái sử dụng
thay vì chạy lại toàn bộ các chunk phát hành. Các lệnh chạy lại được tạo bao
gồm `package_artifact_run_id` trước đó và đầu vào ảnh Docker đã chuẩn bị khi có,
vì vậy một lane thất bại có thể tái sử dụng cùng tarball và ảnh GHCR.

### QA Lab

Máy QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành
về hành vi agentic và cấp kênh, tách biệt với cơ chế gói Vitest và Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane tương đồng mock so sánh lane ứng viên OpenAI với baseline Opus 4.6 bằng
  gói tương đồng agentic
- hồ sơ QA Matrix live nhanh bằng môi trường `qa-live-shared`
- lane QA Telegram live bằng lease thông tin xác thực Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng máy này để trả lời “bản phát hành có hoạt động đúng trong các kịch bản QA
và luồng kênh live không?” Giữ URL tạo phẩm cho các lane tương đồng, Matrix và
Telegram khi phê duyệt phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng
lần chạy QA-Lab thủ công chia shard thay vì lane quan trọng cho phát hành mặc định.

### Gói

Máy Gói là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi Package Acceptance
và trình phân giải `scripts/resolve-openclaw-package-candidate.mjs`. Trình phân
giải chuẩn hóa một ứng viên thành tarball `package-under-test` được Docker E2E
tiêu thụ, xác thực inventory gói, ghi lại phiên bản gói và SHA-256, và giữ ref
bộ điều phối quy trình tách biệt với ref nguồn gói.

Nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác
- `source=ref`: đóng gói một nhánh, thẻ, hoặc SHA commit đầy đủ `package_ref`
  đáng tin cậy bằng bộ điều phối `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` do một lần chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, tạo
phẩm gói phát hành đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues`, và
`telegram_mode=mock-openai`. Package Acceptance giữ migration, cập nhật, dọn dẹp
phụ thuộc Plugin cũ, fixture Plugin offline, cập nhật Plugin, và QA gói Telegram
trên cùng một tarball đã phân giải. Ma trận nâng cấp bao phủ mọi baseline npm stable đã phát hành từ `2026.4.23` đến `latest`; dùng
Package Acceptance với `source=npm` cho một ứng viên đã phát hành, hoặc
`source=ref`/`source=artifact` cho tarball npm cục bộ có SHA bảo chứng trước khi
phát hành. Đây là bản thay thế gốc GitHub cho hầu hết phạm vi gói/cập nhật trước
đây cần Parallels. Kiểm tra phát hành đa hệ điều hành vẫn quan trọng cho
onboarding, trình cài đặt và hành vi nền tảng theo hệ điều hành, nhưng xác thực
sản phẩm gói/cập nhật nên ưu tiên Package Acceptance.

Danh sách kiểm canonical cho xác thực cập nhật và Plugin là
[Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins). Dùng danh sách này
khi quyết định lane cục bộ, Docker, Package Acceptance, hoặc release-check nào
chứng minh thay đổi cài đặt/cập nhật Plugin, dọn dẹp doctor, hoặc migration gói
đã phát hành. Migration cập nhật đã phát hành đầy đủ từ mọi gói stable
`2026.4.23+` là một quy trình `Update Migration` thủ công riêng, không thuộc
Full Release CI.

Sự nới lỏng package-acceptance cũ được cố ý giới hạn thời gian. Các gói đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống metadata đã
phát hành lên npm: các mục inventory QA riêng tư thiếu trong tarball, thiếu
`gateway install --wrapper`, thiếu tệp vá trong fixture git bắt nguồn từ
tarball, thiếu `update.channel` đã lưu bền vững, vị trí install-record Plugin
cũ, thiếu lưu bền vững install-record marketplace, và migration metadata cấu
hình trong `plugins update`. Gói `2026.4.26` đã phát hành có thể cảnh báo về các
tệp dấu metadata build cục bộ đã được phát hành. Các gói sau đó phải đáp ứng
các hợp đồng gói hiện đại; cùng các khoảng trống đó sẽ làm xác thực phát hành
thất bại.

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

- `smoke`: các lane cài đặt nhanh gói/kênh/agent, mạng Gateway và tải lại cấu hình
- `package`: hợp đồng cài đặt/cập nhật/gói Plugin không cần ClawHub trực tiếp; đây là mặc định kiểm tra phát hành
- `product`: `package` cộng với các kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để chứng minh Telegram cho gói ứng viên, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Quy trình truyền tarball
`package-under-test` đã phân giải vào lane Telegram; quy trình Telegram độc lập
vẫn chấp nhận một đặc tả npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành

`OpenClaw Release Publish` là điểm vào phát hành có thay đổi trạng thái thông thường. Nó
điều phối các quy trình trusted-publisher theo đúng thứ tự mà bản phát hành cần:

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

Chỉ dùng các quy trình cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa hoặc phát hành lại có trọng tâm. Đối với sửa chữa Plugin đã chọn, truyền
`plugin_publish_scope=selected` và `plugins=@openclaw/name` cho
`OpenClaw Release Publish`, hoặc dispatch trực tiếp quy trình con khi gói
OpenClaw không được phép phát hành.

## Đầu vào quy trình NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit
  đầy đủ 40 ký tự hiện tại của nhánh quy trình cho preflight chỉ xác thực
- `preflight_only`: `true` để chỉ xác thực/build/package, `false` cho đường dẫn
  phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để quy trình dùng lại
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: thẻ npm đích cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `npm_dist_tag`: thẻ npm đích cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa có trọng tâm
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng quy trình
  làm bộ điều phối sửa chữa chỉ dành cho Plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `ref`: nhánh, thẻ hoặc SHA commit đầy đủ để xác thực. Các kiểm tra mang secret
  yêu cầu commit đã phân giải phải có thể truy cập từ một nhánh OpenClaw hoặc
  thẻ phát hành.

Quy tắc:

- Thẻ ổn định và thẻ sửa lỗi có thể phát hành lên `beta` hoặc `latest`
- Thẻ tiền phát hành beta chỉ có thể phát hành lên `beta`
- Đối với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ để xác thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  quy trình xác minh metadata đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi cắt một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi thẻ tồn tại, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh
     quy trình cho một lần chạy thử chỉ xác thực của quy trình preflight
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc `latest` chỉ
   khi bạn chủ ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành hoặc SHA
   commit đầy đủ khi bạn muốn CI thông thường cộng với phạm vi bao phủ cache prompt trực tiếp,
   Docker, QA Lab, Matrix và Telegram từ một quy trình thủ công
4. Nếu bạn chủ ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   quy trình thủ công `CI` trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`,
   và `preflight_run_id` đã lưu; nó phát hành các Plugin đã ngoại hóa lên npm
   và ClawHub trước khi quảng bá gói npm OpenClaw
7. Nếu bản phát hành đã lên `beta`, dùng quy trình riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để quảng bá phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành chủ ý phát hành trực tiếp lên `latest` và `beta`
   nên theo cùng bản build ổn định ngay lập tức, hãy dùng cùng quy trình riêng tư đó
   để trỏ cả hai dist-tag vào phiên bản ổn định, hoặc để đồng bộ tự phục hồi
   theo lịch của nó di chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật, vì nó vẫn
cần `NPM_TOKEN`, trong khi repo công khai giữ phát hành chỉ dùng OIDC.

Điều đó giúp cả đường dẫn phát hành trực tiếp và đường dẫn quảng bá beta-trước
đều được ghi lại trong tài liệu và hiển thị cho người vận hành.

Nếu maintainer phải quay về xác thực npm cục bộ, chỉ chạy mọi lệnh 1Password
CLI (`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell agent chính; giữ nó trong tmux giúp các prompt,
cảnh báo và xử lý OTP có thể quan sát được và ngăn cảnh báo máy chủ lặp lại.

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
