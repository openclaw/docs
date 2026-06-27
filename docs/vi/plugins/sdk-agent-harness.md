---
read_when:
    - Bạn đang thay đổi runtime tác tử nhúng hoặc sổ đăng ký harness
    - Bạn đang đăng ký một harness tác tử từ một plugin đi kèm hoặc đáng tin cậy
    - Bạn cần hiểu cách Plugin Codex liên quan đến các nhà cung cấp mô hình
sidebarTitle: Agent Harness
summary: Bề mặt SDK thử nghiệm cho các plugin thay thế bộ thực thi tác tử nhúng cấp thấp
title: Plugin harness tác tử
x-i18n:
    generated_at: "2026-06-27T17:57:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Một **harness tác tử** là trình thực thi cấp thấp cho một lượt tác tử OpenClaw đã được chuẩn bị. Đây không phải là nhà cung cấp mô hình, không phải là kênh, và không phải là sổ đăng ký công cụ. Để xem mô hình tư duy hướng người dùng, hãy xem [Runtime tác tử](/vi/concepts/agent-runtimes).

Chỉ dùng bề mặt này cho các Plugin gốc được đóng gói sẵn hoặc đáng tin cậy. Hợp đồng vẫn đang thử nghiệm vì các kiểu tham số cố ý phản chiếu runner nhúng hiện tại.

## Khi nào dùng harness

Đăng ký harness tác tử khi một họ mô hình có runtime phiên gốc riêng và transport nhà cung cấp OpenClaw thông thường là lớp trừu tượng không phù hợp.

Ví dụ:

- một máy chủ tác tử lập trình gốc sở hữu luồng và Compaction
- một CLI hoặc daemon cục bộ phải stream các sự kiện kế hoạch/lập luận/công cụ gốc
- một runtime mô hình cần resume id riêng ngoài bản ghi phiên OpenClaw

**Không** đăng ký harness chỉ để thêm một API LLM mới. Với các API mô hình HTTP hoặc WebSocket thông thường, hãy xây dựng [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins).

## Core vẫn sở hữu gì

Trước khi một harness được chọn, OpenClaw đã phân giải:

- nhà cung cấp và mô hình
- trạng thái xác thực runtime
- mức suy nghĩ và ngân sách ngữ cảnh
- tệp bản ghi/phiên OpenClaw
- workspace, sandbox, và chính sách công cụ
- callback trả lời kênh và callback streaming
- chính sách fallback mô hình và chuyển đổi mô hình trực tiếp

Cách tách này là có chủ đích. Harness chạy một lần thử đã được chuẩn bị; nó không chọn nhà cung cấp, thay thế việc phân phối kênh, hay âm thầm chuyển đổi mô hình.

Lần thử đã chuẩn bị cũng bao gồm `params.runtimePlan`, một gói chính sách do OpenClaw sở hữu cho các quyết định runtime phải được chia sẻ giữa OpenClaw và các harness gốc:

- `runtimePlan.tools.normalize(...)` và
  `runtimePlan.tools.logDiagnostics(...)` cho chính sách schema công cụ nhận biết nhà cung cấp
- `runtimePlan.transcript.resolvePolicy(...)` cho chính sách làm sạch bản ghi và sửa tool-call
- `runtimePlan.delivery.isSilentPayload(...)` cho việc chặn phân phối `NO_REPLY` và media dùng chung
- `runtimePlan.outcome.classifyRunResult(...)` cho phân loại fallback mô hình
- `runtimePlan.observability` cho metadata nhà cung cấp/mô hình/harness đã phân giải

Harness có thể dùng kế hoạch cho các quyết định cần khớp với hành vi OpenClaw, nhưng vẫn nên xem nó là trạng thái lần thử do host sở hữu. Không sửa đổi nó hoặc dùng nó để chuyển nhà cung cấp/mô hình trong một lượt.

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

OpenClaw chọn harness sau khi phân giải nhà cung cấp/mô hình:

1. Chính sách runtime theo phạm vi mô hình được ưu tiên.
2. Chính sách runtime theo phạm vi nhà cung cấp đứng tiếp theo.
3. `auto` hỏi các harness đã đăng ký liệu chúng có hỗ trợ nhà cung cấp/mô hình đã phân giải không.
4. Nếu không có harness đã đăng ký nào khớp, OpenClaw dùng runtime nhúng của nó.

