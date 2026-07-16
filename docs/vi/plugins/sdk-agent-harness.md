---
read_when:
    - Bạn đang thay đổi runtime agent nhúng hoặc registry của bộ khung thực thi
    - Bạn đang đăng ký một bộ khung tác tử từ một plugin đi kèm hoặc đáng tin cậy
    - Bạn cần hiểu Plugin Codex liên quan như thế nào đến các nhà cung cấp mô hình
sidebarTitle: Agent Harness
summary: Bề mặt SDK thử nghiệm dành cho các plugin thay thế trình thực thi tác tử nhúng cấp thấp
title: Plugin bộ khung tác tử
x-i18n:
    generated_at: "2026-07-16T15:41:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 862d53022e48b93c98e98162f76460433b76005cba3188342d0977b951044106
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**agent harness** là trình thực thi cấp thấp cho một lượt agent OpenClaw đã được
chuẩn bị. Đây không phải là nhà cung cấp mô hình, không phải là kênh và cũng không phải là
sổ đăng ký công cụ. Để hiểu mô hình khái niệm dành cho người dùng, hãy xem [Môi trường chạy agent](/vi/concepts/agent-runtimes).

Chỉ sử dụng bề mặt này cho các plugin gốc được đóng gói hoặc đáng tin cậy. Hợp đồng này
vẫn đang trong giai đoạn thử nghiệm vì các kiểu tham số được chủ ý mô phỏng theo
trình chạy nhúng hiện tại.

## Khi nào nên sử dụng harness

Đăng ký agent harness khi một họ mô hình có môi trường chạy phiên gốc
riêng và phương thức truyền tải nhà cung cấp thông thường của OpenClaw là lớp trừu tượng không phù hợp:

- một máy chủ agent lập trình gốc sở hữu các luồng và Compaction
- một CLI hoặc daemon cục bộ phải truyền phát các sự kiện kế hoạch/lập luận/công cụ gốc
- một môi trường chạy mô hình cần mã định danh tiếp tục riêng ngoài bản chép lại phiên
  OpenClaw

**Không** đăng ký harness chỉ để thêm một API LLM mới. Đối với các API mô hình HTTP hoặc
WebSocket thông thường, hãy xây dựng [plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins).

## Những gì lõi vẫn sở hữu

Trước khi một harness được chọn, OpenClaw đã phân giải:

- nhà cung cấp và mô hình
- trạng thái xác thực môi trường chạy, trừ khi harness khai báo rằng nó sở hữu quá trình khởi tạo xác thực
- mức độ suy luận và ngân sách ngữ cảnh
- tệp bản chép lại/phiên OpenClaw
- không gian làm việc, sandbox và chính sách công cụ
- các hàm gọi lại phản hồi kênh và các hàm gọi lại truyền phát
- chính sách dự phòng mô hình và chuyển đổi mô hình trực tiếp

Một harness chạy một lần thử đã chuẩn bị; nó không chọn nhà cung cấp, thay thế việc
phân phối qua kênh hoặc âm thầm chuyển đổi mô hình.

### Khởi tạo xác thực do harness sở hữu

Theo mặc định, lõi phân giải thông tin xác thực của nhà cung cấp trước khi gọi harness. Một
harness đáng tin cậy có thể xác thực thông qua môi trường chạy gốc riêng của mình có thể đặt
`authBootstrap: "harness"` trên đăng ký `AgentHarness` tĩnh của nó. Khi đó, lõi
bỏ qua quá trình khởi tạo thông tin xác thực nhà cung cấp chung và lỗi thiếu thông tin xác thực
cho mọi lần thử do harness đó tiếp nhận.

Lõi vẫn chuyển tiếp một hồ sơ xác thực OpenClaw tương thích, được chọn rõ ràng hoặc sắp thứ tự,
cùng kho lưu trữ có phạm vi của hồ sơ đó khi tồn tại. Harness phải phân giải
hồ sơ đó hoặc thông tin xác thực gốc của nó trước khi gửi yêu cầu mô hình, giữ bí mật
trong phạm vi lần thử và đưa ra các lỗi xác thực có thể xử lý. Không
đặt khả năng này trên harness chỉ thỉnh thoảng sở hữu việc xác thực.

