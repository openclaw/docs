---
read_when:
    - Chạy các bài kiểm thử cục bộ hoặc trong CI
    - Thêm kiểm thử hồi quy cho các lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi Gateway + tác nhân
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử unit/e2e/live, trình chạy Docker và phạm vi bao quát của từng kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-02T10:44:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9778143e73683fde493e9652f20b8301455b53adbe6c70e997f5af2f54b3fe6b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (unit/integration, e2e, live) và một tập nhỏ
các trình chạy Docker. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ kiểm thử bao phủ những gì (và những gì nó cố ý _không_ bao phủ).
- Những lệnh cần chạy cho các quy trình thường gặp (cục bộ, trước khi push, gỡ lỗi).
- Cách các kiểm thử live phát hiện thông tin xác thực và chọn model/provider.
- Cách thêm hồi quy cho các vấn đề model/provider trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các lane truyền tải live)** được ghi tài liệu riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) — kiến trúc, bề mặt lệnh, cách viết kịch bản.
- [Matrix QA](/vi/concepts/qa-matrix) — tham chiếu cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) — Plugin truyền tải tổng hợp dùng bởi các kịch bản được repo hỗ trợ.

Trang này bao phủ việc chạy các bộ kiểm thử thông thường và các trình chạy Docker/Parallels. Phần trình chạy dành riêng cho QA bên dưới ([Trình chạy dành riêng cho QA](#qa-specific-runners)) liệt kê các lời gọi `qa` cụ thể và trỏ lại các tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Gate đầy đủ (được kỳ vọng trước khi push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy có tài nguyên rộng rãi: `pnpm test:max`
- Vòng lặp watch trực tiếp của Vitest: `pnpm test:watch`
- Nhắm mục tiêu tệp trực tiếp nay cũng định tuyến các đường dẫn extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên chạy có mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Trang QA được Docker hỗ trợ: `pnpm qa:lab:up`
- Lane QA được Linux VM hỗ trợ: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Coverage gate: `pnpm test:coverage`
- Bộ E2E: `pnpm test:e2e`

Khi gỡ lỗi provider/model thực (yêu cầu thông tin xác thực thật):

- Bộ live (model + các probe công cụ/hình ảnh của Gateway): `pnpm test:live`
- Nhắm mục tiêu một tệp live ở chế độ im lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Quét model live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi model được chọn nay chạy một lượt văn bản cộng với một probe nhỏ kiểu đọc tệp.
    Các model có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các probe bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi provider.
  - Phạm vi CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận model live Docker riêng
    được chia shard theo provider.
  - Để chạy lại CI có trọng tâm, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm các secret provider có tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các caller
    theo lịch/phát hành của nó.
- Smoke chat đã bind native Codex: `pnpm test:docker:live-codex-bind`
  - Chạy một lane live Docker trên đường dẫn app-server của Codex, bind một
    Slack DM tổng hợp bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một trả lời thuần và một tệp đính kèm hình ảnh
    định tuyến qua binding Plugin native thay vì ACP.
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
  - Kiểm tra opt-in nhiều lớp cho bề mặt lệnh cứu hộ qua kênh tin nhắn.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi model bền vững,
    trả lời `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong container không có config với một Claude CLI giả trên `PATH`
    và xác minh fallback planner mờ được chuyển thành một thao tác ghi config có kiểu
    và được audit.
- Smoke Docker lần chạy đầu Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, định tuyến `openclaw` trần tới
    Crestodian, áp dụng setup/model/agent/Plugin Discord + các ghi SecretRef,
    xác thực config, và xác minh các mục audit. Cùng đường dẫn thiết lập Ring 0 này
    cũng được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: khi `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  cô lập với `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và
  transcript của assistant lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một trường hợp lỗi, hãy ưu tiên thu hẹp kiểm thử live bằng các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Trình chạy dành riêng cho QA

Các lệnh này nằm bên cạnh các bộ kiểm thử chính khi bạn cần tính thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. `Parity gate` chạy trên các PR khớp và
từ dispatch thủ công với provider mock. `QA-Lab - All Lanes` chạy hằng đêm trên
`main` và từ dispatch thủ công với parity gate mock, lane Matrix live,
lane Telegram live do Convex quản lý, và lane Discord live do Convex quản lý dưới dạng
các job song song. QA theo lịch và kiểm tra phát hành truyền Matrix `--profile fast`
một cách tường minh, trong khi CLI Matrix và input workflow thủ công vẫn mặc định là
`all`; dispatch thủ công có thể chia shard `all` thành các job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, và `e2ee-cli`. `OpenClaw Release Checks` chạy parity cộng với
các lane Matrix nhanh và Telegram trước khi phê duyệt phát hành, dùng
`mock-openai/gpt-5.5` cho các kiểm tra truyền tải phát hành để chúng luôn tất định
và tránh khởi động provider-plugin bình thường. Các Gateway truyền tải live này tắt
tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ parity QA.

Các shard media live phát hành đầy đủ dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard model/backend live Docker dùng ảnh dùng chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi commit được chọn,
rồi pull nó với `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì build lại trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy trực tiếp các kịch bản QA được repo hỗ trợ trên host.
  - Mặc định chạy song song nhiều kịch bản được chọn với các worker Gateway cô lập.
    `qa-channel` mặc định concurrency 4 (bị giới hạn bởi số lượng kịch bản được chọn).
    Dùng `--concurrency <count>` để tinh chỉnh số worker, hoặc `--concurrency 1`
    cho lane tuần tự cũ hơn.
  - Thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn artifact mà không có mã thoát thất bại.
  - Hỗ trợ các chế độ provider `live-frontier`, `mock-openai`, và `aimock`.
    `aimock` khởi động một server provider cục bộ được AIMock hỗ trợ cho coverage
    fixture thử nghiệm và protocol-mock mà không thay thế lane `mock-openai`
    nhận biết kịch bản.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy bench khởi động Gateway cộng với một gói kịch bản QA Lab mock nhỏ
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi một bản tóm tắt quan sát CPU kết hợp
    dưới `.artifacts/gateway-cpu-scenarios/`.
  - Mặc định chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cộng `--hot-wall-warn-ms`), nên các đợt tăng ngắn khi khởi động được ghi nhận
    như metric mà không trông giống hồi quy Gateway bị ghim CPU kéo dài nhiều phút.
  - Dùng các artifact `dist` đã build; chạy build trước khi checkout chưa có
    output runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA bên trong một Linux VM Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên host.
  - Tái sử dụng cùng các flag chọn provider/model như `qa suite`.
  - Các lần chạy live chuyển tiếp các input xác thực QA được hỗ trợ và thực tế cho guest:
    key provider dựa trên env, đường dẫn config provider live QA, và `CODEX_HOME`
    khi có.
  - Thư mục output phải nằm dưới repo root để guest có thể ghi ngược qua
    workspace được mount.
  - Ghi báo cáo + tóm tắt QA thông thường cùng log Multipass dưới
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động trang QA được Docker hỗ trợ cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt nó toàn cục trong
    Docker, chạy onboarding API key OpenAI không tương tác, mặc định cấu hình Telegram,
    xác minh runtime Plugin đã đóng gói tải mà không cần sửa phụ thuộc khi khởi động,
    chạy doctor, và chạy một lượt agent cục bộ với endpoint OpenAI được mock.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane cài đặt gói
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một smoke Docker ứng dụng đã build tất định cho transcript ngữ cảnh runtime
    nhúng. Nó xác minh ngữ cảnh runtime OpenClaw ẩn được lưu bền vững như một
    thông điệp tùy chỉnh không hiển thị thay vì rò rỉ vào lượt người dùng hiển thị,
    sau đó seed một JSONL phiên bị hỏng có liên quan và xác minh
    `openclaw doctor --fix` ghi lại nó sang nhánh active kèm bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên gói OpenClaw trong Docker, chạy onboarding gói đã cài,
    cấu hình Telegram qua CLI đã cài, rồi tái sử dụng lane QA Telegram live với
    gói đã cài đó làm SUT Gateway.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã phân giải thay vì
    cài từ registry.
  - Dùng cùng thông tin xác thực env Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/phát hành, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cộng
    `OPENCLAW_QA_CONVEX_SITE_URL` và role secret. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một Convex role secret có mặt trong CI,
    wrapper Docker tự động chọn Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này.
  - GitHub Actions hiển thị lane này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và các lease thông tin xác thực Convex CI.
- GitHub Actions cũng hiển thị `Package Acceptance` cho bằng chứng sản phẩm chạy bên
  cạnh trên một gói ứng viên. Nó chấp nhận một ref đáng tin cậy, spec npm đã xuất bản,
  URL tarball HTTPS cộng SHA-256, hoặc artifact tarball từ một run khác, upload
  `openclaw-current.tgz` đã chuẩn hóa dưới dạng `package-under-test`, rồi chạy
  scheduler Docker E2E hiện có với các profile lane smoke, package, product, full,
  hoặc custom. Đặt `telegram_mode=mock-openai` hoặc `live-frontier` để chạy workflow
  QA Telegram với cùng artifact `package-under-test`.
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
  - Đóng gói và cài đặt bản dựng OpenClaw hiện tại trong Docker, khởi động Gateway
    với OpenAI đã được cấu hình, rồi bật các channel/Plugin đi kèm thông qua các
    chỉnh sửa cấu hình.
  - Xác minh rằng việc khám phá thiết lập không để lộ các Plugin có thể tải xuống
    chưa được cấu hình, lần sửa doctor được cấu hình đầu tiên cài đặt rõ ràng
    từng Plugin có thể tải xuống còn thiếu, và lần khởi động lại thứ hai không chạy
    sửa phụ thuộc ẩn.
  - Đồng thời cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của
    candidate dọn sạch phần thừa phụ thuộc Plugin cũ mà không cần sửa postinstall
    phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật cài đặt gói native trên các guest Parallels. Mỗi nền tảng
    được chọn trước tiên cài đặt gói baseline được yêu cầu, sau đó chạy lệnh
    `openclaw update` đã cài đặt trong cùng guest và xác minh phiên bản đã cài đặt,
    trạng thái cập nhật, mức sẵn sàng của gateway, và một lượt tác tử cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một guest. Dùng `--json` để lấy đường dẫn artifact tóm tắt và trạng
    thái theo từng lane.
  - Lane OpenAI mặc định dùng `openai/gpt-5.5` cho bằng chứng lượt tác tử live.
    Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi cố ý xác thực một mô hình OpenAI khác.
  - Bọc các lần chạy cục bộ dài trong một timeout của host để các lần kẹt vận
    chuyển Parallels không thể chiếm hết phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi các log lane lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi cho rằng wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong doctor sau cập nhật và công
    việc cập nhật gói trên một guest lạnh; điều đó vẫn bình thường khi log debug
    npm lồng nhau vẫn đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với các lane smoke Parallels macOS,
    Windows, hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể va chạm
    khi khôi phục snapshot, phục vụ gói, hoặc trạng thái gateway của guest.
  - Bằng chứng sau cập nhật chạy bề mặt Plugin đi kèm thông thường vì các facade
    capability như speech, image generation, và media understanding được tải qua
    các API runtime đi kèm ngay cả khi chính lượt tác tử chỉ kiểm tra một phản hồi
    văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ nhà cung cấp AIMock cục bộ để kiểm thử smoke giao thức trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy lane QA live Matrix với một homeserver Tuwunel dùng Docker dùng một lần. Chỉ source-checkout — các bản cài đặt dạng gói không phân phối `qa-lab`.
  - Toàn bộ CLI, catalog profile/scenario, biến môi trường, và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy lane QA live Telegram với một nhóm riêng thật bằng token bot driver và SUT từ môi trường.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID nhóm phải là ID chat Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực pooled dùng chung. Dùng chế độ env theo mặc định, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng lease pooled.
  - Thoát khác 0 khi bất kỳ scenario nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng một nhóm riêng, với bot SUT hiển thị username Telegram.
  - Để quan sát bot-với-bot ổn định, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và đảm bảo bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, tóm tắt, và artifact observed-messages dưới `.artifacts/qa-e2e/...`. Các scenario trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT đã quan sát.

Các lane vận chuyển live dùng chung một hợp đồng chuẩn để các vận chuyển mới không bị lệch; ma trận phạm vi theo lane nằm trong [Tổng quan QA → Phạm vi vận chuyển live](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ tổng hợp synthetic rộng và không phải là một phần của ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi bật `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) cho
`openclaw qa telegram`, QA lab lấy một lease độc quyền từ pool dùng Convex, gửi Heartbeat
cho lease đó trong khi lane đang chạy, và giải phóng lease khi tắt.

Scaffold dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Biến môi trường bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho vai trò đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Lựa chọn vai trò thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định env: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, nếu không thì `maintainer`)

Biến môi trường tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID trace tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` loopback cho phát triển chỉ-cục-bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong vận hành thông thường.

Các lệnh admin của maintainer (thêm/xóa/liệt kê pool) yêu cầu cụ thể
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Trình trợ giúp CLI cho maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lần chạy live để kiểm tra URL site Convex, secret broker,
tiền tố endpoint, timeout HTTP, và khả năng truy cập admin/list mà không in ra
giá trị secret. Dùng `--json` cho đầu ra máy đọc được trong script và tiện ích CI.

Hợp đồng endpoint mặc định (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Yêu cầu: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Thành công: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Hết pool/có thể thử lại: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - Chặn lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ secret maintainer)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Dạng payload cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi ID chat Telegram dạng số.
- `admin/add` xác thực dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

### Thêm một channel vào QA

Kiến trúc và tên scenario-helper cho các adapter channel mới nằm trong [Tổng quan QA → Thêm một channel](/vi/concepts/qa-e2e-automation#adding-a-channel). Ngưỡng tối thiểu: triển khai runner vận chuyển trên seam host `qa-lab` dùng chung, khai báo `qaRunners` trong manifest Plugin, mount dưới dạng `openclaw qa <runner>`, và viết scenario trong `qa/scenarios/`.

## Bộ kiểm thử (cái gì chạy ở đâu)

Hãy xem các bộ này là “mức độ chân thực tăng dần” (và độ bất ổn/chi phí cũng tăng):

### Unit / integration (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng bộ shard `vitest.full-*.config.ts` và có thể mở rộng shard đa dự án thành cấu hình theo từng dự án để lập lịch song song
- Tệp: inventory core/unit dưới `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử unit UI chạy trong shard `unit-ui` riêng
- Phạm vi:
  - Kiểm thử unit thuần túy
  - Kiểm thử integration trong tiến trình (gateway auth, routing, tooling, parsing, config)
  - Hồi quy xác định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không cần khóa thật
  - Nên nhanh và ổn định
  - Các kiểm thử resolver và public-surface loader phải chứng minh hành vi fallback rộng của `api.js` và
    `runtime-api.js` bằng fixture Plugin nhỏ được tạo, không phải
    API nguồn Plugin đi kèm thật. Việc tải API Plugin thật thuộc về
    các bộ contract/integration do Plugin sở hữu.

<AccordionGroup>
  <Accordion title="Dự án, shard, và lane có phạm vi">

    - `pnpm test` không nhắm mục tiêu chạy mười hai cấu hình shard nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình dự án gốc native khổng lồ. Điều này giảm RSS đỉnh trên các máy đang tải nặng và tránh việc auto-reply/extension làm các bộ kiểm thử không liên quan bị thiếu tài nguyên.
    - `pnpm test --watch` vẫn dùng đồ thị dự án `vitest.config.ts` gốc native, vì vòng lặp watch nhiều shard không thực tế.
    - `pnpm test`, `pnpm test:watch`, và `pnpm test:perf:imports` định tuyến các mục tiêu tệp/thư mục tường minh qua các lane có phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả toàn bộ chi phí khởi động dự án gốc.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các lane có phạm vi rẻ: chỉnh sửa kiểm thử trực tiếp, các tệp `*.test.ts` cùng cấp, ánh xạ nguồn tường minh, và các phần phụ thuộc theo đồ thị import cục bộ. Chỉnh sửa cấu hình/thiết lập/gói không chạy kiểm thử diện rộng trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường cho công việc hẹp. Nó phân loại diff thành core, kiểm thử core, extensions, kiểm thử extension, ứng dụng, tài liệu, siêu dữ liệu phát hành, công cụ Docker trực tiếp, và công cụ, rồi chạy các lệnh typecheck, lint, và guard tương ứng. Nó không chạy kiểm thử Vitest; hãy gọi `pnpm test:changed` hoặc `pnpm test <target>` tường minh để có bằng chứng kiểm thử. Các lần tăng phiên bản chỉ gồm siêu dữ liệu phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu, với một guard từ chối thay đổi gói nằm ngoài trường phiên bản cấp cao nhất.
    - Chỉnh sửa harness Docker ACP trực tiếp chạy các kiểm tra tập trung: cú pháp shell cho các script xác thực Docker trực tiếp và một lần chạy thử bộ lập lịch Docker trực tiếp. Thay đổi `package.json` chỉ được đưa vào khi diff giới hạn ở `scripts["test:docker:live-*"]`; các chỉnh sửa phụ thuộc, export, phiên bản, và bề mặt gói khác vẫn dùng các guard rộng hơn.
    - Các kiểm thử đơn vị nhẹ về import từ agents, commands, plugins, helper auto-reply, `plugin-sdk`, và các vùng tiện ích thuần tương tự được định tuyến qua lane `unit-fast`, lane này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng về runtime vẫn ở các lane hiện có.
    - Một số tệp nguồn helper `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy chế độ changed sang các kiểm thử cùng cấp tường minh trong những lane nhẹ đó, nên chỉnh sửa helper tránh chạy lại toàn bộ bộ kiểm thử nặng cho thư mục đó.
    - `auto-reply` có các bucket riêng cho helper core cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất, và cây con `src/auto-reply/reply/**`. CI còn chia cây con reply thành các shard agent-runner, dispatch, và commands/state-routing để một bucket nặng về import không nắm toàn bộ phần đuôi Node.
    - CI PR/main thông thường cố ý bỏ qua lượt quét hàng loạt extension và shard chỉ dành cho phát hành `agentic-plugins`. Full Release Validation điều phối workflow con `Plugin Prerelease` riêng cho các bộ kiểm thử nặng về plugin/extension đó trên các ứng viên phát hành.

  </Accordion>

  <Accordion title="Phạm vi kiểm thử runner nhúng">

    - Khi bạn thay đổi đầu vào khám phá message-tool hoặc ngữ cảnh runtime compaction,
      hãy giữ cả hai tầng phạm vi kiểm thử.
    - Thêm các kiểm thử hồi quy helper tập trung cho ranh giới định tuyến và chuẩn hóa
      thuần.
    - Giữ các bộ kiểm thử tích hợp runner nhúng khỏe mạnh:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ này xác minh rằng id có phạm vi và hành vi compaction vẫn đi
      qua các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ ở helper
      không phải là thay thế đủ cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Mặc định pool và cô lập Vitest">

    - Cấu hình Vitest cơ sở mặc định là `threads`.
    - Cấu hình Vitest dùng chung cố định `isolate: false` và dùng
      runner không cô lập trên các dự án gốc, cấu hình e2e, và cấu hình trực tiếp.
    - Lane UI gốc giữ thiết lập và optimizer `jsdom`, nhưng cũng chạy trên
      runner không cô lập dùng chung.
    - Mỗi shard `pnpm test` kế thừa cùng các mặc định `threads` + `isolate: false`
      từ cấu hình Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình Node
      con của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8 mặc định.

  </Accordion>

  <Accordion title="Lặp cục bộ nhanh">

    - `pnpm changed:lanes` hiển thị các lane kiến trúc mà một diff kích hoạt.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck, hoặc kiểm thử.
    - Chạy `pnpm check:changed` rõ ràng trước khi bàn giao hoặc push khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các lane có phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      quyết định một chỉnh sửa harness, cấu hình, gói, hoặc hợp đồng thật sự cần
      phạm vi kiểm thử Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ cùng hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động co giãn worker cục bộ được chủ ý thiết kế thận trọng và giảm tải
      khi load average của host đã cao, nên nhiều lần chạy Vitest đồng thời
      mặc định gây ít ảnh hưởng hơn.
    - Cấu hình Vitest cơ sở đánh dấu các dự án/tệp cấu hình là
      `forceRerunTriggers` để các lần chạy lại chế độ changed vẫn đúng khi dây nối
      kiểm thử thay đổi.
    - Cấu hình giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` bật trên các host được hỗ trợ;
      đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache tường minh cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Gỡ lỗi hiệu năng">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cộng với
      đầu ra phân tích import.
    - `pnpm test:perf:imports:changed` giới hạn cùng góc nhìn profiling cho
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian shard được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn bộ cấu hình dùng đường dẫn cấu hình làm khóa; các shard CI
      theo include-pattern thêm tên shard để các shard đã lọc có thể được theo dõi
      riêng.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho import lúc khởi động,
      hãy đặt các phụ thuộc nặng phía sau một seam `*.runtime.ts` cục bộ hẹp và
      mock trực tiếp seam đó thay vì deep-import các helper runtime chỉ
      để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn dự án gốc native cho diff đã commit
      đó và in wall time cộng với RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây làm việc bẩn hiện tại
      bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và cấu hình Vitest gốc.
    - `pnpm test:perf:profile:main` ghi một hồ sơ CPU main-thread cho
      chi phí khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi hồ sơ CPU+heap runner cho
      bộ kiểm thử đơn vị với song song hóa theo tệp bị tắt.

  </Accordion>
</AccordionGroup>

### Độ ổn định (gateway)

- Lệnh: `pnpm test:stability:gateway`
- Cấu hình: `vitest.gateway.config.ts`, buộc dùng một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với chẩn đoán được bật mặc định
  - Đẩy churn thông điệp gateway, bộ nhớ, và tải lớn tổng hợp qua đường dẫn sự kiện chẩn đoán
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các helper lưu giữ gói ổn định chẩn đoán
  - Khẳng định recorder vẫn được giới hạn, các mẫu RSS tổng hợp nằm dưới ngân sách áp lực, và độ sâu hàng đợi theo phiên giảm về 0
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Lane hẹp cho theo dõi hồi quy độ ổn định, không phải thay thế cho toàn bộ bộ kiểm thử Gateway

### E2E (gateway smoke)

- Lệnh: `pnpm test:e2e`
- Cấu hình: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và các kiểm thử E2E bundled-plugin dưới `extensions/`
- Mặc định runtime:
  - Dùng `threads` của Vitest với `isolate: false`, khớp với phần còn lại của repo.
  - Dùng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ im lặng để giảm chi phí I/O console.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để buộc số lượng worker (giới hạn ở 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra console chi tiết.
- Phạm vi:
  - Hành vi gateway end-to-end nhiều phiên bản
  - Bề mặt WebSocket/HTTP, ghép cặp node, và mạng nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không cần khóa thật
  - Nhiều phần chuyển động hơn kiểm thử đơn vị (có thể chậm hơn)

### E2E: OpenShell backend smoke

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Khởi động một gateway OpenShell cô lập trên host qua Docker
  - Tạo sandbox từ Dockerfile cục bộ tạm thời
  - Thực thi backend OpenShell của OpenClaw qua `sandbox ssh-config` thật + SSH exec
  - Xác minh hành vi hệ thống tệp remote-canonical qua cầu nối sandbox fs
- Kỳ vọng:
  - Chỉ opt-in; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cộng với Docker daemon hoạt động
  - Dùng `HOME` / `XDG_CONFIG_HOME` cô lập, rồi hủy gateway kiểm thử và sandbox
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới binary CLI không mặc định hoặc wrapper script

### Trực tiếp (provider thật + model thật)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các kiểm thử trực tiếp bundled-plugin dưới `extensions/`
- Mặc định: **bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - “Provider/model này có thật sự hoạt động _hôm nay_ với thông tin xác thực thật không?”
  - Bắt thay đổi định dạng provider, điểm khác thường khi gọi tool, vấn đề xác thực, và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Chủ ý không ổn định cho CI (mạng thật, chính sách provider thật, hạn mức, sự cố)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con được thu hẹp thay vì “mọi thứ”
- Các lần chạy trực tiếp source `~/.profile` để lấy các API key còn thiếu.
- Theo mặc định, các lần chạy trực tiếp vẫn cô lập `HOME` và sao chép vật liệu cấu hình/xác thực vào một home kiểm thử tạm thời để fixture đơn vị không thể sửa `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn chủ ý cần kiểm thử trực tiếp dùng thư mục home thật của mình.
- `pnpm test:live` hiện mặc định dùng chế độ yên tĩnh hơn: nó giữ đầu ra tiến độ `[live] ...`, nhưng chặn thông báo `~/.profile` bổ sung và tắt tiếng log bootstrap gateway/Bonjour chatter. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn có lại toàn bộ log khởi động.
- Xoay vòng API key (theo provider): đặt `*_API_KEYS` với định dạng dấu phẩy/chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè theo lần chạy trực tiếp qua `OPENCLAW_LIVE_*_KEY`; kiểm thử sẽ thử lại khi nhận phản hồi giới hạn tốc độ.
- Đầu ra tiến độ/heartbeat:
  - Các bộ kiểm thử trực tiếp giờ phát dòng tiến độ ra stderr để các lệnh gọi provider dài hiển thị là vẫn hoạt động ngay cả khi capture console của Vitest yên tĩnh.
  - `vitest.live.config.ts` tắt cơ chế chặn console của Vitest để các dòng tiến độ provider/gateway stream ngay trong các lần chạy trực tiếp.
  - Tinh chỉnh heartbeat của model trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Tinh chỉnh heartbeat của gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ kiểm thử nào?

Dùng bảng quyết định này:

- Chỉnh sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn thay đổi nhiều)
- Chạm đến mạng Gateway / giao thức WS / ghép đôi: thêm `pnpm test:e2e`
- Gỡ lỗi “bot của tôi bị sập” / lỗi dành riêng cho nhà cung cấp / gọi công cụ: chạy `pnpm test:live` đã thu hẹp phạm vi

## Kiểm thử live (chạm mạng)

Đối với ma trận mô hình live, smoke backend CLI, smoke ACP, harness máy chủ ứng dụng Codex, và tất cả kiểm thử live của nhà cung cấp media (Deepgram, BytePlus, ComfyUI, hình ảnh, nhạc, video, media harness) — cộng với xử lý thông tin xác thực cho các lần chạy live — xem [Kiểm thử các bộ live](/vi/help/testing-live). Đối với danh sách kiểm tra chuyên dụng cho cập nhật và xác thực Plugin, xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Runner Docker (kiểm tra tùy chọn "hoạt động trên Linux")

Các runner Docker này chia thành hai nhóm:

- Runner mô hình live: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp live theo khóa hồ sơ tương ứng của chúng bên trong ảnh Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), gắn thư mục cấu hình cục bộ và workspace của bạn (và nạp `~/.profile` nếu được gắn). Các entrypoint cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Runner live Docker mặc định dùng giới hạn smoke nhỏ hơn để một lượt quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các biến môi trường đó khi bạn
  thực sự muốn lượt quét đầy đủ lớn hơn.
- `test:docker:all` xây dựng ảnh Docker live một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần dưới dạng tarball npm thông qua `scripts/package-openclaw-for-docker.mjs`, rồi xây dựng/tái sử dụng hai ảnh `scripts/e2e/Dockerfile`. Ảnh bare chỉ là runner Node/Git cho các lane cài đặt/cập nhật/phụ thuộc Plugin; các lane đó gắn tarball đã xây dựng sẵn. Ảnh chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng ứng dụng đã xây dựng. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Bộ tổng hợp dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` kiểm soát các slot tiến trình, trong khi các giới hạn tài nguyên ngăn các lane live nặng, npm-install và nhiều dịch vụ cùng khởi động một lúc. Nếu một lane đơn lẻ nặng hơn các giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động lane đó khi pool trống rồi giữ nó chạy một mình cho đến khi có lại dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ tinh chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi host Docker còn nhiều dư địa hơn. Runner mặc định thực hiện preflight Docker, xóa các container E2E OpenClaw cũ, in trạng thái mỗi 30 giây, lưu thời gian lane thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời gian đó để khởi động các lane dài hơn trước trong những lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane có trọng số mà không xây dựng hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các lane đã chọn, nhu cầu package/ảnh, và thông tin xác thực.
- `Package Acceptance` là gate package gốc GitHub cho "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một package ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải nó lên dưới tên `package-under-test`, rồi chạy các lane E2E Docker tái sử dụng với đúng tarball đó thay vì đóng gói lại ref đã chọn. Các hồ sơ được sắp xếp theo độ rộng: `smoke`, `package`, `product`, và `full`. Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng package/cập nhật/Plugin, ma trận sống sót khi nâng cấp bản đã phát hành, mặc định phát hành, và phân loại lỗi.
- Kiểm tra build và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Guard duyệt đồ thị đã xây dựng tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và thất bại nếu quá trình khởi động trước dispatch nhập các phụ thuộc package như Commander, prompt UI, undici, hoặc logging trước khi dispatch lệnh; nó cũng giữ chunk chạy Gateway được đóng gói trong ngân sách và từ chối import tĩnh của các đường dẫn Gateway nguội đã biết. Smoke CLI đã đóng gói cũng bao phủ trợ giúp gốc, trợ giúp onboard, trợ giúp doctor, trạng thái, schema cấu hình, và lệnh liệt kê mô hình.
- Tương thích kế thừa của Package Acceptance bị giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Đến mốc đó, harness chỉ dung nạp các khoảng trống metadata của package đã phát hành: bỏ qua mục kiểm kê QA riêng tư, thiếu `gateway install --wrapper`, thiếu tệp vá trong fixture git dẫn xuất từ tarball, thiếu `update.channel` đã lưu, vị trí bản ghi cài đặt Plugin kế thừa, thiếu lưu bản ghi cài đặt marketplace, và di chuyển metadata cấu hình trong `plugins update`. Với các package sau `2026.4.25`, các đường dẫn đó là lỗi nghiêm ngặt.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.

Các runner Docker mô hình live cũng chỉ bind-mount các home xác thực CLI cần thiết (hoặc tất cả home được hỗ trợ khi lần chạy không bị thu hẹp), rồi sao chép chúng vào home của container trước khi chạy để OAuth của CLI bên ngoài có thể làm mới token mà không làm thay đổi kho xác thực của host:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Kiểm thử khói ACP bind: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với độ bao phủ Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử khói backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử khói harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + tác nhân dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử khói khả năng quan sát: `pnpm qa:otel:smoke` là một lane kiểm tra source-checkout QA riêng tư. Nó cố ý không thuộc các lane phát hành Docker package vì npm tarball bỏ qua QA Lab.
- Kiểm thử khói trực tiếp Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, scaffolding đầy đủ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử khói npm tarball onboarding/kênh/tác nhân: `pnpm test:docker:npm-onboard-channel-agent` cài đặt OpenClaw tarball đã đóng gói toàn cục trong Docker, cấu hình OpenAI qua onboarding env-ref cùng Telegram theo mặc định, chạy doctor và chạy một lượt tác nhân OpenAI được mock. Dùng lại tarball đã build sẵn với `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua build máy chủ với `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc đổi kênh với `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Kiểm thử khói chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt OpenClaw tarball đã đóng gói toàn cục trong Docker, chuyển từ package `stable` sang git `dev`, xác minh kênh đã lưu bền vững và Plugin sau cập nhật hoạt động, rồi chuyển lại về package `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử khói sống sót sau nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt OpenClaw tarball đã đóng gói lên trên một fixture người dùng cũ bẩn có tác nhân, cấu hình kênh, allowlist Plugin, trạng thái phụ thuộc Plugin đã cũ và các tệp workspace/session hiện có. Nó chạy cập nhật package cộng với doctor không tương tác không cần provider trực tiếp hoặc khóa kênh, rồi khởi động một Gateway loopback và kiểm tra bảo toàn cấu hình/trạng thái cùng ngân sách startup/status.
- Kiểm thử khói sống sót sau nâng cấp đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, seed các tệp người dùng hiện có thực tế, cấu hình baseline đó bằng một công thức lệnh được nhúng sẵn, xác thực cấu hình kết quả, cập nhật bản cài đặt đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway loopback và kiểm tra intent đã cấu hình, bảo toàn trạng thái, startup, `/healthz`, `/readyz` và ngân sách trạng thái RPC. Ghi đè một baseline với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các baseline chính xác với `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, và mở rộng fixture dạng issue với `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; Package Acceptance hiển thị các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` và `published_upgrade_survivor_scenarios`.
- Kiểm thử khói ngữ cảnh runtime phiên: `pnpm test:docker:session-runtime-context` xác minh việc lưu bền vững transcript ngữ cảnh runtime ẩn cùng với sửa chữa bằng doctor cho các nhánh prompt-rewrite bị trùng lặp chịu ảnh hưởng.
- Kiểm thử khói cài đặt Bun toàn cục: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một home cô lập, và xác minh `openclaw infer image providers --json` trả về các provider hình ảnh đi kèm thay vì treo. Dùng lại tarball đã build sẵn với `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua build máy chủ với `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một Docker image đã build với `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử khói Docker trình cài đặt: `bash scripts/test-install-sh-docker.sh` chia sẻ một npm cache giữa các container root, update và direct-npm của nó. Kiểm thử khói cập nhật mặc định dùng npm `latest` làm baseline ổn định trước khi nâng cấp lên tarball ứng viên. Ghi đè với `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` cục bộ, hoặc với input `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ npm cache cô lập để các mục cache do root sở hữu không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để dùng lại cache root/update/direct-npm giữa các lần chạy lại cục bộ.
- Install Smoke CI bỏ qua cập nhật toàn cục direct-npm trùng lặp với `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy script cục bộ không có env đó khi cần bao phủ trực tiếp `npm install -g`.
- Kiểm thử khói CLI xóa workspace dùng chung của tác nhân: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định build image Dockerfile gốc, seed hai tác nhân với một workspace trong một home container cô lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Dùng lại image install-smoke với `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + sức khỏe): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử khói snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build image E2E từ nguồn cộng với một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao phủ URL liên kết, phần tử có thể nhấp được nâng từ cursor, tham chiếu iframe và metadata frame.
- Hồi quy lập luận tối thiểu OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI được mock qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, rồi buộc provider schema từ chối và kiểm tra chi tiết thô xuất hiện trong log Gateway.
- Cầu nối kênh MCP (Gateway đã seed + cầu nối stdio + kiểm thử khói notification-frame Claude thô): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP bundle Pi (máy chủ stdio MCP thật + kiểm thử khói cho phép/từ chối profile Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp Cron/subagent MCP (Gateway thật + teardown tiến trình con stdio MCP sau các lần chạy cron cô lập và subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (kiểm thử khói cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, npm registry với phụ thuộc hoisted, git moving refs, ClawHub kitchen-sink, cập nhật marketplace và bật/kiểm tra Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp package/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Khi không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, kiểm thử dùng một máy chủ fixture ClawHub cục bộ kín.
- Kiểm thử khói cập nhật Plugin không thay đổi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử khói metadata tải lại cấu hình: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` bao phủ kiểm thử khói cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, npm registry với phụ thuộc hoisted, git moving refs, fixture ClawHub, cập nhật marketplace và bật/kiểm tra Claude-bundle. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không thay đổi cho Plugin đã cài đặt.

Để prebuild và dùng lại image chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image theo suite như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một image dùng chung từ xa, các script sẽ pull image đó nếu nó chưa có ở cục bộ. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi package/cài đặt thay vì runtime ứng dụng đã build dùng chung.

Các runner Docker live-model cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Điều này giữ cho image runtime
gọn nhẹ trong khi vẫn chạy Vitest trên đúng nguồn/cấu hình cục bộ của bạn.
Bước staging bỏ qua các cache chỉ cục bộ lớn và output build ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục output `.build` cục bộ của ứng dụng hoặc
Gradle để các lần chạy Docker trực tiếp không mất vài phút sao chép
artifact riêng của máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các probe trực tiếp của gateway không khởi động
worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền qua
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ độ bao phủ trực tiếp của gateway
khỏi lane Docker đó.
`test:docker:openwebui` là một kiểm thử khói tương thích cấp cao hơn: nó khởi động một
container gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI được ghim trỏ tới gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` hiển thị `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Lần chạy đầu tiên có thể chậm đáng kể vì Docker có thể cần pull
image Open WebUI và Open WebUI có thể cần hoàn tất thiết lập cold-start riêng.
Lane này yêu cầu một khóa mô hình trực tiếp dùng được, và `OPENCLAW_PROFILE_FILE`
(mặc định là `~/.profile`) là cách chính để cung cấp khóa đó trong các lần chạy Docker hóa.
Các lần chạy thành công in một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính xác định và không cần
tài khoản Telegram, Discord hoặc iMessage thật. Nó khởi động một container Gateway
đã seed, khởi động một container thứ hai spawn `openclaw mcp serve`, rồi
xác minh khám phá hội thoại được định tuyến, đọc transcript, metadata tệp đính kèm,
hành vi hàng đợi sự kiện trực tiếp, định tuyến gửi outbound và thông báo kênh kiểu Claude +
quyền qua cầu nối stdio MCP thật. Kiểm tra thông báo
kiểm tra trực tiếp các frame stdio MCP thô để kiểm thử khói xác thực những gì
cầu nối thật sự phát ra, không chỉ những gì một SDK client cụ thể tình cờ hiển thị.
`test:docker:pi-bundle-mcp-tools` có tính xác định và không cần khóa mô hình trực tiếp.
Nó build image Docker repo, khởi động một máy chủ probe stdio MCP thật
bên trong container, vật chất hóa máy chủ đó thông qua runtime MCP bundle Pi nhúng,
thực thi công cụ, rồi xác minh `coding` và `messaging` giữ
các công cụ `bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa mô hình trực tiếp.
Nó khởi động một Gateway đã seed với một máy chủ probe stdio MCP thật, chạy một
lượt cron cô lập và một lượt con one-shot `/subagents spawn`, rồi xác minh
tiến trình con MCP thoát sau mỗi lần chạy.

Kiểm thử khói thread ACP bằng ngôn ngữ tự nhiên thủ công (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow hồi quy/gỡ lỗi. Nó có thể lại cần thiết cho xác thực định tuyến thread ACP, vì vậy đừng xóa nó.

Biến env hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được gắn vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được gắn vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được gắn vào `/home/node/.profile` và được nạp trước khi chạy kiểm thử
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được nạp từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục cấu hình/không gian làm việc tạm thời và không gắn xác thực CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được gắn vào `/home/node/.npm-global` cho các bản cài đặt CLI được lưu bộ nhớ đệm bên trong Docker
- Các thư mục/tệp xác thực CLI bên ngoài dưới `$HOME` được gắn chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi kiểm thử bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lượt chạy nhà cung cấp được thu hẹp chỉ gắn các thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc một danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lượt chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc nhà cung cấp trong vùng chứa
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để dùng lại ảnh `openclaw:local-live` hiện có cho các lượt chạy lại không cần dựng lại
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo thông tin xác thực đến từ kho hồ sơ (không phải môi trường)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình do Gateway cung cấp cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce được smoke Open WebUI sử dụng
- `OPENWEBUI_IMAGE=...` để ghi đè thẻ ảnh Open WebUI đã ghim

## Kiểm tra hợp lệ tài liệu

Chạy kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra tiêu đề trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy ngoại tuyến (an toàn cho CI)

Đây là các hồi quy “pipeline thực” không có nhà cung cấp thực:

- Gọi công cụ Gateway (OpenAI giả lập, gateway thực + vòng lặp agent): `src/gateway/gateway.test.ts` (trường hợp: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Trình hướng dẫn Gateway (WS `wizard.start`/`wizard.next`, ghi cấu hình + thực thi xác thực): `src/gateway/gateway.test.ts` (trường hợp: "runs wizard over ws and writes auth token config")

## Đánh giá độ tin cậy agent (skills)

Chúng ta đã có một vài kiểm thử an toàn cho CI hoạt động như “đánh giá độ tin cậy agent”:

- Gọi công cụ giả lập qua gateway thực + vòng lặp agent (`src/gateway/gateway.test.ts`).
- Các luồng trình hướng dẫn đầu cuối xác thực việc nối dây phiên và hiệu lực cấu hình (`src/gateway/gateway.test.ts`).

Phần vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi Skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh những skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi dùng và làm theo các bước/đối số bắt buộc không?
- **Hợp đồng quy trình:** các kịch bản nhiều lượt xác nhận thứ tự công cụ, truyền tiếp lịch sử phiên và ranh giới sandbox.

Các đánh giá trong tương lai trước hết nên duy trì tính xác định:

- Một trình chạy kịch bản dùng nhà cung cấp giả lập để xác nhận các lệnh gọi công cụ + thứ tự, đọc tệp skill và nối dây phiên.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng so với tránh, gating, chèn prompt).
- Đánh giá live tùy chọn (chọn tham gia, được chặn bằng biến môi trường) chỉ sau khi bộ an toàn cho CI đã sẵn sàng.

## Kiểm thử hợp đồng (hình dạng Plugin và kênh)

Kiểm thử hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ
hợp đồng giao diện của nó. Chúng lặp qua tất cả Plugin được phát hiện và chạy một bộ
xác nhận về hình dạng và hành vi. Lane đơn vị `pnpm test` mặc định cố ý
bỏ qua các tệp smoke và seam dùng chung này; hãy chạy rõ ràng các lệnh hợp đồng
khi bạn chạm vào các bề mặt kênh hoặc nhà cung cấp dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng nhà cung cấp: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng Plugin cơ bản (id, tên, năng lực)
- **setup** - Hợp đồng trình hướng dẫn thiết lập
- **session-binding** - Hành vi ràng buộc phiên
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn đến
- **actions** - Trình xử lý hành động kênh
- **threading** - Xử lý ID luồng
- **directory** - API thư mục/danh sách
- **group-policy** - Thực thi chính sách nhóm

### Hợp đồng trạng thái nhà cung cấp

Nằm trong `src/plugins/contracts/*.contract.test.ts`.

- **status** - Đầu dò trạng thái kênh
- **registry** - Hình dạng sổ đăng ký Plugin

### Hợp đồng nhà cung cấp

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng luồng xác thực
- **auth-choice** - Lựa chọn/chọn xác thực
- **catalog** - API danh mục mô hình
- **discovery** - Khám phá Plugin
- **loader** - Tải Plugin
- **runtime** - Runtime nhà cung cấp
- **shape** - Hình dạng/giao diện Plugin
- **wizard** - Trình hướng dẫn thiết lập

### Khi nào chạy

- Sau khi thay đổi các export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa đổi một Plugin kênh hoặc nhà cung cấp
- Sau khi tái cấu trúc đăng ký hoặc khám phá Plugin

Kiểm thử hợp đồng chạy trong CI và không yêu cầu khóa API thực.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề nhà cung cấp/mô hình được phát hiện trong live:

- Thêm hồi quy an toàn cho CI nếu có thể (nhà cung cấp mock/stub, hoặc ghi lại phép biến đổi hình dạng yêu cầu chính xác)
- Nếu vấn đề vốn chỉ xảy ra live (giới hạn tốc độ, chính sách xác thực), giữ kiểm thử live hẹp và chỉ chạy khi chọn tham gia qua biến môi trường
- Ưu tiên nhắm vào lớp nhỏ nhất có thể bắt được lỗi:
  - lỗi chuyển đổi/phát lại yêu cầu của nhà cung cấp → kiểm thử mô hình trực tiếp
  - lỗi pipeline phiên/lịch sử/công cụ của gateway → smoke live gateway hoặc kiểm thử mock gateway an toàn cho CI
- Rào chắn duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một đích được lấy mẫu cho mỗi lớp SecretRef từ siêu dữ liệu registry (`listSecretTargetRegistryEntries()`), rồi xác nhận các exec id có phân đoạn duyệt bị từ chối.
  - Nếu bạn thêm một họ đích SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong kiểm thử đó. Kiểm thử cố ý thất bại với các target id chưa được phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Kiểm thử live](/vi/help/testing-live)
- [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
