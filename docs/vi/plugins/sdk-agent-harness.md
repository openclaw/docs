---
read_when:
    - Bạn đang thay đổi runtime agent nhúng hoặc registry của harness
    - Bạn đang đăng ký một bộ khung tác nhân từ một plugin đi kèm hoặc đáng tin cậy
    - Bạn cần hiểu Plugin Codex liên quan như thế nào đến các nhà cung cấp mô hình
sidebarTitle: Agent Harness
summary: Bề mặt SDK thử nghiệm dành cho các plugin thay thế trình thực thi agent nhúng cấp thấp
title: Plugin bộ khung tác tử
x-i18n:
    generated_at: "2026-07-19T06:15:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43049c126b4defd347b56c31da1b6482e050aa294c3a84673cca59fa5909241
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**bộ thực thi agent** là trình thực thi cấp thấp cho một lượt agent OpenClaw đã được chuẩn bị. Đây không phải là nhà cung cấp mô hình, kênh hay sổ đăng ký công cụ. Để xem mô hình tư duy dành cho người dùng, hãy xem [Runtime agent](/vi/concepts/agent-runtimes).

Chỉ sử dụng bề mặt này cho các plugin native đi kèm hoặc đáng tin cậy. Hợp đồng vẫn đang ở trạng thái thử nghiệm vì các kiểu tham số được chủ ý thiết kế tương ứng với trình chạy nhúng hiện tại.

## Khi nào nên sử dụng bộ thực thi

Đăng ký một bộ thực thi agent khi một họ mô hình có runtime phiên native riêng và cơ chế truyền tải thông thường của nhà cung cấp OpenClaw không phải là lớp trừu tượng phù hợp:

- một máy chủ coding agent native sở hữu các luồng và Compaction
- một CLI hoặc daemon cục bộ phải truyền phát các sự kiện kế hoạch/suy luận/công cụ native
- một runtime mô hình cần id tiếp tục riêng ngoài bản chép lại phiên OpenClaw

**Không** đăng ký bộ thực thi chỉ để thêm một API LLM mới. Đối với các API mô hình HTTP hoặc WebSocket thông thường, hãy xây dựng một [plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins).

## Những gì lõi vẫn quản lý

Trước khi một bộ thực thi được chọn, OpenClaw đã phân giải:

- nhà cung cấp và mô hình
- trạng thái xác thực runtime, trừ khi bộ thực thi khai báo rằng nó sở hữu quá trình khởi tạo xác thực
- mức độ suy luận và ngân sách ngữ cảnh
- tệp bản chép lại/phiên OpenClaw
- không gian làm việc, sandbox và chính sách công cụ
- các callback trả lời kênh và callback truyền phát
- chính sách dự phòng mô hình và chuyển đổi mô hình trực tiếp

Bộ thực thi chạy một lần thử đã được chuẩn bị; nó không chọn nhà cung cấp, thay thế việc phân phối qua kênh hay âm thầm chuyển đổi mô hình.

### Khởi tạo xác thực do bộ thực thi sở hữu

Theo mặc định, lõi phân giải thông tin xác thực của nhà cung cấp trước khi gọi bộ thực thi. Một bộ thực thi đáng tin cậy có thể xác thực thông qua runtime native riêng có thể đặt
`authBootstrap: "harness"` trên đăng ký `AgentHarness` tĩnh của nó. Khi đó, lõi bỏ qua quá trình khởi tạo thông tin xác thực nhà cung cấp dùng chung và lỗi thiếu thông tin xác thực cho mọi lần thử do bộ thực thi đó nhận xử lý.

Lõi vẫn chuyển tiếp một hồ sơ xác thực OpenClaw tương thích, được chọn rõ ràng hoặc sắp thứ tự, cùng kho lưu trữ có phạm vi của hồ sơ đó khi chúng tồn tại. Bộ thực thi phải phân giải hồ sơ đó hoặc thông tin xác thực native của nó trước khi gửi yêu cầu mô hình, giới hạn bí mật trong phạm vi lần thử và hiển thị các lỗi xác thực có thể xử lý. Không đặt khả năng này trên một bộ thực thi chỉ đôi khi sở hữu việc xác thực.

### Các artifact runtime thiết lập đã xác minh

