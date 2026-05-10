---
read_when:
    - Đang tìm định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc nghiệm thu gói
    - Tìm thông tin về cách đặt tên phiên bản và nhịp phát hành
summary: Các luồng phát hành, danh sách kiểm tra dành cho người vận hành, các hộp xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-10T19:49:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ac11cfd0b5b1ebcc2fc010463c60e257a7e51802116b4b86d38d3a0da8a1dab
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba kênh phát hành công khai:

- stable: các bản phát hành được gắn tag, phát hành lên npm `beta` theo mặc định, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các tag phát hành trước chính thức được phát hành lên npm `beta`
- dev: phần đầu đang thay đổi của `main`

## Đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Git tag: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.D-N`
  - Git tag: `vYYYY.M.D-N`
- Phiên bản phát hành trước beta: `YYYY.M.D-beta.N`
  - Git tag: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm ổn định hiện tại đã được promote
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành ổn định và bản sửa lỗi ổn định phát hành lên npm `beta` theo mặc định; người vận hành phát hành có thể nhắm tới `latest` rõ ràng, hoặc promote một bản dựng beta đã được thẩm định sau đó
- Mỗi bản phát hành OpenClaw ổn định đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/gói trước, còn
  việc dựng/ký/công chứng ứng dụng mac được dành cho bản ổn định trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Bản ổn định chỉ theo sau sau khi bản beta mới nhất được xác thực
- Maintainer thường cắt bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một tag beta đã được đẩy hoặc phát hành và cần sửa lỗi, maintainer cắt
  tag `-beta.N` tiếp theo thay vì xóa hoặc tạo lại tag beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho maintainer

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
việc ký, công chứng, khôi phục dist-tag và chi tiết rollback khẩn cấp nằm trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: pull bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thực bằng
   `/changelog`, giữ các mục hướng tới người dùng, commit, đẩy, và rebase/pull
   thêm một lần trước khi tạo nhánh.
3. Xem lại các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ gỡ bỏ
   tương thích đã hết hạn khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do nó
   được chủ ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho tag dự kiến, sau đó chạy
   `pnpm release:prep`. Lệnh này làm mới phiên bản plugin, inventory plugin, schema
   cấu hình, metadata cấu hình kênh được đóng gói, baseline tài liệu cấu hình, exports SDK
   plugin và baseline API SDK plugin theo đúng thứ tự. Commit mọi drift được tạo
   trước khi gắn tag. Sau đó chạy preflight cục bộ tất định:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, và `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi tag tồn tại,
   SHA nhánh phát hành đủ 40 ký tự được phép dùng cho preflight chỉ xác thực.
   Lưu `preflight_run_id` thành công.
7. Khởi động tất cả bài kiểm thử trước phát hành bằng `Full Release Validation` cho
   nhánh phát hành, tag, hoặc SHA commit đầy đủ. Đây là entrypoint thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại file, lane, job workflow,
   hồ sơ gói, provider, hoặc allowlist model nhỏ nhất đã thất bại để chứng minh bản sửa.
   Chỉ chạy lại toàn bộ umbrella khi bề mặt thay đổi làm bằng chứng trước đó trở nên lỗi thời.
9. Với beta, gắn tag `vYYYY.M.D-beta.N`, sau đó chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` khớp tương ứng. Lệnh này xác minh `pnpm plugins:sync:check`,
   dispatch tất cả gói plugin có thể phát hành lên npm và cùng tập đó lên
   ClawHub song song, rồi promote artifact preflight npm OpenClaw đã chuẩn bị
   với dist-tag khớp ngay khi publish plugin lên npm thành công.
   Sau khi child publish npm OpenClaw thành công, nó tạo hoặc cập nhật trang
   phát hành/prerelease GitHub tương ứng từ toàn bộ phần
   `CHANGELOG.md` khớp. Các bản phát hành ổn định được phát hành lên npm `latest` trở thành
   bản phát hành GitHub mới nhất; các bản phát hành bảo trì ổn định được giữ trên npm `beta` được
   tạo với GitHub `latest=false`.
   Việc phát hành ClawHub có thể vẫn đang chạy trong khi OpenClaw npm phát hành, nhưng
   workflow phát hành sẽ in ID các child run ngay lập tức. Theo mặc định, nó
   không chờ ClawHub sau khi dispatch, vì vậy khả dụng của OpenClaw npm
   không bị chặn bởi phê duyệt ClawHub hoặc công việc registry chậm hơn; đặt
   `wait_for_clawhub=true` khi ClawHub phải chặn hoàn tất workflow. Đường dẫn
   ClawHub thử lại các lỗi cài đặt dependency CLI tạm thời, phát hành
   các plugin đã qua preview ngay cả khi một ô preview flake, và kết thúc bằng
   xác minh registry cho mọi phiên bản plugin dự kiến để các lần publish một phần
   vẫn hiển thị và có thể thử lại. Sau khi phát hành, chạy
   kiểm tra chấp nhận gói sau phát hành
   với gói `openclaw@YYYY.M.D-beta.N` hoặc
   `openclaw@beta` đã phát hành. Nếu một prerelease đã đẩy hoặc phát hành cần sửa lỗi,
   cắt số prerelease khớp tiếp theo; không xóa hoặc ghi lại prerelease cũ.
