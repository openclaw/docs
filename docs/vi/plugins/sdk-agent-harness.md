---
read_when:
    - Bạn đang thay đổi môi trường chạy tác nhân nhúng hoặc sổ đăng ký bộ khung kiểm thử
    - Bạn đang đăng ký một bộ khung tác nhân từ một Plugin đi kèm hoặc đáng tin cậy
    - Bạn cần hiểu mối quan hệ giữa Plugin Codex và các nhà cung cấp mô hình
sidebarTitle: Agent Harness
summary: Giao diện SDK thử nghiệm cho các Plugin thay thế bộ thực thi agent nhúng cấp thấp
title: Các Plugin cho bộ khung tác nhân
x-i18n:
    generated_at: "2026-05-07T13:22:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**agent harness** là bộ thực thi cấp thấp cho một lượt tác tử OpenClaw đã được chuẩn bị. Nó không phải là nhà cung cấp mô hình, không phải kênh, và không phải sổ đăng ký công cụ. Với mô hình tư duy hướng đến người dùng, xem [runtime tác tử](/vi/concepts/agent-runtimes).

Chỉ dùng bề mặt này cho các Plugin native được đóng gói sẵn hoặc đáng tin cậy. Hợp đồng vẫn còn thử nghiệm vì các kiểu tham số cố ý phản ánh runner nhúng hiện tại.

## Khi nào dùng harness

Đăng ký agent harness khi một họ mô hình có runtime phiên native riêng và lớp truyền tải provider OpenClaw thông thường là trừu tượng sai.

Ví dụ:

- một server tác tử lập trình native sở hữu luồng và compaction
- một CLI cục bộ hoặc daemon phải stream các sự kiện kế hoạch/lập luận/công cụ native
- một runtime mô hình cần resume id riêng bên cạnh transcript phiên OpenClaw

**Không** đăng ký harness chỉ để thêm một API LLM mới. Với các API mô hình HTTP hoặc WebSocket thông thường, hãy xây dựng [Plugin provider](/vi/plugins/sdk-provider-plugins).

## Core vẫn sở hữu gì

Trước khi một harness được chọn, OpenClaw đã phân giải:

- provider và mô hình
- trạng thái xác thực runtime
- mức thinking và ngân sách ngữ cảnh
- tệp transcript/phiên OpenClaw
- workspace, sandbox, và chính sách công cụ
- callback trả lời kênh và callback streaming
- chính sách fallback mô hình và chuyển mô hình live

Sự phân tách đó là có chủ ý. Harness chạy một lần thử đã chuẩn bị; nó không chọn provider, thay thế việc phân phối qua kênh, hoặc âm thầm chuyển mô hình.

Lần thử đã chuẩn bị cũng bao gồm `params.runtimePlan`, một gói chính sách do OpenClaw sở hữu cho các quyết định runtime phải được chia sẻ giữa PI và các harness native:

- `runtimePlan.tools.normalize(...)` và
  `runtimePlan.tools.logDiagnostics(...)` cho chính sách schema công cụ nhận biết provider
- `runtimePlan.transcript.resolvePolicy(...)` cho chính sách làm sạch transcript và sửa chữa tool-call
- `runtimePlan.delivery.isSilentPayload(...)` cho việc triệt tiêu phân phối media và `NO_REPLY` dùng chung
- `runtimePlan.outcome.classifyRunResult(...)` cho phân loại fallback mô hình
- `runtimePlan.observability` cho metadata provider/mô hình/harness đã phân giải

Harness có thể dùng plan cho các quyết định cần khớp với hành vi PI, nhưng vẫn nên xem nó là trạng thái lần thử do host sở hữu. Không sửa đổi nó hoặc dùng nó để chuyển provider/mô hình bên trong một lượt.

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

## Chính sách lựa chọn

OpenClaw chọn harness sau khi phân giải provider/mô hình:

1. Harness id đã ghi của một phiên hiện có được ưu tiên, để thay đổi config/env không hot-switch transcript đó sang runtime khác.
2. `OPENCLAW_AGENT_RUNTIME=<id>` ép dùng một harness đã đăng ký với id đó cho các phiên chưa được ghim.
3. `OPENCLAW_AGENT_RUNTIME=pi` ép dùng harness PI tích hợp.
4. `OPENCLAW_AGENT_RUNTIME=auto` hỏi các harness đã đăng ký xem chúng có hỗ trợ provider/mô hình đã phân giải không.
5. Nếu không có harness đã đăng ký nào khớp, OpenClaw dùng PI trừ khi fallback PI bị tắt.

Lỗi harness Plugin hiển thị như lỗi chạy. Trong chế độ `auto`, fallback PI chỉ được dùng khi không có harness Plugin đã đăng ký nào hỗ trợ provider/mô hình đã phân giải. Sau khi một harness Plugin đã nhận một lần chạy, OpenClaw không phát lại cùng lượt đó qua PI vì điều đó có thể thay đổi ngữ nghĩa xác thực/runtime hoặc nhân đôi tác dụng phụ.

