---
read_when:
    - Đang tìm định nghĩa kênh phát hành công khai
    - Chạy quy trình xác thực bản phát hành hoặc kiểm thử chấp nhận gói phần mềm
    - Tìm hiểu cách đặt tên phiên bản và nhịp phát hành
summary: Các kênh phát hành, danh sách kiểm tra dành cho người vận hành, các hộp xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-07-20T04:31:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7807f44029f8f5fd0d40499c0b1f2e731cd99780cf1f081bf62230a2146c49e4
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hiện cung cấp ba kênh cập nhật hướng đến người dùng:

- stable: kênh phát hành đã được quảng bá hiện có, vẫn được phân giải thông qua npm `latest` cho đến khi cột mốc CLI/kênh riêng biệt hoàn tất
- beta: các thẻ phát hành trước được xuất bản lên npm `beta`
- dev: đầu nhánh luôn thay đổi của `main`

Ngoài ra, người vận hành phát hành có thể xuất bản gói lõi của tháng hoàn tất gần nhất
lên npm `extended-stable`, bắt đầu từ bản vá `33`. Dòng bản cuối thông thường
của tháng hiện tại tiếp tục trên npm `latest`; việc phân tách xuất bản phía người vận hành
này tự nó không thay đổi cách phân giải kênh cập nhật của CLI.

