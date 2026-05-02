---
read_when:
    - Chạy hoặc chạy lại Xác thực bản phát hành đầy đủ
    - So sánh hồ sơ kiểm định bản phát hành ổn định và đầy đủ
    - Gỡ lỗi các lỗi ở giai đoạn xác thực bản phát hành
summary: Các giai đoạn Xác thực bản phát hành đầy đủ, quy trình công việc con, hồ sơ phát hành, mã định danh chạy lại và bằng chứng
title: Xác thực bản phát hành đầy đủ
x-i18n:
    generated_at: "2026-05-02T20:57:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ce1e5a72227ca202335fe68b537491a0b68a0bb2af431aa56c41cf20989e88c
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` là ô quy trình phát hành. Đây là điểm vào thủ công duy nhất cho bằng chứng trước phát hành, nhưng phần lớn công việc diễn ra trong các workflow con để một hộp bị lỗi có thể được chạy lại mà không cần khởi động lại toàn bộ bản phát hành.

Chạy từ một ref workflow đáng tin cậy, thường là `main`, và truyền nhánh phát hành, thẻ hoặc SHA commit đầy đủ làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Các workflow con dùng ref workflow đáng tin cậy cho bộ harness và input `ref` cho ứng viên đang được kiểm thử. Điều đó giúp logic xác thực mới vẫn khả dụng khi xác thực một nhánh hoặc thẻ phát hành cũ hơn.

Package Acceptance thường xây dựng tarball ứng viên từ `ref` đã phân giải, bao gồm các lần chạy full-SHA được dispatch bằng `pnpm ci:full-release`. Sau khi publish, truyền `package_acceptance_package_spec=openclaw@YYYY.M.D` (hoặc `openclaw@beta`/`openclaw@latest`) để chạy cùng ma trận gói/cập nhật đó với gói npm đã phát hành thay vào đó.

## Các giai đoạn cấp cao nhất

| Giai đoạn            | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Phân giải mục tiêu   | **Job:** `Resolve target ref`<br />**Workflow con:** không có<br />**Chứng minh:** phân giải nhánh phát hành, thẻ hoặc SHA commit đầy đủ và ghi lại các input đã chọn.<br />**Chạy lại:** chạy lại ô quy trình nếu bước này lỗi.                                                                                                                                                                  |
| Vitest và CI thường  | **Job:** `Run normal full CI`<br />**Workflow con:** `CI`<br />**Chứng minh:** đồ thị CI đầy đủ thủ công trên ref mục tiêu, bao gồm các lane Linux Node, các shard Plugin đóng gói, hợp đồng kênh, tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, Skills Python, Windows, macOS, i18n Control UI và Android thông qua ô quy trình.<br />**Chạy lại:** `rerun_group=ci`. |
| Tiền phát hành Plugin | **Job:** `Run plugin prerelease validation`<br />**Workflow con:** `Plugin Prerelease`<br />**Chứng minh:** các kiểm tra tĩnh chỉ dành cho phát hành của Plugin, coverage Plugin agentic, các shard batch extension đầy đủ và các lane Docker tiền phát hành Plugin.<br />**Chạy lại:** `rerun_group=plugin-prerelease`.                                                                          |
| Kiểm tra phát hành   | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow con:** `OpenClaw Release Checks`<br />**Chứng minh:** smoke cài đặt, kiểm tra gói đa hệ điều hành, bộ kiểm thử live/E2E, các chunk đường dẫn phát hành Docker, Package Acceptance, đối chiếu QA Lab, Matrix live và Telegram live.<br />**Chạy lại:** `rerun_group=release-checks` hoặc một handle release-checks hẹp hơn.          |
| Gói Telegram         | **Job:** `Run package Telegram E2E`<br />**Workflow con:** `NPM Telegram Beta E2E`<br />**Chứng minh:** bằng chứng gói Telegram dựa trên artifact cho `rerun_group=all` với `release_profile=full`, hoặc bằng chứng Telegram cho gói đã publish khi `npm_telegram_package_spec` được đặt.<br />**Chạy lại:** `rerun_group=npm-telegram` với `npm_telegram_package_spec`.                       |
| Bộ xác minh ô quy trình | **Job:** `Verify full validation`<br />**Workflow con:** không có<br />**Chứng minh:** kiểm tra lại kết luận của các lần chạy con đã ghi lại và thêm các bảng job chậm nhất từ workflow con.<br />**Chạy lại:** chỉ chạy lại job này sau khi chạy lại workflow con bị lỗi đến khi xanh.                                                                                                            |

Với `ref=main` và `rerun_group=all`, một ô quy trình mới hơn sẽ thay thế ô cũ hơn. Khi parent bị hủy, monitor của nó sẽ hủy bất kỳ workflow con nào mà nó đã dispatch. Các lần chạy xác thực nhánh phát hành và thẻ mặc định không hủy lẫn nhau.

## Các giai đoạn kiểm tra phát hành

`OpenClaw Release Checks` là workflow con lớn nhất. Nó phân giải mục tiêu một lần và chuẩn bị artifact `release-package-under-test` dùng chung khi các giai đoạn hướng đến gói hoặc Docker cần đến.

| Giai đoạn                  | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu phát hành         | **Job:** `Resolve target ref`<br />**Workflow hỗ trợ:** không có<br />**Kiểm thử:** ref đã chọn, SHA kỳ vọng tùy chọn, profile, nhóm chạy lại và bộ lọc bộ kiểm thử live tập trung.<br />**Chạy lại:** `rerun_group=release-checks`.                                                                                                                                                           |
| Artifact gói               | **Job:** `Prepare release package artifact`<br />**Workflow hỗ trợ:** không có<br />**Kiểm thử:** đóng gói hoặc phân giải một tarball ứng viên và tải lên `release-package-under-test` cho các kiểm tra hướng đến gói ở downstream.<br />**Chạy lại:** nhóm gói, đa hệ điều hành hoặc live/E2E bị ảnh hưởng.                                                                                   |
| Smoke cài đặt              | **Job:** `Run install smoke`<br />**Workflow hỗ trợ:** `Install Smoke`<br />**Kiểm thử:** đường dẫn cài đặt đầy đủ với tái sử dụng image smoke Dockerfile gốc, cài đặt gói QR, các smoke Docker gốc và Gateway, kiểm thử Docker cho trình cài đặt, smoke image-provider cài đặt global bằng Bun và E2E cài đặt/gỡ cài đặt Plugin đóng gói nhanh.<br />**Chạy lại:** `rerun_group=install-smoke`. |
| Đa hệ điều hành            | **Job:** `cross_os_release_checks`<br />**Workflow hỗ trợ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Kiểm thử:** các lane cài mới và nâng cấp trên Linux, Windows và macOS cho provider và mode đã chọn, dùng tarball ứng viên cộng với một gói baseline.<br />**Chạy lại:** `rerun_group=cross-os`.                                                                            |
| Repo và E2E live           | **Job:** `Run repo/live E2E validation`<br />**Workflow hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** E2E repository, cache live, streaming websocket OpenAI, các shard provider và Plugin live native, cùng các harness model/backend/Gateway live dựa trên Docker được chọn bởi `release_profile`.<br />**Chạy lại:** `rerun_group=live-e2e`, tùy chọn với `live_suite_filter`. |
| Đường dẫn phát hành Docker | **Job:** `Run Docker release-path validation`<br />**Workflow hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** các chunk Docker đường dẫn phát hành trên artifact gói dùng chung.<br />**Chạy lại:** `rerun_group=live-e2e`.                                                                                                                                              |
| Package Acceptance         | **Job:** `Run package acceptance`<br />**Workflow hỗ trợ:** `Package Acceptance`<br />**Kiểm thử:** fixture gói Plugin offline, cập nhật Plugin, Package Acceptance Telegram mock-OpenAI và kiểm tra survivor nâng cấp đã publish từ mọi bản npm stable tại hoặc sau `2026.4.23` trên cùng tarball.<br />**Chạy lại:** `rerun_group=package`.                                                   |
| Đối chiếu QA               | **Job:** `Run QA Lab parity lane` và `Run QA Lab parity report`<br />**Workflow hỗ trợ:** job trực tiếp<br />**Kiểm thử:** các pack đối chiếu agentic ứng viên và baseline, sau đó là báo cáo đối chiếu.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                      |
| Matrix live QA             | **Job:** `Run QA Lab live Matrix lane`<br />**Workflow hỗ trợ:** job trực tiếp<br />**Kiểm thử:** profile QA Matrix live nhanh trong môi trường `qa-live-shared`.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                               |
| Telegram live QA           | **Job:** `Run QA Lab live Telegram lane`<br />**Workflow hỗ trợ:** job trực tiếp<br />**Kiểm thử:** QA Telegram live với lease thông tin xác thực Convex CI.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                    |
| Bộ xác minh phát hành      | **Job:** `Verify release checks`<br />**Workflow hỗ trợ:** không có<br />**Kiểm thử:** các job release-check bắt buộc cho nhóm chạy lại đã chọn.<br />**Chạy lại:** chạy lại sau khi các job con tập trung đã pass.                                                                                                                                                                             |

## Các chunk đường dẫn phát hành Docker

Giai đoạn đường dẫn phát hành Docker chạy các chunk này khi `live_suite_filter` trống:

| Chunk                                                           | Coverage                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `core`                                                          | Các lane smoke đường dẫn phát hành Docker lõi.                            |
| `package-update-openai`                                         | Hành vi cài đặt và cập nhật gói OpenAI.                                   |
| `package-update-anthropic`                                      | Hành vi cài đặt và cập nhật gói Anthropic.                                |
| `package-update-core`                                           | Hành vi gói và cập nhật không phụ thuộc provider.                         |
| `plugins-runtime-plugins`                                       | Các lane runtime Plugin thực thi hành vi Plugin.                          |
| `plugins-runtime-services`                                      | Các lane runtime Plugin dựa trên dịch vụ; bao gồm OpenWebUI khi được yêu cầu. |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Các batch cài đặt/runtime Plugin được chia nhỏ để xác thực phát hành song song. |

Dùng `docker_lanes=<lane[,lane]>` nhắm mục tiêu trên workflow live/E2E tái sử dụng khi chỉ một lane Docker bị lỗi. Artifact phát hành bao gồm các lệnh chạy lại theo từng lane với artifact gói và input tái sử dụng image khi có.

## Hồ sơ phát hành

`release_profile` chủ yếu kiểm soát phạm vi trực tiếp/nhà cung cấp bên trong các kiểm tra phát hành.
Nó không loại bỏ CI đầy đủ thông thường, Plugin Prerelease, kiểm thử nhanh cài đặt, chấp nhận
gói, QA Lab, hoặc các phần đường dẫn phát hành Docker. `full` cũng khiến lượt chạy
bao trùm chạy Telegram E2E của gói đối với artifact gói phát hành khi
`rerun_group=all`, để một ứng viên đầy đủ trước khi phát hành không âm thầm bỏ qua lane
gói Telegram đó.

| Hồ sơ     | Mục đích sử dụng                                | Phạm vi kiểm thử trực tiếp/nhà cung cấp được bao gồm                                                                                                                          |
| --------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Kiểm thử nhanh phát hành trọng yếu nhanh nhất.  | Đường dẫn trực tiếp OpenAI/lõi, mô hình trực tiếp Docker cho OpenAI, lõi Gateway native, hồ sơ Gateway OpenAI native, Plugin OpenAI native, và Gateway OpenAI trực tiếp Docker. |
| `stable`  | Hồ sơ phê duyệt phát hành mặc định.             | `minimum` cộng với Anthropic, Google, MiniMax, backend, bộ kiểm thử trực tiếp native, backend CLI trực tiếp Docker, bind ACP Docker, bộ kiểm thử Codex Docker, và một shard kiểm thử nhanh OpenCode Go. |
| `full`    | Quét tư vấn diện rộng.                          | `stable` cộng với các nhà cung cấp tư vấn, shard trực tiếp Plugin, và shard trực tiếp media.                                                                                  |

## Các phần bổ sung chỉ có trong full

Những bộ kiểm thử này bị `stable` bỏ qua và được `full` bao gồm:

| Khu vực                          | Phạm vi chỉ có trong full                                                       |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Mô hình trực tiếp Docker         | OpenCode Go, OpenRouter, xAI, Z.ai, và Fireworks.                               |
| Gateway trực tiếp Docker         | Shard tư vấn cho DeepSeek, Fireworks, OpenCode Go, OpenRouter, xAI, và Z.ai.    |
| Hồ sơ nhà cung cấp Gateway native | Fireworks, DeepSeek, các shard mô hình OpenCode Go đầy đủ, OpenRouter, xAI, và Z.ai. |
| Shard trực tiếp Plugin native    | Plugin A-K, L-N, O-Z khác, Moonshot, và xAI.                                    |
| Shard trực tiếp media native     | Âm thanh, nhạc Google, nhạc MiniMax, và các nhóm video A-D.                     |

`stable` bao gồm `native-live-src-gateway-profiles-opencode-go-smoke`; `full`
dùng các shard mô hình OpenCode Go rộng hơn thay vào đó.

## Chạy lại có trọng tâm

Dùng `rerun_group` để tránh lặp lại các hộp phát hành không liên quan:

| Handle              | Phạm vi                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `all`               | Tất cả các giai đoạn Full Release Validation.                         |
| `ci`                | Chỉ child CI đầy đủ thủ công.                                         |
| `plugin-prerelease` | Chỉ child Plugin Prerelease.                                          |
| `release-checks`    | Tất cả các giai đoạn OpenClaw Release Checks.                         |
| `install-smoke`     | Install Smoke thông qua kiểm tra phát hành.                           |
| `cross-os`          | Kiểm tra phát hành đa hệ điều hành.                                   |
| `live-e2e`          | Xác thực E2E repo/trực tiếp và đường dẫn phát hành Docker.            |
| `package`           | Package Acceptance.                                                   |
| `qa`                | QA parity cộng với các lane QA trực tiếp.                             |
| `qa-parity`         | Chỉ các lane QA parity và báo cáo.                                    |
| `qa-live`           | Chỉ ma trận QA trực tiếp và Telegram.                                 |
| `npm-telegram`      | Telegram E2E của gói đã phát hành; yêu cầu `npm_telegram_package_spec`. |

Dùng `live_suite_filter` với `rerun_group=live-e2e` khi một bộ kiểm thử trực tiếp thất bại.
Các id bộ lọc hợp lệ được định nghĩa trong quy trình làm việc trực tiếp/E2E có thể tái sử dụng, bao gồm
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, và
`live-codex-harness-docker`.

## Bằng chứng cần giữ

Giữ phần tóm tắt `Full Release Validation` làm chỉ mục cấp phát hành. Nó liên kết
các id lượt chạy child và bao gồm các bảng job chậm nhất. Với lỗi, trước tiên hãy kiểm tra
quy trình làm việc child, rồi chạy lại handle nhỏ nhất phù hợp ở trên.

Artifact hữu ích:

- `release-package-under-test` từ `OpenClaw Release Checks`
- Artifact đường dẫn phát hành Docker trong `.artifacts/docker-tests/`
- `package-under-test` của Package Acceptance và artifact chấp nhận Docker
- Artifact kiểm tra phát hành đa hệ điều hành cho từng hệ điều hành và bộ kiểm thử
- Artifact QA parity, Matrix, và Telegram

## Tệp quy trình làm việc

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
