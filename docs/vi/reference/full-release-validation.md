---
read_when:
    - Chạy hoặc chạy lại quy trình xác thực bản phát hành đầy đủ
    - So sánh các hồ sơ xác thực bản phát hành ổn định và đầy đủ
    - Gỡ lỗi các lỗi ở giai đoạn xác thực bản phát hành
summary: Các giai đoạn Xác thực phát hành đầy đủ, quy trình công việc con, hồ sơ phát hành, mã định danh chạy lại và bằng chứng
title: Xác thực bản phát hành đầy đủ
x-i18n:
    generated_at: "2026-05-01T10:52:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcbfafd744437c160c09a9c508a639781549193669b300e5249023f9f5dd4afe
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` là workflow phát hành bao trùm. Đây là điểm vào thủ công duy nhất cho bằng chứng trước phát hành, nhưng phần lớn công việc diễn ra trong các workflow con để có thể chạy lại một box bị lỗi mà không cần khởi động lại toàn bộ bản phát hành.

Chạy nó từ một ref workflow đáng tin cậy, thường là `main`, và truyền nhánh phát hành, tag, hoặc SHA commit đầy đủ dưới dạng `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Các workflow con dùng ref workflow đáng tin cậy cho harness và đầu vào `ref` cho ứng viên đang được kiểm thử. Điều đó giữ cho logic xác thực mới luôn khả dụng khi xác thực một nhánh hoặc tag phát hành cũ hơn.

## Các giai đoạn cấp cao nhất

| Giai đoạn             | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phân giải đích        | **Job:** `Resolve target ref`<br />**Workflow con:** không có<br />**Chứng minh:** phân giải nhánh phát hành, tag, hoặc SHA commit đầy đủ và ghi lại các đầu vào đã chọn.<br />**Chạy lại:** chạy lại workflow bao trùm nếu bước này lỗi.                                                                                                                                                    |
| Vitest và CI thường   | **Job:** `Run normal full CI`<br />**Workflow con:** `CI`<br />**Chứng minh:** đồ thị CI đầy đủ thủ công chạy với ref đích, bao gồm các lane Linux Node, shard Plugin đóng gói, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, build smoke, kiểm tra tài liệu, Skills Python, Windows, macOS, i18n Control UI, và Android thông qua workflow bao trùm.<br />**Chạy lại:** `rerun_group=ci`. |
| Tiền phát hành Plugin | **Job:** `Run plugin prerelease validation`<br />**Workflow con:** `Plugin Prerelease`<br />**Chứng minh:** các kiểm tra tĩnh Plugin chỉ dành cho phát hành, phạm vi kiểm thử Plugin agentic, các shard lô extension đầy đủ, và các lane Docker tiền phát hành Plugin.<br />**Chạy lại:** `rerun_group=plugin-prerelease`.                                                                  |
| Kiểm tra phát hành    | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow con:** `OpenClaw Release Checks`<br />**Chứng minh:** install smoke, kiểm tra gói trên nhiều hệ điều hành, bộ kiểm thử live/E2E, các chunk đường dẫn phát hành Docker, Package Acceptance, QA Lab parity, Matrix live, và Telegram live.<br />**Chạy lại:** `rerun_group=release-checks` hoặc một handle release-checks hẹp hơn. |
| Telegram sau phát hành | **Job:** `Run post-publish Telegram E2E`<br />**Workflow con:** `NPM Telegram Beta E2E`<br />**Chứng minh:** bằng chứng Telegram tùy chọn cho gói đã phát hành khi `npm_telegram_package_spec` được đặt.<br />**Chạy lại:** `rerun_group=npm-telegram`.                                                                                                                                       |
| Trình xác minh bao trùm | **Job:** `Verify full validation`<br />**Workflow con:** không có<br />**Chứng minh:** kiểm tra lại kết luận của các lần chạy workflow con đã ghi và thêm bảng job chậm nhất từ các workflow con.<br />**Chạy lại:** chỉ chạy lại job này sau khi chạy lại một workflow con bị lỗi đến trạng thái xanh.                                                                                     |

Với `ref=main` và `rerun_group=all`, một workflow bao trùm mới hơn sẽ thay thế workflow cũ hơn. Khi workflow cha bị hủy, trình giám sát của nó sẽ hủy bất kỳ workflow con nào mà nó đã gửi đi. Các lần chạy xác thực nhánh phát hành và tag không hủy lẫn nhau theo mặc định.

## Các giai đoạn kiểm tra phát hành

`OpenClaw Release Checks` là workflow con lớn nhất. Nó phân giải đích một lần và chuẩn bị artifact `release-package-under-test` dùng chung khi các giai đoạn hướng đến gói hoặc Docker cần đến.

