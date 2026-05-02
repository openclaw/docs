---
read_when:
    - Đang tìm các định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc chấp nhận gói
    - Tìm quy ước đặt tên phiên bản và nhịp phát hành
summary: Các luồng phát hành, danh sách kiểm tra cho người vận hành, hộp xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-02T20:57:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 493cb8b42f0e15f3bf5f8fb9be7d01fd626f4f16db9ac0a85e6efa747ef12d12
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có bốn luồng phát hành công khai:

- ổn định: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- alpha: các thẻ tiền phát hành được phát hành lên npm `alpha`
- beta: các thẻ tiền phát hành được phát hành lên npm `beta`
- dev: đầu nhánh đang thay đổi của `main`

## Đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản tiền phát hành alpha: `YYYY.M.D-alpha.N`
  - Thẻ Git: `vYYYY.M.D-alpha.N`
- Phiên bản tiền phát hành beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm ổn định đã được thăng cấp hiện tại
- `alpha` nghĩa là mục tiêu cài đặt alpha hiện tại
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành ổn định và phát hành sửa lỗi ổn định mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm rõ ràng đến `latest`, hoặc thăng cấp một bản dựng beta đã được kiểm duyệt sau đó
- Mỗi bản phát hành OpenClaw ổn định đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/package trước, còn
  việc dựng/ký/công chứng ứng dụng mac được dành cho bản ổn định trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Bản ổn định chỉ theo sau sau khi beta mới nhất được xác thực
- Các maintainer thường cắt bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy lên hoặc phát hành và cần sửa lỗi, maintainer cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho maintainer

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag và chi tiết rollback khẩn cấp nằm trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy lên,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thực bằng
   `/changelog`, giữ các mục hướng đến người dùng, commit, đẩy lên, rồi rebase/pull
   thêm một lần trước khi tạo nhánh.
