---
read_when:
    - Bạn muốn thực hiện công việc nền hoặc song song thông qua agent
    - Bạn đang thay đổi chính sách công cụ `sessions_spawn` hoặc sub-agent
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên tác tử phụ được liên kết với luồng.
sidebarTitle: Sub-agents
summary: Khởi chạy các lượt chạy agent nền biệt lập để thông báo kết quả trở lại cuộc trò chuyện của người yêu cầu
title: Tác nhân con
x-i18n:
    generated_at: "2026-07-19T06:06:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a8c5c41315714dddc80fe425c7596b25d60348383afa69c585879be27e5d226c
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agent là các lượt chạy agent nền được tạo từ một lượt chạy agent hiện có.
Mỗi sub-agent chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, sẽ **thông báo** kết quả trở lại kênh trò chuyện của bên yêu cầu.
Mọi lượt chạy sub-agent đều được theo dõi dưới dạng một [tác vụ nền](/vi/automation/tasks).

Mục tiêu:

- Song song hóa việc nghiên cứu, các tác vụ dài và công việc dùng công cụ chậm mà không chặn lượt chạy chính.
- Mặc định giữ các sub-agent cô lập (tách biệt phiên, tùy chọn sandbox).
- Giữ bề mặt công cụ khó bị sử dụng sai: theo mặc định, sub-agent **không** có công cụ phiên hoặc nhắn tin.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu điều phối.

<Note>
**Lưu ý về chi phí:** theo mặc định, mỗi sub-agent có ngữ cảnh và mức sử dụng token
riêng. Đối với các tác vụ nặng hoặc lặp lại, hãy đặt một mô hình tiết kiệm hơn cho sub-agent
và giữ agent chính trên một mô hình chất lượng cao hơn thông qua
`agents.defaults.subagents.model` hoặc các giá trị ghi đè theo từng agent. Khi một agent con
thực sự cần bản chép lời hiện tại của bên yêu cầu, hãy tạo nó với
`context: "fork"`. Các phiên sub-agent gắn với luồng mặc định dùng
`context: "fork"` vì chúng phân nhánh cuộc trò chuyện hiện tại thành một
luồng theo dõi.
</Note>

## Lệnh gạch chéo

