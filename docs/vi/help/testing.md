---
read_when:
    - Chạy kiểm thử cục bộ hoặc trong CI
    - Bổ sung các kiểm thử hồi quy cho lỗi của mô hình/nhà cung cấp
    - Gỡ lỗi hành vi của Gateway + agent
summary: 'Bộ công cụ kiểm thử: các bộ kiểm thử đơn vị/e2e/trực tiếp, trình chạy Docker và phạm vi của từng kiểm thử'
title: Kiểm thử
x-i18n:
    generated_at: "2026-07-19T05:47:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20e0aa22bf16561334f83342abffabb387ed0b41b901773939123ecfbc0ae330
    source_path: help/testing.md
    workflow: 16
---

OpenClaw có ba bộ kiểm thử Vitest (đơn vị/tích hợp, e2e, trực tiếp) cùng các
trình chạy Docker. Trang này trình bày phạm vi của từng bộ, lệnh cần chạy cho
mỗi quy trình làm việc, cách các kiểm thử trực tiếp phát hiện thông tin xác thực và cách thêm
kiểm thử hồi quy cho các lỗi nhà cung cấp/mô hình trong thực tế.

<Note>
**Ngăn xếp QA (qa-lab, qa-channel, các lane vận chuyển trực tiếp)** được trình bày riêng:

- [Tổng quan về QA](/vi/concepts/qa-e2e-automation) - kiến trúc, bề mặt lệnh, cách biên soạn kịch bản và hồ sơ Matrix.
- [Bảng điểm mức độ trưởng thành](/vi/maturity/scorecard) - cách bằng chứng QA của bản phát hành hỗ trợ các quyết định về độ ổn định và LTS.
- [Kênh QA](/vi/channels/qa-channel) - plugin vận chuyển mô phỏng được các kịch bản dựa trên kho mã sử dụng.

