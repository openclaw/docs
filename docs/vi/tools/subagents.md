---
read_when:
    - Bạn muốn chạy công việc nền hoặc song song thông qua tác nhân
    - Bạn đang thay đổi chính sách công cụ sessions_spawn hoặc sub-agent
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên subagent gắn với luồng
sidebarTitle: Sub-agents
summary: Sinh các phiên chạy tác tử nền cô lập thông báo kết quả trở lại cuộc trò chuyện của người yêu cầu
title: Tác nhân phụ
x-i18n:
    generated_at: "2026-06-28T00:13:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

Tác nhân con là các lượt chạy tác nhân nền được sinh ra từ một lượt chạy tác nhân hiện có.
Chúng chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả trở lại kênh trò chuyện của bên yêu cầu. Mỗi lượt chạy tác nhân con được theo dõi như một
[tác vụ nền](/vi/automation/tasks).

Mục tiêu chính:

- Song song hóa công việc "nghiên cứu / tác vụ dài / công cụ chậm" mà không chặn lượt chạy chính.
- Giữ tác nhân con được cô lập theo mặc định (tách biệt phiên + sandbox tùy chọn).
- Giữ bề mặt công cụ khó bị dùng sai: tác nhân con **không** có công cụ phiên theo mặc định.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu điều phối.

<Note>
**Ghi chú chi phí:** mỗi tác nhân con có ngữ cảnh và mức sử dụng token riêng theo
mặc định. Với các tác vụ nặng hoặc lặp lại, hãy đặt một mô hình rẻ hơn cho tác nhân con
và giữ tác nhân chính trên một mô hình chất lượng cao hơn. Cấu hình qua
`agents.defaults.subagents.model` hoặc ghi đè theo từng tác nhân. Khi một tác nhân con
    thực sự cần bản ghi hội thoại hiện tại của bên yêu cầu, tác nhân có thể yêu cầu
    `context: "fork"` cho lần sinh đó. Các phiên tác nhân con gắn với luồng mặc định
    dùng `context: "fork"` vì chúng rẽ nhánh cuộc trò chuyện hiện tại thành một
    luồng theo dõi.
</Note>

## Lệnh gạch chéo