3. Xem lại các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa
   tương thích đã hết hạn khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do nó
   được giữ lại có chủ ý.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không làm công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, chạy
   `pnpm plugins:sync` để các gói Plugin có thể phát hành dùng chung phiên bản phát hành
   và metadata tương thích, rồi chạy preflight cục bộ có tính quyết định:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, và
   `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA nhánh phát hành đủ 40 ký tự được phép dùng cho preflight chỉ xác thực.
   Lưu `preflight_run_id` thành công.
7. Khởi động tất cả kiểm thử tiền phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, luồng, job workflow,
   hồ sơ package, provider, hoặc danh sách cho phép model nhỏ nhất đã thất bại để
   chứng minh bản sửa. Chỉ chạy lại umbrella đầy đủ khi bề mặt thay đổi khiến
   bằng chứng trước đó không còn mới.
9. Với alpha hoặc beta, gắn thẻ `vYYYY.M.D-alpha.N` hoặc `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` tương ứng. Nó xác minh `pnpm plugins:sync:check`,
   phát hành tất cả gói Plugin có thể phát hành lên npm trước, phát hành cùng
   tập đó lên ClawHub sau, rồi thăng cấp artifact preflight OpenClaw npm đã chuẩn bị
   với dist-tag tương ứng. Sau khi phát hành, chạy kiểm tra chấp nhận package
   sau phát hành đối với package `openclaw@YYYY.M.D-alpha.N`, `openclaw@alpha`,
   `openclaw@YYYY.M.D-beta.N`, hoặc `openclaw@beta` đã phát hành. Nếu một bản tiền phát hành đã đẩy lên hoặc
   đã phát hành cần sửa lỗi, cắt số tiền phát hành tương ứng tiếp theo;
   không xóa hoặc viết lại bản tiền phát hành cũ.
10. Với bản ổn định, chỉ tiếp tục sau khi beta hoặc release candidate đã được kiểm duyệt có
    bằng chứng xác thực bắt buộc. Phát hành npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công qua
    `preflight_run_id`; mức sẵn sàng phát hành macOS ổn định cũng yêu cầu
    các tệp `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói và `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy trình xác minh npm sau phát hành, E2E Telegram
    published-npm độc lập tùy chọn khi bạn cần bằng chứng kênh sau phát hành,
    thăng cấp dist-tag khi cần, ghi chú GitHub release/prerelease từ
    phần `CHANGELOG.md` tương ứng đầy đủ, và các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước bước kiểm tra trước phát hành để TypeScript của kiểm thử vẫn được bao phủ bên ngoài cổng kiểm tra `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước bước kiểm tra trước phát hành để các kiểm tra chu trình import rộng hơn và ranh giới kiến trúc đều đạt bên ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các tạo phẩm phát hành `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực đóng gói
- Chạy `pnpm plugins:sync` sau khi tăng phiên bản root và trước khi gắn thẻ. Lệnh này cập nhật phiên bản gói plugin có thể phát hành, siêu dữ liệu tương thích peer/API của OpenClaw, siêu dữ liệu bản dựng, và các khung nhật ký thay đổi plugin để khớp với phiên bản phát hành lõi. `pnpm plugins:sync:check` là bộ bảo vệ phát hành không thay đổi trạng thái; quy trình phát hành sẽ thất bại trước khi có bất kỳ thay đổi nào trong kho đăng ký nếu quên bước này.
- Chạy quy trình thủ công `Full Release Validation` trước khi phê duyệt phát hành để khởi chạy tất cả hộp kiểm thử trước phát hành từ một điểm vào. Quy trình này chấp nhận nhánh, thẻ hoặc SHA commit đầy đủ, kích hoạt `CI` thủ công, và kích hoạt `OpenClaw Release Checks` cho kiểm thử khói cài đặt, chấp nhận gói, các bộ kiểm thử đường phát hành Docker, trực tiếp/E2E, OpenWebUI, tương đương QA Lab, Matrix, và các luồng Telegram. Với `release_profile=full` và `rerun_group=all`, quy trình cũng chạy Telegram E2E cho gói với tạo phẩm `release-package-under-test` từ các kiểm tra phát hành. Cung cấp `npm_telegram_package_spec` sau khi phát hành khi cùng Telegram E2E đó cũng cần chứng minh gói npm đã phát hành. Cung cấp `package_acceptance_package_spec` sau khi phát hành khi Package Acceptance nên chạy ma trận gói/cập nhật của nó với gói npm đã giao thay vì tạo phẩm được build từ SHA. Cung cấp `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng phần xác thực khớp với một gói npm đã phát hành mà không bắt buộc chạy Telegram E2E. Ví dụ: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy quy trình thủ công `Package Acceptance` khi bạn muốn có bằng chứng bổ sung cho một ứng viên gói trong khi công việc phát hành tiếp tục. Dùng `source=npm` cho `openclaw@alpha`, `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref` để đóng gói một nhánh/thẻ/SHA `package_ref` đáng tin cậy bằng bộ khung `workflow_ref` hiện tại; `source=url` cho một gói nén tar HTTPS bắt buộc có SHA-256; hoặc `source=artifact` cho một gói nén tar do lần chạy GitHub Actions khác tải lên. Quy trình phân giải ứng viên thành `package-under-test`, dùng lại bộ lập lịch phát hành Docker E2E với gói nén tar đó, và có thể chạy Telegram QA với cùng gói nén tar bằng `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các luồng Docker đã chọn bao gồm `published-upgrade-survivor`, tạo phẩm gói là ứng viên và `published_upgrade_survivor_baseline` chọn đường cơ sở đã phát hành.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Các hồ sơ phổ biến:
  - `smoke`: các luồng cài đặt/kênh/tác tử, mạng Gateway, và tải lại cấu hình
  - `package`: các luồng gói/cập nhật/plugin dùng trực tiếp tạo phẩm, không có OpenWebUI hoặc ClawHub trực tiếp
  - `product`: hồ sơ gói cộng với các kênh MCP, dọn dẹp Cron/tác tử con, tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các phần đường phát hành Docker với OpenWebUI
  - `custom`: lựa chọn chính xác `docker_lanes` cho một lần chạy lại tập trung
- Chạy trực tiếp quy trình thủ công `CI` khi bạn chỉ cần độ bao phủ CI bình thường đầy đủ cho ứng viên phát hành. Các lần kích hoạt CI thủ công bỏ qua phạm vi theo thay đổi và bắt buộc chạy các shard Linux Node, shard plugin đi kèm, hợp đồng kênh, tương thích Node 22, `check`, `check-additional`, kiểm thử khói bản dựng, kiểm tra tài liệu, Skills Python, Windows, macOS, Android, và các luồng i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực đo từ xa phát hành. Lệnh này chạy QA-lab qua một bộ nhận OTLP/HTTP cục bộ và xác minh tên span trace đã xuất, thuộc tính có giới hạn, và biên tập nội dung/mã định danh mà không cần Opik, Langfuse, hoặc bộ thu thập bên ngoài khác.
- Chạy `pnpm release:check` trước mọi bản phát hành đã gắn thẻ
- Chạy `OpenClaw Release Publish` cho chuỗi phát hành có thay đổi trạng thái sau khi thẻ đã tồn tại. Kích hoạt từ `release/YYYY.M.D` (hoặc `main` khi phát hành một thẻ có thể truy cập từ `main`), truyền thẻ phát hành và `preflight_run_id` npm OpenClaw thành công, và giữ phạm vi phát hành plugin mặc định `all-publishable` trừ khi bạn đang cố ý chạy một sửa chữa tập trung. Quy trình này tuần tự hóa phát hành npm plugin, phát hành ClawHub plugin, và phát hành npm OpenClaw để gói lõi không được phát hành trước các plugin đã tách ngoài của nó.
- Các kiểm tra phát hành hiện chạy trong một quy trình thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy luồng tương đương mock QA Lab cùng với hồ sơ Matrix trực tiếp nhanh và luồng QA Telegram trước khi phê duyệt phát hành. Các luồng trực tiếp dùng môi trường `qa-live-shared`; Telegram cũng dùng các phiên thuê thông tin xác thực CI Convex. Chạy quy trình thủ công `QA-Lab - All Lanes` với `matrix_profile=all` và `matrix_shards=true` khi bạn muốn toàn bộ kiểm kê giao vận, phương tiện, và E2EE của Matrix chạy song song.
- Xác thực thời gian chạy cài đặt và nâng cấp đa hệ điều hành là một phần của `OpenClaw Release Checks` và `Full Release Validation` công khai, các quy trình này gọi trực tiếp quy trình tái sử dụng `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Sự tách biệt này là có chủ ý: giữ đường phát hành npm thật ngắn, tất định, và tập trung vào tạo phẩm, trong khi các kiểm tra trực tiếp chậm hơn nằm trong luồng riêng để chúng không làm đình trệ hoặc chặn phát hành
- Các kiểm tra phát hành dùng bí mật nên được kích hoạt qua `Full Release Validation` hoặc từ ref quy trình `main`/release để logic quy trình và bí mật vẫn được kiểm soát
- `OpenClaw Release Checks` chấp nhận nhánh, thẻ hoặc SHA commit đầy đủ miễn là commit đã phân giải có thể truy cập từ một nhánh OpenClaw hoặc thẻ phát hành
- Kiểm tra trước phát hành chỉ xác thực của `OpenClaw NPM Release` cũng chấp nhận SHA commit đầy đủ 40 ký tự của nhánh quy trình hiện tại mà không yêu cầu thẻ đã được đẩy
- Cách dùng SHA đó chỉ dành cho xác thực và không thể được nâng thành phát hành thật
- Ở chế độ SHA, quy trình tổng hợp `v<package.json version>` chỉ cho kiểm tra siêu dữ liệu gói; phát hành thật vẫn yêu cầu thẻ phát hành thật
- Cả hai quy trình giữ đường phát hành và quảng bá thật trên các trình chạy do GitHub lưu trữ, trong khi đường xác thực không thay đổi trạng thái có thể dùng các trình chạy Linux Blacksmith lớn hơn
- Quy trình đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai bí mật quy trình `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Kiểm tra trước phát hành npm không còn chờ luồng kiểm tra phát hành riêng biệt
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts` (hoặc thẻ beta/bản sửa lỗi tương ứng) trước khi phê duyệt
- Sau khi phát hành npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/bản sửa lỗi tương ứng) để xác minh đường cài đặt kho đăng ký đã phát hành trong một tiền tố tạm thời mới
- Sau một lần phát hành beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` để xác minh quá trình thiết lập ban đầu của gói đã cài đặt, thiết lập Telegram, và E2E Telegram thật với gói npm đã phát hành bằng nhóm thông tin xác thực Telegram thuê dùng chung. Các lần chạy cục bộ một lần của người bảo trì có thể bỏ các biến Convex và truyền trực tiếp ba thông tin xác thực môi trường `OPENCLAW_QA_TELEGRAM_*`.
- Người bảo trì có thể chạy cùng kiểm tra sau phát hành từ GitHub Actions qua quy trình thủ công `NPM Telegram Beta E2E`. Quy trình này cố ý chỉ chạy thủ công và không chạy ở mọi lần hợp nhất.
- Tự động hóa phát hành của người bảo trì hiện dùng quy trình kiểm tra trước rồi quảng bá:
  - lần phát hành npm thật phải vượt qua một `preflight_run_id` npm thành công
  - lần phát hành npm thật phải được kích hoạt từ cùng nhánh `main` hoặc `release/YYYY.M.D` với lần chạy kiểm tra trước thành công
  - các bản phát hành npm ổn định mặc định dùng `beta`
  - phát hành npm ổn định có thể nhắm rõ `latest` qua đầu vào quy trình
  - thay đổi dist-tag npm dựa trên token hiện nằm trong `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` vì lý do bảo mật, bởi vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi kho công khai giữ phát hành chỉ dùng OIDC
  - `macOS Release` công khai chỉ dùng để xác thực; khi thẻ chỉ nằm trên nhánh phát hành nhưng quy trình được kích hoạt từ `main`, đặt `public_release_branch=release/YYYY.M.D`
  - phát hành mac riêng tư thật phải vượt qua `preflight_run_id` và `validate_run_id` mac riêng tư thành công
  - các đường phát hành thật quảng bá các tạo phẩm đã chuẩn bị thay vì build lại chúng
- Đối với các bản phát hành sửa lỗi ổn định như `YYYY.M.D-N`, trình xác minh sau phát hành cũng kiểm tra cùng đường nâng cấp bằng tiền tố tạm thời từ `YYYY.M.D` lên `YYYY.M.D-N` để các bản sửa phát hành không thể âm thầm để các cài đặt toàn cục cũ ở lại gói nội dung ổn định gốc
- Kiểm tra trước phát hành npm sẽ thất bại theo hướng chặn trừ khi gói nén tar bao gồm cả `dist/control-ui/index.html` và phần nội dung `dist/control-ui/assets/` không rỗng để chúng ta không phát hành lại bảng điều khiển trình duyệt rỗng
- Xác minh sau phát hành cũng kiểm tra rằng các điểm vào plugin đã phát hành và siêu dữ liệu gói có mặt trong bố cục kho đăng ký đã cài đặt. Một bản phát hành giao thiếu nội dung thời gian chạy plugin sẽ làm trình xác minh sau phát hành thất bại và không thể được quảng bá lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của npm pack trên gói nén tar cập nhật ứng viên, để E2E trình cài đặt bắt được việc phình to gói ngoài ý muốn trước đường phát hành
- Nếu công việc phát hành chạm tới lập kế hoạch CI, bản kê thời gian của tiện ích mở rộng, hoặc ma trận kiểm thử tiện ích mở rộng, hãy tái tạo và rà soát các đầu ra ma trận `plugin-prerelease-extension-shard` do bộ lập kế hoạch sở hữu từ `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành không mô tả bố cục CI lỗi thời
- Mức sẵn sàng của bản phát hành macOS ổn định cũng bao gồm các phần liên quan đến trình cập nhật:
  - bản phát hành GitHub cuối cùng phải có `.zip`, `.dmg`, và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ tới tệp zip ổn định mới sau khi phát hành
  - ứng dụng đã đóng gói phải giữ mã định danh gói không gỡ lỗi, URL nguồn cấp Sparkle không rỗng, và `CFBundleVersion` bằng hoặc cao hơn ngưỡng build Sparkle chuẩn cho phiên bản phát hành đó

