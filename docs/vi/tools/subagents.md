---
read_when:
    - Bạn muốn tác nhân thực hiện công việc trong nền hoặc song song
    - Bạn đang thay đổi chính sách công cụ sessions_spawn hoặc tác tử phụ
    - Bạn đang triển khai hoặc khắc phục sự cố các phiên tác nhân phụ gắn với luồng thảo luận
sidebarTitle: Sub-agents
summary: Khởi chạy các lượt chạy tác nhân nền biệt lập để thông báo kết quả trở lại cuộc trò chuyện của người yêu cầu
title: Tác tử phụ
x-i18n:
    generated_at: "2026-07-12T08:28:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

Các tác tử con là những lượt chạy tác tử nền được tạo từ một lượt chạy tác tử hiện có.
Mỗi tác tử chạy trong phiên riêng (`agent:<agentId>:subagent:<uuid>`) và,
khi hoàn tất, sẽ **thông báo** kết quả trở lại kênh trò chuyện của bên yêu cầu.
Mọi lượt chạy tác tử con đều được theo dõi dưới dạng một [tác vụ nền](/vi/automation/tasks).

Mục tiêu:

- Song song hóa việc nghiên cứu, các tác vụ dài và công việc công cụ chậm mà không chặn lượt chạy chính.
- Giữ các tác tử con được cô lập theo mặc định (tách biệt phiên, tùy chọn hộp cát).
- Giữ bề mặt công cụ khó bị sử dụng sai: theo mặc định, tác tử con **không** được cấp công cụ phiên hoặc nhắn tin.
- Hỗ trợ độ sâu lồng nhau có thể cấu hình cho các mẫu điều phối.

<Note>
**Lưu ý về chi phí:** theo mặc định, mỗi tác tử con có ngữ cảnh và mức sử dụng token
riêng. Với các tác vụ nặng hoặc lặp lại, hãy đặt một mô hình tiết kiệm hơn cho tác tử con
và giữ tác tử chính trên một mô hình có chất lượng cao hơn thông qua
`agents.defaults.subagents.model` hoặc các giá trị ghi đè theo từng tác tử. Khi tác tử con
thực sự cần bản chép lời hiện tại của bên yêu cầu, hãy tạo nó với
`context: "fork"`. Các phiên tác tử con gắn với luồng mặc định dùng
`context: "fork"` vì chúng phân nhánh cuộc hội thoại hiện tại thành một
luồng tiếp nối.
</Note>

## Lệnh dấu gạch chéo

