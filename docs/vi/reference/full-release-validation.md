---
read_when:
    - Chạy hoặc chạy lại quy trình Xác thực Bản phát hành Đầy đủ
    - So sánh các cấu hình xác thực bản phát hành ổn định và đầy đủ
    - Gỡ lỗi các lỗi ở giai đoạn xác thực bản phát hành
summary: Các giai đoạn Full Release Validation, quy trình con, hồ sơ phát hành, cách chạy lại và bằng chứng
title: Xác thực bản phát hành đầy đủ
x-i18n:
    generated_at: "2026-07-19T06:21:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ec027e633efb118c7fbad8b2cd2a17408c2ba46e0c0742a180b1019e21731174
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` là lớp bao quát xác thực sản phẩm cho bản phát hành. Phần lớn công việc
diễn ra trong các workflow con để có thể chạy lại một hộp bị lỗi mà không cần khởi động lại
toàn bộ bản phát hành. Chạy bước chuẩn bị bản phát hành trước khi đóng băng Code SHA; bước này
làm mới đầu ra locale của Control UI khi bot nền chưa đưa thay đổi đó vào,
sau đó thực thi cùng phép kiểm tra nghiêm ngặt không fallback mà Pipeline CI phát hành sử dụng.

Đóng băng commit hoàn chỉnh về sản phẩm trước changelog làm **Code SHA**, sau đó chạy:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

`provider` cũng chấp nhận `anthropic` hoặc `minimax` cho quy trình onboarding đa hệ điều hành và
lượt agent đầu-cuối. Trình trợ giúp suy ra cấu hình `beta` từ các phiên bản gói alpha/beta
và dùng `stable` trong các trường hợp còn lại. Truyền các đầu vào workflow thay thế bằng
`-f key=value`; chỉ dùng `-f release_profile=full` cho đợt rà quét tư vấn diện rộng.

Trình trợ giúp tạo một ref `release-ci/*` tạm thời được ghim vào một
workflow SHA `origin/main` đáng tin cậy, chỉ truyền SHA đích dưới dạng `ref` ứng viên,
và xóa ref tạm thời sau khi xác thực. Mọi workflow con được kích hoạt phải
báo cáo cùng workflow SHA đó. Truyền
`-f reuse_evidence=false` để buộc chạy mới hoặc
`--workflow-sha <trusted-main-sha>` để chọn một commit workflow cũ hơn vẫn
có thể truy cập từ `origin/main` hiện tại. Bản thân workflow không bao giờ tạo hoặc cập nhật
ref của kho lưu trữ.

Khi Code SHA đạt trạng thái xanh, chỉ tạo và commit `CHANGELOG.md`. Commit mới này
là **Release SHA**. Chạy cùng trình trợ giúp cho Release SHA. Bằng chứng sản phẩm
chỉ được tái sử dụng khi GitHub chứng minh Release SHA là hậu duệ của
Code SHA và toàn bộ tập hợp đường dẫn đã thay đổi chính xác là `CHANGELOG.md`; bước kiểm tra trước npm
và kiểm tra chấp nhận gói/cài đặt vẫn chạy trên Release SHA.

`release_profile=stable` và `release_profile=full` luôn chạy đợt soak
live/Docker toàn diện. Truyền `run_release_soak=true` để bao gồm cùng các lane soak
với cấu hình `beta`. Việc phát hành stable sẽ từ chối manifest xác thực
không có đợt soak này và bằng chứng hiệu năng sản phẩm có tính chặn.

Package Acceptance thường xây dựng tarball ứng viên từ
`ref` đã phân giải, bao gồm các lượt chạy full-SHA được kích hoạt bằng `pnpm ci:full-release`. Sau khi
phát hành beta, truyền `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` để tái sử dụng
gói npm đã phát hành trong các bước kiểm tra bản phát hành, Package Acceptance, đa hệ điều hành,
Docker theo đường dẫn phát hành và Telegram theo gói. Chỉ dùng `package_acceptance_package_spec`
khi Package Acceptance cần chủ ý chứng minh một gói khác.
Lane gói live của Plugin Codex tuân theo cùng trạng thái: các giá trị
`release_package_spec` đã phát hành dẫn xuất `codex_plugin_spec=npm:@openclaw/codex@<version>`;
các lượt chạy SHA/artifact đóng gói `extensions/codex` từ ref đã chọn; và người vận hành
có thể đặt trực tiếp `codex_plugin_spec` cho các nguồn Plugin
`npm:`, `npm-pack:` hoặc `git:`. Lane này cấp quyền phê duyệt cài đặt Codex CLI rõ ràng mà
Plugin đó yêu cầu, sau đó chạy bước kiểm tra trước Codex CLI và các lượt agent OpenAI trong cùng phiên.
Lượt cuối cùng không thử lại, với mức suy luận trung bình, gửi tiến trình hiển thị với Codex
`final` bị lược bỏ, đọc các đầu vào workspace ngẫu nhiên, ghi artifact chính xác của chúng
và gửi thông báo hoàn tất rõ ràng. Việc này phát hiện hồi quy v2026.7.1, trong đó một
lần gửi tiến trình thông thường đã chấm dứt lượt.

## Các giai đoạn cấp cao nhất

Đối với `rerun_group=all`, job `Check for reusable validation evidence` chạy
trước tiên. Job này tìm lần xác thực đầy đủ đạt trạng thái xanh gần nhất trước đó có cùng cấu hình bản phát hành,
thiết lập soak hiệu lực và đầu vào xác thực. Các lần chạy lại đúng đích sử dụng
`exact-target-full-validation-v1`. Một hậu duệ có toàn bộ phần chênh lệch chính xác là
`CHANGELOG.md` sử dụng `changelog-only-release-v1`; mọi lane sản phẩm đều bị bỏ qua
và trình xác minh kiểm tra lại độc lập phép so sánh commit của GitHub, artifact cha bất biến,
các lượt chạy con và nhật ký kích hoạt. Bất kỳ thay đổi đích nào khác đều yêu cầu
xác thực Code SHA mới. Truyền `reuse_evidence=false` để buộc chạy đầy đủ mới.
Việc tái sử dụng bằng chứng chỉ chạy từ `main` hoặc ref `release-ci/*`
chuẩn tắc được ghim bằng SHA, có commit workflow vẫn nằm trên dòng dõi `main` đáng tin cậy;
các ref workflow khác chạy mới các lane đã chọn.

Quá trình xác thực mới hướng tới gói chuẩn bị một tarball bất biến cùng một artifact ảnh Docker
trước khi kích hoạt Plugin Prerelease và OpenClaw Release Checks.
Cả hai workflow con đều xác minh cùng SHA gói, ID artifact, digest dịch vụ,
lần thử của lượt chạy tạo ra và digest kho lưu trữ Docker trước khi sử dụng. Lớp Docker thuần
không phụ thuộc gói sử dụng bộ nhớ đệm GHCR định địa chỉ theo nội dung; các ảnh dành riêng cho ứng viên
vẫn là artifact GitHub bất biến. Các lượt chạy tập trung với đặc tả gói đã phát hành
rõ ràng tiếp tục dùng đường dẫn gói hiện có.

Cũng đối với `rerun_group=all`, job `Verify Docker runtime image assets` xây dựng
đích Docker `runtime-assets` với
`OPENCLAW_EXTENSIONS=diagnostics-otel,codex`. Job này chạy song song với
các giai đoạn khác và được trình xác minh bao quát thực thi; các lane không còn phải chờ
job này trước khi kích hoạt. `rerun_group` có phạm vi hẹp hơn sẽ bỏ qua bước kiểm tra trước này.

| Giai đoạn               | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phân giải đích          | **Job:** `Resolve target ref`<br />**Workflow con:** không có<br />**Chứng minh:** phân giải nhánh phát hành, thẻ hoặc SHA commit đầy đủ và ghi lại các đầu vào đã chọn.<br />**Chạy lại:** chạy lại workflow bao quát nếu bước này thất bại.                                                                                                                                                                                                                                                                                  |
| Ứng viên dùng chung     | **Job:** `Prepare shared release candidate`<br />**Workflow con:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Chứng minh:** đóng gói và xác thực một gói theo SHA chính xác, xây dựng một ảnh Docker hoạt động được, đồng thời ghi lại các bộ artifact bất biến của gói và ảnh cho cả hai workflow con hướng tới gói.<br />**Chạy lại:** chạy lại nhóm gói, plugin-prerelease, đa hệ điều hành hoặc live/E2E bị ảnh hưởng.                                                                       |
| Kiểm tra trước tài sản Docker | **Job:** `Verify Docker runtime image assets`<br />**Workflow con:** không có<br />**Chứng minh:** đích bản dựng Docker `runtime-assets` vẫn thành công trước khi bất kỳ giai đoạn nào khác được kích hoạt. Chỉ chạy cho `rerun_group=all`.<br />**Chạy lại:** chạy lại workflow bao quát với `rerun_group=all`.                                                                                                                                                                                                                 |
| Vitest và CI thông thường | **Job:** `Run normal full CI`<br />**Workflow con:** `CI`<br />**Chứng minh:** đồ thị CI đầy đủ thủ công đối với ref đích, bao gồm các lane Linux Node, các shard Plugin đi kèm, các shard hợp đồng Plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra smoke artifact đã xây dựng, kiểm tra tài liệu, Skills Python, Windows, macOS, i18n của Control UI và Android thông qua workflow bao quát.<br />**Chạy lại:** `rerun_group=ci`. |
| Plugin tiền phát hành   | **Job:** `Run plugin prerelease validation`<br />**Workflow con:** `Plugin Prerelease`<br />**Chứng minh:** các kiểm tra tĩnh Plugin chỉ dành cho phát hành, độ bao phủ Plugin có tính agent, toàn bộ shard lô Plugin, các lane Docker tiền phát hành Plugin và một artifact `plugin-inspector-advisory` không chặn để phân loại tương thích.<br />**Chạy lại:** `rerun_group=plugin-prerelease`.                                                                                                                               |
| Kiểm tra bản phát hành  | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow con:** `OpenClaw Release Checks`<br />**Chứng minh:** kiểm tra smoke cài đặt, kiểm tra gói đa hệ điều hành, Package Acceptance, tính tương đương của QA Lab, Matrix và Telegram live, cùng các lane tư vấn Discord, WhatsApp và Slack có cổng. Các cấu hình stable và full cũng chạy các bộ live/E2E toàn diện và các đoạn Docker theo đường dẫn phát hành; beta có thể bật bằng `run_release_soak=true`.<br />**Chạy lại:** `rerun_group=release-checks` hoặc một bộ xử lý kiểm tra bản phát hành hẹp hơn. |
| Telegram theo gói       | **Job:** `Run package Telegram E2E`<br />**Workflow con:** `NPM Telegram Beta E2E`<br />**Chứng minh:** E2E Telegram tập trung cho gói đã phát hành khi đặt `release_package_spec` hoặc `npm_telegram_package_spec`. Quá trình xác thực đầy đủ ứng viên sử dụng E2E Telegram chuẩn tắc của Package Acceptance thay thế.<br />**Chạy lại:** `rerun_group=npm-telegram` với `release_package_spec` hoặc `npm_telegram_package_spec`.                                                                                 |
| Hiệu năng sản phẩm      | **Job:** `Run product performance evidence`<br />**Workflow con:** `OpenClaw Performance`<br />**Chứng minh:** lượt chạy hiệu năng theo cấu hình phát hành (`profile=release`, `repeat=3`, `fail_on_regression=true`, `publish_reports=false`) đối với SHA đích. Đầu ra Kova vẫn nằm trong artifact workflow và workflow con phải chứng minh trình phát hành báo cáo của nó đã bị bỏ qua. Chỉ bắt buộc (có tính chặn) đối với `rerun_group=all` hoặc `rerun_group=performance`; không bắt buộc đối với các nhóm chạy lại hẹp hơn.<br />**Chạy lại:** `rerun_group=performance`. |
| Trình xác minh bao quát | **Job:** `Verify full validation`<br />**Workflow con:** không có<br />**Chứng minh:** kiểm tra lại các kết luận của lượt chạy con đã ghi nhận và nối thêm bảng các job chậm nhất từ workflow con.<br />**Chạy lại:** chỉ chạy lại job này sau khi chạy lại workflow con thất bại đến trạng thái xanh.                                                                                                                                                                                                                                       |

Workflow bao quát luôn kích hoạt hiệu năng sản phẩm ở chế độ chỉ artifact.
`OpenClaw Performance` chỉ cho phép phát hành báo cáo đối với các lượt chạy theo lịch hoặc một
lần kích hoạt thủ công đặt rõ ràng `publish_reports=true`. Bộ bảo vệ chỉ artifact
phải hoàn tất thành công, chứng minh job phát hành vẫn bị bỏ qua.
Bằng chứng mới và được tái sử dụng ghi lại
`controls.performanceReportPublication=artifact-only`; trình xác minh và bộ chọn tái sử dụng
từ chối bằng chứng không có minh chứng workflow con về hiệu năng đã chuẩn hóa tương ứng.

Trình xác minh tải manifest chuẩn tắc lên dưới tên
`full-release-validation-<run-id>-<run-attempt>`. Công cụ bằng chứng xác thực
ID artifact, digest, lượt chạy tạo ra và lần thử trước khi tải xuống chính xác
ID artifact đó. Công cụ giới hạn kích thước ZIP tải xuống, xác minh byte của nó dựa trên digest
`sha256:` của REST và truyền trực tuyến mục manifest bị giới hạn duy nhất được cho phép mà không
giải nén kho lưu trữ. Một bí danh tên ổn định được tạm thời duy trì cho các trình tiêu thụ
phát hành cũ hơn. Trình xác minh luôn ưu tiên artifact có định danh lần thử;
trong giai đoạn chuyển tiếp, nó chỉ chấp nhận tên ổn định cho trình tạo manifest v2 ở lần thử 1.
Nó từ chối tên cũ đó đối với các lần thử sau và manifest v3.

Đối với `ref=main` có `rerun_group=all`, đối với các ref `release/*`, và đối với các ref alpha của Tideclaw, một lượt chạy bao quát mới hơn sẽ thay thế lượt chạy cũ hơn có cùng ref và nhóm chạy lại. Khi luồng cha bị hủy, trình giám sát của nó sẽ hủy mọi workflow con mà nó đã điều phối. Các lượt chạy xác thực thẻ và SHA cố định không hủy lẫn nhau.

## Các giai đoạn kiểm tra bản phát hành

`OpenClaw Release Checks` là workflow con lớn nhất. Nó phân giải mục tiêu một lần và xác thực artifact gói dùng chung của lượt chạy bao quát khi có. Một lượt điều phối trực tiếp hoặc tập trung sẽ chuẩn bị artifact `release-package-under-test` riêng khi các giai đoạn liên quan đến gói hoặc Docker cần đến.

| Giai đoạn                    | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu phát hành           | **Tác vụ:** `Resolve target ref`<br />**Workflow hỗ trợ:** không có<br />**Kiểm thử:** ref đã chọn, SHA dự kiến tùy chọn, hồ sơ, nhóm chạy lại và bộ lọc bộ kiểm thử trực tiếp tập trung.<br />**Chạy lại:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                                                                                                             |
| Artifact gói         | **Tác vụ:** `Prepare release package artifact`<br />**Workflow hỗ trợ:** không có<br />**Kiểm thử:** xác thực bộ giá trị gói bất biến của lượt chạy bao quát, hoặc đóng gói một tarball ứng viên cho lượt điều phối Kiểm tra bản phát hành trực tiếp/tập trung, sau đó cung cấp nó cho các bước kiểm tra liên quan đến gói ở hạ nguồn.<br />**Chạy lại:** nhóm gói, đa hệ điều hành hoặc trực tiếp/E2E bị ảnh hưởng.                                                                                                                                                                                                                                |
| Kiểm tra nhanh cài đặt            | **Tác vụ:** `Run install smoke`<br />**Workflow hỗ trợ:** `Install Smoke`<br />**Kiểm thử:** toàn bộ đường dẫn cài đặt với việc tái sử dụng image kiểm tra nhanh Dockerfile gốc, cài đặt gói QR, kiểm tra nhanh Docker cho gốc và Gateway, kiểm thử Docker cho trình cài đặt và kiểm tra nhanh nhà cung cấp image bằng cài đặt toàn cục Bun.<br />**Chạy lại:** `rerun_group=install-smoke`.                                                                                                                                                                                                                                                           |
| Đa hệ điều hành                 | **Tác vụ:** `cross_os_release_checks`<br />**Workflow hỗ trợ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Kiểm thử:** các luồng cài mới và nâng cấp trên Linux, Windows và macOS cho nhà cung cấp và chế độ đã chọn, sử dụng tarball ứng viên cùng một gói cơ sở.<br />**Chạy lại:** `rerun_group=cross-os`.                                                                                                                                                                                                                                                                 |
| E2E kho mã nguồn và trực tiếp        | **Tác vụ:** `Run repo/live E2E validation`<br />**Workflow hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** E2E kho mã nguồn, bộ nhớ đệm trực tiếp, truyền phát websocket OpenAI, các phân đoạn nhà cung cấp trực tiếp gốc và Plugin, cùng các bộ kiểm thử mô hình/backend/gateway trực tiếp dựa trên Docker được chọn bởi `release_profile`.<br />**Chạy:** `run_release_soak=true`, `release_profile=full` hoặc `rerun_group=live-e2e` tập trung.<br />**Chạy lại:** `rerun_group=live-e2e`, tùy chọn với `live_suite_filter`.                                                                                |
| Đường dẫn phát hành Docker      | **Tác vụ:** `Run Docker release-path validation`<br />**Workflow hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** các phân đoạn Docker của đường dẫn phát hành dựa trên artifact gói dùng chung.<br />**Chạy:** `run_release_soak=true`, `release_profile=full` hoặc `rerun_group=live-e2e` tập trung.<br />**Chạy lại:** `rerun_group=live-e2e`.                                                                                                                                                                                                                                     |
| Kiểm định gói       | **Tác vụ:** `Run package acceptance`<br />**Workflow hỗ trợ:** `Package Acceptance`<br />**Kiểm thử:** các fixture gói Plugin ngoại tuyến, cập nhật Plugin, E2E gói Telegram mô phỏng OpenAI chuẩn và các bước kiểm tra khả năng tồn tại sau nâng cấp từ bản đã phát hành dựa trên cùng một tarball. Các bước kiểm tra bản phát hành có tính chặn sử dụng bản cơ sở được phát hành mới nhất theo mặc định; các bước kiểm tra ngâm tải (`run_release_soak=true`) mở rộng sang 4 bản phát hành npm ổn định gần nhất cùng 3 phiên bản lịch sử cố định (`2026.4.23`, `2026.5.2`, `2026.4.15`), chạy dựa trên các fixture nâng cấp của sự cố đã báo cáo.<br />**Chạy lại:** `rerun_group=package`. |
| Bảng điểm mức độ trưởng thành       | **Tác vụ:** `Render maturity scorecard release docs`<br />**Workflow hỗ trợ:** `maturity-scorecard.yml`<br />**Kiểm thử:** kết xuất tài liệu bảng điểm mức độ trưởng thành mang tính tư vấn dựa trên ref mục tiêu. Chỉ chạy khi truyền `run_maturity_scorecard=true`.<br />**Chạy lại:** `rerun_group=qa` với `run_maturity_scorecard=true`.                                                                                                                                                                                                                                                           |
| Tính tương đương QA                | **Tác vụ:** `Run QA Lab parity lane` và `Run QA Lab parity report`<br />**Workflow hỗ trợ:** các tác vụ trực tiếp<br />**Kiểm thử:** các gói kiểm tra tính tương đương tác tử của ứng viên và bản cơ sở, sau đó là báo cáo tính tương đương.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                         |
| Tính tương đương runtime QA        | **Tác vụ:** `Run QA Lab runtime parity lane`<br />**Workflow hỗ trợ:** tác vụ trực tiếp<br />**Kiểm thử:** một luồng kiểm tra tính tương đương tác tử theo cặp runtime `openclaw`/`codex` (`pnpm openclaw qa suite --runtime-pair openclaw,codex`), bao gồm một cấp tiêu chuẩn và, với `run_release_soak=true`, một cấp ngâm tải. Mang tính tư vấn: các lỗi riêng lẻ không chặn trình xác minh kiểm tra bản phát hành.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                                                    |
| Độ phủ công cụ runtime QA | **Tác vụ:** `Enforce QA Lab runtime tool coverage`<br />**Workflow hỗ trợ:** tác vụ trực tiếp<br />**Kiểm thử:** độ lệch công cụ động giữa `openclaw` và `codex` trong cấp tương đương runtime tiêu chuẩn (`pnpm openclaw qa coverage --tools`), sử dụng đầu ra của luồng kiểm tra tính tương đương runtime QA. Có tính chặn: tác vụ này không thể bị ghi đè thành tư vấn.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                                                                                        |
| Matrix trực tiếp QA           | **Tác vụ:** `Run QA Live Matrix profile`<br />**Workflow hỗ trợ:** workflow có thể tái sử dụng `QA-Lab - All Lanes`<br />**Kiểm thử:** các kịch bản YAML đã được chứng minh tính tương đương thông qua bộ điều hợp Matrix trực tiếp dùng chung trong môi trường `qa-live-shared`.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`; sử dụng `live_suite_filter=qa-live-matrix` để chạy lại Matrix tập trung.                                                                                                                                                                                                                    |
| Telegram trực tiếp QA         | **Tác vụ:** `Run QA Lab live Telegram lane`<br />**Workflow hỗ trợ:** lượt điều phối `OpenClaw Release Telegram QA` đáng tin cậy<br />**Kiểm thử:** QA Telegram trực tiếp với các hợp đồng thuê thông tin xác thực CI của Convex.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                                                                                                                                                                 |
| Discord trực tiếp QA          | **Tác vụ:** `Run QA Lab live Discord lane`<br />**Workflow hỗ trợ:** tác vụ tư vấn trực tiếp<br />**Kiểm thử:** QA Discord trực tiếp với các hợp đồng thuê thông tin xác thực CI của Convex khi `OPENCLAW_RELEASE_QA_DISCORD_LIVE_CI_ENABLED` được bật.<br />**Chạy lại:** `rerun_group=qa-live` với `live_suite_filter=qa-live-discord`.                                                                                                                                                                                                                                                                            |
| WhatsApp trực tiếp QA         | **Tác vụ:** `Run QA Lab live WhatsApp lane`<br />**Workflow hỗ trợ:** tác vụ tư vấn trực tiếp<br />**Kiểm thử:** QA WhatsApp trực tiếp với các hợp đồng thuê thông tin xác thực CI của Convex khi `OPENCLAW_RELEASE_QA_WHATSAPP_LIVE_CI_ENABLED` được bật.<br />**Chạy lại:** `rerun_group=qa-live` với `live_suite_filter=qa-live-whatsapp`.                                                                                                                                                                                                                                                                        |
| Slack trực tiếp QA            | **Tác vụ:** `Run QA Lab live Slack lane`<br />**Workflow hỗ trợ:** tác vụ tư vấn trực tiếp<br />**Kiểm thử:** QA Slack trực tiếp với các hợp đồng thuê thông tin xác thực CI của Convex khi `OPENCLAW_RELEASE_QA_SLACK_LIVE_CI_ENABLED` được bật.<br />**Chạy lại:** `rerun_group=qa-live` với `live_suite_filter=qa-live-slack`.                                                                                                                                                                                                                                                                                    |
| Trình xác minh bản phát hành         | **Tác vụ:** `Verify release checks`<br />**Workflow hỗ trợ:** không có<br />**Kiểm thử:** các tác vụ kiểm tra bản phát hành bắt buộc cho nhóm chạy lại đã chọn.<br />**Chạy lại:** chạy lại sau khi các tác vụ con tập trung vượt qua.                                                                                                                                                                                                                                                                                                                                                                                   |

## Các phân đoạn đường dẫn phát hành Docker

Giai đoạn đường dẫn phát hành Docker chạy các phân đoạn này khi `live_suite_filter` trống:

| Phân đoạn                                                        | Phạm vi bao phủ                                                                                                                                                |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Các lane kiểm tra nhanh đường dẫn phát hành Docker cốt lõi.                                                                                                    |
| `package-update-openai`                                         | Hành vi cài đặt/cập nhật gói OpenAI, cài đặt Codex theo yêu cầu, theo dõi tiến trình trực tiếp của plugin Codex và các lệnh gọi công cụ Chat Completions. |
| `package-update-anthropic`                                      | Hành vi cài đặt và cập nhật gói Anthropic.                                                                                                                      |
| `package-update-core`                                           | Hành vi gói và cập nhật trung lập với nhà cung cấp.                                                                                                             |
| `plugins-runtime-plugins`                                       | Các lane runtime Plugin thực thi hành vi plugin.                                                                                                                |
| `plugins-runtime-services`                                      | Các lane runtime Plugin có dịch vụ hỗ trợ và trực tiếp.                                                                                                         |
| `plugins-runtime-install-a` đến `plugins-runtime-install-h` | Các lô cài đặt/runtime Plugin được chia để xác thực bản phát hành song song.                                                                                     |
| `openwebui`                                                     | Kiểm tra nhanh khả năng tương thích OpenWebUI được cô lập trên một runner chuyên dụng có đĩa lớn khi được yêu cầu.                                               |

Sử dụng `docker_lanes=<lane[,lane]>` có mục tiêu trên quy trình trực tiếp/E2E có thể tái sử dụng khi
chỉ một lane Docker thất bại. Các artifact phát hành bao gồm lệnh chạy lại theo từng lane
với đầu vào tái sử dụng artifact gói và image khi có sẵn.

## Hồ sơ phát hành

`release_profile` chủ yếu kiểm soát phạm vi trực tiếp/nhà cung cấp trong các bước kiểm tra phát hành.
Nó không loại bỏ CI đầy đủ thông thường, Bản phát hành trước Plugin, kiểm tra nhanh cài đặt, chấp nhận
gói hoặc QA Lab. Hồ sơ ổn định và đầy đủ luôn chạy phạm vi E2E repo/trực tiếp toàn diện
và kiểm thử kéo dài đường dẫn phát hành Docker. Hồ sơ beta có thể chọn tham gia bằng
`run_release_soak=true`. Chấp nhận gói cung cấp E2E Telegram gói chuẩn
cho mọi ứng viên đầy đủ, vì vậy quy trình tổng không chạy trùng trình thăm dò trực tiếp đó.

| Hồ sơ  | Mục đích sử dụng                      | Phạm vi trực tiếp/nhà cung cấp được bao gồm                                                                                                                                                                            |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `beta`   | Kiểm tra nhanh thiết yếu cho phát hành nhanh nhất.   | Đường dẫn trực tiếp OpenAI/cốt lõi, các mô hình trực tiếp Docker cho OpenAI, cốt lõi Gateway gốc, hồ sơ Gateway OpenAI gốc, plugin OpenAI gốc và Gateway OpenAI trực tiếp trên Docker.                                            |
| `stable` | Hồ sơ phê duyệt phát hành mặc định. | `beta` cộng với kiểm tra nhanh Anthropic, Google, MiniMax, backend, bộ kiểm thử trực tiếp gốc, backend CLI trực tiếp Docker, liên kết ACP Docker, bộ kiểm thử Codex Docker, thông báo subagent Docker và một shard kiểm tra nhanh OpenCode Go. |
| `full`   | Đợt rà soát tư vấn diện rộng.             | `stable` cộng với các nhà cung cấp tư vấn, các shard trực tiếp plugin và các shard media trực tiếp.                                                                                                                               |

## Các phần bổ sung chỉ dành cho hồ sơ đầy đủ

Các bộ kiểm thử này bị bỏ qua bởi `stable` và được bao gồm bởi `full`:

| Khu vực                             | Phạm vi chỉ dành cho hồ sơ đầy đủ                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Các mô hình trực tiếp Docker               | OpenCode Go, OpenRouter, xAI, Z.ai và Fireworks.                                                                          |
| Gateway trực tiếp Docker              | Các nhà cung cấp tư vấn được chia thành các shard DeepSeek/Fireworks, OpenCode Go/OpenRouter và xAI/Z.ai.                              |
| Hồ sơ nhà cung cấp Gateway gốc | Các shard Anthropic Opus và Sonnet/Haiku đầy đủ, Fireworks, DeepSeek, các shard mô hình OpenCode Go đầy đủ, OpenRouter, xAI và Z.ai. |
| Các shard trực tiếp plugin gốc        | Plugin A-K, L-N, các plugin khác O-Z, Moonshot và xAI.                                                                             |
| Các shard media trực tiếp gốc         | Âm thanh, nhạc Google, nhạc MiniMax và các nhóm video A-D.                                                                   |

`stable` bao gồm `native-live-src-gateway-profiles-anthropic-smoke` và
`native-live-src-gateway-profiles-opencode-go-smoke`; thay vào đó, `full` sử dụng các shard
mô hình Anthropic và OpenCode Go rộng hơn. Các lần chạy lại có mục tiêu vẫn có thể sử dụng
các handle tổng hợp `native-live-src-gateway-profiles-anthropic` hoặc
`native-live-src-gateway-profiles-opencode-go`.

## Chạy lại có mục tiêu

Sử dụng `rerun_group` để tránh lặp lại các môi trường phát hành không liên quan:

| Handle              | Phạm vi                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Tất cả các giai đoạn Xác thực bản phát hành đầy đủ.                                                             |
| `ci`                | Chỉ quy trình con CI đầy đủ thủ công.                                                                      |
| `plugin-prerelease` | Chỉ quy trình con Bản phát hành trước Plugin.                                                                   |
| `release-checks`    | Tất cả các giai đoạn Kiểm tra bản phát hành OpenClaw.                                                             |
| `install-smoke`     | Từ Kiểm tra nhanh cài đặt đến các bước kiểm tra phát hành.                                                           |
| `cross-os`          | Các bước kiểm tra phát hành đa hệ điều hành.                                                                        |
| `live-e2e`          | E2E repo/trực tiếp và xác thực đường dẫn phát hành Docker.                                               |
| `package`           | Chấp nhận gói.                                                                             |
| `qa`                | Tính tương đương QA cộng với các lane QA trực tiếp.                                                                   |
| `qa-parity`         | Chỉ các lane tính tương đương QA và báo cáo.                                                                |
| `qa-live`           | Matrix/Telegram QA trực tiếp cộng với các lane Discord, WhatsApp và Slack có cổng kiểm soát khi được bật.             |
| `npm-telegram`      | E2E Telegram của gói đã phát hành; yêu cầu `release_package_spec` hoặc `npm_telegram_package_spec`. |
| `performance`       | Chỉ bằng chứng hiệu năng sản phẩm.                                                              |

Sử dụng `live_suite_filter` với `rerun_group=live-e2e` khi một bộ kiểm thử trực tiếp thất bại.
Các id bộ lọc hợp lệ được định nghĩa trong quy trình trực tiếp/E2E có thể tái sử dụng, bao gồm
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker` và
`live-codex-harness-docker`.

Để chạy lại có mục tiêu một phương thức vận chuyển QA, hãy đặt `rerun_group=qa-live` và sử dụng
bộ chọn chuẩn `qa-live-matrix`, `qa-live-telegram`, `qa-live-discord`,
`qa-live-whatsapp` hoặc `qa-live-slack`.

Handle `live-gateway-advisory-docker` là một handle chạy lại tổng hợp cho
ba shard nhà cung cấp của nó, vì vậy nó vẫn phân tán sang tất cả các job Gateway Docker tư vấn.

Sử dụng `cross_os_suite_filter` với `rerun_group=cross-os` khi một lane đa hệ điều hành
thất bại. Bộ lọc chấp nhận id hệ điều hành, id bộ kiểm thử hoặc một cặp hệ điều hành/bộ kiểm thử, ví dụ
`windows/packaged-upgrade`, `windows` hoặc `packaged-fresh`. Các bản tóm tắt đa hệ điều hành
bao gồm thời gian theo từng giai đoạn cho các lane nâng cấp gói, và các lệnh chạy lâu
in các dòng Heartbeat để có thể phát hiện bản cập nhật bị treo trước khi job
hết thời gian chờ.

Các lỗi kiểm tra phát hành QA chỉ chặn xác thực bản phát hành thông thường đối với các lane đã chọn
về phạm vi công cụ runtime Matrix, Telegram và QA. Tính tương đương QA, tính tương đương
runtime và các lane trực tiếp Discord, WhatsApp và Slack có cổng kiểm soát mang tính tư vấn và
phát hành artifact trạng thái mà không chặn trình xác minh bản phát hành. Các lần chạy alpha Tideclaw
vẫn có thể coi các lane kiểm tra phát hành không liên quan đến an toàn gói là mang tính tư vấn. Với
`release_profile=beta`, các bộ kiểm thử nhà cung cấp trực tiếp `Run repo/live E2E validation`
mang tính tư vấn: các triển khai mô hình bên thứ ba thay đổi bên dưới một bản phát hành, vì vậy
beta hiển thị lỗi của chúng dưới dạng cảnh báo, còn hồ sơ ổn định và đầy đủ vẫn
coi chúng là lỗi chặn. Khi
`live_suite_filter` yêu cầu rõ ràng một lane QA trực tiếp có cổng kiểm soát như Discord,
WhatsApp hoặc Slack, biến repo `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` tương ứng
phải được bật; nếu không, bước thu thập đầu vào sẽ thất bại thay vì âm thầm bỏ qua lane.
Chạy lại `rerun_group=qa`, `qa-parity` hoặc `qa-live` khi bạn
cần bằng chứng QA mới.

## Bằng chứng cần giữ lại

Giữ bản tóm tắt `Full Release Validation` làm chỉ mục cấp phát hành. Nó liên kết
các id lần chạy con và bao gồm các bảng job chậm nhất. Đối với lỗi, trước tiên hãy kiểm tra
quy trình con, sau đó chạy lại handle phù hợp nhỏ nhất ở trên.

Ghi lại cả Code SHA và Release SHA, chính sách tái sử dụng và tập hợp đường dẫn đã thay đổi,
lần chạy cha Code SHA thành công và lần chạy cha Release SHA gọn nhẹ.

Các artifact hữu ích:

- `release-package-under-test` từ `OpenClaw Release Checks`
- Các artifact đường dẫn phát hành Docker trong `.artifacts/docker-tests/`
- Artifact `package-under-test` của Chấp nhận gói và các artifact chấp nhận Docker
- Artifact kiểm tra phát hành đa hệ điều hành cho từng hệ điều hành và bộ kiểm thử
- Artifact tính tương đương QA, tính tương đương runtime và Matrix, Telegram, Discord, WhatsApp
  hoặc Slack đã chọn

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
