---
read_when:
    - Đang tìm các định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc nghiệm thu gói
    - Tìm cách đặt tên phiên bản và nhịp phát hành
summary: Các làn phát hành, danh sách kiểm tra cho người vận hành, các máy xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-05T01:50:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41886d3bb2f970e6a86944e5ff207b1b29b1b64b1f234d45f626fed19cf032b3
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba luồng phát hành công khai:

- stable: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
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
- `latest` nghĩa là bản phát hành npm ổn định hiện tại đã được quảng bá
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành ổn định và bản phát hành sửa lỗi ổn định mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm đến `latest` một cách rõ ràng, hoặc quảng bá một bản dựng beta đã được kiểm định sau đó
- Mọi bản phát hành OpenClaw ổn định đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/gói trước, còn
  việc dựng/ký/công chứng ứng dụng mac được dành cho bản ổn định trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Bản ổn định chỉ theo sau sau khi bản beta mới nhất được xác thực
- Người bảo trì thường cắt bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc phát hành và cần sửa lỗi, người bảo trì cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho người bảo trì

## Danh sách kiểm tra dành cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag và chi tiết khôi phục khẩn cấp được giữ trong
sổ tay phát hành chỉ dành cho người bảo trì.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần trên cùng của `CHANGELOG.md` từ lịch sử commit thực bằng
   `/changelog`, giữ các mục hướng đến người dùng, commit, đẩy, rồi rebase/kéo
   thêm một lần nữa trước khi tạo nhánh.
3. Xem lại các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do vì sao nó được
   cố ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành bình thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, chạy
   `pnpm plugins:sync` để các gói Plugin có thể phát hành chia sẻ phiên bản phát hành
   và siêu dữ liệu tương thích, rồi chạy bước kiểm tra sơ bộ xác định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, và
   `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA đầy đủ 40 ký tự của nhánh phát hành được phép dùng cho kiểm tra sơ bộ
   chỉ để xác thực. Lưu `preflight_run_id` thành công.
7. Khởi động tất cả kiểm thử tiền phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, luồng,
   công việc workflow, hồ sơ gói, nhà cung cấp, hoặc danh sách cho phép mô hình
   nhỏ nhất đã thất bại để chứng minh bản sửa. Chỉ chạy lại toàn bộ lớp bao trùm
   khi bề mặt thay đổi khiến bằng chứng trước đó không còn mới.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` khớp. Nó xác minh `pnpm plugins:sync:check`,
   phát hành tất cả gói Plugin có thể phát hành lên npm trước, phát hành cùng
   tập hợp đó lên ClawHub thứ hai dưới dạng tarball ClawPack npm-pack, rồi quảng bá
   hiện vật kiểm tra sơ bộ npm OpenClaw đã chuẩn bị với dist-tag khớp. Sau khi
   phát hành, chạy chấp nhận gói sau phát hành
   đối với gói `openclaw@YYYY.M.D-beta.N` hoặc
   `openclaw@beta` đã phát hành. Nếu một bản tiền phát hành đã đẩy hoặc đã phát hành cần sửa lỗi,
   cắt số tiền phát hành khớp tiếp theo; không xóa hoặc viết lại bản tiền phát hành cũ.
10. Với bản ổn định, chỉ tiếp tục sau khi bản beta hoặc ứng viên phát hành đã kiểm định có
    bằng chứng xác thực bắt buộc. Phát hành npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng hiện vật kiểm tra sơ bộ thành công qua
    `preflight_run_id`; mức sẵn sàng phát hành macOS ổn định cũng yêu cầu
    các gói `.zip`, `.dmg`, `.dSYM.zip`, và `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy bộ xác minh npm sau phát hành, kiểm thử E2E Telegram
    từ npm đã phát hành độc lập tùy chọn khi bạn cần bằng chứng kênh sau phát hành,
    quảng bá dist-tag khi cần, ghi chú phát hành/tiền phát hành GitHub từ phần
    `CHANGELOG.md` hoàn chỉnh tương ứng, và các bước thông báo phát hành.

## Kiểm tra sơ bộ phát hành

- Chạy `pnpm check:test-types` trước bước kiểm tra trước phát hành để TypeScript của kiểm thử vẫn được
  bao phủ ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước bước kiểm tra trước phát hành để các kiểm tra chu trình import
  và ranh giới kiến trúc rộng hơn đều xanh ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các tạo tác phát hành
  `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực đóng gói