`/subagents` kiểm tra các lượt chạy tác tử con cho **phiên hiện tại**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` hiển thị siêu dữ liệu của lượt chạy (trạng thái, dấu thời gian, mã phiên,
đường dẫn bản chép lời, việc dọn dẹp). `/subagents log` in các lượt trò chuyện gần đây của một
lượt chạy; thêm token `tools` để bao gồm thông báo gọi công cụ/kết quả (bị lược bỏ
theo mặc định). Dùng `sessions_history` để xem lại trong phạm vi giới hạn và đã lọc an toàn
từ bên trong một lượt tác tử, hoặc kiểm tra đường dẫn bản chép lời trên đĩa để xem
toàn bộ bản chép lời thô.

### Điều khiển liên kết luồng

Các lệnh này hoạt động trên những kênh có liên kết luồng bền vững. Xem
[Các kênh hỗ trợ luồng](#thread-supporting-channels) bên dưới.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Hành vi tạo tác tử

Các tác tử khởi chạy tác tử con nền bằng công cụ `sessions_spawn`.
Kết quả hoàn tất được trả về dưới dạng sự kiện nội bộ của phiên cha; tác tử
cha/bên yêu cầu quyết định có cần cập nhật cho người dùng hay không.

<AccordionGroup>
  <Accordion title="Hoàn tất không chặn, dựa trên cơ chế đẩy">
    - `sessions_spawn` không chặn; nó trả về mã lượt chạy ngay lập tức.
    - Khi hoàn tất, tác tử con báo cáo lại cho phiên cha/bên yêu cầu.
    - Các lượt tác tử cần kết quả từ tác tử con nên gọi `sessions_yield` sau khi tạo công việc cần thiết. Thao tác này kết thúc lượt hiện tại và cho phép sự kiện hoàn tất xuất hiện dưới dạng thông báo tiếp theo mà mô hình có thể thấy.
    - Việc hoàn tất dựa trên cơ chế đẩy. Sau khi đã tạo, **không** thăm dò `/subagents list`, `sessions_list` hoặc `sessions_history` theo vòng lặp chỉ để chờ nó hoàn tất; chỉ kiểm tra trạng thái theo nhu cầu khi gỡ lỗi.
    - Đầu ra của tác tử con là báo cáo/bằng chứng để tác tử của bên yêu cầu tổng hợp. Đây không phải văn bản chỉ dẫn do người dùng viết và không thể ghi đè chính sách hệ thống, nhà phát triển hoặc người dùng.
    - Khi hoàn tất, OpenClaw cố gắng tối đa để đóng các tab trình duyệt/tiến trình được phiên tác tử con đó mở và theo dõi trước khi luồng dọn dẹp thông báo tiếp tục.

  </Accordion>
  <Accordion title="Phân phối kết quả hoàn tất">
    - OpenClaw chuyển kết quả hoàn tất trở lại phiên của bên yêu cầu thông qua một lượt `agent` có khóa đảm bảo tính lũy đẳng ổn định.
    - Nếu lượt chạy của bên yêu cầu vẫn đang hoạt động, trước tiên OpenClaw cố gắng đánh thức/điều hướng lượt chạy đó thay vì bắt đầu một đường phản hồi hiển thị thứ hai.
    - Nếu không thể đánh thức bên yêu cầu đang hoạt động, OpenClaw chuyển sang bàn giao cho tác tử của bên yêu cầu với cùng ngữ cảnh hoàn tất thay vì loại bỏ thông báo.
    - Việc bàn giao thành công cho tác tử cha sẽ hoàn tất quá trình phân phối của tác tử con ngay cả khi tác tử cha quyết định không cần cập nhật hiển thị cho người dùng.
    - Tác tử con gốc không được cấp công cụ nhắn tin. Chúng trả văn bản trợ lý thuần túy cho tác tử cha/bên yêu cầu; các phản hồi hiển thị cho con người vẫn thuộc quyền kiểm soát của chính sách phân phối thông thường của tác tử cha/bên yêu cầu.
    - Nếu không thể dùng bàn giao trực tiếp, quá trình phân phối sẽ chuyển dự phòng sang định tuyến hàng đợi, rồi thử lại thông báo trong thời gian ngắn với độ trễ tăng theo cấp số nhân trước khi từ bỏ hoàn toàn.
    - Quá trình phân phối giữ nguyên tuyến của bên yêu cầu đã được phân giải: tuyến hoàn tất gắn với luồng hoặc gắn với cuộc hội thoại sẽ được ưu tiên khi có sẵn. Nếu nguồn hoàn tất chỉ cung cấp một kênh, OpenClaw điền đích/tài khoản còn thiếu từ tuyến đã phân giải của phiên bên yêu cầu (`lastChannel` / `lastTo` / `lastAccountId`) để việc phân phối trực tiếp vẫn hoạt động.

  </Accordion>
  <Accordion title="Siêu dữ liệu bàn giao khi hoàn tất">
    Phần bàn giao kết quả hoàn tất cho phiên của bên yêu cầu là ngữ cảnh nội bộ
    do môi trường chạy tạo ra (không phải văn bản do người dùng viết) và bao gồm:

    - `Result` — văn bản phản hồi `assistant` hiển thị mới nhất từ tác tử con. Đầu ra tool/toolResult không được đưa vào kết quả của tác tử con. Các lượt chạy kết thúc với trạng thái thất bại không tái sử dụng văn bản phản hồi đã ghi lại.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Số liệu thống kê gọn về môi trường chạy/token.
    - Chỉ dẫn xem xét yêu cầu tác tử của bên yêu cầu xác minh kết quả trước khi quyết định tác vụ ban đầu đã hoàn thành hay chưa.
    - Hướng dẫn tiếp nối yêu cầu tác tử của bên yêu cầu tiếp tục tác vụ hoặc ghi lại phần việc tiếp nối khi kết quả của tác tử con vẫn còn hành động cần thực hiện.
    - Chỉ dẫn cập nhật cuối cùng dành cho trường hợp không còn hành động nào, được viết bằng giọng trợ lý thông thường mà không chuyển tiếp siêu dữ liệu nội bộ thô.

  </Accordion>
  <Accordion title="Chế độ và môi trường chạy ACP">
    - `--model` và `--thinking` ghi đè giá trị mặc định cho lượt chạy cụ thể đó.
    - Dùng `info`/`log` để kiểm tra chi tiết và đầu ra sau khi hoàn tất.
    - Với các phiên bền vững gắn với luồng, dùng `sessions_spawn` với `thread: true` và `mode: "session"`.
    - Nếu kênh của bên yêu cầu không hỗ trợ liên kết luồng, hãy dùng `mode: "run"` thay vì thử lại một tổ hợp gắn với luồng không thể hoạt động.
    - Với các phiên bộ điều khiển ACP (Claude Code, Gemini CLI, OpenCode hoặc Codex ACP/acpx được chỉ định rõ), hãy dùng `sessions_spawn` với `runtime: "acp"` khi công cụ quảng bá môi trường chạy đó. Xem [Mô hình phân phối ACP](/vi/tools/acp-agents#delivery-model) khi gỡ lỗi kết quả hoàn tất hoặc vòng lặp giữa các tác tử. Khi Plugin `codex` được bật, việc điều khiển trò chuyện/luồng của Codex nên ưu tiên `/codex ...` hơn ACP trừ khi người dùng yêu cầu rõ ACP/acpx.
    - OpenClaw ẩn `runtime: "acp"` cho đến khi ACP được bật, bên yêu cầu không ở trong hộp cát và một Plugin phần phụ trợ như `acpx` đã được nạp. `runtime: "acp"` yêu cầu một mã bộ điều khiển ACP bên ngoài hoặc một mục `agents.list[]` có `runtime.type="acp"`; dùng môi trường chạy tác tử con mặc định cho các tác tử cấu hình OpenClaw thông thường từ `agents_list`.

  </Accordion>
</AccordionGroup>

## Chế độ ngữ cảnh

Tác tử con gốc khởi động ở trạng thái cô lập, trừ khi bên gọi yêu cầu rõ ràng việc phân nhánh
bản chép lời hiện tại.

| Chế độ     | Khi nào nên dùng                                                                                                                        | Hành vi                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nghiên cứu mới, triển khai độc lập, công việc công cụ chậm hoặc bất kỳ việc gì có thể được mô tả đầy đủ trong văn bản tác vụ             | Tạo một bản chép lời tác tử con sạch. Đây là mặc định và giúp giảm mức sử dụng token. |
| `fork`     | Công việc phụ thuộc vào cuộc hội thoại hiện tại, kết quả công cụ trước đó hoặc các chỉ dẫn tinh tế đã có trong bản chép lời của bên yêu cầu | Phân nhánh bản chép lời của bên yêu cầu vào phiên tác tử con trước khi tác tử con khởi động. |

Chỉ dùng `fork` khi cần thiết. Chế độ này dành cho việc ủy quyền phụ thuộc vào ngữ cảnh, không phải
để thay thế việc viết một lời nhắc tác vụ rõ ràng.

## Công cụ: `sessions_spawn`

Khởi chạy một lượt tác tử con với `deliver: false` trên làn `subagent` toàn cục,
sau đó chạy bước thông báo và đăng phản hồi thông báo lên kênh trò chuyện của bên yêu cầu.

Tính khả dụng phụ thuộc vào chính sách công cụ có hiệu lực của bên gọi. Hồ sơ tích hợp sẵn
`coding` bao gồm `sessions_spawn`; `messaging` và `minimal` thì
không. `full` cho phép mọi công cụ. Thêm `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` hoặc dùng `tools.profile: "coding"` cho
các tác tử có hồ sơ hạn chế hơn nhưng vẫn cần ủy quyền công việc.
Các chính sách cho phép/từ chối theo kênh/nhóm, nhà cung cấp, hộp cát và từng tác tử
vẫn có thể loại bỏ công cụ sau giai đoạn hồ sơ. Dùng `/tools` từ cùng
phiên để xác nhận danh sách công cụ có hiệu lực.

**Mặc định:**

- **Mô hình:** tác tử con gốc kế thừa từ bên gọi trừ khi bạn đặt `agents.defaults.subagents.model` (hoặc `agents.list[].subagents.model` theo từng tác tử). Các lượt tạo trong môi trường chạy ACP dùng cùng mô hình tác tử con đã cấu hình khi có; nếu không, bộ điều khiển ACP giữ giá trị mặc định riêng. Giá trị `sessions_spawn.model` được chỉ định rõ vẫn được ưu tiên.
- **Suy luận:** tác tử con gốc kế thừa từ bên gọi trừ khi bạn đặt `agents.defaults.subagents.thinking` (hoặc `agents.list[].subagents.thinking` theo từng tác tử). Các lượt tạo trong môi trường chạy ACP cũng áp dụng `agents.defaults.models["provider/model"].params.thinking` cho mô hình đã chọn. Giá trị `sessions_spawn.thinking` được chỉ định rõ vẫn được ưu tiên.
- **Thời gian chờ lượt chạy:** OpenClaw dùng `agents.defaults.subagents.runTimeoutSeconds` khi được đặt; nếu không, nó dùng dự phòng `0` (không có thời gian chờ). `sessions_spawn` không chấp nhận giá trị ghi đè thời gian chờ theo từng lần gọi.
- **Phân phối tác vụ:** tác tử con gốc nhận tác vụ được ủy quyền trong thông báo `[Subagent Task]` hiển thị đầu tiên. Lời nhắc hệ thống của tác tử con chứa các quy tắc môi trường chạy và ngữ cảnh định tuyến, không chứa một bản sao ẩn của tác vụ.

Các lượt tạo tác tử con gốc được chấp nhận bao gồm siêu dữ liệu mô hình tác tử con đã phân giải
trong kết quả công cụ: `resolvedModel` chứa tham chiếu mô hình được áp dụng và
`resolvedProvider` chứa tiền tố nhà cung cấp khi tham chiếu có tiền tố.

### Chế độ lời nhắc ủy quyền

`agents.defaults.subagents.delegationMode` chỉ điều khiển hướng dẫn trong lời nhắc; nó không thay đổi chính sách công cụ hoặc bắt buộc ủy quyền.

- `suggest` (mặc định): giữ gợi ý tiêu chuẩn trong lời nhắc về việc dùng tác tử con cho công việc lớn hơn hoặc chậm hơn.
- `prefer`: yêu cầu tác tử chính duy trì khả năng phản hồi và ủy quyền mọi việc phức tạp hơn một phản hồi trực tiếp thông qua `sessions_spawn`.

Giá trị ghi đè theo từng tác tử: `agents.list[].subagents.delegationMode`.

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
  Mô tả tác vụ dành cho tác nhân con.
</ParamField>
<ParamField path="taskName" type="string">
  Định danh ổn định tùy chọn để xác định một tác nhân con cụ thể trong kết quả trạng thái sau này. Phải khớp với `[a-z][a-z0-9_-]{0,63}` và không được là mục tiêu dành riêng như `last` hoặc `all`.
</ParamField>
<ParamField path="label" type="string">
  Nhãn tùy chọn, dễ đọc đối với con người.
</ParamField>
<ParamField path="agentId" type="string">
  Khởi tạo dưới một mã định danh tác nhân đã cấu hình khác khi được `subagents.allowAgents` cho phép.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc tùy chọn của tác vụ cho lượt chạy tác nhân con. Các tác nhân con gốc vẫn tải tệp khởi tạo từ không gian làm việc của tác nhân đích; `cwd` chỉ thay đổi vị trí nơi các công cụ thời gian chạy và bộ khung CLI thực hiện công việc được ủy quyền.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` chỉ dành cho các bộ khung ACP bên ngoài (`claude`, `droid`, `gemini`, `opencode` hoặc Codex ACP/acpx được yêu cầu rõ ràng) và các mục `agents.list[]` có `runtime.type` là `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Chỉ dành cho ACP. Tiếp tục một phiên bộ khung ACP hiện có khi `runtime: "acp"`; bị bỏ qua khi khởi tạo tác nhân con gốc.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Chỉ dành cho ACP. Truyền trực tiếp đầu ra lượt chạy ACP đến phiên cha khi `runtime: "acp"`; bỏ qua khi khởi tạo tác nhân con gốc.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình của tác nhân con. Các giá trị không hợp lệ sẽ bị bỏ qua và tác nhân con chạy trên mô hình mặc định, kèm cảnh báo trong kết quả công cụ.
</ParamField>
<ParamField path="thinking" type="string">
  Ghi đè mức độ suy luận cho lượt chạy tác nhân con.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Khi là `true`, yêu cầu liên kết luồng kênh cho phiên tác nhân con này.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Nếu `thread: true` và bỏ qua `mode`, giá trị mặc định sẽ là `session`. `mode: "session"` yêu cầu `thread: true`.
  Nếu liên kết luồng không khả dụng cho kênh của bên yêu cầu, hãy dùng `mode: "run"` thay thế.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` lưu trữ phiên ngay sau khi thông báo (vẫn giữ bản ghi hội thoại bằng cách đổi tên).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` từ chối khởi tạo trừ khi thời gian chạy của tác nhân con đích được cách ly.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` phân nhánh bản ghi hội thoại hiện tại của bên yêu cầu sang phiên tác nhân con. Chỉ dành cho tác nhân con gốc. Các lượt khởi tạo liên kết với luồng mặc định là `fork`; các lượt khởi tạo không liên kết với luồng mặc định là `isolated`.
