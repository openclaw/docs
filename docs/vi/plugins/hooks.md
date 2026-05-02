---
read_when:
    - Bạn đang xây dựng một Plugin cần before_tool_call, before_agent_reply, hook tin nhắn hoặc hook vòng đời
    - Bạn cần chặn, viết lại hoặc yêu cầu phê duyệt các lệnh gọi công cụ từ một Plugin
    - Bạn đang lựa chọn giữa hook nội bộ và hook Plugin
summary: 'Móc của Plugin: chặn bắt các sự kiện vòng đời của tác nhân, công cụ, tin nhắn, phiên và Gateway'
title: Hook của Plugin
x-i18n:
    generated_at: "2026-05-02T10:48:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4efb07c6211debb5a7915d63678b1695946a91600c54d31faa0edf7025fbabf0
    source_path: plugins/hooks.md
    workflow: 16
---

Các điểm mở rộng Plugin là các điểm mở rộng chạy trong cùng tiến trình dành cho Plugin OpenClaw. Hãy dùng chúng
khi Plugin cần kiểm tra hoặc thay đổi các lượt chạy tác nhân, lệnh gọi công cụ, luồng tin nhắn,
vòng đời phiên, định tuyến tác nhân con, cài đặt, hoặc quá trình khởi động Gateway.

Thay vào đó, hãy dùng [điểm móc nội bộ](/vi/automation/hooks) khi bạn muốn một tập lệnh
`HOOK.md` nhỏ do người vận hành cài đặt cho các sự kiện lệnh và Gateway như
`/new`, `/reset`, `/stop`, `agent:bootstrap`, hoặc `gateway:startup`.

## Bắt đầu nhanh

Đăng ký các điểm móc Plugin có kiểu với `api.on(...)` từ điểm vào Plugin của bạn:

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

Các trình xử lý điểm móc chạy tuần tự theo `priority` giảm dần. Các điểm móc cùng mức ưu tiên
giữ nguyên thứ tự đăng ký.

`api.on(name, handler, opts?)` chấp nhận:

- `priority` — thứ tự trình xử lý (cao hơn chạy trước).
- `timeoutMs` — ngân sách tùy chọn cho từng điểm móc. Khi được đặt, bộ chạy điểm móc sẽ hủy
  trình xử lý đó sau khi hết ngân sách và tiếp tục với trình xử lý tiếp theo, thay vì
  để thiết lập chậm hoặc công việc nhớ lại tiêu tốn thời gian chờ mô hình đã cấu hình của bên gọi.
  Bỏ qua để dùng thời gian chờ quan sát/quyết định mặc định mà
  bộ chạy điểm móc áp dụng chung.

Mỗi điểm móc nhận `event.context.pluginConfig`, cấu hình đã phân giải cho
Plugin đã đăng ký trình xử lý đó. Hãy dùng nó cho các quyết định điểm móc cần
các tùy chọn Plugin hiện tại; OpenClaw chèn nó theo từng trình xử lý mà không làm thay đổi
đối tượng sự kiện dùng chung mà các Plugin khác thấy.

## Danh mục điểm móc

Các điểm móc được nhóm theo bề mặt mà chúng mở rộng. Các tên in **đậm** chấp nhận
kết quả quyết định (chặn, hủy, ghi đè, hoặc yêu cầu phê duyệt); tất cả các tên khác chỉ dùng để
quan sát.

**Lượt tác nhân**

- `before_model_resolve` — ghi đè nhà cung cấp hoặc mô hình trước khi tải tin nhắn phiên
- `agent_turn_prepare` — tiêu thụ các lượt chèn Plugin đã xếp hàng và thêm ngữ cảnh cùng lượt trước các điểm móc prompt
- `before_prompt_build` — thêm ngữ cảnh động hoặc văn bản system prompt trước lệnh gọi mô hình
- `before_agent_start` — giai đoạn kết hợp chỉ để tương thích; ưu tiên hai điểm móc ở trên
- **`before_agent_reply`** — đi tắt lượt mô hình bằng một phản hồi tổng hợp hoặc im lặng
- **`before_agent_finalize`** — kiểm tra câu trả lời cuối cùng tự nhiên và yêu cầu thêm một lượt mô hình nữa
- `agent_end` — quan sát tin nhắn cuối cùng, trạng thái thành công và thời lượng chạy
- `heartbeat_prompt_contribution` — thêm ngữ cảnh chỉ dành cho heartbeat cho các Plugin giám sát nền và vòng đời

