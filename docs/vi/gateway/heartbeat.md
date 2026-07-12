---
read_when:
    - Điều chỉnh nhịp Heartbeat hoặc nội dung tin nhắn
    - Lựa chọn giữa Heartbeat và Cron cho các tác vụ được lập lịch
sidebarTitle: Heartbeat
summary: Thông báo thăm dò Heartbeat và quy tắc thông báo
title: Heartbeat
x-i18n:
    generated_at: "2026-07-12T07:54:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc43539cde0bf4e00ee57d510d2188c4e7cc82d67e13b9f86ac5fc37c3c176d2
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat hay cron?** Xem [Tự động hóa](/vi/automation) để biết hướng dẫn về thời điểm nên sử dụng từng loại.
</Note>

Heartbeat chạy **các lượt agent định kỳ** trong phiên chính để mô hình có thể nêu ra mọi nội dung cần chú ý mà không gửi tin nhắn dồn dập cho bạn.

Heartbeat là một lượt phiên chính theo lịch - nó **không** tạo bản ghi [tác vụ nền](/vi/automation/tasks). Bản ghi tác vụ dành cho công việc tách biệt (các lượt chạy ACP, subagent, tác vụ cron cô lập).

Khắc phục sự cố: [Tác vụ theo lịch](/vi/automation/cron-jobs#troubleshooting)

## Bắt đầu nhanh (người mới)

<Steps>
  <Step title="Chọn tần suất">
    Giữ Heartbeat được bật (mặc định là `30m`, hoặc `1h` khi xác thực OAuth/token của Anthropic được cấu hình, bao gồm cả việc tái sử dụng Claude CLI) hoặc đặt tần suất riêng.
  </Step>
  <Step title="Thêm HEARTBEAT.md (không bắt buộc)">
    Tạo một danh sách kiểm tra nhỏ trong `HEARTBEAT.md` hoặc khối `tasks:` trong không gian làm việc của agent.
  </Step>
  <Step title="Quyết định nơi gửi thông báo Heartbeat">
    `target: "none"` là giá trị mặc định; đặt `target: "last"` để định tuyến đến liên hệ gần nhất.
  </Step>
  <Step title="Tinh chỉnh không bắt buộc">
    - Bật gửi nội dung suy luận của Heartbeat để tăng tính minh bạch.
    - Sử dụng ngữ cảnh khởi tạo gọn nhẹ nếu các lượt chạy Heartbeat chỉ cần `HEARTBEAT.md`.
    - Bật phiên cô lập để tránh gửi toàn bộ lịch sử hội thoại trong mỗi Heartbeat.
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
        target: "last", // gửi rõ ràng đến liên hệ gần nhất (mặc định là "none")
        directPolicy: "allow", // mặc định: cho phép đích trực tiếp/DM; đặt "block" để chặn
        lightContext: true, // không bắt buộc: chỉ chèn HEARTBEAT.md từ các tệp khởi tạo
        isolatedSession: true, // không bắt buộc: phiên mới cho mỗi lượt chạy (không có lịch sử hội thoại)
        skipWhenBusy: true, // không bắt buộc: cũng trì hoãn khi subagent hoặc các luồng lồng nhau của agent này đang bận
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // không bắt buộc: cũng gửi thông báo `Thinking` riêng
      },
    },
  },
}
```

## Giá trị mặc định

- Khoảng thời gian: `30m`. Việc áp dụng giá trị mặc định của nhà cung cấp Anthropic sẽ tăng khoảng này lên `1h` khi chế độ xác thực đã phân giải là OAuth/token (bao gồm cả việc tái sử dụng Claude CLI), nhưng chỉ khi chưa đặt `heartbeat.every`. Đặt `agents.defaults.heartbeat.every` hoặc `agents.list[].heartbeat.every` theo từng agent; dùng `0m` để tắt.
- Nội dung lời nhắc (có thể cấu hình qua `agents.defaults.heartbeat.prompt`): `Đọc HEARTBEAT.md nếu tệp tồn tại (ngữ cảnh không gian làm việc). Tuân thủ nghiêm ngặt. Không suy diễn hoặc lặp lại các tác vụ cũ từ những cuộc trò chuyện trước. Nếu không có gì cần chú ý, hãy trả lời HEARTBEAT_OK.`
- Thời gian chờ: các lượt Heartbeat chưa đặt thời gian chờ sẽ sử dụng `agents.defaults.timeoutSeconds` nếu có. Nếu không, chúng sử dụng tần suất Heartbeat với giới hạn tối đa 600 giây. Đặt `agents.defaults.heartbeat.timeoutSeconds` hoặc `agents.list[].heartbeat.timeoutSeconds` theo từng agent cho công việc Heartbeat kéo dài hơn.
- Lời nhắc Heartbeat được gửi **nguyên văn** dưới dạng tin nhắn của người dùng. Lời nhắc hệ thống chỉ bao gồm phần "Heartbeats" khi Heartbeat được bật cho agent mặc định (và `includeSystemPromptSection` không phải là `false`), đồng thời lượt chạy được đánh dấu nội bộ.
- Khi Heartbeat bị tắt bằng `0m`, các lượt chạy thông thường cũng bỏ `HEARTBEAT.md` khỏi ngữ cảnh khởi tạo để mô hình không thấy các hướng dẫn chỉ dành cho Heartbeat.
- Giờ hoạt động (`heartbeat.activeHours`) được kiểm tra theo múi giờ đã cấu hình. Ngoài khoảng thời gian này, Heartbeat sẽ bị bỏ qua cho đến nhịp tiếp theo nằm trong khoảng.
- Heartbeat tự động trì hoãn khi công việc cron đang hoạt động hoặc nằm trong hàng đợi. Đặt `heartbeat.skipWhenBusy: true` để cũng trì hoãn một agent khi subagent gắn với khóa phiên hoặc các luồng lệnh lồng nhau của chính agent đó đang chạy; các agent ngang hàng không còn tạm dừng chỉ vì một agent khác đang có công việc subagent.

## Mục đích của lời nhắc Heartbeat

Lời nhắc mặc định được thiết kế có chủ ý với phạm vi rộng:

- **Tác vụ nền**: "Xem xét các tác vụ còn tồn đọng" thúc đẩy agent xem lại các việc cần theo dõi (hộp thư đến, lịch, lời nhắc, công việc trong hàng đợi) và nêu ra mọi nội dung khẩn cấp.
- **Hỏi thăm con người**: "Thỉnh thoảng hỏi thăm người dùng của bạn vào ban ngày" thúc đẩy một thông báo ngắn gọn kiểu "bạn có cần gì không?" vào những lúc thích hợp, nhưng tránh gửi dồn dập vào ban đêm bằng cách sử dụng múi giờ địa phương đã cấu hình (xem [Múi giờ](/vi/concepts/timezone)).

Heartbeat có thể phản ứng với các [tác vụ nền](/vi/automation/tasks) đã hoàn tất, nhưng bản thân một lượt chạy Heartbeat không tạo bản ghi tác vụ.

Nếu bạn muốn Heartbeat thực hiện một việc thật cụ thể (ví dụ: "kiểm tra số liệu thống kê Gmail PubSub" hoặc "xác minh tình trạng Gateway"), hãy đặt `agents.defaults.heartbeat.prompt` (hoặc `agents.list[].heartbeat.prompt`) thành nội dung tùy chỉnh (được gửi nguyên văn).

## Giao ước phản hồi

- Nếu không có gì cần chú ý, hãy trả lời bằng **`HEARTBEAT_OK`**.
- Thay vào đó, các lượt chạy Heartbeat có thể gọi `heartbeat_respond` với `notify: false` để không hiển thị cập nhật, hoặc `notify: true` cùng `notificationText` để gửi cảnh báo. Khi có, phản hồi công cụ có cấu trúc được ưu tiên hơn văn bản dự phòng.
- Trong các lượt chạy Heartbeat, OpenClaw coi `HEARTBEAT_OK` là xác nhận khi nó xuất hiện ở **đầu hoặc cuối** câu trả lời. Token này bị loại bỏ và câu trả lời bị loại bỏ nếu nội dung còn lại có độ dài **≤ `ackMaxChars`** (mặc định: 300).
- Nếu `HEARTBEAT_OK` xuất hiện ở **giữa** câu trả lời, nó không được xử lý đặc biệt.
- Đối với cảnh báo, **không** đưa `HEARTBEAT_OK` vào; chỉ trả về văn bản cảnh báo.

Ngoài các lượt Heartbeat, `HEARTBEAT_OK` xuất hiện ngoài ý muốn ở đầu/cuối tin nhắn sẽ bị loại bỏ và ghi nhật ký; tin nhắn chỉ chứa `HEARTBEAT_OK` sẽ bị loại bỏ.

## Cấu hình

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // mặc định: 30m (0m để tắt)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // mặc định: false (gửi thông báo Thinking riêng khi có)
        lightContext: false, // mặc định: false; true chỉ giữ HEARTBEAT.md trong các tệp khởi tạo của không gian làm việc
        isolatedSession: false, // mặc định: false; true chạy mỗi Heartbeat trong một phiên mới (không có lịch sử hội thoại)
        skipWhenBusy: false, // mặc định: false; true cũng chờ các luồng subagent/lồng nhau của agent này
        target: "last", // mặc định: none | tùy chọn: last | none | <id kênh> (lõi hoặc plugin, ví dụ "imessage")
        to: "+15551234567", // ghi đè theo kênh, không bắt buộc
        accountId: "ops-bot", // id kênh đa tài khoản, không bắt buộc
        prompt: "Đọc HEARTBEAT.md nếu tệp tồn tại (ngữ cảnh không gian làm việc). Tuân thủ nghiêm ngặt. Không suy diễn hoặc lặp lại các tác vụ cũ từ những cuộc trò chuyện trước. Nếu không có gì cần chú ý, hãy trả lời HEARTBEAT_OK.",
        includeSystemPromptSection: true, // mặc định: true; false bỏ phần lời nhắc hệ thống ## Heartbeats đối với agent mặc định
        ackMaxChars: 300, // số ký tự tối đa được phép sau HEARTBEAT_OK
      },
    },
  },
}
```