Dùng `/subagents` để kiểm tra các lượt chạy tác nhân con cho **phiên hiện tại**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` hiển thị siêu dữ liệu lượt chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn bản ghi, dọn dẹp). Dùng `sessions_history` để xem lại có giới hạn
và đã lọc an toàn; kiểm tra đường dẫn bản ghi trên ổ đĩa khi bạn
cần bản ghi đầy đủ thô.

### Điều khiển gắn luồng

Các lệnh này hoạt động trên các kênh hỗ trợ gắn luồng lâu dài.
Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi sinh

Tác nhân khởi động tác nhân con nền bằng `sessions_spawn`. Hoàn tất của tác nhân con
trả về dưới dạng sự kiện phiên cha nội bộ; tác nhân cha/bên yêu cầu quyết định
có cần cập nhật hiển thị cho người dùng hay không.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - `sessions_spawn` không chặn; nó trả về id lượt chạy ngay lập tức.
    - Khi hoàn tất, tác nhân con báo cáo lại cho phiên cha/bên yêu cầu.
    - Các lượt tác nhân cần kết quả từ tác nhân con nên gọi `sessions_yield` sau khi sinh công việc bắt buộc. Việc đó kết thúc lượt hiện tại và cho phép sự kiện hoàn tất đến dưới dạng thông điệp tiếp theo mà mô hình nhìn thấy.
    - Hoàn tất hoạt động theo cơ chế đẩy. Sau khi đã sinh, **không** thăm dò `/subagents list`, `sessions_list`, hoặc `sessions_history` trong vòng lặp chỉ để chờ nó hoàn tất; chỉ kiểm tra trạng thái theo nhu cầu để quan sát khi gỡ lỗi.
    - Đầu ra của tác nhân con là báo cáo/bằng chứng để tác nhân bên yêu cầu tổng hợp. Đó không phải là văn bản chỉ dẫn do người dùng viết và không thể ghi đè chính sách hệ thống, nhà phát triển hoặc người dùng.
    - Khi hoàn tất, OpenClaw cố gắng hết mức để đóng các tab trình duyệt/tiến trình được theo dõi do phiên tác nhân con đó mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Completion delivery">
    - OpenClaw chuyển hoàn tất trở lại phiên bên yêu cầu thông qua một lượt `agent` với khóa idempotency ổn định.
    - Nếu lượt chạy bên yêu cầu vẫn đang hoạt động, OpenClaw trước tiên cố đánh thức/điều hướng lượt chạy đó thay vì bắt đầu một đường phản hồi hiển thị thứ hai.
    - Nếu không thể đánh thức bên yêu cầu đang hoạt động, OpenClaw chuyển sang bàn giao cho tác nhân bên yêu cầu với cùng ngữ cảnh hoàn tất thay vì bỏ thông báo.
    - Bàn giao cha thành công sẽ hoàn tất việc gửi của tác nhân con ngay cả khi cha quyết định không cần cập nhật hiển thị cho người dùng.
    - Tác nhân con gốc không có công cụ thông điệp. Chúng trả về văn bản trợ lý thuần cho tác nhân cha/bên yêu cầu; các phản hồi hiển thị cho con người thuộc về chính sách gửi bình thường của tác nhân cha/bên yêu cầu.
    - Nếu không thể dùng bàn giao trực tiếp, nó sẽ dự phòng sang định tuyến hàng đợi.
    - Nếu định tuyến hàng đợi vẫn không khả dụng, thông báo sẽ được thử lại với backoff hàm mũ ngắn trước khi bỏ cuộc cuối cùng.
    - Việc gửi hoàn tất giữ tuyến bên yêu cầu đã phân giải: các tuyến hoàn tất gắn với luồng hoặc gắn với cuộc trò chuyện được ưu tiên khi khả dụng; nếu nguồn gốc hoàn tất chỉ cung cấp một kênh, OpenClaw điền target/account còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để gửi trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    Việc bàn giao hoàn tất cho phiên bên yêu cầu là ngữ cảnh nội bộ do runtime tạo
    (không phải văn bản do người dùng viết) và bao gồm:

    - `Result` — văn bản phản hồi `assistant` hiển thị mới nhất từ tác nhân con. Đầu ra tool/toolResult không được nâng lên thành kết quả của tác nhân con. Các lượt chạy kết thúc thất bại không tái sử dụng văn bản phản hồi đã thu được.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Thống kê runtime/token dạng gọn.
    - Một chỉ dẫn review yêu cầu tác nhân bên yêu cầu xác minh kết quả trước khi quyết định tác vụ gốc đã hoàn tất hay chưa.
    - Hướng dẫn theo dõi yêu cầu tác nhân bên yêu cầu tiếp tục tác vụ hoặc ghi lại một việc theo dõi khi kết quả của tác nhân con còn để lại hành động.
    - Một chỉ dẫn cập nhật cuối cho đường không còn hành động, được viết bằng giọng trợ lý bình thường mà không chuyển tiếp siêu dữ liệu nội bộ thô.

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` và `--thinking` ghi đè giá trị mặc định cho lượt chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - Với các phiên liên kết luồng có tính duy trì, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Nếu kênh của bên yêu cầu không hỗ trợ liên kết luồng, hãy dùng `mode: "run"` thay vì thử lại các tổ hợp liên kết luồng không thể hoạt động.
    - Với các phiên harness ACP (Claude Code, Gemini CLI, OpenCode, hoặc Codex ACP/acpx rõ ràng), dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [mô hình phân phối ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi các lượt hoàn tất hoặc vòng lặp tác nhân-với-tác nhân. Khi Plugin `codex` được bật, điều khiển chat/luồng Codex nên ưu tiên `/codex ...` thay vì ACP, trừ khi người dùng yêu cầu rõ ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không bị sandbox, và một Plugin backend như `acpx` được tải. `runtime: "acp"` mong đợi một id harness ACP bên ngoài, hoặc một mục `agents.list[]` với `runtime.type="acp"`; dùng runtime tác nhân phụ mặc định cho các tác nhân cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Các tác nhân phụ gốc khởi động ở trạng thái cô lập, trừ khi bên gọi yêu cầu rõ ràng việc phân nhánh
bản ghi hiện tại.

| Chế độ     | Khi nào dùng                                                                                                                           | Hành vi                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm, hoặc bất cứ việc gì có thể được tóm tắt trong nội dung tác vụ             | Tạo một bản ghi con sạch. Đây là mặc định và giúp giảm mức dùng token.            |
| `fork`     | Công việc phụ thuộc vào cuộc hội thoại hiện tại, kết quả công cụ trước đó, hoặc chỉ dẫn tinh tế đã có trong bản ghi của bên yêu cầu   | Phân nhánh bản ghi của bên yêu cầu vào phiên con trước khi phiên con bắt đầu.     |

Dùng `fork` một cách tiết chế. Nó dành cho ủy quyền nhạy với ngữ cảnh, không phải
phương án thay thế cho việc viết một prompt tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Bắt đầu một lượt chạy tác nhân phụ với `deliver: false` trên lane `subagent` toàn cục,
sau đó chạy một bước thông báo và đăng phản hồi thông báo lên kênh chat của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu lực của bên gọi. Các hồ sơ `coding` và
`full` mặc định cung cấp `sessions_spawn`. Hồ sơ `messaging`
thì không; thêm `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` hoặc dùng `tools.profile: "coding"` cho các tác nhân cần ủy quyền
công việc. Chính sách cho phép/từ chối theo kênh/nhóm, provider, sandbox và từng tác nhân
vẫn có thể loại bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ hiệu lực.

**Mặc định:**

- **Mô hình:** các tác nhân phụ gốc kế thừa bên gọi, trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng tác nhân). Các lượt sinh runtime ACP dùng cùng mô hình tác nhân phụ đã cấu hình khi có; nếu không, harness ACP giữ mặc định riêng của nó. `sessions_spawn.model` rõ ràng vẫn được ưu tiên.
- **Suy luận:** các tác nhân phụ gốc kế thừa bên gọi, trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng tác nhân). Các lượt sinh runtime ACP cũng áp dụng `agents.defaults.models["provider/model"].params.thinking` cho mô hình đã chọn. `sessions_spawn.thinking` rõ ràng vẫn được ưu tiên.
- **Thời gian chờ lượt chạy:** OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó quay về `0` (không có thời gian chờ). `sessions_spawn` không chấp nhận ghi đè thời gian chờ theo từng lệnh gọi.
- **Phân phối tác vụ:** các tác nhân phụ gốc nhận tác vụ được ủy quyền trong thông báo `[Subagent Task]` hiển thị đầu tiên của chúng. Prompt hệ thống của tác nhân phụ mang các quy tắc runtime và ngữ cảnh định tuyến, không phải một bản sao ẩn của tác vụ.

