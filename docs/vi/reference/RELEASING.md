---
read_when:
    - Đang tìm định nghĩa về các kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc chấp nhận gói
    - Tìm kiếm quy ước đặt tên phiên bản và nhịp phát hành
    - Lập kế hoạch cho các dòng phát hành hỗ trợ hằng tháng hoặc LTS
summary: Các luồng phát hành, danh sách kiểm tra cho người vận hành, các máy xác thực, cách đặt tên phiên bản, các dòng hỗ trợ hằng tháng đã lên kế hoạch và nhịp độ
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-07T01:53:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbd86faf2aa3eeeb465203431c19c778719f291a2e2732fca1463bde89e42e80
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba luồng phát hành công khai:

- stable: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ tiền phát hành được phát hành lên npm `beta`
- dev: đầu nhánh đang di chuyển của `main`

## Cách đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định kiểu cũ: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản tiền phát hành beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm ổn định hiện tại đã được thăng cấp
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành ổn định và bản sửa lỗi kiểu cũ mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm rõ tới `latest`, hoặc thăng cấp một bản dựng beta đã được kiểm duyệt sau đó
- Mỗi bản phát hành OpenClaw ổn định đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/gói trước, còn
  việc dựng/ký/công chứng ứng dụng Mac được dành cho bản ổn định trừ khi được yêu cầu rõ ràng

### Lập phiên bản hỗ trợ hằng tháng theo kế hoạch

OpenClaw hiện chưa có kênh LTS hoặc hỗ trợ hằng tháng. Các maintainer đang
hướng tới các dòng hỗ trợ hằng tháng tương thích với SemVer, nhưng các kênh cập nhật
đang phát hành hiện nay vẫn là `stable`, `beta`, và `dev`.

Dạng phiên bản theo kế hoạch là `YYYY.M.PATCH`:

- `YYYY` là năm.
- `M` là dòng phát hành theo tháng, không có số 0 ở đầu.
- `PATCH` tăng trong dòng tháng đó và có thể tăng cao đến mức cần thiết.

Ví dụ, `2026.6.0`, `2026.6.1`, và `2026.6.2` đều sẽ thuộc dòng tháng 6
năm 2026. Một dist-tag hỗ trợ hằng tháng trong tương lai như `stable-2026-6` hoặc
`lts-2026-6` có thể trỏ tới dòng đó, trong khi `latest` tiếp tục di chuyển nhanh.

Mô hình tương lai này thay thế nhu cầu tạo các bản phát hành sửa lỗi `YYYY.M.D-N` mới.
Các phiên bản sửa lỗi kiểu cũ hiện có vẫn được nhận diện để các gói cũ và
đường dẫn nâng cấp tiếp tục hoạt động.

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Bản ổn định chỉ theo sau sau khi bản beta mới nhất được xác thực
- Các maintainer thường cắt bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy lên hoặc phát hành và cần sửa lỗi, các maintainer cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho maintainer

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag và chi tiết rollback khẩn cấp nằm trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy lên,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần trên cùng của `CHANGELOG.md` từ lịch sử commit thực với
   `/changelog`, giữ các mục hướng tới người dùng, commit, đẩy lên, và rebase/pull
   thêm một lần trước khi tạo nhánh.