| Giai đoạn             | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Đích phát hành        | **Job:** `Resolve target ref`<br />**Workflow hỗ trợ:** không có<br />**Kiểm thử:** ref đã chọn, SHA kỳ vọng tùy chọn, hồ sơ, nhóm chạy lại, và bộ lọc bộ kiểm thử live tập trung.<br />**Chạy lại:** `rerun_group=release-checks`.                                                                                                                                                              |
| Artifact gói          | **Job:** `Prepare release package artifact`<br />**Workflow hỗ trợ:** không có<br />**Kiểm thử:** đóng gói hoặc phân giải một tarball ứng viên và tải lên `release-package-under-test` cho các kiểm tra hướng đến gói ở hạ nguồn.<br />**Chạy lại:** nhóm gói, nhiều hệ điều hành, hoặc live/E2E bị ảnh hưởng.                                                                                   |
| Install smoke         | **Job:** `Run install smoke`<br />**Workflow hỗ trợ:** `Install Smoke`<br />**Kiểm thử:** đường dẫn cài đặt đầy đủ với tái sử dụng image smoke Dockerfile gốc, cài đặt gói QR, smoke Docker gốc và Gateway, kiểm thử Docker cho trình cài đặt, smoke image-provider cài đặt toàn cục bằng Bun, và Docker E2E nhanh cho Plugin đóng gói.<br />**Chạy lại:** `rerun_group=install-smoke`.        |
| Nhiều hệ điều hành    | **Job:** `cross_os_release_checks`<br />**Workflow hỗ trợ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Kiểm thử:** các lane mới và nâng cấp trên Linux, Windows, và macOS cho provider và chế độ đã chọn, dùng tarball ứng viên cộng với gói baseline.<br />**Chạy lại:** `rerun_group=cross-os`.                                                                                  |
| Repo và live E2E      | **Job:** `Run repo/live E2E validation`<br />**Workflow hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** E2E repository, cache live, streaming websocket OpenAI, provider live gốc và các shard Plugin, cùng các harness model/backend/gateway live dựa trên Docker được chọn bởi `release_profile`.<br />**Chạy lại:** `rerun_group=live-e2e`, tùy chọn với `live_suite_filter`. |
| Đường dẫn phát hành Docker | **Job:** `Run Docker release-path validation`<br />**Workflow hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** các chunk Docker đường dẫn phát hành chạy với artifact gói dùng chung.<br />**Chạy lại:** `rerun_group=live-e2e`.                                                                                                                                            |
| Package Acceptance    | **Job:** `Run package acceptance`<br />**Workflow hỗ trợ:** `Package Acceptance`<br />**Kiểm thử:** khả năng tương thích dependency của kênh đóng gói nguyên bản theo artifact, fixture gói Plugin ngoại tuyến, và chấp nhận gói Telegram mock-OpenAI với cùng tarball.<br />**Chạy lại:** `rerun_group=package`.                                                                              |
| QA parity             | **Job:** `Run QA Lab parity lane` và `Run QA Lab parity report`<br />**Workflow hỗ trợ:** job trực tiếp<br />**Kiểm thử:** các gói parity agentic của ứng viên và baseline, sau đó là báo cáo parity.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                          |
| QA live Matrix        | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow hỗ trợ:** job trực tiếp<br />**Kiểm thử:** hồ sơ QA Matrix live nhanh trong môi trường `qa-live-shared`.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                  |
| QA live Telegram      | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow hỗ trợ:** job trực tiếp<br />**Kiểm thử:** QA Telegram live với lease thông tin xác thực Convex CI.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                     |
| Trình xác minh phát hành | **Job:** `Verify release checks`<br />**Workflow hỗ trợ:** không có<br />**Kiểm thử:** các job release-check bắt buộc cho nhóm chạy lại đã chọn.<br />**Chạy lại:** chạy lại sau khi các job con tập trung đã pass.                                                                                                                                                                            |

## Các chunk đường dẫn phát hành Docker

Giai đoạn đường dẫn phát hành Docker chạy các chunk này khi `live_suite_filter` trống:

| Chunk                                                                                       | Phạm vi bao phủ                                                        |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `core`                                                                                      | Các lane smoke đường dẫn phát hành Docker cốt lõi.                    |
| `package-update-openai`                                                                     | Hành vi cài đặt và cập nhật gói OpenAI.                               |
| `package-update-anthropic`                                                                  | Hành vi cài đặt và cập nhật gói Anthropic.                            |
| `package-update-core`                                                                       | Hành vi gói và cập nhật trung lập với provider.                       |
| `plugins-runtime-plugins`                                                                   | Các lane runtime Plugin thực thi hành vi Plugin.                      |
| `plugins-runtime-services`                                                                  | Các lane runtime Plugin dựa trên dịch vụ; bao gồm OpenWebUI khi được yêu cầu. |
| `plugins-runtime-install-a` đến `plugins-runtime-install-h`                                  | Các lô cài đặt/runtime Plugin được tách để xác thực phát hành song song. |
| `bundled-channels-core`                                                                     | Hành vi Docker của kênh đóng gói.                                     |
| `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` | Hành vi cập nhật kênh đóng gói.                                      |
| `bundled-channels-contracts`                                                                | Kiểm tra hợp đồng kênh đóng gói trong đường dẫn phát hành Docker.     |