10. Với bản ổn định, chỉ tiếp tục sau khi bản beta đã thẩm định hoặc release candidate có
    bằng chứng xác thực bắt buộc. Phát hành npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công qua
    `preflight_run_id`; mức sẵn sàng phát hành macOS ổn định cũng yêu cầu
    các gói `.zip`, `.dmg`, `.dSYM.zip`, và `appcast.xml` đã cập nhật trên `main`.
    Workflow phát hành macOS riêng tư tự động phát hành appcast đã ký lên
    `main` công khai sau khi asset phát hành được xác minh; nếu bảo vệ nhánh chặn
    push trực tiếp, nó mở hoặc cập nhật một PR appcast.
11. Sau khi phát hành, chạy trình xác minh npm sau phát hành, E2E Telegram
    npm đã phát hành độc lập tùy chọn khi bạn cần bằng chứng kênh sau phát hành,
    promote dist-tag khi cần, xác minh trang phát hành GitHub đã tạo,
    và chạy các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước bước kiểm tra trước phát hành để TypeScript của kiểm thử vẫn
  được bao phủ ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước bước kiểm tra trước phát hành để các kiểm tra rộng hơn về
  chu kỳ import và ranh giới kiến trúc đều xanh ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành
  `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực đóng gói
- Chạy `pnpm release:prep` sau khi tăng phiên bản gốc và trước khi gắn thẻ. Lệnh này
  chạy mọi trình tạo phát hành xác định thường bị lệch sau thay đổi về
  phiên bản/cấu hình/API: phiên bản Plugin, kho Plugin, schema cấu hình cơ sở,
  metadata cấu hình kênh đi kèm, baseline tài liệu cấu hình, export SDK Plugin
  và baseline API SDK Plugin. `pnpm release:check` chạy lại các kiểm tra đó
  ở chế độ kiểm tra và báo cáo mọi lỗi lệch sinh ra mà nó tìm thấy trong một
  lượt trước khi chạy kiểm tra phát hành gói.
- Chạy workflow thủ công `Full Release Validation` trước phê duyệt phát hành để
  khởi động tất cả hộp kiểm thử trước phát hành từ một điểm vào. Workflow nhận một nhánh,
  thẻ hoặc SHA commit đầy đủ, dispatch `CI` thủ công, và dispatch
  `OpenClaw Release Checks` cho kiểm thử khói cài đặt, chấp nhận gói, kiểm tra gói
  xuyên OS, đối sánh QA Lab, Matrix và các lane Telegram. Các lần chạy ổn định/mặc định
  giữ phần live/E2E đầy đủ và Docker release-path soak phía sau
  `run_release_soak=true`; `release_profile=full` buộc bật soak. Với
  `release_profile=full` và `rerun_group=all`, nó cũng chạy E2E Telegram của gói
  trên artifact `release-package-under-test` từ release checks.
  Cung cấp `npm_telegram_package_spec` sau khi phát hành khi cùng E2E
  Telegram cũng cần chứng minh gói npm đã phát hành. Cung cấp
  `package_acceptance_package_spec` sau khi phát hành khi Package Acceptance
  nên chạy ma trận gói/cập nhật của nó trên gói npm đã ship thay vì
  artifact được build từ SHA. Cung cấp
  `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng
  xác thực khớp với một gói npm đã phát hành mà không ép chạy Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng kênh phụ
  cho một ứng viên gói trong khi công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref`
  để đóng gói một nhánh/thẻ/SHA `package_ref` tin cậy bằng harness
  `workflow_ref` hiện tại; `source=url` cho tarball HTTPS có SHA-256 bắt buộc;
  hoặc `source=artifact` cho tarball được tải lên bởi một lần chạy GitHub
  Actions khác. Workflow phân giải ứng viên thành
  `package-under-test`, tái dùng bộ lập lịch phát hành Docker E2E trên tarball đó,
  và có thể chạy QA Telegram trên cùng tarball với
  `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các lane
  Docker được chọn bao gồm `published-upgrade-survivor`, artifact gói là ứng viên
  và `published_upgrade_survivor_baseline` chọn baseline đã phát hành.
  `update-restart-auth` dùng gói ứng viên làm cả CLI đã cài đặt và package-under-test
  để kiểm tra đường dẫn khởi động lại được quản lý của lệnh cập nhật ứng viên.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Hồ sơ thường dùng:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway và tải lại cấu hình
  - `package`: các lane gói/cập nhật/khởi động lại/Plugin gốc artifact không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ gói cộng với kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI và OpenWebUI
  - `full`: các phần Docker release-path với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần phạm vi bao phủ CI bình thường đầy đủ
  cho ứng viên phát hành. Các dispatch CI thủ công bỏ qua phạm vi theo thay đổi
  và buộc chạy các shard Linux Node, shard Plugin đi kèm, hợp đồng kênh,
  tương thích Node 22, `check`, `check-additional`, kiểm thử khói build,
  kiểm tra tài liệu, Python skills, Windows, macOS, Android và các lane i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này kiểm tra
  QA-lab qua bộ nhận OTLP/HTTP cục bộ và xác minh tên span trace đã export,
  thuộc tính có giới hạn, và việc biên tập nội dung/định danh mà không
  cần Opik, Langfuse hoặc bộ thu thập bên ngoài khác.
