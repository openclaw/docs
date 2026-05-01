---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm kiểm thử hồi quy cho lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của Gateway + tác nhân
summary: 'Bộ công cụ kiểm thử: bộ kiểm thử đơn vị/e2e/trực tiếp, trình chạy Docker và nội dung mà mỗi bài kiểm thử bao phủ'
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-01T10:49:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0414138f708ca43e47a0d91bc565186d9dda1d487a6813191a383d169b8ae3
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (unit/integration, e2e, live) và một nhóm nhỏ
các trình chạy Docker. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ kiểm thử bao phủ những gì (và những gì bộ đó chủ ý _không_ bao phủ).
- Những lệnh cần chạy cho các quy trình thường gặp (cục bộ, trước khi push, gỡ lỗi).
- Cách các kiểm thử live phát hiện thông tin xác thực và chọn model/provider.
- Cách thêm kiểm thử hồi quy cho các sự cố model/provider trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các lane live transport)** được ghi tài liệu riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) — kiến trúc, bề mặt lệnh, biên soạn kịch bản.
- [QA Matrix](/vi/concepts/qa-matrix) — tài liệu tham chiếu cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) — Plugin transport tổng hợp được dùng bởi các kịch bản dựa trên repo.

Trang này trình bày cách chạy các bộ kiểm thử thông thường và các trình chạy Docker/Parallels. Phần trình chạy dành riêng cho QA bên dưới ([Trình chạy dành riêng cho QA](#qa-specific-runners)) liệt kê các lệnh gọi `qa` cụ thể và trỏ lại các tài liệu tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng kiểm tra đầy đủ (được kỳ vọng trước khi push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy dư tài nguyên: `pnpm test:max`
- Vòng lặp theo dõi Vitest trực tiếp: `pnpm test:watch`
- Nhắm mục tiêu file trực tiếp hiện cũng định tuyến các đường dẫn plugin/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên chạy có mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Trang QA dựa trên Docker: `pnpm qa:lab:up`
- Lane QA dựa trên VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn có thêm độ tin cậy:

- Cổng coverage: `pnpm test:coverage`
- Bộ E2E: `pnpm test:e2e`

Khi gỡ lỗi provider/model thật (cần thông tin xác thực thật):

- Bộ live (model + probe công cụ/hình ảnh Gateway): `pnpm test:live`
- Nhắm mục tiêu một file live ở chế độ yên lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Quét model live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi model được chọn hiện chạy một lượt văn bản cộng với một probe nhỏ kiểu đọc file.
    Các model có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các probe bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi provider.
  - Coverage CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E có thể tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận model live Docker riêng
    được chia shard theo provider.
  - Với các lần chạy lại CI tập trung, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm các secret provider có tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các caller
    scheduled/release của nó.
- Smoke chat ràng buộc Codex gốc: `pnpm test:docker:live-codex-bind`
  - Chạy một lane live Docker qua đường dẫn app-server Codex, ràng buộc một
    Slack DM tổng hợp bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi thuần và một tệp đính kèm hình ảnh
    định tuyến qua binding Plugin gốc thay vì ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt agent Gateway qua harness app-server Codex do Plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và theo mặc định thực thi các probe hình ảnh,
    cron MCP, sub-agent, và Guardian. Tắt probe sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi app-server Codex
    khác. Với kiểm tra sub-agent tập trung, hãy tắt các probe khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Lệnh này thoát sau probe sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Smoke lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra tùy chọn có dự phòng kép cho bề mặt lệnh cứu hộ message-channel.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi model bền vững,
    trả lời `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong container không có cấu hình với Claude CLI giả trên `PATH`
    và xác minh fallback planner mờ được chuyển thành một thao tác ghi cấu hình có kiểu đã được audit.
- Smoke Docker lần chạy đầu Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, định tuyến `openclaw` thuần đến
    Crestodian, áp dụng các ghi thiết lập/model/agent/Plugin Discord + SecretRef,
    xác thực cấu hình, và xác minh các mục audit. Cùng đường dẫn thiết lập Ring 0 đó
    cũng được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: khi đã đặt `MOONSHOT_API_KEY`, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  cô lập với `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và
  transcript assistant lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một ca lỗi, hãy ưu tiên thu hẹp kiểm thử live bằng các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Trình chạy dành riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần mức độ thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. `Parity gate` chạy trên các PR khớp
và từ dispatch thủ công với provider giả lập. `QA-Lab - All Lanes` chạy hằng đêm trên
`main` và từ dispatch thủ công với mock parity gate, lane live Matrix,
lane live Telegram do Convex quản lý, và lane live Discord do Convex quản lý dưới dạng
các job song song. QA theo lịch và kiểm tra release truyền Matrix `--profile fast`
một cách tường minh, trong khi giá trị mặc định của CLI Matrix và input workflow thủ công vẫn là
`all`; dispatch thủ công có thể chia shard `all` thành các job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, và `e2ee-cli`. `OpenClaw Release Checks` chạy parity cộng với
các lane Matrix và Telegram nhanh trước khi phê duyệt release, dùng
`mock-openai/gpt-5.5` cho kiểm tra transport release để chúng duy trì tính xác định
và tránh khởi động provider-plugin thông thường. Các Gateway live transport này tắt
tìm kiếm memory; hành vi memory vẫn được bao phủ bởi các bộ QA parity.

Các shard live media cho release đầy đủ dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, image này đã có
`ffmpeg` và `ffprobe`. Các shard model/backend live Docker dùng chung
image `ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi
commit được chọn, rồi pull bằng `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì build lại
trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy trực tiếp các kịch bản QA dựa trên repo trên host.
  - Chạy song song nhiều kịch bản được chọn theo mặc định với các worker
    Gateway cô lập. `qa-channel` mặc định concurrency 4 (được giới hạn bởi
    số lượng kịch bản được chọn). Dùng `--concurrency <count>` để tinh chỉnh số lượng worker,
    hoặc `--concurrency 1` cho lane tuần tự cũ hơn.
  - Thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Hỗ trợ các chế độ provider `live-frontier`, `mock-openai`, và `aimock`.
    `aimock` khởi động một server provider cục bộ dựa trên AIMock cho coverage
    fixture thử nghiệm và protocol-mock mà không thay thế lane `mock-openai`
    có nhận biết kịch bản.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy bench khởi động Gateway cộng với một gói nhỏ kịch bản QA Lab giả lập
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi một bản tóm tắt quan sát CPU kết hợp
    dưới `.artifacts/gateway-cpu-scenarios/`.
  - Theo mặc định chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cộng `--hot-wall-warn-ms`), nên các đợt tăng ngắn khi khởi động được ghi nhận như metric
    mà không trông giống hồi quy Gateway bị chiếm CPU kéo dài nhiều phút.
  - Dùng artifact `dist` đã build; chạy build trước khi checkout chưa có sẵn
    output runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA bên trong một VM Linux Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên host.
  - Tái sử dụng cùng các flag chọn provider/model như `qa suite`.
  - Các lần chạy live chuyển tiếp các input auth QA được hỗ trợ và thực tế cho guest:
    khóa provider dựa trên env, đường dẫn cấu hình provider live QA, và `CODEX_HOME`
    khi có.
  - Các thư mục output phải nằm dưới repo root để guest có thể ghi ngược qua
    workspace được mount.
  - Ghi báo cáo + tóm tắt QA thông thường cộng với log Multipass dưới
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động trang QA dựa trên Docker cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt toàn cục trong
    Docker, chạy onboarding khóa API OpenAI không tương tác, cấu hình Telegram
    theo mặc định, xác minh việc bật Plugin sẽ cài đặt dependency runtime theo
    nhu cầu, chạy doctor, và chạy một lượt agent cục bộ với endpoint OpenAI
    được giả lập.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane cài đặt đóng gói
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một smoke Docker app đã build có tính xác định cho transcript ngữ cảnh runtime nhúng.
    Nó xác minh ngữ cảnh runtime OpenClaw ẩn được lưu bền vững dưới dạng một custom message
    không hiển thị thay vì rò rỉ vào lượt người dùng hiển thị, rồi seed một session JSONL
    bị hỏng đã bị ảnh hưởng và xác minh
    `openclaw doctor --fix` ghi lại nó sang nhánh active cùng một bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên package OpenClaw trong Docker, chạy onboarding
    package đã cài đặt, cấu hình Telegram qua CLI đã cài đặt, rồi tái sử dụng
    lane QA Telegram live với package đã cài đặt đó làm SUT Gateway.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã phân giải thay vì
    cài đặt từ registry.
  - Dùng cùng thông tin xác thực env Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/release, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cộng với
    `OPENCLAW_QA_CONVEX_SITE_URL` và role secret. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một role secret Convex có mặt trong CI,
    wrapper Docker sẽ tự động chọn Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này.
  - GitHub Actions cung cấp lane này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và các lease thông tin xác thực CI Convex.
- GitHub Actions cũng cung cấp `Package Acceptance` cho bằng chứng sản phẩm chạy phụ
  với một package ứng viên. Nó chấp nhận ref đáng tin cậy, spec npm đã publish,
  URL tarball HTTPS cộng SHA-256, hoặc artifact tarball từ một lần chạy khác, tải lên
  `openclaw-current.tgz` đã chuẩn hóa dưới dạng `package-under-test`, rồi chạy
  bộ lập lịch Docker E2E hiện có với các profile lane smoke, package, product, full, hoặc custom.
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

- Bằng chứng tạo phẩm tải xuống một tạo phẩm tarball từ một lượt chạy Actions khác:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Đóng gói và cài đặt bản dựng OpenClaw hiện tại trong Docker, khởi động Gateway
    với OpenAI đã được cấu hình, rồi bật các kênh/Plugin đi kèm thông qua chỉnh sửa
    cấu hình.
  - Xác minh rằng quá trình phát hiện thiết lập vẫn để các phụ thuộc runtime Plugin
    chưa cấu hình ở trạng thái vắng mặt, lượt chạy Gateway hoặc doctor được cấu hình
    đầu tiên sẽ cài đặt các phụ thuộc runtime của từng Plugin đi kèm theo nhu cầu, và
    lần khởi động lại thứ hai không cài đặt lại các phụ thuộc đã được kích hoạt.
  - Đồng thời cài đặt một đường cơ sở npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh rằng doctor sau cập nhật của
    bản ứng viên sửa các phụ thuộc runtime kênh đi kèm mà không cần sửa postinstall
    ở phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật cài đặt gói gốc trên các máy khách Parallels. Trước tiên, mỗi
    nền tảng được chọn sẽ cài đặt gói đường cơ sở được yêu cầu, sau đó chạy lệnh
    `openclaw update` đã cài đặt trong cùng máy khách và xác minh phiên bản đã cài,
    trạng thái cập nhật, mức sẵn sàng của gateway, và một lượt tác tử cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một máy khách. Dùng `--json` để lấy đường dẫn tạo phẩm tóm tắt và
    trạng thái theo từng làn.
  - Làn OpenAI dùng `openai/gpt-5.5` cho bằng chứng lượt tác tử trực tiếp theo
    mặc định. Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi chủ ý xác thực một mô hình OpenAI khác.
  - Bọc các lượt chạy cục bộ dài trong timeout của máy chủ để các lần treo vận chuyển
    Parallels không thể tiêu tốn phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Tập lệnh ghi nhật ký làn lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi giả định wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong quá trình doctor sau cập nhật/sửa
    phụ thuộc runtime trên máy khách lạnh; điều đó vẫn là bình thường khi nhật ký
    debug npm lồng nhau vẫn đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với các làn smoke Parallels
    macOS, Windows, hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể
    xung đột khi khôi phục snapshot, phục vụ gói, hoặc trạng thái gateway của máy khách.
  - Bằng chứng sau cập nhật chạy bề mặt Plugin đi kèm thông thường vì
    các facade năng lực như lời nói, tạo hình ảnh, và hiểu phương tiện
    được tải qua API runtime đi kèm ngay cả khi chính lượt tác tử chỉ kiểm tra
    một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ nhà cung cấp AIMock cục bộ để kiểm thử smoke giao thức trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy làn QA trực tiếp Matrix trên một homeserver Tuwunel dùng Docker dùng một lần. Chỉ dành cho source-checkout — các bản cài đặt đóng gói không đi kèm `qa-lab`.
  - CLI đầy đủ, danh mục profile/kịch bản, biến môi trường, và bố cục tạo phẩm: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy làn QA trực tiếp Telegram trên một nhóm riêng tư thật bằng token bot driver và SUT từ môi trường.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID nhóm phải là ID chat Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực dùng chung theo pool. Dùng chế độ môi trường theo mặc định, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng lease theo pool.
  - Thoát khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có tạo phẩm mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng một nhóm riêng tư, với bot SUT công khai tên người dùng Telegram.
  - Để quan sát bot-với-bot ổn định, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và bảo đảm bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, tóm tắt, và tạo phẩm tin nhắn đã quan sát dưới `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT đã quan sát.

Các làn vận chuyển trực tiếp dùng chung một hợp đồng tiêu chuẩn để các vận chuyển mới không bị lệch; ma trận phạm vi bao phủ theo từng làn nằm trong [tổng quan QA → Phạm vi bao phủ vận chuyển trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ tổng hợp mô phỏng rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) được bật cho
`openclaw qa telegram`, QA lab lấy một lease độc quyền từ pool do Convex hỗ trợ, gửi Heartbeat
cho lease đó trong khi làn đang chạy, và giải phóng lease khi tắt.

Khung dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Biến môi trường bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một bí mật cho vai trò đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Lựa chọn vai trò thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định môi trường: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, nếu không thì là `maintainer`)

Biến môi trường tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID truy vết tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` loopback để phát triển chỉ cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong hoạt động thông thường.

Các lệnh quản trị dành cho maintainer (thêm/xóa/liệt kê pool) yêu cầu
riêng `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Trợ giúp CLI cho maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lượt chạy trực tiếp để kiểm tra URL site Convex, bí mật broker,
tiền tố endpoint, timeout HTTP, và khả năng truy cập admin/list mà không in
giá trị bí mật. Dùng `--json` để có đầu ra máy có thể đọc trong tập lệnh và
tiện ích CI.

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
  - Chặn lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ bí mật maintainer)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Hình dạng payload cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi ID chat Telegram dạng số.
- `admin/add` xác thực hình dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

### Thêm kênh vào QA

Kiến trúc và tên trợ giúp kịch bản cho adapter kênh mới nằm trong [tổng quan QA → Thêm kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai trình chạy vận chuyển trên seam máy chủ `qa-lab` dùng chung, khai báo `qaRunners` trong manifest Plugin, gắn dưới dạng `openclaw qa <runner>`, và viết kịch bản dưới `qa/scenarios/`.

## Bộ kiểm thử (chạy gì ở đâu)

Hãy nghĩ về các bộ kiểm thử như “mức độ thực tế tăng dần” (và độ bất ổn/chi phí cũng tăng dần):

### Đơn vị / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lượt chạy không nhắm mục tiêu dùng tập shard `vitest.full-*.config.ts` và có thể mở rộng shard nhiều dự án thành cấu hình theo từng dự án để lập lịch song song
- Tệp: inventory core/unit dưới `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử đơn vị UI chạy trong shard `unit-ui` chuyên dụng
- Phạm vi:
  - Kiểm thử đơn vị thuần
  - Kiểm thử tích hợp trong tiến trình (xác thực gateway, định tuyến, công cụ, phân tích cú pháp, cấu hình)
  - Hồi quy tất định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không yêu cầu khóa thật
  - Nên nhanh và ổn định
  - Các kiểm thử resolver và trình tải bề mặt công khai phải chứng minh hành vi fallback rộng của `api.js` và
    `runtime-api.js` bằng các fixture Plugin nhỏ được tạo, không phải
    API nguồn Plugin đi kèm thật. Việc tải API Plugin thật thuộc về
    các bộ hợp đồng/tích hợp do Plugin sở hữu.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` không nhắm mục tiêu chạy mười hai cấu hình phân mảnh nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình root-project gốc khổng lồ. Điều này giảm RSS đỉnh trên các máy tải nặng và tránh việc auto-reply/extension làm các bộ kiểm thử không liên quan bị thiếu tài nguyên.
    - `pnpm test --watch` vẫn dùng đồ thị dự án `vitest.config.ts` root gốc, vì vòng lặp watch nhiều phân mảnh là không thực tế.
    - `pnpm test`, `pnpm test:watch`, và `pnpm test:perf:imports` định tuyến các mục tiêu tệp/thư mục rõ ràng qua các lane có phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả chi phí khởi động toàn bộ root project.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các lane có phạm vi rẻ: chỉnh sửa kiểm thử trực tiếp, các tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng, và các phần phụ thuộc đồ thị import cục bộ. Các chỉnh sửa config/setup/package không chạy kiểm thử rộng trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường cho công việc hẹp. Nó phân loại diff thành core, kiểm thử core, extensions, kiểm thử extension, ứng dụng, tài liệu, siêu dữ liệu phát hành, tooling Docker live, và tooling, rồi chạy các lệnh typecheck, lint, và guard tương ứng. Nó không chạy kiểm thử Vitest; gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các lần tăng phiên bản chỉ-siêu-dữ-liệu-phát-hành chạy kiểm tra phiên bản/config/phụ-thuộc-root có mục tiêu, với một guard từ chối thay đổi package bên ngoài trường phiên bản cấp cao nhất.
    - Các chỉnh sửa harness Docker ACP live chạy kiểm tra tập trung: cú pháp shell cho các script xác thực Docker live và một dry-run bộ lập lịch Docker live. Thay đổi `package.json` chỉ được bao gồm khi diff bị giới hạn ở `scripts["test:docker:live-*"]`; các chỉnh sửa dependency, export, version, và bề mặt package khác vẫn dùng các guard rộng hơn.
    - Kiểm thử đơn vị nhẹ import từ agents, commands, plugins, helper auto-reply, `plugin-sdk`, và các vùng tiện ích thuần tương tự được định tuyến qua lane `unit-fast`, lane này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng runtime vẫn ở trên các lane hiện có.
    - Một số tệp nguồn helper `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy chế độ changed sang kiểm thử cùng cấp rõ ràng trong các lane nhẹ đó, nên các chỉnh sửa helper tránh chạy lại toàn bộ bộ nặng cho thư mục đó.
    - `auto-reply` có các bucket chuyên biệt cho helper core cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất, và cây con `src/auto-reply/reply/**`. CI còn tách cây con reply thành các phân mảnh agent-runner, dispatch, và commands/state-routing để một bucket nặng import không sở hữu toàn bộ phần đuôi Node.
    - CI PR/main thông thường cố ý bỏ qua đợt quét batch extension và phân mảnh `agentic-plugins` chỉ dành cho phát hành. Full Release Validation kích hoạt workflow con `Plugin Prerelease` riêng cho các bộ nặng plugin/extension đó trên các ứng viên phát hành.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Khi bạn thay đổi đầu vào khám phá message-tool hoặc ngữ cảnh runtime compaction,
      hãy giữ cả hai tầng coverage.
    - Thêm các hồi quy helper tập trung cho các ranh giới định tuyến và chuẩn hóa
      thuần.
    - Giữ cho các bộ tích hợp embedded runner khỏe mạnh:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ đó xác minh rằng id có phạm vi và hành vi compaction vẫn đi
      qua các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ-helper
      không phải là thay thế đủ cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Config Vitest cơ sở mặc định là `threads`.
    - Config Vitest dùng chung cố định `isolate: false` và dùng runner
      không cô lập trên các dự án root, e2e, và config live.
    - Lane UI root giữ phần thiết lập `jsdom` và optimizer của nó, nhưng cũng chạy trên
      runner không cô lập dùng chung.
    - Mỗi phân mảnh `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false`
      từ config Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình Node con
      của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8
      gốc.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` hiển thị các lane kiến trúc mà một diff kích hoạt.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck, hoặc kiểm thử.
    - Chạy `pnpm check:changed` rõ ràng trước khi bàn giao hoặc push khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các lane có phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      quyết định rằng một chỉnh sửa harness, config, package, hoặc contract thật sự cần
      coverage Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ nguyên hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động co giãn worker cục bộ cố ý thận trọng và lùi lại
      khi load average của host đã cao, nên nhiều lần chạy Vitest đồng thời
      mặc định gây ít thiệt hại hơn.
    - Config Vitest cơ sở đánh dấu các tệp projects/config là
      `forceRerunTriggers` để các lần chạy lại chế độ changed vẫn đúng khi wiring
      kiểm thử thay đổi.
    - Config giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` được bật trên các host được hỗ trợ;
      đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache rõ ràng cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cùng
      đầu ra phân rã import.
    - `pnpm test:perf:imports:changed` giới hạn cùng chế độ xem profiling đó vào
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian phân mảnh được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn-config dùng đường dẫn config làm khóa; các phân mảnh CI
      theo include-pattern nối thêm tên phân mảnh để các phân mảnh đã lọc có thể được theo dõi
      riêng.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho import khởi động,
      hãy giữ các dependency nặng phía sau một seam `*.runtime.ts` cục bộ hẹp và
      mock seam đó trực tiếp thay vì deep-import các helper runtime chỉ
      để chuyển chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn root-project gốc cho diff đã commit
      đó và in wall time cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây bẩn hiện tại
      bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và config Vitest root.
    - `pnpm test:perf:profile:main` ghi một profile CPU main-thread cho
      chi phí khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi profile CPU+heap của runner cho
      bộ unit với song song hóa theo tệp bị tắt.

  </Accordion>
</AccordionGroup>

### Tính ổn định (Gateway)

- Lệnh: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, bị ép về một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với diagnostics được bật mặc định
  - Đẩy churn thông điệp gateway, memory, và payload lớn tổng hợp qua đường dẫn sự kiện diagnostic
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các helper duy trì gói ổn định diagnostic
  - Khẳng định recorder vẫn bị chặn kích thước, các mẫu RSS tổng hợp nằm dưới ngân sách áp lực, và độ sâu hàng đợi theo phiên thoát về không
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Lane hẹp cho theo dõi hồi quy ổn định, không phải thay thế cho toàn bộ bộ Gateway

### E2E (gateway smoke)

- Lệnh: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và kiểm thử E2E bundled-plugin dưới `extensions/`
- Mặc định runtime:
  - Dùng Vitest `threads` với `isolate: false`, khớp với phần còn lại của repo.
  - Dùng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ im lặng để giảm chi phí I/O console.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để ép số lượng worker (giới hạn ở 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra console chi tiết.
- Phạm vi:
  - Hành vi end-to-end của gateway nhiều instance
  - Bề mặt WebSocket/HTTP, ghép cặp node, và networking nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không cần khóa thật
  - Nhiều phần chuyển động hơn kiểm thử đơn vị (có thể chậm hơn)

### E2E: smoke backend OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Khởi động một gateway OpenShell cô lập trên host qua Docker
  - Tạo sandbox từ một Dockerfile cục bộ tạm thời
  - Thực thi backend OpenShell của OpenClaw qua `sandbox ssh-config` + SSH exec thật
  - Xác minh hành vi hệ thống tệp remote-canonical qua cầu nối fs sandbox
- Kỳ vọng:
  - Chỉ opt-in; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cùng daemon Docker hoạt động
  - Dùng `HOME` / `XDG_CONFIG_HOME` cô lập, rồi hủy gateway và sandbox kiểm thử
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới binary CLI hoặc script wrapper không mặc định

### Live (provider thật + model thật)

- Lệnh: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và kiểm thử live bundled-plugin dưới `extensions/`
- Mặc định: **được bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - “Provider/model này có thật sự hoạt động _hôm nay_ với thông tin đăng nhập thật không?”
  - Bắt thay đổi định dạng provider, điểm lạ của tool-calling, vấn đề xác thực, và hành vi rate limit
- Kỳ vọng:
  - Theo thiết kế không ổn định trong CI (mạng thật, chính sách provider thật, quota, sự cố)
  - Tốn tiền / dùng rate limit
  - Ưu tiên chạy các tập con đã thu hẹp thay vì “mọi thứ”
- Các lần chạy live source `~/.profile` để lấy các khóa API còn thiếu.
- Theo mặc định, các lần chạy live vẫn cô lập `HOME` và sao chép vật liệu config/auth vào một home kiểm thử tạm thời để fixture unit không thể sửa đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn cố ý cần kiểm thử live dùng thư mục home thật của mình.
- `pnpm test:live` hiện mặc định ở chế độ yên tĩnh hơn: nó giữ đầu ra tiến trình `[live] ...`, nhưng chặn thông báo `~/.profile` bổ sung và tắt log bootstrap gateway/ồn ào Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn lấy lại toàn bộ log khởi động.
- Xoay vòng khóa API (theo provider): đặt `*_API_KEYS` với định dạng dấu phẩy/chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè theo live qua `OPENCLAW_LIVE_*_KEY`; kiểm thử thử lại khi nhận phản hồi rate limit.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ live hiện phát dòng tiến trình tới stderr để các lệnh gọi provider dài vẫn hiển thị là đang hoạt động ngay cả khi capture console của Vitest yên tĩnh.
  - `vitest.live.config.ts` tắt chặn console của Vitest để các dòng tiến trình provider/gateway stream ngay trong các lần chạy live.
  - Tinh chỉnh Heartbeat model-trực-tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Tinh chỉnh Heartbeat gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ nào?

Dùng bảng quyết định này:

- Chỉnh sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn thay đổi nhiều)
- Đụng tới mạng Gateway / giao thức WS / ghép cặp: thêm `pnpm test:e2e`
- Gỡ lỗi “bot của tôi bị ngừng hoạt động” / lỗi riêng theo provider / gọi tool: chạy `pnpm test:live` đã thu hẹp phạm vi

## Kiểm thử live (có chạm mạng)

Đối với ma trận mô hình live, kiểm thử khói backend CLI, kiểm thử khói ACP, harness app-server Codex, và tất cả kiểm thử live media-provider (Deepgram, BytePlus, ComfyUI, image, music, video, media harness) — cùng với xử lý thông tin xác thực cho các lần chạy live — xem [Testing — bộ kiểm thử live](/vi/help/testing-live).

## Docker runner (kiểm tra tùy chọn "hoạt động trên Linux")

Các Docker runner này chia thành hai nhóm:

- Live-model runner: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp live theo profile-key khớp của chúng bên trong Docker image của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), mount thư mục cấu hình cục bộ và workspace của bạn (và source `~/.profile` nếu được mount). Các entrypoint cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Docker live runner mặc định dùng giới hạn smoke nhỏ hơn để một lượt quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các biến môi trường đó khi bạn
  thực sự muốn lượt quét đầy đủ lớn hơn.
