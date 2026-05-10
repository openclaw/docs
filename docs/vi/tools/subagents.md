---
read_when:
    - Bạn muốn thực hiện công việc chạy nền hoặc song song thông qua tác tử
    - Bạn đang thay đổi sessions_spawn hoặc chính sách công cụ tác nhân phụ
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên tác tử con được ràng buộc với luồng
sidebarTitle: Sub-agents
summary: Tạo các lượt chạy tác nhân nền cô lập để thông báo kết quả lại vào cuộc trò chuyện của người yêu cầu
title: Tác nhân phụ
x-i18n:
    generated_at: "2026-05-10T19:55:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b4a78b83fda42931ed2a4795e2db611121a30378de149c0478e989029123382
    source_path: tools/subagents.md
    workflow: 16
---

Các tác nhân con là các lượt chạy tác nhân nền được sinh ra từ một lượt chạy tác nhân hiện có.
Chúng chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả trở lại kênh trò chuyện của bên yêu cầu.
Mỗi lượt chạy tác nhân con được theo dõi như một
[tác vụ nền](/vi/automation/tasks).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn lượt chạy chính.
- Giữ tác nhân con được cô lập theo mặc định (tách biệt phiên + sandboxing tùy chọn).
- Giữ bề mặt công cụ khó bị dùng sai: tác nhân con **không** có công cụ phiên theo mặc định.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu điều phối.

<Note>
**Ghi chú chi phí:** mỗi tác nhân con có ngữ cảnh và mức sử dụng token riêng theo
mặc định. Với các tác vụ nặng hoặc lặp lại, hãy đặt mô hình rẻ hơn cho tác nhân con
và giữ tác nhân chính của bạn trên mô hình chất lượng cao hơn. Cấu hình qua
`agents.defaults.subagents.model` hoặc ghi đè theo từng tác nhân. Khi một tác nhân con
    thực sự cần transcript hiện tại của bên yêu cầu, tác nhân có thể yêu cầu
    `context: "fork"` trên lần sinh đó. Các phiên tác nhân con gắn với luồng mặc định
    dùng `context: "fork"` vì chúng rẽ nhánh cuộc trò chuyện hiện tại vào một
    luồng theo dõi.
</Note>

## Lệnh slash

Dùng `/subagents` để kiểm tra hoặc điều khiển các lượt chạy tác nhân con cho **phiên
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

Dùng [`/steer <message>`](/vi/tools/steer) cấp cao nhất để điều hướng lượt chạy đang hoạt động của phiên bên yêu cầu hiện tại. Dùng `/subagents steer <id|#> <message>` khi mục tiêu là một lượt chạy con.

`/subagents info` hiển thị siêu dữ liệu lượt chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn transcript, dọn dẹp). Dùng `sessions_history` để có chế độ xem truy hồi có giới hạn,
đã lọc an toàn; kiểm tra đường dẫn transcript trên đĩa khi bạn
cần transcript thô đầy đủ.

### Điều khiển liên kết luồng

Các lệnh này hoạt động trên những kênh hỗ trợ liên kết luồng bền vững.
Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi sinh

`/subagents spawn` khởi động một tác nhân con nền như một lệnh người dùng (không phải
relay nội bộ) và gửi một cập nhật hoàn tất cuối cùng trở lại cuộc trò chuyện của
bên yêu cầu khi lượt chạy kết thúc.

