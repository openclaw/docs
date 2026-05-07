---
read_when:
    - Bạn muốn thực hiện công việc chạy nền hoặc song song thông qua tác nhân
    - Bạn đang thay đổi chính sách về sessions_spawn hoặc công cụ tác nhân phụ
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên tác nhân phụ gắn với luồng
sidebarTitle: Sub-agents
summary: Tạo các lượt chạy tác tử nền cô lập thông báo kết quả về lại cuộc trò chuyện của người yêu cầu
title: Tác nhân phụ
x-i18n:
    generated_at: "2026-05-07T13:26:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agent là các lượt chạy agent nền được sinh ra từ một lượt chạy agent hiện có.
Chúng chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả trở lại kênh trò chuyện của bên yêu cầu.
Mỗi lượt chạy sub-agent được theo dõi như một
[tác vụ nền](/vi/automation/tasks).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn lượt chạy chính.
- Giữ sub-agent mặc định được cô lập (tách phiên + sandbox tùy chọn).
- Giữ bề mặt công cụ khó bị dùng sai: sub-agent mặc định **không** nhận công cụ phiên.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu orchestrator.

<Note>
**Ghi chú chi phí:** mỗi sub-agent mặc định có ngữ cảnh và mức dùng token riêng.
Với các tác vụ nặng hoặc lặp lại, hãy đặt model rẻ hơn cho sub-agent
và giữ agent chính trên một model chất lượng cao hơn. Cấu hình qua
`agents.defaults.subagents.model` hoặc ghi đè theo từng agent. Khi một agent con
    thực sự cần transcript hiện tại của bên yêu cầu, agent có thể yêu cầu
    `context: "fork"` trên đúng lượt sinh đó. Các phiên subagent gắn với luồng mặc định
    dùng `context: "fork"` vì chúng rẽ nhánh cuộc trò chuyện hiện tại thành một
    luồng theo dõi.
</Note>

## Lệnh slash

Dùng `/subagents` để kiểm tra hoặc điều khiển các lượt chạy sub-agent cho **phiên
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

Dùng [`/steer <message>`](/vi/tools/steer) cấp cao nhất để điều hướng lượt chạy đang hoạt động của phiên yêu cầu hiện tại. Dùng `/subagents steer <id|#> <message>` khi mục tiêu là một lượt chạy con.

`/subagents info` hiển thị metadata của lượt chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn transcript, dọn dẹp). Dùng `sessions_history` để xem dạng nhớ lại có giới hạn,
đã lọc an toàn; kiểm tra đường dẫn transcript trên đĩa khi bạn
cần transcript thô đầy đủ.

### Điều khiển gắn luồng

Các lệnh này hoạt động trên những kênh hỗ trợ gắn luồng bền vững.
Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi sinh

`/subagents spawn` khởi động một sub-agent nền dưới dạng lệnh người dùng (không phải
relay nội bộ) và gửi một cập nhật hoàn tất cuối cùng trở lại
trò chuyện của bên yêu cầu khi lượt chạy kết thúc.