Các lượt sinh tác nhân phụ gốc được chấp nhận bao gồm siêu dữ liệu mô hình con đã phân giải trong
kết quả công cụ: `resolvedModel` chứa tham chiếu mô hình đã áp dụng và
`resolvedProvider` chứa tiền tố provider khi tham chiếu có tiền tố.

### Chế độ prompt ủy quyền

`agents.defaults.subagents.delegationMode` chỉ điều khiển hướng dẫn trong prompt; nó không thay đổi chính sách công cụ hay bắt buộc ủy quyền.

- `suggest` (mặc định): giữ gợi ý prompt tiêu chuẩn để dùng tác nhân phụ cho công việc lớn hơn hoặc chậm hơn.
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
  Mô tả tác vụ cho tác nhân con.
</ParamField>
<ParamField path="taskName" type="string">
  Tên định danh ổn định tùy chọn để nhận diện một tiến trình con cụ thể trong đầu ra trạng thái sau này. Phải khớp `[a-z][a-z0-9_-]{0,63}` và không được là các đích dành riêng như `last` hoặc `all`.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn dễ đọc cho con người.
</ParamField>
<ParamField path="agentId" type="string">
  Khởi tạo dưới một id tác nhân đã cấu hình khác khi `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc tác vụ tùy chọn cho lượt chạy con. Các tác nhân con nguyên sinh vẫn tải tệp khởi động từ không gian làm việc của tác nhân đích; `cwd` chỉ thay đổi nơi các công cụ runtime và CLI harness thực hiện công việc được ủy quyền.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các ACP harness bên ngoài (`claude`, `droid`, `gemini`, `opencode`, hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ ACP. Tiếp tục một phiên ACP harness hiện có khi `runtime: "acp"`; bị bỏ qua với các khởi tạo tác nhân con nguyên sinh.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ ACP. Truyền trực tuyến đầu ra lượt chạy ACP tới phiên cha khi `runtime: "acp"`; bỏ qua với các khởi tạo tác nhân con nguyên sinh.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình của tác nhân con. Các giá trị không hợp lệ sẽ bị bỏ qua và tác nhân con chạy trên mô hình mặc định kèm cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức suy nghĩ cho lượt chạy tác nhân con.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu gắn luồng kênh cho phiên tác nhân con này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
  Nếu không có khả năng gắn luồng cho kênh của bên yêu cầu, hãy dùng `mode: "run"` thay thế.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại bằng cách đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối khởi tạo trừ khi runtime con đích được sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` rẽ nhánh bản ghi hội thoại hiện tại của bên yêu cầu vào phiên con. Chỉ áp dụng cho tác nhân con nguyên sinh. Các khởi tạo gắn với luồng mặc định là `fork`; các khởi tạo không có luồng mặc định là `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận tham số phân phối qua kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Tác nhân con nguyên sinh báo cáo
lượt trợ lý mới nhất của chúng về cho bên yêu cầu; phân phối bên ngoài vẫn thuộc về
tác nhân cha/bên yêu cầu.
</Warning>

### Tên tác vụ và nhắm đích

`taskName` là một tên định danh hướng tới mô hình để điều phối, không phải khóa phiên.
Dùng nó cho các tên tiến trình con ổn định như `review_subagents`,
`linux_validation`, hoặc `docs_update` khi một bộ điều phối có thể cần kiểm tra
tiến trình con đó sau này.

Phân giải đích chấp nhận các kết quả khớp `taskName` chính xác và các
tiền tố không mơ hồ. Việc khớp được giới hạn trong cùng cửa sổ đích đang hoạt động/gần đây
được dùng bởi các đích `/subagents` đánh số, nên một tiến trình con đã hoàn tất cũ không khiến
một tên định danh được dùng lại trở nên mơ hồ. Nếu hai tiến trình con đang hoạt động hoặc gần đây có cùng
`taskName`, đích đó là mơ hồ; hãy dùng chỉ mục danh sách, khóa phiên, hoặc
id lượt chạy thay thế.

Các đích dành riêng `last` và `all` không phải là giá trị `taskName` hợp lệ
vì chúng đã có ý nghĩa điều khiển.

## Công cụ: `sessions_yield`

Kết thúc lượt mô hình hiện tại và chờ các sự kiện runtime, chủ yếu là
sự kiện hoàn tất của tác nhân con, đến dưới dạng thông điệp tiếp theo. Dùng sau khi
khởi tạo công việc con bắt buộc khi bên yêu cầu không thể tạo câu trả lời
cuối cùng cho đến khi các hoàn tất đó đến.

`sessions_yield` là nguyên hàm chờ. Không thay thế nó bằng các vòng lặp thăm dò
qua `subagents`, `sessions_list`, `sessions_history`, shell
`sleep`, hoặc thăm dò tiến trình chỉ để phát hiện tác nhân con hoàn tất.

Chỉ dùng `sessions_yield` khi danh sách công cụ hiệu dụng của phiên bao gồm
nó. Một số hồ sơ công cụ tối giản hoặc tùy chỉnh có thể cung cấp `sessions_spawn` và
`subagents` mà không cung cấp `sessions_yield`; trong trường hợp đó, đừng tự tạo
vòng lặp thăm dò chỉ để chờ hoàn tất.

Khi có tiến trình con đang hoạt động, OpenClaw chèn một khối lời nhắc
`Sub-agent đang hoạt động` nhỏ gọn do runtime tạo vào các lượt thông thường để bên yêu cầu có thể thấy
các phiên con hiện tại, id lượt chạy, trạng thái, nhãn, tác vụ và
bí danh `taskName` mà không cần thăm dò. Các trường tác vụ và nhãn trong
khối đó được trích dẫn như dữ liệu, không phải chỉ dẫn, vì chúng có thể bắt nguồn
từ các đối số khởi tạo do người dùng/mô hình cung cấp.

## Công cụ: `subagents`

Liệt kê các lượt chạy tác nhân con đã khởi tạo thuộc sở hữu của phiên bên yêu cầu. Phạm vi của nó
giới hạn trong bên yêu cầu hiện tại; một tiến trình con chỉ có thể thấy các tiến trình con do chính nó kiểm soát.

Dùng `subagents` cho trạng thái theo yêu cầu và gỡ lỗi. Dùng `sessions_yield` để
chờ sự kiện hoàn tất.

## Phiên gắn với luồng

Khi liên kết luồng được bật cho một kênh, một tác nhân con có thể tiếp tục được gắn
với một luồng để các thông điệp người dùng tiếp theo trong luồng đó vẫn được định tuyến tới
cùng phiên tác nhân con.

### Kênh hỗ trợ luồng

Bất kỳ kênh nào có bộ chuyển đổi gắn phiên đều có thể hỗ trợ các phiên subagent
gắn với luồng bền vững (`sessions_spawn` với `thread: true`).
Các bộ chuyển đổi đi kèm hiện bao gồm luồng Discord, luồng Matrix,
chủ đề diễn đàn Telegram và liên kết cuộc trò chuyện hiện tại cho Feishu.
Dùng các khóa cấu hình `threadBindings` theo từng kênh để bật,
đặt thời gian chờ và `spawnSessions`.

### Luồng nhanh

<Steps>
  <Step title="Khởi tạo">
    `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"`).
  </Step>
  <Step title="Gắn">
    OpenClaw tạo hoặc gắn một luồng với đích phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Định tuyến theo dõi">
    Các câu trả lời và thông điệp tiếp theo trong luồng đó được định tuyến tới phiên đã gắn.
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
| `/focus <target>`  | Gắn luồng hiện tại (hoặc tạo một luồng) với đích tác nhân con/phiên   |
| `/unfocus`         | Xóa liên kết cho luồng hiện đang được gắn                             |
| `/agents`          | Liệt kê các lượt chạy đang hoạt động và trạng thái liên kết (`thread:<id>` hoặc `unbound`) |
| `/session idle`    | Kiểm tra/cập nhật tự động bỏ tập trung khi nhàn rỗi (chỉ các luồng đã gắn đang được tập trung) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng đã gắn đang được tập trung) |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Các khóa ghi đè kênh và tự động gắn khi khởi tạo** phụ thuộc vào từng bộ chuyển đổi. Xem [Kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết chi tiết bộ chuyển đổi hiện tại.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách id tác nhân đã cấu hình có thể được nhắm tới qua `agentId` rõ ràng (`["*"]` cho phép mọi đích đã cấu hình). Mặc định: chỉ tác nhân bên yêu cầu. Nếu bạn đặt một danh sách và vẫn muốn bên yêu cầu tự khởi tạo chính nó bằng `agentId`, hãy đưa id bên yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép tác nhân đích đã cấu hình mặc định được dùng khi tác nhân bên yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng). Ghi đè theo từng tác nhân: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Thời gian chờ theo từng lệnh gọi cho các nỗ lực phân phối thông báo `agent` của Gateway. Giá trị là số mili giây nguyên dương và được giới hạn theo mức tối đa bộ hẹn giờ an toàn của nền tảng. Các lần thử lại tạm thời có thể khiến tổng thời gian chờ thông báo dài hơn một thời gian chờ đã cấu hình.
</ParamField>

