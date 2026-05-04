---
read_when:
    - Bạn muốn chạy công việc nền hoặc công việc song song thông qua tác nhân
    - Bạn đang thay đổi chính sách công cụ sessions_spawn hoặc tác tử con
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên subagent ràng buộc với luồng
sidebarTitle: Sub-agents
summary: Khởi tạo các lượt chạy agent nền biệt lập thông báo kết quả trở lại cuộc trò chuyện của người yêu cầu
title: Tác nhân phụ
x-i18n:
    generated_at: "2026-05-04T02:26:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0df39e06b952def3eb0b296f36c7dc8c0b0a115785d865236a970c5d453fc37
    source_path: tools/subagents.md
    workflow: 16
---

Các tác tử con là các lần chạy tác tử nền được sinh ra từ một lần chạy tác tử hiện có.
Chúng chạy trong phiên riêng của mình (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả của chúng trở lại kênh trò chuyện
của bên yêu cầu. Mỗi lần chạy tác tử con được theo dõi như một
[tác vụ nền](/vi/automation/tasks).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn lần chạy chính.
- Giữ tác tử con mặc định được cô lập (tách phiên + sandbox tùy chọn).
- Giữ bề mặt công cụ khó bị dùng sai: tác tử con mặc định **không** nhận công cụ phiên.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu bộ điều phối.

<Note>
**Lưu ý chi phí:** mỗi tác tử con mặc định có ngữ cảnh và mức sử dụng token
riêng. Với các tác vụ nặng hoặc lặp lại, hãy đặt mô hình rẻ hơn cho tác tử con
và giữ tác tử chính trên mô hình chất lượng cao hơn. Cấu hình qua
`agents.defaults.subagents.model` hoặc ghi đè theo từng tác tử. Khi một tác tử con
    thực sự cần transcript hiện tại của bên yêu cầu, tác tử có thể yêu cầu
    `context: "fork"` trên lần sinh đó. Các phiên tác tử con gắn với luồng mặc định
    dùng `context: "fork"` vì chúng rẽ nhánh cuộc trò chuyện hiện tại sang một
    luồng theo dõi.
</Note>

## Lệnh gạch chéo

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

Dùng [`/steer <message>`](/vi/tools/steer) cấp cao nhất để điều hướng lần chạy đang hoạt động của phiên bên yêu cầu hiện tại. Dùng `/subagents steer <id|#> <message>` khi mục tiêu là một lần chạy con.

`/subagents info` hiển thị siêu dữ liệu lần chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn transcript, dọn dẹp). Dùng `sessions_history` để có chế độ xem nhớ lại có giới hạn,
được lọc an toàn; kiểm tra đường dẫn transcript trên đĩa khi bạn cần transcript đầy đủ thô.

### Điều khiển gắn luồng

