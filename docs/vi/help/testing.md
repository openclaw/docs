---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Thêm kiểm thử hồi quy cho lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của gateway + tác nhân
summary: 'Bộ kiểm thử: các bộ kiểm thử unit/e2e/live, trình chạy Docker và phạm vi kiểm thử của từng bài kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-07-02T08:27:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53309058c63514c968de3997776e17cf29f58953c4b5325314422d4e9a7cb8d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (unit/integration, e2e, live) và một nhóm nhỏ
các runner Docker. Tài liệu này là hướng dẫn "cách chúng tôi kiểm thử":

- Mỗi bộ kiểm thử bao phủ những gì (và những gì nó chủ ý _không_ bao phủ).
- Những lệnh cần chạy cho các quy trình phổ biến (cục bộ, trước khi push, gỡ lỗi).
- Cách các kiểm thử live phát hiện thông tin xác thực và chọn model/provider.
- Cách thêm hồi quy cho các sự cố model/provider trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các lane truyền tải live)** được ghi tài liệu riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) - kiến trúc, bề mặt lệnh, biên soạn kịch bản.
- [Matrix QA](/vi/concepts/qa-matrix) - tham chiếu cho `pnpm openclaw qa matrix`.
- [Bảng điểm độ trưởng thành](/vi/maturity/scorecard) - cách bằng chứng QA phát hành hỗ trợ các quyết định về độ ổn định và LTS.
- [Kênh QA](/vi/channels/qa-channel) - Plugin truyền tải tổng hợp được dùng bởi các kịch bản dựa trên repo.

