---
read_when:
    - Chạy hoặc chạy lại quy trình xác thực bản phát hành đầy đủ
    - So sánh các hồ sơ kiểm chứng bản phát hành ổn định và đầy đủ
    - Gỡ lỗi các lỗi trong giai đoạn xác thực bản phát hành
summary: Các giai đoạn Xác thực phát hành đầy đủ, quy trình làm việc con, hồ sơ phát hành, mã định danh chạy lại và bằng chứng
title: Xác thực đầy đủ bản phát hành
x-i18n:
    generated_at: "2026-05-05T01:50:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cf696761f516fc7f8e9606a2a06fab61a644731330eb484a388f276767a9e0d
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` là workflow bao trùm cho phát hành. Đây là điểm vào thủ công duy nhất cho bằng chứng tiền phát hành, nhưng phần lớn công việc diễn ra trong các workflow con để một mục thất bại có thể được chạy lại mà không phải khởi động lại toàn bộ bản phát hành.

Chạy nó từ một ref workflow đáng tin cậy, thường là `main`, và truyền nhánh phát hành, tag hoặc SHA commit đầy đủ làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Các workflow con dùng ref workflow đáng tin cậy cho harness và `ref` đầu vào cho ứng viên đang được kiểm thử. Điều đó giúp logic xác thực mới vẫn khả dụng khi xác thực một nhánh phát hành hoặc tag cũ hơn.

Theo mặc định, `release_profile=stable` chạy các lane chặn phát hành và bỏ qua phần soak live/Docker toàn diện. Truyền `run_release_soak=true` để bao gồm các lane soak trong một lần chạy ổn định. `release_profile=full` luôn bật các lane soak để hồ sơ tư vấn rộng không âm thầm mất phạm vi bao phủ.

Package Acceptance thường xây dựng tarball ứng viên từ `ref` đã phân giải, bao gồm các lần chạy SHA đầy đủ được điều phối bằng `pnpm ci:full-release`. Sau khi publish, truyền `package_acceptance_package_spec=openclaw@YYYY.M.D` (hoặc `openclaw@beta`/`openclaw@latest`) để chạy cùng ma trận package/update với package npm đã được phát hành thay thế.

## Các giai đoạn cấp cao nhất

| Giai đoạn            | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phân giải mục tiêu   | **Công việc:** `Resolve target ref`<br />**Workflow con:** không có<br />**Chứng minh:** phân giải nhánh phát hành, tag hoặc SHA commit đầy đủ và ghi lại các đầu vào đã chọn.<br />**Chạy lại:** chạy lại workflow bao trùm nếu bước này thất bại.                                                                                                                                                                                                           |
| Vitest và CI thường  | **Công việc:** `Run normal full CI`<br />**Workflow con:** `CI`<br />**Chứng minh:** đồ thị CI đầy đủ thủ công trên ref mục tiêu, bao gồm các lane Linux Node, shard Plugin được đóng gói, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Python skills, Windows, macOS, Control UI i18n và Android thông qua workflow bao trùm.<br />**Chạy lại:** `rerun_group=ci`.                               |
| Tiền phát hành Plugin | **Công việc:** `Run plugin prerelease validation`<br />**Workflow con:** `Plugin Prerelease`<br />**Chứng minh:** các kiểm tra tĩnh Plugin chỉ dành cho phát hành, phạm vi bao phủ Plugin agentic, các shard batch extension đầy đủ và các lane Docker tiền phát hành Plugin.<br />**Chạy lại:** `rerun_group=plugin-prerelease`.                                                                                                                            |
| Kiểm tra phát hành   | **Công việc:** `Run release/live/Docker/QA validation`<br />**Workflow con:** `OpenClaw Release Checks`<br />**Chứng minh:** smoke cài đặt, kiểm tra package đa hệ điều hành, Package Acceptance, tương đồng QA Lab, live Matrix và live Telegram. Với `run_release_soak=true` hoặc `release_profile=full`, cũng chạy các bộ live/E2E toàn diện và các đoạn đường dẫn phát hành Docker.<br />**Chạy lại:** `rerun_group=release-checks` hoặc một handle release-checks hẹp hơn. |
| Hiện vật package     | **Công việc:** `Prepare release package artifact`<br />**Workflow con:** không có<br />**Chứng minh:** tạo tarball cha `release-package-under-test` đủ sớm cho các kiểm tra hướng package không cần chờ `OpenClaw Release Checks`.<br />**Chạy lại:** chạy lại workflow bao trùm hoặc cung cấp `npm_telegram_package_spec` cho `rerun_group=npm-telegram`.                                                                                                  |
| Package Telegram     | **Công việc:** `Run package Telegram E2E`<br />**Workflow con:** `NPM Telegram Beta E2E`<br />**Chứng minh:** bằng chứng package Telegram dựa trên hiện vật cha cho `rerun_group=all` với `release_profile=full`, hoặc bằng chứng Telegram của package đã publish khi `npm_telegram_package_spec` được đặt.<br />**Chạy lại:** `rerun_group=npm-telegram` với `npm_telegram_package_spec`.                                                               |
| Bộ xác minh bao trùm | **Công việc:** `Verify full validation`<br />**Workflow con:** không có<br />**Chứng minh:** kiểm tra lại kết luận của các lần chạy con đã ghi lại và thêm bảng các job chậm nhất từ các workflow con.<br />**Chạy lại:** chỉ chạy lại job này sau khi chạy lại một workflow con thất bại đến khi xanh.                                                                                                                                                       |

Với `ref=main` và `rerun_group=all`, một workflow bao trùm mới hơn sẽ thay thế workflow cũ hơn. Khi parent bị hủy, trình giám sát của nó hủy mọi workflow con mà nó đã điều phối. Các lần chạy xác thực nhánh phát hành và tag mặc định không hủy lẫn nhau.

## Các giai đoạn kiểm tra phát hành

`OpenClaw Release Checks` là workflow con lớn nhất. Nó phân giải mục tiêu một lần và chuẩn bị một hiện vật `release-package-under-test` dùng chung khi các giai đoạn hướng package hoặc Docker cần đến.

| Giai đoạn           | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mục tiêu phát hành  | **Công việc:** `Resolve target ref`<br />**Quy trình công việc nền:** không có<br />**Kiểm thử:** ref đã chọn, SHA kỳ vọng tùy chọn, hồ sơ, nhóm chạy lại, và bộ lọc bộ kiểm thử trực tiếp có trọng tâm.<br />**Chạy lại:** `rerun_group=release-checks`.                                                                                                                                                                                                               |
| Tạo phẩm gói        | **Công việc:** `Prepare release package artifact`<br />**Quy trình công việc nền:** không có<br />**Kiểm thử:** đóng gói hoặc phân giải một tarball ứng viên và tải lên `release-package-under-test` cho các kiểm tra hướng đến gói ở hạ nguồn.<br />**Chạy lại:** gói bị ảnh hưởng, nhóm đa hệ điều hành, hoặc nhóm trực tiếp/E2E.                                                                                                                                 |
| Kiểm tra cài đặt    | **Công việc:** `Run install smoke`<br />**Quy trình công việc nền:** `Install Smoke`<br />**Kiểm thử:** đường dẫn cài đặt đầy đủ với việc tái sử dụng ảnh smoke Dockerfile gốc, cài đặt gói QR, smoke Docker gốc và Gateway, kiểm thử Docker của trình cài đặt, smoke provider ảnh cài đặt toàn cục Bun, và E2E cài đặt/gỡ cài đặt Plugin đi kèm nhanh.<br />**Chạy lại:** `rerun_group=install-smoke`.                                                          |
| Đa hệ điều hành     | **Công việc:** `cross_os_release_checks`<br />**Quy trình công việc nền:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Kiểm thử:** các luồng cài mới và nâng cấp trên Linux, Windows, và macOS cho provider và chế độ đã chọn, dùng tarball ứng viên cộng với gói baseline.<br />**Chạy lại:** `rerun_group=cross-os`.                                                                                                                                       |
| Repo và E2E trực tiếp | **Công việc:** `Run repo/live E2E validation`<br />**Quy trình công việc nền:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** E2E kho mã, cache trực tiếp, phát trực tuyến websocket OpenAI, các shard provider và Plugin trực tiếp bản địa, cùng các harness model/backend/Gateway trực tiếp dựa trên Docker được chọn bởi `release_profile`.<br />**Chạy:** `run_release_soak=true`, `release_profile=full`, hoặc `rerun_group=live-e2e` có trọng tâm.<br />**Chạy lại:** `rerun_group=live-e2e`, tùy chọn với `live_suite_filter`. |
| Đường dẫn phát hành Docker | **Công việc:** `Run Docker release-path validation`<br />**Quy trình công việc nền:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** các phần Docker theo đường dẫn phát hành chạy với tạo phẩm gói dùng chung.<br />**Chạy:** `run_release_soak=true`, `release_profile=full`, hoặc `rerun_group=live-e2e` có trọng tâm.<br />**Chạy lại:** `rerun_group=live-e2e`.                                                                                 |
| Chấp nhận gói       | **Công việc:** `Run package acceptance`<br />**Quy trình công việc nền:** `Package Acceptance`<br />**Kiểm thử:** fixture gói Plugin ngoại tuyến, cập nhật Plugin, chấp nhận gói Telegram mock-OpenAI, và kiểm tra sống sót sau nâng cấp đã phát hành với cùng tarball. Các kiểm tra phát hành chặn dùng baseline đã phát hành mới nhất theo mặc định; kiểm tra soak mở rộng sang mọi bản phát hành npm ổn định từ `2026.4.23` trở đi cộng với fixture vấn đề đã báo cáo.<br />**Chạy lại:** `rerun_group=package`. |
| Tương đồng QA       | **Công việc:** `Run QA Lab parity lane` và `Run QA Lab parity report`<br />**Quy trình công việc nền:** các công việc trực tiếp<br />**Kiểm thử:** các gói tương đồng agentic của ứng viên và baseline, sau đó là báo cáo tương đồng.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                                                              |
| Matrix trực tiếp QA | **Công việc:** `Run QA Lab live Matrix lane`<br />**Quy trình công việc nền:** công việc trực tiếp<br />**Kiểm thử:** hồ sơ QA Matrix trực tiếp nhanh trong môi trường `qa-live-shared`.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                                                 |
| Telegram trực tiếp QA | **Công việc:** `Run QA Lab live Telegram lane`<br />**Quy trình công việc nền:** công việc trực tiếp<br />**Kiểm thử:** QA Telegram trực tiếp với các lease thông tin xác thực Convex CI.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                                                |
| Trình xác minh phát hành | **Công việc:** `Verify release checks`<br />**Quy trình công việc nền:** không có<br />**Kiểm thử:** các công việc kiểm tra phát hành bắt buộc cho nhóm chạy lại đã chọn.<br />**Chạy lại:** chạy lại sau khi các công việc con có trọng tâm đã đạt.                                                                                                                                                                                                                  |

## Các phần đường dẫn phát hành Docker

Giai đoạn đường dẫn phát hành Docker chạy các phần này khi `live_suite_filter`
trống:

| Phần                                                            | Phạm vi bao phủ                                                        |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Các luồng smoke đường dẫn phát hành Docker lõi.                         |
| `package-update-openai`                                         | Hành vi cài đặt và cập nhật gói OpenAI.                                 |
| `package-update-anthropic`                                      | Hành vi cài đặt và cập nhật gói Anthropic.                              |
| `package-update-core`                                           | Hành vi gói và cập nhật trung lập với provider.                         |
| `plugins-runtime-plugins`                                       | Các luồng runtime Plugin kiểm tra hành vi Plugin.                       |
| `plugins-runtime-services`                                      | Các luồng runtime Plugin dựa trên dịch vụ; bao gồm OpenWebUI khi được yêu cầu. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Các batch cài đặt/runtime Plugin được tách để xác thực phát hành song song. |

Dùng `docker_lanes=<lane[,lane]>` có mục tiêu trên quy trình công việc trực tiếp/E2E tái sử dụng khi
chỉ một luồng Docker thất bại. Các tạo phẩm phát hành bao gồm lệnh chạy lại theo từng luồng
với đầu vào tạo phẩm gói và tái sử dụng ảnh khi có sẵn.

## Hồ sơ phát hành

`release_profile` chủ yếu điều khiển độ rộng trực tiếp/provider bên trong các kiểm tra phát hành.
Nó không loại bỏ CI đầy đủ thông thường, Plugin Prerelease, smoke cài đặt, chấp nhận gói,
hoặc QA Lab. Với `stable`, E2E repo/trực tiếp toàn diện và các phần đường dẫn phát hành
Docker là phạm vi soak và chạy khi `run_release_soak=true`.
`full` buộc bật phạm vi soak và cũng khiến lần chạy bao trùm chạy E2E Telegram gói
với tạo phẩm gói phát hành cha khi `rerun_group=all`, để một ứng viên đầy đủ
trước khi phát hành không âm thầm bỏ qua luồng gói Telegram đó.

| Hồ sơ    | Mục đích sử dụng                  | Phạm vi trực tiếp/provider được bao gồm                                                                                                                                             |
| -------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke phát hành quan trọng nhanh nhất. | Đường dẫn trực tiếp OpenAI/lõi, model trực tiếp Docker cho OpenAI, lõi Gateway bản địa, hồ sơ Gateway OpenAI bản địa, Plugin OpenAI bản địa, và Gateway OpenAI trực tiếp Docker. |
| `stable`  | Hồ sơ phê duyệt phát hành mặc định. | `minimum` cộng với smoke Anthropic, Google, MiniMax, backend, harness kiểm thử trực tiếp bản địa, backend CLI trực tiếp Docker, bind ACP Docker, harness Codex Docker, và một shard smoke OpenCode Go. |
| `full`    | Quét tư vấn diện rộng.            | `stable` cộng với các provider tư vấn, shard trực tiếp Plugin, và shard trực tiếp media.                                                                                           |

## Các bổ sung chỉ dành cho full

Các bộ này bị `stable` bỏ qua và được `full` bao gồm:

| Khu vực                          | Phạm vi chỉ dành cho full                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Model trực tiếp Docker           | OpenCode Go, OpenRouter, xAI, Z.ai, và Fireworks.                                                                          |
| Gateway trực tiếp Docker         | Các provider tư vấn được tách thành shard DeepSeek/Fireworks, OpenCode Go/OpenRouter, và xAI/Z.ai.                         |
| Hồ sơ provider Gateway bản địa   | Các shard Anthropic Opus và Sonnet/Haiku đầy đủ, Fireworks, DeepSeek, shard model OpenCode Go đầy đủ, OpenRouter, xAI, và Z.ai. |
| Shard trực tiếp Plugin bản địa   | Plugins A-K, L-N, O-Z khác, Moonshot, và xAI.                                                                              |
| Shard trực tiếp media bản địa    | Audio, Google music, MiniMax music, và các nhóm video A-D.                                                                 |

`stable` bao gồm `native-live-src-gateway-profiles-anthropic-smoke` và
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` dùng các shard
model Anthropic và OpenCode Go rộng hơn thay vào đó. Các lần chạy lại có trọng tâm vẫn có thể dùng
handle tổng hợp `native-live-src-gateway-profiles-anthropic` hoặc
`native-live-src-gateway-profiles-opencode-go`.