- Chạy `pnpm release:check` trước mọi bản phát hành đã gắn thẻ
- Chạy `OpenClaw Release Publish` cho trình tự phát hành có thay đổi sau khi
  thẻ tồn tại. Dispatch workflow này từ `release/YYYY.M.D` (hoặc `main` khi phát hành một
  thẻ có thể truy cập từ main), truyền thẻ phát hành và `preflight_run_id` npm
  OpenClaw thành công, và giữ phạm vi phát hành Plugin mặc định
  `all-publishable` trừ khi bạn cố ý chạy một sửa chữa tập trung. Workflow tuần tự hóa
  phát hành npm Plugin, phát hành ClawHub Plugin và phát hành npm OpenClaw
  để gói lõi không được phát hành trước các Plugin đã externalize.
- Release checks hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane đối sánh mock QA Lab cộng với hồ sơ
  Matrix live nhanh và lane QA Telegram trước phê duyệt phát hành. Các lane live
  dùng môi trường `qa-live-shared`; Telegram cũng dùng lease credential Convex CI.
  Chạy workflow thủ công `QA-Lab - All Lanes` với
  `matrix_profile=all` và `matrix_shards=true` khi bạn muốn toàn bộ kho Matrix
  transport, media và E2EE chạy song song.
- Xác thực runtime cài đặt và nâng cấp xuyên OS là một phần của
  `OpenClaw Release Checks` và `Full Release Validation` công khai, gọi trực tiếp
  workflow tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ đích: giữ đường dẫn phát hành npm thật ngắn,
  xác định và tập trung vào artifact, trong khi các kiểm tra live chậm hơn ở lane riêng
  để chúng không làm đình trệ hoặc chặn phát hành
- Các release check chứa bí mật nên được dispatch qua `Full Release
Validation` hoặc từ workflow ref `main`/release để logic workflow và
  bí mật vẫn được kiểm soát
- `OpenClaw Release Checks` nhận một nhánh, thẻ hoặc SHA commit đầy đủ miễn là
  commit được phân giải có thể truy cập từ một nhánh OpenClaw hoặc thẻ phát hành
- Kiểm tra trước chỉ-xác-thực của `OpenClaw NPM Release` cũng nhận SHA commit
  nhánh workflow 40 ký tự đầy đủ hiện tại mà không yêu cầu thẻ đã push