Một bộ thực thi cục bộ có thể cung cấp suy luận cho lần thiết lập đầu tiên phải chứng thực phần triển khai đã hoàn tất phép thăm dò. Khi
`params.captureRuntimeArtifact` là true, hãy trả về một
`result.runtimeArtifact` bất khả kiến với id ổn định và dấu vân tay nội dung. Đăng ký một khả năng `runtimeArtifact.validate(...)` tương ứng để kiểm tra lại liên kết đó mà không tải một bộ thực thi khác hoặc quét các plugin không liên quan.

Các lượt tiếp tục OpenClaw đã xác minh cũng truyền `params.expectedRuntimeArtifact`.
Bộ thực thi phải so sánh giá trị này với đúng tiến trình native mà nó đã nhận và thất bại trước khi bắt đầu hoặc tiếp tục một luồng native nếu chúng khác nhau. Các lượt agent thông thường bỏ qua cả hai trường, nhờ đó việc băm nội dung không nằm trên đường xử lý nóng của yêu cầu thông thường. Bộ thực thi từ xa/WebSocket cần một hợp đồng chứng thực máy chủ trước khi có thể tham gia; chỉ riêng chuỗi phiên bản không phải là danh tính artifact.

Lần thử đã chuẩn bị cũng bao gồm `params.runtimePlan`, một gói chính sách do OpenClaw sở hữu dành cho các quyết định runtime phải được dùng chung giữa OpenClaw và các bộ thực thi native:

- `runtimePlan.tools.normalize(...)` và `runtimePlan.tools.logDiagnostics(...)`
  dành cho chính sách lược đồ công cụ nhận biết nhà cung cấp
- `runtimePlan.transcript.resolvePolicy(...)` dành cho chính sách làm sạch bản chép lại và
  sửa chữa lời gọi công cụ
- `runtimePlan.delivery.isSilentPayload(...)` dành cho `NO_REPLY` dùng chung và việc ngăn
  phân phối phương tiện
- `runtimePlan.outcome.classifyRunResult(...)` dành cho việc phân loại
  dự phòng mô hình
- `runtimePlan.observability` dành cho siêu dữ liệu nhà cung cấp/mô hình/bộ thực thi đã phân giải

Các bộ thực thi có thể sử dụng kế hoạch cho những quyết định cần khớp với hành vi của OpenClaw, nhưng phải coi đó là trạng thái lần thử do máy chủ sở hữu: không sửa đổi hoặc sử dụng nó để chuyển đổi nhà cung cấp/mô hình trong một lượt.

### Hợp đồng truyền tải yêu cầu

`supports(ctx)` nhận cơ chế truyền tải mô hình đã phân giải trong `ctx.modelProvider`.
Hai dữ kiện không chứa bí mật và do nhà cung cấp sở hữu mô tả tuyến đã chọn:

- `runtimePolicy.compatibleIds` liệt kê các id runtime mà nhà cung cấp khai báo
  tương thích với tuyến cụ thể đó. Việc không có chính sách nghĩa là nhà cung cấp
  không khai báo khả năng tương thích ở cấp tuyến; đây không phải là quyền để giả định có hỗ trợ.
- `requestTransportOverrides: "none"` nghĩa là không phải tái tạo ghi đè yêu cầu
  nhà cung cấp/mô hình do tác giả đặt. `"present"` nghĩa là tồn tại header do tác giả đặt, cơ chế
  truyền tải xác thực, proxy, TLS, dịch vụ cục bộ, hành vi mạng riêng hoặc tham số
  yêu cầu. Dữ kiện này không tiết lộ các giá trị đó.

Trả về `{ supported: false, reason }` khi bộ thực thi không thể tái tạo cơ chế truyền tải đã chuẩn bị. Không suy luận khả năng hỗ trợ bằng cách đọc cấu hình thô sau khi lựa chọn.
Khi quá trình chuẩn bị xác thực tạo ra nhiều tuyến thử lại, một bộ thực thi phải hỗ trợ
tất cả các tuyến đó trước khi điều phối. Lựa chọn ngầm định sử dụng OpenClaw nếu không plugin nào có thể
sở hữu toàn bộ tập hợp; một lựa chọn plugin rõ ràng hoặc được lưu bền vững sẽ thất bại theo cơ chế đóng.

## Đăng ký bộ thực thi