<AccordionGroup>
  <Accordion title="Hoàn tất không chặn, dựa trên push">
    - Lệnh sinh không chặn; nó trả về id lượt chạy ngay lập tức.
    - Khi hoàn tất, sub-agent thông báo một thông điệp tóm tắt/kết quả trở lại kênh trò chuyện của bên yêu cầu.
    - Việc hoàn tất dựa trên push. Sau khi đã sinh, **không** poll `/subagents list`, `sessions_list`, hoặc `sessions_history` trong vòng lặp chỉ để chờ nó kết thúc; chỉ kiểm tra trạng thái theo nhu cầu để gỡ lỗi hoặc can thiệp.
    - Khi hoàn tất, OpenClaw cố gắng đóng các tab trình duyệt/tiến trình được theo dõi do phiên sub-agent đó mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Khả năng phục hồi phân phối khi sinh thủ công">
    - OpenClaw trao phần hoàn tất lại cho phiên yêu cầu thông qua một lượt `agent` với khóa idempotency ổn định.
    - Nếu lượt chạy của bên yêu cầu vẫn đang hoạt động, trước tiên OpenClaw cố đánh thức/điều hướng lượt chạy đó thay vì bắt đầu một đường phản hồi hiển thị thứ hai.
    - Nếu quá trình bàn giao hoàn tất cho agent yêu cầu thất bại hoặc không tạo đầu ra hiển thị, OpenClaw xem việc phân phối là thất bại và quay về định tuyến hàng đợi/thử lại. Nó không gửi thô kết quả của agent con trực tiếp tới cuộc trò chuyện bên ngoài.
    - Nếu không thể dùng bàn giao trực tiếp, nó quay về định tuyến hàng đợi.
    - Nếu định tuyến hàng đợi vẫn không khả dụng, thông báo sẽ được thử lại với backoff hàm mũ ngắn trước khi từ bỏ cuối cùng.
    - Phân phối hoàn tất giữ tuyến bên yêu cầu đã được phân giải: các tuyến hoàn tất gắn với luồng hoặc gắn với cuộc trò chuyện thắng khi có; nếu nguồn gốc hoàn tất chỉ cung cấp một kênh, OpenClaw điền mục tiêu/tài khoản còn thiếu từ tuyến đã phân giải của phiên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để phân phối trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Metadata bàn giao hoàn tất">
    Bàn giao hoàn tất cho phiên yêu cầu là ngữ cảnh nội bộ được tạo lúc chạy
    (không phải văn bản do người dùng viết) và bao gồm:

    - `Result` — văn bản trả lời `assistant` hiển thị mới nhất, nếu không thì văn bản tool/toolResult mới nhất đã được làm sạch. Các lượt chạy thất bại ở trạng thái kết thúc không tái sử dụng văn bản trả lời đã ghi lại.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Thống kê runtime/token dạng gọn.
    - Một chỉ dẫn phân phối yêu cầu agent bên yêu cầu viết lại bằng giọng assistant bình thường (không chuyển tiếp metadata nội bộ thô).

  </Accordion>
  <Accordion title="Chế độ và runtime ACP">
    - `--model` và `--thinking` ghi đè mặc định cho riêng lượt chạy đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - `/subagents spawn` là chế độ một lần (`mode: "run"`). Với các phiên gắn luồng bền vững, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Với các phiên harness ACP (Claude Code, Gemini CLI, OpenCode, hoặc Codex ACP/acpx rõ ràng), dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [mô hình phân phối ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi phần hoàn tất hoặc vòng lặp agent-tới-agent. Khi Plugin `codex` được bật, điều khiển trò chuyện/luồng Codex nên ưu tiên `/codex ...` thay vì ACP trừ khi người dùng yêu cầu rõ ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không bị sandbox, và một Plugin backend như `acpx` đã được tải. `runtime: "acp"` kỳ vọng một id harness ACP bên ngoài, hoặc một mục `agents.list[]` với `runtime.type="acp"`; dùng runtime sub-agent mặc định cho các agent cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Sub-agent native khởi động cô lập trừ khi bên gọi yêu cầu rõ ràng fork
transcript hiện tại.

| Chế độ     | Khi nào dùng                                                                                                                           | Hành vi                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm, hoặc bất cứ thứ gì có thể được tóm tắt trong văn bản tác vụ                | Tạo transcript con sạch. Đây là mặc định và giữ mức dùng token thấp hơn.          |
| `fork`     | Công việc phụ thuộc vào cuộc trò chuyện hiện tại, kết quả công cụ trước đó, hoặc chỉ dẫn tinh tế đã có trong transcript của bên yêu cầu | Rẽ nhánh transcript của bên yêu cầu vào phiên con trước khi agent con khởi động. |

Dùng `fork` một cách tiết kiệm. Nó dành cho ủy quyền nhạy với ngữ cảnh, không phải
thay thế cho việc viết prompt tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Khởi động một lượt chạy sub-agent với `deliver: false` trên lane `subagent` toàn cục,
sau đó chạy bước thông báo và đăng phản hồi thông báo vào kênh trò chuyện của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu lực của bên gọi. Các profile `coding` và
`full` mặc định hiển thị `sessions_spawn`. Profile `messaging`
thì không; thêm `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hoặc dùng `tools.profile: "coding"` cho các agent cần ủy quyền
công việc. Chính sách cho kênh/nhóm, provider, sandbox, và allow/deny theo từng agent vẫn có thể
loại bỏ công cụ sau giai đoạn profile. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ hiệu lực.

**Mặc định:**

- **Model:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng agent); `sessions_spawn.model` rõ ràng vẫn thắng.
- **Thinking:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng agent); `sessions_spawn.thinking` rõ ràng vẫn thắng.
- **Thời gian chờ lượt chạy:** nếu bỏ qua `sessions_spawn.runTimeoutSeconds`, OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó quay về `0` (không timeout).

### Tham số công cụ

<ParamField path="task" type="string" required>
  Mô tả tác vụ cho sub-agent.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn, con người đọc được.
</ParamField>
<ParamField path="agentId" type="string">
  Sinh dưới một id agent khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các harness ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode`, hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ ACP. Tiếp tục một phiên harness ACP hiện có khi `runtime: "acp"`; bị bỏ qua với các lượt sinh sub-agent native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ ACP. Truyền đầu ra lượt chạy ACP tới phiên cha khi `runtime: "acp"`; bỏ qua với các lượt sinh sub-agent native.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè model của sub-agent. Giá trị không hợp lệ bị bỏ qua và sub-agent chạy trên model mặc định cùng một cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức thinking cho lượt chạy sub-agent.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi được đặt, nếu không là `0`. Khi được đặt, lượt chạy sub-agent bị hủy sau N giây.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu gắn luồng kênh cho phiên sub-agent này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ ngay sau khi thông báo (vẫn giữ transcript thông qua đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối sinh trừ khi runtime con mục tiêu được sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rẽ nhánh transcript hiện tại của bên yêu cầu vào phiên con. Chỉ sub-agent native. Lượt sinh gắn luồng mặc định dùng `fork`; lượt sinh không gắn luồng mặc định dùng `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận tham số phân phối kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Để phân phối, dùng
`message`/`sessions_send` từ lượt chạy đã sinh.
</Warning>

## Phiên gắn luồng

Khi gắn luồng được bật cho một kênh, sub-agent có thể tiếp tục gắn
với một luồng để các tin nhắn theo dõi của người dùng trong luồng đó tiếp tục định tuyến tới
cùng phiên sub-agent.

### Các kênh hỗ trợ luồng

**Discord** hiện là kênh duy nhất được hỗ trợ. Nó hỗ trợ
các phiên subagent gắn luồng bền vững (`sessions_spawn` với
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
  <Step title="Liên kết">
    OpenClaw tạo hoặc liên kết một luồng với mục tiêu phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Định tuyến các phản hồi tiếp theo">
    Các câu trả lời và tin nhắn tiếp theo trong luồng đó được định tuyến tới phiên đã liên kết.
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

| Lệnh               | Hiệu ứng                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Liên kết luồng hiện tại (hoặc tạo một luồng) với mục tiêu sub-agent/phiên |
| `/unfocus`         | Xóa liên kết cho luồng hiện đang được liên kết                        |
| `/agents`          | Liệt kê các lượt chạy đang hoạt động và trạng thái liên kết (`thread:<id>` hoặc `unbound`) |
| `/session idle`    | Kiểm tra/cập nhật tự động bỏ tập trung khi nhàn rỗi (chỉ các luồng đã liên kết đang được tập trung) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng đã liên kết đang được tập trung) |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Ghi đè theo kênh và khóa tự động liên kết khi tạo** phụ thuộc vào adapter. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết chi tiết adapter hiện tại.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách các id agent có thể được nhắm mục tiêu qua `agentId` rõ ràng (`["*"]` cho phép bất kỳ id nào). Mặc định: chỉ agent yêu cầu. Nếu bạn đặt một danh sách và vẫn muốn agent yêu cầu tự tạo chính nó bằng `agentId`, hãy đưa id của agent yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép agent mục tiêu mặc định được dùng khi agent yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng). Ghi đè theo agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Nếu phiên yêu cầu được sandbox, `sessions_spawn` sẽ từ chối các mục tiêu
sẽ chạy không trong sandbox.

### Khám phá

Dùng `agents_list` để xem các id agent nào hiện được phép cho
`sessions_spawn`. Phản hồi bao gồm model hiệu dụng của từng agent được liệt kê
và siêu dữ liệu runtime nhúng để bên gọi có thể phân biệt PI, máy chủ ứng dụng Codex
và các runtime gốc đã cấu hình khác.

### Tự động lưu trữ

- Các phiên sub-agent được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Lưu trữ dùng `sessions.delete` và đổi tên transcript thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ transcript qua đổi tên).
- Tự động lưu trữ là nỗ lực tối đa; các bộ hẹn giờ đang chờ sẽ bị mất nếu gateway khởi động lại.
- `runTimeoutSeconds` **không** tự động lưu trữ; nó chỉ dừng lượt chạy. Phiên vẫn còn cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các tab/quy trình trình duyệt được theo dõi sẽ được đóng theo nỗ lực tối đa khi lượt chạy kết thúc, ngay cả khi bản ghi transcript/phiên được giữ lại.

## Sub-agent lồng nhau

Theo mặc định, sub-agent không thể tạo sub-agent của riêng chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu orchestrator**: chính → sub-agent orchestrator →
sub-sub-agent worker.

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
| 0     | `agent:<id>:main`                            | Agent chính                                  | Luôn luôn                    |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrator khi cho phép độ sâu 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (worker lá)                    | Không bao giờ                |

### Chuỗi thông báo

Kết quả chảy ngược lên theo chuỗi:

1. Worker độ sâu 2 hoàn tất → thông báo cho cha của nó (orchestrator độ sâu 1).
2. Orchestrator độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho chính.
3. Agent chính nhận thông báo và gửi tới người dùng.

Mỗi cấp chỉ thấy thông báo từ các con trực tiếp của nó.

<Note>
**Hướng dẫn vận hành:** bắt đầu công việc con một lần và chờ các sự kiện hoàn tất
thay vì xây dựng vòng lặp thăm dò quanh `sessions_list`,
`sessions_history`, `/subagents list`, hoặc các lệnh ngủ `exec`.
`sessions_list` và `/subagents list` giữ các mối quan hệ phiên con
tập trung vào công việc đang chạy — các con đang chạy vẫn được gắn, các con đã kết thúc vẫn
hiển thị trong một cửa sổ gần đây ngắn, và các liên kết con chỉ còn trong store đã lỗi thời sẽ
bị bỏ qua sau cửa sổ độ mới của chúng. Điều này ngăn siêu dữ liệu `spawnedBy` /
`parentSessionKey` cũ làm sống lại các con ma sau khi
khởi động lại. Nếu sự kiện hoàn tất của con đến sau khi bạn đã gửi
câu trả lời cuối cùng, phản hồi tiếp theo đúng là token im lặng chính xác
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được ghi vào siêu dữ liệu phiên tại thời điểm tạo. Điều đó ngăn các khóa phiên phẳng hoặc đã khôi phục vô tình lấy lại đặc quyền orchestrator.
- **Độ sâu 1 (orchestrator, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể quản lý các con của nó. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (worker lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể tạo thêm con.

### Giới hạn tạo theo agent

Mỗi phiên agent (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) con đang hoạt động tại một thời điểm. Điều này ngăn việc phân nhánh mất kiểm soát
từ một orchestrator duy nhất.

### Dừng dây chuyền

Dừng một orchestrator độ sâu 1 tự động dừng tất cả các con độ sâu 2
của nó:

- `/stop` trong cuộc trò chuyện chính dừng tất cả agent độ sâu 1 và lan truyền đến các con độ sâu 2 của chúng.
- `/subagents kill <id>` dừng một sub-agent cụ thể và lan truyền đến các con của nó.
- `/subagents kill all` dừng tất cả sub-agent cho bên yêu cầu và lan truyền.

## Xác thực

Xác thực sub-agent được phân giải theo **id agent**, không theo loại phiên:

- Khóa phiên sub-agent là `agent:<agentId>:subagent:<uuid>`.
- Store xác thực được tải từ `agentDir` của agent đó.
- Hồ sơ xác thực của agent chính được hợp nhất làm **dự phòng**; hồ sơ agent ghi đè hồ sơ chính khi xung đột.

Việc hợp nhất là cộng thêm, nên hồ sơ chính luôn có sẵn làm
dự phòng. Xác thực tách biệt hoàn toàn theo agent hiện chưa được hỗ trợ.

## Thông báo

Sub-agent báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên sub-agent (không phải phiên yêu cầu).
- Nếu sub-agent trả lời chính xác `ANNOUNCE_SKIP`, không có gì được đăng.
- Nếu văn bản assistant mới nhất là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo bị chặn ngay cả khi trước đó đã có tiến trình hiển thị.

Việc gửi phụ thuộc vào độ sâu của bên yêu cầu:

- Các phiên yêu cầu cấp cao nhất dùng một lệnh gọi `agent` tiếp theo với gửi bên ngoài (`deliver=true`).
- Các phiên subagent yêu cầu lồng nhau nhận một lần chèn theo dõi nội bộ (`deliver=false`) để orchestrator có thể tổng hợp kết quả con trong phiên.
- Nếu một phiên subagent yêu cầu lồng nhau đã biến mất, OpenClaw quay về bên yêu cầu của phiên đó khi có sẵn.

Đối với các phiên yêu cầu cấp cao nhất, gửi trực tiếp ở chế độ hoàn tất trước tiên
phân giải mọi tuyến hội thoại/luồng đã liên kết và ghi đè hook, sau đó điền
các trường mục tiêu kênh còn thiếu từ tuyến được lưu của phiên yêu cầu.
Điều đó giữ các hoàn tất trong đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn gốc hoàn tất
chỉ xác định kênh.

Tổng hợp hoàn tất của con được giới hạn trong lượt chạy bên yêu cầu hiện tại khi
xây dựng các phát hiện hoàn tất lồng nhau, ngăn đầu ra con của lượt chạy trước đã lỗi thời
rò rỉ vào thông báo hiện tại. Các câu trả lời thông báo bảo toàn
định tuyến luồng/chủ đề khi có trên adapter kênh.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường          | Nguồn                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguồn          | `subagent` hoặc `cron`                                                                                        |
| Id phiên       | Khóa/id phiên con                                                                                             |
| Loại           | Loại thông báo + nhãn tác vụ                                                                                  |
| Trạng thái     | Suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`) — **không** suy luận từ văn bản model |
| Nội dung kết quả | Văn bản assistant hiển thị mới nhất, nếu không thì văn bản công cụ/toolResult mới nhất đã được làm sạch     |
| Theo dõi       | Chỉ dẫn mô tả khi nào nên trả lời so với giữ im lặng                                                          |

Các lượt chạy thất bại ở trạng thái cuối báo cáo trạng thái lỗi mà không phát lại
văn bản trả lời đã ghi lại. Khi hết thời gian, nếu con chỉ đi qua các lệnh gọi công cụ,
thông báo có thể thu gọn lịch sử đó thành một bản tóm tắt tiến trình một phần ngắn
thay vì phát lại đầu ra công cụ thô.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc):

