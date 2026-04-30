---
read_when:
    - Bạn cần hiểu tại sao một tác vụ CI đã hoặc đã không chạy
    - Bạn đang gỡ lỗi các kiểm tra GitHub Actions bị lỗi
summary: Đồ thị tác vụ CI, các cổng kiểm soát phạm vi và các lệnh cục bộ tương đương
title: Quy trình CI
x-i18n:
    generated_at: "2026-04-30T00:06:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8ebc01707b673ab866c584abdfa5ccb8064d580f3a250c60304c2d056d109dc
    source_path: ci.md
    workflow: 16
---

CI chạy trên mỗi lần đẩy lên `main` và mỗi pull request. CI dùng phạm vi thông minh để bỏ qua các tác vụ tốn kém khi chỉ những khu vực không liên quan thay đổi. Các lần chạy `workflow_dispatch` thủ công cố ý bỏ qua phạm vi thông minh và phân nhánh toàn bộ đồ thị CI bình thường cho các ứng viên phát hành hoặc xác thực diện rộng, với các làn Android được bật tùy chọn qua `include_android` cho các lần chạy thủ công độc lập. Các làn phát hành trước Plugin chỉ dành cho phát hành nằm trong workflow `Plugin Prerelease` riêng và chỉ chạy từ `Full Release Validation` hoặc một lần điều phối thủ công rõ ràng.

Shard `check-dependencies` chạy `pnpm deadcode:dependencies`, một lượt kiểm tra chỉ phụ thuộc Knip cho production được ghim vào phiên bản Knip mới nhất mà script đó dùng, với tuổi phát hành tối thiểu của pnpm bị tắt cho bản cài đặt `dlx`. Nó cũng chạy `pnpm deadcode:unused-files`, so sánh các phát hiện tệp production không dùng của Knip với `scripts/deadcode-unused-files.allowlist.mjs`. Biện pháp bảo vệ đó thất bại khi một PR thêm tệp không dùng mới chưa được xem xét hoặc để lại mục allowlist cũ sau khi dọn dẹp, đồng thời vẫn giữ các bề mặt Plugin động có chủ ý, được tạo sinh, build, live-test và cầu nối gói mà Knip không thể phân giải tĩnh.

`Full Release Validation` là workflow ô dù thủ công cho "chạy mọi thứ
trước khi phát hành." Nó nhận một nhánh, tag hoặc SHA commit đầy đủ, điều phối
workflow `CI` thủ công với mục tiêu đó, điều phối `Plugin Prerelease` để lấy
bằng chứng chỉ dành cho phát hành về Plugin/gói/tĩnh/Docker, và điều phối
`OpenClaw Release Checks` cho install smoke, package acceptance, các bộ kiểm thử
đường dẫn phát hành Docker, live/E2E, OpenWebUI, tương đồng QA Lab, Matrix và các
làn Telegram. Nó cũng có thể chạy workflow `NPM Telegram Beta E2E` sau phát hành
khi có đặc tả gói đã phát hành. `release_profile=minimum|stable|full` kiểm soát độ rộng live/provider
được truyền vào release checks: `minimum` giữ các làn OpenAI/core nhanh nhất và
thiết yếu cho phát hành, `stable` thêm tập provider/backend ổn định, và
`full` chạy ma trận provider/media tư vấn rộng. Workflow ô dù ghi lại các
id lần chạy con đã điều phối, và job cuối cùng `Verify full validation` kiểm tra
lại kết luận hiện tại của các lần chạy con và thêm bảng job chậm nhất cho từng
lần chạy con. Nếu một workflow con được chạy lại và chuyển xanh, chỉ chạy lại job
xác minh cha để làm mới kết quả ô dù và tóm tắt thời gian.

