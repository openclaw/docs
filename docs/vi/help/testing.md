---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Bổ sung kiểm thử hồi quy cho lỗi mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của Gateway và tác nhân
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử đơn vị/đầu cuối/trực tiếp, trình chạy Docker và phạm vi kiểm thử của từng bộ'
title: Kiểm thử
x-i18n:
    generated_at: "2026-07-12T07:59:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67eae48093add9188b07543080cdd0be41ae3d7b1c4a53ab187d17af6f6b2aeb
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (đơn vị/tích hợp, e2e, trực tiếp) cùng với các
trình chạy Docker. Trang này trình bày phạm vi của từng bộ kiểm thử, lệnh cần chạy
cho từng quy trình làm việc, cách các kiểm thử trực tiếp tìm thông tin xác thực và
cách bổ sung kiểm thử hồi quy cho các lỗi nhà cung cấp/mô hình trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các luồng vận chuyển trực tiếp)** được trình bày riêng:

- [Tổng quan QA](/vi/concepts/qa-e2e-automation) - kiến trúc, bề mặt lệnh, cách biên soạn kịch bản.
- [QA ma trận](/vi/concepts/qa-matrix) - tài liệu tham khảo cho `pnpm openclaw qa matrix`.
- [Bảng điểm mức độ trưởng thành](/vi/maturity/scorecard) - cách bằng chứng QA của bản phát hành hỗ trợ các quyết định về độ ổn định và LTS.
- [Kênh QA](/vi/channels/qa-channel) - Plugin vận chuyển mô phỏng được các kịch bản dựa trên kho mã sử dụng.

