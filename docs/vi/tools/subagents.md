---
read_when:
    - Bạn muốn thực hiện công việc nền hoặc song song thông qua agent
    - Bạn đang thay đổi chính sách công cụ sessions_spawn hoặc sub-agent
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên subagent được liên kết với luồng hội thoại
sidebarTitle: Sub-agents
summary: Khởi chạy các lượt chạy agent nền biệt lập để thông báo kết quả trở lại cuộc trò chuyện của người yêu cầu
title: Tác tử phụ
x-i18n:
    generated_at: "2026-07-20T04:33:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c8f63a6c1cd6a34f9bae067bbd63d1e3c8223beffb52f06b6689f161c8f9a1ce
    source_path: tools/subagents.md
    workflow: 16
---

Các sub-agent là những lượt chạy agent nền được khởi tạo từ một lượt chạy agent hiện có.
Mỗi sub-agent chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, **thông báo** kết quả trở lại kênh chat của bên yêu cầu.
Mỗi lượt chạy sub-agent được theo dõi như một [tác vụ nền](/vi/automation/tasks).

Mục tiêu:

- Song song hóa việc nghiên cứu, các tác vụ dài và công việc công cụ chậm mà không chặn lượt chạy chính.
- Mặc định duy trì sự cô lập giữa các sub-agent (tách biệt phiên, tùy chọn sandbox).
- Giữ bề mặt công cụ khó bị sử dụng sai: mặc định sub-agent **không** có công cụ phiên hoặc nhắn tin.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu điều phối.

<Note>
**Lưu ý về chi phí:** theo mặc định, mỗi sub-agent có ngữ cảnh và mức sử dụng token riêng.
Đối với các tác vụ nặng hoặc lặp lại, hãy đặt một model rẻ hơn cho sub-agent
và giữ agent chính trên model chất lượng cao hơn thông qua
`agents.defaults.subagents.model` hoặc các ghi đè theo từng agent. Khi agent con
thực sự cần bản chép lời hiện tại của bên yêu cầu, hãy khởi tạo nó với
`context: "fork"`. Các phiên sub-agent được liên kết với luồng mặc định dùng
`context: "fork"` vì chúng phân nhánh cuộc hội thoại hiện tại thành một
luồng tiếp nối.
</Note>

## Lệnh dấu gạch chéo