</ParamField>

<Warning>
`sessions_spawn` **không** chấp nhận các tham số phân phối qua kênh (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Tác nhân con gốc báo cáo
lượt phản hồi mới nhất của trợ lý về cho bên yêu cầu; việc phân phối ra bên ngoài vẫn thuộc
tác nhân cha/tác nhân yêu cầu.
</Warning>

### Tên tác vụ và xác định mục tiêu

`taskName` là định danh dành cho mô hình để điều phối, không phải khóa phiên.
Dùng định danh này cho các tên tác nhân con ổn định như `review_subagents`,
`linux_validation` hoặc `docs_update` khi một bộ điều phối có thể cần kiểm tra
tác nhân con đó sau này.

Việc phân giải mục tiêu chấp nhận các kết quả khớp chính xác với `taskName` và các
tiền tố không mơ hồ. Phạm vi khớp được giới hạn trong cùng cửa sổ mục tiêu đang hoạt động/gần đây
được các mục tiêu `/subagents` đánh số sử dụng, vì vậy một tác nhân con đã hoàn tất từ lâu không làm
cho định danh được tái sử dụng trở nên mơ hồ. Nếu hai tác nhân con đang hoạt động hoặc gần đây có cùng
`taskName`, mục tiêu sẽ mơ hồ; thay vào đó, hãy dùng chỉ mục danh sách, khóa phiên hoặc
mã định danh lượt chạy.

Các mục tiêu dành riêng `last` và `all` không phải là giá trị `taskName` hợp lệ
vì chúng đã mang ý nghĩa điều khiển.

## Công cụ: `sessions_yield`

Kết thúc lượt mô hình hiện tại và chờ các sự kiện thời gian chạy, chủ yếu là
sự kiện hoàn tất của tác nhân con, đến dưới dạng thông báo tiếp theo. Dùng công cụ này sau khi
khởi tạo công việc bắt buộc cho tác nhân con khi bên yêu cầu không thể đưa ra câu trả lời cuối cùng
cho đến khi nhận được các kết quả hoàn tất đó.

`sessions_yield` là cơ chế chờ. Không thay thế bằng các vòng lặp thăm dò
qua `subagents`, `sessions_list`, `sessions_history`, lệnh
`sleep` của trình bao hoặc thăm dò tiến trình chỉ để phát hiện tác nhân con hoàn tất.

Chỉ dùng `sessions_yield` khi danh sách công cụ hiệu dụng của phiên có
công cụ này. Một số hồ sơ công cụ tối giản hoặc tùy chỉnh có thể cung cấp `sessions_spawn` và
`subagents` mà không cung cấp `sessions_yield`; trong trường hợp đó, không tự tạo
vòng lặp thăm dò chỉ để chờ hoàn tất.

Khi có tác nhân con đang hoạt động, OpenClaw chèn một khối lời nhắc `Active Subagents`
ngắn gọn do thời gian chạy tạo vào các lượt thông thường để bên yêu cầu có thể xem
các phiên tác nhân con hiện tại, mã định danh lượt chạy, trạng thái, nhãn, tác vụ và
bí danh `taskName` mà không cần thăm dò. Các trường tác vụ và nhãn trong
khối đó được trích dẫn dưới dạng dữ liệu, không phải chỉ dẫn, vì chúng có thể bắt nguồn
từ các đối số khởi tạo do người dùng/mô hình cung cấp.

## Công cụ: `subagents`

Liệt kê các lượt chạy tác nhân con đã được khởi tạo thuộc sở hữu của phiên yêu cầu. Phạm vi của công cụ
được giới hạn ở bên yêu cầu hiện tại; một tác nhân con chỉ có thể thấy các tác nhân con do chính nó kiểm soát.

Dùng `subagents` để kiểm tra trạng thái và gỡ lỗi theo yêu cầu. Dùng `sessions_yield` để
chờ sự kiện hoàn tất.

## Phiên liên kết với luồng

Khi liên kết luồng được bật cho một kênh, tác nhân con có thể tiếp tục được liên kết
với một luồng để các tin nhắn tiếp theo của người dùng trong luồng đó tiếp tục được định tuyến đến
cùng phiên tác nhân con.

### Các kênh hỗ trợ luồng

Một kênh hỗ trợ các phiên tác nhân con liên kết với luồng lâu dài
(`sessions_spawn` với `thread: true`) khi kênh đó đăng ký một bộ chuyển đổi liên kết
cuộc hội thoại. Các kênh đi kèm có hỗ trợ này: **Discord**,
**iMessage**, **Matrix** và **Telegram**. Discord và Matrix mặc định
tạo một luồng con; Telegram và iMessage mặc định liên kết với
cuộc hội thoại hiện tại. Dùng các khóa cấu hình `threadBindings` riêng cho từng kênh để
bật, đặt thời gian chờ và cấu hình `spawnSessions`.

### Luồng nhanh

<Steps>
  <Step title="Khởi tạo">
    `sessions_spawn` với `thread: true` (và tùy chọn `mode: "session"`).
  </Step>
  <Step title="Liên kết">
    OpenClaw tạo hoặc liên kết một luồng với mục tiêu phiên đó trong kênh đang hoạt động.
  </Step>
  <Step title="Định tuyến nội dung tiếp theo">
    Các phản hồi và tin nhắn tiếp theo trong luồng đó được định tuyến đến phiên đã liên kết.
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
| `/focus <target>`  | Liên kết luồng hiện tại (hoặc tạo một luồng) với mục tiêu tác nhân con/phiên               |
| `/unfocus`         | Xóa liên kết cho luồng đang được liên kết hiện tại                                         |
| `/agents`          | Liệt kê các lượt chạy đang hoạt động và trạng thái liên kết (`binding:<id>`, `unbound` hoặc `bindings unavailable`) |
| `/session idle`    | Kiểm tra/cập nhật việc tự động bỏ tập trung khi không hoạt động (chỉ các luồng liên kết đang được tập trung) |
| `/session max-age` | Kiểm tra/cập nhật giới hạn cứng (chỉ các luồng liên kết đang được tập trung)               |

### Công tắc cấu hình

- **Mặc định toàn cục:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Các khóa ghi đè theo kênh và tự động liên kết khi khởi tạo** phụ thuộc vào bộ chuyển đổi. Xem [Các kênh hỗ trợ luồng](#thread-supporting-channels) ở trên.

Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference) và
[Lệnh gạch chéo](/vi/tools/slash-commands) để biết chi tiết hiện tại về bộ chuyển đổi.

### Danh sách cho phép

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Danh sách mã định danh tác nhân đã cấu hình có thể được chỉ định thông qua `agentId` tường minh (`["*"]` cho phép mọi mục tiêu đã cấu hình). Mặc định: chỉ tác nhân yêu cầu. Nếu bạn đặt một danh sách và vẫn muốn tác nhân yêu cầu tự khởi tạo chính nó bằng `agentId`, hãy đưa mã định danh của tác nhân yêu cầu vào danh sách.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Danh sách cho phép mặc định gồm các tác nhân đích đã cấu hình, được dùng khi tác nhân yêu cầu không đặt `subagents.allowAgents` riêng.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ tường minh). Ghi đè theo tác nhân: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Thời gian chờ cho mỗi lệnh gọi đối với các lần thử phân phối thông báo `agent` của Gateway. Giá trị là số nguyên dương tính bằng mili giây và được giới hạn ở mức tối đa an toàn của bộ hẹn giờ trên nền tảng. Các lần thử lại tạm thời có thể khiến tổng thời gian chờ thông báo dài hơn một khoảng thời gian chờ đã cấu hình.
</ParamField>

