---
read_when:
    - Bạn muốn công việc nền hoặc song song thông qua agent
    - Bạn đang thay đổi chính sách sessions_spawn hoặc công cụ sub-agent
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên subagent gắn với luồng
sidebarTitle: Sub-agents
summary: Khởi chạy các lượt chạy tác tử nền cô lập để thông báo kết quả trở lại cuộc trò chuyện của người yêu cầu
title: Tác nhân phụ
x-i18n:
    generated_at: "2026-06-27T18:19:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

Tác tử con là các lượt chạy tác tử nền được sinh ra từ một lượt chạy tác tử hiện có.
Chúng chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả trở lại kênh trò chuyện của bên yêu cầu.
Mỗi lượt chạy tác tử con được theo dõi như một
[tác vụ nền](/vi/automation/tasks).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn lượt chạy chính.
- Giữ tác tử con được cô lập theo mặc định (tách phiên + tùy chọn sandbox).
- Giữ bề mặt công cụ khó bị dùng sai: tác tử con **không** có công cụ phiên theo mặc định.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu orchestrator.

<Note>
**Lưu ý chi phí:** theo mặc định, mỗi tác tử con có ngữ cảnh và mức sử dụng token
riêng. Với các tác vụ nặng hoặc lặp lại, hãy đặt model rẻ hơn cho tác tử con
và giữ tác tử chính của bạn trên model chất lượng cao hơn. Cấu hình qua
`agents.defaults.subagents.model` hoặc ghi đè theo từng tác tử. Khi một tác tử con
    thực sự cần bản ghi hiện tại của bên yêu cầu, tác tử có thể yêu cầu
    `context: "fork"` trên lần sinh đó. Các phiên tác tử con gắn với luồng mặc định
    dùng `context: "fork"` vì chúng rẽ nhánh cuộc trò chuyện hiện tại sang một
    luồng theo dõi.
</Note>

## Lệnh Slash

