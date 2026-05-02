---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm kiểm thử hồi quy cho các lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi Gateway + tác tử
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử đơn vị/đầu cuối-đến-đầu cuối/trực tiếp, trình chạy Docker và phạm vi bao quát của từng kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-02T20:45:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (unit/integration, e2e, live) và một nhóm nhỏ
các trình chạy Docker. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ kiểm thử bao phủ những gì (và những gì nó chủ ý _không_ bao phủ).
- Các lệnh cần chạy cho những quy trình làm việc phổ biến (cục bộ, trước khi push, gỡ lỗi).
- Cách các kiểm thử live phát hiện thông tin xác thực và chọn model/provider.
- Cách thêm hồi quy cho các sự cố model/provider trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các làn live transport)** được ghi lại riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) — kiến trúc, bề mặt lệnh, tạo kịch bản.
- [Matrix QA](/vi/concepts/qa-matrix) — tham chiếu cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) — plugin transport tổng hợp được các kịch bản dựa trên repo sử dụng.

Trang này bao gồm việc chạy các bộ kiểm thử thông thường và các trình chạy Docker/Parallels. Phần trình chạy dành riêng cho QA bên dưới ([trình chạy dành riêng cho QA](#qa-specific-runners)) liệt kê các lời gọi `qa` cụ thể và trỏ lại các tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng kiểm tra đầy đủ (được kỳ vọng trước khi push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy có nhiều tài nguyên: `pnpm test:max`
- Vòng lặp theo dõi Vitest trực tiếp: `pnpm test:watch`
- Nhắm mục tiêu tệp trực tiếp hiện cũng định tuyến các đường dẫn extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên các lần chạy có mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Trang QA dựa trên Docker: `pnpm qa:lab:up`
- Làn QA dựa trên Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng kiểm tra độ bao phủ: `pnpm test:coverage`
- Bộ E2E: `pnpm test:e2e`

Khi gỡ lỗi provider/model thực (yêu cầu thông tin xác thực thực):

- Bộ live (model + các probe công cụ/hình ảnh Gateway): `pnpm test:live`
- Nhắm mục tiêu một tệp live trong chế độ yên lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng runtime: dispatch `OpenClaw Performance` với
  `live_gpt54=true` cho một lượt agent `openai/gpt-5.4` thực hoặc
  `deep_profile=true` cho artifact CPU/heap/trace của Kova. Các lần chạy theo lịch hằng ngày
  publish artifact của các làn mock-provider, deep-profile và GPT 5.4 lên
  `openclaw/clawgrit-reports` khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình. Báo cáo
  mock-provider cũng bao gồm các số liệu cấp nguồn về khởi động gateway, bộ nhớ,
  áp lực plugin, vòng lặp hello bằng fake-model lặp lại, và khởi động CLI.
- Quét model live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi model được chọn hiện chạy một lượt văn bản cộng với một probe nhỏ kiểu đọc tệp.
    Các model có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các probe bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi provider.
  - Độ bao phủ CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận model live Docker riêng
    được chia shard theo provider.
  - Để chạy lại CI có trọng tâm, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm các secret provider có tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng với `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các caller
    theo lịch/release của nó.
- Smoke bound-chat Codex native: `pnpm test:docker:live-codex-bind`
  - Chạy một làn Docker live trên đường dẫn app-server Codex, bind một
    Slack DM tổng hợp bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một trả lời thuần và một attachment hình ảnh
    định tuyến qua binding plugin native thay vì ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt agent gateway qua harness app-server Codex do plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và mặc định thực thi các probe hình ảnh,
    cron MCP, sub-agent và Guardian. Tắt probe sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi app-server Codex
    khác. Để kiểm tra sub-agent có trọng tâm, tắt các probe khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Lệnh này thoát sau probe sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Smoke lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra phòng vệ nhiều lớp có chọn tham gia cho bề mặt lệnh cứu hộ message-channel.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi model bền vững,
    trả lời `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong một container không có cấu hình với Claude CLI giả trên `PATH`
    và xác minh fallback planner mờ được chuyển thành một lần ghi config có kiểu đã được audit.
- Smoke Docker lần chạy đầu tiên của Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, định tuyến `openclaw` trần đến
    Crestodian, áp dụng các ghi setup/model/agent/plugin Discord + SecretRef,
    xác thực cấu hình, và xác minh các mục audit. Cùng đường dẫn thiết lập Ring 0 cũng
    được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, sau đó chạy một
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  cô lập trên `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và
  transcript assistant lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một trường hợp lỗi, hãy ưu tiên thu hẹp kiểm thử live bằng các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Trình chạy dành riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần tính chân thực của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. Agentic parity được lồng dưới
`QA-Lab - All Lanes` và xác thực release, không phải một workflow PR độc lập.
Xác thực rộng nên dùng `Full Release Validation` với
`rerun_group=qa-parity` hoặc nhóm QA của release-checks. `QA-Lab - All Lanes`
chạy hằng đêm trên `main` và từ dispatch thủ công với làn mock parity, làn
Matrix live, làn Telegram live do Convex quản lý, và làn Discord live
do Convex quản lý dưới dạng các job song song. QA theo lịch và release checks truyền Matrix
`--profile fast` một cách rõ ràng, trong khi CLI Matrix và đầu vào workflow thủ công
mặc định vẫn là `all`; dispatch thủ công có thể chia shard `all` thành các job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`. `OpenClaw Release
Checks` chạy parity cộng với các làn Matrix nhanh và Telegram trước khi phê duyệt
release, dùng `mock-openai/gpt-5.5` cho các kiểm tra release transport để chúng luôn
xác định và tránh khởi động provider-plugin thông thường. Các gateway live transport này
tắt tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ QA parity.

Các shard live media của full release dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard model/backend live Docker dùng image dùng chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi commit được chọn,
sau đó pull nó với `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì rebuild
bên trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy trực tiếp các kịch bản QA dựa trên repo trên máy chủ.
  - Theo mặc định, chạy song song nhiều kịch bản đã chọn với các worker
    Gateway cô lập. `qa-channel` mặc định concurrency là 4 (bị giới hạn bởi số
    lượng kịch bản đã chọn). Dùng `--concurrency <count>` để điều chỉnh số
    worker, hoặc `--concurrency 1` cho luồng tuần tự cũ hơn.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Hỗ trợ các chế độ provider `live-frontier`, `mock-openai` và `aimock`.
    `aimock` khởi động một máy chủ provider cục bộ dựa trên AIMock cho phạm vi
    fixture thử nghiệm và mock giao thức mà không thay thế luồng `mock-openai`
    nhận biết kịch bản.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy benchmark khởi động Gateway cùng một gói kịch bản QA Lab mock nhỏ
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi một bản tóm tắt quan sát CPU kết hợp
    trong `.artifacts/gateway-cpu-scenarios/`.
  - Theo mặc định, chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cùng `--hot-wall-warn-ms`), vì vậy các đợt tăng ngắn lúc khởi động được ghi
    nhận dưới dạng chỉ số mà không trông giống hồi quy Gateway bị ghim CPU trong nhiều phút.
  - Dùng artifact `dist` đã build; hãy chạy build trước khi checkout chưa có
    output runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA bên trong một VM Linux Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên máy chủ.
  - Tái sử dụng cùng các cờ chọn provider/model như `qa suite`.
  - Các lượt chạy live chuyển tiếp những đầu vào xác thực QA được hỗ trợ và thực tế cho guest:
    khóa provider dựa trên env, đường dẫn cấu hình provider live của QA, và `CODEX_HOME`
    khi có.
  - Thư mục output phải nằm dưới root repo để guest có thể ghi ngược lại qua
    workspace đã mount.
  - Ghi báo cáo QA + tóm tắt thông thường cùng log Multipass trong
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA dựa trên Docker cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt toàn cục trong
    Docker, chạy onboarding OpenAI API-key không tương tác, cấu hình Telegram
    theo mặc định, xác minh runtime Plugin đã đóng gói tải mà không cần sửa
    dependency lúc khởi động, chạy doctor, và chạy một lượt agent cục bộ với
    endpoint OpenAI mock.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng luồng cài đặt gói
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một smoke Docker app đã build có tính quyết định cho transcript ngữ cảnh runtime nhúng.
    Nó xác minh ngữ cảnh runtime OpenClaw ẩn được lưu dưới dạng message tùy chỉnh
    không hiển thị thay vì rò rỉ vào lượt người dùng hiển thị, sau đó seed một
    session JSONL hỏng bị ảnh hưởng và xác minh
    `openclaw doctor --fix` viết lại nó sang branch đang hoạt động kèm bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên package OpenClaw trong Docker, chạy onboarding
    package đã cài đặt, cấu hình Telegram qua CLI đã cài đặt, rồi tái sử dụng
    luồng QA Telegram live với package đã cài đặt đó làm SUT Gateway.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã resolve thay vì
    cài từ registry.
  - Dùng cùng thông tin đăng nhập env Telegram hoặc nguồn thông tin đăng nhập Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/release, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cùng
    `OPENCLAW_QA_CONVEX_SITE_URL` và role secret. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một Convex role secret có mặt trong CI,
    wrapper Docker tự động chọn Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho luồng này.
  - GitHub Actions hiển thị luồng này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và các lease thông tin đăng nhập Convex CI.
- GitHub Actions cũng hiển thị `Package Acceptance` để chạy phụ bằng chứng sản phẩm
  đối với một package ứng viên. Nó chấp nhận một ref tin cậy, spec npm đã phát hành,
  URL tarball HTTPS cộng SHA-256, hoặc artifact tarball từ một lượt chạy khác, upload
  `openclaw-current.tgz` đã chuẩn hóa dưới dạng `package-under-test`, rồi chạy
  scheduler Docker E2E hiện có với các profile luồng smoke, package, product, full hoặc custom.
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

- Bằng chứng artifact tải xuống một artifact tarball từ lượt chạy Actions khác:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Đóng gói và cài đặt bản build OpenClaw hiện tại trong Docker, khởi động Gateway
    với OpenAI đã cấu hình, rồi bật các channel/Plugin được bundle qua chỉnh sửa config.
  - Xác minh quá trình khám phá setup để các Plugin có thể tải xuống nhưng chưa cấu hình vắng mặt,
    lần sửa doctor đã cấu hình đầu tiên cài đặt rõ ràng từng Plugin có thể tải xuống bị thiếu,
    và lần khởi động lại thứ hai không chạy sửa dependency ẩn.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của ứng viên
    dọn sạch mảnh vụn dependency Plugin legacy mà không có sửa postinstall phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật cài đặt gói native trên các guest Parallels. Mỗi
    nền tảng đã chọn trước tiên cài đặt package baseline được yêu cầu, sau đó chạy
    lệnh `openclaw update` đã cài đặt trong cùng guest và xác minh phiên bản
    đã cài đặt, trạng thái cập nhật, mức sẵn sàng của Gateway, và một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một guest. Dùng `--json` cho đường dẫn artifact tóm tắt và
    trạng thái theo từng luồng.
  - Luồng OpenAI dùng `openai/gpt-5.5` cho bằng chứng lượt agent live theo
    mặc định. Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi cố ý xác thực một model OpenAI khác.
  - Bọc các lượt chạy cục bộ dài trong timeout máy chủ để các lần treo transport Parallels không
    tiêu tốn phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi log luồng lồng nhau trong `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi cho rằng wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong doctor sau cập nhật và công việc
    cập nhật package trên guest lạnh; điều đó vẫn khỏe mạnh khi log debug npm
    lồng nhau đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với các luồng smoke Parallels
    macOS, Windows hoặc Linux riêng lẻ. Chúng chia sẻ trạng thái VM và có thể va chạm khi
    khôi phục snapshot, phục vụ package, hoặc trạng thái Gateway của guest.
  - Bằng chứng sau cập nhật chạy bề mặt Plugin bundle thông thường vì
    các facade năng lực như speech, image generation và media
    understanding được tải qua các API runtime bundle ngay cả khi lượt agent
    tự nó chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ provider AIMock cục bộ để kiểm thử smoke giao thức trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy luồng QA live Matrix với một Tuwunel homeserver dùng một lần dựa trên Docker. Chỉ dành cho source-checkout — cài đặt đóng gói không phân phối `qa-lab`.
  - CLI đầy đủ, catalog profile/kịch bản, biến env, và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy luồng QA live Telegram với một nhóm riêng tư thật bằng token bot driver và SUT từ env.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID nhóm phải là ID chat Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin đăng nhập pooled dùng chung. Dùng chế độ env theo mặc định, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng lease pooled.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng nhóm riêng tư, với bot SUT hiển thị username Telegram.
  - Để quan sát bot-đến-bot ổn định, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và đảm bảo bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, tóm tắt, và artifact message đã quan sát trong `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT được quan sát.

Các luồng transport live dùng chung một hợp đồng chuẩn để transport mới không bị lệch; ma trận phạm vi theo từng luồng nằm trong [tổng quan QA → Phạm vi transport live](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ tổng hợp mô phỏng rộng và không thuộc ma trận đó.

### Thông tin đăng nhập Telegram dùng chung qua Convex (v1)

Khi `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) được bật cho
`openclaw qa telegram`, QA lab lấy một lease độc quyền từ pool dựa trên Convex, heartbeat
lease đó trong khi luồng đang chạy, và giải phóng lease khi tắt.

Scaffold dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Biến env bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho role đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn role thông tin đăng nhập:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định env: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, ngược lại là `maintainer`)

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