Các lệnh này hoạt động trên các kênh hỗ trợ gắn luồng bền vững.
Xem [Kênh hỗ trợ luồng](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi sinh

`/subagents spawn` khởi động một tác tử con nền dưới dạng lệnh người dùng (không phải
chuyển tiếp nội bộ) và gửi một cập nhật hoàn tất cuối cùng trở lại cuộc trò chuyện
của bên yêu cầu khi lần chạy kết thúc.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - Lệnh sinh không chặn; nó trả về id lần chạy ngay lập tức.
    - Khi hoàn tất, tác tử con thông báo một thông điệp tóm tắt/kết quả trở lại kênh trò chuyện của bên yêu cầu.
    - Việc hoàn tất dựa trên cơ chế đẩy. Sau khi đã sinh, **không** thăm dò `/subagents list`, `sessions_list`, hoặc `sessions_history` trong vòng lặp chỉ để chờ nó kết thúc; chỉ kiểm tra trạng thái theo nhu cầu để gỡ lỗi hoặc can thiệp.
    - Khi hoàn tất, OpenClaw cố gắng đóng các tab trình duyệt/tiến trình được theo dõi mà phiên tác tử con đó đã mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw thử chuyển phát trực tiếp qua `agent` trước với khóa idempotency ổn định.
    - Nếu chuyển phát trực tiếp thất bại, nó chuyển sang định tuyến hàng đợi.
    - Nếu định tuyến hàng đợi vẫn không khả dụng, thông báo sẽ được thử lại với backoff lũy thừa ngắn trước khi bỏ cuộc cuối cùng.
    - Việc chuyển phát hoàn tất giữ tuyến bên yêu cầu đã phân giải: các tuyến hoàn tất gắn với luồng hoặc gắn với cuộc trò chuyện sẽ thắng khi khả dụng; nếu nguồn hoàn tất chỉ cung cấp một kênh, OpenClaw điền mục tiêu/tài khoản còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để chuyển phát trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Bàn giao hoàn tất cho phiên bên yêu cầu là ngữ cảnh nội bộ được runtime tạo
    (không phải văn bản do người dùng viết) và bao gồm:

    - `Result` — văn bản phản hồi `assistant` hiển thị mới nhất, nếu không thì văn bản tool/toolResult mới nhất đã được làm sạch. Các lần chạy kết thúc thất bại không tái sử dụng văn bản phản hồi đã ghi lại.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Thống kê runtime/token gọn.
    - Một chỉ dẫn chuyển phát yêu cầu tác tử bên yêu cầu viết lại bằng giọng trợ lý bình thường (không chuyển tiếp siêu dữ liệu nội bộ thô).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` và `--thinking` ghi đè mặc định cho riêng lần chạy đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - `/subagents spawn` là chế độ một lần (`mode: "run"`). Với các phiên bền vững gắn với luồng, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Với các phiên bộ kiểm thử ACP (Claude Code, Gemini CLI, OpenCode, hoặc Codex ACP/acpx tường minh), dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [mô hình chuyển phát ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi hoàn tất hoặc vòng lặp tác tử-đến-tác tử. Khi Plugin `codex` được bật, điều khiển trò chuyện/luồng Codex nên ưu tiên `/codex ...` thay vì ACP trừ khi người dùng yêu cầu ACP/acpx tường minh.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không bị sandbox, và một Plugin backend như `acpx` đã được tải. `runtime: "acp"` mong đợi một id bộ kiểm thử ACP bên ngoài, hoặc một mục `agents.list[]` với `runtime.type="acp"`; dùng runtime tác tử con mặc định cho các tác tử cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Tác tử con gốc khởi động cô lập trừ khi bên gọi yêu cầu rõ ràng việc rẽ nhánh
transcript hiện tại.

| Chế độ       | Khi nào dùng                                                                                                                         | Hành vi                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm, hoặc bất cứ điều gì có thể được tóm tắt trong văn bản tác vụ                           | Tạo transcript con sạch. Đây là mặc định và giúp mức sử dụng token thấp hơn.  |
| `fork`     | Công việc phụ thuộc vào cuộc trò chuyện hiện tại, kết quả công cụ trước đó, hoặc các chỉ dẫn tinh tế đã có trong transcript của bên yêu cầu | Rẽ nhánh transcript của bên yêu cầu vào phiên con trước khi tác tử con bắt đầu. |

Dùng `fork` một cách tiết chế. Nó dành cho ủy quyền nhạy với ngữ cảnh, không phải
thay thế cho việc viết lời nhắc tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Khởi động một lần chạy tác tử con với `deliver: false` trên làn `subagent` toàn cục,
sau đó chạy một bước thông báo và đăng phản hồi thông báo vào kênh trò chuyện
của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu lực của bên gọi. Các hồ sơ `coding` và
`full` mặc định hiển thị `sessions_spawn`. Hồ sơ `messaging`
thì không; thêm `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hoặc dùng `tools.profile: "coding"` cho các tác tử nên ủy quyền
công việc. Chính sách cho phép/từ chối theo kênh/nhóm, nhà cung cấp, sandbox và từng tác tử
vẫn có thể loại bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ hiệu lực.

**Mặc định:**

- **Mô hình:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng tác tử); `sessions_spawn.model` tường minh vẫn thắng.
- **Thinking:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng tác tử); `sessions_spawn.thinking` tường minh vẫn thắng.
- **Thời gian chờ lần chạy:** nếu bỏ qua `sessions_spawn.runTimeoutSeconds`, OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không thì quay về `0` (không có thời gian chờ).

### Tham số công cụ

<ParamField path="task" type="string" required>
  Mô tả tác vụ cho tác tử con.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn, dễ đọc cho con người.
