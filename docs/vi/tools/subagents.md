---
read_when:
    - Bạn muốn thực hiện công việc chạy nền hoặc song song thông qua tác nhân
    - Bạn đang thay đổi chính sách công cụ `sessions_spawn` hoặc tác tử phụ
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên tác nhân phụ gắn với luồng
sidebarTitle: Sub-agents
summary: Khởi tạo các phiên chạy tác tử nền cô lập thông báo kết quả về cuộc trò chuyện của người yêu cầu
title: Tác nhân phụ
x-i18n:
    generated_at: "2026-05-02T10:56:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e964df543bd19435daf94f2c85a34b9d32e07662405d2eac7635935f1e7bf64
    source_path: tools/subagents.md
    workflow: 16
---

Tác tử con là các lượt chạy tác tử nền được tạo ra từ một lượt chạy tác tử hiện có.
Chúng chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả trở lại kênh trò chuyện của bên yêu cầu.
Mỗi lượt chạy tác tử con được theo dõi như một
[tác vụ nền](/vi/automation/tasks).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn lượt chạy chính.
- Giữ tác tử con tách biệt theo mặc định (tách phiên + sandbox tùy chọn).
- Giữ bề mặt công cụ khó bị dùng sai: tác tử con không nhận công cụ phiên theo mặc định.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu điều phối.

<Note>
**Ghi chú chi phí:** mỗi tác tử con có ngữ cảnh và mức sử dụng token riêng theo
mặc định. Với các tác vụ nặng hoặc lặp lại, hãy đặt một mô hình rẻ hơn cho tác tử con
và giữ tác tử chính trên mô hình chất lượng cao hơn. Cấu hình qua
`agents.defaults.subagents.model` hoặc ghi đè theo từng tác tử. Khi một tác tử con
    thực sự cần transcript hiện tại của bên yêu cầu, tác tử có thể yêu cầu
    `context: "fork"` trên lần tạo đó. Các phiên subagent gắn với thread mặc định
    là `context: "fork"` vì chúng phân nhánh cuộc hội thoại hiện tại thành một
    thread theo dõi tiếp.
</Note>

## Lệnh slash

