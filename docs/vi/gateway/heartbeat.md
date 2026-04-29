---
read_when:
    - Điều chỉnh nhịp Heartbeat hoặc thông điệp
    - Chọn giữa Heartbeat và Cron cho các tác vụ theo lịch
sidebarTitle: Heartbeat
summary: Thông điệp thăm dò Heartbeat và quy tắc thông báo
title: Heartbeat
x-i18n:
    generated_at: "2026-04-29T22:43:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bafae7cafb9163015a112c074d36ab070c71d1d7ba1c7c0834e6720521f4275
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat và Cron?** Xem [Tự động hóa & tác vụ](/vi/automation) để biết hướng dẫn về thời điểm nên dùng từng loại.
</Note>

Heartbeat chạy **các lượt agent định kỳ** trong phiên chính để mô hình có thể hiển thị bất kỳ nội dung nào cần chú ý mà không gửi quá nhiều thông báo cho bạn.

Heartbeat là một lượt trong phiên chính đã lên lịch — nó **không** tạo bản ghi [tác vụ nền](/vi/automation/tasks). Bản ghi tác vụ dành cho công việc tách rời (lượt chạy ACP, agent phụ, công việc cron cô lập).

Khắc phục sự cố: [Tác vụ đã lên lịch](/vi/automation/cron-jobs#troubleshooting)

## Bắt đầu nhanh (người mới)

<Steps>
  <Step title="Chọn nhịp chạy">
    Giữ Heartbeat được bật (mặc định là `30m`, hoặc `1h` cho xác thực Anthropic OAuth/token, bao gồm tái sử dụng Claude CLI) hoặc đặt nhịp riêng của bạn.
  </Step>
  <Step title="Thêm HEARTBEAT.md (tùy chọn)">
    Tạo một danh sách kiểm tra `HEARTBEAT.md` nhỏ hoặc khối `tasks:` trong không gian làm việc của agent.
  </Step>
  <Step title="Quyết định nơi gửi thông báo Heartbeat">
    `target: "none"` là mặc định; đặt `target: "last"` để định tuyến tới liên hệ gần nhất.
  </Step>
  <Step title="Tinh chỉnh tùy chọn">
    - Bật gửi suy luận Heartbeat để minh bạch.
    - Dùng ngữ cảnh khởi động nhẹ nếu lượt chạy Heartbeat chỉ cần `HEARTBEAT.md`.
    - Bật phiên cô lập để tránh gửi toàn bộ lịch sử hội thoại cho mỗi Heartbeat.
    - Giới hạn Heartbeat trong giờ hoạt động (giờ địa phương).

  </Step>
</Steps>

Cấu hình ví dụ:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        directPolicy: "allow", // default: allow direct/DM targets; set "block" to suppress
        lightContext: true, // optional: only inject HEARTBEAT.md from bootstrap files
        isolatedSession: true, // optional: fresh session each run (no conversation history)
        skipWhenBusy: true, // optional: also defer when subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Mặc định

- Khoảng thời gian: `30m` (hoặc `1h` khi chế độ xác thực được phát hiện là Anthropic OAuth/token, bao gồm tái sử dụng Claude CLI). Đặt `agents.defaults.heartbeat.every` hoặc `agents.list[].heartbeat.every` cho từng agent; dùng `0m` để tắt.
- Nội dung lời nhắc (có thể cấu hình qua `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Lời nhắc Heartbeat được gửi **nguyên văn** dưới dạng thông báo người dùng. Lời nhắc hệ thống chỉ bao gồm phần "Heartbeat" khi Heartbeat được bật cho agent mặc định, và lượt chạy được đánh dấu nội bộ.
- Khi Heartbeat bị tắt bằng `0m`, các lượt chạy bình thường cũng bỏ qua `HEARTBEAT.md` khỏi ngữ cảnh khởi động để mô hình không thấy các chỉ dẫn chỉ dành cho Heartbeat.
- Giờ hoạt động (`heartbeat.activeHours`) được kiểm tra theo múi giờ đã cấu hình. Ngoài khung giờ đó, Heartbeat bị bỏ qua cho đến tick tiếp theo nằm trong khung giờ.
- Heartbeat tự động hoãn trong khi công việc cron đang hoạt động hoặc đang xếp hàng. Đặt `heartbeat.skipWhenBusy: true` để cũng hoãn trên các làn bận bổ sung (agent phụ hoặc công việc lệnh lồng nhau); điều này hữu ích cho Ollama cục bộ và các máy chủ runtime đơn bị hạn chế khác.

## Lời nhắc Heartbeat dùng để làm gì

Lời nhắc mặc định được cố ý để rộng:

- **Tác vụ nền**: "Xem xét các tác vụ còn tồn đọng" nhắc agent xem lại các mục cần theo dõi (hộp thư đến, lịch, lời nhắc, công việc đang xếp hàng) và hiển thị bất kỳ điều gì khẩn cấp.
- **Kiểm tra với con người**: "Thỉnh thoảng hỏi thăm con người của bạn trong giờ ban ngày" nhắc một thông báo nhẹ kiểu "bạn cần gì không?" thỉnh thoảng, nhưng tránh làm phiền ban đêm bằng cách dùng múi giờ địa phương đã cấu hình của bạn (xem [Múi giờ](/vi/concepts/timezone)).

Heartbeat có thể phản ứng với [tác vụ nền](/vi/automation/tasks) đã hoàn tất, nhưng bản thân một lượt chạy Heartbeat không tạo bản ghi tác vụ.

Nếu bạn muốn Heartbeat làm điều gì đó rất cụ thể (ví dụ: "kiểm tra thống kê Gmail PubSub" hoặc "xác minh tình trạng Gateway"), hãy đặt `agents.defaults.heartbeat.prompt` (hoặc `agents.list[].heartbeat.prompt`) thành nội dung tùy chỉnh (được gửi nguyên văn).

## Hợp đồng phản hồi

- Nếu không có gì cần chú ý, trả lời bằng **`HEARTBEAT_OK`**.
- Trong các lượt chạy Heartbeat, OpenClaw coi `HEARTBEAT_OK` là xác nhận khi nó xuất hiện ở **đầu hoặc cuối** câu trả lời. Token này bị loại bỏ và câu trả lời bị bỏ nếu phần nội dung còn lại **≤ `ackMaxChars`** (mặc định: 300).
- Nếu `HEARTBEAT_OK` xuất hiện ở **giữa** câu trả lời, nó không được xử lý đặc biệt.
- Đối với cảnh báo, **không** bao gồm `HEARTBEAT_OK`; chỉ trả về văn bản cảnh báo.

Bên ngoài Heartbeat, `HEARTBEAT_OK` lạc chỗ ở đầu/cuối thông báo sẽ bị loại bỏ và ghi log; thông báo chỉ có `HEARTBEAT_OK` sẽ bị bỏ.

## Cấu hình

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // default: 30m (0m disables)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // default: false (deliver separate Reasoning: message when available)
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "bluebubbles")
        to: "+15551234567", // optional channel-specific override
        accountId: "ops-bot", // optional multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // max chars allowed after HEARTBEAT_OK
      },
    },
  },
}
```

### Phạm vi và thứ tự ưu tiên

- `agents.defaults.heartbeat` đặt hành vi Heartbeat toàn cục.
- `agents.list[].heartbeat` hợp nhất lên trên; nếu bất kỳ agent nào có khối `heartbeat`, **chỉ các agent đó** chạy Heartbeat.
- `channels.defaults.heartbeat` đặt mặc định hiển thị cho tất cả kênh.
- `channels.<channel>.heartbeat` ghi đè mặc định của kênh.
- `channels.<channel>.accounts.<id>.heartbeat` (kênh nhiều tài khoản) ghi đè cài đặt theo kênh.

### Heartbeat theo từng agent

Nếu bất kỳ mục `agents.list[]` nào có khối `heartbeat`, **chỉ những agent đó** chạy Heartbeat. Khối theo từng agent được hợp nhất trên `agents.defaults.heartbeat` (vì vậy bạn có thể đặt mặc định dùng chung một lần và ghi đè theo từng agent).

Ví dụ: hai agent, chỉ agent thứ hai chạy Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          timeoutSeconds: 45,
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Ví dụ về giờ hoạt động

Giới hạn Heartbeat trong giờ làm việc theo một múi giờ cụ thể:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // explicit delivery to last contact (default is "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // optional; uses your userTimezone if set, otherwise host tz
        },
      },
    },
  },
}
```

Ngoài khoảng thời gian này (trước 9 giờ sáng hoặc sau 10 giờ tối giờ miền Đông), Heartbeat sẽ bị bỏ qua. Lần chạy theo lịch tiếp theo trong khoảng thời gian này sẽ chạy bình thường.

### Thiết lập 24/7

Nếu bạn muốn Heartbeat chạy cả ngày, hãy dùng một trong các mẫu sau:

- Bỏ hẳn `activeHours` (không có giới hạn khung thời gian; đây là hành vi mặc định).
- Đặt khung thời gian cả ngày: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Không đặt cùng thời gian `start` và `end` (ví dụ từ `08:00` đến `08:00`). Điều đó được xem là khung thời gian có độ rộng bằng không, nên Heartbeat luôn bị bỏ qua.
</Warning>

### Ví dụ nhiều tài khoản

Sử dụng `accountId` để nhắm đến một tài khoản cụ thể trên các kênh nhiều tài khoản như Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // optional: route to a specific topic/thread
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Ghi chú trường

<ParamField path="every" type="string">
  Khoảng thời gian Heartbeat (chuỗi thời lượng; đơn vị mặc định = phút).
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình tùy chọn cho các lần chạy Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Khi bật, cũng gửi thông báo `Reasoning:` riêng khi có sẵn (cùng cấu trúc với `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Khi là true, các lần chạy Heartbeat dùng ngữ cảnh khởi động nhẹ và chỉ giữ `HEARTBEAT.md` từ các tệp khởi động workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Khi là true, mỗi Heartbeat chạy trong một phiên mới không có lịch sử hội thoại trước đó. Sử dụng cùng mẫu cô lập như cron `sessionTarget: "isolated"`. Giảm đáng kể chi phí token cho mỗi Heartbeat. Kết hợp với `lightContext: true` để tiết kiệm tối đa. Định tuyến gửi vẫn dùng ngữ cảnh phiên chính.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Khi là true, các lần chạy Heartbeat sẽ trì hoãn trên các làn bận bổ sung: công việc subagent hoặc lệnh lồng nhau. Các làn Cron luôn trì hoãn Heartbeat, ngay cả khi không có cờ này, để máy chủ mô hình cục bộ không chạy lời nhắc Cron và Heartbeat cùng lúc.
</ParamField>
<ParamField path="session" type="string">
  Khóa phiên tùy chọn cho các lần chạy Heartbeat.