</ParamField>
<ParamField path="agentId" type="string">
  Sinh dưới một id tác tử khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các bộ kiểm thử ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode`, hoặc Codex ACP/acpx được yêu cầu tường minh) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ ACP. Tiếp tục một phiên bộ kiểm thử ACP hiện có khi `runtime: "acp"`; bị bỏ qua với các lần sinh tác tử con gốc.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ ACP. Truyền đầu ra lần chạy ACP tới phiên cha khi `runtime: "acp"`; bỏ qua với các lần sinh tác tử con gốc.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình tác tử con. Giá trị không hợp lệ bị bỏ qua và tác tử con chạy trên mô hình mặc định kèm cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức thinking cho lần chạy tác tử con.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi được đặt, nếu không thì `0`. Khi được đặt, lần chạy tác tử con bị hủy sau N giây.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu gắn luồng kênh cho phiên tác tử con này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ ngay sau khi thông báo (vẫn giữ transcript qua đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối sinh trừ khi runtime con mục tiêu được sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rẽ nhánh transcript hiện tại của bên yêu cầu vào phiên con. Chỉ dành cho tác tử con gốc. Các lần sinh gắn với luồng mặc định dùng `fork`; các lần sinh không theo luồng mặc định dùng `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận tham số chuyển phát kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Để chuyển phát, dùng
`message`/`sessions_send` từ lần chạy đã sinh.
</Warning>

## Phiên gắn với luồng

Khi gắn luồng được bật cho một kênh, một tác tử con có thể tiếp tục gắn
với một luồng để các tin nhắn theo dõi của người dùng trong luồng đó tiếp tục định tuyến tới
cùng phiên tác tử con.

### Kênh hỗ trợ luồng

**Discord** hiện là kênh duy nhất được hỗ trợ. Kênh này hỗ trợ
các phiên tác tử con gắn luồng bền vững (`sessions_spawn` với
`thread: true`), điều khiển luồng thủ công (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), và các khóa bộ điều hợp
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
    OpenClaw tạo hoặc gắn một luồng với mục tiêu phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Route follow-ups">
    Các phản hồi và tin nhắn theo dõi trong luồng đó được định tuyến tới phiên đã gắn.
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

| Lệnh              | Tác dụng                                                              |
| ----------------- | --------------------------------------------------------------------- |
| `/focus <target>` | Liên kết luồng hiện tại (hoặc tạo một luồng) với mục tiêu tác nhân phụ/phiên |
| `/unfocus`        | Xóa liên kết cho luồng hiện đang được liên kết                        |
| `/agents`         | Liệt kê các lượt chạy đang hoạt động và trạng thái liên kết (`thread:<id>` hoặc `unbound`) |
| `/session idle`   | Kiểm tra/cập nhật tự động bỏ tập trung khi nhàn rỗi (chỉ các luồng đã liên kết đang được tập trung) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng đã liên kết đang được tập trung) |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Ghi đè theo kênh và khóa tự động liên kết khi sinh phiên** phụ thuộc vào adapter. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh slash](/vi/tools/slash-commands) để biết chi tiết adapter hiện tại.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách id tác nhân có thể được nhắm mục tiêu qua `agentId` tường minh (`["*"]` cho phép bất kỳ tác nhân nào). Mặc định: chỉ tác nhân yêu cầu. Nếu bạn đặt một danh sách và vẫn muốn tác nhân yêu cầu tự sinh chính nó bằng `agentId`, hãy đưa id của tác nhân yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép tác nhân đích mặc định được dùng khi tác nhân yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ tường minh). Ghi đè theo từng tác nhân: `agents.list[].subagents.requireAgentId`.
</ParamField>

Nếu phiên yêu cầu bị sandbox, `sessions_spawn` sẽ từ chối các mục tiêu
có thể chạy không trong sandbox.

### Khám phá

Dùng `agents_list` để xem các id tác nhân nào hiện được phép cho
`sessions_spawn`. Phản hồi bao gồm model hiệu lực của từng tác nhân được liệt kê
và metadata runtime được nhúng để bên gọi có thể phân biệt PI, máy chủ ứng dụng Codex
và các runtime native đã cấu hình khác.

### Tự động lưu trữ

