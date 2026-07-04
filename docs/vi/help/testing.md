---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm hồi quy cho lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi Gateway + agent
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử unit/e2e/live, trình chạy Docker, và phạm vi kiểm thử của từng loại'
title: Kiểm thử
x-i18n:
    generated_at: "2026-07-04T03:53:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09c125da9a4a4294d51f36f67901ef74929d9b6561d8a4fd605202497416161b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ Vitest (unit/integration, e2e, live) và một nhóm nhỏ
các trình chạy Docker. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ bao phủ những gì (và chủ ý _không_ bao phủ những gì).
- Nên chạy lệnh nào cho các quy trình phổ biến (cục bộ, trước khi push, gỡ lỗi).
- Cách các kiểm thử live phát hiện thông tin xác thực và chọn mô hình/nhà cung cấp.
- Cách thêm hồi quy cho các sự cố mô hình/nhà cung cấp trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các lane truyền tải live)** được tài liệu hóa riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) - kiến trúc, bề mặt lệnh, cách viết kịch bản.
- [Matrix QA](/vi/concepts/qa-matrix) - tham chiếu cho `pnpm openclaw qa matrix`.
- [Bảng điểm độ trưởng thành](/vi/maturity/scorecard) - cách bằng chứng QA phát hành hỗ trợ các quyết định về độ ổn định và LTS.
- [Kênh QA](/vi/channels/qa-channel) - Plugin truyền tải tổng hợp dùng bởi các kịch bản dựa trên repo.