Nếu phiên yêu cầu được cách ly, `sessions_spawn` sẽ từ chối các mục tiêu
chạy mà không được cách ly.

### Khám phá

Dùng `agents_list` để xem những mã định danh tác nhân nào hiện được phép dùng cho
`sessions_spawn`. Phản hồi bao gồm mô hình hiệu dụng và siêu dữ liệu thời gian chạy
được nhúng của từng tác nhân được liệt kê, để bên gọi có thể phân biệt OpenClaw, máy chủ ứng dụng Codex
và các thời gian chạy gốc đã cấu hình khác.

Các mục `allowAgents` phải trỏ đến các mã định danh tác nhân đã cấu hình trong `agents.list[]`.
`["*"]` có nghĩa là mọi tác nhân đích đã cấu hình cộng với tác nhân yêu cầu. Nếu cấu hình của một tác nhân
bị xóa nhưng mã định danh của tác nhân đó vẫn còn trong `allowAgents`, `sessions_spawn` sẽ từ chối mã định danh đó
và `agents_list` sẽ bỏ qua nó. Chạy `openclaw doctor --fix` để dọn dẹp
các mục danh sách cho phép đã lỗi thời hoặc thêm một mục `agents.list[]` tối giản khi mục tiêu cần
tiếp tục có thể được khởi tạo trong khi kế thừa các giá trị mặc định.

