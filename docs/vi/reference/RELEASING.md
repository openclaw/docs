---
read_when:
    - Đang tìm các định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc kiểm tra chấp nhận gói
    - Tìm thông tin về cách đặt tên phiên bản và nhịp phát hành
summary: Các luồng phát hành, danh sách kiểm tra dành cho người vận hành, hộp xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-04-29T23:10:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54dc9ad7918ac95ec535a0404bbcbc04461a2b977151db0c2039b91e7e69c15c
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba kênh phát hành công khai:

- stable: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ tiền phát hành phát hành lên npm `beta`
- dev: đầu nhánh đang thay đổi của `main`

## Cách đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.D`
  - Thẻ Git: `vYYYY.M.D`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.D-N`
  - Thẻ Git: `vYYYY.M.D-N`
- Phiên bản tiền phát hành beta: `YYYY.M.D-beta.N`
  - Thẻ Git: `vYYYY.M.D-beta.N`
- Không thêm số 0 ở đầu tháng hoặc ngày
- `latest` nghĩa là bản phát hành npm ổn định hiện tại đã được thăng cấp
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành ổn định và bản phát hành sửa lỗi ổn định mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm đích `latest` một cách rõ ràng, hoặc thăng cấp một bản dựng beta đã được kiểm định sau đó
- Mỗi bản phát hành OpenClaw ổn định đều phát hành gói npm và ứng dụng macOS cùng nhau;
  các bản phát hành beta thường xác thực và phát hành đường dẫn npm/package trước, với
  việc dựng/ký/công chứng ứng dụng mac được dành cho bản ổn định trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Bản ổn định chỉ theo sau sau khi bản beta mới nhất được xác thực
- Người bảo trì thường cắt bản phát hành từ nhánh `release/YYYY.M.D` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi bản phát hành không chặn
  phát triển mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc phát hành và cần sửa lỗi, người bảo trì cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục
  chỉ dành cho người bảo trì

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag và chi tiết khôi phục khẩn cấp nằm trong
runbook phát hành chỉ dành cho người bảo trì.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Viết lại phần đầu của `CHANGELOG.md` từ lịch sử commit thực tế bằng
   `/changelog`, giữ các mục hướng tới người dùng, commit, đẩy, rồi rebase/pull
   thêm một lần nữa trước khi tạo nhánh.
3. Xem xét các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa
   tương thích đã hết hạn khi đường dẫn nâng cấp vẫn được bao phủ, hoặc ghi lại lý do nó được
   cố ý giữ lại.
4. Tạo `release/YYYY.M.D` từ `main` hiện tại; không làm công việc phát hành bình thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, sau đó chạy
   bước kiểm tra trước cục bộ tất định:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, và `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi thẻ tồn tại,
   SHA đầy đủ 40 ký tự của nhánh phát hành được phép dùng cho bước kiểm tra trước
   chỉ để xác thực. Lưu `preflight_run_id` thành công.
7. Khởi động tất cả kiểm thử tiền phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, lane, job workflow,
   hồ sơ gói, nhà cung cấp hoặc danh sách cho phép mô hình nhỏ nhất đã thất bại mà
   chứng minh được bản sửa. Chỉ chạy lại toàn bộ umbrella khi bề mặt đã thay đổi khiến
   bằng chứng trước đó trở nên cũ.
9. Với beta, gắn thẻ `vYYYY.M.D-beta.N`, phát hành với npm dist-tag `beta`, sau đó chạy
   chấp nhận gói sau phát hành đối với gói `openclaw@YYYY.M.D-beta.N`
   hoặc `openclaw@beta` đã phát hành. Nếu một beta đã đẩy hoặc đã phát hành cần sửa lỗi, cắt
   `-beta.N` tiếp theo; không xóa hoặc viết lại beta cũ.
