---
read_when:
    - Bạn đang xây dựng một Plugin cần before_tool_call, before_agent_reply, hook thông điệp hoặc hook vòng đời
    - Bạn cần chặn, viết lại hoặc yêu cầu phê duyệt đối với các lệnh gọi công cụ từ một Plugin
    - Bạn đang quyết định giữa các điểm móc nội bộ và các điểm móc Plugin
summary: 'Móc nối Plugin: chặn bắt các sự kiện vòng đời của tác nhân, công cụ, tin nhắn, phiên và Gateway'
title: Móc nối của Plugin
x-i18n:
    generated_at: "2026-04-29T23:00:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: f600df47c67eb07d85b7b063f1189baf78a49efad727d8cadbd37f66745c4401
    source_path: plugins/hooks.md
    workflow: 16
---

Các hook Plugin là các điểm mở rộng trong tiến trình dành cho plugin OpenClaw. Sử dụng chúng
khi một plugin cần kiểm tra hoặc thay đổi lượt chạy của agent, lệnh gọi công cụ, luồng tin nhắn,
vòng đời phiên, định tuyến subagent, cài đặt hoặc quá trình khởi động Gateway.

Thay vào đó, hãy dùng [hook nội bộ](/vi/automation/hooks) khi bạn muốn một script
`HOOK.md` nhỏ do người vận hành cài đặt cho các sự kiện lệnh và Gateway như
`/new`, `/reset`, `/stop`, `agent:bootstrap`, hoặc `gateway:startup`.

## Bắt đầu nhanh

Đăng ký hook plugin có kiểu bằng `api.on(...)` từ entry plugin của bạn:

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

- `priority` — thứ tự trình xử lý (cao hơn chạy trước).
- `timeoutMs` — ngân sách tùy chọn cho từng hook. Khi được đặt, trình chạy hook hủy
  trình xử lý đó sau khi hết ngân sách và tiếp tục với trình xử lý tiếp theo, thay vì
  để tác vụ thiết lập chậm hoặc truy xuất hồi ức tiêu tốn thời gian chờ model đã cấu hình
  của bên gọi. Bỏ qua để dùng thời gian chờ quan sát/quyết định mặc định mà
  trình chạy hook áp dụng chung.

Mỗi hook nhận `event.context.pluginConfig`, tức cấu hình đã phân giải cho
plugin đã đăng ký trình xử lý đó. Dùng nó cho các quyết định hook cần
tùy chọn plugin hiện tại; OpenClaw chèn nó theo từng trình xử lý mà không làm thay đổi
đối tượng sự kiện dùng chung mà các plugin khác nhìn thấy.

## Danh mục hook

Hook được nhóm theo bề mặt mà chúng mở rộng. Các tên in **đậm** chấp nhận
kết quả quyết định (chặn, hủy, ghi đè hoặc yêu cầu phê duyệt); tất cả tên còn lại
chỉ dùng để quan sát.

**Lượt agent**

- `before_model_resolve` — ghi đè provider hoặc model trước khi thông điệp phiên được tải
- `agent_turn_prepare` — tiêu thụ các lần chèn lượt plugin đang xếp hàng và thêm ngữ cảnh cùng lượt trước các hook prompt
- `before_prompt_build` — thêm ngữ cảnh động hoặc văn bản system prompt trước lệnh gọi model
- `before_agent_start` — pha kết hợp chỉ để tương thích; ưu tiên hai hook ở trên
- **`before_agent_reply`** — rút ngắn lượt model bằng phản hồi tổng hợp hoặc im lặng
- **`before_agent_finalize`** — kiểm tra câu trả lời cuối tự nhiên và yêu cầu thêm một lượt model nữa
- `agent_end` — quan sát các thông điệp cuối, trạng thái thành công và thời lượng chạy
- `heartbeat_prompt_contribution` — thêm ngữ cảnh chỉ dành cho Heartbeat cho plugin giám sát nền và vòng đời

**Quan sát hội thoại**

- `model_call_started` / `model_call_ended` — quan sát siêu dữ liệu lệnh gọi provider/model đã được làm sạch, thời gian, kết quả và mã băm request-id giới hạn mà không có nội dung prompt hoặc phản hồi
- `llm_input` — quan sát đầu vào provider (system prompt, prompt, lịch sử)
- `llm_output` — quan sát đầu ra provider

**Công cụ**

- **`before_tool_call`** — viết lại tham số công cụ, chặn thực thi hoặc yêu cầu phê duyệt
- `after_tool_call` — quan sát kết quả công cụ, lỗi và thời lượng
- **`tool_result_persist`** — viết lại thông điệp assistant được tạo từ kết quả công cụ
- **`before_message_write`** — kiểm tra hoặc chặn thao tác ghi thông điệp đang diễn ra (hiếm gặp)