### Phạm vi và thứ tự ưu tiên

- `agents.defaults.heartbeat` đặt hành vi Heartbeat toàn cục.
- `agents.list[].heartbeat` được hợp nhất lên trên; nếu bất kỳ agent nào có khối `heartbeat`, **chỉ những agent đó** chạy Heartbeat.
- `channels.defaults.heartbeat` đặt giá trị mặc định về khả năng hiển thị cho tất cả các kênh.
- `channels.<channel>.heartbeat` ghi đè giá trị mặc định của kênh.
- `channels.<channel>.accounts.<id>.heartbeat` (các kênh đa tài khoản) ghi đè thiết lập theo từng kênh.

### Heartbeat theo từng agent

Nếu bất kỳ mục `agents.list[]` nào có khối `heartbeat`, **chỉ những agent đó** chạy Heartbeat. Khối theo từng agent được hợp nhất lên trên `agents.defaults.heartbeat` (vì vậy bạn có thể đặt giá trị mặc định dùng chung một lần rồi ghi đè theo từng agent).

Ví dụ: hai agent, chỉ agent thứ hai chạy Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // gửi rõ ràng đến liên hệ gần nhất (mặc định là "none")
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
          prompt: "Đọc HEARTBEAT.md nếu tệp tồn tại (ngữ cảnh không gian làm việc). Tuân thủ nghiêm ngặt. Không suy diễn hoặc lặp lại các tác vụ cũ từ những cuộc trò chuyện trước. Nếu không có gì cần chú ý, hãy trả lời HEARTBEAT_OK.",
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
        target: "last", // gửi rõ ràng đến liên hệ gần nhất (mặc định là "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // không bắt buộc; dùng userTimezone nếu đã đặt, nếu không thì dùng múi giờ máy chủ
        },
      },
    },
  },
}
```

Ngoài khoảng thời gian này (trước 9 giờ sáng hoặc sau 10 giờ tối theo giờ miền Đông), Heartbeat sẽ bị bỏ qua. Nhịp theo lịch tiếp theo nằm trong khoảng sẽ chạy bình thường.

### Thiết lập 24/7

Nếu bạn muốn Heartbeat chạy cả ngày, hãy sử dụng một trong các mẫu sau:

- Bỏ hoàn toàn `activeHours` (không giới hạn theo khoảng thời gian; đây là hành vi mặc định).
- Đặt khoảng thời gian cả ngày: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Không đặt cùng thời gian `start` và `end` (ví dụ từ `08:00` đến `08:00`). Thiết lập đó được coi là một khoảng có độ rộng bằng không, vì vậy Heartbeat luôn bị bỏ qua.
</Warning>

### Ví dụ đa tài khoản

Sử dụng `accountId` để nhắm đến một tài khoản cụ thể trên các kênh đa tài khoản như Telegram:

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // không bắt buộc: định tuyến đến một chủ đề/luồng cụ thể
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

### Ghi chú về trường

<ParamField path="every" type="string">
  Khoảng thời gian Heartbeat (chuỗi thời lượng; đơn vị mặc định = phút).
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình không bắt buộc cho các lượt chạy Heartbeat (`provider/model`).
</ParamField>
<ParamField path="includeReasoning" type="boolean" default="false">
  Khi được bật, cũng gửi thông báo `Thinking` riêng khi có (cùng dạng với `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Khi là true, các lượt chạy Heartbeat sử dụng ngữ cảnh khởi tạo gọn nhẹ và chỉ giữ `HEARTBEAT.md` trong các tệp khởi tạo của không gian làm việc.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Khi là true, mỗi Heartbeat chạy trong một phiên mới mà không có lịch sử hội thoại trước đó. Sử dụng cùng mẫu cô lập như cron `sessionTarget: "isolated"`. Giảm đáng kể chi phí token cho mỗi Heartbeat. Kết hợp với `lightContext: true` để tiết kiệm tối đa. Việc định tuyến gửi tin vẫn sử dụng ngữ cảnh phiên chính.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Khi là true, các lượt chạy Heartbeat sẽ trì hoãn trên các luồng bận bổ sung của agent đó: subagent gắn với khóa phiên của chính nó hoặc công việc lệnh lồng nhau. Các luồng cron luôn trì hoãn Heartbeat ngay cả khi không có cờ này, để các máy chủ mô hình cục bộ không chạy đồng thời lời nhắc cron và Heartbeat.
