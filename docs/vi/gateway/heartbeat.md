---
read_when:
    - Điều chỉnh tần suất hoặc thông điệp Heartbeat
    - Lựa chọn giữa Heartbeat và Cron cho các tác vụ được lên lịch
sidebarTitle: Heartbeat
summary: Thông báo thăm dò Heartbeat và quy tắc thông báo
title: Heartbeat
x-i18n:
    generated_at: "2026-07-19T05:52:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 84129f3660ca730698dcda2e8ddf04dce909d3e3a4a9823e886eab53be52f61a
    source_path: gateway/heartbeat.md
    workflow: 16
---

<Note>
**Heartbeat hay cron?** Xem [Tự động hóa](/vi/automation) để biết hướng dẫn về thời điểm sử dụng từng loại.
</Note>

Heartbeat chạy **các lượt tác nhân định kỳ** trong phiên chính để mô hình có thể nêu ra mọi nội dung cần chú ý mà không gửi quá nhiều thông báo cho bạn.

Heartbeat là một lượt phiên chính theo lịch - nó **không** tạo bản ghi [tác vụ nền](/vi/automation/tasks). Bản ghi tác vụ dành cho công việc tách biệt (các lượt chạy ACP, tác nhân phụ, tác vụ cron cô lập).

Khắc phục sự cố: [Tác vụ theo lịch](/vi/automation/cron-jobs#troubleshooting)

## Bắt đầu nhanh (người mới)

<Steps>
  <Step title="Chọn nhịp chạy">
    Giữ Heartbeat được bật (mặc định là `30m`, hoặc `1h` khi xác thực OAuth/token của Anthropic được cấu hình, bao gồm cả việc tái sử dụng Claude CLI) hoặc đặt nhịp chạy riêng.
  </Step>
  <Step title="Thêm HEARTBEAT.md (không bắt buộc)">
    Tạo một danh sách kiểm tra `HEARTBEAT.md` ngắn hoặc khối `tasks:` trong không gian làm việc của tác nhân.
  </Step>
  <Step title="Quyết định nơi gửi thông báo Heartbeat">
    `target: "none"` là giá trị mặc định; đặt `target: "last"` để định tuyến đến liên hệ gần nhất.
  </Step>
  <Step title="Tinh chỉnh không bắt buộc">
    - Bật gửi nội dung suy luận của Heartbeat để đảm bảo tính minh bạch.
    - Sử dụng ngữ cảnh khởi tạo gọn nhẹ nếu các lượt chạy Heartbeat chỉ cần `HEARTBEAT.md`.
    - Bật phiên cô lập để tránh gửi toàn bộ lịch sử hội thoại trong mỗi Heartbeat.
    - Giới hạn Heartbeat trong giờ hoạt động (giờ địa phương).

  </Step>
</Steps>

Cấu hình mẫu:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // gửi rõ ràng đến liên hệ gần nhất (mặc định là "none")
        directPolicy: "allow", // mặc định: cho phép đích trực tiếp/DM; đặt thành "block" để chặn
        lightContext: true, // không bắt buộc: chỉ chèn HEARTBEAT.md từ các tệp khởi tạo
        isolatedSession: true, // không bắt buộc: phiên mới cho mỗi lượt chạy (không có lịch sử hội thoại)
        skipWhenBusy: true, // không bắt buộc: cũng trì hoãn khi tác nhân phụ hoặc luồng lồng nhau của tác nhân này đang bận
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // không bắt buộc: cũng gửi thông báo `Thinking` riêng
      },
    },
  },
}
```

## Giá trị mặc định

- Khoảng thời gian: `30m`. Việc áp dụng giá trị mặc định của nhà cung cấp Anthropic sẽ tăng giá trị này lên `1h` khi chế độ xác thực đã phân giải là OAuth/token (bao gồm cả việc tái sử dụng Claude CLI), nhưng chỉ khi `heartbeat.every` chưa được đặt. Đặt `agents.defaults.heartbeat.every` hoặc `agents.list[].heartbeat.every` theo từng tác nhân; dùng `0m` để tắt.
- Nội dung lời nhắc (có thể cấu hình qua `agents.defaults.heartbeat.prompt`): `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- Thời gian chờ: các lượt Heartbeat chưa đặt giá trị sẽ dùng `agents.defaults.timeoutSeconds` khi giá trị này được đặt. Nếu không, chúng dùng nhịp Heartbeat, tối đa 600 giây. Đặt `agents.defaults.heartbeat.timeoutSeconds` hoặc `agents.list[].heartbeat.timeoutSeconds` theo từng tác nhân cho công việc Heartbeat dài hơn.
- Lời nhắc Heartbeat được gửi **nguyên văn** dưới dạng thông báo của người dùng. Lời nhắc hệ thống chỉ bao gồm phần "Heartbeats" khi Heartbeat được bật cho tác nhân mặc định (và `includeSystemPromptSection` không phải là `false`), đồng thời lượt chạy được gắn cờ nội bộ.
- Khi Heartbeat bị tắt bằng `0m`, các lượt chạy thông thường cũng loại `HEARTBEAT.md` khỏi ngữ cảnh khởi tạo để mô hình không thấy các hướng dẫn chỉ dành cho Heartbeat.
- Giờ hoạt động (`heartbeat.activeHours`) được kiểm tra theo múi giờ đã cấu hình. Ngoài khung giờ đó, Heartbeat bị bỏ qua cho đến nhịp tiếp theo nằm trong khung giờ.
- Heartbeat tự động trì hoãn khi công việc cron đang hoạt động hoặc đang xếp hàng. Đặt `heartbeat.skipWhenBusy: true` để cũng trì hoãn một tác nhân khi tác nhân phụ theo khóa phiên hoặc luồng lệnh lồng nhau của chính nó đang chạy; các tác nhân ngang hàng không còn tạm dừng chỉ vì một tác nhân khác đang có công việc tác nhân phụ đang chạy.

