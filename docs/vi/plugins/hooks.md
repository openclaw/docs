---
read_when:
    - Bạn đang xây dựng một plugin cần before_tool_call, before_agent_reply, hook tin nhắn hoặc hook vòng đời
    - Bạn cần chặn, viết lại hoặc yêu cầu phê duyệt các lệnh gọi công cụ từ một Plugin
    - Bạn đang quyết định giữa hook nội bộ và hook Plugin
summary: 'Móc nối của Plugin: chặn bắt các sự kiện vòng đời của tác tử, công cụ, tin nhắn, phiên và Gateway'
title: Các móc nối Plugin
x-i18n:
    generated_at: "2026-05-05T01:49:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37c7273036463c87e478db5678822b676c89447caee65f2f3f47a45194d1e37b
    source_path: plugins/hooks.md
    workflow: 16
---

Các hook của Plugin là các điểm mở rộng trong tiến trình cho Plugin OpenClaw. Sử dụng chúng
khi một Plugin cần kiểm tra hoặc thay đổi lượt chạy agent, lệnh gọi công cụ, luồng tin nhắn,
vòng đời phiên, định tuyến subagent, cài đặt, hoặc quá trình khởi động Gateway.

Thay vào đó, hãy dùng [hook nội bộ](/vi/automation/hooks) khi bạn muốn một script
`HOOK.md` nhỏ do operator cài đặt cho các sự kiện lệnh và Gateway như
`/new`, `/reset`, `/stop`, `agent:bootstrap`, hoặc `gateway:startup`.

## Bắt đầu nhanh

Đăng ký các hook Plugin có kiểu với `api.on(...)` từ entry Plugin của bạn:

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

- `priority` — thứ tự handler (giá trị cao hơn chạy trước).
- `timeoutMs` — ngân sách tùy chọn cho từng hook. Khi được đặt, trình chạy hook sẽ hủy
  handler đó sau khi ngân sách trôi qua và tiếp tục với handler tiếp theo, thay vì
  để phần thiết lập chậm hoặc công việc recall tiêu tốn timeout mô hình đã cấu hình
  của bên gọi. Bỏ qua để dùng timeout quan sát/quyết định mặc định mà
  trình chạy hook áp dụng chung.

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
`api.on(..., { timeoutMs })` do tác giả Plugin đặt. Mỗi giá trị được cấu hình phải
là số nguyên dương không lớn hơn 600000 mili giây. Ưu tiên ghi đè theo từng hook
cho các hook được biết là chậm để một Plugin không nhận ngân sách dài hơn
ở mọi nơi.

Mỗi hook nhận `event.context.pluginConfig`, cấu hình đã phân giải cho
Plugin đã đăng ký handler đó. Dùng nó cho các quyết định hook cần
tùy chọn Plugin hiện tại; OpenClaw chèn cấu hình này theo từng handler mà không làm thay đổi
đối tượng sự kiện dùng chung mà các Plugin khác nhìn thấy.

## Danh mục hook

Các hook được nhóm theo bề mặt mà chúng mở rộng. Tên in **đậm** chấp nhận
kết quả quyết định (chặn, hủy, ghi đè, hoặc yêu cầu phê duyệt); tất cả các hook khác
chỉ dùng để quan sát.

**Lượt agent**

- `before_model_resolve` — ghi đè provider hoặc mô hình trước khi tải tin nhắn phiên
- `agent_turn_prepare` — tiêu thụ các phần chèn lượt Plugin đã xếp hàng và thêm ngữ cảnh cùng lượt trước các hook prompt
- `before_prompt_build` — thêm ngữ cảnh động hoặc văn bản system prompt trước lệnh gọi mô hình
- `before_agent_start` — pha kết hợp chỉ để tương thích; ưu tiên hai hook ở trên
- **`before_agent_reply`** — đi tắt lượt mô hình bằng phản hồi tổng hợp hoặc im lặng
- **`before_agent_finalize`** — kiểm tra câu trả lời cuối tự nhiên và yêu cầu thêm một lượt mô hình
- `agent_end` — quan sát tin nhắn cuối, trạng thái thành công và thời lượng chạy
- `heartbeat_prompt_contribution` — thêm ngữ cảnh chỉ dành cho Heartbeat cho Plugin giám sát nền và vòng đời

