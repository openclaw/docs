---
read_when:
    - Bạn đang xây dựng một Plugin cần before_tool_call, before_agent_reply, hook thông điệp hoặc hook vòng đời
    - Bạn cần chặn, viết lại hoặc yêu cầu phê duyệt các lệnh gọi công cụ từ một Plugin
    - Bạn đang quyết định giữa hook nội bộ và hook Plugin
summary: 'Plugin hooks: chặn các sự kiện vòng đời của agent, công cụ, tin nhắn, phiên và Gateway'
title: Hook của Plugin
x-i18n:
    generated_at: "2026-06-27T17:46:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c2db0963c85d15fd391fb575f981992ffd6d77c098bd78cac08be390caea931
    source_path: plugins/hooks.md
    workflow: 16
---

Hook Plugin là các điểm mở rộng trong tiến trình dành cho Plugin OpenClaw. Sử dụng chúng
khi Plugin cần kiểm tra hoặc thay đổi các lần chạy agent, lệnh gọi công cụ, luồng thông điệp,
vòng đời phiên, định tuyến subagent, cài đặt, hoặc khởi động Gateway.

Thay vào đó, hãy dùng [hook nội bộ](/vi/automation/hooks) khi bạn muốn một tập lệnh
`HOOK.md` nhỏ do operator cài đặt cho các sự kiện lệnh và Gateway như
`/new`, `/reset`, `/stop`, `agent:bootstrap`, hoặc `gateway:startup`.

## Bắt đầu nhanh

Đăng ký hook Plugin có kiểu bằng `api.on(...)` từ entry Plugin của bạn:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Các handler hook chạy tuần tự theo `priority` giảm dần. Các hook cùng priority
giữ nguyên thứ tự đăng ký.

`api.on(name, handler, opts?)` chấp nhận:

- `priority` - thứ tự handler (cao hơn chạy trước).
- `timeoutMs` - ngân sách tùy chọn cho từng hook. Khi được đặt, hook runner sẽ hủy
  handler đó sau khi ngân sách hết hạn và tiếp tục với handler tiếp theo, thay vì
  để công việc thiết lập chậm hoặc truy hồi tiêu thụ timeout mô hình mà caller đã cấu hình.
  Bỏ qua để dùng timeout quan sát/quyết định mặc định mà hook runner áp dụng chung.