**Tin nhắn và phân phối**

- **`inbound_claim`** — nhận xử lý một tin nhắn đến trước khi định tuyến agent (phản hồi tổng hợp)
- `message_received` — quan sát nội dung đến, người gửi, luồng và siêu dữ liệu
- **`message_sending`** — viết lại nội dung gửi đi hoặc hủy phân phối
- `message_sent` — quan sát việc phân phối gửi đi thành công hoặc thất bại
- **`before_dispatch`** — kiểm tra hoặc viết lại một dispatch gửi đi trước khi bàn giao cho kênh
- **`reply_dispatch`** — tham gia vào pipeline dispatch phản hồi cuối

**Phiên và Compaction**

- `session_start` / `session_end` — theo dõi các ranh giới vòng đời phiên
- `before_compaction` / `after_compaction` — quan sát hoặc chú thích các chu kỳ Compaction
- `before_reset` — quan sát sự kiện đặt lại phiên (`/reset`, đặt lại theo chương trình)

**Subagent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — điều phối định tuyến subagent và phân phối khi hoàn tất

**Vòng đời**

- `gateway_start` / `gateway_stop` — khởi động hoặc dừng các dịch vụ do plugin sở hữu cùng với Gateway
- `cron_changed` — quan sát các thay đổi vòng đời Cron do gateway sở hữu (đã thêm, đã cập nhật, đã xóa, đã bắt đầu, đã hoàn tất, đã lên lịch)
- **`before_install`** — kiểm tra lượt quét cài đặt skill hoặc plugin và tùy chọn chặn

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

- `block: true` là quyết định kết thúc và bỏ qua các trình xử lý có mức ưu tiên thấp hơn.
- `block: false` được coi là không có quyết định.
- `params` viết lại tham số công cụ để thực thi.
- `requireApproval` tạm dừng lượt chạy agent và hỏi người dùng thông qua
  phê duyệt plugin. Lệnh `/approve` có thể phê duyệt cả phê duyệt exec và plugin.
- Một `block: true` có mức ưu tiên thấp hơn vẫn có thể chặn sau khi hook có mức ưu tiên cao hơn
  đã yêu cầu phê duyệt.
- `onResolution` nhận quyết định phê duyệt đã phân giải — `allow-once`,
  `allow-always`, `deny`, `timeout`, hoặc `cancelled`.

Các plugin được đóng gói cần chính sách cấp host có thể đăng ký chính sách công cụ đáng tin cậy
bằng `api.registerTrustedToolPolicy(...)`. Các chính sách này chạy trước các hook
`before_tool_call` thông thường và trước quyết định của plugin bên ngoài. Chỉ dùng chúng
cho các cổng đáng tin cậy của host như chính sách workspace, thực thi ngân sách hoặc
an toàn quy trình làm việc dành riêng. Plugin bên ngoài nên dùng hook `before_tool_call`
thông thường.

### Lưu bền kết quả công cụ

Kết quả công cụ có thể bao gồm `details` có cấu trúc để render UI, chẩn đoán,
định tuyến media hoặc siêu dữ liệu do plugin sở hữu. Hãy xem `details` là siêu dữ liệu runtime,
không phải nội dung prompt:

- OpenClaw loại bỏ `toolResult.details` trước khi phát lại cho provider và đầu vào
  Compaction để siêu dữ liệu không trở thành ngữ cảnh model.
- Các mục phiên đã lưu bền chỉ giữ `details` có giới hạn. Details quá lớn được
  thay bằng tóm tắt gọn và `persistedDetailsTruncated: true`.
- `tool_result_persist` và `before_message_write` chạy trước giới hạn lưu bền cuối cùng.
  Hook vẫn nên giữ `details` trả về ở mức nhỏ và tránh đặt văn bản liên quan đến prompt
  chỉ trong `details`; đặt đầu ra công cụ mà model nhìn thấy trong `content`.

## Hook prompt và model

Dùng các hook theo pha cụ thể cho plugin mới:

- `before_model_resolve`: chỉ nhận prompt hiện tại và siêu dữ liệu tệp đính kèm.
  Trả về `providerOverride` hoặc `modelOverride`.
- `agent_turn_prepare`: nhận prompt hiện tại, thông điệp phiên đã chuẩn bị,
  và mọi lần chèn xếp hàng đúng một lần đã được rút cho phiên này. Trả về
  `prependContext` hoặc `appendContext`.
