---
read_when:
    - Chạy hoặc chạy lại quy trình Xác thực Bản phát hành Đầy đủ
    - So sánh các cấu hình xác thực bản phát hành ổn định và đầy đủ
    - Gỡ lỗi các lỗi ở giai đoạn xác thực bản phát hành
summary: Các giai đoạn Xác thực bản phát hành đầy đủ, quy trình công việc con, hồ sơ phát hành, cơ chế chạy lại và bằng chứng
title: Xác thực bản phát hành đầy đủ
x-i18n:
    generated_at: "2026-07-12T08:19:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c152128a27b173f131bcf2754c7f06d7bf3e9f7d2d1d0f745ab999f53c78c9
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` là quy trình tổng hợp cho bản phát hành: điểm vào thủ công duy nhất
để xác minh trước khi phát hành. Phần lớn công việc diễn ra trong các quy trình con để có thể
chạy lại một môi trường bị lỗi mà không phải khởi động lại toàn bộ quy trình phát hành.

Chạy quy trình này từ một tham chiếu quy trình đáng tin cậy, thường là `main`, rồi truyền nhánh phát hành,
thẻ hoặc SHA commit đầy đủ dưới dạng `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

`provider` cũng chấp nhận `anthropic` hoặc `minimax` cho quá trình thiết lập ban đầu đa hệ điều hành và
lượt chạy agent đầu-cuối. Các tác vụ con có thể tái sử dụng phân giải bộ khung quy trình được gọi
từ `job.workflow_repository` và `job.workflow_sha`, trong khi đầu vào `ref`
chọn ứng viên cần kiểm thử. Cách này duy trì khả năng sử dụng logic xác thực đáng tin cậy hiện tại
khi xác thực một nhánh hoặc thẻ phát hành cũ hơn.

Mỗi quy trình con được kích hoạt phải báo cáo cùng một SHA quy trình như lượt chạy
`Full Release Validation` cha. Nếu `main` thay đổi giữa lúc kích hoạt quy trình cha và quy trình con,
quy trình tổng hợp sẽ đóng an toàn với trạng thái thất bại ngay cả khi bản thân quy trình con thành công. Để
xác minh chính xác một commit bất biến, hãy dùng
`pnpm ci:full-release --sha <target-sha>`. Trình trợ giúp tạo một tham chiếu
`release-ci/*` tạm thời được ghim vào `origin/main` đáng tin cậy hiện tại, chỉ truyền SHA đích
làm `ref` ứng viên, tái sử dụng bằng chứng nghiêm ngặt cho chính xác đích đó khi
có sẵn và xóa tham chiếu sau khi xác thực. Truyền
`-f reuse_evidence=false` để buộc chạy mới hoặc
`--workflow-sha <trusted-main-sha>` để chọn một commit quy trình cũ hơn vẫn
có thể truy cập từ `origin/main` hiện tại. Bản thân quy trình không bao giờ tạo hoặc cập nhật
các tham chiếu kho lưu trữ.

`release_profile=stable` và `release_profile=full` luôn chạy kiểm thử kéo dài
trực tiếp/Docker toàn diện. Truyền `run_release_soak=true` để bao gồm cùng các luồng kiểm thử kéo dài
với hồ sơ `beta`. Việc phát hành ổn định sẽ từ chối một bản kê khai xác thực
không có kiểm thử kéo dài này và bằng chứng hiệu năng sản phẩm có tính chặn.

