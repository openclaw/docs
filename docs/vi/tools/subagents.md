---
read_when:
    - Bạn muốn thực hiện công việc chạy nền hoặc song song thông qua tác nhân
    - Bạn đang thay đổi sessions_spawn hoặc chính sách công cụ tác tử phụ
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên tác nhân phụ gắn với luồng
sidebarTitle: Sub-agents
summary: Tạo các lần chạy tác tử nền tách biệt để thông báo kết quả trở lại cuộc trò chuyện của người yêu cầu
title: Tác nhân con
x-i18n:
    generated_at: "2026-05-07T01:54:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 901311ae7766640ff6991f66a63070fddef47d79ef5385d2c1af84be34a5140e
    source_path: tools/subagents.md
    workflow: 16
---

Tác nhân con là các lượt chạy tác nhân nền được sinh ra từ một lượt chạy tác nhân hiện có.
Chúng chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả của chúng trở lại kênh trò chuyện của
bên yêu cầu. Mỗi lượt chạy tác nhân con được theo dõi như một
[tác vụ nền](/vi/automation/tasks).

Để biết mô hình bảo mật phía sau cơ chế ủy quyền, hãy xem
[Ranh giới đa tác nhân và tác nhân con](/vi/gateway/security#multi-agent-and-sub-agent-boundaries).
Tác nhân con là các đơn vị cô lập và quy trình làm việc hữu ích, nhưng chúng không phải là ranh giới
ủy quyền đa bên thuê đối địch bên trong một Gateway dùng chung.

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn lượt chạy chính.
- Giữ tác nhân con được cô lập theo mặc định (tách phiên + cơ chế sandbox tùy chọn).
- Giữ bề mặt công cụ khó bị dùng sai: tác nhân con **không** nhận công cụ phiên theo mặc định.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu điều phối.

<Note>
**Ghi chú chi phí:** theo mặc định, mỗi tác nhân con có ngữ cảnh và mức sử dụng token riêng.
Với các tác vụ nặng hoặc lặp lại, hãy đặt một mô hình rẻ hơn cho tác nhân con
và giữ tác nhân chính của bạn trên mô hình chất lượng cao hơn. Cấu hình qua
`agents.defaults.subagents.model` hoặc ghi đè theo từng tác nhân. Khi một tác nhân con
    thực sự cần bản ghi hiện tại của bên yêu cầu, tác nhân có thể yêu cầu
    `context: "fork"` trong một lần sinh đó. Các phiên tác nhân con gắn với luồng mặc định
    là `context: "fork"` vì chúng rẽ nhánh cuộc trò chuyện hiện tại thành một
    luồng theo dõi.
</Note>

## Lệnh slash

Dùng `/subagents` để kiểm tra hoặc điều khiển các lượt chạy tác nhân con cho **phiên hiện tại**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Dùng [`/steer <message>`](/vi/tools/steer) cấp cao nhất để điều hướng lượt chạy đang hoạt động của phiên bên yêu cầu hiện tại. Dùng `/subagents steer <id|#> <message>` khi đích là một lượt chạy con.

`/subagents info` hiển thị siêu dữ liệu lượt chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn bản ghi, dọn dẹp). Dùng `sessions_history` để có chế độ xem gợi nhớ có giới hạn,
đã lọc an toàn; kiểm tra đường dẫn bản ghi trên đĩa khi bạn
cần bản ghi thô đầy đủ.

### Điều khiển gắn luồng

Các lệnh này hoạt động trên các kênh hỗ trợ gắn luồng bền vững.
Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi sinh

`/subagents spawn` khởi động một tác nhân con nền dưới dạng lệnh của người dùng (không phải
chuyển tiếp nội bộ) và gửi một cập nhật hoàn tất cuối cùng trở lại cuộc trò chuyện
của bên yêu cầu khi lượt chạy kết thúc.

