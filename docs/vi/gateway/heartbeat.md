---
read_when:
    - Điều chỉnh nhịp Heartbeat hoặc nội dung thông báo
    - Quyết định giữa Heartbeat và Cron cho các tác vụ được lên lịch
sidebarTitle: Heartbeat
summary: Thông điệp thăm dò Heartbeat và quy tắc thông báo
title: Heartbeat
x-i18n:
    generated_at: "2026-05-12T23:30:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 247a0fe25ef6e47ec447e6c911ac66af4ab669e15dba886c967250b56e9f1a9c
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat so với cron?** Xem [Tự động hóa](/vi/automation) để được hướng dẫn về thời điểm dùng từng loại.
</Note>

Heartbeat chạy **các lượt tác nhân định kỳ** trong phiên chính để mô hình có thể nêu ra mọi thứ cần chú ý mà không làm phiền bạn liên tục.

Heartbeat là một lượt phiên chính theo lịch — nó **không** tạo bản ghi [tác vụ nền](/vi/automation/tasks). Bản ghi tác vụ dành cho công việc tách rời (lượt chạy ACP, tác nhân con, công việc cron cô lập).

Khắc phục sự cố: [Tác vụ đã lên lịch](/vi/automation/cron-jobs#troubleshooting)

## Bắt đầu nhanh (người mới)

<Steps>
  <Step title="Pick a cadence">
    Để Heartbeat bật (mặc định là `30m`, hoặc `1h` cho xác thực Anthropic OAuth/token, bao gồm cả tái sử dụng Claude CLI) hoặc đặt nhịp riêng của bạn.
  </Step>
  <Step title="Add HEARTBEAT.md (optional)">
    Tạo một danh sách kiểm tra `HEARTBEAT.md` nhỏ hoặc khối `tasks:` trong không gian làm việc của tác nhân.
  </Step>
  <Step title="Decide where heartbeat messages should go">
    `target: "none"` là mặc định; đặt `target: "last"` để định tuyến tới liên hệ gần nhất.
  </Step>
  <Step title="Optional tuning">
    - Bật gửi lập luận Heartbeat để minh bạch.
    - Dùng ngữ cảnh bootstrap gọn nhẹ nếu lượt chạy Heartbeat chỉ cần `HEARTBEAT.md`.
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
        skipWhenBusy: true, // optional: also defer when this agent's subagent or nested lanes are busy
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // optional: send separate `Reasoning:` message too
      },
    },
  },
}
```

## Mặc định

- Khoảng thời gian: `30m` (hoặc `1h` khi chế độ xác thực được phát hiện là Anthropic OAuth/token, bao gồm cả tái sử dụng Claude CLI). Đặt `agents.defaults.heartbeat.every` hoặc `agents.list[].heartbeat.every` theo từng tác nhân; dùng `0m` để tắt.
- Nội dung lời nhắc (cấu hình được qua `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Lời nhắc Heartbeat được gửi **nguyên văn** dưới dạng tin nhắn người dùng. Lời nhắc hệ thống chỉ bao gồm mục "Heartbeat" khi Heartbeat được bật cho tác nhân mặc định, và lượt chạy được đánh dấu nội bộ.
- Khi Heartbeat bị tắt bằng `0m`, các lượt chạy bình thường cũng bỏ qua `HEARTBEAT.md` khỏi ngữ cảnh bootstrap để mô hình không thấy các chỉ dẫn chỉ dành cho Heartbeat.
- Giờ hoạt động (`heartbeat.activeHours`) được kiểm tra theo múi giờ đã cấu hình. Ngoài khung giờ đó, Heartbeat bị bỏ qua cho đến tick tiếp theo nằm trong khung giờ.
- Heartbeat tự động hoãn khi công việc cron đang hoạt động hoặc được xếp hàng. Đặt `heartbeat.skipWhenBusy: true` để cũng hoãn một tác nhân trên các lane lệnh lồng nhau hoặc tác nhân con theo khóa phiên của chính nó; các tác nhân cùng cấp không còn tạm dừng chỉ vì một tác nhân khác đang có công việc tác nhân con đang chạy.

## Lời nhắc Heartbeat dùng để làm gì

