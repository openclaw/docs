---
read_when:
    - Bạn đang xây dựng một Plugin cần before_tool_call, before_agent_reply, các móc thông điệp hoặc các móc vòng đời
    - Bạn cần chặn, viết lại hoặc yêu cầu phê duyệt đối với các lệnh gọi công cụ từ một Plugin
    - Bạn đang cân nhắc giữa các hook nội bộ và các hook Plugin
summary: 'Các điểm móc của Plugin: chặn bắt các sự kiện vòng đời của tác nhân, công cụ, tin nhắn, phiên và Gateway'
title: Móc nối Plugin
x-i18n:
    generated_at: "2026-05-06T17:58:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3741b95bcccdff4e24b4c1f05de54649b48a6c0a2ca1dc4376475eb1823ae185
    source_path: plugins/hooks.md
    workflow: 16
---

Các hook của Plugin là các điểm mở rộng trong tiến trình dành cho Plugin của OpenClaw. Sử dụng chúng
khi một Plugin cần kiểm tra hoặc thay đổi các lượt chạy của tác nhân, lệnh gọi công cụ, luồng tin nhắn,
vòng đời phiên, định tuyến tác nhân phụ, lượt cài đặt, hoặc quá trình khởi động Gateway.

Thay vào đó, hãy dùng [hook nội bộ](/vi/automation/hooks) khi bạn muốn một script
`HOOK.md` nhỏ do người vận hành cài đặt cho các sự kiện lệnh và Gateway như
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

Các trình xử lý hook chạy tuần tự theo `priority` giảm dần. Các hook cùng mức ưu tiên
giữ nguyên thứ tự đăng ký.

`api.on(name, handler, opts?)` chấp nhận:

- `priority` - thứ tự trình xử lý (cao hơn chạy trước).
- `timeoutMs` - ngân sách tùy chọn cho từng hook. Khi được đặt, trình chạy hook sẽ hủy
  trình xử lý đó sau khi ngân sách trôi qua và tiếp tục với trình xử lý tiếp theo, thay vì
  để công việc thiết lập hoặc truy hồi chậm tiêu tốn thời gian chờ mô hình đã cấu hình
  của bên gọi. Bỏ qua để dùng thời gian chờ quan sát/quyết định mặc định mà
  trình chạy hook áp dụng chung.

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

`hooks.timeouts.<hookName>` ghi đè `hooks.timeoutMs`, và giá trị này ghi đè
giá trị `api.on(..., { timeoutMs })` do tác giả Plugin đặt. Mỗi giá trị được cấu hình phải
là một số nguyên dương không lớn hơn 600000 mili giây. Ưu tiên ghi đè theo từng hook
cho các hook đã biết là chậm để một Plugin không nhận ngân sách dài hơn ở mọi nơi.

Mỗi hook nhận `event.context.pluginConfig`, cấu hình đã phân giải cho
Plugin đã đăng ký trình xử lý đó. Dùng nó cho các quyết định hook cần
các tùy chọn Plugin hiện tại; OpenClaw chèn nó theo từng trình xử lý mà không làm thay đổi
đối tượng sự kiện dùng chung mà các Plugin khác nhìn thấy.

## Danh mục hook

Các hook được nhóm theo bề mặt mà chúng mở rộng. Tên được in **đậm** chấp nhận
kết quả quyết định (chặn, hủy, ghi đè, hoặc yêu cầu phê duyệt); tất cả các hook khác
chỉ dùng để quan sát.

**Lượt tác nhân**

