---
read_when:
    - Bạn đang xây dựng một Plugin cần before_tool_call, before_agent_reply, hook tin nhắn hoặc hook vòng đời
    - Bạn cần chặn, viết lại hoặc yêu cầu phê duyệt cho các lệnh gọi công cụ từ một Plugin
    - Bạn đang quyết định giữa các điểm móc nội bộ và các điểm móc Plugin
summary: 'Móc của Plugin: chặn các sự kiện vòng đời của tác nhân, công cụ, tin nhắn, phiên và Gateway'
title: Các móc của Plugin
x-i18n:
    generated_at: "2026-05-10T19:42:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebdbb743441dfa9eba3d476171c1c8e9d9628d2669aeea0806ede19bafd61f62
    source_path: plugins/hooks.md
    workflow: 16
---

Các hook Plugin là các điểm mở rộng chạy trong tiến trình dành cho các Plugin OpenClaw. Dùng chúng
khi một Plugin cần kiểm tra hoặc thay đổi lượt chạy của agent, lệnh gọi công cụ, luồng tin nhắn,
vòng đời phiên, định tuyến subagent, cài đặt, hoặc quá trình khởi động Gateway.

Thay vào đó, hãy dùng [hook nội bộ](/vi/automation/hooks) khi bạn muốn một script
`HOOK.md` nhỏ do người vận hành cài đặt cho các sự kiện lệnh và Gateway như
`/new`, `/reset`, `/stop`, `agent:bootstrap`, hoặc `gateway:startup`.

## Bắt đầu nhanh

Đăng ký hook Plugin có kiểu bằng `api.on(...)` từ điểm vào Plugin của bạn:

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

Trình xử lý hook chạy tuần tự theo `priority` giảm dần. Các hook có cùng mức ưu tiên
giữ nguyên thứ tự đăng ký.

`api.on(name, handler, opts?)` chấp nhận:

- `priority` - thứ tự trình xử lý (cao hơn chạy trước).
- `timeoutMs` - ngân sách tùy chọn cho từng hook. Khi được đặt, trình chạy hook sẽ hủy
  trình xử lý đó sau khi hết ngân sách và tiếp tục với trình xử lý tiếp theo, thay vì
  để bước thiết lập hoặc truy hồi chậm tiêu thụ timeout mô hình đã cấu hình của bên gọi.
  Bỏ qua mục này để dùng timeout quan sát/quyết định mặc định mà trình chạy hook
  áp dụng chung.

Người vận hành cũng có thể đặt ngân sách hook mà không cần vá mã Plugin:

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

`hooks.timeouts.<hookName>` ghi đè `hooks.timeoutMs`, giá trị này ghi đè giá trị
`api.on(..., { timeoutMs })` do Plugin khai báo. Mỗi giá trị được cấu hình phải
là số nguyên dương không lớn hơn 600000 mili giây. Ưu tiên các ghi đè theo từng hook
cho các hook chậm đã biết để một Plugin không nhận ngân sách dài hơn
ở mọi nơi.

Mỗi hook nhận `event.context.pluginConfig`, là cấu hình đã phân giải cho
Plugin đã đăng ký trình xử lý đó. Dùng nó cho các quyết định hook cần
tùy chọn Plugin hiện tại; OpenClaw chèn nó theo từng trình xử lý mà không làm thay đổi
đối tượng sự kiện dùng chung mà các Plugin khác nhìn thấy.

## Danh mục hook

Hook được nhóm theo bề mặt mà chúng mở rộng. Các tên in **đậm** chấp nhận
kết quả quyết định (chặn, hủy, ghi đè, hoặc yêu cầu phê duyệt); tất cả các mục khác
chỉ dùng để quan sát.

**Lượt agent**

- `before_model_resolve` - ghi đè provider hoặc mô hình trước khi tin nhắn phiên được tải
- `agent_turn_prepare` - tiêu thụ các lần chèn lượt Plugin đang xếp hàng và thêm ngữ cảnh cùng lượt trước các hook prompt
- `before_prompt_build` - thêm ngữ cảnh động hoặc văn bản system prompt trước lệnh gọi mô hình
- `before_agent_start` - pha kết hợp chỉ để tương thích; ưu tiên hai hook ở trên
- **`before_agent_run`** - kiểm tra prompt cuối cùng và tin nhắn phiên trước khi gửi đến mô hình và tùy chọn chặn lượt chạy
- **`before_agent_reply`** - bỏ qua lượt mô hình bằng một phản hồi tổng hợp hoặc im lặng
- **`before_agent_finalize`** - kiểm tra câu trả lời cuối tự nhiên và yêu cầu thêm một lượt mô hình nữa
- `agent_end` - quan sát tin nhắn cuối, trạng thái thành công, và thời lượng lượt chạy
- `heartbeat_prompt_contribution` - thêm ngữ cảnh chỉ dành cho Heartbeat cho các Plugin giám sát nền và vòng đời