- Đường dẫn SHA đó chỉ dành cho xác thực và không thể được nâng cấp thành phát hành thật
- Ở chế độ SHA, workflow tổng hợp `v<package.json version>` chỉ cho kiểm tra
  metadata gói; phát hành thật vẫn yêu cầu thẻ phát hành thật
- Cả hai workflow giữ đường dẫn phát hành và promote thật trên runner
  do GitHub host, trong khi đường dẫn xác thực không thay đổi có thể dùng các runner
  Blacksmith Linux lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Bước kiểm tra trước phát hành npm không còn chờ lane release checks riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc thẻ beta/correction tương ứng) trước phê duyệt
- Sau khi phát hành npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/correction tương ứng) để xác minh đường dẫn cài đặt registry
  đã phát hành trong một prefix tạm mới
- Sau một lần phát hành beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding gói đã cài đặt, thiết lập Telegram và E2E Telegram thật
  trên gói npm đã phát hành bằng pool credential Telegram thuê dùng chung.
  Các lần chạy một lần cục bộ của maintainer có thể bỏ các biến Convex và truyền trực tiếp ba
  credential env `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy toàn bộ kiểm thử khói beta sau phát hành từ máy maintainer, dùng `pnpm release:beta-smoke -- --beta betaN`. Helper chạy xác thực cập nhật npm Parallels/fresh-target, dispatch `NPM Telegram Beta E2E`, thăm dò đúng lần chạy workflow, tải artifact và in báo cáo Telegram.
- Maintainer có thể chạy cùng kiểm tra sau phát hành từ GitHub Actions qua
  workflow thủ công `NPM Telegram Beta E2E`. Workflow này cố ý chỉ thủ công và
  không chạy trên mọi merge.
- Tự động hóa phát hành của maintainer hiện dùng kiểm tra trước rồi promote:
  - phát hành npm thật phải vượt qua một `preflight_run_id` npm thành công
  - phát hành npm thật phải được dispatch từ cùng nhánh `main` hoặc
    `release/YYYY.M.D` với lần chạy kiểm tra trước thành công
  - phát hành npm ổn định mặc định là `beta`
  - phát hành npm ổn định có thể nhắm rõ ràng tới `latest` qua input workflow
  - thay đổi npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    vì lý do bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo
    công khai giữ phát hành chỉ-OIDC
  - `macOS Release` công khai chỉ dùng để xác thực; khi một thẻ chỉ tồn tại trên
    nhánh release nhưng workflow được dispatch từ `main`, đặt
    `public_release_branch=release/YYYY.M.D`
  - phát hành mac riêng tư thật phải vượt qua `preflight_run_id` và `validate_run_id`
    mac riêng tư thành công
  - các đường dẫn phát hành thật promote artifact đã chuẩn bị thay vì build lại
    chúng lần nữa
- Với các bản phát hành sửa lỗi ổn định như `YYYY.M.D-N`, bộ xác minh sau phát hành
  cũng kiểm tra cùng đường dẫn nâng cấp temp-prefix từ `YYYY.M.D` lên `YYYY.M.D-N`
  để các bản sửa phát hành không thể âm thầm để các cài đặt global cũ ở payload
  ổn định cơ sở
- Kiểm tra trước phát hành npm fail đóng trừ khi tarball bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không ship lại dashboard trình duyệt rỗng
- Xác minh sau phát hành cũng kiểm tra rằng entrypoint Plugin đã phát hành và
  metadata gói có mặt trong bố cục registry đã cài đặt. Một bản phát hành
  ship thiếu payload runtime Plugin sẽ làm bộ xác minh postpublish thất bại và
  không thể được promote lên `latest`.
- `pnpm test:install:smoke` cũng áp dụng ngân sách `unpackedSize` của npm pack trên
  tarball cập nhật ứng viên, để e2e trình cài đặt bắt được phình gói ngoài ý muốn
  trước đường dẫn phát hành
- Nếu công việc phát hành chạm tới lập kế hoạch CI, manifest thời gian Plugin, hoặc
  ma trận kiểm thử Plugin, hãy tạo lại và review các output ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước phê duyệt để ghi chú phát hành không
  mô tả bố cục CI đã cũ
- Mức sẵn sàng phát hành macOS ổn định cũng bao gồm các bề mặt cập nhật:
  - bản phát hành GitHub cuối cùng phải có `.zip`, `.dmg` và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ tới zip ổn định mới sau phát hành; workflow
    phát hành macOS riêng tư tự động commit nó, hoặc mở PR appcast
    khi push trực tiếp bị chặn
  - app đã đóng gói phải giữ bundle id không phải debug, URL feed Sparkle không rỗng
    và `CFBundleVersion` bằng hoặc cao hơn sàn build Sparkle chuẩn
    cho phiên bản phát hành đó

## Hộp kiểm thử phát hành

`Full Release Validation` là cách operator khởi động tất cả kiểm thử trước phát hành từ
một điểm vào. Để có bằng chứng commit cố định trên một nhánh thay đổi nhanh, dùng
helper để mọi workflow con chạy từ một nhánh tạm được cố định ở SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Trình trợ giúp đẩy `release-ci/<sha>-...`, kích hoạt `Full Release Validation`
từ nhánh đó với `ref=<sha>`, xác minh mọi workflow con `headSha`
khớp với mục tiêu, rồi xóa nhánh tạm thời. Điều này tránh vô tình chứng minh một
lượt chạy con trên `main` mới hơn.

Để xác thực nhánh phát hành hoặc thẻ, chạy từ workflow `main` đáng tin cậy
ref và truyền nhánh phát hành hoặc thẻ dưới dạng `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow phân giải ref mục tiêu, kích hoạt thủ công `CI` với
`target_ref=<release-ref>`, kích hoạt `OpenClaw Release Checks`, chuẩn bị một
artifact cha `release-package-under-test` cho các kiểm tra hướng gói, và
kích hoạt Telegram E2E gói độc lập khi `release_profile=full` với
`rerun_group=all` hoặc khi `npm_telegram_package_spec` được đặt. Sau đó `OpenClaw Release
Checks` tỏa ra kiểm thử khói cài đặt, kiểm tra phát hành đa hệ điều hành, phạm vi live/E2E Docker
trên đường dẫn phát hành khi bật soak, Package Acceptance với QA gói Telegram,
tương đương QA Lab, Matrix trực tiếp và Telegram trực tiếp. Một lượt chạy đầy đủ chỉ chấp nhận được khi
tóm tắt `Full Release Validation`
hiển thị `normal_ci` và `release_checks` thành công. Ở chế độ full/all,
workflow con `npm_telegram` cũng phải thành công; ngoài full/all, nó bị bỏ qua
trừ khi đã cung cấp một `npm_telegram_package_spec` đã phát hành. Tóm tắt trình
xác minh cuối cùng bao gồm các bảng job chậm nhất cho từng lượt chạy con, để người quản lý phát hành
có thể thấy đường găng hiện tại mà không cần tải nhật ký xuống.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn hoàn chỉnh, tên job workflow chính xác, khác biệt giữa hồ sơ stable và full,
artifact, và các tay cầm chạy lại tập trung.
Các workflow con được kích hoạt từ ref đáng tin cậy đang chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` mục tiêu trỏ tới một
nhánh phát hành hoặc thẻ cũ hơn. Không có input workflow-ref riêng cho Full Release Validation;
hãy chọn bộ harness đáng tin cậy bằng cách chọn ref chạy workflow.
Không dùng `--ref main -f ref=<sha>` để chứng minh commit chính xác trên `main` đang dịch chuyển;
SHA commit thô không thể là ref kích hoạt workflow, vì vậy hãy dùng
`pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn phạm vi live/provider:

- `minimum`: đường dẫn OpenAI/core live và Docker trọng yếu cho phát hành nhanh nhất
- `stable`: minimum cộng thêm phạm vi provider/backend stable để phê duyệt phát hành
- `full`: stable cộng thêm phạm vi provider/media tư vấn rộng

Dùng `run_release_soak=true` với `stable` khi các lane chặn phát hành đã
xanh và bạn muốn lượt quét live/E2E toàn diện, đường dẫn phát hành Docker, và
nâng cấp sống sót đã phát hành có giới hạn trước khi quảng bá. Lượt quét đó bao phủ
bốn gói stable mới nhất cộng với baseline `2026.4.23` và `2026.5.2`
đã ghim cộng thêm phạm vi `2026.4.15` cũ hơn, loại bỏ các baseline trùng lặp và
mỗi baseline được chia shard vào job runner Docker riêng. `full` ngụ ý
`run_release_soak=true`.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref mục tiêu
một lần dưới dạng `release-package-under-test` và tái sử dụng artifact đó trong các kiểm tra đa hệ điều hành,
Package Acceptance, và Docker đường dẫn phát hành khi chạy soak. Điều này giữ
tất cả máy hướng gói trên cùng một byte và tránh build gói lặp lại.
Kiểm thử khói cài đặt OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không dùng `openai/gpt-5.4`, vì lane này đang
chứng minh cài đặt gói, onboarding, khởi động Gateway, và một lượt tác tử live
thay vì benchmark mô hình mặc định chậm nhất. Ma trận provider live rộng hơn
vẫn là nơi dành cho phạm vi theo mô hình cụ thể.

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

