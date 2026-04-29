---
read_when:
    - Bạn đang thay đổi môi trường chạy tác nhân nhúng hoặc sổ đăng ký khung thử nghiệm
    - Bạn đang đăng ký một bộ khai thác tác nhân từ một Plugin được đóng gói sẵn hoặc đáng tin cậy
    - Bạn cần hiểu Plugin Codex liên quan như thế nào đến các nhà cung cấp mô hình
sidebarTitle: Agent Harness
summary: Giao diện SDK thử nghiệm dành cho các Plugin thay thế trình thực thi tác nhân nhúng cấp thấp
title: Plugin cho bộ khung tác tử
x-i18n:
    generated_at: "2026-04-29T23:01:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Một **agent harness** là trình thực thi cấp thấp cho một lượt OpenClaw agent
đã được chuẩn bị. Nó không phải là model provider, không phải channel, và không
phải tool registry. Để xem mô hình tư duy dành cho người dùng, xem [Agent runtimes](/vi/concepts/agent-runtimes).

Chỉ dùng bề mặt này cho các plugin gốc được đóng gói sẵn hoặc đáng tin cậy. Hợp đồng
vẫn đang thử nghiệm vì các kiểu tham số cố ý phản ánh runner nhúng hiện tại.

## Khi nào dùng harness

Đăng ký agent harness khi một họ model có runtime phiên gốc riêng
và transport provider OpenClaw thông thường là lớp trừu tượng không phù hợp.

Ví dụ:

- một máy chủ coding-agent gốc sở hữu luồng và compaction
- một CLI hoặc daemon cục bộ phải stream các sự kiện plan/reasoning/tool gốc
- một model runtime cần resume id riêng ngoài transcript phiên OpenClaw

**Không** đăng ký harness chỉ để thêm một LLM API mới. Với các API model HTTP hoặc
WebSocket thông thường, hãy xây dựng [provider plugin](/vi/plugins/sdk-provider-plugins).

## Core vẫn sở hữu những gì

Trước khi một harness được chọn, OpenClaw đã phân giải:

- provider và model
- trạng thái auth runtime
- mức thinking và ngân sách ngữ cảnh
- tệp transcript/phiên OpenClaw
- workspace, sandbox, và chính sách tool
- callback trả lời channel và callback streaming
- chính sách fallback model và chuyển model trực tiếp

Việc tách này là có chủ đích. Một harness chạy một lần thử đã chuẩn bị; nó không chọn
provider, thay thế việc phân phối channel, hoặc âm thầm chuyển model.

Lần thử đã chuẩn bị cũng bao gồm `params.runtimePlan`, một gói chính sách do OpenClaw sở hữu
cho các quyết định runtime phải được chia sẻ giữa PI và các harness gốc:

- `runtimePlan.tools.normalize(...)` và
  `runtimePlan.tools.logDiagnostics(...)` cho chính sách schema tool nhận biết provider
- `runtimePlan.transcript.resolvePolicy(...)` cho chính sách làm sạch transcript và
  sửa tool-call
- `runtimePlan.delivery.isSilentPayload(...)` cho `NO_REPLY` dùng chung và việc
  chặn phân phối media
- `runtimePlan.outcome.classifyRunResult(...)` cho phân loại fallback model
- `runtimePlan.observability` cho metadata provider/model/harness đã phân giải

Harness có thể dùng plan cho các quyết định cần khớp với hành vi PI, nhưng
vẫn nên xem nó là trạng thái lần thử do host sở hữu. Không mutate nó hoặc dùng nó để
chuyển provider/model bên trong một lượt.

## Đăng ký harness

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
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

## Chính sách chọn

OpenClaw chọn harness sau khi phân giải provider/model:

1. Id harness đã ghi của một phiên hiện có thắng, nên thay đổi config/env sẽ không
   hot-switch transcript đó sang runtime khác.
2. `OPENCLAW_AGENT_RUNTIME=<id>` buộc một harness đã đăng ký với id đó cho
   các phiên chưa được ghim.
3. `OPENCLAW_AGENT_RUNTIME=pi` buộc harness PI tích hợp sẵn.
4. `OPENCLAW_AGENT_RUNTIME=auto` hỏi các harness đã đăng ký xem chúng có hỗ trợ
   provider/model đã phân giải hay không.
5. Nếu không có harness đã đăng ký nào khớp, OpenClaw dùng PI trừ khi fallback PI
   bị tắt.

Lỗi harness của plugin hiển thị như lỗi chạy. Trong chế độ `auto`, fallback PI
chỉ được dùng khi không có plugin harness đã đăng ký nào hỗ trợ
provider/model đã phân giải. Khi một plugin harness đã nhận một lần chạy, OpenClaw không
phát lại chính lượt đó qua PI vì điều đó có thể thay đổi ngữ nghĩa auth/runtime
hoặc nhân đôi side effect.