Dùng `/subagents` để kiểm tra các lượt chạy tác tử con cho **phiên hiện tại**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` hiển thị siêu dữ liệu lượt chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn bản ghi, dọn dẹp). Dùng `sessions_history` để xem lại có giới hạn,
đã lọc an toàn; kiểm tra đường dẫn bản ghi trên đĩa khi bạn
cần bản ghi thô đầy đủ.

### Điều khiển gắn luồng

Các lệnh này hoạt động trên những kênh hỗ trợ gắn luồng bền vững.
Xem [Kênh hỗ trợ luồng](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi sinh

Tác tử khởi động tác tử con nền bằng `sessions_spawn`. Các lần hoàn tất của tác tử con
trả về dưới dạng sự kiện nội bộ của phiên cha; tác tử cha/bên yêu cầu quyết định
có cần cập nhật hiển thị cho người dùng hay không.

<AccordionGroup>
  <Accordion title="Hoàn tất dựa trên đẩy, không chặn">
    - `sessions_spawn` không chặn; nó trả về id lượt chạy ngay lập tức.
    - Khi hoàn tất, tác tử con báo cáo lại cho phiên cha/bên yêu cầu.
    - Các lượt tác tử cần kết quả từ tác tử con nên gọi `sessions_yield` sau khi sinh công việc bắt buộc. Việc đó kết thúc lượt hiện tại và cho phép sự kiện hoàn tất xuất hiện như thông điệp tiếp theo mà model nhìn thấy.
    - Hoàn tất dựa trên đẩy. Sau khi đã sinh, **không** thăm dò `/subagents list`, `sessions_list`, hoặc `sessions_history` trong vòng lặp chỉ để chờ nó kết thúc; chỉ kiểm tra trạng thái theo nhu cầu để có khả năng quan sát khi gỡ lỗi.
    - Đầu ra của tác tử con là báo cáo/bằng chứng để tác tử bên yêu cầu tổng hợp. Nó không phải văn bản hướng dẫn do người dùng viết và không thể ghi đè chính sách hệ thống, developer hoặc người dùng.
    - Khi hoàn tất, OpenClaw nỗ lực tối đa đóng các tab/quy trình trình duyệt được phiên tác tử con đó mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Phân phối hoàn tất">
    - OpenClaw trao các lần hoàn tất trở lại phiên bên yêu cầu thông qua một lượt `agent` có khóa idempotency ổn định.
    - Nếu lượt chạy của bên yêu cầu vẫn đang hoạt động, trước tiên OpenClaw cố đánh thức/điều hướng lượt chạy đó thay vì bắt đầu một đường trả lời hiển thị thứ hai.
    - Nếu không thể đánh thức bên yêu cầu đang hoạt động, OpenClaw chuyển sang bàn giao cho tác tử bên yêu cầu với cùng ngữ cảnh hoàn tất thay vì bỏ thông báo.
    - Một lần bàn giao cha thành công hoàn tất việc phân phối tác tử con ngay cả khi cha quyết định không cần cập nhật hiển thị cho người dùng.
    - Tác tử con native không có công cụ nhắn tin. Chúng trả về văn bản assistant thuần cho tác tử cha/bên yêu cầu; các câu trả lời hiển thị cho con người thuộc về chính sách phân phối bình thường của tác tử cha/bên yêu cầu.
    - Nếu không thể dùng bàn giao trực tiếp, nó sẽ quay lui sang định tuyến hàng đợi.
    - Nếu định tuyến hàng đợi vẫn không khả dụng, thông báo sẽ được thử lại với backoff lũy thừa ngắn trước khi từ bỏ cuối cùng.
    - Phân phối hoàn tất giữ tuyến bên yêu cầu đã phân giải: các tuyến hoàn tất gắn với luồng hoặc gắn với cuộc trò chuyện sẽ thắng khi khả dụng; nếu nguồn gốc hoàn tất chỉ cung cấp một kênh, OpenClaw điền target/account còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để phân phối trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Siêu dữ liệu bàn giao hoàn tất">
    Bàn giao hoàn tất cho phiên bên yêu cầu là ngữ cảnh nội bộ do runtime tạo
    (không phải văn bản do người dùng viết) và bao gồm:

    - `Result` — văn bản trả lời `assistant` hiển thị mới nhất từ tác tử con. Đầu ra tool/toolResult không được nâng cấp thành kết quả của tác tử con. Các lượt chạy thất bại ở trạng thái cuối không tái sử dụng văn bản trả lời đã thu thập.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Thống kê runtime/token dạng gọn.
    - Một hướng dẫn review yêu cầu tác tử bên yêu cầu xác minh kết quả trước khi quyết định tác vụ gốc đã xong hay chưa.
    - Hướng dẫn theo dõi yêu cầu tác tử bên yêu cầu tiếp tục tác vụ hoặc ghi lại việc theo dõi khi kết quả của tác tử con còn cần hành động thêm.
    - Một hướng dẫn cập nhật cuối cùng cho đường không-còn-hành-động, được viết bằng giọng assistant bình thường mà không chuyển tiếp siêu dữ liệu nội bộ thô.

  </Accordion>
  <Accordion title="Chế độ và ACP runtime">
    - `--model` và `--thinking` ghi đè mặc định cho lượt chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - Với các phiên gắn luồng bền vững, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Nếu kênh bên yêu cầu không hỗ trợ gắn luồng, dùng `mode: "run"` thay vì thử lại các tổ hợp gắn luồng không thể thực hiện.
    - Với các phiên harness ACP (Claude Code, Gemini CLI, OpenCode, hoặc Codex ACP/acpx rõ ràng), dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [Mô hình phân phối ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi hoàn tất hoặc vòng lặp tác tử-với-tác tử. Khi Plugin `codex` được bật, điều khiển trò chuyện/luồng Codex nên ưu tiên `/codex ...` thay vì ACP trừ khi người dùng yêu cầu rõ ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không bị sandbox, và một Plugin backend như `acpx` được tải. `runtime: "acp"` yêu cầu một id harness ACP bên ngoài, hoặc một mục `agents.list[]` với `runtime.type="acp"`; dùng runtime tác tử con mặc định cho các tác tử cấu hình OpenClaw bình thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Tác tử con native khởi động cô lập trừ khi bên gọi yêu cầu rõ ràng rẽ nhánh
bản ghi hiện tại.

| Chế độ     | Khi nào dùng                                                                                                                           | Hành vi                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm, hoặc bất cứ thứ gì có thể được tóm lược trong văn bản tác vụ              | Tạo bản ghi tác tử con sạch. Đây là mặc định và giữ mức dùng token thấp hơn.      |
| `fork`     | Công việc phụ thuộc vào cuộc trò chuyện hiện tại, kết quả công cụ trước đó, hoặc hướng dẫn tinh tế đã có trong bản ghi của bên yêu cầu | Rẽ nhánh bản ghi của bên yêu cầu vào phiên tác tử con trước khi tác tử con bắt đầu. |

Dùng `fork` một cách tiết kiệm. Nó dành cho ủy quyền nhạy với ngữ cảnh, không phải
thay thế cho việc viết một prompt tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Khởi động một lượt chạy tác tử con với `deliver: false` trên làn `subagent` toàn cục,
sau đó chạy bước thông báo và đăng câu trả lời thông báo vào kênh trò chuyện
của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu dụng của bên gọi. Các profile `coding` và
`full` hiển thị `sessions_spawn` theo mặc định. Profile `messaging`
thì không; thêm `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hoặc dùng `tools.profile: "coding"` cho các tác tử cần ủy quyền
công việc. Chính sách cho phép/từ chối theo kênh/nhóm, provider, sandbox và từng tác tử
vẫn có thể loại bỏ công cụ sau giai đoạn profile. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ hiệu dụng.