Package Acceptance thường xây dựng tarball ứng viên từ `ref` đã phân giải,
bao gồm các lượt chạy SHA đầy đủ được kích hoạt bằng `pnpm ci:full-release`. Sau khi
phát hành beta, hãy truyền `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` để tái sử dụng
gói npm đã phát hành trong các bước kiểm tra phát hành, Package Acceptance, đa hệ điều hành,
Docker theo đường dẫn phát hành và Telegram từ gói. Chỉ dùng `package_acceptance_package_spec`
khi Package Acceptance cần chủ đích xác minh một gói khác.
Luồng gói trực tiếp của Plugin Codex tuân theo cùng trạng thái: các giá trị
`release_package_spec` đã phát hành suy ra `codex_plugin_spec=npm:@openclaw/codex@<version>`;
các lượt chạy SHA/cấu phần đóng gói `extensions/codex` từ tham chiếu đã chọn; và người vận hành
có thể đặt trực tiếp `codex_plugin_spec` cho các nguồn Plugin
`npm:`, `npm-pack:` hoặc `git:`. Luồng này cấp quyền phê duyệt cài đặt Codex CLI rõ ràng theo yêu cầu của
Plugin đó, sau đó chạy bước kiểm tra sơ bộ Codex CLI và các lượt chạy agent OpenAI trong cùng phiên.

## Các giai đoạn cấp cao nhất

Với `rerun_group=all`, tác vụ `Check for reusable validation evidence` chạy
trước tiên: tác vụ tìm lượt xác thực đầy đủ thành công gần nhất trước đó cho chính xác cùng
SHA đích, hồ sơ phát hành, thiết lập kiểm thử kéo dài có hiệu lực và các đầu vào xác thực.
Khi có bằng chứng như vậy, mọi luồng đều bị bỏ qua và trình xác minh tổng hợp
kiểm tra lại cấu phần cha bất biến, các lượt chạy con và nhật ký kích hoạt. Đây
chỉ là cơ chế khôi phục chạy lại cho cùng ứng viên; nó không cho phép tái sử dụng giữa các SHA. Với
một ứng viên đã thay đổi, hãy chạy lại mọi cổng gói, cấu phần, cài đặt, Docker hoặc nhà cung cấp
bị ảnh hưởng bởi phần chênh lệch đó. Truyền `reuse_evidence=false` để buộc chạy đầy đủ
mới. Việc tái sử dụng bằng chứng chỉ chạy từ `main` hoặc một tham chiếu
`release-ci/*` chính tắc được ghim bằng SHA mà commit quy trình vẫn nằm trong dòng dõi `main` đáng tin cậy;
các tham chiếu quy trình khác chạy mới các luồng đã chọn.

Cũng với `rerun_group=all`, tác vụ `Verify Docker runtime image assets` xây dựng
đích Docker `runtime-assets` với
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Tác vụ chạy song song với
các giai đoạn khác và được trình xác minh tổng hợp thực thi bắt buộc; các luồng không còn phải chờ
tác vụ này trước khi được kích hoạt. Một `rerun_group` hẹp hơn sẽ bỏ qua bước kiểm tra sơ bộ này.