**Quan sát hội thoại**

- `model_call_started` / `model_call_ended` - quan sát metadata lệnh gọi provider/mô hình đã được làm sạch, thời gian, kết quả, và hash mã định danh yêu cầu có giới hạn mà không có nội dung prompt hoặc phản hồi
- `llm_input` - quan sát đầu vào provider (system prompt, prompt, lịch sử)
- `llm_output` - quan sát đầu ra provider

**Công cụ**

- **`before_tool_call`** - viết lại tham số công cụ, chặn thực thi, hoặc yêu cầu phê duyệt
- `after_tool_call` - quan sát kết quả công cụ, lỗi, và thời lượng
- **`tool_result_persist`** - viết lại tin nhắn assistant được tạo từ kết quả công cụ
- **`before_message_write`** - kiểm tra hoặc chặn một lần ghi tin nhắn đang diễn ra (hiếm)

**Tin nhắn và phân phối**

- **`inbound_claim`** - nhận xử lý một tin nhắn đến trước khi định tuyến agent (phản hồi tổng hợp)
- `message_received` - quan sát nội dung đến, người gửi, chuỗi, và metadata
- **`message_sending`** - viết lại nội dung gửi đi hoặc hủy phân phối
- `message_sent` - quan sát thành công hoặc thất bại khi phân phối gửi đi
- **`before_dispatch`** - kiểm tra hoặc viết lại một dispatch gửi đi trước khi chuyển giao cho kênh
- **`reply_dispatch`** - tham gia pipeline dispatch phản hồi cuối cùng

**Phiên và Compaction**

- `session_start` / `session_end` - theo dõi ranh giới vòng đời phiên
- `before_compaction` / `after_compaction` - quan sát hoặc chú thích các chu kỳ Compaction
- `before_reset` - quan sát các sự kiện đặt lại phiên (`/reset`, đặt lại theo chương trình)

**Subagent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - phối hợp định tuyến subagent và phân phối hoàn tất

**Vòng đời**

- `gateway_start` / `gateway_stop` - khởi động hoặc dừng các dịch vụ do Plugin sở hữu cùng Gateway
- `cron_changed` - quan sát các thay đổi vòng đời Cron do Gateway sở hữu (đã thêm, đã cập nhật, đã xóa, đã bắt đầu, đã hoàn tất, đã lên lịch)
- **`before_install`** - kiểm tra các lần quét cài đặt skill hoặc Plugin và tùy chọn chặn

## Chính sách lệnh gọi công cụ

`before_tool_call` nhận:

- `event.toolName`
- `event.params`
- `event.derivedPaths` tùy chọn, chứa các gợi ý đường dẫn mục tiêu do host suy luận theo khả năng tốt nhất
  cho các vỏ bọc công cụ phổ biến như `apply_patch`; khi có,
  các đường dẫn này có thể không đầy đủ hoặc có thể ước lượng rộng hơn những gì công cụ
  thật sự sẽ chạm tới (ví dụ, với đầu vào sai định dạng hoặc một phần)
