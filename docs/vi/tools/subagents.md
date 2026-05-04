---
read_when:
    - Bạn muốn thực hiện công việc chạy nền hoặc song song thông qua tác nhân
    - Bạn đang thay đổi chính sách công cụ sessions_spawn hoặc công cụ tác nhân phụ
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên tác nhân phụ gắn với luồng
sidebarTitle: Sub-agents
summary: Khởi chạy các phiên chạy tác tử nền biệt lập để thông báo kết quả trở lại cuộc trò chuyện của người yêu cầu
title: Tác nhân con
x-i18n:
    generated_at: "2026-05-04T07:06:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65d60bf6813d667b7311aa28109d4bd6be012a16e638c64cfff130831db88cd8
    source_path: tools/subagents.md
    workflow: 16
---

Các sub-agent là các lượt chạy agent nền được tạo từ một lượt chạy agent hiện có.
Chúng chạy trong phiên riêng của mình (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả trở lại kênh trò chuyện của bên yêu cầu.
Mỗi lượt chạy sub-agent được theo dõi như một
[tác vụ nền](/vi/automation/tasks).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn lượt chạy chính.
- Giữ sub-agent được cô lập theo mặc định (tách phiên + sandbox tùy chọn).
- Giữ bề mặt công cụ khó bị dùng sai: sub-agent **không** có công cụ phiên theo mặc định.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu orchestrator.

<Note>
**Ghi chú chi phí:** mỗi sub-agent có ngữ cảnh và mức sử dụng token riêng theo
mặc định. Với các tác vụ nặng hoặc lặp lại, hãy đặt một model rẻ hơn cho sub-agent
và giữ agent chính của bạn dùng model chất lượng cao hơn. Cấu hình qua
`agents.defaults.subagents.model` hoặc ghi đè theo từng agent. Khi một child
    thật sự cần transcript hiện tại của bên yêu cầu, agent có thể yêu cầu
    `context: "fork"` trên đúng một lần tạo đó. Các phiên subagent gắn với thread mặc định
    dùng `context: "fork"` vì chúng rẽ nhánh cuộc trò chuyện hiện tại vào một
    thread theo dõi.
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

Dùng [`/steer <message>`](/vi/tools/steer) cấp cao nhất để điều hướng lượt chạy đang hoạt động của phiên bên yêu cầu hiện tại. Dùng `/subagents steer <id|#> <message>` khi mục tiêu là một lượt chạy child.

`/subagents info` hiển thị siêu dữ liệu lượt chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn transcript, dọn dẹp). Dùng `sessions_history` để có chế độ nhớ lại có giới hạn,
được lọc an toàn; kiểm tra đường dẫn transcript trên đĩa khi bạn
cần transcript đầy đủ thô.

### Điều khiển gắn kết thread

