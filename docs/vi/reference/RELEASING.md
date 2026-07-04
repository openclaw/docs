---
read_when:
    - Đang tìm các định nghĩa kênh phát hành công khai
    - Chạy xác thực bản phát hành hoặc chấp nhận gói
    - Tìm kiếm cách đặt tên phiên bản và nhịp phát hành
summary: Các luồng phát hành, danh sách kiểm tra cho người vận hành, hộp xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-07-04T18:08:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hiện cung cấp ba kênh cập nhật hướng người dùng:

- stable: kênh phát hành được quảng bá hiện có, hiện vẫn phân giải qua
  npm `latest` cho đến khi mốc CLI/kênh riêng được hoàn tất
- beta: các thẻ phát hành trước được xuất bản lên npm `beta`
- dev: đầu nhánh luôn di chuyển của `main`

Riêng biệt, người vận hành phát hành có thể xuất bản gói lõi của tháng đã hoàn tất
gần nhất lên npm `extended-stable`, bắt đầu từ bản vá `33`. Dòng final thông thường
của tháng hiện tại tiếp tục nằm trên npm `latest`; việc tách xuất bản phía vận hành này
tự nó không thay đổi cách phân giải kênh cập nhật của CLI.

## Đặt tên phiên bản

- Phiên bản phát hành extended-stable hằng tháng trên npm: `YYYY.M.PATCH`, với `PATCH >= 33`
  - Thẻ Git: `vYYYY.M.PATCH`
- Phiên bản phát hành final hằng ngày/thông thường: `YYYY.M.PATCH`, với `PATCH < 33`
  - Thẻ Git: `vYYYY.M.PATCH`
- Phiên bản phát hành sửa lỗi dự phòng thông thường: `YYYY.M.PATCH-N`
  - Thẻ Git: `vYYYY.M.PATCH-N`
- Phiên bản phát hành trước beta: `YYYY.M.PATCH-beta.N`
  - Thẻ Git: `vYYYY.M.PATCH-beta.N`
- Không thêm số 0 ở đầu tháng hoặc bản vá
- Bắt đầu từ bản cập nhật quy trình phát hành tháng 6 năm 2026, thành phần thứ ba là
  số thứ tự của release train hằng tháng, không phải ngày theo lịch. Các bản phát hành stable và beta
  xác định train hiện tại; các thẻ chỉ alpha không tiêu thụ hoặc
  tăng số bản vá beta/stable. Các thẻ và phiên bản npm trước cập nhật giữ
  tên hiện có và vẫn hợp lệ; tự động hóa phát hành tiếp tục
  so sánh chúng theo năm, tháng, bản vá, kênh, và số phát hành trước hoặc số
  sửa lỗi.
- Các bản dựng alpha/nightly dùng patch train chưa phát hành tiếp theo và chỉ tăng
  `alpha.N` cho các bản dựng lặp lại. Khi bản vá đó đã có beta, các bản dựng alpha mới
  chuyển sang bản vá kế tiếp. Bỏ qua các thẻ chỉ alpha cũ có số bản vá
  cao hơn khi chọn beta hoặc stable train.
- Phiên bản npm là bất biến. Nếu một thẻ beta đã được xuất bản, không
  xóa, xuất bản lại, hoặc tái sử dụng thẻ đó; hãy cắt số beta tiếp theo hoặc bản vá hằng tháng
  tiếp theo. Vì `2026.6.5-beta.1` đã được xuất bản trong giai đoạn
  chuyển đổi, các release train tháng 6 năm 2026 phải dùng bản vá `5` trở lên. Không
  xuất bản các train stable hoặc beta mới của tháng 6 năm 2026 dưới dạng `2026.6.2`, `2026.6.3`, hoặc
  `2026.6.4`.
- Sau bản final thông thường `2026.6.5`, beta train mới tiếp theo là
  `2026.6.6-beta.1`, ngay cả
  khi đã tồn tại các thẻ chỉ alpha tự động có số bản vá cao hơn.
- `latest` tiếp tục đi theo dòng npm thông thường/hằng ngày hiện tại
- `beta` nghĩa là mục tiêu cài đặt beta hiện tại
- `extended-stable` nghĩa là gói npm được hỗ trợ của tháng gần nhất, bắt đầu từ bản vá
  `33`; bản vá `34` trở lên là các bản phát hành bảo trì trên dòng hằng tháng đó
- Đường dẫn extended-stable hằng tháng chuyên dụng chỉ xuất bản gói npm lõi. Nó
  không xuất bản plugins, tạo phẩm macOS hoặc Windows, GitHub Release,
  dist-tag của kho riêng, Docker images, tạo phẩm di động, hoặc bản tải xuống
  trên website.

## Nhịp phát hành

- Các bản phát hành đi theo hướng beta trước
- Stable chỉ theo sau sau khi beta mới nhất được xác thực
- Maintainers thường cắt bản phát hành từ nhánh `release/YYYY.M.PATCH` được tạo
  từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn phát triển
  mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc xuất bản và cần sửa lỗi, maintainers cắt
  thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ beta cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực, và ghi chú khôi phục
  chỉ dành cho maintainer

## Xuất bản extended-stable hằng tháng chỉ trên npm

Đây là một ngoại lệ chuyên dụng so với quy trình phát hành thông thường bên dưới. Với một
tháng đã hoàn tất `YYYY.M`, tạo `extended-stable/YYYY.M.33`; xuất bản `vYYYY.M.33` và
các bản vá bảo trì sau đó từ cùng nhánh đó. Thẻ phát hành, đầu nhánh,
checkout, phiên bản gói, npm preflight, và lượt chạy Full Release Validation
đều phải xác định cùng một commit. `main` được bảo vệ phải đã chứa một phiên bản final
của một tháng lịch muộn hơn nghiêm ngặt và dưới bản vá `33`; các bản vá bảo trì vẫn
đủ điều kiện sau khi `main` tiến thêm hơn một tháng.

Chạy npm preflight và Full Release Validation từ đúng nhánh extended-stable,
sau đó lưu cả hai run ID:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` là hồ sơ độ sâu xác thực hiện có; nó
tách biệt với npm dist-tag `extended-stable` và được cố ý giữ nguyên.

Sau khi cả hai lượt chạy thành công và môi trường phát hành npm đã sẵn sàng, quảng bá
tarball preflight chính xác. Bản vá `P` phải là `33` trở lên:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

Đối với fork hoặc buổi diễn tập không phải production cố ý không thể đáp ứng
chính sách tháng `.33` hoặc tháng `main` được bảo vệ, thêm
`-f bypass_extended_stable_guard=true` vào cả các dispatch npm preflight và publish. Giá trị
mặc định là `false`. Bypass chỉ được chấp nhận với `npm_dist_tag=extended-stable` và
được ghi trong tóm tắt workflow. Nó không bỏ qua workflow ref chuẩn
`extended-stable/YYYY.M.33`, tính bằng nhau giữa đầu nhánh/thẻ/checkout, cú pháp thẻ final,
tính bằng nhau giữa phiên bản gói/thẻ, danh tính lượt chạy và manifest được tham chiếu,
nguồn gốc tarball, phê duyệt môi trường, đọc lại registry, hoặc bằng chứng
sửa selector.

Workflow publish xác minh danh tính các lượt chạy được tham chiếu, digest
tarball đã chuẩn bị, và cả hai selector npm registry. Xác nhận độc lập
kết quả sau khi workflow thành công:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Cả hai lệnh phải trả về `YYYY.M.P`. Nếu publish thành công nhưng đọc lại selector
thất bại, không xuất bản lại phiên bản gói bất biến. Dùng đúng một lệnh sửa
`npm dist-tag add openclaw@YYYY.M.P extended-stable` được in trong
tóm tắt always-run của workflow thất bại, rồi lặp lại cả hai lần đọc lại độc lập.
Rollback về selector trước đó là một quyết định vận hành riêng, không phải
đường dẫn sửa lỗi đọc lại.

Checklist thông thường bên dưới tiếp tục sở hữu beta, `latest`, GitHub Release,
plugins, macOS, Windows, và việc xuất bản trên các nền tảng khác. Không chạy các bước đó
cho đường dẫn extended-stable chỉ trên npm này.

## Checklist vận hành phát hành thông thường

Checklist này là hình dạng công khai của luồng phát hành. Thông tin xác thực riêng tư,
ký, công chứng, khôi phục dist-tag, và chi tiết rollback khẩn cấp vẫn nằm trong
runbook phát hành chỉ dành cho maintainer.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit mục tiêu đã được đẩy,
   và xác nhận CI của `main` hiện tại đủ xanh để tạo nhánh từ đó.
2. Tạo phần trên cùng của `CHANGELOG.md` từ các PR đã merge và tất cả commit
   trực tiếp kể từ release tag cuối cùng có thể truy cập. Giữ các mục hướng đến người dùng,
   loại bỏ trùng lặp giữa các mục PR/commit trực tiếp chồng lấn, commit phần viết lại, đẩy lên,
   và rebase/pull thêm một lần nữa trước khi tạo nhánh.
3. Rà soát các bản ghi tương thích release trong
   `src/plugins/compat/registry.ts` và
   `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ xóa tương thích
   đã hết hạn khi đường nâng cấp vẫn được bao phủ, hoặc ghi lại lý do vì sao nó
   được cố ý giữ lại.