Dùng `/subagents` để kiểm tra hoặc điều khiển các lượt chạy tác tử con cho **phiên hiện tại**:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info` hiển thị siêu dữ liệu lượt chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn transcript, dọn dẹp). Dùng `sessions_history` để xem lại có giới hạn,
đã lọc an toàn; kiểm tra đường dẫn transcript trên đĩa khi bạn
cần transcript thô đầy đủ.

### Điều khiển gắn thread

Các lệnh này hoạt động trên những kênh hỗ trợ liên kết thread bền vững.
Xem [Các kênh hỗ trợ thread](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi tạo

`/subagents spawn` khởi động một tác tử con nền dưới dạng lệnh người dùng (không phải
chuyển tiếp nội bộ) và gửi một bản cập nhật hoàn tất cuối cùng trở lại
cuộc trò chuyện của bên yêu cầu khi lượt chạy kết thúc.

<AccordionGroup>
  <Accordion title="Hoàn tất không chặn, dựa trên đẩy">
    - Lệnh tạo không chặn; nó trả về id lượt chạy ngay lập tức.
    - Khi hoàn tất, tác tử con thông báo một thông điệp tóm tắt/kết quả trở lại kênh trò chuyện của bên yêu cầu.
    - Việc hoàn tất dựa trên đẩy. Sau khi đã tạo, đừng thăm dò `/subagents list`, `sessions_list`, hoặc `sessions_history` trong vòng lặp chỉ để chờ nó kết thúc; chỉ kiểm tra trạng thái theo nhu cầu để gỡ lỗi hoặc can thiệp.
    - Khi hoàn tất, OpenClaw cố gắng hết sức đóng các tab trình duyệt/quy trình được theo dõi mà phiên tác tử con đó đã mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Độ bền gửi khi tạo thủ công">
    - OpenClaw thử gửi trực tiếp qua `agent` trước với khóa idempotency ổn định.
    - Nếu gửi trực tiếp thất bại, nó chuyển sang định tuyến hàng đợi dự phòng.
    - Nếu định tuyến hàng đợi vẫn chưa khả dụng, thông báo được thử lại với backoff lũy thừa ngắn trước khi bỏ cuộc cuối cùng.
    - Việc gửi hoàn tất giữ tuyến bên yêu cầu đã phân giải: các tuyến hoàn tất gắn với thread hoặc gắn với cuộc hội thoại được ưu tiên khi khả dụng; nếu nguồn hoàn tất chỉ cung cấp một kênh, OpenClaw điền target/account còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để gửi trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Siêu dữ liệu bàn giao hoàn tất">
    Bàn giao hoàn tất cho phiên bên yêu cầu là ngữ cảnh nội bộ do runtime tạo
    (không phải văn bản do người dùng viết) và bao gồm:

    - `Result` — văn bản trả lời `assistant` hiển thị mới nhất, nếu không có thì là văn bản tool/toolResult mới nhất đã được làm sạch. Các lượt chạy thất bại ở trạng thái cuối không tái sử dụng văn bản trả lời đã thu được.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Thống kê runtime/token rút gọn.
    - Một chỉ dẫn gửi yêu cầu tác tử bên yêu cầu viết lại bằng giọng trợ lý bình thường (không chuyển tiếp siêu dữ liệu nội bộ thô).

  </Accordion>
  <Accordion title="Chế độ và runtime ACP">
    - `--model` và `--thinking` ghi đè mặc định cho lượt chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - `/subagents spawn` là chế độ một lần (`mode: "run"`). Với các phiên gắn thread bền vững, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Với các phiên harness ACP (Claude Code, Gemini CLI, OpenCode, hoặc Codex ACP/acpx rõ ràng), dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [mô hình gửi ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi việc hoàn tất hoặc các vòng lặp tác tử-với-tác tử. Khi Plugin `codex` được bật, điều khiển chat/thread của Codex nên ưu tiên `/codex ...` thay vì ACP trừ khi người dùng yêu cầu rõ ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không bị sandbox, và một Plugin backend như `acpx` đã được tải. `runtime: "acp"` kỳ vọng một id harness ACP bên ngoài, hoặc một mục `agents.list[]` với `runtime.type="acp"`; dùng runtime tác tử con mặc định cho các tác tử cấu hình OpenClaw bình thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Tác tử con native khởi đầu tách biệt trừ khi bên gọi yêu cầu rõ ràng phân nhánh
transcript hiện tại.

| Chế độ     | Khi nào dùng                                                                                                                           | Hành vi                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm, hoặc bất cứ việc gì có thể được tóm lược trong văn bản tác vụ              | Tạo một transcript con sạch. Đây là mặc định và giúp giảm mức sử dụng token.      |
| `fork`     | Công việc phụ thuộc vào cuộc hội thoại hiện tại, kết quả công cụ trước đó, hoặc chỉ dẫn tinh tế đã có trong transcript của bên yêu cầu | Phân nhánh transcript của bên yêu cầu vào phiên con trước khi tác tử con bắt đầu. |

Dùng `fork` một cách tiết kiệm. Nó dành cho ủy quyền nhạy theo ngữ cảnh, không phải
thay thế cho việc viết một prompt tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Khởi động một lượt chạy tác tử con với `deliver: false` trên làn `subagent` toàn cục,
sau đó chạy một bước thông báo và đăng trả lời thông báo vào kênh trò chuyện
của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu lực của bên gọi. Các hồ sơ `coding` và
`full` hiển thị `sessions_spawn` theo mặc định. Hồ sơ `messaging`
thì không; thêm `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hoặc dùng `tools.profile: "coding"` cho các tác tử cần ủy quyền
công việc. Các chính sách cho kênh/nhóm, nhà cung cấp, sandbox và allow/deny theo từng tác tử
vẫn có thể loại bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ hiệu lực.

**Mặc định:**

- **Mô hình:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng tác tử); `sessions_spawn.model` rõ ràng vẫn được ưu tiên.
- **Thinking:** kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng tác tử); `sessions_spawn.thinking` rõ ràng vẫn được ưu tiên.
- **Thời hạn lượt chạy:** nếu bỏ qua `sessions_spawn.runTimeoutSeconds`, OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không thì quay về `0` (không có thời hạn).

### Tham số công cụ

<ParamField path="task" type="string" required>
  Mô tả tác vụ cho tác tử con.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn, dễ đọc cho con người.
