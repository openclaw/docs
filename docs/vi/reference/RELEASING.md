---
read_when:
    - Đang tìm các định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc chấp nhận gói
    - Tìm hiểu cách đặt tên phiên bản và nhịp phát hành
summary: Các luồng phát hành, danh sách kiểm tra cho người vận hành, hộp xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-06-27T18:08:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw có ba nhánh phát hành công khai:

- stable: các bản phát hành được gắn thẻ, mặc định phát hành lên npm `beta`, hoặc lên npm `latest` khi được yêu cầu rõ ràng
- beta: các thẻ tiền phát hành được phát hành lên npm `beta`
- dev: đầu nhánh đang thay đổi của `main`

## Đặt tên phiên bản

- Phiên bản phát hành ổn định: `YYYY.M.PATCH`
  - Thẻ Git: `vYYYY.M.PATCH`
- Phiên bản phát hành sửa lỗi ổn định: `YYYY.M.PATCH-N`
  - Thẻ Git: `vYYYY.M.PATCH-N`
- Phiên bản tiền phát hành beta: `YYYY.M.PATCH-beta.N`
  - Thẻ Git: `vYYYY.M.PATCH-beta.N`
- Không thêm số 0 ở đầu tháng hoặc patch
- Bắt đầu từ bản cập nhật quy trình phát hành tháng 6 năm 2026, thành phần thứ ba là
  số thứ tự của chuyến phát hành hằng tháng, không phải ngày trong lịch. Các bản phát hành stable và beta
  xác định chuyến hiện tại; các thẻ chỉ alpha không tiêu thụ hoặc
  tăng số patch beta/stable. Các thẻ và phiên bản npm trước bản cập nhật vẫn giữ
  tên hiện có và vẫn hợp lệ; tự động hóa phát hành tiếp tục
  so sánh chúng theo năm, tháng, patch, kênh, và số tiền phát hành hoặc số sửa lỗi.
- Các bản dựng alpha/nightly dùng chuyến patch chưa phát hành tiếp theo và chỉ tăng
  `alpha.N` cho các bản dựng lặp lại. Khi patch đó đã có beta, các bản dựng alpha mới
  chuyển sang patch tiếp theo. Bỏ qua các thẻ chỉ alpha cũ có số patch
  cao hơn khi chọn chuyến beta hoặc stable.
- Các phiên bản npm là bất biến. Nếu một thẻ beta đã được phát hành, đừng
  xóa, phát hành lại hoặc tái sử dụng thẻ đó; hãy cắt số beta tiếp theo hoặc patch
  hằng tháng tiếp theo. Vì `2026.6.5-beta.1` đã được phát hành trong giai đoạn
  chuyển tiếp, các chuyến phát hành tháng 6 năm 2026 phải dùng patch `5` hoặc cao hơn. Đừng
  phát hành các chuyến stable hoặc beta mới của tháng 6 năm 2026 dưới dạng `2026.6.2`, `2026.6.3`, hoặc
  `2026.6.4`.
- Sau stable `2026.6.5`, chuyến beta mới tiếp theo là `2026.6.6-beta.1`, ngay cả
  khi các thẻ chỉ alpha tự động với số patch cao hơn đã tồn tại.
- `latest` nghĩa là bản phát hành npm stable đang được quảng bá hiện tại
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- Các bản phát hành stable và sửa lỗi stable mặc định phát hành lên npm `beta`; người vận hành phát hành có thể nhắm rõ ràng tới `latest`, hoặc quảng bá một bản dựng beta đã được thẩm định sau đó
- Mỗi bản phát hành OpenClaw stable phát hành đồng thời gói npm, ứng dụng macOS, và các bộ cài đặt Windows Hub
  đã ký; các bản phát hành beta thường xác thực và phát hành
  đường dẫn npm/gói trước, còn dựng/ký/công chứng/quảng bá ứng dụng gốc
  được dành cho stable trừ khi được yêu cầu rõ ràng

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Stable chỉ theo sau sau khi beta mới nhất được xác thực
- Người bảo trì thường cắt bản phát hành từ một nhánh `release/YYYY.M.PATCH` được tạo
  từ `main` hiện tại, để xác thực phát hành và các bản sửa không chặn
  phát triển mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc phát hành và cần sửa, người bảo trì cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực, và ghi chú khôi phục
  chỉ dành cho người bảo trì

## Danh sách kiểm tra cho người vận hành phát hành

Danh sách kiểm tra này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag, và chi tiết rollback khẩn cấp nằm trong
runbook phát hành chỉ dành cho người bảo trì.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Tạo phần đầu của `CHANGELOG.md` từ các PR đã merge và mọi commit trực tiếp
   kể từ thẻ phát hành có thể truy cập gần nhất. Giữ các mục hướng tới người dùng,
   loại trùng các mục PR/commit trực tiếp chồng lấn, commit phần viết lại, đẩy lên,
   và rebase/pull thêm một lần trước khi tạo nhánh.
3. Xem xét các bản ghi tương thích phát hành trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa
   khả năng tương thích đã hết hạn khi đường nâng cấp vẫn được bao phủ, hoặc ghi lại lý do nó
   được chủ ý giữ lại.
