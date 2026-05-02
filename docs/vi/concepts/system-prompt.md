---
read_when:
    - Chỉnh sửa văn bản prompt hệ thống, danh sách công cụ, hoặc các phần thời gian/Heartbeat
    - Thay đổi hành vi khởi tạo không gian làm việc hoặc chèn Skills
summary: Nội dung lời nhắc hệ thống của OpenClaw gồm những gì và được tập hợp như thế nào
title: Lời nhắc hệ thống
x-i18n:
    generated_at: "2026-05-02T23:39:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: f8e0234453812c16cf5d273096d335049bf435ca76ade36200caf4bb344624e5
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw xây dựng một lời nhắc hệ thống tùy chỉnh cho mỗi lần chạy agent. Lời nhắc này do **OpenClaw sở hữu** và không dùng lời nhắc mặc định của pi-coding-agent.

Lời nhắc được OpenClaw lắp ráp và chèn vào từng lần chạy agent.

Plugin nhà cung cấp có thể đóng góp hướng dẫn lời nhắc có nhận biết bộ nhớ đệm mà không thay thế
toàn bộ lời nhắc do OpenClaw sở hữu. Runtime nhà cung cấp có thể:

- thay thế một tập nhỏ các phần lõi có tên (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- chèn một **tiền tố ổn định** phía trên ranh giới bộ nhớ đệm lời nhắc
- chèn một **hậu tố động** phía dưới ranh giới bộ nhớ đệm lời nhắc

Dùng các đóng góp do nhà cung cấp sở hữu để tinh chỉnh theo từng họ mô hình. Giữ lại việc biến đổi lời nhắc
`before_prompt_build` cũ cho mục đích tương thích hoặc các thay đổi lời nhắc thật sự toàn cục,
không phải hành vi nhà cung cấp thông thường.

Lớp phủ họ OpenAI GPT-5 giữ quy tắc thực thi lõi nhỏ gọn và thêm
hướng dẫn theo mô hình cho việc bám giữ persona, đầu ra súc tích, kỷ luật dùng công cụ,
tra cứu song song, độ bao phủ sản phẩm bàn giao, xác minh, thiếu ngữ cảnh và
vệ sinh công cụ terminal.

## Cấu trúc

Lời nhắc được chủ ý giữ gọn và dùng các phần cố định:

- **Công cụ**: nhắc nhở nguồn chân lý của công cụ có cấu trúc cùng hướng dẫn dùng công cụ trong runtime.
- **Thiên hướng thực thi**: hướng dẫn theo đến cùng ngắn gọn: hành động ngay trong lượt với
  các yêu cầu có thể thực hiện, tiếp tục cho đến khi xong hoặc bị chặn, phục hồi từ kết quả công cụ yếu,
  kiểm tra trực tiếp trạng thái có thể thay đổi, và xác minh trước khi kết thúc.
- **An toàn**: nhắc nhở rào chắn ngắn để tránh hành vi tìm kiếm quyền lực hoặc vượt qua giám sát.
- **Skills** (khi có): cho mô hình biết cách tải hướng dẫn skill theo yêu cầu.
- **Tự cập nhật OpenClaw**: cách kiểm tra cấu hình an toàn bằng
  `config.schema.lookup`, vá cấu hình bằng `config.patch`, thay thế toàn bộ
  cấu hình bằng `config.apply`, và chỉ chạy `update.run` khi người dùng yêu cầu
  rõ ràng. Công cụ chỉ dành cho chủ sở hữu `gateway` cũng từ chối viết lại
  `tools.exec.ask` / `tools.exec.security`, bao gồm các alias cũ `tools.bash.*`
  được chuẩn hóa về các đường dẫn exec được bảo vệ đó.
- **Workspace**: thư mục làm việc (`agents.defaults.workspace`).
- **Tài liệu**: đường dẫn cục bộ đến tài liệu OpenClaw (repo hoặc gói npm) và thời điểm cần đọc.
- **Tệp Workspace (được chèn)**: cho biết các tệp bootstrap được bao gồm bên dưới.
- **Sandbox** (khi bật): cho biết runtime sandbox, đường dẫn sandbox và việc có sẵn exec nâng quyền hay không.
- **Ngày & Giờ hiện tại**: thời gian cục bộ của người dùng, múi giờ và định dạng thời gian.
- **Thẻ trả lời**: cú pháp thẻ trả lời tùy chọn cho các nhà cung cấp được hỗ trợ.
- **Heartbeat**: lời nhắc heartbeat và hành vi ack, khi heartbeat được bật cho agent mặc định.
- **Runtime**: host, OS, node, mô hình, gốc repo (khi phát hiện), mức suy nghĩ (một dòng).
- **Suy luận**: mức hiển thị hiện tại + gợi ý bật/tắt /reasoning.

OpenClaw giữ nội dung lớn và ổn định, bao gồm **Ngữ cảnh dự án**, phía trên
ranh giới bộ nhớ đệm lời nhắc nội bộ. Các phần kênh/phiên biến động như
hướng dẫn nhúng Control UI, **Nhắn tin**, **Giọng nói**, **Ngữ cảnh trò chuyện nhóm**,
**Phản ứng**, **Heartbeat**, và **Runtime** được thêm phía dưới ranh giới đó
để các backend cục bộ có bộ nhớ đệm tiền tố có thể tái sử dụng tiền tố workspace ổn định
qua các lượt kênh. Mô tả công cụ cũng nên tránh nhúng tên kênh hiện tại
khi schema được chấp nhận đã mang chi tiết runtime đó.

Phần Công cụ cũng bao gồm hướng dẫn runtime cho công việc chạy lâu:

- dùng cron cho theo dõi trong tương lai (`check back later`, nhắc nhở, công việc lặp lại)
  thay vì vòng lặp ngủ `exec`, thủ thuật trì hoãn `yieldMs`, hoặc thăm dò `process`
  lặp lại
- dùng `exec` / `process` chỉ cho các lệnh bắt đầu ngay và tiếp tục chạy
  ở nền
- khi bật đánh thức hoàn tất tự động, khởi chạy lệnh một lần và dựa vào
  đường dẫn đánh thức dựa trên push khi nó phát ra đầu ra hoặc thất bại
- dùng `process` cho log, trạng thái, nhập liệu hoặc can thiệp khi bạn cần
  kiểm tra một lệnh đang chạy
- nếu tác vụ lớn hơn, ưu tiên `sessions_spawn`; việc hoàn tất sub-agent là
  dựa trên push và tự động thông báo lại cho người yêu cầu
- không thăm dò `subagents list` / `sessions_list` trong vòng lặp chỉ để chờ
  hoàn tất

Khi công cụ thử nghiệm `update_plan` được bật, Công cụ cũng yêu cầu
mô hình chỉ dùng nó cho công việc nhiều bước không tầm thường, giữ đúng một bước
`in_progress`, và tránh lặp lại toàn bộ kế hoạch sau mỗi lần cập nhật.

Các rào chắn an toàn trong lời nhắc hệ thống có tính khuyến nghị. Chúng định hướng hành vi mô hình nhưng không thực thi chính sách. Dùng chính sách công cụ, phê duyệt exec, sandboxing và danh sách cho phép kênh để thực thi cứng; operator có thể vô hiệu hóa các mục này theo thiết kế.

Trên các kênh có thẻ/nút phê duyệt gốc, lời nhắc runtime hiện yêu cầu
agent ưu tiên dựa vào UI phê duyệt gốc đó. Agent chỉ nên bao gồm lệnh
`/approve` thủ công khi kết quả công cụ cho biết phê duyệt qua chat không khả dụng hoặc
phê duyệt thủ công là đường dẫn duy nhất.

## Chế độ lời nhắc

OpenClaw có thể kết xuất lời nhắc hệ thống nhỏ hơn cho sub-agent. Runtime đặt một
`promptMode` cho mỗi lần chạy (không phải cấu hình hiển thị cho người dùng):

- `full` (mặc định): bao gồm tất cả các phần ở trên.
- `minimal`: dùng cho sub-agent; bỏ qua **Skills**, **Truy hồi bộ nhớ**, **Tự cập nhật OpenClaw**,
  **Alias mô hình**, **Danh tính người dùng**, **Thẻ trả lời**,
  **Nhắn tin**, **Trả lời im lặng**, và **Heartbeat**. Công cụ, **An toàn**,
  Workspace, Sandbox, Ngày & Giờ hiện tại (khi biết), Runtime, và ngữ cảnh
  được chèn vẫn khả dụng.
- `none`: chỉ trả về dòng danh tính cơ sở.

Khi `promptMode=minimal`, các lời nhắc được chèn thêm được gắn nhãn **Ngữ cảnh Subagent**
thay vì **Ngữ cảnh trò chuyện nhóm**.

Đối với các lần chạy tự động trả lời theo kênh, OpenClaw có thể bỏ qua phần **Trả lời im lặng**
chung khi ngữ cảnh chat trực tiếp/nhóm đã bao gồm hành vi `NO_REPLY`
được phân giải theo cuộc trò chuyện cụ thể. Điều này tránh lặp lại cơ chế token
trong cả lời nhắc hệ thống toàn cục và ngữ cảnh kênh.

## Ảnh chụp lời nhắc

OpenClaw giữ các ảnh chụp lời nhắc đã commit cho đường dẫn thành công của runtime Codex dưới
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Chúng kết xuất
các tham số thread/turn app-server được chọn cùng một ngăn xếp lớp lời nhắc gắn với mô hình
được tái dựng cho các lượt Telegram trực tiếp, nhóm Discord và heartbeat. Ngăn xếp đó
bao gồm một fixture lời nhắc mô hình Codex `gpt-5.5` được ghim, tạo từ hình dạng
catalog/bộ nhớ đệm mô hình của Codex, văn bản developer quyền đường dẫn thành công của Codex,
hướng dẫn developer OpenClaw, đầu vào lượt người dùng, và tham chiếu đến các
đặc tả công cụ động.

Làm mới fixture lời nhắc mô hình Codex được ghim bằng
`pnpm prompt:snapshots:sync-codex-model`. Theo mặc định, script tìm
bộ nhớ đệm runtime của Codex tại `$CODEX_HOME/models_cache.json`, sau đó
`~/.codex/models_cache.json`, và chỉ sau đó mới fallback về quy ước checkout Codex
của maintainer tại `~/code/codex/codex-rs/models-manager/models.json`. Nếu
không có nguồn nào tồn tại, lệnh thoát mà không thay đổi fixture đã commit.
Truyền `--catalog <path>` để làm mới từ một tệp `models_cache.json`
hoặc `models.json` cụ thể.

Các ảnh chụp này vẫn không phải bản chụp yêu cầu OpenAI thô khớp từng byte. Codex
có thể thêm ngữ cảnh workspace do runtime sở hữu như `AGENTS.md`, ngữ cảnh
môi trường, bộ nhớ, hướng dẫn app/plugin và các hướng dẫn chế độ cộng tác
trong tương lai bên trong runtime Codex sau khi OpenClaw gửi tham số thread và turn.

Tái tạo chúng bằng `pnpm prompt:snapshots:gen` và xác minh drift bằng
`pnpm prompt:snapshots:check`. CI chạy kiểm tra drift trong shard ranh giới
bổ sung để các thay đổi lời nhắc và cập nhật ảnh chụp luôn gắn với cùng một
PR.

## Chèn bootstrap Workspace

Các tệp bootstrap được cắt gọn và thêm dưới **Ngữ cảnh dự án** để mô hình thấy ngữ cảnh danh tính và hồ sơ mà không cần đọc rõ ràng:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên workspace hoàn toàn mới)
- `MEMORY.md` khi có