- `before_prompt_build`: nhận prompt hiện tại và thông điệp phiên.
  Trả về `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, hoặc `appendSystemContext`.
- `heartbeat_prompt_contribution`: chỉ chạy cho các lượt Heartbeat và trả về
  `prependContext` hoặc `appendContext`. Hook này dành cho các trình giám sát nền
  cần tóm tắt trạng thái hiện tại mà không thay đổi các lượt do người dùng khởi tạo.

`before_agent_start` vẫn được giữ để tương thích. Ưu tiên các hook rõ ràng ở trên
để plugin của bạn không phụ thuộc vào một pha kết hợp cũ.

`before_agent_start` và `agent_end` bao gồm `event.runId` khi OpenClaw có thể
xác định lượt chạy đang hoạt động. Cùng giá trị đó cũng có sẵn trên `ctx.runId`.
Các lượt chạy do Cron điều khiển cũng cung cấp `ctx.jobId` (id công việc cron khởi nguồn) để
hook plugin có thể giới hạn phạm vi metric, tác dụng phụ hoặc trạng thái cho một công việc
đã lên lịch cụ thể.

`agent_end` là hook quan sát và chạy fire-and-forget sau lượt. Trình chạy hook
áp dụng thời gian chờ 30 giây để một plugin hoặc endpoint embedding bị treo
không thể khiến promise hook chờ mãi. Việc hết thời gian chờ được ghi log và
OpenClaw tiếp tục; nó không hủy tác vụ mạng do plugin sở hữu trừ khi
plugin cũng dùng tín hiệu hủy riêng.

Dùng `model_call_started` và `model_call_ended` cho telemetry lệnh gọi provider
không nên nhận prompt thô, lịch sử, phản hồi, header, thân request
hoặc request ID của provider. Các hook này bao gồm siêu dữ liệu ổn định như
`runId`, `callId`, `provider`, `model`, `api`/`transport` tùy chọn,
`durationMs`/`outcome` cuối, và `upstreamRequestIdHash` khi OpenClaw có thể suy ra
mã băm request-id provider có giới hạn.

`before_agent_finalize` chỉ chạy khi một harness sắp chấp nhận câu trả lời assistant cuối tự nhiên.
Nó không phải là đường dẫn hủy `/stop` và không chạy khi người dùng hủy một lượt.
Trả về `{ action: "revise", reason }` để yêu cầu harness thêm một lượt model nữa
trước khi hoàn tất, `{ action:
"finalize", reason? }` để buộc hoàn tất, hoặc bỏ qua kết quả để tiếp tục.
Các hook `Stop` gốc của Codex được chuyển tiếp vào hook này dưới dạng quyết định
`before_agent_finalize` của OpenClaw.

Plugin không được đóng gói cần `llm_input`, `llm_output`,
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

Hook thay đổi prompt và các lần chèn lượt tiếp theo bền vững có thể bị vô hiệu hóa theo từng plugin
bằng `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Phần mở rộng phiên và lần chèn lượt tiếp theo

Plugin quy trình làm việc có thể lưu bền trạng thái phiên nhỏ tương thích JSON bằng
`api.registerSessionExtension(...)` và cập nhật nó thông qua phương thức
`sessions.pluginPatch` của Gateway. Các hàng phiên chiếu trạng thái phần mở rộng đã đăng ký
thông qua `pluginExtensions`, cho phép Control UI và các client khác render
trạng thái do plugin sở hữu mà không cần biết nội bộ plugin.

Dùng `api.enqueueNextTurnInjection(...)` khi một plugin cần ngữ cảnh bền vững
đến được lượt model tiếp theo đúng một lần. OpenClaw rút các lần chèn đã xếp hàng trước
hook prompt, loại bỏ các lần chèn hết hạn và khử trùng lặp theo `idempotencyKey`
cho từng plugin. Đây là seam phù hợp cho tiếp tục sau phê duyệt, tóm tắt chính sách,
delta của trình giám sát nền và tiếp tục lệnh cần hiển thị với
model ở lượt tiếp theo nhưng không nên trở thành văn bản system prompt vĩnh viễn.

Ngữ nghĩa dọn dẹp là một phần của hợp đồng. Callback dọn dẹp phần mở rộng phiên và
dọn dẹp vòng đời runtime nhận `reset`, `delete`, `disable`, hoặc
`restart`. Host xóa trạng thái phần mở rộng phiên lưu bền và các lần chèn lượt tiếp theo đang chờ
của plugin sở hữu khi reset/delete/disable; restart giữ
trạng thái phiên bền vững trong khi callback dọn dẹp cho phép plugin giải phóng công việc scheduler,
ngữ cảnh chạy và các tài nguyên ngoài băng khác cho thế hệ runtime cũ.

## Hook tin nhắn

Dùng hook tin nhắn cho định tuyến cấp kênh và chính sách phân phối:

- `message_received`: quan sát nội dung đến, người gửi, `threadId`, `messageId`,
  `senderId`, tương quan lượt chạy/phiên tùy chọn, và siêu dữ liệu.
- `message_sending`: viết lại `content` hoặc trả về `{ cancel: true }`.
- `message_sent`: quan sát thành công hoặc thất bại cuối cùng.

Đối với các phản hồi TTS chỉ có âm thanh, `content` có thể chứa bản ghi lời nói ẩn
ngay cả khi payload của kênh không có văn bản/chú thích hiển thị. Việc ghi lại
`content` chỉ cập nhật bản ghi hiển thị với hook; nó không được hiển thị dưới dạng
chú thích phương tiện.

Ngữ cảnh hook tin nhắn hiển thị các trường tương quan ổn định khi có:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, và `ctx.callDepth`. Ưu tiên
các trường hạng nhất này trước khi đọc siêu dữ liệu cũ.

Ưu tiên các trường `threadId` và `replyToId` có kiểu trước khi dùng siêu dữ liệu
riêng theo kênh.

Quy tắc quyết định:

- `message_sending` với `cancel: true` là quyết định cuối cùng.
- `message_sending` với `cancel: false` được xem là không có quyết định.
- `content` đã ghi lại tiếp tục chuyển đến các hook có độ ưu tiên thấp hơn trừ khi một hook sau đó
  hủy việc gửi.

## Hook cài đặt

`before_install` chạy sau quá trình quét tích hợp sẵn cho các lượt cài đặt skill và Plugin.
Trả về các phát hiện bổ sung hoặc `{ block: true, blockReason }` để dừng
cài đặt.

`block: true` là quyết định cuối cùng. `block: false` được xem là không có quyết định.

## Vòng đời Gateway

Dùng `gateway_start` cho các dịch vụ Plugin cần trạng thái do Gateway sở hữu. Ngữ cảnh
hiển thị `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` để kiểm tra và
cập nhật cron. Dùng `gateway_stop` để dọn dẹp các tài nguyên chạy lâu.

Không dựa vào hook nội bộ `gateway:startup` cho các dịch vụ runtime do Plugin sở hữu.

`cron_changed` kích hoạt cho các sự kiện vòng đời cron do gateway sở hữu với payload
sự kiện có kiểu bao gồm các lý do `added`, `updated`, `removed`, `started`, `finished`,
và `scheduled`. Sự kiện mang một ảnh chụp nhanh `PluginHookGatewayCronJob`
(bao gồm `state.nextRunAtMs`, `state.lastRunStatus`, và
`state.lastError` khi có) cùng với một `PluginHookGatewayCronDeliveryStatus`
là `not-requested` | `delivered` | `not-delivered` | `unknown`. Các sự kiện đã xóa
vẫn mang ảnh chụp nhanh công việc đã xóa để bộ lập lịch bên ngoài có thể
đối chiếu trạng thái. Dùng `ctx.getCron?.()` và `ctx.config` từ ngữ cảnh runtime
khi đồng bộ bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw làm
nguồn sự thật cho việc kiểm tra đến hạn và thực thi.

## Các tính năng sắp ngừng hỗ trợ

Một vài bề mặt liền kề hook đã bị ngừng hỗ trợ nhưng vẫn được hỗ trợ. Hãy di chuyển
trước bản phát hành lớn tiếp theo:

- **Phong bì kênh văn bản thuần túy** trong các trình xử lý `inbound_claim` và `message_received`.
  Đọc `BodyForAgent` và các khối ngữ cảnh người dùng có cấu trúc
  thay vì phân tích văn bản phong bì phẳng. Xem
  [Phong bì kênh văn bản thuần túy → BodyForAgent](/vi/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** vẫn tồn tại để tương thích. Plugin mới nên dùng
  `before_model_resolve` và `before_prompt_build` thay vì pha kết hợp.
- **`onResolution` trong `before_tool_call`** hiện dùng union có kiểu
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) thay vì `string` dạng tự do.

Để xem danh sách đầy đủ — đăng ký khả năng bộ nhớ, hồ sơ suy nghĩ của provider,
provider xác thực bên ngoài, kiểu khám phá provider, accessor runtime tác vụ,
và đổi tên `command-auth` → `command-status` — xem
[Di chuyển Plugin SDK → Các tính năng đang ngừng hỗ trợ](/vi/plugins/sdk-migration#active-deprecations).

## Liên quan

- [Di chuyển Plugin SDK](/vi/plugins/sdk-migration) — các tính năng đang ngừng hỗ trợ và mốc thời gian gỡ bỏ
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Điểm vào Plugin](/vi/plugins/sdk-entrypoints)
- [Hook nội bộ](/vi/automation/hooks)
- [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals)