3. Rà soát các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do vì sao nó được
   cố ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không làm công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng phiên bản ở mọi vị trí bắt buộc cho thẻ dự định, chạy
   `pnpm plugins:sync` để các gói Plugin có thể phát hành dùng chung phiên bản phát hành
   và siêu dữ liệu tương thích, sau đó chạy preflight xác định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, `pnpm plugins:sync:check`, và
   `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA đầy đủ 40 ký tự của nhánh phát hành được phép dùng cho preflight
   chỉ để xác thực. Lưu `preflight_run_id` thành công.
7. Khởi động tất cả kiểm thử tiền phát hành với `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là entrypoint thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab, và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, luồng,
   job workflow, hồ sơ gói, provider, hoặc allowlist model nhỏ nhất đã thất bại để
   chứng minh bản sửa. Chỉ chạy lại toàn bộ umbrella khi bề mặt thay đổi khiến
   bằng chứng trước đó không còn mới.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, sau đó chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` khớp. Nó xác minh `pnpm plugins:sync:check`,
   dispatch tất cả gói Plugin có thể phát hành lên npm và cùng tập đó lên
   ClawHub song song, rồi thăng cấp artifact preflight OpenClaw npm đã chuẩn bị
   với dist-tag khớp ngay khi phát hành Plugin npm thành công.
   Việc phát hành ClawHub vẫn có thể đang chạy trong khi OpenClaw npm phát hành, nhưng
   workflow phát hành không kết thúc cho đến khi cả hai đường dẫn phát hành Plugin và
   đường dẫn phát hành OpenClaw npm đều hoàn tất thành công. Sau khi phát hành, chạy
   package acceptance sau phát hành đối với gói `openclaw@YYYY.M.D-beta.N` hoặc
   `openclaw@beta` đã phát hành. Nếu một bản tiền phát hành đã đẩy lên hoặc đã phát hành cần sửa,
   hãy cắt số tiền phát hành khớp tiếp theo; không xóa hoặc ghi lại bản
   tiền phát hành cũ.
10. Với bản ổn định, chỉ tiếp tục sau khi bản beta hoặc release candidate đã được kiểm duyệt có
    bằng chứng xác thực bắt buộc. Việc phát hành npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công qua
    `preflight_run_id`; trạng thái sẵn sàng phát hành macOS ổn định cũng yêu cầu
    các tệp `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói, và `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy trình xác minh sau phát hành npm, E2E Telegram độc lập
    tùy chọn với npm đã phát hành khi bạn cần bằng chứng kênh sau phát hành,
    thăng cấp dist-tag khi cần, ghi chú GitHub release/prerelease từ phần
    `CHANGELOG.md` khớp đầy đủ, và các bước công bố phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước bước tiền kiểm phát hành để TypeScript của kiểm thử vẫn được
  bao phủ bên ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước bước tiền kiểm phát hành để các kiểm tra chu trình import
  và ranh giới kiến trúc rộng hơn đều xanh bên ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các tạo tác phát hành
  `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực đóng gói
- Chạy `pnpm plugins:sync` sau khi tăng phiên bản gốc và trước khi gắn thẻ. Nó
  cập nhật phiên bản gói Plugin có thể phát hành, siêu dữ liệu tương thích
  peer/API của OpenClaw, siêu dữ liệu bản dựng và khung changelog Plugin để khớp với phiên bản
  phát hành lõi. `pnpm plugins:sync:check` là bộ chặn phát hành không làm thay đổi dữ liệu;
  quy trình phát hành sẽ thất bại trước mọi thay đổi registry nếu bước này bị
  quên.
