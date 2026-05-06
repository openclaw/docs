---
read_when:
    - Bạn đang xây dựng một Plugin cần before_tool_call, before_agent_reply, các hook tin nhắn hoặc các hook vòng đời
    - Bạn cần chặn, viết lại hoặc yêu cầu phê duyệt các lệnh gọi công cụ từ một Plugin
    - Bạn đang lựa chọn giữa các hook nội bộ và hook Plugin
summary: 'Móc nối Plugin: chặn các sự kiện vòng đời của tác nhân, công cụ, tin nhắn, phiên và Gateway'
title: Các móc nối của Plugin
x-i18n:
    generated_at: "2026-05-06T09:23:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a149e1b343ea2d3f55855c2d02f4a9519337f0450c8a1428d52cd77ab4046a
    source_path: plugins/hooks.md
    workflow: 16
---

Các hook của Plugin là các điểm mở rộng trong tiến trình cho các Plugin OpenClaw. Hãy dùng chúng
khi một Plugin cần kiểm tra hoặc thay đổi các lượt chạy của agent, lệnh gọi công cụ, luồng tin nhắn,
vòng đời phiên, định tuyến subagent, cài đặt, hoặc khởi động Gateway.

Thay vào đó, hãy dùng [hook nội bộ](/vi/automation/hooks) khi bạn muốn một script
`HOOK.md` nhỏ do operator cài đặt cho các sự kiện lệnh và Gateway như
`/new`, `/reset`, `/stop`, `agent:bootstrap`, hoặc `gateway:startup`.

## Bắt đầu nhanh

Đăng ký các hook Plugin có kiểu với `api.on(...)` từ điểm vào Plugin của bạn:

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

Các trình xử lý hook chạy tuần tự theo `priority` giảm dần. Các hook có cùng mức ưu tiên
giữ nguyên thứ tự đăng ký.

`api.on(name, handler, opts?)` chấp nhận:

- `priority` - thứ tự trình xử lý (cao hơn chạy trước).
- `timeoutMs` - ngân sách tùy chọn cho mỗi hook. Khi được đặt, trình chạy hook hủy
  trình xử lý đó sau khi ngân sách hết và tiếp tục với trình xử lý tiếp theo, thay vì
  để công việc thiết lập hoặc truy hồi chậm tiêu thụ timeout model đã cấu hình của
  bên gọi. Bỏ qua để dùng timeout quan sát/quyết định mặc định mà trình chạy hook
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

`hooks.timeouts.<hookName>` ghi đè `hooks.timeoutMs`, và giá trị này ghi đè giá trị
`api.on(..., { timeoutMs })` do tác giả Plugin đặt. Mỗi giá trị đã cấu hình phải
là số nguyên dương không lớn hơn 600000 mili giây. Ưu tiên ghi đè theo từng hook
cho các hook đã biết là chậm để một Plugin không nhận ngân sách dài hơn ở mọi nơi.

Mỗi hook nhận `event.context.pluginConfig`, cấu hình đã phân giải cho
Plugin đã đăng ký trình xử lý đó. Dùng nó cho các quyết định hook cần
các tùy chọn Plugin hiện tại; OpenClaw chèn nó theo từng trình xử lý mà không làm thay đổi
đối tượng sự kiện dùng chung mà các Plugin khác nhìn thấy.

## Danh mục hook

Các hook được nhóm theo bề mặt mà chúng mở rộng. Tên in **đậm** chấp nhận
kết quả quyết định (chặn, hủy, ghi đè, hoặc yêu cầu phê duyệt); tất cả các hook khác
chỉ dùng để quan sát.

**Lượt agent**

- `before_model_resolve` - ghi đè provider hoặc model trước khi tin nhắn phiên tải
- `agent_turn_prepare` - tiêu thụ các chèn lượt Plugin đã xếp hàng và thêm ngữ cảnh cùng lượt trước các hook prompt
- `before_prompt_build` - thêm ngữ cảnh động hoặc văn bản system prompt trước lệnh gọi model
- `before_agent_start` - pha kết hợp chỉ để tương thích; ưu tiên hai hook ở trên
- **`before_agent_reply`** - ngắt sớm lượt model bằng một phản hồi tổng hợp hoặc im lặng
- **`before_agent_finalize`** - kiểm tra câu trả lời cuối tự nhiên và yêu cầu thêm một lượt model nữa
- `agent_end` - quan sát các tin nhắn cuối, trạng thái thành công, và thời lượng chạy
- `heartbeat_prompt_contribution` - thêm ngữ cảnh chỉ dành cho Heartbeat cho các Plugin giám sát nền và vòng đời

