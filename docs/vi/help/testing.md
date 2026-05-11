---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm kiểm thử hồi quy cho lỗi mô hình/nhà cung cấp
    - Gỡ lỗi Gateway + hành vi của tác nhân
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử unit/e2e/live, trình chạy Docker và phạm vi bao phủ của từng kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-05-11T20:32:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (unit/integration, e2e, live) và một nhóm nhỏ
các Docker runner. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ kiểm thử bao phủ những gì (và những gì nó cố ý _không_ bao phủ).
- Lệnh nào cần chạy cho các quy trình phổ biến (cục bộ, trước khi đẩy, gỡ lỗi).
- Cách kiểm thử live phát hiện thông tin xác thực và chọn mô hình/nhà cung cấp.
- Cách thêm hồi quy cho các sự cố mô hình/nhà cung cấp trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các lane truyền tải live)** được ghi tài liệu riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) - kiến trúc, bề mặt lệnh, cách soạn kịch bản.
- [QA Ma trận](/vi/concepts/qa-matrix) - tài liệu tham chiếu cho `pnpm openclaw qa matrix`.
- [Kênh QA](/vi/channels/qa-channel) - Plugin truyền tải tổng hợp được dùng bởi các kịch bản dựa trên repo.

Trang này bao phủ việc chạy các bộ kiểm thử thông thường và Docker/Parallels runner. Mục runner dành riêng cho QA bên dưới ([Runner dành riêng cho QA](#qa-specific-runners)) liệt kê các lệnh gọi `qa` cụ thể và trỏ lại các tài liệu tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng kiểm tra đầy đủ (được kỳ vọng trước khi đẩy): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy dư tài nguyên: `pnpm test:max`
- Vòng lặp watch Vitest trực tiếp: `pnpm test:watch`
- Nhắm mục tiêu tệp trực tiếp giờ cũng định tuyến các đường dẫn extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên các lượt chạy có mục tiêu trước khi bạn đang lặp trên một lỗi duy nhất.
- Trang QA dựa trên Docker: `pnpm qa:lab:up`
- Lane QA dựa trên VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng coverage: `pnpm test:coverage`
- Bộ kiểm thử E2E: `pnpm test:e2e`

Khi gỡ lỗi nhà cung cấp/mô hình thực (yêu cầu thông tin xác thực thật):

- Bộ live (mô hình + các probe công cụ/hình ảnh của Gateway): `pnpm test:live`
- Nhắm mục tiêu một tệp live trong chế độ yên lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng runtime: dispatch `OpenClaw Performance` với
  `live_gpt54=true` cho một lượt agent `openai/gpt-5.4` thật hoặc
  `deep_profile=true` cho các artifact CPU/heap/trace của Kova. Các lượt chạy theo lịch hằng ngày
  xuất bản artifact của các lane mock-provider, deep-profile và GPT 5.4 lên
  `openclaw/clawgrit-reports` khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình. Báo cáo
  mock-provider cũng bao gồm số liệu ở cấp nguồn cho khởi động Gateway, bộ nhớ,
  áp lực Plugin, vòng lặp hello fake-model lặp lại và khởi động CLI.
- Quét mô hình live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi mô hình được chọn giờ chạy một lượt văn bản cộng với một probe nhỏ kiểu đọc tệp.
    Các mô hình có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các probe bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi nhà cung cấp.
  - Phạm vi CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận mô hình live Docker riêng
    được chia shard theo nhà cung cấp.
  - Để chạy lại CI có trọng tâm, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm secret nhà cung cấp tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các caller
    theo lịch/phát hành của nó.
- Smoke trò chuyện ràng buộc Codex native: `pnpm test:docker:live-codex-bind`
  - Chạy một lane live Docker trên đường dẫn app-server Codex, ràng buộc một
    Slack DM tổng hợp bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi thường và một tệp đính kèm hình ảnh
    đi qua ràng buộc Plugin native thay vì ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt agent Gateway qua harness app-server Codex do Plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và theo mặc định thực thi các probe hình ảnh,
    cron MCP, sub-agent và Guardian. Tắt probe sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi khác của
    app-server Codex. Để kiểm tra sub-agent có trọng tâm, hãy tắt các probe khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Lệnh này thoát sau probe sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Smoke cài đặt Codex theo yêu cầu: `pnpm test:docker:codex-on-demand`
  - Cài đặt tarball OpenClaw đã đóng gói trong Docker, chạy onboarding bằng OpenAI API-key,
    và xác minh Plugin Codex cùng dependency `@openai/codex`
    đã được tải xuống npm root được quản lý theo yêu cầu.
- Smoke dependency công cụ Plugin live: `pnpm test:docker:live-plugin-tool`
  - Đóng gói một Plugin fixture với dependency `slugify` thật, cài đặt nó thông qua
    `npm-pack:`, xác minh dependency dưới npm root được quản lý, rồi yêu cầu một
    mô hình OpenAI live gọi công cụ Plugin và trả về slug ẩn.
- Smoke lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra opt-in belt-and-suspenders cho bề mặt lệnh cứu hộ kênh tin nhắn.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi mô hình bền vững,
    trả lời `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong container không có config với Claude CLI giả trên `PATH`
    và xác minh fallback planner mờ được dịch thành một lần ghi config đã audit và có kiểu.
- Smoke Docker lần chạy đầu của Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, định tuyến `openclaw` trần tới
    Crestodian, áp dụng các lần ghi setup/model/agent/Plugin Discord + SecretRef,
    xác thực config và xác minh các mục audit. Cùng đường dẫn thiết lập Ring 0 này
    cũng được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một lượt tách biệt
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  trên `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và bản ghi assistant lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một trường hợp lỗi, hãy ưu tiên thu hẹp kiểm thử live bằng các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Runner dành riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần tính thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. Tính tương đương agentic được lồng dưới
`QA-Lab - All Lanes` và xác thực phát hành, không phải một workflow PR độc lập.
Xác thực rộng nên dùng `Full Release Validation` với
`rerun_group=qa-parity` hoặc nhóm QA của release-checks. Các kiểm tra phát hành ổn định/mặc định
giữ soak live/Docker toàn diện phía sau `run_release_soak=true`; profile
`full` buộc bật soak. `QA-Lab - All Lanes`
chạy hằng đêm trên `main` và từ dispatch thủ công với lane tương đương mock, lane
Matrix live, lane Telegram live do Convex quản lý, và lane Discord live do Convex quản lý
dưới dạng các job song song. QA theo lịch và kiểm tra phát hành truyền Matrix
`--profile fast` một cách tường minh, trong khi CLI Matrix và đầu vào workflow thủ công
mặc định vẫn là `all`; dispatch thủ công có thể chia shard `all` thành các job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`. `OpenClaw Release
Checks` chạy tính tương đương cộng với các lane Matrix nhanh và Telegram trước khi phê duyệt
phát hành, dùng `mock-openai/gpt-5.5` cho kiểm tra truyền tải phát hành để chúng
có tính xác định và tránh khởi động provider-plugin thông thường. Các Gateway truyền tải live này
tắt tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ tương đương QA.

Các shard media live của phát hành đầy đủ dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard mô hình/backend live Docker dùng image chia sẻ
`ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi commit được chọn,
rồi kéo image đó bằng `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì build lại
trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy các kịch bản QA được hậu thuẫn bởi repo trực tiếp trên máy chủ.
  - Theo mặc định, chạy song song nhiều kịch bản đã chọn với các worker
    gateway cô lập. `qa-channel` mặc định concurrency là 4 (bị giới hạn bởi
    số lượng kịch bản đã chọn). Dùng `--concurrency <count>` để tinh chỉnh số
    worker, hoặc `--concurrency 1` cho lane tuần tự cũ hơn.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Hỗ trợ các chế độ provider `live-frontier`, `mock-openai`, và `aimock`.
    `aimock` khởi động một server provider cục bộ được hậu thuẫn bởi AIMock cho
    coverage fixture và protocol-mock thử nghiệm mà không thay thế lane
    `mock-openai` nhận biết kịch bản.
- `pnpm test:plugins:kitchen-sink-live`
  - Chạy gauntlet Plugin OpenAI Kitchen Sink trực tiếp qua QA Lab. Nó
    cài đặt gói Kitchen Sink bên ngoài, xác minh inventory bề mặt plugin SDK,
    thăm dò `/healthz` và `/readyz`, ghi lại bằng chứng CPU/RSS của Gateway,
    chạy một lượt OpenAI trực tiếp, và kiểm tra chẩn đoán đối kháng.
    Yêu cầu xác thực OpenAI trực tiếp như `OPENAI_API_KEY`. Trong các phiên Testbox
    đã được hydrate, nó tự động source hồ sơ live-auth của Testbox khi có helper
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy benchmark khởi động Gateway cùng một gói nhỏ các kịch bản QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi bản tóm tắt quan sát CPU kết hợp
    vào `.artifacts/gateway-cpu-scenarios/`.
  - Theo mặc định chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cùng `--hot-wall-warn-ms`), nên các đợt tăng ngắn khi khởi động được ghi
    như metric mà không trông giống hồi quy Gateway ghim CPU kéo dài nhiều phút.
  - Dùng artifact `dist` đã build; hãy chạy build trước khi checkout chưa có
    output runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA bên trong một VM Linux Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên máy chủ.
  - Tái sử dụng cùng các cờ chọn provider/model như `qa suite`.
  - Các lần chạy trực tiếp chuyển tiếp những input xác thực QA được hỗ trợ và thực tế cho guest:
    khóa provider dựa trên env, đường dẫn cấu hình provider trực tiếp của QA, và `CODEX_HOME`
    khi có.
  - Thư mục output phải nằm dưới gốc repo để guest có thể ghi ngược qua
    workspace đã mount.
  - Ghi báo cáo QA + tóm tắt thông thường cùng log Multipass dưới
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA được hậu thuẫn bởi Docker cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt toàn cục trong
    Docker, chạy onboarding khóa API OpenAI không tương tác, cấu hình Telegram
    theo mặc định, xác minh runtime Plugin đã đóng gói tải được mà không cần
    sửa dependency lúc khởi động, chạy doctor, và chạy một lượt agent cục bộ
    với endpoint OpenAI được mock.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane packaged-install
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một smoke Docker ứng dụng đã build có tính xác định cho transcript
    ngữ cảnh runtime nhúng. Nó xác minh ngữ cảnh runtime OpenClaw ẩn được lưu
    dưới dạng thông điệp tùy chỉnh không hiển thị thay vì rò rỉ vào lượt người dùng
    nhìn thấy được, sau đó seed một JSONL phiên bị hỏng chịu ảnh hưởng và xác minh
    `openclaw doctor --fix` ghi lại nó sang nhánh active với một bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một candidate gói OpenClaw trong Docker, chạy onboarding gói đã cài,
    cấu hình Telegram qua CLI đã cài, rồi tái sử dụng lane QA Telegram trực tiếp
    với gói đã cài đó làm Gateway SUT.
  - Wrapper chỉ mount source harness `qa-lab` từ checkout; gói đã cài sở hữu
    `dist`, `openclaw/plugin-sdk`, và runtime Plugin đi kèm để lane không trộn
    các Plugin từ checkout hiện tại vào gói đang được kiểm thử.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã resolve thay vì
    cài đặt từ registry.
  - Dùng cùng thông tin xác thực env Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/release, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cùng
    `OPENCLAW_QA_CONVEX_SITE_URL` và role secret. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một Convex role secret có trong CI,
    wrapper Docker tự động chọn Convex.
  - Wrapper xác thực env thông tin xác thực Telegram hoặc Convex trên máy chủ trước
    công việc build/cài đặt Docker. Chỉ đặt `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    khi cố ý debug thiết lập trước thông tin xác thực.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này.
  - GitHub Actions hiển thị lane này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Workflow dùng môi trường
    `qa-live-shared` và các lease thông tin xác thực CI Convex.
- GitHub Actions cũng hiển thị `Package Acceptance` cho bằng chứng sản phẩm chạy bên cạnh
  trên một gói candidate. Nó chấp nhận một ref đáng tin cậy, spec npm đã phát hành,
  URL tarball HTTPS cùng SHA-256, hoặc artifact tarball từ một lần chạy khác, upload
  `openclaw-current.tgz` đã chuẩn hóa dưới tên `package-under-test`, rồi chạy
  scheduler Docker E2E hiện có với các hồ sơ lane smoke, package, product, full, hoặc custom.
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
    với OpenAI đã cấu hình, rồi bật các kênh/Plugin đi kèm qua chỉnh sửa cấu hình.
  - Xác minh discovery thiết lập để vắng mặt các Plugin có thể tải xuống chưa cấu hình,
    lần sửa doctor đầu tiên đã cấu hình sẽ cài đặt rõ ràng từng Plugin có thể tải xuống
    bị thiếu, và lần khởi động lại thứ hai không chạy sửa dependency ẩn.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của
    candidate dọn dẹp phần thừa dependency Plugin cũ mà không có
    sửa postinstall phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật cài đặt gói native trên các guest Parallels. Mỗi
    nền tảng được chọn trước tiên cài đặt gói baseline được yêu cầu, sau đó chạy
    lệnh `openclaw update` đã cài trong cùng guest và xác minh phiên bản đã cài,
    trạng thái cập nhật, độ sẵn sàng của Gateway, và một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một guest. Dùng `--json` cho đường dẫn artifact tóm tắt và
    trạng thái từng lane.
  - Lane OpenAI dùng `openai/gpt-5.5` cho bằng chứng lượt agent trực tiếp theo
    mặc định. Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi cố ý xác thực một model OpenAI khác.
  - Bọc các lần chạy cục bộ dài trong timeout của máy chủ để các lần kẹt transport Parallels
    không tiêu tốn phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi các log lane lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi giả định wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong công việc doctor sau cập nhật
    và cập nhật package trên một guest lạnh; điều đó vẫn lành mạnh khi log debug npm
    lồng nhau đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với các lane smoke Parallels
    macOS, Windows, hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể va chạm khi
    khôi phục snapshot, phục vụ package, hoặc trạng thái Gateway của guest.
  - Bằng chứng sau cập nhật chạy bề mặt Plugin đi kèm thông thường vì
    các facade capability như speech, tạo ảnh, và hiểu media
    được tải qua API runtime đi kèm ngay cả khi bản thân lượt agent
    chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động server provider AIMock cục bộ cho kiểm thử smoke protocol
    trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy lane QA Matrix trực tiếp với một homeserver Tuwunel dùng một lần được hậu thuẫn bởi Docker. Chỉ source-checkout - các bản cài đặt đóng gói không ship `qa-lab`.
  - CLI đầy đủ, catalog hồ sơ/kịch bản, env var, và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy lane QA Telegram trực tiếp với một nhóm riêng tư thật bằng token bot driver và SUT từ env.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID nhóm phải là ID chat Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực dùng chung theo pool. Dùng chế độ env theo mặc định, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng lease theo pool.
  - Mặc định bao phủ canary, cổng mention, định địa chỉ lệnh, `/status`, trả lời được mention giữa bot với bot, và trả lời lệnh native cốt lõi. Mặc định `mock-openai` cũng bao phủ các hồi quy reply-chain có tính xác định và streaming final-message Telegram. Dùng `--list-scenarios` cho các probe tùy chọn như `session_status`.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng một nhóm riêng tư, với bot SUT hiển thị username Telegram.
  - Để quan sát ổn định giữa bot với bot, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và đảm bảo bot driver có thể quan sát traffic bot trong nhóm.
  - Ghi báo cáo QA Telegram, tóm tắt, và artifact observed-messages dưới `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT quan sát được.

`Mantis Telegram Live` là wrapper bằng chứng PR quanh lane này. Nó chạy
candidate ref với thông tin xác thực Telegram được Convex lease, render transcript
observed-message đã biên tập trong trình duyệt desktop Crabbox, ghi bằng chứng MP4,
tạo GIF đã cắt theo chuyển động, upload bundle artifact, và đăng bằng chứng PR inline
qua Mantis GitHub App khi `pr_number` được đặt. Maintainer có thể
khởi động từ UI Actions qua `Mantis Scenario` (`scenario_id:
telegram-live`) hoặc trực tiếp từ bình luận pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` là wrapper Telegram Desktop native có tính agent
trước/sau cho bằng chứng trực quan của PR. Khởi động từ UI Actions với
`instructions` tự do, qua `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), hoặc từ bình luận PR:

```text
@Mantis telegram desktop proof
```

Tác tử Mantis đọc PR, quyết định hành vi hiển thị trên Telegram nào chứng minh được
thay đổi, chạy làn kiểm chứng Crabbox Telegram Desktop bằng người dùng thật trên ref baseline và
candidate, lặp lại cho đến khi các GIF gốc hữu ích, ghi một manifest
`motionPreview` theo cặp, và đăng cùng bảng GIF 2 cột thông qua
Mantis GitHub App khi `pr_number` được đặt.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Thuê hoặc tái sử dụng một desktop Linux Crabbox, cài đặt Telegram Desktop gốc, cấu hình OpenClaw với token bot SUT Telegram được thuê, khởi động Gateway, và ghi lại bằng chứng ảnh chụp màn hình/MP4 từ desktop VNC đang hiển thị.
  - Mặc định dùng `--credential-source convex` để workflow chỉ cần secret broker Convex. Dùng `--credential-source env` với cùng các biến `OPENCLAW_QA_TELEGRAM_*` như `pnpm openclaw qa telegram`.
  - Telegram Desktop vẫn cần một hồ sơ/phiên đăng nhập người dùng. Token bot chỉ cấu hình OpenClaw. Dùng `--telegram-profile-archive-env <name>` cho kho lưu trữ hồ sơ `.tgz` base64, hoặc dùng `--keep-lease` và đăng nhập thủ công qua VNC một lần.
  - Ghi `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, và `telegram-desktop-builder.mp4` dưới thư mục đầu ra.

Các làn truyền tải trực tiếp dùng chung một hợp đồng chuẩn để các phương thức truyền tải mới không bị lệch; ma trận phạm vi theo từng làn nằm trong [Tổng quan QA → Phạm vi truyền tải trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ kiểm thử tổng hợp rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) được bật cho
QA truyền tải trực tiếp, QA lab nhận một lease độc quyền từ pool được hậu thuẫn bởi Convex, Heartbeat
lease đó trong khi làn đang chạy, và giải phóng lease khi tắt. Tên mục này có trước
hỗ trợ Discord, Slack, và WhatsApp; hợp đồng lease được dùng chung trên các loại.

Scaffold dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Biến môi trường bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho vai trò đã chọn:
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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id truy vết tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex loopback `http://` chỉ dành cho phát triển cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong vận hành thông thường.

Các lệnh quản trị của maintainer (thêm/xóa/liệt kê pool) yêu cầu riêng
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Trình trợ giúp CLI cho maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lần chạy trực tiếp để kiểm tra URL site Convex, secret broker,
tiền tố endpoint, thời gian chờ HTTP, và khả năng truy cập admin/list mà không in
giá trị secret. Dùng `--json` để có đầu ra máy đọc được trong script và tiện ích CI.

Hợp đồng endpoint mặc định (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Yêu cầu: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Thành công: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Hết tài nguyên/có thể thử lại: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - Chặn lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ secret maintainer)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Dạng payload cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi id cuộc trò chuyện Telegram dạng số.
- `admin/add` xác thực dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

Dạng payload cho loại người dùng thật Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, và `telegramApiId` phải là chuỗi số.
- `tdlibArchiveSha256` và `desktopTdataArchiveSha256` phải là chuỗi hex SHA-256.
- `kind: "telegram-user"` đại diện cho một tài khoản burner Telegram. Xem lease là phạm vi toàn tài khoản: trình điều khiển CLI TDLib và nhân chứng trực quan Telegram Desktop khôi phục từ cùng payload, và mỗi lần chỉ một job được giữ lease.

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

Dùng hồ sơ Desktop đã khôi phục với `Telegram -workdir "$tmp/desktop"` khi cần bản ghi trực quan. Trong môi trường operator cục bộ, `scripts/e2e/telegram-user-credential.ts` đọc `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` theo mặc định nếu biến env của tiến trình không có.

Phiên Crabbox do tác tử điều khiển:

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
TDLib và Telegram Desktop trên một desktop Linux Crabbox, khởi động Gateway SUT mock cục bộ
từ checkout hiện tại, mở cuộc trò chuyện Telegram đang hiển thị, bắt đầu
ghi desktop, và ghi `session.json` riêng tư. Khi phiên còn sống,
một tác tử có thể tiếp tục kiểm thử cho đến khi hài lòng:

- `send --session <file> --text <message>` gửi qua người dùng TDLib thật và chờ phản hồi SUT.
- `run --session <file> -- <remote command>` chạy một lệnh tùy ý trên Crabbox và lưu đầu ra của lệnh đó, ví dụ `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` chụp desktop đang hiển thị hiện tại.
- `status --session <file>` in lease và lệnh WebVNC.
- `finish --session <file>` dừng bộ ghi, chụp ảnh chụp màn hình/video/artifact cắt theo chuyển động, giải phóng thông tin xác thực Convex, dừng các tiến trình SUT cục bộ, và dừng lease Crabbox trừ khi truyền `--keep-box`.
- `publish --session <file> --pr <number>` mặc định xuất bản bình luận PR chỉ có GIF. Chỉ truyền `--full-artifacts` khi cố ý cần log hoặc artifact JSON.

Để tái hiện trực quan có tính xác định, truyền `--mock-response-file <path>` cho `start`
hoặc cho lối tắt một lệnh `probe`. Runner mặc định dùng một lớp
Crabbox chuẩn, ghi 24fps, bản xem trước GIF chuyển động 24fps, và độ rộng GIF
1920px. Chỉ ghi đè bằng `--class`, `--record-fps`, `--preview-fps`, và
`--preview-width` khi bằng chứng cần cài đặt ghi khác.

Bằng chứng Crabbox một lệnh:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Lệnh `probe` mặc định là lối tắt cho một chu kỳ start/send/finish. Dùng
nó cho smoke nhanh `/status`. Dùng các lệnh phiên cho đánh giá PR,
công việc tái hiện lỗi, hoặc bất kỳ trường hợp nào tác tử cần vài phút
thử nghiệm tùy ý trước khi quyết định bằng chứng đã hoàn tất. Dùng `--id <cbx_...>` để
tái sử dụng một lease desktop đã sẵn sàng, `--keep-box` để giữ VNC mở sau khi finish,
`--desktop-chat-title <name>` để chọn cuộc trò chuyện hiển thị, và `--tdlib-url <tgz>`
khi dùng kho lưu trữ `libtdjson.so` Linux dựng sẵn thay vì xây dựng TDLib trên
một box mới. Runner xác minh `--tdlib-url` bằng `--tdlib-sha256 <hex>` hoặc,
theo mặc định, một tệp cùng cấp `<url>.sha256`.

Payload đa kênh được broker xác thực:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Các làn Slack cũng có thể thuê từ pool, nhưng xác thực payload Slack hiện
nằm trong runner QA Slack thay vì broker. Dùng
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
cho các hàng Slack.

### Thêm một kênh vào QA

Kiến trúc và tên trình trợ giúp kịch bản cho adapter kênh mới nằm trong [Tổng quan QA → Thêm một kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai runner truyền tải trên seam host `qa-lab` dùng chung, khai báo `qaRunners` trong manifest Plugin, mount dưới dạng `openclaw qa <runner>`, và viết kịch bản dưới `qa/scenarios/`.

## Bộ kiểm thử (chạy ở đâu)

Hãy xem các bộ kiểm thử là "độ chân thực tăng dần" (và độ bất ổn/chi phí cũng tăng dần):

### Unit / integration (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng bộ shard `vitest.full-*.config.ts` và có thể mở rộng shard đa dự án thành cấu hình theo từng dự án để lập lịch song song
- Tệp: inventory core/unit dưới `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử unit UI chạy trong shard chuyên dụng `unit-ui`
- Phạm vi:
  - Kiểm thử unit thuần
  - Kiểm thử integration trong tiến trình (xác thực Gateway, định tuyến, công cụ, phân tích cú pháp, cấu hình)
  - Hồi quy có tính xác định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không yêu cầu khóa thật
  - Nên nhanh và ổn định
  - Các kiểm thử resolver và loader bề mặt công khai phải chứng minh hành vi fallback rộng của `api.js` và
    `runtime-api.js` bằng fixture Plugin nhỏ được tạo ra, không phải
    API nguồn của Plugin được đóng gói thật. Tải API Plugin thật thuộc về
    các bộ kiểm thử hợp đồng/integration do Plugin sở hữu.

Chính sách dependency gốc:

- Bản cài đặt kiểm thử mặc định bỏ qua các bản dựng opus Discord native tùy chọn. Nhận giọng nói Discord dùng bộ giải mã `opusscript` pure-JS, và `@discordjs/opus` vẫn bị vô hiệu hóa trong `allowBuilds` để các bài kiểm thử cục bộ và làn Testbox không biên dịch addon native.
- Dùng một làn hiệu năng giọng nói Discord hoặc làn live chuyên dụng nếu bạn chủ ý cần so sánh một bản dựng opus native. Không đặt `@discordjs/opus` thành `true` trong `allowBuilds` mặc định; điều đó khiến các vòng lặp cài đặt/kiểm thử không liên quan phải biên dịch mã native.

<AccordionGroup>
  <Accordion title="Dự án, shard và làn có phạm vi">

    - `pnpm test` không nhắm mục tiêu chạy mười hai cấu hình shard nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình native root-project khổng lồ. Điều này giảm RSS đỉnh trên các máy đang tải nặng và tránh để công việc auto-reply/extension làm đói các bộ kiểm thử không liên quan.
    - `pnpm test --watch` vẫn dùng đồ thị dự án root `vitest.config.ts` native, vì vòng lặp watch đa shard không thực tế.
    - `pnpm test`, `pnpm test:watch` và `pnpm test:perf:imports` định tuyến các mục tiêu tệp/thư mục rõ ràng qua các làn có phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả toàn bộ chi phí khởi động dự án root.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các làn có phạm vi rẻ: chỉnh sửa kiểm thử trực tiếp, các tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng và các phụ thuộc đồ thị import cục bộ. Chỉnh sửa config/setup/package không chạy kiểm thử rộng trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường cho công việc hẹp. Nó phân loại diff thành core, kiểm thử core, extensions, kiểm thử extension, apps, docs, metadata phát hành, tooling Docker live và tooling, rồi chạy các lệnh typecheck, lint và guard tương ứng. Nó không chạy kiểm thử Vitest; gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các lần tăng phiên bản chỉ metadata phát hành chạy các kiểm tra phiên bản/config/root-dependency có mục tiêu, với một guard từ chối thay đổi package ngoài trường phiên bản cấp cao nhất.
    - Chỉnh sửa harness Live Docker ACP chạy các kiểm tra tập trung: cú pháp shell cho script xác thực live Docker và dry-run bộ lập lịch live Docker. Các thay đổi `package.json` chỉ được bao gồm khi diff giới hạn trong `scripts["test:docker:live-*"]`; dependency, export, version và các chỉnh sửa bề mặt package khác vẫn dùng các guard rộng hơn.
    - Kiểm thử unit nhẹ về import từ agents, commands, plugins, helper auto-reply, `plugin-sdk` và các khu vực tiện ích pure tương tự được định tuyến qua làn `unit-fast`, làn này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng runtime vẫn ở các làn hiện có.
    - Một số tệp nguồn helper `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy changed-mode tới các kiểm thử cùng cấp rõ ràng trong các làn nhẹ đó, nên chỉnh sửa helper tránh chạy lại toàn bộ bộ kiểm thử nặng cho thư mục đó.
    - `auto-reply` có các bucket riêng cho helper core cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất và cây con `src/auto-reply/reply/**`. CI còn tách cây con reply thành các shard agent-runner, dispatch và commands/state-routing để một bucket nặng import không sở hữu toàn bộ phần đuôi Node.
    - CI PR/main thông thường chủ ý bỏ qua lượt quét batch extension và shard `agentic-plugins` chỉ dành cho phát hành. Full Release Validation dispatch workflow con `Plugin Prerelease` riêng cho các bộ kiểm thử nặng plugin/extension đó trên các release candidate.

  </Accordion>

  <Accordion title="Phạm vi bao phủ runner nhúng">

    - Khi bạn thay đổi đầu vào khám phá message-tool hoặc ngữ cảnh runtime
      compaction, hãy giữ cả hai cấp độ bao phủ.
    - Thêm các regression helper tập trung cho các ranh giới định tuyến và
      chuẩn hóa thuần túy.
    - Giữ các bộ kiểm thử tích hợp runner nhúng ở trạng thái khỏe:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, và
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ này xác minh rằng id có phạm vi và hành vi compaction vẫn chảy
      qua các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ helper
      không phải là thay thế đủ cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Mặc định pool và isolation của Vitest">

    - Cấu hình Vitest cơ sở mặc định dùng `threads`.
    - Cấu hình Vitest dùng chung cố định `isolate: false` và dùng runner
      không isolate trên các dự án root, e2e và cấu hình live.
    - Làn UI root giữ setup và optimizer `jsdom`, nhưng cũng chạy trên
      runner không isolate dùng chung.
    - Mỗi shard `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false`
      từ cấu hình Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình
      Node con của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8 gốc.

  </Accordion>

  <Accordion title="Lặp cục bộ nhanh">

    - `pnpm changed:lanes` hiển thị các làn kiến trúc mà một diff kích hoạt.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck hoặc kiểm thử.
    - Chạy `pnpm check:changed` rõ ràng trước khi bàn giao hoặc push khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các làn có phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent quyết định
      một chỉnh sửa harness, config, package hoặc contract thật sự cần phạm vi
      bao phủ Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ nguyên hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động co giãn worker cục bộ được chủ ý giữ thận trọng và giảm tải
      khi load average của host đã cao, nên nhiều lần chạy Vitest đồng thời
      mặc định gây ít thiệt hại hơn.
    - Cấu hình Vitest cơ sở đánh dấu các tệp projects/config là
      `forceRerunTriggers` để các lần chạy lại changed-mode vẫn đúng khi
      wiring kiểm thử thay đổi.
    - Cấu hình giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` bật trên các host được hỗ trợ;
      đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache rõ ràng cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Gỡ lỗi hiệu năng">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cộng với
      đầu ra phân tách import.
    - `pnpm test:perf:imports:changed` giới hạn cùng chế độ xem profiling đó cho
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian shard được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn cấu hình dùng đường dẫn config làm khóa; các shard CI
      include-pattern nối thêm tên shard để có thể theo dõi riêng các shard đã lọc.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho import khởi động,
      giữ các dependency nặng phía sau một seam `*.runtime.ts` cục bộ hẹp và
      mock trực tiếp seam đó thay vì deep-import helper runtime chỉ để truyền
      chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh `test:changed`
      đã định tuyến với đường dẫn root-project native cho diff đã commit đó và
      in thời gian wall cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây bẩn hiện tại
      bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và cấu hình Vitest root.
    - `pnpm test:perf:profile:main` ghi profile CPU main-thread cho chi phí
      khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi profile CPU+heap của runner cho
      bộ unit với song song hóa theo tệp bị tắt.

  </Accordion>
</AccordionGroup>

### Độ ổn định (gateway)

- Lệnh: `pnpm test:stability:gateway`
- Cấu hình: `vitest.gateway.config.ts`, bị ép về một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với diagnostics được bật theo mặc định
  - Đẩy churn thông điệp gateway, memory và payload lớn tổng hợp qua đường dẫn sự kiện diagnostic
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các helper lưu bền bundle độ ổn định diagnostic
  - Khẳng định recorder vẫn bị giới hạn, các mẫu RSS tổng hợp ở dưới budget áp lực và độ sâu hàng đợi theo phiên thoát về không
- Kỳ vọng:
  - An toàn cho CI và không cần key
  - Làn hẹp cho theo dõi regression độ ổn định, không thay thế bộ Gateway đầy đủ

### E2E (gateway smoke)

- Lệnh: `pnpm test:e2e`
- Cấu hình: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và các kiểm thử E2E bundled-plugin dưới `extensions/`
- Mặc định runtime:
  - Dùng `threads` của Vitest với `isolate: false`, khớp với phần còn lại của repo.
  - Dùng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ silent để giảm chi phí console I/O.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để ép số lượng worker (giới hạn ở 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra console verbose.
- Phạm vi:
  - Hành vi end-to-end của gateway đa instance
  - Bề mặt WebSocket/HTTP, ghép cặp node và networking nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không cần key thật
  - Nhiều phần chuyển động hơn kiểm thử unit (có thể chậm hơn)

### E2E: OpenShell backend smoke

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Khởi động một gateway OpenShell cô lập trên host qua Docker
  - Tạo sandbox từ một Dockerfile cục bộ tạm thời
  - Thực thi backend OpenShell của OpenClaw qua `sandbox ssh-config` thật + SSH exec
  - Xác minh hành vi hệ thống tệp remote-canonical qua bridge fs của sandbox
- Kỳ vọng:
  - Chỉ opt-in; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Cần CLI `openshell` cục bộ cùng một Docker daemon hoạt động
  - Dùng `HOME` / `XDG_CONFIG_HOME` cô lập, rồi hủy gateway kiểm thử và sandbox
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới binary CLI không mặc định hoặc script wrapper

### Live (provider thật + model thật)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các kiểm thử live của Plugin đóng gói dưới `extensions/`
- Mặc định: được **bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - "Provider/model này có thực sự hoạt động _hôm nay_ với thông tin xác thực thật không?"
  - Bắt các thay đổi định dạng của provider, điểm đặc thù khi gọi công cụ, sự cố xác thực và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế không ổn định cho CI (mạng thật, chính sách provider thật, hạn mức, sự cố ngừng hoạt động)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con đã thu hẹp thay vì "mọi thứ"
- Các lần chạy live nạp `~/.profile` để lấy các khóa API còn thiếu.
- Theo mặc định, các lần chạy live vẫn cô lập `HOME` và sao chép vật liệu cấu hình/xác thực vào một thư mục home kiểm thử tạm thời để fixture đơn vị không thể sửa đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn chủ ý cần kiểm thử live dùng thư mục home thật của mình.
- `pnpm test:live` hiện mặc định dùng chế độ ít ồn hơn: chế độ này giữ đầu ra tiến trình `[live] ...`, nhưng ẩn thông báo `~/.profile` bổ sung và tắt tiếng nhật ký khởi động Gateway/tiếng ồn Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn bật lại toàn bộ nhật ký khởi động.
- Xoay vòng khóa API (theo từng provider): đặt `*_API_KEYS` với định dạng phân tách bằng dấu phẩy/chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè theo từng live qua `OPENCLAW_LIVE_*_KEY`; kiểm thử sẽ thử lại khi nhận phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ kiểm thử live hiện phát các dòng tiến trình ra stderr để các lệnh gọi provider lâu vẫn hiển thị là đang hoạt động ngay cả khi cơ chế bắt console của Vitest im lặng.
  - `vitest.live.config.ts` tắt cơ chế chặn console của Vitest để các dòng tiến trình provider/Gateway được truyền ngay trong các lần chạy live.
  - Điều chỉnh Heartbeat mô hình trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Điều chỉnh Heartbeat Gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ kiểm thử nào?

Dùng bảng quyết định này:

- Chỉnh sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn thay đổi nhiều)
- Chạm vào mạng Gateway / giao thức WS / ghép đôi: thêm `pnpm test:e2e`
- Gỡ lỗi "bot của tôi bị sập" / lỗi theo provider / gọi công cụ: chạy một `pnpm test:live` đã thu hẹp

## Kiểm thử live (chạm mạng)

Với ma trận mô hình live, smoke CLI backend, smoke ACP, harness app-server Codex
và tất cả kiểm thử live cho provider media (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) - cộng với xử lý thông tin xác thực cho các lần chạy live - xem
[Kiểm thử các bộ live](/vi/help/testing-live). Với danh sách kiểm tra chuyên biệt cho cập nhật và
xác thực Plugin, xem
[Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Trình chạy Docker (kiểm tra tùy chọn "hoạt động trong Linux")

Các trình chạy Docker này chia thành hai nhóm:

- Trình chạy mô hình live: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp live profile-key tương ứng của chúng bên trong ảnh Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), gắn thư mục cấu hình cục bộ và workspace của bạn (và nạp `~/.profile` nếu được gắn). Các điểm vào cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Trình chạy Docker live mặc định dùng giới hạn smoke nhỏ hơn để một lượt quét Docker đầy đủ vẫn thực tế:
  `test:docker:live-models` mặc định là `OPENCLAW_LIVE_MAX_MODELS=12`, và
  `test:docker:live-gateway` mặc định là `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Ghi đè các biến môi trường đó khi bạn
  chủ ý muốn quét toàn diện lớn hơn.
- `test:docker:all` dựng ảnh Docker live một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần thành npm tarball thông qua `scripts/package-openclaw-for-docker.mjs`, rồi dựng/tái sử dụng hai ảnh `scripts/e2e/Dockerfile`. Ảnh bare chỉ là trình chạy Node/Git cho các làn install/update/plugin-dependency; các làn đó gắn tarball đã dựng sẵn. Ảnh functional cài cùng tarball đó vào `/app` cho các làn chức năng ứng dụng đã dựng. Định nghĩa làn Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Phần tổng hợp dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` kiểm soát các slot tiến trình, trong khi các giới hạn tài nguyên ngăn các làn live nặng, npm-install và đa dịch vụ cùng khởi động một lúc. Nếu một làn riêng lẻ nặng hơn các giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động làn đó khi pool trống rồi giữ làn đó chạy một mình cho đến khi lại có dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ điều chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi máy chủ Docker có nhiều dư địa hơn. Trình chạy thực hiện preflight Docker theo mặc định, xóa các container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời gian của các làn thành công vào `.artifacts/docker-tests/lane-timings.json`, và dùng các thời gian đó để khởi động các làn dài hơn trước trong những lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest làn có trọng số mà không dựng hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các làn đã chọn, nhu cầu package/ảnh và thông tin xác thực.
- `Package Acceptance` là cổng package gốc GitHub cho "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một package ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải nó lên dưới tên `package-under-test`, rồi chạy các làn Docker E2E tái sử dụng trên đúng tarball đó thay vì đóng gói lại ref đã chọn. Các profile được sắp theo độ rộng: `smoke`, `package`, `product`, và `full`. Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng package/cập nhật/Plugin, ma trận sống sót qua nâng cấp đã phát hành, mặc định phát hành và phân loại lỗi.
- Kiểm tra build và release chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Guard này duyệt đồ thị đã build tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và báo lỗi nếu quá trình khởi động trước dispatch nhập các dependency package như Commander, prompt UI, undici hoặc logging trước khi dispatch lệnh; nó cũng giữ chunk chạy Gateway đóng gói dưới ngưỡng và từ chối import tĩnh các đường dẫn Gateway lạnh đã biết. Smoke CLI đã đóng gói cũng bao phủ root help, onboard help, doctor help, status, config schema và lệnh liệt kê mô hình.
- Khả năng tương thích kế thừa của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Tới mốc đó, harness chỉ dung thứ các khoảng trống metadata của package đã phát hành: mục QA inventory riêng tư bị bỏ qua, thiếu `gateway install --wrapper`, thiếu tệp patch trong fixture git lấy từ tarball, thiếu `update.channel` đã lưu, vị trí install-record Plugin kế thừa, thiếu lưu install-record marketplace và migration metadata cấu hình trong `plugins update`. Với các package sau `2026.4.25`, các đường dẫn đó là lỗi nghiêm ngặt.
- Trình chạy smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.

Các trình chạy Docker mô hình live cũng chỉ bind-mount các home xác thực CLI cần thiết (hoặc tất cả các home được hỗ trợ khi lần chạy không bị thu hẹp), rồi sao chép chúng vào home của container trước khi chạy để OAuth của CLI bên ngoài có thể làm mới token mà không sửa đổi kho xác thực trên host:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Kiểm thử nhanh ràng buộc ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với phạm vi bao phủ Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử nhanh backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử nhanh harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử nhanh khả năng quan sát: `pnpm qa:otel:smoke` là một làn kiểm tra source-checkout QA riêng tư. Làn này cố ý không nằm trong các làn phát hành Docker của gói vì tarball npm bỏ qua QA Lab.
- Kiểm thử nhanh live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, dựng khung đầy đủ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử nhanh onboarding/channel/agent bằng tarball npm: `pnpm test:docker:npm-onboard-channel-agent` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, cấu hình OpenAI qua onboarding tham chiếu env cùng Telegram theo mặc định, chạy doctor và chạy một lượt agent OpenAI được mock. Tái sử dụng tarball đã dựng sẵn với `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua việc dựng lại trên host với `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc chuyển kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` hoặc `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Kiểm thử nhanh cài đặt Skill: `pnpm test:docker:skill-install` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, tắt cài đặt archive đã tải lên trong cấu hình, phân giải slug skill ClawHub live hiện tại từ tìm kiếm, cài đặt bằng `openclaw skills install`, rồi xác minh skill đã cài đặt cùng metadata nguồn gốc/khóa `.clawhub`.
- Kiểm thử nhanh chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt tarball OpenClaw đã đóng gói ở phạm vi toàn cục trong Docker, chuyển từ gói `stable` sang git `dev`, xác minh kênh đã lưu và Plugin sau cập nhật hoạt động, rồi chuyển lại về gói `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử nhanh sống sót sau nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt tarball OpenClaw đã đóng gói đè lên một fixture người dùng cũ còn bẩn với agent, cấu hình kênh, danh sách cho phép Plugin, trạng thái phụ thuộc Plugin cũ và các tệp workspace/session hiện có. Lệnh này chạy cập nhật gói cùng doctor không tương tác mà không có khóa nhà cung cấp hoặc kênh live, sau đó khởi động một Gateway loopback và kiểm tra việc giữ nguyên cấu hình/trạng thái cùng ngân sách khởi động/trạng thái.
- Kiểm thử nhanh sống sót sau nâng cấp bản đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, seed các tệp người dùng hiện có thực tế, cấu hình baseline đó bằng một công thức lệnh được nhúng sẵn, xác thực cấu hình thu được, cập nhật bản cài đặt đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway loopback và kiểm tra intent đã cấu hình, việc giữ nguyên trạng thái, khởi động, `/healthz`, `/readyz` và ngân sách trạng thái RPC. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các baseline cục bộ chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, và mở rộng fixture dạng issue bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; tập reported-issues bao gồm `configured-plugin-installs` để tự động sửa cài đặt Plugin OpenClaw bên ngoài. Package Acceptance cung cấp các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` và `published_upgrade_survivor_scenarios`, phân giải các token baseline meta như `last-stable-4` hoặc `all-since-2026.4.23`, và Full Release Validation mở rộng cổng gói release-soak thành `last-stable-4 2026.4.23 2026.5.2 2026.4.15` cộng với `reported-issues`.
- Kiểm thử nhanh ngữ cảnh runtime session: `pnpm test:docker:session-runtime-context` xác minh việc duy trì transcript ngữ cảnh runtime ẩn cùng sửa chữa bằng doctor cho các nhánh prompt-rewrite trùng lặp bị ảnh hưởng.
- Kiểm thử nhanh cài đặt toàn cục Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một home cô lập, và xác minh `openclaw infer image providers --json` trả về các nhà cung cấp hình ảnh được đóng gói thay vì bị treo. Tái sử dụng tarball đã dựng sẵn với `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua dựng trên host với `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một image Docker đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử nhanh Docker trình cài đặt: `bash scripts/test-install-sh-docker.sh` dùng chung một cache npm cho các container root, update và direct-npm. Kiểm thử nhanh cập nhật mặc định dùng npm `latest` làm baseline stable trước khi nâng cấp lên tarball ứng viên. Ghi đè bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` cục bộ, hoặc bằng input `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ một cache npm cô lập để các mục cache do root sở hữu không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để tái sử dụng cache root/update/direct-npm qua các lần chạy lại cục bộ.
- Install Smoke CI bỏ qua cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy script cục bộ không có env đó khi cần phạm vi bao phủ `npm install -g` trực tiếp.
- Kiểm thử nhanh CLI xóa workspace dùng chung của agent: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng image Dockerfile gốc, seed hai agent với một workspace trong home container cô lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Tái sử dụng image install-smoke với `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + sức khỏe): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử nhanh snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng image E2E nguồn cùng một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao phủ URL liên kết, phần tử có thể nhấp được nâng cấp bằng con trỏ, tham chiếu iframe và metadata frame.
- Hồi quy reasoning tối thiểu OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI được mock qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, sau đó buộc schema nhà cung cấp từ chối và kiểm tra chi tiết thô xuất hiện trong log Gateway.
- Cầu nối kênh MCP (Gateway đã seed + cầu nối stdio + kiểm thử nhanh notification-frame Claude thô): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP gói Pi (máy chủ MCP stdio thật + kiểm thử nhanh allow/deny hồ sơ Pi nhúng): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP Cron/subagent (Gateway thật + gỡ bỏ tiến trình con MCP stdio sau cron cô lập và các lần chạy subagent một lần): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (kiểm thử nhanh cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc được hoist, ref git di động, ClawHub kitchen-sink, cập nhật marketplace và bật/kiểm tra Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp package/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Nếu không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, bài kiểm tra dùng một máy chủ fixture ClawHub cục bộ khép kín.
- Kiểm thử nhanh Plugin update không đổi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử nhanh ma trận vòng đời Plugin: `pnpm test:docker:plugin-lifecycle-matrix` cài đặt tarball OpenClaw đã đóng gói trong một container trống, cài đặt một Plugin npm, bật/tắt, nâng cấp và hạ cấp nó qua một registry npm cục bộ, xóa mã đã cài đặt, rồi xác minh uninstall vẫn xóa trạng thái cũ trong khi ghi log các chỉ số RSS/CPU cho từng giai đoạn vòng đời.
- Kiểm thử nhanh metadata tải lại cấu hình: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` bao phủ kiểm thử nhanh cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc được hoist, ref git di động, fixture ClawHub, cập nhật marketplace và bật/kiểm tra Claude-bundle. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không đổi cho Plugin đã cài đặt. `pnpm test:docker:plugin-lifecycle-matrix` bao phủ cài đặt, bật, tắt, nâng cấp, hạ cấp và uninstall khi thiếu mã của Plugin npm có theo dõi tài nguyên.

Để dựng trước và tái sử dụng image chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image theo từng suite như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một image dùng chung từ xa, các script sẽ pull image đó nếu nó chưa có cục bộ. Các bài kiểm tra Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi gói/cài đặt thay vì runtime ứng dụng đã dựng dùng chung.

Các trình chạy Docker mô hình trực tiếp cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
dàn dựng nó vào một thư mục làm việc tạm thời bên trong container. Điều này giữ cho image runtime
gọn nhẹ trong khi vẫn chạy Vitest trên đúng source/config cục bộ của bạn.
Bước dàn dựng bỏ qua các cache lớn chỉ dùng cục bộ và đầu ra build ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục `.build` cục bộ của ứng dụng hoặc
thư mục đầu ra Gradle để các lần chạy Docker trực tiếp không mất nhiều phút sao chép
artifact riêng theo máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các probe trực tiếp của Gateway không khởi động
worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền tiếp
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi kiểm thử trực tiếp của gateway
khỏi lane Docker đó.
`test:docker:openwebui` là smoke tương thích cấp cao hơn: nó khởi động một
container gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI được pin theo gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` hiển thị `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Đặt `OPENWEBUI_SMOKE_MODE=models` cho các kiểm tra CI theo đường phát hành cần dừng
sau khi đăng nhập Open WebUI và khám phá mô hình, mà không chờ một lần hoàn tất mô hình trực tiếp.
Lần chạy đầu tiên có thể chậm hơn rõ rệt vì Docker có thể cần kéo image
Open WebUI và Open WebUI có thể cần hoàn tất thiết lập cold-start riêng.
Lane này cần một key mô hình trực tiếp dùng được, và `OPENCLAW_PROFILE_FILE`
(mặc định là `~/.profile`) là cách chính để cung cấp key đó trong các lần chạy Docker hóa.
Các lần chạy thành công in ra một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính xác định và không cần tài khoản
Telegram, Discord, hoặc iMessage thật. Nó boot một container Gateway đã seed,
khởi động một container thứ hai để spawn `openclaw mcp serve`, rồi xác minh
khám phá hội thoại được định tuyến, đọc transcript, metadata attachment,
hành vi hàng đợi sự kiện trực tiếp, định tuyến gửi đi, và thông báo kênh +
quyền theo kiểu Claude qua cầu nối MCP stdio thật. Kiểm tra thông báo
kiểm tra trực tiếp các frame MCP stdio thô để smoke xác thực những gì cầu nối
thật sự phát ra, không chỉ những gì một SDK client cụ thể tình cờ hiển thị.
`test:docker:pi-bundle-mcp-tools` có tính xác định và không cần key mô hình trực tiếp.
Nó build image Docker của repo, khởi động một server probe MCP stdio thật
bên trong container, hiện thực hóa server đó qua runtime MCP của Pi bundle nhúng,
thực thi tool, rồi xác minh `coding` và `messaging` giữ lại các tool
`bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng ra.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần key mô hình trực tiếp.
Nó khởi động một Gateway đã seed với một server probe MCP stdio thật, chạy một
turn cron cô lập và một turn con một lần `/subagents spawn`, rồi xác minh
tiến trình con MCP thoát sau mỗi lần chạy.

Smoke thread ngôn ngữ thường ACP thủ công (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow hồi quy/debug. Nó có thể lại cần cho việc xác thực định tuyến thread ACP, vì vậy đừng xóa nó.

Biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (mặc định: `~/.profile`) được mount vào `/home/node/.profile` và được source trước khi chạy kiểm thử
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được source từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục config/workspace tạm thời và không mount auth CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các cài đặt CLI được cache bên trong Docker
- Các thư mục/tệp auth CLI bên ngoài dưới `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi kiểm thử bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy provider đã thu hẹp chỉ mount những thư mục/tệp cần thiết được suy luận từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc provider trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để tái sử dụng image `openclaw:local-live` hiện có cho các lần chạy lại không cần rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo cred đến từ profile store (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình gateway hiển thị cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce được smoke Open WebUI dùng
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã pin

## Kiểm tra hợp lệ tài liệu

Chạy kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra heading trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy ngoại tuyến (an toàn cho CI)

Đây là các hồi quy "pipeline thật" không có provider thật:

- Gọi tool qua Gateway (OpenAI mock, gateway thật + vòng lặp agent): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, ghi config + bắt buộc auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Đánh giá độ tin cậy agent (skills)

Chúng ta đã có một vài kiểm thử an toàn cho CI hoạt động giống "đánh giá độ tin cậy agent":

- Gọi tool mock qua gateway thật + vòng lặp agent (`src/gateway/gateway.test.ts`).
- Luồng wizard đầu cuối xác thực wiring session và hiệu lực config (`src/gateway/gateway.test.ts`).

Những gì vẫn còn thiếu cho skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh những skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi dùng và làm theo các bước/args bắt buộc không?
- **Hợp đồng workflow:** các kịch bản nhiều turn assert thứ tự tool, truyền tiếp lịch sử session, và ranh giới sandbox.

Các đánh giá tương lai nên ưu tiên tính xác định trước:

- Một scenario runner dùng provider mock để assert tool call + thứ tự, đọc tệp skill, và wiring session.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng so với tránh, gating, prompt injection).
- Đánh giá trực tiếp tùy chọn (opt-in, được gate bằng env) chỉ sau khi bộ an toàn cho CI đã có.

## Kiểm thử hợp đồng (hình dạng plugin và kênh)

Kiểm thử hợp đồng xác minh rằng mọi plugin và kênh đã đăng ký đều tuân thủ
hợp đồng interface của nó. Chúng lặp qua tất cả plugin được khám phá và chạy một bộ
assertion về hình dạng và hành vi. Lane unit `pnpm test` mặc định cố ý
bỏ qua các tệp smoke và seam dùng chung này; hãy chạy rõ ràng các lệnh hợp đồng
khi bạn chạm vào các bề mặt kênh hoặc provider dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng provider: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng plugin cơ bản (id, tên, capability)
- **setup** - Hợp đồng wizard thiết lập
- **session-binding** - Hành vi ràng buộc session
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn đến
- **actions** - Handler hành động kênh
- **threading** - Xử lý ID thread
- **directory** - API thư mục/roster
- **group-policy** - Thực thi chính sách nhóm

### Hợp đồng trạng thái provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe trạng thái kênh
- **registry** - Hình dạng registry plugin

### Hợp đồng provider

Nằm trong `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Hợp đồng luồng auth
- **auth-choice** - Lựa chọn/chọn auth
- **catalog** - API catalog mô hình
- **discovery** - Khám phá plugin
- **loader** - Tải plugin
- **runtime** - Runtime provider
- **shape** - Hình dạng/interface plugin
- **wizard** - Wizard thiết lập

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa đổi một plugin kênh hoặc provider
- Sau khi refactor đăng ký hoặc khám phá plugin

Kiểm thử hợp đồng chạy trong CI và không yêu cầu key API thật.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề provider/mô hình được phát hiện trong live:

- Thêm hồi quy an toàn cho CI nếu có thể (provider mock/stub, hoặc capture phép biến đổi request-shape chính xác)
- Nếu nó vốn chỉ có thể kiểm thử live (rate limit, chính sách auth), giữ kiểm thử live hẹp và opt-in qua biến môi trường
- Ưu tiên nhắm vào lớp nhỏ nhất bắt được lỗi:
  - lỗi chuyển đổi/phát lại request provider → kiểm thử models trực tiếp
  - lỗi pipeline gateway session/history/tool → smoke gateway trực tiếp hoặc kiểm thử mock gateway an toàn cho CI
- Guardrail duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một target được lấy mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi assert các exec id có segment duyệt bị từ chối.
  - Nếu bạn thêm một họ target SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong kiểm thử đó. Kiểm thử cố ý fail trên các target id chưa được phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Kiểm thử trực tiếp](/vi/help/testing-live)
- [Kiểm thử cập nhật và plugin](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