- Chạy quy trình công việc thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi động tất cả hộp kiểm thử tiền phát hành từ một điểm vào. Nó chấp nhận một nhánh,
  thẻ hoặc SHA commit đầy đủ, kích hoạt thủ công `CI`, và kích hoạt
  `OpenClaw Release Checks` cho kiểm tra nhanh cài đặt, chấp nhận gói, kiểm tra gói
  đa hệ điều hành, tương đồng QA Lab, Matrix và các luồng Telegram. Các lần chạy ổn định/mặc định
  giữ E2E/live toàn diện và ngâm đường phát hành Docker phía sau
  `run_release_soak=true`; `release_profile=full` buộc bật ngâm. Với
  `release_profile=full` và `rerun_group=all`, nó cũng chạy E2E Telegram gói
  với tạo tác `release-package-under-test` từ các kiểm tra phát hành.
  Cung cấp `npm_telegram_package_spec` sau khi phát hành khi E2E
  Telegram tương tự cũng cần chứng minh gói npm đã phát hành. Cung cấp
  `package_acceptance_package_spec` sau khi phát hành khi Package Acceptance
  cần chạy ma trận gói/cập nhật của nó với gói npm đã giao thay vì
  tạo tác được dựng từ SHA. Cung cấp
  `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng
  bước xác thực khớp với một gói npm đã phát hành mà không buộc chạy E2E Telegram.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy quy trình công việc thủ công `Package Acceptance` khi bạn muốn có bằng chứng kênh phụ
  cho một ứng viên gói trong lúc công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref`
  để đóng gói một nhánh/thẻ/SHA `package_ref` đáng tin cậy với bộ chạy kiểm thử
  `workflow_ref` hiện tại; `source=url` cho một tarball HTTPS với
  SHA-256 bắt buộc; hoặc `source=artifact` cho tarball do một lần chạy GitHub
  Actions khác tải lên. Quy trình công việc phân giải ứng viên thành
  `package-under-test`, tái sử dụng bộ lập lịch phát hành Docker E2E với tarball đó,
  và có thể chạy QA Telegram với cùng tarball bằng
  `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các luồng Docker
  được chọn bao gồm `published-upgrade-survivor`, tạo tác gói là ứng viên và
  `published_upgrade_survivor_baseline` chọn đường cơ sở đã phát hành.
  `update-restart-auth` dùng gói ứng viên làm cả CLI đã cài đặt và package-under-test
  để nó kiểm tra đường dẫn khởi động lại do lệnh cập nhật ứng viên quản lý.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Các hồ sơ phổ biến:
  - `smoke`: các luồng cài đặt/kênh/tác nhân, mạng Gateway và tải lại cấu hình
  - `package`: các luồng gói/cập nhật/khởi động lại/Plugin gốc theo tạo tác, không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ gói cộng với các kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI và OpenWebUI
  - `full`: các phần đường phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp quy trình công việc thủ công `CI` khi bạn chỉ cần mức bao phủ CI thông thường đầy đủ
  cho ứng viên phát hành. Các lần kích hoạt CI thủ công bỏ qua phạm vi theo thay đổi
  và buộc chạy các mảnh Linux Node, mảnh Plugin đi kèm, hợp đồng kênh,
  khả năng tương thích Node 22, `check`, `check-additional`, kiểm tra nhanh bản dựng,
  kiểm tra tài liệu, Python skills, Windows, macOS, Android và các luồng i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Nó kiểm tra
  QA-lab thông qua một bộ nhận OTLP/HTTP cục bộ và xác minh tên span trace
  đã xuất, thuộc tính có giới hạn, cùng việc biên tập nội dung/định danh mà không
  cần Opik, Langfuse hoặc bộ thu thập bên ngoài khác.
- Chạy `pnpm release:check` trước mọi bản phát hành được gắn thẻ
- Chạy `OpenClaw Release Publish` cho chuỗi phát hành có làm thay đổi dữ liệu sau khi
  thẻ đã tồn tại. Kích hoạt nó từ `release/YYYY.M.D` (hoặc `main` khi phát hành một
  thẻ có thể truy cập từ main), truyền thẻ phát hành và `preflight_run_id` npm
  OpenClaw thành công, và giữ phạm vi phát hành Plugin mặc định
  `all-publishable` trừ khi bạn cố ý chạy một lần sửa chữa tập trung. Quy trình công việc
  tuần tự hóa phát hành npm Plugin, phát hành ClawHub Plugin và phát hành npm OpenClaw
  để gói lõi không được phát hành trước các Plugin đã externalize của nó.
- Kiểm tra phát hành hiện chạy trong một quy trình công việc thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy luồng tương đồng giả lập QA Lab cùng với hồ sơ
  Matrix live nhanh và luồng QA Telegram trước khi phê duyệt phát hành. Các luồng live
  dùng môi trường `qa-live-shared`; Telegram cũng dùng hợp đồng thuê thông tin xác thực Convex CI.
  Chạy quy trình công việc thủ công `QA-Lab - All Lanes` với
  `matrix_profile=all` và `matrix_shards=true` khi bạn muốn kiểm kê đầy đủ
  transport, media và E2EE của Matrix song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của
  `OpenClaw Release Checks` và `Full Release Validation` công khai, gọi trực tiếp
  quy trình công việc có thể tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ đích: giữ đường phát hành npm thực ngắn,
  xác định và tập trung vào tạo tác, trong khi các kiểm tra live chậm hơn nằm trong
  luồng riêng để chúng không làm đình trệ hoặc chặn phát hành
- Các kiểm tra phát hành chứa bí mật nên được kích hoạt qua `Full Release
Validation` hoặc từ workflow ref `main`/release để logic quy trình công việc và
  bí mật luôn được kiểm soát
- `OpenClaw Release Checks` chấp nhận một nhánh, thẻ hoặc SHA commit đầy đủ miễn là
  commit đã phân giải có thể truy cập từ một nhánh OpenClaw hoặc thẻ phát hành
- Bước tiền kiểm chỉ xác thực `OpenClaw NPM Release` cũng chấp nhận SHA commit
  đầy đủ 40 ký tự của nhánh quy trình công việc hiện tại mà không yêu cầu thẻ đã được đẩy
- Đường dẫn SHA đó chỉ dùng để xác thực và không thể được thăng cấp thành phát hành thực
- Ở chế độ SHA, quy trình công việc chỉ tổng hợp `v<package.json version>` cho
  kiểm tra siêu dữ liệu gói; phát hành thực vẫn yêu cầu thẻ phát hành thật
- Cả hai quy trình công việc giữ đường phát hành và thăng cấp thực trên runner
  do GitHub lưu trữ, trong khi đường xác thực không làm thay đổi dữ liệu có thể dùng các runner
  Blacksmith Linux lớn hơn
- Quy trình công việc đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai bí mật quy trình công việc `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Bước tiền kiểm phát hành npm không còn chờ luồng kiểm tra phát hành riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc thẻ beta/sửa lỗi tương ứng) trước khi phê duyệt
- Sau khi phát hành npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/sửa lỗi tương ứng) để xác minh đường cài đặt registry đã phát hành
  trong một tiền tố tạm thời mới