- `test:docker:all` build live Docker image một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần thành npm tarball thông qua `scripts/package-openclaw-for-docker.mjs`, rồi build/tái sử dụng hai image `scripts/e2e/Dockerfile`. Image trần chỉ là runner Node/Git cho các lane install/update/plugin-dependency; các lane đó mount tarball đã build sẵn. Image chức năng cài cùng tarball đó vào `/app` cho các lane chức năng built-app. Định nghĩa Docker lane nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Bộ tổng hợp dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` điều khiển số slot tiến trình, trong khi các giới hạn tài nguyên ngăn các lane live nặng, npm-install và multi-service cùng khởi động một lúc. Nếu một lane đơn lẻ nặng hơn các giới hạn đang hoạt động, scheduler vẫn có thể khởi động lane đó khi pool trống rồi giữ lane chạy một mình cho đến khi lại có dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ tinh chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi Docker host có thêm dư địa. Runner mặc định thực hiện Docker preflight, xóa các container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời lượng lane thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời lượng đó để khởi động các lane dài hơn trước trong các lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane có trọng số mà không build hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các lane đã chọn, nhu cầu package/image và thông tin xác thực.
- `Package Acceptance` là cổng package gốc của GitHub cho câu hỏi "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một package ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải lên dưới dạng `package-under-test`, rồi chạy các Docker E2E lane tái sử dụng trên đúng tarball đó thay vì đóng gói lại ref đã chọn. `workflow_ref` chọn các script workflow/harness đáng tin cậy, trong khi `package_ref` chọn commit/branch/tag nguồn để đóng gói khi `source=ref`; điều này cho phép logic acceptance hiện tại xác thực các commit đáng tin cậy cũ hơn. Các profile được sắp theo độ bao phủ: `smoke` là cài đặt/channel/agent nhanh cộng với Gateway/cấu hình, `package` là hợp đồng package/update/Plugin cộng với fixture keyless upgrade-survivor, lane published-baseline upgrade survivor, và thay thế native mặc định cho hầu hết phạm vi Parallels package/update, `product` thêm các kênh MCP, dọn dẹp Cron/subagent, OpenAI web search và OpenWebUI, còn `full` chạy các khối Docker release-path với OpenWebUI. Đối với `published-upgrade-survivor`, Package Acceptance luôn dùng `package-under-test` làm ứng viên và `published_upgrade_survivor_baseline` làm baseline đã phát hành để fallback, mặc định là `openclaw@latest`; đặt `published_upgrade_survivor_baselines=release-history` để chia shard lane trên một ma trận đã khử trùng lặp gồm sáu bản phát hành ổn định mới nhất, `2026.4.23`, và bản phát hành ổn định mới nhất trước `2026-03-15`. Lane đã phát hành cấu hình baseline bằng một recipe lệnh `openclaw config set` được nhúng sẵn, rồi ghi lại các bước recipe trong tóm tắt lane. Xác thực phát hành chạy một delta package tùy chỉnh (`bundled-channel-deps-compat plugins-offline`) cộng với Telegram package QA vì các khối Docker release-path đã bao phủ các lane package/update/Plugin trùng lặp. Các lệnh chạy lại Docker GitHub có mục tiêu được tạo từ artifact bao gồm package artifact trước đó, input image đã chuẩn bị, và danh sách baseline published upgrade-survivor khi có, để các lane thất bại có thể tránh build lại package và image.
- Kiểm tra build và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Guard duyệt đồ thị built tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và thất bại nếu startup trước dispatch import các dependency package như Commander, prompt UI, undici, hoặc logging trước khi dispatch lệnh; nó cũng giữ chunk chạy Gateway đã bundle trong ngân sách và từ chối static import các đường dẫn Gateway lạnh đã biết. Kiểm thử khói CLI đã đóng gói cũng bao phủ root help, onboard help, doctor help, status, config schema, và một lệnh model-list.
- Tương thích legacy của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Đến mốc đó, harness chỉ dung thứ các khoảng trống metadata của package đã phát hành: các mục private QA inventory bị bỏ qua, thiếu `gateway install --wrapper`, thiếu tệp patch trong fixture git dẫn xuất từ tarball, thiếu `update.channel` được lưu bền vững, vị trí install-record Plugin legacy, thiếu tính bền vững install-record marketplace, và migration metadata cấu hình trong `plugins update`. Với các package sau `2026.4.25`, những đường dẫn đó là lỗi nghiêm ngặt.
- Container smoke runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.

Các live-model Docker runner cũng chỉ bind-mount những CLI auth home cần thiết (hoặc tất cả home được hỗ trợ khi lần chạy không bị thu hẹp), rồi sao chép chúng vào home của container trước khi chạy để OAuth của CLI bên ngoài có thể refresh token mà không làm thay đổi kho auth trên host:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Kiểm thử smoke liên kết ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với phạm vi bao phủ Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử smoke harness máy chủ ứng dụng Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent phát triển: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử smoke khả năng quan sát: `pnpm qa:otel:smoke` là một luồng checkout nguồn QA riêng tư. Nó cố ý không thuộc các luồng phát hành Docker của gói vì tarball npm bỏ qua QA Lab.
- Kiểm thử smoke trực tiếp Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, scaffold đầy đủ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử smoke onboarding/kênh/agent tarball npm: `pnpm test:docker:npm-onboard-channel-agent` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, cấu hình OpenAI qua onboarding tham chiếu env cùng với Telegram theo mặc định, xác minh doctor đã sửa các phụ thuộc runtime Plugin đã kích hoạt, và chạy một lượt agent OpenAI được mô phỏng. Tái sử dụng tarball đã dựng sẵn bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bản dựng host bằng `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc chuyển kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Kiểm thử smoke chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, chuyển từ package `stable` sang git `dev`, xác minh kênh đã lưu và công việc sau cập nhật của Plugin, rồi chuyển lại về package `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử smoke sống sót qua nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt tarball OpenClaw đã đóng gói đè lên một fixture người dùng cũ không sạch với các agent, cấu hình kênh, danh sách cho phép Plugin, trạng thái runtime-deps Plugin đã cũ, và các tệp workspace/session hiện có. Nó chạy cập nhật package cùng doctor không tương tác mà không cần provider trực tiếp hoặc khóa kênh, sau đó khởi động một Gateway loopback và kiểm tra việc bảo toàn cấu hình/trạng thái cùng các ngân sách khởi động/trạng thái.
- Kiểm thử smoke sống sót qua nâng cấp đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, seed các tệp người dùng hiện có thực tế, cấu hình baseline đó bằng một công thức lệnh được nhúng sẵn, xác thực cấu hình thu được, cập nhật bản cài đặt đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway loopback và kiểm tra các intent đã cấu hình, việc bảo toàn trạng thái, khởi động, `/healthz`, `/readyz`, và các ngân sách trạng thái RPC. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các baseline chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, và mở rộng các fixture dạng issue bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; Package Acceptance hiển thị các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, và `published_upgrade_survivor_scenarios`.
- Kiểm thử smoke ngữ cảnh runtime session: `pnpm test:docker:session-runtime-context` xác minh việc lưu transcript ngữ cảnh runtime ẩn cùng với sửa chữa doctor cho các nhánh ghi lại prompt bị trùng lặp chịu ảnh hưởng.
- Kiểm thử smoke cài đặt toàn cục Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một home cô lập, và xác minh `openclaw infer image providers --json` trả về các provider hình ảnh đi kèm thay vì bị treo. Tái sử dụng tarball đã dựng sẵn bằng `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bản dựng host bằng `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một image Docker đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử smoke Docker trình cài đặt: `bash scripts/test-install-sh-docker.sh` chia sẻ một cache npm giữa các container root, update và direct-npm của nó. Kiểm thử smoke cập nhật mặc định dùng npm `latest` làm baseline ổn định trước khi nâng cấp lên tarball ứng viên. Ghi đè bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` cục bộ, hoặc bằng input `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ một cache npm cô lập để các mục cache thuộc sở hữu root không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để tái sử dụng cache root/update/direct-npm giữa các lần chạy lại cục bộ.
- CI Install Smoke bỏ qua cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy script cục bộ mà không có env đó khi cần phạm vi bao phủ `npm install -g` trực tiếp.
- Kiểm thử smoke CLI xóa workspace dùng chung của agent: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng image Dockerfile gốc, seed hai agent với một workspace trong home container cô lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Tái sử dụng image install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử smoke snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng image E2E nguồn cộng với một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao phủ URL liên kết, đối tượng có thể nhấp được nâng cấp từ con trỏ, tham chiếu iframe và metadata frame.
- Hồi quy suy luận tối thiểu OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI được mô phỏng qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, rồi buộc schema provider từ chối và kiểm tra chi tiết thô xuất hiện trong log Gateway.
- Cầu nối kênh MCP (Gateway đã seed + cầu nối stdio + kiểm thử smoke notification-frame thô Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP gói Pi (máy chủ MCP stdio thật + kiểm thử smoke cho phép/từ chối profile Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP Cron/subagent (Gateway thật + teardown tiến trình con MCP stdio sau các lần chạy cron cô lập và subagent một lần): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (kiểm thử smoke cài đặt, cài đặt/gỡ cài đặt ClawHub kitchen-sink, cập nhật marketplace, và bật/kiểm tra bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp package/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Nếu không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, kiểm thử dùng máy chủ fixture ClawHub cục bộ hermetic.
- Kiểm thử smoke cập nhật Plugin không thay đổi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử smoke metadata tải lại cấu hình: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Phụ thuộc runtime Plugin đi kèm: `pnpm test:docker:bundled-channel-deps` mặc định dựng một image runner Docker nhỏ, dựng và đóng gói OpenClaw một lần trên host, rồi mount tarball đó vào từng kịch bản cài đặt Linux. Tái sử dụng image bằng `OPENCLAW_SKIP_DOCKER_BUILD=1`, bỏ qua dựng lại host sau một bản dựng cục bộ mới bằng `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, hoặc trỏ tới một tarball hiện có bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Tổng hợp Docker đầy đủ và các chunk bundled-channel theo đường phát hành đóng gói trước tarball này một lần, rồi chia các kiểm tra kênh đi kèm thành các luồng độc lập, bao gồm các luồng cập nhật riêng cho Telegram, Discord, Slack, Feishu, memory-lancedb và ACPX. Các chunk phát hành tách kiểm thử smoke kênh, mục tiêu cập nhật, và hợp đồng thiết lập/runtime thành `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b`, và `bundled-channels-contracts`; chunk tổng hợp `bundled-channels` vẫn khả dụng cho các lần chạy lại thủ công. Workflow phát hành cũng tách các chunk trình cài đặt provider và các chunk cài đặt/gỡ cài đặt Plugin đi kèm; các chunk cũ `package-update`, `plugins-runtime`, và `plugins-integrations` vẫn là alias tổng hợp cho các lần chạy lại thủ công. Dùng `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` để thu hẹp ma trận kênh khi chạy trực tiếp luồng đi kèm, hoặc `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` để thu hẹp kịch bản cập nhật. Các lần chạy Docker theo từng kịch bản mặc định dùng `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; kịch bản cập nhật đa mục tiêu mặc định dùng `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Luồng này cũng xác minh rằng `channels.<id>.enabled=false` và `plugins.entries.<id>.enabled=false` chặn sửa chữa phụ thuộc runtime/doctor.
- Thu hẹp phụ thuộc runtime Plugin đi kèm khi lặp bằng cách tắt các kịch bản không liên quan, ví dụ:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Để dựng trước và tái sử dụng image chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image theo từng suite như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một image dùng chung từ xa, các script sẽ pull image đó nếu nó chưa có cục bộ. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi package/cài đặt thay vì runtime ứng dụng đã dựng dùng chung.

