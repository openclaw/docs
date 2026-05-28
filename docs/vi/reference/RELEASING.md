---
read_when:
    - Đang tìm định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc kiểm tra chấp nhận gói
    - Tìm thông tin về cách đặt tên phiên bản và nhịp phát hành
summary: Các luồng phát hành, danh sách kiểm tra cho người vận hành, các khung kiểm chứng, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-05-12T08:46:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01fed02c15c4d1950c055f25117fd236942a8858f843022597fe5f56ba2eb724
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba luồng phát hành công khai:

- stable: các bản phát hành được gắn thẻ, mặc định xuất bản lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ phát hành trước xuất bản lên npm `beta`
- dev: đầu nhánh đang thay đổi của `main`

## Đặt tên phiên bản

- Phiên bản phát hành stable: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi stable: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản phát hành trước beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm stable hiện tại đã được quảng bá
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành stable và bản sửa lỗi stable mặc định xuất bản lên npm `beta`; người vận hành phát hành có thể nhắm mục tiêu `latest` rõ ràng, hoặc quảng bá một bản dựng beta đã được kiểm định sau đó
- Mỗi bản phát hành OpenClaw stable phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và xuất bản đường dẫn npm/gói trước, còn
  bước dựng/ký/công chứng ứng dụng Mac được dành cho stable trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Stable chỉ theo sau sau khi bản beta mới nhất được xác thực
- Người bảo trì thường cắt bản phát hành từ một nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc xuất bản và cần sửa, người bảo trì cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho người bảo trì

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag và chi tiết rollback khẩn cấp nằm trong
runbook phát hành chỉ dành cho người bảo trì.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thực bằng
   `/changelog`, giữ các mục hướng tới người dùng, commit, đẩy, rồi rebase/pull
   thêm một lần trước khi tạo nhánh.
3. Xem lại các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích đã hết hạn
   khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do vì sao nó
   được chủ ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không thực hiện công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, rồi chạy
   `pnpm release:prep`. Lệnh này làm mới phiên bản Plugin, kho Plugin, lược đồ cấu hình,
   siêu dữ liệu cấu hình kênh được đóng gói, baseline tài liệu cấu hình,
   export Plugin SDK và baseline API Plugin SDK theo đúng thứ tự. Commit mọi
   drift được tạo trước khi gắn thẻ. Sau đó chạy preflight xác định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, và `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   có thể dùng SHA đầy đủ 40 ký tự của nhánh phát hành cho preflight chỉ để xác thực.
   Lưu `preflight_run_id` thành công.
7. Khởi động tất cả kiểm thử trước phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là entrypoint thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, lane,
   job workflow, hồ sơ gói, nhà cung cấp hoặc allowlist mô hình nhỏ nhất đã thất bại
   để chứng minh bản sửa. Chỉ chạy lại toàn bộ umbrella khi bề mặt đã thay đổi khiến
   bằng chứng trước đó trở nên cũ.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, rồi chạy `OpenClaw Release Publish` từ
   nhánh `release/YYYY.M.D` tương ứng. Quy trình này xác minh `pnpm plugins:sync:check`,
   dispatch tất cả gói Plugin có thể xuất bản lên npm và cùng tập đó lên
   ClawHub song song, rồi quảng bá artifact preflight npm OpenClaw đã chuẩn bị
   với dist-tag tương ứng ngay khi xuất bản npm của Plugin thành công.
   Sau khi child xuất bản npm OpenClaw thành công, nó tạo hoặc cập nhật trang
   phát hành/phát hành trước GitHub tương ứng từ phần `CHANGELOG.md` khớp hoàn chỉnh.
   Các bản phát hành stable được xuất bản lên npm `latest` trở thành bản phát hành
   mới nhất trên GitHub; các bản phát hành bảo trì stable được giữ trên npm `beta`
   được tạo với GitHub `latest=false`.
   Xuất bản ClawHub vẫn có thể đang chạy trong khi npm OpenClaw xuất bản, nhưng
   workflow xuất bản phát hành in ID các lần chạy con ngay lập tức. Mặc định nó
   không chờ ClawHub sau khi dispatch, nên khả năng sẵn có của npm OpenClaw
   không bị chặn bởi phê duyệt ClawHub hoặc công việc registry chậm hơn; đặt
   `wait_for_clawhub=true` khi ClawHub phải chặn hoàn tất workflow. Đường dẫn
   ClawHub thử lại các lỗi cài đặt phụ thuộc CLI tạm thời, xuất bản các Plugin
   vượt qua preview ngay cả khi một ô preview bị lỗi không ổn định, và kết thúc bằng
   xác minh registry cho mọi phiên bản Plugin mong đợi để các lần xuất bản một phần
   vẫn hiển thị và có thể thử lại. Sau khi xuất bản, chạy
   `pnpm release:verify-beta -- YYYY.M.D-beta.N --openclaw-npm-run <run-id> --plugin-npm-run <run-id> --plugin-clawhub-run <run-id>`
   để xác minh bản phát hành trước trên GitHub, dist-tag npm `beta`, tính toàn vẹn npm,
   đường dẫn cài đặt đã xuất bản, phiên bản chính xác trên ClawHub, artifact ClawHub và
   kết luận workflow con từ một lệnh. Thêm `--rerun-failed-clawhub` khi sidecar
   ClawHub chỉ thất bại ở các job có thể thử lại và cần được chạy lại tại chỗ.
   Sau đó chạy kiểm thử chấp nhận gói sau xuất bản với gói
   `openclaw@YYYY.M.D-beta.N` hoặc
   `openclaw@beta` đã xuất bản. Nếu một bản phát hành trước đã được đẩy hoặc xuất bản cần sửa,
   hãy cắt số phát hành trước tương ứng tiếp theo; không xóa hoặc viết lại bản
   phát hành trước cũ.
10. Với stable, chỉ tiếp tục sau khi beta hoặc ứng viên phát hành đã được kiểm định có
    bằng chứng xác thực bắt buộc. Xuất bản npm stable cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công qua
    `preflight_run_id`; mức sẵn sàng phát hành macOS stable cũng yêu cầu
    `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói và `appcast.xml` đã cập nhật trên `main`.
    Workflow xuất bản macOS riêng tư tự động xuất bản appcast đã ký lên `main`
    công khai sau khi asset phát hành được xác minh; nếu bảo vệ nhánh chặn
    push trực tiếp, nó mở hoặc cập nhật một PR appcast.