Operator cũng có thể đặt ngân sách hook mà không cần vá mã Plugin:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` ghi đè `hooks.timeoutMs`, giá trị này ghi đè
giá trị `api.on(..., { timeoutMs })` do Plugin viết. Mỗi giá trị được cấu hình phải
là số nguyên dương không lớn hơn 600000 mili giây. Ưu tiên ghi đè theo từng hook
cho các hook được biết là chậm để một Plugin không nhận ngân sách dài hơn ở mọi nơi.

Mỗi hook nhận `event.context.pluginConfig`, cấu hình đã phân giải cho
Plugin đã đăng ký handler đó. Dùng nó cho các quyết định hook cần
tùy chọn Plugin hiện tại; OpenClaw tiêm giá trị này theo từng handler mà không làm thay đổi
đối tượng sự kiện dùng chung mà các Plugin khác nhìn thấy.

## Danh mục hook

Hook được nhóm theo bề mặt mà chúng mở rộng. Các tên in **đậm** chấp nhận
kết quả quyết định (chặn, hủy, ghi đè, hoặc yêu cầu phê duyệt); tất cả các hook khác
chỉ dành cho quan sát.

**Lượt agent**

- `before_model_resolve` - ghi đè provider hoặc mô hình trước khi thông điệp phiên được tải
- `agent_turn_prepare` - tiêu thụ các lượt tiêm Plugin đã xếp hàng và thêm ngữ cảnh cùng lượt trước các hook prompt
- `before_prompt_build` - thêm ngữ cảnh động hoặc văn bản system-prompt trước lệnh gọi mô hình
- `before_agent_start` - pha kết hợp chỉ để tương thích; ưu tiên hai hook ở trên
- **`before_agent_run`** - kiểm tra prompt cuối cùng và thông điệp phiên trước khi gửi tới mô hình, và tùy chọn chặn lần chạy
- **`before_agent_reply`** - rút ngắn lượt mô hình bằng phản hồi tổng hợp hoặc im lặng
- **`before_agent_finalize`** - kiểm tra câu trả lời cuối cùng tự nhiên và yêu cầu thêm một lượt mô hình nữa
- `agent_end` - quan sát thông điệp cuối cùng, trạng thái thành công, và thời lượng chạy
- `heartbeat_prompt_contribution` - thêm ngữ cảnh chỉ dành cho heartbeat cho các Plugin giám sát nền và vòng đời

**Quan sát hội thoại**

- `model_call_started` / `model_call_ended` - quan sát metadata lệnh gọi provider/mô hình đã được làm sạch, thời gian, kết quả, và hash request-id có giới hạn mà không có nội dung prompt hoặc phản hồi
- `llm_input` - quan sát đầu vào provider (system prompt, prompt, lịch sử)
- `llm_output` - quan sát đầu ra provider, mức sử dụng, và `contextTokenBudget` đã phân giải khi có sẵn

**Công cụ**

- **`before_tool_call`** - viết lại tham số công cụ, chặn thực thi, hoặc yêu cầu phê duyệt
- `after_tool_call` - quan sát kết quả công cụ, lỗi, và thời lượng
- `resolve_exec_env` - đóng góp biến môi trường do Plugin sở hữu cho `exec`
- **`tool_result_persist`** - viết lại thông điệp assistant được tạo từ kết quả công cụ
- **`before_message_write`** - kiểm tra hoặc chặn một thao tác ghi thông điệp đang diễn ra (hiếm)

**Thông điệp và phân phối**

- **`inbound_claim`** - nhận xử lý một thông điệp đến trước khi định tuyến agent (phản hồi tổng hợp)
- `message_received` — quan sát nội dung đến, người gửi, thread, và metadata
- **`message_sending`** — viết lại nội dung đi hoặc hủy phân phối
- **`reply_payload_sending`** — thay đổi hoặc hủy payload phản hồi đã chuẩn hóa trước khi phân phối
- `message_sent` — quan sát việc phân phối đi thành công hoặc thất bại
- **`before_dispatch`** - kiểm tra hoặc viết lại một dispatch đi trước khi bàn giao cho kênh
- **`reply_dispatch`** - tham gia vào pipeline reply-dispatch cuối cùng

**Phiên và Compaction**

- `session_start` / `session_end` - theo dõi ranh giới vòng đời phiên. `reason` của sự kiện là một trong `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart`, hoặc `unknown`. Các giá trị `shutdown` và `restart` kích hoạt từ finalizer tắt gateway khi tiến trình bị dừng hoặc khởi động lại trong lúc các phiên vẫn đang hoạt động, để các Plugin phía sau (như bộ nhớ hoặc kho transcript) có thể hoàn tất các hàng ghost mà nếu không sẽ bị để lại ở trạng thái mở qua các lần khởi động lại. Finalizer có giới hạn để một Plugin chậm không thể chặn SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - quan sát hoặc chú thích các chu kỳ compaction
- `before_reset` - quan sát các sự kiện đặt lại phiên (`/reset`, đặt lại bằng chương trình)

**Subagent**

- `subagent_spawned` / `subagent_ended` - quan sát việc khởi chạy và hoàn tất subagent.
- `subagent_delivery_target` - hook tương thích cho phân phối hoàn tất khi không có binding phiên lõi nào có thể chiếu một tuyến.
- `subagent_spawning` - hook tương thích đã lỗi thời. Core hiện chuẩn bị các binding subagent `thread: true` thông qua adapter binding phiên kênh trước khi `subagent_spawned` kích hoạt.
- `subagent_spawned` bao gồm `resolvedModel` và `resolvedProvider` khi OpenClaw đã phân giải mô hình native của phiên con trước khi khởi chạy.
- `subagent_ended` mang `targetSessionKey` (định danh — khớp với `subagent_spawned.childSessionKey`), `targetKind` (`"subagent"` hoặc `"acp"`), `reason`, `outcome` tùy chọn (`"ok"`, `"error"`, `"timeout"`, `"killed"`, `"reset"`, hoặc `"deleted"`), `error` tùy chọn, `runId`, `endedAt`, `accountId`, và `sendFarewell`. Nó **không** bao gồm `agentId` hoặc `childSessionKey`; dùng `targetSessionKey` để tương quan với sự kiện `subagent_spawned` tương ứng.

**Vòng đời**

- `gateway_start` / `gateway_stop` - khởi động hoặc dừng các dịch vụ do Plugin sở hữu cùng Gateway
- `deactivate` - alias tương thích đã lỗi thời cho `gateway_stop`; dùng `gateway_stop` trong các Plugin mới
- `cron_changed` - quan sát các thay đổi vòng đời cron do gateway sở hữu (đã thêm, đã cập nhật, đã xóa, đã bắt đầu, đã hoàn tất, đã lên lịch)
- **`before_install`** - kiểm tra vật liệu cài đặt skill hoặc Plugin đã staged từ một runtime
  Plugin đã tải

## Gỡ lỗi hook runtime

Dùng `before_model_resolve` khi Plugin cần chuyển provider hoặc mô hình
cho một lượt agent. Nó chạy trước bước phân giải mô hình; `llm_output` chỉ chạy sau khi
một lần thử mô hình tạo ra đầu ra assistant.

Để chứng minh mô hình phiên hiệu lực, hãy kiểm tra các đăng ký runtime, sau đó
dùng `openclaw sessions` hoặc các bề mặt phiên/trạng thái Gateway. Khi gỡ lỗi
payload provider, khởi động Gateway với `--raw-stream` và
`--raw-stream-path <path>`; các cờ đó ghi sự kiện luồng mô hình thô vào một tệp jsonl.

## Chính sách lệnh gọi công cụ

`before_tool_call` nhận:

- `event.toolName`
- `event.params`
- `event.toolKind` và `event.toolInputKind` tùy chọn, các discriminator do host quyết định
  cho những công cụ cố ý dùng chung tên; ví dụ, các lệnh gọi `exec` code-mode bên ngoài
  dùng `toolKind: "code_mode_exec"` và
  bao gồm `toolInputKind: "javascript" | "typescript"` khi biết ngôn ngữ đầu vào
- `event.derivedPaths` tùy chọn, chứa các gợi ý đường dẫn đích do host suy luận theo nỗ lực tốt nhất
  cho các envelope công cụ phổ biến như `apply_patch`; khi có,
  các đường dẫn này có thể không đầy đủ hoặc có thể ước lượng rộng hơn những gì công cụ
  thực sự chạm tới (ví dụ, với đầu vào sai định dạng hoặc một phần)
- `event.runId` tùy chọn
- `event.toolCallId` tùy chọn
- các trường ngữ cảnh như `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (được đặt trên các lần chạy do cron điều khiển), `ctx.toolKind`,
  `ctx.toolInputKind`, và `ctx.trace` chẩn đoán

