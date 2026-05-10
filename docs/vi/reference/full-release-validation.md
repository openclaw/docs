---
read_when:
    - Chạy hoặc chạy lại quy trình xác thực bản phát hành đầy đủ
    - So sánh các hồ sơ xác minh bản phát hành ổn định và đầy đủ
    - Gỡ lỗi các sự cố ở giai đoạn xác thực bản phát hành
summary: Các giai đoạn Xác thực phát hành đầy đủ, quy trình công việc con, hồ sơ phát hành, mã định danh chạy lại và bằng chứng
title: Xác thực bản phát hành đầy đủ
x-i18n:
    generated_at: "2026-05-10T19:50:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a479b2d79ae2710c501d583ad14f913a32382bba8dfd7ec9d25124357743e20
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` là quy trình bao trùm cho bản phát hành. Đây là điểm vào thủ công duy nhất cho bằng chứng trước phát hành, nhưng phần lớn công việc diễn ra trong các workflow con để một hộp bị lỗi có thể được chạy lại mà không cần khởi động lại toàn bộ bản phát hành.

Chạy workflow này từ một ref workflow đáng tin cậy, thường là `main`, và truyền nhánh phát hành, thẻ, hoặc SHA commit đầy đủ làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Các workflow con dùng ref workflow đáng tin cậy cho harness và input `ref` cho ứng viên đang được kiểm thử. Cách này giúp logic xác thực mới luôn sẵn có khi xác thực một nhánh hoặc thẻ phát hành cũ hơn.

Theo mặc định, `release_profile=stable` chạy các làn chặn phát hành và bỏ qua soak live/Docker đầy đủ. Truyền `run_release_soak=true` để đưa các làn soak vào một lần chạy stable. `release_profile=full` luôn bật các làn soak để hồ sơ tư vấn rộng không âm thầm mất phạm vi kiểm thử.

Chấp nhận gói thường dựng tarball ứng viên từ `ref` đã phân giải, bao gồm các lần chạy SHA đầy đủ được dispatch bằng `pnpm ci:full-release`. Sau khi publish, truyền `package_acceptance_package_spec=openclaw@YYYY.M.D` (hoặc `openclaw@beta`/`openclaw@latest`) để chạy cùng ma trận gói/cập nhật đó trên gói npm đã được phát hành.

## Các giai đoạn cấp cao nhất

| Giai đoạn            | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phân giải mục tiêu   | **Job:** `Resolve target ref`<br />**Workflow con:** không có<br />**Chứng minh:** phân giải nhánh phát hành, thẻ, hoặc SHA commit đầy đủ và ghi lại các input đã chọn.<br />**Chạy lại:** chạy lại workflow bao trùm nếu bước này lỗi.                                                                                                                                                                                                    |
| Vitest và CI thường  | **Job:** `Run normal full CI`<br />**Workflow con:** `CI`<br />**Chứng minh:** đồ thị CI đầy đủ thủ công trên ref mục tiêu, bao gồm các làn Linux Node, các shard Plugin đi kèm, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Python skills, Windows, macOS, i18n Control UI, và Android thông qua workflow bao trùm.<br />**Chạy lại:** `rerun_group=ci`. |
| Tiền phát hành Plugin | **Job:** `Run plugin prerelease validation`<br />**Workflow con:** `Plugin Prerelease`<br />**Chứng minh:** các kiểm tra tĩnh chỉ dành cho phát hành của Plugin, phạm vi kiểm thử Plugin tác tử, các shard batch tiện ích mở rộng đầy đủ, và các làn Docker tiền phát hành Plugin.<br />**Chạy lại:** `rerun_group=plugin-prerelease`.                                                                                                      |
| Kiểm tra phát hành   | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow con:** `OpenClaw Release Checks`<br />**Chứng minh:** smoke cài đặt, kiểm tra gói đa hệ điều hành, Chấp nhận gói, tương đương QA Lab, Matrix live, và Telegram live. Với `run_release_soak=true` hoặc `release_profile=full`, cũng chạy các bộ live/E2E đầy đủ và các phần đường dẫn phát hành Docker.<br />**Chạy lại:** `rerun_group=release-checks` hoặc một handle release-checks hẹp hơn. |
| Artifact gói         | **Job:** `Prepare release package artifact`<br />**Workflow con:** không có<br />**Chứng minh:** tạo tarball cha `release-package-under-test` đủ sớm cho các kiểm tra hướng tới gói không cần chờ `OpenClaw Release Checks`.<br />**Chạy lại:** chạy lại workflow bao trùm hoặc cung cấp `npm_telegram_package_spec` cho `rerun_group=npm-telegram`.                                                                                      |
| Gói Telegram         | **Job:** `Run package Telegram E2E`<br />**Workflow con:** `NPM Telegram Beta E2E`<br />**Chứng minh:** bằng chứng gói Telegram dựa trên artifact cha cho `rerun_group=all` với `release_profile=full`, hoặc bằng chứng Telegram của gói đã phát hành khi `npm_telegram_package_spec` được đặt.<br />**Chạy lại:** `rerun_group=npm-telegram` với `npm_telegram_package_spec`.                                                            |
| Bộ xác minh bao trùm | **Job:** `Verify full validation`<br />**Workflow con:** không có<br />**Chứng minh:** kiểm tra lại kết luận của các lần chạy con đã ghi nhận và thêm các bảng job chậm nhất từ workflow con.<br />**Chạy lại:** chỉ chạy lại job này sau khi chạy lại một workflow con bị lỗi cho đến khi xanh.                                                                                                                                              |

Với `ref=main` và `rerun_group=all`, một workflow bao trùm mới hơn sẽ thay thế workflow cũ hơn. Khi workflow cha bị hủy, trình giám sát của nó sẽ hủy mọi workflow con mà nó đã dispatch. Các lần chạy xác thực nhánh phát hành và thẻ không hủy lẫn nhau theo mặc định.

## Các giai đoạn kiểm tra phát hành

`OpenClaw Release Checks` là workflow con lớn nhất. Nó phân giải mục tiêu một lần và chuẩn bị artifact `release-package-under-test` dùng chung khi các giai đoạn hướng tới gói hoặc Docker cần đến.

| Giai đoạn           | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu phát hành  | **Công việc:** `Resolve target ref`<br />**Quy trình hỗ trợ:** không có<br />**Kiểm thử:** ref đã chọn, SHA kỳ vọng tùy chọn, hồ sơ, nhóm chạy lại và bộ lọc bộ kiểm thử live tập trung.<br />**Chạy lại:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                      |
| Hiện vật gói        | **Công việc:** `Prepare release package artifact`<br />**Quy trình hỗ trợ:** không có<br />**Kiểm thử:** đóng gói hoặc phân giải một tarball ứng viên và tải lên `release-package-under-test` cho các kiểm tra hạ nguồn đối diện với gói.<br />**Chạy lại:** gói bị ảnh hưởng, nhóm cross-OS hoặc live/E2E.                                                                                                                                                                                     |
| Smoke cài đặt       | **Công việc:** `Run install smoke`<br />**Quy trình hỗ trợ:** `Install Smoke`<br />**Kiểm thử:** đường dẫn cài đặt đầy đủ với việc tái sử dụng ảnh smoke Dockerfile gốc, cài đặt gói QR, các smoke Docker gốc và Gateway, kiểm thử Docker của trình cài đặt, smoke nhà cung cấp hình ảnh cài đặt toàn cục Bun, và E2E cài đặt/gỡ cài đặt Plugin đi kèm nhanh.<br />**Chạy lại:** `rerun_group=install-smoke`.                    |
| Cross-OS            | **Công việc:** `cross_os_release_checks`<br />**Quy trình hỗ trợ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Kiểm thử:** các luồng cài mới và nâng cấp trên Linux, Windows và macOS cho nhà cung cấp và chế độ đã chọn, dùng tarball ứng viên cộng với một gói baseline.<br />**Chạy lại:** `rerun_group=cross-os`.                                                                                                  |
| Repo và live E2E    | **Công việc:** `Run repo/live E2E validation`<br />**Quy trình hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** E2E kho mã nguồn, bộ nhớ đệm live, streaming websocket OpenAI, các shard nhà cung cấp live gốc và Plugin, cùng các harness mô hình/backend/Gateway live dựa trên Docker được chọn bởi `release_profile`.<br />**Chạy:** `run_release_soak=true`, `release_profile=full`, hoặc `rerun_group=live-e2e` tập trung.<br />**Chạy lại:** `rerun_group=live-e2e`, tùy chọn với `live_suite_filter`. |
| Đường dẫn phát hành Docker | **Công việc:** `Run Docker release-path validation`<br />**Quy trình hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** các chunk Docker đường dẫn phát hành dựa trên hiện vật gói dùng chung.<br />**Chạy:** `run_release_soak=true`, `release_profile=full`, hoặc `rerun_group=live-e2e` tập trung.<br />**Chạy lại:** `rerun_group=live-e2e`.                                                                 |
| Package Acceptance  | **Công việc:** `Run package acceptance`<br />**Quy trình hỗ trợ:** `Package Acceptance`<br />**Kiểm thử:** fixture gói Plugin ngoại tuyến, cập nhật Plugin, chấp nhận gói Telegram OpenAI giả lập, và kiểm tra sống sót sau nâng cấp đã phát hành đối với cùng tarball. Các kiểm tra phát hành chặn dùng baseline đã phát hành mới nhất theo mặc định; kiểm tra soak mở rộng tới mọi bản phát hành npm ổn định tại hoặc sau `2026.4.23` cộng với các fixture sự cố đã báo cáo.<br />**Chạy lại:** `rerun_group=package`. |
| Tương đồng QA       | **Công việc:** `Run QA Lab parity lane` và `Run QA Lab parity report`<br />**Quy trình hỗ trợ:** công việc trực tiếp<br />**Kiểm thử:** các gói tương đồng agentic ứng viên và baseline, sau đó là báo cáo tương đồng.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                                                  |
| QA live Matrix      | **Công việc:** `Run QA Lab live Matrix lane`<br />**Quy trình hỗ trợ:** công việc trực tiếp<br />**Kiểm thử:** hồ sơ QA Matrix live nhanh trong môi trường `qa-live-shared`.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                         |
| QA live Telegram    | **Công việc:** `Run QA Lab live Telegram lane`<br />**Quy trình hỗ trợ:** công việc trực tiếp<br />**Kiểm thử:** QA Telegram live với các lease thông tin xác thực Convex CI.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                      |
| Trình xác minh phát hành | **Công việc:** `Verify release checks`<br />**Quy trình hỗ trợ:** không có<br />**Kiểm thử:** các công việc kiểm tra phát hành bắt buộc cho nhóm chạy lại đã chọn.<br />**Chạy lại:** chạy lại sau khi các công việc con tập trung đạt.                                                                                                                                                                                           |

## Các chunk đường dẫn phát hành Docker

Giai đoạn đường dẫn phát hành Docker chạy các chunk này khi `live_suite_filter`
trống:

| Chunk                                                           | Phạm vi bao phủ                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `core`                                                          | Các luồng smoke đường dẫn phát hành Docker lõi.                                  |
| `package-update-openai`                                         | Hành vi cài đặt/cập nhật gói OpenAI, bao gồm cài đặt Codex theo nhu cầu.         |
| `package-update-anthropic`                                      | Hành vi cài đặt và cập nhật gói Anthropic.                                       |
| `package-update-core`                                           | Hành vi gói và cập nhật trung lập với nhà cung cấp.                              |
| `plugins-runtime-plugins`                                       | Các luồng runtime Plugin thực thi hành vi Plugin.                                |
| `plugins-runtime-services`                                      | Các luồng runtime Plugin dựa trên dịch vụ và live; bao gồm OpenWebUI khi được yêu cầu. |
| `plugins-runtime-install-a` đến `plugins-runtime-install-h`     | Các lô cài đặt/runtime Plugin được chia để xác thực phát hành song song.         |

Dùng `docker_lanes=<lane[,lane]>` có mục tiêu trên quy trình live/E2E tái sử dụng khi
chỉ một luồng Docker thất bại. Các hiện vật phát hành bao gồm lệnh chạy lại theo từng luồng
với đầu vào hiện vật gói và tái sử dụng hình ảnh khi có sẵn.

## Hồ sơ phát hành

`release_profile` chủ yếu kiểm soát độ rộng live/nhà cung cấp bên trong các kiểm tra phát hành.
Nó không loại bỏ CI đầy đủ thông thường, Plugin Prerelease, smoke cài đặt, chấp nhận gói,
hoặc QA Lab. Với `stable`, E2E repo/live toàn diện và các chunk
đường dẫn phát hành Docker là phạm vi soak và chạy khi `run_release_soak=true`.
`full` bắt buộc bật phạm vi soak và cũng khiến lượt chạy ô dù chạy E2E gói Telegram
dựa trên hiện vật gói phát hành cha khi `rerun_group=all`, để một ứng viên
trước khi phát hành đầy đủ không âm thầm bỏ qua luồng gói Telegram đó.

| Hồ sơ     | Mục đích sử dụng                  | Phạm vi live/nhà cung cấp được bao gồm                                                                                                                                             |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke phát hành quan trọng nhanh nhất. | Đường dẫn live OpenAI/lõi, mô hình live Docker cho OpenAI, lõi Gateway gốc, hồ sơ Gateway OpenAI gốc, Plugin OpenAI gốc, và Gateway OpenAI live Docker.                         |
| `stable`  | Hồ sơ phê duyệt phát hành mặc định. | `minimum` cộng với smoke Anthropic, Google, MiniMax, backend, harness kiểm thử live gốc, backend CLI live Docker, liên kết Docker ACP, harness Docker Codex, và một shard smoke OpenCode Go. |
| `full`    | Quét tư vấn rộng.                 | `stable` cộng với các nhà cung cấp tư vấn, các shard live Plugin, và các shard live media.                                                                                         |

## Phần bổ sung chỉ dành cho full

Các bộ kiểm thử này bị bỏ qua bởi `stable` và được bao gồm bởi `full`:

| Khu vực                          | Phạm vi chỉ dành cho full                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Mô hình live Docker              | OpenCode Go, OpenRouter, xAI, Z.ai, và Fireworks.                                                                       |
| Gateway live Docker              | Các nhà cung cấp tư vấn được chia thành các shard DeepSeek/Fireworks, OpenCode Go/OpenRouter, và xAI/Z.ai.              |
| Hồ sơ nhà cung cấp Gateway gốc   | Các shard Anthropic Opus và Sonnet/Haiku đầy đủ, Fireworks, DeepSeek, các shard mô hình OpenCode Go đầy đủ, OpenRouter, xAI, và Z.ai. |
| Shard live Plugin gốc            | Plugins A-K, L-N, O-Z khác, Moonshot, và xAI.                                                                           |
| Shard live media gốc             | Âm thanh, nhạc Google, nhạc MiniMax, và các nhóm video A-D.                                                             |

`stable` bao gồm `native-live-src-gateway-profiles-anthropic-smoke` và
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` dùng các shard
mô hình Anthropic và OpenCode Go rộng hơn thay vào đó. Các lần chạy lại tập trung vẫn có thể dùng các
handle tổng hợp `native-live-src-gateway-profiles-anthropic` hoặc
`native-live-src-gateway-profiles-opencode-go`.

