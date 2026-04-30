---
read_when:
    - Bạn muốn chạy công việc nền hoặc song song thông qua tác nhân
    - Bạn đang thay đổi sessions_spawn hoặc chính sách công cụ của tác tử phụ
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên tác tử phụ gắn với luồng
sidebarTitle: Sub-agents
summary: Khởi tạo các lần chạy tác tử nền cô lập để thông báo kết quả trở lại cuộc trò chuyện của người yêu cầu
title: Tác nhân phụ
x-i18n:
    generated_at: "2026-04-30T16:30:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

Các tác nhân phụ là các lần chạy tác nhân nền được sinh ra từ một lần chạy tác nhân hiện có.
Chúng chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả trở lại kênh trò chuyện của bên yêu cầu. Mỗi lần chạy tác nhân phụ được theo dõi như một
[tác vụ nền](/vi/automation/tasks).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn lần chạy chính.
- Giữ tác nhân phụ được cô lập theo mặc định (tách phiên + sandbox tùy chọn).
- Giữ bề mặt công cụ khó bị dùng sai: tác nhân phụ **không** có công cụ phiên theo mặc định.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu trình điều phối.

<Note>
**Lưu ý về chi phí:** mỗi tác nhân phụ có ngữ cảnh và mức sử dụng token riêng theo mặc định. Với các tác vụ nặng hoặc lặp lại, hãy đặt một mô hình rẻ hơn cho tác nhân phụ và giữ tác nhân chính trên mô hình chất lượng cao hơn. Cấu hình qua `agents.defaults.subagents.model` hoặc ghi đè theo từng tác nhân. Khi một tác nhân con thực sự cần bản ghi hiện tại của bên yêu cầu, tác nhân có thể yêu cầu `context: "fork"` cho lần sinh đó.
</Note>

## Lệnh slash