- Sau khi phát hành beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding gói đã cài đặt, thiết lập Telegram và E2E Telegram thực
  với gói npm đã phát hành bằng nhóm thông tin xác thực Telegram thuê chung.
  Các lần chạy một lần cục bộ của maintainer có thể bỏ qua các biến Convex và truyền trực tiếp ba
  thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy toàn bộ kiểm tra nhanh beta sau phát hành từ máy maintainer, dùng `pnpm release:beta-smoke -- --beta betaN`. Trình trợ giúp chạy xác thực cập nhật npm Parallels/mục tiêu mới, kích hoạt `NPM Telegram Beta E2E`, thăm dò lần chạy quy trình công việc chính xác, tải xuống tạo tác và in báo cáo Telegram.
- Maintainer có thể chạy cùng kiểm tra sau phát hành từ GitHub Actions qua
  quy trình công việc thủ công `NPM Telegram Beta E2E`. Nó cố ý chỉ chạy thủ công và
  không chạy trên mọi lần merge.
- Tự động hóa phát hành của maintainer hiện dùng tiền kiểm rồi thăng cấp:
  - phát hành npm thực phải vượt qua `preflight_run_id` npm thành công
  - phát hành npm thực phải được kích hoạt từ cùng nhánh `main` hoặc
    `release/YYYY.M.D` với lần chạy tiền kiểm thành công
  - phát hành npm ổn định mặc định là `beta`
  - phát hành npm ổn định có thể nhắm rõ ràng đến `latest` qua đầu vào quy trình công việc
  - thay đổi npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    vì lý do bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo
    công khai chỉ giữ phát hành OIDC
  - `macOS Release` công khai chỉ dùng để xác thực; khi một thẻ chỉ tồn tại trên một
    nhánh phát hành nhưng quy trình công việc được kích hoạt từ `main`, đặt
    `public_release_branch=release/YYYY.M.D`
  - phát hành mac riêng tư thực phải vượt qua `preflight_run_id` và `validate_run_id`
    mac riêng tư thành công
  - các đường phát hành thực thăng cấp các tạo tác đã chuẩn bị thay vì dựng lại
    chúng lần nữa
- Với các bản phát hành sửa lỗi ổn định cũ như `YYYY.M.D-N`, bộ xác minh sau phát hành
  cũng kiểm tra cùng đường nâng cấp tiền tố tạm từ `YYYY.M.D` lên `YYYY.M.D-N`
  để các bản sửa lỗi phát hành không thể âm thầm khiến cài đặt global cũ ở lại trên
  payload ổn định cơ sở
- Bước tiền kiểm phát hành npm thất bại đóng nếu tarball không bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không giao một dashboard trình duyệt rỗng nữa
- Xác minh sau phát hành cũng kiểm tra rằng entrypoint Plugin đã phát hành và
  siêu dữ liệu gói hiện diện trong bố cục registry đã cài đặt. Một bản phát hành
  thiếu payload runtime Plugin sẽ làm bộ xác minh sau phát hành thất bại và
  không thể được thăng cấp lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của npm pack trên
  tarball cập nhật ứng viên, để e2e trình cài đặt bắt được việc phình gói ngoài ý muốn
  trước đường phát hành