<AccordionGroup>
  <Accordion title="Hoàn tất dựa trên đẩy, không chặn">
    - Lệnh sinh không chặn; nó trả về id lượt chạy ngay lập tức.
    - Khi hoàn tất, tác nhân con thông báo một thông điệp tóm tắt/kết quả trở lại kênh trò chuyện của bên yêu cầu.
    - Các lượt tác nhân cần kết quả từ tác nhân con nên gọi `sessions_yield` sau khi sinh công việc cần thiết. Việc đó kết thúc lượt hiện tại và cho phép sự kiện hoàn tất đến dưới dạng thông điệp tiếp theo mà mô hình nhìn thấy.
    - Hoàn tất dựa trên cơ chế đẩy. Sau khi đã sinh, **không** thăm dò `/subagents list`, `sessions_list`, hoặc `sessions_history` trong vòng lặp chỉ để chờ nó kết thúc; chỉ kiểm tra trạng thái theo nhu cầu để gỡ lỗi hoặc can thiệp.
    - Đầu ra của tác nhân con là báo cáo/bằng chứng để tác nhân bên yêu cầu tổng hợp. Nó không phải văn bản chỉ dẫn do người dùng viết và không thể ghi đè chính sách hệ thống, nhà phát triển, hoặc người dùng.
    - Khi hoàn tất, OpenClaw cố gắng tối đa đóng các tab/trình duyệt/quy trình được theo dõi do phiên tác nhân con đó mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Khả năng chống lỗi khi phân phối lượt sinh thủ công">
    - OpenClaw chuyển kết quả hoàn tất trở lại phiên bên yêu cầu thông qua một lượt `agent` với khóa bất biến ổn định.
    - Nếu lượt chạy của bên yêu cầu vẫn đang hoạt động, trước tiên OpenClaw cố gắng đánh thức/điều hướng lượt chạy đó thay vì bắt đầu một đường trả lời hiển thị thứ hai.
    - Nếu việc bàn giao hoàn tất cho tác nhân bên yêu cầu thất bại hoặc không tạo ra đầu ra hiển thị, OpenClaw xem việc phân phối là thất bại và chuyển sang định tuyến hàng đợi/thử lại. Nó không gửi thô kết quả của tác nhân con trực tiếp đến cuộc trò chuyện bên ngoài.
    - Nếu không thể dùng bàn giao trực tiếp, nó chuyển sang định tuyến hàng đợi.
    - Nếu định tuyến hàng đợi vẫn không khả dụng, thông báo sẽ được thử lại với backoff lũy thừa ngắn trước khi từ bỏ cuối cùng.
    - Việc phân phối hoàn tất giữ tuyến bên yêu cầu đã phân giải: các tuyến hoàn tất gắn với luồng hoặc gắn với cuộc trò chuyện được ưu tiên khi có sẵn; nếu nguồn gốc hoàn tất chỉ cung cấp kênh, OpenClaw điền mục tiêu/tài khoản còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để phân phối trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Siêu dữ liệu bàn giao hoàn tất">
    Bàn giao hoàn tất cho phiên bên yêu cầu là ngữ cảnh nội bộ được runtime tạo
    (không phải văn bản do người dùng viết) và bao gồm:

    - `Result` — văn bản trả lời `assistant` hiển thị mới nhất, nếu không thì là văn bản công cụ/toolResult mới nhất đã được làm sạch. Các lượt chạy thất bại ở trạng thái cuối không tái sử dụng văn bản trả lời đã chụp.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Thống kê runtime/token gọn.
    - Một chỉ dẫn phân phối yêu cầu tác nhân bên yêu cầu viết lại bằng giọng trợ lý bình thường (không chuyển tiếp siêu dữ liệu nội bộ thô).

  </Accordion>
  <Accordion title="Chế độ và runtime ACP">
    - `--model` và `--thinking` ghi đè mặc định cho lượt chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - `/subagents spawn` là chế độ một lần (`mode: "run"`). Với các phiên bền vững gắn với luồng, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Với các phiên harness ACP (Claude Code, Gemini CLI, OpenCode, hoặc Codex ACP/acpx rõ ràng), dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [mô hình phân phối ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi hoàn tất hoặc vòng lặp tác nhân-với-tác nhân. Khi Plugin `codex` được bật, điều khiển chat/luồng Codex nên ưu tiên `/codex ...` thay vì ACP trừ khi người dùng yêu cầu rõ ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không bị sandbox, và một Plugin backend như `acpx` đã được tải. `runtime: "acp"` kỳ vọng một id harness ACP bên ngoài, hoặc một mục `agents.list[]` với `runtime.type="acp"`; dùng runtime tác nhân con mặc định cho các tác nhân cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Các tác nhân con native bắt đầu ở trạng thái cô lập trừ khi bên gọi yêu cầu rõ việc fork
transcript hiện tại.

| Chế độ       | Khi nào dùng                                                                                                                         | Hành vi                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm, hoặc bất cứ việc gì có thể được tóm tắt trong văn bản tác vụ                           | Tạo một transcript con sạch. Đây là mặc định và giữ mức sử dụng token thấp hơn.  |
| `fork`     | Công việc phụ thuộc vào cuộc trò chuyện hiện tại, kết quả công cụ trước đó, hoặc các chỉ dẫn tinh tế đã có trong transcript của bên yêu cầu | Rẽ nhánh transcript của bên yêu cầu vào phiên con trước khi tác nhân con bắt đầu. |

Dùng `fork` một cách tiết chế. Nó dành cho ủy quyền nhạy cảm với ngữ cảnh, không phải
phần thay thế cho việc viết prompt tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Khởi động một lượt chạy tác nhân con với `deliver: false` trên lane `subagent` toàn cục,
sau đó chạy bước thông báo và đăng trả lời thông báo lên kênh trò chuyện của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu lực của bên gọi. Hồ sơ `coding` và
`full` hiển thị `sessions_spawn` theo mặc định. Hồ sơ `messaging`
thì không; thêm `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hoặc dùng `tools.profile: "coding"` cho các tác nhân nên ủy quyền
công việc. Các chính sách kênh/nhóm, nhà cung cấp, sandbox, và allow/deny theo từng tác nhân
vẫn có thể loại bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ hiệu lực.

**Mặc định:**

- **Mô hình:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng tác nhân); `sessions_spawn.model` rõ ràng vẫn được ưu tiên.
- **Thinking:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng tác nhân); `sessions_spawn.thinking` rõ ràng vẫn được ưu tiên.
- **Thời gian chờ lượt chạy:** nếu bỏ qua `sessions_spawn.runTimeoutSeconds`, OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó rơi về `0` (không có thời gian chờ).

### Chế độ prompt ủy quyền

`agents.defaults.subagents.delegationMode` chỉ điều khiển hướng dẫn prompt; nó không thay đổi chính sách công cụ hoặc bắt buộc ủy quyền.

- `suggest` (mặc định): giữ lời nhắc tiêu chuẩn đề xuất dùng tác nhân con cho công việc lớn hơn hoặc chậm hơn.
- `prefer`: yêu cầu tác nhân chính duy trì khả năng phản hồi và ủy quyền mọi việc phức tạp hơn một câu trả lời trực tiếp thông qua `sessions_spawn`.

Ghi đè theo từng tác nhân dùng `agents.list[].subagents.delegationMode`.

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
  Mô tả tác vụ cho tác tử con.
</ParamField>
<ParamField path="taskName" type="string">
  Tên định danh ổn định tùy chọn để nhắm mục tiêu `subagents` về sau. Phải khớp `[a-z][a-z0-9_]{0,63}` và không được là các mục tiêu dành riêng như `last` hoặc `all`. Nên dùng khi bộ điều phối có thể cần điều hướng, dừng, hoặc nhận diện một tác tử con cụ thể sau khi tạo nhiều tác tử con.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn dễ đọc cho con người.
</ParamField>
<ParamField path="agentId" type="string">
  Tạo dưới một id tác tử khác khi `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các harness ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode`, hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ ACP. Tiếp tục một phiên harness ACP hiện có khi `runtime: "acp"`; bị bỏ qua với các lần tạo tác tử con gốc.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ ACP. Truyền trực tuyến đầu ra chạy ACP đến phiên cha khi `runtime: "acp"`; bỏ qua với các lần tạo tác tử con gốc.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình của tác tử con. Các giá trị không hợp lệ bị bỏ qua và tác tử con chạy trên mô hình mặc định kèm cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức suy nghĩ cho lượt chạy tác tử con.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi được đặt, nếu không thì là `0`. Khi được đặt, lượt chạy tác tử con bị hủy sau N giây.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi là `true`, yêu cầu ràng buộc luồng kênh cho phiên tác tử con này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại thông qua đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối tạo trừ khi runtime con mục tiêu được sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` phân nhánh bản ghi hội thoại hiện tại của bên yêu cầu vào phiên con. Chỉ tác tử con gốc. Các lần tạo có ràng buộc luồng mặc định là `fork`; các lần tạo không có luồng mặc định là `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận tham số phân phối qua kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Để phân phối, hãy dùng
`message`/`sessions_send` từ lượt chạy đã tạo.
</Warning>

### Tên tác vụ và nhắm mục tiêu

`taskName` là tên định danh hướng tới mô hình để điều phối, không phải khóa phiên.
Dùng nó cho các tên tác tử con ổn định như `review_subagents`,
`linux_validation`, hoặc `docs_update` khi bộ điều phối có thể cần điều hướng
hoặc dừng tác tử con đó về sau.

Phân giải mục tiêu chấp nhận các kết quả khớp `taskName` chính xác và các
tiền tố không mơ hồ. Việc khớp được giới hạn trong cùng cửa sổ mục tiêu đang hoạt động/gần đây
được dùng bởi các mục tiêu `/subagents` đánh số, nên một tác tử con đã hoàn tất cũ
không làm cho tên định danh được tái sử dụng trở nên mơ hồ. Nếu hai tác tử con đang hoạt động
hoặc gần đây có cùng `taskName`, mục tiêu là mơ hồ; thay vào đó hãy dùng chỉ mục danh sách,
khóa phiên, hoặc id lượt chạy.

Các mục tiêu dành riêng `last` và `all` không phải là giá trị `taskName` hợp lệ
vì chúng đã có ý nghĩa điều khiển.

## Công cụ: `sessions_yield`

Kết thúc lượt mô hình hiện tại và chờ các sự kiện runtime, chủ yếu là
sự kiện hoàn tất tác tử con, đến dưới dạng thông điệp tiếp theo. Dùng nó sau khi
tạo công việc con bắt buộc khi bên yêu cầu không thể đưa ra câu trả lời cuối cùng
cho đến khi các lần hoàn tất đó đến.

`sessions_yield` là cơ chế chờ cơ bản. Đừng thay thế nó bằng các vòng lặp thăm dò
qua `subagents`, `sessions_list`, `sessions_history`, `sleep` shell,
hoặc thăm dò tiến trình chỉ để phát hiện việc hoàn tất của tác tử con.

Chỉ dùng `sessions_yield` khi danh sách công cụ hiệu dụng của phiên bao gồm
nó. Một số hồ sơ công cụ tối thiểu hoặc tùy chỉnh có thể hiển thị `sessions_spawn` và
`subagents` mà không hiển thị `sessions_yield`; trong trường hợp đó, đừng tạo
một vòng lặp thăm dò chỉ để chờ hoàn tất.

Khi có tác tử con đang hoạt động, OpenClaw chèn một khối prompt `Active Subagents`
nhỏ gọn do runtime tạo vào các lượt bình thường để bên yêu cầu có thể thấy
các phiên con hiện tại, id lượt chạy, trạng thái, nhãn, tác vụ, và
bí danh `taskName` mà không cần thăm dò. Các trường tác vụ và nhãn trong
khối đó được trích dẫn như dữ liệu, không phải chỉ dẫn, vì chúng có thể bắt nguồn
từ các đối số tạo do người dùng/mô hình cung cấp.

## Công cụ: `subagents`

Liệt kê, điều hướng, hoặc dừng các lượt chạy tác tử con đã tạo do phiên
bên yêu cầu sở hữu. Nó được giới hạn trong bên yêu cầu hiện tại; một tác tử con chỉ có thể
xem/điều khiển các tác tử con do chính nó kiểm soát.

Dùng `subagents` cho trạng thái theo yêu cầu, gỡ lỗi, điều hướng, hoặc dừng.
Dùng `sessions_yield` để chờ sự kiện hoàn tất.

## Phiên có ràng buộc luồng

Khi ràng buộc luồng được bật cho một kênh, tác tử con có thể tiếp tục được ràng buộc
với một luồng để các thông điệp theo dõi của người dùng trong luồng đó tiếp tục được định tuyến đến
cùng phiên tác tử con.

### Các kênh hỗ trợ luồng

**Discord** hiện là kênh duy nhất được hỗ trợ. Nó hỗ trợ
các phiên subagent có ràng buộc luồng bền vững (`sessions_spawn` với
`thread: true`), điều khiển luồng thủ công (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), và các khóa adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, và
`channels.discord.threadBindings.spawnSessions`.

### Luồng nhanh

<Steps>
  <Step title="Tạo">
    `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"`).
  </Step>
  <Step title="Ràng buộc">
    OpenClaw tạo hoặc ràng buộc một luồng với mục tiêu phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Định tuyến thông điệp theo dõi">
    Các phản hồi và thông điệp theo dõi trong luồng đó được định tuyến đến phiên đã ràng buộc.
  </Step>
  <Step title="Kiểm tra thời gian chờ">
    Dùng `/session idle` để kiểm tra/cập nhật tự động bỏ tập trung khi không hoạt động và
    `/session max-age` để kiểm soát giới hạn cứng.
  </Step>
  <Step title="Tách">
    Dùng `/unfocus` để tách thủ công.
  </Step>
</Steps>

### Điều khiển thủ công

| Lệnh               | Hiệu lực                                                              |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Ràng buộc luồng hiện tại (hoặc tạo một luồng) với mục tiêu tác tử con/phiên |
| `/unfocus`         | Gỡ ràng buộc cho luồng hiện đang được ràng buộc                       |
| `/agents`          | Liệt kê các lượt chạy đang hoạt động và trạng thái ràng buộc (`thread:<id>` hoặc `unbound`) |
| `/session idle`    | Kiểm tra/cập nhật tự động bỏ tập trung khi rỗi (chỉ luồng đã ràng buộc đang tập trung) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ luồng đã ràng buộc đang tập trung) |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Ghi đè kênh và các khóa tự động ràng buộc khi tạo** là riêng theo adapter. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết chi tiết adapter hiện tại.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách id tác tử có thể được nhắm mục tiêu qua `agentId` rõ ràng (`["*"]` cho phép mọi tác tử). Mặc định: chỉ tác tử bên yêu cầu. Nếu bạn đặt một danh sách và vẫn muốn bên yêu cầu tự tạo chính nó bằng `agentId`, hãy đưa id bên yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép tác tử mục tiêu mặc định được dùng khi tác tử bên yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng). Ghi đè theo tác tử: `agents.list[].subagents.requireAgentId`.
</ParamField>