**Mặc định:**

- **Model:** tác tử con native kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng tác tử). Các lần sinh ACP runtime dùng cùng model tác tử con đã cấu hình khi có; nếu không, ACP harness giữ mặc định riêng. `sessions_spawn.model` rõ ràng vẫn thắng.
- **Thinking:** tác tử con native kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng tác tử). Các lần sinh ACP runtime cũng áp dụng `agents.defaults.models["provider/model"].params.thinking` cho model đã chọn. `sessions_spawn.thinking` rõ ràng vẫn thắng.
- **Thời gian chờ lượt chạy:** OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó quay lui về `0` (không có thời gian chờ). `sessions_spawn` không chấp nhận ghi đè thời gian chờ theo từng lần gọi.
- **Phân phối tác vụ:** tác tử con native nhận tác vụ được ủy quyền trong thông điệp `[Subagent Task]` hiển thị đầu tiên. System prompt của tác tử con mang các quy tắc runtime và ngữ cảnh định tuyến, không phải bản sao ẩn của tác vụ.

Các lần sinh tác tử con native được chấp nhận bao gồm siêu dữ liệu model tác tử con đã phân giải trong
kết quả công cụ: `resolvedModel` chứa model ref đã áp dụng và
`resolvedProvider` chứa tiền tố provider khi ref có tiền tố.

### Chế độ prompt ủy quyền

`agents.defaults.subagents.delegationMode` chỉ điều khiển hướng dẫn prompt; nó không thay đổi chính sách công cụ hoặc cưỡng chế ủy quyền.

- `suggest` (mặc định): giữ lời nhắc prompt tiêu chuẩn để dùng tác tử con cho công việc lớn hơn hoặc chậm hơn.
- `prefer`: yêu cầu tác tử chính giữ khả năng phản hồi và ủy quyền mọi việc phức tạp hơn một câu trả lời trực tiếp thông qua `sessions_spawn`.

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
  Mô tả tác vụ cho tác tử con.
</ParamField>
<ParamField path="taskName" type="string">
  Định danh ổn định tùy chọn để nhận diện một tiến trình con cụ thể trong đầu ra trạng thái sau này. Phải khớp với `[a-z][a-z0-9_-]{0,63}` và không được là các mục tiêu dành riêng như `last` hoặc `all`.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn dễ đọc cho con người.
