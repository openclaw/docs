---
read_when:
    - Bạn muốn thực hiện công việc chạy nền hoặc song song thông qua tác nhân
    - Bạn đang thay đổi sessions_spawn hoặc chính sách công cụ tác nhân phụ
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên tác nhân phụ ràng buộc với luồng
sidebarTitle: Sub-agents
summary: Tạo các phiên chạy tác tử nền biệt lập để thông báo kết quả lại cho cuộc trò chuyện của người yêu cầu
title: Tác tử phụ
x-i18n:
    generated_at: "2026-04-29T23:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

Tác tử con là các lần chạy tác tử nền được tạo từ một lần chạy tác tử hiện có.
Chúng chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả trở lại kênh trò chuyện
của bên yêu cầu. Mỗi lần chạy tác tử con được theo dõi như một
[tác vụ nền](/vi/automation/tasks).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn lần chạy chính.
- Giữ tác tử con mặc định được cô lập (tách phiên + sandbox tùy chọn).
- Giữ bề mặt công cụ khó bị dùng sai: tác tử con mặc định **không** nhận công cụ phiên.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu điều phối.

<Note>
**Ghi chú chi phí:** mỗi tác tử con mặc định có ngữ cảnh và mức sử dụng token riêng.
Với các tác vụ nặng hoặc lặp lại, hãy đặt một mô hình rẻ hơn cho tác tử con
và giữ tác tử chính trên mô hình chất lượng cao hơn. Cấu hình qua
`agents.defaults.subagents.model` hoặc ghi đè theo từng tác tử. Khi một tác tử con
thực sự cần bản ghi hiện tại của bên yêu cầu, tác tử có thể yêu cầu
`context: "fork"` cho lần tạo đó.
</Note>

## Lệnh slash

Dùng `/subagents` để kiểm tra hoặc điều khiển các lần chạy tác tử con cho **phiên
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

`/subagents info` hiển thị siêu dữ liệu lần chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn bản ghi, dọn dẹp). Dùng `sessions_history` để có chế độ xem truy hồi có giới hạn,
đã lọc an toàn; kiểm tra đường dẫn bản ghi trên đĩa khi bạn
cần bản ghi thô đầy đủ.

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

`/subagents spawn` khởi chạy một tác tử con nền dưới dạng lệnh người dùng (không phải
chuyển tiếp nội bộ) và gửi một cập nhật hoàn tất cuối cùng trở lại
cuộc trò chuyện của bên yêu cầu khi lần chạy kết thúc.

