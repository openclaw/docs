---
read_when:
    - Chỉnh sửa văn bản lời nhắc hệ thống, danh sách công cụ hoặc các phần thời gian/Heartbeat
    - Thay đổi hành vi khởi tạo không gian làm việc hoặc chèn Skills
summary: Prompt hệ thống của OpenClaw chứa những gì và được tập hợp như thế nào
title: Lời nhắc hệ thống
x-i18n:
    generated_at: "2026-05-02T20:43:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b29c354ea4b3f48fd7279614677905b3065bc0afa6741fb4273ef229e8cebb
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw xây dựng một system prompt tùy chỉnh cho mỗi lần chạy agent. Prompt này thuộc sở hữu của **OpenClaw** và không sử dụng prompt mặc định của pi-coding-agent.

Prompt được OpenClaw lắp ráp và tiêm vào từng lần chạy agent.

Plugin nhà cung cấp có thể đóng góp hướng dẫn prompt nhận biết cache mà không thay thế
toàn bộ prompt thuộc sở hữu của OpenClaw. Runtime của nhà cung cấp có thể:

- thay thế một tập nhỏ các phần lõi có tên (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- tiêm một **tiền tố ổn định** phía trên ranh giới cache prompt
- tiêm một **hậu tố động** phía dưới ranh giới cache prompt

Dùng các đóng góp do nhà cung cấp sở hữu để tinh chỉnh riêng cho từng họ mô hình. Giữ cơ chế
đột biến prompt `before_prompt_build` cũ để tương thích hoặc cho các thay đổi prompt thật sự
toàn cục, không phải hành vi nhà cung cấp thông thường.

Lớp phủ họ OpenAI GPT-5 giữ quy tắc thực thi lõi nhỏ gọn và thêm
hướng dẫn riêng cho mô hình về việc bám chặt persona, đầu ra súc tích, kỷ luật dùng công cụ,
tra cứu song song, bao phủ đầy đủ sản phẩm bàn giao, xác minh, thiếu ngữ cảnh, và
vệ sinh công cụ terminal.

## Cấu trúc

Prompt được cố ý giữ gọn và dùng các phần cố định:

- **Công cụ**: nhắc nhở nguồn chân lý cho công cụ có cấu trúc cộng với hướng dẫn sử dụng công cụ ở runtime.
- **Thiên hướng thực thi**: hướng dẫn theo sát đến cùng dạng ngắn gọn: hành động ngay trong lượt với
  các yêu cầu có thể thực hiện, tiếp tục cho đến khi hoàn tất hoặc bị chặn, phục hồi từ kết quả công cụ
  yếu, kiểm tra trực tiếp trạng thái có thể thay đổi, và xác minh trước khi hoàn tất.
- **An toàn**: nhắc nhở rào chắn ngắn để tránh hành vi tìm kiếm quyền lực hoặc né tránh giám sát.
- **Skills** (khi có): cho mô hình biết cách tải hướng dẫn skill theo nhu cầu.
- **Tự cập nhật OpenClaw**: cách kiểm tra cấu hình an toàn bằng
  `config.schema.lookup`, vá cấu hình bằng `config.patch`, thay thế toàn bộ
  cấu hình bằng `config.apply`, và chỉ chạy `update.run` khi người dùng
  yêu cầu rõ ràng. Công cụ chỉ dành cho chủ sở hữu `gateway` cũng từ chối ghi lại
  `tools.exec.ask` / `tools.exec.security`, bao gồm các bí danh cũ `tools.bash.*`
  được chuẩn hóa về các đường dẫn exec được bảo vệ đó.
- **Workspace**: thư mục làm việc (`agents.defaults.workspace`).
- **Tài liệu**: đường dẫn cục bộ tới tài liệu OpenClaw (repo hoặc gói npm) và khi nào cần đọc chúng.
- **Tệp Workspace (được tiêm)**: cho biết các tệp bootstrap được đưa vào bên dưới.
- **Sandbox** (khi bật): cho biết runtime bị sandbox, các đường dẫn sandbox, và exec nâng quyền có khả dụng hay không.
- **Ngày & giờ hiện tại**: thời gian cục bộ của người dùng, múi giờ, và định dạng thời gian.
- **Thẻ trả lời**: cú pháp thẻ trả lời tùy chọn cho các nhà cung cấp được hỗ trợ.
- **Heartbeat**: prompt heartbeat và hành vi ack, khi heartbeat được bật cho agent mặc định.
- **Runtime**: host, OS, node, mô hình, gốc repo (khi phát hiện), mức suy nghĩ (một dòng).
- **Suy luận**: mức hiển thị hiện tại + gợi ý bật/tắt /reasoning.

OpenClaw giữ nội dung ổn định lớn, bao gồm **Ngữ cảnh dự án**, phía trên
ranh giới cache prompt nội bộ. Các phần channel/session biến động như
hướng dẫn nhúng Control UI, **Nhắn tin**, **Giọng nói**, **Ngữ cảnh trò chuyện nhóm**,
**Phản ứng**, **Heartbeat**, và **Runtime** được nối thêm bên dưới ranh giới đó
để các backend cục bộ có cache tiền tố có thể tái sử dụng tiền tố workspace ổn định
qua các lượt channel. Mô tả công cụ cũng nên tránh nhúng tên channel hiện tại
khi schema được chấp nhận đã mang chi tiết runtime đó.

Phần Công cụ cũng bao gồm hướng dẫn runtime cho công việc chạy lâu:

- dùng cron cho việc theo dõi trong tương lai (`check back later`, lời nhắc, công việc lặp lại)
  thay vì vòng lặp ngủ `exec`, thủ thuật trì hoãn `yieldMs`, hoặc polling `process`
  lặp lại
- dùng `exec` / `process` chỉ cho các lệnh bắt đầu ngay bây giờ và tiếp tục chạy
  trong nền
- khi đánh thức hoàn tất tự động được bật, khởi động lệnh một lần và dựa vào
  đường dẫn đánh thức push-based khi nó phát output hoặc thất bại
- dùng `process` cho log, trạng thái, input, hoặc can thiệp khi bạn cần
  kiểm tra một lệnh đang chạy
- nếu tác vụ lớn hơn, ưu tiên `sessions_spawn`; hoàn tất của sub-agent là
  push-based và tự động thông báo lại cho người yêu cầu
- không polling `subagents list` / `sessions_list` trong vòng lặp chỉ để chờ
  hoàn tất

Khi công cụ thử nghiệm `update_plan` được bật, Công cụ cũng cho mô hình biết
chỉ dùng nó cho công việc nhiều bước không tầm thường, luôn giữ đúng một bước
`in_progress`, và tránh lặp lại toàn bộ kế hoạch sau mỗi lần cập nhật.

Các rào chắn an toàn trong system prompt mang tính khuyến nghị. Chúng hướng dẫn hành vi mô hình nhưng không thực thi chính sách. Dùng chính sách công cụ, phê duyệt exec, sandboxing, và allowlist channel để thực thi cứng; operator có thể tắt các cơ chế này theo thiết kế.

Trên các channel có thẻ/nút phê duyệt native, prompt runtime giờ cho
agent biết hãy ưu tiên dựa vào UI phê duyệt native đó. Nó chỉ nên đưa vào lệnh
`/approve` thủ công khi kết quả công cụ nói rằng phê duyệt qua chat không khả dụng hoặc
phê duyệt thủ công là đường dẫn duy nhất.

## Chế độ prompt

OpenClaw có thể render system prompt nhỏ hơn cho sub-agent. Runtime đặt một
`promptMode` cho mỗi lần chạy (không phải cấu hình hướng tới người dùng):

- `full` (mặc định): bao gồm tất cả các phần ở trên.
- `minimal`: dùng cho sub-agent; bỏ qua **Skills**, **Memory Recall**, **Tự cập nhật OpenClaw**,
  **Bí danh mô hình**, **Danh tính người dùng**, **Thẻ trả lời**,
  **Nhắn tin**, **Trả lời im lặng**, và **Heartbeat**. Công cụ, **An toàn**,
  Workspace, Sandbox, Ngày & giờ hiện tại (khi biết), Runtime, và ngữ cảnh
  được tiêm vẫn khả dụng.
- `none`: chỉ trả về dòng danh tính cơ sở.

Khi `promptMode=minimal`, các prompt được tiêm thêm được gắn nhãn **Ngữ cảnh Subagent**
thay vì **Ngữ cảnh trò chuyện nhóm**.

Đối với các lần chạy tự động trả lời của channel, OpenClaw có thể bỏ qua phần **Trả lời im lặng**
chung khi ngữ cảnh chat trực tiếp/nhóm đã bao gồm hành vi `NO_REPLY`
riêng cho cuộc trò chuyện đã được phân giải. Điều này tránh lặp lại cơ chế token
trong cả system prompt toàn cục và ngữ cảnh channel.

## Snapshot prompt

OpenClaw giữ các snapshot prompt happy-path đã commit cho runtime Codex/message-tool
trong `test/fixtures/agents/prompt-snapshots/happy-path/`. Chúng render
hướng dẫn developer app-server Codex thuộc sở hữu của OpenClaw, các tham số
bắt đầu/tiếp tục thread được chọn, input người dùng của lượt, và đặc tả công cụ động cho Telegram trực tiếp,
nhóm Discord, và các lượt heartbeat. System prompt Codex cơ sở ẩn và
hướng dẫn chế độ cộng tác Codex theo phạm vi lượt thuộc sở hữu của runtime Codex
và không được OpenClaw render.

Tạo lại chúng bằng `pnpm prompt:snapshots:gen` và xác minh drift bằng
`pnpm prompt:snapshots:check`.

## Tiêm bootstrap Workspace

Các tệp bootstrap được cắt gọn và nối thêm dưới **Ngữ cảnh dự án** để mô hình thấy ngữ cảnh danh tính và hồ sơ mà không cần đọc rõ ràng:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên workspace hoàn toàn mới)
- `MEMORY.md` khi có