**Quan sát hội thoại**

- `model_call_started` / `model_call_ended` — quan sát metadata lệnh gọi provider/mô hình đã được làm sạch, thời gian, kết quả và hash request-id có giới hạn mà không có nội dung prompt hoặc phản hồi
- `llm_input` — quan sát đầu vào provider (system prompt, prompt, lịch sử)
- `llm_output` — quan sát đầu ra provider

**Công cụ**

- **`before_tool_call`** — viết lại tham số công cụ, chặn thực thi, hoặc yêu cầu phê duyệt
- `after_tool_call` — quan sát kết quả công cụ, lỗi và thời lượng
- **`tool_result_persist`** — viết lại tin nhắn assistant được tạo từ kết quả công cụ
- **`before_message_write`** — kiểm tra hoặc chặn một thao tác ghi tin nhắn đang diễn ra (hiếm gặp)

**Tin nhắn và phân phối**

- **`inbound_claim`** — nhận xử lý một tin nhắn đến trước khi định tuyến agent (phản hồi tổng hợp)
- `message_received` — quan sát nội dung đến, người gửi, luồng và metadata
- **`message_sending`** — viết lại nội dung gửi đi hoặc hủy phân phối
- `message_sent` — quan sát phân phối gửi đi thành công hoặc thất bại
- **`before_dispatch`** — kiểm tra hoặc viết lại một dispatch gửi đi trước khi bàn giao cho kênh
- **`reply_dispatch`** — tham gia pipeline dispatch phản hồi cuối

**Phiên và Compaction**

- `session_start` / `session_end` — theo dõi ranh giới vòng đời phiên
- `before_compaction` / `after_compaction` — quan sát hoặc chú thích các chu kỳ Compaction
- `before_reset` — quan sát sự kiện đặt lại phiên (`/reset`, đặt lại theo chương trình)

**Subagent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — phối hợp định tuyến subagent và phân phối hoàn tất

**Vòng đời**

- `gateway_start` / `gateway_stop` — khởi động hoặc dừng các dịch vụ do Plugin sở hữu cùng Gateway
- `cron_changed` — quan sát các thay đổi vòng đời Cron do Gateway sở hữu (đã thêm, đã cập nhật, đã xóa, đã bắt đầu, đã hoàn tất, đã lên lịch)
- **`before_install`** — kiểm tra các lần quét cài đặt Skills hoặc Plugin và tùy chọn chặn

## Chính sách lệnh gọi công cụ

`before_tool_call` nhận:

- `event.toolName`
- `event.params`
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

- `block: true` là quyết định kết thúc và bỏ qua các handler có priority thấp hơn.
- `block: false` được xem như không có quyết định.
- `params` viết lại tham số công cụ để thực thi.
- `requireApproval` tạm dừng lượt chạy agent và hỏi người dùng thông qua các phê duyệt Plugin.
  Lệnh `/approve` có thể phê duyệt cả phê duyệt exec và Plugin.
- Một `block: true` có priority thấp hơn vẫn có thể chặn sau khi một hook có priority cao hơn
  đã yêu cầu phê duyệt.
- `onResolution` nhận quyết định phê duyệt đã phân giải — `allow-once`,
  `allow-always`, `deny`, `timeout`, hoặc `cancelled`.

Các Plugin đi kèm cần chính sách cấp host có thể đăng ký chính sách công cụ tin cậy
với `api.registerTrustedToolPolicy(...)`. Các chính sách này chạy trước các hook
`before_tool_call` thông thường và trước quyết định của Plugin bên ngoài. Chỉ dùng chúng
cho các cổng được host tin cậy như chính sách workspace, thực thi ngân sách, hoặc
an toàn workflow dành riêng. Plugin bên ngoài nên dùng các hook `before_tool_call`
thông thường.