## Chạy lại tập trung

Dùng `rerun_group` để tránh lặp lại các hộp phát hành không liên quan:

| Định danh           | Phạm vi                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tất cả các giai đoạn Xác thực bản phát hành đầy đủ.                  |
| `ci`                | Chỉ workflow con CI đầy đủ thủ công.                                  |
| `plugin-prerelease` | Chỉ workflow con Tiền phát hành Plugin.                               |
| `release-checks`    | Tất cả các giai đoạn Kiểm tra bản phát hành OpenClaw.                 |
| `install-smoke`     | Kiểm thử nhanh cài đặt qua các kiểm tra bản phát hành.                |
| `cross-os`          | Kiểm tra bản phát hành đa hệ điều hành.                               |
| `live-e2e`          | Xác thực E2E repo/live và đường dẫn phát hành Docker.                 |
| `package`           | Chấp nhận gói.                                                        |
| `qa`                | Tương đương QA cộng với các làn QA live.                              |
| `qa-parity`         | Chỉ các làn tương đương QA và báo cáo.                                |
| `qa-live`           | Chỉ Matrix QA live và Telegram.                                       |
| `npm-telegram`      | E2E Telegram cho gói đã phát hành; yêu cầu `npm_telegram_package_spec`. |

Dùng `live_suite_filter` với `rerun_group=live-e2e` khi một bộ kiểm thử live bị lỗi.
Các id bộ lọc hợp lệ được định nghĩa trong workflow live/E2E có thể tái sử dụng, bao gồm
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, và
`live-codex-harness-docker`.

