---
read_when:
    - Bạn đang thay đổi môi trường thực thi tác nhân nhúng hoặc sổ đăng ký bộ khung kiểm thử
    - Bạn đang đăng ký một bộ khung tác nhân từ một Plugin được đóng gói kèm hoặc đáng tin cậy
    - Bạn cần hiểu cách Plugin Codex liên quan đến các nhà cung cấp mô hình
sidebarTitle: Agent Harness
summary: Giao diện SDK thử nghiệm dành cho Plugin thay thế bộ thực thi tác nhân nhúng cấp thấp
title: Plugin cho bộ khung tác tử
x-i18n:
    generated_at: "2026-05-02T10:49:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Một **agent harness** là trình thực thi cấp thấp cho một lượt agent OpenClaw đã được chuẩn bị. Nó không phải là nhà cung cấp mô hình, không phải là kênh, và không phải là registry công cụ. Để xem mô hình khái niệm hướng người dùng, hãy xem [Runtime agent](/vi/concepts/agent-runtimes).

Chỉ sử dụng bề mặt này cho các plugin gốc đi kèm hoặc đáng tin cậy. Hợp đồng vẫn đang thử nghiệm vì các kiểu tham số cố ý phản ánh runner nhúng hiện tại.

## Khi nào dùng harness

Đăng ký agent harness khi một họ mô hình có runtime phiên gốc riêng và transport nhà cung cấp OpenClaw thông thường không phải là trừu tượng phù hợp.

Ví dụ:

- một máy chủ coding-agent gốc sở hữu thread và compaction
- một CLI hoặc daemon cục bộ phải stream các sự kiện kế hoạch/lập luận/công cụ gốc
- một runtime mô hình cần resume id riêng ngoài transcript phiên OpenClaw

Không **đăng ký** harness chỉ để thêm một API LLM mới. Với API mô hình HTTP hoặc WebSocket thông thường, hãy xây dựng [provider plugin](/vi/plugins/sdk-provider-plugins).

## Core vẫn sở hữu những gì

Trước khi một harness được chọn, OpenClaw đã phân giải:

- nhà cung cấp và mô hình
- trạng thái xác thực runtime
- mức suy nghĩ và ngân sách ngữ cảnh
- tệp transcript/phiên OpenClaw
- workspace, sandbox, và chính sách công cụ
- callback trả lời kênh và callback streaming
- chính sách fallback mô hình và chuyển đổi mô hình live

Sự phân tách đó là có chủ ý. Harness chạy một lần thử đã được chuẩn bị; nó không chọn nhà cung cấp, thay thế cơ chế gửi kênh, hoặc âm thầm chuyển đổi mô hình.

Lần thử đã chuẩn bị cũng bao gồm `params.runtimePlan`, một gói chính sách do OpenClaw sở hữu cho các quyết định runtime phải được dùng chung giữa PI và các harness gốc:

- `runtimePlan.tools.normalize(...)` và
  `runtimePlan.tools.logDiagnostics(...)` cho chính sách schema công cụ nhận biết nhà cung cấp
- `runtimePlan.transcript.resolvePolicy(...)` cho chính sách làm sạch transcript và sửa lời gọi công cụ
- `runtimePlan.delivery.isSilentPayload(...)` cho cơ chế dùng chung để chặn gửi `NO_REPLY` và media
- `runtimePlan.outcome.classifyRunResult(...)` cho phân loại fallback mô hình
- `runtimePlan.observability` cho metadata nhà cung cấp/mô hình/harness đã phân giải

Harness có thể dùng kế hoạch cho các quyết định cần khớp với hành vi PI, nhưng vẫn nên xem nó là trạng thái lần thử do host sở hữu. Không mutate nó hoặc dùng nó để chuyển nhà cung cấp/mô hình bên trong một lượt.

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

OpenClaw chọn harness sau khi phân giải nhà cung cấp/mô hình:

1. Id harness đã ghi của một phiên hiện có được ưu tiên, vì vậy thay đổi config/env sẽ không hot-switch transcript đó sang runtime khác.
2. `OPENCLAW_AGENT_RUNTIME=<id>` buộc dùng harness đã đăng ký với id đó cho các phiên chưa được pin.
3. `OPENCLAW_AGENT_RUNTIME=pi` buộc dùng harness PI tích hợp.
4. `OPENCLAW_AGENT_RUNTIME=auto` hỏi các harness đã đăng ký xem chúng có hỗ trợ nhà cung cấp/mô hình đã phân giải hay không.
5. Nếu không có harness đã đăng ký nào khớp, OpenClaw dùng PI trừ khi fallback PI bị tắt.

Lỗi harness plugin xuất hiện dưới dạng lỗi chạy. Ở chế độ `auto`, fallback PI chỉ được dùng khi không có harness plugin đã đăng ký nào hỗ trợ nhà cung cấp/mô hình đã phân giải. Sau khi một harness plugin đã nhận một lần chạy, OpenClaw không phát lại chính lượt đó qua PI vì điều đó có thể thay đổi ngữ nghĩa xác thực/runtime hoặc nhân đôi side effect.