<AccordionGroup>
  <Accordion title="Hoàn tất không chặn, dựa trên đẩy">
    - Lệnh sinh không chặn; nó trả về id lượt chạy ngay lập tức.
    - Khi hoàn tất, tác nhân con thông báo một thông điệp tóm tắt/kết quả trở lại kênh trò chuyện của bên yêu cầu.
    - Việc hoàn tất dựa trên đẩy. Sau khi đã sinh, **đừng** thăm dò `/subagents list`, `sessions_list`, hoặc `sessions_history` theo vòng lặp chỉ để chờ nó kết thúc; chỉ kiểm tra trạng thái theo nhu cầu để gỡ lỗi hoặc can thiệp.
    - Khi hoàn tất, OpenClaw sẽ cố gắng hết mức để đóng các tab trình duyệt/tiến trình được theo dõi mà phiên tác nhân con đó đã mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Khả năng bền bỉ khi phân phối sinh thủ công">
    - OpenClaw thử phân phối trực tiếp qua `agent` trước với một khóa idempotency ổn định.
    - Nếu lượt hoàn tất của tác nhân yêu cầu thất bại, không tạo đầu ra hiển thị, hoặc trả về một tiền tố rõ ràng chưa hoàn chỉnh của kết quả tác nhân con đã ghi lại, OpenClaw chuyển sang phân phối hoàn tất trực tiếp từ kết quả tác nhân con đã ghi lại.
    - Nếu không thể dùng phân phối trực tiếp, hệ thống chuyển sang định tuyến hàng đợi.
    - Nếu định tuyến hàng đợi vẫn không khả dụng, thông báo sẽ được thử lại với backoff lũy thừa ngắn trước khi từ bỏ cuối cùng.
    - Phân phối hoàn tất giữ tuyến bên yêu cầu đã phân giải: các tuyến hoàn tất gắn với luồng hoặc gắn với cuộc trò chuyện sẽ được ưu tiên khi khả dụng; nếu nguồn gốc hoàn tất chỉ cung cấp một kênh, OpenClaw điền đích/tài khoản còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để phân phối trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Siêu dữ liệu bàn giao hoàn tất">
    Bàn giao hoàn tất tới phiên bên yêu cầu là ngữ cảnh nội bộ được tạo lúc chạy
    (không phải văn bản do người dùng soạn) và bao gồm:

    - `Result` — văn bản trả lời `assistant` hiển thị mới nhất, nếu không có thì là văn bản công cụ/toolResult mới nhất đã được làm sạch. Các lượt chạy kết thúc thất bại không tái sử dụng văn bản trả lời đã ghi lại.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Thống kê runtime/token dạng gọn.
    - Một chỉ dẫn phân phối yêu cầu tác nhân bên yêu cầu viết lại bằng giọng trợ lý bình thường (không chuyển tiếp siêu dữ liệu nội bộ thô).

  </Accordion>
  <Accordion title="Chế độ và runtime ACP">
    - `--model` và `--thinking` ghi đè mặc định cho lượt chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - `/subagents spawn` là chế độ một lần (`mode: "run"`). Với các phiên gắn luồng bền vững, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Với các phiên harness ACP (Claude Code, Gemini CLI, OpenCode, hoặc Codex ACP/acpx rõ ràng), dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [Mô hình phân phối ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi hoàn tất hoặc vòng lặp tác nhân với tác nhân. Khi Plugin `codex` được bật, điều khiển trò chuyện/luồng Codex nên ưu tiên `/codex ...` thay vì ACP trừ khi người dùng yêu cầu rõ ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không ở trong sandbox, và một Plugin backend như `acpx` đã được tải. `runtime: "acp"` mong đợi một id harness ACP bên ngoài, hoặc một mục `agents.list[]` với `runtime.type="acp"`; dùng runtime tác nhân con mặc định cho các tác nhân cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Tác nhân con native khởi động ở trạng thái cô lập trừ khi bên gọi yêu cầu rõ ràng việc rẽ nhánh
bản ghi hiện tại.

| Chế độ     | Khi nào dùng                                                                                                                           | Hành vi                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc với công cụ chậm, hoặc bất cứ thứ gì có thể được tóm lược trong văn bản tác vụ           | Tạo một bản ghi con sạch. Đây là mặc định và giữ mức sử dụng token thấp hơn.      |
| `fork`     | Công việc phụ thuộc vào cuộc trò chuyện hiện tại, kết quả công cụ trước đó, hoặc chỉ dẫn tinh tế đã có trong bản ghi của bên yêu cầu    | Rẽ nhánh bản ghi của bên yêu cầu vào phiên con trước khi tác nhân con bắt đầu.    |

Dùng `fork` một cách tiết chế. Nó dành cho ủy quyền nhạy với ngữ cảnh, không phải
thay thế cho việc viết một prompt tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Khởi động một lượt chạy tác nhân con với `deliver: false` trên làn `subagent` toàn cục,
sau đó chạy một bước thông báo và đăng câu trả lời thông báo vào kênh trò chuyện
của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu lực của bên gọi. Các hồ sơ `coding` và
`full` hiển thị `sessions_spawn` theo mặc định. Hồ sơ `messaging`
thì không; thêm `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hoặc dùng `tools.profile: "coding"` cho các tác nhân nên ủy quyền
công việc. Chính sách cho phép/từ chối theo kênh/nhóm, nhà cung cấp, sandbox và từng tác nhân
vẫn có thể loại bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ hiệu lực.

**Mặc định:**

- **Mô hình:** kế thừa từ bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng tác nhân); `sessions_spawn.model` rõ ràng vẫn được ưu tiên.
- **Thinking:** kế thừa từ bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng tác nhân); `sessions_spawn.thinking` rõ ràng vẫn được ưu tiên.
- **Thời gian chờ lượt chạy:** nếu bỏ qua `sessions_spawn.runTimeoutSeconds`, OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, quay về `0` (không có thời gian chờ).

### Tham số công cụ

<ParamField path="task" type="string" required>
  Mô tả tác vụ cho tác nhân con.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn, dễ đọc cho con người.
</ParamField>
<ParamField path="agentId" type="string">
  Sinh dưới một id tác nhân khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các harness ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode`, hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ ACP. Tiếp tục một phiên harness ACP hiện có khi `runtime: "acp"`; bị bỏ qua với các lượt sinh tác nhân con native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ ACP. Truyền trực tiếp đầu ra lượt chạy ACP tới phiên cha khi `runtime: "acp"`; bỏ qua với các lượt sinh tác nhân con native.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình tác nhân con. Các giá trị không hợp lệ bị bỏ qua và tác nhân con chạy trên mô hình mặc định với một cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức thinking cho lượt chạy tác nhân con.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi được đặt, nếu không là `0`. Khi được đặt, lượt chạy tác nhân con sẽ bị hủy sau N giây.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu gắn luồng kênh cho phiên tác nhân con này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi thông qua đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối sinh trừ khi runtime con đích ở trong sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rẽ nhánh bản ghi hiện tại của bên yêu cầu vào phiên con. Chỉ dành cho tác nhân con native. Các lượt sinh gắn luồng mặc định là `fork`; các lượt sinh không gắn luồng mặc định là `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận tham số phân phối kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Để phân phối, dùng
`message`/`sessions_send` từ lượt chạy đã sinh.
</Warning>

## Phiên gắn luồng

Khi gắn luồng được bật cho một kênh, tác nhân con có thể tiếp tục gắn
với một luồng để các tin nhắn theo dõi của người dùng trong luồng đó tiếp tục được định tuyến tới
cùng phiên tác nhân con.

### Các kênh hỗ trợ luồng

**Discord** hiện là kênh duy nhất được hỗ trợ. Nó hỗ trợ
các phiên tác nhân con gắn luồng bền vững (`sessions_spawn` với
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
  <Step title="Gắn kết">
    OpenClaw tạo hoặc gắn một luồng với đích phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Định tuyến phản hồi tiếp theo">
    Các trả lời và tin nhắn tiếp theo trong luồng đó được định tuyến tới phiên đã gắn.
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
| `/focus <target>`  | Gắn luồng hiện tại (hoặc tạo một luồng) với đích tác tử con/phiên     |
| `/unfocus`         | Xóa liên kết cho luồng hiện đang được gắn                             |
| `/agents`          | Liệt kê các lượt chạy đang hoạt động và trạng thái gắn (`thread:<id>` hoặc `unbound`) |
| `/session idle`    | Kiểm tra/cập nhật tự động bỏ tập trung khi nhàn rỗi (chỉ các luồng đã gắn đang được tập trung) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng đã gắn đang được tập trung) |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Khóa ghi đè kênh và tự động gắn khi tạo** phụ thuộc vào adapter. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết chi tiết adapter hiện tại.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách id tác tử có thể được nhắm tới qua `agentId` tường minh (`["*"]` cho phép bất kỳ). Mặc định: chỉ tác tử yêu cầu. Nếu bạn đặt một danh sách và vẫn muốn tác tử yêu cầu tự tạo chính nó với `agentId`, hãy đưa id của tác tử yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép tác tử đích mặc định được dùng khi tác tử yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ tường minh). Ghi đè theo tác tử: `agents.list[].subagents.requireAgentId`.
</ParamField>

Nếu phiên yêu cầu đang chạy trong sandbox, `sessions_spawn` từ chối các đích
sẽ chạy ngoài sandbox.

### Khám phá

Dùng `agents_list` để xem các id tác tử hiện được phép dùng cho
`sessions_spawn`. Phản hồi bao gồm mô hình hiệu lực của từng tác tử được liệt kê
và siêu dữ liệu runtime nhúng để bên gọi có thể phân biệt PI, máy chủ ứng dụng Codex
và các runtime gốc đã cấu hình khác.

### Tự động lưu trữ

- Các phiên tác tử con được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Việc lưu trữ dùng `sessions.delete` và đổi tên bản ghi hội thoại thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại bằng cách đổi tên).
- Tự động lưu trữ là nỗ lực tối đa; các bộ hẹn giờ đang chờ sẽ mất nếu gateway khởi động lại.
- `runTimeoutSeconds` **không** tự động lưu trữ; nó chỉ dừng lượt chạy. Phiên vẫn còn cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các tab/tiến trình trình duyệt được theo dõi sẽ được đóng theo nỗ lực tối đa khi lượt chạy kết thúc, ngay cả khi bản ghi hội thoại/bản ghi phiên được giữ lại.

## Tác tử con lồng nhau

Theo mặc định, tác tử con không thể tạo tác tử con của chính chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu điều phối**: chính → tác tử con điều phối →
các tác tử con cấp hai dạng worker.

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

### Các mức độ sâu

| Độ sâu | Dạng khóa phiên                              | Vai trò                                      | Có thể tạo không?            |
| ------ | -------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 0      | `agent:<id>:main`                            | Tác tử chính                                 | Luôn luôn                    |
| 1      | `agent:<id>:subagent:<uuid>`                 | Tác tử con (điều phối khi cho phép độ sâu 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Tác tử con cấp hai (worker lá)               | Không bao giờ                |

### Chuỗi thông báo

Kết quả chảy ngược lên chuỗi:

1. Worker độ sâu 2 hoàn tất → thông báo cho cha của nó (tác tử điều phối độ sâu 1).
2. Tác tử điều phối độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho tác tử chính.
3. Tác tử chính nhận thông báo và gửi tới người dùng.

Mỗi cấp chỉ thấy thông báo từ các con trực tiếp của nó.

<Note>
**Hướng dẫn vận hành:** khởi động công việc con một lần và chờ sự kiện hoàn tất
thay vì xây các vòng lặp thăm dò quanh `sessions_list`,
`sessions_history`, `/subagents list`, hoặc các lệnh `exec` sleep.
`sessions_list` và `/subagents list` giữ quan hệ phiên con
tập trung vào công việc trực tiếp — con đang chạy vẫn được gắn, con đã kết thúc vẫn
hiển thị trong một khoảng thời gian gần đây ngắn, và các liên kết con chỉ còn trong kho lưu trữ cũ
bị bỏ qua sau cửa sổ độ mới của chúng. Điều này ngăn siêu dữ liệu `spawnedBy` /
`parentSessionKey` cũ làm sống lại các con ảo sau khi
khởi động lại. Nếu sự kiện hoàn tất của con đến sau khi bạn đã gửi
câu trả lời cuối cùng, phản hồi tiếp theo đúng là token im lặng chính xác
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được ghi vào siêu dữ liệu phiên tại thời điểm tạo. Điều đó ngăn các khóa phiên phẳng hoặc đã khôi phục vô tình lấy lại đặc quyền điều phối.
- **Độ sâu 1 (điều phối, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể quản lý các con của nó. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (worker lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể tạo thêm con.

### Giới hạn tạo theo tác tử

Mỗi phiên tác tử (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) con đang hoạt động cùng lúc. Điều này ngăn một tác tử điều phối đơn lẻ
phân nhánh mất kiểm soát.

### Dừng dây chuyền

Dừng một tác tử điều phối độ sâu 1 sẽ tự động dừng tất cả con độ sâu 2
của nó:

- `/stop` trong cuộc trò chuyện chính dừng tất cả tác tử độ sâu 1 và lan tới các con độ sâu 2 của chúng.
- `/subagents kill <id>` dừng một tác tử con cụ thể và lan tới các con của nó.
- `/subagents kill all` dừng tất cả tác tử con của bên yêu cầu và lan truyền.

## Xác thực

Xác thực tác tử con được phân giải theo **id tác tử**, không theo loại phiên:

- Khóa phiên tác tử con là `agent:<agentId>:subagent:<uuid>`.
- Kho xác thực được tải từ `agentDir` của tác tử đó.
- Các hồ sơ xác thực của tác tử chính được hợp nhất vào như một **dự phòng**; hồ sơ tác tử ghi đè hồ sơ chính khi có xung đột.

Việc hợp nhất có tính cộng thêm, nên hồ sơ chính luôn có sẵn làm
dự phòng. Xác thực cô lập hoàn toàn theo từng tác tử hiện chưa được hỗ trợ.

## Thông báo

Tác tử con báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác tử con (không phải phiên yêu cầu).
- Nếu tác tử con trả lời chính xác `ANNOUNCE_SKIP`, không có gì được đăng.
- Nếu văn bản assistant mới nhất là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo bị chặn ngay cả khi trước đó từng có tiến trình hiển thị.

Cách gửi phụ thuộc vào độ sâu của bên yêu cầu:

- Các phiên yêu cầu cấp cao nhất dùng một lệnh gọi `agent` tiếp theo với gửi bên ngoài (`deliver=true`).
- Các phiên tác tử con yêu cầu lồng nhau nhận một lần chèn tiếp theo nội bộ (`deliver=false`) để tác tử điều phối có thể tổng hợp kết quả con trong phiên.
- Nếu một phiên tác tử con yêu cầu lồng nhau không còn tồn tại, OpenClaw quay về bên yêu cầu của phiên đó khi có sẵn.

Đối với các phiên yêu cầu cấp cao nhất, gửi trực tiếp ở chế độ hoàn tất trước tiên
phân giải mọi tuyến hội thoại/luồng đã gắn và ghi đè hook, sau đó điền
các trường đích kênh bị thiếu từ tuyến đã lưu của phiên yêu cầu.
Điều đó giữ các hoàn tất ở đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn hoàn tất
chỉ xác định kênh.

Tổng hợp hoàn tất của con được giới hạn theo lượt chạy yêu cầu hiện tại khi
xây dựng các phát hiện hoàn tất lồng nhau, ngăn đầu ra con từ lượt chạy trước cũ
rò rỉ vào thông báo hiện tại. Các trả lời thông báo giữ nguyên
định tuyến luồng/chủ đề khi adapter kênh có sẵn.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường           | Nguồn                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguồn            | `subagent` hoặc `cron`                                                                                        |
| Id phiên         | Khóa/id phiên con                                                                                             |
| Loại             | Loại thông báo + nhãn tác vụ                                                                                  |
| Trạng thái       | Suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`) — **không** suy luận từ văn bản mô hình |
| Nội dung kết quả | Văn bản assistant hiển thị mới nhất, nếu không thì văn bản tool/toolResult mới nhất đã làm sạch               |
| Theo dõi         | Chỉ dẫn mô tả khi nào trả lời và khi nào im lặng                                                              |