`/subagents` kiểm tra các lượt chạy sub-agent cho **phiên hiện tại**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` hiển thị siêu dữ liệu lượt chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn bản chép lời, dọn dẹp). `/subagents log` in các lượt trò chuyện gần đây của một
lượt chạy; thêm token `tools` để bao gồm thông báo gọi công cụ/kết quả (mặc định
bị lược bỏ). Dùng `sessions_history` để xem lại có giới hạn và được lọc an toàn
từ bên trong một lượt agent, hoặc kiểm tra đường dẫn bản chép lời trên đĩa để xem
toàn bộ bản chép lời thô.

Trong Control UI, các phiên cha có lượt chạy con gần đây sẽ có một hàng thanh bên
có thể mở rộng. Các hàng lồng nhau hiển thị trạng thái và thời gian chạy của agent con, và việc chọn một hàng
sẽ mở cuộc trò chuyện của agent con đó trong khi vẫn giữ nguyên hệ thống phân cấp cha.

### Điều khiển liên kết luồng

Các lệnh này hoạt động trên các kênh có liên kết luồng lâu dài. Xem
[Các kênh hỗ trợ luồng](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi tạo

Agent khởi chạy sub-agent nền bằng công cụ `sessions_spawn`.
Kết quả hoàn tất được trả về dưới dạng sự kiện nội bộ của phiên cha; agent cha/bên yêu cầu
quyết định có cần cập nhật hiển thị cho người dùng hay không.

<AccordionGroup>
  <Accordion title="Hoàn tất không chặn, dựa trên cơ chế đẩy">
    - `sessions_spawn` không chặn; nó trả về id lượt chạy ngay lập tức.
    - Khi hoàn tất, sub-agent báo cáo trở lại phiên cha/bên yêu cầu.
    - Các lượt agent cần kết quả từ agent con nên gọi `sessions_yield` sau khi tạo công việc cần thiết. Thao tác này kết thúc lượt hiện tại và cho phép sự kiện hoàn tất đến dưới dạng thông báo tiếp theo mà mô hình có thể thấy.
    - Quá trình hoàn tất dựa trên cơ chế đẩy. Sau khi đã tạo, **không** thăm dò `/subagents list`, `sessions_list` hoặc `sessions_history` trong vòng lặp chỉ để chờ hoàn tất; chỉ kiểm tra trạng thái khi cần trong quá trình gỡ lỗi.
    - Đầu ra của agent con là báo cáo/bằng chứng để agent bên yêu cầu tổng hợp. Đó không phải là văn bản chỉ dẫn do người dùng soạn và không thể ghi đè chính sách hệ thống, nhà phát triển hoặc người dùng.
    - Khi hoàn tất, OpenClaw cố gắng hết sức để đóng các thẻ trình duyệt/tiến trình được theo dõi mà phiên sub-agent đó đã mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Phân phối kết quả hoàn tất">
    - OpenClaw chuyển kết quả hoàn tất trở lại phiên bên yêu cầu thông qua một lượt `agent` với khóa tính lũy đẳng ổn định.
    - Nếu lượt chạy của bên yêu cầu vẫn đang hoạt động, trước tiên OpenClaw cố gắng đánh thức/điều hướng lượt chạy đó thay vì bắt đầu một đường phản hồi hiển thị thứ hai.
    - Nếu không thể đánh thức bên yêu cầu đang hoạt động, OpenClaw chuyển sang bàn giao cho agent bên yêu cầu với cùng ngữ cảnh hoàn tất thay vì loại bỏ thông báo.
    - Việc bàn giao thành công cho agent cha sẽ hoàn tất quá trình phân phối của sub-agent ngay cả khi agent cha quyết định không cần cập nhật hiển thị cho người dùng.
    - Sub-agent gốc không có công cụ nhắn tin. Chúng trả về văn bản thuần của trợ lý cho agent cha/bên yêu cầu; các phản hồi hiển thị cho con người vẫn do chính sách phân phối thông thường của agent cha/bên yêu cầu quản lý.
    - Nếu không thể dùng bàn giao trực tiếp, quá trình phân phối sẽ chuyển sang định tuyến qua hàng đợi, sau đó thử lại thông báo với khoảng lùi theo cấp số nhân ngắn trước khi từ bỏ hoàn toàn.
    - Quá trình phân phối giữ nguyên tuyến bên yêu cầu đã phân giải: tuyến hoàn tất gắn với luồng hoặc cuộc trò chuyện được ưu tiên khi có. Nếu nguồn hoàn tất chỉ cung cấp một kênh, OpenClaw điền đích/tài khoản còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để quá trình phân phối trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Siêu dữ liệu bàn giao kết quả hoàn tất">
    Việc bàn giao kết quả hoàn tất cho phiên bên yêu cầu là ngữ cảnh nội bộ
    do môi trường chạy tạo ra (không phải văn bản do người dùng soạn) và bao gồm:

    - `Result` — văn bản phản hồi `assistant` hiển thị gần nhất từ agent con. Đầu ra tool/toolResult không được đưa vào kết quả của agent con. Các lượt chạy thất bại ở trạng thái kết thúc không tái sử dụng văn bản phản hồi đã ghi lại.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Thống kê ngắn gọn về môi trường chạy/token.
    - Một chỉ dẫn review yêu cầu agent bên yêu cầu xác minh kết quả trước khi quyết định tác vụ ban đầu đã hoàn tất hay chưa.
    - Hướng dẫn theo dõi yêu cầu agent bên yêu cầu tiếp tục tác vụ hoặc ghi lại việc cần theo dõi khi kết quả của agent con vẫn còn hành động cần thực hiện.
    - Một chỉ dẫn cập nhật cuối cùng cho trường hợp không còn hành động nào, được viết bằng giọng trợ lý thông thường mà không chuyển tiếp siêu dữ liệu nội bộ thô.

  </Accordion>
  <Accordion title="Chế độ và môi trường chạy ACP">
    - `--model` và `--thinking` ghi đè các giá trị mặc định cho lượt chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - Đối với các phiên lâu dài gắn với luồng, dùng `sessions_spawn` cùng `thread: true` và `mode: "session"`.
    - Nếu kênh của bên yêu cầu không hỗ trợ liên kết luồng, dùng `mode: "run"` thay vì thử lại một tổ hợp gắn với luồng không thể thực hiện.
    - Đối với các phiên bộ điều phối ACP (Claude Code, Gemini CLI, OpenCode hoặc Codex ACP/acpx được chỉ định rõ), dùng `sessions_spawn` cùng `runtime: "acp"` khi công cụ công bố môi trường chạy đó. Xem [mô hình phân phối ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi quá trình hoàn tất hoặc các vòng lặp agent-với-agent. Khi Plugin `codex` được bật, điều khiển cuộc trò chuyện/luồng Codex nên ưu tiên `/codex ...` hơn ACP, trừ khi người dùng yêu cầu rõ ràng ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không ở trong sandbox và một Plugin backend như `acpx` được tải. `runtime: "acp"` yêu cầu một id bộ điều phối ACP bên ngoài hoặc một mục `agents.list[]` có `runtime.type="acp"`; dùng môi trường chạy sub-agent mặc định cho các agent cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Sub-agent gốc khởi chạy trong trạng thái cô lập, trừ khi bên gọi yêu cầu rõ ràng việc phân nhánh
bản chép lời hiện tại.

| Chế độ       | Thời điểm sử dụng                                                                                                                         | Hành vi                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc dùng công cụ chậm hoặc bất kỳ việc gì có thể được mô tả ngắn gọn trong văn bản tác vụ                           | Tạo bản chép lời sạch cho agent con. Đây là mặc định và giúp giảm mức sử dụng token.  |
| `fork`     | Công việc phụ thuộc vào cuộc trò chuyện hiện tại, kết quả công cụ trước đó hoặc các chỉ dẫn có sắc thái đã có trong bản chép lời của bên yêu cầu | Phân nhánh bản chép lời của bên yêu cầu vào phiên agent con trước khi agent con khởi chạy. |

Chỉ dùng `fork` khi thực sự cần thiết. Chế độ này dành cho việc ủy quyền nhạy cảm với ngữ cảnh, không phải
sự thay thế cho việc viết lời nhắc tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Khởi chạy một lượt sub-agent với `deliver: false` trên làn `subagent` toàn cục,
sau đó chạy một bước thông báo và đăng phản hồi thông báo lên kênh
trò chuyện của bên yêu cầu.

Khả dụng phụ thuộc vào chính sách công cụ có hiệu lực của bên gọi. Các hồ sơ tích hợp sẵn
`coding` và `messaging` bao gồm `sessions_spawn`,
`sessions_yield` và `subagents`; `minimal` thì không. `full` cho phép mọi
công cụ. Thêm các công cụ đó bằng `tools.alsoAllow`, hoặc dùng một trong các hồ sơ
ở trên, cho một agent có hồ sơ tùy chỉnh hẹp hơn nhưng vẫn cần
ủy quyền công việc.
Các chính sách cho phép/từ chối theo kênh/nhóm, nhà cung cấp, sandbox và từng agent
vẫn có thể loại bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ có hiệu lực.

**Mặc định:**

- **Mô hình:** sub-agent gốc kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng agent). Các lượt tạo trong môi trường chạy ACP dùng cùng mô hình sub-agent đã cấu hình khi có; nếu không, bộ điều phối ACP giữ nguyên mặc định của riêng nó. Giá trị `sessions_spawn.model` được chỉ định rõ vẫn được ưu tiên.
- **Suy luận:** sub-agent gốc kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng agent). Các lượt tạo trong môi trường chạy ACP cũng áp dụng `agents.defaults.models["provider/model"].params.thinking` cho mô hình được chọn. Giá trị `sessions_spawn.thinking` được chỉ định rõ vẫn được ưu tiên.
- **Thời gian chờ lượt chạy:** OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó chuyển về `0` (không có thời gian chờ). `sessions_spawn` không chấp nhận giá trị ghi đè thời gian chờ theo từng lệnh gọi.
- **Vòng đời tiến trình:** một sub-agent OpenClaw tách rời có vòng đời lượt chạy riêng. Tác vụ nền được tạo bên trong backend CLI bên ngoài thì khác: nó dùng chung tiến trình con CLI của agent cha và dừng nếu agent cha đó đạt đến `agents.defaults.timeoutSeconds`.
- **Phân phối tác vụ:** sub-agent gốc nhận tác vụ được ủy quyền trong thông báo `[Subagent Task]` hiển thị đầu tiên. Lời nhắc hệ thống của sub-agent chứa các quy tắc môi trường chạy và ngữ cảnh định tuyến, không chứa bản sao ẩn của tác vụ.

Các lượt tạo sub-agent gốc được chấp nhận bao gồm siêu dữ liệu mô hình agent con đã phân giải
trong kết quả công cụ: `resolvedModel` chứa tham chiếu mô hình được áp dụng và
`resolvedProvider` chứa tiền tố nhà cung cấp khi tham chiếu có tiền tố.

### Chế độ lời nhắc ủy quyền

`agents.defaults.subagents.delegationMode` chỉ kiểm soát hướng dẫn lời nhắc; nó không thay đổi chính sách công cụ hoặc bắt buộc ủy quyền.

- `suggest` (mặc định): giữ lời nhắc tiêu chuẩn khuyến khích dùng sub-agent cho công việc lớn hơn hoặc chậm hơn.
- `prefer`: yêu cầu agent chính duy trì khả năng phản hồi và ủy quyền mọi việc phức tạp hơn một phản hồi trực tiếp thông qua `sessions_spawn`.

Ghi đè theo từng agent: `agents.list[].subagents.delegationMode`.

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
  Mô tả tác vụ dành cho tác tử con.
</ParamField>
<ParamField path="taskName" type="string">
  Định danh ổn định tùy chọn để nhận diện một tác tử con cụ thể trong kết quả trạng thái sau này. Phải khớp với `[a-z][a-z0-9_-]{0,63}` và không được là mục tiêu dành riêng như `last` hoặc `all`.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn mà con người có thể đọc được.
</ParamField>
<ParamField path="agentId" type="string">
  Khởi tạo dưới một id tác tử đã cấu hình khác khi `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc tùy chọn của tác vụ cho lượt chạy tác tử con. Các tác tử con gốc vẫn tải tệp khởi động từ không gian làm việc của tác tử đích; `cwd` chỉ thay đổi nơi các công cụ thời gian chạy và bộ khung CLI thực hiện công việc được ủy quyền.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các bộ khung ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode` hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ dành cho ACP. Tiếp tục một phiên bộ khung ACP hiện có khi `runtime: "acp"`; bị bỏ qua khi khởi tạo tác tử con gốc.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ dành cho ACP. Truyền trực tiếp đầu ra lượt chạy ACP đến phiên cha khi `runtime: "acp"`; bỏ qua đối với tác tử con gốc.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình của tác tử con. Các giá trị không hợp lệ sẽ bị bỏ qua và tác tử con chạy trên mô hình mặc định, kèm cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức độ suy luận cho lượt chạy tác tử con. Không khả dụng với `visible: true`.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu liên kết luồng kênh cho phiên tác tử con này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, giá trị mặc định sẽ trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
  Nếu liên kết luồng không khả dụng cho kênh yêu cầu, hãy dùng `mode: "run"` thay thế.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ phiên ngay sau khi thông báo (vẫn giữ bản ghi bằng cách đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối khởi tạo trừ khi thời gian chạy của tác tử con đích được cách ly.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` phân nhánh bản ghi hiện tại của bên yêu cầu vào phiên tác tử con. Chỉ dành cho tác tử con gốc. Các lượt khởi tạo liên kết với luồng mặc định là `fork`; các lượt khởi tạo không liên kết với luồng mặc định là `isolated`. Một nhánh hiển thị phải nhắm đến cùng tác tử với bên yêu cầu.
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  Tạo một phiên bảng điều khiển bền vững mà người dùng có thể mở trong Control UI. Các lượt khởi tạo hiển thị chỉ hỗ trợ `runtime: "subagent"` và luôn giữ lại phiên đã tạo.
</ParamField>
<ParamField path="worktree" type="boolean" default="false">
  Cấp phát một worktree git được quản lý cho phiên bảng điều khiển mới. Yêu cầu `visible: true`.