</ParamField>
<ParamField path="agentId" type="string">
  Sinh dưới một id tác tử đã cấu hình khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc tác vụ tùy chọn cho lượt chạy con. Tác tử con gốc vẫn tải các tệp khởi động từ không gian làm việc tác tử mục tiêu; `cwd` chỉ thay đổi nơi các công cụ thời gian chạy và bộ chạy CLI thực hiện công việc được ủy quyền.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các bộ chạy ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode`, hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ ACP. Tiếp tục một phiên bộ chạy ACP hiện có khi `runtime: "acp"`; bị bỏ qua đối với các lần sinh tác tử con gốc.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ ACP. Truyền đầu ra lượt chạy ACP đến phiên cha khi `runtime: "acp"`; bỏ qua đối với các lần sinh tác tử con gốc.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình của tác tử con. Các giá trị không hợp lệ sẽ bị bỏ qua và tác tử con chạy trên mô hình mặc định kèm cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức suy luận cho lượt chạy tác tử con.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi là `true`, yêu cầu liên kết luồng kênh cho phiên tác tử con này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
  Nếu liên kết luồng không khả dụng cho kênh của bên yêu cầu, hãy dùng `mode: "run"` thay thế.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại thông qua đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối sinh trừ khi thời gian chạy con mục tiêu được sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rẽ nhánh bản ghi hội thoại hiện tại của bên yêu cầu vào phiên con. Chỉ tác tử con gốc. Các lần sinh có liên kết luồng mặc định là `fork`; các lần sinh không có luồng mặc định là `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận tham số phân phối qua kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Tác tử con gốc báo cáo
lượt phản hồi trợ lý mới nhất của chúng về bên yêu cầu; phân phối bên ngoài vẫn thuộc về
tác tử cha/bên yêu cầu.
</Warning>

### Tên tác vụ và nhắm mục tiêu

`taskName` là định danh hướng tới mô hình để điều phối, không phải khóa phiên.
Dùng nó cho các tên tiến trình con ổn định như `review_subagents`,
`linux_validation`, hoặc `docs_update` khi một điều phối viên có thể cần kiểm tra
tiến trình con đó sau này.

Phân giải mục tiêu chấp nhận các kết quả khớp `taskName` chính xác và các
tiền tố không mơ hồ. Việc khớp được giới hạn trong cùng cửa sổ mục tiêu đang hoạt động/gần đây
được dùng bởi các mục tiêu `/subagents` đánh số, vì vậy một tiến trình con đã hoàn tất cũ không làm
một định danh tái sử dụng trở nên mơ hồ. Nếu hai tiến trình con đang hoạt động hoặc gần đây có cùng
`taskName`, mục tiêu là mơ hồ; hãy dùng chỉ mục danh sách, khóa phiên, hoặc
id lượt chạy thay thế.

Các mục tiêu dành riêng `last` và `all` không phải là giá trị `taskName` hợp lệ
vì chúng đã có ý nghĩa điều khiển.

## Công cụ: `sessions_yield`

Kết thúc lượt mô hình hiện tại và chờ các sự kiện thời gian chạy, chủ yếu là
sự kiện hoàn tất của tác tử con, đến dưới dạng tin nhắn tiếp theo. Dùng sau khi
sinh công việc con bắt buộc khi bên yêu cầu không thể tạo câu trả lời cuối cùng
cho đến khi các lần hoàn tất đó đến.

`sessions_yield` là primitive chờ. Không thay thế nó bằng các vòng lặp thăm dò
qua `subagents`, `sessions_list`, `sessions_history`, shell
`sleep`, hoặc thăm dò tiến trình chỉ để phát hiện việc hoàn tất của tiến trình con.

Chỉ dùng `sessions_yield` khi danh sách công cụ hiệu lực của phiên có bao gồm
nó. Một số hồ sơ công cụ tối thiểu hoặc tùy chỉnh có thể cung cấp `sessions_spawn` và
`subagents` mà không cung cấp `sessions_yield`; trong trường hợp đó, đừng tự tạo
vòng lặp thăm dò chỉ để chờ hoàn tất.

Khi có các tiến trình con đang hoạt động, OpenClaw chèn một khối lời nhắc
`Active Subagents` nhỏ gọn do thời gian chạy tạo vào các lượt thông thường để bên yêu cầu có thể thấy
các phiên con hiện tại, id lượt chạy, trạng thái, nhãn, tác vụ, và
bí danh `taskName` mà không cần thăm dò. Các trường tác vụ và nhãn trong
khối đó được trích dẫn như dữ liệu, không phải chỉ dẫn, vì chúng có thể bắt nguồn
từ các đối số sinh do người dùng/mô hình cung cấp.

## Công cụ: `subagents`

Liệt kê các lượt chạy tác tử con đã sinh do phiên bên yêu cầu sở hữu. Phạm vi
giới hạn ở bên yêu cầu hiện tại; một tiến trình con chỉ có thể thấy các tiến trình con do chính nó kiểm soát.

Dùng `subagents` cho trạng thái theo yêu cầu và gỡ lỗi. Dùng `sessions_yield` để
chờ sự kiện hoàn tất.