4. Tạo `release/YYYY.M.PATCH` từ `main` hiện tại; không làm công việc release thông thường
   trực tiếp trên `main`.
5. Tăng mọi vị trí phiên bản bắt buộc cho tag dự kiến, rồi chạy
   `pnpm release:prep`. Lệnh này làm mới phiên bản plugin, inventory plugin, schema cấu hình,
   metadata cấu hình kênh đi kèm, baseline tài liệu cấu hình, export Plugin SDK,
   và baseline API Plugin SDK theo đúng thứ tự. Commit mọi drift được tạo ra
   trước khi gắn tag. Sau đó chạy preflight xác định cục bộ:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build`, và `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi tag tồn tại,
   SHA nhánh release đủ 40 ký tự được phép dùng cho preflight chỉ để xác thực.
   Preflight tạo bằng chứng release dependency cho đúng dependency graph đang checkout
   và lưu nó trong artifact preflight npm. Lưu `preflight_run_id` thành công.
7. Khởi động tất cả kiểm thử trước release bằng `Full Release Validation` cho
   nhánh release, tag, hoặc commit SHA đầy đủ. Đây là entrypoint thủ công duy nhất
   cho bốn hộp kiểm thử release lớn: Vitest, Docker, QA Lab, và Package.
8. Nếu xác thực thất bại, sửa trên nhánh release và chạy lại file, lane, workflow job,
   package profile, provider, hoặc danh sách cho phép model nhỏ nhất đã thất bại
   chứng minh bản sửa. Chỉ chạy lại toàn bộ umbrella khi bề mặt thay đổi làm
   bằng chứng trước đó trở nên cũ.
9. Với ứng viên beta đã gắn tag, chạy
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` từ nhánh
   `release/YYYY.M.PATCH` khớp. Với bản ổn định, truyền thêm release nguồn Windows
   bắt buộc:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   Helper chạy các kiểm tra release được tạo cục bộ, dispatch hoặc xác minh
   bằng chứng xác thực release đầy đủ và preflight npm, chạy bằng chứng Parallels
   fresh/update với đúng tarball đã chuẩn bị cộng với bằng chứng package Telegram,
   ghi lại kế hoạch npm plugin và ClawHub, và chỉ in lệnh
   `OpenClaw Release Publish` chính xác sau khi gói bằng chứng đã xanh.
   `OpenClaw Release Publish` dispatch các package plugin đã chọn hoặc tất cả
   plugin có thể publish lên npm và cùng tập đó lên ClawHub song song, rồi promote
   artifact preflight npm OpenClaw đã chuẩn bị với dist-tag khớp ngay khi publish
   npm plugin thành công.
   Sau khi child publish npm OpenClaw thành công, nó tạo hoặc cập nhật trang
   GitHub release/prerelease khớp từ toàn bộ phần `CHANGELOG.md` tương ứng.
   Các release ổn định publish lên npm `latest` trở thành GitHub latest release;
   các release bảo trì ổn định giữ trên npm `beta` được tạo với GitHub `latest=false`.
   Workflow cũng tải bằng chứng dependency preflight, manifest xác thực đầy đủ,
   và bằng chứng xác minh registry sau publish lên GitHub release để phục vụ
   ứng phó sự cố sau release. Workflow publish in các child run ID ngay lập tức,
   tự phê duyệt các cổng môi trường release mà workflow token được phép phê duyệt,
   tóm tắt child job thất bại kèm phần đuôi log, hoàn tất GitHub release và
   bằng chứng dependency ngay khi publish npm OpenClaw thành công, chờ ClawHub
   bất cứ khi nào npm OpenClaw đang được publish, rồi chạy `pnpm release:verify-beta`
   và tải bằng chứng sau publish cho GitHub release, package npm, các package npm
   plugin đã chọn, các package ClawHub đã chọn, child workflow run ID, và NPM
   Telegram run ID tùy chọn. Đường ClawHub thử lại các lỗi cài dependency CLI
   tạm thời, publish các plugin vượt qua preview ngay cả khi một preview cell bị
   flake, và kết thúc bằng xác minh registry cho mọi phiên bản plugin dự kiến để
   các lần publish một phần vẫn hiển thị và có thể thử lại. Sau đó chạy kiểm nhận
   package sau publish với package đã publish
   `openclaw@YYYY.M.PATCH-beta.N` hoặc
   `openclaw@beta`. Nếu một prerelease đã đẩy hoặc đã publish cần sửa,
   cắt số prerelease khớp tiếp theo; không xóa hoặc viết lại prerelease cũ.
10. Với bản ổn định, chỉ tiếp tục sau khi beta hoặc release candidate đã được thẩm định
    có bằng chứng xác thực bắt buộc. Publish npm ổn định cũng đi qua
    `OpenClaw Release Publish`, tái sử dụng artifact preflight thành công qua
    `preflight_run_id`; mức sẵn sàng release macOS ổn định cũng yêu cầu
    `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói, và `appcast.xml` đã cập nhật trên `main`.
    Workflow publish macOS tự động publish appcast đã ký lên `main` công khai
    sau khi asset release được xác minh; nếu branch protection chặn push trực tiếp,
    nó mở hoặc cập nhật một PR appcast. Mức sẵn sàng Windows Hub ổn định yêu cầu
    các asset `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe`, và
    `OpenClawCompanion-SHA256SUMS.txt` đã ký trên GitHub release OpenClaw.
    Truyền đúng release tag `openclaw/openclaw-windows-node` đã ký dưới dạng
    `windows_node_tag` và map digest installer đã được candidate phê duyệt của nó
    dưới dạng `windows_node_installer_digests`; `OpenClaw Release Publish` giữ
    bản nháp release, dispatch `Windows Node Release`, và xác minh cả ba asset
    trước khi công bố.
