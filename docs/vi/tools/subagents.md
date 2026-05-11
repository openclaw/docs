---
read_when:
    - Bạn muốn thực hiện công việc chạy nền hoặc song song thông qua tác tử
    - Bạn đang thay đổi sessions_spawn hoặc chính sách công cụ tác tử phụ
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên tác nhân phụ gắn với luồng
sidebarTitle: Sub-agents
summary: Khởi chạy các phiên chạy tác tử nền biệt lập để thông báo kết quả trở lại cuộc trò chuyện của người yêu cầu
title: Tác nhân con
x-i18n:
    generated_at: "2026-05-11T20:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

Tác tử con là các lượt chạy tác tử nền được tạo từ một lượt chạy tác tử hiện có.
Chúng chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả của mình trở lại kênh trò chuyện của
bên yêu cầu. Mỗi lượt chạy tác tử con được theo dõi dưới dạng một
[tác vụ nền](/vi/automation/tasks).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn lượt chạy chính.
- Giữ tác tử con được cô lập theo mặc định (tách phiên + tùy chọn sandbox).
- Giữ bề mặt công cụ khó bị dùng sai: tác tử con mặc định **không** nhận công cụ phiên.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu điều phối.

<Note>
**Lưu ý về chi phí:** mỗi tác tử con mặc định có ngữ cảnh và mức sử dụng
token riêng. Với các tác vụ nặng hoặc lặp lại, hãy đặt một model rẻ hơn cho
tác tử con và giữ tác tử chính của bạn dùng model chất lượng cao hơn. Cấu hình
qua `agents.defaults.subagents.model` hoặc ghi đè theo từng tác tử. Khi một tác tử con
    thật sự cần transcript hiện tại của bên yêu cầu, tác tử có thể yêu cầu
    `context: "fork"` trong lần tạo đó. Các phiên tác tử con gắn với luồng mặc định
    dùng `context: "fork"` vì chúng rẽ nhánh cuộc hội thoại hiện tại thành một
    luồng theo dõi.
</Note>

## Lệnh slash

Dùng `/subagents` để kiểm tra hoặc điều khiển các lượt chạy tác tử con cho **phiên
hiện tại**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Dùng [`/steer <message>`](/vi/tools/steer) cấp cao nhất để điều hướng lượt chạy đang hoạt động của phiên yêu cầu hiện tại. Dùng `/subagents steer <id|#> <message>` khi đích là một lượt chạy con.

`/subagents info` hiển thị siêu dữ liệu lượt chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn transcript, dọn dẹp). Dùng `sessions_history` để có chế độ xem nhớ lại có giới hạn,
được lọc an toàn; kiểm tra đường dẫn transcript trên đĩa khi bạn
cần transcript đầy đủ thô.

### Điều khiển liên kết luồng