| Giai đoạn                   | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phân giải đích       | **Tác vụ:** `Resolve target ref`<br />**Quy trình con:** không có<br />**Xác minh:** phân giải nhánh phát hành, thẻ hoặc SHA commit đầy đủ và ghi lại các đầu vào đã chọn.<br />**Chạy lại:** chạy lại quy trình tổng hợp nếu bước này thất bại.                                                                                                                                                                                                                                                                                                            |
| Kiểm tra sơ bộ cấu phần Docker | **Tác vụ:** `Verify Docker runtime image assets`<br />**Quy trình con:** không có<br />**Xác minh:** đích xây dựng Docker `runtime-assets` vẫn thành công trước khi kích hoạt bất kỳ giai đoạn nào khác. Chỉ chạy với `rerun_group=all`.<br />**Chạy lại:** chạy lại quy trình tổng hợp với `rerun_group=all`.                                                                                                                                                                                                                                         |
| Vitest và CI thông thường    | **Tác vụ:** `Run normal full CI`<br />**Quy trình con:** `CI`<br />**Xác minh:** đồ thị CI đầy đủ thủ công trên tham chiếu đích, bao gồm các luồng Linux Node, các phân đoạn Plugin đi kèm, các phân đoạn hợp đồng Plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra nhanh cấu phần đã xây dựng, kiểm tra tài liệu, Skills Python, Windows, macOS, i18n của Control UI và Android thông qua quy trình tổng hợp.<br />**Chạy lại:** `rerun_group=ci`.                                                                                          |
| Tiền phát hành Plugin       | **Tác vụ:** `Run plugin prerelease validation`<br />**Quy trình con:** `Plugin Prerelease`<br />**Xác minh:** các bước kiểm tra tĩnh Plugin chỉ dành cho phát hành, độ bao phủ Plugin dựa trên agent, toàn bộ các phân đoạn theo lô Plugin, các luồng Docker tiền phát hành Plugin và một cấu phần `plugin-inspector-advisory` không chặn để phân loại vấn đề tương thích.<br />**Chạy lại:** `rerun_group=plugin-prerelease`.                                                                                                                                                          |
| Kiểm tra phát hành          | **Tác vụ:** `Run release/live/Docker/QA validation`<br />**Quy trình con:** `OpenClaw Release Checks`<br />**Xác minh:** kiểm tra nhanh cài đặt, kiểm tra gói đa hệ điều hành, Package Acceptance, tính tương đương của QA Lab, Matrix trực tiếp và Telegram trực tiếp. Các hồ sơ ổn định và đầy đủ cũng chạy các bộ kiểm thử trực tiếp/E2E toàn diện cùng các phần Docker theo đường dẫn phát hành; beta có thể chọn tham gia bằng `run_release_soak=true`.<br />**Chạy lại:** `rerun_group=release-checks` hoặc một định danh release-checks hẹp hơn.                                                                |
| Telegram từ gói        | **Tác vụ:** `Run package Telegram E2E`<br />**Quy trình con:** `NPM Telegram Beta E2E`<br />**Xác minh:** một kiểm thử E2E Telegram tập trung trên gói đã phát hành khi `release_package_spec` hoặc `npm_telegram_package_spec` được đặt. Việc xác thực đầy đủ ứng viên sử dụng kiểm thử E2E Telegram chính tắc của Package Acceptance thay thế.<br />**Chạy lại:** `rerun_group=npm-telegram` với `release_package_spec` hoặc `npm_telegram_package_spec`.                                                                                                              |
| Hiệu năng sản phẩm     | **Tác vụ:** `Run product performance evidence`<br />**Quy trình con:** `OpenClaw Performance`<br />**Xác minh:** lượt chạy hiệu năng theo hồ sơ phát hành (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) trên SHA đích. Đầu ra Kova được giữ trong các cấu phần quy trình và quy trình con phải chứng minh trình phát hành báo cáo đã bị bỏ qua. Chỉ bắt buộc (có tính chặn) với `rerun_group=all` hoặc `rerun_group=performance`; không bắt buộc với các nhóm chạy lại hẹp hơn.<br />**Chạy lại:** `rerun_group=performance`. |
| Trình xác minh tổng hợp       | **Tác vụ:** `Verify full validation`<br />**Quy trình con:** không có<br />**Xác minh:** kiểm tra lại các kết luận lượt chạy con đã ghi nhận và nối thêm các bảng tác vụ chậm nhất từ các quy trình con.<br />**Chạy lại:** chỉ chạy lại tác vụ này sau khi chạy lại quy trình con bị lỗi cho đến khi thành công.                                                                                                                                                                                                                                                                 |

Quy trình tổng hợp luôn kích hoạt hiệu năng sản phẩm ở chế độ chỉ tạo cấu phần.
`OpenClaw Performance` chỉ cho phép phát hành báo cáo đối với các lượt chạy theo lịch hoặc một
lượt kích hoạt thủ công đặt rõ ràng `publish_reports=true`. Cơ chế bảo vệ chế độ chỉ tạo cấu phần
phải hoàn tất thành công, chứng minh tác vụ phát hành đã tiếp tục bị bỏ qua.
Bằng chứng mới và được tái sử dụng ghi lại
`controls.performanceReportPublication=artifact-only`; trình xác minh và bộ chọn tái sử dụng
từ chối bằng chứng không có phần xác minh quy trình con hiệu năng đã chuẩn hóa tương ứng.