- Nếu công việc phát hành chạm đến lập kế hoạch CI, manifest thời gian Plugin, hoặc
  ma trận kiểm thử Plugin, hãy tạo lại và rà soát các đầu ra ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành không
  mô tả bố cục CI đã cũ
- Mức sẵn sàng phát hành macOS ổn định cũng bao gồm các bề mặt trình cập nhật:
  - bản phát hành GitHub phải kết thúc với các gói `.zip`, `.dmg` và `.dSYM.zip`
  - `appcast.xml` trên `main` phải trỏ đến zip ổn định mới sau khi phát hành
  - ứng dụng đã đóng gói phải giữ bundle id không debug, URL nguồn cấp Sparkle không rỗng
    và `CFBundleVersion` bằng hoặc cao hơn mức sàn bản dựng Sparkle chuẩn
    cho phiên bản phát hành đó

## Hộp kiểm thử phát hành

`Full Release Validation` là cách người vận hành khởi động tất cả kiểm thử tiền phát hành từ
một điểm vào. Để có bằng chứng commit được ghim trên một nhánh di chuyển nhanh, dùng
trình trợ giúp để mọi quy trình công việc con chạy từ một nhánh tạm thời cố định tại
SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Trình trợ giúp đẩy `release-ci/<sha>-...`, kích hoạt `Full Release Validation`
từ nhánh đó với `ref=<sha>`, xác minh mọi `headSha` của quy trình công việc con
khớp với mục tiêu, rồi xóa nhánh tạm thời. Điều này tránh việc vô tình chứng minh một
lần chạy con `main` mới hơn.

Để xác thực nhánh phát hành hoặc thẻ, chạy nó từ workflow ref `main` đáng tin cậy
và truyền nhánh phát hành hoặc thẻ làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow phân giải ref đích, điều phối `CI` thủ công với
`target_ref=<release-ref>`, điều phối `OpenClaw Release Checks`, chuẩn bị một
artifact cha `release-package-under-test` cho các kiểm tra hướng đến package, và
điều phối E2E Telegram package độc lập khi `release_profile=full` với
`rerun_group=all` hoặc khi `npm_telegram_package_spec` được đặt. Sau đó
`OpenClaw Release Checks` phân nhánh sang kiểm tra install smoke, kiểm tra phát
hành đa hệ điều hành, phạm vi live/E2E Docker release-path khi soak được bật,
Package Acceptance với QA Telegram package, QA Lab parity, live Matrix, và live
Telegram. Một lần chạy đầy đủ chỉ được chấp nhận khi phần tóm tắt
`Full Release Validation`
hiển thị `normal_ci` và `release_checks` thành công. Ở chế độ full/all,
child `npm_telegram` cũng phải thành công; ngoài full/all, nó được bỏ qua trừ
khi một `npm_telegram_package_spec` đã phát hành được cung cấp. Phần tóm tắt
verifier cuối cùng bao gồm các bảng job chậm nhất cho từng lần chạy child, để
release manager có thể thấy đường găng hiện tại mà không cần tải log xuống.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn hoàn chỉnh, tên job workflow chính xác, khác biệt giữa profile
stable và full, artifact, và các handle rerun tập trung.
Các workflow child được điều phối từ ref đáng tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` đích trỏ đến một nhánh
hoặc tag phát hành cũ hơn. Không có input workflow-ref riêng cho Full Release
Validation; hãy chọn harness đáng tin cậy bằng cách chọn ref chạy workflow.
Không dùng `--ref main -f ref=<sha>` để chứng minh commit chính xác trên `main`
đang di chuyển; SHA commit thô không thể là ref dispatch workflow, vì vậy hãy
dùng `pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn phạm vi live/provider:

- `minimum`: đường dẫn OpenAI/core live và Docker tối thiểu, nhanh nhất, thiết yếu cho phát hành
- `stable`: minimum cộng với phạm vi provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng với phạm vi provider/media tư vấn rộng