<AccordionGroup>
  <Accordion title="Không chặn, hoàn tất dựa trên đẩy">
    - Lệnh tạo không chặn; nó trả về id lần chạy ngay lập tức.
    - Khi hoàn tất, tác tử con thông báo một tin nhắn tóm tắt/kết quả trở lại kênh trò chuyện của bên yêu cầu.
    - Việc hoàn tất dựa trên cơ chế đẩy. Sau khi đã tạo, **không** thăm dò `/subagents list`, `sessions_list`, hoặc `sessions_history` trong vòng lặp chỉ để chờ nó kết thúc; chỉ kiểm tra trạng thái theo nhu cầu để gỡ lỗi hoặc can thiệp.
    - Khi hoàn tất, OpenClaw sẽ cố gắng tối đa để đóng các tab trình duyệt/tiến trình được theo dõi do phiên tác tử con đó mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Khả năng phục hồi gửi khi tạo thủ công">
    - OpenClaw thử gửi trực tiếp qua `agent` trước với khóa bất biến ổn định.
    - Nếu gửi trực tiếp thất bại, nó chuyển sang định tuyến qua hàng đợi.
    - Nếu định tuyến qua hàng đợi vẫn không khả dụng, thông báo sẽ được thử lại với backoff hàm mũ ngắn trước khi bỏ cuộc cuối cùng.
    - Việc gửi hoàn tất giữ tuyến bên yêu cầu đã phân giải: các tuyến hoàn tất gắn với luồng hoặc cuộc trò chuyện được ưu tiên khi khả dụng; nếu nguồn hoàn tất chỉ cung cấp một kênh, OpenClaw điền mục tiêu/tài khoản còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để gửi trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Siêu dữ liệu bàn giao hoàn tất">
    Phần bàn giao hoàn tất cho phiên bên yêu cầu là ngữ cảnh nội bộ
    do runtime tạo (không phải văn bản do người dùng viết) và bao gồm:

    - `Result` — văn bản phản hồi `assistant` hiển thị mới nhất, nếu không thì là văn bản công cụ/toolResult mới nhất đã được làm sạch. Các lần chạy kết thúc thất bại không tái sử dụng văn bản phản hồi đã ghi lại.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Thống kê runtime/token gọn.
    - Một chỉ dẫn gửi yêu cầu tác tử bên yêu cầu viết lại bằng giọng trợ lý bình thường (không chuyển tiếp siêu dữ liệu nội bộ thô).

  </Accordion>
  <Accordion title="Chế độ và runtime ACP">
    - `--model` và `--thinking` ghi đè mặc định cho lần chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - `/subagents spawn` là chế độ một lần (`mode: "run"`). Với các phiên liên kết luồng bền vững, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Với các phiên harness ACP (Claude Code, Gemini CLI, OpenCode, hoặc Codex ACP/acpx rõ ràng), dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [Mô hình gửi ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi hoàn tất hoặc vòng lặp tác tử với tác tử. Khi plugin `codex` được bật, điều khiển trò chuyện/luồng Codex nên ưu tiên `/codex ...` thay vì ACP, trừ khi người dùng yêu cầu rõ ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không bị sandbox, và một plugin backend như `acpx` được tải. `runtime: "acp"` mong đợi id harness ACP bên ngoài, hoặc một mục `agents.list[]` có `runtime.type="acp"`; dùng runtime tác tử con mặc định cho các tác tử cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Tác tử con gốc bắt đầu ở trạng thái cô lập trừ khi bên gọi yêu cầu rõ ràng việc fork
bản ghi hiện tại.

| Chế độ     | Khi nên dùng                                                                                                                           | Hành vi                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm, hoặc bất kỳ việc gì có thể được tóm tắt trong văn bản tác vụ              | Tạo một bản ghi con sạch. Đây là mặc định và giúp giảm mức dùng token.           |
| `fork`     | Công việc phụ thuộc vào cuộc trò chuyện hiện tại, kết quả công cụ trước đó, hoặc hướng dẫn sắc thái đã có trong bản ghi của bên yêu cầu | Nhánh bản ghi của bên yêu cầu vào phiên con trước khi tác tử con bắt đầu.        |

Dùng `fork` một cách tiết kiệm. Nó dành cho ủy quyền nhạy với ngữ cảnh, không phải
thay thế cho việc viết một prompt tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Bắt đầu một lần chạy tác tử con với `deliver: false` trên lane `subagent` toàn cục,
sau đó chạy bước thông báo và đăng phản hồi thông báo lên kênh trò chuyện của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu lực của bên gọi. Các hồ sơ `coding` và
`full` mặc định hiển thị `sessions_spawn`. Hồ sơ `messaging`
thì không; thêm `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hoặc dùng `tools.profile: "coding"` cho các tác tử cần ủy quyền
công việc. Chính sách cho kênh/nhóm, nhà cung cấp, sandbox và cho phép/từ chối theo từng tác tử
vẫn có thể loại bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ hiệu lực.

**Mặc định:**

- **Mô hình:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng tác tử); `sessions_spawn.model` rõ ràng vẫn được ưu tiên.
- **Thinking:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng tác tử); `sessions_spawn.thinking` rõ ràng vẫn được ưu tiên.
- **Thời gian chờ lần chạy:** nếu bỏ qua `sessions_spawn.runTimeoutSeconds`, OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi đã đặt; nếu không, nó quay về `0` (không có thời gian chờ).

### Tham số công cụ

<ParamField path="task" type="string" required>
  Mô tả tác vụ cho tác tử con.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn, người đọc được.
</ParamField>
<ParamField path="agentId" type="string">
  Tạo dưới một id tác tử khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho harness ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode`, hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ ACP. Tiếp tục một phiên harness ACP hiện có khi `runtime: "acp"`; bị bỏ qua với các lần tạo tác tử con gốc.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ ACP. Truyền trực tuyến đầu ra lần chạy ACP đến phiên cha khi `runtime: "acp"`; bỏ qua với các lần tạo tác tử con gốc.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình tác tử con. Giá trị không hợp lệ bị bỏ qua và tác tử con chạy trên mô hình mặc định với cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức thinking cho lần chạy tác tử con.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi đã đặt, nếu không là `0`. Khi được đặt, lần chạy tác tử con sẽ bị hủy sau N giây.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu liên kết luồng kênh cho phiên tác tử con này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi thông qua đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối tạo trừ khi runtime con đích được sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` nhánh bản ghi hiện tại của bên yêu cầu vào phiên con. Chỉ dành cho tác tử con gốc. Chỉ dùng `fork` khi tác tử con cần bản ghi hiện tại.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận tham số gửi qua kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Để gửi, dùng
`message`/`sessions_send` từ lần chạy đã tạo.
</Warning>

## Phiên liên kết luồng

Khi liên kết luồng được bật cho một kênh, tác tử con có thể duy trì liên kết
với một luồng để các tin nhắn theo dõi của người dùng trong luồng đó tiếp tục được định tuyến đến
cùng phiên tác tử con.

### Kênh hỗ trợ luồng

**Discord** hiện là kênh duy nhất được hỗ trợ. Nó hỗ trợ
các phiên tác tử con liên kết luồng bền vững (`sessions_spawn` với
`thread: true`), điều khiển luồng thủ công (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), và các khóa adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, và
`channels.discord.threadBindings.spawnSubagentSessions`.

### Luồng nhanh

<Steps>
  <Step title="Tạo">
    `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"`).
  </Step>
  <Step title="Liên kết">
    OpenClaw tạo hoặc liên kết một luồng với mục tiêu phiên đó trong kênh hoạt động.
  </Step>
  <Step title="Định tuyến theo dõi">
    Các phản hồi và tin nhắn theo dõi trong luồng đó được định tuyến đến phiên đã liên kết.
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

| Lệnh               | Tác dụng                                                              |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Ràng buộc luồng hiện tại (hoặc tạo một luồng) với mục tiêu tác nhân phụ/phiên |
| `/unfocus`         | Gỡ ràng buộc cho luồng hiện đang được ràng buộc                       |
| `/agents`          | Liệt kê các lần chạy đang hoạt động và trạng thái ràng buộc (`thread:<id>` hoặc `unbound`) |
| `/session idle`    | Kiểm tra/cập nhật tự động bỏ focus khi nhàn rỗi (chỉ các luồng được ràng buộc đang focus) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng được ràng buộc đang focus) |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Ghi đè theo kênh và khóa tự động ràng buộc khi tạo** là đặc thù theo adapter. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh slash](/vi/tools/slash-commands) để biết chi tiết adapter hiện tại.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách id tác nhân có thể được nhắm mục tiêu qua `agentId` tường minh (`["*"]` cho phép bất kỳ). Mặc định: chỉ tác nhân yêu cầu. Nếu bạn đặt một danh sách và vẫn muốn tác nhân yêu cầu tự tạo chính nó bằng `agentId`, hãy đưa id của tác nhân yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép tác nhân mục tiêu mặc định được dùng khi tác nhân yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ tường minh). Ghi đè theo từng tác nhân: `agents.list[].subagents.requireAgentId`.
</ParamField>