Trình xác minh tải bản kê khai chính tắc lên với tên
`full-release-validation-<run-id>-<run-attempt>`. Công cụ bằng chứng xác thực
ID cấu phần, mã băm, lượt chạy tạo ra và lần thử trước khi tải xuống chính xác
ID cấu phần đó. Công cụ giới hạn kích thước ZIP tải xuống, xác minh các byte của tệp dựa trên mã băm
`sha256:` từ REST và truyền phát mục bản kê khai giới hạn duy nhất được cho phép mà không
giải nén kho lưu trữ. Một bí danh có tên ổn định tạm thời vẫn được giữ lại cho các
trình tiêu thụ phát hành cũ hơn. Trình xác minh luôn ưu tiên cấu phần có kèm định danh lần thử;
trong giai đoạn chuyển tiếp, trình chấp nhận tên ổn định chỉ đối với trình tạo bản kê khai v2
ở lần thử 1. Trình từ chối tên cũ đó đối với các lần thử sau và bản kê khai v3.

Với `ref=main` cùng `rerun_group=all`, với các tham chiếu `release/*`
và với các tham chiếu alpha Tideclaw, một lượt chạy tổng hợp mới hơn sẽ thay thế một lượt chạy cũ hơn
có cùng tham chiếu và nhóm chạy lại. Khi quy trình cha bị hủy, trình giám sát của nó sẽ hủy mọi
quy trình con mà nó đã kích hoạt. Các lượt xác thực theo thẻ và SHA được ghim không
hủy lẫn nhau.

## Các giai đoạn kiểm tra phát hành

`OpenClaw Release Checks` là quy trình con lớn nhất. Quy trình này phân giải đích
một lần và chuẩn bị cấu phần `release-package-under-test` dùng chung khi các giai đoạn
liên quan đến gói hoặc Docker cần đến nó.

