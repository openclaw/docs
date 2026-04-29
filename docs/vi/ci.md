---
read_when:
    - Bạn cần hiểu vì sao một job CI đã chạy hoặc không chạy
    - Bạn đang gỡ lỗi các kiểm tra GitHub Actions không thành công
summary: Đồ thị công việc CI, các cổng kiểm tra theo phạm vi và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-04-29T22:29:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64ba894cef8b847b3e7a298cfeb2c2977f7c589c64998a8fb5feb17a9e359160
    source_path: ci.md
    workflow: 16
---

CI chạy trên mọi lần đẩy lên `main` và mọi pull request. CI dùng phạm vi thông minh để bỏ qua các job tốn kém khi chỉ những khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và mở rộng toàn bộ đồ thị CI thông thường cho ứng viên phát hành hoặc xác thực diện rộng, với các lane Android chọn bật qua `include_android` cho các lần chạy thủ công độc lập. Các lane prerelease Plugin chỉ dành cho phát hành nằm trong workflow `Plugin Prerelease` riêng và chỉ chạy từ `Full Release Validation` hoặc một lần dispatch thủ công rõ ràng.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies`, một lượt kiểm tra chỉ phụ thuộc Knip cho production được ghim vào phiên bản Knip mới nhất mà script đó dùng, với tuổi phát hành tối thiểu của pnpm bị tắt cho cài đặt `dlx`. Nó cũng chạy `pnpm deadcode:unused-files`, so sánh các phát hiện file không dùng trong production của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Guard đó thất bại khi PR thêm một file không dùng mới chưa được rà soát hoặc để lại mục allowlist cũ sau khi dọn dẹp, đồng thời vẫn giữ các bề mặt Plugin động có chủ ý, được tạo sinh, build, live-test và cầu nối package mà Knip không thể phân giải tĩnh.

`Full Release Validation` là workflow ô dù thủ công cho "chạy mọi thứ
trước khi phát hành." Nó nhận một branch, tag hoặc SHA commit đầy đủ, dispatch
workflow `CI` thủ công với mục tiêu đó, dispatch `Plugin Prerelease` cho
bằng chứng Plugin/package/static/Docker chỉ dành cho phát hành, và dispatch
`OpenClaw Release Checks` cho install smoke, package acceptance, các bộ kiểm thử
đường dẫn phát hành Docker, live/E2E, OpenWebUI, QA Lab parity, Matrix và các
lane Telegram. Nó cũng có thể chạy workflow hậu phát hành `NPM Telegram Beta E2E` khi một
đặc tả package đã phát hành được cung cấp. `release_profile=minimum|stable|full` kiểm soát độ rộng live/provider
được truyền vào release checks: `minimum` giữ các lane OpenAI/core nhanh nhất
và trọng yếu cho phát hành, `stable` thêm tập provider/backend ổn định, và
`full` chạy ma trận provider/media tư vấn rộng. Workflow ô dù ghi lại các
id lần chạy con đã dispatch, và job cuối cùng `Verify full validation` kiểm tra lại
các kết luận lần chạy con hiện tại và thêm các bảng job chậm nhất cho từng
lần chạy con. Nếu một workflow con được chạy lại và chuyển sang xanh, chỉ chạy lại job
verifier cha để làm mới kết quả ô dù và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều
nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho
con CI đầy đủ thông thường, `release-checks` cho mọi con phát hành, hoặc một
nhóm phát hành hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live`, hoặc `npm-telegram` trên workflow ô dù. Điều này giữ cho việc chạy lại
một hộp phát hành thất bại được giới hạn sau một bản sửa tập trung.

Con live/E2E của phát hành giữ phạm vi bao phủ rộng bằng `pnpm test:live` native, nhưng nó
chạy phạm vi đó dưới dạng các shard có tên (`native-live-src-agents`,
`native-live-src-gateway-core`, các job `native-live-src-gateway-profiles`
được lọc theo provider,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, các shard media âm thanh/video được tách, và
các shard nhạc được lọc theo provider) thông qua `scripts/test-live-shard.mjs` thay vì
một job tuần tự. Điều đó giữ nguyên phạm vi file đồng thời làm cho các lỗi
provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp
`native-live-extensions-o-z`, `native-live-extensions-media`, và
`native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại một lần thủ công.

Các shard media live native chạy trong
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi
workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và
`ffprobe`; các job media chỉ xác minh binary trước khi setup. Giữ các bộ live
dựa trên Docker trên runner Blacksmith thông thường, vì container job không phải
nơi phù hợp để khởi chạy các kiểm thử Docker lồng nhau.

Các shard model/backend live dựa trên Docker dùng một image dùng chung riêng
`ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit được chọn. Workflow phát hành
live build và đẩy image đó một lần, sau đó các shard Docker live model,
gateway, CLI backend, ACP bind và Codex harness chạy với
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Nếu các shard đó tự build lại mục tiêu Docker
source đầy đủ một cách độc lập, lần chạy phát hành bị cấu hình sai và sẽ lãng phí thời gian thực
cho các lần build image trùng lặp.

`OpenClaw Release Checks` dùng workflow ref đáng tin cậy để phân giải ref đã chọn
một lần thành tarball `release-package-under-test`, sau đó truyền artifact đó
cho cả workflow Docker đường dẫn phát hành live/E2E và shard package acceptance.
Điều đó giữ byte package nhất quán trên các hộp phát hành và tránh
đóng gói lại cùng một ứng viên trong nhiều job con.