4. Tạo `release/YYYY.M.PATCH` từ `main` hiện tại; đừng làm công việc phát hành thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho thẻ dự định, sau đó chạy
   `pnpm release:prep`. Lệnh này làm mới phiên bản Plugin, bản kê Plugin, schema
   cấu hình, siêu dữ liệu cấu hình kênh đi kèm, baseline tài liệu cấu hình, các export Plugin SDK,
   và baseline API Plugin SDK theo đúng thứ tự. Commit mọi drift được tạo
   trước khi gắn thẻ. Sau đó chạy preflight xác định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, và `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ,
   SHA nhánh phát hành đầy đủ 40 ký tự được phép dùng cho preflight
   chỉ xác thực. Preflight tạo bằng chứng phát hành phụ thuộc cho
   đồ thị phụ thuộc chính xác đã checkout và lưu nó trong artifact preflight npm.
   Lưu `preflight_run_id` thành công.
7. Khởi chạy tất cả bài kiểm thử trước phát hành bằng `Full Release Validation` cho
   nhánh phát hành, thẻ, hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất
   cho bốn hộp kiểm thử phát hành lớn: Vitest, Docker, QA Lab, và Package.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, lane, job workflow,
   profile gói, provider, hoặc allowlist model nhỏ nhất đã thất bại mà
   chứng minh bản sửa. Chỉ chạy lại toàn bộ umbrella khi bề mặt thay đổi làm
   bằng chứng trước đó lỗi thời.
9. Với một ứng viên beta đã gắn thẻ, chạy
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` từ nhánh
   `release/YYYY.M.PATCH` tương ứng. Với stable, truyền cả bản phát hành nguồn Windows
   bắt buộc:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Helper chạy các kiểm tra phát hành đã tạo cục bộ, dispatch hoặc xác minh
   bằng chứng full release validation và npm preflight, chạy bằng chứng Parallels
   fresh/update trên đúng tarball đã chuẩn bị cùng bằng chứng gói Telegram,
   ghi lại kế hoạch npm Plugin và ClawHub, và chỉ in lệnh
   `OpenClaw Release Publish` chính xác sau khi gói bằng chứng xanh.
   `OpenClaw Release Publish` dispatch các gói Plugin đã chọn hoặc mọi gói có thể phát hành
   lên npm và cùng tập hợp đó lên ClawHub song song, rồi quảng bá
   artifact preflight npm OpenClaw đã chuẩn bị với dist-tag tương ứng ngay khi
   phát hành npm Plugin thành công.
   Sau khi child phát hành npm OpenClaw thành công, nó tạo hoặc cập nhật
   trang phát hành/tiền phát hành GitHub tương ứng từ toàn bộ phần
   `CHANGELOG.md` khớp. Các bản phát hành stable được phát hành lên npm `latest` trở thành
   bản phát hành mới nhất trên GitHub; các bản phát hành bảo trì stable được giữ trên npm `beta` được
   tạo với GitHub `latest=false`. Workflow cũng tải lên bằng chứng
   phụ thuộc preflight, manifest full-validation, và bằng chứng xác minh registry
   sau phát hành vào GitHub release để ứng phó sự cố sau phát hành.
   Workflow phát hành in ID các child run ngay lập tức, tự động phê duyệt
   các cổng môi trường phát hành mà workflow token được phép phê duyệt, tóm tắt
   các child job thất bại kèm phần đuôi log, hoàn tất GitHub release và bằng chứng
   phụ thuộc ngay khi phát hành npm OpenClaw thành công, chờ ClawHub bất cứ khi nào
   npm OpenClaw đang được phát hành, rồi chạy `pnpm release:verify-beta` và
   tải lên bằng chứng sau phát hành cho GitHub release, gói npm, các gói npm Plugin
   đã chọn, các gói ClawHub đã chọn, ID child workflow run, và
   ID NPM Telegram run tùy chọn. Đường ClawHub thử lại các lỗi cài đặt phụ thuộc CLI
   tạm thời, phát hành các Plugin vượt qua preview ngay cả khi một
   ô preview bị lỗi thoáng qua, và kết thúc bằng xác minh registry cho mọi phiên bản
   Plugin dự kiến để các lần phát hành một phần vẫn hiển thị và có thể thử lại. Sau đó chạy chấp nhận gói
   sau phát hành đối với gói đã phát hành
   `openclaw@YYYY.M.PATCH-beta.N` hoặc
   `openclaw@beta`. Nếu một tiền phát hành đã đẩy hoặc phát hành cần sửa,
   cắt số tiền phát hành tương ứng tiếp theo; đừng xóa hoặc viết lại tiền phát hành cũ.
10. Với stable, chỉ tiếp tục sau khi beta đã thẩm định hoặc ứng viên phát hành có
    bằng chứng xác thực bắt buộc. Phát hành npm stable cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công qua
    `preflight_run_id`; mức sẵn sàng phát hành macOS stable cũng yêu cầu
    `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói, và `appcast.xml` đã cập nhật trên `main`.
    Workflow phát hành macOS tự động phát hành appcast đã ký lên `main`
    công khai sau khi tài sản phát hành được xác minh; nếu bảo vệ nhánh chặn
    push trực tiếp, nó mở hoặc cập nhật một PR appcast. Mức sẵn sàng Windows Hub stable
    yêu cầu các tài sản `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe`, và
    `OpenClawCompanion-SHA256SUMS.txt` đã ký trên GitHub release của OpenClaw.
    Truyền đúng thẻ phát hành `openclaw/openclaw-windows-node` đã ký dưới dạng
    `windows_node_tag` và bản đồ digest bộ cài đặt đã được ứng viên phê duyệt của nó dưới dạng
    `windows_node_installer_digests`; `OpenClaw Release Publish` giữ
    bản nháp phát hành, dispatch `Windows Node Release`, và xác minh cả ba
    tài sản trước khi phát hành.
11. Sau khi phát hành, chạy trình xác minh npm sau phát hành, E2E Telegram npm đã phát hành
    độc lập tùy chọn khi bạn cần bằng chứng kênh sau phát hành,
    quảng bá dist-tag khi cần, xác minh trang GitHub release đã tạo,
    chạy các bước thông báo phát hành, rồi hoàn tất [Kết thúc stable trên main
   ](#stable-main-closeout) trước khi coi một bản phát hành stable là hoàn thành.

## Kết thúc stable trên main

Việc phát hành stable chưa hoàn tất cho đến khi `main` mang trạng thái phát hành
thực tế đã được chuyển giao.

1. Bắt đầu từ `main` mới nhất còn sạch. Kiểm tra `release/YYYY.M.PATCH` so với nhánh đó và
   chuyển tiếp các bản sửa lỗi thực sự còn thiếu khỏi `main`. Không mù quáng merge
   các bộ điều hợp tương thích, kiểm thử hoặc xác thực chỉ dành cho release vào `main` mới hơn.
2. Đặt `main` thành phiên bản stable đã phát hành, không phải một nhánh phát hành tiếp theo mang tính suy đoán. Chạy
   `pnpm release:prep` sau khi thay đổi phiên bản gốc, rồi
   `pnpm deps:shrinkwrap:generate`.
3. Làm cho mục `## YYYY.M.PATCH` của `CHANGELOG.md` trên `main` khớp chính xác với
   nhánh release đã gắn thẻ. Bao gồm bản cập nhật stable `appcast.xml` khi bản phát hành mac
   đã xuất bản bản cập nhật đó.
4. Không thêm `YYYY.M.PATCH+1`, phiên bản beta, hoặc mục changelog tương lai rỗng
   vào `main` cho đến khi người vận hành bắt đầu rõ ràng nhánh phát hành đó.
