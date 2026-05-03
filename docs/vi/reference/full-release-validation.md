---
read_when:
    - Chạy hoặc chạy lại quy trình xác thực bản phát hành đầy đủ
    - So sánh các hồ sơ xác thực bản phát hành ổn định và đầy đủ
    - Gỡ lỗi các lỗi ở giai đoạn xác thực bản phát hành
summary: Các giai đoạn xác thực phát hành đầy đủ, workflow con, hồ sơ phát hành, định danh chạy lại và bằng chứng
title: Xác thực bản phát hành đầy đủ
x-i18n:
    generated_at: "2026-05-03T21:35:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 038901ad751c00b35f69d7ec5caf74e577dcf2350d7658037c3ecc9ff5fab6d7
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` là ô kiểm chứng phát hành tổng quát. Đây là điểm vào thủ công duy nhất cho bằng chứng trước phát hành, nhưng phần lớn công việc diễn ra trong các workflow con để có thể chạy lại một box bị lỗi mà không phải khởi động lại toàn bộ bản phát hành.

Chạy nó từ một workflow ref đáng tin cậy, thường là `main`, và truyền nhánh phát hành, tag, hoặc commit SHA đầy đủ làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Các workflow con dùng workflow ref đáng tin cậy cho harness và dùng đầu vào `ref` cho ứng viên đang được kiểm thử. Điều đó giúp logic kiểm chứng mới luôn sẵn có khi kiểm chứng một nhánh phát hành hoặc tag cũ hơn.

Package Acceptance thường xây dựng tarball ứng viên từ `ref` đã phân giải, bao gồm các lần chạy full-SHA được dispatch bằng `pnpm ci:full-release`. Sau khi publish, truyền `package_acceptance_package_spec=openclaw@YYYY.M.D` (hoặc `openclaw@beta`/`openclaw@latest`) để chạy cùng ma trận package/update đối với package npm đã được phát hành thay thế.

## Các giai đoạn cấp cao nhất

| Giai đoạn                | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phân giải mục tiêu    | **Job:** `Resolve target ref`<br />**Workflow con:** không có<br />**Chứng minh:** phân giải nhánh phát hành, tag, hoặc commit SHA đầy đủ và ghi lại các đầu vào đã chọn.<br />**Chạy lại:** chạy lại ô tổng quát nếu bước này lỗi.                                                                                                                                                                              |
| Vitest và CI thông thường | **Job:** `Run normal full CI`<br />**Workflow con:** `CI`<br />**Chứng minh:** đồ thị CI đầy đủ thủ công trên target ref, bao gồm các lane Linux Node, shard Plugin đi kèm, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, build smoke, kiểm tra tài liệu, Python skills, Windows, macOS, Control UI i18n, và Android thông qua ô tổng quát.<br />**Chạy lại:** `rerun_group=ci`. |
| Plugin trước phát hành    | **Job:** `Run plugin prerelease validation`<br />**Workflow con:** `Plugin Prerelease`<br />**Chứng minh:** các kiểm tra tĩnh Plugin chỉ dành cho phát hành, độ phủ Plugin agentic, toàn bộ shard batch Plugin, và các lane Docker trước phát hành Plugin.<br />**Chạy lại:** `rerun_group=plugin-prerelease`.                                                                                                       |
| Kiểm tra phát hành       | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow con:** `OpenClaw Release Checks`<br />**Chứng minh:** install smoke, kiểm tra package đa OS, bộ live/E2E, các chunk đường dẫn phát hành Docker, Package Acceptance, tương đương QA Lab, Matrix live, và Telegram live.<br />**Chạy lại:** `rerun_group=release-checks` hoặc một handle release-checks hẹp hơn.                                |
| Artifact package     | **Job:** `Prepare release package artifact`<br />**Workflow con:** không có<br />**Chứng minh:** tạo tarball cha `release-package-under-test` đủ sớm cho các kiểm tra hướng package không cần chờ `OpenClaw Release Checks`.<br />**Chạy lại:** chạy lại ô tổng quát hoặc cung cấp `npm_telegram_package_spec` cho `rerun_group=npm-telegram`.                                   |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**Workflow con:** `NPM Telegram Beta E2E`<br />**Chứng minh:** bằng chứng package Telegram dựa trên artifact cha cho `rerun_group=all` với `release_profile=full`, hoặc bằng chứng Telegram package đã publish khi `npm_telegram_package_spec` được đặt.<br />**Chạy lại:** `rerun_group=npm-telegram` với `npm_telegram_package_spec`.                              |
| Bộ xác minh ô tổng quát    | **Job:** `Verify full validation`<br />**Workflow con:** không có<br />**Chứng minh:** kiểm tra lại kết luận của các lần chạy workflow con đã ghi lại và thêm bảng job chậm nhất từ các workflow con.<br />**Chạy lại:** chỉ chạy lại job này sau khi chạy lại workflow con bị lỗi đến trạng thái xanh.                                                                                                                                   |

Với `ref=main` và `rerun_group=all`, một ô tổng quát mới hơn sẽ thay thế ô cũ hơn. Khi parent bị hủy, monitor của nó hủy mọi workflow con mà nó đã dispatch. Các lần kiểm chứng nhánh phát hành và tag mặc định không hủy lẫn nhau.

## Các giai đoạn kiểm tra phát hành

`OpenClaw Release Checks` là workflow con lớn nhất. Nó phân giải mục tiêu một lần và chuẩn bị artifact `release-package-under-test` dùng chung khi các giai đoạn hướng package hoặc Docker cần artifact đó.

| Giai đoạn               | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu phát hành      | **Job:** `Resolve target ref`<br />**Workflow nền:** không có<br />**Kiểm thử:** ref đã chọn, SHA mong đợi tùy chọn, profile, nhóm chạy lại, và bộ lọc bộ live tập trung.<br />**Chạy lại:** `rerun_group=release-checks`.                                                                                                                                                                           |
| Artifact package    | **Job:** `Prepare release package artifact`<br />**Workflow nền:** không có<br />**Kiểm thử:** đóng gói hoặc phân giải một tarball ứng viên và upload `release-package-under-test` cho các kiểm tra hướng package downstream.<br />**Chạy lại:** nhóm package, đa OS, hoặc live/E2E bị ảnh hưởng.                                                                                                           |
| Install smoke       | **Job:** `Run install smoke`<br />**Workflow nền:** `Install Smoke`<br />**Kiểm thử:** đường dẫn cài đặt đầy đủ với việc tái sử dụng image smoke Dockerfile gốc, cài đặt package QR, smoke Docker root và Gateway, kiểm thử Docker installer, smoke Bun global install image-provider, và E2E cài đặt/gỡ cài đặt Plugin đi kèm nhanh.<br />**Chạy lại:** `rerun_group=install-smoke`.                              |
| Đa OS            | **Job:** `cross_os_release_checks`<br />**Workflow nền:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Kiểm thử:** các lane cài mới và nâng cấp trên Linux, Windows, và macOS cho provider và mode đã chọn, dùng tarball ứng viên cộng với package baseline.<br />**Chạy lại:** `rerun_group=cross-os`.                                                                               |
| Repo và live E2E   | **Job:** `Run repo/live E2E validation`<br />**Workflow nền:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** E2E repository, cache live, streaming websocket OpenAI, các shard provider live native và Plugin, và các harness live model/backend/Gateway dựa trên Docker được chọn bởi `release_profile`.<br />**Chạy lại:** `rerun_group=live-e2e`, tùy chọn với `live_suite_filter`. |
| Đường dẫn phát hành Docker | **Job:** `Run Docker release-path validation`<br />**Workflow nền:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** các chunk Docker đường dẫn phát hành trên artifact package dùng chung.<br />**Chạy lại:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance  | **Job:** `Run package acceptance`<br />**Workflow nền:** `Package Acceptance`<br />**Kiểm thử:** fixture package Plugin offline, cập nhật Plugin, chấp nhận package Telegram mock-OpenAI, và kiểm tra survivor khi nâng cấp từ mọi bản phát hành npm stable tại hoặc sau `2026.4.23` trên cùng tarball.<br />**Chạy lại:** `rerun_group=package`.                                         |
| Tương đương QA           | **Job:** `Run QA Lab parity lane` và `Run QA Lab parity report`<br />**Workflow nền:** job trực tiếp<br />**Kiểm thử:** các pack tương đương agentic ứng viên và baseline, sau đó là báo cáo tương đương.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                                       |
| QA live Matrix      | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow nền:** job trực tiếp<br />**Kiểm thử:** profile QA Matrix live nhanh trong môi trường `qa-live-shared`.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                        |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow nền:** job trực tiếp<br />**Kiểm thử:** QA Telegram live với các lease thông tin đăng nhập Convex CI.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                    |
| Bộ xác minh phát hành    | **Job:** `Verify release checks`<br />**Workflow nền:** không có<br />**Kiểm thử:** các job release-check bắt buộc cho nhóm chạy lại đã chọn.<br />**Chạy lại:** chạy lại sau khi các job con tập trung đã pass.                                                                                                                                                                                                 |

## Các chunk đường dẫn phát hành Docker

Giai đoạn đường dẫn phát hành Docker chạy các chunk này khi `live_suite_filter` trống:

| Chunk                                                           | Độ phủ                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `core`                                                          | Các lane smoke đường dẫn phát hành Docker lõi.                                   |
| `package-update-openai`                                         | Hành vi cài đặt và cập nhật package OpenAI.                             |
| `package-update-anthropic`                                      | Hành vi cài đặt và cập nhật package Anthropic.                          |
| `package-update-core`                                           | Hành vi package và cập nhật không phụ thuộc provider.                           |
| `plugins-runtime-plugins`                                       | Các lane runtime Plugin thực thi hành vi Plugin.                     |
| `plugins-runtime-services`                                      | Các lane runtime Plugin dựa trên service; bao gồm OpenWebUI khi được yêu cầu. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Các batch cài đặt/runtime Plugin được chia để kiểm chứng phát hành song song.   |

Sử dụng `docker_lanes=<lane[,lane]>` có mục tiêu trên quy trình live/E2E tái sử dụng được khi chỉ một luồng Docker thất bại. Artifact phát hành bao gồm các lệnh chạy lại theo từng luồng với các đầu vào tái sử dụng artifact gói và hình ảnh khi có sẵn.

## Hồ sơ phát hành

`release_profile` chủ yếu kiểm soát phạm vi live/provider bên trong các kiểm tra phát hành. Nó không loại bỏ CI đầy đủ thông thường, Plugin Prerelease, install smoke, package acceptance, QA Lab, hoặc các phần Docker release-path. `full` cũng khiến lần chạy bao quát thực thi Telegram E2E cho gói dựa trên artifact gói phát hành cha khi `rerun_group=all`, để một ứng viên tiền xuất bản đầy đủ không âm thầm bỏ qua luồng gói Telegram đó.

| Hồ sơ    | Mục đích sử dụng                 | Phạm vi live/provider được bao gồm                                                                                                                                 |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke phát hành quan trọng nhanh nhất. | Đường dẫn live OpenAI/core, mô hình live Docker cho OpenAI, lõi gateway native, hồ sơ gateway OpenAI native, plugin OpenAI native, và gateway live Docker OpenAI.                     |
| `stable`  | Hồ sơ phê duyệt phát hành mặc định. | `minimum` cộng với smoke Anthropic, Google, MiniMax, backend, bộ kiểm thử live native, backend CLI live Docker, bind ACP Docker, bộ kiểm thử Codex Docker, và một shard smoke OpenCode Go. |
| `full`    | Quét tư vấn rộng.             | `stable` cộng với các provider tư vấn, shard live Plugin, và shard live media.                                                                                                        |

## Bổ sung chỉ có trong full

Các bộ kiểm thử này bị `stable` bỏ qua và được `full` bao gồm:

| Khu vực                             | Phạm vi chỉ có trong full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Mô hình live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai, và Fireworks.                                                                          |
| Gateway live Docker              | Provider tư vấn được chia thành các shard DeepSeek/Fireworks, OpenCode Go/OpenRouter, và xAI/Z.ai.                              |
| Hồ sơ provider gateway native | Các shard Anthropic Opus đầy đủ và Sonnet/Haiku, Fireworks, DeepSeek, các shard mô hình OpenCode Go đầy đủ, OpenRouter, xAI, và Z.ai. |
| Shard live Plugin native        | Plugins A-K, L-N, O-Z khác, Moonshot, và xAI.                                                                             |
| Shard live media native         | Nhóm âm thanh, nhạc Google, nhạc MiniMax, và video A-D.                                                                   |

`stable` bao gồm `native-live-src-gateway-profiles-anthropic-smoke` và `native-live-src-gateway-profiles-opencode-go-smoke`; `full` dùng các shard mô hình Anthropic và OpenCode Go rộng hơn thay thế. Các lần chạy lại tập trung vẫn có thể dùng các handle tổng hợp `native-live-src-gateway-profiles-anthropic` hoặc `native-live-src-gateway-profiles-opencode-go`.

## Chạy lại tập trung

Dùng `rerun_group` để tránh lặp lại các hộp phát hành không liên quan:

| Handle              | Phạm vi                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tất cả các giai đoạn Full Release Validation.                                   |
| `ci`                | Chỉ child CI đầy đủ thủ công.                                            |
| `plugin-prerelease` | Chỉ child Plugin Prerelease.                                         |
| `release-checks`    | Tất cả các giai đoạn OpenClaw Release Checks.                                   |
| `install-smoke`     | Install Smoke thông qua kiểm tra phát hành.                                 |
| `cross-os`          | Kiểm tra phát hành Cross-OS.                                              |
| `live-e2e`          | Xác thực E2E repo/live và Docker release-path.                     |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA parity cộng với các luồng QA live.                                         |
| `qa-parity`         | Chỉ các luồng QA parity và báo cáo.                                      |
| `qa-live`           | Chỉ QA live Matrix và Telegram.                                     |
| `npm-telegram`      | Telegram E2E cho gói đã xuất bản; yêu cầu `npm_telegram_package_spec`. |

Dùng `live_suite_filter` với `rerun_group=live-e2e` khi một bộ kiểm thử live thất bại. Các id bộ lọc hợp lệ được định nghĩa trong quy trình live/E2E tái sử dụng được, bao gồm `docker-live-models`, `live-gateway-docker`, `live-gateway-anthropic-docker`, `live-gateway-google-docker`, `live-gateway-minimax-docker`, `live-gateway-advisory-docker`, `live-cli-backend-docker`, `live-acp-bind-docker`, và `live-codex-harness-docker`.

Handle `live-gateway-advisory-docker` là handle chạy lại tổng hợp cho ba shard provider của nó, nên nó vẫn tỏa ra tất cả các job gateway Docker tư vấn.

## Bằng chứng cần giữ lại

Giữ phần tóm tắt `Full Release Validation` làm chỉ mục cấp phát hành. Nó liên kết các id lần chạy child và bao gồm các bảng job chậm nhất. Đối với lỗi, trước tiên hãy kiểm tra quy trình child, sau đó chạy lại handle phù hợp nhỏ nhất ở trên.

Artifact hữu ích:

- `release-package-under-test` từ parent Full Release Validation và `OpenClaw Release Checks`
- Artifact Docker release-path trong `.artifacts/docker-tests/`
- `package-under-test` của Package Acceptance và các artifact Docker acceptance
- Artifact kiểm tra phát hành Cross-OS cho từng OS và bộ kiểm thử
- Artifact QA parity, Matrix, và Telegram

## Tệp quy trình

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