`Package Acceptance` là workflow chạy bên cạnh để xác thực một artifact package
mà không chặn workflow phát hành. Nó phân giải một ứng viên từ một
đặc tả npm đã phát hành, một `package_ref` đáng tin cậy được build bằng harness
`workflow_ref` đã chọn, URL tarball HTTPS với SHA-256, hoặc artifact tarball
từ một lần chạy GitHub Actions khác, tải nó lên dưới dạng `package-under-test`, rồi tái sử dụng
bộ lập lịch Docker release/E2E với tarball đó thay vì đóng gói lại
checkout workflow. Các profile bao phủ smoke, package, product, full, và các lựa chọn
lane Docker tùy chỉnh. Profile `package` dùng phạm vi Plugin offline để
việc xác thực package đã phát hành không phụ thuộc vào tính khả dụng live của ClawHub. Lane
Telegram tùy chọn tái sử dụng artifact
`package-under-test` trong workflow `NPM Telegram Beta E2E`, với đường dẫn
đặc tả npm đã phát hành được giữ cho các dispatch độc lập.

## Chấp nhận package

Dùng `Package Acceptance` khi câu hỏi là "package OpenClaw có thể cài đặt này
có hoạt động như một sản phẩm không?" Nó khác với CI thông thường: CI thông thường xác thực
cây source, trong khi package acceptance xác thực một tarball duy nhất thông qua
cùng harness Docker E2E mà người dùng thực thi sau khi cài đặt hoặc cập nhật.

Workflow có bốn job:

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên package,
   ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi
   `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng
   artifact `package-under-test`, và in source, workflow ref, package
   ref, version, SHA-256, và profile trong phần tóm tắt bước GitHub.
2. `docker_acceptance` gọi
   `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và
   `package_artifact_name=package-under-test`. Workflow tái sử dụng tải xuống
   artifact đó, xác thực inventory tarball, chuẩn bị image Docker package-digest
   khi cần, và chạy các lane Docker được chọn với package đó
   thay vì đóng gói checkout workflow. Khi một profile chọn
   nhiều `docker_lanes` mục tiêu, workflow tái sử dụng chuẩn bị package
   và image dùng chung một lần, rồi mở rộng các lane đó thành các job Docker
   mục tiêu song song với artifact duy nhất.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi
   `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test`
   khi Package Acceptance đã phân giải một package; dispatch Telegram độc lập
   vẫn có thể cài đặt một đặc tả npm đã phát hành.
4. `summary` làm workflow thất bại nếu phân giải package, Docker acceptance, hoặc
   lane Telegram tùy chọn thất bại.

Nguồn ứng viên:

- `source=npm`: chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một
  phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng nguồn này cho
  chấp nhận beta/stable đã phát hành.
- `source=ref`: đóng gói một branch, tag, hoặc SHA commit đầy đủ `package_ref` đáng tin cậy.
  Resolver fetch các branch/tag OpenClaw, xác minh commit đã chọn có thể
  truy cập từ lịch sử branch repository hoặc một tag phát hành, cài đặt deps trong một
  worktree tách rời, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact`: tải xuống một `.tgz` từ `artifact_run_id` và
  `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho
  các artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` tách biệt. `workflow_ref` là
mã workflow/harness đáng tin cậy chạy kiểm thử. `package_ref` là commit source
được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực
các commit source đáng tin cậy cũ hơn mà không chạy logic workflow cũ.

Các profile ánh xạ tới phạm vi Docker:

- `smoke`: `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package`: `npm-onboard-channel-agent`, `doctor-switch`,
  `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`,
  `plugin-update`
- `product`: `package` cộng với `mcp-channels`, `cron-mcp-cleanup`,
  `openai-web-search-minimal`, `openwebui`
- `full`: các chunk đường dẫn phát hành Docker đầy đủ với OpenWebUI
- `custom`: `docker_lanes` chính xác; bắt buộc khi `suite_profile=custom`

Release checks gọi Package Acceptance với `source=ref`,
`package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`,
`suite_profile=custom`,
`docker_lanes='bundled-channel-deps-compat plugins-offline'`, và
`telegram_mode=mock-openai`. Các chunk Docker đường dẫn phát hành
bao phủ các lane package/update/Plugin chồng lấp, trong khi Package
Acceptance giữ bằng chứng bundled-channel compat gốc artifact, Plugin offline, và
Telegram với cùng tarball package đã phân giải.
Cross-OS release checks vẫn bao phủ onboarding, installer và
hành vi nền tảng đặc thù OS; xác thực sản phẩm package/update nên bắt đầu với Package
Acceptance. Các lane Windows packaged và installer fresh cũng xác minh rằng một
package đã cài đặt có thể import một browser-control override từ một đường dẫn Windows tuyệt đối
thô. Smoke lượt agent cross-OS OpenAI mặc định dùng
`OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì `openai/gpt-5.4-mini`, để
bằng chứng cài đặt và Gateway vẫn nhanh và xác định. Các lane live
provider/model chuyên dụng vẫn bao phủ định tuyến model rộng hơn, bao gồm các mặc định
frontier chậm hơn.

Package Acceptance có các cửa sổ tương thích legacy có giới hạn cho các package
đã phát hành. Các package đến `2026.4.25`, bao gồm `2026.4.25-beta.*`,
có thể dùng đường dẫn tương thích cho các mục QA riêng tư đã biết trong
`dist/postinstall-inventory.json` trỏ tới các file bị tarball bỏ qua,
`doctor-switch` có thể bỏ qua subcase duy trì `gateway install --wrapper`
khi package không expose flag đó, `update-channel-switch` có thể cắt bỏ
`pnpm.patchedDependencies` bị thiếu khỏi fixture git giả dẫn xuất từ tarball và
có thể log `update.channel` đã duy trì bị thiếu, các smoke Plugin có thể đọc
vị trí install-record legacy hoặc chấp nhận thiếu duy trì install-record marketplace,
và `plugin-update` có thể cho phép migration metadata config trong khi vẫn
yêu cầu install record và hành vi không cài đặt lại không đổi. Package
`2026.4.26` đã phát hành cũng có thể cảnh báo cho các file stamp metadata build cục bộ
đã được ship. Các package sau đó phải thỏa mãn các contract hiện đại; cùng
điều kiện sẽ thất bại thay vì cảnh báo hoặc bỏ qua.