Lỗi harness Plugin được hiển thị thành lỗi lượt chạy. Ở chế độ `auto`, fallback nhúng chỉ được dùng khi không có harness Plugin đã đăng ký nào hỗ trợ nhà cung cấp/mô hình đã phân giải. Khi một harness Plugin đã nhận một lượt chạy, OpenClaw không phát lại chính lượt đó qua runtime khác vì việc đó có thể thay đổi ngữ nghĩa xác thực/runtime hoặc nhân đôi tác dụng phụ.

Các ghim runtime toàn phiên và toàn tác tử bị bỏ qua khi chọn. Điều đó bao gồm các giá trị `agentHarnessId` phiên lỗi thời, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, và `OPENCLAW_AGENT_RUNTIME`. `/status` hiển thị runtime hiệu lực được chọn từ tuyến nhà cung cấp/mô hình. Nếu harness được chọn gây bất ngờ, hãy bật ghi log debug `agents/harness` và kiểm tra bản ghi có cấu trúc `agent harness selected` của Gateway. Bản ghi này bao gồm id harness được chọn, lý do chọn, chính sách runtime/fallback, và ở chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

Plugin Codex đóng gói sẵn đăng ký `codex` làm id harness của nó. Core xem đó như một id harness Plugin thông thường; các bí danh dành riêng cho Codex thuộc về Plugin hoặc cấu hình operator, không thuộc bộ chọn runtime dùng chung.

## Ghép cặp nhà cung cấp và harness

Hầu hết harness cũng nên đăng ký một nhà cung cấp. Nhà cung cấp làm cho ref mô hình, trạng thái xác thực, metadata mô hình, và lựa chọn `/model` hiển thị với phần còn lại của OpenClaw. Sau đó harness nhận nhà cung cấp đó trong `supports(...)`.

Plugin Codex đóng gói sẵn theo mẫu này:

- ref mô hình người dùng ưu tiên: `openai/gpt-5.5`
- ref tương thích: các ref `codex/gpt-*` legacy vẫn được chấp nhận, nhưng cấu hình mới không nên dùng chúng làm ref nhà cung cấp/mô hình thông thường
- id harness: `codex`
- xác thực: trạng thái sẵn sàng nhà cung cấp tổng hợp, vì harness Codex sở hữu đăng nhập/phiên Codex gốc
- yêu cầu app-server: OpenClaw gửi id mô hình trần cho Codex và để harness nói chuyện với giao thức app-server gốc

Plugin Codex là bổ sung. Các ref tác tử `openai/gpt-*` thuần trên nhà cung cấp OpenAI chính thức mặc định chọn harness Codex. Các ref `codex/gpt-*` cũ vẫn chọn nhà cung cấp và harness Codex để tương thích.

Để xem thiết lập operator, ví dụ tiền tố mô hình, và cấu hình chỉ dành cho Codex, hãy xem [Codex Harness](/vi/plugins/codex-harness).

OpenClaw yêu cầu Codex app-server `0.125.0` hoặc mới hơn. Plugin Codex kiểm tra handshake khởi tạo app-server và chặn các máy chủ cũ hơn hoặc không có phiên bản để OpenClaw chỉ chạy với bề mặt giao thức đã được kiểm thử. Mức sàn `0.125.0` bao gồm hỗ trợ payload hook MCP gốc đã xuất hiện trong Codex `0.124.0`, đồng thời ghim OpenClaw vào dòng ổn định mới hơn đã được kiểm thử.

### Middleware kết quả công cụ

Các Plugin đóng gói sẵn và Plugin đã cài đặt được bật rõ ràng với hợp đồng manifest khớp có thể gắn middleware kết quả công cụ trung lập runtime thông qua `api.registerAgentToolResultMiddleware(...)` khi manifest của chúng khai báo các id runtime mục tiêu trong `contracts.agentToolResultMiddleware`. Bề mặt đáng tin cậy này dành cho các biến đổi kết quả công cụ bất đồng bộ phải chạy trước khi OpenClaw hoặc Codex đưa đầu ra công cụ trở lại mô hình.

Các Plugin legacy đóng gói sẵn vẫn có thể dùng `api.registerCodexAppServerExtensionFactory(...)` cho middleware chỉ dành cho Codex app-server, nhưng các biến đổi kết quả mới nên dùng API trung lập runtime. Hook `api.registerEmbeddedExtensionFactory(...)` chỉ dành cho embedded-runner đã bị loại bỏ; các biến đổi kết quả công cụ nhúng phải dùng middleware trung lập runtime.

