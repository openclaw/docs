---
read_when:
    - Bạn đang xây dựng một plugin cần before_tool_call, before_agent_reply, hook thông điệp hoặc hook vòng đời
    - Bạn cần chặn, viết lại hoặc yêu cầu phê duyệt các lệnh gọi công cụ từ một plugin
    - Bạn đang lựa chọn giữa các hook nội bộ và các hook của Plugin
summary: 'Các hook Plugin: can thiệp vào các sự kiện vòng đời của tác tử, công cụ, thông điệp, phiên và Gateway'
title: Hook của Plugin
x-i18n:
    generated_at: "2026-05-11T20:34:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b363b8ed7452f0d8bdb267d3eaa38f579d6d7cfb7ace2085ac35baf9b253b575
    source_path: plugins/hooks.md
    workflow: 16
---

Các hook Plugin là các điểm mở rộng trong tiến trình dành cho Plugin OpenClaw. Hãy dùng chúng
khi một Plugin cần kiểm tra hoặc thay đổi các lượt chạy agent, lệnh gọi công cụ, luồng tin nhắn,
vòng đời phiên, định tuyến subagent, cài đặt, hoặc khởi động Gateway.

Thay vào đó, hãy dùng [hook nội bộ](/vi/automation/hooks) khi bạn muốn một script
`HOOK.md` nhỏ do operator cài đặt cho các sự kiện lệnh và Gateway như
`/new`, `/reset`, `/stop`, `agent:bootstrap`, hoặc `gateway:startup`.

## Bắt đầu nhanh

Đăng ký các hook Plugin có kiểu bằng `api.on(...)` từ entry Plugin của bạn:

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

Các handler hook chạy tuần tự theo `priority` giảm dần. Các hook có cùng mức ưu tiên
giữ nguyên thứ tự đăng ký.

`api.on(name, handler, opts?)` chấp nhận:

- `priority` - thứ tự handler (cao hơn chạy trước).
- `timeoutMs` - ngân sách tùy chọn cho từng hook. Khi được đặt, runner hook sẽ hủy
  handler đó sau khi ngân sách trôi qua và tiếp tục với handler kế tiếp, thay vì
  để thao tác thiết lập hoặc recall chậm tiêu thụ timeout model đã cấu hình của
  caller. Bỏ qua để dùng timeout quan sát/quyết định mặc định mà runner hook
  áp dụng chung.

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

`hooks.timeouts.<hookName>` ghi đè `hooks.timeoutMs`, giá trị này ghi đè giá trị
`api.on(..., { timeoutMs })` do Plugin khai báo. Mỗi giá trị được cấu hình phải
là số nguyên dương không lớn hơn 600000 mili giây. Ưu tiên override theo từng hook
cho các hook chậm đã biết để một Plugin không nhận ngân sách dài hơn ở mọi nơi.

Mỗi hook nhận `event.context.pluginConfig`, cấu hình đã phân giải cho
Plugin đã đăng ký handler đó. Dùng nó cho các quyết định hook cần
tùy chọn Plugin hiện tại; OpenClaw chèn giá trị này theo từng handler mà không làm thay đổi
đối tượng sự kiện dùng chung mà các Plugin khác thấy.

## Danh mục hook

Các hook được nhóm theo bề mặt mà chúng mở rộng. Tên in **đậm** chấp nhận
kết quả quyết định (chặn, hủy, ghi đè, hoặc yêu cầu phê duyệt); tất cả tên còn lại
chỉ dùng để quan sát.

**Lượt agent**

