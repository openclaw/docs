---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm kiểm thử hồi quy cho lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của Gateway và tác nhân
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử đơn vị/e2e/trực tiếp, trình chạy Docker và phạm vi bao phủ của từng kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-05T06:17:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (unit/integration, e2e, live) và một nhóm nhỏ
các Docker runner. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ kiểm thử bao quát những gì (và những gì nó chủ ý _không_ bao quát).
- Những lệnh cần chạy cho các quy trình làm việc phổ biến (local, trước khi push, gỡ lỗi).
- Cách các kiểm thử live phát hiện thông tin xác thực và chọn model/provider.
- Cách thêm hồi quy cho các vấn đề model/provider trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các lane vận chuyển live)** được ghi lại riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) — kiến trúc, bề mặt lệnh, cách viết kịch bản.
- [Matrix QA](/vi/concepts/qa-matrix) — tài liệu tham khảo cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) — Plugin vận chuyển tổng hợp được dùng bởi các kịch bản do repo hỗ trợ.

Trang này bao quát việc chạy các bộ kiểm thử thông thường và các runner Docker/Parallels. Phần runner dành riêng cho QA bên dưới ([Runner dành riêng cho QA](#qa-specific-runners)) liệt kê các lệnh gọi `qa` cụ thể và trỏ lại các tài liệu tham khảo ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng kiểm tra đầy đủ (được kỳ vọng trước khi push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử local nhanh hơn trên máy có tài nguyên rộng rãi: `pnpm test:max`
- Vòng lặp watch Vitest trực tiếp: `pnpm test:watch`
- Nhắm mục tiêu tệp trực tiếp hiện cũng định tuyến các đường dẫn extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên các lần chạy có mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Trang QA có Docker hỗ trợ: `pnpm qa:lab:up`
- Lane QA có VM Linux hỗ trợ: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng coverage: `pnpm test:coverage`
- Bộ E2E: `pnpm test:e2e`

Khi gỡ lỗi các provider/model thực (yêu cầu thông tin xác thực thật):

- Bộ live (model + probe Gateway tool/image): `pnpm test:live`
- Nhắm một tệp live một cách yên tĩnh: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng runtime: dispatch `OpenClaw Performance` với
  `live_gpt54=true` cho một lượt agent `openai/gpt-5.4` thật hoặc
  `deep_profile=true` cho artifact CPU/heap/trace của Kova. Các lần chạy theo lịch hằng ngày
  xuất bản artifact lane mock-provider, deep-profile và GPT 5.4 tới
  `openclaw/clawgrit-reports` khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình. Báo cáo
  mock-provider cũng bao gồm số liệu khởi động Gateway ở mức nguồn, bộ nhớ,
  plugin-pressure, vòng lặp hello fake-model lặp lại, và khởi động CLI.
- Quét model live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi model được chọn hiện chạy một lượt văn bản cộng với một probe nhỏ kiểu đọc tệp.
    Các model có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các probe bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi provider.
  - Phạm vi CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận model live bằng Docker riêng
    được shard theo provider.
  - Để chạy lại CI có trọng tâm, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm các secret provider có tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng với `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các caller
    theo lịch/release của nó.
- Smoke bound-chat Codex gốc: `pnpm test:docker:live-codex-bind`
  - Chạy một lane live Docker theo đường dẫn app-server Codex, bind một Slack DM tổng hợp
    bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi thuần và một tệp đính kèm hình ảnh
    định tuyến qua binding Plugin gốc thay vì ACP.
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
  - Kiểm tra opt-in belt-and-suspenders cho bề mặt lệnh cứu hộ kênh tin nhắn.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi model bền vững,
    trả lời `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong một container không có config với Claude CLI giả trên `PATH`
    và xác minh fallback planner mờ được dịch thành một lần ghi config có kiểu và được audit.
- Smoke Docker lần chạy đầu của Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ một thư mục trạng thái OpenClaw trống, định tuyến `openclaw` trần tới
    Crestodian, áp dụng các lần ghi setup/model/agent/Discord Plugin + SecretRef,
    xác thực config, và xác minh các mục audit. Cùng đường dẫn thiết lập Ring 0 này
    cũng được bao quát trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một lệnh cô lập
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  với `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và transcript
  assistant lưu `usage.cost` đã được chuẩn hóa.

<Tip>
Khi bạn chỉ cần một ca lỗi, ưu tiên thu hẹp kiểm thử live qua các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Runner dành riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần độ thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. Tương đương agentic được lồng dưới
`QA-Lab - All Lanes` và xác thực release, không phải một workflow PR độc lập.
Xác thực rộng nên dùng `Full Release Validation` với
`rerun_group=qa-parity` hoặc nhóm QA của release-checks. Các kiểm tra release ổn định/mặc định
giữ soak live/Docker toàn diện phía sau `run_release_soak=true`; profile
`full` buộc bật soak. `QA-Lab - All Lanes`
chạy hằng đêm trên `main` và từ dispatch thủ công với lane mock parity, lane Matrix live,
lane Telegram live do Convex quản lý, và lane Discord live do Convex quản lý
dưới dạng các job song song. QA theo lịch và kiểm tra release truyền Matrix
`--profile fast` rõ ràng, trong khi CLI Matrix và input workflow thủ công
mặc định vẫn là `all`; dispatch thủ công có thể shard `all` thành các job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`. `OpenClaw Release
Checks` chạy parity cộng với các lane Matrix nhanh và Telegram trước khi phê duyệt release,
dùng `mock-openai/gpt-5.5` cho kiểm tra vận chuyển release để chúng luôn
xác định và tránh khởi động provider-plugin thông thường. Các Gateway vận chuyển live này
tắt tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao quát bởi các bộ QA parity.

Các shard media live của full release dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard model/backend live bằng Docker dùng image chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi commit
được chọn, rồi pull nó với `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì rebuild
bên trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy các kịch bản QA dựa trên repo trực tiếp trên host.
  - Mặc định chạy song song nhiều kịch bản đã chọn với các worker
    gateway được cô lập. `qa-channel` mặc định dùng độ đồng thời 4 (bị giới hạn bởi
    số lượng kịch bản đã chọn). Dùng `--concurrency <count>` để điều chỉnh số lượng
    worker, hoặc `--concurrency 1` cho lane nối tiếp cũ hơn.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn lấy artifact mà không có mã thoát thất bại.
  - Hỗ trợ các chế độ provider `live-frontier`, `mock-openai`, và `aimock`.
    `aimock` khởi động một máy chủ provider cục bộ dựa trên AIMock cho phạm vi kiểm thử
    fixture thử nghiệm và protocol-mock mà không thay thế lane `mock-openai`
    có nhận biết kịch bản.
- `pnpm test:plugins:kitchen-sink-live`
  - Chạy bài kiểm thử tổng hợp Plugin OpenAI Kitchen Sink trực tiếp thông qua QA Lab. Lệnh này
    cài đặt gói Kitchen Sink bên ngoài, xác minh bản kiểm kê bề mặt plugin SDK,
    thăm dò `/healthz` và `/readyz`, ghi lại bằng chứng CPU/RSS của gateway,
    chạy một lượt OpenAI trực tiếp, và kiểm tra chẩn đoán đối kháng.
    Yêu cầu xác thực OpenAI trực tiếp như `OPENAI_API_KEY`. Trong các phiên Testbox
    đã hydrate, lệnh tự động source hồ sơ live-auth của Testbox khi có helper
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy bench khởi động gateway cùng một gói nhỏ các kịch bản QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi bản tóm tắt quan sát CPU kết hợp
    trong `.artifacts/gateway-cpu-scenarios/`.
  - Mặc định chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cùng `--hot-wall-warn-ms`), nên các đợt tăng ngắn lúc khởi động được ghi dưới dạng metric
    mà không trông giống hồi quy gateway bị ghim CPU trong nhiều phút.
  - Dùng các artifact `dist` đã build; hãy chạy build trước khi checkout chưa
    có output runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA suite bên trong một VM Linux Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên host.
  - Dùng lại cùng các cờ chọn provider/model như `qa suite`.
  - Các lần chạy trực tiếp chuyển tiếp những đầu vào xác thực QA được hỗ trợ và phù hợp cho guest:
    khóa provider dựa trên env, đường dẫn cấu hình provider QA trực tiếp, và `CODEX_HOME`
    khi có.
  - Thư mục output phải nằm dưới repo root để guest có thể ghi ngược qua
    workspace được mount.
  - Ghi báo cáo QA và bản tóm tắt thông thường cùng log Multipass trong
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA dựa trên Docker cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt toàn cục trong
    Docker, chạy onboarding khóa API OpenAI không tương tác, cấu hình Telegram
    theo mặc định, xác minh runtime Plugin đã đóng gói tải được mà không cần sửa
    phụ thuộc lúc khởi động, chạy doctor, và chạy một lượt agent cục bộ với một
    endpoint OpenAI được mock.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane packaged-install
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một smoke Docker built-app xác định cho transcript ngữ cảnh runtime nhúng.
    Lệnh xác minh ngữ cảnh runtime OpenClaw ẩn được lưu bền vững dưới dạng một
    thông điệp tùy chỉnh không hiển thị thay vì rò rỉ vào lượt người dùng thấy được,
    sau đó seed một JSONL phiên hỏng bị ảnh hưởng và xác minh
    `openclaw doctor --fix` ghi lại nó sang nhánh đang hoạt động kèm bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên gói OpenClaw trong Docker, chạy onboarding gói đã cài đặt,
    cấu hình Telegram thông qua CLI đã cài đặt, rồi dùng lại lane QA Telegram
    trực tiếp với gói đã cài đó làm SUT Gateway.
  - Mặc định dùng `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã resolve thay vì
    cài đặt từ registry.
  - Dùng cùng thông tin xác thực env Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Cho tự động hóa CI/release, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cùng
    `OPENCLAW_QA_CONVEX_SITE_URL` và role secret. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một Convex role secret có trong CI,
    wrapper Docker tự động chọn Convex.
  - Wrapper xác thực env thông tin xác thực Telegram hoặc Convex trên host trước
    công việc build/cài đặt Docker. Chỉ đặt `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    khi cố ý gỡ lỗi thiết lập trước thông tin xác thực.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này.
  - GitHub Actions cung cấp lane này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và các lease thông tin xác thực Convex CI.
- GitHub Actions cũng cung cấp `Package Acceptance` cho bằng chứng sản phẩm chạy bên
  với một gói ứng viên. Workflow chấp nhận một ref đáng tin cậy, npm spec đã publish,
  URL tarball HTTPS kèm SHA-256, hoặc artifact tarball từ một lần chạy khác, tải lên
  `openclaw-current.tgz` đã chuẩn hóa dưới tên `package-under-test`, rồi chạy
  scheduler Docker E2E hiện có với các hồ sơ lane smoke, package, product, full, hoặc custom.
  Đặt `telegram_mode=mock-openai` hoặc `live-frontier` để chạy workflow QA
  Telegram với cùng artifact `package-under-test`.
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
    với OpenAI đã cấu hình, rồi bật các channel/Plugin được đóng gói kèm thông qua
    chỉnh sửa cấu hình.
  - Xác minh quá trình khám phá thiết lập để các Plugin có thể tải xuống nhưng chưa cấu hình vắng mặt,
    lần sửa doctor đã cấu hình đầu tiên cài đặt rõ ràng từng Plugin có thể tải xuống
    còn thiếu, và lần khởi động lại thứ hai không chạy sửa phụ thuộc ẩn.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của ứng viên
    dọn sạch phần dư phụ thuộc Plugin legacy mà không cần sửa postinstall phía
    harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật packaged-install native trên các guest Parallels. Mỗi
    nền tảng được chọn trước tiên cài đặt gói baseline được yêu cầu, sau đó chạy
    lệnh `openclaw update` đã cài đặt trong cùng guest và xác minh
    phiên bản đã cài, trạng thái cập nhật, độ sẵn sàng gateway, và một lượt agent
    cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một guest. Dùng `--json` cho đường dẫn artifact tóm tắt và
    trạng thái từng lane.
  - Lane OpenAI mặc định dùng `openai/gpt-5.5` cho bằng chứng lượt agent trực tiếp.
    Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi cố ý xác thực một model OpenAI khác.
  - Bọc các lần chạy cục bộ dài trong timeout của host để tình trạng treo transport Parallels không
    tiêu tốn phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi log lane lồng nhau trong `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi cho rằng wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong doctor sau cập nhật và công việc
    cập nhật gói trên guest lạnh; điều đó vẫn bình thường khi log debug npm
    lồng nhau đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với các lane smoke Parallels
    macOS, Windows, hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể va chạm khi
    khôi phục snapshot, phục vụ gói, hoặc trạng thái gateway của guest.
  - Bằng chứng sau cập nhật chạy bề mặt Plugin đóng gói kèm thông thường vì
    các facade capability như speech, image generation, và media
    understanding được tải thông qua API runtime đóng gói kèm ngay cả khi lượt agent
    chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ provider AIMock cục bộ cho kiểm thử smoke protocol trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy lane QA Matrix trực tiếp với một homeserver Tuwunel dùng một lần dựa trên Docker. Chỉ dành cho source-checkout — packaged install không ship `qa-lab`.
  - CLI đầy đủ, catalog hồ sơ/kịch bản, env vars, và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy lane QA Telegram trực tiếp với một nhóm riêng tư thật bằng token bot driver và SUT từ env.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id phải là Telegram chat id dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực dùng chung dạng pool. Mặc định dùng chế độ env, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng lease dạng pool.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn lấy artifact mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng nhóm riêng tư, với bot SUT có Telegram username.
  - Để quan sát bot-to-bot ổn định, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và đảm bảo bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, bản tóm tắt, và artifact observed-messages trong `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT quan sát được.

Các lane transport trực tiếp dùng chung một contract tiêu chuẩn để transport mới không bị lệch; ma trận phạm vi theo lane nằm trong [Tổng quan QA → Phạm vi transport trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ tổng hợp synthetic rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) được bật cho
`openclaw qa telegram`, QA lab lấy một lease độc quyền từ pool dựa trên Convex, heartbeat
lease đó trong khi lane đang chạy, và giải phóng lease khi tắt.

Scaffold dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Env vars bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho role đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn role thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định env: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, nếu không thì `maintainer`)

Env vars tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (trace id tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` loopback cho phát triển chỉ cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong vận hành thông thường.

Các lệnh quản trị dành cho người bảo trì (pool add/remove/list) yêu cầu riêng
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Các trình trợ giúp CLI dành cho người bảo trì:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lần chạy trực tiếp để kiểm tra URL site Convex, secret của broker,
tiền tố endpoint, thời gian chờ HTTP và khả năng truy cập admin/list mà không in
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
- `POST /admin/add` (chỉ secret của người bảo trì)
  - Yêu cầu: `{ kind, actorId, payload, note?, status? }`
  - Thành công: `{ status: "ok", credential }`
- `POST /admin/remove` (chỉ secret của người bảo trì)
  - Yêu cầu: `{ credentialId, actorId }`
  - Thành công: `{ status: "ok", changed, credential }`
  - Bảo vệ lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ secret của người bảo trì)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Hình dạng payload cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi id cuộc trò chuyện Telegram dạng số.
- `admin/add` xác thực hình dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

### Thêm một kênh vào QA

Kiến trúc và tên trình trợ giúp kịch bản cho adapter kênh mới nằm trong [Tổng quan QA → Thêm một kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai trình chạy transport trên seam host `qa-lab` dùng chung, khai báo `qaRunners` trong manifest Plugin, mount dưới dạng `openclaw qa <runner>`, và viết kịch bản trong `qa/scenarios/`.

## Bộ kiểm thử (chạy ở đâu)

Hãy nghĩ về các bộ này như “mức độ chân thực tăng dần” (và độ không ổn định/chi phí cũng tăng dần):

### Đơn vị / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng tập shard `vitest.full-*.config.ts` và có thể mở rộng shard đa dự án thành cấu hình theo từng dự án để lập lịch song song
- Tệp: inventory lõi/đơn vị trong `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử đơn vị UI chạy trong shard chuyên dụng `unit-ui`
- Phạm vi:
  - Kiểm thử đơn vị thuần túy
  - Kiểm thử tích hợp trong tiến trình (xác thực Gateway, định tuyến, tooling, phân tích cú pháp, cấu hình)
  - Hồi quy xác định cho lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không cần khóa thật
  - Nên nhanh và ổn định
  - Kiểm thử resolver và public-surface loader phải chứng minh hành vi fallback rộng của `api.js` và
    `runtime-api.js` bằng fixture Plugin nhỏ được tạo ra, không phải
    API nguồn Plugin đi kèm thật. Các lần tải API Plugin thật thuộc về
    bộ kiểm thử hợp đồng/tích hợp do Plugin sở hữu.

<AccordionGroup>
  <Accordion title="Dự án, shard, và lane theo phạm vi">

    - `pnpm test` không nhắm mục tiêu chạy mười hai cấu hình shard nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình root-project native khổng lồ. Cách này giảm RSS đỉnh trên máy đang tải nặng và tránh việc auto-reply/extension làm các bộ không liên quan bị đói tài nguyên.
    - `pnpm test --watch` vẫn dùng đồ thị dự án gốc native `vitest.config.ts`, vì vòng lặp watch đa shard không thực tế.
    - `pnpm test`, `pnpm test:watch`, và `pnpm test:perf:imports` định tuyến mục tiêu tệp/thư mục rõ ràng qua các lane theo phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả chi phí khởi động toàn bộ dự án gốc.
    - `pnpm test:changed` mặc định mở rộng đường dẫn git đã thay đổi thành các lane theo phạm vi rẻ: chỉnh sửa kiểm thử trực tiếp, tệp anh em `*.test.ts`, ánh xạ nguồn rõ ràng, và phần phụ thuộc theo đồ thị import cục bộ. Chỉnh sửa cấu hình/setup/package không chạy kiểm thử rộng trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường cho thay đổi hẹp. Nó phân loại diff thành lõi, kiểm thử lõi, extension, kiểm thử extension, app, tài liệu, metadata phát hành, tooling Docker trực tiếp, và tooling, rồi chạy các lệnh typecheck, lint, và guard tương ứng. Nó không chạy kiểm thử Vitest; gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các bump phiên bản chỉ metadata phát hành chạy kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu, với guard từ chối thay đổi package bên ngoài trường phiên bản cấp cao nhất.
    - Chỉnh sửa harness Docker ACP trực tiếp chạy các kiểm tra tập trung: cú pháp shell cho script xác thực Docker trực tiếp và một lần chạy khô bộ lập lịch Docker trực tiếp. Thay đổi `package.json` chỉ được bao gồm khi diff giới hạn ở `scripts["test:docker:live-*"]`; các chỉnh sửa phụ thuộc, export, phiên bản và bề mặt package khác vẫn dùng guard rộng hơn.
    - Kiểm thử đơn vị nhẹ về import từ agent, command, plugin, trình trợ giúp auto-reply, `plugin-sdk`, và các khu vực tiện ích thuần túy tương tự định tuyến qua lane `unit-fast`, lane này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp nặng về trạng thái/runtime vẫn ở trên các lane hiện có.
    - Một số tệp nguồn trình trợ giúp `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy chế độ changed tới kiểm thử anh em rõ ràng trong các lane nhẹ đó, để chỉnh sửa trình trợ giúp tránh chạy lại toàn bộ bộ nặng cho thư mục đó.
    - `auto-reply` có các bucket riêng cho trình trợ giúp lõi cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất, và cây con `src/auto-reply/reply/**`. CI tiếp tục tách cây con reply thành các shard agent-runner, dispatch, và commands/state-routing để một bucket nặng về import không sở hữu toàn bộ phần đuôi Node.
    - CI PR/main thông thường cố ý bỏ qua sweep batch extension và shard `agentic-plugins` chỉ dành cho phát hành. Full Release Validation dispatch workflow con `Plugin Prerelease` riêng cho các bộ nặng về plugin/extension đó trên ứng viên phát hành.

  </Accordion>

  <Accordion title="Phạm vi bao phủ embedded runner">

    - Khi bạn thay đổi đầu vào khám phá message-tool hoặc ngữ cảnh runtime compaction,
      hãy giữ cả hai tầng bao phủ.
    - Thêm hồi quy trình trợ giúp tập trung cho các ranh giới định tuyến và chuẩn hóa
      thuần túy.
    - Giữ các bộ tích hợp embedded runner khỏe mạnh:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ đó xác minh rằng scoped id và hành vi Compaction vẫn đi qua
      các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ bằng trình trợ giúp
      không phải là thay thế đủ cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Mặc định pool và cô lập của Vitest">

    - Cấu hình Vitest cơ sở mặc định là `threads`.
    - Cấu hình Vitest dùng chung cố định `isolate: false` và dùng
      runner không cô lập trên các dự án gốc, cấu hình e2e, và cấu hình trực tiếp.
    - Lane UI gốc giữ setup `jsdom` và optimizer của nó, nhưng cũng chạy trên
      runner không cô lập dùng chung.
    - Mỗi shard `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false`
      từ cấu hình Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho tiến trình Node
      con của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8
      gốc.

  </Accordion>

  <Accordion title="Lặp cục bộ nhanh">

    - `pnpm changed:lanes` hiển thị các lane kiến trúc mà một diff kích hoạt.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck, hoặc kiểm thử.
    - Chạy `pnpm check:changed` rõ ràng trước khi bàn giao hoặc push khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các lane theo phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      quyết định chỉnh sửa harness, cấu hình, package, hoặc hợp đồng thật sự cần
      phạm vi Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ nguyên hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động co giãn worker cục bộ cố ý bảo thủ và giảm xuống
      khi load average của host đã cao, nên nhiều lần chạy
      Vitest đồng thời mặc định gây ít tác hại hơn.
    - Cấu hình Vitest cơ sở đánh dấu các tệp project/config là
      `forceRerunTriggers` để các lần chạy lại ở chế độ changed vẫn đúng khi
      wiring kiểm thử thay đổi.
    - Cấu hình giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` được bật trên host được hỗ trợ;
      đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache rõ ràng cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Gỡ lỗi hiệu năng">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cùng với
      đầu ra import-breakdown.
    - `pnpm test:perf:imports:changed` giới hạn cùng chế độ profiling đó cho
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian shard được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn cấu hình dùng đường dẫn cấu hình làm khóa; shard CI
      theo include-pattern thêm tên shard để shard đã lọc có thể được theo dõi
      riêng.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho import lúc khởi động,
      hãy giữ phụ thuộc nặng phía sau một seam `*.runtime.ts` cục bộ hẹp và
      mock seam đó trực tiếp thay vì deep-import trình trợ giúp runtime chỉ
      để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn root-project native cho diff
      đã commit đó và in wall time cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây hiện tại
      đang bẩn bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và cấu hình Vitest gốc.
    - `pnpm test:perf:profile:main` ghi một CPU profile main-thread cho
      overhead khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi CPU+heap profile của runner cho bộ
      đơn vị với song song hóa tệp bị tắt.

  </Accordion>
</AccordionGroup>

### Độ ổn định (gateway)

- Lệnh: `pnpm test:stability:gateway`
- Cấu hình: `vitest.gateway.config.ts`, buộc dùng một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với diagnostics mặc định được bật
  - Đẩy churn thông điệp gateway, bộ nhớ, và payload lớn tổng hợp qua đường dẫn sự kiện diagnostic
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ trình trợ giúp lưu giữ diagnostic stability bundle
  - Khẳng định recorder vẫn bị giới hạn, mẫu RSS tổng hợp ở dưới ngân sách áp lực, và độ sâu hàng đợi theo phiên xả về không
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Lane hẹp cho theo dõi hồi quy độ ổn định, không phải thay thế cho toàn bộ bộ Gateway

### E2E (smoke gateway)

- Lệnh: `pnpm test:e2e`
- Cấu hình: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và các bài kiểm thử E2E của bundled-plugin trong `extensions/`
- Mặc định thời gian chạy:
  - Sử dụng Vitest `threads` với `isolate: false`, khớp với phần còn lại của repo.
  - Sử dụng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Chạy ở chế độ im lặng theo mặc định để giảm chi phí I/O console.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để ép số lượng worker (giới hạn ở 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra console chi tiết.
- Phạm vi:
  - Hành vi Gateway end-to-end nhiều instance
  - Bề mặt WebSocket/HTTP, ghép cặp node, và mạng nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không yêu cầu khóa thật
  - Nhiều thành phần chuyển động hơn bài kiểm thử đơn vị (có thể chậm hơn)

### E2E: kiểm tra khói backend OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Khởi động một Gateway OpenShell cô lập trên host qua Docker
  - Tạo một sandbox từ Dockerfile cục bộ tạm thời
  - Kiểm thử backend OpenShell của OpenClaw qua `sandbox ssh-config` thật + SSH exec
  - Xác minh hành vi hệ thống tệp remote-canonical thông qua cầu nối fs của sandbox
- Kỳ vọng:
  - Chỉ opt-in; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cùng một Docker daemon hoạt động
  - Sử dụng `HOME` / `XDG_CONFIG_HOME` cô lập, rồi hủy Gateway kiểm thử và sandbox
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật bài kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới binary CLI hoặc script wrapper không mặc định

### Live (provider thật + model thật)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các bài kiểm thử live của bundled-plugin trong `extensions/`
- Mặc định: **được bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - “Provider/model này có thực sự hoạt động _hôm nay_ với credential thật không?”
  - Bắt các thay đổi định dạng provider, điểm bất thường khi gọi tool, vấn đề xác thực, và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế không ổn định cho CI (mạng thật, chính sách provider thật, quota, sự cố)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con đã thu hẹp thay vì “mọi thứ”
- Các lần chạy live source `~/.profile` để lấy các API key còn thiếu.
- Theo mặc định, các lần chạy live vẫn cô lập `HOME` và sao chép vật liệu cấu hình/xác thực vào một home kiểm thử tạm thời để fixture đơn vị không thể thay đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn chủ ý cần các bài kiểm thử live dùng thư mục home thật của mình.
- `pnpm test:live` hiện mặc định ở chế độ yên tĩnh hơn: nó giữ đầu ra tiến trình `[live] ...`, nhưng ẩn thông báo `~/.profile` bổ sung và tắt log bootstrap Gateway/tiếng ồn Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn bật lại toàn bộ log khởi động.
- Luân phiên API key (theo provider): đặt `*_API_KEYS` với định dạng dấu phẩy/dấu chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè riêng cho live qua `OPENCLAW_LIVE_*_KEY`; các bài kiểm thử thử lại khi có phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ live hiện phát dòng tiến trình ra stderr để các lệnh gọi provider dài hiển thị là vẫn đang hoạt động ngay cả khi capture console của Vitest yên tĩnh.
  - `vitest.live.config.ts` tắt việc chặn console của Vitest để các dòng tiến trình provider/Gateway stream ngay trong lúc chạy live.
  - Tinh chỉnh Heartbeat model trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Tinh chỉnh Heartbeat Gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ nào?

Dùng bảng quyết định này:

- Sửa logic/bài kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn thay đổi nhiều)
- Chạm tới mạng Gateway / giao thức WS / ghép cặp: thêm `pnpm test:e2e`
- Gỡ lỗi “bot của tôi bị down” / lỗi theo provider / gọi tool: chạy một `pnpm test:live` đã thu hẹp

## Các bài kiểm thử live (chạm mạng)

Đối với ma trận model live, kiểm tra khói backend CLI, kiểm tra khói ACP, harness app-server Codex, và tất cả bài kiểm thử live của provider media (Deepgram, BytePlus, ComfyUI, hình ảnh, nhạc, video, media harness) — cộng với xử lý credential cho các lần chạy live — xem [Kiểm thử bộ live](/vi/help/testing-live). Đối với danh sách kiểm tra chuyên dụng cho cập nhật và xác thực Plugin, xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Docker runner (các kiểm tra tùy chọn "hoạt động trên Linux")

Các Docker runner này chia thành hai nhóm:

- Runner live-model: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp live profile-key khớp trong image Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), mount thư mục cấu hình cục bộ và workspace của bạn (và source `~/.profile` nếu được mount). Các entrypoint cục bộ khớp là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Docker live runner mặc định dùng giới hạn smoke nhỏ hơn để một lượt quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các env var đó khi bạn
  chủ ý muốn lượt quét đầy đủ lớn hơn.
- `test:docker:all` build image Docker live một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần thành npm tarball thông qua `scripts/package-openclaw-for-docker.mjs`, rồi build/tái sử dụng hai image `scripts/e2e/Dockerfile`. Image trần chỉ là runner Node/Git cho các lane install/update/plugin-dependency; các lane đó mount tarball đã build sẵn. Image chức năng cài cùng tarball đó vào `/app` cho các lane chức năng built-app. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi plan đã chọn. Aggregate dùng một scheduler cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` kiểm soát slot tiến trình, trong khi giới hạn tài nguyên giữ cho các lane live nặng, npm-install, và multi-service không khởi động cùng lúc. Nếu một lane đơn lẻ nặng hơn các giới hạn đang hoạt động, scheduler vẫn có thể khởi động nó khi pool trống rồi giữ nó chạy một mình cho đến khi lại có capacity. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ tinh chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi host Docker có nhiều dư địa hơn. Runner thực hiện Docker preflight theo mặc định, xóa các container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời lượng lane thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời lượng đó để khởi động lane dài hơn trước trong những lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane có trọng số mà không build hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in plan CI cho các lane đã chọn, nhu cầu package/image, và credential.
- `Package Acceptance` là gate package native của GitHub cho "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó resolve một package ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải nó lên dưới dạng `package-under-test`, rồi chạy các lane Docker E2E tái sử dụng dựa trên đúng tarball đó thay vì đóng gói lại ref đã chọn. Các profile được sắp xếp theo độ rộng: `smoke`, `package`, `product`, và `full`. Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng package/update/Plugin, ma trận sống sót sau published-upgrade, mặc định phát hành, và phân loại lỗi.
- Các kiểm tra build và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Guard duyệt đồ thị build tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và thất bại nếu import khởi động trước dispatch nhập package dependency như Commander, prompt UI, undici, hoặc logging trước khi dispatch lệnh; nó cũng giữ chunk chạy Gateway đi kèm dưới ngân sách và từ chối import tĩnh của các đường dẫn Gateway lạnh đã biết. Kiểm tra khói CLI đã đóng gói cũng bao phủ root help, onboard help, doctor help, status, config schema, và lệnh model-list.
- Tương thích legacy của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Tới mốc đó, harness chỉ dung thứ các khoảng trống metadata của package đã phát hành: mục private QA inventory bị bỏ qua, thiếu `gateway install --wrapper`, thiếu tệp patch trong fixture git dẫn xuất từ tarball, thiếu `update.channel` đã lưu, vị trí install-record Plugin legacy, thiếu persistence install-record marketplace, và migration metadata cấu hình trong `plugins update`. Với các package sau `2026.4.25`, các đường dẫn đó là lỗi nghiêm ngặt.
- Runner kiểm tra khói container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.

Các Docker runner live-model cũng chỉ bind-mount những home xác thực CLI cần thiết (hoặc tất cả home được hỗ trợ khi lần chạy không bị thu hẹp), rồi sao chép chúng vào home container trước khi chạy để OAuth của CLI bên ngoài có thể làm mới token mà không thay đổi kho xác thực của host:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (tập lệnh: `scripts/test-live-models-docker.sh`)
- Kiểm thử khói liên kết ACP: `pnpm test:docker:live-acp-bind` (tập lệnh: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với bao phủ Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử khói backend CLI: `pnpm test:docker:live-cli-backend` (tập lệnh: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử khói bộ kiểm thử app-server Codex: `pnpm test:docker:live-codex-harness` (tập lệnh: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + tác nhân phát triển: `pnpm test:docker:live-gateway` (tập lệnh: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử khói khả năng quan sát: `pnpm qa:otel:smoke` là một luồng QA checkout mã nguồn riêng tư. Nó cố ý không thuộc các luồng phát hành Docker của gói vì gói tar npm bỏ qua QA Lab.
- Kiểm thử khói trực tiếp Open WebUI: `pnpm test:docker:openwebui` (tập lệnh: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, dựng khung đầy đủ): `pnpm test:docker:onboard` (tập lệnh: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử khói onboarding/kênh/tác nhân bằng gói tar npm: `pnpm test:docker:npm-onboard-channel-agent` cài đặt toàn cục gói tar OpenClaw đã đóng gói trong Docker, cấu hình OpenAI qua onboarding tham chiếu biến môi trường cùng Telegram theo mặc định, chạy doctor, rồi chạy một lượt tác nhân OpenAI giả lập. Tái sử dụng gói tar đã dựng sẵn bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bước dựng lại trên máy chủ bằng `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc đổi kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` hay `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Kiểm thử khói chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt toàn cục gói tar OpenClaw đã đóng gói trong Docker, chuyển từ gói `stable` sang git `dev`, xác minh kênh đã lưu và Plugin sau cập nhật hoạt động, rồi chuyển lại về gói `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử khói sống sót sau nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt gói tar OpenClaw đã đóng gói lên trên một fixture người dùng cũ không sạch với các tác nhân, cấu hình kênh, danh sách cho phép Plugin, trạng thái phụ thuộc Plugin cũ và các tệp workspace/session hiện có. Nó chạy cập nhật gói cùng doctor không tương tác mà không có provider trực tiếp hay khóa kênh, sau đó khởi động một Gateway loopback và kiểm tra việc bảo toàn cấu hình/trạng thái cùng ngân sách khởi động/trạng thái.
- Kiểm thử khói sống sót sau nâng cấp đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, gieo các tệp người dùng hiện có thực tế, cấu hình baseline đó bằng một công thức lệnh nhúng sẵn, xác thực cấu hình kết quả, cập nhật bản cài đã phát hành đó lên gói tar ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway loopback và kiểm tra intent đã cấu hình, bảo toàn trạng thái, khởi động, `/healthz`, `/readyz` và ngân sách trạng thái RPC. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các baseline cục bộ chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, và mở rộng các fixture theo dạng issue bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; tập reported-issues bao gồm `configured-plugin-installs` để tự động sửa cài đặt Plugin OpenClaw bên ngoài. Package Acceptance phơi bày các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` và `published_upgrade_survivor_scenarios`, phân giải các token baseline meta như `last-stable-4` hoặc `all-since-2026.4.23`, và Full Release Validation mở rộng cổng gói release-soak thành `last-stable-4 2026.4.23 2026.5.2 2026.4.15` cộng với `reported-issues`.
- Kiểm thử khói ngữ cảnh runtime của session: `pnpm test:docker:session-runtime-context` xác minh việc lưu bền bản ghi ngữ cảnh runtime ẩn cùng sửa chữa bằng doctor cho các nhánh viết lại prompt bị trùng lặp bị ảnh hưởng.
- Kiểm thử khói cài đặt toàn cục Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt nó bằng `bun install -g` trong một home biệt lập, và xác minh `openclaw infer image providers --json` trả về các provider hình ảnh được đóng gói thay vì bị treo. Tái sử dụng gói tar đã dựng sẵn bằng `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bước dựng trên máy chủ bằng `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một image Docker đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử khói Docker trình cài đặt: `bash scripts/test-install-sh-docker.sh` chia sẻ một cache npm giữa các container root, update và direct-npm. Kiểm thử khói cập nhật mặc định dùng npm `latest` làm baseline ổn định trước khi nâng cấp lên gói tar ứng viên. Ghi đè cục bộ bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, hoặc bằng đầu vào `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ một cache npm biệt lập để các mục cache do root sở hữu không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để tái sử dụng cache root/update/direct-npm giữa các lần chạy lại cục bộ.
- Install Smoke CI bỏ qua cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy tập lệnh cục bộ mà không có env đó khi cần bao phủ trực tiếp `npm install -g`.
- Kiểm thử khói CLI xóa workspace dùng chung của tác nhân: `pnpm test:docker:agents-delete-shared-workspace` (tập lệnh: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng image Dockerfile gốc, gieo hai tác nhân với một workspace trong home container biệt lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Tái sử dụng image install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + sức khỏe): `pnpm test:docker:gateway-network` (tập lệnh: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử khói snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (tập lệnh: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng image E2E từ nguồn cùng một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao phủ URL liên kết, phần tử có thể nhấp được thăng cấp từ con trỏ, tham chiếu iframe và siêu dữ liệu frame.
- Hồi quy suy luận tối thiểu OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (tập lệnh: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI giả lập qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, sau đó buộc schema provider từ chối và kiểm tra chi tiết thô xuất hiện trong nhật ký Gateway.
- Cầu nối kênh MCP (Gateway đã gieo + cầu stdio + kiểm thử khói frame thông báo Claude thô): `pnpm test:docker:mcp-channels` (tập lệnh: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP gói Pi (máy chủ MCP stdio thật + kiểm thử khói cho phép/từ chối profile Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (tập lệnh: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp Cron/tác nhân phụ MCP (Gateway thật + teardown tiến trình con MCP stdio sau các lần chạy cron biệt lập và tác nhân phụ một lần): `pnpm test:docker:cron-mcp-cleanup` (tập lệnh: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (kiểm thử khói cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc được hoist, ref git di chuyển, ClawHub kitchen-sink, cập nhật marketplace và bật/kiểm tra gói Claude): `pnpm test:docker:plugins` (tập lệnh: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp gói/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Nếu không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, kiểm thử dùng một máy chủ fixture ClawHub cục bộ khép kín.
- Kiểm thử khói cập nhật Plugin không đổi: `pnpm test:docker:plugin-update` (tập lệnh: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử khói ma trận vòng đời Plugin: `pnpm test:docker:plugin-lifecycle-matrix` cài đặt gói tar OpenClaw đã đóng gói trong một container trống, cài đặt một Plugin npm, bật/tắt, nâng cấp và hạ cấp nó qua một registry npm cục bộ, xóa mã đã cài đặt, rồi xác minh gỡ cài đặt vẫn xóa trạng thái cũ trong khi ghi lại chỉ số RSS/CPU cho từng giai đoạn vòng đời.
- Kiểm thử khói siêu dữ liệu tải lại cấu hình: `pnpm test:docker:config-reload` (tập lệnh: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` bao phủ kiểm thử khói cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc được hoist, ref git di chuyển, fixture ClawHub, cập nhật marketplace và bật/kiểm tra gói Claude. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không đổi cho các Plugin đã cài đặt. `pnpm test:docker:plugin-lifecycle-matrix` bao phủ cài đặt, bật, tắt, nâng cấp, hạ cấp Plugin npm có theo dõi tài nguyên và gỡ cài đặt khi thiếu mã.

Để dựng sẵn và tái sử dụng thủ công image chức năng dùng chung:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image riêng cho từng bộ như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ đến một image chia sẻ từ xa, các tập lệnh sẽ pull image đó nếu nó chưa có cục bộ. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi gói/cài đặt thay vì runtime ứng dụng đã dựng dùng chung.

Các trình chạy Docker mô hình trực tiếp cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Điều này giữ cho image runtime
gọn nhẹ trong khi vẫn chạy Vitest với đúng nguồn/cấu hình cục bộ của bạn.
Bước staging bỏ qua các cache lớn chỉ dùng cục bộ và output build ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục output `.build` cục bộ của ứng dụng hoặc
Gradle để các lần chạy Docker trực tiếp không mất nhiều phút sao chép
artifact riêng theo máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các probe trực tiếp của gateway không khởi động
worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền kèm
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi trực tiếp của gateway
khỏi lane Docker đó.
`test:docker:openwebui` là smoke tương thích cấp cao hơn: nó khởi động một
container gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI đã ghim trỏ đến gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` expose `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Lần chạy đầu tiên có thể chậm hơn đáng kể vì Docker có thể cần pull image
Open WebUI và Open WebUI có thể cần hoàn tất thiết lập cold-start riêng.
Lane này cần một khóa mô hình trực tiếp dùng được, và `OPENCLAW_PROFILE_FILE`
(mặc định là `~/.profile`) là cách chính để cung cấp khóa đó trong các lần chạy Docker hóa.
Các lần chạy thành công in ra một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính xác định và không cần tài khoản
Telegram, Discord, hoặc iMessage thật. Nó boot một container Gateway đã seed,
khởi động container thứ hai spawn `openclaw mcp serve`, rồi xác minh
khám phá cuộc trò chuyện đã route, đọc transcript, metadata tệp đính kèm,
hành vi hàng đợi sự kiện trực tiếp, route gửi outbound, và thông báo kênh +
quyền kiểu Claude qua cầu nối MCP stdio thật. Phần kiểm tra thông báo
kiểm tra trực tiếp các frame MCP stdio thô để smoke xác thực những gì
cầu nối thực sự phát ra, không chỉ những gì một SDK client cụ thể tình cờ hiển thị.
`test:docker:pi-bundle-mcp-tools` có tính xác định và không cần khóa mô hình trực tiếp.
Nó build image Docker của repo, khởi động một server probe MCP stdio thật
bên trong container, hiện thực hóa server đó qua runtime MCP bundle Pi nhúng,
thực thi công cụ, rồi xác minh `coding` và `messaging` giữ lại
công cụ `bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa mô hình trực tiếp.
Nó khởi động một Gateway đã seed với server probe MCP stdio thật, chạy một
lượt cron cô lập và một lượt con one-shot `/subagents spawn`, rồi xác minh
tiến trình con MCP thoát sau mỗi lần chạy.

Smoke luồng ngôn ngữ tự nhiên ACP thủ công (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow hồi quy/gỡ lỗi. Nó có thể lại cần thiết để xác thực route luồng ACP, vì vậy đừng xóa nó.

Các biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được source từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục cấu hình/workspace tạm thời và không mount auth CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các bản cài CLI được cache bên trong Docker
- Các thư mục/tệp auth CLI bên ngoài dưới `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi test bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy nhà cung cấp đã thu hẹp chỉ mount những thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc nhà cung cấp trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để tái sử dụng image `openclaw:local-live` hiện có cho các lần chạy lại không cần build lại
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo thông tin xác thực đến từ kho hồ sơ (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình được gateway expose cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce dùng bởi smoke Open WebUI
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã ghim

## Kiểm tra hợp lý tài liệu

Chạy kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra heading trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy offline (an toàn cho CI)

Đây là các hồi quy “pipeline thật” không dùng nhà cung cấp thật:

- Gọi công cụ Gateway (mock OpenAI, gateway thật + vòng lặp agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Trình hướng dẫn Gateway (WS `wizard.start`/`wizard.next`, ghi cấu hình + bắt buộc auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval độ tin cậy agent (skills)

Chúng ta đã có vài test an toàn cho CI hoạt động giống “eval độ tin cậy agent”:

- Gọi công cụ mock qua gateway thật + vòng lặp agent (`src/gateway/gateway.test.ts`).
- Luồng trình hướng dẫn end-to-end xác thực wiring phiên và hiệu lực cấu hình (`src/gateway/gateway.test.ts`).

Những gì vẫn còn thiếu cho skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi dùng và làm theo các bước/đối số bắt buộc không?
- **Hợp đồng workflow:** các kịch bản nhiều lượt assert thứ tự công cụ, việc mang lịch sử phiên sang lượt sau, và ranh giới sandbox.

Các eval trong tương lai nên ưu tiên tính xác định trước:

- Một trình chạy kịch bản dùng nhà cung cấp mock để assert lệnh gọi công cụ + thứ tự, đọc tệp skill, và wiring phiên.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng so với tránh, gating, prompt injection).
- Eval trực tiếp tùy chọn (opt-in, có gate bằng env) chỉ sau khi bộ an toàn cho CI đã có.

## Test hợp đồng (hình dạng Plugin và kênh)

Test hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ
hợp đồng giao diện của nó. Chúng lặp qua tất cả Plugin đã phát hiện và chạy một bộ
assertion về hình dạng và hành vi. Lane unit `pnpm test` mặc định cố ý
bỏ qua các tệp smoke và đường nối chung này; hãy chạy rõ ràng các lệnh hợp đồng
khi bạn chạm vào bề mặt kênh hoặc nhà cung cấp dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng nhà cung cấp: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng Plugin cơ bản (id, tên, năng lực)
- **setup** - Hợp đồng trình hướng dẫn thiết lập
- **session-binding** - Hành vi binding phiên
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn inbound
- **actions** - Handler hành động kênh
- **threading** - Xử lý ID luồng
- **directory** - API thư mục/roster
- **group-policy** - Thực thi chính sách nhóm

### Hợp đồng trạng thái nhà cung cấp

Nằm trong `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe trạng thái kênh
- **registry** - Hình dạng registry Plugin

### Hợp đồng nhà cung cấp

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng luồng auth
- **auth-choice** - Lựa chọn/chọn auth
- **catalog** - API catalog mô hình
- **discovery** - Khám phá Plugin
- **loader** - Tải Plugin
- **runtime** - Runtime nhà cung cấp
- **shape** - Hình dạng/giao diện Plugin
- **wizard** - Trình hướng dẫn thiết lập

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa đổi một Plugin kênh hoặc nhà cung cấp
- Sau khi refactor đăng ký hoặc khám phá Plugin

Test hợp đồng chạy trong CI và không yêu cầu khóa API thật.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề nhà cung cấp/mô hình được phát hiện trong chạy trực tiếp:

- Thêm hồi quy an toàn cho CI nếu có thể (mock/stub nhà cung cấp, hoặc capture đúng phép biến đổi hình dạng yêu cầu)
- Nếu vấn đề vốn chỉ xuất hiện trực tiếp (giới hạn tốc độ, chính sách auth), giữ test trực tiếp hẹp và opt-in qua biến môi trường
- Ưu tiên nhắm vào lớp nhỏ nhất bắt được lỗi:
  - lỗi chuyển đổi/phát lại yêu cầu nhà cung cấp → test mô hình trực tiếp
  - lỗi pipeline phiên/lịch sử/công cụ của gateway → smoke gateway trực tiếp hoặc test mock gateway an toàn cho CI
- Lan can traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một target được lấy mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi assert các exec id có đoạn traversal bị từ chối.
  - Nếu bạn thêm một họ target SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong test đó. Test cố ý thất bại với target id chưa phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Kiểm thử trực tiếp](/vi/help/testing-live)
- [Kiểm thử bản cập nhật và Plugin](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