- Runtime (ví dụ `runtime 5m12s`).
- Mức dùng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi giá model được cấu hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, và đường dẫn transcript để agent chính có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Siêu dữ liệu nội bộ chỉ dành cho điều phối; các câu trả lời hướng tới người dùng
nên được viết lại bằng giọng assistant bình thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là đường điều phối an toàn hơn:

- Khả năng nhớ lại của assistant được chuẩn hóa trước: loại bỏ thẻ suy nghĩ; loại bỏ khung `<relevant-memories>` / `<relevant_memories>`; loại bỏ các khối payload XML lệnh gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), bao gồm cả payload bị cắt ngắn không bao giờ đóng sạch; loại bỏ khung lệnh gọi/kết quả công cụ đã hạ cấp và marker ngữ cảnh lịch sử; loại bỏ token điều khiển model bị rò rỉ (`<|assistant|>`, các ASCII `<|...|>` khác, dạng toàn chiều rộng `<｜...｜>`); loại bỏ XML lệnh gọi công cụ MiniMax sai dạng.
- Văn bản giống thông tin xác thực/token được biên tập ẩn.
- Các khối dài có thể bị cắt ngắn.
- Các lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá cỡ bằng `[sessions_history omitted: message too large]`.
- Kiểm tra transcript thô trên đĩa là phương án dự phòng khi bạn cần transcript đầy đủ từng byte một.