Các lệnh này hoạt động trên những kênh hỗ trợ liên kết luồng bền vững.
Xem [Kênh hỗ trợ luồng](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi tạo

`/subagents spawn` khởi động một tác tử con nền dưới dạng lệnh của người dùng (không phải
relay nội bộ) và gửi một bản cập nhật hoàn tất cuối cùng trở lại
trò chuyện của bên yêu cầu khi lượt chạy kết thúc.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Lệnh tạo không chặn; nó trả về id lượt chạy ngay lập tức.
    - Khi hoàn tất, tác tử con thông báo một tin nhắn tóm tắt/kết quả trở lại kênh trò chuyện của bên yêu cầu.
    - Các lượt tác tử cần kết quả từ tác tử con nên gọi `sessions_yield` sau khi tạo công việc bắt buộc. Việc đó kết thúc lượt hiện tại và cho phép sự kiện hoàn tất xuất hiện như tin nhắn tiếp theo mà model nhìn thấy.
    - Việc hoàn tất dựa trên push. Sau khi đã tạo, **không** thăm dò `/subagents list`, `sessions_list`, hoặc `sessions_history` trong vòng lặp chỉ để chờ nó kết thúc; chỉ kiểm tra trạng thái theo nhu cầu để gỡ lỗi hoặc can thiệp.
    - Đầu ra của tác tử con là báo cáo/bằng chứng để tác tử yêu cầu tổng hợp. Nó không phải văn bản chỉ dẫn do người dùng viết và không thể ghi đè chính sách hệ thống, nhà phát triển hoặc người dùng.
    - Khi hoàn tất, OpenClaw cố gắng hết mức để đóng các tab/quy trình trình duyệt đã theo dõi được mở bởi phiên tác tử con đó trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw chuyển các hoàn tất trở lại phiên yêu cầu thông qua một lượt `agent` với khóa idempotency ổn định.
    - Nếu lượt chạy của bên yêu cầu vẫn đang hoạt động, trước tiên OpenClaw cố đánh thức/điều hướng lượt chạy đó thay vì bắt đầu một đường trả lời hiển thị thứ hai.
    - Nếu bàn giao hoàn tất cho tác tử yêu cầu thất bại hoặc không tạo đầu ra hiển thị, OpenClaw coi việc gửi là thất bại và chuyển sang định tuyến hàng đợi/thử lại. Nó không gửi thô kết quả của tác tử con trực tiếp đến cuộc trò chuyện bên ngoài.
    - Nếu không thể dùng bàn giao trực tiếp, nó chuyển sang định tuyến hàng đợi.
    - Nếu định tuyến hàng đợi vẫn không khả dụng, thông báo sẽ được thử lại với backoff lũy thừa ngắn trước khi từ bỏ cuối cùng.
    - Việc gửi hoàn tất giữ tuyến bên yêu cầu đã phân giải: các tuyến hoàn tất gắn với luồng hoặc gắn với cuộc hội thoại được ưu tiên khi khả dụng; nếu nguồn hoàn tất chỉ cung cấp một kênh, OpenClaw điền target/account còn thiếu từ tuyến đã phân giải của phiên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để gửi trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Bàn giao hoàn tất cho phiên yêu cầu là ngữ cảnh nội bộ được tạo lúc chạy
    (không phải văn bản do người dùng viết) và bao gồm:

    - `Result` — văn bản trả lời `assistant` hiển thị mới nhất, nếu không thì là văn bản công cụ/toolResult mới nhất đã được làm sạch. Các lượt chạy thất bại ở trạng thái kết thúc không tái sử dụng văn bản trả lời đã ghi lại.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Thống kê runtime/token gọn.
    - Chỉ dẫn gửi yêu cầu tác tử yêu cầu viết lại bằng giọng trợ lý bình thường (không chuyển tiếp siêu dữ liệu nội bộ thô).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` và `--thinking` ghi đè mặc định cho lượt chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - `/subagents spawn` là chế độ một lần (`mode: "run"`). Với các phiên bền vững gắn với luồng, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Với các phiên harness ACP (Claude Code, Gemini CLI, OpenCode, hoặc Codex ACP/acpx tường minh), dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [mô hình gửi ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi hoàn tất hoặc vòng lặp tác tử-với-tác tử. Khi Plugin `codex` được bật, điều khiển trò chuyện/luồng Codex nên ưu tiên `/codex ...` hơn ACP trừ khi người dùng yêu cầu ACP/acpx rõ ràng.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không bị sandbox và một Plugin backend như `acpx` được tải. `runtime: "acp"` kỳ vọng một id harness ACP bên ngoài, hoặc một mục `agents.list[]` với `runtime.type="acp"`; dùng runtime tác tử con mặc định cho các tác tử cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Tác tử con native bắt đầu ở trạng thái cô lập trừ khi caller yêu cầu rõ ràng việc fork
transcript hiện tại.

| Chế độ     | Khi nào dùng                                                                                                                           | Hành vi                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm, hoặc bất cứ việc gì có thể được tóm tắt trong văn bản tác vụ              | Tạo transcript con sạch. Đây là mặc định và giữ mức dùng token thấp hơn.          |
| `fork`     | Công việc phụ thuộc vào cuộc hội thoại hiện tại, kết quả công cụ trước đó, hoặc các chỉ dẫn sắc thái đã có trong transcript bên yêu cầu | Rẽ nhánh transcript của bên yêu cầu vào phiên con trước khi tác tử con bắt đầu. |

Dùng `fork` một cách tiết kiệm. Nó dành cho ủy nhiệm nhạy với ngữ cảnh, không phải
thay thế cho việc viết prompt tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Khởi động một lượt chạy tác tử con với `deliver: false` trên làn `subagent` toàn cục,
sau đó chạy một bước thông báo và đăng trả lời thông báo vào kênh trò chuyện
của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu lực của caller. Các hồ sơ `coding` và
`full` mặc định hiển thị `sessions_spawn`. Hồ sơ `messaging`
thì không; thêm `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hoặc dùng `tools.profile: "coding"` cho các tác tử nên ủy nhiệm
công việc. Chính sách cho kênh/nhóm, provider, sandbox và allow/deny theo từng tác tử vẫn có thể
loại bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ hiệu lực.

**Mặc định:**

- **Model:** kế thừa caller trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng tác tử); `sessions_spawn.model` tường minh vẫn được ưu tiên.
- **Thinking:** kế thừa caller trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng tác tử); `sessions_spawn.thinking` tường minh vẫn được ưu tiên.
- **Thời gian chờ lượt chạy:** nếu bỏ qua `sessions_spawn.runTimeoutSeconds`, OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó quay về `0` (không có thời gian chờ).