### Tự động lưu trữ

- Các phiên tác nhân con được tự động lưu trữ sau `agents.defaults.subagents.archiveAfterMinutes` (mặc định `60`).
- Việc lưu trữ dùng `sessions.delete` và đổi tên bản ghi hội thoại thành `*.deleted.<timestamp>` (trong cùng thư mục).
- `cleanup: "delete"` lưu trữ ngay sau khi thông báo (vẫn giữ bản ghi hội thoại bằng cách đổi tên).
- Tự động lưu trữ được thực hiện theo khả năng tốt nhất; các bộ hẹn giờ đang chờ sẽ bị mất nếu Gateway khởi động lại.
- Thời gian chờ lượt chạy đã cấu hình **không** tự động lưu trữ; chúng chỉ dừng lượt chạy. Phiên vẫn tồn tại cho đến khi được tự động lưu trữ.
- Tự động lưu trữ áp dụng như nhau cho các phiên ở độ sâu 1 và độ sâu 2.
- Dọn dẹp trình duyệt tách biệt với dọn dẹp lưu trữ: các thẻ/tiến trình trình duyệt được theo dõi sẽ được đóng theo khả năng tốt nhất khi lượt chạy kết thúc, ngay cả khi bản ghi hội thoại/phiên được giữ lại.

## Tác nhân con lồng nhau