### Các tạo phẩm môi trường chạy thiết lập đã xác minh

Một harness cục bộ có thể cung cấp suy luận cho lần thiết lập đầu tiên phải chứng thực
phần triển khai đã hoàn tất phép thăm dò. Khi
`params.captureRuntimeArtifact` là true, hãy trả về một
`result.runtimeArtifact` bất định với mã định danh ổn định và dấu vân tay nội dung. Đăng ký một
khả năng `runtimeArtifact.validate(...)` tương ứng để kiểm tra lại liên kết đó
mà không tải một harness khác hoặc quét các plugin không liên quan.

Các lần tiếp tục OpenClaw đã xác minh cũng truyền `params.expectedRuntimeArtifact`.
Harness phải so sánh nó với đúng tiến trình gốc mà harness đã nhận và thất bại
trước khi bắt đầu hoặc tiếp tục một luồng gốc nếu chúng khác nhau. Các lượt agent
thông thường bỏ qua cả hai trường, vì vậy việc băm nội dung không nằm trên đường nóng của
yêu cầu thông thường. Các harness từ xa/WebSocket cần một hợp đồng chứng thực máy chủ trước khi
có thể tham gia; chỉ một chuỗi phiên bản không phải là danh tính tạo phẩm.

Lần thử đã chuẩn bị cũng bao gồm `params.runtimePlan`, một
gói chính sách do OpenClaw sở hữu dành cho các quyết định môi trường chạy phải được dùng chung giữa OpenClaw và
các harness gốc:

- `runtimePlan.tools.normalize(...)` và `runtimePlan.tools.logDiagnostics(...)`
  cho chính sách lược đồ công cụ nhận biết nhà cung cấp
- `runtimePlan.transcript.resolvePolicy(...)` cho việc làm sạch bản chép lại và
  chính sách sửa chữa lệnh gọi công cụ
- `runtimePlan.delivery.isSilentPayload(...)` cho `NO_REPLY` dùng chung và việc
  ngăn phân phối nội dung đa phương tiện
- `runtimePlan.outcome.classifyRunResult(...)` cho việc phân loại
  dự phòng mô hình
- `runtimePlan.observability` cho siêu dữ liệu nhà cung cấp/mô hình/harness đã phân giải

Harness có thể dùng kế hoạch cho các quyết định cần khớp với hành vi OpenClaw,
nhưng phải coi đó là trạng thái lần thử do máy chủ sở hữu: không sửa đổi nó hoặc dùng nó để chuyển đổi
nhà cung cấp/mô hình trong một lượt.

### Hợp đồng truyền tải yêu cầu

`supports(ctx)` nhận phương thức truyền tải mô hình đã phân giải trong `ctx.modelProvider`.
Hai dữ kiện không chứa bí mật do nhà cung cấp sở hữu mô tả tuyến đã chọn:

- `runtimePolicy.compatibleIds` liệt kê các mã định danh môi trường chạy mà nhà cung cấp khai báo
  là tương thích với tuyến cụ thể đó. Chính sách vắng mặt có nghĩa là nhà cung cấp
  không khai báo khả năng tương thích ở cấp tuyến; đó không phải là sự cho phép để giả định có hỗ trợ.
- `requestTransportOverrides: "none"` có nghĩa là không phải tái tạo bất kỳ ghi đè yêu cầu
  nhà cung cấp/mô hình nào do người dùng xác lập. `"present"` có nghĩa là tồn tại tiêu đề, phương thức
  truyền tải xác thực, proxy, TLS, hành vi dịch vụ cục bộ, mạng riêng hoặc tham số
  yêu cầu do người dùng xác lập. Dữ kiện này không làm lộ các giá trị đó.

Trả về `{ supported: false, reason }` khi harness không thể tái tạo
phương thức truyền tải đã chuẩn bị. Không suy luận khả năng hỗ trợ bằng cách đọc cấu hình thô sau khi chọn.
Khi quá trình chuẩn bị xác thực tạo ra nhiều tuyến thử lại, một harness phải hỗ trợ
tất cả các tuyến trước khi điều phối. Việc lựa chọn ngầm định dùng OpenClaw nếu không plugin nào có thể
sở hữu toàn bộ tập hợp; lựa chọn plugin rõ ràng hoặc được lưu bền vững sẽ thất bại theo hướng đóng.