### Lưu giữ kết quả công cụ

Kết quả công cụ có thể bao gồm `details` có cấu trúc để hiển thị UI, chẩn đoán,
định tuyến media, hoặc metadata do Plugin sở hữu. Xem `details` là metadata runtime,
không phải nội dung prompt:

- OpenClaw loại bỏ `toolResult.details` trước khi phát lại provider và đầu vào Compaction
  để metadata không trở thành ngữ cảnh mô hình.
- Các mục phiên được lưu giữ chỉ giữ `details` có giới hạn. Details quá lớn được
  thay thế bằng bản tóm tắt gọn và `persistedDetailsTruncated: true`.
- `tool_result_persist` và `before_message_write` chạy trước giới hạn lưu giữ cuối cùng.
  Hook vẫn nên giữ `details` trả về ở kích thước nhỏ và tránh
  đặt văn bản liên quan đến prompt chỉ trong `details`; đặt đầu ra công cụ mà mô hình có thể thấy
  trong `content`.

## Hook prompt và mô hình

Dùng các hook theo pha cụ thể cho Plugin mới:

- `before_model_resolve`: chỉ nhận prompt hiện tại và metadata tệp đính kèm.
  Trả về `providerOverride` hoặc `modelOverride`.
- `agent_turn_prepare`: nhận prompt hiện tại, tin nhắn phiên đã chuẩn bị,
  và mọi phần chèn đã xếp hàng đúng-một-lần được rút cho phiên này. Trả về
  `prependContext` hoặc `appendContext`.
- `before_prompt_build`: nhận prompt hiện tại và tin nhắn phiên.
  Trả về `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, hoặc `appendSystemContext`.
- `heartbeat_prompt_contribution`: chỉ chạy cho các lượt Heartbeat và trả về
  `prependContext` hoặc `appendContext`. Nó dành cho các trình giám sát nền
  cần tóm tắt trạng thái hiện tại mà không thay đổi các lượt do người dùng khởi tạo.

`before_agent_start` vẫn được giữ để tương thích. Ưu tiên các hook rõ ràng ở trên
để Plugin của bạn không phụ thuộc vào một pha kết hợp cũ.

`before_agent_start` và `agent_end` bao gồm `event.runId` khi OpenClaw có thể
xác định lượt chạy đang hoạt động. Cùng giá trị đó cũng có sẵn trên `ctx.runId`.
Các lượt chạy do Cron điều khiển cũng hiển thị `ctx.jobId` (id job Cron nguồn) để
hook Plugin có thể giới hạn metrics, tác dụng phụ hoặc trạng thái theo một job đã lên lịch
cụ thể.

Đối với các lượt chạy bắt nguồn từ kênh, `ctx.messageProvider` là bề mặt provider như
`discord` hoặc `telegram`, còn `ctx.channelId` là mã định danh đích hội thoại
khi OpenClaw có thể suy ra từ khóa phiên hoặc metadata phân phối.

`agent_end` là hook quan sát và chạy fire-and-forget sau lượt. Trình chạy
hook áp dụng timeout 30 giây để một Plugin hoặc endpoint embedding bị kẹt
không thể khiến promise hook chờ mãi. Timeout được ghi log và
OpenClaw tiếp tục; nó không hủy công việc mạng do Plugin sở hữu trừ khi
Plugin cũng dùng abort signal riêng.

Dùng `model_call_started` và `model_call_ended` cho telemetry lệnh gọi provider
không nên nhận prompt thô, lịch sử, phản hồi, header, request body,
hoặc request ID của provider. Các hook này bao gồm metadata ổn định như
`runId`, `callId`, `provider`, `model`, `api`/`transport` tùy chọn,
`durationMs`/`outcome` kết thúc, và `upstreamRequestIdHash` khi OpenClaw có thể suy ra
hash request-id provider có giới hạn.

`before_agent_finalize` chỉ chạy khi harness sắp chấp nhận một
câu trả lời cuối tự nhiên của assistant. Nó không phải đường dẫn hủy `/stop` và không
chạy khi người dùng hủy một lượt. Trả về `{ action: "revise", reason }` để yêu cầu
harness thực hiện thêm một lượt mô hình trước khi hoàn tất, `{ action:
"finalize", reason? }` để buộc hoàn tất, hoặc bỏ qua kết quả để tiếp tục.
Các hook `Stop` gốc của Codex được chuyển tiếp vào hook này dưới dạng quyết định
`before_agent_finalize` của OpenClaw.

Khi trả về `action: "revise"`, Plugin có thể bao gồm metadata `retry` để làm cho
lượt mô hình bổ sung có giới hạn và an toàn khi phát lại:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` được nối vào lý do chỉnh sửa gửi tới harness.
`idempotencyKey` cho phép host đếm số lần thử lại cho cùng một yêu cầu Plugin trên
các quyết định finalize tương đương, và `maxAttempts` giới hạn số lượt bổ sung mà
host sẽ cho phép trước khi tiếp tục với câu trả lời cuối tự nhiên.