**Quan sát hội thoại**

- `model_call_started` / `model_call_ended` — quan sát siêu dữ liệu lệnh gọi nhà cung cấp/mô hình đã được làm sạch, thời gian, kết quả và băm mã yêu cầu có giới hạn mà không có nội dung prompt hoặc phản hồi
- `llm_input` — quan sát đầu vào nhà cung cấp (system prompt, prompt, lịch sử)
- `llm_output` — quan sát đầu ra nhà cung cấp

**Công cụ**

- **`before_tool_call`** — viết lại tham số công cụ, chặn thực thi hoặc yêu cầu phê duyệt
- `after_tool_call` — quan sát kết quả công cụ, lỗi và thời lượng
- **`tool_result_persist`** — viết lại tin nhắn trợ lý được tạo từ kết quả công cụ
- **`before_message_write`** — kiểm tra hoặc chặn một thao tác ghi tin nhắn đang diễn ra (hiếm gặp)

**Tin nhắn và phân phối**

- **`inbound_claim`** — nhận xử lý một tin nhắn đến trước khi định tuyến tác nhân (phản hồi tổng hợp)
- `message_received` — quan sát nội dung đến, người gửi, luồng và siêu dữ liệu
- **`message_sending`** — viết lại nội dung gửi đi hoặc hủy phân phối
- `message_sent` — quan sát phân phối gửi đi thành công hoặc thất bại
- **`before_dispatch`** — kiểm tra hoặc viết lại một lệnh điều phối gửi đi trước khi bàn giao cho kênh
- **`reply_dispatch`** — tham gia vào pipeline điều phối phản hồi cuối cùng

**Phiên và Compaction**

- `session_start` / `session_end` — theo dõi ranh giới vòng đời phiên
- `before_compaction` / `after_compaction` — quan sát hoặc chú thích các chu kỳ Compaction
- `before_reset` — quan sát các sự kiện đặt lại phiên (`/reset`, đặt lại theo chương trình)

**Tác nhân con**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — điều phối định tuyến tác nhân con và phân phối khi hoàn tất

**Vòng đời**

- `gateway_start` / `gateway_stop` — khởi động hoặc dừng các dịch vụ do Plugin sở hữu cùng với Gateway
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

- `block: true` là kết thúc và bỏ qua các trình xử lý có mức ưu tiên thấp hơn.
- `block: false` được xem như không có quyết định.
- `params` viết lại tham số công cụ để thực thi.
- `requireApproval` tạm dừng lượt chạy tác nhân và hỏi người dùng thông qua các phê duyệt Plugin. Lệnh `/approve` có thể phê duyệt cả phê duyệt exec và phê duyệt Plugin.
- `block: true` có mức ưu tiên thấp hơn vẫn có thể chặn sau khi một điểm móc có mức ưu tiên cao hơn đã yêu cầu phê duyệt.
- `onResolution` nhận quyết định phê duyệt đã phân giải — `allow-once`,
  `allow-always`, `deny`, `timeout`, hoặc `cancelled`.

Các Plugin đi kèm cần chính sách cấp máy chủ có thể đăng ký chính sách công cụ đáng tin cậy
bằng `api.registerTrustedToolPolicy(...)`. Các chính sách này chạy trước các điểm móc
`before_tool_call` thông thường và trước các quyết định Plugin bên ngoài. Chỉ dùng chúng
cho các cổng do máy chủ tin cậy như chính sách workspace, thực thi ngân sách, hoặc
an toàn quy trình làm việc được dành riêng. Plugin bên ngoài nên dùng các điểm móc `before_tool_call`
bình thường.