Trang này bao phủ việc chạy các bộ kiểm thử thông thường và các runner Docker/Parallels. Phần runner dành riêng cho QA bên dưới ([Runner dành riêng cho QA](#qa-specific-runners)) liệt kê các lệnh gọi `qa` cụ thể và trỏ lại các tham chiếu ở trên.
</Note>

## Bắt đầu nhanh

Hầu hết các ngày:

- Cổng kiểm tra đầy đủ (được kỳ vọng trước khi push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy dư tài nguyên: `pnpm test:max`
- Vòng lặp theo dõi Vitest trực tiếp: `pnpm test:watch`
- Nhắm trực tiếp tới tệp hiện cũng định tuyến cả các đường dẫn extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Ưu tiên các lần chạy có mục tiêu trước khi bạn đang lặp trên một lỗi đơn lẻ.
- Trang QA dựa trên Docker: `pnpm qa:lab:up`
- Lane QA dựa trên VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn chạm vào kiểm thử hoặc muốn thêm độ tin cậy:

- Cổng coverage: `pnpm test:coverage`
- Bộ kiểm thử E2E: `pnpm test:e2e`

## Thư mục tạm cho kiểm thử

Ưu tiên các helper dùng chung trong `test/helpers/temp-dir.ts` cho các thư mục
tạm thời do kiểm thử sở hữu. Chúng làm rõ quyền sở hữu và giữ việc dọn dẹp trong cùng
vòng đời kiểm thử:

```ts
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker();

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker()` cố ý không cung cấp phương thức dọn dẹp thủ công; Vitest
sở hữu việc dọn dẹp sau mỗi kiểm thử. Các helper cấp thấp hiện có vẫn giữ lại cho những kiểm thử
chưa chuyển đổi, nhưng các kiểm thử mới và đã được di chuyển nên dùng tracker
tự động dọn dẹp. Tránh cách dùng thủ công mới với `makeTempDir`, `cleanupTempDirs`, hoặc
`createTempDirTracker` và tránh các lệnh gọi trần `fs.mkdtemp*` mới trong kiểm thử
trừ khi một trường hợp đang xác minh rõ ràng hành vi temp-dir thô. Thêm một chú thích cho phép
có thể kiểm toán với lý do cụ thể khi một kiểm thử cố ý cần một thư mục tạm trần:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

Để hiển thị tiến trình di chuyển, `node scripts/report-test-temp-creations.mjs` báo cáo
việc tạo temp-dir trần mới và cách dùng helper dùng chung thủ công mới trong các dòng diff
được thêm mà không chặn các kiểu dọn dẹp hiện có. Phạm vi tệp của nó cố ý
theo cùng phân loại đường dẫn kiểm thử được dùng bởi `scripts/changed-lanes.mjs`
thay vì duy trì một heuristic tên tệp test-helper riêng, đồng thời bỏ qua
chính phần triển khai helper dùng chung. `check:changed` chạy báo cáo này cho
các đường dẫn kiểm thử đã thay đổi như một tín hiệu CI chỉ cảnh báo; các phát hiện là
chú thích cảnh báo GitHub, không phải lỗi thất bại.

Khi gỡ lỗi provider/model thật (cần thông tin xác thực thật):

- Bộ kiểm thử live (model + đầu dò công cụ/hình ảnh Gateway): `pnpm test:live`
- Nhắm tới một tệp live trong im lặng: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng runtime: dispatch `OpenClaw Performance` với
  `live_openai_candidate=true` cho một lượt agent thật `openai/gpt-5.5` hoặc
  `deep_profile=true` cho artifact CPU/heap/trace Kova. Các lần chạy theo lịch hằng ngày
  xuất bản artifact lane mock-provider, deep-profile và GPT 5.5 lên
  `openclaw/clawgrit-reports` khi `CLAWGRIT_REPORTS_TOKEN` được cấu hình. Báo cáo
  mock-provider cũng bao gồm các số liệu ở cấp nguồn về khởi động Gateway, bộ nhớ,
  áp lực Plugin, vòng lặp hello fake-model lặp lại và khởi động CLI.
- Quét model live bằng Docker: `pnpm test:docker:live-models`
  - Mỗi model được chọn hiện chạy một lượt văn bản cộng với một đầu dò nhỏ kiểu đọc tệp.
    Các model có metadata quảng bá đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các đầu dò bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi provider.
  - Coverage CI: cả `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi workflow live/E2E tái sử dụng với
    `include_live_suites: true`, bao gồm các job ma trận model live Docker riêng
    được chia shard theo provider.
  - Để chạy lại CI có trọng tâm, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm các secret provider tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`
    cùng `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các caller
    theo lịch/phát hành của nó.
- Smoke bound-chat Codex native: `pnpm test:docker:live-codex-bind`
  - Chạy một lane live Docker trên đường dẫn app-server Codex, bind một
    Slack DM tổng hợp bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, rồi xác minh một phản hồi thuần và một tuyến tệp đính kèm hình ảnh
    đi qua binding Plugin native thay vì ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt agent Gateway qua harness app-server Codex do Plugin sở hữu,
    xác minh `/codex status` và `/codex models`, và mặc định thực thi các đầu dò hình ảnh,
    cron MCP, sub-agent và Guardian. Tắt đầu dò sub-agent bằng
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập các lỗi app-server
    Codex khác. Để kiểm tra sub-agent có trọng tâm, tắt các đầu dò khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Lệnh này thoát sau đầu dò sub-agent trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Smoke cài đặt Codex theo yêu cầu: `pnpm test:docker:codex-on-demand`
  - Cài đặt tarball OpenClaw đã đóng gói trong Docker, chạy onboarding bằng khóa API
    OpenAI, và xác minh Plugin Codex cùng dependency `@openai/codex`
    đã được tải xuống vào gốc dự án npm được quản lý theo yêu cầu.
- Smoke dependency công cụ Plugin live: `pnpm test:docker:live-plugin-tool`
  - Đóng gói một Plugin fixture có dependency `slugify` thật, cài đặt nó qua
    `npm-pack:`, xác minh dependency dưới gốc dự án npm được quản lý,
    rồi yêu cầu một model OpenAI live gọi công cụ Plugin và trả về slug ẩn.
- Smoke lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra belt-and-suspenders dạng opt-in cho bề mặt lệnh cứu hộ kênh tin nhắn.
    Nó thực thi `/crestodian status`, xếp hàng một thay đổi model bền vững,
    phản hồi `/crestodian yes`, và xác minh đường dẫn ghi audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Chạy Crestodian trong container không có cấu hình với Claude CLI giả trên `PATH`
    và xác minh fallback planner mờ được dịch thành một thao tác ghi cấu hình có kiểu và được audit.
- Smoke Docker lần chạy đầu Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ thư mục trạng thái OpenClaw trống, xác minh entrypoint Crestodian onboard
    hiện đại, áp dụng các ghi setup/model/agent/Plugin Discord + SecretRef,
    xác thực cấu hình và xác minh các mục audit. Cùng đường dẫn thiết lập Ring 0
    cũng được bao phủ trong QA Lab bởi
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke chi phí Moonshot/Kimi: với `MOONSHOT_API_KEY` được đặt, chạy
  `openclaw models list --provider moonshot --json`, rồi chạy một lượt cô lập
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  với `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và transcript
  assistant lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một trường hợp thất bại, ưu tiên thu hẹp kiểm thử live qua các biến môi trường allowlist được mô tả bên dưới.
</Tip>

## Runner dành riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần tính thực tế của QA-lab:

CI chạy QA Lab trong các workflow chuyên dụng. Tính tương đương agentic được lồng dưới
`QA-Lab - All Lanes` và xác thực phát hành, không phải một workflow PR độc lập.
Xác thực rộng nên dùng `Full Release Validation` với
`rerun_group=qa-parity` hoặc nhóm QA của release-checks. Các kiểm tra phát hành
ổn định/mặc định giữ soak live/Docker toàn diện phía sau `run_release_soak=true`; profile
`full` buộc bật soak. `QA-Lab - All Lanes`
chạy hằng đêm trên `main` và từ dispatch thủ công với lane tương đương mock, lane
Matrix live, lane Telegram live do Convex quản lý và lane Discord live do Convex quản lý
dưới dạng các job song song. QA theo lịch và kiểm tra phát hành truyền Matrix
`--profile fast` một cách tường minh, trong khi CLI Matrix và đầu vào workflow thủ công
mặc định vẫn là `all`; dispatch thủ công có thể chia shard `all` thành các job
`transport`, `media`, `e2ee-smoke`, `e2ee-deep`, và `e2ee-cli`. `OpenClaw Release
Checks` chạy tính tương đương cộng với các lane Matrix nhanh và Telegram trước phê duyệt
phát hành, dùng `mock-openai/gpt-5.5` cho kiểm tra truyền tải phát hành để chúng luôn
xác định và tránh khởi động provider-plugin thông thường. Các Gateway truyền tải live này
tắt tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ tương đương QA.

Các shard media live phát hành đầy đủ dùng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các shard model/backend live Docker dùng image dùng chung
`ghcr.io/openclaw/openclaw-live-test:<sha>` được build một lần cho mỗi commit
được chọn, rồi pull nó với `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì rebuild
bên trong từng shard.

- `pnpm openclaw qa suite`
  - Chạy các kịch bản QA dựa trên repo trực tiếp trên host.
  - Ghi các artifact cấp cao nhất `qa-evidence.json`, `qa-suite-summary.json` và
    `qa-suite-report.md` cho tập kịch bản đã chọn, bao gồm các lựa chọn kịch bản
    mixed flow, Vitest và Playwright.
  - Khi được điều phối bởi `pnpm openclaw qa run --qa-profile <profile>`, nhúng
    scorecard hồ sơ taxonomy đã chọn vào cùng `qa-evidence.json`.
    `smoke-ci` ghi evidence gọn, đặt `evidenceMode: "slim"` và bỏ qua
    `execution` theo từng mục. `release` bao phủ phần release-readiness được tuyển chọn;
    `all` chọn mọi danh mục maturity đang hoạt động và dành cho các lần điều phối workflow
    Profile Evidence QA rõ ràng khi cần artifact scorecard đầy đủ.
  - Mặc định chạy song song nhiều kịch bản đã chọn bằng các worker Gateway
    tách biệt. `qa-channel` mặc định concurrency là 4 (bị giới hạn bởi số lượng
    kịch bản đã chọn). Dùng `--concurrency <count>` để tinh chỉnh số lượng worker,
    hoặc `--concurrency 1` cho làn serial cũ hơn.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có exit code thất bại.
  - Hỗ trợ các chế độ nhà cung cấp `live-frontier`, `mock-openai` và `aimock`.
    `aimock` khởi động một server nhà cung cấp cục bộ dựa trên AIMock để có coverage
    fixture và protocol-mock thử nghiệm mà không thay thế làn `mock-openai`
    nhận biết kịch bản.
- `pnpm openclaw qa coverage --match <query>`
  - Tìm kiếm ID kịch bản, tiêu đề, surface, ID coverage, tham chiếu tài liệu, tham chiếu mã,
    Plugin và yêu cầu nhà cung cấp, rồi in các mục tiêu suite khớp.
  - Dùng lệnh này trước một lần chạy QA Lab khi bạn biết hành vi hoặc đường dẫn tệp bị chạm tới
    nhưng không biết kịch bản nhỏ nhất. Lệnh này chỉ mang tính tư vấn; vẫn chọn proof mock,
    live, Multipass, Matrix hoặc transport dựa trên hành vi đang được thay đổi.
- `pnpm test:plugins:kitchen-sink-live`
  - Chạy gauntlet Plugin OpenAI Kitchen Sink live qua QA Lab. Lệnh này
    cài đặt gói Kitchen Sink bên ngoài, xác minh inventory surface SDK Plugin,
    probe `/healthz` và `/readyz`, ghi evidence CPU/RSS của Gateway,
    chạy một lượt OpenAI live, và kiểm tra diagnostics đối kháng.
    Yêu cầu auth OpenAI live như `OPENAI_API_KEY`. Trong các phiên Testbox
    đã hydrate, lệnh tự động source hồ sơ live-auth của Testbox khi có helper
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy bench khởi động Gateway cùng một gói nhỏ kịch bản QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi một bản tóm tắt quan sát CPU tổng hợp
    dưới `.artifacts/gateway-cpu-scenarios/`.
  - Mặc định chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`
    cộng với `--hot-wall-warn-ms`), nên các đợt tăng ngắn lúc khởi động được ghi làm metric
    mà không trông giống hồi quy Gateway bị ghim CPU kéo dài nhiều phút.
  - Dùng các artifact `dist` đã build; chạy build trước khi checkout chưa có
    output runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng QA suite bên trong một VM Linux Multipass dùng một lần.
  - Giữ nguyên hành vi chọn kịch bản như `qa suite` trên host.
  - Tái sử dụng cùng các cờ chọn nhà cung cấp/model như `qa suite`.
  - Các lần chạy live chuyển tiếp những input auth QA được hỗ trợ và thực tế cho guest:
    khóa nhà cung cấp dựa trên env, đường dẫn cấu hình nhà cung cấp live QA, và `CODEX_HOME`
    khi có.
  - Các thư mục output phải nằm dưới repo root để guest có thể ghi lại qua
    workspace được mount.
  - Ghi báo cáo QA + tóm tắt thông thường cùng log Multipass dưới
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động site QA dựa trên Docker cho công việc QA kiểu operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một npm tarball từ checkout hiện tại, cài đặt global trong
    Docker, chạy onboarding API key OpenAI không tương tác, mặc định cấu hình Telegram,
    xác minh runtime Plugin đã đóng gói tải được mà không cần sửa dependency lúc khởi động,
    chạy doctor, và chạy một lượt agent cục bộ với endpoint OpenAI được mock.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng làn cài đặt gói
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy một smoke Docker ứng dụng đã build có tính xác định cho transcript context runtime
    nhúng. Lệnh xác minh context runtime OpenClaw ẩn được lưu như một custom message
    không hiển thị thay vì rò rỉ vào lượt người dùng hiển thị,
    rồi seed một session JSONL hỏng bị ảnh hưởng và xác minh
    `openclaw doctor --fix` viết lại nó sang nhánh active kèm bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một package candidate OpenClaw trong Docker, chạy onboarding gói đã cài,
    cấu hình Telegram qua CLI đã cài, rồi tái sử dụng làn QA Telegram live
    với gói đã cài đó làm SUT Gateway.
  - Wrapper chỉ mount nguồn harness `qa-lab` từ checkout; gói đã cài
    sở hữu `dist`, `openclaw/plugin-sdk` và runtime Plugin bundled
    nên làn này không trộn Plugin từ checkout hiện tại vào gói đang được kiểm thử.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử tarball cục bộ đã resolve thay vì
    cài đặt từ registry.
  - Mặc định phát ra timing RTT lặp lại trong `qa-evidence.json` với
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Ghi đè
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`, hoặc
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` để tinh chỉnh lần chạy RTT.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` chấp nhận danh sách ID kiểm tra QA
    Telegram phân tách bằng dấu phẩy để lấy mẫu; khi chưa đặt, kiểm tra mặc định
    hỗ trợ RTT là `telegram-mentioned-message-reply`.
  - Dùng cùng thông tin xác thực env Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Với tự động hóa CI/release, đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cộng với
    `OPENCLAW_QA_CONVEX_SITE_URL` và một role secret. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một Convex role secret có trong CI,
    wrapper Docker tự động chọn Convex.
  - Wrapper xác thực env thông tin xác thực Telegram hoặc Convex trên host trước
    công việc build/cài đặt Docker. Chỉ đặt `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    khi cố ý debug thiết lập trước thông tin xác thực.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho làn này. Khi thông tin xác thực Convex
    được chọn và chưa đặt role, wrapper dùng `ci` trong CI và
    `maintainer` ngoài CI.
  - GitHub Actions hiển thị làn này dưới dạng workflow maintainer thủ công
    `NPM Telegram Beta E2E`. Workflow này không chạy khi merge. Workflow dùng
    environment `qa-live-shared` và các lease thông tin xác thực Convex CI.
- GitHub Actions cũng hiển thị `Package Acceptance` cho proof sản phẩm side-run
  với một gói candidate. Nó chấp nhận một ref đáng tin cậy, npm spec đã xuất bản,
  URL HTTPS tarball cộng SHA-256, hoặc artifact tarball từ một lần chạy khác, upload
  `openclaw-current.tgz` đã chuẩn hóa dưới tên `package-under-test`, rồi chạy
  scheduler Docker E2E hiện có với các hồ sơ làn smoke, package, product, full hoặc custom.
  Đặt `telegram_mode=mock-openai` hoặc `live-frontier` để chạy workflow QA Telegram
  với cùng artifact `package-under-test`.
  - Proof sản phẩm beta mới nhất:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Proof URL tarball chính xác yêu cầu digest và dùng chính sách an toàn URL công khai:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Mirror tarball enterprise/private dùng một chính sách trusted-source rõ ràng:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` đọc `.github/package-trusted-sources.json` từ ref workflow đáng tin cậy và không chấp nhận thông tin xác thực URL hoặc bypass private-network qua workflow input. Nếu chính sách được đặt tên khai báo bearer auth, hãy cấu hình secret cố định `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Proof artifact tải xuống một artifact tarball từ một lần chạy Actions khác:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Đóng gói và cài đặt bản build OpenClaw hiện tại trong Docker, khởi động Gateway
    với OpenAI đã cấu hình, rồi bật channel/Plugin bundled qua các chỉnh sửa cấu hình.
  - Xác minh discovery thiết lập để các Plugin có thể tải xuống chưa cấu hình không xuất hiện,
    lần sửa doctor đầu tiên đã cấu hình sẽ cài đặt rõ ràng từng Plugin có thể tải xuống còn thiếu,
    và lần khởi động lại thứ hai không chạy sửa dependency ẩn.
  - Cũng cài đặt một baseline npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>`, và xác minh doctor sau cập nhật của candidate
    dọn sạch mảnh vụn dependency Plugin legacy mà không cần sửa postinstall phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy smoke cập nhật cài đặt gói native trên các guest Parallels. Mỗi
    nền tảng được chọn trước tiên cài đặt gói baseline được yêu cầu, rồi chạy
    lệnh `openclaw update` đã cài trong cùng guest và xác minh
    phiên bản đã cài, trạng thái cập nhật, readiness của Gateway, và một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows`, hoặc `--platform linux` khi
    lặp trên một guest. Dùng `--json` cho đường dẫn artifact tóm tắt và
    trạng thái theo từng làn.
  - Làn OpenAI mặc định dùng `openai/gpt-5.5` cho proof lượt agent live.
    Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` khi cố ý xác thực một
    model OpenAI khác.
  - Bọc các lần chạy cục bộ dài trong timeout host để các lần kẹt transport Parallels không
    tiêu tốn phần còn lại của cửa sổ kiểm thử:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi log làn lồng nhau dưới `/tmp/openclaw-parallels-npm-update.*`.
    Kiểm tra `windows-update.log`, `macos-update.log`, hoặc `linux-update.log`
    trước khi giả định wrapper bên ngoài bị treo.
  - Cập nhật Windows có thể mất 10 đến 15 phút trong doctor sau cập nhật và công việc
    cập nhật gói trên một guest lạnh; điều đó vẫn bình thường khi log debug npm
    lồng nhau đang tiến triển.
  - Không chạy wrapper tổng hợp này song song với các làn smoke Parallels
    macOS, Windows hoặc Linux riêng lẻ. Chúng dùng chung trạng thái VM và có thể va chạm khi
    khôi phục snapshot, phục vụ gói, hoặc trạng thái Gateway của guest.
  - Proof sau cập nhật chạy surface Plugin bundled thông thường vì
    các facade capability như speech, image generation và media
    understanding được tải qua API runtime bundled ngay cả khi chính lượt agent
    chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ nhà cung cấp AIMock cục bộ để kiểm thử smoke
    giao thức trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy lane QA trực tiếp Matrix với homeserver Tuwunel dùng một lần được Docker hỗ trợ. Chỉ dành cho checkout mã nguồn - bản cài đặt đóng gói không phát hành `qa-lab`.
  - Toàn bộ CLI, danh mục hồ sơ/kịch bản, biến môi trường và bố cục artifact: [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy lane QA trực tiếp Telegram với một nhóm riêng tư thật bằng token bot driver và SUT từ môi trường.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, và `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID nhóm phải là ID chat Telegram dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực dùng chung theo pool. Mặc định dùng chế độ môi trường, hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` để chọn dùng lease theo pool.
  - Mặc định bao phủ canary, cổng mention, định địa chỉ lệnh, `/status`, phản hồi được nhắc tới giữa bot với bot, và phản hồi lệnh gốc lõi. Mặc định `mock-openai` cũng bao phủ các hồi quy chuỗi phản hồi xác định và streaming tin nhắn cuối Telegram. Dùng `--list-scenarios` cho các probe tùy chọn như `session_status`.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` khi bạn
    muốn có artifact mà không có mã thoát thất bại.
  - Yêu cầu hai bot riêng biệt trong cùng một nhóm riêng tư, với bot SUT công khai username Telegram.
  - Để quan sát bot-với-bot ổn định, bật Bot-to-Bot Communication Mode trong `@BotFather` cho cả hai bot và đảm bảo bot driver có thể quan sát lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, bản tóm tắt, và `qa-evidence.json` dưới `.artifacts/qa-e2e/...`. Các kịch bản trả lời bao gồm RTT từ yêu cầu gửi của driver đến phản hồi SUT quan sát được.

`Mantis Telegram Live` là wrapper bằng chứng PR quanh lane này. Nó chạy ref
ứng viên với thông tin xác thực Telegram được Convex cấp lease, render gói báo cáo/bằng chứng QA
đã biên tập trong trình duyệt desktop Crabbox, ghi bằng chứng MP4,
tạo GIF được cắt theo chuyển động, tải lên gói artifact, và đăng bằng chứng PR
inline thông qua Mantis GitHub App khi `pr_number` được đặt. Maintainer có thể
khởi động từ giao diện Actions qua `Mantis Scenario` (`scenario_id:
telegram-live`) hoặc trực tiếp từ bình luận pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` là wrapper Telegram Desktop gốc có tính agent
trước/sau cho bằng chứng hình ảnh PR. Khởi động từ giao diện Actions với
`instructions` dạng tự do, qua `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), hoặc từ bình luận PR:

```text
@openclaw-mantis telegram desktop proof
```

Agent Mantis đọc PR, quyết định hành vi nhìn thấy trên Telegram nào chứng minh
thay đổi, chạy lane bằng chứng Telegram Desktop Crabbox người dùng thật trên ref baseline và
ứng viên, lặp cho đến khi các GIF gốc hữu ích, ghi manifest
`motionPreview` ghép cặp, và đăng cùng bảng GIF 2 cột thông qua
Mantis GitHub App khi `pr_number` được đặt.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Lease hoặc tái sử dụng desktop Linux Crabbox, cài Telegram Desktop gốc, cấu hình OpenClaw với token bot SUT Telegram được lease, khởi động gateway, và ghi bằng chứng ảnh chụp màn hình/MP4 từ desktop VNC hiển thị.
  - Mặc định dùng `--credential-source convex` để workflow chỉ cần secret broker Convex. Dùng `--credential-source env` với cùng các biến `OPENCLAW_QA_TELEGRAM_*` như `pnpm openclaw qa telegram`.
  - Telegram Desktop vẫn cần đăng nhập/hồ sơ người dùng. Token bot chỉ cấu hình OpenClaw. Dùng `--telegram-profile-archive-env <name>` cho kho lưu trữ hồ sơ `.tgz` base64, hoặc dùng `--keep-lease` và đăng nhập thủ công qua VNC một lần.
  - Ghi `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, và `telegram-desktop-builder.mp4` dưới thư mục đầu ra.

Các lane transport trực tiếp dùng chung một hợp đồng tiêu chuẩn để transport mới không bị lệch; ma trận phạm vi theo lane nằm trong [Tổng quan QA → Phạm vi transport trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` là bộ synthetic rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi bật `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) cho
QA transport trực tiếp, QA lab lấy một lease độc quyền từ pool được Convex hỗ trợ, Heartbeat lease đó
trong khi lane đang chạy, và giải phóng lease khi tắt. Tên phần này có trước
hỗ trợ Discord, Slack, và WhatsApp; hợp đồng lease được dùng chung giữa các loại.

Scaffold dự án Convex tham chiếu:

- `qa/convex-credential-broker/`

Biến môi trường bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một secret cho vai trò đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn vai trò thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định môi trường: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, nếu không thì là `maintainer`)

Biến môi trường tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID trace tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` loopback để phát triển chỉ cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong vận hành bình thường.

Các lệnh quản trị maintainer (thêm/xóa/liệt kê pool) yêu cầu riêng
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Trình trợ giúp CLI cho maintainer:

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
  - Chặn lease đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ secret maintainer)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Dạng payload cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi ID chat Telegram dạng số.