- Chạy `pnpm plugins:sync` sau khi tăng phiên bản gốc và trước khi gắn thẻ. Lệnh này
  cập nhật các phiên bản gói Plugin có thể phát hành, siêu dữ liệu tương thích
  peer/API của OpenClaw, siêu dữ liệu build, và các stub changelog Plugin để khớp với phiên bản phát hành
  lõi. `pnpm plugins:sync:check` là bộ bảo vệ phát hành không thay đổi dữ liệu;
  workflow phát hành sẽ thất bại trước mọi thay đổi registry nếu bước này bị
  quên.
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi động tất cả hộp kiểm thử tiền phát hành từ một điểm vào. Nó chấp nhận một nhánh,
  thẻ, hoặc SHA commit đầy đủ, dispatch `CI` thủ công, và dispatch
  `OpenClaw Release Checks` cho kiểm tra smoke cài đặt, chấp nhận gói, kiểm tra gói
  đa hệ điều hành, đối sánh QA Lab, Matrix, và các làn Telegram. Các lần chạy ổn định/mặc định
  giữ E2E/live toàn diện và soak đường dẫn phát hành Docker phía sau
  `run_release_soak=true`; `release_profile=full` buộc bật soak. Với
  `release_profile=full` và `rerun_group=all`, nó cũng chạy E2E Telegram gói
  trên tạo tác `release-package-under-test` từ kiểm tra phát hành.
  Cung cấp `npm_telegram_package_spec` sau khi phát hành khi cùng E2E
  Telegram cũng cần chứng minh gói npm đã phát hành. Cung cấp
  `package_acceptance_package_spec` sau khi phát hành khi Package Acceptance
  cần chạy ma trận gói/cập nhật của nó trên gói npm đã giao thay vì
  tạo tác được build từ SHA. Cung cấp
  `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng
  quá trình xác thực khớp với một gói npm đã phát hành mà không buộc chạy E2E Telegram.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng kênh phụ
  cho một ứng viên gói trong khi công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref`
  để đóng gói nhánh/thẻ/SHA `package_ref` đáng tin cậy bằng harness
  `workflow_ref` hiện tại; `source=url` cho tarball HTTPS với
  SHA-256 bắt buộc; hoặc `source=artifact` cho tarball được tải lên bởi một lần chạy
  GitHub Actions khác. Workflow phân giải ứng viên thành
  `package-under-test`, tái sử dụng bộ lập lịch phát hành Docker E2E trên
  tarball đó, và có thể chạy QA Telegram trên cùng tarball với
  `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các làn
  Docker đã chọn bao gồm `published-upgrade-survivor`, tạo tác gói là ứng viên và
  `published_upgrade_survivor_baseline` chọn baseline đã phát hành.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Hồ sơ phổ biến:
  - `smoke`: các làn cài đặt/kênh/agent, mạng Gateway, và tải lại cấu hình
  - `package`: các làn gói/cập nhật/Plugin gốc tạo tác không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ gói cộng thêm các kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần phạm vi bao phủ CI bình thường đầy đủ
  cho ứng viên phát hành. Các dispatch CI thủ công bỏ qua phạm vi theo thay đổi
  và buộc các shard Linux Node, shard Plugin tích hợp, hợp đồng kênh,
  tương thích Node 22, `check`, `check-additional`, smoke build,
  kiểm tra tài liệu, Python skills, Windows, macOS, Android, và các làn i18n
  Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này thực thi
  QA-lab qua một bộ nhận OTLP/HTTP cục bộ và xác minh tên span trace được xuất,
  thuộc tính có giới hạn, và việc biên tập nội dung/định danh mà không
  yêu cầu Opik, Langfuse, hoặc bộ thu thập bên ngoài khác.
- Chạy `pnpm release:check` trước mỗi phát hành được gắn thẻ
- Chạy `OpenClaw Release Publish` cho chuỗi phát hành có thay đổi dữ liệu sau khi
  thẻ tồn tại. Dispatch nó từ `release/YYYY.M.D` (hoặc `main` khi phát hành một
  thẻ có thể truy cập từ main), truyền thẻ phát hành và `preflight_run_id` npm
  OpenClaw thành công, và giữ phạm vi phát hành Plugin mặc định
  `all-publishable` trừ khi bạn chủ ý chạy một lần sửa chữa tập trung. Workflow
  tuần tự hóa phát hành npm Plugin, phát hành ClawHub Plugin, và phát hành npm OpenClaw
  để gói lõi không được phát hành trước các Plugin đã được externalize.
- Kiểm tra phát hành hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy làn đối sánh mô phỏng QA Lab cộng với hồ sơ
  Matrix live nhanh và làn QA Telegram trước khi phê duyệt phát hành. Các làn live
  dùng môi trường `qa-live-shared`; Telegram cũng dùng các lease thông tin xác thực Convex CI.
  Chạy workflow thủ công `QA-Lab - All Lanes` với
  `matrix_profile=all` và `matrix_shards=true` khi bạn muốn toàn bộ kiểm kê truyền tải
  Matrix, media, và E2EE chạy song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của
  `OpenClaw Release Checks` và `Full Release Validation` công khai, vốn gọi trực tiếp
  workflow tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ ý: giữ đường dẫn phát hành npm thật ngắn,
  xác định, và tập trung vào tạo tác, trong khi các kiểm tra live chậm hơn nằm trong
  làn riêng để chúng không làm đình trệ hoặc chặn phát hành
- Các kiểm tra phát hành mang bí mật nên được dispatch qua `Full Release
Validation` hoặc từ workflow ref `main`/release để logic workflow và
  bí mật vẫn được kiểm soát
- `OpenClaw Release Checks` chấp nhận một nhánh, thẻ, hoặc SHA commit đầy đủ miễn là
  commit được phân giải có thể truy cập từ một nhánh OpenClaw hoặc thẻ phát hành
- Bước kiểm tra trước chỉ xác thực của `OpenClaw NPM Release` cũng chấp nhận SHA commit
  đầy đủ 40 ký tự của nhánh workflow hiện tại mà không yêu cầu thẻ đã được push
- Đường dẫn SHA đó chỉ dùng để xác thực và không thể được nâng cấp thành phát hành thật
- Ở chế độ SHA, workflow chỉ tổng hợp `v<package.json version>` cho kiểm tra
  siêu dữ liệu gói; phát hành thật vẫn yêu cầu một thẻ phát hành thật
- Cả hai workflow giữ đường dẫn phát hành và thăng hạng thật trên runner do GitHub lưu trữ,
  trong khi đường dẫn xác thực không thay đổi dữ liệu có thể dùng runner
  Blacksmith Linux lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Bước kiểm tra trước phát hành npm không còn chờ làn kiểm tra phát hành riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc thẻ beta/sửa lỗi tương ứng) trước khi phê duyệt
- Sau khi phát hành npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/sửa lỗi tương ứng) để xác minh đường dẫn cài đặt registry đã phát hành
  trong một prefix tạm mới
- Sau khi phát hành beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding gói đã cài đặt, thiết lập Telegram, và E2E Telegram thật
  trên gói npm đã phát hành bằng nhóm thông tin xác thực Telegram dùng chung theo lease.
  Các lần chạy một lần cục bộ của maintainer có thể bỏ qua các biến Convex và truyền trực tiếp ba
  thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy toàn bộ smoke beta sau phát hành từ máy maintainer, dùng `pnpm release:beta-smoke -- --beta betaN`. Trình trợ giúp chạy xác thực cập nhật npm Parallels/mục tiêu mới, dispatch `NPM Telegram Beta E2E`, poll đúng lần chạy workflow, tải xuống tạo tác, và in báo cáo Telegram.
- Maintainer có thể chạy cùng kiểm tra sau phát hành từ GitHub Actions qua
  workflow thủ công `NPM Telegram Beta E2E`. Nó cố ý chỉ chạy thủ công và
  không chạy trên mọi lần merge.
- Tự động hóa phát hành của maintainer hiện dùng kiểm tra trước rồi thăng hạng:
  - phát hành npm thật phải vượt qua `preflight_run_id` npm thành công
  - phát hành npm thật phải được dispatch từ cùng nhánh `main` hoặc
    `release/YYYY.M.D` với lần chạy kiểm tra trước thành công
  - các bản phát hành npm ổn định mặc định là `beta`
  - phát hành npm ổn định có thể nhắm rõ `latest` qua input workflow
  - thay đổi npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    vì lý do bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi
    repo công khai giữ phát hành chỉ dùng OIDC
  - `macOS Release` công khai chỉ dùng để xác thực; khi một thẻ chỉ tồn tại trên
    nhánh phát hành nhưng workflow được dispatch từ `main`, đặt
    `public_release_branch=release/YYYY.M.D`
  - phát hành mac riêng tư thật phải vượt qua `preflight_run_id` và
    `validate_run_id` mac riêng tư thành công
  - các đường dẫn phát hành thật thăng hạng tạo tác đã chuẩn bị thay vì build lại
    chúng một lần nữa
- Với các bản phát hành sửa lỗi ổn định như `YYYY.M.D-N`, bộ xác minh sau phát hành
  cũng kiểm tra cùng đường dẫn nâng cấp temp-prefix từ `YYYY.M.D` lên `YYYY.M.D-N`
  để các bản sửa lỗi phát hành không thể âm thầm để các cài đặt global cũ ở
  payload ổn định cơ sở
- Bước kiểm tra trước phát hành npm thất bại đóng trừ khi tarball bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không giao lại một dashboard trình duyệt rỗng
- Xác minh sau phát hành cũng kiểm tra rằng các entrypoint Plugin đã phát hành và
  siêu dữ liệu gói có trong bố cục registry đã cài đặt. Một bản phát hành
  thiếu payload runtime Plugin sẽ thất bại ở bộ xác minh sau phát hành và
  không thể được thăng hạng lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của gói npm trên
  tarball cập nhật ứng viên, để e2e trình cài đặt bắt được việc gói phình to ngoài ý muốn
  trước đường dẫn phát hành
- Nếu công việc phát hành chạm tới lập kế hoạch CI, manifest thời gian extension, hoặc
  ma trận kiểm thử extension, hãy tạo lại và xem xét các đầu ra ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành không
  mô tả một bố cục CI đã lỗi thời
- Trạng thái sẵn sàng phát hành macOS ổn định cũng bao gồm các bề mặt updater:
  - GitHub release phải kết thúc với các gói `.zip`, `.dmg`, và `.dSYM.zip`
  - `appcast.xml` trên `main` phải trỏ tới zip ổn định mới sau khi phát hành
  - ứng dụng đã đóng gói phải giữ bundle id không phải debug, URL feed Sparkle
    không rỗng, và `CFBundleVersion` bằng hoặc cao hơn mức sàn build Sparkle chuẩn
    cho phiên bản phát hành đó

## Hộp kiểm thử phát hành

`Full Release Validation` là cách operator khởi động tất cả kiểm thử tiền phát hành từ
một điểm vào. Để có bằng chứng commit được ghim trên một nhánh thay đổi nhanh, dùng
trình trợ giúp để mọi workflow con chạy từ một nhánh tạm thời cố định tại SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Trình trợ giúp push `release-ci/<sha>-...`, dispatch `Full Release Validation`
từ nhánh đó với `ref=<sha>`, xác minh mọi `headSha` workflow con
khớp với mục tiêu, rồi xóa nhánh tạm thời. Điều này tránh việc vô tình chứng minh một
lần chạy con `main` mới hơn.

Để xác thực nhánh hoặc thẻ phát hành, chạy nó từ workflow ref `main` đáng tin cậy
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

Quy trình phân giải ref đích, kích hoạt thủ công `CI` với
`target_ref=<release-ref>`, kích hoạt `OpenClaw Release Checks`, chuẩn bị một
artifact cha `release-package-under-test` cho các kiểm tra hướng đến package, và
kích hoạt Telegram E2E package độc lập khi `release_profile=full` với
`rerun_group=all` hoặc khi `npm_telegram_package_spec` được đặt. Sau đó
`OpenClaw Release Checks` mở rộng sang install smoke, kiểm tra phát hành đa hệ điều hành, phạm vi live/E2E Docker
trên đường dẫn phát hành khi soak được bật, Package Acceptance với QA package
Telegram, QA Lab parity, Matrix live, và Telegram live. Một lần chạy đầy đủ chỉ được chấp nhận khi
tóm tắt `Full Release Validation`
hiển thị `normal_ci` và `release_checks` thành công. Ở chế độ full/all,
nhánh con `npm_telegram` cũng phải thành công; ngoài full/all, nhánh này được bỏ qua
trừ khi đã cung cấp một `npm_telegram_package_spec` đã phát hành. Tóm tắt
xác minh cuối cùng bao gồm các bảng tác vụ chậm nhất cho từng lần chạy con, để người quản lý phát hành
có thể thấy đường găng hiện tại mà không cần tải nhật ký xuống.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn hoàn chỉnh, tên tác vụ workflow chính xác, khác biệt giữa hồ sơ stable và full,
artifact, và các handle chạy lại tập trung.
Các workflow con được kích hoạt từ ref đáng tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` đích trỏ đến một
nhánh hoặc thẻ phát hành cũ hơn. Không có input workflow-ref riêng cho Full Release Validation;
hãy chọn harness đáng tin cậy bằng cách chọn ref chạy workflow.
Không dùng `--ref main -f ref=<sha>` để chứng minh commit chính xác trên `main` đang di chuyển;
SHA commit thô không thể là ref kích hoạt workflow, vì vậy hãy dùng
`pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn độ phủ live/provider:

- `minimum`: đường dẫn OpenAI/core live và Docker nhanh nhất, trọng yếu cho phát hành
- `stable`: minimum cộng thêm độ phủ provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng thêm độ phủ provider/media tư vấn rộng

Dùng `run_release_soak=true` với `stable` khi các lane chặn phát hành đã
xanh và bạn muốn quét live/E2E đầy đủ, đường dẫn phát hành Docker, và
toàn bộ upgrade-survivor từ 2026.4.23 trở đi trước khi promotion. `full` ngụ ý
`run_release_soak=true`.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref đích
một lần thành `release-package-under-test` và tái sử dụng artifact đó trong các kiểm tra đa hệ điều hành,
Package Acceptance, và Docker đường dẫn phát hành khi soak chạy. Điều này giữ
mọi máy kiểm tra hướng đến package trên cùng một byte và tránh build package lặp lại.
Install smoke OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4`, vì lane này đang
chứng minh cài đặt package, onboarding, khởi động gateway, và một lượt agent live
thay vì benchmark mô hình mặc định chậm nhất. Ma trận provider live rộng hơn
vẫn là nơi dành cho độ phủ theo từng mô hình.

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