Các lượt chạy kết thúc thất bại báo cáo trạng thái lỗi mà không phát lại
văn bản trả lời đã ghi lại. Khi hết thời gian, nếu con chỉ mới đi qua các lệnh gọi công cụ,
thông báo có thể thu gọn lịch sử đó thành một tóm tắt tiến độ một phần ngắn
thay vì phát lại đầu ra công cụ thô.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc):

- Runtime (ví dụ `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi giá mô hình được cấu hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, và đường dẫn bản ghi hội thoại để tác tử chính có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Siêu dữ liệu nội bộ chỉ dành cho điều phối; các trả lời hướng tới người dùng
nên được viết lại bằng giọng assistant thông thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là đường dẫn điều phối an toàn hơn:

- Khả năng nhớ lại của assistant được chuẩn hóa trước: bỏ thẻ suy nghĩ; bỏ khung `<relevant-memories>` / `<relevant_memories>`; bỏ các khối payload XML gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), bao gồm cả payload bị cắt cụt không bao giờ đóng sạch; bỏ khung gọi công cụ/kết quả đã hạ cấp và các dấu mốc ngữ cảnh lịch sử; bỏ các token điều khiển mô hình bị rò rỉ (`<|assistant|>`, các ASCII `<|...|>` khác, toàn độ rộng `<｜...｜>`); bỏ XML gọi công cụ MiniMax sai định dạng.
- Văn bản giống thông tin xác thực/token được biên tập lại.
- Các khối dài có thể bị cắt ngắn.
- Lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá lớn bằng `[sessions_history omitted: message too large]`.
- Kiểm tra bản ghi hội thoại thô trên đĩa là phương án dự phòng khi bạn cần bản ghi đầy đủ từng byte.

## Chính sách công cụ

Tác nhân con trước tiên dùng cùng hồ sơ và quy trình chính sách công cụ như tác nhân cha hoặc
tác nhân đích. Sau đó, OpenClaw áp dụng lớp hạn chế
dành cho tác nhân con.

Khi không có `tools.profile` mang tính hạn chế, tác nhân con nhận được **tất cả công cụ ngoại trừ
công cụ phiên** và công cụ hệ thống:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` ở đây cũng vẫn là một chế độ xem truy hồi có giới hạn và đã được làm sạch —
không phải là bản kết xuất biên bản thô.

Khi `maxSpawnDepth >= 2`, các tác nhân con điều phối ở độ sâu 1 còn
nhận thêm `sessions_spawn`, `subagents`, `sessions_list` và
`sessions_history` để chúng có thể quản lý các tác nhân con của mình.

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

`tools.subagents.tools.allow` là một bộ lọc cuối cùng chỉ cho phép. Nó có thể thu hẹp
tập công cụ đã được phân giải, nhưng không thể **thêm lại** một công cụ đã bị
`tools.profile` loại bỏ. Ví dụ, `tools.profile: "coding"` bao gồm
`web_search`/`web_fetch` nhưng không bao gồm công cụ `browser`. Để cho phép
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
tác nhân cần có tự động hóa trình duyệt.

## Đồng thời

Tác nhân con dùng một làn hàng đợi trong tiến trình chuyên biệt:

- **Tên làn:** `subagent`
- **Mức đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Tính sống và khôi phục

OpenClaw không xem việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một
tác nhân con vẫn còn hoạt động. Các lượt chạy chưa kết thúc cũ hơn cửa sổ lượt chạy cũ
sẽ không còn được tính là đang hoạt động/đang chờ trong `/subagents list`, bản tóm tắt trạng thái,
cổng hoàn tất hậu duệ và kiểm tra đồng thời theo phiên.

Sau khi Gateway khởi động lại, các lượt chạy đã khôi phục nhưng cũ và chưa kết thúc sẽ bị cắt bỏ trừ khi
phiên con của chúng được đánh dấu `abortedLastRun: true`. Những
phiên con bị hủy do khởi động lại đó vẫn có thể khôi phục thông qua luồng khôi phục tác nhân con mồ côi,
luồng này gửi một thông báo tiếp tục tổng hợp trước khi
xóa dấu hiệu đã hủy.

Khôi phục tự động sau khởi động lại được giới hạn theo từng phiên con. Nếu cùng một
tác nhân con được chấp nhận khôi phục mồ côi lặp lại trong
cửa sổ kẹt lại nhanh, OpenClaw lưu một tombstone khôi phục trên
phiên đó và ngừng tự động tiếp tục phiên trong các lần khởi động lại sau. Chạy
`openclaw tasks maintenance --apply` để đối chiếu bản ghi tác vụ, hoặc
`openclaw doctor --fix` để xóa các cờ khôi phục đã hủy bị cũ trên
các phiên có tombstone.

<Note>
Nếu việc tạo tác nhân con thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra bên gọi RPC trước khi chỉnh sửa trạng thái ghép đôi.
Điều phối `sessions_spawn` nội bộ nên kết nối với tư cách
`client.id: "gateway-client"` cùng `client.mode: "backend"` qua xác thực
mật khẩu/token chia sẻ trực tiếp trên local loopback; đường dẫn đó không phụ thuộc vào
đường cơ sở phạm vi thiết bị đã ghép đôi của CLI. Các bên gọi từ xa, `deviceIdentity`
tường minh, đường dẫn device-token tường minh và các ứng dụng khách browser/node
vẫn cần phê duyệt thiết bị bình thường cho các nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên của bên yêu cầu và dừng mọi lượt chạy tác nhân con đang hoạt động được tạo từ phiên đó, lan truyền đến các tác nhân con lồng nhau.
- `/subagents kill <id>` dừng một tác nhân con cụ thể và lan truyền đến các tác nhân con của nó.

## Giới hạn

- Thông báo tác nhân con là **nỗ lực tối đa**. Nếu gateway khởi động lại, công việc "thông báo lại" đang chờ sẽ bị mất.
- Tác nhân con vẫn chia sẻ cùng tài nguyên tiến trình gateway; hãy xem `maxConcurrent` là một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác nhân con chỉ chèn `AGENTS.md` + `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` hoặc `BOOTSTRAP.md`).
- Độ sâu lồng tối đa là 5 (phạm vi `maxSpawnDepth`: 1–5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số tác nhân con đang hoạt động trên mỗi phiên (mặc định `5`, phạm vi `1–20`).

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