Nếu phiên bên yêu cầu được sandbox, `sessions_spawn` từ chối các đích
sẽ chạy không sandbox.

### Khám phá

Dùng `agents_list` để xem những id tác nhân nào hiện được phép cho
`sessions_spawn`. Phản hồi bao gồm mô hình hiệu dụng của từng tác nhân được liệt kê
và siêu dữ liệu runtime nhúng để bên gọi có thể phân biệt OpenClaw, máy chủ ứng dụng Codex
và các runtime nguyên sinh đã cấu hình khác.

Các mục `allowAgents` phải trỏ tới id tác nhân đã cấu hình trong `agents.list[]`.
`["*"]` nghĩa là mọi tác nhân đích đã cấu hình cộng với bên yêu cầu. Nếu một cấu hình tác nhân
bị xóa nhưng id của nó vẫn còn trong `allowAgents`, `sessions_spawn` sẽ từ chối id đó
và `agents_list` sẽ bỏ qua nó. Chạy `openclaw doctor --fix` để dọn các mục
danh sách cho phép đã cũ, hoặc thêm một mục `agents.list[]` tối thiểu khi đích cần
vẫn có thể được khởi tạo trong khi kế thừa mặc định.

### Tự động lưu trữ

- Các phiên tác nhân con được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Lưu trữ dùng `sessions.delete` và đổi tên bản ghi hội thoại thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại bằng cách đổi tên).
- Tự động lưu trữ là nỗ lực tốt nhất; các bộ hẹn giờ đang chờ sẽ mất nếu gateway khởi động lại.
- Thời gian chờ lượt chạy đã cấu hình **không** tự động lưu trữ; chúng chỉ dừng lượt chạy. Phiên vẫn tồn tại cho đến khi tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các tab/tiến trình trình duyệt được theo dõi sẽ được đóng theo nỗ lực tốt nhất khi lượt chạy kết thúc, ngay cả khi bản ghi hội thoại/bản ghi phiên được giữ lại.