Không dùng umbrella đầy đủ làm lần chạy lại đầu tiên sau một bản sửa tập trung. Nếu một máy
thất bại, hãy dùng workflow con, tác vụ, lane Docker, hồ sơ package, provider
mô hình, hoặc lane QA bị lỗi cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi
bản sửa đã thay đổi điều phối phát hành dùng chung hoặc làm bằng chứng toàn bộ máy trước đó
không còn hiện hành. Bộ xác minh cuối cùng của umbrella kiểm tra lại các id lần chạy workflow con
đã ghi lại, vì vậy sau khi một workflow con được chạy lại thành công, chỉ chạy lại tác vụ cha
`Verify full validation` đã thất bại.

Để phục hồi có giới hạn, truyền `rerun_group` cho umbrella. `all` là lần chạy
release-candidate thực sự, `ci` chỉ chạy nhánh con CI bình thường, `plugin-prerelease`
chỉ chạy nhánh con plugin chỉ dành cho phát hành, `release-checks` chạy mọi hộp phát hành,
và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram`.
Các lần chạy lại `npm-telegram` tập trung yêu cầu `npm_telegram_package_spec`; các lần chạy full/all
với `release_profile=full` dùng artifact package của release-checks. Các lần chạy lại
đa hệ điều hành tập trung có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc
bộ lọc OS/suite khác. Lỗi QA release-check là tư vấn; lỗi chỉ ở QA
không chặn xác thực phát hành.

### Vitest

Hộp Vitest là workflow con `CI` thủ công. CI thủ công cố ý
bỏ qua phạm vi changed và buộc đồ thị kiểm thử bình thường cho ứng viên phát hành:
các shard Linux Node, shard bundled-plugin, hợp đồng kênh, tương thích Node 22,
`check`, `check-additional`, build smoke, kiểm tra tài liệu, Python
skills, Windows, macOS, Android, và i18n Control UI.

Dùng hộp này để trả lời "cây mã nguồn có vượt qua bộ kiểm thử bình thường đầy đủ không?"
Nó không giống xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần giữ:

- tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã kích hoạt
- lần chạy `CI` xanh trên SHA đích chính xác
- tên shard lỗi hoặc chậm từ các tác vụ CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi phát hành cần CI bình thường xác định nhưng
không cần các hộp Docker, QA Lab, live, đa hệ điều hành, hoặc package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Hộp Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow
`install-smoke` chế độ phát hành. Nó xác thực ứng viên phát hành thông qua môi trường
Docker đã đóng gói thay vì chỉ kiểm thử ở mức mã nguồn.

Độ phủ Docker phát hành bao gồm:

- install smoke đầy đủ với smoke cài đặt Bun global chậm được bật
- chuẩn bị/tái sử dụng image smoke root Dockerfile theo SHA đích, với các tác vụ smoke QR,
  root/gateway, và installer/Bun chạy như các shard install-smoke riêng
- các lane E2E kho mã
- các chunk Docker đường dẫn phát hành: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, và `plugins-runtime-install-h`
- độ phủ OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài đặt/gỡ cài đặt bundled plugin được tách
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các bộ provider live/E2E và độ phủ mô hình Docker live khi release checks
  bao gồm các bộ live

Dùng artifact Docker trước khi chạy lại. Bộ lập lịch đường dẫn phát hành tải lên
`.artifacts/docker-tests/` với nhật ký lane, `summary.json`, `failures.json`,
thời gian pha, JSON kế hoạch lập lịch, và lệnh chạy lại. Để phục hồi tập trung,
dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì
chạy lại mọi chunk phát hành. Các lệnh chạy lại được tạo bao gồm
`package_artifact_run_id` trước đó và input image Docker đã chuẩn bị khi có, để một
lane thất bại có thể tái sử dụng cùng tarball và image GHCR.

### QA Lab

Hộp QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là
cổng phát hành cho hành vi agentic và cấp kênh, tách biệt với Vitest và cơ chế
package Docker.

Độ phủ QA Lab phát hành bao gồm:

- lane parity mock so sánh lane ứng viên OpenAI với baseline Opus 4.6
  bằng pack parity agentic
- hồ sơ QA Matrix live nhanh bằng môi trường `qa-live-shared`
- lane QA Telegram live bằng lease thông tin xác thực Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng hộp này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA và
luồng kênh live không?" Giữ URL artifact cho các lane parity, Matrix, và Telegram
khi phê duyệt phát hành. Độ phủ Matrix đầy đủ vẫn có sẵn dưới dạng lần chạy QA-Lab
sharded thủ công thay vì lane mặc định trọng yếu cho phát hành.

### Package

Hộp Package là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver chuẩn hóa một
ứng viên thành tarball `package-under-test` được Docker E2E dùng, xác thực
inventory package, ghi lại phiên bản package và SHA-256, và giữ ref harness
workflow tách khỏi ref nguồn package.

Nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw
  chính xác
- `source=ref`: đóng gói một nhánh, thẻ, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` do lần chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, artifact
package phát hành đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance giữ migration, update, dọn dẹp
phụ thuộc plugin cũ, fixture plugin offline, update plugin, và QA package Telegram
trên cùng một tarball đã phân giải. Các kiểm tra phát hành chặn dùng baseline
package đã phát hành mới nhất mặc định; `run_release_soak=true` hoặc
`release_profile=full` mở rộng tới mọi baseline npm-published ổn định từ
`2026.4.23` đến `latest` cộng với fixture issue đã báo cáo. Dùng
Package Acceptance với `source=npm` cho một ứng viên đã shipped, hoặc
`source=ref`/`source=artifact` cho tarball npm cục bộ có SHA hậu thuẫn trước khi
publish. Đây là giải pháp thay thế gốc GitHub cho phần lớn độ phủ package/update
trước đây cần Parallels. Kiểm tra phát hành đa hệ điều hành vẫn quan trọng cho onboarding,
installer, và hành vi nền tảng riêng theo OS, nhưng xác thực sản phẩm package/update nên
ưu tiên Package Acceptance.