Không dùng umbrella đầy đủ làm lượt chạy lại đầu tiên sau một bản sửa tập trung. Nếu một máy
thất bại, hãy dùng workflow con, job, lane Docker, hồ sơ gói, provider mô hình,
hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi
bản sửa đã thay đổi điều phối phát hành dùng chung hoặc làm bằng chứng mọi máy trước đó
trở nên lỗi thời. Trình xác minh cuối cùng của umbrella kiểm tra lại các id lượt chạy workflow con
đã ghi, vì vậy sau khi một workflow con được chạy lại thành công, chỉ chạy lại job cha
`Verify full validation` đã thất bại.

Để phục hồi có giới hạn, truyền `rerun_group` cho umbrella. `all` là lượt chạy
ứng viên phát hành thật, `ci` chỉ chạy workflow con CI bình thường, `plugin-prerelease`
chỉ chạy workflow con Plugin chỉ dành cho phát hành, `release-checks` chạy mọi máy phát hành,
và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram`.
Các lượt chạy lại `npm-telegram` tập trung yêu cầu `npm_telegram_package_spec`; lượt chạy full/all
với `release_profile=full` dùng artifact gói của release-checks. Các lượt chạy lại
đa hệ điều hành tập trung có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc
một bộ lọc OS/suite khác. Các lỗi QA release-check chỉ mang tính tư vấn; lỗi chỉ QA
không chặn xác thực phát hành.

### Vitest

Máy Vitest là workflow con `CI` thủ công. CI thủ công cố ý
bỏ qua phạm vi theo thay đổi và ép đồ thị kiểm thử bình thường cho ứng viên phát hành:
các shard Linux Node, shard Plugin đi kèm, hợp đồng kênh, tương thích Node 22,
`check`, `check-additional`, kiểm thử khói build, kiểm tra docs, Python
skills, Windows, macOS, Android, và i18n Control UI.

Dùng máy này để trả lời "cây mã nguồn có vượt qua bộ kiểm thử bình thường đầy đủ không?"
Nó không giống xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần giữ:

- tóm tắt `Full Release Validation` hiển thị URL lượt chạy `CI` đã kích hoạt
- lượt chạy `CI` xanh trên đúng SHA mục tiêu
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lượt chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI bình thường xác định nhưng
không cần các máy Docker, QA Lab, live, đa hệ điều hành hoặc gói:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Máy Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow
`install-smoke` ở chế độ phát hành. Nó xác thực ứng viên phát hành thông qua
môi trường Docker đã đóng gói thay vì chỉ kiểm thử ở mức mã nguồn.

Phạm vi Docker phát hành bao gồm:

- kiểm thử khói cài đặt đầy đủ với kiểm thử khói cài đặt toàn cục Bun chậm được bật
- chuẩn bị/tái sử dụng ảnh kiểm thử khói Dockerfile gốc theo SHA mục tiêu, với các job kiểm thử khói QR,
  root/gateway, và installer/Bun chạy như các shard install-smoke riêng
- các lane E2E kho lưu trữ
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
- các bộ provider live/E2E và phạm vi mô hình Docker live khi kiểm tra phát hành
  bao gồm các bộ live

Dùng artifact Docker trước khi chạy lại. Bộ lập lịch đường dẫn phát hành tải lên
`.artifacts/docker-tests/` với nhật ký lane, `summary.json`, `failures.json`,
thời gian pha, JSON kế hoạch bộ lập lịch, và lệnh chạy lại. Để phục hồi tập trung,
dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì
chạy lại tất cả chunk phát hành. Các lệnh chạy lại được tạo bao gồm
`package_artifact_run_id` trước đó và input ảnh Docker đã chuẩn bị khi có, để một
lane thất bại có thể tái sử dụng cùng tarball và ảnh GHCR.

### QA Lab

Máy QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành
hành vi tác tử và cấp kênh, tách biệt với cơ chế gói Vitest và Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane tương đương mock so sánh lane ứng viên OpenAI với baseline Opus 4.6
  bằng gói tương đương tác tử
- hồ sơ QA Matrix live nhanh dùng môi trường `qa-live-shared`
- lane QA Telegram live dùng lease thông tin xác thực Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng máy này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA và
luồng kênh live không?" Giữ URL artifact cho các lane tương đương, Matrix và Telegram
khi phê duyệt phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng một lượt chạy
QA-Lab shard thủ công thay vì lane trọng yếu mặc định của phát hành.

### Gói

Máy Gói là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và bộ phân giải
`scripts/resolve-openclaw-package-candidate.mjs`. Bộ phân giải chuẩn hóa một
ứng viên thành tarball `package-under-test` được Docker E2E tiêu thụ, xác thực
kho gói, ghi lại phiên bản gói và SHA-256, và giữ ref harness workflow
tách biệt khỏi ref nguồn gói.

Các nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw
  chính xác
- `source=ref`: đóng gói một nhánh, thẻ, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` được tải lên bởi một lượt chạy GitHub Actions khác

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, artifact gói phát hành
đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance giữ migration, update,
khởi động lại update configured-auth, cài đặt skill ClawHub live, dọn dẹp phụ thuộc Plugin lỗi thời, fixture Plugin ngoại tuyến,
cập nhật Plugin, và QA gói Telegram trên cùng tarball đã phân giải.
Các kiểm tra phát hành chặn dùng baseline gói đã phát hành mới nhất mặc định;
`run_release_soak=true` hoặc
`release_profile=full` mở rộng tới mọi baseline stable đã phát hành npm từ
`2026.4.23` đến `latest` cộng với fixture vấn đề đã báo cáo. Dùng
Package Acceptance với `source=npm` cho một ứng viên đã phát hành, hoặc
`source=ref`/`source=artifact` cho tarball npm cục bộ được hậu thuẫn bởi SHA trước khi
phát hành. Đây là giải pháp thay thế gốc GitHub
cho hầu hết phạm vi gói/update trước đây cần Parallels. Kiểm tra phát hành đa hệ điều hành
vẫn quan trọng cho onboarding, trình cài đặt và hành vi nền tảng đặc thù hệ điều hành,
nhưng xác thực sản phẩm gói/update nên ưu tiên Package Acceptance.