### Lưu giữ kết quả công cụ

Kết quả công cụ có thể bao gồm `details` có cấu trúc để hiển thị UI, chẩn đoán,
định tuyến phương tiện, hoặc siêu dữ liệu do Plugin sở hữu. Hãy xem `details` là siêu dữ liệu runtime,
không phải nội dung prompt:

- OpenClaw loại bỏ `toolResult.details` trước khi phát lại cho nhà cung cấp và đầu vào Compaction
  để siêu dữ liệu không trở thành ngữ cảnh mô hình.
- Các mục phiên đã lưu chỉ giữ `details` có giới hạn. Chi tiết quá lớn được
  thay bằng tóm tắt gọn và `persistedDetailsTruncated: true`.
- `tool_result_persist` và `before_message_write` chạy trước giới hạn lưu giữ cuối cùng.
  Các điểm móc vẫn nên giữ `details` trả về nhỏ và tránh
  đặt văn bản liên quan đến prompt chỉ trong `details`; hãy đặt đầu ra công cụ hiển thị với mô hình
  trong `content`.

## Điểm móc prompt và mô hình

Dùng các điểm móc theo từng giai đoạn cho Plugin mới:

- `before_model_resolve`: chỉ nhận prompt hiện tại và siêu dữ liệu tệp đính kèm.
  Trả về `providerOverride` hoặc `modelOverride`.
- `agent_turn_prepare`: nhận prompt hiện tại, tin nhắn phiên đã chuẩn bị,
  và bất kỳ lượt chèn đã xếp hàng đúng-một-lần nào được rút cho phiên này. Trả về
  `prependContext` hoặc `appendContext`.
- `before_prompt_build`: nhận prompt hiện tại và tin nhắn phiên.
  Trả về `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, hoặc `appendSystemContext`.
- `heartbeat_prompt_contribution`: chỉ chạy cho các lượt heartbeat và trả về
  `prependContext` hoặc `appendContext`. Nó dành cho các trình giám sát nền
  cần tóm tắt trạng thái hiện tại mà không thay đổi các lượt do người dùng khởi tạo.

`before_agent_start` vẫn được giữ để tương thích. Ưu tiên các điểm móc tường minh ở trên
để Plugin của bạn không phụ thuộc vào một giai đoạn kết hợp cũ.

`before_agent_start` và `agent_end` bao gồm `event.runId` khi OpenClaw có thể
xác định lượt chạy đang hoạt động. Cùng giá trị đó cũng có trong `ctx.runId`.
Các lượt chạy do Cron điều khiển cũng hiển thị `ctx.jobId` (id công việc Cron khởi nguồn) để
các điểm móc Plugin có thể giới hạn phạm vi chỉ số, tác dụng phụ, hoặc trạng thái cho một công việc đã lên lịch cụ thể.

Đối với các lượt chạy bắt nguồn từ kênh, `ctx.messageProvider` là bề mặt nhà cung cấp như
`discord` hoặc `telegram`, trong khi `ctx.channelId` là định danh đích hội thoại
khi OpenClaw có thể suy ra từ khóa phiên hoặc siêu dữ liệu phân phối.

`agent_end` là một điểm móc quan sát và chạy fire-and-forget sau lượt. Bộ chạy
điểm móc áp dụng thời gian chờ 30 giây để một Plugin hoặc endpoint embedding bị kẹt
không thể khiến promise điểm móc treo mãi. Việc hết thời gian chờ được ghi log và
OpenClaw tiếp tục; nó không hủy công việc mạng do Plugin sở hữu trừ khi
Plugin cũng dùng tín hiệu hủy riêng.

Dùng `model_call_started` và `model_call_ended` cho telemetry lệnh gọi nhà cung cấp
không nên nhận prompt thô, lịch sử, phản hồi, header, thân yêu cầu,
hoặc mã yêu cầu nhà cung cấp. Các điểm móc này bao gồm siêu dữ liệu ổn định như
`runId`, `callId`, `provider`, `model`, `api`/`transport` tùy chọn,
`durationMs`/`outcome` kết thúc, và `upstreamRequestIdHash` khi OpenClaw có thể suy ra
một băm mã yêu cầu nhà cung cấp có giới hạn.

`before_agent_finalize` chỉ chạy khi một harness sắp chấp nhận một câu trả lời trợ lý cuối cùng tự nhiên.
Đây không phải đường dẫn hủy `/stop` và không chạy
khi người dùng hủy một lượt. Trả về `{ action: "revise", reason }` để yêu cầu
harness chạy thêm một lượt mô hình trước khi hoàn tất, `{ action:
"finalize", reason? }` để buộc hoàn tất, hoặc bỏ qua kết quả để tiếp tục.
Các điểm móc `Stop` gốc của Codex được chuyển tiếp vào điểm móc này dưới dạng các quyết định
`before_agent_finalize` của OpenClaw.

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

Các điểm móc thay đổi prompt và lượt chèn bền vững cho lượt tiếp theo có thể được tắt theo từng Plugin
bằng `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Phần mở rộng phiên và lượt chèn cho lượt tiếp theo

