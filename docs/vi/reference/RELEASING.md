---
read_when:
    - Đang tìm định nghĩa các kênh phát hành công khai
    - Chạy quy trình xác thực bản phát hành hoặc nghiệm thu gói phần mềm
    - Tìm hiểu cách đặt tên phiên bản và chu kỳ phát hành
summary: Các luồng phát hành, danh sách kiểm tra dành cho người vận hành, các ô xác thực, cách đặt tên phiên bản và nhịp phát hành
title: Chính sách phát hành
x-i18n:
    generated_at: "2026-07-12T08:23:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw hiện cung cấp ba kênh cập nhật hướng tới người dùng:

- stable: kênh phát hành đã được quảng bá hiện có, vẫn phân giải qua npm `latest` cho đến khi mốc CLI/kênh riêng biệt được hoàn thành
- beta: các thẻ tiền phát hành được xuất bản lên npm `beta`
- dev: đầu nhánh luôn thay đổi của `main`

Ngoài ra, đơn vị vận hành phát hành có thể xuất bản gói lõi của tháng hoàn tất gần nhất lên npm `extended-stable`, bắt đầu từ bản vá `33`. Dòng bản cuối thông thường của tháng hiện tại tiếp tục ở npm `latest`; việc phân tách xuất bản phía đơn vị vận hành này tự nó không thay đổi cách phân giải kênh cập nhật của CLI.

