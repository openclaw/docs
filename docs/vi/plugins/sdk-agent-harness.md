---
read_when:
    - Bạn đang thay đổi môi trường chạy tác tử nhúng hoặc sổ đăng ký bộ kiểm thử
    - Bạn đang đăng ký một bộ khung tác tử từ một Plugin được đóng gói kèm hoặc đáng tin cậy
    - Bạn cần hiểu cách Plugin Codex liên quan đến các nhà cung cấp mô hình
sidebarTitle: Agent Harness
summary: Giao diện SDK thử nghiệm dành cho các Plugin thay thế trình thực thi tác nhân nhúng cấp thấp
title: Các Plugin cho bộ khung tác nhân
x-i18n:
    generated_at: "2026-05-10T19:44:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Một **harness tác tử** là trình thực thi cấp thấp cho một lượt tác tử OpenClaw đã được chuẩn bị. Nó không phải là nhà cung cấp mô hình, không phải kênh, và không phải sổ đăng ký công cụ. Với mô hình tư duy hướng người dùng, xem [Runtime tác tử](/vi/concepts/agent-runtimes).

Chỉ dùng bề mặt này cho các Plugin gốc đi kèm hoặc đáng tin cậy. Hợp đồng vẫn đang thử nghiệm vì các kiểu tham số cố ý phản ánh runner nhúng hiện tại.

## Khi nào dùng harness

Đăng ký một harness tác tử khi một họ mô hình có runtime phiên gốc riêng và cơ chế truyền tải nhà cung cấp OpenClaw thông thường là lớp trừu tượng không phù hợp.

Ví dụ:

- một máy chủ tác tử lập trình gốc sở hữu luồng và Compaction
- một CLI hoặc daemon cục bộ phải phát trực tuyến các sự kiện kế hoạch/lập luận/công cụ gốc
- một runtime mô hình cần id tiếp tục riêng ngoài bản ghi phiên OpenClaw

**Không** đăng ký harness chỉ để thêm một API LLM mới. Với các API mô hình HTTP hoặc WebSocket thông thường, hãy xây dựng [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins).

## Những gì phần lõi vẫn sở hữu

Trước khi một harness được chọn, OpenClaw đã phân giải:

- nhà cung cấp và mô hình
- trạng thái xác thực runtime
- mức suy nghĩ và ngân sách ngữ cảnh
- tệp bản ghi/phiên OpenClaw
- workspace, sandbox, và chính sách công cụ
- callback trả lời kênh và callback phát trực tuyến
- chính sách dự phòng mô hình và chuyển đổi mô hình trực tiếp

Cách tách này là có chủ ý. Một harness chạy một lần thử đã được chuẩn bị; nó không chọn nhà cung cấp, thay thế việc phân phối kênh, hoặc âm thầm chuyển mô hình.

Lần thử đã chuẩn bị cũng bao gồm `params.runtimePlan`, một gói chính sách do OpenClaw sở hữu cho các quyết định runtime phải được dùng chung giữa PI và các harness gốc:

- `runtimePlan.tools.normalize(...)` và
  `runtimePlan.tools.logDiagnostics(...)` cho chính sách schema công cụ nhận biết nhà cung cấp
- `runtimePlan.transcript.resolvePolicy(...)` cho chính sách làm sạch bản ghi và sửa lời gọi công cụ
- `runtimePlan.delivery.isSilentPayload(...)` cho việc triệt tiêu phân phối `NO_REPLY` và phương tiện dùng chung
- `runtimePlan.outcome.classifyRunResult(...)` cho phân loại dự phòng mô hình
- `runtimePlan.observability` cho siêu dữ liệu nhà cung cấp/mô hình/harness đã phân giải

Harness có thể dùng kế hoạch cho các quyết định cần khớp với hành vi PI, nhưng vẫn nên xem nó là trạng thái lần thử do host sở hữu. Không sửa đổi nó hoặc dùng nó để chuyển nhà cung cấp/mô hình trong một lượt.

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

OpenClaw chọn một harness sau khi phân giải nhà cung cấp/mô hình:

1. Chính sách runtime theo phạm vi mô hình thắng.
2. Chính sách runtime theo phạm vi nhà cung cấp đứng kế tiếp.
3. `auto` hỏi các harness đã đăng ký xem chúng có hỗ trợ nhà cung cấp/mô hình đã phân giải hay không.
4. Nếu không có harness đã đăng ký nào khớp, OpenClaw dùng PI trừ khi dự phòng PI bị tắt.

Lỗi harness Plugin hiển thị dưới dạng lỗi chạy. Ở chế độ `auto`, dự phòng PI chỉ được dùng khi không có harness Plugin đã đăng ký nào hỗ trợ nhà cung cấp/mô hình đã phân giải. Khi một harness Plugin đã nhận một lần chạy, OpenClaw không phát lại cùng lượt đó qua PI vì điều đó có thể thay đổi ngữ nghĩa xác thực/runtime hoặc nhân đôi tác dụng phụ.