Harness id đã chọn được lưu bền cùng session id sau một lần chạy nhúng. Các phiên legacy được tạo trước khi có ghim harness được xem là đã ghim PI sau khi chúng có lịch sử transcript. Dùng phiên mới/đã reset khi chuyển giữa PI và một harness Plugin native. `/status` hiển thị các harness id không mặc định như `codex` bên cạnh `Fast`; PI vẫn ẩn vì đó là đường dẫn tương thích mặc định. Nếu harness đã chọn gây bất ngờ, hãy bật logging debug `agents/harness` và kiểm tra bản ghi có cấu trúc `agent harness selected` của gateway. Bản ghi này bao gồm harness id đã chọn, lý do lựa chọn, chính sách runtime/fallback, và trong chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

Plugin Codex được đóng gói sẵn đăng ký `codex` làm harness id. Core xem đó là một harness id Plugin bình thường; các alias riêng của Codex thuộc về Plugin hoặc config của operator, không nằm trong bộ chọn runtime dùng chung.

## Ghép cặp provider và harness

Hầu hết harness cũng nên đăng ký một provider. Provider làm cho model ref, trạng thái xác thực, metadata mô hình, và lựa chọn `/model` hiển thị với phần còn lại của OpenClaw. Sau đó harness nhận provider đó trong `supports(...)`.

Plugin Codex được đóng gói sẵn theo mẫu này:

- model ref người dùng ưu tiên: `openai/gpt-5.5` cộng với
  `agentRuntime.id: "codex"`
- ref tương thích: các ref legacy `codex/gpt-*` vẫn được chấp nhận, nhưng config mới không nên dùng chúng như ref provider/mô hình thông thường
- harness id: `codex`
- xác thực: tính khả dụng provider tổng hợp, vì harness Codex sở hữu phiên/đăng nhập Codex native
- yêu cầu app-server: OpenClaw gửi model id trần đến Codex và để harness nói chuyện với giao thức app-server native

Plugin Codex là phần bổ sung. Các ref `openai/gpt-*` thuần vẫn tiếp tục dùng đường dẫn provider OpenClaw thông thường trừ khi bạn ép dùng harness Codex bằng `agentRuntime.id: "codex"`. Các ref `codex/gpt-*` cũ vẫn chọn provider và harness Codex để tương thích.

Để biết cách thiết lập operator, ví dụ tiền tố mô hình, và config chỉ dành cho Codex, xem [Codex Harness](/vi/plugins/codex-harness).

OpenClaw yêu cầu Codex app-server `0.125.0` hoặc mới hơn. Plugin Codex kiểm tra handshake initialize của app-server và chặn các server cũ hơn hoặc không có phiên bản để OpenClaw chỉ chạy trên bề mặt giao thức đã được kiểm thử. Mức sàn `0.125.0` bao gồm hỗ trợ payload hook MCP native đã hạ cánh trong Codex `0.124.0`, đồng thời ghim OpenClaw vào dòng ổn định mới hơn đã được kiểm thử.

### Middleware kết quả công cụ

Plugin được đóng gói sẵn có thể gắn middleware kết quả công cụ trung lập runtime thông qua `api.registerAgentToolResultMiddleware(...)` khi manifest của chúng khai báo các runtime id được nhắm mục tiêu trong `contracts.agentToolResultMiddleware`. Seam đáng tin cậy này dành cho các biến đổi kết quả công cụ async phải chạy trước khi PI hoặc Codex đưa output công cụ trở lại mô hình.

Các Plugin legacy được đóng gói sẵn vẫn có thể dùng `api.registerCodexAppServerExtensionFactory(...)` cho middleware chỉ dành cho Codex app-server, nhưng các biến đổi kết quả mới nên dùng API trung lập runtime. Hook chỉ dành cho Pi `api.registerEmbeddedExtensionFactory(...)` đã bị xóa; các biến đổi kết quả công cụ Pi phải dùng middleware trung lập runtime.

### Phân loại kết quả terminal

Harness native sở hữu phép chiếu giao thức riêng có thể dùng `classifyAgentHarnessTerminalOutcome(...)` từ `openclaw/plugin-sdk/agent-harness-runtime` khi một lượt đã hoàn tất không tạo ra văn bản assistant hiển thị. Helper trả về `empty`, `reasoning-only`, hoặc `planning-only` để chính sách fallback của OpenClaw có thể quyết định có thử lại trên mô hình khác không. Nó cố ý không phân loại lỗi prompt, các lượt đang chạy, và các trả lời im lặng có chủ ý như `NO_REPLY`.

### Chế độ harness Codex native