- `before_model_resolve` - ghi đè provider hoặc model trước khi tin nhắn phiên tải
- `agent_turn_prepare` - tiêu thụ các lượt chèn Plugin đang xếp hàng và thêm ngữ cảnh cùng lượt trước các hook prompt
- `before_prompt_build` - thêm ngữ cảnh động hoặc văn bản system-prompt trước lệnh gọi model
- `before_agent_start` - giai đoạn kết hợp chỉ để tương thích; ưu tiên hai hook phía trên
- **`before_agent_run`** - kiểm tra prompt cuối cùng và tin nhắn phiên trước khi gửi tới model, và tùy chọn chặn lượt chạy
- **`before_agent_reply`** - chặn sớm lượt model bằng một phản hồi tổng hợp hoặc im lặng
- **`before_agent_finalize`** - kiểm tra câu trả lời cuối tự nhiên và yêu cầu thêm một lượt model
- `agent_end` - quan sát tin nhắn cuối, trạng thái thành công, và thời lượng chạy
- `heartbeat_prompt_contribution` - thêm ngữ cảnh chỉ dành cho Heartbeat cho các Plugin giám sát nền và vòng đời

**Quan sát cuộc hội thoại**

- `model_call_started` / `model_call_ended` - quan sát metadata lệnh gọi provider/model đã được làm sạch, thời gian, kết quả, và hash request-id có giới hạn mà không có nội dung prompt hoặc phản hồi
- `llm_input` - quan sát đầu vào provider (system prompt, prompt, lịch sử)
- `llm_output` - quan sát đầu ra provider

**Công cụ**

- **`before_tool_call`** - viết lại tham số công cụ, chặn thực thi, hoặc yêu cầu phê duyệt
- `after_tool_call` - quan sát kết quả công cụ, lỗi, và thời lượng
- **`tool_result_persist`** - viết lại tin nhắn assistant được tạo từ kết quả công cụ
- **`before_message_write`** - kiểm tra hoặc chặn một thao tác ghi tin nhắn đang diễn ra (hiếm)

**Tin nhắn và phân phối**

- **`inbound_claim`** - nhận xử lý một tin nhắn đến trước khi định tuyến agent (phản hồi tổng hợp)
- `message_received` - quan sát nội dung đến, người gửi, luồng, và metadata
- **`message_sending`** - viết lại nội dung gửi đi hoặc hủy phân phối
- `message_sent` - quan sát phân phối gửi đi thành công hoặc thất bại
- **`before_dispatch`** - kiểm tra hoặc viết lại một dispatch gửi đi trước khi bàn giao cho kênh
- **`reply_dispatch`** - tham gia pipeline dispatch phản hồi cuối cùng

**Phiên và Compaction**

- `session_start` / `session_end` - theo dõi ranh giới vòng đời phiên. `reason` của sự kiện là một trong `new`, `reset`, `idle`, `daily`, `compaction`, `deleted`, `shutdown`, `restart`, hoặc `unknown`. Các giá trị `shutdown` và `restart` kích hoạt từ finalizer tắt Gateway khi tiến trình bị dừng hoặc khởi động lại trong lúc phiên vẫn đang hoạt động, để các Plugin hạ nguồn (như bộ nhớ hoặc kho transcript) có thể hoàn tất các hàng ghost vốn sẽ bị để lại ở trạng thái mở qua các lần khởi động lại. Finalizer có giới hạn để một Plugin chậm không thể chặn SIGTERM/SIGINT.
- `before_compaction` / `after_compaction` - quan sát hoặc chú thích các chu kỳ Compaction
- `before_reset` - quan sát sự kiện reset phiên (`/reset`, reset theo chương trình)

**Subagent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - phối hợp định tuyến subagent và phân phối hoàn tất

**Vòng đời**

- `gateway_start` / `gateway_stop` - khởi động hoặc dừng các dịch vụ do Plugin sở hữu cùng với Gateway
- `cron_changed` - quan sát các thay đổi vòng đời cron do gateway sở hữu (đã thêm, đã cập nhật, đã xóa, đã bắt đầu, đã hoàn tất, đã lên lịch)
- **`before_install`** - kiểm tra các lượt quét cài đặt skill hoặc Plugin và tùy chọn chặn

## Chính sách lệnh gọi công cụ

`before_tool_call` nhận:

- `event.toolName`
- `event.params`
- tùy chọn `event.derivedPaths`, chứa các gợi ý đường dẫn mục tiêu do host suy ra theo best-effort
  cho các envelope công cụ quen thuộc như `apply_patch`; khi có mặt,
  các đường dẫn này có thể không đầy đủ hoặc có thể ước lượng quá rộng những gì công cụ sẽ
  thực sự chạm tới (ví dụ, với đầu vào sai định dạng hoặc một phần)
- tùy chọn `event.runId`
- tùy chọn `event.toolCallId`
- các trường ngữ cảnh như `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (được đặt trên các lượt chạy do cron điều khiển), và `ctx.trace` chẩn đoán

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

- `block: true` là quyết định cuối cùng và bỏ qua các handler có mức ưu tiên thấp hơn.
- `block: false` được xem là không có quyết định.
- `params` viết lại tham số công cụ để thực thi.
- `requireApproval` tạm dừng lượt chạy agent và hỏi người dùng thông qua phê duyệt Plugin.
  Lệnh `/approve` có thể phê duyệt cả exec và phê duyệt Plugin.
- Một `block: true` có mức ưu tiên thấp hơn vẫn có thể chặn sau khi một hook có mức ưu tiên cao hơn
  đã yêu cầu phê duyệt.
- `onResolution` nhận quyết định phê duyệt đã phân giải - `allow-once`,
  `allow-always`, `deny`, `timeout`, hoặc `cancelled`.

Các Plugin tích hợp cần chính sách cấp host có thể đăng ký chính sách công cụ đáng tin cậy
bằng `api.registerTrustedToolPolicy(...)`. Chúng chạy trước các hook
`before_tool_call` thông thường và trước quyết định của Plugin bên ngoài. Chỉ dùng chúng
cho các cổng được host tin cậy như chính sách workspace, thực thi ngân sách, hoặc
an toàn workflow dành riêng. Plugin bên ngoài nên dùng các hook `before_tool_call`
thông thường.

### Lưu kết quả công cụ

Kết quả công cụ có thể bao gồm `details` có cấu trúc để render UI, chẩn đoán,
định tuyến media, hoặc metadata do Plugin sở hữu. Hãy xem `details` là metadata runtime,
không phải nội dung prompt:

- OpenClaw loại bỏ `toolResult.details` trước khi replay cho provider và đầu vào Compaction
  để metadata không trở thành ngữ cảnh model.
- Các entry phiên được lưu chỉ giữ `details` có giới hạn. Details quá lớn được
  thay bằng một bản tóm tắt gọn và `persistedDetailsTruncated: true`.
- `tool_result_persist` và `before_message_write` chạy trước giới hạn lưu cuối cùng.
  Hook vẫn nên giữ `details` trả về ở kích thước nhỏ và tránh
  đặt văn bản liên quan đến prompt chỉ trong `details`; hãy đặt đầu ra công cụ mà model nhìn thấy
  trong `content`.

## Hook prompt và model

Dùng các hook theo giai đoạn cho Plugin mới:

- `before_model_resolve`: chỉ nhận prompt hiện tại và metadata tệp đính kèm.
  Trả về `providerOverride` hoặc `modelOverride`.
- `agent_turn_prepare`: nhận prompt hiện tại, tin nhắn phiên đã chuẩn bị,
  và mọi lượt chèn đúng-một-lần đang xếp hàng đã được rút ra cho phiên này. Trả về
  `prependContext` hoặc `appendContext`.
- `before_prompt_build`: nhận prompt hiện tại và tin nhắn phiên.
  Trả về `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, hoặc `appendSystemContext`.
- `heartbeat_prompt_contribution`: chỉ chạy cho các lượt Heartbeat và trả về
  `prependContext` hoặc `appendContext`. Hook này dành cho các trình giám sát nền
  cần tóm tắt trạng thái hiện tại mà không thay đổi các lượt do người dùng khởi tạo.