## Chạy lại có trọng tâm

Dùng `rerun_group` để tránh lặp lại các hộp phát hành không liên quan:

| Bộ xử lý            | Phạm vi                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tất cả các giai đoạn Xác thực phát hành đầy đủ.                       |
| `ci`                | Chỉ CI đầy đủ thủ công dạng con.                                      |
| `plugin-prerelease` | Chỉ quy trình con tiền phát hành Plugin.                              |
| `release-checks`    | Tất cả các giai đoạn kiểm tra phát hành OpenClaw.                     |
| `install-smoke`     | Kiểm thử khói cài đặt thông qua kiểm tra phát hành.                   |
| `cross-os`          | Kiểm tra phát hành Cross-OS.                                          |
| `live-e2e`          | Xác thực E2E repo/live và đường dẫn phát hành Docker.                 |
| `package`           | Chấp nhận gói.                                                        |
| `qa`                | Tương đồng QA cộng với các lane QA trực tiếp.                         |
| `qa-parity`         | Chỉ các lane tương đồng QA và báo cáo.                                |
| `qa-live`           | Chỉ Matrix QA trực tiếp và Telegram.                                  |
| `npm-telegram`      | E2E Telegram cho gói đã phát hành; yêu cầu `npm_telegram_package_spec`. |

Dùng `live_suite_filter` với `rerun_group=live-e2e` khi một bộ kiểm thử trực tiếp thất bại.
Các id bộ lọc hợp lệ được định nghĩa trong workflow live/E2E có thể tái sử dụng, bao gồm
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, và
`live-codex-harness-docker`.

