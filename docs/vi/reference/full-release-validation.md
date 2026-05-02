---
read_when:
    - Chạy hoặc chạy lại Xác thực bản phát hành đầy đủ
    - So sánh các hồ sơ xác thực bản phát hành ổn định và đầy đủ
    - Gỡ lỗi các lỗi ở giai đoạn xác thực bản phát hành
summary: Các giai đoạn xác thực bản phát hành đầy đủ, quy trình công việc con, hồ sơ bản phát hành, định danh chạy lại và bằng chứng
title: Xác thực bản phát hành đầy đủ
x-i18n:
    generated_at: "2026-05-02T10:52:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: feb4edec850fb97405575c869547b4851bc773507321690670553e6faafc8b0b
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` là workflow bao quát cho bản phát hành. Đây là điểm vào thủ công duy nhất để chứng minh trước phát hành, nhưng phần lớn công việc diễn ra trong các workflow con để một hộp bị lỗi có thể chạy lại mà không cần khởi động lại toàn bộ bản phát hành.

Chạy nó từ một tham chiếu workflow đáng tin cậy, thường là `main`, và truyền nhánh phát hành, thẻ hoặc SHA commit đầy đủ làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Các workflow con dùng tham chiếu workflow đáng tin cậy cho bộ kiểm thử và dùng đầu vào `ref` cho ứng viên đang được kiểm thử. Điều đó giữ cho logic xác thực mới luôn khả dụng khi xác thực một nhánh hoặc thẻ phát hành cũ hơn.

## Các giai đoạn cấp cao nhất

| Giai đoạn            | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phân giải mục tiêu   | **Tác vụ:** `Resolve target ref`<br />**Workflow con:** không có<br />**Chứng minh:** phân giải nhánh phát hành, thẻ hoặc SHA commit đầy đủ và ghi lại các đầu vào đã chọn.<br />**Chạy lại:** chạy lại workflow bao quát nếu bước này thất bại.                                                                                                                                                 |
| Vitest và CI thường  | **Tác vụ:** `Run normal full CI`<br />**Workflow con:** `CI`<br />**Chứng minh:** đồ thị CI đầy đủ thủ công trên ref mục tiêu, bao gồm các lane Linux Node, shard Plugin tích hợp, hợp đồng kênh, tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Skills Python, Windows, macOS, Control UI i18n và Android thông qua workflow bao quát.<br />**Chạy lại:** `rerun_group=ci`. |
| Tiền phát hành Plugin | **Tác vụ:** `Run plugin prerelease validation`<br />**Workflow con:** `Plugin Prerelease`<br />**Chứng minh:** kiểm tra tĩnh Plugin chỉ dành cho phát hành, độ phủ Plugin agentic, đầy đủ shard lô tiện ích mở rộng và các lane Docker tiền phát hành Plugin.<br />**Chạy lại:** `rerun_group=plugin-prerelease`.                                                                                 |
| Kiểm tra phát hành   | **Tác vụ:** `Run release/live/Docker/QA validation`<br />**Workflow con:** `OpenClaw Release Checks`<br />**Chứng minh:** smoke cài đặt, kiểm tra gói đa hệ điều hành, bộ live/E2E, các phần đường dẫn phát hành Docker, Package Acceptance, QA Lab parity, live Matrix và live Telegram.<br />**Chạy lại:** `rerun_group=release-checks` hoặc một handle release-checks hẹp hơn.             |
| Gói Telegram         | **Tác vụ:** `Run package Telegram E2E`<br />**Workflow con:** `NPM Telegram Beta E2E`<br />**Chứng minh:** bằng chứng gói Telegram dựa trên artifact cho `rerun_group=all` với `release_profile=full`, hoặc bằng chứng Telegram của gói đã xuất bản khi `npm_telegram_package_spec` được đặt.<br />**Chạy lại:** `rerun_group=npm-telegram` với `npm_telegram_package_spec`.                 |
| Bộ xác minh bao quát | **Tác vụ:** `Verify full validation`<br />**Workflow con:** không có<br />**Chứng minh:** kiểm tra lại kết luận đã ghi của các lần chạy workflow con và thêm bảng tác vụ chậm nhất từ các workflow con.<br />**Chạy lại:** chỉ chạy lại tác vụ này sau khi chạy lại workflow con bị lỗi đến khi xanh.                                                                                           |

Với `ref=main` và `rerun_group=all`, một workflow bao quát mới hơn sẽ thay thế workflow cũ hơn. Khi workflow cha bị hủy, bộ giám sát của nó hủy mọi workflow con mà nó đã điều phối. Theo mặc định, các lần chạy xác thực nhánh phát hành và thẻ không hủy lẫn nhau.

## Các giai đoạn kiểm tra phát hành

`OpenClaw Release Checks` là workflow con lớn nhất. Nó phân giải mục tiêu một lần và chuẩn bị một artifact `release-package-under-test` dùng chung khi các giai đoạn hướng tới gói hoặc Docker cần nó.

| Giai đoạn            | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu phát hành   | **Tác vụ:** `Resolve target ref`<br />**Workflow nền:** không có<br />**Kiểm thử:** ref đã chọn, SHA kỳ vọng tùy chọn, hồ sơ, nhóm chạy lại và bộ lọc bộ kiểm thử live tập trung.<br />**Chạy lại:** `rerun_group=release-checks`.                                                                                                                                                                  |
| Artifact gói         | **Tác vụ:** `Prepare release package artifact`<br />**Workflow nền:** không có<br />**Kiểm thử:** đóng gói hoặc phân giải một tarball ứng viên và tải lên `release-package-under-test` cho các kiểm tra hướng tới gói ở hạ nguồn.<br />**Chạy lại:** nhóm gói, đa hệ điều hành hoặc live/E2E bị ảnh hưởng.                                                                                        |
| Smoke cài đặt        | **Tác vụ:** `Run install smoke`<br />**Workflow nền:** `Install Smoke`<br />**Kiểm thử:** đường dẫn cài đặt đầy đủ với tái sử dụng ảnh smoke Dockerfile gốc, cài đặt gói QR, smoke Docker gốc và Gateway, kiểm thử Docker trình cài đặt, smoke provider ảnh cài đặt toàn cục Bun và E2E cài đặt/gỡ cài đặt Plugin tích hợp nhanh.<br />**Chạy lại:** `rerun_group=install-smoke`.              |
| Đa hệ điều hành      | **Tác vụ:** `cross_os_release_checks`<br />**Workflow nền:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Kiểm thử:** các lane cài mới và nâng cấp trên Linux, Windows và macOS cho provider và chế độ đã chọn, dùng tarball ứng viên cùng với một gói baseline.<br />**Chạy lại:** `rerun_group=cross-os`.                                                                          |
| Repo và live E2E     | **Tác vụ:** `Run repo/live E2E validation`<br />**Workflow nền:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** E2E repository, bộ nhớ đệm live, streaming websocket OpenAI, các shard provider live native và Plugin, cùng các bộ kiểm thử mô hình/backend/Gateway live dựa trên Docker được chọn bởi `release_profile`.<br />**Chạy lại:** `rerun_group=live-e2e`, tùy chọn với `live_suite_filter`. |
| Đường dẫn phát hành Docker | **Tác vụ:** `Run Docker release-path validation`<br />**Workflow nền:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** các phần Docker đường dẫn phát hành trên artifact gói dùng chung.<br />**Chạy lại:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Package Acceptance   | **Tác vụ:** `Run package acceptance`<br />**Workflow nền:** `Package Acceptance`<br />**Kiểm thử:** fixture gói Plugin ngoại tuyến, cập nhật Plugin và chấp nhận gói Telegram mock-OpenAI trên cùng tarball.<br />**Chạy lại:** `rerun_group=package`.                                                                                                                                             |
| QA parity            | **Tác vụ:** `Run QA Lab parity lane` và `Run QA Lab parity report`<br />**Workflow nền:** tác vụ trực tiếp<br />**Kiểm thử:** các gói parity agentic của ứng viên và baseline, sau đó là báo cáo parity.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                          |
| QA live Matrix       | **Tác vụ:** `Run QA Lab live Matrix lane`<br />**Workflow nền:** tác vụ trực tiếp<br />**Kiểm thử:** hồ sơ QA Matrix live nhanh trong môi trường `qa-live-shared`.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                  |
| QA live Telegram     | **Tác vụ:** `Run QA Lab live Telegram lane`<br />**Workflow nền:** tác vụ trực tiếp<br />**Kiểm thử:** QA Telegram live với các lease thông tin xác thực Convex CI.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                  |
| Bộ xác minh phát hành | **Tác vụ:** `Verify release checks`<br />**Workflow nền:** không có<br />**Kiểm thử:** các tác vụ release-check bắt buộc cho nhóm chạy lại đã chọn.<br />**Chạy lại:** chạy lại sau khi các tác vụ con tập trung đã vượt qua.                                                                                                                                                                      |

## Các phần đường dẫn phát hành Docker

Giai đoạn đường dẫn phát hành Docker chạy các phần này khi `live_suite_filter` trống:

| Phần                                                            | Độ phủ                                                                 |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `core`                                                          | Các lane smoke đường dẫn phát hành Core Docker.                        |
| `package-update-openai`                                         | Hành vi cài đặt và cập nhật gói OpenAI.                                |
| `package-update-anthropic`                                      | Hành vi cài đặt và cập nhật gói Anthropic.                             |
| `package-update-core`                                           | Hành vi gói và cập nhật trung lập với provider.                        |
| `plugins-runtime-plugins`                                       | Các lane runtime Plugin kiểm thử hành vi Plugin.                       |
| `plugins-runtime-services`                                      | Các lane runtime Plugin dựa trên dịch vụ; bao gồm OpenWebUI khi được yêu cầu. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Các lô cài đặt/runtime Plugin được chia nhỏ để xác thực phát hành song song. |

Dùng `docker_lanes=<lane[,lane]>` có mục tiêu trên workflow live/E2E tái sử dụng khi chỉ một lane Docker thất bại. Các artifact phát hành bao gồm lệnh chạy lại theo từng lane với đầu vào artifact gói và tái sử dụng ảnh khi có.

## Hồ sơ phát hành

`release_profile` chủ yếu kiểm soát độ rộng live/provider bên trong kiểm tra phát hành. Nó không loại bỏ CI đầy đủ thông thường, Plugin Prerelease, smoke cài đặt, package acceptance, QA Lab hoặc các phần đường dẫn phát hành Docker. `full` cũng khiến workflow bao quát chạy package Telegram E2E trên artifact gói phát hành khi `rerun_group=all`, để một ứng viên đầy đủ trước khi xuất bản không âm thầm bỏ qua lane gói Telegram đó.

| Hồ sơ     | Mục đích sử dụng                  | Phạm vi live/provider được bao gồm                                                                                                                                                 |
| --------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke nhanh nhất cho phát hành trọng yếu. | Đường dẫn live OpenAI/core, mô hình live Docker cho OpenAI, lõi Gateway native, hồ sơ Gateway OpenAI native, Plugin OpenAI native, và Gateway live Docker OpenAI.               |
| `stable`  | Hồ sơ phê duyệt phát hành mặc định. | `minimum` cộng với Anthropic, Google, MiniMax, backend, bộ kiểm thử live native, backend CLI live Docker, bind ACP Docker, bộ kiểm thử Codex Docker, và một shard smoke OpenCode Go. |
| `full`    | Quét tư vấn diện rộng.            | `stable` cộng với các nhà cung cấp tư vấn, các shard live của Plugin, và các shard live media.                                                                                   |

## Các phần bổ sung chỉ có trong full

Các bộ này bị `stable` bỏ qua và được `full` bao gồm:

| Khu vực                          | Phạm vi chỉ có trong full                                                      |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Mô hình live Docker              | OpenCode Go, OpenRouter, xAI, Z.ai, và Fireworks.                              |
| Gateway live Docker              | Shard tư vấn cho DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI, và Z.ai. |
| Hồ sơ nhà cung cấp Gateway native | Fireworks, DeepSeek, các shard mô hình OpenCode Go đầy đủ, OpenRouter, xAI, và Z.ai. |
| Shard live Plugin native         | Plugins A-K, L-N, O-Z khác, Moonshot, và xAI.                                 |
| Shard live media native          | Âm thanh, nhạc Google, nhạc MiniMax, và các nhóm video A-D.                       |

`stable` bao gồm `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
sử dụng các shard mô hình OpenCode Go rộng hơn thay thế.

