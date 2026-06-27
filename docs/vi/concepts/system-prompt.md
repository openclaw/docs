---
read_when:
    - Chỉnh sửa văn bản lời nhắc hệ thống, danh sách công cụ hoặc các phần thời gian/Heartbeat
    - Thay đổi hành vi khởi tạo workspace hoặc chèn Skills
summary: Lời nhắc hệ thống OpenClaw chứa gì và được lắp ráp như thế nào
title: Lời nhắc hệ thống
x-i18n:
    generated_at: "2026-06-27T17:26:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31321b4df7494317b73c2a5609b1dc275463168ed5fe20ecb173e9bec76717cc
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw xây dựng một prompt hệ thống tùy chỉnh cho mỗi lần chạy tác tử. Prompt này **do OpenClaw sở hữu** và không dùng prompt mặc định của thời gian chạy.

Prompt được OpenClaw lắp ráp và chèn vào từng lần chạy tác tử.

Việc lắp ráp prompt có ba lớp:

- `buildAgentSystemPrompt` kết xuất prompt từ các đầu vào tường minh. Nó nên
  tiếp tục là một bộ kết xuất thuần và không nên đọc trực tiếp cấu hình toàn cục.
- `resolveAgentSystemPromptConfig` phân giải các núm điều chỉnh prompt dựa trên cấu hình, chẳng hạn như
  hiển thị chủ sở hữu, gợi ý TTS, bí danh mô hình, chế độ trích dẫn bộ nhớ và chế độ
  ủy quyền tác tử con cho một tác tử cụ thể.
- Các bộ điều hợp thời gian chạy (nhúng, CLI, bản xem trước lệnh/xuất, Compaction) thu thập
  các thông tin trực tiếp như công cụ, trạng thái sandbox, khả năng của kênh, tệp ngữ cảnh,
  và phần đóng góp prompt của nhà cung cấp, rồi gọi facade prompt đã cấu hình.

Điều này giữ cho các bề mặt prompt xuất/gỡ lỗi đồng bộ với các lần chạy trực tiếp mà không
biến mọi chi tiết riêng của thời gian chạy thành một bộ dựng nguyên khối.

Plugin nhà cung cấp có thể đóng góp hướng dẫn prompt có nhận biết bộ nhớ đệm mà không thay thế
toàn bộ prompt do OpenClaw sở hữu. Thời gian chạy của nhà cung cấp có thể:

- thay thế một tập nhỏ các phần lõi có tên (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- chèn một **tiền tố ổn định** phía trên ranh giới bộ nhớ đệm prompt
- chèn một **hậu tố động** phía dưới ranh giới bộ nhớ đệm prompt

Dùng các đóng góp do nhà cung cấp sở hữu để tinh chỉnh riêng cho từng họ mô hình. Giữ cơ chế
đột biến prompt `before_prompt_build` cũ cho tương thích hoặc các thay đổi prompt thật sự mang tính toàn cục,
không phải hành vi nhà cung cấp thông thường.

Lớp phủ họ OpenAI GPT-5 giữ quy tắc thực thi lõi nhỏ gọn và bổ sung
hướng dẫn riêng cho mô hình về bám sát persona, đầu ra súc tích, kỷ luật dùng công cụ,
tra cứu song song, bao phủ sản phẩm bàn giao, xác minh, thiếu ngữ cảnh, và
vệ sinh công cụ terminal.

## Cấu trúc

Prompt được cố ý giữ gọn và dùng các phần cố định:

- **Công cụ**: nhắc nhở nguồn sự thật cho công cụ có cấu trúc, kèm hướng dẫn dùng công cụ theo thời gian chạy.
- **Thiên hướng thực thi**: hướng dẫn theo sát gọn nhẹ: hành động ngay trong lượt với
  yêu cầu có thể thực hiện, tiếp tục cho đến khi xong hoặc bị chặn, khôi phục khi kết quả công cụ
  yếu, kiểm tra trực tiếp trạng thái có thể thay đổi, và xác minh trước khi hoàn tất.
- **An toàn**: nhắc nhở rào chắn ngắn để tránh hành vi tìm kiếm quyền lực hoặc né tránh giám sát.
- **Skills** (khi có): cho mô hình biết cách tải hướng dẫn skill theo nhu cầu.
- **Điều khiển OpenClaw**: yêu cầu mô hình ưu tiên công cụ `gateway` cho
  công việc cấu hình/khởi động lại và tránh bịa ra lệnh CLI.
- **Tự cập nhật OpenClaw**: cách kiểm tra cấu hình an toàn bằng
  `config.schema.lookup`, vá cấu hình bằng `config.patch`, thay thế toàn bộ
  cấu hình bằng `config.apply`, và chỉ chạy `update.run` khi người dùng
  yêu cầu rõ ràng. Công cụ `gateway` hướng tới tác tử cũng từ chối viết lại
  `tools.exec.ask` / `tools.exec.security`, bao gồm các bí danh cũ `tools.bash.*`
  được chuẩn hóa về những đường dẫn exec được bảo vệ đó.
- **Không gian làm việc**: thư mục làm việc (`agents.defaults.workspace`).
- **Tài liệu**: đường dẫn cục bộ tới tài liệu/nguồn OpenClaw và khi nào cần đọc chúng.
- **Tệp không gian làm việc (đã chèn)**: cho biết các tệp khởi tạo được đưa vào bên dưới.
- **Sandbox** (khi bật): cho biết thời gian chạy được sandbox, các đường dẫn sandbox, và liệu exec nâng quyền có khả dụng hay không.
- **Ngày & giờ hiện tại**: chỉ múi giờ (ổn định với bộ nhớ đệm; đồng hồ trực tiếp lấy từ `session_status`).
- **Chỉ thị đầu ra của trợ lý**: cú pháp gọn cho tệp đính kèm, ghi chú thoại, và thẻ trả lời.
- **Heartbeats**: prompt Heartbeat và hành vi xác nhận, khi Heartbeat được bật cho tác tử mặc định.
- **Thời gian chạy**: máy chủ, hệ điều hành, node, mô hình, gốc repo (khi phát hiện được), mức suy nghĩ (một dòng).
- **Suy luận**: mức hiển thị hiện tại + gợi ý bật/tắt /reasoning.

OpenClaw giữ nội dung ổn định lớn, bao gồm **Ngữ cảnh dự án**, phía trên
ranh giới bộ nhớ đệm prompt nội bộ. Các phần kênh/phiên dễ biến động như
hướng dẫn nhúng Control UI, **Nhắn tin**, **Giọng nói**, **Ngữ cảnh trò chuyện nhóm**,
**Phản ứng**, **Heartbeats**, và **Thời gian chạy** được thêm phía dưới ranh giới đó
để các backend cục bộ có bộ nhớ đệm tiền tố có thể tái sử dụng tiền tố không gian làm việc ổn định
qua các lượt kênh. Mô tả công cụ cũng nên tránh nhúng tên kênh hiện tại
khi schema được chấp nhận đã mang chi tiết thời gian chạy đó.

Phần Công cụ cũng bao gồm hướng dẫn thời gian chạy cho công việc chạy lâu:

- dùng cron cho việc theo dõi trong tương lai (`check back later`, lời nhắc, công việc định kỳ)
  thay vì vòng lặp ngủ `exec`, mẹo trì hoãn `yieldMs`, hoặc liên tục thăm dò `process`
- chỉ dùng `exec` / `process` cho các lệnh bắt đầu ngay và tiếp tục chạy
  trong nền
- khi đánh thức hoàn tất tự động được bật, khởi động lệnh một lần và dựa vào
  đường đánh thức dựa trên push khi nó phát ra đầu ra hoặc thất bại
- dùng `process` cho nhật ký, trạng thái, đầu vào, hoặc can thiệp khi bạn cần
  kiểm tra một lệnh đang chạy
- nếu tác vụ lớn hơn, ưu tiên `sessions_spawn`; hoàn tất của tác tử con
  dựa trên push và tự động thông báo lại cho người yêu cầu
- không thăm dò `subagents list` / `sessions_list` trong vòng lặp chỉ để chờ
  hoàn tất

`agents.defaults.subagents.delegationMode` có thể tăng cường hướng dẫn này. Chế độ
mặc định `suggest` giữ gợi ý nền. `prefer` thêm một phần riêng
**Ủy quyền tác tử con** yêu cầu tác tử chính hoạt động như một điều phối viên phản hồi nhanh
và đẩy bất cứ việc gì phức tạp hơn một câu trả lời trực tiếp qua
`sessions_spawn`. Đây chỉ là prompt; chính sách công cụ vẫn kiểm soát liệu
`sessions_spawn` có khả dụng hay không.

Khi công cụ thử nghiệm `update_plan` được bật, Công cụ cũng yêu cầu
mô hình chỉ dùng nó cho công việc nhiều bước không tầm thường, giữ đúng một
bước `in_progress`, và tránh lặp lại toàn bộ kế hoạch sau mỗi lần cập nhật.

Các rào chắn an toàn trong prompt hệ thống mang tính khuyến nghị. Chúng hướng dẫn hành vi mô hình nhưng không thực thi chính sách. Dùng chính sách công cụ, phê duyệt exec, sandboxing, và danh sách cho phép của kênh để thực thi cứng; người vận hành có thể tắt các cơ chế này theo thiết kế.

Trên các kênh có thẻ/nút phê duyệt gốc, prompt thời gian chạy hiện yêu cầu
tác tử dựa vào UI phê duyệt gốc đó trước. Nó chỉ nên bao gồm lệnh thủ công
`/approve` khi kết quả công cụ nói rằng phê duyệt qua chat không khả dụng hoặc
phê duyệt thủ công là đường duy nhất.

## Chế độ prompt

OpenClaw có thể kết xuất prompt hệ thống nhỏ hơn cho tác tử con. Thời gian chạy đặt
`promptMode` cho mỗi lần chạy (không phải cấu hình hướng tới người dùng):

- `full` (mặc định): bao gồm tất cả các phần ở trên.
- `minimal`: dùng cho tác tử con; bỏ qua **Gợi nhớ bộ nhớ**, **Tự cập nhật OpenClaw
  **, **Bí danh mô hình**, **Danh tính người dùng**, **Chỉ thị đầu ra của trợ lý**,
  **Nhắn tin**, **Trả lời im lặng**, và **Heartbeats**. Công cụ, **An toàn**,
  **Skills** khi được cung cấp, Không gian làm việc, Sandbox, Ngày & giờ hiện tại (khi
  biết), Thời gian chạy, và ngữ cảnh đã chèn vẫn khả dụng.
- `none`: chỉ trả về dòng danh tính cơ sở.

Khi `promptMode=minimal`, các prompt được chèn thêm được gắn nhãn **Ngữ cảnh tác tử con**
thay vì **Ngữ cảnh trò chuyện nhóm**.

Đối với các lần chạy tự động trả lời của kênh, OpenClaw bỏ qua phần **Trả lời im lặng**
chung khi ngữ cảnh trực tiếp, nhóm, hoặc chỉ dùng công cụ tin nhắn sở hữu hợp đồng trả lời hiển thị.
Chỉ chế độ nhóm/kênh tự động cũ mới nên hiển thị `NO_REPLY`; chat trực tiếp
và trả lời chỉ dùng công cụ tin nhắn không nhận hướng dẫn token im lặng.

## Ảnh chụp prompt

OpenClaw giữ các ảnh chụp prompt đã commit cho đường chạy thành công của thời gian chạy Codex trong
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Chúng kết xuất
các tham số luồng/lượt app-server được chọn cùng một chồng lớp prompt ràng buộc với mô hình
được tái dựng cho các lượt Telegram trực tiếp, nhóm Discord, và Heartbeat. Chồng đó
bao gồm một fixture prompt mô hình Codex `gpt-5.5` được ghim, tạo từ hình dạng
catalog/bộ nhớ đệm mô hình của Codex, văn bản developer quyền đường chạy thành công của Codex,
hướng dẫn developer OpenClaw, hướng dẫn chế độ cộng tác theo phạm vi lượt
khi OpenClaw cung cấp chúng, đầu vào lượt của người dùng, và tham chiếu đến các đặc tả công cụ động.

Làm mới fixture prompt mô hình Codex được ghim bằng
`pnpm prompt:snapshots:sync-codex-model`. Theo mặc định, script tìm
bộ nhớ đệm thời gian chạy của Codex tại `$CODEX_HOME/models_cache.json`, rồi
`~/.codex/models_cache.json`, và chỉ sau đó mới fallback về quy ước checkout Codex của maintainer
tại `~/code/codex/codex-rs/models-manager/models.json`. Nếu
không có nguồn nào trong số đó tồn tại, lệnh thoát mà không thay đổi fixture
đã commit. Truyền `--catalog <path>` để làm mới từ một tệp `models_cache.json`
hoặc `models.json` cụ thể.

Các ảnh chụp này vẫn không phải là bản chụp yêu cầu OpenAI thô khớp từng byte. Codex
có thể thêm ngữ cảnh không gian làm việc do thời gian chạy sở hữu như `AGENTS.md`, ngữ cảnh
môi trường, ký ức, hướng dẫn app/Plugin, và hướng dẫn chế độ cộng tác Default
tích hợp bên trong thời gian chạy Codex sau khi OpenClaw gửi
tham số luồng và lượt.

Tạo lại chúng bằng `pnpm prompt:snapshots:gen` và xác minh độ lệch bằng
`pnpm prompt:snapshots:check`. CI chạy kiểm tra độ lệch trong shard ranh giới
bổ sung để các thay đổi prompt và cập nhật ảnh chụp luôn gắn với cùng một
PR.

## Chèn khởi tạo không gian làm việc

Các tệp khởi tạo được phân giải từ không gian làm việc đang hoạt động, rồi được định tuyến đến
bề mặt prompt khớp với vòng đời của chúng:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên không gian làm việc hoàn toàn mới)
- `MEMORY.md` khi có