Id harness đã chọn được lưu bền vững cùng id phiên sau một lần chạy nhúng.
Các phiên legacy được tạo trước khi có ghim harness được xem là đã ghim PI sau khi chúng
có lịch sử transcript. Hãy dùng phiên mới/reset khi chuyển giữa PI và
một plugin harness gốc. `/status` hiển thị các id harness không mặc định như `codex`
bên cạnh `Fast`; PI vẫn bị ẩn vì đó là đường dẫn tương thích mặc định.
Nếu harness đã chọn gây bất ngờ, hãy bật ghi log debug `agents/harness` và
kiểm tra bản ghi có cấu trúc `agent harness selected` của gateway. Nó bao gồm
id harness đã chọn, lý do chọn, chính sách runtime/fallback, và, trong
chế độ `auto`, kết quả hỗ trợ của từng ứng viên plugin.

Plugin Codex được đóng gói sẵn đăng ký `codex` làm id harness. Core xem đó
như một id plugin harness thông thường; alias riêng cho Codex thuộc về plugin
hoặc config operator, không thuộc bộ chọn runtime dùng chung.

## Ghép cặp provider với harness

Hầu hết harness cũng nên đăng ký provider. Provider làm cho model ref,
trạng thái auth, metadata model, và lựa chọn `/model` hiển thị với phần còn lại của
OpenClaw. Sau đó harness nhận provider đó trong `supports(...)`.

Plugin Codex được đóng gói sẵn theo mẫu này:

- model ref ưu tiên cho người dùng: `openai/gpt-5.5` cộng với
  `agentRuntime.id: "codex"`
- ref tương thích: các ref legacy `codex/gpt-*` vẫn được chấp nhận, nhưng config mới
  không nên dùng chúng như ref provider/model thông thường
- id harness: `codex`
- auth: tính khả dụng provider tổng hợp, vì harness Codex sở hữu
  login/phiên Codex gốc
- yêu cầu app-server: OpenClaw gửi id model trần tới Codex và để
  harness nói chuyện với giao thức app-server gốc

Plugin Codex là bổ sung. Các ref `openai/gpt-*` thuần tiếp tục dùng
đường dẫn provider OpenClaw thông thường trừ khi bạn buộc harness Codex bằng
`agentRuntime.id: "codex"`. Các ref `codex/gpt-*` cũ vẫn chọn
provider và harness Codex để tương thích.

Để thiết lập operator, ví dụ tiền tố model, và config chỉ dành cho Codex, xem
[Codex Harness](/vi/plugins/codex-harness).

OpenClaw yêu cầu Codex app-server `0.125.0` hoặc mới hơn. Plugin Codex kiểm tra
handshake initialize của app-server và chặn các server cũ hơn hoặc không có phiên bản để
OpenClaw chỉ chạy với bề mặt giao thức đã được kiểm thử. Mức sàn
`0.125.0` bao gồm hỗ trợ payload hook MCP gốc đã được đưa vào
Codex `0.124.0`, đồng thời ghim OpenClaw vào dòng ổn định mới hơn đã kiểm thử.

### Middleware kết quả tool

Các plugin được đóng gói sẵn có thể gắn middleware kết quả tool trung lập runtime thông qua
`api.registerAgentToolResultMiddleware(...)` khi manifest của chúng khai báo
các id runtime mục tiêu trong `contracts.agentToolResultMiddleware`. Seam đáng tin cậy
này dành cho các transform kết quả tool async phải chạy trước khi PI hoặc Codex đưa
đầu ra tool trở lại model.

Các plugin legacy được đóng gói sẵn vẫn có thể dùng
`api.registerCodexAppServerExtensionFactory(...)` cho middleware chỉ dành cho Codex app-server,
nhưng các transform kết quả mới nên dùng API trung lập runtime.
Hook chỉ dành cho Pi `api.registerEmbeddedExtensionFactory(...)` đã bị xóa;
các transform kết quả tool của Pi phải dùng middleware trung lập runtime.

### Phân loại kết quả terminal

Các harness gốc sở hữu projection giao thức riêng có thể dùng
`classifyAgentHarnessTerminalOutcome(...)` từ
`openclaw/plugin-sdk/agent-harness-runtime` khi một lượt hoàn tất không tạo ra
văn bản assistant hiển thị. Helper trả về `empty`, `reasoning-only`, hoặc
`planning-only` để chính sách fallback của OpenClaw có thể quyết định có thử lại trên
model khác hay không. Nó cố ý không phân loại lỗi prompt, lượt đang chạy, và
các trả lời im lặng có chủ đích như `NO_REPLY`.

### Chế độ harness Codex gốc

Harness `codex` được đóng gói sẵn là chế độ Codex gốc cho các lượt OpenClaw agent
nhúng. Trước tiên hãy bật plugin `codex` được đóng gói sẵn, và đưa `codex` vào
`plugins.allow` nếu config của bạn dùng allowlist hạn chế. Config app-server gốc
nên dùng `openai/gpt-*` với `agentRuntime.id: "codex"`.
Dùng `openai-codex/*` cho Codex OAuth qua PI. Các model ref legacy `codex/*`
vẫn là alias tương thích cho harness gốc.