### Phân loại kết quả terminal

Các harness gốc sở hữu phép chiếu giao thức riêng có thể dùng `classifyAgentHarnessTerminalOutcome(...)` từ `openclaw/plugin-sdk/agent-harness-runtime` khi một lượt hoàn tất không tạo ra văn bản trợ lý hiển thị. Helper trả về `empty`, `reasoning-only`, hoặc `planning-only` để chính sách fallback của OpenClaw có thể quyết định có thử lại trên mô hình khác hay không. `planning-only` yêu cầu trường `planText` rõ ràng của harness; OpenClaw không suy luận nó từ văn xuôi của trợ lý. Helper cố ý không phân loại lỗi prompt, lượt đang chạy, và các trả lời im lặng có chủ đích như `NO_REPLY`.

### Tác dụng phụ khi tác tử kết thúc

Các harness gốc phải gọi `runAgentEndSideEffects(...)` từ `openclaw/plugin-sdk/agent-harness-runtime` sau khi chúng hoàn tất một lần thử. Nó dispatch hook `agent_end` portable và capture nghiên cứu của OpenClaw mà không trì hoãn các trả lời tương tác. Dùng `awaitAgentEndSideEffects(...)` cho các lượt chạy cục bộ, không tương tác, nơi lần thử không được resolve cho đến khi các tác dụng phụ đó hoàn tất. Cả hai helper đều chấp nhận payload `{ event, ctx }` giống `runAgentHarnessAgentEndHook(...)`; lỗi của chúng không làm thay đổi kết quả lần thử đã hoàn tất.

### Đầu vào người dùng và bề mặt công cụ

Các harness gốc cung cấp yêu cầu đầu vào người dùng cấp runtime nên dùng các helper đầu vào người dùng từ `openclaw/plugin-sdk/agent-harness-runtime` để định dạng prompt, phân phối nó qua đường dẫn trả lời chặn của OpenClaw, và chuẩn hóa các câu trả lời lựa chọn/tự do trở lại hình dạng phản hồi gốc của runtime. Helper giữ phần trình bày kênh/TUI nhất quán trong khi mỗi harness giữ vòng đời phân tích giao thức và yêu cầu đang chờ riêng.

Các harness gốc cần định tuyến công cụ gọn kiểu PI nên dùng `createAgentHarnessToolSurfaceRuntime(...)` từ `openclaw/plugin-sdk/agent-harness-tool-runtime`. Nó sở hữu lựa chọn điều khiển tìm kiếm công cụ/chế độ mã, mặc định nhẹ cho mô hình cục bộ, lọc schema tương thích runtime, thực thi catalog ẩn, nạp thư mục, và dọn dẹp catalog. Harness vẫn sở hữu việc chuyển đổi công cụ dành riêng cho SDK và callback thực thi gốc.

### Chế độ harness Codex gốc

Harness `codex` đóng gói sẵn là chế độ Codex gốc cho các lượt tác tử OpenClaw nhúng. Trước tiên hãy bật Plugin `codex` đóng gói sẵn, và bao gồm `codex` trong `plugins.allow` nếu cấu hình của bạn dùng allowlist hạn chế. Cấu hình app-server gốc nên dùng `openai/gpt-*`; các lượt tác tử OpenAI chọn harness Codex theo mặc định. Các tuyến ref mô hình Codex legacy nên được sửa bằng `openclaw doctor --fix`, và các ref mô hình `codex/*` legacy vẫn là bí danh tương thích cho harness gốc.

Khi chế độ này chạy, Codex sở hữu id luồng gốc, hành vi resume, Compaction, và thực thi app-server. OpenClaw vẫn sở hữu kênh chat, bản sao bản ghi hiển thị, chính sách công cụ, phê duyệt, phân phối media, và lựa chọn phiên. Dùng nhà cung cấp/mô hình `agentRuntime.id: "codex"` khi bạn cần chứng minh rằng chỉ đường dẫn Codex app-server mới có thể nhận lượt chạy. Runtime Plugin rõ ràng sẽ fail closed; lỗi chọn Codex app-server và lỗi runtime không được thử lại qua runtime khác.

## Độ nghiêm ngặt runtime