Plugin không đi kèm cần `llm_input`, `llm_output`,
`before_agent_finalize`, hoặc `agent_end` phải đặt:

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

Các hook làm thay đổi prompt và phần chèn lượt tiếp theo bền vững có thể bị tắt theo từng Plugin
với `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Tiện ích mở rộng phiên và phần chèn lượt tiếp theo

Plugin quy trình làm việc có thể lưu giữ trạng thái phiên nhỏ tương thích với JSON bằng `api.registerSessionExtension(...)` và cập nhật trạng thái đó thông qua phương thức `sessions.pluginPatch` của Gateway. Các hàng phiên chiếu trạng thái tiện ích mở rộng đã đăng ký thông qua `pluginExtensions`, cho phép Control UI và các máy khách khác hiển thị trạng thái do Plugin sở hữu mà không cần biết nội bộ Plugin.

Dùng `api.enqueueNextTurnInjection(...)` khi một Plugin cần ngữ cảnh bền vững được đưa đến lượt mô hình tiếp theo đúng một lần. OpenClaw xả các nội dung chèn đã xếp hàng trước các hook prompt, bỏ các nội dung chèn đã hết hạn, và khử trùng lặp theo `idempotencyKey` cho từng Plugin. Đây là ranh giới phù hợp cho việc tiếp tục phê duyệt, tóm tắt chính sách, phần chênh lệch từ trình giám sát nền, và phần tiếp nối lệnh cần hiển thị với mô hình ở lượt tiếp theo nhưng không nên trở thành văn bản prompt hệ thống vĩnh viễn.

Ngữ nghĩa dọn dẹp là một phần của hợp đồng. Callback dọn dẹp tiện ích mở rộng phiên và dọn dẹp vòng đời runtime nhận `reset`, `delete`, `disable`, hoặc `restart`. Máy chủ xóa trạng thái tiện ích mở rộng phiên bền vững và các nội dung chèn lượt tiếp theo đang chờ của Plugin sở hữu đối với reset/delete/disable; restart giữ trạng thái phiên bền vững trong khi các callback dọn dẹp cho phép Plugin giải phóng tác vụ bộ lập lịch, ngữ cảnh chạy, và các tài nguyên ngoài băng khác cho thế hệ runtime cũ.

## Hook tin nhắn

Dùng hook tin nhắn cho định tuyến cấp kênh và chính sách gửi:

- `message_received`: quan sát nội dung đến, người gửi, `threadId`, `messageId`, `senderId`, tương quan run/session tùy chọn, và siêu dữ liệu.
- `message_sending`: viết lại `content` hoặc trả về `{ cancel: true }`.
- `message_sent`: quan sát kết quả thành công hoặc thất bại cuối cùng.

Đối với phản hồi TTS chỉ có âm thanh, `content` có thể chứa bản chép lời nói ẩn ngay cả khi tải trọng kênh không có văn bản/chú thích hiển thị. Việc viết lại `content` đó chỉ cập nhật bản chép lời mà hook thấy được; nó không được kết xuất dưới dạng chú thích phương tiện.

Ngữ cảnh hook tin nhắn cung cấp các trường tương quan ổn định khi có sẵn: `ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`, `ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, và `ctx.callDepth`. Ưu tiên các trường hạng nhất này trước khi đọc siêu dữ liệu kế thừa.

