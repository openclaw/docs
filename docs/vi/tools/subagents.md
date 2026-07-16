---
read_when:
    - Bạn muốn thực hiện công việc nền hoặc song song thông qua agent
    - Bạn đang thay đổi chính sách công cụ sessions_spawn hoặc tác tử con
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên tác nhân phụ được liên kết với luồng hội thoại
sidebarTitle: Sub-agents
summary: Khởi chạy các lượt chạy tác nhân nền biệt lập để thông báo kết quả trở lại cuộc trò chuyện của người yêu cầu
title: Tác nhân phụ
x-i18n:
    generated_at: "2026-07-16T15:15:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8c670d5c7f92d5be8ebce7b1140d9bfd7956b10f38144d275ec84c6af98ae04b
    source_path: tools/subagents.md
    workflow: 16
---

Các tác tử phụ là các lượt chạy tác tử nền được tạo từ một lượt chạy tác tử hiện có.
Mỗi tác tử chạy trong phiên riêng của mình (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, sẽ **thông báo** kết quả trở lại kênh trò chuyện của bên yêu cầu.
Mọi lượt chạy tác tử phụ đều được theo dõi dưới dạng [tác vụ nền](/vi/automation/tasks).

Mục tiêu:

- Song song hóa việc nghiên cứu, các tác vụ dài và công việc công cụ chậm mà không chặn lượt chạy chính.
- Mặc định giữ các tác tử phụ biệt lập (tách biệt phiên, tùy chọn hộp cát).
- Giữ bề mặt công cụ khó bị sử dụng sai: theo mặc định, các tác tử phụ **không** có công cụ phiên hoặc nhắn tin.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu điều phối.

<Note>
**Lưu ý về chi phí:** theo mặc định, mỗi tác tử phụ có ngữ cảnh và mức sử dụng token
riêng. Đối với các tác vụ nặng hoặc lặp lại, hãy đặt một mô hình rẻ hơn cho các tác tử phụ
và giữ tác tử chính trên một mô hình chất lượng cao hơn thông qua
`agents.defaults.subagents.model` hoặc các ghi đè theo từng tác tử. Khi một tác tử con
thực sự cần bản chép lời hiện tại của bên yêu cầu, hãy tạo nó với
`context: "fork"`. Các phiên tác tử phụ gắn với luồng mặc định dùng
`context: "fork"` vì chúng phân nhánh cuộc hội thoại hiện tại thành một
luồng tiếp nối.
</Note>

## Lệnh gạch chéo

`/subagents` kiểm tra các lượt chạy tác tử phụ cho **phiên hiện tại**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` hiển thị siêu dữ liệu lượt chạy (trạng thái, dấu thời gian, id phiên,
đường dẫn bản chép lời, dọn dẹp). `/subagents log` in các lượt trò chuyện gần đây của một
lượt chạy; thêm token `tools` để bao gồm các thông báo gọi công cụ/kết quả (bị lược bỏ
theo mặc định). Dùng `sessions_history` để có chế độ xem truy hồi có giới hạn và được lọc an toàn
từ bên trong một lượt tác tử, hoặc kiểm tra đường dẫn bản chép lời trên đĩa để xem
toàn bộ bản chép lời thô.

Trong Giao diện điều khiển, các phiên cha có lượt chạy con gần đây sẽ có một hàng
thanh bên có thể mở rộng. Các hàng lồng nhau hiển thị trạng thái và thời gian chạy của tác tử con, và việc chọn một hàng
sẽ mở cuộc trò chuyện của tác tử con đó trong khi vẫn giữ nguyên hệ thống phân cấp cha.

### Các điều khiển liên kết luồng

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

Các tác tử khởi chạy tác tử phụ nền bằng công cụ `sessions_spawn`.
Kết quả hoàn tất được trả về dưới dạng sự kiện nội bộ của phiên cha; tác tử
cha/bên yêu cầu quyết định có cần cập nhật hiển thị cho người dùng hay không.

<AccordionGroup>
  <Accordion title="Hoàn tất dựa trên đẩy, không chặn">
    - `sessions_spawn` không chặn; nó trả về id lượt chạy ngay lập tức.
    - Khi hoàn tất, tác tử phụ báo cáo lại cho phiên cha/bên yêu cầu.
    - Các lượt tác tử cần kết quả từ tác tử con nên gọi `sessions_yield` sau khi tạo công việc cần thiết. Thao tác này kết thúc lượt hiện tại và cho phép sự kiện hoàn tất xuất hiện dưới dạng thông báo tiếp theo mà mô hình có thể nhìn thấy.
    - Việc hoàn tất dựa trên cơ chế đẩy. Sau khi tạo, **không** thăm dò `/subagents list`, `sessions_list` hoặc `sessions_history` trong vòng lặp chỉ để chờ nó hoàn tất; chỉ kiểm tra trạng thái theo yêu cầu khi gỡ lỗi.
    - Đầu ra của tác tử con là báo cáo/bằng chứng để tác tử của bên yêu cầu tổng hợp. Đây không phải văn bản chỉ dẫn do người dùng soạn và không thể ghi đè chính sách hệ thống, nhà phát triển hoặc người dùng.
    - Khi hoàn tất, OpenClaw cố gắng tối đa để đóng các thẻ trình duyệt/tiến trình được theo dõi mà phiên tác tử phụ đó đã mở trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Chuyển giao kết quả hoàn tất">
    - OpenClaw chuyển kết quả hoàn tất trở lại phiên của bên yêu cầu thông qua một lượt `agent` với khóa lũy đẳng ổn định.
    - Nếu lượt chạy của bên yêu cầu vẫn đang hoạt động, trước tiên OpenClaw sẽ cố đánh thức/điều hướng lượt chạy đó thay vì bắt đầu một đường dẫn phản hồi hiển thị thứ hai.
    - Nếu không thể đánh thức bên yêu cầu đang hoạt động, OpenClaw sẽ chuyển sang bàn giao cho tác tử của bên yêu cầu với cùng ngữ cảnh hoàn tất thay vì bỏ thông báo.
    - Việc bàn giao cho tác tử cha thành công sẽ hoàn tất quá trình chuyển giao của tác tử phụ ngay cả khi tác tử cha quyết định không cần cập nhật hiển thị cho người dùng.
    - Các tác tử phụ gốc không có công cụ nhắn tin. Chúng trả về văn bản thuần của trợ lý cho tác tử cha/bên yêu cầu; các phản hồi hiển thị cho con người vẫn do chính sách chuyển giao thông thường của tác tử cha/bên yêu cầu quản lý.
    - Nếu không thể bàn giao trực tiếp, quá trình chuyển giao sẽ chuyển sang định tuyến qua hàng đợi, sau đó thử lại thông báo với cơ chế lùi theo cấp số nhân ngắn trước khi từ bỏ hoàn toàn.
    - Quá trình chuyển giao giữ nguyên tuyến đã phân giải của bên yêu cầu: các tuyến hoàn tất gắn với luồng hoặc gắn với cuộc hội thoại được ưu tiên khi có sẵn. Nếu nguồn hoàn tất chỉ cung cấp một kênh, OpenClaw điền đích/tài khoản còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để việc chuyển giao trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Siêu dữ liệu bàn giao kết quả hoàn tất">
    Việc bàn giao kết quả hoàn tất cho phiên của bên yêu cầu là ngữ cảnh nội bộ
    được tạo khi chạy (không phải văn bản do người dùng soạn) và bao gồm:

    - `Result` — văn bản phản hồi `assistant` hiển thị mới nhất từ tác tử con. Đầu ra tool/toolResult không được đưa vào kết quả của tác tử con. Các lượt chạy thất bại ở trạng thái kết thúc không tái sử dụng văn bản phản hồi đã ghi lại.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Số liệu thống kê gọn về thời gian chạy/token.
    - Chỉ dẫn xem xét yêu cầu tác tử của bên yêu cầu xác minh kết quả trước khi quyết định tác vụ ban đầu đã hoàn thành hay chưa.
    - Hướng dẫn tiếp theo yêu cầu tác tử của bên yêu cầu tiếp tục tác vụ hoặc ghi lại công việc tiếp nối khi kết quả của tác tử con vẫn còn hành động cần thực hiện.
    - Chỉ dẫn cập nhật cuối cùng cho trường hợp không còn hành động nào, được viết bằng giọng trợ lý thông thường mà không chuyển tiếp siêu dữ liệu nội bộ thô.

  </Accordion>
  <Accordion title="Chế độ và môi trường chạy ACP">
    - `--model` và `--thinking` ghi đè các giá trị mặc định cho lượt chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - Đối với các phiên lâu dài gắn với luồng, dùng `sessions_spawn` cùng `thread: true` và `mode: "session"`.
    - Nếu kênh của bên yêu cầu không hỗ trợ liên kết luồng, dùng `mode: "run"` thay vì thử lại một tổ hợp gắn với luồng không thể thực hiện.
    - Đối với các phiên bộ kiểm thử ACP (Claude Code, Gemini CLI, OpenCode hoặc Codex ACP/acpx tường minh), dùng `sessions_spawn` cùng `runtime: "acp"` khi công cụ công bố môi trường chạy đó. Xem [mô hình chuyển giao ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi quá trình hoàn tất hoặc vòng lặp giữa các tác tử. Khi Plugin `codex` được bật, việc điều khiển cuộc trò chuyện/luồng Codex nên ưu tiên `/codex ...` hơn ACP, trừ khi người dùng yêu cầu rõ ràng ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không ở trong hộp cát và một Plugin phần phụ trợ như `acpx` được tải. `runtime: "acp"` yêu cầu một id bộ kiểm thử ACP bên ngoài hoặc một mục `agents.list[]` có `runtime.type="acp"`; dùng môi trường chạy tác tử phụ mặc định cho các tác tử cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Các chế độ ngữ cảnh

Các tác tử phụ gốc khởi chạy biệt lập, trừ khi bên gọi yêu cầu rõ ràng phân nhánh
bản chép lời hiện tại.

| Chế độ       | Khi nào nên dùng                                                                                                                         | Hành vi                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm hoặc bất kỳ việc gì có thể mô tả trong văn bản tác vụ                           | Tạo một bản chép lời tác tử con sạch. Đây là mặc định và giúp giảm mức sử dụng token.  |
| `fork`     | Công việc phụ thuộc vào cuộc hội thoại hiện tại, kết quả công cụ trước đó hoặc các chỉ dẫn tinh tế đã có trong bản chép lời của bên yêu cầu | Phân nhánh bản chép lời của bên yêu cầu vào phiên tác tử con trước khi tác tử con khởi chạy. |

Chỉ dùng `fork` khi cần thiết. Nó dành cho việc ủy quyền nhạy cảm với ngữ cảnh, không phải
để thay thế việc viết một lời nhắc tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Bắt đầu một lượt chạy tác tử phụ bằng `deliver: false` trên làn `subagent` toàn cục,
sau đó chạy một bước thông báo và đăng phản hồi thông báo lên kênh trò chuyện
của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ có hiệu lực của bên gọi. Hồ sơ tích hợp sẵn
`coding` bao gồm `sessions_spawn`; `messaging` và `minimal` thì
không. `full` cho phép mọi công cụ. Thêm `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`, hoặc dùng `tools.profile: "coding"`, cho
các tác tử có hồ sơ hạn chế hơn nhưng vẫn cần ủy quyền công việc.
Các chính sách cho phép/từ chối theo kênh/nhóm, nhà cung cấp, hộp cát và từng tác tử
vẫn có thể loại bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ có hiệu lực.

**Mặc định:**

- **Mô hình:** các tác tử phụ gốc kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng tác tử). Các lượt tạo trong môi trường chạy ACP dùng cùng mô hình tác tử phụ đã cấu hình khi có; nếu không, bộ kiểm thử ACP giữ nguyên mặc định của nó. Một `sessions_spawn.model` tường minh vẫn được ưu tiên.
- **Suy luận:** các tác tử phụ gốc kế thừa bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng tác tử). Các lượt tạo trong môi trường chạy ACP cũng áp dụng `agents.defaults.models["provider/model"].params.thinking` cho mô hình đã chọn. Một `sessions_spawn.thinking` tường minh vẫn được ưu tiên.
- **Thời gian chờ lượt chạy:** OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó quay về `0` (không có thời gian chờ). `sessions_spawn` không chấp nhận ghi đè thời gian chờ theo từng lần gọi.
- **Chuyển giao tác vụ:** các tác tử phụ gốc nhận tác vụ được ủy quyền trong thông báo `[Subagent Task]` hiển thị đầu tiên của chúng. Lời nhắc hệ thống của tác tử phụ chứa các quy tắc thời gian chạy và ngữ cảnh định tuyến, không chứa bản sao ẩn của tác vụ.

Các lượt tạo tác tử phụ gốc được chấp nhận bao gồm siêu dữ liệu mô hình tác tử con đã phân giải
trong kết quả công cụ: `resolvedModel` chứa tham chiếu mô hình đã áp dụng và
`resolvedProvider` chứa tiền tố nhà cung cấp khi tham chiếu có tiền tố.

### Chế độ lời nhắc ủy quyền

`agents.defaults.subagents.delegationMode` chỉ kiểm soát hướng dẫn lời nhắc; nó không thay đổi chính sách công cụ hoặc bắt buộc ủy quyền.

- `suggest` (mặc định): giữ nguyên lời nhắc tiêu chuẩn khuyến khích dùng tác tử phụ cho công việc lớn hơn hoặc chậm hơn.
- `prefer`: yêu cầu tác tử chính duy trì khả năng phản hồi và ủy quyền mọi việc phức tạp hơn một phản hồi trực tiếp thông qua `sessions_spawn`.

Ghi đè theo từng tác tử: `agents.list[].subagents.delegationMode`.

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
  Mô tả tác vụ cho sub-agent.
</ParamField>
<ParamField path="taskName" type="string">
  Định danh ổn định tùy chọn để xác định một tiến trình con cụ thể trong đầu ra trạng thái sau này. Phải khớp với `[a-z][a-z0-9_-]{0,63}` và không được là mục tiêu dành riêng như `last` hoặc `all`.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn mà con người có thể đọc được.
</ParamField>
<ParamField path="agentId" type="string">
  Khởi tạo dưới một id agent đã cấu hình khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc tùy chọn của tác vụ cho lượt chạy tiến trình con. Các sub-agent gốc vẫn tải tệp khởi động từ không gian làm việc của agent đích; `cwd` chỉ thay đổi nơi các công cụ thời gian chạy và bộ khung CLI thực hiện công việc được ủy quyền.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các bộ khung ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode` hoặc Codex ACP/acpx được yêu cầu rõ ràng) và cho các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ dành cho ACP. Tiếp tục một phiên bộ khung ACP hiện có khi `runtime: "acp"`; bị bỏ qua đối với các lần khởi tạo sub-agent gốc.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ dành cho ACP. Truyền trực tiếp đầu ra lượt chạy ACP đến phiên cha khi `runtime: "acp"`; bỏ qua đối với các lần khởi tạo sub-agent gốc.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình của sub-agent. Các giá trị không hợp lệ sẽ bị bỏ qua và sub-agent chạy trên mô hình mặc định, kèm cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức độ suy luận cho lượt chạy sub-agent.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi `true`, yêu cầu liên kết luồng kênh cho phiên sub-agent này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, giá trị mặc định trở thành `session`. `mode: "session"` yêu cầu `thread: true`.
  Nếu liên kết luồng không khả dụng cho kênh yêu cầu, hãy dùng `mode: "run"` thay thế.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ phiên ngay sau khi thông báo (vẫn giữ bản ghi bằng cách đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối khởi tạo trừ khi thời gian chạy của tiến trình con đích được cô lập trong sandbox.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` phân nhánh bản ghi hiện tại của bên yêu cầu vào phiên con. Chỉ dành cho các sub-agent gốc. Các lần khởi tạo liên kết với luồng mặc định là `fork`; các lần khởi tạo không liên kết với luồng mặc định là `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận các tham số phân phối qua kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Các sub-agent gốc báo cáo
lượt phản hồi mới nhất của trợ lý về cho bên yêu cầu; việc phân phối ra bên ngoài vẫn thuộc về
agent cha/bên yêu cầu.
</Warning>

### Tên tác vụ và nhắm mục tiêu

`taskName` là một định danh phục vụ điều phối dành cho mô hình, không phải khóa phiên.
Dùng định danh này cho các tên tiến trình con ổn định như `review_subagents`,
`linux_validation` hoặc `docs_update` khi điều phối viên có thể cần kiểm tra
tiến trình con đó sau này.

Việc phân giải mục tiêu chấp nhận các kết quả khớp chính xác với `taskName` và các
tiền tố không nhập nhằng. Phạm vi đối sánh được giới hạn trong cùng cửa sổ mục tiêu đang hoạt động/gần đây
được dùng bởi các mục tiêu `/subagents` được đánh số, vì vậy một tiến trình con cũ đã hoàn tất không khiến
một định danh được tái sử dụng trở nên nhập nhằng. Nếu hai tiến trình con đang hoạt động hoặc gần đây dùng chung
`taskName`, mục tiêu sẽ nhập nhằng; hãy dùng chỉ mục danh sách, khóa phiên hoặc
id lượt chạy thay thế.

Các mục tiêu dành riêng `last` và `all` không phải là giá trị `taskName` hợp lệ
vì chúng đã mang ý nghĩa điều khiển.

## Công cụ: `sessions_yield`

Kết thúc lượt mô hình hiện tại và chờ các sự kiện thời gian chạy, chủ yếu là
các sự kiện hoàn tất của sub-agent, đến dưới dạng thông báo tiếp theo. Dùng công cụ này sau khi
khởi tạo công việc con bắt buộc khi bên yêu cầu chưa thể đưa ra câu trả lời cuối cùng
cho đến khi nhận được các kết quả hoàn tất đó.

`sessions_yield` là cơ chế chờ. Không thay thế nó bằng các vòng lặp thăm dò
qua `subagents`, `sessions_list`, `sessions_history`, `sleep` của shell
hoặc thăm dò tiến trình chỉ để phát hiện tiến trình con hoàn tất.

Chỉ dùng `sessions_yield` khi danh sách công cụ có hiệu lực của phiên bao gồm
công cụ này. Một số hồ sơ công cụ tối giản hoặc tùy chỉnh có thể cung cấp `sessions_spawn` và
`subagents` mà không cung cấp `sessions_yield`; trong trường hợp đó, không tự tạo
vòng lặp thăm dò chỉ để chờ hoàn tất.

Khi có các tiến trình con đang hoạt động, OpenClaw chèn một khối lời nhắc nhỏ gọn do thời gian chạy tạo,
`Active Subagents`, vào các lượt thông thường để bên yêu cầu có thể thấy
các phiên con hiện tại, id lượt chạy, trạng thái, nhãn, tác vụ và
bí danh `taskName` mà không cần thăm dò. Các trường tác vụ và nhãn trong khối đó
được trích dẫn dưới dạng dữ liệu, không phải chỉ thị, vì chúng có thể bắt nguồn
từ các đối số khởi tạo do người dùng/mô hình cung cấp.

## Công cụ: `subagents`

Liệt kê các lượt chạy sub-agent do phiên yêu cầu sở hữu. Phạm vi được giới hạn
ở bên yêu cầu hiện tại; một tiến trình con chỉ có thể thấy các tiến trình con do chính nó kiểm soát.

Dùng `subagents` để xem trạng thái và gỡ lỗi theo yêu cầu. Dùng `sessions_yield` để
chờ các sự kiện hoàn tất.

## Phiên liên kết với luồng

Khi liên kết luồng được bật cho một kênh, sub-agent có thể duy trì liên kết
với một luồng để các thông báo tiếp theo của người dùng trong luồng đó tiếp tục được định tuyến đến
cùng phiên sub-agent.

### Các kênh hỗ trợ luồng

Một kênh hỗ trợ các phiên sub-agent liên kết lâu dài với luồng
(`sessions_spawn` với `thread: true`) khi đăng ký bộ điều hợp liên kết cuộc hội thoại.
Các kênh tích hợp sẵn có hỗ trợ này: **Discord**,
**iMessage**, **Matrix** và **Telegram**. Discord và Matrix mặc định
tạo một luồng con; Telegram và iMessage mặc định liên kết với
cuộc hội thoại hiện tại. Dùng các khóa cấu hình `threadBindings` riêng cho từng kênh để
bật tính năng, đặt thời gian chờ và `spawnSessions`.

### Quy trình nhanh

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
  <Step title="Ngắt liên kết">
    Dùng `/unfocus` để ngắt liên kết theo cách thủ công.
  </Step>
</Steps>

### Điều khiển thủ công

| Lệnh               | Tác dụng                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Liên kết luồng hiện tại (hoặc tạo một luồng) với mục tiêu sub-agent/phiên                  |
| `/unfocus`         | Xóa liên kết của luồng hiện đang được liên kết                                             |
| `/agents`          | Liệt kê các lượt chạy đang hoạt động và trạng thái liên kết (`binding:<id>`, `unbound` hoặc `bindings unavailable`) |
| `/session idle`    | Kiểm tra/cập nhật việc tự động bỏ tập trung khi không hoạt động (chỉ các luồng liên kết đang được tập trung) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng liên kết đang được tập trung)               |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Các khóa ghi đè theo kênh và tự động liên kết khi khởi tạo** phụ thuộc vào từng bộ điều hợp. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết chi tiết hiện tại về bộ điều hợp.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách các id agent đã cấu hình có thể được nhắm mục tiêu qua `agentId` rõ ràng (`["*"]` cho phép mọi mục tiêu đã cấu hình). Mặc định: chỉ agent yêu cầu. Nếu bạn thiết lập một danh sách và vẫn muốn bên yêu cầu tự khởi tạo chính nó bằng `agentId`, hãy thêm id của bên yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép mặc định của các agent đích đã cấu hình, được dùng khi agent yêu cầu không thiết lập `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng). Ghi đè theo từng agent: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Thời gian chờ cho mỗi lệnh gọi đối với các lần thử phân phối thông báo `agent` của Gateway. Giá trị là số nguyên mili giây dương và được giới hạn ở mức tối đa an toàn của bộ hẹn giờ trên nền tảng. Các lần thử lại tạm thời có thể khiến tổng thời gian chờ thông báo dài hơn một khoảng thời gian chờ đã cấu hình.
</ParamField>

Nếu phiên yêu cầu được cô lập trong sandbox, `sessions_spawn` sẽ từ chối các mục tiêu
chạy ngoài sandbox.

### Khám phá

Dùng `agents_list` để xem những id agent nào hiện được phép cho
`sessions_spawn`. Phản hồi bao gồm mô hình có hiệu lực và siêu dữ liệu thời gian chạy nhúng
của từng agent được liệt kê để bên gọi có thể phân biệt OpenClaw, app-server Codex
và các thời gian chạy gốc đã cấu hình khác.

Các mục `allowAgents` phải trỏ đến những id agent đã cấu hình trong `agents.list[]`.
`["*"]` có nghĩa là mọi agent đích đã cấu hình cộng với bên yêu cầu. Nếu một cấu hình agent
bị xóa nhưng id của nó vẫn còn trong `allowAgents`, `sessions_spawn` sẽ từ chối id đó
và `agents_list` sẽ bỏ qua nó. Chạy `openclaw doctor --fix` để dọn dẹp các mục
danh sách cho phép đã lỗi thời, hoặc thêm một mục `agents.list[]` tối giản khi mục tiêu cần
tiếp tục có thể được khởi tạo trong khi kế thừa các giá trị mặc định.

### Tự động lưu trữ

- Các phiên sub-agent được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Quá trình lưu trữ dùng `sessions.delete` và đổi tên bản ghi thành `*.deleted.<timestamp>` (cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi bằng cách đổi tên).
- Tự động lưu trữ được thực hiện theo khả năng tối đa; các bộ hẹn giờ đang chờ sẽ bị mất nếu Gateway khởi động lại.
- Thời gian chờ lượt chạy đã cấu hình **không** tự động lưu trữ; chúng chỉ dừng lượt chạy. Phiên vẫn tồn tại cho đến khi được tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên độ sâu 1 và độ sâu 2.
- Việc dọn dẹp trình duyệt tách biệt với việc dọn dẹp lưu trữ: các tab/tiến trình trình duyệt được theo dõi sẽ được đóng theo khả năng tối đa khi lượt chạy kết thúc, ngay cả khi bản ghi phiên/bản ghi hội thoại được giữ lại.

## Sub-agent lồng nhau

Theo mặc định, các sub-agent không thể khởi tạo sub-agent của riêng mình
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu điều phối viên**: chính → sub-agent điều phối viên →
các sub-sub-agent thực thi.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // cho phép sub-agent khởi tạo tiến trình con (mặc định: 1, phạm vi 1-5)
        maxChildrenPerAgent: 5, // số tiến trình con đang hoạt động tối đa trên mỗi phiên agent (mặc định: 5, phạm vi 1-20)
        maxConcurrent: 8, // giới hạn làn đồng thời toàn cục (mặc định: 8)
        runTimeoutSeconds: 900, // thời gian chờ mặc định cho sessions_spawn (0 = không có thời gian chờ)
        announceTimeoutMs: 120000, // thời gian chờ thông báo Gateway cho mỗi lệnh gọi
      },
    },
  },
}
```