## Đăng ký harness

**Nhập:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "effective route is not harness-compatible" };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

`authBootstrap` được chủ ý loại khỏi ví dụ chung này. Chỉ thêm
`authBootstrap: "harness"` khi harness đáp ứng hợp đồng nêu trên.

### Thực thi được ủy quyền

Chủ sở hữu harness có thể đặt `delegatedExecutionPluginIds` thành mã định danh của các
plugin đáng tin cậy cần thực thi một phiên hiện có đã khóa theo mô hình, chẳng hạn như một phương thức
truyền tải giọng nói tiếp tục cuộc hội thoại dựa trên Codex. Đây là sự đồng ý tĩnh của chủ sở hữu,
không phải danh sách cho phép của lõi. Hãy giữ phạm vi hẹp.

Bên được ủy quyền chỉ nhận quyền tiếp nhận công việc và thực thi nhúng. OpenClaw yêu cầu
chính xác khóa phiên, đường dẫn kho lưu trữ và mã định danh phiên đã lưu; `modelSelectionLocked:
true`; cùng các giá trị `agentHarnessId` và `agentHarnessRuntimeOverride` khớp nhau.
Sau đó, lần chạy được giới hạn phạm vi thông qua chủ sở hữu harness. Việc tạo, vá,
đặt lại, xóa, lưu trữ phiên và thay đổi Gateway vẫn chỉ dành cho chủ sở hữu.

## Chính sách lựa chọn

OpenClaw chọn harness sau khi phân giải nhà cung cấp/mô hình:

1. Chính sách môi trường chạy trong phạm vi mô hình được ưu tiên.
2. Tiếp theo là chính sách môi trường chạy trong phạm vi nhà cung cấp.
3. `auto` hỏi các harness đã đăng ký xem chúng có hỗ trợ tuyến hiệu dụng đã phân giải hay không.
   Chỉ riêng tiền tố nhà cung cấp/mô hình không bao giờ chọn harness.
4. Nếu không có harness đã đăng ký nào khớp, OpenClaw sử dụng môi trường chạy nhúng.

Lỗi của plugin harness được hiển thị dưới dạng lỗi lần chạy. Trong chế độ `auto`, phương án
dự phòng nhúng chỉ áp dụng khi không có plugin harness đã đăng ký nào hỗ trợ
nhà cung cấp/mô hình đã phân giải. Sau khi một plugin harness đã tiếp nhận lần chạy, OpenClaw không
phát lại cùng lượt đó thông qua môi trường chạy khác, vì điều này có thể thay đổi
ngữ nghĩa xác thực/môi trường chạy hoặc gây trùng lặp tác dụng phụ.

Chính sách môi trường chạy đã cấu hình vẫn là nguồn có thẩm quyền về môi trường chạy mong muốn. Một
`agentHarnessId` phiên được lưu bền vững giữ quyền sở hữu bản chép lại gốc của nó
trong khi quá trình chuẩn bị tuyến/xác thực vẫn đang chờ xử lý. Cả hai đều không làm cho một tuyến không tương thích
trở nên tương thích: khi có các dữ kiện đã chuẩn bị, harness được chọn hoặc ghim
phải hỗ trợ chúng, nếu không lần chạy sẽ thất bại theo hướng đóng. `/status` hiển thị môi trường chạy hiệu dụng
được chọn từ chính sách, quyền sở hữu được lưu bền vững và khả năng hỗ trợ tuyến.
Trạng thái chuẩn bị là tường minh: `runtimePolicy` bị thiếu vẫn ở trạng thái chưa khai báo thay vì
được suy luận từ bất kỳ trường truyền tải nào tình cờ hiện diện.
Khi xác thực do harness sở hữu để lại nhiều tuyến vật lý chưa được phân giải,
dữ kiện hỗ trợ đã chuẩn bị là giao của các mã định danh môi trường chạy tương thích của chúng và
báo cáo ghi đè yêu cầu nếu có bất kỳ ứng viên nào có ghi đè. Vì vậy, chỉ một ứng viên chưa khai báo
cũng khiến khả năng tương thích gốc trở thành rỗng; `preparedAuth.source: "harness"`
là chủ sở hữu xác thực, không phải sự cho phép để suy luận khả năng hỗ trợ tuyến.