Danh sách kiểm tra chuẩn cho xác thực cập nhật và Plugin là
[Kiểm thử các bản cập nhật và Plugin](/vi/help/testing-updates-plugins). Dùng nó khi
quyết định lane cục bộ, Docker, Package Acceptance hoặc release-check nào chứng minh
một thay đổi cài đặt/cập nhật Plugin, dọn dẹp doctor, hoặc di chuyển gói đã phát hành.
Quy trình di chuyển cập nhật đã phát hành đầy đủ từ mọi gói ổn định `2026.4.23+` là
một workflow `Update Migration` thủ công riêng, không thuộc Full Release CI.

Độ nới lỏng package-acceptance kế thừa được cố ý giới hạn theo thời gian. Các gói đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống metadata đã được phát hành
lên npm: mục QA inventory riêng tư bị thiếu khỏi tarball, thiếu
`gateway install --wrapper`, thiếu tệp patch trong fixture git dẫn xuất từ tarball,
thiếu `update.channel` được lưu bền, vị trí install-record Plugin kế thừa,
thiếu lưu bền install-record marketplace, và di chuyển metadata cấu hình
trong `plugins update`. Gói `2026.4.26` đã phát hành có thể cảnh báo
về các tệp dấu metadata bản dựng cục bộ đã được phát hành. Các gói sau đó
phải thỏa các hợp đồng gói hiện đại; các khoảng trống tương tự sẽ làm hỏng
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