**Quan sát cuộc trò chuyện**

- `model_call_started` / `model_call_ended` - quan sát siêu dữ liệu lệnh gọi provider/model đã được làm sạch, thời gian, kết quả, và hash ID yêu cầu có giới hạn mà không có nội dung prompt hoặc phản hồi
- `llm_input` - quan sát đầu vào provider (system prompt, prompt, lịch sử)
- `llm_output` - quan sát đầu ra provider

**Công cụ**

- **`before_tool_call`** - viết lại tham số công cụ, chặn thực thi, hoặc yêu cầu phê duyệt
- `after_tool_call` - quan sát kết quả công cụ, lỗi, và thời lượng
- **`tool_result_persist`** - viết lại tin nhắn assistant được tạo từ kết quả công cụ
- **`before_message_write`** - kiểm tra hoặc chặn thao tác ghi tin nhắn đang diễn ra (hiếm)

**Tin nhắn và phân phối**

- **`inbound_claim`** - nhận một tin nhắn đến trước khi định tuyến agent (phản hồi tổng hợp)
- `message_received` - quan sát nội dung đến, người gửi, luồng, và siêu dữ liệu
- **`message_sending`** - viết lại nội dung đi hoặc hủy phân phối
- `message_sent` - quan sát phân phối đi thành công hoặc thất bại
- **`before_dispatch`** - kiểm tra hoặc viết lại một dispatch đi trước khi bàn giao cho kênh
- **`reply_dispatch`** - tham gia vào pipeline dispatch phản hồi cuối

**Phiên và Compaction**

- `session_start` / `session_end` - theo dõi ranh giới vòng đời phiên
- `before_compaction` / `after_compaction` - quan sát hoặc chú thích các chu kỳ Compaction
- `before_reset` - quan sát sự kiện đặt lại phiên (`/reset`, đặt lại theo chương trình)

**Subagent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - điều phối định tuyến subagent và phân phối hoàn tất

**Vòng đời**

- `gateway_start` / `gateway_stop` - khởi động hoặc dừng các dịch vụ do Plugin sở hữu cùng với Gateway
- `cron_changed` - quan sát các thay đổi vòng đời Cron do Gateway sở hữu (đã thêm, đã cập nhật, đã xóa, đã bắt đầu, đã kết thúc, đã lên lịch)
- **`before_install`** - kiểm tra các lần quét cài đặt skill hoặc Plugin và tùy chọn chặn

## Chính sách lệnh gọi công cụ

`before_tool_call` nhận:

- `event.toolName`
- `event.params`
- `event.runId` tùy chọn
- `event.toolCallId` tùy chọn
- các trường ngữ cảnh như `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId`,
  `ctx.runId`, `ctx.jobId` (được đặt trên các lượt chạy do Cron dẫn hướng), và `ctx.trace` chẩn đoán

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

- `block: true` là quyết định kết thúc và bỏ qua các trình xử lý có mức ưu tiên thấp hơn.
- `block: false` được xem là không có quyết định.
- `params` viết lại tham số công cụ để thực thi.
- `requireApproval` tạm dừng lượt chạy agent và hỏi người dùng thông qua phê duyệt Plugin.
  Lệnh `/approve` có thể phê duyệt cả exec và phê duyệt Plugin.
- `block: true` có mức ưu tiên thấp hơn vẫn có thể chặn sau khi một hook có mức ưu tiên cao hơn
  đã yêu cầu phê duyệt.
- `onResolution` nhận quyết định phê duyệt đã phân giải - `allow-once`,
  `allow-always`, `deny`, `timeout`, hoặc `cancelled`.