- `before_model_resolve` - ghi đè nhà cung cấp hoặc mô hình trước khi tải tin nhắn phiên
- `agent_turn_prepare` - tiêu thụ các lượt chèn phiên Plugin đang xếp hàng và thêm ngữ cảnh cùng lượt trước các hook prompt
- `before_prompt_build` - thêm ngữ cảnh động hoặc văn bản system prompt trước lệnh gọi mô hình
- `before_agent_start` - pha kết hợp chỉ để tương thích; ưu tiên hai hook ở trên
- **`before_agent_run`** - kiểm tra prompt cuối cùng và tin nhắn phiên trước khi gửi tới mô hình, đồng thời tùy chọn chặn lượt chạy
- **`before_agent_reply`** - rút ngắn lượt mô hình bằng một phản hồi tổng hợp hoặc im lặng
- **`before_agent_finalize`** - kiểm tra câu trả lời cuối cùng tự nhiên và yêu cầu thêm một lượt mô hình nữa
- `agent_end` - quan sát tin nhắn cuối cùng, trạng thái thành công, và thời lượng chạy
- `heartbeat_prompt_contribution` - thêm ngữ cảnh chỉ dành cho Heartbeat cho các Plugin giám sát nền và vòng đời

**Quan sát hội thoại**

- `model_call_started` / `model_call_ended` - quan sát siêu dữ liệu lệnh gọi nhà cung cấp/mô hình đã được làm sạch, thời gian, kết quả, và các hash mã định danh yêu cầu có giới hạn mà không có nội dung prompt hoặc phản hồi
- `llm_input` - quan sát đầu vào nhà cung cấp (system prompt, prompt, lịch sử)
- `llm_output` - quan sát đầu ra nhà cung cấp

**Công cụ**

- **`before_tool_call`** - viết lại tham số công cụ, chặn thực thi, hoặc yêu cầu phê duyệt
- `after_tool_call` - quan sát kết quả công cụ, lỗi, và thời lượng
- **`tool_result_persist`** - viết lại tin nhắn trợ lý được tạo từ kết quả công cụ
- **`before_message_write`** - kiểm tra hoặc chặn một thao tác ghi tin nhắn đang diễn ra (hiếm gặp)

**Tin nhắn và phân phối**

- **`inbound_claim`** - nhận xử lý một tin nhắn đến trước khi định tuyến tác nhân (phản hồi tổng hợp)
- `message_received` - quan sát nội dung đến, người gửi, luồng, và siêu dữ liệu
- **`message_sending`** - viết lại nội dung gửi đi hoặc hủy phân phối
- `message_sent` - quan sát việc phân phối gửi đi thành công hoặc thất bại
- **`before_dispatch`** - kiểm tra hoặc viết lại một lượt điều phối gửi đi trước khi chuyển giao cho kênh
- **`reply_dispatch`** - tham gia vào pipeline điều phối phản hồi cuối cùng

**Phiên và Compaction**

- `session_start` / `session_end` - theo dõi ranh giới vòng đời phiên
- `before_compaction` / `after_compaction` - quan sát hoặc chú thích các chu kỳ Compaction
- `before_reset` - quan sát các sự kiện đặt lại phiên (`/reset`, đặt lại theo chương trình)

**Tác nhân phụ**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - phối hợp định tuyến tác nhân phụ và phân phối khi hoàn tất

**Vòng đời**

- `gateway_start` / `gateway_stop` - khởi động hoặc dừng các dịch vụ do Plugin sở hữu cùng với Gateway
- `cron_changed` - quan sát các thay đổi vòng đời Cron do Gateway sở hữu (đã thêm, đã cập nhật, đã xóa, đã bắt đầu, đã hoàn tất, đã lên lịch)
- **`before_install`** - kiểm tra các lượt quét cài đặt Skills hoặc Plugin và tùy chọn chặn

## Chính sách lệnh gọi công cụ

`before_tool_call` nhận:

- `event.toolName`
- `event.params`
- tùy chọn `event.runId`
- tùy chọn `event.toolCallId`
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
- `params` viết lại các tham số công cụ để thực thi.
- `requireApproval` tạm dừng lượt chạy tác nhân và hỏi người dùng thông qua phê duyệt
  Plugin. Lệnh `/approve` có thể phê duyệt cả phê duyệt exec và Plugin.