### Chế độ prompt ủy nhiệm

`agents.defaults.subagents.delegationMode` chỉ điều khiển hướng dẫn prompt; nó không thay đổi chính sách công cụ hoặc ép buộc ủy nhiệm.

- `suggest` (mặc định): giữ gợi ý prompt tiêu chuẩn để dùng tác tử con cho công việc lớn hơn hoặc chậm hơn.
- `prefer`: yêu cầu tác tử chính duy trì phản hồi nhanh và ủy nhiệm bất cứ việc gì phức tạp hơn một câu trả lời trực tiếp thông qua `sessions_spawn`.

Ghi đè theo từng tác tử dùng `agents.list[].subagents.delegationMode`.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### Tham số công cụ

<ParamField path="task" type="string" required>
  Mô tả tác vụ cho tác nhân phụ.
</ParamField>
<ParamField path="taskName" type="string">
  Định danh ổn định tùy chọn để nhắm mục tiêu bằng `subagents` về sau. Phải khớp `[a-z][a-z0-9_]{0,63}` và không được là các mục tiêu dành riêng như `last` hoặc `all`. Nên dùng khi bộ điều phối có thể cần điều hướng, hủy hoặc nhận diện một tác nhân con cụ thể sau khi sinh nhiều tác nhân con.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn, dễ đọc với con người.
