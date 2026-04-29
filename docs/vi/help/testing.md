---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm kiểm thử hồi quy cho lỗi của mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của Gateway + tác tử
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử đơn vị/e2e/live, trình chạy Docker và phạm vi bao quát của từng bài kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-04-29T22:49:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (unit/integration, e2e, live) và một nhóm nhỏ
các runner Docker. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ kiểm thử bao phủ những gì (và những gì nó cố ý _không_ bao phủ).
- Những lệnh cần chạy cho các quy trình phổ biến (cục bộ, trước khi push, gỡ lỗi).
- Cách các kiểm thử live phát hiện thông tin xác thực và chọn mô hình/nhà cung cấp.
- Cách thêm hồi quy cho các vấn đề mô hình/nhà cung cấp trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các lane truyền tải live)** được ghi lại riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) — kiến trúc, bề mặt lệnh, biên soạn kịch bản.
- [Matrix QA](/vi/concepts/qa-matrix) — tài liệu tham chiếu cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) — Plugin truyền tải tổng hợp được dùng bởi các kịch bản dựa trên repo.

Trang này bao quát việc chạy các bộ kiểm thử thông thường và các runner Docker/Parallels. Phần runner dành riêng cho QA bên dưới ([Runner dành riêng cho QA](#qa-specific-runners)) liệt kê các lệnh gọi `qa` cụ thể và trỏ lại các tài liệu tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng kiểm tra đầy đủ (được kỳ vọng trước khi push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy có nhiều tài nguyên: `pnpm test:max`
- Vòng lặp watch Vitest trực tiếp: `pnpm test:watch`
- Nhắm mục tiêu trực tiếp theo tệp hiện cũng định tuyến các đường dẫn extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên chạy có nhắm mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Site QA dựa trên Docker: `pnpm qa:lab:up`
- Lane QA dựa trên VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng coverage: `pnpm test:coverage`
- Bộ E2E: `pnpm test:e2e`

Khi gỡ lỗi nhà cung cấp/mô hình thật (yêu cầu thông tin xác thực thật):

- Bộ live (mô hình + probe công cụ/hình ảnh Gateway): `pnpm test:live`
- Nhắm vào một tệp live một cách im lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Quét mô hình live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi mô hình được chọn hiện chạy một lượt văn bản cộng với một probe nhỏ kiểu đọc tệp.
    Các mô hình có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các probe bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi nhà cung cấp.
  - Coverage CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận mô hình live Docker riêng
    được chia shard theo nhà cung cấp.
  - Với các lần chạy lại CI có trọng tâm, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm các secret nhà cung cấp có tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng với `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các
    caller theo lịch/phát hành của nó.
- Smoke trò chuyện bound-chat Codex native: `pnpm test:docker:live-codex-bind`
  - Chạy một lane live Docker trên đường dẫn app-server Codex, bind một Slack DM
    tổng hợp bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi thuần và một tệp đính kèm hình ảnh
    định tuyến qua binding Plugin native thay vì ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt agent Gateway qua harness app-server Codex do Plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và mặc định thực thi các probe hình ảnh,
    cron MCP, sub-agent, và Guardian. Tắt probe sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi app-server Codex khác.
    Với một kiểm tra sub-agent có trọng tâm, tắt các probe khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Lệnh này thoát sau probe sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Smoke lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra opt-in nhiều lớp cho bề mặt lệnh cứu hộ kênh tin nhắn.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi mô hình bền vững,
    trả lời `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong container không có config với một Claude CLI giả trên `PATH`
    và xác minh fallback planner mờ được chuyển thành một ghi config có kiểu đã được audit.
- Smoke Docker lần chạy đầu của Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, định tuyến `openclaw` trần tới
    Crestodian, áp dụng thiết lập/mô hình/agent/Plugin Discord + ghi SecretRef,
    xác thực config, và xác minh các mục audit. Cùng đường dẫn thiết lập Ring 0 cũng
    được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  cô lập trên `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và transcript
  assistant lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một trường hợp lỗi, hãy ưu tiên thu hẹp kiểm thử live qua các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Runner dành riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần độ thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. `Parity gate` chạy trên các PR khớp và
từ dispatch thủ công với nhà cung cấp mock. `QA-Lab - All Lanes` chạy hằng đêm trên
`main` và từ dispatch thủ công với mock parity gate, lane Matrix live,
lane Telegram live do Convex quản lý, và lane Discord live do Convex quản lý dưới dạng
các job song song. QA theo lịch và kiểm tra phát hành truyền Matrix `--profile fast`
một cách rõ ràng, trong khi mặc định của Matrix CLI và đầu vào workflow thủ công vẫn là
`all`; dispatch thủ công có thể chia shard `all` thành các job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, và `e2ee-cli`. `OpenClaw Release Checks` chạy parity cộng với
các lane Matrix nhanh và Telegram trước phê duyệt phát hành, dùng
`mock-openai/gpt-5.5` cho các kiểm tra truyền tải phát hành để chúng vẫn xác định được
và tránh khởi động provider-plugin thông thường. Các Gateway truyền tải live này tắt
tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ parity QA.

Các shard media live phát hành đầy đủ dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard mô hình/backend live Docker dùng image dùng chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi commit được chọn,
sau đó pull nó với `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì build lại trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy trực tiếp các kịch bản QA dựa trên repo trên host.
  - Chạy nhiều kịch bản được chọn song song theo mặc định với các worker Gateway cô lập.
    `qa-channel` mặc định concurrency là 4 (bị giới hạn bởi số lượng kịch bản được chọn).
    Dùng `--concurrency <count>` để tinh chỉnh số worker, hoặc `--concurrency 1` cho lane tuần tự cũ hơn.
  - Thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn artifact mà không có mã thoát thất bại.
  - Hỗ trợ các chế độ nhà cung cấp `live-frontier`, `mock-openai`, và `aimock`.
    `aimock` khởi động một server nhà cung cấp cục bộ dựa trên AIMock cho coverage fixture
    thử nghiệm và protocol-mock mà không thay thế lane `mock-openai` có nhận biết kịch bản.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy bench khởi động Gateway cộng với một gói kịch bản QA Lab mock nhỏ
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi một tóm tắt quan sát CPU kết hợp
    dưới `.artifacts/gateway-cpu-scenarios/`.
  - Mặc định chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cộng với `--hot-wall-warn-ms`), nên các đợt tăng ngắn khi khởi động được ghi lại như metric
    mà không trông giống hồi quy Gateway peg kéo dài nhiều phút.
  - Dùng artifact `dist` đã build; chạy build trước khi checkout chưa có output runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA bên trong một VM Linux Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên host.
  - Tái sử dụng cùng các flag chọn nhà cung cấp/mô hình như `qa suite`.
  - Các lần chạy live chuyển tiếp các đầu vào auth QA được hỗ trợ và thực tế cho guest:
    key nhà cung cấp dựa trên env, đường dẫn config nhà cung cấp live QA, và `CODEX_HOME`
    khi có.
  - Các thư mục output phải nằm dưới root repo để guest có thể ghi ngược qua
    workspace được mount.
  - Ghi báo cáo + tóm tắt QA thông thường cộng với log Multipass dưới
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA dựa trên Docker cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build tarball npm từ checkout hiện tại, cài đặt nó toàn cục trong
    Docker, chạy onboarding OpenAI API-key không tương tác, cấu hình Telegram
    theo mặc định, xác minh việc bật Plugin cài đặt dependency runtime theo
    nhu cầu, chạy doctor, và chạy một lượt agent cục bộ trên endpoint OpenAI mock.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane cài đặt package
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy smoke Docker app đã build xác định cho transcript ngữ cảnh runtime nhúng.
    Nó xác minh ngữ cảnh runtime OpenClaw ẩn được lưu bền vững dưới dạng message tùy chỉnh
    không hiển thị thay vì rò rỉ vào lượt người dùng hiển thị, rồi seed một JSONL phiên hỏng
    bị ảnh hưởng và xác minh `openclaw doctor --fix` ghi lại nó sang nhánh đang hoạt động kèm backup.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên package OpenClaw trong Docker, chạy onboarding package đã cài,
    cấu hình Telegram qua CLI đã cài, rồi tái sử dụng lane QA Telegram live với package đã cài
    đó làm SUT Gateway.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã phân giải thay vì
    cài từ registry.
  - Dùng cùng thông tin xác thực env Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/phát hành, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cộng với
    `OPENCLAW_QA_CONVEX_SITE_URL` và role secret. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một Convex role secret có trong CI,
    wrapper Docker tự động chọn Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này.
  - GitHub Actions hiển thị lane này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và các lease thông tin xác thực CI Convex.
- GitHub Actions cũng hiển thị `Package Acceptance` để proof sản phẩm chạy bên cạnh
  trên một package ứng viên. Nó chấp nhận ref tin cậy, spec npm đã publish,
  URL tarball HTTPS cộng với SHA-256, hoặc artifact tarball từ lần chạy khác, upload
  `openclaw-current.tgz` đã chuẩn hóa dưới dạng `package-under-test`, rồi chạy scheduler
  Docker E2E hiện có với các profile lane smoke, package, product, full, hoặc custom.
  Đặt `telegram_mode=mock-openai` hoặc `live-frontier` để chạy workflow QA Telegram
  trên cùng artifact `package-under-test`.
  - Proof sản phẩm beta mới nhất:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Proof URL tarball chính xác yêu cầu digest:

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

- `pnpm test:docker:bundled-channel-deps`
  - Đóng gói và cài đặt bản dựng OpenClaw hiện tại trong Docker, khởi động Gateway
    với OpenAI đã được cấu hình, rồi bật các kênh/Plugin được đóng gói kèm thông qua các chỉnh sửa cấu hình.
  - Xác minh rằng quá trình phát hiện thiết lập để trống các phụ thuộc runtime Plugin chưa cấu hình,
    lần chạy Gateway hoặc doctor đầu tiên đã cấu hình sẽ cài đặt phụ thuộc runtime của từng Plugin được đóng gói kèm
    theo nhu cầu, và lần khởi động lại thứ hai không cài đặt lại các phụ thuộc đã được kích hoạt.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh rằng doctor sau cập nhật của candidate
    sửa các phụ thuộc runtime của kênh được đóng gói kèm mà không cần sửa chữa postinstall từ phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật cài đặt gói native trên các guest Parallels. Mỗi
    nền tảng được chọn trước tiên cài đặt gói baseline được yêu cầu, sau đó chạy
    lệnh `openclaw update` đã cài đặt trong cùng guest và xác minh
    phiên bản đã cài đặt, trạng thái cập nhật, mức sẵn sàng của gateway, và một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` trong khi
    lặp trên một guest. Dùng `--json` để lấy đường dẫn artifact tóm tắt và
    trạng thái theo từng lane.
  - Lane OpenAI dùng `openai/gpt-5.5` theo mặc định cho bằng chứng lượt agent trực tiếp.
    Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi chủ đích xác thực một
    mô hình OpenAI khác.
  - Bọc các lần chạy cục bộ dài trong timeout của host để các lần treo vận chuyển Parallels không
    tiêu tốn phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi các log lane lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi cho rằng wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong quá trình sửa doctor/runtime
    dependency sau cập nhật trên một guest lạnh; điều đó vẫn bình thường khi log debug
    npm lồng nhau vẫn đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với các lane smoke Parallels
    macOS, Windows, hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể xung đột khi
    khôi phục snapshot, phục vụ gói, hoặc trạng thái gateway của guest.
  - Bằng chứng sau cập nhật chạy bề mặt Plugin được đóng gói kèm thông thường vì
    các facade capability như giọng nói, tạo ảnh, và hiểu media
    được tải qua các API runtime được đóng gói kèm ngay cả khi chính lượt agent
    chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ provider AIMock cục bộ để kiểm thử smoke giao thức trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy lane QA trực tiếp Matrix trên một homeserver Tuwunel tạm thời dựa trên Docker. Chỉ source-checkout — các bản cài đặt đóng gói không phát hành `qa-lab`.
  - CLI đầy đủ, danh mục profile/scenario, biến môi trường, và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy lane QA trực tiếp Telegram trên một nhóm riêng tư thật bằng token bot driver và SUT từ env.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id nhóm phải là id chat Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực dùng chung trong pool. Dùng chế độ env theo mặc định, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng lease từ pool.
  - Thoát với mã khác không khi bất kỳ scenario nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng nhóm riêng tư, với bot SUT công khai username Telegram.
  - Để quan sát bot-với-bot ổn định, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và bảo đảm bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, tóm tắt, và artifact observed-messages dưới `.artifacts/qa-e2e/...`. Các scenario trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT được quan sát.

Các lane vận chuyển trực tiếp dùng chung một hợp đồng tiêu chuẩn để các vận chuyển mới không lệch hướng; ma trận coverage theo từng lane nằm trong [tổng quan QA → Coverage vận chuyển trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ tổng hợp synthetic rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi bật `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) cho
`openclaw qa telegram`, QA lab lấy một lease độc quyền từ pool dựa trên Convex, gửi heartbeats
cho lease đó trong khi lane đang chạy, và giải phóng lease khi tắt.