## Mục đích của lời nhắc Heartbeat

Lời nhắc mặc định được thiết kế rộng:

- **Tác vụ nền**: "Xem xét các tác vụ chưa hoàn thành" nhắc tác nhân xem lại các việc cần theo dõi (hộp thư đến, lịch, lời nhắc, công việc đang xếp hàng) và nêu ra mọi nội dung khẩn cấp.
- **Hỏi thăm người dùng**: "Thỉnh thoảng hỏi thăm người dùng vào ban ngày" khuyến khích thỉnh thoảng gửi một thông báo ngắn như "bạn có cần gì không?", nhưng tránh gửi quá nhiều vào ban đêm bằng cách sử dụng múi giờ địa phương đã cấu hình (xem [Múi giờ](/vi/concepts/timezone)).

Heartbeat có thể phản ứng với các [tác vụ nền](/vi/automation/tasks) đã hoàn thành, nhưng bản thân một lượt chạy Heartbeat không tạo bản ghi tác vụ.

Nếu muốn Heartbeat thực hiện một việc rất cụ thể (ví dụ: "kiểm tra số liệu thống kê Gmail PubSub" hoặc "xác minh tình trạng Gateway"), hãy đặt `agents.defaults.heartbeat.prompt` (hoặc `agents.list[].heartbeat.prompt`) thành nội dung tùy chỉnh (được gửi nguyên văn).

## Hợp đồng phản hồi

- Nếu không có gì cần chú ý, hãy phản hồi bằng **`HEARTBEAT_OK`**.
- Thay vào đó, lượt chạy Heartbeat có thể gọi `heartbeat_respond` với `notify: false` khi không có cập nhật hiển thị, hoặc `notify: true` cùng `notificationText` để cảnh báo. Khi có, phản hồi công cụ có cấu trúc được ưu tiên hơn văn bản dự phòng.
- Kết quả `heartbeat_respond` có ý nghĩa với `notify: false` vẫn không hiển thị nhưng được ghi nhớ dưới dạng ngữ cảnh nội bộ có giới hạn cho lượt người dùng tiếp theo trong phiên đó. Các xác nhận `no_change` và thông báo hiển thị không được lưu theo cách này.
- Trong lượt chạy Heartbeat, OpenClaw coi `HEARTBEAT_OK` là xác nhận khi nó xuất hiện ở **đầu hoặc cuối** phản hồi. Token bị loại bỏ và phản hồi bị bỏ nếu nội dung còn lại **≤ `ackMaxChars`** (mặc định: 300).
- Nếu `HEARTBEAT_OK` xuất hiện ở **giữa** phản hồi, nó không được xử lý đặc biệt.
- Đối với cảnh báo, **không** bao gồm `HEARTBEAT_OK`; chỉ trả về văn bản cảnh báo.