</ParamField>
<ParamField path="agentId" type="string">
  Sinh dưới một id tác nhân khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các harness ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode`, hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ ACP. Tiếp tục một phiên harness ACP hiện có khi `runtime: "acp"`; bị bỏ qua đối với các lần sinh tác nhân phụ gốc.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ ACP. Truyền đầu ra chạy ACP đến phiên cha khi `runtime: "acp"`; bỏ qua đối với các lần sinh tác nhân phụ gốc.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình của tác nhân phụ. Các giá trị không hợp lệ sẽ bị bỏ qua và tác nhân phụ chạy trên mô hình mặc định cùng cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức suy nghĩ cho lần chạy tác nhân phụ.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi được đặt, nếu không là `0`. Khi được đặt, lần chạy tác nhân phụ sẽ bị hủy sau N giây.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu gắn kết luồng kênh cho phiên tác nhân phụ này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại thông qua đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối sinh trừ khi môi trường chạy con mục tiêu chạy trong sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` phân nhánh bản ghi hội thoại hiện tại của bên yêu cầu vào phiên con. Chỉ áp dụng cho tác nhân phụ gốc. Các lần sinh gắn với luồng mặc định là `fork`; các lần sinh không dùng luồng mặc định là `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận các tham số phân phối qua kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Để phân phối, hãy dùng
`message`/`sessions_send` từ lần chạy đã được sinh.
</Warning>

### Tên tác vụ và nhắm mục tiêu

`taskName` là một định danh hướng tới mô hình để điều phối, không phải khóa phiên.
Dùng nó cho các tên con ổn định như `review_subagents`,
`linux_validation`, hoặc `docs_update` khi bộ điều phối có thể cần điều hướng
hoặc hủy tác nhân con đó về sau.

Phân giải mục tiêu chấp nhận các khớp `taskName` chính xác và các tiền tố
không mơ hồ. Việc khớp được giới hạn trong cùng cửa sổ mục tiêu đang hoạt động/gần đây
được dùng bởi các mục tiêu `/subagents` đánh số, vì vậy một tác nhân con đã hoàn thành cũ
không làm cho một định danh được dùng lại trở nên mơ hồ. Nếu hai tác nhân con đang hoạt động
hoặc gần đây có cùng `taskName`, mục tiêu là mơ hồ; hãy dùng chỉ mục danh sách, khóa phiên hoặc
id lần chạy thay thế.

Các mục tiêu dành riêng `last` và `all` không phải là giá trị `taskName` hợp lệ
vì chúng đã có ý nghĩa điều khiển.

## Công cụ: `sessions_yield`

Kết thúc lượt mô hình hiện tại và chờ các sự kiện runtime, chủ yếu là
sự kiện hoàn tất của tác nhân phụ, đến dưới dạng thông điệp tiếp theo. Dùng nó sau khi
sinh công việc con bắt buộc khi bên yêu cầu không thể tạo câu trả lời cuối cùng
cho đến khi các lần hoàn tất đó đến.

`sessions_yield` là primitive chờ. Không thay thế nó bằng các vòng lặp thăm dò
trên `subagents`, `sessions_list`, `sessions_history`, lệnh shell
`sleep`, hoặc thăm dò tiến trình chỉ để phát hiện tác nhân con hoàn tất.

Chỉ dùng `sessions_yield` khi danh sách công cụ hiệu dụng của phiên bao gồm
nó. Một số hồ sơ công cụ tối giản hoặc tùy chỉnh có thể hiển thị `sessions_spawn` và
`subagents` mà không hiển thị `sessions_yield`; trong trường hợp đó, đừng tự tạo
vòng lặp thăm dò chỉ để chờ hoàn tất.

Khi có tác nhân con đang hoạt động, OpenClaw chèn một khối nhắc
`Active Subagents` nhỏ gọn do runtime tạo vào các lượt bình thường để bên yêu cầu có thể thấy
các phiên con hiện tại, id lần chạy, trạng thái, nhãn, tác vụ và
bí danh `taskName` mà không cần thăm dò. Các trường tác vụ và nhãn trong
khối đó được trích dẫn như dữ liệu, không phải chỉ dẫn, vì chúng có thể bắt nguồn
từ các đối số sinh do người dùng/mô hình cung cấp.

## Công cụ: `subagents`

Liệt kê, điều hướng hoặc hủy các lần chạy tác nhân phụ đã sinh thuộc sở hữu của phiên
bên yêu cầu. Nó được giới hạn trong bên yêu cầu hiện tại; một tác nhân con chỉ có thể
xem/kiểm soát các tác nhân con do chính nó kiểm soát.

Dùng `subagents` cho trạng thái theo yêu cầu, gỡ lỗi, điều hướng hoặc hủy.
Dùng `sessions_yield` để chờ các sự kiện hoàn tất.

## Phiên gắn với luồng

Khi gắn kết luồng được bật cho một kênh, tác nhân phụ có thể duy trì gắn kết
với một luồng để các thông điệp tiếp theo của người dùng trong luồng đó tiếp tục được định tuyến đến
cùng phiên tác nhân phụ.

### Các kênh hỗ trợ luồng

**Discord** hiện là kênh duy nhất được hỗ trợ. Kênh này hỗ trợ
các phiên tác nhân phụ gắn luồng bền vững (`sessions_spawn` với
`thread: true`), điều khiển luồng thủ công (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), và các khóa bộ điều hợp
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, và
`channels.discord.threadBindings.spawnSessions`.

### Luồng nhanh

<Steps>
  <Step title="Sinh">
    `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"`).
  </Step>
  <Step title="Gắn kết">
    OpenClaw tạo hoặc gắn kết một luồng với mục tiêu phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Định tuyến phản hồi tiếp theo">
    Các phản hồi và thông điệp tiếp theo trong luồng đó được định tuyến đến phiên đã gắn kết.
  </Step>
  <Step title="Kiểm tra thời gian chờ">
    Dùng `/session idle` để kiểm tra/cập nhật tự động bỏ focus khi không hoạt động và
    `/session max-age` để kiểm soát giới hạn cứng.
  </Step>
  <Step title="Tách">
    Dùng `/unfocus` để tách thủ công.
  </Step>
