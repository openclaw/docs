---
read_when:
    - Đang tìm định nghĩa kênh phát hành công khai
    - Chạy quy trình xác thực bản phát hành hoặc nghiệm thu gói phần mềm
    - Tìm hiểu cách đặt tên phiên bản và nhịp phát hành
summary: Các luồng phát hành, danh sách kiểm tra dành cho người vận hành, các hộp xác thực, cách đặt tên phiên bản và nhịp độ phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-07-19T05:57:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db7e2337495368b5d849e44ccbe60078fafa2dbb3d45d657b53e2104ad23a7f9
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hiện cung cấp ba kênh cập nhật dành cho người dùng:

- stable: kênh bản phát hành đã được quảng bá hiện có, vẫn được phân giải thông qua npm `latest` cho đến khi hoàn thành cột mốc CLI/kênh riêng
- beta: các thẻ bản phát hành sơ bộ được phát hành lên npm `beta`
- dev: đầu nhánh luôn thay đổi của `main`

Ngoài ra, người vận hành bản phát hành có thể phát hành gói lõi của tháng đã hoàn tất gần nhất lên npm `extended-stable`, bắt đầu từ bản vá `33`. Dòng bản cuối thông thường của tháng hiện tại tiếp tục trên npm `latest`; việc phân tách phát hành phía người vận hành này tự nó không thay đổi cách phân giải kênh cập nhật của CLI.