Các lệnh này hoạt động trên những kênh hỗ trợ gắn kết thread bền vững.
Xem [Các kênh hỗ trợ thread](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi tạo

`/subagents spawn` khởi động một sub-agent nền dưới dạng lệnh của người dùng (không phải một
relay nội bộ) và gửi một bản cập nhật hoàn tất cuối cùng trở lại cuộc trò chuyện của bên
yêu cầu khi lượt chạy kết thúc.

<AccordionGroup>
  <Accordion title="Hoàn tất không chặn, dựa trên đẩy">
    - Lệnh tạo là không chặn; nó trả về id lượt chạy ngay lập tức.
    - Khi hoàn tất, sub-agent thông báo một tin nhắn tóm tắt/kết quả trở lại kênh trò chuyện của bên yêu cầu.
    - Việc hoàn tất dựa trên cơ chế đẩy. Sau khi đã tạo, **không** poll `/subagents list`, `sessions_list`, hoặc `sessions_history` trong vòng lặp chỉ để chờ nó kết thúc; chỉ kiểm tra trạng thái theo nhu cầu để gỡ lỗi hoặc can thiệp.
    - Khi hoàn tất, OpenClaw nỗ lực tốt nhất để đóng các tab trình duyệt/tiến trình được theo dõi mà phiên sub-agent đó đã mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Khả năng chống chịu khi phân phối tạo thủ công">
    - OpenClaw thử phân phối trực tiếp qua `agent` trước với một khóa idempotency ổn định.
    - Nếu lượt hoàn tất của requester-agent thất bại, không tạo đầu ra hiển thị, hoặc trả về một tiền tố rõ ràng là chưa hoàn chỉnh của kết quả child đã bắt, OpenClaw fallback sang phân phối hoàn tất trực tiếp từ kết quả child đã bắt.
    - Nếu không thể dùng phân phối trực tiếp, nó fallback sang định tuyến hàng đợi.
    - Nếu định tuyến hàng đợi vẫn không khả dụng, thông báo sẽ được thử lại với backoff lũy thừa ngắn trước khi bỏ cuộc cuối cùng.
    - Phân phối hoàn tất giữ tuyến bên yêu cầu đã phân giải: các tuyến hoàn tất gắn với thread hoặc gắn với cuộc trò chuyện sẽ được ưu tiên khi có; nếu nguồn gốc hoàn tất chỉ cung cấp một kênh, OpenClaw điền mục tiêu/tài khoản còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để phân phối trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Siêu dữ liệu bàn giao hoàn tất">
    Việc bàn giao hoàn tất cho phiên bên yêu cầu là ngữ cảnh nội bộ được runtime tạo
    (không phải văn bản do người dùng viết) và bao gồm:

    - `Result` — văn bản trả lời `assistant` hiển thị mới nhất, nếu không thì văn bản công cụ/toolResult mới nhất đã được làm sạch. Các lượt chạy thất bại ở trạng thái cuối không tái sử dụng văn bản trả lời đã bắt.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Thống kê runtime/token gọn.
    - Một chỉ dẫn phân phối yêu cầu agent bên yêu cầu viết lại bằng giọng trợ lý bình thường (không chuyển tiếp siêu dữ liệu nội bộ thô).

  </Accordion>
  <Accordion title="Chế độ và runtime ACP">
    - `--model` và `--thinking` ghi đè mặc định cho lượt chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - `/subagents spawn` là chế độ một lần (`mode: "run"`). Với các phiên gắn thread bền vững, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Với các phiên harness ACP (Claude Code, Gemini CLI, OpenCode, hoặc Codex ACP/acpx được yêu cầu rõ ràng), dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [mô hình phân phối ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi hoàn tất hoặc vòng lặp agent-với-agent. Khi Plugin `codex` được bật, điều khiển trò chuyện/thread Codex nên ưu tiên `/codex ...` thay vì ACP trừ khi người dùng yêu cầu rõ ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không bị sandbox, và một Plugin backend như `acpx` được tải. `runtime: "acp"` mong đợi một id harness ACP bên ngoài, hoặc một mục `agents.list[]` với `runtime.type="acp"`; dùng runtime sub-agent mặc định cho các agent cấu hình OpenClaw bình thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Sub-agent gốc bắt đầu ở trạng thái cô lập trừ khi caller yêu cầu rõ ràng việc fork
transcript hiện tại.

| Chế độ       | Khi nào nên dùng                                                                                                                         | Hành vi                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm, hoặc bất cứ điều gì có thể được tóm tắt trong văn bản tác vụ                           | Tạo một transcript child sạch. Đây là mặc định và giúp mức sử dụng token thấp hơn.  |
| `fork`     | Công việc phụ thuộc vào cuộc trò chuyện hiện tại, kết quả công cụ trước đó, hoặc chỉ dẫn tinh tế đã có trong transcript của bên yêu cầu | Rẽ nhánh transcript của bên yêu cầu vào phiên child trước khi child bắt đầu. |

Dùng `fork` tiết kiệm. Nó dành cho việc ủy quyền nhạy với ngữ cảnh, không phải
thay thế cho việc viết một prompt tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Khởi động một lượt chạy sub-agent với `deliver: false` trên lane `subagent` toàn cục,
sau đó chạy một bước thông báo và đăng câu trả lời thông báo lên kênh trò chuyện
của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu lực của caller. Các profile `coding` và
`full` hiển thị `sessions_spawn` theo mặc định. Profile `messaging`
thì không; thêm `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hoặc dùng `tools.profile: "coding"` cho các agent cần ủy quyền
công việc. Các chính sách kênh/nhóm, provider, sandbox và allow/deny theo từng agent vẫn có thể
loại bỏ công cụ sau giai đoạn profile. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ hiệu lực.

**Mặc định:**

- **Model:** kế thừa caller trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng agent); `sessions_spawn.model` rõ ràng vẫn thắng.
- **Thinking:** kế thừa caller trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng agent); `sessions_spawn.thinking` rõ ràng vẫn thắng.
- **Thời gian chờ lượt chạy:** nếu bỏ qua `sessions_spawn.runTimeoutSeconds`, OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó fallback về `0` (không có thời gian chờ).

### Tham số công cụ

<ParamField path="task" type="string" required>
  Mô tả tác vụ cho sub-agent.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn mà con người đọc được.
</ParamField>
<ParamField path="agentId" type="string">
  Tạo dưới một id agent khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các harness ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode`, hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ ACP. Tiếp tục một phiên harness ACP hiện có khi `runtime: "acp"`; bị bỏ qua với các lần tạo sub-agent gốc.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ ACP. Stream đầu ra lượt chạy ACP tới phiên cha khi `runtime: "acp"`; bỏ qua với các lần tạo sub-agent gốc.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè model của sub-agent. Các giá trị không hợp lệ bị bỏ qua và sub-agent chạy trên model mặc định cùng một cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức thinking cho lượt chạy sub-agent.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi được đặt, nếu không thì `0`. Khi được đặt, lượt chạy sub-agent sẽ bị hủy sau N giây.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu gắn kết thread kênh cho phiên sub-agent này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ ngay sau khi thông báo (vẫn giữ transcript qua đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối tạo trừ khi runtime child mục tiêu được sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rẽ nhánh transcript hiện tại của bên yêu cầu vào phiên child. Chỉ sub-agent gốc. Các lần tạo gắn với thread mặc định dùng `fork`; các lần tạo không theo thread mặc định dùng `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận tham số phân phối kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Để phân phối, dùng
`message`/`sessions_send` từ lượt chạy đã tạo.
</Warning>

## Phiên gắn với thread

Khi gắn kết thread được bật cho một kênh, sub-agent có thể tiếp tục được gắn
với một thread để các tin nhắn người dùng theo dõi trong thread đó tiếp tục được định tuyến tới cùng
phiên sub-agent.

### Các kênh hỗ trợ thread

**Discord** hiện là kênh duy nhất được hỗ trợ. Nó hỗ trợ
các phiên subagent gắn thread bền vững (`sessions_spawn` với
`thread: true`), các điều khiển thread thủ công (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), và các khóa adapter
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, và
`channels.discord.threadBindings.spawnSessions`.

### Luồng nhanh

<Steps>
  <Step title="Spawn">
    `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw tạo hoặc ràng buộc một luồng với mục tiêu phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Route follow-ups">
    Các phản hồi và tin nhắn theo dõi trong luồng đó được định tuyến tới phiên đã ràng buộc.
  </Step>
  <Step title="Inspect timeouts">
    Dùng `/session idle` để kiểm tra/cập nhật tự động bỏ tập trung khi không hoạt động và
    `/session max-age` để kiểm soát giới hạn cứng.
  </Step>
  <Step title="Detach">
    Dùng `/unfocus` để tách thủ công.
  </Step>
</Steps>

### Điều khiển thủ công

| Lệnh               | Hiệu ứng                                                              |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Ràng buộc luồng hiện tại (hoặc tạo một luồng) với mục tiêu tác tử con/phiên |
| `/unfocus`         | Gỡ ràng buộc cho luồng hiện đang được ràng buộc                       |
| `/agents`          | Liệt kê các lần chạy đang hoạt động và trạng thái ràng buộc (`thread:<id>` hoặc `unbound`) |
| `/session idle`    | Kiểm tra/cập nhật tự động bỏ tập trung khi rảnh (chỉ các luồng đã ràng buộc và đang được tập trung) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng đã ràng buộc và đang được tập trung) |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Ghi đè kênh và khóa tự động ràng buộc khi khởi tạo** phụ thuộc vào từng adapter. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh slash](/vi/tools/slash-commands) để biết chi tiết adapter hiện tại.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách id tác tử có thể được nhắm mục tiêu qua `agentId` tường minh (`["*"]` cho phép bất kỳ). Mặc định: chỉ tác tử yêu cầu. Nếu bạn đặt một danh sách và vẫn muốn tác tử yêu cầu tự khởi tạo chính nó bằng `agentId`, hãy đưa id tác tử yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép tác tử mục tiêu mặc định được dùng khi tác tử yêu cầu không tự đặt `subagents.allowAgents`.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ tường minh). Ghi đè theo từng tác tử: `agents.list[].subagents.requireAgentId`.
</ParamField>