| Giai đoạn                    | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu phát hành           | **Tác vụ:** `Resolve target ref`<br />**Quy trình hỗ trợ:** không có<br />**Kiểm thử:** ref đã chọn, SHA dự kiến tùy chọn, hồ sơ, nhóm chạy lại và bộ lọc tập kiểm thử trực tiếp có trọng tâm.<br />**Chạy lại:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                  |
| Hiện vật gói                 | **Tác vụ:** `Prepare release package artifact`<br />**Quy trình hỗ trợ:** không có<br />**Kiểm thử:** đóng gói hoặc phân giải một tarball ứng viên và tải `release-package-under-test` lên để phục vụ các bước kiểm tra gói ở hạ nguồn.<br />**Chạy lại:** nhóm gói, đa hệ điều hành hoặc trực tiếp/E2E bị ảnh hưởng.                                                                                                                                                                                                                                                            |
| Kiểm tra nhanh cài đặt       | **Tác vụ:** `Run install smoke`<br />**Quy trình hỗ trợ:** `Install Smoke`<br />**Kiểm thử:** toàn bộ luồng cài đặt với việc tái sử dụng ảnh kiểm tra nhanh Dockerfile gốc, cài đặt gói QR, kiểm tra nhanh Docker cho thư mục gốc và Gateway, kiểm thử Docker của trình cài đặt và kiểm tra nhanh nhà cung cấp hình ảnh khi cài đặt Bun toàn cục.<br />**Chạy lại:** `rerun_group=install-smoke`.                                                                                                                                                                                     |
| Đa hệ điều hành              | **Tác vụ:** `cross_os_release_checks`<br />**Quy trình hỗ trợ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Kiểm thử:** các luồng cài mới và nâng cấp trên Linux, Windows và macOS cho nhà cung cấp và chế độ đã chọn, sử dụng tarball ứng viên cùng với một gói cơ sở.<br />**Chạy lại:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                         |
| E2E kho mã và trực tiếp      | **Tác vụ:** `Run repo/live E2E validation`<br />**Quy trình hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** E2E kho mã, bộ nhớ đệm trực tiếp, truyền trực tuyến qua websocket của OpenAI, các phân đoạn nhà cung cấp trực tiếp gốc và Plugin, cùng các bộ kiểm thử mô hình/phần phụ trợ/Gateway trực tiếp dựa trên Docker được chọn theo `release_profile`.<br />**Chạy khi:** `run_release_soak=true`, `release_profile=full` hoặc `rerun_group=live-e2e` có trọng tâm.<br />**Chạy lại:** `rerun_group=live-e2e`, tùy chọn kèm `live_suite_filter`.                                           |
| Luồng phát hành Docker       | **Tác vụ:** `Run Docker release-path validation`<br />**Quy trình hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** các phần Docker trong luồng phát hành đối với hiện vật gói dùng chung.<br />**Chạy khi:** `run_release_soak=true`, `release_profile=full` hoặc `rerun_group=live-e2e` có trọng tâm.<br />**Chạy lại:** `rerun_group=live-e2e`.                                                                                                                                                                                                                   |
| Chấp nhận gói                | **Tác vụ:** `Run package acceptance`<br />**Quy trình hỗ trợ:** `Package Acceptance`<br />**Kiểm thử:** các bộ dữ liệu mẫu gói Plugin ngoại tuyến, cập nhật Plugin, E2E gói Telegram dùng OpenAI giả lập chuẩn và các bước kiểm tra khả năng tồn tại sau nâng cấp từ bản đã phát hành đối với cùng một tarball. Các bước kiểm tra phát hành có tính chặn sử dụng bản cơ sở được phát hành mới nhất theo mặc định; các bước kiểm tra ngâm (`run_release_soak=true`) mở rộng đến 4 bản phát hành npm ổn định gần nhất cùng 3 phiên bản lịch sử được ghim (`2026.4.23`, `2026.5.2`, `2026.4.15`), chạy với các bộ dữ liệu mẫu nâng cấp từ sự cố đã báo cáo.<br />**Chạy lại:** `rerun_group=package`. |
| Bảng điểm độ trưởng thành    | **Tác vụ:** `Render maturity scorecard release docs`<br />**Quy trình hỗ trợ:** `maturity-scorecard.yml`<br />**Kiểm thử:** kết xuất tài liệu bảng điểm độ trưởng thành mang tính tư vấn theo ref mục tiêu. Chỉ chạy khi truyền `run_maturity_scorecard=true`.<br />**Chạy lại:** `rerun_group=qa` với `run_maturity_scorecard=true`.                                                                                                                                                                                                                                                   |
| Tính tương đương QA          | **Tác vụ:** `Run QA Lab parity lane` và `Run QA Lab parity report`<br />**Quy trình hỗ trợ:** các tác vụ trực tiếp<br />**Kiểm thử:** các gói kiểm thử tính tương đương tác tử của ứng viên và bản cơ sở, sau đó là báo cáo tính tương đương.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                                                                                                                                                                     |
| Tính tương đương runtime QA  | **Tác vụ:** `Run QA Lab runtime parity lane`<br />**Quy trình hỗ trợ:** tác vụ trực tiếp<br />**Kiểm thử:** một luồng kiểm thử tính tương đương tác tử cho cặp runtime `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), bao gồm một tầng tiêu chuẩn và, khi có `run_release_soak=true`, một tầng kiểm thử ngâm. Mang tính tư vấn: các lỗi riêng lẻ không chặn trình xác minh kiểm tra phát hành.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                          |
| Độ bao phủ công cụ runtime QA | **Tác vụ:** `Enforce QA Lab runtime tool coverage`<br />**Quy trình hỗ trợ:** tác vụ trực tiếp<br />**Kiểm thử:** độ lệch công cụ động giữa `openclaw` và `codex` trong tầng kiểm thử tính tương đương runtime tiêu chuẩn (`pnpm openclaw qa coverage --tools`), sử dụng đầu ra của luồng kiểm thử tính tương đương runtime QA. Có tính chặn: không thể ghi đè tác vụ này thành chế độ tư vấn.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                                 |
| Matrix trực tiếp QA         | **Tác vụ:** `Run QA Lab live Matrix lane`<br />**Quy trình hỗ trợ:** tác vụ trực tiếp<br />**Kiểm thử:** hồ sơ QA Matrix trực tiếp nhanh trong môi trường `qa-live-shared`.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                       |
| Telegram trực tiếp QA       | **Tác vụ:** `Run QA Lab live Telegram lane`<br />**Quy trình hỗ trợ:** tác vụ trực tiếp<br />**Kiểm thử:** QA Telegram trực tiếp với các hợp đồng thuê thông tin xác thực CI của Convex.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                       |
| Trình xác minh phát hành     | **Tác vụ:** `Verify release checks`<br />**Quy trình hỗ trợ:** không có<br />**Kiểm thử:** các tác vụ kiểm tra phát hành bắt buộc cho nhóm chạy lại đã chọn.<br />**Chạy lại:** chạy lại sau khi các tác vụ con có trọng tâm vượt qua.                                                                                                                                                                                                                                                                                                                                          |

## Các phần trong luồng phát hành Docker

Giai đoạn luồng phát hành Docker chạy các phần sau khi `live_suite_filter`
trống:

| Phần                                                            | Phạm vi bao phủ                                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Các luồng kiểm tra nhanh Docker cốt lõi trong luồng phát hành.                                                                         |
| `package-update-openai`                                         | Hành vi cài đặt/cập nhật gói OpenAI, cài đặt Codex theo yêu cầu, các lượt chạy trực tiếp của Plugin Codex và các lệnh gọi công cụ Chat Completions. |
| `package-update-anthropic`                                      | Hành vi cài đặt và cập nhật gói Anthropic.                                                                                             |
| `package-update-core`                                           | Hành vi gói và cập nhật không phụ thuộc nhà cung cấp.                                                                                  |
| `plugins-runtime-plugins`                                       | Các luồng runtime Plugin thực thi hành vi của Plugin.                                                                                  |
| `plugins-runtime-services`                                      | Các luồng runtime Plugin trực tiếp và dựa trên dịch vụ.                                                                                |
| `plugins-runtime-install-a` đến `plugins-runtime-install-h`     | Các lô cài đặt/runtime Plugin được chia để xác thực phát hành song song.                                                               |
| `openwebui`                                                     | Kiểm tra nhanh khả năng tương thích OpenWebUI được cô lập trên một runner có ổ đĩa lớn chuyên dụng khi được yêu cầu.                    |

Sử dụng `docker_lanes=<lane[,lane]>` có mục tiêu trên quy trình trực tiếp/E2E có thể tái sử dụng khi
chỉ một luồng Docker thất bại. Các hiện vật phát hành bao gồm các lệnh chạy lại
theo từng luồng với đầu vào tái sử dụng hiện vật gói và ảnh khi có sẵn.

## Hồ sơ phát hành

`release_profile` chủ yếu kiểm soát phạm vi live/nhà cung cấp bên trong các bước kiểm tra bản phát hành.
Nó không loại bỏ CI đầy đủ thông thường, Bản phát hành trước Plugin, kiểm thử nhanh cài đặt, kiểm
thử chấp nhận gói hoặc QA Lab. Các hồ sơ stable và full luôn chạy phạm vi kiểm thử toàn diện E2E
kho mã/live và kiểm thử ngâm đường dẫn phát hành Docker. Hồ sơ beta có thể chọn tham gia bằng
`run_release_soak=true`. Kiểm thử chấp nhận gói cung cấp kiểm thử E2E Telegram chuẩn cho gói
đối với mọi ứng viên đầy đủ, vì vậy quy trình tổng không chạy trùng trình thăm dò live đó.

| Hồ sơ    | Mục đích sử dụng                         | Phạm vi live/nhà cung cấp được bao gồm                                                                                                                                                                             |
| -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `beta`   | Kiểm thử nhanh thiết yếu cho phát hành.  | Đường dẫn live OpenAI/lõi, các mô hình live Docker cho OpenAI, lõi gateway gốc, hồ sơ gateway OpenAI gốc, plugin OpenAI gốc và gateway OpenAI live trên Docker.                                                     |
| `stable` | Hồ sơ phê duyệt bản phát hành mặc định. | `beta` cộng với kiểm thử nhanh Anthropic, Google, MiniMax, backend, bộ kiểm thử live gốc, backend CLI live trên Docker, liên kết ACP trên Docker, bộ kiểm thử Codex trên Docker, thông báo tác tử con trên Docker và một phân đoạn kiểm thử nhanh OpenCode Go. |
| `full`   | Đợt rà soát tư vấn diện rộng.            | `stable` cộng với các nhà cung cấp tư vấn, các phân đoạn live của plugin và các phân đoạn live về phương tiện.                                                                                                      |

## Các phần bổ sung chỉ dành cho full

Các bộ kiểm thử này bị `stable` bỏ qua và được `full` bao gồm:

| Khu vực                          | Phạm vi chỉ dành cho full                                                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Các mô hình live trên Docker     | OpenCode Go, OpenRouter, xAI, Z.ai và Fireworks.                                                                                             |
| Gateway live trên Docker         | Các nhà cung cấp tư vấn được chia thành các phân đoạn DeepSeek/Fireworks, OpenCode Go/OpenRouter và xAI/Z.ai.                                |
| Hồ sơ nhà cung cấp gateway gốc   | Các phân đoạn Anthropic Opus đầy đủ và Sonnet/Haiku, Fireworks, DeepSeek, các phân đoạn mô hình OpenCode Go đầy đủ, OpenRouter, xAI và Z.ai. |
| Các phân đoạn live plugin gốc    | Plugin A-K, L-N, nhóm khác O-Z, Moonshot và xAI.                                                                                             |
| Các phân đoạn live phương tiện gốc | Âm thanh, nhạc Google, nhạc MiniMax và các nhóm video A-D.                                                                                  |

`stable` bao gồm `native-live-src-gateway-profiles-anthropic-smoke` và
`native-live-src-gateway-profiles-opencode-go-smoke`; thay vào đó, `full` sử dụng
các phân đoạn mô hình Anthropic và OpenCode Go rộng hơn. Các lần chạy lại có trọng tâm vẫn có thể sử dụng
các định danh tổng hợp `native-live-src-gateway-profiles-anthropic` hoặc
`native-live-src-gateway-profiles-opencode-go`.

## Chạy lại có trọng tâm

Sử dụng `rerun_group` để tránh lặp lại các môi trường phát hành không liên quan:

| Định danh            | Phạm vi                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `all`                | Tất cả các giai đoạn Xác thực bản phát hành đầy đủ.                                               |
| `ci`                 | Chỉ quy trình con CI đầy đủ thủ công.                                                             |
| `plugin-prerelease`  | Chỉ quy trình con Bản phát hành trước Plugin.                                                     |
| `release-checks`     | Tất cả các giai đoạn Kiểm tra bản phát hành OpenClaw.                                             |
| `install-smoke`      | Kiểm thử nhanh cài đặt thông qua các bước kiểm tra bản phát hành.                                 |
| `cross-os`           | Kiểm tra bản phát hành đa hệ điều hành.                                                           |
| `live-e2e`           | Xác thực E2E kho mã/live và đường dẫn phát hành Docker.                                           |
| `package`            | Kiểm thử chấp nhận gói.                                                                           |
| `qa`                 | Tính tương đương QA cùng các luồng live QA.                                                       |
| `qa-parity`          | Chỉ các luồng và báo cáo tính tương đương QA.                                                     |
| `qa-live`            | Matrix/Telegram live QA cùng các luồng Discord, WhatsApp và Slack có cổng kiểm soát khi được bật. |
| `npm-telegram`       | Kiểm thử E2E Telegram cho gói đã phát hành; yêu cầu `release_package_spec` hoặc `npm_telegram_package_spec`. |
| `performance`        | Chỉ bằng chứng hiệu năng sản phẩm.                                                                |

Sử dụng `live_suite_filter` với `rerun_group=live-e2e` khi một bộ kiểm thử live thất bại.
Các mã bộ lọc hợp lệ được định nghĩa trong quy trình live/E2E có thể tái sử dụng, bao gồm
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` và
`live-codex-harness-docker`.