## Phiên liên kết luồng

Khi liên kết luồng được bật cho một kênh, tác tử con có thể duy trì liên kết
với một luồng để các tin nhắn theo dõi của người dùng trong luồng đó tiếp tục được định tuyến đến
cùng phiên tác tử con.

### Kênh hỗ trợ luồng

Bất kỳ kênh nào có bộ chuyển đổi liên kết phiên đều có thể hỗ trợ các
phiên tác tử con liên kết luồng bền vững (`sessions_spawn` với `thread: true`).
Các bộ chuyển đổi đi kèm hiện bao gồm luồng Discord, luồng Matrix,
chủ đề diễn đàn Telegram, và liên kết cuộc trò chuyện hiện tại cho Feishu.
Dùng các khóa cấu hình `threadBindings` theo từng kênh để bật,
đặt thời gian chờ, và `spawnSessions`.

### Luồng nhanh

<Steps>
  <Step title="Sinh">
    `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"`).
  </Step>
  <Step title="Liên kết">
    OpenClaw tạo hoặc liên kết một luồng với mục tiêu phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Định tuyến theo dõi">
    Các trả lời và tin nhắn theo dõi trong luồng đó được định tuyến đến phiên đã liên kết.
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

| Lệnh               | Hiệu ứng                                                              |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Liên kết luồng hiện tại (hoặc tạo một luồng) với mục tiêu tác tử con/phiên |
| `/unfocus`         | Xóa liên kết cho luồng hiện đang được liên kết                        |
| `/agents`          | Liệt kê các lượt chạy đang hoạt động và trạng thái liên kết (`thread:<id>` hoặc `unbound`) |
| `/session idle`    | Kiểm tra/cập nhật tự động bỏ tập trung khi nhàn rỗi (chỉ các luồng đã liên kết đang được tập trung) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng đã liên kết đang được tập trung) |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Ghi đè theo kênh và khóa tự động liên kết khi sinh** là riêng theo bộ chuyển đổi. Xem [Kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết chi tiết bộ chuyển đổi hiện tại.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách id tác tử đã cấu hình có thể được nhắm mục tiêu qua `agentId` rõ ràng (`["*"]` cho phép bất kỳ mục tiêu đã cấu hình nào). Mặc định: chỉ tác tử bên yêu cầu. Nếu bạn đặt danh sách và vẫn muốn bên yêu cầu tự sinh chính nó bằng `agentId`, hãy đưa id bên yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép tác tử mục tiêu đã cấu hình mặc định được dùng khi tác tử bên yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng). Ghi đè theo từng tác tử: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Thời gian chờ cho mỗi lệnh gọi đối với các lần thử phân phối thông báo `agent` của Gateway. Giá trị là mili giây số nguyên dương và bị kẹp vào mức tối đa bộ hẹn giờ an toàn cho nền tảng. Các lần thử lại tạm thời có thể khiến tổng thời gian chờ thông báo dài hơn một thời gian chờ đã cấu hình.
</ParamField>

Nếu phiên bên yêu cầu được sandbox, `sessions_spawn` từ chối các mục tiêu
sẽ chạy không sandbox.

### Khám phá

Dùng `agents_list` để xem id tác tử nào hiện được cho phép cho
`sessions_spawn`. Phản hồi bao gồm mô hình hiệu lực và siêu dữ liệu thời gian chạy nhúng
của từng tác tử được liệt kê để bên gọi có thể phân biệt OpenClaw, máy chủ ứng dụng Codex,
và các thời gian chạy gốc đã cấu hình khác.

Các mục `allowAgents` phải trỏ đến id tác tử đã cấu hình trong `agents.list[]`.
`["*"]` nghĩa là bất kỳ tác tử mục tiêu đã cấu hình nào cộng với bên yêu cầu. Nếu một cấu hình tác tử
bị xóa nhưng id của nó vẫn còn trong `allowAgents`, `sessions_spawn` từ chối id đó
và `agents_list` bỏ qua nó. Chạy `openclaw doctor --fix` để dọn các mục
danh sách cho phép cũ, hoặc thêm một mục `agents.list[]` tối thiểu khi mục tiêu cần
vẫn có thể được sinh trong khi kế thừa mặc định.

### Tự động lưu trữ