Nếu phiên yêu cầu chạy trong sandbox, `sessions_spawn` sẽ từ chối các mục tiêu
có thể chạy ngoài sandbox.

### Khám phá

Dùng `agents_list` để xem những id tác tử nào hiện được phép dùng cho
`sessions_spawn`. Phản hồi bao gồm model hiệu lực của từng tác tử được liệt kê
và siêu dữ liệu runtime nhúng để bên gọi có thể phân biệt PI, máy chủ ứng dụng Codex
và các runtime gốc đã cấu hình khác.

### Tự động lưu trữ

- Các phiên tác tử con được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Lưu trữ dùng `sessions.delete` và đổi tên transcript thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ transcript qua thao tác đổi tên).
- Tự động lưu trữ là nỗ lực tối đa; các timer đang chờ sẽ mất nếu gateway khởi động lại.
- `runTimeoutSeconds` **không** tự động lưu trữ; nó chỉ dừng lần chạy. Phiên vẫn còn cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các tab/quy trình trình duyệt được theo dõi sẽ được đóng theo nỗ lực tối đa khi lần chạy kết thúc, ngay cả khi bản ghi transcript/phiên được giữ lại.

## Tác tử con lồng nhau

Theo mặc định, tác tử con không thể khởi tạo tác tử con của riêng chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu orchestrator**: chính → tác tử con orchestrator →
tác tử cháu worker.

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