- Phiên tác nhân phụ được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Lưu trữ dùng `sessions.delete` và đổi tên bản ghi transcript thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ transcript qua đổi tên).
- Tự động lưu trữ là nỗ lực tối đa; các bộ hẹn giờ đang chờ sẽ mất nếu Gateway khởi động lại.
- `runTimeoutSeconds` **không** tự động lưu trữ; nó chỉ dừng lượt chạy. Phiên vẫn tồn tại cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các tab/tiến trình trình duyệt được theo dõi sẽ được đóng theo cơ chế nỗ lực tối đa khi lượt chạy kết thúc, ngay cả khi bản ghi transcript/phiên được giữ lại.

## Tác nhân phụ lồng nhau

Theo mặc định, tác nhân phụ không thể sinh tác nhân phụ của riêng chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu bộ điều phối**: chính → tác nhân phụ điều phối →
các tác nhân phụ cấp con làm worker.

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

| Độ sâu | Dạng khóa phiên                              | Vai trò                                      | Có thể sinh?                 |
| ------ | -------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 0      | `agent:<id>:main`                            | Tác nhân chính                               | Luôn luôn                    |
| 1      | `agent:<id>:subagent:<uuid>`                 | Tác nhân phụ (bộ điều phối khi cho phép độ sâu 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Tác nhân phụ cấp con (worker lá)             | Không bao giờ                |

### Chuỗi thông báo

Kết quả chảy ngược lên theo chuỗi:

1. Worker độ sâu 2 hoàn tất → thông báo cho cha của nó (bộ điều phối độ sâu 1).
2. Bộ điều phối độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho tác nhân chính.
3. Tác nhân chính nhận thông báo và chuyển đến người dùng.

Mỗi cấp chỉ thấy thông báo từ các con trực tiếp của nó.

<Note>
**Hướng dẫn vận hành:** bắt đầu công việc con một lần và chờ sự kiện
hoàn tất thay vì xây các vòng lặp thăm dò quanh `sessions_list`,
`sessions_history`, `/subagents list`, hoặc các lệnh ngủ `exec`.
`sessions_list` và `/subagents list` giữ các quan hệ phiên con
tập trung vào công việc đang chạy — con đang chạy vẫn được gắn, con đã kết thúc vẫn
hiển thị trong một cửa sổ gần đây ngắn, và các liên kết con chỉ còn trong kho lưu trữ đã cũ
sẽ bị bỏ qua sau cửa sổ độ mới của chúng. Điều này ngăn metadata `spawnedBy` /
`parentSessionKey` cũ làm sống lại các con ma sau khi
khởi động lại. Nếu một sự kiện hoàn tất của con đến sau khi bạn đã gửi
câu trả lời cuối cùng, phản hồi tiếp theo đúng là token im lặng chính xác
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được ghi vào metadata phiên tại thời điểm sinh. Điều đó giữ cho các khóa phiên phẳng hoặc đã khôi phục không vô tình lấy lại đặc quyền bộ điều phối.
- **Độ sâu 1 (bộ điều phối, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể quản lý các con. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (worker lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể sinh thêm con.

### Giới hạn sinh theo từng tác nhân

Mỗi phiên tác nhân (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) con đang hoạt động cùng lúc. Điều này ngăn một bộ điều phối duy nhất
fan-out mất kiểm soát.

### Dừng dây chuyền

Dừng một bộ điều phối độ sâu 1 sẽ tự động dừng tất cả các con độ sâu 2
của nó:

- `/stop` trong cuộc trò chuyện chính dừng tất cả tác nhân độ sâu 1 và dừng dây chuyền đến các con độ sâu 2 của chúng.
- `/subagents kill <id>` dừng một tác nhân phụ cụ thể và dừng dây chuyền đến các con của nó.
- `/subagents kill all` dừng tất cả tác nhân phụ cho bên yêu cầu và dừng dây chuyền.

## Xác thực

Xác thực tác nhân phụ được phân giải theo **id tác nhân**, không theo loại phiên:

- Khóa phiên tác nhân phụ là `agent:<agentId>:subagent:<uuid>`.
- Kho xác thực được tải từ `agentDir` của tác nhân đó.
- Các hồ sơ xác thực của tác nhân chính được hợp nhất làm **dự phòng**; hồ sơ tác nhân ghi đè hồ sơ chính khi có xung đột.

Việc hợp nhất là cộng thêm, vì vậy hồ sơ chính luôn có sẵn làm
dự phòng. Xác thực cô lập hoàn toàn theo từng tác nhân hiện chưa được hỗ trợ.

## Thông báo

Tác nhân phụ báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác nhân phụ (không phải phiên yêu cầu).
- Nếu tác nhân phụ trả lời chính xác `ANNOUNCE_SKIP`, sẽ không có gì được đăng.
- Nếu văn bản assistant mới nhất là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo bị chặn ngay cả khi trước đó đã có tiến trình hiển thị.

Cách chuyển phụ thuộc vào độ sâu của bên yêu cầu:

- Phiên yêu cầu cấp cao nhất dùng một lệnh gọi `agent` tiếp theo với chuyển phát bên ngoài (`deliver=true`).
- Phiên tác nhân phụ yêu cầu lồng nhau nhận một lần chèn theo dõi nội bộ (`deliver=false`) để bộ điều phối có thể tổng hợp kết quả con trong phiên.
- Nếu một phiên tác nhân phụ yêu cầu lồng nhau đã biến mất, OpenClaw sẽ quay về bên yêu cầu của phiên đó khi có sẵn.

Đối với các phiên yêu cầu cấp cao nhất, chuyển phát trực tiếp ở chế độ hoàn tất trước tiên
phân giải mọi tuyến cuộc trò chuyện/luồng đã liên kết và ghi đè hook, rồi điền
các trường mục tiêu kênh còn thiếu từ tuyến đã lưu của phiên yêu cầu.
Điều đó giữ các lần hoàn tất ở đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn gốc hoàn tất
chỉ xác định kênh.

Tổng hợp hoàn tất của con được giới hạn trong lượt chạy yêu cầu hiện tại khi
xây dựng các phát hiện hoàn tất lồng nhau, ngăn đầu ra con từ lượt chạy trước đã cũ
rò rỉ vào thông báo hiện tại. Phản hồi thông báo giữ nguyên
định tuyến luồng/chủ đề khi adapter kênh có sẵn.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường           | Nguồn                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguồn            | `subagent` hoặc `cron`                                                                                        |
| Id phiên         | Khóa/id phiên con                                                                                             |
| Loại             | Loại thông báo + nhãn tác vụ                                                                                  |
| Trạng thái       | Suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`) — **không** suy ra từ văn bản model |
| Nội dung kết quả | Văn bản assistant hiển thị mới nhất, nếu không thì văn bản tool/toolResult mới nhất đã được làm sạch          |
| Theo dõi         | Chỉ dẫn mô tả khi nào nên trả lời so với giữ im lặng                                                          |

Các lượt chạy kết thúc bằng lỗi báo cáo trạng thái lỗi mà không phát lại
văn bản trả lời đã ghi lại. Khi hết thời gian, nếu con chỉ đi qua các lệnh gọi công cụ,
thông báo có thể thu gọn lịch sử đó thành một tóm tắt tiến trình một phần ngắn
thay vì phát lại đầu ra công cụ thô.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc):

- Runtime (ví dụ `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi giá model được cấu hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, và đường dẫn transcript để tác nhân chính có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Metadata nội bộ chỉ dành cho điều phối; các phản hồi hướng tới người dùng
nên được viết lại bằng giọng assistant bình thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là đường dẫn điều phối an toàn hơn:

- Trí nhớ lại của assistant được chuẩn hóa trước: loại bỏ thẻ suy nghĩ; loại bỏ khung `<relevant-memories>` / `<relevant_memories>`; loại bỏ các khối payload XML lời gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), bao gồm các payload bị cắt cụt không bao giờ đóng sạch; loại bỏ khung lời gọi/kết quả công cụ bị hạ cấp và các marker ngữ cảnh lịch sử; loại bỏ token điều khiển model bị rò rỉ (`<|assistant|>`, các ASCII `<|...|>` khác, dạng toàn độ rộng `<｜...｜>`); loại bỏ XML lời gọi công cụ MiniMax sai định dạng.
- Văn bản giống thông tin xác thực/token được biên tập lại.
- Các khối dài có thể bị cắt ngắn.
- Lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá lớn bằng `[sessions_history omitted: message too large]`.
- Kiểm tra transcript thô trên đĩa là phương án dự phòng khi bạn cần transcript đầy đủ từng byte.

## Chính sách công cụ

Tác nhân phụ dùng cùng hồ sơ và pipeline chính sách công cụ như tác nhân cha hoặc
tác nhân đích trước. Sau đó, OpenClaw áp dụng lớp hạn chế tác nhân phụ.

Khi không có `tools.profile` hạn chế, tác nhân phụ nhận **tất cả công cụ trừ
công cụ phiên** và công cụ hệ thống:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` vẫn là một chế độ xem nhớ lại có giới hạn và đã làm sạch ở đây nữa — nó
không phải bản dump transcript thô.

Khi `maxSpawnDepth >= 2`, các tác nhân phụ bộ điều phối độ sâu 1 còn
nhận `sessions_spawn`, `subagents`, `sessions_list`, và
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
tập công cụ đã được phân giải, nhưng không thể **thêm lại** một công cụ đã bị xóa
bởi `tools.profile`. Ví dụ, `tools.profile: "coding"` bao gồm
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

Dùng `agents.list[].tools.alsoAllow: ["browser"]` cho từng tác nhân khi chỉ một
tác nhân nên có tự động hóa trình duyệt.

## Đồng thời

Các tác nhân phụ dùng một làn hàng đợi chuyên dụng trong cùng tiến trình:

- **Tên làn:** `subagent`
- **Đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Khả năng hoạt động và khôi phục

OpenClaw không xem việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một
tác nhân phụ vẫn còn hoạt động. Các lượt chạy chưa kết thúc cũ hơn cửa sổ lượt chạy lỗi thời
sẽ không còn được tính là đang hoạt động/đang chờ trong `/subagents list`, tóm tắt trạng thái,
cổng hoàn tất hậu duệ, và kiểm tra đồng thời theo phiên.

Sau khi Gateway khởi động lại, các lượt chạy được khôi phục nhưng chưa kết thúc và đã lỗi thời sẽ bị cắt bỏ trừ khi
phiên con của chúng được đánh dấu `abortedLastRun: true`. Những
phiên con bị hủy do khởi động lại này vẫn có thể khôi phục qua luồng khôi phục tác nhân phụ mồ côi,
luồng này gửi một thông báo tiếp tục tổng hợp trước khi
xóa dấu hủy.

Khôi phục tự động sau khởi động lại được giới hạn theo từng phiên con. Nếu cùng một
phiên con tác nhân phụ được chấp nhận để khôi phục mồ côi nhiều lần trong
cửa sổ kẹt lại nhanh, OpenClaw sẽ lưu một dấu mộ khôi phục trên
phiên đó và dừng tự động tiếp tục phiên đó ở các lần khởi động lại sau. Chạy
`openclaw tasks maintenance --apply` để đối soát bản ghi tác vụ, hoặc
`openclaw doctor --fix` để xóa các cờ khôi phục đã hủy lỗi thời trên
các phiên có dấu mộ.

<Note>
Nếu việc khởi tạo tác nhân phụ thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra bên gọi RPC trước khi chỉnh sửa trạng thái ghép đôi.
Điều phối `sessions_spawn` nội bộ nên kết nối dưới dạng
`client.id: "gateway-client"` với `client.mode: "backend"` qua xác thực shared-token/password
local loopback trực tiếp; đường dẫn đó không phụ thuộc vào đường cơ sở phạm vi thiết bị đã ghép đôi của
CLI. Các bên gọi từ xa, `deviceIdentity` rõ ràng, đường dẫn device-token rõ ràng, và trình khách browser/node
vẫn cần phê duyệt thiết bị bình thường cho nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên của bên yêu cầu và dừng mọi lượt chạy tác nhân phụ đang hoạt động được khởi tạo từ đó, lan truyền đến các phiên con lồng nhau.
- `/subagents kill <id>` dừng một tác nhân phụ cụ thể và lan truyền đến các phiên con của nó.

## Giới hạn

- Thông báo tác nhân phụ là **nỗ lực tối đa**. Nếu Gateway khởi động lại, công việc "announce back" đang chờ sẽ bị mất.
- Các tác nhân phụ vẫn chia sẻ cùng tài nguyên tiến trình Gateway; hãy xem `maxConcurrent` như một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác nhân phụ chỉ chèn `AGENTS.md` + `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`).
- Độ sâu lồng nhau tối đa là 5 (phạm vi `maxSpawnDepth`: 1–5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số phiên con đang hoạt động trên mỗi phiên (mặc định `5`, phạm vi `1–20`).

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
