---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm kiểm thử hồi quy cho lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của Gateway + tác tử
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử unit/e2e/live, trình chạy Docker và phạm vi kiểm thử của từng bài kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-04T07:05:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (unit/integration, e2e, live) và một tập nhỏ các runner Docker. Tài liệu này là hướng dẫn "cách chúng ta kiểm thử":

- Mỗi bộ kiểm thử bao phủ những gì (và những gì nó cố ý _không_ bao phủ).
- Các lệnh cần chạy cho các workflow phổ biến (cục bộ, trước khi push, gỡ lỗi).
- Cách kiểm thử live phát hiện thông tin xác thực và chọn mô hình/nhà cung cấp.
- Cách thêm hồi quy cho các sự cố mô hình/nhà cung cấp trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các lane truyền tải live)** được ghi lại riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) — kiến trúc, bề mặt lệnh, cách viết kịch bản.
- [QA ma trận](/vi/concepts/qa-matrix) — tham chiếu cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) — Plugin truyền tải tổng hợp được dùng bởi các kịch bản dựa trên repo.

Trang này bao quát việc chạy các bộ kiểm thử thông thường và runner Docker/Parallels. Phần runner dành riêng cho QA bên dưới ([Runner dành riêng cho QA](#qa-specific-runners)) liệt kê các lời gọi `qa` cụ thể và trỏ lại các tài liệu tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng kiểm tra đầy đủ (kỳ vọng trước khi push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy bộ đầy đủ nhanh hơn trên máy nhiều tài nguyên: `pnpm test:max`
- Vòng lặp watch trực tiếp của Vitest: `pnpm test:watch`
- Nhắm mục tiêu tệp trực tiếp giờ cũng định tuyến các đường dẫn extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên các lần chạy có mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Trang QA dựa trên Docker: `pnpm qa:lab:up`
- Lane QA dựa trên máy ảo Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng coverage: `pnpm test:coverage`
- Bộ E2E: `pnpm test:e2e`

Khi gỡ lỗi các nhà cung cấp/mô hình thực (yêu cầu thông tin xác thực thật):

- Bộ live (mô hình + probe công cụ/hình ảnh Gateway): `pnpm test:live`
- Nhắm mục tiêu một tệp live ở chế độ yên lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng runtime: dispatch `OpenClaw Performance` với
  `live_gpt54=true` cho một lượt tác tử `openai/gpt-5.4` thật hoặc
  `deep_profile=true` cho artifact CPU/heap/trace của Kova. Các lần chạy theo lịch hằng ngày
  publish artifact lane mock-provider, deep-profile và GPT 5.4 lên
  `openclaw/clawgrit-reports` khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình. Báo cáo
  mock-provider cũng bao gồm số liệu gateway boot cấp nguồn, bộ nhớ,
  plugin-pressure, hello-loop fake-model lặp lại và khởi động CLI.
- Quét mô hình live Docker: `pnpm test:docker:live-models`
  - Mỗi mô hình được chọn giờ chạy một lượt văn bản cộng với một probe nhỏ kiểu đọc tệp.
    Các mô hình có metadata quảng cáo đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các probe bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi nhà cung cấp.
  - Coverage CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E có thể tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận mô hình live Docker riêng
    được shard theo nhà cung cấp.
  - Với các lần chạy lại CI tập trung, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm secret nhà cung cấp có tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các caller
    theo lịch/release của nó.
- Smoke bound-chat Codex native: `pnpm test:docker:live-codex-bind`
  - Chạy một lane live Docker trên đường dẫn Codex app-server, bind một Slack DM tổng hợp
    với `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi thường và một tệp đính kèm hình ảnh
    định tuyến qua binding Plugin native thay vì ACP.
- Smoke harness Codex app-server: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt tác tử Gateway qua harness Codex app-server do Plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và mặc định thực thi các probe hình ảnh,
    cron MCP, sub-agent và Guardian. Tắt probe sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi Codex
    app-server khác. Với kiểm tra sub-agent tập trung, tắt các probe khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Lệnh này thoát sau probe sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Smoke lệnh rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra belt-and-suspenders dạng opt-in cho bề mặt lệnh rescue message-channel.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi mô hình bền vững,
    trả lời `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong container không có config với Claude CLI giả trên `PATH`
    và xác minh fallback planner fuzzy được dịch thành một lần ghi config có kiểu và được audit.
- Smoke Docker lần chạy đầu tiên của Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, định tuyến `openclaw` trần tới
    Crestodian, áp dụng setup/model/agent/Discord Plugin + ghi SecretRef,
    xác thực config và xác minh các entry audit. Cùng đường dẫn thiết lập Ring 0 này
    cũng được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  biệt lập trên `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và
  transcript của assistant lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một ca lỗi, hãy ưu tiên thu hẹp kiểm thử live bằng các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Runner dành riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần tính thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. Agentic parity được lồng dưới
`QA-Lab - All Lanes` và xác thực release, không phải một workflow PR độc lập.
Xác thực rộng nên dùng `Full Release Validation` với
`rerun_group=qa-parity` hoặc nhóm QA của release-checks. `QA-Lab - All Lanes`
chạy hằng đêm trên `main` và từ manual dispatch với lane mock parity, lane
Matrix live, lane Telegram live do Convex quản lý và lane Discord live do Convex
quản lý dưới dạng các job song song. QA theo lịch và release check truyền Matrix
`--profile fast` một cách tường minh, trong khi CLI Matrix và đầu vào workflow thủ công
mặc định vẫn là `all`; manual dispatch có thể shard `all` thành các job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` và `e2ee-cli`. `OpenClaw Release
Checks` chạy parity cộng với các lane Matrix nhanh và Telegram trước khi phê duyệt
release, dùng `mock-openai/gpt-5.5` cho các kiểm tra truyền tải release để chúng vẫn
xác định và tránh khởi động Plugin nhà cung cấp thông thường. Các Gateway truyền tải live
này tắt tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ QA parity.

Các shard live media của full release dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard mô hình/backend live Docker dùng image dùng chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi commit được chọn,
rồi pull image đó với `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì build lại
bên trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy các kịch bản QA dựa trên repo trực tiếp trên máy chủ.
  - Mặc định chạy song song nhiều kịch bản đã chọn bằng các worker Gateway
    được cô lập. `qa-channel` mặc định có concurrency 4 (bị giới hạn bởi số
    kịch bản đã chọn). Dùng `--concurrency <count>` để điều chỉnh số worker,
    hoặc `--concurrency 1` cho lane nối tiếp cũ hơn.
  - Thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có exit code thất bại.
  - Hỗ trợ các chế độ provider `live-frontier`, `mock-openai`, và `aimock`.
    `aimock` khởi động một server provider cục bộ dựa trên AIMock để bao phủ
    fixture thử nghiệm và mock giao thức mà không thay thế lane `mock-openai`
    nhận biết kịch bản.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy bench khởi động Gateway cùng một gói nhỏ kịch bản QA Lab giả lập
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi một bản tóm tắt quan sát CPU tổng hợp
    dưới `.artifacts/gateway-cpu-scenarios/`.
  - Mặc định chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cộng với `--hot-wall-warn-ms`), nên các đợt tăng ngắn lúc khởi động được ghi
    làm metric mà không trông giống hồi quy Gateway bị ghim CPU kéo dài nhiều phút.
  - Dùng artifact `dist` đã build; hãy chạy build trước khi checkout chưa có
    output runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA suite trong một VM Linux Multipass dùng một lần.
  - Giữ nguyên hành vi chọn kịch bản như `qa suite` trên máy chủ.
  - Tái sử dụng cùng các flag chọn provider/model như `qa suite`.
  - Các lần chạy live chuyển tiếp những input xác thực QA được hỗ trợ và thực tế cho guest:
    khóa provider qua env, đường dẫn cấu hình provider live của QA, và `CODEX_HOME`
    khi có.
  - Thư mục output phải nằm dưới gốc repo để guest có thể ghi ngược lại qua
    workspace được mount.
  - Ghi báo cáo QA + tóm tắt bình thường cùng log Multipass dưới
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA dựa trên Docker cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt toàn cục trong
    Docker, chạy onboarding khóa API OpenAI không tương tác, mặc định cấu hình Telegram,
    xác minh runtime Plugin đóng gói tải được mà không cần sửa dependency lúc khởi động,
    chạy doctor, và chạy một lượt agent cục bộ với endpoint OpenAI được mock.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane cài đặt đóng gói
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một smoke Docker ứng dụng đã build có tính xác định cho transcript ngữ cảnh runtime nhúng.
    Nó xác minh ngữ cảnh runtime OpenClaw ẩn được lưu bền vững dưới dạng một
    custom message không hiển thị thay vì rò rỉ vào lượt người dùng hiển thị,
    sau đó seed một JSONL phiên bị hỏng bị ảnh hưởng và xác minh
    `openclaw doctor --fix` ghi lại nó sang nhánh hoạt động kèm bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên package OpenClaw trong Docker, chạy onboarding package đã cài,
    cấu hình Telegram qua CLI đã cài, rồi tái sử dụng lane QA Telegram live với
    package đã cài đó làm Gateway SUT.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã resolve thay vì
    cài từ registry.
  - Dùng cùng credentials env Telegram hoặc nguồn credential Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/phát hành, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cộng với
    `OPENCLAW_QA_CONVEX_SITE_URL` và secret của role. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một secret role Convex có trong CI,
    wrapper Docker tự động chọn Convex.
  - Wrapper xác thực env credential Telegram hoặc Convex trên máy chủ trước khi
    làm việc build/cài đặt Docker. Chỉ đặt `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    khi chủ đích debug thiết lập trước credential.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này.
  - GitHub Actions hiển thị lane này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và lease credential CI Convex.
- GitHub Actions cũng hiển thị `Package Acceptance` để chạy bên cạnh làm bằng chứng sản phẩm
  với một package ứng viên. Nó chấp nhận một ref đáng tin cậy, spec npm đã publish,
  URL tarball HTTPS cộng SHA-256, hoặc artifact tarball từ một lần chạy khác, upload
  `openclaw-current.tgz` đã chuẩn hóa làm `package-under-test`, rồi chạy
  bộ lập lịch Docker E2E hiện có với các profile lane smoke, package, product, full,
  hoặc tùy chỉnh. Đặt `telegram_mode=mock-openai` hoặc `live-frontier` để chạy
  workflow QA Telegram với cùng artifact `package-under-test`.
  - Bằng chứng sản phẩm beta mới nhất:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bằng chứng URL tarball chính xác yêu cầu một digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Bằng chứng artifact tải xuống một artifact tarball từ một lần chạy Actions khác:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Đóng gói và cài đặt build OpenClaw hiện tại trong Docker, khởi động Gateway
    với OpenAI đã cấu hình, rồi bật các channel/Plugin đi kèm qua chỉnh sửa config.
  - Xác minh quá trình khám phá thiết lập để các Plugin có thể tải xuống nhưng chưa cấu hình vắng mặt,
    lần sửa doctor được cấu hình đầu tiên cài đặt rõ ràng từng Plugin có thể tải xuống
    còn thiếu, và lần khởi động lại thứ hai không chạy sửa dependency ẩn.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của ứng viên
    dọn sạch mảnh vụn dependency Plugin cũ mà không cần sửa postinstall phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật cài đặt đóng gói native trên các guest Parallels. Mỗi
    nền tảng được chọn trước tiên cài package baseline được yêu cầu, sau đó chạy
    lệnh `openclaw update` đã cài trong cùng guest và xác minh phiên bản đã cài,
    trạng thái cập nhật, độ sẵn sàng của Gateway, và một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một guest. Dùng `--json` cho đường dẫn artifact tóm tắt và trạng thái
    từng lane.
  - Lane OpenAI mặc định dùng `openai/gpt-5.5` cho bằng chứng lượt agent live.
    Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi chủ đích xác thực một model OpenAI khác.
  - Bọc các lần chạy cục bộ dài trong timeout máy chủ để các lần kẹt transport Parallels không thể
    dùng hết phần còn lại của khoảng thời gian kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi log lane lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi giả định wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong doctor sau cập nhật và công việc
    cập nhật package trên một guest lạnh; điều đó vẫn khỏe mạnh khi log debug npm
    lồng nhau đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với các lane smoke Parallels
    macOS, Windows, hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể va chạm khi
    khôi phục snapshot, phục vụ package, hoặc trạng thái Gateway của guest.
  - Bằng chứng sau cập nhật chạy bề mặt Plugin đi kèm bình thường vì
    các facade capability như speech, tạo ảnh, và hiểu media
    được tải qua API runtime đi kèm ngay cả khi chính lượt agent
    chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động server provider AIMock cục bộ để kiểm thử smoke giao thức trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy lane QA live Matrix với một homeserver Tuwunel dùng một lần dựa trên Docker. Chỉ checkout nguồn — cài đặt đóng gói không ship `qa-lab`.
  - CLI đầy đủ, catalog profile/kịch bản, biến env, và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy lane QA live Telegram với một nhóm riêng tư thật bằng token driver và bot SUT từ env.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id nhóm phải là id chat Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho credentials gom chung được chia sẻ. Mặc định dùng chế độ env, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng lease gom chung.
  - Thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có exit code thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng nhóm riêng tư, với bot SUT hiển thị username Telegram.
  - Để quan sát bot-với-bot ổn định, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và đảm bảo bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, tóm tắt, và artifact tin nhắn đã quan sát dưới `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT đã quan sát.

Các lane transport live chia sẻ một contract chuẩn để transport mới không lệch; ma trận bao phủ từng lane nằm trong [Tổng quan QA → Bao phủ transport live](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ synthetic suite rộng và không thuộc ma trận đó.

### Credentials Telegram dùng chung qua Convex (v1)

Khi bật `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) cho
`openclaw qa telegram`, QA lab lấy một lease độc quyền từ pool dựa trên Convex, heartbeat
lease đó khi lane đang chạy, và giải phóng lease khi tắt.

Scaffold dự án Convex tham khảo:

- `qa/convex-credential-broker/`

Biến env bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho role đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn role credential:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định env: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, nếu không là `maintainer`)