| Độ sâu | Dạng khóa phiên                              | Vai trò                                      | Có thể khởi tạo?             |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Tác tử chính                                  | Luôn luôn                    |
| 1     | `agent:<id>:subagent:<uuid>`                 | Tác tử con (orchestrator khi cho phép độ sâu 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Tác tử cháu (worker lá)                       | Không bao giờ                |

### Chuỗi thông báo

Kết quả chảy ngược lên chuỗi:

1. Worker độ sâu 2 hoàn tất → thông báo cho cha của nó (orchestrator độ sâu 1).
2. Orchestrator độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho tác tử chính.
3. Tác tử chính nhận thông báo và chuyển đến người dùng.

Mỗi cấp chỉ thấy thông báo từ các con trực tiếp của nó.

<Note>
**Hướng dẫn vận hành:** khởi động công việc con một lần và chờ các sự kiện
hoàn tất thay vì xây dựng vòng lặp thăm dò quanh `sessions_list`,
`sessions_history`, `/subagents list`, hoặc các lệnh ngủ `exec`.
`sessions_list` và `/subagents list` giữ quan hệ phiên con
tập trung vào công việc đang chạy — các con đang chạy vẫn được gắn, các con đã kết thúc vẫn
hiển thị trong một cửa sổ gần đây ngắn, và các liên kết con chỉ còn trong kho đã cũ sẽ bị
bỏ qua sau cửa sổ độ mới. Điều này ngăn siêu dữ liệu `spawnedBy` /
`parentSessionKey` cũ làm sống lại các con ảo sau khi
khởi động lại. Nếu một sự kiện hoàn tất của con đến sau khi bạn đã gửi
câu trả lời cuối cùng, phản hồi theo dõi đúng là token im lặng chính xác
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được ghi vào siêu dữ liệu phiên tại thời điểm khởi tạo. Điều đó giữ cho các khóa phiên phẳng hoặc được khôi phục không vô tình lấy lại đặc quyền orchestrator.
- **Độ sâu 1 (orchestrator, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể quản lý các con của nó. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (worker lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể khởi tạo thêm con.

### Giới hạn khởi tạo theo từng tác tử

Mỗi phiên tác tử (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) con đang hoạt động cùng lúc. Điều này ngăn một orchestrator đơn lẻ
tỏa nhánh mất kiểm soát.

### Dừng theo tầng

Dừng một orchestrator độ sâu 1 sẽ tự động dừng tất cả các con độ sâu 2
của nó:

- `/stop` trong cuộc trò chuyện chính dừng tất cả tác tử độ sâu 1 và lan xuống các con độ sâu 2 của chúng.
- `/subagents kill <id>` dừng một tác tử con cụ thể và lan xuống các con của nó.
- `/subagents kill all` dừng tất cả tác tử con của tác tử yêu cầu và lan xuống.

## Xác thực

Xác thực tác tử con được phân giải theo **id tác tử**, không theo loại phiên:

- Khóa phiên tác tử con là `agent:<agentId>:subagent:<uuid>`.
- Kho xác thực được tải từ `agentDir` của tác tử đó.
- Các hồ sơ xác thực của tác tử chính được hợp nhất vào làm **dự phòng**; hồ sơ tác tử ghi đè hồ sơ chính khi có xung đột.

Việc hợp nhất là cộng thêm, nên hồ sơ chính luôn khả dụng làm
dự phòng. Xác thực cô lập hoàn toàn theo từng tác tử hiện chưa được hỗ trợ.

## Thông báo

Tác tử con báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác tử con (không phải phiên tác tử yêu cầu).
- Nếu tác tử con trả lời chính xác `ANNOUNCE_SKIP`, không có gì được đăng.
- Nếu văn bản assistant mới nhất là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo sẽ bị chặn ngay cả khi trước đó đã có tiến trình hiển thị.

Cách gửi phụ thuộc vào độ sâu của tác tử yêu cầu:

- Các phiên yêu cầu cấp cao nhất dùng một lệnh gọi `agent` theo dõi với gửi bên ngoài (`deliver=true`).
- Các phiên tác tử con yêu cầu lồng nhau nhận một lần tiêm theo dõi nội bộ (`deliver=false`) để orchestrator có thể tổng hợp kết quả con trong phiên.
- Nếu một phiên tác tử con yêu cầu lồng nhau không còn, OpenClaw quay về tác tử yêu cầu của phiên đó khi có sẵn.

Đối với các phiên yêu cầu cấp cao nhất, gửi trực tiếp ở chế độ hoàn tất trước tiên
phân giải mọi tuyến cuộc trò chuyện/luồng đã ràng buộc và ghi đè hook, rồi điền
các trường mục tiêu kênh còn thiếu từ tuyến đã lưu của phiên yêu cầu.
Điều đó giữ các lần hoàn tất ở đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn hoàn tất
chỉ xác định kênh.

Tổng hợp hoàn tất của con được giới hạn trong lần chạy tác tử yêu cầu hiện tại khi
xây dựng các phát hiện hoàn tất lồng nhau, ngăn đầu ra con của lần chạy cũ
rò rỉ vào thông báo hiện tại. Phản hồi thông báo giữ nguyên
định tuyến luồng/chủ đề khi có trên adapter kênh.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường         | Nguồn                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguồn          | `subagent` hoặc `cron`                                                                                        |
| Id phiên       | Khóa/id phiên con                                                                                             |
| Loại           | Loại thông báo + nhãn tác vụ                                                                                  |
| Trạng thái     | Suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`) — **không** suy luận từ văn bản model |
| Nội dung kết quả | Văn bản assistant hiển thị mới nhất, nếu không thì văn bản tool/toolResult mới nhất đã được làm sạch          |
| Theo dõi       | Chỉ dẫn mô tả khi nào nên trả lời so với giữ im lặng                                                          |

Các lần chạy thất bại ở trạng thái cuối báo cáo trạng thái thất bại mà không phát lại
văn bản trả lời đã ghi lại. Khi hết thời gian, nếu con chỉ đi qua các lệnh gọi công cụ,
thông báo có thể thu gọn lịch sử đó thành một bản tóm tắt tiến trình một phần ngắn
thay vì phát lại đầu ra công cụ thô.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc dòng):

- Runtime (ví dụ `runtime 5m12s`).
- Mức dùng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi giá model được cấu hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, và đường dẫn transcript để tác tử chính có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Siêu dữ liệu nội bộ chỉ dành cho điều phối; các câu trả lời hướng tới người dùng
nên được viết lại bằng giọng assistant bình thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là đường dẫn điều phối an toàn hơn:

- Ghi nhớ của assistant được chuẩn hóa trước: loại bỏ thẻ suy nghĩ; loại bỏ khung `<relevant-memories>` / `<relevant_memories>`; loại bỏ các khối payload XML lệnh gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), bao gồm cả payload bị cắt cụt không bao giờ đóng sạch; loại bỏ khung lệnh gọi/kết quả công cụ bị hạ cấp và marker ngữ cảnh lịch sử; loại bỏ token điều khiển model bị rò rỉ (`<|assistant|>`, các ASCII `<|...|>` khác, dạng full-width `<｜...｜>`); loại bỏ XML lệnh gọi công cụ MiniMax không đúng dạng.
- Văn bản giống thông tin xác thực/token được biên tập ẩn.
- Các khối dài có thể bị cắt ngắn.
- Các lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá khổ bằng `[sessions_history omitted: message too large]`.
- Kiểm tra transcript thô trên đĩa là phương án dự phòng khi bạn cần transcript đầy đủ chính xác từng byte.

## Chính sách công cụ

Các tác nhân phụ trước tiên dùng cùng hồ sơ và quy trình chính sách công cụ như tác nhân cha hoặc tác nhân đích. Sau đó, OpenClaw áp dụng lớp hạn chế tác nhân phụ.

Khi không có `tools.profile` hạn chế, tác nhân phụ nhận được **tất cả công cụ ngoại trừ công cụ phiên** và công cụ hệ thống:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` cũng vẫn là một chế độ xem truy hồi có giới hạn và đã được làm sạch ở đây — nó không phải là bản kết xuất transcript thô.

Khi `maxSpawnDepth >= 2`, các tác nhân phụ điều phối ở độ sâu 1 còn nhận thêm `sessions_spawn`, `subagents`, `sessions_list`, và `sessions_history` để có thể quản lý các tác nhân con của chúng.

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

`tools.subagents.tools.allow` là bộ lọc allow-only cuối cùng. Nó có thể thu hẹp tập công cụ đã được phân giải, nhưng không thể **thêm lại** một công cụ đã bị `tools.profile` loại bỏ. Ví dụ, `tools.profile: "coding"` bao gồm `web_search`/`web_fetch` nhưng không bao gồm công cụ `browser`. Để cho phép các tác nhân phụ dùng hồ sơ coding sử dụng tự động hóa trình duyệt, hãy thêm browser ở giai đoạn hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Dùng `agents.list[].tools.alsoAllow: ["browser"]` theo từng tác nhân khi chỉ một tác nhân cần có tự động hóa trình duyệt.

## Đồng thời

Tác nhân phụ dùng một làn hàng đợi chuyên dụng trong cùng tiến trình:

- **Tên làn:** `subagent`
- **Mức đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Tình trạng hoạt động và khôi phục

OpenClaw không xem việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một tác nhân phụ vẫn còn sống. Các lần chạy chưa kết thúc cũ hơn cửa sổ lần chạy cũ sẽ không còn được tính là đang hoạt động/đang chờ trong `/subagents list`, tóm tắt trạng thái, cổng chặn hoàn tất của tác nhân hậu duệ, và kiểm tra mức đồng thời theo từng phiên.

Sau khi gateway khởi động lại, các lần chạy được khôi phục nhưng chưa kết thúc và đã cũ sẽ bị cắt bỏ, trừ khi phiên con của chúng được đánh dấu `abortedLastRun: true`. Những phiên con bị hủy do khởi động lại đó vẫn có thể khôi phục qua luồng khôi phục tác nhân phụ mồ côi, luồng này gửi một thông báo tiếp tục tổng hợp trước khi xóa dấu đánh dấu đã hủy.

Khôi phục tự động sau khởi động lại được giới hạn theo từng phiên con. Nếu cùng một tác nhân phụ con được chấp nhận để khôi phục mồ côi lặp lại trong cửa sổ rapid re-wedge, OpenClaw sẽ lưu một tombstone khôi phục trên phiên đó và dừng tự động tiếp tục phiên đó trong các lần khởi động lại sau. Chạy `openclaw tasks maintenance --apply` để đối chiếu bản ghi tác vụ, hoặc `openclaw doctor --fix` để xóa các cờ khôi phục đã hủy cũ trên những phiên có tombstone.

<Note>
Nếu tạo tác nhân phụ thất bại với Gateway `PAIRING_REQUIRED` / `scope-upgrade`, hãy kiểm tra bên gọi RPC trước khi chỉnh sửa trạng thái ghép đôi. Phối hợp `sessions_spawn` nội bộ nên kết nối dưới dạng `client.id: "gateway-client"` với `client.mode: "backend"` qua xác thực shared-token/password trực tiếp qua local loopback; đường dẫn đó không phụ thuộc vào đường cơ sở phạm vi thiết bị đã ghép đôi của CLI. Bên gọi từ xa, `deviceIdentity` tường minh, đường dẫn device-token tường minh, và máy khách browser/node vẫn cần phê duyệt thiết bị thông thường cho nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên của bên yêu cầu và dừng mọi lần chạy tác nhân phụ đang hoạt động được tạo từ phiên đó, đồng thời lan xuống các tác nhân con lồng nhau.
- `/subagents kill <id>` dừng một tác nhân phụ cụ thể và lan xuống các tác nhân con của nó.

## Hạn chế

- Thông báo của tác nhân phụ là **nỗ lực tốt nhất**. Nếu gateway khởi động lại, công việc "announce back" đang chờ sẽ bị mất.
- Tác nhân phụ vẫn dùng chung tài nguyên của cùng tiến trình gateway; hãy xem `maxConcurrent` như một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác nhân phụ chỉ chèn `AGENTS.md` + `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`).
- Độ sâu lồng nhau tối đa là 5 (phạm vi `maxSpawnDepth`: 1–5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số tác nhân con đang hoạt động trên mỗi phiên (mặc định `5`, phạm vi `1–20`).

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
