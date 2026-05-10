---
read_when:
    - Điều chỉnh nhịp Heartbeat hoặc thông điệp
    - Lựa chọn giữa Heartbeat và Cron cho các tác vụ đã lên lịch
sidebarTitle: Heartbeat
summary: Thông điệp thăm dò Heartbeat và quy tắc thông báo
title: Heartbeat
x-i18n:
    generated_at: "2026-05-10T19:34:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c4a4076ff4c7a88b47a9bb4daff56b3075173e79409a991ac564ad6ab305a9d
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat và Cron?** Xem [Tự động hóa & tác vụ](/vi/automation) để được hướng dẫn về thời điểm nên dùng từng loại.
</Note>

Heartbeat chạy **các lượt tác tử định kỳ** trong phiên chính để mô hình có thể nêu ra mọi nội dung cần chú ý mà không gửi quá nhiều thông báo cho bạn.

Heartbeat là một lượt theo lịch trong phiên chính — nó **không** tạo bản ghi [tác vụ nền](/vi/automation/tasks). Bản ghi tác vụ dành cho công việc tách rời (lượt chạy ACP, tác tử con, công việc Cron cô lập).

Khắc phục sự cố: [Tác vụ theo lịch](/vi/automation/cron-jobs#troubleshooting)

## Bắt đầu nhanh (người mới)

<Steps>
  <Step title="Chọn nhịp chạy">
    Để Heartbeat bật (mặc định là `30m`, hoặc `1h` cho xác thực OAuth/token của Anthropic, bao gồm cả việc tái sử dụng Claude CLI) hoặc đặt nhịp chạy riêng của bạn.
  </Step>
  <Step title="Thêm HEARTBEAT.md (tùy chọn)">
    Tạo một checklist `HEARTBEAT.md` nhỏ hoặc khối `tasks:` trong không gian làm việc của tác tử.
  </Step>
  <Step title="Quyết định nơi gửi thông điệp Heartbeat">
    `target: "none"` là mặc định; đặt `target: "last"` để định tuyến đến liên hệ gần nhất.
  </Step>
  <Step title="Tinh chỉnh tùy chọn">
    - Bật gửi lập luận của Heartbeat để tăng tính minh bạch.
    - Dùng ngữ cảnh khởi động nhẹ nếu các lượt chạy Heartbeat chỉ cần `HEARTBEAT.md`.
    - Bật phiên cô lập để tránh gửi toàn bộ lịch sử hội thoại ở mỗi Heartbeat.
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

- Khoảng thời gian: `30m` (hoặc `1h` khi chế độ xác thực được phát hiện là xác thực OAuth/token của Anthropic, bao gồm cả việc tái sử dụng Claude CLI). Đặt `agents.defaults.heartbeat.every` hoặc `agents.list[].heartbeat.every` theo từng tác tử; dùng `0m` để tắt.
- Nội dung lời nhắc (cấu hình được qua `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Lời nhắc Heartbeat được gửi **nguyên văn** dưới dạng thông điệp người dùng. Lời nhắc hệ thống chỉ bao gồm phần "Heartbeat" khi Heartbeat được bật cho tác tử mặc định, và lượt chạy được gắn cờ nội bộ.
- Khi Heartbeat bị tắt bằng `0m`, các lượt chạy bình thường cũng bỏ qua `HEARTBEAT.md` khỏi ngữ cảnh khởi động để mô hình không thấy các chỉ dẫn chỉ dành cho Heartbeat.
- Giờ hoạt động (`heartbeat.activeHours`) được kiểm tra theo múi giờ đã cấu hình. Ngoài khung giờ này, Heartbeat được bỏ qua cho đến nhịp tiếp theo nằm trong khung giờ.
- Heartbeat tự động hoãn khi công việc Cron đang hoạt động hoặc đang xếp hàng. Đặt `heartbeat.skipWhenBusy: true` để cũng hoãn trên các luồng bận bổ sung (tác tử con hoặc công việc lệnh lồng nhau); điều này hữu ích cho Ollama cục bộ và các máy chủ một runtime bị giới hạn khác.

## Lời nhắc Heartbeat dùng để làm gì

Lời nhắc mặc định được cố ý thiết kế rộng:

- **Tác vụ nền**: "Consider outstanding tasks" nhắc tác tử xem xét các việc cần theo dõi (hộp thư đến, lịch, lời nhắc, công việc đã xếp hàng) và nêu ra mọi nội dung khẩn cấp.
- **Hỏi thăm con người**: "Checkup sometimes on your human during day time" nhắc thỉnh thoảng gửi thông điệp nhẹ kiểu "bạn có cần gì không?", nhưng tránh gửi quá nhiều vào ban đêm bằng cách dùng múi giờ địa phương đã cấu hình của bạn (xem [Múi giờ](/vi/concepts/timezone)).

Heartbeat có thể phản ứng với [tác vụ nền](/vi/automation/tasks) đã hoàn tất, nhưng bản thân một lượt chạy Heartbeat không tạo bản ghi tác vụ.

Nếu bạn muốn Heartbeat làm việc rất cụ thể (ví dụ: "check Gmail PubSub stats" hoặc "verify gateway health"), đặt `agents.defaults.heartbeat.prompt` (hoặc `agents.list[].heartbeat.prompt`) thành nội dung tùy chỉnh (được gửi nguyên văn).

## Hợp đồng phản hồi

- Nếu không có gì cần chú ý, trả lời bằng **`HEARTBEAT_OK`**.
- Các lượt chạy Heartbeat có khả năng dùng công cụ có thể thay vào đó gọi `heartbeat_respond` với `notify: false` để không có cập nhật hiển thị, hoặc `notify: true` kèm `notificationText` để gửi cảnh báo. Khi có mặt, phản hồi công cụ có cấu trúc được ưu tiên hơn phương án dự phòng bằng văn bản.
- Trong các lượt chạy Heartbeat, OpenClaw xem `HEARTBEAT_OK` là xác nhận khi nó xuất hiện ở **đầu hoặc cuối** câu trả lời. Token này bị loại bỏ và câu trả lời bị bỏ nếu nội dung còn lại **≤ `ackMaxChars`** (mặc định: 300).
- Nếu `HEARTBEAT_OK` xuất hiện ở **giữa** câu trả lời, nó không được xử lý đặc biệt.
- Với cảnh báo, **không** bao gồm `HEARTBEAT_OK`; chỉ trả về văn bản cảnh báo.

Ngoài Heartbeat, `HEARTBEAT_OK` lạc chỗ ở đầu/cuối thông điệp sẽ bị loại bỏ và ghi log; thông điệp chỉ có `HEARTBEAT_OK` sẽ bị bỏ.

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

### Phạm vi và độ ưu tiên

- `agents.defaults.heartbeat` đặt hành vi Heartbeat toàn cục.
- `agents.list[].heartbeat` được hợp nhất lên trên; nếu bất kỳ tác tử nào có khối `heartbeat`, **chỉ những tác tử đó** chạy Heartbeat.
- `channels.defaults.heartbeat` đặt mặc định về khả năng hiển thị cho tất cả các kênh.
- `channels.<channel>.heartbeat` ghi đè mặc định của kênh.
- `channels.<channel>.accounts.<id>.heartbeat` (kênh nhiều tài khoản) ghi đè thiết lập theo kênh.

### Heartbeat theo từng tác tử

Nếu bất kỳ mục `agents.list[]` nào bao gồm một khối `heartbeat`, **chỉ những tác tử đó** chạy Heartbeat. Khối theo từng tác tử được hợp nhất lên trên `agents.defaults.heartbeat` (vì vậy bạn có thể đặt mặc định dùng chung một lần và ghi đè theo từng tác tử).

Ví dụ: hai tác tử, chỉ tác tử thứ hai chạy Heartbeat.

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

Ngoài khoảng thời gian này (trước 9 giờ sáng hoặc sau 10 giờ tối theo giờ miền Đông), Heartbeat sẽ được bỏ qua. Lượt chạy theo lịch tiếp theo nằm trong khoảng thời gian này sẽ chạy bình thường.

### Thiết lập 24/7

Nếu bạn muốn Heartbeat chạy cả ngày, hãy dùng một trong các mẫu sau:

- Bỏ qua hoàn toàn `activeHours` (không có giới hạn khung thời gian; đây là hành vi mặc định).
- Đặt khung thời gian cả ngày: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Không đặt cùng thời gian `start` và `end` (ví dụ từ `08:00` đến `08:00`). Điều đó được xem là một cửa sổ có độ rộng bằng không, vì vậy các Heartbeat luôn bị bỏ qua.
</Warning>

### Ví dụ nhiều tài khoản

Dùng `accountId` để nhắm đến một tài khoản cụ thể trên các kênh nhiều tài khoản như Telegram:

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
  Khi được bật, cũng gửi thông báo `Reasoning:` riêng khi có sẵn (cùng dạng với `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Khi là true, các lượt chạy Heartbeat dùng ngữ cảnh bootstrap nhẹ và chỉ giữ `HEARTBEAT.md` từ các tệp bootstrap của workspace.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Khi là true, mỗi Heartbeat chạy trong một phiên mới không có lịch sử hội thoại trước đó. Dùng cùng mẫu cô lập như Cron `sessionTarget: "isolated"`. Giảm đáng kể chi phí token cho mỗi Heartbeat. Kết hợp với `lightContext: true` để tiết kiệm tối đa. Việc định tuyến gửi vẫn dùng ngữ cảnh phiên chính.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Khi là true, các lượt chạy Heartbeat sẽ trì hoãn trên các làn bận bổ sung: công việc của tác nhân phụ hoặc lệnh lồng nhau. Các làn Cron luôn trì hoãn Heartbeat, ngay cả khi không có cờ này, để máy chủ mô hình cục bộ không chạy lời nhắc Cron và Heartbeat cùng lúc.
</ParamField>
<ParamField path="session" type="string">
  Khóa phiên tùy chọn cho các lượt chạy Heartbeat.

- `main` (mặc định): phiên chính của tác nhân.
- Khóa phiên rõ ràng (sao chép từ `openclaw sessions --json` hoặc [CLI phiên](/vi/cli/sessions)).
- Định dạng khóa phiên: xem [Phiên](/vi/concepts/session) và [Nhóm](/vi/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: gửi đến kênh bên ngoài được dùng gần nhất.
- kênh rõ ràng: bất kỳ kênh hoặc id Plugin nào đã được cấu hình, ví dụ `discord`, `matrix`, `telegram`, hoặc `whatsapp`.
- `none` (mặc định): chạy Heartbeat nhưng **không gửi** ra bên ngoài.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Kiểm soát hành vi gửi trực tiếp/DM. `allow`: cho phép gửi Heartbeat trực tiếp/DM. `block`: chặn gửi trực tiếp/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Ghi đè người nhận tùy chọn (id theo từng kênh, ví dụ E.164 cho WhatsApp hoặc id cuộc trò chuyện Telegram). Đối với chủ đề/luồng Telegram, dùng `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id tài khoản tùy chọn cho các kênh nhiều tài khoản. Khi `target: "last"`, id tài khoản áp dụng cho kênh gần nhất đã phân giải nếu kênh đó hỗ trợ tài khoản; nếu không thì bị bỏ qua. Nếu id tài khoản không khớp với tài khoản đã cấu hình cho kênh đã phân giải, việc gửi sẽ bị bỏ qua.

</ParamField>
<ParamField path="prompt" type="string">
  Ghi đè phần thân lời nhắc mặc định (không hợp nhất).

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Số ký tự tối đa được phép sau `HEARTBEAT_OK` trước khi gửi.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Khi là true, chặn các payload cảnh báo lỗi công cụ trong các lần chạy Heartbeat.

</ParamField>
<ParamField path="activeHours" type="object">
  Giới hạn các lần chạy Heartbeat trong một khung thời gian. Đối tượng có `start` (HH:MM, bao gồm; dùng `00:00` cho đầu ngày), `end` (HH:MM, không bao gồm; cho phép `24:00` cho cuối ngày), và `timezone` tùy chọn.

- Bỏ qua hoặc `"user"`: dùng `agents.defaults.userTimezone` của bạn nếu đã đặt, nếu không thì quay về múi giờ hệ thống máy chủ.
- `"local"`: luôn dùng múi giờ hệ thống máy chủ.
- Bất kỳ định danh IANA nào (ví dụ `America/New_York`): được dùng trực tiếp; nếu không hợp lệ, quay về hành vi `"user"` ở trên.
- `start` và `end` không được bằng nhau đối với một khung hoạt động; các giá trị bằng nhau được xem là độ rộng bằng không (luôn nằm ngoài khung).
- Ngoài khung hoạt động, các heartbeat bị bỏ qua cho đến tick tiếp theo nằm trong khung.

</ParamField>

## Hành vi gửi

<AccordionGroup>
  <Accordion title="Định tuyến phiên và đích">
    - Heartbeat chạy trong phiên chính của tác tử theo mặc định (`agent:<id>:<mainKey>`), hoặc `global` khi `session.scope = "global"`. Đặt `session` để ghi đè sang một phiên kênh cụ thể (Discord/WhatsApp/v.v.).
    - `session` chỉ ảnh hưởng đến ngữ cảnh chạy; việc gửi được kiểm soát bởi `target` và `to`.
    - Để gửi đến một kênh/người nhận cụ thể, đặt `target` + `to`. Với `target: "last"`, việc gửi dùng kênh bên ngoài gần nhất cho phiên đó.
    - Các lần gửi Heartbeat cho phép đích trực tiếp/DM theo mặc định. Đặt `directPolicy: "block"` để chặn gửi tới đích trực tiếp trong khi vẫn chạy lượt Heartbeat.
    - Nếu hàng đợi chính, lane phiên đích, lane cron, hoặc một cron job đang hoạt động bận, Heartbeat sẽ bị bỏ qua và thử lại sau.
    - Nếu `skipWhenBusy: true`, các lane tác tử con và lane lồng nhau cũng hoãn các lần chạy Heartbeat.
    - Nếu `target` không phân giải được đích bên ngoài nào, lượt chạy vẫn diễn ra nhưng không có tin nhắn gửi ra ngoài.

  </Accordion>
  <Accordion title="Khả năng hiển thị và hành vi bỏ qua">
    - Nếu `showOk`, `showAlerts`, và `useIndicator` đều bị tắt, lượt chạy được bỏ qua ngay từ đầu với `reason=alerts-disabled`.
    - Nếu chỉ tắt gửi cảnh báo, OpenClaw vẫn có thể chạy Heartbeat, cập nhật dấu thời gian tác vụ đến hạn, khôi phục dấu thời gian phiên nhàn rỗi, và chặn payload cảnh báo gửi ra ngoài.
    - Nếu đích Heartbeat đã phân giải hỗ trợ trạng thái đang nhập, OpenClaw hiển thị đang nhập trong khi lượt chạy Heartbeat đang hoạt động. Việc này dùng cùng đích mà Heartbeat sẽ gửi đầu ra trò chuyện tới, và bị tắt bởi `typingMode: "never"`.

  </Accordion>
  <Accordion title="Vòng đời phiên và kiểm toán">
    - Các phản hồi chỉ dành cho Heartbeat **không** giữ phiên sống. Siêu dữ liệu Heartbeat có thể cập nhật hàng phiên, nhưng hết hạn nhàn rỗi dùng `lastInteractionAt` từ tin nhắn người dùng/kênh thực gần nhất, và hết hạn hằng ngày dùng `sessionStartedAt`.
    - Lịch sử Control UI và WebChat ẩn các prompt Heartbeat và xác nhận chỉ OK. Bản ghi phiên bên dưới vẫn có thể chứa các lượt đó để kiểm toán/phát lại.
    - [Tác vụ nền](/vi/automation/tasks) tách rời có thể đưa một sự kiện hệ thống vào hàng đợi và đánh thức Heartbeat khi phiên chính cần nhận thấy điều gì đó nhanh chóng. Lần đánh thức đó không biến lượt chạy Heartbeat thành một tác vụ nền.

  </Accordion>
</AccordionGroup>

## Điều khiển khả năng hiển thị

Theo mặc định, các xác nhận `HEARTBEAT_OK` bị chặn trong khi nội dung cảnh báo được gửi. Bạn có thể điều chỉnh việc này theo từng kênh hoặc từng tài khoản:

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

Thứ tự ưu tiên: theo tài khoản → theo kênh → mặc định kênh → mặc định tích hợp sẵn.

### Mỗi cờ làm gì

- `showOk`: gửi xác nhận `HEARTBEAT_OK` khi mô hình trả về phản hồi chỉ OK.
- `showAlerts`: gửi nội dung cảnh báo khi mô hình trả về phản hồi không phải OK.
- `useIndicator`: phát sự kiện chỉ báo cho các bề mặt trạng thái UI.

Nếu **cả ba** đều là false, OpenClaw bỏ qua hoàn toàn lượt chạy Heartbeat (không gọi mô hình).

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

### Mẫu phổ biến

| Mục tiêu                                 | Cấu hình                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Hành vi mặc định (OK im lặng, bật cảnh báo) | _(không cần cấu hình)_                                                                   |
| Hoàn toàn im lặng (không tin nhắn, không chỉ báo) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Chỉ chỉ báo (không tin nhắn)             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| OK chỉ trong một kênh                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (tùy chọn)

Nếu tệp `HEARTBEAT.md` tồn tại trong workspace, prompt mặc định yêu cầu tác tử đọc tệp đó. Hãy xem nó như "danh sách kiểm tra heartbeat" của bạn: nhỏ, ổn định, và an toàn để đưa vào mỗi 30 phút.

Trong các lượt chạy bình thường, `HEARTBEAT.md` chỉ được chèn khi hướng dẫn Heartbeat được bật cho tác tử mặc định. Tắt nhịp Heartbeat bằng `0m` hoặc đặt `includeSystemPromptSection: false` sẽ bỏ qua nó khỏi ngữ cảnh bootstrap bình thường.

Nếu `HEARTBEAT.md` tồn tại nhưng thực tế trống (chỉ có dòng trống và tiêu đề markdown như `# Heading`), OpenClaw bỏ qua lượt chạy Heartbeat để tiết kiệm lệnh gọi API. Lần bỏ qua đó được báo cáo là `reason=empty-heartbeat-file`. Nếu thiếu tệp, Heartbeat vẫn chạy và mô hình quyết định cần làm gì.

Giữ tệp thật nhỏ (danh sách kiểm tra hoặc lời nhắc ngắn) để tránh phình prompt.

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
    - OpenClaw phân tích khối `tasks:` và kiểm tra từng tác vụ theo `interval` riêng của nó.
    - Chỉ các tác vụ **đến hạn** mới được đưa vào prompt Heartbeat cho tick đó.
    - Nếu không có tác vụ nào đến hạn, Heartbeat bị bỏ qua hoàn toàn (`reason=no-tasks-due`) để tránh lãng phí lệnh gọi mô hình.
    - Nội dung không phải tác vụ trong `HEARTBEAT.md` được giữ nguyên và nối thêm làm ngữ cảnh bổ sung sau danh sách tác vụ đến hạn.
    - Dấu thời gian chạy gần nhất của tác vụ được lưu trong trạng thái phiên (`heartbeatTaskState`), nên các khoảng thời gian vẫn tồn tại qua các lần khởi động lại bình thường.
    - Dấu thời gian tác vụ chỉ được tiến lên sau khi một lượt chạy Heartbeat hoàn tất đường phản hồi bình thường. Các lượt chạy `empty-heartbeat-file` / `no-tasks-due` bị bỏ qua không đánh dấu tác vụ là đã hoàn tất.

  </Accordion>
</AccordionGroup>

Chế độ tác vụ hữu ích khi bạn muốn một tệp Heartbeat chứa nhiều kiểm tra định kỳ mà không phải trả chi phí cho tất cả chúng ở mỗi tick.

### Tác tử có thể cập nhật HEARTBEAT.md không?

Có — nếu bạn yêu cầu.

`HEARTBEAT.md` chỉ là một tệp bình thường trong workspace của tác tử, nên bạn có thể nói với tác tử (trong một cuộc trò chuyện bình thường) điều gì đó như:

- "Update `HEARTBEAT.md` to add a daily calendar check."
- "Rewrite `HEARTBEAT.md` so it's shorter and focused on inbox follow-ups."

Nếu muốn việc này diễn ra chủ động, bạn cũng có thể thêm một dòng rõ ràng vào prompt Heartbeat như: "If the checklist becomes stale, update HEARTBEAT.md with a better one."

<Warning>
Đừng đặt bí mật (API key, số điện thoại, token riêng tư) vào `HEARTBEAT.md` — nó sẽ trở thành một phần của ngữ cảnh prompt.
</Warning>

## Đánh thức thủ công (theo yêu cầu)

Bạn có thể đưa một sự kiện hệ thống vào hàng đợi và kích hoạt Heartbeat ngay lập tức bằng:

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

Nếu nhiều tác tử đã cấu hình `heartbeat`, một lần đánh thức thủ công sẽ chạy ngay lập tức từng Heartbeat của các tác tử đó.

Dùng `--mode next-heartbeat` để chờ tick đã lên lịch tiếp theo.

## Gửi suy luận (tùy chọn)

Theo mặc định, Heartbeat chỉ gửi payload "câu trả lời" cuối cùng.

Nếu muốn minh bạch, hãy bật:

- `agents.defaults.heartbeat.includeReasoning: true`

Khi bật, Heartbeat cũng sẽ gửi một tin nhắn riêng có tiền tố `Reasoning:` (cùng dạng với `/reasoning on`). Điều này có thể hữu ích khi tác tử đang quản lý nhiều phiên/codex và bạn muốn thấy lý do nó quyết định ping bạn — nhưng nó cũng có thể rò rỉ nhiều chi tiết nội bộ hơn bạn muốn. Nên giữ tắt trong các cuộc trò chuyện nhóm.

## Nhận thức chi phí

Heartbeat chạy các lượt tác tử đầy đủ. Khoảng thời gian ngắn hơn tiêu tốn nhiều token hơn. Để giảm chi phí:

- Dùng `isolatedSession: true` để tránh gửi toàn bộ lịch sử hội thoại (~100K token xuống còn ~2-5K mỗi lượt chạy).
- Dùng `lightContext: true` để giới hạn tệp bootstrap chỉ còn `HEARTBEAT.md`.
- Đặt một `model` rẻ hơn (ví dụ `ollama/llama3.2:1b`).
- Giữ `HEARTBEAT.md` nhỏ.
- Dùng `target: "none"` nếu bạn chỉ muốn cập nhật trạng thái nội bộ.

## Tràn ngữ cảnh sau Heartbeat

Nếu trước đó một Heartbeat để lại một phiên hiện có trên một mô hình cục bộ nhỏ hơn, ví dụ một mô hình Ollama với cửa sổ 32k, và lượt phiên chính tiếp theo báo tràn ngữ cảnh, hãy đặt lại mô hình runtime của phiên về mô hình chính đã cấu hình. Thông báo đặt lại của OpenClaw nêu rõ điều này khi mô hình runtime gần nhất khớp với `heartbeat.model` đã cấu hình.

Các Heartbeat hiện tại giữ nguyên mô hình runtime hiện có của phiên chia sẻ sau khi lượt chạy hoàn tất. Bạn vẫn có thể dùng `isolatedSession: true` để chạy Heartbeat trong một phiên mới, kết hợp với `lightContext: true` để có prompt nhỏ nhất, hoặc chọn một mô hình Heartbeat có cửa sổ ngữ cảnh đủ lớn cho phiên chia sẻ.

## Liên quan

- [Tự động hóa & Tác vụ](/vi/automation) — tất cả cơ chế tự động hóa trong nháy mắt
- [Tác vụ nền](/vi/automation/tasks) — cách theo dõi công việc tách rời
- [Múi giờ](/vi/concepts/timezone) — cách múi giờ ảnh hưởng đến lịch Heartbeat
- [Khắc phục sự cố](/vi/automation/cron-jobs#troubleshooting) — gỡ lỗi các vấn đề tự động hóa
