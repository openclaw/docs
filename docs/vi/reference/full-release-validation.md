---
read_when:
    - Chạy hoặc chạy lại Xác thực bản phát hành đầy đủ
    - So sánh các hồ sơ xác thực bản phát hành ổn định và đầy đủ
    - Gỡ lỗi các lỗi ở giai đoạn xác thực bản phát hành
summary: Các giai đoạn Xác thực Bản phát hành Đầy đủ, quy trình con, hồ sơ phát hành, tay cầm chạy lại và bằng chứng
title: Xác thực bản phát hành đầy đủ
x-i18n:
    generated_at: "2026-06-27T18:08:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 791930254e3cac7da101d809cfc9b56773225159574d3727189f67cf85bd3fce
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` là quy trình bao trùm cho bản phát hành. Đây là điểm vào thủ công duy nhất
để cung cấp bằng chứng trước phát hành, nhưng phần lớn công việc diễn ra trong các workflow con để một
máy bị lỗi có thể được chạy lại mà không cần khởi động lại toàn bộ bản phát hành.

Chạy nó từ một ref workflow đáng tin cậy, thường là `main`, và truyền nhánh phát hành,
tag hoặc SHA commit đầy đủ làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Các workflow con dùng ref workflow đáng tin cậy cho harness và đầu vào
`ref` cho ứng viên đang được kiểm thử. Điều đó giúp logic xác thực mới luôn khả dụng
khi xác thực một nhánh hoặc tag phát hành cũ hơn.

`release_profile=stable` và `release_profile=full` luôn chạy quy trình soak
live/Docker đầy đủ. Truyền `run_release_soak=true` để bao gồm cùng các lane soak
với profile beta. Việc phát hành ổn định sẽ từ chối manifest xác thực nếu thiếu
soak này và bằng chứng product-performance có tính chặn.

Package Acceptance thường dựng tarball ứng viên từ
`ref` đã phân giải, bao gồm các lần chạy full-SHA được dispatch bằng `pnpm ci:full-release`. Sau khi
phát hành beta, truyền `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` để tái sử dụng
gói npm đã phát hành trên các kiểm tra phát hành, Package Acceptance, cross-OS,
Docker release-path và package Telegram. Chỉ dùng `package_acceptance_package_spec`
khi Package Acceptance cần chủ đích chứng minh một gói khác.
Lane gói live của Plugin Codex tuân theo cùng trạng thái: các giá trị
`release_package_spec` đã phát hành suy ra `codex_plugin_spec=npm:@openclaw/codex@<version>`;
các lần chạy SHA/artifact đóng gói `extensions/codex` từ ref đã chọn; và operator
có thể đặt trực tiếp `codex_plugin_spec` cho các nguồn Plugin
`npm:`, `npm-pack:` hoặc `git:`. Lane này cấp phê duyệt cài đặt Codex CLI rõ ràng mà
Plugin đó yêu cầu, sau đó chạy preflight Codex CLI và các lượt tác tử OpenAI trong cùng phiên.

## Các giai đoạn cấp cao nhất

| Giai đoạn            | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Phân giải mục tiêu   | **Job:** `Resolve target ref`<br />**Workflow con:** không có<br />**Chứng minh:** phân giải nhánh phát hành, tag hoặc SHA commit đầy đủ và ghi lại các đầu vào đã chọn.<br />**Chạy lại:** chạy lại workflow bao trùm nếu bước này lỗi.                                                                                                                                                                                                                                             |
| Vitest và CI thường  | **Job:** `Run normal full CI`<br />**Workflow con:** `CI`<br />**Chứng minh:** đồ thị CI đầy đủ thủ công trên ref mục tiêu, bao gồm các lane Linux Node, shard Plugin đi kèm, shard hợp đồng Plugin và kênh, khả năng tương thích Node 22, `check-*`, `check-additional-*`, kiểm tra smoke artifact đã build, kiểm tra tài liệu, Python skills, Windows, macOS, i18n Control UI và Android thông qua workflow bao trùm.<br />**Chạy lại:** `rerun_group=ci`.                           |
| Tiền phát hành Plugin | **Job:** `Run plugin prerelease validation`<br />**Workflow con:** `Plugin Prerelease`<br />**Chứng minh:** các kiểm tra tĩnh Plugin chỉ dành cho phát hành, phạm vi Plugin agentic, các shard batch extension đầy đủ, các lane Docker tiền phát hành Plugin và artifact `plugin-inspector-advisory` không chặn để phân loại tương thích.<br />**Chạy lại:** `rerun_group=plugin-prerelease`.                                                                                        |
| Kiểm tra phát hành   | **Job:** `Run release/live/Docker/QA validation`<br />**Workflow con:** `OpenClaw Release Checks`<br />**Chứng minh:** smoke cài đặt, kiểm tra gói cross-OS, Package Acceptance, tương đương QA Lab, live Matrix và live Telegram. Các profile stable và full cũng chạy bộ kiểm thử live/E2E đầy đủ và các chunk Docker release-path; beta có thể bật bằng `run_release_soak=true`.<br />**Chạy lại:** `rerun_group=release-checks` hoặc một handle release-checks hẹp hơn. |
| Package Telegram     | **Job:** `Run package Telegram E2E`<br />**Workflow con:** `NPM Telegram Beta E2E`<br />**Chứng minh:** một E2E Telegram tập trung cho gói đã phát hành khi `release_package_spec` hoặc `npm_telegram_package_spec` được đặt. Xác thực ứng viên đầy đủ dùng Package Acceptance Telegram E2E chuẩn thay thế.<br />**Chạy lại:** `rerun_group=npm-telegram` với `release_package_spec` hoặc `npm_telegram_package_spec`.                                               |
| Bộ xác minh bao trùm | **Job:** `Verify full validation`<br />**Workflow con:** không có<br />**Chứng minh:** kiểm tra lại kết luận của các lần chạy con đã ghi nhận và thêm bảng job chậm nhất từ các workflow con.<br />**Chạy lại:** chỉ chạy lại job này sau khi chạy lại workflow con bị lỗi đến khi xanh.                                                                                                                                                                                                  |

Với `ref=main` và `rerun_group=all`, một workflow bao trùm mới hơn sẽ thay thế một workflow cũ hơn.
Khi workflow cha bị hủy, bộ giám sát của nó hủy mọi workflow con mà nó đã
dispatch. Các lần chạy xác thực nhánh phát hành và tag mặc định không hủy lẫn nhau.

## Các giai đoạn kiểm tra phát hành

`OpenClaw Release Checks` là workflow con lớn nhất. Nó phân giải mục tiêu
một lần và chuẩn bị artifact `release-package-under-test` dùng chung khi các giai đoạn
liên quan đến gói hoặc Docker cần đến.

| Giai đoạn           | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu phát hành  | **Tác vụ:** `Resolve target ref`<br />**Quy trình công việc hỗ trợ:** không có<br />**Kiểm thử:** ref đã chọn, SHA kỳ vọng tùy chọn, hồ sơ, nhóm chạy lại và bộ lọc bộ kiểm thử live tập trung.<br />**Chạy lại:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                  |
| Hiện vật gói        | **Tác vụ:** `Prepare release package artifact`<br />**Quy trình công việc hỗ trợ:** không có<br />**Kiểm thử:** đóng gói hoặc phân giải một tarball ứng viên và tải lên `release-package-under-test` cho các kiểm tra hạ nguồn hướng tới gói.<br />**Chạy lại:** gói, nhóm đa hệ điều hành hoặc nhóm live/E2E bị ảnh hưởng.                                                                                                                                                                       |
| Smoke cài đặt       | **Tác vụ:** `Run install smoke`<br />**Quy trình công việc hỗ trợ:** `Install Smoke`<br />**Kiểm thử:** đường dẫn cài đặt đầy đủ với việc tái sử dụng image smoke Dockerfile gốc, cài đặt gói QR, smoke Docker gốc và Gateway, kiểm thử Docker của trình cài đặt, smoke image-provider cài đặt toàn cục Bun và E2E cài đặt/gỡ cài đặt Plugin được đóng gói nhanh.<br />**Chạy lại:** `rerun_group=install-smoke`.                                                                               |
| Đa hệ điều hành     | **Tác vụ:** `cross_os_release_checks`<br />**Quy trình công việc hỗ trợ:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Kiểm thử:** các lane mới và nâng cấp trên Linux, Windows và macOS cho provider và chế độ đã chọn, dùng tarball ứng viên cùng với một gói baseline.<br />**Chạy lại:** `rerun_group=cross-os`.                                                                                                                                                                      |
| Repo và live E2E    | **Tác vụ:** `Run repo/live E2E validation`<br />**Quy trình công việc hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** E2E repository, bộ nhớ đệm live, truyền phát websocket OpenAI, các shard provider live gốc và Plugin, cùng các harness model/backend/Gateway live dựa trên Docker được chọn bởi `release_profile`.<br />**Chạy:** `run_release_soak=true`, `release_profile=full`, hoặc `rerun_group=live-e2e` tập trung.<br />**Chạy lại:** `rerun_group=live-e2e`, tùy chọn với `live_suite_filter`. |
| Đường dẫn phát hành Docker | **Tác vụ:** `Run Docker release-path validation`<br />**Quy trình công việc hỗ trợ:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Kiểm thử:** các phần Docker theo đường dẫn phát hành chạy với hiện vật gói dùng chung.<br />**Chạy:** `run_release_soak=true`, `release_profile=full`, hoặc `rerun_group=live-e2e` tập trung.<br />**Chạy lại:** `rerun_group=live-e2e`.                                                                                                                       |
| Package Acceptance  | **Tác vụ:** `Run package acceptance`<br />**Quy trình công việc hỗ trợ:** `Package Acceptance`<br />**Kiểm thử:** fixture gói Plugin offline, cập nhật Plugin, E2E gói Telegram mock-OpenAI chuẩn và kiểm tra khả năng sống sót sau nâng cấp đã phát hành trên cùng tarball. Các kiểm tra phát hành chặn dùng baseline mặc định là bản phát hành mới nhất; kiểm tra soak mở rộng tới mọi bản phát hành npm ổn định từ `2026.4.23` trở đi cộng với fixture sự cố đã báo cáo.<br />**Chạy lại:** `rerun_group=package`. |
| Tương đồng QA       | **Tác vụ:** `Run QA Lab parity lane` và `Run QA Lab parity report`<br />**Quy trình công việc hỗ trợ:** tác vụ trực tiếp<br />**Kiểm thử:** các gói tương đồng agentic của ứng viên và baseline, sau đó là báo cáo tương đồng.<br />**Chạy lại:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                                                                                                    |
| QA live Matrix      | **Tác vụ:** `Run QA Lab live Matrix lane`<br />**Quy trình công việc hỗ trợ:** tác vụ trực tiếp<br />**Kiểm thử:** hồ sơ QA Matrix live nhanh trong môi trường `qa-live-shared`.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                                                                                  |
| QA live Telegram    | **Tác vụ:** `Run QA Lab live Telegram lane`<br />**Quy trình công việc hỗ trợ:** tác vụ trực tiếp<br />**Kiểm thử:** QA Telegram live với lease thông tin xác thực Convex CI.<br />**Chạy lại:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                                                                                       |
| Trình xác minh phát hành | **Tác vụ:** `Verify release checks`<br />**Quy trình công việc hỗ trợ:** không có<br />**Kiểm thử:** các tác vụ kiểm tra phát hành bắt buộc cho nhóm chạy lại đã chọn.<br />**Chạy lại:** chạy lại sau khi các tác vụ con tập trung vượt qua.                                                                                                                                                                                                                                                     |

## Các phần đường dẫn phát hành Docker

Giai đoạn đường dẫn phát hành Docker chạy các phần này khi `live_suite_filter`
trống:

| Phần                                                            | Phạm vi bao phủ                                                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `core`                                                          | Các lane smoke đường dẫn phát hành Docker lõi.                                                                              |
| `package-update-openai`                                         | Hành vi cài đặt/cập nhật gói OpenAI, cài đặt Codex theo nhu cầu, lượt live Plugin Codex và lệnh gọi công cụ Chat Completions. |
| `package-update-anthropic`                                      | Hành vi cài đặt và cập nhật gói Anthropic.                                                                                  |
| `package-update-core`                                           | Hành vi gói và cập nhật không phụ thuộc provider.                                                                           |
| `plugins-runtime-plugins`                                       | Các lane runtime Plugin thực thi hành vi Plugin.                                                                            |
| `plugins-runtime-services`                                      | Các lane runtime Plugin có dịch vụ hỗ trợ và live; bao gồm OpenWebUI khi được yêu cầu.                                      |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Các lô cài đặt/runtime Plugin được chia để xác thực phát hành song song.                                                     |

Dùng `docker_lanes=<lane[,lane]>` có mục tiêu trên quy trình công việc live/E2E có thể tái sử dụng khi
chỉ một lane Docker thất bại. Hiện vật phát hành bao gồm các lệnh chạy lại theo từng lane
với hiện vật gói và đầu vào tái sử dụng image khi có.

## Hồ sơ phát hành

`release_profile` chủ yếu kiểm soát độ rộng live/provider bên trong các kiểm tra phát hành.
Nó không loại bỏ CI đầy đủ thông thường, Plugin Prerelease, smoke cài đặt, package
acceptance hoặc QA Lab. Các hồ sơ ổn định và đầy đủ luôn chạy phạm vi repo/live
E2E toàn diện và soak đường dẫn phát hành Docker. Hồ sơ beta có thể chọn tham gia bằng
`run_release_soak=true`. Package Acceptance cung cấp E2E Telegram gói chuẩn
cho mọi ứng viên đầy đủ, vì vậy umbrella không lặp lại poller live đó.

| Hồ sơ     | Mục đích sử dụng                  | Phạm vi bao phủ live/provider được bao gồm                                                                                                                                          |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke nhanh nhất cho phát hành quan trọng. | Đường dẫn live OpenAI/lõi, model live Docker cho OpenAI, lõi Gateway gốc, hồ sơ Gateway OpenAI gốc, Plugin OpenAI gốc và Gateway OpenAI live Docker.                              |
| `stable`  | Hồ sơ phê duyệt phát hành mặc định. | `minimum` cộng với smoke Anthropic, Google, MiniMax, backend, harness kiểm thử live gốc, backend CLI live Docker, bind ACP Docker, harness Codex Docker và một shard smoke OpenCode Go. |
| `full`    | Quét tư vấn rộng.                 | `stable` cộng với các provider tư vấn, shard live Plugin và shard live media.                                                                                                      |

## Bổ sung chỉ dành cho full

Các bộ kiểm thử này bị `stable` bỏ qua và được `full` bao gồm:

| Khu vực                          | Phạm vi bao phủ chỉ dành cho full                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Model live Docker                | OpenCode Go, OpenRouter, xAI, Z.ai và Fireworks.                                                                            |
| Gateway live Docker              | Các provider tư vấn được chia thành các shard DeepSeek/Fireworks, OpenCode Go/OpenRouter và xAI/Z.ai.                       |
| Hồ sơ provider Gateway gốc       | Các shard Anthropic Opus và Sonnet/Haiku đầy đủ, Fireworks, DeepSeek, shard model OpenCode Go đầy đủ, OpenRouter, xAI và Z.ai. |
| Shard live Plugin gốc            | Plugins A-K, L-N, O-Z khác, Moonshot và xAI.                                                                                |
| Shard live media gốc             | Audio, nhạc Google, nhạc MiniMax và các nhóm video A-D.                                                                      |

`stable` bao gồm `native-live-src-gateway-profiles-anthropic-smoke` và
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` dùng các shard
model Anthropic và OpenCode Go rộng hơn thay vào đó. Các lần chạy lại tập trung vẫn có thể dùng các
handle tổng hợp `native-live-src-gateway-profiles-anthropic` hoặc
`native-live-src-gateway-profiles-opencode-go`.