`before_agent_start` vẫn được giữ để tương thích. Ưu tiên các hook tường minh ở trên
để Plugin của bạn không phụ thuộc vào một giai đoạn kết hợp legacy.

`before_agent_run` chạy sau khi xây dựng prompt và trước mọi đầu vào model,
bao gồm tải hình ảnh cục bộ theo prompt và quan sát `llm_input`. Nó nhận
đầu vào người dùng hiện tại dưới dạng `prompt`, cùng lịch sử phiên đã tải trong `messages`
và system prompt đang hoạt động. Trả về `{ outcome: "block", reason, message? }`
để dừng lượt chạy trước khi model có thể đọc prompt. `reason` là nội bộ;
`message` là nội dung thay thế hiển thị cho người dùng. Các outcome duy nhất được hỗ trợ là
`pass` và `block`; các hình dạng quyết định không được hỗ trợ sẽ fail closed.

Khi một lượt chạy bị chặn, OpenClaw chỉ lưu văn bản thay thế trong
`message.content` cùng metadata chặn không nhạy cảm như id Plugin chặn
và timestamp. Văn bản gốc của người dùng không được giữ lại trong transcript hoặc ngữ cảnh tương lai.
Các lý do chặn nội bộ được xem là nhạy cảm và bị loại khỏi
transcript, lịch sử, broadcast, log, và payload chẩn đoán. Khả năng quan sát
nên dùng các trường đã được làm sạch như id blocker, outcome, timestamp, hoặc một danh mục an toàn.

`before_agent_start` và `agent_end` bao gồm `event.runId` khi OpenClaw có thể
xác định lượt chạy đang hoạt động. Giá trị tương tự cũng có trên `ctx.runId`.
Các lượt chạy do cron điều khiển cũng hiển thị `ctx.jobId` (id cron job gốc) để
các hook Plugin có thể giới hạn metrics, tác dụng phụ, hoặc trạng thái vào một job đã lên lịch cụ thể.

Đối với các lượt chạy bắt nguồn từ kênh, `ctx.messageProvider` là bề mặt provider như
`discord` hoặc `telegram`, còn `ctx.channelId` là mã định danh mục tiêu cuộc hội thoại
khi OpenClaw có thể suy ra từ khóa phiên hoặc metadata phân phối.

`agent_end` là hook quan sát và chạy fire-and-forget sau lượt. Runner hook
áp dụng timeout 30 giây để một Plugin hoặc endpoint embedding bị treo
không thể khiến promise hook chờ mãi. Timeout được ghi log và
OpenClaw tiếp tục; nó không hủy công việc mạng do Plugin sở hữu trừ khi
Plugin cũng dùng abort signal riêng của mình.

Sử dụng `model_call_started` và `model_call_ended` cho telemetry cuộc gọi nhà cung cấp
không được nhận prompt thô, lịch sử, phản hồi, header, thân yêu cầu hoặc ID yêu cầu
của nhà cung cấp. Các hook này bao gồm metadata ổn định như
`runId`, `callId`, `provider`, `model`, `api`/`transport` tùy chọn, `durationMs`/`outcome`
cuối cùng, và `upstreamRequestIdHash` khi OpenClaw có thể suy ra một hàm băm ID yêu cầu
nhà cung cấp có giới hạn.

`before_agent_finalize` chỉ chạy khi một harness sắp chấp nhận câu trả lời trợ lý
cuối cùng tự nhiên. Đây không phải là đường dẫn hủy `/stop` và không chạy khi người dùng
hủy một lượt. Trả về `{ action: "revise", reason }` để yêu cầu harness thực hiện thêm
một lượt mô hình trước khi hoàn tất, `{ action:
"finalize", reason? }` để buộc hoàn tất, hoặc bỏ qua kết quả để tiếp tục.
Các hook `Stop` gốc của Codex được chuyển tiếp vào hook này dưới dạng các quyết định
`before_agent_finalize` của OpenClaw.