Các runner Docker mô hình live cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một thư mục làm việc tạm thời bên trong container. Điều này giữ cho runtime
image gọn nhẹ trong khi vẫn chạy Vitest trên đúng source/config cục bộ của bạn.
Bước staging bỏ qua các cache lớn chỉ dùng cục bộ và output build ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục output `.build` cục bộ của ứng dụng hoặc
Gradle để các lần chạy Docker live không mất nhiều phút sao chép
artifact đặc thù của máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các live probe của Gateway không khởi động
worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền qua
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi live của Gateway
khỏi luồng Docker đó.
`test:docker:openwebui` là một smoke test tương thích cấp cao hơn: nó khởi động một
container Gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI đã ghim phiên bản trỏ đến Gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` công bố `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Lần chạy đầu tiên có thể chậm hơn rõ rệt vì Docker có thể cần pull image
Open WebUI và Open WebUI có thể cần hoàn tất thiết lập cold-start riêng.
Luồng này yêu cầu một khóa mô hình live có thể dùng được, và `OPENCLAW_PROFILE_FILE`
(mặc định là `~/.profile`) là cách chính để cung cấp khóa đó trong các lần chạy Docker hóa.
Các lần chạy thành công in ra một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính quyết định và không cần tài khoản
Telegram, Discord hoặc iMessage thật. Nó khởi động một container Gateway đã seed,
khởi động container thứ hai sinh `openclaw mcp serve`, rồi xác minh
khám phá cuộc trò chuyện đã route, đọc transcript, metadata tệp đính kèm,
hành vi hàng đợi sự kiện live, định tuyến gửi outbound, và thông báo kênh +
quyền kiểu Claude qua bridge MCP stdio thật. Kiểm tra thông báo
kiểm tra trực tiếp các frame MCP stdio thô để smoke test xác thực những gì
bridge thật sự phát ra, chứ không chỉ những gì một SDK client cụ thể tình cờ hiển thị.
`test:docker:pi-bundle-mcp-tools` có tính quyết định và không cần khóa mô hình live.
Nó build image Docker của repo, khởi động một server probe MCP stdio thật
bên trong container, hiện thực hóa server đó qua runtime MCP của Pi bundle nhúng,
thực thi tool, rồi xác minh `coding` và `messaging` giữ lại
tool `bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính quyết định và không cần khóa mô hình live.
Nó khởi động một Gateway đã seed với server probe MCP stdio thật, chạy một
lượt cron cô lập và một lượt con một lần `/subagents spawn`, rồi xác minh
tiến trình con MCP thoát sau mỗi lần chạy.

Smoke test thủ công thread ACP bằng ngôn ngữ tự nhiên (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow hồi quy/gỡ lỗi. Nó có thể cần dùng lại cho xác thực định tuyến thread ACP, vì vậy đừng xóa nó.

Các biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy kiểm thử
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được source từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục config/workspace tạm thời và không mount xác thực CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các bản cài CLI được cache bên trong Docker
- Các thư mục/tệp xác thực CLI bên ngoài dưới `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi kiểm thử bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy provider đã thu hẹp chỉ mount những thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc provider trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để dùng lại image `openclaw:local-live` hiện có cho các lần chạy lại không cần rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để bảo đảm thông tin xác thực đến từ profile store (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình được Gateway công bố cho smoke test Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce được smoke test Open WebUI sử dụng
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã ghim

## Kiểm tra hợp lý tài liệu

Chạy kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra heading trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy offline (an toàn cho CI)

Đây là các hồi quy “pipeline thật” không dùng provider thật:

- Gọi tool Gateway (mock OpenAI, Gateway thật + vòng lặp agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Trình hướng dẫn Gateway (WS `wizard.start`/`wizard.next`, ghi config + áp dụng auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Eval độ tin cậy agent (skills)

Chúng ta đã có vài kiểm thử an toàn cho CI hoạt động như “eval độ tin cậy agent”:

- Gọi tool mock qua Gateway thật + vòng lặp agent (`src/gateway/gateway.test.ts`).
- Các flow wizard end-to-end xác thực wiring phiên và hiệu lực config (`src/gateway/gateway.test.ts`).

Những gì vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi các skill được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi dùng và làm theo các bước/args bắt buộc không?
- **Hợp đồng workflow:** các kịch bản nhiều lượt assert thứ tự tool, chuyển tiếp lịch sử phiên, và ranh giới sandbox.

Các eval tương lai trước hết nên giữ tính quyết định:

- Một scenario runner dùng provider mock để assert tool call + thứ tự, đọc tệp skill, và wiring phiên.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng hay tránh, gating, prompt injection).
- Eval live tùy chọn (opt-in, có cổng env) chỉ sau khi bộ an toàn cho CI đã có sẵn.

## Kiểm thử hợp đồng (hình dạng Plugin và kênh)

Kiểm thử hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ
hợp đồng interface của chúng. Chúng lặp qua tất cả Plugin được phát hiện và chạy một bộ
assertion về hình dạng và hành vi. Luồng unit mặc định `pnpm test` cố ý
bỏ qua các tệp seam và smoke dùng chung này; hãy chạy rõ ràng các lệnh hợp đồng
khi bạn chạm vào surface kênh dùng chung hoặc provider.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng provider: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng Plugin cơ bản (id, tên, capability)
- **setup** - Hợp đồng wizard thiết lập
- **session-binding** - Hành vi binding phiên
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn inbound
- **actions** - Handler hành động kênh
- **threading** - Xử lý ID thread
- **directory** - API thư mục/danh sách
- **group-policy** - Thực thi chính sách nhóm

### Hợp đồng trạng thái provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe trạng thái kênh
- **registry** - Hình dạng registry Plugin

### Hợp đồng provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng luồng xác thực
- **auth-choice** - Lựa chọn/chọn xác thực
- **catalog** - API catalog mô hình
- **discovery** - Khám phá Plugin
- **loader** - Tải Plugin
- **runtime** - Runtime provider
- **shape** - Hình dạng/interface Plugin
- **wizard** - Wizard thiết lập

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa một kênh hoặc Plugin provider
- Sau khi refactor đăng ký hoặc khám phá Plugin

Kiểm thử hợp đồng chạy trong CI và không cần khóa API thật.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề provider/mô hình được phát hiện trong live:

- Thêm hồi quy an toàn cho CI nếu có thể (provider mock/stub, hoặc ghi lại đúng phép biến đổi hình dạng request)
- Nếu bản chất chỉ có thể kiểm thử live (rate limit, chính sách auth), hãy giữ kiểm thử live hẹp và opt-in qua biến môi trường
- Ưu tiên nhắm vào lớp nhỏ nhất bắt được lỗi:
  - lỗi chuyển đổi/replay request của provider → kiểm thử models trực tiếp
  - lỗi pipeline phiên/lịch sử/tool của Gateway → smoke test Gateway live hoặc kiểm thử mock Gateway an toàn cho CI
- Guardrail duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một target được lấy mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi assert rằng exec id có traversal-segment bị từ chối.
  - Nếu bạn thêm một họ target SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong kiểm thử đó. Kiểm thử cố ý thất bại với target id chưa phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Kiểm thử live](/vi/help/testing-live)
- [CI](/vi/ci)