Tất cả các tệp này được **tiêm vào cửa sổ ngữ cảnh** ở mọi lượt trừ khi
áp dụng một cổng riêng theo tệp. `HEARTBEAT.md` bị bỏ qua trong các lần chạy thông thường khi
heartbeat bị tắt cho agent mặc định hoặc
`agents.defaults.heartbeat.includeSystemPromptSection` là false. Giữ các tệp được tiêm
ngắn gọn — đặc biệt là `MEMORY.md`, tệp này có thể lớn dần theo thời gian và dẫn tới
mức sử dụng ngữ cảnh cao bất ngờ và Compaction thường xuyên hơn.

<Note>
Các tệp hằng ngày `memory/*.md` **không** thuộc Ngữ cảnh dự án bootstrap thông thường. Trong các lượt bình thường, chúng được truy cập theo nhu cầu qua các công cụ `memory_search` và `memory_get`, nên chúng không tính vào cửa sổ ngữ cảnh trừ khi mô hình đọc chúng một cách rõ ràng. Các lượt `/new` và `/reset` trần là ngoại lệ: runtime có thể thêm trước bộ nhớ hằng ngày gần đây dưới dạng một khối ngữ cảnh khởi động dùng một lần cho lượt đầu tiên đó.
</Note>

Các tệp lớn bị cắt ngắn bằng một marker. Kích thước tối đa theo từng tệp được kiểm soát bởi
`agents.defaults.bootstrapMaxChars` (mặc định: 12000). Tổng nội dung bootstrap được tiêm
trên các tệp bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars`
(mặc định: 60000). Tệp thiếu sẽ tiêm một marker thiếu tệp ngắn. Khi xảy ra cắt ngắn,
OpenClaw có thể tiêm một khối cảnh báo vào Ngữ cảnh dự án; kiểm soát điều này bằng
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
mặc định: `once`).

Phiên sub-agent chỉ tiêm `AGENTS.md` và `TOOLS.md` (các tệp bootstrap khác
được lọc ra để giữ ngữ cảnh sub-agent nhỏ).

Hook nội bộ có thể chặn bước này qua `agent:bootstrap` để sửa đổi hoặc thay thế
các tệp bootstrap được tiêm (ví dụ đổi `SOUL.md` sang một persona thay thế).

Nếu bạn muốn agent nghe bớt chung chung, hãy bắt đầu với
[Hướng dẫn tính cách SOUL.md](/vi/concepts/soul).

Để kiểm tra mỗi tệp được tiêm đóng góp bao nhiêu (thô so với đã tiêm, cắt ngắn, cộng với overhead schema công cụ), dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Xử lý thời gian

System prompt bao gồm một phần **Ngày & giờ hiện tại** riêng khi biết
múi giờ của người dùng. Để giữ prompt ổn định với cache, giờ đây nó chỉ bao gồm
**múi giờ** (không có đồng hồ động hoặc định dạng thời gian).

Dùng `session_status` khi agent cần thời gian hiện tại; thẻ trạng thái
bao gồm một dòng timestamp. Cùng công cụ đó có thể tùy chọn đặt một ghi đè mô hình theo phiên
(`model=default` sẽ xóa nó).

Cấu hình bằng:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Ngày & giờ](/vi/date-time) để biết đầy đủ chi tiết hành vi.

## Skills

Khi có skill đủ điều kiện, OpenClaw tiêm một **danh sách skills khả dụng**
(`formatSkillsForPrompt`) nhỏ gọn bao gồm **đường dẫn tệp** cho từng skill. Prompt
hướng dẫn mô hình dùng `read` để tải SKILL.md tại vị trí được liệt kê
(workspace, managed, hoặc bundled). Nếu không có skill nào đủ điều kiện, phần
Skills bị bỏ qua.

Điều kiện đủ bao gồm các cổng metadata skill, kiểm tra môi trường/cấu hình runtime,
và allowlist skill hiệu lực của agent khi `agents.defaults.skills` hoặc
`agents.list[].skills` được cấu hình.

Skills đi kèm Plugin chỉ đủ điều kiện khi Plugin sở hữu chúng được bật.
Điều này cho phép Plugin công cụ đưa ra các hướng dẫn vận hành sâu hơn mà không nhúng toàn bộ
hướng dẫn đó trực tiếp vào mọi mô tả công cụ.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Điều này giữ prompt cơ sở nhỏ gọn trong khi vẫn cho phép dùng skill có mục tiêu.

Ngân sách danh sách skills thuộc sở hữu của hệ thống con skills:

- Mặc định toàn cục: `skills.limits.maxSkillsPromptChars`
- Ghi đè theo agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Các đoạn trích runtime bị giới hạn chung dùng một bề mặt khác:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Sự tách biệt đó giữ kích thước skills tách khỏi kích thước đọc/tiêm runtime như
`memory_get`, kết quả công cụ trực tiếp, và làm mới AGENTS.md sau Compaction.

## Tài liệu

System prompt bao gồm một phần **Tài liệu**. Khi tài liệu cục bộ khả dụng, nó
trỏ tới thư mục tài liệu OpenClaw cục bộ (`docs/` trong bản checkout Git hoặc tài liệu gói npm
đi kèm). Nếu tài liệu cục bộ không khả dụng, nó fallback về
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Cùng phần đó cũng bao gồm vị trí nguồn OpenClaw. Các bản checkout Git phơi bày gốc nguồn
cục bộ để agent có thể kiểm tra mã trực tiếp. Các bản cài đặt gói bao gồm URL nguồn
GitHub và yêu cầu agent xem lại nguồn ở đó bất cứ khi nào tài liệu chưa đầy đủ hoặc
lỗi thời. Prompt cũng ghi chú mirror tài liệu công khai, Discord cộng đồng, và ClawHub
([https://clawhub.ai](https://clawhub.ai)) để khám phá skills. Nó yêu cầu mô hình
tham khảo tài liệu trước cho hành vi, lệnh, cấu hình, hoặc kiến trúc OpenClaw, và
tự chạy `openclaw status` khi có thể (chỉ hỏi người dùng khi nó thiếu quyền truy cập).
Riêng với cấu hình, nó trỏ agent tới action công cụ `gateway`
`config.schema.lookup` để có tài liệu và ràng buộc chính xác ở cấp trường, rồi tới
`docs/gateway/configuration.md` và `docs/gateway/configuration-reference.md`
để có hướng dẫn rộng hơn.

## Liên quan

- [Môi trường chạy của tác nhân](/vi/concepts/agent)
- [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