## Chạy lại có trọng tâm

Dùng `rerun_group` để tránh lặp lại các hộp phát hành không liên quan:

| Handle              | Phạm vi                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tất cả các giai đoạn Full Release Validation.                         |
| `ci`                | Chỉ child CI đầy đủ thủ công.                                         |
| `plugin-prerelease` | Chỉ child Plugin Prerelease.                                          |
| `release-checks`    | Tất cả các giai đoạn OpenClaw Release Checks.                         |
| `install-smoke`     | Install Smoke thông qua kiểm tra phát hành.                           |
| `cross-os`          | Kiểm tra phát hành Cross-OS.                                          |
| `live-e2e`          | Xác thực repo/live E2E và đường dẫn phát hành Docker.                 |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA parity cộng với các lane QA live.                                  |
| `qa-parity`         | Chỉ các lane QA parity và báo cáo.                                    |
| `qa-live`           | Chỉ QA live Matrix và Telegram.                                       |
| `npm-telegram`      | E2E Telegram cho gói đã phát hành; yêu cầu `npm_telegram_package_spec`. |

Dùng `live_suite_filter` với `rerun_group=live-e2e` khi một bộ live thất bại.
Các id bộ lọc hợp lệ được định nghĩa trong workflow live/E2E tái sử dụng, bao gồm
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, và
`live-codex-harness-docker`.

## Bằng chứng cần giữ

Giữ bản tóm tắt `Full Release Validation` làm chỉ mục cấp phát hành. Nó liên kết
các id lần chạy child và bao gồm bảng công việc chậm nhất. Khi thất bại, hãy kiểm tra workflow
child trước, sau đó chạy lại handle khớp nhỏ nhất ở trên.

Artifact hữu ích:

- `release-package-under-test` từ `OpenClaw Release Checks`
- Artifact đường dẫn phát hành Docker trong `.artifacts/docker-tests/`
- `package-under-test` của Package Acceptance và artifact chấp nhận Docker
- Artifact kiểm tra phát hành Cross-OS cho từng OS và bộ
- Artifact QA parity, Matrix, và Telegram

## Tệp workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