Nếu harness được chọn gây bất ngờ, hãy bật ghi nhật ký gỡ lỗi `agents/harness`
và kiểm tra bản ghi `agent harness selected` có cấu trúc của Gateway: bản ghi này
bao gồm mã định danh harness đã chọn, lý do lựa chọn, chính sách môi trường chạy/dự phòng
và trong chế độ `auto`, kết quả hỗ trợ của từng ứng viên plugin.

Plugin Codex được đóng gói đăng ký `codex` làm mã định danh harness. Lõi coi đó
là một mã định danh plugin harness thông thường; các bí danh riêng cho Codex thuộc về plugin
hoặc cấu hình của người vận hành, không thuộc bộ chọn môi trường chạy dùng chung.

## Ghép cặp nhà cung cấp với harness

Hầu hết harness cũng nên đăng ký một nhà cung cấp. Nhà cung cấp làm cho tham chiếu mô hình,
trạng thái xác thực, siêu dữ liệu mô hình và lựa chọn `/model` hiển thị với phần còn lại của
OpenClaw. Sau đó harness tiếp nhận nhà cung cấp đó trong `supports(...)`.

Plugin Codex được đóng gói tuân theo mẫu này:

- tham chiếu mô hình ưu tiên của người dùng: `openai/gpt-5.6-sol`
- tham chiếu tương thích: các tham chiếu `codex/gpt-*` cũ vẫn được chấp nhận, nhưng cấu hình mới
  không nên dùng chúng làm tham chiếu nhà cung cấp/mô hình thông thường
- mã định danh harness: `codex`
- xác thực: tính khả dụng của nhà cung cấp tổng hợp, vì Codex harness sở hữu
  thông tin đăng nhập/phiên Codex gốc
- yêu cầu app-server: OpenClaw gửi mã định danh mô hình trần đến Codex và để
  harness giao tiếp với giao thức app-server gốc