Nếu phiên bên yêu cầu được sandbox, `sessions_spawn` từ chối các mục tiêu
sẽ chạy không sandbox.

### Khám phá

Dùng `agents_list` để xem những id tác tử nào hiện được phép cho
`sessions_spawn`. Phản hồi bao gồm mô hình hiệu dụng của từng tác tử được liệt kê
và siêu dữ liệu runtime nhúng để bên gọi có thể phân biệt PI, máy chủ ứng dụng Codex,
và các runtime gốc đã cấu hình khác.

### Tự động lưu trữ

- Các phiên tác tử con được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Lưu trữ dùng `sessions.delete` và đổi tên bản ghi hội thoại thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại thông qua đổi tên).
- Tự động lưu trữ là nỗ lực tối đa; các bộ hẹn giờ đang chờ sẽ bị mất nếu Gateway khởi động lại.
- `runTimeoutSeconds` **không** tự động lưu trữ; nó chỉ dừng lượt chạy. Phiên vẫn tồn tại cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các thẻ/tiến trình trình duyệt được theo dõi sẽ được đóng theo nỗ lực tối đa khi lượt chạy kết thúc, ngay cả khi bản ghi hội thoại/bản ghi phiên được giữ lại.

## Tác tử con lồng nhau

Theo mặc định, tác tử con không thể tạo tác tử con riêng của chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu bộ điều phối**: chính → tác tử con điều phối →
tác tử con của tác tử con làm worker.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Cấp độ sâu