Trang này trình bày các bộ kiểm thử thông thường và các trình chạy Docker/Parallels. Phần [trình chạy dành riêng cho QA](#qa-specific-runners) bên dưới liệt kê các lệnh gọi `qa` cụ thể và dẫn lại đến các tài liệu tham khảo ở trên.
</Note>

## Bắt đầu nhanh

Trong hầu hết các ngày:

- Cổng kiểm tra đầy đủ (dự kiến chạy trước khi đẩy mã): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy có tài nguyên dồi dào: `pnpm test:max`
- Vòng lặp theo dõi Vitest trực tiếp: `pnpm test:watch`
- Nhắm mục tiêu trực tiếp theo tệp cũng định tuyến các đường dẫn Plugin/kênh: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Khi lặp lại để xử lý một lỗi đơn lẻ, hãy ưu tiên các lượt chạy có mục tiêu trước.
- Trang QA dựa trên Docker: `pnpm qa:lab:up`
- Luồng QA dựa trên máy ảo Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn sửa đổi kiểm thử hoặc muốn tăng độ tin cậy:

- Báo cáo độ bao phủ V8 mang tính tham khảo: `pnpm test:coverage`
- Bộ kiểm thử E2E: `pnpm test:e2e`

## Thư mục tạm cho kiểm thử

Sử dụng các hàm trợ giúp dùng chung trong `test/helpers/temp-dir.ts` cho các thư
mục tạm thuộc sở hữu của kiểm thử để quyền sở hữu được thể hiện rõ ràng và việc
dọn dẹp luôn nằm trong vòng đời kiểm thử:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("uses a temp workspace", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // use workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` chủ ý không cung cấp phương thức dọn
dẹp thủ công — Vitest chịu trách nhiệm dọn dẹp sau mỗi kiểm thử. Các hàm trợ giúp
cấp thấp cũ hơn (`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) vẫn tồn
tại cho những kiểm thử chưa được di chuyển; tránh sử dụng chúng trong mã mới và
tránh các lệnh gọi `fs.mkdtemp*` trần mới, trừ khi kiểm thử đang xác minh rõ ràng
hành vi thư mục tạm nguyên bản. Khi thực sự cần một thư mục tạm trần, hãy thêm
chú thích cho phép có thể kiểm tra với lý do:

```ts
// openclaw-temp-dir: allow verifies raw fs cleanup behavior
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` báo cáo việc tạo thư mục tạm trần
mới và cách sử dụng thủ công mới đối với hàm trợ giúp dùng chung trong các dòng
được thêm vào của bản sai khác mà không chặn các kiểu dọn dẹp hiện có. Lệnh này
dùng cùng cách phân loại đường dẫn kiểm thử như `scripts/changed-lanes.mjs` và bỏ
qua chính phần triển khai hàm trợ giúp dùng chung. `check:changed` chạy báo cáo
này cho các đường dẫn kiểm thử đã thay đổi dưới dạng tín hiệu CI chỉ cảnh báo
(chú thích cảnh báo của GitHub, không phải lỗi).

## Quy trình trực tiếp và Docker/Parallels

Khi gỡ lỗi các nhà cung cấp/mô hình thực (yêu cầu thông tin xác thực thực):

- Bộ kiểm thử trực tiếp (mô hình + thăm dò công cụ/hình ảnh của Gateway): `pnpm test:live`
- Nhắm mục tiêu âm thầm vào một tệp trực tiếp: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng thời gian chạy: kích hoạt `OpenClaw Performance` với
  `live_openai_candidate=true` cho một lượt tác nhân `openai/gpt-5.6-luna` thực hoặc
  `deep_profile=true` cho các hiện vật CPU/heap/dấu vết Kova. Các lượt chạy theo
  lịch hằng ngày xuất bản báo cáo cho các luồng nhà cung cấp mô phỏng, hồ sơ chuyên
  sâu và GPT-5.6 Luna lên `openclaw/clawgrit-reports` từ một tác vụ xuất bản riêng
  tiêu thụ hiện vật; xác thực của trình xuất bản bị thiếu hoặc không hợp lệ sẽ làm
  các lượt chạy theo lịch và `profile=release` thất bại. Các lượt kích hoạt thủ công
  không phải bản phát hành giữ lại hiện vật GitHub và coi việc xuất bản báo cáo là
  khuyến nghị. Báo cáo nhà cung cấp mô phỏng cũng bao gồm số liệu khởi động Gateway
  ở cấp mã nguồn, bộ nhớ, áp lực Plugin, vòng lặp chào hỏi lặp lại của mô hình giả và
  khởi động CLI.
- Quét mô hình trực tiếp bằng Docker: `pnpm test:docker:live-models`
  - Mỗi mô hình được chọn chạy một lượt văn bản cùng một phép thăm dò nhỏ theo kiểu
    đọc tệp. Các mô hình có siêu dữ liệu công bố đầu vào `image` cũng chạy một lượt
    hình ảnh nhỏ. Tắt các phép thăm dò bổ sung bằng
    `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi nhà cung cấp.
  - Phạm vi CI: cả `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi quy trình trực tiếp/E2E có thể tái sử
    dụng với `include_live_suites: true`, bao gồm các tác vụ ma trận mô hình trực
    tiếp Docker được phân mảnh theo nhà cung cấp.
  - Để chạy lại CI có trọng tâm, hãy kích hoạt `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm các bí mật nhà cung cấp mới có tín hiệu cao vào `scripts/ci-hydrate-live-auth.sh`,
    cùng với `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các
    thành phần gọi theo lịch/bản phát hành của tệp đó.
- Kiểm tra khói trò chuyện liên kết Codex nguyên bản: `pnpm test:docker:live-codex-bind`
  - Chạy một luồng trực tiếp Docker dựa trên đường dẫn máy chủ ứng dụng Codex, liên
    kết một tin nhắn riêng Slack mô phỏng bằng `/codex bind`, thực thi
    `/codex fast` và `/codex permissions`, sau đó xác minh một câu trả lời văn bản
    thuần túy và một tệp đính kèm hình ảnh được định tuyến qua liên kết Plugin
    nguyên bản thay vì ACP.
- Kiểm tra khói bộ khung máy chủ ứng dụng Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt tác nhân Gateway qua bộ khung máy chủ ứng dụng Codex thuộc sở hữu
    của Plugin, xác minh `/codex status` và `/codex models`, đồng thời mặc định thực
    thi các phép thăm dò hình ảnh, Cron MCP, tác nhân phụ và Guardian. Tắt phép thăm
    dò tác nhân phụ bằng `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi cô lập
    các lỗi khác. Để kiểm tra tác nhân phụ có trọng tâm, hãy tắt các phép thăm dò
    khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Quy trình này thoát sau phép thăm dò tác nhân phụ, trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Kiểm tra khói cài đặt Codex theo yêu cầu: `pnpm test:docker:codex-on-demand`
  - Cài đặt gói tarball OpenClaw đã đóng gói trong Docker, chạy quy trình thiết lập
    ban đầu bằng khóa API OpenAI và xác minh Plugin Codex cùng phần phụ thuộc
    `@openai/codex` đã được tải xuống thư mục gốc dự án npm được quản lý theo yêu cầu.
- Kiểm tra khói phần phụ thuộc công cụ Plugin trực tiếp: `pnpm test:docker:live-plugin-tool`
  - Đóng gói một Plugin mẫu có phần phụ thuộc `slugify` thực, cài đặt qua
    `npm-pack:`, xác minh phần phụ thuộc trong thư mục gốc dự án npm được quản lý,
    sau đó yêu cầu một mô hình OpenAI trực tiếp gọi công cụ Plugin và trả về slug
    ẩn.
- Kiểm tra khói lệnh cứu hộ Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Kiểm tra tự chọn với nhiều lớp bảo vệ cho bề mặt lệnh cứu hộ của kênh tin nhắn.
    Thực thi `/crestodian status`, đưa một thay đổi mô hình lâu bền vào hàng đợi,
    trả lời `/crestodian yes`, rồi xác minh đường dẫn ghi kiểm toán/cấu hình.
- Kiểm tra khói Docker cho lần chạy đầu của Crestodian: `pnpm test:docker:crestodian-first-run`
  - Bắt đầu từ một thư mục trạng thái OpenClaw trống và trước tiên chứng minh rằng
    CLI `openclaw crestodian` đã đóng gói đóng an toàn khi không có suy luận. Sau đó,
    quy trình kiểm thử và kích hoạt Claude giả thông qua mô-đun kích hoạt đã đóng
    gói. Chỉ sau đó, một yêu cầu CLI đã đóng gói với cách diễn đạt gần đúng mới đến
    bộ lập kế hoạch và phân giải thành thiết lập có kiểu, tiếp theo là các thao tác
    một lần cho mô hình, tác nhân, Plugin Discord và SecretRef. Quy trình xác thực
    cấu hình và các mục kiểm toán. Đây là bằng chứng hỗ trợ cho cổng kiểm tra/thao
    tác, không phải bằng chứng về quy trình thiết lập ban đầu tương tác hoặc tác
    nhân/công cụ/phê duyệt Crestodian. Luồng tương tự được cung cấp trong QA Lab qua
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Kiểm tra khói chi phí Moonshot/Kimi: khi đã đặt `MOONSHOT_API_KEY`, chạy
  `openclaw models list --provider moonshot --json`, sau đó chạy một lệnh độc lập
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  với `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và bản ghi hội thoại
  của trợ lý lưu `usage.cost` đã chuẩn hóa.

<Tip>
Khi chỉ cần xử lý một trường hợp lỗi, hãy ưu tiên thu hẹp kiểm thử trực tiếp bằng các biến môi trường danh sách cho phép được mô tả bên dưới.
</Tip>

## Trình chạy dành riêng cho QA

Các lệnh này nằm bên cạnh các bộ kiểm thử chính khi bạn cần mức độ chân thực của QA Lab.

CI chạy QA Lab trong các quy trình chuyên biệt. Tính tương đương tác nhân được
lồng trong `QA-Lab - All Lanes` và hoạt động xác thực bản phát hành, không phải
một quy trình PR độc lập. Hoạt động xác thực diện rộng nên dùng
`Full Release Validation` với `rerun_group=qa-parity` hoặc nhóm QA của kiểm tra
bản phát hành. Các lượt kiểm tra bản phát hành ổn định/mặc định giữ kiểm thử
ngâm trực tiếp/Docker toàn diện sau `run_release_soak=true`; hồ sơ `full` buộc
bật kiểm thử ngâm. `QA-Lab - All Lanes` chạy hằng đêm trên `main` và từ lượt
kích hoạt thủ công với luồng tương đương mô phỏng, luồng Matrix trực tiếp,
luồng Telegram trực tiếp do Convex quản lý và luồng Discord trực tiếp do
Convex quản lý dưới dạng các tác vụ song song. QA theo lịch và kiểm tra bản
phát hành truyền rõ ràng `--profile fast` cho Matrix, trong khi giá trị mặc
định của CLI Matrix và đầu vào quy trình thủ công vẫn là `all`; lượt kích hoạt
thủ công có thể phân mảnh `all` thành các tác vụ `transport`, `media`,
`e2ee-smoke`, `e2ee-deep` và `e2ee-cli`. `OpenClaw Release Checks` chạy tính
tương đương cùng các luồng Matrix nhanh và Telegram trước khi phê duyệt bản
phát hành, sử dụng `mock-openai/gpt-5.6-luna` cho kiểm tra vận chuyển của bản
phát hành để giữ tính xác định và tránh việc khởi động Plugin nhà cung cấp
thông thường. Các Gateway vận chuyển trực tiếp này tắt tìm kiếm bộ nhớ; hành
vi bộ nhớ vẫn được bao phủ bởi các bộ kiểm thử tương đương QA.

Các phân mảnh phương tiện trực tiếp của bản phát hành đầy đủ sử dụng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, trong đó đã có sẵn
`ffmpeg` và `ffprobe`. Các phân mảnh mô hình/phần phụ trợ trực tiếp Docker sử
dụng hình ảnh dùng chung `ghcr.io/openclaw/openclaw-live-test:<sha>` được dựng
một lần cho mỗi commit đã chọn, sau đó kéo hình ảnh đó với
`OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì dựng lại trong từng phân mảnh.

- `pnpm openclaw qa suite`
  - Chạy trực tiếp các kịch bản QA dựa trên kho mã trên máy chủ.
  - Ghi các tạo phẩm cấp cao nhất `qa-evidence.json`, `qa-suite-summary.json` và
    `qa-suite-report.md` cho tập kịch bản đã chọn, bao gồm các lựa chọn kịch bản
    luồng hỗn hợp, Vitest và Playwright.
  - Khi được điều phối bởi `pnpm openclaw qa run --qa-profile <profile>`, nhúng
    bảng điểm hồ sơ phân loại đã chọn vào cùng tệp `qa-evidence.json`.
    `smoke-ci` ghi bằng chứng tinh gọn (`evidenceMode: "slim"`, không có
    `execution` cho từng mục). `release` bao quát phần được tuyển chọn để đánh
    giá mức độ sẵn sàng phát hành; `all` chọn mọi hạng mục trưởng thành đang
    hoạt động và hướng đến các lượt điều phối rõ ràng của quy trình QA Profile
    Evidence khi cần tạo phẩm bảng điểm đầy đủ.
  - Theo mặc định, chạy song song nhiều kịch bản đã chọn bằng các tiến trình
    Gateway được cô lập. `qa-channel` mặc định có mức đồng thời là 4 (bị giới
    hạn bởi số lượng kịch bản đã chọn). Dùng `--concurrency <count>` để điều
    chỉnh số lượng tiến trình, hoặc `--concurrency 1` cho luồng tuần tự cũ.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng
    `--allow-failures` để tạo tạo phẩm mà không trả về mã thoát báo lỗi.
  - Hỗ trợ các chế độ nhà cung cấp `live-frontier`, `mock-openai` và `aimock`.
    `aimock` khởi động một máy chủ nhà cung cấp cục bộ dựa trên AIMock để thử
    nghiệm mức bao phủ của fixture và mô phỏng giao thức mà không thay thế
    luồng `mock-openai` nhận biết kịch bản.
- `pnpm openclaw qa coverage --match <query>`
  - Tìm kiếm ID kịch bản, tiêu đề, bề mặt, ID mức bao phủ, tham chiếu tài liệu,
    tham chiếu mã, plugin và yêu cầu nhà cung cấp, sau đó in các mục tiêu bộ
    kiểm thử phù hợp.
  - Dùng lệnh này trước khi chạy QA Lab khi bạn biết hành vi hoặc đường dẫn tệp
    bị tác động nhưng chưa biết kịch bản nhỏ nhất. Chỉ mang tính tư vấn — vẫn
    phải chọn bằng chứng mô phỏng, trực tiếp, Multipass, Matrix hoặc lớp vận
    chuyển dựa trên hành vi đang được thay đổi.
- `pnpm test:plugins:kitchen-sink-live`
  - Chạy chuỗi kiểm thử khắt khe trực tiếp cho plugin OpenAI Kitchen Sink thông
    qua QA Lab. Cài đặt gói Kitchen Sink bên ngoài, xác minh danh mục bề mặt
    SDK của plugin, thăm dò `/healthz` và `/readyz`, ghi lại bằng chứng CPU/RSS
    của Gateway, chạy một lượt OpenAI trực tiếp và kiểm tra chẩn đoán đối
    kháng. Yêu cầu thông tin xác thực OpenAI trực tiếp, chẳng hạn như
    `OPENAI_API_KEY`. Trong các phiên Testbox đã được nạp sẵn, lệnh tự động nạp
    hồ sơ xác thực trực tiếp của Testbox khi có trình trợ giúp
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy phép đo hiệu năng khởi động Gateway cùng một gói kịch bản QA Lab mô
    phỏng nhỏ (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi bản tóm tắt quan sát CPU kết hợp
    trong `.artifacts/gateway-cpu-scenarios/`.
  - Theo mặc định, chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`,
    mặc định `0.9`; `--hot-wall-warn-ms`, mặc định `30000`), vì vậy các đợt
    tăng ngắn khi khởi động được ghi dưới dạng chỉ số mà không trông giống lỗi
    hồi quy khiến Gateway bị ghim CPU trong nhiều phút.
  - Chạy trên các tạo phẩm `dist` đã được dựng; hãy dựng trước nếu bản làm việc
    chưa có đầu ra thời gian chạy mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA bên trong máy ảo Linux Multipass dùng một lần, giữ nguyên
    các cờ lựa chọn kịch bản, nhà cung cấp và mô hình như `qa suite`.
  - Các lượt chạy trực tiếp chuyển tiếp những đầu vào xác thực QA khả dụng cho
    máy khách: khóa nhà cung cấp dựa trên biến môi trường, đường dẫn cấu hình
    nhà cung cấp trực tiếp của QA và `CODEX_HOME` khi có.
  - Các thư mục đầu ra phải nằm dưới thư mục gốc của kho mã để máy khách có thể
    ghi ngược qua không gian làm việc được gắn kết.
  - Ghi báo cáo và bản tóm tắt QA thông thường cùng nhật ký Multipass trong
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động trang QA dựa trên Docker cho công việc QA theo kiểu người vận
    hành.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Dựng một tarball npm từ bản làm việc hiện tại, cài đặt toàn cục trong
    Docker, chạy quy trình thiết lập ban đầu không tương tác bằng khóa API
    OpenAI, cấu hình Telegram theo mặc định, xác minh thời gian chạy plugin đã
    đóng gói tải được mà không cần sửa chữa phần phụ thuộc lúc khởi động, chạy
    doctor và chạy một lượt tác tử cục bộ với điểm cuối OpenAI được mô phỏng.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng luồng cài đặt gói
    với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy kiểm thử nhanh Docker có tính xác định cho ứng dụng đã dựng đối với
    bản chép lời ngữ cảnh thời gian chạy nhúng. Xác minh ngữ cảnh thời gian
    chạy OpenClaw ẩn được duy trì dưới dạng thông báo tùy chỉnh không hiển thị
    thay vì rò rỉ vào lượt người dùng hiển thị, sau đó khởi tạo một phiên JSONL
    bị lỗi chịu ảnh hưởng và xác minh `openclaw doctor --fix` ghi lại phiên đó
    vào nhánh đang hoạt động kèm bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một gói OpenClaw ứng viên trong Docker, chạy quy trình thiết lập
    ban đầu của gói đã cài đặt, cấu hình Telegram qua CLI đã cài đặt, sau đó
    tái sử dụng luồng QA Telegram trực tiếp với gói đã cài đặt đó làm Gateway
    của hệ thống đang được kiểm thử.
  - Trình bao chỉ gắn kết mã nguồn bộ kiểm thử `qa-lab` từ bản làm việc; gói đã
    cài đặt sở hữu `dist`, `openclaw/plugin-sdk` và thời gian chạy plugin đi
    kèm, vì vậy luồng này không trộn các plugin của bản làm việc hiện tại vào
    gói đang được kiểm thử.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã phân giải
    thay vì cài đặt từ kho đăng ký.
  - Theo mặc định, phát ra thời gian RTT lặp lại trong `qa-evidence.json` với
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Ghi đè
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` hoặc
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` để điều chỉnh lượt chạy.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` chấp nhận danh sách ID kiểm tra QA
    Telegram được phân tách bằng dấu phẩy để lấy mẫu; khi không đặt, kiểm tra
    mặc định hỗ trợ RTT là `telegram-mentioned-message-reply`.
  - Sử dụng cùng thông tin xác thực Telegram trong biến môi trường hoặc nguồn
    thông tin xác thực Convex như `pnpm openclaw qa telegram`. Đối với tự động
    hóa CI/phát hành, hãy đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cùng với
    `OPENCLAW_QA_CONVEX_SITE_URL` và bí mật vai trò. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và bí mật vai trò Convex có trong CI, trình
    bao Docker sẽ tự động chọn Convex.
  - Trình bao xác thực biến môi trường thông tin xác thực Telegram hoặc Convex
    trên máy chủ trước khi dựng/cài đặt Docker. Chỉ đặt
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` khi chủ ý gỡ lỗi khâu
    thiết lập trước thông tin xác thực.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho luồng này. Khi chọn thông
    tin xác thực Convex mà không đặt vai trò, trình bao dùng `ci` trong CI và
    `maintainer` bên ngoài CI.
  - GitHub Actions cung cấp luồng này dưới dạng quy trình thủ công dành cho
    người bảo trì `NPM Telegram Beta E2E`. Quy trình không chạy khi hợp nhất.
    Quy trình sử dụng môi trường `qa-live-shared` và hợp đồng thuê thông tin
    xác thực CI của Convex.
- GitHub Actions cũng cung cấp `Package Acceptance` để chứng minh sản phẩm bằng
  lượt chạy phụ với một gói ứng viên. Quy trình chấp nhận tham chiếu Git, đặc
  tả npm đã phát hành, URL tarball HTTPS kèm SHA-256, chính sách URL đáng tin
  cậy hoặc tạo phẩm tarball từ một lượt chạy khác
  (`source=ref|npm|url|trusted-url|artifact`), tải lên
  `openclaw-current.tgz` đã chuẩn hóa dưới tên `package-under-test`, sau đó
  chạy bộ lập lịch E2E Docker hiện có với các hồ sơ luồng `smoke`, `package`,
  `product`, `full` hoặc `custom`. Đặt `telegram_mode=mock-openai` hoặc
  `live-frontier` để chạy quy trình QA Telegram với cùng tạo phẩm
  `package-under-test`.
  - Bằng chứng sản phẩm beta mới nhất:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bằng chứng bằng URL tarball chính xác yêu cầu mã băm và sử dụng chính sách an
  toàn URL công khai:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Các bản sao tarball doanh nghiệp/riêng tư sử dụng chính sách nguồn đáng tin
  cậy rõ ràng:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` đọc `.github/package-trusted-sources.json` từ tham chiếu
quy trình đáng tin cậy và không chấp nhận thông tin xác thực trong URL hoặc cơ
chế bỏ qua mạng riêng từ đầu vào quy trình. Nếu chính sách được đặt tên khai
báo xác thực bearer, hãy cấu hình bí mật cố định
`OPENCLAW_TRUSTED_PACKAGE_TOKEN`.

- Bằng chứng bằng tạo phẩm tải xuống một tạo phẩm tarball từ lượt chạy Actions
  khác:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Đóng gói và cài đặt bản dựng OpenClaw hiện tại trong Docker, khởi động
    Gateway với OpenAI đã cấu hình, sau đó bật các kênh/plugin đi kèm thông qua
    chỉnh sửa cấu hình.
  - Xác minh quá trình khám phá khi thiết lập không cài các plugin có thể tải
    xuống nhưng chưa được cấu hình, lần sửa chữa doctor đầu tiên sau khi cấu
    hình sẽ cài đặt rõ ràng từng plugin có thể tải xuống còn thiếu và lần khởi
    động lại thứ hai không thực hiện sửa chữa phần phụ thuộc ẩn.
  - Đồng thời cài đặt một bản cơ sở npm cũ đã biết, bật Telegram trước khi chạy
    `openclaw update --tag <candidate>` và xác minh doctor sau cập nhật của ứng
    viên dọn sạch phần phụ thuộc plugin cũ còn sót lại mà không cần sửa chữa
    hậu cài đặt từ phía bộ kiểm thử.
- `pnpm test:parallels:npm-update`
  - Chạy kiểm thử nhanh cập nhật cài đặt gói gốc trên các máy khách Parallels.
    Mỗi nền tảng được chọn trước tiên cài đặt gói cơ sở được yêu cầu, sau đó
    chạy lệnh `openclaw update` đã cài đặt trong cùng máy khách và xác minh
    phiên bản đã cài đặt, trạng thái cập nhật, mức sẵn sàng của Gateway và một
    lượt tác tử cục bộ.
  - Dùng `--platform macos`, `--platform windows` hoặc `--platform linux` khi
    lặp lại trên một máy khách. Dùng `--json` để lấy đường dẫn tạo phẩm tóm tắt
    và trạng thái theo từng luồng.
  - Theo mặc định, luồng OpenAI dùng `openai/gpt-5.6-luna` để chứng minh lượt
    tác tử trực tiếp. Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` để xác thực một mô hình OpenAI khác.
  - Bọc các lượt chạy cục bộ dài bằng thời gian chờ trên máy chủ để tình trạng
    đình trệ lớp vận chuyển Parallels không thể chiếm hết khoảng thời gian
    kiểm thử còn lại:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Tập lệnh ghi nhật ký luồng lồng nhau trong
    `/tmp/openclaw-parallels-npm-update.*`. Hãy kiểm tra `windows-update.log`,
    `macos-update.log` hoặc `linux-update.log` trước khi cho rằng trình bao bên
    ngoài bị treo.
  - Quá trình cập nhật Windows có thể mất 10 đến 15 phút cho doctor sau cập
    nhật và công việc cập nhật gói trên máy khách chưa được làm nóng; trạng
    thái vẫn bình thường khi nhật ký gỡ lỗi npm lồng nhau tiếp tục tiến triển.
  - Không chạy trình bao tổng hợp này song song với các luồng kiểm thử nhanh
    Parallels riêng lẻ cho macOS, Windows hoặc Linux. Chúng dùng chung trạng
    thái máy ảo và có thể xung đột khi khôi phục ảnh chụp nhanh, phục vụ gói
    hoặc quản lý trạng thái Gateway của máy khách.
  - Bằng chứng sau cập nhật chạy bề mặt plugin đi kèm thông thường vì các
    facade khả năng như giọng nói, tạo ảnh và hiểu nội dung đa phương tiện được
    tải qua API thời gian chạy đi kèm, ngay cả khi chính lượt tác tử chỉ kiểm
    tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ nhà cung cấp AIMock cục bộ để kiểm thử nhanh giao thức
    trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy luồng QA trực tiếp của Matrix với máy chủ homeserver Tuwunel dùng một lần,
    được Docker hỗ trợ. Chỉ dành cho bản checkout mã nguồn — các bản cài đặt đóng gói
    không phân phối `qa-lab`.
  - Toàn bộ CLI, danh mục hồ sơ/kịch bản, biến môi trường và bố cục hiện vật:
    [QA Matrix](/vi/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Chạy luồng QA trực tiếp của Telegram với một nhóm riêng tư thực, sử dụng token
    bot trình điều khiển và SUT từ môi trường.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` và
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID nhóm phải là ID trò chuyện Telegram
    dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực dùng chung trong nhóm.
    Theo mặc định, hãy dùng chế độ môi trường hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    để chọn sử dụng các lượt thuê từ nhóm dùng chung.
  - Các giá trị mặc định bao phủ canary, kiểm soát đề cập, định địa chỉ lệnh, `/status`,
    phản hồi có đề cập giữa các bot và phản hồi lệnh gốc cốt lõi.
    Các giá trị mặc định của `mock-openai` cũng bao phủ chuỗi phản hồi xác định và
    các lỗi hồi quy khi truyền phát tin nhắn cuối cùng của Telegram. Dùng `--list-scenarios`
    cho các phép thăm dò tùy chọn như `session_status`.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` để
    tạo hiện vật mà không có mã thoát báo lỗi.
  - Yêu cầu hai bot riêng biệt trong cùng một nhóm riêng tư, trong đó bot SUT
    công khai tên người dùng Telegram.
  - Để quan sát ổn định giao tiếp giữa các bot, hãy bật Bot-to-Bot Communication Mode
    trong `@BotFather` cho cả hai bot và bảo đảm bot trình điều khiển có thể quan sát
    lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, bản tóm tắt và `qa-evidence.json` vào
    `.artifacts/qa-e2e/...`. Các kịch bản có phản hồi bao gồm RTT từ yêu cầu gửi của
    trình điều khiển đến phản hồi SUT được quan sát.

`Mantis Telegram Live` là trình bao bằng chứng PR quanh luồng này. Nó chạy
tham chiếu ứng viên bằng thông tin xác thực Telegram được thuê qua Convex, hiển thị
gói báo cáo/bằng chứng QA đã biên tập trong trình duyệt máy tính Crabbox, ghi lại
bằng chứng MP4, tạo GIF đã cắt bỏ phần không chuyển động, tải gói hiện vật lên và
đăng bằng chứng nội tuyến lên PR thông qua Mantis GitHub App khi `pr_number` được
đặt. Người bảo trì có thể khởi động từ giao diện Actions thông qua `Mantis Scenario`
(`scenario_id: telegram-live`) hoặc trực tiếp từ bình luận trong yêu cầu kéo:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` là trình bao tác tử trước/sau dành cho ứng dụng
Telegram Desktop gốc để cung cấp bằng chứng trực quan cho PR. Khởi động từ giao diện
Actions bằng `instructions` dạng tự do, thông qua `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) hoặc từ bình luận trong PR:

```text
@openclaw-mantis telegram desktop proof
```

Tác tử Mantis đọc PR, quyết định hành vi hiển thị trên Telegram nào chứng minh
thay đổi, chạy luồng bằng chứng Telegram Desktop Crabbox dành cho người dùng thực
trên tham chiếu cơ sở và ứng viên, lặp lại cho đến khi các GIF gốc hữu ích,
ghi tệp kê khai `motionPreview` theo cặp và đăng cùng một bảng GIF 2 cột
thông qua Mantis GitHub App khi `pr_number` được đặt.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Thuê hoặc tái sử dụng máy tính Linux Crabbox, cài đặt Telegram Desktop gốc,
    cấu hình OpenClaw bằng token bot SUT Telegram được thuê, khởi động Gateway
    và ghi bằng chứng ảnh chụp màn hình/MP4 từ màn hình VNC hiển thị.
  - Mặc định dùng `--credential-source convex` để các quy trình công việc chỉ cần
    bí mật của trình môi giới Convex. Dùng `--credential-source env` với cùng các
    biến `OPENCLAW_QA_TELEGRAM_*` như `pnpm openclaw qa telegram`.
  - Telegram Desktop vẫn cần hồ sơ/đăng nhập người dùng. Token bot chỉ cấu hình
    OpenClaw. Dùng `--telegram-profile-archive-env <name>` cho tệp lưu trữ hồ sơ
    `.tgz` mã hóa base64 hoặc dùng `--keep-lease` và đăng nhập thủ công qua VNC
    một lần.
  - Ghi `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` và `telegram-desktop-builder.mp4`
    vào thư mục đầu ra.

Các luồng truyền tải trực tiếp dùng chung một hợp đồng tiêu chuẩn để các phương thức
truyền tải mới không bị sai lệch; ma trận phạm vi cho từng luồng nằm tại
[Tổng quan QA — Phạm vi truyền tải trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` là bộ kiểm thử tổng hợp diện rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi bật `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
cho QA truyền tải trực tiếp, phòng thí nghiệm QA nhận một lượt thuê độc quyền từ
nhóm được Convex hỗ trợ, gửi Heartbeat cho lượt thuê đó trong khi luồng đang chạy
và giải phóng lượt thuê khi tắt. Tên phần này có trước khi hỗ trợ Discord, Slack và
WhatsApp; hợp đồng thuê được dùng chung giữa các loại.

Bộ khung dự án Convex tham chiếu: `qa/convex-credential-broker/`

Các biến môi trường bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một bí mật cho vai trò đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn vai trò thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định từ môi trường: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI,
    nếu không thì là `maintainer`)

Các biến môi trường tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID truy vết tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` local loopback
  chỉ dành cho phát triển cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong hoạt động thông thường.

Các lệnh quản trị dành cho người bảo trì (thêm/xóa/liệt kê nhóm) bắt buộc phải có
riêng `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Các trình trợ giúp CLI dành cho người bảo trì:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước các lần chạy trực tiếp để kiểm tra URL trang Convex, bí mật
của trình môi giới, tiền tố điểm cuối, thời gian chờ HTTP và khả năng truy cập
quản trị/liệt kê mà không in giá trị bí mật. Dùng `--json` để tạo đầu ra máy có thể
đọc trong tập lệnh và tiện ích CI.

Hợp đồng điểm cuối mặc định (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Các yêu cầu xác thực bằng tiêu đề `Authorization: Bearer <role secret>`;
các phần thân bên dưới lược bỏ tiêu đề đó:

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
- `POST /admin/add` (chỉ bí mật của người bảo trì)
  - Yêu cầu: `{ kind, actorId, payload, note?, status? }`
  - Thành công: `{ status: "ok", credential }`
- `POST /admin/remove` (chỉ bí mật của người bảo trì)
  - Yêu cầu: `{ credentialId, actorId }`
  - Thành công: `{ status: "ok", changed, credential }`
  - Biện pháp bảo vệ lượt thuê đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ bí mật của người bảo trì)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Dạng tải trọng cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi ID trò chuyện Telegram dạng số.
- `admin/add` xác thực dạng này cho `kind: "telegram"` và từ chối tải trọng sai định dạng.

Dạng tải trọng cho loại người dùng thực Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` và `telegramApiId` phải là các chuỗi dạng số.
- `tdlibArchiveSha256` và `desktopTdataArchiveSha256` phải là chuỗi hex SHA-256.
- `kind: "telegram-user"` được dành riêng cho quy trình công việc bằng chứng
  Mantis Telegram Desktop. Các luồng QA Lab chung tuyệt đối không được nhận loại này.

Các tải trọng đa kênh được trình môi giới xác thực:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Các luồng Slack cũng có thể thuê từ nhóm, nhưng việc xác thực tải trọng Slack
hiện nằm trong trình chạy QA Slack thay vì trình môi giới. Dùng
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
cho các hàng Slack.

### Thêm kênh vào QA

Kiến trúc và tên trình trợ giúp kịch bản cho bộ điều hợp kênh mới nằm tại
[Tổng quan QA — Thêm kênh](/vi/concepts/qa-e2e-automation#adding-a-channel).
Yêu cầu tối thiểu: triển khai trình chạy truyền tải trên đường nối máy chủ `qa-lab`
dùng chung, thêm `adapterFactory` cho các kịch bản dùng chung, khai báo `qaRunners`
trong tệp kê khai Plugin, gắn dưới dạng `openclaw qa <runner>` và viết kịch bản
trong `qa/scenarios/`.

## Các bộ kiểm thử (chạy ở đâu)

Hãy xem các bộ kiểm thử là mức "tăng dần độ chân thực" (đồng thời tăng độ thiếu
ổn định/chi phí).

### Đơn vị / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lần chạy không nhắm mục tiêu dùng tập phân đoạn
  `vitest.full-*.config.ts` và có thể mở rộng các phân đoạn đa dự án thành cấu hình
  cho từng dự án để lập lịch song song
- Tệp: danh mục cốt lõi/đơn vị trong `src/**/*.test.ts`,
  `packages/**/*.test.ts` và `test/**/*.test.ts`; kiểm thử đơn vị giao diện người dùng
  chạy trong phân đoạn chuyên biệt `unit-ui`
- Phạm vi:
  - Kiểm thử đơn vị thuần túy
  - Kiểm thử tích hợp trong tiến trình (xác thực Gateway, định tuyến, công cụ, phân tích cú pháp, cấu hình)
  - Kiểm thử hồi quy xác định cho các lỗi đã biết
- Kỳ vọng:
  - Chạy trong CI
  - Không yêu cầu khóa thực
  - Phải nhanh và ổn định
  - Các kiểm thử bộ phân giải và trình tải bề mặt công khai phải chứng minh hành vi
    dự phòng diện rộng của `api.js` và `runtime-api.js` bằng các đồ gá Plugin nhỏ được
    tạo ra, không phải API mã nguồn Plugin đi kèm thực tế. Việc tải API Plugin thực
    thuộc về các bộ hợp đồng/tích hợp do Plugin sở hữu.

Chính sách phụ thuộc gốc:

- Các bản cài đặt kiểm thử mặc định bỏ qua những bản dựng opus Discord gốc tùy chọn.
  Thoại Discord dùng `libopus-wasm` đi kèm, còn `@discordjs/opus` luôn bị tắt trong
  `allowBuilds` để các luồng kiểm thử cục bộ và Testbox không biên dịch phần bổ trợ gốc.
- So sánh hiệu năng opus gốc trong kho lưu trữ chuẩn đánh giá `libopus-wasm`, không
  phải trong các vòng lặp cài đặt/kiểm thử OpenClaw mặc định. Không đặt
  `@discordjs/opus` thành `true` trong `allowBuilds` mặc định; điều đó khiến các vòng
  lặp cài đặt/kiểm thử không liên quan phải biên dịch mã gốc.

<AccordionGroup>
  <Accordion title="Dự án, phân đoạn và luồng có phạm vi">

    - Lệnh `pnpm test` không chỉ định mục tiêu sẽ chạy mười ba cấu hình phân đoạn nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình dự án gốc khổng lồ duy nhất. Cách này làm giảm RSS đỉnh trên các máy đang chịu tải và tránh để công việc auto-reply/Plugin làm thiếu tài nguyên của các bộ kiểm thử không liên quan.
    - `pnpm test --watch` vẫn sử dụng đồ thị dự án `vitest.config.ts` gốc nguyên bản, vì vòng lặp theo dõi nhiều phân đoạn không khả thi.
    - `pnpm test`, `pnpm test:watch` và `pnpm test:perf:imports` trước tiên định tuyến các mục tiêu tệp/thư mục được chỉ định rõ qua các luồng có phạm vi, nên `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải chịu toàn bộ chi phí khởi động của dự án gốc.
    - Theo mặc định, `pnpm test:changed` mở rộng các đường dẫn git đã thay đổi thành những luồng có phạm vi ít tốn tài nguyên: các chỉnh sửa trực tiếp đối với tệp kiểm thử, các tệp `*.test.ts` cùng cấp, ánh xạ nguồn tường minh và các thành phần phụ thuộc trong đồ thị nhập cục bộ. Các chỉnh sửa cấu hình/thiết lập/gói không kích hoạt chạy kiểm thử diện rộng trừ khi bạn sử dụng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường cho công việc có phạm vi hẹp. Lệnh này phân loại phần khác biệt thành lõi, kiểm thử lõi, tiện ích mở rộng, kiểm thử tiện ích mở rộng, ứng dụng, tài liệu, siêu dữ liệu phát hành, công cụ Docker trực tiếp và công cụ, sau đó chạy các lệnh kiểm tra kiểu, lint và bảo vệ tương ứng. Lệnh này không chạy kiểm thử Vitest; hãy gọi `pnpm test:changed` hoặc `pnpm test <target>` với mục tiêu cụ thể để cung cấp bằng chứng kiểm thử. Các lần tăng phiên bản chỉ liên quan đến siêu dữ liệu phát hành sẽ chạy các kiểm tra có mục tiêu về phiên bản/cấu hình/phụ thuộc gốc, kèm một cơ chế bảo vệ từ chối các thay đổi gói nằm ngoài trường phiên bản cấp cao nhất.
    - Các chỉnh sửa bộ kiểm thử Docker ACP trực tiếp sẽ chạy những kiểm tra tập trung: cú pháp shell cho các tập lệnh xác thực Docker trực tiếp và một lần chạy thử không thực thi của bộ lập lịch Docker trực tiếp. Các thay đổi `package.json` chỉ được bao gồm khi phần khác biệt giới hạn ở `scripts["test:docker:live-*"]`; các chỉnh sửa về phụ thuộc, xuất, phiên bản và những bề mặt gói khác vẫn sử dụng các cơ chế bảo vệ rộng hơn.
    - Các kiểm thử đơn vị ít nhập từ agent, lệnh, Plugin, trình trợ giúp auto-reply, `plugin-sdk` và các khu vực tiện ích thuần túy tương tự được định tuyến qua luồng `unit-fast`, luồng này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái hoặc nặng về thời gian chạy vẫn nằm trên các luồng hiện có.
    - Một số tệp nguồn trợ giúp `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy ở chế độ thay đổi tới các kiểm thử cùng cấp cụ thể trong những luồng nhẹ đó, nhờ vậy các chỉnh sửa trợ giúp tránh phải chạy lại toàn bộ bộ kiểm thử nặng của thư mục đó.
    - `auto-reply` có các nhóm riêng cho trình trợ giúp lõi cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất và cây con `src/auto-reply/reply/**`. CI tiếp tục chia cây con reply thành các phân đoạn agent-runner, dispatch và định tuyến lệnh/trạng thái để một nhóm nhập nặng không chiếm toàn bộ phần đuôi Node.
    - CI thông thường cho PR/main chủ ý bỏ qua lượt quét theo lô Plugin đi kèm và phân đoạn `agentic-plugins` chỉ dành cho phát hành. Quy trình Xác thực Bản phát hành Đầy đủ kích hoạt quy trình con `Plugin Prerelease` riêng biệt cho các bộ kiểm thử nặng về Plugin đó trên các bản ứng viên phát hành.

  </Accordion>

  <Accordion title="Phạm vi kiểm thử trình chạy nhúng">

    - Khi bạn thay đổi đầu vào khám phá công cụ thông báo hoặc ngữ cảnh thời gian chạy Compaction, hãy duy trì cả hai cấp độ kiểm thử.
    - Thêm các kiểm thử hồi quy tập trung cho các ranh giới định tuyến và chuẩn hóa thuần túy.
    - Duy trì trạng thái ổn định cho các bộ kiểm thử tích hợp trình chạy nhúng:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` và
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ kiểm thử đó xác minh rằng mã định danh có phạm vi và hành vi Compaction vẫn truyền qua các đường dẫn `run.ts` / `compact.ts` thực tế; chỉ kiểm thử trình trợ giúp không thể thay thế đầy đủ các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Giá trị mặc định về nhóm và cách ly của Vitest">

    - Cấu hình Vitest cơ sở mặc định sử dụng `threads`.
    - Cấu hình Vitest dùng chung đặt cố định `isolate: false` và sử dụng trình chạy không cách ly trên các dự án gốc, cấu hình e2e và cấu hình trực tiếp.
    - Luồng giao diện người dùng gốc giữ nguyên thiết lập `jsdom` và trình tối ưu hóa, nhưng cũng chạy trên trình chạy không cách ly dùng chung.
    - Mỗi phân đoạn `pnpm test` kế thừa cùng các giá trị mặc định `threads` + `isolate: false` từ cấu hình Vitest dùng chung.
    - Theo mặc định, `scripts/run-vitest.mjs` thêm `--no-maglev` cho các tiến trình Node con của Vitest để giảm việc biên dịch lặp lại của V8 trong các lần chạy cục bộ lớn. Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8 tiêu chuẩn.
    - `scripts/run-vitest.mjs` chấm dứt các lần chạy Vitest không theo dõi được chỉ định rõ sau 5 phút không có đầu ra stdout hoặc stderr. Đặt `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` để tắt cơ chế giám sát cho một cuộc điều tra chủ ý không tạo đầu ra.

  </Accordion>

  <Accordion title="Lặp cục bộ nhanh">

    - `pnpm changed:lanes` hiển thị những luồng kiến trúc mà một phần khác biệt kích hoạt.
    - Hook trước khi commit chỉ thực hiện định dạng. Hook này thêm lại các tệp đã định dạng vào vùng chờ và không chạy lint, kiểm tra kiểu hoặc kiểm thử.
    - Chạy rõ ràng `pnpm check:changed` trước khi bàn giao hoặc đẩy mã khi bạn cần cổng kiểm tra cục bộ thông minh.
    - Theo mặc định, `pnpm test:changed` định tuyến qua các luồng có phạm vi ít tốn tài nguyên. Chỉ sử dụng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent xác định rằng một chỉnh sửa bộ kiểm thử, cấu hình, gói hoặc hợp đồng thực sự cần phạm vi kiểm thử Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ nguyên hành vi định tuyến, chỉ khác là có giới hạn worker cao hơn.
    - Khả năng tự động điều chỉnh quy mô worker cục bộ được thiết kế thận trọng và giảm tải khi mức tải trung bình của máy chủ đã cao, nhờ đó nhiều lần chạy Vitest đồng thời mặc định gây ít ảnh hưởng hơn.
    - Cấu hình Vitest cơ sở đánh dấu các dự án/tệp cấu hình là `forceRerunTriggers` để các lần chạy lại ở chế độ thay đổi vẫn chính xác khi hệ thống nối kết kiểm thử thay đổi.
    - Cấu hình giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` được bật trên các máy chủ được hỗ trợ; đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` để chỉ định một vị trí bộ nhớ đệm cụ thể cho việc phân tích hiệu năng trực tiếp.

  </Accordion>

  <Accordion title="Gỡ lỗi hiệu năng">

    - `pnpm test:perf:imports` bật báo cáo thời lượng nhập của Vitest cùng đầu ra phân tích chi tiết hoạt động nhập.
    - `pnpm test:perf:imports:changed` giới hạn cùng chế độ xem phân tích hiệu năng vào các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian phân đoạn được ghi vào `.artifacts/vitest-shard-timings.json`. Các lần chạy toàn bộ cấu hình sử dụng đường dẫn cấu hình làm khóa; các phân đoạn CI theo mẫu bao gồm nối thêm tên phân đoạn để có thể theo dõi riêng các phân đoạn đã lọc.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho các thao tác nhập lúc khởi động, hãy giữ các phụ thuộc nặng phía sau một đường nối `*.runtime.ts` cục bộ có phạm vi hẹp và mô phỏng trực tiếp đường nối đó thay vì nhập sâu các trình trợ giúp thời gian chạy chỉ để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh `test:changed` đã định tuyến với đường dẫn dự án gốc nguyên bản cho phần khác biệt đã commit đó, đồng thời in thời gian thực tế và RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` đo hiệu năng cây làm việc bẩn hiện tại bằng cách định tuyến danh sách tệp đã thay đổi qua `scripts/test-projects.mjs` và cấu hình Vitest gốc.
    - `pnpm test:perf:profile:main` ghi hồ sơ CPU luồng chính cho chi phí khởi động và chuyển đổi của Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi hồ sơ CPU+bộ nhớ heap của trình chạy cho bộ kiểm thử đơn vị khi tính song song theo tệp bị tắt.

  </Accordion>
</AccordionGroup>

### Độ ổn định (Gateway)

- Lệnh: `pnpm test:stability:gateway`
- Cấu hình: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` và `test/vitest/vitest.infra.config.ts`, mỗi cấu hình bị giới hạn ở một worker
- Phạm vi:
  - Khởi động một Gateway local loopback thực với chẩn đoán được bật theo mặc định
  - Tạo tải biến động tổng hợp về thông báo Gateway, bộ nhớ và tải trọng lớn qua đường dẫn sự kiện chẩn đoán
  - Truy vấn `diagnostics.stability` qua Gateway WS RPC
  - Bao phủ các trình trợ giúp lưu trữ bền vững gói độ ổn định chẩn đoán
  - Khẳng định rằng trình ghi vẫn được giới hạn, các mẫu RSS tổng hợp duy trì dưới ngân sách áp lực và độ sâu hàng đợi theo phiên giảm về không
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Luồng hẹp để theo dõi hồi quy về độ ổn định, không thay thế cho toàn bộ bộ kiểm thử Gateway

### E2E (tổng hợp kho mã nguồn)

- Lệnh: `pnpm test:e2e`
- Phạm vi:
  - Chạy luồng kiểm thử nhanh E2E của Gateway
  - Chạy luồng E2E trình duyệt Control UI được mô phỏng
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Yêu cầu cài đặt Playwright Chromium

### E2E (kiểm thử nhanh Gateway)

- Lệnh: `pnpm test:e2e:gateway`
- Cấu hình: `test/vitest/vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` và các kiểm thử E2E của Plugin đi kèm trong `extensions/`
- Giá trị mặc định khi chạy:
  - Sử dụng `threads` của Vitest với `isolate: false`, khớp với phần còn lại của kho mã nguồn.
  - Sử dụng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ im lặng để giảm chi phí I/O của bảng điều khiển.
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để buộc số lượng worker (tối đa 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra bảng điều khiển chi tiết.
- Phạm vi:
  - Hành vi đầu cuối của Gateway nhiều phiên bản
  - Các bề mặt WebSocket/HTTP, ghép cặp node và hoạt động mạng nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong quy trình)
  - Không yêu cầu khóa thực
  - Có nhiều thành phần chuyển động hơn kiểm thử đơn vị (có thể chậm hơn)

### E2E (trình duyệt Control UI được mô phỏng)

- Lệnh: `pnpm test:ui:e2e`
- Cấu hình: `test/vitest/vitest.ui-e2e.config.ts`
- Tệp: `ui/src/**/*.e2e.test.ts`
- Phạm vi:
  - Khởi động Vite Control UI
  - Điều khiển một trang Chromium thực thông qua Playwright
  - Thay thế WebSocket của Gateway bằng các mô phỏng xác định trong trình duyệt
- Kỳ vọng:
  - Chạy trong CI như một phần của `pnpm test:e2e`
  - Không yêu cầu Gateway, agent hoặc khóa nhà cung cấp thực
  - Phải có phụ thuộc trình duyệt (`pnpm --dir ui exec playwright install chromium`)

### E2E: Kiểm thử nhanh phần phụ trợ OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Tái sử dụng một Gateway OpenShell cục bộ đang hoạt động
  - Tạo một sandbox từ Dockerfile cục bộ tạm thời
  - Thực thi phần phụ trợ OpenShell của OpenClaw qua `sandbox ssh-config` thực + thực thi SSH
  - Xác minh hành vi hệ thống tệp chuẩn theo máy từ xa thông qua cầu nối hệ thống tệp của sandbox
- Kỳ vọng:
  - Chỉ chạy khi chủ động bật; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cùng một daemon Docker hoạt động
  - Yêu cầu một Gateway OpenShell cục bộ đang hoạt động và nguồn cấu hình của nó
  - Sử dụng `HOME` / `XDG_CONFIG_HOME` cách ly, sau đó hủy sandbox kiểm thử
- Ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ tới tệp nhị phân CLI không mặc định hoặc tập lệnh bao bọc
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` để cung cấp cấu hình Gateway đã đăng ký cho kiểm thử cách ly
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` để ghi đè địa chỉ IP Gateway Docker mà fixture chính sách máy chủ sử dụng

### Trực tiếp (nhà cung cấp thực + mô hình thực)

- Lệnh: `pnpm test:live`
- Cấu hình: `test/vitest/vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` và các kiểm thử trực tiếp của Plugin đi kèm trong `extensions/`
- Mặc định: được `pnpm test:live` **bật** (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - "Nhà cung cấp/mô hình này có thực sự hoạt động _hôm nay_ với thông tin xác thực thật không?"
  - Phát hiện các thay đổi về định dạng của nhà cung cấp, đặc thù khi gọi công cụ, vấn đề xác thực và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế, không ổn định trong CI (mạng thật, chính sách thật của nhà cung cấp, hạn ngạch, sự cố ngừng hoạt động)
  - Tốn tiền / sử dụng hạn mức tốc độ
  - Ưu tiên chạy các tập con được thu hẹp thay vì "mọi thứ"
- Các lượt chạy trực tiếp sử dụng khóa API đã được xuất và hồ sơ xác thực đã chuẩn bị sẵn.
- Theo mặc định, các lượt chạy trực tiếp vẫn cô lập `HOME` và sao chép tài liệu cấu hình/xác thực vào thư mục nhà kiểm thử tạm thời để các fixture kiểm thử đơn vị không thể sửa đổi `~/.openclaw` thật của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn chủ ý cần các kiểm thử trực tiếp sử dụng thư mục nhà thật của mình.
- `pnpm test:live` mặc định sử dụng chế độ ít đầu ra hơn: chế độ này giữ đầu ra tiến trình `[live] ...` và tắt tiếng nhật ký khởi động Gateway/thông báo Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn hiển thị lại toàn bộ nhật ký khởi động.
- Luân phiên khóa API (riêng theo nhà cung cấp): đặt `*_API_KEYS` theo định dạng phân tách bằng dấu phẩy/dấu chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`), hoặc ghi đè riêng cho lượt chạy trực tiếp qua `OPENCLAW_LIVE_*_KEY`; các kiểm thử sẽ thử lại khi nhận phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ kiểm thử trực tiếp phát các dòng tiến trình tới stderr để những lệnh gọi nhà cung cấp kéo dài vẫn hiển thị là đang hoạt động ngay cả khi chế độ thu thập đầu ra bảng điều khiển của Vitest không hiển thị gì.
  - `test/vitest/vitest.live.config.ts` tắt tính năng chặn đầu ra bảng điều khiển của Vitest để các dòng tiến trình của nhà cung cấp/Gateway được truyền ngay lập tức trong các lượt chạy trực tiếp.
  - Điều chỉnh Heartbeat của mô hình trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Điều chỉnh Heartbeat của Gateway/phép thăm dò bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Tôi nên chạy bộ kiểm thử nào?

Sử dụng bảng quyết định sau:

- Chỉnh sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn đã thay đổi nhiều)
- Chạm tới kết nối mạng Gateway / giao thức WS / ghép cặp: chạy thêm `pnpm test:e2e`
- Gỡ lỗi "bot của tôi không hoạt động" / lỗi riêng theo nhà cung cấp / gọi công cụ: chạy một tập `pnpm test:live` đã được thu hẹp

## Kiểm thử trực tiếp (có truy cập mạng)

Đối với ma trận mô hình trực tiếp, các kiểm thử khói phần phụ trợ CLI, kiểm thử khói ACP, bộ kiểm thử Codex app-server
và mọi kiểm thử trực tiếp của nhà cung cấp phương tiện (Deepgram, BytePlus, ComfyUI,
hình ảnh, âm nhạc, video, bộ kiểm thử phương tiện) — cùng với việc xử lý thông tin xác thực cho các lượt chạy trực tiếp

- xem [Kiểm thử các bộ kiểm thử trực tiếp](/vi/help/testing-live). Đối với danh sách kiểm tra chuyên biệt về cập nhật và
  xác thực Plugin, hãy xem
  [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Trình chạy Docker (kiểm tra tùy chọn "hoạt động trên Linux")

Các trình chạy Docker này được chia thành hai nhóm:

- Trình chạy mô hình trực tiếp: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp trực tiếp có khóa hồ sơ tương ứng trong hình ảnh Docker của kho mã (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), gắn thư mục cấu hình cục bộ, không gian làm việc và tệp môi trường hồ sơ tùy chọn của bạn. Các điểm vào cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Các trình chạy trực tiếp Docker duy trì giới hạn thực tế riêng khi cần:
  `test:docker:live-models` mặc định sử dụng tập tín hiệu cao được tuyển chọn và hỗ trợ, còn
  `test:docker:live-gateway` mặc định sử dụng `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Đặt `OPENCLAW_LIVE_MAX_MODELS`
  hoặc các biến môi trường Gateway khi bạn chủ ý muốn giới hạn nhỏ hơn hoặc quét rộng hơn.
- `test:docker:all` dựng hình ảnh Docker trực tiếp một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần thành tarball npm thông qua `scripts/package-openclaw-for-docker.mjs`, rồi dựng/tái sử dụng hai hình ảnh `scripts/e2e/Dockerfile`. Hình ảnh cơ bản chỉ là trình chạy Node/Git cho các luồng cài đặt/cập nhật/phụ thuộc Plugin; các luồng này gắn tarball đã dựng sẵn. Hình ảnh chức năng cài đặt cùng tarball đó vào `/app` cho các luồng kiểm tra chức năng của ứng dụng đã dựng. Định nghĩa các luồng Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Tác vụ tổng hợp sử dụng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` kiểm soát các khe tiến trình, trong khi giới hạn tài nguyên ngăn các luồng trực tiếp nặng, cài đặt npm và đa dịch vụ cùng khởi động một lúc. Nếu một luồng đơn lẻ nặng hơn các giới hạn đang áp dụng, bộ lập lịch vẫn có thể khởi động luồng đó khi nhóm trống, rồi duy trì luồng chạy riêng cho đến khi lại có đủ dung lượng. Giá trị mặc định là 10 khe, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ điều chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (và các giá trị ghi đè `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` khác) khi máy chủ Docker còn nhiều dư địa hơn. Theo mặc định, trình chạy thực hiện kiểm tra sơ bộ Docker, xóa các vùng chứa E2E OpenClaw cũ, in trạng thái mỗi 30 giây, lưu thời gian của các luồng thành công trong `.artifacts/docker-tests/lane-timings.json` và dùng các thời gian đó để khởi động các luồng dài hơn trước trong những lượt chạy sau. Sử dụng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in bản kê khai luồng có trọng số mà không dựng hoặc chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các luồng đã chọn, nhu cầu về gói/hình ảnh và thông tin xác thực.
- `Package Acceptance` là cổng kiểm tra gói gốc GitHub cho câu hỏi "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Cổng này phân giải một gói ứng viên từ `source=npm`, `source=ref`, `source=url`, `source=trusted-url` hoặc `source=artifact`, tải gói lên dưới tên `package-under-test`, rồi chạy các luồng E2E Docker có thể tái sử dụng với chính tarball đó thay vì đóng gói lại tham chiếu đã chọn. Các hồ sơ được sắp xếp theo độ bao quát: `smoke`, `package`, `product` và `full` (cùng với `custom` dành cho danh sách luồng chỉ định rõ ràng). Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng về gói/cập nhật/Plugin, ma trận duy trì qua nâng cấp đã phát hành, giá trị mặc định cho bản phát hành và cách phân loại lỗi.
- Các bước kiểm tra bản dựng và bản phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Cơ chế bảo vệ duyệt đồ thị bản dựng tĩnh bắt đầu từ `dist/entry.js` và `dist/cli/run-main.js`, đồng thời báo lỗi nếu đồ thị khởi động trước khi điều phối đó nhập tĩnh bất kỳ gói bên ngoài nào (Commander, giao diện lời nhắc, undici, ghi nhật ký và các phụ thuộc tương tự làm nặng quá trình khởi động đều được tính) trước khi điều phối lệnh; cơ chế này cũng giới hạn đoạn chạy Gateway đi kèm ở 70 KB và từ chối các lệnh nhập tĩnh những đường dẫn Gateway nguội đã biết (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) từ đoạn đó. Riêng `scripts/release-check.ts` kiểm thử khói CLI đã đóng gói bằng `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` và `models list --provider openai`.
- Khả năng tương thích cũ của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Cho đến mốc đó, bộ kiểm thử chỉ chấp nhận các thiếu sót về siêu dữ liệu của gói đã phát hành: bỏ qua các mục kiểm kê QA riêng tư, thiếu `gateway install --wrapper`, thiếu các tệp bản vá trong fixture git được tạo từ tarball, thiếu `update.channel` được duy trì, vị trí bản ghi cài đặt Plugin cũ, thiếu khả năng duy trì bản ghi cài đặt của chợ ứng dụng và di chuyển siêu dữ liệu cấu hình trong `plugins update`. Đối với các gói sau `2026.4.25`, những đường dẫn này sẽ gây lỗi nghiêm ngặt.
- Trình chạy kiểm thử khói vùng chứa: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` và `test:docker:config-reload` khởi động một hoặc nhiều vùng chứa thật và xác minh các đường dẫn tích hợp cấp cao hơn.
- Các luồng E2E Docker/Bash cài đặt tarball OpenClaw đã đóng gói thông qua `scripts/lib/openclaw-e2e-instance.sh` giới hạn `npm install` theo `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (mặc định `600s`; đặt `0` để tắt trình bao bọc nhằm gỡ lỗi).

Các trình chạy Docker mô hình trực tiếp cũng chỉ gắn liên kết các thư mục nhà xác thực CLI cần thiết
(hoặc tất cả thư mục được hỗ trợ khi lượt chạy không được thu hẹp), sau đó sao chép chúng vào thư mục nhà
của vùng chứa trước khi chạy để OAuth của CLI bên ngoài có thể làm mới token
mà không sửa đổi kho xác thực của máy chủ:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (tập lệnh: `scripts/test-live-models-docker.sh`)
- Kiểm thử khói liên kết ACP: `pnpm test:docker:live-acp-bind` (tập lệnh: `scripts/test-live-acp-bind-docker.sh`; mặc định bao phủ Claude, Codex và Gemini, với phạm vi Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử khói phần phụ trợ CLI: `pnpm test:docker:live-cli-backend` (tập lệnh: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử khói bộ kiểm thử Codex app-server: `pnpm test:docker:live-codex-harness` (tập lệnh: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + tác nhân phát triển: `pnpm test:docker:live-gateway` (tập lệnh: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử khói khả năng quan sát: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` và `pnpm qa:observability:smoke` là các luồng kiểm tra mã nguồn QA riêng tư. Chúng được chủ ý loại khỏi các luồng phát hành Docker của gói vì tarball npm không bao gồm QA Lab.
- Kiểm thử khói trực tiếp Open WebUI: `pnpm test:docker:openwebui` (tập lệnh: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn thiết lập ban đầu (TTY, tạo khung đầy đủ): `pnpm test:docker:onboard` (tập lệnh: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử khói thiết lập ban đầu/kênh/tác nhân bằng tarball npm: `pnpm test:docker:npm-onboard-channel-agent` cài đặt toàn cục tarball OpenClaw đã đóng gói trong Docker, cấu hình OpenAI qua quy trình thiết lập ban đầu bằng tham chiếu biến môi trường cùng với Telegram theo mặc định, chạy doctor và thực hiện một lượt tác nhân OpenAI mô phỏng. Tái sử dụng tarball đã dựng sẵn bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua việc dựng lại trên máy chủ bằng `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc chuyển kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` hay `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Kiểm thử khói hành trình người dùng bản phát hành: `pnpm test:docker:release-user-journey` cài đặt toàn cục tarball OpenClaw đã đóng gói trong một thư mục home Docker sạch, chạy quy trình thiết lập ban đầu, cấu hình một nhà cung cấp OpenAI mô phỏng, chạy một lượt agent, cài đặt/gỡ cài đặt các plugin bên ngoài, cấu hình ClickClack dựa trên một fixture cục bộ, xác minh việc gửi/nhận tin nhắn, khởi động lại Gateway và chạy doctor.
- Kiểm thử khói thiết lập ban đầu có kiểu cho bản phát hành: `pnpm test:docker:release-typed-onboarding` cài đặt tarball đã đóng gói, điều khiển `openclaw onboard` qua một TTY thực, cấu hình OpenAI làm nhà cung cấp tham chiếu biến môi trường, xác minh khóa thô không được lưu bền vững và chạy một lượt agent mô phỏng.
- Kiểm thử khói phương tiện/bộ nhớ cho bản phát hành: `pnpm test:docker:release-media-memory` cài đặt tarball đã đóng gói, xác minh khả năng hiểu hình ảnh từ tệp đính kèm PNG, đầu ra tạo hình ảnh tương thích với OpenAI, khả năng truy hồi của tìm kiếm bộ nhớ và khả năng duy trì truy hồi sau khi Gateway khởi động lại.
- Kiểm thử khói hành trình người dùng nâng cấp bản phát hành: `pnpm test:docker:release-upgrade-user-journey` mặc định cài đặt bản cơ sở mới nhất đã phát hành nhưng cũ hơn tarball ứng viên, cấu hình trạng thái nhà cung cấp/plugin/ClickClack trên gói đã phát hành, nâng cấp lên tarball ứng viên, rồi chạy lại hành trình agent/plugin/kênh cốt lõi. Nếu không có bản cơ sở đã phát hành nào cũ hơn, kiểm thử sẽ sử dụng lại phiên bản ứng viên. Ghi đè bản cơ sở bằng `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Kiểm thử khói chợ Plugin bản phát hành: `pnpm test:docker:release-plugin-marketplace` cài đặt từ một chợ fixture cục bộ, cập nhật plugin đã cài đặt, gỡ cài đặt plugin đó và xác minh CLI của plugin biến mất sau khi siêu dữ liệu cài đặt được lược bỏ.
- Kiểm thử khói cài đặt Skill: `pnpm test:docker:skill-install` cài đặt toàn cục tarball OpenClaw đã đóng gói trong Docker, vô hiệu hóa việc cài đặt kho lưu trữ được tải lên trong cấu hình, phân giải slug Skill ClawHub trực tiếp hiện tại từ kết quả tìm kiếm, cài đặt bằng `openclaw skills install`, rồi xác minh Skill đã cài đặt cùng siêu dữ liệu nguồn/khóa `.clawhub`.
- Kiểm thử khói chuyển kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt toàn cục tarball OpenClaw đã đóng gói trong Docker, chuyển từ gói `stable` sang git `dev`, xác minh kênh được lưu bền vững và hoạt động sau cập nhật của plugin, rồi chuyển lại sang gói `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử khói khả năng sống sót qua nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt tarball OpenClaw đã đóng gói lên một fixture người dùng cũ không sạch có các agent, cấu hình kênh, danh sách cho phép plugin, trạng thái phần phụ thuộc plugin lỗi thời và các tệp workspace/phiên hiện có. Kiểm thử chạy cập nhật gói cùng doctor không tương tác mà không dùng khóa nhà cung cấp hoặc kênh trực tiếp, sau đó khởi động một Gateway local loopback và kiểm tra việc bảo toàn cấu hình/trạng thái cùng các giới hạn thời gian khởi động/trạng thái.
- Kiểm thử khói khả năng sống sót qua nâng cấp từ bản đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, tạo sẵn các tệp người dùng hiện có thực tế, cấu hình bản cơ sở đó bằng một công thức lệnh tích hợp sẵn, xác thực cấu hình kết quả, cập nhật bản cài đặt đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, rồi khởi động một Gateway local loopback và kiểm tra các ý định đã cấu hình, việc bảo toàn trạng thái, khởi động, `/healthz`, `/readyz` và các giới hạn thời gian trạng thái RPC. Ghi đè một bản cơ sở bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các bản cơ sở cục bộ chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, chẳng hạn như `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, và mở rộng các fixture theo dạng sự cố bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, chẳng hạn như `reported-issues`; tập sự cố được báo cáo bao gồm `configured-plugin-installs` để tự động sửa chữa việc cài đặt Plugin OpenClaw bên ngoài. Package Acceptance cung cấp các mục này dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` và `published_upgrade_survivor_scenarios`, phân giải các token bản cơ sở meta như `last-stable-4` hoặc `all-since-2026.4.23`, còn Full Release Validation mở rộng cổng gói ngâm thử bản phát hành thành `last-stable-4 2026.4.23 2026.5.2 2026.4.15` cộng với `reported-issues`.
- Kiểm thử khói ngữ cảnh thời gian chạy của phiên: `pnpm test:docker:session-runtime-context` xác minh việc lưu bền vững bản chép lời ngữ cảnh thời gian chạy ẩn, cùng khả năng sửa chữa bằng doctor đối với các nhánh viết lại prompt bị trùng lặp có liên quan.
- Kiểm thử khói cài đặt toàn cục Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một thư mục home cô lập và xác minh `openclaw infer image providers --json` trả về các nhà cung cấp hình ảnh đi kèm thay vì bị treo. Sử dụng lại tarball dựng sẵn bằng `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bước dựng trên máy chủ bằng `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một ảnh Docker đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử khói trình cài đặt Docker: `bash scripts/test-install-sh-docker.sh` dùng chung một bộ nhớ đệm npm cho các container root, cập nhật và npm trực tiếp. Kiểm thử khói cập nhật mặc định dùng npm `latest` làm bản cơ sở ổn định trước khi nâng cấp lên tarball ứng viên. Ghi đè cục bộ bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, hoặc bằng đầu vào `update_baseline_version` của quy trình Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root duy trì một bộ nhớ đệm npm cô lập để các mục bộ nhớ đệm do root sở hữu không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để sử dụng lại bộ nhớ đệm root/cập nhật/npm-trực-tiếp trong các lần chạy lại cục bộ.
- CI Install Smoke bỏ qua lần cập nhật toàn cục bằng npm trực tiếp bị trùng lặp với `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy tập lệnh cục bộ mà không có biến môi trường đó khi cần phạm vi kiểm thử cho `npm install -g` trực tiếp.
- Kiểm thử khói CLI xóa workspace dùng chung của agent: `pnpm test:docker:agents-delete-shared-workspace` (tập lệnh: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng ảnh Dockerfile gốc, tạo sẵn hai agent với một workspace trong thư mục home container cô lập, chạy `agents delete --json`, rồi xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Sử dụng lại ảnh kiểm thử cài đặt bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway và vòng đời máy chủ: `pnpm test:docker:gateway-network` (tập lệnh: `scripts/e2e/gateway-network-docker.sh`) duy trì kiểm thử khói xác thực/tình trạng WebSocket LAN hai container, sau đó dùng Admin HTTP qua local loopback để chứng minh cơ chế rào chắn chuẩn bị, quyền truy cập điều khiển được giữ lại, khả năng phục hồi khi tiếp tục và thao tác dừng/khởi động đã chuẩn bị trong cùng container. Kiểm tra khởi động lại phải hoàn tất trước khi thời hạn thuê ban đầu hết hạn, xác minh trạng thái tạm ngưng chỉ tồn tại cục bộ trong tiến trình trong khi cấu hình Gateway được lưu bền vững và danh tính container vẫn tồn tại, đồng thời xuất JSON thời gian từng giai đoạn có thể đọc bằng máy.
- Kiểm thử khói ảnh chụp nhanh CDP của trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (tập lệnh: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng ảnh E2E nguồn cùng một lớp Chromium, khởi động Chromium bằng CDP thô, chạy `browser doctor --deep` và xác minh ảnh chụp nhanh vai trò CDP bao phủ URL liên kết, các phần tử có thể nhấp được nâng cấp từ con trỏ, tham chiếu iframe và siêu dữ liệu khung.
- Hồi quy suy luận tối thiểu `web_search` của OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (tập lệnh: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI mô phỏng qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, sau đó buộc schema nhà cung cấp từ chối và kiểm tra chi tiết thô xuất hiện trong nhật ký Gateway.
- Cầu nối kênh MCP (Gateway được tạo sẵn + cầu nối stdio + kiểm thử khói khung thông báo Claude thô): `pnpm test:docker:mcp-channels` (tập lệnh: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP trong gói OpenClaw (máy chủ MCP stdio thực + kiểm thử khói cho phép/từ chối của hồ sơ OpenClaw nhúng): `pnpm test:docker:agent-bundle-mcp-tools` (tập lệnh: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP Cron/agent con (Gateway thực + hủy tiến trình con MCP stdio sau các lần chạy cron cô lập và agent con một lần): `pnpm test:docker:cron-mcp-cleanup` (tập lệnh: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Các Plugin (kiểm thử khói cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm có các phần phụ thuộc được nâng cấp lên cấp trên, siêu dữ liệu gói npm sai định dạng, các tham chiếu git di chuyển, gói tổng hợp ClawHub, cập nhật chợ và bật/kiểm tra gói Claude): `pnpm test:docker:plugins` (tập lệnh: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp gói/thời gian chạy tổng hợp mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Khi không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, kiểm thử sử dụng một máy chủ fixture ClawHub cục bộ khép kín.
- Kiểm thử khói cập nhật Plugin không thay đổi: `pnpm test:docker:plugin-update` (tập lệnh: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử khói ma trận vòng đời Plugin: `pnpm test:docker:plugin-lifecycle-matrix` cài đặt tarball OpenClaw đã đóng gói trong một container tối giản, cài đặt một plugin npm, chuyển đổi trạng thái bật/tắt, nâng cấp và hạ cấp plugin qua một registry npm cục bộ, xóa mã đã cài đặt, rồi xác minh việc gỡ cài đặt vẫn loại bỏ trạng thái lỗi thời trong khi ghi nhật ký các chỉ số RSS/CPU cho từng giai đoạn vòng đời.
- Kiểm thử khói siêu dữ liệu tải lại cấu hình: `pnpm test:docker:config-reload` (tập lệnh: `scripts/e2e/config-reload-source-docker.sh`)
- Các Plugin: `pnpm test:docker:plugins` bao phủ kiểm thử khói cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm có các phần phụ thuộc được nâng cấp lên cấp trên, các tham chiếu git di chuyển, fixture ClawHub, cập nhật chợ và bật/kiểm tra gói Claude. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không thay đổi cho các plugin đã cài đặt. `pnpm test:docker:plugin-lifecycle-matrix` bao phủ việc cài đặt, bật, tắt, nâng cấp, hạ cấp và gỡ cài đặt khi thiếu mã của plugin npm, với tài nguyên được theo dõi.

Để dựng trước và sử dụng lại ảnh chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các giá trị ghi đè ảnh dành riêng cho từng bộ kiểm thử, chẳng hạn như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, vẫn được ưu tiên khi đã đặt. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ đến một ảnh dùng chung từ xa, các tập lệnh sẽ kéo ảnh đó về nếu chưa có cục bộ. Các kiểm thử Docker cho QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi gói/cài đặt thay vì thời gian chạy ứng dụng đã dựng dùng chung.

Các trình chạy Docker mô hình trực tiếp cũng gắn kết bản checkout hiện tại ở chế độ chỉ đọc
và đưa nó vào một thư mục làm việc tạm thời bên trong container. Cách này giữ cho
ảnh thời gian chạy gọn nhẹ trong khi vẫn chạy Vitest dựa trên chính xác
nguồn/cấu hình cục bộ của bạn. Bước chuẩn bị bỏ qua các bộ nhớ đệm lớn chỉ có cục bộ và
đầu ra dựng ứng dụng như `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` và
các thư mục đầu ra `.build` hoặc Gradle cục bộ của ứng dụng để các lần chạy Docker trực tiếp không
mất nhiều phút sao chép các tạo phẩm dành riêng cho máy. Chúng cũng đặt
`OPENCLAW_SKIP_CHANNELS=1` để các phép thăm dò Gateway trực tiếp không khởi động các trình thực thi kênh
Telegram/Discord/v.v. thực bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền tiếp
`OPENCLAW_LIVE_GATEWAY_*` khi bạn cần thu hẹp hoặc loại trừ phạm vi kiểm thử Gateway
trực tiếp khỏi làn Docker đó.

`test:docker:openwebui` là bài kiểm tra nhanh về khả năng tương thích ở cấp cao hơn: nó khởi động một container Gateway OpenClaw với các điểm cuối HTTP tương thích OpenAI được bật, khởi động một container Open WebUI có phiên bản được ghim để kết nối với Gateway đó, đăng nhập qua Open WebUI, xác minh `/api/models` công bố `openclaw/default`, rồi gửi một yêu cầu trò chuyện thực qua proxy `/api/chat/completions` của Open WebUI. Đặt `OPENWEBUI_SMOKE_MODE=models` cho các bước kiểm tra CI trên luồng phát hành cần dừng sau khi đăng nhập Open WebUI và khám phá mô hình, mà không chờ một lượt hoàn thành từ mô hình trực tiếp. Lần chạy đầu tiên có thể chậm hơn đáng kể vì Docker có thể cần kéo image Open WebUI và Open WebUI có thể cần hoàn tất quá trình thiết lập khởi động nguội của riêng nó. Luồng này yêu cầu một khóa mô hình trực tiếp có thể sử dụng, được cung cấp qua môi trường tiến trình, các hồ sơ xác thực đã chuẩn bị sẵn hoặc một `OPENCLAW_PROFILE_FILE` được chỉ định rõ ràng. Các lần chạy thành công sẽ in một payload JSON nhỏ như `{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` được thiết kế có chủ ý để mang tính xác định và không cần tài khoản Telegram, Discord hoặc iMessage thực. Nó khởi động một container Gateway đã được nạp dữ liệu mẫu, khởi động container thứ hai tạo tiến trình `openclaw mcp serve`, rồi xác minh việc khám phá cuộc hội thoại đã định tuyến, đọc bản ghi, siêu dữ liệu tệp đính kèm, hành vi hàng đợi sự kiện trực tiếp, định tuyến gửi ra ngoài và các thông báo kiểu Claude về kênh + quyền qua cầu nối MCP stdio thực. Bước kiểm tra thông báo xem xét trực tiếp các khung MCP stdio thô để bài kiểm tra nhanh xác thực những gì cầu nối thực sự phát ra, chứ không chỉ những gì một SDK máy khách cụ thể tình cờ hiển thị.

`test:docker:agent-bundle-mcp-tools` có tính xác định và không cần khóa mô hình trực tiếp. Nó xây dựng image Docker của kho mã, khởi động một máy chủ thăm dò MCP stdio thực bên trong container, hiện thực hóa máy chủ đó thông qua môi trường chạy MCP bundle OpenClaw được nhúng, thực thi công cụ, rồi xác minh `coding` và `messaging` giữ lại các công cụ `bundle-mcp`, trong khi `minimal` và `tools.deny: ["bundle-mcp"]` lọc chúng.

`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa mô hình trực tiếp. Nó khởi động một Gateway đã được nạp dữ liệu mẫu cùng máy chủ thăm dò MCP stdio thực, chạy một lượt cron cô lập và một lượt tiến trình con chạy một lần bằng `sessions_spawn`, rồi xác minh tiến trình con MCP thoát sau mỗi lần chạy.

Kiểm tra nhanh luồng ACP bằng ngôn ngữ tự nhiên theo cách thủ công (không thuộc CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ lại tập lệnh này cho các quy trình hồi quy/gỡ lỗi. Tập lệnh có thể lại cần thiết để xác thực định tuyến luồng ACP, vì vậy không được xóa.

Các biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được gắn vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được gắn vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` được gắn và nạp trước khi chạy kiểm thử
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được nạp từ `OPENCLAW_PROFILE_FILE`, sử dụng các thư mục cấu hình/không gian làm việc tạm thời và không gắn xác thực CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`, trừ khi lần chạy đã sử dụng một thư mục bind do CI/quy trình quản lý) được gắn vào `/home/node/.npm-global` để lưu bộ nhớ đệm cho các bản cài đặt CLI bên trong Docker
- Các thư mục/tệp xác thực CLI bên ngoài dưới `$HOME` được gắn ở chế độ chỉ đọc dưới `/host-auth...`, sau đó được sao chép vào `/home/node/...` trước khi bắt đầu kiểm thử
  - Các thư mục mặc định (được dùng khi lần chạy không giới hạn ở các nhà cung cấp cụ thể): `.factory`, `.gemini`, `.minimax`
  - Các tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy giới hạn theo nhà cung cấp chỉ gắn những thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` hoặc danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp phạm vi lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc các nhà cung cấp bên trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để tái sử dụng image `openclaw:local-live` hiện có cho các lần chạy lại không cần xây dựng lại
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để bảo đảm thông tin xác thực đến từ kho hồ sơ (không phải biến môi trường)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình được Gateway công bố cho bài kiểm tra nhanh Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè prompt kiểm tra nonce được bài kiểm tra nhanh Open WebUI sử dụng
- `OPENWEBUI_IMAGE=...` để ghi đè thẻ image Open WebUI đã ghim

## Kiểm tra tính hợp lệ của tài liệu

Chạy các bước kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm check:docs`.
Chạy quy trình xác thực anchor Mintlify đầy đủ khi bạn cũng cần kiểm tra các tiêu đề trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy ngoại tuyến (an toàn cho CI)

Đây là các hồi quy của “pipeline thực” nhưng không dùng nhà cung cấp thực:

- Gọi công cụ qua Gateway (OpenAI mô phỏng, Gateway thực + vòng lặp tác nhân): `src/gateway/gateway.test.ts` (trường hợp: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Trình hướng dẫn Gateway (WS `wizard.start`/`wizard.next`, ghi cấu hình + bắt buộc xác thực): `src/gateway/gateway.test.ts` (trường hợp: "runs wizard over ws and writes auth token config")

## Các bài đánh giá độ tin cậy của tác nhân (Skills)

Chúng ta đã có một số bài kiểm thử an toàn cho CI hoạt động như “các bài đánh giá độ tin cậy của tác nhân”:

- Gọi công cụ mô phỏng thông qua Gateway thực + vòng lặp tác nhân (`src/gateway/gateway.test.ts`).
- Các luồng trình hướng dẫn đầu-cuối xác thực việc kết nối phiên và tác động của cấu hình (`src/gateway/gateway.test.ts`).

Những phần vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi Skills được liệt kê trong prompt, tác nhân có chọn đúng skill (hoặc tránh các skill không liên quan) không?
- **Tuân thủ:** tác nhân có đọc `SKILL.md` trước khi sử dụng và làm theo các bước/đối số bắt buộc không?
- **Hợp đồng quy trình:** các kịch bản nhiều lượt xác nhận thứ tự công cụ, việc duy trì lịch sử phiên và ranh giới sandbox.

Các bài đánh giá trong tương lai trước hết nên duy trì tính xác định:

- Một trình chạy kịch bản sử dụng các nhà cung cấp mô phỏng để xác nhận các lệnh gọi công cụ + thứ tự, việc đọc tệp skill và kết nối phiên.
- Một bộ nhỏ các kịch bản tập trung vào skill (sử dụng so với tránh, kiểm soát điều kiện, chèn prompt).
- Các bài đánh giá trực tiếp tùy chọn (chỉ chạy khi chủ động bật, được kiểm soát bằng biến môi trường) chỉ sau khi bộ kiểm thử an toàn cho CI đã sẵn sàng.

## Kiểm thử hợp đồng (cấu trúc Plugin và kênh)

Kiểm thử hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ hợp đồng giao diện tương ứng. Chúng duyệt qua tất cả Plugin được phát hiện và chạy một bộ xác nhận về cấu trúc và hành vi. Luồng kiểm thử đơn vị `pnpm test` mặc định chủ ý bỏ qua các tệp đường nối dùng chung và kiểm tra nhanh này; hãy chạy rõ ràng các lệnh hợp đồng khi bạn chỉnh sửa các bề mặt kênh hoặc nhà cung cấp dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng nhà cung cấp: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`. Các nhóm cấp cao nhất hiện tại:

- **channel-catalog** - siêu dữ liệu mục danh mục kênh được đóng gói/sổ đăng ký
- **plugin** (dựa trên sổ đăng ký, được phân mảnh) - cấu trúc đăng ký Plugin cơ bản
- **surfaces-only** (dựa trên sổ đăng ký, được phân mảnh) - kiểm tra cấu trúc theo từng bề mặt cho `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` và `gateway`
- **session-binding** (dựa trên sổ đăng ký) - hành vi liên kết phiên
- **outbound-payload** - cấu trúc và chuẩn hóa payload tin nhắn
- **group-policy** (dự phòng) - thực thi chính sách nhóm mặc định theo từng kênh
- **threading** (dựa trên sổ đăng ký, được phân mảnh) - xử lý mã định danh luồng
- **directory** (dựa trên sổ đăng ký, được phân mảnh) - API thư mục/danh sách thành viên
- **registry** và **plugins-core.\*** - sổ đăng ký Plugin kênh, trình nạp và phần nội bộ của cơ chế cấp quyền ghi cấu hình

Các trình trợ giúp bộ kiểm thử ghi nhận điều phối đầu vào và payload đầu ra được những bộ này sử dụng được cung cấp nội bộ qua `src/plugin-sdk/channel-contract-testing.ts` (bị loại khỏi npm, không phải đường dẫn con SDK công khai); không có tệp `inbound.contract.test.ts` độc lập trong thư mục này.

### Hợp đồng nhà cung cấp

Nằm trong `src/plugins/contracts/*.contract.test.ts`. Các nhóm hiện tại bao gồm:

- **shape** - cấu trúc manifest, API và phần xuất môi trường chạy của Plugin
- **plugin-registration** (+ song song) - các trường hợp đăng ký manifest
- **package-manifest** - yêu cầu đối với manifest gói
- **loader** - hành vi thiết lập/dọn dẹp trình nạp Plugin
- **registry** - nội dung và tra cứu trong sổ đăng ký hợp đồng Plugin
- **providers** - hành vi nhà cung cấp dùng chung giữa các nhà cung cấp được đóng gói, cùng các nhà cung cấp tìm kiếm web
- **auth-choice** - siêu dữ liệu lựa chọn xác thực và hành vi thiết lập
- **provider-catalog-deprecation** - siêu dữ liệu danh mục nhà cung cấp đã ngừng dùng
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - các hợp đồng trình hướng dẫn thiết lập nhà cung cấp
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - các hợp đồng nhà cung cấp theo từng khả năng
- **session-actions**, **session-attachments**, **session-entry-projection** - các hợp đồng trạng thái phiên do Plugin sở hữu
- **scheduled-turns** - siêu dữ liệu lượt chạy theo lịch và giới hạn dấu thời gian của Plugin
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - vòng đời máy chủ/môi trường chạy và các hợp đồng ranh giới nhập của Plugin
- **extension-runtime-dependencies** - vị trí đặt phần phụ thuộc môi trường chạy cho các phần mở rộng

### Khi nào cần chạy

- Sau khi thay đổi các phần xuất hoặc đường dẫn con của plugin-sdk
- Sau khi thêm hoặc sửa đổi Plugin kênh hay nhà cung cấp
- Sau khi tái cấu trúc việc đăng ký hoặc khám phá Plugin

Kiểm thử hợp đồng chạy trong CI và không yêu cầu khóa API thực.

## Thêm hồi quy (hướng dẫn)

Khi bạn sửa một vấn đề về nhà cung cấp/mô hình được phát hiện trong môi trường trực tiếp:

- Thêm một hồi quy an toàn cho CI nếu có thể (nhà cung cấp mô phỏng/giả lập hoặc ghi nhận chính xác phép chuyển đổi cấu trúc yêu cầu)
- Nếu vấn đề vốn chỉ có thể kiểm thử trực tiếp (giới hạn tốc độ, chính sách xác thực), hãy giữ kiểm thử trực tiếp ở phạm vi hẹp và chỉ chủ động bật qua biến môi trường
- Ưu tiên nhắm đến lớp nhỏ nhất có thể phát hiện lỗi:
  - lỗi chuyển đổi/phát lại yêu cầu của nhà cung cấp -> kiểm thử trực tiếp mô hình
  - lỗi pipeline phiên/lịch sử/công cụ của Gateway -> kiểm tra nhanh Gateway trực tiếp hoặc kiểm thử mô phỏng Gateway an toàn cho CI
- Rào chắn duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` lấy một đích mẫu cho mỗi lớp SecretRef từ siêu dữ liệu sổ đăng ký (`listSecretTargetRegistryEntries()`), sau đó xác nhận các mã định danh thực thi có phân đoạn duyệt bị từ chối.
  - Nếu bạn thêm một họ đích SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong kiểm thử đó. Kiểm thử chủ ý thất bại với các mã định danh đích chưa được phân loại để các lớp mới không thể bị âm thầm bỏ qua.

## Liên quan

- [Kiểm thử trực tiếp](/vi/help/testing-live)
- [Kiểm thử bản cập nhật và Plugin](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