Trình trợ giúp CLI cho maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lượt chạy live để kiểm tra URL site Convex, secret broker,
tiền tố endpoint, timeout HTTP, và khả năng truy cập admin/list mà không in
giá trị secret. Dùng `--json` cho output máy đọc được trong script và tiện ích CI.

Hợp đồng điểm cuối mặc định (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Yêu cầu: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Thành công: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Đã cạn/có thể thử lại: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - Chốt chặn phiên thuê đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ bí mật của người bảo trì)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Dạng tải trọng cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi mã định danh cuộc trò chuyện Telegram dạng số.
- `admin/add` xác thực dạng này cho `kind: "telegram"` và từ chối các tải trọng sai định dạng.

### Thêm một kênh vào QA

Kiến trúc và tên trình trợ giúp kịch bản cho bộ chuyển đổi kênh mới nằm trong [Tổng quan QA → Thêm một kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai trình chạy truyền tải trên ranh giới máy chủ `qa-lab` dùng chung, khai báo `qaRunners` trong bản kê khai Plugin, gắn dưới dạng `openclaw qa <runner>`, và viết kịch bản trong `qa/scenarios/`.

## Bộ kiểm thử (chạy ở đâu)

Hãy xem các bộ này như “độ chân thực tăng dần” (đồng thời độ thiếu ổn định/chi phí cũng tăng):

### Đơn vị / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng tập phân mảnh `vitest.full-*.config.ts` và có thể mở rộng các phân mảnh nhiều dự án thành cấu hình theo từng dự án để lập lịch song song
- Tệp: kho kiểm kê lõi/đơn vị trong `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử đơn vị giao diện người dùng chạy trong phân mảnh chuyên dụng `unit-ui`
- Phạm vi:
  - Kiểm thử đơn vị thuần túy
  - Kiểm thử tích hợp trong tiến trình (xác thực Gateway, định tuyến, công cụ, phân tích cú pháp, cấu hình)
  - Hồi quy xác định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không yêu cầu khóa thật
  - Nên nhanh và ổn định
  - Các kiểm thử bộ phân giải và trình nạp bề mặt công khai phải chứng minh hành vi dự phòng rộng của `api.js` và
    `runtime-api.js` bằng các fixture Plugin nhỏ được sinh ra, không phải
    API nguồn Plugin đóng gói thật. Việc tải API Plugin thật thuộc về
    các bộ kiểm thử hợp đồng/tích hợp do Plugin sở hữu.

<AccordionGroup>
  <Accordion title="Dự án, phân mảnh và luồng theo phạm vi">

    - `pnpm test` không nhắm mục tiêu chạy mười hai cấu hình phân mảnh nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình dự án gốc bản địa khổng lồ. Cách này giảm RSS đỉnh trên các máy tải nặng và tránh để công việc tự động trả lời/Plugin làm thiếu tài nguyên cho các bộ không liên quan.
    - `pnpm test --watch` vẫn dùng đồ thị dự án gốc bản địa `vitest.config.ts`, vì vòng lặp theo dõi nhiều phân mảnh không thực tế.
    - `pnpm test`, `pnpm test:watch`, và `pnpm test:perf:imports` định tuyến các mục tiêu tệp/thư mục rõ ràng qua các luồng theo phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả chi phí khởi động toàn bộ dự án gốc.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các luồng theo phạm vi rẻ: chỉnh sửa trực tiếp kiểm thử, các tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng, và các phụ thuộc đồ thị nhập cục bộ. Chỉnh sửa cấu hình/thiết lập/gói không chạy rộng các kiểm thử trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh bình thường cho công việc hẹp. Nó phân loại diff thành lõi, kiểm thử lõi, Plugin, kiểm thử Plugin, ứng dụng, tài liệu, siêu dữ liệu phát hành, công cụ Docker trực tiếp, và công cụ, rồi chạy các lệnh kiểm tra kiểu, lint và chốt chặn tương ứng. Nó không chạy kiểm thử Vitest; gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các lần tăng phiên bản chỉ siêu dữ liệu phát hành chạy kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu, với chốt chặn từ chối thay đổi gói bên ngoài trường phiên bản cấp cao nhất.
    - Các chỉnh sửa bộ khung Docker ACP trực tiếp chạy kiểm tra tập trung: cú pháp shell cho các tập lệnh xác thực Docker trực tiếp và chạy thử khô bộ lập lịch Docker trực tiếp. Thay đổi `package.json` chỉ được đưa vào khi diff giới hạn ở `scripts["test:docker:live-*"]`; phụ thuộc, xuất, phiên bản và các chỉnh sửa bề mặt gói khác vẫn dùng các chốt chặn rộng hơn.
    - Kiểm thử đơn vị nhẹ về nhập từ tác tử, lệnh, Plugin, trình trợ giúp tự động trả lời, `plugin-sdk`, và các khu vực tiện ích thuần túy tương tự được định tuyến qua luồng `unit-fast`, bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng về thời gian chạy vẫn ở các luồng hiện có.
    - Một số tệp nguồn trình trợ giúp `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy chế độ thay đổi tới các kiểm thử cùng cấp rõ ràng trong các luồng nhẹ đó, nên chỉnh sửa trình trợ giúp tránh chạy lại toàn bộ bộ nặng cho thư mục đó.
    - `auto-reply` có các nhóm chuyên dụng cho trình trợ giúp lõi cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất, và cây con `src/auto-reply/reply/**`. CI còn chia cây con trả lời thành các phân mảnh trình chạy tác tử, điều phối, và lệnh/định tuyến trạng thái để một nhóm nặng về nhập không chiếm toàn bộ phần đuôi Node.
    - CI PR/main bình thường cố ý bỏ qua lần quét lô Plugin và phân mảnh chỉ phát hành `agentic-plugins`. Xác thực Phát hành Đầy đủ kích hoạt quy trình con `Plugin Prerelease` riêng cho các bộ nặng về Plugin/extension đó trên các ứng viên phát hành.

  </Accordion>

  <Accordion title="Độ phủ trình chạy nhúng">

    - Khi bạn thay đổi đầu vào khám phá công cụ thông điệp hoặc ngữ cảnh thời gian chạy
      Compaction, hãy giữ cả hai mức độ phủ.
    - Thêm hồi quy trình trợ giúp tập trung cho các ranh giới định tuyến và chuẩn hóa
      thuần túy.
    - Giữ các bộ tích hợp trình chạy nhúng khỏe mạnh:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ đó xác minh rằng mã định danh theo phạm vi và hành vi Compaction vẫn đi
      qua các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ trình trợ giúp
      không đủ để thay thế các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Nhóm Vitest và mặc định cô lập">

    - Cấu hình Vitest cơ sở mặc định là `threads`.
    - Cấu hình Vitest dùng chung cố định `isolate: false` và dùng trình chạy
      không cô lập trên các dự án gốc, e2e, và cấu hình trực tiếp.
    - Luồng giao diện người dùng gốc giữ thiết lập `jsdom` và bộ tối ưu của nó, nhưng cũng chạy trên
      trình chạy không cô lập dùng chung.
    - Mỗi phân mảnh `pnpm test` kế thừa cùng các mặc định `threads` + `isolate: false`
      từ cấu hình Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình Node con
      của Vitest để giảm biến động biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8
      mặc định.

  </Accordion>

  <Accordion title="Lặp cục bộ nhanh">

    - `pnpm changed:lanes` hiển thị các luồng kiến trúc mà một diff kích hoạt.
    - Hook trước commit chỉ định dạng. Nó đưa lại các tệp đã định dạng vào vùng staged và
      không chạy lint, kiểm tra kiểu, hoặc kiểm thử.
    - Chạy rõ ràng `pnpm check:changed` trước khi bàn giao hoặc đẩy khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các luồng theo phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi tác tử
      quyết định rằng chỉnh sửa bộ khung, cấu hình, gói, hoặc hợp đồng thật sự cần
      độ phủ Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ nguyên hành vi định tuyến,
      chỉ với giới hạn tiến trình làm việc cao hơn.
    - Tự động co giãn tiến trình làm việc cục bộ cố ý thận trọng và lùi lại
      khi mức tải trung bình của máy chủ đã cao, nên nhiều lần chạy Vitest
      đồng thời mặc định gây ít thiệt hại hơn.
    - Cấu hình Vitest cơ sở đánh dấu các tệp dự án/cấu hình là
      `forceRerunTriggers` để các lần chạy lại chế độ thay đổi vẫn đúng khi dây nối kiểm thử
      thay đổi.
    - Cấu hình giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` được bật trên các
      máy chủ được hỗ trợ; đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí bộ nhớ đệm rõ ràng cho việc lập hồ sơ trực tiếp.

  </Accordion>

  <Accordion title="Gỡ lỗi hiệu năng">

    - `pnpm test:perf:imports` bật báo cáo thời lượng nhập của Vitest cùng
      đầu ra phân tích nhập.
    - `pnpm test:perf:imports:changed` giới hạn cùng góc nhìn lập hồ sơ đó vào
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian phân mảnh được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn bộ cấu hình dùng đường dẫn cấu hình làm khóa; các phân mảnh CI
      theo mẫu bao gồm thêm tên phân mảnh để có thể theo dõi riêng
      các phân mảnh đã lọc.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho nhập lúc khởi động,
      hãy đặt các phụ thuộc nặng phía sau ranh giới cục bộ hẹp `*.runtime.ts` và
      mô phỏng trực tiếp ranh giới đó thay vì nhập sâu các trình trợ giúp thời gian chạy chỉ
      để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn dự án gốc bản địa cho diff đã commit
      đó và in thời gian thực cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` đo cây làm việc bẩn hiện tại
      bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và cấu hình Vitest gốc.
    - `pnpm test:perf:profile:main` ghi hồ sơ CPU luồng chính cho
      chi phí khởi động và biến đổi của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi hồ sơ CPU+bộ nhớ heap của trình chạy cho
      bộ đơn vị khi tắt song song theo tệp.

  </Accordion>
</AccordionGroup>

### Độ ổn định (Gateway)

- Lệnh: `pnpm test:stability:gateway`
- Cấu hình: `vitest.gateway.config.ts`, buộc dùng một tiến trình làm việc
- Phạm vi:
  - Khởi động một Gateway vòng lặp cục bộ thật với chẩn đoán được bật theo mặc định
  - Đẩy biến động thông điệp Gateway tổng hợp, bộ nhớ, và tải trọng lớn qua đường dẫn sự kiện chẩn đoán
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các trình trợ giúp lưu bền gói chẩn đoán độ ổn định
  - Xác nhận bộ ghi vẫn bị giới hạn, các mẫu RSS tổng hợp ở dưới ngân sách áp lực, và độ sâu hàng đợi theo phiên rút về không
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Luồng hẹp cho theo dõi hồi quy độ ổn định, không phải thay thế cho toàn bộ bộ Gateway

### E2E (khói Gateway)

- Lệnh: `pnpm test:e2e`
- Cấu hình: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và các kiểm thử E2E Plugin đóng gói trong `extensions/`
- Mặc định thời gian chạy:
  - Dùng `threads` của Vitest với `isolate: false`, khớp với phần còn lại của kho.
  - Dùng tiến trình làm việc thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ im lặng để giảm chi phí I/O bảng điều khiển.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để buộc số lượng tiến trình làm việc (giới hạn ở 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra bảng điều khiển chi tiết.
- Phạm vi:
  - Hành vi đầu cuối Gateway nhiều phiên bản
  - Bề mặt WebSocket/HTTP, ghép đôi Node, và mạng nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong quy trình)
  - Không yêu cầu khóa thật
  - Nhiều phần chuyển động hơn kiểm thử đơn vị (có thể chậm hơn)

### E2E: kiểm thử khói phần backend OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Khởi động một Gateway OpenShell cô lập trên máy chủ thông qua Docker
  - Tạo một môi trường cách ly từ Dockerfile cục bộ tạm thời
  - Kiểm tra backend OpenShell của OpenClaw qua `sandbox ssh-config` thực + thực thi SSH
  - Xác minh hành vi hệ thống tệp chuẩn hóa theo máy từ xa thông qua cầu nối hệ thống tệp của môi trường cách ly
- Kỳ vọng:
  - Chỉ bật khi chọn tham gia; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cùng một daemon Docker đang hoạt động
  - Dùng `HOME` / `XDG_CONFIG_HOME` cô lập, sau đó hủy Gateway kiểm thử và môi trường cách ly
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ đến tệp nhị phân CLI không mặc định hoặc script bọc

### Trực tiếp (nhà cung cấp thật + mô hình thật)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các kiểm thử trực tiếp của Plugin đóng gói trong `extensions/`
- Mặc định: **được bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - “Nhà cung cấp/mô hình này có thật sự hoạt động _hôm nay_ với thông tin xác thực thật không?”
  - Bắt các thay đổi định dạng của nhà cung cấp, điểm đặc thù khi gọi công cụ, vấn đề xác thực, và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế không ổn định cho CI (mạng thật, chính sách nhà cung cấp thật, hạn ngạch, sự cố ngừng dịch vụ)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con thu hẹp thay vì “mọi thứ”
- Các lần chạy trực tiếp nạp `~/.profile` để lấy các khóa API còn thiếu.
- Theo mặc định, các lần chạy trực tiếp vẫn cô lập `HOME` và sao chép vật liệu cấu hình/xác thực vào thư mục nhà kiểm thử tạm thời để fixture đơn vị không thể thay đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn chủ ý cần các kiểm thử trực tiếp dùng thư mục nhà thật của mình.
- `pnpm test:live` hiện mặc định ở chế độ yên tĩnh hơn: vẫn giữ đầu ra tiến trình `[live] ...`, nhưng ẩn thông báo `~/.profile` bổ sung và tắt nhật ký khởi động Gateway/trao đổi Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn bật lại đầy đủ nhật ký khởi động.
- Xoay vòng khóa API (theo từng nhà cung cấp): đặt `*_API_KEYS` với định dạng phân tách bằng dấu phẩy/dấu chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè theo từng lần chạy trực tiếp qua `OPENCLAW_LIVE_*_KEY`; kiểm thử sẽ thử lại khi nhận phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ kiểm thử trực tiếp hiện phát các dòng tiến trình ra stderr để các lệnh gọi nhà cung cấp kéo dài vẫn hiển thị là đang hoạt động ngay cả khi cơ chế thu console của Vitest im lặng.
  - `vitest.live.config.ts` tắt chặn console của Vitest để các dòng tiến trình của nhà cung cấp/Gateway được phát ngay trong các lần chạy trực tiếp.
  - Điều chỉnh Heartbeat mô hình trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Điều chỉnh Heartbeat Gateway/thăm dò bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ nào?

Dùng bảng quyết định này:

- Sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn đã thay đổi nhiều)
- Chạm đến mạng Gateway / giao thức WS / ghép cặp: thêm `pnpm test:e2e`
- Gỡ lỗi “bot của tôi bị ngừng” / lỗi theo nhà cung cấp / gọi công cụ: chạy một `pnpm test:live` đã thu hẹp