Để khôi phục, cả `Full Release Validation` và `OpenClaw Release Checks` đều
nhận `rerun_group`. Dùng `all` cho một ứng viên phát hành, `ci` chỉ cho CI đầy đủ
bình thường ở workflow con, `release-checks` cho mọi workflow con phát hành, hoặc
một nhóm phát hành hẹp hơn: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`,
`qa-parity`, `qa-live`, hoặc `npm-telegram` trên workflow ô dù. Điều này giữ cho
việc chạy lại một hộp phát hành thất bại được giới hạn sau một bản sửa tập trung.

Workflow con live/E2E phát hành giữ phạm vi bao phủ `pnpm test:live` gốc rộng, nhưng nó
chạy dưới dạng các shard có tên (`native-live-src-agents`,
`native-live-src-gateway-core`, các job
`native-live-src-gateway-profiles` được lọc theo provider,
`native-live-src-gateway-backends`, `native-live-test`,
`native-live-extensions-a-k`, `native-live-extensions-l-n`,
`native-live-extensions-openai`, `native-live-extensions-o-z-other`,
`native-live-extensions-xai`, các shard media audio/video tách riêng, và
các shard music được lọc theo provider) thông qua `scripts/test-live-shard.mjs` thay vì
một job tuần tự. Điều đó giữ nguyên phạm vi bao phủ tệp trong khi giúp các lỗi
provider live chậm dễ chạy lại và chẩn đoán hơn. Các tên shard tổng hợp
`native-live-extensions-o-z`, `native-live-extensions-media`, và
`native-live-extensions-media-music` vẫn hợp lệ cho các lần chạy lại thủ công
một lượt.

Các shard media live gốc chạy trong
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, được build bởi
workflow `Live Media Runner Image`. Image đó cài sẵn `ffmpeg` và
`ffprobe`; các job media chỉ xác minh binary trước khi thiết lập. Giữ các bộ kiểm thử
live có Docker hỗ trợ trên các runner Blacksmith bình thường, vì job container
không phải là nơi phù hợp để khởi chạy các kiểm thử Docker lồng nhau.

Các shard model/backend live có Docker hỗ trợ dùng một image chia sẻ riêng
`ghcr.io/openclaw/openclaw-live-test:<sha>` cho mỗi commit được chọn. Workflow phát hành
live build và đẩy image đó một lần, sau đó các shard Docker live model,
gateway, CLI backend, ACP bind và Codex harness chạy với
`OPENCLAW_SKIP_DOCKER_BUILD=1`. Nếu các shard đó tự build lại target Docker
nguồn đầy đủ một cách độc lập, lần chạy phát hành đã cấu hình sai và sẽ lãng phí
thời gian thực tế vào các lần build image trùng lặp.

`OpenClaw Release Checks` dùng ref workflow tin cậy để phân giải ref đã chọn
một lần thành tarball `release-package-under-test`, sau đó truyền artifact đó
cho cả workflow Docker đường dẫn phát hành live/E2E và shard package acceptance.
Điều đó giữ byte của gói nhất quán trên các hộp phát hành và tránh đóng gói lại
cùng một ứng viên trong nhiều job con.

`Package Acceptance` là workflow chạy phụ để xác thực artifact gói
mà không chặn workflow phát hành. Nó phân giải một ứng viên từ đặc tả npm đã
phát hành, một `package_ref` tin cậy được build bằng harness
`workflow_ref` đã chọn, một URL tarball HTTPS kèm SHA-256, hoặc một artifact tarball
từ một lần chạy GitHub Actions khác, tải nó lên dưới dạng `package-under-test`, rồi dùng lại
bộ lập lịch Docker release/E2E với tarball đó thay vì đóng gói lại checkout
workflow. Các profile bao phủ smoke, package, product, full và các lựa chọn
làn Docker tùy chỉnh. Profile `package` dùng phạm vi bao phủ Plugin offline để
việc xác thực gói đã phát hành không phụ thuộc vào tình trạng sẵn sàng live của ClawHub. Làn
Telegram tùy chọn dùng lại artifact
`package-under-test` trong workflow `NPM Telegram Beta E2E`, với đường dẫn đặc tả
npm đã phát hành được giữ cho các lần điều phối độc lập.

## Chấp nhận gói

Dùng `Package Acceptance` khi câu hỏi là "gói OpenClaw có thể cài đặt này
có hoạt động như một sản phẩm không?" Nó khác với CI bình thường: CI bình thường xác thực
cây nguồn, trong khi package acceptance xác thực một tarball duy nhất thông qua
cùng harness Docker E2E mà người dùng thực thi sau khi cài đặt hoặc cập nhật.

Workflow có bốn job:

1. `resolve_package` checkout `workflow_ref`, phân giải một ứng viên gói,
   ghi `.artifacts/docker-e2e-package/openclaw-current.tgz`, ghi
   `.artifacts/docker-e2e-package/package-candidate.json`, tải cả hai lên dưới dạng
   artifact `package-under-test`, và in nguồn, workflow ref, package
   ref, phiên bản, SHA-256 và profile trong phần tóm tắt bước GitHub.
2. `docker_acceptance` gọi
   `openclaw-live-and-e2e-checks-reusable.yml` với `ref=workflow_ref` và
   `package_artifact_name=package-under-test`. Workflow có thể dùng lại tải xuống
   artifact đó, xác thực inventory tarball, chuẩn bị image Docker package-digest
   khi cần, và chạy các làn Docker đã chọn với gói đó thay vì đóng gói
   checkout workflow. Khi một profile chọn nhiều `docker_lanes` có mục tiêu,
   workflow có thể dùng lại chuẩn bị gói và các image chia sẻ một lần, sau đó
   phân nhánh các làn đó thành các job Docker có mục tiêu song song với artifact riêng.
3. `package_telegram` tùy chọn gọi `NPM Telegram Beta E2E`. Nó chạy khi
   `telegram_mode` không phải `none` và cài đặt cùng artifact `package-under-test`
   khi Package Acceptance đã phân giải một gói; điều phối Telegram độc lập
   vẫn có thể cài đặt một đặc tả npm đã phát hành.
4. `summary` làm workflow thất bại nếu bước phân giải gói, Docker acceptance, hoặc
   làn Telegram tùy chọn thất bại.

Nguồn ứng viên:

- `source=npm`: chỉ chấp nhận `openclaw@beta`, `openclaw@latest`, hoặc một
  phiên bản phát hành OpenClaw chính xác như `openclaw@2026.4.27-beta.2`. Dùng mục này cho
  acceptance beta/stable đã phát hành.
- `source=ref`: đóng gói một nhánh, tag hoặc SHA commit đầy đủ `package_ref` tin cậy.
  Bộ phân giải fetch các nhánh/tag OpenClaw, xác minh commit đã chọn có thể
  truy cập từ lịch sử nhánh kho lưu trữ hoặc tag phát hành, cài đặt deps trong một
  worktree tách rời, và đóng gói bằng `scripts/package-openclaw-for-docker.mjs`.
- `source=url`: tải xuống một `.tgz` HTTPS; bắt buộc có `package_sha256`.
- `source=artifact`: tải xuống một `.tgz` từ `artifact_run_id` và
  `artifact_name`; `package_sha256` là tùy chọn nhưng nên được cung cấp cho
  artifact được chia sẻ bên ngoài.

Giữ `workflow_ref` và `package_ref` riêng biệt. `workflow_ref` là mã
workflow/harness tin cậy chạy kiểm thử. `package_ref` là commit nguồn
được đóng gói khi `source=ref`. Điều này cho phép harness kiểm thử hiện tại xác thực
các commit nguồn tin cậy cũ hơn mà không chạy logic workflow cũ.

Các profile ánh xạ đến phạm vi bao phủ Docker:

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
bao phủ các làn package/update/plugin chồng lấp, trong khi Package
Acceptance giữ bằng chứng compat kênh đóng gói sẵn gốc theo artifact, Plugin offline và
Telegram với cùng tarball gói đã phân giải.
Cross-OS release checks vẫn bao phủ onboarding, trình cài đặt và
hành vi nền tảng đặc thù theo hệ điều hành; xác thực sản phẩm package/update nên bắt đầu với Package
Acceptance. Các làn Windows packaged và installer fresh cũng xác minh rằng một
gói đã cài đặt có thể import một override browser-control từ một đường dẫn Windows tuyệt đối
thô. Smoke lượt agent cross-OS OpenAI mặc định dùng
`OPENCLAW_CROSS_OS_OPENAI_MODEL` khi được đặt, nếu không thì dùng `openai/gpt-5.4-mini`, để
bằng chứng cài đặt và Gateway vẫn nhanh và xác định. Các làn provider/model live
chuyên dụng vẫn bao phủ định tuyến model rộng hơn, bao gồm cả các mặc định
frontier chậm hơn.

Package Acceptance có các cửa sổ tương thích legacy có giới hạn cho các gói đã
phát hành. Các gói đến `2026.4.25`, bao gồm `2026.4.25-beta.*`,
có thể dùng đường dẫn tương thích cho các mục QA riêng tư đã biết trong
`dist/postinstall-inventory.json` trỏ đến các tệp bị lược bỏ khỏi tarball,
`doctor-switch` có thể bỏ qua trường hợp con lưu bền `gateway install --wrapper`
khi gói không cung cấp cờ đó, `update-channel-switch` có thể cắt bỏ
`pnpm.patchedDependencies` bị thiếu khỏi fixture git giả lập bắt nguồn từ tarball và
có thể ghi log `update.channel` đã lưu bền bị thiếu, các smoke Plugin có thể đọc
vị trí install-record legacy hoặc chấp nhận thiếu lưu bền install-record
marketplace, và `plugin-update` có thể cho phép di chuyển siêu dữ liệu cấu hình trong khi vẫn
yêu cầu install record và hành vi không cài đặt lại giữ nguyên. Gói
`2026.4.26` đã phát hành cũng có thể cảnh báo về các tệp dấu metadata build cục bộ
đã được phát hành. Các gói sau đó phải đáp ứng các hợp đồng hiện đại; cùng
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

Khi gỡ lỗi một lần chạy chấp nhận gói thất bại, hãy bắt đầu ở phần tóm tắt `resolve_package` để xác nhận nguồn gói, phiên bản và SHA-256. Sau đó kiểm tra lần chạy con `docker_acceptance` và các artifact Docker của nó: `.artifacts/docker-tests/**/summary.json`, `failures.json`, nhật ký lane, thời gian từng phase và các lệnh chạy lại. Ưu tiên chạy lại hồ sơ gói thất bại hoặc đúng các lane Docker thay vì chạy lại toàn bộ xác thực bản phát hành.

QA Lab có các lane CI chuyên dụng nằm ngoài workflow chính có phạm vi thông minh. Workflow `Parity gate` chạy trên các thay đổi PR khớp điều kiện và khi dispatch thủ công; nó build runtime QA riêng tư và so sánh các gói tác nhân giả lập GPT-5.5 và Opus 4.6. Workflow `QA-Lab - All Lanes` chạy hằng đêm trên `main` và khi dispatch thủ công; nó tỏa ra cổng parity giả lập, lane Matrix trực tiếp, và các lane Telegram cùng Discord trực tiếp dưới dạng các job song song. Các job trực tiếp dùng môi trường `qa-live-shared`, còn Telegram/Discord dùng lease Convex. Các kiểm tra phát hành chạy các lane transport Matrix và Telegram trực tiếp với provider giả lập xác định và các model đủ điều kiện giả lập (`mock-openai/gpt-5.5` và `mock-openai/gpt-5.5-alt`) để hợp đồng kênh được cô lập khỏi độ trễ model trực tiếp và quá trình khởi động provider-plugin thông thường. Gateway transport trực tiếp cũng tắt tìm kiếm bộ nhớ vì QA parity kiểm tra hành vi bộ nhớ riêng; kết nối provider được kiểm tra bởi các bộ kiểm thử model trực tiếp, provider native và provider Docker riêng. Matrix dùng `--profile fast` cho các cổng theo lịch và phát hành, chỉ thêm `--fail-fast` khi CLI đã checkout hỗ trợ. Mặc định CLI và input workflow thủ công vẫn là `all`; dispatch thủ công `matrix_profile=all` luôn shard toàn bộ phạm vi Matrix thành các job `transport`, `media`, `e2ee-smoke`, `e2ee-deep` và `e2ee-cli`. `OpenClaw Release Checks` cũng chạy các lane QA Lab trọng yếu cho phát hành trước khi phê duyệt phát hành; cổng QA parity của nó chạy các gói ứng viên và baseline dưới dạng các job lane song song, rồi tải cả hai artifact vào một job báo cáo nhỏ cho lần so sánh parity cuối cùng. Đừng đặt đường dẫn landing PR sau `Parity gate` trừ khi thay đổi thật sự chạm tới runtime QA, parity gói model, hoặc một bề mặt do workflow parity sở hữu. Với các bản sửa kênh, cấu hình, tài liệu hoặc kiểm thử đơn vị thông thường, hãy xem nó là tín hiệu tùy chọn và tuân theo bằng chứng CI/check theo phạm vi.

Workflow `Duplicate PRs After Merge` là workflow bảo trì thủ công cho việc dọn dẹp trùng lặp sau khi landing. Nó mặc định chạy khô và chỉ đóng các PR được liệt kê rõ ràng khi `apply=true`. Trước khi thay đổi GitHub, nó xác minh rằng PR đã landing đã được merge và mỗi bản trùng lặp có hoặc một issue được tham chiếu chung hoặc các hunk thay đổi chồng lấp.

Workflow `CodeQL` cố ý là trình quét bảo mật lượt đầu có phạm vi hẹp, không phải quét toàn bộ repository. Các lần chạy hằng ngày và thủ công quét mã workflow Actions cùng các bề mặt auth, secrets, sandbox, cron và gateway JavaScript/TypeScript có rủi ro cao nhất bằng các truy vấn bảo mật độ chính xác cao trong danh mục `/codeql-critical-security/core-auth-secrets`. Job channel-runtime-boundary quét riêng các hợp đồng triển khai kênh lõi cùng runtime plugin kênh, gateway, Plugin SDK, secrets và các điểm chạm audit trong danh mục `/codeql-critical-security/channel-runtime-boundary` để tín hiệu bảo mật kênh có thể mở rộng mà không làm rộng danh mục baseline auth/secrets. Job network-ssrf-boundary quét các bề mặt SSRF lõi, phân tích IP, network guard, web-fetch và chính sách SSRF Plugin SDK trong danh mục `/codeql-critical-security/network-ssrf-boundary` để tín hiệu ranh giới tin cậy mạng được giữ tách biệt khỏi baseline bảo mật auth/secrets. Job mcp-process-tool-boundary quét các máy chủ MCP, helper thực thi tiến trình, delivery outbound và các cổng thực thi công cụ của tác nhân trong danh mục `/codeql-critical-security/mcp-process-tool-boundary` để tín hiệu ranh giới lệnh và công cụ được giữ tách biệt khỏi cả baseline auth/secrets lẫn shard chất lượng MCP/process không thuộc bảo mật. Job plugin-trust-boundary quét các bề mặt tin cậy của cài đặt plugin, loader, manifest, registry, staging phụ thuộc runtime, source-loading, bề mặt công khai và hợp đồng gói Plugin SDK trong danh mục `/codeql-critical-security/plugin-trust-boundary` để tín hiệu supply-chain plugin và runtime-loading được giữ tách biệt khỏi cả mã triển khai plugin đi kèm lẫn shard chất lượng plugin không thuộc bảo mật.

Workflow `CodeQL Android Critical Security` là shard bảo mật Android theo lịch. Nó build ứng dụng Android thủ công cho CodeQL trên nhãn runner Blacksmith Linux nhỏ nhất được workflow sanity chấp nhận và tải kết quả lên trong danh mục `/codeql-critical-security/android`.

Workflow `CodeQL macOS Critical Security` là shard bảo mật macOS hằng tuần/thủ công. Nó build ứng dụng macOS thủ công cho CodeQL trên Blacksmith macOS, lọc kết quả build phụ thuộc khỏi SARIF đã tải lên và tải kết quả lên trong danh mục `/codeql-critical-security/macos`. Giữ nó nằm ngoài workflow mặc định hằng ngày vì build macOS chiếm phần lớn thời gian chạy ngay cả khi sạch.

Workflow `CodeQL Critical Quality` là shard không thuộc bảo mật tương ứng. Nó chỉ chạy các truy vấn chất lượng JavaScript/TypeScript mức lỗi, không thuộc bảo mật trên các bề mặt hẹp có giá trị cao trên runner Blacksmith Linux nhỏ hơn. Dispatch thủ công của nó chấp nhận `profile=all|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`; các hồ sơ hẹp là hook hướng dẫn/lặp để chạy riêng một shard chất lượng mà không dispatch phần còn lại của workflow. Job core-auth-secrets của nó quét mã ranh giới bảo mật auth, secrets, sandbox, cron và gateway trong danh mục riêng `/codeql-critical-quality/core-auth-secrets`. Job config-boundary quét các hợp đồng schema cấu hình, migration, chuẩn hóa và IO trong danh mục riêng `/codeql-critical-quality/config-boundary`. Job gateway-runtime-boundary quét schema giao thức gateway và hợp đồng phương thức máy chủ trong danh mục riêng `/codeql-critical-quality/gateway-runtime-boundary`. Job channel-runtime-boundary quét các hợp đồng triển khai kênh lõi trong danh mục riêng `/codeql-critical-quality/channel-runtime-boundary`. Job agent-runtime-boundary quét thực thi lệnh, dispatch model/provider, dispatch và queue auto-reply, cùng các hợp đồng runtime control-plane ACP trong danh mục riêng `/codeql-critical-quality/agent-runtime-boundary`. Job mcp-process-runtime-boundary quét các máy chủ MCP và cầu nối công cụ, helper giám sát tiến trình và hợp đồng delivery outbound trong danh mục riêng `/codeql-critical-quality/mcp-process-runtime-boundary`. Job memory-runtime-boundary quét memory host SDK, facade runtime bộ nhớ, alias Plugin SDK bộ nhớ, glue kích hoạt runtime bộ nhớ và các lệnh doctor bộ nhớ trong danh mục riêng `/codeql-critical-quality/memory-runtime-boundary`. Job session-diagnostics-boundary quét nội bộ hàng đợi reply, hàng đợi delivery session, helper binding/delivery session outbound, bề mặt event/log bundle chẩn đoán và hợp đồng CLI doctor session trong danh mục riêng `/codeql-critical-quality/session-diagnostics-boundary`. Job plugin-sdk-reply-runtime quét dispatch reply inbound của Plugin SDK, helper payload/chunking/runtime reply, tùy chọn reply kênh, hàng đợi delivery và helper binding session/thread trong danh mục riêng `/codeql-critical-quality/plugin-sdk-reply-runtime`. Job provider-runtime-boundary quét chuẩn hóa catalog model, auth và discovery provider, đăng ký runtime provider, mặc định/catalog provider, và registry provider web/search/fetch/embedding trong danh mục riêng `/codeql-critical-quality/provider-runtime-boundary`. Job ui-control-plane quét bootstrap Control UI, lưu trữ cục bộ, luồng điều khiển gateway và hợp đồng runtime control-plane tác vụ trong danh mục riêng `/codeql-critical-quality/ui-control-plane`. Job web-media-runtime-boundary quét các hợp đồng runtime web fetch/search lõi, media IO, hiểu media, tạo ảnh và tạo media trong danh mục riêng `/codeql-critical-quality/web-media-runtime-boundary`. Job plugin-boundary quét các hợp đồng loader, registry, bề mặt công khai và entrypoint Plugin SDK trong danh mục riêng `/codeql-critical-quality/plugin-boundary`. Job plugin-sdk-package-contract quét nguồn Plugin SDK phía gói đã phát hành và helper hợp đồng gói plugin trong danh mục riêng `/codeql-critical-quality/plugin-sdk-package-contract`. Giữ workflow tách khỏi bảo mật để các phát hiện chất lượng có thể được lên lịch, đo lường, tắt hoặc mở rộng mà không che khuất tín hiệu bảo mật. Việc mở rộng CodeQL cho Swift, Python và plugin đi kèm chỉ nên được thêm lại dưới dạng công việc tiếp theo có phạm vi hoặc shard sau khi các hồ sơ hẹp có thời gian chạy và tín hiệu ổn định.

Workflow `Docs Agent` là lane bảo trì Codex theo sự kiện để giữ tài liệu hiện có đồng bộ với các thay đổi vừa landing. Nó không có lịch thuần túy: một lần chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, và dispatch thủ công có thể chạy trực tiếp. Các lần gọi workflow-run sẽ bỏ qua khi `main` đã tiến lên hoặc khi một lần chạy Docs Agent không bị bỏ qua khác được tạo trong giờ vừa qua. Khi chạy, nó xem xét phạm vi commit từ SHA nguồn Docs Agent không bị bỏ qua trước đó đến `main` hiện tại, vì vậy một lần chạy hằng giờ có thể bao phủ mọi thay đổi main đã tích lũy kể từ lần rà soát tài liệu trước.

Workflow `Test Performance Agent` là lane bảo trì Codex theo sự kiện cho các kiểm thử chậm. Nó không có lịch thuần túy: một lần chạy CI push không phải bot thành công trên `main` có thể kích hoạt nó, nhưng nó bỏ qua nếu một lần gọi workflow-run khác đã chạy hoặc đang chạy trong ngày UTC đó. Dispatch thủ công bỏ qua cổng hoạt động hằng ngày đó. Lane này build báo cáo hiệu năng Vitest nhóm theo toàn bộ suite, cho phép Codex chỉ thực hiện các bản sửa hiệu năng kiểm thử nhỏ vẫn giữ phạm vi bao phủ thay vì refactor rộng, rồi chạy lại báo cáo toàn bộ suite và từ chối các thay đổi làm giảm số lượng kiểm thử baseline đang pass. Nếu baseline có kiểm thử thất bại, Codex chỉ được sửa các lỗi rõ ràng và báo cáo toàn bộ suite sau agent phải pass trước khi bất cứ thứ gì được commit. Khi `main` tiến lên trước khi lượt push của bot landing, lane rebase patch đã xác thực, chạy lại `pnpm check:changed` và thử push lại; các patch cũ có xung đột sẽ bị bỏ qua. Nó dùng Ubuntu do GitHub-hosted cung cấp để action Codex có thể giữ cùng tư thế an toàn drop-sudo như docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Tổng quan công việc

| Công việc                       | Mục đích                                                                                         | Khi chạy                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `preflight`                      | Phát hiện thay đổi chỉ liên quan đến tài liệu, phạm vi thay đổi, tiện ích mở rộng thay đổi, và xây dựng manifest CI | Luôn chạy khi có push không phải bản nháp và PR |
| `security-scm-fast`              | Phát hiện khóa riêng tư và kiểm tra workflow qua `zizmor`                                         | Luôn chạy khi có push không phải bản nháp và PR |
| `security-dependency-audit`      | Kiểm tra lockfile production không cần dependency dựa trên cảnh báo npm                          | Luôn chạy khi có push không phải bản nháp và PR |
| `security-fast`                  | Tổng hợp bắt buộc cho các công việc bảo mật nhanh                                                | Luôn chạy khi có push không phải bản nháp và PR |
| `build-artifacts`                | Xây dựng `dist/`, Control UI, kiểm tra artifact đã xây dựng, và artifact hạ nguồn có thể tái sử dụng | Thay đổi liên quan đến Node                   |
| `checks-fast-core`               | Các lane kiểm tra tính đúng đắn nhanh trên Linux như kiểm tra bundled/plugin-contract/protocol    | Thay đổi liên quan đến Node                   |
| `checks-fast-contracts-channels` | Kiểm tra hợp đồng kênh được chia shard với kết quả kiểm tra tổng hợp ổn định                     | Thay đổi liên quan đến Node                   |
| `checks-node-core-test`          | Các shard kiểm thử Node lõi, loại trừ lane kênh, bundled, hợp đồng, và tiện ích mở rộng          | Thay đổi liên quan đến Node                   |
| `check`                          | Tương đương cổng cục bộ chính được chia shard: kiểu production, lint, guard, kiểu kiểm thử, và smoke nghiêm ngặt | Thay đổi liên quan đến Node                   |
| `check-additional`               | Kiến trúc, ranh giới, guard bề mặt tiện ích mở rộng, ranh giới gói, và shard gateway-watch       | Thay đổi liên quan đến Node                   |
| `build-smoke`                    | Kiểm thử smoke cho CLI đã xây dựng và smoke bộ nhớ khởi động                                     | Thay đổi liên quan đến Node                   |
| `checks`                         | Bộ xác minh cho kiểm thử kênh artifact đã xây dựng                                               | Thay đổi liên quan đến Node                   |
| `checks-node-compat-node22`      | Lane xây dựng và smoke tương thích Node 22                                                       | Kích hoạt CI thủ công cho bản phát hành       |
| `check-docs`                     | Kiểm tra định dạng tài liệu, lint, và liên kết hỏng                                              | Tài liệu thay đổi                             |
| `skills-python`                  | Ruff + pytest cho skills dựa trên Python                                                         | Thay đổi liên quan đến Python-skill           |
| `checks-windows`                 | Kiểm thử process/path riêng cho Windows cùng hồi quy bộ chỉ định import runtime dùng chung        | Thay đổi liên quan đến Windows                |
| `macos-node`                     | Lane kiểm thử TypeScript trên macOS sử dụng artifact đã xây dựng dùng chung                      | Thay đổi liên quan đến macOS                  |
| `macos-swift`                    | Swift lint, build, và kiểm thử cho ứng dụng macOS                                                | Thay đổi liên quan đến macOS                  |
| `android`                        | Kiểm thử đơn vị Android cho cả hai flavor cộng với một bản build APK debug                       | Thay đổi liên quan đến Android                |
| `test-performance-agent`         | Tối ưu hóa kiểm thử chậm hằng ngày của Codex sau hoạt động đáng tin cậy                          | CI chính thành công hoặc kích hoạt thủ công   |

Các lần kích hoạt CI thủ công chạy cùng đồ thị công việc như CI bình thường nhưng buộc mọi
lane có phạm vi không phải Android bật: shard Linux Node, shard bundled-plugin, hợp đồng kênh,
khả năng tương thích Node 22, `check`, `check-additional`, smoke build, kiểm tra tài liệu,
Python skills, Windows, macOS, và i18n Control UI. Các lần kích hoạt CI thủ công độc lập
chỉ chạy Android với `include_android=true`; ô bao bản phát hành đầy đủ bật Android bằng cách
truyền `include_android=true`. Kiểm tra tĩnh prerelease Plugin, shard `agentic-plugins`
chỉ dành cho phát hành, đợt quét batch tiện ích mở rộng đầy đủ, và lane Docker prerelease
Plugin bị loại khỏi CI. Bộ prerelease Docker chỉ chạy khi `Full Release Validation` kích hoạt
workflow `Plugin Prerelease` riêng với cổng xác thực phát hành được bật. Các lần chạy thủ công dùng một
nhóm concurrency duy nhất để bộ đầy đủ cho release-candidate không bị hủy bởi
một lần push hoặc PR khác trên cùng ref. Đầu vào `target_ref` tùy chọn cho phép
caller đáng tin cậy chạy đồ thị đó trên một branch, tag, hoặc SHA commit đầy đủ trong khi
dùng file workflow từ ref kích hoạt đã chọn.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Thứ tự fail-fast

Các công việc được sắp xếp để kiểm tra rẻ thất bại trước khi các công việc đắt hơn chạy:

1. `preflight` quyết định những lane nào thực sự tồn tại. Logic `docs-scope` và `changed-scope` là các bước bên trong công việc này, không phải công việc độc lập.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs`, và `skills-python` thất bại nhanh mà không cần chờ các công việc artifact và ma trận nền tảng nặng hơn.
3. `build-artifacts` chạy chồng lấp với các lane Linux nhanh để consumer hạ nguồn có thể bắt đầu ngay khi bản build dùng chung sẵn sàng.
4. Các lane nền tảng và runtime nặng hơn tỏa ra sau đó: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift`, và `android`.

Logic về phạm vi nằm trong `scripts/ci-changed-scope.mjs` và được bao phủ bằng unit test trong `src/scripts/ci-changed-scope.test.ts`.
Manual dispatch bỏ qua phát hiện changed-scope và khiến manifest preflight
hoạt động như thể mọi khu vực có phạm vi đều đã thay đổi.
Các chỉnh sửa workflow CI xác thực đồ thị CI của Node cùng với linting workflow, nhưng tự chúng không ép chạy các bản dựng native cho Windows, Android hoặc macOS; các lane nền tảng đó vẫn chỉ được áp dụng theo phạm vi khi có thay đổi mã nguồn nền tảng.
Các chỉnh sửa chỉ định tuyến CI, một số chỉnh sửa fixture core-test rẻ đã chọn, và các chỉnh sửa hẹp cho helper/test-routing của hợp đồng Plugin dùng đường dẫn manifest nhanh chỉ dành cho Node: preflight, security, và một tác vụ `checks-fast-core`. Đường dẫn đó tránh artifact bản dựng, khả năng tương thích Node 22, hợp đồng kênh, toàn bộ core shard, shard Plugin đi kèm, và các ma trận guard bổ sung khi các tệp thay đổi bị giới hạn trong các bề mặt định tuyến hoặc helper mà tác vụ nhanh trực tiếp kiểm tra.
Các kiểm tra Windows Node được giới hạn trong các wrapper process/path riêng cho Windows, helper runner npm/pnpm/UI, cấu hình trình quản lý gói, và các bề mặt workflow CI thực thi lane đó; các thay đổi mã nguồn, Plugin, install-smoke, và chỉ-test không liên quan vẫn ở các lane Linux Node để chúng không giữ một worker Windows 16-vCPU cho độ phủ vốn đã được thực thi bởi các shard test thông thường.
Workflow `install-smoke` riêng tái sử dụng cùng script phạm vi thông qua job `preflight` riêng của nó. Nó tách độ phủ smoke thành `run_fast_install_smoke` và `run_full_install_smoke`. Pull request chạy đường dẫn nhanh cho các bề mặt Docker/package, thay đổi package/manifest của Plugin đi kèm, và các bề mặt core plugin/channel/gateway/Plugin SDK mà các job Docker smoke kiểm tra. Các thay đổi chỉ mã nguồn của Plugin đi kèm, chỉnh sửa chỉ-test, và chỉnh sửa chỉ-docs không giữ worker Docker. Đường dẫn nhanh dựng image Dockerfile gốc một lần, kiểm tra CLI, chạy smoke CLI agents delete shared-workspace, chạy e2e container gateway-network, xác minh build arg của extension đi kèm, và chạy profile Docker Plugin đi kèm có giới hạn dưới timeout lệnh tổng hợp 240 giây, với từng lần chạy Docker của mỗi kịch bản được giới hạn riêng. Đường dẫn đầy đủ giữ lại cài đặt QR package và độ phủ Docker/update của installer cho các lần chạy theo lịch hằng đêm, manual dispatch, workflow-call release check, và các pull request thật sự chạm vào bề mặt installer/package/Docker. Ở chế độ đầy đủ, install-smoke chuẩn bị hoặc tái sử dụng một image smoke Dockerfile gốc GHCR theo target-SHA, rồi chạy cài đặt QR package, smoke Dockerfile gốc/Gateway, smoke installer/update, và Docker E2E nhanh cho Plugin đi kèm dưới dạng các job riêng để công việc installer không phải chờ sau các smoke image gốc. Các lần push lên `main`, bao gồm merge commit, không ép đường dẫn đầy đủ; khi logic changed-scope yêu cầu độ phủ đầy đủ trên một push, workflow giữ Docker smoke nhanh và để full install smoke cho xác thực hằng đêm hoặc release. Smoke image-provider cho cài đặt global Bun chậm được kiểm soát riêng bằng `run_bun_global_install_smoke`; nó chạy theo lịch hằng đêm và từ workflow release checks, và manual dispatch `install-smoke` có thể chọn tham gia, nhưng pull request và push lên `main` không chạy nó. Các test QR và installer Docker giữ Dockerfile tập trung vào cài đặt của riêng chúng. `test:docker:all` cục bộ prebuild một image live-test dùng chung, đóng gói OpenClaw một lần thành npm tarball, và dựng hai image `scripts/e2e/Dockerfile` dùng chung: một runner Node/Git trống cho các lane installer/update/plugin-dependency và một image chức năng cài cùng tarball đó vào `/app` cho các lane chức năng thông thường. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`, logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`, và runner chỉ thực thi plan đã chọn. Scheduler chọn image theo từng lane bằng `OPENCLAW_DOCKER_E2E_BARE_IMAGE` và `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, rồi chạy các lane với `OPENCLAW_SKIP_DOCKER_BUILD=1`; tinh chỉnh số slot main-pool mặc định là 10 bằng `OPENCLAW_DOCKER_ALL_PARALLELISM` và số slot tail-pool nhạy với provider mặc định là 10 bằng `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. Giới hạn lane nặng mặc định là `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` để các lane npm install và nhiều dịch vụ không cấp phát Docker quá mức trong khi các lane nhẹ hơn vẫn lấp đầy slot khả dụng. Một lane đơn lẻ nặng hơn giới hạn hiệu dụng vẫn có thể bắt đầu từ pool trống, rồi chạy một mình cho đến khi giải phóng dung lượng. Theo mặc định, các lần bắt đầu lane được giãn cách 2 giây để tránh bão tạo container trên Docker daemon cục bộ; ghi đè bằng `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` hoặc một giá trị mili giây khác. Aggregate preflight cục bộ kiểm tra Docker, xóa các container OpenClaw E2E cũ, phát trạng thái lane đang hoạt động, lưu timing lane để sắp thứ tự longest-first, và hỗ trợ `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để kiểm tra scheduler. Theo mặc định, nó dừng lập lịch các lane pooled mới sau lỗi đầu tiên, và mỗi lane có timeout dự phòng 120 phút có thể ghi đè bằng `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; một số lane live/tail được chọn dùng giới hạn chặt hơn theo từng lane. `OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` chạy đúng các lane scheduler, bao gồm các lane chỉ-release như `install-e2e` và các lane cập nhật đi kèm đã tách như `bundled-channel-update-acpx`, đồng thời bỏ qua cleanup smoke để agent có thể tái tạo một lane lỗi. Workflow live/E2E tái sử dụng hỏi `scripts/test-docker-all.mjs --plan-json` xem cần package, loại image, live image, lane, và độ phủ credential nào, rồi `scripts/docker-e2e.mjs` chuyển plan đó thành GitHub output và summary. Nó hoặc đóng gói OpenClaw qua `scripts/package-openclaw-for-docker.mjs`, tải xuống artifact package từ lần chạy hiện tại, hoặc tải xuống artifact package từ `package_artifact_run_id`; xác thực inventory tarball; dựng và push các image Docker E2E GHCR bare/functional gắn tag theo package digest thông qua cache lớp Docker của Blacksmith khi plan cần các lane đã cài package; và tái sử dụng input `docker_e2e_bare_image`/`docker_e2e_functional_image` đã cung cấp hoặc image package-digest hiện có thay vì dựng lại. Các lần pull image Docker được retry với timeout giới hạn 180 giây cho mỗi lần thử để một stream registry/cache bị kẹt retry nhanh thay vì tiêu tốn phần lớn critical path của CI. Workflow `Package Acceptance` là cổng package cấp cao: nó phân giải một candidate từ npm, một `package_ref` đáng tin cậy, một tarball HTTPS kèm SHA-256, hoặc artifact workflow trước đó, rồi truyền artifact `package-under-test` duy nhất đó vào workflow Docker E2E tái sử dụng. Nó giữ `workflow_ref` tách biệt với `package_ref` để logic acceptance hiện tại có thể xác thực các commit đáng tin cậy cũ hơn mà không checkout mã workflow cũ. Release check chạy delta Package Acceptance tùy chỉnh cho target ref: tương thích bundled-channel, fixture Plugin offline, và QA package Telegram với tarball đã phân giải. Bộ Docker release-path chạy các job nhỏ hơn theo chunk với `OPENCLAW_SKIP_DOCKER_BUILD=1` để mỗi chunk chỉ pull loại image nó cần và thực thi nhiều lane qua cùng scheduler có trọng số (`OPENCLAW_DOCKER_ALL_PROFILE=release-path`, `OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`). OpenWebUI được gộp vào `plugins-runtime-services` khi độ phủ release-path đầy đủ yêu cầu, và chỉ giữ chunk độc lập `openwebui` cho các dispatch chỉ OpenWebUI. Các tên chunk aggregate cũ `package-update`, `plugins-runtime-core`, `plugins-runtime`, và `plugins-integrations` vẫn hoạt động cho manual rerun, nhưng workflow release dùng các chunk đã tách để E2E installer và các sweep cài/gỡ Plugin đi kèm không chi phối critical path. Alias lane `install-e2e` vẫn là alias manual rerun aggregate cho cả hai lane installer provider. Chunk `bundled-channels` chạy các lane `bundled-channel-*` và `bundled-channel-update-*` đã tách thay vì lane all-in-one tuần tự `bundled-channel-deps`. Mỗi chunk upload `.artifacts/docker-tests/` với log lane, timing, `summary.json`, `failures.json`, timing theo pha, JSON plan scheduler, bảng lane chậm, và lệnh rerun theo từng lane. Input workflow `docker_lanes` chạy các lane đã chọn với image đã chuẩn bị thay vì các chunk job, giúp việc debug lane lỗi được giới hạn trong một job Docker nhắm mục tiêu và chuẩn bị, tải xuống, hoặc tái sử dụng artifact package cho lần chạy đó; nếu một lane được chọn là live Docker lane, job nhắm mục tiêu dựng image live-test cục bộ cho lần rerun đó. Các lệnh rerun GitHub được tạo theo từng lane bao gồm `package_artifact_run_id`, `package_artifact_name`, và input image đã chuẩn bị khi các giá trị đó tồn tại, để một lane lỗi có thể tái sử dụng đúng package và image từ lần chạy lỗi. Dùng `pnpm test:docker:rerun <run-id>` để tải artifact Docker từ một lần chạy GitHub và in các lệnh rerun nhắm mục tiêu tổng hợp/theo từng lane; dùng `pnpm test:docker:timings <summary.json>` để xem summary lane chậm và critical path theo pha. Workflow live/E2E theo lịch chạy toàn bộ bộ Docker release-path hằng ngày. Ma trận cập nhật đi kèm được tách theo mục tiêu cập nhật để các lượt npm update lặp lại và doctor repair có thể được shard cùng các kiểm tra đi kèm khác.

Các chunk Docker release hiện tại là `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a`, `plugins-runtime-install-b`, `plugins-runtime-install-c`, `plugins-runtime-install-d`, `plugins-runtime-install-e`, `plugins-runtime-install-f`, `plugins-runtime-install-g`, `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b`, và `bundled-channels-contracts`. Chunk aggregate `bundled-channels` vẫn có sẵn cho các manual rerun một lần, và `plugins-runtime-core`, `plugins-runtime`, cùng `plugins-integrations` vẫn là các alias aggregate plugin/runtime, nhưng workflow release dùng các chunk đã tách để channel smoke, mục tiêu cập nhật, kiểm tra runtime Plugin, và sweep cài/gỡ Plugin đi kèm có thể chạy song song. Các dispatch `docker_lanes` nhắm mục tiêu cũng tách nhiều lane đã chọn thành các job song song sau một bước chuẩn bị package/image dùng chung, và các lane cập nhật bundled-channel retry một lần cho lỗi mạng npm thoáng qua.

Logic lane thay đổi cục bộ nằm trong `scripts/changed-lanes.mjs` và được thực thi bởi `scripts/check-changed.mjs`. Cổng kiểm tra cục bộ đó nghiêm ngặt hơn về ranh giới kiến trúc so với phạm vi nền tảng CI rộng: các thay đổi sản xuất lõi chạy typecheck lõi prod và lõi test cùng lint/guard lõi, các thay đổi chỉ dành cho test lõi chỉ chạy typecheck lõi test cùng lint lõi, các thay đổi sản xuất extension chạy typecheck extension prod và extension test cùng lint extension, còn các thay đổi chỉ dành cho test extension chạy typecheck extension test cùng lint extension. Các thay đổi Public Plugin SDK hoặc hợp đồng plugin mở rộng sang typecheck extension vì extensions phụ thuộc vào các hợp đồng lõi đó, nhưng các lượt quét Vitest extension là công việc test rõ ràng. Các lần tăng phiên bản chỉ liên quan đến siêu dữ liệu phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu. Các thay đổi root/config không xác định sẽ fail an toàn sang tất cả các lane kiểm tra.
Định tuyến test thay đổi cục bộ nằm trong `scripts/test-projects.test-support.mjs` và
cố ý rẻ hơn `check:changed`: các chỉnh sửa test trực tiếp tự chạy chính chúng,
các chỉnh sửa source ưu tiên ánh xạ rõ ràng, sau đó là test cùng cấp và các phần
phụ thuộc trong đồ thị import. Cấu hình phân phối group-room dùng chung là một
trong các ánh xạ rõ ràng: thay đổi đối với cấu hình trả lời hiển thị trong nhóm,
chế độ phân phối trả lời nguồn, hoặc system prompt của message-tool được định
tuyến qua các test trả lời lõi cùng các hồi quy phân phối Discord và Slack để một
thay đổi mặc định dùng chung fail trước lần push PR đầu tiên. Chỉ dùng
`OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi thay đổi đủ rộng ở cấp
harness đến mức tập ánh xạ rẻ không còn là proxy đáng tin cậy.