5. Chạy `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, và
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Push, rồi xác minh `origin/main`
   chứa phiên bản và changelog đã phát hành trước khi gọi bản phát hành stable
   là hoàn tất.
6. Giữ các biến kho lưu trữ `RELEASE_ROLLBACK_DRILL_ID` và
   `RELEASE_ROLLBACK_DRILL_DATE` luôn hiện hành sau mỗi lần diễn tập rollback riêng tư.
   `OpenClaw Stable Main Closeout` bắt đầu từ lần push `main` mang theo
   phiên bản, changelog và appcast đã phát hành sau khi stable được xuất bản. Nó đọc
   bằng chứng postpublish bất biến để liên kết thẻ đã phát hành với các lần chạy Full Release
   Validation và Publish, rồi xác minh trạng thái stable main, release,
   thời gian theo dõi stable bắt buộc và bằng chứng hiệu năng chặn phát hành. Nó đính kèm một
   bản kê closeout bất biến và checksum vào GitHub release. Trigger push tự động
   bỏ qua các release cũ có trước bằng chứng postpublish bất biến; nó không bao giờ coi lần bỏ qua đó
   là một closeout đã hoàn tất. Một closeout hoàn chỉnh yêu cầu cả hai asset
   và checksum khớp. Một bản kê một phần phát lại SHA `main` và lần diễn tập rollback
   đã ghi của nó để tạo lại các byte giống hệt, rồi đính kèm checksum còn thiếu; một cặp
   không hợp lệ, hoặc checksum không có bản kê, vẫn là điều kiện chặn. Một lần chạy do push kích hoạt
   không có các biến kho lưu trữ cho diễn tập rollback sẽ bỏ qua mà không hoàn tất closeout; bản ghi diễn tập
   bị thiếu hoặc cũ hơn 90 ngày vẫn chặn closeout thủ công có bằng chứng hỗ trợ.
   Các lệnh khôi phục riêng tư vẫn nằm trong runbook chỉ dành cho maintainer.
   Chỉ dùng manual dispatch để sửa chữa hoặc phát lại một closeout stable có bằng chứng hỗ trợ.
   Thẻ sửa lỗi fallback cũ chỉ có thể dùng lại bằng chứng base-package khi
   thẻ sửa lỗi phân giải tới cùng source commit với thẻ stable gốc.
   Một bản sửa lỗi có source khác phải xuất bản và xác minh bằng chứng package
   của riêng nó.

## Kiểm tra trước release

- Chạy `pnpm check:test-types` trước bước kiểm tra sơ bộ phát hành để TypeScript của kiểm thử vẫn
  được bao phủ bên ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước bước kiểm tra sơ bộ phát hành để các kiểm tra rộng hơn về
  chu trình import và ranh giới kiến trúc đều xanh bên ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành
  `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực đóng gói
- Chạy `pnpm release:prep` sau khi tăng phiên bản gốc và trước khi gắn thẻ. Lệnh này
  chạy mọi trình tạo phát hành tất định thường bị lệch sau thay đổi
  phiên bản/cấu hình/API: phiên bản Plugin, kiểm kê Plugin, schema cấu hình cơ sở,
  siêu dữ liệu cấu hình kênh đóng gói, baseline tài liệu cấu hình, export của SDK Plugin,
  và baseline API SDK Plugin. `pnpm release:check` chạy lại các
  guard đó ở chế độ kiểm tra và báo cáo mọi lỗi lệch sinh ra mà nó tìm thấy trong một
  lượt trước khi chạy kiểm tra phát hành gói.
- Đồng bộ phiên bản Plugin cập nhật phiên bản gói Plugin chính thức và các mức sàn
  `openclaw.compat.pluginApi` hiện có lên phiên bản phát hành OpenClaw theo
  mặc định. Hãy coi trường đó là mức sàn API SDK/runtime của Plugin, không chỉ là bản sao
  của phiên bản gói: với các bản phát hành chỉ dành cho Plugin được chủ ý giữ
  tương thích với các host OpenClaw cũ hơn, hãy giữ mức sàn ở API host cũ nhất được hỗ trợ
  và ghi lại lựa chọn đó trong bằng chứng phát hành Plugin.
