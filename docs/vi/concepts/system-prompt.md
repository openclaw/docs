---
read_when:
    - Chỉnh sửa văn bản lời nhắc hệ thống, danh sách công cụ hoặc các phần thời gian/Heartbeat
    - Thay đổi hành vi khởi tạo không gian làm việc hoặc chèn Skills
summary: Lời nhắc hệ thống của OpenClaw chứa gì và được lắp ráp như thế nào
title: Lời nhắc hệ thống
x-i18n:
    generated_at: "2026-05-03T21:30:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93533ac8090897a7b5fd82b80e542a4ad573670408314b3519c5e317d0408ade
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw xây dựng một system prompt tùy chỉnh cho mỗi lần chạy agent. Prompt này thuộc **sở hữu của OpenClaw** và không dùng prompt mặc định của pi-coding-agent.

Prompt được OpenClaw lắp ráp và tiêm vào mỗi lần chạy agent.

Các Plugin nhà cung cấp có thể đóng góp hướng dẫn prompt nhận biết bộ nhớ đệm mà không thay thế
toàn bộ prompt thuộc sở hữu của OpenClaw. Runtime của nhà cung cấp có thể:

- thay thế một tập nhỏ các phần lõi có tên (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- tiêm một **tiền tố ổn định** phía trên ranh giới bộ nhớ đệm prompt
- tiêm một **hậu tố động** phía dưới ranh giới bộ nhớ đệm prompt

Dùng các đóng góp do nhà cung cấp sở hữu cho việc tinh chỉnh theo từng họ mô hình. Giữ lại cơ chế đột biến prompt
`before_prompt_build` cũ để tương thích hoặc cho các thay đổi prompt thực sự mang tính toàn cục,
không phải hành vi nhà cung cấp thông thường.

Lớp phủ cho họ OpenAI GPT-5 giữ quy tắc thực thi lõi ở mức nhỏ và thêm
hướng dẫn dành riêng cho mô hình về việc bám persona, đầu ra súc tích, kỷ luật dùng công cụ,
tra cứu song song, bao phủ sản phẩm bàn giao, xác minh, thiếu ngữ cảnh, và
vệ sinh công cụ terminal.

## Cấu trúc

Prompt được cố ý giữ gọn và dùng các phần cố định:

- **Công cụ**: nhắc nhở về nguồn chân lý cho công cụ có cấu trúc cùng hướng dẫn dùng công cụ ở runtime.
- **Thiên hướng thực thi**: hướng dẫn theo sát gọn nhẹ: hành động ngay trong lượt với
  các yêu cầu có thể thực hiện, tiếp tục cho đến khi xong hoặc bị chặn, phục hồi từ kết quả công cụ yếu,
  kiểm tra trực tiếp trạng thái có thể thay đổi, và xác minh trước khi hoàn tất.
- **An toàn**: nhắc nhở rào chắn ngắn để tránh hành vi tìm kiếm quyền lực hoặc vượt qua giám sát.
- **Skills** (khi có): cho mô hình biết cách tải hướng dẫn skill theo nhu cầu.
- **OpenClaw tự cập nhật**: cách kiểm tra cấu hình an toàn bằng
  `config.schema.lookup`, vá cấu hình bằng `config.patch`, thay thế toàn bộ
  cấu hình bằng `config.apply`, và chỉ chạy `update.run` khi người dùng yêu cầu
  rõ ràng. Công cụ chỉ dành cho chủ sở hữu `gateway` cũng từ chối viết lại
  `tools.exec.ask` / `tools.exec.security`, bao gồm cả các bí danh cũ `tools.bash.*`
  được chuẩn hóa về các đường dẫn exec được bảo vệ đó.
- **Workspace**: thư mục làm việc (`agents.defaults.workspace`).
- **Tài liệu**: đường dẫn cục bộ tới tài liệu OpenClaw (repo hoặc npm package) và khi nào cần đọc.
- **Tệp workspace (được tiêm)**: cho biết các tệp bootstrap được bao gồm bên dưới.
- **Sandbox** (khi bật): cho biết runtime được sandbox, các đường dẫn sandbox, và liệu exec nâng quyền có khả dụng hay không.
- **Ngày & giờ hiện tại**: giờ cục bộ của người dùng, múi giờ, và định dạng thời gian.
- **Thẻ trả lời**: cú pháp thẻ trả lời tùy chọn cho các nhà cung cấp được hỗ trợ.
- **Heartbeat**: prompt heartbeat và hành vi xác nhận, khi heartbeat được bật cho agent mặc định.
- **Runtime**: host, OS, node, mô hình, gốc repo (khi phát hiện được), mức suy nghĩ (một dòng).
- **Lập luận**: mức hiển thị hiện tại + gợi ý bật/tắt /reasoning.

OpenClaw giữ nội dung lớn ổn định, bao gồm **Ngữ cảnh dự án**, phía trên
ranh giới bộ nhớ đệm prompt nội bộ. Các phần kênh/phiên dễ thay đổi như
hướng dẫn nhúng Control UI, **Nhắn tin**, **Giọng nói**, **Ngữ cảnh chat nhóm**,
**Phản ứng**, **Heartbeat**, và **Runtime** được nối thêm phía dưới ranh giới đó
để các backend cục bộ có bộ nhớ đệm tiền tố có thể tái sử dụng tiền tố workspace ổn định
qua các lượt kênh. Mô tả công cụ cũng nên tránh nhúng tên kênh hiện tại
khi schema được chấp nhận đã mang chi tiết runtime đó.

Phần Công cụ cũng bao gồm hướng dẫn runtime cho công việc chạy lâu:

- dùng cron cho việc theo dõi trong tương lai (`check back later`, lời nhắc, công việc lặp lại)
  thay vì các vòng lặp ngủ bằng `exec`, thủ thuật trì hoãn `yieldMs`, hoặc lặp lại việc thăm dò `process`
- dùng `exec` / `process` chỉ cho các lệnh bắt đầu ngay và tiếp tục chạy
  ở nền
- khi bật đánh thức hoàn tất tự động, khởi động lệnh một lần và dựa vào
  đường đánh thức dựa trên push khi nó phát ra đầu ra hoặc thất bại
- dùng `process` cho nhật ký, trạng thái, đầu vào, hoặc can thiệp khi bạn cần
  kiểm tra một lệnh đang chạy
- nếu tác vụ lớn hơn, ưu tiên `sessions_spawn`; hoàn tất của sub-agent
  dựa trên push và tự động thông báo lại cho người yêu cầu
- không thăm dò `subagents list` / `sessions_list` trong vòng lặp chỉ để chờ
  hoàn tất

Khi công cụ thử nghiệm `update_plan` được bật, Công cụ cũng yêu cầu
mô hình chỉ dùng nó cho công việc nhiều bước không tầm thường, giữ đúng một bước
`in_progress`, và tránh lặp lại toàn bộ kế hoạch sau mỗi lần cập nhật.

Các rào chắn an toàn trong system prompt mang tính khuyến nghị. Chúng định hướng hành vi mô hình nhưng không cưỡng chế chính sách. Dùng chính sách công cụ, phê duyệt exec, sandboxing, và danh sách cho phép kênh để cưỡng chế cứng; các toán tử có thể vô hiệu hóa chúng theo thiết kế.

Trên các kênh có thẻ/nút phê duyệt gốc, runtime prompt hiện yêu cầu
agent trước hết dựa vào UI phê duyệt gốc đó. Nó chỉ nên bao gồm lệnh
`/approve` thủ công khi kết quả công cụ cho biết phê duyệt qua chat không khả dụng hoặc
phê duyệt thủ công là đường duy nhất.

## Chế độ prompt

OpenClaw có thể kết xuất system prompt nhỏ hơn cho sub-agent. Runtime đặt một
`promptMode` cho mỗi lần chạy (không phải cấu hình hướng tới người dùng):

- `full` (mặc định): bao gồm tất cả các phần ở trên.
- `minimal`: dùng cho sub-agent; bỏ qua **Skills**, **Gọi lại bộ nhớ**, **OpenClaw
  tự cập nhật**, **Bí danh mô hình**, **Danh tính người dùng**, **Thẻ trả lời**,
  **Nhắn tin**, **Trả lời im lặng**, và **Heartbeat**. Công cụ, **An toàn**,
  Workspace, Sandbox, Ngày & giờ hiện tại (khi biết), Runtime, và ngữ cảnh được tiêm
  vẫn khả dụng.
- `none`: chỉ trả về dòng danh tính cơ sở.

Khi `promptMode=minimal`, các prompt được tiêm thêm được gắn nhãn **Ngữ cảnh subagent**
thay vì **Ngữ cảnh chat nhóm**.

Với các lần chạy tự động trả lời theo kênh, OpenClaw có thể bỏ qua phần **Trả lời im lặng**
chung khi ngữ cảnh chat trực tiếp/nhóm đã bao gồm hành vi `NO_REPLY`
cụ thể theo cuộc trò chuyện đã được phân giải. Điều này tránh lặp lại cơ chế token
trong cả system prompt toàn cục và ngữ cảnh kênh.

## Ảnh chụp prompt

OpenClaw giữ các ảnh chụp prompt đã commit cho đường chạy thành công của runtime Codex dưới
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Chúng kết xuất
các tham số thread/turn app-server được chọn cùng một ngăn xếp lớp prompt gắn với mô hình được tái dựng
cho các lượt Telegram trực tiếp, Discord nhóm, và heartbeat. Ngăn xếp đó
bao gồm một fixture prompt mô hình Codex `gpt-5.5` được ghim, tạo từ hình dạng
catalog/bộ nhớ đệm mô hình của Codex, văn bản developer quyền hạn đường chạy thành công của Codex,
hướng dẫn developer OpenClaw, hướng dẫn chế độ cộng tác theo phạm vi lượt
khi OpenClaw cung cấp chúng, đầu vào lượt người dùng, và tham chiếu tới các đặc tả công cụ động.

Làm mới fixture prompt mô hình Codex được ghim bằng
`pnpm prompt:snapshots:sync-codex-model`. Theo mặc định, script tìm
bộ nhớ đệm runtime của Codex tại `$CODEX_HOME/models_cache.json`, rồi
`~/.codex/models_cache.json`, và chỉ sau đó mới fallback về quy ước checkout Codex
của maintainer tại `~/code/codex/codex-rs/models-manager/models.json`. Nếu
không có nguồn nào trong số đó tồn tại, lệnh thoát mà không thay đổi
fixture đã commit. Truyền `--catalog <path>` để làm mới từ một tệp `models_cache.json`
hoặc `models.json` cụ thể.

Các ảnh chụp này vẫn không phải bản chụp yêu cầu OpenAI thô khớp từng byte. Codex
có thể thêm ngữ cảnh workspace thuộc sở hữu runtime như `AGENTS.md`, ngữ cảnh
môi trường, bộ nhớ, hướng dẫn app/plugin, và hướng dẫn chế độ cộng tác Default
tích hợp bên trong runtime Codex sau khi OpenClaw gửi
tham số thread và turn.

Tạo lại chúng bằng `pnpm prompt:snapshots:gen` và xác minh drift bằng
`pnpm prompt:snapshots:check`. CI chạy kiểm tra drift trong shard ranh giới
bổ sung để các thay đổi prompt và cập nhật ảnh chụp luôn gắn với cùng
PR.

## Tiêm bootstrap workspace

Các tệp bootstrap được cắt gọn và nối thêm dưới **Ngữ cảnh dự án** để mô hình thấy ngữ cảnh danh tính và hồ sơ mà không cần đọc rõ ràng:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên workspace hoàn toàn mới)
- `MEMORY.md` khi có