`/subagents` kiểm tra các lượt chạy sub-agent cho **phiên hiện tại**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` hiển thị siêu dữ liệu của lượt chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn bản chép lời, dọn dẹp). `/subagents log` in các lượt chat gần đây của một
lượt chạy; thêm token `tools` để bao gồm thông báo gọi công cụ/kết quả (mặc định
bị bỏ qua). Dùng `sessions_history` để xem lại trong phạm vi giới hạn, đã lọc an toàn
ngay trong một lượt agent, hoặc kiểm tra đường dẫn bản chép lời trên ổ đĩa để xem
toàn bộ bản chép lời thô.

Trong Control UI, các phiên cha có lượt chạy con gần đây sẽ có một hàng
thanh bên có thể mở rộng. Các hàng lồng nhau hiển thị trạng thái và thời gian chạy của agent con; việc chọn một hàng
sẽ mở cuộc trò chuyện của agent con đó trong khi vẫn giữ nguyên hệ phân cấp cha.

### Các điều khiển liên kết luồng

Các lệnh này hoạt động trên những kênh có liên kết luồng bền vững. Xem
[Các kênh hỗ trợ luồng](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi khởi tạo

Agent khởi chạy các sub-agent nền bằng công cụ `sessions_spawn`.
Kết quả hoàn tất được trả về dưới dạng sự kiện nội bộ của phiên cha; agent cha/bên yêu cầu
quyết định có cần cập nhật cho người dùng hay không.

<AccordionGroup>
  <Accordion title="Hoàn tất không chặn, dựa trên cơ chế đẩy">
    - `sessions_spawn` không chặn; nó trả về id lượt chạy ngay lập tức.
    - Khi hoàn tất, sub-agent báo cáo lại cho phiên cha/bên yêu cầu.
    - Các lượt agent cần kết quả từ agent con nên gọi `sessions_yield` sau khi khởi tạo công việc cần thiết. Thao tác đó kết thúc lượt hiện tại và cho phép sự kiện hoàn tất xuất hiện dưới dạng thông báo tiếp theo mà model nhìn thấy.
    - Việc hoàn tất dựa trên cơ chế đẩy. Sau khi khởi tạo, **không** thăm dò `/subagents list`, `sessions_list` hoặc `sessions_history` trong vòng lặp chỉ để chờ hoàn tất; chỉ kiểm tra trạng thái theo nhu cầu khi gỡ lỗi.
    - Đầu ra của agent con là báo cáo/bằng chứng để agent bên yêu cầu tổng hợp. Đây không phải văn bản hướng dẫn do người dùng soạn và không thể ghi đè chính sách hệ thống, nhà phát triển hoặc người dùng.
    - Khi hoàn tất, OpenClaw cố gắng tối đa để đóng các tab/tiến trình trình duyệt được phiên sub-agent đó mở và theo dõi trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Phân phối kết quả hoàn tất">
    - OpenClaw chuyển kết quả hoàn tất trở lại phiên bên yêu cầu thông qua một lượt `agent` với khóa idempotency ổn định.
    - Nếu lượt chạy của bên yêu cầu vẫn đang hoạt động, trước tiên OpenClaw cố gắng đánh thức/điều hướng lượt chạy đó thay vì bắt đầu một đường dẫn phản hồi hiển thị thứ hai.
    - Nếu không thể đánh thức bên yêu cầu đang hoạt động, OpenClaw chuyển sang bàn giao cho agent bên yêu cầu với cùng ngữ cảnh hoàn tất thay vì bỏ thông báo.
    - Việc bàn giao thành công cho agent cha sẽ hoàn tất quá trình phân phối của sub-agent ngay cả khi agent cha quyết định không cần cập nhật hiển thị cho người dùng.
    - Sub-agent gốc không có công cụ nhắn tin. Chúng trả về văn bản trợ lý thuần túy cho agent cha/bên yêu cầu; các phản hồi hiển thị cho con người vẫn thuộc quyền quản lý của chính sách phân phối thông thường của agent cha/bên yêu cầu.
    - Nếu không thể dùng bàn giao trực tiếp, quá trình phân phối sẽ chuyển sang định tuyến qua hàng đợi, rồi thử lại thông báo trong thời gian ngắn với backoff lũy thừa trước khi từ bỏ hoàn toàn.
    - Quá trình phân phối giữ nguyên tuyến bên yêu cầu đã phân giải: tuyến hoàn tất liên kết với luồng hoặc cuộc hội thoại được ưu tiên khi có. Nếu nguồn gốc hoàn tất chỉ cung cấp một kênh, OpenClaw điền đích/tài khoản còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để phân phối trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Siêu dữ liệu bàn giao kết quả hoàn tất">
    Việc bàn giao kết quả hoàn tất cho phiên bên yêu cầu là ngữ cảnh nội bộ
    do runtime tạo (không phải văn bản do người dùng soạn) và bao gồm:

    - `Result` — văn bản phản hồi `assistant` hiển thị gần nhất từ agent con. Đầu ra tool/toolResult không được đưa vào kết quả của agent con. Các lượt chạy kết thúc với trạng thái thất bại không tái sử dụng văn bản phản hồi đã ghi lại.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Số liệu thống kê ngắn gọn về runtime/token.
    - Một hướng dẫn review yêu cầu agent bên yêu cầu xác minh kết quả trước khi quyết định tác vụ ban đầu đã hoàn tất hay chưa.
    - Hướng dẫn tiếp nối yêu cầu agent bên yêu cầu tiếp tục tác vụ hoặc ghi lại phần việc tiếp theo khi kết quả của agent con vẫn còn hành động cần thực hiện.
    - Một hướng dẫn cập nhật cuối cùng cho trường hợp không còn hành động nào, được viết bằng giọng trợ lý thông thường mà không chuyển tiếp siêu dữ liệu nội bộ thô.

  </Accordion>
  <Accordion title="Chế độ và runtime ACP">
    - `--model` và `--thinking` ghi đè các giá trị mặc định cho lượt chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - Đối với các phiên bền vững được liên kết với luồng, dùng `sessions_spawn` cùng `thread: true` và `mode: "session"`.
    - Nếu kênh bên yêu cầu không hỗ trợ liên kết luồng, hãy dùng `mode: "run"` thay vì thử lại một tổ hợp liên kết luồng không thể thực hiện.
    - Đối với các phiên bộ khung ACP (Claude Code, Gemini CLI, OpenCode hoặc Codex ACP/acpx rõ ràng), dùng `sessions_spawn` cùng `runtime: "acp"` khi công cụ quảng bá runtime đó. Xem [Mô hình phân phối ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi quá trình hoàn tất hoặc vòng lặp giữa các agent. Khi Plugin `codex` được bật, việc điều khiển chat/luồng Codex nên ưu tiên `/codex ...` hơn ACP trừ khi người dùng yêu cầu rõ ràng ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không ở trong sandbox và một Plugin backend như `acpx` được tải. `runtime: "acp"` yêu cầu id bộ khung ACP bên ngoài hoặc một mục `agents.list[]` có `runtime.type="acp"`; hãy dùng runtime sub-agent mặc định cho các agent cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Sub-agent gốc bắt đầu ở trạng thái cô lập trừ khi bên gọi yêu cầu rõ ràng phân nhánh
bản chép lời hiện tại.

| Chế độ       | Khi nào nên sử dụng                                                                                                                         | Hành vi                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm hoặc bất kỳ việc gì có thể được mô tả đầy đủ trong văn bản tác vụ                           | Tạo bản chép lời agent con sạch. Đây là chế độ mặc định và giúp giảm mức sử dụng token.  |
| `fork`     | Công việc phụ thuộc vào cuộc hội thoại hiện tại, kết quả công cụ trước đó hoặc các hướng dẫn tinh tế đã có trong bản chép lời của bên yêu cầu | Phân nhánh bản chép lời của bên yêu cầu vào phiên agent con trước khi agent con bắt đầu. |

Dùng `fork` một cách tiết chế. Chế độ này dành cho việc ủy quyền nhạy cảm với ngữ cảnh, không phải
thay thế cho việc viết lời nhắc tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Bắt đầu một lượt chạy sub-agent với `deliver: false` trên lane `subagent` toàn cục,
sau đó chạy bước thông báo và đăng phản hồi thông báo lên kênh
chat của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ hiệu lực của bên gọi. Các hồ sơ tích hợp sẵn
`coding` và `messaging` bao gồm `sessions_spawn`,
`sessions_yield` và `subagents`; `minimal` thì không. `full` cho phép mọi
công cụ. Thêm các công cụ đó bằng `tools.alsoAllow`, hoặc dùng một trong các hồ sơ
ở trên, cho agent có hồ sơ tùy chỉnh hẹp hơn nhưng vẫn cần
ủy quyền công việc.
Các chính sách cho phép/từ chối theo kênh/nhóm, nhà cung cấp, sandbox và từng agent
vẫn có thể loại bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ hiệu lực.

**Mặc định:**

- **Model:** sub-agent gốc kế thừa từ bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng agent). Các lượt khởi tạo runtime ACP dùng cùng model sub-agent đã cấu hình khi có; nếu không, bộ khung ACP giữ mặc định riêng. `sessions_spawn.model` được chỉ định rõ ràng vẫn được ưu tiên.
- **Suy luận:** sub-agent gốc kế thừa từ bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng agent). Các lượt khởi tạo runtime ACP cũng áp dụng `agents.defaults.models["provider/model"].params.thinking` cho model đã chọn. `sessions_spawn.thinking` được chỉ định rõ ràng vẫn được ưu tiên.
- **Thời gian chờ của lượt chạy:** OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó chuyển sang `0` (không có thời gian chờ). `sessions_spawn` không chấp nhận ghi đè thời gian chờ theo từng lần gọi.
- **Vòng đời tiến trình:** một sub-agent OpenClaw tách rời có vòng đời lượt chạy riêng. Một tác vụ nền được tạo bên trong backend CLI bên ngoài thì khác: nó dùng chung tiến trình con CLI cha và dừng nếu tiến trình cha đó đạt `agents.defaults.timeoutSeconds`.
- **Phân phối tác vụ:** sub-agent gốc nhận tác vụ được ủy quyền trong thông báo `[Subagent Task]` hiển thị đầu tiên. Lời nhắc hệ thống của sub-agent chứa các quy tắc runtime và ngữ cảnh định tuyến, không chứa bản sao ẩn của tác vụ.

Các lượt khởi tạo sub-agent gốc được chấp nhận bao gồm siêu dữ liệu model con đã phân giải
trong kết quả công cụ: `resolvedModel` chứa tham chiếu model đã áp dụng và
`resolvedProvider` chứa tiền tố nhà cung cấp khi tham chiếu có tiền tố.

### Chế độ lời nhắc ủy quyền

`agents.defaults.subagents.delegationMode` chỉ kiểm soát hướng dẫn trong lời nhắc; nó không thay đổi chính sách công cụ hoặc bắt buộc ủy quyền.

- `suggest` (mặc định): giữ lời nhắc tiêu chuẩn khuyến khích dùng sub-agent cho công việc lớn hơn hoặc chậm hơn.
- `prefer`: yêu cầu agent chính duy trì khả năng phản hồi và ủy quyền bất kỳ việc gì phức tạp hơn một phản hồi trực tiếp thông qua `sessions_spawn`.

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
  Mô tả tác vụ dành cho sub-agent.
</ParamField>
<ParamField path="taskName" type="string">
  Định danh ổn định tùy chọn để xác định một tiến trình con cụ thể trong kết quả trạng thái sau này. Phải khớp với `[a-z][a-z0-9_-]{0,63}` và không được là mục tiêu dành riêng như `last` hoặc `all`.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn mà con người có thể đọc được.
</ParamField>
<ParamField path="agentId" type="string">
  Khởi tạo dưới một id agent đã cấu hình khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc tùy chọn cho tác vụ của lượt chạy tiến trình con. Các sub-agent gốc vẫn tải tệp khởi động từ không gian làm việc của agent đích; `cwd` chỉ thay đổi nơi các công cụ runtime và bộ khung CLI thực hiện công việc được ủy quyền.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các bộ khung ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode` hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ dành cho ACP. Tiếp tục một phiên bộ khung ACP hiện có khi `runtime: "acp"`; bị bỏ qua đối với các lượt khởi tạo sub-agent gốc.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ dành cho ACP. Truyền trực tiếp đầu ra lượt chạy ACP đến phiên cha khi `runtime: "acp"`; bỏ qua đối với các lượt khởi tạo sub-agent gốc.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình của sub-agent. Các giá trị không hợp lệ sẽ bị bỏ qua và sub-agent chạy trên mô hình mặc định, kèm cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức độ suy luận cho lượt chạy sub-agent. Không khả dụng với `visible: true`.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu liên kết luồng kênh cho phiên sub-agent này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và `mode` bị bỏ qua, giá trị mặc định sẽ trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
  Nếu liên kết luồng không khả dụng cho kênh của bên yêu cầu, hãy dùng `mode: "run"` thay thế.
  Với `visible: true`, hãy bỏ qua `mode`; các phiên hiển thị là phiên lâu dài và không hỗ trợ `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ phiên ngay sau khi thông báo (vẫn giữ bản ghi bằng cách đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối khởi tạo trừ khi runtime của tiến trình con đích được chạy trong sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` phân nhánh bản ghi hiện tại của bên yêu cầu sang phiên tiến trình con. Chỉ dành cho sub-agent gốc. Các lượt khởi tạo liên kết luồng mặc định là `fork`; các lượt khởi tạo không liên kết luồng mặc định là `isolated`. Một bản phân nhánh hiển thị phải nhắm đến cùng agent với bên yêu cầu.