Các bản dựng alpha Tideclaw là một luồng bản phát hành sơ bộ nội bộ riêng biệt (dist-tag npm `alpha`), được đề cập trong [Đầu vào quy trình làm việc NPM](#npm-workflow-inputs) và [Các hộp kiểm thử bản phát hành](#release-test-boxes).

## Cách đặt tên phiên bản

- Phiên bản bản phát hành extended-stable hằng tháng trên npm: `YYYY.M.PATCH`, với `PATCH >= 33`, thẻ git `vYYYY.M.PATCH`
- Phiên bản bản phát hành cuối hằng ngày/thông thường: `YYYY.M.PATCH`, với `PATCH < 33`, thẻ git `vYYYY.M.PATCH`
- Phiên bản bản phát hành sửa lỗi dự phòng thông thường: `YYYY.M.PATCH-N`, thẻ git `vYYYY.M.PATCH-N`
- Phiên bản bản phát hành sơ bộ beta: `YYYY.M.PATCH-beta.N`, thẻ git `vYYYY.M.PATCH-beta.N`
- Phiên bản bản phát hành sơ bộ alpha: `YYYY.M.PATCH-alpha.N`, thẻ git `vYYYY.M.PATCH-alpha.N`
- Không bao giờ thêm số 0 ở đầu tháng hoặc bản vá
- `PATCH` là số thứ tự tuần tự của luồng phát hành hằng tháng, không phải ngày trong lịch. Các bản phát hành cuối thông thường và beta tăng số luồng hiện tại; các thẻ chỉ dành cho alpha không bao giờ sử dụng hoặc tăng số bản vá beta/thông thường, vì vậy hãy bỏ qua các thẻ cũ chỉ dành cho alpha có số bản vá cao hơn khi chọn luồng beta hoặc thông thường.
- Các bản dựng alpha/hằng đêm sử dụng luồng bản vá chưa phát hành tiếp theo và chỉ tăng `alpha.N` cho các bản dựng lặp lại. Sau khi bản vá đó có bản beta, các bản dựng alpha mới sẽ chuyển sang bản vá tiếp theo.
- Các phiên bản npm là bất biến: không bao giờ xóa, phát hành lại hoặc tái sử dụng một thẻ đã phát hành. Thay vào đó, hãy tạo số bản phát hành sơ bộ tiếp theo hoặc bản vá hằng tháng tiếp theo.
- `latest` tiếp tục đi theo dòng npm thông thường/hằng ngày hiện tại; `beta` là mục tiêu cài đặt beta hiện tại
- `extended-stable` chỉ gói npm được hỗ trợ của tháng gần nhất, bắt đầu từ bản vá `33`; bản vá `34` trở đi là các bản phát hành bảo trì trên dòng hằng tháng đó
- Các bản phát hành cuối thông thường và bản phát hành sửa lỗi thông thường mặc định được phát hành lên npm `beta`; người vận hành bản phát hành có thể nhắm rõ ràng đến `latest`, hoặc quảng bá một bản dựng beta đã được thẩm định sau đó
- Luồng extended-stable hằng tháng chuyên biệt phát hành gói npm lõi và mọi Plugin chính thức có thể phát hành lên npm với cùng một phiên bản chính xác. Luồng này không phát hành Plugin lên ClawHub, cũng không phát hành các tạo phẩm macOS hoặc Windows, GitHub Release, dist-tag của kho lưu trữ riêng tư, ảnh Docker, tạo phẩm di động hoặc nội dung tải xuống từ trang web.
- Mỗi bản phát hành cuối thông thường đều phát hành đồng thời gói npm, ứng dụng macOS, APK Android độc lập đã ký và các trình cài đặt Windows Hub đã ký. Các bản phát hành beta thường xác thực và phát hành luồng npm/gói trước, còn việc dựng/ký/công chứng/quảng bá ứng dụng gốc được dành cho bản phát hành cuối thông thường, trừ khi được yêu cầu rõ ràng.

## Nhịp phát hành

- Các bản phát hành tiến hành theo hướng beta trước; stable chỉ theo sau sau khi bản beta mới nhất được xác thực
- Người bảo trì thường tạo bản phát hành từ một nhánh `release/YYYY.M.PATCH` được tạo từ `main` hiện tại, để việc xác thực và sửa lỗi bản phát hành không chặn hoạt động phát triển mới trên `main`
- Nếu một thẻ beta đã được đẩy hoặc phát hành và cần sửa lỗi, người bảo trì sẽ tạo thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ cũ
- Quy trình phát hành chi tiết, các phê duyệt, thông tin xác thực và ghi chú khôi phục chỉ dành cho người bảo trì

## Phát hành extended-stable hằng tháng chỉ trên npm

Đây là một ngoại lệ chuyên biệt đối với quy trình phát hành thông thường bên dưới. Đối với tháng đã hoàn tất `YYYY.M`, hãy tạo `extended-stable/YYYY.M.33`; phát hành `vYYYY.M.33` và các bản vá bảo trì sau đó từ cùng nhánh đó. Thẻ phát hành, đầu nhánh, bản checkout, phiên bản gói, bước kiểm tra trước npm và lần chạy Full Release Validation đều phải xác định cùng một commit. `main` được bảo vệ phải chứa sẵn phiên bản cuối của một tháng dương lịch muộn hơn rõ ràng với bản vá thấp hơn `33`; các bản vá bảo trì vẫn đủ điều kiện sau khi `main` tăng thêm hơn một tháng.

Trên chính xác nhánh extended-stable, hãy tăng phiên bản gói gốc lên `YYYY.M.P`, chạy `pnpm release:prep` và xác minh rằng mọi gói tiện ích mở rộng có thể phát hành đều có cùng phiên bản. Commit và đẩy tất cả thay đổi đã tạo, tạo và đẩy thẻ `vYYYY.M.P` bất biến tại commit đó, rồi ghi lại SHA đầy đủ thu được. Các quy trình làm việc sử dụng cây đã chuẩn bị này; chúng không tăng hoặc đồng bộ hóa phiên bản thay bạn.

Chạy bước kiểm tra trước npm và Full Release Validation từ chính xác đầu nhánh đã chuẩn bị đó, sau đó lưu cả hai ID lần chạy và lần thử thành công của Full Release Validation:

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

`release_profile=stable` là cấu hình độ sâu xác thực hiện có; cấu hình này tách biệt với dist-tag npm `extended-stable` và được chủ ý giữ nguyên.

Sau khi cả hai lần chạy thành công, hãy phát hành mọi Plugin chính thức có thể phát hành lên npm từ cùng chính xác đầu nhánh đó. Bản vá `P` phải là `33` trở lên. Truyền SHA bản phát hành đầy đủ dưới dạng `ref`, chờ toàn bộ ma trận và quá trình đọc lại từ registry hoàn tất, sau đó lưu ID lần chạy Plugin NPM Release thành công:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Quy trình làm việc sử dụng danh mục gói `all-publishable` thông thường đã chuẩn bị, bao gồm cả các gói có mã nguồn không thay đổi. Quy trình xác minh từng gói chính xác và từng thẻ Plugin `extended-stable` trước khi thành công. Nếu một lần chạy một phần thất bại, hãy chạy lại cùng lệnh: các gói đã phát hành được tái sử dụng, các thẻ Plugin bị thiếu hoặc lỗi thời được đối soát trong môi trường phát hành npm và lần đọc lại cuối cùng vẫn bao phủ toàn bộ tập hợp gói.

Sau khi quy trình làm việc Plugin thành công và môi trường phát hành npm sẵn sàng, hãy phát hành tarball lõi chính xác từ bước kiểm tra trước. Việc phát hành lõi xác minh rằng lần chạy Plugin được tham chiếu là `completed/success` trên cùng nhánh chính tắc và cùng SHA nguồn chính xác:

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

Đối với một bản diễn tập trên fork hoặc ngoài môi trường sản xuất vốn chủ ý không thể đáp ứng chính sách tháng `.33` hoặc tháng `main` được bảo vệ, hãy thêm `-f bypass_extended_stable_guard=true` vào cả lệnh điều phối kiểm tra trước và phát hành npm. Giá trị mặc định là `false`. Việc bỏ qua chỉ được chấp nhận với `npm_dist_tag=extended-stable` và được ghi lại trong bản tóm tắt quy trình làm việc. Việc này không bỏ qua tham chiếu quy trình làm việc `extended-stable/YYYY.M.33` chính tắc, tính đồng nhất giữa đầu nhánh/thẻ/bản checkout, cú pháp thẻ cuối, tính đồng nhất giữa phiên bản gói/thẻ, danh tính lần chạy và manifest được tham chiếu, nguồn gốc tarball, phê duyệt môi trường, đọc lại từ registry hoặc bằng chứng sửa bộ chọn.

Quy trình làm việc phát hành xác minh danh tính của các lần chạy kiểm tra trước, xác thực và Plugin được tham chiếu, giá trị băm của tarball đã chuẩn bị và các bộ chọn registry lõi. Hãy xác nhận độc lập kết quả sau khi quy trình làm việc thành công:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Cả hai lệnh phải trả về `YYYY.M.P`. Nếu phát hành thành công nhưng việc đọc lại bộ chọn thất bại, không được phát hành lại phiên bản gói bất biến. Hãy sử dụng lệnh sửa `npm dist-tag add openclaw@YYYY.M.P extended-stable` duy nhất được in trong bản tóm tắt luôn chạy của quy trình làm việc thất bại, sau đó lặp lại cả hai lần đọc độc lập. Quay lui về bộ chọn trước đó là một quyết định riêng của người vận hành, không phải luồng sửa lỗi đọc lại.

Tài liệu hỗ trợ công khai ban đầu chỉ định Slack, Discord và Codex là các bề mặt Plugin extended-stable được hỗ trợ. Danh sách đó là một tuyên bố hỗ trợ, không phải danh sách cho phép trong mã phát hành: mọi Plugin chính thức có thể phát hành lên npm đều tuân theo cùng luồng phát hành phiên bản chính xác.

Danh sách kiểm tra thông thường bên dưới tiếp tục quản lý việc phát hành beta, `latest`, GitHub Release, Plugin, macOS, Windows và các nền tảng khác. Không chạy các bước đó cho luồng extended-stable chỉ dành cho npm này.

## Danh sách kiểm tra dành cho người vận hành bản phát hành thông thường

Danh sách kiểm tra này là hình thức công khai của luồng phát hành. Thông tin xác thực riêng tư, việc ký, công chứng, khôi phục dist-tag và chi tiết quay lui khẩn cấp vẫn nằm trong sổ tay vận hành bản phát hành chỉ dành cho người bảo trì.

1. Bắt đầu từ `main` hiện tại: kéo về bản mới nhất, xác nhận commit mục tiêu đã được đẩy và xác nhận Pipeline CI `main` đủ xanh để tạo nhánh từ đó.
2. Tạo `release/YYYY.M.PATCH` từ commit đó. Việc backport là tùy chọn; chỉ áp dụng tập hợp do người vận hành chọn. Tăng mọi vị trí phiên bản bắt buộc, chạy `pnpm release:prep`, hoàn tất các bản sửa lỗi phát hành và forward-port bắt buộc, đồng thời review `src/plugins/compat/registry.ts` cùng `src/commands/doctor/shared/deprecation-compat.ts`.
3. Cố định commit hoàn thiện sản phẩm trước changelog làm **Code SHA**. Chạy bước kiểm tra trước nguồn có tính tất định, sau đó sử dụng `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Việc này ghim công cụ quy trình làm việc đáng tin cậy trong khi toàn bộ ma trận Vitest, Docker, QA, gói và hiệu năng nhắm đến chính xác Code SHA.
4. Phân loại lỗi trước khi chỉnh sửa. Lỗi sản phẩm/mã tạo ra một Code SHA mới và yêu cầu xác thực đầy đủ thành công cho SHA đó. Lỗi quy trình làm việc, bộ khung kiểm thử, thông tin xác thực, phê duyệt hoặc hạ tầng được sửa trong bề mặt sở hữu tương ứng rồi chạy lại với cùng Code SHA.
5. Chỉ sau khi Code SHA xanh, hãy tạo phần `CHANGELOG.md` trên cùng từ các PR đã hợp nhất và các commit trực tiếp kể từ thẻ đã phát hành gần nhất có thể truy cập. Giữ các mục hướng đến người dùng và không trùng lặp. Khi một thẻ đã phát hành phân kỳ hoặc một forward-port sau đó liên kết lại các PR đã phát hành, hãy truyền thẻ đó một cách rõ ràng dưới dạng `--shipped-ref`.
6. Chỉ commit `CHANGELOG.md`. Commit này là **Release SHA**. Toàn bộ diff từ Code SHA đến Release SHA phải chính xác là `CHANGELOG.md`; bất kỳ đường dẫn thay đổi nào khác đều đưa bản phát hành trở lại bước 2.
7. Chạy Full Release Validation được ghim theo SHA cho Release SHA với tính năng tái sử dụng bằng chứng được bật. Tiến trình cha nhẹ phải ghi lại `changelog-only-release-v1`, trỏ đến Code SHA xanh và không điều phối làn tiến trình con sản phẩm nào. Việc này tái sử dụng bằng chứng sản phẩm; không tái sử dụng byte của gói.
8. Chạy `OpenClaw NPM Release` với `preflight_only=true` trên Release SHA/thẻ. Lưu `preflight_run_id` thành công. Việc này dựng và kiểm tra chính xác các byte của gói có bao gồm changelog cuối cùng.
9. Gắn thẻ Release SHA, sau đó chạy trình trợ giúp ứng viên với tiến trình cha xác thực Release-SHA thành công và bước kiểm tra trước npm thay vì điều phối lại một trong hai:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Đối với bản ổn định, cũng truyền `--windows-node-tag vX.Y.Z`. Trình trợ giúp xác minh nguồn gốc ghi chú phát hành, byte kiểm tra trước npm, bằng chứng cài đặt/cập nhật Parallels, bằng chứng gói Telegram và kế hoạch phát hành plugin, sau đó in lệnh phát hành.

   `OpenClaw Release Publish` gửi các gói plugin đã chọn hoặc tất cả gói có thể phát hành lên npm và đồng thời gửi cùng tập hợp đó lên ClawHub, sau đó quảng bá artifact kiểm tra trước npm của OpenClaw đã chuẩn bị với dist-tag tương ứng khi việc phát hành plugin lên npm thành công. Checkout phát hành vẫn là thư mục gốc của sản phẩm/dữ liệu, còn việc lập kế hoạch và xác minh cuối cùng được thực thi từ checkout nguồn workflow tin cậy chính xác để một commit phát hành cũ hơn không thể âm thầm sử dụng công cụ phát hành lỗi thời. Trước khi bất kỳ tiến trình phát hành con nào bắt đầu, quy trình kết xuất và lưu vào bộ nhớ đệm nội dung chính xác của bản phát hành GitHub. Khi toàn bộ phần `CHANGELOG.md` tương ứng vừa với giới hạn 125,000 ký tự của GitHub và ngưỡng an toàn 125,000 byte tương ứng của trình kết xuất, trang sẽ chứa chính xác phần `## YYYY.M.PATCH` đó, bao gồm cả tiêu đề. Khi phần nguồn không vừa, trang giữ nguyên chính xác các ghi chú biên tập đã nhóm và thay bản ghi đóng góp quá lớn bằng liên kết ổn định đến bản ghi đầy đủ trong `CHANGELOG.md` được ghim theo thẻ; không bao giờ phát hành bản ghi một phần hoặc dấu đầu dòng bị cắt ngắn. Workflow chọn nội dung đầy đủ hoặc thu gọn đó trước khi thêm `### Release verification`; nếu phần đuôi bằng chứng vượt quá giới hạn, quy trình giữ nội dung chuẩn và dựa vào bằng chứng đính kèm bất biến. Các bản phát hành ổn định được phát hành lên npm `latest` trở thành bản phát hành mới nhất trên GitHub, còn các bản phát hành bảo trì ổn định được giữ trên npm `beta` được tạo với GitHub `latest=false`. Workflow cũng tải bằng chứng phụ thuộc từ bước kiểm tra trước, manifest xác thực đầy đủ và bằng chứng xác minh registry sau phát hành lên bản phát hành GitHub để phục vụ ứng phó sự cố sau phát hành. Quy trình in ngay ID của các lượt chạy con, tự động phê duyệt các cổng môi trường phát hành mà token workflow được phép phê duyệt, tóm tắt các công việc con thất bại kèm phần cuối nhật ký, tạo trước trang bản phát hành GitHub dạng bản nháp và đồng thời quảng bá các asset Windows và Android với việc phát hành OpenClaw lên npm, hoàn tất trang phát hành và bằng chứng phụ thuộc sau khi các giai đoạn đó thành công, chờ ClawHub bất cứ khi nào OpenClaw đang được phát hành lên npm, sau đó chạy trình xác minh beta từ main tin cậy và tải lên bằng chứng sau phát hành cho bản phát hành GitHub, gói npm, các gói npm plugin đã chọn, các gói ClawHub đã chọn, ID lượt chạy workflow con và ID lượt chạy NPM Telegram tùy chọn. Trình xác minh bootstrap ClawHub yêu cầu chính xác đường dẫn và SHA của workflow từ main tin cậy, các lần thử chạy của tiến trình tạo và tiến trình kết thúc, SHA phát hành, tập hợp gói được yêu cầu, bộ giá trị artifact gói bất biến và artifact đọc lại registry ở bước cuối; lượt chạy thành công cũ dùng tham chiếu phát hành không được chấp nhận.

   Sau đó chạy kiểm thử chấp nhận gói sau phát hành đối với gói `openclaw@YYYY.M.PATCH-beta.N` hoặc `openclaw@beta` đã phát hành. Nếu một bản tiền phát hành đã đẩy hoặc phát hành cần được sửa, hãy tạo số tiền phát hành tương ứng tiếp theo; không bao giờ xóa hoặc ghi đè bản cũ.

10. Khi một lần phát hành thất bại, giữ nguyên SHA phát hành trừ khi lỗi chứng minh có khiếm khuyết trong sản phẩm hoặc changelog. Tiếp tục sử dụng các tiến trình con và artifact bất biến đã thành công; không bao giờ xây dựng lại hoặc phát hành lại một phiên bản gói đã thành công.
11. Đối với bản ổn định, chỉ tiếp tục sau khi bản beta hoặc ứng viên phát hành đã được thẩm định có đủ bằng chứng xác thực bắt buộc. Việc phát hành bản ổn định lên npm cũng đi qua `OpenClaw Release Publish`, tái sử dụng artifact kiểm tra trước đã thành công thông qua `preflight_run_id`. Mức độ sẵn sàng phát hành macOS ổn định cũng yêu cầu `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói và `appcast.xml` đã cập nhật trên `main`; workflow phát hành macOS tự động phát hành appcast đã ký lên `main` công khai sau khi các asset phát hành được xác minh, hoặc mở/cập nhật một pull request appcast nếu cơ chế bảo vệ nhánh chặn việc đẩy trực tiếp. Mức độ sẵn sàng của Windows Hub ổn định yêu cầu các asset `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` và `OpenClawCompanion-SHA256SUMS.txt` đã ký trên bản phát hành GitHub của OpenClaw. Truyền chính xác thẻ phát hành `openclaw/openclaw-windows-node` đã ký dưới dạng `windows_node_tag` và bản đồ digest trình cài đặt đã được ứng viên phê duyệt dưới dạng `windows_node_installer_digests`; `OpenClaw Release Publish` giữ bản nháp phát hành, gửi `Windows Node Release` và xác minh cả ba asset trước khi phát hành.
12. Sau khi phát hành, chạy trình xác minh npm sau phát hành, tùy chọn chạy E2E Telegram độc lập trên npm đã phát hành khi cần bằng chứng kênh sau phát hành, quảng bá dist-tag khi cần, xác minh trang bản phát hành GitHub đã tạo, thực hiện các bước thông báo phát hành, sau đó hoàn tất [Đóng quy trình main ổn định](#stable-main-closeout) trước khi coi bản phát hành ổn định là hoàn tất.

## Đóng quy trình main ổn định

Việc phát hành bản ổn định chưa hoàn tất cho đến khi `main` chứa trạng thái phát hành thực tế đã cung cấp.

1. Bắt đầu từ `main` mới nhất và mới được làm mới. Kiểm tra `release/YYYY.M.PATCH` dựa trên đó và chuyển tiếp các bản sửa thực sự chưa có trong `main`. Không hợp nhất một cách máy móc các bộ chuyển đổi tương thích, kiểm thử hoặc xác thực chỉ dành cho bản phát hành vào `main` mới hơn.
2. Đối với quy trình thông thường, đặt `main` thành phiên bản ổn định đã cung cấp. Một lần đóng quy trình muộn có thể dùng `main` sau khi nó đã tiến lên một CalVer OpenClaw ổn định mới hơn; không hạ cấp một chu kỳ phát hành đã bắt đầu chỉ để đóng bản phát hành trước đó. Trình xác thực vẫn yêu cầu chính xác phần changelog và mục appcast của bản đã cung cấp, đồng thời ghi lại phiên bản và SHA thực tế của `main`. Chạy `pnpm release:prep` sau bất kỳ thay đổi phiên bản gốc nào, rồi chạy `pnpm deps:shrinkwrap:generate`.
3. Làm cho phần `## YYYY.M.PATCH` của `CHANGELOG.md` trên `main` khớp chính xác với nhánh phát hành được gắn thẻ. Bao gồm bản cập nhật `appcast.xml` ổn định khi bản phát hành mac đã phát hành một bản.
4. Không thêm `YYYY.M.PATCH+1`, phiên bản beta hoặc phần changelog tương lai trống vào `main` cho đến khi người vận hành bắt đầu chu kỳ phát hành đó một cách rõ ràng.
5. Chạy `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` và `OPENCLAW_TESTBOX=1 pnpm check:changed`. Đẩy lên, sau đó xác minh `origin/main` chứa phiên bản và changelog đã cung cấp trước khi coi bản phát hành ổn định là hoàn tất.
6. Duy trì các biến kho lưu trữ `RELEASE_ROLLBACK_DRILL_ID` và `RELEASE_ROLLBACK_DRILL_DATE` ở trạng thái hiện hành sau mỗi lần diễn tập rollback riêng tư.

`OpenClaw Stable Main Closeout` bắt đầu từ lần đẩy `main` chứa phiên bản, changelog và appcast đã cung cấp sau khi phát hành ổn định. Quy trình đọc bằng chứng sau phát hành bất biến để ràng buộc thẻ đã cung cấp với các lượt chạy Xác thực phát hành đầy đủ và Phát hành tương ứng, sau đó xác minh trạng thái main ổn định, bản phát hành, giai đoạn soak ổn định bắt buộc và bằng chứng hiệu năng có tính chặn. Quy trình đính kèm manifest đóng quy trình bất biến và checksum vào bản phát hành GitHub. Trình kích hoạt đẩy tự động bỏ qua các bản phát hành cũ có trước bằng chứng sau phát hành bất biến và không bao giờ coi lần bỏ qua đó là đã hoàn tất đóng quy trình.

Một lần đóng quy trình hoàn chỉnh yêu cầu cả hai asset và một checksum tương ứng. Manifest một phần phát lại SHA `main` và lần diễn tập rollback đã ghi để tạo lại các byte giống hệt nhau, sau đó đính kèm checksum còn thiếu; một cặp không hợp lệ hoặc checksum không có manifest vẫn có tính chặn. Lượt chạy được kích hoạt bằng thao tác đẩy nhưng không có các biến kho lưu trữ của lần diễn tập rollback sẽ bỏ qua mà không hoàn tất đóng quy trình; bản ghi diễn tập bị thiếu hoặc cũ hơn 90 ngày vẫn chặn việc đóng quy trình thủ công dựa trên bằng chứng. Các lệnh khôi phục riêng tư vẫn nằm trong runbook chỉ dành cho người bảo trì. Chỉ dùng thao tác gửi thủ công để sửa chữa hoặc phát lại một lần đóng quy trình ổn định có bằng chứng hỗ trợ.

Nếu tiến trình cha Phát hành bản phát hành chỉ thất bại sau khi bằng chứng npm/plugin bất biến đã được đính kèm, trước tiên hãy sửa chữa và phát hành mọi asset nền tảng ổn định. Sau đó, người bảo trì có thể gửi thủ công quy trình đóng với `allow_failed_publish_recovery=true`; chế độ đó chỉ chấp nhận một tiến trình cha thất bại đã hoàn tất và còn yêu cầu chính xác các hợp đồng asset Android và Windows, digest SHA-256 của GitHub, xác minh checksum, nguồn gốc Android và một lần quảng bá Windows do tiến trình cha gửi đã thành công, trong đó các bước kiểm tra Authenticode và digest đã được ứng viên phê duyệt khớp với các trình cài đặt đã phát hành, cùng với các bước kiểm tra macOS/appcast thông thường. Quy trình đóng tự động do thao tác đẩy không bao giờ bật chế độ khôi phục này.

Thẻ hiệu chỉnh dự phòng cũ chỉ có thể tái sử dụng bằng chứng gói cơ sở khi thẻ hiệu chỉnh phân giải thành cùng commit nguồn với thẻ ổn định cơ sở. Bản phát hành Android của thẻ này tái sử dụng APK đã xác minh của thẻ cơ sở và thêm nguồn gốc cho thẻ hiệu chỉnh. Một bản hiệu chỉnh có nguồn khác phải phát hành và xác minh bằng chứng gói riêng, đồng thời dùng `versionCode` Android cao hơn.

## Kiểm tra trước phát hành

- Chạy `pnpm check:test-types` trước bước kiểm tra trước phát hành để TypeScript kiểm thử vẫn được bao phủ bên ngoài cổng `pnpm check` cục bộ nhanh hơn.
- Chạy `pnpm check:architecture` trước bước kiểm tra trước phát hành để các bước kiểm tra rộng hơn về chu trình import và ranh giới kiến trúc đều đạt bên ngoài cổng cục bộ nhanh hơn.
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các artifact phát hành `dist/*` dự kiến và bundle Control UI tồn tại cho bước xác thực gói.
- Chạy `pnpm release:prep` sau khi tăng phiên bản gốc và trước khi gắn thẻ. Lệnh này chạy mọi trình tạo phát hành tất định thường bị sai lệch sau thay đổi phiên bản/cấu hình/API: phiên bản plugin, shrinkwrap npm, danh mục plugin, schema cấu hình cơ sở, siêu dữ liệu cấu hình kênh đi kèm, đường cơ sở tài liệu cấu hình, các mục xuất của SDK plugin, manifest hợp đồng API của SDK Plugin và các bundle bản địa hóa Control UI. `pnpm release:check` chạy lại các bộ kiểm tra đó ở chế độ kiểm tra (bao gồm cổng bản địa hóa nghiêm ngặt không có fallback cùng ngân sách bề mặt SDK plugin) và báo cáo mọi lỗi sai lệch được tạo trong một lượt trước khi chạy các bước kiểm tra phát hành gói.
- Theo mặc định, việc đồng bộ phiên bản plugin cập nhật gói runtime `@openclaw/ai` có thể phát hành, phiên bản các gói plugin chính thức và các mức sàn `openclaw.compat.pluginApi` hiện có lên phiên bản phát hành OpenClaw. Hãy coi trường đó là mức sàn API SDK/runtime của plugin, không chỉ là bản sao phiên bản gói: đối với các bản phát hành chỉ dành cho plugin được chủ ý giữ tương thích với các máy chủ OpenClaw cũ hơn, hãy giữ mức sàn ở API máy chủ cũ nhất được hỗ trợ và ghi lại lựa chọn đó trong bằng chứng phát hành plugin.
- Chạy workflow `Full Release Validation` thủ công trước khi phê duyệt phát hành để khởi động tất cả hộp kiểm thử trước phát hành từ một điểm vào duy nhất. Workflow nhận một nhánh, thẻ hoặc SHA commit đầy đủ, gửi `CI` thủ công và gửi `OpenClaw Release Checks` cho các luồng kiểm tra nhanh cài đặt, chấp nhận gói, kiểm tra gói đa hệ điều hành, tính tương đương QA Lab, Matrix và Telegram. Các lượt chạy ổn định và đầy đủ luôn bao gồm soak đầy đủ cho live/E2E và đường dẫn phát hành Docker; `run_release_soak=true` được giữ lại cho một đợt soak beta rõ ràng. Kiểm thử Chấp nhận gói cung cấp E2E Telegram chuẩn của gói trong quá trình xác thực ứng viên, tránh chạy đồng thời một trình thăm dò trực tiếp thứ hai.

  Cung cấp `release_package_spec` sau khi phát hành một bản beta để tái sử dụng gói npm đã cung cấp trong các bước kiểm tra phát hành, Kiểm thử Chấp nhận gói và E2E Telegram của gói mà không xây dựng lại tarball phát hành. Chỉ cung cấp `npm_telegram_package_spec` khi Telegram cần dùng một gói đã phát hành khác với phần còn lại của quá trình xác thực phát hành. Cung cấp `package_acceptance_package_spec` khi Kiểm thử Chấp nhận gói cần dùng một gói đã phát hành khác với đặc tả gói phát hành. Cung cấp `evidence_package_spec` khi báo cáo bằng chứng phát hành cần chứng minh rằng quá trình xác thực khớp với một gói npm đã phát hành mà không bắt buộc E2E Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Chạy quy trình thủ công `Package Acceptance` khi bạn muốn có bằng chứng từ kênh phụ cho một bản ứng viên gói trong khi công việc phát hành vẫn tiếp tục. Dùng `source=npm` cho `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành chính xác; `source=ref` để đóng gói một nhánh/thẻ/SHA `package_ref` đáng tin cậy bằng bộ kiểm thử `workflow_ref` hiện tại; `source=url` cho tarball HTTPS công khai với SHA-256 bắt buộc và chính sách URL công khai nghiêm ngặt; `source=trusted-url` cho chính sách nguồn đáng tin cậy có tên, sử dụng `trusted_source_id` và SHA-256 bắt buộc; hoặc `source=artifact` cho tarball do một lượt chạy GitHub Actions khác tải lên.

  Quy trình phân giải bản ứng viên thành `package-under-test`, tái sử dụng bộ lập lịch phát hành Docker E2E với tarball đó và có thể chạy QA Telegram với cùng tarball bằng `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các lane Docker được chọn bao gồm `published-upgrade-survivor`, hiện vật gói là bản ứng viên và `published_upgrade_survivor_baseline` chọn đường cơ sở đã phát hành. `update-restart-auth` dùng gói ứng viên làm cả CLI đã cài đặt lẫn gói đang được kiểm thử để kiểm tra đường dẫn khởi động lại có quản lý của lệnh cập nhật trong bản ứng viên.

  Ví dụ:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Các hồ sơ thường dùng:
  - `smoke`: các lane cài đặt/kênh/agent, mạng Gateway và tải lại cấu hình
  - `package`: các lane gói/cập nhật/khởi động lại/plugin theo hiện vật gốc, không có OpenWebUI hoặc ClawHub trực tiếp
  - `product`: hồ sơ gói cộng với các kênh MCP, dọn dẹp cron/subagent, tìm kiếm web OpenAI và OpenWebUI
  - `full`: các phần đường dẫn phát hành Docker với OpenWebUI
  - `custom`: lựa chọn `docker_lanes` chính xác để chạy lại có trọng tâm

- Chạy trực tiếp quy trình thủ công `CI` khi bạn chỉ cần phạm vi kiểm thử CI thông thường có tính xác định cho bản ứng viên phát hành. Các lượt kích hoạt CI thủ công bỏ qua phạm vi theo thay đổi và bắt buộc chạy các shard Linux Node, shard plugin đi kèm, shard hợp đồng plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra nhanh hiện vật đã dựng, kiểm tra tài liệu, Skills Python, Windows, macOS và các lane i18n của Control UI. Các lượt CI thủ công độc lập chỉ chạy Android khi được kích hoạt với `include_android=true`; `Full Release Validation` truyền đầu vào đó cho CI con của nó.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Chạy `pnpm qa:otel:smoke` khi xác thực dữ liệu đo từ xa của bản phát hành. Quy trình này chạy QA-lab qua một bộ thu OTLP/HTTP cục bộ và xác minh việc xuất trace, metric và log, cùng với các thuộc tính trace bị giới hạn và việc biên tập nội dung/mã định danh, mà không yêu cầu Opik, Langfuse hoặc bộ thu bên ngoài khác.
- Chạy `pnpm qa:otel:collector-smoke` khi xác thực khả năng tương thích của bộ thu. Quy trình này định tuyến cùng dữ liệu xuất OTLP của QA-lab qua một container Docker OpenTelemetry Collector thực trước các bước xác nhận của bộ thu cục bộ.
- Chạy `pnpm qa:prometheus:smoke` khi xác thực việc thu thập Prometheus được bảo vệ. Quy trình này chạy QA-lab, từ chối các lượt thu thập chưa xác thực và xác minh rằng các họ metric thiết yếu cho phát hành không chứa nội dung prompt, mã định danh thô, token xác thực và đường dẫn cục bộ.
- Chạy `pnpm qa:observability:smoke` để thực hiện liên tiếp các lane kiểm tra nhanh OpenTelemetry và Prometheus từ bản checkout mã nguồn.
- Chạy `pnpm release:check` trước mỗi bản phát hành được gắn thẻ.
- Bước kiểm tra trước `OpenClaw NPM Release` tạo bằng chứng phát hành về phần phụ thuộc trước khi đóng gói tarball npm. Cổng lỗ hổng cảnh báo npm chặn phát hành nếu không đạt. Các báo cáo về rủi ro manifest bắc cầu, quyền sở hữu/bề mặt cài đặt phần phụ thuộc và thay đổi phần phụ thuộc chỉ là bằng chứng phát hành. Báo cáo thay đổi phần phụ thuộc so sánh bản ứng viên phát hành với thẻ phát hành trước đó có thể truy cập. Bước kiểm tra trước tải bằng chứng phần phụ thuộc lên dưới dạng `openclaw-release-dependency-evidence-<tag>` và cũng nhúng bằng chứng đó tại `dependency-evidence/` bên trong hiện vật kiểm tra trước npm đã chuẩn bị. Đường dẫn phát hành thực tế tái sử dụng hiện vật kiểm tra trước đó, rồi đính kèm cùng bằng chứng vào bản phát hành GitHub dưới dạng `openclaw-<version>-dependency-evidence.zip`.
- Chạy `OpenClaw Release Publish` cho trình tự phát hành có thay đổi trạng thái sau khi thẻ đã tồn tại. Kích hoạt các lượt phát hành beta và ổn định thông thường từ `main` đáng tin cậy; thẻ phát hành vẫn chọn chính xác commit đích và có thể trỏ vào `release/YYYY.M.PATCH`. Các bản phát hành alpha Tideclaw vẫn nằm trên nhánh alpha tương ứng. Truyền `preflight_run_id` npm OpenClaw thành công, `full_release_validation_run_id` thành công và `full_release_validation_run_attempt` chính xác, đồng thời giữ phạm vi phát hành plugin mặc định là `all-publishable` trừ khi bạn chủ ý chạy một bản sửa chữa có trọng tâm. Quy trình tuần tự hóa việc phát hành plugin lên npm, phát hành plugin lên ClawHub và phát hành OpenClaw lên npm để gói lõi không được phát hành trước các plugin đã được tách ra bên ngoài; quá trình quảng bá Windows và Android chạy đồng thời với việc phát hành npm lõi trên trang bản phát hành nháp. Các lượt chạy lại phát hành có thể tiếp tục: phiên bản npm lõi đã phát hành sẽ bỏ qua lượt kích hoạt lõi sau khi quy trình chứng minh tarball trên registry khớp với hiện vật kiểm tra trước của thẻ; quá trình quảng bá Windows/Android cũng được bỏ qua khi bản phát hành đã có hợp đồng hiện vật được xác minh, vì vậy một lần thử lại chỉ thực hiện lại các giai đoạn bị lỗi. Các bản sửa chữa chỉ dành cho plugin có trọng tâm yêu cầu `plugin_publish_scope=selected` và một danh sách plugin không rỗng. Các lượt `all-publishable` chỉ dành cho plugin yêu cầu đầy đủ bằng chứng kiểm tra trước bất biến và Xác thực Phát hành Đầy đủ; bằng chứng không đầy đủ sẽ bị từ chối.
- `OpenClaw Release Publish` ổn định yêu cầu một `windows_node_tag` chính xác sau khi bản phát hành `openclaw/openclaw-windows-node` không phải bản phát hành trước tương ứng đã tồn tại, cùng với bản đồ `windows_node_installer_digests` đã được phê duyệt cho bản ứng viên. Trước khi kích hoạt bất kỳ quy trình phát hành con nào, quy trình xác minh rằng bản phát hành nguồn đã được phát hành, không phải bản phát hành trước, chứa các trình cài đặt x64/ARM64 bắt buộc và vẫn khớp với bản đồ đã phê duyệt đó. Sau đó, quy trình kích hoạt `Windows Node Release` trong khi bản phát hành OpenClaw vẫn là bản nháp, giữ nguyên bản đồ mã băm trình cài đặt đã ghim. Quy trình con tải các trình cài đặt Windows Hub đã ký từ chính xác thẻ đó, đối chiếu chúng với các mã băm đã ghim, xác minh trên runner Windows rằng chữ ký Authenticode của chúng sử dụng bên ký OpenClaw Foundation dự kiến, ghi manifest SHA-256, tải các trình cài đặt cùng manifest lên bản phát hành GitHub OpenClaw chính tắc, sau đó tải lại các hiện vật đã quảng bá và xác minh tư cách thành viên trong manifest cùng các mã băm. Quy trình cha xác minh hợp đồng hiện vật x64, ARM64 và checksum hiện tại trước khi phát hành. Khôi phục trực tiếp từ chối các tên hiện vật `OpenClawCompanion-*` không mong đợi trước khi thay thế các hiện vật hợp đồng dự kiến bằng các byte nguồn đã ghim.

  Chỉ kích hoạt thủ công `Windows Node Release` để khôi phục và luôn truyền một thẻ chính xác, tuyệt đối không dùng `latest`, cùng với bản đồ JSON `expected_installer_digests` rõ ràng từ bản phát hành nguồn đã được phê duyệt. Các liên kết tải xuống trên trang web nên trỏ đến URL hiện vật chính xác của bản phát hành OpenClaw ổn định hiện tại, hoặc chỉ dùng `releases/latest/download/...` sau khi xác minh rằng chuyển hướng mới nhất của GitHub trỏ đến cùng bản phát hành đó; không chỉ liên kết đến trang phát hành của kho lưu trữ đồng hành.

- Các bước kiểm tra bản phát hành hiện chạy trong một workflow thủ công riêng: `OpenClaw Release Checks`. Workflow này cũng chạy lane đối chiếu mock của QA Lab cùng với profile phát hành Matrix và lane QA Telegram trước khi phê duyệt bản phát hành. Các lane trực tiếp sử dụng môi trường `qa-live-shared`; Telegram cũng sử dụng các lượt thuê thông tin xác thực CI của Convex. Chạy workflow `QA-Lab - All Lanes` thủ công với `matrix_profile=all` khi cần mọi kịch bản Matrix được duy trì; workflow phân bổ lựa chọn đó trên các profile truyền tải, phương tiện và E2EE để giữ toàn bộ bằng chứng trong giới hạn thời gian chờ của từng job.
- Việc xác thực runtime cài đặt và nâng cấp đa hệ điều hành là một phần của `OpenClaw Release Checks` và `Full Release Validation` công khai, chúng gọi trực tiếp workflow có thể tái sử dụng `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Việc tách này là có chủ đích: giữ đường dẫn phát hành npm thực tế ngắn gọn, xác định và tập trung vào artifact, trong khi các bước kiểm tra trực tiếp chậm hơn nằm trong lane riêng để không làm đình trệ hoặc chặn quá trình phát hành.
- Các bước kiểm tra bản phát hành có sử dụng secret nên được điều phối qua `Full Release Validation` hoặc từ ref workflow `main`/release để logic workflow và secret luôn được kiểm soát.
- `OpenClaw Release Checks` chấp nhận một nhánh, thẻ hoặc SHA commit đầy đủ, miễn là commit được phân giải có thể truy cập từ một nhánh hoặc thẻ phát hành OpenClaw.
- Bước kiểm tra sơ bộ chỉ để xác thực của `OpenClaw NPM Release` cũng chấp nhận SHA commit đầy đủ 40 ký tự hiện tại của nhánh workflow mà không yêu cầu thẻ đã được đẩy lên. Đường dẫn SHA đó chỉ dùng để xác thực và không thể được thăng cấp thành một lần phát hành thực tế. Trong chế độ SHA, workflow chỉ tổng hợp `v<package.json version>` cho bước kiểm tra metadata gói; việc phát hành thực tế vẫn yêu cầu một thẻ phát hành thực.
- Cả hai workflow đều giữ đường dẫn phát hành và thăng cấp thực tế trên runner do GitHub lưu trữ, trong khi đường dẫn xác thực không thay đổi dữ liệu có thể sử dụng các runner Linux Blacksmith lớn hơn.
- Workflow đó chạy `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` bằng cả hai secret workflow `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`.
- Bước kiểm tra sơ bộ bản phát hành npm không còn chờ lane kiểm tra bản phát hành riêng biệt.
- Trước khi gắn thẻ cục bộ cho một bản phát hành ứng viên, hãy chạy `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Trình trợ giúp chạy các rào chắn phát hành nhanh, kiểm tra phát hành npm/ClawHub của plugin, bản dựng, bản dựng UI và `release:openclaw:npm:check` theo thứ tự giúp phát hiện các lỗi phổ biến có thể chặn phê duyệt trước khi workflow phát hành GitHub bắt đầu.
- Chạy `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (hoặc thẻ tiền phát hành/bản sửa tương ứng) trước khi phê duyệt.
- Sau khi phát hành npm, hãy chạy `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (hoặc phiên bản beta/bản sửa tương ứng) để xác minh đường dẫn cài đặt từ registry đã phát hành trong một tiền tố tạm mới.
- Sau khi phát hành bản beta, hãy chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` để xác minh quy trình thiết lập ban đầu của gói đã cài đặt, thiết lập Telegram và E2E Telegram thực tế với gói npm đã phát hành bằng nhóm thông tin xác thực Telegram dùng chung theo lượt thuê. Trong các lần chạy riêng lẻ cục bộ, người bảo trì có thể bỏ qua các biến Convex và truyền trực tiếp ba thông tin xác thực môi trường `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy toàn bộ kiểm tra nhanh beta sau phát hành từ máy của người bảo trì, hãy dùng `pnpm release:beta-smoke -- --beta betaN`. Trình trợ giúp chạy quá trình xác thực cập nhật npm/mục tiêu mới của Parallels, điều phối `NPM Telegram Beta E2E`, thăm dò chính xác lần chạy workflow, tải artifact xuống và in báo cáo Telegram.
- Người bảo trì có thể chạy cùng bước kiểm tra sau phát hành từ GitHub Actions qua workflow `NPM Telegram Beta E2E` thủ công. Workflow này được thiết kế chỉ chạy thủ công và không chạy sau mỗi lần hợp nhất.
- Tự động hóa phát hành dành cho người bảo trì sử dụng quy trình kiểm tra sơ bộ rồi thăng cấp:
  - Việc phát hành npm thực tế phải vượt qua thành công một `preflight_run_id` npm.
  - Quy trình điều phối và kiểm tra sơ bộ phát hành beta và ổn định thông thường sử dụng `main` đáng tin cậy với chính xác thẻ mục tiêu. Quy trình phát hành và kiểm tra sơ bộ bản alpha Tideclaw sử dụng nhánh alpha tương ứng.
  - Các bản phát hành npm ổn định mặc định sử dụng `beta`; việc phát hành npm ổn định có thể nhắm rõ ràng đến `latest` qua đầu vào workflow.
  - Thao tác thay đổi dist-tag npm dựa trên token nằm trong `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` vì `npm dist-tag add` vẫn cần `NPM_TOKEN` trong khi repo nguồn chỉ duy trì phát hành bằng OIDC.
  - `macOS Release` công khai chỉ dùng để xác thực; khi một thẻ chỉ tồn tại trên nhánh phát hành nhưng workflow được điều phối từ `main`, hãy đặt `public_release_branch=release/YYYY.M.PATCH`.
  - Việc phát hành macOS thực tế phải vượt qua thành công `preflight_run_id` và `validate_run_id` của macOS.
  - Các đường dẫn phát hành thực tế thăng cấp artifact đã chuẩn bị thay vì dựng lại chúng.
- Đối với các bản phát hành sửa lỗi ổn định như `YYYY.M.PATCH-N`, trình xác minh sau phát hành cũng kiểm tra cùng đường dẫn nâng cấp dùng tiền tố tạm từ `YYYY.M.PATCH` lên `YYYY.M.PATCH-N`, để các bản sửa phát hành không thể âm thầm khiến những bản cài đặt toàn cục cũ hơn tiếp tục dùng payload ổn định cơ sở.
- Bước kiểm tra sơ bộ bản phát hành npm sẽ đóng khi lỗi trừ khi tarball chứa cả `dist/control-ui/index.html` và một payload `dist/control-ui/assets/` không rỗng, để tránh phát hành lại một bảng điều khiển trình duyệt trống.
- Quá trình xác minh sau phát hành cũng kiểm tra các điểm vào plugin và metadata gói đã phát hành có tồn tại trong bố cục registry đã cài đặt hay không. Bản phát hành thiếu payload runtime plugin sẽ không vượt qua trình xác minh sau phát hành và không thể được thăng cấp lên `latest`.
- `pnpm test:install:smoke` cũng thực thi hạn mức `unpackedSize` của npm pack trên tarball cập nhật ứng viên, để E2E của trình cài đặt phát hiện việc kích thước gói tăng ngoài ý muốn trước đường dẫn phát hành.
- Nếu công việc phát hành đã thay đổi việc lập kế hoạch CI, manifest thời gian của tiện ích mở rộng hoặc ma trận kiểm thử tiện ích mở rộng, hãy tạo lại và xem xét các đầu ra ma trận `plugin-prerelease-extension-shard` do bộ lập kế hoạch sở hữu từ `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt, để ghi chú phát hành không mô tả một bố cục CI đã lỗi thời.
- Mức độ sẵn sàng của bản phát hành macOS ổn định cũng bao gồm các bề mặt trình cập nhật: bản phát hành GitHub cuối cùng phải có `.zip`, `.dmg` và `.dSYM.zip` đã đóng gói; `appcast.xml` trên `main` phải trỏ đến tệp zip ổn định mới sau khi phát hành (workflow phát hành macOS tự động commit tệp này hoặc mở một pull request appcast khi thao tác đẩy trực tiếp bị chặn); ứng dụng đã đóng gói phải duy trì một bundle id không phải debug, URL nguồn cấp Sparkle không rỗng và `CFBundleVersion` bằng hoặc cao hơn mức sàn bản dựng Sparkle chuẩn cho phiên bản phát hành đó.

## Các hộp kiểm thử bản phát hành

`Full Release Validation` là cách người vận hành khởi chạy toàn bộ ma trận sản phẩm từ một điểm vào duy nhất. Hãy dùng trình trợ giúp để mọi workflow con chạy từ một nhánh tạm thời được cố định tại một SHA workflow `main` đáng tin cậy, trong khi commit được yêu cầu vẫn là ứng viên đang được kiểm thử:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

Trình trợ giúp tìm nạp `origin/main` hiện tại, đẩy `release-ci/<workflow-sha>-...` tại commit workflow đáng tin cậy đó, suy ra `beta` từ các phiên bản gói alpha/beta và `stable` trong các trường hợp khác, điều phối `Full Release Validation` từ nhánh tạm thời với `ref=<target-sha>`, xác minh mọi `headSha` của workflow con khớp với SHA workflow cha đã ghim, rồi xóa nhánh tạm thời. Truyền `-f reuse_evidence=false` để buộc chạy mới, `-f release_profile=full` để thực hiện đợt rà soát tư vấn rộng, hoặc `--workflow-sha <trusted-main-sha>` để ghim một commit cũ hơn vẫn có thể truy cập từ `origin/main` hiện tại. Bản thân workflow không bao giờ ghi các ref của kho lưu trữ. Điều này giúp công cụ phát hành chỉ có trên nhánh chính vẫn khả dụng mà không thêm commit công cụ vào ứng viên, đồng thời tránh vô tình dùng một lần chạy con `main` mới hơn làm bằng chứng.

Sau khi Code SHA đạt trạng thái xanh, chỉ commit `CHANGELOG.md` và chạy lại cùng trình trợ giúp với Release SHA:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

Workflow cha thứ hai chỉ tái sử dụng bằng chứng sản phẩm khi GitHub chứng minh Release SHA là hậu duệ của Code SHA và toàn bộ tập hợp đường dẫn đã thay đổi chính xác là `CHANGELOG.md`. Workflow ghi lại `changelog-only-release-v1` và không điều phối workflow con sản phẩm nào. Bước kiểm tra sơ bộ npm và chấp nhận gói/cài đặt vẫn chạy trên Release SHA vì các byte tarball của nó đã thay đổi.

Đối với một Code SHA mới, workflow phân giải mục tiêu, điều phối `CI` thủ công, rồi điều phối `OpenClaw Release Checks`. `OpenClaw Release Checks` phân bổ kiểm tra nhanh cài đặt, kiểm tra phát hành đa hệ điều hành, phạm vi đường dẫn phát hành Docker trực tiếp/E2E khi bật soak, Chấp nhận Gói với E2E gói Telegram chuẩn, đối chiếu QA Lab, Matrix trực tiếp và Telegram trực tiếp. Một lần chạy full/all chỉ được chấp nhận khi bản tóm tắt `Full Release Validation` cho thấy `normal_ci`, `plugin_prerelease` và `release_checks` đều thành công, trừ khi một lần chạy lại tập trung đã cố ý bỏ qua workflow con `Plugin Prerelease` riêng biệt. Chỉ sử dụng workflow con `npm-telegram` độc lập cho một lần chạy lại tập trung của gói đã phát hành với `release_package_spec` hoặc `npm_telegram_package_spec`. Bản tóm tắt của trình xác minh cuối cùng bao gồm các bảng job chậm nhất cho mỗi lần chạy con, để người quản lý phát hành có thể thấy đường dẫn tới hạn hiện tại mà không cần tải nhật ký xuống.

Workflow con về hiệu năng sản phẩm chỉ sử dụng artifact trong đường dẫn phát hành này. Workflow
bao quát điều phối nó với `publish_reports=false`, và quá trình xác thực bị từ chối
trừ khi rào chắn chỉ dùng artifact chứng minh rằng trình phát hành báo cáo Clawgrit vẫn
bị bỏ qua.

Xem [Xác thực toàn bộ bản phát hành](/vi/reference/full-release-validation) để biết ma trận giai đoạn đầy đủ, tên chính xác của các job workflow, sự khác biệt giữa profile ổn định và đầy đủ, artifact và các tham chiếu chạy lại tập trung.

Các workflow con được điều phối từ ref đáng tin cậy được ghim SHA chạy `Full Release Validation`. Mọi lần chạy con phải sử dụng chính xác SHA workflow cha. Không sử dụng các lần điều phối `--ref main -f ref=<sha>` thô làm bằng chứng phát hành; hãy sử dụng `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Sử dụng `release_profile` để chọn phạm vi trực tiếp/nhà cung cấp:

- `beta`: đường dẫn trực tiếp và Docker OpenAI/lõi nhanh nhất, thiết yếu cho bản phát hành
- `stable`: phạm vi nhà cung cấp/backend beta cùng với ổn định để phê duyệt bản phát hành
- `full`: phạm vi nhà cung cấp/phương tiện tư vấn rộng cùng với ổn định

Quá trình xác thực ổn định và đầy đủ luôn chạy đợt rà soát toàn diện trực tiếp/E2E, đường dẫn phát hành Docker và khả năng duy trì nâng cấp đã phát hành có giới hạn trước khi thăng cấp. Sử dụng `run_release_soak=true` để yêu cầu cùng đợt rà soát đó cho một bản beta. Đợt rà soát này bao gồm bốn gói ổn định mới nhất cùng với các mốc cơ sở `2026.4.23` và `2026.5.2` đã ghim, cộng với phạm vi `2026.4.15` cũ hơn; các mốc cơ sở trùng lặp được loại bỏ và mỗi mốc cơ sở được phân mảnh vào job runner Docker riêng.

`OpenClaw Release Checks` sử dụng ref workflow đáng tin cậy để phân giải ref mục tiêu một lần thành `release-package-under-test` và tái sử dụng artifact đó trong các bước kiểm tra đa hệ điều hành, Chấp nhận Gói và Docker đường dẫn phát hành khi chạy soak. Điều này giữ tất cả các hộp liên quan đến gói trên cùng một tập byte và tránh dựng gói lặp lại. Sau khi một bản beta đã có trên npm, hãy đặt `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` để các bước kiểm tra phát hành tải gói đã phát hành xuống một lần, trích xuất SHA nguồn bản dựng từ `dist/build-info.json` và tái sử dụng artifact đó cho các lane đa hệ điều hành, Chấp nhận Gói, Docker đường dẫn phát hành và Telegram gói.

Bước kiểm tra nhanh cài đặt OpenAI đa hệ điều hành sử dụng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi biến repo/tổ chức được đặt, nếu không thì sử dụng `openai/gpt-5.6-luna`, vì lane này chứng minh việc cài đặt gói, quy trình thiết lập ban đầu, khởi động Gateway và một lượt chạy agent trực tiếp thay vì đo chuẩn mô hình có năng lực cao nhất. Ma trận nhà cung cấp trực tiếp rộng hơn vẫn là nơi dành cho phạm vi theo từng mô hình.

Sử dụng các biến thể sau tùy theo giai đoạn phát hành:

```bash
# Xác thực Code SHA đã hoàn thiện sản phẩm.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Xác thực Release SHA chỉ thay đổi nhật ký thay đổi bằng cách tái sử dụng bằng chứng sản phẩm của Code SHA.
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

Không sử dụng quy trình tổng hợp đầy đủ cho lần chạy lại đầu tiên sau một bản sửa lỗi tập trung. Nếu một hộp thất bại, hãy sử dụng workflow con, job, lane Docker, hồ sơ gói, nhà cung cấp mô hình hoặc lane QA bị lỗi cho lần kiểm chứng tiếp theo. Chỉ chạy lại quy trình tổng hợp đầy đủ khi bản sửa lỗi thay đổi cơ chế điều phối phát hành dùng chung hoặc khiến bằng chứng trước đó của tất cả các hộp không còn hợp lệ. Trình xác minh cuối cùng của quy trình tổng hợp kiểm tra lại các mã định danh lần chạy workflow con đã ghi nhận, vì vậy sau khi workflow con được chạy lại thành công, chỉ chạy lại job cha `Verify full validation` bị lỗi.

`rerun_group=all` có thể tái sử dụng một lần chạy quy trình tổng hợp đã đạt trước đó khi hồ sơ phát hành,
thiết lập soak có hiệu lực và các đầu vào xác thực khớp nhau, đồng thời SHA đích
giống hệt hoặc đích mới là hậu duệ có toàn bộ tập hợp đường dẫn đã thay đổi
chính xác là `CHANGELOG.md`. Việc tái sử dụng đích chính xác ghi lại
`exact-target-full-validation-v1`; Release SHA sau xác thực ghi lại
`changelog-only-release-v1`. Trường hợp sau chỉ tái sử dụng quá trình xác thực sản phẩm. Quá trình kiểm tra sơ bộ npm,
các byte của gói, nguồn gốc ghi chú phát hành và việc chấp nhận cài đặt/cập nhật
vẫn phải chạy với Release SHA. Mọi thay đổi về phiên bản, nguồn, nội dung được tạo,
phần phụ thuộc, gói hoặc đích thuộc sở hữu của workflow đều yêu cầu Code SHA mới
và một lần xác thực đầy đủ mới. Các lần chạy quy trình tổng hợp mới hơn cho cùng ref `release/*` và
nhóm chạy lại sẽ tự động thay thế các lần đang tiến hành. Truyền
`reuse_evidence=false` để buộc chạy đầy đủ từ đầu.

Để khôi phục trong phạm vi giới hạn, hãy truyền `rerun_group` cho quy trình tổng hợp. `all` là lần chạy ứng viên phát hành thực tế, `ci` chỉ chạy workflow con CI thông thường, `plugin-prerelease` chỉ chạy workflow con dành riêng cho Plugin phát hành, `release-checks` chạy mọi hộp phát hành, còn các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` và `npm-telegram`. Các lần chạy lại `npm-telegram` tập trung yêu cầu `release_package_spec` hoặc `npm_telegram_package_spec`; các lần chạy đầy đủ/tất cả sử dụng E2E Telegram gói chuẩn bên trong Package Acceptance. Các lần chạy lại đa hệ điều hành tập trung có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc một bộ lọc hệ điều hành/bộ kiểm thử khác. Lỗi kiểm tra phát hành QA chặn quá trình xác thực phát hành thông thường, bao gồm cả độ lệch công cụ động OpenClaw bắt buộc ở tầng tiêu chuẩn. Các lần chạy alpha Tideclaw vẫn có thể coi những lane kiểm tra phát hành không liên quan đến an toàn gói là mang tính tư vấn. Với `release_profile=beta`, các bộ kiểm thử nhà cung cấp trực tiếp `Run repo/live E2E validation` mang tính tư vấn (cảnh báo, không chặn); các hồ sơ ổn định và đầy đủ vẫn coi chúng là yếu tố chặn. Khi `live_suite_filter` yêu cầu rõ ràng một lane QA trực tiếp có cổng kiểm soát như Discord, WhatsApp hoặc Slack, biến repo `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` tương ứng phải được bật; nếu không, quá trình thu thập đầu vào sẽ thất bại thay vì âm thầm bỏ qua lane.

### Vitest

Hộp Vitest là workflow con thủ công `CI`. CI thủ công chủ ý bỏ qua phạm vi thay đổi và bắt buộc chạy đồ thị kiểm thử thông thường cho ứng viên phát hành: các shard Node Linux, shard Plugin đi kèm, shard hợp đồng Plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra smoke tạo phẩm đã build, kiểm tra tài liệu, Skills Python, Windows, macOS và i18n Control UI. Android được bao gồm khi `Full Release Validation` chạy hộp này vì quy trình tổng hợp truyền `include_android=true`; CI thủ công độc lập yêu cầu `include_android=true` để bao phủ Android.

Sử dụng hộp này để trả lời câu hỏi "cây mã nguồn có vượt qua toàn bộ bộ kiểm thử thông thường không?" Nó không giống với quá trình xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần lưu giữ:

- bản tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã được điều phối
- lần chạy `CI` đạt trên SHA đích chính xác
- tên các shard bị lỗi hoặc chậm từ các job CI khi điều tra hồi quy
- các tạo phẩm thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi một lần chạy cần phân tích hiệu năng

Chỉ chạy trực tiếp CI thủ công khi bản phát hành cần CI thông thường có tính xác định nhưng không cần các hộp Docker, QA Lab, trực tiếp, đa hệ điều hành hoặc gói. Sử dụng lệnh đầu tiên cho CI trực tiếp không có Android. Thêm `include_android=true` khi CI trực tiếp cho ứng viên phát hành phải bao phủ Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Hộp Docker nằm trong `OpenClaw Release Checks` đến `openclaw-live-and-e2e-checks-reusable.yml`, cùng với workflow chế độ phát hành `install-smoke`. Hộp này xác thực ứng viên phát hành thông qua các môi trường Docker đã đóng gói thay vì chỉ bằng các bài kiểm thử cấp mã nguồn.

Phạm vi bao phủ Docker cho bản phát hành gồm:

- kiểm tra smoke cài đặt đầy đủ với kiểm tra smoke cài đặt Bun toàn cục chậm được bật
- chuẩn bị/tái sử dụng ảnh smoke Dockerfile gốc theo SHA đích, với các job smoke QR, root/gateway và trình cài đặt/Bun chạy dưới dạng các shard smoke cài đặt riêng biệt
- các lane E2E của kho lưu trữ
- các phần Docker theo đường dẫn phát hành: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` đến `plugins-runtime-install-h` và `openwebui`
- phạm vi bao phủ OpenWebUI trên runner ổ đĩa lớn chuyên dụng khi được yêu cầu
- các lane cài đặt/gỡ cài đặt Plugin đi kèm được chia nhỏ từ `bundled-plugin-install-uninstall-0` đến `bundled-plugin-install-uninstall-23`
- các bộ kiểm thử nhà cung cấp trực tiếp/E2E và phạm vi mô hình trực tiếp Docker khi kiểm tra phát hành bao gồm các bộ kiểm thử trực tiếp

Hãy sử dụng các tạo phẩm Docker trước khi chạy lại. Bộ lập lịch theo đường dẫn phát hành tải lên `.artifacts/docker-tests/` cùng với nhật ký lane, `summary.json`, `failures.json`, thời gian các giai đoạn, JSON kế hoạch của bộ lập lịch và các lệnh chạy lại. Để khôi phục tập trung, hãy sử dụng `docker_lanes=<lane[,lane]>` trên workflow trực tiếp/E2E có thể tái sử dụng thay vì chạy lại tất cả các phần phát hành. Các lệnh chạy lại được tạo bao gồm `package_artifact_run_id` trước đó và các đầu vào ảnh Docker đã chuẩn bị khi có, nhờ đó một lane bị lỗi có thể tái sử dụng cùng tarball và các ảnh GHCR.

### QA Lab

Hộp QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành về hành vi tác tử và cấp kênh, tách biệt với cơ chế gói của Vitest và Docker.

Phạm vi bao phủ QA Lab cho bản phát hành gồm:

- lane tương đương giả lập so sánh lane ứng viên OpenAI với đường cơ sở `anthropic/claude-opus-4-8` bằng gói tương đương tác tử
- hồ sơ phát hành bộ điều hợp trực tiếp Matrix sử dụng môi trường `qa-live-shared`
- lane QA Telegram trực tiếp sử dụng các hợp đồng thuê thông tin xác thực Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` hoặc `pnpm qa:observability:smoke` khi dữ liệu đo từ xa của bản phát hành cần bằng chứng cục bộ rõ ràng

Sử dụng hộp này để trả lời câu hỏi "bản phát hành có hoạt động chính xác trong các kịch bản QA và luồng kênh trực tiếp không?" Hãy lưu URL tạo phẩm của các lane tương đương, Matrix và Telegram khi phê duyệt bản phát hành. Phạm vi bao phủ Matrix đầy đủ vẫn có sẵn dưới dạng lần chạy QA-Lab thủ công được chia shard thay vì lane quan trọng mặc định của bản phát hành.

### Gói

Hộp Gói là cổng sản phẩm có thể cài đặt. Nó được hỗ trợ bởi `Package Acceptance` và bộ phân giải `scripts/resolve-openclaw-package-candidate.mjs`. Bộ phân giải chuẩn hóa ứng viên thành tarball `package-under-test` được Docker E2E sử dụng, xác thực danh mục gói, ghi lại phiên bản gói và SHA-256, đồng thời giữ ref của bộ khung workflow tách biệt với ref nguồn gói.

Các nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành OpenClaw chính xác
- `source=ref`: đóng gói một nhánh, thẻ hoặc SHA commit đầy đủ `package_ref` đáng tin cậy bằng bộ khung `workflow_ref` đã chọn
- `source=url`: tải xuống một `.tgz` HTTPS công khai với `package_sha256` bắt buộc; thông tin xác thực trong URL, cổng HTTPS không mặc định, tên máy chủ hoặc địa chỉ được phân giải thuộc loại riêng tư/nội bộ/dùng cho mục đích đặc biệt và các chuyển hướng không an toàn đều bị từ chối
- `source=trusted-url`: tải xuống một `.tgz` HTTPS với `package_sha256` và `trusted_source_id` bắt buộc từ một chính sách có tên trong `.github/package-trusted-sources.json`; sử dụng tùy chọn này cho các mirror doanh nghiệp hoặc kho gói riêng thuộc sở hữu của bên bảo trì thay vì thêm cơ chế bỏ qua mạng riêng ở cấp đầu vào vào `source=url`
- `source=artifact`: tái sử dụng một `.tgz` do một lần chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, tạo phẩm gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance duy trì các bước kiểm tra di chuyển, cập nhật, nâng cấp VPS do root quản lý, khởi động lại sau cập nhật với xác thực đã cấu hình, cài đặt Skills ClawHub trực tiếp, dọn dẹp phần phụ thuộc Plugin cũ, fixture Plugin ngoại tuyến, cập nhật Plugin, gia cố chống thoát ràng buộc lệnh Plugin và QA gói Telegram trên cùng tarball đã phân giải. Các kiểm tra phát hành có tính chặn sử dụng đường cơ sở là gói được phát hành mới nhất theo mặc định; hồ sơ beta với `run_release_soak=true`, `release_profile=stable` hoặc `release_profile=full` mở rộng đợt quét khả năng sống sót sau nâng cấp đã phát hành sang `last-stable-4` cùng các đường cơ sở được ghim `2026.4.23`, `2026.5.2` và `2026.4.15` với các kịch bản `reported-issues`. Sử dụng Package Acceptance với `source=npm` cho một ứng viên đã phát hành, `source=ref` cho tarball npm cục bộ dựa trên SHA trước khi phát hành, `source=trusted-url` cho mirror doanh nghiệp/riêng thuộc sở hữu của bên bảo trì hoặc `source=artifact` cho tarball đã chuẩn bị được một lần chạy GitHub Actions khác tải lên.

Đây là giải pháp thay thế gốc GitHub cho phần lớn phạm vi bao phủ gói/cập nhật trước đây cần Parallels. Các kiểm tra phát hành đa hệ điều hành vẫn quan trọng đối với quy trình thiết lập ban đầu, trình cài đặt và hành vi dành riêng cho từng hệ điều hành, nhưng quá trình xác thực sản phẩm gói/cập nhật nên ưu tiên Package Acceptance.

Danh sách kiểm tra chuẩn cho việc xác thực cập nhật và Plugin là [Kiểm thử bản cập nhật và Plugin](/vi/help/testing-updates-plugins). Hãy sử dụng danh sách này khi quyết định lane cục bộ, Docker, Package Acceptance hoặc kiểm tra phát hành nào chứng minh một thay đổi về cài đặt/cập nhật Plugin, dọn dẹp bằng doctor hoặc di chuyển gói đã phát hành. Việc di chuyển cập nhật đã phát hành toàn diện từ mọi gói ổn định `2026.4.23+` là một workflow thủ công `Update Migration` riêng biệt, không thuộc Full Release CI.

Chính sách nới lỏng Package Acceptance cũ được giới hạn thời gian có chủ ý. Các gói đến hết `2026.4.25` có thể sử dụng đường dẫn tương thích cho các khoảng trống siêu dữ liệu đã được phát hành lên npm: các mục danh mục QA riêng tư không có trong tarball, thiếu `gateway install --wrapper`, thiếu tệp bản vá trong fixture git bắt nguồn từ tarball, thiếu `update.channel` đã lưu bền vững, vị trí bản ghi cài đặt Plugin cũ, thiếu lưu bền vững bản ghi cài đặt marketplace và di chuyển siêu dữ liệu cấu hình trong `plugins update`. Gói `2026.4.26` đã phát hành có thể cảnh báo về các tệp dấu siêu dữ liệu build cục bộ đã được phân phối. Các gói sau đó phải đáp ứng các hợp đồng gói hiện đại; chính những khoảng trống đó sẽ khiến quá trình xác thực phát hành thất bại.

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

- `smoke`: các luồng cài đặt nhanh gói/kênh/tác tử, mạng Gateway và tải lại cấu hình
- `package`: các hợp đồng cài đặt/cập nhật/khởi động lại/gói Plugin cùng bằng chứng cài đặt trực tiếp skill ClawHub; đây là mặc định của kiểm tra bản phát hành
- `product`: `package` cùng các kênh MCP, dọn dẹp cron/tác tử con, tìm kiếm web OpenAI và OpenWebUI
- `full`: các phần của đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác để chạy lại có trọng tâm

Để chứng minh Telegram với gói ứng viên, hãy bật `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier` trong Package Acceptance. Quy trình truyền tarball `package-under-test` đã phân giải vào luồng Telegram; quy trình Telegram độc lập vẫn chấp nhận đặc tả npm đã phát hành để kiểm tra sau khi phát hành.

## Tự động hóa phát hành bản phát hành thông thường

Đối với việc phát hành beta, `latest`, Plugin, GitHub Release và nền tảng,
`OpenClaw Release Publish` là điểm vào có thay đổi trạng thái thông thường. Đường dẫn chỉ dành cho npm extended-stable hằng tháng
`.33+` không sử dụng trình điều phối này. Quy trình thông thường
điều phối các quy trình nhà phát hành tin cậy theo thứ tự mà bản phát hành
yêu cầu:

1. Checkout thẻ phát hành và phân giải SHA commit của thẻ.
2. Xác minh thẻ có thể truy cập được từ `main` hoặc `release/*` (hoặc một nhánh alpha Tideclaw cho các bản phát hành trước alpha).
3. Chạy `pnpm plugins:sync:check`.
4. Điều phối `Plugin NPM Release` với `publish_scope=all-publishable` và `ref=<release-sha>`.
5. Điều phối `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Điều phối `OpenClaw NPM Release` với thẻ phát hành, dist-tag npm và `preflight_run_id` đã lưu sau khi xác minh `full_release_validation_run_id` đã lưu và lần chạy chính xác.
7. Đối với bản phát hành ổn định, tạo hoặc cập nhật bản phát hành GitHub ở dạng bản nháp, điều phối `Windows Node Release` với `windows_node_tag` tường minh và `windows_node_installer_digests` đã được ứng viên phê duyệt, đồng thời xác minh các tài sản trình cài đặt/tổng kiểm Windows chuẩn. Đồng thời điều phối `Android Release` để tạo APK đã ký theo đúng thẻ cùng tổng kiểm và nguồn gốc. Xác minh cả hai hợp đồng tài sản gốc trước khi phát hành bản nháp.

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

Chỉ sử dụng các quy trình cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release` cho công việc sửa chữa hoặc tái phát hành có trọng tâm. `OpenClaw Release Publish` từ chối `plugin_publish_scope=selected` khi `publish_openclaw_npm=true` để gói lõi không thể được phát hành nếu thiếu bất kỳ Plugin chính thức có thể phát hành nào, bao gồm `@openclaw/diffs-language-pack`. Để sửa chữa một Plugin đã chọn, đặt `publish_openclaw_npm=false` với `plugin_publish_scope=selected` và `plugins=@openclaw/name`, hoặc điều phối trực tiếp quy trình con.

Quá trình khởi tạo ClawHub cho lần phát hành đầu tiên là ngoại lệ: điều phối `Plugin ClawHub New`
từ `main` tin cậy và truyền toàn bộ SHA bản phát hành đích qua `ref`.
Không bao giờ chạy chính quy trình khởi tạo từ thẻ hoặc nhánh phát hành:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Xác thực trước khi gắn thẻ yêu cầu `dry_run=true`, từ chối các đầu vào thẻ phát hành và lần chạy cha,
đồng thời chỉ chấp nhận một đích chính xác có thể truy cập được từ `main` hoặc `release/*`.
Quá trình này không tải thông tin xác thực ClawHub, phát hành byte gói hoặc thay đổi
cấu hình nhà phát hành tin cậy. Quy trình vẫn phân giải kế hoạch registry trực tiếp,
checkout và đóng gói đích chỉ trong một job không có secret, hiện thực hóa
chuỗi công cụ ClawHub đã khóa, đồng thời xác thực artifact bất biến và
slug/danh tính gói trước khi thẻ phát hành tồn tại. Chỉ phê duyệt môi trường
`clawhub-plugin-bootstrap` sau khi các job đóng gói không có secret
hoàn tất; job xác thực được bảo vệ này không có thông tin xác thực hoặc lệnh thay đổi trạng thái.

Một lần chạy thử đã được phê duyệt hoặc lần khởi tạo thực sau khi gắn thẻ phải bao gồm chính xác
thẻ phát hành cùng id, lần chạy và
nhánh của lần chạy `OpenClaw Release Publish` cha. Quy trình cha chứng thực SHA quy trình của chính nó và một SHA tin cậy chính xác
`main` riêng cho `Plugin ClawHub New`; lần chạy con và mọi phê duyệt
môi trường được bảo vệ phải khớp với SHA con đã được phê duyệt đó. Thẻ phát hành được
kiểm tra lại trước mọi lần thử phát hành và thay đổi nhà phát hành tin cậy.

Job đóng gói
tải lên một artifact bất biến duy nhất; tên, ID/digest artifact Actions,
lần chạy/lần thử của trình tạo, SHA đích và SHA-256/kích thước tarball của từng gói
được chuyển vào các job xác thực và được bảo vệ. Job được bảo vệ chỉ checkout công cụ `main`
tin cậy, xác thực bộ artifact qua GitHub API, tải xuống
theo ID artifact chính xác, băm lại mọi tarball và xác thực các đường dẫn TAR cục bộ cùng
danh tính gói bằng các quy tắc chuẩn hóa USTAR của CLI được ghim. Sau đó, mọi
ứng viên đều vượt qua lần chạy thử phát hành của CLI được ghim; lần chạy này trả về trước khi
tra cứu registry hoặc xác thực. Bộ lọc trước của job thông tin xác thực giới hạn ClawPack đã nén
ở mức 120 MiB, tổng tải trọng tệp ở mức 50 MiB, dữ liệu TAR đã bung ở mức 64 MiB và
số mục TAR ở mức 10,000. Việc sửa chữa nhà phát hành tin cậy cho gói hiện có vẫn
chỉ cấu hình, nhưng vẫn đóng gói đích và yêu cầu thẻ được đề nghị
cùng byte registry chính xác và siêu dữ liệu hoàn toàn bằng nhau trước khi thay đổi cấu hình
nhà phát hành tin cậy. Xác minh sau phát hành tải xuống artifact ClawHub và
yêu cầu cùng SHA-256 và kích thước. Quá trình khôi phục bằng cách chạy lại các job thất bại chỉ có thể tái sử dụng
artifact gói của một lần thử trước đó khi job tạo chính xác đã hoàn tất
thành công. Bằng chứng cuối cùng cũng ràng buộc phiên bản ClawHub đã khóa, SHA-256
của tệp khóa và tính toàn vẹn npm. Nếu không khớp, phải dùng phiên bản gói mới.

## Đầu vào quy trình NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc, chẳng hạn như `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` hoặc `v2026.4.2-alpha.1`; khi `preflight_only=true`, giá trị này cũng có thể là SHA commit đầy đủ 40 ký tự hiện tại của nhánh quy trình để chỉ xác thực preflight
- `preflight_only`: `true` để chỉ xác thực/tạo/đóng gói, `false` cho đường dẫn phát hành thực
- `preflight_run_id`: id lần chạy preflight thành công hiện có, bắt buộc trên đường dẫn phát hành thực để quy trình tái sử dụng tarball đã chuẩn bị thay vì tạo lại
- `full_release_validation_run_id`: id lần chạy `Full Release Validation` thành công cho thẻ/SHA này, bắt buộc đối với phát hành thực. Bản phát hành beta có thể tiếp tục chỉ với preflight kèm cảnh báo, nhưng việc thăng hạng ổn định/`latest` vẫn yêu cầu giá trị này.
- `full_release_validation_run_attempt`: lần chạy dương chính xác được ghép với `full_release_validation_run_id`; bắt buộc bất cứ khi nào cung cấp id lần chạy để các lần chạy lại không thể thay đổi bằng chứng ủy quyền trong quá trình phát hành.
- `release_publish_run_id`: id lần chạy `OpenClaw Release Publish` đã được phê duyệt; bắt buộc khi quy trình này được quy trình cha đó điều phối (các lệnh gọi phát hành thực của tác tử bot)
- `plugin_npm_run_id`: id lần chạy `Plugin NPM Release` ở đúng HEAD đã thành công; bắt buộc đối với phát hành lõi `extended-stable` thực
- `npm_dist_tag`: thẻ đích npm cho đường dẫn phát hành; chấp nhận `alpha`, `beta`, `latest` hoặc `extended-stable` và mặc định là `beta`. Bản vá cuối cùng `33` trở lên phải sử dụng `extended-stable`; theo mặc định, `extended-stable` từ chối các bản vá trước đó và luôn từ chối các thẻ không phải cuối cùng.
- `bypass_extended_stable_guard`: boolean chỉ dành cho kiểm thử, mặc định `false`; với `npm_dist_tag=extended-stable`, bỏ qua điều kiện đủ của extended-stable hằng tháng trong khi vẫn giữ nguyên các kiểm tra danh tính bản phát hành, artifact, phê duyệt và đọc lại.

`Plugin NPM Release` chấp nhận `npm_dist_tag=default` cho hành vi bản phát hành
hiện có hoặc `npm_dist_tag=extended-stable` cho đường dẫn hằng tháng có bảo vệ. Tùy chọn
extended-stable yêu cầu `publish_scope=all-publishable`, đầu vào
`plugins` trống, một bản vá cuối cùng bằng hoặc cao hơn `33`, và nhánh chuẩn
`extended-stable/YYYY.M.33` tại đúng đầu nhánh. Tùy chọn này không bao giờ di chuyển
`latest` hoặc `beta` của Plugin. Các phiên bản gói mới nhận `extended-stable` một cách nguyên tử
thông qua phát hành tin cậy OIDC (`npm publish --tag extended-stable`); quy trình
nguồn này không sử dụng `npm dist-tag add` được xác thực bằng token. Các lần thử lại
bỏ qua những phiên bản chính xác đã có trong npm, sau đó đóng thất bại trừ khi việc
đọc lại đầy đủ xác nhận rằng mọi gói chính xác và thẻ `extended-stable` đã hội tụ.

`OpenClaw Release Publish` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ phát hành bắt buộc; phải tồn tại sẵn
- `preflight_run_id`: id lần chạy preflight `OpenClaw NPM Release` thành công; bắt buộc khi `publish_openclaw_npm=true` hoặc `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: id lần chạy `Full Release Validation` thành công; bắt buộc khi `publish_openclaw_npm=true` hoặc `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: lần thử dương chính xác được ghép với `full_release_validation_run_id`; bắt buộc bất cứ khi nào cung cấp id lần chạy
- `windows_node_tag`: thẻ phát hành `openclaw/openclaw-windows-node` chính xác, không phải bản phát hành trước; bắt buộc đối với phát hành OpenClaw ổn định
- `windows_node_installer_digests`: ánh xạ JSON gọn đã được ứng viên phê duyệt từ tên trình cài đặt Windows hiện tại sang các digest `sha256:` được ghim tương ứng; bắt buộc đối với phát hành OpenClaw ổn định
- `npm_telegram_run_id`: id lần chạy `NPM Telegram Beta E2E` thành công tùy chọn để đưa vào bằng chứng bản phát hành cuối cùng
- `npm_dist_tag`: thẻ đích npm cho gói OpenClaw, một trong `alpha`, `beta` hoặc `latest`
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ sử dụng `selected` cho công việc sửa chữa chỉ dành cho Plugin có trọng tâm với `publish_openclaw_npm=false`
- `plugins`: tên gói `@openclaw/*` được phân tách bằng dấu phẩy khi `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi sử dụng quy trình làm trình điều phối sửa chữa chỉ dành cho Plugin
- `release_profile`: hồ sơ phạm vi bao phủ bản phát hành dùng cho các bản tóm tắt bằng chứng bản phát hành; mặc định là `from-validation`, giá trị này đọc hồ sơ từ manifest xác thực, hoặc ghi đè bằng `beta`, `stable` hoặc `full`
- `wait_for_clawhub`: mặc định là `false` để tính khả dụng của npm không bị sidecar ClawHub chặn; chỉ đặt `true` khi việc hoàn tất quy trình phải bao gồm cả việc hoàn tất ClawHub

`OpenClaw Release Checks` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `ref`: nhánh, thẻ hoặc SHA commit đầy đủ cần xác thực. Các bước kiểm tra có sử dụng bí mật yêu cầu commit đã phân giải phải có thể truy cập được từ một nhánh OpenClaw hoặc thẻ phát hành.
- `run_release_soak`: bật chế độ kiểm tra live/E2E toàn diện, đường dẫn phát hành Docker và kiểm thử soak khả năng sống sót qua nâng cấp từ mọi phiên bản trước đó cho các bước kiểm tra bản phát hành beta. Chế độ này được bắt buộc bật bởi `release_profile=stable` và `release_profile=full`.

Quy tắc:

- Các phiên bản cuối cùng và phiên bản sửa lỗi thông thường thấp hơn bản vá `33` có thể phát hành lên `beta` hoặc `latest`. Các phiên bản cuối cùng từ bản vá `33` trở lên phải phát hành lên `extended-stable`, còn các phiên bản có hậu tố sửa lỗi tại ranh giới đó sẽ bị từ chối.
- Các thẻ tiền phát hành beta chỉ có thể phát hành lên `beta`; các thẻ tiền phát hành alpha chỉ có thể phát hành lên `alpha`
- Đối với `OpenClaw NPM Release`, chỉ cho phép đầu vào SHA commit đầy đủ khi `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ dùng để xác thực
- Đường dẫn phát hành thực tế phải sử dụng cùng `npm_dist_tag` đã dùng trong bước kiểm tra sơ bộ; workflow xác minh siêu dữ liệu đó trước khi tiếp tục phát hành

## Trình tự phát hành beta thông thường/bản ổn định mới nhất

Trình tự cũ này dành cho quy trình phát hành điều phối thông thường, đồng thời quản lý các plugin, GitHub Release, Windows và công việc trên các nền tảng khác. Đây không phải là đường dẫn ổn định mở rộng hàng tháng chỉ dành cho npm `.33+` được ghi ở đầu trang này.

Khi tạo một bản phát hành ổn định được điều phối thông thường:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ, có thể sử dụng SHA commit hiện tại đầy đủ của nhánh workflow để chạy thử workflow kiểm tra sơ bộ chỉ nhằm xác thực.
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc chỉ chọn `latest` khi chủ ý muốn phát hành trực tiếp bản ổn định.
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành hoặc SHA commit đầy đủ khi cần CI thông thường cùng phạm vi kiểm tra bộ nhớ đệm prompt live, Docker, QA Lab, Matrix và Telegram từ một workflow thủ công duy nhất. Nếu chủ ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy workflow `CI` thủ công trên tham chiếu phát hành.
4. Chọn chính xác thẻ phát hành `openclaw/openclaw-windows-node` không phải tiền phát hành có các trình cài đặt x64 và ARM64 đã ký cần được phân phối. Lưu thẻ đó dưới dạng `windows_node_tag`, đồng thời lưu ánh xạ mã băm đã xác thực của các trình cài đặt dưới dạng `windows_node_installer_digests`. Trình trợ giúp ứng viên phát hành ghi lại cả hai và đưa chúng vào lệnh phát hành được tạo.
5. Lưu `preflight_run_id`, `full_release_validation_run_id` thành công và `full_release_validation_run_attempt` chính xác.
6. Chạy `OpenClaw Release Publish` từ `main` đáng tin cậy với cùng `tag`, cùng `npm_dist_tag`, `windows_node_tag` đã chọn, `windows_node_installer_digests` đã lưu của nó, `preflight_run_id` đã lưu, `full_release_validation_run_id` và `full_release_validation_run_attempt`. Quy trình này phát hành các plugin đã được tách ra lên npm và ClawHub trước khi quảng bá gói npm OpenClaw.
7. Nếu bản phát hành được đưa lên `beta`, hãy sử dụng workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` để quảng bá phiên bản ổn định đó từ `beta` sang `latest`.
8. Nếu bản phát hành được chủ ý phát hành trực tiếp lên `latest` và `beta` phải theo ngay cùng bản dựng ổn định đó, hãy sử dụng chính workflow phát hành ấy để trỏ cả hai dist-tag vào phiên bản ổn định, hoặc để tác vụ đồng bộ tự khắc phục theo lịch chuyển `beta` sau đó.

Việc thay đổi dist-tag nằm trong kho lưu trữ sổ cái phát hành vì thao tác này vẫn yêu cầu `NPM_TOKEN`, trong khi kho lưu trữ mã nguồn duy trì cơ chế phát hành chỉ dùng OIDC. Điều đó giúp cả đường dẫn phát hành trực tiếp lẫn đường dẫn quảng bá theo luồng beta-trước đều được ghi lại trong tài liệu và hiển thị cho người vận hành.

Nếu một người bảo trì phải chuyển sang phương án dự phòng là xác thực npm cục bộ, chỉ chạy mọi lệnh CLI 1Password (`op`) bên trong một phiên tmux chuyên dụng. Không gọi trực tiếp `op` từ shell chính của tác nhân; việc giữ lệnh này trong tmux giúp có thể quan sát các lời nhắc, cảnh báo và quá trình xử lý OTP, đồng thời ngăn cảnh báo lặp lại trên máy chủ.

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

Người bảo trì sử dụng tài liệu phát hành riêng tư trong [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) làm sổ tay vận hành thực tế.

## Liên quan

- [Các kênh phát hành](/vi/install/development-channels)
