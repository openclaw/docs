---
read_when:
    - Bạn đang thay đổi môi trường chạy tác tử nhúng hoặc sổ đăng ký bộ khung
    - Bạn đang đăng ký một bộ khung tác nhân từ một Plugin được đóng gói kèm hoặc đáng tin cậy
    - Bạn cần hiểu mối quan hệ giữa Plugin Codex và các nhà cung cấp mô hình
sidebarTitle: Agent Harness
summary: Giao diện SDK thử nghiệm dành cho các Plugin thay thế trình thực thi tác tử nhúng cấp thấp
title: Plugin cho bộ khung tác tử
x-i18n:
    generated_at: "2026-05-03T10:43:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Một **agent harness** là bộ thực thi cấp thấp cho một lượt OpenClaw agent đã được chuẩn bị. Nó không phải là nhà cung cấp mô hình, không phải kênh, và không phải sổ đăng ký công cụ. Với mô hình tư duy dành cho người dùng, hãy xem [Thời gian chạy agent](/vi/concepts/agent-runtimes).

Chỉ dùng bề mặt này cho các Plugin gốc được đóng gói sẵn hoặc đáng tin cậy. Hợp đồng vẫn đang thử nghiệm vì các kiểu tham số cố ý phản chiếu runner nhúng hiện tại.

## Khi nào nên dùng harness

Đăng ký agent harness khi một họ mô hình có thời gian chạy phiên gốc riêng và cơ chế truyền tải nhà cung cấp OpenClaw thông thường là tầng trừu tượng không phù hợp.

Ví dụ:

- máy chủ coding-agent gốc sở hữu luồng và compaction
- CLI hoặc daemon cục bộ phải stream các sự kiện kế hoạch/lập luận/công cụ gốc
- thời gian chạy mô hình cần resume id riêng ngoài transcript phiên OpenClaw

Không **được** đăng ký harness chỉ để thêm một API LLM mới. Với các API mô hình HTTP hoặc WebSocket thông thường, hãy xây dựng [provider plugin](/vi/plugins/sdk-provider-plugins).

## Core vẫn sở hữu những gì

Trước khi một harness được chọn, OpenClaw đã phân giải:

- nhà cung cấp và mô hình
- trạng thái xác thực thời gian chạy
- mức suy nghĩ và ngân sách ngữ cảnh
- tệp transcript/phiên OpenClaw
- workspace, sandbox, và chính sách công cụ
- callback trả lời kênh và callback streaming
- chính sách dự phòng mô hình và chuyển đổi mô hình trực tiếp

Sự phân tách đó là có chủ ý. Harness chạy một lần thử đã chuẩn bị; nó không chọn nhà cung cấp, thay thế việc gửi qua kênh, hoặc âm thầm chuyển mô hình.

Lần thử đã chuẩn bị cũng bao gồm `params.runtimePlan`, một gói chính sách do OpenClaw sở hữu cho các quyết định thời gian chạy phải được chia sẻ giữa PI và các harness gốc:

- `runtimePlan.tools.normalize(...)` và
  `runtimePlan.tools.logDiagnostics(...)` cho chính sách schema công cụ nhận biết nhà cung cấp
- `runtimePlan.transcript.resolvePolicy(...)` cho chính sách làm sạch transcript và sửa tool-call
- `runtimePlan.delivery.isSilentPayload(...)` cho việc triệt gửi `NO_REPLY` và media dùng chung
- `runtimePlan.outcome.classifyRunResult(...)` cho phân loại dự phòng mô hình
- `runtimePlan.observability` cho siêu dữ liệu nhà cung cấp/mô hình/harness đã phân giải

Harness có thể dùng kế hoạch cho các quyết định cần khớp với hành vi PI, nhưng vẫn nên xem nó là trạng thái lần thử do host sở hữu. Không chỉnh sửa nó hoặc dùng nó để chuyển nhà cung cấp/mô hình trong một lượt.

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

1. Id harness đã ghi của phiên hiện có được ưu tiên, để thay đổi config/env không chuyển nóng transcript đó sang thời gian chạy khác.
2. `OPENCLAW_AGENT_RUNTIME=<id>` buộc dùng harness đã đăng ký với id đó cho các phiên chưa được ghim.
3. `OPENCLAW_AGENT_RUNTIME=pi` buộc dùng harness PI tích hợp sẵn.
4. `OPENCLAW_AGENT_RUNTIME=auto` hỏi các harness đã đăng ký xem chúng có hỗ trợ nhà cung cấp/mô hình đã phân giải hay không.
5. Nếu không có harness đã đăng ký nào khớp, OpenClaw dùng PI trừ khi dự phòng PI bị tắt.

Lỗi harness của Plugin xuất hiện dưới dạng lỗi chạy. Ở chế độ `auto`, dự phòng PI chỉ được dùng khi không có Plugin harness đã đăng ký nào hỗ trợ nhà cung cấp/mô hình đã phân giải. Khi một Plugin harness đã nhận một lần chạy, OpenClaw không phát lại cùng lượt đó qua PI vì điều đó có thể thay đổi ngữ nghĩa xác thực/thời gian chạy hoặc lặp lại tác dụng phụ.