Định danh `live-gateway-advisory-docker` là định danh chạy lại tổng hợp cho ba shard nhà cung cấp của nó, vì vậy nó vẫn phân tán ra tất cả các job Docker gateway advisory.

Dùng `cross_os_suite_filter` với `rerun_group=cross-os` khi một làn đa hệ điều hành bị lỗi. Bộ lọc chấp nhận id hệ điều hành, id bộ kiểm thử, hoặc cặp hệ điều hành/bộ kiểm thử, ví dụ `windows/packaged-upgrade`, `windows`, hoặc `packaged-fresh`. Các bản tóm tắt đa hệ điều hành bao gồm thời lượng theo từng pha cho các làn nâng cấp đóng gói, và các lệnh chạy lâu in các dòng Heartbeat để có thể thấy một bản cập nhật Windows bị kẹt trước khi job hết thời gian chờ.

Các làn kiểm tra bản phát hành QA là khuyến nghị. Lỗi chỉ QA được báo cáo dưới dạng cảnh báo và không chặn trình xác minh kiểm tra bản phát hành; chạy lại `rerun_group=qa`, `qa-parity`, hoặc `qa-live` khi bạn cần bằng chứng QA mới.

## Bằng chứng cần giữ

Giữ bản tóm tắt `Full Release Validation` làm chỉ mục cấp bản phát hành. Nó liên kết các id lần chạy con và bao gồm các bảng job chậm nhất. Với lỗi, hãy kiểm tra workflow con trước, rồi chạy lại định danh khớp nhỏ nhất ở trên.

Các artifact hữu ích:

- `release-package-under-test` từ cha Xác thực bản phát hành đầy đủ và `OpenClaw Release Checks`
- Artifact đường dẫn phát hành Docker trong `.artifacts/docker-tests/`
- `package-under-test` của Chấp nhận gói và các artifact chấp nhận Docker
- Artifact kiểm tra bản phát hành đa hệ điều hành cho từng hệ điều hành và bộ kiểm thử
- Artifact tương đương QA, Matrix và Telegram

## Tệp workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