- `main` (mặc định): phiên chính của agent.
- Khóa phiên rõ ràng (sao chép từ `openclaw sessions --json` hoặc [CLI phiên](/vi/cli/sessions)).
- Định dạng khóa phiên: xem [Phiên](/vi/concepts/session) và [Nhóm](/vi/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: gửi đến kênh bên ngoài được dùng gần nhất.
- kênh rõ ràng: bất kỳ kênh hoặc id plugin nào đã cấu hình, ví dụ `discord`, `matrix`, `telegram`, hoặc `whatsapp`.
- `none` (mặc định): chạy Heartbeat nhưng **không gửi** ra bên ngoài.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Kiểm soát hành vi gửi trực tiếp/DM. `allow`: cho phép gửi Heartbeat trực tiếp/DM. `block`: chặn gửi trực tiếp/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Ghi đè người nhận tùy chọn (id theo kênh, ví dụ E.164 cho WhatsApp hoặc id cuộc trò chuyện Telegram). Với chủ đề/luồng Telegram, dùng `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id tài khoản tùy chọn cho các kênh nhiều tài khoản. Khi `target: "last"`, id tài khoản áp dụng cho kênh gần nhất đã phân giải nếu kênh đó hỗ trợ tài khoản; nếu không thì bị bỏ qua. Nếu id tài khoản không khớp với tài khoản đã cấu hình cho kênh đã phân giải, việc gửi sẽ bị bỏ qua.

</ParamField>
<ParamField path="prompt" type="string">
  Ghi đè nội dung lời nhắc mặc định (không hợp nhất).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Số ký tự tối đa được phép sau `HEARTBEAT_OK` trước khi gửi.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Khi là true, sẽ ẩn các payload cảnh báo lỗi công cụ trong các lần chạy Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Giới hạn các lần chạy Heartbeat trong một khung thời gian. Đối tượng có `start` (HH:MM, bao gồm; dùng `00:00` cho đầu ngày), `end` (HH:MM không bao gồm; cho phép `24:00` cho cuối ngày), và `timezone` tùy chọn.

- Bị bỏ qua hoặc `"user"`: dùng `agents.defaults.userTimezone` của bạn nếu được đặt, nếu không thì dùng múi giờ hệ thống máy chủ.
- `"local"`: luôn dùng múi giờ hệ thống máy chủ.
- Bất kỳ mã định danh IANA nào (ví dụ `America/New_York`): được dùng trực tiếp; nếu không hợp lệ, quay về hành vi `"user"` ở trên.
- `start` và `end` không được bằng nhau đối với một cửa sổ hoạt động; các giá trị bằng nhau được xem là độ rộng bằng không (luôn ở ngoài cửa sổ).
- Ngoài cửa sổ hoạt động, Heartbeat bị bỏ qua cho đến tick tiếp theo nằm trong cửa sổ.

</ParamField>

## Hành vi phân phối

<AccordionGroup>
  <Accordion title="Định tuyến phiên và đích">
    - Heartbeat chạy trong phiên chính của tác tử theo mặc định (`agent:<id>:<mainKey>`), hoặc `global` khi `session.scope = "global"`. Đặt `session` để ghi đè sang một phiên kênh cụ thể (Discord/WhatsApp/v.v.).
    - `session` chỉ ảnh hưởng đến ngữ cảnh chạy; việc phân phối được kiểm soát bởi `target` và `to`.
    - Để phân phối đến một kênh/người nhận cụ thể, đặt `target` + `to`. Với `target: "last"`, việc phân phối dùng kênh bên ngoài cuối cùng cho phiên đó.
    - Các lượt phân phối Heartbeat cho phép đích trực tiếp/DM theo mặc định. Đặt `directPolicy: "block"` để chặn gửi đến đích trực tiếp trong khi vẫn chạy lượt Heartbeat.
    - Nếu hàng đợi chính, lane phiên đích, lane Cron, hoặc một tác vụ Cron đang hoạt động bận, Heartbeat sẽ bị bỏ qua và thử lại sau.
    - Nếu `skipWhenBusy: true`, các lane tác tử con và lane lồng nhau cũng trì hoãn các lần chạy Heartbeat.
    - Nếu `target` không phân giải được đích bên ngoài nào, lượt chạy vẫn diễn ra nhưng không có tin nhắn đi nào được gửi.

  </Accordion>
  <Accordion title="Khả năng hiển thị và hành vi bỏ qua">
    - Nếu `showOk`, `showAlerts`, và `useIndicator` đều bị tắt, lượt chạy bị bỏ qua ngay từ đầu với `reason=alerts-disabled`.
    - Nếu chỉ tắt phân phối cảnh báo, OpenClaw vẫn có thể chạy Heartbeat, cập nhật dấu thời gian tác vụ đến hạn, khôi phục dấu thời gian nhàn rỗi của phiên, và ẩn payload cảnh báo gửi ra ngoài.
    - Nếu đích Heartbeat đã phân giải hỗ trợ trạng thái đang nhập, OpenClaw hiển thị đang nhập trong khi lượt chạy Heartbeat đang hoạt động. Trạng thái này dùng cùng đích mà Heartbeat sẽ gửi đầu ra trò chuyện đến, và bị tắt bởi `typingMode: "never"`.

  </Accordion>
  <Accordion title="Vòng đời phiên và kiểm toán">
    - Các phản hồi chỉ dành cho Heartbeat **không** giữ phiên tiếp tục hoạt động. Siêu dữ liệu Heartbeat có thể cập nhật hàng phiên, nhưng hết hạn do nhàn rỗi dùng `lastInteractionAt` từ tin nhắn người dùng/kênh thật cuối cùng, và hết hạn hằng ngày dùng `sessionStartedAt`.
    - Lịch sử Control UI và WebChat ẩn các prompt Heartbeat và xác nhận chỉ OK. Bản ghi phiên bên dưới vẫn có thể chứa các lượt đó để kiểm toán/phát lại.
    - [Tác vụ nền](/vi/automation/tasks) tách rời có thể đưa một sự kiện hệ thống vào hàng đợi và đánh thức Heartbeat khi phiên chính cần nhanh chóng chú ý đến điều gì đó. Lần đánh thức đó không biến lượt chạy Heartbeat thành một tác vụ nền.

  </Accordion>
</AccordionGroup>

## Điều khiển khả năng hiển thị

Theo mặc định, các xác nhận `HEARTBEAT_OK` bị ẩn trong khi nội dung cảnh báo được phân phối. Bạn có thể điều chỉnh điều này theo từng kênh hoặc từng tài khoản:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Hide HEARTBEAT_OK (default)
      showAlerts: true # Show alert messages (default)
      useIndicator: true # Emit indicator events (default)
  telegram:
    heartbeat:
      showOk: true # Show OK acknowledgments on Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Suppress alert delivery for this account
```

Thứ tự ưu tiên: theo tài khoản → theo kênh → mặc định của kênh → mặc định tích hợp sẵn.

### Tác dụng của từng cờ

- `showOk`: gửi xác nhận `HEARTBEAT_OK` khi mô hình trả về phản hồi chỉ OK.
- `showAlerts`: gửi nội dung cảnh báo khi mô hình trả về phản hồi không phải OK.
- `useIndicator`: phát sự kiện chỉ báo cho các bề mặt trạng thái UI.

Nếu **cả ba** đều false, OpenClaw bỏ qua hoàn toàn lượt chạy Heartbeat (không gọi mô hình).

### Ví dụ theo kênh và theo tài khoản

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # all Slack accounts
    accounts:
      ops:
        heartbeat:
          showAlerts: false # suppress alerts for the ops account only
  telegram:
    heartbeat:
      showOk: true
```

### Mẫu phổ biến

| Mục tiêu                                 | Cấu hình                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Hành vi mặc định (OK im lặng, bật cảnh báo) | _(không cần cấu hình)_                                                                   |
| Hoàn toàn im lặng (không tin nhắn, không chỉ báo) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Chỉ chỉ báo (không tin nhắn)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK chỉ trong một kênh                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (tùy chọn)

Nếu một tệp `HEARTBEAT.md` tồn tại trong workspace, prompt mặc định yêu cầu tác tử đọc tệp đó. Hãy xem nó như "danh sách kiểm tra Heartbeat" của bạn: nhỏ, ổn định, và an toàn để đưa vào mỗi 30 phút.

Trong các lần chạy bình thường, `HEARTBEAT.md` chỉ được chèn khi hướng dẫn Heartbeat được bật cho tác tử mặc định. Tắt nhịp Heartbeat bằng `0m` hoặc đặt `includeSystemPromptSection: false` sẽ bỏ nó khỏi ngữ cảnh bootstrap bình thường.

Nếu `HEARTBEAT.md` tồn tại nhưng thực chất trống (chỉ có dòng trống và tiêu đề markdown như `# Heading`), OpenClaw bỏ qua lượt chạy Heartbeat để tiết kiệm lệnh gọi API. Lần bỏ qua đó được báo cáo là `reason=empty-heartbeat-file`. Nếu thiếu tệp, Heartbeat vẫn chạy và mô hình quyết định cần làm gì.

Giữ nó thật nhỏ (danh sách kiểm tra hoặc lời nhắc ngắn) để tránh làm phình prompt.

Ví dụ `HEARTBEAT.md`:

```md
# Heartbeat checklist

- Quick scan: anything urgent in inboxes?
- If it's daytime, do a lightweight check-in if nothing else is pending.
- If a task is blocked, write down _what is missing_ and ask Peter next time.
```

### Khối `tasks:`

`HEARTBEAT.md` cũng hỗ trợ một khối `tasks:` có cấu trúc nhỏ cho các kiểm tra theo khoảng thời gian bên trong chính Heartbeat.

Ví dụ:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Check for urgent unread emails and flag anything time sensitive."
- name: calendar-scan
  interval: 2h
  prompt: "Check for upcoming meetings that need prep or follow-up."

# Additional instructions

- Keep alerts short.
- If nothing needs attention after all due tasks, reply HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Hành vi">
    - OpenClaw phân tích cú pháp khối `tasks:` và kiểm tra từng tác vụ theo `interval` riêng của nó.
    - Chỉ các tác vụ **đến hạn** được đưa vào prompt Heartbeat cho tick đó.
    - Nếu không có tác vụ nào đến hạn, Heartbeat bị bỏ qua hoàn toàn (`reason=no-tasks-due`) để tránh lãng phí một lệnh gọi mô hình.
    - Nội dung không phải tác vụ trong `HEARTBEAT.md` được giữ nguyên và nối thêm làm ngữ cảnh bổ sung sau danh sách tác vụ đến hạn.
    - Dấu thời gian lần chạy cuối của tác vụ được lưu trong trạng thái phiên (`heartbeatTaskState`), nên các khoảng thời gian vẫn tồn tại qua các lần khởi động lại bình thường.
    - Dấu thời gian tác vụ chỉ được nâng lên sau khi một lượt chạy Heartbeat hoàn tất đường dẫn phản hồi bình thường. Các lượt chạy `empty-heartbeat-file` / `no-tasks-due` bị bỏ qua không đánh dấu tác vụ là đã hoàn tất.

  </Accordion>
</AccordionGroup>

Chế độ tác vụ hữu ích khi bạn muốn một tệp Heartbeat chứa nhiều kiểm tra định kỳ mà không phải trả chi phí cho tất cả chúng ở mọi tick.

### Tác tử có thể cập nhật HEARTBEAT.md không?

Có — nếu bạn yêu cầu nó làm vậy.

`HEARTBEAT.md` chỉ là một tệp bình thường trong workspace của tác tử, nên bạn có thể bảo tác tử (trong một cuộc trò chuyện bình thường) điều gì đó như:

- "Cập nhật `HEARTBEAT.md` để thêm kiểm tra lịch hằng ngày."
- "Viết lại `HEARTBEAT.md` sao cho ngắn hơn và tập trung vào theo dõi hộp thư đến."

Nếu muốn việc này diễn ra chủ động, bạn cũng có thể đưa một dòng rõ ràng vào prompt Heartbeat của mình như: "Nếu danh sách kiểm tra trở nên lỗi thời, hãy cập nhật HEARTBEAT.md bằng một danh sách tốt hơn."

<Warning>
Đừng đưa bí mật (khóa API, số điện thoại, token riêng tư) vào `HEARTBEAT.md` — nó sẽ trở thành một phần của ngữ cảnh prompt.
</Warning>

## Đánh thức thủ công (theo yêu cầu)

Bạn có thể đưa một sự kiện hệ thống vào hàng đợi và kích hoạt Heartbeat ngay lập tức bằng:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Nếu nhiều tác tử đã cấu hình `heartbeat`, một lần đánh thức thủ công sẽ chạy ngay từng Heartbeat của các tác tử đó.

Dùng `--mode next-heartbeat` để chờ tick đã lên lịch tiếp theo.

## Phân phối lập luận (tùy chọn)

Theo mặc định, Heartbeat chỉ phân phối payload "câu trả lời" cuối cùng.

Nếu muốn minh bạch, hãy bật:

- `agents.defaults.heartbeat.includeReasoning: true`

Khi được bật, Heartbeat cũng sẽ phân phối một tin nhắn riêng có tiền tố `Reasoning:` (cùng dạng với `/reasoning on`). Điều này có thể hữu ích khi tác tử đang quản lý nhiều phiên/codex và bạn muốn xem lý do nó quyết định ping bạn — nhưng nó cũng có thể rò rỉ nhiều chi tiết nội bộ hơn mức bạn muốn. Nên tắt tính năng này trong trò chuyện nhóm.

## Nhận thức chi phí

Heartbeat chạy các lượt tác tử đầy đủ. Khoảng thời gian ngắn hơn tiêu tốn nhiều token hơn. Để giảm chi phí:

- Dùng `isolatedSession: true` để tránh gửi toàn bộ lịch sử hội thoại (~100K token giảm xuống còn ~2-5K mỗi lần chạy).
- Dùng `lightContext: true` để giới hạn các tệp bootstrap chỉ còn `HEARTBEAT.md`.
- Đặt `model` rẻ hơn (ví dụ `ollama/llama3.2:1b`).
- Giữ `HEARTBEAT.md` nhỏ.
- Dùng `target: "none"` nếu bạn chỉ muốn cập nhật trạng thái nội bộ.

## Tràn ngữ cảnh sau Heartbeat

Nếu một Heartbeat dùng mô hình cục bộ nhỏ hơn, ví dụ một mô hình Ollama có cửa sổ 32k, và lượt phiên chính tiếp theo báo tràn ngữ cảnh, hãy kiểm tra xem Heartbeat trước đó có để phiên trên mô hình Heartbeat hay không. Thông báo đặt lại của OpenClaw nêu rõ điều này khi mô hình runtime cuối cùng khớp với `heartbeat.model` đã cấu hình.

Dùng `isolatedSession: true` để chạy Heartbeat trong một phiên mới, kết hợp với `lightContext: true` để có prompt nhỏ nhất, hoặc chọn một mô hình Heartbeat có cửa sổ ngữ cảnh đủ lớn cho phiên dùng chung.

## Liên quan

- [Tự động hóa & Tác vụ](/vi/automation) — toàn bộ cơ chế tự động hóa trong một góc nhìn
- [Tác vụ nền](/vi/automation/tasks) — cách theo dõi công việc tách rời
- [Múi giờ](/vi/concepts/timezone) — cách múi giờ ảnh hưởng đến lịch Heartbeat
- [Khắc phục sự cố](/vi/automation/cron-jobs#troubleshooting) — gỡ lỗi các vấn đề tự động hóa