## Tác nhân con lồng nhau

Theo mặc định, tác nhân con không thể khởi tạo tác nhân con của riêng chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu bộ điều phối**: chính → tác nhân con điều phối →
tác nhân con-con làm worker.

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

### Cấp độ sâu

| Độ sâu | Dạng khóa phiên                              | Vai trò                                      | Có thể khởi tạo?             |
| ------ | -------------------------------------------- | -------------------------------------------- | ---------------------------- |
| 0      | `agent:<id>:main`                            | Tác nhân chính                               | Luôn luôn                    |
| 1      | `agent:<id>:subagent:<uuid>`                 | Tác nhân con (bộ điều phối khi cho phép độ sâu 2) | Chỉ nếu `maxSpawnDepth >= 2` |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Tác nhân con-con (worker lá)                 | Không bao giờ                |

### Chuỗi thông báo

Kết quả chảy ngược lên chuỗi:

1. Worker độ sâu 2 hoàn tất → thông báo cho cha của nó (orchestrator độ sâu 1).
2. Orchestrator độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho main.
3. Tác nhân main nhận thông báo và chuyển cho người dùng.

Mỗi cấp chỉ thấy thông báo từ các con trực tiếp của nó.

<Note>
**Hướng dẫn vận hành:** hãy khởi động công việc con một lần và chờ các sự kiện hoàn tất thay vì xây dựng vòng lặp thăm dò quanh `sessions_list`, `sessions_history`, `/subagents list`, hoặc các lệnh ngủ `exec`. `sessions_list` và `/subagents list` giữ quan hệ phiên con tập trung vào công việc đang chạy — các con đang chạy vẫn được gắn, các con đã kết thúc vẫn hiển thị trong một khoảng thời gian gần đây ngắn, và các liên kết con cũ chỉ còn trong kho lưu trữ sẽ bị bỏ qua sau cửa sổ độ mới của chúng. Điều này ngăn metadata `spawnedBy` / `parentSessionKey` cũ hồi sinh các con bóng ma sau khi khởi động lại. Nếu một sự kiện hoàn tất của con đến sau khi bạn đã gửi câu trả lời cuối cùng, phản hồi tiếp theo đúng là token im lặng chính xác `NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi điều khiển được ghi vào metadata phiên tại thời điểm spawn. Điều đó giúp các khóa phiên phẳng hoặc được khôi phục không vô tình lấy lại đặc quyền orchestrator.
- **Độ sâu 1 (orchestrator, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể spawn các con và kiểm tra trạng thái của chúng. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (worker lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể spawn thêm con.

### Giới hạn spawn theo từng tác nhân

Mỗi phiên tác nhân (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent` (mặc định `5`) con đang hoạt động cùng lúc. Điều này ngăn một orchestrator duy nhất fan-out mất kiểm soát.