Plugin quy trình làm việc có thể lưu trạng thái phiên nhỏ, tương thích JSON bằng
`api.registerSessionExtension(...)` và cập nhật nó thông qua phương thức Gateway
`sessions.pluginPatch`. Các hàng phiên chiếu trạng thái phần mở rộng đã đăng ký
qua `pluginExtensions`, cho phép Control UI và các máy khách khác hiển thị
trạng thái do Plugin sở hữu mà không cần biết phần bên trong của Plugin.

Dùng `api.enqueueNextTurnInjection(...)` khi Plugin cần ngữ cảnh bền vững để
đến đúng một lần ở lượt mô hình tiếp theo. OpenClaw rút các lượt chèn đã xếp hàng trước
các điểm móc prompt, loại bỏ lượt chèn hết hạn và chống trùng lặp theo `idempotencyKey`
cho từng Plugin. Đây là điểm mở rộng phù hợp cho tiếp tục sau phê duyệt, tóm tắt chính sách,
delta của trình giám sát nền, và phần tiếp nối lệnh cần hiển thị với
mô hình ở lượt tiếp theo nhưng không nên trở thành văn bản system prompt vĩnh viễn.

Ngữ nghĩa dọn dẹp là một phần của hợp đồng. Các callback dọn dẹp phần mở rộng phiên và
dọn dẹp vòng đời runtime nhận `reset`, `delete`, `disable`, hoặc
`restart`. Máy chủ loại bỏ trạng thái phần mở rộng phiên bền vững của Plugin sở hữu
và các lượt chèn lượt-tiếp-theo đang chờ cho reset/delete/disable; restart giữ
trạng thái phiên bền vững trong khi các callback dọn dẹp cho phép Plugin giải phóng công việc scheduler,
ngữ cảnh chạy, và các tài nguyên ngoài băng khác cho thế hệ runtime cũ.

## Điểm móc tin nhắn

Dùng điểm móc tin nhắn cho chính sách định tuyến và phân phối cấp kênh:

- `message_received`: quan sát nội dung đến, người gửi, `threadId`, `messageId`,
  `senderId`, tương quan lượt chạy/phiên tùy chọn, và siêu dữ liệu.
- `message_sending`: viết lại `content` hoặc trả về `{ cancel: true }`.
- `message_sent`: quan sát thành công hoặc thất bại cuối cùng.

Đối với phản hồi TTS chỉ có âm thanh, `content` có thể chứa bản ghi lời nói ẩn
ngay cả khi payload của kênh không có văn bản/chú thích hiển thị. Việc viết lại
`content` đó chỉ cập nhật bản ghi hiển thị với hook; nó không được kết xuất dưới
dạng chú thích media.