Ưu tiên các trường `threadId` và `replyToId` có kiểu trước khi dùng siêu dữ liệu riêng theo kênh.

Quy tắc quyết định:

- `message_sending` với `cancel: true` là quyết định kết thúc.
- `message_sending` với `cancel: false` được xem là không có quyết định.
- `content` đã được viết lại tiếp tục đến các hook có độ ưu tiên thấp hơn trừ khi một hook sau đó hủy việc gửi.

## Hook cài đặt

`before_install` chạy sau quá trình quét tích hợp sẵn cho các lượt cài đặt Skills và Plugin. Trả về các phát hiện bổ sung hoặc `{ block: true, blockReason }` để dừng cài đặt.

`block: true` là quyết định kết thúc. `block: false` được xem là không có quyết định.

## Vòng đời Gateway

Dùng `gateway_start` cho các dịch vụ Plugin cần trạng thái do Gateway sở hữu. Ngữ cảnh cung cấp `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` để kiểm tra và cập nhật cron. Dùng `gateway_stop` để dọn dẹp tài nguyên chạy dài hạn.

Không dựa vào hook nội bộ `gateway:startup` cho các dịch vụ runtime do Plugin sở hữu.

`cron_changed` kích hoạt cho các sự kiện vòng đời cron do gateway sở hữu với tải trọng sự kiện có kiểu bao gồm các lý do `added`, `updated`, `removed`, `started`, `finished`, và `scheduled`. Sự kiện mang một bản chụp `PluginHookGatewayCronJob` (bao gồm `state.nextRunAtMs`, `state.lastRunStatus`, và `state.lastError` khi có) cùng với `PluginHookGatewayCronDeliveryStatus` là `not-requested` | `delivered` | `not-delivered` | `unknown`. Sự kiện đã xóa vẫn mang bản chụp tác vụ đã xóa để các bộ lập lịch bên ngoài có thể đối soát trạng thái. Dùng `ctx.getCron?.()` và `ctx.config` từ ngữ cảnh runtime khi đồng bộ bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw làm nguồn sự thật cho các lần kiểm tra đến hạn và thực thi.

## Các ngừng hỗ trợ sắp tới

Một vài bề mặt liền kề hook đã ngừng hỗ trợ nhưng vẫn còn được hỗ trợ. Hãy di chuyển trước bản phát hành lớn tiếp theo:

- **Phong bì kênh văn bản thuần** trong các trình xử lý `inbound_claim` và `message_received`. Đọc `BodyForAgent` và các khối ngữ cảnh người dùng có cấu trúc thay vì phân tích văn bản phong bì phẳng. Xem [Phong bì kênh văn bản thuần → BodyForAgent](/vi/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** vẫn tồn tại để tương thích. Plugin mới nên dùng `before_model_resolve` và `before_prompt_build` thay vì pha kết hợp.
- **`onResolution` trong `before_tool_call`** hiện dùng union `PluginApprovalResolution` có kiểu (`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`) thay vì `string` dạng tự do.

Để xem danh sách đầy đủ — đăng ký khả năng bộ nhớ, hồ sơ suy nghĩ của nhà cung cấp, nhà cung cấp xác thực bên ngoài, kiểu khám phá nhà cung cấp, bộ truy cập runtime tác vụ, và đổi tên `command-auth` → `command-status` — xem [Di chuyển Plugin SDK → Các ngừng hỗ trợ đang hoạt động](/vi/plugins/sdk-migration#active-deprecations).

## Liên quan

- [Di chuyển Plugin SDK](/vi/plugins/sdk-migration) — các ngừng hỗ trợ đang hoạt động và mốc thời gian gỡ bỏ
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Điểm vào Plugin](/vi/plugins/sdk-entrypoints)
- [Hook nội bộ](/vi/automation/hooks)
- [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals)
