---
read_when:
    - Chỉnh sửa văn bản lời nhắc hệ thống, danh sách công cụ hoặc các phần thời gian/Heartbeat
    - Thay đổi hành vi khởi tạo không gian làm việc hoặc chèn Skills
summary: Lời nhắc hệ thống của OpenClaw chứa những gì và được lắp ráp như thế nào
title: Lời nhắc hệ thống
x-i18n:
    generated_at: "2026-05-10T19:32:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa3db4f53ffe5c11fd85159044344b56cd11c3bdb1a5a5de7638b21fb813135
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw xây dựng một lời nhắc hệ thống tùy chỉnh cho mỗi lần chạy agent. Lời nhắc này do **OpenClaw sở hữu** và không dùng lời nhắc mặc định của pi-coding-agent.

Lời nhắc được OpenClaw lắp ráp và chèn vào mỗi lần chạy agent.

Quy trình lắp ráp lời nhắc có ba lớp:

- `buildAgentSystemPrompt` kết xuất lời nhắc từ các đầu vào tường minh. Nó nên
  giữ vai trò là bộ kết xuất thuần túy và không nên đọc trực tiếp cấu hình toàn cục.
- `resolveAgentSystemPromptConfig` phân giải các núm điều chỉnh lời nhắc dựa trên cấu hình như
  hiển thị chủ sở hữu, gợi ý TTS, bí danh mô hình, chế độ trích dẫn bộ nhớ, và chế độ
  ủy quyền sub-agent cho một agent cụ thể.
- Các bộ chuyển đổi runtime (nhúng, CLI, bản xem trước lệnh/xuất, Compaction) thu thập
  các dữ kiện trực tiếp như công cụ, trạng thái sandbox, năng lực kênh, tệp ngữ cảnh,
  và phần đóng góp lời nhắc của nhà cung cấp, rồi gọi facade lời nhắc đã cấu hình.

Điều này giữ cho các bề mặt lời nhắc được xuất/gỡ lỗi đồng bộ với các lần chạy trực tiếp mà không
biến mọi chi tiết riêng của runtime thành một bộ dựng nguyên khối.

Các plugin nhà cung cấp có thể đóng góp hướng dẫn lời nhắc nhận biết bộ nhớ đệm mà không thay thế
toàn bộ lời nhắc do OpenClaw sở hữu. Runtime của nhà cung cấp có thể:

- thay thế một tập nhỏ các phần lõi có tên (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- chèn một **tiền tố ổn định** phía trên ranh giới bộ nhớ đệm lời nhắc
- chèn một **hậu tố động** phía dưới ranh giới bộ nhớ đệm lời nhắc

Dùng các phần đóng góp do nhà cung cấp sở hữu để tinh chỉnh theo từng họ mô hình. Giữ cơ chế
đột biến lời nhắc `before_prompt_build` cũ cho tương thích hoặc các thay đổi lời nhắc thật sự
toàn cục, không dùng cho hành vi nhà cung cấp thông thường.

Lớp phủ họ OpenAI GPT-5 giữ quy tắc thực thi lõi nhỏ gọn và bổ sung
hướng dẫn riêng theo mô hình cho việc chốt persona, đầu ra súc tích, kỷ luật dùng công cụ,
tra cứu song song, bao phủ sản phẩm bàn giao, xác minh, thiếu ngữ cảnh, và
vệ sinh công cụ terminal.

## Cấu trúc

Lời nhắc được cố ý giữ nhỏ gọn và dùng các phần cố định:

- **Công cụ**: lời nhắc rằng công cụ có cấu trúc là nguồn sự thật cộng với hướng dẫn sử dụng công cụ ở runtime.
- **Thiên hướng thực thi**: hướng dẫn theo sát nhỏ gọn: hành động ngay trong lượt với
  các yêu cầu có thể thực hiện, tiếp tục cho đến khi hoàn tất hoặc bị chặn, phục hồi từ kết quả công cụ yếu,
  kiểm tra trực tiếp trạng thái có thể thay đổi, và xác minh trước khi hoàn tất.
- **An toàn**: lời nhắc rào chắn ngắn để tránh hành vi tìm kiếm quyền lực hoặc vượt qua giám sát.
- **Skills** (khi có): cho mô hình biết cách tải hướng dẫn skill theo yêu cầu.
- **Điều khiển OpenClaw**: cho mô hình biết nên ưu tiên công cụ `gateway` cho
  công việc cấu hình/khởi động lại và tránh tự bịa lệnh CLI.
- **Tự cập nhật OpenClaw**: cách kiểm tra cấu hình an toàn bằng
  `config.schema.lookup`, vá cấu hình bằng `config.patch`, thay thế toàn bộ
  cấu hình bằng `config.apply`, và chỉ chạy `update.run` khi người dùng
  yêu cầu tường minh. Công cụ `gateway` chỉ dành cho chủ sở hữu cũng từ chối ghi lại
  `tools.exec.ask` / `tools.exec.security`, bao gồm các bí danh cũ `tools.bash.*`
  chuẩn hóa về các đường dẫn exec được bảo vệ đó.
- **Không gian làm việc**: thư mục làm việc (`agents.defaults.workspace`).
- **Tài liệu**: đường dẫn cục bộ đến docs/source của OpenClaw và khi nào cần đọc chúng.
- **Tệp không gian làm việc (được chèn)**: cho biết các tệp bootstrap được bao gồm bên dưới.
- **Sandbox** (khi bật): cho biết runtime được sandbox, các đường dẫn sandbox, và liệu exec nâng quyền có khả dụng hay không.
- **Ngày & giờ hiện tại**: chỉ múi giờ (ổn định cho bộ nhớ đệm; đồng hồ trực tiếp đến từ `session_status`).
- **Chỉ thị đầu ra của trợ lý**: cú pháp nhỏ gọn cho tệp đính kèm, ghi chú thoại, và thẻ trả lời.
- **Heartbeats**: lời nhắc heartbeat và hành vi ack, khi heartbeats được bật cho agent mặc định.
- **Runtime**: máy chủ, hệ điều hành, node, mô hình, gốc repo (khi phát hiện), mức suy nghĩ (một dòng).
- **Lập luận**: mức hiển thị hiện tại + gợi ý bật/tắt /reasoning.

OpenClaw giữ nội dung lớn và ổn định, bao gồm **Ngữ cảnh dự án**, phía trên
ranh giới bộ nhớ đệm lời nhắc nội bộ. Các phần kênh/phiên biến động như
hướng dẫn nhúng giao diện điều khiển, **Nhắn tin**, **Giọng nói**, **Ngữ cảnh trò chuyện nhóm**,
**Phản ứng**, **Heartbeats**, và **Runtime** được nối thêm bên dưới ranh giới đó
để các backend cục bộ có bộ nhớ đệm tiền tố có thể tái sử dụng tiền tố không gian làm việc ổn định
qua các lượt kênh. Mô tả công cụ cũng nên tránh nhúng tên kênh hiện tại
khi schema được chấp nhận đã mang chi tiết runtime đó.

Phần Công cụ cũng bao gồm hướng dẫn runtime cho công việc chạy lâu:

- dùng cron cho việc theo dõi trong tương lai (`check back later`, nhắc việc, công việc định kỳ)
  thay vì các vòng lặp ngủ `exec`, mẹo trì hoãn `yieldMs`, hoặc thăm dò `process`
  lặp lại
- dùng `exec` / `process` chỉ cho các lệnh bắt đầu ngay và tiếp tục chạy
  trong nền
- khi đánh thức hoàn tất tự động được bật, hãy khởi động lệnh một lần và dựa vào
  đường đánh thức kiểu push khi nó phát ra đầu ra hoặc thất bại
- dùng `process` cho log, trạng thái, đầu vào, hoặc can thiệp khi bạn cần
  kiểm tra một lệnh đang chạy
- nếu tác vụ lớn hơn, ưu tiên `sessions_spawn`; việc hoàn tất của sub-agent
  là kiểu push và tự động thông báo lại cho người yêu cầu
- không thăm dò `subagents list` / `sessions_list` trong vòng lặp chỉ để chờ
  hoàn tất

`agents.defaults.subagents.delegationMode` có thể tăng cường hướng dẫn này. Chế độ
mặc định `suggest` giữ lời gợi ý nền tảng. `prefer` thêm một phần chuyên biệt
**Ủy quyền sub-agent** cho agent chính biết cần đóng vai trò điều phối viên phản hồi nhanh
và đẩy mọi việc phức tạp hơn trả lời trực tiếp qua
`sessions_spawn`. Điều này chỉ thuộc về lời nhắc; chính sách công cụ vẫn kiểm soát liệu
`sessions_spawn` có khả dụng hay không.

Khi công cụ thử nghiệm `update_plan` được bật, phần Công cụ cũng cho mô hình biết
chỉ dùng nó cho công việc nhiều bước không tầm thường, giữ đúng một bước
`in_progress`, và tránh lặp lại toàn bộ kế hoạch sau mỗi lần cập nhật.

Các rào chắn an toàn trong lời nhắc hệ thống mang tính khuyến nghị. Chúng hướng dẫn hành vi của mô hình nhưng không cưỡng chế chính sách. Dùng chính sách công cụ, phê duyệt exec, sandboxing, và danh sách cho phép kênh để cưỡng chế cứng; người vận hành có thể tắt những cơ chế này theo thiết kế.

Trên các kênh có thẻ/nút phê duyệt gốc, lời nhắc runtime hiện cho
agent biết cần dựa vào giao diện phê duyệt gốc đó trước. Nó chỉ nên bao gồm lệnh
`/approve` thủ công khi kết quả công cụ cho biết phê duyệt qua chat không khả dụng hoặc
phê duyệt thủ công là đường duy nhất.

## Chế độ lời nhắc

OpenClaw có thể kết xuất các lời nhắc hệ thống nhỏ hơn cho sub-agent. Runtime đặt một
`promptMode` cho mỗi lần chạy (không phải cấu hình hướng tới người dùng):

- `full` (mặc định): bao gồm tất cả các phần ở trên.
- `minimal`: dùng cho sub-agent; bỏ qua **Gợi nhớ bộ nhớ**, **Tự cập nhật OpenClaw**,
  **Bí danh mô hình**, **Danh tính người dùng**, **Chỉ thị đầu ra của trợ lý**,
  **Nhắn tin**, **Trả lời im lặng**, và **Heartbeats**. Công cụ, **An toàn**,
  **Skills** khi được cung cấp, Không gian làm việc, Sandbox, Ngày & giờ hiện tại (khi
  biết), Runtime, và ngữ cảnh được chèn vẫn khả dụng.
- `none`: chỉ trả về dòng danh tính cơ sở.

Khi `promptMode=minimal`, các lời nhắc được chèn thêm được gắn nhãn **Ngữ cảnh subagent**
thay vì **Ngữ cảnh trò chuyện nhóm**.

Đối với các lần chạy tự động trả lời kênh, OpenClaw có thể bỏ qua phần **Trả lời im lặng**
chung khi ngữ cảnh chat trực tiếp/nhóm đã bao gồm hành vi `NO_REPLY`
cụ thể theo cuộc trò chuyện đã được phân giải. Điều này tránh lặp lại cơ chế token
trong cả lời nhắc hệ thống toàn cục và ngữ cảnh kênh.

## Ảnh chụp lời nhắc

OpenClaw giữ các ảnh chụp lời nhắc đã commit cho đường chạy thành công của runtime Codex dưới
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Chúng kết xuất
các tham số luồng/lượt app-server được chọn cộng với một chồng lớp lời nhắc ràng buộc mô hình được tái dựng
cho các lượt Telegram trực tiếp, nhóm Discord, và heartbeat. Chồng đó
bao gồm một fixture lời nhắc mô hình Codex `gpt-5.5` được ghim, tạo từ
hình dạng danh mục/bộ nhớ đệm mô hình của Codex, văn bản developer quyền đường chạy thành công của Codex,
hướng dẫn developer của OpenClaw, hướng dẫn chế độ cộng tác theo phạm vi lượt
khi OpenClaw cung cấp, đầu vào lượt người dùng, và tham chiếu đến thông số công cụ
động.

Làm mới fixture lời nhắc mô hình Codex được ghim bằng
`pnpm prompt:snapshots:sync-codex-model`. Theo mặc định, script tìm
bộ nhớ đệm runtime của Codex tại `$CODEX_HOME/models_cache.json`, rồi
`~/.codex/models_cache.json`, và chỉ sau đó mới dự phòng sang quy ước checkout Codex của maintainer
tại `~/code/codex/codex-rs/models-manager/models.json`. Nếu
không có nguồn nào trong số đó tồn tại, lệnh thoát mà không thay đổi fixture
đã commit. Truyền `--catalog <path>` để làm mới từ một tệp `models_cache.json`
hoặc `models.json` cụ thể.

Các ảnh chụp này vẫn không phải bản chụp yêu cầu OpenAI thô khớp từng byte. Codex
có thể thêm ngữ cảnh không gian làm việc do runtime sở hữu như `AGENTS.md`, ngữ cảnh
môi trường, bộ nhớ, hướng dẫn app/plugin, và hướng dẫn chế độ cộng tác
Default tích hợp bên trong runtime Codex sau khi OpenClaw gửi
tham số luồng và lượt.

Tạo lại chúng bằng `pnpm prompt:snapshots:gen` và xác minh độ lệch bằng
`pnpm prompt:snapshots:check`. CI chạy kiểm tra độ lệch trong shard ranh giới
bổ sung để các thay đổi lời nhắc và cập nhật ảnh chụp luôn gắn với cùng một
PR.

## Chèn bootstrap không gian làm việc

Các tệp bootstrap được cắt gọn và nối thêm dưới **Ngữ cảnh dự án** để mô hình thấy ngữ cảnh danh tính và hồ sơ mà không cần đọc tường minh:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên không gian làm việc hoàn toàn mới)
- `MEMORY.md` khi có