10. Với bản ổn định, chỉ tiếp tục sau khi beta đã được kiểm định hoặc release candidate có
    bằng chứng xác thực bắt buộc. Phát hành npm ổn định tái sử dụng
    artifact kiểm tra trước thành công qua `preflight_run_id`; mức sẵn sàng phát hành macOS ổn định
    cũng yêu cầu `.zip`, `.dmg`, `.dSYM.zip` đã được đóng gói, và
    `appcast.xml` đã cập nhật trên `main`.
11. Sau khi phát hành, chạy bộ xác minh npm sau phát hành, E2E Telegram
    độc lập tùy chọn trên npm đã phát hành khi bạn cần bằng chứng kênh sau phát hành,
    thăng cấp dist-tag khi cần, ghi chú GitHub release/prerelease từ
    toàn bộ phần `CHANGELOG.md` khớp tương ứng, và các bước thông báo phát hành.

## Kiểm tra trước phát hành

- Chạy `pnpm check:test-types` trước bước kiểm tra trước phát hành để TypeScript của kiểm thử vẫn được bao phủ ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước bước kiểm tra trước phát hành để các kiểm tra rộng hơn về vòng lặp import và ranh giới kiến trúc đều xanh ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực đóng gói
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để khởi động mọi hộp kiểm thử tiền phát hành từ một điểm vào. Nó chấp nhận một nhánh, thẻ, hoặc SHA commit đầy đủ, kích hoạt `CI` thủ công, và kích hoạt `OpenClaw Release Checks` cho smoke cài đặt, chấp nhận gói, các bộ kiểm thử đường dẫn phát hành Docker, live/E2E, OpenWebUI, đối chiếu QA Lab, Matrix, và các lane Telegram. Chỉ cung cấp `npm_telegram_package_spec` sau khi một gói đã được phát hành và E2E Telegram hậu phát hành cũng cần chạy. Cung cấp `evidence_package_spec` khi báo cáo bằng chứng riêng tư cần chứng minh rằng quá trình xác thực khớp với một gói npm đã phát hành mà không buộc chạy Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn bằng chứng kênh phụ cho một ứng viên gói trong lúc công việc phát hành tiếp tục. Dùng `source=npm` cho `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref` để đóng gói một nhánh/thẻ/SHA `package_ref` đáng tin cậy bằng harness `workflow_ref` hiện tại; `source=url` cho một tarball HTTPS với SHA-256 bắt buộc; hoặc `source=artifact` cho một tarball do một lần chạy GitHub Actions khác tải lên. Workflow phân giải ứng viên thành `package-under-test`, tái sử dụng bộ lập lịch phát hành Docker E2E với tarball đó, và có thể chạy QA Telegram với cùng tarball bằng `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f telegram_mode=mock-openai`
  Hồ sơ thường dùng:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway, và tải lại cấu hình
  - `package`: các lane gói/cập nhật/Plugin nguyên bản theo artifact không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ gói cộng thêm các kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại có trọng tâm
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần độ bao phủ CI bình thường đầy đủ cho ứng viên phát hành. Các lần kích hoạt CI thủ công bỏ qua phạm vi theo thay đổi và buộc chạy các shard Linux Node, shard Plugin đi kèm, hợp đồng kênh, tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Skills Python, Windows, macOS, Android, và các lane i18n Control UI.
  Ví dụ: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Nó chạy QA-lab qua một bộ nhận OTLP/HTTP cục bộ và xác minh tên span trace đã xuất, thuộc tính có giới hạn, và biên tập bỏ nội dung/định danh mà không cần Opik, Langfuse, hoặc bộ thu thập bên ngoài khác.