Id harness đã chọn được lưu bền cùng id phiên sau một lần chạy nhúng. Các phiên legacy được tạo trước khi có pin harness được xem là đã pin PI sau khi có lịch sử transcript. Dùng một phiên mới/reset khi chuyển giữa PI và harness plugin gốc. `/status` hiển thị các id harness không mặc định như `codex` bên cạnh `Fast`; PI vẫn bị ẩn vì đó là đường dẫn tương thích mặc định. Nếu harness đã chọn gây bất ngờ, bật debug logging `agents/harness` và kiểm tra bản ghi có cấu trúc `agent harness selected` của gateway. Bản ghi này bao gồm id harness đã chọn, lý do lựa chọn, chính sách runtime/fallback, và, ở chế độ `auto`, kết quả hỗ trợ của từng ứng viên plugin.

Plugin Codex đi kèm đăng ký `codex` làm id harness. Core xem đó là một id harness plugin thông thường; alias riêng cho Codex thuộc về plugin hoặc config operator, không thuộc bộ chọn runtime dùng chung.

## Ghép cặp nhà cung cấp với harness

Hầu hết harness cũng nên đăng ký một nhà cung cấp. Nhà cung cấp làm cho model refs, trạng thái xác thực, metadata mô hình, và lựa chọn `/model` hiển thị với phần còn lại của OpenClaw. Sau đó harness nhận nhà cung cấp đó trong `supports(...)`.

Plugin Codex đi kèm tuân theo mẫu này:

- model refs người dùng ưu tiên: `openai/gpt-5.5` cộng với
  `agentRuntime.id: "codex"`
- refs tương thích: refs legacy `codex/gpt-*` vẫn được chấp nhận, nhưng config mới không nên dùng chúng làm refs nhà cung cấp/mô hình thông thường
- id harness: `codex`
- xác thực: trạng thái khả dụng nhà cung cấp tổng hợp, vì harness Codex sở hữu login/phiên Codex gốc
- yêu cầu app-server: OpenClaw gửi id mô hình trần đến Codex và để harness giao tiếp với giao thức app-server gốc

Plugin Codex là bổ sung. Refs `openai/gpt-*` thuần tiếp tục dùng đường dẫn nhà cung cấp OpenClaw thông thường trừ khi bạn buộc dùng harness Codex bằng `agentRuntime.id: "codex"`. Refs `codex/gpt-*` cũ vẫn chọn nhà cung cấp và harness Codex để tương thích.

Để xem thiết lập operator, ví dụ tiền tố mô hình, và config chỉ dành cho Codex, hãy xem [Codex Harness](/vi/plugins/codex-harness).

OpenClaw yêu cầu Codex app-server `0.125.0` trở lên. Plugin Codex kiểm tra handshake khởi tạo app-server và chặn các máy chủ cũ hơn hoặc không có phiên bản để OpenClaw chỉ chạy trên bề mặt giao thức đã được kiểm thử. Mức sàn `0.125.0` bao gồm hỗ trợ payload hook MCP gốc đã có trong Codex `0.124.0`, đồng thời pin OpenClaw vào nhánh ổn định mới hơn đã được kiểm thử.

### Middleware kết quả công cụ

Plugin đi kèm có thể gắn middleware kết quả công cụ trung lập runtime thông qua `api.registerAgentToolResultMiddleware(...)` khi manifest khai báo các id runtime mục tiêu trong `contracts.agentToolResultMiddleware`. Seam đáng tin cậy này dành cho các biến đổi kết quả công cụ bất đồng bộ phải chạy trước khi PI hoặc Codex đưa output công cụ trở lại mô hình.

Plugin legacy đi kèm vẫn có thể dùng `api.registerCodexAppServerExtensionFactory(...)` cho middleware chỉ dành cho app-server Codex, nhưng các biến đổi kết quả mới nên dùng API trung lập runtime. Hook chỉ dành cho Pi `api.registerEmbeddedExtensionFactory(...)` đã bị gỡ bỏ; biến đổi kết quả công cụ Pi phải dùng middleware trung lập runtime.

### Phân loại kết quả kết thúc

Các harness gốc sở hữu phần chiếu giao thức riêng có thể dùng `classifyAgentHarnessTerminalOutcome(...)` từ `openclaw/plugin-sdk/agent-harness-runtime` khi một lượt đã hoàn tất không tạo ra văn bản assistant hiển thị. Helper trả về `empty`, `reasoning-only`, hoặc `planning-only` để chính sách fallback của OpenClaw có thể quyết định có thử lại trên mô hình khác hay không. Nó cố ý không phân loại lỗi prompt, lượt đang chạy, và các câu trả lời im lặng có chủ ý như `NO_REPLY`.

### Chế độ harness Codex gốc

Harness `codex` đi kèm là chế độ Codex gốc cho các lượt agent OpenClaw nhúng. Trước tiên hãy bật plugin `codex` đi kèm, và đưa `codex` vào `plugins.allow` nếu config của bạn dùng allowlist hạn chế. Config app-server gốc nên dùng `openai/gpt-*` với `agentRuntime.id: "codex"`. Dùng `openai-codex/*` cho Codex OAuth qua PI. Model refs legacy `codex/*` vẫn là alias tương thích cho harness gốc.