</Steps>

### Điều khiển thủ công

| Lệnh               | Hiệu ứng                                                              |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Gắn kết luồng hiện tại (hoặc tạo một luồng) với mục tiêu tác nhân phụ/phiên |
| `/unfocus`         | Xóa gắn kết cho luồng đang được gắn kết hiện tại                       |
| `/agents`          | Liệt kê các lần chạy đang hoạt động và trạng thái gắn kết (`thread:<id>` hoặc `unbound`) |
| `/session idle`    | Kiểm tra/cập nhật tự động bỏ focus khi nhàn rỗi (chỉ các luồng đã gắn kết đang được focus) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng đã gắn kết đang được focus) |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Ghi đè kênh và các khóa tự động gắn kết khi sinh** là đặc thù theo bộ điều hợp. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết chi tiết bộ điều hợp hiện tại.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách id tác nhân có thể được nhắm mục tiêu thông qua `agentId` rõ ràng (`["*"]` cho phép bất kỳ id nào). Mặc định: chỉ tác nhân yêu cầu. Nếu bạn đặt danh sách và vẫn muốn bên yêu cầu sinh chính nó bằng `agentId`, hãy bao gồm id bên yêu cầu trong danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép tác nhân mục tiêu mặc định được dùng khi tác nhân yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng). Ghi đè theo từng tác nhân: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Thời gian chờ theo từng lệnh gọi cho các nỗ lực phân phối thông báo `agent` của gateway. Giá trị là số nguyên dương tính bằng mili giây và được kẹp trong mức tối đa bộ hẹn giờ an toàn của nền tảng. Các lần thử lại tạm thời có thể làm tổng thời gian chờ thông báo dài hơn một thời gian chờ đã cấu hình.
</ParamField>

Nếu phiên yêu cầu chạy trong sandbox, `sessions_spawn` từ chối các mục tiêu
sẽ chạy ngoài sandbox.

### Khám phá

Dùng `agents_list` để xem các id tác nhân nào hiện được cho phép cho
`sessions_spawn`. Phản hồi bao gồm mô hình hiệu dụng và siêu dữ liệu môi trường chạy nhúng
của từng tác nhân được liệt kê để bên gọi có thể phân biệt PI, máy chủ ứng dụng Codex
và các môi trường chạy gốc đã cấu hình khác.

### Tự động lưu trữ

- Các phiên tác nhân phụ được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Lưu trữ dùng `sessions.delete` và đổi tên bản ghi hội thoại thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại thông qua đổi tên).
- Tự động lưu trữ là nỗ lực tốt nhất; các bộ hẹn giờ đang chờ sẽ mất nếu Gateway khởi động lại.
- `runTimeoutSeconds` **không** tự động lưu trữ; nó chỉ dừng lần chạy. Phiên vẫn tồn tại cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các tab/tiến trình trình duyệt được theo dõi sẽ được đóng theo cơ chế nỗ lực tốt nhất khi lần chạy kết thúc, ngay cả khi bản ghi hội thoại/bản ghi phiên được giữ lại.

## Tác nhân phụ lồng nhau

Theo mặc định, các tác nhân phụ không thể sinh tác nhân phụ của riêng chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một mức
lồng nhau — **mẫu bộ điều phối**: chính → tác nhân phụ điều phối →
các tác nhân phụ cấp hai thực thi.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Mức độ sâu