Theo mặc định, tác nhân con không thể khởi tạo tác nhân con của riêng mình
(`maxSpawnDepth: 1`). Đặt `maxSpawnDepth: 2` để bật một cấp
lồng nhau — **mẫu bộ điều phối**: chính → tác nhân con điều phối →
các tác nhân con cấp dưới thực thi.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // cho phép tác nhân con khởi tạo tác nhân con (mặc định: 1, phạm vi 1-5)
        maxChildrenPerAgent: 5, // số tác nhân con đang hoạt động tối đa trên mỗi phiên tác nhân (mặc định: 5, phạm vi 1-20)
        maxConcurrent: 8, // giới hạn làn đồng thời toàn cục (mặc định: 8)
        runTimeoutSeconds: 900, // thời gian chờ mặc định cho sessions_spawn (0 = không có thời gian chờ)
        announceTimeoutMs: 120000, // thời gian chờ thông báo Gateway cho mỗi lệnh gọi
      },
    },
  },
}
```

### Các mức độ sâu

| Độ sâu | Dạng khóa phiên                                | Vai trò                                              | Có thể tạo tác tử con?             |
| ------ | -------------------------------------------- | ---------------------------------------------------- | ---------------------------------- |
| 0      | `agent:<id>:main`                            | Tác tử chính                                         | Luôn luôn                          |
| 1      | `agent:<id>:subagent:<uuid>`                 | Tác tử con (bộ điều phối khi cho phép độ sâu 2)      | Chỉ khi `maxSpawnDepth >= 2`       |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Tác tử con cấp hai (tác tử thực thi ở nút lá)        | Không bao giờ                      |

### Chuỗi thông báo

Kết quả được chuyển ngược lên theo chuỗi:

1. Tác tử thực thi ở độ sâu 2 hoàn tất → thông báo cho tác tử cha (bộ điều phối ở độ sâu 1).
2. Bộ điều phối ở độ sâu 1 nhận thông báo, tổng hợp kết quả, hoàn tất → thông báo cho tác tử chính.
3. Tác tử chính nhận thông báo và chuyển kết quả đến người dùng.

Mỗi cấp chỉ thấy thông báo từ các tác tử con trực tiếp của mình.

<Note>
**Hướng dẫn vận hành:** chỉ khởi động công việc của tác tử con một lần và chờ các sự kiện hoàn tất thay vì xây dựng vòng lặp thăm dò quanh `sessions_list`, `sessions_history`, `/subagents list` hoặc các lệnh ngủ của `exec`.
`sessions_list` và `/subagents list` giữ cho quan hệ phiên con tập trung vào công việc đang hoạt động — tác tử con đang hoạt động vẫn được gắn kết, tác tử con đã kết thúc vẫn hiển thị trong một khoảng thời gian ngắn gần đây, còn các liên kết tác tử con cũ chỉ tồn tại trong kho lưu trữ sẽ bị bỏ qua sau khi hết khoảng thời gian còn mới. Điều này ngăn siêu dữ liệu `spawnedBy` / `parentSessionKey` cũ hồi sinh các tác tử con ma sau khi khởi động lại. Nếu sự kiện hoàn tất của tác tử con đến sau khi bạn đã gửi câu trả lời cuối cùng, phản hồi tiếp theo chính xác phải là token im lặng `NO_REPLY` / `no_reply`.
</Note>

### Chính sách công cụ theo độ sâu

- Vai trò và phạm vi kiểm soát được ghi vào siêu dữ liệu phiên tại thời điểm tạo. Điều này ngăn các khóa phiên phẳng hoặc được khôi phục vô tình lấy lại đặc quyền của bộ điều phối.
- **Độ sâu 1 (bộ điều phối, khi `maxSpawnDepth >= 2`):** nhận `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` để có thể tạo tác tử con và kiểm tra trạng thái của chúng. Các công cụ phiên/hệ thống khác vẫn bị từ chối.
- **Độ sâu 1 (nút lá, khi `maxSpawnDepth == 1`):** không có công cụ phiên (hành vi mặc định hiện tại).
- **Độ sâu 2 (tác tử thực thi ở nút lá):** không có công cụ phiên — `sessions_spawn` luôn bị từ chối ở độ sâu 2. Không thể tạo thêm tác tử con.

### Giới hạn tạo tác tử con cho mỗi tác tử

Mỗi phiên tác tử (ở bất kỳ độ sâu nào) có thể có tối đa `maxChildrenPerAgent`
(mặc định là `5`) tác tử con đang hoạt động cùng lúc. Điều này ngăn một
bộ điều phối duy nhất mở rộng phân nhánh mất kiểm soát.

### Dừng theo tầng

Việc dừng một bộ điều phối ở độ sâu 1 sẽ tự động dừng tất cả tác tử con
ở độ sâu 2 của nó:

- `/stop` trong cuộc trò chuyện chính dừng tất cả tác tử ở độ sâu 1 và lan truyền việc dừng đến các tác tử con ở độ sâu 2 của chúng.

## Xác thực

Thông tin xác thực của tác tử con được phân giải theo **ID tác tử**, không phải theo loại phiên:

- Khóa phiên của tác tử con là `agent:<agentId>:subagent:<uuid>`.
- Kho thông tin xác thực được tải từ `agentDir` của tác tử đó.
- Các hồ sơ xác thực của tác tử chính được hợp nhất làm **phương án dự phòng**; khi xung đột, hồ sơ của tác tử sẽ ghi đè hồ sơ chính.

Việc hợp nhất có tính bổ sung, vì vậy các hồ sơ chính luôn sẵn dùng làm
phương án dự phòng. Tính năng xác thực hoàn toàn biệt lập cho từng tác tử
hiện chưa được hỗ trợ.

## Thông báo

Tác tử con báo cáo ngược lại qua một bước thông báo:

- Bước thông báo chạy bên trong phiên tác tử con (không phải phiên của bên yêu cầu).
- Nếu tác tử con trả lời chính xác `ANNOUNCE_SKIP`, sẽ không có nội dung nào được đăng.
- Nếu văn bản mới nhất của trợ lý là token im lặng chính xác `NO_REPLY` / `no_reply`, đầu ra thông báo sẽ bị chặn ngay cả khi trước đó đã có tiến trình hiển thị công khai.

Cách gửi phụ thuộc vào độ sâu của bên yêu cầu:

- Các phiên yêu cầu cấp cao nhất sử dụng một lệnh gọi `agent` tiếp theo với chế độ gửi ra bên ngoài (`deliver=true`).
- Các phiên tác tử con yêu cầu lồng nhau nhận một lần chèn tiếp nối nội bộ (`deliver=false`) để bộ điều phối có thể tổng hợp kết quả của tác tử con ngay trong phiên.
- Nếu phiên tác tử con yêu cầu lồng nhau không còn tồn tại, OpenClaw sẽ quay về bên yêu cầu của phiên đó khi có thể.

Đối với các phiên yêu cầu cấp cao nhất, chế độ gửi trực tiếp khi hoàn tất
trước tiên phân giải mọi tuyến hội thoại/luồng đã liên kết và phần ghi đè
hook, sau đó điền các trường kênh-đích còn thiếu từ tuyến đã lưu của phiên
yêu cầu. Điều này giữ các kết quả hoàn tất trong đúng cuộc trò chuyện/chủ
đề ngay cả khi nguồn hoàn tất chỉ xác định được kênh.

Khi xây dựng các phát hiện hoàn tất lồng nhau, việc tổng hợp kết quả hoàn
tất của tác tử con chỉ giới hạn trong lượt chạy hiện tại của bên yêu cầu,
ngăn đầu ra cũ của tác tử con từ lượt chạy trước lọt vào thông báo hiện
tại. Phản hồi thông báo giữ nguyên định tuyến luồng/chủ đề khi bộ điều hợp
kênh hỗ trợ.

### Ngữ cảnh thông báo

Ngữ cảnh thông báo được chuẩn hóa thành một khối sự kiện nội bộ ổn định:

| Trường           | Nguồn                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Nguồn            | `subagent` hoặc `cron`                                                                                             |
| ID phiên          | Khóa/ID phiên của tác tử con                                                                                       |
| Loại              | Loại thông báo + nhãn tác vụ                                                                                       |
| Trạng thái        | Suy ra từ kết quả thời gian chạy (`ok`, `error`, `timeout` hoặc `unknown`) — **không** suy luận từ văn bản mô hình |
| Nội dung kết quả  | Văn bản trợ lý hiển thị mới nhất từ tác tử con                                                                     |
| Phản hồi tiếp theo | Chỉ dẫn mô tả khi nào cần trả lời và khi nào cần giữ im lặng                                                      |

Các lượt chạy kết thúc với lỗi sẽ báo cáo trạng thái thất bại mà không
phát lại văn bản phản hồi đã ghi nhận. Đầu ra `tool`/`toolResult` không
được đưa lên thành văn bản kết quả của tác tử con.

### Dòng thống kê

Tải trọng thông báo có một dòng thống kê ở cuối (ngay cả khi được bao bọc):

- Thời gian chạy (ví dụ: `runtime 5m12s`).
- Mức sử dụng token (đầu vào/đầu ra/tổng).
- Chi phí ước tính khi đã cấu hình giá mô hình (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` và đường dẫn bản ghi để tác tử chính có thể tìm nạp lịch sử qua `sessions_history` hoặc kiểm tra tệp trên đĩa.