</ParamField>
<ParamField path="worktreeName" type="string">
  Tên worktree được quản lý tùy chọn. Yêu cầu `visible: true` và `worktree: true`.
</ParamField>
<ParamField path="worktreeBaseRef" type="string">
  Tham chiếu cơ sở git tùy chọn cho worktree được quản lý. Yêu cầu `visible: true` và `worktree: true`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận các tham số phân phối qua kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Tác tử con gốc báo cáo
lượt phản hồi mới nhất của trợ lý về cho bên yêu cầu; việc phân phối bên ngoài vẫn do
tác tử cha/bên yêu cầu đảm nhiệm.
</Warning>

Với `visible: true`, `model`, `cwd` và `context: "fork"` cùng tác tử đều được hỗ trợ. Một đích được cách ly sẽ giới hạn `cwd` trong không gian làm việc của tác tử đó. Liên kết luồng, `mode`, ghi đè suy luận, ngữ cảnh khởi động tối giản và chuẩn bị tệp đính kèm không khả dụng trên đường dẫn này vì các phiên hiển thị là phiên bảng điều khiển bền vững được tạo thông qua `sessions.create`. Việc khởi tạo hiển thị cũng bị từ chối khi không thể chuyển các hạn chế công cụ được kế thừa vào phiên bảng điều khiển. Xem [Worktree được quản lý](/vi/concepts/managed-worktrees) để biết cách đặt tên bản checkout, thiết lập, dọn dẹp và khôi phục.