Để xác thực bằng Testbox, chạy từ repo root và ưu tiên một box mới đã được warm
cho bằng chứng rộng. Trước khi dùng một gate chậm trên một box đã được tái sử
dụng, hết hạn, hoặc vừa báo cáo một lần sync lớn bất thường, hãy chạy
`pnpm testbox:sanity` bên trong box trước. Kiểm tra sanity fail nhanh khi các tệp
root bắt buộc như `pnpm-lock.yaml` biến mất hoặc khi `git status --short` cho
thấy ít nhất 200 tệp tracked bị xóa. Điều đó thường có nghĩa là trạng thái sync
từ xa không phải là bản sao đáng tin cậy của PR. Hãy dừng box đó và warm một box
mới thay vì debug lỗi test sản phẩm. Với các PR xóa số lượng lớn có chủ ý, đặt
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` cho lần chạy sanity đó. `pnpm
testbox:run` cũng chấm dứt một lệnh gọi Blacksmith CLI cục bộ nếu nó ở trong pha
sync hơn năm phút mà không có output sau sync. Đặt
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` để tắt guard đó, hoặc dùng một giá trị
mili giây lớn hơn cho các diff cục bộ lớn bất thường.

Các lần dispatch CI thủ công chạy `checks-node-compat-node22` làm phạm vi tương thích rộng. Android là tùy chọn cho CI thủ công độc lập thông qua `include_android=true` và luôn được bật cho `Full Release Validation`. `Plugin Prerelease` là phạm vi sản phẩm/gói tốn kém hơn, nên nó là một workflow riêng được dispatch bởi `Full Release Validation` hoặc bởi một operator rõ ràng. Các pull request thông thường, push lên `main`, và các dispatch CI thủ công độc lập giữ suite đó tắt.