- Một `block: true` có mức ưu tiên thấp hơn vẫn có thể chặn sau khi một hook có mức ưu tiên cao hơn
  đã yêu cầu phê duyệt.
- `onResolution` nhận quyết định phê duyệt đã được phân giải - `allow-once`,
  `allow-always`, `deny`, `timeout`, hoặc `cancelled`.

Các Plugin đi kèm cần chính sách cấp máy chủ có thể đăng ký chính sách công cụ đáng tin cậy
với `api.registerTrustedToolPolicy(...)`. Các chính sách này chạy trước các hook
`before_tool_call` thông thường và trước các quyết định của Plugin bên ngoài. Chỉ dùng chúng
cho các cổng được máy chủ tin cậy như chính sách không gian làm việc, thực thi ngân sách, hoặc
an toàn quy trình làm việc dành riêng. Plugin bên ngoài nên dùng các hook `before_tool_call`
thông thường.

### Lưu bền kết quả công cụ

Kết quả công cụ có thể bao gồm `details` có cấu trúc để hiển thị UI, chẩn đoán,
định tuyến phương tiện, hoặc siêu dữ liệu do Plugin sở hữu. Xem `details` là siêu dữ liệu runtime,
không phải nội dung prompt:

- OpenClaw loại bỏ `toolResult.details` trước khi phát lại cho nhà cung cấp và đầu vào
  Compaction để siêu dữ liệu không trở thành ngữ cảnh mô hình.
- Các mục phiên được lưu bền chỉ giữ `details` có giới hạn. Chi tiết quá lớn được
  thay thế bằng một bản tóm tắt gọn và `persistedDetailsTruncated: true`.
- `tool_result_persist` và `before_message_write` chạy trước giới hạn lưu bền
  cuối cùng. Các hook vẫn nên giữ `details` trả về ở kích thước nhỏ và tránh
  đặt văn bản liên quan đến prompt chỉ trong `details`; hãy đặt đầu ra công cụ mà mô hình nhìn thấy
  trong `content`.

## Hook prompt và mô hình

Dùng các hook theo pha cụ thể cho Plugin mới:

- `before_model_resolve`: chỉ nhận prompt hiện tại và siêu dữ liệu tệp đính kèm.
  Trả về `providerOverride` hoặc `modelOverride`.
- `agent_turn_prepare`: nhận prompt hiện tại, các tin nhắn phiên đã chuẩn bị,
  và mọi lượt chèn xếp hàng đúng-một-lần đã được rút ra cho phiên này. Trả về
  `prependContext` hoặc `appendContext`.
- `before_prompt_build`: nhận prompt hiện tại và tin nhắn phiên.
  Trả về `prependContext`, `appendContext`, `systemPrompt`,
  `prependSystemContext`, hoặc `appendSystemContext`.
- `heartbeat_prompt_contribution`: chỉ chạy cho các lượt Heartbeat và trả về
  `prependContext` hoặc `appendContext`. Hook này dành cho các trình giám sát nền
  cần tóm tắt trạng thái hiện tại mà không thay đổi các lượt do người dùng khởi tạo.

`before_agent_start` vẫn tồn tại để tương thích. Ưu tiên các hook tường minh ở trên
để Plugin của bạn không phụ thuộc vào một pha kết hợp cũ.

`before_agent_run` chạy sau khi xây dựng prompt và trước mọi đầu vào mô hình,
bao gồm tải hình ảnh cục bộ của prompt và quan sát `llm_input`. Nó nhận
đầu vào người dùng hiện tại dưới dạng `prompt`, cùng với lịch sử phiên đã tải trong `messages`
và system prompt đang hoạt động. Trả về `{ outcome: "block", reason, message? }`
để dừng lượt chạy trước khi mô hình có thể đọc prompt. `reason` là nội bộ;
`message` là nội dung thay thế hiển thị cho người dùng. Các kết quả duy nhất được hỗ trợ là
`pass` và `block`; các dạng quyết định không được hỗ trợ sẽ đóng theo hướng an toàn.