### Các cấp độ sâu

| Độ sâu | Dạng khóa phiên                               | Vai trò                                                 | Có thể tạo tác tử con?              |
| ------ | -------------------------------------------- | ------------------------------------------------------- | ----------------------------------- |
| 0      | `agent:<id>:main`                           | Tác tử chính                                            | Luôn luôn                           |
| 1      | `agent:<id>:subagent:<uuid>`                           | Tác tử con (điều phối viên khi cho phép độ sâu 2)       | Chỉ khi `maxSpawnDepth >= 2`          |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>`                           | Tác tử con cấp hai (tác tử thực thi đầu cuối)           | Không bao giờ                       |

### Chuỗi thông báo

Kết quả truyền ngược lên theo chuỗi:

1. Tác tử thực thi ở độ sâu 2 hoàn tất → thông báo cho tác tử cha (điều phối viên ở độ sâu 1).
2. Điều phối viên ở độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho tác tử chính.
3. Tác tử chính nhận thông báo và chuyển đến người dùng.

Mỗi cấp chỉ thấy thông báo từ các tác tử con trực tiếp của mình.

<Note>
**Hướng dẫn vận hành:** chỉ khởi chạy công việc của tác tử con một lần và chờ các sự kiện hoàn tất
thay vì xây dựng vòng lặp thăm dò quanh `sessions_list`,
`sessions_history`, `/subagents list` hoặc các lệnh ngủ `exec`.
`sessions_list` và `/subagents list` giữ cho quan hệ phiên con
tập trung vào công việc đang diễn ra — tác tử con đang hoạt động vẫn được gắn kết, tác tử con đã kết thúc vẫn
hiển thị trong một khoảng thời gian ngắn gần đây, còn các liên kết tác tử con cũ chỉ tồn tại trong kho lưu trữ
sẽ bị bỏ qua sau khoảng thời gian còn mới. Điều này ngăn siêu dữ liệu `spawnedBy` /
`parentSessionKey` cũ làm các tác tử con ma xuất hiện lại sau khi
khởi động lại. Nếu sự kiện hoàn tất của tác tử con đến sau khi bạn đã gửi
câu trả lời cuối cùng, phản hồi tiếp theo đúng là token im lặng chính xác
`NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi kiểm soát được ghi vào siêu dữ liệu phiên tại thời điểm tạo. Điều này ngăn các khóa phiên phẳng hoặc được khôi phục vô tình lấy lại đặc quyền điều phối viên.
- **Độ sâu 1 (điều phối viên, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể tạo tác tử con và kiểm tra trạng thái của chúng. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (đầu cuối, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (tác tử thực thi đầu cuối):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể tạo thêm tác tử con.

### Giới hạn tạo tác tử theo từng tác tử

Mỗi phiên tác tử (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định `5`) tác tử con đang hoạt động cùng lúc. Điều này ngăn một
điều phối viên duy nhất mở rộng số lượng tác tử ngoài kiểm soát.

### Dừng theo tầng

Việc dừng một điều phối viên ở độ sâu 1 sẽ tự động dừng tất cả tác tử con
ở độ sâu 2 của nó:

- `/stop` trong cuộc trò chuyện chính sẽ dừng tất cả tác tử ở độ sâu 1 và lan truyền thao tác dừng đến các tác tử con ở độ sâu 2 của chúng.

## Xác thực

Thông tin xác thực của tác tử con được phân giải theo **id tác tử**, không phải theo loại phiên:

- Khóa phiên của tác tử con là `agent:<agentId>:subagent:<uuid>`.
- Kho thông tin xác thực được tải từ `agentDir` của tác tử đó.
- Các hồ sơ xác thực của tác tử chính được hợp nhất làm phương án **dự phòng**; hồ sơ tác tử ghi đè hồ sơ chính khi có xung đột.

Quá trình hợp nhất mang tính bổ sung, vì vậy hồ sơ chính luôn có thể được dùng làm
phương án dự phòng. Tính năng xác thực cô lập hoàn toàn cho từng tác tử hiện chưa được hỗ trợ.

## Thông báo

Tác tử con báo cáo lại thông qua một bước thông báo:

- Bước thông báo chạy bên trong phiên của tác tử con (không phải phiên của bên yêu cầu).
- Nếu tác tử con trả lời chính xác `ANNOUNCE_SKIP`, không có nội dung nào được đăng.
- Nếu văn bản mới nhất của trợ lý là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo sẽ bị chặn ngay cả khi trước đó đã có tiến trình hiển thị.

Cách chuyển giao phụ thuộc vào độ sâu của bên yêu cầu:

- Các phiên yêu cầu cấp cao nhất sử dụng lệnh gọi `agent` tiếp theo với cơ chế chuyển giao bên ngoài (`deliver=true`).
- Các phiên tác tử con yêu cầu lồng nhau nhận một nội dung tiếp nối được chèn nội bộ (`deliver=false`) để điều phối viên có thể tổng hợp kết quả của tác tử con ngay trong phiên.
- Nếu phiên tác tử con yêu cầu lồng nhau không còn tồn tại, OpenClaw sẽ chuyển về bên yêu cầu của phiên đó khi có thể.

Đối với các phiên yêu cầu cấp cao nhất, cơ chế chuyển giao trực tiếp ở chế độ hoàn tất trước tiên
phân giải mọi tuyến hội thoại/luồng đã liên kết và phần ghi đè của hook, sau đó điền
các trường kênh-đích còn thiếu từ tuyến đã lưu của phiên yêu cầu.
Điều này giữ các kết quả hoàn tất trong đúng cuộc trò chuyện/chủ đề ngay cả khi nguồn gốc hoàn tất
chỉ xác định được kênh.

Việc tổng hợp hoàn tất của tác tử con được giới hạn trong lượt chạy hiện tại của bên yêu cầu khi
xây dựng các phát hiện hoàn tất lồng nhau, ngăn đầu ra cũ của tác tử con từ lượt chạy trước
rò rỉ vào thông báo hiện tại. Phản hồi thông báo giữ nguyên
tuyến luồng/chủ đề khi bộ điều hợp kênh hỗ trợ.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường          | Nguồn                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Nguồn           | `subagent` hoặc `cron`                                                              |
| ID phiên        | Khóa/id phiên con                                                                                        |
| Loại            | Loại thông báo + nhãn tác vụ                                                                             |
| Trạng thái      | Được suy ra từ kết quả thời gian chạy (`ok`, `error`, `timeout` hoặc `unknown`) — **không** suy luận từ văn bản của mô hình |
| Nội dung kết quả | Văn bản trợ lý hiển thị mới nhất từ tác tử con                                                          |
| Tiếp nối        | Hướng dẫn mô tả khi nào cần trả lời và khi nào cần giữ im lặng                                          |

Các lượt chạy kết thúc trong trạng thái thất bại sẽ báo cáo trạng thái thất bại mà không phát lại
văn bản phản hồi đã ghi lại. Đầu ra tool/toolResult không được đưa vào văn bản kết quả của tác tử con.

### Dòng thống kê

Tải trọng thông báo có một dòng thống kê ở cuối (ngay cả khi được bao bọc):

- Thời gian chạy (ví dụ: `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng cộng).
- Chi phí ước tính khi đã cấu hình giá mô hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` và đường dẫn bản ghi để tác tử chính có thể truy xuất lịch sử qua `sessions_history` hoặc kiểm tra tệp trên ổ đĩa.

Siêu dữ liệu nội bộ chỉ dành cho hoạt động điều phối; các phản hồi hướng đến người dùng
nên được viết lại bằng giọng trợ lý thông thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là đường dẫn điều phối an toàn hơn để đọc bản ghi của tác tử con
từ bên trong một lượt tác tử:

- Che văn bản giống thông tin xác thực/token ngay cả khi tính năng che nhật ký đa dụng bị tắt.
- Cắt ngắn các khối văn bản dài (4000 ký tự mỗi khối) và loại bỏ chữ ký suy nghĩ, tải trọng phát lại lập luận và dữ liệu hình ảnh nội tuyến.
- Áp dụng giới hạn phản hồi 80 KB; các hàng quá lớn được thay thế bằng `[sessions_history omitted: message too large]`.
- Dùng `nextOffset` khi có để phân trang ngược qua các cửa sổ bản ghi cũ hơn.
- `sessions_history` **không** loại bỏ thẻ lập luận, cấu trúc `<relevant-memories>` hoặc XML lệnh gọi công cụ khỏi văn bản tin nhắn — nó trả về các khối nội dung có cấu trúc gần với dạng bản ghi thô, chỉ được che và giới hạn kích thước. `/subagents log` áp dụng bộ làm sạch văn xuôi mạnh hơn (loại bỏ thẻ lập luận, cấu trúc bộ nhớ và XML lệnh gọi công cụ) vì nó hiển thị các dòng trò chuyện thuần túy thay vì các khối có cấu trúc.
- Kiểm tra bản ghi thô trên ổ đĩa là phương án dự phòng khi cần bản ghi đầy đủ chính xác từng byte.

## Chính sách công cụ

Trước tiên, tác tử con sử dụng cùng hồ sơ và quy trình chính sách công cụ như tác tử cha hoặc
tác tử đích. Sau đó, OpenClaw áp dụng lớp hạn chế dành cho tác tử con.

Tác tử con luôn mất `gateway`, `agents_list`, `session_status` và
`cron` bất kể độ sâu hay vai trò (các công cụ cấp hệ thống/tương tác hoặc
các công cụ mà tác tử chính cần điều phối). Tác tử con đầu cuối (hành vi mặc định ở độ sâu 1
và luôn áp dụng ở độ sâu 2) còn mất thêm `subagents`,
`sessions_list`, `sessions_history` và `sessions_spawn`. Tác tử con không bao giờ
nhận công cụ `message` — công cụ này bị vô hiệu hóa tại thời điểm tạo, không phải bị lọc bởi
danh sách từ chối này — và `sessions_send` vẫn bị từ chối để tác tử con
chỉ giao tiếp thông qua chuỗi thông báo.

`sessions_history` ở đây cũng vẫn là chế độ xem truy hồi được giới hạn và làm sạch —
không phải bản xuất thô của bản ghi.

Khi `maxSpawnDepth >= 2`, các tác tử con điều phối viên ở độ sâu 1 còn
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
        // quy tắc từ chối được ưu tiên
        deny: ["gateway", "cron"],
        // nếu đặt allow, danh sách này trở thành danh sách chỉ cho phép (quy tắc từ chối vẫn được ưu tiên)
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
tác tử con dùng hồ sơ lập trình sử dụng tự động hóa trình duyệt, hãy thêm trình duyệt ở
giai đoạn hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Dùng `agents.list[].tools.alsoAllow: ["browser"]` theo từng tác tử khi chỉ một
tác tử cần được cấp quyền tự động hóa trình duyệt.

## Tính đồng thời

Tác tử con sử dụng một làn hàng đợi riêng trong tiến trình:

- **Tên làn:** `subagent`
- **Mức đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định `8`)

## Tính hoạt động và khôi phục

OpenClaw không coi việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một
tác tử con vẫn đang hoạt động. Các lượt chạy chưa kết thúc và cũ hơn cửa sổ lượt chạy quá hạn
(2 giờ hoặc thời gian chờ chạy đã cấu hình cộng thêm một khoảng ân hạn ngắn,
tùy khoảng nào dài hơn) sẽ không còn được tính là đang hoạt động/đang chờ trong `/subagents list`,
các bản tóm tắt trạng thái, cơ chế chặn hoàn tất của hậu duệ và kiểm tra
mức đồng thời theo phiên.

Sau khi Gateway khởi động lại, các lượt chạy cũ chưa kết thúc đã được khôi phục sẽ bị loại bỏ trừ khi
phiên con của chúng được đánh dấu `abortedLastRun: true`. Các lượt chạy
bị hủy do khởi động lại vẫn được đăng ký cho luồng khôi phục tác tử con mồ côi: các lượt chạy cũ
được hoàn tất mà không tiếp tục, còn các phiên con mới nhận được
một thông báo tiếp tục tổng hợp trước khi dấu đánh dấu bị hủy được xóa.

Quá trình khôi phục tự động sau khi khởi động lại được giới hạn theo từng phiên con. Nếu cùng một
tác tử con được chấp nhận để khôi phục tác tử mồ côi nhiều lần trong
cửa sổ nhanh chóng tái mắc kẹt, OpenClaw sẽ lưu một bia mộ khôi phục trên
phiên đó và ngừng tự động tiếp tục phiên trong các lần khởi động lại sau. Chạy
`openclaw tasks maintenance --apply` để đối soát bản ghi tác vụ hoặc
`openclaw doctor --fix` để xóa các cờ khôi phục bị hủy cũ trên
các phiên có bia mộ.

<Note>
Nếu việc khởi tạo tác tử con thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra bên gọi RPC trước khi chỉnh sửa trạng thái ghép nối.
Hoạt động điều phối `sessions_spawn` nội bộ được điều phối trong cùng tiến trình khi
bên gọi đã chạy bên trong ngữ cảnh yêu cầu của gateway, vì vậy hoạt động này
không mở WebSocket loopback hoặc phụ thuộc vào đường cơ sở phạm vi thiết bị đã ghép nối của CLI.
Các bên gọi bên ngoài tiến trình gateway vẫn sử dụng phương án dự phòng WebSocket
dưới dạng `client.id: "gateway-client"` với `client.mode: "backend"`
thông qua xác thực bằng mã thông báo dùng chung/mật khẩu trực tiếp qua loopback. Các bên gọi từ xa, đường dẫn
`deviceIdentity` tường minh, đường dẫn mã thông báo thiết bị tường minh và máy khách trình duyệt/node
vẫn cần phê duyệt thiết bị thông thường để nâng cấp phạm vi.
</Note>

## Dừng

- Việc gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên của bên yêu cầu và dừng mọi lượt chạy tác tử con đang hoạt động được khởi tạo từ phiên đó, đồng thời lan truyền đến các tác tử con lồng nhau.

## Hạn chế

- Thông báo của tác tử con được thực hiện theo nguyên tắc **nỗ lực tối đa**. Nếu gateway khởi động lại, công việc "thông báo lại" đang chờ xử lý sẽ bị mất.
- Các tác tử con vẫn dùng chung tài nguyên của cùng một tiến trình gateway; hãy xem `maxConcurrent` như một van an toàn.
- `sessions_spawn` luôn không chặn: thao tác này trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh tác tử con chỉ chèn `AGENTS.md` và `TOOLS.md` (không có `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` hoặc `BOOTSTRAP.md`). Các tác tử con gốc Codex tuân theo cùng ranh giới: `TOOLS.md` vẫn nằm trong các chỉ dẫn luồng Codex được kế thừa, trong khi các tệp nhân dạng, danh tính và người dùng chỉ dành cho tác tử cha được chèn dưới dạng chỉ dẫn cộng tác theo phạm vi lượt để tác tử con không sao chép chúng.
- Độ sâu lồng tối đa là 5 (phạm vi `maxSpawnDepth`: 1-5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số tác tử con đang hoạt động trên mỗi phiên (mặc định `5`, phạm vi `1-20`).

## Liên quan

- [Công cụ phiên và thay đổi trạng thái](/vi/concepts/session-tool)
- [Tác tử ACP](/vi/tools/acp-agents)
- [Gửi tác tử](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác tử](/vi/tools/multi-agent-sandbox-tools)