- `event.runId` tùy chọn
- `event.toolCallId` tùy chọn
- các trường ngữ cảnh như `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (được đặt trên các lượt chạy do Cron điều khiển), và `ctx.trace` chẩn đoán

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
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Quy tắc:

- `block: true` là kết thúc và bỏ qua các trình xử lý có mức ưu tiên thấp hơn.
- `block: false` được coi là không có quyết định.
- `params` viết lại tham số công cụ để thực thi.
- `requireApproval` tạm dừng lượt chạy agent và hỏi người dùng thông qua phê duyệt Plugin.
  Lệnh `/approve` có thể phê duyệt cả exec và phê duyệt Plugin.
- Một `block: true` có mức ưu tiên thấp hơn vẫn có thể chặn sau khi một hook có mức ưu tiên cao hơn
  đã yêu cầu phê duyệt.
- `onResolution` nhận quyết định phê duyệt đã phân giải - `allow-once`,
  `allow-always`, `deny`, `timeout`, hoặc `cancelled`.

Các Plugin đi kèm cần chính sách cấp host có thể đăng ký chính sách công cụ tin cậy
bằng `api.registerTrustedToolPolicy(...)`. Các chính sách này chạy trước các hook
`before_tool_call` thông thường và trước quyết định của Plugin bên ngoài. Chỉ dùng chúng
cho các cổng được host tin cậy như chính sách workspace, thực thi ngân sách, hoặc
an toàn quy trình dành riêng. Plugin bên ngoài nên dùng hook `before_tool_call`
bình thường.

### Lưu kết quả công cụ

Kết quả công cụ có thể bao gồm `details` có cấu trúc để kết xuất UI, chẩn đoán,
định tuyến media, hoặc metadata do Plugin sở hữu. Hãy coi `details` là metadata runtime,
không phải nội dung prompt:

- OpenClaw loại bỏ `toolResult.details` trước khi phát lại provider và đầu vào Compaction
  để metadata không trở thành ngữ cảnh mô hình.
- Các mục phiên đã lưu chỉ giữ `details` có giới hạn. Details quá lớn sẽ được
  thay bằng bản tóm tắt gọn và `persistedDetailsTruncated: true`.
- `tool_result_persist` và `before_message_write` chạy trước giới hạn lưu cuối cùng.
  Hook vẫn nên giữ `details` trả về ở mức nhỏ và tránh
  đặt văn bản liên quan đến prompt chỉ trong `details`; hãy đặt đầu ra công cụ mà mô hình thấy được
  trong `content`.

## Hook prompt và mô hình

Dùng các hook theo pha cụ thể cho Plugin mới:

- `before_model_resolve`: chỉ nhận prompt hiện tại và
  metadata tệp đính kèm. Trả về `providerOverride` hoặc `modelOverride`.
- `agent_turn_prepare`: nhận prompt hiện tại, tin nhắn phiên đã chuẩn bị,
  và mọi lần chèn đang xếp hàng chính xác một lần đã được rút cho phiên này. Trả về
  `prependContext` hoặc `appendContext`.
- `before_prompt_build`: nhận prompt hiện tại và tin nhắn phiên.
  Trả về `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, hoặc `appendSystemContext`.
- `heartbeat_prompt_contribution`: chỉ chạy cho các lượt Heartbeat và trả về
  `prependContext` hoặc `appendContext`. Nó dành cho các trình giám sát nền
  cần tóm tắt trạng thái hiện tại mà không thay đổi các lượt do người dùng khởi tạo.

`before_agent_start` vẫn được giữ để tương thích. Ưu tiên các hook tường minh ở trên
để Plugin của bạn không phụ thuộc vào một pha kết hợp cũ.

`before_agent_run` chạy sau khi xây dựng prompt và trước mọi đầu vào mô hình,
bao gồm việc tải hình ảnh cục bộ theo prompt và quan sát `llm_input`. Nó nhận
đầu vào người dùng hiện tại dưới dạng `prompt`, cùng với lịch sử phiên đã tải trong `messages`
và system prompt đang hoạt động. Trả về `{ outcome: "block", reason, message? }`
để dừng lượt chạy trước khi mô hình có thể đọc prompt. `reason` là nội bộ;
`message` là nội dung thay thế hiển thị cho người dùng. Các kết quả duy nhất được hỗ trợ là
`pass` và `block`; các dạng quyết định không được hỗ trợ sẽ fail closed.

Khi một lượt chạy bị chặn, OpenClaw chỉ lưu văn bản thay thế trong
`message.content` cùng với metadata chặn không nhạy cảm như id Plugin chặn
và dấu thời gian. Văn bản gốc của người dùng không được giữ lại trong transcript hoặc ngữ cảnh tương lai.
Lý do chặn nội bộ được coi là nhạy cảm và bị loại khỏi
transcript, lịch sử, broadcast, log, và payload chẩn đoán. Khả năng quan sát
nên dùng các trường đã làm sạch như id bên chặn, kết quả, dấu thời gian, hoặc một
danh mục an toàn.

`before_agent_start` và `agent_end` bao gồm `event.runId` khi OpenClaw có thể
xác định lượt chạy đang hoạt động. Cùng giá trị đó cũng có sẵn trên `ctx.runId`.
Các lượt chạy do Cron điều khiển cũng hiển thị `ctx.jobId` (id công việc Cron gốc) để
hook Plugin có thể giới hạn metric, tác dụng phụ, hoặc trạng thái cho một công việc đã lên lịch cụ thể.

Đối với các lượt chạy bắt nguồn từ kênh, `ctx.messageProvider` là bề mặt provider như
`discord` hoặc `telegram`, trong khi `ctx.channelId` là mã định danh mục tiêu hội thoại
khi OpenClaw có thể suy luận từ khóa phiên hoặc metadata phân phối.