Dùng `/subagents` để kiểm tra hoặc điều khiển các lần chạy tác nhân phụ cho **phiên hiện tại**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` hiển thị siêu dữ liệu lần chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn bản ghi, dọn dẹp). Dùng `sessions_history` để xem lại có giới hạn và được lọc an toàn; kiểm tra đường dẫn bản ghi trên đĩa khi bạn cần bản ghi thô đầy đủ.

### Điều khiển liên kết luồng

Các lệnh này hoạt động trên các kênh hỗ trợ liên kết luồng bền vững.
Xem [Kênh hỗ trợ luồng](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi sinh

`/subagents spawn` khởi động một tác nhân phụ nền dưới dạng lệnh người dùng (không phải chuyển tiếp nội bộ) và gửi một bản cập nhật hoàn tất cuối cùng trở lại cuộc trò chuyện của bên yêu cầu khi lần chạy kết thúc.

<AccordionGroup>
  <Accordion title="Hoàn tất không chặn, dựa trên đẩy">
    - Lệnh sinh không chặn; nó trả về id lần chạy ngay lập tức.
    - Khi hoàn tất, tác nhân phụ thông báo một thông điệp tóm tắt/kết quả trở lại kênh trò chuyện của bên yêu cầu.
    - Việc hoàn tất dựa trên đẩy. Sau khi đã sinh, **không** thăm dò `/subagents list`, `sessions_list`, hoặc `sessions_history` trong vòng lặp chỉ để chờ nó hoàn tất; chỉ kiểm tra trạng thái theo nhu cầu để gỡ lỗi hoặc can thiệp.
    - Khi hoàn tất, OpenClaw cố gắng tối đa đóng các tab trình duyệt/tiến trình đã theo dõi do phiên tác nhân phụ đó mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Khả năng phục hồi khi gửi lần sinh thủ công">
    - OpenClaw thử gửi trực tiếp `agent` trước với khóa idempotency ổn định.
    - Nếu gửi trực tiếp thất bại, nó chuyển sang định tuyến hàng đợi.
    - Nếu định tuyến hàng đợi vẫn không khả dụng, thông báo sẽ được thử lại với backoff lũy thừa ngắn trước khi bỏ cuộc cuối cùng.
    - Việc gửi hoàn tất giữ tuyến bên yêu cầu đã phân giải: các tuyến hoàn tất liên kết theo luồng hoặc liên kết theo cuộc trò chuyện được ưu tiên khi có; nếu nguồn hoàn tất chỉ cung cấp một kênh, OpenClaw điền mục tiêu/tài khoản còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để gửi trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Siêu dữ liệu bàn giao hoàn tất">
    Việc bàn giao hoàn tất cho phiên bên yêu cầu là ngữ cảnh nội bộ được tạo lúc chạy (không phải văn bản do người dùng soạn) và bao gồm:

    - `Result` — văn bản trả lời `assistant` mới nhất hiển thị, nếu không thì là văn bản tool/toolResult mới nhất đã được làm sạch. Các lần chạy kết thúc thất bại không dùng lại văn bản trả lời đã ghi lại.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Thống kê runtime/token gọn.
    - Một chỉ dẫn gửi yêu cầu tác nhân bên yêu cầu viết lại bằng giọng trợ lý bình thường (không chuyển tiếp siêu dữ liệu nội bộ thô).

  </Accordion>
  <Accordion title="Chế độ và runtime ACP">
    - `--model` và `--thinking` ghi đè mặc định cho riêng lần chạy đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - `/subagents spawn` là chế độ một lần (`mode: "run"`). Với các phiên liên kết luồng bền vững, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Với các phiên harness ACP (Claude Code, Gemini CLI, OpenCode, hoặc Codex ACP/acpx rõ ràng), dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [mô hình gửi ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi việc hoàn tất hoặc các vòng lặp tác nhân-với-tác nhân. Khi plugin `codex` được bật, điều khiển trò chuyện/luồng Codex nên ưu tiên `/codex ...` hơn ACP trừ khi người dùng yêu cầu rõ ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không bị sandbox, và một plugin backend như `acpx` được tải. `runtime: "acp"` mong đợi một id harness ACP bên ngoài, hoặc một mục `agents.list[]` có `runtime.type="acp"`; dùng runtime tác nhân phụ mặc định cho các tác nhân cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Tác nhân phụ gốc bắt đầu cô lập trừ khi bên gọi yêu cầu rõ ràng việc fork bản ghi hiện tại.

| Chế độ     | Khi nào dùng                                                                                                                           | Hành vi                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm, hoặc bất cứ việc gì có thể mô tả ngắn gọn trong văn bản tác vụ             | Tạo một bản ghi con sạch. Đây là mặc định và giúp giảm mức dùng token.             |
| `fork`     | Công việc phụ thuộc vào cuộc trò chuyện hiện tại, kết quả công cụ trước đó, hoặc chỉ dẫn tinh tế đã có trong bản ghi của bên yêu cầu   | Rẽ nhánh bản ghi của bên yêu cầu vào phiên con trước khi tác nhân con bắt đầu.     |

Dùng `fork` một cách tiết kiệm. Nó dành cho việc ủy nhiệm nhạy theo ngữ cảnh, không phải để thay thế việc viết một lời nhắc tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Bắt đầu một lần chạy tác nhân phụ với `deliver: false` trên làn `subagent` toàn cục,
sau đó chạy bước thông báo và đăng câu trả lời thông báo vào kênh trò chuyện của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu lực của bên gọi. Các hồ sơ `coding` và
`full` mặc định hiển thị `sessions_spawn`. Hồ sơ `messaging`
thì không; thêm `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hoặc dùng `tools.profile: "coding"` cho các tác nhân cần ủy nhiệm công việc. Chính sách cho phép/từ chối theo kênh/nhóm, nhà cung cấp, sandbox, và từng tác nhân vẫn có thể gỡ bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng phiên để xác nhận danh sách công cụ hiệu lực.

**Mặc định:**

- **Mô hình:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng tác nhân); `sessions_spawn.model` rõ ràng vẫn được ưu tiên.
- **Thinking:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng tác nhân); `sessions_spawn.thinking` rõ ràng vẫn được ưu tiên.
- **Thời gian chờ lần chạy:** nếu bỏ qua `sessions_spawn.runTimeoutSeconds`, OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó quay về `0` (không có thời gian chờ).

### Tham số công cụ

<ParamField path="task" type="string" required>
  Mô tả tác vụ cho tác nhân phụ.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn dễ đọc cho con người.
