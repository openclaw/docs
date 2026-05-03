---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm kiểm thử hồi quy cho lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của Gateway và tác tử
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử unit/e2e/live, trình chạy Docker, và phạm vi kiểm thử của từng loại'
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-03T10:38:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7fb57bee958c4e6243f02193a657d7b19ca633c7a27f70eac6b590931390671
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (unit/integration, e2e, live) và một tập nhỏ
các trình chạy Docker. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ kiểm thử bao phủ những gì (và những gì nó chủ ý _không_ bao phủ).
- Các lệnh cần chạy cho những quy trình phổ biến (cục bộ, trước khi push, gỡ lỗi).
- Cách các kiểm thử live phát hiện thông tin xác thực và chọn model/provider.
- Cách thêm hồi quy cho các sự cố model/provider trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các làn vận chuyển live)** được ghi tài liệu riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) — kiến trúc, bề mặt lệnh, biên soạn kịch bản.
- [QA ma trận](/vi/concepts/qa-matrix) — tài liệu tham chiếu cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) — Plugin vận chuyển tổng hợp được dùng bởi các kịch bản dựa trên repo.

Trang này bao phủ việc chạy các bộ kiểm thử thông thường và các trình chạy Docker/Parallels. Phần trình chạy dành riêng cho QA bên dưới ([Trình chạy dành riêng cho QA](#qa-specific-runners)) liệt kê các lệnh gọi `qa` cụ thể và trỏ lại các tài liệu tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng kiểm tra đầy đủ (được kỳ vọng trước khi push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy dư tài nguyên: `pnpm test:max`
- Vòng lặp theo dõi Vitest trực tiếp: `pnpm test:watch`
- Nhắm trực tiếp vào tệp giờ cũng định tuyến các đường dẫn tiện ích mở rộng/kênh: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên chạy có mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Trang QA dựa trên Docker: `pnpm qa:lab:up`
- Làn QA dựa trên Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng kiểm tra coverage: `pnpm test:coverage`
- Bộ E2E: `pnpm test:e2e`

Khi gỡ lỗi các provider/model thật (yêu cầu thông tin xác thực thật):

- Bộ live (model + các phép dò công cụ/hình ảnh Gateway): `pnpm test:live`
- Nhắm một tệp live ở chế độ im lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng runtime: dispatch `OpenClaw Performance` với
  `live_gpt54=true` cho một lượt agent `openai/gpt-5.4` thật hoặc
  `deep_profile=true` cho các artifact CPU/heap/trace của Kova. Các lượt chạy hằng ngày theo lịch
  publish artifact của các làn mock-provider, deep-profile và GPT 5.4 lên
  `openclaw/clawgrit-reports` khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình. Báo cáo
  mock-provider cũng bao gồm số liệu cấp nguồn cho khởi động Gateway, bộ nhớ,
  áp lực Plugin, vòng hello-loop fake-model lặp lại, và khởi động CLI.
- Quét model live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi model được chọn giờ chạy một lượt văn bản cộng với một phép dò nhỏ kiểu đọc tệp.
    Các model có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các phép dò bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi provider.
  - Phạm vi CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E có thể tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận Docker live model riêng
    được chia shard theo provider.
  - Để chạy lại CI tập trung, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm secret provider tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng với `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các caller
    theo lịch/release của nó.
- Smoke bound-chat Codex native: `pnpm test:docker:live-codex-bind`
  - Chạy một làn Docker live với đường dẫn app-server Codex, bind một Slack DM tổng hợp
    bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi thường và một tệp đính kèm hình ảnh
    định tuyến qua binding Plugin native thay vì ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt agent Gateway qua harness app-server Codex do Plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và theo mặc định thực thi các phép dò hình ảnh,
    cron MCP, sub-agent và Guardian. Tắt phép dò sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi app-server Codex
    khác. Để kiểm tra sub-agent tập trung, tắt các phép dò khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Lệnh này thoát sau phép dò sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Smoke lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra chọn tham gia theo kiểu thắt lưng và dây đeo cho bề mặt lệnh cứu hộ message-channel.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi model bền vững,
    trả lời `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong container không có cấu hình với một Claude CLI giả trên `PATH`
    và xác minh fallback planner mờ được dịch thành một lần ghi cấu hình có kiểu đã được audit.
- Smoke Docker lần chạy đầu của Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ một thư mục trạng thái OpenClaw trống, định tuyến `openclaw` trần tới
    Crestodian, áp dụng các lần ghi setup/model/agent/Plugin Discord + SecretRef,
    xác thực cấu hình, và xác minh các mục audit. Cùng đường dẫn thiết lập Ring 0 cũng
    được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  cô lập với `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và transcript
  của assistant lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một trường hợp lỗi, ưu tiên thu hẹp các kiểm thử live qua các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Trình chạy dành riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần tính thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. Tính tương đương agentic được lồng dưới
`QA-Lab - All Lanes` và xác thực release, không phải một workflow PR độc lập.
Xác thực rộng nên dùng `Full Release Validation` với
`rerun_group=qa-parity` hoặc nhóm QA của release-checks. `QA-Lab - All Lanes`
chạy hằng đêm trên `main` và từ dispatch thủ công với làn mock parity, làn
Matrix live, làn Telegram live do Convex quản lý, và làn Discord live do Convex
quản lý dưới dạng các job song song. QA theo lịch và kiểm tra release truyền Matrix
`--profile fast` một cách tường minh, trong khi CLI Matrix và input workflow thủ công
vẫn mặc định là `all`; dispatch thủ công có thể chia shard `all` thành các job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`. `OpenClaw Release
Checks` chạy parity cộng với các làn Matrix nhanh và Telegram trước khi phê duyệt
release, dùng `mock-openai/gpt-5.5` cho các kiểm tra vận chuyển release để chúng giữ
tính xác định và tránh khởi động provider-plugin thông thường. Các Gateway vận chuyển live
này tắt tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ QA parity.

Các shard media live của full release dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard model/backend live bằng Docker dùng image dùng chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi commit được chọn,
sau đó pull nó bằng `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì rebuild
bên trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy trực tiếp các kịch bản QA dựa trên repo trên máy chủ.
  - Mặc định chạy song song nhiều kịch bản đã chọn bằng các worker
    gateway biệt lập. `qa-channel` mặc định có concurrency 4 (bị giới hạn bởi
    số kịch bản đã chọn). Dùng `--concurrency <count>` để tinh chỉnh số lượng
    worker, hoặc `--concurrency 1` cho làn chạy tuần tự cũ hơn.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Hỗ trợ các chế độ nhà cung cấp `live-frontier`, `mock-openai`, và `aimock`.
    `aimock` khởi động một máy chủ nhà cung cấp cục bộ dựa trên AIMock cho phạm vi
    fixture thử nghiệm và mock giao thức mà không thay thế làn
    `mock-openai` nhận biết kịch bản.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy bench khởi động gateway cộng với một gói nhỏ kịch bản QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi bản tóm tắt quan sát CPU kết hợp
    dưới `.artifacts/gateway-cpu-scenarios/`.
  - Mặc định chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cộng với `--hot-wall-warn-ms`), vì vậy các đợt tăng ngắn khi khởi động được ghi lại như chỉ số
    mà không trông giống hồi quy gateway bị ghim CPU kéo dài nhiều phút.
  - Dùng artifact `dist` đã build; hãy chạy build trước khi checkout chưa
    có đầu ra runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA bên trong một VM Linux Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên máy chủ.
  - Tái sử dụng cùng các cờ chọn nhà cung cấp/mô hình như `qa suite`.
  - Các lần chạy live chuyển tiếp những đầu vào xác thực QA được hỗ trợ và thực tế cho khách:
    khóa nhà cung cấp dựa trên env, đường dẫn cấu hình nhà cung cấp live QA, và `CODEX_HOME`
    khi có.
  - Thư mục đầu ra phải nằm dưới gốc repo để khách có thể ghi ngược qua
    workspace đã mount.
  - Ghi báo cáo + tóm tắt QA thông thường cùng với log Multipass dưới
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA dựa trên Docker cho công việc QA kiểu vận hành.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt toàn cục trong
    Docker, chạy onboarding khóa API OpenAI không tương tác, cấu hình Telegram
    theo mặc định, xác minh runtime plugin đã đóng gói tải được mà không cần sửa chữa
    dependency khi khởi động, chạy doctor, và chạy một lượt agent cục bộ với
    endpoint OpenAI được mock.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng làn cài đặt gói
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một smoke Docker app đã build mang tính xác định cho transcript ngữ cảnh runtime
    nhúng. Lệnh xác minh ngữ cảnh runtime OpenClaw ẩn được lưu giữ dưới dạng
    thông điệp tùy chỉnh không hiển thị thay vì rò rỉ vào lượt người dùng hiển thị,
    sau đó seed một JSONL phiên bị hỏng bị ảnh hưởng và xác minh
    `openclaw doctor --fix` ghi lại nó sang nhánh đang hoạt động kèm bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên gói OpenClaw trong Docker, chạy onboarding gói đã cài,
    cấu hình Telegram qua CLI đã cài, rồi tái sử dụng làn QA Telegram live với
    gói đã cài đó làm Gateway SUT.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử tarball cục bộ đã phân giải thay vì
    cài từ registry.
  - Dùng cùng thông tin xác thực env Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/phát hành, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cộng với
    `OPENCLAW_QA_CONVEX_SITE_URL` và secret vai trò. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một secret vai trò Convex có trong CI,
    wrapper Docker tự động chọn Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho làn này.
  - GitHub Actions cung cấp làn này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và lease thông tin xác thực Convex CI.
- GitHub Actions cũng cung cấp `Package Acceptance` cho bằng chứng sản phẩm chạy bên cạnh
  với một gói ứng viên. Nó chấp nhận một ref đáng tin cậy, spec npm đã phát hành,
  URL tarball HTTPS kèm SHA-256, hoặc artifact tarball từ một lần chạy khác, tải lên
  `openclaw-current.tgz` đã chuẩn hóa dưới dạng `package-under-test`, rồi chạy
  bộ lập lịch Docker E2E hiện có với các hồ sơ làn smoke, package, product, full, hoặc custom.
  Đặt `telegram_mode=mock-openai` hoặc `live-frontier` để chạy workflow
  QA Telegram với cùng artifact `package-under-test`.
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

- Bằng chứng artifact tải xuống artifact tarball từ một lần chạy Actions khác:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Đóng gói và cài đặt bản build OpenClaw hiện tại trong Docker, khởi động Gateway
    với OpenAI đã cấu hình, rồi bật các kênh/plugin được đóng gói thông qua chỉnh sửa cấu hình.
  - Xác minh khám phá thiết lập để các plugin có thể tải xuống nhưng chưa cấu hình không xuất hiện,
    lần sửa chữa doctor đã cấu hình đầu tiên cài đặt tường minh từng plugin có thể tải xuống
    bị thiếu, và lần khởi động lại thứ hai không chạy sửa chữa dependency ẩn.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của ứng viên
    dọn dẹp mảnh vụn dependency plugin legacy mà không cần sửa chữa postinstall phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật cài đặt gói native trên các khách Parallels. Mỗi
    nền tảng đã chọn trước tiên cài đặt gói baseline được yêu cầu, rồi chạy
    lệnh `openclaw update` đã cài trong cùng khách và xác minh phiên bản
    đã cài, trạng thái cập nhật, độ sẵn sàng gateway, và một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một khách. Dùng `--json` cho đường dẫn artifact tóm tắt và
    trạng thái từng làn.
  - Làn OpenAI mặc định dùng `openai/gpt-5.5` cho bằng chứng lượt agent live.
    Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi cố ý xác thực một
    mô hình OpenAI khác.
  - Bọc các lần chạy cục bộ dài trong timeout của máy chủ để các lần kẹt truyền tải Parallels không
    chiếm hết phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi log làn lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi giả định wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong doctor sau cập nhật và công việc
    cập nhật gói trên khách lạnh; điều đó vẫn là bình thường khi log debug npm
    lồng nhau đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với các làn smoke Parallels
    macOS, Windows, hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể va chạm khi
    khôi phục snapshot, phục vụ gói, hoặc trạng thái gateway của khách.
  - Bằng chứng sau cập nhật chạy bề mặt plugin đóng gói thông thường vì
    các facade năng lực như speech, tạo hình ảnh, và hiểu phương tiện
    được tải qua API runtime đóng gói ngay cả khi lượt agent
    tự nó chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ nhà cung cấp AIMock cục bộ để kiểm thử smoke giao thức
    trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy làn QA live Matrix với một homeserver Tuwunel dùng Docker dùng một lần. Chỉ checkout nguồn — bản cài đặt đóng gói không ship `qa-lab`.
  - CLI đầy đủ, danh mục hồ sơ/kịch bản, biến env, và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy làn QA live Telegram với một nhóm riêng tư thật bằng token bot driver và SUT từ env.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID nhóm phải là ID chat Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực pooled dùng chung. Dùng chế độ env theo mặc định, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng lease pooled.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng nhóm riêng tư, với bot SUT hiển thị username Telegram.
  - Để quan sát bot-với-bot ổn định, bật Chế độ giao tiếp Bot-to-Bot trong `@BotFather` cho cả hai bot và đảm bảo bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, tóm tắt, và artifact thông điệp đã quan sát dưới `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT đã quan sát.

Các làn truyền tải live dùng chung một hợp đồng chuẩn để các truyền tải mới không lệch hướng; ma trận phạm vi từng làn nằm trong [Tổng quan QA → Phạm vi truyền tải live](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ tổng hợp rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi bật `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) cho
`openclaw qa telegram`, QA lab nhận một lease độc quyền từ pool dựa trên Convex, heartbeat
lease đó trong khi làn đang chạy, và giải phóng lease khi tắt.

Scaffold dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Biến env bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho vai trò đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn vai trò thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định env: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, nếu không thì `maintainer`)

Biến env tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID truy vết tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` loopback cho phát triển chỉ cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong hoạt động bình thường.

Các lệnh quản trị maintainer (thêm/xóa/liệt kê pool) yêu cầu
riêng `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Trình trợ giúp CLI cho maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lần chạy live để kiểm tra URL site Convex, secret broker,
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
- `POST /admin/add` (chỉ bí mật của maintainer)
  - Yêu cầu: `{ kind, actorId, payload, note?, status? }`
  - Thành công: `{ status: "ok", credential }`
- `POST /admin/remove` (chỉ bí mật của maintainer)
  - Yêu cầu: `{ credentialId, actorId }`
  - Thành công: `{ status: "ok", changed, credential }`
  - Bộ bảo vệ lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ bí mật của maintainer)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Dạng payload cho kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi id chat Telegram dạng số.
- `admin/add` xác thực dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

### Thêm một kênh vào QA

Kiến trúc và tên helper kịch bản cho các bộ điều hợp kênh mới nằm trong [Tổng quan QA → Thêm một kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai transport runner trên seam host `qa-lab` dùng chung, khai báo `qaRunners` trong manifest plugin, mount thành `openclaw qa <runner>`, và viết kịch bản trong `qa/scenarios/`.

## Bộ kiểm thử (chạy ở đâu)

Hãy xem các bộ này là “độ thực tế tăng dần” (và độ bất ổn/chi phí cũng tăng dần):

### Unit / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm đích dùng tập shard `vitest.full-*.config.ts` và có thể mở rộng các shard đa dự án thành cấu hình theo từng dự án để lập lịch song song
- Tệp: inventory core/unit trong `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử unit UI chạy trong shard chuyên dụng `unit-ui`
- Phạm vi:
  - Kiểm thử unit thuần
  - Kiểm thử tích hợp trong tiến trình (xác thực Gateway, định tuyến, công cụ, phân tích cú pháp, cấu hình)
  - Hồi quy xác định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không cần khóa thật
  - Nên nhanh và ổn định
  - Kiểm thử resolver và loader bề mặt công khai phải chứng minh hành vi fallback rộng của `api.js` và
    `runtime-api.js` bằng các fixture plugin nhỏ được tạo sinh, không phải
    API nguồn plugin bundled thật. Tải API plugin thật thuộc về
    các bộ contract/tích hợp do plugin sở hữu.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` không nhắm đích chạy mười hai cấu hình shard nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình root-project gốc khổng lồ. Cách này giảm RSS đỉnh trên máy tải nặng và tránh việc auto-reply/extension làm thiếu tài nguyên của các bộ không liên quan.
    - `pnpm test --watch` vẫn dùng đồ thị dự án gốc `vitest.config.ts`, vì vòng lặp watch đa shard không thực tế.
    - `pnpm test`, `pnpm test:watch`, và `pnpm test:perf:imports` định tuyến các đích tệp/thư mục rõ ràng qua các lane có phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả chi phí khởi động toàn bộ root project.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các lane có phạm vi rẻ: sửa trực tiếp tệp kiểm thử, tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng, và các phụ thuộc đồ thị import cục bộ. Sửa cấu hình/setup/package không chạy kiểm thử rộng trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường cho công việc hẹp. Nó phân loại diff thành core, kiểm thử core, extensions, kiểm thử extension, ứng dụng, tài liệu, metadata phát hành, công cụ Docker live, và tooling, rồi chạy các lệnh typecheck, lint, và guard tương ứng. Nó không chạy kiểm thử Vitest; gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các lần bump phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc root có nhắm đích, với một guard từ chối thay đổi package bên ngoài trường phiên bản cấp cao nhất.
    - Các chỉnh sửa harness Docker ACP live chạy kiểm tra tập trung: cú pháp shell cho các script xác thực Docker live và dry-run bộ lập lịch Docker live. Thay đổi `package.json` chỉ được bao gồm khi diff bị giới hạn trong `scripts["test:docker:live-*"]`; các chỉnh sửa phụ thuộc, export, phiên bản, và bề mặt package khác vẫn dùng các guard rộng hơn.
    - Các kiểm thử unit nhẹ import từ agents, commands, plugins, helper auto-reply, `plugin-sdk`, và các vùng tiện ích thuần tương tự được định tuyến qua lane `unit-fast`, lane này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng runtime vẫn ở các lane hiện có.
    - Một số tệp nguồn helper `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy chế độ changed tới kiểm thử cùng cấp rõ ràng trong các lane nhẹ đó, nên chỉnh sửa helper tránh phải chạy lại toàn bộ bộ kiểm thử nặng cho thư mục đó.
    - `auto-reply` có các bucket chuyên dụng cho helper core cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất, và cây con `src/auto-reply/reply/**`. CI tiếp tục tách cây con reply thành các shard agent-runner, dispatch, và commands/state-routing để một bucket nặng import không sở hữu toàn bộ phần đuôi Node.
    - CI PR/main thông thường cố ý bỏ qua sweep batch extension và shard `agentic-plugins` chỉ dành cho phát hành. Full Release Validation dispatch workflow con `Plugin Prerelease` riêng cho các bộ nặng plugin/extension đó trên các release candidate.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Khi bạn thay đổi input khám phá message-tool hoặc ngữ cảnh runtime compaction,
      hãy giữ cả hai mức bao phủ.
    - Thêm hồi quy helper tập trung cho các ranh giới định tuyến và chuẩn hóa
      thuần.
    - Giữ các bộ tích hợp embedded runner khỏe mạnh:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ đó xác minh rằng id có phạm vi và hành vi compaction vẫn đi qua
      các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ helper
      không phải là thay thế đủ cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Cấu hình Vitest cơ sở mặc định dùng `threads`.
    - Cấu hình Vitest dùng chung cố định `isolate: false` và dùng runner
      không cô lập trên các dự án root, e2e, và cấu hình live.
    - Lane UI root giữ setup `jsdom` và optimizer của nó, nhưng cũng chạy trên
      runner không cô lập dùng chung.
    - Mỗi shard `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false`
      từ cấu hình Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình Node
      con của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8
      nguyên bản.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` hiển thị những lane kiến trúc mà một diff kích hoạt.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck, hoặc kiểm thử.
    - Chạy rõ ràng `pnpm check:changed` trước khi bàn giao hoặc push khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các lane có phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      quyết định một chỉnh sửa harness, cấu hình, package, hoặc contract thật sự cần
      độ bao phủ Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ cùng hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động co giãn worker cục bộ được thiết kế thận trọng và giảm tải
      khi load average của host đã cao, nên nhiều lần chạy Vitest đồng thời
      mặc định gây ít ảnh hưởng hơn.
    - Cấu hình Vitest cơ sở đánh dấu các tệp dự án/cấu hình là
      `forceRerunTriggers` để các lần chạy lại chế độ changed vẫn đúng khi
      dây nối kiểm thử thay đổi.
    - Cấu hình giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` được bật trên các
      host được hỗ trợ; đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache rõ ràng cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cộng với
      output phân tích import.
    - `pnpm test:perf:imports:changed` giới hạn cùng góc nhìn profiling đó vào
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian shard được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn bộ cấu hình dùng đường dẫn cấu hình làm khóa; shard CI
      theo mẫu include nối thêm tên shard để các shard đã lọc có thể được theo dõi
      riêng.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho import khởi động,
      giữ các phụ thuộc nặng phía sau một seam cục bộ hẹp `*.runtime.ts` và
      mock trực tiếp seam đó thay vì deep-import các helper runtime chỉ
      để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn root-project gốc cho diff
      đã commit đó và in thời gian wall cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây hiện tại
      đang bẩn bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và cấu hình Vitest root.
    - `pnpm test:perf:profile:main` ghi profile CPU main-thread cho
      chi phí khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi profile CPU+heap của runner cho bộ
      unit với song song hóa theo tệp bị tắt.

  </Accordion>
</AccordionGroup>

### Độ ổn định (gateway)

- Lệnh: `pnpm test:stability:gateway`
- Cấu hình: `vitest.gateway.config.ts`, ép dùng một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với diagnostics mặc định được bật
  - Đẩy churn thông điệp gateway, bộ nhớ, và payload lớn tổng hợp qua đường dẫn sự kiện diagnostic
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các helper lưu giữ bundle ổn định diagnostic
  - Khẳng định recorder vẫn bị giới hạn, mẫu RSS tổng hợp vẫn dưới ngân sách áp lực, và độ sâu hàng đợi theo phiên rút về không
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Lane hẹp cho theo dõi hồi quy độ ổn định, không phải thay thế cho toàn bộ bộ Gateway

### E2E (gateway smoke)

- Lệnh: `pnpm test:e2e`
- Cấu hình: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và kiểm thử E2E plugin bundled trong `extensions/`
- Mặc định runtime:
  - Dùng `threads` của Vitest với `isolate: false`, khớp phần còn lại của repo.
  - Dùng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ im lặng để giảm chi phí I/O console.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để ép số worker (giới hạn tối đa 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại output console chi tiết.
- Phạm vi:
  - Hành vi end-to-end gateway đa phiên bản
  - Bề mặt WebSocket/HTTP, ghép cặp node, và networking nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không cần khóa thật
  - Nhiều phần chuyển động hơn kiểm thử unit (có thể chậm hơn)

### E2E: smoke backend OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Khởi động một OpenShell gateway cô lập trên máy chủ qua Docker
  - Tạo một sandbox từ Dockerfile cục bộ tạm thời
  - Thực thi backend OpenShell của OpenClaw qua `sandbox ssh-config` thực + SSH exec
  - Xác minh hành vi hệ thống tệp chuẩn-từ-xa thông qua cầu nối sandbox fs
- Kỳ vọng:
  - Chỉ chạy khi chọn tham gia; không thuộc lượt chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cùng một Docker daemon hoạt động
  - Dùng `HOME` / `XDG_CONFIG_HOME` cô lập, rồi hủy Gateway kiểm thử và sandbox
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới một CLI binary hoặc wrapper script không mặc định

### Trực tiếp (nhà cung cấp thực + mô hình thực)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các kiểm thử trực tiếp Plugin đóng gói trong `extensions/`
- Mặc định: **được bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - “Nhà cung cấp/mô hình này có thực sự hoạt động _hôm nay_ với thông tin xác thực thực không?”
  - Bắt các thay đổi định dạng của nhà cung cấp, điểm kỳ quặc khi gọi công cụ, vấn đề xác thực và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế không ổn định cho CI (mạng thực, chính sách nhà cung cấp thực, hạn mức, sự cố ngừng dịch vụ)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con đã thu hẹp thay vì “mọi thứ”
- Các lượt chạy trực tiếp lấy nguồn `~/.profile` để nạp các khóa API còn thiếu.
- Theo mặc định, các lượt chạy trực tiếp vẫn cô lập `HOME` và sao chép vật liệu cấu hình/xác thực vào một thư mục home kiểm thử tạm thời để fixture đơn vị không thể làm thay đổi `~/.openclaw` thực của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn chủ ý cần kiểm thử trực tiếp dùng thư mục home thực của mình.
- `pnpm test:live` nay mặc định dùng chế độ ít ồn hơn: vẫn giữ đầu ra tiến trình `[live] ...`, nhưng ẩn thông báo bổ sung về `~/.profile` và tắt tiếng nhật ký bootstrap Gateway/tán gẫu Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn có lại toàn bộ nhật ký khởi động.
- Xoay vòng khóa API (theo từng nhà cung cấp): đặt `*_API_KEYS` với định dạng dấu phẩy/dấu chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè theo từng lượt trực tiếp qua `OPENCLAW_LIVE_*_KEY`; kiểm thử sẽ thử lại khi có phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ trực tiếp nay phát các dòng tiến trình ra stderr để các lệnh gọi nhà cung cấp kéo dài hiển thị rõ là vẫn đang hoạt động ngay cả khi phần ghi console của Vitest đang im lặng.
  - `vitest.live.config.ts` tắt cơ chế chặn console của Vitest để các dòng tiến trình của nhà cung cấp/Gateway truyền ngay trong lượt chạy trực tiếp.
  - Tinh chỉnh Heartbeat mô hình trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Tinh chỉnh Heartbeat Gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ nào?

Dùng bảng quyết định này:

- Sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn thay đổi nhiều)
- Chạm vào mạng Gateway / giao thức WS / ghép đôi: thêm `pnpm test:e2e`
- Gỡ lỗi “bot của tôi đang sập” / lỗi theo nhà cung cấp / gọi công cụ: chạy `pnpm test:live` đã thu hẹp

## Kiểm thử trực tiếp (chạm mạng)

Với ma trận mô hình trực tiếp, smoke backend CLI, smoke ACP, harness app-server
Codex, và tất cả kiểm thử trực tiếp của nhà cung cấp media (Deepgram, BytePlus, ComfyUI, hình ảnh,
nhạc, video, media harness) — cộng với xử lý thông tin xác thực cho lượt chạy trực tiếp — xem
[Kiểm thử các bộ trực tiếp](/vi/help/testing-live). Với checklist chuyên biệt cho cập nhật và
xác thực Plugin, xem
[Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Trình chạy Docker (kiểm tra tùy chọn "hoạt động trên Linux")

Các trình chạy Docker này được chia thành hai nhóm:

- Trình chạy mô hình trực tiếp: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp trực tiếp profile-key tương ứng của chúng bên trong ảnh Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), mount thư mục cấu hình cục bộ và workspace của bạn (và lấy nguồn `~/.profile` nếu được mount). Các entrypoint cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Trình chạy Docker trực tiếp mặc định dùng giới hạn smoke nhỏ hơn để một lượt quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các biến môi trường đó khi bạn
  chủ ý muốn lượt quét đầy đủ lớn hơn.
- `test:docker:all` xây dựng ảnh Docker trực tiếp một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần thành tarball npm qua `scripts/package-openclaw-for-docker.mjs`, rồi xây dựng/tái sử dụng hai ảnh `scripts/e2e/Dockerfile`. Ảnh trống chỉ là trình chạy Node/Git cho các lane cài đặt/cập nhật/phụ thuộc-Plugin; các lane đó mount tarball đã dựng sẵn. Ảnh chức năng cài cùng tarball đó vào `/app` cho các lane chức năng ứng dụng đã build. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Phần tổng hợp dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` kiểm soát các slot tiến trình, trong khi giới hạn tài nguyên ngăn các lane trực tiếp nặng, npm-install và đa dịch vụ khởi động cùng lúc. Nếu một lane đơn nặng hơn các giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động lane đó khi pool trống rồi giữ nó chạy một mình cho tới khi lại có dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ tinh chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi Docker host có thêm dư địa. Trình chạy mặc định thực hiện preflight Docker, xóa các container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời lượng lane thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời lượng đó để khởi động các lane dài hơn trước trong những lượt chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane có trọng số mà không build hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các lane đã chọn, nhu cầu package/ảnh và thông tin xác thực.
- `Package Acceptance` là cổng package gốc GitHub cho "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một package ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải lên dưới tên `package-under-test`, rồi chạy các lane Docker E2E tái sử dụng dựa trên đúng tarball đó thay vì đóng gói lại ref đã chọn. Profile được sắp theo độ rộng: `smoke`, `package`, `product`, và `full`. Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết contract package/cập nhật/Plugin, ma trận tồn tại sau nâng cấp đã phát hành, mặc định phát hành và phân loại lỗi.
- Kiểm tra build và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Guard duyệt đồ thị đã build tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và thất bại nếu khởi động trước-dispatch import phụ thuộc package như Commander, prompt UI, undici hoặc logging trước khi dispatch lệnh; nó cũng giữ chunk chạy Gateway được đóng gói trong ngân sách và từ chối import tĩnh các đường dẫn Gateway lạnh đã biết. Smoke CLI đã đóng gói cũng bao phủ root help, onboard help, doctor help, status, schema cấu hình và một lệnh model-list.
- Tương thích legacy của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Tới hết mốc đó, harness chỉ dung thứ các khoảng trống metadata của package đã phát hành: các mục QA inventory riêng tư bị bỏ qua, thiếu `gateway install --wrapper`, thiếu tệp patch trong fixture git bắt nguồn từ tarball, thiếu `update.channel` được lưu bền, vị trí bản ghi cài đặt Plugin legacy, thiếu lưu bền bản ghi cài đặt marketplace, và migration metadata cấu hình trong `plugins update`. Với các package sau `2026.4.25`, các đường dẫn đó là lỗi nghiêm ngặt.
- Trình chạy smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, và `test:docker:config-reload` khởi động một hoặc nhiều container thực và xác minh các đường dẫn tích hợp cấp cao hơn.

Các trình chạy Docker mô hình trực tiếp cũng chỉ bind-mount các home xác thực CLI cần thiết (hoặc tất cả những home được hỗ trợ khi lượt chạy không được thu hẹp), rồi sao chép chúng vào home của container trước lượt chạy để OAuth của CLI bên ngoài có thể làm mới token mà không làm thay đổi kho xác thực của host:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Kiểm thử smoke liên kết ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với phạm vi bao phủ Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử smoke khả năng quan sát: `pnpm qa:otel:smoke` là một luồng QA riêng tư trên bản checkout nguồn. Nó cố ý không thuộc các luồng phát hành Docker của gói vì npm tarball bỏ qua QA Lab.
- Kiểm thử smoke trực tiếp Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, scaffolding đầy đủ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử smoke onboarding/kênh/agent npm tarball: `pnpm test:docker:npm-onboard-channel-agent` cài đặt OpenClaw tarball đã đóng gói ở phạm vi toàn cục trong Docker, cấu hình OpenAI qua onboarding tham chiếu env cùng Telegram theo mặc định, chạy doctor, và chạy một lượt agent OpenAI được mock. Tái sử dụng tarball đã dựng sẵn với `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua dựng lại trên host với `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc chuyển kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Kiểm thử smoke chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt OpenClaw tarball đã đóng gói ở phạm vi toàn cục trong Docker, chuyển từ gói `stable` sang git `dev`, xác minh kênh đã lưu và công việc sau cập nhật của Plugin, rồi chuyển lại về gói `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử smoke sống sót sau nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt OpenClaw tarball đã đóng gói đè lên một fixture người dùng cũ bẩn với các agent, cấu hình kênh, danh sách cho phép Plugin, trạng thái phụ thuộc Plugin lỗi thời, và các tệp workspace/session hiện có. Nó chạy cập nhật gói cộng với doctor không tương tác mà không có provider trực tiếp hoặc khóa kênh, rồi khởi động một Gateway loopback và kiểm tra việc bảo toàn cấu hình/trạng thái cùng ngân sách khởi động/trạng thái.
- Kiểm thử smoke sống sót sau nâng cấp đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, gieo các tệp người dùng hiện có thực tế, cấu hình baseline đó bằng một công thức lệnh tích hợp sẵn, xác thực cấu hình kết quả, cập nhật bản cài đặt đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway loopback và kiểm tra các intent đã cấu hình, bảo toàn trạng thái, khởi động, `/healthz`, `/readyz`, và ngân sách trạng thái RPC. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các baseline chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `all-since-2026.4.23`, và mở rộng các fixture dạng issue bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; tập reported-issues bao gồm `configured-plugin-installs` để tự động sửa chữa cài đặt Plugin OpenClaw bên ngoài. Package Acceptance phơi bày các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, và `published_upgrade_survivor_scenarios`.
- Kiểm thử smoke ngữ cảnh runtime của session: `pnpm test:docker:session-runtime-context` xác minh việc lưu transcript ngữ cảnh runtime ẩn cùng sửa chữa doctor cho các nhánh viết lại prompt bị trùng lặp bị ảnh hưởng.
- Kiểm thử smoke cài đặt toàn cục Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một home cô lập, và xác minh `openclaw infer image providers --json` trả về các provider hình ảnh đi kèm thay vì treo. Tái sử dụng tarball đã dựng sẵn với `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua dựng trên host với `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một image Docker đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử smoke Docker trình cài đặt: `bash scripts/test-install-sh-docker.sh` chia sẻ một cache npm giữa các container root, update và direct-npm của nó. Kiểm thử smoke cập nhật mặc định dùng npm `latest` làm baseline stable trước khi nâng cấp lên tarball ứng viên. Ghi đè bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` cục bộ, hoặc bằng input `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ một cache npm cô lập để các mục cache thuộc sở hữu root không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để tái sử dụng cache root/update/direct-npm giữa các lần chạy lại cục bộ.
- Install Smoke CI bỏ qua cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy script cục bộ mà không có env đó khi cần bao phủ `npm install -g` trực tiếp.
- Kiểm thử smoke CLI xóa workspace dùng chung của agent: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng image Dockerfile gốc, gieo hai agent với một workspace trong home container cô lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Tái sử dụng image install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử smoke snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng image E2E nguồn cùng một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh các snapshot vai trò CDP bao phủ URL liên kết, phần có thể nhấp được nâng cấp từ con trỏ, tham chiếu iframe và metadata khung.
- Hồi quy reasoning tối thiểu của OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI được mock qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, rồi buộc schema provider từ chối và kiểm tra chi tiết thô xuất hiện trong log Gateway.
- Cầu nối kênh MCP (Gateway đã gieo + cầu nối stdio + kiểm thử smoke khung thông báo Claude thô): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP gói Pi (máy chủ MCP stdio thật + kiểm thử smoke cho phép/từ chối profile Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP Cron/subagent (Gateway thật + tháo dỡ MCP child stdio sau các lần chạy cron cô lập và subagent một lần): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (kiểm thử smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, npm registry với phụ thuộc được hoist, ref git di chuyển, ClawHub kitchen-sink, cập nhật marketplace, và bật/kiểm tra gói Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp package/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Khi không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, bài kiểm thử dùng một máy chủ fixture ClawHub cục bộ khép kín.
- Kiểm thử smoke Plugin update không thay đổi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử smoke ma trận vòng đời Plugin: `pnpm test:docker:plugin-lifecycle-matrix` cài đặt OpenClaw tarball đã đóng gói trong một container trống, cài đặt một Plugin npm, bật/tắt, nâng cấp và hạ cấp nó qua một npm registry cục bộ, xóa mã đã cài đặt, rồi xác minh uninstall vẫn xóa trạng thái lỗi thời trong khi ghi log chỉ số RSS/CPU cho từng pha vòng đời.
- Kiểm thử smoke metadata tải lại cấu hình: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` bao phủ kiểm thử smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, npm registry với phụ thuộc được hoist, ref git di chuyển, fixture ClawHub, cập nhật marketplace, và bật/kiểm tra gói Claude. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không thay đổi cho các Plugin đã cài đặt. `pnpm test:docker:plugin-lifecycle-matrix` bao phủ cài đặt, bật, tắt, nâng cấp, hạ cấp và uninstall khi thiếu mã của Plugin npm có theo dõi tài nguyên.

Để dựng trước và tái sử dụng image chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image theo bộ kiểm thử như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một image dùng chung từ xa, các script sẽ pull image đó nếu nó chưa có cục bộ. Các bài kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi gói/cài đặt thay vì runtime ứng dụng đã dựng dùng chung.

Các runner Docker dùng mô hình live cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Điều này giữ cho image runtime
gọn nhẹ trong khi vẫn chạy Vitest trên đúng source/config cục bộ của bạn.
Bước staging bỏ qua các cache lớn chỉ dùng cục bộ và output build ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục output `.build`
cục bộ của ứng dụng hoặc Gradle để các lần chạy Docker live không mất nhiều phút sao chép
artifact riêng của từng máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các probe live của gateway không khởi động
worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền cả
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi live của gateway
khỏi lane Docker đó.
`test:docker:openwebui` là smoke kiểm tra tương thích ở mức cao hơn: nó khởi động một
container gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI đã pin trỏ tới gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` hiển thị `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Lần chạy đầu tiên có thể chậm hơn rõ rệt vì Docker có thể cần pull image
Open WebUI và Open WebUI có thể cần hoàn tất bước thiết lập cold-start riêng.
Lane này cần một khóa mô hình live dùng được, và `OPENCLAW_PROFILE_FILE`
(mặc định là `~/.profile`) là cách chính để cung cấp khóa đó trong các lần chạy Dockerized.
Các lần chạy thành công in ra một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính xác định và không cần tài khoản
Telegram, Discord hoặc iMessage thật. Nó khởi động một container Gateway đã seed,
khởi động container thứ hai để spawn `openclaw mcp serve`, rồi xác minh quá trình
khám phá hội thoại được định tuyến, đọc transcript, metadata attachment,
hành vi hàng đợi sự kiện live, định tuyến gửi đi, và thông báo kênh + quyền kiểu Claude
qua cầu nối MCP stdio thật. Kiểm tra thông báo đọc trực tiếp các frame MCP stdio thô
nên smoke xác thực thứ mà cầu nối thật sự phát ra, không chỉ thứ một SDK client cụ thể
tình cờ hiển thị.
`test:docker:pi-bundle-mcp-tools` có tính xác định và không cần khóa mô hình live.
Nó build image Docker của repo, khởi động một server probe MCP stdio thật
bên trong container, hiện thực hóa server đó qua runtime MCP của bundle Pi nhúng,
thực thi tool, rồi xác minh `coding` và `messaging` giữ các tool `bundle-mcp`
trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa mô hình live.
Nó khởi động một Gateway đã seed với server probe MCP stdio thật, chạy một lượt cron
cô lập và một lượt con one-shot `/subagents spawn`, rồi xác minh tiến trình con MCP
thoát sau mỗi lần chạy.

Smoke thủ công cho thread ACP bằng ngôn ngữ thường (không chạy trong CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow regression/debug. Nó có thể lại cần cho xác thực định tuyến thread ACP, vì vậy đừng xóa nó.

Các biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được source từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục config/workspace tạm thời và không mount auth CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các bản cài CLI được cache bên trong Docker
- Các thư mục/tệp auth CLI bên ngoài dưới `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi test bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy provider đã thu hẹp chỉ mount các thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc provider trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để dùng lại image `openclaw:local-live` hiện có cho các lần chạy lại không cần rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để bảo đảm credentials đến từ profile store (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình được gateway hiển thị cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce mà smoke Open WebUI dùng
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã pin

## Kiểm tra tài liệu cơ bản

Chạy kiểm tra docs sau khi sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra heading trong trang: `pnpm docs:check-links:anchors`.

## Regression offline (an toàn cho CI)

Đây là các regression theo “pipeline thật” mà không dùng provider thật:

- Gọi tool qua Gateway (OpenAI giả lập, gateway thật + vòng lặp agent thật): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, ghi config + auth được thực thi): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval độ tin cậy của agent (Skills)

Chúng ta đã có một vài test an toàn cho CI hoạt động giống “eval độ tin cậy của agent”:

- Gọi tool giả lập qua gateway thật + vòng lặp agent (`src/gateway/gateway.test.ts`).
- Luồng wizard end-to-end xác thực dây nối session và hiệu ứng config (`src/gateway/gateway.test.ts`).

Những phần vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi dùng và làm theo các bước/đối số bắt buộc không?
- **Hợp đồng workflow:** các kịch bản nhiều lượt xác nhận thứ tự tool, việc mang tiếp lịch sử session, và ranh giới sandbox.

Các eval tương lai nên ưu tiên tính xác định trước:

- Một scenario runner dùng provider giả lập để xác nhận tool call + thứ tự, đọc tệp skill, và dây nối session.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng so với tránh, gating, prompt injection).
- Eval live tùy chọn (opt-in, có gate bằng env) chỉ sau khi bộ an toàn cho CI đã sẵn sàng.

## Test hợp đồng (hình dạng Plugin và kênh)

Test hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ
hợp đồng giao diện của nó. Chúng lặp qua tất cả Plugin được phát hiện và chạy một bộ
assertion về hình dạng và hành vi. Lane unit `pnpm test` mặc định cố ý
bỏ qua các tệp smoke và đường nối dùng chung này; hãy chạy rõ ràng các lệnh hợp đồng
khi bạn chạm vào bề mặt kênh hoặc provider dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng provider: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng Plugin cơ bản (id, name, capabilities)
- **setup** - Hợp đồng wizard thiết lập
- **session-binding** - Hành vi binding session
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn đến
- **actions** - Handler hành động kênh
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
- **shape** - Hình dạng/giao diện Plugin
- **wizard** - Wizard thiết lập

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa kênh hoặc Plugin provider
- Sau khi refactor đăng ký hoặc khám phá Plugin

Test hợp đồng chạy trong CI và không yêu cầu khóa API thật.

## Thêm regression (hướng dẫn)

Khi bạn sửa một vấn đề provider/mô hình được phát hiện trong live:

- Thêm regression an toàn cho CI nếu có thể (provider mock/stub, hoặc capture đúng phép biến đổi hình dạng request)
- Nếu nó vốn chỉ có thể là live (rate limit, chính sách auth), hãy giữ test live hẹp và opt-in qua biến môi trường
- Ưu tiên nhắm vào lớp nhỏ nhất bắt được bug:
  - bug chuyển đổi/replay request của provider → test models trực tiếp
  - bug pipeline session/history/tool của gateway → smoke live gateway hoặc test mock gateway an toàn cho CI
- Guardrail duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một target được lấy mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi assert rằng exec id có segment duyệt bị từ chối.
  - Nếu bạn thêm một họ target SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong test đó. Test cố ý fail trên target id chưa được phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Kiểm thử live](/vi/help/testing-live)
- [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