Id harness đã chọn được lưu cùng id phiên sau một lần chạy nhúng. Các phiên legacy được tạo trước khi có ghim harness được xem là đã ghim PI sau khi chúng có lịch sử transcript. Dùng phiên mới/đã reset khi chuyển giữa PI và Plugin harness gốc. `/status` hiển thị các id harness không mặc định như `codex` bên cạnh `Fast`; PI được ẩn vì đó là đường dẫn tương thích mặc định. Nếu harness đã chọn gây bất ngờ, hãy bật debug logging `agents/harness` và kiểm tra bản ghi có cấu trúc `agent harness selected` của gateway. Nó bao gồm id harness đã chọn, lý do lựa chọn, chính sách thời gian chạy/dự phòng, và ở chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

Plugin Codex được đóng gói sẵn đăng ký `codex` làm id harness. Core xem đó là một id Plugin harness thông thường; alias riêng của Codex thuộc về Plugin hoặc cấu hình operator, không thuộc bộ chọn thời gian chạy dùng chung.

## Ghép cặp nhà cung cấp và harness

Hầu hết harness cũng nên đăng ký một nhà cung cấp. Nhà cung cấp làm cho model ref, trạng thái xác thực, siêu dữ liệu mô hình, và lựa chọn `/model` hiển thị với phần còn lại của OpenClaw. Sau đó harness nhận nhà cung cấp đó trong `supports(...)`.

Plugin Codex được đóng gói sẵn tuân theo mẫu này:

- model ref người dùng ưu tiên: `openai/gpt-5.5` cộng với
  `agentRuntime.id: "codex"`
- ref tương thích: các ref legacy `codex/gpt-*` vẫn được chấp nhận, nhưng config mới không nên dùng chúng như ref nhà cung cấp/mô hình thông thường
- id harness: `codex`
- xác thực: tính khả dụng nhà cung cấp tổng hợp, vì harness Codex sở hữu phiên/đăng nhập Codex gốc
- yêu cầu app-server: OpenClaw gửi id mô hình trần tới Codex và để harness nói chuyện với giao thức app-server gốc

Plugin Codex là phần bổ sung. Các ref `openai/gpt-*` thông thường tiếp tục dùng đường dẫn nhà cung cấp OpenClaw bình thường trừ khi bạn buộc dùng harness Codex với `agentRuntime.id: "codex"`. Các ref `codex/gpt-*` cũ vẫn chọn nhà cung cấp và harness Codex để tương thích.

Để thiết lập operator, xem ví dụ tiền tố mô hình, và config chỉ dành cho Codex, hãy xem [Codex Harness](/vi/plugins/codex-harness).

OpenClaw yêu cầu Codex app-server `0.125.0` trở lên. Plugin Codex kiểm tra bắt tay khởi tạo app-server và chặn máy chủ cũ hơn hoặc không có phiên bản để OpenClaw chỉ chạy trên bề mặt giao thức đã được kiểm thử. Mức sàn `0.125.0` bao gồm hỗ trợ payload hook MCP gốc đã có trong Codex `0.124.0`, đồng thời ghim OpenClaw vào dòng ổn định mới hơn đã được kiểm thử.

### Middleware kết quả công cụ

Các Plugin được đóng gói sẵn có thể gắn middleware kết quả công cụ trung lập thời gian chạy thông qua `api.registerAgentToolResultMiddleware(...)` khi manifest khai báo các id thời gian chạy mục tiêu trong `contracts.agentToolResultMiddleware`. Điểm nối đáng tin cậy này dành cho các phép biến đổi kết quả công cụ bất đồng bộ phải chạy trước khi PI hoặc Codex đưa đầu ra công cụ trở lại mô hình.

Các Plugin bundled legacy vẫn có thể dùng `api.registerCodexAppServerExtensionFactory(...)` cho middleware chỉ dành cho Codex app-server, nhưng các phép biến đổi kết quả mới nên dùng API trung lập thời gian chạy. Hook chỉ dành cho Pi `api.registerEmbeddedExtensionFactory(...)` đã bị xóa; các phép biến đổi kết quả công cụ của Pi phải dùng middleware trung lập thời gian chạy.

### Phân loại kết quả kết thúc

Các harness gốc sở hữu phép chiếu giao thức riêng có thể dùng `classifyAgentHarnessTerminalOutcome(...)` từ `openclaw/plugin-sdk/agent-harness-runtime` khi một lượt đã hoàn tất nhưng không tạo ra văn bản trợ lý hiển thị. Helper trả về `empty`, `reasoning-only`, hoặc `planning-only` để chính sách dự phòng của OpenClaw có thể quyết định có thử lại trên một mô hình khác hay không. Nó cố ý không phân loại lỗi prompt, lượt đang chạy, và các trả lời im lặng có chủ ý như `NO_REPLY`.

### Chế độ harness Codex gốc