## Chính sách công cụ

Các tác nhân con trước tiên sử dụng cùng hồ sơ và quy trình chính sách công cụ như tác nhân cha hoặc tác nhân đích. Sau đó, OpenClaw áp dụng lớp hạn chế dành cho tác nhân con.

Khi không có `tools.profile` mang tính hạn chế, tác nhân con nhận được **tất cả công cụ ngoại trừ công cụ phiên** và công cụ hệ thống:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` ở đây cũng vẫn là một chế độ xem truy hồi có giới hạn và đã được làm sạch — không phải bản xuất thô của transcript.

Khi `maxSpawnDepth >= 2`, các tác nhân con điều phối ở độ sâu 1 còn nhận thêm `sessions_spawn`, `subagents`, `sessions_list`, và `sessions_history` để có thể quản lý các tác nhân con của chúng.

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

`tools.subagents.tools.allow` là bộ lọc chỉ-cho-phép cuối cùng. Nó có thể thu hẹp tập công cụ đã được phân giải, nhưng không thể **thêm lại** một công cụ đã bị loại bỏ bởi `tools.profile`. Ví dụ, `tools.profile: "coding"` bao gồm `web_search`/`web_fetch` nhưng không bao gồm công cụ `browser`. Để cho phép tác nhân con dùng hồ sơ coding sử dụng tự động hóa trình duyệt, hãy thêm browser ở giai đoạn hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Dùng `agents.list[].tools.alsoAllow: ["browser"]` theo từng tác nhân khi chỉ một tác nhân cần có tự động hóa trình duyệt.

## Tính đồng thời

Tác nhân con sử dụng một làn hàng đợi trong tiến trình chuyên dụng:

- **Tên làn:** `subagent`
- **Tính đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Tình trạng hoạt động và khôi phục

OpenClaw không xem việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một tác nhân con vẫn còn sống. Các lần chạy chưa kết thúc cũ hơn cửa sổ lần chạy lỗi thời sẽ ngừng được tính là đang hoạt động/đang chờ trong `/subagents list`, tóm tắt trạng thái, cổng hoàn tất hậu duệ, và kiểm tra đồng thời theo từng phiên.

Sau khi Gateway khởi động lại, các lần chạy đã khôi phục nhưng chưa kết thúc và đã lỗi thời sẽ bị cắt bỏ trừ khi phiên con của chúng được đánh dấu `abortedLastRun: true`. Những phiên con bị hủy do khởi động lại đó vẫn có thể được khôi phục thông qua luồng khôi phục tác nhân con mồ côi, luồng này gửi một thông điệp tiếp tục tổng hợp trước khi xóa dấu hủy.

Khôi phục tự động sau khởi động lại được giới hạn theo từng phiên con. Nếu cùng một tác nhân con được chấp nhận để khôi phục mồ côi nhiều lần trong cửa sổ kẹt lại nhanh, OpenClaw sẽ lưu một tombstone khôi phục trên phiên đó và ngừng tự động tiếp tục nó trong các lần khởi động lại sau. Chạy `openclaw tasks maintenance --apply` để đối chiếu bản ghi tác vụ, hoặc `openclaw doctor --fix` để xóa các cờ khôi phục đã hủy lỗi thời trên các phiên có tombstone.

<Note>
Nếu việc tạo tác nhân con thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra bên gọi RPC trước khi chỉnh sửa trạng thái ghép nối.
Điều phối `sessions_spawn` nội bộ nên kết nối dưới dạng
`client.id: "gateway-client"` với `client.mode: "backend"` qua xác thực bằng token chia sẻ/mật khẩu trực tiếp trên local loopback; đường dẫn đó không phụ thuộc vào đường cơ sở phạm vi thiết bị đã ghép nối của CLI. Các bên gọi từ xa, `deviceIdentity` tường minh, đường dẫn token thiết bị tường minh, và client trình duyệt/node vẫn cần phê duyệt thiết bị bình thường cho nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên của bên yêu cầu và dừng mọi lần chạy tác nhân con đang hoạt động được tạo từ đó, lan truyền xuống các tác nhân con lồng nhau.
- `/subagents kill <id>` dừng một tác nhân con cụ thể và lan truyền xuống các tác nhân con của nó.

## Giới hạn

- Thông báo tác nhân con là **nỗ lực tối đa**. Nếu gateway khởi động lại, công việc "thông báo lại" đang chờ sẽ bị mất.
- Tác nhân con vẫn dùng chung tài nguyên của cùng tiến trình gateway; hãy xem `maxConcurrent` như một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác nhân con chỉ chèn `AGENTS.md` + `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`).
- Độ sâu lồng tối đa là 5 (phạm vi `maxSpawnDepth`: 1–5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số tác nhân con đang hoạt động theo từng phiên (mặc định `5`, phạm vi `1–20`).

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