`agent_end` là hook quan sát và chạy fire-and-forget sau lượt. Trình chạy hook
áp dụng timeout 30 giây để một Plugin hoặc endpoint embedding bị kẹt
không thể khiến promise của hook chờ mãi. Timeout được ghi log và
OpenClaw tiếp tục; nó không hủy công việc mạng do Plugin sở hữu trừ khi
Plugin cũng dùng tín hiệu hủy riêng.

Dùng `model_call_started` và `model_call_ended` cho telemetry lệnh gọi provider
không nên nhận prompt thô, lịch sử, phản hồi, header, body yêu cầu,
hoặc id yêu cầu provider. Các hook này bao gồm metadata ổn định như
`runId`, `callId`, `provider`, `model`, `api`/`transport` tùy chọn,
`durationMs`/`outcome` kết thúc, và `upstreamRequestIdHash` khi OpenClaw có thể suy luận
hash id yêu cầu provider có giới hạn.

`before_agent_finalize` chỉ chạy khi một harness sắp chấp nhận câu trả lời cuối cùng tự nhiên của assistant. Đây không phải là đường dẫn hủy `/stop` và không chạy khi người dùng hủy một lượt. Trả về `{ action: "revise", reason }` để yêu cầu harness thực hiện thêm một lượt mô hình trước khi hoàn tất, `{ action:
"finalize", reason? }` để buộc hoàn tất, hoặc bỏ qua kết quả để tiếp tục.
Các hook `Stop` gốc của Codex được chuyển tiếp vào hook này dưới dạng các quyết định `before_agent_finalize` của OpenClaw.

Khi trả về `action: "revise"`, plugin có thể bao gồm metadata `retry` để khiến lượt mô hình bổ sung được giới hạn và an toàn khi phát lại:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` được nối vào lý do sửa đổi gửi tới harness.
`idempotencyKey` cho phép host đếm số lần thử lại cho cùng một yêu cầu plugin trên các quyết định hoàn tất tương đương, và `maxAttempts` giới hạn số lượt bổ sung mà host sẽ cho phép trước khi tiếp tục với câu trả lời cuối cùng tự nhiên.

Các plugin không được đóng gói sẵn cần hook hội thoại thô (`before_model_resolve`,
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

Có thể tắt các hook sửa đổi prompt và các lần chèn bền vững cho lượt tiếp theo theo từng plugin bằng `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Phần mở rộng phiên và chèn lượt tiếp theo

Plugin workflow có thể lưu trạng thái phiên nhỏ tương thích JSON bằng `api.registerSessionExtension(...)` và cập nhật trạng thái đó thông qua phương thức `sessions.pluginPatch` của Gateway. Các hàng phiên chiếu trạng thái phần mở rộng đã đăng ký qua `pluginExtensions`, cho phép Control UI và các client khác hiển thị trạng thái do plugin sở hữu mà không cần biết nội bộ plugin.

Dùng `api.enqueueNextTurnInjection(...)` khi plugin cần ngữ cảnh bền vững đến đúng một lần ở lượt mô hình tiếp theo. OpenClaw rút các mục chèn đã xếp hàng trước các hook prompt, bỏ các mục chèn đã hết hạn, và khử trùng lặp theo `idempotencyKey` cho mỗi plugin. Đây là điểm nối phù hợp cho các lần tiếp tục sau phê duyệt, tóm tắt chính sách, delta từ trình giám sát nền, và tiếp diễn lệnh cần hiển thị với mô hình ở lượt tiếp theo nhưng không nên trở thành văn bản system prompt vĩnh viễn.

Ngữ nghĩa dọn dẹp là một phần của hợp đồng. Các callback dọn dẹp phần mở rộng phiên và vòng đời runtime nhận `reset`, `delete`, `disable`, hoặc `restart`. Host xóa trạng thái phần mở rộng phiên bền vững và các mục chèn lượt tiếp theo đang chờ của plugin sở hữu đối với reset/delete/disable; restart giữ trạng thái phiên bền vững trong khi callback dọn dẹp cho phép plugin giải phóng tác vụ scheduler, ngữ cảnh chạy, và các tài nguyên ngoài băng khác của thế hệ runtime cũ.

## Hook tin nhắn

Dùng hook tin nhắn cho chính sách định tuyến và phân phối cấp kênh:

- `message_received`: quan sát nội dung đến, người gửi, `threadId`, `messageId`,
  `senderId`, tương quan run/session tùy chọn, và metadata.
- `message_sending`: viết lại `content` hoặc trả về `{ cancel: true }`.
- `message_sent`: quan sát thành công hoặc lỗi cuối cùng.