Scaffold dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Biến môi trường bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho vai trò được chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn vai trò thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định env: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, nếu không là `maintainer`)

Biến môi trường tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` loopback chỉ dành cho phát triển cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong vận hành bình thường.

Các lệnh admin của maintainer (thêm/xóa/liệt kê pool) yêu cầu cụ thể
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helper cho maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lần chạy trực tiếp để kiểm tra URL site Convex, secret broker,
tiền tố endpoint, timeout HTTP, và khả năng truy cập admin/list mà không in
giá trị secret. Dùng `--json` cho đầu ra máy đọc được trong script và tiện ích CI.

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
- `POST /admin/add` (chỉ secret maintainer)
  - Yêu cầu: `{ kind, actorId, payload, note?, status? }`
  - Thành công: `{ status: "ok", credential }`
- `POST /admin/remove` (chỉ secret maintainer)
  - Yêu cầu: `{ credentialId, actorId }`
  - Thành công: `{ status: "ok", changed, credential }`
  - Bộ chặn lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ secret maintainer)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Dạng payload cho kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi id chat Telegram dạng số.
- `admin/add` xác thực dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

### Thêm một kênh vào QA

Kiến trúc và tên scenario-helper cho adapter kênh mới nằm trong [tổng quan QA → Thêm một kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai transport runner trên seam host `qa-lab` dùng chung, khai báo `qaRunners` trong manifest Plugin, mount dưới dạng `openclaw qa <runner>`, và viết scenario dưới `qa/scenarios/`.

## Bộ kiểm thử (chạy ở đâu)

Hãy xem các bộ này như “mức độ thực tế tăng dần” (đồng thời độ bất ổn/chi phí cũng tăng):

### Unit / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng bộ shard `vitest.full-*.config.ts` và có thể mở rộng shard nhiều dự án thành cấu hình theo từng dự án để lập lịch song song
- Tệp: inventory core/unit dưới `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử unit UI chạy trong shard chuyên dụng `unit-ui`
- Phạm vi:
  - Kiểm thử unit thuần túy
  - Kiểm thử tích hợp trong tiến trình (xác thực gateway, định tuyến, tooling, phân tích cú pháp, cấu hình)
  - Hồi quy tất định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không yêu cầu khóa thật
  - Nên nhanh và ổn định
  - Các kiểm thử resolver và loader bề mặt công khai phải chứng minh hành vi fallback rộng của `api.js` và
    `runtime-api.js` bằng các fixture Plugin nhỏ được tạo ra, không phải
    API nguồn Plugin được đóng gói kèm thật. Việc tải API Plugin thật thuộc về
    các bộ contract/tích hợp do Plugin sở hữu.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` không nhắm mục tiêu chạy mười hai cấu hình phân mảnh nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình dự án gốc native khổng lồ. Điều này giảm RSS đỉnh trên các máy đang tải nặng và tránh việc auto-reply/extension làm đói tài nguyên của các bộ kiểm thử không liên quan.
    - `pnpm test --watch` vẫn dùng đồ thị dự án gốc native `vitest.config.ts`, vì vòng lặp watch nhiều phân mảnh không thực tế.
    - `pnpm test`, `pnpm test:watch`, và `pnpm test:perf:imports` định tuyến các mục tiêu tệp/thư mục rõ ràng qua các lane theo phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả chi phí khởi động đầy đủ của dự án gốc.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các lane theo phạm vi chi phí thấp: chỉnh sửa trực tiếp tệp kiểm thử, các tệp `*.test.ts` cùng cấp, ánh xạ mã nguồn rõ ràng, và các phụ thuộc đồ thị import cục bộ. Các chỉnh sửa config/setup/package không chạy rộng các kiểm thử trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường cho công việc phạm vi hẹp. Nó phân loại diff thành core, kiểm thử core, extensions, kiểm thử extension, apps, docs, siêu dữ liệu phát hành, công cụ Docker live, và tooling, rồi chạy các lệnh typecheck, lint, và guard tương ứng. Nó không chạy kiểm thử Vitest; hãy gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các lần tăng phiên bản chỉ gồm siêu dữ liệu phát hành chạy kiểm tra phiên bản/config/phụ thuộc gốc có mục tiêu, với một guard từ chối thay đổi package bên ngoài trường phiên bản cấp cao nhất.
    - Các chỉnh sửa harness Docker ACP live chạy kiểm tra tập trung: cú pháp shell cho các script xác thực Docker live và một lần chạy thử không thực thi của bộ lập lịch Docker live. Thay đổi `package.json` chỉ được đưa vào khi diff giới hạn ở `scripts["test:docker:live-*"]`; các chỉnh sửa về dependency, export, version, và bề mặt package khác vẫn dùng các guard rộng hơn.
    - Các kiểm thử đơn vị nhẹ import từ agents, commands, plugins, helper auto-reply, `plugin-sdk`, và các vùng tiện ích thuần tương tự định tuyến qua lane `unit-fast`, lane này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng về runtime vẫn ở các lane hiện có.
    - Một số tệp mã nguồn helper `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy changed-mode tới các kiểm thử cùng cấp rõ ràng trong những lane nhẹ đó, nên chỉnh sửa helper tránh chạy lại toàn bộ bộ kiểm thử nặng cho thư mục đó.
    - `auto-reply` có các bucket chuyên dụng cho helper core cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất, và cây con `src/auto-reply/reply/**`. CI tiếp tục tách cây con reply thành các phân mảnh agent-runner, dispatch, và commands/state-routing để một bucket nặng import không chiếm toàn bộ phần đuôi Node.
    - CI PR/main thông thường cố ý bỏ qua lượt quét hàng loạt extension và phân mảnh `agentic-plugins` chỉ dành cho phát hành. Full Release Validation điều phối workflow con `Plugin Prerelease` riêng cho các bộ kiểm thử nặng về plugin/extension đó trên các ứng viên phát hành.

  </Accordion>

  <Accordion title="Phạm vi kiểm thử runner nhúng">

    - Khi bạn thay đổi đầu vào khám phá công cụ tin nhắn hoặc ngữ cảnh runtime compaction, hãy giữ cả hai cấp độ phạm vi kiểm thử.
    - Thêm các hồi quy helper tập trung cho các ranh giới định tuyến và chuẩn hóa thuần.
    - Giữ cho các bộ kiểm thử tích hợp runner nhúng hoạt động tốt:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ này xác minh rằng id theo phạm vi và hành vi compaction vẫn đi qua các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ ở helper không phải là phần thay thế đủ cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Mặc định pool và cô lập của Vitest">

    - Config Vitest cơ sở mặc định dùng `threads`.
    - Config Vitest dùng chung cố định `isolate: false` và dùng runner không cô lập trên các dự án gốc, e2e, và config live.
    - Lane UI gốc giữ thiết lập `jsdom` và optimizer của nó, nhưng cũng chạy trên runner không cô lập dùng chung.
    - Mỗi phân mảnh `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false` từ config Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình Node con của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn. Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8 mặc định.

  </Accordion>

  <Accordion title="Lặp cục bộ nhanh">

    - `pnpm changed:lanes` hiển thị diff kích hoạt các lane kiến trúc nào.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và không chạy lint, typecheck, hoặc kiểm thử.
    - Chạy `pnpm check:changed` rõ ràng trước khi bàn giao hoặc push khi bạn cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các lane theo phạm vi chi phí thấp. Chỉ dùng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent quyết định rằng chỉnh sửa harness, config, package, hoặc contract thật sự cần phạm vi kiểm thử Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ cùng hành vi định tuyến, chỉ với giới hạn worker cao hơn.
    - Tự động mở rộng worker cục bộ được cố ý giữ thận trọng và lùi lại khi load average của máy chủ đã cao, nên nhiều lần chạy Vitest đồng thời mặc định gây ít tác động hơn.
    - Config Vitest cơ sở đánh dấu các tệp dự án/config là `forceRerunTriggers` để các lần chạy lại changed-mode vẫn đúng khi wiring kiểm thử thay đổi.
    - Config giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` bật trên các máy chủ được hỗ trợ; đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn một vị trí cache rõ ràng cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Gỡ lỗi hiệu năng">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cùng với
      đầu ra phân tích import.
    - `pnpm test:perf:imports:changed` giới hạn cùng chế độ xem profiling đó vào
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian shard được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lượt chạy toàn bộ config dùng đường dẫn config làm khóa; các shard CI
      theo include-pattern nối thêm tên shard để các shard đã lọc có thể được theo dõi
      riêng.
    - Khi một bài kiểm thử nóng vẫn dành phần lớn thời gian cho các import lúc khởi động,
      hãy đặt các dependency nặng phía sau một seam `*.runtime.ts` cục bộ hẹp và
      mock trực tiếp seam đó thay vì deep-import các helper runtime chỉ
      để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn root-project gốc cho diff đã commit đó
      và in thời gian thực chạy cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây hiện tại
      đang bẩn bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và config Vitest gốc.
    - `pnpm test:perf:profile:main` ghi một hồ sơ CPU main-thread cho
      chi phí khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi hồ sơ CPU+heap của runner cho
      bộ kiểm thử unit khi tính song song theo tệp bị tắt.

  </Accordion>
</AccordionGroup>

### Độ ổn định (gateway)

- Lệnh: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, bị ép dùng một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với chẩn đoán được bật mặc định
  - Đẩy churn thông điệp gateway, bộ nhớ và payload lớn tổng hợp qua đường dẫn sự kiện chẩn đoán
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các helper lưu bền bundle độ ổn định chẩn đoán
  - Xác nhận recorder vẫn bị giới hạn, các mẫu RSS tổng hợp nằm dưới ngân sách áp lực, và độ sâu hàng đợi theo phiên rút về 0
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Lane hẹp để theo dõi hồi quy độ ổn định, không thay thế cho toàn bộ bộ kiểm thử Gateway

### E2E (kiểm thử nhanh gateway)

- Lệnh: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và các bài kiểm thử E2E của Plugin đóng gói trong `extensions/`
- Mặc định runtime:
  - Dùng Vitest `threads` với `isolate: false`, khớp với phần còn lại của repo.
  - Dùng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Chạy ở chế độ im lặng theo mặc định để giảm chi phí I/O console.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để ép số lượng worker (giới hạn ở 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra console chi tiết.
- Phạm vi:
  - Hành vi gateway end-to-end nhiều instance
  - Các bề mặt WebSocket/HTTP, ghép cặp Node và mạng nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không yêu cầu khóa thật
  - Nhiều phần chuyển động hơn kiểm thử unit (có thể chậm hơn)

### E2E: kiểm thử nhanh backend OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Khởi động một gateway OpenShell biệt lập trên host qua Docker
  - Tạo sandbox từ một Dockerfile cục bộ tạm thời
  - Chạy backend OpenShell của OpenClaw qua `sandbox ssh-config` thật + SSH exec
  - Xác minh hành vi hệ thống tệp remote-canonical qua cầu nối fs của sandbox
- Kỳ vọng:
  - Chỉ chạy khi chọn tham gia; không thuộc lượt chạy `pnpm test:e2e` mặc định
  - Cần CLI `openshell` cục bộ cùng một Docker daemon hoạt động
  - Dùng `HOME` / `XDG_CONFIG_HOME` biệt lập, rồi hủy gateway kiểm thử và sandbox
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật bài kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới binary CLI hoặc script wrapper không mặc định

### Live (nhà cung cấp thật + mô hình thật)

- Lệnh: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các bài kiểm thử live của Plugin đóng gói trong `extensions/`
- Mặc định: **được bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - “Nhà cung cấp/mô hình này có thực sự hoạt động _hôm nay_ với thông tin xác thực thật không?”
  - Bắt các thay đổi định dạng của nhà cung cấp, khác biệt khi gọi tool, vấn đề xác thực và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế không ổn định cho CI (mạng thật, chính sách nhà cung cấp thật, quota, sự cố dịch vụ)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con đã thu hẹp thay vì “mọi thứ”
- Các lượt chạy live source `~/.profile` để lấy các khóa API còn thiếu.
- Theo mặc định, các lượt chạy live vẫn cô lập `HOME` và sao chép tài liệu config/auth vào một home kiểm thử tạm thời để fixture unit không thể sửa đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn cố ý cần kiểm thử live dùng thư mục home thật của mình.
- `pnpm test:live` hiện mặc định ở chế độ yên tĩnh hơn: nó giữ đầu ra tiến trình `[live] ...`, nhưng ẩn thông báo `~/.profile` bổ sung và tắt log khởi động gateway/tiếng ồn Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn lấy lại toàn bộ log khởi động.
- Xoay vòng khóa API (theo từng nhà cung cấp): đặt `*_API_KEYS` với định dạng dấu phẩy/dấu chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè theo từng live qua `OPENCLAW_LIVE_*_KEY`; kiểm thử sẽ thử lại khi gặp phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ live hiện phát dòng tiến trình tới stderr để các lệnh gọi nhà cung cấp kéo dài vẫn thấy đang hoạt động ngay cả khi capture console của Vitest đang yên tĩnh.
  - `vitest.live.config.ts` tắt chặn console của Vitest để các dòng tiến trình nhà cung cấp/gateway stream ngay trong các lượt chạy live.
  - Tinh chỉnh Heartbeat mô hình trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Tinh chỉnh Heartbeat gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ kiểm thử nào?

Dùng bảng quyết định này:

- Chỉnh sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn đã thay đổi nhiều)
- Chạm tới mạng Gateway / giao thức WS / ghép đôi: thêm `pnpm test:e2e`
- Gỡ lỗi “bot của tôi bị ngừng hoạt động” / lỗi theo nhà cung cấp / gọi công cụ: chạy `pnpm test:live` đã thu hẹp phạm vi

## Kiểm thử trực tiếp (có truy cập mạng)

Đối với ma trận mô hình trực tiếp, kiểm thử khói backend CLI, kiểm thử khói ACP, bộ kiểm thử app-server
Codex, và tất cả kiểm thử trực tiếp cho nhà cung cấp phương tiện (Deepgram, BytePlus, ComfyUI, hình ảnh,
nhạc, video, bộ kiểm thử phương tiện) — cùng với xử lý thông tin xác thực cho các lần chạy trực tiếp — xem
[Kiểm thử — bộ kiểm thử trực tiếp](/vi/help/testing-live).

## Trình chạy Docker (kiểm tra tùy chọn "hoạt động trên Linux")

Các trình chạy Docker này được chia thành hai nhóm:

- Trình chạy mô hình trực tiếp: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp trực tiếp theo khóa hồ sơ tương ứng bên trong ảnh Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), gắn thư mục cấu hình cục bộ và workspace của bạn (và nạp `~/.profile` nếu được gắn). Các điểm vào cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Trình chạy trực tiếp Docker mặc định dùng giới hạn kiểm thử khói nhỏ hơn để một lượt quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các biến môi trường đó khi bạn
  rõ ràng muốn lần quét toàn diện lớn hơn.
- `test:docker:all` xây dựng ảnh Docker trực tiếp một lần thông qua `test:docker:live-build`, đóng gói OpenClaw một lần dưới dạng tarball npm qua `scripts/package-openclaw-for-docker.mjs`, rồi xây dựng/tái sử dụng hai ảnh `scripts/e2e/Dockerfile`. Ảnh cơ bản chỉ là trình chạy Node/Git cho các lane cài đặt/cập nhật/phụ thuộc Plugin; các lane đó gắn tarball đã dựng sẵn. Ảnh chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng ứng dụng đã dựng. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Bộ tổng hợp dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` kiểm soát các slot tiến trình, còn giới hạn tài nguyên ngăn các lane trực tiếp nặng, cài đặt npm và nhiều dịch vụ cùng khởi động một lúc. Nếu một lane đơn lẻ nặng hơn các giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động lane đó khi pool trống và sau đó giữ nó chạy một mình cho đến khi có lại dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ tinh chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi máy chủ Docker có thêm dư địa. Trình chạy mặc định thực hiện kiểm tra trước Docker, xóa các container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời gian lane thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời gian đó để khởi động các lane dài hơn trước trong các lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane có trọng số mà không xây dựng hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các lane đã chọn, nhu cầu gói/ảnh, và thông tin xác thực.
- `Package Acceptance` là cổng gói gốc GitHub cho câu hỏi "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một gói ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải lên dưới tên `package-under-test`, rồi chạy các lane Docker E2E tái sử dụng với đúng tarball đó thay vì đóng gói lại ref đã chọn. `workflow_ref` chọn workflow/tập lệnh bộ kiểm thử đáng tin cậy, còn `package_ref` chọn commit/nhánh/thẻ nguồn để đóng gói khi `source=ref`; điều này cho phép logic chấp nhận hiện tại xác thực các commit đáng tin cậy cũ hơn. Hồ sơ được sắp theo độ bao phủ: `smoke` là cài đặt/kênh/tác nhân nhanh cộng với Gateway/cấu hình, `package` là hợp đồng gói/cập nhật/Plugin và là thay thế gốc mặc định cho phần lớn phạm vi gói/cập nhật của Parallels, `product` thêm các kênh MCP, dọn dẹp cron/tác nhân con, tìm kiếm web OpenAI, và OpenWebUI, còn `full` chạy các phần Docker theo đường phát hành với OpenWebUI. Xác thực phát hành chạy delta gói tùy chỉnh (`bundled-channel-deps-compat plugins-offline`) cộng với QA gói Telegram vì các phần Docker theo đường phát hành đã bao phủ các lane gói/cập nhật/Plugin trùng lặp. Các lệnh chạy lại Docker GitHub nhắm mục tiêu được tạo từ artifact sẽ bao gồm artifact gói trước đó và đầu vào ảnh đã chuẩn bị khi có, để các lane lỗi có thể tránh xây dựng lại gói và ảnh.
- Kiểm tra build và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Bộ bảo vệ duyệt đồ thị dựng tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và báo lỗi nếu khởi động trước điều phối nhập các phụ thuộc gói như Commander, giao diện nhắc, undici, hoặc ghi log trước khi điều phối lệnh; nó cũng giữ phần chạy Gateway được đóng gói trong ngân sách và từ chối import tĩnh các đường dẫn Gateway lạnh đã biết. Kiểm thử khói CLI đã đóng gói cũng bao phủ trợ giúp gốc, trợ giúp onboard, trợ giúp doctor, trạng thái, lược đồ cấu hình, và lệnh liệt kê mô hình.
- Tương thích kế thừa Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Đến hết mốc đó, bộ kiểm thử chỉ dung thứ các khoảng trống metadata của gói đã phát hành: mục kiểm kê QA riêng tư bị bỏ qua, thiếu `gateway install --wrapper`, thiếu tệp patch trong fixture git sinh từ tarball, thiếu `update.channel` được lưu bền, vị trí bản ghi cài đặt Plugin kế thừa, thiếu lưu bền bản ghi cài đặt marketplace, và di trú metadata cấu hình trong `plugins update`. Với các gói sau `2026.4.25`, các đường dẫn đó là lỗi nghiêm ngặt.
- Trình chạy kiểm thử khói container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường tích hợp cấp cao hơn.