Ngữ cảnh hook tin nhắn hiển thị các trường tương quan ổn định khi có sẵn:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, và `ctx.callDepth`. Ưu tiên
các trường hạng nhất này trước khi đọc siêu dữ liệu cũ.

Ưu tiên các trường có kiểu `threadId` và `replyToId` trước khi dùng siêu dữ liệu
riêng cho từng kênh.

Quy tắc quyết định:

- `message_sending` với `cancel: true` là kết thúc.
- `message_sending` với `cancel: false` được xem là không có quyết định.
- `content` đã viết lại tiếp tục đi tới các hook có mức ưu tiên thấp hơn trừ khi một hook sau đó
  hủy việc gửi.

## Cài đặt hook

`before_install` chạy sau bước quét tích hợp sẵn cho các lượt cài đặt skill và Plugin.
Trả về các phát hiện bổ sung hoặc `{ block: true, blockReason }` để dừng
cài đặt.

`block: true` là kết thúc. `block: false` được xem là không có quyết định.

## Vòng đời Gateway

Dùng `gateway_start` cho các dịch vụ Plugin cần trạng thái do Gateway sở hữu. Ngữ
cảnh hiển thị `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` để
kiểm tra và cập nhật cron. Dùng `gateway_stop` để dọn dẹp các tài nguyên
chạy lâu.

Không dựa vào hook nội bộ `gateway:startup` cho các dịch vụ runtime do Plugin
sở hữu.

`cron_changed` được kích hoạt cho các sự kiện vòng đời cron do gateway sở hữu với một
payload sự kiện có kiểu bao phủ các lý do `added`, `updated`, `removed`, `started`, `finished`,
và `scheduled`. Sự kiện mang theo một snapshot `PluginHookGatewayCronJob`
(bao gồm `state.nextRunAtMs`, `state.lastRunStatus`, và
`state.lastError` khi có) cùng với một `PluginHookGatewayCronDeliveryStatus`
là `not-requested` | `delivered` | `not-delivered` | `unknown`. Sự kiện đã xóa
vẫn mang snapshot job đã xóa để các bộ lập lịch bên ngoài có thể
đối soát trạng thái. Dùng `ctx.getCron?.()` và `ctx.config` từ ngữ cảnh
runtime khi đồng bộ các bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw là
nguồn chân lý cho các kiểm tra đến hạn và việc thực thi.

## Các phần sắp ngừng hỗ trợ

Một số bề mặt liền kề hook đã bị ngừng hỗ trợ nhưng vẫn được hỗ trợ. Hãy di chuyển
trước bản phát hành lớn tiếp theo:

- **Phong bì kênh văn bản thuần** trong các handler `inbound_claim` và `message_received`.
  Đọc `BodyForAgent` và các khối ngữ cảnh người dùng có cấu trúc
  thay vì phân tích văn bản phong bì phẳng. Xem
  [Phong bì kênh văn bản thuần → BodyForAgent](/vi/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** vẫn còn để tương thích. Plugin mới nên dùng
  `before_model_resolve` và `before_prompt_build` thay cho pha kết hợp.
- **`onResolution` trong `before_tool_call`** hiện dùng union có kiểu
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) thay vì `string` tự do.

Để xem danh sách đầy đủ — đăng ký năng lực bộ nhớ, hồ sơ suy nghĩ của nhà cung cấp,
nhà cung cấp xác thực bên ngoài, kiểu khám phá nhà cung cấp, accessor runtime tác vụ,
và đổi tên `command-auth` → `command-status` — hãy xem
[Di chuyển Plugin SDK → Các phần đang ngừng hỗ trợ](/vi/plugins/sdk-migration#active-deprecations).

## Liên quan

- [Di chuyển Plugin SDK](/vi/plugins/sdk-migration) — các phần đang ngừng hỗ trợ và mốc thời gian gỡ bỏ
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Điểm vào Plugin](/vi/plugins/sdk-entrypoints)
- [Hook nội bộ](/vi/automation/hooks)
- [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals)