## Kiểm thử trực tiếp (chạm mạng)

Đối với ma trận mô hình trực tiếp, smoke backend CLI, smoke ACP, bộ khung
máy chủ ứng dụng Codex, và mọi kiểm thử trực tiếp nhà cung cấp media (Deepgram, BytePlus, ComfyUI, hình ảnh,
nhạc, video, bộ khung media) — cùng xử lý thông tin xác thực cho các lần chạy trực tiếp — xem
[Kiểm thử các bộ trực tiếp](/vi/help/testing-live). Đối với danh sách kiểm chuyên biệt cho cập nhật và
xác thực Plugin, xem
[Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Trình chạy Docker (kiểm tra tùy chọn "hoạt động trên Linux")

Các trình chạy Docker này chia thành hai nhóm:

- Trình chạy mô hình trực tiếp: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp trực tiếp khóa hồ sơ tương ứng bên trong ảnh Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), gắn thư mục cấu hình cục bộ và không gian làm việc của bạn (và nạp `~/.profile` nếu được gắn). Các điểm vào cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Các trình chạy trực tiếp Docker mặc định dùng giới hạn smoke nhỏ hơn để một lượt quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các biến môi trường đó khi bạn
  chủ ý muốn quét toàn diện lớn hơn.
- `test:docker:all` dựng ảnh Docker trực tiếp một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần thành tarball npm thông qua `scripts/package-openclaw-for-docker.mjs`, rồi dựng/tái sử dụng hai ảnh `scripts/e2e/Dockerfile`. Ảnh trần chỉ là trình chạy Node/Git cho các làn cài đặt/cập nhật/phụ thuộc Plugin; các làn đó gắn tarball đã dựng sẵn. Ảnh chức năng cài cùng tarball vào `/app` cho các làn chức năng ứng dụng đã dựng. Định nghĩa làn Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Bộ tổng hợp dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` kiểm soát các ô tiến trình, trong khi giới hạn tài nguyên ngăn các làn trực tiếp nặng, cài đặt npm, và đa dịch vụ cùng khởi động một lúc. Nếu một làn đơn lẻ nặng hơn các giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động nó khi nhóm trống rồi giữ nó chạy một mình cho đến khi lại có dung lượng. Mặc định là 10 ô, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ điều chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi máy chủ Docker còn nhiều dư địa hơn. Trình chạy mặc định thực hiện kiểm tra sơ bộ Docker, xóa các container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời lượng làn thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời lượng đó để khởi động các làn dài hơn trước trong những lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in bản kê làn có trọng số mà không dựng hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các làn đã chọn, nhu cầu gói/ảnh, và thông tin xác thực.
- `Package Acceptance` là cổng gói gốc GitHub cho câu hỏi "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một gói ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải nó lên dưới tên `package-under-test`, rồi chạy các làn Docker E2E tái sử dụng trên đúng tarball đó thay vì đóng gói lại ref đã chọn. Hồ sơ được sắp theo độ rộng: `smoke`, `package`, `product`, và `full`. Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng gói/cập nhật/Plugin, ma trận sống sót khi nâng cấp bản đã phát hành, mặc định phát hành, và phân loại lỗi.
- Kiểm tra dựng và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Bộ bảo vệ duyệt đồ thị đã dựng tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và thất bại nếu khởi động trước điều phối nhập các phụ thuộc gói như Commander, giao diện lời nhắc, undici, hoặc ghi nhật ký trước khi điều phối lệnh; nó cũng giữ chunk chạy Gateway đóng gói dưới ngân sách và từ chối nhập tĩnh các đường dẫn Gateway lạnh đã biết. Smoke CLI đã đóng gói cũng bao phủ trợ giúp gốc, trợ giúp onboard, trợ giúp doctor, trạng thái, schema cấu hình, và một lệnh liệt kê mô hình.
- Tương thích kế thừa của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Đến mốc đó, bộ khung chỉ dung thứ các khoảng trống siêu dữ liệu của gói đã phát hành: mục tồn kho QA riêng tư bị bỏ qua, thiếu `gateway install --wrapper`, thiếu tệp vá trong fixture git dẫn xuất từ tarball, thiếu `update.channel` đã lưu, vị trí bản ghi cài đặt Plugin kế thừa, thiếu lưu bản ghi cài đặt marketplace, và di chuyển siêu dữ liệu cấu hình trong `plugins update`. Với các gói sau `2026.4.25`, những đường dẫn đó là lỗi nghiêm ngặt.
- Trình chạy smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.

Các trình chạy Docker mô hình trực tiếp cũng chỉ bind-mount những thư mục nhà xác thực CLI cần thiết (hoặc tất cả các thư mục được hỗ trợ khi lần chạy không bị thu hẹp), rồi sao chép chúng vào thư mục nhà trong container trước lần chạy để OAuth CLI bên ngoài có thể làm mới token mà không thay đổi kho xác thực trên máy chủ:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke test liên kết ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với phạm vi bao phủ Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test harness app-server của Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + tác tử dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test khả năng quan sát: `pnpm qa:otel:smoke` là một lane kiểm tra mã nguồn QA riêng tư. Nó cố ý không nằm trong các lane phát hành package Docker vì tarball npm bỏ qua QA Lab.
- Smoke test live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, scaffolding đầy đủ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke test tarball npm cho onboarding/kênh/tác tử: `pnpm test:docker:npm-onboard-channel-agent` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, cấu hình OpenAI qua onboarding bằng env-ref cùng với Telegram theo mặc định, chạy doctor, rồi chạy một lượt tác tử OpenAI được mock. Tái sử dụng tarball đã dựng sẵn bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bước dựng lại trên host bằng `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc đổi kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, chuyển từ package `stable` sang git `dev`, xác minh kênh đã lưu và plugin vẫn hoạt động sau cập nhật, rồi chuyển lại package `stable` và kiểm tra trạng thái cập nhật.
- Smoke test sống sót qua nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt tarball OpenClaw đã đóng gói đè lên một fixture người dùng cũ ở trạng thái bẩn với các tác tử, cấu hình kênh, allowlist plugin, trạng thái dependency plugin cũ, và các tệp workspace/session hiện có. Nó chạy cập nhật package cùng doctor không tương tác mà không có khóa nhà cung cấp hoặc khóa kênh live, sau đó khởi động một Gateway loopback và kiểm tra việc bảo toàn cấu hình/trạng thái cùng các ngân sách khởi động/trạng thái.
- Smoke test sống sót qua nâng cấp bản đã phát hành: `pnpm test:docker:published-upgrade-survivor` cài đặt `openclaw@latest` theo mặc định, gieo các tệp người dùng hiện có sát thực tế, cấu hình baseline đó bằng một công thức lệnh tích hợp sẵn, xác thực cấu hình thu được, cập nhật bản cài đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, sau đó khởi động một Gateway loopback và kiểm tra các intent đã cấu hình, bảo toàn trạng thái, khởi động, `/healthz`, `/readyz`, và ngân sách trạng thái RPC. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các baseline chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `all-since-2026.4.23`, và mở rộng các fixture dạng issue bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; tập reported-issues bao gồm `configured-plugin-installs` để tự động sửa cài đặt plugin OpenClaw bên ngoài. Package Acceptance phơi bày các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, và `published_upgrade_survivor_scenarios`.
- Smoke test ngữ cảnh runtime session: `pnpm test:docker:session-runtime-context` xác minh việc duy trì bản ghi ngữ cảnh runtime ẩn cùng với sửa chữa doctor cho các nhánh viết lại prompt bị trùng lặp bị ảnh hưởng.
- Smoke test cài đặt Bun toàn cục: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài nó bằng `bun install -g` trong một home cô lập, và xác minh `openclaw infer image providers --json` trả về các nhà cung cấp hình ảnh được đóng gói sẵn thay vì bị treo. Tái sử dụng tarball đã dựng sẵn bằng `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bước dựng trên host bằng `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một image Docker đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker cho trình cài đặt: `bash scripts/test-install-sh-docker.sh` chia sẻ một cache npm giữa các container root, update và direct-npm của nó. Smoke test cập nhật mặc định dùng npm `latest` làm baseline ổn định trước khi nâng cấp lên tarball ứng viên. Ghi đè bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` cục bộ, hoặc bằng input `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ một cache npm cô lập để các mục cache thuộc sở hữu root không che lấp hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để tái sử dụng cache root/update/direct-npm giữa các lần chạy lại cục bộ.
- Install Smoke CI bỏ qua cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy script cục bộ không có env đó khi cần phạm vi bao phủ trực tiếp `npm install -g`.
- Smoke test CLI xóa workspace dùng chung của tác tử: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng image Dockerfile gốc, gieo hai tác tử với một workspace trong home container cô lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Tái sử dụng image install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng image E2E nguồn cùng một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao phủ URL liên kết, các phần tử có thể bấm được nâng cấp từ con trỏ, tham chiếu iframe, và metadata frame.
- Hồi quy reasoning tối thiểu cho OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một server OpenAI được mock qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, sau đó buộc schema nhà cung cấp từ chối và kiểm tra chi tiết thô xuất hiện trong log Gateway.
- Cầu nối kênh MCP (Gateway đã gieo + cầu nối stdio + smoke test notification-frame Claude thô): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP gói Pi (server MCP stdio thật + smoke test allow/deny profile Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP Cron/subagent (Gateway thật + tháo dỡ tiến trình con MCP stdio sau cron cô lập và các lần chạy subagent một lần): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke test cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, npm registry với dependency được hoist, tham chiếu git động, ClawHub kitchen-sink, cập nhật marketplace, và bật/kiểm tra Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp package/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, bài kiểm thử dùng một server fixture ClawHub cục bộ hermetic.
- Smoke test plugin update không đổi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test metadata tải lại cấu hình: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` bao phủ smoke test cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, npm registry với dependency được hoist, tham chiếu git động, fixture ClawHub, cập nhật marketplace, và bật/kiểm tra Claude-bundle. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không đổi cho các plugin đã cài đặt.

Để dựng sẵn và tái sử dụng image chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image theo suite như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một image dùng chung từ xa, các script sẽ pull nó nếu nó chưa có cục bộ. Các bài kiểm thử QR và Docker cho trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi package/cài đặt thay vì runtime ứng dụng đã dựng dùng chung.

Các runner Docker live-model cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Điều này giữ image runtime
gọn nhẹ trong khi vẫn chạy Vitest trên đúng nguồn/cấu hình cục bộ của bạn.
Bước staging bỏ qua các cache chỉ dùng cục bộ lớn và output dựng ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục output `.build` cục bộ của ứng dụng hoặc
Gradle để các lần chạy live Docker không mất nhiều phút sao chép
artifact đặc thù của máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các probe live Gateway không khởi động
worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền qua
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi bao phủ live
Gateway khỏi lane Docker đó.
`test:docker:openwebui` là smoke test tương thích cấp cao hơn: nó khởi động một
container gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI được ghim trỏ tới gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` phơi bày `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Lần chạy đầu tiên có thể chậm đáng kể vì Docker có thể cần pull image
Open WebUI và Open WebUI có thể cần hoàn tất thiết lập cold-start riêng.
Lane này cần một khóa mô hình live dùng được, và `OPENCLAW_PROFILE_FILE`
(mặc định là `~/.profile`) là cách chính để cung cấp khóa đó trong các lần chạy Docker hóa.
Các lần chạy thành công in một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` cố ý có tính xác định và không cần một tài khoản
Telegram, Discord hoặc iMessage thật. Nó khởi động một container Gateway
đã gieo, khởi động container thứ hai sinh ra `openclaw mcp serve`, rồi
xác minh khám phá hội thoại đã định tuyến, đọc transcript, metadata tệp đính kèm,
hành vi hàng đợi sự kiện live, định tuyến gửi đi, và thông báo kênh +
quyền kiểu Claude qua cầu nối MCP stdio thật. Kiểm tra thông báo
kiểm tra trực tiếp các frame MCP stdio thô để smoke test xác thực những gì
cầu nối thực sự phát ra, không chỉ những gì một SDK client cụ thể tình cờ phơi bày.
`test:docker:pi-bundle-mcp-tools` có tính xác định và không cần khóa mô hình live.
Nó dựng image Docker của repo, khởi động một server probe MCP stdio thật
bên trong container, hiện thực hóa server đó qua runtime MCP gói Pi nhúng,
thực thi công cụ, rồi xác minh `coding` và `messaging` giữ lại
công cụ `bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa mô hình live.
Nó khởi động một Gateway đã gieo với một server probe MCP stdio thật, chạy một
lượt cron cô lập và một lượt con một lần `/subagents spawn`, rồi xác minh
tiến trình con MCP thoát sau mỗi lần chạy.

Smoke test luồng ACP bằng ngôn ngữ tự nhiên thủ công (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow hồi quy/gỡ lỗi. Nó có thể lại cần thiết để xác thực định tuyến luồng ACP, vì vậy không xóa nó.

Biến env hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy kiểm thử
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được source từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục cấu hình/không gian làm việc tạm thời và không mount xác thực CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các bản cài CLI được lưu cache bên trong Docker
- Các thư mục/tệp xác thực CLI bên ngoài dưới `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi kiểm thử bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy theo nhà cung cấp thu hẹp chỉ mount những thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc nhà cung cấp trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để dùng lại image `openclaw:local-live` hiện có cho các lần chạy lại không cần build lại
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để bảo đảm thông tin xác thực đến từ kho hồ sơ (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình được Gateway công bố cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce được smoke Open WebUI sử dụng
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã ghim

## Kiểm tra hợp lý tài liệu

Chạy kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra tiêu đề trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy ngoại tuyến (an toàn cho CI)

Đây là các hồi quy “pipeline thực” không có nhà cung cấp thật:

- Gọi công cụ qua Gateway (OpenAI mock, Gateway thật + vòng lặp tác nhân): `src/gateway/gateway.test.ts` (trường hợp: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Trình hướng dẫn Gateway (WS `wizard.start`/`wizard.next`, ghi cấu hình + bắt buộc xác thực): `src/gateway/gateway.test.ts` (trường hợp: "runs wizard over ws and writes auth token config")

## Đánh giá độ tin cậy của tác nhân (Skills)

Chúng ta đã có một vài kiểm thử an toàn cho CI hoạt động như “đánh giá độ tin cậy của tác nhân”:

- Gọi công cụ mock qua Gateway thật + vòng lặp tác nhân (`src/gateway/gateway.test.ts`).
- Luồng trình hướng dẫn end-to-end xác thực nối dây phiên và hiệu lực cấu hình (`src/gateway/gateway.test.ts`).

Những gì vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi Skills được liệt kê trong prompt, tác nhân có chọn đúng Skills (hoặc tránh những Skills không liên quan) không?
- **Tuân thủ:** tác nhân có đọc `SKILL.md` trước khi dùng và làm theo các bước/đối số bắt buộc không?
- **Hợp đồng quy trình làm việc:** các kịch bản nhiều lượt xác nhận thứ tự công cụ, việc chuyển tiếp lịch sử phiên, và ranh giới sandbox.

Các đánh giá trong tương lai trước hết nên duy trì tính xác định:

- Một trình chạy kịch bản dùng nhà cung cấp mock để xác nhận các lệnh gọi công cụ + thứ tự, việc đọc tệp Skills, và nối dây phiên.
- Một bộ nhỏ các kịch bản tập trung vào Skills (dùng so với tránh, gating, prompt injection).
- Đánh giá live tùy chọn (opt-in, được chặn bằng env) chỉ sau khi bộ an toàn cho CI đã có sẵn.

## Kiểm thử hợp đồng (hình dạng Plugin và kênh)

Kiểm thử hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ hợp đồng giao diện của nó. Chúng lặp qua tất cả Plugin được phát hiện và chạy một bộ xác nhận về hình dạng và hành vi. Lane kiểm thử đơn vị `pnpm test` mặc định cố ý bỏ qua các tệp smoke và đường nối dùng chung này; hãy chạy rõ ràng các lệnh hợp đồng khi bạn chạm vào bề mặt kênh hoặc nhà cung cấp dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng nhà cung cấp: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **Plugin** - Hình dạng Plugin cơ bản (id, tên, khả năng)
- **setup** - Hợp đồng trình hướng dẫn thiết lập
- **session-binding** - Hành vi ràng buộc phiên
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn đến
- **actions** - Bộ xử lý hành động kênh
- **threading** - Xử lý ID chuỗi
- **directory** - API danh bạ/roster
- **group-policy** - Thực thi chính sách nhóm

### Hợp đồng trạng thái nhà cung cấp

Nằm trong `src/plugins/contracts/*.contract.test.ts`.

- **status** - Thăm dò trạng thái kênh
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
- Sau khi thêm hoặc sửa đổi Plugin kênh hoặc nhà cung cấp
- Sau khi refactor đăng ký hoặc phát hiện Plugin

Kiểm thử hợp đồng chạy trong CI và không yêu cầu khóa API thật.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề nhà cung cấp/mô hình được phát hiện trong live:

- Thêm hồi quy an toàn cho CI nếu có thể (nhà cung cấp mock/stub, hoặc ghi lại chính xác phép biến đổi hình dạng request)
- Nếu bản chất chỉ có thể live (giới hạn tốc độ, chính sách xác thực), hãy giữ kiểm thử live thu hẹp và opt-in qua biến môi trường
- Ưu tiên nhắm vào lớp nhỏ nhất bắt được lỗi:
  - lỗi chuyển đổi/phát lại request của nhà cung cấp → kiểm thử mô hình trực tiếp
  - lỗi pipeline phiên/lịch sử/công cụ của Gateway → smoke live Gateway hoặc kiểm thử mock Gateway an toàn cho CI
- Lan can duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một mục tiêu lấy mẫu cho mỗi lớp SecretRef từ siêu dữ liệu registry (`listSecretTargetRegistryEntries()`), rồi xác nhận các exec id dạng đoạn duyệt bị từ chối.
  - Nếu bạn thêm một họ mục tiêu SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong kiểm thử đó. Kiểm thử cố ý thất bại với các target id chưa được phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Kiểm thử live](/vi/help/testing-live)
- [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
