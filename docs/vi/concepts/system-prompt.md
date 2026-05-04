---
read_when:
    - Chỉnh sửa văn bản lời nhắc hệ thống, danh sách công cụ hoặc các phần thời gian/Heartbeat
    - Thay đổi hành vi khởi tạo không gian làm việc hoặc chèn Skills
summary: Lời nhắc hệ thống OpenClaw chứa những gì và được xây dựng như thế nào
title: Lời nhắc hệ thống
x-i18n:
    generated_at: "2026-05-04T02:23:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e6067e760eccf58106f0a646c2656e902d5951580abd750f342d70b0568b81b
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw tạo một system prompt tùy chỉnh cho mỗi lần chạy agent. Prompt này thuộc **sở hữu của OpenClaw** và không dùng prompt mặc định của pi-coding-agent.

Prompt được OpenClaw lắp ráp và chèn vào từng lần chạy agent.

Plugin nhà cung cấp có thể đóng góp hướng dẫn prompt nhận biết cache mà không thay thế
toàn bộ prompt thuộc sở hữu của OpenClaw. Runtime của nhà cung cấp có thể:

- thay thế một tập nhỏ các phần lõi được đặt tên (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- chèn một **tiền tố ổn định** phía trên ranh giới prompt cache
- chèn một **hậu tố động** phía dưới ranh giới prompt cache

Dùng các đóng góp do nhà cung cấp sở hữu để tinh chỉnh riêng cho từng họ mô hình. Giữ cơ chế thay đổi prompt cũ
`before_prompt_build` cho mục đích tương thích hoặc các thay đổi prompt thực sự mang tính toàn cục,
không phải hành vi nhà cung cấp thông thường.

Lớp phủ họ OpenAI GPT-5 giữ quy tắc thực thi lõi nhỏ gọn và bổ sung
hướng dẫn riêng cho mô hình về việc bám persona, đầu ra súc tích, kỷ luật dùng công cụ,
tra cứu song song, bao phủ sản phẩm bàn giao, xác minh, ngữ cảnh thiếu, và
vệ sinh công cụ terminal.

## Cấu trúc

Prompt được cố ý giữ gọn và dùng các phần cố định:

- **Công cụ**: nhắc rằng nguồn sự thật là structured-tool cùng với hướng dẫn dùng công cụ runtime.
- **Thiên hướng thực thi**: hướng dẫn theo đến cùng gọn nhẹ: hành động trong lượt với
  các yêu cầu có thể xử lý, tiếp tục cho đến khi xong hoặc bị chặn, phục hồi từ kết quả công cụ yếu,
  kiểm tra trực tiếp trạng thái có thể thay đổi, và xác minh trước khi hoàn tất.
- **An toàn**: lời nhắc guardrail ngắn để tránh hành vi tìm kiếm quyền lực hoặc vượt qua giám sát.
- **Skills** (khi có): cho mô hình biết cách tải hướng dẫn skill khi cần.
- **Tự cập nhật OpenClaw**: cách kiểm tra config an toàn bằng
  `config.schema.lookup`, vá config bằng `config.patch`, thay thế toàn bộ
  config bằng `config.apply`, và chỉ chạy `update.run` khi người dùng
  yêu cầu rõ ràng. Công cụ `gateway` chỉ dành cho owner cũng từ chối viết lại
  `tools.exec.ask` / `tools.exec.security`, bao gồm các bí danh cũ `tools.bash.*`
  được chuẩn hóa về các đường dẫn exec được bảo vệ đó.
- **Workspace**: thư mục làm việc (`agents.defaults.workspace`).
- **Tài liệu**: đường dẫn cục bộ tới tài liệu OpenClaw (repo hoặc gói npm) và khi nào cần đọc chúng.
- **Tệp Workspace (được chèn)**: cho biết các tệp bootstrap được bao gồm bên dưới.
- **Sandbox** (khi bật): cho biết runtime sandbox, đường dẫn sandbox, và liệu exec nâng quyền có khả dụng hay không.
- **Ngày & Giờ hiện tại**: giờ cục bộ của người dùng, múi giờ, và định dạng giờ.
- **Thẻ trả lời**: cú pháp thẻ trả lời tùy chọn cho các nhà cung cấp được hỗ trợ.
- **Heartbeats**: prompt heartbeat và hành vi ack, khi heartbeat được bật cho agent mặc định.
- **Runtime**: host, OS, node, mô hình, gốc repo (khi phát hiện được), mức suy nghĩ (một dòng).
- **Lập luận**: mức hiển thị hiện tại + gợi ý bật/tắt /reasoning.

OpenClaw giữ nội dung lớn ổn định, bao gồm **Ngữ cảnh dự án**, phía trên
ranh giới prompt cache nội bộ. Các phần kênh/phiên dễ biến động như
hướng dẫn nhúng Control UI, **Nhắn tin**, **Giọng nói**, **Ngữ cảnh chat nhóm**,
**Phản ứng**, **Heartbeats**, và **Runtime** được nối thêm phía dưới ranh giới đó
để các backend cục bộ có prefix cache có thể tái sử dụng tiền tố workspace ổn định
qua các lượt kênh. Tương tự, mô tả công cụ nên tránh nhúng tên kênh hiện tại
khi schema được chấp nhận đã mang chi tiết runtime đó.

Phần Công cụ cũng bao gồm hướng dẫn runtime cho công việc chạy dài:

- dùng cron cho việc theo dõi trong tương lai (`check back later`, lời nhắc, công việc lặp lại)
  thay vì vòng lặp ngủ `exec`, mẹo trì hoãn `yieldMs`, hoặc thăm dò `process`
  lặp lại
- dùng `exec` / `process` chỉ cho các lệnh bắt đầu ngay và tiếp tục chạy
  trong nền
- khi đánh thức hoàn tất tự động được bật, khởi động lệnh một lần và dựa vào
  đường dẫn đánh thức dạng push khi nó phát ra output hoặc thất bại
- dùng `process` cho log, trạng thái, input, hoặc can thiệp khi bạn cần
  kiểm tra một lệnh đang chạy
- nếu tác vụ lớn hơn, ưu tiên `sessions_spawn`; việc hoàn tất sub-agent dựa trên
  push và tự động thông báo lại cho người yêu cầu
- không thăm dò `subagents list` / `sessions_list` trong vòng lặp chỉ để chờ
  hoàn tất

Khi công cụ thử nghiệm `update_plan` được bật, Công cụ cũng yêu cầu
mô hình chỉ dùng nó cho công việc nhiều bước không tầm thường, luôn giữ đúng một bước
`in_progress`, và tránh lặp lại toàn bộ kế hoạch sau mỗi lần cập nhật.

Các guardrail an toàn trong system prompt mang tính khuyến nghị. Chúng hướng dẫn hành vi mô hình nhưng không thực thi chính sách. Dùng chính sách công cụ, phê duyệt exec, sandboxing, và allowlist kênh để thực thi cứng; operator có thể tắt các cơ chế này theo thiết kế.

Trên các kênh có thẻ/nút phê duyệt gốc, prompt runtime giờ yêu cầu
agent dựa vào UI phê duyệt gốc đó trước. Nó chỉ nên đưa vào lệnh
`/approve` thủ công khi kết quả công cụ cho biết phê duyệt qua chat không khả dụng hoặc
phê duyệt thủ công là đường dẫn duy nhất.

## Chế độ prompt

OpenClaw có thể render system prompt nhỏ hơn cho sub-agent. Runtime đặt
`promptMode` cho mỗi lần chạy (không phải config hướng người dùng):

- `full` (mặc định): bao gồm tất cả các phần ở trên.
- `minimal`: dùng cho sub-agent; bỏ qua **Skills**, **Memory Recall**, **Tự cập nhật OpenClaw**,
  **Bí danh mô hình**, **Danh tính người dùng**, **Thẻ trả lời**,
  **Nhắn tin**, **Trả lời im lặng**, và **Heartbeats**. Công cụ, **An toàn**,
  Workspace, Sandbox, Ngày & Giờ hiện tại (khi biết), Runtime, và ngữ cảnh được chèn
  vẫn khả dụng.
- `none`: chỉ trả về dòng danh tính cơ sở.

Khi `promptMode=minimal`, các prompt được chèn thêm được gắn nhãn **Ngữ cảnh Subagent**
thay vì **Ngữ cảnh chat nhóm**.

Đối với các lần chạy tự động trả lời của kênh, OpenClaw có thể bỏ qua phần **Trả lời im lặng**
chung khi ngữ cảnh chat trực tiếp/nhóm đã bao gồm hành vi
`NO_REPLY` riêng cho cuộc trò chuyện đã được phân giải. Điều này tránh lặp lại cơ chế token
trong cả system prompt toàn cục và ngữ cảnh kênh.

## Snapshot prompt

OpenClaw giữ các snapshot prompt đã commit cho đường chạy ổn định của runtime Codex dưới
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Chúng render
các tham số thread/turn app-server được chọn cùng với stack lớp prompt ràng buộc mô hình được tái dựng
cho các lượt Telegram trực tiếp, nhóm Discord, và heartbeat. Stack đó
bao gồm fixture prompt mô hình Codex `gpt-5.5` được ghim, tạo từ hình dạng catalog/cache mô hình của Codex,
văn bản developer quyền đường chạy ổn định của Codex,
hướng dẫn developer OpenClaw, hướng dẫn chế độ cộng tác theo phạm vi lượt
khi OpenClaw cung cấp chúng, input lượt người dùng, và tham chiếu tới các spec công cụ động.

Làm mới fixture prompt mô hình Codex được ghim bằng
`pnpm prompt:snapshots:sync-codex-model`. Theo mặc định, script tìm
cache runtime của Codex tại `$CODEX_HOME/models_cache.json`, rồi
`~/.codex/models_cache.json`, và chỉ sau đó mới fallback về quy ước checkout Codex của maintainer
tại `~/code/codex/codex-rs/models-manager/models.json`. Nếu
không nguồn nào tồn tại, lệnh thoát mà không thay đổi fixture đã commit.
Truyền `--catalog <path>` để làm mới từ một tệp `models_cache.json`
hoặc `models.json` cụ thể.

Các snapshot này vẫn không phải bản chụp request OpenAI thô khớp từng byte. Codex
có thể thêm ngữ cảnh workspace do runtime sở hữu như `AGENTS.md`, ngữ cảnh môi trường,
memory, hướng dẫn app/plugin, và hướng dẫn chế độ cộng tác Default
tích hợp bên trong runtime Codex sau khi OpenClaw gửi
tham số thread và turn.

Tạo lại chúng bằng `pnpm prompt:snapshots:gen` và xác minh drift bằng
`pnpm prompt:snapshots:check`. CI chạy kiểm tra drift trong shard ranh giới
bổ sung để các thay đổi prompt và cập nhật snapshot vẫn gắn với cùng một
PR.

## Chèn bootstrap workspace

Các tệp bootstrap được cắt gọn và nối thêm dưới **Ngữ cảnh dự án** để mô hình thấy ngữ cảnh danh tính và hồ sơ mà không cần đọc rõ ràng:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên workspace hoàn toàn mới)
- `MEMORY.md` khi có