Khi một lượt chạy bị chặn, OpenClaw chỉ lưu văn bản thay thế trong
`message.content` cộng với siêu dữ liệu chặn không nhạy cảm như id Plugin chặn
và dấu thời gian. Văn bản gốc của người dùng không được giữ lại trong bản ghi hội thoại hoặc ngữ cảnh
tương lai. Lý do chặn nội bộ được xem là nhạy cảm và bị loại khỏi
bản ghi hội thoại, lịch sử, phát sóng, nhật ký, và payload chẩn đoán. Khả năng quan sát
nên dùng các trường đã được làm sạch như id bên chặn, kết quả, dấu thời gian, hoặc một
danh mục an toàn.

`before_agent_start` và `agent_end` bao gồm `event.runId` khi OpenClaw có thể
xác định lượt chạy đang hoạt động. Giá trị tương tự cũng có sẵn trên `ctx.runId`.
Các lượt chạy do Cron điều khiển cũng phơi bày `ctx.jobId` (id tác vụ Cron nguồn gốc) để
các hook Plugin có thể giới hạn phạm vi chỉ số, hiệu ứng phụ, hoặc trạng thái theo một tác vụ đã lên lịch
cụ thể.

Đối với các lượt chạy bắt nguồn từ kênh, `ctx.messageProvider` là bề mặt nhà cung cấp như
`discord` hoặc `telegram`, còn `ctx.channelId` là mã định danh mục tiêu hội thoại
khi OpenClaw có thể suy ra từ khóa phiên hoặc siêu dữ liệu phân phối.

`agent_end` là một hook quan sát và chạy fire-and-forget sau lượt. Trình
chạy hook áp dụng thời gian chờ 30 giây để một Plugin hoặc endpoint embedding bị kẹt
không thể khiến promise hook chờ mãi. Thời gian chờ được ghi nhật ký và
OpenClaw tiếp tục; nó không hủy công việc mạng do Plugin sở hữu trừ khi
Plugin cũng dùng tín hiệu hủy riêng của nó.

Dùng `model_call_started` và `model_call_ended` cho dữ liệu đo từ xa lệnh gọi nhà cung cấp
không nên nhận prompt thô, lịch sử, phản hồi, header, thân yêu cầu,
hoặc ID yêu cầu nhà cung cấp. Các hook này bao gồm siêu dữ liệu ổn định như
`runId`, `callId`, `provider`, `model`, tùy chọn `api`/`transport`,
`durationMs`/`outcome` cuối cùng, và `upstreamRequestIdHash` khi OpenClaw có thể suy ra
một hash mã định danh yêu cầu nhà cung cấp có giới hạn.

`before_agent_finalize` chỉ chạy khi một harness sắp chấp nhận một
câu trả lời trợ lý cuối cùng tự nhiên. Đây không phải là đường dẫn hủy `/stop` và không
chạy khi người dùng hủy một lượt. Trả về `{ action: "revise", reason }` để yêu cầu
harness thực hiện thêm một lượt mô hình nữa trước khi hoàn tất, `{ action:
"finalize", reason? }` để buộc hoàn tất, hoặc bỏ qua kết quả để tiếp tục.
Các hook `Stop` gốc của Codex được chuyển tiếp vào hook này dưới dạng các quyết định
`before_agent_finalize` của OpenClaw.