| Độ sâu | Dạng khóa phiên                               | Vai trò                                      | Có thể tạo?                  |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Tác tử chính                                  | Luôn luôn                    |
| 1     | `agent:<id>:subagent:<uuid>`                 | Tác tử con (bộ điều phối khi cho phép độ sâu 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Tác tử con của tác tử con (worker lá)         | Không bao giờ                |

### Chuỗi thông báo

Kết quả chảy ngược lên chuỗi:

1. Worker độ sâu 2 hoàn tất → thông báo cho cha của nó (bộ điều phối độ sâu 1).
2. Bộ điều phối độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho chính.
3. Tác tử chính nhận thông báo và gửi đến người dùng.

Mỗi cấp chỉ thấy thông báo từ các con trực tiếp của nó.

<Note>
**Hướng dẫn vận hành:** khởi động công việc con một lần và chờ sự kiện
hoàn tất thay vì xây dựng các vòng lặp thăm dò quanh `sessions_list`,
`sessions_history`, `/subagents list`, hoặc các lệnh `exec` sleep.
`sessions_list` và `/subagents list` giữ các quan hệ phiên con
tập trung vào công việc trực tiếp — các con trực tiếp vẫn được gắn, các con đã kết thúc vẫn
hiển thị trong một cửa sổ gần đây ngắn, và các liên kết con chỉ còn trong kho lưu trữ cũ
bị bỏ qua sau cửa sổ độ mới của chúng. Điều này ngăn siêu dữ liệu `spawnedBy` /
`parentSessionKey` cũ hồi sinh các con ma sau khi khởi động lại. Nếu sự kiện
hoàn tất của tác tử con đến sau khi bạn đã gửi câu trả lời cuối cùng, phản hồi theo dõi đúng là token im lặng chính xác
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi kiểm soát được ghi vào siêu dữ liệu phiên tại thời điểm spawn. Điều đó giữ cho các khóa phiên phẳng hoặc được khôi phục không vô tình lấy lại đặc quyền của tác nhân điều phối.
- **Độ sâu 1 (tác nhân điều phối, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể quản lý các phiên con. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (tác nhân làm việc lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể spawn thêm phiên con.

### Giới hạn spawn theo từng tác nhân

Mỗi phiên tác nhân (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) phiên con đang hoạt động tại một thời điểm. Điều này ngăn fan-out
mất kiểm soát từ một tác nhân điều phối duy nhất.

### Dừng dây chuyền

Dừng một tác nhân điều phối ở độ sâu 1 sẽ tự động dừng tất cả các phiên con
ở độ sâu 2 của nó:

- `/stop` trong cuộc trò chuyện chính dừng tất cả tác nhân ở độ sâu 1 và lan truyền tới các phiên con ở độ sâu 2 của chúng.
- `/subagents kill <id>` dừng một tác nhân phụ cụ thể và lan truyền tới các phiên con của nó.
- `/subagents kill all` dừng tất cả tác nhân phụ cho bên yêu cầu và lan truyền.

## Xác thực

Xác thực tác nhân phụ được phân giải theo **id tác nhân**, không theo loại phiên:

- Khóa phiên tác nhân phụ là `agent:<agentId>:subagent:<uuid>`.
- Kho xác thực được tải từ `agentDir` của tác nhân đó.
- Các hồ sơ xác thực của tác nhân chính được hợp nhất làm **dự phòng**; hồ sơ tác nhân ghi đè hồ sơ chính khi có xung đột.

Quá trình hợp nhất có tính cộng thêm, vì vậy hồ sơ chính luôn sẵn có làm
dự phòng. Xác thực cô lập hoàn toàn theo từng tác nhân hiện chưa được hỗ trợ.

## Thông báo

Tác nhân phụ báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác nhân phụ (không phải phiên bên yêu cầu).
- Nếu tác nhân phụ trả lời chính xác `ANNOUNCE_SKIP`, không có gì được đăng.
- Nếu văn bản assistant mới nhất là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo sẽ bị chặn ngay cả khi trước đó đã có tiến trình hiển thị.

Việc phân phối phụ thuộc vào độ sâu của bên yêu cầu:

- Phiên bên yêu cầu cấp cao nhất dùng một lệnh gọi `agent` tiếp theo với phân phối bên ngoài (`deliver=true`).
- Các phiên tác nhân phụ yêu cầu lồng nhau nhận một lần chèn tiếp theo nội bộ (`deliver=false`) để tác nhân điều phối có thể tổng hợp kết quả con trong phiên.
- Nếu một phiên tác nhân phụ yêu cầu lồng nhau đã biến mất, OpenClaw sẽ quay về bên yêu cầu của phiên đó khi có sẵn.

Đối với phiên bên yêu cầu cấp cao nhất, phân phối trực tiếp ở chế độ hoàn tất trước tiên
phân giải mọi tuyến cuộc trò chuyện/luồng đã liên kết và ghi đè hook, sau đó điền
các trường kênh-đích còn thiếu từ tuyến đã lưu của phiên bên yêu cầu.
Điều đó giữ các phần hoàn tất ở đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn gốc hoàn tất
chỉ xác định kênh.

Tổng hợp hoàn tất của phiên con được giới hạn trong lần chạy hiện tại của bên yêu cầu khi
xây dựng các phát hiện hoàn tất lồng nhau, ngăn đầu ra con từ các lần chạy cũ
rò rỉ vào thông báo hiện tại. Trả lời thông báo giữ nguyên định tuyến
luồng/chủ đề khi bộ chuyển đổi kênh có cung cấp.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường          | Nguồn                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguồn         | `subagent` hoặc `cron`                                                                                          |
| ID phiên    | Khóa/id phiên con                                                                                          |
| Loại           | Loại thông báo + nhãn tác vụ                                                                                    |
| Trạng thái         | Suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`) — **không** suy luận từ văn bản mô hình |
| Nội dung kết quả | Văn bản assistant hiển thị mới nhất, nếu không có thì là văn bản công cụ/toolResult mới nhất đã được làm sạch                                |
| Theo dõi      | Chỉ dẫn mô tả khi nào nên trả lời so với giữ im lặng                                                           |

Các lần chạy kết thúc thất bại báo cáo trạng thái thất bại mà không phát lại
văn bản trả lời đã ghi lại. Khi timeout, nếu phiên con chỉ đi qua các lệnh gọi công cụ, thông báo
có thể thu gọn lịch sử đó thành một bản tóm tắt tiến trình một phần ngắn thay vì
phát lại đầu ra công cụ thô.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc dòng):

- Runtime (ví dụ `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi giá mô hình được cấu hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, và đường dẫn bản ghi hội thoại để tác nhân chính có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên ổ đĩa.

Siêu dữ liệu nội bộ chỉ dành cho điều phối; các trả lời hướng tới người dùng
nên được viết lại bằng giọng assistant thông thường.

### Vì sao ưu tiên `sessions_history`

`sessions_history` là đường dẫn điều phối an toàn hơn:

- Khả năng nhớ lại của assistant được chuẩn hóa trước: thẻ suy nghĩ bị loại bỏ; khung `<relevant-memories>` / `<relevant_memories>` bị loại bỏ; các khối payload XML lệnh gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) bị loại bỏ, bao gồm cả payload bị cắt cụt không bao giờ đóng sạch; khung lệnh gọi/kết quả công cụ bị hạ cấp và dấu mốc ngữ cảnh lịch sử bị loại bỏ; token điều khiển mô hình bị rò rỉ (`<|assistant|>`, các ASCII `<|...|>` khác, dạng toàn chiều rộng `<｜...｜>`) bị loại bỏ; XML lệnh gọi công cụ MiniMax sai định dạng bị loại bỏ.
- Văn bản giống thông tin xác thực/token được biên tập lại.
- Các khối dài có thể bị cắt ngắn.
- Lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá lớn bằng `[sessions_history omitted: message too large]`.
- Kiểm tra bản ghi hội thoại thô trên ổ đĩa là phương án dự phòng khi bạn cần bản ghi đầy đủ đến từng byte.

## Chính sách công cụ

Tác nhân phụ trước tiên dùng cùng hồ sơ và pipeline chính sách công cụ như tác nhân cha hoặc
tác nhân đích. Sau đó, OpenClaw áp dụng lớp hạn chế tác nhân phụ.

Khi không có `tools.profile` mang tính hạn chế, tác nhân phụ nhận **tất cả công cụ ngoại trừ
công cụ phiên** và công cụ hệ thống:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` ở đây cũng vẫn là một dạng xem nhớ lại có giới hạn và đã được làm sạch — nó
không phải là bản đổ bản ghi hội thoại thô.

Khi `maxSpawnDepth >= 2`, tác nhân phụ điều phối ở độ sâu 1 còn
nhận thêm `sessions_spawn`, `subagents`, `sessions_list`, và
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

`tools.subagents.tools.allow` là bộ lọc chỉ-cho-phép cuối cùng. Nó có thể thu hẹp
tập công cụ đã được phân giải, nhưng không thể **thêm lại** một công cụ đã bị loại bỏ
bởi `tools.profile`. Ví dụ, `tools.profile: "coding"` bao gồm
`web_search`/`web_fetch` nhưng không bao gồm công cụ `browser`. Để cho phép
tác nhân phụ theo hồ sơ coding dùng tự động hóa trình duyệt, hãy thêm browser ở
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
tác nhân cần nhận tự động hóa trình duyệt.

## Đồng thời

Tác nhân phụ dùng một lane hàng đợi nội bộ chuyên dụng:

- **Tên lane:** `subagent`
- **Mức đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Khả năng sống và khôi phục

OpenClaw không coi việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một
tác nhân phụ vẫn còn sống. Các lần chạy chưa kết thúc cũ hơn cửa sổ lần chạy cũ
ngừng được tính là đang hoạt động/đang chờ trong `/subagents list`, tóm tắt trạng thái,
cổng hoàn tất hậu duệ, và kiểm tra đồng thời theo từng phiên.

Sau khi Gateway khởi động lại, các lần chạy đã khôi phục nhưng chưa kết thúc và đã cũ sẽ bị cắt bỏ trừ khi
phiên con của chúng được đánh dấu `abortedLastRun: true`. Những
phiên con bị hủy do khởi động lại này vẫn có thể khôi phục qua luồng khôi phục tác nhân phụ mồ côi,
luồng này gửi một tin nhắn tiếp tục tổng hợp trước khi
xóa dấu hủy.

Khôi phục tự động sau khởi động lại được giới hạn theo từng phiên con. Nếu cùng một
tác nhân phụ con được chấp nhận để khôi phục mồ côi lặp lại bên trong
cửa sổ kẹt lại nhanh, OpenClaw sẽ lưu một tombstone khôi phục trên
phiên đó và ngừng tự động tiếp tục nó trong các lần khởi động lại sau. Chạy
`openclaw tasks maintenance --apply` để đối chiếu bản ghi tác vụ, hoặc
`openclaw doctor --fix` để xóa các cờ khôi phục đã hủy cũ trên
các phiên có tombstone.

<Note>
Nếu spawn tác nhân phụ thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra bên gọi RPC trước khi chỉnh sửa trạng thái ghép đôi.
Điều phối `sessions_spawn` nội bộ nên kết nối dưới dạng
`client.id: "gateway-client"` với `client.mode: "backend"` qua xác thực
mật khẩu/token chia sẻ local loopback trực tiếp; đường dẫn đó không phụ thuộc vào
đường cơ sở phạm vi thiết bị đã ghép đôi của CLI. Các bên gọi từ xa, `deviceIdentity`
tường minh, đường dẫn device-token tường minh, và client trình duyệt/node
vẫn cần phê duyệt thiết bị bình thường cho nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên bên yêu cầu và dừng mọi lần chạy tác nhân phụ đang hoạt động được spawn từ đó, lan truyền tới các phiên con lồng nhau.
- `/subagents kill <id>` dừng một tác nhân phụ cụ thể và lan truyền tới các phiên con của nó.

## Giới hạn

- Thông báo tác nhân phụ là **nỗ lực tối đa**. Nếu gateway khởi động lại, công việc "thông báo lại" đang chờ sẽ bị mất.
- Tác nhân phụ vẫn dùng chung tài nguyên của cùng tiến trình gateway; hãy xem `maxConcurrent` như một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác nhân phụ chỉ chèn `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` và `USER.md` (không có `MEMORY.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`).
- Độ sâu lồng nhau tối đa là 5 (phạm vi `maxSpawnDepth`: 1–5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số phiên con đang hoạt động theo từng phiên (mặc định `5`, phạm vi `1–20`).

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