Đối với trả lời TTS chỉ có âm thanh, `content` có thể chứa bản chép lời nói ẩn ngay cả khi payload kênh không có văn bản/chú thích hiển thị. Việc viết lại `content` đó chỉ cập nhật bản chép lời thấy được qua hook; nó không được render dưới dạng chú thích media.

Ngữ cảnh hook tin nhắn hiển thị các trường tương quan ổn định khi có:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, và `ctx.callDepth`. Ưu tiên các trường hạng nhất này trước khi đọc metadata cũ.

Ưu tiên các trường `threadId` và `replyToId` có kiểu trước khi dùng metadata riêng theo kênh.

Quy tắc quyết định:

- `message_sending` với `cancel: true` là quyết định kết thúc.
- `message_sending` với `cancel: false` được xem là không có quyết định.
- `content` đã viết lại tiếp tục đi đến các hook có độ ưu tiên thấp hơn trừ khi một hook sau đó hủy phân phối.
- `message_sending` có thể trả về `cancelReason` và `metadata` có giới hạn cùng với một lần hủy. Các API vòng đời tin nhắn mới hiển thị điều này dưới dạng kết quả phân phối bị chặn với lý do `cancelled_by_message_sending_hook`; phân phối trực tiếp cũ tiếp tục trả về mảng kết quả rỗng để tương thích.
- `message_sent` chỉ dùng để quan sát. Lỗi handler được ghi log và không thay đổi kết quả phân phối.

## Hook cài đặt

`before_install` chạy sau bước quét tích hợp sẵn cho các lượt cài đặt skill và plugin.
Trả về các phát hiện bổ sung hoặc `{ block: true, blockReason }` để dừng cài đặt.

`block: true` là quyết định kết thúc. `block: false` được xem là không có quyết định.

## Vòng đời Gateway

Dùng `gateway_start` cho các dịch vụ plugin cần trạng thái do Gateway sở hữu. Ngữ cảnh hiển thị `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` để kiểm tra và cập nhật cron. Dùng `gateway_stop` để dọn dẹp tài nguyên chạy lâu.

Không dựa vào hook nội bộ `gateway:startup` cho các dịch vụ runtime do plugin sở hữu.

`cron_changed` kích hoạt cho các sự kiện vòng đời cron do Gateway sở hữu với payload sự kiện có kiểu bao gồm các lý do `added`, `updated`, `removed`, `started`, `finished`,
và `scheduled`. Sự kiện mang một snapshot `PluginHookGatewayCronJob`
(bao gồm `state.nextRunAtMs`, `state.lastRunStatus`, và `state.lastError` khi có) cùng với `PluginHookGatewayCronDeliveryStatus`
là `not-requested` | `delivered` | `not-delivered` | `unknown`. Sự kiện đã xóa vẫn mang snapshot job đã xóa để scheduler bên ngoài có thể đối soát trạng thái. Dùng `ctx.getCron?.()` và `ctx.config` từ ngữ cảnh runtime khi đồng bộ scheduler đánh thức bên ngoài, và giữ OpenClaw làm nguồn sự thật cho kiểm tra đến hạn và thực thi.

## Các mục sắp ngừng hỗ trợ

Một vài bề mặt liên quan đến hook đã bị ngừng khuyến nghị nhưng vẫn được hỗ trợ. Hãy di chuyển trước bản phát hành lớn tiếp theo:

- **Bao thư kênh văn bản thuần** trong các handler `inbound_claim` và `message_received`.
  Đọc `BodyForAgent` và các khối ngữ cảnh người dùng có cấu trúc thay vì phân tích văn bản bao thư phẳng. Xem
  [Bao thư kênh văn bản thuần → BodyForAgent](/vi/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** vẫn còn để tương thích. Plugin mới nên dùng
  `before_model_resolve` và `before_prompt_build` thay cho pha kết hợp.
- **`onResolution` trong `before_tool_call`** hiện dùng union có kiểu
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) thay vì một `string` dạng tự do.

Để xem danh sách đầy đủ - đăng ký khả năng bộ nhớ, hồ sơ suy nghĩ của provider, provider xác thực bên ngoài, kiểu khám phá provider, accessor runtime tác vụ, và đổi tên `command-auth` → `command-status` - xem
[Di chuyển Plugin SDK → Các mục ngừng hỗ trợ đang hoạt động](/vi/plugins/sdk-migration#active-deprecations).

## Liên quan

- [Di chuyển Plugin SDK](/vi/plugins/sdk-migration) - các mục ngừng hỗ trợ đang hoạt động và lịch trình xóa bỏ
- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Điểm vào Plugin](/vi/plugins/sdk-entrypoints)
- [Hook nội bộ](/vi/automation/hooks)
- [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals)