- `admin/add` xác thực dạng này cho `kind: "telegram"` và từ chối payload sai định dạng.

Dạng payload cho loại người dùng thật Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, và `telegramApiId` phải là chuỗi số.
- `tdlibArchiveSha256` và `desktopTdataArchiveSha256` phải là chuỗi hex SHA-256.
- `kind: "telegram-user"` được dành riêng cho workflow bằng chứng Mantis Telegram Desktop. Các lane QA Lab chung không được lấy nó.

Payload đa kênh được broker xác thực:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Các lane Slack cũng có thể lease từ pool, nhưng xác thực payload Slack hiện
nằm trong runner QA Slack thay vì broker. Dùng
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
cho các hàng Slack.

### Thêm kênh vào QA

Kiến trúc và tên trình trợ giúp kịch bản cho adapter kênh mới nằm trong [Tổng quan QA → Thêm kênh](/vi/concepts/qa-e2e-automation#adding-a-channel). Mức tối thiểu: triển khai runner transport trên seam host `qa-lab` dùng chung, khai báo `qaRunners` trong manifest plugin, mount dưới dạng `openclaw qa <runner>`, và viết kịch bản dưới `qa/scenarios/`.

## Bộ kiểm thử (chạy ở đâu)

Hãy xem các bộ kiểm thử là "mức độ thực tế tăng dần" (và độ flaky/chi phí cũng tăng dần):

### Unit / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng tập shard `vitest.full-*.config.ts` và có thể mở rộng shard đa dự án thành cấu hình theo dự án để lập lịch song song
- Tệp: inventory core/unit dưới `src/**/*.test.ts`, `packages/**/*.test.ts`, và `test/**/*.test.ts`; kiểm thử unit UI chạy trong shard chuyên dụng `unit-ui`
- Phạm vi:
  - Kiểm thử unit thuần túy
  - Kiểm thử tích hợp trong tiến trình (xác thực gateway, routing, tooling, phân tích cú pháp, cấu hình)
  - Hồi quy xác định cho lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không cần khóa thật
  - Nên nhanh và ổn định
  - Kiểm thử resolver và loader bề mặt công khai phải chứng minh hành vi fallback `api.js` và
    `runtime-api.js` rộng bằng fixture plugin nhỏ được tạo, không phải
    API nguồn plugin bundled thật. Việc tải API plugin thật thuộc về
    các bộ hợp đồng/tích hợp do plugin sở hữu.

Chính sách dependency gốc:

- Bản cài đặt kiểm thử mặc định bỏ qua bản build opus Discord gốc tùy chọn. Discord voice dùng `libopus-wasm` bundled, và `@discordjs/opus` vẫn bị tắt trong `allowBuilds` để kiểm thử cục bộ và lane Testbox không biên dịch addon gốc.
- So sánh hiệu năng opus gốc trong repo benchmark `libopus-wasm`, không phải trong vòng lặp cài đặt/kiểm thử OpenClaw mặc định. Không đặt `@discordjs/opus` thành `true` trong `allowBuilds` mặc định; điều đó khiến các vòng lặp cài đặt/kiểm thử không liên quan biên dịch mã gốc.

<AccordionGroup>
  <Accordion title="Dự án, shard, và lane theo phạm vi">

    - Lệnh `pnpm test` không nhắm mục tiêu chạy mười hai cấu hình shard nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình dự án gốc native khổng lồ. Điều này giảm RSS đỉnh trên các máy đang tải nặng và tránh để công việc auto-reply/extension làm thiếu tài nguyên cho các bộ kiểm thử không liên quan.
    - `pnpm test --watch` vẫn dùng đồ thị dự án gốc native `vitest.config.ts`, vì vòng lặp watch đa shard không thực tế.
    - `pnpm test`, `pnpm test:watch`, và `pnpm test:perf:imports` định tuyến các mục tiêu tệp/thư mục rõ ràng qua các lane có phạm vi trước, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải trả chi phí khởi động toàn bộ dự án gốc.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các lane có phạm vi rẻ: chỉnh sửa kiểm thử trực tiếp, tệp anh em `*.test.ts`, ánh xạ nguồn rõ ràng, và các phần phụ thuộc đồ thị import cục bộ. Các chỉnh sửa config/setup/package không chạy rộng kiểm thử trừ khi bạn dùng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường cho công việc hẹp. Nó phân loại diff thành core, kiểm thử core, extensions, kiểm thử extension, apps, docs, siêu dữ liệu phát hành, công cụ Docker live, và tooling, rồi chạy các lệnh typecheck, lint, và guard tương ứng. Nó không chạy kiểm thử Vitest; gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để có bằng chứng kiểm thử. Các lần tăng phiên bản chỉ liên quan đến siêu dữ liệu phát hành chạy kiểm tra version/config/root-dependency có mục tiêu, với một guard từ chối thay đổi package ngoài trường version cấp cao nhất.
    - Các chỉnh sửa harness Docker ACP live chạy kiểm tra tập trung: cú pháp shell cho các script xác thực Docker live và một dry-run bộ lập lịch Docker live. Các thay đổi `package.json` chỉ được đưa vào khi diff giới hạn ở `scripts["test:docker:live-*"]`; các chỉnh sửa dependency, export, version, và bề mặt package khác vẫn dùng các guard rộng hơn.
    - Các kiểm thử đơn vị nhẹ về import từ agents, commands, plugins, helper auto-reply, `plugin-sdk`, và các vùng tiện ích thuần tương tự định tuyến qua lane `unit-fast`, lane này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp nặng về state/runtime vẫn ở trên các lane hiện có.
    - Các tệp nguồn helper `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy chế độ changed tới kiểm thử anh em rõ ràng trong những lane nhẹ đó, nên chỉnh sửa helper tránh chạy lại toàn bộ bộ kiểm thử nặng cho thư mục đó.
    - `auto-reply` có các nhóm chuyên dụng cho helper core cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất, và cây con `src/auto-reply/reply/**`. CI tiếp tục chia cây con reply thành các shard agent-runner, dispatch, và commands/state-routing để một nhóm nặng import không chiếm toàn bộ phần đuôi Node.
    - CI PR/main thông thường cố ý bỏ qua lượt quét lô extension và shard `agentic-plugins` chỉ dành cho phát hành. Full Release Validation kích hoạt workflow con `Plugin Prerelease` riêng cho các bộ kiểm thử nặng về plugin/extension đó trên các release candidate.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Khi bạn thay đổi đầu vào khám phá message-tool hoặc ngữ cảnh runtime
      Compaction, hãy giữ cả hai mức độ bao phủ.
    - Thêm các hồi quy helper tập trung cho các ranh giới định tuyến và chuẩn hóa
      thuần.
    - Giữ các bộ tích hợp embedded runner luôn khỏe:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts`, và
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ đó xác minh rằng scoped id và hành vi Compaction vẫn đi
      qua các đường dẫn `run.ts` / `compact.ts` thật; kiểm thử chỉ helper
      không phải là thay thế đủ cho các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Config Vitest cơ sở mặc định là `threads`.
    - Config Vitest dùng chung cố định `isolate: false` và dùng runner
      không cô lập trên các dự án gốc, e2e, và config live.
    - Lane UI gốc giữ setup `jsdom` và optimizer của nó, nhưng cũng chạy trên
      runner không cô lập dùng chung.
    - Mỗi shard `pnpm test` kế thừa cùng mặc định `threads` + `isolate: false`
      từ config Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình Node
      con của Vitest để giảm churn biên dịch V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8
      mặc định.
    - `scripts/run-vitest.mjs` kết thúc các lần chạy Vitest không watch rõ ràng sau
      5 phút không có đầu ra stdout hoặc stderr. Đặt
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` để tắt watchdog cho một
      cuộc điều tra cố ý im lặng.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` hiển thị các lane kiến trúc mà một diff kích hoạt.
    - Hook pre-commit chỉ định dạng. Nó stage lại các tệp đã định dạng và
      không chạy lint, typecheck, hoặc kiểm thử.
    - Chạy `pnpm check:changed` rõ ràng trước khi bàn giao hoặc push khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các lane có phạm vi rẻ. Chỉ dùng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      quyết định một chỉnh sửa harness, config, package, hoặc contract thật sự cần
      phạm vi Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ cùng hành vi định tuyến,
      chỉ với giới hạn worker cao hơn.
    - Tự động điều chỉnh worker cục bộ được cố ý đặt thận trọng và giảm tải
      khi load average của host đã cao, nên nhiều lần chạy Vitest đồng thời
      mặc định gây ít ảnh hưởng hơn.
    - Config Vitest cơ sở đánh dấu các tệp projects/config là
      `forceRerunTriggers` để các lần chạy lại chế độ changed vẫn đúng khi dây nối
      kiểm thử thay đổi.
    - Config giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` bật trên các host được hỗ trợ;
      đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` nếu bạn muốn
      một vị trí cache rõ ràng cho profiling trực tiếp.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` bật báo cáo thời lượng import của Vitest cùng với
      đầu ra phân tích import.
    - `pnpm test:perf:imports:changed` giới hạn cùng chế độ xem profiling đó vào
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian shard được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn config dùng đường dẫn config làm khóa; các shard CI
      theo include-pattern thêm tên shard để các shard đã lọc có thể được theo dõi
      riêng.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho import khởi động,
      giữ các dependency nặng phía sau một ranh giới cục bộ hẹp `*.runtime.ts` và
      mock trực tiếp ranh giới đó thay vì deep-import các helper runtime chỉ
      để chuyển chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn dự án gốc native cho diff đã commit đó
      và in wall time cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark cây bẩn hiện tại
      bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và config Vitest gốc.
    - `pnpm test:perf:profile:main` ghi profile CPU main-thread cho
      chi phí khởi động và transform của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi profile CPU+heap của runner cho bộ
      unit với song song hóa tệp bị tắt.

  </Accordion>
</AccordionGroup>

### Tính ổn định (Gateway)

- Lệnh: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, bị ép dùng một worker
- Phạm vi:
  - Khởi động một Gateway loopback thật với diagnostics được bật mặc định
  - Đưa churn message gateway, memory, và large-payload tổng hợp qua đường dẫn sự kiện diagnostic
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các helper lưu bền vững gói diagnostic stability
  - Xác nhận recorder vẫn có giới hạn, các mẫu RSS tổng hợp ở dưới ngân sách áp lực, và độ sâu hàng đợi theo phiên thoát về 0
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Lane hẹp để theo dõi hồi quy ổn định, không thay thế cho toàn bộ bộ Gateway

### E2E (tổng hợp repo)

- Lệnh: `pnpm test:e2e`
- Phạm vi:
  - Chạy lane E2E smoke Gateway
  - Chạy lane E2E trình duyệt Control UI được mock
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Yêu cầu Playwright Chromium đã được cài đặt

### E2E (smoke Gateway)

- Lệnh: `pnpm test:e2e:gateway`
- Config: `vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, và các kiểm thử E2E bundled-plugin dưới `extensions/`
- Mặc định runtime:
  - Dùng Vitest `threads` với `isolate: false`, khớp với phần còn lại của repo.
  - Dùng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ im lặng để giảm chi phí console I/O.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để ép số lượng worker (giới hạn ở 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra console chi tiết.
- Phạm vi:
  - Hành vi end-to-end của gateway đa phiên bản
  - Bề mặt WebSocket/HTTP, ghép cặp node, và networking nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không yêu cầu khóa thật
  - Nhiều phần chuyển động hơn kiểm thử đơn vị (có thể chậm hơn)

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
  - Không yêu cầu Gateway thật, agents, hoặc khóa provider
  - Dependency trình duyệt phải có sẵn (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke backend OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Tái sử dụng một gateway OpenShell cục bộ đang hoạt động
  - Tạo sandbox từ một Dockerfile cục bộ tạm thời
  - Thực thi backend OpenShell của OpenClaw qua `sandbox ssh-config` thật + SSH exec
  - Xác minh hành vi hệ thống tệp remote-canonical qua cầu nối sandbox fs
- Kỳ vọng:
  - Chỉ opt-in; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cùng một Docker daemon hoạt động
  - Yêu cầu một gateway OpenShell cục bộ đang hoạt động và nguồn config của nó
  - Dùng `HOME` / `XDG_CONFIG_HOME` cô lập, rồi hủy sandbox kiểm thử
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới binary CLI không mặc định hoặc script wrapper
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` để phơi bày config gateway đã đăng ký cho kiểm thử cô lập
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` để ghi đè IP Docker gateway được fixture chính sách host sử dụng

### Live (provider thật + model thật)

- Lệnh: `pnpm test:live`
- Cấu hình: `vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các kiểm thử live của Plugin được đóng gói trong `extensions/`
- Mặc định: được `pnpm test:live` **bật** (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - "Nhà cung cấp/mô hình này có thực sự hoạt động _hôm nay_ với thông tin xác thực thật không?"
  - Bắt các thay đổi định dạng của nhà cung cấp, điểm khác biệt khi gọi công cụ, vấn đề xác thực và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế, không ổn định trên CI (mạng thật, chính sách nhà cung cấp thật, hạn mức, sự cố ngừng dịch vụ)
  - Tốn tiền / dùng giới hạn tốc độ
  - Ưu tiên chạy các tập con đã thu hẹp thay vì "mọi thứ"
- Các lần chạy live dùng khóa API đã export sẵn và hồ sơ xác thực đã staged.
- Theo mặc định, các lần chạy live vẫn cô lập `HOME` và sao chép vật liệu cấu hình/xác thực vào một home kiểm thử tạm thời để fixture unit không thể thay đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn cố ý cần kiểm thử live dùng thư mục home thật của mình.
- `pnpm test:live` mặc định dùng chế độ yên tĩnh hơn: nó giữ đầu ra tiến trình `[live] ...` và tắt log khởi động gateway/tiếng ồn Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn lấy lại toàn bộ log khởi động.
- Xoay vòng khóa API (theo từng nhà cung cấp): đặt `*_API_KEYS` với định dạng dấu phẩy/chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè riêng cho live qua `OPENCLAW_LIVE_*_KEY`; kiểm thử sẽ thử lại khi gặp phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/heartbeat:
  - Các bộ live hiện phát dòng tiến trình ra stderr để các lệnh gọi nhà cung cấp dài vẫn hiển thị là đang hoạt động ngay cả khi phần bắt console của Vitest đang yên tĩnh.
  - `vitest.live.config.ts` tắt việc Vitest chặn console để các dòng tiến trình của nhà cung cấp/gateway stream ngay trong khi chạy live.
  - Tinh chỉnh heartbeat mô hình trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Tinh chỉnh heartbeat gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ nào?

Dùng bảng quyết định này:

- Sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn đã thay đổi nhiều)
- Chạm tới mạng gateway / giao thức WS / ghép cặp: thêm `pnpm test:e2e`
- Gỡ lỗi "bot của tôi bị ngừng" / lỗi theo từng nhà cung cấp / gọi công cụ: chạy `pnpm test:live` đã thu hẹp

## Kiểm thử live (chạm mạng)

Đối với ma trận mô hình live, smoke backend CLI, smoke ACP, harness app-server
Codex, và tất cả kiểm thử live nhà cung cấp media (Deepgram, BytePlus, ComfyUI, hình ảnh,
nhạc, video, media harness) - cộng với xử lý thông tin xác thực cho các lần chạy live - xem
[Kiểm thử các bộ live](/vi/help/testing-live). Đối với checklist chuyên biệt cho cập nhật và
xác thực Plugin, xem
[Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Trình chạy Docker (kiểm tra tùy chọn "hoạt động trong Linux")

Các trình chạy Docker này chia thành hai nhóm:

- Trình chạy mô hình live: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp live profile-key tương ứng của chúng bên trong ảnh Docker của repo (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), mount thư mục cấu hình cục bộ, workspace và tệp env hồ sơ tùy chọn của bạn. Các entrypoint cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Các trình chạy Docker live giữ giới hạn thực tế riêng khi cần:
  `test:docker:live-models` mặc định dùng tập được tuyển chọn, được hỗ trợ và có tín hiệu cao, còn
  `test:docker:live-gateway` mặc định dùng `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Đặt `OPENCLAW_LIVE_MAX_MODELS`
  hoặc các biến env gateway khi bạn rõ ràng muốn giới hạn nhỏ hơn hoặc quét lớn hơn.
- `test:docker:all` build ảnh Docker live một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần dưới dạng tarball npm thông qua `scripts/package-openclaw-for-docker.mjs`, rồi build/tái sử dụng hai ảnh `scripts/e2e/Dockerfile`. Ảnh trần chỉ là trình chạy Node/Git cho các lane cài đặt/cập nhật/phụ thuộc Plugin; các lane đó mount tarball đã build sẵn. Ảnh chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng của ứng dụng đã build. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic planner nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Bộ tổng hợp dùng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` điều khiển slot tiến trình, trong khi giới hạn tài nguyên giữ cho các lane live nặng, npm-install và đa dịch vụ không cùng khởi động một lúc. Nếu một lane đơn lẻ nặng hơn giới hạn đang hoạt động, bộ lập lịch vẫn có thể khởi động nó khi pool trống rồi giữ nó chạy một mình cho đến khi có lại dung lượng. Mặc định là 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`, và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ tinh chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` khi host Docker còn nhiều dư địa hơn. Trình chạy thực hiện preflight Docker theo mặc định, xóa các container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời lượng lane thành công trong `.artifacts/docker-tests/lane-timings.json`, và dùng các thời lượng đó để khởi động lane dài hơn trước trong các lần chạy sau. Dùng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in manifest lane có trọng số mà không build hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các lane đã chọn, nhu cầu package/ảnh và thông tin xác thực.
- `Package Acceptance` là cổng gói gốc GitHub cho "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Nó phân giải một package ứng viên từ `source=npm`, `source=ref`, `source=url`, hoặc `source=artifact`, upload nó dưới dạng `package-under-test`, rồi chạy các lane Docker E2E có thể tái sử dụng với đúng tarball đó thay vì đóng gói lại ref đã chọn. Hồ sơ được sắp theo độ rộng: `smoke`, `package`, `product`, và `full`. Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng package/cập nhật/Plugin, ma trận sống sót sau nâng cấp đã phát hành, mặc định phát hành và phân loại lỗi.
- Các kiểm tra build và phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Guard duyệt đồ thị build tĩnh từ `dist/entry.js` và `dist/cli/run-main.js` và thất bại nếu startup trước dispatch import các phụ thuộc package như Commander, prompt UI, undici hoặc logging trước khi dispatch lệnh; nó cũng giữ chunk chạy gateway được đóng gói dưới ngân sách và từ chối import tĩnh các đường dẫn gateway nguội đã biết. Smoke CLI đã đóng gói cũng bao phủ trợ giúp root, trợ giúp onboard, trợ giúp doctor, trạng thái, schema cấu hình và lệnh danh sách mô hình.
- Tương thích kế thừa của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Đến mốc đó, harness chỉ dung thứ các khoảng trống metadata của package đã phát hành: mục kiểm kê QA private bị bỏ qua, thiếu `gateway install --wrapper`, thiếu tệp patch trong fixture git dẫn xuất từ tarball, thiếu `update.channel` đã lưu, vị trí install-record Plugin kế thừa, thiếu lưu install-record marketplace, và di chuyển metadata cấu hình trong `plugins update`. Với các package sau `2026.4.25`, các đường dẫn đó là lỗi nghiêm ngặt.
- Trình chạy smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, và `test:docker:config-reload` khởi động một hoặc nhiều container thật và xác minh các đường dẫn tích hợp cấp cao hơn.
- Các lane Docker/Bash E2E cài đặt tarball OpenClaw đã đóng gói thông qua `scripts/lib/openclaw-e2e-instance.sh` giới hạn `npm install` ở `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (mặc định `600s`; đặt `0` để tắt wrapper khi gỡ lỗi).

Các trình chạy Docker mô hình live cũng chỉ bind-mount các home xác thực CLI cần thiết (hoặc tất cả home được hỗ trợ khi lần chạy không bị thu hẹp), rồi sao chép chúng vào home container trước khi chạy để OAuth CLI bên ngoài có thể refresh token mà không thay đổi kho xác thực của host:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`; bao phủ Claude, Codex và Gemini theo mặc định, với bao phủ Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke khả năng quan sát: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke`, và `pnpm qa:observability:smoke` là các lane QA private trên source-checkout. Chúng cố ý không thuộc các lane phát hành Docker package vì tarball npm bỏ qua QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn onboarding (TTY, dựng khung đầy đủ): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent bằng tarball npm: `pnpm test:docker:npm-onboard-channel-agent` cài đặt tarball OpenClaw đã đóng gói ở phạm vi global trong Docker, cấu hình OpenAI qua onboarding env-ref cộng với Telegram theo mặc định, chạy doctor, và chạy một lượt agent OpenAI đã mock. Tái sử dụng tarball đã build sẵn bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua rebuild trên host bằng `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc đổi channel bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` hoặc `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Kiểm thử smoke hành trình người dùng bản phát hành: `pnpm test:docker:release-user-journey` cài đặt tarball OpenClaw đã đóng gói ở phạm vi global trong một Docker home sạch, chạy onboarding, cấu hình một provider OpenAI được mock, chạy một lượt agent, cài đặt/gỡ cài đặt các Plugin bên ngoài, cấu hình ClickClack với một fixture cục bộ, xác minh nhắn tin gửi đi/nhận vào, khởi động lại Gateway, và chạy doctor.
- Kiểm thử smoke onboarding có kiểu bản phát hành: `pnpm test:docker:release-typed-onboarding` cài đặt tarball đã đóng gói, điều khiển `openclaw onboard` qua một TTY thật, cấu hình OpenAI làm provider env-ref, xác minh không lưu khóa thô, và chạy một lượt agent được mock.
- Kiểm thử smoke media/memory bản phát hành: `pnpm test:docker:release-media-memory` cài đặt tarball đã đóng gói, xác minh hiểu hình ảnh từ một tệp đính kèm PNG, đầu ra tạo ảnh tương thích OpenAI, truy hồi tìm kiếm bộ nhớ, và khả năng truy hồi vẫn tồn tại sau khi khởi động lại Gateway.
- Kiểm thử smoke hành trình người dùng nâng cấp bản phát hành: `pnpm test:docker:release-upgrade-user-journey` mặc định cài đặt baseline đã phát hành mới nhất cũ hơn tarball ứng viên, cấu hình trạng thái provider/Plugin/ClickClack trên package đã phát hành, nâng cấp lên tarball ứng viên, rồi chạy lại hành trình agent/Plugin/kênh cốt lõi. Nếu không có baseline đã phát hành cũ hơn, nó dùng lại phiên bản ứng viên. Ghi đè baseline bằng `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Kiểm thử smoke chợ Plugin bản phát hành: `pnpm test:docker:release-plugin-marketplace` cài đặt từ một chợ fixture cục bộ, cập nhật Plugin đã cài đặt, gỡ cài đặt nó, và xác minh CLI của Plugin biến mất cùng với metadata cài đặt đã được lược bỏ.
- Kiểm thử smoke cài đặt Skill: `pnpm test:docker:skill-install` cài đặt tarball OpenClaw đã đóng gói ở phạm vi global trong Docker, tắt cài đặt archive đã tải lên trong cấu hình, phân giải slug Skill ClawHub live hiện tại từ tìm kiếm, cài đặt nó bằng `openclaw skills install`, và xác minh Skill đã cài đặt cùng metadata nguồn/khóa `.clawhub`.
- Kiểm thử smoke chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt tarball OpenClaw đã đóng gói ở phạm vi global trong Docker, chuyển từ package `stable` sang git `dev`, xác minh kênh đã lưu và Plugin hoạt động sau cập nhật, rồi chuyển lại package `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử smoke nâng cấp sống sót: `pnpm test:docker:upgrade-survivor` cài đặt tarball OpenClaw đã đóng gói lên trên một fixture người dùng cũ có trạng thái bẩn với agents, cấu hình kênh, allowlist Plugin, trạng thái phụ thuộc Plugin đã cũ, và các tệp workspace/session hiện có. Nó chạy cập nhật package cùng doctor không tương tác mà không có provider live hoặc khóa kênh, rồi khởi động một Gateway loopback và kiểm tra việc bảo toàn cấu hình/trạng thái cùng ngân sách khởi động/trạng thái.
- Kiểm thử smoke nâng cấp đã phát hành sống sót: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, gieo các tệp người dùng hiện có thực tế, cấu hình baseline đó bằng một công thức lệnh đã nhúng, xác thực cấu hình thu được, cập nhật bản cài đặt đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway loopback và kiểm tra các intent đã cấu hình, bảo toàn trạng thái, khởi động, `/healthz`, `/readyz`, và ngân sách trạng thái RPC. Ghi đè một baseline bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các baseline cục bộ chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` như `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, và mở rộng các fixture có dạng issue bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` như `reported-issues`; tập reported-issues bao gồm `configured-plugin-installs` để tự động sửa cài đặt Plugin OpenClaw bên ngoài. Package Acceptance phơi bày các giá trị đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, và `published_upgrade_survivor_scenarios`, phân giải các token baseline meta như `last-stable-4` hoặc `all-since-2026.4.23`, và Full Release Validation mở rộng cổng package release-soak thành `last-stable-4 2026.4.23 2026.5.2 2026.4.15` cộng với `reported-issues`.
- Kiểm thử smoke ngữ cảnh runtime session: `pnpm test:docker:session-runtime-context` xác minh việc lưu transcript ngữ cảnh runtime ẩn cùng sửa chữa doctor cho các nhánh prompt-rewrite bị trùng lặp bị ảnh hưởng.
- Kiểm thử smoke cài đặt Bun global: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một home cô lập, và xác minh `openclaw infer image providers --json` trả về các provider hình ảnh được bundle thay vì bị treo. Dùng lại tarball dựng sẵn bằng `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua build trên host bằng `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một Docker image đã build bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử smoke Docker trình cài đặt: `bash scripts/test-install-sh-docker.sh` chia sẻ một cache npm cho các container root, update, và direct-npm của nó. Kiểm thử smoke cập nhật mặc định dùng npm `latest` làm baseline stable trước khi nâng cấp lên tarball ứng viên. Ghi đè bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` cục bộ, hoặc bằng input `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt non-root giữ một cache npm cô lập để các mục cache thuộc sở hữu root không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để dùng lại cache root/update/direct-npm giữa các lần chạy lại cục bộ.
- Install Smoke CI bỏ qua cập nhật global direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy script cục bộ không có env đó khi cần coverage cho `npm install -g` trực tiếp.
- Kiểm thử smoke CLI xóa workspace dùng chung của agents: `pnpm test:docker:agents-delete-shared-workspace` (script: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định build image Dockerfile gốc, gieo hai agent với một workspace trong một home container cô lập, chạy `agents delete --json`, và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Dùng lại image install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway (hai container, xác thực WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Kiểm thử smoke snapshot CDP trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (script: `scripts/e2e/browser-cdp-snapshot-docker.sh`) build image E2E nguồn cộng với một lớp Chromium, khởi động Chromium với CDP thô, chạy `browser doctor --deep`, và xác minh snapshot vai trò CDP bao phủ URL liên kết, phần tử có thể bấm được thăng cấp từ con trỏ, refs iframe, và metadata frame.
- Hồi quy reasoning tối thiểu OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một server OpenAI được mock qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, rồi buộc schema provider từ chối và kiểm tra chi tiết thô xuất hiện trong log Gateway.
- Cầu nối kênh MCP (Gateway đã gieo + cầu nối stdio + kiểm thử smoke khung thông báo Claude thô): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP bundle OpenClaw (server MCP stdio thật + kiểm thử smoke cho phép/từ chối profile OpenClaw nhúng): `pnpm test:docker:agent-bundle-mcp-tools` (script: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Dọn dẹp Cron/subagent MCP (Gateway thật + hủy child MCP stdio sau các lần chạy cron cô lập và subagent một lần): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (kiểm thử smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc hoisted, metadata package npm sai định dạng, ref git di chuyển, ClawHub kitchen-sink, cập nhật chợ, và bật/kiểm tra Claude-bundle): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp package/runtime kitchen-sink mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Khi không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, bài kiểm thử dùng một server fixture ClawHub cục bộ khép kín.
- Kiểm thử smoke cập nhật Plugin không đổi: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử smoke ma trận vòng đời Plugin: `pnpm test:docker:plugin-lifecycle-matrix` cài đặt tarball OpenClaw đã đóng gói trong một container trống, cài đặt một Plugin npm, bật/tắt enable/disable, nâng cấp và hạ cấp nó qua một registry npm cục bộ, xóa mã đã cài đặt, rồi xác minh gỡ cài đặt vẫn xóa trạng thái đã cũ trong khi ghi log metrics RSS/CPU cho từng pha vòng đời.
- Kiểm thử smoke metadata reload cấu hình: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` bao phủ kiểm thử smoke cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với phụ thuộc hoisted, ref git di chuyển, fixture ClawHub, cập nhật chợ, và bật/kiểm tra Claude-bundle. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không đổi cho các Plugin đã cài đặt. `pnpm test:docker:plugin-lifecycle-matrix` bao phủ cài đặt, enable, disable, nâng cấp, hạ cấp, và gỡ cài đặt khi thiếu mã của Plugin npm có theo dõi tài nguyên.

Để prebuild và dùng lại image functional dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các ghi đè image theo suite như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi được đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một image dùng chung từ xa, các script sẽ pull nó nếu nó chưa có cục bộ. Các bài kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi package/cài đặt thay vì runtime ứng dụng đã build dùng chung.

Các runner Docker dùng mô hình live cũng bind-mount checkout hiện tại ở chế độ chỉ đọc và
stage nó vào một workdir tạm thời bên trong container. Cách này giữ cho image runtime
gọn nhẹ trong khi vẫn chạy Vitest trên đúng source/config cục bộ của bạn.
Bước staging bỏ qua các cache lớn chỉ có ở máy cục bộ và output build ứng dụng như
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, và các thư mục output `.build` cục bộ của ứng dụng hoặc
Gradle để các lần chạy Docker live không mất nhiều phút sao chép
artifact riêng theo từng máy.
Chúng cũng đặt `OPENCLAW_SKIP_CHANNELS=1` để các probe live của gateway không khởi động
worker kênh Telegram/Discord/v.v. thật bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền cả
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi kiểm thử live
của gateway khỏi lane Docker đó.
`test:docker:openwebui` là một smoke tương thích cấp cao hơn: nó khởi động một
container gateway OpenClaw với các endpoint HTTP tương thích OpenAI được bật,
khởi động một container Open WebUI đã ghim phiên bản trỏ vào gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` hiển thị `openclaw/default`, rồi gửi một
yêu cầu chat thật qua proxy `/api/chat/completions` của Open WebUI.
Đặt `OPENWEBUI_SMOKE_MODE=models` cho các kiểm tra CI theo đường dẫn release cần dừng
sau bước đăng nhập Open WebUI và phát hiện mô hình, không chờ một lượt hoàn tất từ mô hình live.
Lần chạy đầu tiên có thể chậm hơn đáng kể vì Docker có thể cần kéo image
Open WebUI và Open WebUI có thể cần hoàn tất thiết lập cold-start của riêng nó.
Lane này yêu cầu một khóa mô hình live có thể dùng được. Cung cấp khóa đó qua môi trường
tiến trình, các hồ sơ xác thực đã stage, hoặc một `OPENCLAW_PROFILE_FILE` rõ ràng.
Các lần chạy thành công in một payload JSON nhỏ như `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` được thiết kế có tính xác định và không cần tài khoản
Telegram, Discord, hoặc iMessage thật. Nó khởi động một container Gateway đã seed,
khởi động container thứ hai sinh ra `openclaw mcp serve`, rồi xác minh
phát hiện hội thoại đã định tuyến, đọc transcript, metadata attachment,
hành vi hàng đợi sự kiện live, định tuyến gửi đi, và thông báo kênh + quyền kiểu Claude
qua cầu nối MCP stdio thật. Kiểm tra thông báo đọc trực tiếp các frame MCP stdio thô
để smoke xác thực đúng những gì cầu nối thật sự phát ra, không chỉ những gì một SDK client cụ thể tình cờ hiển thị.
`test:docker:agent-bundle-mcp-tools` có tính xác định và không cần khóa mô hình live.
Nó build image Docker của repo, khởi động một server probe MCP stdio thật
bên trong container, hiện thực hóa server đó qua runtime MCP của gói OpenClaw nhúng,
thực thi tool, rồi xác minh `coding` và `messaging` giữ lại các tool
`bundle-mcp` trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.
`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa mô hình live.
Nó khởi động một Gateway đã seed với một server probe MCP stdio thật, chạy một lượt cron
cô lập và một lượt con dùng một lần `sessions_spawn`, rồi xác minh
tiến trình con MCP thoát sau mỗi lần chạy.

Smoke thread ACP bằng ngôn ngữ tự nhiên thủ công (không phải CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ script này cho các workflow hồi quy/gỡ lỗi. Nó có thể lại cần thiết cho việc xác thực định tuyến thread ACP, vì vậy đừng xóa nó.

Các biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được mount vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được mount vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` được mount và source trước khi chạy kiểm thử
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được source từ `OPENCLAW_PROFILE_FILE`, dùng các thư mục config/workspace tạm thời và không mount xác thực CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`) được mount vào `/home/node/.npm-global` cho các bản cài CLI được cache bên trong Docker
- Các thư mục/tệp xác thực CLI bên ngoài trong `$HOME` được mount chỉ đọc dưới `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi kiểm thử bắt đầu
  - Thư mục mặc định: `.minimax`
  - Tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy đã thu hẹp theo provider chỉ mount những thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc provider trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để dùng lại image `openclaw:local-live` hiện có cho các lần chạy lại không cần rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo thông tin xác thực đến từ kho hồ sơ (không phải env)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình do gateway hiển thị cho smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce được dùng bởi smoke Open WebUI
- `OPENWEBUI_IMAGE=...` để ghi đè tag image Open WebUI đã ghim

## Kiểm tra docs

Chạy kiểm tra docs sau khi chỉnh sửa docs: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra heading trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy offline (an toàn cho CI)

Đây là các hồi quy "pipeline thật" không dùng provider thật:

- Gọi tool qua Gateway (mock OpenAI, gateway thật + vòng lặp agent thật): `src/gateway/gateway.test.ts` (case: "chạy một lời gọi tool OpenAI giả lập end-to-end qua vòng lặp agent gateway")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, ghi config + bắt buộc xác thực): `src/gateway/gateway.test.ts` (case: "chạy wizard qua ws và ghi config token xác thực")

## Đánh giá độ tin cậy của agent (Skills)

Chúng ta đã có một vài kiểm thử an toàn cho CI hoạt động giống như "đánh giá độ tin cậy của agent":

- Gọi tool giả lập qua gateway thật + vòng lặp agent thật (`src/gateway/gateway.test.ts`).
- Các luồng wizard end-to-end xác thực kết nối session và tác động của config (`src/gateway/gateway.test.ts`).

Những gì vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi Skills được liệt kê trong prompt, agent có chọn đúng skill (hoặc tránh những skill không liên quan) không?
- **Tuân thủ:** agent có đọc `SKILL.md` trước khi sử dụng và làm theo các bước/đối số bắt buộc không?
- **Hợp đồng workflow:** các kịch bản nhiều lượt xác nhận thứ tự tool, việc mang theo lịch sử session, và ranh giới sandbox.

Các đánh giá trong tương lai nên ưu tiên tính xác định trước:

- Một scenario runner dùng provider giả lập để xác nhận lời gọi tool + thứ tự, lượt đọc tệp skill, và kết nối session.
- Một bộ nhỏ các kịch bản tập trung vào skill (dùng so với tránh, gating, prompt injection).
- Đánh giá live tùy chọn (opt-in, có cổng env) chỉ sau khi bộ an toàn cho CI đã sẵn sàng.

## Kiểm thử hợp đồng (hình dạng Plugin và kênh)

Kiểm thử hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ
hợp đồng giao diện của nó. Chúng lặp qua tất cả Plugin được phát hiện và chạy một bộ
xác nhận về hình dạng và hành vi. Lane unit `pnpm test` mặc định cố ý
bỏ qua các tệp smoke và seam dùng chung này; hãy chạy các lệnh hợp đồng một cách rõ ràng
khi bạn chạm vào bề mặt kênh hoặc provider dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng provider: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Hình dạng Plugin cơ bản (id, tên, capability)
- **setup** - Hợp đồng wizard thiết lập
- **session-binding** - Hành vi binding session
- **outbound-payload** - Cấu trúc payload tin nhắn
- **inbound** - Xử lý tin nhắn đến
- **actions** - Handler hành động kênh
- **threading** - Xử lý ID thread
- **directory** - API thư mục/roster
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
- **discovery** - Phát hiện Plugin
- **loader** - Tải Plugin
- **runtime** - Runtime provider
- **shape** - Hình dạng/giao diện Plugin
- **wizard** - Wizard thiết lập

### Khi nào chạy

- Sau khi thay đổi export hoặc subpath của plugin-sdk
- Sau khi thêm hoặc sửa một Plugin kênh hoặc provider
- Sau khi refactor đăng ký hoặc phát hiện Plugin

Kiểm thử hợp đồng chạy trong CI và không yêu cầu khóa API thật.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một sự cố provider/mô hình được phát hiện trong live:

- Thêm hồi quy an toàn cho CI nếu có thể (provider mock/stub, hoặc ghi lại đúng phép biến đổi hình dạng request)
- Nếu về bản chất chỉ có thể kiểm thử live (rate limit, chính sách xác thực), giữ kiểm thử live hẹp và opt-in qua biến môi trường
- Ưu tiên nhắm vào lớp nhỏ nhất bắt được lỗi:
  - lỗi chuyển đổi/phát lại request của provider → kiểm thử mô hình trực tiếp
  - lỗi pipeline session/history/tool của gateway → smoke live gateway hoặc kiểm thử mock gateway an toàn cho CI
- Rào chắn duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một target được lấy mẫu cho mỗi lớp SecretRef từ metadata registry (`listSecretTargetRegistryEntries()`), rồi xác nhận các exec id có segment duyệt bị từ chối.
  - Nếu bạn thêm một họ target SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong kiểm thử đó. Kiểm thử cố ý thất bại với các target id chưa được phân loại để các lớp mới không thể bị bỏ qua âm thầm.

## Liên quan

- [Kiểm thử live](/vi/help/testing-live)
- [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