## Hộp kiểm thử bản phát hành

`Full Release Validation` là cách người vận hành khởi chạy tất cả kiểm thử trước phát hành từ một điểm vào. Để có bằng chứng commit được ghim trên một nhánh thay đổi nhanh, hãy dùng trình trợ giúp để mọi quy trình con chạy từ một nhánh tạm thời cố định ở SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Trình trợ giúp đẩy `release-ci/<sha>-...`, kích hoạt `Full Release Validation` từ nhánh đó với `ref=<sha>`, xác minh `headSha` của mọi quy trình con khớp với mục tiêu, rồi xóa nhánh tạm thời. Điều này tránh vô tình chứng minh một lần chạy con mới hơn của `main`.

Để xác thực nhánh hoặc thẻ phát hành, chạy từ ref quy trình `main` đáng tin cậy và truyền nhánh hoặc thẻ phát hành làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Quy trình làm việc phân giải ref đích, dispatch thủ công `CI` với
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, và dispatch
package Telegram E2E độc lập khi `release_profile=full` với
`rerun_group=all` hoặc khi `npm_telegram_package_spec` được đặt. Sau đó `OpenClaw Release
Checks` mở rộng ra install smoke, kiểm tra phát hành đa hệ điều hành, phạm vi
kiểm thử live/E2E Docker theo release-path, Package Acceptance với Telegram package QA, QA Lab
parity, live Matrix, và live Telegram. Một lần chạy đầy đủ chỉ được chấp nhận khi
phần tóm tắt `Full Release Validation`
hiển thị `normal_ci` và `release_checks` thành công. Ở chế độ full/all,
child `npm_telegram` cũng phải thành công; ngoài full/all thì nó bị bỏ qua
trừ khi một `npm_telegram_package_spec` đã phát hành được cung cấp. Phần tóm tắt
xác minh cuối cùng bao gồm bảng các job chậm nhất cho từng lần chạy child, để release
manager có thể thấy critical path hiện tại mà không cần tải log xuống.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn đầy đủ, tên job workflow chính xác, khác biệt giữa hồ sơ stable và full,
artifact, và các handle rerun tập trung.
Các workflow child được dispatch từ ref đáng tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` đích trỏ đến một
nhánh hoặc tag phát hành cũ hơn. Không có input workflow-ref riêng cho Full Release Validation;
hãy chọn harness đáng tin cậy bằng cách chọn ref chạy workflow.
Không dùng `--ref main -f ref=<sha>` để chứng minh commit chính xác trên `main` đang di chuyển;
SHA commit thô không thể là ref dispatch workflow, vì vậy hãy dùng
`pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn phạm vi live/provider:

- `minimum`: đường dẫn OpenAI/core live và Docker quan trọng cho phát hành nhanh nhất
- `stable`: minimum cộng thêm phạm vi provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng thêm phạm vi provider/media tư vấn rộng hơn

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref đích
một lần dưới dạng `release-package-under-test` và tái sử dụng artifact đó trong cả
kiểm tra Docker theo release-path và Package Acceptance. Điều này giữ tất cả
box hướng package trên cùng một byte và tránh build package lặp lại.
Install smoke OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4`, vì lane này
chứng minh cài đặt package, onboarding, khởi động Gateway, và một lượt tác tử live
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
thất bại, hãy dùng workflow child, job, lane Docker, hồ sơ package, provider
model, hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi
bản sửa đã thay đổi điều phối phát hành dùng chung hoặc làm bằng chứng all-box trước đó
không còn mới. Verifier cuối cùng của umbrella kiểm tra lại các id lần chạy workflow child
đã ghi lại, vì vậy sau khi một workflow child được rerun thành công, chỉ rerun job cha
`Verify full validation` đã thất bại.

Để khôi phục có giới hạn, truyền `rerun_group` cho umbrella. `all` là lần chạy
release-candidate thật, `ci` chỉ chạy child CI bình thường, `plugin-prerelease`
chỉ chạy child Plugin chỉ dành cho phát hành, `release-checks` chạy mọi release
box, và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram`.
Các rerun `npm-telegram` tập trung yêu cầu `npm_telegram_package_spec`; các lần chạy full/all
với `release_profile=full` dùng artifact package của release-checks.