Các bản dựng alpha Tideclaw là một luồng phát hành trước nội bộ riêng biệt (npm dist-tag `alpha`), được trình bày trong [Đầu vào quy trình làm việc NPM](#npm-workflow-inputs) và [Hộp kiểm thử phát hành](#release-test-boxes).

## Cách đặt tên phiên bản

- Phiên bản phát hành extended-stable hằng tháng trên npm: `YYYY.M.PATCH`, với `PATCH >= 33`, thẻ git `vYYYY.M.PATCH`
- Phiên bản phát hành cuối hằng ngày/thông thường: `YYYY.M.PATCH`, với `PATCH < 33`, thẻ git `vYYYY.M.PATCH`
- Phiên bản phát hành sửa lỗi dự phòng thông thường: `YYYY.M.PATCH-N`, thẻ git `vYYYY.M.PATCH-N`
- Phiên bản phát hành trước beta: `YYYY.M.PATCH-beta.N`, thẻ git `vYYYY.M.PATCH-beta.N`
- Phiên bản phát hành trước alpha: `YYYY.M.PATCH-alpha.N`, thẻ git `vYYYY.M.PATCH-alpha.N`
- Không bao giờ thêm số 0 ở đầu tháng hoặc bản vá
- `PATCH` là số thứ tự tuần tự của chu kỳ phát hành hằng tháng, không phải ngày dương lịch. Các bản phát hành cuối thông thường và beta nâng chu kỳ hiện tại; các thẻ chỉ dành cho alpha không bao giờ sử dụng hoặc nâng số bản vá beta/thông thường, vì vậy hãy bỏ qua các thẻ cũ chỉ dành cho alpha có số bản vá cao hơn khi chọn chu kỳ beta hoặc thông thường.
- Các bản dựng alpha/hằng đêm sử dụng chu kỳ bản vá chưa phát hành tiếp theo và chỉ tăng `alpha.N` cho các lần dựng lặp lại. Sau khi bản vá đó có bản beta, các bản dựng alpha mới chuyển sang bản vá kế tiếp.
- Các phiên bản npm là bất biến: không bao giờ xóa, xuất bản lại hoặc tái sử dụng một thẻ đã xuất bản. Thay vào đó, hãy tạo số phát hành trước tiếp theo hoặc bản vá hằng tháng tiếp theo.
- `latest` tiếp tục đi theo dòng npm thông thường/hằng ngày hiện tại; `beta` là đích cài đặt beta hiện tại
- `extended-stable` có nghĩa là gói npm của tháng gần nhất được hỗ trợ, bắt đầu từ bản vá `33`; bản vá `34` trở đi là các bản phát hành bảo trì trên dòng hằng tháng đó
- Các bản phát hành cuối thông thường và bản sửa lỗi thông thường mặc định được xuất bản lên npm `beta`; người vận hành phát hành có thể chỉ định rõ `latest`, hoặc quảng bá một bản dựng beta đã được thẩm định sau đó
- Luồng extended-stable hằng tháng chuyên biệt xuất bản gói npm lõi và mọi plugin chính thức có thể xuất bản lên npm ở cùng một phiên bản chính xác. Luồng này không xuất bản plugin lên ClawHub, cũng không xuất bản cấu phần macOS hoặc Windows, GitHub Release, dist-tag của kho lưu trữ riêng tư, ảnh Docker, cấu phần di động hoặc nội dung tải xuống từ trang web.
- Mỗi bản phát hành cuối thông thường đều phát hành đồng thời gói npm, ứng dụng macOS, APK Android độc lập đã ký và trình cài đặt Windows Hub đã ký. Các bản phát hành beta thường xác thực và xuất bản luồng npm/gói trước, còn việc dựng/ký/công chứng/quảng bá ứng dụng gốc được dành cho bản phát hành cuối thông thường trừ khi có yêu cầu rõ ràng.

## Nhịp độ phát hành

- Các bản phát hành chuyển qua beta trước; stable chỉ theo sau sau khi bản beta mới nhất được xác thực
- Người bảo trì thường tạo bản phát hành từ một nhánh `release/YYYY.M.PATCH` được tạo từ `main` hiện tại, để quá trình xác thực và sửa lỗi phát hành không chặn hoạt động phát triển mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc xuất bản và cần sửa lỗi, người bảo trì tạo thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục chỉ dành cho người bảo trì

## Xuất bản extended-stable hằng tháng chỉ trên npm

Đây là một ngoại lệ chuyên biệt đối với quy trình phát hành thông thường bên dưới. Với một
tháng đã hoàn tất `YYYY.M`, hãy tạo `extended-stable/YYYY.M.33`; xuất bản
`vYYYY.M.33` và các bản vá bảo trì sau đó từ chính nhánh đó. Thẻ phát hành,
đầu nhánh, checkout, phiên bản gói, bước kiểm tra trước npm và lần chạy Full Release
Validation đều phải xác định cùng một commit. `main` được bảo vệ phải
đã chứa phiên bản cuối của một tháng dương lịch muộn hơn hoàn toàn, có bản vá thấp hơn
`33`; các bản vá bảo trì vẫn đủ điều kiện sau khi `main` tiến thêm hơn một
tháng.

Trên đúng nhánh extended-stable, hãy nâng gói gốc lên `YYYY.M.P`, chạy
`pnpm release:prep`, rồi xác minh mọi gói extension có thể xuất bản đều có
cùng phiên bản. Commit và đẩy tất cả thay đổi đã tạo, tạo và đẩy
thẻ `vYYYY.M.P` bất biến tại commit đó, rồi ghi lại SHA đầy đủ thu được.
Các quy trình làm việc sử dụng cây đã chuẩn bị này; chúng không nâng hoặc đồng bộ hóa
phiên bản thay cho bạn.

Chạy bước kiểm tra trước npm và Full Release Validation từ đúng đầu nhánh
đã chuẩn bị đó, sau đó lưu cả hai ID lần chạy và số lần thử thành công của Full Release Validation:

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
tách biệt với dist-tag npm `extended-stable` và được chủ ý
giữ nguyên.

Sau khi cả hai lần chạy thành công, hãy xuất bản mọi plugin chính thức có thể xuất bản lên npm từ
cùng một đầu nhánh chính xác. Bản vá `P` phải là `33` trở lên. Truyền SHA phát hành đầy đủ
dưới dạng `ref`, chờ toàn bộ ma trận và quá trình đọc lại từ registry hoàn tất, sau đó lưu
ID lần chạy Plugin NPM Release thành công:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Quy trình làm việc sử dụng danh mục gói `all-publishable` đã chuẩn bị thông thường,
bao gồm cả các gói không có thay đổi về mã nguồn. Quy trình xác minh từng gói chính xác
và từng thẻ plugin `extended-stable` trước khi thành công. Nếu một lần chạy một phần
thất bại, hãy chạy lại cùng lệnh: các gói đã xuất bản được tái sử dụng, các thẻ plugin
bị thiếu hoặc cũ được đối soát trong môi trường phát hành npm, và lần đọc lại
cuối cùng vẫn bao phủ toàn bộ tập hợp gói.

Sau khi quy trình plugin thành công và môi trường phát hành npm đã sẵn sàng,
hãy xuất bản tarball lõi chính xác từ bước kiểm tra trước. Việc xuất bản lõi xác minh rằng
lần chạy plugin được tham chiếu là `completed/success` trên cùng nhánh chuẩn và
đúng SHA nguồn:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

Đối với một fork hoặc buổi diễn tập phi sản xuất cố ý không thể đáp ứng
chính sách tháng `.33` hoặc `main` được bảo vệ, hãy thêm
`-f bypass_extended_stable_guard=true` vào cả lệnh điều phối kiểm tra trước và xuất bản
npm. Giá trị mặc định là `false`. Cơ chế bỏ qua chỉ được chấp nhận với
`npm_dist_tag=extended-stable` và được ghi lại trong bản tóm tắt quy trình làm việc. Cơ chế này
không bỏ qua tham chiếu quy trình làm việc `extended-stable/YYYY.M.33` chuẩn,
tính bằng nhau giữa đầu nhánh/thẻ/checkout, cú pháp thẻ cuối, tính bằng nhau giữa phiên bản gói/thẻ,
danh tính của lần chạy và manifest được tham chiếu, nguồn gốc tarball,
phê duyệt môi trường, đọc lại registry hoặc bằng chứng sửa chữa bộ chọn.

Quy trình xuất bản xác minh danh tính của các lần chạy kiểm tra trước, xác thực và plugin
được tham chiếu, bản tóm lược tarball đã chuẩn bị và các bộ chọn registry lõi.
Hãy xác nhận độc lập kết quả sau khi quy trình làm việc thành công:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Cả hai lệnh phải trả về `YYYY.M.P`. Nếu xuất bản thành công nhưng việc
đọc lại bộ chọn thất bại, không xuất bản lại phiên bản gói bất biến. Hãy sử dụng
lệnh sửa chữa `npm dist-tag add openclaw@YYYY.M.P extended-stable` duy nhất
được in trong bản tóm tắt luôn chạy của quy trình làm việc thất bại, sau đó lặp lại cả hai
lần đọc lại độc lập. Khôi phục về bộ chọn trước đó là một quyết định riêng của người vận hành,
không phải luồng sửa chữa đọc lại.

Tài liệu hỗ trợ công khai ban đầu chỉ định Slack, Discord và Codex là
các bề mặt plugin extended-stable được hỗ trợ. Danh sách đó là tuyên bố hỗ trợ, không phải
danh sách cho phép trong mã phát hành: mọi plugin chính thức có thể xuất bản lên npm đều tuân theo
cùng một luồng xuất bản phiên bản chính xác.

Danh sách kiểm tra thông thường bên dưới tiếp tục phụ trách beta, `latest`, GitHub Release,
plugin, macOS, Windows và việc xuất bản trên các nền tảng khác. Không chạy các
bước đó cho luồng extended-stable chỉ dành cho npm này.

## Danh sách kiểm tra dành cho người vận hành phát hành thông thường

Danh sách kiểm tra này mô tả công khai luồng phát hành. Thông tin xác thực riêng tư, quy trình ký, công chứng, khôi phục dist-tag và chi tiết hoàn tác khẩn cấp vẫn nằm trong sổ tay phát hành chỉ dành cho người bảo trì.

1. Bắt đầu từ `main` hiện tại: kéo bản mới nhất, xác nhận commit đích đã được đẩy và xác nhận CI `main` đủ xanh để tạo nhánh từ đó.
2. Tạo `release/YYYY.M.PATCH` từ commit đó. Việc backport là tùy chọn; chỉ áp dụng tập hợp do người vận hành chọn. Nâng mọi vị trí phiên bản bắt buộc, chạy `pnpm release:prep`, hoàn tất các bản sửa lỗi phát hành và forward-port bắt buộc, rồi review `src/plugins/compat/registry.ts` cùng `src/commands/doctor/shared/deprecation-compat.ts`.
3. Đóng băng commit hoàn chỉnh về sản phẩm trước changelog làm **Code SHA**. Chạy bước kiểm tra trước mã nguồn có tính xác định, sau đó sử dụng `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Thao tác này ghim công cụ quy trình làm việc đáng tin cậy trong khi toàn bộ ma trận Vitest, Docker, QA, gói và hiệu năng nhắm đến đúng Code SHA.
4. Phân loại lỗi trước khi chỉnh sửa. Lỗi sản phẩm/mã tạo ra Code SHA mới và yêu cầu xác thực đầy đủ thành công cho SHA đó. Lỗi quy trình làm việc, bộ kiểm thử, thông tin xác thực, phê duyệt hoặc hạ tầng được sửa chữa trong bề mặt sở hữu tương ứng và chạy lại với cùng Code SHA.
5. Chỉ sau khi Code SHA đã xanh, hãy tạo phần `CHANGELOG.md` trên cùng từ các PR đã hợp nhất và commit trực tiếp kể từ thẻ đã phát hành gần nhất có thể truy cập. Giữ các mục hướng đến người dùng và loại bỏ trùng lặp. Khi một thẻ đã phát hành phân kỳ hoặc một forward-port sau đó liên kết lại các PR đã được phát hành, hãy truyền rõ thẻ đó dưới dạng `--shipped-ref`.
6. Chỉ commit `CHANGELOG.md`. Commit này là **Release SHA**. Toàn bộ diff từ Code SHA đến Release SHA phải chính xác là `CHANGELOG.md`; bất kỳ đường dẫn thay đổi nào khác đều đưa quy trình phát hành trở lại bước 2.
7. Chạy Full Release Validation được ghim theo SHA cho Release SHA với tính năng tái sử dụng bằng chứng được bật. Tiến trình cha nhẹ phải ghi lại `changelog-only-release-v1`, trỏ đến Code SHA đã xanh và không điều phối làn con sản phẩm nào. Thao tác này tái sử dụng bằng chứng sản phẩm; không tái sử dụng byte của gói.
8. Chạy `OpenClaw NPM Release` với `preflight_only=true` trên Release SHA/thẻ. Lưu `preflight_run_id` thành công. Thao tác này dựng và kiểm tra chính xác các byte gói có chứa changelog cuối cùng.
9. Gắn thẻ Release SHA, sau đó chạy trình trợ giúp ứng viên với tiến trình cha xác thực Release-SHA thành công và bước kiểm tra trước npm thay vì điều phối lại một trong hai:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Đối với bản ổn định, cũng truyền `--windows-node-tag vX.Y.Z`. Trình trợ giúp xác minh nguồn gốc ghi chú phát hành, byte kiểm tra sơ bộ npm, bằng chứng cài đặt/cập nhật Parallels, bằng chứng gói Telegram và kế hoạch phát hành plugin, sau đó in lệnh phát hành.

   `OpenClaw Release Publish` điều phối các gói plugin đã chọn hoặc tất cả gói plugin có thể phát hành lên npm và đồng thời điều phối cùng tập hợp đó lên ClawHub, sau đó quảng bá cấu phần kiểm tra sơ bộ npm của OpenClaw đã chuẩn bị với dist-tag tương ứng sau khi việc phát hành plugin lên npm thành công. Checkout phát hành vẫn là gốc sản phẩm/dữ liệu, còn việc lập kế hoạch và xác minh cuối cùng được thực thi từ checkout nguồn quy trình làm việc đáng tin cậy chính xác để một commit phát hành cũ hơn không thể âm thầm sử dụng công cụ phát hành lỗi thời. Trước khi bất kỳ tiến trình con phát hành nào bắt đầu, quy trình kết xuất và lưu vào bộ nhớ đệm nội dung chính xác của bản phát hành GitHub. Khi toàn bộ phần `CHANGELOG.md` tương ứng nằm trong giới hạn 125.000 ký tự của GitHub và ngưỡng an toàn 125.000 byte tương ứng của trình kết xuất, trang sẽ chứa chính xác phần `## YYYY.M.PATCH` đó, bao gồm cả tiêu đề. Khi phần nguồn vượt giới hạn, trang giữ nguyên chính xác các ghi chú biên tập đã nhóm và thay bản ghi đóng góp quá lớn bằng một liên kết ổn định đến bản ghi đầy đủ trong `CHANGELOG.md` được ghim theo thẻ; bản ghi không đầy đủ và các dấu đầu dòng bị cắt ngắn không bao giờ được phát hành. Quy trình làm việc chọn nội dung đầy đủ hoặc thu gọn đó trước khi thêm `### Release verification`; nếu phần đuôi bằng chứng vượt giới hạn, quy trình giữ nội dung chuẩn và thay vào đó dựa vào bằng chứng đính kèm bất biến. Các bản phát hành ổn định được phát hành lên npm `latest` trở thành bản phát hành mới nhất trên GitHub, còn các bản phát hành bảo trì ổn định được giữ trên npm `beta` được tạo với `latest=false` của GitHub. Quy trình làm việc cũng tải bằng chứng phụ thuộc kiểm tra sơ bộ, bản kê khai xác thực đầy đủ và bằng chứng xác minh registry sau phát hành lên bản phát hành GitHub để phục vụ ứng phó sự cố sau phát hành. Quy trình in ngay ID của các lần chạy con, tự động phê duyệt các cổng môi trường phát hành mà token quy trình làm việc được phép phê duyệt, tóm tắt các công việc con thất bại kèm phần cuối nhật ký, tạo trước trang bản phát hành GitHub dạng bản nháp và đồng thời quảng bá các tài sản Windows và Android với việc phát hành OpenClaw lên npm, hoàn tất trang phát hành và bằng chứng phụ thuộc sau khi các giai đoạn đó thành công, chờ ClawHub bất cứ khi nào OpenClaw đang được phát hành lên npm, sau đó chạy trình xác minh beta trên nhánh main đáng tin cậy và tải lên bằng chứng sau phát hành cho bản phát hành GitHub, gói npm, các gói npm plugin đã chọn, các gói ClawHub đã chọn, ID lần chạy quy trình con và ID lần chạy NPM Telegram tùy chọn. Trình xác minh khởi tạo ClawHub yêu cầu chính xác đường dẫn và SHA của quy trình làm việc trên nhánh main đáng tin cậy, các lần thử chạy của bên tạo và lần chạy kết thúc, SHA phát hành, tập hợp gói được yêu cầu, bộ giá trị cấu phần gói bất biến và cấu phần đọc lại registry cuối cùng; một lần chạy ref phát hành kiểu cũ thành công không được chấp nhận.

   Sau đó chạy kiểm thử chấp nhận gói sau phát hành đối với gói `openclaw@YYYY.M.PATCH-beta.N` hoặc `openclaw@beta` đã phát hành. Nếu một bản tiền phát hành đã đẩy hoặc phát hành cần sửa, hãy tạo số bản tiền phát hành tương ứng tiếp theo; tuyệt đối không xóa hoặc ghi lại bản cũ.

10. Khi một lần phát hành thất bại, giữ nguyên SHA Phát hành trừ khi lỗi chứng minh có khiếm khuyết trong sản phẩm hoặc nhật ký thay đổi. Tiếp tục sử dụng các tiến trình con và cấu phần bất biến đã thành công; tuyệt đối không dựng lại hoặc phát hành lại phiên bản gói đã thành công.
11. Đối với bản ổn định, chỉ tiếp tục sau khi bản beta hoặc ứng viên phát hành đã được thẩm định có đủ bằng chứng xác thực bắt buộc. Việc phát hành npm ổn định cũng đi qua `OpenClaw Release Publish`, tái sử dụng cấu phần kiểm tra sơ bộ thành công thông qua `preflight_run_id`. Mức sẵn sàng phát hành macOS ổn định cũng yêu cầu các `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói và `appcast.xml` đã cập nhật trên `main`; quy trình phát hành macOS tự động phát hành appcast đã ký lên `main` công khai sau khi xác minh các tài sản phát hành, hoặc mở/cập nhật một pull request appcast nếu chế độ bảo vệ nhánh chặn thao tác đẩy trực tiếp. Mức sẵn sàng của Windows Hub ổn định yêu cầu các tài sản `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` và `OpenClawCompanion-SHA256SUMS.txt` đã ký trên bản phát hành GitHub của OpenClaw. Truyền chính xác thẻ phát hành `openclaw/openclaw-windows-node` đã ký dưới dạng `windows_node_tag` và bản đồ digest trình cài đặt đã được ứng viên phê duyệt của thẻ đó dưới dạng `windows_node_installer_digests`; `OpenClaw Release Publish` giữ bản nháp phát hành, điều phối `Windows Node Release` và xác minh cả ba tài sản trước khi phát hành.
12. Sau khi phát hành, chạy trình xác minh npm sau phát hành, kiểm thử E2E Telegram độc lập tùy chọn trên npm đã phát hành khi cần bằng chứng kênh sau phát hành, quảng bá dist-tag khi cần, xác minh trang bản phát hành GitHub đã tạo, chạy các bước thông báo phát hành, sau đó hoàn tất [Hoàn tất nhánh main cho bản ổn định](#stable-main-closeout) trước khi tuyên bố một bản phát hành ổn định đã hoàn thành.

## Hoàn tất nhánh main cho bản ổn định

Việc phát hành bản ổn định chưa hoàn tất cho đến khi `main` mang trạng thái phát hành thực tế đã được cung cấp.

1. Bắt đầu từ `main` mới nhất và mới được cập nhật. Kiểm tra `release/YYYY.M.PATCH` dựa trên đó và chuyển tiếp các bản sửa thực sự chưa có trong `main`. Không hợp nhất một cách mù quáng các bộ điều hợp tương thích, kiểm thử hoặc xác thực chỉ dành cho bản phát hành vào `main` mới hơn.
2. Đối với đường dẫn thông thường, đặt `main` thành phiên bản ổn định đã được cung cấp. Một lần hoàn tất muộn có thể sử dụng `main` sau khi nó đã tiến tới một OpenClaw CalVer ổn định mới hơn; không hạ cấp một chu kỳ phát hành đã bắt đầu chỉ để hoàn tất bản phát hành trước đó. Trình xác thực vẫn yêu cầu chính xác phần nhật ký thay đổi và mục appcast của bản đã cung cấp, đồng thời ghi lại phiên bản và SHA thực tế của `main`. Chạy `pnpm release:prep` sau bất kỳ thay đổi phiên bản gốc nào, rồi chạy `pnpm deps:shrinkwrap:generate`.
3. Làm cho phần `## YYYY.M.PATCH` của `CHANGELOG.md` trên `main` khớp chính xác với nhánh phát hành đã gắn thẻ. Bao gồm bản cập nhật `appcast.xml` ổn định khi bản phát hành Mac đã phát hành một bản như vậy.
4. Không thêm `YYYY.M.PATCH+1`, phiên bản beta hoặc phần nhật ký thay đổi tương lai trống vào `main` cho đến khi người vận hành khởi động chu kỳ phát hành đó một cách rõ ràng.
5. Chạy `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` và `OPENCLAW_TESTBOX=1 pnpm check:changed`. Đẩy lên, sau đó xác minh `origin/main` chứa phiên bản và nhật ký thay đổi đã được cung cấp trước khi tuyên bố bản phát hành ổn định đã hoàn tất.
6. Luôn cập nhật các biến kho lưu trữ `RELEASE_ROLLBACK_DRILL_ID` và `RELEASE_ROLLBACK_DRILL_DATE` sau mỗi lần diễn tập hoàn tác riêng tư.

`OpenClaw Stable Main Closeout` bắt đầu từ thao tác đẩy `main` mang phiên bản, nhật ký thay đổi và appcast đã được cung cấp sau khi phát hành bản ổn định. Quy trình đọc bằng chứng sau phát hành bất biến để liên kết thẻ đã cung cấp với các lần chạy Xác thực Phát hành Đầy đủ và Phát hành tương ứng, sau đó xác minh trạng thái nhánh main ổn định, bản phát hành, thời gian theo dõi ổn định bắt buộc và bằng chứng hiệu năng có tính chặn. Quy trình đính kèm bản kê khai hoàn tất bất biến và checksum vào bản phát hành GitHub. Trình kích hoạt đẩy tự động bỏ qua các bản phát hành kiểu cũ có trước bằng chứng sau phát hành bất biến và không bao giờ coi lần bỏ qua đó là một lần hoàn tất đã hoàn thành.

Một lần hoàn tất đầy đủ yêu cầu cả hai tài sản và một checksum khớp. Bản kê khai không đầy đủ phát lại SHA `main` và lần diễn tập hoàn tác đã ghi để tái tạo các byte giống hệt, sau đó đính kèm checksum còn thiếu; một cặp không hợp lệ hoặc một checksum không có bản kê khai vẫn tiếp tục chặn. Một lần chạy được kích hoạt bằng thao tác đẩy nhưng không có các biến kho lưu trữ cho diễn tập hoàn tác sẽ bị bỏ qua mà không hoàn tất quy trình; bản ghi diễn tập bị thiếu hoặc cũ hơn 90 ngày vẫn chặn việc hoàn tất thủ công dựa trên bằng chứng. Các lệnh khôi phục riêng tư vẫn nằm trong runbook chỉ dành cho người bảo trì. Chỉ dùng điều phối thủ công để sửa chữa hoặc phát lại một lần hoàn tất bản ổn định có bằng chứng hỗ trợ.

Nếu tiến trình cha Phát hành Bản phát hành chỉ thất bại sau khi bằng chứng npm/plugin bất biến đã được đính kèm, trước tiên hãy sửa chữa và phát hành mọi tài sản nền tảng ổn định. Sau đó, người bảo trì có thể điều phối thủ công quy trình hoàn tất với `allow_failed_publish_recovery=true`; chế độ đó chỉ chấp nhận một tiến trình cha đã hoàn thành nhưng thất bại và còn yêu cầu chính xác các hợp đồng tài sản Android và Windows, digest SHA-256 của GitHub, xác minh checksum, nguồn gốc Android và một lần quảng bá Windows do tiến trình cha điều phối đã thành công, trong đó các phép kiểm tra Authenticode và digest đã được ứng viên phê duyệt khớp với các trình cài đặt đã phát hành, cùng với các phép kiểm tra macOS/appcast thông thường. Quy trình hoàn tất tự động từ thao tác đẩy không bao giờ bật chế độ khôi phục này.

Một thẻ sửa lỗi dự phòng kiểu cũ chỉ có thể tái sử dụng bằng chứng gói cơ sở khi thẻ sửa lỗi phân giải tới cùng commit nguồn với thẻ ổn định cơ sở. Bản phát hành Android của thẻ đó tái sử dụng APK đã xác minh của thẻ cơ sở và bổ sung nguồn gốc cho thẻ sửa lỗi. Một bản sửa lỗi có nguồn khác phải phát hành và xác minh bằng chứng gói riêng, đồng thời sử dụng `versionCode` Android cao hơn.

## Kiểm tra sơ bộ phát hành

- Chạy `pnpm check:test-types` trước bước kiểm tra sơ bộ phát hành để TypeScript kiểm thử vẫn được bao phủ ngoài cổng `pnpm check` cục bộ nhanh hơn.
- Chạy `pnpm check:architecture` trước bước kiểm tra sơ bộ phát hành để các phép kiểm tra chu trình import và ranh giới kiến trúc rộng hơn đạt trạng thái xanh ngoài cổng cục bộ nhanh hơn.
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các cấu phần phát hành `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực gói.
- Chạy `pnpm release:prep` sau khi tăng phiên bản gốc và trước khi gắn thẻ. Lệnh này chạy mọi trình tạo phát hành xác định thường bị sai lệch sau thay đổi phiên bản/cấu hình/API: phiên bản plugin, shrinkwrap npm, danh mục plugin, lược đồ cấu hình cơ sở, siêu dữ liệu cấu hình kênh đi kèm, đường cơ sở tài liệu cấu hình, export SDK plugin, bản kê khai hợp đồng API SDK Plugin và các gói bản địa hóa Control UI. Lệnh cũng chặn cho đến khi bản dịch ứng dụng native và tài nguyên bản địa hóa do nền tảng tạo khớp với danh mục nguồn; nếu chúng bị chậm, hãy chờ hoặc điều phối `Native App Locale Refresh` trước khi đóng băng SHA Mã. `pnpm release:check` chạy lại các bộ bảo vệ đó ở chế độ kiểm tra (bao gồm các cổng bản địa hóa nghiêm ngặt cùng ngân sách bề mặt SDK plugin) và báo cáo mọi lỗi sai lệch do tạo sinh trong một lượt trước khi chạy các bước kiểm tra phát hành gói.
- Việc đồng bộ phiên bản plugin cập nhật theo mặc định gói thời gian chạy `@openclaw/ai` có thể phát hành, phiên bản các gói plugin chính thức và các mức sàn `openclaw.compat.pluginApi` hiện có lên phiên bản phát hành OpenClaw. Hãy coi trường đó là mức sàn API SDK/thời gian chạy plugin, không chỉ là bản sao của phiên bản gói: đối với các bản phát hành chỉ dành cho plugin nhưng chủ ý vẫn tương thích với máy chủ OpenClaw cũ hơn, hãy giữ mức sàn ở API máy chủ cũ nhất được hỗ trợ và ghi lại lựa chọn đó trong bằng chứng phát hành plugin.
- Chạy quy trình làm việc `Full Release Validation` thủ công trước khi phê duyệt phát hành để khởi động tất cả hộp kiểm thử tiền phát hành từ một điểm vào duy nhất. Quy trình chấp nhận nhánh, thẻ hoặc SHA commit đầy đủ, điều phối thủ công `CI`, đồng thời điều phối `OpenClaw Release Checks` cho các làn kiểm thử nhanh cài đặt, chấp nhận gói, kiểm tra gói đa hệ điều hành, tính tương đương QA Lab, Matrix và Telegram. Các lần chạy ổn định và đầy đủ luôn bao gồm kiểm thử live/E2E toàn diện và thời gian theo dõi đường dẫn phát hành Docker; `run_release_soak=true` được giữ lại cho một đợt theo dõi beta rõ ràng. Chấp nhận Gói cung cấp kiểm thử E2E Telegram gói chuẩn trong quá trình xác thực ứng viên, tránh chạy đồng thời trình thăm dò trực tiếp thứ hai.

  Cung cấp `release_package_spec` sau khi phát hành bản beta để tái sử dụng gói npm đã được cung cấp trong các bước kiểm tra phát hành, Chấp nhận Gói và E2E Telegram gói mà không dựng lại tarball phát hành. Chỉ cung cấp `npm_telegram_package_spec` khi Telegram cần sử dụng một gói đã phát hành khác với phần còn lại của quá trình xác thực phát hành. Cung cấp `package_acceptance_package_spec` khi Chấp nhận Gói cần sử dụng một gói đã phát hành khác với đặc tả gói phát hành. Cung cấp `evidence_package_spec` khi báo cáo bằng chứng phát hành cần chứng minh rằng quá trình xác thực khớp với một gói npm đã phát hành mà không buộc chạy E2E Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Chạy quy trình thủ công `Package Acceptance` khi cần bằng chứng qua kênh phụ cho một gói ứng viên trong lúc công việc phát hành vẫn tiếp tục. Sử dụng `source=npm` cho `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành chính xác; `source=ref` để đóng gói một nhánh/thẻ/SHA `package_ref` đáng tin cậy bằng bộ kiểm thử `workflow_ref` hiện tại; `source=url` cho một tarball HTTPS công khai với SHA-256 bắt buộc và chính sách URL công khai nghiêm ngặt; `source=trusted-url` cho một chính sách nguồn đáng tin cậy có tên, sử dụng `trusted_source_id` và SHA-256 bắt buộc; hoặc `source=artifact` cho một tarball do một lượt chạy GitHub Actions khác tải lên.

  Quy trình phân giải ứng viên thành `package-under-test`, tái sử dụng bộ lập lịch phát hành E2E Docker với tarball đó và có thể chạy QA Telegram trên cùng tarball bằng `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các làn Docker đã chọn bao gồm `published-upgrade-survivor`, gói hiện vật là ứng viên và `published_upgrade_survivor_baseline` chọn đường cơ sở đã phát hành. `update-restart-auth` sử dụng gói ứng viên làm cả CLI đã cài đặt lẫn gói đang được kiểm thử, nhờ đó kiểm tra đường dẫn khởi động lại có quản lý của lệnh cập nhật ứng viên.

  Ví dụ:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Các hồ sơ thường dùng:
  - `smoke`: các làn cài đặt/kênh/tác nhân, mạng Gateway và tải lại cấu hình
  - `package`: các làn gói/cập nhật/khởi động lại/plugin dùng trực tiếp hiện vật, không có OpenWebUI hoặc ClawHub trực tiếp
  - `product`: hồ sơ gói cùng các kênh MCP, dọn dẹp cron/tác nhân phụ, tìm kiếm web OpenAI và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker cùng OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác cho một lượt chạy lại tập trung

- Chạy trực tiếp quy trình thủ công `CI` khi chỉ cần độ bao phủ CI thông thường, có tính xác định cho ứng viên phát hành. Các lượt kích hoạt CI thủ công bỏ qua phạm vi thay đổi và bắt buộc chạy các phân đoạn Linux Node, phân đoạn plugin đi kèm, phân đoạn hợp đồng plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra nhanh hiện vật đã dựng, kiểm tra tài liệu, Skills Python, Windows, macOS và các làn i18n của Control UI. Các lượt CI thủ công độc lập chỉ chạy Android khi được kích hoạt với `include_android=true`; `Full Release Validation` truyền đầu vào đó cho CI con của nó.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Chạy `pnpm qa:otel:smoke` khi xác thực dữ liệu đo từ xa của bản phát hành. Quy trình này kiểm tra QA-lab qua một bộ nhận OTLP/HTTP cục bộ và xác minh việc xuất dấu vết, chỉ số và nhật ký, cùng các thuộc tính dấu vết được giới hạn và việc biên tập nội dung/mã định danh mà không yêu cầu Opik, Langfuse hoặc bộ thu thập bên ngoài khác.
- Chạy `pnpm qa:otel:collector-smoke` khi xác thực khả năng tương thích của bộ thu thập. Quy trình này định tuyến cùng dữ liệu xuất OTLP của QA-lab qua một vùng chứa Docker OpenTelemetry Collector thực trước khi thực hiện các xác nhận của bộ nhận cục bộ.
- Chạy `pnpm qa:prometheus:smoke` khi xác thực việc thu thập Prometheus được bảo vệ. Quy trình này kiểm tra QA-lab, từ chối các lượt thu thập chưa xác thực và xác minh rằng các họ chỉ số trọng yếu đối với bản phát hành không chứa nội dung lời nhắc, mã định danh thô, token xác thực và đường dẫn cục bộ.
- Chạy `pnpm qa:observability:smoke` để thực hiện liên tiếp các làn kiểm tra nhanh OpenTelemetry và Prometheus từ mã nguồn đã checkout.
- Chạy `pnpm release:check` trước mỗi bản phát hành có gắn thẻ.
- Bước kiểm tra trước `OpenClaw NPM Release` tạo bằng chứng phát hành về phần phụ thuộc trước khi đóng gói tarball npm. Cổng lỗ hổng tư vấn npm sẽ chặn phát hành. Rủi ro bản kê khai bắc cầu, bề mặt sở hữu/cài đặt phần phụ thuộc và các báo cáo thay đổi phần phụ thuộc chỉ là bằng chứng phát hành. Báo cáo thay đổi phần phụ thuộc so sánh ứng viên phát hành với thẻ phát hành có thể truy cập trước đó. Bước kiểm tra trước tải bằng chứng phần phụ thuộc lên dưới dạng `openclaw-release-dependency-evidence-<tag>` và cũng nhúng bằng chứng đó vào `dependency-evidence/` bên trong hiện vật kiểm tra trước npm đã chuẩn bị. Đường dẫn phát hành thực tế tái sử dụng hiện vật kiểm tra trước đó, rồi đính kèm cùng bằng chứng vào bản phát hành GitHub dưới dạng `openclaw-<version>-dependency-evidence.zip`.
- Chạy `OpenClaw Release Publish` cho chuỗi xuất bản có thay đổi trạng thái sau khi thẻ đã tồn tại. Kích hoạt các lượt xuất bản beta và ổn định thông thường từ `main` đáng tin cậy; thẻ phát hành vẫn chọn commit đích chính xác và có thể trỏ vào `release/YYYY.M.PATCH`. Các lượt xuất bản alpha Tideclaw vẫn nằm trên nhánh alpha tương ứng. Truyền `preflight_run_id` npm OpenClaw thành công, `full_release_validation_run_id` thành công và `full_release_validation_run_attempt` chính xác, đồng thời giữ phạm vi xuất bản plugin mặc định `all-publishable` trừ khi chủ ý chạy một bản sửa chữa tập trung. Quy trình tuần tự hóa việc xuất bản plugin lên npm, xuất bản plugin lên ClawHub và xuất bản OpenClaw lên npm để gói lõi không được xuất bản trước các plugin đã được ngoại vi hóa; việc quảng bá Windows và Android chạy đồng thời với việc xuất bản npm lõi dựa trên trang bản phát hành nháp. Các lượt chạy lại xuất bản có thể tiếp tục: phiên bản npm lõi đã được xuất bản sẽ bỏ qua lượt kích hoạt lõi sau khi quy trình chứng minh tarball trên registry khớp với hiện vật kiểm tra trước của thẻ, còn việc quảng bá Windows/Android sẽ bị bỏ qua khi bản phát hành đã chứa hợp đồng hiện vật đã xác minh, vì vậy một lần thử lại chỉ thực hiện lại các giai đoạn thất bại. Các bản sửa chữa chỉ dành cho plugin có phạm vi tập trung yêu cầu `plugin_publish_scope=selected` và danh sách plugin không rỗng. Các lượt `all-publishable` chỉ dành cho plugin yêu cầu bằng chứng kiểm tra trước bất biến, đầy đủ và bằng chứng Xác thực Bản phát hành Đầy đủ; bằng chứng một phần sẽ bị từ chối.
- `OpenClaw Release Publish` ổn định yêu cầu một `windows_node_tag` chính xác sau khi bản phát hành `openclaw/openclaw-windows-node` tương ứng không phải bản phát hành trước đã tồn tại, cùng với ánh xạ `windows_node_installer_digests` đã được ứng viên phê duyệt. Trước khi kích hoạt bất kỳ quy trình con xuất bản nào, quy trình xác minh rằng bản phát hành nguồn đã được xuất bản, không phải bản phát hành trước, chứa các trình cài đặt x64/ARM64 bắt buộc và vẫn khớp với ánh xạ đã phê duyệt đó. Sau đó, quy trình kích hoạt `Windows Node Release` trong khi bản phát hành OpenClaw vẫn là bản nháp, giữ nguyên ánh xạ mã băm trình cài đặt đã ghim. Quy trình con tải xuống các trình cài đặt Windows Hub đã ký từ chính xác thẻ đó, đối chiếu chúng với các mã băm đã ghim, xác minh chữ ký Authenticode của chúng sử dụng bên ký OpenClaw Foundation dự kiến trên một runner Windows, ghi bản kê khai SHA-256 và tải các trình cài đặt cùng bản kê khai lên bản phát hành GitHub OpenClaw chính thức, sau đó tải lại các hiện vật đã quảng bá và xác minh tư cách thành viên trong bản kê khai cùng các giá trị băm. Quy trình cha xác minh hợp đồng hiện vật x64, ARM64 và checksum hiện tại trước khi xuất bản. Khôi phục trực tiếp từ chối các tên hiện vật `OpenClawCompanion-*` không mong đợi trước khi thay thế các hiện vật hợp đồng dự kiến bằng các byte nguồn đã ghim.

  Chỉ kích hoạt thủ công `Windows Node Release` để khôi phục và luôn truyền một thẻ chính xác, không bao giờ truyền `latest`, cùng ánh xạ JSON `expected_installer_digests` rõ ràng từ bản phát hành nguồn đã phê duyệt. Các liên kết tải xuống trên trang web phải trỏ đến URL hiện vật bản phát hành OpenClaw chính xác cho bản phát hành ổn định hiện tại, hoặc chỉ trỏ đến `releases/latest/download/...` sau khi xác minh rằng chuyển hướng mới nhất của GitHub trỏ đến cùng bản phát hành đó; không chỉ liên kết đến trang phát hành của kho lưu trữ đi kèm.

- Các bước kiểm tra bản phát hành hiện chạy trong một workflow thủ công riêng: `OpenClaw Release Checks`. Workflow này cũng chạy lane đối chiếu bản mô phỏng QA Lab cùng với hồ sơ phát hành Matrix và lane QA Telegram trước khi phê duyệt phát hành. Các lane trực tiếp sử dụng môi trường `qa-live-shared`; Telegram cũng sử dụng các lượt thuê thông tin xác thực Convex CI. Chạy workflow `QA-Lab - All Lanes` thủ công với `matrix_profile=all` khi cần mọi kịch bản Matrix đang được duy trì; workflow phân tách lựa chọn đó trên các hồ sơ truyền tải, phương tiện và E2EE để giữ toàn bộ bằng chứng trong giới hạn thời gian chờ của từng tác vụ.
- Việc xác thực thời gian chạy khi cài đặt và nâng cấp trên nhiều hệ điều hành là một phần của `OpenClaw Release Checks` và `Full Release Validation` công khai, các workflow này gọi trực tiếp workflow có thể tái sử dụng `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Việc tách này là có chủ đích: giữ đường dẫn phát hành npm thực tế ngắn gọn, xác định và tập trung vào artifact, trong khi các bước kiểm tra trực tiếp chậm hơn nằm trong lane riêng để không làm đình trệ hoặc chặn quá trình phát hành.
- Các bước kiểm tra bản phát hành có chứa bí mật nên được kích hoạt thông qua `Full Release Validation` hoặc từ tham chiếu workflow `main`/release để logic workflow và bí mật luôn được kiểm soát.
- `OpenClaw Release Checks` chấp nhận một nhánh, thẻ hoặc SHA commit đầy đủ, miễn là commit đã phân giải có thể truy cập được từ một nhánh hoặc thẻ phát hành OpenClaw.
- Bước kiểm tra sơ bộ chỉ xác thực `OpenClaw NPM Release` cũng chấp nhận SHA commit đầy đủ gồm 40 ký tự hiện tại của nhánh workflow mà không yêu cầu thẻ đã được đẩy lên. Đường dẫn SHA đó chỉ dùng để xác thực và không thể được thăng cấp thành một lần phát hành thực tế. Trong chế độ SHA, workflow chỉ tổng hợp `v<package.json version>` cho bước kiểm tra siêu dữ liệu gói; việc phát hành thực tế vẫn yêu cầu một thẻ phát hành thực.
- Cả hai workflow đều giữ đường dẫn phát hành và thăng cấp thực tế trên các runner do GitHub lưu trữ, trong khi đường dẫn xác thực không thay đổi dữ liệu có thể sử dụng các runner Blacksmith Linux lớn hơn.
- Workflow đó chạy `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` bằng cả hai bí mật workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`.
- Bước kiểm tra sơ bộ bản phát hành npm không còn chờ lane kiểm tra bản phát hành riêng biệt.
- Trước khi gắn thẻ cục bộ cho một bản phát hành ứng viên, hãy chạy `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Trình trợ giúp chạy các rào chắn phát hành nhanh, kiểm tra phát hành npm/ClawHub của plugin, bản dựng, bản dựng giao diện người dùng và `release:openclaw:npm:check` theo thứ tự giúp phát hiện các lỗi phổ biến có thể chặn phê duyệt trước khi workflow phát hành GitHub bắt đầu.
- Chạy `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (hoặc thẻ phát hành trước/bản sửa tương ứng) trước khi phê duyệt.
- Sau khi phát hành npm, hãy chạy `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (hoặc phiên bản beta/bản sửa tương ứng) để xác minh đường dẫn cài đặt từ registry đã phát hành trong một tiền tố tạm mới.
- Sau khi phát hành bản beta, hãy chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` để xác minh quy trình làm quen của gói đã cài đặt, thiết lập Telegram và E2E Telegram thực tế dựa trên gói npm đã phát hành bằng nhóm thông tin xác thực Telegram dùng chung theo lượt thuê. Đối với các lần chạy riêng lẻ cục bộ, người bảo trì có thể bỏ qua các biến Convex và truyền trực tiếp ba thông tin xác thực môi trường `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy toàn bộ kiểm tra nhanh beta sau phát hành từ máy của người bảo trì, hãy dùng `pnpm release:beta-smoke -- --beta betaN`. Trình trợ giúp chạy xác thực cập nhật npm/mục tiêu mới trên Parallels, kích hoạt `NPM Telegram Beta E2E`, thăm dò chính xác lần chạy workflow, tải xuống artifact và in báo cáo Telegram.
- Người bảo trì có thể chạy cùng bước kiểm tra sau phát hành từ GitHub Actions thông qua workflow `NPM Telegram Beta E2E` thủ công. Workflow này có chủ đích chỉ chạy thủ công và không chạy sau mỗi lần hợp nhất.
- Tự động hóa phát hành dành cho người bảo trì sử dụng quy trình kiểm tra sơ bộ rồi thăng cấp:
  - Việc phát hành npm thực tế phải vượt qua một lần npm `preflight_run_id` thành công.
  - Việc điều phối phát hành và kiểm tra sơ bộ cho bản beta và bản ổn định thông thường sử dụng `main` đáng tin cậy đối với chính xác thẻ đích. Việc phát hành và kiểm tra sơ bộ bản alpha Tideclaw sử dụng nhánh alpha tương ứng.
  - Các bản phát hành npm ổn định mặc định dùng `beta`; việc phát hành npm ổn định có thể nhắm đích rõ ràng đến `latest` thông qua đầu vào workflow.
  - Thao tác thay đổi dist-tag npm dựa trên token nằm trong `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi kho mã nguồn chỉ duy trì phát hành qua OIDC.
  - `macOS Release` công khai chỉ dùng để xác thực; khi một thẻ chỉ tồn tại trên nhánh phát hành nhưng workflow được kích hoạt từ `main`, hãy đặt `public_release_branch=release/YYYY.M.PATCH`.
  - Việc phát hành macOS thực tế phải vượt qua thành công macOS `preflight_run_id` và `validate_run_id`.
  - Các đường dẫn phát hành thực tế thăng cấp các artifact đã chuẩn bị thay vì dựng lại chúng.
- Đối với các bản phát hành sửa lỗi ổn định như `YYYY.M.PATCH-N`, trình xác minh sau phát hành cũng kiểm tra cùng đường dẫn nâng cấp qua tiền tố tạm từ `YYYY.M.PATCH` lên `YYYY.M.PATCH-N` để các bản sửa phát hành không thể âm thầm khiến các bản cài đặt toàn cục cũ hơn vẫn dùng payload ổn định cơ sở.
- Bước kiểm tra sơ bộ bản phát hành npm đóng lỗi trừ khi tarball bao gồm cả `dist/control-ui/index.html` và một payload `dist/control-ui/assets/` không rỗng, để không phát hành lại một bảng điều khiển trình duyệt trống.
- Xác minh sau phát hành cũng kiểm tra rằng các điểm vào plugin đã phát hành và siêu dữ liệu gói hiện diện trong bố cục registry đã cài đặt. Một bản phát hành thiếu payload thời gian chạy plugin sẽ không vượt qua trình xác minh sau phát hành và không thể được thăng cấp lên `latest`.
- `pnpm test:install:smoke` cũng áp dụng ngân sách npm pack `unpackedSize` cho tarball cập nhật ứng viên, để E2E của trình cài đặt phát hiện việc kích thước gói tăng ngoài ý muốn trước đường dẫn phát hành.
- Nếu công việc phát hành đã thay đổi việc lập kế hoạch CI, các bản kê thời gian của tiện ích mở rộng hoặc ma trận kiểm thử tiện ích mở rộng, hãy tạo lại và xem xét các đầu ra ma trận `plugin-prerelease-extension-shard` do trình lập kế hoạch sở hữu từ `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt để ghi chú phát hành không mô tả một bố cục CI lỗi thời.
- Mức độ sẵn sàng của bản phát hành macOS ổn định cũng bao gồm các bề mặt trình cập nhật: bản phát hành GitHub cuối cùng phải có `.zip`, `.dmg` và `.dSYM.zip` đã đóng gói; `appcast.xml` trên `main` phải trỏ đến tệp zip ổn định mới sau khi phát hành (workflow phát hành macOS tự động commit tệp đó hoặc mở một PR appcast khi thao tác đẩy trực tiếp bị chặn); ứng dụng đã đóng gói phải duy trì ID gói không phải bản gỡ lỗi, URL nguồn cấp Sparkle không rỗng và `CFBundleVersion` bằng hoặc cao hơn mức sàn bản dựng Sparkle chuẩn cho phiên bản phát hành đó.

## Các hộp kiểm thử bản phát hành

`Full Release Validation` là cách người vận hành khởi chạy toàn bộ ma trận sản phẩm từ một điểm vào duy nhất. Sử dụng trình trợ giúp để mỗi workflow con chạy từ một nhánh tạm thời được cố định tại một SHA workflow `main` đáng tin cậy, trong khi commit được yêu cầu vẫn là ứng viên đang được kiểm thử:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

Trình trợ giúp tìm nạp `origin/main` hiện tại, đẩy `release-ci/<workflow-sha>-...` tại commit workflow đáng tin cậy đó, suy ra `beta` từ các phiên bản gói alpha/beta và `stable` trong các trường hợp khác, kích hoạt `Full Release Validation` từ nhánh tạm với `ref=<target-sha>`, xác minh mọi `headSha` của workflow con khớp với SHA workflow cha đã ghim, rồi xóa nhánh tạm. Truyền `-f reuse_evidence=false` để buộc chạy mới, `-f release_profile=full` để thực hiện lượt quét tư vấn rộng hoặc `--workflow-sha <trusted-main-sha>` để ghim một commit cũ hơn vẫn có thể truy cập được từ `origin/main` hiện tại. Bản thân workflow không bao giờ ghi tham chiếu kho mã. Cách này duy trì khả năng sử dụng công cụ phát hành chỉ có trên nhánh chính mà không thêm commit công cụ vào ứng viên và tránh vô tình dùng một lần chạy con `main` mới hơn làm bằng chứng.

Sau khi Code SHA chuyển xanh, chỉ commit `CHANGELOG.md` và chạy cùng trình trợ giúp với Release SHA:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

Workflow cha thứ hai chỉ tái sử dụng bằng chứng sản phẩm khi GitHub chứng minh Release SHA là hậu duệ của Code SHA và tập hợp đường dẫn thay đổi đầy đủ chính xác là `CHANGELOG.md`. Workflow này ghi lại `changelog-only-release-v1` và không kích hoạt workflow con nào về sản phẩm. Bước kiểm tra sơ bộ npm và nghiệm thu gói/cài đặt vẫn chạy trên Release SHA vì các byte tarball của nó đã thay đổi.

Đối với một Code SHA mới, workflow phân giải mục tiêu, kích hoạt `CI` thủ công, rồi kích hoạt `OpenClaw Release Checks`. `OpenClaw Release Checks` phân tách kiểm tra nhanh cài đặt, kiểm tra phát hành trên nhiều hệ điều hành, phạm vi đường dẫn phát hành Docker trực tiếp/E2E khi bật chạy ngâm, Nghiệm thu Gói với E2E gói Telegram chuẩn, đối chiếu QA Lab, Matrix trực tiếp và Telegram trực tiếp. Một lần chạy đầy đủ/tất cả chỉ được chấp nhận khi phần tóm tắt `Full Release Validation` cho thấy `normal_ci`, `plugin_prerelease` và `release_checks` đều thành công, trừ khi một lần chạy lại có trọng tâm cố ý bỏ qua workflow con `Plugin Prerelease` riêng biệt. Chỉ sử dụng workflow con `npm-telegram` độc lập cho một lần chạy lại có trọng tâm đối với gói đã phát hành với `release_package_spec` hoặc `npm_telegram_package_spec`. Phần tóm tắt của trình xác minh cuối cùng bao gồm các bảng tác vụ chậm nhất cho từng lần chạy con, để người quản lý phát hành có thể xem đường dẫn tới hạn hiện tại mà không cần tải xuống nhật ký.

Workflow con về hiệu năng sản phẩm chỉ tạo artifact trong đường dẫn phát hành này. Workflow
bao quát kích hoạt nó với `publish_reports=false`, và quá trình xác thực bị từ chối
trừ khi rào chắn chỉ tạo artifact chứng minh rằng trình phát hành báo cáo Clawgrit vẫn
bị bỏ qua.

Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết ma trận giai đoạn hoàn chỉnh, tên chính xác của các tác vụ workflow, khác biệt giữa hồ sơ ổn định và đầy đủ, artifact và các cách chạy lại có trọng tâm.

Các workflow con được kích hoạt từ tham chiếu đáng tin cậy được ghim SHA chạy `Full Release Validation`. Mọi lần chạy con phải sử dụng chính xác SHA workflow cha. Không sử dụng các lần kích hoạt `--ref main -f ref=<sha>` thô làm bằng chứng phát hành; hãy sử dụng `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Sử dụng `release_profile` để chọn phạm vi trực tiếp/nhà cung cấp:

- `beta`: đường dẫn Docker và trực tiếp OpenAI/lõi quan trọng cho phát hành nhanh nhất
- `stable`: phạm vi nhà cung cấp/phần phụ trợ beta cộng ổn định để phê duyệt phát hành
- `full`: ổn định cộng phạm vi tư vấn rộng về nhà cung cấp/phương tiện

Xác thực ổn định và đầy đủ luôn chạy lượt quét toàn diện về trực tiếp/E2E, đường dẫn phát hành Docker và khả năng sống sót qua nâng cấp đã phát hành có giới hạn trước khi thăng cấp. Sử dụng `run_release_soak=true` để yêu cầu cùng lượt quét đó cho bản beta. Lượt quét này bao phủ bốn gói ổn định mới nhất cùng với các đường cơ sở `2026.4.23` và `2026.5.2` được ghim, cộng thêm phạm vi `2026.4.15` cũ hơn, trong đó loại bỏ các đường cơ sở trùng lặp và phân tách mỗi đường cơ sở thành tác vụ runner Docker riêng.

`OpenClaw Release Checks` sử dụng tham chiếu workflow đáng tin cậy để phân giải tham chiếu đích một lần thành `release-package-under-test` và tái sử dụng artifact đó trong các bước kiểm tra trên nhiều hệ điều hành, Nghiệm thu Gói và Docker theo đường dẫn phát hành khi chạy ngâm. Cách này giữ tất cả hộp liên quan đến gói trên cùng một tập byte và tránh dựng gói lặp lại. Sau khi bản beta đã có trên npm, hãy đặt `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` để các bước kiểm tra phát hành tải xuống gói đã phát hành một lần, trích xuất SHA nguồn bản dựng từ `dist/build-info.json` và tái sử dụng artifact đó cho các lane trên nhiều hệ điều hành, Nghiệm thu Gói, Docker theo đường dẫn phát hành và Telegram cho gói.

Kiểm tra nhanh cài đặt OpenAI trên nhiều hệ điều hành sử dụng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi biến kho mã/tổ chức được đặt, nếu không sẽ dùng `openai/gpt-5.6-luna`, vì lane này chứng minh việc cài đặt gói, quy trình làm quen, khởi động Gateway và một lượt chạy tác nhân trực tiếp thay vì đo chuẩn mô hình mạnh nhất. Ma trận nhà cung cấp trực tiếp rộng hơn vẫn là nơi dành cho phạm vi kiểm thử theo từng mô hình.

Sử dụng các biến thể này tùy theo giai đoạn phát hành:

```bash
# Xác thực Code SHA hoàn chỉnh về mặt sản phẩm.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Xác thực Release SHA chỉ thay đổi changelog bằng cách tái sử dụng bằng chứng sản phẩm của Code SHA.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Sau khi phát hành bản beta, thêm E2E Telegram cho gói đã phát hành.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Không sử dụng quy trình tổng hợp đầy đủ làm lần chạy lại đầu tiên sau một bản sửa tập trung. Nếu một hộp thất bại, hãy sử dụng workflow con, job, làn Docker, hồ sơ gói, nhà cung cấp mô hình hoặc làn QA đã thất bại cho lần kiểm chứng tiếp theo. Chỉ chạy lại quy trình tổng hợp đầy đủ khi bản sửa thay đổi điều phối phát hành dùng chung hoặc khiến bằng chứng trước đó từ tất cả các hộp trở nên lỗi thời. Trình xác minh cuối cùng của quy trình tổng hợp sẽ kiểm tra lại các mã định danh lần chạy workflow con đã ghi nhận, vì vậy sau khi một workflow con được chạy lại thành công, chỉ chạy lại job cha `Verify full validation` đã thất bại.

`rerun_group=all` có thể tái sử dụng một lần chạy quy trình tổng hợp đã thành công trước đó khi hồ sơ phát hành,
thiết lập soak có hiệu lực và các đầu vào xác thực khớp nhau, đồng thời SHA đích
giống hệt hoặc đích mới là hậu duệ có toàn bộ tập hợp đường dẫn đã thay đổi
chính xác là `CHANGELOG.md`. Việc tái sử dụng chính xác đích ghi lại
`exact-target-full-validation-v1`; Release SHA sau xác thực ghi lại
`changelog-only-release-v1`. Trường hợp sau chỉ tái sử dụng xác thực sản phẩm. Bước kiểm tra trước
npm, byte của gói, nguồn gốc ghi chú phát hành và kiểm tra chấp nhận cài đặt/cập nhật
vẫn phải chạy với Release SHA. Mọi thay đổi về phiên bản, nguồn, nội dung được tạo,
phần phụ thuộc, gói hoặc đích do workflow sở hữu đều yêu cầu Code SHA mới
và quy trình xác thực đầy đủ mới. Các lần chạy quy trình tổng hợp mới hơn cho cùng ref `release/*` và
nhóm chạy lại sẽ tự động thay thế các lần đang chạy. Truyền
`reuse_evidence=false` để buộc chạy đầy đủ từ đầu.

Để phục hồi có giới hạn, truyền `rerun_group` cho quy trình tổng hợp. `all` là lần chạy ứng viên phát hành thực tế, `ci` chỉ chạy workflow con CI thông thường, `plugin-prerelease` chỉ chạy workflow con Plugin dành riêng cho phát hành, `release-checks` chạy mọi hộp phát hành, còn các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` và `npm-telegram`. Các lần chạy lại tập trung `npm-telegram` yêu cầu `release_package_spec` hoặc `npm_telegram_package_spec`; các lần chạy đầy đủ/tất cả sử dụng E2E Telegram gói chuẩn trong Package Acceptance. Các lần chạy lại đa hệ điều hành tập trung có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc bộ lọc hệ điều hành/bộ kiểm thử khác. Lỗi kiểm tra phát hành QA sẽ chặn quy trình xác thực phát hành thông thường, bao gồm độ lệch công cụ động bắt buộc của OpenClaw trong cấp tiêu chuẩn. Các lần chạy alpha Tideclaw vẫn có thể coi những làn kiểm tra phát hành không liên quan đến an toàn gói là mang tính khuyến nghị. Với `release_profile=beta`, các bộ kiểm thử nhà cung cấp trực tiếp `Run repo/live E2E validation` mang tính khuyến nghị (cảnh báo, không chặn); hồ sơ ổn định và đầy đủ vẫn coi chúng là điều kiện chặn. Khi `live_suite_filter` yêu cầu rõ ràng một làn QA trực tiếp có cổng kiểm soát như Discord, WhatsApp hoặc Slack, biến kho lưu trữ `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` tương ứng phải được bật; nếu không, quá trình thu thập đầu vào sẽ thất bại thay vì âm thầm bỏ qua làn đó.

### Vitest

Hộp Vitest là workflow con thủ công `CI`. CI thủ công chủ ý bỏ qua phạm vi theo thay đổi và bắt buộc chạy đồ thị kiểm thử thông thường cho ứng viên phát hành: các shard Linux Node, shard Plugin đi kèm, shard hợp đồng Plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra smoke tạo phẩm đã build, kiểm tra tài liệu, Skills Python, Windows, macOS và i18n của Control UI. Android được bao gồm khi `Full Release Validation` chạy hộp này vì quy trình tổng hợp truyền `include_android=true`; CI thủ công độc lập yêu cầu `include_android=true` để bao phủ Android.

Sử dụng hộp này để trả lời “cây mã nguồn có vượt qua toàn bộ bộ kiểm thử thông thường không?”. Điều này không giống với xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần giữ lại:

- phần tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã được kích hoạt
- lần chạy `CI` thành công trên SHA đích chính xác
- tên các shard thất bại hoặc chậm từ các job CI khi điều tra hồi quy
- tạo phẩm thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi một lần chạy cần phân tích hiệu năng

Chỉ chạy trực tiếp CI thủ công khi bản phát hành cần CI thông thường có tính xác định nhưng không cần các hộp Docker, QA Lab, trực tiếp, đa hệ điều hành hoặc gói. Sử dụng lệnh đầu tiên cho CI trực tiếp không bao gồm Android. Thêm `include_android=true` khi CI trực tiếp cho ứng viên phát hành phải bao phủ Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Hộp Docker nằm trong `OpenClaw Release Checks` đến `openclaw-live-and-e2e-checks-reusable.yml`, cùng với workflow chế độ phát hành `install-smoke`. Hộp này xác thực ứng viên phát hành thông qua các môi trường Docker đã đóng gói thay vì chỉ dùng kiểm thử ở cấp mã nguồn.

Phạm vi Docker cho bản phát hành bao gồm:

- kiểm tra smoke cài đặt đầy đủ với kiểm tra smoke cài đặt Bun toàn cục chậm được bật
- chuẩn bị/tái sử dụng ảnh kiểm tra smoke của Dockerfile gốc theo SHA đích, với các job kiểm tra smoke QR, root/gateway và trình cài đặt/Bun chạy dưới dạng các shard kiểm tra smoke cài đặt riêng biệt
- các làn E2E của kho lưu trữ
- các phân đoạn Docker theo đường dẫn phát hành: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, từ `plugins-runtime-install-a` đến `plugins-runtime-install-h` và `openwebui`
- phạm vi OpenWebUI trên runner đĩa lớn chuyên dụng khi được yêu cầu
- các làn cài đặt/gỡ cài đặt Plugin đi kèm được tách riêng từ `bundled-plugin-install-uninstall-0` đến `bundled-plugin-install-uninstall-23`
- các bộ kiểm thử nhà cung cấp trực tiếp/E2E và phạm vi mô hình trực tiếp Docker khi kiểm tra phát hành bao gồm các bộ kiểm thử trực tiếp

Sử dụng các tạo phẩm Docker trước khi chạy lại. Bộ lập lịch theo đường dẫn phát hành tải lên `.artifacts/docker-tests/` cùng nhật ký làn, `summary.json`, `failures.json`, thời gian từng giai đoạn, JSON kế hoạch của bộ lập lịch và các lệnh chạy lại. Để phục hồi tập trung, sử dụng `docker_lanes=<lane[,lane]>` trên workflow trực tiếp/E2E có thể tái sử dụng thay vì chạy lại tất cả các phân đoạn phát hành. Các lệnh chạy lại được tạo bao gồm `package_artifact_run_id` trước đó và đầu vào ảnh Docker đã chuẩn bị khi có, nhờ đó một làn thất bại có thể tái sử dụng cùng tarball và các ảnh GHCR.

### QA Lab

Hộp QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành về hành vi tác tử và cấp kênh, tách biệt với cơ chế gói của Vitest và Docker.

Phạm vi QA Lab cho bản phát hành bao gồm:

- làn tương đương mô phỏng so sánh làn ứng viên OpenAI với đường cơ sở `anthropic/claude-opus-4-8` bằng gói tương đương tác tử
- hồ sơ phát hành bộ điều hợp trực tiếp Matrix sử dụng môi trường `qa-live-shared`
- làn QA Telegram trực tiếp sử dụng các lượt thuê thông tin xác thực Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` hoặc `pnpm qa:observability:smoke` khi dữ liệu đo từ xa của bản phát hành cần bằng chứng cục bộ rõ ràng

Sử dụng hộp này để trả lời “bản phát hành có hoạt động chính xác trong các kịch bản QA và luồng kênh trực tiếp không?”. Giữ lại URL tạo phẩm cho các làn tương đương, Matrix và Telegram khi phê duyệt bản phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng một lần chạy QA-Lab phân shard thủ công thay vì làn quan trọng đối với bản phát hành theo mặc định.

### Gói

Hộp Gói là cổng dành cho sản phẩm có thể cài đặt. Hộp này được hỗ trợ bởi `Package Acceptance` và bộ phân giải `scripts/resolve-openclaw-package-candidate.mjs`. Bộ phân giải chuẩn hóa một ứng viên thành tarball `package-under-test` được Docker E2E sử dụng, xác thực danh mục gói, ghi lại phiên bản gói và SHA-256, đồng thời giữ ref của bộ khung workflow tách biệt với ref nguồn gói.

Các nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành OpenClaw chính xác
- `source=ref`: đóng gói một nhánh, thẻ hoặc SHA commit đầy đủ `package_ref` đáng tin cậy bằng bộ khung `workflow_ref` đã chọn
- `source=url`: tải xuống `.tgz` HTTPS công khai với `package_sha256` bắt buộc; thông tin xác thực trong URL, cổng HTTPS không mặc định, tên máy chủ hoặc địa chỉ được phân giải thuộc loại riêng tư/nội bộ/dành cho mục đích đặc biệt và chuyển hướng không an toàn đều bị từ chối
- `source=trusted-url`: tải xuống `.tgz` HTTPS với `package_sha256` và `trusted_source_id` bắt buộc từ một chính sách được đặt tên trong `.github/package-trusted-sources.json`; sử dụng nguồn này cho máy chủ phản chiếu doanh nghiệp do người bảo trì sở hữu hoặc kho lưu trữ gói riêng tư thay vì thêm cơ chế bỏ qua mạng riêng ở cấp đầu vào vào `source=url`
- `source=artifact`: tái sử dụng `.tgz` do một lần chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, tạo phẩm gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance duy trì kiểm tra di chuyển, cập nhật, nâng cấp VPS do root quản lý, khởi động lại sau cập nhật với xác thực đã cấu hình, cài đặt Skill ClawHub trực tiếp, dọn dẹp phần phụ thuộc Plugin cũ, fixture Plugin ngoại tuyến, cập nhật Plugin, gia cố chống thoát khỏi liên kết lệnh Plugin và QA gói Telegram trên cùng tarball đã phân giải. Các kiểm tra phát hành có tính chặn sử dụng đường cơ sở gói được phát hành mới nhất theo mặc định; hồ sơ beta với `run_release_soak=true`, `release_profile=stable` hoặc `release_profile=full` mở rộng lượt quét khả năng tồn tại sau nâng cấp từ bản phát hành lên `last-stable-4` cùng các đường cơ sở `2026.4.23`, `2026.5.2` và `2026.4.15` đã ghim với các kịch bản `reported-issues`. Sử dụng Package Acceptance với `source=npm` cho một ứng viên đã được phát hành, `source=ref` cho tarball npm cục bộ dựa trên SHA trước khi phát hành, `source=trusted-url` cho máy chủ phản chiếu doanh nghiệp/riêng tư do người bảo trì sở hữu hoặc `source=artifact` cho tarball đã chuẩn bị do một lần chạy GitHub Actions khác tải lên.

Đây là giải pháp thay thế gốc GitHub cho phần lớn phạm vi kiểm tra gói/cập nhật trước đây cần Parallels. Các kiểm tra phát hành đa hệ điều hành vẫn quan trọng đối với quá trình thiết lập ban đầu, trình cài đặt và hành vi dành riêng cho hệ điều hành, nhưng xác thực sản phẩm gói/cập nhật nên ưu tiên Package Acceptance.

Danh sách kiểm tra chuẩn cho xác thực cập nhật và Plugin là [Kiểm thử bản cập nhật và Plugin](/vi/help/testing-updates-plugins). Sử dụng danh sách này khi quyết định làn cục bộ, Docker, Package Acceptance hoặc kiểm tra phát hành nào chứng minh một thay đổi về cài đặt/cập nhật Plugin, dọn dẹp bằng doctor hoặc di chuyển gói đã phát hành. Quá trình di chuyển cập nhật đã phát hành toàn diện từ mọi gói ổn định `2026.4.23+` là một workflow thủ công `Update Migration` riêng biệt, không thuộc Full Release CI.

Sự khoan dung của quy trình chấp nhận gói cũ được giới hạn thời gian có chủ đích. Các gói đến hết `2026.4.25` có thể sử dụng đường dẫn tương thích cho các thiếu sót siêu dữ liệu đã được phát hành lên npm: các mục danh mục QA riêng tư bị thiếu trong tarball, thiếu `gateway install --wrapper`, thiếu tệp bản vá trong fixture git bắt nguồn từ tarball, thiếu `update.channel` được lưu bền vững, vị trí bản ghi cài đặt Plugin cũ, thiếu khả năng lưu bền vững bản ghi cài đặt marketplace và di chuyển siêu dữ liệu cấu hình trong `plugins update`. Gói `2026.4.26` đã phát hành có thể cảnh báo về các tệp dấu siêu dữ liệu build cục bộ đã được phát hành. Các gói về sau phải đáp ứng hợp đồng gói hiện đại; chính những thiếu sót đó sẽ khiến xác thực phát hành thất bại.

Sử dụng các hồ sơ Package Acceptance rộng hơn khi câu hỏi về bản phát hành liên quan đến một gói thực sự có thể cài đặt:

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

- `smoke`: các luồng cài đặt gói/kênh/tác tử nhanh, mạng Gateway và tải lại cấu hình
- `package`: các hợp đồng cài đặt/cập nhật/khởi động lại/gói plugin cùng bằng chứng cài đặt trực tiếp skill ClawHub; đây là mặc định kiểm tra bản phát hành
- `product`: `package` cùng các kênh MCP, dọn dẹp cron/tác tử con, tìm kiếm web OpenAI và OpenWebUI
- `full`: các phần của đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác để chạy lại có trọng tâm

Để xác minh Telegram cho ứng viên gói, hãy bật `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier` trong Package Acceptance. Quy trình truyền tarball `package-under-test` đã phân giải vào luồng Telegram; quy trình Telegram độc lập vẫn chấp nhận một đặc tả npm đã phát hành cho các kiểm tra sau phát hành.

## Tự động hóa phát hành bản phát hành thông thường

Đối với việc phát hành beta, `latest`, plugin, GitHub Release và nền tảng,
`OpenClaw Release Publish` là điểm vào có thay đổi trạng thái thông thường. Đường dẫn
extended-stable hằng tháng chỉ dành cho npm `.33+` không sử dụng trình điều phối này. Quy trình
thông thường điều phối các quy trình nhà phát hành đáng tin cậy theo thứ tự mà
bản phát hành yêu cầu:

1. Checkout thẻ phát hành và phân giải SHA commit của thẻ.
2. Xác minh thẻ có thể truy cập được từ `main` hoặc `release/*` (hoặc một nhánh alpha Tideclaw đối với các bản phát hành trước alpha).
3. Chạy `pnpm plugins:sync:check`.
4. Kích hoạt `Plugin NPM Release` với `publish_scope=all-publishable` và `ref=<release-sha>`.
5. Kích hoạt `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Kích hoạt `OpenClaw NPM Release` với thẻ phát hành, dist-tag npm và `preflight_run_id` đã lưu sau khi xác minh `full_release_validation_run_id` đã lưu và lần chạy chính xác.
7. Đối với các bản phát hành ổn định, tạo hoặc cập nhật bản phát hành GitHub dưới dạng bản nháp, kích hoạt `Windows Node Release` với `windows_node_tag` tường minh và `windows_node_installer_digests` đã được ứng viên phê duyệt, đồng thời xác minh các tài sản trình cài đặt/tổng kiểm Windows chuẩn. Đồng thời kích hoạt `Android Release` để xây dựng APK đã ký theo đúng thẻ cùng tổng kiểm và thông tin nguồn gốc. Xác minh cả hai hợp đồng tài sản gốc trước khi phát hành bản nháp.

Ví dụ phát hành beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Phát hành ổn định lên dist-tag beta mặc định:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Việc thăng hạng bản ổn định trực tiếp lên `latest` phải được chỉ định tường minh:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

Chỉ sử dụng các quy trình cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release` cho công việc sửa chữa hoặc phát hành lại có trọng tâm. `OpenClaw Release Publish` từ chối `plugin_publish_scope=selected` khi `publish_openclaw_npm=true` để gói lõi không thể được phát hành nếu thiếu bất kỳ plugin chính thức có thể phát hành nào, bao gồm `@openclaw/diffs-language-pack`. Đối với việc sửa chữa một plugin được chọn, đặt `publish_openclaw_npm=false` cùng `plugin_publish_scope=selected` và `plugins=@openclaw/name`, hoặc kích hoạt trực tiếp quy trình con.

Khởi tạo ClawHub cho lần phát hành đầu tiên là ngoại lệ: kích hoạt `Plugin ClawHub New`
từ `main` đáng tin cậy và truyền toàn bộ SHA bản phát hành đích qua `ref`.
Không bao giờ chạy chính quy trình khởi tạo từ thẻ hoặc nhánh phát hành:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Việc xác thực trước khi gắn thẻ yêu cầu `dry_run=true`, từ chối đầu vào
thẻ phát hành và lần chạy cha, đồng thời chỉ chấp nhận một đích chính xác có thể truy cập từ `main` hoặc `release/*`.
Quy trình này không tải thông tin xác thực ClawHub, phát hành byte gói hay thay đổi cấu hình
nhà phát hành đáng tin cậy. Quy trình vẫn phân giải kế hoạch registry trực tiếp,
chỉ checkout và đóng gói đích trong một công việc không có bí mật, hiện thực hóa
chuỗi công cụ ClawHub đã khóa, đồng thời xác thực artifact bất biến và
slug/danh tính gói trước khi thẻ phát hành tồn tại. Chỉ phê duyệt môi trường
`clawhub-plugin-bootstrap` sau khi các công việc đóng gói không có bí mật
hoàn tất; công việc xác thực được bảo vệ này không có thông tin xác thực hoặc lệnh thay đổi trạng thái.

Một lần chạy thử đã được phê duyệt hoặc một lần khởi tạo thực sau khi gắn thẻ phải bao gồm chính xác
thẻ phát hành cùng id, lần chạy và
nhánh của lần chạy `OpenClaw Release Publish` cha. Tiến trình cha chứng thực SHA quy trình của chính nó và một SHA `main` đáng tin cậy, chính xác và riêng biệt cho `Plugin ClawHub New`; lần chạy con và mọi phê duyệt
môi trường được bảo vệ phải khớp với SHA con đã được phê duyệt đó. Thẻ phát hành được
kiểm tra lại trước mọi lần thử phát hành và thay đổi nhà phát hành đáng tin cậy.

Công việc đóng gói
tải lên một artifact bất biến; tên, ID/digest artifact Actions,
lần chạy/lần thử của trình tạo, SHA đích và SHA-256/kích thước tarball của từng gói
được chuyển sang các công việc xác thực và được bảo vệ. Công việc được bảo vệ chỉ checkout công cụ
`main` đáng tin cậy, xác thực bộ thông tin artifact thông qua GitHub API, tải xuống
theo ID artifact chính xác, băm lại mọi tarball và xác thực các đường dẫn TAR cục bộ cùng
danh tính gói theo quy tắc chuẩn hóa USTAR của CLI được ghim. Sau đó, mọi
ứng viên đều vượt qua lần chạy thử phát hành bằng CLI được ghim, vốn trả về trước khi
tra cứu registry hoặc xác thực. Bộ lọc trước của công việc thông tin xác thực giới hạn ClawPack đã nén
ở mức 120 MiB, tổng tải trọng tệp ở mức 50 MiB, dữ liệu TAR đã bung ở mức 64 MiB và
số mục TAR ở mức 10,000. Việc sửa chữa nhà phát hành đáng tin cậy cho gói hiện có vẫn
chỉ cấu hình, nhưng vẫn đóng gói đích và yêu cầu thẻ được yêu cầu
cùng byte registry chính xác và siêu dữ liệu hoàn toàn trùng khớp trước khi thay đổi cấu hình nhà phát hành đáng tin cậy.
Việc xác minh sau phát hành tải xuống artifact ClawHub và
yêu cầu cùng SHA-256 và kích thước. Quá trình khôi phục bằng cách chạy lại phần thất bại chỉ có thể tái sử dụng
artifact gói của một lần thử trước khi công việc tạo chính xác đã hoàn tất
thành công. Bằng chứng cuối cùng cũng ràng buộc phiên bản ClawHub đã khóa, SHA-256
của khóa và tính toàn vẹn npm. Trường hợp không khớp yêu cầu một phiên bản gói mới.

## Đầu vào quy trình NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc như `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` hoặc `v2026.4.2-alpha.1`; khi `preflight_only=true`, giá trị này cũng có thể là SHA commit đầy đủ 40 ký tự hiện tại của nhánh quy trình để chỉ xác thực preflight
- `preflight_only`: `true` chỉ để xác thực/xây dựng/đóng gói, `false` cho đường dẫn phát hành thực
- `preflight_run_id`: id lần chạy preflight thành công hiện có, bắt buộc trên đường dẫn phát hành thực để quy trình tái sử dụng tarball đã chuẩn bị thay vì xây dựng lại
- `full_release_validation_run_id`: id lần chạy `Full Release Validation` thành công cho thẻ/SHA này, bắt buộc để phát hành thực. Các bản phát hành beta có thể tiếp tục chỉ với preflight kèm cảnh báo, nhưng việc thăng hạng stable/`latest` vẫn yêu cầu giá trị này.
- `full_release_validation_run_attempt`: lần chạy dương chính xác được ghép với `full_release_validation_run_id`; bắt buộc mỗi khi cung cấp id lần chạy để các lần chạy lại không thể thay đổi bằng chứng ủy quyền trong quá trình phát hành.
- `release_publish_run_id`: id lần chạy `OpenClaw Release Publish` đã được phê duyệt; bắt buộc khi quy trình này được tiến trình cha đó kích hoạt (các lệnh gọi phát hành thực của tác nhân bot)
- `plugin_npm_run_id`: id lần chạy `Plugin NPM Release` thành công với head chính xác; bắt buộc cho một lần phát hành lõi `extended-stable` thực
- `npm_dist_tag`: thẻ npm đích cho đường dẫn phát hành; chấp nhận `alpha`, `beta`, `latest` hoặc `extended-stable` và mặc định là `beta`. Bản vá cuối cùng `33` trở lên phải sử dụng `extended-stable`; theo mặc định, `extended-stable` từ chối các bản vá trước đó và luôn từ chối các thẻ không phải cuối cùng.
- `bypass_extended_stable_guard`: giá trị boolean chỉ dành cho kiểm thử, mặc định `false`; với `npm_dist_tag=extended-stable`, bỏ qua điều kiện đủ cho extended-stable hằng tháng nhưng vẫn giữ nguyên các kiểm tra danh tính bản phát hành, artifact, phê duyệt và đọc lại.

`Plugin NPM Release` chấp nhận `npm_dist_tag=default` cho hành vi bản phát hành
hiện có hoặc `npm_dist_tag=extended-stable` cho đường dẫn hằng tháng được bảo vệ. Tùy chọn
extended-stable yêu cầu `publish_scope=all-publishable`, đầu vào
`plugins` trống, một bản vá cuối cùng bằng hoặc cao hơn `33`, và nhánh
`extended-stable/YYYY.M.33` chuẩn tại đúng đầu nhánh. Tùy chọn này không bao giờ di chuyển
`latest` hoặc `beta` của plugin. Các phiên bản gói mới nhận `extended-stable` theo cách nguyên tử
thông qua việc phát hành đáng tin cậy bằng OIDC (`npm publish --tag extended-stable`); quy trình
nguồn này không sử dụng `npm dist-tag add` được xác thực bằng token. Các lần thử lại
bỏ qua những phiên bản chính xác đã có trong npm, sau đó dừng an toàn trừ khi việc
đọc lại đầy đủ xác nhận rằng mọi gói chính xác và thẻ `extended-stable` đã hội tụ.

`OpenClaw Release Publish` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc; phải tồn tại sẵn
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công; bắt buộc khi `publish_openclaw_npm=true` hoặc `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: id lần chạy `Full Release Validation` thành công; bắt buộc khi `publish_openclaw_npm=true` hoặc `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: lần thử dương chính xác được ghép với `full_release_validation_run_id`; bắt buộc mỗi khi cung cấp id lần chạy
- `windows_node_tag`: thẻ phát hành `openclaw/openclaw-windows-node` chính xác, không phải bản phát hành trước; bắt buộc cho việc phát hành OpenClaw ổn định
- `windows_node_installer_digests`: ánh xạ JSON thu gọn đã được ứng viên phê duyệt từ tên trình cài đặt Windows hiện tại đến digest `sha256:` được ghim tương ứng; bắt buộc cho việc phát hành OpenClaw ổn định
- `npm_telegram_run_id`: id lần chạy `NPM Telegram Beta E2E` thành công tùy chọn để đưa vào bằng chứng bản phát hành cuối cùng
- `npm_dist_tag`: thẻ npm đích cho gói OpenClaw, một trong `alpha`, `beta` hoặc `latest`
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ sử dụng `selected` cho công việc sửa chữa chỉ dành cho plugin có trọng tâm với `publish_openclaw_npm=false`
- `plugins`: tên gói `@openclaw/*` phân tách bằng dấu phẩy khi `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi sử dụng quy trình làm trình điều phối sửa chữa chỉ dành cho plugin
- `release_profile`: hồ sơ phạm vi bao phủ bản phát hành dùng cho các bản tóm tắt bằng chứng bản phát hành; mặc định là `from-validation`, đọc giá trị này từ manifest xác thực, hoặc ghi đè bằng `beta`, `stable` hoặc `full`
- `wait_for_clawhub`: mặc định là `false` để tính khả dụng của npm không bị sidecar ClawHub chặn; chỉ đặt `true` khi việc hoàn tất quy trình phải bao gồm cả việc hoàn tất ClawHub

`OpenClaw Release Checks` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `ref`: nhánh, thẻ hoặc SHA commit đầy đủ cần xác thực. Các bước kiểm tra có sử dụng bí mật yêu cầu commit đã phân giải phải có thể truy cập được từ một nhánh hoặc thẻ phát hành của OpenClaw.
- `run_release_soak`: chọn tham gia các bước kiểm tra live/E2E toàn diện, đường dẫn phát hành Docker và kiểm thử ngâm khả năng tồn tại sau nâng cấp cho tất cả phiên bản kể từ trước đó đối với các bước kiểm tra bản phát hành beta. Tùy chọn này được bắt buộc bật bởi `release_profile=stable` và `release_profile=full`.

Quy tắc:

- Các phiên bản chính thức và phiên bản hiệu chỉnh thông thường thấp hơn bản vá `33` có thể phát hành lên `beta` hoặc `latest`. Các phiên bản chính thức ở bản vá `33` trở lên phải phát hành lên `extended-stable`, còn các phiên bản có hậu tố hiệu chỉnh tại ranh giới đó sẽ bị từ chối.
- Thẻ tiền phát hành beta chỉ có thể phát hành lên `beta`; thẻ tiền phát hành alpha chỉ có thể phát hành lên `alpha`
- Đối với `OpenClaw NPM Release`, chỉ cho phép đầu vào là SHA commit đầy đủ khi `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ dùng để xác thực
- Đường dẫn phát hành thực tế phải sử dụng cùng `npm_dist_tag` đã dùng trong bước kiểm tra trước; quy trình làm việc xác minh siêu dữ liệu đó trước khi tiếp tục phát hành

## Trình tự phát hành beta thông thường/bản ổn định mới nhất

Trình tự cũ này dành cho quy trình phát hành điều phối thông thường, cũng phụ trách các plugin, GitHub Release, Windows và công việc trên các nền tảng khác. Đây không phải đường dẫn ổn định mở rộng hằng tháng chỉ dành cho npm `.33+` được ghi ở đầu trang này.

Khi tạo một bản phát hành ổn định được điều phối thông thường:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ, có thể sử dụng SHA commit hiện tại và đầy đủ của nhánh quy trình làm việc để chạy thử quy trình kiểm tra trước chỉ nhằm mục đích xác thực.
2. Chọn `npm_dist_tag=beta` cho luồng thông thường ưu tiên beta trước, hoặc chỉ chọn `latest` khi chủ ý muốn phát hành trực tiếp bản ổn định.
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành hoặc SHA commit đầy đủ khi muốn có CI thông thường cùng phạm vi kiểm tra bộ nhớ đệm prompt live, Docker, QA Lab, Matrix và Telegram từ một quy trình làm việc thủ công duy nhất. Nếu chủ ý chỉ cần biểu đồ kiểm thử thông thường có tính xác định, hãy chạy thủ công quy trình làm việc `CI` trên tham chiếu phát hành.
4. Chọn chính xác thẻ phát hành `openclaw/openclaw-windows-node` không phải tiền phát hành có các trình cài đặt x64 và ARM64 đã ký cần được phân phối. Lưu thẻ đó dưới dạng `windows_node_tag` và lưu ánh xạ mã băm đã xác thực của các trình cài đặt dưới dạng `windows_node_installer_digests`. Trình trợ giúp ứng viên phát hành ghi lại cả hai và đưa chúng vào lệnh phát hành được tạo.
5. Lưu `preflight_run_id`, `full_release_validation_run_id` thành công và `full_release_validation_run_attempt` chính xác.
6. Chạy `OpenClaw Release Publish` từ `main` đáng tin cậy với cùng `tag`, cùng `npm_dist_tag`, `windows_node_tag` đã chọn, `windows_node_installer_digests` đã lưu của nó, `preflight_run_id` đã lưu, `full_release_validation_run_id` và `full_release_validation_run_attempt`. Quy trình này phát hành các plugin đã được tách ra bên ngoài lên npm và ClawHub trước khi quảng bá gói npm OpenClaw.
7. Nếu bản phát hành được đưa lên `beta`, hãy sử dụng quy trình làm việc `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` để quảng bá phiên bản ổn định đó từ `beta` sang `latest`.
8. Nếu bản phát hành được chủ ý phát hành trực tiếp lên `latest` và `beta` cần chuyển ngay sang cùng bản dựng ổn định, hãy sử dụng chính quy trình phát hành đó để trỏ cả hai dist-tag đến phiên bản ổn định, hoặc để quá trình đồng bộ tự khắc phục theo lịch chuyển `beta` sau.

Thao tác thay đổi dist-tag nằm trong kho sổ cái phát hành vì vẫn yêu cầu `NPM_TOKEN`, trong khi kho mã nguồn chỉ duy trì phát hành bằng OIDC. Điều này giúp cả đường dẫn phát hành trực tiếp và đường dẫn quảng bá ưu tiên beta trước đều được ghi lại trong tài liệu và hiển thị cho người vận hành.

Nếu người bảo trì buộc phải quay lại sử dụng xác thực npm cục bộ, chỉ chạy mọi lệnh CLI 1Password (`op`) bên trong một phiên tmux chuyên dụng. Không gọi trực tiếp `op` từ shell chính của tác nhân; giữ lệnh trong tmux giúp quan sát được lời nhắc, cảnh báo và quá trình xử lý OTP, đồng thời ngăn cảnh báo lặp lại trên máy chủ.

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

Người bảo trì sử dụng tài liệu phát hành riêng tư trong [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) làm tài liệu vận hành thực tế.

## Liên quan

- [Kênh phát hành](/vi/install/development-channels)