- Chạy workflow thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi động tất cả hộp kiểm thử tiền phát hành từ một điểm vào. Workflow này nhận một nhánh,
  thẻ, hoặc SHA commit đầy đủ, dispatch `CI` thủ công, và dispatch
  `OpenClaw Release Checks` cho kiểm tra khói cài đặt, chấp nhận gói, kiểm tra gói
  đa hệ điều hành, đối sánh QA Lab, Matrix, và các lane Telegram. Các lượt chạy stable và full
  luôn bao gồm live/E2E toàn diện và soak đường dẫn phát hành Docker;
  `run_release_soak=true` được giữ lại cho một lượt soak beta tường minh. Package
  Acceptance cung cấp Telegram E2E gói chuẩn trong quá trình xác thực candidate,
  tránh một live poller thứ hai chạy đồng thời.
  Cung cấp `release_package_spec` sau khi xuất bản beta để tái sử dụng gói npm
  đã phát hành trên các kiểm tra phát hành, Package Acceptance, và Telegram E2E
  của gói mà không build lại tarball phát hành. Chỉ cung cấp
  `npm_telegram_package_spec` khi Telegram cần dùng một gói đã xuất bản khác với
  phần còn lại của xác thực phát hành. Cung cấp
  `package_acceptance_package_spec` khi Package Acceptance cần dùng một
  gói đã xuất bản khác với đặc tả gói phát hành. Cung cấp
  `evidence_package_spec` khi báo cáo bằng chứng phát hành cần chứng minh rằng quá trình
  xác thực khớp với một gói npm đã xuất bản mà không buộc chạy Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Chạy workflow thủ công `Package Acceptance` khi bạn muốn có bằng chứng kênh phụ
  cho một gói candidate trong khi công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành chính xác; `source=ref`
  để đóng gói một nhánh/thẻ/SHA `package_ref` đáng tin cậy bằng harness
  `workflow_ref` hiện tại; `source=url` cho một tarball HTTPS công khai với
  SHA-256 bắt buộc và chính sách URL công khai nghiêm ngặt; `source=trusted-url` cho một
  chính sách nguồn đáng tin cậy có tên bằng `trusted_source_id` và SHA-256 bắt buộc; hoặc
  `source=artifact` cho tarball được tải lên bởi một lượt chạy GitHub Actions khác. Workflow
  phân giải candidate thành
  `package-under-test`, tái sử dụng bộ lập lịch phát hành Docker E2E với tarball đó,
  và có thể chạy QA Telegram với cùng tarball bằng
  `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các
  lane Docker được chọn bao gồm `published-upgrade-survivor`, artifact gói là candidate
  và `published_upgrade_survivor_baseline` chọn baseline đã xuất bản.
  `update-restart-auth` dùng gói candidate làm cả CLI đã cài đặt lẫn package-under-test
  để nó kiểm thử đường dẫn khởi động lại được quản lý của lệnh cập nhật candidate.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Hồ sơ phổ biến:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway, và tải lại cấu hình
  - `package`: các lane gói/cập nhật/khởi động lại/Plugin gốc artifact không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ gói cộng với kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI, và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lượt chạy lại tập trung
- Chạy trực tiếp workflow thủ công `CI` khi bạn chỉ cần độ bao phủ CI bình thường
  tất định cho release candidate. Các dispatch CI thủ công bỏ qua phạm vi thay đổi
  và ép chạy các shard Linux Node, shard Plugin đóng gói, shard hợp đồng Plugin và
  kênh, tương thích Node 22, `check-*`, `check-additional-*`,
  kiểm tra khói artifact đã build, kiểm tra tài liệu, Python skills, Windows, macOS, và
  các lane i18n Control UI. Các lượt chạy CI thủ công độc lập chỉ chạy Android khi được dispatch
  với `include_android=true`; `Full Release Validation` truyền input đó cho
  CI con của nó.
  Ví dụ với Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này kiểm thử
  QA-lab qua một bộ nhận OTLP/HTTP cục bộ và xác minh export trace, metric, và log
  cùng với thuộc tính trace có giới hạn và biên tập nội dung/định danh mà không
  yêu cầu Opik, Langfuse, hoặc bộ thu thập bên ngoài khác.
- Chạy `pnpm qa:otel:collector-smoke` khi xác thực khả năng tương thích collector.
  Lệnh này định tuyến cùng export OTLP của QA-lab qua một container Docker OpenTelemetry Collector
  thật trước các assertion của bộ nhận cục bộ.
- Chạy `pnpm qa:prometheus:smoke` khi xác thực scrape Prometheus được bảo vệ.
  Lệnh này kiểm thử QA-lab, từ chối các lượt scrape chưa xác thực, và xác minh
  các họ metric trọng yếu cho phát hành không chứa nội dung prompt, định danh thô,
  token xác thực, và đường dẫn cục bộ.
- Chạy `pnpm qa:observability:smoke` khi bạn muốn chạy nối tiếp các lane khói
  OpenTelemetry và Prometheus từ source-checkout.
- Chạy `pnpm release:check` trước mọi bản phát hành có gắn thẻ
- Bước kiểm tra sơ bộ `OpenClaw NPM Release` tạo bằng chứng phát hành phụ thuộc trước khi
  đóng gói tarball npm. Cổng lỗ hổng advisory npm là điều kiện chặn phát hành.
  Rủi ro manifest bắc cầu, bề mặt sở hữu/cài đặt phụ thuộc,
  và báo cáo thay đổi phụ thuộc chỉ là bằng chứng phát hành. Báo cáo thay đổi
  phụ thuộc so sánh release candidate với thẻ phát hành có thể truy cập trước đó.
- Bước kiểm tra sơ bộ tải bằng chứng phụ thuộc lên dưới dạng
  `openclaw-release-dependency-evidence-<tag>` và cũng nhúng nó dưới
  `dependency-evidence/` bên trong artifact kiểm tra sơ bộ npm đã chuẩn bị. Đường dẫn
  xuất bản thật tái sử dụng artifact kiểm tra sơ bộ đó, rồi đính kèm cùng bằng chứng
  vào bản phát hành GitHub dưới dạng `openclaw-<version>-dependency-evidence.zip`.
- Chạy `OpenClaw Release Publish` cho chuỗi xuất bản có thay đổi sau khi
  thẻ tồn tại. Dispatch từ `release/YYYY.M.PATCH` (hoặc `main` khi xuất bản một
  thẻ có thể truy cập từ main), truyền thẻ phát hành, `preflight_run_id` npm
  OpenClaw thành công, và `full_release_validation_run_id` thành công, đồng thời giữ
  phạm vi xuất bản Plugin mặc định `all-publishable` trừ khi bạn cố ý
  chạy một lượt sửa chữa tập trung. Workflow tuần tự hóa xuất bản npm Plugin, xuất bản
  ClawHub Plugin, và xuất bản npm OpenClaw để gói core không được xuất bản
  trước các Plugin đã externalize của nó.
- `OpenClaw Release Publish` stable yêu cầu một `windows_node_tag` chính xác sau khi
  bản phát hành `openclaw/openclaw-windows-node` không phải prerelease tương ứng tồn tại.
  Nó cũng yêu cầu map `windows_node_installer_digests` đã được candidate phê duyệt.
  Trước khi dispatch bất kỳ workflow con xuất bản nào, nó xác minh bản phát hành nguồn đó
  đã được xuất bản, không phải prerelease, chứa các trình cài đặt x64/ARM64 bắt buộc, và
  vẫn khớp với map đã phê duyệt đó. Sau đó nó dispatch `Windows Node Release`
  trong khi bản phát hành OpenClaw vẫn còn là bản nháp, mang theo map digest trình cài đặt
  đã ghim mà không đổi. Workflow con
  tải xuống các trình cài đặt Windows Hub đã ký từ đúng thẻ đó,
  khớp chúng với các digest đã ghim, xác minh chữ ký Authenticode của chúng dùng signer
  OpenClaw Foundation dự kiến trên runner Windows, ghi manifest SHA-256, và tải
  các trình cài đặt cùng manifest lên bản phát hành GitHub OpenClaw chuẩn, rồi tải lại
  các asset đã được promote và xác minh thành phần manifest cùng các hash. Workflow cha xác minh
  hợp đồng asset x64, ARM64, và checksum hiện tại trước khi công bố. Khôi phục trực tiếp
  từ chối các tên asset `OpenClawCompanion-*` ngoài dự kiến trước khi thay thế
  các asset hợp đồng dự kiến bằng byte nguồn đã ghim. Chỉ dispatch thủ công
  `Windows Node Release` để khôi phục, và luôn truyền một thẻ chính xác, không bao giờ
  `latest`, cộng với map JSON `expected_installer_digests` tường minh từ
  bản phát hành nguồn đã phê duyệt. Liên kết tải xuống website nên trỏ tới URL asset bản phát hành
  OpenClaw chính xác cho bản stable hiện tại, hoặc
  `releases/latest/download/...` chỉ sau khi xác minh chuyển hướng latest của GitHub
  trỏ tới cùng bản phát hành đó; đừng chỉ liên kết tới trang phát hành repo companion.
- Kiểm tra phát hành hiện chạy trong một workflow thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane đối sánh mock QA Lab cộng với hồ sơ
  Matrix live nhanh và lane QA Telegram trước khi phê duyệt phát hành. Các lane live
  dùng môi trường `qa-live-shared`; Telegram cũng dùng lease thông tin xác thực Convex CI.
  Chạy workflow thủ công `QA-Lab - All Lanes` với
  `matrix_profile=all` và `matrix_shards=true` khi bạn muốn kiểm kê đầy đủ transport
  Matrix, media, và E2EE song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của
  `OpenClaw Release Checks` và `Full Release Validation` công khai, gọi trực tiếp
  workflow tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Sự tách này là có chủ ý: giữ đường dẫn phát hành npm thật ngắn,
  tất định, và tập trung vào artifact, trong khi các kiểm tra live chậm hơn ở lane riêng
  để chúng không làm trì hoãn hoặc chặn xuất bản
- Các kiểm tra phát hành chứa bí mật nên được dispatch qua `Full Release
Validation` hoặc từ ref workflow `main`/release để logic workflow và
  bí mật vẫn được kiểm soát
- `OpenClaw Release Checks` chấp nhận một nhánh, thẻ, hoặc SHA commit đầy đủ miễn là
  commit được phân giải có thể truy cập từ một nhánh OpenClaw hoặc thẻ phát hành
- Bước kiểm tra sơ bộ chỉ-xác-thực `OpenClaw NPM Release` cũng chấp nhận SHA commit
  nhánh workflow hiện tại đủ 40 ký tự mà không yêu cầu thẻ đã được push
- Đường dẫn SHA đó chỉ dành cho xác thực và không thể được promote thành xuất bản thật
- Ở chế độ SHA, workflow chỉ tổng hợp `v<package.json version>` cho bước kiểm tra
  siêu dữ liệu gói; xuất bản thật vẫn yêu cầu một thẻ phát hành thật
- Cả hai workflow giữ đường dẫn xuất bản và promote thật trên runner do GitHub host,
  trong khi đường dẫn xác thực không thay đổi có thể dùng các runner Linux Blacksmith lớn hơn
- Workflow đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả hai secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Bước kiểm tra sơ bộ phát hành npm không còn chờ lane kiểm tra phát hành riêng
- Trước khi gắn thẻ release candidate cục bộ, chạy
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Helper này
  chạy các guardrail phát hành nhanh, kiểm tra phát hành npm/ClawHub của Plugin, build,
  build UI, và `release:openclaw:npm:check` theo thứ tự giúp bắt các lỗi phổ biến
  chặn phê duyệt trước khi workflow xuất bản GitHub bắt đầu.
- Chạy `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc thẻ beta/correction tương ứng) trước khi phê duyệt
- Sau khi xuất bản npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (hoặc phiên bản beta/sửa lỗi tương ứng) để xác minh đường dẫn cài đặt
  registry đã phát hành trong một tiền tố tạm thời mới