Plugin Codex mang tính bổ sung. Khi chính sách môi trường chạy chưa được đặt hoặc là `auto`, OpenAI chỉ có thể
chọn Codex khi hợp đồng tuyến do nhà cung cấp sở hữu của nó khai báo `codex`
là tương thích: một tuyến HTTPS chính thức, chính xác của Platform Responses hoặc ChatGPT Responses
không có ghi đè yêu cầu do người dùng xác lập. Chỉ riêng tiền tố `openai/*` không bao giờ
chọn Codex. Các điểm cuối tùy chỉnh, bộ điều hợp Completions và hành vi yêu cầu
do người dùng xác lập vẫn ở OpenClaw. Các điểm cuối HTTP văn bản thuần chính thức bị từ chối. Các tham chiếu `codex/gpt-*`
cũ hơn vẫn là đầu vào tương thích. Xem
[Môi trường chạy agent ngầm định của OpenAI](/vi/providers/openai#implicit-agent-runtime).

Để thiết lập cho người vận hành, xem các ví dụ tiền tố mô hình và cấu hình chỉ dành cho Codex tại
[Codex Harness](/vi/plugins/codex-harness).

Plugin Codex thực thi phiên bản app-server tối thiểu được ghi trong
[Codex Harness](/vi/plugins/codex-harness). Plugin kiểm tra quá trình bắt tay khởi tạo và
chặn các máy chủ cũ hơn hoặc không có phiên bản, nhờ đó OpenClaw chỉ chạy trên bề mặt giao thức
mà nó đã kiểm thử.

### Phần mềm trung gian cho kết quả công cụ

Các plugin được đóng gói và các plugin đã cài đặt được bật rõ ràng với hợp đồng
manifest tương ứng có thể gắn phần mềm trung gian cho kết quả công cụ trung lập với môi trường chạy thông qua
`api.registerAgentToolResultMiddleware(...)` khi manifest của chúng khai báo
các mã định danh môi trường chạy đích trong `contracts.agentToolResultMiddleware`. Bề mặt tích hợp đáng tin cậy
này dành cho các phép biến đổi bất đồng bộ đối với kết quả công cụ phải chạy trước khi OpenClaw hoặc
Codex đưa đầu ra công cụ trở lại mô hình.

Các plugin đi kèm kiểu cũ vẫn có thể sử dụng
`api.registerCodexAppServerExtensionFactory(...)` cho middleware chỉ dành cho app-server Codex, nhưng các phép biến đổi kết quả mới nên sử dụng API trung lập với runtime. Hook `api.registerEmbeddedExtensionFactory(...)` chỉ dành cho trình chạy nhúng đã bị
loại bỏ; các phép biến đổi kết quả công cụ nhúng phải sử dụng middleware trung lập với runtime.

### Phân loại kết quả đầu cuối

Các harness gốc sở hữu phép chiếu giao thức riêng có thể sử dụng
`classifyAgentHarnessTerminalOutcome(...)` từ
`openclaw/plugin-sdk/agent-harness-runtime` khi một lượt đã hoàn tất nhưng không tạo ra
văn bản trợ lý hiển thị. Trình trợ giúp trả về `empty`, `reasoning-only` hoặc
`planning-only` để chính sách dự phòng của OpenClaw có thể quyết định có thử lại bằng
một mô hình khác hay không. `planning-only` yêu cầu trường `planText` tường minh
của harness; OpenClaw không suy luận trường này từ nội dung văn xuôi của trợ lý. Trình trợ giúp
cố ý không phân loại lỗi prompt, các lượt đang diễn ra và những phản hồi
cố ý im lặng như `NO_REPLY`.

### Hiệu ứng phụ khi agent kết thúc

Các harness gốc phải gọi `runAgentEndSideEffects(...)` từ
`openclaw/plugin-sdk/agent-harness-runtime` sau khi hoàn tất một lần thử. Hàm này
điều phối hook `agent_end` khả chuyển và quá trình thu thập nghiên cứu của OpenClaw
mà không làm chậm phản hồi tương tác. Sử dụng `awaitAgentEndSideEffects(...)` cho
các lần chạy cục bộ, không tương tác, trong đó lần thử không được hoàn tất cho đến khi các
hiệu ứng phụ đó kết thúc. Cả hai trình trợ giúp đều chấp nhận cùng payload `{ event, ctx }` như
`runAgentHarnessAgentEndHook(...)`; lỗi của chúng không làm thay đổi kết quả
lần thử đã hoàn tất.

### Dữ liệu nhập của người dùng và các bề mặt công cụ

Các harness gốc cung cấp yêu cầu nhập liệu người dùng ở cấp runtime nên sử dụng
các trình trợ giúp nhập liệu người dùng từ `openclaw/plugin-sdk/agent-harness-runtime` để định dạng
prompt, chuyển prompt qua đường dẫn phản hồi chặn của OpenClaw và chuẩn hóa
câu trả lời lựa chọn/dạng tự do trở lại hình dạng phản hồi gốc của runtime. Trình
trợ giúp duy trì cách trình bày nhất quán trên kênh/TUI, trong khi mỗi harness vẫn duy trì
quy trình phân tích giao thức và vòng đời yêu cầu đang chờ của riêng mình.

Các harness gốc cần định tuyến công cụ nhỏ gọn kiểu PI nên sử dụng
`createAgentHarnessToolSurfaceRuntime(...)` từ
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Thành phần này sở hữu
việc lựa chọn điều khiển tìm kiếm công cụ/chế độ mã, các giá trị mặc định tinh gọn cho mô hình cục bộ,
lọc schema tương thích với runtime, thực thi danh mục ẩn, khởi tạo
thư mục và dọn dẹp danh mục. Các harness vẫn sở hữu quy trình chuyển đổi công cụ
dành riêng cho SDK và callback thực thi gốc.

### Chế độ harness Codex gốc

Harness `codex` đi kèm là chế độ Codex gốc cho các lượt agent OpenClaw
nhúng. Trước tiên hãy bật plugin `codex` đi kèm và thêm `codex` vào
`plugins.allow` nếu cấu hình sử dụng danh sách cho phép hạn chế. Các cấu hình app-server
gốc nên sử dụng `openai/gpt-*`; các lượt agent OpenAI chỉ chọn harness Codex
khi tuyến hiệu dụng khai báo khả năng tương thích với Codex. Các tham chiếu mô hình Codex
kiểu cũ nên được sửa bằng `openclaw doctor --fix`, còn các tham chiếu mô hình `codex/*`
kiểu cũ vẫn là bí danh tương thích cho harness gốc.

Khi chế độ này chạy, Codex sở hữu ID luồng gốc, hành vi tiếp tục,
Compaction và quy trình thực thi app-server. OpenClaw vẫn sở hữu kênh trò chuyện,
bản sao bản chép lời hiển thị, chính sách công cụ, phê duyệt, phân phối nội dung đa phương tiện và lựa chọn
phiên. Sử dụng nhà cung cấp/mô hình `agentRuntime.id: "codex"` khi cần
chứng minh rằng chỉ đường dẫn app-server Codex mới có thể tiếp nhận lần chạy. Các runtime plugin
tường minh sẽ đóng khi gặp lỗi; lỗi lựa chọn app-server Codex và lỗi runtime
không được thử lại thông qua runtime khác.

## Độ nghiêm ngặt của runtime

Theo mặc định, OpenClaw sử dụng chính sách runtime nhà cung cấp/mô hình `auto`: các
harness plugin đã đăng ký có thể tiếp nhận các tuyến hiệu dụng tương thích và runtime
nhúng xử lý lượt khi không có harness nào khớp. Chỉ tiền tố nhà cung cấp/mô hình
không bao giờ chọn một harness. Sử dụng runtime plugin nhà cung cấp/mô hình tường minh như
`agentRuntime.id: "codex"` khi việc không chọn được harness phải gây lỗi thay vì
định tuyến qua runtime nhúng. Việc lựa chọn tường minh không làm cho một
tuyến không tương thích trở nên tương thích. Lỗi của harness plugin đã chọn luôn
gây lỗi nghiêm trọng. Điều này không chặn một `agentRuntime.id: "openclaw"`
nhà cung cấp/mô hình tường minh.

Đối với các lần chạy nhúng chỉ dùng Codex:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

Nếu muốn một backend CLI cho một mô hình chính tắc, hãy đặt runtime trên
mục mô hình đó:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Các ghi đè theo từng agent sử dụng cùng hình dạng theo phạm vi mô hình:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Các ví dụ runtime áp dụng cho toàn bộ agent kiểu cũ như sau sẽ bị bỏ qua:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Với một runtime plugin tường minh, phiên sẽ sớm gặp lỗi khi harness được yêu cầu
chưa được đăng ký, không hỗ trợ nhà cung cấp/mô hình đã phân giải hoặc
gặp lỗi trước khi tạo ra hiệu ứng phụ của lượt. Đây là hành vi có chủ đích đối với các
triển khai chỉ dùng Codex và các bài kiểm thử trực tiếp phải chứng minh đường dẫn app-server Codex
thực sự đang được sử dụng.

Thiết lập này chỉ kiểm soát harness agent nhúng. Nó không vô hiệu hóa
việc định tuyến mô hình dành riêng cho nhà cung cấp đối với hình ảnh, video, nhạc, TTS, PDF hoặc các loại khác.

## Phiên gốc và bản sao bản chép lời

Một harness có thể duy trì ID phiên gốc, ID luồng hoặc token tiếp tục
phía daemon. Hãy giữ liên kết đó được gắn tường minh với phiên OpenClaw và
tiếp tục sao chép đầu ra trợ lý/công cụ hiển thị cho người dùng vào bản chép lời
OpenClaw.

Bản chép lời OpenClaw vẫn là lớp tương thích cho:

- lịch sử phiên hiển thị trên kênh
- tìm kiếm và lập chỉ mục bản chép lời
- chuyển lại sang harness OpenClaw tích hợp sẵn ở một lượt sau
- hành vi chung của `/new`, `/reset` và thao tác xóa phiên

Nếu harness lưu một liên kết sidecar, hãy triển khai `reset(...)` để OpenClaw
có thể xóa liên kết đó khi phiên OpenClaw sở hữu nó được đặt lại.

## Kết quả công cụ và nội dung đa phương tiện

Lõi tạo danh sách công cụ OpenClaw và truyền danh sách đó vào
lần thử đã chuẩn bị. Khi harness thực thi một lệnh gọi công cụ động, hãy trả kết quả công cụ
thông qua hình dạng kết quả của harness thay vì tự gửi nội dung đa phương tiện
qua kênh.

Điều này giữ cho đầu ra văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và công cụ nhắn tin
trên cùng đường dẫn phân phối như các lần chạy do OpenClaw hỗ trợ.

### Kết quả công cụ đầu cuối

`AgentHarnessAttemptParams.observeToolTerminal` là bộ tích lũy kết quả đầu cuối
do máy chủ sở hữu. Một harness thực thi các công cụ động OpenClaw hoặc công cụ gốc
phải gọi hàm này khi mỗi công cụ đạt đến một kết quả đầu cuối, trước khi
kết quả lần thử được hoàn tất. Các harness không thực thi công cụ không cần
gọi hàm này.

Báo cáo các dữ kiện từ ranh giới thực thi:

- Truyền ID lệnh gọi giao thức khi có, tên công cụ chính tắc và các
  đối số thực sự được chuyển đến công cụ sau khi chuẩn bị hoặc viết lại bằng hook.
- Đặt `executionStarted: false` khi việc xác thực, phê duyệt hoặc một biện pháp bảo vệ khác
  đã dừng lệnh gọi trước khi phần triển khai công cụ bắt đầu. Khi quá trình điều phối có thể
  đã xảy ra, hãy thận trọng báo cáo `true`.
- Báo cáo `outcome: "success"` hoặc `outcome: "failure"`. Bao gồm các trường lỗi có cấu trúc
  có sẵn từ runtime thay vì suy luận lỗi từ văn bản hiển thị.
- Chỉ sử dụng `nativeMutation` cho các công cụ gốc không sử dụng định nghĩa công cụ
  OpenClaw. Cung cấp tại đó các dữ kiện về đột biến và phát lại do giao thức sở hữu; không
  sao chép bộ phân loại đột biến của OpenClaw vào harness.

Callback trả về kết quả phân giải chính tắc cho lệnh gọi đó. Chuyển
`lastToolError` của nó vào `AgentHarnessAttemptResult` và sử dụng các dữ kiện về thực thi,
đối số và hiệu ứng phụ trong phép chiếu harness thay vì suy ra
trạng thái song song. Máy chủ duy trì một lỗi đột biến chưa được giải quyết qua các
công cụ thành công không liên quan và chỉ xóa lỗi đó sau khi hành động tương ứng thành công.

Callback vẫn là tùy chọn để duy trì khả năng tương thích mã nguồn với các harness thử nghiệm
cũ hơn. Tùy chọn không có nghĩa là có thể bỏ qua đối với harness thực thi công cụ:
nếu không có báo cáo đầu cuối, OpenClaw không thể duy trì thông tin xác thực về lỗi công cụ đột biến
qua các lệnh gọi công cụ sau đó, bao gồm cả khi Heartbeat hoàn tất trong im lặng.

## Các hạn chế hiện tại

- Đường dẫn nhập công khai mang tính tổng quát, nhưng một số bí danh kiểu lần thử/kết quả
  vẫn mang tên kiểu cũ để đảm bảo khả năng tương thích.
- Việc cài đặt harness của bên thứ ba đang ở giai đoạn thử nghiệm. Ưu tiên các plugin nhà cung cấp
  cho đến khi cần runtime phiên gốc.
- Việc chuyển đổi harness được hỗ trợ giữa các lượt. Không chuyển đổi harness
  giữa một lượt sau khi các công cụ gốc, phê duyệt, văn bản trợ lý hoặc thao tác gửi
  tin nhắn đã bắt đầu.

## Liên quan

- [Tổng quan về SDK](/vi/plugins/sdk-overview)
- [Trình trợ giúp runtime](/vi/plugins/sdk-runtime)
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)
- [Harness Codex](/vi/plugins/codex-harness)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