### Tên tác vụ và chọn mục tiêu

`taskName` là định danh dành cho mô hình để điều phối, không phải khóa phiên.
Dùng định danh này cho các tên tác tử con ổn định như `review_subagents`,
`linux_validation` hoặc `docs_update` khi một tác tử điều phối có thể cần kiểm tra
tác tử con đó sau này.

Quá trình phân giải mục tiêu chấp nhận các kết quả khớp chính xác với `taskName` và các
tiền tố không nhập nhằng. Việc đối sánh được giới hạn trong cùng cửa sổ mục tiêu đang hoạt động/gần đây
được dùng bởi các mục tiêu `/subagents` được đánh số, vì vậy một tác tử con cũ đã hoàn tất không khiến
định danh được sử dụng lại trở nên nhập nhằng. Nếu hai tác tử con đang hoạt động hoặc gần đây dùng chung
`taskName`, mục tiêu sẽ nhập nhằng; hãy dùng chỉ mục danh sách, khóa phiên hoặc
id lượt chạy thay thế.

Các mục tiêu dành riêng `last` và `all` không phải là giá trị `taskName` hợp lệ
vì chúng đã mang ý nghĩa điều khiển.

## Công cụ: `sessions_yield`

Kết thúc lượt mô hình hiện tại và chờ các sự kiện thời gian chạy, chủ yếu là
sự kiện hoàn tất của tác tử con, xuất hiện dưới dạng thông báo tiếp theo. Dùng công cụ này sau khi
khởi tạo công việc tác tử con bắt buộc nếu bên yêu cầu không thể đưa ra câu trả lời
cuối cùng cho đến khi nhận được các kết quả hoàn tất đó.

`sessions_yield` là cơ chế chờ. Không thay thế bằng các vòng lặp thăm dò
qua `subagents`, `sessions_list`, `sessions_history`, lệnh shell
`sleep` hoặc việc thăm dò tiến trình chỉ để phát hiện tác tử con đã hoàn tất.

Chỉ dùng `sessions_yield` khi danh sách công cụ hiệu dụng của phiên có bao gồm
công cụ đó. Một số hồ sơ công cụ tối giản hoặc tùy chỉnh có thể cung cấp `sessions_spawn` và
`subagents` mà không cung cấp `sessions_yield`; trong trường hợp đó, không tự tạo
vòng lặp thăm dò chỉ để chờ hoàn tất.

Khi có các tác tử con đang hoạt động, OpenClaw chèn một khối lời nhắc nhỏ gọn do thời gian chạy tạo,
`Active Subagents`, vào các lượt thông thường để bên yêu cầu có thể thấy
các phiên tác tử con hiện tại, id lượt chạy, trạng thái, nhãn, tác vụ và
bí danh `taskName` mà không cần thăm dò. Các trường tác vụ và nhãn trong khối đó
được trích dẫn dưới dạng dữ liệu, không phải chỉ dẫn, vì chúng có thể bắt nguồn
từ các đối số khởi tạo do người dùng/mô hình cung cấp.

## Công cụ: `subagents`

Liệt kê các lượt chạy tác tử con đã khởi tạo và bản ghi tác vụ nền thuộc cây phiên
của bên yêu cầu. Các hàng tác vụ bao gồm tác tử con gốc, lượt chạy ACP,
công việc CLI/phương tiện của Gateway và các lần thực thi cron. Phạm vi được giới hạn ở bên yêu cầu
hiện tại; một tác tử con chỉ có thể thấy các tác tử con do chính nó kiểm soát.

Dùng `subagents` để xem trạng thái và gỡ lỗi theo yêu cầu. Dùng `sessions_yield` để
chờ sự kiện hoàn tất.

Dùng `action: "cancel"` với `taskId` do `action: "list"` trả về để dừng
một tác vụ. Việc hủy bị giới hạn trong cây phiên được kiểm soát; một tác tử con
ở nút lá không thể hủy công việc thuộc sở hữu của phiên khác.

## Phiên liên kết với luồng

Khi liên kết luồng được bật cho một kênh, tác tử con có thể tiếp tục được liên kết
với một luồng để các thông báo tiếp theo của người dùng trong luồng đó tiếp tục được định tuyến đến
cùng phiên tác tử con.