- Sau khi phát hành beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh quá trình onboarding gói đã cài đặt, thiết lập Telegram và E2E Telegram thực
  với gói npm đã phát hành bằng cách dùng nhóm thông tin xác thực Telegram được thuê dùng chung.
  Các lần chạy lẻ cục bộ của người bảo trì có thể bỏ qua các biến Convex và truyền trực tiếp ba
  thông tin xác thực môi trường `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy toàn bộ smoke beta sau phát hành từ máy của người bảo trì, dùng `pnpm release:beta-smoke -- --beta betaN`. Helper chạy xác thực cập nhật npm Parallels/mục tiêu mới, dispatch `NPM Telegram Beta E2E`, thăm dò workflow run chính xác, tải artifact xuống và in báo cáo Telegram.
- Người bảo trì có thể chạy cùng kiểm tra sau phát hành từ GitHub Actions qua workflow
  thủ công `NPM Telegram Beta E2E`. Workflow này cố ý chỉ chạy thủ công và
  không chạy trên mọi lần merge.
- Tự động hóa phát hành của người bảo trì hiện dùng preflight-rồi-promote:
  - phát hành npm thật phải vượt qua một npm `preflight_run_id` thành công
  - phát hành npm thật phải được dispatch từ cùng nhánh `main` hoặc
    `release/YYYY.M.PATCH` với lần chạy preflight thành công
  - các bản phát hành npm ổn định mặc định dùng `beta`
  - phát hành npm ổn định có thể nhắm rõ tới `latest` qua input workflow
  - việc thay đổi npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` vì
    `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo nguồn chỉ giữ publish
    dùng OIDC
  - `macOS Release` công khai chỉ dùng để xác thực; khi một tag chỉ tồn tại trên
    nhánh phát hành nhưng workflow được dispatch từ `main`, đặt
    `public_release_branch=release/YYYY.M.PATCH`
  - phát hành macOS thật phải vượt qua macOS `preflight_run_id` và
    `validate_run_id` thành công
  - các đường dẫn publish thật promote artifact đã chuẩn bị thay vì build lại
    chúng lần nữa
- Với các bản phát hành sửa lỗi ổn định như `YYYY.M.PATCH-N`, trình xác minh sau phát hành
  cũng kiểm tra cùng đường dẫn nâng cấp tiền tố tạm thời từ `YYYY.M.PATCH` lên `YYYY.M.PATCH-N`
  để các bản sửa lỗi phát hành không thể âm thầm để các bản cài đặt global cũ hơn ở lại payload
  ổn định cơ sở
- Preflight phát hành npm fail đóng trừ khi tarball bao gồm cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không ship lại dashboard trình duyệt rỗng
- Xác minh sau phát hành cũng kiểm tra rằng các entrypoint Plugin đã phát hành và
  metadata gói có mặt trong layout registry đã cài đặt. Một bản phát hành
  ship thiếu payload runtime Plugin sẽ fail trình xác minh sau publish và
  không thể được promote lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách npm pack `unpackedSize` trên
  tarball cập nhật ứng viên, để e2e trình cài đặt bắt được tình trạng pack phình to ngoài ý muốn
  trước đường dẫn publish phát hành
- Nếu công việc phát hành đã chạm vào lập kế hoạch CI, manifest thời gian tiện ích mở rộng hoặc
  ma trận kiểm thử tiện ích mở rộng, hãy tạo lại và review các output ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành không
  mô tả một layout CI đã lỗi thời
- Mức sẵn sàng phát hành macOS ổn định cũng bao gồm các bề mặt updater:
  - bản phát hành GitHub phải kết thúc với các gói `.zip`, `.dmg` và `.dSYM.zip`
  - `appcast.xml` trên `main` phải trỏ tới zip ổn định mới sau khi publish; workflow
    publish macOS tự động commit nó, hoặc mở một PR appcast
    khi push trực tiếp bị chặn
  - app đã đóng gói phải giữ bundle id không phải debug, URL feed Sparkle không rỗng
    và `CFBundleVersion` bằng hoặc cao hơn mức sàn build Sparkle chuẩn
    cho phiên bản phát hành đó

## Các hộp kiểm thử bản phát hành

`Full Release Validation` là cách người vận hành khởi chạy tất cả kiểm thử tiền phát hành từ
một điểm vào duy nhất. Để có bằng chứng commit được ghim trên một nhánh thay đổi nhanh, hãy dùng
trình trợ giúp để mọi workflow con chạy từ một nhánh tạm thời được cố định tại SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Trình trợ giúp đẩy `release-ci/<sha>-...`, dispatch `Full Release Validation`
từ nhánh đó với `ref=<sha>`, xác minh mọi workflow con có `headSha`
khớp với mục tiêu, rồi xóa nhánh tạm thời. Điều này tránh việc vô tình chứng minh một
lần chạy con của `main` mới hơn.

Để xác thực nhánh hoặc thẻ phát hành, hãy chạy từ workflow ref `main` đáng tin cậy
và truyền nhánh hoặc thẻ phát hành làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Workflow phân giải ref mục tiêu, dispatch `CI` thủ công với
`target_ref=<release-ref>`, rồi dispatch `OpenClaw Release Checks`.
`OpenClaw Release Checks` phân tán kiểm thử khói cài đặt, kiểm tra phát hành đa hệ điều hành,
phạm vi đường dẫn phát hành Docker live/E2E khi bật soak, Package Acceptance
với E2E gói Telegram chuẩn tắc, đối sánh QA Lab, Matrix live và Telegram
live. Một lần chạy full/all chỉ được chấp nhận khi bản tóm tắt `Full Release Validation`
hiển thị `normal_ci`, `plugin_prerelease` và `release_checks` là
thành công, trừ khi một lần chạy lại tập trung cố ý bỏ qua child `Plugin
Prerelease` riêng biệt. Chỉ dùng child `npm-telegram` độc lập cho một lần chạy lại
tập trung trên gói đã phát hành với `release_package_spec` hoặc
`npm_telegram_package_spec`. Bản tóm tắt verifier cuối cùng bao gồm các bảng job chậm nhất
cho từng lần chạy child, để release manager có thể thấy đường găng hiện tại mà không cần tải log.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn đầy đủ, tên job workflow chính xác, khác biệt giữa profile stable và full,
artifact và các handle chạy lại tập trung.
Các workflow con được dispatch từ ref đáng tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` mục tiêu trỏ tới một
nhánh hoặc thẻ phát hành cũ hơn. Không có input workflow-ref Full Release Validation
riêng; hãy chọn harness đáng tin cậy bằng cách chọn ref chạy workflow.
Không dùng `--ref main -f ref=<sha>` để chứng minh commit chính xác trên `main` đang thay đổi;
SHA commit thô không thể là workflow dispatch ref, vì vậy hãy dùng
`pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời được ghim.

Dùng `release_profile` để chọn độ rộng live/provider:

- `minimum`: đường dẫn OpenAI/core live và Docker quan trọng cho phát hành nhanh nhất
- `stable`: minimum cộng thêm phạm vi provider/backend stable để phê duyệt phát hành
- `full`: stable cộng thêm phạm vi provider/media tư vấn rộng

Xác thực stable và full luôn chạy live/E2E đầy đủ, đường dẫn phát hành Docker
và đợt quét published upgrade-survivor có giới hạn trước khi promote.
Dùng `run_release_soak=true` để yêu cầu cùng đợt quét đó cho beta. Đợt quét đó bao phủ
bốn gói stable mới nhất cộng với các baseline được ghim `2026.4.23` và `2026.5.2`
cộng thêm phạm vi `2026.4.15` cũ hơn, với các baseline trùng lặp được loại bỏ và
mỗi baseline được shard vào job runner Docker riêng.

`OpenClaw Release Checks` dùng workflow ref đáng tin cậy để phân giải ref mục tiêu
một lần thành `release-package-under-test` và tái sử dụng artifact đó trong các kiểm tra đa hệ điều hành,
Package Acceptance và Docker đường dẫn phát hành khi soak chạy. Điều này giữ
mọi hộp hướng gói trên cùng một byte và tránh build gói lặp lại.
Sau khi beta đã có trên npm, đặt `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
để release checks tải gói đã phát hành một lần, trích xuất SHA nguồn build của nó
từ `dist/build-info.json`, và tái sử dụng artifact đó cho đa hệ điều hành,
Package Acceptance, Docker đường dẫn phát hành và các lane Telegram của gói.
Kiểm thử khói cài đặt OpenAI đa hệ điều hành dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4`, vì lane này đang
chứng minh cài đặt gói, onboarding, khởi động Gateway và một lượt agent live
thay vì benchmark model mặc định chậm nhất. Ma trận provider live rộng hơn
vẫn là nơi dành cho phạm vi theo model cụ thể.

Dùng các biến thể này tùy theo giai đoạn phát hành:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
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
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Không dùng umbrella đầy đủ làm lần chạy lại đầu tiên sau một bản sửa tập trung. Nếu một hộp
thất bại, hãy dùng workflow con, job, lane Docker, profile gói, provider model
hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi
bản sửa đã thay đổi điều phối phát hành dùng chung hoặc khiến bằng chứng tất cả hộp trước đó
không còn mới. Verifier cuối cùng của umbrella kiểm tra lại các id lần chạy workflow con
đã ghi, vì vậy sau khi một workflow con được chạy lại thành công, chỉ chạy lại job cha
`Verify full validation` đã thất bại.

Để khôi phục có giới hạn, truyền `rerun_group` cho umbrella. `all` là lần chạy
release-candidate thật, `ci` chỉ chạy child CI bình thường, `plugin-prerelease`
chỉ chạy child Plugin chỉ dành cho phát hành, `release-checks` chạy mọi hộp phát hành,
và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` và `npm-telegram`.
Các lần chạy lại `npm-telegram` tập trung yêu cầu `release_package_spec` hoặc
`npm_telegram_package_spec`; các lần chạy full/all dùng E2E Telegram của gói chuẩn tắc
bên trong Package Acceptance. Các lần chạy lại
cross-OS tập trung có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc
một bộ lọc OS/suite khác. Lỗi QA release-check chặn xác thực phát hành
bình thường, bao gồm drift công cụ động OpenClaw bắt buộc trong tầng tiêu chuẩn.
Các lần chạy Tideclaw alpha vẫn có thể coi các lane release-check không liên quan đến an toàn gói là
tư vấn. Khi `live_suite_filter` yêu cầu rõ ràng một lane QA live có cổng như
Discord, WhatsApp hoặc Slack, biến repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` tương ứng phải được bật; nếu không,
việc thu thập input sẽ thất bại thay vì âm thầm bỏ qua lane.

### Vitest

Hộp Vitest là workflow con `CI` thủ công. CI thủ công cố ý
bỏ qua phạm vi changed và ép đồ thị kiểm thử bình thường cho release
candidate: các shard Linux Node, shard bundled-plugin, shard hợp đồng Plugin và channel,
tương thích Node 22, `check-*`, `check-additional-*`,
kiểm thử khói artifact đã build, kiểm tra tài liệu, Python skills, Windows, macOS,
và i18n Control UI. Android được bao gồm khi `Full Release Validation` chạy hộp
vì umbrella truyền `include_android=true`; CI thủ công độc lập
yêu cầu `include_android=true` để có phạm vi Android.

Dùng hộp này để trả lời "cây nguồn có vượt qua bộ kiểm thử bình thường đầy đủ không?"
Nó không giống với xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần giữ:

- bản tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã dispatch
- lần chạy `CI` xanh trên đúng SHA mục tiêu
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI bình thường xác định nhưng
không cần các hộp Docker, QA Lab, live, đa hệ điều hành hoặc gói. Dùng lệnh đầu tiên
cho CI trực tiếp không Android. Thêm `include_android=true` khi CI
release-candidate trực tiếp phải bao phủ Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Hộp Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng với workflow
`install-smoke` ở chế độ phát hành. Nó xác thực release candidate thông qua
môi trường Docker đóng gói thay vì chỉ các kiểm thử cấp nguồn.

Phạm vi Docker phát hành bao gồm:

- kiểm thử khói cài đặt đầy đủ với kiểm thử khói cài đặt toàn cục Bun chậm được bật
- chuẩn bị/tái sử dụng image kiểm thử khói Dockerfile gốc theo SHA mục tiêu, với các job QR,
  root/gateway và installer/Bun smoke chạy dưới dạng các shard install-smoke riêng biệt
- các lane E2E của repository
- các chunk Docker đường dẫn phát hành: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài đặt/gỡ cài đặt bundled Plugin được tách
  `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các bộ provider live/E2E và phạm vi model live Docker khi release checks
  bao gồm các bộ live