</ParamField>
<ParamField path="agentId" type="string">
  Tạo dưới id tác tử khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các harness ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode`, hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ ACP. Tiếp tục một phiên harness ACP hiện có khi `runtime: "acp"`; bị bỏ qua với lượt tạo tác tử con native.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ ACP. Stream đầu ra lượt chạy ACP tới phiên cha khi `runtime: "acp"`; bỏ qua với lượt tạo tác tử con native.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình tác tử con. Giá trị không hợp lệ sẽ bị bỏ qua và tác tử con chạy trên mô hình mặc định với cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức thinking cho lượt chạy tác tử con.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Mặc định là `agents.defaults.subagents.runTimeoutSeconds` khi được đặt, nếu không là `0`. Khi được đặt, lượt chạy tác tử con bị hủy sau N giây.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu gắn thread kênh cho phiên tác tử con này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ ngay sau khi thông báo (vẫn giữ transcript bằng cách đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối tạo trừ khi runtime con đích được sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` phân nhánh transcript hiện tại của bên yêu cầu vào phiên con. Chỉ dành cho tác tử con native. Các lượt tạo gắn thread mặc định là `fork`; các lượt tạo không gắn thread mặc định là `isolated`.
</ParamField>

<Warning>
`sessions_spawn` không chấp nhận tham số gửi qua kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Để gửi, dùng
`message`/`sessions_send` từ lượt chạy đã tạo.
</Warning>

## Phiên gắn thread

Khi liên kết thread được bật cho một kênh, tác tử con có thể tiếp tục gắn với
một thread để các tin nhắn người dùng theo dõi tiếp trong thread đó tiếp tục định tuyến tới
cùng phiên tác tử con.

### Các kênh hỗ trợ thread

**Discord** hiện là kênh duy nhất được hỗ trợ. Kênh này hỗ trợ
các phiên subagent gắn thread bền vững (`sessions_spawn` với
`thread: true`), điều khiển thread thủ công (`/focus`, `/unfocus`, `/agents`,
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
  <Step title="Gắn">
    OpenClaw tạo hoặc gắn một thread vào target phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Định tuyến theo dõi tiếp">
    Các trả lời và tin nhắn theo dõi tiếp trong thread đó định tuyến tới phiên đã gắn.
  </Step>
  <Step title="Kiểm tra thời hạn">
    Dùng `/session idle` để kiểm tra/cập nhật tự động unfocus khi không hoạt động và
    `/session max-age` để điều khiển giới hạn cứng.
  </Step>
  <Step title="Tách">
    Dùng `/unfocus` để tách thủ công.
  </Step>
</Steps>

### Điều khiển thủ công

| Lệnh            | Tác dụng                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Ràng buộc luồng hiện tại (hoặc tạo một luồng) với mục tiêu tác nhân phụ/phiên |
| `/unfocus`         | Xóa ràng buộc cho luồng hiện đang được ràng buộc                       |
| `/agents`          | Liệt kê các lần chạy đang hoạt động và trạng thái ràng buộc (`thread:<id>` hoặc `unbound`)       |
| `/session idle`    | Kiểm tra/cập nhật tự động hủy tập trung khi nhàn rỗi (chỉ các luồng được ràng buộc đang được tập trung)         |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng được ràng buộc đang được tập trung)                  |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Khóa ghi đè kênh và tự động ràng buộc khi sinh** là đặc thù theo bộ chuyển đổi. Xem [Kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết chi tiết bộ chuyển đổi hiện tại.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách ID tác nhân có thể được nhắm mục tiêu qua `agentId` rõ ràng (`["*"]` cho phép bất kỳ). Mặc định: chỉ tác nhân yêu cầu. Nếu bạn đặt một danh sách và vẫn muốn tác nhân yêu cầu tự sinh chính nó bằng `agentId`, hãy đưa ID của tác nhân yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép tác nhân mục tiêu mặc định được dùng khi tác nhân yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng). Ghi đè theo từng tác nhân: `agents.list[].subagents.requireAgentId`.
</ParamField>

Nếu phiên yêu cầu được sandbox, `sessions_spawn` sẽ từ chối các mục tiêu
sẽ chạy không trong sandbox.

### Khám phá

Dùng `agents_list` để xem những ID tác nhân nào hiện được phép cho
`sessions_spawn`. Phản hồi bao gồm mô hình hiệu dụng của từng tác nhân được liệt kê
và siêu dữ liệu runtime nhúng để bên gọi có thể phân biệt PI, máy chủ ứng dụng Codex
và các runtime gốc khác đã cấu hình.

