---
read_when:
    - Chỉnh sửa văn bản lời nhắc hệ thống, danh sách công cụ hoặc các phần thời gian/Heartbeat
    - Thay đổi hành vi khởi tạo không gian làm việc hoặc chèn Skills
summary: Lời nhắc hệ thống OpenClaw chứa những gì và được tập hợp như thế nào
title: Lời nhắc hệ thống
x-i18n:
    generated_at: "2026-04-29T22:40:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c6258ad35d679eaa2bb4d2446e9edfc6bb129888681a0e5d5527c54c5476971
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw xây dựng một system prompt tùy chỉnh cho mỗi lần chạy agent. Prompt này do **OpenClaw sở hữu** và không dùng prompt mặc định của pi-coding-agent.

Prompt được OpenClaw lắp ráp và chèn vào từng lần chạy agent.

Các Plugin provider có thể đóng góp hướng dẫn prompt có nhận biết cache mà không thay thế toàn bộ prompt do OpenClaw sở hữu. Runtime provider có thể:

- thay thế một tập nhỏ các phần lõi được đặt tên (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- chèn một **tiền tố ổn định** phía trên ranh giới prompt cache
- chèn một **hậu tố động** phía dưới ranh giới prompt cache

Dùng các đóng góp do provider sở hữu để tinh chỉnh riêng cho từng họ model. Giữ cơ chế đột biến prompt kế thừa
`before_prompt_build` cho tương thích hoặc các thay đổi prompt thật sự toàn cục, không phải hành vi provider thông thường.

Lớp phủ họ OpenAI GPT-5 giữ quy tắc thực thi lõi nhỏ gọn và bổ sung
hướng dẫn riêng cho model về bám persona, đầu ra súc tích, kỷ luật dùng công cụ,
tra cứu song song, bao phủ deliverable, xác minh, thiếu ngữ cảnh, và
vệ sinh công cụ terminal.

## Cấu trúc

Prompt được cố ý giữ gọn và dùng các phần cố định:

- **Công cụ**: nhắc nhở nguồn chân lý cho structured-tool cùng hướng dẫn dùng công cụ ở runtime.
- **Thiên hướng thực thi**: hướng dẫn theo đuổi đến cùng ngắn gọn: hành động ngay trong lượt với
  yêu cầu có thể thực hiện, tiếp tục cho đến khi xong hoặc bị chặn, phục hồi từ kết quả công cụ yếu,
  kiểm tra trạng thái dễ thay đổi trực tiếp, và xác minh trước khi hoàn tất.
- **An toàn**: nhắc nhở guardrail ngắn để tránh hành vi tìm kiếm quyền lực hoặc né tránh giám sát.
- **Skills** (khi có): cho model biết cách tải hướng dẫn skill khi cần.
- **Tự cập nhật OpenClaw**: cách kiểm tra config an toàn bằng
  `config.schema.lookup`, vá config bằng `config.patch`, thay thế toàn bộ
  config bằng `config.apply`, và chỉ chạy `update.run` khi có yêu cầu rõ ràng của người dùng. Công cụ chỉ dành cho owner `gateway` cũng từ chối viết lại
  `tools.exec.ask` / `tools.exec.security`, bao gồm các alias kế thừa `tools.bash.*`
  được chuẩn hóa về các đường dẫn exec được bảo vệ đó.
- **Workspace**: thư mục làm việc (`agents.defaults.workspace`).
- **Tài liệu**: đường dẫn cục bộ đến tài liệu OpenClaw (repo hoặc gói npm) và khi nào cần đọc.
- **Tệp Workspace (được chèn)**: cho biết các tệp bootstrap được đưa vào bên dưới.
- **Sandbox** (khi bật): cho biết runtime trong sandbox, đường dẫn sandbox, và liệu exec nâng quyền có sẵn hay không.
- **Ngày & giờ hiện tại**: giờ cục bộ của người dùng, múi giờ, và định dạng giờ.
- **Thẻ trả lời**: cú pháp thẻ trả lời tùy chọn cho các provider được hỗ trợ.
- **Heartbeats**: prompt heartbeat và hành vi ack, khi heartbeat được bật cho agent mặc định.
- **Runtime**: host, OS, node, model, repo root (khi phát hiện được), mức thinking (một dòng).
- **Reasoning**: mức hiển thị hiện tại + gợi ý bật/tắt /reasoning.

OpenClaw giữ nội dung lớn và ổn định, bao gồm **Ngữ cảnh dự án**, phía trên
ranh giới prompt cache nội bộ. Các phần channel/session dễ thay đổi như
hướng dẫn nhúng Control UI, **Nhắn tin**, **Giọng nói**, **Ngữ cảnh chat nhóm**,
**Phản ứng**, **Heartbeats**, và **Runtime** được nối thêm phía dưới ranh giới đó
để các backend cục bộ có prefix cache có thể tái sử dụng tiền tố workspace ổn định
qua các lượt channel. Mô tả công cụ cũng nên tránh nhúng tên channel hiện tại
khi schema được chấp nhận đã mang chi tiết runtime đó.

Phần Công cụ cũng bao gồm hướng dẫn runtime cho công việc chạy lâu:

- dùng cron cho follow-up trong tương lai (`check back later`, lời nhắc, công việc lặp lại)
  thay vì vòng lặp ngủ bằng `exec`, thủ thuật trì hoãn `yieldMs`, hoặc polling `process`
  lặp lại
- dùng `exec` / `process` chỉ cho các lệnh bắt đầu ngay bây giờ và tiếp tục chạy
  ở nền
- khi bật đánh thức hoàn tất tự động, khởi động lệnh một lần và dựa vào
  đường đánh thức dạng push khi nó phát output hoặc thất bại
- dùng `process` cho log, trạng thái, input, hoặc can thiệp khi bạn cần
  kiểm tra một lệnh đang chạy
- nếu tác vụ lớn hơn, ưu tiên `sessions_spawn`; việc hoàn tất sub-agent là
  dạng push và tự động thông báo lại cho người yêu cầu
- không polling `subagents list` / `sessions_list` trong vòng lặp chỉ để chờ
  hoàn tất

Khi công cụ thử nghiệm `update_plan` được bật, Công cụ cũng yêu cầu
model chỉ dùng nó cho công việc nhiều bước không tầm thường, giữ đúng một bước
`in_progress`, và tránh lặp lại toàn bộ kế hoạch sau mỗi lần cập nhật.

Safety guardrails trong system prompt chỉ mang tính khuyến nghị. Chúng hướng dẫn hành vi model nhưng không thực thi chính sách. Dùng chính sách công cụ, phê duyệt exec, sandboxing, và allowlist channel để thực thi cứng; operator có thể tắt các cơ chế này theo thiết kế.

Trên các channel có thẻ/nút phê duyệt gốc, runtime prompt hiện yêu cầu
agent dựa vào UI phê duyệt gốc đó trước. Nó chỉ nên bao gồm lệnh thủ công
`/approve` khi kết quả công cụ nói rằng phê duyệt qua chat không khả dụng hoặc
phê duyệt thủ công là đường duy nhất.

## Chế độ prompt

OpenClaw có thể render system prompt nhỏ hơn cho sub-agent. Runtime đặt
`promptMode` cho mỗi lần chạy (không phải config hướng tới người dùng):

- `full` (mặc định): bao gồm tất cả các phần ở trên.
- `minimal`: dùng cho sub-agent; bỏ qua **Skills**, **Gọi lại bộ nhớ**, **Tự cập nhật OpenClaw
  **, **Alias model**, **Danh tính người dùng**, **Thẻ trả lời**,
  **Nhắn tin**, **Trả lời im lặng**, và **Heartbeats**. Công cụ, **An toàn**,
  Workspace, Sandbox, Ngày & giờ hiện tại (khi biết), Runtime, và ngữ cảnh được chèn
  vẫn khả dụng.
- `none`: chỉ trả về dòng danh tính cơ sở.

Khi `promptMode=minimal`, các prompt được chèn thêm được gắn nhãn **Ngữ cảnh Subagent
** thay vì **Ngữ cảnh chat nhóm**.

Đối với các lần chạy tự động trả lời trên channel, OpenClaw có thể bỏ qua phần **Trả lời im lặng**
chung khi ngữ cảnh chat trực tiếp/nhóm đã bao gồm hành vi
`NO_REPLY` riêng cho cuộc trò chuyện đã được phân giải. Điều này tránh lặp lại cơ chế token
trong cả system prompt toàn cục và ngữ cảnh channel.

## Chèn bootstrap workspace

Các tệp bootstrap được cắt gọn và nối thêm dưới **Ngữ cảnh dự án** để model thấy ngữ cảnh danh tính và hồ sơ mà không cần đọc rõ ràng:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên workspace hoàn toàn mới)
- `MEMORY.md` khi có