Siêu dữ liệu nội bộ chỉ dành cho việc điều phối; các phản hồi hướng đến
người dùng nên được viết lại bằng giọng điệu trợ lý thông thường.

### Vì sao nên ưu tiên `sessions_history`

`sessions_history` là lộ trình điều phối an toàn hơn để đọc bản ghi của
tác tử con trong một lượt tác tử:

- Che nội dung giống thông tin xác thực/token ngay cả khi tính năng che dữ liệu nhật ký dùng chung bị tắt.
- Cắt ngắn các khối văn bản dài (4000 ký tự mỗi khối) và loại bỏ chữ ký suy nghĩ, tải trọng phát lại lập luận và dữ liệu hình ảnh nội tuyến.
- Áp dụng giới hạn phản hồi 80 KB; các hàng quá lớn được thay bằng `[sessions_history omitted: message too large]`.
- Sử dụng `nextOffset` khi có để phân trang ngược qua các cửa sổ bản ghi cũ hơn.
- `sessions_history` **không** loại bỏ các thẻ lập luận, khung `<relevant-memories>` hoặc XML lệnh gọi công cụ khỏi văn bản tin nhắn — nó trả về các khối nội dung có cấu trúc gần với dạng bản ghi thô, chỉ được che dữ liệu và giới hạn kích thước. `/subagents log` áp dụng bộ làm sạch văn xuôi mạnh hơn (loại bỏ thẻ lập luận, khung bộ nhớ và XML lệnh gọi công cụ) vì nó kết xuất các dòng trò chuyện thuần túy thay vì các khối có cấu trúc.
- Việc kiểm tra bản ghi thô trên đĩa là phương án dự phòng khi bạn cần toàn bộ bản ghi chính xác đến từng byte.

## Chính sách công cụ

Trước tiên, tác tử con sử dụng cùng hồ sơ và quy trình chính sách công cụ
như tác tử cha hoặc tác tử đích. Sau đó, OpenClaw áp dụng lớp hạn chế dành
cho tác tử con.

Tác tử con luôn mất quyền sử dụng `gateway`, `agents_list`,
`session_status` và `cron` bất kể độ sâu hay vai trò (các công cụ cấp hệ
thống/tương tác hoặc công cụ mà tác tử chính nên điều phối). Tác tử con ở
nút lá (hành vi mặc định ở độ sâu 1 và luôn áp dụng ở độ sâu 2) còn mất
thêm `subagents`, `sessions_list`, `sessions_history` và `sessions_spawn`.
Tác tử con không bao giờ nhận công cụ `message` — công cụ này bị vô hiệu
hóa tại thời điểm tạo, không phải bị lọc bởi danh sách từ chối này — và
`sessions_send` vẫn bị từ chối để tác tử con chỉ giao tiếp qua chuỗi thông
báo.

Ở đây, `sessions_history` vẫn là chế độ xem hồi tưởng được giới hạn và làm
sạch — không phải bản xuất bản ghi thô.

Khi `maxSpawnDepth >= 2`, các tác tử con làm bộ điều phối ở độ sâu 1 còn
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
        // deny được ưu tiên
        deny: ["gateway", "cron"],
        // nếu đặt allow, nó trở thành danh sách chỉ cho phép (deny vẫn được ưu tiên)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` là bộ lọc cuối cùng theo cơ chế chỉ cho phép.
