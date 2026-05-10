---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm kiểm thử hồi quy cho lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của Gateway + tác tử
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử đơn vị/e2e/trực tiếp, trình chạy Docker và phạm vi bao phủ của từng bài kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-10T19:38:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (unit/integration, e2e, live) và một nhóm nhỏ
trình chạy Docker. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ kiểm thử bao phủ những gì (và những gì nó cố ý _không_ bao phủ).
- Các lệnh cần chạy cho những quy trình thường gặp (cục bộ, trước khi đẩy lên, gỡ lỗi).
- Cách kiểm thử trực tiếp phát hiện thông tin xác thực và chọn mô hình/nhà cung cấp.
- Cách thêm các kiểm thử hồi quy cho vấn đề mô hình/nhà cung cấp trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các luồng vận chuyển trực tiếp)** được ghi tài liệu riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) - kiến trúc, bề mặt lệnh, biên soạn kịch bản.
- [QA ma trận](/vi/concepts/qa-matrix) - tham chiếu cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) - plugin vận chuyển tổng hợp được dùng bởi các kịch bản dựa trên repo.

Trang này trình bày cách chạy các bộ kiểm thử thông thường và các trình chạy Docker/Parallels. Phần trình chạy riêng cho QA bên dưới ([Trình chạy riêng cho QA](#qa-specific-runners)) liệt kê các lệnh gọi `qa` cụ thể và trỏ lại các tài liệu tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng kiểm tra đầy đủ (được kỳ vọng trước khi đẩy lên): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy có nhiều tài nguyên: `pnpm test:max`
- Vòng lặp watch trực tiếp của Vitest: `pnpm test:watch`
- Nhắm trực tiếp vào tệp hiện cũng định tuyến cả đường dẫn extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên chạy có mục tiêu trước khi bạn đang lặp trên một lỗi duy nhất.
- Trang QA dựa trên Docker: `pnpm qa:lab:up`
- Luồng QA dựa trên Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng coverage: `pnpm test:coverage`
- Bộ kiểm thử E2E: `pnpm test:e2e`

Khi gỡ lỗi nhà cung cấp/mô hình thật (cần thông tin xác thực thật):

- Bộ kiểm thử trực tiếp (mô hình + probe công cụ/hình ảnh của Gateway): `pnpm test:live`
- Nhắm vào một tệp trực tiếp ở chế độ ít log: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng runtime: kích hoạt `OpenClaw Performance` với
  `live_gpt54=true` cho một lượt tác tử `openai/gpt-5.4` thật hoặc
  `deep_profile=true` cho các artifact CPU/heap/trace của Kova. Các lượt chạy theo lịch hằng ngày
  xuất bản artifact của các luồng mock-provider, deep-profile và GPT 5.4 lên
  `openclaw/clawgrit-reports` khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình. Báo cáo
  mock-provider cũng bao gồm các số liệu khởi động Gateway ở cấp nguồn, bộ nhớ,
  plugin-pressure, vòng lặp hello-loop mô hình giả lặp lại, và khởi động CLI.
- Quét mô hình trực tiếp bằng Docker: `pnpm test:docker:live-models`
  - Mỗi mô hình được chọn hiện chạy một lượt văn bản cộng với một probe nhỏ kiểu đọc tệp.
    Các mô hình có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các probe bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi nhà cung cấp.
  - Phạm vi CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi quy trình live/E2E tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận mô hình trực tiếp Docker riêng
    được chia theo nhà cung cấp.
  - Để chạy lại CI có trọng tâm, kích hoạt `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm các secret nhà cung cấp có giá trị tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cộng với `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các
    caller theo lịch/phát hành của nó.
- Kiểm thử khói bound-chat Codex native: `pnpm test:docker:live-codex-bind`
  - Chạy một luồng Docker trực tiếp trên đường dẫn app-server của Codex, liên kết một
    Slack DM tổng hợp bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi thường và một tệp đính kèm hình ảnh
    định tuyến qua liên kết plugin native thay vì ACP.
- Kiểm thử khói harness app-server của Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt tác tử Gateway qua harness app-server của Codex do plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và mặc định thực thi các probe hình ảnh,
    cron MCP, sub-agent và Guardian. Tắt probe sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi app-server Codex
    khác. Để kiểm tra sub-agent có trọng tâm, tắt các probe khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Việc này thoát sau probe sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Kiểm thử khói cài đặt Codex theo yêu cầu: `pnpm test:docker:codex-on-demand`
  - Cài đặt tarball OpenClaw đã đóng gói trong Docker, chạy onboarding bằng khóa API OpenAI,
    và xác minh plugin Codex cùng dependency `@openai/codex`
    đã được tải xuống vào gốc npm được quản lý theo yêu cầu.
- Kiểm thử khói dependency công cụ plugin trực tiếp: `pnpm test:docker:live-plugin-tool`
  - Đóng gói một plugin dữ liệu kiểm thử với dependency `slugify` thật, cài đặt nó qua
    `npm-pack:`, xác minh dependency bên dưới gốc npm được quản lý, rồi yêu cầu một
    mô hình OpenAI trực tiếp gọi công cụ plugin và trả về slug ẩn.
- Kiểm thử khói lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra phòng ngừa bổ sung có chọn tham gia cho bề mặt lệnh cứu hộ kênh tin nhắn.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi mô hình bền vững,
    trả lời `/crestodian yes`, và xác minh đường ghi audit/config.
- Kiểm thử khói Docker cho bộ lập kế hoạch Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong container không có cấu hình với một Claude CLI giả trên `PATH`
    và xác minh cơ chế dự phòng của bộ lập kế hoạch mờ được dịch thành một thao tác
    ghi cấu hình có kiểu đã được audit.
- Kiểm thử khói Docker cho lần chạy đầu của Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, định tuyến `openclaw` trần tới
    Crestodian, áp dụng các thao tác ghi setup/model/agent/plugin Discord + SecretRef,
    xác thực cấu hình, và xác minh các mục audit. Cùng đường thiết lập Ring 0 đó
    cũng được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Kiểm thử khói chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một lượt cô lập
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  trên `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và bản ghi trợ lý
  lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một ca lỗi, ưu tiên thu hẹp kiểm thử trực tiếp bằng các biến môi trường danh sách cho phép được mô tả bên dưới.
</Tip>

## Trình chạy riêng cho QA

Các lệnh này nằm cạnh những bộ kiểm thử chính khi bạn cần độ thực tế của QA-lab:

CI chạy QA Lab trong các quy trình chuyên biệt. Tính tương đồng của tác tử được lồng dưới
`QA-Lab - All Lanes` và xác thực phát hành, không phải một quy trình PR độc lập.
Xác thực rộng nên dùng `Full Release Validation` với
`rerun_group=qa-parity` hoặc nhóm QA của release-checks. Các kiểm tra phát hành
ổn định/mặc định giữ kiểm thử soak live/Docker toàn diện phía sau `run_release_soak=true`; hồ sơ
`full` buộc bật soak. `QA-Lab - All Lanes`
chạy hằng đêm trên `main` và từ kích hoạt thủ công với luồng tương đồng mock,
luồng Matrix trực tiếp, luồng Telegram trực tiếp do Convex quản lý, và luồng Discord
trực tiếp do Convex quản lý dưới dạng các job song song. QA theo lịch và kiểm tra phát hành truyền Matrix
`--profile fast` một cách tường minh, trong khi CLI Matrix và mặc định đầu vào quy trình thủ công
vẫn là `all`; kích hoạt thủ công có thể chia shard `all` thành các job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`. `OpenClaw Release
Checks` chạy parity cộng với các luồng Matrix nhanh và Telegram trước khi phê duyệt phát hành,
sử dụng `mock-openai/gpt-5.5` cho kiểm tra vận chuyển phát hành để chúng luôn
xác định và tránh khởi động plugin nhà cung cấp thông thường. Các Gateway vận chuyển trực tiếp này
tắt tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ kiểm thử parity QA.

Các shard media trực tiếp của phát hành đầy đủ dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard mô hình/backend trực tiếp Docker dùng image dùng chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được xây dựng một lần cho mỗi commit được chọn,
sau đó kéo image đó bằng `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì xây dựng lại
bên trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy trực tiếp các kịch bản QA dựa trên repo trên host.
  - Chạy nhiều kịch bản đã chọn song song theo mặc định với các worker
    gateway được cô lập. `qa-channel` mặc định concurrency là 4 (bị giới hạn bởi
    số lượng kịch bản đã chọn). Dùng `--concurrency <count>` để tinh chỉnh số lượng
    worker, hoặc `--concurrency 1` cho lane tuần tự cũ hơn.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Hỗ trợ các chế độ provider `live-frontier`, `mock-openai`, và `aimock`.
    `aimock` khởi động một server provider cục bộ dựa trên AIMock cho phạm vi bao phủ
    fixture thử nghiệm và protocol-mock mà không thay thế lane `mock-openai`
    nhận biết theo kịch bản.
- `pnpm test:plugins:kitchen-sink-live`
  - Chạy loạt kiểm thử Plugin OpenAI Kitchen Sink trực tiếp thông qua QA Lab. Nó
    cài đặt gói Kitchen Sink bên ngoài, xác minh inventory bề mặt plugin SDK,
    thăm dò `/healthz` và `/readyz`, ghi lại bằng chứng CPU/RSS của gateway,
    chạy một lượt OpenAI trực tiếp, và kiểm tra chẩn đoán đối kháng.
    Yêu cầu xác thực OpenAI trực tiếp như `OPENAI_API_KEY`. Trong các phiên Testbox
    đã được cấp dữ liệu, nó tự động nạp profile live-auth của Testbox khi helper
    `openclaw-testbox-env` có mặt.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy bench khởi động gateway cộng với một gói nhỏ kịch bản QA Lab giả lập
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi một bản tóm tắt quan sát CPU kết hợp
    dưới `.artifacts/gateway-cpu-scenarios/`.
  - Theo mặc định chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cộng với `--hot-wall-warn-ms`), vì vậy các đợt tăng ngắn lúc khởi động được ghi
    thành metric mà không trông giống hồi quy gateway bị ghim nhiều phút.
  - Dùng các artifact `dist` đã build; hãy chạy build trước khi checkout chưa có
    đầu ra runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA bên trong một VM Linux Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên host.
  - Dùng lại cùng các cờ chọn provider/model như `qa suite`.
  - Các lần chạy trực tiếp chuyển tiếp những input xác thực QA được hỗ trợ và thực tế cho guest:
    khóa provider dựa trên env, đường dẫn cấu hình provider trực tiếp của QA, và `CODEX_HOME`
    khi có mặt.
  - Các thư mục đầu ra phải nằm dưới root repo để guest có thể ghi ngược qua
    workspace được mount.
  - Ghi báo cáo + tóm tắt QA bình thường cùng log Multipass dưới
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA dựa trên Docker cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt toàn cục trong
    Docker, chạy onboarding khóa API OpenAI không tương tác, cấu hình Telegram
    theo mặc định, xác minh runtime Plugin đã đóng gói tải mà không cần sửa
    dependency lúc khởi động, chạy doctor, và chạy một lượt agent cục bộ trên
    endpoint OpenAI giả lập.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane cài đặt gói
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một smoke Docker ứng dụng đã build, có tính xác định, cho transcript
    ngữ cảnh runtime nhúng. Nó xác minh ngữ cảnh runtime OpenClaw ẩn được lưu bền
    như một thông điệp tùy chỉnh không hiển thị thay vì rò rỉ vào lượt người dùng
    thấy được, sau đó seed một session JSONL hỏng bị ảnh hưởng và xác minh
    `openclaw doctor --fix` viết lại nó sang nhánh active kèm bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên gói OpenClaw trong Docker, chạy onboarding gói đã cài,
    cấu hình Telegram thông qua CLI đã cài, rồi dùng lại lane QA Telegram trực tiếp
    với gói đã cài đó làm Gateway SUT.
  - Wrapper chỉ mount mã nguồn harness `qa-lab` từ checkout; gói đã cài sở hữu
    `dist`, `openclaw/plugin-sdk`, và runtime Plugin được bundle để lane không trộn
    các Plugin từ checkout hiện tại vào gói đang kiểm thử.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã resolve thay vì
    cài từ registry.
  - Dùng cùng thông tin xác thực env Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/release, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cộng với
    `OPENCLAW_QA_CONVEX_SITE_URL` và role secret. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một Convex role secret có mặt trong CI,
    wrapper Docker sẽ tự động chọn Convex.
  - Wrapper xác thực env thông tin xác thực Telegram hoặc Convex trên host trước
    công việc build/cài đặt Docker. Chỉ đặt `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    khi cố ý gỡ lỗi thiết lập trước thông tin xác thực.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này.
  - GitHub Actions hiển thị lane này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và lease thông tin xác thực Convex CI.
- GitHub Actions cũng hiển thị `Package Acceptance` để chạy phụ bằng chứng sản phẩm
  trên một gói ứng viên. Nó nhận một ref tin cậy, npm spec đã phát hành,
  URL tarball HTTPS cộng với SHA-256, hoặc artifact tarball từ một lần chạy khác, upload
  `openclaw-current.tgz` đã chuẩn hóa dưới tên `package-under-test`, rồi chạy
  scheduler Docker E2E hiện có với các profile lane smoke, package, product, full, hoặc custom.
  Đặt `telegram_mode=mock-openai` hoặc `live-frontier` để chạy workflow QA Telegram
  trên cùng artifact `package-under-test`.
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
  - Đóng gói và cài đặt bản build OpenClaw hiện tại trong Docker, khởi động Gateway
    với OpenAI đã cấu hình, rồi bật các channel/Plugin được bundle thông qua chỉnh sửa
    cấu hình.
  - Xác minh khám phá thiết lập để các Plugin có thể tải xuống nhưng chưa cấu hình vắng mặt,
    lần sửa doctor đã cấu hình đầu tiên cài đặt rõ ràng từng Plugin có thể tải xuống
    còn thiếu, và lần khởi động lại thứ hai không chạy sửa dependency ẩn.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của ứng viên
    dọn dẹp mảnh vụn dependency Plugin legacy mà không cần sửa postinstall phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật cài đặt gói native trên các guest Parallels. Mỗi nền tảng
    được chọn trước tiên cài đặt gói baseline được yêu cầu, sau đó chạy lệnh
    `openclaw update` đã cài trong cùng guest và xác minh phiên bản đã cài,
    trạng thái cập nhật, trạng thái sẵn sàng của gateway, và một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một guest. Dùng `--json` cho đường dẫn artifact tóm tắt và trạng thái
    theo từng lane.
  - Lane OpenAI dùng `openai/gpt-5.5` cho bằng chứng lượt agent trực tiếp theo
    mặc định. Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi cố ý xác thực một model OpenAI khác.
  - Bọc các lần chạy cục bộ dài trong timeout của host để tình trạng treo transport
    Parallels không tiêu tốn phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi các log lane lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi cho rằng wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong doctor sau cập nhật và công việc
    cập nhật gói trên guest lạnh; điều đó vẫn lành mạnh khi log debug npm lồng nhau
    vẫn đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với từng lane smoke Parallels
    macOS, Windows, hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể xung đột khi
    khôi phục snapshot, phục vụ gói, hoặc trạng thái gateway của guest.
  - Bằng chứng sau cập nhật chạy bề mặt Plugin được bundle bình thường vì
    các facade capability như speech, image generation, và media
    understanding được tải thông qua API runtime được bundle ngay cả khi chính lượt agent
    chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động server provider AIMock cục bộ để kiểm thử smoke protocol trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy lane QA Matrix trực tiếp trên một homeserver Tuwunel dùng một lần dựa trên Docker. Chỉ source-checkout - các bản cài đặt đóng gói không ship `qa-lab`.
  - CLI đầy đủ, catalog profile/kịch bản, env var, và bố cục artifact: [Matrix QA](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy lane QA Telegram trực tiếp trên một nhóm riêng tư thật bằng token bot driver và SUT từ env.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID nhóm phải là chat id Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực dùng chung theo pool. Dùng chế độ env theo mặc định, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn lease theo pool.
  - Mặc định bao phủ canary, mention gating, command addressing, `/status`, phản hồi bot-to-bot được mention, và phản hồi lệnh native của core. Mặc định `mock-openai` cũng bao phủ hồi quy reply-chain có tính xác định và streaming final-message của Telegram. Dùng `--list-scenarios` cho các probe tùy chọn như `session_status`.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng nhóm riêng tư, với bot SUT hiển thị username Telegram.
  - Để quan sát bot-to-bot ổn định, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và đảm bảo bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, tóm tắt, và artifact observed-messages dưới `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT quan sát được.

`Mantis Telegram Live` là wrapper bằng chứng PR quanh lane này. Nó chạy
ref ứng viên với thông tin xác thực Telegram thuê từ Convex, render transcript
observed-message đã biên tập trong trình duyệt desktop Crabbox, ghi bằng chứng MP4,
tạo GIF đã cắt theo chuyển động, upload gói artifact, và đăng bằng chứng PR inline
thông qua Mantis GitHub App khi `pr_number` được đặt. Maintainer có thể
khởi động nó từ UI Actions thông qua `Mantis Scenario` (`scenario_id:
telegram-live`) hoặc trực tiếp từ bình luận pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Thuê hoặc tái sử dụng một desktop Linux Crabbox, cài đặt Telegram Desktop native, cấu hình OpenClaw bằng token bot SUT Telegram đã thuê, khởi động gateway, và ghi lại bằng chứng ảnh chụp màn hình/MP4 từ desktop VNC hiển thị.
  - Mặc định là `--credential-source convex` để workflow chỉ cần secret của broker Convex. Dùng `--credential-source env` với cùng các biến `OPENCLAW_QA_TELEGRAM_*` như `pnpm openclaw qa telegram`.
  - Telegram Desktop vẫn cần thông tin đăng nhập/hồ sơ người dùng. Token bot chỉ cấu hình OpenClaw. Dùng `--telegram-profile-archive-env <name>` cho kho lưu trữ hồ sơ `.tgz` base64, hoặc dùng `--keep-lease` và đăng nhập thủ công qua VNC một lần.
  - Ghi `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, và `telegram-desktop-builder.mp4` vào thư mục đầu ra.

Các lane truyền tải live chia sẻ một hợp đồng tiêu chuẩn để những transport mới không bị lệch; ma trận phạm vi theo từng lane nằm trong [Tổng quan QA → Phạm vi transport live](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ kiểm thử tổng hợp rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi bật `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) cho
QA transport live, QA lab lấy một lease độc quyền từ pool do Convex hỗ trợ, heartbeat lease đó
trong khi lane đang chạy, và giải phóng lease khi tắt. Tên phần này có trước
hỗ trợ Discord, Slack, và WhatsApp; hợp đồng lease được dùng chung giữa các kind.

Scaffold dự án Convex tham khảo:

- `qa/convex-credential-broker/`

Biến môi trường bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho vai trò đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn vai trò thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định env: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, ngược lại là `maintainer`)

Biến môi trường tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id truy vết tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` loopback cho phát triển chỉ cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong vận hành bình thường.

Các lệnh quản trị của maintainer (thêm/xóa/liệt kê pool) yêu cầu
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
giá trị secret. Dùng `--json` để có đầu ra máy đọc được trong script và tiện ích
CI.

Hợp đồng endpoint mặc định (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Yêu cầu: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Thành công: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Hết pool/có thể thử lại: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Yêu cầu: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Thành công: `{ status: "ok", index, data }`
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

Dạng payload cho kind người dùng thật Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, và `telegramApiId` phải là chuỗi dạng số.
- `tdlibArchiveSha256` và `desktopTdataArchiveSha256` phải là chuỗi hex SHA-256.
- `kind: "telegram-user"` đại diện cho một tài khoản Telegram burner. Xem lease là phạm vi toàn tài khoản: driver CLI TDLib và chứng cứ trực quan Telegram Desktop khôi phục từ cùng payload, và mỗi lần chỉ một job được giữ lease.

Khôi phục lease người dùng thật Telegram:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

Dùng hồ sơ Desktop đã khôi phục với `Telegram -workdir "$tmp/desktop"` khi cần ghi hình trực quan. Trong môi trường operator cục bộ, `scripts/e2e/telegram-user-credential.ts` đọc `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` theo mặc định nếu biến môi trường của tiến trình không có.

Phiên Crabbox do agent điều khiển:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` thuê thông tin xác thực `telegram-user`, khôi phục cùng tài khoản vào
TDLib và Telegram Desktop trên desktop Linux Crabbox, khởi động Gateway SUT mock
cục bộ từ checkout hiện tại, mở chat Telegram hiển thị, bắt đầu ghi desktop,
và ghi một `session.json` riêng tư. Khi phiên còn sống, agent có thể tiếp tục
kiểm thử đến khi hài lòng:

- `send --session <file> --text <message>` gửi qua người dùng TDLib thật và chờ phản hồi SUT.
- `run --session <file> -- <remote command>` chạy một lệnh tùy ý trên Crabbox và lưu đầu ra của lệnh đó, ví dụ `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` chụp desktop đang hiển thị hiện tại.
- `status --session <file>` in lease và lệnh WebVNC.
- `finish --session <file>` dừng trình ghi, chụp ảnh màn hình/video/artifact motion-trim, giải phóng thông tin xác thực Convex, dừng các tiến trình SUT cục bộ, và dừng lease Crabbox trừ khi truyền `--keep-box`.
- `publish --session <file> --pr <number>` mặc định đăng bình luận PR chỉ có GIF. Chỉ truyền `--full-artifacts` khi thật sự cần log hoặc artifact JSON.

Để tái hiện trực quan xác định, truyền `--mock-response-file <path>` cho `start`
hoặc cho dạng rút gọn một lệnh `probe`. Runner mặc định dùng class Crabbox
tiêu chuẩn, ghi hình 24fps, bản xem trước GIF chuyển động 24fps, và chiều rộng
GIF 1920px. Chỉ ghi đè bằng `--class`, `--record-fps`, `--preview-fps`, và
`--preview-width` khi bằng chứng cần thiết lập chụp khác.

Bằng chứng Crabbox một lệnh:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Lệnh `probe` mặc định là dạng rút gọn cho một chu kỳ start/send/finish. Dùng
nó cho smoke `/status` nhanh. Dùng các lệnh phiên cho review PR,
công việc tái hiện lỗi, hoặc bất kỳ trường hợp nào agent cần vài phút thử nghiệm
tùy ý trước khi quyết định bằng chứng đã hoàn tất. Dùng `--id <cbx_...>` để
tái sử dụng lease desktop đã warm, `--keep-box` để giữ VNC mở sau khi finish,
`--desktop-chat-title <name>` để chọn chat hiển thị, và `--tdlib-url <tgz>`
khi dùng kho lưu trữ Linux `libtdjson.so` dựng sẵn thay vì build TDLib trên
box mới. Runner xác minh `--tdlib-url` bằng `--tdlib-sha256 <hex>` hoặc,
theo mặc định, một tệp `<url>.sha256` cùng cấp.

Payload đa kênh được broker xác thực:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Các lane Slack cũng có thể thuê từ pool, nhưng xác thực payload Slack hiện
nằm trong runner QA Slack thay vì broker. Dùng
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
cho các hàng Slack.

### Thêm kênh vào QA

Kiến trúc và tên trình trợ giúp kịch bản cho adapter kênh mới nằm trong [Tổng quan QA → Thêm kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai runner transport trên seam host `qa-lab` dùng chung, khai báo `qaRunners` trong manifest Plugin, mount dưới dạng `openclaw qa <runner>`, và viết kịch bản trong `qa/scenarios/`.

## Bộ kiểm thử (chạy ở đâu)

Hãy xem các bộ kiểm thử là "độ chân thực tăng dần" (và độ flake/chi phí cũng tăng dần):

### Unit / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng tập shard `vitest.full-*.config.ts` và có thể mở rộng shard đa dự án thành cấu hình theo từng dự án để lập lịch song song
- Tệp: inventory core/unit trong `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử unit UI chạy trong shard `unit-ui` chuyên dụng
- Phạm vi:
  - Kiểm thử unit thuần túy
  - Kiểm thử tích hợp trong tiến trình (xác thực Gateway, định tuyến, tooling, phân tích cú pháp, cấu hình)
  - Hồi quy xác định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không cần khóa thật
  - Nên nhanh và ổn định
  - Các kiểm thử resolver và loader bề mặt công khai phải chứng minh hành vi fallback rộng của `api.js` và
    `runtime-api.js` bằng fixture Plugin nhỏ được tạo, không phải
    API nguồn Plugin bundled thật. Việc tải API Plugin thật thuộc về
    bộ kiểm thử hợp đồng/tích hợp do Plugin sở hữu.

Chính sách phụ thuộc native:

- Cài đặt kiểm thử mặc định bỏ qua build opus Discord native tùy chọn. Nhận voice Discord dùng decoder `opusscript` thuần JS, và `@discordjs/opus` vẫn nằm trong `ignoredBuiltDependencies` để các kiểm thử cục bộ và lane Testbox không biên dịch addon native.
- Dùng lane hiệu năng voice Discord chuyên dụng hoặc lane live nếu bạn chủ ý cần so sánh một build opus native. Không thêm lại `@discordjs/opus` vào `onlyBuiltDependencies` mặc định; điều đó khiến các vòng lặp cài đặt/kiểm thử không liên quan phải biên dịch mã native.

<AccordionGroup>
  <Accordion title="Dự án, shard, và lane có phạm vi">

    - Lệnh `pnpm test` không chỉ định mục tiêu chạy mười hai cấu hình phân mảnh nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình dự án gốc native khổng lồ. Điều này giảm RSS đỉnh trên các máy đang tải nặng và tránh việc auto-reply/extension làm nghẽn các bộ kiểm thử không liên quan.
    - `pnpm test --watch` vẫn dùng đồ thị dự án gốc native `vitest.config.ts`, vì vòng lặp theo dõi nhiều phân mảnh không thực tế.
    - `pnpm test`, `pnpm test:watch`, và `pnpm test:perf:imports` định tuyến các mục tiêu tệp/thư mục rõ ràng qua các làn có phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả toàn bộ chi phí khởi động dự án gốc.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các làn có phạm vi rẻ: chỉnh sửa trực tiếp vào kiểm thử, các tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng, và các phần phụ thuộc trong đồ thị import cục bộ. Chỉnh sửa cấu hình/thiết lập/gói không chạy rộng kiểm thử trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường cho công việc hẹp. Nó phân loại diff thành core, kiểm thử core, extension, kiểm thử extension, ứng dụng, tài liệu, siêu dữ liệu phát hành, công cụ Docker live, và công cụ, rồi chạy các lệnh typecheck, lint, và guard tương ứng. Nó không chạy kiểm thử Vitest; hãy gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các lần tăng phiên bản chỉ liên quan đến siêu dữ liệu phát hành chạy các kiểm tra phiên bản/cấu hình/phụ thuộc gốc có mục tiêu, với guard từ chối thay đổi gói nằm ngoài trường phiên bản cấp cao nhất.
    - Chỉnh sửa harness Docker ACP live chạy các kiểm tra tập trung: cú pháp shell cho các script xác thực Docker live và một lần chạy thử khô bộ lập lịch Docker live. Thay đổi `package.json` chỉ được đưa vào khi diff giới hạn ở `scripts["test:docker:live-*"]`; chỉnh sửa phụ thuộc, export, phiên bản, và các bề mặt gói khác vẫn dùng các guard rộng hơn.
    - Các kiểm thử đơn vị nhẹ về import từ agents, commands, plugins, helper auto-reply, `plugin-sdk`, và các vùng tiện ích thuần tương tự được định tuyến qua làn `unit-fast`, làn này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng về runtime vẫn ở các làn hiện có.
    - Một số tệp nguồn helper `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy ở chế độ changed tới các kiểm thử cùng cấp rõ ràng trong những làn nhẹ đó, nên chỉnh sửa helper tránh chạy lại toàn bộ bộ kiểm thử nặng cho thư mục đó.
    - `auto-reply` có các nhóm riêng cho helper core cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất, và cây con `src/auto-reply/reply/**`. CI tiếp tục tách cây con reply thành các phân mảnh agent-runner, dispatch, và commands/state-routing để một nhóm nặng về import không sở hữu toàn bộ phần đuôi Node.
    - CI PR/main thông thường cố ý bỏ qua lần quét hàng loạt extension và phân mảnh `agentic-plugins` chỉ dành cho phát hành. Full Release Validation kích hoạt workflow con `Plugin Prerelease` riêng cho các bộ kiểm thử nặng về plugin/extension đó trên các ứng viên phát hành.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Khi bạn thay đổi đầu vào khám phá message-tool hoặc ngữ cảnh runtime
      compaction, hãy giữ cả hai cấp độ bao phủ.
    - Thêm các hồi quy helper tập trung cho các ranh giới định tuyến và chuẩn hóa
      thuần.
    - Giữ các bộ kiểm thử tích hợp runner nhúng khỏe mạnh:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ này xác minh rằng id có phạm vi và hành vi compaction vẫn chảy
      qua các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ dành cho helper
      không phải là sự thay thế đủ cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Cấu hình Vitest cơ sở mặc định dùng `threads`.
    - Cấu hình Vitest dùng chung cố định `isolate: false` và dùng runner
      không cô lập trên các dự án gốc, cấu hình e2e, và live.
    - Làn UI gốc giữ thiết lập `jsdom` và bộ tối ưu hóa của nó, nhưng cũng chạy trên
      runner không cô lập dùng chung.
    - Mỗi phân mảnh `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false`
      từ cấu hình Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình Node
      con của Vitest để giảm dao động biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8
      nguyên bản.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` hiển thị những làn kiến trúc mà một diff kích hoạt.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck, hoặc kiểm thử.
    - Chạy `pnpm check:changed` rõ ràng trước khi bàn giao hoặc push khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các làn có phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      quyết định một chỉnh sửa harness, cấu hình, gói, hoặc hợp đồng thật sự cần
      độ bao phủ Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ cùng hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động co giãn worker cục bộ cố ý thận trọng và giảm tải
      khi load average của máy chủ đã cao, nên nhiều lần chạy Vitest đồng thời
      mặc định gây ít ảnh hưởng hơn.
    - Cấu hình Vitest cơ sở đánh dấu các tệp dự án/cấu hình là
      `forceRerunTriggers` để các lần chạy lại ở chế độ changed vẫn đúng khi
      dây nối kiểm thử thay đổi.
    - Cấu hình giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` được bật trên các
      máy chủ được hỗ trợ; đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache rõ ràng cho việc profiling trực tiếp.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cùng
      đầu ra phân tích import.
    - `pnpm test:perf:imports:changed` giới hạn cùng góc nhìn profiling đó vào
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian phân mảnh được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn bộ cấu hình dùng đường dẫn cấu hình làm khóa; các phân mảnh CI
      theo mẫu include thêm tên phân mảnh để các phân mảnh đã lọc có thể được theo dõi
      riêng.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho import lúc khởi động,
      hãy giữ các phụ thuộc nặng phía sau một seam `*.runtime.ts` cục bộ hẹp và
      mock seam đó trực tiếp thay vì deep-import helper runtime chỉ
      để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn dự án gốc native cho diff đã commit đó
      và in thời gian thực cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây làm việc
      hiện đang bẩn bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và cấu hình Vitest gốc.
    - `pnpm test:perf:profile:main` ghi một hồ sơ CPU luồng chính cho
      chi phí khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi hồ sơ CPU+heap của runner cho bộ
      unit với tính song song theo tệp bị tắt.

  </Accordion>
</AccordionGroup>

### Tính ổn định (gateway)

- Lệnh: `pnpm test:stability:gateway`
- Cấu hình: `vitest.gateway.config.ts`, bị ép dùng một worker
- Phạm vi:
  - Khởi động một Gateway local loopback thật với diagnostics được bật theo mặc định
  - Đẩy churn thông điệp gateway, bộ nhớ, và payload lớn tổng hợp qua đường dẫn sự kiện diagnostic
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các helper lưu bền gói diagnostic stability
  - Khẳng định recorder vẫn bị giới hạn, các mẫu RSS tổng hợp ở dưới ngân sách áp lực, và độ sâu hàng đợi theo phiên rút về không
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Làn hẹp cho theo dõi hồi quy ổn định, không phải thay thế cho toàn bộ bộ Gateway

### E2E (gateway smoke)

- Lệnh: `pnpm test:e2e`
- Cấu hình: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và kiểm thử E2E của plugin đi kèm dưới `extensions/`
- Mặc định runtime:
  - Dùng `threads` của Vitest với `isolate: false`, khớp với phần còn lại của repo.
  - Dùng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ im lặng để giảm chi phí I/O console.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để ép số worker (giới hạn ở 16).
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
  - Khởi động một gateway OpenShell cô lập trên máy chủ qua Docker
  - Tạo sandbox từ Dockerfile cục bộ tạm thời
  - Thực thi backend OpenShell của OpenClaw qua `sandbox ssh-config` + SSH exec thật
  - Xác minh hành vi hệ thống tệp remote-canonical qua cầu nối sandbox fs
- Kỳ vọng:
  - Chỉ chạy khi chọn tham gia; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cùng một Docker daemon hoạt động
  - Dùng `HOME` / `XDG_CONFIG_HOME` cô lập, rồi hủy gateway kiểm thử và sandbox
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới binary CLI hoặc script wrapper không mặc định

### Live (nhà cung cấp thật + mô hình thật)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và kiểm thử live của plugin đi kèm dưới `extensions/`
- Mặc định: **được bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - "Nhà cung cấp/mô hình này có thật sự hoạt động _hôm nay_ với thông tin đăng nhập thật không?"
  - Bắt thay đổi định dạng của nhà cung cấp, điểm kỳ lạ khi gọi tool, vấn đề xác thực, và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế không ổn định trong CI (mạng thật, chính sách nhà cung cấp thật, hạn mức, sự cố ngừng dịch vụ)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con đã thu hẹp thay vì "mọi thứ"
- Các lần chạy live source `~/.profile` để lấy các khóa API còn thiếu.
- Theo mặc định, các lần chạy live vẫn cô lập `HOME` và sao chép vật liệu cấu hình/xác thực vào một home kiểm thử tạm thời để fixture đơn vị không thể thay đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn chủ ý cần kiểm thử live dùng thư mục home thật của mình.
- `pnpm test:live` hiện mặc định dùng chế độ yên tĩnh hơn: nó giữ đầu ra tiến trình `[live] ...`, nhưng chặn thông báo `~/.profile` bổ sung và tắt tiếng log khởi động gateway/ồn ào Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn lấy lại toàn bộ log khởi động.
- Xoay vòng khóa API (theo từng nhà cung cấp): đặt `*_API_KEYS` với định dạng dấu phẩy/chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè theo từng live qua `OPENCLAW_LIVE_*_KEY`; kiểm thử thử lại khi gặp phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ live hiện phát dòng tiến trình ra stderr để các lệnh gọi nhà cung cấp dài vẫn hiển thị là đang hoạt động ngay cả khi capture console của Vitest đang yên lặng.
  - `vitest.live.config.ts` tắt chặn console của Vitest để các dòng tiến trình của nhà cung cấp/gateway stream ngay trong các lần chạy live.
  - Tinh chỉnh heartbeat mô hình trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Tinh chỉnh heartbeat gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ nào?

Dùng bảng quyết định này:

- Chỉnh sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn thay đổi nhiều)
- Chạm đến mạng Gateway / giao thức WS / ghép nối: thêm `pnpm test:e2e`
- Gỡ lỗi "bot của tôi bị ngừng hoạt động" / lỗi theo nhà cung cấp cụ thể / gọi công cụ: chạy `pnpm test:live` đã thu hẹp phạm vi

## Kiểm thử live (chạm đến mạng)

Đối với ma trận mô hình live, kiểm thử khói backend CLI, kiểm thử khói ACP, harness
máy chủ ứng dụng Codex, và tất cả kiểm thử live của nhà cung cấp media (Deepgram, BytePlus, ComfyUI, hình ảnh,
nhạc, video, harness media) - cùng với xử lý thông tin xác thực cho các lần chạy live - hãy xem
[Kiểm thử bộ live](/vi/help/testing-live). Đối với danh sách kiểm tra riêng cho cập nhật và
xác thực Plugin, hãy xem
[Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Trình chạy Docker (kiểm tra tùy chọn "hoạt động trên Linux")

Các trình chạy Docker này được chia thành hai nhóm:

- Trình chạy mô hình live: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp live theo khóa hồ sơ tương ứng của chúng bên trong image Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), mount thư mục cấu hình cục bộ và workspace của bạn (và nạp `~/.profile` nếu được mount). Các điểm vào cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Trình chạy live Docker mặc định dùng giới hạn kiểm thử khói nhỏ hơn để một lượt quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các biến môi trường đó khi bạn
  thực sự muốn lần quét toàn diện lớn hơn.
- `test:docker:all` xây dựng image Docker live một lần thông qua `test:docker:live-build`, đóng gói OpenClaw một lần thành tarball npm qua `scripts/package-openclaw-for-docker.mjs`, rồi xây dựng/tái sử dụng hai image `scripts/e2e/Dockerfile`. Image trần chỉ là trình chạy Node/Git cho các làn cài đặt/cập nhật/phụ thuộc Plugin; các làn đó mount tarball đã dựng sẵn. Image chức năng cài cùng tarball vào `/app` cho các làn chức năng ứng dụng đã dựng. Định nghĩa làn Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Tổng hợp này dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` điều khiển các slot tiến trình, trong khi giới hạn tài nguyên ngăn các làn live nặng, npm-install và đa dịch vụ cùng khởi động một lúc. Nếu một làn đơn lẻ nặng hơn các giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động làn đó khi pool trống rồi giữ làn đó chạy một mình cho đến khi lại có dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ tinh chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi máy chủ Docker có thêm dư địa. Trình chạy thực hiện kiểm tra trước Docker theo mặc định, xóa các container E2E OpenClaw cũ, in trạng thái mỗi 30 giây, lưu thời lượng các làn thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời lượng đó để khởi động các làn lâu hơn trước trong những lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in bản kê làn có trọng số mà không xây dựng hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các làn đã chọn, nhu cầu gói/image và thông tin xác thực.
- `Package Acceptance` là cổng kiểm định gói chạy nguyên bản trên GitHub cho câu hỏi "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một gói ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải gói đó lên dưới tên `package-under-test`, rồi chạy các làn E2E Docker có thể tái sử dụng đối với đúng tarball đó thay vì đóng gói lại ref đã chọn. Hồ sơ được sắp xếp theo độ rộng: `smoke`, `package`, `product`, và `full`. Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng gói/cập nhật/Plugin, ma trận tồn tại sau nâng cấp đã phát hành, mặc định phát hành và phân loại lỗi.
- Kiểm tra bản dựng và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Bộ bảo vệ đi qua đồ thị đã dựng tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và thất bại nếu khởi động trước điều phối nhập các phụ thuộc gói như Commander, giao diện lời nhắc, undici, hoặc ghi log trước khi điều phối lệnh; nó cũng giữ chunk chạy Gateway đã đóng gói trong ngân sách và từ chối nhập tĩnh các đường dẫn Gateway nguội đã biết. Kiểm thử khói CLI đã đóng gói cũng bao phủ trợ giúp gốc, trợ giúp onboard, trợ giúp doctor, trạng thái, schema cấu hình và lệnh liệt kê mô hình.
- Khả năng tương thích kế thừa của Chấp nhận gói được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Đến mốc giới hạn đó, harness chỉ dung thứ các khoảng trống metadata của gói đã phát hành: bỏ qua mục kiểm kê QA riêng tư, thiếu `gateway install --wrapper`, thiếu tệp vá trong fixture git lấy từ tarball, thiếu `update.channel` đã lưu, vị trí bản ghi cài đặt Plugin kế thừa, thiếu lưu bản ghi cài đặt marketplace, và di chuyển metadata cấu hình trong `plugins update`. Đối với các gói sau `2026.4.25`, những đường dẫn đó là lỗi nghiêm ngặt.
- Trình chạy kiểm thử khói container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.

Các trình chạy Docker mô hình live cũng chỉ bind-mount các thư mục home xác thực CLI cần thiết (hoặc tất cả thư mục được hỗ trợ khi lần chạy không bị thu hẹp), rồi sao chép chúng vào home của container trước khi chạy để OAuth của CLI bên ngoài có thể làm mới token mà không thay đổi kho xác thực của máy chủ:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (tập lệnh: `scripts/test-live-models-docker.sh`)
- Kiểm thử khói liên kết ACP: `pnpm test:docker:live-acp-bind` (tập lệnh: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với phạm vi Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử khói backend CLI: `pnpm test:docker:live-cli-backend` (tập lệnh: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử khói bộ kiểm thử app-server Codex: `pnpm test:docker:live-codex-harness` (tập lệnh: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + tác tử dev: `pnpm test:docker:live-gateway` (tập lệnh: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử khói khả năng quan sát: `pnpm qa:otel:smoke` là một luồng kiểm tra mã nguồn QA riêng tư. Nó cố ý không thuộc các luồng phát hành Docker của gói vì gói tar npm bỏ qua QA Lab.
- Kiểm thử khói trực tiếp Open WebUI: `pnpm test:docker:openwebui` (tập lệnh: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, dựng khung đầy đủ): `pnpm test:docker:onboard` (tập lệnh: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử khói onboarding/kênh/tác tử bằng gói tar npm: `pnpm test:docker:npm-onboard-channel-agent` cài đặt toàn cục gói tar OpenClaw đã đóng gói trong Docker, cấu hình OpenAI qua onboarding tham chiếu env cùng Telegram theo mặc định, chạy doctor, rồi chạy một lượt tác tử OpenAI được giả lập. Tái sử dụng gói tar dựng sẵn bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua việc dựng lại trên máy chủ bằng `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc đổi kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` hay `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Kiểm thử khói cài đặt Skill: `pnpm test:docker:skill-install` cài đặt toàn cục gói tar OpenClaw đã đóng gói trong Docker, tắt cài đặt kho lưu trữ tải lên trong cấu hình, phân giải slug Skills ClawHub trực tiếp hiện tại từ tìm kiếm, cài đặt bằng `openclaw skills install`, rồi xác minh Skills đã cài cùng siêu dữ liệu nguồn/khóa `.clawhub`.
- Kiểm thử khói chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt toàn cục gói tar OpenClaw đã đóng gói trong Docker, chuyển từ gói `stable` sang git `dev`, xác minh kênh đã lưu và Plugin hoạt động sau cập nhật, rồi chuyển lại về gói `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử khói sống sót sau nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt gói tar OpenClaw đã đóng gói lên trên một dữ liệu cố định người dùng cũ bẩn với tác tử, cấu hình kênh, danh sách cho phép Plugin, trạng thái phụ thuộc Plugin lỗi thời, cùng các tệp workspace/phiên hiện có. Nó chạy cập nhật gói cộng với doctor không tương tác mà không cần khóa nhà cung cấp trực tiếp hoặc kênh, sau đó khởi động một Gateway loopback và kiểm tra việc bảo toàn cấu hình/trạng thái cùng ngân sách khởi động/trạng thái.
- Kiểm thử khói sống sót sau nâng cấp đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, gieo các tệp người dùng hiện có thực tế, cấu hình baseline đó bằng một công thức lệnh dựng sẵn, xác thực cấu hình kết quả, cập nhật bản cài đặt đã phát hành đó lên gói tar ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway loopback và kiểm tra intent đã cấu hình, bảo toàn trạng thái, khởi động, `/healthz`, `/readyz`, và ngân sách trạng thái RPC. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các baseline cục bộ chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, và mở rộng các dữ liệu cố định theo dạng issue bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; tập reported-issues bao gồm `configured-plugin-installs` để tự động sửa cài đặt Plugin OpenClaw bên ngoài. Package Acceptance công khai các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, và `published_upgrade_survivor_scenarios`, phân giải các token baseline meta như `last-stable-4` hoặc `all-since-2026.4.23`, và Full Release Validation mở rộng cổng gói release-soak thành `last-stable-4 2026.4.23 2026.5.2 2026.4.15` cộng với `reported-issues`.
- Kiểm thử khói ngữ cảnh runtime của phiên: `pnpm test:docker:session-runtime-context` xác minh việc lưu giữ bản ghi ngữ cảnh runtime ẩn cùng sửa chữa doctor cho các nhánh ghi lại prompt bị trùng lặp bị ảnh hưởng.
- Kiểm thử khói cài đặt toàn cục Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một home cô lập, và xác minh `openclaw infer image providers --json` trả về các nhà cung cấp hình ảnh đi kèm thay vì bị treo. Tái sử dụng gói tar dựng sẵn bằng `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua việc dựng trên máy chủ bằng `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một ảnh Docker đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử khói Docker trình cài đặt: `bash scripts/test-install-sh-docker.sh` chia sẻ một cache npm giữa các container root, update và direct-npm của nó. Kiểm thử khói cập nhật mặc định dùng npm `latest` làm baseline ổn định trước khi nâng cấp lên gói tar ứng viên. Ghi đè bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` cục bộ, hoặc bằng input `update_baseline_version` của quy trình Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ một cache npm cô lập để các mục cache thuộc sở hữu root không che lấp hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để tái sử dụng cache root/update/direct-npm qua các lần chạy lại cục bộ.
- Install Smoke CI bỏ qua cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy tập lệnh cục bộ không có env đó khi cần phạm vi kiểm tra `npm install -g` trực tiếp.
- Kiểm thử khói CLI xóa workspace dùng chung của tác tử: `pnpm test:docker:agents-delete-shared-workspace` (tập lệnh: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng ảnh Dockerfile gốc, gieo hai tác tử với một workspace trong home container cô lập, chạy `agents delete --json`, rồi xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Tái sử dụng ảnh install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + tình trạng): `pnpm test:docker:gateway-network` (tập lệnh: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử khói snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (tập lệnh: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng ảnh E2E nguồn cộng với một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao phủ URL liên kết, mục có thể nhấp được nâng cấp theo con trỏ, tham chiếu iframe và siêu dữ liệu khung.
- Hồi quy reasoning tối thiểu cho OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (tập lệnh: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI giả lập qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, sau đó ép lược đồ nhà cung cấp từ chối và kiểm tra chi tiết thô xuất hiện trong nhật ký Gateway.
- Cầu nối kênh MCP (Gateway đã gieo + cầu nối stdio + kiểm thử khói khung thông báo Claude thô): `pnpm test:docker:mcp-channels` (tập lệnh: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP gói Pi (máy chủ MCP stdio thật + kiểm thử khói cho phép/từ chối hồ sơ Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (tập lệnh: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp Cron/subagent MCP (Gateway thật + teardown tiến trình con MCP stdio sau các lần chạy Cron cô lập và subagent một lần): `pnpm test:docker:cron-mcp-cleanup` (tập lệnh: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (kiểm thử khói cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc được hoist, ref git di động, bộ kitchen-sink ClawHub, cập nhật marketplace, và bật/kiểm tra gói Claude): `pnpm test:docker:plugins` (tập lệnh: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp gói/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Nếu không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, kiểm thử dùng máy chủ dữ liệu cố định ClawHub cục bộ khép kín.
- Kiểm thử khói cập nhật Plugin không đổi: `pnpm test:docker:plugin-update` (tập lệnh: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử khói ma trận vòng đời Plugin: `pnpm test:docker:plugin-lifecycle-matrix` cài đặt gói tar OpenClaw đã đóng gói trong một container trống, cài đặt một Plugin npm, bật/tắt, nâng cấp và hạ cấp nó qua một registry npm cục bộ, xóa mã đã cài, rồi xác minh gỡ cài đặt vẫn loại bỏ trạng thái lỗi thời trong khi ghi lại các chỉ số RSS/CPU cho từng giai đoạn vòng đời.
- Kiểm thử khói siêu dữ liệu tải lại cấu hình: `pnpm test:docker:config-reload` (tập lệnh: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` bao phủ kiểm thử khói cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc được hoist, ref git di động, dữ liệu cố định ClawHub, cập nhật marketplace, và bật/kiểm tra gói Claude. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không đổi cho Plugins đã cài. `pnpm test:docker:plugin-lifecycle-matrix` bao phủ cài đặt, bật, tắt, nâng cấp, hạ cấp Plugin npm có theo dõi tài nguyên, và gỡ cài đặt khi thiếu mã.

Để dựng trước và tái sử dụng ảnh chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè ảnh theo từng bộ kiểm thử như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một ảnh dùng chung từ xa, các tập lệnh sẽ pull ảnh đó nếu nó chưa có cục bộ. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi gói/cài đặt thay vì runtime ứng dụng đã dựng dùng chung.

Các runner Docker dành cho live-model cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Điều này giữ cho image runtime
gọn nhẹ trong khi vẫn chạy Vitest với đúng source/config cục bộ của bạn.
Bước staging bỏ qua các cache lớn chỉ dùng cục bộ và đầu ra build của ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục đầu ra `.build` cục bộ của ứng dụng hoặc
Gradle để các lần chạy live bằng Docker không tốn nhiều phút sao chép
artifact đặc thù theo máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các live probe của gateway không khởi động
các worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền cả
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi live của gateway
khỏi lane Docker đó.
`test:docker:openwebui` là một smoke tương thích ở cấp cao hơn: nó khởi động một
container gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI đã ghim phiên bản trỏ tới gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` expose `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Đặt `OPENWEBUI_SMOKE_MODE=models` cho các kiểm tra CI theo đường dẫn release cần dừng
sau bước đăng nhập Open WebUI và khám phá model, mà không chờ hoàn tất live model.
Lần chạy đầu tiên có thể chậm hơn đáng kể vì Docker có thể cần pull image
Open WebUI và Open WebUI có thể cần hoàn tất phần thiết lập cold-start của chính nó.
Lane này yêu cầu một key live model dùng được, và `OPENCLAW_PROFILE_FILE`
(mặc định là `~/.profile`) là cách chính để cung cấp key đó trong các lần chạy Docker hóa.
Các lần chạy thành công in một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính xác định và không cần một
tài khoản Telegram, Discord, hoặc iMessage thật. Nó khởi động một container Gateway
đã seed dữ liệu, khởi động một container thứ hai sinh ra `openclaw mcp serve`, rồi
xác minh khám phá hội thoại đã route, đọc transcript, metadata attachment,
hành vi hàng đợi sự kiện live, route gửi outbound, và thông báo kênh kiểu Claude +
quyền qua cầu nối stdio MCP thật. Kiểm tra thông báo
kiểm tra trực tiếp các frame stdio MCP thô để smoke xác thực những gì
cầu nối thật sự phát ra, không chỉ những gì một SDK client cụ thể tình cờ expose.
`test:docker:pi-bundle-mcp-tools` có tính xác định và không cần key live
model. Nó build image Docker của repo, khởi động một server probe stdio MCP thật
bên trong container, hiện thực hóa server đó thông qua runtime MCP của Pi bundle
nhúng sẵn, thực thi tool, rồi xác minh `coding` và `messaging` giữ lại
các tool `bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần key live model.
Nó khởi động một Gateway đã seed dữ liệu với một server probe stdio MCP thật, chạy một
turn cron cô lập và một turn con one-shot `/subagents spawn`, rồi xác minh
tiến trình con MCP thoát sau mỗi lần chạy.

Smoke thủ công cho thread ACP bằng ngôn ngữ tự nhiên (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow hồi quy/gỡ lỗi. Có thể sẽ cần lại nó để xác thực route thread ACP, vì vậy đừng xóa nó.

Các env var hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các env var được source từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục config/workspace tạm thời và không mount auth CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các bản cài CLI đã cache bên trong Docker
- Các thư mục/tệp auth CLI bên ngoài dưới `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi test bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy provider đã thu hẹp chỉ mount những thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc một danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc provider trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để tái sử dụng image `openclaw:local-live` hiện có cho các lần chạy lại không cần rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo thông tin xác thực đến từ profile store (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn model được gateway expose cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce được smoke Open WebUI sử dụng
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã ghim

## Kiểm tra tài liệu cơ bản

Chạy kiểm tra tài liệu sau khi chỉnh sửa doc: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra heading trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy offline (an toàn cho CI)

Đây là các hồi quy "pipeline thật" không dùng provider thật:

- Gọi tool qua Gateway (mock OpenAI, gateway thật + vòng lặp agent): `src/gateway/gateway.test.ts` (trường hợp: "chạy một lệnh gọi tool OpenAI mock end-to-end qua vòng lặp agent của gateway")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, ghi config + áp dụng auth): `src/gateway/gateway.test.ts` (trường hợp: "chạy wizard qua ws và ghi config token auth")

## Đánh giá độ tin cậy agent (Skills)

Chúng ta đã có một vài test an toàn cho CI hoạt động giống như "đánh giá độ tin cậy agent":

- Gọi tool mock qua gateway thật + vòng lặp agent (`src/gateway/gateway.test.ts`).
- Các flow wizard end-to-end xác thực wiring session và hiệu ứng config (`src/gateway/gateway.test.ts`).

Những phần vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi dùng và làm theo các bước/args bắt buộc không?
- **Hợp đồng workflow:** các kịch bản nhiều turn xác nhận thứ tự tool, việc giữ lịch sử session, và ranh giới sandbox.

Các eval trong tương lai trước hết nên duy trì tính xác định:

- Một scenario runner dùng provider mock để xác nhận lệnh gọi tool + thứ tự, việc đọc tệp skill, và wiring session.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng so với tránh, gating, prompt injection).
- Các live eval tùy chọn (opt-in, được gate bằng env) chỉ sau khi bộ an toàn cho CI đã có sẵn.

## Test hợp đồng (hình dạng plugin và kênh)

Test hợp đồng xác minh rằng mọi plugin và kênh đã đăng ký tuân thủ
hợp đồng interface của nó. Chúng lặp qua tất cả plugin được phát hiện và chạy một bộ
assertion về hình dạng và hành vi. Lane unit `pnpm test` mặc định cố ý
bỏ qua các tệp smoke và seam dùng chung này; chạy rõ ràng các lệnh hợp đồng
khi bạn chạm vào các bề mặt kênh hoặc provider dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng provider: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng plugin cơ bản (id, tên, capability)
- **setup** - Hợp đồng setup wizard
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
- **registry** - Hình dạng registry plugin

### Hợp đồng provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng flow auth
- **auth-choice** - Lựa chọn/chọn auth
- **catalog** - API catalog model
- **discovery** - Khám phá plugin
- **loader** - Tải plugin
- **runtime** - Runtime provider
- **shape** - Hình dạng/interface plugin
- **wizard** - Setup wizard

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc chỉnh sửa một plugin kênh hoặc provider
- Sau khi refactor đăng ký hoặc khám phá plugin

Test hợp đồng chạy trong CI và không yêu cầu API key thật.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề provider/model được phát hiện trong live:

- Thêm một hồi quy an toàn cho CI nếu có thể (provider mock/stub, hoặc capture chính xác phép biến đổi hình dạng request)
- Nếu nó vốn chỉ có thể kiểm tra live (rate limit, chính sách auth), hãy giữ live test hẹp và opt-in qua env var
- Ưu tiên nhắm vào lớp nhỏ nhất bắt được lỗi:
  - lỗi chuyển đổi/replay request của provider → test model trực tiếp
  - lỗi pipeline gateway session/history/tool → smoke live gateway hoặc test mock gateway an toàn cho CI
- Guardrail duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` lấy một target được lấy mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi xác nhận exec id có traversal segment bị từ chối.
  - Nếu bạn thêm một họ target SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong test đó. Test cố ý thất bại với các target id chưa được phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Kiểm thử live](/vi/help/testing-live)
- [Kiểm thử cập nhật và plugin](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