Bộ xử lý `live-gateway-advisory-docker` là bộ xử lý chạy lại tổng hợp cho
ba shard nhà cung cấp của nó, nên nó vẫn phân nhánh ra tất cả các job Gateway Docker advisory.

Dùng `cross_os_suite_filter` với `rerun_group=cross-os` khi một lane Cross-OS
thất bại. Bộ lọc chấp nhận một id hệ điều hành, một id bộ kiểm thử, hoặc một cặp hệ điều hành/bộ kiểm thử, ví dụ
`windows/packaged-upgrade`, `windows`, hoặc `packaged-fresh`. Các bản tóm tắt Cross-OS
bao gồm thời gian theo từng pha cho các lane nâng cấp dạng đóng gói, và các
lệnh chạy lâu in ra các dòng Heartbeat để một bản cập nhật Windows bị kẹt có thể được thấy trước khi
job hết thời gian chờ.

Các lane kiểm tra phát hành QA mang tính advisory. Lỗi chỉ thuộc QA được báo cáo dưới dạng cảnh báo
và không chặn trình xác minh kiểm tra phát hành; chạy lại `rerun_group=qa`,
`qa-parity`, hoặc `qa-live` khi bạn cần bằng chứng QA mới.

## Bằng chứng cần giữ

Giữ bản tóm tắt `Full Release Validation` làm chỉ mục cấp phát hành. Nó liên kết
các id lượt chạy con và bao gồm bảng các job chậm nhất. Khi có lỗi, kiểm tra workflow con trước,
rồi chạy lại bộ xử lý phù hợp nhỏ nhất ở trên.

Artifact hữu ích:

- `release-package-under-test` từ cha Xác thực phát hành đầy đủ và `OpenClaw Release Checks`
- Artifact đường dẫn phát hành Docker trong `.artifacts/docker-tests/`
- `package-under-test` của Chấp nhận gói và artifact chấp nhận Docker
- Artifact kiểm tra phát hành Cross-OS cho từng hệ điều hành và bộ kiểm thử
- Artifact tương đồng QA, Matrix, và Telegram

## Tệp workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