### Dừng dây chuyền

Dừng một orchestrator độ sâu 1 sẽ tự động dừng tất cả các con độ sâu 2 của nó:

- `/stop` trong cuộc trò chuyện main dừng tất cả tác nhân độ sâu 1 và lan tiếp đến các con độ sâu 2 của chúng.

## Xác thực

Xác thực tác nhân con được phân giải theo **id tác nhân**, không theo loại phiên:

- Khóa phiên tác nhân con là `agent:<agentId>:subagent:<uuid>`.
- Kho xác thực được tải từ `agentDir` của tác nhân đó.
- Các hồ sơ xác thực của tác nhân main được hợp nhất vào làm **dự phòng**; hồ sơ tác nhân ghi đè hồ sơ main khi có xung đột.

Việc hợp nhất mang tính cộng thêm, vì vậy hồ sơ main luôn khả dụng làm dự phòng. Xác thực tách biệt hoàn toàn theo từng tác nhân hiện chưa được hỗ trợ.

## Thông báo

Tác nhân con báo cáo lại thông qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác nhân con (không phải phiên của bên yêu cầu).
- Nếu tác nhân con trả lời chính xác `ANNOUNCE_SKIP`, sẽ không có gì được đăng.
- Nếu văn bản assistant mới nhất là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo sẽ bị chặn ngay cả khi trước đó đã có tiến trình hiển thị.

Việc chuyển phát phụ thuộc vào độ sâu của bên yêu cầu:

- Các phiên bên yêu cầu cấp cao nhất dùng một lệnh gọi `agent` tiếp theo với chuyển phát bên ngoài (`deliver=true`).
- Các phiên subagent bên yêu cầu lồng nhau nhận một lần tiêm theo dõi nội bộ (`deliver=false`) để orchestrator có thể tổng hợp kết quả con trong phiên.
- Nếu một phiên subagent bên yêu cầu lồng nhau đã biến mất, OpenClaw quay về bên yêu cầu của phiên đó khi có sẵn.

Đối với các phiên bên yêu cầu cấp cao nhất, chuyển phát trực tiếp ở chế độ hoàn tất trước tiên phân giải mọi tuyến hội thoại/luồng đã ràng buộc và phần ghi đè hook, sau đó điền các trường channel-target còn thiếu từ tuyến đã lưu của phiên bên yêu cầu. Điều đó giữ các hoàn tất ở đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn hoàn tất chỉ xác định kênh.

Tổng hợp hoàn tất của con được giới hạn trong lượt chạy hiện tại của bên yêu cầu khi xây dựng phát hiện hoàn tất lồng nhau, ngăn đầu ra con từ lượt chạy cũ rò rỉ vào thông báo hiện tại. Các phản hồi thông báo giữ nguyên định tuyến luồng/chủ đề khi bộ chuyển đổi kênh có sẵn.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường | Nguồn |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Nguồn | `subagent` hoặc `cron` |
| ID phiên | Khóa/id phiên con |
| Loại | Loại thông báo + nhãn tác vụ |
| Trạng thái | Suy ra từ kết quả runtime (`success`, `error`, `timeout`, hoặc `unknown`) — **không** suy luận từ văn bản mô hình |
| Nội dung kết quả | Văn bản assistant hiển thị mới nhất từ con |
| Theo dõi | Chỉ dẫn mô tả khi nào cần trả lời và khi nào giữ im lặng |

Các lượt chạy thất bại ở trạng thái kết thúc báo cáo trạng thái thất bại mà không phát lại văn bản trả lời đã ghi lại. Đầu ra tool/toolResult không được nâng cấp thành văn bản kết quả của con.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bọc):