11. Sau khi xuất bản, chạy trình xác minh sau xuất bản npm, E2E Telegram
    published-npm độc lập tùy chọn khi bạn cần bằng chứng kênh sau xuất bản,
    quảng bá dist-tag khi cần, xác minh trang phát hành GitHub được tạo,
    và chạy các bước thông báo phát hành.

## Preflight phát hành

- Chạy `pnpm check:test-types` trước preflight phát hành để TypeScript của kiểm thử vẫn
  được bao phủ bên ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước preflight phát hành để các kiểm tra chu
  kỳ import rộng hơn và ranh giới kiến trúc đều xanh bên ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact
  phát hành `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực pack
- Chạy `pnpm release:prep` sau khi tăng phiên bản gốc và trước khi gắn thẻ. Lệnh này
  chạy mọi bộ sinh phát hành tất định thường bị lệch sau thay đổi phiên bản/cấu hình/API:
  phiên bản Plugin, kiểm kê Plugin, schema cấu hình cơ sở, siêu dữ liệu cấu hình
  kênh đi kèm, baseline tài liệu cấu hình, export SDK Plugin, và baseline API SDK
  Plugin. `pnpm release:check` chạy lại các bộ bảo vệ đó ở chế độ kiểm tra và báo cáo
  mọi lỗi lệch phát sinh mà nó tìm thấy trong một lượt trước khi chạy kiểm tra phát hành package.
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi động tất cả test box tiền phát hành từ một điểm vào. Workflow này nhận nhánh,
  thẻ, hoặc SHA commit đầy đủ, dispatch `CI` thủ công, và dispatch
  `OpenClaw Release Checks` cho install smoke, package acceptance, kiểm tra package
  đa hệ điều hành, tương đương QA Lab, Matrix, và các lane Telegram. Các lần chạy
  ổn định/mặc định giữ live/E2E đầy đủ và Docker release-path soak phía sau
  `run_release_soak=true`; `release_profile=full` bắt buộc bật soak. Với
  `release_profile=full` và `rerun_group=all`, nó cũng chạy package Telegram
  E2E dựa trên artifact `release-package-under-test` từ release checks.
  Cung cấp `release_package_spec` sau khi phát hành beta để dùng lại package npm đã ship
  trên release checks, Package Acceptance, và package Telegram E2E mà không cần dựng lại
  tarball phát hành. Chỉ cung cấp `npm_telegram_package_spec` khi Telegram cần dùng
  một package đã phát hành khác với phần còn lại của xác thực phát hành. Cung cấp
  `package_acceptance_package_spec` khi Package Acceptance cần dùng một package đã phát hành
  khác với release package spec. Cung cấp `evidence_package_spec` khi báo cáo bằng chứng riêng tư
  cần chứng minh rằng việc xác thực khớp với một package npm đã phát hành mà không ép chạy
  Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng kênh phụ
  cho một ứng viên package trong khi công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref`
  để pack một nhánh/thẻ/SHA `package_ref` đáng tin cậy bằng harness `workflow_ref`
  hiện tại; `source=url` cho một tarball HTTPS với SHA-256 bắt buộc; hoặc
  `source=artifact` cho một tarball được tải lên bởi một lần chạy GitHub
  Actions khác. Workflow phân giải ứng viên thành
  `package-under-test`, dùng lại bộ lập lịch phát hành Docker E2E trên tarball đó,
  và có thể chạy Telegram QA trên cùng tarball với
  `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các lane
  Docker được chọn bao gồm `published-upgrade-survivor`, artifact package là ứng viên và
  `published_upgrade_survivor_baseline` chọn baseline đã phát hành.
  `update-restart-auth` dùng package ứng viên làm cả CLI đã cài đặt và
  package-under-test để nó kiểm thử đường dẫn khởi động lại được quản lý của lệnh cập nhật ứng viên.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Hồ sơ phổ biến:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway, và tải lại cấu hình
  - `package`: các lane package/cập nhật/khởi động lại/Plugin nguyên bản theo artifact, không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ package cộng với các kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các khối release-path Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần phạm vi bao phủ CI bình thường đầy đủ
  cho ứng viên phát hành. Các dispatch CI thủ công bỏ qua phạm vi thay đổi
  và bắt buộc chạy các shard Linux Node, shard Plugin đi kèm, hợp đồng kênh,
  tương thích Node 22, `check`, `check-additional`, build smoke,
  kiểm tra tài liệu, Python Skills, Windows, macOS, Android, và các lane i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này kiểm thử
  QA-lab thông qua một bộ nhận OTLP/HTTP cục bộ và xác minh tên span trace đã export,
  thuộc tính bị giới hạn, và biên tập lại nội dung/định danh mà không cần Opik,
  Langfuse, hoặc bộ thu thập bên ngoài khác.
- Chạy `pnpm release:check` trước mọi bản phát hành được gắn thẻ
- Chạy `OpenClaw Release Publish` cho chuỗi publish có thay đổi sau khi
  thẻ tồn tại. Dispatch nó từ `release/YYYY.M.D` (hoặc `main` khi publish một
  thẻ có thể truy cập từ main), truyền thẻ phát hành và `preflight_run_id`
  OpenClaw npm thành công, và giữ phạm vi publish Plugin mặc định
  `all-publishable` trừ khi bạn cố ý chạy sửa chữa tập trung. Workflow
  tuần tự hóa publish npm Plugin, publish ClawHub Plugin, và publish npm OpenClaw
  để package lõi không được publish trước các Plugin đã externalize của nó.
- Release checks hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane tương đương mock QA Lab cộng với hồ sơ
  Matrix live nhanh và lane Telegram QA trước khi phê duyệt phát hành. Các lane live
  dùng môi trường `qa-live-shared`; Telegram cũng dùng lease thông tin xác thực Convex CI.
  Chạy workflow thủ công `QA-Lab - All Lanes` với
  `matrix_profile=all` và `matrix_shards=true` khi bạn muốn toàn bộ kiểm kê Matrix
  transport, media, và E2EE chạy song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của
  `OpenClaw Release Checks` công khai và `Full Release Validation`, vốn gọi trực tiếp
  workflow tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ đích: giữ đường dẫn phát hành npm thật ngắn,
  tất định, và tập trung vào artifact, trong khi các kiểm tra live chậm hơn ở lane riêng
  để chúng không làm đình trệ hoặc chặn publish
- Các kiểm tra phát hành mang secret nên được dispatch thông qua `Full Release
Validation` hoặc từ workflow ref `main`/release để logic workflow và
  secret vẫn được kiểm soát
- `OpenClaw Release Checks` nhận nhánh, thẻ, hoặc SHA commit đầy đủ miễn là
  commit đã phân giải có thể truy cập từ một nhánh OpenClaw hoặc thẻ phát hành
- Preflight chỉ xác thực `OpenClaw NPM Release` cũng nhận SHA commit đầy đủ
  40 ký tự của nhánh workflow hiện tại mà không yêu cầu thẻ đã push
- Đường dẫn SHA đó chỉ dành cho xác thực và không thể được nâng cấp thành publish thật
- Ở chế độ SHA, workflow tổng hợp `v<package.json version>` chỉ cho
  kiểm tra siêu dữ liệu package; publish thật vẫn yêu cầu thẻ phát hành thật
- Cả hai workflow giữ đường dẫn publish và promotion thật trên runner do GitHub host,
  trong khi đường dẫn xác thực không thay đổi có thể dùng runner Linux Blacksmith lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Preflight phát hành npm không còn chờ lane release checks riêng biệt
- Trước khi gắn thẻ ứng viên phát hành cục bộ, chạy
  `RELEASE_TAG=vYYYY.M.D-beta.N pnpm release:fast-pretag-check`. Helper này
  chạy các guardrail phát hành nhanh, kiểm tra phát hành npm/ClawHub Plugin, build,
  UI build, và `release:openclaw:npm:check` theo thứ tự bắt các lỗi thường chặn
  phê duyệt trước khi workflow publish GitHub bắt đầu.
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc thẻ beta/correction tương ứng) trước khi phê duyệt
- Sau khi publish npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/correction tương ứng) để xác minh đường dẫn cài đặt registry
  đã phát hành trong một prefix tạm mới
- Sau khi publish beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding package đã cài đặt, thiết lập Telegram, và Telegram E2E thật
  dựa trên package npm đã phát hành bằng pool thông tin xác thực Telegram được lease dùng chung.
  Các lần chạy một lần cục bộ của maintainer có thể bỏ qua biến Convex và truyền trực tiếp ba
  thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy post-publish beta smoke đầy đủ từ máy maintainer, dùng `pnpm release:beta-smoke -- --beta betaN`. Helper này chạy xác thực cập nhật npm Parallels/fresh-target, dispatch `NPM Telegram Beta E2E`, thăm dò đúng lần chạy workflow, tải artifact xuống, và in báo cáo Telegram.
- Maintainer có thể chạy cùng kiểm tra post-publish từ GitHub Actions thông qua
  workflow thủ công `NPM Telegram Beta E2E`. Workflow này cố ý chỉ thủ công và
  không chạy trên mọi merge.
- Tự động hóa phát hành của maintainer hiện dùng preflight-rồi-promote:
  - publish npm thật phải vượt qua một npm `preflight_run_id` thành công
  - publish npm thật phải được dispatch từ cùng nhánh `main` hoặc
    `release/YYYY.M.D` với lần chạy preflight thành công
  - phát hành npm ổn định mặc định là `beta`
  - publish npm ổn định có thể nhắm rõ `latest` thông qua input workflow
  - thay đổi npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
    vì lý do bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi
    repo công khai giữ publish chỉ dùng OIDC
  - `macOS Release` công khai chỉ dành cho xác thực; khi một thẻ chỉ tồn tại trên
    nhánh phát hành nhưng workflow được dispatch từ `main`, đặt
    `public_release_branch=release/YYYY.M.D`
  - publish mac riêng tư thật phải vượt qua `preflight_run_id` và
    `validate_run_id` mac riêng tư thành công
  - các đường dẫn publish thật promote artifact đã chuẩn bị thay vì build lại chúng
- Với các bản phát hành sửa lỗi ổn định như `YYYY.M.D-N`, bộ xác minh post-publish
  cũng kiểm tra cùng đường dẫn nâng cấp prefix tạm từ `YYYY.M.D` lên `YYYY.M.D-N`
  để các bản sửa lỗi phát hành không thể âm thầm để các cài đặt global cũ ở
  payload ổn định cơ sở
- Preflight phát hành npm thất bại đóng trừ khi tarball bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không ship dashboard trình duyệt rỗng lần nữa
- Xác minh post-publish cũng kiểm tra rằng các entrypoint Plugin đã phát hành và
  siêu dữ liệu package có trong layout registry đã cài đặt. Một bản phát hành
  ship thiếu payload runtime Plugin sẽ thất bại ở bộ xác minh postpublish và
  không thể được promote lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của npm pack trên
  tarball cập nhật ứng viên, để e2e trình cài đặt bắt được việc pack phình to ngoài ý muốn
  trước đường dẫn publish phát hành
- Nếu công việc phát hành đã chạm vào lập kế hoạch CI, manifest thời gian extension, hoặc
  ma trận kiểm thử extension, hãy sinh lại và rà soát các output ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành
  không mô tả một layout CI cũ
- Mức sẵn sàng phát hành macOS ổn định cũng bao gồm các bề mặt updater:
  - GitHub release cuối cùng phải có `.zip`, `.dmg`, và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ đến zip ổn định mới sau khi publish; workflow
    publish macOS riêng tư tự động commit nó, hoặc mở PR appcast khi push trực tiếp bị chặn
  - app đã đóng gói phải giữ bundle id không debug, URL feed Sparkle không rỗng,
    và `CFBundleVersion` bằng hoặc cao hơn sàn build Sparkle chính tắc
    cho phiên bản phát hành đó

## Các hộp kiểm thử phát hành

`Full Release Validation` là cách người vận hành khởi chạy mọi kiểm thử trước phát hành từ
một điểm vào duy nhất. Để có bằng chứng commit đã ghim trên một nhánh thay đổi nhanh, hãy dùng
trình trợ giúp để mọi workflow con chạy từ một nhánh tạm thời cố định ở SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Trình trợ giúp đẩy `release-ci/<sha>-...`, dispatch `Full Release Validation`
từ nhánh đó với `ref=<sha>`, xác minh mọi workflow con có `headSha`
khớp với mục tiêu, rồi xóa nhánh tạm thời. Điều này tránh vô tình chứng minh một
lần chạy con `main` mới hơn.

Để xác thực nhánh hoặc thẻ phát hành, hãy chạy từ ref workflow `main` đáng tin cậy
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

Workflow phân giải ref mục tiêu, dispatch `CI` thủ công với
`target_ref=<release-ref>`, dispatch `OpenClaw Release Checks`, chuẩn bị artifact
cha `release-package-under-test` cho các kiểm tra hướng tới gói, và dispatch
Telegram E2E gói độc lập khi `release_profile=full` với
`rerun_group=all` hoặc khi `release_package_spec` hoặc
`npm_telegram_package_spec` được đặt. `OpenClaw Release
Checks` sau đó mở rộng sang kiểm tra smoke cài đặt, kiểm tra phát hành đa hệ điều hành, độ phủ
đường dẫn phát hành live/E2E Docker khi bật soak, Package Acceptance với QA gói
Telegram, tính tương đương QA Lab, Matrix live và Telegram live. Một lần chạy đầy đủ chỉ được chấp nhận khi
tóm tắt `Full Release Validation`
hiển thị `normal_ci` và `release_checks` thành công. Ở chế độ full/all,
con `npm_telegram` cũng phải thành công; ngoài full/all, nó bị bỏ qua
trừ khi đã cung cấp `release_package_spec` hoặc `npm_telegram_package_spec`
đã phát hành. Tóm tắt
trình xác minh cuối cùng bao gồm các bảng job chậm nhất cho từng lần chạy con, để người quản lý phát hành
có thể thấy đường tới hạn hiện tại mà không cần tải nhật ký.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn hoàn chỉnh, tên job workflow chính xác, khác biệt giữa hồ sơ stable và full,
artifact và các tay cầm chạy lại tập trung.
Các workflow con được dispatch từ ref đáng tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` mục tiêu trỏ tới một
nhánh hoặc thẻ phát hành cũ hơn. Không có đầu vào workflow-ref riêng cho Full Release Validation;
hãy chọn harness đáng tin cậy bằng cách chọn ref lần chạy workflow.
Không dùng `--ref main -f ref=<sha>` cho bằng chứng commit chính xác trên `main` đang thay đổi;
SHA commit thô không thể là ref workflow dispatch, vì vậy hãy dùng
`pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn độ rộng live/provider:

- `minimum`: đường dẫn OpenAI/core live và Docker quan trọng cho phát hành nhanh nhất
- `stable`: minimum cộng thêm độ phủ provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng thêm độ phủ provider/media tư vấn rộng

Dùng `run_release_soak=true` với `stable` khi các làn chặn phát hành đã
xanh và bạn muốn quét sống sót nâng cấp đã phát hành có giới hạn, đường dẫn phát hành Docker,
live/E2E toàn diện trước khi thăng cấp. Quét đó bao phủ
bốn gói stable mới nhất cộng các baseline `2026.4.23` và `2026.5.2`
đã ghim cộng độ phủ `2026.4.15` cũ hơn, với các baseline trùng lặp bị loại bỏ và
mỗi baseline được shard vào job runner Docker riêng. `full` ngụ ý
`run_release_soak=true`.

`OpenClaw Release Checks` dùng ref workflow đáng tin cậy để phân giải ref mục tiêu
một lần dưới dạng `release-package-under-test` và tái sử dụng artifact đó trong các kiểm tra đa hệ điều hành,
Package Acceptance và Docker đường dẫn phát hành khi soak chạy. Điều này giữ
mọi hộp hướng tới gói trên cùng một byte và tránh xây dựng gói lặp lại.
Sau khi beta đã có trên npm, đặt `release_package_spec=openclaw@YYYY.M.D-beta.N`
để các kiểm tra phát hành tải gói đã phát hành một lần, trích xuất SHA nguồn bản dựng của nó
từ `dist/build-info.json`, và tái sử dụng artifact đó cho các làn đa hệ điều hành,
Package Acceptance, Docker đường dẫn phát hành và Telegram gói.
Kiểm tra smoke cài đặt OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4`, vì làn này
chứng minh việc cài đặt gói, onboarding, khởi động Gateway và một lượt agent live
thay vì benchmark model mặc định chậm nhất. Ma trận provider live rộng hơn
vẫn là nơi dành cho độ phủ riêng theo model.

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