Ví dụ:

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Khi gỡ lỗi một lượt chạy package acceptance thất bại, hãy bắt đầu từ phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lượt chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời gian theo pha và lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói bị lỗi hoặc các lane Docker chính xác thay vì chạy lại toàn bộ xác thực bản phát hành.

QA Lab có các lane CI chuyên dụng nằm ngoài quy trình làm việc smart-scoped chính. Quy trình làm việc `Parity gate` chạy trên các thay đổi PR khớp và dispatch thủ công; nó build runtime QA riêng tư và so sánh các gói agentic GPT-5.5 mô phỏng và Opus 4.6. Quy trình làm việc `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó tách quạt cổng parity mô phỏng, lane Matrix trực tiếp, và các lane Telegram và Discord trực tiếp thành các job song song. Các job trực tiếp dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex. Các kiểm tra bản phát hành chạy các lane truyền tải Matrix và Telegram trực tiếp với provider mô phỏng xác định và các model đủ điều kiện mô phỏng (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được cô lập khỏi độ trễ model trực tiếp và quá trình khởi động provider-plugin thông thường. Gateway truyền tải trực tiếp cũng tắt tìm kiếm bộ nhớ vì QA parity bao phủ hành vi bộ nhớ riêng; khả năng kết nối provider được bao phủ bởi các bộ kiểm thử model trực tiếp, provider gốc và provider Docker riêng. Matrix dùng `--profile fast` cho các cổng theo lịch và bản phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ. Mặc định CLI và input quy trình làm việc thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard phạm vi Matrix đầy đủ thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`. `OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho bản phát hành trước khi phê duyệt phát hành; cổng QA parity của nó chạy các gói ứng viên và baseline dưới dạng job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ cho bước so sánh parity cuối cùng. Không đặt đường dẫn landing PR phía sau `Parity gate` trừ khi thay đổi thực sự chạm tới runtime QA, parity gói model, hoặc một bề mặt do quy trình parity sở hữu. Với các bản sửa kênh, cấu hình, tài liệu hoặc unit-test thông thường, hãy xem đó là tín hiệu tùy chọn và đi theo bằng chứng CI/kiểm tra theo phạm vi.

Quy trình làm việc `Duplicate PRs After Merge` là quy trình làm việc thủ công dành cho maintainer để dọn dẹp trùng lặp sau khi land. Mặc định là dry-run và chỉ đóng các PR được liệt kê rõ khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã land đã được merge và mỗi bản trùng lặp có issue được tham chiếu chung hoặc các hunk thay đổi chồng lấp.

Quy trình làm việc `CodeQL` được chủ ý thiết kế là trình quét bảo mật lượt đầu có phạm vi hẹp, không phải lượt quét toàn bộ kho lưu trữ. Các lượt chạy hằng ngày và thủ công quét mã quy trình làm việc Actions cùng các bề mặt xác thực, bí mật, sandbox, Cron và Gateway JavaScript/TypeScript có rủi ro cao nhất bằng các truy vấn bảo mật độ chính xác cao trong danh mục `/codeql-critical-security/core-auth-secrets`. Job channel-runtime-boundary quét riêng các hợp đồng triển khai kênh lõi cùng runtime Plugin kênh, Gateway, Plugin SDK, bí mật và các điểm chạm audit trong danh mục `/codeql-critical-security/channel-runtime-boundary` để tín hiệu bảo mật kênh có thể mở rộng mà không làm rộng danh mục baseline auth/secrets. Job network-ssrf-boundary quét các bề mặt chính sách SSRF lõi, phân tích IP, network guard, web-fetch và SSRF của Plugin SDK trong danh mục `/codeql-critical-security/network-ssrf-boundary` để tín hiệu biên tin cậy mạng vẫn tách khỏi baseline bảo mật auth/secrets. Job mcp-process-tool-boundary quét các máy chủ MCP, helper thực thi tiến trình, phân phối outbound và các cổng thực thi công cụ của agent trong danh mục `/codeql-critical-security/mcp-process-tool-boundary` để tín hiệu biên lệnh và công cụ vẫn tách khỏi cả baseline auth/secrets và shard chất lượng MCP/process không liên quan bảo mật. Job plugin-trust-boundary quét các bề mặt tin cậy cài đặt Plugin, loader, manifest, registry, staging dependency runtime, tải nguồn, bề mặt công khai và hợp đồng gói Plugin SDK trong danh mục `/codeql-critical-security/plugin-trust-boundary` để tín hiệu chuỗi cung ứng Plugin và tải runtime vẫn tách khỏi cả mã triển khai Plugin đi kèm và shard chất lượng Plugin không liên quan bảo mật.

Quy trình làm việc `CodeQL Android Critical Security` là shard bảo mật Android theo lịch. Nó build ứng dụng Android thủ công cho CodeQL trên nhãn runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận và tải kết quả lên trong danh mục `/codeql-critical-security/android`.

Quy trình làm việc `CodeQL macOS Critical Security` là shard bảo mật macOS hằng tuần/thủ công. Nó build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build dependency ra khỏi SARIF được tải lên và tải kết quả lên trong danh mục `/codeql-critical-security/macos`. Giữ nó bên ngoài quy trình làm việc mặc định hằng ngày vì bản build macOS chi phối thời gian chạy ngay cả khi sạch.

Quy trình làm việc `CodeQL Critical Quality` là shard không liên quan bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript không liên quan bảo mật ở mức độ lỗi trên các bề mặt hẹp có giá trị cao trên runner Blacksmith Linux nhỏ hơn. Dispatch thủ công của nó chấp nhận `profile=all|plugin-sdk-package-contract`; hồ sơ hẹp là điểm móc hướng dẫn/lặp đầu tiên để chạy riêng một shard chất lượng mà không dispatch phần còn lại của quy trình làm việc. Job core-auth-secrets của nó quét mã biên bảo mật auth, secrets, sandbox, Cron và Gateway trong danh mục riêng `/codeql-critical-quality/core-auth-secrets`. Job config-boundary quét schema cấu hình, migration, chuẩn hóa và các hợp đồng IO trong danh mục riêng `/codeql-critical-quality/config-boundary`. Job gateway-runtime-boundary quét schema giao thức Gateway và hợp đồng phương thức máy chủ trong danh mục riêng `/codeql-critical-quality/gateway-runtime-boundary`. Job channel-runtime-boundary quét các hợp đồng triển khai kênh lõi trong danh mục riêng `/codeql-critical-quality/channel-runtime-boundary`. Job agent-runtime-boundary quét thực thi lệnh, dispatch model/provider, dispatch và hàng đợi auto-reply, cùng các hợp đồng runtime control-plane ACP trong danh mục riêng `/codeql-critical-quality/agent-runtime-boundary`. Job mcp-process-runtime-boundary quét máy chủ MCP và cầu nối công cụ, helper giám sát tiến trình và hợp đồng phân phối outbound trong danh mục riêng `/codeql-critical-quality/mcp-process-runtime-boundary`. Job memory-runtime-boundary quét memory host SDK, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, glue kích hoạt runtime bộ nhớ và lệnh doctor bộ nhớ trong danh mục riêng `/codeql-critical-quality/memory-runtime-boundary`. Job ui-control-plane quét bootstrap Control UI, lưu trữ cục bộ, luồng điều khiển Gateway và hợp đồng runtime control-plane tác vụ trong danh mục riêng `/codeql-critical-quality/ui-control-plane`. Job web-media-runtime-boundary quét các hợp đồng runtime web fetch/search lõi, media IO, hiểu media, tạo ảnh và tạo media trong danh mục riêng `/codeql-critical-quality/web-media-runtime-boundary`. Job plugin-boundary quét loader, registry, bề mặt công khai và hợp đồng entrypoint Plugin SDK trong một danh mục riêng `/codeql-critical-quality/plugin-boundary`. Job plugin-sdk-package-contract quét nguồn Plugin SDK phía gói đã phát hành và các helper hợp đồng gói Plugin trong danh mục riêng `/codeql-critical-quality/plugin-sdk-package-contract`. Giữ quy trình làm việc tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, tắt hoặc mở rộng mà không che khuất tín hiệu bảo mật. Phần mở rộng CodeQL cho Swift, Python và Plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc được shard sau khi các hồ sơ hẹp có runtime và tín hiệu ổn định.

Quy trình làm việc `Docs Agent` là một lane bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa land. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và dispatch thủ công có thể chạy trực tiếp. Các lượt gọi workflow-run sẽ bỏ qua khi `main` đã tiến tiếp hoặc khi một lượt chạy Docs Agent không bị bỏ qua khác đã được tạo trong giờ trước. Khi chạy, nó xem xét khoảng commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lượt chạy hằng giờ có thể bao phủ mọi thay đổi main đã tích lũy kể từ lượt tài liệu trước.

Quy trình làm việc `Test Performance Agent` là một lane bảo trì Codex theo sự kiện dành cho các kiểm thử chậm. Nó không có lịch thuần túy: một lượt chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lượt gọi workflow-run khác đã chạy hoặc đang chạy trong cùng ngày UTC. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày đó. Lane này build báo cáo hiệu năng Vitest theo nhóm cho toàn bộ bộ kiểm thử, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ phạm vi bao phủ thay vì refactor rộng, rồi chạy lại báo cáo toàn bộ bộ kiểm thử và từ chối các thay đổi làm giảm số lượng kiểm thử baseline đang pass. Nếu baseline có kiểm thử thất bại, Codex chỉ được sửa các lỗi rõ ràng và báo cáo toàn bộ bộ kiểm thử sau agent phải pass trước khi có bất kỳ thứ gì được commit. Khi `main` tiến trước khi bot push land, lane này rebase bản vá đã xác thực, chạy lại `pnpm check:changed` và thử push lại; các bản vá cũ có xung đột sẽ bị bỏ qua. Nó dùng GitHub-hosted Ubuntu để action Codex có thể giữ cùng thế an toàn drop-sudo như docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Tổng quan job

| Công việc                        | Mục đích                                                                                         | Khi chạy                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Phát hiện các thay đổi chỉ liên quan đến tài liệu, phạm vi đã thay đổi, phần mở rộng đã thay đổi và xây dựng manifest CI | Luôn chạy trên các push và PR không phải bản nháp |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra workflow qua `zizmor`                                         | Luôn chạy trên các push và PR không phải bản nháp |
| `security-dependency-audit`      | Kiểm tra tệp khóa production không cần dependency dựa trên các cảnh báo npm                       | Luôn chạy trên các push và PR không phải bản nháp |
| `security-fast`                  | Tổng hợp bắt buộc cho các công việc bảo mật nhanh                                                 | Luôn chạy trên các push và PR không phải bản nháp |
| `build-artifacts`                | Xây dựng `dist/`, Control UI, kiểm tra artifact đã build và artifact downstream có thể tái sử dụng | Các thay đổi liên quan đến Node    |
| `checks-fast-core`               | Các lane kiểm tra tính đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol     | Các thay đổi liên quan đến Node    |
| `checks-fast-contracts-channels` | Kiểm tra hợp đồng kênh được chia shard với kết quả kiểm tra tổng hợp ổn định                      | Các thay đổi liên quan đến Node    |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ các lane kênh, bundled, hợp đồng và phần mở rộng             | Các thay đổi liên quan đến Node    |
| `check`                          | Tương đương cổng kiểm tra cục bộ chính được chia shard: kiểu production, lint, guard, kiểu kiểm thử và smoke nghiêm ngặt | Các thay đổi liên quan đến Node    |
| `check-additional`               | Các shard kiến trúc, ranh giới, guard bề mặt phần mở rộng, ranh giới gói và gateway-watch          | Các thay đổi liên quan đến Node    |
| `build-smoke`                    | Kiểm thử smoke CLI đã build và smoke bộ nhớ khởi động                                             | Các thay đổi liên quan đến Node    |
| `checks`                         | Bộ xác minh cho kiểm thử kênh artifact đã build                                                   | Các thay đổi liên quan đến Node    |
| `checks-node-compat-node22`      | Lane build và smoke tương thích Node 22                                                           | Dispatch CI thủ công cho bản phát hành |
| `check-docs`                     | Kiểm tra định dạng tài liệu, lint và liên kết hỏng                                                | Tài liệu đã thay đổi               |
| `skills-python`                  | Ruff + pytest cho Skills dựa trên Python                                                          | Các thay đổi liên quan đến Python-skill |
| `checks-windows`                 | Kiểm thử process/path riêng cho Windows cộng với hồi quy bộ chỉ định import runtime dùng chung     | Các thay đổi liên quan đến Windows |
| `macos-node`                     | Lane kiểm thử TypeScript trên macOS dùng artifact đã build dùng chung                             | Các thay đổi liên quan đến macOS   |
| `macos-swift`                    | Swift lint, build và kiểm thử cho ứng dụng macOS                                                  | Các thay đổi liên quan đến macOS   |
| `android`                        | Kiểm thử đơn vị Android cho cả hai flavor cộng với một bản build APK debug                        | Các thay đổi liên quan đến Android |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm hằng ngày bằng Codex sau hoạt động đáng tin cậy                          | CI chính thành công hoặc dispatch thủ công |

Các dispatch CI thủ công chạy cùng đồ thị công việc như CI thông thường nhưng
bật mọi lane có phạm vi không phải Android: các shard Linux Node, shard bundled-plugin, hợp đồng kênh, khả năng tương thích Node 22, `check`, `check-additional`, build smoke, kiểm tra tài liệu,
Skills Python, Windows, macOS và i18n Control UI. Các dispatch CI thủ công độc lập
chỉ chạy Android với `include_android=true`; umbrella phát hành đầy đủ
bật Android bằng cách truyền `include_android=true`. Các kiểm tra tĩnh prerelease Plugin,
shard chỉ dành cho phát hành `agentic-plugins`, lượt quét batch toàn bộ phần mở rộng
và các lane Docker prerelease Plugin bị loại khỏi CI. Bộ prerelease Docker
chỉ chạy khi `Full Release Validation` dispatch
workflow `Plugin Prerelease` riêng với cổng xác thực phát hành được bật.
Các lần chạy thủ công dùng một
nhóm concurrency duy nhất để bộ đầy đủ release-candidate không bị hủy bởi
một lần chạy push hoặc PR khác trên cùng ref. Input tùy chọn `target_ref` cho phép
caller đáng tin cậy chạy đồ thị đó trên một branch, tag hoặc full commit SHA trong khi
dùng tệp workflow từ dispatch ref đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Thứ tự fail-fast

Các công việc được sắp xếp để kiểm tra rẻ thất bại trước khi các kiểm tra tốn kém chạy:

1. `preflight` quyết định những lane nào thực sự tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong công việc này, không phải công việc độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` và `skills-python` thất bại nhanh mà không cần chờ các công việc artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các lane Linux nhanh để các consumer downstream có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Sau đó các lane nền tảng và runtime nặng hơn bung ra: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` và `android`.

Logic phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bởi các kiểm thử đơn vị trong `src/scripts/ci-changed-scope.test.ts`.
Kích hoạt thủ công bỏ qua phát hiện phạm vi thay đổi và làm cho bản kê khai kiểm tra sơ bộ
hoạt động như thể mọi vùng có phạm vi đều đã thay đổi.
Các chỉnh sửa quy trình CI xác thực đồ thị CI của Node cùng với linting quy trình, nhưng tự chúng không ép buộc các bản dựng gốc Windows, Android hoặc macOS; các làn nền tảng đó vẫn chỉ áp dụng theo phạm vi khi nguồn nền tảng thay đổi.
Các chỉnh sửa chỉ định tuyến CI, một số chỉnh sửa fixture kiểm thử lõi giá rẻ được chọn, và các chỉnh sửa hẹp về helper/hướng định tuyến kiểm thử hợp đồng plugin dùng một đường dẫn bản kê khai nhanh chỉ dành cho Node: kiểm tra sơ bộ, bảo mật và một tác vụ `checks-fast-core` duy nhất. Đường dẫn đó tránh tạo hiện vật dựng, tương thích Node 22, hợp đồng kênh, toàn bộ shard lõi, shard plugin đóng gói và các ma trận bảo vệ bổ sung khi các tệp đã thay đổi chỉ giới hạn ở các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp kiểm tra.
Các kiểm tra Node trên Windows được giới hạn trong phạm vi các wrapper tiến trình/đường dẫn dành riêng cho Windows, helper chạy npm/pnpm/UI, cấu hình trình quản lý gói và các bề mặt quy trình CI thực thi làn đó; các thay đổi nguồn, plugin, kiểm thử khói cài đặt và chỉ kiểm thử không liên quan vẫn ở các làn Node trên Linux để chúng không giữ một worker Windows 16-vCPU cho phạm vi vốn đã được kiểm tra bởi các shard kiểm thử thông thường.
Quy trình `install-smoke` riêng dùng lại cùng tập lệnh phạm vi thông qua job `preflight` của chính nó. Nó tách phạm vi kiểm thử khói thành `run_fast_install_smoke` và `run_full_install_smoke`. Pull request chạy đường dẫn nhanh cho các bề mặt Docker/gói, thay đổi gói/bản kê khai plugin đóng gói, và các bề mặt plugin/kênh/gateway/Plugin SDK lõi mà các job kiểm thử khói Docker kiểm tra. Các thay đổi chỉ nguồn của plugin đóng gói, chỉnh sửa chỉ kiểm thử và chỉnh sửa chỉ tài liệu không giữ worker Docker. Đường dẫn nhanh dựng ảnh Dockerfile gốc một lần, kiểm tra CLI, chạy kiểm thử khói CLI xóa agent workspace dùng chung, chạy e2e gateway-network trong container, xác minh đối số dựng extension đóng gói, và chạy hồ sơ Docker plugin đóng gói có giới hạn dưới thời gian chờ lệnh tổng hợp 240 giây với mỗi lượt chạy Docker của từng kịch bản được giới hạn riêng. Đường dẫn đầy đủ giữ phạm vi cài đặt gói QR và Docker/cập nhật trình cài đặt cho các lượt chạy theo lịch hằng đêm, kích hoạt thủ công, kiểm tra phát hành workflow-call và các pull request thật sự chạm vào bề mặt trình cài đặt/gói/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc dùng lại một ảnh kiểm thử khói Dockerfile gốc GHCR theo SHA đích, rồi chạy cài đặt gói QR, kiểm thử khói Dockerfile gốc/gateway, kiểm thử khói trình cài đặt/cập nhật và Docker E2E plugin đóng gói nhanh dưới dạng các job riêng để công việc trình cài đặt không phải chờ sau các kiểm thử khói ảnh gốc. Các push lên `main`, bao gồm commit merge, không ép buộc đường dẫn đầy đủ; khi logic phạm vi thay đổi yêu cầu phạm vi đầy đủ trên một push, quy trình giữ kiểm thử khói Docker nhanh và để kiểm thử khói cài đặt đầy đủ cho xác thực hằng đêm hoặc phát hành. Kiểm thử khói provider ảnh cài đặt toàn cục Bun chậm được chặn riêng bởi `run_bun_global_install_smoke`; nó chạy trong lịch hằng đêm và từ quy trình kiểm tra phát hành, và các kích hoạt thủ công `install-smoke` có thể chọn tham gia, nhưng pull request và push lên `main` không chạy nó. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile tập trung vào cài đặt riêng của chúng. `test:docker:all` cục bộ dựng trước một ảnh kiểm thử trực tiếp dùng chung, đóng gói OpenClaw một lần thành tarball npm, và dựng hai ảnh `scripts/e2e/Dockerfile` dùng chung: một runner Node/Git tối giản cho các làn trình cài đặt/cập nhật/phụ thuộc plugin và một ảnh chức năng cài đặt cùng tarball đó vào `/app` cho các làn chức năng thông thường. Định nghĩa làn Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi kế hoạch đã chọn. Bộ lập lịch chọn ảnh theo từng làn bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các làn với `OPENCLAW_SKIP_DOCKER_BUILD=1`; điều chỉnh số slot mặc định của pool chính là 10 bằng `OPENCLAW_DOCKER_ALL_PARALLELISM` và số slot của pool đuôi nhạy với provider là 10 bằng `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Giới hạn làn nặng mặc định là `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` để các làn cài đặt npm và nhiều dịch vụ không cấp phát Docker quá mức trong khi các làn nhẹ hơn vẫn lấp đầy các slot sẵn có. Một làn duy nhất nặng hơn các giới hạn hiệu lực vẫn có thể bắt đầu từ một pool trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Việc khởi động làn mặc định được giãn cách 2 giây để tránh tạo bão trong daemon Docker cục bộ; ghi đè bằng `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` hoặc một giá trị mili giây khác. Tập hợp cục bộ kiểm tra sơ bộ Docker, xóa các container OpenClaw E2E cũ, phát trạng thái làn đang hoạt động, lưu thời lượng làn để sắp xếp dài nhất trước, và hỗ trợ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để kiểm tra bộ lập lịch. Theo mặc định, nó dừng lập lịch các làn pool mới sau lỗi đầu tiên, và mỗi làn có thời gian chờ dự phòng 120 phút có thể ghi đè bằng `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; các làn live/đuôi được chọn dùng giới hạn chặt hơn theo từng làn. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` chạy chính xác các làn của bộ lập lịch, bao gồm các làn chỉ phát hành như `install-e2e` và các làn cập nhật đóng gói tách nhỏ như `bundled-channel-update-acpx`, đồng thời bỏ qua kiểm thử khói dọn dẹp để các agent có thể tái hiện một làn đã lỗi. Quy trình live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` cần phạm vi gói, loại ảnh, ảnh live, làn và thông tin xác thực nào, rồi `scripts/docker-e2e.mjs` chuyển kế hoạch đó thành output và tóm tắt GitHub. Nó hoặc đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải xuống hiện vật gói của lượt chạy hiện tại, hoặc tải xuống hiện vật gói từ `package_artifact_run_id`; xác thực danh mục tarball; dựng và đẩy các ảnh GHCR Docker E2E bare/functional được gắn thẻ theo digest gói thông qua bộ nhớ đệm lớp Docker của Blacksmith khi kế hoạch cần các làn đã cài gói; và dùng lại input `docker_e2e_bare_image`/`docker_e2e_functional_image` được cung cấp hoặc các ảnh theo digest gói hiện có thay vì dựng lại. Việc kéo ảnh Docker được thử lại với thời gian chờ có giới hạn 180 giây cho mỗi lần thử để một luồng registry/bộ nhớ đệm bị kẹt được thử lại nhanh thay vì tiêu thụ phần lớn đường găng CI. Quy trình `Package Acceptance` là cổng gói cấp cao: nó phân giải một ứng viên từ npm, một `package_ref` đáng tin cậy, một tarball HTTPS kèm SHA-256, hoặc một hiện vật quy trình trước đó, rồi chuyển hiện vật `package-under-test` duy nhất đó vào quy trình Docker E2E tái sử dụng. Nó giữ `workflow_ref` tách biệt với `package_ref` để logic chấp nhận hiện tại có thể xác thực các commit đáng tin cậy cũ hơn mà không checkout mã quy trình cũ. Kiểm tra phát hành chạy một delta Package Acceptance tùy chỉnh cho ref đích: tương thích kênh đóng gói, fixture plugin ngoại tuyến, và QA gói Telegram đối với tarball đã phân giải. Bộ Docker theo đường dẫn phát hành chạy các job chia nhỏ hơn với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi phần chỉ kéo loại ảnh nó cần và thực thi nhiều làn thông qua cùng bộ lập lịch có trọng số (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI được gộp vào `plugins-runtime-services` khi phạm vi release-path đầy đủ yêu cầu, và chỉ giữ một phần `openwebui` độc lập cho các kích hoạt chỉ dành cho OpenWebUI. Các tên phần tổng hợp cũ `package-update`, `plugins-runtime-core`, `plugins-runtime` và `plugins-integrations` vẫn hoạt động cho các lượt chạy lại thủ công, nhưng quy trình phát hành dùng các phần đã tách để E2E trình cài đặt và các lượt quét cài đặt/gỡ cài đặt plugin đóng gói không chiếm ưu thế trên đường găng. Bí danh làn `install-e2e` vẫn là bí danh chạy lại thủ công tổng hợp cho cả hai làn trình cài đặt provider. Phần `bundled-channels` chạy các làn `bundled-channel-*` và `bundled-channel-update-*` tách riêng thay vì làn nối tiếp tất cả trong một `bundled-channel-deps`. Mỗi phần tải lên `.artifacts/docker-tests/` với log làn, thời lượng, `summary.json`, `failures.json`, thời lượng pha, JSON kế hoạch bộ lập lịch, bảng làn chậm, và lệnh chạy lại theo từng làn. Input `docker_lanes` của quy trình chạy các làn đã chọn trên các ảnh đã chuẩn bị thay vì các job theo phần, nhờ đó việc gỡ lỗi làn lỗi được giới hạn trong một job Docker nhắm mục tiêu và chuẩn bị, tải xuống hoặc dùng lại hiện vật gói cho lượt chạy đó; nếu một làn được chọn là làn Docker live, job nhắm mục tiêu dựng ảnh kiểm thử live cục bộ cho lần chạy lại đó. Các lệnh chạy lại GitHub được sinh theo từng làn bao gồm `package_artifact_run_id`, `package_artifact_name` và các input ảnh đã chuẩn bị khi các giá trị đó tồn tại, để một làn lỗi có thể dùng lại chính xác gói và ảnh từ lượt chạy đã lỗi. Dùng `pnpm test:docker:rerun <run-id>` để tải xuống hiện vật Docker từ một lượt chạy GitHub và in các lệnh chạy lại nhắm mục tiêu kết hợp/theo từng làn; dùng `pnpm test:docker:timings <summary.json>` để xem tóm tắt đường găng của làn chậm và pha. Quy trình live/E2E theo lịch chạy toàn bộ bộ Docker theo đường dẫn phát hành hằng ngày. Ma trận cập nhật đóng gói được tách theo mục tiêu cập nhật để các lượt cập nhật npm lặp lại và sửa chữa doctor có thể được shard cùng các kiểm tra đóng gói khác.

Các phần Docker phát hành hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` và `bundled-channels-contracts`. Phần tổng hợp `bundled-channels` vẫn có sẵn cho các lượt chạy lại thủ công một lần, và `plugins-runtime-core`, `plugins-runtime` cùng `plugins-integrations` vẫn là các bí danh tổng hợp plugin/runtime, nhưng quy trình phát hành dùng các phần đã tách để kiểm thử khói kênh, mục tiêu cập nhật, kiểm tra runtime plugin và các lượt quét cài đặt/gỡ cài đặt plugin đóng gói có thể chạy song song. Các kích hoạt `docker_lanes` nhắm mục tiêu cũng tách nhiều làn đã chọn thành các job song song sau một bước chuẩn bị gói/ảnh dùng chung, và các làn cập nhật kênh đóng gói thử lại một lần khi có lỗi mạng npm tạm thời.