Nó có thể thu hẹp tập hợp công cụ đã được phân giải, nhưng không thể
**thêm lại** công cụ đã bị `tools.profile` loại bỏ. Ví dụ:
`tools.profile: "coding"` bao gồm `web_search`/`web_fetch` nhưng không có
công cụ `browser`. Để cho phép tác tử con dùng hồ sơ lập trình sử dụng tự
động hóa trình duyệt, hãy thêm trình duyệt ở giai đoạn hồ sơ:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Sử dụng `agents.list[].tools.alsoAllow: ["browser"]` theo từng tác tử khi
chỉ một tác tử cần được cấp quyền tự động hóa trình duyệt.

## Đồng thời

Tác tử con sử dụng một làn hàng đợi chuyên biệt trong tiến trình:

- **Tên làn:** `subagent`
- **Mức đồng thời:** `agents.defaults.subagents.maxConcurrent` (mặc định là `8`)

## Khả năng hoạt động và phục hồi

OpenClaw không coi việc thiếu `endedAt` là bằng chứng vĩnh viễn rằng một
tác tử con vẫn đang hoạt động. Các lượt chạy chưa kết thúc nhưng cũ hơn
cửa sổ lượt chạy cũ (2 giờ hoặc thời gian chờ lượt chạy đã cấu hình cộng
thêm một khoảng gia hạn ngắn, tùy giá trị nào dài hơn) sẽ không còn được
tính là đang hoạt động/đang chờ trong `/subagents list`, bản tóm tắt trạng
thái, cơ chế chặn hoàn tất của tác tử hậu duệ và kiểm tra mức đồng thời
theo phiên.

Sau khi Gateway khởi động lại, các lượt chạy cũ chưa kết thúc được khôi
phục sẽ bị loại bỏ trừ khi phiên tác tử con của chúng được đánh dấu
`abortedLastRun: true`. Các lượt chạy bị hủy do khởi động lại vẫn được
đăng ký cho quy trình phục hồi tác tử con mồ côi: lượt chạy cũ được hoàn
tất mà không tiếp tục, còn các phiên tác tử con mới nhận một thông báo
tiếp tục tổng hợp trước khi dấu hủy bị xóa.

Việc tự động phục hồi sau khi khởi động lại được giới hạn theo từng phiên
tác tử con. Nếu cùng một tác tử con được chấp nhận phục hồi mồ côi nhiều
lần trong cửa sổ nhanh chóng bị kẹt lại, OpenClaw sẽ lưu một dấu mộ phục
hồi trên phiên đó và ngừng tự động tiếp tục phiên này trong các lần khởi
động lại sau. Chạy `openclaw tasks maintenance --apply` để đối soát bản
ghi tác vụ hoặc `openclaw doctor --fix` để xóa các cờ phục hồi bị hủy cũ
trên những phiên đã có dấu mộ.

<Note>
Nếu việc tạo tác tử con thất bại với Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, hãy kiểm tra bên gọi RPC trước khi chỉnh sửa trạng thái
ghép nối. Hoạt động điều phối `sessions_spawn` nội bộ được gửi trong tiến
trình khi bên gọi đã chạy trong ngữ cảnh yêu cầu Gateway, vì vậy nó không
mở WebSocket local loopback và không phụ thuộc vào phạm vi cơ sở của thiết
bị đã ghép nối của CLI. Các bên gọi bên ngoài tiến trình Gateway vẫn sử
dụng phương án dự phòng WebSocket dưới dạng `client.id: "gateway-client"`
với `client.mode: "backend"` qua xác thực token dùng chung/mật khẩu trên
local loopback trực tiếp. Bên gọi từ xa, `deviceIdentity` được chỉ định rõ,
đường dẫn token thiết bị được chỉ định rõ và các máy khách trình duyệt/Node
vẫn cần phê duyệt thiết bị thông thường để nâng cấp phạm vi.
</Note>

## Dừng

- Gửi `/stop` trong cuộc trò chuyện của bên yêu cầu sẽ hủy phiên yêu cầu và dừng mọi lượt chạy tác tử con đang hoạt động được tạo từ phiên đó, đồng thời lan truyền đến các tác tử con lồng nhau.

## Hạn chế

- Thông báo của tác nhân con được thực hiện theo cơ chế **nỗ lực tối đa**. Nếu Gateway khởi động lại, công việc "thông báo ngược lại" đang chờ xử lý sẽ bị mất.
- Các tác nhân con vẫn dùng chung tài nguyên của cùng một tiến trình Gateway; hãy xem `maxConcurrent` như một cơ chế bảo vệ an toàn.
- `sessions_spawn` luôn không chặn: hàm này trả về `{ status: "accepted", runId, childSessionKey }` ngay lập tức.
- Ngữ cảnh của tác nhân con chỉ chèn `AGENTS.md` và `TOOLS.md` (không chèn `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` hoặc `BOOTSTRAP.md`). Các tác nhân con gốc Codex tuân theo cùng một ranh giới: `TOOLS.md` vẫn nằm trong các chỉ dẫn của luồng Codex được kế thừa, còn các tệp về tính cách, danh tính và người dùng chỉ dành cho tác nhân cha được chèn dưới dạng chỉ dẫn cộng tác theo phạm vi lượt tương tác để các tác nhân con không sao chép chúng.
- Độ sâu lồng tối đa là 5 (phạm vi `maxSpawnDepth`: 1-5). Độ sâu 2 được khuyến nghị cho hầu hết trường hợp sử dụng.
- `maxChildrenPerAgent` giới hạn số tác nhân con đang hoạt động trong mỗi phiên (mặc định là `5`, phạm vi `1-20`).

## Liên quan

- [Công cụ phiên và các thay đổi trạng thái](/vi/concepts/session-tool)
- [Tác nhân ACP](/vi/tools/acp-agents)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Tác vụ nền](/vi/automation/tasks)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