Dùng artifact Docker trước khi chạy lại. Scheduler đường dẫn phát hành tải lên
`.artifacts/docker-tests/` với log lane, `summary.json`, `failures.json`,
thời gian pha, JSON kế hoạch scheduler và lệnh chạy lại. Để khôi phục tập trung,
dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì
chạy lại tất cả các chunk phát hành. Các lệnh chạy lại được tạo bao gồm
`package_artifact_run_id` trước đó và input image Docker đã chuẩn bị khi có, để một
lane thất bại có thể tái sử dụng cùng tarball và image GHCR.

### QA Lab

Hộp QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành
hành vi agentic và cấp channel, tách biệt với cơ chế gói Vitest và Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane đối sánh mock so sánh lane candidate OpenAI với baseline Opus 4.6
  bằng agentic parity pack
- profile QA Matrix live nhanh dùng môi trường `qa-live-shared`
- lane QA Telegram live dùng lease thông tin xác thực Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` hoặc
  `pnpm qa:observability:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng hộp này để trả lời "bản phát hành có hành xử đúng trong các kịch bản QA và
luồng channel live không?" Giữ URL artifact cho các lane đối sánh, Matrix và Telegram
khi phê duyệt bản phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng
lần chạy QA-Lab shard thủ công thay vì lane mặc định quan trọng cho phát hành.