### Vitest

Box Vitest là workflow child `CI` thủ công. CI thủ công cố ý
bỏ qua phạm vi theo thay đổi và ép graph kiểm thử bình thường cho release
candidate: shard Linux Node, shard bundled-plugin, hợp đồng kênh, tương thích Node 22,
`check`, `check-additional`, build smoke, kiểm tra docs, Python
skills, Windows, macOS, Android, và Control UI i18n.

Dùng box này để trả lời "source tree có vượt qua toàn bộ bộ kiểm thử bình thường không?"
Nó không giống với xác thực sản phẩm theo release-path. Bằng chứng cần giữ:

- tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã dispatch
- lần chạy `CI` xanh trên SHA đích chính xác
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI bình thường xác định được nhưng
không cần các box Docker, QA Lab, live, đa hệ điều hành, hoặc package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow
`install-smoke` ở chế độ phát hành. Nó xác thực release candidate thông qua môi trường
Docker đã đóng package thay vì chỉ các kiểm thử cấp source.

Phạm vi Docker phát hành bao gồm:

- install smoke đầy đủ với slow Bun global install smoke được bật
- chuẩn bị/tái sử dụng image smoke Dockerfile gốc theo SHA đích, với các job QR,
  root/gateway, và installer/Bun smoke chạy dưới dạng shard install-smoke riêng