Tất cả các tệp này được **chèn vào cửa sổ ngữ cảnh** trên mỗi lượt trừ khi
có gate riêng cho tệp được áp dụng. `HEARTBEAT.md` bị bỏ qua trong các lần chạy thông thường khi
heartbeat bị tắt cho agent mặc định hoặc
`agents.defaults.heartbeat.includeSystemPromptSection` là false. Giữ các tệp được chèn
súc tích — đặc biệt là `MEMORY.md`, vốn có thể tăng theo thời gian và dẫn đến
mức sử dụng ngữ cảnh cao bất ngờ và Compaction thường xuyên hơn.

Khi một phiên chạy trên harness Codex gốc, Codex tải `AGENTS.md`
thông qua cơ chế khám phá tài liệu dự án riêng. OpenClaw vẫn phân giải các
tệp bootstrap còn lại và chuyển tiếp chúng như hướng dẫn config Codex, nên `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, và
`MEMORY.md` giữ cùng vai trò ngữ cảnh workspace mà không nhân đôi
`AGENTS.md`.

<Note>
Các tệp hằng ngày `memory/*.md` **không** phải là một phần của Ngữ cảnh dự án bootstrap thông thường. Trong các lượt bình thường, chúng được truy cập theo nhu cầu qua các công cụ `memory_search` và `memory_get`, nên chúng không tính vào cửa sổ ngữ cảnh trừ khi mô hình đọc chúng rõ ràng. Các lượt `/new` và `/reset` trống là ngoại lệ: runtime có thể thêm trước memory hằng ngày gần đây dưới dạng một khối ngữ cảnh khởi động dùng một lần cho lượt đầu tiên đó.
</Note>

Các tệp lớn bị cắt ngắn kèm một marker. Kích thước tối đa trên mỗi tệp được kiểm soát bởi
`agents.defaults.bootstrapMaxChars` (mặc định: 12000). Tổng nội dung bootstrap được chèn
trên các tệp bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars`
(mặc định: 60000). Tệp thiếu sẽ chèn một marker thiếu tệp ngắn. Khi việc cắt ngắn
xảy ra, OpenClaw có thể chèn một thông báo cảnh báo system-prompt súc tích; kiểm soát điều này bằng
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
mặc định: `once`). Số đếm raw/được chèn chi tiết vẫn nằm trong chẩn đoán như
`/context`, `/status`, doctor, và log.

Các phiên sub-agent chỉ chèn `AGENTS.md` và `TOOLS.md` (các tệp bootstrap khác
được lọc ra để giữ ngữ cảnh sub-agent nhỏ).

Hook nội bộ có thể chặn bước này qua `agent:bootstrap` để thay đổi hoặc thay thế
các tệp bootstrap được chèn (ví dụ đổi `SOUL.md` sang một persona thay thế).

Nếu bạn muốn làm agent nghe bớt chung chung hơn, hãy bắt đầu với
[Hướng dẫn tính cách SOUL.md](/vi/concepts/soul).

Để kiểm tra mỗi tệp được chèn đóng góp bao nhiêu (raw so với được chèn, cắt ngắn, cộng với overhead schema công cụ), dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Xử lý thời gian

System prompt bao gồm một phần **Ngày & Giờ hiện tại** riêng khi
múi giờ của người dùng được biết. Để giữ prompt ổn định với cache, giờ nó chỉ bao gồm
**múi giờ** (không có đồng hồ động hoặc định dạng giờ).

Dùng `session_status` khi agent cần thời gian hiện tại; thẻ trạng thái
bao gồm một dòng timestamp. Cùng công cụ đó có thể tùy chọn đặt override mô hình theo phiên
(`model=default` sẽ xóa nó).

Cấu hình bằng:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Ngày & Giờ](/vi/date-time) để biết đầy đủ chi tiết hành vi.

## Skills

Khi có skill đủ điều kiện, OpenClaw chèn một **danh sách skills khả dụng** gọn
(`formatSkillsForPrompt`) bao gồm **đường dẫn tệp** cho mỗi skill. Prompt
hướng dẫn mô hình dùng `read` để tải SKILL.md tại vị trí được liệt kê
(workspace, managed, hoặc bundled). Nếu không có skill nào đủ điều kiện, phần
Skills bị bỏ qua.

Điều kiện đủ bao gồm các gate metadata skill, kiểm tra môi trường/config runtime,
và allowlist skill hiệu dụng của agent khi `agents.defaults.skills` hoặc
`agents.list[].skills` được cấu hình.

Skills được bundled theo Plugin chỉ đủ điều kiện khi Plugin sở hữu chúng được bật.
Điều này cho phép Plugin công cụ phơi bày các hướng dẫn vận hành sâu hơn mà không nhúng toàn bộ
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

Ngân sách danh sách skills thuộc sở hữu của hệ thống con skills:

- Mặc định toàn cục: `skills.limits.maxSkillsPromptChars`
- Ghi đè theo từng tác tử: `agents.list[].skillsLimits.maxSkillsPromptChars`

Các trích đoạn thời gian chạy giới hạn chung dùng một bề mặt khác:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Sự tách biệt đó giữ việc định cỡ Skills riêng với việc định cỡ đọc/chèn thời gian chạy, chẳng hạn như `memory_get`, kết quả công cụ trực tiếp, và các lần làm mới AGENTS.md sau Compaction.

## Tài liệu

Prompt hệ thống bao gồm một phần **Tài liệu**. Khi có tài liệu cục bộ, phần này trỏ đến thư mục tài liệu OpenClaw cục bộ (`docs/` trong một bản checkout Git hoặc tài liệu gói npm đi kèm). Nếu không có tài liệu cục bộ, nó quay về [https://docs.openclaw.ai](https://docs.openclaw.ai).

Phần này cũng bao gồm vị trí mã nguồn OpenClaw. Các bản checkout Git hiển thị gốc nguồn cục bộ để tác tử có thể kiểm tra mã trực tiếp. Các bản cài đặt gói bao gồm URL nguồn GitHub và yêu cầu tác tử xem lại nguồn ở đó bất cứ khi nào tài liệu chưa đầy đủ hoặc đã lỗi thời. Prompt cũng ghi chú bản sao công khai của tài liệu, Discord cộng đồng, và ClawHub ([https://clawhub.ai](https://clawhub.ai)) để khám phá Skills. Nó yêu cầu mô hình tham khảo tài liệu trước đối với hành vi, lệnh, cấu hình, hoặc kiến trúc của OpenClaw, và tự chạy `openclaw status` khi có thể (chỉ hỏi người dùng khi nó không có quyền truy cập). Riêng với cấu hình, nó trỏ tác tử đến hành động công cụ `gateway` `config.schema.lookup` để có tài liệu và ràng buộc chính xác ở cấp trường, sau đó đến `docs/gateway/configuration.md` và `docs/gateway/configuration-reference.md` để có hướng dẫn rộng hơn.

## Liên quan

- [Runtime tác tử](/vi/concepts/agent)
- [Không gian làm việc của tác tử](/vi/concepts/agent-workspace)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