### Gói

Hộp Gói là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và resolver
`scripts/resolve-openclaw-package-candidate.mjs`. Resolver chuẩn hóa một
candidate thành tarball `package-under-test` được Docker E2E tiêu thụ, xác thực
inventory gói, ghi lại phiên bản gói và SHA-256, đồng thời giữ ref harness
workflow tách biệt với ref nguồn gói.

Các nguồn candidate được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw chính xác
  version
- `source=ref`: đóng gói một nhánh, thẻ hoặc SHA commit đầy đủ `package_ref` đáng tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS công khai với `package_sha256` bắt buộc;
  thông tin xác thực URL, cổng HTTPS không mặc định, tên máy chủ hoặc địa chỉ đã phân giải
  riêng tư/nội bộ/dùng cho mục đích đặc biệt, và chuyển hướng không an toàn sẽ bị từ chối
- `source=trusted-url`: tải xuống một `.tgz` HTTPS với
  `package_sha256` và `trusted_source_id` bắt buộc từ một chính sách được đặt tên trong
  `.github/package-trusted-sources.json`; dùng tùy chọn này cho các mirror doanh nghiệp
  do maintainer sở hữu hoặc kho gói riêng thay vì thêm cơ chế bỏ qua mạng riêng
  ở cấp input vào `source=url`
- `source=artifact`: dùng lại một `.tgz` do một lần chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Chấp nhận gói với `source=artifact`, artifact gói phát hành
đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Chấp nhận gói giữ QA migration, update,
khởi động lại update configured-auth, cài đặt skill ClawHub trực tiếp, dọn dẹp dependency plugin cũ, fixture plugin offline,
update plugin, và gói Telegram trên cùng tarball đã phân giải. Các kiểm tra phát hành chặn dùng baseline gói đã phát hành mới nhất mặc định; hồ sơ beta với `run_release_soak=true`, `release_profile=stable`, hoặc
`release_profile=full` mở rộng sang mọi baseline ổn định đã phát hành trên npm từ
`2026.4.23` đến `latest` cộng với fixture cho vấn đề đã báo cáo. Dùng
Chấp nhận gói với `source=npm` cho một candidate đã phát hành,
`source=ref` cho tarball npm cục bộ có SHA hậu thuẫn trước khi publish,
`source=trusted-url` cho mirror doanh nghiệp/riêng do maintainer sở hữu, hoặc
`source=artifact` cho tarball đã chuẩn bị do một lần chạy GitHub Actions khác tải lên.
Đây là giải pháp thay thế gốc GitHub
cho phần lớn phạm vi kiểm thử package/update trước đây cần
Parallels. Kiểm tra phát hành đa hệ điều hành vẫn quan trọng cho onboarding,
trình cài đặt, và hành vi nền tảng theo từng OS, nhưng xác thực sản phẩm package/update nên
ưu tiên Chấp nhận gói.

Checklist chuẩn cho xác thực update và plugin là
[Kiểm thử update và plugin](/vi/help/testing-updates-plugins). Dùng checklist này khi
quyết định lane cục bộ, Docker, Chấp nhận gói, hoặc kiểm tra phát hành nào chứng minh một
thay đổi cài đặt/update plugin, dọn dẹp doctor, hoặc migration gói đã phát hành.
Migration update đã phát hành đầy đủ từ mọi gói ổn định `2026.4.23+` là
workflow thủ công `Update Migration` riêng, không thuộc CI phát hành đầy đủ.

Độ nới lỏng chấp nhận gói legacy được cố ý giới hạn thời gian. Các gói đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống metadata đã phát hành
lên npm: mục inventory QA riêng tư bị thiếu khỏi tarball, thiếu
`gateway install --wrapper`, thiếu file patch trong fixture git bắt nguồn từ tarball,
thiếu `update.channel` đã lưu, vị trí install-record plugin legacy,
thiếu lưu install-record marketplace, và migration metadata config
trong `plugins update`. Gói `2026.4.26` đã phát hành có thể cảnh báo
về các file stamp metadata bản build cục bộ đã được phát hành. Các gói sau đó
phải đáp ứng hợp đồng gói hiện đại; cùng những khoảng trống đó sẽ làm xác thực
phát hành thất bại.

Dùng các hồ sơ Chấp nhận gói rộng hơn khi câu hỏi phát hành liên quan đến một
gói có thể cài đặt thực tế:

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

- `smoke`: các lane cài đặt gói/channel/agent, mạng gateway, và tải lại config
  nhanh
- `package`: hợp đồng gói install/update/restart/plugin cộng với bằng chứng cài đặt
  skill ClawHub trực tiếp; đây là mặc định của kiểm tra phát hành
- `product`: `package` cộng với channel MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI,
  và OpenWebUI
- `full`: các phần đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để có bằng chứng Telegram cho package-candidate, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Chấp nhận gói. Workflow truyền tarball
`package-under-test` đã phân giải vào lane Telegram; workflow Telegram độc lập
vẫn chấp nhận spec npm đã phát hành cho các kiểm tra sau publish.