Khi trả về `action: "revise"`, Plugin có thể bao gồm siêu dữ liệu `retry` để làm cho
lượt mô hình bổ sung có giới hạn và an toàn khi phát lại:

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` được thêm vào lý do sửa đổi gửi đến bộ thử nghiệm.
`idempotencyKey` cho phép máy chủ đếm số lần thử lại cho cùng yêu cầu Plugin qua
các quyết định hoàn tất tương đương, và `maxAttempts` giới hạn số lượt bổ sung mà
máy chủ sẽ cho phép trước khi tiếp tục với câu trả lời cuối tự nhiên.

Các Plugin không được đóng gói sẵn cần các điểm móc hội thoại thô (`before_model_resolve`,
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

Các điểm móc làm thay đổi lời nhắc và phần chèn bền vững cho lượt tiếp theo có thể được tắt theo từng Plugin
bằng `plugins.entries.<id>.hooks.allowPromptInjection=false`.

### Phần mở rộng phiên và phần chèn lượt tiếp theo

Plugin quy trình làm việc có thể lưu giữ trạng thái phiên nhỏ tương thích với JSON bằng
`api.registerSessionExtension(...)` và cập nhật trạng thái đó thông qua phương thức Gateway
`sessions.pluginPatch`. Các hàng phiên chiếu trạng thái phần mở rộng đã đăng ký
qua `pluginExtensions`, cho phép Control UI và các máy khách khác hiển thị
trạng thái thuộc sở hữu của Plugin mà không cần biết phần nội bộ của Plugin.

Dùng `api.enqueueNextTurnInjection(...)` khi Plugin cần ngữ cảnh bền vững để
đến đúng một lần ở lượt mô hình tiếp theo. OpenClaw rút cạn các phần chèn đã xếp hàng trước
các điểm móc lời nhắc, loại bỏ các phần chèn đã hết hạn, và loại bỏ trùng lặp theo `idempotencyKey`
cho từng Plugin. Đây là ranh giới phù hợp cho việc tiếp tục sau phê duyệt, tóm tắt chính sách,
chênh lệch từ trình giám sát nền, và phần tiếp tục lệnh cần hiển thị với
mô hình ở lượt tiếp theo nhưng không nên trở thành văn bản lời nhắc hệ thống vĩnh viễn.

Ngữ nghĩa dọn dẹp là một phần của hợp đồng. Dọn dẹp phần mở rộng phiên và
các lệnh gọi lại dọn dẹp vòng đời thời gian chạy nhận `reset`, `delete`, `disable`, hoặc
`restart`. Máy chủ xóa trạng thái phần mở rộng phiên bền vững của Plugin sở hữu
và các phần chèn lượt tiếp theo đang chờ cho reset/delete/disable; restart giữ
trạng thái phiên bền vững trong khi các lệnh gọi lại dọn dẹp cho phép Plugin giải phóng tác vụ bộ lập lịch,
ngữ cảnh chạy, và các tài nguyên ngoài băng khác cho thế hệ thời gian chạy cũ.

## Điểm móc thông điệp

Dùng điểm móc thông điệp cho chính sách định tuyến và phân phối ở cấp kênh:

- `message_received`: quan sát nội dung đến, người gửi, `threadId`, `messageId`,
  `senderId`, tương quan chạy/phiên tùy chọn, và siêu dữ liệu.
- `message_sending`: viết lại `content` hoặc trả về `{ cancel: true }`.
- `message_sent`: quan sát kết quả thành công hoặc thất bại cuối cùng.

Đối với các phản hồi TTS chỉ có âm thanh, `content` có thể chứa bản chép lời ẩn được nói
ngay cả khi tải trọng kênh không có văn bản/chú thích hiển thị. Việc viết lại
`content` chỉ cập nhật bản chép lời hiển thị với điểm móc; nó không được kết xuất làm
chú thích phương tiện.

Ngữ cảnh điểm móc thông điệp hiển thị các trường tương quan ổn định khi có:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId`, và `ctx.callDepth`. Ưu tiên
các trường hạng nhất này trước khi đọc siêu dữ liệu cũ.

Ưu tiên các trường có kiểu `threadId` và `replyToId` trước khi dùng siêu dữ liệu
riêng của kênh.

Quy tắc quyết định:

- `message_sending` với `cancel: true` là kết thúc.
- `message_sending` với `cancel: false` được xem là không có quyết định.
- `content` đã viết lại tiếp tục đi đến các điểm móc có mức ưu tiên thấp hơn trừ khi một điểm móc sau đó
  hủy phân phối.