Không dùng ô dù đầy đủ làm lần chạy lại đầu tiên sau một bản sửa tập trung. Nếu một hộp
thất bại, hãy dùng workflow con, job, làn Docker, hồ sơ gói, provider model,
hoặc làn QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại ô dù đầy đủ khi
bản sửa đã thay đổi điều phối phát hành dùng chung hoặc làm bằng chứng toàn hộp trước đó
trở nên lỗi thời. Trình xác minh cuối cùng của ô dù kiểm tra lại các id lần chạy workflow con
đã ghi, vì vậy sau khi một workflow con được chạy lại thành công, chỉ chạy lại job cha
`Verify full validation` đã thất bại.

Để phục hồi có giới hạn, truyền `rerun_group` cho ô dù. `all` là lần chạy
ứng viên phát hành thật, `ci` chỉ chạy con CI bình thường, `plugin-prerelease`
chỉ chạy con Plugin chỉ dành cho phát hành, `release-checks` chạy mọi hộp phát hành,
và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram`.
Các lần chạy lại `npm-telegram` tập trung yêu cầu `release_package_spec` hoặc
`npm_telegram_package_spec`; các lần chạy full/all với `release_profile=full` dùng
artifact gói của release-checks. Các lần chạy lại
đa hệ điều hành tập trung có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc
bộ lọc OS/suite khác. Lỗi release-check QA mang tính tư vấn; lỗi chỉ QA
không chặn xác thực phát hành.

### Vitest

Hộp Vitest là workflow con `CI` thủ công. CI thủ công cố ý
bỏ qua phạm vi thay đổi và ép đồ thị kiểm thử bình thường cho ứng viên phát hành:
các shard Linux Node, shard Plugin đóng gói, hợp đồng kênh, khả năng tương thích Node 22,
`check`, `check-additional`, smoke bản dựng, kiểm tra tài liệu, Skills Python,
Windows, macOS, Android và i18n Control UI.

Dùng hộp này để trả lời "cây nguồn đã vượt qua bộ kiểm thử bình thường đầy đủ chưa?"
Nó không giống xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần giữ:

- tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã dispatch
- lần chạy `CI` xanh trên SHA mục tiêu chính xác
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI bình thường xác định nhưng
không cần các hộp Docker, QA Lab, live, đa hệ điều hành hoặc gói:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Hộp Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow
`install-smoke` ở chế độ phát hành. Nó xác thực ứng viên phát hành qua các
môi trường Docker đã đóng gói thay vì chỉ các kiểm thử ở mức nguồn.

Độ phủ Docker phát hành bao gồm:

- kiểm tra smoke cài đặt đầy đủ với smoke cài đặt toàn cục Bun chậm được bật
- chuẩn bị/tái sử dụng ảnh smoke Dockerfile gốc theo SHA mục tiêu, với các job smoke QR,
  root/gateway, và installer/Bun chạy dưới dạng các shard install-smoke riêng
- các làn E2E kho lưu trữ
- các chunk Docker đường dẫn phát hành: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, và `plugins-runtime-install-h`
- độ phủ OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các làn cài đặt/gỡ cài đặt Plugin đóng gói đã tách
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các bộ provider live/E2E và độ phủ model live Docker khi release checks
  bao gồm các bộ live

Dùng artifact Docker trước khi chạy lại. Bộ lập lịch đường dẫn phát hành tải lên
`.artifacts/docker-tests/` với nhật ký làn, `summary.json`, `failures.json`,
thời gian pha, JSON kế hoạch bộ lập lịch và lệnh chạy lại. Để phục hồi tập trung,
dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E có thể tái sử dụng thay vì
chạy lại toàn bộ chunk phát hành. Các lệnh chạy lại được tạo bao gồm
`package_artifact_run_id` trước đó và đầu vào ảnh Docker đã chuẩn bị khi có sẵn, để
một làn thất bại có thể tái sử dụng cùng tarball và ảnh GHCR.

### QA Lab

Hộp QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành
hành vi agentic và cấp kênh, tách biệt với Vitest và cơ chế gói Docker.

Độ phủ QA Lab phát hành bao gồm:

- làn tương đương mock so sánh làn ứng viên OpenAI với baseline Opus 4.6
  bằng gói tương đương agentic
- hồ sơ QA Matrix live nhanh dùng môi trường `qa-live-shared`
- làn QA Telegram live dùng các lease thông tin xác thực Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng hộp này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA và
luồng kênh live không?" Giữ URL artifact cho các làn parity, Matrix và Telegram
khi phê duyệt bản phát hành. Độ phủ Matrix đầy đủ vẫn có sẵn dưới dạng
một lần chạy QA-Lab shard thủ công thay vì làn quan trọng cho phát hành mặc định.

### Gói

Hộp Package là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và trình phân giải
`scripts/resolve-openclaw-package-candidate.mjs`. Trình phân giải chuẩn hóa một
ứng viên thành tarball `package-under-test` được Docker E2E dùng, xác thực
inventory gói, ghi lại phiên bản gói và SHA-256, đồng thời giữ ref harness workflow
tách biệt với ref nguồn gói.

Các nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw
  chính xác
- `source=ref`: đóng gói nhánh, thẻ hoặc SHA commit đầy đủ `package_ref` đáng tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng `.tgz` được tải lên bởi một lần chạy GitHub Actions khác

`OpenClaw Release Checks` chạy Chấp nhận gói với `source=artifact`, artifact gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`, `telegram_mode=mock-openai`. Chấp nhận gói giữ QA di trú, cập nhật, khởi động lại cập nhật auth đã cấu hình, cài đặt Skills ClawHub trực tiếp, dọn dẹp phụ thuộc Plugin cũ, fixture Plugin offline, cập nhật Plugin và gói Telegram dựa trên cùng tarball đã phân giải. Các kiểm tra phát hành chặn sử dụng baseline gói đã phát hành mới nhất mặc định; `run_release_soak=true` hoặc `release_profile=full` mở rộng sang mọi baseline ổn định đã phát hành trên npm từ `2026.4.23` đến `latest` cộng với fixture của các sự cố đã báo cáo. Dùng Chấp nhận gói với `source=npm` cho ứng viên đã phát hành, hoặc `source=ref`/`source=artifact` cho tarball npm cục bộ được hậu thuẫn bằng SHA trước khi phát hành. Đây là giải pháp thay thế nguyên sinh GitHub cho phần lớn phạm vi kiểm thử gói/cập nhật trước đây cần Parallels. Kiểm tra phát hành đa hệ điều hành vẫn quan trọng cho hành vi onboarding, trình cài đặt và nền tảng riêng theo hệ điều hành, nhưng xác thực sản phẩm gói/cập nhật nên ưu tiên Chấp nhận gói.