- các lane E2E repository
- các chunk Docker theo release-path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài/gỡ Plugin bundled tách riêng
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các suite provider live/E2E và phạm vi model live Docker khi release checks
  bao gồm các suite live

Dùng artifact Docker trước khi rerun. Scheduler theo release-path tải lên
`.artifacts/docker-tests/` với log lane, `summary.json`, `failures.json`,
thời gian pha, JSON kế hoạch scheduler, và lệnh rerun. Để khôi phục tập trung,
dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì
rerun mọi chunk phát hành. Các lệnh rerun được tạo sẽ bao gồm
`package_artifact_run_id` trước đó và input image Docker đã chuẩn bị khi có, để một
lane thất bại có thể tái sử dụng cùng tarball và image GHCR.

### QA Lab

Box QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là gate phát hành
hành vi agentic và cấp kênh, tách biệt với Vitest và cơ chế package Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane mock parity so sánh lane candidate OpenAI với baseline Opus 4.6
  bằng agentic parity pack
- hồ sơ QA Matrix live nhanh dùng môi trường `qa-live-shared`
- lane QA Telegram live dùng lease credential Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng box này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA và
luồng kênh live không?" Giữ URL artifact cho các lane parity, Matrix, và Telegram
khi phê duyệt phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng
lần chạy QA-Lab sharded thủ công thay vì lane quan trọng cho phát hành mặc định.

### Package

Box Package là gate sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver chuẩn hóa một
candidate thành tarball `package-under-test` được Docker E2E tiêu thụ, xác thực
inventory package, ghi lại phiên bản package và SHA-256, và giữ ref harness
workflow tách biệt với ref source package.

Các nguồn candidate được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw
  chính xác
- `source=ref`: đóng gói một nhánh, tag, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` do một lần chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`,
artifact package phát hành đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`published_upgrade_survivor_baselines=all-since-2026.4.23`,
`published_upgrade_survivor_scenarios=reported-issues`, và
`telegram_mode=mock-openai`. Package Acceptance giữ migration, update, dọn dẹp
phụ thuộc Plugin lỗi thời, fixture Plugin offline, cập nhật Plugin, và Telegram
package QA trên cùng tarball đã phân giải. Ma trận upgrade bao phủ mọi baseline ổn định đã phát hành trên npm từ `2026.4.23` đến `latest`; dùng
Package Acceptance với `source=npm` cho một candidate đã phát hành, hoặc
`source=ref`/`source=artifact` cho tarball npm cục bộ có SHA hỗ trợ trước khi
publish. Đây là giải pháp thay thế gốc GitHub
cho phần lớn phạm vi package/update trước đây cần Parallels. Kiểm tra phát hành đa hệ điều hành
vẫn quan trọng cho onboarding, installer, và hành vi nền tảng theo OS,
nhưng xác thực sản phẩm package/update nên ưu tiên Package Acceptance.

Checklist chuẩn cho xác thực update và Plugin là
[Kiểm thử update và Plugin](/vi/help/testing-updates-plugins). Dùng nó khi
quyết định lane cục bộ, Docker, Package Acceptance, hoặc release-check nào chứng minh một
thay đổi cài đặt/cập nhật Plugin, dọn dẹp bằng doctor, hoặc migration package đã phát hành.
Migration update đã phát hành toàn diện từ mọi package ổn định `2026.4.23+` là
workflow `Update Migration` thủ công riêng, không thuộc Full Release CI.

Sự nới lỏng package-acceptance legacy được cố ý giới hạn theo thời gian. Các package đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống metadata đã được phát hành
lên npm: mục inventory QA private bị thiếu khỏi tarball, thiếu
`gateway install --wrapper`, thiếu file patch trong fixture git dẫn xuất từ tarball,
thiếu `update.channel` được lưu bền, vị trí install-record
Plugin legacy, thiếu lưu bền install-record marketplace, và migration metadata
config trong `plugins update`. Package `2026.4.26` đã phát hành có thể cảnh báo
về các file stamp metadata build cục bộ đã được ship. Các package sau đó
phải đáp ứng hợp đồng package hiện đại; những khoảng trống tương tự sẽ làm xác thực
phát hành thất bại.

Dùng các hồ sơ Package Acceptance rộng hơn khi câu hỏi phát hành liên quan đến một
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