Khi chế độ này chạy, Codex sở hữu id thread gốc, hành vi resume, compaction, và thực thi app-server. OpenClaw vẫn sở hữu kênh chat, bản sao transcript hiển thị, chính sách công cụ, phê duyệt, gửi media, và lựa chọn phiên. Dùng `agentRuntime.id: "codex"` không kèm override `fallback` khi bạn cần chứng minh rằng chỉ đường dẫn app-server Codex mới có thể nhận lần chạy. Runtime plugin rõ ràng đã fail closed theo mặc định. Chỉ đặt `fallback: "pi"` khi bạn cố ý muốn PI xử lý trường hợp thiếu lựa chọn harness. Lỗi app-server Codex đã fail trực tiếp thay vì thử lại qua PI.

## Tắt fallback PI

Theo mặc định, OpenClaw chạy agent nhúng với `agents.defaults.agentRuntime` được đặt thành `{ id: "auto", fallback: "pi" }`. Ở chế độ `auto`, các harness plugin đã đăng ký có thể nhận một cặp nhà cung cấp/mô hình. Nếu không có cặp nào khớp, OpenClaw fallback về PI.

Ở chế độ `auto`, đặt `fallback: "none"` khi bạn cần việc thiếu lựa chọn harness plugin phải thất bại thay vì dùng PI. Runtime plugin rõ ràng như `agentRuntime.id: "codex"` đã fail closed theo mặc định, trừ khi `fallback: "pi"` được đặt trong cùng phạm vi config hoặc override môi trường. Lỗi harness plugin đã chọn luôn fail cứng. Điều này không chặn `agentRuntime.id: "pi"` hoặc `OPENCLAW_AGENT_RUNTIME=pi` rõ ràng.

Cho các lần chạy nhúng chỉ dùng Codex:

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

Nếu bạn muốn bất kỳ harness plugin đã đăng ký nào cũng có thể nhận các mô hình khớp nhưng không bao giờ muốn OpenClaw âm thầm fallback về PI, giữ `runtime: "auto"` và tắt fallback:

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

`OPENCLAW_AGENT_RUNTIME` vẫn override runtime đã cấu hình. Dùng `OPENCLAW_AGENT_HARNESS_FALLBACK=none` để tắt fallback PI từ môi trường.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Khi fallback bị tắt, một phiên fail sớm nếu harness được yêu cầu chưa được đăng ký, không hỗ trợ nhà cung cấp/mô hình đã phân giải, hoặc fail trước khi tạo side effect của lượt. Điều đó là có chủ ý cho các triển khai chỉ dùng Codex và cho live test cần chứng minh đường dẫn app-server Codex thực sự đang được sử dụng.

Thiết lập này chỉ kiểm soát harness agent nhúng. Nó không tắt định tuyến mô hình dành riêng cho nhà cung cấp đối với hình ảnh, video, nhạc, TTS, PDF, hoặc các loại khác.

## Phiên gốc và bản sao transcript

Harness có thể giữ id phiên gốc, id thread, hoặc token resume phía daemon. Giữ binding đó được liên kết rõ ràng với phiên OpenClaw, và tiếp tục mirror output assistant/công cụ mà người dùng nhìn thấy vào transcript OpenClaw.

Transcript OpenClaw vẫn là lớp tương thích cho:

- lịch sử phiên hiển thị trên kênh
- tìm kiếm và lập chỉ mục transcript
- chuyển lại về harness PI tích hợp ở lượt sau
- hành vi `/new`, `/reset`, và xóa phiên chung

Nếu harness của bạn lưu một binding sidecar, triển khai `reset(...)` để OpenClaw có thể xóa nó khi phiên OpenClaw sở hữu được reset.

## Kết quả công cụ và media

Core xây dựng danh sách công cụ OpenClaw và chuyển nó vào lượt thử đã chuẩn bị.
Khi một harness thực thi lời gọi công cụ động, hãy trả kết quả công cụ trở lại qua
dạng kết quả của harness thay vì tự gửi phương tiện qua kênh.

Điều này giữ đầu ra văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và công cụ nhắn tin
trên cùng đường dẫn phân phối như các lượt chạy được PI hỗ trợ.

## Hạn chế hiện tại

- Đường dẫn import công khai có tính chung, nhưng một số bí danh kiểu attempt/result vẫn
  mang tên `Pi` để tương thích.
- Việc cài đặt harness của bên thứ ba đang ở giai đoạn thử nghiệm. Ưu tiên Plugin nhà cung cấp
  cho đến khi bạn cần runtime phiên gốc.
- Hỗ trợ chuyển harness giữa các lượt. Không chuyển harness ở
  giữa một lượt sau khi công cụ gốc, phê duyệt, văn bản trợ lý hoặc thao tác gửi tin nhắn
  đã bắt đầu.

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview)
- [Trình trợ giúp runtime](/vi/plugins/sdk-runtime)
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)
- [Codex Harness](/vi/plugins/codex-harness)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