Khi chế độ này chạy, Codex sở hữu id luồng gốc, hành vi resume,
compaction, và thực thi app-server. OpenClaw vẫn sở hữu chat channel,
bản sao transcript hiển thị, chính sách tool, phê duyệt, phân phối media, và lựa chọn
phiên. Dùng `agentRuntime.id: "codex"` không kèm override `fallback`
khi bạn cần chứng minh rằng chỉ đường dẫn Codex app-server mới có thể nhận lần chạy.
Các runtime plugin tường minh đã mặc định fail closed. Chỉ đặt `fallback: "pi"`
khi bạn cố ý muốn PI xử lý trường hợp thiếu lựa chọn harness. Lỗi Codex
app-server vốn đã fail trực tiếp thay vì thử lại qua PI.

## Tắt fallback PI

Theo mặc định, OpenClaw chạy agent nhúng với `agents.defaults.agentRuntime`
được đặt thành `{ id: "auto", fallback: "pi" }`. Trong chế độ `auto`, các plugin
harness đã đăng ký có thể nhận một cặp provider/model. Nếu không có cái nào khớp, OpenClaw fallback
về PI.

Trong chế độ `auto`, đặt `fallback: "none"` khi bạn cần việc thiếu lựa chọn plugin harness
fail thay vì dùng PI. Các runtime plugin tường minh như
`runtime: "codex"` đã mặc định fail closed, trừ khi `fallback: "pi"` được
đặt trong cùng phạm vi config hoặc override môi trường. Lỗi plugin harness đã chọn
luôn fail cứng. Điều này không chặn `runtime: "pi"` tường minh hoặc
`OPENCLAW_AGENT_RUNTIME=pi`.

Cho các lần chạy nhúng chỉ dành cho Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Nếu bạn muốn bất kỳ plugin harness đã đăng ký nào nhận các model khớp nhưng không bao giờ
muốn OpenClaw âm thầm fallback về PI, giữ `runtime: "auto"` và tắt
fallback:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Override theo từng agent dùng cùng hình dạng:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` vẫn override runtime đã cấu hình. Dùng
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` để tắt fallback PI từ
môi trường.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Khi fallback bị tắt, một phiên fail sớm khi harness được yêu cầu không được
đăng ký, không hỗ trợ provider/model đã phân giải, hoặc fail trước khi
tạo ra side effect của lượt. Điều đó là có chủ đích cho các triển khai chỉ dành cho Codex và
cho các bài kiểm thử live phải chứng minh rằng đường dẫn Codex app-server thực sự đang được dùng.

Thiết lập này chỉ kiểm soát agent harness nhúng. Nó không tắt
việc định tuyến model dành riêng cho provider của image, video, music, TTS, PDF, hoặc các loại khác.

## Phiên gốc và bản sao transcript

Một harness có thể giữ id phiên gốc, id luồng, hoặc token resume phía daemon.
Hãy giữ binding đó được liên kết rõ ràng với phiên OpenClaw, và tiếp tục
phản chiếu đầu ra assistant/tool mà người dùng nhìn thấy vào transcript OpenClaw.

Transcript OpenClaw vẫn là lớp tương thích cho:

- lịch sử phiên hiển thị qua channel
- tìm kiếm và lập chỉ mục transcript
- chuyển lại sang harness PI tích hợp sẵn ở lượt sau
- hành vi `/new`, `/reset`, và xóa phiên chung

Nếu harness của bạn lưu một binding sidecar, hãy triển khai `reset(...)` để OpenClaw có thể
xóa nó khi phiên OpenClaw sở hữu được reset.

## Kết quả tool và media

Phần lõi xây dựng danh sách công cụ OpenClaw và truyền danh sách đó vào lần thử đã chuẩn bị.
Khi một khung thực thi thực hiện lệnh gọi công cụ động, hãy trả kết quả công cụ lại qua
dạng kết quả của khung thực thi thay vì tự gửi phương tiện qua kênh.

Điều này giữ đầu ra văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và công cụ nhắn tin
trên cùng đường dẫn phân phối như các lượt chạy dựa trên PI.

## Hạn chế hiện tại

- Đường dẫn nhập công khai là chung, nhưng một số bí danh kiểu lần thử/kết quả vẫn
  mang tên `Pi` để tương thích.
- Cài đặt khung thực thi của bên thứ ba đang ở giai đoạn thử nghiệm. Hãy ưu tiên Plugin nhà cung cấp
  cho đến khi bạn cần runtime phiên gốc.
- Hỗ trợ chuyển đổi khung thực thi giữa các lượt. Không chuyển đổi khung thực thi ở
  giữa một lượt sau khi công cụ gốc, phê duyệt, văn bản của trợ lý hoặc thao tác
  gửi tin nhắn đã bắt đầu.

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview)
- [Trình trợ giúp Runtime](/vi/plugins/sdk-runtime)
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)
- [Khung thực thi Codex](/vi/plugins/codex-harness)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