### Các kênh hỗ trợ luồng

Một kênh hỗ trợ các phiên tác tử con bền vững được liên kết với luồng
(`sessions_spawn` với `thread: true`) khi đăng ký một bộ điều hợp liên kết
cuộc hội thoại. Các kênh đi kèm có hỗ trợ này: **Discord**,
**iMessage**, **Matrix** và **Telegram**. Discord và Matrix mặc định
tạo một luồng con; Telegram và iMessage mặc định liên kết với
cuộc hội thoại hiện tại. Dùng các khóa cấu hình `threadBindings` riêng cho từng kênh để
bật tính năng, đặt thời gian chờ và `spawnSessions`.

### Luồng nhanh

<Steps>
  <Step title="Khởi tạo">
    `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"`).
  </Step>
  <Step title="Liên kết">
    OpenClaw tạo hoặc liên kết một luồng với mục tiêu phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Định tuyến thông báo tiếp theo">
    Các phản hồi và thông báo tiếp theo trong luồng đó được định tuyến đến phiên đã liên kết.
  </Step>
  <Step title="Kiểm tra thời gian chờ">
    Dùng `/session idle` để kiểm tra/cập nhật việc tự động bỏ tập trung khi không hoạt động và
    `/session max-age` để kiểm soát giới hạn cứng.
  </Step>
  <Step title="Tách">
    Dùng `/unfocus` để tách thủ công.
  </Step>
</Steps>

### Điều khiển thủ công

| Lệnh               | Hiệu lực                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Liên kết luồng hiện tại (hoặc tạo một luồng) với mục tiêu tác tử con/phiên                 |
| `/unfocus`         | Xóa liên kết của luồng hiện đang được liên kết                                             |
| `/agents`          | Liệt kê các lượt chạy đang hoạt động và trạng thái liên kết (`binding:<id>`, `unbound` hoặc `bindings unavailable`) |
| `/session idle`    | Kiểm tra/cập nhật việc tự động bỏ tập trung khi nhàn rỗi (chỉ các luồng liên kết đang được tập trung) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng liên kết đang được tập trung)               |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Các khóa ghi đè theo kênh và tự động liên kết khi khởi tạo** phụ thuộc vào từng bộ điều hợp. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết thông tin chi tiết hiện tại về bộ điều hợp.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách id tác tử đã cấu hình có thể được nhắm đến thông qua `agentId` rõ ràng (`["*"]` cho phép mọi đích đã cấu hình). Mặc định: chỉ tác tử yêu cầu. Nếu đặt danh sách và vẫn muốn bên yêu cầu khởi tạo chính nó bằng `agentId`, hãy thêm id của bên yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép mặc định gồm các tác tử đích đã cấu hình, được dùng khi tác tử yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng). Ghi đè theo từng tác tử: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Thời gian chờ theo từng lệnh gọi cho các lần thử phân phối thông báo `agent` của Gateway. Giá trị là số mili giây nguyên dương và được giới hạn ở mức tối đa an toàn của bộ hẹn giờ nền tảng. Các lần thử lại do lỗi tạm thời có thể khiến tổng thời gian chờ thông báo dài hơn một khoảng thời gian chờ đã cấu hình.
</ParamField>

Nếu phiên của bên yêu cầu được cách ly, `sessions_spawn` sẽ từ chối các đích
có khả năng chạy mà không được cách ly.

### Khám phá

Dùng `agents_list` để xem những id tác tử nào hiện được phép cho
`sessions_spawn`. Phản hồi bao gồm mô hình hiệu dụng và siêu dữ liệu thời gian chạy
nhúng của từng tác tử được liệt kê để bên gọi có thể phân biệt OpenClaw, máy chủ ứng dụng
Codex và các thời gian chạy gốc đã cấu hình khác.

`allowAgents` phải trỏ đến các id tác tử đã cấu hình trong `agents.list[]`.
`["*"]` có nghĩa là bất kỳ tác tử đích nào đã cấu hình cộng với bên yêu cầu. Nếu cấu hình của một tác tử
bị xóa nhưng id của tác tử đó vẫn còn trong `allowAgents`, `sessions_spawn` sẽ từ chối id đó
và `agents_list` sẽ bỏ qua id đó. Chạy `openclaw doctor --fix` để dọn dẹp các mục cũ
trong danh sách cho phép, hoặc thêm một mục `agents.list[]` tối thiểu khi tác tử đích cần
vẫn có thể được tạo trong khi kế thừa các giá trị mặc định.

### Tự động lưu trữ

- Các phiên tác tử con được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định là `60`).
- Quá trình lưu trữ sử dụng `sessions.delete` và đổi tên bản ghi hội thoại thành `*.deleted.<timestamp>` (trong cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại bằng cách đổi tên).
- Tự động lưu trữ được thực hiện trên cơ sở nỗ lực tối đa; các bộ hẹn giờ đang chờ sẽ bị mất nếu Gateway khởi động lại.
- Thời gian chờ chạy đã cấu hình **không** tự động lưu trữ; chúng chỉ dừng lượt chạy. Phiên vẫn tồn tại cho đến khi được tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Việc dọn dẹp trình duyệt tách biệt với việc dọn dẹp lưu trữ: các tab/tiến trình trình duyệt được theo dõi sẽ được đóng trên cơ sở nỗ lực tối đa khi lượt chạy kết thúc, ngay cả khi bản ghi hội thoại/phiên vẫn được giữ lại.

## Tác tử con lồng nhau