Trang này bao quát việc chạy các bộ kiểm thử thông thường và các trình chạy Docker/Parallels. Phần trình chạy dành riêng cho QA bên dưới ([Trình chạy dành riêng cho QA](#qa-specific-runners)) liệt kê các lệnh gọi `qa` cụ thể và trỏ lại các tài liệu tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng đầy đủ (được kỳ vọng trước khi push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy nhiều tài nguyên: `pnpm test:max`
- Vòng lặp theo dõi Vitest trực tiếp: `pnpm test:watch`
- Nhắm mục tiêu tệp trực tiếp hiện cũng định tuyến các đường dẫn extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên chạy có mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Site QA dựa trên Docker: `pnpm qa:lab:up`
- Lane QA dựa trên VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng coverage: `pnpm test:coverage`
- Bộ E2E: `pnpm test:e2e`

## Thư mục tạm thời cho kiểm thử

Ưu tiên các helper dùng chung trong `test/helpers/temp-dir.ts` cho các thư mục
tạm thời thuộc sở hữu kiểm thử. Chúng làm rõ quyền sở hữu và giữ việc dọn dẹp trong cùng
vòng đời kiểm thử:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` cố ý không để lộ phương thức dọn dẹp thủ công nào; Vitest
sở hữu việc dọn dẹp sau mỗi kiểm thử. Các helper cấp thấp hiện có vẫn còn cho những kiểm thử
chưa chuyển đổi, nhưng kiểm thử mới và kiểm thử đã di trú nên dùng tracker
tự dọn dẹp. Tránh cách dùng `makeTempDir`, `cleanupTempDirs`, hoặc
`createTempDirTracker` thủ công mới và tránh các lệnh gọi `fs.mkdtemp*` trần mới trong kiểm thử
trừ khi một trường hợp đang xác minh rõ ràng hành vi temp-dir thô. Thêm comment cho phép
có thể kiểm toán với lý do cụ thể khi một kiểm thử cố ý cần thư mục tạm
trần:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Để hiển thị quá trình di trú, `node scripts/report-test-temp-creations.mjs` báo cáo
việc tạo temp-dir trần mới và cách dùng helper dùng chung thủ công mới trong các dòng diff
được thêm mà không chặn các kiểu dọn dẹp hiện có. Phạm vi tệp của nó cố ý
theo cùng phân loại đường dẫn kiểm thử được dùng bởi `scripts/changed-lanes.mjs`
thay vì duy trì một heuristic tên tệp test-helper riêng, đồng thời bỏ qua
chính phần triển khai helper dùng chung. `check:changed` chạy báo cáo này cho
các đường dẫn kiểm thử đã thay đổi như một tín hiệu CI chỉ cảnh báo; các phát hiện là annotation cảnh báo
GitHub, không phải lỗi thất bại.

Khi gỡ lỗi nhà cung cấp/mô hình thật (cần thông tin xác thực thật):

- Bộ live (mô hình + probe công cụ/hình ảnh Gateway): `pnpm test:live`
- Nhắm mục tiêu một tệp live ở chế độ yên lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng runtime: dispatch `OpenClaw Performance` với
  `live_openai_candidate=true` cho một lượt agent `openai/gpt-5.5` thật hoặc
  `deep_profile=true` cho artifact CPU/heap/trace của Kova. Các lần chạy theo lịch hằng ngày
  xuất bản artifact lane mock-provider, deep-profile, và GPT 5.5 lên
  `openclaw/clawgrit-reports` khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình. Báo cáo
  mock-provider cũng bao gồm các số liệu cấp nguồn về khởi động gateway, bộ nhớ,
  áp lực Plugin, vòng lặp hello fake-model lặp lại, và khởi động CLI.
- Quét mô hình live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi mô hình được chọn hiện chạy một lượt văn bản cộng với một probe nhỏ kiểu đọc tệp.
    Các mô hình có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các probe bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi nhà cung cấp.
  - Coverage CI: `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận mô hình live Docker riêng
    được chia shard theo nhà cung cấp.
  - Để chạy lại CI có trọng tâm, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm secret nhà cung cấp tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các caller
    theo lịch/phát hành của nó.
- Smoke bound-chat Codex native: `pnpm test:docker:live-codex-bind`
  - Chạy một lane live Docker qua đường dẫn app-server Codex, bind một
    Slack DM tổng hợp bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi văn bản thường và một tệp đính kèm hình ảnh
    đi qua binding Plugin native thay vì ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt agent gateway qua harness app-server Codex do Plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và mặc định thực thi các probe hình ảnh,
    cron MCP, sub-agent, và Guardian. Tắt probe sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi app-server Codex
    khác. Để kiểm tra sub-agent có trọng tâm, tắt các probe khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Lệnh này thoát sau probe sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Smoke cài đặt Codex theo yêu cầu: `pnpm test:docker:codex-on-demand`
  - Cài đặt tarball OpenClaw đã đóng gói trong Docker, chạy onboarding khóa API OpenAI,
    và xác minh Plugin Codex cùng dependency `@openai/codex`
    đã được tải xuống root dự án npm được quản lý theo yêu cầu.
- Smoke dependency công cụ Plugin live: `pnpm test:docker:live-plugin-tool`
  - Đóng gói một Plugin fixture với dependency `slugify` thật, cài đặt nó qua
    `npm-pack:`, xác minh dependency dưới root dự án npm được quản lý,
    rồi yêu cầu một mô hình OpenAI live gọi công cụ Plugin và trả về
    slug ẩn.
- Smoke lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra opt-in theo kiểu thắt lưng và dây đeo cho bề mặt lệnh cứu hộ của kênh tin nhắn.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi mô hình bền vững,
    trả lời `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker bộ lập kế hoạch Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong container không có config với một CLI Claude giả trên `PATH`
    và xác minh fallback bộ lập kế hoạch mờ được chuyển thành một lần ghi config
    có kiểu và được audit.
- Smoke Docker lần chạy đầu Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, xác minh entrypoint Crestodian onboard
    hiện đại, áp dụng các ghi setup/model/agent/Plugin Discord + SecretRef,
    xác thực config, và xác minh các mục audit. Cùng đường dẫn thiết lập Ring 0
    cũng được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  cô lập với `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và
  transcript assistant lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một trường hợp thất bại, ưu tiên thu hẹp kiểm thử live bằng các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Trình chạy dành riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần tính thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. Tính tương đương agentic được lồng dưới
`QA-Lab - All Lanes` và xác thực phát hành, không phải một workflow PR độc lập.
Xác thực rộng nên dùng `Full Release Validation` với
`rerun_group=qa-parity` hoặc nhóm QA của release-checks. Các kiểm tra phát hành
stable/default giữ soak live/Docker toàn diện phía sau `run_release_soak=true`; profile
`full` buộc bật soak. `QA-Lab - All Lanes`
chạy hằng đêm trên `main` và từ dispatch thủ công với lane mock parity, lane live
Matrix, lane Telegram live do Convex quản lý, và lane Discord live do Convex quản lý
như các job song song. QA theo lịch và kiểm tra phát hành truyền Matrix
`--profile fast` một cách rõ ràng, trong khi CLI Matrix và input workflow thủ công
mặc định vẫn là `all`; dispatch thủ công có thể chia shard `all` thành các job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`. `OpenClaw Release
Checks` chạy parity cộng với các lane Matrix nhanh và Telegram trước khi phê duyệt
phát hành, dùng `mock-openai/gpt-5.5` cho các kiểm tra truyền tải phát hành để chúng vẫn
xác định được và tránh khởi động provider-plugin thông thường. Các gateway truyền tải live
này tắt tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ QA parity.

Các shard media live phát hành đầy đủ dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard mô hình/backend live Docker dùng image dùng chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi commit
được chọn, rồi kéo nó với `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì rebuild
bên trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy các kịch bản QA dựa trên repo trực tiếp trên máy chủ.
  - Ghi các tạo tác cấp cao nhất `qa-evidence.json`, `qa-suite-summary.json` và
    `qa-suite-report.md` cho tập kịch bản đã chọn, bao gồm các lựa chọn kịch bản
    luồng hỗn hợp, Vitest và Playwright.
  - Khi được điều phối bởi `pnpm openclaw qa run --qa-profile <profile>`, nhúng
    bảng điểm hồ sơ phân loại đã chọn vào cùng `qa-evidence.json`.
    `smoke-ci` ghi bằng chứng gọn, đặt `evidenceMode: "slim"` và bỏ qua
    `execution` theo từng mục. `release` bao phủ phần sẵn sàng phát hành đã
    được tuyển chọn; `all` chọn mọi danh mục mức trưởng thành đang hoạt động và
    dành cho các lần điều phối thủ công quy trình QA Profile Evidence khi cần
    tạo tác bảng điểm đầy đủ.
  - Theo mặc định, chạy song song nhiều kịch bản đã chọn với các worker
    Gateway cô lập. `qa-channel` mặc định dùng mức đồng thời 4 (bị giới hạn bởi
    số lượng kịch bản đã chọn). Dùng `--concurrency <count>` để tinh chỉnh số
    worker, hoặc `--concurrency 1` cho lane nối tiếp cũ hơn.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng
    `--allow-failures` khi bạn muốn có tạo tác mà không làm mã thoát thất bại.
  - Hỗ trợ các chế độ nhà cung cấp `live-frontier`, `mock-openai` và `aimock`.
    `aimock` khởi động một máy chủ nhà cung cấp cục bộ dựa trên AIMock cho phạm
    vi bao phủ fixture thử nghiệm và mô phỏng giao thức mà không thay thế lane
    `mock-openai` có nhận biết kịch bản.
- `pnpm openclaw qa coverage --match <query>`
  - Tìm kiếm ID kịch bản, tiêu đề, bề mặt, ID phạm vi bao phủ, tham chiếu tài
    liệu, tham chiếu mã, plugin và yêu cầu nhà cung cấp, rồi in các mục tiêu
    suite khớp.
  - Dùng lệnh này trước một lần chạy QA Lab khi bạn biết hành vi hoặc đường dẫn
    tệp bị chạm tới nhưng chưa biết kịch bản nhỏ nhất. Lệnh này chỉ mang tính
    tư vấn; vẫn chọn bằng chứng mock, live, Multipass, Matrix hoặc transport dựa
    trên hành vi đang được thay đổi.
- `pnpm test:plugins:kitchen-sink-live`
  - Chạy bài kiểm tra gauntlet Plugin Kitchen Sink OpenAI live qua QA Lab. Lệnh
    cài đặt gói Kitchen Sink bên ngoài, xác minh inventory bề mặt plugin SDK,
    thăm dò `/healthz` và `/readyz`, ghi bằng chứng CPU/RSS của Gateway, chạy
    một lượt OpenAI live và kiểm tra chẩn đoán đối kháng. Yêu cầu xác thực
    OpenAI live như `OPENAI_API_KEY`. Trong các phiên Testbox đã hydrate, lệnh
    tự động nạp hồ sơ live-auth của Testbox khi có helper
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy benchmark khởi động Gateway cùng một gói nhỏ kịch bản QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi bản tóm tắt quan sát CPU kết hợp
    dưới `.artifacts/gateway-cpu-scenarios/`.
  - Theo mặc định, chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cộng với `--hot-wall-warn-ms`), vì vậy các đợt tăng ngắn khi khởi động được
    ghi lại như số liệu mà không trông giống hồi quy Gateway bị ghim CPU kéo dài
    nhiều phút.
  - Dùng các tạo tác `dist` đã build; hãy chạy build trước khi checkout chưa có
    đầu ra runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng QA suite bên trong một VM Linux Multipass dùng một lần.
  - Giữ cùng hành vi chọn kịch bản như `qa suite` trên máy chủ.
  - Tái sử dụng cùng các cờ chọn nhà cung cấp/mô hình như `qa suite`.
  - Các lần chạy live chuyển tiếp những đầu vào xác thực QA được hỗ trợ và thực
    tế cho guest: khóa nhà cung cấp dựa trên env, đường dẫn cấu hình nhà cung
    cấp QA live và `CODEX_HOME` khi có.
  - Thư mục đầu ra phải nằm dưới gốc repo để guest có thể ghi ngược lại qua
    workspace đã mount.
  - Ghi báo cáo + tóm tắt QA thông thường cùng nhật ký Multipass dưới
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA dựa trên Docker cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt toàn cục trong Docker,
    chạy onboarding khóa API OpenAI không tương tác, mặc định cấu hình
    Telegram, xác minh runtime plugin đã đóng gói tải mà không cần sửa phụ thuộc
    khi khởi động, chạy doctor và chạy một lượt agent cục bộ với endpoint OpenAI
    được mock.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane cài đặt gói
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy smoke Docker xác định cho ứng dụng đã build về transcript ngữ cảnh
    runtime nhúng. Lệnh xác minh ngữ cảnh runtime OpenClaw ẩn được lưu bền dưới
    dạng thông điệp tùy chỉnh không hiển thị thay vì rò rỉ vào lượt người dùng
    hiển thị, sau đó seed một JSONL phiên hỏng bị ảnh hưởng và xác minh
    `openclaw doctor --fix` ghi lại nó sang nhánh đang hoạt động kèm bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một gói ứng viên OpenClaw trong Docker, chạy onboarding gói đã cài
    đặt, cấu hình Telegram qua CLI đã cài đặt, rồi tái sử dụng lane QA Telegram
    live với gói đã cài đó làm Gateway SUT.
  - Wrapper chỉ mount nguồn harness `qa-lab` từ checkout; gói đã cài đặt sở hữu
    `dist`, `openclaw/plugin-sdk` và runtime plugin bundled để lane không trộn
    plugin của checkout hiện tại vào gói đang được kiểm thử.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã resolve
    thay vì cài từ registry.
  - Theo mặc định, phát ra thời gian RTT lặp lại trong `qa-evidence.json` với
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Ghi đè
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` hoặc
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` để tinh chỉnh lần chạy RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` chấp nhận danh sách ID kiểm tra QA
    Telegram phân tách bằng dấu phẩy để lấy mẫu; khi chưa đặt, kiểm tra mặc định
    có khả năng RTT là `telegram-mentioned-message-reply`.
  - Dùng cùng thông tin đăng nhập env Telegram hoặc nguồn thông tin đăng nhập
    Convex như `pnpm openclaw qa telegram`. Với tự động hóa CI/phát hành, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cộng với
    `OPENCLAW_QA_CONVEX_SITE_URL` và một secret theo vai trò. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một secret vai trò Convex có mặt trong CI,
    wrapper Docker tự động chọn Convex.
  - Wrapper xác thực env thông tin đăng nhập Telegram hoặc Convex trên máy chủ
    trước công việc build/cài đặt Docker. Chỉ đặt
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` khi cố ý debug thiết lập
    trước thông tin đăng nhập.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này. Khi chọn thông
    tin đăng nhập Convex và không đặt vai trò, wrapper dùng `ci` trong CI và
    `maintainer` ngoài CI.
  - GitHub Actions hiển thị lane này dưới dạng quy trình maintainer thủ công
    `NPM Telegram Beta E2E`. Nó không chạy khi merge. Quy trình dùng môi trường
    `qa-live-shared` và lease thông tin đăng nhập CI Convex.
- GitHub Actions cũng hiển thị `Package Acceptance` cho bằng chứng sản phẩm chạy
  phụ với một gói ứng viên. Nó chấp nhận ref đáng tin cậy, spec npm đã phát
  hành, URL tarball HTTPS kèm SHA-256 hoặc tạo tác tarball từ một lần chạy khác,
  tải lên `openclaw-current.tgz` đã chuẩn hóa dưới dạng `package-under-test`, rồi
  chạy bộ lập lịch Docker E2E hiện có với các hồ sơ lane smoke, package, product,
  full hoặc custom. Đặt `telegram_mode=mock-openai` hoặc `live-frontier` để chạy
  quy trình QA Telegram với cùng tạo tác `package-under-test`.
  - Bằng chứng sản phẩm beta mới nhất:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bằng chứng URL tarball chính xác yêu cầu digest và dùng chính sách an toàn URL công khai:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Mirror tarball doanh nghiệp/riêng tư dùng chính sách nguồn đáng tin cậy rõ ràng:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` đọc `.github/package-trusted-sources.json` từ ref quy trình đáng tin cậy và không chấp nhận thông tin đăng nhập URL hoặc bỏ qua mạng riêng tư bằng đầu vào quy trình. Nếu chính sách đã đặt tên khai báo xác thực bearer, hãy cấu hình secret cố định `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Bằng chứng tạo tác tải xuống một tạo tác tarball từ một lần chạy Actions khác:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Đóng gói và cài đặt bản build OpenClaw hiện tại trong Docker, khởi động
    Gateway với OpenAI đã cấu hình, rồi bật các channel/plugin bundled qua các
    chỉnh sửa cấu hình.
  - Xác minh quá trình khám phá thiết lập để các plugin có thể tải xuống chưa
    cấu hình vắng mặt, lần sửa doctor đầu tiên đã cấu hình cài đặt rõ ràng từng
    plugin có thể tải xuống bị thiếu, và lần khởi động lại thứ hai không chạy
    sửa phụ thuộc ẩn.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của
    ứng viên dọn dẹp mảnh vụn phụ thuộc plugin cũ mà không cần sửa postinstall
    phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật cài đặt gói native trên các guest Parallels. Mỗi nền
    tảng đã chọn trước tiên cài đặt gói baseline được yêu cầu, sau đó chạy lệnh
    `openclaw update` đã cài đặt trong cùng guest và xác minh phiên bản đã cài,
    trạng thái cập nhật, độ sẵn sàng của Gateway và một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows` hoặc `--platform linux` khi
    lặp trên một guest. Dùng `--json` cho đường dẫn tạo tác tóm tắt và trạng
    thái theo từng lane.
  - Lane OpenAI mặc định dùng `openai/gpt-5.5` cho bằng chứng lượt agent live.
    Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi cố ý xác thực một mô hình OpenAI khác.
  - Bọc các lần chạy cục bộ dài trong timeout của máy chủ để các lần treo
    transport Parallels không tiêu thụ phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi nhật ký lane lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log` hoặc `linux-update.log`
    trước khi giả định wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong công việc doctor sau cập
    nhật và cập nhật gói trên guest lạnh; điều đó vẫn bình thường khi nhật ký
    debug npm lồng nhau vẫn đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với các lane smoke Parallels
    macOS, Windows hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể
    va chạm khi khôi phục snapshot, phục vụ gói hoặc trạng thái Gateway của
    guest.
  - Bằng chứng sau cập nhật chạy bề mặt plugin bundled thông thường vì các
    facade khả năng như speech, image generation và media understanding được
    tải qua API runtime bundled ngay cả khi bản thân lượt agent chỉ kiểm tra một
    phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ nhà cung cấp AIMock cục bộ để kiểm thử smoke giao thức trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy làn QA trực tiếp Matrix trên một homeserver Tuwunel dùng một lần được Docker hỗ trợ. Chỉ dành cho source-checkout - bản cài đặt đóng gói không kèm `qa-lab`.
  - CLI đầy đủ, danh mục hồ sơ/kịch bản, biến môi trường và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy làn QA trực tiếp Telegram với một nhóm riêng tư thật bằng token bot của driver và SUT từ env.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID nhóm phải là ID cuộc trò chuyện Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực dùng chung theo nhóm. Dùng chế độ env theo mặc định, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng lease theo nhóm.
  - Mặc định bao phủ canary, kiểm soát mention, định địa chỉ lệnh, `/status`, trả lời được mention giữa bot với bot, và trả lời lệnh gốc cốt lõi. Mặc định `mock-openai` cũng bao phủ hồi quy chuỗi trả lời tất định và streaming thông điệp cuối của Telegram. Dùng `--list-scenarios` cho các probe tùy chọn như `session_status`.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn muốn artifact mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng một nhóm riêng tư, trong đó bot SUT phải công khai tên người dùng Telegram.
  - Để quan sát ổn định giữa bot với bot, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và bảo đảm bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, bản tóm tắt và `qa-evidence.json` dưới `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến trả lời SUT quan sát được.

`Mantis Telegram Live` là wrapper bằng chứng PR quanh làn này. Nó chạy ref ứng viên với thông tin xác thực Telegram được Convex lease, render báo cáo QA đã biên tập ẩn dữ liệu nhạy cảm/gói bằng chứng trong trình duyệt desktop Crabbox, ghi bằng chứng MP4, tạo GIF đã cắt theo chuyển động, tải lên gói artifact, và đăng bằng chứng PR inline thông qua Mantis GitHub App khi `pr_number` được đặt. Maintainer có thể khởi động từ Actions UI thông qua `Mantis Scenario` (`scenario_id:
telegram-live`) hoặc trực tiếp từ bình luận pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` là wrapper agentic Telegram Desktop gốc trước/sau cho bằng chứng trực quan PR. Khởi động từ Actions UI với `instructions` dạng tự do, thông qua `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), hoặc từ bình luận PR:

```text
@openclaw-mantis telegram desktop proof
```

Agent Mantis đọc PR, quyết định hành vi hiển thị trên Telegram nào chứng minh thay đổi, chạy làn bằng chứng Telegram Desktop Crabbox bằng người dùng thật trên ref baseline và ứng viên, lặp cho đến khi các GIF gốc hữu ích, ghi manifest `motionPreview` theo cặp, và đăng cùng bảng GIF 2 cột thông qua Mantis GitHub App khi `pr_number` được đặt.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Lease hoặc tái sử dụng desktop Linux Crabbox, cài Telegram Desktop gốc, cấu hình OpenClaw bằng token bot SUT Telegram được lease, khởi động Gateway, và ghi bằng chứng ảnh chụp màn hình/MP4 từ desktop VNC hiển thị được.
  - Mặc định là `--credential-source convex` để workflow chỉ cần secret broker Convex. Dùng `--credential-source env` với cùng các biến `OPENCLAW_QA_TELEGRAM_*` như `pnpm openclaw qa telegram`.
  - Telegram Desktop vẫn cần đăng nhập/hồ sơ người dùng. Token bot chỉ cấu hình OpenClaw. Dùng `--telegram-profile-archive-env <name>` cho archive hồ sơ `.tgz` base64, hoặc dùng `--keep-lease` và đăng nhập thủ công qua VNC một lần.
  - Ghi `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, và `telegram-desktop-builder.mp4` dưới thư mục đầu ra.

Các làn truyền tải trực tiếp chia sẻ một hợp đồng chuẩn để các transport mới không lệch hướng; ma trận phạm vi theo làn nằm trong [Tổng quan QA → Phạm vi truyền tải trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ kiểm thử tổng hợp rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi bật `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) cho QA truyền tải trực tiếp, QA lab lấy một lease độc quyền từ pool được Convex hỗ trợ, gửi Heartbeat cho lease đó trong khi làn đang chạy, và giải phóng lease khi tắt. Tên mục này có trước hỗ trợ Discord, Slack và WhatsApp; hợp đồng lease được dùng chung giữa các loại.

Scaffold dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Biến env bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho vai trò đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Lựa chọn vai trò thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định env: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, nếu không thì `maintainer`)

Biến env tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID truy vết tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` loopback chỉ dành cho phát triển cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong vận hành thông thường.

Các lệnh quản trị của maintainer (thêm/xóa/liệt kê pool) yêu cầu riêng `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Trình trợ giúp CLI cho maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lần chạy trực tiếp để kiểm tra URL site Convex, secret broker, tiền tố endpoint, thời gian chờ HTTP và khả năng truy cập admin/list mà không in giá trị secret. Dùng `--json` cho đầu ra máy đọc được trong script và tiện ích CI.

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
  - Guard lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ secret maintainer)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Dạng payload cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi ID cuộc trò chuyện Telegram dạng số.
- `admin/add` xác thực dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

Dạng payload cho loại người dùng thật Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, và `telegramApiId` phải là chuỗi số.
- `tdlibArchiveSha256` và `desktopTdataArchiveSha256` phải là chuỗi hex SHA-256.
- `kind: "telegram-user"` được dành riêng cho workflow bằng chứng Mantis Telegram Desktop. Các làn QA Lab chung không được acquire loại này.

Payload đa kênh được broker xác thực:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Các làn Slack cũng có thể lease từ pool, nhưng xác thực payload Slack hiện nằm trong runner QA Slack thay vì broker. Dùng `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` cho các hàng Slack.

### Thêm kênh vào QA

Kiến trúc và tên scenario-helper cho adapter kênh mới nằm trong [Tổng quan QA → Thêm kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai runner transport trên seam host `qa-lab` dùng chung, khai báo `qaRunners` trong manifest Plugin, mount dưới dạng `openclaw qa <runner>`, và viết kịch bản dưới `qa/scenarios/`.

## Bộ kiểm thử (chạy ở đâu)

Hãy nghĩ về các bộ kiểm thử như “độ chân thực tăng dần” (và độ dễ lỗi/chi phí tăng dần):

### Unit / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng bộ shard `vitest.full-*.config.ts` và có thể mở rộng shard đa dự án thành cấu hình theo dự án để lập lịch song song
- Tệp: inventory core/unit dưới `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử unit UI chạy trong shard chuyên dụng `unit-ui`
- Phạm vi:
  - Kiểm thử unit thuần túy
  - Kiểm thử tích hợp trong tiến trình (xác thực gateway, định tuyến, tooling, phân tích cú pháp, cấu hình)
  - Hồi quy tất định cho lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không cần khóa thật
  - Nên nhanh và ổn định
  - Kiểm thử resolver và loader bề mặt công khai phải chứng minh hành vi fallback rộng của `api.js` và `runtime-api.js` bằng fixture Plugin nhỏ được tạo, không phải API nguồn Plugin bunded thật. Việc tải API Plugin thật thuộc về bộ contract/tích hợp do Plugin sở hữu.

Chính sách dependency gốc:

- Bản cài đặt kiểm thử mặc định bỏ qua build opus Discord gốc tùy chọn. Voice Discord dùng `libopus-wasm` đi kèm, và `@discordjs/opus` vẫn bị tắt trong `allowBuilds` để kiểm thử cục bộ và các làn Testbox không biên dịch addon gốc.
- So sánh hiệu năng opus gốc trong repo benchmark `libopus-wasm`, không phải trong vòng lặp cài đặt/kiểm thử OpenClaw mặc định. Không đặt `@discordjs/opus` thành `true` trong `allowBuilds` mặc định; điều đó khiến các vòng lặp cài đặt/kiểm thử không liên quan phải biên dịch mã gốc.

<AccordionGroup>
  <Accordion title="Dự án, shard và làn theo phạm vi">

    - Lệnh `pnpm test` không chỉ định mục tiêu chạy mười hai cấu hình shard nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình native root-project khổng lồ. Cách này giảm RSS đỉnh trên các máy đang tải nặng và tránh việc auto-reply/extension làm nghẽn các bộ kiểm thử không liên quan.
    - `pnpm test --watch` vẫn dùng đồ thị dự án gốc native `vitest.config.ts`, vì vòng lặp watch nhiều shard không thực tế.
    - `pnpm test`, `pnpm test:watch`, và `pnpm test:perf:imports` định tuyến các mục tiêu tệp/thư mục rõ ràng qua các làn có phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả toàn bộ chi phí khởi động dự án gốc.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các làn có phạm vi rẻ: chỉnh sửa kiểm thử trực tiếp, các tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng, và các phần phụ thuộc theo đồ thị import cục bộ. Các chỉnh sửa config/setup/package không chạy kiểm thử diện rộng trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường cho công việc hẹp. Nó phân loại diff thành core, kiểm thử core, extensions, kiểm thử extension, apps, docs, metadata phát hành, công cụ Docker live, và tooling, rồi chạy các lệnh typecheck, lint, và guard tương ứng. Nó không chạy kiểm thử Vitest; hãy gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các lần tăng phiên bản chỉ liên quan đến metadata phát hành chạy kiểm tra phiên bản/config/phụ thuộc gốc có mục tiêu, kèm một guard từ chối thay đổi package bên ngoài trường phiên bản cấp cao nhất.
    - Các chỉnh sửa harness ACP Docker live chạy kiểm tra tập trung: cú pháp shell cho các script xác thực Docker live và một lần dry-run bộ lập lịch Docker live. Các thay đổi `package.json` chỉ được bao gồm khi diff giới hạn ở `scripts["test:docker:live-*"]`; các chỉnh sửa phụ thuộc, export, phiên bản, và bề mặt package khác vẫn dùng các guard rộng hơn.
    - Các kiểm thử đơn vị nhẹ về import từ agents, commands, plugins, helper auto-reply, `plugin-sdk`, và các khu vực tiện ích thuần tương tự được định tuyến qua làn `unit-fast`, làn này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng về runtime vẫn ở các làn hiện có.
    - Một số tệp nguồn helper `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy chế độ changed sang kiểm thử cùng cấp rõ ràng trong các làn nhẹ đó, để chỉnh sửa helper tránh chạy lại toàn bộ bộ kiểm thử nặng cho thư mục đó.
    - `auto-reply` có các bucket riêng cho helper core cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất, và cây con `src/auto-reply/reply/**`. CI tiếp tục tách cây con reply thành các shard agent-runner, dispatch, và commands/state-routing để một bucket nặng import không sở hữu toàn bộ phần đuôi Node.
    - CI PR/main thông thường cố ý bỏ qua sweep theo lô extension và shard chỉ dành cho phát hành `agentic-plugins`. Full Release Validation dispatch workflow con `Plugin Prerelease` riêng cho các bộ kiểm thử nặng về plugin/extension đó trên các release candidate.

  </Accordion>

  <Accordion title="Độ phủ runner nhúng">

    - Khi bạn thay đổi input khám phá message-tool hoặc ngữ cảnh runtime
      compaction, hãy giữ cả hai cấp độ phủ.
    - Thêm các hồi quy helper tập trung cho các ranh giới định tuyến và chuẩn hóa
      thuần.
    - Giữ các bộ kiểm thử tích hợp runner nhúng hoạt động tốt:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, và
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ này xác minh rằng scoped ids và hành vi compaction vẫn đi qua
      các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ helper
      không phải là thay thế đủ cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Mặc định pool và cô lập của Vitest">

    - Config Vitest cơ sở mặc định là `threads`.
    - Config Vitest dùng chung cố định `isolate: false` và dùng runner
      không cô lập trên các dự án gốc, e2e, và config live.
    - Làn UI gốc giữ setup và optimizer `jsdom` của nó, nhưng cũng chạy trên
      runner không cô lập dùng chung.
    - Mỗi shard `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false`
      từ config Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình
      Node con của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8
      mặc định.
    - `scripts/run-vitest.mjs` kết thúc các lần chạy Vitest non-watch rõ ràng sau
      5 phút không có output stdout hoặc stderr. Đặt
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` để tắt watchdog cho một
      cuộc điều tra chủ ý im lặng.

  </Accordion>

  <Accordion title="Lặp cục bộ nhanh">

    - `pnpm changed:lanes` hiển thị các làn kiến trúc mà một diff kích hoạt.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck, hoặc kiểm thử.
    - Chạy `pnpm check:changed` rõ ràng trước khi bàn giao hoặc push khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các làn có phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      quyết định một chỉnh sửa harness, config, package, hoặc contract thật sự cần
      độ phủ Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ cùng hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động mở rộng worker cục bộ cố ý thận trọng và lùi lại
      khi load average của host đã cao, nên nhiều lần chạy Vitest đồng thời
      mặc định gây ít tác động hơn.
    - Config Vitest cơ sở đánh dấu các tệp projects/config là
      `forceRerunTriggers` để các lần chạy lại chế độ changed vẫn đúng khi
      wiring kiểm thử thay đổi.
    - Config giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` bật trên các host được hỗ trợ;
      đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache rõ ràng cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Gỡ lỗi hiệu năng">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cộng với
      output phân rã import.
    - `pnpm test:perf:imports:changed` giới hạn cùng chế độ xem profiling vào
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian shard được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn config dùng đường dẫn config làm khóa; các shard CI
      theo include-pattern nối thêm tên shard để các shard đã lọc có thể được theo dõi
      riêng.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho import khởi động,
      hãy giữ các phụ thuộc nặng phía sau một seam `*.runtime.ts` cục bộ hẹp và
      mock seam đó trực tiếp thay vì deep-import helper runtime chỉ
      để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn root-project native cho diff đã commit đó
      và in wall time cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây bẩn hiện tại
      bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và config Vitest gốc.
    - `pnpm test:perf:profile:main` ghi profile CPU main-thread cho
      overhead khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi profile CPU+heap của runner cho
      bộ kiểm thử đơn vị khi tắt song song theo tệp.

  </Accordion>
</AccordionGroup>

### Độ ổn định (gateway)

- Lệnh: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, bị buộc dùng một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với diagnostics mặc định được bật
  - Đẩy churn thông điệp gateway, bộ nhớ, và payload lớn tổng hợp qua đường dẫn sự kiện diagnostic
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các helper lưu bền bundle ổn định diagnostic
  - Assert rằng recorder vẫn được giới hạn, mẫu RSS tổng hợp nằm dưới ngân sách áp lực, và độ sâu hàng đợi theo phiên rút về không
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Làn hẹp cho theo dõi hồi quy ổn định, không phải là thay thế cho toàn bộ bộ Gateway

### E2E (tổng hợp repo)

- Lệnh: `pnpm test:e2e`
- Phạm vi:
  - Chạy làn E2E smoke Gateway
  - Chạy làn E2E trình duyệt Control UI được mock
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Yêu cầu Playwright Chromium đã được cài đặt

### E2E (smoke Gateway)

- Lệnh: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và kiểm thử E2E bundled-plugin trong `extensions/`
- Mặc định runtime:
  - Dùng `threads` của Vitest với `isolate: false`, khớp với phần còn lại của repo.
  - Dùng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ silent để giảm overhead I/O console.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để buộc số lượng worker (giới hạn ở 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại output console verbose.
- Phạm vi:
  - Hành vi gateway end-to-end nhiều instance
  - Bề mặt WebSocket/HTTP, ghép cặp node, và networking nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không yêu cầu khóa thật
  - Nhiều thành phần chuyển động hơn kiểm thử đơn vị (có thể chậm hơn)

### E2E (trình duyệt Control UI được mock)

- Lệnh: `pnpm test:ui:e2e`
- Config: `test/vitest/vitest.ui-e2e.config.ts`
- Tệp: `ui/src/**/*.e2e.test.ts`
- Phạm vi:
  - Khởi động Vite Control UI
  - Điều khiển một trang Chromium thật qua Playwright
  - Thay thế Gateway WebSocket bằng các mock trong trình duyệt có tính xác định
- Kỳ vọng:
  - Chạy trong CI như một phần của `pnpm test:e2e`
  - Không yêu cầu Gateway, agents, hoặc khóa provider thật
  - Phải có phụ thuộc trình duyệt (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke backend OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Tái sử dụng một gateway OpenShell cục bộ đang hoạt động
  - Tạo sandbox từ một Dockerfile cục bộ tạm thời
  - Chạy backend OpenShell của OpenClaw qua `sandbox ssh-config` + SSH exec thật
  - Xác minh hành vi hệ thống tệp remote-canonical qua cầu nối sandbox fs
- Kỳ vọng:
  - Chỉ opt-in; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cộng với một Docker daemon hoạt động
  - Yêu cầu một gateway OpenShell cục bộ đang hoạt động và nguồn config của nó
  - Dùng `HOME` / `XDG_CONFIG_HOME` cô lập, rồi hủy sandbox kiểm thử
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới binary CLI hoặc wrapper script không mặc định
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` để phơi bày config gateway đã đăng ký cho kiểm thử cô lập
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` để ghi đè IP Gateway Docker được fixture chính sách host sử dụng

### Live (provider thật + model thật)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các bài kiểm thử trực tiếp của Plugin đóng gói trong `extensions/`
- Mặc định: được **bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - "Nhà cung cấp/mô hình này có thực sự hoạt động _hôm nay_ với thông tin xác thực thật không?"
  - Phát hiện thay đổi định dạng của nhà cung cấp, điểm đặc thù khi gọi công cụ, vấn đề xác thực và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế, không ổn định cho CI (mạng thật, chính sách nhà cung cấp thật, hạn ngạch, sự cố ngừng dịch vụ)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con đã thu hẹp thay vì "mọi thứ"
- Các lần chạy trực tiếp dùng API key đã xuất sẵn và hồ sơ xác thực đã chuẩn bị.
- Theo mặc định, các lần chạy trực tiếp vẫn cô lập `HOME` và sao chép vật liệu cấu hình/xác thực vào thư mục home kiểm thử tạm thời để fixture đơn vị không thể làm thay đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn chủ ý cần bài kiểm thử trực tiếp dùng thư mục home thật của mình.
- `pnpm test:live` mặc định ở chế độ yên tĩnh hơn: giữ đầu ra tiến trình `[live] ...` và tắt log khởi động gateway/nhiễu Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn bật lại đầy đủ log khởi động.
- Xoay vòng API key (theo từng nhà cung cấp): đặt `*_API_KEYS` với định dạng dấu phẩy/dấu chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè theo từng lần chạy trực tiếp qua `OPENCLAW_LIVE_*_KEY`; các bài kiểm thử sẽ thử lại khi nhận phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ kiểm thử trực tiếp hiện phát dòng tiến trình ra stderr để các lệnh gọi nhà cung cấp chạy lâu vẫn thấy đang hoạt động ngay cả khi Vitest đang im lặng do thu console.
  - `vitest.live.config.ts` tắt chặn console của Vitest để dòng tiến trình của nhà cung cấp/gateway được stream ngay trong các lần chạy trực tiếp.
  - Điều chỉnh Heartbeat mô hình trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Điều chỉnh Heartbeat gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ nào?

Dùng bảng quyết định này:

- Sửa logic/bài kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn thay đổi nhiều)
- Chạm tới mạng gateway / giao thức WS / ghép cặp: thêm `pnpm test:e2e`
- Gỡ lỗi "bot của tôi bị down" / lỗi theo nhà cung cấp / gọi công cụ: chạy `pnpm test:live` đã thu hẹp

## Bài kiểm thử trực tiếp (chạm mạng)

Đối với ma trận mô hình trực tiếp, smoke backend CLI, smoke ACP, harness máy chủ ứng dụng Codex và tất cả bài kiểm thử trực tiếp của nhà cung cấp media (Deepgram, BytePlus, ComfyUI, hình ảnh, nhạc, video, media harness) - cùng với xử lý thông tin xác thực cho các lần chạy trực tiếp - xem [Kiểm thử các bộ trực tiếp](/vi/help/testing-live). Với checklist chuyên biệt cho cập nhật và xác thực Plugin, xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Trình chạy Docker (kiểm tra tùy chọn "hoạt động trên Linux")

Các trình chạy Docker này chia thành hai nhóm:

- Trình chạy mô hình trực tiếp: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp trực tiếp theo khóa hồ sơ tương ứng của chúng bên trong ảnh Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), mount thư mục cấu hình cục bộ, workspace và tệp env hồ sơ tùy chọn của bạn. Các entrypoint cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Trình chạy trực tiếp Docker giữ các giới hạn thực tế riêng khi cần:
  `test:docker:live-models` mặc định dùng tập được tuyển chọn gồm các mục được hỗ trợ và có tín hiệu cao, còn
  `test:docker:live-gateway` mặc định dùng `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Đặt `OPENCLAW_LIVE_MAX_MODELS`
  hoặc các biến env gateway khi bạn chủ ý muốn giới hạn nhỏ hơn hoặc quét rộng hơn.
- `test:docker:all` xây dựng ảnh Docker trực tiếp một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần thành tarball npm qua `scripts/package-openclaw-for-docker.mjs`, rồi xây dựng/tái sử dụng hai ảnh `scripts/e2e/Dockerfile`. Ảnh trần chỉ là trình chạy Node/Git cho các lane cài đặt/cập nhật/phụ thuộc Plugin; các lane đó mount tarball đã dựng sẵn. Ảnh chức năng cài cùng tarball đó vào `/app` cho các lane chức năng ứng dụng đã dựng. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Tập hợp dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` điều khiển số slot tiến trình, còn giới hạn tài nguyên ngăn các lane nặng về trực tiếp, cài npm và đa dịch vụ cùng khởi động một lúc. Nếu một lane đơn lẻ nặng hơn các giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động lane đó khi pool trống rồi để nó chạy một mình cho đến khi lại có dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ điều chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi máy chủ Docker còn nhiều dư địa hơn. Trình chạy mặc định thực hiện preflight Docker, gỡ bỏ container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời lượng lane thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời lượng đó để khởi động lane lâu hơn trước trong các lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane có trọng số mà không xây dựng hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các lane đã chọn, nhu cầu package/ảnh và thông tin xác thực.
- `Package Acceptance` là cổng package gốc GitHub cho câu hỏi "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một package ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, tải lên dưới dạng `package-under-test`, rồi chạy các lane Docker E2E tái sử dụng với đúng tarball đó thay vì đóng gói lại ref đã chọn. Các hồ sơ được sắp theo độ bao quát: `smoke`, `package`, `product`, và `full`. Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng package/cập nhật/Plugin, ma trận sống sót sau nâng cấp đã phát hành, mặc định phát hành và phân loại lỗi.
- Kiểm tra build và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Guard duyệt đồ thị đã dựng tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và thất bại nếu phần khởi động trước dispatch import các phụ thuộc package như Commander, prompt UI, undici, hoặc logging trước khi dispatch lệnh; nó cũng giữ chunk chạy gateway đóng gói trong ngân sách và từ chối import tĩnh các đường dẫn gateway lạnh đã biết. Smoke CLI đã đóng gói cũng bao phủ trợ giúp gốc, trợ giúp onboard, trợ giúp doctor, trạng thái, schema cấu hình và lệnh liệt kê mô hình.
- Khả năng tương thích legacy của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Đến mốc đó, harness chỉ dung thứ các khoảng trống metadata của package đã phát hành: mục inventory QA riêng tư bị bỏ qua, thiếu `gateway install --wrapper`, thiếu tệp patch trong fixture git suy ra từ tarball, thiếu `update.channel` đã lưu, vị trí bản ghi cài đặt Plugin legacy, thiếu lưu bản ghi cài đặt marketplace và di trú metadata cấu hình trong `plugins update`. Với package sau `2026.4.25`, các đường dẫn đó là lỗi nghiêm ngặt.
- Trình chạy smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.
- Các lane Docker/Bash E2E cài tarball OpenClaw đã đóng gói qua `scripts/lib/openclaw-e2e-instance.sh` giới hạn `npm install` ở `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (mặc định `600s`; đặt `0` để tắt wrapper khi gỡ lỗi).

Các trình chạy Docker mô hình trực tiếp cũng chỉ bind-mount các home xác thực CLI cần thiết (hoặc tất cả home được hỗ trợ khi lần chạy không bị thu hẹp), rồi sao chép chúng vào home container trước khi chạy để OAuth của CLI bên ngoài có thể làm mới token mà không làm thay đổi kho xác thực trên host:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với phạm vi Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness máy chủ ứng dụng Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke khả năng quan sát: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, và `pnpm qa:observability:smoke` là các lane checkout nguồn QA riêng tư. Chúng cố ý không nằm trong lane phát hành Docker package vì tarball npm bỏ qua QA Lab.
- Smoke trực tiếp Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, scaffolding đầy đủ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/kênh/agent tarball npm: `pnpm test:docker:npm-onboard-channel-agent` cài đặt tarball OpenClaw đã đóng gói một cách toàn cục trong Docker, cấu hình OpenAI qua onboarding tham chiếu env cùng với Telegram theo mặc định, chạy doctor và chạy một lượt agent OpenAI giả lập. Tái sử dụng tarball đã dựng sẵn bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua dựng lại trên host bằng `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc chuyển kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` hoặc `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Smoke hành trình người dùng bản phát hành: `pnpm test:docker:release-user-journey` cài đặt OpenClaw tarball đã đóng gói trên toàn cục trong một Docker home sạch, chạy onboarding, cấu hình một provider OpenAI được mock, chạy một lượt agent, cài đặt/gỡ cài đặt Plugin bên ngoài, cấu hình ClickClack với một fixture cục bộ, xác minh nhắn tin đi/đến, khởi động lại Gateway và chạy doctor.
- Smoke onboarding có kiểu cho bản phát hành: `pnpm test:docker:release-typed-onboarding` cài đặt tarball đã đóng gói, điều khiển `openclaw onboard` qua một TTY thật, cấu hình OpenAI làm provider env-ref, xác minh không lưu khóa thô, và chạy một lượt agent được mock.
- Smoke media/memory bản phát hành: `pnpm test:docker:release-media-memory` cài đặt tarball đã đóng gói, xác minh khả năng hiểu hình ảnh từ tệp đính kèm PNG, đầu ra tạo ảnh tương thích OpenAI, truy hồi tìm kiếm bộ nhớ, và khả năng truy hồi vẫn tồn tại sau khi khởi động lại Gateway.
- Smoke hành trình người dùng nâng cấp bản phát hành: `pnpm test:docker:release-upgrade-user-journey` mặc định cài đặt baseline đã phát hành mới nhất cũ hơn tarball ứng viên, cấu hình trạng thái provider/Plugin/ClickClack trên package đã phát hành, nâng cấp lên tarball ứng viên, rồi chạy lại hành trình agent/Plugin/kênh cốt lõi. Nếu không có baseline đã phát hành cũ hơn, nó dùng lại phiên bản ứng viên. Ghi đè baseline bằng `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Smoke marketplace Plugin bản phát hành: `pnpm test:docker:release-plugin-marketplace` cài đặt từ một marketplace fixture cục bộ, cập nhật Plugin đã cài đặt, gỡ cài đặt nó, và xác minh CLI của Plugin biến mất cùng với metadata cài đặt đã được lược bỏ.
- Smoke cài đặt Skill: `pnpm test:docker:skill-install` cài đặt OpenClaw tarball đã đóng gói trên toàn cục trong Docker, tắt cài đặt archive đã tải lên trong config, phân giải slug Skills ClawHub live hiện tại từ tìm kiếm, cài đặt nó bằng `openclaw skills install`, và xác minh Skills đã cài đặt cùng metadata nguồn/khóa `.clawhub`.
- Smoke chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt OpenClaw tarball đã đóng gói trên toàn cục trong Docker, chuyển từ package `stable` sang git `dev`, xác minh kênh đã lưu và hoạt động sau cập nhật của Plugin, rồi chuyển lại về package `stable` và kiểm tra trạng thái cập nhật.
- Smoke sống sót sau nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt OpenClaw tarball đã đóng gói lên trên một fixture người dùng cũ bẩn có agent, config kênh, allowlist Plugin, trạng thái phụ thuộc Plugin lỗi thời, và các tệp workspace/session hiện có. Nó chạy cập nhật package cùng doctor không tương tác mà không có khóa provider hoặc kênh live, rồi khởi động một Gateway loopback và kiểm tra việc bảo toàn config/trạng thái cùng ngân sách khởi động/trạng thái.
- Smoke sống sót sau nâng cấp đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, seed các tệp người dùng hiện có thực tế, cấu hình baseline đó bằng một công thức lệnh được nhúng sẵn, xác thực config kết quả, cập nhật bản cài đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway loopback và kiểm tra intent đã cấu hình, bảo toàn trạng thái, khởi động, `/healthz`, `/readyz`, và ngân sách trạng thái RPC. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các baseline cục bộ chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, và mở rộng các fixture dạng issue bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; bộ reported-issues bao gồm `configured-plugin-installs` để tự động sửa cài đặt Plugin OpenClaw bên ngoài. Package Acceptance phơi bày các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, và `published_upgrade_survivor_scenarios`, phân giải token baseline meta như `last-stable-4` hoặc `all-since-2026.4.23`, và Full Release Validation mở rộng cổng package release-soak thành `last-stable-4 2026.4.23 2026.5.2 2026.4.15` cộng với `reported-issues`.
- Smoke ngữ cảnh runtime session: `pnpm test:docker:session-runtime-context` xác minh việc lưu transcript ngữ cảnh runtime ẩn cùng sửa chữa doctor cho các nhánh prompt-rewrite bị trùng lặp chịu ảnh hưởng.
- Smoke cài đặt Bun toàn cục: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt nó bằng `bun install -g` trong một home cô lập, và xác minh `openclaw infer image providers --json` trả về các provider hình ảnh đi kèm thay vì treo. Dùng lại tarball đã dựng sẵn bằng `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bản dựng host bằng `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một Docker image đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` chia sẻ một npm cache giữa các container root, update, và direct-npm của nó. Smoke cập nhật mặc định dùng npm `latest` làm baseline ổn định trước khi nâng cấp lên tarball ứng viên. Ghi đè bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` cục bộ, hoặc bằng input `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra installer không phải root giữ một npm cache cô lập để các mục cache do root sở hữu không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để dùng lại cache root/update/direct-npm giữa các lần chạy lại cục bộ.
- Install Smoke CI bỏ qua cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy script cục bộ không có env đó khi cần độ phủ `npm install -g` trực tiếp.
- Smoke CLI xóa agent có workspace dùng chung: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng image Dockerfile gốc, seed hai agent với một workspace trong một container home cô lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Dùng lại image install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng image E2E nguồn cộng với một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao phủ URL liên kết, mục có thể nhấp được thăng cấp từ con trỏ, tham chiếu iframe, và metadata frame.
- Hồi quy reasoning tối thiểu của OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một server OpenAI được mock qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, rồi buộc schema provider từ chối và kiểm tra chi tiết thô xuất hiện trong log Gateway.
- Cầu nối kênh MCP (Gateway đã seed + cầu nối stdio + smoke notification-frame Claude thô): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP bundle OpenClaw (server MCP stdio thật + smoke cho phép/từ chối profile OpenClaw nhúng): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP Cron/subagent (Gateway thật + teardown tiến trình con MCP stdio sau các lần chạy cron cô lập và subagent một lần): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, npm registry với phụ thuộc hoisted, metadata package npm sai định dạng, ref git di chuyển, ClawHub kitchen-sink, cập nhật marketplace, và bật/kiểm tra Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp package/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Nếu không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, bài kiểm thử dùng một server fixture ClawHub cục bộ hermetic.
- Smoke cập nhật Plugin không đổi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke ma trận vòng đời Plugin: `pnpm test:docker:plugin-lifecycle-matrix` cài đặt OpenClaw tarball đã đóng gói trong một container trống, cài đặt một Plugin npm, bật/tắt enable/disable, nâng cấp và hạ cấp nó qua một npm registry cục bộ, xóa code đã cài đặt, rồi xác minh uninstall vẫn xóa trạng thái lỗi thời đồng thời ghi log metric RSS/CPU cho từng pha vòng đời.
- Smoke metadata tải lại config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` bao phủ smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, npm registry với phụ thuộc hoisted, ref git di chuyển, fixture ClawHub, cập nhật marketplace, và bật/kiểm tra Claude-bundle. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không đổi cho Plugin đã cài đặt. `pnpm test:docker:plugin-lifecycle-matrix` bao phủ cài đặt Plugin npm có theo dõi tài nguyên, enable, disable, upgrade, downgrade, và uninstall khi thiếu code.

Để dựng trước và dùng lại image chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image theo bộ kiểm thử như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ đến một image dùng chung từ xa, các script sẽ pull nó nếu nó chưa có cục bộ. Các bài kiểm thử QR và Docker installer giữ Dockerfile riêng vì chúng xác thực hành vi package/cài đặt thay vì runtime ứng dụng đã dựng dùng chung.

Các runner Docker live-model cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Cách này giữ cho image
runtime gọn nhẹ trong khi vẫn chạy Vitest trên đúng nguồn/cấu hình cục bộ của bạn.
Bước staging bỏ qua các cache lớn chỉ dùng cục bộ và output build ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục output `.build`
cục bộ theo ứng dụng hoặc Gradle để các lần chạy Docker live không tốn nhiều phút
sao chép artifact đặc thù của máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các probe live của gateway không khởi động
worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền cả
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi kiểm thử live
gateway khỏi lane Docker đó.
`test:docker:openwebui` là smoke tương thích ở mức cao hơn: nó khởi động một
container Gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI đã ghim phiên bản trỏ tới gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` hiển thị `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Đặt `OPENWEBUI_SMOKE_MODE=models` cho các kiểm tra CI theo đường phát hành cần dừng
sau khi đăng nhập Open WebUI và khám phá model, không chờ một lượt hoàn tất live model.
Lần chạy đầu tiên có thể chậm hơn đáng kể vì Docker có thể cần kéo image
Open WebUI và Open WebUI có thể cần hoàn tất thiết lập cold-start riêng.
Lane này cần một khóa live model dùng được. Cung cấp khóa đó qua môi trường tiến trình,
các hồ sơ auth đã stage, hoặc một `OPENCLAW_PROFILE_FILE` rõ ràng.
Các lần chạy thành công in một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính xác định và không cần tài khoản
Telegram, Discord, hoặc iMessage thật. Nó boot một container Gateway đã seed,
khởi động container thứ hai để spawn `openclaw mcp serve`, rồi xác minh khám phá
hội thoại đã định tuyến, đọc transcript, metadata attachment, hành vi hàng đợi sự kiện live,
định tuyến gửi outbound, và thông báo kênh + quyền kiểu Claude qua bridge MCP stdio thật.
Kiểm tra thông báo sẽ kiểm tra trực tiếp các frame MCP stdio thô để smoke xác thực thứ mà
bridge thực sự phát ra, không chỉ thứ mà một client SDK cụ thể tình cờ hiển thị.
`test:docker:agent-bundle-mcp-tools` có tính xác định và không cần khóa live
model. Nó build image Docker của repo, khởi động một server probe MCP stdio thật
bên trong container, materialize server đó qua runtime MCP bundle OpenClaw nhúng,
thực thi tool, rồi xác minh `coding` và `messaging` giữ lại các tool
`bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa live model.
Nó khởi động một Gateway đã seed với một server probe MCP stdio thật, chạy một
lượt cron cô lập và một lượt con one-shot `sessions_spawn`, rồi xác minh
tiến trình con MCP thoát sau mỗi lần chạy.

Smoke thread ACP ngôn ngữ tự nhiên thủ công (không thuộc CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow hồi quy/gỡ lỗi. Có thể cần dùng lại để xác thực định tuyến thread ACP, vì vậy đừng xóa nó.

Các env var hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` được mount và source trước khi chạy kiểm thử
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các env var được source từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục cấu hình/workspace tạm thời và không mount auth CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các bản cài CLI được cache bên trong Docker
- Các thư mục/tệp auth CLI bên ngoài dưới `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi kiểm thử bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy thu hẹp theo provider chỉ mount những thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc provider trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để tái sử dụng image `openclaw:local-live` hiện có cho các lần chạy lại không cần build lại
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để bảo đảm thông tin xác thực đến từ kho hồ sơ (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn model được gateway hiển thị cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce mà smoke Open WebUI dùng
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã ghim

## Kiểm tra hợp lý tài liệu

Chạy kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra heading trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy offline (an toàn cho CI)

Đây là các hồi quy "pipeline thật" không dùng provider thật:

- Gọi tool qua Gateway (mock OpenAI, gateway thật + vòng lặp agent thật): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Trình hướng dẫn Gateway (WS `wizard.start`/`wizard.next`, ghi cấu hình + bắt buộc auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Đánh giá độ tin cậy agent (Skills)

Chúng ta đã có một vài kiểm thử an toàn cho CI hoạt động như "đánh giá độ tin cậy agent":

- Gọi tool mock qua Gateway thật + vòng lặp agent (`src/gateway/gateway.test.ts`).
- Các flow trình hướng dẫn end-to-end xác thực wiring phiên và tác động cấu hình (`src/gateway/gateway.test.ts`).

Những gì vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi Skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh những skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi dùng và làm theo các bước/args bắt buộc không?
- **Hợp đồng workflow:** các kịch bản nhiều lượt xác nhận thứ tự tool, carryover lịch sử phiên, và ranh giới sandbox.

Các eval trong tương lai trước hết nên giữ tính xác định:

- Một scenario runner dùng provider mock để xác nhận các lệnh gọi tool + thứ tự, đọc tệp skill, và wiring phiên.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng so với tránh, gating, prompt injection).
- Evals live tùy chọn (opt-in, có cổng env) chỉ sau khi bộ an toàn cho CI đã có sẵn.

## Kiểm thử hợp đồng (hình dạng plugin và kênh)

Kiểm thử hợp đồng xác minh rằng mọi plugin và kênh đã đăng ký tuân thủ
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

- **plugin** - Hình dạng plugin cơ bản (id, tên, capabilities)
- **setup** - Hợp đồng trình hướng dẫn thiết lập
- **session-binding** - Hành vi liên kết phiên
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn inbound
- **actions** - Handler action kênh
- **threading** - Xử lý ID thread
- **directory** - API directory/roster
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
- **discovery** - Khám phá Plugin
- **loader** - Tải Plugin
- **runtime** - Runtime provider
- **shape** - Hình dạng/interface Plugin
- **wizard** - Trình hướng dẫn thiết lập

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa một plugin kênh hoặc provider
- Sau khi refactor đăng ký hoặc khám phá plugin

Kiểm thử hợp đồng chạy trong CI và không yêu cầu khóa API thật.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một sự cố provider/model được phát hiện trong live:

- Thêm hồi quy an toàn cho CI nếu có thể (provider mock/stub, hoặc ghi lại đúng transformation hình dạng request)
- Nếu bản chất là chỉ live (rate limits, chính sách auth), giữ kiểm thử live hẹp và opt-in qua env var
- Ưu tiên nhắm tới lớp nhỏ nhất bắt được lỗi:
  - lỗi chuyển đổi/replay request provider → kiểm thử models trực tiếp
  - lỗi pipeline phiên/lịch sử/tool gateway → smoke live gateway hoặc kiểm thử mock gateway an toàn cho CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` lấy một target mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi assert các exec id có traversal-segment bị từ chối.
  - Nếu bạn thêm một họ target SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong kiểm thử đó. Kiểm thử cố ý fail với các target id chưa được phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Testing live](/vi/help/testing-live)
- [Testing updates and plugins](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