Logic lane thay đổi cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng: thay đổi production lõi chạy typecheck core prod và core test cộng với lint/guard lõi, thay đổi chỉ dành cho kiểm thử lõi chỉ chạy typecheck core test cộng với lint lõi, thay đổi production của extension chạy typecheck extension prod và extension test cộng với lint extension, và thay đổi chỉ dành cho kiểm thử extension chạy typecheck extension test cộng với lint extension. Các thay đổi Public Plugin SDK hoặc hợp đồng plugin mở rộng sang typecheck extension vì các extension phụ thuộc vào những hợp đồng lõi đó, nhưng các lượt quét Vitest extension là công việc kiểm thử rõ ràng. Các lần tăng phiên bản chỉ là metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu. Các thay đổi root/config không xác định sẽ an toàn bằng cách chuyển sang tất cả các lane kiểm tra.
Định tuyến kiểm thử thay đổi cục bộ nằm trong `scripts/test-projects.test-support.mjs` và
cố ý rẻ hơn `check:changed`: các chỉnh sửa kiểm thử trực tiếp tự chạy chính chúng,
các chỉnh sửa source ưu tiên ánh xạ rõ ràng, rồi đến kiểm thử cùng cấp và các phần phụ thuộc
theo đồ thị import. Cấu hình phân phối group-room dùng chung là một trong các ánh xạ rõ ràng:
các thay đổi đối với cấu hình visible-reply của nhóm, chế độ phân phối source reply, hoặc
message-tool system prompt sẽ đi qua các kiểm thử reply lõi cộng với các hồi quy phân phối Discord và
Slack để một thay đổi mặc định dùng chung thất bại trước lần push PR đầu tiên. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi
đủ rộng trên toàn harness đến mức tập ánh xạ rẻ không còn là đại diện đáng tin cậy.