11. Sau publish, chạy trình xác minh sau publish npm, E2E Telegram npm đã publish
    độc lập tùy chọn khi bạn cần bằng chứng kênh sau publish, promote dist-tag
    khi cần, xác minh trang GitHub release được tạo, chạy các bước thông báo release,
    rồi hoàn tất [Hoàn tất main ổn định](#stable-main-closeout) trước khi gọi một
    release ổn định là đã xong.

## Hoàn tất main ổn định

Việc công bố ổn định chưa hoàn tất cho đến khi `main` mang đúng trạng thái release
đã phát hành thực tế.

1. Bắt đầu từ `main` mới nhất sạch. Audit `release/YYYY.M.PATCH` so với nó và
   forward-port các bản sửa thực sự còn thiếu khỏi `main`. Không merge mù quáng
   các adapter tương thích, kiểm thử, hoặc xác thực chỉ dành cho release vào `main`
   mới hơn.
2. Đặt `main` thành phiên bản ổn định đã phát hành, không phải một train tiếp theo
   mang tính suy đoán. Chạy `pnpm release:prep` sau thay đổi phiên bản gốc, rồi
   `pnpm deps:shrinkwrap:generate`.
3. Làm cho phần `## YYYY.M.PATCH` của `CHANGELOG.md` trên `main` khớp chính xác
   với nhánh release đã gắn tag. Bao gồm bản cập nhật `appcast.xml` ổn định khi
   release mac đã publish một bản.
4. Không thêm `YYYY.M.PATCH+1`, phiên bản beta, hoặc phần changelog tương lai rỗng
   vào `main` cho đến khi operator bắt đầu rõ ràng train release đó.
5. Chạy `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check`, và
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Đẩy lên, rồi xác minh `origin/main`
   chứa phiên bản và changelog đã phát hành trước khi gọi release ổn định là xong.
6. Giữ các biến repository `RELEASE_ROLLBACK_DRILL_ID` và
   `RELEASE_ROLLBACK_DRILL_DATE` luôn hiện hành sau mỗi cuộc diễn tập rollback riêng tư.
   `OpenClaw Stable Main Closeout` bắt đầu từ push `main` mang phiên bản,
   changelog, và appcast đã phát hành sau công bố ổn định. Nó đọc bằng chứng
   sau publish bất biến để liên kết tag đã phát hành với các lần chạy Full Release
   Validation và Publish của nó, rồi xác minh trạng thái main ổn định, release,
   soak ổn định bắt buộc, và bằng chứng hiệu năng chặn. Nó đính kèm một manifest
   closeout bất biến và checksum vào GitHub release. Trigger push tự động bỏ qua
   các release legacy có trước bằng chứng sau publish bất biến; nó không bao giờ
   xem việc bỏ qua đó là một closeout đã hoàn tất. Một closeout hoàn chỉnh yêu cầu
   cả hai asset và một checksum khớp. Một manifest một phần phát lại SHA `main`
   và cuộc diễn tập rollback đã ghi của nó để tái tạo các byte giống hệt, rồi
   đính kèm checksum còn thiếu; một cặp không hợp lệ, hoặc checksum không có
   manifest, vẫn chặn. Một lần chạy do push kích hoạt mà không có biến repository
   diễn tập rollback sẽ bỏ qua mà không hoàn tất closeout; bản ghi diễn tập thiếu
   hoặc cũ hơn 90 ngày vẫn chặn closeout thủ công có bằng chứng hỗ trợ.
   Các lệnh khôi phục riêng tư vẫn nằm trong runbook chỉ dành cho maintainer.
   Chỉ dùng dispatch thủ công để sửa chữa hoặc phát lại closeout ổn định có bằng chứng.
   Một tag sửa fallback legacy có thể tái sử dụng bằng chứng base-package chỉ khi
   tag sửa phân giải về cùng commit nguồn với tag ổn định gốc. Một bản sửa có
   nguồn khác phải publish và xác minh bằng chứng package riêng của nó.

## Preflight release

- Chạy `pnpm check:test-types` trước bước kiểm tra trước phát hành để TypeScript của test vẫn
  được bao phủ bên ngoài cổng `pnpm check` cục bộ nhanh hơn
- Chạy `pnpm check:architecture` trước bước kiểm tra trước phát hành để các kiểm tra rộng hơn về
  vòng lặp import và ranh giới kiến trúc đều xanh bên ngoài cổng cục bộ nhanh hơn
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành
  `dist/*` mong đợi và bundle Control UI tồn tại cho bước xác thực pack
- Chạy `pnpm release:prep` sau khi tăng phiên bản ở root và trước khi gắn tag. Lệnh này
  chạy mọi trình tạo phát hành xác định thường bị lệch sau thay đổi phiên bản/cấu hình/API:
  phiên bản Plugin, inventory Plugin, schema cấu hình cơ sở, metadata cấu hình kênh được bundle,
  baseline tài liệu cấu hình, export Plugin SDK và baseline API Plugin SDK. `pnpm release:check`
  chạy lại các guard đó ở chế độ kiểm tra và báo cáo mọi lỗi lệch do sinh tạo mà nó tìm thấy trong
  một lượt trước khi chạy kiểm tra phát hành package.
- Đồng bộ phiên bản Plugin cập nhật phiên bản package Plugin chính thức và các mức sàn
  `openclaw.compat.pluginApi` hiện có thành phiên bản phát hành OpenClaw theo mặc định.
  Hãy coi trường đó là mức sàn API Plugin SDK/runtime, không chỉ là bản sao của phiên bản
  package: với các bản phát hành chỉ dành cho Plugin cố ý vẫn tương thích với các host OpenClaw
  cũ hơn, hãy giữ mức sàn ở API host cũ nhất được hỗ trợ và ghi lại lựa chọn đó trong bằng chứng
  phát hành Plugin.
- Chạy quy trình làm việc thủ công `Full Release Validation` trước khi phê duyệt phát hành để
  khởi động tất cả hộp kiểm thử trước phát hành từ một điểm vào. Nó chấp nhận một branch,
  tag hoặc SHA commit đầy đủ, dispatch `CI` thủ công và dispatch
  `OpenClaw Release Checks` cho install smoke, package acceptance, kiểm tra package đa hệ điều hành,
  QA Lab parity, Matrix và các lane Telegram. Các lần chạy stable và full luôn bao gồm live/E2E
  đầy đủ và Docker release-path soak; `run_release_soak=true` được giữ lại cho beta soak rõ ràng.
  Package Acceptance cung cấp Telegram E2E package chuẩn trong quá trình xác thực candidate,
  tránh poller live đồng thời thứ hai.
  Cung cấp `release_package_spec` sau khi publish beta để tái sử dụng package npm đã phát hành
  trên các kiểm tra phát hành, Package Acceptance và package Telegram E2E mà không rebuild tarball
  phát hành. Chỉ cung cấp `npm_telegram_package_spec` khi Telegram nên dùng một package đã publish
  khác với phần còn lại của xác thực phát hành. Cung cấp `package_acceptance_package_spec` khi
  Package Acceptance nên dùng một package đã publish khác với spec package phát hành. Cung cấp
  `evidence_package_spec` khi báo cáo bằng chứng phát hành nên chứng minh rằng xác thực khớp với
  một package npm đã publish mà không bắt buộc Telegram E2E.
  Ví dụ:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Chạy quy trình làm việc thủ công `Package Acceptance` khi bạn muốn có bằng chứng kênh phụ
  cho một package candidate trong lúc công việc phát hành tiếp tục. Dùng `source=npm` cho
  `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành chính xác; `source=ref`
  để pack một branch/tag/SHA `package_ref` đáng tin cậy với harness `workflow_ref` hiện tại;
  `source=url` cho tarball HTTPS công khai với SHA-256 bắt buộc và chính sách URL công khai nghiêm ngặt;
  `source=trusted-url` cho một chính sách nguồn đáng tin cậy đã đặt tên bằng `trusted_source_id`
  và SHA-256 bắt buộc; hoặc `source=artifact` cho tarball do một lần chạy GitHub Actions khác upload.
  Quy trình làm việc phân giải candidate thành
  `package-under-test`, tái sử dụng bộ lập lịch Docker E2E phát hành với tarball đó,
  và có thể chạy Telegram QA với cùng tarball bằng `telegram_mode=mock-openai` hoặc
  `telegram_mode=live-frontier`. Khi các lane Docker được chọn bao gồm
  `published-upgrade-survivor`, artifact package là candidate và `published_upgrade_survivor_baseline`
  chọn baseline đã publish. `update-restart-auth` dùng package candidate làm cả CLI đã cài đặt
  lẫn package-under-test để nó kiểm tra đường dẫn restart được quản lý của lệnh update candidate.
  Ví dụ: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Hồ sơ thường dùng:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway và tải lại cấu hình
  - `package`: các lane package/update/restart/Plugin gốc artifact không có OpenWebUI hoặc ClawHub live
  - `product`: hồ sơ package cộng với kênh MCP, dọn dẹp cron/subagent,
    tìm kiếm web OpenAI và OpenWebUI
  - `full`: các phần Docker release-path với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lần chạy lại tập trung
- Chạy trực tiếp quy trình làm việc thủ công `CI` khi bạn chỉ cần phạm vi CI thông thường
  xác định cho release candidate. Dispatch CI thủ công bỏ qua phạm vi changed và buộc chạy
  các shard Linux Node, shard bundled-plugin, shard hợp đồng Plugin và kênh, tương thích
  Node 22, `check-*`, `check-additional-*`, kiểm tra smoke artifact đã build, kiểm tra docs,
  Python skills, Windows, macOS và các lane Control UI i18n. Các lần chạy CI thủ công độc lập
  chỉ chạy Android khi được dispatch với `include_android=true`; `Full Release Validation` truyền
  input đó cho CI con của nó.
  Ví dụ với Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Chạy `pnpm qa:otel:smoke` khi xác thực telemetry phát hành. Lệnh này kiểm tra
  QA-lab qua một OTLP/HTTP receiver cục bộ và xác minh export trace, metric và log,
  cùng với thuộc tính trace được giới hạn và việc biên tập nội dung/định danh mà không cần
  Opik, Langfuse hoặc collector bên ngoài khác.
- Chạy `pnpm qa:otel:collector-smoke` khi xác thực khả năng tương thích collector.
  Lệnh này định tuyến cùng export OTLP của QA-lab qua một container Docker OpenTelemetry Collector
  thật trước các assertion receiver cục bộ.
- Chạy `pnpm qa:prometheus:smoke` khi xác thực scraping Prometheus được bảo vệ.
  Lệnh này kiểm tra QA-lab, từ chối scrape chưa xác thực và xác minh các họ metric trọng yếu
  cho phát hành không chứa nội dung prompt, định danh thô, token auth và đường dẫn cục bộ.
- Chạy `pnpm qa:observability:smoke` khi bạn muốn chạy nối tiếp các lane smoke
  OpenTelemetry và Prometheus trong source-checkout.
- Chạy `pnpm release:check` trước mọi bản phát hành đã gắn tag
- Kiểm tra trước phát hành `OpenClaw NPM Release` sinh bằng chứng phát hành dependency trước khi
  đóng gói tarball npm. Cổng lỗ hổng npm advisory là chặn phát hành. Rủi ro manifest bắc cầu,
  bề mặt sở hữu/cài đặt dependency và báo cáo thay đổi dependency chỉ là bằng chứng phát hành.
  Báo cáo thay đổi dependency so sánh release candidate với tag phát hành trước đó có thể truy cập.
- Bước kiểm tra trước phát hành upload bằng chứng dependency dưới dạng
  `openclaw-release-dependency-evidence-<tag>` và cũng nhúng nó vào
  `dependency-evidence/` bên trong artifact npm preflight đã chuẩn bị. Đường dẫn publish thật
  tái sử dụng artifact preflight đó, rồi đính kèm cùng bằng chứng vào GitHub release dưới dạng
  `openclaw-<version>-dependency-evidence.zip`.
- Chạy `OpenClaw Release Publish` cho chuỗi publish có thay đổi sau khi tag đã tồn tại.
  Dispatch nó từ `release/YYYY.M.PATCH` (hoặc `main` khi publish một tag có thể truy cập từ main),
  truyền tag phát hành, `preflight_run_id` npm OpenClaw thành công và
  `full_release_validation_run_id` thành công, đồng thời giữ phạm vi publish Plugin mặc định
  `all-publishable` trừ khi bạn cố ý chạy một lượt sửa chữa tập trung. Quy trình làm việc tuần tự hóa
  publish npm Plugin, publish ClawHub Plugin và publish npm OpenClaw để package core không được
  publish trước các Plugin đã externalize của nó.
- `OpenClaw Release Publish` stable yêu cầu một `windows_node_tag` chính xác sau khi bản phát hành
  `openclaw/openclaw-windows-node` không phải prerelease tương ứng tồn tại. Nó cũng yêu cầu map
  `windows_node_installer_digests` đã được candidate phê duyệt. Trước khi dispatch bất kỳ publish
  con nào, nó xác minh bản phát hành nguồn đã được publish, không phải prerelease, chứa các installer
  x64/ARM64 bắt buộc và vẫn khớp với map đã phê duyệt đó. Sau đó, nó dispatch
  `Windows Node Release` trong khi bản phát hành OpenClaw vẫn là draft, mang theo map digest installer
  đã ghim mà không thay đổi. Quy trình làm việc con tải các installer Windows Hub đã ký từ đúng tag đó,
  đối chiếu chúng với các digest đã ghim, xác minh chữ ký Authenticode của chúng dùng signer
  OpenClaw Foundation mong đợi trên runner Windows, ghi manifest SHA-256 và upload các installer cùng
  manifest lên GitHub release OpenClaw chuẩn, rồi tải lại các asset đã quảng bá và xác minh thành viên
  manifest cùng hash. Quy trình cha xác minh hợp đồng asset x64, ARM64 và checksum hiện tại trước khi
  publication. Phục hồi trực tiếp từ chối các tên asset `OpenClawCompanion-*` không mong đợi trước khi
  thay thế các asset hợp đồng mong đợi bằng byte nguồn đã ghim. Chỉ dispatch thủ công
  `Windows Node Release` để phục hồi, và luôn truyền một tag chính xác, không bao giờ truyền
  `latest`, cộng với map JSON `expected_installer_digests` rõ ràng từ bản phát hành nguồn đã phê duyệt.
  Liên kết tải xuống website nên trỏ tới URL asset phát hành OpenClaw chính xác cho bản stable hiện tại,
  hoặc `releases/latest/download/...` chỉ sau khi xác minh redirect latest của GitHub trỏ tới cùng
  bản phát hành đó; đừng chỉ liên kết tới trang phát hành repo companion.
- Kiểm tra phát hành hiện chạy trong một quy trình làm việc thủ công riêng:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` cũng chạy lane QA Lab mock parity cộng với hồ sơ Matrix live nhanh
  và lane Telegram QA trước khi phê duyệt phát hành. Các lane live dùng môi trường
  `qa-live-shared`; Telegram cũng dùng lease credential Convex CI. Chạy quy trình làm việc thủ công
  `QA-Lab - All Lanes` với `matrix_profile=all` và `matrix_shards=true` khi bạn muốn inventory
  transport, media và E2EE Matrix đầy đủ chạy song song.
- Xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của
  `OpenClaw Release Checks` và `Full Release Validation` công khai, gọi trực tiếp quy trình làm việc
  tái sử dụng
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Việc tách này là có chủ ý: giữ đường dẫn phát hành npm thật ngắn,
  xác định và tập trung vào artifact, trong khi các kiểm tra live chậm hơn ở lane riêng để chúng
  không làm đình trệ hoặc chặn publish
- Các kiểm tra phát hành mang secret nên được dispatch qua `Full Release
Validation` hoặc từ workflow ref `main`/release để logic quy trình làm việc và
  secret vẫn được kiểm soát
- `OpenClaw Release Checks` chấp nhận branch, tag hoặc SHA commit đầy đủ miễn là
  commit đã phân giải có thể truy cập từ một branch OpenClaw hoặc tag phát hành
- Kiểm tra trước phát hành chỉ xác thực `OpenClaw NPM Release` cũng chấp nhận SHA commit đầy đủ
  40 ký tự của branch quy trình làm việc hiện tại mà không yêu cầu tag đã push
- Đường dẫn SHA đó chỉ dùng để xác thực và không thể được quảng bá thành publish thật
- Ở chế độ SHA, quy trình làm việc chỉ tổng hợp `v<package.json version>` cho kiểm tra
  metadata package; publish thật vẫn yêu cầu tag phát hành thật
- Cả hai quy trình làm việc giữ đường dẫn publish và quảng bá thật trên runner GitHub-hosted,
  trong khi đường dẫn xác thực không thay đổi có thể dùng các runner Linux Blacksmith lớn hơn
- Quy trình làm việc đó chạy
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  bằng cả secret quy trình làm việc `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`
- Bước kiểm tra trước phát hành npm không còn chờ lane kiểm tra phát hành riêng
- Trước khi gắn tag cục bộ cho một release candidate, chạy
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Helper này
  chạy các guardrail phát hành nhanh, kiểm tra phát hành npm/ClawHub Plugin, build,
  UI build và `release:openclaw:npm:check` theo thứ tự giúp bắt các lỗi thường chặn phê duyệt
  trước khi quy trình publish GitHub bắt đầu.
- Chạy `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (hoặc tag beta/correction tương ứng) trước khi phê duyệt
- Sau khi publish npm, chạy
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (hoặc phiên bản beta/sửa lỗi tương ứng) để xác minh đường dẫn cài đặt registry đã phát hành
  trong một prefix tạm mới
- Sau khi phát hành beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  để xác minh onboarding gói đã cài đặt, thiết lập Telegram, và E2E Telegram thật
  với gói npm đã phát hành bằng nhóm thông tin xác thực Telegram dùng chung được cấp thuê.
  Các lần chạy cục bộ riêng lẻ của người bảo trì có thể bỏ qua các biến Convex và truyền trực tiếp ba
  thông tin xác thực env `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy toàn bộ smoke beta sau phát hành từ máy của người bảo trì, dùng `pnpm release:beta-smoke -- --beta betaN`. Trình trợ giúp chạy xác thực cập nhật npm Parallels/mục tiêu mới, dispatch `NPM Telegram Beta E2E`, thăm dò đúng workflow run, tải xuống artifact, và in báo cáo Telegram.
- Người bảo trì có thể chạy cùng kiểm tra sau phát hành từ GitHub Actions qua
  workflow thủ công `NPM Telegram Beta E2E`. Workflow này được cố ý đặt chỉ chạy thủ công và
  không chạy trên mọi lần merge.
- Tự động hóa phát hành của người bảo trì hiện dùng preflight-rồi-promote:
  - phát hành npm thật phải vượt qua một npm `preflight_run_id` thành công
  - phát hành npm thật phải được dispatch từ cùng nhánh `main` hoặc
    `release/YYYY.M.PATCH` với lần chạy preflight thành công
  - các bản phát hành npm ổn định mặc định dùng `beta`
  - phát hành npm ổn định có thể nhắm đích rõ ràng tới `latest` qua input của workflow
  - việc thay đổi npm dist-tag dựa trên token hiện nằm trong
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` vì
    `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo nguồn giữ
    phát hành chỉ dùng OIDC
  - `macOS Release` công khai chỉ dùng để xác thực; khi một tag chỉ tồn tại trên một
    nhánh phát hành nhưng workflow được dispatch từ `main`, đặt
    `public_release_branch=release/YYYY.M.PATCH`
  - phát hành macOS thật phải vượt qua macOS `preflight_run_id` và
    `validate_run_id` thành công
  - các đường dẫn phát hành thật promote artifact đã chuẩn bị thay vì build lại
    chúng lần nữa
- Với các bản phát hành sửa lỗi ổn định như `YYYY.M.PATCH-N`, trình xác minh sau phát hành
  cũng kiểm tra cùng đường dẫn nâng cấp prefix tạm từ `YYYY.M.PATCH` lên `YYYY.M.PATCH-N`
  để các bản sửa lỗi phát hành không thể âm thầm để các cài đặt global cũ ở lại
  payload ổn định gốc
- Preflight phát hành npm sẽ fail closed trừ khi tarball chứa cả
  `dist/control-ui/index.html` và payload `dist/control-ui/assets/` không rỗng
  để chúng ta không phát hành lại một dashboard trình duyệt trống
- Xác minh sau phát hành cũng kiểm tra rằng các điểm vào Plugin đã phát hành và
  metadata gói hiện diện trong bố cục registry đã cài đặt. Một bản phát hành
  thiếu payload runtime Plugin sẽ làm trình xác minh postpublish thất bại và
  không thể được promote lên `latest`.
- `pnpm test:install:smoke` cũng thực thi ngân sách `unpackedSize` của npm pack trên
  tarball cập nhật ứng viên, nhờ đó e2e trình cài đặt bắt được tình trạng phình to gói ngoài ý muốn
  trước đường dẫn phát hành
- Nếu công việc phát hành đã chạm tới lập kế hoạch CI, manifest thời gian extension, hoặc
  ma trận kiểm thử extension, hãy tái tạo và rà soát các đầu ra ma trận
  `plugin-prerelease-extension-shard` do planner sở hữu từ
  `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành
  không mô tả một bố cục CI đã lỗi thời
- Mức sẵn sàng phát hành macOS ổn định cũng bao gồm các bề mặt updater:
  - GitHub release cuối cùng phải có `.zip`, `.dmg`, và `.dSYM.zip` đã đóng gói
  - `appcast.xml` trên `main` phải trỏ tới zip ổn định mới sau khi phát hành; workflow
    phát hành macOS tự động commit nó, hoặc mở một PR appcast
    khi direct push bị chặn
  - ứng dụng đã đóng gói phải giữ bundle id không phải debug, URL Sparkle feed không rỗng,
    và `CFBundleVersion` bằng hoặc cao hơn mức sàn build Sparkle chuẩn
    cho phiên bản phát hành đó

## Hộp kiểm thử bản phát hành

`Full Release Validation` là cách người vận hành khởi chạy tất cả kiểm thử trước phát hành từ
một điểm vào duy nhất. Để có bằng chứng commit được ghim trên một nhánh thay đổi nhanh, hãy dùng
trình trợ giúp để mọi workflow con chạy từ một nhánh tạm thời cố định tại SHA mục tiêu:

```bash
pnpm ci:full-release --sha <full-sha>
```

Trình trợ giúp đẩy `release-ci/<sha>-...`, dispatch `Full Release Validation`
từ nhánh đó với `ref=<sha>`, xác minh mọi workflow con có `headSha`
khớp với mục tiêu, rồi xóa nhánh tạm thời. Việc này tránh vô tình chứng minh một
lượt chạy con mới hơn của `main`.

Để xác thực nhánh hoặc tag phát hành, hãy chạy từ workflow ref `main` đáng tin cậy
và truyền nhánh hoặc tag phát hành làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Workflow phân giải target ref, dispatch thủ công `CI` với
`target_ref=<release-ref>`, rồi dispatch `OpenClaw Release Checks`.
`OpenClaw Release Checks` phân nhánh ra smoke cài đặt, kiểm tra phát hành liên OS,
phủ release-path Docker live/E2E khi bật soak, Package Acceptance
với E2E gói Telegram chuẩn, đối sánh QA Lab, Matrix live và Telegram live. Một lượt chạy full/all chỉ được chấp nhận khi phần tóm tắt `Full Release Validation`
hiển thị `normal_ci`, `plugin_prerelease` và `release_checks` là
thành công, trừ khi một lượt chạy lại có trọng tâm cố ý bỏ qua workflow con `Plugin
Prerelease` riêng biệt. Chỉ dùng con `npm-telegram` độc lập cho một lượt chạy lại có trọng tâm
với gói đã phát hành bằng `release_package_spec` hoặc
`npm_telegram_package_spec`. Phần tóm tắt xác minh cuối cùng
bao gồm các bảng job chậm nhất cho từng lượt chạy con, để người quản lý phát hành
có thể thấy đường găng hiện tại mà không cần tải log xuống.
Xem [Xác thực phát hành đầy đủ](/vi/reference/full-release-validation) để biết
ma trận giai đoạn đầy đủ, tên job workflow chính xác, khác biệt giữa hồ sơ stable và full,
artifact và các handle chạy lại có trọng tâm.
Các workflow con được dispatch từ ref đáng tin cậy chạy `Full Release
Validation`, thường là `--ref main`, ngay cả khi `ref` mục tiêu trỏ đến một
nhánh hoặc tag phát hành cũ hơn. Không có input workflow-ref riêng cho Full Release Validation;
hãy chọn harness đáng tin cậy bằng cách chọn workflow run ref.
Không dùng `--ref main -f ref=<sha>` để chứng minh commit chính xác trên `main` đang di chuyển;
raw commit SHA không thể là workflow dispatch ref, vì vậy hãy dùng
`pnpm ci:full-release --sha <sha>` để tạo nhánh tạm thời đã ghim.

Dùng `release_profile` để chọn độ rộng live/provider:

- `minimum`: đường dẫn live và Docker OpenAI/core tối thiểu, nhanh nhất, quan trọng cho phát hành
- `stable`: minimum cộng thêm phạm vi provider/backend ổn định để phê duyệt phát hành
- `full`: stable cộng thêm phạm vi advisory provider/media rộng

Xác thực stable và full luôn chạy sweep live/E2E toàn diện, Docker
release-path và published upgrade-survivor có giới hạn trước khi promote.
Dùng `run_release_soak=true` để yêu cầu cùng sweep đó cho bản beta. Sweep đó bao phủ
bốn gói stable mới nhất cộng các baseline `2026.4.23` và `2026.5.2`
được ghim, cộng phạm vi `2026.4.15` cũ hơn, với các baseline trùng lặp được loại bỏ và
mỗi baseline được shard vào job runner Docker riêng.

`OpenClaw Release Checks` dùng workflow ref đáng tin cậy để phân giải target
ref một lần dưới dạng `release-package-under-test` và tái sử dụng artifact đó trong cross-OS,
Package Acceptance và các kiểm tra Docker release-path khi soak chạy. Việc này giữ
mọi hộp hướng đến gói trên cùng một byte và tránh build gói lặp lại.
Sau khi một beta đã có trên npm, đặt `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
để các kiểm tra phát hành tải gói đã ship một lần, trích xuất SHA nguồn build của nó
từ `dist/build-info.json` và tái sử dụng artifact đó cho cross-OS,
Package Acceptance, Docker release-path và các lane package Telegram.
Smoke cài đặt OpenAI cross-OS dùng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi
biến repo/org được đặt, nếu không thì dùng `openai/gpt-5.4`, vì lane này đang
chứng minh cài đặt gói, onboarding, khởi động Gateway và một lượt agent live
thay vì benchmark mô hình mặc định chậm nhất. Ma trận provider live rộng hơn
vẫn là nơi dành cho phạm vi theo mô hình cụ thể.

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

Không dùng umbrella đầy đủ làm lượt chạy lại đầu tiên sau một bản sửa có trọng tâm. Nếu một hộp
thất bại, hãy dùng workflow con, job, lane Docker, hồ sơ gói, provider mô hình
hoặc lane QA đã thất bại cho bằng chứng tiếp theo. Chỉ chạy lại umbrella đầy đủ khi
bản sửa đã thay đổi điều phối phát hành dùng chung hoặc làm bằng chứng all-box trước đó
không còn mới. Trình xác minh cuối cùng của umbrella kiểm tra lại các id lượt chạy workflow con
đã ghi, vì vậy sau khi một workflow con được chạy lại thành công, chỉ chạy lại job cha
`Verify full validation` đã thất bại.

Để phục hồi có giới hạn, truyền `rerun_group` vào umbrella. `all` là lượt chạy
release-candidate thật, `ci` chỉ chạy con CI bình thường, `plugin-prerelease`
chỉ chạy con Plugin chỉ dành cho phát hành, `release-checks` chạy mọi hộp phát hành,
và các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` và `npm-telegram`.
Các lượt chạy lại `npm-telegram` có trọng tâm yêu cầu `release_package_spec` hoặc
`npm_telegram_package_spec`; các lượt full/all dùng E2E gói Telegram chuẩn
bên trong Package Acceptance. Các lượt chạy lại
cross-OS có trọng tâm có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc
một bộ lọc OS/suite khác. Lỗi release-check QA chặn xác thực phát hành
bình thường, bao gồm drift công cụ động OpenClaw bắt buộc trong tier chuẩn.
Các lượt Tideclaw alpha vẫn có thể coi các lane release-check không liên quan đến an toàn gói là
advisory. Khi `live_suite_filter` yêu cầu rõ một lane QA live có gate như
Discord, WhatsApp hoặc Slack, biến repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` khớp phải được bật; nếu không,
việc capture input thất bại thay vì âm thầm bỏ qua lane.

### Vitest

Hộp Vitest là workflow con `CI` thủ công. CI thủ công cố ý
bỏ qua phạm vi theo thay đổi và buộc đồ thị kiểm thử bình thường cho release
candidate: các shard Linux Node, shard Plugin đi kèm, shard hợp đồng Plugin và channel,
tương thích Node 22, `check-*`, `check-additional-*`,
kiểm tra smoke artifact đã build, kiểm tra docs, Python skills, Windows, macOS,
và Control UI i18n. Android được bao gồm khi `Full Release Validation` chạy hộp
vì umbrella truyền `include_android=true`; CI thủ công độc lập
yêu cầu `include_android=true` để có phạm vi Android.

Dùng hộp này để trả lời "cây nguồn có vượt qua bộ kiểm thử bình thường đầy đủ không?"
Nó không giống với xác thực sản phẩm theo release-path. Bằng chứng cần giữ:

- Tóm tắt `Full Release Validation` hiển thị URL lượt chạy `CI` đã dispatch
- Lượt chạy `CI` xanh trên đúng SHA mục tiêu
- tên shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- artifact thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi
  một lượt chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI bình thường xác định nhưng
không cần các hộp Docker, QA Lab, live, cross-OS hoặc package. Dùng lệnh đầu tiên
cho CI trực tiếp không Android. Thêm `include_android=true` khi CI trực tiếp
cho release-candidate phải bao phủ Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Hộp Docker nằm trong `OpenClaw Release Checks` thông qua
`openclaw-live-and-e2e-checks-reusable.yml`, cộng workflow `install-smoke`
ở chế độ phát hành. Nó xác thực release candidate qua các môi trường Docker
đã đóng gói thay vì chỉ các kiểm thử cấp nguồn.

Phạm vi Docker phát hành bao gồm:

- smoke cài đặt đầy đủ với smoke cài đặt global Bun chậm được bật
- chuẩn bị/tái sử dụng image smoke Dockerfile gốc theo SHA mục tiêu, với các job smoke QR,
  root/gateway và installer/Bun chạy dưới dạng các shard install-smoke riêng
- các lane E2E kho mã
- các chunk Docker release-path: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g`, và `plugins-runtime-install-h`
- phạm vi OpenWebUI bên trong chunk `plugins-runtime-services` khi được yêu cầu
- các lane cài đặt/gỡ cài đặt Plugin đi kèm được tách
  từ `bundled-plugin-install-uninstall-0` đến
  `bundled-plugin-install-uninstall-23`
- các suite provider live/E2E và phạm vi mô hình live Docker khi release checks
  bao gồm các suite live

Dùng artifact Docker trước khi chạy lại. Bộ lập lịch release-path tải lên
`.artifacts/docker-tests/` với log lane, `summary.json`, `failures.json`,
thời gian pha, JSON kế hoạch bộ lập lịch và các lệnh chạy lại. Để phục hồi có trọng tâm,
dùng `docker_lanes=<lane[,lane]>` trên workflow live/E2E tái sử dụng thay vì
chạy lại mọi chunk phát hành. Các lệnh chạy lại được tạo bao gồm
`package_artifact_run_id` trước đó và input image Docker đã chuẩn bị khi có, để một
lane thất bại có thể tái sử dụng cùng tarball và image GHCR.

### QA Lab

Hộp QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là gate phát hành
hành vi agentic và cấp channel, tách biệt với Vitest và cơ chế gói Docker.

Phạm vi QA Lab phát hành bao gồm:

- lane đối sánh mock so sánh lane candidate OpenAI với baseline Opus 4.6
  bằng gói đối sánh agentic
- hồ sơ QA Matrix live nhanh dùng môi trường `qa-live-shared`
- lane QA Telegram live dùng lease thông tin xác thực CI Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke`, hoặc
  `pnpm qa:observability:smoke` khi telemetry phát hành cần bằng chứng cục bộ rõ ràng

Dùng hộp này để trả lời "bản phát hành có hoạt động đúng trong các kịch bản QA và
luồng channel live không?" Giữ URL artifact cho các lane đối sánh, Matrix và Telegram
khi phê duyệt phát hành. Phạm vi Matrix đầy đủ vẫn khả dụng dưới dạng một lượt chạy QA-Lab
shard thủ công thay vì lane mặc định quan trọng cho phát hành.

### Gói

Hộp Package là gate sản phẩm có thể cài đặt. Nó được hỗ trợ bởi
`Package Acceptance` và bộ phân giải
`scripts/resolve-openclaw-package-candidate.mjs`. Bộ phân giải chuẩn hóa một
candidate thành tarball `package-under-test` được Docker E2E tiêu thụ, xác thực
inventory gói, ghi lại phiên bản gói và SHA-256, đồng thời giữ ref harness workflow
tách biệt với ref nguồn gói.

Các nguồn candidate được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest`, hoặc một phiên bản phát hành OpenClaw
  chính xác
- `source=ref`: đóng gói một nhánh, thẻ, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy
  với harness `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS công khai với `package_sha256` bắt buộc;
  thông tin xác thực URL, cổng HTTPS không mặc định, tên máy chủ hoặc địa chỉ đã phân giải
  riêng tư/nội bộ/dùng cho mục đích đặc biệt, và chuyển hướng không an toàn sẽ bị từ chối
- `source=trusted-url`: tải xuống một `.tgz` HTTPS với
  `package_sha256` và `trusted_source_id` bắt buộc từ một chính sách được đặt tên trong
  `.github/package-trusted-sources.json`; dùng tùy chọn này cho mirror doanh nghiệp
  do maintainer sở hữu hoặc kho gói riêng tư thay vì thêm một bypass mạng riêng
  ở cấp input vào `source=url`
- `source=artifact`: dùng lại một `.tgz` đã được tải lên bởi một lần chạy GitHub Actions khác

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, artifact gói phát hành
đã chuẩn bị, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. Package Acceptance giữ QA cho migration, update,
khởi động lại bản update có configured-auth, cài đặt skill ClawHub trực tiếp, dọn dẹp phụ thuộc Plugin cũ, fixture Plugin offline,
cập nhật Plugin, và gói Telegram trên cùng tarball đã phân giải.
Các kiểm tra phát hành chặn dùng baseline gói đã xuất bản mới nhất mặc định;
profile beta với `run_release_soak=true`, `release_profile=stable`, hoặc
`release_profile=full` mở rộng sang mọi baseline ổn định đã xuất bản trên npm từ
`2026.4.23` đến `latest` cộng với các fixture issue đã báo cáo. Dùng
Package Acceptance với `source=npm` cho một candidate đã phát hành,
`source=ref` cho tarball npm cục bộ có SHA hậu thuẫn trước khi publish,
`source=trusted-url` cho mirror doanh nghiệp/riêng tư do maintainer sở hữu, hoặc
`source=artifact` cho tarball đã chuẩn bị được tải lên bởi một lần chạy GitHub Actions khác.
Đây là giải pháp thay thế gốc GitHub
cho phần lớn phạm vi kiểm tra gói/update trước đây cần
Parallels. Kiểm tra phát hành đa hệ điều hành vẫn quan trọng với onboarding,
installer, và hành vi nền tảng đặc thù theo OS, nhưng xác thực sản phẩm gói/update nên
ưu tiên Package Acceptance.

Checklist chuẩn tắc cho xác thực update và Plugin là
[Kiểm thử update và Plugin](/vi/help/testing-updates-plugins). Dùng checklist này khi
quyết định lane cục bộ, Docker, Package Acceptance, hoặc release-check nào chứng minh một
thay đổi cài đặt/update Plugin, dọn dẹp doctor, hoặc migration gói đã xuất bản.
Migration update đã xuất bản đầy đủ từ mọi gói ổn định `2026.4.23+` là
workflow `Update Migration` thủ công riêng, không thuộc Full Release CI.

Độ khoan dung package-acceptance legacy được cố ý giới hạn thời gian. Các gói đến
`2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống metadata đã được publish
lên npm: các mục kiểm kê QA riêng tư bị thiếu trong tarball, thiếu
`gateway install --wrapper`, thiếu patch file trong fixture git phát sinh từ tarball,
thiếu `update.channel` đã persist, vị trí legacy của install-record Plugin,
thiếu persistence install-record marketplace, và migration metadata cấu hình
trong `plugins update`. Gói `2026.4.26` đã publish có thể cảnh báo
về các file stamp metadata build cục bộ đã được phát hành. Các gói sau đó
phải đáp ứng contract gói hiện đại; những khoảng trống tương tự sẽ làm xác thực phát hành
thất bại.

Dùng các profile Package Acceptance rộng hơn khi câu hỏi phát hành liên quan đến một
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

Các profile gói phổ biến:

- `smoke`: các lane cài đặt gói/channel/agent, mạng Gateway, và tải lại cấu hình nhanh
- `package`: contract cài đặt/update/khởi động lại/gói Plugin cộng với bằng chứng
  cài đặt skill ClawHub trực tiếp; đây là mặc định release-check
- `product`: `package` cộng với MCP channels, dọn dẹp cron/subagent, tìm kiếm web OpenAI,
  và OpenWebUI
- `full`: các phần Docker release-path với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác cho các lần chạy lại tập trung

Để có bằng chứng Telegram cho package-candidate, bật `telegram_mode=mock-openai` hoặc
`telegram_mode=live-frontier` trên Package Acceptance. Workflow truyền tarball
`package-under-test` đã phân giải vào lane Telegram; workflow Telegram độc lập
vẫn nhận spec npm đã publish cho các kiểm tra sau publish.

## Tự động hóa publish phát hành định kỳ

Đối với beta, `latest`, Plugin, GitHub Release, và xuất bản nền tảng,
`OpenClaw Release Publish` là entrypoint thay đổi trạng thái thông thường. Đường dẫn
extended-stable chỉ npm hằng tháng `.33+` không dùng orchestrator này. Workflow thông thường
điều phối các workflow trusted-publisher theo thứ tự phát hành cần:

1. Check out thẻ phát hành và phân giải SHA commit của nó.
2. Xác minh thẻ có thể truy cập từ `main` hoặc `release/*`.
3. Chạy `pnpm plugins:sync:check`.
4. Dispatch `Plugin NPM Release` với `publish_scope=all-publishable` và
   `ref=<release-sha>`.
5. Dispatch `Plugin ClawHub Release` với cùng scope và SHA.
6. Dispatch `OpenClaw NPM Release` với thẻ phát hành, npm dist-tag, và
   `preflight_run_id` đã lưu sau khi xác minh
   `full_release_validation_run_id` đã lưu.
7. Với các bản phát hành ổn định, tạo hoặc cập nhật GitHub release dưới dạng draft, dispatch
   `Windows Node Release` với `windows_node_tag` rõ ràng và
   `windows_node_installer_digests` đã được candidate phê duyệt, rồi xác minh các asset
   installer/checksum chuẩn tắc trước khi publish draft.

Ví dụ publish beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Publish ổn định lên dist-tag beta mặc định:

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

Promotion ổn định trực tiếp lên `latest` là thao tác tường minh:

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
không thể phát hành nếu thiếu bất kỳ Plugin chính thức nào có thể publish, bao gồm
`@openclaw/diffs-language-pack`. Với sửa chữa Plugin đã chọn, đặt
`publish_openclaw_npm=false` với `plugin_publish_scope=selected` và
`plugins=@openclaw/name`, hoặc dispatch trực tiếp workflow con.

## Input workflow NPM

`OpenClaw NPM Release` nhận các input do operator kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, hoặc
  `v2026.4.2-beta.1`; khi `preflight_only=true`, nó cũng có thể là
  SHA commit 40 ký tự đầy đủ hiện tại của nhánh workflow để preflight chỉ xác thực
- `preflight_only`: `true` để chỉ xác thực/build/đóng gói, `false` cho đường dẫn
  publish thật
- `preflight_run_id`: bắt buộc trên đường dẫn publish thật để workflow dùng lại
  tarball đã chuẩn bị từ lần chạy preflight thành công
- `full_release_validation_run_id`: bắt buộc cho publication monthly extended-stable thật và regular
  non-beta để workflow xác thực chính xác lần chạy xác thực
- `npm_dist_tag`: thẻ đích npm cho đường dẫn publish; nhận `alpha`, `beta`,
  `latest`, hoặc `extended-stable` và mặc định là `beta`. Patch cuối `33` trở lên phải
  dùng `extended-stable`; theo mặc định, `extended-stable` từ chối các patch trước đó, và nó luôn
  từ chối thẻ không phải final.
- `bypass_extended_stable_guard`: boolean chỉ dành cho kiểm thử, mặc định `false`; với
  `npm_dist_tag=extended-stable`, bypass điều kiện hợp lệ monthly extended-stable trong khi vẫn giữ
  kiểm tra danh tính phát hành, artifact, phê duyệt, và readback.

`OpenClaw Release Publish` nhận các input do operator kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc; phải đã tồn tại
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id lần chạy `Full Release Validation` thành công;
  bắt buộc khi `publish_openclaw_npm=true`
- `windows_node_tag`: thẻ phát hành `openclaw/openclaw-windows-node`
  chính xác, không phải prerelease; bắt buộc cho publish OpenClaw ổn định
- `windows_node_installer_digests`: map JSON gọn đã được candidate phê duyệt ánh xạ
  tên installer Windows hiện tại tới digest `sha256:` đã ghim; bắt buộc
  cho publish OpenClaw ổn định
- `npm_dist_tag`: thẻ đích npm cho gói OpenClaw
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected`
  cho công việc sửa chữa chỉ Plugin tập trung với `publish_openclaw_npm=false`
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng
  workflow như một orchestrator sửa chữa chỉ Plugin
- `wait_for_clawhub`: mặc định là `false` để khả dụng npm không bị chặn bởi
  sidecar ClawHub; chỉ đặt `true` khi việc hoàn tất workflow phải bao gồm
  hoàn tất ClawHub

`OpenClaw Release Checks` nhận các input do operator kiểm soát sau:

- `ref`: nhánh, thẻ, hoặc SHA commit đầy đủ để xác thực. Các kiểm tra mang secret
  yêu cầu commit đã phân giải phải có thể truy cập từ một nhánh OpenClaw hoặc
  thẻ phát hành.
- `run_release_soak`: bật soak live/E2E đầy đủ, Docker release-path, và
  all-since upgrade-survivor cho kiểm tra phát hành beta. Tùy chọn này bị buộc bật bởi
  `release_profile=stable` và `release_profile=full`.

Quy tắc:

- Các phiên bản final và correction thông thường dưới patch `33` có thể publish lên
  `beta` hoặc `latest`. Các phiên bản final tại patch `33` trở lên phải publish lên
  `extended-stable`, và các phiên bản có hậu tố correction tại ranh giới đó bị từ chối.
- Thẻ prerelease beta chỉ có thể publish lên `beta`
- Với `OpenClaw NPM Release`, input SHA commit đầy đủ chỉ được phép khi
  `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn
  chỉ dùng để xác thực
- Đường dẫn publish thật phải dùng cùng `npm_dist_tag` đã dùng trong preflight;
  workflow xác minh metadata đó trước khi tiếp tục publish

## Trình tự phát hành beta/latest ổn định định kỳ

Trình tự legacy này dành cho bản phát hành được điều phối định kỳ cũng sở hữu
Plugin, GitHub Release, Windows, và công việc nền tảng khác. Nó không phải là
đường dẫn extended-stable chỉ npm hằng tháng `.33+` được ghi tài liệu ở đầu trang này.

Khi cắt một bản phát hành ổn định được điều phối định kỳ:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`
   - Trước khi có thẻ, bạn có thể dùng SHA commit đầy đủ hiện tại của nhánh workflow
     để chạy thử quy trình preflight chỉ nhằm xác thực
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc `latest` chỉ
   khi bạn chủ ý muốn publish ổn định trực tiếp
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành, hoặc SHA
   commit đầy đủ khi bạn muốn CI thông thường cùng phạm vi bao phủ live prompt cache,
   Docker, QA Lab, Matrix và Telegram từ một workflow thủ công
4. Nếu bạn chủ ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy
   workflow `CI` thủ công trên ref phát hành thay thế
5. Chọn đúng thẻ phát hành không phải prerelease của `openclaw/openclaw-windows-node`
   có bộ cài đã ký cho x64 và ARM64 sẽ được phát hành. Lưu thẻ đó dưới dạng
   `windows_node_tag`, và lưu bản đồ digest đã xác thực của chúng dưới dạng
   `windows_node_installer_digests`. Trình trợ giúp release-candidate ghi lại cả hai
   và đưa chúng vào lệnh publish được tạo.
6. Lưu `preflight_run_id` và `full_release_validation_run_id` đã chạy thành công
7. Chạy `OpenClaw Release Publish` với cùng `tag`, cùng `npm_dist_tag`,
   `windows_node_tag` đã chọn, `windows_node_installer_digests` đã lưu của nó,
   `preflight_run_id` đã lưu và `full_release_validation_run_id` đã lưu;
   workflow này publish các Plugin đã externalize lên npm và ClawHub trước khi quảng bá
   gói npm OpenClaw
8. Nếu bản phát hành đã vào `beta`, hãy dùng workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   để quảng bá phiên bản ổn định đó từ `beta` lên `latest`
9. Nếu bản phát hành chủ ý publish trực tiếp lên `latest` và `beta`
   cần trỏ theo cùng bản dựng ổn định ngay lập tức, hãy dùng cùng workflow phát hành đó
   để trỏ cả hai dist-tag vào phiên bản ổn định, hoặc để đồng bộ tự phục hồi theo lịch
   của workflow chuyển `beta` sau

Thao tác thay đổi dist-tag nằm trong repo sổ cái phát hành vì nó vẫn yêu cầu
`NPM_TOKEN`, trong khi repo nguồn chỉ giữ publish bằng OIDC.

Điều đó giúp cả đường dẫn publish trực tiếp và đường dẫn quảng bá beta-trước đều
được ghi tài liệu và hiển thị rõ cho người vận hành.

Nếu maintainer phải quay về xác thực npm cục bộ, chỉ chạy mọi lệnh CLI 1Password
(`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op`
trực tiếp từ shell agent chính; giữ nó bên trong tmux giúp các lời nhắc,
cảnh báo và xử lý OTP có thể quan sát được, đồng thời ngăn các cảnh báo host lặp lại.

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