Định danh `live-gateway-advisory-docker` là định danh chạy lại tổng hợp cho
ba phân đoạn nhà cung cấp của nó, vì vậy nó vẫn phân tách thành tất cả các tác vụ gateway Docker tư vấn.

Sử dụng `cross_os_suite_filter` với `rerun_group=cross-os` khi một luồng đa hệ điều hành
thất bại. Bộ lọc chấp nhận mã hệ điều hành, mã bộ kiểm thử hoặc cặp hệ điều hành/bộ kiểm thử, ví dụ
`windows/packaged-upgrade`, `windows` hoặc `packaged-fresh`. Các bản tóm tắt đa hệ điều hành
bao gồm thời gian của từng giai đoạn cho các luồng nâng cấp đóng gói, và các lệnh chạy lâu
in ra các dòng Heartbeat để có thể nhận biết một quá trình cập nhật bị treo trước khi tác vụ
hết thời gian chờ.

Các lỗi kiểm tra bản phát hành QA chặn quá trình xác thực bản phát hành thông thường. Bước kiểm tra
phạm vi công cụ thời gian chạy QA (độ lệch công cụ động giữa `openclaw` và `codex` trong
cấp tiêu chuẩn) cũng chặn trình xác minh kiểm tra bản phát hành mặc dù
luồng tương đương thời gian chạy QA nền tảng chỉ mang tính tư vấn. Các lần chạy Tideclaw alpha vẫn có thể
coi các luồng kiểm tra bản phát hành không liên quan đến an toàn gói là tư vấn. Với
`release_profile=beta`, các bộ kiểm thử nhà cung cấp live trong `Run repo/live E2E validation`
mang tính tư vấn: các triển khai mô hình của bên thứ ba thay đổi bên dưới một bản phát hành, vì vậy
beta hiển thị lỗi của chúng dưới dạng cảnh báo, trong khi các hồ sơ stable và full vẫn để
chúng ở trạng thái chặn. Khi
`live_suite_filter` yêu cầu rõ ràng một luồng live QA có cổng kiểm soát như Discord,
WhatsApp hoặc Slack, biến kho mã `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` tương ứng
phải được bật; nếu không, quá trình ghi nhận đầu vào sẽ thất bại thay vì âm thầm bỏ qua luồng đó.
Chạy lại với `rerun_group=qa`, `qa-parity` hoặc `qa-live` khi bạn
cần bằng chứng QA mới.

## Bằng chứng cần giữ lại

Giữ bản tóm tắt `Full Release Validation` làm chỉ mục cấp bản phát hành. Bản tóm tắt này liên kết
các mã lần chạy con và bao gồm các bảng tác vụ chậm nhất. Khi có lỗi, trước tiên hãy kiểm tra
quy trình con, sau đó chạy lại định danh khớp nhỏ nhất ở trên.

Các hiện vật hữu ích:

- `release-package-under-test` từ `OpenClaw Release Checks`
- Các hiện vật đường dẫn phát hành Docker trong `.artifacts/docker-tests/`
- `package-under-test` của Kiểm thử chấp nhận gói và các hiện vật kiểm thử chấp nhận Docker
- Các hiện vật kiểm tra bản phát hành đa hệ điều hành cho từng hệ điều hành và bộ kiểm thử
- Các hiện vật tính tương đương QA, tính tương đương thời gian chạy, Matrix và Telegram

## Tệp quy trình

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/install-smoke-reusable.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
- `.github/workflows/openclaw-performance.yml`
- `.github/workflows/npm-telegram-beta-e2e.yml`