</ParamField>
<ParamField path="visible" type="boolean" default="false">
  Tạo một phiên bảng điều khiển lâu dài mà người dùng có thể mở trong Control UI. Các lượt khởi tạo hiển thị chỉ hỗ trợ `runtime: "subagent"` và luôn giữ phiên đã tạo.
</ParamField>
<ParamField path="worktree" type="boolean" default="false">
  Cấp phát một git worktree được quản lý cho phiên bảng điều khiển mới. Yêu cầu `visible: true`.
</ParamField>
<ParamField path="worktreeName" type="string">
  Tên worktree được quản lý tùy chọn. Yêu cầu `visible: true` và `worktree: true`.
</ParamField>
<ParamField path="worktreeBaseRef" type="string">
  Git base ref tùy chọn cho worktree được quản lý. Yêu cầu `visible: true` và `worktree: true`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận các tham số phân phối qua kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Các sub-agent gốc báo cáo
lượt phản hồi trợ lý mới nhất về cho bên yêu cầu; việc phân phối bên ngoài vẫn do
agent cha/bên yêu cầu đảm nhiệm.
</Warning>

Với `visible: true`, `model`, `cwd` và một `context: "fork"` cùng agent đều được hỗ trợ. Một mục tiêu được chạy trong sandbox giới hạn `cwd` trong không gian làm việc của agent đó. Liên kết luồng, `mode`, ghi đè mức độ suy luận, `lightContext`, `attachments` và `attachAs` không khả dụng trên đường dẫn này vì các phiên hiển thị là phiên bảng điều khiển lâu dài được tạo thông qua `sessions.create`. Việc khởi tạo hiển thị bị từ chối khi chính bên yêu cầu được khởi tạo với danh sách công cụ cho phép hoặc từ chối kế thừa; hạn chế đó được cố định tại thời điểm khởi tạo và không có cấu hình ghi đè. Việc liệt kê và định địa chỉ phiên tuân theo `tools.sessions.visibility`; phạm vi `tree` mặc định bao gồm phiên hiện tại và cây con được khởi tạo của chính phiên đó. Xem [Worktree được quản lý](/vi/concepts/managed-worktrees) để biết hành vi đặt tên, thiết lập, dọn dẹp và khôi phục checkout.