## Chạy lại tập trung

Sử dụng `rerun_group` để tránh lặp lại các hộp bản phát hành không liên quan:

| Tên xử lý           | Phạm vi                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Tất cả các giai đoạn Xác thực bản phát hành đầy đủ.                                             |
| `ci`                | Chỉ tiến trình con CI đầy đủ thủ công.                                                          |
| `plugin-prerelease` | Chỉ tiến trình con Plugin Prerelease.                                                           |
| `release-checks`    | Tất cả các giai đoạn Kiểm tra bản phát hành OpenClaw.                                           |
| `install-smoke`     | Install Smoke thông qua kiểm tra bản phát hành.                                                 |
| `cross-os`          | Kiểm tra bản phát hành đa hệ điều hành.                                                         |
| `live-e2e`          | Xác thực E2E repo/live và đường dẫn phát hành Docker.                                           |
| `package`           | Package Acceptance.                                                                             |
| `qa`                | Tương đồng QA cộng với các làn QA live.                                                         |
| `qa-parity`         | Chỉ các làn tương đồng QA và báo cáo.                                                           |
| `qa-live`           | Matrix/Telegram live QA cộng với các làn Discord, WhatsApp và Slack được kiểm soát khi bật.     |
| `npm-telegram`      | E2E Telegram cho gói đã phát hành; yêu cầu `release_package_spec` hoặc `npm_telegram_package_spec`. |