### Tự động lưu trữ

- Các phiên tác nhân phụ được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Lưu trữ dùng `sessions.delete` và đổi tên bản ghi hội thoại thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại bằng cách đổi tên).
- Tự động lưu trữ là nỗ lực tối đa; các bộ hẹn giờ đang chờ sẽ mất nếu Gateway khởi động lại.
- `runTimeoutSeconds` **không** tự động lưu trữ; nó chỉ dừng lần chạy. Phiên vẫn còn cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các tab/tiến trình trình duyệt được theo dõi sẽ được đóng theo nỗ lực tối đa khi lần chạy kết thúc, ngay cả khi bản ghi hội thoại/bản ghi phiên được giữ lại.

## Tác nhân phụ lồng nhau

Theo mặc định, tác nhân phụ không thể sinh tác nhân phụ của riêng chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu điều phối**: chính → tác nhân phụ điều phối →
các tác nhân phụ con làm việc.

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

| Độ sâu | Dạng khóa phiên                            | Vai trò                                          | Có thể sinh?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Tác nhân chính                                    | Luôn luôn                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Tác nhân phụ (điều phối khi cho phép độ sâu 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Tác nhân phụ con (worker lá)                   | Không bao giờ                        |

### Chuỗi thông báo

Kết quả chảy ngược lên chuỗi:

1. Worker độ sâu 2 hoàn tất → thông báo cho cha của nó (điều phối viên độ sâu 1).
2. Điều phối viên độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho chính.
3. Tác nhân chính nhận thông báo và gửi cho người dùng.

Mỗi cấp chỉ thấy thông báo từ con trực tiếp của nó.

<Note>
**Hướng dẫn vận hành:** bắt đầu công việc con một lần và chờ sự kiện hoàn tất
thay vì xây dựng vòng lặp thăm dò quanh `sessions_list`,
`sessions_history`, `/subagents list`, hoặc lệnh ngủ `exec`.
`sessions_list` và `/subagents list` giữ các quan hệ phiên con
tập trung vào công việc đang hoạt động — con đang hoạt động vẫn được gắn, con đã kết thúc vẫn
hiển thị trong một cửa sổ gần đây ngắn, và các liên kết con chỉ còn trong kho đã cũ
bị bỏ qua sau cửa sổ độ mới của chúng. Điều này ngăn siêu dữ liệu `spawnedBy` /
`parentSessionKey` cũ hồi sinh các con ảo sau khi
khởi động lại. Nếu một sự kiện hoàn tất của con đến sau khi bạn đã gửi
câu trả lời cuối cùng, phản hồi tiếp theo đúng là token im lặng chính xác
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được ghi vào siêu dữ liệu phiên tại thời điểm sinh. Điều đó giúp các khóa phiên phẳng hoặc được khôi phục không vô tình lấy lại đặc quyền điều phối.
- **Độ sâu 1 (điều phối viên, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể quản lý con của nó. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (worker lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể sinh thêm con.

### Giới hạn sinh theo từng tác nhân

Mỗi phiên tác nhân (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) con đang hoạt động tại một thời điểm. Điều này ngăn một điều phối viên đơn lẻ
phân nhánh mất kiểm soát.

### Dừng dây chuyền

Dừng một điều phối viên độ sâu 1 sẽ tự động dừng tất cả con độ sâu 2
của nó:

- `/stop` trong cuộc trò chuyện chính dừng tất cả tác nhân độ sâu 1 và dây chuyền đến con độ sâu 2 của chúng.
- `/subagents kill <id>` dừng một tác nhân phụ cụ thể và dây chuyền đến con của nó.
- `/subagents kill all` dừng tất cả tác nhân phụ cho bên yêu cầu và dây chuyền.

## Xác thực

Xác thực tác nhân phụ được phân giải theo **ID tác nhân**, không theo loại phiên:

- Khóa phiên tác nhân phụ là `agent:<agentId>:subagent:<uuid>`.
- Kho xác thực được tải từ `agentDir` của tác nhân đó.
- Hồ sơ xác thực của tác nhân chính được hợp nhất vào làm **dự phòng**; hồ sơ tác nhân ghi đè hồ sơ chính khi có xung đột.

Việc hợp nhất là bổ sung, nên hồ sơ chính luôn có sẵn làm
dự phòng. Xác thực hoàn toàn cô lập theo từng tác nhân chưa được hỗ trợ.

## Thông báo

Tác nhân phụ báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác nhân phụ (không phải phiên yêu cầu).
- Nếu tác nhân phụ trả lời chính xác `ANNOUNCE_SKIP`, không có gì được đăng.
- Nếu văn bản trợ lý mới nhất là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo bị chặn ngay cả khi trước đó có tiến trình hiển thị.

Việc gửi phụ thuộc vào độ sâu của bên yêu cầu:

- Các phiên yêu cầu cấp cao nhất dùng một lệnh gọi `agent` tiếp theo với gửi bên ngoài (`deliver=true`).
- Các phiên tác nhân phụ yêu cầu lồng nhau nhận một phần chèn tiếp theo nội bộ (`deliver=false`) để điều phối viên có thể tổng hợp kết quả con trong phiên.
- Nếu một phiên tác nhân phụ yêu cầu lồng nhau không còn, OpenClaw quay về bên yêu cầu của phiên đó khi có sẵn.

Đối với các phiên yêu cầu cấp cao nhất, gửi trực tiếp ở chế độ hoàn tất trước tiên
phân giải bất kỳ tuyến hội thoại/luồng được ràng buộc nào và ghi đè hook, sau đó điền
các trường mục tiêu kênh còn thiếu từ tuyến đã lưu của phiên yêu cầu.
Điều này giữ các hoàn tất ở đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn gốc hoàn tất
chỉ xác định kênh.

Việc tổng hợp hoàn tất của con được giới hạn trong lần chạy yêu cầu hiện tại khi
xây dựng các phát hiện hoàn tất lồng nhau, ngăn đầu ra con từ lần chạy trước đã cũ
rò rỉ vào thông báo hiện tại. Phản hồi thông báo giữ nguyên
định tuyến luồng/chủ đề khi có sẵn trên bộ chuyển đổi kênh.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường          | Nguồn                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguồn         | `subagent` hoặc `cron`                                                                                          |
| ID phiên    | Khóa/ID phiên con                                                                                          |
| Loại           | Loại thông báo + nhãn tác vụ                                                                                    |
| Trạng thái         | Suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`) — **không** suy luận từ văn bản mô hình |
| Nội dung kết quả | Văn bản trợ lý hiển thị mới nhất, nếu không thì văn bản công cụ/toolResult mới nhất đã được làm sạch                                |
| Tiếp theo      | Chỉ dẫn mô tả khi nào nên trả lời so với giữ im lặng                                                           |

Các lần chạy kết thúc thất bại báo cáo trạng thái thất bại mà không phát lại
văn bản trả lời đã ghi lại. Khi hết thời gian, nếu con chỉ đi qua các lệnh gọi công cụ,
thông báo có thể thu gọn lịch sử đó thành một bản tóm tắt tiến trình một phần ngắn
thay vì phát lại đầu ra công cụ thô.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc):

- Runtime (ví dụ `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi giá mô hình được cấu hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, và đường dẫn bản ghi hội thoại để tác nhân chính có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Siêu dữ liệu nội bộ chỉ dùng cho điều phối; các phản hồi hướng tới người dùng
nên được viết lại bằng giọng trợ lý bình thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là đường điều phối an toàn hơn:

- Việc nhớ lại của trợ lý được chuẩn hóa trước: loại bỏ thẻ suy nghĩ; loại bỏ khung `<relevant-memories>` / `<relevant_memories>`; loại bỏ các khối payload XML lệnh gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), bao gồm cả payload bị cắt cụt chưa bao giờ đóng sạch; loại bỏ khung lệnh gọi/kết quả công cụ bị hạ cấp và dấu mốc ngữ cảnh lịch sử; loại bỏ token điều khiển mô hình bị rò rỉ (`<|assistant|>`, các ASCII `<|...|>` khác, dạng toàn chiều rộng `<｜...｜>`); loại bỏ XML lệnh gọi công cụ MiniMax sai định dạng.
- Văn bản giống thông tin xác thực/token được biên tập.
- Các khối dài có thể bị cắt ngắn.
- Lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá khổ bằng `[sessions_history omitted: message too large]`.
- Kiểm tra bản ghi hội thoại thô trên đĩa là phương án dự phòng khi bạn cần bản ghi đầy đủ từng byte một.

## Chính sách công cụ

Tác nhân phụ trước tiên dùng cùng hồ sơ và pipeline chính sách công cụ như tác nhân cha hoặc
tác nhân mục tiêu. Sau đó, OpenClaw áp dụng lớp hạn chế
tác nhân phụ.

Khi không có `tools.profile` hạn chế, tác nhân phụ nhận **tất cả công cụ ngoại trừ
công cụ phiên** và công cụ hệ thống:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` vẫn là một chế độ xem nhớ lại có giới hạn, đã làm sạch ở đây nữa — nó
không phải là bản dump bản ghi hội thoại thô.

Khi `maxSpawnDepth >= 2`, các tác nhân phụ điều phối độ sâu 1 còn
nhận `sessions_spawn`, `subagents`, `sessions_list`, và
`sessions_history` để có thể quản lý con của chúng.

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
các sub-agent dùng coding-profile sử dụng tự động hóa trình duyệt, hãy thêm browser ở
giai đoạn profile:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Dùng `agents.list[].tools.alsoAllow: ["browser"]` theo từng agent khi chỉ một
agent cần có tự động hóa trình duyệt.

## Đồng thời

Sub-agent sử dụng một lane hàng đợi chuyên dụng trong tiến trình:

- **Tên lane:** `subagent`
- **Độ đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Tính sống và khôi phục

OpenClaw không xem việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một
sub-agent vẫn còn sống. Các lần chạy chưa kết thúc cũ hơn cửa sổ stale-run
sẽ không còn được tính là active/pending trong `/subagents list`, bản tóm tắt trạng thái,
cổng hoàn tất descendant, và kiểm tra độ đồng thời theo từng phiên.

Sau khi Gateway khởi động lại, các lần chạy đã khôi phục nhưng chưa kết thúc và đã stale sẽ bị loại bỏ, trừ khi
phiên con của chúng được đánh dấu `abortedLastRun: true`. Những
phiên con bị hủy do khởi động lại này vẫn có thể khôi phục qua luồng khôi phục orphan của sub-agent,
luồng này gửi một thông điệp resume tổng hợp trước khi
xóa dấu hủy.

Khôi phục tự động sau khởi động lại được giới hạn theo từng phiên con. Nếu cùng một
sub-agent con được chấp nhận để khôi phục orphan lặp lại bên trong
cửa sổ rapid re-wedge, OpenClaw lưu một tombstone khôi phục trên
phiên đó và dừng tự động resume nó trong các lần khởi động lại sau. Chạy
`openclaw tasks maintenance --apply` để đối chiếu bản ghi tác vụ, hoặc
`openclaw doctor --fix` để xóa các cờ khôi phục đã hủy stale trên
các phiên đã tombstone.

<Note>
Nếu việc spawn sub-agent thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra bên gọi RPC trước khi chỉnh sửa trạng thái ghép nối.
Điều phối `sessions_spawn` nội bộ nên kết nối dưới dạng
`client.id: "gateway-client"` với `client.mode: "backend"` qua xác thực
shared-token/password local loopback trực tiếp; đường dẫn đó không phụ thuộc vào
baseline phạm vi thiết bị đã ghép nối của CLI. Các bên gọi từ xa,
`deviceIdentity` tường minh, đường dẫn device-token tường minh, và client trình duyệt/node
vẫn cần phê duyệt thiết bị thông thường cho các nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện của requester sẽ hủy phiên requester và dừng mọi lần chạy sub-agent đang active được spawn từ phiên đó, lan truyền đến các con lồng nhau.
- `/subagents kill <id>` dừng một sub-agent cụ thể và lan truyền đến các con của nó.

## Giới hạn

- Thông báo của sub-agent là **best-effort**. Nếu Gateway khởi động lại, công việc "announce back" đang chờ sẽ bị mất.
- Sub-agent vẫn chia sẻ cùng tài nguyên tiến trình Gateway; hãy xem `maxConcurrent` là một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh sub-agent chỉ chèn `AGENTS.md` + `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`).
- Độ sâu lồng nhau tối đa là 5 (phạm vi `maxSpawnDepth`: 1–5). Khuyến nghị dùng độ sâu 2 cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số con active trên mỗi phiên (mặc định `5`, phạm vi `1–20`).

## Liên quan

- [ACP agents](/vi/tools/acp-agents)
- [Agent send](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa agent](/vi/tools/multi-agent-sandbox-tools)
