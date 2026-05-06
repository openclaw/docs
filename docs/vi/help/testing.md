---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm các kiểm thử hồi quy cho lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của Gateway + tác nhân
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử unit/e2e/live, trình chạy Docker và phạm vi bao phủ của từng bài kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-06T09:16:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ Vitest (đơn vị/tích hợp, e2e, live) và một nhóm nhỏ
các runner Docker. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ bao phủ những gì (và những gì nó chủ ý _không_ bao phủ).
- Những lệnh cần chạy cho các quy trình làm việc phổ biến (cục bộ, trước khi push, gỡ lỗi).
- Cách các kiểm thử live phát hiện thông tin xác thực và chọn mô hình/nhà cung cấp.
- Cách thêm các hồi quy cho sự cố mô hình/nhà cung cấp trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các lane truyền tải live)** được ghi lại riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) - kiến trúc, bề mặt lệnh, biên soạn kịch bản.
- [Matrix QA](/vi/concepts/qa-matrix) - tham chiếu cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) - Plugin truyền tải tổng hợp được dùng bởi các kịch bản dựa trên repo.

Trang này bao quát việc chạy các bộ kiểm thử thông thường và các runner Docker/Parallels. Phần runner dành riêng cho QA bên dưới ([Runner dành riêng cho QA](#qa-specific-runners)) liệt kê các lệnh gọi `qa` cụ thể và trỏ lại các tài liệu tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng đầy đủ (kỳ vọng chạy trước khi push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy nhanh hơn toàn bộ bộ kiểm thử cục bộ trên máy có tài nguyên rộng rãi: `pnpm test:max`
- Vòng lặp theo dõi Vitest trực tiếp: `pnpm test:watch`
- Nhắm mục tiêu tệp trực tiếp hiện cũng định tuyến các đường dẫn extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên các lần chạy có mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Trang QA dựa trên Docker: `pnpm qa:lab:up`
- Lane QA dựa trên VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng coverage: `pnpm test:coverage`
- Bộ E2E: `pnpm test:e2e`

Khi gỡ lỗi nhà cung cấp/mô hình thực (yêu cầu thông tin xác thực thật):

- Bộ live (mô hình + các probe công cụ/hình ảnh Gateway): `pnpm test:live`
- Nhắm mục tiêu một tệp live ở chế độ yên lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng runtime: dispatch `OpenClaw Performance` với
  `live_gpt54=true` cho một lượt agent `openai/gpt-5.4` thật hoặc
  `deep_profile=true` cho các artifact CPU/heap/trace Kova. Các lần chạy hằng ngày theo lịch
  xuất bản artifact lane mock-provider, deep-profile và GPT 5.4 tới
  `openclaw/clawgrit-reports` khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình. Báo cáo
  mock-provider cũng bao gồm số liệu khởi động Gateway ở cấp nguồn, bộ nhớ,
  plugin-pressure, vòng hello-loop fake-model lặp lại và khởi động CLI.
- Quét mô hình live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi mô hình được chọn hiện chạy một lượt văn bản cộng với một probe nhỏ kiểu đọc tệp.
    Các mô hình có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các probe bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi nhà cung cấp.
  - Coverage CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E có thể tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận mô hình live Docker riêng biệt
    được shard theo nhà cung cấp.
  - Để chạy lại CI có trọng tâm, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm các secret nhà cung cấp tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng với `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các caller
    theo lịch/phát hành của nó.
- Smoke bound-chat Codex gốc: `pnpm test:docker:live-codex-bind`
  - Chạy một lane live Docker qua đường dẫn app-server Codex, bind một
    Slack DM tổng hợp bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi thuần và một tệp đính kèm hình ảnh
    đi qua binding Plugin gốc thay vì ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt agent Gateway qua harness app-server Codex do Plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và mặc định thực thi các probe hình ảnh,
    cron MCP, sub-agent và Guardian. Tắt probe sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi app-server Codex
    khác. Để kiểm tra sub-agent có trọng tâm, tắt các probe khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Lệnh này thoát sau probe sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Smoke lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra opt-in tăng cường cho bề mặt lệnh cứu hộ message-channel.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi mô hình bền vững,
    phản hồi `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong một container không có cấu hình với Claude CLI giả trên `PATH`
    và xác minh fallback planner mờ được chuyển thành một ghi cấu hình có kiểu đã được audit.
- Smoke Docker lần chạy đầu Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, định tuyến `openclaw` trần tới
    Crestodian, áp dụng các ghi setup/model/agent/Plugin Discord + SecretRef,
    xác thực cấu hình và xác minh các mục audit. Cùng đường dẫn thiết lập Ring 0 cũng
    được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  cô lập với `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và
  transcript assistant lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một ca lỗi, hãy ưu tiên thu hẹp kiểm thử live bằng các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Runner dành riêng cho QA

Các lệnh này nằm bên cạnh các bộ kiểm thử chính khi bạn cần tính thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. Tính ngang bằng agentic được lồng dưới
`QA-Lab - All Lanes` và xác thực phát hành, không phải một workflow PR độc lập.
Xác thực rộng nên dùng `Full Release Validation` với
`rerun_group=qa-parity` hoặc nhóm QA của release-checks. Các kiểm tra phát hành stable/default
giữ soak live/Docker toàn diện phía sau `run_release_soak=true`; profile
`full` ép bật soak. `QA-Lab - All Lanes`
chạy hằng đêm trên `main` và từ dispatch thủ công với lane mock parity, lane Matrix live,
lane Telegram live do Convex quản lý, và lane Discord live do Convex quản lý
dưới dạng các job song song. QA theo lịch và kiểm tra phát hành truyền Matrix
`--profile fast` một cách tường minh, trong khi CLI Matrix và input workflow thủ công
mặc định vẫn là `all`; dispatch thủ công có thể shard `all` thành các job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`. `OpenClaw Release
Checks` chạy parity cùng các lane Matrix nhanh và Telegram trước khi phê duyệt phát hành,
dùng `mock-openai/gpt-5.5` cho các kiểm tra truyền tải phát hành để chúng giữ tính
xác định và tránh khởi động provider-plugin thông thường. Các Gateway truyền tải live này
tắt tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ QA parity.

Các shard media live phát hành đầy đủ dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard mô hình/backend live Docker dùng image dùng chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi commit đã chọn,
sau đó pull image đó với `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì rebuild
bên trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy trực tiếp các kịch bản QA dựa trên repo trên máy chủ.
  - Theo mặc định, chạy song song nhiều kịch bản đã chọn với các worker
    Gateway được cô lập. `qa-channel` mặc định dùng concurrency 4 (bị giới hạn bởi
    số kịch bản đã chọn). Dùng `--concurrency <count>` để tinh chỉnh số lượng
    worker, hoặc `--concurrency 1` cho lane tuần tự cũ hơn.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có exit code thất bại.
  - Hỗ trợ các chế độ provider `live-frontier`, `mock-openai`, và `aimock`.
    `aimock` khởi động một server provider cục bộ dựa trên AIMock cho phạm vi
    fixture thử nghiệm và protocol-mock mà không thay thế lane `mock-openai`
    nhận biết kịch bản.
- `pnpm test:plugins:kitchen-sink-live`
  - Chạy gauntlet Plugin OpenAI Kitchen Sink trực tiếp thông qua QA Lab. Nó
    cài đặt gói Kitchen Sink bên ngoài, xác minh inventory bề mặt plugin SDK,
    thăm dò `/healthz` và `/readyz`, ghi lại bằng chứng CPU/RSS của Gateway,
    chạy một lượt OpenAI trực tiếp, và kiểm tra các chẩn đoán đối kháng.
    Yêu cầu xác thực OpenAI trực tiếp như `OPENAI_API_KEY`. Trong các phiên Testbox
    đã được hydrate, nó tự động source profile live-auth của Testbox khi có helper
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy bench khởi động Gateway cùng một gói kịch bản mock QA Lab nhỏ
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi một bản tóm tắt quan sát CPU kết hợp
    dưới `.artifacts/gateway-cpu-scenarios/`.
  - Theo mặc định chỉ đánh dấu các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cộng với `--hot-wall-warn-ms`), nên các đợt tăng ngắn lúc khởi động được ghi
    dưới dạng metric mà không trông giống hồi quy Gateway bị ghim CPU kéo dài nhiều phút.
  - Dùng artifact `dist` đã build; hãy chạy build trước khi checkout chưa có
    output runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng QA suite bên trong một VM Linux Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên máy chủ.
  - Tái sử dụng cùng các flag chọn provider/model như `qa suite`.
  - Các lượt chạy trực tiếp chuyển tiếp những input xác thực QA được hỗ trợ và phù hợp cho guest:
    khóa provider dựa trên env, đường dẫn cấu hình provider QA trực tiếp, và `CODEX_HOME`
    khi có.
  - Thư mục output phải nằm dưới repo root để guest có thể ghi ngược lại thông qua
    workspace được mount.
  - Ghi báo cáo QA và bản tóm tắt thông thường cùng log Multipass dưới
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA dựa trên Docker cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt toàn cục trong
    Docker, chạy onboarding OpenAI API-key không tương tác, cấu hình Telegram
    theo mặc định, xác minh runtime Plugin đã đóng gói tải được mà không cần
    sửa chữa dependency lúc khởi động, chạy doctor, và chạy một lượt agent cục bộ
    với endpoint OpenAI được mock.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane packaged-install
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một smoke Docker deterministic cho app đã build về transcript ngữ cảnh runtime nhúng.
    Nó xác minh ngữ cảnh runtime OpenClaw ẩn được lưu dưới dạng một custom message
    không hiển thị thay vì rò rỉ vào lượt người dùng hiển thị, sau đó seed một JSONL
    phiên bị hỏng chịu ảnh hưởng và xác minh `openclaw doctor --fix` viết lại nó
    sang nhánh active với một bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên gói OpenClaw trong Docker, chạy onboarding
    installed-package, cấu hình Telegram thông qua CLI đã cài đặt, rồi tái sử dụng
    lane QA Telegram trực tiếp với gói đã cài đặt đó làm SUT Gateway.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã resolve thay vì
    cài đặt từ registry.
  - Dùng cùng thông tin xác thực env Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/release, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cùng với
    `OPENCLAW_QA_CONVEX_SITE_URL` và secret vai trò. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một secret vai trò Convex có trong CI,
    wrapper Docker tự động chọn Convex.
  - Wrapper xác thực env thông tin xác thực Telegram hoặc Convex trên máy chủ trước
    công việc build/cài đặt Docker. Chỉ đặt `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    khi cố ý debug thiết lập trước thông tin xác thực.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này.
  - GitHub Actions cung cấp lane này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và lease thông tin xác thực Convex CI.
- GitHub Actions cũng cung cấp `Package Acceptance` cho bằng chứng sản phẩm chạy bên lề
  với một gói ứng viên. Nó chấp nhận một ref đáng tin cậy, spec npm đã phát hành,
  URL tarball HTTPS cộng SHA-256, hoặc artifact tarball từ một lượt chạy khác, upload
  `openclaw-current.tgz` đã chuẩn hóa dưới dạng `package-under-test`, rồi chạy
  scheduler Docker E2E hiện có với các profile lane smoke, package, product, full, hoặc custom.
  Đặt `telegram_mode=mock-openai` hoặc `live-frontier` để chạy workflow QA Telegram
  với cùng artifact `package-under-test`.
  - Bằng chứng sản phẩm beta mới nhất:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bằng chứng URL tarball chính xác yêu cầu digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Bằng chứng artifact tải xuống một artifact tarball từ một lượt chạy Actions khác:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Đóng gói và cài đặt bản build OpenClaw hiện tại trong Docker, khởi động Gateway
    với OpenAI đã cấu hình, rồi bật các channel/Plugin được bundle thông qua chỉnh sửa config.
  - Xác minh discovery thiết lập để các Plugin có thể tải xuống nhưng chưa cấu hình vẫn vắng mặt,
    lần sửa chữa doctor được cấu hình đầu tiên cài đặt rõ ràng từng Plugin có thể tải xuống
    bị thiếu, và lần khởi động lại thứ hai không chạy sửa chữa dependency ẩn.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của ứng viên
    dọn dẹp mảnh vụn dependency Plugin legacy mà không cần sửa chữa postinstall từ phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật packaged-install native trên các guest Parallels. Mỗi
    nền tảng được chọn trước tiên cài đặt gói baseline được yêu cầu, sau đó chạy
    lệnh `openclaw update` đã cài đặt trong cùng guest và xác minh phiên bản
    đã cài đặt, trạng thái cập nhật, mức sẵn sàng của Gateway, và một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một guest. Dùng `--json` cho đường dẫn artifact tóm tắt và trạng thái từng lane.
  - Lane OpenAI mặc định dùng `openai/gpt-5.5` cho bằng chứng lượt agent trực tiếp.
    Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi cố ý xác thực một model OpenAI khác.
  - Bọc các lượt chạy cục bộ dài bằng timeout trên máy chủ để lỗi kẹt transport Parallels không
    tiêu tốn phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi các log lane lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi cho rằng wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong doctor sau cập nhật và công việc
    cập nhật gói trên guest lạnh; điều đó vẫn bình thường khi log debug npm lồng nhau
    đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với từng lane smoke Parallels
    macOS, Windows, hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể va chạm khi
    khôi phục snapshot, phục vụ gói, hoặc trạng thái Gateway của guest.
  - Bằng chứng sau cập nhật chạy bề mặt Plugin bundle thông thường vì
    các facade capability như speech, tạo ảnh, và hiểu media được tải thông qua
    API runtime bundle ngay cả khi bản thân lượt agent chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động server provider AIMock cục bộ để kiểm thử smoke giao thức trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy lane QA Matrix trực tiếp với một homeserver Tuwunel dùng một lần dựa trên Docker. Chỉ source-checkout - bản cài đặt đã đóng gói không ship `qa-lab`.
  - CLI đầy đủ, catalog profile/kịch bản, env vars, và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy lane QA Telegram trực tiếp với một nhóm riêng tư thật bằng token bot driver và SUT từ env.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id phải là id chat Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực được pool dùng chung. Dùng chế độ env theo mặc định, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng lease được pool.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có exit code thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng một nhóm riêng tư, với bot SUT có username Telegram.
  - Để quan sát bot-với-bot ổn định, bật Chế độ Giao tiếp Bot-với-Bot trong `@BotFather` cho cả hai bot và bảo đảm bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, bản tóm tắt, và artifact observed-messages dưới `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT quan sát được.

Các lane transport trực tiếp dùng chung một contract chuẩn để transport mới không bị lệch; ma trận phạm vi từng lane nằm trong [Tổng quan QA → Phạm vi transport trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là suite tổng hợp rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi bật `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) cho
`openclaw qa telegram`, QA lab lấy một lease độc quyền từ pool dựa trên Convex, gửi Heartbeat
cho lease đó trong khi lane đang chạy, và giải phóng lease khi shutdown.

Scaffold dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Env vars bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho vai trò đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn vai trò thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định env: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, ngược lại là `maintainer`)