Harness `codex` được đóng gói sẵn là chế độ Codex gốc cho các lượt OpenClaw agent nhúng. Trước tiên hãy bật Plugin `codex` được đóng gói sẵn, và thêm `codex` vào `plugins.allow` nếu config của bạn dùng allowlist hạn chế. Config app-server gốc nên dùng `openai/gpt-*` với `agentRuntime.id: "codex"`. Dùng `openai-codex/*` cho OAuth Codex qua PI thay vào đó. Các model ref legacy `codex/*` vẫn là alias tương thích cho harness gốc.

Khi chế độ này chạy, Codex sở hữu id luồng gốc, hành vi resume, compaction, và thực thi app-server. OpenClaw vẫn sở hữu kênh chat, bản sao transcript hiển thị, chính sách công cụ, phê duyệt, gửi media, và lựa chọn phiên. Dùng `agentRuntime.id: "codex"` khi bạn cần chứng minh rằng chỉ đường dẫn Codex app-server mới có thể nhận lần chạy. Thời gian chạy Plugin tường minh thất bại đóng; lỗi lựa chọn Codex app-server và lỗi thời gian chạy không được thử lại qua PI.

## Độ nghiêm ngặt thời gian chạy

Theo mặc định, OpenClaw chạy các agent nhúng bằng OpenClaw Pi. Ở chế độ `auto`, Plugin harness đã đăng ký có thể nhận một cặp nhà cung cấp/mô hình, và PI xử lý lượt khi không có cặp nào khớp. Dùng thời gian chạy Plugin tường minh như `agentRuntime.id: "codex"` khi thiếu lựa chọn harness nên thất bại thay vì định tuyến qua PI. Lỗi Plugin harness đã chọn luôn thất bại cứng. Điều này không chặn `agentRuntime.id: "pi"` hoặc `OPENCLAW_AGENT_RUNTIME=pi` tường minh.

Đối với các lần chạy nhúng chỉ dành cho Codex:

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

Nếu bạn muốn bất kỳ Plugin harness đã đăng ký nào nhận các mô hình khớp và nếu không thì dùng PI, hãy đặt `id: "auto"`:

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

Ghi đè theo từng agent dùng cùng hình dạng:

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

`OPENCLAW_AGENT_RUNTIME` vẫn ghi đè thời gian chạy đã cấu hình.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Với thời gian chạy Plugin tường minh, phiên thất bại sớm khi harness được yêu cầu chưa được đăng ký, không hỗ trợ nhà cung cấp/mô hình đã phân giải, hoặc thất bại trước khi tạo tác dụng phụ của lượt. Điều đó là có chủ ý cho các triển khai chỉ dành cho Codex và cho live test phải chứng minh đường dẫn Codex app-server thực sự đang được dùng.

Thiết lập này chỉ kiểm soát agent harness nhúng. Nó không tắt định tuyến mô hình dành riêng cho nhà cung cấp đối với hình ảnh, video, nhạc, TTS, PDF, hoặc nội dung khác.

## Phiên gốc và bản sao transcript

Harness có thể giữ id phiên gốc, id luồng, hoặc token resume phía daemon. Hãy giữ liên kết đó được gắn rõ ràng với phiên OpenClaw, và tiếp tục phản chiếu đầu ra trợ lý/công cụ hiển thị cho người dùng vào transcript OpenClaw.

Transcript OpenClaw vẫn là lớp tương thích cho:

- lịch sử phiên hiển thị trên kênh
- tìm kiếm và lập chỉ mục transcript
- chuyển lại sang harness PI tích hợp sẵn ở lượt sau
- hành vi `/new`, `/reset`, và xóa phiên chung

Nếu harness của bạn lưu một liên kết sidecar, hãy triển khai `reset(...)` để OpenClaw có thể xóa liên kết đó khi phiên OpenClaw sở hữu được reset.

## Kết quả công cụ và media

Core xây dựng danh sách công cụ OpenClaw và truyền nó vào lần thử đã chuẩn bị. Khi harness thực thi một lệnh gọi công cụ động, hãy trả kết quả công cụ qua hình dạng kết quả harness thay vì tự gửi media kênh.

Điều này giữ văn bản, hình ảnh, video, nhạc, TTS, phê duyệt, và đầu ra công cụ nhắn tin trên cùng đường dẫn gửi như các lần chạy được PI hỗ trợ.

## Giới hạn hiện tại

- Đường dẫn import công khai là dạng chung, nhưng một số type alias cho attempt/result vẫn
  mang tên `Pi` để tương thích.
- Việc cài đặt harness của bên thứ ba vẫn đang thử nghiệm. Ưu tiên các Plugin nhà cung cấp
  cho đến khi bạn cần runtime phiên gốc.
- Hỗ trợ chuyển đổi harness giữa các lượt. Không chuyển harness ở
  giữa một lượt sau khi công cụ gốc, phê duyệt, văn bản của assistant hoặc thao tác gửi
  tin nhắn đã bắt đầu.

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview)
- [Trình trợ giúp Runtime](/vi/plugins/sdk-runtime)
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)
- [Harness Codex](/vi/plugins/codex-harness)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
