---
read_when:
    - Chạy hoặc chạy lại quy trình xác thực bản phát hành đầy đủ
    - So sánh các hồ sơ xác minh phát hành ổn định và đầy đủ
    - Gỡ lỗi các lỗi ở giai đoạn xác thực bản phát hành
summary: Các giai đoạn Xác thực bản phát hành đầy đủ, quy trình công việc con, hồ sơ phát hành, mã định danh chạy lại và bằng chứng
title: Xác thực đầy đủ bản phát hành
x-i18n:
    generated_at: "2026-05-11T20:36:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d83d15272e4f7cff82ef791c8dbeb6adc447626ada8ae221d074ee16b2cadd5
    source_path: reference/full-release-validation.md
    workflow: 16
---

`Full Release Validation` là ô phát hành bao trùm. Đây là điểm vào thủ công duy nhất
cho bằng chứng tiền phát hành, nhưng phần lớn công việc diễn ra trong các quy trình con
để một hộp bị lỗi có thể được chạy lại mà không phải khởi động lại toàn bộ bản phát hành.

Chạy nó từ một tham chiếu quy trình đáng tin cậy, thường là `main`, và truyền nhánh phát hành,
thẻ, hoặc SHA commit đầy đủ làm `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable
```

Các quy trình con dùng tham chiếu quy trình đáng tin cậy cho harness và đầu vào
`ref` cho ứng viên đang được kiểm thử. Điều đó giữ cho logic xác thực mới luôn sẵn có
khi xác thực một nhánh hoặc thẻ phát hành cũ hơn.

Theo mặc định, `release_profile=stable` chạy các làn chặn phát hành và bỏ qua
quá trình soak live/Docker đầy đủ. Truyền `run_release_soak=true` để bao gồm các
làn soak trong một lần chạy ổn định. `release_profile=full` luôn bật các làn soak để
hồ sơ tư vấn rộng không bao giờ âm thầm mất phạm vi kiểm thử.

Chấp nhận gói thường xây dựng tarball ứng viên từ `ref` đã phân giải, bao gồm
các lần chạy SHA đầy đủ được gửi bằng `pnpm ci:full-release`. Sau khi phát hành beta,
truyền `release_package_spec=openclaw@YYYY.M.D-beta.N` để tái sử dụng gói npm đã phát hành
trên các kiểm tra phát hành, Chấp nhận gói, đa hệ điều hành,
Docker đường dẫn phát hành, và gói Telegram. Chỉ dùng `package_acceptance_package_spec`
khi Chấp nhận gói cần cố ý chứng minh một gói khác.

## Các giai đoạn cấp cao nhất