Dùng `run_release_soak=true` với `stable` khi các lane chặn phát hành đã
green và bạn muốn chạy bộ quét live/E2E, Docker release-path, và
published upgrade-survivor có giới hạn đầy đủ trước khi quảng bá. Bộ quét đó bao
phủ bốn stable package mới nhất cộng với các baseline đã ghim `2026.4.23` và
`2026.5.2` cộng với phạm vi `2026.4.15` cũ hơn, loại bỏ baseline trùng lặp và
chia shard từng baseline vào job Docker runner riêng. `full` ngụ ý
`run_release_soak=true`.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref đích
một lần thành `release-package-under-test` và tái sử dụng artifact đó trong các
kiểm tra đa hệ điều hành, Package Acceptance, và Docker release-path khi soak
chạy. Cách này giữ mọi box hướng đến package trên cùng một byte và tránh build
package lặp lại. OpenAI install smoke đa hệ điều hành dùng
`OPENCLAW_CROSS_OS_OPENAI_MODEL` khi biến repo/org được đặt, nếu không thì dùng
`openai/gpt-5.4`, vì lane này chứng minh cài đặt package, onboarding, khởi động
Gateway, và một lượt agent live thay vì benchmark model mặc định chậm nhất. Ma
trận live provider rộng hơn vẫn là nơi dành cho phạm vi theo model cụ thể.

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

Đừng dùng umbrella đầy đủ làm lần rerun đầu tiên sau một bản sửa tập trung. Nếu
một box thất bại, hãy dùng workflow child, job, lane Docker, profile package,
model provider, hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại
umbrella đầy đủ khi bản sửa đã thay đổi điều phối phát hành dùng chung hoặc làm
bằng chứng all-box trước đó hết hiệu lực. Verifier cuối cùng của umbrella kiểm
tra lại các id lần chạy workflow child đã ghi, vì vậy sau khi một workflow child
được rerun thành công, chỉ rerun job cha `Verify full validation` đã thất bại.