Các bản dựng alpha Tideclaw là một luồng tiền phát hành nội bộ riêng biệt (dist-tag npm `alpha`), được trình bày trong [Đầu vào quy trình làm việc NPM](#npm-workflow-inputs) và [Hộp kiểm thử phát hành](#release-test-boxes).

## Đặt tên phiên bản

- Phiên bản phát hành extended-stable npm hằng tháng: `YYYY.M.PATCH`, với `PATCH >= 33`, thẻ git `vYYYY.M.PATCH`
- Phiên bản phát hành cuối hằng ngày/thông thường: `YYYY.M.PATCH`, với `PATCH < 33`, thẻ git `vYYYY.M.PATCH`
- Phiên bản phát hành sửa lỗi dự phòng thông thường: `YYYY.M.PATCH-N`, thẻ git `vYYYY.M.PATCH-N`
- Phiên bản tiền phát hành beta: `YYYY.M.PATCH-beta.N`, thẻ git `vYYYY.M.PATCH-beta.N`
- Phiên bản tiền phát hành alpha: `YYYY.M.PATCH-alpha.N`, thẻ git `vYYYY.M.PATCH-alpha.N`
- Không bao giờ thêm số 0 vào trước tháng hoặc bản vá
- `PATCH` là số thứ tự của chuỗi phát hành hằng tháng, không phải ngày trong lịch. Các bản phát hành cuối thông thường và beta thúc đẩy chuỗi hiện tại; các thẻ chỉ dành cho alpha không bao giờ sử dụng hoặc thúc đẩy số bản vá beta/thông thường, vì vậy hãy bỏ qua các thẻ cũ chỉ dành cho alpha có số bản vá cao hơn khi chọn chuỗi beta hoặc thông thường.
- Các bản dựng alpha/hằng đêm sử dụng chuỗi bản vá chưa phát hành tiếp theo và chỉ tăng `alpha.N` cho các lần dựng lặp lại. Sau khi bản vá đó có bản beta, các bản dựng alpha mới sẽ chuyển sang bản vá kế tiếp.
- Các phiên bản npm là bất biến: không bao giờ xóa, xuất bản lại hoặc tái sử dụng một thẻ đã xuất bản. Thay vào đó, hãy tạo số tiền phát hành tiếp theo hoặc bản vá hằng tháng tiếp theo.
- `latest` tiếp tục theo dòng npm thông thường/hằng ngày hiện tại; `beta` là đích cài đặt beta hiện tại
- `extended-stable` có nghĩa là gói npm của tháng liền trước được hỗ trợ, bắt đầu từ bản vá `33`; bản vá `34` trở đi là các bản phát hành bảo trì trên dòng hằng tháng đó
- Theo mặc định, các bản phát hành cuối thông thường và sửa lỗi thông thường được xuất bản lên npm `beta`; đơn vị vận hành phát hành có thể chỉ định rõ `latest`, hoặc quảng bá một bản dựng beta đã được kiểm duyệt sau đó
- Quy trình extended-stable hằng tháng chuyên biệt xuất bản gói npm lõi và mọi plugin chính thức có thể xuất bản lên npm ở cùng một phiên bản chính xác. Quy trình này không xuất bản plugin lên ClawHub, cũng không xuất bản tạo phẩm macOS hoặc Windows, GitHub Release, dist-tag của kho lưu trữ riêng tư, ảnh Docker, tạo phẩm di động hoặc bản tải xuống từ trang web.
- Mỗi bản phát hành cuối thông thường cung cấp đồng thời gói npm, ứng dụng macOS, APK Android độc lập đã ký và các trình cài đặt Windows Hub đã ký. Các bản phát hành beta thường xác thực và xuất bản đường dẫn npm/gói trước, còn việc dựng/ký/công chứng/quảng bá ứng dụng gốc được dành cho bản phát hành cuối thông thường, trừ khi có yêu cầu rõ ràng.

## Nhịp phát hành

- Các bản phát hành đi theo beta trước; stable chỉ theo sau sau khi bản beta mới nhất được xác thực
- Những người bảo trì thường tạo bản phát hành từ nhánh `release/YYYY.M.PATCH` được tạo từ `main` hiện tại, để việc xác thực và sửa lỗi phát hành không chặn hoạt động phát triển mới trên `main`
- Nếu một thẻ beta đã được đẩy lên hoặc xuất bản và cần sửa lỗi, những người bảo trì sẽ tạo thẻ `-beta.N` tiếp theo thay vì xóa hoặc tạo lại thẻ cũ
- Quy trình phát hành chi tiết, phê duyệt, thông tin xác thực và ghi chú khôi phục chỉ dành cho người bảo trì

## Xuất bản extended-stable hằng tháng chỉ dành cho npm

Đây là một ngoại lệ chuyên biệt đối với quy trình phát hành thông thường bên dưới. Với một tháng đã hoàn tất `YYYY.M`, hãy tạo `extended-stable/YYYY.M.33`; xuất bản `vYYYY.M.33` và các bản vá bảo trì sau đó từ cùng nhánh đó. Thẻ phát hành, đầu nhánh, bản thanh toán, phiên bản gói, bước kiểm tra trước npm và lần chạy Xác thực Phát hành Đầy đủ đều phải xác định cùng một commit. Nhánh `main` được bảo vệ phải đã chứa phiên bản cuối của một tháng theo lịch muộn hơn hoàn toàn với bản vá nhỏ hơn `33`; các bản vá bảo trì vẫn đủ điều kiện sau khi `main` tiến thêm hơn một tháng.

Trên chính xác nhánh extended-stable, hãy tăng gói gốc lên `YYYY.M.P`, chạy `pnpm release:prep` và xác minh mọi gói tiện ích mở rộng có thể xuất bản đều có cùng phiên bản. Commit và đẩy tất cả thay đổi đã tạo, tạo và đẩy thẻ bất biến `vYYYY.M.P` tại commit đó, đồng thời ghi lại SHA đầy đủ thu được. Các quy trình làm việc sử dụng cây đã chuẩn bị này; chúng không tăng hoặc đồng bộ hóa phiên bản thay bạn.

Chạy bước kiểm tra trước npm và Xác thực Phát hành Đầy đủ từ chính xác đầu nhánh đã chuẩn bị đó, sau đó lưu cả hai ID lần chạy và lần thử chạy Xác thực Phát hành Đầy đủ thành công:

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

`release_profile=stable` là hồ sơ độ sâu xác thực hiện có; nó tách biệt với dist-tag npm `extended-stable` và được chủ ý giữ nguyên.

Sau khi cả hai lần chạy thành công, hãy xuất bản mọi plugin chính thức có thể xuất bản lên npm từ chính xác cùng một đầu nhánh. Bản vá `P` phải từ `33` trở lên. Truyền SHA phát hành đầy đủ dưới dạng `ref`, chờ toàn bộ ma trận và quá trình đọc lại sổ đăng ký hoàn tất, sau đó lưu ID lần chạy Phát hành NPM Plugin thành công:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

Quy trình làm việc sử dụng danh mục gói `all-publishable` đã chuẩn bị thông thường, bao gồm cả các gói có mã nguồn không thay đổi. Quy trình xác minh từng gói chính xác và từng thẻ plugin `extended-stable` trước khi thành công. Nếu một lần chạy một phần thất bại, hãy chạy lại cùng lệnh: các gói đã xuất bản được tái sử dụng, các thẻ plugin bị thiếu hoặc cũ được đối chiếu trong môi trường phát hành npm, và lần đọc lại cuối cùng vẫn bao quát toàn bộ tập hợp gói.

Sau khi quy trình làm việc plugin thành công và môi trường phát hành npm đã sẵn sàng, hãy xuất bản chính xác tarball lõi từ bước kiểm tra trước. Việc xuất bản lõi xác minh rằng lần chạy plugin được tham chiếu có trạng thái `completed/success` trên cùng nhánh chuẩn và đúng SHA nguồn:

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

Đối với một nhánh rẽ hoặc lần diễn tập phi sản xuất chủ ý không thể đáp ứng chính sách tháng `.33` hoặc tháng của `main` được bảo vệ, hãy thêm `-f bypass_extended_stable_guard=true` vào cả hai lần điều phối kiểm tra trước và xuất bản npm. Giá trị mặc định là `false`. Việc bỏ qua chỉ được chấp nhận với `npm_dist_tag=extended-stable` và được ghi lại trong phần tóm tắt quy trình làm việc. Việc này không bỏ qua tham chiếu quy trình làm việc chuẩn `extended-stable/YYYY.M.33`, tính đồng nhất giữa đầu nhánh/thẻ/bản thanh toán, cú pháp thẻ cuối, tính đồng nhất giữa phiên bản gói/thẻ, danh tính lần chạy và tệp kê khai được tham chiếu, nguồn gốc tarball, phê duyệt môi trường, quá trình đọc lại sổ đăng ký hoặc bằng chứng sửa chữa bộ chọn.

Quy trình làm việc xuất bản xác minh danh tính của bước kiểm tra trước, lần xác thực và lần chạy plugin được tham chiếu, mã băm tarball đã chuẩn bị và các bộ chọn sổ đăng ký lõi. Hãy xác nhận độc lập kết quả sau khi quy trình làm việc thành công:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Cả hai lệnh phải trả về `YYYY.M.P`. Nếu việc xuất bản thành công nhưng quá trình đọc lại bộ chọn thất bại, đừng xuất bản lại phiên bản gói bất biến. Hãy sử dụng lệnh sửa chữa duy nhất `npm dist-tag add openclaw@YYYY.M.P extended-stable` được in trong phần tóm tắt luôn chạy của quy trình làm việc thất bại, sau đó lặp lại cả hai lần đọc lại độc lập. Khôi phục về bộ chọn trước đó là một quyết định riêng của đơn vị vận hành, không phải đường dẫn sửa chữa quá trình đọc lại.

Tài liệu hỗ trợ công khai ban đầu chỉ định Slack, Discord và Codex là các bề mặt plugin extended-stable được hỗ trợ. Danh sách đó là tuyên bố hỗ trợ, không phải danh sách cho phép trong mã phát hành: mọi plugin chính thức có thể xuất bản lên npm đều tuân theo cùng một đường dẫn xuất bản phiên bản chính xác.

Danh sách kiểm tra thông thường bên dưới tiếp tục quản lý beta, `latest`, GitHub Release, plugin, macOS, Windows và việc xuất bản trên các nền tảng khác. Không chạy các bước đó cho quy trình extended-stable chỉ dành cho npm này.

## Danh sách kiểm tra dành cho đơn vị vận hành phát hành thông thường

Danh sách kiểm tra này là hình thức công khai của luồng phát hành. Thông tin xác thực riêng tư, việc ký, công chứng, khôi phục dist-tag và chi tiết hoàn tác khẩn cấp vẫn nằm trong sổ tay vận hành phát hành chỉ dành cho người bảo trì.

1. Bắt đầu từ `main` hiện tại: kéo về bản mới nhất, xác nhận commit đích đã được đẩy lên và xác nhận CI của `main` đủ xanh để tạo nhánh từ đó.
2. Tạo phần đầu của `CHANGELOG.md` từ các PR đã hợp nhất và tất cả commit trực tiếp kể từ thẻ phát hành gần nhất có thể truy cập. Giữ các mục hướng đến người dùng, loại bỏ trùng lặp giữa các mục PR/commit trực tiếp bị chồng lấn, commit, đẩy lên, rồi rebase/kéo về thêm một lần nữa trước khi tạo nhánh. Khi một thẻ đã phát hành bị phân kỳ hoặc một lần chuyển tiếp sau đó liên kết lại các PR đã phát hành, hãy truyền rõ thẻ đó dưới dạng `--shipped-ref`; trình xác minh sử dụng các hàng PR rõ ràng từ hồ sơ đóng góp đầy đủ trong các phần được đánh số của ảnh chụp thẻ, bỏ qua `Unreleased`, đồng thời ghi lại chính xác danh sách và số lượng PR bị loại trừ.
3. Rà soát các bản ghi tương thích phát hành trong `src/plugins/compat/registry.ts` và `src/commands/doctor/shared/deprecation-compat.ts`. Chỉ loại bỏ khả năng tương thích đã hết hạn khi lộ trình nâng cấp vẫn được bao phủ, hoặc ghi lại lý do chủ ý tiếp tục duy trì nó.
4. Tạo `release/YYYY.M.PATCH` từ `main` hiện tại. Không thực hiện công việc phát hành thông thường trực tiếp trên `main`.
5. Tăng mọi phiên bản bắt buộc cho thẻ, sau đó chạy `pnpm release:prep`. Lệnh này lần lượt làm mới phiên bản Plugin, shrinkwrap npm, danh mục Plugin, lược đồ cấu hình cơ sở, siêu dữ liệu cấu hình kênh đi kèm, đường cơ sở tài liệu cấu hình, các phần xuất của SDK Plugin và đường cơ sở API của SDK Plugin. Commit mọi sai lệch được tạo ra trước khi gắn thẻ, sau đó chạy bước kiểm tra sơ bộ cục bộ có tính xác định: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` và `pnpm release:check`.
6. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ, SHA đầy đủ 40 ký tự của nhánh phát hành được phép dùng cho bước kiểm tra sơ bộ chỉ nhằm xác thực. Bước kiểm tra sơ bộ tạo bằng chứng phát hành phần phụ thuộc cho chính xác đồ thị phần phụ thuộc đang được checkout và lưu bằng chứng đó trong tạo tác kiểm tra sơ bộ npm. Lưu `preflight_run_id` thành công.
7. Khởi chạy tất cả kiểm thử trước phát hành bằng `Full Release Validation` cho nhánh phát hành, thẻ hoặc SHA commit đầy đủ. Đây là điểm vào thủ công duy nhất cho bốn nhóm kiểm thử phát hành lớn: Vitest, Docker, QA Lab và Package. Lưu `full_release_validation_run_id` và chính xác `full_release_validation_run_attempt`; cả hai đều là đầu vào bắt buộc cho `OpenClaw NPM Release` và `OpenClaw Release Publish`.
8. Nếu xác thực thất bại, sửa trên nhánh phát hành và chạy lại tệp, làn, tác vụ quy trình, hồ sơ gói, nhà cung cấp hoặc danh sách cho phép mô hình nhỏ nhất đã thất bại mà có thể chứng minh bản sửa. Chỉ chạy lại toàn bộ quy trình bao quát khi bề mặt thay đổi khiến bằng chứng trước đó không còn hợp lệ.
9. Đối với ứng viên beta đã gắn thẻ, chạy `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` từ nhánh `release/YYYY.M.PATCH` tương ứng. Đối với bản ổn định, cũng truyền bản phát hành nguồn Windows bắt buộc: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. Trình trợ giúp sử dụng `main` đáng tin cậy làm nguồn quy trình trong khi mỗi quy trình nhắm đến đúng thẻ. Nó tạo điểm kiểm soát cho danh tính bất biến của ứng viên/công cụ và các ID lần chạy đã điều phối trong `.artifacts/release-candidate/<tag>/release-candidate-state.json`; chạy lại cùng lệnh sẽ tiếp tục chính xác các lần chạy đó, còn bất kỳ sai lệch nào về ứng viên, công cụ, hồ sơ hoặc tùy chọn đều sẽ thất bại theo hướng đóng an toàn. Trước khi điều phối ma trận xác thực đầy đủ, trình trợ giúp kết xuất theo cách xác định chính xác nội dung bản phát hành GitHub của thẻ và từ chối khi thiếu tiêu đề phiên bản, nội dung vượt giới hạn mà không thể dùng dạng thu gọn chuẩn, hoặc nguồn gốc cơ sở/đích của hồ sơ đóng góp không thể truy cập từ thẻ. Nó cũng xác thực mọi siêu dữ liệu loại trừ đường cơ sở đã phát hành được chỉ định rõ ràng dựa trên các bản ghi thẻ tích lũy được tham chiếu. Sau đó, nó chạy các bước kiểm tra bản phát hành được tạo cục bộ, điều phối hoặc xác minh bằng chứng xác thực phát hành đầy đủ và kiểm tra sơ bộ npm, chạy bằng chứng cài mới/cập nhật Parallels dựa trên chính xác tarball đã chuẩn bị cùng bằng chứng gói Telegram, ghi lại kế hoạch npm và ClawHub của Plugin, rồi chỉ in chính xác lệnh `OpenClaw Release Publish` sau khi gói bằng chứng đã xanh.

   `OpenClaw Release Publish` điều phối song song các gói Plugin đã chọn hoặc tất cả gói có thể xuất bản lên npm và cùng tập hợp đó lên ClawHub, sau đó quảng bá tạo tác kiểm tra sơ bộ npm đã chuẩn bị của OpenClaw bằng dist-tag tương ứng khi việc xuất bản Plugin lên npm thành công. Checkout bản phát hành vẫn là gốc sản phẩm/dữ liệu, còn việc lập kế hoạch và xác minh cuối cùng được thực thi từ chính xác checkout nguồn quy trình đáng tin cậy để một commit phát hành cũ không thể âm thầm sử dụng công cụ phát hành lỗi thời. Trước khi bất kỳ tiến trình con xuất bản nào bắt đầu, quy trình kết xuất và lưu đệm chính xác nội dung bản phát hành GitHub. Khi phần `CHANGELOG.md` hoàn chỉnh tương ứng vừa với giới hạn 125.000 ký tự của GitHub và ngưỡng an toàn 125.000 byte tương ứng của trình kết xuất, trang sẽ chứa chính xác phần `## YYYY.M.PATCH` đó, bao gồm cả tiêu đề. Khi phần nguồn không vừa, trang giữ nguyên chính xác các ghi chú biên tập đã nhóm và thay thế hồ sơ đóng góp quá lớn bằng một liên kết ổn định đến hồ sơ đầy đủ trong `CHANGELOG.md` được ghim theo thẻ; không bao giờ xuất bản hồ sơ không đầy đủ hoặc gạch đầu dòng bị cắt cụt. Quy trình chọn nội dung đầy đủ hoặc thu gọn đó trước khi thêm `### Xác minh bản phát hành`; nếu phần bằng chứng cuối khiến nội dung vượt giới hạn, quy trình giữ nội dung chuẩn và dựa vào bằng chứng bất biến đính kèm. Các bản phát hành ổn định được xuất bản lên npm `latest` sẽ trở thành bản phát hành mới nhất trên GitHub, còn các bản phát hành bảo trì ổn định được giữ trên npm `beta` sẽ được tạo với GitHub `latest=false`. Quy trình cũng tải bằng chứng phần phụ thuộc từ bước kiểm tra sơ bộ, bản kê xác thực đầy đủ và bằng chứng xác minh sổ đăng ký sau xuất bản lên bản phát hành GitHub để phục vụ ứng phó sự cố sau phát hành. Nó in ngay các ID lần chạy con, tự động phê duyệt các cổng môi trường phát hành mà token quy trình được phép phê duyệt, tóm tắt các tác vụ con thất bại kèm phần cuối nhật ký, tạo trước trang bản phát hành GitHub dạng bản nháp và đồng thời quảng bá các tạo tác Windows và Android với việc xuất bản OpenClaw lên npm, hoàn tất trang phát hành và bằng chứng phần phụ thuộc sau khi các giai đoạn đó thành công, chờ ClawHub bất cứ khi nào OpenClaw đang được xuất bản lên npm, sau đó chạy trình xác minh beta từ `main` đáng tin cậy và tải lên bằng chứng sau xuất bản cho bản phát hành GitHub, gói npm, các gói Plugin npm đã chọn, các gói ClawHub đã chọn, ID lần chạy quy trình con và ID lần chạy NPM Telegram tùy chọn. Trình xác minh khởi tạo ClawHub yêu cầu chính xác đường dẫn và SHA của quy trình từ `main` đáng tin cậy, số lần thử của lần chạy tạo và lần chạy kết thúc, SHA phát hành, tập hợp gói được yêu cầu, bộ giá trị tạo tác gói bất biến và tạo tác đọc lại sổ đăng ký ở bước kết thúc; một lần chạy thành công kiểu cũ dựa trên tham chiếu phát hành sẽ không được chấp nhận.

   Sau đó, chạy bước chấp nhận gói sau xuất bản đối với gói `openclaw@YYYY.M.PATCH-beta.N` hoặc `openclaw@beta` đã xuất bản. Nếu một bản tiền phát hành đã được đẩy lên hoặc xuất bản cần sửa, hãy tạo số tiền phát hành tương ứng tiếp theo; tuyệt đối không xóa hoặc ghi lại bản cũ.

10. Đối với bản ổn định, chỉ tiếp tục sau khi bản beta hoặc ứng viên phát hành đã được kiểm duyệt có đủ bằng chứng xác thực bắt buộc. Việc xuất bản npm ổn định cũng phải đi qua `OpenClaw Release Publish`, tái sử dụng tạo tác kiểm tra sơ bộ thành công thông qua `preflight_run_id`. Mức sẵn sàng phát hành macOS ổn định cũng yêu cầu các tệp `.zip`, `.dmg`, `.dSYM.zip` đã đóng gói và `appcast.xml` đã cập nhật trên `main`; quy trình xuất bản macOS tự động xuất bản appcast đã ký lên `main` công khai sau khi xác minh các tạo tác phát hành, hoặc mở/cập nhật một PR appcast nếu tính năng bảo vệ nhánh chặn việc đẩy trực tiếp. Mức sẵn sàng của Windows Hub ổn định yêu cầu các tạo tác `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` và `OpenClawCompanion-SHA256SUMS.txt` đã ký trên bản phát hành GitHub của OpenClaw. Truyền chính xác thẻ phát hành `openclaw/openclaw-windows-node` đã ký dưới dạng `windows_node_tag` và ánh xạ mã băm trình cài đặt đã được ứng viên phê duyệt dưới dạng `windows_node_installer_digests`; `OpenClaw Release Publish` giữ bản nháp phát hành, điều phối `Windows Node Release` và xác minh cả ba tạo tác trước khi xuất bản.
11. Sau khi xuất bản, chạy trình xác minh npm sau xuất bản, kiểm thử E2E Telegram độc lập tùy chọn trên npm đã xuất bản khi cần bằng chứng kênh sau xuất bản, quảng bá dist-tag khi cần, xác minh trang bản phát hành GitHub đã tạo, thực hiện các bước thông báo phát hành, sau đó hoàn thành [Hoàn tất `main` ổn định](#stable-main-closeout) trước khi tuyên bố bản phát hành ổn định đã hoàn tất.

## Hoàn tất `main` ổn định

Việc xuất bản ổn định chưa hoàn tất cho đến khi `main` chứa trạng thái phát hành thực tế đã được phân phối.

1. Bắt đầu từ `main` mới nhất và sạch. Kiểm tra `release/YYYY.M.PATCH` so với nó và chuyển tiếp các bản sửa thực sự chưa có trên `main`. Không hợp nhất một cách mù quáng các bộ điều hợp tương thích, kiểm thử hoặc xác thực chỉ dành cho bản phát hành vào `main` mới hơn.
2. Đặt `main` thành phiên bản ổn định đã được phân phối, không phải một đợt phát hành tiếp theo mang tính suy đoán. Chạy `pnpm release:prep` sau khi thay đổi phiên bản gốc, sau đó chạy `pnpm deps:shrinkwrap:generate`.
3. Làm cho phần `## YYYY.M.PATCH` của `CHANGELOG.md` trên `main` khớp chính xác với nhánh phát hành đã gắn thẻ. Bao gồm bản cập nhật `appcast.xml` ổn định khi bản phát hành macOS đã xuất bản tệp này.
4. Không thêm `YYYY.M.PATCH+1`, phiên bản beta hoặc phần nhật ký thay đổi tương lai trống vào `main` cho đến khi người vận hành bắt đầu rõ ràng đợt phát hành đó.
5. Chạy `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` và `OPENCLAW_TESTBOX=1 pnpm check:changed`. Đẩy lên, sau đó xác minh `origin/main` chứa phiên bản và nhật ký thay đổi đã được phân phối trước khi tuyên bố bản phát hành ổn định đã hoàn tất.
6. Duy trì các biến kho lưu trữ `RELEASE_ROLLBACK_DRILL_ID` và `RELEASE_ROLLBACK_DRILL_DATE` luôn cập nhật sau mỗi lần diễn tập khôi phục riêng tư.

`OpenClaw Stable Main Closeout` bắt đầu từ lần đẩy lên `main` chứa phiên bản đã được phân phối, nhật ký thay đổi và appcast sau khi xuất bản ổn định. Nó đọc bằng chứng sau xuất bản bất biến để liên kết thẻ đã phân phối với các lần chạy Full Release Validation và Publish, sau đó xác minh trạng thái `main` ổn định, bản phát hành, thời gian theo dõi ổn định bắt buộc và bằng chứng hiệu năng có tính chặn. Nó đính kèm một bản kê hoàn tất bất biến và tổng kiểm vào bản phát hành GitHub. Trình kích hoạt tự động khi đẩy sẽ bỏ qua các bản phát hành kiểu cũ có trước bằng chứng sau xuất bản bất biến và không bao giờ coi việc bỏ qua đó là đã hoàn tất quy trình đóng phát hành.

Một quy trình hoàn tất đầy đủ yêu cầu cả hai tạo tác và tổng kiểm khớp nhau. Một bản kê chưa đầy đủ sẽ phát lại SHA `main` và lần diễn tập khôi phục đã ghi để tạo lại các byte giống hệt nhau, sau đó đính kèm tổng kiểm còn thiếu; một cặp không hợp lệ hoặc tổng kiểm không có bản kê vẫn tiếp tục chặn. Một lần chạy được kích hoạt khi đẩy mà không có các biến kho lưu trữ về diễn tập khôi phục sẽ bị bỏ qua mà không hoàn tất quy trình đóng phát hành; bản ghi diễn tập bị thiếu hoặc cũ hơn 90 ngày vẫn chặn quy trình hoàn tất thủ công dựa trên bằng chứng. Các lệnh khôi phục riêng tư vẫn nằm trong sổ tay chỉ dành cho người bảo trì. Chỉ dùng điều phối thủ công để sửa chữa hoặc phát lại quy trình hoàn tất bản ổn định dựa trên bằng chứng.

Một thẻ sửa lỗi dự phòng kiểu cũ chỉ có thể tái sử dụng bằng chứng gói cơ sở khi thẻ sửa lỗi phân giải về cùng commit nguồn với thẻ ổn định cơ sở. Bản phát hành Android của nó tái sử dụng APK đã xác minh của thẻ cơ sở và bổ sung nguồn gốc cho thẻ sửa lỗi. Một bản sửa lỗi có nguồn khác phải xuất bản và xác minh bằng chứng gói riêng, đồng thời sử dụng `versionCode` Android cao hơn.

## Kiểm tra sơ bộ bản phát hành

- Chạy `pnpm check:test-types` trước bước kiểm tra sơ bộ phát hành để TypeScript trong kiểm thử vẫn được bao quát bên ngoài cổng `pnpm check` cục bộ nhanh hơn.
- Chạy `pnpm check:architecture` trước bước kiểm tra sơ bộ phát hành để các kiểm tra rộng hơn về chu trình nhập và ranh giới kiến trúc đều đạt bên ngoài cổng cục bộ nhanh hơn.
- Chạy `pnpm build && pnpm ui:build` trước `pnpm release:check` để các tạo tác phát hành `dist/*` dự kiến và gói Control UI tồn tại cho bước xác thực gói.
- Chạy `pnpm release:prep` sau khi tăng phiên bản gốc và trước khi gắn thẻ. Lệnh này chạy mọi trình tạo phát hành tất định thường bị lệch sau thay đổi về phiên bản/cấu hình/API: phiên bản plugin, npm shrinkwrap, danh mục plugin, lược đồ cấu hình cơ sở, siêu dữ liệu cấu hình kênh đi kèm, đường cơ sở tài liệu cấu hình, các mục xuất của plugin SDK và đường cơ sở API của plugin SDK. `pnpm release:check` chạy lại các biện pháp bảo vệ đó ở chế độ kiểm tra (cộng thêm kiểm tra ngân sách bề mặt plugin SDK) và báo cáo mọi lỗi sai lệch đã tạo trong một lượt trước khi chạy các kiểm tra phát hành gói.
- Theo mặc định, quá trình đồng bộ phiên bản plugin cập nhật gói thời gian chạy `@openclaw/ai` có thể phát hành, phiên bản các gói plugin chính thức và các mức sàn `openclaw.compat.pluginApi` hiện có thành phiên bản phát hành OpenClaw. Hãy coi trường đó là mức sàn API của plugin SDK/thời gian chạy, không chỉ là bản sao của phiên bản gói: đối với các bản phát hành chỉ dành cho plugin được chủ đích duy trì khả năng tương thích với các máy chủ OpenClaw cũ hơn, hãy giữ mức sàn ở API máy chủ cũ nhất được hỗ trợ và ghi lại lựa chọn đó trong bằng chứng phát hành plugin.
- Chạy quy trình thủ công `Full Release Validation` trước khi phê duyệt phát hành để khởi động tất cả các hộp kiểm thử tiền phát hành từ một điểm vào duy nhất. Quy trình này chấp nhận một nhánh, thẻ hoặc SHA đầy đủ của commit, kích hoạt thủ công `CI` và kích hoạt `OpenClaw Release Checks` cho kiểm tra nhanh cài đặt, chấp nhận gói, kiểm tra gói đa hệ điều hành, tính tương đương của QA Lab, Matrix và các làn Telegram. Các lượt chạy ổn định và đầy đủ luôn bao gồm kiểm thử trực tiếp/E2E toàn diện và chạy ngâm đường dẫn phát hành Docker; `run_release_soak=true` được giữ lại cho một lượt chạy ngâm beta rõ ràng. Package Acceptance cung cấp kiểm thử E2E Telegram chuẩn cho gói trong quá trình xác thực ứng viên, tránh chạy đồng thời một trình thăm dò trực tiếp thứ hai.

  Cung cấp `release_package_spec` sau khi phát hành một bản beta để tái sử dụng gói npm đã phát hành trong các kiểm tra phát hành, Package Acceptance và kiểm thử E2E Telegram của gói mà không cần dựng lại tarball phát hành. Chỉ cung cấp `npm_telegram_package_spec` khi Telegram cần sử dụng một gói đã phát hành khác với phần còn lại của quá trình xác thực phát hành. Cung cấp `package_acceptance_package_spec` khi Package Acceptance cần sử dụng một gói đã phát hành khác với đặc tả gói phát hành. Cung cấp `evidence_package_spec` khi báo cáo bằng chứng phát hành cần chứng minh rằng quá trình xác thực khớp với một gói npm đã phát hành mà không buộc phải chạy kiểm thử E2E Telegram.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Chạy quy trình thủ công `Package Acceptance` khi bạn muốn có bằng chứng qua kênh phụ cho một ứng viên gói trong lúc công việc phát hành vẫn tiếp tục. Sử dụng `source=npm` cho `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành chính xác; `source=ref` để đóng gói một nhánh/thẻ/SHA `package_ref` đáng tin cậy bằng bộ khung `workflow_ref` hiện tại; `source=url` cho một tarball HTTPS công khai có SHA-256 bắt buộc và chính sách URL công khai nghiêm ngặt; `source=trusted-url` cho một chính sách nguồn đáng tin cậy có tên, sử dụng `trusted_source_id` và SHA-256 bắt buộc; hoặc `source=artifact` cho một tarball do một lượt chạy GitHub Actions khác tải lên.

  Quy trình phân giải ứng viên thành `package-under-test`, tái sử dụng bộ lập lịch phát hành E2E Docker với tarball đó và có thể chạy QA Telegram trên cùng tarball bằng `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier`. Khi các làn Docker được chọn bao gồm `published-upgrade-survivor`, tạo tác gói là ứng viên và `published_upgrade_survivor_baseline` chọn đường cơ sở đã phát hành. `update-restart-auth` sử dụng gói ứng viên làm cả CLI đã cài đặt lẫn gói đang kiểm thử để thực thi đường dẫn khởi động lại có quản lý của lệnh cập nhật ứng viên.

  Ví dụ:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Các hồ sơ thông dụng:
  - `smoke`: các làn cài đặt/kênh/tác nhân, mạng Gateway và tải lại cấu hình
  - `package`: các làn gói/cập nhật/khởi động lại/plugin dựa trực tiếp trên tạo tác, không có OpenWebUI hoặc ClawHub trực tiếp
  - `product`: hồ sơ gói cộng với các kênh MCP, dọn dẹp cron/tác nhân con, tìm kiếm web OpenAI và OpenWebUI
  - `full`: các phân đoạn đường dẫn phát hành Docker có OpenWebUI
  - `custom`: lựa chọn chính xác `docker_lanes` cho một lượt chạy lại tập trung

- Chạy trực tiếp quy trình thủ công `CI` khi bạn chỉ cần phạm vi bao quát CI thông thường, tất định cho ứng viên phát hành. Các lần kích hoạt CI thủ công bỏ qua việc giới hạn theo thay đổi và buộc chạy các phân đoạn Linux Node, phân đoạn plugin đi kèm, phân đoạn hợp đồng plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra nhanh tạo tác đã dựng, kiểm tra tài liệu, Python skills, Windows, macOS và các làn i18n của Control UI. Các lượt chạy CI thủ công độc lập chỉ chạy Android khi được kích hoạt với `include_android=true`; `Full Release Validation` truyền đầu vào đó cho CI con của nó.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Chạy `pnpm qa:otel:smoke` khi xác thực dữ liệu đo từ xa của bản phát hành. Lệnh này thực thi QA-lab thông qua một bộ nhận OTLP/HTTP cục bộ và xác minh việc xuất dấu vết, chỉ số và nhật ký, cùng với các thuộc tính dấu vết được giới hạn và việc che thông tin nội dung/mã định danh mà không cần Opik, Langfuse hoặc một bộ thu thập bên ngoài khác.
- Chạy `pnpm qa:otel:collector-smoke` khi xác thực khả năng tương thích với bộ thu thập. Lệnh này định tuyến cùng dữ liệu xuất OTLP của QA-lab qua một container Docker OpenTelemetry Collector thực trước các xác nhận của bộ nhận cục bộ.
- Chạy `pnpm qa:prometheus:smoke` khi xác thực việc thu thập Prometheus được bảo vệ. Lệnh này thực thi QA-lab, từ chối các yêu cầu thu thập chưa xác thực và xác minh các nhóm chỉ số quan trọng đối với phát hành không chứa nội dung lời nhắc, mã định danh thô, token xác thực và đường dẫn cục bộ.
- Chạy `pnpm qa:observability:smoke` để lần lượt chạy liên tiếp các làn kiểm tra nhanh OpenTelemetry và Prometheus từ bản sao mã nguồn.
- Chạy `pnpm release:check` trước mọi bản phát hành được gắn thẻ.
- Bước kiểm tra sơ bộ `OpenClaw NPM Release` tạo bằng chứng phát hành phụ thuộc trước khi đóng gói tarball npm. Cổng lỗ hổng tư vấn npm chặn phát hành. Báo cáo rủi ro manifest bắc cầu, bề mặt sở hữu/cài đặt phụ thuộc và thay đổi phụ thuộc chỉ là bằng chứng phát hành. Báo cáo thay đổi phụ thuộc so sánh ứng viên phát hành với thẻ phát hành có thể truy cập trước đó. Bước kiểm tra sơ bộ tải bằng chứng phụ thuộc lên dưới tên `openclaw-release-dependency-evidence-<tag>` và cũng nhúng bằng chứng đó trong `dependency-evidence/` bên trong tạo tác kiểm tra sơ bộ npm đã chuẩn bị. Đường dẫn phát hành thực tế tái sử dụng tạo tác kiểm tra sơ bộ đó, sau đó đính kèm cùng bằng chứng vào bản phát hành GitHub dưới tên `openclaw-<version>-dependency-evidence.zip`.
- Chạy `OpenClaw Release Publish` cho chuỗi phát hành có thay đổi sau khi thẻ đã tồn tại. Kích hoạt các bản phát hành beta và ổn định thông thường từ `main` đáng tin cậy; thẻ phát hành vẫn chọn commit đích chính xác và có thể trỏ vào `release/YYYY.M.PATCH`. Các bản phát hành alpha Tideclaw vẫn nằm trên nhánh alpha tương ứng. Truyền `preflight_run_id` thành công của OpenClaw npm, `full_release_validation_run_id` thành công và `full_release_validation_run_attempt` chính xác, đồng thời giữ phạm vi phát hành plugin mặc định là `all-publishable` trừ khi bạn chủ đích chạy một đợt sửa chữa tập trung. Quy trình tuần tự hóa việc phát hành plugin lên npm, phát hành plugin lên ClawHub và phát hành OpenClaw lên npm để gói lõi không được phát hành trước các plugin đã được tách ra bên ngoài; quá trình quảng bá Windows và Android chạy đồng thời với việc phát hành npm lõi trên trang bản phát hành nháp. Các lượt chạy lại phát hành có thể tiếp tục: một phiên bản npm lõi đã được phát hành sẽ bỏ qua bước kích hoạt lõi sau khi quy trình chứng minh tarball trên registry khớp với tạo tác kiểm tra sơ bộ của thẻ; việc quảng bá Windows/Android cũng được bỏ qua khi bản phát hành đã có hợp đồng tạo tác được xác minh, vì vậy lần thử lại chỉ thực hiện lại các giai đoạn thất bại. Các đợt sửa chữa tập trung chỉ dành cho plugin yêu cầu `plugin_publish_scope=selected` và danh sách plugin không rỗng. Các lượt chạy `all-publishable` chỉ dành cho plugin yêu cầu bằng chứng kiểm tra sơ bộ bất biến đầy đủ và Full Release Validation; bằng chứng một phần sẽ bị từ chối.
- Bản ổn định `OpenClaw Release Publish` yêu cầu một `windows_node_tag` chính xác sau khi bản phát hành `openclaw/openclaw-windows-node` tương ứng không phải bản tiền phát hành đã tồn tại, cùng với ánh xạ `windows_node_installer_digests` được ứng viên phê duyệt. Trước khi kích hoạt bất kỳ quy trình con phát hành nào, quy trình xác minh rằng bản phát hành nguồn đó đã được phát hành, không phải bản tiền phát hành, chứa các trình cài đặt x64/ARM64 bắt buộc và vẫn khớp với ánh xạ đã phê duyệt. Sau đó, quy trình kích hoạt `Windows Node Release` khi bản phát hành OpenClaw vẫn là bản nháp, giữ nguyên ánh xạ digest trình cài đặt đã ghim. Quy trình con tải các trình cài đặt Windows Hub đã ký từ chính xác thẻ đó, đối chiếu chúng với các digest đã ghim, xác minh chữ ký Authenticode của chúng sử dụng bên ký OpenClaw Foundation dự kiến trên một trình chạy Windows, ghi manifest SHA-256 và tải các trình cài đặt cùng manifest lên bản phát hành GitHub OpenClaw chuẩn, sau đó tải lại các tạo tác đã quảng bá và xác minh tư cách thành viên trong manifest cùng các hàm băm. Quy trình cha xác minh hợp đồng tạo tác x64, ARM64 và checksum hiện tại trước khi phát hành. Quá trình khôi phục trực tiếp từ chối các tên tạo tác `OpenClawCompanion-*` không mong đợi trước khi thay thế các tạo tác hợp đồng dự kiến bằng các byte nguồn đã ghim.

  Chỉ kích hoạt thủ công `Windows Node Release` để khôi phục và luôn truyền một thẻ chính xác, không bao giờ dùng `latest`, cùng với ánh xạ JSON `expected_installer_digests` rõ ràng từ bản phát hành nguồn đã được phê duyệt. Các liên kết tải xuống trên trang web nên trỏ đến URL tạo tác chính xác của bản phát hành OpenClaw ổn định hiện tại, hoặc `releases/latest/download/...` chỉ sau khi xác minh chuyển hướng mới nhất của GitHub trỏ đến cùng bản phát hành đó; không chỉ liên kết đến trang phát hành của kho lưu trữ ứng dụng đồng hành.

- Các bước kiểm tra bản phát hành hiện chạy trong một quy trình thủ công riêng: `OpenClaw Release Checks`. Quy trình này cũng chạy luồng đối chiếu bản mô phỏng của QA Lab cùng hồ sơ Matrix trực tiếp nhanh và luồng QA Telegram trước khi phê duyệt bản phát hành. Các luồng trực tiếp sử dụng môi trường `qa-live-shared`; Telegram cũng sử dụng các lượt thuê thông tin xác thực CI của Convex. Chạy quy trình thủ công `QA-Lab - All Lanes` với `matrix_profile=all` và `matrix_shards=true` khi bạn muốn kiểm kê đầy đủ song song về truyền tải Matrix, phương tiện và E2EE.
- Việc xác thực thời gian chạy khi cài đặt và nâng cấp trên nhiều hệ điều hành là một phần của `OpenClaw Release Checks` và `Full Release Validation` công khai; các quy trình này gọi trực tiếp quy trình có thể tái sử dụng `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Việc tách này là có chủ ý: giữ cho đường dẫn phát hành npm thực tế ngắn gọn, tất định và tập trung vào hiện vật, trong khi các bước kiểm tra trực tiếp chậm hơn nằm trong luồng riêng để không làm trì hoãn hoặc chặn việc phát hành.
- Các bước kiểm tra bản phát hành có chứa bí mật nên được kích hoạt thông qua `Full Release Validation` hoặc từ tham chiếu quy trình `main`/bản phát hành để logic quy trình và bí mật luôn được kiểm soát.
- `OpenClaw Release Checks` chấp nhận một nhánh, thẻ hoặc SHA đầy đủ của commit, miễn là commit đã phân giải có thể truy cập được từ một nhánh OpenClaw hoặc thẻ phát hành.
- Bước kiểm tra sơ bộ chỉ xác thực của `OpenClaw NPM Release` cũng chấp nhận SHA commit đầy đủ 40 ký tự hiện tại của nhánh quy trình mà không yêu cầu thẻ đã được đẩy lên. Đường dẫn SHA đó chỉ dành cho xác thực và không thể được nâng cấp thành một lần phát hành thực tế. Trong chế độ SHA, quy trình chỉ tổng hợp `v<package.json version>` để kiểm tra siêu dữ liệu gói; việc phát hành thực tế vẫn yêu cầu một thẻ phát hành thực.
- Cả hai quy trình đều giữ đường dẫn phát hành và nâng cấp thực tế trên các trình chạy do GitHub lưu trữ, trong khi đường dẫn xác thực không thay đổi dữ liệu có thể sử dụng các trình chạy Linux Blacksmith lớn hơn.
- Quy trình đó chạy `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` bằng cả hai bí mật quy trình `OPENAI_API_KEY` và `ANTHROPIC_API_KEY`.
- Bước kiểm tra sơ bộ bản phát hành npm không còn chờ luồng kiểm tra bản phát hành riêng biệt.
- Trước khi gắn thẻ cục bộ cho một ứng viên phát hành, hãy chạy `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. Trình trợ giúp chạy lần lượt các rào chắn phát hành nhanh, bước kiểm tra phát hành npm/ClawHub của Plugin, bản dựng, bản dựng giao diện người dùng và `release:openclaw:npm:check` theo thứ tự giúp phát hiện các lỗi phổ biến có thể chặn phê duyệt trước khi quy trình phát hành trên GitHub bắt đầu.
- Chạy `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (hoặc thẻ tiền phát hành/bản sửa tương ứng) trước khi phê duyệt.
- Sau khi phát hành lên npm, chạy `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (hoặc phiên bản beta/bản sửa tương ứng) để xác minh đường dẫn cài đặt từ sổ đăng ký đã phát hành trong một tiền tố tạm thời mới.
- Sau khi phát hành bản beta, chạy `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` để xác minh quy trình làm quen của gói đã cài đặt, thiết lập Telegram và E2E Telegram thực với gói npm đã phát hành bằng nhóm thông tin xác thực Telegram dùng chung theo cơ chế thuê. Các lần chạy riêng lẻ cục bộ của người bảo trì có thể bỏ qua các biến Convex và truyền trực tiếp ba thông tin xác thực môi trường `OPENCLAW_QA_TELEGRAM_*`.
- Để chạy toàn bộ bài kiểm tra nhanh sau phát hành beta từ máy của người bảo trì, hãy dùng `pnpm release:beta-smoke -- --beta betaN`. Trình trợ giúp chạy xác thực cập nhật npm/mục tiêu mới trên Parallels, kích hoạt `NPM Telegram Beta E2E`, thăm dò lần chạy quy trình chính xác, tải xuống hiện vật và in báo cáo Telegram.
- Người bảo trì có thể chạy cùng bước kiểm tra sau phát hành từ GitHub Actions thông qua quy trình thủ công `NPM Telegram Beta E2E`. Quy trình này được thiết kế chỉ chạy thủ công và không chạy sau mỗi lần hợp nhất.
- Tự động hóa phát hành dành cho người bảo trì sử dụng quy trình kiểm tra sơ bộ rồi nâng cấp:
  - Việc phát hành npm thực tế phải có `preflight_run_id` npm thành công.
  - Điều phối phát hành và kiểm tra sơ bộ cho bản beta thông thường và bản ổn định sử dụng `main` đáng tin cậy với đúng thẻ đích. Việc phát hành và kiểm tra sơ bộ bản alpha Tideclaw sử dụng nhánh alpha tương ứng.
  - Các bản phát hành npm ổn định mặc định dùng `beta`; việc phát hành npm ổn định có thể nhắm rõ ràng đến `latest` thông qua đầu vào của quy trình.
  - Việc thay đổi dist-tag npm dựa trên token nằm trong `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` vì `npm dist-tag add` vẫn cần `NPM_TOKEN`, trong khi kho nguồn chỉ duy trì phát hành bằng OIDC.
  - `macOS Release` công khai chỉ dùng để xác thực; khi một thẻ chỉ tồn tại trên nhánh phát hành nhưng quy trình được kích hoạt từ `main`, hãy đặt `public_release_branch=release/YYYY.M.PATCH`.
  - Việc phát hành macOS thực tế phải có `preflight_run_id` và `validate_run_id` macOS thành công.
  - Các đường dẫn phát hành thực tế nâng cấp những hiện vật đã chuẩn bị thay vì dựng lại chúng.
- Đối với các bản phát hành sửa lỗi ổn định như `YYYY.M.PATCH-N`, trình xác minh sau phát hành cũng kiểm tra cùng đường dẫn nâng cấp với tiền tố tạm thời từ `YYYY.M.PATCH` lên `YYYY.M.PATCH-N`, để các bản sửa phát hành không thể âm thầm khiến những bản cài đặt toàn cục cũ vẫn dùng nội dung bản ổn định cơ sở.
- Bước kiểm tra sơ bộ bản phát hành npm sẽ đóng khi lỗi, trừ khi tarball chứa cả `dist/control-ui/index.html` và nội dung không rỗng trong `dist/control-ui/assets/`, để chúng ta không phát hành lại một bảng điều khiển trình duyệt trống.
- Xác minh sau phát hành cũng kiểm tra xem các điểm vào Plugin và siêu dữ liệu gói đã phát hành có hiện diện trong bố cục sổ đăng ký đã cài đặt hay không. Bản phát hành thiếu nội dung thời gian chạy của Plugin sẽ không vượt qua trình xác minh sau phát hành và không thể được nâng cấp lên `latest`.
- `pnpm test:install:smoke` cũng áp dụng giới hạn `unpackedSize` của npm pack cho tarball cập nhật ứng viên, để E2E của trình cài đặt phát hiện tình trạng phình gói ngoài ý muốn trước đường dẫn phát hành.
- Nếu công việc phát hành có thay đổi việc lập kế hoạch CI, tệp kê khai thời gian của phần mở rộng hoặc ma trận kiểm thử phần mở rộng, hãy tái tạo và xem xét các đầu ra ma trận `plugin-prerelease-extension-shard` do bộ lập kế hoạch quản lý từ `.github/workflows/plugin-prerelease.yml` trước khi phê duyệt, để ghi chú phát hành không mô tả một bố cục CI đã lỗi thời.
- Mức độ sẵn sàng của bản phát hành macOS ổn định cũng bao gồm các bề mặt trình cập nhật: bản phát hành GitHub cuối cùng phải có các gói `.zip`, `.dmg` và `.dSYM.zip`; `appcast.xml` trên `main` phải trỏ đến tệp zip ổn định mới sau khi phát hành (quy trình phát hành macOS tự động commit tệp này hoặc mở một PR appcast khi việc đẩy trực tiếp bị chặn); ứng dụng đã đóng gói phải duy trì mã định danh gói không phải bản gỡ lỗi, URL nguồn cấp Sparkle không rỗng và `CFBundleVersion` bằng hoặc cao hơn mức sàn bản dựng Sparkle chính tắc cho phiên bản phát hành đó.

## Các hộp kiểm thử bản phát hành

`Full Release Validation` là cách người vận hành khởi chạy tất cả bài kiểm thử trước phát hành từ một điểm vào duy nhất. Để chứng minh một commit được ghim trên nhánh thay đổi nhanh, hãy dùng trình trợ giúp để mọi quy trình con chạy từ một nhánh tạm thời được cố định tại một SHA quy trình `main` đáng tin cậy, trong khi commit được yêu cầu vẫn là ứng viên đang được kiểm thử:

```bash
pnpm ci:full-release --sha <full-sha>
```

Trình trợ giúp tìm nạp `origin/main` hiện tại, đẩy `release-ci/<workflow-sha>-...` tại commit quy trình đáng tin cậy đó, kích hoạt `Full Release Validation` từ nhánh tạm thời với `ref=<target-sha>`, tái sử dụng bằng chứng chính xác nghiêm ngặt cho mục tiêu khi có sẵn, xác minh `headSha` của mọi quy trình con khớp với SHA quy trình cha đã ghim, rồi xóa nhánh tạm thời. Truyền `-f reuse_evidence=false` để buộc chạy mới hoặc `--workflow-sha <trusted-main-sha>` để ghim một commit cũ hơn vẫn có thể truy cập được từ `origin/main` hiện tại. Bản thân quy trình không bao giờ ghi các tham chiếu kho lưu trữ. Cách này duy trì khả năng sử dụng công cụ phát hành chỉ dành cho `main` mà không thêm commit công cụ vào ứng viên, đồng thời tránh vô tình dùng một lần chạy con từ `main` mới hơn để làm bằng chứng.

Để xác thực nhánh hoặc thẻ phát hành, hãy chạy từ tham chiếu quy trình `main` đáng tin cậy và truyền nhánh hoặc thẻ phát hành làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

Quy trình phân giải tham chiếu đích, kích hoạt thủ công `CI` với `target_ref=<release-ref>`, rồi kích hoạt `OpenClaw Release Checks`. `OpenClaw Release Checks` mở rộng thành bài kiểm tra nhanh cài đặt, kiểm tra phát hành đa hệ điều hành, phạm vi đường dẫn phát hành Docker trực tiếp/E2E khi chế độ chạy ngâm được bật, Chấp nhận gói với E2E gói Telegram chính tắc, đối chiếu QA Lab, Matrix trực tiếp và Telegram trực tiếp. Một lần chạy đầy đủ/tất cả chỉ được chấp nhận khi phần tóm tắt `Full Release Validation` cho thấy `normal_ci`, `plugin_prerelease` và `release_checks` đều thành công, trừ khi một lần chạy lại có trọng tâm cố ý bỏ qua quy trình con `Plugin Prerelease` riêng biệt. Chỉ dùng quy trình con độc lập `npm-telegram` cho lần chạy lại tập trung vào gói đã phát hành với `release_package_spec` hoặc `npm_telegram_package_spec`. Phần tóm tắt cuối cùng của trình xác minh bao gồm các bảng công việc chậm nhất cho mỗi lần chạy con, để người quản lý phát hành có thể thấy đường găng hiện tại mà không cần tải nhật ký xuống.

Quy trình con về hiệu năng sản phẩm chỉ tạo hiện vật trong đường dẫn phát hành này. Quy trình
bao trùm kích hoạt nó với `publish_reports=false`, và việc xác thực bị từ chối
trừ khi rào chắn chỉ tạo hiện vật chứng minh rằng trình phát hành báo cáo Clawgrit vẫn
bị bỏ qua.

Xem [Xác thực bản phát hành đầy đủ](/vi/reference/full-release-validation) để biết ma trận giai đoạn hoàn chỉnh, tên công việc quy trình chính xác, sự khác biệt giữa hồ sơ ổn định và đầy đủ, hiện vật và các cách chạy lại có trọng tâm.

Các quy trình con được kích hoạt từ tham chiếu đáng tin cậy đang chạy `Full Release Validation`, thông thường là `--ref main`, ngay cả khi `ref` đích trỏ đến một nhánh hoặc thẻ phát hành cũ hơn. Mọi lần chạy con phải dùng chính xác SHA của quy trình cha; nếu `main` thay đổi trước khi một lần kích hoạt quy trình con được phân giải, quy trình bao trùm sẽ đóng khi lỗi. Không có đầu vào tham chiếu quy trình `Full Release Validation` riêng biệt; hãy chọn bộ khung đáng tin cậy bằng cách chọn tham chiếu chạy quy trình. Không dùng `--ref main -f ref=<sha>` để chứng minh commit chính xác trên `main` đang thay đổi; SHA commit thô không thể là tham chiếu kích hoạt quy trình, vì vậy hãy dùng `pnpm ci:full-release --sha <target-sha>` để tạo một nhánh tạm thời tại `origin/main` đáng tin cậy trong khi vẫn giữ SHA đích làm đầu vào ứng viên.

Dùng `release_profile` để chọn phạm vi trực tiếp/nhà cung cấp:

- `minimum`: đường dẫn OpenAI/lõi trực tiếp và Docker quan trọng đối với bản phát hành, nhanh nhất
- `stable`: mức tối thiểu cộng thêm phạm vi nhà cung cấp/phần phụ trợ ổn định để phê duyệt bản phát hành
- `full`: mức ổn định cộng thêm phạm vi tư vấn rộng về nhà cung cấp/phương tiện

Xác thực ổn định và đầy đủ luôn chạy đợt quét toàn diện có giới hạn đối với trực tiếp/E2E, đường dẫn phát hành Docker và khả năng sống sót sau nâng cấp của các gói đã phát hành trước khi nâng cấp. Dùng `run_release_soak=true` để yêu cầu cùng đợt quét đó cho bản beta. Đợt quét này bao gồm bốn gói ổn định mới nhất cùng các đường cơ sở được ghim `2026.4.23` và `2026.5.2`, cộng thêm phạm vi cũ hơn `2026.4.15`; các đường cơ sở trùng lặp được loại bỏ và mỗi đường cơ sở được phân mảnh thành công việc trình chạy Docker riêng.

`OpenClaw Release Checks` sử dụng tham chiếu quy trình đáng tin cậy để phân giải tham chiếu đích một lần thành `release-package-under-test` và tái sử dụng hiện vật đó trong các bước kiểm tra đa hệ điều hành, Chấp nhận gói và Docker theo đường dẫn phát hành khi chế độ chạy ngâm hoạt động. Điều này giữ cho tất cả các hộp liên quan đến gói sử dụng cùng một tập byte và tránh dựng gói nhiều lần. Sau khi một bản beta đã có trên npm, hãy đặt `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` để các bước kiểm tra bản phát hành tải gói đã phát hành xuống một lần, trích xuất SHA nguồn bản dựng từ `dist/build-info.json`, rồi tái sử dụng hiện vật đó cho các luồng đa hệ điều hành, Chấp nhận gói, Docker theo đường dẫn phát hành và Telegram theo gói.

Bài kiểm tra nhanh cài đặt OpenAI đa hệ điều hành sử dụng `OPENCLAW_CROSS_OS_OPENAI_MODEL` khi biến kho lưu trữ/tổ chức được đặt; nếu không, nó dùng `openai/gpt-5.6-luna`, vì luồng này chứng minh việc cài đặt gói, quy trình làm quen, khởi động Gateway và một lượt tác nhân trực tiếp thay vì đánh giá hiệu năng của mô hình mạnh nhất. Ma trận nhà cung cấp trực tiếp rộng hơn vẫn là nơi dành cho phạm vi theo từng mô hình.

Dùng các biến thể sau tùy theo giai đoạn phát hành:

```bash
# Xác thực một nhánh ứng viên phát hành chưa được công bố.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Xác thực chính xác một commit đã được đẩy lên.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Sau khi công bố bản beta, thêm E2E Telegram cho gói đã công bố.
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

Không sử dụng luồng tổng hợp đầy đủ cho lần chạy lại đầu tiên sau một bản sửa lỗi tập trung. Nếu một hộp thất bại, hãy dùng quy trình công việc con, tác vụ, làn Docker, hồ sơ gói, nhà cung cấp mô hình hoặc làn QA đã thất bại cho lần kiểm chứng tiếp theo. Chỉ chạy lại luồng tổng hợp đầy đủ khi bản sửa lỗi đã thay đổi cơ chế điều phối phát hành dùng chung hoặc khiến bằng chứng trước đó từ tất cả các hộp trở nên lỗi thời. Trình xác minh cuối cùng của luồng tổng hợp sẽ kiểm tra lại các mã lần chạy quy trình công việc con đã ghi nhận, vì vậy sau khi một quy trình công việc con được chạy lại thành công, chỉ chạy lại tác vụ cha `Verify full validation` đã thất bại.

`rerun_group=all` chỉ có thể tái sử dụng một lần chạy luồng tổng hợp đã thành công trước đó khi lần chạy đó đã xác thực chính xác cùng SHA đích, hồ sơ phát hành, thiết lập kiểm thử kéo dài có hiệu lực và các đầu vào xác thực. Đây là cơ chế khôi phục có giới hạn để chạy lại cùng một ứng viên, không phải tái sử dụng bằng chứng giữa các SHA. Đối với ứng viên đã thay đổi, kể cả commit chỉ thay đổi nhật ký thay đổi hoặc phiên bản, hãy chạy lại mọi cổng gói, tạo phẩm, cài đặt, Docker hoặc nhà cung cấp bị ảnh hưởng bởi các đường dẫn đã thay đổi hoặc hàm băm tạo phẩm. Các lần chạy luồng tổng hợp mới hơn cho cùng tham chiếu `release/*` và nhóm chạy lại sẽ tự động thay thế các lần đang chạy. Truyền `reuse_evidence=false` để buộc chạy mới toàn bộ.

Để khôi phục có giới hạn, hãy truyền `rerun_group` cho luồng tổng hợp. `all` là lần chạy ứng viên phát hành thực tế, `ci` chỉ chạy quy trình công việc con CI thông thường, `plugin-prerelease` chỉ chạy quy trình công việc con Plugin dành riêng cho phát hành, `release-checks` chạy mọi hộp phát hành, còn các nhóm phát hành hẹp hơn là `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` và `npm-telegram`. Các lần chạy lại `npm-telegram` tập trung yêu cầu `release_package_spec` hoặc `npm_telegram_package_spec`; các lần chạy đầy đủ/tất cả sử dụng E2E Telegram chuẩn của gói bên trong Package Acceptance. Các lần chạy lại đa hệ điều hành tập trung có thể thêm `cross_os_suite_filter=windows/packaged-upgrade` hoặc một bộ lọc hệ điều hành/bộ kiểm thử khác. Các lỗi kiểm tra phát hành QA sẽ chặn quá trình xác thực phát hành thông thường, bao gồm cả độ lệch công cụ động bắt buộc của OpenClaw trong cấp tiêu chuẩn. Các lần chạy alpha Tideclaw vẫn có thể coi các làn kiểm tra phát hành không liên quan đến an toàn gói là mang tính tư vấn. Với `release_profile=beta`, các bộ kiểm thử nhà cung cấp trực tiếp trong `Run repo/live E2E validation` mang tính tư vấn (cảnh báo, không chặn); các hồ sơ ổn định và đầy đủ vẫn để chúng ở chế độ chặn. Khi `live_suite_filter` yêu cầu rõ ràng một làn QA trực tiếp có cổng như Discord, WhatsApp hoặc Slack, biến kho lưu trữ `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` tương ứng phải được bật; nếu không, bước thu thập đầu vào sẽ thất bại thay vì âm thầm bỏ qua làn đó.

### Vitest

Hộp Vitest là quy trình công việc con `CI` thủ công. CI thủ công cố ý bỏ qua phạm vi theo thay đổi và buộc chạy đồ thị kiểm thử thông thường cho ứng viên phát hành: các phân đoạn Linux Node, các phân đoạn Plugin đi kèm, các phân đoạn hợp đồng Plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra nhanh tạo phẩm đã dựng, kiểm tra tài liệu, Skills Python, Windows, macOS và i18n của Control UI. Android được bao gồm khi `Full Release Validation` chạy hộp này vì luồng tổng hợp truyền `include_android=true`; CI thủ công độc lập yêu cầu `include_android=true` để bao phủ Android.

Dùng hộp này để trả lời “cây mã nguồn có vượt qua toàn bộ bộ kiểm thử thông thường không?”. Nó không giống với xác thực sản phẩm theo đường dẫn phát hành. Bằng chứng cần giữ lại:

- Bản tóm tắt `Full Release Validation` hiển thị URL lần chạy `CI` đã được kích hoạt
- Lần chạy `CI` thành công trên chính xác SHA đích
- Tên các phân đoạn thất bại hoặc chạy chậm từ các tác vụ CI khi điều tra hồi quy
- Các tạo phẩm thời gian Vitest như `.artifacts/vitest-shard-timings.json` khi một lần chạy cần phân tích hiệu năng

Chỉ chạy CI thủ công trực tiếp khi bản phát hành cần CI thông thường có tính xác định nhưng không cần các hộp Docker, QA Lab, trực tiếp, đa hệ điều hành hoặc gói. Dùng lệnh đầu tiên cho CI trực tiếp không có Android. Thêm `include_android=true` khi CI trực tiếp cho ứng viên phát hành phải bao phủ Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

Hộp Docker nằm trong `OpenClaw Release Checks` thông qua `openclaw-live-and-e2e-checks-reusable.yml`, cùng với quy trình công việc `install-smoke` ở chế độ phát hành. Hộp này xác thực ứng viên phát hành qua các môi trường Docker đã đóng gói thay vì chỉ qua các kiểm thử cấp mã nguồn.

Phạm vi Docker cho bản phát hành bao gồm:

- kiểm tra nhanh cài đặt đầy đủ, có bật kiểm tra nhanh cài đặt toàn cục Bun chậm
- chuẩn bị/tái sử dụng ảnh kiểm tra nhanh từ Dockerfile gốc theo SHA đích, với các tác vụ kiểm tra nhanh QR, root/gateway và trình cài đặt/Bun chạy dưới dạng các phân đoạn install-smoke riêng biệt
- các làn E2E của kho lưu trữ
- các phần Docker theo đường dẫn phát hành: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, từ `plugins-runtime-install-a` đến `plugins-runtime-install-h` và `openwebui`
- phạm vi OpenWebUI trên trình chạy có đĩa lớn chuyên dụng khi được yêu cầu
- các làn cài đặt/gỡ cài đặt Plugin đi kèm đã chia nhỏ, từ `bundled-plugin-install-uninstall-0` đến `bundled-plugin-install-uninstall-23`
- các bộ kiểm thử nhà cung cấp trực tiếp/E2E và phạm vi mô hình trực tiếp trong Docker khi kiểm tra phát hành bao gồm các bộ kiểm thử trực tiếp

Hãy sử dụng các tạo phẩm Docker trước khi chạy lại. Bộ lập lịch theo đường dẫn phát hành tải lên `.artifacts/docker-tests/` gồm nhật ký làn, `summary.json`, `failures.json`, thời gian các giai đoạn, JSON kế hoạch bộ lập lịch và các lệnh chạy lại. Để khôi phục tập trung, hãy dùng `docker_lanes=<lane[,lane]>` trên quy trình công việc trực tiếp/E2E có thể tái sử dụng thay vì chạy lại tất cả các phần phát hành. Các lệnh chạy lại được tạo sẽ bao gồm `package_artifact_run_id` trước đó và đầu vào ảnh Docker đã chuẩn bị khi có sẵn, nhờ đó một làn thất bại có thể tái sử dụng cùng tarball và các ảnh GHCR.

### QA Lab

Hộp QA Lab cũng là một phần của `OpenClaw Release Checks`. Đây là cổng phát hành về hành vi tác tử và cấp kênh, tách biệt với Vitest và cơ chế gói Docker.

Phạm vi QA Lab cho bản phát hành bao gồm:

- làn tương đồng mô phỏng so sánh làn ứng viên OpenAI với đường cơ sở `anthropic/claude-opus-4-8` bằng gói tương đồng tác tử
- hồ sơ QA Matrix trực tiếp nhanh sử dụng môi trường `qa-live-shared`
- làn QA Telegram trực tiếp sử dụng hợp đồng thuê thông tin xác thực CI từ Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` hoặc `pnpm qa:observability:smoke` khi phép đo từ xa của bản phát hành cần bằng chứng cục bộ rõ ràng

Dùng hộp này để trả lời “bản phát hành có hoạt động đúng trong các kịch bản QA và luồng kênh trực tiếp không?”. Hãy giữ lại URL tạo phẩm cho các làn tương đồng, Matrix và Telegram khi phê duyệt bản phát hành. Phạm vi Matrix đầy đủ vẫn có sẵn dưới dạng một lần chạy QA-Lab phân đoạn thủ công thay vì làn trọng yếu mặc định của bản phát hành.

### Gói

Hộp Gói là cổng sản phẩm có thể cài đặt. Hộp này được hỗ trợ bởi `Package Acceptance` và trình phân giải `scripts/resolve-openclaw-package-candidate.mjs`. Trình phân giải chuẩn hóa một ứng viên thành tarball `package-under-test` được Docker E2E sử dụng, xác thực danh mục gói, ghi lại phiên bản gói và SHA-256, đồng thời giữ tham chiếu bộ khung quy trình công việc tách biệt với tham chiếu nguồn gói.

Các nguồn ứng viên được hỗ trợ:

- `source=npm`: `openclaw@beta`, `openclaw@latest` hoặc một phiên bản phát hành OpenClaw chính xác
- `source=ref`: đóng gói một nhánh, thẻ hoặc SHA commit đầy đủ đáng tin cậy từ `package_ref` bằng bộ khung `workflow_ref` đã chọn
- `source=url`: tải xuống tệp `.tgz` HTTPS công khai với `package_sha256` bắt buộc; thông tin xác thực trong URL, cổng HTTPS không mặc định, tên máy chủ hoặc địa chỉ đã phân giải thuộc loại riêng tư/nội bộ/dùng cho mục đích đặc biệt và chuyển hướng không an toàn đều bị từ chối
- `source=trusted-url`: tải xuống tệp `.tgz` HTTPS với `package_sha256` và `trusted_source_id` bắt buộc từ một chính sách được đặt tên trong `.github/package-trusted-sources.json`; dùng tùy chọn này cho các bản sao doanh nghiệp do người bảo trì sở hữu hoặc kho gói riêng tư thay vì thêm cơ chế bỏ qua mạng riêng ở cấp đầu vào cho `source=url`
- `source=artifact`: tái sử dụng tệp `.tgz` do một lần chạy GitHub Actions khác tải lên

`OpenClaw Release Checks` chạy Package Acceptance với `source=artifact`, tạo phẩm gói phát hành đã chuẩn bị, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance duy trì kiểm tra di chuyển, cập nhật, nâng cấp VPS do root quản lý, khởi động lại sau cập nhật với xác thực đã cấu hình, cài đặt Skills ClawHub trực tiếp, dọn dẹp phần phụ thuộc Plugin lỗi thời, bộ dữ liệu cố định Plugin ngoại tuyến, cập nhật Plugin, gia cố chống thoát ràng buộc lệnh Plugin và QA gói Telegram trên cùng tarball đã phân giải. Các kiểm tra phát hành chặn sử dụng đường cơ sở mặc định là gói mới nhất đã công bố; hồ sơ beta với `run_release_soak=true`, `release_profile=stable` hoặc `release_profile=full` mở rộng lượt quét đối tượng sống sót sau nâng cấp đã công bố sang `last-stable-4` cùng các đường cơ sở cố định `2026.4.23`, `2026.5.2` và `2026.4.15` với các kịch bản `reported-issues`. Dùng Package Acceptance với `source=npm` cho ứng viên đã được phát hành, `source=ref` cho tarball npm cục bộ dựa trên SHA trước khi công bố, `source=trusted-url` cho bản sao doanh nghiệp/riêng tư do người bảo trì sở hữu hoặc `source=artifact` cho tarball đã chuẩn bị do một lần chạy GitHub Actions khác tải lên.

Đây là phương án thay thế gốc GitHub cho phần lớn phạm vi gói/cập nhật trước đây cần Parallels. Các kiểm tra phát hành đa hệ điều hành vẫn quan trọng đối với quy trình làm quen, trình cài đặt và hành vi nền tảng đặc thù theo hệ điều hành, nhưng xác thực sản phẩm gói/cập nhật nên ưu tiên Package Acceptance.

Danh sách kiểm tra chuẩn cho xác thực cập nhật và Plugin là [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins). Hãy dùng danh sách này khi quyết định làn cục bộ, Docker, Package Acceptance hoặc kiểm tra phát hành nào chứng minh được thay đổi về cài đặt/cập nhật Plugin, dọn dẹp bằng doctor hoặc di chuyển gói đã công bố. Quá trình di chuyển cập nhật đã công bố toàn diện từ mọi gói ổn định `2026.4.23+` là một quy trình công việc `Update Migration` thủ công riêng biệt, không thuộc Full Release CI.

Việc nới lỏng Package Acceptance cũ được giới hạn thời gian có chủ đích. Các gói đến hết `2026.4.25` có thể dùng đường dẫn tương thích cho các khoảng trống siêu dữ liệu đã được công bố lên npm: các mục danh mục QA riêng tư bị thiếu trong tarball, thiếu `gateway install --wrapper`, thiếu tệp bản vá trong bộ dữ liệu cố định git lấy từ tarball, thiếu `update.channel` được lưu bền vững, vị trí bản ghi cài đặt Plugin cũ, thiếu khả năng lưu bền vững bản ghi cài đặt từ marketplace và di chuyển siêu dữ liệu cấu hình trong `plugins update`. Gói `2026.4.26` đã công bố có thể cảnh báo về các tệp dấu siêu dữ liệu bản dựng cục bộ đã được phát hành. Các gói mới hơn phải đáp ứng các hợp đồng gói hiện đại; những khoảng trống tương tự sẽ làm xác thực phát hành thất bại.

Dùng các hồ sơ Package Acceptance rộng hơn khi câu hỏi phát hành liên quan đến một gói thực sự có thể cài đặt:

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

- `smoke`: các luồng cài đặt gói/kênh/agent nhanh, mạng Gateway và tải lại cấu hình
- `package`: các hợp đồng cài đặt/cập nhật/khởi động lại/gói Plugin cùng bằng chứng cài đặt trực tiếp skill ClawHub; đây là mặc định của kiểm tra bản phát hành
- `product`: `package` cộng với các kênh MCP, dọn dẹp cron/agent con, tìm kiếm web OpenAI và OpenWebUI
- `full`: các phần của đường dẫn phát hành Docker với OpenWebUI
- `custom`: danh sách `docker_lanes` chính xác để chạy lại có trọng tâm

Để xác minh Telegram cho gói ứng viên, hãy bật `telegram_mode=mock-openai` hoặc `telegram_mode=live-frontier` trong quy trình Chấp nhận Gói. Quy trình truyền tarball `package-under-test` đã phân giải vào luồng Telegram; quy trình Telegram độc lập vẫn chấp nhận đặc tả npm đã phát hành để kiểm tra sau khi phát hành.

## Tự động hóa phát hành bản phát hành thông thường

Đối với việc phát hành beta, `latest`, Plugin, GitHub Release và nền tảng,
`OpenClaw Release Publish` là điểm vào có thay đổi trạng thái thông thường. Đường dẫn
ổn định mở rộng hằng tháng `.33+` chỉ dành cho npm không sử dụng bộ điều phối này. Quy trình
thông thường điều phối các quy trình nhà phát hành đáng tin cậy theo thứ tự mà
bản phát hành yêu cầu:

1. Lấy mã nguồn của thẻ bản phát hành và phân giải SHA commit của thẻ.
2. Xác minh có thể truy cập thẻ từ `main` hoặc `release/*` (hoặc một nhánh alpha Tideclaw đối với bản phát hành trước alpha).
3. Chạy `pnpm plugins:sync:check`.
4. Kích hoạt `Plugin NPM Release` với `publish_scope=all-publishable` và `ref=<release-sha>`.
5. Kích hoạt `Plugin ClawHub Release` với cùng phạm vi và SHA.
6. Kích hoạt `OpenClaw NPM Release` với thẻ bản phát hành, dist-tag npm và `preflight_run_id` đã lưu sau khi xác minh `full_release_validation_run_id` đã lưu và đúng lần chạy.
7. Đối với bản phát hành ổn định, tạo hoặc cập nhật bản phát hành GitHub dưới dạng bản nháp, kích hoạt `Windows Node Release` với `windows_node_tag` rõ ràng và `windows_node_installer_digests` đã được ứng viên phê duyệt, đồng thời xác minh các tài nguyên trình cài đặt/tổng kiểm chuẩn Windows chính thức. Đồng thời kích hoạt `Android Release` để xây dựng APK đã ký cho đúng thẻ cùng tổng kiểm và nguồn gốc. Xác minh cả hai hợp đồng tài nguyên gốc trước khi phát hành bản nháp.

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

Việc thăng hạng bản ổn định trực tiếp lên `latest` phải được chỉ định rõ ràng:

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

Chỉ sử dụng các quy trình cấp thấp hơn `Plugin NPM Release` và `Plugin ClawHub Release` cho công việc sửa chữa hoặc phát hành lại có trọng tâm. `OpenClaw Release Publish` từ chối `plugin_publish_scope=selected` khi `publish_openclaw_npm=true` để gói lõi không thể được phát hành mà thiếu bất kỳ Plugin chính thức nào có thể phát hành, bao gồm `@openclaw/diffs-language-pack`. Để sửa chữa một Plugin được chọn, hãy đặt `publish_openclaw_npm=false` cùng với `plugin_publish_scope=selected` và `plugins=@openclaw/name`, hoặc kích hoạt trực tiếp quy trình con.

Khởi tạo ClawHub cho lần phát hành đầu tiên là ngoại lệ: kích hoạt `Plugin ClawHub New`
từ `main` đáng tin cậy và truyền đầy đủ SHA bản phát hành đích qua `ref`.
Không bao giờ chạy chính quy trình khởi tạo từ thẻ hoặc nhánh bản phát hành:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

Việc xác thực trước khi gắn thẻ yêu cầu `dry_run=true`, từ chối đầu vào thẻ bản phát hành và lần chạy cha,
đồng thời chỉ chấp nhận một đích chính xác có thể truy cập từ `main` hoặc `release/*`.
Quy trình này không tải thông tin xác thực ClawHub, phát hành byte gói hoặc thay đổi cấu hình
nhà phát hành đáng tin cậy. Quy trình vẫn phân giải kế hoạch registry trực tiếp,
lấy mã nguồn và đóng gói đích chỉ trong một tác vụ không có bí mật, hiện thực hóa
chuỗi công cụ ClawHub đã khóa, đồng thời xác thực tạo tác bất biến và
slug/danh tính gói trước khi thẻ bản phát hành tồn tại. Chỉ phê duyệt môi trường
`clawhub-plugin-bootstrap` sau khi các tác vụ đóng gói không có bí mật
hoàn tất; tác vụ xác thực được bảo vệ này không có thông tin xác thực hoặc lệnh thay đổi trạng thái.

Một lần chạy thử được phê duyệt hoặc lần khởi tạo thực sau khi gắn thẻ phải bao gồm chính xác
thẻ bản phát hành cùng ID lần chạy, lần chạy và nhánh của `OpenClaw Release Publish`
cha. Quy trình cha chứng thực SHA quy trình của chính nó và một SHA `main` đáng tin cậy,
chính xác, riêng biệt cho `Plugin ClawHub New`; lần chạy con và mọi phê duyệt
môi trường được bảo vệ phải khớp với SHA con đã phê duyệt đó. Thẻ bản phát hành được
kiểm tra lại trước mỗi lần thử phát hành và thay đổi nhà phát hành đáng tin cậy.

Tác vụ đóng gói
tải lên một tạo tác bất biến duy nhất; tên, ID/tóm lược tạo tác Actions,
lần chạy/lần thử của trình tạo, SHA đích và SHA-256/kích thước tarball
của từng gói được chuyển vào các tác vụ xác thực và được bảo vệ. Tác vụ được bảo vệ chỉ
lấy mã nguồn công cụ `main` đáng tin cậy, xác thực bộ thông tin tạo tác qua GitHub API, tải xuống
bằng đúng ID tạo tác, băm lại mọi tarball và xác thực các đường dẫn TAR cục bộ cũng như
danh tính gói bằng quy tắc chuẩn hóa USTAR của CLI đã ghim. Sau đó, mọi
ứng viên đều vượt qua lần chạy thử phát hành của CLI đã ghim, vốn trả về trước khi
tra cứu registry hoặc xác thực. Bộ lọc trước của tác vụ thông tin xác thực giới hạn ClawPack đã nén
ở 120 MiB, tổng dữ liệu tệp ở 50 MiB, dữ liệu TAR đã bung ở 64 MiB và
số lượng mục TAR ở 10.000. Việc sửa chữa nhà phát hành đáng tin cậy cho gói hiện có vẫn
chỉ cấu hình, nhưng vẫn đóng gói đích và yêu cầu thẻ được đề nghị
cùng byte registry chính xác và siêu dữ liệu hoàn toàn bằng nhau trước khi thay đổi cấu hình
nhà phát hành đáng tin cậy. Việc xác minh sau phát hành tải xuống tạo tác ClawHub và
yêu cầu cùng SHA-256 và kích thước. Quá trình khôi phục bằng cách chạy lại tác vụ lỗi chỉ có thể tái sử dụng
tạo tác gói của một lần thử trước đó khi tác vụ tạo chính xác đã hoàn tất
thành công. Bằng chứng cuối cùng cũng liên kết phiên bản ClawHub đã khóa, SHA-256
của khóa và tính toàn vẹn npm. Nếu không khớp, cần có phiên bản gói mới.

## Đầu vào quy trình NPM

`OpenClaw NPM Release` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ bản phát hành bắt buộc, chẳng hạn như `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` hoặc `v2026.4.2-alpha.1`; khi `preflight_only=true`, giá trị này cũng có thể là SHA commit đầy đủ 40 ký tự hiện tại của nhánh quy trình để kiểm tra sơ bộ chỉ nhằm xác thực
- `preflight_only`: `true` để chỉ xác thực/xây dựng/đóng gói, `false` cho đường dẫn phát hành thực
- `preflight_run_id`: ID lần chạy kiểm tra sơ bộ thành công hiện có, bắt buộc trên đường dẫn phát hành thực để quy trình tái sử dụng tarball đã chuẩn bị thay vì xây dựng lại
- `full_release_validation_run_id`: ID lần chạy `Full Release Validation` thành công cho thẻ/SHA này, bắt buộc để phát hành thực. Bản phát hành beta có thể tiếp tục chỉ với kiểm tra sơ bộ kèm cảnh báo, nhưng việc thăng hạng ổn định/`latest` vẫn yêu cầu giá trị này.
- `full_release_validation_run_attempt`: lần chạy dương chính xác được ghép với `full_release_validation_run_id`; bắt buộc bất cứ khi nào cung cấp ID lần chạy để việc chạy lại không thể thay đổi bằng chứng ủy quyền trong khi phát hành.
- `release_publish_run_id`: ID lần chạy `OpenClaw Release Publish` đã phê duyệt; bắt buộc khi quy trình này được quy trình cha đó kích hoạt (các lệnh gọi phát hành thực từ tác nhân bot)
- `plugin_npm_run_id`: ID lần chạy `Plugin NPM Release` thành công tại đúng đầu nhánh; bắt buộc đối với lần phát hành lõi `extended-stable` thực
- `npm_dist_tag`: thẻ npm đích cho đường dẫn phát hành; chấp nhận `alpha`, `beta`, `latest` hoặc `extended-stable` và mặc định là `beta`. Bản vá cuối cùng `33` trở lên phải dùng `extended-stable`; theo mặc định, `extended-stable` từ chối các bản vá sớm hơn và luôn từ chối các thẻ không phải cuối cùng.
- `bypass_extended_stable_guard`: giá trị boolean chỉ dành cho kiểm thử, mặc định `false`; với `npm_dist_tag=extended-stable`, bỏ qua điều kiện đủ của bản ổn định mở rộng hằng tháng trong khi vẫn duy trì các kiểm tra danh tính bản phát hành, tạo tác, phê duyệt và đọc lại.

`Plugin NPM Release` chấp nhận `npm_dist_tag=default` cho hành vi phát hành
hiện có hoặc `npm_dist_tag=extended-stable` cho đường dẫn hằng tháng được bảo vệ. Tùy chọn
ổn định mở rộng yêu cầu `publish_scope=all-publishable`, đầu vào
`plugins` trống, bản vá cuối cùng từ `33` trở lên và nhánh chính thức
`extended-stable/YYYY.M.33` tại đúng đầu nhánh. Tùy chọn này không bao giờ di chuyển `latest`
hoặc `beta` của Plugin. Các phiên bản gói mới nhận `extended-stable` theo cách nguyên tử
thông qua phát hành đáng tin cậy bằng OIDC (`npm publish --tag extended-stable`); quy trình
nguồn này không sử dụng `npm dist-tag add` được xác thực bằng token. Các lần thử lại
bỏ qua các phiên bản chính xác đã có trong npm, sau đó đóng khi lỗi trừ khi việc
đọc lại đầy đủ xác nhận rằng mọi gói chính xác và thẻ `extended-stable` đã hội tụ.

`OpenClaw Release Publish` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `tag`: thẻ bản phát hành bắt buộc; phải tồn tại sẵn
- `preflight_run_id`: ID lần chạy kiểm tra sơ bộ `OpenClaw NPM Release` thành công; bắt buộc khi `publish_openclaw_npm=true` hoặc `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: ID lần chạy `Full Release Validation` thành công; bắt buộc khi `publish_openclaw_npm=true` hoặc `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: lần thử dương chính xác được ghép với `full_release_validation_run_id`; bắt buộc bất cứ khi nào cung cấp ID lần chạy
- `windows_node_tag`: thẻ bản phát hành `openclaw/openclaw-windows-node` chính xác, không phải bản phát hành trước; bắt buộc để phát hành OpenClaw ổn định
- `windows_node_installer_digests`: ánh xạ JSON rút gọn đã được ứng viên phê duyệt từ tên trình cài đặt Windows hiện tại đến tóm lược `sha256:` đã ghim; bắt buộc để phát hành OpenClaw ổn định
- `npm_telegram_run_id`: ID lần chạy `NPM Telegram Beta E2E` thành công không bắt buộc để đưa vào bằng chứng bản phát hành cuối cùng
- `npm_dist_tag`: thẻ npm đích cho gói OpenClaw, một trong `alpha`, `beta` hoặc `latest`
- `plugin_publish_scope`: mặc định là `all-publishable`; chỉ dùng `selected` cho công việc sửa chữa chỉ dành cho Plugin có trọng tâm với `publish_openclaw_npm=false`
- `plugins`: tên các gói `@openclaw/*` phân tách bằng dấu phẩy khi `plugin_publish_scope=selected`
- `publish_openclaw_npm`: mặc định là `true`; chỉ đặt `false` khi dùng quy trình làm bộ điều phối sửa chữa chỉ dành cho Plugin
- `release_profile`: hồ sơ phạm vi bao phủ bản phát hành dùng cho bản tóm tắt bằng chứng bản phát hành; mặc định là `from-validation`, đọc giá trị từ bảng kê xác thực, hoặc ghi đè bằng `beta`, `stable` hay `full`
- `wait_for_clawhub`: mặc định là `false` để tính khả dụng của npm không bị thành phần phụ ClawHub chặn; chỉ đặt `true` khi việc hoàn tất quy trình phải bao gồm cả việc hoàn tất ClawHub

`OpenClaw Release Checks` chấp nhận các đầu vào do người vận hành kiểm soát sau:

- `ref`: nhánh, thẻ hoặc SHA commit đầy đủ cần xác thực. Các kiểm tra chứa bí mật yêu cầu commit đã phân giải phải có thể truy cập từ một nhánh OpenClaw hoặc thẻ bản phát hành.
- `run_release_soak`: chọn tham gia kiểm thử ngâm đầy đủ gồm kiểm thử trực tiếp/E2E, đường dẫn phát hành Docker và khả năng sống sót sau nâng cấp từ mọi phiên bản cho các kiểm tra bản phát hành beta. Tùy chọn này được bắt buộc bật bởi `release_profile=stable` và `release_profile=full`.

Quy tắc:

- Các phiên bản cuối và phiên bản sửa lỗi thông thường dưới bản vá `33` có thể được phát hành lên `beta` hoặc `latest`. Các phiên bản cuối ở bản vá `33` trở lên phải được phát hành lên `extended-stable`, còn các phiên bản có hậu tố sửa lỗi tại ranh giới đó sẽ bị từ chối.
- Các thẻ tiền phát hành beta chỉ có thể được phát hành lên `beta`; các thẻ tiền phát hành alpha chỉ có thể được phát hành lên `alpha`
- Đối với `OpenClaw NPM Release`, chỉ được phép nhập SHA commit đầy đủ khi `preflight_only=true`
- `OpenClaw Release Checks` và `Full Release Validation` luôn chỉ dùng để xác thực
- Luồng phát hành thực tế phải sử dụng cùng `npm_dist_tag` đã dùng trong bước kiểm tra trước; quy trình công việc xác minh siêu dữ liệu đó trước khi tiếp tục phát hành

## Trình tự phát hành ổn định beta/latest thông thường

Trình tự cũ này dành cho đợt phát hành được điều phối thông thường, vốn cũng quản lý các Plugin, GitHub Release, Windows và công việc trên các nền tảng khác. Đây không phải là luồng `extended-stable` hằng tháng chỉ dành cho npm với phiên bản `.33+` được ghi lại ở đầu trang này.

Khi tạo một bản phát hành ổn định được điều phối thông thường:

1. Chạy `OpenClaw NPM Release` với `preflight_only=true`. Trước khi có thẻ, bạn có thể sử dụng SHA commit đầy đủ hiện tại của nhánh quy trình công việc để chạy thử quy trình kiểm tra trước mà không phát hành và chỉ nhằm mục đích xác thực.
2. Chọn `npm_dist_tag=beta` cho luồng beta-trước thông thường, hoặc chỉ chọn `latest` khi bạn chủ ý muốn phát hành ổn định trực tiếp.
3. Chạy `Full Release Validation` trên nhánh phát hành, thẻ phát hành hoặc SHA commit đầy đủ khi bạn muốn có CI thông thường cùng phạm vi kiểm tra bộ nhớ đệm prompt trực tiếp, Docker, QA Lab, Matrix và Telegram từ một quy trình công việc thủ công duy nhất. Nếu bạn chủ ý chỉ cần đồ thị kiểm thử thông thường có tính xác định, hãy chạy quy trình công việc `CI` thủ công trên tham chiếu phát hành.
4. Chọn chính xác thẻ phát hành không phải tiền phát hành của `openclaw/openclaw-windows-node` có các trình cài đặt x64 và ARM64 đã ký cần được phân phối. Lưu thẻ đó dưới dạng `windows_node_tag`, đồng thời lưu ánh xạ mã băm đã xác thực của các trình cài đặt dưới dạng `windows_node_installer_digests`. Trình trợ giúp ứng viên phát hành ghi lại cả hai và đưa chúng vào lệnh phát hành được tạo.
5. Lưu `preflight_run_id`, `full_release_validation_run_id` và chính xác `full_release_validation_run_attempt` của lần chạy thành công.
6. Chạy `OpenClaw Release Publish` từ `main` đáng tin cậy với cùng `tag`, cùng `npm_dist_tag`, `windows_node_tag` đã chọn, `windows_node_installer_digests` đã lưu của thẻ đó, cùng `preflight_run_id`, `full_release_validation_run_id` và `full_release_validation_run_attempt` đã lưu. Quy trình này phát hành các Plugin đã được tách riêng lên npm và ClawHub trước khi quảng bá gói npm OpenClaw.
7. Nếu bản phát hành được đưa lên `beta`, hãy sử dụng quy trình công việc `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` để quảng bá phiên bản ổn định đó từ `beta` lên `latest`.
8. Nếu bản phát hành được chủ ý phát hành trực tiếp lên `latest` và `beta` cần trỏ ngay đến cùng bản dựng ổn định, hãy sử dụng cùng quy trình phát hành đó để trỏ cả hai thẻ phân phối đến phiên bản ổn định, hoặc để cơ chế đồng bộ tự phục hồi theo lịch chuyển `beta` sau đó.

Việc thay đổi thẻ phân phối nằm trong kho sổ cái phát hành vì thao tác này vẫn yêu cầu `NPM_TOKEN`, trong khi kho mã nguồn chỉ duy trì phương thức phát hành bằng OIDC. Nhờ đó, cả luồng phát hành trực tiếp lẫn luồng quảng bá beta-trước đều được ghi lại và hiển thị rõ cho người vận hành.

Nếu một người bảo trì phải dự phòng bằng phương thức xác thực npm cục bộ, chỉ chạy mọi lệnh CLI 1Password (`op`) bên trong một phiên tmux chuyên dụng. Không gọi `op` trực tiếp từ shell chính của tác nhân; giữ lệnh này bên trong tmux giúp có thể quan sát các lời nhắc, cảnh báo và quá trình xử lý OTP, đồng thời ngăn cảnh báo lặp lại trên máy chủ.

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

Người bảo trì sử dụng tài liệu phát hành riêng tư trong [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) làm sổ tay quy trình thực tế.

## Liên quan

- [Các kênh phát hành](/vi/install/development-channels)