| Giai đoạn            | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phân giải mục tiêu   | **Job:** `Resolve target ref`<br />**Quy trình con:** không có<br />**Chứng minh:** phân giải nhánh phát hành, thẻ, hoặc SHA commit đầy đủ và ghi lại các đầu vào đã chọn.<br />**Chạy lại:** chạy lại ô bao trùm nếu bước này thất bại.                                                                                                                                                                                                     |
| Vitest và CI thường  | **Job:** `Run normal full CI`<br />**Quy trình con:** `CI`<br />**Chứng minh:** đồ thị CI đầy đủ thủ công trên tham chiếu mục tiêu, bao gồm các làn Linux Node, các shard Plugin đi kèm, hợp đồng kênh, tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu, kỹ năng Python, Windows, macOS, i18n Control UI, và Android thông qua ô bao trùm.<br />**Chạy lại:** `rerun_group=ci`.                                 |
| Tiền phát hành Plugin | **Job:** `Run plugin prerelease validation`<br />**Quy trình con:** `Plugin Prerelease`<br />**Chứng minh:** kiểm tra tĩnh Plugin chỉ dành cho phát hành, phạm vi kiểm thử Plugin agentic, các shard lô extension đầy đủ, các làn Docker tiền phát hành Plugin, và tạo phẩm `plugin-inspector-advisory` không chặn để phân loại tương thích.<br />**Chạy lại:** `rerun_group=plugin-prerelease`.                                             |
| Kiểm tra phát hành   | **Job:** `Run release/live/Docker/QA validation`<br />**Quy trình con:** `OpenClaw Release Checks`<br />**Chứng minh:** smoke cài đặt, kiểm tra gói đa hệ điều hành, Chấp nhận gói, tương đồng QA Lab, Matrix live, và Telegram live. Với `run_release_soak=true` hoặc `release_profile=full`, cũng chạy các bộ kiểm thử live/E2E đầy đủ và các đoạn Docker đường dẫn phát hành.<br />**Chạy lại:** `rerun_group=release-checks` hoặc một handle release-checks hẹp hơn. |
| Tạo phẩm gói         | **Job:** `Prepare release package artifact`<br />**Quy trình con:** không có<br />**Chứng minh:** tạo tarball `release-package-under-test` của cha đủ sớm cho các kiểm tra hướng gói không cần chờ `OpenClaw Release Checks`.<br />**Chạy lại:** chạy lại ô bao trùm hoặc cung cấp `release_package_spec` cho các lần chạy lại gói đã phát hành.                                                                                           |
| Gói Telegram         | **Job:** `Run package Telegram E2E`<br />**Quy trình con:** `NPM Telegram Beta E2E`<br />**Chứng minh:** bằng chứng gói Telegram dựa trên tạo phẩm cha cho `rerun_group=all` với `release_profile=full`, hoặc bằng chứng Telegram cho gói đã phát hành khi `release_package_spec` hoặc `npm_telegram_package_spec` được đặt.<br />**Chạy lại:** `rerun_group=npm-telegram` với `release_package_spec` hoặc `npm_telegram_package_spec`.      |
| Bộ xác minh ô bao trùm | **Job:** `Verify full validation`<br />**Quy trình con:** không có<br />**Chứng minh:** kiểm tra lại kết luận các lần chạy con đã ghi và nối thêm bảng job chậm nhất từ các quy trình con.<br />**Chạy lại:** chỉ chạy lại job này sau khi chạy lại một quy trình con thất bại đến khi xanh.                                                                                                                                                  |

Với `ref=main` và `rerun_group=all`, một ô bao trùm mới hơn thay thế một ô cũ hơn.
Khi cha bị hủy, bộ giám sát của nó sẽ hủy mọi quy trình con mà nó đã gửi.
Các lần chạy xác thực nhánh và thẻ phát hành không hủy lẫn nhau theo mặc định.

## Các giai đoạn kiểm tra phát hành

`OpenClaw Release Checks` là quy trình con lớn nhất. Nó phân giải mục tiêu
một lần và chuẩn bị một tạo phẩm `release-package-under-test` dùng chung khi các giai đoạn
hướng gói hoặc Docker cần đến.