Lời nhắc mặc định cố ý có phạm vi rộng:

- **Tác vụ nền**: "Consider outstanding tasks" nhắc tác nhân xem lại các việc cần theo dõi (hộp thư đến, lịch, lời nhắc, công việc được xếp hàng) và nêu ra mọi thứ khẩn cấp.
- **Hỏi thăm con người**: "Checkup sometimes on your human during day time" nhắc thỉnh thoảng gửi một tin nhẹ kiểu "bạn cần gì không?", nhưng tránh làm phiền ban đêm bằng cách dùng múi giờ địa phương đã cấu hình của bạn (xem [Múi giờ](/vi/concepts/timezone)).

Heartbeat có thể phản ứng với [tác vụ nền](/vi/automation/tasks) đã hoàn tất, nhưng bản thân một lượt chạy Heartbeat không tạo bản ghi tác vụ.

Nếu bạn muốn Heartbeat làm một việc rất cụ thể (ví dụ: "kiểm tra thống kê Gmail PubSub" hoặc "xác minh tình trạng Gateway"), hãy đặt `agents.defaults.heartbeat.prompt` (hoặc `agents.list[].heartbeat.prompt`) thành nội dung tùy chỉnh (gửi nguyên văn).

## Hợp đồng phản hồi

- Nếu không có gì cần chú ý, hãy trả lời bằng **`HEARTBEAT_OK`**.
- Các lượt chạy Heartbeat có khả năng dùng công cụ có thể thay vào đó gọi `heartbeat_respond` với `notify: false` để không có cập nhật hiển thị, hoặc `notify: true` cùng `notificationText` để gửi cảnh báo. Khi có, phản hồi công cụ có cấu trúc được ưu tiên hơn phương án văn bản dự phòng.
- Trong các lượt chạy Heartbeat, OpenClaw coi `HEARTBEAT_OK` là xác nhận khi nó xuất hiện ở **đầu hoặc cuối** phản hồi. Token bị loại bỏ và phản hồi bị bỏ nếu nội dung còn lại **≤ `ackMaxChars`** (mặc định: 300).
- Nếu `HEARTBEAT_OK` xuất hiện ở **giữa** phản hồi, nó không được xử lý đặc biệt.
- Với cảnh báo, **không** bao gồm `HEARTBEAT_OK`; chỉ trả về văn bản cảnh báo.

Ngoài Heartbeat, `HEARTBEAT_OK` lạc chỗ ở đầu/cuối tin nhắn sẽ bị loại bỏ và ghi log; tin nhắn chỉ có `HEARTBEAT_OK` sẽ bị bỏ.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        target: "last", // default: none | options: last | none | <channel id> (core or plugin, e.g. "imessage")
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
- `agents.list[].heartbeat` hợp nhất đè lên; nếu bất kỳ tác nhân nào có khối `heartbeat`, **chỉ các tác nhân đó** chạy Heartbeat.
- `channels.defaults.heartbeat` đặt mặc định khả năng hiển thị cho tất cả kênh.
- `channels.<channel>.heartbeat` ghi đè mặc định của kênh.
- `channels.<channel>.accounts.<id>.heartbeat` (kênh nhiều tài khoản) ghi đè thiết lập theo kênh.

### Heartbeat theo từng tác nhân

Nếu bất kỳ mục `agents.list[]` nào bao gồm khối `heartbeat`, **chỉ các tác nhân đó** chạy Heartbeat. Khối theo từng tác nhân hợp nhất đè lên `agents.defaults.heartbeat` (vì vậy bạn có thể đặt mặc định chung một lần và ghi đè theo từng tác nhân).

Ví dụ: hai tác nhân, chỉ tác nhân thứ hai chạy Heartbeat.

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

Giới hạn Heartbeat trong giờ làm việc ở một múi giờ cụ thể:

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

Ngoài khung giờ này (trước 9 giờ sáng hoặc sau 10 giờ tối giờ miền Đông), Heartbeat bị bỏ qua. Tick theo lịch tiếp theo trong khung giờ sẽ chạy bình thường.

### Thiết lập 24/7

Nếu bạn muốn Heartbeat chạy cả ngày, hãy dùng một trong các mẫu này:

- Bỏ hẳn `activeHours` (không giới hạn khung giờ; đây là hành vi mặc định).
- Đặt khung giờ cả ngày: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Đừng đặt cùng thời gian `start` và `end` (ví dụ `08:00` đến `08:00`). Điều đó được coi là khung giờ có độ rộng bằng không, nên Heartbeat luôn bị bỏ qua.
</Warning>

### Ví dụ nhiều tài khoản

Dùng `accountId` để nhắm tới một tài khoản cụ thể trên các kênh nhiều tài khoản như Telegram:

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
  Ghi đè mô hình tùy chọn cho các lượt chạy Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Khi bật, cũng gửi tin nhắn `Reasoning:` riêng khi có sẵn (cùng dạng với `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Khi là true, các lượt chạy Heartbeat dùng ngữ cảnh bootstrap gọn nhẹ và chỉ giữ `HEARTBEAT.md` từ các tệp bootstrap của không gian làm việc.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Khi là true, mỗi Heartbeat chạy trong một phiên mới không có lịch sử hội thoại trước đó. Dùng cùng mẫu cô lập như cron `sessionTarget: "isolated"`. Giảm mạnh chi phí token cho mỗi Heartbeat. Kết hợp với `lightContext: true` để tiết kiệm tối đa. Định tuyến gửi vẫn dùng ngữ cảnh phiên chính.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Khi là true, các lượt chạy Heartbeat hoãn trên các lane bận bổ sung của tác nhân đó: tác nhân con theo khóa phiên của chính nó hoặc công việc lệnh lồng nhau. Các lane cron luôn hoãn Heartbeat, ngay cả khi không có cờ này, để máy chủ mô hình cục bộ không chạy lời nhắc cron và Heartbeat cùng lúc.
</ParamField>
<ParamField path="session" type="string">
  Khóa phiên tùy chọn cho các lượt chạy Heartbeat.

- `main` (mặc định): phiên chính của tác nhân.
- Khóa phiên rõ ràng (sao chép từ `openclaw sessions --json` hoặc [CLI phiên](/vi/cli/sessions)).
- Định dạng khóa phiên: xem [Phiên](/vi/concepts/session) và [Nhóm](/vi/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: gửi tới kênh bên ngoài được dùng gần nhất.
- kênh rõ ràng: bất kỳ kênh hoặc Plugin đã cấu hình nào, ví dụ `discord`, `matrix`, `telegram`, hoặc `whatsapp`.
- `none` (mặc định): chạy Heartbeat nhưng **không gửi** ra bên ngoài.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Kiểm soát hành vi gửi trực tiếp/DM. `allow`: cho phép gửi Heartbeat trực tiếp/DM. `block`: chặn gửi trực tiếp/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Ghi đè người nhận tùy chọn (id theo kênh, ví dụ E.164 cho WhatsApp hoặc id cuộc trò chuyện Telegram). Với chủ đề/luồng Telegram, dùng `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  id tài khoản tùy chọn cho các kênh nhiều tài khoản. Khi `target: "last"`, id tài khoản áp dụng cho kênh gần nhất đã phân giải nếu kênh đó hỗ trợ tài khoản; nếu không thì bị bỏ qua. Nếu id tài khoản không khớp với tài khoản đã cấu hình cho kênh đã phân giải, việc gửi sẽ bị bỏ qua.

</ParamField>
<ParamField path="prompt" type="string">
  Ghi đè phần thân lời nhắc mặc định (không hợp nhất).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Số ký tự tối đa được phép sau `HEARTBEAT_OK` trước khi gửi.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Khi đúng, ẩn các payload cảnh báo lỗi công cụ trong các lần chạy Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Giới hạn các lần chạy Heartbeat vào một khung thời gian. Đối tượng có `start` (HH:MM, bao gồm; dùng `00:00` cho đầu ngày), `end` (HH:MM, không bao gồm; cho phép `24:00` cho cuối ngày), và `timezone` tùy chọn.

- Bỏ qua hoặc `"user"`: dùng `agents.defaults.userTimezone` của bạn nếu được đặt, nếu không thì quay về múi giờ hệ thống máy chủ.
- `"local"`: luôn dùng múi giờ hệ thống máy chủ.
- Bất kỳ định danh IANA nào (ví dụ `America/New_York`): được dùng trực tiếp; nếu không hợp lệ, quay về hành vi `"user"` ở trên.
- `start` và `end` không được bằng nhau đối với một cửa sổ hoạt động; các giá trị bằng nhau được xem là có độ rộng bằng không (luôn nằm ngoài cửa sổ).
- Ngoài cửa sổ hoạt động, Heartbeat bị bỏ qua cho đến tick tiếp theo bên trong cửa sổ.

</ParamField>

## Hành vi gửi

<AccordionGroup>
  <Accordion title="Session and target routing">
    - Theo mặc định, Heartbeat chạy trong phiên chính của agent (`agent:<id>:<mainKey>`), hoặc `global` khi `session.scope = "global"`. Đặt `session` để ghi đè sang một phiên kênh cụ thể (Discord/WhatsApp/v.v.).
    - `session` chỉ ảnh hưởng đến ngữ cảnh chạy; việc gửi được kiểm soát bởi `target` và `to`.
    - Để gửi đến một kênh/người nhận cụ thể, đặt `target` + `to`. Với `target: "last"`, việc gửi dùng kênh bên ngoài gần nhất cho phiên đó.
    - Các lần gửi Heartbeat mặc định cho phép mục tiêu trực tiếp/DM. Đặt `directPolicy: "block"` để chặn gửi đến mục tiêu trực tiếp trong khi vẫn chạy lượt Heartbeat.
    - Nếu hàng đợi chính, lane phiên mục tiêu, lane cron, hoặc một cron job đang hoạt động đang bận, Heartbeat sẽ bị bỏ qua và được thử lại sau.
    - Nếu `skipWhenBusy: true`, subagent theo khóa phiên của agent này và các lane lồng nhau cũng trì hoãn các lần chạy Heartbeat. Các lane bận của agent khác không trì hoãn agent này.
    - Nếu `target` không phân giải được đích bên ngoài nào, lượt chạy vẫn xảy ra nhưng không gửi thông điệp đi.

  </Accordion>
  <Accordion title="Visibility and skip behavior">
    - Nếu `showOk`, `showAlerts`, và `useIndicator` đều bị tắt, lượt chạy bị bỏ qua ngay từ đầu với `reason=alerts-disabled`.
    - Nếu chỉ tắt gửi cảnh báo, OpenClaw vẫn có thể chạy Heartbeat, cập nhật dấu thời gian tác vụ đến hạn, khôi phục dấu thời gian phiên rảnh, và ẩn payload cảnh báo gửi ra ngoài.
    - Nếu mục tiêu Heartbeat đã phân giải hỗ trợ trạng thái đang nhập, OpenClaw hiển thị đang nhập trong khi lượt chạy Heartbeat đang hoạt động. Trạng thái này dùng cùng mục tiêu mà Heartbeat sẽ gửi đầu ra chat đến, và bị tắt bởi `typingMode: "never"`.

  </Accordion>
  <Accordion title="Session lifecycle and audit">
    - Các phản hồi chỉ dành cho Heartbeat **không** giữ phiên hoạt động. Siêu dữ liệu Heartbeat có thể cập nhật hàng phiên, nhưng hết hạn do rảnh dùng `lastInteractionAt` từ thông điệp người dùng/kênh thật gần nhất, và hết hạn hằng ngày dùng `sessionStartedAt`.
    - Giao diện điều khiển và lịch sử WebChat ẩn lời nhắc Heartbeat và xác nhận chỉ OK. Bản ghi phiên nền vẫn có thể chứa các lượt đó để kiểm toán/phát lại.
    - [Tác vụ nền](/vi/automation/tasks) tách rời có thể đưa một sự kiện hệ thống vào hàng đợi và đánh thức Heartbeat khi phiên chính cần nhanh chóng chú ý đến điều gì đó. Lần đánh thức đó không biến lượt chạy Heartbeat thành tác vụ nền.

  </Accordion>
</AccordionGroup>

## Kiểm soát hiển thị

Theo mặc định, các xác nhận `HEARTBEAT_OK` bị ẩn trong khi nội dung cảnh báo được gửi. Bạn có thể điều chỉnh điều này theo từng kênh hoặc từng tài khoản:

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

Độ ưu tiên: theo tài khoản → theo kênh → mặc định kênh → mặc định tích hợp sẵn.

### Mỗi cờ làm gì

- `showOk`: gửi xác nhận `HEARTBEAT_OK` khi mô hình trả về phản hồi chỉ OK.
- `showAlerts`: gửi nội dung cảnh báo khi mô hình trả về phản hồi không phải OK.
- `useIndicator`: phát sự kiện chỉ báo cho các bề mặt trạng thái UI.

Nếu **cả ba** đều false, OpenClaw bỏ qua hoàn toàn lượt chạy Heartbeat (không gọi mô hình).

### Ví dụ theo kênh so với theo tài khoản

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

### Mẫu thường gặp

| Mục tiêu                                 | Cấu hình                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Hành vi mặc định (OK im lặng, có cảnh báo) | _(không cần cấu hình)_                                                                   |
| Hoàn toàn im lặng (không thông điệp, không chỉ báo) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Chỉ chỉ báo (không thông điệp)           | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK chỉ trong một kênh                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (tùy chọn)

Nếu tệp `HEARTBEAT.md` tồn tại trong workspace, lời nhắc mặc định sẽ bảo agent đọc tệp đó. Hãy xem nó như "danh sách kiểm tra Heartbeat" của bạn: nhỏ, ổn định, và an toàn để đưa vào mỗi 30 phút.

Trong các lượt chạy bình thường, `HEARTBEAT.md` chỉ được chèn khi hướng dẫn Heartbeat được bật cho agent mặc định. Tắt nhịp Heartbeat bằng `0m` hoặc đặt `includeSystemPromptSection: false` sẽ bỏ qua nó khỏi ngữ cảnh bootstrap bình thường.

Nếu `HEARTBEAT.md` tồn tại nhưng thực tế trống (chỉ có dòng trống và tiêu đề markdown như `# Heading`), OpenClaw bỏ qua lượt chạy Heartbeat để tiết kiệm lệnh gọi API. Lần bỏ qua đó được báo cáo là `reason=empty-heartbeat-file`. Nếu tệp bị thiếu, Heartbeat vẫn chạy và mô hình quyết định phải làm gì.

Giữ nó thật nhỏ (danh sách kiểm tra hoặc lời nhắc ngắn) để tránh phình to lời nhắc.

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
  <Accordion title="Behavior">
    - OpenClaw phân tích khối `tasks:` và kiểm tra từng tác vụ theo `interval` riêng của nó.
    - Chỉ các tác vụ **đến hạn** được đưa vào lời nhắc Heartbeat cho tick đó.
    - Nếu không có tác vụ nào đến hạn, Heartbeat bị bỏ qua hoàn toàn (`reason=no-tasks-due`) để tránh lãng phí lệnh gọi mô hình.
    - Nội dung không phải tác vụ trong `HEARTBEAT.md` được giữ nguyên và nối thêm làm ngữ cảnh bổ sung sau danh sách tác vụ đến hạn.
    - Dấu thời gian lần chạy gần nhất của tác vụ được lưu trong trạng thái phiên (`heartbeatTaskState`), nên các khoảng thời gian vẫn tồn tại qua các lần khởi động lại bình thường.
    - Dấu thời gian tác vụ chỉ được tăng sau khi một lượt chạy Heartbeat hoàn tất đường dẫn phản hồi bình thường. Các lượt chạy bị bỏ qua `empty-heartbeat-file` / `no-tasks-due` không đánh dấu tác vụ là đã hoàn tất.

  </Accordion>
</AccordionGroup>

Chế độ tác vụ hữu ích khi bạn muốn một tệp Heartbeat chứa nhiều kiểm tra định kỳ mà không phải trả chi phí cho tất cả chúng ở mỗi tick.

### Agent có thể cập nhật HEARTBEAT.md không?

Có — nếu bạn yêu cầu.

`HEARTBEAT.md` chỉ là một tệp bình thường trong workspace của agent, nên bạn có thể bảo agent (trong một cuộc chat bình thường) điều gì đó như:

- "Cập nhật `HEARTBEAT.md` để thêm kiểm tra lịch hằng ngày."
- "Viết lại `HEARTBEAT.md` để nó ngắn hơn và tập trung vào các theo dõi hộp thư đến."

Nếu bạn muốn việc này xảy ra chủ động, bạn cũng có thể đưa một dòng rõ ràng vào lời nhắc Heartbeat, chẳng hạn: "Nếu danh sách kiểm tra trở nên lỗi thời, hãy cập nhật HEARTBEAT.md bằng một danh sách tốt hơn."

<Warning>
Đừng đưa bí mật (khóa API, số điện thoại, token riêng tư) vào `HEARTBEAT.md` — nó sẽ trở thành một phần của ngữ cảnh lời nhắc.
</Warning>

## Đánh thức thủ công (theo yêu cầu)

Bạn có thể đưa một sự kiện hệ thống vào hàng đợi và kích hoạt Heartbeat ngay lập tức bằng:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Nếu nhiều agent có cấu hình `heartbeat`, một lần đánh thức thủ công sẽ chạy ngay từng Heartbeat của các agent đó.

Dùng `--mode next-heartbeat` để chờ tick đã lên lịch tiếp theo.

## Gửi reasoning (tùy chọn)

Theo mặc định, Heartbeat chỉ gửi payload "câu trả lời" cuối cùng.

Nếu bạn muốn minh bạch, hãy bật:

- `agents.defaults.heartbeat.includeReasoning: true`

Khi được bật, Heartbeat cũng sẽ gửi một thông điệp riêng có tiền tố `Reasoning:` (cùng dạng như `/reasoning on`). Điều này có thể hữu ích khi agent đang quản lý nhiều phiên/codex và bạn muốn xem vì sao nó quyết định ping bạn — nhưng nó cũng có thể rò rỉ nhiều chi tiết nội bộ hơn bạn muốn. Nên giữ tắt trong chat nhóm.

## Nhận thức chi phí

Heartbeat chạy đầy đủ các lượt agent. Khoảng thời gian ngắn hơn tiêu tốn nhiều token hơn. Để giảm chi phí:

- Dùng `isolatedSession: true` để tránh gửi toàn bộ lịch sử hội thoại (~100K token xuống còn ~2-5K mỗi lượt chạy).
- Dùng `lightContext: true` để giới hạn tệp bootstrap chỉ còn `HEARTBEAT.md`.
- Đặt một `model` rẻ hơn (ví dụ `ollama/llama3.2:1b`).
- Giữ `HEARTBEAT.md` nhỏ.
- Dùng `target: "none"` nếu bạn chỉ muốn cập nhật trạng thái nội bộ.

## Tràn ngữ cảnh sau Heartbeat

Nếu trước đây một Heartbeat đã để một phiên hiện có trên một mô hình cục bộ nhỏ hơn, ví dụ một mô hình Ollama có cửa sổ 32k, và lượt phiên chính tiếp theo báo tràn ngữ cảnh, hãy đặt lại mô hình runtime của phiên về mô hình chính đã cấu hình. Thông điệp đặt lại của OpenClaw nêu rõ điều này khi mô hình runtime gần nhất khớp với `heartbeat.model` đã cấu hình.

Heartbeat hiện tại giữ nguyên mô hình runtime hiện có của phiên dùng chung sau khi lượt chạy hoàn tất. Bạn vẫn có thể dùng `isolatedSession: true` để chạy Heartbeat trong một phiên mới, kết hợp với `lightContext: true` để có lời nhắc nhỏ nhất, hoặc chọn một mô hình Heartbeat có cửa sổ ngữ cảnh đủ lớn cho phiên dùng chung.

## Liên quan

- [Tự động hóa](/vi/automation) — toàn bộ cơ chế tự động hóa trong một cái nhìn
- [Tác vụ nền](/vi/automation/tasks) — cách theo dõi công việc tách rời
- [Múi giờ](/vi/concepts/timezone) — cách múi giờ ảnh hưởng đến lập lịch Heartbeat
- [Khắc phục sự cố](/vi/automation/cron-jobs#troubleshooting) — gỡ lỗi các vấn đề tự động hóa