Dùng `docker_lanes=<lane[,lane]>` có mục tiêu trên workflow live/E2E có thể tái sử dụng khi chỉ một lane Docker thất bại. Các artifact phát hành bao gồm lệnh chạy lại theo từng lane cùng với đầu vào tái sử dụng artifact gói và image khi có sẵn.

## Hồ sơ phát hành

`release_profile` chỉ kiểm soát độ rộng live/nhà cung cấp bên trong các kiểm tra phát hành. Nó không loại bỏ CI đầy đủ thông thường, Plugin Prerelease, install smoke, package acceptance, QA Lab, hoặc các phần đường dẫn phát hành Docker.

| Hồ sơ    | Mục đích sử dụng                 | Phạm vi live/nhà cung cấp được bao gồm                                                                                                                                          |
| -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke nhanh nhất cho phần trọng yếu của phát hành. | Đường dẫn live OpenAI/core, mô hình live Docker cho OpenAI, lõi Gateway gốc, hồ sơ Gateway OpenAI gốc, Plugin OpenAI gốc, và Gateway live Docker OpenAI. |
| `stable`  | Hồ sơ phê duyệt phát hành mặc định. | `minimum` cộng thêm Anthropic, Google, MiniMax, backend, bộ kiểm thử live gốc, backend CLI live Docker, Docker ACP bind, bộ kiểm thử Docker Codex, và một shard smoke OpenCode Go. |
| `full`    | Quét tư vấn diện rộng.          | `stable` cộng thêm các nhà cung cấp tư vấn, shard live Plugin, và shard live media.                                                                                           |

## Các bổ sung chỉ có trong full

Các bộ kiểm thử này bị `stable` bỏ qua và được `full` bao gồm:

| Khu vực                          | Phạm vi chỉ có trong full                                                     |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Mô hình live Docker              | OpenCode Go, OpenRouter, xAI, Z.ai, và Fireworks.                              |
| Gateway live Docker              | Shard tư vấn cho DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI, và Z.ai. |
| Hồ sơ nhà cung cấp Gateway gốc   | Fireworks, DeepSeek, các shard mô hình OpenCode Go đầy đủ, OpenRouter, xAI, và Z.ai. |
| Shard live Plugin gốc            | Plugins A-K, L-N, O-Z khác, Moonshot, và xAI.                                 |
| Shard live media gốc             | Âm thanh, Google music, MiniMax music, và các nhóm video A-D.                  |

`stable` bao gồm `native-live-src-gateway-profiles-opencode-go-smoke`; `full` dùng các shard mô hình OpenCode Go rộng hơn thay thế.

## Chạy lại có trọng tâm

Dùng `rerun_group` để tránh lặp lại các box phát hành không liên quan:

| Handle              | Phạm vi                                           |
| ------------------- | ------------------------------------------------- |
| `all`               | Tất cả các giai đoạn Full Release Validation.     |
| `ci`                | Chỉ child CI đầy đủ thủ công.                     |
| `plugin-prerelease` | Chỉ child Plugin Prerelease.                      |
| `release-checks`    | Tất cả các giai đoạn OpenClaw Release Checks.     |
| `install-smoke`     | Install Smoke thông qua các kiểm tra phát hành.   |
| `cross-os`          | Kiểm tra phát hành Cross-OS.                      |
| `live-e2e`          | Xác thực E2E repo/live và đường dẫn phát hành Docker. |
| `package`           | Package Acceptance.                               |
| `qa`                | QA parity cộng với các lane live QA.              |
| `qa-parity`         | Chỉ các lane QA parity và báo cáo.                |
| `qa-live`           | Chỉ Matrix live QA và Telegram.                   |
| `npm-telegram`      | Chỉ E2E Telegram hậu phát hành tùy chọn.          |

Dùng `live_suite_filter` với `rerun_group=live-e2e` khi một bộ live thất bại. Các id bộ lọc hợp lệ được định nghĩa trong workflow live/E2E có thể tái sử dụng, bao gồm `docker-live-models`, `live-gateway-docker`, `live-gateway-anthropic-docker`, `live-gateway-google-docker`, `live-gateway-minimax-docker`, `live-gateway-advisory-docker`, `live-cli-backend-docker`, `live-acp-bind-docker`, và `live-codex-harness-docker`.

## Bằng chứng cần giữ lại

Giữ phần tóm tắt `Full Release Validation` làm chỉ mục cấp phát hành. Nó liên kết các id lần chạy child và bao gồm các bảng job chậm nhất. Với lỗi thất bại, hãy kiểm tra workflow child trước, rồi chạy lại handle nhỏ nhất khớp ở trên.

Artifact hữu ích:

- `release-package-under-test` từ `OpenClaw Release Checks`
- Artifact đường dẫn phát hành Docker trong `.artifacts/docker-tests/`
- `package-under-test` của Package Acceptance và artifact chấp nhận Docker
- Artifact kiểm tra phát hành Cross-OS cho từng OS và bộ kiểm thử
- Artifact QA parity, Matrix, và Telegram

## Tệp workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