- Chạy `pnpm release:check` trước mọi bản phát hành được gắn thẻ
- Kiểm tra phát hành hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy cổng đối chiếu mock QA Lab cộng với hồ sơ Matrix live nhanh và lane QA Telegram trước khi phê duyệt phát hành. Các lane live dùng môi trường `qa-live-shared`; Telegram cũng dùng lease thông tin xác thực Convex CI. Chạy workflow thủ công `QA-Lab - All Lanes` với `matrix_profile=all` và `matrix_shards=true` khi bạn muốn toàn bộ kiểm kê truyền tải Matrix, phương tiện, và E2EE chạy song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của `OpenClaw Release Checks` và `Full Release Validation` công khai, gọi trực tiếp workflow tái sử dụng `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ đích: giữ đường dẫn phát hành npm thật ngắn, xác định, và tập trung vào artifact, trong khi các kiểm tra live chậm hơn ở lane riêng để chúng không làm đình trệ hoặc chặn việc phát hành
- Các kiểm tra phát hành chứa bí mật nên được kích hoạt qua `Full Release Validation` hoặc từ workflow ref `main`/release để logic workflow và bí mật vẫn được kiểm soát
- `OpenClaw Release Checks` chấp nhận một nhánh, thẻ, hoặc SHA commit đầy đủ miễn là commit đã phân giải có thể truy cập từ một nhánh OpenClaw hoặc thẻ phát hành
- Bước kiểm tra trước chỉ-xác-thực của `OpenClaw NPM Release` cũng chấp nhận SHA commit đầy đủ 40 ký tự hiện tại của nhánh workflow mà không yêu cầu một thẻ đã đẩy
- Đường dẫn SHA đó chỉ dành cho xác thực và không thể được nâng cấp thành phát hành thật
- Ở chế độ SHA, workflow tổng hợp `v<package.json version>` chỉ cho kiểm tra metadata gói; phát hành thật vẫn cần một thẻ phát hành thật
- Cả hai workflow giữ đường dẫn phát hành và thăng hạng thật trên runner do GitHub lưu trữ, trong khi đường dẫn xác thực không gây thay đổi có thể dùng runner Linux Blacksmith lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Bước kiểm tra trước phát hành npm không còn chờ lane kiểm tra phát hành riêng nữa
- Chạy `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc thẻ beta/sửa lỗi tương ứng) trước khi phê duyệt
- Sau khi phát hành npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (hoặc phiên bản beta/sửa lỗi tương ứng) để xác minh đường dẫn cài đặt registry đã phát hành trong một tiền tố tạm mới
- Sau một bản phát hành beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding gói đã cài đặt, thiết lập Telegram, và Telegram E2E thật với gói npm đã phát hành bằng pool thông tin xác thực Telegram dùng chung có lease. Các lần chạy một lần cục bộ của maintainer có thể bỏ qua biến Convex và truyền trực tiếp ba thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Maintainer có thể chạy cùng kiểm tra hậu phát hành từ GitHub Actions qua workflow thủ công `NPM Telegram Beta E2E`. Nó được cố ý đặt chỉ-thủ-công và không chạy trên mọi lần merge.
- Tự động hóa phát hành của maintainer hiện dùng kiểm tra-trước-rồi-thăng-hạng:
  - phát hành npm thật phải vượt qua một `preflight_run_id` npm thành công
  - phát hành npm thật phải được kích hoạt từ cùng nhánh `main` hoặc `release/YYYY.M.D` với lần chạy kiểm tra trước thành công
  - phát hành npm ổn định mặc định là `beta`
  - phát hành npm ổn định có thể nhắm rõ tới `latest` qua input workflow
  - thay đổi npm dist-tag dựa trên token hiện nằm trong `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml` vì lý do bảo mật, vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo công khai giữ phát hành chỉ dùng OIDC
  - `macOS Release` công khai chỉ để xác thực
  - phát hành mac riêng tư thật phải vượt qua `preflight_run_id` và `validate_run_id` mac riêng tư thành công
  - các đường dẫn phát hành thật thăng hạng artifact đã chuẩn bị thay vì build lại chúng lần nữa