## Điểm móc cài đặt

`before_install` chạy sau lượt quét tích hợp sẵn cho các lượt cài đặt Skills và Plugin.
Trả về các phát hiện bổ sung hoặc `{ block: true, blockReason }` để dừng
cài đặt.

`block: true` là kết thúc. `block: false` được xem là không có quyết định.

## Vòng đời Gateway

Dùng `gateway_start` cho các dịch vụ Plugin cần trạng thái thuộc sở hữu Gateway. Ngữ cảnh
hiển thị `ctx.config`, `ctx.workspaceDir`, và `ctx.getCron?.()` để
kiểm tra và cập nhật cron. Dùng `gateway_stop` để dọn dẹp
tài nguyên chạy lâu.

Không dựa vào điểm móc nội bộ `gateway:startup` cho các dịch vụ thời gian chạy
thuộc sở hữu của Plugin.

`cron_changed` kích hoạt cho các sự kiện vòng đời cron thuộc sở hữu gateway với tải trọng
sự kiện có kiểu bao gồm các lý do `added`, `updated`, `removed`, `started`, `finished`,
và `scheduled`. Sự kiện mang một ảnh chụp nhanh `PluginHookGatewayCronJob`
(bao gồm `state.nextRunAtMs`, `state.lastRunStatus`, và
`state.lastError` khi có) cộng với `PluginHookGatewayCronDeliveryStatus`
là `not-requested` | `delivered` | `not-delivered` | `unknown`. Sự kiện đã xóa
vẫn mang ảnh chụp nhanh tác vụ đã xóa để các bộ lập lịch bên ngoài có thể
đối chiếu trạng thái. Dùng `ctx.getCron?.()` và `ctx.config` từ ngữ cảnh
thời gian chạy khi đồng bộ các bộ lập lịch đánh thức bên ngoài, và giữ OpenClaw làm
nguồn sự thật cho kiểm tra đến hạn và thực thi.

## Các mục sắp ngừng hỗ trợ

Một vài bề mặt liền kề điểm móc đã bị ngừng hỗ trợ nhưng vẫn được hỗ trợ. Hãy di chuyển
trước bản phát hành chính tiếp theo:

- **Phong bì kênh văn bản thuần** trong các trình xử lý `inbound_claim` và `message_received`.
  Đọc `BodyForAgent` và các khối ngữ cảnh người dùng có cấu trúc
  thay vì phân tích văn bản phong bì phẳng. Xem
  [Phong bì kênh văn bản thuần → BodyForAgent](/vi/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** vẫn tồn tại để tương thích. Plugin mới nên dùng
  `before_model_resolve` và `before_prompt_build` thay cho pha kết hợp.
- **`onResolution` trong `before_tool_call`** hiện dùng hợp
  `PluginApprovalResolution` có kiểu (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) thay cho `string` dạng tự do.

Để xem danh sách đầy đủ - đăng ký năng lực bộ nhớ, hồ sơ suy nghĩ của nhà cung cấp,
nhà cung cấp xác thực bên ngoài, kiểu khám phá nhà cung cấp, bộ truy cập thời gian chạy tác vụ,
và đổi tên `command-auth` → `command-status` - xem
[Di chuyển Plugin SDK → Các mục ngừng hỗ trợ đang hoạt động](/vi/plugins/sdk-migration#active-deprecations).

## Liên quan

- [Di chuyển Plugin SDK](/vi/plugins/sdk-migration) - các mục ngừng hỗ trợ đang hoạt động và lịch trình loại bỏ
- [Xây dựng Plugin](/vi/plugins/building-plugins)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
- [Điểm vào Plugin](/vi/plugins/sdk-entrypoints)
- [Điểm móc nội bộ](/vi/automation/hooks)
- [Nội bộ kiến trúc Plugin](/vi/plugins/architecture-internals)