Checklist chính tắc cho xác thực update và plugin là
[Kiểm thử update và plugin](/vi/help/testing-updates-plugins). Dùng nó khi
quyết định lane cục bộ, Docker, Package Acceptance, hoặc release-check nào chứng minh một
thay đổi cài đặt/update plugin, dọn dẹp doctor, hoặc migration package đã phát hành.
Migration update đã phát hành đầy đủ từ mọi package `2026.4.23+` ổn định là
workflow `Update Migration` thủ công riêng, không phải một phần của Full Release CI.

Sự nới lỏng package-acceptance legacy được cố ý giới hạn thời gian. Các package đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống metadata đã được publish
lên npm: mục inventory QA private bị thiếu trong tarball, thiếu
`gateway install --wrapper`, thiếu file patch trong fixture git dẫn xuất từ tarball,
thiếu `update.channel` đã persisted, vị trí install-record plugin legacy,
thiếu persistence install-record marketplace, và migration metadata config
trong `plugins update`. Package `2026.4.26` đã publish có thể cảnh báo
về các file stamp metadata build cục bộ đã được shipped. Các package sau đó
phải thỏa mãn hợp đồng package hiện đại; chính các khoảng trống đó sẽ làm xác thực
phát hành thất bại.

Dùng hồ sơ Package Acceptance rộng hơn khi câu hỏi phát hành liên quan đến một
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