Tất cả các tệp này được **chèn vào cửa sổ ngữ cảnh** ở mọi lượt trừ khi
có cổng riêng theo tệp áp dụng. `HEARTBEAT.md` bị bỏ qua trong các lần chạy thông thường khi
heartbeats bị tắt cho agent mặc định hoặc
`agents.defaults.heartbeat.includeSystemPromptSection` là false. Giữ các tệp được chèn
ngắn gọn, đặc biệt là `MEMORY.md`. `MEMORY.md` được thiết kế để giữ vai trò
tóm tắt dài hạn đã tuyển chọn; ghi chú hằng ngày chi tiết thuộc về `memory/*.md`, nơi
`memory_search` và `memory_get` có thể truy xuất theo yêu cầu. Các tệp
`MEMORY.md` quá lớn làm tăng mức dùng lời nhắc và có thể chỉ được chèn một phần do
các giới hạn tệp bootstrap bên dưới.

Khi một phiên chạy trên harness Codex gốc, Codex tải `AGENTS.md`
thông qua cơ chế khám phá tài liệu dự án riêng của nó. OpenClaw vẫn phân giải các tệp
bootstrap còn lại và chuyển tiếp chúng dưới dạng hướng dẫn cấu hình Codex, để `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, và
`MEMORY.md` giữ cùng vai trò ngữ cảnh không gian làm việc mà không nhân đôi
`AGENTS.md`.

<Note>
Các tệp hằng ngày `memory/*.md` **không** phải là một phần của Ngữ cảnh dự án bootstrap thông thường. Trong các lượt bình thường, chúng được truy cập theo yêu cầu qua công cụ `memory_search` và `memory_get`, nên chúng không tính vào cửa sổ ngữ cảnh trừ khi mô hình đọc chúng một cách tường minh. Các lượt `/new` và `/reset` trần là ngoại lệ: runtime có thể thêm trước bộ nhớ hằng ngày gần đây dưới dạng một khối ngữ cảnh khởi động dùng một lần cho lượt đầu tiên đó.
</Note>

Các tệp lớn bị cắt ngắn với một dấu đánh dấu. Kích thước tối đa mỗi tệp được kiểm soát bởi
`agents.defaults.bootstrapMaxChars` (mặc định: 12000). Tổng nội dung bootstrap được chèn
trên các tệp bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars`
(mặc định: 60000). Tệp thiếu sẽ chèn một dấu đánh dấu thiếu tệp ngắn. Khi xảy ra cắt ngắn,
OpenClaw có thể chèn một thông báo cảnh báo lời nhắc hệ thống ngắn gọn; kiểm soát việc này bằng
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
mặc định: `once`). Số lượng thô/được chèn chi tiết vẫn nằm trong chẩn đoán như
`/context`, `/status`, doctor, và log.

Đối với tệp bộ nhớ, cắt ngắn không phải mất dữ liệu: tệp vẫn nguyên vẹn trên đĩa,
nhưng mô hình chỉ thấy bản sao được chèn đã rút ngắn cho đến khi nó đọc hoặc tìm kiếm
bộ nhớ trực tiếp. Nếu `MEMORY.md` bị cắt ngắn lặp lại, hãy chưng cất nó thành một
bản tóm tắt bền vững ngắn hơn và chuyển lịch sử chi tiết vào `memory/*.md`, hoặc
cố ý tăng giới hạn bootstrap.

Các phiên sub-agent chỉ chèn `AGENTS.md` và `TOOLS.md` (các tệp bootstrap khác
được lọc ra để giữ ngữ cảnh sub-agent nhỏ).

Các hook nội bộ có thể chặn bước này qua `agent:bootstrap` để đột biến hoặc thay thế
các tệp bootstrap được chèn (ví dụ đổi `SOUL.md` sang một persona thay thế).

Nếu bạn muốn làm cho agent nghe bớt chung chung, hãy bắt đầu với
[Hướng dẫn cá tính SOUL.md](/vi/concepts/soul).

Để kiểm tra từng tệp được chèn đóng góp bao nhiêu (thô so với đã chèn, cắt ngắn, cộng thêm chi phí schema công cụ), hãy dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Xử lý thời gian

System prompt bao gồm một phần **Ngày & giờ hiện tại** chuyên biệt khi biết múi giờ của
người dùng. Để giữ prompt ổn định cho bộ nhớ đệm, hiện phần này chỉ bao gồm
**múi giờ** (không có đồng hồ động hoặc định dạng thời gian).

Dùng `session_status` khi agent cần thời gian hiện tại; thẻ trạng thái
bao gồm một dòng dấu thời gian. Công cụ này cũng có thể tùy chọn đặt ghi đè mô hình theo từng phiên
(`model=default` sẽ xóa ghi đè đó).

Cấu hình bằng:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Ngày & giờ](/vi/date-time) để biết đầy đủ chi tiết hành vi.

## Skills

Khi có Skills đủ điều kiện, OpenClaw chèn một **danh sách Skills khả dụng** gọn
(`formatSkillsForPrompt`) bao gồm **đường dẫn tệp** cho từng Skill. Prompt
hướng dẫn mô hình dùng `read` để tải SKILL.md tại vị trí đã liệt kê
(workspace, managed, hoặc bundled). Nếu không có Skills nào đủ điều kiện, phần
Skills sẽ bị bỏ qua.

Điều kiện bao gồm các cổng metadata của Skill, kiểm tra môi trường/cấu hình runtime,
và danh sách cho phép Skill hiệu lực của agent khi `agents.defaults.skills` hoặc
`agents.list[].skills` được cấu hình.

Skills được đóng gói cùng Plugin chỉ đủ điều kiện khi Plugin sở hữu chúng được bật.
Điều này cho phép Plugin công cụ cung cấp các hướng dẫn vận hành sâu hơn mà không cần nhúng toàn bộ
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

Điều này giữ cho prompt cơ sở nhỏ trong khi vẫn cho phép sử dụng Skill có mục tiêu.

Ngân sách danh sách Skills do hệ thống con Skills sở hữu:

- Mặc định toàn cục: `skills.limits.maxSkillsPromptChars`
- Ghi đè theo agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Các đoạn trích runtime có giới hạn chung dùng một bề mặt khác:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Sự tách biệt đó giữ kích thước Skills tách khỏi kích thước đọc/chèn runtime như
`memory_get`, kết quả công cụ trực tiếp, và các lần làm mới AGENTS.md sau Compaction.

## Tài liệu

System prompt bao gồm một phần **Tài liệu**. Khi có tài liệu cục bộ, phần này
trỏ tới thư mục tài liệu OpenClaw cục bộ (`docs/` trong Git checkout hoặc tài liệu gói npm
được đóng gói). Nếu không có tài liệu cục bộ, nó sẽ quay về
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Phần này cũng bao gồm vị trí mã nguồn OpenClaw. Git checkout hiển thị thư mục gốc
mã nguồn cục bộ để agent có thể kiểm tra mã trực tiếp. Các bản cài đặt gói bao gồm URL
mã nguồn GitHub và yêu cầu agent xem mã nguồn ở đó bất cứ khi nào tài liệu chưa đầy đủ hoặc
lỗi thời. Prompt cũng ghi chú mirror tài liệu công khai, Discord cộng đồng, và ClawHub
([https://clawhub.ai](https://clawhub.ai)) để khám phá Skills. Nó yêu cầu mô hình
tham khảo tài liệu trước đối với hành vi, lệnh, cấu hình, hoặc kiến trúc của OpenClaw, và tự
chạy `openclaw status` khi có thể (chỉ hỏi người dùng khi không có quyền truy cập).
Riêng với cấu hình, nó trỏ agent tới hành động công cụ `gateway`
`config.schema.lookup` để có tài liệu và ràng buộc chính xác ở cấp trường, sau đó tới
`docs/gateway/configuration.md` và `docs/gateway/configuration-reference.md`
để có hướng dẫn rộng hơn.

## Liên quan

- [Runtime của agent](/vi/concepts/agent)
- [Workspace của agent](/vi/concepts/agent-workspace)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