Env vars tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` local loopback để phát triển chỉ cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên sử dụng `https://` trong hoạt động bình thường.

Các lệnh quản trị của người bảo trì (pool add/remove/list) yêu cầu riêng
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Các trình trợ giúp CLI cho người bảo trì:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lần chạy live để kiểm tra URL site Convex, các bí mật broker,
tiền tố endpoint, thời gian chờ HTTP và khả năng truy cập admin/list mà không in
giá trị bí mật. Dùng `--json` để có đầu ra máy có thể đọc được trong script và
tiện ích CI.

Hợp đồng endpoint mặc định (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Yêu cầu: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Thành công: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Hết tài nguyên/có thể thử lại: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Yêu cầu: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Thành công: `{ status: "ok" }` (hoặc `2xx` rỗng)
- `POST /release`
  - Yêu cầu: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Thành công: `{ status: "ok" }` (hoặc `2xx` rỗng)
- `POST /admin/add` (chỉ bí mật của người bảo trì)
  - Yêu cầu: `{ kind, actorId, payload, note?, status? }`
  - Thành công: `{ status: "ok", credential }`
- `POST /admin/remove` (chỉ bí mật của người bảo trì)
  - Yêu cầu: `{ credentialId, actorId }`
  - Thành công: `{ status: "ok", changed, credential }`
  - Bộ chặn lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ bí mật của người bảo trì)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Hình dạng payload cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi id chat Telegram dạng số.