</ParamField>
<ParamField path="agentId" type="string">
  Sinh dưới một id tác nhân khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các harness ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode`, hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ ACP. Tiếp tục một phiên harness ACP hiện có khi `runtime: "acp"`; bị bỏ qua với các lần sinh tác nhân phụ gốc.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ ACP. Truyền đầu ra lần chạy ACP tới phiên cha khi `runtime: "acp"`; bỏ qua với các lần sinh tác nhân phụ gốc.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình tác nhân phụ. Giá trị không hợp lệ bị bỏ qua và tác nhân phụ chạy trên mô hình mặc định với cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức thinking cho lần chạy tác nhân phụ.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi được đặt, nếu không là `0`. Khi được đặt, lần chạy tác nhân phụ bị hủy sau N giây.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu liên kết luồng kênh cho phiên tác nhân phụ này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi thông qua đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối sinh trừ khi runtime con mục tiêu được sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rẽ nhánh bản ghi hiện tại của bên yêu cầu vào phiên con. Chỉ tác nhân phụ gốc. Chỉ dùng `fork` khi tác nhân con cần bản ghi hiện tại.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận các tham số gửi qua kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Để gửi, dùng
`message`/`sessions_send` từ lần chạy đã sinh.
</Warning>

## Phiên liên kết luồng

Khi liên kết luồng được bật cho một kênh, một tác nhân phụ có thể tiếp tục được liên kết với một luồng để các tin nhắn theo dõi của người dùng trong luồng đó tiếp tục định tuyến đến cùng phiên tác nhân phụ.

### Kênh hỗ trợ luồng

**Discord** hiện là kênh duy nhất được hỗ trợ. Kênh này hỗ trợ
các phiên subagent liên kết luồng bền vững (`sessions_spawn` với
`thread: true`), điều khiển luồng thủ công (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), và các khóa adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, và
`channels.discord.threadBindings.spawnSubagentSessions`.

### Luồng nhanh

<Steps>
  <Step title="Sinh">
    `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"`).
  </Step>
  <Step title="Liên kết">
    OpenClaw tạo hoặc liên kết một luồng tới mục tiêu phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Định tuyến theo dõi">
    Các câu trả lời và tin nhắn theo dõi trong luồng đó định tuyến tới phiên đã liên kết.
  </Step>
  <Step title="Kiểm tra thời gian chờ">
    Dùng `/session idle` để kiểm tra/cập nhật tự động bỏ tập trung do không hoạt động và
    `/session max-age` để kiểm soát giới hạn cứng.
  </Step>
  <Step title="Tách">
    Dùng `/unfocus` để tách thủ công.
  </Step>
</Steps>

### Điều khiển thủ công

| Lệnh               | Hiệu ứng                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Liên kết luồng hiện tại (hoặc tạo một luồng) với đích tác nhân con/phiên |
| `/unfocus`         | Xóa liên kết cho luồng đang được liên kết hiện tại                    |
| `/agents`          | Liệt kê các lượt chạy đang hoạt động và trạng thái liên kết (`thread:<id>` hoặc `unbound`) |
| `/session idle`    | Kiểm tra/cập nhật tự động bỏ tập trung khi nhàn rỗi (chỉ các luồng được liên kết đang tập trung) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng được liên kết đang tập trung) |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Các khóa ghi đè kênh và tự động liên kết khi tạo** phụ thuộc vào từng adapter. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết chi tiết adapter hiện tại.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách id tác nhân có thể được nhắm mục tiêu qua `agentId` tường minh (`["*"]` cho phép bất kỳ). Mặc định: chỉ tác nhân yêu cầu. Nếu bạn đặt một danh sách và vẫn muốn tác nhân yêu cầu tự tạo chính nó bằng `agentId`, hãy đưa id của tác nhân yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép tác nhân đích mặc định được dùng khi tác nhân yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ tường minh). Ghi đè theo từng tác nhân: `agents.list[].subagents.requireAgentId`.
</ParamField>

Nếu phiên yêu cầu đang chạy trong sandbox, `sessions_spawn` sẽ từ chối các đích
sẽ chạy không sandbox.

### Khám phá

Dùng `agents_list` để xem các id tác nhân nào hiện được phép cho
`sessions_spawn`. Phản hồi bao gồm model hiệu lực của từng tác nhân được liệt kê
và siêu dữ liệu runtime nhúng để bên gọi có thể phân biệt PI, máy chủ ứng dụng Codex
và các runtime gốc đã cấu hình khác.

### Tự động lưu trữ