Các ghim runtime toàn phiên và toàn tác tử bị lựa chọn bỏ qua. Điều đó bao gồm các giá trị `agentHarnessId` phiên cũ, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, và `OPENCLAW_AGENT_RUNTIME`. `/status` hiển thị runtime hiệu lực được chọn từ tuyến nhà cung cấp/mô hình.
Nếu harness được chọn gây bất ngờ, hãy bật ghi log debug `agents/harness` và kiểm tra bản ghi có cấu trúc `agent harness selected` của Gateway. Nó bao gồm id harness được chọn, lý do lựa chọn, chính sách runtime/dự phòng, và, ở chế độ `auto`, kết quả hỗ trợ của từng ứng viên Plugin.

Plugin Codex đi kèm đăng ký `codex` làm id harness. Phần lõi xem đó là một id harness Plugin thông thường; các alias riêng của Codex thuộc về Plugin hoặc cấu hình vận hành, không thuộc bộ chọn runtime dùng chung.

## Ghép cặp nhà cung cấp cộng harness

Hầu hết harness cũng nên đăng ký một nhà cung cấp. Nhà cung cấp làm cho ref mô hình, trạng thái xác thực, siêu dữ liệu mô hình, và lựa chọn `/model` hiển thị với phần còn lại của OpenClaw. Sau đó harness nhận nhà cung cấp đó trong `supports(...)`.

Plugin Codex đi kèm tuân theo mẫu này:

- ref mô hình người dùng ưu tiên: `openai/gpt-5.5`
- ref tương thích: các ref `codex/gpt-*` cũ vẫn được chấp nhận, nhưng cấu hình mới không nên dùng chúng như ref nhà cung cấp/mô hình thông thường
- id harness: `codex`
- xác thực: tính khả dụng nhà cung cấp tổng hợp, vì harness Codex sở hữu phiên/đăng nhập Codex gốc
- yêu cầu máy chủ ứng dụng: OpenClaw gửi id mô hình trần cho Codex và để harness nói chuyện với giao thức máy chủ ứng dụng gốc

Plugin Codex là dạng bổ sung. Các ref tác tử `openai/gpt-*` thuần trên nhà cung cấp OpenAI chính thức chọn harness Codex theo mặc định. Các ref `codex/gpt-*` cũ vẫn chọn nhà cung cấp và harness Codex để tương thích.

Để thiết lập vận hành, ví dụ tiền tố mô hình, và cấu hình chỉ dành cho Codex, xem [Codex Harness](/vi/plugins/codex-harness).

OpenClaw yêu cầu máy chủ ứng dụng Codex `0.125.0` hoặc mới hơn. Plugin Codex kiểm tra bắt tay khởi tạo máy chủ ứng dụng và chặn các máy chủ cũ hơn hoặc không có phiên bản để OpenClaw chỉ chạy trên bề mặt giao thức đã được kiểm thử. Mức sàn `0.125.0` bao gồm hỗ trợ payload hook MCP gốc đã có trong Codex `0.124.0`, đồng thời ghim OpenClaw vào dòng ổn định mới hơn đã được kiểm thử.

### Middleware kết quả công cụ

Plugin đi kèm có thể gắn middleware kết quả công cụ trung lập với runtime thông qua `api.registerAgentToolResultMiddleware(...)` khi manifest của chúng khai báo các id runtime đích trong `contracts.agentToolResultMiddleware`. Điểm nối đáng tin cậy này dành cho các biến đổi kết quả công cụ bất đồng bộ phải chạy trước khi PI hoặc Codex đưa đầu ra công cụ trở lại mô hình.

Plugin đi kèm cũ vẫn có thể dùng `api.registerCodexAppServerExtensionFactory(...)` cho middleware chỉ dành cho máy chủ ứng dụng Codex, nhưng các biến đổi kết quả mới nên dùng API trung lập với runtime. Hook chỉ dành cho Pi `api.registerEmbeddedExtensionFactory(...)` đã bị xóa; các biến đổi kết quả công cụ Pi phải dùng middleware trung lập với runtime.

### Phân loại kết quả cuối

Các harness gốc sở hữu phép chiếu giao thức riêng có thể dùng `classifyAgentHarnessTerminalOutcome(...)` từ `openclaw/plugin-sdk/agent-harness-runtime` khi một lượt hoàn tất không tạo ra văn bản trợ lý hiển thị. Trình trợ giúp trả về `empty`, `reasoning-only`, hoặc `planning-only` để chính sách dự phòng của OpenClaw có thể quyết định có thử lại trên một mô hình khác hay không. Nó cố ý không phân loại lỗi lời nhắc, lượt đang chạy, và các trả lời im lặng có chủ ý như `NO_REPLY`.

### Chế độ harness Codex gốc

Harness `codex` đi kèm là chế độ Codex gốc cho các lượt tác tử OpenClaw nhúng. Trước tiên hãy bật Plugin `codex` đi kèm, và đưa `codex` vào `plugins.allow` nếu cấu hình của bạn dùng danh sách cho phép hạn chế. Cấu hình máy chủ ứng dụng gốc nên dùng `openai/gpt-*`; các lượt tác tử OpenAI chọn harness Codex theo mặc định. Các tuyến `openai-codex/*` cũ nên được sửa bằng `openclaw doctor --fix`, và các ref mô hình `codex/*` cũ vẫn là alias tương thích cho harness gốc.