Các Plugin đi kèm cần chính sách cấp host có thể đăng ký chính sách công cụ đáng tin cậy
với `api.registerTrustedToolPolicy(...)`. Các chính sách này chạy trước các hook
`before_tool_call` thông thường và trước quyết định của Plugin bên ngoài. Chỉ dùng chúng
cho các cổng được host tin cậy như chính sách workspace, thực thi ngân sách, hoặc
an toàn quy trình dành riêng. Plugin bên ngoài nên dùng các hook `before_tool_call`
thông thường.

### Lưu giữ kết quả công cụ

Kết quả công cụ có thể bao gồm `details` có cấu trúc để kết xuất UI, chẩn đoán,
định tuyến phương tiện, hoặc siêu dữ liệu do Plugin sở hữu. Hãy xem `details` là siêu dữ liệu runtime,
không phải nội dung prompt:

- OpenClaw loại bỏ `toolResult.details` trước khi phát lại cho provider và đầu vào Compaction
  để siêu dữ liệu không trở thành ngữ cảnh model.
- Các mục phiên đã lưu chỉ giữ `details` có giới hạn. Details quá lớn được
  thay thế bằng một bản tóm tắt gọn và `persistedDetailsTruncated: true`.
- `tool_result_persist` và `before_message_write` chạy trước giới hạn lưu giữ cuối cùng.
  Hook vẫn nên giữ `details` trả về nhỏ và tránh đặt văn bản liên quan đến prompt
  chỉ trong `details`; hãy đặt đầu ra công cụ mà model nhìn thấy trong `content`.

## Hook prompt và model

Dùng các hook theo pha cụ thể cho Plugin mới:

- `before_model_resolve`: chỉ nhận prompt hiện tại và siêu dữ liệu tệp đính kèm.
  Trả về `providerOverride` hoặc `modelOverride`.
- `agent_turn_prepare`: nhận prompt hiện tại, tin nhắn phiên đã chuẩn bị,
  và mọi chèn đã xếp hàng dùng đúng một lần được rút ra cho phiên này. Trả về
  `prependContext` hoặc `appendContext`.
- `before_prompt_build`: nhận prompt hiện tại và tin nhắn phiên.
  Trả về `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, hoặc `appendSystemContext`.
- `heartbeat_prompt_contribution`: chỉ chạy cho các lượt Heartbeat và trả về
  `prependContext` hoặc `appendContext`. Nó dành cho các trình giám sát nền
  cần tóm tắt trạng thái hiện tại mà không thay đổi các lượt do người dùng khởi tạo.

`before_agent_start` vẫn được giữ để tương thích. Ưu tiên các hook tường minh ở trên
để Plugin của bạn không phụ thuộc vào một pha kết hợp cũ.

`before_agent_start` và `agent_end` bao gồm `event.runId` khi OpenClaw có thể
xác định lượt chạy đang hoạt động. Cùng giá trị đó cũng có trên `ctx.runId`.
Các lượt chạy do Cron dẫn hướng cũng hiển thị `ctx.jobId` (ID công việc Cron khởi nguồn) để
hook Plugin có thể giới hạn phạm vi chỉ số, hiệu ứng phụ, hoặc trạng thái cho một công việc
đã lên lịch cụ thể.

Đối với các lượt chạy bắt nguồn từ kênh, `ctx.messageProvider` là bề mặt provider như
`discord` hoặc `telegram`, còn `ctx.channelId` là định danh đích cuộc trò chuyện
khi OpenClaw có thể suy ra từ khóa phiên hoặc siêu dữ liệu phân phối.

`agent_end` là hook quan sát và chạy fire-and-forget sau lượt. Trình chạy
hook áp dụng timeout 30 giây để một Plugin hoặc endpoint embedding bị kẹt
không thể khiến promise hook ở trạng thái chờ mãi mãi. Timeout được ghi log và
OpenClaw tiếp tục; nó không hủy công việc mạng do Plugin sở hữu trừ khi
Plugin cũng dùng tín hiệu hủy riêng của nó.

Dùng `model_call_started` và `model_call_ended` cho telemetry lệnh gọi provider
không nên nhận prompt thô, lịch sử, phản hồi, header, thân yêu cầu,
hoặc ID yêu cầu provider. Các hook này bao gồm siêu dữ liệu ổn định như
`runId`, `callId`, `provider`, `model`, `api`/`transport` tùy chọn,
`durationMs`/`outcome` cuối cùng, và `upstreamRequestIdHash` khi OpenClaw có thể suy ra một
hash ID yêu cầu provider có giới hạn.

`before_agent_finalize` chỉ chạy khi một harness sắp chấp nhận câu trả lời assistant cuối
tự nhiên. Đây không phải đường dẫn hủy `/stop` và không
chạy khi người dùng hủy một lượt. Trả về `{ action: "revise", reason }` để yêu cầu
harness thêm một lượt model nữa trước khi hoàn tất, `{ action:
"finalize", reason? }` để buộc hoàn tất, hoặc bỏ qua kết quả để tiếp tục.
Các hook `Stop` gốc của Codex được chuyển tiếp vào hook này dưới dạng quyết định
`before_agent_finalize` của OpenClaw.

Khi trả về `action: "revise"`, Plugin có thể bao gồm siêu dữ liệu `retry` để làm cho
lượt model bổ sung có giới hạn và an toàn khi phát lại:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` được nối vào lý do sửa đổi gửi đến harness.
`idempotencyKey` cho phép host đếm số lần thử lại cho cùng một yêu cầu Plugin qua
các quyết định hoàn tất tương đương, và `maxAttempts` giới hạn số lượt bổ sung mà
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