Checklist chuẩn cho xác thực cập nhật và Plugin là [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins). Dùng checklist này khi quyết định lane cục bộ, Docker, Chấp nhận gói hoặc kiểm tra phát hành nào chứng minh thay đổi cài đặt/cập nhật Plugin, dọn dẹp bằng doctor hoặc di trú gói đã phát hành. Di trú cập nhật đã phát hành toàn diện từ mọi gói ổn định `2026.4.23+` là workflow thủ công `Update Migration` riêng, không phải một phần của CI phát hành đầy đủ.

Độ khoan dung kế thừa của package-acceptance được giới hạn thời gian có chủ ý. Các gói đến `2026.4.25` có thể dùng đường dẫn tương thích cho những thiếu sót metadata đã phát hành lên npm: mục kiểm kê QA riêng tư bị thiếu khỏi tarball, thiếu `gateway install --wrapper`, thiếu file patch trong fixture git dẫn xuất từ tarball, thiếu `update.channel` đã lưu, vị trí bản ghi cài đặt Plugin kế thừa, thiếu lưu bản ghi cài đặt marketplace và di trú metadata cấu hình trong `plugins update`. Gói `2026.4.26` đã phát hành có thể cảnh báo về các file dấu metadata bản dựng cục bộ đã được phát hành. Các gói sau đó phải đáp ứng hợp đồng gói hiện đại; các thiếu sót tương tự sẽ làm xác thực phát hành thất bại.