Khi trả về `action: "revise"`, plugin có thể bao gồm metadata `retry` để làm cho
lượt mô hình bổ sung có giới hạn và an toàn khi phát lại:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` được thêm vào lý do sửa đổi gửi tới harness.
`idempotencyKey` cho phép host đếm số lần thử lại cho cùng một yêu cầu plugin trên các
quyết định hoàn tất tương đương, và `maxAttempts` giới hạn số lượt bổ sung mà host sẽ
cho phép trước khi tiếp tục với câu trả lời cuối cùng tự nhiên.

Các plugin không được đóng gói kèm cần hook hội thoại thô (`before_model_resolve`,
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

Có thể tắt các hook thay đổi prompt và các injection lượt kế tiếp bền vững theo từng plugin
bằng `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Phần mở rộng phiên và injection lượt kế tiếp

Plugin workflow có thể lưu giữ trạng thái phiên nhỏ, tương thích JSON bằng
`api.registerSessionExtension(...)` và cập nhật trạng thái đó thông qua phương thức Gateway
`sessions.pluginPatch`. Các hàng phiên chiếu trạng thái phần mở rộng đã đăng ký
qua `pluginExtensions`, cho phép Control UI và các client khác hiển thị trạng thái
do plugin sở hữu mà không cần biết nội bộ plugin.

Sử dụng `api.enqueueNextTurnInjection(...)` khi một plugin cần ngữ cảnh bền vững
đến đúng một lần ở lượt mô hình kế tiếp. OpenClaw xả các injection đã xếp hàng trước
các hook prompt, loại bỏ injection đã hết hạn và khử trùng lặp theo `idempotencyKey`
trên mỗi plugin. Đây là seam phù hợp cho việc tiếp tục sau phê duyệt, tóm tắt chính sách,
delta từ trình giám sát nền và tiếp nối lệnh cần hiển thị cho mô hình ở lượt kế tiếp
nhưng không nên trở thành văn bản prompt hệ thống vĩnh viễn.

Ngữ nghĩa dọn dẹp là một phần của hợp đồng. Các callback dọn dẹp phần mở rộng phiên và
dọn dẹp vòng đời runtime nhận `reset`, `delete`, `disable`, hoặc
`restart`. Host xóa trạng thái phần mở rộng phiên bền vững và các injection lượt kế tiếp
đang chờ của plugin sở hữu đối với reset/delete/disable; restart giữ lại trạng thái phiên
bền vững trong khi các callback dọn dẹp cho phép plugin giải phóng job scheduler,
ngữ cảnh chạy và các tài nguyên ngoài băng khác cho thế hệ runtime cũ.

## Hook thông điệp

Sử dụng hook thông điệp cho chính sách định tuyến và gửi ở cấp kênh:

- `message_received`: quan sát nội dung đến, người gửi, `threadId`, `messageId`,
  `senderId`, tương quan run/session tùy chọn và metadata.
- `message_sending`: ghi lại `content` hoặc trả về `{ cancel: true }`.
- `message_sent`: quan sát thành công hoặc thất bại cuối cùng.

Đối với phản hồi TTS chỉ có âm thanh, `content` có thể chứa bản ghi lời nói ẩn
ngay cả khi payload kênh không có văn bản/chú thích hiển thị. Việc ghi lại
`content` đó chỉ cập nhật bản ghi hiển thị với hook; nó không được render dưới dạng
chú thích media.

Ngữ cảnh hook thông điệp cung cấp các trường tương quan ổn định khi có:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, và `ctx.callDepth`. Ưu tiên
các trường hạng nhất này trước khi đọc metadata cũ.

Ưu tiên các trường `threadId` và `replyToId` có kiểu trước khi dùng metadata
đặc thù theo kênh.

Quy tắc quyết định:

- `message_sending` với `cancel: true` là cuối cùng.
- `message_sending` với `cancel: false` được xem là không có quyết định.
- `content` đã ghi lại tiếp tục đến các hook có mức ưu tiên thấp hơn trừ khi hook sau đó
  hủy việc gửi.