Để khôi phục có giới hạn, truyền `rerun_group` cho umbrella. `all` là lần chạy
release-candidate thực, `ci` chỉ chạy child CI bình thường, `plugin-prerelease`
chỉ chạy child Plugin chỉ dành cho phát hành, `release-checks` chạy mọi box phát
hành, và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram`.
Các rerun `npm-telegram` tập trung yêu cầu `npm_telegram_package_spec`; các lần
chạy full/all với `release_profile=full` dùng artifact package của
release-checks. Các rerun đa hệ điều hành tập trung có thể thêm
`cross_os_suite_filter=windows/packaged-upgrade` hoặc một bộ lọc OS/suite khác.
Lỗi QA release-check mang tính tư vấn; lỗi chỉ thuộc QA không chặn xác thực phát
hành.

### Vitest

Box Vitest là workflow child `CI` thủ công. CI thủ công cố ý bỏ qua phạm vi
changed và buộc chạy đồ thị kiểm thử bình thường cho release candidate: shard
Linux Node, shard bundled-plugin, contract kênh, tương thích Node 22, `check`,
`check-additional`, build smoke, kiểm tra tài liệu, Python skills, Windows,
macOS, Android, và Control UI i18n.

Dùng box này để trả lời “cây mã nguồn đã vượt qua bộ kiểm thử bình thường đầy
đủ chưa?” Nó không giống xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng
cần giữ:

- phần tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã điều phối
- lần chạy `CI` green trên SHA đích chính xác
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi phát hành cần CI bình thường xác định nhưng
không cần các box Docker, QA Lab, live, đa hệ điều hành, hoặc package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow
`install-smoke` ở chế độ phát hành. Nó xác thực release candidate thông qua môi
trường Docker đã đóng gói thay vì chỉ các kiểm thử cấp mã nguồn.

Phạm vi Docker phát hành bao gồm:

- install smoke đầy đủ với Bun global install smoke chậm được bật
- chuẩn bị/tái sử dụng image smoke Dockerfile gốc theo SHA đích, với các job QR,
  root/gateway, và installer/Bun smoke chạy dưới dạng shard install-smoke riêng
- các lane E2E của repository
- các chunk Docker release-path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài đặt/gỡ cài đặt bundled plugin đã tách
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các bộ provider live/E2E và phạm vi model live Docker khi release checks
  bao gồm live suite

Dùng artifact Docker trước khi rerun. Bộ lập lịch release-path tải lên
`.artifacts/docker-tests/` với log lane, `summary.json`, `failures.json`,
thời gian từng phase, JSON kế hoạch scheduler, và lệnh rerun. Để khôi phục tập
trung, dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng
thay vì rerun mọi chunk phát hành. Các lệnh rerun được tạo bao gồm
`package_artifact_run_id` trước đó và input image Docker đã chuẩn bị khi có, để
một lane thất bại có thể tái sử dụng cùng tarball và image GHCR.

### QA Lab

Box QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát
hành cho hành vi agentic và cấp kênh, tách biệt với Vitest và cơ chế package
Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane parity mock so sánh lane candidate OpenAI với baseline Opus 4.6 bằng
  agentic parity pack
- profile QA Matrix live nhanh dùng môi trường `qa-live-shared`
- lane QA Telegram live dùng lease thông tin xác thực Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng box này để trả lời “bản phát hành có hoạt động đúng trong các kịch bản QA
và luồng kênh live không?” Giữ URL artifact cho các lane parity, Matrix, và
Telegram khi phê duyệt phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng
lần chạy QA-Lab chia shard thủ công thay vì lane thiết yếu cho phát hành mặc
định.

### Package

Box Package là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver chuẩn hóa một
candidate thành tarball `package-under-test` được Docker E2E tiêu thụ, xác thực
inventory package, ghi lại phiên bản package và SHA-256, và giữ ref harness
workflow tách biệt với ref nguồn package.

Các nguồn candidate được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác
- `source=ref`: đóng gói một nhánh, tag, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một HTTPS `.tgz` với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` được tải lên bởi một lần chạy GitHub Actions khác

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`,
artifact release package đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance giữ migration, update,
khởi động lại update configured-auth, dọn dẹp phụ thuộc Plugin lỗi thời, fixture
Plugin offline, update Plugin, và QA Telegram package trên cùng một tarball đã
phân giải. Các kiểm tra phát hành chặn dùng baseline package đã phát hành mới
nhất theo mặc định; `run_release_soak=true` hoặc
`release_profile=full` mở rộng sang mọi baseline ổn định đã phát hành trên npm
từ `2026.4.23` đến `latest` cộng với fixture issue đã báo cáo. Dùng Package
Acceptance với `source=npm` cho một candidate đã được phát hành, hoặc
`source=ref`/`source=artifact` cho tarball npm cục bộ có SHA hỗ trợ trước khi
publish. Đây là thay thế GitHub-native cho phần lớn phạm vi package/update trước
đây cần Parallels. Các kiểm tra phát hành đa hệ điều hành vẫn quan trọng với
onboarding, installer, và hành vi nền tảng theo OS cụ thể, nhưng xác thực sản
phẩm package/update nên ưu tiên Package Acceptance.

Checklist chuẩn cho xác thực update và Plugin là
[Kiểm thử update và Plugin](/vi/help/testing-updates-plugins). Dùng nó khi quyết
định lane cục bộ, Docker, Package Acceptance, hoặc release-check nào chứng minh
một thay đổi cài đặt/update Plugin, dọn dẹp doctor, hoặc migration package đã
phát hành. Migration update đã phát hành đầy đủ từ mọi package ổn định
`2026.4.23+` là một workflow `Update Migration` thủ công riêng, không phải một
phần của Full Release CI.

Sự nới lỏng package-acceptance cũ được cố ý giới hạn thời gian. Các gói đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các thiếu sót metadata đã được
phát hành lên npm: các mục kiểm kê QA riêng tư bị thiếu khỏi tarball, thiếu
`gateway install --wrapper`, thiếu các tệp patch trong fixture git có nguồn gốc
từ tarball, thiếu `update.channel` được lưu bền vững, các vị trí install-record
Plugin cũ, thiếu khả năng lưu bền vững install-record marketplace, và di chuyển
metadata cấu hình trong `plugins update`. Gói `2026.4.26` đã phát hành có thể
cảnh báo về các tệp dấu metadata bản build cục bộ đã được phát hành. Các gói sau
đó phải đáp ứng các hợp đồng gói hiện đại; những thiếu sót tương tự sẽ làm xác
thực phát hành thất bại.

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

- `smoke`: các lane cài đặt gói/kênh/agent nhanh, mạng Gateway, và tải lại cấu
  hình
- `package`: hợp đồng cài đặt/cập nhật/khởi động lại/gói Plugin không cần
  ClawHub trực tiếp; đây là mặc định của kiểm tra phát hành
- `product`: `package` cộng với các kênh MCP, dọn dẹp cron/subagent, tìm kiếm
  web OpenAI, và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để có bằng chứng Telegram cho package-candidate, bật
`telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier` trên Package
Acceptance. Workflow truyền tarball `package-under-test` đã được phân giải vào
lane Telegram; workflow Telegram độc lập vẫn chấp nhận một spec npm đã phát hành
cho các kiểm tra sau phát hành.

## Tự động hóa phát hành

`OpenClaw Release Publish` là điểm vào phát hành có thay đổi thông thường. Nó
điều phối các workflow trusted-publisher theo thứ tự mà bản phát hành cần:

1. Check out tag phát hành và phân giải SHA commit của tag đó.
2. Xác minh tag có thể truy cập được từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` với cùng scope và SHA.
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