Trang này trình bày các bộ kiểm thử thông thường và trình chạy Docker/Parallels. Phần [Trình chạy dành riêng cho QA](#qa-specific-runners) bên dưới liệt kê các lệnh gọi `qa` cụ thể và dẫn lại đến các tài liệu tham khảo ở trên.
</Note>

## Bắt đầu nhanh

Trong hầu hết các ngày:

- Cổng kiểm tra đầy đủ (cần chạy trước khi đẩy mã): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Chạy toàn bộ bộ kiểm thử cục bộ nhanh hơn trên máy có nhiều tài nguyên: `pnpm test:max`
- Vòng lặp theo dõi trực tiếp của Vitest: `pnpm test:watch`
- Nhắm trực tiếp đến tệp cũng định tuyến các đường dẫn plugin/kênh: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Khi lặp lại để xử lý một lỗi đơn lẻ, ưu tiên chạy có mục tiêu trước.
- Trang QA dựa trên Docker: `pnpm qa:lab:up`
- Lane QA dựa trên máy ảo Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Khi bạn sửa đổi kiểm thử hoặc muốn tăng thêm độ tin cậy:

- Báo cáo độ bao phủ V8 mang tính tham khảo: `pnpm test:coverage`
- Bộ kiểm thử E2E: `pnpm test:e2e`

## Thư mục tạm cho kiểm thử

Sử dụng các trình trợ giúp dùng chung trong `test/helpers/temp-dir.ts` cho các thư mục tạm
do kiểm thử sở hữu để quyền sở hữu được thể hiện rõ ràng và việc dọn dẹp luôn nằm trong vòng đời kiểm thử:

```ts
import { afterEach } from "vitest";
import { useAutoCleanupTempDirTracker } from "../helpers/temp-dir.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);

it("sử dụng một không gian làm việc tạm", () => {
  const workspace = tempDirs.make("openclaw-example-");
  // sử dụng workspace
});
```

`useAutoCleanupTempDirTracker(afterEach)` cố ý không cung cấp phương thức
dọn dẹp thủ công nào - Vitest sở hữu việc dọn dẹp sau mỗi kiểm thử. Các trình trợ giúp cấp thấp cũ hơn
(`makeTempDir`, `cleanupTempDirs`, `createTempDirTracker`) vẫn tồn tại
cho những kiểm thử chưa được di chuyển; tránh sử dụng mới các trình này và tránh thêm lệnh gọi
`fs.mkdtemp*` thuần túy, trừ khi kiểm thử đang xác minh rõ ràng hành vi
thư mục tạm thô. Khi thực sự cần một thư mục tạm thuần túy, hãy thêm chú thích cho phép
có thể kiểm tra được kèm lý do:

```ts
// openclaw-temp-dir: cho phép xác minh hành vi dọn dẹp fs thô
const workspace = fs.mkdtempSync(prefix);
```

`node scripts/report-test-temp-creations.mjs` báo cáo việc tạo thư mục tạm thuần túy mới
và việc sử dụng thủ công trình trợ giúp dùng chung mới trong các dòng diff được thêm, mà không
chặn các kiểu dọn dẹp hiện có. Công cụ này tuân theo cùng cách phân loại đường dẫn kiểm thử
như `scripts/changed-lanes.mjs` và bỏ qua chính phần triển khai trình trợ giúp dùng chung.
`check:changed` chạy báo cáo này cho các đường dẫn kiểm thử đã thay đổi dưới dạng
tín hiệu CI chỉ cảnh báo (chú thích cảnh báo của GitHub, không phải lỗi).

## Quy trình trực tiếp và Docker/Parallels

Khi gỡ lỗi các nhà cung cấp/mô hình thực (yêu cầu thông tin xác thực thực):

- Bộ kiểm thử trực tiếp (mô hình + phép dò công cụ/hình ảnh Gateway): `pnpm test:live`
- Nhắm âm thầm đến một tệp trực tiếp: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Báo cáo hiệu năng thời gian chạy: điều phối `OpenClaw Performance` với
  `live_openai_candidate=true` cho một lượt tác tử `openai/gpt-5.6-luna` thực hoặc
  `deep_profile=true` cho các tạo tác CPU/heap/trace của Kova. Các lượt chạy theo lịch hằng ngày
  xuất bản báo cáo lane nhà cung cấp mô phỏng, hồ sơ chuyên sâu và GPT-5.6 Luna lên
  `openclaw/clawgrit-reports` từ một tác vụ xuất bản riêng tiêu thụ tạo tác;
  việc xác thực trình xuất bản bị thiếu hoặc không hợp lệ sẽ khiến các lượt chạy theo lịch và
  `profile=release` thất bại. Các lượt điều phối thủ công không phải bản phát hành vẫn giữ các tạo tác GitHub
  và coi việc xuất bản báo cáo là thông tin tư vấn. Báo cáo nhà cung cấp mô phỏng cũng
  bao gồm số liệu khởi động Gateway ở cấp mã nguồn, bộ nhớ, áp lực plugin, vòng lặp chào
  lặp lại của mô hình giả và khởi động CLI.
- Quét mô hình trực tiếp bằng Docker: `pnpm test:docker:live-models`
  - Mỗi mô hình được chọn chạy một lượt văn bản cùng một phép dò nhỏ kiểu đọc tệp.
    Các mô hình có siêu dữ liệu công bố đầu vào `image` cũng chạy một lượt hình ảnh nhỏ.
    Tắt các phép dò bổ sung bằng `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` hoặc
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` khi cô lập lỗi nhà cung cấp.
  - Độ bao phủ CI: cả `OpenClaw Scheduled Live And E2E Checks` hằng ngày và
    `OpenClaw Release Checks` thủ công đều gọi quy trình trực tiếp/E2E có thể tái sử dụng với
    `include_live_suites: true`, bao gồm các tác vụ ma trận mô hình trực tiếp Docker
    được phân mảnh theo nhà cung cấp.
  - Để chạy lại CI có mục tiêu, hãy điều phối `OpenClaw Live And E2E Checks (Reusable)`
    với `include_live_suites: true` và `live_models_only: true`.
  - Thêm các bí mật nhà cung cấp có tín hiệu cao mới vào `scripts/ci-hydrate-live-auth.sh`,
    cùng `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` và các trình gọi
    theo lịch/bản phát hành của nó.
- Kiểm tra khói trò chuyện liên kết Codex gốc: `pnpm test:docker:live-codex-bind`
  - Chạy một lane trực tiếp Docker qua đường dẫn app-server của Codex, liên kết một
    DM Slack mô phỏng bằng `/codex bind`, thực thi `/codex fast` và
    `/codex permissions`, sau đó xác minh một phản hồi văn bản thuần túy và một tệp đính kèm hình ảnh
    được định tuyến qua liên kết plugin gốc thay vì ACP.
- Kiểm tra khói bộ khung app-server Codex: `pnpm test:docker:live-codex-harness`
  - Chạy các lượt tác tử Gateway qua bộ khung app-server Codex
    do plugin sở hữu, xác minh `/codex status` và `/codex models`, đồng thời theo mặc định
    thực thi các phép dò hình ảnh, MCP cron, tác tử con và Guardian. Tắt
    phép dò tác tử con bằng `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` khi
    cô lập các lỗi khác. Để kiểm tra tác tử con có mục tiêu, hãy tắt
    các phép dò khác:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Tác vụ này thoát sau phép dò tác tử con, trừ khi
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` được đặt.
- Kiểm tra khói cài đặt Codex theo yêu cầu: `pnpm test:docker:codex-on-demand`
  - Cài đặt tarball OpenClaw đã đóng gói trong Docker, chạy quy trình thiết lập ban đầu
    bằng khóa API OpenAI và xác minh plugin Codex cùng phần phụ thuộc `@openai/codex`
    đã được tải xuống thư mục gốc dự án npm được quản lý theo yêu cầu.
- Kiểm tra khói gói trực tiếp npm-plugin Codex: `pnpm test:docker:live-codex-npm-plugin`
  - Cài đặt gói OpenClaw ứng viên và plugin Codex chính xác vào Docker,
    sau đó sử dụng khóa OpenAI thực để kiểm tra sơ bộ CLI và chạy các lượt trong cùng phiên.
  - Lượt tiếp nối với mức suy luận trung bình và không thử lại phải gửi tiến độ, tiếp tục
    xử lý các lượt đọc ngẫu nhiên trong không gian làm việc và ghi chính xác một tạo tác,
    sau đó gửi thông báo hoàn tất. Một lượt kết thúc chỉ có tiến độ sẽ khiến lane thất bại.
- Kiểm tra khói trực tiếp phần phụ thuộc công cụ plugin: `pnpm test:docker:live-plugin-tool`
  - Đóng gói một plugin thử nghiệm có phần phụ thuộc `slugify` thực, cài đặt nó
    qua `npm-pack:`, xác minh phần phụ thuộc trong thư mục gốc dự án npm
    được quản lý, sau đó yêu cầu một mô hình OpenAI trực tiếp gọi công cụ plugin và
    trả về slug ẩn.
- Kiểm tra khói lệnh cứu hộ OpenClaw: `pnpm test:live:system-agent-rescue-channel`
  - Kiểm tra phòng vệ nhiều lớp có thể chọn tham gia cho bề mặt lệnh cứu hộ
    của kênh nhắn tin. Thực thi `/openclaw status`, đưa một thay đổi mô hình
    bền vững vào hàng đợi, phản hồi `/openclaw yes` và xác minh đường dẫn ghi
    kiểm toán/cấu hình.
- Kiểm tra khói Docker cho lần chạy đầu tiên của OpenClaw: `pnpm test:docker:system-agent-first-run`
  - Bắt đầu từ một thư mục trạng thái OpenClaw trống và trước tiên chứng minh CLI
    `openclaw setup` đã đóng gói đóng an toàn khi không có suy luận. Sau đó,
    tác vụ kiểm thử và kích hoạt Claude giả qua mô-đun kích hoạt đã đóng gói.
    Chỉ sau đó, một yêu cầu CLI đã đóng gói có đối sánh gần đúng mới đến được trình lập kế hoạch và
    phân giải thành quy trình thiết lập có kiểu, tiếp theo là các thao tác một lần cho mô hình, tác tử, cấu hình Discord
    và SecretRef. Tác vụ xác thực cấu hình và các mục kiểm toán. Đây là
    bằng chứng hỗ trợ cho cổng kiểm tra/thao tác, không phải bằng chứng về quy trình thiết lập ban đầu tương tác hoặc
    tác tử/công cụ/phê duyệt OpenClaw. Lane tương tự được cung cấp trong QA Lab bởi
    `pnpm openclaw qa suite --scenario system-agent-ring-zero-setup`.
- Kiểm tra khói chi phí Moonshot/Kimi: khi đặt `MOONSHOT_API_KEY`, hãy chạy
  `openclaw models list --provider moonshot --json`, sau đó chạy một
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json` cô lập
  với `moonshot/kimi-k2.6`. Xác minh JSON báo cáo Moonshot/K2.6 và bản chép lời
  của trợ lý lưu trữ `usage.cost` đã chuẩn hóa.

<Tip>
Khi bạn chỉ cần một trường hợp lỗi, hãy ưu tiên thu hẹp các kiểm thử trực tiếp bằng các biến môi trường danh sách cho phép được mô tả bên dưới.
</Tip>

## Trình chạy dành riêng cho QA

Các lệnh này nằm cạnh các bộ kiểm thử chính khi bạn cần mức độ chân thực của QA-lab.

CI chạy QA Lab trong các quy trình chuyên biệt. Tính tương đương tác tử được lồng trong
`QA-Lab - All Lanes` và quy trình xác thực bản phát hành, không phải một quy trình PR độc lập.
Việc xác thực rộng nên sử dụng `Full Release Validation` với
`rerun_group=qa-parity` hoặc nhóm QA kiểm tra bản phát hành. Các kiểm tra bản phát hành
ổn định/mặc định giữ quá trình ngâm trực tiếp/Docker toàn diện phía sau `run_release_soak=true`;
hồ sơ `full` buộc bật quá trình ngâm. `QA-Lab - All Lanes` chạy hằng đêm trên `main` và
từ lượt điều phối thủ công, với lane tương đương mô phỏng, lane Matrix trực tiếp,
lane Telegram trực tiếp do Convex quản lý và lane Discord trực tiếp do Convex quản lý dưới dạng
các tác vụ song song. QA theo lịch và các kiểm tra bản phát hành chạy hồ sơ phát hành Matrix
qua bộ điều hợp trực tiếp dùng chung. Giá trị mặc định của CLI Matrix và đầu vào quy trình thủ công
vẫn là `all`; các lượt điều phối `all` thủ công phân tách thành các hồ sơ vận chuyển, phương tiện và
E2EE, trong khi các lượt điều phối có mục tiêu có thể chọn `fast`, `release` hoặc
`transport`. `OpenClaw Release Checks` chạy kiểm tra tính tương đương cùng hồ sơ bộ điều hợp trực tiếp Matrix
có thể tái sử dụng và lane Telegram trước khi phê duyệt bản phát hành. Các kiểm tra
vận chuyển của bản phát hành sử dụng `mock-openai/gpt-5.6-luna` để luôn có tính xác định và
tránh khởi động plugin nhà cung cấp thông thường. Các Gateway vận chuyển trực tiếp này
tắt tìm kiếm bộ nhớ; hành vi bộ nhớ vẫn được bao phủ bởi các bộ kiểm thử tính tương đương QA.

Các phân mảnh phương tiện trực tiếp của bản phát hành đầy đủ sử dụng
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, vốn đã có
`ffmpeg` và `ffprobe`. Các phân mảnh mô hình/phần phụ trợ trực tiếp Docker sử dụng ảnh
`ghcr.io/openclaw/openclaw-live-test:<sha>` dùng chung được dựng một lần cho mỗi
commit đã chọn, sau đó kéo ảnh bằng `OPENCLAW_SKIP_DOCKER_BUILD=1` thay vì dựng lại
bên trong từng phân mảnh.

- `pnpm openclaw qa suite`
  - Chạy trực tiếp trên máy chủ các kịch bản QA dựa trên repo.
  - Ghi các artifact cấp cao nhất `qa-evidence.json`, `qa-suite-summary.json` và
    `qa-suite-report.md` cho tập kịch bản đã chọn, bao gồm
    các lựa chọn kịch bản luồng hỗn hợp, Vitest và Playwright.
  - Khi được `pnpm openclaw qa run --qa-profile <profile>` điều phối, nhúng
    bảng điểm hồ sơ phân loại đã chọn vào cùng `qa-evidence.json`.
    `smoke-ci` ghi bằng chứng tinh gọn (`evidenceMode: "slim"`, không có
    `execution` cho từng mục). `release` bao quát phần được tuyển chọn để đánh giá mức độ sẵn sàng phát hành; `all`
    chọn mọi danh mục trưởng thành đang hoạt động và nhắm đến các lượt điều phối quy trình công việc QA Profile
    Evidence tường minh khi cần artifact bảng điểm đầy đủ.
  - Theo mặc định, chạy song song nhiều kịch bản đã chọn bằng các
    worker Gateway được cô lập. `qa-channel` mặc định có mức đồng thời là 4 (bị giới hạn bởi
    số lượng kịch bản đã chọn). Dùng `--concurrency <count>` để điều chỉnh số lượng
    worker hoặc `--concurrency 1` cho lane tuần tự cũ hơn.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` để tạo
    artifact mà không trả về mã thoát thất bại.
  - Hỗ trợ các chế độ nhà cung cấp `live-frontier`, `mock-openai` và `aimock`.
    `aimock` khởi động một máy chủ nhà cung cấp cục bộ dựa trên AIMock để thử nghiệm
    mức bao phủ fixture và mô phỏng giao thức mà không thay thế lane
    `mock-openai` có nhận biết kịch bản.
- `pnpm openclaw qa coverage --match <query>`
  - Tìm kiếm ID kịch bản, tiêu đề, bề mặt, ID mức bao phủ, tham chiếu tài liệu, tham chiếu mã,
    Plugin và yêu cầu nhà cung cấp, sau đó in ra các đích bộ kiểm thử
    khớp.
  - Dùng thao tác này trước khi chạy QA Lab nếu bạn biết hành vi hoặc đường dẫn tệp
    bị tác động nhưng không biết kịch bản nhỏ nhất. Chỉ mang tính tư vấn — vẫn chọn bằng chứng mô phỏng,
    trực tiếp, Multipass, Matrix hoặc lớp truyền tải dựa trên hành vi đang
    được thay đổi.
- `pnpm test:plugins:kitchen-sink-live`
  - Chạy chuỗi thử thách Plugin OpenAI Kitchen Sink trực tiếp thông qua QA Lab.
    Cài đặt gói Kitchen Sink bên ngoài, xác minh danh mục bề mặt SDK
    Plugin, thăm dò `/healthz` và `/readyz`, ghi lại bằng chứng
    CPU/RSS của Gateway, chạy một lượt OpenAI trực tiếp và kiểm tra
    chẩn đoán đối kháng. Yêu cầu xác thực OpenAI trực tiếp như `OPENAI_API_KEY`. Trong
    các phiên Testbox đã được nạp dữ liệu, quy trình tự động nạp hồ sơ xác thực trực tiếp
    của Testbox khi có trình trợ giúp `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Chạy phép đo chuẩn khởi động Gateway cùng một gói nhỏ các kịch bản QA Lab mô phỏng
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) và ghi bản tóm tắt quan sát CPU
    tổng hợp vào `.artifacts/gateway-cpu-scenarios/`.
  - Theo mặc định, chỉ gắn cờ các quan sát CPU nóng kéo dài (`--cpu-core-warn`,
    mặc định `0.9`; `--hot-wall-warn-ms`, mặc định `30000`), vì vậy các đợt tăng ngắn khi khởi động
    được ghi lại dưới dạng chỉ số mà không bị hiểu nhầm là lỗi hồi quy
    Gateway bị ghim CPU kéo dài nhiều phút.
  - Chạy với các artifact `dist` đã build; hãy chạy build trước khi checkout
    chưa có đầu ra runtime mới.
- `pnpm openclaw qa suite --runner multipass`
  - Chạy cùng bộ QA bên trong một máy ảo Linux Multipass dùng một lần, giữ nguyên
    các cờ lựa chọn kịch bản và nhà cung cấp/mô hình như `qa suite`.
  - Các lượt chạy trực tiếp chuyển tiếp những đầu vào xác thực QA phù hợp cho máy khách:
    khóa nhà cung cấp dựa trên biến môi trường, đường dẫn cấu hình nhà cung cấp trực tiếp của QA và
    `CODEX_HOME` khi có.
  - Các thư mục đầu ra phải nằm trong thư mục gốc của repo để máy khách có thể ghi ngược
    thông qua workspace được gắn kết.
  - Ghi báo cáo + bản tóm tắt QA thông thường cùng nhật ký Multipass vào
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Khởi động trang QA dựa trên Docker cho công việc QA theo kiểu người vận hành.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Build một tarball npm từ checkout hiện tại, cài đặt toàn cục trong
    Docker, chạy quy trình thiết lập ban đầu không tương tác bằng khóa API OpenAI, cấu hình
    Telegram theo mặc định, xác minh runtime Plugin đóng gói tải được mà không cần
    sửa chữa phần phụ thuộc khi khởi động, chạy doctor và chạy một lượt agent cục bộ
    với endpoint OpenAI mô phỏng.
  - Dùng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` để chạy cùng lane cài đặt
    gói với Discord.
- `pnpm test:docker:session-runtime-context`
  - Chạy kiểm thử smoke Docker xác định trên ứng dụng đã build cho các bản chép lời ngữ cảnh
    runtime được nhúng. Xác minh ngữ cảnh runtime OpenClaw ẩn được duy trì dưới dạng
    thông báo tùy chỉnh không hiển thị thay vì rò rỉ vào lượt hiển thị cho người dùng,
    sau đó tạo sẵn một JSONL phiên bị hỏng chịu ảnh hưởng và xác minh
    `openclaw doctor --fix` ghi lại nó vào nhánh đang hoạt động kèm bản sao lưu.
- `pnpm test:docker:npm-telegram-live`
  - Cài đặt một ứng viên gói OpenClaw trong Docker, chạy quy trình thiết lập ban đầu
    của gói đã cài đặt, cấu hình Telegram thông qua CLI đã cài đặt, rồi tái sử dụng
    lane QA Telegram trực tiếp với gói đã cài đặt đó làm Gateway
    SUT.
  - Trình bao chỉ gắn kết mã nguồn harness `qa-lab` từ checkout;
    gói đã cài đặt sở hữu `dist`, `openclaw/plugin-sdk` và runtime
    Plugin đi kèm, vì vậy lane không trộn các Plugin của checkout hiện tại vào
    gói đang được kiểm thử.
  - Mặc định là `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; đặt
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` hoặc
    `OPENCLAW_CURRENT_PACKAGE_TGZ` để kiểm thử một tarball cục bộ đã phân giải thay vì
    cài đặt từ registry.
  - Theo mặc định, xuất phép đo thời gian RTT lặp lại trong `qa-evidence.json` bằng
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES=20`. Ghi đè
    `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`,
    `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` hoặc
    `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` để điều chỉnh lượt chạy.
    `OPENCLAW_NPM_TELEGRAM_RTT_CHECKS` chọn kịch bản QA Telegram để
    lấy mẫu; đích RTT được hỗ trợ là `channel-canary`.
  - Dùng cùng thông tin xác thực môi trường Telegram hoặc nguồn thông tin xác thực Convex như
    `pnpm openclaw qa telegram`. Đối với tự động hóa CI/phát hành, hãy đặt
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` cùng
    `OPENCLAW_QA_CONVEX_SITE_URL` và một bí mật vai trò. Nếu
    `OPENCLAW_QA_CONVEX_SITE_URL` và một bí mật vai trò Convex có trong
    CI, trình bao Docker tự động chọn Convex.
  - Trình bao xác thực môi trường thông tin xác thực Telegram hoặc Convex trên máy chủ
    trước công việc build/cài đặt Docker. Chỉ đặt
    `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1` khi
    chủ ý gỡ lỗi thiết lập trước thông tin xác thực.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` ghi đè
    `OPENCLAW_QA_CREDENTIAL_ROLE` dùng chung chỉ cho lane này. Khi chọn
    thông tin xác thực Convex và chưa đặt vai trò, trình bao dùng `ci` trong CI
    và `maintainer` ngoài CI.
  - GitHub Actions cung cấp lane này dưới dạng quy trình công việc thủ công dành cho người bảo trì
    `NPM Telegram Beta E2E`. Nó không chạy khi hợp nhất. Quy trình công việc dùng môi trường
    `qa-live-shared` và các hợp đồng thuê thông tin xác thực CI Convex.
- GitHub Actions cũng cung cấp `Package Acceptance` để kiểm chứng sản phẩm bằng lượt chạy phụ
  với một gói ứng viên. Nó chấp nhận tham chiếu Git, đặc tả npm đã xuất bản,
  URL tarball HTTPS kèm SHA-256, chính sách URL đáng tin cậy hoặc artifact tarball
  từ một lượt chạy khác (`source=ref|npm|url|trusted-url|artifact`), tải
  `openclaw-current.tgz` đã chuẩn hóa lên dưới tên `package-under-test`, rồi chạy
  bộ lập lịch Docker E2E hiện có với hồ sơ lane `smoke`, `package`, `product`, `full`
  hoặc `custom`. Đặt `telegram_mode=mock-openai` hoặc
  `live-frontier` để chạy quy trình công việc QA Telegram với cùng
  artifact `package-under-test`.
  - Kiểm chứng sản phẩm beta mới nhất:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Kiểm chứng URL tarball chính xác yêu cầu mã băm và sử dụng chính sách an toàn URL công khai:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Các mirror tarball doanh nghiệp/riêng tư sử dụng chính sách nguồn đáng tin cậy tường minh:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

`source=trusted-url` đọc `.github/package-trusted-sources.json` từ tham chiếu quy trình công việc đáng tin cậy và không chấp nhận thông tin xác thực URL hoặc cơ chế bỏ qua mạng riêng từ đầu vào quy trình công việc. Nếu chính sách được đặt tên khai báo xác thực bearer, hãy cấu hình bí mật `OPENCLAW_TRUSTED_PACKAGE_TOKEN` cố định.

- Kiểm chứng artifact tải xuống một artifact tarball từ một lượt chạy Actions khác:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Đóng gói và cài đặt bản build OpenClaw hiện tại trong Docker, khởi động
    Gateway với OpenAI đã cấu hình, rồi bật các kênh/Plugin đi kèm bằng
    chỉnh sửa cấu hình.
  - Xác minh quá trình khám phá thiết lập không đưa vào các Plugin có thể tải xuống chưa được cấu hình,
    lần sửa chữa doctor được cấu hình đầu tiên cài đặt tường minh từng
    Plugin có thể tải xuống còn thiếu và lần khởi động lại thứ hai không chạy
    sửa chữa phần phụ thuộc ẩn.
  - Đồng thời cài đặt một bản cơ sở npm cũ đã biết, bật Telegram trước khi
    chạy `openclaw update --tag <candidate>` và xác minh
    doctor sau cập nhật của ứng viên dọn sạch phần dư thừa phần phụ thuộc Plugin cũ
    mà không cần sửa chữa postinstall từ phía harness.
- `pnpm test:parallels:npm-update`
  - Chạy kiểm thử smoke cập nhật cài đặt gói gốc trên các máy khách Parallels.
    Mỗi nền tảng được chọn trước tiên cài đặt gói cơ sở được yêu cầu,
    sau đó chạy lệnh `openclaw update` đã cài đặt trong cùng máy khách và
    xác minh phiên bản đã cài đặt, trạng thái cập nhật, mức sẵn sàng của Gateway và
    một lượt agent cục bộ.
  - Dùng `--platform macos`, `--platform windows` hoặc `--platform linux`
    khi lặp lại trên một máy khách. Dùng `--json` cho đường dẫn artifact
    tóm tắt và trạng thái từng lane.
  - Lane OpenAI dùng `openai/gpt-5.6-luna` cho kiểm chứng lượt agent trực tiếp theo
    mặc định. Truyền `--model <provider/model>` hoặc đặt
    `OPENCLAW_PARALLELS_OPENAI_MODEL` để xác thực một mô hình OpenAI khác.
  - Bao bọc các lượt chạy cục bộ dài bằng thời gian chờ trên máy chủ để tình trạng đình trệ lớp truyền tải Parallels
    không thể chiếm hết khoảng thời gian kiểm thử còn lại:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Script ghi nhật ký lane lồng nhau vào
    `/tmp/openclaw-parallels-npm-update.*`. Kiểm tra `windows-update.log`,
    `macos-update.log` hoặc `linux-update.log` trước khi cho rằng trình bao
    bên ngoài bị treo.
  - Quá trình cập nhật Windows có thể mất 10 đến 15 phút cho doctor sau cập nhật và
    công việc cập nhật gói trên máy khách nguội; trạng thái này vẫn bình thường khi
    nhật ký gỡ lỗi npm lồng nhau tiếp tục tiến triển.
  - Không chạy trình bao tổng hợp này song song với từng lane kiểm thử smoke Parallels
    dành cho macOS, Windows hoặc Linux. Chúng dùng chung trạng thái máy ảo và có thể
    xung đột khi khôi phục snapshot, phân phối gói hoặc cập nhật trạng thái Gateway của máy khách.
  - Kiểm chứng sau cập nhật chạy bề mặt Plugin đi kèm thông thường vì
    các facade năng lực như giọng nói, tạo hình ảnh và hiểu
    phương tiện tải qua các API runtime đi kèm ngay cả khi chính lượt
    agent chỉ kiểm tra một phản hồi văn bản đơn giản.

- `pnpm openclaw qa aimock`
  - Chỉ khởi động máy chủ nhà cung cấp AIMock cục bộ để kiểm thử nhanh
    giao thức trực tiếp.
- `pnpm openclaw qa matrix`
  - Chạy luồng QA trực tiếp của Matrix trên một homeserver Tuwunel dùng một lần
    được Docker hỗ trợ. Chỉ dành cho bản checkout mã nguồn - các bản cài đặt đóng gói không cung cấp
    `qa-lab`.
  - CLI đầy đủ, danh mục hồ sơ/kịch bản, biến môi trường và bố cục cấu phần:
    [Các luồng kiểm thử nhanh Matrix](/vi/concepts/qa-e2e-automation#matrix-smoke-lanes).
- `pnpm openclaw qa telegram`
  - Chạy luồng QA trực tiếp của Telegram trên một nhóm riêng tư thực bằng
    token bot trình điều khiển và SUT từ biến môi trường.
  - Yêu cầu `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
    `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` và
    `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID nhóm phải là ID cuộc trò chuyện Telegram
    dạng số.
  - Hỗ trợ `--credential-source convex` cho thông tin xác thực dùng chung trong nhóm.
    Theo mặc định, hãy dùng chế độ biến môi trường hoặc đặt `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`
    để chọn sử dụng các lượt thuê trong nhóm.
  - Các giá trị mặc định bao phủ canary, cổng đề cập, định địa chỉ lệnh, `/status`,
    phản hồi được đề cập giữa các bot và phản hồi lệnh gốc cốt lõi.
    Các giá trị mặc định của `mock-openai` cũng bao phủ chuỗi phản hồi xác định và
    các lỗi hồi quy khi truyền phát tin nhắn cuối cùng của Telegram. Dùng `--list-scenarios`
    cho các phép thăm dò tùy chọn như `session_status`.
  - Thoát với mã khác 0 khi bất kỳ kịch bản nào thất bại. Dùng `--allow-failures` để tạo
    cấu phần mà không có mã thoát báo lỗi.
  - Yêu cầu hai bot riêng biệt trong cùng một nhóm riêng tư, trong đó bot SUT
    công khai tên người dùng Telegram.
  - Để quan sát ổn định giữa các bot, hãy bật Bot-to-Bot Communication Mode
    trong `@BotFather` cho cả hai bot và đảm bảo bot trình điều khiển có thể quan sát
    lưu lượng bot trong nhóm.
  - Ghi báo cáo QA Telegram, bản tóm tắt và `qa-evidence.json` vào
    `.artifacts/qa-e2e/...`. Các kịch bản có phản hồi bao gồm RTT từ yêu cầu gửi của
    trình điều khiển đến phản hồi SUT quan sát được.

`Mantis Telegram Live` là trình bao bằng chứng PR quanh luồng này. Nó chạy
tham chiếu ứng viên bằng thông tin xác thực Telegram được Convex cho thuê, kết xuất
gói báo cáo/bằng chứng QA đã che thông tin trong trình duyệt máy tính Crabbox, ghi lại
bằng chứng MP4, tạo GIF đã cắt bỏ phần không chuyển động, tải gói cấu phần lên và
đăng bằng chứng PR nội tuyến qua Ứng dụng GitHub Mantis khi `pr_number` được
đặt. Người bảo trì có thể khởi chạy từ giao diện Actions qua `Mantis Scenario`
(`scenario_id: telegram-live`) hoặc trực tiếp từ bình luận pull request:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
```

`Mantis Telegram Desktop Proof` là trình bao Telegram Desktop gốc có tác tử
trước/sau dành cho bằng chứng trực quan của PR. Khởi chạy từ giao diện Actions bằng
`instructions` dạng tự do, qua `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) hoặc từ bình luận PR:

```text
@openclaw-mantis telegram desktop proof
```

Tác tử Mantis đọc PR, quyết định hành vi hiển thị trên Telegram nào chứng minh
thay đổi, chạy luồng bằng chứng Telegram Desktop dành cho người dùng thực trên Crabbox
ở tham chiếu cơ sở và ứng viên, lặp lại cho đến khi các GIF gốc hữu ích,
ghi tệp kê khai `motionPreview` theo cặp và đăng cùng bảng GIF 2 cột
qua Ứng dụng GitHub Mantis khi `pr_number` được đặt.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Thuê hoặc tái sử dụng máy tính Linux Crabbox, cài đặt Telegram
    Desktop gốc, cấu hình OpenClaw bằng token bot SUT Telegram được thuê,
    khởi động Gateway và ghi lại bằng chứng ảnh chụp màn hình/MP4 từ
    màn hình VNC hiển thị.
  - Mặc định là `--credential-source convex` để quy trình công việc chỉ cần
    bí mật của trình môi giới Convex. Dùng `--credential-source env` với cùng
    các biến `OPENCLAW_QA_TELEGRAM_*` như `pnpm openclaw qa telegram`.
  - Telegram Desktop vẫn cần thông tin đăng nhập/hồ sơ người dùng. Token bot
    chỉ cấu hình OpenClaw. Dùng `--telegram-profile-archive-env <name>`
    cho kho lưu trữ hồ sơ `.tgz` dạng base64 hoặc dùng `--keep-lease` và đăng nhập
    thủ công qua VNC một lần.
  - Ghi `mantis-telegram-desktop-builder-report.md`,
    `mantis-telegram-desktop-builder-summary.json`,
    `telegram-desktop-builder.png` và `telegram-desktop-builder.mp4`
    vào thư mục đầu ra.

Các luồng truyền tải trực tiếp dùng chung một hợp đồng tiêu chuẩn để các phương thức
truyền tải mới không bị sai lệch; ma trận phạm vi bao phủ theo từng luồng nằm tại
[Tổng quan QA - Phạm vi truyền tải trực tiếp](/vi/concepts/qa-e2e-automation#live-transport-coverage).
`qa-channel` là bộ kiểm thử tổng hợp rộng và không thuộc ma trận đó.

### Thông tin xác thực Telegram dùng chung qua Convex (v1)

Khi `--credential-source convex` (hoặc `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`)
được bật cho QA truyền tải trực tiếp, phòng QA nhận một lượt thuê độc quyền từ
nhóm được Convex hỗ trợ, gửi Heartbeat cho lượt thuê đó trong khi luồng đang chạy và
giải phóng lượt thuê khi tắt. Tên mục có từ trước khi hỗ trợ Discord, Slack và
WhatsApp; hợp đồng thuê được dùng chung giữa các loại.

Khung dự án Convex tham khảo: `qa/convex-credential-broker/`

Các biến môi trường bắt buộc:

- `OPENCLAW_QA_CONVEX_SITE_URL` (ví dụ `https://your-deployment.convex.site`)
- Một bí mật cho vai trò đã chọn:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` cho `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` cho `ci`
- Chọn vai trò thông tin xác thực:
  - CLI: `--credential-role maintainer|ci`
  - Mặc định theo biến môi trường: `OPENCLAW_QA_CREDENTIAL_ROLE` (mặc định là `ci` trong CI, nếu không thì là `maintainer`)

Các biến môi trường tùy chọn:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (mặc định `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (mặc định `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (mặc định `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (mặc định `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (mặc định `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID dấu vết tùy chọn)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` cho phép URL Convex `http://` lặp về cho phát triển chỉ cục bộ.

`OPENCLAW_QA_CONVEX_SITE_URL` nên dùng `https://` trong hoạt động bình thường.

Các lệnh quản trị dành cho người bảo trì (thêm/xóa/liệt kê nhóm) yêu cầu riêng
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Các trình trợ giúp CLI dành cho người bảo trì:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Dùng `doctor` trước khi chạy trực tiếp để kiểm tra URL trang Convex, bí mật trình môi giới,
tiền tố điểm cuối, thời gian chờ HTTP và khả năng truy cập quản trị/liệt kê mà không in
giá trị bí mật. Dùng `--json` để có đầu ra máy đọc được trong tập lệnh và tiện ích CI.

Hợp đồng điểm cuối mặc định (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`).
Các yêu cầu xác thực bằng tiêu đề `Authorization: Bearer <role secret>`;
các phần thân dưới đây không bao gồm tiêu đề đó:

- `POST /acquire`
  - Yêu cầu: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Thành công: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Đã cạn/có thể thử lại: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Yêu cầu: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Thành công: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Yêu cầu: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Thành công: `{ status: "ok" }` (hoặc `2xx` trống)
- `POST /release`
  - Yêu cầu: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Thành công: `{ status: "ok" }` (hoặc `2xx` trống)
- `POST /admin/add` (chỉ bí mật của người bảo trì)
  - Yêu cầu: `{ kind, actorId, payload, note?, status? }`
  - Thành công: `{ status: "ok", credential }`
- `POST /admin/remove` (chỉ bí mật của người bảo trì)
  - Yêu cầu: `{ credentialId, actorId }`
  - Thành công: `{ status: "ok", changed, credential }`
  - Bộ bảo vệ lượt thuê đang hoạt động: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (chỉ bí mật của người bảo trì)
  - Yêu cầu: `{ kind?, status?, includePayload?, limit? }`
  - Thành công: `{ status: "ok", credentials, count }`

Cấu trúc tải trọng cho loại Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` phải là chuỗi ID cuộc trò chuyện Telegram dạng số.
- `admin/add` xác thực cấu trúc này cho `kind: "telegram"` và từ chối tải trọng sai định dạng.

Cấu trúc tải trọng cho loại người dùng thực Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` và `telegramApiId` phải là chuỗi số.
- `tdlibArchiveSha256` và `desktopTdataArchiveSha256` phải là chuỗi hex SHA-256.
- `kind: "telegram-user"` được dành riêng cho quy trình bằng chứng Telegram Desktop của Mantis. Các luồng Phòng QA chung không được nhận nó.

Tải trọng đa kênh được trình môi giới xác thực:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Các luồng Slack cũng có thể thuê từ nhóm, nhưng việc xác thực tải trọng Slack
hiện nằm trong trình chạy QA Slack thay vì trình môi giới. Dùng
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
cho các hàng Slack.

### Thêm một kênh vào QA

Kiến trúc và tên trình trợ giúp kịch bản cho bộ điều hợp kênh mới nằm tại
[Tổng quan QA - Thêm một kênh](/vi/concepts/qa-e2e-automation#adding-a-channel).
Yêu cầu tối thiểu: triển khai trình chạy truyền tải trên đường nối máy chủ `qa-lab`
dùng chung, thêm `adapterFactory` cho các kịch bản dùng chung, khai báo `qaRunners` trong
tệp kê khai Plugin, gắn kết dưới dạng `openclaw qa <runner>` và viết kịch bản trong
`qa/scenarios/`.

## Các bộ kiểm thử (chạy ở đâu)

Hãy xem các bộ kiểm thử là có "mức độ thực tế tăng dần" (đồng thời độ bất ổn/chi phí cũng tăng).

### Đơn vị / tích hợp (mặc định)

- Lệnh: `pnpm test`
- Cấu hình: các lượt chạy không nhắm mục tiêu dùng tập phân đoạn `vitest.full-*.config.ts` và có thể
  mở rộng các phân đoạn đa dự án thành cấu hình theo từng dự án để lập lịch
  song song
- Tệp: danh mục cốt lõi/đơn vị trong `src/**/*.test.ts`,
  `packages/**/*.test.ts` và `test/**/*.test.ts`; các kiểm thử đơn vị UI chạy trong
  phân đoạn `unit-ui` chuyên dụng
- Phạm vi:
  - Kiểm thử đơn vị thuần túy
  - Kiểm thử tích hợp trong tiến trình (xác thực Gateway, định tuyến, công cụ, phân tích cú pháp, cấu hình)
  - Kiểm thử hồi quy xác định cho các lỗi đã biết
- Yêu cầu:
  - Chạy trong CI
  - Không yêu cầu khóa thực
  - Phải nhanh và ổn định
  - Các kiểm thử trình phân giải và trình tải bề mặt công khai phải chứng minh hành vi dự phòng rộng
    của `api.js` và `runtime-api.js` bằng các fixture Plugin nhỏ được tạo,
    không dùng API mã nguồn Plugin tích hợp thực. Việc tải API Plugin thực thuộc về
    các bộ kiểm thử hợp đồng/tích hợp do Plugin sở hữu.

Chính sách phụ thuộc gốc:

- Theo mặc định, bản cài đặt kiểm thử bỏ qua các bản dựng opus gốc tùy chọn của Discord. Thoại
  Discord dùng `libopus-wasm` đi kèm và `@discordjs/opus` vẫn bị tắt trong
  `allowBuilds` để các kiểm thử cục bộ và luồng Testbox không biên dịch phần bổ trợ
  gốc.
- So sánh hiệu năng opus gốc trong kho điểm chuẩn `libopus-wasm`, không phải
  trong các vòng lặp cài đặt/kiểm thử OpenClaw mặc định. Không đặt `@discordjs/opus` thành
  `true` trong `allowBuilds` mặc định; điều đó khiến các vòng lặp cài đặt/kiểm thử
  không liên quan biên dịch mã gốc.

<AccordionGroup>
  <Accordion title="Dự án, phân đoạn và các luồng có phạm vi">

    - Lần chạy `pnpm test` không chỉ định mục tiêu sẽ chạy mười ba cấu hình phân mảnh nhỏ hơn (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-tooling`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) thay vì một tiến trình gốc khổng lồ của dự án gốc. Cách này làm giảm RSS đỉnh trên các máy đang chịu tải và tránh để công việc tự động trả lời/Plugin làm các bộ kiểm thử không liên quan bị thiếu tài nguyên.
    - `pnpm test --watch` vẫn sử dụng đồ thị dự án `vitest.config.ts` gốc nguyên bản vì vòng lặp theo dõi nhiều phân mảnh không khả thi.
    - `pnpm test`, `pnpm test:watch` và `pnpm test:perf:imports` trước tiên định tuyến các mục tiêu tệp/thư mục được chỉ định rõ ràng qua các lane có phạm vi, nhờ đó `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tránh phải chịu toàn bộ chi phí khởi động dự án gốc.
    - `pnpm test:changed` mặc định mở rộng các đường dẫn git đã thay đổi thành các lane có phạm vi ít tốn kém: chỉnh sửa trực tiếp kiểm thử, các tệp `*.test.ts` cùng cấp, ánh xạ nguồn rõ ràng và các thành phần phụ thuộc trong đồ thị nhập cục bộ. Các chỉnh sửa cấu hình/thiết lập/gói không chạy kiểm thử trên phạm vi rộng trừ khi bạn sử dụng rõ ràng `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` là cổng kiểm tra cục bộ thông minh thông thường dành cho công việc có phạm vi hẹp. Nó phân loại phần khác biệt thành lõi, kiểm thử lõi, tiện ích mở rộng, kiểm thử tiện ích mở rộng, ứng dụng, tài liệu, siêu dữ liệu phát hành, công cụ Docker trực tiếp và công cụ, sau đó chạy các lệnh kiểm tra kiểu, lint và lệnh bảo vệ tương ứng. Nó không chạy các kiểm thử Vitest; hãy gọi `pnpm test:changed` hoặc `pnpm test <target>` rõ ràng để cung cấp bằng chứng kiểm thử. Các lần tăng phiên bản chỉ liên quan đến siêu dữ liệu phát hành sẽ chạy các kiểm tra phiên bản/cấu hình/phần phụ thuộc gốc có mục tiêu, cùng một cơ chế bảo vệ từ chối các thay đổi gói nằm ngoài trường phiên bản cấp cao nhất.
    - Các chỉnh sửa harness ACP Docker trực tiếp sẽ chạy các kiểm tra tập trung: cú pháp shell cho các tập lệnh xác thực Docker trực tiếp và một lần chạy thử không thực thi của bộ lập lịch Docker trực tiếp. Các thay đổi `package.json` chỉ được bao gồm khi phần khác biệt chỉ giới hạn trong `scripts["test:docker:live-*"]`; các chỉnh sửa phần phụ thuộc, xuất, phiên bản và bề mặt gói khác vẫn sử dụng các cơ chế bảo vệ rộng hơn.
    - Các kiểm thử đơn vị ít nhập từ agent, lệnh, Plugin, trình trợ giúp tự động trả lời, `plugin-sdk` và các khu vực tiện ích thuần túy tương tự được định tuyến qua lane `unit-fast`, lane này bỏ qua `test/setup-openclaw-runtime.ts`; các tệp có trạng thái/nặng về runtime vẫn ở trên các lane hiện có.
    - Một số tệp nguồn trình trợ giúp `plugin-sdk` và `commands` được chọn cũng ánh xạ các lần chạy ở chế độ thay đổi đến các kiểm thử cùng cấp rõ ràng trong các lane nhẹ đó, nhờ vậy các chỉnh sửa trình trợ giúp tránh phải chạy lại toàn bộ bộ kiểm thử nặng của thư mục đó.
    - `auto-reply` có các nhóm chuyên biệt cho trình trợ giúp lõi cấp cao nhất, kiểm thử tích hợp `reply.*` cấp cao nhất và cây con `src/auto-reply/reply/**`. CI tiếp tục chia cây con trả lời thành các phân mảnh trình chạy agent, điều phối và lệnh/định tuyến trạng thái để một nhóm nặng về nhập không chiếm toàn bộ phần đuôi Node.
    - CI PR/main thông thường cố ý bỏ qua lượt quét theo lô các Plugin đi kèm và phân mảnh `agentic-plugins` chỉ dành cho phát hành. Quy trình Xác thực Bản phát hành Đầy đủ điều phối workflow con `Plugin Prerelease` riêng biệt cho các bộ kiểm thử nặng về Plugin đó trên các ứng viên phát hành.

  </Accordion>

  <Accordion title="Phạm vi kiểm thử của trình chạy nhúng">

    - Khi thay đổi đầu vào khám phá công cụ tin nhắn hoặc ngữ cảnh runtime của Compaction,
      hãy duy trì phạm vi kiểm thử ở cả hai cấp.
    - Thêm các kiểm thử hồi quy tập trung cho trình trợ giúp tại các ranh giới định tuyến
      và chuẩn hóa thuần túy.
    - Duy trì trạng thái hoạt động tốt của các bộ kiểm thử tích hợp trình chạy nhúng:
      `src/agents/embedded-agent-runner/compact.hooks.test.ts`,
      `src/agents/embedded-agent-runner/run.overflow-compaction.test.ts` và
      `src/agents/embedded-agent-runner/run.overflow-compaction.loop.test.ts`.
    - Các bộ này xác minh rằng ID có phạm vi và hành vi Compaction vẫn đi qua
      các đường dẫn `run.ts` / `compact.ts` thực tế; các kiểm thử chỉ dành cho trình trợ giúp
      không thể thay thế đầy đủ các đường dẫn tích hợp đó.

  </Accordion>

  <Accordion title="Mặc định về pool và cách ly của Vitest">

    - Cấu hình Vitest cơ sở mặc định là `threads`.
    - Cấu hình Vitest dùng chung cố định `isolate: false` và sử dụng
      trình chạy không cách ly trên các dự án gốc, cấu hình e2e và cấu hình trực tiếp.
    - Lane UI gốc giữ nguyên thiết lập và trình tối ưu hóa `jsdom`, nhưng cũng chạy trên
      trình chạy không cách ly dùng chung.
    - Mỗi phân mảnh `pnpm test` kế thừa cùng các giá trị mặc định `threads` + `isolate: false`
      từ cấu hình Vitest dùng chung.
    - `scripts/run-vitest.mjs` mặc định thêm `--no-maglev` cho các tiến trình Node con
      của Vitest nhằm giảm tải biên dịch lặp lại của V8 trong các lần chạy cục bộ lớn.
      Đặt `OPENCLAW_VITEST_ENABLE_MAGLEV=1` để so sánh với hành vi V8
      nguyên bản.
    - `scripts/run-vitest.mjs` chấm dứt các lần chạy Vitest không theo dõi được chỉ định rõ ràng
      sau 5 phút không có đầu ra stdout hoặc stderr. Đặt
      `OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=0` để vô hiệu hóa bộ giám sát cho
      một quá trình điều tra cố ý không tạo đầu ra.

  </Accordion>

  <Accordion title="Lặp cục bộ nhanh">

    - `pnpm changed:lanes` hiển thị những lane kiến trúc nào được kích hoạt bởi một phần khác biệt.
    - Hook pre-commit chỉ thực hiện định dạng. Nó đưa lại các tệp đã định dạng vào vùng staging
      và không chạy lint, kiểm tra kiểu hay kiểm thử.
    - Chạy rõ ràng `pnpm check:changed` trước khi bàn giao hoặc đẩy lên khi bạn
      cần cổng kiểm tra cục bộ thông minh.
    - `pnpm test:changed` mặc định định tuyến qua các lane có phạm vi ít tốn kém. Chỉ sử dụng
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` khi agent
      xác định rằng một chỉnh sửa harness, cấu hình, gói hoặc hợp đồng thực sự cần
      phạm vi kiểm thử Vitest rộng hơn.
    - `pnpm test:max` và `pnpm test:changed:max` giữ nguyên hành vi định tuyến,
      chỉ khác ở giới hạn worker cao hơn.
    - Tính năng tự động điều chỉnh quy mô worker cục bộ được thiết kế thận trọng và giảm mức sử dụng
      khi tải trung bình của máy chủ đã cao, nhờ vậy nhiều lần chạy Vitest đồng thời
      mặc định gây ít ảnh hưởng hơn.
    - Cấu hình Vitest cơ sở đánh dấu các tệp dự án/cấu hình là
      `forceRerunTriggers` để các lần chạy lại ở chế độ thay đổi vẫn chính xác khi
      hệ thống kết nối kiểm thử thay đổi.
    - Cấu hình giữ `OPENCLAW_VITEST_FS_MODULE_CACHE` được bật trên
      các máy chủ được hỗ trợ; đặt `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      để chỉ định một vị trí bộ nhớ đệm rõ ràng cho việc lập hồ sơ trực tiếp.

  </Accordion>

  <Accordion title="Gỡ lỗi hiệu năng">

    - `pnpm test:perf:imports` bật báo cáo thời lượng nhập của Vitest cùng
      đầu ra phân tích chi tiết hoạt động nhập.
    - `pnpm test:perf:imports:changed` giới hạn cùng chế độ xem lập hồ sơ đó trong
      các tệp đã thay đổi kể từ `origin/main`.
    - Dữ liệu thời gian của phân mảnh được ghi vào `.artifacts/vitest-shard-timings.json`.
      Các lần chạy toàn bộ cấu hình sử dụng đường dẫn cấu hình làm khóa; các phân mảnh CI
      theo mẫu bao gồm sẽ nối thêm tên phân mảnh để có thể theo dõi riêng
      các phân mảnh đã lọc.
    - Khi một kiểm thử nóng vẫn dành phần lớn thời gian cho hoạt động nhập lúc khởi động,
      hãy đặt các phần phụ thuộc nặng phía sau một seam `*.runtime.ts` cục bộ hẹp và
      mô phỏng trực tiếp seam đó thay vì nhập sâu các trình trợ giúp runtime
      chỉ để truyền chúng qua `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` so sánh
      `test:changed` đã định tuyến với đường dẫn dự án gốc nguyên bản cho
      phần khác biệt đã commit đó và in thời gian thực tế cùng RSS tối đa trên macOS.
    - `pnpm test:perf:changed:bench -- --worktree` đo hiệu năng cây làm việc bẩn hiện tại
      bằng cách định tuyến danh sách tệp đã thay đổi qua
      `scripts/test-projects.mjs` và cấu hình Vitest gốc.
    - `pnpm test:perf:profile:main` ghi hồ sơ CPU của luồng chính cho
      chi phí khởi động và chuyển đổi Vitest/Vite.
    - `pnpm test:perf:profile:runner` ghi hồ sơ CPU+bộ nhớ heap của trình chạy cho
      bộ kiểm thử đơn vị khi tính song song theo tệp bị vô hiệu hóa.

  </Accordion>
</AccordionGroup>

### Độ ổn định (Gateway)

- Lệnh: `pnpm test:stability:gateway`
- Cấu hình: `test/vitest/vitest.gateway.config.ts`, `test/vitest/vitest.logging.config.ts` và `test/vitest/vitest.infra.config.ts`, mỗi cấu hình bị buộc dùng một worker
- Phạm vi:
  - Khởi động một Gateway loopback thực với chẩn đoán được bật theo mặc định
  - Tạo luồng biến động tổng hợp về tin nhắn Gateway, bộ nhớ và tải trọng lớn qua đường dẫn sự kiện chẩn đoán
  - Truy vấn `diagnostics.stability` qua RPC WS của Gateway
  - Bao phủ các trình trợ giúp lưu bền gói độ ổn định chẩn đoán
  - Xác nhận trình ghi vẫn được giới hạn, các mẫu RSS tổng hợp duy trì dưới ngân sách áp lực và độ sâu hàng đợi theo phiên giảm trở lại về 0
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Lane hẹp để theo dõi hồi quy độ ổn định, không thay thế cho toàn bộ bộ kiểm thử Gateway

### E2E (tổng hợp repo)

- Lệnh: `pnpm test:e2e`
- Phạm vi:
  - Chạy lane E2E smoke của Gateway
  - Chạy lane E2E trình duyệt Control UI được mô phỏng
- Kỳ vọng:
  - An toàn cho CI và không cần khóa
  - Yêu cầu đã cài đặt Playwright Chromium

### E2E (smoke Gateway)

- Lệnh: `pnpm test:e2e:gateway`
- Cấu hình: `test/vitest/vitest.e2e.config.ts`
- Tệp: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` và các kiểm thử E2E của Plugin đi kèm trong `extensions/`
- Mặc định runtime:
  - Sử dụng `threads` của Vitest cùng `isolate: false`, khớp với phần còn lại của repo.
  - Sử dụng worker thích ứng (CI: tối đa 2, cục bộ: mặc định 1).
  - Mặc định chạy ở chế độ im lặng để giảm chi phí I/O bảng điều khiển.
- Các giá trị ghi đè hữu ích:
  - `OPENCLAW_E2E_WORKERS=<n>` để buộc số lượng worker (giới hạn tối đa là 16).
  - `OPENCLAW_E2E_VERBOSE=1` để bật lại đầu ra bảng điều khiển chi tiết.
- Phạm vi:
  - Hành vi đầu cuối của Gateway nhiều phiên bản
  - Các bề mặt WebSocket/HTTP, ghép cặp Node và hoạt động mạng nặng hơn
- Kỳ vọng:
  - Chạy trong CI (khi được bật trong pipeline)
  - Không yêu cầu khóa thực
  - Có nhiều thành phần chuyển động hơn kiểm thử đơn vị (có thể chậm hơn)

### E2E (trình duyệt Control UI được mô phỏng)

- Lệnh: `pnpm test:ui:e2e`
- Cấu hình: `test/vitest/vitest.ui-e2e.config.ts`
- Tệp: `ui/src/**/*.e2e.test.ts`
- Phạm vi:
  - Khởi động Vite Control UI
  - Điều khiển một trang Chromium thực qua Playwright
  - Thay thế WebSocket của Gateway bằng các mô phỏng xác định trong trình duyệt
- Kỳ vọng:
  - Chạy trong CI như một phần của `pnpm test:e2e`
  - Không yêu cầu Gateway thực, agent hay khóa nhà cung cấp
  - Phần phụ thuộc trình duyệt phải có sẵn (`pnpm --dir ui exec playwright install chromium`)

### E2E: smoke backend OpenShell

- Lệnh: `pnpm test:e2e:openshell`
- Tệp: `extensions/openshell/src/backend.e2e.test.ts`
- Phạm vi:
  - Tái sử dụng một Gateway OpenShell cục bộ đang hoạt động
  - Tạo một sandbox từ Dockerfile cục bộ tạm thời
  - Thực thi backend OpenShell của OpenClaw qua `sandbox ssh-config` thực + thực thi SSH
  - Xác minh hành vi hệ thống tệp chuẩn từ xa qua cầu nối fs của sandbox
- Kỳ vọng:
  - Chỉ chạy khi chọn tham gia; không thuộc lần chạy `pnpm test:e2e` mặc định
  - Yêu cầu CLI `openshell` cục bộ cùng một daemon Docker đang hoạt động
  - Yêu cầu một Gateway OpenShell cục bộ đang hoạt động và nguồn cấu hình của nó
  - Sử dụng `HOME` / `XDG_CONFIG_HOME` cách ly, sau đó hủy sandbox kiểm thử
- Các giá trị ghi đè hữu ích:
  - `OPENCLAW_E2E_OPENSHELL=1` để bật kiểm thử khi chạy thủ công bộ e2e rộng hơn
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` để trỏ đến tệp nhị phân CLI hoặc tập lệnh bao bọc không mặc định
  - `OPENCLAW_E2E_OPENSHELL_CONFIG_HOME=/path/to/config` để cung cấp cấu hình Gateway đã đăng ký cho kiểm thử cách ly
  - `OPENCLAW_E2E_OPENSHELL_HOST_IP=172.18.0.1` để ghi đè IP Gateway Docker được dùng bởi fixture chính sách máy chủ

### Trực tiếp (nhà cung cấp thực + mô hình thực)

- Lệnh: `pnpm test:live`
- Cấu hình: `test/vitest/vitest.live.config.ts`
- Tệp: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, và các kiểm thử trực tiếp Plugin đi kèm trong `extensions/`
- Mặc định: **được bật** bởi `pnpm test:live` (đặt `OPENCLAW_LIVE_TEST=1`)
- Phạm vi:
  - "Nhà cung cấp/mô hình này có thực sự hoạt động _hôm nay_ với thông tin xác thực thật không?"
  - Phát hiện các thay đổi định dạng của nhà cung cấp, đặc điểm bất thường khi gọi công cụ, vấn đề xác thực và hành vi giới hạn tốc độ
- Kỳ vọng:
  - Theo thiết kế, không ổn định trong CI (mạng thật, chính sách thực tế của nhà cung cấp, hạn ngạch, sự cố ngừng hoạt động)
  - Tốn chi phí / sử dụng hạn mức tốc độ
  - Ưu tiên chạy các tập con thu hẹp thay vì "mọi thứ"
- Các lần chạy trực tiếp sử dụng khóa API đã được xuất và hồ sơ xác thực đã chuẩn bị.
- Theo mặc định, các lần chạy trực tiếp vẫn cô lập `HOME` và sao chép tài liệu cấu hình/xác thực vào thư mục chính kiểm thử tạm thời để các fixture kiểm thử đơn vị không thể sửa đổi `~/.openclaw` thực của bạn.
- Chỉ đặt `OPENCLAW_LIVE_USE_REAL_HOME=1` khi bạn chủ ý cần các kiểm thử trực tiếp sử dụng thư mục chính thực của mình.
- `pnpm test:live` mặc định sử dụng chế độ ít thông báo hơn: chế độ này giữ lại đầu ra tiến trình `[live] ...` và tắt tiếng nhật ký khởi động Gateway/thông báo Bonjour. Đặt `OPENCLAW_LIVE_TEST_QUIET=0` nếu bạn muốn khôi phục toàn bộ nhật ký khởi động.
- Luân phiên khóa API (theo từng nhà cung cấp): đặt `*_API_KEYS` với định dạng phân tách bằng dấu phẩy/dấu chấm phẩy hoặc `*_API_KEY_1`, `*_API_KEY_2` (ví dụ: `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) hoặc ghi đè cho từng lần chạy trực tiếp qua `OPENCLAW_LIVE_*_KEY`; các kiểm thử sẽ thử lại khi nhận phản hồi giới hạn tốc độ.
- Đầu ra tiến trình/Heartbeat:
  - Các bộ kiểm thử trực tiếp xuất các dòng tiến trình ra stderr để các lệnh gọi nhà cung cấp kéo dài vẫn hiển thị là đang hoạt động ngay cả khi tính năng thu thập đầu ra bảng điều khiển của Vitest không hiển thị gì.
  - `test/vitest/vitest.live.config.ts` tắt tính năng chặn đầu ra bảng điều khiển của Vitest để các dòng tiến trình của nhà cung cấp/Gateway được truyền ngay lập tức trong các lần chạy trực tiếp.
  - Điều chỉnh Heartbeat của mô hình trực tiếp bằng `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Điều chỉnh Heartbeat của Gateway/probe bằng `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Nên chạy bộ kiểm thử nào?

Sử dụng bảng quyết định này:

- Chỉnh sửa logic/kiểm thử: chạy `pnpm test` (và `pnpm test:coverage` nếu bạn thay đổi nhiều)
- Thay đổi mạng Gateway / giao thức WS / ghép nối: thêm `pnpm test:e2e`
- Gỡ lỗi "bot của tôi không hoạt động" / lỗi theo từng nhà cung cấp / gọi công cụ: chạy một `pnpm test:live` đã được thu hẹp

## Kiểm thử trực tiếp (có truy cập mạng)

Đối với ma trận mô hình trực tiếp, các kiểm thử nhanh backend CLI, kiểm thử nhanh ACP, bộ khung
app-server Codex và tất cả kiểm thử trực tiếp của nhà cung cấp phương tiện (Deepgram, BytePlus, ComfyUI,
hình ảnh, nhạc, video, bộ khung phương tiện) - cùng với việc xử lý thông tin xác thực cho các lần chạy trực tiếp

- hãy xem [Kiểm thử các bộ kiểm thử trực tiếp](/vi/help/testing-live). Đối với danh sách kiểm tra chuyên biệt về cập nhật và
  xác thực Plugin, hãy xem
  [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins).

## Trình chạy Docker (kiểm tra tùy chọn "hoạt động trên Linux")

Các trình chạy Docker này được chia thành hai nhóm:

- Trình chạy mô hình trực tiếp: `test:docker:live-models` và `test:docker:live-gateway` chỉ chạy tệp trực tiếp có khóa hồ sơ tương ứng bên trong ảnh Docker của kho lưu trữ (`src/agents/models.profiles.live.test.ts` và `src/gateway/gateway-models.profiles.live.test.ts`), gắn kết thư mục cấu hình cục bộ, không gian làm việc và tệp môi trường hồ sơ tùy chọn của bạn. Các điểm vào cục bộ tương ứng là `test:live:models-profiles` và `test:live:gateway-profiles`.
- Các trình chạy trực tiếp Docker giữ các giới hạn thực tế riêng khi cần:
  `test:docker:live-models` mặc định sử dụng tập hợp tín hiệu cao được hỗ trợ và tuyển chọn, còn
  `test:docker:live-gateway` mặc định sử dụng `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` và
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Đặt `OPENCLAW_LIVE_MAX_MODELS`
  hoặc các biến môi trường Gateway khi bạn chủ ý muốn giới hạn nhỏ hơn hoặc phạm vi quét lớn hơn.
- `test:docker:all` xây dựng ảnh Docker trực tiếp một lần qua `test:docker:live-build`, đóng gói OpenClaw một lần thành tarball npm thông qua `scripts/package-openclaw-for-docker.mjs`, sau đó xây dựng/tái sử dụng hai ảnh `scripts/e2e/Dockerfile`. Ảnh cơ sở chỉ là trình chạy Node/Git cho các lane cài đặt/cập nhật/phụ thuộc Plugin; các lane đó gắn kết tarball đã xây dựng sẵn. Ảnh chức năng cài đặt cùng tarball đó vào `/app` cho các lane chức năng của ứng dụng đã xây dựng. Định nghĩa lane Docker nằm trong `scripts/lib/docker-e2e-scenarios.mjs`; logic lập kế hoạch nằm trong `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` thực thi kế hoạch đã chọn. Quy trình tổng hợp sử dụng bộ lập lịch cục bộ có trọng số: `OPENCLAW_DOCKER_ALL_PARALLELISM` kiểm soát các vị trí tiến trình, còn các giới hạn tài nguyên ngăn các lane trực tiếp nặng, cài đặt npm và đa dịch vụ cùng khởi động một lúc. Nếu một lane riêng lẻ nặng hơn các giới hạn đang áp dụng, bộ lập lịch vẫn có thể khởi động lane đó khi vùng tài nguyên trống, rồi tiếp tục để lane chạy một mình cho đến khi tài nguyên khả dụng trở lại. Giá trị mặc định là 10 vị trí, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` và `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; chỉ điều chỉnh `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` hoặc `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` (và các giá trị ghi đè `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` khác) khi máy chủ Docker có nhiều dư địa tài nguyên hơn. Theo mặc định, trình chạy thực hiện kiểm tra sơ bộ Docker, xóa các container OpenClaw E2E cũ, in trạng thái mỗi 30 giây, lưu thời gian của các lane thành công trong `.artifacts/docker-tests/lane-timings.json`, đồng thời sử dụng các thời gian đó để khởi động các lane dài hơn trước trong những lần chạy sau. Sử dụng `OPENCLAW_DOCKER_ALL_DRY_RUN=1` để in bản kê lane có trọng số mà không xây dựng hay chạy Docker, hoặc `node scripts/test-docker-all.mjs --plan-json` để in kế hoạch CI cho các lane đã chọn, nhu cầu gói/ảnh và thông tin xác thực.
- `Package Acceptance` là cổng kiểm tra gói gốc của GitHub cho câu hỏi "tarball có thể cài đặt này có hoạt động như một sản phẩm không?" Cổng này phân giải một gói ứng viên từ `source=npm`, `source=ref`, `source=url`, `source=trusted-url` hoặc `source=artifact`, tải gói lên dưới tên `package-under-test`, rồi chạy các lane Docker E2E có thể tái sử dụng với chính tarball đó thay vì đóng gói lại tham chiếu đã chọn. Các hồ sơ được sắp xếp theo độ bao phủ: `smoke`, `package`, `product` và `full` (cùng với `custom` cho danh sách lane chỉ định rõ). Xem [Kiểm thử cập nhật và Plugin](/vi/help/testing-updates-plugins) để biết hợp đồng gói/cập nhật/Plugin, ma trận kiểm tra khả năng tồn tại sau nâng cấp đã phát hành, giá trị mặc định cho bản phát hành và cách phân loại lỗi.
- Các bước kiểm tra bản dựng và bản phát hành chạy `scripts/check-cli-bootstrap-imports.mjs` sau tsdown. Cơ chế bảo vệ duyệt qua đồ thị bản dựng tĩnh từ `dist/entry.js` và `dist/cli/run-main.js`, rồi báo lỗi nếu đồ thị khởi động trước khi điều phối đó nhập tĩnh bất kỳ gói bên ngoài nào (Commander, giao diện lời nhắc, undici, ghi nhật ký và các phần phụ thuộc tương tự làm nặng quá trình khởi động đều được tính) trước khi điều phối lệnh; cơ chế này cũng giới hạn đoạn chạy Gateway đã đóng gói ở 70 KB và từ chối các lệnh nhập tĩnh từ những đường dẫn Gateway ít dùng đã biết (`control-ui-assets`, `diagnostic-stability-bundle`, `onboard-helpers`, `process-respawn`, `restart-sentinel`, `server-close`, `server-reload-handlers`) vào đoạn đó. `scripts/release-check.ts` kiểm thử nhanh riêng CLI đã đóng gói bằng `--help`, `onboard --help`, `doctor --help`, `status --json --timeout 1`, `config schema` và `models list --provider openai`.
- Khả năng tương thích cũ của Package Acceptance được giới hạn ở `2026.4.25` (bao gồm `2026.4.25-beta.*`). Cho đến mốc giới hạn đó, bộ khung chỉ chấp nhận các thiếu sót siêu dữ liệu của gói đã phát hành: thiếu các mục kho kiểm kê QA riêng tư, thiếu `gateway install --wrapper`, thiếu các tệp bản vá trong fixture git bắt nguồn từ tarball, thiếu `update.channel` được lưu bền vững, vị trí bản ghi cài đặt Plugin cũ, thiếu khả năng lưu bền vững bản ghi cài đặt marketplace và di chuyển siêu dữ liệu cấu hình trong `plugins update`. Đối với các gói sau `2026.4.25`, những đường dẫn này sẽ gây lỗi nghiêm ngặt.
- Trình chạy kiểm thử nhanh container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:release-user-journey`, `test:docker:release-typed-onboarding`, `test:docker:release-media-memory`, `test:docker:release-upgrade-user-journey`, `test:docker:release-plugin-marketplace`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:agent-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` và `test:docker:config-reload` khởi động một hoặc nhiều container thực và xác minh các đường dẫn tích hợp cấp cao hơn.
- Các lane Docker/Bash E2E cài đặt tarball OpenClaw đã đóng gói thông qua `scripts/lib/openclaw-e2e-instance.sh` giới hạn `npm install` ở `OPENCLAW_E2E_NPM_INSTALL_TIMEOUT` (mặc định `600s`; đặt `0` để tắt trình bao bọc khi gỡ lỗi).

Các trình chạy Docker mô hình trực tiếp cũng chỉ gắn kết các thư mục chính xác thực CLI cần thiết
(hoặc tất cả các thư mục được hỗ trợ khi lần chạy không bị thu hẹp), sau đó sao chép chúng vào thư mục chính
của container trước khi chạy để OAuth của CLI bên ngoài có thể làm mới token
mà không sửa đổi kho xác thực trên máy chủ:

- Mô hình trực tiếp: `pnpm test:docker:live-models` (tập lệnh: `scripts/test-live-models-docker.sh`)
- Kiểm thử nhanh liên kết ACP: `pnpm test:docker:live-acp-bind` (tập lệnh: `scripts/test-live-acp-bind-docker.sh`; bao phủ Claude, Codex và Gemini theo mặc định, với phạm vi bao phủ Droid/OpenCode nghiêm ngặt qua `pnpm test:docker:live-acp-bind:droid` và `pnpm test:docker:live-acp-bind:opencode`)
- Kiểm thử nhanh backend CLI: `pnpm test:docker:live-cli-backend` (tập lệnh: `scripts/test-live-cli-backend-docker.sh`)
- Kiểm thử nhanh bộ khung app-server Codex: `pnpm test:docker:live-codex-harness` (tập lệnh: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + tác nhân phát triển: `pnpm test:docker:live-gateway` (tập lệnh: `scripts/test-live-gateway-models-docker.sh`)
- Kiểm thử nhanh khả năng quan sát: `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` và `pnpm qa:observability:smoke` là các lane kiểm xuất mã nguồn QA riêng tư. Theo chủ ý, chúng không thuộc các lane phát hành Docker của gói vì tarball npm không bao gồm QA Lab.
- Kiểm thử nhanh trực tiếp Open WebUI: `pnpm test:docker:openwebui` (tập lệnh: `scripts/e2e/openwebui-docker.sh`)
- Trình hướng dẫn nhập môn (TTY, dựng khung đầy đủ): `pnpm test:docker:onboard` (tập lệnh: `scripts/e2e/onboard-docker.sh`)
- Kiểm thử nhanh tarball npm về nhập môn/kênh/tác nhân: `pnpm test:docker:npm-onboard-channel-agent` cài đặt toàn cục tarball OpenClaw đã đóng gói trong Docker, cấu hình OpenAI thông qua quy trình nhập môn tham chiếu biến môi trường cùng với Telegram theo mặc định, chạy doctor và chạy một lượt tác nhân OpenAI mô phỏng. Tái sử dụng tarball đã xây dựng sẵn bằng `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua việc xây dựng lại trên máy chủ bằng `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, hoặc chuyển kênh bằng `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` hoặc `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.

- Kiểm thử khói hành trình người dùng bản phát hành: `pnpm test:docker:release-user-journey` cài đặt toàn cục tarball OpenClaw đã đóng gói trong thư mục home Docker sạch, chạy quy trình thiết lập ban đầu, cấu hình nhà cung cấp OpenAI mô phỏng, chạy một lượt tác tử, cài đặt/gỡ cài đặt các plugin bên ngoài, cấu hình ClickClack với một fixture cục bộ, xác minh nhắn tin đi/đến, khởi động lại Gateway và chạy doctor.
- Kiểm thử khói quy trình thiết lập ban đầu có định kiểu của bản phát hành: `pnpm test:docker:release-typed-onboarding` cài đặt tarball đã đóng gói, điều khiển `openclaw onboard` qua TTY thực, cấu hình OpenAI làm nhà cung cấp tham chiếu biến môi trường, xác minh khóa thô không được lưu bền vững và chạy một lượt tác tử mô phỏng.
- Kiểm thử khói phương tiện/bộ nhớ của bản phát hành: `pnpm test:docker:release-media-memory` cài đặt tarball đã đóng gói, xác minh khả năng hiểu hình ảnh từ tệp PNG đính kèm, đầu ra tạo ảnh tương thích với OpenAI, khả năng truy hồi của tìm kiếm bộ nhớ và khả năng truy hồi vẫn tồn tại sau khi khởi động lại Gateway.
- Kiểm thử khói hành trình người dùng nâng cấp bản phát hành: `pnpm test:docker:release-upgrade-user-journey` mặc định cài đặt bản cơ sở mới nhất đã phát hành nhưng cũ hơn tarball ứng viên, cấu hình trạng thái nhà cung cấp/plugin/ClickClack trên gói đã phát hành, nâng cấp lên tarball ứng viên, rồi chạy lại hành trình tác tử/plugin/kênh cốt lõi. Nếu không có bản cơ sở đã phát hành nào cũ hơn, kiểm thử sẽ sử dụng lại phiên bản ứng viên. Ghi đè bản cơ sở bằng `OPENCLAW_RELEASE_UPGRADE_BASELINE_SPEC=openclaw@<version>`.
- Kiểm thử khói chợ plugin của bản phát hành: `pnpm test:docker:release-plugin-marketplace` cài đặt từ một chợ fixture cục bộ, cập nhật plugin đã cài đặt, gỡ cài đặt plugin đó và xác minh CLI của plugin biến mất cùng với siêu dữ liệu cài đặt được loại bỏ.
- Kiểm thử khói cài đặt Skill: `pnpm test:docker:skill-install` cài đặt toàn cục tarball OpenClaw đã đóng gói trong Docker, vô hiệu hóa cài đặt kho lưu trữ đã tải lên trong cấu hình, phân giải slug skill ClawHub trực tiếp hiện tại từ tìm kiếm, cài đặt bằng `openclaw skills install`, rồi xác minh skill đã cài đặt cùng siêu dữ liệu nguồn/khóa `.clawhub`.
- Kiểm thử khói chuyển đổi kênh cập nhật: `pnpm test:docker:update-channel-switch` cài đặt toàn cục tarball OpenClaw đã đóng gói trong Docker, chuyển từ gói `stable` sang git `dev`, xác minh kênh được lưu bền vững và hoạt động sau cập nhật của plugin, rồi chuyển lại sang gói `stable` và kiểm tra trạng thái cập nhật.
- Kiểm thử khói khả năng tồn tại sau nâng cấp: `pnpm test:docker:upgrade-survivor` cài đặt tarball OpenClaw đã đóng gói đè lên một fixture người dùng cũ chưa sạch có các tác tử, cấu hình kênh, danh sách cho phép plugin, trạng thái phần phụ thuộc plugin cũ và các tệp workspace/phiên hiện có. Kiểm thử chạy cập nhật gói cùng doctor không tương tác mà không có khóa nhà cung cấp hoặc kênh trực tiếp, sau đó khởi động một Gateway loopback và kiểm tra việc bảo toàn cấu hình/trạng thái cùng các ngân sách khởi động/trạng thái.
- Kiểm thử khói khả năng tồn tại sau nâng cấp từ bản đã phát hành: `pnpm test:docker:published-upgrade-survivor` mặc định cài đặt `openclaw@latest`, tạo dữ liệu ban đầu cho các tệp người dùng hiện có thực tế, cấu hình bản cơ sở đó bằng một công thức lệnh tích hợp sẵn, xác thực cấu hình thu được, cập nhật bản cài đặt đã phát hành đó lên tarball ứng viên, chạy doctor không tương tác, ghi `.artifacts/upgrade-survivor/summary.json`, sau đó khởi động một Gateway loopback và kiểm tra các ý định đã cấu hình, việc bảo toàn trạng thái, khởi động, `/healthz`, `/readyz` và các ngân sách trạng thái RPC. Ghi đè một bản cơ sở bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, yêu cầu bộ lập lịch tổng hợp mở rộng các bản cơ sở cục bộ chính xác bằng `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, chẳng hạn như `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, và mở rộng các fixture có dạng sự cố bằng `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, chẳng hạn như `reported-issues`; tập sự cố đã báo cáo bao gồm `configured-plugin-installs` để tự động sửa chữa việc cài đặt plugin OpenClaw bên ngoài. Package Acceptance cung cấp các mục đó dưới dạng `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` và `published_upgrade_survivor_scenarios`, phân giải các token bản cơ sở meta như `last-stable-4` hoặc `all-since-2026.4.23`, còn Full Release Validation mở rộng cổng gói kiểm thử ngâm bản phát hành thành `last-stable-4 2026.4.23 2026.5.2 2026.4.15` cùng `reported-issues`.
- Kiểm thử khói ngữ cảnh thời gian chạy của phiên: `pnpm test:docker:session-runtime-context` xác minh việc lưu bền vững bản ghi ngữ cảnh thời gian chạy ẩn cùng khả năng sửa chữa bằng doctor đối với các nhánh ghi lại prompt bị trùng lặp chịu ảnh hưởng.
- Kiểm thử khói cài đặt toàn cục bằng Bun: `bash scripts/e2e/bun-global-install-smoke.sh` đóng gói cây hiện tại, cài đặt bằng `bun install -g` trong một thư mục home cô lập và xác minh `openclaw infer image providers --json` trả về các nhà cung cấp hình ảnh đi kèm thay vì bị treo. Sử dụng lại tarball dựng sẵn bằng `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, bỏ qua bước dựng trên máy chủ bằng `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, hoặc sao chép `dist/` từ một ảnh Docker đã dựng bằng `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Kiểm thử khói Docker của trình cài đặt: `bash scripts/test-install-sh-docker.sh` chia sẻ một bộ nhớ đệm npm giữa các container root, cập nhật và direct-npm. Kiểm thử khói cập nhật mặc định dùng npm `latest` làm bản cơ sở ổn định trước khi nâng cấp lên tarball ứng viên. Ghi đè cục bộ bằng `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22`, hoặc bằng đầu vào `update_baseline_version` của workflow Install Smoke trên GitHub. Các kiểm tra trình cài đặt không phải root giữ một bộ nhớ đệm npm cô lập để các mục bộ nhớ đệm do root sở hữu không che khuất hành vi cài đặt cục bộ của người dùng. Đặt `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` để sử dụng lại bộ nhớ đệm root/cập nhật/direct-npm giữa các lần chạy lại cục bộ.
- Pipeline CI Install Smoke bỏ qua lần cập nhật toàn cục direct-npm trùng lặp bằng `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; chạy tập lệnh cục bộ mà không có biến môi trường đó khi cần phạm vi kiểm thử trực tiếp `npm install -g`.
- Kiểm thử khói CLI xóa workspace dùng chung của tác tử: `pnpm test:docker:agents-delete-shared-workspace` (tập lệnh: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) mặc định dựng ảnh Dockerfile gốc, tạo dữ liệu ban đầu cho hai tác tử dùng chung một workspace trong thư mục home container cô lập, chạy `agents delete --json` và xác minh JSON hợp lệ cùng hành vi giữ lại workspace. Sử dụng lại ảnh install-smoke bằng `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Mạng Gateway và vòng đời máy chủ: `pnpm test:docker:gateway-network` (tập lệnh: `scripts/e2e/gateway-network-docker.sh`) duy trì kiểm thử khói xác thực/tình trạng WebSocket LAN hai container, sau đó dùng Admin HTTP loopback để chứng minh hàng rào chuẩn bị, quyền truy cập kiểm soát được giữ lại, khả năng phục hồi khi tiếp tục và thao tác dừng/khởi động đã chuẩn bị trong cùng container. Kiểm tra khởi động lại phải hoàn tất trước khi lease ban đầu hết hạn, xác minh trạng thái tạm ngưng chỉ cục bộ trong tiến trình trong khi cấu hình Gateway được lưu bền vững và danh tính container vẫn tồn tại, đồng thời xuất JSON thời gian từng giai đoạn có thể đọc bằng máy.
- Kiểm thử khói snapshot CDP của trình duyệt: `pnpm test:docker:browser-cdp-snapshot` (tập lệnh: `scripts/e2e/browser-cdp-snapshot-docker.sh`) dựng ảnh E2E nguồn cùng một lớp Chromium, khởi động Chromium bằng CDP thô, chạy `browser doctor --deep` và xác minh các snapshot vai trò CDP bao phủ URL liên kết, các phần tử có thể nhấp được nâng cấp từ con trỏ, tham chiếu iframe và siêu dữ liệu frame.
- Hồi quy suy luận tối thiểu của web_search trong OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (tập lệnh: `scripts/e2e/openai-web-search-minimal-docker.sh`) chạy một máy chủ OpenAI mô phỏng thông qua Gateway, xác minh `web_search` nâng `reasoning.effort` từ `minimal` lên `low`, sau đó buộc schema nhà cung cấp từ chối và kiểm tra chi tiết thô xuất hiện trong nhật ký Gateway.
- Cầu nối kênh MCP (Gateway được tạo dữ liệu ban đầu + cầu nối stdio + kiểm thử khói frame thông báo Claude thô): `pnpm test:docker:mcp-channels` (tập lệnh: `scripts/e2e/mcp-channels-docker.sh`)
- Công cụ MCP trong bundle OpenClaw (máy chủ MCP stdio thực + kiểm thử khói cho phép/từ chối của hồ sơ OpenClaw nhúng): `pnpm test:docker:agent-bundle-mcp-tools` (tập lệnh: `scripts/e2e/agent-bundle-mcp-tools-docker.sh`)
- Dọn dẹp MCP của Cron/tác tử phụ (Gateway thực + hủy tiến trình con MCP stdio sau các lượt Cron cô lập và tác tử phụ chạy một lần): `pnpm test:docker:cron-mcp-cleanup` (tập lệnh: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (kiểm thử khói cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với các phần phụ thuộc được nâng cấp lên cấp trên, siêu dữ liệu gói npm sai định dạng, tham chiếu git di chuyển, bộ tổng hợp ClawHub, cập nhật chợ và bật/kiểm tra bundle Claude): `pnpm test:docker:plugins` (tập lệnh: `scripts/e2e/plugins-docker.sh`)
  Đặt `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` để bỏ qua khối ClawHub, hoặc ghi đè cặp gói/thời gian chạy tổng hợp mặc định bằng `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` và `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Khi không có `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, kiểm thử sử dụng một máy chủ fixture ClawHub cục bộ khép kín.
- Kiểm thử khói cập nhật plugin không thay đổi: `pnpm test:docker:plugin-update` (tập lệnh: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Kiểm thử khói ma trận vòng đời plugin: `pnpm test:docker:plugin-lifecycle-matrix` cài đặt tarball OpenClaw đã đóng gói trong một container tối giản, cài đặt một plugin npm, chuyển đổi bật/tắt, nâng cấp và hạ cấp plugin qua một registry npm cục bộ, xóa mã đã cài đặt, sau đó xác minh thao tác gỡ cài đặt vẫn xóa trạng thái cũ trong khi ghi nhật ký các chỉ số RSS/CPU cho từng giai đoạn vòng đời.
- Kiểm thử khói siêu dữ liệu tải lại cấu hình: `pnpm test:docker:config-reload` (tập lệnh: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` bao phủ kiểm thử khói cài đặt/cập nhật cho đường dẫn cục bộ, `file:`, registry npm với các phần phụ thuộc được nâng cấp lên cấp trên, tham chiếu git di chuyển, fixture ClawHub, cập nhật chợ và bật/kiểm tra bundle Claude. `pnpm test:docker:plugin-update` bao phủ hành vi cập nhật không thay đổi cho các plugin đã cài đặt. `pnpm test:docker:plugin-lifecycle-matrix` bao phủ việc cài đặt, bật, tắt, nâng cấp, hạ cấp plugin npm có theo dõi tài nguyên và gỡ cài đặt khi thiếu mã.

Để dựng trước và sử dụng lại ảnh chức năng dùng chung theo cách thủ công:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Các giá trị ghi đè ảnh dành riêng cho bộ kiểm thử như `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` vẫn được ưu tiên khi thiết lập. Khi `OPENCLAW_SKIP_DOCKER_BUILD=1` trỏ tới một ảnh dùng chung từ xa, các tập lệnh sẽ kéo ảnh đó nếu ảnh chưa có cục bộ. Các kiểm thử Docker QR và trình cài đặt giữ Dockerfile riêng vì chúng xác thực hành vi gói/cài đặt thay vì thời gian chạy ứng dụng đã dựng dùng chung.

Các trình chạy Docker mô hình trực tiếp cũng gắn kết checkout hiện tại ở chế độ chỉ đọc
và đưa nó vào một thư mục làm việc tạm thời bên trong container. Điều này giữ cho
ảnh thời gian chạy gọn nhẹ trong khi vẫn chạy Vitest với chính xác
nguồn/cấu hình cục bộ của bạn. Bước chuẩn bị bỏ qua các bộ nhớ đệm lớn chỉ có cục bộ và đầu ra dựng ứng dụng
như `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` và
các thư mục đầu ra `.build` cục bộ của ứng dụng hoặc Gradle để các lượt chạy trực tiếp bằng Docker không
mất nhiều phút sao chép các artifact dành riêng cho máy. Chúng cũng đặt
`OPENCLAW_SKIP_CHANNELS=1` để các phép dò Gateway trực tiếp không khởi động các worker kênh
Telegram/Discord/v.v. thực bên trong container.
`test:docker:live-models` vẫn chạy `pnpm test:live`, vì vậy hãy truyền cả
`OPENCLAW_LIVE_GATEWAY_*` khi cần thu hẹp hoặc loại trừ phạm vi kiểm thử Gateway
trực tiếp khỏi lane Docker đó.

`test:docker:openwebui` là kiểm thử khói tương thích cấp cao hơn: kiểm thử khởi động một
container Gateway OpenClaw có bật các endpoint HTTP tương thích với OpenAI,
khởi động một container Open WebUI được ghim phiên bản kết nối với Gateway đó, đăng nhập qua
Open WebUI, xác minh `/api/models` cung cấp `openclaw/default`, sau đó gửi một
yêu cầu trò chuyện thực qua proxy `/api/chat/completions` của Open WebUI. Đặt
`OPENWEBUI_SMOKE_MODE=models` cho các kiểm tra CI theo đường dẫn phát hành cần dừng
sau khi đăng nhập Open WebUI và khám phá mô hình, không chờ mô hình trực tiếp
hoàn tất. Lần chạy đầu tiên có thể chậm hơn đáng kể vì Docker có thể cần
kéo ảnh Open WebUI và Open WebUI có thể cần hoàn tất
quy trình thiết lập khởi động nguội riêng. Lane này yêu cầu một khóa mô hình trực tiếp khả dụng, được cung cấp qua
môi trường tiến trình, các hồ sơ xác thực đã chuẩn bị hoặc một
`OPENCLAW_PROFILE_FILE` tường minh. Các lượt chạy thành công in ra một tải JSON nhỏ như
`{ "ok": true, "model": "openclaw/default", ... }`.

`test:docker:mcp-channels` được thiết kế có chủ ý để mang tính xác định và không cần
tài khoản Telegram, Discord hoặc iMessage thực. Kiểm thử khởi động một container Gateway
được tạo dữ liệu ban đầu, khởi động một container thứ hai để tạo `openclaw mcp serve`, sau đó
xác minh khám phá cuộc hội thoại được định tuyến, đọc bản ghi, siêu dữ liệu
tệp đính kèm, hành vi hàng đợi sự kiện trực tiếp, định tuyến gửi đi và các thông báo
kênh + quyền theo kiểu Claude qua cầu nối MCP stdio thực. Bước kiểm tra
thông báo kiểm tra trực tiếp các frame MCP stdio thô để kiểm thử khói
xác thực nội dung mà cầu nối thực sự phát ra, không chỉ nội dung mà một SDK máy khách cụ thể
tình cờ hiển thị.

`test:docker:agent-bundle-mcp-tools` có tính xác định và không cần
khóa mô hình trực tiếp. Quy trình này dựng image Docker của repo, khởi động một máy chủ thăm dò MCP stdio thực
bên trong container, hiện thực hóa máy chủ đó thông qua runtime MCP trong gói OpenClaw
được nhúng, thực thi công cụ, rồi xác minh
`coding` và `messaging` giữ lại các công cụ `bundle-mcp` trong khi `minimal` và
`tools.deny: ["bundle-mcp"]` lọc chúng.

`test:docker:cron-mcp-cleanup` có tính xác định và không cần khóa
mô hình trực tiếp. Quy trình này khởi động một Gateway đã được tạo dữ liệu hạt giống với một máy chủ thăm dò MCP stdio thực,
chạy một lượt cron cô lập và một lượt con dùng một lần `sessions_spawn`, rồi
xác minh tiến trình con MCP thoát sau mỗi lần chạy.

Kiểm tra nhanh thủ công luồng ACP bằng ngôn ngữ tự nhiên (không thuộc CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Giữ lại script này cho các quy trình hồi quy/gỡ lỗi. Script có thể lại cần thiết để xác thực định tuyến luồng ACP, vì vậy không được xóa.

Các biến môi trường hữu ích:

- `OPENCLAW_CONFIG_DIR=...` (mặc định: `~/.openclaw`) được gắn vào `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (mặc định: `~/.openclaw/workspace`) được gắn vào `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` được gắn và nạp trước khi chạy kiểm thử
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` để chỉ xác minh các biến môi trường được nạp từ `OPENCLAW_PROFILE_FILE`, sử dụng các thư mục cấu hình/không gian làm việc tạm thời và không gắn thông tin xác thực CLI bên ngoài
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (mặc định: `~/.cache/openclaw/docker-cli-tools`, trừ khi lần chạy đã sử dụng một thư mục bind của CI/được quản lý) được gắn vào `/home/node/.npm-global` để lưu bộ nhớ đệm các bản cài đặt CLI bên trong Docker
- Các thư mục/tệp xác thực CLI bên ngoài trong `$HOME` được gắn ở chế độ chỉ đọc trong `/host-auth...`, rồi được sao chép vào `/home/node/...` trước khi bắt đầu kiểm thử
  - Các thư mục mặc định (được dùng khi lần chạy không được thu hẹp cho các nhà cung cấp cụ thể): `.factory`, `.gemini`, `.minimax`
  - Các tệp mặc định: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Các lần chạy được thu hẹp theo nhà cung cấp chỉ gắn những thư mục/tệp cần thiết được suy ra từ `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ghi đè thủ công bằng `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, hoặc một danh sách phân tách bằng dấu phẩy như `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` để thu hẹp lần chạy
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` để lọc các nhà cung cấp trong container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` để tái sử dụng image `openclaw:local-live` hiện có cho các lần chạy lại không cần dựng lại
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` để đảm bảo thông tin xác thực đến từ kho hồ sơ (không phải từ môi trường)
- `OPENCLAW_OPENWEBUI_MODEL=...` để chọn mô hình do Gateway cung cấp cho kiểm tra nhanh Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` để ghi đè lời nhắc kiểm tra nonce được kiểm tra nhanh Open WebUI sử dụng
- `OPENWEBUI_IMAGE=...` để ghi đè thẻ image Open WebUI được ghim

## Kiểm tra tính hợp lệ của tài liệu

Chạy kiểm tra tài liệu sau khi chỉnh sửa tài liệu: `pnpm check:docs`.
Chạy xác thực anchor Mintlify đầy đủ khi cũng cần kiểm tra các tiêu đề trong trang: `pnpm docs:check-links:anchors`.

## Hồi quy ngoại tuyến (an toàn cho CI)

Đây là các hồi quy của "pipeline thực" không dùng nhà cung cấp thực:

- Gọi công cụ qua Gateway (OpenAI mô phỏng, Gateway thực + vòng lặp tác tử): `src/gateway/gateway.test.ts` (trường hợp: "chạy toàn trình một lệnh gọi công cụ OpenAI mô phỏng qua vòng lặp tác tử của Gateway")
- Trình hướng dẫn Gateway (WS `wizard.start`/`wizard.next`, ghi cấu hình + bắt buộc xác thực): `src/gateway/gateway.test.ts` (trường hợp: "chạy trình hướng dẫn qua ws và ghi cấu hình token xác thực")

## Đánh giá độ tin cậy của tác tử (Skills)

Hiện đã có một số kiểm thử an toàn cho CI hoạt động như các "đánh giá độ tin cậy của tác tử":

- Gọi công cụ mô phỏng thông qua Gateway thực + vòng lặp tác tử (`src/gateway/gateway.test.ts`).
- Các luồng trình hướng dẫn toàn trình xác thực kết nối phiên và tác động của cấu hình (`src/gateway/gateway.test.ts`).

Những phần vẫn còn thiếu cho Skills (xem [Skills](/vi/tools/skills)):

- **Ra quyết định:** khi Skills được liệt kê trong lời nhắc, tác tử có chọn đúng Skill (hoặc tránh những Skill không liên quan) không?
- **Tuân thủ:** tác tử có đọc `SKILL.md` trước khi sử dụng và tuân theo các bước/đối số bắt buộc không?
- **Hợp đồng quy trình:** các kịch bản nhiều lượt xác nhận thứ tự công cụ, việc duy trì lịch sử phiên và ranh giới sandbox.

Các đánh giá trong tương lai trước hết nên duy trì tính xác định:

- Một trình chạy kịch bản sử dụng các nhà cung cấp mô phỏng để xác nhận lệnh gọi công cụ + thứ tự, việc đọc tệp Skill và kết nối phiên.
- Một bộ nhỏ các kịch bản tập trung vào Skill (sử dụng so với tránh, kiểm soát điều kiện, chèn lời nhắc).
- Chỉ thêm các đánh giá trực tiếp tùy chọn (chủ động bật, được kiểm soát bằng biến môi trường) sau khi đã có bộ kiểm thử an toàn cho CI.

## Kiểm thử hợp đồng (cấu trúc Plugin và kênh)

Kiểm thử hợp đồng xác minh rằng mọi Plugin và kênh đã đăng ký đều tuân thủ
hợp đồng giao diện tương ứng. Các kiểm thử này duyệt qua tất cả Plugin được phát hiện và chạy một
bộ xác nhận về cấu trúc và hành vi. Lane đơn vị `pnpm test` mặc định
cố ý bỏ qua các tệp đường nối dùng chung và kiểm tra nhanh này; hãy chạy rõ ràng các lệnh
hợp đồng khi thay đổi các bề mặt kênh hoặc nhà cung cấp dùng chung.

### Lệnh

- Tất cả hợp đồng: `pnpm test:contracts`
- Chỉ hợp đồng kênh: `pnpm test:contracts:channels`
- Chỉ hợp đồng nhà cung cấp: `pnpm test:contracts:plugins`

### Hợp đồng kênh

Nằm trong `src/channels/plugins/contracts/*.contract.test.ts`. Các
danh mục cấp cao nhất hiện tại:

- **channel-catalog** - siêu dữ liệu mục danh mục kênh đi kèm/sổ đăng ký
- **plugin** (dựa trên sổ đăng ký, được phân mảnh) - cấu trúc đăng ký Plugin cơ bản
- **surfaces-only** (dựa trên sổ đăng ký, được phân mảnh) - kiểm tra cấu trúc theo từng bề mặt cho `actions`, `setup`, `status`, `outbound`, `messaging`, `threading`, `directory` và `gateway`
- **session-binding** (dựa trên sổ đăng ký) - hành vi liên kết phiên
- **outbound-payload** - cấu trúc và chuẩn hóa payload tin nhắn
- **group-policy** (dự phòng) - thực thi chính sách nhóm mặc định theo từng kênh
- **threading** (dựa trên sổ đăng ký, được phân mảnh) - xử lý mã định danh luồng
- **directory** (dựa trên sổ đăng ký, được phân mảnh) - API thư mục/danh sách thành viên
- **registry** và **plugins-core.\*** - nội bộ của sổ đăng ký Plugin kênh, trình tải và cơ chế cấp quyền ghi cấu hình

Các trình trợ giúp harness thu thập điều phối đầu vào và payload đầu ra được các
bộ kiểm thử này sử dụng được cung cấp nội bộ thông qua `src/plugin-sdk/channel-contract-testing.ts`
(không được đưa vào npm, không phải đường dẫn con SDK công khai); không có tệp
`inbound.contract.test.ts` độc lập trong thư mục này.

### Hợp đồng nhà cung cấp

Nằm trong `src/plugins/contracts/*.contract.test.ts`. Các danh mục hiện tại
bao gồm:

- **shape** - cấu trúc manifest, API và nội dung xuất runtime của Plugin
- **plugin-registration** (+ song song) - các trường hợp đăng ký manifest
- **package-manifest** - các yêu cầu đối với manifest gói
- **loader** - hành vi thiết lập/dọn dẹp trình tải Plugin
- **registry** - nội dung và tra cứu sổ đăng ký hợp đồng Plugin
- **providers** - hành vi nhà cung cấp dùng chung giữa các nhà cung cấp đi kèm, cộng với các nhà cung cấp tìm kiếm web
- **auth-choice** - siêu dữ liệu lựa chọn xác thực và hành vi thiết lập
- **provider-catalog-deprecation** - siêu dữ liệu danh mục nhà cung cấp đã lỗi thời
- **wizard.choice-resolution**, **wizard.model-picker**, **wizard.setup-options** - hợp đồng trình hướng dẫn thiết lập nhà cung cấp
- **embedding-provider**, **memory-embedding-provider**, **web-fetch-provider**, **tts** - hợp đồng nhà cung cấp dành riêng cho từng khả năng
- **session-actions**, **session-attachments**, **session-entry-projection** - hợp đồng trạng thái phiên do Plugin sở hữu
- **scheduled-turns** - siêu dữ liệu lượt chạy theo lịch và giới hạn dấu thời gian của Plugin
- **host-hooks**, **run-context-lifecycle**, **runtime-import-side-effects**, **runtime-seams** - hợp đồng vòng đời máy chủ/runtime và ranh giới nhập của Plugin
- **extension-runtime-dependencies** - vị trí đặt phần phụ thuộc runtime cho các tiện ích mở rộng

### Khi nào cần chạy

- Sau khi thay đổi nội dung xuất hoặc đường dẫn con của plugin-sdk
- Sau khi thêm hoặc sửa đổi Plugin kênh hoặc nhà cung cấp
- Sau khi tái cấu trúc việc đăng ký hoặc khám phá Plugin

Kiểm thử hợp đồng chạy trong CI và không yêu cầu khóa API thực.

## Thêm kiểm thử hồi quy (hướng dẫn)

Khi khắc phục sự cố nhà cung cấp/mô hình được phát hiện trong môi trường trực tiếp:

- Thêm một kiểm thử hồi quy an toàn cho CI nếu có thể (nhà cung cấp mô phỏng/stub hoặc thu thập chính xác phép biến đổi cấu trúc yêu cầu)
- Nếu về bản chất chỉ có thể kiểm thử trực tiếp (giới hạn tốc độ, chính sách xác thực), hãy giữ kiểm thử trực tiếp trong phạm vi hẹp và cho phép chủ động bật qua biến môi trường
- Ưu tiên nhắm vào lớp nhỏ nhất có thể bắt được lỗi:
  - lỗi chuyển đổi/phát lại yêu cầu của nhà cung cấp -> kiểm thử mô hình trực tiếp
  - lỗi pipeline phiên/lịch sử/công cụ của Gateway -> kiểm tra nhanh Gateway trực tiếp hoặc kiểm thử mô phỏng Gateway an toàn cho CI
- Cơ chế bảo vệ duyệt SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` suy ra một mục tiêu mẫu cho mỗi lớp SecretRef từ siêu dữ liệu sổ đăng ký (`listSecretTargetRegistryEntries()`), rồi xác nhận rằng các mã định danh thực thi có phân đoạn duyệt bị từ chối.
  - Nếu thêm một họ mục tiêu SecretRef `includeInPlan` mới trong `src/secrets/target-registry-data.ts`, hãy cập nhật `classifyTargetClass` trong kiểm thử đó. Kiểm thử cố ý thất bại với các mã định danh mục tiêu chưa được phân loại để không thể âm thầm bỏ qua các lớp mới.

## Liên quan

- [Kiểm thử trực tiếp](/vi/help/testing-live)
- [Kiểm thử bản cập nhật và Plugin](/vi/help/testing-updates-plugins)
- [CI](/vi/ci)