Tất cả các tệp này được **chèn vào cửa sổ ngữ cảnh** ở mỗi lượt trừ khi
áp dụng cổng riêng cho tệp. `HEARTBEAT.md` được bỏ qua trong các lần chạy bình thường khi
heartbeat bị tắt cho agent mặc định hoặc
`agents.defaults.heartbeat.includeSystemPromptSection` là false. Giữ các tệp được chèn
ngắn gọn — đặc biệt là `MEMORY.md`, vì tệp này có thể lớn dần theo thời gian và dẫn đến
mức dùng ngữ cảnh cao ngoài dự kiến cùng việc compaction thường xuyên hơn.

Khi một phiên chạy trên harness Codex gốc, Codex tải `AGENTS.md`
thông qua cơ chế khám phá tài liệu dự án riêng của nó. OpenClaw vẫn phân giải các tệp
bootstrap còn lại và chuyển tiếp chúng dưới dạng hướng dẫn cấu hình Codex, vì vậy `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, và
`MEMORY.md` vẫn giữ cùng vai trò ngữ cảnh workspace mà không nhân đôi
`AGENTS.md`.

<Note>
Các tệp hằng ngày `memory/*.md` **không** phải là một phần của Ngữ cảnh dự án bootstrap thông thường. Trong các lượt thông thường, chúng được truy cập theo yêu cầu qua các công cụ `memory_search` và `memory_get`, vì vậy chúng không tính vào cửa sổ ngữ cảnh trừ khi mô hình đọc chúng rõ ràng. Các lượt `/new` và `/reset` trần là ngoại lệ: runtime có thể thêm trước bộ nhớ hằng ngày gần đây dưới dạng một khối ngữ cảnh khởi động một lần cho lượt đầu tiên đó.
</Note>

Các tệp lớn bị cắt ngắn kèm một marker. Kích thước tối đa theo từng tệp được kiểm soát bởi
`agents.defaults.bootstrapMaxChars` (mặc định: 12000). Tổng nội dung bootstrap
được chèn trên tất cả tệp bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars`
(mặc định: 60000). Tệp bị thiếu sẽ chèn một marker thiếu tệp ngắn. Khi xảy ra cắt ngắn,
OpenClaw có thể chèn một khối cảnh báo trong Ngữ cảnh dự án; kiểm soát điều này bằng
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
mặc định: `once`).

Các phiên sub-agent chỉ chèn `AGENTS.md` và `TOOLS.md` (các tệp bootstrap khác
được lọc ra để giữ ngữ cảnh sub-agent nhỏ).

Hook nội bộ có thể chặn bước này qua `agent:bootstrap` để biến đổi hoặc thay thế
các tệp bootstrap được chèn (ví dụ thay `SOUL.md` bằng một persona thay thế).

Nếu bạn muốn làm cho agent nghe ít chung chung hơn, hãy bắt đầu với
[Hướng dẫn persona SOUL.md](/vi/concepts/soul).

Để kiểm tra mỗi tệp được chèn đóng góp bao nhiêu (thô so với được chèn, cắt ngắn, cộng thêm overhead schema công cụ), dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Xử lý thời gian

Lời nhắc hệ thống bao gồm một phần **Ngày & Giờ hiện tại** riêng khi biết
múi giờ của người dùng. Để giữ bộ nhớ đệm lời nhắc ổn định, giờ đây nó chỉ bao gồm
**múi giờ** (không có đồng hồ động hoặc định dạng thời gian).

Dùng `session_status` khi agent cần thời gian hiện tại; thẻ trạng thái
bao gồm một dòng dấu thời gian. Cùng công cụ đó có thể tùy chọn đặt một ghi đè mô hình
theo phiên (`model=default` xóa nó).

Cấu hình bằng:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Ngày & Giờ](/vi/date-time) để biết đầy đủ chi tiết hành vi.

## Skills

Khi có các skill đủ điều kiện, OpenClaw chèn một **danh sách skills khả dụng** gọn
(`formatSkillsForPrompt`) bao gồm **đường dẫn tệp** cho từng skill. Lời nhắc
hướng dẫn mô hình dùng `read` để tải SKILL.md tại vị trí được liệt kê
(workspace, được quản lý, hoặc được đóng gói kèm). Nếu không có skill nào đủ điều kiện, phần
Skills bị bỏ qua.

Điều kiện đủ bao gồm cổng siêu dữ liệu skill, kiểm tra môi trường/cấu hình runtime,
và danh sách cho phép skill hiệu lực của agent khi `agents.defaults.skills` hoặc
`agents.list[].skills` được cấu hình.

Các skill được đóng gói kèm Plugin chỉ đủ điều kiện khi plugin sở hữu chúng được bật.
Điều này cho phép plugin công cụ phơi bày hướng dẫn vận hành sâu hơn mà không nhúng toàn bộ
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

Điều này giữ lời nhắc cơ sở nhỏ trong khi vẫn cho phép dùng skill có mục tiêu.

Ngân sách danh sách skills thuộc sở hữu của hệ thống con skills:

- Mặc định toàn cục: `skills.limits.maxSkillsPromptChars`
- Ghi đè theo từng agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Các đoạn trích runtime có giới hạn chung dùng một bề mặt khác:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Sự phân tách đó giữ việc định cỡ Skills riêng với việc định cỡ đọc/chèn lúc thời gian chạy như `memory_get`, kết quả công cụ trực tiếp và các lần làm mới AGENTS.md sau Compaction.

## Tài liệu

Prompt hệ thống bao gồm một phần **Tài liệu**. Khi có tài liệu cục bộ, phần này trỏ đến thư mục tài liệu OpenClaw cục bộ (`docs/` trong một bản checkout Git hoặc tài liệu đi kèm trong gói npm). Nếu không có tài liệu cục bộ, nó sẽ dùng phương án dự phòng là [https://docs.openclaw.ai](https://docs.openclaw.ai).

Phần này cũng bao gồm vị trí mã nguồn OpenClaw. Các bản checkout Git hiển thị thư mục gốc mã nguồn cục bộ để tác tử có thể kiểm tra mã trực tiếp. Các bản cài đặt gói bao gồm URL mã nguồn GitHub và yêu cầu tác tử xem xét mã nguồn ở đó bất cứ khi nào tài liệu chưa đầy đủ hoặc đã cũ. Prompt cũng ghi chú bản sao tài liệu công khai, Discord cộng đồng và ClawHub ([https://clawhub.ai](https://clawhub.ai)) để khám phá Skills. Nó yêu cầu mô hình tham khảo tài liệu trước đối với hành vi, lệnh, cấu hình hoặc kiến trúc của OpenClaw, và tự chạy `openclaw status` khi có thể (chỉ hỏi người dùng khi không có quyền truy cập). Riêng với cấu hình, nó trỏ tác tử đến thao tác công cụ `gateway` là `config.schema.lookup` để xem tài liệu và ràng buộc chính xác ở cấp trường, sau đó đến `docs/gateway/configuration.md` và `docs/gateway/configuration-reference.md` để có hướng dẫn rộng hơn.

## Liên quan

- [Runtime của tác tử](/vi/concepts/agent)
- [Không gian làm việc của tác tử](/vi/concepts/agent-workspace)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