| Giai đoạn               | Chi tiết                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mục tiêu phát hành      | **Job:** `Resolve target ref`<br />**Backing workflow:** không có<br />**Tests:** ref đã chọn, SHA dự kiến tùy chọn, hồ sơ, nhóm chạy lại và bộ lọc bộ kiểm thử live tập trung.<br />**Rerun:** `rerun_group=release-checks`.                                                                                                                                                                                                                                                                              |
| Artifact gói    | **Job:** `Prepare release package artifact`<br />**Backing workflow:** không có<br />**Tests:** đóng gói hoặc phân giải một tarball ứng viên và tải lên `release-package-under-test` cho các kiểm tra hướng tới gói ở hạ nguồn.<br />**Rerun:** gói bị ảnh hưởng, nhóm cross-OS hoặc live/E2E.                                                                                                                                                                                                              |
| Smoke cài đặt       | **Job:** `Run install smoke`<br />**Backing workflow:** `Install Smoke`<br />**Tests:** đường dẫn cài đặt đầy đủ với việc tái sử dụng image smoke Dockerfile gốc, cài đặt gói QR, smoke Docker gốc và Gateway, kiểm thử Docker cho trình cài đặt, smoke image-provider cho cài đặt toàn cục Bun và E2E cài đặt/gỡ cài đặt Plugin đóng gói sẵn nhanh.<br />**Rerun:** `rerun_group=install-smoke`.                                                                                                                                 |
| Cross-OS            | **Job:** `cross_os_release_checks`<br />**Backing workflow:** `OpenClaw Cross-OS Release Checks (Reusable)`<br />**Tests:** các lane cài mới và nâng cấp trên Linux, Windows và macOS cho provider và chế độ đã chọn, dùng tarball ứng viên cùng một gói baseline.<br />**Rerun:** `rerun_group=cross-os`.                                                                                                                                                                                  |
| Repo và live E2E   | **Job:** `Run repo/live E2E validation`<br />**Backing workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** E2E kho lưu trữ, cache live, streaming websocket OpenAI, các shard provider và Plugin live native, cùng các harness model/backend/Gateway live dựa trên Docker được chọn bởi `release_profile`.<br />**Runs:** `run_release_soak=true`, `release_profile=full`, hoặc `rerun_group=live-e2e` tập trung.<br />**Rerun:** `rerun_group=live-e2e`, tùy chọn kèm `live_suite_filter`. |
| Đường dẫn phát hành Docker | **Job:** `Run Docker release-path validation`<br />**Backing workflow:** `OpenClaw Live And E2E Checks (Reusable)`<br />**Tests:** các chunk Docker release-path chạy với artifact gói dùng chung.<br />**Runs:** `run_release_soak=true`, `release_profile=full`, hoặc `rerun_group=live-e2e` tập trung.<br />**Rerun:** `rerun_group=live-e2e`.                                                                                                                                                      |
| Chấp nhận gói  | **Job:** `Run package acceptance`<br />**Backing workflow:** `Package Acceptance`<br />**Tests:** fixture gói Plugin offline, cập nhật Plugin, chấp nhận gói Telegram mock-OpenAI và các kiểm tra survivor nâng cấp từ bản đã phát hành với cùng tarball. Các kiểm tra phát hành chặn dùng baseline đã phát hành mới nhất mặc định; kiểm tra soak mở rộng đến mọi bản phát hành npm ổn định tại hoặc sau `2026.4.23` cộng với fixture sự cố đã báo cáo.<br />**Rerun:** `rerun_group=package`.                          |
| Tương đương QA           | **Job:** `Run QA Lab parity lane` và `Run QA Lab parity report`<br />**Backing workflow:** job trực tiếp<br />**Tests:** các gói tương đương tác nhân cho ứng viên và baseline, sau đó là báo cáo tương đương.<br />**Rerun:** `rerun_group=qa-parity` hoặc `rerun_group=qa`.                                                                                                                                                                                                                                          |
| Ma trận live QA      | **Job:** `Run QA Lab live Matrix lane`<br />**Backing workflow:** job trực tiếp<br />**Tests:** hồ sơ QA Ma trận live nhanh trong môi trường `qa-live-shared`.<br />**Rerun:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                                                                                                           |
| QA live Telegram    | **Job:** `Run QA Lab live Telegram lane`<br />**Backing workflow:** job trực tiếp<br />**Tests:** QA Telegram live với thuê thông tin xác thực Convex CI.<br />**Rerun:** `rerun_group=qa-live` hoặc `rerun_group=qa`.                                                                                                                                                                                                                                                                                       |
| Bộ xác minh phát hành    | **Job:** `Verify release checks`<br />**Backing workflow:** không có<br />**Tests:** các job release-check bắt buộc cho nhóm chạy lại đã chọn.<br />**Rerun:** chạy lại sau khi các job con tập trung đạt.                                                                                                                                                                                                                                                                                                    |

## Các chunk Docker release-path

Giai đoạn Docker release-path chạy các chunk này khi `live_suite_filter`
trống:

| Chunk                                                           | Phạm vi bao phủ                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `core`                                                          | Các lane smoke Docker release-path lõi.                                                             |
| `package-update-openai`                                         | Hành vi cài đặt/cập nhật gói OpenAI, cài đặt Codex theo yêu cầu và lệnh gọi công cụ Chat Completions. |
| `package-update-anthropic`                                      | Hành vi cài đặt và cập nhật gói Anthropic.                                                    |
| `package-update-core`                                           | Hành vi gói và cập nhật không phụ thuộc provider.                                                     |
| `plugins-runtime-plugins`                                       | Các lane runtime Plugin kiểm thử hành vi Plugin.                                               |
| `plugins-runtime-services`                                      | Các lane runtime Plugin dựa trên dịch vụ và live; bao gồm OpenWebUI khi được yêu cầu.                  |
| `plugins-runtime-install-a` through `plugins-runtime-install-h` | Các lô cài đặt/runtime Plugin được chia để xác thực phát hành song song.                             |

Dùng `docker_lanes=<lane[,lane]>` có mục tiêu trên workflow live/E2E tái sử dụng khi
chỉ một lane Docker thất bại. Artifact phát hành bao gồm các lệnh chạy lại theo từng lane
với artifact gói và đầu vào tái sử dụng image khi có sẵn.

## Hồ sơ phát hành

`release_profile` chủ yếu kiểm soát độ rộng live/provider bên trong kiểm tra phát hành.
Nó không loại bỏ CI đầy đủ thông thường, Plugin Prerelease, smoke cài đặt, chấp nhận gói
hoặc QA Lab. Với `stable`, E2E repo/live toàn diện và các chunk Docker
release-path là phạm vi soak và chạy khi `run_release_soak=true`.
`full` buộc bật phạm vi soak và cũng khiến lần chạy bao trùm chạy E2E gói Telegram
với artifact gói phát hành cha khi `rerun_group=all`, để ứng viên
pre-publish đầy đủ không âm thầm bỏ qua lane gói Telegram đó.