Dùng các hồ sơ Chấp nhận gói rộng hơn khi câu hỏi phát hành liên quan đến một gói thật sự có thể cài đặt:

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

- `smoke`: các lane cài đặt gói/channel/agent, mạng Gateway và tải lại cấu hình nhanh
- `package`: hợp đồng cài đặt/cập nhật/khởi động lại/gói Plugin cộng với bằng chứng cài đặt Skills ClawHub trực tiếp; đây là mặc định của kiểm tra phát hành
- `product`: `package` cộng với channel MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để chứng minh Telegram cho ứng viên gói, bật `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier` trên Chấp nhận gói. Workflow truyền tarball `package-under-test` đã phân giải vào lane Telegram; workflow Telegram độc lập vẫn chấp nhận spec npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành

`OpenClaw Release Publish` là điểm vào phát hành có thay đổi trạng thái thông thường. Nó điều phối các workflow trusted-publisher theo thứ tự mà bản phát hành cần:

1. Checkout tag phát hành và phân giải commit SHA của tag đó.
2. Xác minh tag có thể truy cập từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` với `publish_scope=all-publishable` và `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` với cùng scope và SHA.
6. Dispatch `OpenClaw NPM Release` với tag phát hành, dist-tag npm và `preflight_run_id` đã lưu.

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

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release` cho công việc sửa chữa hoặc phát hành lại tập trung. Với sửa chữa Plugin được chọn, truyền `plugin_publish_scope=selected` và `plugins=@openclaw/name` cho `OpenClaw Release Publish`, hoặc dispatch workflow con trực tiếp khi không được phát hành gói OpenClaw.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: tag phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1` hoặc `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là commit SHA đầy đủ 40 ký tự hiện tại của nhánh workflow để chỉ xác thực preflight
- `preflight_only`: `true` chỉ để xác thực/bản dựng/gói, `false` cho đường dẫn phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để workflow tái sử dụng tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: tag đích npm cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: tag phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công; bắt buộc khi `publish_openclaw_npm=true`
- `npm_dist_tag`: tag đích npm cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected` cho công việc sửa chữa tập trung
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng workflow làm bộ điều phối sửa chữa chỉ dành cho Plugin
- `wait_for_clawhub`: mặc định là `false` để khả dụng npm không bị sidecar ClawHub chặn; chỉ đặt `true` khi việc hoàn tất workflow phải bao gồm hoàn tất ClawHub

`OpenClaw Release Checks` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `ref`: nhánh, tag hoặc commit SHA đầy đủ để xác thực. Các kiểm tra mang secret yêu cầu commit đã phân giải có thể truy cập từ một nhánh OpenClaw hoặc tag phát hành.
- `run_release_soak`: chọn tham gia soak live/E2E toàn diện, đường dẫn phát hành Docker và upgrade-survivor từ trước đến nay trên các kiểm tra phát hành ổn định/mặc định. Tùy chọn này bị buộc bật bởi `release_profile=full`.

Quy tắc:

- Tag ổn định và tag sửa lỗi có thể phát hành lên `beta` hoặc `latest`
- Tag prerelease beta chỉ có thể phát hành lên `beta`
- Với `OpenClaw NPM Release`, đầu vào commit SHA đầy đủ chỉ được phép khi `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ xác thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight; workflow xác minh metadata đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi tạo một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi có tag, bạn có thể dùng commit SHA đầy đủ hiện tại của nhánh workflow để chạy thử không phát hành chỉ nhằm xác thực workflow preflight
2. Chọn `npm_dist_tag=beta` cho luồng beta trước thông thường, hoặc `latest` chỉ khi bạn cố ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, tag phát hành hoặc commit SHA đầy đủ khi bạn muốn CI thông thường cộng với phạm vi live prompt cache, Docker, QA Lab, Matrix và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường xác định, hãy chạy workflow `CI` thủ công trên ref phát hành
5. Lưu `preflight_run_id` thành công
6. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag` và `preflight_run_id` đã lưu; nó phát hành các Plugin đã tách ra bên ngoài lên npm và ClawHub trước khi quảng bá gói npm OpenClaw
7. Nếu bản phát hành được đưa lên `beta`, dùng workflow riêng tư `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` để quảng bá phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý được phát hành trực tiếp lên `latest` và `beta` phải theo cùng bản dựng ổn định ngay lập tức, dùng cùng workflow riêng tư đó để trỏ cả hai dist-tag vào phiên bản ổn định, hoặc để đồng bộ tự phục hồi theo lịch của nó chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật vì nó vẫn cần `NPM_TOKEN`, trong khi repo công khai giữ phát hành chỉ dùng OIDC.

Điều đó giúp cả đường dẫn phát hành trực tiếp và đường dẫn quảng bá beta trước đều được tài liệu hóa và hiển thị cho người vận hành.

Nếu maintainer phải dự phòng bằng xác thực npm cục bộ, chỉ chạy mọi lệnh CLI 1Password (`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op` trực tiếp từ shell agent chính; việc giữ nó trong tmux giúp prompt, cảnh báo và xử lý OTP quan sát được, đồng thời ngăn cảnh báo host lặp lại.

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

Maintainer dùng tài liệu phát hành riêng tư trong [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) cho runbook thực tế.

## Liên quan

- [Channel phát hành](/vi/install/development-channels)