Ngoài Heartbeat, `HEARTBEAT_OK` không đúng chỗ ở đầu/cuối thông báo sẽ bị loại bỏ và ghi nhật ký; thông báo chỉ chứa `HEARTBEAT_OK` sẽ bị bỏ.

## Cấu hình

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // mặc định: 30m (0m sẽ tắt)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // mặc định: false (gửi thông báo Thinking riêng khi có)
        lightContext: false, // mặc định: false; true chỉ giữ HEARTBEAT.md từ các tệp khởi tạo của không gian làm việc
        isolatedSession: false, // mặc định: false; true chạy mỗi Heartbeat trong một phiên mới (không có lịch sử hội thoại)
        skipWhenBusy: false, // mặc định: false; true cũng chờ các luồng tác nhân phụ/lồng nhau của tác nhân này
        target: "last", // mặc định: none | tùy chọn: last | none | <channel id> (lõi hoặc plugin, ví dụ: "imessage")
        to: "+15551234567", // ghi đè dành riêng cho kênh, không bắt buộc
        accountId: "ops-bot", // mã định danh kênh nhiều tài khoản, không bắt buộc
        prompt: "Đọc HEARTBEAT.md nếu tệp tồn tại (ngữ cảnh không gian làm việc). Tuân thủ nghiêm ngặt. Không suy diễn hoặc lặp lại các tác vụ cũ từ những cuộc trò chuyện trước. Nếu không có gì cần chú ý, hãy phản hồi HEARTBEAT_OK.",
        includeSystemPromptSection: true, // mặc định: true; false loại bỏ phần lời nhắc hệ thống ## Heartbeats cho tác nhân mặc định
        ackMaxChars: 300, // số ký tự tối đa được phép sau HEARTBEAT_OK
      },
    },
  },
}
```

### Phạm vi và thứ tự ưu tiên

- `agents.defaults.heartbeat` đặt hành vi Heartbeat toàn cục.
- `agents.list[].heartbeat` được hợp nhất lên trên; nếu bất kỳ tác nhân nào có khối `heartbeat`, **chỉ những tác nhân đó** chạy Heartbeat.
- `channels.defaults.heartbeat` đặt giá trị mặc định về khả năng hiển thị cho tất cả các kênh.
- `channels.<channel>.heartbeat` ghi đè giá trị mặc định của kênh.
- `channels.<channel>.accounts.<id>.heartbeat` (kênh nhiều tài khoản) ghi đè cài đặt theo từng kênh.

### Heartbeat theo từng tác nhân

Nếu bất kỳ mục `agents.list[]` nào chứa khối `heartbeat`, **chỉ những tác nhân đó** chạy Heartbeat. Khối theo từng tác nhân được hợp nhất lên trên `agents.defaults.heartbeat` (vì vậy có thể đặt các giá trị mặc định dùng chung một lần và ghi đè theo từng tác nhân).

Ví dụ: hai tác nhân, chỉ tác nhân thứ hai chạy Heartbeat.

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
          prompt: "Đọc HEARTBEAT.md nếu tệp tồn tại (ngữ cảnh không gian làm việc). Tuân thủ nghiêm ngặt. Không suy diễn hoặc lặp lại các tác vụ cũ từ những cuộc trò chuyện trước. Nếu không có gì cần chú ý, hãy phản hồi HEARTBEAT_OK.",
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

Ngoài khung giờ này (trước 9 giờ sáng hoặc sau 10 giờ tối theo giờ miền Đông), Heartbeat bị bỏ qua. Nhịp chạy theo lịch tiếp theo trong khung giờ sẽ chạy bình thường.

### Thiết lập 24/7

Nếu muốn Heartbeat chạy cả ngày, hãy sử dụng một trong các mẫu sau:

- Bỏ hoàn toàn `activeHours` (không có giới hạn khung giờ; đây là hành vi mặc định).
- Đặt khung giờ cả ngày: `activeHours: { start: "00:00", end: "24:00" }`.

<Warning>
Không đặt cùng một thời gian cho `start` và `end` (ví dụ: từ `08:00` đến `08:00`). Trường hợp này được coi là khung giờ có độ rộng bằng không, vì vậy Heartbeat luôn bị bỏ qua.
</Warning>

### Ví dụ về nhiều tài khoản

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
  Khi bật, cũng gửi thông báo `Thinking` riêng khi có (cùng cấu trúc với `/reasoning on`).
</ParamField>
<ParamField path="lightContext" type="boolean" default="false">
  Khi là true, các lượt chạy Heartbeat sử dụng ngữ cảnh khởi tạo gọn nhẹ và chỉ giữ `HEARTBEAT.md` từ các tệp khởi tạo của không gian làm việc.
</ParamField>
<ParamField path="isolatedSession" type="boolean" default="false">
  Khi là true, mỗi Heartbeat chạy trong một phiên mới không có lịch sử hội thoại trước đó. Sử dụng cùng mẫu cô lập như cron `sessionTarget: "isolated"`. Giảm đáng kể chi phí token cho mỗi Heartbeat. Kết hợp với `lightContext: true` để tiết kiệm tối đa. Việc định tuyến gửi vẫn sử dụng ngữ cảnh phiên chính.
</ParamField>
<ParamField path="skipWhenBusy" type="boolean" default="false">
  Khi là true, các lượt chạy Heartbeat trì hoãn trên các luồng bận bổ sung của tác nhân đó: tác nhân phụ theo khóa phiên hoặc công việc lệnh lồng nhau của chính nó. Các luồng cron luôn trì hoãn Heartbeat ngay cả khi không có cờ này, để các máy chủ mô hình cục bộ không chạy đồng thời lời nhắc cron và Heartbeat.
</ParamField>
<ParamField path="session" type="string">
  Khóa phiên không bắt buộc cho các lượt chạy Heartbeat.

- `main` (mặc định): phiên chính của tác nhân.
- Khóa phiên rõ ràng (sao chép từ `openclaw sessions --json` hoặc [CLI phiên](/vi/cli/sessions)).
- Định dạng khóa phiên: xem [Phiên](/vi/concepts/session) và [Nhóm](/vi/channels/groups).

</ParamField>
<ParamField path="target" type="string">
- `last`: gửi đến kênh bên ngoài được sử dụng gần nhất.
- kênh cụ thể: bất kỳ kênh hoặc id plugin nào đã được cấu hình, ví dụ `discord`, `matrix`, `telegram` hoặc `whatsapp`.
- `none` (mặc định): chạy heartbeat nhưng **không gửi** ra bên ngoài.

</ParamField>
<ParamField path="directPolicy" type='"allow" | "block"' default="allow">
  Kiểm soát hành vi gửi trực tiếp/DM. `allow`: cho phép gửi heartbeat trực tiếp/qua DM. `block`: chặn gửi trực tiếp/qua DM (`reason=dm-blocked`).

</ParamField>
<ParamField path="to" type="string">
  Tùy chọn ghi đè người nhận (id dành riêng cho kênh, ví dụ E.164 cho WhatsApp hoặc id cuộc trò chuyện Telegram). Đối với chủ đề/luồng Telegram, hãy dùng `<chatId>:topic:<messageThreadId>`.

</ParamField>
<ParamField path="accountId" type="string">
  Id tài khoản tùy chọn cho các kênh nhiều tài khoản. Khi `target: "last"`, id tài khoản áp dụng cho kênh gần nhất đã phân giải nếu kênh đó hỗ trợ tài khoản; nếu không, id này bị bỏ qua. Nếu id tài khoản không khớp với tài khoản đã cấu hình cho kênh được phân giải, việc gửi sẽ bị bỏ qua.

</ParamField>
<ParamField path="prompt" type="string">
  Ghi đè nội dung prompt mặc định (không hợp nhất).

</ParamField>
<ParamField path="includeSystemPromptSection" type="boolean" default="true">
  Xác định có chèn phần system prompt `## Heartbeats` của agent mặc định hay không. Đặt `false` để duy trì hành vi runtime của heartbeat (nhịp chạy, gửi, HEARTBEAT.md) nhưng loại bỏ hướng dẫn heartbeat khỏi system prompt của agent.