Trên harness Codex gốc, OpenClaw tránh lặp lại các tệp không gian làm việc ổn định
trong mọi lượt người dùng. Codex tải `AGENTS.md` thông qua cơ chế khám phá tài liệu dự án
của chính nó. `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, và `USER.md` được chuyển tiếp làm
hướng dẫn developer của Codex. Danh sách skills gọn của OpenClaw cũng được chuyển tiếp
làm hướng dẫn developer cộng tác theo phạm vi lượt. Nội dung `HEARTBEAT.md`
không được chèn; các lượt Heartbeat nhận một ghi chú chế độ cộng tác trỏ tới tệp
khi nó tồn tại và không rỗng. Nội dung `MEMORY.md` từ không gian làm việc tác tử
đã cấu hình không được dán vào mọi lượt Codex gốc; khi các công cụ bộ nhớ
khả dụng cho không gian làm việc đó, các lượt Codex nhận một ghi chú bộ nhớ không gian làm việc nhỏ trong
hướng dẫn developer cộng tác theo phạm vi lượt và nên dùng `memory_search`
hoặc `memory_get` khi bộ nhớ bền vững có liên quan. Nếu công cụ bị tắt, tìm kiếm bộ nhớ
không khả dụng, hoặc không gian làm việc đang hoạt động khác với không gian làm việc bộ nhớ của tác tử,
`MEMORY.md` fallback về đường ngữ cảnh lượt có giới hạn thông thường. Nội dung
`BOOTSTRAP.md` đang hoạt động hiện vẫn giữ vai trò ngữ cảnh lượt thông thường.

Trên các harness không phải Codex, các tệp khởi tạo tiếp tục được kết hợp vào
prompt OpenClaw theo các cổng hiện có của chúng. `HEARTBEAT.md` bị bỏ qua trên
các lần chạy thông thường khi Heartbeat bị tắt cho tác tử mặc định hoặc
`agents.defaults.heartbeat.includeSystemPromptSection` là false. Giữ các tệp đã chèn
ngắn gọn, đặc biệt là `MEMORY.md` không phải Codex. `MEMORY.md` được thiết kế để duy trì
một bản tóm tắt dài hạn đã tuyển chọn; ghi chú hằng ngày chi tiết thuộc về `memory/*.md`, nơi
`memory_search` và `memory_get` có thể truy xuất chúng theo nhu cầu. Các tệp
`MEMORY.md` không phải Codex quá lớn làm tăng mức dùng prompt và có thể chỉ được chèn một phần
do các giới hạn tệp khởi tạo bên dưới.

<Note>
Các tệp hằng ngày `memory/*.md` **không** phải là một phần của Ngữ cảnh dự án khởi tạo thông thường. Trong các lượt bình thường, chúng được truy cập theo nhu cầu qua các công cụ `memory_search` và `memory_get`, nên chúng không tính vào cửa sổ ngữ cảnh trừ khi mô hình đọc chúng rõ ràng. Các lượt `/new` và `/reset` trần là ngoại lệ: thời gian chạy có thể thêm trước bộ nhớ hằng ngày gần đây dưới dạng một khối ngữ cảnh khởi động dùng một lần cho lượt đầu tiên đó.
</Note>

Các tệp lớn được cắt ngắn kèm một dấu đánh dấu. Kích thước tối đa cho mỗi tệp được kiểm soát bởi
`agents.defaults.bootstrapMaxChars` (mặc định: 20000). Tổng nội dung bootstrap được chèn
trên các tệp bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars`
(mặc định: 60000). Các tệp bị thiếu sẽ chèn một dấu đánh dấu tệp bị thiếu ngắn. Khi việc cắt ngắn
xảy ra, OpenClaw có thể chèn một thông báo cảnh báo ngắn gọn trong system prompt; kiểm soát việc này bằng
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
mặc định: `always`). Số lượng thô/đã chèn chi tiết vẫn nằm trong chẩn đoán như
`/context`, `/status`, doctor và nhật ký.

Đối với tệp bộ nhớ, việc cắt ngắn không phải là mất dữ liệu: tệp vẫn nguyên vẹn trên ổ đĩa.
Trên Codex gốc, `MEMORY.md` được đọc theo yêu cầu thông qua các công cụ bộ nhớ khi
có sẵn, với phương án dự phòng prompt có giới hạn khi công cụ không thể chạy. Trên các
harness khác, mô hình chỉ thấy bản sao đã rút ngắn được chèn cho đến khi nó đọc hoặc
tìm kiếm bộ nhớ trực tiếp. Nếu `MEMORY.md` liên tục bị cắt ngắn ở đó, hãy chắt lọc
nó thành một bản tóm tắt bền vững ngắn hơn và chuyển lịch sử chi tiết vào `memory/*.md`,
hoặc chủ ý tăng các giới hạn bootstrap.

Các phiên sub-agent chỉ chèn `AGENTS.md` và `TOOLS.md` (các tệp bootstrap khác
được lọc ra để giữ ngữ cảnh sub-agent nhỏ).

Các hook nội bộ có thể chặn bước này qua `agent:bootstrap` để biến đổi hoặc thay thế
các tệp bootstrap được chèn (ví dụ hoán đổi `SOUL.md` bằng một persona thay thế).

Nếu bạn muốn làm cho agent nghe bớt chung chung hơn, hãy bắt đầu với
[Hướng dẫn tính cách SOUL.md](/vi/concepts/soul).

Để kiểm tra mức đóng góp của từng tệp được chèn (thô so với đã chèn, cắt ngắn, cộng với chi phí schema công cụ), hãy dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Xử lý thời gian

System prompt bao gồm một phần **Ngày & giờ hiện tại** chuyên dụng khi biết
múi giờ của người dùng. Để giữ prompt ổn định với bộ nhớ đệm, hiện phần này chỉ bao gồm
**múi giờ** (không có đồng hồ động hoặc định dạng thời gian).

Dùng `session_status` khi agent cần thời gian hiện tại; thẻ trạng thái
bao gồm một dòng dấu thời gian. Cùng công cụ này cũng có thể tùy chọn đặt ghi đè mô hình
theo từng phiên (`model=default` sẽ xóa ghi đè đó).

Cấu hình bằng:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Ngày & giờ](/vi/date-time) để biết đầy đủ chi tiết hành vi.

## Skills

Khi có Skills đủ điều kiện, OpenClaw chèn một **danh sách Skills khả dụng** gọn
(`formatSkillsForPrompt`) bao gồm **đường dẫn tệp** và dấu đánh dấu
`<version>` suy ra từ nội dung cho từng skill. Prompt hướng dẫn mô hình dùng `read`
để tải SKILL.md tại vị trí được liệt kê (workspace, được quản lý, hoặc đóng gói kèm),
và đọc lại skill khi `<version>` của nó khác với lượt trước. Nếu không có
Skills nào đủ điều kiện, phần Skills sẽ bị bỏ qua.

Các lượt Codex gốc nhận danh sách này dưới dạng hướng dẫn developer cộng tác theo phạm vi lượt
thay vì input người dùng theo từng lượt, ngoại trừ các lượt cron nhẹ
giữ nguyên prompt đã lên lịch chính xác. Các harness khác giữ phần prompt
bình thường.

Vị trí có thể trỏ tới một skill lồng nhau, chẳng hạn như
`skills/personal/foo/SKILL.md`. Việc lồng nhau chỉ nhằm tổ chức; prompt vẫn
dùng tên skill phẳng từ frontmatter của `SKILL.md`.

Điều kiện đủ bao gồm các cổng siêu dữ liệu skill, kiểm tra môi trường/cấu hình runtime,
và danh sách cho phép skill hiệu lực của agent khi `agents.defaults.skills` hoặc
`agents.list[].skills` được cấu hình.

Skills được đóng gói kèm Plugin chỉ đủ điều kiện khi plugin sở hữu chúng được bật.
Điều này cho phép plugin công cụ cung cấp hướng dẫn vận hành sâu hơn mà không nhúng toàn bộ
hướng dẫn đó trực tiếp trong mọi mô tả công cụ.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Điều này giữ prompt cơ sở nhỏ trong khi vẫn cho phép sử dụng skill có mục tiêu.

Ngân sách danh sách skills do hệ thống con skills sở hữu:

- Mặc định toàn cục: `skills.limits.maxSkillsPromptChars`
- Ghi đè theo agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Các trích đoạn runtime có giới hạn chung dùng một bề mặt khác:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Sự tách biệt đó giữ kích thước skills riêng với kích thước đọc/chèn runtime như
`memory_get`, kết quả công cụ trực tiếp, và làm mới AGENTS.md sau Compaction.

## Tài liệu

System prompt bao gồm phần **Tài liệu**. Khi tài liệu cục bộ khả dụng, phần này
trỏ tới thư mục tài liệu OpenClaw cục bộ (`docs/` trong một Git checkout hoặc tài liệu trong gói npm
được đóng gói kèm). Nếu tài liệu cục bộ không khả dụng, nó dự phòng về
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Cùng phần đó cũng bao gồm vị trí nguồn OpenClaw. Git checkout cung cấp gốc nguồn
cục bộ để agent có thể kiểm tra mã trực tiếp. Các bản cài đặt gói bao gồm URL nguồn
GitHub và yêu cầu agent xem lại nguồn ở đó bất cứ khi nào tài liệu chưa đầy đủ hoặc
lỗi thời. Prompt cũng ghi chú mirror tài liệu công khai, Discord cộng đồng, và ClawHub
([https://clawhub.ai](https://clawhub.ai)) để khám phá skills. Nó đặt tài liệu làm
nguồn có thẩm quyền cho tri thức tự thân về OpenClaw trước khi mô hình hiểu cách OpenClaw hoạt động,
bao gồm bộ nhớ/ghi chú hằng ngày, phiên, công cụ, Gateway, cấu hình, lệnh, hoặc ngữ cảnh
dự án. Prompt yêu cầu mô hình dùng tài liệu cục bộ (hoặc mirror tài liệu khi tài liệu cục bộ
không khả dụng) trước, và xem AGENTS.md, ngữ cảnh dự án, ghi chú workspace/hồ sơ/bộ nhớ,
và `memory_search` là ngữ cảnh hướng dẫn hoặc bộ nhớ người dùng thay vì tri thức thiết kế
hoặc triển khai OpenClaw. Nếu tài liệu không đề cập hoặc lỗi thời, mô hình nên nói rõ
và kiểm tra nguồn. Prompt cũng yêu cầu mô hình tự chạy `openclaw status` khi
có thể, chỉ hỏi người dùng khi nó thiếu quyền truy cập.
Riêng đối với cấu hình, nó trỏ agent tới action công cụ `gateway`
`config.schema.lookup` để có tài liệu và ràng buộc chính xác ở cấp trường, sau đó tới
`docs/gateway/configuration.md` và `docs/gateway/configuration-reference.md`
để có hướng dẫn rộng hơn.

## Liên quan

- [Runtime agent](/vi/concepts/agent)
- [Workspace agent](/vi/concepts/agent-workspace)
- [Bộ máy ngữ cảnh](/vi/concepts/context-engine)
