---
read_when:
    - Đang tìm các định nghĩa về kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc nghiệm thu gói
    - Tìm quy ước đặt tên phiên bản và nhịp phát hành
summary: Các kênh phát hành, danh sách kiểm tra cho người vận hành, các ô xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-11T20:35:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4f3aaa53534bb6d1af5e72900a48f52fc89ff8188af7b19ecf75543bfcb1ecb
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba nhánh phát hành công khai:

- ổn định: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ tiền phát hành được phát hành lên npm `beta`
- phát triển: phần đầu đang thay đổi của `main`

## Đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản tiền phát hành beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số không ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm ổn định hiện tại đã được quảng bá
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành ổn định và bản phát hành sửa lỗi ổn định mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm đến `latest` một cách rõ ràng, hoặc quảng bá một bản dựng beta đã được kiểm định sau đó
- Mỗi bản phát hành OpenClaw ổn định đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/gói trước, còn
  bước dựng/ký/công chứng ứng dụng mac được dành cho bản ổn định trừ khi được yêu cầu rõ ràng

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

## Danh sách kiểm tra của người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag và chi tiết rollback khẩn cấp nằm trong
runbook phát hành chỉ dành cho người bảo trì.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thực tế bằng
   `/changelog`, giữ các mục hướng đến người dùng, commit, đẩy, rồi rebase/pull
   thêm một lần nữa trước khi tạo nhánh.
3. Rà soát các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa phần tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do nó được
   cố ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, rồi chạy
   `pnpm release:prep`. Lệnh này làm mới phiên bản Plugin, kho Plugin, lược đồ cấu hình,
   siêu dữ liệu cấu hình kênh đóng gói, baseline tài liệu cấu hình, các export SDK Plugin,
   và baseline API SDK Plugin theo đúng thứ tự. Commit mọi phần lệch được tạo
   trước khi gắn thẻ. Sau đó chạy preflight cục bộ xác định:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, và `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA nhánh phát hành đầy đủ 40 ký tự được phép dùng cho preflight
   chỉ để xác thực. Lưu `preflight_run_id` thành công.
7. Khởi động tất cả kiểm thử tiền phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab, và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, lane, job workflow,
   hồ sơ gói, nhà cung cấp, hoặc allowlist mô hình nhỏ nhất đã thất bại mà
   chứng minh được bản sửa. Chỉ chạy lại toàn bộ umbrella khi bề mặt thay đổi khiến
   bằng chứng trước đó trở nên cũ.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` tương ứng. Lệnh này xác minh `pnpm plugins:sync:check`,
   phân phối tất cả gói Plugin có thể phát hành lên npm và cùng tập đó lên
   ClawHub song song, rồi quảng bá artifact preflight npm OpenClaw đã chuẩn bị
   với dist-tag tương ứng ngay khi phát hành npm của Plugin thành công.
   Sau khi tiến trình con phát hành npm OpenClaw thành công, nó tạo hoặc cập nhật
   trang phát hành/tiền phát hành GitHub tương ứng từ toàn bộ phần
   `CHANGELOG.md` phù hợp. Các bản phát hành ổn định được phát hành lên npm `latest` trở thành
   bản phát hành mới nhất của GitHub; các bản phát hành bảo trì ổn định giữ trên npm `beta` được
   tạo với GitHub `latest=false`.
   Việc phát hành ClawHub vẫn có thể đang chạy trong khi npm OpenClaw phát hành, nhưng
   workflow phát hành in ID các lần chạy con ngay lập tức. Mặc định, nó không chờ
   ClawHub sau khi phân phối, nên tính sẵn có của npm OpenClaw không bị chặn bởi
   phê duyệt ClawHub hoặc công việc registry chậm hơn; đặt
   `wait_for_clawhub=true` khi ClawHub phải chặn việc hoàn tất workflow. Đường dẫn
   ClawHub thử lại các lỗi cài đặt phụ thuộc CLI tạm thời, phát hành
   các Plugin đã qua preview ngay cả khi một ô preview bị flaky, và kết thúc bằng
   xác minh registry cho mọi phiên bản Plugin dự kiến để các lần phát hành một phần
   vẫn hiển thị và có thể thử lại. Sau khi phát hành, chạy
   kiểm tra chấp nhận gói sau phát hành
   đối với gói `openclaw@YYYY.M.D-beta.N` hoặc
   `openclaw@beta` đã phát hành. Nếu một tiền phát hành đã đẩy hoặc đã phát hành cần sửa lỗi,
   cắt số tiền phát hành phù hợp tiếp theo; không xóa hoặc ghi lại
   tiền phát hành cũ.