</ParamField>
<ParamField path="ackMaxChars" type="number" default="300">
  Số ký tự tối đa được phép sau `HEARTBEAT_OK` trước khi gửi.

</ParamField>
<ParamField path="suppressToolErrorWarnings" type="boolean">
  Khi là true, chặn các payload cảnh báo lỗi công cụ trong khi chạy heartbeat.

</ParamField>
<ParamField path="timeoutSeconds" type="number" default="global timeout or min(every, 600)">
  Số giây tối đa cho phép đối với một lượt agent heartbeat trước khi bị hủy. Để trống để dùng `agents.defaults.timeoutSeconds` khi giá trị này được đặt; nếu không, dùng nhịp heartbeat với giới hạn tối đa 600 giây.

</ParamField>
<ParamField path="activeHours" type="object">
  Giới hạn các lần chạy heartbeat trong một khoảng thời gian. Đối tượng gồm `start` (HH:MM, tính cả thời điểm này; dùng `00:00` cho đầu ngày), `end` (HH:MM, không tính thời điểm này; cho phép `24:00` cho cuối ngày) và `timezone` tùy chọn.

- Nếu bỏ qua hoặc là `"user"`: dùng `agents.defaults.userTimezone` của bạn nếu đã đặt; nếu không, dùng múi giờ của hệ thống máy chủ.
- `"local"`: luôn dùng múi giờ của hệ thống máy chủ.
- Bất kỳ mã định danh IANA nào (ví dụ `America/New_York`): được dùng trực tiếp; nếu không hợp lệ, quay về hành vi `"user"` nêu trên.
- `start` và `end` không được bằng nhau đối với một khoảng hoạt động; các giá trị bằng nhau được coi là khoảng có độ rộng bằng 0 (luôn nằm ngoài khoảng).
- Ngoài khoảng hoạt động, heartbeat bị bỏ qua cho đến nhịp tiếp theo nằm trong khoảng.