**Nhập:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Bộ thực thi agent native của tôi",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "tuyến hiệu lực không tương thích với bộ thực thi" };
  },

  async runAttempt(params) {
    // Bắt đầu hoặc tiếp tục luồng native của bạn.
    // Sử dụng params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent và các trường khác của lần thử đã chuẩn bị.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Agent Native Của Tôi",
  description: "Chạy các mô hình đã chọn thông qua một daemon agent native.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

`authBootstrap` được chủ ý lược bỏ khỏi ví dụ chung này. Chỉ thêm
`authBootstrap: "harness"` khi bộ thực thi đáp ứng hợp đồng nêu trên.

### Thực thi được ủy quyền

Chủ sở hữu bộ thực thi có thể đặt `delegatedExecutionPluginIds` thành các id của những plugin đáng tin cậy cần thực thi một phiên hiện có đã khóa mô hình, chẳng hạn như một cơ chế truyền tải giọng nói tiếp tục cuộc trò chuyện dựa trên Codex. Đây là sự đồng ý tĩnh của chủ sở hữu, không phải danh sách cho phép của lõi. Hãy giới hạn phạm vi thật hẹp.

Các bên được ủy quyền chỉ nhận quyền tiếp nhận công việc và thực thi nhúng. OpenClaw yêu cầu
chính xác khóa phiên, đường dẫn kho lưu trữ và id phiên đã lưu; `modelSelectionLocked:
true`; cùng các giá trị `agentHarnessId` và `agentHarnessRuntimeOverride` khớp nhau.
Sau đó, lượt chạy được giới hạn phạm vi thông qua chủ sở hữu bộ thực thi. Việc tạo, vá,
đặt lại, xóa và lưu trữ phiên cũng như thay đổi Gateway vẫn chỉ dành cho chủ sở hữu.

## Chính sách lựa chọn

OpenClaw chọn một bộ thực thi sau khi phân giải nhà cung cấp/mô hình:

1. Chính sách runtime theo phạm vi mô hình được ưu tiên.
2. Tiếp theo là chính sách runtime theo phạm vi nhà cung cấp.
3. `auto` hỏi các bộ thực thi đã đăng ký liệu chúng có hỗ trợ tuyến hiệu lực đã phân giải hay không.
   Chỉ riêng tiền tố nhà cung cấp/mô hình không bao giờ chọn bộ thực thi.
4. Nếu không có bộ thực thi đã đăng ký nào khớp, OpenClaw sử dụng runtime nhúng của mình.

Lỗi của bộ thực thi plugin được hiển thị dưới dạng lỗi lượt chạy. Trong chế độ `auto`, dự phòng nhúng chỉ áp dụng khi không có bộ thực thi plugin đã đăng ký nào hỗ trợ nhà cung cấp/mô hình đã phân giải. Khi một bộ thực thi plugin đã nhận lượt chạy, OpenClaw không phát lại cùng lượt đó qua runtime khác, vì việc này có thể thay đổi ngữ nghĩa xác thực/runtime hoặc tạo hiệu ứng phụ trùng lặp.

Chính sách runtime đã cấu hình vẫn là nguồn có thẩm quyền về runtime mong muốn. Một phiên `agentHarnessId` được lưu bền vững vẫn giữ quyền sở hữu bản chép lại native trong khi quá trình chuẩn bị tuyến/xác thực vẫn đang chờ xử lý. Cả hai đều không làm cho một tuyến không tương thích trở nên tương thích: khi các dữ kiện đã chuẩn bị tồn tại, bộ thực thi được chọn hoặc được ghim phải hỗ trợ chúng, nếu không lượt chạy sẽ thất bại theo cơ chế đóng. `/status` hiển thị runtime hiệu lực được chọn từ chính sách, quyền sở hữu được lưu bền vững và khả năng hỗ trợ tuyến.
Trạng thái chuẩn bị được biểu thị rõ ràng: `runtimePolicy` bị thiếu vẫn ở trạng thái chưa khai báo thay vì được suy luận từ bất kỳ trường truyền tải nào tình cờ hiện diện.
Khi cơ chế xác thực do bộ thực thi sở hữu khiến nhiều tuyến vật lý chưa được phân giải, dữ kiện hỗ trợ đã chuẩn bị là giao của các id runtime tương thích và báo cáo ghi đè yêu cầu nếu bất kỳ ứng viên nào có chúng. Vì vậy, một ứng viên chưa khai báo sẽ khiến khả năng tương thích native trở thành rỗng; `preparedAuth.source: "harness"` là chủ sở hữu xác thực, không phải quyền để suy luận khả năng hỗ trợ tuyến.

Nếu bộ thực thi được chọn gây bất ngờ, hãy bật ghi nhật ký gỡ lỗi `agents/harness`
và kiểm tra bản ghi `agent harness selected` có cấu trúc của Gateway: bản ghi này
bao gồm id bộ thực thi đã chọn, lý do lựa chọn, chính sách runtime/dự phòng
và, trong chế độ `auto`, kết quả hỗ trợ của từng ứng viên plugin.

Plugin Codex đi kèm đăng ký `codex` làm id bộ thực thi. Lõi coi đó
là một id bộ thực thi plugin thông thường; các bí danh dành riêng cho Codex thuộc về plugin
hoặc cấu hình của bên vận hành, không thuộc bộ chọn runtime dùng chung.

## Ghép cặp nhà cung cấp với bộ thực thi

Hầu hết các bộ thực thi cũng nên đăng ký một nhà cung cấp. Nhà cung cấp giúp phần còn lại của
OpenClaw nhìn thấy tham chiếu mô hình, trạng thái xác thực, siêu dữ liệu mô hình và lựa chọn `/model`. Sau đó, bộ thực thi nhận xử lý nhà cung cấp đó trong `supports(...)`.

Plugin Codex đi kèm tuân theo mẫu này:

- tham chiếu mô hình người dùng ưu tiên: `openai/gpt-5.6-sol`
- tham chiếu tương thích: các tham chiếu `codex/gpt-*` cũ vẫn được chấp nhận, nhưng cấu hình mới
  không nên sử dụng chúng làm tham chiếu nhà cung cấp/mô hình thông thường
- id bộ thực thi: `codex`
- xác thực: khả dụng nhà cung cấp tổng hợp, vì bộ thực thi Codex sở hữu
  thông tin đăng nhập/phiên Codex native
- yêu cầu app-server: OpenClaw gửi id mô hình thuần túy tới Codex và để
  bộ thực thi giao tiếp với giao thức app-server native

Plugin Codex mang tính bổ sung. Khi chính sách runtime chưa được đặt hoặc là `auto`, OpenAI chỉ có thể chọn Codex khi hợp đồng tuyến do nhà cung cấp sở hữu khai báo `codex`
tương thích: một tuyến Platform Responses hoặc ChatGPT Responses HTTPS chính thức và chính xác, không có ghi đè yêu cầu do tác giả đặt. Chỉ riêng tiền tố `openai/*` không bao giờ
chọn Codex. Các endpoint tùy chỉnh, bộ điều hợp Completions và hành vi yêu cầu do tác giả đặt
vẫn do OpenClaw xử lý. Các endpoint HTTP chính thức dạng văn bản thuần bị từ chối. Các tham chiếu `codex/gpt-*` cũ
vẫn là đầu vào tương thích. Xem
[Runtime agent OpenAI ngầm định](/vi/providers/openai#implicit-agent-runtime).

Để biết về thiết lập dành cho bên vận hành, các ví dụ tiền tố mô hình và cấu hình chỉ dành cho Codex, hãy xem
[Bộ thực thi Codex](/vi/plugins/codex-harness).

Plugin Codex áp dụng phiên bản app-server tối thiểu được ghi trong
[Bộ thực thi Codex](/vi/plugins/codex-harness). Plugin kiểm tra quá trình bắt tay khởi tạo và
chặn các máy chủ cũ hơn hoặc không có phiên bản, nhờ đó OpenClaw chỉ chạy với bề mặt
giao thức mà nó đã kiểm thử.

### Middleware kết quả công cụ

Các plugin đi kèm và những plugin đã cài đặt được bật rõ ràng có hợp đồng manifest phù hợp có thể gắn middleware kết quả công cụ trung lập với runtime thông qua
`api.registerAgentToolResultMiddleware(...)` khi manifest của chúng khai báo
các id runtime đích trong `contracts.agentToolResultMiddleware`. Bề mặt tích hợp đáng tin cậy
này dành cho các phép biến đổi kết quả công cụ bất đồng bộ phải chạy trước khi OpenClaw hoặc
Codex đưa đầu ra công cụ trở lại mô hình.

Các plugin đi kèm cũ vẫn có thể sử dụng
`api.registerCodexAppServerExtensionFactory(...)` cho middleware chỉ dành cho app-server Codex,
nhưng các phép biến đổi kết quả mới nên sử dụng API trung lập với runtime. Hook
`api.registerEmbeddedExtensionFactory(...)` chỉ dành cho trình chạy nhúng đã bị
loại bỏ; các phép biến đổi kết quả công cụ nhúng phải sử dụng middleware trung lập với runtime.

### Phân loại kết quả cuối cùng

Các harness gốc tự quản lý phép chiếu giao thức có thể sử dụng
`classifyAgentHarnessTerminalOutcome(...)` từ
`openclaw/plugin-sdk/agent-harness-runtime` khi một lượt đã hoàn tất nhưng không tạo ra
văn bản trợ lý hiển thị. Trình trợ giúp trả về `empty`, `reasoning-only` hoặc
`planning-only` để chính sách dự phòng của OpenClaw có thể quyết định có thử lại bằng
một mô hình khác hay không. `planning-only` yêu cầu trường `planText`
tường minh của harness; OpenClaw không suy luận trường này từ lời văn của trợ lý. Trình trợ giúp
cố ý không phân loại lỗi prompt, các lượt đang diễn ra và các phản hồi im lặng
có chủ đích như `NO_REPLY`.

### Hiệu ứng phụ khi agent kết thúc

Các harness gốc phải gọi `runAgentEndSideEffects(...)` từ
`openclaw/plugin-sdk/agent-harness-runtime` sau khi hoàn tất một lần thử. Hàm này
điều phối hook `agent_end` có tính khả chuyển và việc thu thập nghiên cứu của OpenClaw
mà không làm chậm các phản hồi tương tác. Sử dụng `awaitAgentEndSideEffects(...)` cho
các lần chạy cục bộ, không tương tác, trong đó lần thử không được hoàn tất cho đến khi các
hiệu ứng phụ đó kết thúc. Cả hai trình trợ giúp đều chấp nhận cùng payload `{ event, ctx }` như
`runAgentHarnessAgentEndHook(...)`; lỗi của chúng không làm thay đổi kết quả
của lần thử đã hoàn tất.

### Bề mặt nhập liệu người dùng và công cụ

Các harness gốc cung cấp yêu cầu nhập liệu người dùng ở cấp runtime nên sử dụng
các trình trợ giúp nhập liệu người dùng từ `openclaw/plugin-sdk/agent-harness-runtime` để định dạng
prompt, phân phối prompt qua đường dẫn phản hồi chặn của OpenClaw và chuẩn hóa
câu trả lời dạng lựa chọn/văn bản tự do trở lại hình dạng phản hồi gốc của runtime. Trình
trợ giúp duy trì cách trình bày nhất quán trên kênh/TUI, trong khi mỗi harness vẫn quản lý
việc phân tích giao thức và vòng đời yêu cầu đang chờ của riêng mình.

Các harness gốc cần định tuyến công cụ nhỏ gọn kiểu PI nên sử dụng
`createAgentHarnessToolSurfaceRuntime(...)` từ
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Trình này quản lý
việc chọn điều khiển tìm kiếm công cụ/chế độ mã, các giá trị mặc định tinh gọn cho mô hình cục bộ,
lọc schema tương thích với runtime, thực thi danh mục ẩn, nạp dữ liệu thư mục
và dọn dẹp danh mục. Các harness vẫn quản lý việc chuyển đổi công cụ dành riêng cho SDK
và callback thực thi gốc của riêng mình.

### Chế độ harness Codex gốc

Harness `codex` đi kèm là chế độ Codex gốc dành cho các lượt agent OpenClaw
nhúng. Trước tiên, hãy bật plugin `codex` đi kèm và thêm `codex` vào
`plugins.allow` nếu cấu hình của bạn sử dụng danh sách cho phép hạn chế. Các cấu hình app-server
gốc nên sử dụng `openai/gpt-*`; các lượt agent OpenAI chỉ chọn harness Codex
khi tuyến hiệu lực khai báo khả năng tương thích với Codex. Các tham chiếu mô hình Codex cũ
nên được sửa bằng `openclaw doctor --fix`, còn các tham chiếu mô hình `codex/*`
cũ vẫn là bí danh tương thích cho harness gốc.

Khi chế độ này chạy, Codex quản lý ID luồng gốc, hành vi tiếp tục,
Compaction và việc thực thi app-server. OpenClaw vẫn quản lý kênh trò chuyện,
bản sao bản chép lời hiển thị, chính sách công cụ, phê duyệt, phân phối nội dung đa phương tiện và lựa chọn
phiên. Sử dụng nhà cung cấp/mô hình `agentRuntime.id: "codex"` khi bạn cần
chứng minh rằng chỉ đường dẫn app-server Codex mới có thể tiếp nhận lần chạy. Các runtime plugin
tường minh sẽ đóng khi có lỗi; lỗi lựa chọn app-server Codex và lỗi runtime
không được thử lại qua runtime khác.

## Độ nghiêm ngặt của runtime

Theo mặc định, OpenClaw sử dụng chính sách runtime nhà cung cấp/mô hình `auto`: các
harness plugin đã đăng ký có thể tiếp nhận các tuyến hiệu lực tương thích, còn runtime
nhúng xử lý lượt khi không có harness nào khớp. Chỉ tiền tố nhà cung cấp/mô hình không bao giờ
chọn một harness. Sử dụng runtime plugin nhà cung cấp/mô hình tường minh như
`agentRuntime.id: "codex"` khi việc không chọn được harness phải gây lỗi thay vì
định tuyến qua runtime nhúng. Việc lựa chọn tường minh không làm cho một
tuyến không tương thích trở nên tương thích. Lỗi của harness plugin đã chọn luôn gây lỗi
nghiêm trọng. Điều này không chặn một `agentRuntime.id: "openclaw"`
nhà cung cấp/mô hình tường minh.

Đối với các lần chạy nhúng chỉ dành cho Codex:

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

Nếu bạn muốn một backend CLI cho một mô hình chuẩn duy nhất, hãy đặt runtime trên
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

Các giá trị ghi đè theo từng agent sử dụng cùng hình dạng theo phạm vi mô hình:

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

Các ví dụ runtime toàn agent cũ như sau sẽ bị bỏ qua:

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

Với runtime plugin tường minh, phiên sẽ sớm thất bại khi harness được yêu cầu
chưa được đăng ký, không hỗ trợ nhà cung cấp/mô hình đã phân giải hoặc
gặp lỗi trước khi tạo ra hiệu ứng phụ của lượt. Đây là hành vi có chủ đích đối với các
triển khai chỉ dành cho Codex và các kiểm thử trực tiếp phải chứng minh rằng đường dẫn app-server Codex
thực sự đang được sử dụng.

Thiết lập này chỉ kiểm soát harness agent nhúng. Nó không vô hiệu hóa
việc định tuyến mô hình dành riêng cho nhà cung cấp đối với hình ảnh, video, âm nhạc, TTS, PDF hoặc các loại khác.

## Phiên gốc và bản sao bản chép lời

Một harness có thể duy trì ID phiên gốc, ID luồng hoặc token tiếp tục
ở phía daemon. Hãy giữ liên kết đó được gắn tường minh với phiên OpenClaw và
tiếp tục sao chép đầu ra trợ lý/công cụ hiển thị cho người dùng vào
bản chép lời OpenClaw.

Bản chép lời OpenClaw vẫn là lớp tương thích cho:

- lịch sử phiên hiển thị trên kênh
- tìm kiếm và lập chỉ mục bản chép lời
- chuyển trở lại harness OpenClaw tích hợp trong một lượt sau
- hành vi chung của `/new`, `/reset` và việc xóa phiên

Nếu harness của bạn lưu liên kết sidecar, hãy triển khai `reset(...)` để OpenClaw
có thể xóa liên kết đó khi phiên OpenClaw sở hữu nó được đặt lại.

## Kết quả công cụ và nội dung đa phương tiện

Lõi xây dựng danh sách công cụ OpenClaw và truyền danh sách đó vào lần thử
đã chuẩn bị. Khi một harness thực thi lệnh gọi công cụ động, hãy trả kết quả công cụ
qua hình dạng kết quả của harness thay vì tự gửi nội dung đa phương tiện
qua kênh.

Điều này giữ đầu ra văn bản, hình ảnh, video, âm nhạc, TTS, phê duyệt và công cụ nhắn tin
trên cùng đường dẫn phân phối như các lần chạy do OpenClaw hỗ trợ.

Chỉ đặt `AgentHarnessAttemptResult.hostOwnedToolMediaUrls` cho các tạo tác gốc
mà runtime harness đáng tin cậy tự tạo và lưu trữ. Mỗi mục cũng phải
xuất hiện trong `toolMediaUrls`. Không bao giờ bao gồm nội dung đa phương tiện của công cụ động do mô hình chọn hoặc
công cụ OpenClaw. Trên các tuyến `message_tool_only`, nguồn gốc hẹp này cho phép
các tạo tác runtime gốc tồn tại khi phản hồi nguồn bị chặn; chính sách gửi thông thường
và quy tắc chấp nhận phòng xung quanh vẫn được áp dụng.

### Kết quả cuối cùng của công cụ

`AgentHarnessAttemptParams.observeToolTerminal` là bộ tích lũy kết quả
cuối cùng do máy chủ quản lý. Một harness thực thi các công cụ động OpenClaw hoặc công cụ
gốc phải gọi hàm này khi mỗi công cụ đạt đến một kết quả cuối cùng, trước khi
kết quả lần thử được hoàn tất. Các harness không thực thi công cụ không cần
gọi hàm này.

Báo cáo dữ kiện từ ranh giới thực thi:

- Truyền ID lệnh gọi giao thức khi có, tên công cụ chuẩn và các
  đối số thực sự đến được công cụ sau khi chuẩn bị hoặc được hook viết lại.
- Đặt `executionStarted: false` khi bước xác thực, phê duyệt hoặc một lớp bảo vệ khác
  dừng lệnh gọi trước khi phần triển khai công cụ bắt đầu. Khi việc điều phối có thể
  đã xảy ra, hãy báo cáo `true` một cách thận trọng.
- Báo cáo `outcome: "success"` hoặc `outcome: "failure"`. Bao gồm các trường lỗi có cấu trúc
  sẵn có từ runtime thay vì suy luận lỗi từ văn bản hiển thị.
- Chỉ sử dụng `nativeMutation` cho các công cụ gốc không sử dụng định nghĩa công cụ
  OpenClaw. Cung cấp dữ kiện về thay đổi và phát lại do giao thức quản lý tại đó; không
  sao chép bộ phân loại thay đổi của OpenClaw vào harness.

Callback trả về kết quả phân giải chuẩn cho lệnh gọi đó. Chuyển
`lastToolError` của kết quả này vào `AgentHarnessAttemptResult` và sử dụng các dữ kiện về thực thi,
đối số và hiệu ứng phụ của nó trong phép chiếu harness thay vì suy ra
trạng thái song song. Máy chủ duy trì một lỗi thay đổi chưa được giải quyết qua các công cụ
không liên quan đã thành công và chỉ xóa lỗi đó sau khi hành động tương ứng thành công.

Callback vẫn là tùy chọn để tương thích mã nguồn với các harness thử nghiệm
cũ. Tùy chọn không có nghĩa là có thể bỏ qua đối với một harness thực thi công cụ:
nếu không có báo cáo cuối cùng, OpenClaw không thể duy trì sự thật về lỗi của công cụ thay đổi
qua các lệnh gọi công cụ sau đó, bao gồm cả khi Heartbeat hoàn tất trong im lặng.

## Hạn chế hiện tại

- Đường dẫn nhập công khai mang tính chung, nhưng một số bí danh kiểu lần thử/kết quả
  vẫn giữ tên cũ để tương thích.
- Việc cài đặt harness của bên thứ ba đang ở giai đoạn thử nghiệm. Ưu tiên các plugin nhà cung cấp
  cho đến khi bạn cần runtime phiên gốc.
- Hỗ trợ chuyển đổi harness giữa các lượt. Không chuyển đổi harness
  giữa một lượt sau khi các công cụ gốc, phê duyệt, văn bản trợ lý hoặc thao tác gửi tin nhắn
  đã bắt đầu.

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview)
- [Trình trợ giúp runtime](/vi/plugins/sdk-runtime)
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)
- [Harness Codex](/vi/plugins/codex-harness)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