Tất cả các tệp này được **chèn vào cửa sổ ngữ cảnh** ở mọi lượt trừ khi
có gate riêng cho tệp áp dụng. `HEARTBEAT.md` bị bỏ qua trong các lần chạy thông thường khi
heartbeats bị tắt cho agent mặc định hoặc
`agents.defaults.heartbeat.includeSystemPromptSection` là false. Giữ các tệp được chèn
ngắn gọn — đặc biệt là `MEMORY.md`, vì tệp này có thể lớn dần theo thời gian và dẫn đến
mức dùng ngữ cảnh cao bất ngờ và Compaction thường xuyên hơn.

<Note>
Các tệp hằng ngày `memory/*.md` **không** là một phần của Ngữ cảnh dự án bootstrap thông thường. Trong các lượt bình thường, chúng được truy cập khi cần qua các công cụ `memory_search` và `memory_get`, vì vậy chúng không tính vào cửa sổ ngữ cảnh trừ khi model đọc chúng một cách rõ ràng. Các lượt `/new` và `/reset` trống là ngoại lệ: runtime có thể thêm trước bộ nhớ hằng ngày gần đây dưới dạng khối ngữ cảnh khởi động một lần cho lượt đầu tiên đó.
</Note>

Các tệp lớn bị cắt ngắn với một marker. Kích thước tối đa mỗi tệp được kiểm soát bởi
`agents.defaults.bootstrapMaxChars` (mặc định: 12000). Tổng nội dung bootstrap được chèn
trên các tệp bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars`
(mặc định: 60000). Các tệp thiếu sẽ chèn một marker thiếu tệp ngắn. Khi xảy ra cắt ngắn,
OpenClaw có thể chèn một khối cảnh báo trong Ngữ cảnh dự án; kiểm soát điều này bằng
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
mặc định: `once`).

Các session sub-agent chỉ chèn `AGENTS.md` và `TOOLS.md` (các tệp bootstrap khác
bị lọc ra để giữ ngữ cảnh sub-agent nhỏ).

Hook nội bộ có thể chặn bước này qua `agent:bootstrap` để đột biến hoặc thay thế
các tệp bootstrap được chèn (ví dụ hoán đổi `SOUL.md` bằng một persona thay thế).

Nếu bạn muốn agent nghe bớt chung chung, hãy bắt đầu với
[Hướng dẫn tính cách SOUL.md](/vi/concepts/soul).

Để kiểm tra mỗi tệp được chèn đóng góp bao nhiêu (thô so với được chèn, cắt ngắn, cùng overhead schema công cụ), dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Xử lý thời gian

System prompt bao gồm một phần **Ngày & giờ hiện tại** riêng khi biết
múi giờ của người dùng. Để giữ prompt cache ổn định, hiện phần này chỉ bao gồm
**múi giờ** (không có đồng hồ động hoặc định dạng giờ).

Dùng `session_status` khi agent cần thời gian hiện tại; thẻ trạng thái
bao gồm một dòng timestamp. Cùng công cụ đó có thể tùy chọn đặt override model
theo session (`model=default` xóa nó).

Cấu hình bằng:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Ngày & giờ](/vi/date-time) để biết đầy đủ chi tiết hành vi.

## Skills

Khi có skills đủ điều kiện, OpenClaw chèn một **danh sách skills khả dụng** ngắn gọn
(`formatSkillsForPrompt`) bao gồm **đường dẫn tệp** cho từng skill. Prompt
hướng dẫn model dùng `read` để tải SKILL.md tại vị trí được liệt kê
(workspace, managed, hoặc bundled). Nếu không có skills nào đủ điều kiện, phần
Skills bị bỏ qua.

Điều kiện đủ bao gồm gate metadata của skill, kiểm tra môi trường/config runtime,
và allowlist skill hiệu lực của agent khi `agents.defaults.skills` hoặc
`agents.list[].skills` được cấu hình.

Skills đi kèm Plugin chỉ đủ điều kiện khi Plugin sở hữu chúng được bật.
Điều này cho phép các Plugin công cụ đưa ra hướng dẫn vận hành sâu hơn mà không nhúng toàn bộ
hướng dẫn đó trực tiếp trong mọi mô tả công cụ.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Điều này giữ prompt cơ sở nhỏ trong khi vẫn cho phép dùng skill có mục tiêu.

Ngân sách danh sách skills do subsystem skills sở hữu:

- Mặc định toàn cục: `skills.limits.maxSkillsPromptChars`
- Override theo agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Các đoạn trích runtime chung có giới hạn dùng một bề mặt khác:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Sự tách biệt đó giữ kích thước skills tách khỏi kích thước đọc/chèn runtime như
`memory_get`, kết quả công cụ trực tiếp, và làm mới AGENTS.md sau Compaction.

## Tài liệu

System prompt bao gồm một phần **Tài liệu**. Khi tài liệu cục bộ khả dụng, phần này
trỏ đến thư mục tài liệu OpenClaw cục bộ (`docs/` trong Git checkout hoặc tài liệu gói npm
được đóng gói). Nếu tài liệu cục bộ không khả dụng, nó fallback sang
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Cùng phần này cũng bao gồm vị trí nguồn OpenClaw. Git checkout hiển thị source root cục bộ
để agent có thể kiểm tra code trực tiếp. Bản cài đặt từ gói bao gồm URL nguồn GitHub
và yêu cầu agent xem xét nguồn ở đó bất cứ khi nào tài liệu không đầy đủ hoặc
cũ. Prompt cũng ghi chú mirror tài liệu công khai, Discord cộng đồng, và ClawHub
([https://clawhub.ai](https://clawhub.ai)) để khám phá skills. Nó yêu cầu model
tham khảo tài liệu trước cho hành vi, lệnh, cấu hình, hoặc kiến trúc OpenClaw, và tự
chạy `openclaw status` khi có thể (chỉ hỏi người dùng khi không có quyền truy cập).
Riêng với cấu hình, nó trỏ agent đến action công cụ `gateway`
`config.schema.lookup` để có tài liệu và ràng buộc chính xác ở cấp trường, rồi đến
`docs/gateway/configuration.md` và `docs/gateway/configuration-reference.md`
để có hướng dẫn rộng hơn.

## Liên quan

- [Runtime agent](/vi/concepts/agent)
- [Workspace agent](/vi/concepts/agent-workspace)
- [Engine ngữ cảnh](/vi/concepts/context-engine)