10. Với bản ổn định, chỉ tiếp tục sau khi beta hoặc ứng viên phát hành đã kiểm định có
    bằng chứng xác thực bắt buộc. Phát hành npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công qua
    `preflight_run_id`; mức sẵn sàng phát hành macOS ổn định cũng yêu cầu các tệp
    `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói, và `appcast.xml` đã cập nhật trên `main`.
    Workflow phát hành macOS riêng tư tự động phát hành appcast đã ký lên `main`
    công khai sau khi tài sản phát hành được xác minh; nếu bảo vệ nhánh chặn
    lệnh đẩy trực tiếp, nó mở hoặc cập nhật một PR appcast.
11. Sau khi phát hành, chạy bộ xác minh npm sau phát hành, E2E Telegram độc lập tùy chọn
    với npm đã phát hành khi bạn cần bằng chứng kênh sau phát hành,
    quảng bá dist-tag khi cần, xác minh trang phát hành GitHub được tạo,
    và chạy các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước bước kiểm tra tiền phát hành để TypeScript của test vẫn
  được bao phủ ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước bước kiểm tra tiền phát hành để các kiểm tra rộng hơn về
  chu trình import và ranh giới kiến trúc đạt trạng thái xanh ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành
  `dist/*` mong đợi và gói Control UI tồn tại cho bước xác thực pack
- Chạy `pnpm release:prep` sau khi tăng phiên bản ở root và trước khi gắn tag. Lệnh này
  chạy mọi trình tạo phát hành xác định thường bị lệch sau thay đổi
  phiên bản/cấu hình/API: phiên bản Plugin, bảng kê Plugin, schema cấu hình cơ sở,
  metadata cấu hình kênh được đóng gói, baseline tài liệu cấu hình, export SDK Plugin,
  và baseline API SDK Plugin. `pnpm release:check` chạy lại các guard đó
  ở chế độ kiểm tra và báo cáo mọi lỗi lệch sinh tự động mà nó tìm thấy trong một
  lượt trước khi chạy các kiểm tra phát hành package.
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi động tất cả test box tiền phát hành từ một điểm vào. Nó chấp nhận một branch,
  tag, hoặc SHA commit đầy đủ, dispatch `CI` thủ công, và dispatch
  `OpenClaw Release Checks` cho kiểm tra smoke cài đặt, chấp nhận package, kiểm tra
  package đa hệ điều hành, đối sánh QA Lab, Matrix, và các lane Telegram. Các lần chạy
  stable/mặc định giữ live/E2E toàn diện và soak đường dẫn phát hành Docker phía sau
  `run_release_soak=true`; `release_profile=full` buộc bật soak. Với
  `release_profile=full` và `rerun_group=all`, nó cũng chạy Telegram E2E package
  với artifact `release-package-under-test` từ release checks.
  Cung cấp `release_package_spec` sau khi phát hành beta để tái sử dụng package npm
  đã phát hành trên release checks, Package Acceptance, và Telegram E2E package
  mà không build lại tarball phát hành. Chỉ cung cấp
  `npm_telegram_package_spec` khi Telegram nên dùng một package đã phát hành khác
  với phần còn lại của xác thực phát hành. Cung cấp
  `package_acceptance_package_spec` khi Package Acceptance nên dùng một package
  đã phát hành khác với spec package phát hành. Cung cấp
  `evidence_package_spec` khi báo cáo bằng chứng riêng tư nên chứng minh rằng xác thực
  khớp với một package npm đã phát hành mà không buộc chạy Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng kênh phụ
  cho một ứng viên package trong lúc công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref`
  để pack một branch/tag/SHA `package_ref` đáng tin cậy với harness
  `workflow_ref` hiện tại; `source=url` cho một tarball HTTPS có SHA-256 bắt buộc;
  hoặc `source=artifact` cho một tarball được tải lên bởi một lần chạy GitHub
  Actions khác. Workflow phân giải ứng viên thành
  `package-under-test`, tái sử dụng bộ lập lịch phát hành Docker E2E với tarball đó,
  và có thể chạy Telegram QA với cùng tarball bằng
  `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các lane Docker
  được chọn bao gồm `published-upgrade-survivor`, artifact package là ứng viên và
  `published_upgrade_survivor_baseline` chọn baseline đã phát hành.
  `update-restart-auth` dùng package ứng viên làm cả CLI đã cài đặt và package-under-test
  để nó kiểm tra đường dẫn restart được quản lý của lệnh update ứng viên.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Các profile thường dùng:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway, và tải lại cấu hình
  - `package`: các lane package/update/restart/Plugin gốc artifact không có OpenWebUI hoặc ClawHub live
  - `product`: profile package cộng thêm kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần phạm vi bao phủ CI bình thường đầy đủ
  cho ứng viên phát hành. Các dispatch CI thủ công bỏ qua phạm vi theo thay đổi
  và buộc chạy các shard Linux Node, shard Plugin được đóng gói, hợp đồng kênh,
  tương thích Node 22, `check`, `check-additional`, build smoke,
  kiểm tra tài liệu, Python skills, Windows, macOS, Android, và các lane i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Nó kiểm tra
  QA-lab qua một receiver OTLP/HTTP cục bộ và xác minh tên span trace đã export,
  thuộc tính có giới hạn, và việc biên tập nội dung/định danh mà không
  cần Opik, Langfuse, hoặc collector bên ngoài khác.
- Chạy `pnpm release:check` trước mọi bản phát hành được gắn tag
- Chạy `OpenClaw Release Publish` cho chuỗi publish có thay đổi sau khi
  tag tồn tại. Dispatch từ `release/YYYY.M.D` (hoặc `main` khi publish một
  tag có thể truy cập từ main), truyền tag phát hành và `preflight_run_id`
  npm OpenClaw thành công, và giữ phạm vi publish Plugin mặc định
  `all-publishable` trừ khi bạn cố ý chạy một sửa chữa tập trung. Workflow
  tuần tự hóa publish npm Plugin, publish ClawHub Plugin, và publish npm OpenClaw
  để package lõi không được publish trước các Plugin đã được tách ra ngoài.
- Release checks hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane đối sánh mock QA Lab cùng với profile
  Matrix live nhanh và lane Telegram QA trước khi phê duyệt phát hành. Các lane live
  dùng môi trường `qa-live-shared`; Telegram cũng dùng các lease thông tin xác thực Convex CI.
  Chạy workflow thủ công `QA-Lab - All Lanes` với
  `matrix_profile=all` và `matrix_shards=true` khi bạn muốn đầy đủ inventory
  transport, media, và E2EE của Matrix chạy song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của
  `OpenClaw Release Checks` công khai và `Full Release Validation`, gọi trực tiếp
  workflow tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ ý: giữ đường dẫn phát hành npm thật ngắn,
  xác định, và tập trung vào artifact, trong khi các kiểm tra live chậm hơn ở lane riêng
  để chúng không làm đình trệ hoặc chặn publish
- Các release checks chứa secret nên được dispatch qua `Full Release
Validation` hoặc từ workflow ref `main`/release để logic workflow và
  secrets vẫn được kiểm soát
- `OpenClaw Release Checks` chấp nhận một branch, tag, hoặc SHA commit đầy đủ miễn là
  commit đã phân giải có thể truy cập từ một branch OpenClaw hoặc tag phát hành
- Kiểm tra tiền phát hành chỉ xác thực `OpenClaw NPM Release` cũng chấp nhận SHA commit
  đầy đủ 40 ký tự hiện tại của branch workflow mà không cần tag đã push
- Đường dẫn SHA đó chỉ dùng cho xác thực và không thể được thăng cấp thành publish thật
- Ở chế độ SHA, workflow chỉ tổng hợp `v<package.json version>` cho
  kiểm tra metadata package; publish thật vẫn cần một tag phát hành thật
- Cả hai workflow giữ đường dẫn publish và thăng cấp thật trên runner do GitHub host,
  trong khi đường dẫn xác thực không thay đổi có thể dùng các runner
  Blacksmith Linux lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả workflow secrets `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Bước kiểm tra tiền phát hành npm không còn chờ lane release checks riêng
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc tag beta/correction tương ứng) trước khi phê duyệt
- Sau khi publish npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/correction tương ứng) để xác minh đường dẫn cài đặt registry
  đã publish trong một prefix tạm mới
- Sau khi publish beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding package đã cài đặt, thiết lập Telegram, và Telegram E2E thật
  với package npm đã publish bằng pool thông tin xác thực Telegram được lease dùng chung.
  Các lần chạy lẻ cục bộ của maintainer có thể bỏ qua các biến Convex và truyền trực tiếp
  ba thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy toàn bộ smoke beta sau publish từ máy maintainer, dùng `pnpm release:beta-smoke -- --beta betaN`. Helper này chạy xác thực cập nhật npm Parallels/mục tiêu mới, dispatch `NPM Telegram Beta E2E`, thăm dò lần chạy workflow chính xác, tải artifact xuống, và in báo cáo Telegram.
- Maintainer có thể chạy cùng kiểm tra sau publish từ GitHub Actions qua
  workflow thủ công `NPM Telegram Beta E2E`. Nó cố ý chỉ chạy thủ công và
  không chạy trên mọi merge.
- Tự động hóa phát hành của maintainer hiện dùng tiền kiểm-tra-rồi-thăng-cấp:
  - publish npm thật phải vượt qua một `preflight_run_id` npm thành công
  - publish npm thật phải được dispatch từ cùng branch `main` hoặc
    `release/YYYY.M.D` như lần chạy tiền kiểm thành công
  - các bản phát hành npm stable mặc định là `beta`
  - publish npm stable có thể nhắm rõ tới `latest` qua input workflow
  - thay đổi dist-tag npm dựa trên token hiện nằm trong
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    vì lý do bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi
    repo công khai chỉ giữ publish OIDC
  - `macOS Release` công khai chỉ dùng để xác thực; khi một tag chỉ tồn tại trên
    branch phát hành nhưng workflow được dispatch từ `main`, đặt
    `public_release_branch=release/YYYY.M.D`
  - publish mac riêng tư thật phải vượt qua `preflight_run_id` và
    `validate_run_id` mac riêng tư thành công
  - các đường dẫn publish thật thăng cấp artifact đã chuẩn bị thay vì build lại
    chúng lần nữa
- Với các bản phát hành sửa lỗi stable như `YYYY.M.D-N`, trình xác minh sau publish
  cũng kiểm tra cùng đường dẫn nâng cấp prefix tạm từ `YYYY.M.D` lên `YYYY.M.D-N`
  để các bản sửa phát hành không thể âm thầm khiến cài đặt global cũ ở lại
  payload stable cơ sở
- Bước kiểm tra tiền phát hành npm đóng lỗi trừ khi tarball bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không phát hành lại một dashboard trình duyệt trống
- Xác minh sau publish cũng kiểm tra rằng entrypoint Plugin đã publish và
  metadata package có mặt trong layout registry đã cài đặt. Một bản phát hành
  thiếu payload runtime Plugin sẽ làm trình xác minh sau publish thất bại và
  không thể được thăng cấp lên `latest`.
- `pnpm test:install:smoke` cũng áp đặt ngân sách `unpackedSize` của npm pack lên
  tarball cập nhật ứng viên, để e2e trình cài đặt bắt được việc pack phình to ngoài ý muốn
  trước đường dẫn publish phát hành
- Nếu công việc phát hành chạm tới lập kế hoạch CI, manifest timing Plugin, hoặc
  ma trận test Plugin, hãy tái tạo và review các output ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để release notes không
  mô tả một layout CI đã cũ
- Mức sẵn sàng phát hành macOS stable cũng bao gồm các bề mặt updater:
  - GitHub release cuối cùng phải có `.zip`, `.dmg`, và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ tới zip stable mới sau publish; workflow
    publish macOS riêng tư tự động commit nó, hoặc mở một PR appcast
    khi push trực tiếp bị chặn
  - app đã đóng gói phải giữ bundle id không phải debug, URL feed Sparkle không rỗng,
    và `CFBundleVersion` bằng hoặc cao hơn mức sàn build Sparkle chuẩn
    cho phiên bản phát hành đó

## Test box phát hành

`Full Release Validation` là cách operator khởi động tất cả test tiền phát hành từ
một điểm vào. Để có bằng chứng commit cố định trên một branch biến động nhanh, dùng
helper để mọi workflow con chạy từ một branch tạm thời cố định ở SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Trình trợ giúp đẩy `release-ci/<sha>-...`, kích hoạt `Full Release Validation`
từ nhánh đó với `ref=<sha>`, xác minh mọi workflow con có `headSha`
khớp với mục tiêu, rồi xóa nhánh tạm thời. Điều này tránh vô tình chứng minh
một lượt chạy con trên `main` mới hơn.

Để xác thực nhánh hoặc thẻ phát hành, hãy chạy từ workflow `main` đáng tin cậy
ref và truyền nhánh hoặc thẻ phát hành làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow phân giải ref mục tiêu, kích hoạt `CI` thủ công với
`target_ref=<release-ref>`, kích hoạt `OpenClaw Release Checks`, chuẩn bị một
artifact cha `release-package-under-test` cho các kiểm tra hướng tới gói, và
kích hoạt package Telegram E2E độc lập khi `release_profile=full` với
`rerun_group=all` hoặc khi `release_package_spec` hay
`npm_telegram_package_spec` được đặt. Sau đó `OpenClaw Release
Checks` phân tán thành install smoke, kiểm tra phát hành đa hệ điều hành, phạm vi
release-path live/E2E Docker khi bật soak, Package Acceptance với Telegram
package QA, QA Lab parity, live Matrix và live Telegram. Một lượt chạy đầy đủ chỉ được chấp nhận khi
tóm tắt `Full Release Validation`
hiển thị `normal_ci` và `release_checks` thành công. Ở chế độ full/all,
workflow con `npm_telegram` cũng phải thành công; ngoài full/all, nó bị bỏ qua
trừ khi đã cung cấp một `release_package_spec` hoặc `npm_telegram_package_spec`
đã phát hành. Tóm tắt
verifier cuối cùng bao gồm các bảng job chậm nhất cho từng lượt chạy con, để
release manager có thể thấy đường găng hiện tại mà không cần tải log xuống.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn hoàn chỉnh, tên job workflow chính xác, khác biệt giữa hồ sơ
stable và full, artifact, và các handle rerun tập trung.
Các workflow con được kích hoạt từ ref đáng tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` mục tiêu trỏ đến một
nhánh hoặc thẻ phát hành cũ hơn. Không có đầu vào workflow-ref riêng cho Full Release Validation;
hãy chọn harness đáng tin cậy bằng cách chọn ref của lượt chạy workflow.
Không dùng `--ref main -f ref=<sha>` để chứng minh commit chính xác trên `main` đang thay đổi;
SHA commit thô không thể là workflow dispatch refs, vì vậy hãy dùng
`pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời được ghim.

Dùng `release_profile` để chọn phạm vi live/provider:

- `minimum`: đường dẫn OpenAI/core live và Docker quan trọng cho phát hành nhanh nhất
- `stable`: minimum cộng thêm phạm vi provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng thêm phạm vi provider/media tư vấn rộng

Dùng `run_release_soak=true` với `stable` khi các lane chặn phát hành đã
xanh và bạn muốn lượt quét live/E2E toàn diện, release-path Docker, và
bounded published upgrade-survivor trước khi thăng cấp. Lượt quét đó bao phủ
bốn gói stable mới nhất cộng với các baseline được ghim `2026.4.23` và `2026.5.2`
cộng thêm phạm vi cũ hơn `2026.4.15`, loại bỏ baseline trùng lặp và
chia từng baseline vào job Docker runner riêng. `full` ngụ ý
`run_release_soak=true`.

`OpenClaw Release Checks` dùng workflow ref đáng tin cậy để phân giải ref mục tiêu
một lần thành `release-package-under-test` và tái sử dụng artifact đó trong các kiểm tra đa hệ điều hành,
Package Acceptance, và release-path Docker khi soak chạy. Điều này giữ
tất cả các box hướng tới gói trên cùng một byte và tránh build gói lặp lại.
Sau khi beta đã có trên npm, đặt `release_package_spec=openclaw@YYYY.M.D-beta.N`
để release checks tải gói đã ship một lần, trích xuất SHA nguồn build
từ `dist/build-info.json`, và tái sử dụng artifact đó cho đa hệ điều hành,
Package Acceptance, release-path Docker, và các lane package Telegram.
OpenAI install smoke đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không dùng `openai/gpt-5.4`, vì lane này đang
chứng minh cài đặt gói, onboarding, khởi động Gateway, và một lượt agent live
thay vì benchmark model mặc định chậm nhất. Ma trận live provider rộng hơn
vẫn là nơi dành cho phạm vi theo từng model.

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
  -f release_package_spec=openclaw@YYYY.M.D-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Không dùng umbrella đầy đủ làm lượt chạy lại đầu tiên sau một bản sửa tập trung. Nếu một box
thất bại, hãy dùng workflow con, job, lane Docker, hồ sơ gói, provider model,
hoặc lane QA bị lỗi cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi
bản sửa đã thay đổi điều phối phát hành dùng chung hoặc làm bằng chứng all-box trước đó
trở nên cũ. Verifier cuối cùng của umbrella kiểm tra lại các id lượt chạy workflow con
đã ghi, vì vậy sau khi một workflow con được chạy lại thành công, chỉ chạy lại job cha
`Verify full validation` bị lỗi.

Để phục hồi có giới hạn, truyền `rerun_group` vào umbrella. `all` là lượt chạy
release-candidate thật, `ci` chỉ chạy workflow con CI thông thường, `plugin-prerelease`
chỉ chạy workflow con plugin chỉ dành cho phát hành, `release-checks` chạy mọi release
box, và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram`.
Các lượt chạy lại `npm-telegram` tập trung yêu cầu `release_package_spec` hoặc
`npm_telegram_package_spec`; các lượt full/all với `release_profile=full` dùng
artifact gói release-checks. Các lượt chạy lại
cross-OS tập trung có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc
một bộ lọc OS/suite khác. Lỗi QA release-check chỉ mang tính tư vấn; lỗi chỉ thuộc QA
không chặn xác thực phát hành.

### Vitest

Box Vitest là workflow con `CI` thủ công. CI thủ công cố ý
bỏ qua phạm vi thay đổi và ép đồ thị kiểm thử thông thường cho release
candidate: các shard Linux Node, shard bundled-plugin, hợp đồng kênh, khả năng tương thích Node 22,
`check`, `check-additional`, build smoke, kiểm tra docs, Python
Skills, Windows, macOS, Android, và Control UI i18n.

Dùng box này để trả lời "cây nguồn có vượt qua bộ kiểm thử thông thường đầy đủ không?"
Nó không giống xác thực sản phẩm theo release-path. Bằng chứng cần giữ:

- tóm tắt `Full Release Validation` hiển thị URL lượt chạy `CI` đã kích hoạt
- lượt chạy `CI` xanh trên SHA mục tiêu chính xác
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lượt chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI thông thường xác định nhưng
không cần Docker, QA Lab, live, đa hệ điều hành, hoặc package box:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Box Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow
`install-smoke` chế độ phát hành. Nó xác thực release candidate qua các
môi trường Docker đã đóng gói thay vì chỉ kiểm thử cấp nguồn.

Phạm vi Docker phát hành bao gồm:

- install smoke đầy đủ với Bun global install smoke chậm được bật
- chuẩn bị/tái sử dụng image smoke Dockerfile gốc theo SHA mục tiêu, với các job QR,
  root/gateway, và installer/Bun smoke chạy như các shard install-smoke riêng
- các lane E2E của repository
- các chunk release-path Docker: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài/gỡ Plugin được tách nhỏ
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các suite provider live/E2E và phạm vi model live Docker khi release checks
  bao gồm các suite live

Dùng artifact Docker trước khi chạy lại. Bộ lập lịch release-path tải lên
`.artifacts/docker-tests/` với log lane, `summary.json`, `failures.json`,
thời gian pha, JSON kế hoạch bộ lập lịch, và các lệnh chạy lại. Để phục hồi tập trung,
dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì
chạy lại mọi chunk phát hành. Các lệnh chạy lại được tạo bao gồm
`package_artifact_run_id` trước đó và đầu vào image Docker đã chuẩn bị khi có, để một
lane lỗi có thể tái sử dụng cùng tarball và image GHCR.

### QA Lab

Box QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành
hành vi agentic và cấp kênh, tách biệt với Vitest và cơ chế package Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane parity mock so sánh lane OpenAI candidate với baseline Opus 4.6
  bằng gói parity agentic
- hồ sơ Matrix QA live nhanh dùng môi trường `qa-live-shared`
- lane Telegram QA live dùng các lease credential Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng box này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA và
luồng kênh live không?" Giữ URL artifact cho các lane parity, Matrix, và Telegram
khi phê duyệt phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng một lượt chạy
QA-Lab thủ công được chia shard thay vì lane mặc định quan trọng cho phát hành.

### Gói

Box Gói là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và bộ phân giải
`scripts/resolve-openclaw-package-candidate.mjs`. Bộ phân giải chuẩn hóa một
candidate thành tarball `package-under-test` được Docker E2E sử dụng, xác thực
inventory gói, ghi lại phiên bản gói và SHA-256, và giữ ref harness workflow
tách biệt với ref nguồn gói.

Các nguồn candidate được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác
- `source=ref`: đóng gói một nhánh, thẻ, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một HTTPS `.tgz` với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` do một lượt chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, artifact
gói phát hành đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance giữ migration, update,
khởi động lại update configured-auth, cài đặt ClawHub skill live, dọn dẹp phụ thuộc Plugin lỗi thời, fixture Plugin offline,
cập nhật Plugin, và Telegram package QA trên cùng tarball đã phân giải.
Release checks chặn dùng baseline gói đã phát hành mới nhất mặc định;
`run_release_soak=true` hoặc
`release_profile=full` mở rộng đến mọi baseline đã phát hành trên npm dạng stable từ
`2026.4.23` đến `latest` cộng với các fixture issue đã báo cáo. Dùng
Package Acceptance với `source=npm` cho candidate đã ship, hoặc
`source=ref`/`source=artifact` cho tarball npm cục bộ có SHA hậu thuẫn trước khi
phát hành. Đây là phương án thay thế GitHub-native
cho phần lớn phạm vi package/update trước đây cần
Parallels. Release checks đa hệ điều hành vẫn quan trọng cho onboarding,
installer, và hành vi nền tảng theo OS, nhưng xác thực sản phẩm package/update nên
ưu tiên Package Acceptance.

Danh sách kiểm chuẩn cho việc xác thực cập nhật và Plugin là
[Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins). Dùng danh sách này khi
quyết định nhánh local, Docker, Package Acceptance hoặc release-check nào chứng minh được một
thay đổi về cài đặt/cập nhật Plugin, dọn dẹp bằng doctor hoặc di chuyển gói đã phát hành.
Quy trình di chuyển cập nhật đã phát hành đầy đủ từ mọi gói ổn định `2026.4.23+` là
một workflow thủ công `Update Migration` riêng, không thuộc Full Release CI.

Sự nới lỏng package-acceptance kế thừa được cố ý giới hạn theo thời gian. Các gói đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống metadata đã được phát hành
lên npm: các mục kiểm kê QA riêng tư bị thiếu trong tarball, thiếu
`gateway install --wrapper`, thiếu các tệp vá trong fixture git sinh từ tarball,
thiếu `update.channel` đã được lưu bền vững, vị trí bản ghi cài đặt Plugin kế thừa,
thiếu lưu bền vững bản ghi cài đặt marketplace, và di chuyển metadata cấu hình trong khi
`plugins update`. Gói `2026.4.26` đã phát hành có thể cảnh báo
về các tệp dấu metadata bản dựng local đã được phát hành trước đó. Các gói về sau
phải đáp ứng hợp đồng gói hiện đại; các khoảng trống tương tự sẽ làm lỗi
quy trình xác thực phát hành.

Dùng các hồ sơ Package Acceptance rộng hơn khi câu hỏi phát hành liên quan đến một
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

Các hồ sơ gói thường dùng:

- `smoke`: các nhánh cài đặt gói/kênh/agent, mạng Gateway và tải lại cấu hình nhanh
- `package`: hợp đồng cài đặt/cập nhật/khởi động lại/gói Plugin cùng bằng chứng cài đặt Skills ClawHub trực tiếp; đây là mặc định của release-check
- `product`: `package` cộng với các kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để có bằng chứng Telegram cho ứng viên gói, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball
`package-under-test` đã phân giải vào nhánh Telegram; workflow Telegram độc lập
vẫn chấp nhận một đặc tả npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành

`OpenClaw Release Publish` là entrypoint phát hành có thay đổi trạng thái thông thường. Nó
điều phối các workflow trusted-publisher theo thứ tự bản phát hành cần:

1. Checkout tag phát hành và phân giải SHA commit của tag.
2. Xác minh tag có thể truy cập từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Dispatch `OpenClaw NPM Release` với tag phát hành, dist-tag npm và
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

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa hoặc phát hành lại tập trung. Với một sửa chữa Plugin được chọn, truyền
`plugin_publish_scope=selected` và `plugins=@openclaw/name` cho
`OpenClaw Release Publish`, hoặc dispatch trực tiếp workflow con khi
gói OpenClaw không được phát hành.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do operator kiểm soát sau:

- `tag`: tag phát hành bắt buộc, chẳng hạn `v2026.4.2`, `v2026.4.2-1` hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit
  đầy đủ 40 ký tự hiện tại của nhánh workflow để preflight chỉ xác thực
- `preflight_only`: `true` để chỉ xác thực/bản dựng/gói, `false` cho đường dẫn
  phát hành thực
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thực để workflow tái sử dụng
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: tag npm đích cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do operator kiểm soát sau:

- `tag`: tag phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `npm_dist_tag`: tag npm đích cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa tập trung
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng workflow
  như một bộ điều phối sửa chữa chỉ dành cho Plugin

`OpenClaw Release Checks` chấp nhận các đầu vào do operator kiểm soát sau:

- `ref`: nhánh, tag hoặc SHA commit đầy đủ cần xác thực. Các kiểm tra mang secret
  yêu cầu commit đã phân giải phải có thể truy cập từ một nhánh OpenClaw hoặc
  tag phát hành.
- `run_release_soak`: chọn tham gia soak đầy đủ gồm live/E2E, đường dẫn phát hành Docker và
  upgrade-survivor all-since trên các kiểm tra phát hành ổn định/mặc định. Nó bị bắt buộc
  bật bởi `release_profile=full`.

Quy tắc:

- Các tag ổn định và tag hiệu chỉnh có thể phát hành lên `beta` hoặc `latest`
- Các tag prerelease beta chỉ có thể phát hành lên `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ để xác thực
- Đường dẫn phát hành thực phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh metadata đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi cắt một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi có tag, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh workflow
     để chạy thử workflow preflight chỉ xác thực
2. Chọn `npm_dist_tag=beta` cho luồng beta-first thông thường, hoặc `latest` chỉ
   khi bạn cố ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, tag phát hành hoặc SHA
   commit đầy đủ khi bạn muốn CI thông thường cộng với phạm vi bao phủ live prompt cache,
   Docker, QA Lab, Matrix và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường mang tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag` và
   `preflight_run_id` đã lưu; nó phát hành các Plugin đã externalize lên npm
   và ClawHub trước khi quảng bá gói npm OpenClaw
7. Nếu bản phát hành đã hạ cánh trên `beta`, dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để quảng bá phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành được cố ý phát hành trực tiếp lên `latest` và `beta`
   cần theo cùng bản dựng ổn định ngay lập tức, dùng cùng workflow riêng tư đó
   để trỏ cả hai dist-tag vào phiên bản ổn định, hoặc để đồng bộ tự phục hồi
   theo lịch của workflow đó chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật, bởi nó vẫn
cần `NPM_TOKEN`, trong khi repo công khai giữ phát hành chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn phát hành trực tiếp và đường dẫn quảng bá beta-first
đều được tài liệu hóa và hiển thị cho operator.

Nếu maintainer phải quay về xác thực npm local, chỉ chạy mọi lệnh CLI 1Password
(`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell agent chính; việc giữ nó trong tmux giúp các lời nhắc,
cảnh báo và xử lý OTP quan sát được và ngăn cảnh báo host lặp lại.

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