| Hồ sơ   | Mục đích sử dụng                      | Phạm vi live/provider được bao gồm                                                                                                                                                     |
| --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimum` | Smoke nhanh nhất cho phần trọng yếu của phát hành.   | Đường dẫn live OpenAI/lõi, model live Docker cho OpenAI, lõi Gateway native, hồ sơ Gateway OpenAI native, Plugin OpenAI native và Gateway live Docker OpenAI.                     |
| `stable`  | Hồ sơ phê duyệt phát hành mặc định. | `minimum` cộng với smoke Anthropic, Google, MiniMax, backend, harness kiểm thử live native, backend CLI live Docker, bind ACP Docker, harness Codex Docker và một shard smoke OpenCode Go. |
| `full`    | Quét tư vấn rộng.             | `stable` cộng với provider tư vấn, shard Plugin live và shard media live.                                                                                                        |

## Bổ sung chỉ dành cho full

Các bộ kiểm thử này bị `stable` bỏ qua và được `full` bao gồm:

| Khu vực                             | Phạm vi chỉ dành cho full                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Model live Docker               | OpenCode Go, OpenRouter, xAI, Z.ai và Fireworks.                                                                          |
| Gateway live Docker              | Provider tư vấn được chia thành các shard DeepSeek/Fireworks, OpenCode Go/OpenRouter và xAI/Z.ai.                              |
| Hồ sơ provider Gateway native | Các shard Anthropic Opus và Sonnet/Haiku đầy đủ, Fireworks, DeepSeek, các shard model OpenCode Go đầy đủ, OpenRouter, xAI và Z.ai. |
| Shard Plugin live native        | Plugins A-K, L-N, O-Z other, Moonshot và xAI.                                                                             |
| Shard media live native         | Audio, Google music, MiniMax music và các nhóm video A-D.                                                                   |

`stable` bao gồm `native-live-src-gateway-profiles-anthropic-smoke` và
`native-live-src-gateway-profiles-opencode-go-smoke`; `full` dùng các shard
model Anthropic và OpenCode Go rộng hơn thay thế. Các lần chạy lại tập trung vẫn có thể dùng
handle tổng hợp `native-live-src-gateway-profiles-anthropic` hoặc
`native-live-src-gateway-profiles-opencode-go`.

## Chạy lại tập trung

Dùng `rerun_group` để tránh lặp lại các hộp phát hành không liên quan:

| Định danh          | Phạm vi                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| `all`               | Tất cả các giai đoạn Xác thực bản phát hành đầy đủ.                                             |
| `ci`                | Chỉ workflow con CI đầy đủ thủ công.                                                            |
| `plugin-prerelease` | Chỉ workflow con tiền phát hành Plugin.                                                         |
| `release-checks`    | Tất cả các giai đoạn Kiểm tra bản phát hành OpenClaw.                                           |
| `install-smoke`     | Kiểm thử nhanh cài đặt thông qua các kiểm tra bản phát hành.                                    |
| `cross-os`          | Kiểm tra bản phát hành đa hệ điều hành.                                                         |
| `live-e2e`          | Xác thực E2E repo/live và đường dẫn phát hành Docker.                                           |
| `package`           | Chấp nhận gói.                                                                                  |
| `qa`                | Tương đương QA cộng với các làn QA live.                                                        |
| `qa-parity`         | Chỉ các làn tương đương QA và báo cáo.                                                          |
| `qa-live`           | Chỉ Matrix và Telegram QA live.                                                                 |
| `npm-telegram`      | E2E Telegram của gói đã phát hành; yêu cầu `release_package_spec` hoặc `npm_telegram_package_spec`. |

Dùng `live_suite_filter` với `rerun_group=live-e2e` khi một bộ kiểm thử live thất bại.
Các id bộ lọc hợp lệ được định nghĩa trong workflow live/E2E tái sử dụng, bao gồm
`docker-live-models`, `live-gateway-docker`,
`live-gateway-anthropic-docker`, `live-gateway-google-docker`,
`live-gateway-minimax-docker`, `live-gateway-advisory-docker`,
`live-cli-backend-docker`, `live-acp-bind-docker`, và
`live-codex-harness-docker`.

Định danh `live-gateway-advisory-docker` là định danh chạy lại tổng hợp cho ba shard
nhà cung cấp của nó, vì vậy nó vẫn phân nhánh ra tất cả các job Gateway Docker tư vấn.

Dùng `cross_os_suite_filter` với `rerun_group=cross-os` khi một làn đa hệ điều hành
thất bại. Bộ lọc chấp nhận id hệ điều hành, id bộ kiểm thử, hoặc cặp hệ điều hành/bộ kiểm thử, ví dụ
`windows/packaged-upgrade`, `windows`, hoặc `packaged-fresh`. Tóm tắt đa hệ điều hành
bao gồm thời lượng theo từng pha cho các làn nâng cấp đóng gói, và các lệnh chạy lâu
in các dòng Heartbeat để bản cập nhật Windows bị kẹt có thể thấy được trước khi
job hết thời gian chờ.

Các làn kiểm tra bản phát hành QA có tính chất tư vấn. Lỗi chỉ thuộc QA được báo cáo dưới dạng cảnh báo
và không chặn trình xác minh kiểm tra bản phát hành; chạy lại `rerun_group=qa`,
`qa-parity`, hoặc `qa-live` khi bạn cần bằng chứng QA mới.

## Bằng chứng cần giữ

Giữ bản tóm tắt `Xác thực bản phát hành đầy đủ` làm chỉ mục cấp bản phát hành. Nó liên kết
các id lần chạy con và bao gồm bảng các job chậm nhất. Khi có lỗi, trước tiên hãy kiểm tra
workflow con, sau đó chạy lại định danh khớp nhỏ nhất ở trên.

Artifacts hữu ích:

- `release-package-under-test` từ parent Xác thực bản phát hành đầy đủ và `Kiểm tra bản phát hành OpenClaw`
- Artifacts đường dẫn phát hành Docker trong `.artifacts/docker-tests/`
- `package-under-test` của Chấp nhận gói và artifacts chấp nhận Docker
- Artifacts kiểm tra bản phát hành đa hệ điều hành cho từng hệ điều hành và bộ kiểm thử
- Artifacts tương đương QA, Matrix và Telegram

## Tệp workflow

- `.github/workflows/full-release-validation.yml`
- `.github/workflows/openclaw-release-checks.yml`
- `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml`
- `.github/workflows/plugin-prerelease.yml`
- `.github/workflows/install-smoke.yml`
- `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- `.github/workflows/package-acceptance.yml`