- Các phiên tác nhân con được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Lưu trữ dùng `sessions.delete` và đổi tên bản ghi phiên thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi phiên bằng cách đổi tên).
- Tự động lưu trữ là best-effort; các bộ hẹn giờ đang chờ sẽ bị mất nếu Gateway khởi động lại.
- `runTimeoutSeconds` **không** tự động lưu trữ; nó chỉ dừng lượt chạy. Phiên vẫn còn cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các tab/tiến trình trình duyệt được theo dõi sẽ được đóng best-effort khi lượt chạy kết thúc, ngay cả khi bản ghi phiên/phiên được giữ lại.

## Tác nhân con lồng nhau

Theo mặc định, tác nhân con không thể tạo tác nhân con của chính chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu điều phối**: chính → tác nhân con điều phối →
tác nhân xử lý con-con.

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

### Mức độ sâu

| Độ sâu | Dạng khóa phiên                              | Vai trò                                      | Có thể tạo?                  |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Tác nhân chính                               | Luôn luôn                    |
| 1     | `agent:<id>:subagent:<uuid>`                 | Tác nhân con (bộ điều phối khi cho phép độ sâu 2) | Chỉ nếu `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Tác nhân con-con (tác nhân xử lý nút lá)     | Không bao giờ                |

### Chuỗi thông báo

Kết quả chảy ngược lên chuỗi:

1. Tác nhân xử lý độ sâu 2 hoàn tất → thông báo cho cha của nó (bộ điều phối độ sâu 1).
2. Bộ điều phối độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho tác nhân chính.
3. Tác nhân chính nhận thông báo và chuyển đến người dùng.

Mỗi cấp chỉ thấy thông báo từ các con trực tiếp của nó.

<Note>
**Hướng dẫn vận hành:** bắt đầu công việc con một lần và chờ sự kiện hoàn tất
thay vì xây dựng vòng lặp thăm dò quanh `sessions_list`,
`sessions_history`, `/subagents list`, hoặc lệnh ngủ `exec`.
`sessions_list` và `/subagents list` giữ quan hệ phiên con
tập trung vào công việc đang chạy — các con đang chạy vẫn được gắn, các con đã kết thúc vẫn
hiển thị trong một cửa sổ gần đây ngắn, và các liên kết con chỉ còn trong kho lưu trữ cũ
bị bỏ qua sau cửa sổ độ mới của chúng. Điều này ngăn siêu dữ liệu `spawnedBy` /
`parentSessionKey` cũ làm sống lại các con ma sau khi
khởi động lại. Nếu một sự kiện hoàn tất của con đến sau khi bạn đã gửi
câu trả lời cuối cùng, phản hồi tiếp theo đúng là token im lặng chính xác
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được ghi vào siêu dữ liệu phiên tại thời điểm tạo. Điều đó giữ cho các khóa phiên phẳng hoặc được khôi phục không vô tình lấy lại đặc quyền bộ điều phối.
- **Độ sâu 1 (bộ điều phối, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể quản lý các con của nó. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (nút lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (tác nhân xử lý nút lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể tạo thêm con.

### Giới hạn tạo theo từng tác nhân

Mỗi phiên tác nhân (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) con đang hoạt động tại một thời điểm. Điều này ngăn một bộ điều phối
đơn lẻ bung rộng mất kiểm soát.

### Dừng dây chuyền

Dừng một bộ điều phối độ sâu 1 sẽ tự động dừng tất cả các con độ sâu 2
của nó:

- `/stop` trong cuộc trò chuyện chính dừng tất cả tác nhân độ sâu 1 và dừng dây chuyền đến các con độ sâu 2 của chúng.
- `/subagents kill <id>` dừng một tác nhân con cụ thể và dừng dây chuyền đến các con của nó.
- `/subagents kill all` dừng tất cả tác nhân con cho bên yêu cầu và dừng dây chuyền.

## Xác thực

Xác thực tác nhân con được phân giải theo **id tác nhân**, không theo loại phiên:

- Khóa phiên tác nhân con là `agent:<agentId>:subagent:<uuid>`.
- Kho xác thực được tải từ `agentDir` của tác nhân đó.
- Các hồ sơ xác thực của tác nhân chính được hợp nhất vào dưới dạng **dự phòng**; hồ sơ tác nhân ghi đè hồ sơ chính khi có xung đột.

Việc hợp nhất là cộng thêm, nên hồ sơ chính luôn khả dụng dưới dạng
dự phòng. Xác thực cô lập hoàn toàn theo từng tác nhân chưa được hỗ trợ.

## Thông báo

Tác nhân con báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác nhân con (không phải phiên yêu cầu).
- Nếu tác nhân con trả lời chính xác `ANNOUNCE_SKIP`, không có gì được đăng.
- Nếu văn bản assistant mới nhất là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo sẽ bị chặn ngay cả khi trước đó đã có tiến trình hiển thị.

Việc gửi phụ thuộc vào độ sâu của bên yêu cầu:

- Phiên yêu cầu cấp cao nhất dùng một lệnh gọi `agent` tiếp theo với gửi ra ngoài (`deliver=true`).
- Phiên tác nhân con yêu cầu lồng nhau nhận một phần chèn tiếp theo nội bộ (`deliver=false`) để bộ điều phối có thể tổng hợp kết quả con trong phiên.
- Nếu một phiên tác nhân con yêu cầu lồng nhau đã biến mất, OpenClaw sẽ quay về bên yêu cầu của phiên đó khi có sẵn.

Đối với phiên yêu cầu cấp cao nhất, gửi trực tiếp ở chế độ hoàn tất trước tiên
phân giải mọi tuyến cuộc trò chuyện/luồng đã liên kết và ghi đè hook, sau đó điền
các trường đích kênh còn thiếu từ tuyến đã lưu của phiên yêu cầu.
Điều đó giữ các lượt hoàn tất ở đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn gốc
hoàn tất chỉ xác định kênh.

Tổng hợp hoàn tất của con được giới hạn trong lượt chạy yêu cầu hiện tại khi
xây dựng các phát hiện hoàn tất lồng nhau, ngăn đầu ra con từ lượt chạy trước
đã cũ rò rỉ vào thông báo hiện tại. Phản hồi thông báo giữ nguyên
định tuyến luồng/chủ đề khi adapter kênh có sẵn.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường          | Nguồn                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguồn          | `subagent` hoặc `cron`                                                                                        |
| Id phiên       | Khóa/id phiên con                                                                                             |
| Loại           | Loại thông báo + nhãn tác vụ                                                                                  |
| Trạng thái     | Suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`) — **không** suy luận từ văn bản model |
| Nội dung kết quả | Văn bản assistant hiển thị mới nhất, nếu không thì văn bản công cụ/toolResult mới nhất đã được làm sạch        |
| Theo dõi       | Hướng dẫn mô tả khi nào nên trả lời và khi nào nên im lặng                                                    |