- Với các bản phát hành sửa lỗi ổn định như `YYYY.M.D-N`, bộ xác minh hậu phát hành cũng kiểm tra cùng đường dẫn nâng cấp tiền tố tạm từ `YYYY.M.D` lên `YYYY.M.D-N` để các bản sửa lỗi phát hành không thể âm thầm để các bản cài đặt toàn cục cũ trên payload ổn định nền
- Bước kiểm tra trước phát hành npm thất bại đóng nếu tarball không bao gồm cả `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng để chúng ta không phát hành lại một dashboard trình duyệt rỗng
- Xác minh hậu phát hành cũng kiểm tra rằng bản cài đặt registry đã phát hành chứa các phụ thuộc runtime Plugin đi kèm không rỗng dưới bố cục gốc `dist/*`. Một bản phát hành có payload phụ thuộc Plugin đi kèm bị thiếu hoặc rỗng sẽ thất bại ở bộ xác minh hậu phát hành và không thể được thăng hạng lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của gói npm trên tarball cập nhật ứng viên, để installer e2e phát hiện phình to gói ngoài ý muốn trước đường dẫn phát hành
- Nếu công việc phát hành đã chạm tới lập kế hoạch CI, manifest thời gian của extension, hoặc ma trận kiểm thử extension, hãy tái tạo và xem lại các đầu ra ma trận `plugin-prerelease-extension-shard` do planner sở hữu từ `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành không mô tả một bố cục CI đã lỗi thời
- Mức sẵn sàng phát hành macOS ổn định cũng bao gồm các bề mặt updater:
  - GitHub release cuối cùng phải có `.zip`, `.dmg`, và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ tới zip ổn định mới sau khi phát hành
  - app đã đóng gói phải giữ bundle id không-debug, URL feed Sparkle không rỗng, và `CFBundleVersion` bằng hoặc cao hơn sàn build Sparkle chính tắc cho phiên bản phát hành đó

## Hộp kiểm thử phát hành

`Full Release Validation` là cách operator khởi động mọi kiểm thử tiền phát hành từ một điểm vào. Chạy nó từ workflow ref `main` đáng tin cậy và truyền nhánh phát hành, thẻ, hoặc SHA commit đầy đủ làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f evidence_package_spec=openclaw@YYYY.M.D-beta.N
```

Workflow phân giải ref đích, kích hoạt `CI` thủ công với `target_ref=<release-ref>`, kích hoạt `OpenClaw Release Checks`, và tùy chọn kích hoạt Telegram E2E hậu phát hành độc lập khi `npm_telegram_package_spec` được đặt. `OpenClaw Release Checks` sau đó tỏa ra smoke cài đặt, kiểm tra phát hành đa hệ điều hành, độ bao phủ đường dẫn phát hành Docker live/E2E, Package Acceptance với QA gói Telegram, đối chiếu QA Lab, Matrix live, và Telegram live. Một lần chạy đầy đủ chỉ được chấp nhận khi phần tóm tắt `Full Release Validation` hiển thị `normal_ci` và `release_checks` thành công, và mọi nhánh con `npm_telegram` tùy chọn đều thành công hoặc được cố ý bỏ qua. Phần tóm tắt xác minh cuối cùng bao gồm bảng job chậm nhất cho từng lần chạy con, để người quản lý phát hành có thể thấy đường dẫn trọng yếu hiện tại mà không cần tải log.
Các workflow con được kích hoạt từ ref đáng tin cậy đang chạy `Full Release Validation`, thường là `--ref main`, ngay cả khi `ref` đích trỏ tới một nhánh hoặc thẻ phát hành cũ hơn. Không có input workflow-ref Full Release Validation riêng; chọn harness đáng tin cậy bằng cách chọn ref chạy workflow.

Dùng `release_profile` để chọn độ rộng live/provider:

- `minimum`: đường dẫn OpenAI/core live và Docker quan trọng cho phát hành nhanh nhất
- `stable`: minimum cộng thêm độ bao phủ provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng thêm độ bao phủ provider/media tư vấn rộng

`OpenClaw Release Checks` dùng workflow ref đáng tin cậy để phân giải ref đích một lần thành `release-package-under-test` và tái sử dụng artifact đó trong cả kiểm tra Docker theo đường dẫn phát hành và Package Acceptance. Điều này giữ mọi hộp hướng tới gói trên cùng một byte và tránh build gói lặp lại.
Smoke cài đặt OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4-mini`, vì lane này đang chứng minh cài đặt gói, onboarding, khởi động Gateway, và một lượt agent live thay vì benchmark model mặc định chậm nhất. Ma trận provider live rộng hơn vẫn là nơi dành cho độ bao phủ theo model cụ thể.

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

Không dùng toàn bộ ô lớn làm lần chạy lại đầu tiên sau một bản sửa tập trung. Nếu một ô
thất bại, hãy dùng workflow con, job, lane Docker, hồ sơ package, nhà cung cấp
mô hình hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại toàn bộ ô lớn khi
bản sửa đã thay đổi cơ chế điều phối phát hành dùng chung hoặc làm cho bằng chứng tất cả ô
trước đó trở nên cũ. Trình xác minh cuối của ô lớn kiểm tra lại các id lần chạy workflow con
đã ghi lại, vì vậy sau khi một workflow con được chạy lại thành công, chỉ chạy lại job cha
`Verify full validation` đã thất bại.

Để khôi phục có giới hạn, truyền `rerun_group` cho ô lớn. `all` là lần chạy
ứng viên phát hành thật, `ci` chỉ chạy workflow con CI bình thường, `plugin-prerelease`
chỉ chạy workflow con Plugin chỉ dành cho phát hành, `release-checks` chạy mọi ô
phát hành, và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, và `npm-telegram` khi lane
Telegram package độc lập được cung cấp.

### Vitest

Ô Vitest là workflow con `CI` thủ công. CI thủ công cố ý bỏ qua phạm vi thay đổi
và ép chạy đồ thị kiểm thử bình thường cho ứng viên phát hành: các shard Linux Node,
shard Plugin đóng gói, hợp đồng kênh, tương thích Node 22, `check`,
`check-additional`, kiểm thử nhanh build, kiểm tra tài liệu, Skills Python,
Windows, macOS, Android, và i18n Control UI.

Dùng ô này để trả lời "cây mã nguồn đã vượt qua toàn bộ bộ kiểm thử bình thường chưa?"
Nó không giống với xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần giữ:

- tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã gửi
- lần chạy `CI` xanh trên đúng SHA mục tiêu
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- hiện vật thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI bình thường có tính xác định nhưng
không cần các ô Docker, QA Lab, trực tiếp, đa hệ điều hành, hoặc package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Ô Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow
`install-smoke` ở chế độ phát hành. Nó xác thực ứng viên phát hành qua các
môi trường Docker đã đóng gói thay vì chỉ kiểm thử ở cấp mã nguồn.

Phạm vi Docker phát hành bao gồm:

- kiểm thử nhanh cài đặt đầy đủ với kiểm thử nhanh cài đặt toàn cục Bun chậm được bật
- chuẩn bị/tái sử dụng image kiểm thử nhanh Dockerfile gốc theo SHA mục tiêu, với các job kiểm thử nhanh QR,
  root/Gateway, và installer/Bun chạy dưới dạng các shard install-smoke riêng
- các lane E2E của repository
- các chunk Docker theo đường dẫn phát hành: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, `plugins-runtime-install-h`,
  `bundled-channels-core`, `bundled-channels-update-a`,
  `bundled-channels-update-discord`, `bundled-channels-update-b`, và
  `bundled-channels-contracts`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- tách các lane phụ thuộc kênh đóng gói qua channel-smoke, update-target,
  và các chunk hợp đồng setup/runtime thay vì một job kênh đóng gói lớn
- tách các lane cài đặt/gỡ cài đặt Plugin đóng gói
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các bộ kiểm thử nhà cung cấp live/E2E và phạm vi mô hình trực tiếp Docker khi kiểm tra phát hành
  bao gồm các bộ trực tiếp

Dùng hiện vật Docker trước khi chạy lại. Bộ lập lịch theo đường dẫn phát hành tải lên
`.artifacts/docker-tests/` với log lane, `summary.json`, `failures.json`,
thời gian các pha, JSON kế hoạch bộ lập lịch, và lệnh chạy lại. Để khôi phục tập trung,
dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì
chạy lại toàn bộ chunk phát hành. Các lệnh chạy lại được tạo bao gồm
`package_artifact_run_id` trước đó và đầu vào image Docker đã chuẩn bị khi có, để một
lane thất bại có thể tái sử dụng cùng tarball và image GHCR.

### QA Lab

Ô QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành
hành vi tác nhân và cấp kênh, tách biệt với Vitest và cơ chế package Docker.

Phạm vi QA Lab phát hành bao gồm:

- cổng parity giả lập so sánh lane ứng viên OpenAI với baseline Opus 4.6
  bằng gói parity tác nhân
- hồ sơ Matrix QA trực tiếp nhanh dùng môi trường `qa-live-shared`
- lane Telegram QA trực tiếp dùng thuê thông tin xác thực Convex CI
- `pnpm qa:otel:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng ô này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA và
luồng kênh trực tiếp không?" Giữ các URL hiện vật cho các lane parity, Matrix, và Telegram
khi phê duyệt bản phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng một
lần chạy QA-Lab thủ công được chia shard, thay vì lane mặc định tối quan trọng cho phát hành.

### Package

Ô Package là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và trình phân giải
`scripts/resolve-openclaw-package-candidate.mjs`. Trình phân giải chuẩn hóa một
ứng viên thành tarball `package-under-test` được Docker E2E sử dụng, xác thực
kiểm kê package, ghi lại phiên bản package và SHA-256, và giữ ref harness workflow
tách khỏi ref nguồn package.

Nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw
  chính xác
- `source=ref`: đóng gói một nhánh, tag, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS với `package_sha256` bắt buộc
- `source=artifact`: tái sử dụng một `.tgz` do một lần chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Package Acceptance với `source=ref`,
`package_ref=<release-ref>`, `suite_profile=custom`,
`docker_lanes=bundled-channel-deps-compat plugins-offline`, và
`telegram_mode=mock-openai`. Các chunk Docker theo đường dẫn phát hành bao phủ các lane
cài đặt, cập nhật, và cập nhật Plugin chồng lấn; Package Acceptance giữ
tương thích kênh đóng gói dựa trên hiện vật, fixture Plugin ngoại tuyến, và Telegram
package QA trên cùng tarball đã phân giải. Đây là phương án thay thế gốc GitHub
cho hầu hết phạm vi package/cập nhật trước đây cần Parallels. Kiểm tra phát hành đa hệ điều hành
vẫn quan trọng cho onboarding, trình cài đặt, và hành vi nền tảng đặc thù hệ điều hành,
nhưng xác thực sản phẩm package/cập nhật nên ưu tiên Package Acceptance.

Sự dễ dãi Package Acceptance cũ được giới hạn thời gian có chủ ý. Các package đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống metadata đã phát hành
lên npm: mục kiểm kê QA riêng tư thiếu trong tarball, thiếu
`gateway install --wrapper`, thiếu file patch trong fixture git dẫn xuất từ tarball,
thiếu `update.channel` đã lưu, vị trí bản ghi cài đặt Plugin cũ,
thiếu lưu bản ghi cài đặt marketplace, và di chuyển metadata cấu hình trong
`plugins update`. Package `2026.4.26` đã phát hành có thể cảnh báo
về các file dấu metadata build cục bộ đã được phát hành. Các package sau đó
phải thỏa mãn hợp đồng package hiện đại; những khoảng trống tương tự sẽ làm thất bại
xác thực phát hành.

Dùng các hồ sơ Package Acceptance rộng hơn khi câu hỏi phát hành là về một
package có thể cài đặt thực tế:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Hồ sơ package thường dùng:

- `smoke`: các lane cài đặt package/kênh/tác nhân, mạng Gateway, và tải lại cấu hình nhanh
- `package`: hợp đồng cài đặt/cập nhật/package Plugin không có ClawHub trực tiếp; đây là mặc định
  của release-check
- `product`: `package` cộng với các kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI,
  và OpenWebUI
- `full`: các chunk theo đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để có bằng chứng Telegram cho ứng viên package, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball
`package-under-test` đã phân giải vào lane Telegram; workflow Telegram độc lập
vẫn chấp nhận spec npm đã phát hành cho kiểm tra sau phát hành.

## Đầu vào workflow NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do operator kiểm soát sau:

- `tag`: tag phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là SHA commit nhánh workflow
  đầy đủ 40 ký tự hiện tại cho preflight chỉ xác thực
- `preflight_only`: `true` cho chỉ xác thực/build/package, `false` cho
  đường dẫn phát hành thật
- `preflight_run_id`: bắt buộc trên đường dẫn phát hành thật để workflow tái sử dụng
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: tag đích npm cho đường dẫn phát hành; mặc định là `beta`

`OpenClaw Release Checks` chấp nhận các đầu vào do operator kiểm soát sau:

- `ref`: nhánh, tag, hoặc SHA commit đầy đủ để xác thực. Các kiểm tra có chứa secret
  yêu cầu commit đã phân giải phải có thể truy cập từ một nhánh OpenClaw hoặc
  tag phát hành.

Quy tắc:

- Tag ổn định và tag sửa lỗi có thể phát hành lên `beta` hoặc `latest`
- Tag tiền phát hành Beta chỉ có thể phát hành lên `beta`
- Với `OpenClaw NPM Release`, đầu vào SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ dùng để xác thực
- Đường dẫn phát hành thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh metadata đó trước khi tiếp tục phát hành

## Trình tự phát hành npm ổn định

Khi cắt một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi có tag, bạn có thể dùng SHA commit nhánh workflow đầy đủ hiện tại
     cho một lần chạy thử preflight chỉ xác thực
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước bình thường, hoặc `latest` chỉ
   khi bạn cố ý muốn phát hành ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, tag phát hành, hoặc SHA
   commit đầy đủ khi bạn muốn CI bình thường cộng với phạm vi prompt cache trực tiếp,
   Docker, QA Lab, Matrix, và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử bình thường có tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành thay vào đó
5. Lưu `preflight_run_id` thành công
6. Chạy lại `OpenClaw NPM Release` với `preflight_only=false`, cùng
   `tag`, cùng `npm_dist_tag`, và `preflight_run_id` đã lưu
7. Nếu bản phát hành đã lên `beta`, dùng workflow riêng tư
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   để thăng cấp phiên bản ổn định đó từ `beta` lên `latest`
8. Nếu bản phát hành cố ý phát hành trực tiếp lên `latest` và `beta`
   cần trỏ theo cùng bản build ổn định ngay lập tức, dùng cùng workflow riêng tư đó
   để trỏ cả hai dist-tag vào phiên bản ổn định, hoặc để đồng bộ tự phục hồi theo lịch của nó
   di chuyển `beta` sau

Việc thay đổi dist-tag nằm trong repo riêng tư vì lý do bảo mật vì nó vẫn
cần `NPM_TOKEN`, trong khi repo công khai giữ phát hành chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn phát hành trực tiếp và đường dẫn thăng cấp beta-trước
được ghi tài liệu và hiển thị với operator.

Nếu người bảo trì phải chuyển sang xác thực npm cục bộ, chỉ chạy mọi lệnh
CLI (`op`) của 1Password bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell tác tử chính; giữ nó bên trong tmux giúp các lời nhắc,
cảnh báo và việc xử lý OTP có thể quan sát được, đồng thời ngăn cảnh báo máy chủ lặp lại.

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

Người bảo trì sử dụng tài liệu phát hành riêng tư trong
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
cho sổ tay vận hành thực tế.

## Liên quan

- [Kênh phát hành](/vi/install/development-channels)