Khi chế độ này chạy, Codex sở hữu id luồng gốc, hành vi tiếp tục, Compaction, và thực thi máy chủ ứng dụng. OpenClaw vẫn sở hữu kênh trò chuyện, bản sao bản ghi hiển thị, chính sách công cụ, phê duyệt, phân phối phương tiện, và lựa chọn phiên. Dùng nhà cung cấp/mô hình `agentRuntime.id: "codex"` khi bạn cần chứng minh rằng chỉ đường dẫn máy chủ ứng dụng Codex mới có thể nhận lần chạy. Runtime Plugin tường minh sẽ đóng khi lỗi; lỗi lựa chọn máy chủ ứng dụng Codex và lỗi runtime không được thử lại qua PI.

## Mức nghiêm ngặt runtime

Theo mặc định, OpenClaw dùng chính sách runtime nhà cung cấp/mô hình `auto`: các harness Plugin đã đăng ký có thể nhận một cặp nhà cung cấp/mô hình, và PI xử lý lượt khi không có cặp nào khớp. Ref tác tử OpenAI trên nhà cung cấp OpenAI chính thức mặc định dùng Codex. Dùng runtime Plugin nhà cung cấp/mô hình tường minh như `agentRuntime.id: "codex"` khi việc không chọn được harness nên thất bại thay vì định tuyến qua PI. Lỗi harness Plugin đã chọn luôn thất bại cứng. Điều này không chặn một `agentRuntime.id: "pi"` nhà cung cấp/mô hình tường minh.

Đối với các lần chạy nhúng chỉ Codex:

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

Nếu bạn muốn một backend CLI cho một mô hình chuẩn duy nhất, đặt runtime trên mục mô hình đó:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
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

Các ví dụ runtime toàn tác tử cũ như sau bị bỏ qua:

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

Với một runtime Plugin tường minh, phiên thất bại sớm khi harness được yêu cầu chưa được đăng ký, không hỗ trợ nhà cung cấp/mô hình đã phân giải, hoặc thất bại trước khi tạo ra tác dụng phụ của lượt. Điều đó là có chủ ý cho các triển khai chỉ Codex và cho các kiểm thử trực tiếp phải chứng minh đường dẫn máy chủ ứng dụng Codex thực sự đang được dùng.

Thiết lập này chỉ kiểm soát harness tác tử nhúng. Nó không tắt định tuyến mô hình riêng theo nhà cung cấp cho hình ảnh, video, nhạc, TTS, PDF, hoặc các loại khác.

## Phiên gốc và bản sao bản ghi

Một harness có thể giữ id phiên gốc, id luồng, hoặc token tiếp tục phía daemon. Giữ ràng buộc đó được liên kết rõ ràng với phiên OpenClaw, và tiếp tục sao chép đầu ra trợ lý/công cụ hiển thị với người dùng vào bản ghi OpenClaw.

Bản ghi OpenClaw vẫn là lớp tương thích cho:

- lịch sử phiên hiển thị trên kênh
- tìm kiếm và lập chỉ mục bản ghi
- chuyển trở lại harness PI tích hợp sẵn ở một lượt sau
- hành vi `/new`, `/reset`, và xóa phiên chung

Nếu harness của bạn lưu một ràng buộc sidecar, hãy triển khai `reset(...)` để OpenClaw có thể xóa nó khi phiên OpenClaw sở hữu được đặt lại.

## Kết quả công cụ và phương tiện

Phần lõi xây dựng danh sách công cụ OpenClaw và truyền nó vào lần thử đã chuẩn bị. Khi một harness thực thi một lời gọi công cụ động, hãy trả kết quả công cụ về thông qua hình dạng kết quả harness thay vì tự gửi phương tiện kênh.

Điều này giữ đầu ra văn bản, hình ảnh, video, nhạc, TTS, phê duyệt, và công cụ nhắn tin trên cùng đường dẫn phân phối với các lần chạy được PI hậu thuẫn.

## Giới hạn hiện tại

- Đường dẫn import công khai là chung, nhưng một số alias kiểu lần thử/kết quả vẫn mang tên `Pi` để tương thích.
- Cài đặt harness bên thứ ba đang thử nghiệm. Ưu tiên Plugin nhà cung cấp cho đến khi bạn cần runtime phiên gốc.
- Hỗ trợ chuyển harness giữa các lượt. Không chuyển harness ở giữa một lượt sau khi công cụ gốc, phê duyệt, văn bản trợ lý, hoặc gửi tin nhắn đã bắt đầu.

## Liên quan

- [Tổng quan SDK](/vi/plugins/sdk-overview)
- [Trình trợ giúp runtime](/vi/plugins/sdk-runtime)
- [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins)
- [Bộ khung Codex](/vi/plugins/codex-harness)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