- `smoke`: các lane cài đặt gói/kênh/agent, mạng Gateway và tải lại cấu hình nhanh
- `package`: hợp đồng gói cài đặt/cập nhật/khởi động lại/Plugin cộng với bằng chứng cài đặt Skills ClawHub trực tiếp; đây là mặc định release-check
- `product`: `package` cộng với kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để chứng minh Telegram cho ứng viên gói, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball
`package-under-test` đã phân giải vào lane Telegram; workflow Telegram độc lập
vẫn chấp nhận một spec npm đã phát hành cho kiểm tra sau phát hành.

## Tự động hóa phát hành bản phát hành

`OpenClaw Release Publish` là điểm vào phát hành có thay đổi bình thường. Nó
điều phối các workflow trusted-publisher theo thứ tự bản phát hành cần:

1. Check out thẻ phát hành và phân giải SHA commit của nó.
2. Xác minh thẻ có thể truy tới từ `main` hoặc `release/*`.
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

Phát hành ổn định tới dist-tag beta mặc định:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Quảng bá ổn định trực tiếp tới `latest` là thao tác tường minh:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=latest
```

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa hoặc phát hành lại tập trung. Để sửa một Plugin đã chọn,
truyền `plugin_publish_scope=selected` và `plugins=@openclaw/name` cho
`OpenClaw Release Publish`, hoặc dispatch workflow con trực tiếp khi
gói OpenClaw không được phép phát hành.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do operator kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit
  đầy đủ 40 ký tự hiện tại của nhánh workflow cho preflight chỉ xác thực
- `preflight_only`: `true` chỉ để xác thực/bản dựng/gói, `false` cho
  đường dẫn phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để workflow dùng lại
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: thẻ đích npm cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do operator kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `npm_dist_tag`: thẻ đích npm cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa tập trung
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng
  workflow như bộ điều phối sửa chữa chỉ Plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do operator kiểm soát sau:

- `ref`: nhánh, thẻ hoặc SHA commit đầy đủ cần xác thực. Các kiểm tra mang secret
  yêu cầu commit đã phân giải có thể truy tới từ một nhánh OpenClaw hoặc
  thẻ phát hành.
- `run_release_soak`: chọn chạy soak đầy đủ live/E2E, đường dẫn phát hành Docker và
  upgrade-survivor all-since trên các kiểm tra phát hành ổn định/mặc định. Nó bị buộc
  bật bởi `release_profile=full`.

Quy tắc:

- Thẻ ổn định và thẻ sửa lỗi có thể phát hành tới `beta` hoặc `latest`
- Thẻ prerelease beta chỉ có thể phát hành tới `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ xác thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh metadata đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi cắt một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi thẻ tồn tại, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh workflow
     cho một lần chạy thử chỉ xác thực của workflow preflight
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước bình thường, hoặc chỉ chọn `latest`
   khi bạn cố ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành hoặc SHA commit đầy đủ
   khi bạn muốn CI bình thường cộng với phạm vi bao phủ live prompt cache, Docker, QA Lab,
   Matrix và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử bình thường mang tính xác định, chạy
   workflow `CI` thủ công trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`,
   và `preflight_run_id` đã lưu; nó phát hành các Plugin đã externalize lên npm
   và ClawHub trước khi quảng bá gói npm OpenClaw
7. Nếu bản phát hành được đưa lên `beta`, dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để quảng bá phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý được phát hành trực tiếp lên `latest` và `beta`
   cần theo cùng bản dựng ổn định ngay lập tức, dùng cùng workflow riêng tư đó
   để trỏ cả hai dist-tag tới phiên bản ổn định, hoặc để đồng bộ tự phục hồi
   theo lịch của nó chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật bởi nó vẫn
yêu cầu `NPM_TOKEN`, trong khi repo công khai giữ phát hành chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn phát hành trực tiếp và đường dẫn quảng bá beta-trước
đều được ghi tài liệu và hiển thị với operator.

Nếu maintainer phải quay về xác thực npm cục bộ, chỉ chạy bất kỳ lệnh 1Password
CLI (`op`) nào bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell agent chính; giữ nó trong tmux giúp các prompt,
cảnh báo và xử lý OTP có thể quan sát được và ngăn cảnh báo host lặp lại.

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