Các hồ sơ gói phổ biến:

- `smoke`: các làn cài đặt gói/kênh/tác tử, mạng Gateway và tải lại cấu hình nhanh
- `package`: hợp đồng cài đặt/cập nhật/gói Plugin không có ClawHub trực tiếp; đây là mặc định của kiểm tra phát hành
- `product`: `package` cộng với các kênh MCP, dọn dẹp cron/tác tử phụ, tìm kiếm web OpenAI và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để chứng minh Telegram cho ứng viên gói, hãy bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball
`package-under-test` đã được phân giải vào làn Telegram; workflow Telegram độc lập
vẫn chấp nhận thông số npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành

`OpenClaw Release Publish` là điểm vào phát hành có thay đổi trạng thái thông thường. Nó
điều phối các workflow nhà phát hành tin cậy theo thứ tự mà bản phát hành cần:

1. Checkout thẻ phát hành và phân giải SHA commit của thẻ đó.
2. Xác minh thẻ có thể truy cập được từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Kích hoạt `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Kích hoạt `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Kích hoạt `OpenClaw NPM Release` với thẻ phát hành, dist-tag npm và
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

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa hoặc phát hành lại tập trung. Với một sửa chữa Plugin được chọn, truyền
`plugin_publish_scope=selected` và `plugins=@openclaw/name` cho
`OpenClaw Release Publish`, hoặc kích hoạt trực tiếp workflow con khi không được phát hành
gói OpenClaw.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc, chẳng hạn như `v2026.4.2`, `v2026.4.2-1` hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit đầy đủ
  40 ký tự hiện tại của nhánh workflow cho preflight chỉ xác thực