Nó có thể trả về:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Hành vi guard hook cho các hook vòng đời có kiểu:

- `block: true` là kết thúc và bỏ qua các handler có priority thấp hơn.
- `block: false` được xem như không có quyết định.
- `params` viết lại tham số công cụ để thực thi.
- `requireApproval` tạm dừng lần chạy agent và hỏi người dùng thông qua phê duyệt Plugin.
  Lệnh `/approve` có thể phê duyệt cả phê duyệt exec và Plugin.
  Trong relay `PreToolUse` native ở report-mode app-server Codex, việc này được trì hoãn
  tới yêu cầu phê duyệt app-server tương ứng; xem [runtime harness Codex](/vi/plugins/codex-harness-runtime#hook-boundaries).
- Một `block: true` có priority thấp hơn vẫn có thể chặn sau khi một hook priority cao hơn
  đã yêu cầu phê duyệt.
- `onResolution` nhận quyết định phê duyệt đã phân giải - `allow-once`,
  `allow-always`, `deny`, `timeout`, hoặc `cancelled`.

Xem [Yêu cầu quyền Plugin](/vi/plugins/plugin-permission-requests) để biết
định tuyến phê duyệt, hành vi quyết định, và khi nào nên dùng `requireApproval` thay vì
các công cụ tùy chọn hoặc phê duyệt exec.

Các Plugin cần chính sách cấp host có thể đăng ký chính sách công cụ tin cậy bằng
`api.registerTrustedToolPolicy(...)`. Các chính sách này chạy trước các hook
`before_tool_call` thông thường và trước các quyết định hook bình thường. Chính sách tin cậy
được bundling chạy trước; chính sách tin cậy của Plugin đã cài đặt chạy tiếp theo theo thứ tự tải Plugin;
các hook `before_tool_call` thông thường chạy sau chúng. Plugin được bundling giữ
đường dẫn trusted-policy hiện có. Plugin đã cài đặt phải được bật rõ ràng
và khai báo mọi id chính sách trong `contracts.trustedToolPolicies`; các id chưa khai báo
bị từ chối trước khi đăng ký. Id chính sách được giới hạn trong Plugin đăng ký,
nên các Plugin khác nhau có thể tái sử dụng cùng một id cục bộ. Chỉ dùng tầng này
cho các cổng được host tin cậy như chính sách workspace, thực thi ngân sách, hoặc
an toàn workflow dành riêng.

### Hook môi trường exec

`resolve_exec_env` cho phép Plugin đóng góp biến môi trường cho các lệnh gọi công cụ
`exec` sau khi môi trường exec cơ sở được dựng và trước khi
lệnh chạy. Nó nhận:

- `event.sessionKey`
- `event.toolName`, hiện luôn là `"exec"`
- `event.host`, một trong `"gateway"`, `"sandbox"`, hoặc `"node"`
- các trường ngữ cảnh như `ctx.agentId`, `ctx.sessionKey`,
  `ctx.messageProvider`, và `ctx.channelId`

Trả về một `Record<string, string>` để hợp nhất vào môi trường exec. Handler
chạy theo thứ tự priority, và kết quả hook về sau ghi đè kết quả hook trước đó cho
cùng một khóa.

Đầu ra hook được lọc qua chính sách khóa môi trường thực thi của host trước khi
được hợp nhất. Các khóa không hợp lệ, `PATH`, và các khóa ghi đè host nguy hiểm như
`LD_*`, `DYLD_*`, `NODE_OPTIONS`, biến proxy, và biến ghi đè TLS
sẽ bị loại bỏ. Môi trường Plugin đã lọc được đưa vào siêu dữ liệu phê duyệt/kiểm toán
Gateway và được chuyển tiếp tới các yêu cầu thực thi node-host.

### Lưu giữ kết quả công cụ

Kết quả công cụ có thể bao gồm `details` có cấu trúc để kết xuất UI, chẩn đoán,
định tuyến media, hoặc siêu dữ liệu do Plugin sở hữu. Hãy xem `details` là siêu dữ liệu runtime,
không phải nội dung prompt:

- OpenClaw loại bỏ `toolResult.details` trước khi phát lại provider và đầu vào
  Compaction để siêu dữ liệu không trở thành ngữ cảnh mô hình.
- Các mục phiên được lưu giữ chỉ giữ `details` có giới hạn. Details quá lớn sẽ
  được thay bằng một bản tóm tắt gọn và `persistedDetailsTruncated: true`.
- `tool_result_persist` và `before_message_write` chạy trước giới hạn lưu giữ
  cuối cùng. Hook vẫn nên giữ `details` trả về ở kích thước nhỏ và tránh
  đặt văn bản liên quan đến prompt chỉ trong `details`; hãy đặt đầu ra công cụ
  mà mô hình có thể thấy trong `content`.

## Hook prompt và mô hình

Dùng các hook theo từng pha cho Plugin mới:

- `before_model_resolve`: chỉ nhận prompt hiện tại và siêu dữ liệu tệp đính kèm.
  Trả về `providerOverride` hoặc `modelOverride`.
- `agent_turn_prepare`: nhận prompt hiện tại, các tin nhắn phiên đã chuẩn bị,
  và mọi injection đã xếp hàng đúng-một-lần được rút ra cho phiên này. Trả về
  `prependContext` hoặc `appendContext`.
- `before_prompt_build`: nhận prompt hiện tại và tin nhắn phiên.
  Trả về `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, hoặc `appendSystemContext`.
- `heartbeat_prompt_contribution`: chỉ chạy cho lượt Heartbeat và trả về
  `prependContext` hoặc `appendContext`. Hook này dành cho các trình giám sát nền
  cần tóm tắt trạng thái hiện tại mà không thay đổi các lượt do người dùng khởi tạo.

`before_agent_start` vẫn được giữ để tương thích. Ưu tiên các hook tường minh ở trên
để Plugin của bạn không phụ thuộc vào một pha kết hợp cũ.

`before_agent_run` chạy sau khi xây dựng prompt và trước mọi đầu vào mô hình,
bao gồm việc tải hình ảnh cục bộ của prompt và quan sát `llm_input`. Hook này nhận
đầu vào người dùng hiện tại dưới dạng `prompt`, cộng với lịch sử phiên đã tải trong `messages`
và system prompt đang hoạt động. Trả về `{ outcome: "block", reason, message? }`
để dừng lượt chạy trước khi mô hình có thể đọc prompt. `reason` là nội bộ;
`message` là nội dung thay thế hiển thị cho người dùng. Các outcome duy nhất được hỗ trợ là
`pass` và `block`; các dạng quyết định không được hỗ trợ sẽ fail closed.

Khi một lượt chạy bị chặn, OpenClaw chỉ lưu văn bản thay thế trong
`message.content` cùng với siêu dữ liệu chặn không nhạy cảm như id Plugin chặn
và dấu thời gian. Văn bản gốc của người dùng không được giữ lại trong transcript hoặc ngữ cảnh
tương lai. Lý do chặn nội bộ được xem là nhạy cảm và bị loại khỏi
transcript, lịch sử, broadcast, log, và payload chẩn đoán. Khả năng quan sát
nên dùng các trường đã được làm sạch như id trình chặn, outcome, dấu thời gian, hoặc một
danh mục an toàn.

`before_agent_start` và `agent_end` bao gồm `event.runId` khi OpenClaw có thể
xác định lượt chạy đang hoạt động. Cùng giá trị đó cũng có sẵn trên `ctx.runId`.
Các lượt chạy do Cron kích hoạt cũng hiển thị `ctx.jobId` (id cron job khởi nguồn) để
hook Plugin có thể giới hạn phạm vi metrics, tác dụng phụ, hoặc trạng thái theo một job đã lên lịch
cụ thể.

Đối với các lượt chạy bắt nguồn từ kênh, `ctx.channel` và `ctx.messageProvider` xác định
bề mặt provider như `discord` hoặc `telegram`, còn `ctx.channelId` là
định danh mục tiêu hội thoại khi OpenClaw có thể suy ra từ khóa phiên
hoặc siêu dữ liệu gửi.

Khi có danh tính người gửi, ngữ cảnh hook agent cũng bao gồm:

- `ctx.senderId` — ID người gửi theo phạm vi kênh (ví dụ Feishu `open_id`, ID người dùng Discord).
  Được điền khi lượt chạy bắt nguồn từ tin nhắn người dùng có siêu dữ liệu
  người gửi đã biết.
- `ctx.chatId` — định danh hội thoại gốc của transport (ví dụ Feishu
  `chat_id`, Telegram `chat_id`). Được điền khi kênh khởi nguồn
  cung cấp ID hội thoại gốc.
- `ctx.channelContext.sender.id` — cùng ID người gửi như `ctx.senderId`, nằm trong một
  đối tượng do kênh sở hữu mà Plugin có thể mở rộng bằng các trường riêng của kênh.
- `ctx.channelContext.chat.id` — cùng ID hội thoại như `ctx.chatId`, nằm trong một
  đối tượng do kênh sở hữu mà Plugin có thể mở rộng bằng các trường riêng của kênh.

Core chỉ định nghĩa các trường `id` lồng nhau. Các Plugin kênh truyền siêu dữ liệu
người gửi hoặc chat phong phú hơn qua helper inbound có thể bổ sung
`PluginHookChannelSenderContext` hoặc `PluginHookChannelChatContext` từ
`openclaw/plugin-sdk/channel-inbound`:

```ts
declare module "openclaw/plugin-sdk/channel-inbound" {
  interface PluginHookChannelSenderContext {
    unionId?: string;
    userId?: string;
  }
}
```

Plugin kênh truyền các trường đó qua helper SDK inbound:

```ts
buildChannelInboundEventContext({
  // ...
  channelContext: {
    sender: { id: senderOpenId, unionId, userId },
    chat: { id: chatId },
  },
});
```

Các trường này là tùy chọn và không có trong các lượt chạy bắt nguồn từ hệ thống (Heartbeat,
cron, exec-event).

`ctx.senderExternalId` vẫn là trường tương thích nguồn đã lỗi thời cho
Plugin cũ hơn. Core không điền trường này; danh tính người gửi riêng theo kênh mới
nên nằm dưới `ctx.channelContext.sender` thông qua module augmentation.

`agent_end` là một hook quan sát. Các đường dẫn Gateway và harness bền vững chạy hook này
theo kiểu fire-and-forget sau lượt, trong khi các đường dẫn CLI one-shot tồn tại ngắn sẽ đợi
promise của hook trước khi dọn dẹp tiến trình để Plugin đáng tin cậy có thể flush
khả năng quan sát terminal hoặc ghi lại trạng thái. Trình chạy hook áp dụng timeout 30 giây để một
Plugin bị kẹt hoặc endpoint nhúng không thể để promise hook chờ mãi.
Timeout được ghi log và OpenClaw tiếp tục; timeout không hủy
công việc mạng do Plugin sở hữu trừ khi Plugin cũng dùng abort signal riêng.

Dùng `model_call_started` và `model_call_ended` cho telemetry cuộc gọi provider
không nên nhận prompt thô, lịch sử, phản hồi, header, body yêu cầu,
hoặc ID yêu cầu provider. Các hook này bao gồm siêu dữ liệu ổn định như
`runId`, `callId`, `provider`, `model`, `api`/`transport` tùy chọn, `durationMs`/`outcome`
kết thúc, và `upstreamRequestIdHash` khi OpenClaw có thể suy ra một
hash ID yêu cầu provider có giới hạn. Khi runtime đã phân giải siêu dữ liệu
cửa sổ ngữ cảnh, sự kiện hook và ngữ cảnh cũng bao gồm `contextTokenBudget`, tức
ngân sách token hiệu dụng sau các giới hạn mô hình/cấu hình/agent, cùng với
`contextWindowSource` và `contextWindowReferenceTokens` khi một giới hạn thấp hơn
đã được áp dụng.

`before_agent_finalize` chỉ chạy khi một harness sắp chấp nhận câu trả lời assistant
cuối cùng tự nhiên. Đây không phải đường dẫn hủy `/stop` và không
chạy khi người dùng hủy một lượt. Trả về `{ action: "revise", reason }` để yêu cầu
harness thực hiện thêm một lần gọi mô hình trước khi finalize, `{ action:
"finalize", reason? }` để buộc finalize, hoặc bỏ qua kết quả để tiếp tục.
Các hook Codex native `Stop` được chuyển tiếp vào hook này dưới dạng các quyết định
`before_agent_finalize` của OpenClaw.

Khi trả về `action: "revise"`, Plugin có thể bao gồm siêu dữ liệu `retry` để khiến
lần gọi mô hình bổ sung có giới hạn và an toàn khi phát lại:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` được thêm vào lý do revision gửi tới harness.
`idempotencyKey` cho phép host đếm số lần thử lại cho cùng yêu cầu Plugin trên các
quyết định finalize tương đương, và `maxAttempts` giới hạn số lần gọi bổ sung
mà host cho phép trước khi tiếp tục với câu trả lời cuối cùng tự nhiên.

Plugin không đóng gói sẵn cần hook hội thoại thô (`before_model_resolve`,
`before_agent_reply`, `llm_input`, `llm_output`, `before_agent_finalize`,
`agent_end`, hoặc `before_agent_run`) phải đặt:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Hook thay đổi prompt và injection bền vững cho lượt kế tiếp có thể bị tắt theo từng Plugin
bằng `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Phần mở rộng phiên và injection lượt kế tiếp

Plugin workflow có thể lưu giữ trạng thái phiên nhỏ tương thích JSON bằng
`api.registerSessionExtension(...)` và cập nhật qua phương thức
`sessions.pluginPatch` của Gateway. Các hàng phiên chiếu trạng thái phần mở rộng đã đăng ký
qua `pluginExtensions`, cho phép Control UI và các client khác kết xuất
trạng thái do Plugin sở hữu mà không cần biết nội bộ Plugin.

Dùng `api.enqueueNextTurnInjection(...)` khi một Plugin cần ngữ cảnh bền vững
đi tới lượt mô hình tiếp theo đúng một lần. OpenClaw rút các injection đã xếp hàng trước
hook prompt, loại bỏ injection hết hạn, và khử trùng lặp theo `idempotencyKey`
trên từng Plugin. Đây là điểm nối đúng cho tiếp tục phê duyệt, tóm tắt chính sách,
delta của trình giám sát nền, và tiếp tục lệnh cần hiển thị với
mô hình ở lượt kế tiếp nhưng không nên trở thành văn bản system prompt vĩnh viễn.

Ngữ nghĩa dọn dẹp là một phần của hợp đồng. Các callback dọn dẹp phần mở rộng phiên và
dọn dẹp vòng đời runtime nhận `reset`, `delete`, `disable`, hoặc
`restart`. Host xóa trạng thái phần mở rộng phiên bền vững và các injection lượt kế tiếp
đang chờ của Plugin sở hữu đối với reset/delete/disable; restart giữ
trạng thái phiên bền vững trong khi callback dọn dẹp cho phép Plugin giải phóng scheduler
job, ngữ cảnh chạy, và các tài nguyên ngoài băng khác cho thế hệ runtime
cũ.

## Hook tin nhắn

Dùng hook tin nhắn cho định tuyến cấp kênh và chính sách gửi:

- `message_received`: quan sát nội dung inbound, người gửi, `threadId`, `messageId`,
  `senderId`, tương quan lượt chạy/phiên tùy chọn, và siêu dữ liệu.
- `message_sending`: viết lại `content` hoặc trả về `{ cancel: true }`.
- `reply_payload_sending`: viết lại các đối tượng `ReplyPayload` đã chuẩn hóa (bao gồm
  `presentation`, `delivery`, tham chiếu media, và văn bản) hoặc trả về `{ cancel: true }`.
- `message_sent`: quan sát thành công hoặc thất bại cuối cùng.

Đối với phản hồi TTS chỉ có âm thanh, `content` có thể chứa transcript lời nói ẩn
ngay cả khi payload kênh không có văn bản/chú thích hiển thị. Việc viết lại
`content` đó chỉ cập nhật transcript hiển thị với hook; nó không được kết xuất như
chú thích media.

Sự kiện `reply_payload_sending` có thể bao gồm `usageState`, một snapshot mô hình/mức dùng/ngữ cảnh
theo từng lượt trực tiếp ở mức best-effort. Gửi bền vững, phát lại đã khôi phục, và
phản hồi không có tương quan lượt chạy chính xác sẽ bỏ qua trường này.

Ngữ cảnh hook tin nhắn hiển thị các trường tương quan ổn định khi có:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, và `ctx.callDepth`. Ngữ cảnh inbound
và `before_dispatch` cũng hiển thị siêu dữ liệu trả lời khi kênh có
dữ liệu tin nhắn được trích dẫn đã lọc theo khả năng hiển thị: `replyToId`, `replyToIdFull`,
`replyToBody`, `replyToSender`, và `replyToIsQuote`. Ưu tiên các trường hạng nhất
này trước khi đọc siêu dữ liệu cũ.

Ưu tiên các trường `threadId` và `replyToId` có kiểu trước khi dùng siêu dữ liệu
riêng theo kênh.

Quy tắc quyết định:

- `message_sending` với `cancel: true` là trạng thái kết thúc.
- `message_sending` với `cancel: false` được coi là không có quyết định.
- `content` đã viết lại tiếp tục đi tới các hook có mức ưu tiên thấp hơn, trừ khi một hook sau đó
  hủy việc gửi.
- `reply_payload_sending` chạy sau khi chuẩn hóa payload và trước khi gửi qua kênh,
  bao gồm cả các phản hồi được định tuyến trở lại kênh gốc. Các trình xử lý
  chạy tuần tự và mỗi trình xử lý thấy payload mới nhất do
  các trình xử lý có mức ưu tiên cao hơn tạo ra.
- Payload của `reply_payload_sending` không để lộ các dấu hiệu tin cậy runtime như
  `trustedLocalMedia`; Plugin có thể chỉnh sửa hình dạng payload nhưng không thể cấp quyền tin cậy
  cho phương tiện cục bộ.
- `message_sending` có thể trả về `cancelReason` và `metadata` có giới hạn cùng với một
  lần hủy. Các API vòng đời tin nhắn mới hiển thị điều này dưới dạng kết quả gửi bị chặn
  với lý do `cancelled_by_message_sending_hook`; cơ chế gửi trực tiếp cũ
  tiếp tục trả về một mảng kết quả rỗng để tương thích.
- `message_sent` chỉ dùng để quan sát. Lỗi của trình xử lý được ghi log và không
  thay đổi kết quả gửi.

## Hook cài đặt

Sử dụng `security.installPolicy` cho các quyết định cho phép/chặn do người vận hành sở hữu. Chính sách đó
chạy từ cấu hình OpenClaw, bao phủ các đường dẫn cài đặt và cập nhật qua CLI, và chặn mặc định
khi được bật nhưng không khả dụng.

`before_install` là một hook vòng đời runtime của Plugin. Nó chạy sau
`security.installPolicy` chỉ trong tiến trình OpenClaw nơi các hook Plugin
đã được tải, chẳng hạn như các luồng cài đặt dựa trên Gateway. Nó hữu ích cho
các quan sát, cảnh báo và kiểm tra tương thích do Plugin sở hữu, nhưng không phải là
ranh giới bảo mật doanh nghiệp hoặc máy chủ chính cho việc cài đặt. Trường `builtinScan`
vẫn nằm trong payload sự kiện để tương thích, nhưng OpenClaw không còn
chạy cơ chế chặn mã nguy hiểm tích hợp tại thời điểm cài đặt, nên đây là một kết quả `ok`
rỗng. Trả về các phát hiện bổ sung hoặc `{ block: true, blockReason }` để dừng
cài đặt trong tiến trình đó.

`block: true` là trạng thái kết thúc. `block: false` được coi là không có quyết định.
Lỗi của trình xử lý sẽ chặn cài đặt theo cơ chế chặn mặc định khi lỗi.

## Vòng đời Gateway

Sử dụng `gateway_start` cho các dịch vụ Plugin cần trạng thái do Gateway sở hữu. Ngữ cảnh
cung cấp `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` để
kiểm tra và cập nhật Cron. Sử dụng `gateway_stop` để dọn dẹp các tài nguyên
chạy dài hạn.

Không dựa vào hook nội bộ `gateway:startup` cho các dịch vụ runtime
do Plugin sở hữu.

`cron_changed` được kích hoạt cho các sự kiện vòng đời Cron do Gateway sở hữu, với một
payload sự kiện có kiểu bao phủ các lý do `added`, `updated`, `removed`, `started`, `finished`,
và `scheduled`. Sự kiện mang theo một snapshot `PluginHookGatewayCronJob`
(bao gồm `state.nextRunAtMs`, `state.lastRunStatus`, và
`state.lastError` khi có) cộng với một `PluginHookGatewayCronDeliveryStatus`
là `not-requested` | `delivered` | `not-delivered` | `unknown`. Các sự kiện đã xóa
vẫn mang snapshot job đã xóa để các bộ lập lịch bên ngoài có thể
đồng bộ trạng thái. Sử dụng `ctx.getCron?.()` và `ctx.config` từ ngữ cảnh
runtime khi đồng bộ các bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw là
nguồn sự thật cho việc kiểm tra thời điểm đến hạn và thực thi.

## Các mục sắp ngừng hỗ trợ

Một số bề mặt gần với hook đã bị đánh dấu ngừng hỗ trợ nhưng vẫn được hỗ trợ. Hãy di chuyển
trước bản phát hành lớn tiếp theo:

- **Phong bì kênh dạng văn bản thuần** trong các trình xử lý `inbound_claim` và `message_received`.
  Đọc `BodyForAgent` và các khối ngữ cảnh người dùng có cấu trúc
  thay vì phân tích văn bản phong bì phẳng. Xem
  [Phong bì kênh dạng văn bản thuần → BodyForAgent](/vi/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** vẫn còn để tương thích. Plugin mới nên dùng
  `before_model_resolve` và `before_prompt_build` thay vì pha kết hợp.
- **`subagent_spawning`** vẫn còn để tương thích với Plugin cũ, nhưng
  Plugin mới không nên trả về định tuyến thread từ đó. Core chuẩn bị
  các binding subagent `thread: true` thông qua các adapter binding phiên kênh
  trước khi `subagent_spawned` được kích hoạt.
- **`deactivate`** vẫn là một alias tương thích dọn dẹp đã ngừng hỗ trợ cho đến
  sau 2026-08-16. Plugin mới nên dùng `gateway_stop`.
- **`onResolution` trong `before_tool_call`** hiện dùng union có kiểu
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) thay vì `string` dạng tự do.

Để xem danh sách đầy đủ - đăng ký capability bộ nhớ, hồ sơ suy luận của provider,
provider xác thực bên ngoài, kiểu khám phá provider, accessor runtime tác vụ,
và việc đổi tên `command-auth` → `command-status` - hãy xem
[Di chuyển Plugin SDK → Các mục đang ngừng hỗ trợ](/vi/plugins/sdk-migration#active-deprecations).

## Liên quan

- [Di chuyển Plugin SDK](/vi/plugins/sdk-migration) - các mục đang ngừng hỗ trợ và lịch trình gỡ bỏ
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Điểm vào Plugin](/vi/plugins/sdk-entrypoints)
- [Hook nội bộ](/vi/automation/hooks)
- [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals)