- Phiên tác tử con được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Lưu trữ dùng `sessions.delete` và đổi tên bản ghi hội thoại thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại thông qua đổi tên).
- Tự động lưu trữ là nỗ lực tốt nhất; các bộ hẹn giờ đang chờ sẽ mất nếu Gateway khởi động lại.
- Thời gian chờ lượt chạy đã cấu hình **không** tự động lưu trữ; chúng chỉ dừng lượt chạy. Phiên vẫn tồn tại cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các tab/tiến trình trình duyệt được theo dõi sẽ được đóng theo nỗ lực tốt nhất khi lượt chạy kết thúc, ngay cả khi bản ghi hội thoại/bản ghi phiên được giữ lại.

## Tác tử con lồng nhau

Theo mặc định, tác tử con không thể sinh tác tử con của chính chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu điều phối viên**: chính → tác tử con điều phối viên →
các tác tử con-con worker.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Mức độ sâu

| Độ sâu | Dạng khóa phiên                              | Vai trò                                      | Có thể sinh?                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Tác tử chính                                 | Luôn luôn                    |
| 1     | `agent:<id>:subagent:<uuid>`                 | Tác tử con (điều phối viên khi cho phép độ sâu 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Tác tử con-con (worker lá)                   | Không bao giờ                |

### Chuỗi thông báo

Kết quả chảy ngược lên chuỗi:

1. Worker độ sâu 2 hoàn tất → thông báo cho cha của nó (orchestrator độ sâu 1).
2. Orchestrator độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho main.
3. Tác nhân main nhận thông báo và chuyển đến người dùng.

Mỗi cấp chỉ thấy thông báo từ các con trực tiếp của nó.

<Note>
**Hướng dẫn vận hành:** khởi động công việc con một lần và chờ các sự kiện hoàn tất thay vì xây dựng vòng lặp thăm dò quanh `sessions_list`, `sessions_history`, `/subagents list`, hoặc các lệnh ngủ `exec`.
`sessions_list` và `/subagents list` giữ quan hệ phiên con tập trung vào công việc đang chạy — con đang chạy vẫn được gắn, con đã kết thúc vẫn hiển thị trong một khoảng thời gian gần đây ngắn, và các liên kết con cũ chỉ còn trong kho lưu trữ sẽ bị bỏ qua sau cửa sổ độ mới của chúng. Điều này ngăn metadata `spawnedBy` / `parentSessionKey` cũ làm sống lại các con ảo sau khi khởi động lại. Nếu một sự kiện hoàn tất của con đến sau khi bạn đã gửi câu trả lời cuối cùng, phản hồi tiếp theo đúng là token im lặng chính xác `NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được ghi vào metadata phiên tại thời điểm spawn. Điều đó giúp các khóa phiên phẳng hoặc được khôi phục không vô tình lấy lại đặc quyền orchestrator.
- **Độ sâu 1 (orchestrator, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể spawn con và kiểm tra trạng thái của chúng. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (worker lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể spawn thêm con.

### Giới hạn spawn trên mỗi tác nhân

Mỗi phiên tác nhân (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) con đang hoạt động cùng lúc. Điều này ngăn một orchestrator đơn lẻ mở rộng fan-out mất kiểm soát.

### Dừng dây chuyền

Dừng một orchestrator độ sâu 1 sẽ tự động dừng tất cả con độ sâu 2 của nó:

- `/stop` trong cuộc trò chuyện main dừng tất cả tác nhân độ sâu 1 và lan xuống các con độ sâu 2 của chúng.

## Xác thực

Xác thực tác nhân con được phân giải theo **id tác nhân**, không theo loại phiên:

- Khóa phiên tác nhân con là `agent:<agentId>:subagent:<uuid>`.
- Kho xác thực được tải từ `agentDir` của tác nhân đó.
- Hồ sơ xác thực của tác nhân main được hợp nhất vào làm **dự phòng**; hồ sơ tác nhân ghi đè hồ sơ main khi có xung đột.

Việc hợp nhất là cộng thêm, nên hồ sơ main luôn có sẵn dưới dạng dự phòng. Xác thực cô lập hoàn toàn cho từng tác nhân hiện chưa được hỗ trợ.

## Thông báo

Tác nhân con báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác nhân con (không phải phiên requester).
- Nếu tác nhân con trả lời chính xác `ANNOUNCE_SKIP`, không có gì được đăng.
- Nếu văn bản assistant mới nhất là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo sẽ bị chặn ngay cả khi trước đó đã có tiến trình hiển thị.

Việc chuyển phát phụ thuộc vào độ sâu requester:

- Phiên requester cấp cao nhất dùng một lệnh gọi `agent` tiếp nối với chuyển phát bên ngoài (`deliver=true`).
- Phiên subagent requester lồng nhau nhận một lần tiêm tiếp nối nội bộ (`deliver=false`) để orchestrator có thể tổng hợp kết quả con trong phiên.
- Nếu một phiên subagent requester lồng nhau đã biến mất, OpenClaw sẽ quay về requester của phiên đó khi có sẵn.

Đối với các phiên requester cấp cao nhất, chuyển phát trực tiếp ở chế độ hoàn tất trước tiên phân giải mọi tuyến hội thoại/luồng đã ràng buộc và ghi đè hook, sau đó điền các trường channel-target còn thiếu từ tuyến đã lưu của phiên requester. Điều đó giữ các lượt hoàn tất ở đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn hoàn tất chỉ xác định kênh.

Tổng hợp hoàn tất của con được giới hạn trong lượt chạy requester hiện tại khi xây dựng các phát hiện hoàn tất lồng nhau, ngăn đầu ra con từ lượt chạy cũ rò rỉ vào thông báo hiện tại. Trả lời thông báo giữ định tuyến luồng/chủ đề khi adapter kênh có hỗ trợ.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường          | Nguồn                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguồn         | `subagent` hoặc `cron`                                                                                          |
| Id phiên    | Khóa/id phiên con                                                                                          |
| Loại           | Loại thông báo + nhãn tác vụ                                                                                    |
| Trạng thái         | Suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`) — **không** suy luận từ văn bản mô hình |
| Nội dung kết quả | Văn bản assistant hiển thị mới nhất từ con                                                                  |
| Tiếp nối      | Chỉ dẫn mô tả khi nào nên trả lời so với giữ im lặng                                                           |