Theo mặc định, tác tử con không thể tạo tác tử con của riêng chúng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu điều phối viên**: tác tử chính → tác tử con điều phối viên →
các tác tử cháu thực thi.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // cho phép tác tử con tạo tác tử con (mặc định: 1, phạm vi 1-5)
        maxChildrenPerAgent: 5, // số tác tử con đang hoạt động tối đa trên mỗi phiên tác tử (mặc định: 5, phạm vi 1-20)
        maxConcurrent: 8, // giới hạn làn đồng thời toàn cục (mặc định: 8)
        runTimeoutSeconds: 900, // thời gian chờ mặc định cho sessions_spawn (0 = không có thời gian chờ)
        announceTimeoutMs: 120000, // thời gian chờ thông báo Gateway cho mỗi lệnh gọi
      },
    },
  },
}
```

### Các cấp độ sâu

| Độ sâu | Dạng khóa phiên                                | Vai trò                                              | Có thể tạo tác tử con?         |
| ------ | --------------------------------------------- | ---------------------------------------------------- | ------------------------------ |
| 0      | `agent:<id>:main`                            | Tác tử chính                                         | Luôn luôn                      |
| 1      | `agent:<id>:subagent:<uuid>`                            | Tác tử con (điều phối viên khi cho phép độ sâu 2)    | Chỉ khi `maxSpawnDepth >= 2`     |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>`                            | Tác tử cháu (tác tử thực thi ở nút lá)               | Không bao giờ                  |

### Chuỗi thông báo

Kết quả được truyền ngược lên chuỗi:

1. Tác tử thực thi độ sâu 2 hoàn tất → thông báo cho tác tử cha (điều phối viên độ sâu 1).
2. Điều phối viên độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho tác tử chính.
3. Tác tử chính nhận thông báo và chuyển đến người dùng.

Mỗi cấp chỉ nhìn thấy thông báo từ các tác tử con trực tiếp của mình.