Các nhóm test Node chậm nhất được tách hoặc cân bằng để mỗi job vẫn nhỏ mà không dự trữ runner quá mức: hợp đồng kênh chạy dưới dạng ba shard có trọng số, các lane unit lõi nhỏ được ghép cặp, auto-reply chạy dưới dạng bốn worker cân bằng với cây con reply được tách thành các shard agent-runner, dispatch, và commands/state-routing, còn cấu hình agentic Gateway/plugin được phân bổ trên các job Node agentic chỉ-source hiện có thay vì chờ artifact đã build. Các test trình duyệt rộng, QA, media, và plugin linh tinh dùng các cấu hình Vitest chuyên biệt của chúng thay vì catch-all plugin dùng chung. `Plugin Prerelease` cân bằng test plugin được bundle trên tám worker extension; các job shard extension đó chạy tối đa hai nhóm cấu hình plugin cùng lúc với một worker Vitest cho mỗi nhóm và heap Node lớn hơn để các batch plugin nặng import không tạo thêm job CI. Lane agents rộng dùng bộ lập lịch song song theo tệp Vitest dùng chung vì nó bị chi phối bởi import/lập lịch hơn là thuộc về một tệp test chậm duy nhất. `runtime-config` chạy với shard infra core-runtime để shard runtime dùng chung không phải gánh phần đuôi. Các shard include-pattern ghi entry thời gian bằng tên shard CI, nên `.artifacts/vitest-shard-timings.json` có thể phân biệt một cấu hình toàn bộ với một shard đã lọc. `check-additional` giữ công việc compile/canary theo ranh giới package cùng nhau và tách kiến trúc topology runtime khỏi phạm vi gateway watch; shard guard ranh giới chạy các guard độc lập nhỏ của nó đồng thời bên trong một job. Gateway watch, test kênh, và shard support-boundary lõi chạy đồng thời bên trong `build-artifacts` sau khi `dist/` và `dist-runtime/` đã được build, giữ các tên check cũ của chúng làm job xác minh nhẹ trong khi tránh hai worker Blacksmith bổ sung và một hàng đợi consumer artifact thứ hai.
Android CI chạy cả `testPlayDebugUnitTest` và `testThirdPartyDebugUnitTest`, sau đó build APK debug Play. Flavor third-party không có source set hoặc manifest riêng; lane unit-test của nó vẫn biên dịch flavor đó với các cờ BuildConfig SMS/call-log, đồng thời tránh một job đóng gói APK debug trùng lặp trên mọi push liên quan đến Android.
GitHub có thể đánh dấu các job bị thay thế là `cancelled` khi một push mới hơn được đưa lên cùng PR hoặc ref `main`. Hãy xem đó là nhiễu CI trừ khi run mới nhất cho cùng ref cũng đang fail. Các check shard tổng hợp dùng `!cancelled() && always()` để chúng vẫn báo cáo các lỗi shard thông thường nhưng không xếp hàng sau khi toàn bộ workflow đã bị thay thế.
Khóa concurrency CI tự động có version (`CI-v7-*`) để một zombie phía GitHub trong một nhóm hàng đợi cũ không thể chặn vô thời hạn các run main mới hơn. Các run full-suite thủ công dùng `CI-manual-v1-*` và không hủy các run đang chạy.

## Trình chạy

| Trình chạy                        | Công việc                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, các job bảo mật nhanh và tổng hợp (`security-scm-fast`, `security-dependency-audit`, `security-fast`), các kiểm tra protocol/contract/bundled nhanh, các kiểm tra hợp đồng kênh được chia shard, các shard `check` ngoại trừ lint, các shard và tổng hợp `check-additional`, các bộ xác minh tổng hợp test Node, kiểm tra docs, Python skills, workflow-sanity, labeler, auto-response; preflight install-smoke cũng dùng Ubuntu do GitHub host để ma trận Blacksmith có thể vào hàng đợi sớm hơn |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, các shard extension trọng số thấp hơn, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types`, và `check-test-types`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, các shard test Node trên Linux, các shard test plugin được bundle, `android`                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, vẫn đủ nhạy với CPU đến mức 8 vCPU tốn kém hơn phần nó tiết kiệm được; các build Docker install-smoke, nơi thời gian hàng đợi 32-vCPU tốn kém hơn phần nó tiết kiệm được                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` trên `openclaw/openclaw`; fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` trên `openclaw/openclaw`; fork fallback về `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Lệnh tương đương cục bộ

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