- Runtime (ví dụ `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi giá mô hình được cấu hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId`, và đường dẫn bản ghi để tác nhân main có thể lấy lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Metadata nội bộ chỉ dành cho orchestration; các phản hồi hướng người dùng nên được viết lại bằng giọng assistant bình thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là đường orchestration an toàn hơn:

- Trí nhớ assistant được chuẩn hóa trước: bỏ thẻ suy nghĩ; bỏ giàn giáo `<relevant-memories>` / `<relevant_memories>`; bỏ các khối payload XML gọi công cụ dạng văn bản thuần (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`), bao gồm cả payload bị cắt cụt không bao giờ đóng sạch; bỏ giàn giáo gọi công cụ/kết quả bị hạ cấp và các marker ngữ cảnh lịch sử; bỏ các token điều khiển mô hình bị rò rỉ (`<|assistant|>`, các ASCII `<|...|>` khác, dạng toàn chiều rộng `<｜...｜>`); bỏ XML gọi công cụ MiniMax sai định dạng.
- Văn bản giống thông tin xác thực/token được biên tập lại.
- Các khối dài có thể bị cắt ngắn.
- Lịch sử rất lớn có thể bỏ các hàng cũ hơn hoặc thay một hàng quá khổ bằng `[sessions_history omitted: message too large]`.
- Dùng `nextOffset` khi có để phân trang ngược qua các cửa sổ bản ghi cũ hơn.
- Kiểm tra bản ghi thô trên đĩa là phương án dự phòng khi bạn cần bản ghi đầy đủ từng byte.

## Chính sách công cụ

Tác nhân con trước tiên dùng cùng hồ sơ và pipeline chính sách công cụ như tác nhân cha hoặc tác nhân đích. Sau đó, OpenClaw áp dụng lớp hạn chế tác nhân con.

Khi không có `tools.profile` hạn chế, tác nhân con nhận **tất cả công cụ ngoại trừ công cụ nhắn tin, công cụ phiên, và công cụ hệ thống**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` ở đây cũng vẫn là chế độ xem hồi tưởng có giới hạn và đã được làm sạch — nó không phải là bản dump bản ghi thô.

Khi `maxSpawnDepth >= 2`, các tác nhân con orchestrator độ sâu 1 nhận thêm `sessions_spawn`, `subagents`, `sessions_list`, và `sessions_history` để có thể quản lý các con của chúng.

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

`tools.subagents.tools.allow` là bộ lọc chỉ-cho-phép cuối cùng. Nó có thể thu hẹp tập công cụ đã được phân giải, nhưng không thể **thêm lại** một công cụ đã bị `tools.profile` loại bỏ. Ví dụ, `tools.profile: "coding"` bao gồm `web_search`/`web_fetch` nhưng không bao gồm công cụ `browser`. Để cho tác nhân con dùng hồ sơ coding sử dụng tự động hóa trình duyệt, hãy thêm browser ở giai đoạn hồ sơ:

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

Tác nhân con dùng một lane hàng đợi chuyên dụng trong tiến trình:

- **Tên lane:** `subagent`
- **Mức đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Tính sống và khôi phục

OpenClaw không xem việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một tác nhân con vẫn còn sống. Các lượt chạy chưa kết thúc cũ hơn cửa sổ lượt chạy cũ sẽ không còn được tính là đang hoạt động/đang chờ trong `/subagents list`, tóm tắt trạng thái, cổng hoàn tất hậu duệ, và kiểm tra đồng thời theo từng phiên.

Sau khi gateway khởi động lại, các lượt chạy đã khôi phục cũ chưa kết thúc sẽ bị cắt bỏ trừ khi phiên con của chúng được đánh dấu `abortedLastRun: true`. Các phiên con bị hủy do khởi động lại đó vẫn có thể khôi phục qua luồng khôi phục tác nhân con mồ côi, luồng này gửi một thông điệp tiếp tục tổng hợp trước khi xóa marker đã hủy.

Khôi phục tự động sau khởi động lại được giới hạn theo từng phiên con. Nếu cùng một tác nhân con được chấp nhận khôi phục mồ côi lặp lại bên trong cửa sổ rapid re-wedge, OpenClaw lưu một tombstone khôi phục trên phiên đó và dừng tự động tiếp tục nó ở các lần khởi động lại sau. Chạy `openclaw tasks maintenance --apply` để đối soát bản ghi tác vụ, hoặc `openclaw doctor --fix` để xóa các cờ khôi phục đã hủy cũ trên các phiên có tombstone.

<Note>
Nếu spawn tác nhân con thất bại với Gateway `PAIRING_REQUIRED` / `scope-upgrade`, hãy kiểm tra caller RPC trước khi chỉnh sửa trạng thái ghép đôi. Điều phối nội bộ `sessions_spawn` dispatch trong tiến trình khi caller đã chạy bên trong ngữ cảnh yêu cầu gateway, vì vậy nó không mở WebSocket loopback hoặc phụ thuộc vào baseline phạm vi thiết bị đã ghép đôi của CLI. Các caller bên ngoài tiến trình gateway vẫn dùng dự phòng WebSocket dưới dạng `client.id: "gateway-client"` với `client.mode: "backend"` qua xác thực mật khẩu/token chia sẻ loopback trực tiếp. Caller từ xa, `deviceIdentity` tường minh, đường dẫn token thiết bị tường minh, và client browser/node vẫn cần phê duyệt thiết bị bình thường cho nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên bên yêu cầu và dừng mọi lượt chạy tác nhân con đang hoạt động được spawn từ đó, lan tiếp đến các con lồng nhau.

## Giới hạn

- Thông báo của tác nhân con là **nỗ lực tối đa**. Nếu gateway khởi động lại, công việc “thông báo ngược” đang chờ sẽ bị mất.
- Tác nhân con vẫn chia sẻ cùng tài nguyên tiến trình gateway; hãy xem `maxConcurrent` như một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác nhân con chỉ tiêm `AGENTS.md` và `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, hoặc `BOOTSTRAP.md`). Subagent gốc Codex tuân theo cùng ranh giới: `TOOLS.md` ở lại trong chỉ dẫn luồng Codex được kế thừa, trong khi persona, danh tính, và tệp người dùng chỉ dành cho cha được tiêm dưới dạng chỉ dẫn cộng tác theo lượt để con không sao chép chúng.
- Độ sâu lồng tối đa là 5 (phạm vi `maxSpawnDepth`: 1–5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số con đang hoạt động theo từng phiên (mặc định `5`, phạm vi `1–20`).

## Liên quan

- [Tác nhân ACP](/vi/tools/acp-agents)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