Theo mặc định, OpenClaw dùng chính sách runtime nhà cung cấp/mô hình `auto`: các harness Plugin đã đăng ký có thể nhận một cặp nhà cung cấp/mô hình, và runtime nhúng xử lý lượt khi không có harness nào khớp. Ref tác tử OpenAI trên nhà cung cấp OpenAI chính thức mặc định dùng Codex. Dùng một runtime Plugin nhà cung cấp/mô hình rõ ràng như `agentRuntime.id: "codex"` khi việc thiếu lựa chọn harness nên thất bại thay vì định tuyến qua runtime nhúng. Lỗi harness Plugin đã chọn luôn thất bại cứng. Điều này không chặn một `agentRuntime.id: "openclaw"` nhà cung cấp/mô hình rõ ràng.

Cho các lượt chạy nhúng chỉ dành cho Codex:

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
      "model": "openai/gpt-5.5"
    }
  }
}
```

Nếu bạn muốn một backend CLI cho một mô hình chuẩn duy nhất, hãy đặt runtime trên mục mô hình đó:

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

Ghi đè theo từng tác tử dùng cùng hình dạng theo phạm vi mô hình:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Các ví dụ runtime toàn tác tử legacy như thế này bị bỏ qua:

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

Với thời gian chạy Plugin rõ ràng, một phiên sẽ thất bại sớm khi bộ khung chạy được yêu cầu chưa được đăng ký, không hỗ trợ nhà cung cấp/mô hình đã phân giải, hoặc thất bại trước khi tạo ra tác dụng phụ của lượt. Điều đó là chủ ý đối với các triển khai chỉ dùng Codex và các bài kiểm thử trực tiếp cần chứng minh rằng đường dẫn máy chủ ứng dụng Codex thực sự đang được sử dụng.

Thiết lập này chỉ kiểm soát bộ khung tác tử nhúng. Nó không vô hiệu hóa định tuyến mô hình dành riêng cho nhà cung cấp đối với hình ảnh, video, nhạc, TTS, PDF hoặc các loại khác.

## Phiên gốc và bản sao transcript

Một bộ khung chạy có thể giữ một ID phiên gốc, ID luồng hoặc token tiếp tục phía daemon. Hãy giữ liên kết đó được gắn rõ ràng với phiên OpenClaw, đồng thời tiếp tục sao chép đầu ra trợ lý/công cụ hiển thị với người dùng vào transcript OpenClaw.

Transcript OpenClaw vẫn là lớp tương thích cho:

- lịch sử phiên hiển thị trên kênh
- tìm kiếm và lập chỉ mục transcript
- chuyển lại sang bộ khung OpenClaw tích hợp sẵn ở một lượt sau
- hành vi chung của `/new`, `/reset` và xóa phiên

Nếu bộ khung chạy của bạn lưu một liên kết sidecar, hãy triển khai `reset(...)` để OpenClaw có thể xóa liên kết đó khi phiên OpenClaw sở hữu nó được đặt lại.

## Kết quả công cụ và phương tiện

Core xây dựng danh sách công cụ OpenClaw và truyền danh sách đó vào lần thử đã chuẩn bị. Khi một bộ khung chạy thực thi một lệnh gọi công cụ động, hãy trả kết quả công cụ lại thông qua dạng kết quả của bộ khung chạy thay vì tự gửi phương tiện qua kênh.

Điều này giữ đầu ra văn bản, hình ảnh, video, nhạc, TTS, phê duyệt và công cụ nhắn tin trên cùng đường dẫn phân phối như các lần chạy do OpenClaw hỗ trợ.

## Giới hạn hiện tại

- Đường dẫn import công khai là chung, nhưng một số bí danh kiểu lần thử/kết quả vẫn mang tên cũ để tương thích.
- Việc cài đặt bộ khung chạy của bên thứ ba còn mang tính thử nghiệm. Hãy ưu tiên Plugin nhà cung cấp cho đến khi bạn cần một thời gian chạy phiên gốc.
- Việc chuyển đổi bộ khung chạy được hỗ trợ giữa các lượt. Không chuyển đổi bộ khung chạy ở giữa một lượt sau khi các công cụ gốc, phê duyệt, văn bản trợ lý hoặc gửi tin nhắn đã bắt đầu.

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview)
- [Trình trợ giúp thời gian chạy](/vi/plugins/sdk-runtime)
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)
- [Bộ khung chạy Codex](/vi/plugins/codex-harness)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