### Tên tác vụ và lựa chọn mục tiêu

`taskName` là định danh dành cho mô hình để điều phối, không phải khóa phiên.
Hãy dùng định danh này cho các tên tiến trình con ổn định như `review_subagents`,
`linux_validation` hoặc `docs_update` khi một trình điều phối có thể cần kiểm tra
tiến trình con đó sau này.

Quá trình phân giải mục tiêu chấp nhận các kết quả khớp `taskName` chính xác và
các tiền tố không nhập nhằng. Việc so khớp được giới hạn trong cùng cửa sổ mục tiêu đang hoạt động/gần đây
được các mục tiêu `/subagents` đánh số sử dụng, vì vậy một tiến trình con cũ đã hoàn tất không làm
một định danh được tái sử dụng trở nên nhập nhằng. Nếu hai tiến trình con đang hoạt động hoặc gần đây có cùng
`taskName`, mục tiêu sẽ nhập nhằng; thay vào đó, hãy dùng chỉ mục danh sách, khóa phiên hoặc
id lượt chạy.

Các mục tiêu dành riêng `last` và `all` không phải là giá trị `taskName` hợp lệ
vì chúng đã mang ý nghĩa điều khiển.

## Công cụ: `sessions_yield`

Kết thúc lượt mô hình hiện tại và chờ các sự kiện runtime, chủ yếu là
sự kiện hoàn tất của sub-agent, xuất hiện dưới dạng thông báo tiếp theo. Hãy dùng công cụ này sau khi
khởi tạo công việc bắt buộc cho tiến trình con nếu bên yêu cầu không thể đưa ra câu trả lời cuối cùng
cho đến khi nhận được các kết quả hoàn tất đó.

`sessions_yield` là cơ chế chờ. Không thay thế nó bằng các vòng lặp thăm dò
qua `subagents`, `sessions_list`, `sessions_history`, `sleep` của shell
hoặc thăm dò tiến trình chỉ để phát hiện tiến trình con hoàn tất.

Chỉ dùng `sessions_yield` khi danh sách công cụ hiệu lực của phiên có chứa
công cụ này. Một số hồ sơ công cụ tối thiểu hoặc tùy chỉnh có thể cung cấp `sessions_spawn` và
`subagents` mà không cung cấp `sessions_yield`; trong trường hợp đó, không được tạo
vòng lặp thăm dò chỉ để chờ hoàn tất.

Khi có tiến trình con đang hoạt động, OpenClaw chèn một khối lời nhắc nhỏ gọn do runtime tạo
`Active Subagents` vào các lượt thông thường để bên yêu cầu có thể thấy
các phiên tiến trình con hiện tại, id lượt chạy, trạng thái, nhãn, tác vụ và
bí danh `taskName` mà không cần thăm dò. Các trường tác vụ và nhãn trong
khối đó được trích dẫn dưới dạng dữ liệu, không phải chỉ dẫn, vì chúng có thể bắt nguồn
từ các đối số khởi tạo do người dùng/mô hình cung cấp.