</ParamField>

## Hành vi gửi

<AccordionGroup>
  <Accordion title="Định tuyến phiên và đích">
    - Theo mặc định, heartbeat chạy trong phiên chính của agent (`agent:<id>:<mainKey>`), hoặc `global` khi `session.scope = "global"`. Đặt `session` để ghi đè sang một phiên kênh cụ thể (Discord/WhatsApp/v.v.).
    - `session` chỉ ảnh hưởng đến ngữ cảnh chạy; việc gửi được kiểm soát bởi `target` và `to`.
    - Để gửi đến một kênh/người nhận cụ thể, hãy đặt `target` + `to`. Với `target: "last"`, việc gửi dùng kênh bên ngoài gần nhất của phiên đó.
    - Theo mặc định, việc gửi heartbeat cho phép các đích trực tiếp/DM. Đặt `directPolicy: "block"` để chặn gửi đến đích trực tiếp nhưng vẫn chạy lượt heartbeat.
    - Nếu hàng đợi chính, lane phiên đích, lane cron hoặc một tác vụ cron đang hoạt động bị bận, heartbeat sẽ bị bỏ qua và được thử lại sau.
    - Nếu `skipWhenBusy: true`, các lane subagent được định danh theo phiên và lane lồng nhau của agent này cũng trì hoãn việc chạy heartbeat. Các lane đang bận của agent khác không trì hoãn agent này.
    - Nếu `target` không phân giải được đích bên ngoài nào, lượt chạy vẫn diễn ra nhưng không có tin nhắn đi nào được gửi.

  </Accordion>
  <Accordion title="Khả năng hiển thị và hành vi bỏ qua">
    - Nếu `showOk`, `showAlerts` và `useIndicator` đều bị tắt, lượt chạy sẽ bị bỏ qua ngay từ đầu dưới dạng `reason=alerts-disabled`.
    - Nếu chỉ tắt việc gửi cảnh báo, OpenClaw vẫn có thể chạy heartbeat, cập nhật dấu thời gian của các tác vụ đến hạn, khôi phục dấu thời gian phiên chuyển sang trạng thái nhàn rỗi và chặn payload cảnh báo gửi ra ngoài.
    - Nếu đích heartbeat được phân giải hỗ trợ trạng thái đang nhập, OpenClaw sẽ hiển thị trạng thái này trong khi lượt heartbeat đang hoạt động. Tính năng này dùng cùng đích mà heartbeat sẽ gửi đầu ra trò chuyện tới và bị vô hiệu hóa bởi `typingMode: "never"`.

  </Accordion>
  <Accordion title="Vòng đời phiên và kiểm toán">
    - Các phản hồi chỉ dành cho heartbeat **không** duy trì phiên hoạt động. Siêu dữ liệu heartbeat có thể cập nhật hàng của phiên, nhưng thời điểm hết hạn do không hoạt động dùng `lastInteractionAt` từ tin nhắn thực gần nhất của người dùng/kênh, còn thời điểm hết hạn hằng ngày dùng `sessionStartedAt`.
    - Lịch sử trong Control UI và WebChat ẩn các prompt heartbeat và xác nhận chỉ chứa OK. Bản ghi phiên cơ sở vẫn có thể chứa các lượt đó để kiểm toán/phát lại.
    - Các [tác vụ nền](/vi/automation/tasks) tách rời có thể đưa một sự kiện hệ thống vào hàng đợi và đánh thức heartbeat khi phiên chính cần nhanh chóng nhận biết điều gì đó. Việc đánh thức này không biến lượt chạy heartbeat thành tác vụ nền.

  </Accordion>