| Độ sâu | Hình dạng khóa phiên                         | Vai trò                                      | Có thể sinh?                 |
| ------ | -------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 0      | `agent:<id>:main`                            | Tác nhân chính                               | Luôn luôn                    |
| 1      | `agent:<id>:subagent:<uuid>`                 | Tác nhân phụ (bộ điều phối khi cho phép độ sâu 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Tác nhân phụ cấp hai (worker lá)             | Không bao giờ                |

### Chuỗi thông báo

Kết quả chảy ngược lên chuỗi:

1. Worker độ sâu 2 hoàn tất → thông báo cho cha của nó (bộ điều phối độ sâu 1).
2. Bộ điều phối độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho chính.
3. Tác nhân chính nhận thông báo và gửi đến người dùng.

Mỗi mức chỉ thấy thông báo từ các tác nhân con trực tiếp của nó.

<Note>
**Hướng dẫn vận hành:** khởi chạy công việc con một lần và chờ các sự kiện hoàn tất thay vì xây dựng vòng lặp thăm dò quanh các lệnh ngủ `sessions_list`, `sessions_history`, `/subagents list`, hoặc `exec`.
`sessions_list` và `/subagents list` giữ các quan hệ phiên con tập trung vào công việc đang chạy — các phiên con đang chạy vẫn được gắn kèm, các phiên con đã kết thúc vẫn hiển thị trong một khoảng thời gian gần đây ngắn, và các liên kết con chỉ còn trong kho lưu trữ cũ sẽ bị bỏ qua sau cửa sổ độ mới của chúng. Điều này ngăn metadata `spawnedBy` /
`parentSessionKey` cũ làm sống lại các phiên con ảo sau khi
khởi động lại. Nếu một sự kiện hoàn tất của phiên con đến sau khi bạn đã gửi
câu trả lời cuối cùng, phản hồi tiếp theo đúng là token im lặng chính xác
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được ghi vào metadata phiên tại thời điểm spawn. Điều đó giữ cho các khóa phiên phẳng hoặc được khôi phục không vô tình lấy lại đặc quyền của bộ điều phối.
- **Độ sâu 1 (bộ điều phối, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể quản lý các phiên con của mình. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên nào (hành vi mặc định hiện tại).
- **Độ sâu 2 (worker lá):** không có công cụ phiên nào — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể spawn thêm phiên con.

### Giới hạn spawn cho mỗi tác nhân

Mỗi phiên tác nhân (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) phiên con đang hoạt động tại một thời điểm. Điều này ngăn việc mở rộng fan-out mất kiểm soát
từ một bộ điều phối duy nhất.

### Dừng dây chuyền

Dừng một bộ điều phối độ sâu 1 sẽ tự động dừng tất cả các phiên con độ sâu 2
của nó:

- `/stop` trong cuộc trò chuyện chính dừng tất cả tác nhân độ sâu 1 và lan truyền đến các phiên con độ sâu 2 của chúng.
- `/subagents kill <id>` dừng một tác nhân con cụ thể và lan truyền đến các phiên con của nó.
- `/subagents kill all` dừng tất cả tác nhân con cho bên yêu cầu và lan truyền.

## Xác thực

Xác thực tác nhân con được phân giải theo **id tác nhân**, không theo loại phiên:

- Khóa phiên tác nhân con là `agent:<agentId>:subagent:<uuid>`.
- Kho xác thực được tải từ `agentDir` của tác nhân đó.
- Hồ sơ xác thực của tác nhân chính được hợp nhất làm **dự phòng**; hồ sơ tác nhân ghi đè hồ sơ chính khi có xung đột.

Việc hợp nhất là cộng thêm, nên các hồ sơ chính luôn có sẵn làm
dự phòng. Xác thực cách ly hoàn toàn theo từng tác nhân hiện chưa được hỗ trợ.

## Thông báo

Tác nhân con báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác nhân con (không phải phiên của bên yêu cầu).
- Nếu tác nhân con trả lời chính xác `ANNOUNCE_SKIP`, không có gì được đăng.
- Nếu văn bản trợ lý mới nhất là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo bị chặn ngay cả khi trước đó đã có tiến trình hiển thị.

Cách gửi phụ thuộc vào độ sâu của bên yêu cầu:

- Các phiên yêu cầu cấp cao nhất dùng một lệnh gọi `agent` tiếp theo với gửi bên ngoài (`deliver=true`).
- Các phiên tác nhân con yêu cầu lồng nhau nhận một lần tiêm tiếp theo nội bộ (`deliver=false`) để bộ điều phối có thể tổng hợp kết quả con ngay trong phiên.
- Nếu một phiên tác nhân con yêu cầu lồng nhau không còn tồn tại, OpenClaw quay về bên yêu cầu của phiên đó khi có sẵn.

Đối với các phiên yêu cầu cấp cao nhất, gửi trực tiếp ở chế độ hoàn tất trước tiên
phân giải mọi tuyến cuộc trò chuyện/luồng được ràng buộc và ghi đè hook, rồi điền
các trường channel-target còn thiếu từ tuyến đã lưu của phiên yêu cầu.
Điều đó giữ các phần hoàn tất ở đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn gốc hoàn tất
chỉ xác định channel.

Việc tổng hợp hoàn tất của phiên con được giới hạn trong lần chạy hiện tại của bên yêu cầu khi
xây dựng các phát hiện hoàn tất lồng nhau, ngăn đầu ra phiên con từ lần chạy trước
rò rỉ vào thông báo hiện tại. Các câu trả lời thông báo giữ nguyên
định tuyến luồng/chủ đề khi có sẵn trên bộ điều hợp channel.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường          | Nguồn                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguồn         | `subagent` hoặc `cron`                                                                                          |
| ID phiên    | Khóa/id phiên con                                                                                          |
| Loại           | Loại thông báo + nhãn tác vụ                                                                                    |
| Trạng thái         | Suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`) — **không** suy luận từ văn bản mô hình |
| Nội dung kết quả | Văn bản trợ lý hiển thị mới nhất, nếu không thì là văn bản tool/toolResult mới nhất đã được làm sạch                                |
| Theo dõi      | Chỉ dẫn mô tả khi nào cần trả lời so với giữ im lặng                                                           |

Các lần chạy kết thúc thất bại báo cáo trạng thái thất bại mà không phát lại
văn bản trả lời đã bắt được. Khi hết thời gian, nếu phiên con chỉ đi qua các lệnh gọi công cụ, thông báo
có thể thu gọn lịch sử đó thành một bản tóm tắt tiến trình một phần ngắn thay vì
phát lại đầu ra công cụ thô.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc):

- Runtime (ví dụ `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi giá mô hình được cấu hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, và đường dẫn transcript để tác nhân chính có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Metadata nội bộ chỉ dành cho điều phối; các câu trả lời hướng tới người dùng
nên được viết lại bằng giọng trợ lý bình thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là đường dẫn điều phối an toàn hơn:

- Phần nhớ lại của trợ lý được chuẩn hóa trước: loại bỏ thẻ suy nghĩ; loại bỏ khung `<relevant-memories>` / `<relevant_memories>`; loại bỏ các khối payload XML lệnh gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), bao gồm các payload bị cắt ngắn không bao giờ đóng sạch; loại bỏ khung lệnh gọi/kết quả công cụ bị hạ cấp và các dấu mốc ngữ cảnh lịch sử; loại bỏ token điều khiển mô hình bị rò rỉ (`<|assistant|>`, ASCII khác `<|...|>`, full-width `<｜...｜>`); loại bỏ XML lệnh gọi công cụ MiniMax sai định dạng.
- Văn bản trông giống thông tin đăng nhập/token được biên tập lại.
- Các khối dài có thể bị cắt ngắn.
- Các lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá khổ bằng `[sessions_history omitted: message too large]`.
- Kiểm tra transcript thô trên đĩa là phương án dự phòng khi bạn cần transcript đầy đủ từng byte một.

## Chính sách công cụ

Tác nhân con dùng cùng hồ sơ và pipeline chính sách công cụ như tác nhân cha hoặc
tác nhân đích trước tiên. Sau đó, OpenClaw áp dụng lớp hạn chế
cho tác nhân con.

Khi không có `tools.profile` mang tính hạn chế, tác nhân con nhận **tất cả công cụ ngoại trừ
công cụ phiên** và công cụ hệ thống:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` ở đây cũng vẫn là chế độ xem nhớ lại có giới hạn và đã làm sạch —
không phải bản đổ transcript thô.

Khi `maxSpawnDepth >= 2`, các tác nhân con điều phối độ sâu 1 còn nhận thêm
`sessions_spawn`, `subagents`, `sessions_list`, và
`sessions_history` để có thể quản lý các phiên con của chúng.

### Ghi đè qua cấu hình

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` là bộ lọc allow-only cuối cùng. Nó có thể thu hẹp
tập công cụ đã phân giải, nhưng không thể **thêm lại** một công cụ đã bị loại bỏ
bởi `tools.profile`. Ví dụ, `tools.profile: "coding"` bao gồm
`web_search`/`web_fetch` nhưng không có công cụ `browser`. Để cho phép
tác nhân con dùng hồ sơ coding sử dụng tự động hóa trình duyệt, hãy thêm browser ở
giai đoạn hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Dùng `agents.list[].tools.alsoAllow: ["browser"]` theo từng tác nhân khi chỉ một
tác nhân cần được nhận tự động hóa trình duyệt.

## Đồng thời

Tác nhân con dùng một làn hàng đợi chuyên dụng trong tiến trình:

- **Tên làn:** `subagent`
- **Độ đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Sức sống và khôi phục

OpenClaw không coi việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một
tác nhân con vẫn còn sống. Các lần chạy chưa kết thúc cũ hơn cửa sổ lần chạy cũ
sẽ không còn được tính là đang hoạt động/đang chờ trong `/subagents list`, tóm tắt trạng thái,
cổng hoàn tất hậu duệ, và kiểm tra đồng thời theo phiên.

Sau khi gateway khởi động lại, các lần chạy đã khôi phục nhưng chưa kết thúc và đã cũ sẽ bị cắt bỏ trừ khi
phiên con của chúng được đánh dấu `abortedLastRun: true`. Các
phiên con bị hủy do khởi động lại đó vẫn có thể khôi phục qua luồng khôi phục mồ côi tác nhân con, luồng này gửi một thông điệp tiếp tục tổng hợp trước khi
xóa dấu mốc đã hủy.

Khôi phục tự động sau khởi động lại được giới hạn theo từng phiên con. Nếu cùng một
tác nhân con được chấp nhận để khôi phục mồ côi lặp lại bên trong
cửa sổ rapid re-wedge, OpenClaw lưu một recovery tombstone trên
phiên đó và ngừng tự động tiếp tục nó trong các lần khởi động lại sau. Chạy
`openclaw tasks maintenance --apply` để đối chiếu bản ghi tác vụ, hoặc
`openclaw doctor --fix` để xóa các cờ khôi phục đã hủy cũ trên
các phiên có tombstone.

<Note>
Nếu spawn tác nhân con thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra caller RPC trước khi chỉnh sửa trạng thái ghép nối.
Điều phối nội bộ `sessions_spawn` nên kết nối dưới dạng
`client.id: "gateway-client"` với `client.mode: "backend"` qua xác thực shared-token/password loopback trực tiếp; đường dẫn đó không phụ thuộc vào
baseline phạm vi thiết bị đã ghép nối của CLI. Caller từ xa, `deviceIdentity` tường minh, đường dẫn device-token tường minh, và client trình duyệt/node
vẫn cần phê duyệt thiết bị bình thường cho các nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên yêu cầu và dừng mọi lần chạy tác nhân con đang hoạt động được spawn từ đó, lan truyền đến các phiên con lồng nhau.
- `/subagents kill <id>` dừng một tác nhân con cụ thể và lan truyền đến các phiên con của nó.

## Giới hạn

- Thông báo của tác nhân con là **best-effort**. Nếu gateway khởi động lại, công việc "thông báo lại" đang chờ sẽ bị mất.
- Tác nhân con vẫn chia sẻ cùng tài nguyên tiến trình gateway; hãy coi `maxConcurrent` là van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác nhân con chỉ tiêm `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` và `USER.md` (không có `MEMORY.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`).
- Độ sâu lồng tối đa là 5 (phạm vi `maxSpawnDepth`: 1–5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số phiên con đang hoạt động trên mỗi phiên (mặc định `5`, phạm vi `1–20`).

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