Tất cả các tệp này được **tiêm vào cửa sổ ngữ cảnh** ở mỗi lượt trừ khi
áp dụng cổng riêng theo tệp. `HEARTBEAT.md` bị bỏ qua trong các lần chạy bình thường khi
heartbeat bị tắt cho agent mặc định hoặc
`agents.defaults.heartbeat.includeSystemPromptSection` là false. Giữ các tệp được tiêm
ngắn gọn — đặc biệt là `MEMORY.md`, vốn có thể tăng theo thời gian và dẫn tới
mức sử dụng ngữ cảnh cao bất ngờ và Compaction thường xuyên hơn.

Khi một phiên chạy trên harness Codex gốc, Codex tải `AGENTS.md`
thông qua cơ chế khám phá tài liệu dự án riêng. OpenClaw vẫn phân giải các
tệp bootstrap còn lại và chuyển tiếp chúng dưới dạng hướng dẫn cấu hình Codex, vì vậy `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, và
`MEMORY.md` giữ cùng vai trò ngữ cảnh workspace mà không nhân đôi
`AGENTS.md`.

<Note>
Các tệp hằng ngày `memory/*.md` **không** phải một phần của Ngữ cảnh dự án bootstrap thông thường. Ở các lượt bình thường, chúng được truy cập theo nhu cầu qua các công cụ `memory_search` và `memory_get`, vì vậy chúng không tính vào cửa sổ ngữ cảnh trừ khi mô hình đọc chúng một cách rõ ràng. Các lượt `/new` và `/reset` trần là ngoại lệ: runtime có thể thêm trước bộ nhớ hằng ngày gần đây như một khối ngữ cảnh khởi động dùng một lần cho lượt đầu tiên đó.
</Note>

Các tệp lớn bị cắt ngắn kèm một marker. Kích thước tối đa mỗi tệp được kiểm soát bởi
`agents.defaults.bootstrapMaxChars` (mặc định: 12000). Tổng nội dung bootstrap được tiêm
trên các tệp bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars`
(mặc định: 60000). Tệp bị thiếu tiêm một marker tệp thiếu ngắn. Khi xảy ra cắt ngắn,
OpenClaw có thể tiêm một khối cảnh báo trong Ngữ cảnh dự án; kiểm soát điều này bằng
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
mặc định: `once`).

Các phiên sub-agent chỉ tiêm `AGENTS.md` và `TOOLS.md` (các tệp bootstrap khác
được lọc ra để giữ ngữ cảnh sub-agent nhỏ).

Các hook nội bộ có thể chặn bước này qua `agent:bootstrap` để đột biến hoặc thay thế
các tệp bootstrap được tiêm (ví dụ thay `SOUL.md` bằng một persona thay thế).

Nếu bạn muốn làm agent nghe bớt chung chung, hãy bắt đầu với
[Hướng dẫn tính cách SOUL.md](/vi/concepts/soul).

Để kiểm tra mỗi tệp được tiêm đóng góp bao nhiêu (thô so với được tiêm, cắt ngắn, cộng thêm phần vượt mức schema công cụ), dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Xử lý thời gian

System prompt bao gồm phần **Ngày & giờ hiện tại** riêng khi biết
múi giờ của người dùng. Để giữ prompt ổn định với bộ nhớ đệm, hiện nó chỉ bao gồm
**múi giờ** (không có đồng hồ động hoặc định dạng thời gian).

Dùng `session_status` khi agent cần thời gian hiện tại; thẻ trạng thái
bao gồm một dòng timestamp. Cùng công cụ đó có thể tùy chọn đặt ghi đè mô hình theo phiên
(`model=default` xóa nó).

Cấu hình bằng:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Ngày & giờ](/vi/date-time) để biết đầy đủ chi tiết hành vi.

## Skills

Khi tồn tại các skill đủ điều kiện, OpenClaw tiêm một **danh sách skills khả dụng**
gọn nhẹ (`formatSkillsForPrompt`) bao gồm **đường dẫn tệp** cho mỗi skill. Prompt
hướng dẫn mô hình dùng `read` để tải SKILL.md tại vị trí được liệt kê
(workspace, managed, hoặc bundled). Nếu không có skill nào đủ điều kiện, phần
Skills bị bỏ qua.

Tính đủ điều kiện bao gồm các cổng metadata skill, kiểm tra môi trường/cấu hình runtime,
và danh sách cho phép skill hiệu lực của agent khi `agents.defaults.skills` hoặc
`agents.list[].skills` được cấu hình.

Skills được đóng gói cùng Plugin chỉ đủ điều kiện khi Plugin sở hữu chúng được bật.
Điều này cho phép các Plugin công cụ phơi bày hướng dẫn vận hành sâu hơn mà không nhúng tất cả
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

Điều này giữ prompt cơ sở nhỏ trong khi vẫn cho phép dùng skill có mục tiêu.

Ngân sách danh sách skills thuộc sở hữu của phân hệ skills:

- Mặc định toàn cục: `skills.limits.maxSkillsPromptChars`
- Ghi đè theo agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Các đoạn trích thời gian chạy có giới hạn chung dùng một bề mặt khác:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Sự phân tách đó giữ kích thước Skills tách biệt với kích thước đọc/chèn thời gian chạy như `memory_get`, kết quả công cụ trực tiếp, và các lần làm mới AGENTS.md sau Compaction.

## Tài liệu

Lời nhắc hệ thống bao gồm một phần **Tài liệu**. Khi có tài liệu cục bộ, phần này trỏ đến thư mục tài liệu OpenClaw cục bộ (`docs/` trong Git checkout hoặc tài liệu gói npm đi kèm). Nếu không có tài liệu cục bộ, nó sẽ dùng dự phòng [https://docs.openclaw.ai](https://docs.openclaw.ai).

Cùng phần đó cũng bao gồm vị trí mã nguồn OpenClaw. Git checkout cung cấp thư mục gốc mã nguồn cục bộ để tác tử có thể kiểm tra mã trực tiếp. Các bản cài đặt gói bao gồm URL mã nguồn GitHub và yêu cầu tác tử xem lại mã nguồn ở đó bất cứ khi nào tài liệu chưa đầy đủ hoặc đã lỗi thời. Lời nhắc cũng ghi chú mirror tài liệu công khai, Discord cộng đồng, và ClawHub ([https://clawhub.ai](https://clawhub.ai)) để khám phá Skills. Nó yêu cầu mô hình tham khảo tài liệu trước tiên về hành vi, lệnh, cấu hình, hoặc kiến trúc của OpenClaw, và tự chạy `openclaw status` khi có thể (chỉ hỏi người dùng khi không có quyền truy cập). Riêng đối với cấu hình, nó trỏ tác tử đến hành động công cụ `gateway` `config.schema.lookup` để xem tài liệu và ràng buộc chính xác ở cấp trường, sau đó đến `docs/gateway/configuration.md` và `docs/gateway/configuration-reference.md` để được hướng dẫn rộng hơn.

## Liên quan

- [Thời gian chạy tác tử](/vi/concepts/agent)
- [Không gian làm việc của tác tử](/vi/concepts/agent-workspace)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