</AccordionGroup>

## Kiểm soát khả năng hiển thị

Theo mặc định, các xác nhận `HEARTBEAT_OK` bị chặn trong khi nội dung cảnh báo vẫn được gửi. Bạn có thể điều chỉnh theo từng kênh hoặc từng tài khoản:

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # Ẩn HEARTBEAT_OK (mặc định)
      showAlerts: true # Hiển thị tin nhắn cảnh báo (mặc định)
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

- `showOk`: gửi xác nhận `HEARTBEAT_OK` khi mô hình trả về phản hồi chỉ chứa OK.
- `showAlerts`: gửi nội dung cảnh báo khi mô hình trả về phản hồi không phải OK.
- `useIndicator`: phát các sự kiện chỉ báo cho những bề mặt trạng thái UI.

Nếu **cả ba** đều là false, OpenClaw sẽ bỏ qua hoàn toàn lượt chạy heartbeat (không gọi mô hình).

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

### Mẫu phổ biến

| Mục tiêu                                      | Cấu hình                                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Hành vi mặc định (ẩn OK, bật cảnh báo)        | _(không cần cấu hình)_                                                                   |
| Hoàn toàn im lặng (không tin nhắn, không chỉ báo) | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| Chỉ chỉ báo (không có tin nhắn)               | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| Chỉ hiển thị OK trong một kênh                | `channels.telegram.heartbeat: { showOk: true }`                                          |

## HEARTBEAT.md (tùy chọn)

Nếu tệp `HEARTBEAT.md` tồn tại trong workspace, prompt mặc định sẽ yêu cầu agent đọc tệp đó. Hãy xem đây là "danh sách kiểm tra heartbeat" của bạn: ngắn gọn, ổn định và an toàn để xem xét sau mỗi 30 phút.

Trong các lượt chạy thông thường, `HEARTBEAT.md` chỉ được chèn khi hướng dẫn heartbeat được bật cho agent mặc định. Việc vô hiệu hóa nhịp heartbeat bằng `0m` hoặc đặt `includeSystemPromptSection: false` sẽ loại bỏ nó khỏi ngữ cảnh bootstrap thông thường.

Trên harness Codex gốc, nội dung `HEARTBEAT.md` không được chèn vào lượt chạy như các tệp bootstrap khác. Nếu tệp tồn tại và có nội dung không chỉ gồm khoảng trắng, một ghi chú về chế độ cộng tác heartbeat sẽ hướng Codex đến tệp và yêu cầu Codex đọc tệp trước khi tiếp tục.

Nếu `HEARTBEAT.md` tồn tại nhưng thực tế trống (chỉ có dòng trống, chú thích Markdown/HTML, tiêu đề Markdown như `# Heading`, dấu phân cách khối mã hoặc mục danh sách kiểm tra trống), OpenClaw sẽ bỏ qua lượt chạy heartbeat để tiết kiệm lệnh gọi API. Việc bỏ qua đó được báo cáo dưới dạng `reason=empty-heartbeat-file`. Nếu tệp không tồn tại, heartbeat vẫn chạy và mô hình quyết định việc cần làm.