- `admin/add` xác thực hình dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

### Thêm một kênh vào QA

Kiến trúc và tên trình trợ giúp kịch bản cho các adapter kênh mới nằm trong [tổng quan QA → Thêm một kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai transport runner trên seam máy chủ `qa-lab` dùng chung, khai báo `qaRunners` trong manifest Plugin, mount dưới dạng `openclaw qa <runner>` và tạo kịch bản trong `qa/scenarios/`.

## Bộ kiểm thử (chạy ở đâu)

Hãy xem các bộ này là “độ chân thực tăng dần” (và độ dễ nhiễu/chi phí cũng tăng dần):

### Unit / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng tập shard `vitest.full-*.config.ts` và có thể mở rộng shard nhiều dự án thành cấu hình theo từng dự án để lập lịch song song
- Tệp: inventory core/unit trong `src/**/*.test.ts`, `packages/**/*.test.ts` và `test/**/*.test.ts`; kiểm thử unit UI chạy trong shard chuyên dụng `unit-ui`
- Phạm vi:
  - Kiểm thử unit thuần
  - Kiểm thử tích hợp trong tiến trình (xác thực Gateway, định tuyến, tooling, phân tích cú pháp, cấu hình)
  - Hồi quy xác định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không cần khóa thật
  - Nên nhanh và ổn định
  - Các kiểm thử resolver và public-surface loader phải chứng minh hành vi fallback rộng của `api.js` và
    `runtime-api.js` bằng fixture Plugin nhỏ được sinh, không phải
    API nguồn Plugin đóng gói thật. Việc tải API Plugin thật thuộc về
    các bộ hợp đồng/tích hợp do Plugin sở hữu.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` không nhắm mục tiêu chạy mười hai cấu hình shard nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình root-project gốc khổng lồ. Điều này giảm RSS đỉnh trên máy tải cao và tránh việc auto-reply/extension làm đói các bộ không liên quan.
    - `pnpm test --watch` vẫn dùng đồ thị dự án `vitest.config.ts` gốc native, vì vòng lặp watch nhiều shard không thực tế.
    - `pnpm test`, `pnpm test:watch` và `pnpm test:perf:imports` định tuyến các mục tiêu tệp/thư mục rõ ràng qua các lane có phạm vi trước, để `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh trả toàn bộ chi phí khởi động dự án gốc.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các lane có phạm vi rẻ: chỉnh sửa kiểm thử trực tiếp, tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng và các phụ thuộc đồ thị import cục bộ. Chỉnh sửa cấu hình/thiết lập/package không chạy rộng các kiểm thử trừ khi bạn dùng rõ `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường cho công việc hẹp. Nó phân loại diff thành core, kiểm thử core, extensions, kiểm thử extension, apps, docs, metadata phát hành, tooling Docker live và tooling, rồi chạy typecheck, lint và các lệnh guard tương ứng. Nó không chạy kiểm thử Vitest; gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các bump phiên bản chỉ metadata phát hành chạy kiểm tra phiên bản/cấu hình/root-dependency có mục tiêu, với guard từ chối thay đổi package ngoài trường phiên bản cấp cao nhất.
    - Chỉnh sửa harness ACP Docker live chạy các kiểm tra tập trung: cú pháp shell cho các script xác thực Docker live và dry-run bộ lập lịch Docker live. Thay đổi `package.json` chỉ được bao gồm khi diff bị giới hạn trong `scripts["test:docker:live-*"]`; các chỉnh sửa dependency, export, phiên bản và bề mặt package khác vẫn dùng các guard rộng hơn.
    - Kiểm thử unit nhẹ import từ agents, commands, plugins, trình trợ giúp auto-reply, `plugin-sdk` và các vùng tiện ích thuần tương tự được định tuyến qua lane `unit-fast`, lane này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng runtime vẫn ở các lane hiện có.
    - Một số tệp nguồn trợ giúp `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy changed-mode tới kiểm thử cùng cấp rõ ràng trong các lane nhẹ đó, để chỉnh sửa helper tránh chạy lại toàn bộ bộ nặng cho thư mục đó.
    - `auto-reply` có các bucket chuyên dụng cho helper core cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất và cây con `src/auto-reply/reply/**`. CI còn chia cây con reply thành shard agent-runner, dispatch và commands/state-routing để một bucket nặng import không sở hữu toàn bộ đuôi Node.
    - CI PR/main thông thường cố ý bỏ qua sweep hàng loạt extension và shard chỉ phát hành `agentic-plugins`. Full Release Validation dispatch workflow con `Plugin Prerelease` riêng cho các bộ nặng plugin/extension đó trên release candidate.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Khi bạn thay đổi đầu vào khám phá message-tool hoặc ngữ cảnh runtime Compaction,
      hãy giữ cả hai mức coverage.
    - Thêm hồi quy helper tập trung cho các ranh giới định tuyến và chuẩn hóa thuần.
    - Giữ các bộ tích hợp embedded runner khỏe mạnh:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ đó xác minh rằng id có phạm vi và hành vi Compaction vẫn đi
      qua các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ helper
      không phải là thay thế đủ cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Cấu hình Vitest cơ sở mặc định là `threads`.
    - Cấu hình Vitest dùng chung cố định `isolate: false` và dùng
      runner không cô lập trên các dự án gốc, cấu hình e2e và live.
    - Lane UI gốc giữ thiết lập `jsdom` và optimizer của nó, nhưng cũng chạy trên
      runner không cô lập dùng chung.
    - Mỗi shard `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false`
      từ cấu hình Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình Node con
      của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8
      nguyên bản.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` hiển thị diff kích hoạt lane kiến trúc nào.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck hay kiểm thử.
    - Chạy rõ `pnpm check:changed` trước khi bàn giao hoặc push khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các lane có phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      quyết định một chỉnh sửa harness, cấu hình, package hoặc hợp đồng thật sự cần coverage
      Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ cùng hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động mở rộng worker cục bộ cố ý bảo thủ và lùi lại
      khi load average của máy chủ đã cao, nên nhiều lần chạy
      Vitest đồng thời mặc định gây ít thiệt hại hơn.
    - Cấu hình Vitest cơ sở đánh dấu các dự án/tệp cấu hình là
      `forceRerunTriggers` để các lần chạy lại changed-mode vẫn đúng khi
      wiring kiểm thử thay đổi.
    - Cấu hình giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` bật trên các máy chủ
      được hỗ trợ; đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache rõ ràng cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cùng
      đầu ra phân rã import.
    - `pnpm test:perf:imports:changed` giới hạn cùng chế độ xem profiling vào
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian shard được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn bộ cấu hình dùng đường dẫn cấu hình làm khóa; shard CI
      theo mẫu include nối thêm tên shard để có thể theo dõi riêng các shard
      đã lọc.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho import khởi động,
      giữ dependency nặng phía sau một seam cục bộ hẹp `*.runtime.ts` và
      mock trực tiếp seam đó thay vì deep-import runtime helper chỉ
      để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn root-project native cho diff
      đã commit đó và in thời gian thực cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây hiện tại
      đang bẩn bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và cấu hình Vitest gốc.
    - `pnpm test:perf:profile:main` ghi profile CPU main-thread cho
      chi phí khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi profile CPU+heap của runner cho
      bộ unit với song song hóa theo tệp bị tắt.

  </Accordion>
</AccordionGroup>

### Độ ổn định (Gateway)

- Lệnh: `pnpm test:stability:gateway`
- Cấu hình: `vitest.gateway.config.ts`, bị ép dùng một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với chẩn đoán được bật mặc định
  - Đẩy churn thông báo Gateway tổng hợp, bộ nhớ và payload lớn qua đường dẫn sự kiện chẩn đoán
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các helper lưu bền bundle ổn định chẩn đoán
  - Khẳng định recorder vẫn bị giới hạn, mẫu RSS tổng hợp nằm dưới ngân sách áp lực và độ sâu hàng đợi theo phiên xả về không
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Lane hẹp cho theo dõi hồi quy độ ổn định, không thay thế cho toàn bộ bộ Gateway

### E2E (gateway smoke)

- Lệnh: `pnpm test:e2e`
- Cấu hình: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và các kiểm thử E2E Plugin tích hợp sẵn trong `extensions/`
- Mặc định khi chạy:
  - Dùng Vitest `threads` với `isolate: false`, khớp với phần còn lại của repo.
  - Dùng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Chạy ở chế độ im lặng theo mặc định để giảm chi phí I/O trên console.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để ép số lượng worker (giới hạn tối đa 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra console chi tiết.
- Phạm vi:
  - Hành vi Gateway đầu cuối đa phiên bản
  - Bề mặt WebSocket/HTTP, ghép cặp node, và mạng nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không cần khóa thật
  - Nhiều thành phần chuyển động hơn kiểm thử đơn vị (có thể chậm hơn)

### E2E: kiểm tra smoke backend OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Khởi động một Gateway OpenShell cô lập trên máy chủ thông qua Docker
  - Tạo một sandbox từ Dockerfile cục bộ tạm thời
  - Thực thi backend OpenShell của OpenClaw qua `sandbox ssh-config` thật + SSH exec
  - Xác minh hành vi hệ thống tệp chuẩn phía xa thông qua cầu nối fs của sandbox
- Kỳ vọng:
  - Chỉ chạy khi chọn bật; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cùng một Docker daemon hoạt động
  - Dùng `HOME` / `XDG_CONFIG_HOME` cô lập, rồi hủy Gateway kiểm thử và sandbox
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới nhị phân CLI hoặc script wrapper không mặc định

### Trực tiếp (provider thật + model thật)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các kiểm thử trực tiếp Plugin tích hợp sẵn trong `extensions/`
- Mặc định: **được bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - "Provider/model này có thực sự hoạt động _hôm nay_ với thông tin xác thực thật không?"
  - Bắt các thay đổi định dạng provider, đặc điểm riêng khi gọi công cụ, vấn đề xác thực, và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế không ổn định cho CI (mạng thật, chính sách provider thật, quota, sự cố ngừng dịch vụ)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con đã thu hẹp thay vì "mọi thứ"
- Các lần chạy trực tiếp nạp `~/.profile` để lấy các khóa API còn thiếu.
- Theo mặc định, các lần chạy trực tiếp vẫn cô lập `HOME` và sao chép cấu hình/tài liệu xác thực vào một home kiểm thử tạm thời để fixture đơn vị không thể sửa đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn cố ý cần kiểm thử trực tiếp dùng thư mục home thật của mình.
- `pnpm test:live` hiện mặc định ở chế độ yên tĩnh hơn: giữ đầu ra tiến trình `[live] ...`, nhưng ẩn thông báo `~/.profile` bổ sung và tắt nhật ký khởi động Gateway/tiếng ồn Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn lấy lại đầy đủ nhật ký khởi động.
- Xoay vòng khóa API (theo từng provider): đặt `*_API_KEYS` với định dạng dấu phẩy/dấu chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè riêng cho lần chạy trực tiếp qua `OPENCLAW_LIVE_*_KEY`; kiểm thử sẽ thử lại khi có phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ kiểm thử trực tiếp hiện phát các dòng tiến trình tới stderr để các lệnh gọi provider kéo dài vẫn hiển thị là đang hoạt động ngay cả khi việc bắt console của Vitest đang yên tĩnh.
  - `vitest.live.config.ts` tắt việc Vitest chặn console để các dòng tiến trình của provider/Gateway truyền ngay lập tức trong các lần chạy trực tiếp.
  - Điều chỉnh Heartbeat model trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Điều chỉnh Heartbeat Gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ nào?

Dùng bảng quyết định này:

- Chỉnh sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn đã thay đổi nhiều)
- Chạm tới mạng Gateway / giao thức WS / ghép cặp: thêm `pnpm test:e2e`
- Gỡ lỗi "bot của tôi bị sập" / lỗi theo provider / gọi công cụ: chạy một `pnpm test:live` đã thu hẹp

## Kiểm thử trực tiếp (chạm tới mạng)

Đối với ma trận model trực tiếp, smoke backend CLI, smoke ACP, harness máy chủ ứng dụng Codex,
và mọi kiểm thử trực tiếp provider phương tiện (Deepgram, BytePlus, ComfyUI, hình ảnh,
nhạc, video, harness phương tiện) - cộng với xử lý thông tin xác thực cho các lần chạy trực tiếp - xem
[Kiểm thử các bộ trực tiếp](/vi/help/testing-live). Đối với danh sách kiểm tra chuyên biệt về cập nhật và
xác thực Plugin, xem
[Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Bộ chạy Docker (kiểm tra "hoạt động trên Linux" tùy chọn)

Các bộ chạy Docker này chia thành hai nhóm:

- Bộ chạy model trực tiếp: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp trực tiếp khóa hồ sơ tương ứng bên trong image Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), mount thư mục cấu hình cục bộ và workspace của bạn (và nạp `~/.profile` nếu được mount). Các điểm vào cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Bộ chạy trực tiếp Docker mặc định dùng giới hạn smoke nhỏ hơn để một lần quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các biến môi trường đó khi bạn
  rõ ràng muốn lần quét toàn diện lớn hơn.
- `test:docker:all` xây dựng image Docker trực tiếp một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần thành npm tarball thông qua `scripts/package-openclaw-for-docker.mjs`, rồi xây dựng/tái sử dụng hai image `scripts/e2e/Dockerfile`. Image trần chỉ là bộ chạy Node/Git cho các lane cài đặt/cập nhật/phụ thuộc Plugin; các lane đó mount tarball đã dựng sẵn. Image chức năng cài cùng tarball đó vào `/app` cho các lane chức năng ứng dụng đã build. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Bộ tổng hợp dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` kiểm soát các slot tiến trình, trong khi giới hạn tài nguyên ngăn các lane trực tiếp nặng, cài đặt npm, và đa dịch vụ cùng khởi động một lúc. Nếu một lane đơn lẻ nặng hơn các giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động nó khi pool trống rồi giữ nó chạy một mình cho tới khi lại có dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ điều chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi máy chủ Docker có thêm dư địa. Bộ chạy thực hiện preflight Docker theo mặc định, gỡ bỏ các container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời lượng lane thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời lượng đó để khởi động các lane dài hơn trước trong những lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane có trọng số mà không build hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các lane đã chọn, nhu cầu package/image, và thông tin xác thực.
- `Package Acceptance` là cổng package gốc GitHub cho "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một package ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải nó lên dưới dạng `package-under-test`, rồi chạy các lane Docker E2E tái sử dụng trên đúng tarball đó thay vì đóng gói lại ref đã chọn. Các hồ sơ được sắp theo độ rộng: `smoke`, `package`, `product`, và `full`. Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng package/cập nhật/Plugin, ma trận sống sót sau nâng cấp đã phát hành, mặc định phát hành, và phân loại lỗi.
- Kiểm tra build và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Guard duyệt đồ thị build tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và thất bại nếu các import khởi động trước dispatch nhập phụ thuộc package như Commander, giao diện nhắc lệnh, undici, hoặc ghi nhật ký trước khi dispatch lệnh; nó cũng giữ chunk chạy Gateway được đóng gói dưới ngân sách và từ chối import tĩnh của các đường dẫn Gateway lạnh đã biết. Smoke CLI đã đóng gói cũng bao phủ trợ giúp gốc, trợ giúp onboarding, trợ giúp doctor, trạng thái, schema cấu hình, và lệnh liệt kê model.
- Tương thích legacy của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Tới mốc đó, harness chỉ dung thứ các khoảng trống metadata của package đã phát hành: mục inventory QA private bị bỏ qua, thiếu `gateway install --wrapper`, thiếu tệp patch trong fixture git dẫn xuất từ tarball, thiếu `update.channel` được lưu bền, vị trí bản ghi cài đặt Plugin legacy, thiếu lưu bền bản ghi cài đặt marketplace, và di chuyển metadata cấu hình trong `plugins update`. Với các package sau `2026.4.25`, các đường dẫn đó là lỗi nghiêm ngặt.
- Bộ chạy smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.

Bộ chạy Docker model trực tiếp cũng chỉ bind-mount các home xác thực CLI cần thiết (hoặc tất cả home được hỗ trợ khi lần chạy không được thu hẹp), rồi sao chép chúng vào home trong container trước lần chạy để OAuth CLI bên ngoài có thể làm mới token mà không sửa đổi kho xác thực của máy chủ:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Kiểm thử nhanh liên kết ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với phạm vi kiểm thử nghiêm ngặt cho Droid/OpenCode qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử nhanh phần phụ trợ CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử nhanh bộ khung app-server của Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + tác tử phát triển: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử nhanh khả năng quan sát: `pnpm qa:otel:smoke` là một luồng QA riêng tư từ bản checkout mã nguồn. Nó chủ ý không thuộc các luồng phát hành Docker theo gói vì tarball npm bỏ qua QA Lab.
- Kiểm thử nhanh trực tiếp Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn thiết lập ban đầu (TTY, dựng khung đầy đủ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử nhanh thiết lập ban đầu/kênh/tác tử bằng tarball npm: `pnpm test:docker:npm-onboard-channel-agent` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, cấu hình OpenAI qua thiết lập ban đầu env-ref cùng Telegram theo mặc định, chạy doctor và chạy một lượt tác tử OpenAI được mô phỏng. Dùng lại tarball dựng sẵn với `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bước dựng lại trên host với `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc đổi kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` hoặc `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Kiểm thử nhanh chuyển đổi kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, chuyển từ gói `stable` sang git `dev`, xác minh kênh đã lưu và hoạt động của Plugin sau cập nhật, rồi chuyển lại về gói `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử nhanh khả năng bền vững qua nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt tarball OpenClaw đã đóng gói lên trên một bộ dữ liệu kiểm thử người dùng cũ ở trạng thái bẩn có tác tử, cấu hình kênh, danh sách cho phép Plugin, trạng thái phụ thuộc Plugin lỗi thời và các tệp không gian làm việc/phiên hiện có. Nó chạy cập nhật gói cùng doctor không tương tác mà không cần khóa nhà cung cấp trực tiếp hoặc khóa kênh, sau đó khởi động một Gateway loopback và kiểm tra việc giữ nguyên cấu hình/trạng thái cùng ngân sách khởi động/trạng thái.
- Kiểm thử nhanh khả năng bền vững qua nâng cấp đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, tạo dữ liệu tệp người dùng hiện có thực tế, cấu hình mốc cơ sở đó bằng một công thức lệnh dựng sẵn, xác thực cấu hình thu được, cập nhật bản cài đặt đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway loopback và kiểm tra các intent đã cấu hình, việc giữ nguyên trạng thái, khởi động, `/healthz`, `/readyz` và ngân sách trạng thái RPC. Ghi đè một mốc cơ sở bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các mốc cơ sở cục bộ chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, và mở rộng các bộ dữ liệu kiểm thử mô phỏng issue bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; tập reported-issues bao gồm `configured-plugin-installs` để sửa chữa tự động cài đặt Plugin OpenClaw bên ngoài. Package Acceptance công bố các giá trị đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` và `published_upgrade_survivor_scenarios`, phân giải các token mốc cơ sở meta như `last-stable-4` hoặc `all-since-2026.4.23`, và Full Release Validation mở rộng cổng gói kiểm thử ổn định phát hành kéo dài thành `last-stable-4 2026.4.23 2026.5.2 2026.4.15` cộng với `reported-issues`.
- Kiểm thử nhanh ngữ cảnh thời gian chạy của phiên: `pnpm test:docker:session-runtime-context` xác minh việc lưu bền bản ghi hội thoại ngữ cảnh thời gian chạy ẩn cùng việc doctor sửa chữa các nhánh viết lại lời nhắc trùng lặp bị ảnh hưởng.
- Kiểm thử nhanh cài đặt toàn cục bằng Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một home cô lập và xác minh `openclaw infer image providers --json` trả về các nhà cung cấp hình ảnh đi kèm thay vì bị treo. Dùng lại tarball dựng sẵn với `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bước dựng trên host với `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một image Docker đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử nhanh trình cài đặt trên Docker: `bash scripts/test-install-sh-docker.sh` dùng chung một bộ nhớ đệm npm giữa các container root, update và direct-npm. Kiểm thử nhanh cập nhật mặc định dùng npm `latest` làm mốc cơ sở ổn định trước khi nâng cấp lên tarball ứng viên. Ghi đè bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` ở cục bộ, hoặc bằng đầu vào `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ một bộ nhớ đệm npm cô lập để các mục bộ nhớ đệm thuộc sở hữu root không che khuất hành vi cài đặt cục bộ theo người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để dùng lại bộ nhớ đệm root/update/direct-npm qua các lần chạy lại cục bộ.
- CI Install Smoke bỏ qua lần cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy script ở cục bộ mà không có env đó khi cần phạm vi kiểm thử trực tiếp `npm install -g`.
- Kiểm thử nhanh CLI xóa không gian làm việc dùng chung của tác tử: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng image Dockerfile gốc, tạo dữ liệu hai tác tử với một không gian làm việc trong home container cô lập, chạy `agents delete --json` và xác minh JSON hợp lệ cùng hành vi giữ lại không gian làm việc. Dùng lại image install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + tình trạng): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử nhanh ảnh chụp CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng image E2E nguồn cùng một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep` và xác minh ảnh chụp vai trò CDP bao phủ URL liên kết, các phần tử có thể nhấp được nâng hạng từ con trỏ, tham chiếu iframe và siêu dữ liệu khung.
- Hồi quy lập luận tối thiểu của `web_search` trong OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI mô phỏng qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, rồi buộc schema của nhà cung cấp từ chối và kiểm tra chi tiết thô xuất hiện trong nhật ký Gateway.
- Cầu nối kênh MCP (Gateway được tạo dữ liệu + cầu nối stdio + kiểm thử nhanh khung thông báo thô của Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP trong gói Pi (máy chủ MCP stdio thật + kiểm thử nhanh cho phép/từ chối của hồ sơ Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP Cron/tác tử con (Gateway thật + dọn dẹp tiến trình con MCP stdio sau các lượt chạy cron cô lập và tác tử con một lần): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (kiểm thử nhanh cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc được hoist, ref git di động, bộ tổng hợp ClawHub, cập nhật chợ Plugin và bật/kiểm tra gói Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp gói/thời gian chạy tổng hợp mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Nếu không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, kiểm thử dùng một máy chủ dữ liệu kiểm thử ClawHub cục bộ khép kín.
- Kiểm thử nhanh cập nhật Plugin không đổi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử nhanh ma trận vòng đời Plugin: `pnpm test:docker:plugin-lifecycle-matrix` cài đặt tarball OpenClaw đã đóng gói trong một container trần, cài đặt một Plugin npm, chuyển bật/tắt, nâng cấp và hạ cấp Plugin đó qua một registry npm cục bộ, xóa mã đã cài đặt, rồi xác minh việc gỡ cài đặt vẫn xóa trạng thái cũ trong khi ghi nhật ký chỉ số RSS/CPU cho từng giai đoạn vòng đời.
- Kiểm thử nhanh siêu dữ liệu tải lại cấu hình: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` bao phủ kiểm thử nhanh cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc được hoist, ref git di động, fixture ClawHub, cập nhật chợ Plugin và bật/kiểm tra gói Claude. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không đổi cho các Plugin đã cài đặt. `pnpm test:docker:plugin-lifecycle-matrix` bao phủ cài đặt, bật, tắt, nâng cấp, hạ cấp và gỡ cài đặt khi thiếu mã cho Plugin npm có theo dõi tài nguyên.

Để dựng trước và dùng lại image chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image theo bộ kiểm thử như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một image dùng chung từ xa, các script sẽ pull image đó nếu chưa có cục bộ. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi gói/cài đặt thay vì runtime ứng dụng đã dựng dùng chung.

Các Docker runner cho mô hình live cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Điều này giữ cho image runtime
gọn nhẹ trong khi vẫn chạy Vitest trên đúng source/config cục bộ của bạn.
Bước staging bỏ qua các cache lớn chỉ dùng cục bộ và output build app như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục output `.build` cục bộ theo app hoặc
Gradle để các lần chạy Docker live không mất nhiều phút sao chép
artifact riêng theo máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các probe live của Gateway không khởi động
worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền thêm
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ coverage live của Gateway
khỏi lane Docker đó.
`test:docker:openwebui` là một smoke tương thích cấp cao hơn: nó khởi động một
container OpenClaw gateway với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI đã ghim phiên bản trỏ tới gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` expose `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Lần chạy đầu tiên có thể chậm hơn rõ rệt vì Docker có thể cần pull image
Open WebUI và Open WebUI có thể cần hoàn tất bước thiết lập cold-start riêng.
Lane này yêu cầu một key mô hình live dùng được, và `OPENCLAW_PROFILE_FILE`
(mặc định là `~/.profile`) là cách chính để cung cấp key đó trong các lần chạy Dockerized.
Các lần chạy thành công in ra một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính xác định và không cần tài khoản
Telegram, Discord, hoặc iMessage thật. Nó boot một container Gateway đã seed,
khởi động container thứ hai sinh ra `openclaw mcp serve`, rồi xác minh
khám phá hội thoại được định tuyến, đọc transcript, metadata attachment,
hành vi hàng đợi sự kiện live, định tuyến gửi outbound, và thông báo kiểu Claude về kênh +
quyền qua cầu nối stdio MCP thật. Kiểm tra thông báo
inspect trực tiếp các frame stdio MCP thô để smoke xác thực những gì
cầu nối thật sự emit, không chỉ những gì một client SDK cụ thể tình cờ surface.
`test:docker:pi-bundle-mcp-tools` có tính xác định và không cần key mô hình live.
Nó build image Docker của repo, khởi động một server probe stdio MCP thật
bên trong container, materialize server đó qua runtime MCP của bundle Pi
được nhúng, thực thi tool, rồi xác minh `coding` và `messaging` giữ lại
tool `bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần key mô hình live.
Nó khởi động một Gateway đã seed với server probe stdio MCP thật, chạy một
cron turn cô lập và một child turn `/subagents spawn` one-shot, rồi xác minh
process con MCP thoát sau mỗi lần chạy.

Smoke thủ công thread ACP bằng ngôn ngữ tự nhiên (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow regression/debug. Nó có thể lại cần thiết cho việc xác thực định tuyến thread ACP, vì vậy đừng xóa nó.

Các biến env hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến env được source từ `OPENCLAW_PROFILE_FILE`, dùng thư mục config/workspace tạm thời và không mount auth CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các cài đặt CLI đã cache bên trong Docker
- Các thư mục/tệp auth CLI bên ngoài dưới `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi test bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy provider đã thu hẹp chỉ mount những thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc một danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc provider trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để tái sử dụng image `openclaw:local-live` hiện có cho các lần chạy lại không cần rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo credential đến từ profile store (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình được gateway expose cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce dùng bởi smoke Open WebUI
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã ghim

## Kiểm tra sanity tài liệu

Chạy kiểm tra tài liệu sau khi sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra heading trong trang: `pnpm docs:check-links:anchors`.

## Regression offline (an toàn cho CI)

Đây là các regression "pipeline thật" không có provider thật:

- Gọi tool qua Gateway (mock OpenAI, Gateway thật + vòng lặp agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, ghi config + thực thi auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Đánh giá độ tin cậy của agent (Skills)

Chúng ta đã có một vài test an toàn cho CI hoạt động như "đánh giá độ tin cậy của agent":

- Mock tool-calling qua Gateway thật + vòng lặp agent (`src/gateway/gateway.test.ts`).
- Luồng wizard end-to-end xác thực nối dây session và hiệu lực config (`src/gateway/gateway.test.ts`).

Những gì vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi Skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi dùng và làm theo các bước/args bắt buộc không?
- **Hợp đồng workflow:** các kịch bản multi-turn assert thứ tự tool, việc giữ lịch sử session, và ranh giới sandbox.

Các eval trong tương lai nên ưu tiên tính xác định trước:

- Một scenario runner dùng mock provider để assert tool call + thứ tự, đọc tệp skill, và nối dây session.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng so với tránh, gating, prompt injection).
- Eval live tùy chọn (opt-in, có env gate) chỉ sau khi bộ an toàn cho CI đã có.

## Test hợp đồng (hình dạng Plugin và kênh)

Test hợp đồng xác minh mọi Plugin và kênh đã đăng ký đều tuân thủ
hợp đồng interface của nó. Chúng lặp qua tất cả Plugin đã phát hiện và chạy một bộ
assertion về hình dạng và hành vi. Lane unit `pnpm test` mặc định cố ý
bỏ qua các tệp smoke và seam dùng chung này; hãy chạy rõ ràng các lệnh hợp đồng
khi bạn chạm vào bề mặt kênh hoặc provider dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng provider: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng Plugin cơ bản (id, tên, capability)
- **setup** - Hợp đồng wizard thiết lập
- **session-binding** - Hành vi binding session
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn inbound
- **actions** - Handler action kênh
- **threading** - Xử lý ID thread
- **directory** - API directory/roster
- **group-policy** - Thực thi chính sách nhóm

### Hợp đồng trạng thái provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe trạng thái kênh
- **registry** - Hình dạng registry Plugin

### Hợp đồng provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng luồng auth
- **auth-choice** - Lựa chọn/chọn auth
- **catalog** - API catalog mô hình
- **discovery** - Khám phá Plugin
- **loader** - Tải Plugin
- **runtime** - Runtime provider
- **shape** - Hình dạng/interface Plugin
- **wizard** - Wizard thiết lập

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa Plugin kênh hoặc provider
- Sau khi refactor đăng ký hoặc khám phá Plugin

Test hợp đồng chạy trong CI và không yêu cầu key API thật.

## Thêm regression (hướng dẫn)

Khi bạn sửa một vấn đề provider/mô hình được phát hiện trong live:

- Thêm một regression an toàn cho CI nếu có thể (mock/stub provider, hoặc capture đúng phép biến đổi request-shape)
- Nếu về bản chất chỉ live mới kiểm tra được (rate limit, chính sách auth), hãy giữ test live hẹp và opt-in qua biến env
- Ưu tiên nhắm vào lớp nhỏ nhất bắt được lỗi:
  - lỗi chuyển đổi/replay request provider → test models trực tiếp
  - lỗi pipeline session/history/tool Gateway → smoke Gateway live hoặc test mock Gateway an toàn cho CI
- Guardrail duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một target được lấy mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi assert các exec id dạng traversal-segment bị từ chối.
  - Nếu bạn thêm một họ target SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong test đó. Test cố ý fail với target id chưa phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Testing live](/vi/help/testing-live)
- [Testing updates and plugins](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