Biến env tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` loopback cho phát triển chỉ cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong vận hành bình thường.

Các lệnh admin của maintainer (pool add/remove/list) yêu cầu riêng
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Trình hỗ trợ CLI cho maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lần chạy live để kiểm tra URL site Convex, secret broker,
tiền tố endpoint, thời gian chờ HTTP, và khả năng truy cập admin/list mà không in
giá trị secret. Dùng `--json` để có đầu ra máy đọc được trong script và tiện ích CI.

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
- `POST /admin/add` (chỉ secret của maintainer)
  - Yêu cầu: `{ kind, actorId, payload, note?, status? }`
  - Thành công: `{ status: "ok", credential }`
- `POST /admin/remove` (chỉ secret của maintainer)
  - Yêu cầu: `{ credentialId, actorId }`
  - Thành công: `{ status: "ok", changed, credential }`
  - Chặn khi lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ secret của maintainer)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Dạng payload cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi id chat Telegram dạng số.
- `admin/add` xác thực dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

### Thêm kênh vào QA

Kiến trúc và tên scenario-helper cho adapter kênh mới nằm trong [Tổng quan QA → Thêm kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai transport runner trên seam host `qa-lab` dùng chung, khai báo `qaRunners` trong manifest plugin, mount dưới dạng `openclaw qa <runner>`, và viết scenario trong `qa/scenarios/`.

## Bộ kiểm thử (chạy ở đâu)

Hãy xem các bộ này là “mức độ chân thực tăng dần” (đồng thời độ chập chờn/chi phí cũng tăng):

### Unit / integration (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không chỉ định mục tiêu dùng tập shard `vitest.full-*.config.ts` và có thể mở rộng shard nhiều project thành cấu hình theo từng project để lập lịch song song
- Tệp: inventory core/unit trong `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử unit UI chạy trong shard `unit-ui` chuyên dụng
- Phạm vi:
  - Kiểm thử unit thuần
  - Kiểm thử integration trong tiến trình (xác thực gateway, định tuyến, tooling, parsing, cấu hình)
  - Regression xác định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không cần key thật
  - Nên nhanh và ổn định
  - Kiểm thử resolver và public-surface loader phải chứng minh hành vi fallback rộng của `api.js` và
    `runtime-api.js` bằng fixture plugin nhỏ được tạo sinh, không dùng
    API nguồn của plugin bundled thật. Việc tải API plugin thật thuộc về
    các bộ contract/integration do plugin sở hữu.