Hãy giữ tệp thật ngắn (danh sách kiểm tra ngắn hoặc lời nhắc) để tránh prompt phình to.

Ví dụ `HEARTBEAT.md`:

```md
# Danh sách kiểm tra heartbeat

- Kiểm tra nhanh: hộp thư đến có gì khẩn cấp không?
- Nếu đang là ban ngày và không còn việc nào khác đang chờ, hãy kiểm tra tình hình một cách nhẹ nhàng.
- Nếu một tác vụ bị chặn, hãy ghi lại _những gì còn thiếu_ và hỏi Peter vào lần tới.
```

### Khối `tasks:`

`HEARTBEAT.md` cũng hỗ trợ một khối `tasks:` có cấu trúc nhỏ cho các lượt kiểm tra theo khoảng thời gian ngay trong heartbeat.

Ví dụ:

```md
tasks:

- name: inbox-triage
  interval: 30m
  prompt: "Kiểm tra email chưa đọc khẩn cấp và đánh dấu bất kỳ nội dung nào nhạy cảm về thời gian."
- name: calendar-scan
  interval: 2h
  prompt: "Kiểm tra các cuộc họp sắp tới cần chuẩn bị hoặc theo dõi."

# Hướng dẫn bổ sung

- Giữ cảnh báo ngắn gọn.
- Nếu không có nội dung nào cần chú ý sau khi hoàn thành tất cả tác vụ đến hạn, hãy trả lời HEARTBEAT_OK.
```

<AccordionGroup>
  <Accordion title="Hành vi">
    - OpenClaw phân tích khối `tasks:` và kiểm tra từng tác vụ theo `interval` riêng của tác vụ đó.
    - Chỉ các tác vụ **đến hạn** mới được đưa vào prompt heartbeat cho nhịp đó.
    - Nếu không có tác vụ nào đến hạn, heartbeat sẽ bị bỏ qua hoàn toàn (`reason=no-tasks-due`) để tránh lãng phí một lệnh gọi mô hình.
    - Nội dung không phải tác vụ trong `HEARTBEAT.md` được giữ nguyên và nối thêm làm ngữ cảnh bổ sung sau danh sách tác vụ đến hạn.
    - Dấu thời gian chạy gần nhất của tác vụ được lưu trong trạng thái phiên (`heartbeatTaskState`), vì vậy các khoảng thời gian vẫn được duy trì sau những lần khởi động lại thông thường.
    - Dấu thời gian của tác vụ chỉ được cập nhật sau khi lượt chạy heartbeat hoàn tất quy trình phản hồi thông thường. Các lượt chạy `empty-heartbeat-file` / `no-tasks-due` bị bỏ qua không đánh dấu tác vụ là đã hoàn thành.

  </Accordion>
</AccordionGroup>

Chế độ tác vụ hữu ích khi bạn muốn một tệp heartbeat chứa nhiều lượt kiểm tra định kỳ mà không phải trả chi phí cho tất cả chúng ở mỗi nhịp.

### Agent có thể cập nhật HEARTBEAT.md không?

Có — nếu bạn yêu cầu.

`HEARTBEAT.md` chỉ là một tệp thông thường trong workspace của agent, vì vậy bạn có thể nói với agent (trong cuộc trò chuyện thông thường) những câu như:

- "Cập nhật `HEARTBEAT.md` để thêm lượt kiểm tra lịch hằng ngày."
- "Viết lại `HEARTBEAT.md` để ngắn gọn hơn và tập trung vào việc theo dõi hộp thư đến."

Nếu muốn việc này diễn ra chủ động, bạn cũng có thể thêm một dòng rõ ràng vào prompt heartbeat, chẳng hạn: "Nếu danh sách kiểm tra trở nên lỗi thời, hãy cập nhật HEARTBEAT.md bằng một danh sách tốt hơn."

<Warning>
Không đưa thông tin bí mật (khóa API, số điện thoại, token riêng tư) vào `HEARTBEAT.md` — nội dung này sẽ trở thành một phần của ngữ cảnh prompt.
</Warning>

## Đánh thức thủ công (theo yêu cầu)

Dùng `openclaw system event` để đưa một sự kiện hệ thống vào hàng đợi và tùy chọn kích hoạt heartbeat ngay lập tức:

```bash
openclaw system event --text "Kiểm tra các nội dung theo dõi khẩn cấp" --mode now
```