Các lượt chạy thất bại ở trạng thái kết thúc báo cáo trạng thái thất bại mà không phát lại văn bản trả lời đã thu thập. Đầu ra Tool/toolResult không được nâng thành văn bản kết quả con.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc):

- Runtime (ví dụ `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi giá mô hình được cấu hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, và đường dẫn transcript để tác nhân main có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Metadata nội bộ chỉ dành cho điều phối; các trả lời hướng tới người dùng nên được viết lại bằng giọng assistant bình thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là đường dẫn điều phối an toàn hơn:

- Khả năng hồi tưởng của assistant được chuẩn hóa trước: loại bỏ thẻ suy nghĩ; loại bỏ khung `<relevant-memories>` / `<relevant_memories>`; loại bỏ các khối payload XML lệnh gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), bao gồm các payload bị cắt ngắn không bao giờ đóng sạch; loại bỏ khung tool-call/result bị hạ cấp và marker ngữ cảnh lịch sử; loại bỏ token điều khiển mô hình bị rò rỉ (`<|assistant|>`, các ASCII khác dạng `<|...|>`, dạng toàn chiều rộng `<｜...｜>`); loại bỏ XML tool-call MiniMax sai định dạng.
- Văn bản giống thông tin xác thực/token được biên tập ẩn.
- Các khối dài có thể bị cắt ngắn.
- Lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá khổ bằng `[sessions_history omitted: message too large]`.
- Kiểm tra transcript thô trên đĩa là phương án dự phòng khi bạn cần transcript đầy đủ từng byte.

## Chính sách công cụ

Tác nhân con trước tiên dùng cùng hồ sơ và pipeline chính sách công cụ như cha hoặc tác nhân đích. Sau đó, OpenClaw áp dụng lớp hạn chế tác nhân con.

Khi không có `tools.profile` hạn chế, tác nhân con nhận **tất cả công cụ ngoại trừ công cụ message, công cụ phiên, và công cụ hệ thống**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` ở đây cũng vẫn là chế độ xem hồi tưởng có giới hạn và đã được làm sạch — nó không phải bản dump transcript thô.

Khi `maxSpawnDepth >= 2`, các tác nhân con orchestrator độ sâu 1 còn nhận thêm `sessions_spawn`, `subagents`, `sessions_list`, và `sessions_history` để có thể quản lý con của chúng.

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

`tools.subagents.tools.allow` là bộ lọc allow-only cuối cùng. Nó có thể thu hẹp tập công cụ đã được phân giải, nhưng không thể **thêm lại** một công cụ đã bị `tools.profile` loại bỏ. Ví dụ, `tools.profile: "coding"` bao gồm `web_search`/`web_fetch` nhưng không bao gồm công cụ `browser`. Để cho tác nhân con dùng hồ sơ coding sử dụng tự động hóa trình duyệt, hãy thêm browser ở giai đoạn hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Dùng `agents.list[].tools.alsoAllow: ["browser"]` theo từng tác nhân khi chỉ một tác nhân nên nhận tự động hóa trình duyệt.

## Đồng thời

Tác nhân con dùng một làn hàng đợi riêng trong tiến trình:

- **Tên làn:** `subagent`
- **Mức đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Tính sống và khôi phục

OpenClaw không xem việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một tác nhân con vẫn còn sống. Các lượt chạy chưa kết thúc cũ hơn cửa sổ lượt chạy stale sẽ ngừng được tính là hoạt động/đang chờ trong `/subagents list`, tóm tắt trạng thái, chặn hoàn tất hậu duệ, và kiểm tra đồng thời theo từng phiên.

Sau khi Gateway khởi động lại, các lượt chạy khôi phục chưa kết thúc đã stale sẽ bị cắt tỉa trừ khi phiên con của chúng được đánh dấu `abortedLastRun: true`. Những phiên con bị hủy do khởi động lại đó vẫn có thể khôi phục qua luồng khôi phục orphan của tác nhân con, vốn gửi một thông điệp resume tổng hợp trước khi xóa marker đã hủy.

Khôi phục tự động sau khởi động lại được giới hạn theo từng phiên con. Nếu cùng một con tác nhân con được chấp nhận khôi phục orphan lặp lại trong cửa sổ rapid re-wedge, OpenClaw lưu một tombstone khôi phục trên phiên đó và ngừng tự động resume nó ở các lần khởi động lại sau. Chạy `openclaw tasks maintenance --apply` để đối chiếu bản ghi tác vụ, hoặc `openclaw doctor --fix` để xóa các cờ khôi phục đã hủy stale trên các phiên có tombstone.

<Note>
Nếu spawn tác nhân con thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra caller RPC trước khi chỉnh sửa trạng thái ghép đôi.
Điều phối nội bộ `sessions_spawn` dispatch trong tiến trình khi caller đã chạy bên trong ngữ cảnh yêu cầu gateway, nên nó không mở WebSocket loopback hoặc phụ thuộc vào baseline phạm vi thiết bị đã ghép đôi của CLI. Caller bên ngoài tiến trình gateway vẫn dùng dự phòng WebSocket dưới dạng `client.id: "gateway-client"` với `client.mode: "backend"` qua xác thực shared-token/password loopback trực tiếp. Caller từ xa, `deviceIdentity` rõ ràng, đường dẫn device-token rõ ràng, và client browser/node vẫn cần phê duyệt thiết bị bình thường cho nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện requester sẽ hủy phiên requester và dừng mọi lượt chạy tác nhân con đang hoạt động được spawn từ phiên đó, lan xuống các con lồng nhau.

## Hạn chế

- Thông báo tác nhân con là **nỗ lực tối đa**. Nếu gateway khởi động lại, công việc "announce back" đang chờ sẽ mất.
- Tác nhân con vẫn chia sẻ cùng tài nguyên tiến trình gateway; hãy xem `maxConcurrent` là van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác nhân con chỉ tiêm `AGENTS.md` và `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`). Subagents gốc Codex tuân theo cùng ranh giới: `TOOLS.md` vẫn nằm trong chỉ dẫn luồng Codex được kế thừa, trong khi các tệp persona, identity, và user chỉ dành cho cha được tiêm dưới dạng chỉ dẫn cộng tác giới hạn theo lượt để con không sao chép chúng.
- Độ sâu lồng tối đa là 5 (phạm vi `maxSpawnDepth`: 1–5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số con đang hoạt động trên mỗi phiên (mặc định `5`, phạm vi `1–20`).

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