- `preflight_only`: `true` chỉ để xác thực/build/gói, `false` cho đường dẫn phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để workflow dùng lại
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
  làm bộ điều phối sửa chữa chỉ dành cho Plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `ref`: nhánh, thẻ hoặc SHA commit đầy đủ cần xác thực. Các kiểm tra mang bí mật
  yêu cầu commit đã phân giải phải có thể truy cập được từ một nhánh OpenClaw hoặc
  thẻ phát hành.
- `run_release_soak`: chọn chạy soak đầy đủ live/E2E, đường dẫn phát hành Docker và
  tất cả các kiểm tra upgrade-survivor kể từ trước trên các kiểm tra phát hành ổn định/mặc định. Nó bị buộc
  bật bởi `release_profile=full`.

Quy tắc:

- Thẻ ổn định và thẻ sửa lỗi có thể phát hành lên `beta` hoặc `latest`
- Thẻ prerelease beta chỉ có thể phát hành lên `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn
  chỉ để xác thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh metadata đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi tạo một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi có thẻ, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh workflow
     cho một lần chạy thử chỉ xác thực của workflow preflight
2. Chọn `npm_dist_tag=beta` cho luồng beta trước thông thường, hoặc `latest` chỉ
   khi bạn cố ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành hoặc SHA
   commit đầy đủ khi bạn muốn CI thông thường cộng với phạm vi bao phủ bộ nhớ đệm prompt live,
   Docker, QA Lab, Matrix và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`
   và `preflight_run_id` đã lưu; nó phát hành các Plugin đã externalize lên npm
   và ClawHub trước khi quảng bá gói npm OpenClaw
7. Nếu bản phát hành đã lên `beta`, dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để quảng bá phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý phát hành trực tiếp lên `latest` và `beta`
   cần theo cùng bản build ổn định ngay lập tức, hãy dùng cùng workflow riêng tư đó
   để trỏ cả hai dist-tag tới phiên bản ổn định, hoặc để đồng bộ tự khôi phục theo lịch
   của workflow đó chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật, vì nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ phát hành chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn phát hành trực tiếp và đường dẫn quảng bá beta trước
đều được ghi lại trong tài liệu và hiển thị cho người vận hành.

Nếu một maintainer phải quay về xác thực npm cục bộ, chỉ chạy mọi lệnh CLI 1Password
(`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell tác tử chính; giữ nó bên trong tmux giúp các prompt,
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