Thăng hạng ổn định trực tiếp lên `latest` là thao tác tường minh:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub
Release` cho công việc sửa chữa hoặc phát hành lại tập trung. Với một sửa chữa
Plugin được chọn, truyền `plugin_publish_scope=selected` và
`plugins=@openclaw/name` vào `OpenClaw Release Publish`, hoặc dispatch workflow
con trực tiếp khi không được phát hành gói OpenClaw.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do operator kiểm soát sau:

- `tag`: tag phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, giá trị này cũng có thể là SHA
  commit workflow-branch đầy đủ 40 ký tự hiện tại cho preflight chỉ xác thực
- `preflight_only`: `true` cho chỉ xác thực/build/package, `false` cho đường dẫn
  phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để workflow tái sử
  dụng tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: tag đích npm cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do operator kiểm soát sau:

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

`OpenClaw Release Checks` chấp nhận các đầu vào do operator kiểm soát sau:

- `ref`: branch, tag, hoặc SHA commit đầy đủ cần xác thực. Các kiểm tra có bí
  mật yêu cầu commit đã phân giải phải có thể truy cập được từ một branch
  OpenClaw hoặc tag phát hành.
- `run_release_soak`: chọn tham gia soak toàn diện gồm live/E2E, đường dẫn phát
  hành Docker, và upgrade-survivor tất cả-từ-trước trên các kiểm tra phát hành
  ổn định/mặc định. Tùy chọn này bị buộc bật bởi `release_profile=full`.

Quy tắc:

- Các tag ổn định và sửa lỗi có thể phát hành lên `beta` hoặc `latest`
- Các tag prerelease beta chỉ có thể phát hành lên `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ dùng để xác
  thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh metadata đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi cắt một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi có tag, bạn có thể dùng SHA commit workflow-branch đầy đủ hiện
     tại để chạy thử khô workflow preflight chỉ xác thực
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc `latest` chỉ
   khi bạn cố ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên branch phát hành, tag phát hành, hoặc SHA
   commit đầy đủ khi bạn muốn CI thông thường cộng với phạm vi bao phủ live
   prompt cache, Docker, QA Lab, Matrix, và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`, và
   `preflight_run_id` đã lưu; workflow này phát hành các Plugin đã externalize
   lên npm và ClawHub trước khi thăng hạng gói npm OpenClaw
7. Nếu bản phát hành đã nằm trên `beta`, dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để thăng hạng phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý được phát hành trực tiếp lên `latest` và `beta` nên
   trỏ theo cùng bản build ổn định ngay lập tức, dùng cùng workflow riêng tư đó
   để trỏ cả hai dist-tag vào phiên bản ổn định, hoặc để đồng bộ tự chữa lành
   theo lịch của workflow đó di chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật do nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ phát hành chỉ dùng OIDC.

Điều đó giúp cả đường dẫn phát hành trực tiếp và đường dẫn thăng hạng beta-trước
đều được ghi tài liệu và hiển thị với operator.

Nếu maintainer phải fallback sang xác thực npm cục bộ, chỉ chạy mọi lệnh CLI
1Password (`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op` trực tiếp
từ shell agent chính; giữ nó bên trong tmux giúp các prompt, cảnh báo, và xử lý
OTP có thể quan sát được, đồng thời ngăn cảnh báo host lặp lại.

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