<AccordionGroup>
  <Accordion title="Project, shard, và lane theo phạm vi">

    - `pnpm test` không chỉ định mục tiêu chạy mười hai cấu hình shard nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình root-project native khổng lồ. Điều này giảm RSS đỉnh trên máy tải cao và tránh việc auto-reply/extension làm đói các bộ không liên quan.
    - `pnpm test --watch` vẫn dùng đồ thị project `vitest.config.ts` root native, vì vòng lặp watch nhiều shard là không thực tế.
    - `pnpm test`, `pnpm test:watch`, và `pnpm test:perf:imports` định tuyến các mục tiêu tệp/thư mục rõ ràng qua các lane theo phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả chi phí khởi động toàn bộ root project.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các lane theo phạm vi rẻ: chỉnh sửa trực tiếp test, tệp `*.test.ts` anh em, ánh xạ nguồn rõ ràng, và dependent trong import-graph cục bộ. Chỉnh sửa config/setup/package không chạy test rộng trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh bình thường cho công việc hẹp. Nó phân loại diff thành core, test core, extensions, test extension, apps, docs, metadata release, tooling Docker live, và tooling, rồi chạy các lệnh typecheck, lint, và guard tương ứng. Nó không chạy kiểm thử Vitest; gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các lần bump phiên bản chỉ metadata release chạy kiểm tra phiên bản/cấu hình/root-dependency có mục tiêu, kèm guard từ chối thay đổi package ngoài trường phiên bản cấp cao nhất.
    - Chỉnh sửa harness Docker ACP live chạy kiểm tra tập trung: cú pháp shell cho các script xác thực Docker live và dry-run scheduler Docker live. Thay đổi `package.json` chỉ được bao gồm khi diff giới hạn ở `scripts["test:docker:live-*"]`; chỉnh sửa dependency, export, version, và bề mặt package khác vẫn dùng các guard rộng hơn.
    - Kiểm thử unit nhẹ về import từ agents, commands, plugins, helper auto-reply, `plugin-sdk`, và các vùng tiện ích thuần tương tự được định tuyến qua lane `unit-fast`, lane này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp nặng về trạng thái/runtime vẫn ở các lane hiện có.
    - Một số tệp nguồn helper `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy changed-mode tới các test anh em rõ ràng trong các lane nhẹ đó, nên chỉnh sửa helper tránh chạy lại toàn bộ bộ nặng cho thư mục đó.
    - `auto-reply` có các bucket chuyên dụng cho helper core cấp cao nhất, kiểm thử integration `reply.*` cấp cao nhất, và cây con `src/auto-reply/reply/**`. CI còn chia cây con reply thành các shard agent-runner, dispatch, và commands/state-routing để một bucket nặng về import không sở hữu toàn bộ phần đuôi Node.
    - CI PR/main bình thường cố ý bỏ qua sweep batch extension và shard chỉ dành cho release `agentic-plugins`. Full Release Validation dispatch workflow con `Plugin Prerelease` riêng cho các bộ nặng về plugin/extension đó trên release candidate.

  </Accordion>

  <Accordion title="Phạm vi runner nhúng">

    - Khi bạn thay đổi input khám phá message-tool hoặc ngữ cảnh runtime
      compaction, hãy giữ cả hai tầng coverage.
    - Thêm regression helper tập trung cho các ranh giới định tuyến và chuẩn hóa
      thuần.
    - Giữ các bộ integration runner nhúng khỏe mạnh:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ đó xác minh rằng scoped id và hành vi compaction vẫn đi qua
      các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ helper
      không đủ thay thế cho các đường dẫn integration đó.

  </Accordion>

  <Accordion title="Mặc định pool và isolation của Vitest">

    - Cấu hình Vitest cơ sở mặc định là `threads`.
    - Cấu hình Vitest dùng chung cố định `isolate: false` và dùng
      runner không cô lập trên các root project, e2e, và cấu hình live.
    - Lane UI root giữ setup `jsdom` và optimizer của nó, nhưng cũng chạy trên
      runner không cô lập dùng chung.
    - Mỗi shard `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false`
      từ cấu hình Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình Node
      con của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8
      nguyên bản.

  </Accordion>

  <Accordion title="Lặp cục bộ nhanh">

    - `pnpm changed:lanes` hiển thị diff kích hoạt các lane kiến trúc nào.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck, hay test.
    - Chạy `pnpm check:changed` rõ ràng trước khi bàn giao hoặc push khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các lane theo phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      quyết định một chỉnh sửa harness, config, package, hoặc contract thật sự cần
      coverage Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ nguyên hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động điều chỉnh worker cục bộ cố ý thận trọng và giảm tải
      khi load average của host đã cao, nên mặc định nhiều lần chạy
      Vitest đồng thời gây ít thiệt hại hơn.
    - Cấu hình Vitest cơ sở đánh dấu các project/tệp cấu hình là
      `forceRerunTriggers` để rerun changed-mode vẫn đúng khi dây nối test
      thay đổi.
    - Cấu hình giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` bật trên các host được hỗ trợ;
      đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache rõ ràng cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Gỡ lỗi hiệu năng">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cùng
      đầu ra phân rã import.
    - `pnpm test:perf:imports:changed` giới hạn cùng góc nhìn profiling đó vào
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian shard được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn cấu hình dùng đường dẫn cấu hình làm key; shard CI
      theo include-pattern nối thêm tên shard để shard đã lọc có thể được theo dõi
      riêng.
    - Khi một hot test vẫn tốn phần lớn thời gian ở import khởi động,
      hãy giữ dependency nặng sau seam cục bộ hẹp `*.runtime.ts` và
      mock trực tiếp seam đó thay vì deep-import helper runtime chỉ
      để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn root-project native cho diff
      đã commit đó và in wall time cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây hiện tại
      đang bẩn bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và cấu hình Vitest root.
    - `pnpm test:perf:profile:main` ghi profile CPU main-thread cho
      overhead khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi profile CPU+heap của runner cho
      bộ unit với parallelism theo tệp bị tắt.

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- Lệnh: `pnpm test:stability:gateway`
- Cấu hình: `vitest.gateway.config.ts`, bị ép dùng một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với diagnostics mặc định được bật
  - Đẩy churn message gateway, memory, và large-payload tổng hợp qua đường dẫn sự kiện diagnostic
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ helper lưu bền bundle ổn định diagnostic
  - Khẳng định recorder vẫn được giới hạn, mẫu RSS tổng hợp nằm dưới ngân sách áp lực, và độ sâu hàng đợi theo phiên thoát về 0
- Kỳ vọng:
  - An toàn cho CI và không cần key
  - Lane hẹp cho theo dõi stability-regression, không phải thay thế cho toàn bộ bộ Gateway

### E2E (gateway smoke)

- Lệnh: `pnpm test:e2e`
- Cấu hình: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và các kiểm thử E2E Plugin đóng gói kèm trong `extensions/`
- Mặc định lúc chạy:
  - Dùng Vitest `threads` với `isolate: false`, khớp với phần còn lại của repo.
  - Dùng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ im lặng để giảm chi phí I/O trên console.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để ép số lượng worker (giới hạn tối đa 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra console chi tiết.
- Phạm vi:
  - Hành vi end-to-end của gateway nhiều instance
  - Các bề mặt WebSocket/HTTP, ghép đôi node, và mạng nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không cần khóa thật
  - Nhiều phần chuyển động hơn kiểm thử đơn vị (có thể chậm hơn)

### E2E: kiểm thử smoke backend OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Khởi động một gateway OpenShell cô lập trên host qua Docker
  - Tạo sandbox từ một Dockerfile cục bộ tạm thời
  - Thực thi backend OpenShell của OpenClaw qua `sandbox ssh-config` thật + exec SSH
  - Xác minh hành vi hệ thống tệp remote-canonical thông qua cầu nối fs của sandbox
- Kỳ vọng:
  - Chỉ chạy khi chủ động bật; không thuộc lượt chạy `pnpm test:e2e` mặc định
  - Cần CLI `openshell` cục bộ cùng một Docker daemon hoạt động
  - Dùng `HOME` / `XDG_CONFIG_HOME` cô lập, rồi hủy gateway kiểm thử và sandbox
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới binary CLI hoặc script wrapper không mặc định

### Live (provider thật + model thật)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các kiểm thử live Plugin đóng gói kèm trong `extensions/`
- Mặc định: được `pnpm test:live` **bật** (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - “Provider/model này có thực sự hoạt động _hôm nay_ với thông tin xác thực thật không?”
  - Bắt các thay đổi định dạng provider, điểm lạ khi gọi tool, vấn đề xác thực, và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế không ổn định cho CI (mạng thật, chính sách provider thật, hạn ngạch, sự cố)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con đã thu hẹp thay vì “mọi thứ”
- Các lượt chạy live source `~/.profile` để lấy các khóa API còn thiếu.
- Theo mặc định, các lượt chạy live vẫn cô lập `HOME` và sao chép vật liệu cấu hình/xác thực vào home kiểm thử tạm thời để fixture đơn vị không thể sửa `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn chủ ý cần kiểm thử live dùng thư mục home thật của mình.
- `pnpm test:live` hiện mặc định sang chế độ yên tĩnh hơn: giữ đầu ra tiến trình `[live] ...`, nhưng chặn thông báo `~/.profile` bổ sung và tắt log bootstrap gateway/tiếng ồn Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn lấy lại toàn bộ log khởi động.
- Xoay vòng khóa API (theo provider): đặt `*_API_KEYS` với định dạng dấu phẩy/chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè theo từng live qua `OPENCLAW_LIVE_*_KEY`; kiểm thử sẽ thử lại khi có phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ live hiện phát dòng tiến trình ra stderr để các lệnh gọi provider dài vẫn hiển thị là đang hoạt động ngay cả khi Vitest console capture yên tĩnh.
  - `vitest.live.config.ts` tắt chặn console của Vitest để các dòng tiến trình provider/gateway được stream ngay trong lúc chạy live.
  - Điều chỉnh heartbeat model trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Điều chỉnh heartbeat gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ nào?

Dùng bảng quyết định này:

- Sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn đã thay đổi nhiều)
- Chạm tới mạng gateway / giao thức WS / ghép đôi: thêm `pnpm test:e2e`
- Gỡ lỗi “bot của tôi đang down” / lỗi theo provider / gọi tool: chạy `pnpm test:live` đã thu hẹp

## Kiểm thử live (chạm mạng)

Đối với ma trận model live, smoke backend CLI, smoke ACP, harness app-server
Codex, và tất cả kiểm thử live của media-provider (Deepgram, BytePlus, ComfyUI, hình ảnh,
nhạc, video, media harness) — cùng xử lý thông tin xác thực cho các lượt chạy live — xem
[Kiểm thử các bộ live](/vi/help/testing-live). Đối với danh sách kiểm tra chuyên biệt cho cập nhật và
xác thực Plugin, xem
[Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Runner Docker (kiểm tra tùy chọn "hoạt động trên Linux")

Các runner Docker này chia thành hai nhóm:

- Runner model live: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp live profile-key tương ứng trong image Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), mount thư mục cấu hình cục bộ và workspace của bạn (và source `~/.profile` nếu đã mount). Các entrypoint cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Runner live Docker mặc định dùng giới hạn smoke nhỏ hơn để một lượt quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các biến môi trường đó khi bạn
  chủ ý muốn lượt quét lớn hơn, toàn diện hơn.
- `test:docker:all` build image Docker live một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần dưới dạng tarball npm thông qua `scripts/package-openclaw-for-docker.mjs`, rồi build/tái sử dụng hai image `scripts/e2e/Dockerfile`. Image trần chỉ là runner Node/Git cho các lane cài đặt/cập nhật/phụ thuộc Plugin; các lane đó mount tarball đã build sẵn. Image chức năng cài cùng tarball đó vào `/app` cho các lane chức năng ứng dụng đã build. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Phần tổng hợp dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` kiểm soát slot tiến trình, trong khi các giới hạn tài nguyên ngăn lane live nặng, npm-install, và nhiều dịch vụ cùng khởi động một lúc. Nếu một lane đơn lẻ nặng hơn các giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động lane đó khi pool trống rồi giữ lane chạy một mình cho đến khi có lại dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ tinh chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi host Docker có thêm dư địa. Runner mặc định thực hiện preflight Docker, xóa container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời lượng lane thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời lượng đó để bắt đầu lane dài hơn trước trong các lượt chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane có trọng số mà không build hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các lane đã chọn, nhu cầu package/image, và thông tin xác thực.
- `Package Acceptance` là gate package gốc GitHub cho câu hỏi "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một package ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải lên dưới tên `package-under-test`, rồi chạy các lane Docker E2E tái sử dụng với đúng tarball đó thay vì đóng gói lại ref đã chọn. Profile được sắp theo độ rộng: `smoke`, `package`, `product`, và `full`. Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng package/cập nhật/Plugin, ma trận sống sót sau nâng cấp đã phát hành, mặc định phát hành, và phân loại lỗi.
- Kiểm tra build và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Guard duyệt đồ thị build tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và thất bại nếu phần khởi động trước dispatch import các phụ thuộc package như Commander, prompt UI, undici, hoặc logging trước khi dispatch lệnh; nó cũng giữ chunk chạy gateway đóng gói dưới ngân sách và từ chối static import của các đường dẫn gateway nguội đã biết. Smoke CLI đã đóng gói cũng bao phủ root help, onboard help, doctor help, status, schema cấu hình, và một lệnh liệt kê model.
- Tương thích legacy của Package Acceptance bị giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Qua mốc đó, harness chỉ dung thứ các khoảng trống metadata package đã phát hành: các mục kho QA private bị lược bỏ, thiếu `gateway install --wrapper`, thiếu tệp patch trong fixture git sinh từ tarball, thiếu `update.channel` đã lưu, vị trí install-record Plugin legacy, thiếu lưu install-record marketplace, và di trú metadata cấu hình trong lúc `plugins update`. Với package sau `2026.4.25`, các đường dẫn đó là lỗi nghiêm ngặt.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.

Các runner Docker model live cũng chỉ bind-mount các home xác thực CLI cần thiết (hoặc tất cả các home được hỗ trợ khi lượt chạy không được thu hẹp), rồi sao chép chúng vào home container trước khi chạy để OAuth của CLI bên ngoài có thể làm mới token mà không sửa kho xác thực trên host:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (tập lệnh: `scripts/test-live-models-docker.sh`)
- Kiểm thử smoke liên kết ACP: `pnpm test:docker:live-acp-bind` (tập lệnh: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với phạm vi bao phủ Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử smoke backend CLI: `pnpm test:docker:live-cli-backend` (tập lệnh: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử smoke bộ khai thác app-server Codex: `pnpm test:docker:live-codex-harness` (tập lệnh: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + tác nhân dev: `pnpm test:docker:live-gateway` (tập lệnh: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử smoke khả năng quan sát: `pnpm qa:otel:smoke` là một làn kiểm tra source-checkout QA riêng tư. Làn này cố ý không thuộc các làn phát hành Docker của gói vì tarball npm bỏ qua QA Lab.
- Kiểm thử smoke trực tiếp Open WebUI: `pnpm test:docker:openwebui` (tập lệnh: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, scaffolding đầy đủ): `pnpm test:docker:onboard` (tập lệnh: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử smoke onboarding/kênh/tác nhân bằng tarball Npm: `pnpm test:docker:npm-onboard-channel-agent` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, cấu hình OpenAI qua onboarding env-ref cộng với Telegram theo mặc định, chạy doctor, rồi chạy một lượt tác nhân OpenAI được mô phỏng. Tái sử dụng tarball dựng sẵn bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bản dựng host bằng `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc chuyển kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Kiểm thử smoke chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, chuyển từ gói `stable` sang git `dev`, xác minh kênh đã lưu và plugin sau cập nhật hoạt động, rồi chuyển lại về gói `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử smoke khả năng sống sót sau nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt tarball OpenClaw đã đóng gói lên một fixture người dùng cũ bị bẩn có tác nhân, cấu hình kênh, danh sách cho phép plugin, trạng thái phụ thuộc plugin cũ, và các tệp workspace/session hiện có. Lệnh chạy cập nhật gói cộng với doctor không tương tác mà không cần khóa provider hoặc kênh trực tiếp, sau đó khởi động Gateway loopback và kiểm tra việc giữ nguyên cấu hình/trạng thái cùng ngân sách khởi động/trạng thái.
- Kiểm thử smoke khả năng sống sót sau nâng cấp bản đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, gieo các tệp người dùng hiện có thực tế, cấu hình baseline đó bằng công thức lệnh được nhúng sẵn, xác thực cấu hình thu được, cập nhật bản cài đặt đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động Gateway loopback và kiểm tra các intent đã cấu hình, việc giữ nguyên trạng thái, khởi động, `/healthz`, `/readyz`, và ngân sách trạng thái RPC. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các baseline chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `all-since-2026.4.23`, và mở rộng các fixture dạng issue bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; tập reported-issues bao gồm `configured-plugin-installs` để tự động sửa cài đặt Plugin OpenClaw bên ngoài. Package Acceptance hiển thị các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, và `published_upgrade_survivor_scenarios`.
- Kiểm thử smoke ngữ cảnh runtime session: `pnpm test:docker:session-runtime-context` xác minh việc lưu bền transcript ngữ cảnh runtime ẩn cùng với sửa chữa doctor cho các nhánh prompt-rewrite bị trùng lặp bị ảnh hưởng.
- Kiểm thử smoke cài đặt toàn cục Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một home cô lập, và xác minh `openclaw infer image providers --json` trả về các provider hình ảnh đi kèm thay vì treo. Tái sử dụng tarball dựng sẵn bằng `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bản dựng host bằng `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một image Docker đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử smoke Docker trình cài đặt: `bash scripts/test-install-sh-docker.sh` chia sẻ một cache npm giữa các container root, update và direct-npm của nó. Kiểm thử smoke cập nhật mặc định dùng npm `latest` làm baseline stable trước khi nâng cấp lên tarball ứng viên. Ghi đè bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` khi chạy cục bộ, hoặc bằng input `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ một cache npm cô lập để các mục cache do root sở hữu không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để tái sử dụng cache root/update/direct-npm giữa các lần chạy lại cục bộ.
- Install Smoke CI bỏ qua cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy tập lệnh cục bộ không có env đó khi cần phạm vi bao phủ `npm install -g` trực tiếp.
- Kiểm thử smoke CLI xóa workspace dùng chung của tác nhân: `pnpm test:docker:agents-delete-shared-workspace` (tập lệnh: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng image Dockerfile gốc, gieo hai tác nhân với một workspace trong home container cô lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Tái sử dụng image install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + health): `pnpm test:docker:gateway-network` (tập lệnh: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử smoke snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (tập lệnh: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng image E2E nguồn cộng với một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao phủ URL liên kết, phần tử có thể nhấp được nâng cấp theo con trỏ, tham chiếu iframe và metadata khung.
- Hồi quy reasoning tối thiểu cho OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (tập lệnh: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI được mô phỏng qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, rồi buộc schema provider từ chối và kiểm tra chi tiết thô xuất hiện trong nhật ký Gateway.
- Cầu nối kênh MCP (Gateway đã gieo + cầu nối stdio + kiểm thử smoke notification-frame Claude thô): `pnpm test:docker:mcp-channels` (tập lệnh: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP gói Pi (máy chủ MCP stdio thật + kiểm thử smoke allow/deny hồ sơ Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (tập lệnh: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP Cron/subagent (Gateway thật + tháo dỡ tiến trình con MCP stdio sau các lượt chạy cron cô lập và subagent một lần): `pnpm test:docker:cron-mcp-cleanup` (tập lệnh: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (kiểm thử smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc được hoist, ref git di chuyển, ClawHub kitchen-sink, cập nhật marketplace, và bật/kiểm tra gói Claude): `pnpm test:docker:plugins` (tập lệnh: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp gói/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Khi không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, kiểm thử dùng máy chủ fixture ClawHub cục bộ khép kín.
- Kiểm thử smoke cập nhật Plugin không đổi: `pnpm test:docker:plugin-update` (tập lệnh: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử smoke ma trận vòng đời Plugin: `pnpm test:docker:plugin-lifecycle-matrix` cài đặt tarball OpenClaw đã đóng gói trong một container trống, cài đặt một plugin npm, bật/tắt enable/disable, nâng cấp và hạ cấp plugin đó qua registry npm cục bộ, xóa mã đã cài đặt, rồi xác minh uninstall vẫn xóa trạng thái cũ trong khi ghi nhật ký chỉ số RSS/CPU cho từng pha vòng đời.
- Kiểm thử smoke metadata tải lại cấu hình: `pnpm test:docker:config-reload` (tập lệnh: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` bao phủ kiểm thử smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc được hoist, ref git di chuyển, fixture ClawHub, cập nhật marketplace, và bật/kiểm tra gói Claude. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không đổi cho plugins đã cài đặt. `pnpm test:docker:plugin-lifecycle-matrix` bao phủ cài đặt, bật, tắt, nâng cấp, hạ cấp, và uninstall khi thiếu mã cho plugin npm có theo dõi tài nguyên.

Để dựng sẵn và tái sử dụng image chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image theo từng bộ kiểm thử như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một image dùng chung từ xa, các tập lệnh sẽ pull image đó nếu nó chưa có cục bộ. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi gói/cài đặt thay vì runtime ứng dụng đã dựng dùng chung.

Các trình chạy Docker live-model cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
đưa nó vào một workdir tạm thời bên trong container. Việc này giữ cho image runtime
gọn nhẹ trong khi vẫn chạy Vitest trên đúng nguồn/cấu hình cục bộ của bạn.
Bước staging bỏ qua các cache lớn chỉ dùng cục bộ và đầu ra build ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục đầu ra `.build` cục bộ của ứng dụng hoặc
Gradle để các lượt chạy Docker live không mất nhiều phút sao chép
artifact đặc thù của máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các probe live của Gateway không khởi động
worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền cả
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi live của Gateway
khỏi lane Docker đó.
`test:docker:openwebui` là một smoke tương thích cấp cao hơn: nó khởi động một
container Gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI đã ghim phiên bản trỏ tới Gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` hiển thị `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Lượt chạy đầu tiên có thể chậm hơn đáng kể vì Docker có thể cần kéo image
Open WebUI và Open WebUI có thể cần hoàn tất thiết lập cold-start riêng.
Lane này cần một khóa live model dùng được, và `OPENCLAW_PROFILE_FILE`
(mặc định là `~/.profile`) là cách chính để cung cấp khóa đó trong các lượt chạy Docker hóa.
Các lượt chạy thành công in ra một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính xác định và không cần tài khoản
Telegram, Discord hoặc iMessage thật. Nó khởi động một container Gateway đã seed,
khởi động container thứ hai sinh ra `openclaw mcp serve`, rồi
xác minh việc phát hiện hội thoại đã định tuyến, đọc transcript, metadata tệp đính kèm,
hành vi hàng đợi sự kiện live, định tuyến gửi outbound, và thông báo kiểu Claude về kênh +
quyền qua cầu MCP stdio thật. Kiểm tra thông báo
kiểm tra trực tiếp các frame MCP stdio thô để smoke xác thực những gì
cầu thực sự phát ra, không chỉ những gì một SDK client cụ thể tình cờ hiển thị.
`test:docker:pi-bundle-mcp-tools` có tính xác định và không cần khóa live
model. Nó build image Docker của repo, khởi động một server probe MCP stdio thật
bên trong container, materialize server đó qua runtime MCP của Pi bundle được nhúng,
thực thi tool, rồi xác minh `coding` và `messaging` giữ
tool `bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa live model.
Nó khởi động một Gateway đã seed với một server probe MCP stdio thật, chạy một
lượt cron cô lập và một lượt con one-shot `/subagents spawn`, rồi xác minh
tiến trình con MCP thoát sau mỗi lượt chạy.

Smoke thủ công cho thread ACP bằng ngôn ngữ tự nhiên (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow hồi quy/debug. Nó có thể cần lại cho xác thực định tuyến thread ACP, vì vậy đừng xóa nó.

Các biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được source từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục cấu hình/workspace tạm thời và không mount auth CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các cài đặt CLI được cache bên trong Docker
- Các thư mục/tệp auth CLI bên ngoài dưới `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi test bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lượt chạy provider đã thu hẹp chỉ mount những thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lượt chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc provider trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để tái sử dụng image `openclaw:local-live` hiện có cho các lượt chạy lại không cần rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo credential đến từ kho hồ sơ (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn model do gateway hiển thị cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce dùng bởi smoke Open WebUI
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã ghim

## Kiểm tra tính hợp lệ của tài liệu

Chạy kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra heading trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy offline (an toàn cho CI)

Đây là các hồi quy “pipeline thật” không dùng provider thật:

- Gọi tool qua Gateway (mock OpenAI, Gateway thật + vòng lặp agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, ghi cấu hình + bắt buộc auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval độ tin cậy agent (Skills)

Chúng ta đã có một vài test an toàn cho CI hoạt động giống “eval độ tin cậy agent”:

- Gọi tool mock qua Gateway thật + vòng lặp agent (`src/gateway/gateway.test.ts`).
- Các flow wizard end-to-end xác thực nối dây phiên và hiệu lực cấu hình (`src/gateway/gateway.test.ts`).

Những gì vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi Skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh các skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi dùng và làm theo các bước/đối số bắt buộc không?
- **Hợp đồng workflow:** các kịch bản nhiều lượt khẳng định thứ tự tool, truyền tiếp lịch sử phiên, và ranh giới sandbox.

Các eval trong tương lai trước hết nên giữ tính xác định:

- Một trình chạy kịch bản dùng provider mock để khẳng định các lệnh gọi tool + thứ tự, việc đọc tệp skill, và nối dây phiên.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng so với tránh, gating, prompt injection).
- Eval live tùy chọn (opt-in, được bảo vệ bằng env) chỉ sau khi bộ an toàn cho CI đã sẵn sàng.

## Test hợp đồng (hình dạng Plugin và kênh)

Test hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ
hợp đồng giao diện của nó. Chúng lặp qua tất cả Plugin được phát hiện và chạy một bộ
assertion về hình dạng và hành vi. Lane unit `pnpm test` mặc định cố ý
bỏ qua các tệp smoke và điểm nối dùng chung này; hãy chạy rõ ràng các lệnh hợp đồng
khi bạn chạm vào bề mặt kênh hoặc provider dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng provider: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng Plugin cơ bản (id, tên, capability)
- **setup** - Hợp đồng wizard thiết lập
- **session-binding** - Hành vi liên kết phiên
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn inbound
- **actions** - Handler hành động kênh
- **threading** - Xử lý ID thread
- **directory** - API thư mục/roster
- **group-policy** - Thực thi chính sách nhóm

### Hợp đồng trạng thái provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe trạng thái kênh
- **registry** - Hình dạng registry Plugin

### Hợp đồng provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng flow auth
- **auth-choice** - Lựa chọn/chọn auth
- **catalog** - API catalog model
- **discovery** - Phát hiện Plugin
- **loader** - Tải Plugin
- **runtime** - Runtime provider
- **shape** - Hình dạng/giao diện Plugin
- **wizard** - Wizard thiết lập

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa đổi một Plugin kênh hoặc provider
- Sau khi refactor đăng ký hoặc phát hiện Plugin

Test hợp đồng chạy trong CI và không yêu cầu khóa API thật.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề provider/model được phát hiện trong live:

- Thêm hồi quy an toàn cho CI nếu có thể (provider mock/stub, hoặc capture phép biến đổi chính xác của request-shape)
- Nếu bản chất của nó chỉ có thể live (rate limit, chính sách auth), giữ test live hẹp và opt-in qua biến môi trường
- Ưu tiên nhắm tới lớp nhỏ nhất bắt được bug:
  - bug chuyển đổi/phát lại yêu cầu provider → test models trực tiếp
  - bug pipeline phiên/lịch sử/tool của Gateway → smoke live Gateway hoặc test mock Gateway an toàn cho CI
- Guardrail duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một target được lấy mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi khẳng định các exec id có segment duyệt bị từ chối.
  - Nếu bạn thêm một họ target SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong test đó. Test cố ý thất bại trên các target id chưa phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Testing live](/vi/help/testing-live)
- [Testing updates and plugins](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