Để xác thực Testbox, hãy chạy từ repo root và ưu tiên một box mới đã được làm ấm cho
bằng chứng rộng. Trước khi dùng một gate chậm trên box đã được tái sử dụng, hết hạn, hoặc
vừa báo cáo một lần đồng bộ lớn bất ngờ, hãy chạy `pnpm testbox:sanity` bên trong
box trước. Kiểm tra sanity thất bại nhanh khi các tệp root bắt buộc như
`pnpm-lock.yaml` biến mất hoặc khi `git status --short` hiển thị ít nhất 200
tệp đã theo dõi bị xóa. Điều đó thường có nghĩa trạng thái đồng bộ từ xa không phải là
bản sao đáng tin cậy của PR. Hãy dừng box đó và làm ấm một box mới thay vì gỡ lỗi
lỗi kiểm thử sản phẩm. Với các PR xóa lớn có chủ ý, đặt
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó. `pnpm
testbox:run` cũng chấm dứt một lời gọi Blacksmith CLI cục bộ nếu nó ở trong
pha đồng bộ hơn năm phút mà không có đầu ra sau đồng bộ. Đặt
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt guard đó, hoặc dùng một giá trị
mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Các lần dispatch CI thủ công chạy `checks-node-compat-node22` như phạm vi tương thích rộng. Android là tùy chọn cho CI thủ công độc lập thông qua `include_android=true` và luôn bật cho `Full Release Validation`. `Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, vì vậy nó là workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, các lần push `main`, và các lần dispatch CI thủ công độc lập giữ suite đó ở trạng thái tắt.

Các nhóm kiểm thử Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không đặt trước quá mức runner: channel contracts chạy dưới dạng ba shard có trọng số, các lane unit lõi nhỏ được ghép đôi, auto-reply chạy như bốn worker cân bằng với cây con reply được tách thành các shard agent-runner, dispatch, và commands/state-routing, còn các cấu hình agentic gateway/plugin được phân bổ trên các job Node agentic chỉ-source hiện có thay vì chờ artifact đã build. Các kiểm thử browser, QA, media, và plugin linh tinh diện rộng dùng cấu hình Vitest chuyên biệt của chúng thay vì catch-all plugin dùng chung. `Plugin Prerelease` cân bằng các kiểm thử plugin đi kèm trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch plugin nặng import không tạo thêm job CI. Lane agents rộng dùng bộ lập lịch song song theo tệp Vitest dùng chung vì nó bị chi phối bởi import/lập lịch thay vì thuộc sở hữu của một tệp kiểm thử chậm duy nhất. `runtime-config` chạy với shard infra core-runtime để tránh shard runtime dùng chung phải giữ phần đuôi. Các shard include-pattern ghi lại mục thời gian bằng tên shard CI, để `.artifacts/vitest-shard-timings.json` có thể phân biệt toàn bộ cấu hình với một shard đã lọc. `check-additional` giữ công việc compile/canary theo ranh giới package đi cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; shard boundary guard chạy các guard độc lập nhỏ của nó đồng thời trong một job. Gateway watch, kiểm thử channel, và shard support-boundary lõi chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build, giữ tên kiểm tra cũ của chúng dưới dạng các job xác minh nhẹ trong khi tránh hai worker Blacksmith bổ sung và một hàng đợi artifact-consumer thứ hai.
Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, rồi build APK debug Play. Flavor bên thứ ba không có source set hoặc manifest riêng; lane unit-test của nó vẫn compile flavor đó với các cờ BuildConfig SMS/call-log, đồng thời tránh một job đóng gói APK debug trùng lặp trên mọi push liên quan đến Android.
GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một push mới hơn được đưa lên cùng PR hoặc ref `main`. Hãy coi đó là nhiễu CI trừ khi lần chạy mới nhất cho cùng ref cũng thất bại. Các kiểm tra shard tổng hợp dùng `!cancelled() && always()` để chúng vẫn báo cáo các lỗi shard bình thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế.
Khóa đồng thời CI tự động được phiên bản hóa (`CI-v7-*`) để một zombie phía GitHub trong một nhóm hàng đợi cũ không thể chặn vô thời hạn các lần chạy main mới hơn. Các lần chạy full-suite thủ công dùng `CI-manual-v1-*` và không hủy các lần chạy đang thực thi.

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các job bảo mật nhanh và tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), các kiểm tra protocol/contract/bundled nhanh, các kiểm tra channel contract theo shard, các shard `check` ngoại trừ lint, các shard và tổng hợp `check-additional`, các trình xác minh tổng hợp kiểm thử Node, kiểm tra docs, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub host để ma trận Blacksmith có thể xếp hàng sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension trọng số thấp hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, và `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard kiểm thử Node Linux, các shard kiểm thử plugin đi kèm, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, vẫn đủ nhạy với CPU đến mức 8 vCPU tốn kém hơn mức tiết kiệm được; các bản build Docker install-smoke, nơi thời gian hàng đợi 32-vCPU tốn kém hơn mức tiết kiệm được                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; các fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; các fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Tương đương cục bộ

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:changed   # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Kênh phát hành](/vi/install/development-channels)