Các hook thay đổi prompt và chèn lượt tiếp theo bền vững có thể bị tắt theo từng Plugin
với `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Tiện ích mở rộng phiên và chèn vào lượt tiếp theo

Các Plugin quy trình công việc có thể lưu giữ trạng thái phiên nhỏ tương thích JSON bằng
`api.registerSessionExtension(...)` và cập nhật trạng thái đó thông qua phương thức
`sessions.pluginPatch` của Gateway. Các hàng phiên chiếu trạng thái phần mở rộng đã đăng ký
thông qua `pluginExtensions`, cho phép Control UI và các máy khách khác hiển thị
trạng thái do Plugin sở hữu mà không cần biết chi tiết nội bộ của Plugin.

Dùng `api.enqueueNextTurnInjection(...)` khi một Plugin cần ngữ cảnh bền vững để
đến đúng một lần ở lượt mô hình tiếp theo. OpenClaw xử lý hết các phần chèn đã xếp hàng trước
các móc nối lời nhắc, loại bỏ các phần chèn đã hết hạn, và khử trùng lặp theo `idempotencyKey`
cho từng Plugin. Đây là điểm nối phù hợp cho việc tiếp tục sau phê duyệt, tóm tắt chính sách,
các thay đổi từ trình giám sát nền, và việc tiếp tục lệnh cần hiển thị với
mô hình ở lượt tiếp theo nhưng không nên trở thành văn bản lời nhắc hệ thống cố định.

Ngữ nghĩa dọn dẹp là một phần của hợp đồng. Các hàm gọi lại dọn dẹp phần mở rộng phiên và
dọn dẹp vòng đời thời gian chạy nhận `reset`, `delete`, `disable`, hoặc
`restart`. Máy chủ lưu trữ xóa trạng thái phần mở rộng phiên bền vững của Plugin sở hữu
và các phần chèn lượt tiếp theo đang chờ đối với reset/delete/disable; restart giữ
trạng thái phiên bền vững trong khi các hàm gọi lại dọn dẹp cho phép Plugin giải phóng
các tác vụ bộ lập lịch, ngữ cảnh chạy, và các tài nguyên ngoài luồng khác cho thế hệ thời gian chạy cũ.

## Móc nối thông điệp

Dùng móc nối thông điệp cho chính sách định tuyến và phân phối ở cấp kênh:

- `message_received`: quan sát nội dung đến, người gửi, `threadId`, `messageId`,
  `senderId`, tương quan run/phiên tùy chọn, và siêu dữ liệu.
- `message_sending`: viết lại `content` hoặc trả về `{ cancel: true }`.
- `message_sent`: quan sát thành công hoặc thất bại cuối cùng.

Đối với phản hồi TTS chỉ có âm thanh, `content` có thể chứa bản ghi lời nói bị ẩn
ngay cả khi tải trọng kênh không có văn bản/chú thích hiển thị. Việc viết lại
`content` đó chỉ cập nhật bản ghi hiển thị với móc nối; nội dung đó không được hiển thị dưới dạng
chú thích phương tiện.

Ngữ cảnh móc nối thông điệp cung cấp các trường tương quan ổn định khi có:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, và `ctx.callDepth`. Ưu tiên
các trường hạng nhất này trước khi đọc siêu dữ liệu cũ.

Ưu tiên các trường `threadId` và `replyToId` có kiểu trước khi dùng siêu dữ liệu
riêng theo kênh.

Quy tắc quyết định:

- `message_sending` với `cancel: true` là quyết định kết thúc.
- `message_sending` với `cancel: false` được xem là không có quyết định.
- `content` đã viết lại tiếp tục đi đến các móc nối có mức ưu tiên thấp hơn trừ khi một móc nối sau đó
  hủy phân phối.

## Móc nối cài đặt

`before_install` chạy sau bước quét tích hợp sẵn cho việc cài đặt Skills và Plugin.
Trả về các phát hiện bổ sung hoặc `{ block: true, blockReason }` để dừng
quá trình cài đặt.

`block: true` là quyết định kết thúc. `block: false` được xem là không có quyết định.

## Vòng đời Gateway

Dùng `gateway_start` cho các dịch vụ Plugin cần trạng thái do Gateway sở hữu. Ngữ cảnh
cung cấp `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` để
kiểm tra và cập nhật Cron. Dùng `gateway_stop` để dọn dẹp các
tài nguyên chạy lâu.

Không dựa vào móc nối nội bộ `gateway:startup` cho các dịch vụ thời gian chạy
do Plugin sở hữu.

`cron_changed` kích hoạt cho các sự kiện vòng đời Cron do Gateway sở hữu với tải trọng
sự kiện có kiểu bao gồm các lý do `added`, `updated`, `removed`, `started`, `finished`,
và `scheduled`. Sự kiện mang một ảnh chụp nhanh `PluginHookGatewayCronJob`
(bao gồm `state.nextRunAtMs`, `state.lastRunStatus`, và
`state.lastError` khi có) cùng với `PluginHookGatewayCronDeliveryStatus`
là `not-requested` | `delivered` | `not-delivered` | `unknown`. Các sự kiện đã xóa
vẫn mang ảnh chụp nhanh tác vụ đã xóa để các bộ lập lịch bên ngoài có thể
đối chiếu trạng thái. Dùng `ctx.getCron?.()` và `ctx.config` từ ngữ cảnh
thời gian chạy khi đồng bộ các bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw là
nguồn sự thật cho kiểm tra đến hạn và thực thi.

## Các tính năng sắp ngừng hỗ trợ

Một vài bề mặt liền kề móc nối đã bị ngừng khuyến nghị nhưng vẫn được hỗ trợ. Hãy di chuyển
trước bản phát hành chính tiếp theo:

- **Phong bì kênh văn bản thuần** trong các trình xử lý `inbound_claim` và `message_received`.
  Đọc `BodyForAgent` và các khối ngữ cảnh người dùng có cấu trúc
  thay vì phân tích văn bản phong bì phẳng. Xem
  [Phong bì kênh văn bản thuần → BodyForAgent](/vi/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** vẫn tồn tại để tương thích. Plugin mới nên dùng
  `before_model_resolve` và `before_prompt_build` thay vì pha kết hợp.
- **`onResolution` trong `before_tool_call`** hiện dùng hợp kiểu
  `PluginApprovalResolution` có kiểu (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) thay vì một `string` tự do.

Để xem danh sách đầy đủ - đăng ký khả năng bộ nhớ, hồ sơ suy luận của nhà cung cấp,
nhà cung cấp xác thực bên ngoài, kiểu khám phá nhà cung cấp, bộ truy cập thời gian chạy tác vụ,
và đổi tên `command-auth` → `command-status` - xem
[Di chuyển Plugin SDK → Các tính năng đang ngừng hỗ trợ](/vi/plugins/sdk-migration#active-deprecations).

## Liên quan

- [Di chuyển Plugin SDK](/vi/plugins/sdk-migration) - các tính năng đang ngừng hỗ trợ và mốc thời gian gỡ bỏ
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Điểm vào Plugin](/vi/plugins/sdk-entrypoints)
- [Móc nối nội bộ](/vi/automation/hooks)
- [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals)