## Công cụ: `subagents`

Liệt kê các lượt chạy sub-agent đã khởi tạo và bản ghi tác vụ nền thuộc
cây phiên của bên yêu cầu. Các hàng tác vụ bao gồm sub-agent gốc, lượt chạy ACP,
công việc CLI/phương tiện của Gateway và các lượt thực thi cron. Phạm vi được giới hạn ở bên
yêu cầu hiện tại; một tiến trình con chỉ có thể thấy các tiến trình con do chính nó kiểm soát.

Dùng `subagents` để xem trạng thái và gỡ lỗi theo yêu cầu. Dùng `sessions_yield` để
chờ các sự kiện hoàn tất.

Dùng `action: "cancel"` với một `taskId` do `action: "list"` trả về để dừng
một tác vụ. Việc hủy được giới hạn trong cây phiên được kiểm soát; một
sub-agent lá không thể hủy công việc thuộc sở hữu của phiên khác.

## Phiên liên kết luồng

Khi liên kết luồng được bật cho một kênh, sub-agent có thể tiếp tục được liên kết
với một luồng để các thông báo tiếp theo của người dùng trong luồng đó tiếp tục được định tuyến đến
cùng phiên sub-agent.

### Các kênh hỗ trợ luồng

Một kênh hỗ trợ các phiên sub-agent lâu dài liên kết luồng
(`sessions_spawn` với `thread: true`) khi đăng ký một bộ điều hợp liên kết
cuộc trò chuyện. Các kênh tích hợp sẵn có hỗ trợ này: **Discord**,
**iMessage**, **Matrix** và **Telegram**. Discord và Matrix mặc định
tạo một luồng con; Telegram và iMessage mặc định liên kết với
cuộc trò chuyện hiện tại. Dùng các khóa cấu hình `threadBindings` riêng cho từng kênh để
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
    Các câu trả lời và thông báo tiếp theo trong luồng đó được định tuyến đến phiên đã liên kết.
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

| Lệnh            | Tác dụng                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Liên kết luồng hiện tại (hoặc tạo một luồng) với mục tiêu sub-agent/phiên                     |
| `/unfocus`         | Xóa liên kết cho luồng hiện đang được liên kết                                           |
| `/agents`          | Liệt kê các lượt chạy đang hoạt động và trạng thái liên kết (`binding:<id>`, `unbound` hoặc `bindings unavailable`) |
| `/session idle`    | Kiểm tra/cập nhật việc tự động bỏ tập trung khi nhàn rỗi (chỉ các luồng liên kết đang được tập trung)                             |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng liên kết đang được tập trung)                                      |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Các khóa ghi đè theo kênh và tự động liên kết khi khởi tạo** phụ thuộc vào từng bộ điều hợp. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết chi tiết hiện tại của bộ điều hợp.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách id agent đã cấu hình có thể được chọn làm mục tiêu thông qua `agentId` rõ ràng (`["*"]` cho phép mọi mục tiêu đã cấu hình). Mặc định: chỉ agent của bên yêu cầu. Nếu bạn đặt một danh sách và vẫn muốn bên yêu cầu khởi tạo chính nó bằng `agentId`, hãy đưa id của bên yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép agent đích đã cấu hình mặc định được dùng khi agent của bên yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng). Ghi đè theo từng agent: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Thời gian chờ cho mỗi lệnh gọi đối với các lần thử phân phối thông báo `agent` của Gateway. Giá trị là số mili giây nguyên dương và được giới hạn ở mức tối đa an toàn của bộ hẹn giờ trên nền tảng. Các lần thử lại do lỗi tạm thời có thể khiến tổng thời gian chờ thông báo dài hơn một thời gian chờ đã cấu hình.
</ParamField>

Nếu phiên của bên yêu cầu được chạy trong sandbox, `sessions_spawn` sẽ từ chối các mục tiêu
chạy ngoài sandbox.

### Khám phá

Sử dụng `agents_list` để xem những id agent nào hiện được phép cho
`sessions_spawn`. Phản hồi bao gồm model hiệu lực và siêu dữ liệu runtime
được nhúng của từng agent được liệt kê, để bên gọi có thể phân biệt OpenClaw, app-server
Codex và các runtime gốc đã cấu hình khác.

Các mục `allowAgents` phải trỏ đến các id agent đã cấu hình trong `agents.list[]`.
`["*"]` có nghĩa là mọi agent đích đã cấu hình cộng với bên yêu cầu. Nếu cấu hình
của một agent bị xóa nhưng id của agent đó vẫn còn trong `allowAgents`, `sessions_spawn` sẽ từ chối id đó
và `agents_list` sẽ bỏ qua id đó. Chạy `openclaw doctor --fix` để dọn dẹp
các mục cũ trong danh sách cho phép, hoặc thêm một mục `agents.list[]` tối thiểu khi agent đích
vẫn cần có thể được khởi tạo trong khi kế thừa các giá trị mặc định.

### Tự động lưu trữ