| Cờ                           | Mô tả                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `--text <text>`              | Văn bản sự kiện hệ thống (bắt buộc).                                                             |
| `--mode <mode>`              | `now` chạy Heartbeat ngay lập tức; `next-heartbeat` (mặc định) chờ đến nhịp đã lên lịch tiếp theo. |
| `--session-key <sessionKey>` | Nhắm sự kiện đến một phiên cụ thể; mặc định là phiên chính của tác tử.                           |
| `--json`                     | Xuất JSON.                                                                                       |

Nếu không cung cấp `--session-key` và nhiều tác tử đã cấu hình `heartbeat`, `--mode now` sẽ chạy ngay Heartbeat của từng tác tử đó.

Các điều khiển Heartbeat liên quan trong cùng nhóm CLI:

```bash
openclaw system heartbeat last     # hiển thị sự kiện Heartbeat gần nhất
openclaw system heartbeat enable   # bật Heartbeat
openclaw system heartbeat disable  # tắt Heartbeat
```

## Gửi nội dung suy luận (tùy chọn)

Theo mặc định, Heartbeat chỉ gửi tải trọng "câu trả lời" cuối cùng.

Nếu muốn có tính minh bạch, hãy bật:

- `agents.defaults.heartbeat.includeReasoning: true`

Khi được bật, Heartbeat cũng sẽ gửi một thông báo riêng có tiền tố `Thinking` (cùng định dạng với `/reasoning on`). Điều này có thể hữu ích khi tác tử đang quản lý nhiều phiên/codex và bạn muốn biết lý do tác tử quyết định nhắn cho bạn — nhưng cũng có thể làm lộ nhiều chi tiết nội bộ hơn mong muốn. Nên giữ tùy chọn này ở trạng thái tắt trong các cuộc trò chuyện nhóm.

## Lưu ý về chi phí

Heartbeat chạy các lượt tác tử đầy đủ. Khoảng thời gian ngắn hơn tiêu tốn nhiều token hơn. Để giảm chi phí:

- Sử dụng `isolatedSession: true` để tránh gửi toàn bộ lịch sử hội thoại (từ khoảng 100K token xuống còn khoảng 2-5K mỗi lần chạy).
- Sử dụng `lightContext: true` để giới hạn các tệp khởi động chỉ còn `HEARTBEAT.md`.
- Đặt `model` tiết kiệm hơn (ví dụ: `ollama/llama3.2:1b`).
- Giữ `HEARTBEAT.md` ở mức nhỏ.
- Sử dụng `target: "none"` nếu bạn chỉ muốn cập nhật trạng thái nội bộ.

## Tràn ngữ cảnh sau Heartbeat

Heartbeat duy trì mô hình thời gian chạy hiện có của phiên dùng chung sau khi lượt chạy hoàn tất, vì vậy một Heartbeat đã chuyển phiên sang mô hình cục bộ nhỏ hơn (ví dụ: mô hình Ollama có cửa sổ 32k) có thể để mô hình đó tiếp tục được dùng cho lượt tiếp theo của phiên chính. Nếu lượt tiếp theo báo tràn ngữ cảnh và mô hình thời gian chạy gần nhất của phiên khớp với `heartbeat.model` đã cấu hình, thông báo khôi phục của OpenClaw sẽ nêu việc mô hình Heartbeat ảnh hưởng sang phiên chính là nguyên nhân có khả năng xảy ra và đề xuất cách khắc phục.

Để tránh điều này: sử dụng `isolatedSession: true` để chạy Heartbeat trong một phiên mới (có thể kết hợp với `lightContext: true` để có prompt nhỏ nhất), hoặc chọn mô hình Heartbeat có cửa sổ ngữ cảnh đủ lớn cho phiên dùng chung.

## Liên quan

- [Tự động hóa](/vi/automation) - tổng quan nhanh về tất cả cơ chế tự động hóa
- [Tác vụ nền](/vi/automation/tasks) - cách theo dõi công việc chạy tách biệt
- [Múi giờ](/vi/concepts/timezone) - cách múi giờ ảnh hưởng đến lịch Heartbeat
- [Khắc phục sự cố](/vi/automation/cron-jobs#troubleshooting) - gỡ lỗi các vấn đề tự động hóa