Các trình chạy Docker mô hình trực tiếp cũng chỉ bind-mount các home xác thực CLI cần thiết (hoặc tất cả loại được hỗ trợ khi lần chạy không bị thu hẹp), rồi sao chép chúng vào home của container trước khi chạy để OAuth CLI bên ngoài có thể làm mới token mà không làm thay đổi kho xác thực của máy chủ:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Kiểm thử khói bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; mặc định bao gồm Claude, Codex và Gemini, với phạm vi Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử khói backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử khói harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử khói khả năng quan sát: `pnpm qa:otel:smoke` là một lane kiểm tra nguồn QA riêng tư. Nó cố ý không thuộc các lane phát hành Docker của gói vì npm tarball bỏ qua QA Lab.
- Kiểm thử khói trực tiếp Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, scaffolding đầy đủ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử khói onboarding/channel/agent bằng npm tarball: `pnpm test:docker:npm-onboard-channel-agent` cài đặt OpenClaw tarball đã đóng gói toàn cục trong Docker, cấu hình OpenAI qua onboarding tham chiếu env cộng với Telegram theo mặc định, xác minh doctor đã sửa các phụ thuộc runtime của Plugin đã kích hoạt, và chạy một lượt agent OpenAI được mock. Tái sử dụng tarball đã build sẵn bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua rebuild trên host bằng `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc đổi channel bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Kiểm thử khói chuyển channel cập nhật: `pnpm test:docker:update-channel-switch` cài đặt OpenClaw tarball đã đóng gói toàn cục trong Docker, chuyển từ gói `stable` sang git `dev`, xác minh channel đã lưu và Plugin hoạt động sau cập nhật, rồi chuyển lại về gói `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử khói ngữ cảnh runtime phiên: `pnpm test:docker:session-runtime-context` xác minh việc lưu transcript ngữ cảnh runtime ẩn cùng với sửa chữa doctor cho các nhánh ghi lại prompt bị trùng lặp chịu ảnh hưởng.
- Kiểm thử khói cài đặt toàn cục Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài bằng `bun install -g` trong home cô lập, và xác minh `openclaw infer image providers --json` trả về các provider hình ảnh đi kèm thay vì bị treo. Tái sử dụng tarball đã build sẵn bằng `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua build trên host bằng `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ image Docker đã build bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử khói Docker của trình cài đặt: `bash scripts/test-install-sh-docker.sh` dùng chung một cache npm cho các container root, update và direct-npm. Kiểm thử khói update mặc định dùng npm `latest` làm baseline ổn định trước khi nâng cấp lên tarball ứng viên. Ghi đè bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` cục bộ, hoặc bằng input `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ cache npm cô lập để các mục cache do root sở hữu không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để tái sử dụng cache root/update/direct-npm giữa các lần chạy lại cục bộ.
- CI Install Smoke bỏ qua bản cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy script cục bộ không có env đó khi cần phạm vi kiểm tra `npm install -g` trực tiếp.
- Kiểm thử khói CLI xóa workspace dùng chung của agents: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định build image Dockerfile gốc, seed hai agent với một workspace trong home container cô lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Tái sử dụng image install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử khói snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build image E2E nguồn cộng với một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao phủ URL liên kết, phần tử có thể nhấp được thăng cấp từ con trỏ, tham chiếu iframe và metadata frame.
- Hồi quy reasoning tối thiểu của OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI được mock qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, sau đó ép schema provider từ chối và kiểm tra chi tiết thô xuất hiện trong log Gateway.
- Cầu nối channel MCP (Gateway đã seed + cầu nối stdio + kiểm thử khói raw notification-frame của Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP gói Pi (máy chủ MCP stdio thật + kiểm thử khói cho phép/từ chối profile Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP Cron/subagent (Gateway thật + teardown tiến trình con MCP stdio sau các lần chạy cron cô lập và subagent một lần): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (kiểm thử khói cài đặt, cài/gỡ gói kitchen-sink của ClawHub, cập nhật marketplace và bật/kiểm tra gói Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp package/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Khi không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, bài kiểm thử dùng máy chủ fixture ClawHub cục bộ khép kín.
- Kiểm thử khói cập nhật Plugin không thay đổi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử khói metadata tải lại cấu hình: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Phụ thuộc runtime của Plugin đi kèm: `pnpm test:docker:bundled-channel-deps` mặc định build một image runner Docker nhỏ, build và đóng gói OpenClaw một lần trên host, rồi mount tarball đó vào từng kịch bản cài đặt Linux. Tái sử dụng image bằng `OPENCLAW_SKIP_DOCKER_BUILD=1`, bỏ qua rebuild trên host sau một bản build cục bộ mới bằng `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, hoặc trỏ tới tarball hiện có bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Tổ hợp Docker đầy đủ và các chunk bundled-channel theo đường phát hành pre-pack tarball này một lần, rồi chia nhỏ kiểm tra channel đi kèm thành các lane độc lập, bao gồm các lane cập nhật riêng cho Telegram, Discord, Slack, Feishu, memory-lancedb và ACPX. Các chunk phát hành tách kiểm thử khói channel, mục tiêu cập nhật và hợp đồng setup/runtime thành `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` và `bundled-channels-contracts`; chunk tổng hợp `bundled-channels` vẫn có sẵn để chạy lại thủ công. Workflow phát hành cũng tách các chunk trình cài đặt provider và chunk cài/gỡ Plugin đi kèm; các chunk cũ `package-update`, `plugins-runtime` và `plugins-integrations` vẫn là bí danh tổng hợp để chạy lại thủ công. Dùng `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` để thu hẹp ma trận channel khi chạy trực tiếp lane đi kèm, hoặc `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` để thu hẹp kịch bản cập nhật. Các lần chạy Docker theo kịch bản mặc định dùng `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; kịch bản cập nhật nhiều mục tiêu mặc định dùng `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Lane này cũng xác minh rằng `channels.<id>.enabled=false` và `plugins.entries.<id>.enabled=false` chặn việc doctor sửa chữa phụ thuộc runtime.
- Thu hẹp phụ thuộc runtime của Plugin đi kèm khi lặp bằng cách tắt các kịch bản không liên quan, ví dụ:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Để prebuild và tái sử dụng image chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image theo suite như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một image dùng chung từ xa, các script sẽ pull image đó nếu nó chưa có cục bộ. Các bài kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi package/cài đặt thay vì runtime ứng dụng đã build dùng chung.

Các runner Docker live-model cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Điều này giữ cho image
runtime gọn nhẹ trong khi vẫn chạy Vitest trên đúng nguồn/cấu hình cục bộ của bạn.
Bước staging bỏ qua các cache chỉ dùng cục bộ lớn và output build ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục output `.build`
hoặc Gradle cục bộ của ứng dụng để các lần chạy live Docker không mất nhiều phút sao chép
artifact đặc thù của máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các probe live của Gateway không khởi động
worker channel Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền qua
`OPENCLAW_LIVE_GATEWAY_*` cả khi bạn cần thu hẹp hoặc loại trừ phạm vi live của Gateway
khỏi lane Docker đó.
`test:docker:openwebui` là một kiểm thử khói tương thích cấp cao hơn: nó khởi động một
container gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI đã pin trỏ tới gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` hiển thị `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Lần chạy đầu tiên có thể chậm hơn đáng kể vì Docker có thể cần pull image
Open WebUI và Open WebUI có thể cần hoàn tất thiết lập cold-start riêng.
Lane này kỳ vọng có khóa mô hình live dùng được, và `OPENCLAW_PROFILE_FILE`
(`~/.profile` theo mặc định) là cách chính để cung cấp khóa đó trong các lần chạy Docker hóa.
Các lần chạy thành công in một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` cố ý có tính xác định và không cần tài khoản
Telegram, Discord hoặc iMessage thật. Nó boot một container Gateway đã seed,
khởi động container thứ hai sinh ra `openclaw mcp serve`, rồi xác minh
khám phá hội thoại đã định tuyến, đọc transcript, metadata tệp đính kèm,
hành vi hàng đợi sự kiện live, định tuyến gửi outbound, và thông báo channel kiểu Claude +
quyền qua cầu nối MCP stdio thật. Kiểm tra thông báo
kiểm tra trực tiếp các frame MCP stdio thô để kiểm thử khói xác thực những gì
cầu nối thật sự phát ra, không chỉ những gì một SDK client cụ thể tình cờ hiển thị.
`test:docker:pi-bundle-mcp-tools` có tính xác định và không cần khóa mô hình live.
Nó build image Docker của repo, khởi động một máy chủ probe MCP stdio thật
bên trong container, hiện thực hóa máy chủ đó qua runtime MCP gói Pi nhúng,
thực thi công cụ, rồi xác minh `coding` và `messaging` giữ
công cụ `bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa mô hình live.
Nó khởi động một Gateway đã seed với máy chủ probe MCP stdio thật, chạy một
lượt cron cô lập và một lượt con một lần `/subagents spawn`, rồi xác minh
tiến trình con MCP thoát sau mỗi lần chạy.

Kiểm thử khói thread ngôn ngữ thường ACP thủ công (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các quy trình hồi quy/gỡ lỗi. Có thể cần lại script này để xác thực định tuyến luồng ACP, vì vậy đừng xóa nó.

Biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy kiểm thử
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được source từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục cấu hình/không gian làm việc tạm thời và không mount xác thực CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các bản cài CLI được lưu bộ nhớ đệm bên trong Docker
- Các thư mục/tệp xác thực CLI bên ngoài trong `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi kiểm thử bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy nhà cung cấp được thu hẹp chỉ mount những thư mục/tệp cần thiết suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc một danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc các nhà cung cấp trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để dùng lại ảnh `openclaw:local-live` hiện có cho các lần chạy lại không cần dựng lại
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo thông tin xác thực đến từ kho hồ sơ (không phải môi trường)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình được Gateway cung cấp cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce được smoke Open WebUI sử dụng
- `OPENWEBUI_IMAGE=...` để ghi đè thẻ ảnh Open WebUI đã ghim

## Kiểm tra hợp lệ tài liệu

Chạy kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra tiêu đề trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy ngoại tuyến (an toàn cho CI)

Đây là các hồi quy “pipeline thật” không có nhà cung cấp thật:

- Gọi công cụ Gateway (OpenAI giả lập, Gateway thật + vòng lặp tác tử thật): `src/gateway/gateway.test.ts` (trường hợp: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Trình hướng dẫn Gateway (WS `wizard.start`/`wizard.next`, ghi cấu hình + bắt buộc xác thực): `src/gateway/gateway.test.ts` (trường hợp: "runs wizard over ws and writes auth token config")

## Đánh giá độ tin cậy của tác tử (Skills)

Chúng ta đã có một vài kiểm thử an toàn cho CI hoạt động như “đánh giá độ tin cậy của tác tử”:

- Gọi công cụ giả lập qua Gateway thật + vòng lặp tác tử (`src/gateway/gateway.test.ts`).
- Các luồng trình hướng dẫn đầu cuối xác thực việc nối phiên và hiệu lực cấu hình (`src/gateway/gateway.test.ts`).

Những phần vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi Skills được liệt kê trong prompt, tác tử có chọn đúng Skills (hoặc tránh những Skills không liên quan) không?
- **Tuân thủ:** tác tử có đọc `SKILL.md` trước khi sử dụng và làm theo các bước/tham số bắt buộc không?
- **Hợp đồng quy trình:** các kịch bản nhiều lượt xác nhận thứ tự công cụ, việc mang theo lịch sử phiên và ranh giới sandbox.

Các đánh giá trong tương lai trước hết nên giữ tính xác định:

- Một trình chạy kịch bản dùng nhà cung cấp giả lập để xác nhận các lời gọi công cụ + thứ tự, việc đọc tệp Skills và nối phiên.
- Một bộ nhỏ các kịch bản tập trung vào Skills (sử dụng so với tránh, gating, chèn prompt).
- Đánh giá live tùy chọn (opt-in, được kiểm soát bằng biến môi trường) chỉ sau khi bộ an toàn cho CI đã sẵn sàng.

## Kiểm thử hợp đồng (hình dạng Plugin và kênh)

Kiểm thử hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ hợp đồng giao diện của nó. Chúng lặp qua tất cả Plugin được phát hiện và chạy một bộ xác nhận về hình dạng và hành vi. Lane đơn vị `pnpm test` mặc định cố ý bỏ qua các tệp smoke và đường nối dùng chung này; hãy chạy rõ ràng các lệnh hợp đồng khi bạn chạm vào bề mặt kênh hoặc nhà cung cấp dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng nhà cung cấp: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng Plugin cơ bản (id, tên, khả năng)
- **setup** - Hợp đồng trình hướng dẫn thiết lập
- **session-binding** - Hành vi ràng buộc phiên
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn đến
- **actions** - Trình xử lý hành động kênh
- **threading** - Xử lý ID luồng
- **directory** - API thư mục/danh sách thành viên
- **group-policy** - Thực thi chính sách nhóm

### Hợp đồng trạng thái nhà cung cấp

Nằm trong `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kiểm tra trạng thái kênh
- **registry** - Hình dạng registry Plugin

### Hợp đồng nhà cung cấp

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng luồng xác thực
- **auth-choice** - Lựa chọn/chọn xác thực
- **catalog** - API danh mục mô hình
- **discovery** - Phát hiện Plugin
- **loader** - Tải Plugin
- **runtime** - Runtime nhà cung cấp
- **shape** - Hình dạng/giao diện Plugin
- **wizard** - Trình hướng dẫn thiết lập

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa đổi một kênh hoặc Plugin nhà cung cấp
- Sau khi refactor đăng ký hoặc phát hiện Plugin

Kiểm thử hợp đồng chạy trong CI và không yêu cầu khóa API thật.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề nhà cung cấp/mô hình được phát hiện trong live:

- Thêm hồi quy an toàn cho CI nếu có thể (nhà cung cấp mock/stub, hoặc ghi lại phép biến đổi hình dạng yêu cầu chính xác)
- Nếu vốn dĩ chỉ live mới kiểm thử được (giới hạn tốc độ, chính sách xác thực), giữ kiểm thử live thật hẹp và opt-in qua biến môi trường
- Ưu tiên nhắm vào lớp nhỏ nhất bắt được lỗi:
  - lỗi chuyển đổi/phát lại yêu cầu nhà cung cấp → kiểm thử mô hình trực tiếp
  - lỗi pipeline phiên/lịch sử/công cụ Gateway → smoke live Gateway hoặc kiểm thử mock Gateway an toàn cho CI
- Lan can SecretRef traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một mục tiêu mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi xác nhận các exec id có đoạn traversal bị từ chối.
  - Nếu bạn thêm một họ mục tiêu SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong kiểm thử đó. Kiểm thử cố ý thất bại với các id mục tiêu chưa được phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Kiểm thử live](/vi/help/testing-live)
- [CI](/vi/ci)