Harness `codex` được đóng gói sẵn là chế độ Codex native cho các lượt tác tử OpenClaw nhúng. Trước tiên hãy bật Plugin `codex` được đóng gói sẵn, và thêm `codex` vào `plugins.allow` nếu config của bạn dùng allowlist hạn chế. Config app-server native nên dùng `openai/gpt-*`; các lượt tác tử OpenAI chọn harness Codex theo mặc định. Các route legacy `openai-codex/*` nên được sửa bằng `openclaw doctor --fix`, và các model ref legacy `codex/*` vẫn là alias tương thích cho harness native.

Khi chế độ này chạy, Codex sở hữu native thread id, hành vi resume, compaction, và thực thi app-server. OpenClaw vẫn sở hữu kênh chat, bản sao transcript hiển thị, chính sách công cụ, phê duyệt, phân phối media, và lựa chọn phiên. Dùng `agentRuntime.id: "codex"` khi bạn cần chứng minh rằng chỉ đường dẫn Codex app-server mới có thể nhận lần chạy. Runtime Plugin tường minh fail closed; lỗi lựa chọn Codex app-server và lỗi runtime không được thử lại qua PI.

## Độ nghiêm ngặt runtime

Theo mặc định, OpenClaw chạy tác tử nhúng với OpenClaw Pi. Trong chế độ `auto`, các harness Plugin đã đăng ký có thể nhận một cặp provider/mô hình, và PI xử lý lượt khi không có cặp nào khớp. Dùng runtime Plugin tường minh như `agentRuntime.id: "codex"` khi việc thiếu lựa chọn harness nên thất bại thay vì định tuyến qua PI. Lỗi harness Plugin đã chọn luôn thất bại cứng. Điều này không chặn `agentRuntime.id: "pi"` hoặc `OPENCLAW_AGENT_RUNTIME=pi` tường minh.

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

Nếu bạn muốn bất kỳ harness Plugin đã đăng ký nào nhận các mô hình khớp và nếu không thì dùng PI, đặt `id: "auto"`:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

Override theo từng tác tử dùng cùng hình dạng:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` vẫn override runtime đã cấu hình.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Với runtime Plugin tường minh, một phiên thất bại sớm khi harness được yêu cầu chưa được đăng ký, không hỗ trợ provider/mô hình đã phân giải, hoặc thất bại trước khi tạo tác dụng phụ của lượt. Điều đó là có chủ ý cho các triển khai chỉ dành cho Codex và cho live test phải chứng minh rằng đường dẫn Codex app-server thực sự đang được dùng.

Thiết lập này chỉ điều khiển agent harness nhúng. Nó không tắt định tuyến mô hình riêng theo provider cho hình ảnh, video, nhạc, TTS, PDF, hoặc các loại khác.

## Phiên native và bản sao transcript

Một harness có thể giữ native session id, thread id, hoặc resume token phía daemon. Hãy giữ ràng buộc đó được liên kết rõ ràng với phiên OpenClaw, và tiếp tục sao chép output assistant/công cụ hiển thị với người dùng vào transcript OpenClaw.

Transcript OpenClaw vẫn là lớp tương thích cho:

- lịch sử phiên hiển thị trên kênh
- tìm kiếm và lập chỉ mục transcript
- chuyển lại sang harness PI tích hợp ở lượt sau
- hành vi `/new`, `/reset`, và xóa phiên chung

Nếu harness của bạn lưu một ràng buộc sidecar, hãy triển khai `reset(...)` để OpenClaw có thể xóa nó khi phiên OpenClaw sở hữu được reset.

## Kết quả công cụ và media

Core dựng danh sách công cụ OpenClaw và truyền nó vào lần thử đã chuẩn bị. Khi một harness thực thi một lệnh gọi công cụ động, hãy trả kết quả công cụ trở lại qua shape kết quả harness thay vì tự gửi media qua kênh.

Điều này giữ output văn bản, hình ảnh, video, nhạc, TTS, phê duyệt, và công cụ nhắn tin trên cùng đường dẫn phân phối như các lần chạy được PI hỗ trợ.

## Giới hạn hiện tại

- Đường dẫn import công khai là dạng tổng quát, nhưng một số type alias cho attempt/result vẫn
  mang tên `Pi` để tương thích.
- Cài đặt harness của bên thứ ba còn mang tính thử nghiệm. Ưu tiên các Plugin nhà cung cấp
  cho đến khi bạn cần runtime phiên gốc.
- Hỗ trợ chuyển harness giữa các lượt. Không chuyển harness ở
  giữa một lượt sau khi các công cụ gốc, phê duyệt, văn bản trợ lý, hoặc
  lượt gửi tin nhắn đã bắt đầu.

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview)
- [Trình trợ giúp thời gian chạy](/vi/plugins/sdk-runtime)
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)
- [Harness Codex](/vi/plugins/codex-harness)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