Các hồ sơ package phổ biến:

- `smoke`: các lane cài đặt package/kênh/tác tử nhanh, mạng Gateway, và reload
  config
- `package`: hợp đồng package cài đặt/update/Plugin không có ClawHub live; đây là mặc định
  release-check
- `product`: `package` cộng thêm kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI,
  và OpenWebUI
- `full`: các chunk Docker theo release-path với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho rerun tập trung

Để có bằng chứng Telegram cho ứng viên gói, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball
`package-under-test` đã phân giải vào lane Telegram; workflow Telegram độc lập
vẫn chấp nhận một đặc tả npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành bản phát hành

`OpenClaw Release Publish` là điểm vào phát hành có thay đổi trạng thái thông thường. Nó
điều phối các workflow nhà phát hành đáng tin cậy theo thứ tự mà bản phát hành cần:

1. Check out thẻ phát hành và phân giải SHA commit của thẻ đó.
2. Xác minh thẻ có thể truy cập được từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Kích hoạt `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Kích hoạt `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Kích hoạt `OpenClaw NPM Release` với thẻ phát hành, npm dist-tag, và
   `preflight_run_id` đã lưu.

Ví dụ phát hành beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Ví dụ phát hành alpha:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-alpha.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=alpha
```

Phát hành ổn định lên dist-tag beta mặc định:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Thăng hạng ổn định trực tiếp lên `latest` là thao tác tường minh:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa hoặc phát hành lại có trọng tâm. Để sửa chữa một plugin đã chọn, truyền
`plugin_publish_scope=selected` và `plugins=@openclaw/name` cho
`OpenClaw Release Publish`, hoặc kích hoạt trực tiếp workflow con khi
gói OpenClaw không được phát hành.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-alpha.1` hay `v2026.4.2-beta.1`; khi `preflight_only=true`, giá trị này cũng có thể là
  SHA commit đầy đủ 40 ký tự hiện tại của nhánh workflow để chạy preflight chỉ xác thực
- `preflight_only`: `true` chỉ để xác thực/build/package, `false` cho
  đường dẫn phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để workflow tái sử dụng
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: thẻ đích npm cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `npm_dist_tag`: thẻ đích npm cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa có trọng tâm
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng
  workflow làm bộ điều phối sửa chữa chỉ dành cho plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `ref`: nhánh, thẻ, hoặc SHA commit đầy đủ để xác thực. Các kiểm tra có chứa bí mật
  yêu cầu commit đã phân giải có thể truy cập được từ một nhánh OpenClaw hoặc
  thẻ phát hành.

Quy tắc:

- Thẻ ổn định và thẻ sửa lỗi có thể phát hành lên `beta` hoặc `latest`
- Thẻ prerelease alpha chỉ có thể phát hành lên `alpha`
- Thẻ prerelease beta chỉ có thể phát hành lên `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn
  chỉ dùng để xác thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh siêu dữ liệu đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi tạo một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi thẻ tồn tại, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh workflow
     để chạy thử workflow preflight chỉ xác thực
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc `latest` chỉ
   khi bạn cố ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành, hoặc SHA
   commit đầy đủ khi bạn muốn CI thông thường cùng với phạm vi kiểm thử live prompt cache, Docker, QA Lab,
   Matrix, và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`,
   và `preflight_run_id` đã lưu; workflow này phát hành các plugin đã ngoại hóa lên npm
   và ClawHub trước khi thăng hạng gói npm OpenClaw
7. Nếu bản phát hành được đưa lên `beta`, dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để thăng hạng phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý được phát hành trực tiếp lên `latest` và `beta`
   nên theo cùng bản build ổn định ngay lập tức, dùng cùng workflow riêng tư đó
   để trỏ cả hai dist-tag tới phiên bản ổn định, hoặc để đồng bộ tự phục hồi theo lịch của workflow
   chuyển `beta` sau

Việc thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật do nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ phát hành chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn phát hành trực tiếp và đường dẫn thăng hạng beta-trước
được ghi tài liệu và hiển thị với người vận hành.

Nếu maintainer phải quay lại xác thực npm cục bộ, chỉ chạy mọi lệnh CLI 1Password
(`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell tác nhân chính; giữ nó bên trong tmux giúp các lời nhắc,
cảnh báo, và xử lý OTP có thể quan sát được và ngăn cảnh báo máy chủ lặp lại.

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