Nếu phiên yêu cầu bị sandbox, `sessions_spawn` sẽ từ chối các mục tiêu
sẽ chạy không sandbox.

### Khám phá

Dùng `agents_list` để xem những id tác nhân nào hiện được phép cho
`sessions_spawn`. Phản hồi bao gồm model hiệu lực của từng tác nhân được
liệt kê và metadata runtime nhúng để bên gọi có thể phân biệt PI, máy chủ
ứng dụng Codex và các runtime gốc đã cấu hình khác.

### Tự động lưu trữ

- Các phiên tác nhân phụ được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Lưu trữ dùng `sessions.delete` và đổi tên bản ghi phiên thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi phiên thông qua đổi tên).
- Tự động lưu trữ là nỗ lực tốt nhất; các bộ hẹn giờ đang chờ sẽ mất nếu Gateway khởi động lại.
- `runTimeoutSeconds` **không** tự động lưu trữ; nó chỉ dừng lần chạy. Phiên vẫn còn cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các tab/tiến trình trình duyệt được theo dõi sẽ được đóng theo nỗ lực tốt nhất khi lần chạy kết thúc, ngay cả khi bản ghi phiên/bản ghi transcript được giữ lại.

## Tác nhân phụ lồng nhau

Theo mặc định, tác nhân phụ không thể tạo tác nhân phụ của riêng chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp lồng nhau
— **mẫu orchestrator**: chính → tác nhân phụ orchestrator →
tác nhân phụ cấp hai worker.

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
| 1     | `agent:<id>:subagent:<uuid>`                 | Tác nhân phụ (orchestrator khi cho phép độ sâu 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Tác nhân phụ cấp hai (worker lá)             | Không bao giờ                |

### Chuỗi thông báo

Kết quả chảy ngược lên chuỗi:

1. Worker độ sâu 2 hoàn tất → thông báo cho cha của nó (orchestrator độ sâu 1).
2. Orchestrator độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho chính.
3. Tác nhân chính nhận thông báo và gửi tới người dùng.

Mỗi cấp chỉ thấy thông báo từ các con trực tiếp của nó.

<Note>
**Hướng dẫn vận hành:** khởi động công việc con một lần và chờ sự kiện
hoàn tất thay vì xây các vòng lặp thăm dò quanh `sessions_list`,
`sessions_history`, `/subagents list` hoặc lệnh ngủ `exec`.
`sessions_list` và `/subagents list` giữ quan hệ phiên con tập trung
vào công việc đang hoạt động — các con đang hoạt động vẫn được gắn, các con đã kết thúc vẫn
hiển thị trong một cửa sổ gần đây ngắn, và các liên kết con chỉ còn trong store đã cũ
sẽ bị bỏ qua sau cửa sổ độ mới của chúng. Điều này ngăn metadata `spawnedBy` /
`parentSessionKey` cũ làm sống lại các con ma sau khi
khởi động lại. Nếu sự kiện hoàn tất của con đến sau khi bạn đã gửi
câu trả lời cuối cùng, phản hồi tiếp theo đúng là token im lặng chính xác
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được ghi vào metadata phiên tại thời điểm tạo. Điều đó giữ cho các khóa phiên phẳng hoặc được khôi phục không vô tình lấy lại đặc quyền orchestrator.
- **Độ sâu 1 (orchestrator, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể quản lý các con. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (worker lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể tạo thêm con.

### Giới hạn tạo theo từng tác nhân

Mỗi phiên tác nhân (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) con đang hoạt động cùng lúc. Điều này ngăn một orchestrator
đơn lẻ mở rộng quá mức không kiểm soát.

### Dừng theo tầng

Dừng một orchestrator độ sâu 1 sẽ tự động dừng tất cả các con độ sâu 2
của nó:

- `/stop` trong cuộc trò chuyện chính dừng tất cả tác nhân độ sâu 1 và lan xuống các con độ sâu 2 của chúng.
- `/subagents kill <id>` dừng một tác nhân phụ cụ thể và lan xuống các con của nó.
- `/subagents kill all` dừng tất cả tác nhân phụ cho bên yêu cầu và lan xuống.

## Xác thực

Xác thực tác nhân phụ được phân giải theo **id tác nhân**, không theo loại phiên:

- Khóa phiên tác nhân phụ là `agent:<agentId>:subagent:<uuid>`.
- Kho xác thực được tải từ `agentDir` của tác nhân đó.
- Các hồ sơ xác thực của tác nhân chính được hợp nhất làm **dự phòng**; hồ sơ tác nhân ghi đè hồ sơ chính khi có xung đột.

Việc hợp nhất là cộng thêm, nên hồ sơ chính luôn có sẵn làm
dự phòng. Xác thực tách biệt hoàn toàn theo từng tác nhân hiện chưa được hỗ trợ.

## Thông báo

Tác nhân phụ báo cáo lại thông qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác nhân phụ (không phải phiên của bên yêu cầu).
- Nếu tác nhân phụ trả lời chính xác `ANNOUNCE_SKIP`, sẽ không có gì được đăng.
- Nếu văn bản trợ lý mới nhất là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo bị triệt tiêu ngay cả khi trước đó từng có tiến trình hiển thị.

Việc gửi phụ thuộc vào độ sâu của bên yêu cầu:

- Các phiên bên yêu cầu cấp cao nhất dùng một lệnh gọi `agent` tiếp nối với gửi bên ngoài (`deliver=true`).
- Các phiên subagent bên yêu cầu lồng nhau nhận một lần chèn tiếp nối nội bộ (`deliver=false`) để orchestrator có thể tổng hợp kết quả con trong phiên.
- Nếu một phiên subagent bên yêu cầu lồng nhau đã biến mất, OpenClaw sẽ fallback về bên yêu cầu của phiên đó khi có.

Đối với các phiên bên yêu cầu cấp cao nhất, gửi trực tiếp ở chế độ hoàn tất trước tiên
phân giải mọi tuyến hội thoại/luồng đã ràng buộc và ghi đè hook, rồi điền
các trường đích kênh còn thiếu từ tuyến đã lưu của phiên bên yêu cầu.
Điều đó giữ các hoàn tất trong đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn gốc
hoàn tất chỉ xác định kênh.

Tổng hợp hoàn tất của con được giới hạn trong lần chạy hiện tại của bên yêu cầu khi
xây dựng các phát hiện hoàn tất lồng nhau, ngăn đầu ra con từ lần chạy cũ
rò rỉ vào thông báo hiện tại. Các phản hồi thông báo giữ nguyên
định tuyến luồng/chủ đề khi adapter kênh có sẵn.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường         | Nguồn                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguồn          | `subagent` hoặc `cron`                                                                                        |
| Id phiên       | Khóa/id phiên con                                                                                             |
| Loại           | Loại thông báo + nhãn tác vụ                                                                                  |
| Trạng thái     | Suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`) — **không** suy ra từ văn bản model |
| Nội dung kết quả | Văn bản trợ lý hiển thị mới nhất, nếu không thì văn bản tool/toolResult mới nhất đã được làm sạch           |
| Tiếp nối       | Hướng dẫn mô tả khi nào trả lời so với giữ im lặng                                                            |

Các lần chạy kết thúc với lỗi báo cáo trạng thái lỗi mà không phát lại
văn bản trả lời đã thu được. Khi timeout, nếu con chỉ kịp đi qua các lệnh gọi công cụ,
thông báo có thể thu gọn lịch sử đó thành một tóm tắt tiến trình một phần ngắn
thay vì phát lại đầu ra công cụ thô.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc):

- Runtime (ví dụ `runtime 5m12s`).
- Mức dùng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi giá model được cấu hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` và đường dẫn transcript để tác nhân chính có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Metadata nội bộ chỉ dành cho điều phối; phản hồi hướng tới người dùng
nên được viết lại bằng giọng trợ lý bình thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là đường dẫn điều phối an toàn hơn:

- Nội dung nhớ lại của trợ lý được chuẩn hóa trước: thẻ suy nghĩ bị loại bỏ; khung `<relevant-memories>` / `<relevant_memories>` bị loại bỏ; các khối payload XML lệnh gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) bị loại bỏ, bao gồm cả payload bị cắt cụt không bao giờ đóng sạch; khung tool-call/result bị hạ cấp và các marker ngữ cảnh lịch sử bị loại bỏ; token điều khiển model bị rò rỉ (`<|assistant|>`, các ASCII `<|...|>` khác, dạng full-width `<｜...｜>`) bị loại bỏ; XML tool-call MiniMax sai định dạng bị loại bỏ.
- Văn bản giống thông tin xác thực/token được biên tập.
- Các khối dài có thể bị cắt ngắn.
- Lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá cỡ bằng `[sessions_history omitted: message too large]`.
- Kiểm tra transcript thô trên đĩa là phương án dự phòng khi bạn cần transcript đầy đủ chính xác từng byte.

## Chính sách công cụ

Tác nhân phụ dùng cùng hồ sơ và pipeline chính sách công cụ như tác nhân cha hoặc
tác nhân mục tiêu trước. Sau đó, OpenClaw áp dụng lớp hạn chế
tác nhân phụ.

Khi không có `tools.profile` hạn chế, tác nhân phụ nhận **tất cả công cụ ngoại trừ
công cụ phiên** và công cụ hệ thống:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` vẫn là một chế độ xem nhớ lại có giới hạn, đã làm sạch ở đây —
nó không phải là bản đổ transcript thô.

Khi `maxSpawnDepth >= 2`, các tác nhân phụ orchestrator độ sâu 1 cũng
nhận `sessions_spawn`, `subagents`, `sessions_list` và
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

`tools.subagents.tools.allow` là bộ lọc allow-only cuối cùng. Nó có thể thu hẹp
tập công cụ đã được phân giải, nhưng không thể **thêm lại** một công cụ đã bị
`tools.profile` loại bỏ. Ví dụ: `tools.profile: "coding"` bao gồm
`web_search`/`web_fetch` nhưng không bao gồm công cụ `browser`. Để cho phép
các tác tử phụ dùng hồ sơ coding sử dụng tự động hóa trình duyệt, hãy thêm browser ở
giai đoạn hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Sử dụng `agents.list[].tools.alsoAllow: ["browser"]` theo từng tác tử khi chỉ một
tác tử cần có tự động hóa trình duyệt.

## Tính đồng thời

Tác tử phụ sử dụng một làn hàng đợi trong tiến trình chuyên dụng:

- **Tên làn:** `subagent`
- **Tính đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Tính sống và khôi phục

OpenClaw không xem việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một
tác tử phụ vẫn còn sống. Các lượt chạy chưa kết thúc cũ hơn khoảng thời gian stale-run
sẽ ngừng được tính là active/pending trong `/subagents list`, tóm tắt trạng thái,
cổng chặn hoàn tất hậu duệ và các kiểm tra tính đồng thời theo phiên.

Sau khi Gateway khởi động lại, các lượt chạy đã khôi phục nhưng chưa kết thúc và đã lỗi thời sẽ bị cắt bỏ, trừ khi
phiên con của chúng được đánh dấu `abortedLastRun: true`. Các
phiên con bị hủy do khởi động lại đó vẫn có thể khôi phục qua luồng khôi phục
tác tử phụ mồ côi, luồng này gửi một thông báo tiếp tục tổng hợp trước khi
xóa dấu đã hủy.

<Note>
Nếu việc tạo tác tử phụ thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra bên gọi RPC trước khi chỉnh sửa trạng thái ghép đôi.
Điều phối `sessions_spawn` nội bộ nên kết nối dưới dạng
`client.id: "gateway-client"` với `client.mode: "backend"` qua xác thực
shared-token/password trên local loopback trực tiếp; đường dẫn đó không phụ thuộc vào
đường cơ sở phạm vi thiết bị đã ghép đôi của CLI. Các bên gọi từ xa, `deviceIdentity`
tường minh, đường dẫn device-token tường minh và các máy khách browser/node
vẫn cần phê duyệt thiết bị bình thường cho nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên của bên yêu cầu và dừng mọi lượt chạy tác tử phụ đang hoạt động được tạo từ phiên đó, lan truyền tới các con lồng nhau.
- `/subagents kill <id>` dừng một tác tử phụ cụ thể và lan truyền tới các con của nó.

## Giới hạn

- Thông báo tác tử phụ là **nỗ lực tối đa**. Nếu Gateway khởi động lại, công việc "announce back" đang chờ sẽ bị mất.
- Tác tử phụ vẫn dùng chung tài nguyên của cùng một tiến trình Gateway; hãy xem `maxConcurrent` như một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác tử phụ chỉ chèn `AGENTS.md` + `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`).
- Độ sâu lồng nhau tối đa là 5 (phạm vi `maxSpawnDepth`: 1–5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số con đang hoạt động trên mỗi phiên (mặc định `5`, phạm vi `1–20`).

## Liên quan

- [Tác tử ACP](/vi/tools/acp-agents)
- [Gửi tác tử](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác tử](/vi/tools/multi-agent-sandbox-tools)