<Note>
**Hướng dẫn vận hành:** chỉ khởi chạy công việc của tác tử con một lần và chờ các sự kiện
hoàn tất thay vì xây dựng các vòng lặp thăm dò quanh `sessions_list`,
`sessions_history`, `/subagents list` hoặc các lệnh ngủ `exec`.
`sessions_list` và `/subagents list` giữ cho quan hệ phiên tác tử con
tập trung vào công việc đang diễn ra — các tác tử con đang hoạt động vẫn được gắn kết, các tác tử con đã kết thúc vẫn
hiển thị trong một khoảng thời gian gần đây ngắn, còn các liên kết tác tử con cũ chỉ tồn tại trong kho lưu trữ sẽ
bị bỏ qua sau khoảng thời gian còn mới của chúng. Điều này ngăn siêu dữ liệu `spawnedBy` /
`parentSessionKey` cũ làm sống lại các tác tử con ma sau khi
khởi động lại. Nếu một sự kiện hoàn tất của tác tử con đến sau khi bạn đã gửi
câu trả lời cuối cùng, phản hồi tiếp theo chính xác là token im lặng
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi kiểm soát được ghi vào siêu dữ liệu phiên tại thời điểm tạo. Điều này ngăn các khóa phiên phẳng hoặc được khôi phục vô tình lấy lại đặc quyền điều phối viên.
- **Độ sâu 1 (điều phối viên, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể tạo tác tử con và kiểm tra trạng thái của chúng. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (nút lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (tác tử thực thi ở nút lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể tạo thêm tác tử con.

### Giới hạn tạo theo từng tác tử

Mỗi phiên tác tử (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định là `5`) tác tử con đang hoạt động cùng lúc. Điều này ngăn một điều phối viên
đơn lẻ phân nhánh mất kiểm soát.

### Dừng liên đới

Việc dừng một điều phối viên độ sâu 1 sẽ tự động dừng tất cả các tác tử con độ sâu 2
của nó:

- `/stop` trong cuộc trò chuyện chính sẽ dừng tất cả tác tử độ sâu 1 và dừng liên đới các tác tử con độ sâu 2 của chúng.

## Xác thực

Thông tin xác thực của tác tử con được phân giải theo **id tác tử**, không phải theo loại phiên:

- Khóa phiên tác tử con là `agent:<agentId>:subagent:<uuid>`.
- Kho thông tin xác thực được tải từ `agentDir` của tác tử đó.
- Các hồ sơ xác thực của tác tử chính được hợp nhất vào làm **phương án dự phòng**; hồ sơ tác tử ghi đè hồ sơ chính khi có xung đột.

Phép hợp nhất mang tính bổ sung, vì vậy các hồ sơ chính luôn có sẵn làm
phương án dự phòng. Việc xác thực hoàn toàn biệt lập cho từng tác tử hiện chưa được hỗ trợ.

## Thông báo

Tác tử con báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác tử con (không phải phiên của bên yêu cầu).
- Nếu tác tử con trả lời chính xác `ANNOUNCE_SKIP`, sẽ không có nội dung nào được đăng.
- Nếu văn bản mới nhất của trợ lý là chính xác token im lặng `NO_REPLY` / `no_reply`, đầu ra thông báo sẽ bị chặn ngay cả khi trước đó đã có tiến trình hiển thị.

Cách chuyển giao phụ thuộc vào độ sâu của bên yêu cầu:

- Các phiên yêu cầu cấp cao nhất sử dụng một lệnh gọi `agent` tiếp theo với chế độ chuyển giao ra bên ngoài (`deliver=true`).
- Các phiên tác tử con yêu cầu lồng nhau nhận một lần chèn tiếp theo nội bộ (`deliver=false`) để điều phối viên có thể tổng hợp kết quả của tác tử con ngay trong phiên.
- Nếu một phiên tác tử con yêu cầu lồng nhau không còn tồn tại, OpenClaw sẽ dự phòng về bên yêu cầu của phiên đó khi có sẵn.

Đối với các phiên yêu cầu cấp cao nhất, chế độ hoàn tất chuyển giao trực tiếp trước tiên
phân giải mọi tuyến hội thoại/luồng đã liên kết và phần ghi đè hook, sau đó điền
các trường kênh-đích còn thiếu từ tuyến đã lưu của phiên yêu cầu.
Điều này giữ cho nội dung hoàn tất nằm đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn hoàn tất
chỉ xác định kênh.

Khi xây dựng các kết quả hoàn tất lồng nhau, việc tổng hợp kết quả hoàn tất của tác tử con được giới hạn trong lượt chạy hiện tại của bên yêu cầu, ngăn đầu ra cũ của tác tử con từ lượt chạy trước lọt vào thông báo hiện tại. Các phản hồi thông báo giữ nguyên định tuyến luồng/chủ đề khi bộ điều hợp kênh hỗ trợ.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường          | Nguồn                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Nguồn           | `subagent` hoặc `cron`                                                             |
| Id phiên        | Khóa/id phiên tác tử con                                                                                |
| Loại            | Loại thông báo + nhãn tác vụ                                                                            |
| Trạng thái      | Được suy ra từ kết quả thời gian chạy (`ok`, `error`, `timeout` hoặc `unknown`) — **không** suy luận từ văn bản của mô hình |
| Nội dung kết quả | Văn bản trợ lý hiển thị mới nhất từ tác tử con                                                         |
| Tiếp theo       | Hướng dẫn mô tả khi nào cần trả lời và khi nào cần giữ im lặng                                          |

Các lượt chạy kết thúc với lỗi sẽ báo cáo trạng thái lỗi mà không phát lại
văn bản phản hồi đã ghi nhận. Đầu ra công cụ/toolResult không được đưa lên làm văn bản kết quả của tác tử con.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bao bọc):

- Thời gian chạy (ví dụ: `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi đã cấu hình giá mô hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` và đường dẫn bản ghi hội thoại để tác tử chính có thể tìm nạp lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Siêu dữ liệu nội bộ chỉ dành cho việc điều phối; các phản hồi hướng đến người dùng
nên được viết lại bằng giọng trợ lý thông thường.

### Tại sao nên ưu tiên `sessions_history`

`sessions_history` là đường điều phối an toàn hơn để đọc bản ghi hội thoại của tác tử con
từ bên trong một lượt tác tử:

- Che thông tin giống thông tin xác thực/token ngay cả khi tính năng che nhật ký đa dụng bị tắt.
- Cắt ngắn các khối văn bản dài (4000 ký tự mỗi khối) và loại bỏ chữ ký suy nghĩ, payload phát lại lập luận và dữ liệu hình ảnh nội tuyến.
- Áp dụng giới hạn phản hồi 80 KB; các hàng quá lớn được thay thế bằng `[sessions_history omitted: message too large]`.
- Sử dụng `nextOffset` khi có để phân trang ngược qua các cửa sổ bản ghi hội thoại cũ hơn.
- `sessions_history` **không** loại bỏ thẻ lập luận, khung `<relevant-memories>` hoặc XML lệnh gọi công cụ khỏi văn bản tin nhắn — nó trả về các khối nội dung có cấu trúc gần với dạng bản ghi hội thoại thô, chỉ được che và giới hạn kích thước. `/subagents log` áp dụng trình làm sạch văn xuôi mạnh hơn (loại bỏ thẻ lập luận, khung bộ nhớ và XML lệnh gọi công cụ) vì nó hiển thị các dòng trò chuyện thuần túy thay vì các khối có cấu trúc.
- Kiểm tra bản ghi hội thoại thô trên đĩa là phương án dự phòng khi bạn cần toàn bộ bản ghi chính xác từng byte.

## Chính sách công cụ

Trước tiên, tác tử con sử dụng cùng hồ sơ và pipeline chính sách công cụ như tác tử cha hoặc
tác tử đích. Sau đó, OpenClaw áp dụng lớp hạn chế tác tử con.

Tác tử con luôn mất `gateway`, `agents_list`, `session_status` và
`cron` bất kể độ sâu hay vai trò (các công cụ cấp hệ thống/tương tác hoặc
các công cụ mà tác tử chính nên điều phối). Các tác tử con ở nút lá (hành vi mặc định ở độ sâu 1
và luôn áp dụng ở độ sâu 2) còn mất thêm `subagents`,
`sessions_list`, `sessions_history` và `sessions_spawn`. Tác tử con không bao giờ
nhận công cụ `message` — công cụ này bị vô hiệu hóa tại thời điểm tạo, không phải được lọc bởi
danh sách từ chối này — và `sessions_send` vẫn bị từ chối để tác tử con
chỉ giao tiếp qua chuỗi thông báo.

`sessions_history` ở đây cũng vẫn là chế độ xem truy xuất có giới hạn và đã được làm sạch —
không phải bản kết xuất bản ghi hội thoại thô.

Khi `maxSpawnDepth >= 2`, tác tử con điều phối viên độ sâu 1 còn
nhận thêm `sessions_spawn`, `subagents`, `sessions_list` và
`sessions_history` để có thể quản lý các tác tử con của mình.

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
        // từ chối được ưu tiên
        deny: ["gateway", "cron"],
        // nếu đặt allow, cấu hình sẽ chuyển thành chỉ cho phép các mục trong đó (deny vẫn được ưu tiên)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` là bộ lọc cuối cùng chỉ cho phép. Nó có thể thu hẹp
tập công cụ đã được phân giải, nhưng không thể **thêm lại** một công cụ đã bị loại bỏ
bởi `tools.profile`. Ví dụ: `tools.profile: "coding"` bao gồm
`web_search`/`web_fetch` nhưng không bao gồm công cụ `browser`. Để cho phép
các tác tử con dùng hồ sơ lập trình sử dụng tính năng tự động hóa trình duyệt, hãy thêm browser ở
giai đoạn hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Sử dụng `agents.list[].tools.alsoAllow: ["browser"]` theo từng agent khi chỉ một
agent cần được tự động hóa trình duyệt.

## Tính đồng thời

Các sub-agent sử dụng một lane hàng đợi chuyên dụng trong cùng tiến trình:

- **Tên lane:** `subagent`
- **Mức đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Khả năng hoạt động và khôi phục

OpenClaw không coi việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một
sub-agent vẫn đang hoạt động. Các lượt chạy chưa kết thúc cũ hơn khoảng thời gian xác định lượt chạy lỗi thời
(2 giờ, hoặc thời gian chờ lượt chạy đã cấu hình cộng thêm một khoảng gia hạn ngắn,
tùy giá trị nào dài hơn) sẽ không còn được tính là đang hoạt động/đang chờ trong `/subagents list`,
các bản tóm tắt trạng thái, cơ chế chặn hoàn tất của hậu duệ và các bước
kiểm tra tính đồng thời theo phiên.

Sau khi Gateway khởi động lại, các lượt chạy đã khôi phục nhưng chưa kết thúc và đã lỗi thời sẽ bị loại bỏ, trừ khi
phiên con của chúng được đánh dấu `abortedLastRun: true`. Các lượt chạy
bị hủy do khởi động lại vẫn được đăng ký cho luồng khôi phục sub-agent mồ côi: các lượt chạy
lỗi thời được hoàn tất mà không tiếp tục, còn các phiên con mới sẽ nhận được
một thông báo tiếp tục tổng hợp trước khi dấu hiệu bị hủy được xóa.

Quá trình tự động khôi phục sau khi khởi động lại được giới hạn theo từng phiên con. Nếu cùng một
sub-agent con được chấp nhận khôi phục mồ côi nhiều lần trong
khoảng thời gian nhanh chóng bị kẹt lại, OpenClaw sẽ lưu một dấu mộ khôi phục trên
phiên đó và ngừng tự động tiếp tục phiên này trong các lần khởi động lại sau. Chạy
`openclaw tasks maintenance --apply` để đối soát bản ghi tác vụ, hoặc
`openclaw doctor --fix` để xóa các cờ khôi phục bị hủy đã lỗi thời trên
các phiên có dấu mộ.

<Note>
Nếu việc tạo sub-agent thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra trình gọi RPC trước khi chỉnh sửa trạng thái ghép nối.
Hoạt động điều phối `sessions_spawn` nội bộ được điều phối trong cùng tiến trình khi
trình gọi đã chạy bên trong ngữ cảnh yêu cầu của Gateway, vì vậy hoạt động này
không mở WebSocket loopback hoặc phụ thuộc vào đường cơ sở phạm vi thiết bị đã ghép nối
của CLI. Các trình gọi bên ngoài tiến trình Gateway vẫn sử dụng phương án dự phòng WebSocket
dưới dạng `client.id: "gateway-client"` với `client.mode: "backend"`
thông qua cơ chế xác thực trực tiếp bằng mã thông báo dùng chung/mật khẩu trên loopback. Các trình gọi từ xa, tùy chọn
`deviceIdentity` được chỉ định rõ ràng, các đường dẫn mã thông báo thiết bị được chỉ định rõ ràng và các máy khách trình duyệt/node
vẫn cần phê duyệt thiết bị thông thường để nâng cấp phạm vi.
</Note>

## Dừng

- Việc gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên của bên yêu cầu và dừng mọi lượt chạy sub-agent đang hoạt động được tạo từ phiên đó, đồng thời lan truyền đến các phần tử con lồng nhau.

## Giới hạn

- Thông báo của sub-agent được thực hiện theo nguyên tắc **nỗ lực tối đa**. Nếu Gateway khởi động lại, công việc "thông báo ngược lại" đang chờ sẽ bị mất.
- Các sub-agent vẫn chia sẻ cùng tài nguyên tiến trình Gateway; hãy xem `maxConcurrent` như một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh sub-agent chỉ chèn `AGENTS.md` và `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` hoặc `BOOTSTRAP.md`). Các sub-agent gốc Codex tuân theo cùng ranh giới: `TOOLS.md` vẫn nằm trong các chỉ dẫn luồng Codex được kế thừa, còn các tệp nhân dạng, danh tính và người dùng chỉ dành cho agent cha được chèn dưới dạng chỉ dẫn cộng tác có phạm vi theo lượt để các agent con không sao chép chúng.
- Độ sâu lồng tối đa là 5 (phạm vi `maxSpawnDepth`: 1-5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số agent con đang hoạt động trên mỗi phiên (mặc định `5`, phạm vi `1-20`).

## Liên quan

- [Công cụ phiên và thay đổi trạng thái](/vi/concepts/session-tool)
- [Agent ACP](/vi/tools/acp-agents)
- [Gửi qua agent](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa agent](/vi/tools/multi-agent-sandbox-tools)