Các lượt chạy cuối cùng bị lỗi báo cáo trạng thái lỗi mà không phát lại văn bản
trả lời đã ghi lại. Khi hết thời gian, nếu con chỉ đi qua các lệnh gọi công cụ,
thông báo có thể thu gọn lịch sử đó thành một tóm tắt tiến trình một phần ngắn
thay vì phát lại đầu ra công cụ thô.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc):

- Runtime (ví dụ `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi giá model được cấu hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, và đường dẫn bản ghi phiên để tác nhân chính có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Siêu dữ liệu nội bộ chỉ dành cho điều phối; các phản hồi hướng tới người dùng
nên được viết lại bằng giọng assistant bình thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là đường dẫn điều phối an toàn hơn:

- Gợi nhớ của assistant được chuẩn hóa trước: thẻ suy nghĩ bị loại bỏ; khung `<relevant-memories>` / `<relevant_memories>` bị loại bỏ; các khối payload XML lệnh gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) bị loại bỏ, bao gồm các payload bị cắt cụt không bao giờ đóng sạch; khung lệnh gọi/kết quả công cụ bị hạ cấp và các dấu mốc ngữ cảnh lịch sử bị loại bỏ; token điều khiển model bị rò rỉ (`<|assistant|>`, ASCII `<|...|>` khác, full-width `<｜...｜>`) bị loại bỏ; XML lệnh gọi công cụ MiniMax sai định dạng bị loại bỏ.
- Văn bản giống thông tin xác thực/token được biên tập.
- Các khối dài có thể bị cắt ngắn.
- Các lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá lớn bằng `[sessions_history omitted: message too large]`.
- Kiểm tra bản ghi phiên thô trên đĩa là phương án dự phòng khi bạn cần bản ghi phiên đầy đủ từng byte.

## Chính sách công cụ

Tác nhân con trước tiên dùng cùng hồ sơ và pipeline chính sách công cụ như tác nhân cha hoặc
tác nhân đích. Sau đó, OpenClaw áp dụng lớp hạn chế
tác nhân con.

Khi không có `tools.profile` hạn chế, tác nhân con nhận **tất cả công cụ ngoại trừ
công cụ phiên** và công cụ hệ thống:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` vẫn là một chế độ xem gợi nhớ có giới hạn, đã được làm sạch ở đây — nó
không phải là bản đổ bản ghi phiên thô.

Khi `maxSpawnDepth >= 2`, các tác nhân con điều phối độ sâu 1 còn
nhận thêm `sessions_spawn`, `subagents`, `sessions_list`, và
`sessions_history` để có thể quản lý các con của chúng.

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
tập công cụ đã được phân giải, nhưng không thể **thêm lại** một công cụ đã bị
`tools.profile` loại bỏ. Ví dụ, `tools.profile: "coding"` bao gồm
`web_search`/`web_fetch` nhưng không bao gồm công cụ `browser`. Để cho phép
các tác nhân phụ dùng hồ sơ coding sử dụng tự động hóa trình duyệt, hãy thêm browser ở
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
tác nhân cần có tự động hóa trình duyệt.

## Đồng thời

Các tác nhân phụ dùng một làn hàng đợi trong tiến trình chuyên dụng:

- **Tên làn:** `subagent`
- **Mức đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Tình trạng hoạt động và khôi phục

OpenClaw không xem việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một
tác nhân phụ vẫn còn sống. Các lần chạy chưa kết thúc cũ hơn cửa sổ lần chạy quá hạn
sẽ không còn được tính là đang hoạt động/đang chờ trong `/subagents list`, bản tóm tắt trạng thái,
cổng chặn hoàn tất của hậu duệ và kiểm tra mức đồng thời theo phiên.

Sau khi Gateway khởi động lại, các lần chạy đã khôi phục nhưng chưa kết thúc và quá hạn sẽ bị loại bỏ trừ khi
phiên con của chúng được đánh dấu `abortedLastRun: true`. Những
phiên con bị hủy do khởi động lại đó vẫn có thể khôi phục thông qua luồng khôi phục tác nhân phụ mồ côi,
luồng này gửi một thông điệp tiếp tục tổng hợp trước khi
xóa dấu hủy.

Khôi phục tự động sau khi khởi động lại được giới hạn theo từng phiên con. Nếu cùng một
phiên con của tác nhân phụ được chấp nhận khôi phục mồ côi lặp lại bên trong
cửa sổ kẹt lại nhanh, OpenClaw sẽ lưu một dấu mộ khôi phục trên
phiên đó và dừng tự động tiếp tục phiên này trong các lần khởi động lại sau. Chạy
`openclaw tasks maintenance --apply` để đối chiếu bản ghi tác vụ, hoặc
`openclaw doctor --fix` để xóa các cờ khôi phục đã hủy quá hạn trên
các phiên có dấu mộ.

<Note>
Nếu việc tạo tác nhân phụ thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra trình gọi RPC trước khi chỉnh sửa trạng thái ghép đôi.
Điều phối `sessions_spawn` nội bộ nên kết nối dưới dạng
`client.id: "gateway-client"` với `client.mode: "backend"` qua xác thực
mật khẩu/token dùng chung trên loopback trực tiếp; đường dẫn đó không phụ thuộc vào
đường cơ sở phạm vi thiết bị đã ghép đôi của CLI. Các trình gọi từ xa, `deviceIdentity`
tường minh, đường dẫn device-token tường minh và client browser/node
vẫn cần phê duyệt thiết bị bình thường cho các lần nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên của bên yêu cầu và dừng mọi lần chạy tác nhân phụ đang hoạt động được tạo từ phiên đó, lan truyền xuống các con lồng nhau.
- `/subagents kill <id>` dừng một tác nhân phụ cụ thể và lan truyền xuống các con của nó.

## Giới hạn

- Thông báo tác nhân phụ là **nỗ lực tối đa**. Nếu Gateway khởi động lại, công việc "announce back" đang chờ sẽ bị mất.
- Các tác nhân phụ vẫn chia sẻ cùng tài nguyên tiến trình Gateway; hãy xem `maxConcurrent` như một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác nhân phụ chỉ chèn `AGENTS.md` + `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`).
- Độ sâu lồng nhau tối đa là 5 (phạm vi `maxSpawnDepth`: 1–5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số con đang hoạt động theo mỗi phiên (mặc định `5`, phạm vi `1–20`).

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