</ParamField>
<ParamField path="session" type="string">
  Khóa phiên không bắt buộc cho các lượt chạy Heartbeat.

- `main` (mặc định): phiên chính của agent.
- Khóa phiên cụ thể (sao chép từ `openclaw sessions --json` hoặc [CLI phiên](/vi/cli/sessions)).
- Định dạng khóa phiên: xem [Phiên](/vi/concepts/session) và [Nhóm](/vi/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: gửi đến kênh bên ngoài được sử dụng gần nhất.
- kênh cụ thể: bất kỳ kênh hoặc id plugin nào đã được cấu hình, ví dụ `discord`, `matrix`, `telegram` hoặc `whatsapp`.
- `none` (mặc định): chạy Heartbeat nhưng **không gửi** ra bên ngoài.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Kiểm soát hành vi gửi trực tiếp/DM. `allow`: cho phép gửi Heartbeat trực tiếp/DM. `block`: chặn gửi trực tiếp/DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Ghi đè người nhận tùy chọn (id dành riêng cho kênh, ví dụ: E.164 cho WhatsApp hoặc id cuộc trò chuyện Telegram). Đối với chủ đề/luồng Telegram, hãy dùng `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id tài khoản tùy chọn cho các kênh hỗ trợ nhiều tài khoản. Khi `target: "last"`, id tài khoản áp dụng cho kênh gần nhất được phân giải nếu kênh đó hỗ trợ tài khoản; nếu không, giá trị này bị bỏ qua. Nếu id tài khoản không khớp với tài khoản đã cấu hình cho kênh được phân giải, việc gửi sẽ bị bỏ qua.

</ParamField>
<ParamField path="prompt" type="string">
  Ghi đè nội dung lời nhắc mặc định (không hợp nhất).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Có chèn phần `## Heartbeats` trong lời nhắc hệ thống của tác tử mặc định hay không. Đặt thành `false` để giữ nguyên hành vi Heartbeat khi chạy (nhịp chạy, gửi, HEARTBEAT.md) nhưng loại bỏ hướng dẫn Heartbeat khỏi lời nhắc hệ thống của tác tử.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Số ký tự tối đa được phép xuất hiện sau `HEARTBEAT_OK` trước khi gửi.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Khi là true, ẩn các tải trọng cảnh báo lỗi công cụ trong các lượt chạy Heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Số giây tối đa cho phép đối với một lượt Heartbeat của tác tử trước khi lượt đó bị hủy. Để trống để dùng `agents.defaults.timeoutSeconds` nếu đã đặt; nếu không, dùng nhịp Heartbeat với giới hạn tối đa 600 giây.

</ParamField>
<ParamField path="activeHours" type="object">
  Giới hạn các lượt chạy Heartbeat trong một khoảng thời gian. Đối tượng gồm `start` (HH:MM, bao gồm thời điểm bắt đầu; dùng `00:00` cho đầu ngày), `end` (HH:MM, không bao gồm thời điểm kết thúc; cho phép `24:00` cho cuối ngày) và `timezone` tùy chọn.

- Bỏ qua hoặc `"user"`: dùng `agents.defaults.userTimezone` của bạn nếu đã đặt; nếu không, chuyển sang múi giờ của hệ thống máy chủ.
- `"local"`: luôn dùng múi giờ của hệ thống máy chủ.
- Bất kỳ mã định danh IANA nào (ví dụ: `America/New_York`): được dùng trực tiếp; nếu không hợp lệ, chuyển sang hành vi `"user"` nêu trên.
- `start` và `end` không được bằng nhau đối với một khoảng hoạt động; các giá trị bằng nhau được coi là khoảng có độ rộng bằng không (luôn nằm ngoài khoảng).
- Ngoài khoảng hoạt động, Heartbeat được bỏ qua cho đến nhịp tiếp theo nằm trong khoảng.

</ParamField>

## Hành vi gửi

<AccordionGroup>
  <Accordion title="Định tuyến phiên và đích">
    - Theo mặc định, Heartbeat chạy trong phiên chính của tác tử (`agent:<id>:<mainKey>`), hoặc `global` khi `session.scope = "global"`. Đặt `session` để ghi đè thành một phiên kênh cụ thể (Discord/WhatsApp/v.v.).
    - `session` chỉ ảnh hưởng đến ngữ cảnh chạy; việc gửi được kiểm soát bởi `target` và `to`.
    - Để gửi đến một kênh/người nhận cụ thể, hãy đặt `target` + `to`. Với `target: "last"`, việc gửi dùng kênh bên ngoài gần nhất của phiên đó.
    - Theo mặc định, việc gửi Heartbeat cho phép đích trực tiếp/DM. Đặt `directPolicy: "block"` để chặn gửi đến đích trực tiếp trong khi vẫn chạy lượt Heartbeat.
    - Nếu hàng đợi chính, làn phiên đích, làn Cron hoặc một tác vụ Cron đang hoạt động bị bận, Heartbeat sẽ được bỏ qua và thử lại sau.
    - Nếu `skipWhenBusy: true`, các làn tác tử con gắn với khóa phiên và làn lồng nhau của tác tử này cũng trì hoãn các lượt Heartbeat. Các làn bận của tác tử khác không trì hoãn tác tử này.
    - Nếu `target` không phân giải được đích bên ngoài nào, lượt chạy vẫn diễn ra nhưng không gửi thông báo ra ngoài.

  </Accordion>
  <Accordion title="Khả năng hiển thị và hành vi bỏ qua">
    - Nếu `showOk`, `showAlerts` và `useIndicator` đều bị tắt, lượt chạy sẽ bị bỏ qua ngay từ đầu với `reason=alerts-disabled`.
    - Nếu chỉ tắt việc gửi cảnh báo, OpenClaw vẫn có thể chạy Heartbeat, cập nhật dấu thời gian của tác vụ đến hạn, khôi phục dấu thời gian nhàn rỗi của phiên và ẩn tải trọng cảnh báo gửi ra ngoài.
    - Nếu đích Heartbeat được phân giải hỗ trợ chỉ báo đang nhập, OpenClaw sẽ hiển thị trạng thái đang nhập trong khi lượt Heartbeat đang hoạt động. Tính năng này dùng cùng đích mà Heartbeat sẽ gửi nội dung trò chuyện đến và bị tắt bởi `typingMode: "never"`.

  </Accordion>
  <Accordion title="Vòng đời phiên và kiểm toán">
    - Các phản hồi chỉ dành cho Heartbeat **không** duy trì phiên hoạt động. Siêu dữ liệu Heartbeat có thể cập nhật hàng phiên, nhưng thời điểm hết hạn do nhàn rỗi dùng `lastInteractionAt` từ thông báo thực gần nhất của người dùng/kênh, còn thời điểm hết hạn hằng ngày dùng `sessionStartedAt`.
    - Lịch sử trong giao diện điều khiển và WebChat ẩn các lời nhắc Heartbeat cùng những xác nhận chỉ có OK. Bản ghi phiên bên dưới vẫn có thể chứa các lượt đó để kiểm toán/phát lại.
    - Các [tác vụ nền](/vi/automation/tasks) tách rời có thể xếp một sự kiện hệ thống vào hàng đợi và đánh thức Heartbeat khi phiên chính cần nhanh chóng nhận biết điều gì đó. Việc đánh thức này không biến lượt Heartbeat thành tác vụ nền.

  </Accordion>
</AccordionGroup>

## Điều khiển khả năng hiển thị

Theo mặc định, các xác nhận `HEARTBEAT_OK` bị ẩn trong khi nội dung cảnh báo được gửi. Bạn có thể điều chỉnh theo từng kênh hoặc từng tài khoản:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ẩn HEARTBEAT_OK (mặc định)
      showAlerts: true # Hiển thị thông báo cảnh báo (mặc định)
      useIndicator: true # Phát sự kiện chỉ báo (mặc định)
  telegram:
    heartbeat:
      showOk: true # Hiển thị xác nhận OK trên Telegram
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # Chặn gửi cảnh báo cho tài khoản này
```

Thứ tự ưu tiên: theo tài khoản → theo kênh → giá trị mặc định của kênh → giá trị mặc định tích hợp sẵn.

### Chức năng của từng cờ

- `showOk`: gửi xác nhận `HEARTBEAT_OK` khi mô hình trả về phản hồi chỉ có OK.
- `showAlerts`: gửi nội dung cảnh báo khi mô hình trả về phản hồi không phải OK.
- `useIndicator`: phát các sự kiện chỉ báo cho các bề mặt trạng thái giao diện người dùng.

Nếu **cả ba** đều là false, OpenClaw bỏ qua hoàn toàn lượt Heartbeat (không gọi mô hình).

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
      showOk: true # tất cả tài khoản Slack
    accounts:
      ops:
        heartbeat:
          showAlerts: false # chỉ chặn cảnh báo cho tài khoản ops
  telegram:
    heartbeat:
      showOk: true
```

### Các mẫu phổ biến

| Mục tiêu                                          | Cấu hình                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Hành vi mặc định (ẩn OK, bật cảnh báo)            | _(không cần cấu hình)_                                                                   |
| Hoàn toàn im lặng (không thông báo, không chỉ báo) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Chỉ chỉ báo (không thông báo)                     | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| Chỉ hiển thị OK trong một kênh                    | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (tùy chọn)

Nếu có tệp `HEARTBEAT.md` trong không gian làm việc, lời nhắc mặc định sẽ yêu cầu tác tử đọc tệp đó. Hãy coi đây là "danh sách kiểm tra Heartbeat" của bạn: ngắn gọn, ổn định và an toàn để xem xét mỗi 30 phút.

Trong các lượt chạy thông thường, `HEARTBEAT.md` chỉ được chèn khi hướng dẫn Heartbeat được bật cho tác tử mặc định. Việc tắt nhịp Heartbeat bằng `0m` hoặc đặt `includeSystemPromptSection: false` sẽ loại bỏ tệp này khỏi ngữ cảnh khởi tạo thông thường.

Trên bộ khung Codex gốc, nội dung `HEARTBEAT.md` không được chèn vào lượt như các tệp khởi tạo khác. Nếu tệp tồn tại và có nội dung không chỉ gồm khoảng trắng, một ghi chú về chế độ cộng tác Heartbeat sẽ trỏ Codex đến tệp và yêu cầu đọc tệp trước khi tiếp tục.

Nếu `HEARTBEAT.md` tồn tại nhưng thực tế trống (chỉ có dòng trống, chú thích Markdown/HTML, tiêu đề Markdown như `# Heading`, dấu phân cách khối mã hoặc mục danh sách kiểm tra trống), OpenClaw sẽ bỏ qua lượt Heartbeat để tiết kiệm lượt gọi API. Việc bỏ qua này được báo cáo là `reason=empty-heartbeat-file`. Nếu thiếu tệp, Heartbeat vẫn chạy và mô hình quyết định việc cần làm.

Hãy giữ tệp thật ngắn (danh sách kiểm tra hoặc lời nhắc ngắn) để tránh làm lời nhắc phình to.

Ví dụ về `HEARTBEAT.md`:

```md
# Danh sách kiểm tra Heartbeat

- Xem nhanh: có gì khẩn cấp trong hộp thư đến không?
- Nếu đang là ban ngày và không có gì khác đang chờ xử lý, hãy kiểm tra tình hình ở mức nhẹ.
- Nếu một tác vụ bị chặn, hãy ghi lại _đang thiếu điều gì_ và hỏi Peter vào lần tới.
```

### Các khối `tasks:`

`HEARTBEAT.md` cũng hỗ trợ một khối `tasks:` có cấu trúc nhỏ cho các lượt kiểm tra theo khoảng thời gian ngay trong Heartbeat.

Ví dụ:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Kiểm tra email khẩn cấp chưa đọc và đánh dấu mọi nội dung nhạy cảm về thời gian."
- name: calendar-scan
  interval: 2h
  prompt: "Kiểm tra các cuộc họp sắp tới cần chuẩn bị hoặc theo dõi."

# Hướng dẫn bổ sung

- Giữ cảnh báo ngắn gọn.
- Nếu không có gì cần chú ý sau khi hoàn tất tất cả tác vụ đến hạn, hãy trả lời HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Hành vi">
    - OpenClaw phân tích khối `tasks:` và kiểm tra từng tác vụ theo `interval` riêng.
    - Chỉ các tác vụ **đến hạn** mới được đưa vào lời nhắc Heartbeat cho nhịp đó.
    - Nếu không có tác vụ nào đến hạn, Heartbeat sẽ bị bỏ qua hoàn toàn (`reason=no-tasks-due`) để tránh lãng phí một lượt gọi mô hình.
    - Nội dung không thuộc tác vụ trong `HEARTBEAT.md` được giữ nguyên và nối thêm làm ngữ cảnh bổ sung sau danh sách tác vụ đến hạn.
    - Dấu thời gian chạy gần nhất của tác vụ được lưu trong trạng thái phiên (`heartbeatTaskState`), vì vậy các khoảng thời gian vẫn được duy trì qua những lần khởi động lại thông thường.
    - Dấu thời gian tác vụ chỉ được cập nhật sau khi một lượt Heartbeat hoàn tất luồng phản hồi thông thường. Các lượt bị bỏ qua do `empty-heartbeat-file` / `no-tasks-due` không đánh dấu tác vụ là đã hoàn tất.

  </Accordion>
</AccordionGroup>

Chế độ tác vụ hữu ích khi bạn muốn một tệp Heartbeat chứa nhiều lượt kiểm tra định kỳ mà không phải trả chi phí cho tất cả chúng ở mỗi nhịp.

### Tác tử có thể cập nhật HEARTBEAT.md không?

Có - nếu bạn yêu cầu.

`HEARTBEAT.md` chỉ là một tệp thông thường trong không gian làm việc của tác tử, vì vậy bạn có thể nói với tác tử (trong một cuộc trò chuyện thông thường) nội dung như:

- "Cập nhật `HEARTBEAT.md` để thêm lượt kiểm tra lịch hằng ngày."
- "Viết lại `HEARTBEAT.md` để ngắn gọn hơn và tập trung vào việc theo dõi hộp thư đến."

Nếu muốn việc này diễn ra chủ động, bạn cũng có thể thêm một dòng rõ ràng vào lời nhắc Heartbeat, chẳng hạn: "Nếu danh sách kiểm tra trở nên lỗi thời, hãy cập nhật HEARTBEAT.md bằng một danh sách tốt hơn."

<Warning>
Không đưa thông tin bí mật (khóa API, số điện thoại, token riêng tư) vào `HEARTBEAT.md` - tệp này trở thành một phần của ngữ cảnh lời nhắc.
</Warning>

## Đánh thức thủ công (theo yêu cầu)

Dùng `openclaw system event` để xếp một sự kiện hệ thống vào hàng đợi và tùy chọn kích hoạt Heartbeat ngay lập tức:

```bash
openclaw system event --text "Kiểm tra các việc khẩn cấp cần theo dõi" --mode now
```

| Cờ                           | Mô tả                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--text <text>`              | Văn bản sự kiện hệ thống (bắt buộc).                                                                       |
| `--mode <mode>`              | `now` chạy Heartbeat ngay lập tức; `next-heartbeat` (mặc định) chờ đến nhịp được lên lịch tiếp theo.       |
| `--session-key <sessionKey>` | Nhắm sự kiện đến một phiên cụ thể; mặc định là phiên chính của tác tử.                                     |
| `--json`                     | Xuất JSON.                                                                                                 |

Nếu không cung cấp `--session-key` và nhiều tác tử đã cấu hình `heartbeat`, `--mode now` sẽ chạy ngay Heartbeat của từng tác tử đó.

Các điều khiển Heartbeat liên quan trong cùng nhóm CLI:

```bash
openclaw system heartbeat last     # hiển thị sự kiện Heartbeat gần nhất
openclaw system heartbeat enable   # bật Heartbeat
openclaw system heartbeat disable  # tắt Heartbeat
```

## Gửi nội dung suy luận (tùy chọn)

Theo mặc định, Heartbeat chỉ gửi phần tải trọng "câu trả lời" cuối cùng.

Nếu bạn muốn tính minh bạch, hãy bật:

- `agents.defaults.heartbeat.includeReasoning: true`

Khi được bật, Heartbeat cũng sẽ gửi một thông báo riêng có tiền tố `Thinking` (cùng định dạng với `/reasoning on`). Điều này có thể hữu ích khi tác nhân đang quản lý nhiều phiên/codex và bạn muốn biết lý do tác nhân quyết định nhắn cho bạn — nhưng nó cũng có thể làm lộ nhiều chi tiết nội bộ hơn mong muốn. Nên tắt tính năng này trong các cuộc trò chuyện nhóm.

## Lưu ý về chi phí

Heartbeat chạy toàn bộ lượt của tác nhân. Khoảng thời gian ngắn hơn sẽ tiêu tốn nhiều token hơn. Để giảm chi phí:

- Dùng `isolatedSession: true` để tránh gửi toàn bộ lịch sử hội thoại (giảm từ khoảng 100 nghìn token xuống khoảng 2–5 nghìn token mỗi lần chạy).
- Dùng `lightContext: true` để giới hạn các tệp khởi tạo chỉ còn `HEARTBEAT.md`.
- Đặt `model` có chi phí thấp hơn (ví dụ: `ollama/llama3.2:1b`).
- Giữ `HEARTBEAT.md` ngắn gọn.
- Dùng `target: "none"` nếu bạn chỉ muốn cập nhật trạng thái nội bộ.

## Tràn ngữ cảnh sau Heartbeat

Sau khi lượt chạy hoàn tất, Heartbeat giữ nguyên mô hình thời gian chạy hiện có của phiên dùng chung. Vì vậy, một Heartbeat đã chuyển phiên sang mô hình cục bộ nhỏ hơn (ví dụ: mô hình Ollama có cửa sổ ngữ cảnh 32k) có thể khiến mô hình đó tiếp tục được dùng cho lượt tiếp theo của phiên chính. Nếu lượt tiếp theo báo tràn ngữ cảnh và mô hình thời gian chạy gần nhất của phiên khớp với `heartbeat.model` đã cấu hình, thông báo khôi phục của OpenClaw sẽ chỉ ra rằng việc mô hình Heartbeat ảnh hưởng sang phiên chính có thể là nguyên nhân và đề xuất cách khắc phục.

Để tránh điều này: dùng `isolatedSession: true` để chạy Heartbeat trong một phiên mới (có thể kết hợp với `lightContext: true` để có lời nhắc nhỏ nhất), hoặc chọn mô hình Heartbeat có cửa sổ ngữ cảnh đủ lớn cho phiên dùng chung.

## Liên quan

- [Tự động hóa](/vi/automation) - tổng quan nhanh về tất cả cơ chế tự động hóa
- [Tác vụ nền](/vi/automation/tasks) - cách theo dõi công việc tách rời
- [Múi giờ](/vi/concepts/timezone) - cách múi giờ ảnh hưởng đến lịch Heartbeat
- [Khắc phục sự cố](/vi/automation/cron-jobs#troubleshooting) - gỡ lỗi các vấn đề tự động hóa
