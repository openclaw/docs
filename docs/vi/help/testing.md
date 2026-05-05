---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm các kiểm thử hồi quy cho lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của Gateway + tác nhân
summary: 'Bộ công cụ kiểm thử: bộ kiểm thử đơn vị/e2e/trực tiếp, trình chạy Docker và phạm vi kiểm thử của từng bài kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-05T01:48:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (unit/integration, e2e, live) và một nhóm nhỏ
các trình chạy Docker. Tài liệu này là hướng dẫn "cách chúng ta kiểm thử":

- Mỗi bộ kiểm thử bao phủ những gì (và những gì cố ý _không_ bao phủ).
- Những lệnh cần chạy cho các luồng công việc phổ biến (cục bộ, trước khi push, gỡ lỗi).
- Cách các kiểm thử live phát hiện thông tin xác thực và chọn model/provider.
- Cách thêm kiểm thử hồi quy cho các vấn đề model/provider trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các làn truyền tải live)** được ghi tài liệu riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) — kiến trúc, bề mặt lệnh, biên soạn kịch bản.
- [Matrix QA](/vi/concepts/qa-matrix) — tài liệu tham chiếu cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) — Plugin truyền tải tổng hợp được dùng bởi các kịch bản dựa trên repo.

Trang này bao phủ việc chạy các bộ kiểm thử thông thường và các trình chạy Docker/Parallels. Phần trình chạy dành riêng cho QA bên dưới ([Trình chạy dành riêng cho QA](#qa-specific-runners)) liệt kê các lệnh gọi `qa` cụ thể và trỏ lại các tài liệu tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng kiểm tra đầy đủ (được kỳ vọng trước khi push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy có nhiều tài nguyên: `pnpm test:max`
- Vòng lặp theo dõi Vitest trực tiếp: `pnpm test:watch`
- Nhắm trực tiếp vào tệp hiện cũng định tuyến các đường dẫn extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên các lần chạy nhắm mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Trang QA dựa trên Docker: `pnpm qa:lab:up`
- Làn QA dựa trên VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng kiểm tra độ phủ: `pnpm test:coverage`
- Bộ kiểm thử E2E: `pnpm test:e2e`

Khi gỡ lỗi provider/model thật (yêu cầu thông tin xác thực thật):

- Bộ kiểm thử live (model + probe công cụ/hình ảnh Gateway): `pnpm test:live`
- Nhắm vào một tệp live trong chế độ yên lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng runtime: dispatch `OpenClaw Performance` với
  `live_gpt54=true` cho một lượt agent `openai/gpt-5.4` thật hoặc
  `deep_profile=true` cho artifact CPU/heap/trace của Kova. Các lần chạy theo lịch hằng ngày
  xuất bản artifact của làn mock-provider, deep-profile và GPT 5.4 lên
  `openclaw/clawgrit-reports` khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình. Báo cáo
  mock-provider cũng bao gồm các số liệu ở cấp mã nguồn về khởi động gateway, bộ nhớ,
  áp lực Plugin, vòng lặp chào fake-model lặp lại, và khởi động CLI.
- Quét model live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi model được chọn hiện chạy một lượt văn bản cộng với một probe nhỏ kiểu đọc tệp.
    Các model có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các probe bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi provider.
  - Độ phủ CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E tái sử dụng với
    `include_live_suites: true`, trong đó bao gồm các job ma trận model live Docker
    riêng được phân mảnh theo provider.
  - Để chạy lại CI có trọng tâm, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm secret provider tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng với `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các caller
    theo lịch/phát hành của nó.
- Smoke bound-chat Codex gốc: `pnpm test:docker:live-codex-bind`
  - Chạy một làn live Docker qua đường dẫn app-server Codex, bind một
    Slack DM tổng hợp bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi thuần và một tệp đính kèm hình ảnh
    định tuyến qua binding Plugin gốc thay vì ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt agent gateway qua harness app-server Codex do Plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và theo mặc định thực thi các probe hình ảnh,
    cron MCP, sub-agent và Guardian. Tắt probe sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi app-server Codex khác.
    Để kiểm tra sub-agent có trọng tâm, tắt các probe khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Lệnh này thoát sau probe sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Smoke lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra tùy chọn cẩn trọng bổ sung cho bề mặt lệnh cứu hộ kênh tin nhắn.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi model bền vững,
    trả lời `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong container không có cấu hình với một Claude CLI giả trên `PATH`
    và xác minh phương án dự phòng fuzzy planner được dịch thành một lần ghi cấu hình có kiểu đã được audit.
- Smoke Docker lần chạy đầu tiên của Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, định tuyến `openclaw` thuần đến
    Crestodian, áp dụng các lần ghi setup/model/agent/Plugin Discord + SecretRef,
    xác thực cấu hình, và xác minh các mục audit. Cùng đường dẫn thiết lập Ring 0 này cũng
    được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một lượt độc lập
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  trên `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và bản ghi trợ lý
  lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một trường hợp lỗi, ưu tiên thu hẹp kiểm thử live bằng các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Trình chạy dành riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần tính thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. Tính tương đương agentic được lồng dưới
`QA-Lab - All Lanes` và xác thực phát hành, không phải một workflow PR độc lập.
Xác thực rộng nên dùng `Full Release Validation` với
`rerun_group=qa-parity` hoặc nhóm QA của release-checks. Các kiểm tra phát hành stable/default
giữ soak live/Docker toàn diện phía sau `run_release_soak=true`; profile
`full` bắt buộc bật soak. `QA-Lab - All Lanes`
chạy hằng đêm trên `main` và từ dispatch thủ công với làn mock parity, làn Matrix live,
làn Telegram live do Convex quản lý, và làn Discord live do Convex quản lý
dưới dạng các job song song. QA theo lịch và release checks truyền Matrix
`--profile fast` một cách tường minh, trong khi mặc định của Matrix CLI và đầu vào workflow thủ công
vẫn là `all`; dispatch thủ công có thể phân mảnh `all` thành các job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`. `OpenClaw Release
Checks` chạy parity cộng với các làn Matrix fast và Telegram trước phê duyệt phát hành,
dùng `mock-openai/gpt-5.5` cho các kiểm tra truyền tải phát hành để chúng luôn
xác định và tránh khởi động provider-plugin thông thường. Các gateway truyền tải live này
tắt tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ QA parity.

Các shard media live của bản phát hành đầy đủ dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard model/backend live Docker dùng image dùng chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi commit được chọn,
sau đó kéo image đó bằng `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì build lại
trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy trực tiếp các kịch bản QA dựa trên repo trên máy chủ.
  - Theo mặc định, chạy song song nhiều kịch bản đã chọn với các worker
    gateway biệt lập. `qa-channel` mặc định có concurrency 4 (giới hạn bởi
    số lượng kịch bản đã chọn). Dùng `--concurrency <count>` để điều chỉnh số
    worker, hoặc `--concurrency 1` cho lane nối tiếp cũ hơn.
  - Thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Hỗ trợ các chế độ provider `live-frontier`, `mock-openai`, và `aimock`.
    `aimock` khởi động một máy chủ provider cục bộ dựa trên AIMock cho phạm vi
    fixture thử nghiệm và mô phỏng giao thức mà không thay thế lane
    `mock-openai` có nhận biết kịch bản.
- `pnpm test:plugins:kitchen-sink-live`
  - Chạy gauntlet Plugin Kitchen Sink OpenAI trực tiếp qua QA Lab. Nó
    cài đặt gói Kitchen Sink bên ngoài, xác minh inventory bề mặt SDK Plugin,
    dò `/healthz` và `/readyz`, ghi lại bằng chứng CPU/RSS của Gateway,
    chạy một lượt OpenAI trực tiếp, và kiểm tra chẩn đoán đối kháng.
    Yêu cầu xác thực OpenAI trực tiếp như `OPENAI_API_KEY`. Trong các phiên Testbox
    đã hydrate, nó tự động nạp profile xác thực trực tiếp Testbox khi có helper
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy bench khởi động Gateway cùng một gói nhỏ kịch bản QA Lab mô phỏng
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi một bản tóm tắt quan sát CPU kết hợp
    trong `.artifacts/gateway-cpu-scenarios/`.
  - Theo mặc định chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cùng `--hot-wall-warn-ms`), vì vậy các đợt tăng ngắn lúc khởi động được ghi
    dưới dạng metric mà không trông giống hồi quy Gateway bị ghim CPU kéo dài nhiều phút.
  - Dùng các artifact `dist` đã build; hãy chạy build trước khi checkout chưa
    có đầu ra runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA trong một VM Linux Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên máy chủ.
  - Tái sử dụng cùng các cờ chọn provider/model như `qa suite`.
  - Các lần chạy trực tiếp chuyển tiếp những đầu vào xác thực QA được hỗ trợ và thực tế cho guest:
    khóa provider dựa trên env, đường dẫn cấu hình provider QA trực tiếp, và `CODEX_HOME`
    khi có.
  - Thư mục đầu ra phải nằm dưới gốc repo để guest có thể ghi ngược qua
    workspace được mount.
  - Ghi báo cáo QA và tóm tắt thông thường cùng log Multipass trong
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA dựa trên Docker cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt toàn cục trong
    Docker, chạy onboarding khóa API OpenAI không tương tác, cấu hình Telegram
    theo mặc định, xác minh runtime Plugin đã đóng gói tải được mà không cần
    sửa chữa dependency lúc khởi động, chạy doctor, và chạy một lượt agent cục bộ
    với endpoint OpenAI được mô phỏng.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane cài đặt gói
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một smoke Docker app đã build có tính quyết định cho transcript ngữ cảnh runtime
    nhúng. Nó xác minh ngữ cảnh runtime OpenClaw ẩn được lưu dưới dạng thông điệp
    tùy chỉnh không hiển thị thay vì rò rỉ vào lượt người dùng hiển thị,
    sau đó seed một JSONL phiên bị hỏng bị ảnh hưởng và xác minh
    `openclaw doctor --fix` ghi lại nó về nhánh active cùng một bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên gói OpenClaw trong Docker, chạy onboarding gói đã cài,
    cấu hình Telegram qua CLI đã cài, rồi tái sử dụng lane QA Telegram trực tiếp
    với gói đã cài đó làm Gateway SUT.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã resolve thay vì
    cài đặt từ registry.
  - Dùng cùng thông tin xác thực env Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/release, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cùng
    `OPENCLAW_QA_CONVEX_SITE_URL` và secret vai trò. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một secret vai trò Convex có mặt trong CI,
    wrapper Docker tự động chọn Convex.
  - Wrapper xác thực env thông tin xác thực Telegram hoặc Convex trên máy chủ trước
    công việc build/cài đặt Docker. Chỉ đặt `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    khi cố ý debug thiết lập trước thông tin xác thực.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này.
  - GitHub Actions hiển thị lane này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và lease thông tin xác thực CI Convex.
- GitHub Actions cũng hiển thị `Package Acceptance` cho bằng chứng sản phẩm chạy bên
  cạnh với một gói ứng viên. Nó chấp nhận một ref đáng tin cậy, spec npm đã publish,
  URL tarball HTTPS kèm SHA-256, hoặc artifact tarball từ một lần chạy khác, tải lên
  `openclaw-current.tgz` đã chuẩn hóa dưới tên `package-under-test`, rồi chạy
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

- Bằng chứng artifact tải xuống một artifact tarball từ một lần chạy Actions khác:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Đóng gói và cài đặt bản build OpenClaw hiện tại trong Docker, khởi động Gateway
    với OpenAI đã cấu hình, rồi bật các kênh/Plugin được đóng gói qua chỉnh sửa cấu hình.
  - Xác minh khám phá thiết lập để các Plugin có thể tải xuống nhưng chưa cấu hình vắng mặt,
    lần sửa chữa doctor đã cấu hình đầu tiên cài đặt rõ ràng từng Plugin có thể tải xuống
    bị thiếu, và lần khởi động lại thứ hai không chạy sửa chữa dependency ẩn.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của ứng viên
    dọn sạch mảnh vụn dependency Plugin legacy mà không cần sửa chữa postinstall phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật cài đặt gói native trên các guest Parallels. Mỗi
    nền tảng được chọn trước tiên cài đặt gói baseline được yêu cầu, rồi chạy
    lệnh `openclaw update` đã cài trong cùng guest và xác minh phiên bản đã cài,
    trạng thái cập nhật, độ sẵn sàng Gateway, và một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một guest. Dùng `--json` cho đường dẫn artifact tóm tắt và
    trạng thái từng lane.
  - Lane OpenAI dùng `openai/gpt-5.5` cho bằng chứng lượt agent trực tiếp theo
    mặc định. Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi cố ý xác thực một model OpenAI khác.
  - Bọc các lần chạy cục bộ dài trong timeout máy chủ để các lần treo transport Parallels không thể
    tiêu tốn phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi log lane lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi cho rằng wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong doctor sau cập nhật và công việc
    cập nhật gói trên guest lạnh; điều đó vẫn bình thường khi log debug npm lồng nhau
    đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với các lane smoke Parallels
    macOS, Windows, hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể va chạm khi
    khôi phục snapshot, phục vụ gói, hoặc trạng thái Gateway guest.
  - Bằng chứng sau cập nhật chạy bề mặt Plugin được đóng gói thông thường vì
    các facade capability như speech, tạo ảnh, và hiểu media
    được tải qua API runtime đóng gói ngay cả khi lượt agent
    chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ provider AIMock cục bộ cho kiểm thử smoke giao thức trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy lane QA Matrix trực tiếp với homeserver Tuwunel dùng một lần dựa trên Docker. Chỉ source-checkout — các bản cài đặt đóng gói không ship `qa-lab`.
  - CLI đầy đủ, catalog profile/kịch bản, env vars, và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy lane QA Telegram trực tiếp với một nhóm riêng tư thật bằng token bot driver và SUT từ env.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id nhóm phải là id chat Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực pooled dùng chung. Dùng chế độ env theo mặc định, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng pooled leases.
  - Thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng nhóm riêng tư, với bot SUT hiển thị username Telegram.
  - Để quan sát bot-với-bot ổn định, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và đảm bảo bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, tóm tắt, và artifact thông điệp đã quan sát trong `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT đã quan sát.

Các lane transport trực tiếp dùng chung một contract tiêu chuẩn để transport mới không bị lệch; ma trận phạm vi từng lane nằm trong [Tổng quan QA → Phạm vi transport trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ synthetic rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi bật `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) cho
`openclaw qa telegram`, QA lab lấy một lease độc quyền từ pool dựa trên Convex, heartbeat
lease đó trong khi lane đang chạy, và giải phóng lease khi tắt.

Scaffold dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Env vars bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho vai trò đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn vai trò thông tin xác thực:
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

`OPENCLAW_QA_CONVEX_SITE_URL` nên sử dụng `https://` trong hoạt động bình thường.

Các lệnh quản trị dành cho maintainer (pool add/remove/list) yêu cầu riêng
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Các trình hỗ trợ CLI cho maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Sử dụng `doctor` trước các lần chạy live để kiểm tra URL site Convex, bí mật broker,
tiền tố endpoint, thời gian chờ HTTP và khả năng truy cập admin/list mà không in
giá trị bí mật. Sử dụng `--json` để có đầu ra máy đọc được trong script và tiện ích CI.

Hợp đồng endpoint mặc định (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Yêu cầu: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Thành công: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Cạn kiệt/có thể thử lại: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Yêu cầu: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Thành công: `{ status: "ok" }` (hoặc `2xx` rỗng)
- `POST /release`
  - Yêu cầu: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Thành công: `{ status: "ok" }` (hoặc `2xx` rỗng)
- `POST /admin/add` (chỉ bí mật maintainer)
  - Yêu cầu: `{ kind, actorId, payload, note?, status? }`
  - Thành công: `{ status: "ok", credential }`
- `POST /admin/remove` (chỉ bí mật maintainer)
  - Yêu cầu: `{ credentialId, actorId }`
  - Thành công: `{ status: "ok", changed, credential }`
  - Chốt bảo vệ lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ bí mật maintainer)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Dạng payload cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi id cuộc trò chuyện Telegram dạng số.
- `admin/add` xác thực dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

### Thêm một kênh vào QA

Kiến trúc và tên trình hỗ trợ kịch bản cho bộ chuyển đổi kênh mới nằm trong [Tổng quan QA → Thêm một kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai transport runner trên seam host `qa-lab` dùng chung, khai báo `qaRunners` trong manifest Plugin, mount dưới dạng `openclaw qa <runner>`, và viết kịch bản trong `qa/scenarios/`.

## Bộ kiểm thử (chạy ở đâu)

Hãy xem các bộ kiểm thử là “mức độ thực tế tăng dần” (đồng thời độ chập chờn/chi phí cũng tăng):

### Unit / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng bộ shard `vitest.full-*.config.ts` và có thể mở rộng shard đa dự án thành cấu hình theo từng dự án để lập lịch song song
- Tệp: inventory core/unit trong `src/**/*.test.ts`, `packages/**/*.test.ts` và `test/**/*.test.ts`; kiểm thử unit UI chạy trong shard chuyên dụng `unit-ui`
- Phạm vi:
  - Kiểm thử unit thuần túy
  - Kiểm thử tích hợp trong tiến trình (xác thực Gateway, định tuyến, tooling, phân tích cú pháp, cấu hình)
  - Hồi quy xác định cho lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không cần khóa thật
  - Nên nhanh và ổn định
  - Kiểm thử resolver và bộ nạp bề mặt công khai phải chứng minh hành vi fallback rộng của `api.js` và
    `runtime-api.js` bằng fixture Plugin nhỏ được tạo ra, không dùng
    API mã nguồn Plugin được đóng gói thật. Việc tải API Plugin thật thuộc về
    các bộ hợp đồng/tích hợp do Plugin sở hữu.

<AccordionGroup>
  <Accordion title="Dự án, shard và lane theo phạm vi">

    - `pnpm test` không nhắm mục tiêu chạy mười hai cấu hình shard nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình dự án gốc native khổng lồ. Cách này giảm RSS đỉnh trên máy nhiều tải và tránh để công việc auto-reply/extension làm thiếu tài nguyên các bộ không liên quan.
    - `pnpm test --watch` vẫn dùng đồ thị dự án gốc native `vitest.config.ts`, vì vòng lặp watch đa shard không thực tế.
    - `pnpm test`, `pnpm test:watch` và `pnpm test:perf:imports` định tuyến mục tiêu tệp/thư mục rõ ràng qua các lane theo phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả chi phí khởi động toàn bộ dự án gốc.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành lane theo phạm vi rẻ: chỉnh sửa kiểm thử trực tiếp, tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng và phần phụ thuộc đồ thị import cục bộ. Chỉnh sửa config/setup/package không chạy kiểm thử rộng trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là gate kiểm tra cục bộ thông minh bình thường cho công việc hẹp. Nó phân loại diff thành core, kiểm thử core, extensions, kiểm thử extension, ứng dụng, tài liệu, metadata phát hành, tooling Docker live và tooling, sau đó chạy các lệnh typecheck, lint và guard tương ứng. Nó không chạy kiểm thử Vitest; gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các lần bump phiên bản chỉ metadata phát hành chạy kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu, với guard từ chối thay đổi package ngoài trường phiên bản cấp cao nhất.
    - Chỉnh sửa harness ACP Docker live chạy các kiểm tra tập trung: cú pháp shell cho script xác thực Docker live và dry-run bộ lập lịch Docker live. Thay đổi `package.json` chỉ được bao gồm khi diff giới hạn ở `scripts["test:docker:live-*"]`; các chỉnh sửa phụ thuộc, export, phiên bản và bề mặt package khác vẫn dùng guard rộng hơn.
    - Kiểm thử unit import nhẹ từ agents, commands, plugins, trình hỗ trợ auto-reply, `plugin-sdk` và các vùng tiện ích thuần túy tương tự được định tuyến qua lane `unit-fast`, bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng runtime vẫn ở lane hiện có.
    - Một số tệp nguồn trình hỗ trợ `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy chế độ changed sang kiểm thử cùng cấp rõ ràng trong các lane nhẹ đó, nên chỉnh sửa helper tránh chạy lại toàn bộ bộ nặng cho thư mục đó.
    - `auto-reply` có bucket chuyên dụng cho helper core cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất và cây con `src/auto-reply/reply/**`. CI còn tách cây con reply thành các shard agent-runner, dispatch và commands/state-routing để một bucket nặng import không sở hữu toàn bộ phần đuôi Node.
    - CI PR/main bình thường cố ý bỏ qua sweep batch extension và shard `agentic-plugins` chỉ dành cho phát hành. Full Release Validation dispatch workflow con `Plugin Prerelease` riêng cho các bộ nặng Plugin/extension đó trên ứng viên phát hành.

  </Accordion>

  <Accordion title="Phạm vi bao phủ embedded runner">

    - Khi bạn thay đổi đầu vào khám phá message-tool hoặc ngữ cảnh runtime compaction,
      hãy giữ cả hai mức bao phủ.
    - Thêm hồi quy helper tập trung cho các biên định tuyến và chuẩn hóa
      thuần túy.
    - Giữ các bộ tích hợp embedded runner khỏe mạnh:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ này xác minh rằng scoped id và hành vi compaction vẫn đi
      qua các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ helper
      không đủ thay thế cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Mặc định pool và cô lập của Vitest">

    - Cấu hình Vitest cơ sở mặc định là `threads`.
    - Cấu hình Vitest dùng chung cố định `isolate: false` và dùng runner
      không cô lập trên các dự án gốc, e2e và cấu hình live.
    - Lane UI gốc giữ thiết lập `jsdom` và optimizer của nó, nhưng cũng chạy trên
      runner dùng chung không cô lập.
    - Mỗi shard `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false`
      từ cấu hình Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho tiến trình Node
      con của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8
      nguyên bản.

  </Accordion>

  <Accordion title="Lặp cục bộ nhanh">

    - `pnpm changed:lanes` hiển thị diff kích hoạt những lane kiến trúc nào.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck hay kiểm thử.
    - Chạy rõ ràng `pnpm check:changed` trước khi bàn giao hoặc push khi bạn
      cần gate kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các lane theo phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      quyết định một chỉnh sửa harness, config, package hoặc hợp đồng thực sự cần
      phạm vi Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ cùng hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động co giãn worker cục bộ cố ý thận trọng và giảm xuống
      khi load average của host đã cao, nên nhiều lần chạy Vitest đồng thời
      mặc định gây ít thiệt hại hơn.
    - Cấu hình Vitest cơ sở đánh dấu các dự án/tệp cấu hình là
      `forceRerunTriggers` để các lần chạy lại chế độ changed vẫn đúng khi
      wiring kiểm thử thay đổi.
    - Cấu hình giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` bật trên các
      host được hỗ trợ; đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache rõ ràng cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Gỡ lỗi hiệu năng">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cùng
      đầu ra phân rã import.
    - `pnpm test:perf:imports:changed` giới hạn cùng góc nhìn profiling vào
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian shard được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn bộ cấu hình dùng đường dẫn cấu hình làm khóa; shard CI theo include-pattern
      nối thêm tên shard để các shard đã lọc có thể được theo dõi
      riêng.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho import khởi động,
      giữ phụ thuộc nặng phía sau một seam `*.runtime.ts` cục bộ hẹp và
      mock trực tiếp seam đó thay vì deep-import helper runtime chỉ
      để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn dự án gốc native cho diff đã commit đó
      và in thời gian thực cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây dirty hiện tại
      bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và cấu hình Vitest gốc.
    - `pnpm test:perf:profile:main` ghi profile CPU main-thread cho
      chi phí khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi profile CPU+heap runner cho
      bộ unit khi tắt song song hóa theo tệp.

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- Lệnh: `pnpm test:stability:gateway`
- Cấu hình: `vitest.gateway.config.ts`, ép dùng một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với chẩn đoán được bật mặc định
  - Đẩy churn thông điệp gateway, bộ nhớ và payload lớn tổng hợp qua đường dẫn sự kiện chẩn đoán
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các helper lưu bền bundle stability chẩn đoán
  - Khẳng định recorder vẫn có giới hạn, mẫu RSS tổng hợp nằm dưới ngân sách áp lực và độ sâu hàng đợi theo phiên thoát về 0
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Lane hẹp để theo dõi hồi quy stability, không thay thế cho toàn bộ bộ Gateway

### E2E (gateway smoke)

- Lệnh: `pnpm test:e2e`
- Cấu hình: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và các kiểm thử E2E của Plugin đi kèm trong `extensions/`
- Mặc định thời gian chạy:
  - Sử dụng Vitest `threads` với `isolate: false`, khớp với phần còn lại của repo.
  - Sử dụng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Chạy ở chế độ im lặng theo mặc định để giảm chi phí I/O console.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để ép số lượng worker (giới hạn tối đa 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra console chi tiết.
- Phạm vi:
  - Hành vi Gateway đầu-cuối nhiều phiên bản
  - Bề mặt WebSocket/HTTP, ghép cặp node và mạng nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không yêu cầu khóa thật
  - Nhiều thành phần chuyển động hơn kiểm thử đơn vị (có thể chậm hơn)

### E2E: kiểm thử khói backend OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Khởi động một Gateway OpenShell cô lập trên host qua Docker
  - Tạo một sandbox từ Dockerfile cục bộ tạm thời
  - Kiểm tra backend OpenShell của OpenClaw qua `sandbox ssh-config` thật + thực thi SSH
  - Xác minh hành vi hệ thống tệp chuẩn hóa theo remote thông qua cầu nối sandbox fs
- Kỳ vọng:
  - Chỉ chạy khi chọn tham gia; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cộng với daemon Docker hoạt động
  - Sử dụng `HOME` / `XDG_CONFIG_HOME` cô lập, sau đó hủy Gateway kiểm thử và sandbox
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới binary CLI không mặc định hoặc script wrapper

### Live (provider thật + model thật)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các kiểm thử live của Plugin đi kèm trong `extensions/`
- Mặc định: **được bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - “Provider/model này có thực sự hoạt động _hôm nay_ với thông tin xác thực thật không?”
  - Phát hiện thay đổi định dạng provider, đặc thù gọi công cụ, vấn đề xác thực và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế không ổn định trong CI (mạng thật, chính sách provider thật, hạn ngạch, sự cố ngừng dịch vụ)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con đã thu hẹp thay vì “mọi thứ”
- Các lần chạy live nạp `~/.profile` để lấy các API key bị thiếu.
- Theo mặc định, các lần chạy live vẫn cô lập `HOME` và sao chép vật liệu cấu hình/xác thực vào home kiểm thử tạm thời để fixture đơn vị không thể sửa đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn chủ ý cần kiểm thử live dùng thư mục home thật của mình.
- `pnpm test:live` hiện mặc định dùng chế độ yên tĩnh hơn: giữ đầu ra tiến độ `[live] ...`, nhưng ẩn thông báo `~/.profile` bổ sung và tắt log bootstrap Gateway/Bonjour chatter. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn bật lại toàn bộ log khởi động.
- Xoay vòng API key (theo provider): đặt `*_API_KEYS` với định dạng dấu phẩy/dấu chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè theo live qua `OPENCLAW_LIVE_*_KEY`; kiểm thử sẽ thử lại khi có phản hồi giới hạn tốc độ.
- Đầu ra tiến độ/heartbeat:
  - Các bộ live hiện phát dòng tiến độ tới stderr để những lệnh gọi provider dài vẫn hiển thị đang hoạt động ngay cả khi Vitest console capture im lặng.
  - `vitest.live.config.ts` tắt chặn console của Vitest để các dòng tiến độ provider/Gateway được stream ngay trong các lần chạy live.
  - Điều chỉnh heartbeat model trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Điều chỉnh heartbeat Gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ nào?

Dùng bảng quyết định này:

- Chỉnh sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn thay đổi nhiều)
- Chạm tới mạng Gateway / giao thức WS / ghép cặp: thêm `pnpm test:e2e`
- Gỡ lỗi “bot của tôi bị down” / lỗi riêng theo provider / gọi công cụ: chạy một `pnpm test:live` đã thu hẹp

## Kiểm thử live (chạm mạng)

Đối với ma trận model live, kiểm thử khói backend CLI, kiểm thử khói ACP, harness máy chủ ứng dụng Codex, và tất cả kiểm thử live media-provider (Deepgram, BytePlus, ComfyUI, hình ảnh, âm nhạc, video, media harness) — cùng với xử lý thông tin xác thực cho các lần chạy live — xem [Kiểm thử các bộ live](/vi/help/testing-live). Đối với danh sách kiểm tra cập nhật và xác thực Plugin chuyên dụng, xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Runner Docker (kiểm tra "hoạt động trên Linux" tùy chọn)

Các runner Docker này chia thành hai nhóm:

- Runner model live: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp live profile-key tương ứng trong image Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), mount thư mục cấu hình cục bộ và workspace của bạn (và source `~/.profile` nếu được mount). Các entrypoint cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Runner Docker live mặc định dùng giới hạn smoke nhỏ hơn để một lượt quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các env var đó khi bạn
  chủ ý muốn quét toàn diện lớn hơn.
- `test:docker:all` xây dựng image Docker live một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần thành tarball npm thông qua `scripts/package-openclaw-for-docker.mjs`, rồi xây dựng/tái sử dụng hai image `scripts/e2e/Dockerfile`. Image bare chỉ là runner Node/Git cho các lane cài đặt/cập nhật/phụ thuộc Plugin; các lane đó mount tarball đã dựng sẵn. Image functional cài cùng tarball vào `/app` cho các lane chức năng ứng dụng đã build. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Tổng hợp sử dụng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` điều khiển slot tiến trình, còn giới hạn tài nguyên ngăn các lane live nặng, npm-install và multi-service cùng khởi động một lúc. Nếu một lane đơn lẻ nặng hơn giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động lane đó khi pool trống rồi giữ nó chạy một mình cho đến khi lại có dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ điều chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi host Docker có thêm dư địa. Runner thực hiện preflight Docker theo mặc định, xóa các container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời gian lane thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời gian đó để khởi động những lane dài hơn trước trong các lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane có trọng số mà không build hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các lane đã chọn, nhu cầu package/image và thông tin xác thực.
- `Package Acceptance` là cổng package gốc GitHub cho "tarball cài đặt được này có hoạt động như một sản phẩm không?" Nó phân giải một package ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải nó lên dưới dạng `package-under-test`, rồi chạy các lane Docker E2E tái sử dụng với đúng tarball đó thay vì đóng gói lại ref đã chọn. Profile được sắp theo độ rộng: `smoke`, `package`, `product`, và `full`. Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng package/cập nhật/Plugin, ma trận sống sót sau nâng cấp đã phát hành, mặc định phát hành và phân loại lỗi.
- Kiểm tra build và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Guard duyệt đồ thị build tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và thất bại nếu khởi động trước dispatch import các phụ thuộc package như Commander, prompt UI, undici hoặc logging trước khi dispatch lệnh; nó cũng giữ chunk chạy Gateway đi kèm trong ngân sách và từ chối import tĩnh của các đường dẫn Gateway lạnh đã biết. Kiểm thử khói CLI đã đóng gói cũng bao phủ root help, onboard help, doctor help, status, config schema và một lệnh liệt kê model.
- Tương thích kế thừa của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Qua mốc đó, harness chỉ dung thứ các khoảng trống metadata của package đã phát hành: mục QA inventory riêng tư bị bỏ qua, thiếu `gateway install --wrapper`, thiếu tệp patch trong fixture git lấy từ tarball, thiếu `update.channel` được lưu giữ, vị trí install-record Plugin kế thừa, thiếu lưu giữ install-record marketplace và di chuyển metadata cấu hình trong `plugins update`. Với các package sau `2026.4.25`, các đường dẫn đó là lỗi nghiêm ngặt.
- Runner kiểm thử khói container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.

Các runner Docker model live cũng chỉ bind-mount các CLI auth home cần thiết (hoặc tất cả các home được hỗ trợ khi lần chạy không bị thu hẹp), rồi sao chép chúng vào home container trước khi chạy để OAuth CLI bên ngoài có thể làm mới token mà không sửa đổi kho auth của host:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Kiểm thử smoke bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với phạm vi bao phủ Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + tác nhân dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử smoke observability: `pnpm qa:otel:smoke` là một lane kiểm tra mã nguồn QA riêng tư. Nó cố ý không thuộc các lane phát hành Docker của package vì npm tarball bỏ qua QA Lab.
- Kiểm thử smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, dựng khung đầy đủ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử smoke onboarding/kênh/tác nhân bằng npm tarball: `pnpm test:docker:npm-onboard-channel-agent` cài đặt OpenClaw tarball đã đóng gói ở phạm vi toàn cục trong Docker, cấu hình OpenAI qua onboarding tham chiếu env cùng với Telegram theo mặc định, chạy doctor và chạy một lượt tác nhân OpenAI được mô phỏng. Dùng lại tarball dựng sẵn với `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bước dựng lại trên host với `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc đổi kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` hoặc `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Kiểm thử smoke chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt OpenClaw tarball đã đóng gói ở phạm vi toàn cục trong Docker, chuyển từ package `stable` sang git `dev`, xác minh kênh đã lưu và hoạt động sau cập nhật của Plugin, rồi chuyển lại package `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử smoke survivor nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt OpenClaw tarball đã đóng gói đè lên một fixture người dùng cũ không sạch với tác nhân, cấu hình kênh, danh sách cho phép Plugin, trạng thái phụ thuộc Plugin đã cũ và các tệp workspace/session hiện có. Nó chạy cập nhật package cùng với doctor không tương tác mà không cần provider live hoặc khóa kênh, rồi khởi động một Gateway loopback và kiểm tra việc bảo toàn cấu hình/trạng thái cùng các ngân sách khởi động/trạng thái.
- Kiểm thử smoke survivor nâng cấp đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, gieo các tệp người dùng hiện có thực tế, cấu hình baseline đó bằng một công thức lệnh được nhúng sẵn, xác thực cấu hình kết quả, cập nhật bản cài đặt đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway loopback và kiểm tra các intent đã cấu hình, bảo toàn trạng thái, khởi động, `/healthz`, `/readyz` và ngân sách trạng thái RPC. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các baseline chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `all-since-2026.4.23`, và mở rộng các fixture theo dạng issue bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; tập reported-issues bao gồm `configured-plugin-installs` để tự động sửa cài đặt Plugin OpenClaw bên ngoài. Package Acceptance hiển thị các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` và `published_upgrade_survivor_scenarios`; Full Release Validation dùng baseline latest mặc định trong đường chặn và chỉ mở rộng sang all-since/reported-issues khi `run_release_soak=true` hoặc `release_profile=full`.
- Kiểm thử smoke ngữ cảnh runtime session: `pnpm test:docker:session-runtime-context` xác minh việc lưu transcript ngữ cảnh runtime ẩn cùng với sửa chữa bằng doctor cho các nhánh viết lại prompt bị trùng lặp chịu ảnh hưởng.
- Kiểm thử smoke cài đặt toàn cục Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một home cô lập, và xác minh `openclaw infer image providers --json` trả về các provider hình ảnh được đóng gói thay vì bị treo. Dùng lại tarball dựng sẵn với `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bước dựng trên host với `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một image Docker đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử smoke Docker của trình cài đặt: `bash scripts/test-install-sh-docker.sh` chia sẻ một bộ nhớ đệm npm giữa các container root, update và direct-npm của nó. Kiểm thử smoke cập nhật mặc định dùng npm `latest` làm baseline ổn định trước khi nâng cấp lên tarball ứng viên. Ghi đè cục bộ bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, hoặc bằng input `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ bộ nhớ đệm npm cô lập để các mục bộ nhớ đệm do root sở hữu không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để dùng lại bộ nhớ đệm root/update/direct-npm qua các lần chạy lại cục bộ.
- Install Smoke CI bỏ qua cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy script cục bộ mà không có env đó khi cần phạm vi bao phủ `npm install -g` trực tiếp.
- Kiểm thử smoke CLI xóa workspace dùng chung của tác nhân: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng image Dockerfile gốc, gieo hai tác nhân với một workspace trong home container cô lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Dùng lại image install-smoke với `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử smoke snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng image E2E nguồn cùng một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao phủ URL liên kết, phần tử có thể nhấp được nâng cấp từ con trỏ, tham chiếu iframe và metadata frame.
- Hồi quy reasoning tối thiểu của OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI được mô phỏng qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, sau đó buộc schema của provider từ chối và kiểm tra chi tiết thô xuất hiện trong log Gateway.
- Cầu nối kênh MCP (Gateway đã gieo + cầu nối stdio + kiểm thử smoke notification-frame Claude thô): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP trong gói Pi (máy chủ MCP stdio thực + kiểm thử smoke allow/deny của hồ sơ Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP Cron/subagent (Gateway thực + tháo dỡ MCP child stdio sau các lần chạy cron cô lập và subagent một lần): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (kiểm thử smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, npm registry với phụ thuộc được hoist, ref git di chuyển, ClawHub kitchen-sink, cập nhật marketplace và bật/kiểm tra Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp package/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Khi không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, bài kiểm thử dùng một máy chủ fixture ClawHub cục bộ khép kín.
- Kiểm thử smoke cập nhật Plugin không thay đổi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử smoke ma trận vòng đời Plugin: `pnpm test:docker:plugin-lifecycle-matrix` cài đặt OpenClaw tarball đã đóng gói trong một container trống, cài đặt một npm Plugin, bật/tắt, nâng cấp và hạ cấp nó qua một npm registry cục bộ, xóa mã đã cài đặt, rồi xác minh gỡ cài đặt vẫn xóa trạng thái đã cũ trong khi ghi log chỉ số RSS/CPU cho từng pha vòng đời.
- Kiểm thử smoke metadata tải lại cấu hình: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` bao phủ kiểm thử smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, npm registry với phụ thuộc được hoist, ref git di chuyển, fixture ClawHub, cập nhật marketplace và bật/kiểm tra Claude-bundle. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không thay đổi cho các Plugins đã cài đặt. `pnpm test:docker:plugin-lifecycle-matrix` bao phủ cài đặt, bật, tắt, nâng cấp, hạ cấp và gỡ cài đặt khi thiếu mã của npm Plugin có theo dõi tài nguyên.

Để dựng trước và dùng lại image chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image theo bộ kiểm thử như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một image dùng chung từ xa, các script sẽ pull nó nếu nó chưa có cục bộ. Các bài kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi package/cài đặt thay vì runtime ứng dụng đã dựng dùng chung.

Các trình chạy Docker với mô hình live cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Điều này giữ cho image runtime
gọn nhẹ trong khi vẫn chạy Vitest trên đúng mã nguồn/cấu hình cục bộ của bạn.
Bước staging bỏ qua các cache lớn chỉ dùng cục bộ và đầu ra build ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục đầu ra `.build` cục bộ của ứng dụng hoặc
Gradle để các lần chạy live bằng Docker không mất nhiều phút sao chép
artifact đặc thù của máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các live probe của gateway không khởi động
các worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền tiếp
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi kiểm thử live của gateway
khỏi lane Docker đó.
`test:docker:openwebui` là một smoke kiểm tra tương thích cấp cao hơn: nó khởi động một
container gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI đã ghim phiên bản trỏ tới gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` hiển thị `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Lần chạy đầu tiên có thể chậm hơn đáng kể vì Docker có thể cần pull image
Open WebUI và Open WebUI có thể cần hoàn tất thiết lập cold-start riêng.
Lane này cần một khóa mô hình live dùng được, và `OPENCLAW_PROFILE_FILE`
(mặc định là `~/.profile`) là cách chính để cung cấp khóa đó trong các lần chạy Docker hóa.
Các lần chạy thành công in ra một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính xác định và không cần tài khoản
Telegram, Discord, hoặc iMessage thật. Nó khởi động một container Gateway
đã seed dữ liệu, khởi động container thứ hai spawn `openclaw mcp serve`, rồi
xác minh discovery hội thoại đã định tuyến, đọc transcript, metadata attachment,
hành vi hàng đợi sự kiện live, định tuyến gửi outbound, và thông báo kênh kiểu Claude +
quyền qua cầu nối MCP stdio thật. Kiểm tra thông báo
kiểm tra trực tiếp các frame MCP stdio thô để smoke xác thực thứ
cầu nối thật sự phát ra, không chỉ những gì một SDK client cụ thể tình cờ hiển thị.
`test:docker:pi-bundle-mcp-tools` có tính xác định và không cần khóa mô hình live.
Nó build image Docker của repo, khởi động một server probe MCP stdio thật
bên trong container, hiện thực hóa server đó qua runtime MCP của gói Pi
được nhúng, thực thi công cụ, rồi xác minh `coding` và `messaging` giữ lại
công cụ `bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa mô hình live.
Nó khởi động một Gateway đã seed dữ liệu với một server probe MCP stdio thật, chạy một
turn cron cô lập và một turn con one-shot `/subagents spawn`, rồi xác minh
tiến trình con MCP thoát sau mỗi lần chạy.

Smoke thủ công cho thread ACP bằng ngôn ngữ tự nhiên (không thuộc CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các quy trình hồi quy/debug. Có thể cần lại để xác thực định tuyến thread ACP, vì vậy đừng xóa nó.

Các biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy kiểm thử
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được source từ `OPENCLAW_PROFILE_FILE`, dùng thư mục cấu hình/workspace tạm thời và không mount xác thực CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các bản cài CLI được cache bên trong Docker
- Các thư mục/tệp xác thực CLI bên ngoài dưới `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi kiểm thử bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy provider đã thu hẹp chỉ mount những thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc provider trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để dùng lại image `openclaw:local-live` hiện có cho các lần chạy lại không cần rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo thông tin xác thực đến từ profile store (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình do gateway hiển thị cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce dùng bởi smoke Open WebUI
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã ghim

## Kiểm tra hợp lý tài liệu

Chạy kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra heading trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy offline (an toàn cho CI)

Đây là các hồi quy “pipeline thật” không có provider thật:

- Gọi công cụ Gateway (mock OpenAI, gateway thật + vòng lặp agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Trình wizard Gateway (WS `wizard.start`/`wizard.next`, ghi cấu hình + bắt buộc xác thực): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval độ tin cậy của agent (skills)

Chúng ta đã có một vài kiểm thử an toàn cho CI hoạt động như “eval độ tin cậy của agent”:

- Gọi công cụ mock qua gateway thật + vòng lặp agent (`src/gateway/gateway.test.ts`).
- Các luồng wizard end-to-end xác thực nối dây session và hiệu ứng cấu hình (`src/gateway/gateway.test.ts`).

Những gì vẫn còn thiếu cho skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh những skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi dùng và làm theo các bước/đối số bắt buộc không?
- **Hợp đồng workflow:** các kịch bản nhiều turn xác nhận thứ tự công cụ, carryover lịch sử session, và ranh giới sandbox.

Các eval tương lai nên ưu tiên tính xác định trước:

- Một trình chạy kịch bản dùng provider mock để xác nhận lời gọi công cụ + thứ tự, đọc tệp skill, và nối dây session.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng so với tránh, gating, prompt injection).
- Eval live tùy chọn (opt-in, gated bằng env) chỉ sau khi bộ an toàn cho CI đã sẵn sàng.

## Kiểm thử hợp đồng (hình dạng Plugin và kênh)

Kiểm thử hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ
hợp đồng interface của nó. Chúng lặp qua tất cả Plugin được phát hiện và chạy một bộ
assertion về hình dạng và hành vi. Lane unit `pnpm test` mặc định cố ý
bỏ qua các tệp smoke và shared seam này; hãy chạy các lệnh hợp đồng một cách tường minh
khi bạn chạm vào các surface kênh hoặc provider dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng provider: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng Plugin cơ bản (id, tên, capability)
- **setup** - Hợp đồng trình wizard thiết lập
- **session-binding** - Hành vi binding session
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn inbound
- **actions** - Handler action của kênh
- **threading** - Xử lý ID thread
- **directory** - API directory/roster
- **group-policy** - Thực thi chính sách nhóm

### Hợp đồng trạng thái provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe trạng thái kênh
- **registry** - Hình dạng registry Plugin

### Hợp đồng provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng luồng xác thực
- **auth-choice** - Lựa chọn/chọn xác thực
- **catalog** - API danh mục mô hình
- **discovery** - Discovery Plugin
- **loader** - Tải Plugin
- **runtime** - Runtime provider
- **shape** - Hình dạng/interface Plugin
- **wizard** - Trình wizard thiết lập

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa đổi một Plugin kênh hoặc provider
- Sau khi refactor đăng ký hoặc discovery Plugin

Kiểm thử hợp đồng chạy trong CI và không yêu cầu khóa API thật.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề provider/mô hình được phát hiện trong live:

- Thêm một hồi quy an toàn cho CI nếu có thể (provider mock/stub, hoặc capture chính xác phép biến đổi hình dạng yêu cầu)
- Nếu nó vốn chỉ có thể kiểm thử live (rate limit, chính sách xác thực), hãy giữ kiểm thử live hẹp và opt-in qua biến môi trường
- Ưu tiên nhắm vào lớp nhỏ nhất bắt được lỗi:
  - lỗi chuyển đổi/phát lại yêu cầu provider → kiểm thử models trực tiếp
  - lỗi pipeline gateway session/history/tool → smoke gateway live hoặc kiểm thử mock gateway an toàn cho CI
- Guardrail duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` lấy một target mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi assert exec id có phân đoạn duyệt bị từ chối.
  - Nếu bạn thêm một họ target SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong kiểm thử đó. Kiểm thử cố ý fail với target id chưa được phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Kiểm thử live](/vi/help/testing-live)
- [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