- Các phiên sub-agent được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Quá trình lưu trữ sử dụng `sessions.delete` và đổi tên bản ghi hội thoại thành `*.deleted.<timestamp>` (trong cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại bằng cách đổi tên).
- Tự động lưu trữ được thực hiện theo khả năng tốt nhất; các bộ hẹn giờ đang chờ sẽ bị mất nếu Gateway khởi động lại.
- Thời gian chờ chạy đã cấu hình **không** tự động lưu trữ; chúng chỉ dừng lượt chạy. Phiên vẫn tồn tại cho đến khi được tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các tab/tiến trình trình duyệt được theo dõi sẽ được đóng theo khả năng tốt nhất khi lượt chạy kết thúc, ngay cả khi bản ghi hội thoại/bản ghi phiên được giữ lại.

## Sub-agent lồng nhau

Theo mặc định, sub-agent không thể khởi tạo sub-agent riêng
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mô hình điều phối**: agent chính → sub-agent điều phối →
các sub-sub-agent thực thi.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1, range 1-5)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5, range 1-20)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Các mức độ sâu

| Độ sâu | Dạng khóa phiên                            | Vai trò                                          | Có thể khởi tạo?                   |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Agent chính                                    | Luôn luôn                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (agent điều phối khi cho phép độ sâu 2) | Chỉ khi `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (agent thực thi lá)                   | Không bao giờ                        |

### Chuỗi thông báo

Kết quả truyền ngược lên chuỗi:

1. Agent thực thi độ sâu 2 hoàn tất → thông báo cho agent cha (agent điều phối độ sâu 1).
2. Agent điều phối độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho agent chính.
3. Agent chính nhận thông báo và chuyển đến người dùng.

Mỗi cấp chỉ thấy thông báo từ các agent con trực tiếp của mình.

<Note>
**Hướng dẫn vận hành:** chỉ bắt đầu công việc của agent con một lần và chờ các sự kiện
hoàn tất thay vì xây dựng các vòng lặp thăm dò quanh `sessions_list`,
`sessions_history`, `/subagents list` hoặc các lệnh ngủ `exec`.
`sessions_list` và `/subagents list` giữ cho quan hệ giữa các phiên con
tập trung vào công việc đang diễn ra — các agent con đang hoạt động vẫn được gắn kết, các agent con đã kết thúc vẫn
hiển thị trong một khoảng thời gian gần đây ngắn, còn các liên kết agent con cũ chỉ tồn tại trong kho lưu trữ sẽ
bị bỏ qua sau cửa sổ độ mới của chúng. Điều này ngăn siêu dữ liệu `spawnedBy` /
`parentSessionKey` cũ làm các agent con ma xuất hiện trở lại sau khi
khởi động lại. Nếu sự kiện hoàn tất của agent con đến sau khi bạn đã gửi
câu trả lời cuối cùng, phản hồi tiếp theo chính xác là token im lặng
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi kiểm soát được ghi vào siêu dữ liệu phiên tại thời điểm khởi tạo. Điều này ngăn các khóa phiên phẳng hoặc đã khôi phục vô tình lấy lại đặc quyền của agent điều phối.
- **Độ sâu 1 (agent điều phối, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể khởi tạo agent con và kiểm tra trạng thái của chúng. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (agent lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (agent thực thi lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể khởi tạo thêm agent con.

### Giới hạn khởi tạo theo từng agent

Mỗi phiên agent (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) agent con đang hoạt động cùng lúc. Điều này ngăn một agent điều phối
mở rộng mất kiểm soát.

### Dừng lan truyền

Việc dừng một agent điều phối độ sâu 1 sẽ tự động dừng tất cả các agent con
độ sâu 2 của agent đó:

- `/stop` trong cuộc trò chuyện chính sẽ dừng tất cả agent độ sâu 1 và lan truyền việc dừng đến các agent con độ sâu 2 của chúng.

## Xác thực

Thông tin xác thực của sub-agent được phân giải theo **id agent**, không phải theo loại phiên:

- Khóa phiên của sub-agent là `agent:<agentId>:subagent:<uuid>`.
- Kho thông tin xác thực được tải từ `agentDir` của agent đó.
- Các hồ sơ xác thực của agent chính được hợp nhất dưới dạng **dự phòng**; hồ sơ của agent ghi đè hồ sơ chính khi có xung đột.

Việc hợp nhất mang tính bổ sung, vì vậy các hồ sơ chính luôn có sẵn làm
phương án dự phòng. Xác thực hoàn toàn cô lập theo từng agent hiện chưa được hỗ trợ.

## Thông báo

Sub-agent báo cáo lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên sub-agent (không phải phiên của bên yêu cầu).
- Nếu sub-agent phản hồi chính xác `ANNOUNCE_SKIP`, sẽ không có nội dung nào được đăng.
- Nếu văn bản mới nhất của trợ lý là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo sẽ bị chặn ngay cả khi trước đó đã có tiến trình hiển thị.

Cách chuyển giao phụ thuộc vào độ sâu của bên yêu cầu:

- Các phiên yêu cầu cấp cao nhất sử dụng một lệnh gọi `agent` tiếp theo với chuyển giao ra bên ngoài (`deliver=true`).
- Các phiên sub-agent yêu cầu lồng nhau nhận một lần chèn tiếp theo nội bộ (`deliver=false`) để agent điều phối có thể tổng hợp kết quả của agent con trong phiên.
- Nếu một phiên sub-agent yêu cầu lồng nhau không còn tồn tại, OpenClaw sẽ quay về bên yêu cầu của phiên đó khi có sẵn.

Đối với các phiên yêu cầu cấp cao nhất, việc chuyển giao trực tiếp ở chế độ hoàn tất trước tiên
phân giải mọi tuyến hội thoại/luồng đã liên kết và ghi đè hook, sau đó điền
các trường kênh-đích còn thiếu từ tuyến đã lưu của phiên yêu cầu.
Điều này giữ các nội dung hoàn tất trong đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn
hoàn tất chỉ xác định kênh.

Quá trình tổng hợp hoàn tất của agent con được giới hạn trong lượt chạy hiện tại của bên yêu cầu khi
xây dựng các kết quả hoàn tất lồng nhau, ngăn đầu ra của agent con từ lượt chạy cũ
rò rỉ vào thông báo hiện tại. Phản hồi thông báo giữ nguyên
tuyến luồng/chủ đề khi bộ điều hợp kênh cung cấp thông tin này.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường          | Nguồn                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Nguồn         | `subagent` hoặc `cron`                                                                                     |
| Id phiên    | Khóa/id phiên con                                                                                     |
| Loại           | Loại thông báo + nhãn tác vụ                                                                               |
| Trạng thái         | Được suy ra từ kết quả runtime (`ok`, `error`, `timeout` hoặc `unknown`) — **không** suy luận từ văn bản của model |
| Nội dung kết quả | Văn bản trợ lý hiển thị mới nhất từ agent con                                                             |
| Theo dõi      | Hướng dẫn mô tả khi nào cần phản hồi và khi nào cần giữ im lặng                                                      |

Các lượt chạy kết thúc với lỗi sẽ báo cáo trạng thái thất bại mà không phát lại
văn bản phản hồi đã ghi lại. Đầu ra tool/toolResult không được đưa lên thành văn bản kết quả của agent con.

### Dòng thống kê

Payload thông báo bao gồm một dòng thống kê ở cuối (ngay cả khi được bao bọc):

- Runtime (ví dụ: `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi đã cấu hình giá model (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` và đường dẫn bản ghi hội thoại để agent chính có thể truy xuất lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Siêu dữ liệu nội bộ chỉ dành cho việc điều phối; các phản hồi hướng đến người dùng
nên được viết lại bằng giọng điệu trợ lý thông thường.

### Tại sao nên ưu tiên `sessions_history`

`sessions_history` là đường dẫn điều phối an toàn hơn để đọc bản ghi hội thoại
của agent con từ bên trong một lượt agent:

- Che văn bản giống thông tin xác thực/token ngay cả khi tính năng che dữ liệu nhật ký đa dụng bị tắt.
- Cắt ngắn các khối văn bản dài (4000 ký tự mỗi khối) và loại bỏ chữ ký suy nghĩ, payload phát lại lập luận và dữ liệu hình ảnh nội tuyến.
- Áp dụng giới hạn phản hồi 80 KB; các hàng quá lớn được thay thế bằng `[sessions_history omitted: message too large]`.
- Sử dụng `nextOffset` khi có để phân trang ngược qua các cửa sổ bản ghi hội thoại cũ hơn.
- `sessions_history` **không** loại bỏ thẻ lập luận, khung `<relevant-memories>` hoặc XML lệnh gọi công cụ khỏi văn bản tin nhắn — nó trả về các khối nội dung có cấu trúc gần với dạng bản ghi hội thoại thô, chỉ được che dữ liệu và giới hạn kích thước. `/subagents log` áp dụng bộ làm sạch văn xuôi mạnh hơn (loại bỏ thẻ lập luận, khung bộ nhớ và XML lệnh gọi công cụ) vì nó kết xuất các dòng trò chuyện thuần túy thay vì các khối có cấu trúc.
- Kiểm tra bản ghi hội thoại thô trên đĩa là phương án dự phòng khi bạn cần bản ghi đầy đủ giống từng byte.

## Chính sách công cụ

Trước tiên, sub-agent sử dụng cùng hồ sơ và pipeline chính sách công cụ như agent cha hoặc
agent đích. Sau đó, OpenClaw áp dụng lớp hạn chế
sub-agent.

Sub-agent luôn mất `gateway`, `agents_list`, `session_status` và
`cron` bất kể độ sâu hay vai trò (các công cụ cấp hệ thống/tương tác hoặc
các công cụ mà agent chính nên điều phối). Các sub-agent lá (hành vi độ sâu 1
mặc định và luôn áp dụng ở độ sâu 2) còn mất thêm `subagents`,
`sessions_list`, `sessions_history` và `sessions_spawn`. Sub-agent không bao giờ
nhận công cụ `message` — công cụ này bị tắt tại thời điểm khởi tạo, không phải được lọc bởi
danh sách từ chối này — và `sessions_send` vẫn bị từ chối để sub-agent
chỉ giao tiếp qua chuỗi thông báo.

`sessions_history` ở đây cũng vẫn là một chế độ xem truy hồi được giới hạn và làm sạch —
không phải bản kết xuất bản ghi hội thoại thô.

Khi `maxSpawnDepth >= 2`, các sub-agent điều phối độ sâu 1 còn
nhận thêm `sessions_spawn`, `subagents`, `sessions_list` và
`sessions_history` để có thể quản lý các agent con.

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

`tools.subagents.tools.allow` là bộ lọc cuối cùng chỉ cho phép. Nó có thể thu hẹp
tập hợp công cụ đã được phân giải, nhưng không thể **thêm lại** công cụ đã bị
`tools.profile` loại bỏ. Ví dụ: `tools.profile: "coding"` bao gồm
`web_search`/`web_fetch` nhưng không bao gồm công cụ `browser`. Để cho phép
các tác tử con có hồ sơ lập trình sử dụng tự động hóa trình duyệt, hãy thêm browser ở
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
tác tử cần được cấp quyền tự động hóa trình duyệt.

## Đồng thời

Các tác tử con sử dụng một làn hàng đợi chuyên dụng trong tiến trình:

- **Tên làn:** `subagent`
- **Mức đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Tính hoạt động và khôi phục

OpenClaw không xem việc thiếu `endedAt` là bằng chứng vĩnh viễn cho thấy một
tác tử con vẫn còn hoạt động. Các lượt chạy chưa kết thúc lâu hơn khoảng thời gian chạy cũ
(2 giờ, hoặc thời gian chờ chạy đã cấu hình cộng thêm một khoảng gia hạn ngắn,
tùy giá trị nào dài hơn) sẽ không còn được tính là đang hoạt động/đang chờ trong `/subagents list`,
bản tóm tắt trạng thái, cơ chế chặn hoàn tất của tác tử hậu duệ và các phép kiểm tra
mức đồng thời theo phiên.

Sau khi Gateway khởi động lại, các lượt chạy cũ chưa kết thúc được khôi phục sẽ bị loại bỏ trừ khi
phiên con của chúng được đánh dấu `abortedLastRun: true`. Các lượt chạy bị hủy do
khởi động lại vẫn được đăng ký cho luồng khôi phục tác tử con mồ côi: các lượt chạy cũ
được hoàn tất mà không tiếp tục, còn các phiên con mới nhận được
một thông báo tiếp tục tổng hợp trước khi dấu hiệu bị hủy được xóa.

Việc tự động khôi phục sau khi khởi động lại được giới hạn theo từng phiên con. Nếu cùng một
tác tử con được chấp nhận để khôi phục mồ côi nhiều lần trong
khoảng thời gian nhanh chóng bị kẹt lại, OpenClaw sẽ lưu một dấu mộ khôi phục trên
phiên đó và ngừng tự động tiếp tục phiên này trong các lần khởi động lại sau. Chạy
`openclaw tasks maintenance --apply` để đối soát bản ghi tác vụ, hoặc
`openclaw doctor --fix` để xóa các cờ khôi phục bị hủy đã cũ trên
các phiên có dấu mộ.

<Note>
Nếu việc tạo tác tử con thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra bên gọi RPC trước khi chỉnh sửa trạng thái ghép nối.
Các lượt điều phối phối hợp `sessions_spawn` nội bộ được thực hiện trong tiến trình khi
bên gọi đã chạy bên trong ngữ cảnh yêu cầu Gateway, nên chúng không
mở WebSocket loopback hoặc phụ thuộc vào đường cơ sở phạm vi thiết bị đã ghép nối
của CLI. Các bên gọi bên ngoài tiến trình Gateway vẫn sử dụng phương án dự phòng
WebSocket dưới dạng `client.id: "gateway-client"` với `client.mode: "backend"`
qua xác thực bằng mật khẩu/token dùng chung loopback trực tiếp. Các bên gọi từ xa, `deviceIdentity`
tường minh, các đường dẫn token thiết bị tường minh và các máy khách trình duyệt/node
vẫn cần phê duyệt thiết bị thông thường để nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện yêu cầu sẽ hủy phiên yêu cầu và dừng mọi lượt chạy tác tử con đang hoạt động được tạo từ phiên đó, đồng thời lan truyền đến các tác tử con lồng nhau.

## Hạn chế

- Thông báo của tác tử con là **nỗ lực tối đa**. Nếu Gateway khởi động lại, công việc "thông báo lại" đang chờ sẽ bị mất.
- Các tác tử con vẫn dùng chung tài nguyên của cùng một tiến trình Gateway; hãy xem `maxConcurrent` là một van an toàn.
- `sessions_spawn` luôn không chặn: nó trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác tử con chỉ chèn `AGENTS.md` và `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` hoặc `BOOTSTRAP.md`). Các tác tử con gốc Codex tuân theo cùng ranh giới: `TOOLS.md` vẫn nằm trong các chỉ dẫn luồng Codex được kế thừa, còn các tệp nhân dạng, danh tính và người dùng chỉ dành cho tác tử cha được chèn dưới dạng chỉ dẫn cộng tác theo phạm vi lượt để tác tử con không sao chép chúng.
- Độ sâu lồng tối đa là 5 (phạm vi `maxSpawnDepth`: 1-5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số tác tử con đang hoạt động trên mỗi phiên (mặc định `5`, phạm vi `1-20`).

## Liên quan

- [Công cụ phiên và thay đổi trạng thái](/vi/concepts/session-tool)
- [Tác tử ACP](/vi/tools/acp-agents)
- [Gửi tác tử](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác tử](/vi/tools/multi-agent-sandbox-tools)