## Tự động hóa publish phát hành

`OpenClaw Release Publish` là entrypoint publish có thay đổi trạng thái thông thường. Nó
điều phối các workflow trusted-publisher theo thứ tự mà bản phát hành cần:

1. Check out thẻ phát hành và phân giải SHA commit của thẻ đó.
2. Xác minh thẻ có thể truy cập từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` với cùng scope và SHA.
6. Dispatch `OpenClaw NPM Release` với thẻ phát hành, npm dist-tag, và
   `preflight_run_id` đã lưu sau khi xác minh
   `full_release_validation_run_id` đã lưu.
7. Với bản phát hành ổn định, tạo hoặc cập nhật GitHub release dưới dạng bản nháp, dispatch
   `Windows Node Release` với `windows_node_tag` rõ ràng và
   `windows_node_installer_digests` đã được candidate phê duyệt, rồi xác minh các
   asset trình cài đặt/checksum chuẩn trước khi publish bản nháp.

Ví dụ publish beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Publish ổn định vào dist-tag beta mặc định:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Promote bản ổn định trực tiếp lên `latest` là thao tác rõ ràng:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Chỉ dùng các workflow cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release`
cho công việc sửa chữa hoặc republish tập trung. `OpenClaw Release Publish` từ chối
`plugin_publish_scope=selected` khi `publish_openclaw_npm=true` để gói core
không thể phát hành nếu thiếu mọi plugin chính thức có thể publish, bao gồm
`@openclaw/diffs-language-pack`. Để sửa chữa plugin được chọn, đặt
`publish_openclaw_npm=false` với `plugin_publish_scope=selected` và
`plugins=@openclaw/name`, hoặc dispatch workflow con trực tiếp.

## Input workflow NPM

`OpenClaw NPM Release` chấp nhận các input do operator kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, giá trị này cũng có thể là
  SHA commit đầy đủ 40 ký tự hiện tại của nhánh workflow cho preflight chỉ xác thực
- `preflight_only`: `true` để chỉ xác thực/build/package, `false` cho đường dẫn
  publish thật
- `preflight_run_id`: bắt buộc trên đường dẫn publish thật để workflow dùng lại
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `npm_dist_tag`: thẻ đích npm cho đường dẫn publish; mặc định là `beta`

`OpenClaw Release Publish` chấp nhận các input do operator kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id lần chạy `Full Release Validation` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `windows_node_tag`: thẻ phát hành `openclaw/openclaw-windows-node`
  chính xác không phải prerelease; bắt buộc cho publish OpenClaw ổn định
- `windows_node_installer_digests`: map JSON compact đã được candidate phê duyệt của
  tên trình cài đặt Windows hiện tại sang digest `sha256:` đã ghim; bắt buộc
  cho publish OpenClaw ổn định
- `npm_dist_tag`: thẻ đích npm cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa chỉ plugin tập trung với `publish_openclaw_npm=false`
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng
  workflow làm bộ điều phối sửa chữa chỉ plugin
- `wait_for_clawhub`: mặc định là `false` để tính sẵn có của npm không bị chặn bởi
  sidecar ClawHub; chỉ đặt `true` khi việc hoàn tất workflow phải bao gồm
  hoàn tất ClawHub

`OpenClaw Release Checks` chấp nhận các input do operator kiểm soát sau:

- `ref`: nhánh, thẻ, hoặc SHA commit đầy đủ để xác thực. Các kiểm tra mang secret
  yêu cầu commit đã phân giải phải có thể truy cập từ một nhánh OpenClaw hoặc
  thẻ phát hành.
- `run_release_soak`: chọn tham gia soak live/E2E đầy đủ, đường dẫn phát hành Docker, và
  upgrade-survivor từ tất cả phiên bản kể từ trước đến nay cho kiểm tra phát hành beta. Tùy chọn này bị buộc bật bởi
  `release_profile=stable` và `release_profile=full`.

Quy tắc:

- Thẻ ổn định và thẻ sửa lỗi có thể publish vào `beta` hoặc `latest`
- Thẻ prerelease beta chỉ có thể publish vào `beta`
- Với `OpenClaw NPM Release`, input SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ xác thực
- Đường dẫn publish thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh metadata đó trước khi publish tiếp tục

## Trình tự phát hành npm ổn định

Khi cắt một bản phát hành npm ổn định:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi có thẻ, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh workflow
     để chạy thử khô chỉ xác thực cho workflow tiền kiểm
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc chỉ chọn `latest`
   khi bạn cố ý muốn publish ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành, hoặc SHA commit
   đầy đủ khi bạn muốn CI thông thường cùng phạm vi bao phủ live prompt cache, Docker, QA Lab,
   Matrix, và Telegram từ một workflow thủ công
4. Nếu bạn cố ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành thay vào đó
5. Chọn đúng thẻ phát hành `openclaw/openclaw-windows-node` không phải prerelease
   có bộ cài x64 và ARM64 đã ký cần được phát hành. Lưu thẻ đó dưới dạng
   `windows_node_tag`, và lưu bản đồ digest đã xác thực của chúng dưới dạng
   `windows_node_installer_digests`. Trình trợ giúp release-candidate ghi lại cả hai
   và đưa chúng vào lệnh publish được tạo.
6. Lưu `preflight_run_id` và `full_release_validation_run_id` thành công
7. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`,
   `windows_node_tag` đã chọn, `windows_node_installer_digests` đã lưu của nó,
   `preflight_run_id` đã lưu, và `full_release_validation_run_id` đã lưu;
   workflow này publish các Plugin đã ngoại hóa lên npm và ClawHub trước khi quảng bá
   gói npm OpenClaw
8. Nếu bản phát hành đã vào `beta`, hãy dùng workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   để quảng bá phiên bản ổn định đó từ `beta` lên `latest`
9. Nếu bản phát hành cố ý publish trực tiếp lên `latest` và `beta`
   cần theo cùng bản dựng ổn định ngay lập tức, hãy dùng cùng workflow phát hành đó
   để trỏ cả hai dist-tag vào phiên bản ổn định, hoặc để đồng bộ tự phục hồi theo lịch
   của workflow chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo sổ cái phát hành vì nó vẫn yêu cầu
`NPM_TOKEN`, trong khi repo nguồn giữ publish chỉ dùng OIDC.

Điều đó giữ cho cả đường dẫn publish trực tiếp và đường dẫn quảng bá beta-trước
đều được ghi thành tài liệu và hiển thị cho người vận hành.

Nếu maintainer phải quay về xác thực npm cục bộ, chỉ chạy mọi lệnh CLI 1Password
(`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell chính của agent; việc giữ nó bên trong tmux giúp các lời nhắc,
cảnh báo, và xử lý OTP có thể quan sát được, đồng thời ngăn cảnh báo máy chủ lặp lại.

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