Sử dụng `live_suite_filter` với `rerun_group=live-e2e` khi một bộ live bị lỗi.
Các id bộ lọc hợp lệ được định nghĩa trong workflow live/E2E tái sử dụng, bao gồm
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, và
`live-codex-harness-docker`.

Tên xử lý `live-gateway-advisory-docker` là tên xử lý chạy lại tổng hợp cho
ba shard nhà cung cấp của nó, nên nó vẫn tỏa ra tất cả các job Gateway Docker tư vấn.

Sử dụng `cross_os_suite_filter` với `rerun_group=cross-os` khi một làn đa hệ điều hành
bị lỗi. Bộ lọc chấp nhận một id hệ điều hành, một id bộ, hoặc một cặp hệ điều hành/bộ, ví dụ
`windows/packaged-upgrade`, `windows`, hoặc `packaged-fresh`. Các bản tóm tắt đa hệ điều hành
bao gồm thời gian theo từng pha cho các làn nâng cấp đóng gói, và các lệnh chạy lâu
in các dòng Heartbeat để một bản cập nhật Windows bị kẹt có thể thấy được trước khi
job hết thời gian chờ.

Các lỗi kiểm tra bản phát hành QA chặn xác thực bản phát hành thông thường. Drift công cụ động
OpenClaw bắt buộc ở tầng tiêu chuẩn cũng chặn trình xác minh kiểm tra bản phát hành.
Các lần chạy Tideclaw alpha vẫn có thể coi các làn kiểm tra bản phát hành không liên quan đến
an toàn gói là tư vấn. Khi `live_suite_filter` yêu cầu rõ ràng một làn QA live có cổng kiểm soát như
Discord, WhatsApp hoặc Slack, biến repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` tương ứng phải được bật; nếu không,
việc thu thập đầu vào sẽ thất bại thay vì âm thầm bỏ qua làn đó. Chạy lại `rerun_group=qa`,
`qa-parity`, hoặc `qa-live` khi bạn cần bằng chứng QA mới.

## Bằng chứng cần giữ

Giữ bản tóm tắt `Full Release Validation` làm chỉ mục cấp bản phát hành. Nó liên kết
các id lần chạy con và bao gồm bảng các job chậm nhất. Với lỗi, hãy kiểm tra workflow con
trước, rồi chạy lại tên xử lý khớp nhỏ nhất ở trên.

Các artifact hữu ích:

- `release-package-under-test` từ `OpenClaw Release Checks`
- Artifact đường dẫn phát hành Docker trong `.artifacts/docker-tests/`
- `package-under-test` của Package Acceptance và các artifact chấp nhận Docker
- Artifact kiểm tra bản phát hành đa hệ điều hành cho từng hệ điều hành và bộ
- Artifact tương đồng QA, Matrix và Telegram

## Tệp workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