- `message_sending` có thể trả về `cancelReason` và `metadata` có giới hạn cùng với một
  lệnh hủy. Các API vòng đời thông điệp mới cung cấp điều này dưới dạng kết quả gửi bị chặn
  với lý do `cancelled_by_message_sending_hook`; gửi trực tiếp kiểu cũ tiếp tục
  trả về mảng kết quả rỗng để tương thích.
- `message_sent` chỉ để quan sát. Lỗi handler được ghi log và không thay đổi
  kết quả gửi.

## Hook cài đặt

`before_install` chạy sau bước quét tích hợp sẵn cho cài đặt skill và plugin.
Trả về các phát hiện bổ sung hoặc `{ block: true, blockReason }` để dừng
cài đặt.

`block: true` là cuối cùng. `block: false` được xem là không có quyết định.

## Vòng đời Gateway

Sử dụng `gateway_start` cho các dịch vụ plugin cần trạng thái do Gateway sở hữu. Ngữ cảnh
cung cấp `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` để
kiểm tra và cập nhật cron. Sử dụng `gateway_stop` để dọn dẹp các tài nguyên
chạy lâu.

Không dựa vào hook nội bộ `gateway:startup` cho các dịch vụ runtime do plugin sở hữu.

`cron_changed` kích hoạt cho các sự kiện vòng đời cron do gateway sở hữu với payload
sự kiện có kiểu bao gồm các lý do `added`, `updated`, `removed`, `started`, `finished`,
và `scheduled`. Sự kiện mang một snapshot `PluginHookGatewayCronJob`
(bao gồm `state.nextRunAtMs`, `state.lastRunStatus`, và
`state.lastError` khi có) cùng với `PluginHookGatewayCronDeliveryStatus`
là `not-requested` | `delivered` | `not-delivered` | `unknown`. Các sự kiện đã xóa
vẫn mang snapshot job đã xóa để các scheduler bên ngoài có thể
đối chiếu trạng thái. Sử dụng `ctx.getCron?.()` và `ctx.config` từ ngữ cảnh runtime
khi đồng bộ các wake scheduler bên ngoài, và giữ OpenClaw làm
nguồn sự thật cho kiểm tra đến hạn và thực thi.

## Sắp ngừng hỗ trợ

Một vài bề mặt gần với hook đã bị ngừng khuyến nghị nhưng vẫn được hỗ trợ. Hãy chuyển đổi
trước bản phát hành lớn tiếp theo:

- **Phong bì kênh dạng văn bản thuần** trong các handler `inbound_claim` và `message_received`.
  Đọc `BodyForAgent` và các khối ngữ cảnh người dùng có cấu trúc
  thay vì phân tích văn bản phong bì phẳng. Xem
  [Phong bì kênh dạng văn bản thuần → BodyForAgent](/vi/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** vẫn tồn tại để tương thích. Plugin mới nên dùng
  `before_model_resolve` và `before_prompt_build` thay cho pha kết hợp.
- **`onResolution` trong `before_tool_call`** hiện dùng union có kiểu
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) thay vì một `string` tự do.

Để xem danh sách đầy đủ - đăng ký khả năng bộ nhớ, hồ sơ thinking của nhà cung cấp,
nhà cung cấp xác thực bên ngoài, kiểu khám phá nhà cung cấp, accessor runtime tác vụ,
và đổi tên `command-auth` → `command-status` - hãy xem
[Chuyển đổi Plugin SDK → Các mục ngừng hỗ trợ đang hoạt động](/vi/plugins/sdk-migration#active-deprecations).

## Liên quan

- [Chuyển đổi Plugin SDK](/vi/plugins/sdk-migration) - các mục ngừng hỗ trợ đang hoạt động và lịch trình loại bỏ
- [Xây dựng plugin](/vi/plugins/building-plugins)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Điểm vào Plugin](/vi/plugins/sdk-entrypoints)
- [Hook nội bộ](/vi/automation/hooks)
- [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals)
