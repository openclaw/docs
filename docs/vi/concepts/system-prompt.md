---
read_when:
    - Chỉnh sửa văn bản lời nhắc hệ thống, danh sách công cụ hoặc các phần thời gian/Heartbeat
    - Thay đổi hành vi khởi tạo không gian làm việc hoặc chèn Skills
summary: Lời nhắc hệ thống của OpenClaw chứa gì và được tập hợp như thế nào
title: Lời nhắc hệ thống
x-i18n:
    generated_at: "2026-05-06T09:10:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73c20ed6a181c0a791147d67008ebdd6f8b8651ea4c43a7797931a682694bf96
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw xây dựng một system prompt tùy chỉnh cho mỗi lần chạy agent. Prompt này do **OpenClaw sở hữu** và không dùng prompt mặc định của pi-coding-agent.

Prompt được OpenClaw lắp ráp và chèn vào mỗi lần chạy agent.

Các plugin nhà cung cấp có thể đóng góp hướng dẫn prompt nhận biết cache mà không thay thế
toàn bộ prompt do OpenClaw sở hữu. Runtime của nhà cung cấp có thể:

- thay thế một nhóm nhỏ các phần core có tên (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- chèn một **tiền tố ổn định** phía trên ranh giới prompt cache
- chèn một **hậu tố động** phía dưới ranh giới prompt cache

Dùng các phần đóng góp do nhà cung cấp sở hữu cho việc tinh chỉnh theo từng họ model. Giữ cơ chế đột biến prompt
`before_prompt_build` cũ cho khả năng tương thích hoặc các thay đổi prompt thật sự toàn cục,
không phải hành vi nhà cung cấp thông thường.

Lớp phủ họ OpenAI GPT-5 giữ quy tắc thực thi core nhỏ gọn và thêm
hướng dẫn riêng cho model về việc bám giữ persona, đầu ra súc tích, kỷ luật dùng công cụ,
tra cứu song song, bao phủ deliverable, xác minh, ngữ cảnh bị thiếu và
vệ sinh công cụ terminal.

## Cấu trúc

Prompt được cố ý giữ gọn và dùng các phần cố định:

- **Công cụ**: lời nhắc nguồn chân lý cho công cụ có cấu trúc cùng hướng dẫn dùng công cụ ở runtime.
- **Thiên hướng thực thi**: hướng dẫn tiếp tục thực hiện nhỏ gọn: hành động ngay trong lượt với
  các yêu cầu có thể thực hiện, tiếp tục cho đến khi xong hoặc bị chặn, phục hồi từ kết quả công cụ yếu,
  kiểm tra trực tiếp trạng thái có thể thay đổi, và xác minh trước khi hoàn tất.
- **An toàn**: lời nhắc guardrail ngắn để tránh hành vi tìm kiếm quyền lực hoặc vượt qua giám sát.
- **Skills** (khi có): cho model biết cách tải hướng dẫn skill theo nhu cầu.
- **OpenClaw tự cập nhật**: cách kiểm tra config an toàn bằng
  `config.schema.lookup`, vá config bằng `config.patch`, thay thế toàn bộ
  config bằng `config.apply`, và chỉ chạy `update.run` khi người dùng yêu cầu
  rõ ràng. Công cụ chỉ dành cho owner `gateway` cũng từ chối ghi lại
  `tools.exec.ask` / `tools.exec.security`, bao gồm các bí danh cũ `tools.bash.*`
  được chuẩn hóa về các đường dẫn exec được bảo vệ đó.
- **Workspace**: thư mục làm việc (`agents.defaults.workspace`).
- **Tài liệu**: đường dẫn cục bộ tới tài liệu OpenClaw (repo hoặc gói npm) và thời điểm cần đọc.
- **Tệp Workspace (được chèn)**: cho biết các tệp bootstrap được đưa vào bên dưới.
- **Sandbox** (khi bật): cho biết runtime sandboxed, đường dẫn sandbox và exec nâng quyền có khả dụng hay không.
- **Ngày & giờ hiện tại**: chỉ múi giờ (ổn định cho cache; đồng hồ trực tiếp đến từ `session_status`).
- **Thẻ trả lời**: cú pháp thẻ trả lời tùy chọn cho các nhà cung cấp được hỗ trợ.
- **Heartbeats**: prompt Heartbeat và hành vi ack, khi Heartbeat được bật cho agent mặc định.
- **Runtime**: host, OS, node, model, root repo (khi phát hiện), mức suy nghĩ (một dòng).
- **Suy luận**: mức hiển thị hiện tại + gợi ý bật/tắt /reasoning.

OpenClaw giữ nội dung ổn định lớn, bao gồm **Ngữ cảnh dự án**, phía trên
ranh giới prompt cache nội bộ. Các phần kênh/phiên dễ biến động như
hướng dẫn nhúng Control UI, **Nhắn tin**, **Giọng nói**, **Ngữ cảnh chat nhóm**,
**Phản ứng**, **Heartbeats**, và **Runtime** được thêm phía dưới ranh giới đó
để các backend cục bộ có prefix cache có thể tái sử dụng tiền tố workspace ổn định
giữa các lượt kênh. Mô tả công cụ cũng nên tránh nhúng tên kênh hiện tại
khi schema được chấp nhận đã mang chi tiết runtime đó.

Phần Công cụ cũng bao gồm hướng dẫn runtime cho công việc chạy lâu:

- dùng cron cho việc theo dõi trong tương lai (`check back later`, lời nhắc, công việc lặp lại)
  thay vì các vòng lặp ngủ `exec`, mẹo trì hoãn `yieldMs`, hoặc polling `process`
  lặp lại
- dùng `exec` / `process` chỉ cho các lệnh bắt đầu ngay bây giờ và tiếp tục chạy
  trong nền
- khi tự động đánh thức lúc hoàn tất được bật, khởi động lệnh một lần và dựa vào
  đường đánh thức dựa trên push khi nó phát ra output hoặc thất bại
- dùng `process` cho log, trạng thái, input hoặc can thiệp khi bạn cần
  kiểm tra một lệnh đang chạy
- nếu tác vụ lớn hơn, ưu tiên `sessions_spawn`; việc hoàn tất sub-agent là
  dựa trên push và tự động thông báo lại cho bên yêu cầu
- không poll `subagents list` / `sessions_list` trong vòng lặp chỉ để chờ
  hoàn tất

Khi công cụ thử nghiệm `update_plan` được bật, Công cụ cũng hướng dẫn
model chỉ dùng nó cho công việc nhiều bước không tầm thường, giữ đúng một bước
`in_progress`, và tránh lặp lại toàn bộ kế hoạch sau mỗi lần cập nhật.

Guardrail an toàn trong system prompt mang tính tư vấn. Chúng hướng dẫn hành vi model nhưng không thực thi chính sách. Dùng chính sách công cụ, phê duyệt exec, sandboxing và allowlist kênh để thực thi cứng; nhà vận hành có thể tắt các cơ chế này theo thiết kế.

Trên các kênh có thẻ/nút phê duyệt gốc, runtime prompt hiện yêu cầu
agent ưu tiên dựa vào UI phê duyệt gốc đó. Nó chỉ nên đưa vào lệnh thủ công
`/approve` khi kết quả công cụ nói rằng phê duyệt qua chat không khả dụng hoặc
phê duyệt thủ công là đường duy nhất.

## Chế độ prompt

OpenClaw có thể render system prompt nhỏ hơn cho sub-agent. Runtime đặt
`promptMode` cho mỗi lần chạy (không phải config hướng tới người dùng):

- `full` (mặc định): bao gồm tất cả các phần ở trên.
- `minimal`: dùng cho sub-agent; bỏ qua **Skills**, **Gọi lại bộ nhớ**, **OpenClaw
  tự cập nhật**, **Bí danh model**, **Danh tính người dùng**, **Thẻ trả lời**,
  **Nhắn tin**, **Trả lời im lặng**, và **Heartbeats**. Công cụ, **An toàn**,
  Workspace, Sandbox, Ngày & giờ hiện tại (khi biết), Runtime, và ngữ cảnh
  được chèn vẫn khả dụng.
- `none`: chỉ trả về dòng danh tính cơ sở.

Khi `promptMode=minimal`, các prompt được chèn thêm được gắn nhãn **Ngữ cảnh
Subagent** thay vì **Ngữ cảnh chat nhóm**.

Đối với các lần chạy tự động trả lời trên kênh, OpenClaw có thể bỏ qua phần
**Trả lời im lặng** chung khi ngữ cảnh chat trực tiếp/nhóm đã bao gồm hành vi
`NO_REPLY` riêng cho cuộc trò chuyện đã được giải quyết. Điều này tránh lặp lại cơ chế token
trong cả system prompt toàn cục và ngữ cảnh kênh.

## Snapshot prompt

OpenClaw giữ các snapshot prompt đã commit cho happy path runtime Codex dưới
`test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Chúng render
các tham số thread/turn app-server được chọn cùng một stack lớp prompt gắn với model
được tái dựng cho lượt Telegram trực tiếp, nhóm Discord, và Heartbeat. Stack đó
bao gồm fixture prompt model Codex `gpt-5.5` được ghim, tạo từ hình dạng
catalog/cache model của Codex, văn bản developer về quyền happy-path của Codex,
hướng dẫn developer OpenClaw, hướng dẫn chế độ cộng tác theo lượt
khi OpenClaw cung cấp, input lượt của người dùng, và tham chiếu tới các thông số công cụ động.

Làm mới fixture prompt model Codex được ghim bằng
`pnpm prompt:snapshots:sync-codex-model`. Theo mặc định, script tìm
cache runtime của Codex tại `$CODEX_HOME/models_cache.json`, rồi
`~/.codex/models_cache.json`, và chỉ sau đó mới fallback sang quy ước checkout Codex
của maintainer tại `~/code/codex/codex-rs/models-manager/models.json`. Nếu
không có nguồn nào trong số đó tồn tại, lệnh thoát mà không thay đổi fixture
đã commit. Truyền `--catalog <path>` để làm mới từ một tệp `models_cache.json`
hoặc `models.json` cụ thể.

Các snapshot này vẫn không phải là bản chụp request OpenAI thô theo từng byte. Codex
có thể thêm ngữ cảnh workspace do runtime sở hữu như `AGENTS.md`, ngữ cảnh
môi trường, memory, hướng dẫn app/plugin, và hướng dẫn chế độ cộng tác Default
tích hợp sẵn bên trong runtime Codex sau khi OpenClaw gửi tham số thread và turn.

Tái tạo chúng bằng `pnpm prompt:snapshots:gen` và xác minh drift bằng
`pnpm prompt:snapshots:check`. CI chạy kiểm tra drift trong shard boundary
bổ sung để các thay đổi prompt và cập nhật snapshot luôn gắn với cùng một
PR.

## Chèn bootstrap workspace

Các tệp bootstrap được cắt gọn và thêm dưới **Ngữ cảnh dự án** để model thấy ngữ cảnh danh tính và hồ sơ mà không cần đọc rõ ràng:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên workspace hoàn toàn mới)
- `MEMORY.md` khi có

Tất cả các tệp này được **chèn vào cửa sổ ngữ cảnh** ở mỗi lượt trừ khi
có cổng riêng cho tệp áp dụng. `HEARTBEAT.md` bị bỏ qua trên các lần chạy bình thường khi
Heartbeat bị tắt cho agent mặc định hoặc
`agents.defaults.heartbeat.includeSystemPromptSection` là false. Giữ các tệp được chèn
ngắn gọn — đặc biệt là `MEMORY.md`, vốn có thể tăng theo thời gian và dẫn đến
mức sử dụng ngữ cảnh cao ngoài dự kiến và Compaction thường xuyên hơn.

Khi một phiên chạy trên harness Codex gốc, Codex tải `AGENTS.md`
thông qua cơ chế khám phá tài liệu dự án riêng của nó. OpenClaw vẫn giải quyết các
tệp bootstrap còn lại và chuyển tiếp chúng dưới dạng hướng dẫn config Codex, nên `SOUL.md`,
`TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, và
`MEMORY.md` giữ cùng vai trò ngữ cảnh workspace mà không nhân đôi
`AGENTS.md`.

<Note>
Các tệp hằng ngày `memory/*.md` **không** phải là một phần của Ngữ cảnh dự án bootstrap thông thường. Trong các lượt bình thường, chúng được truy cập theo nhu cầu qua công cụ `memory_search` và `memory_get`, nên chúng không tính vào cửa sổ ngữ cảnh trừ khi model đọc chúng rõ ràng. Các lượt `/new` và `/reset` trống là ngoại lệ: runtime có thể thêm trước memory hằng ngày gần đây dưới dạng một khối ngữ cảnh khởi động dùng một lần cho lượt đầu tiên đó.
</Note>

Các tệp lớn bị cắt ngắn với một marker. Kích thước tối đa mỗi tệp được điều khiển bởi
`agents.defaults.bootstrapMaxChars` (mặc định: 12000). Tổng nội dung bootstrap được chèn
trên các tệp được giới hạn bởi `agents.defaults.bootstrapTotalMaxChars`
(mặc định: 60000). Tệp bị thiếu chèn một marker ngắn báo thiếu tệp. Khi xảy ra cắt ngắn,
OpenClaw có thể chèn một thông báo cảnh báo system-prompt súc tích; điều khiển việc này bằng
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
mặc định: `once`). Số đếm raw/được chèn chi tiết nằm trong chẩn đoán như
`/context`, `/status`, doctor, và log.

Các phiên sub-agent chỉ chèn `AGENTS.md` và `TOOLS.md` (các tệp bootstrap khác
được lọc ra để giữ ngữ cảnh sub-agent nhỏ).

Hook nội bộ có thể chặn bước này qua `agent:bootstrap` để đột biến hoặc thay thế
các tệp bootstrap được chèn (ví dụ hoán đổi `SOUL.md` sang một persona thay thế).

Nếu bạn muốn agent nghe bớt chung chung, hãy bắt đầu với
[Hướng dẫn tính cách SOUL.md](/vi/concepts/soul).

Để kiểm tra mỗi tệp được chèn đóng góp bao nhiêu (raw so với được chèn, cắt ngắn, cộng overhead schema công cụ), dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Xử lý thời gian

System prompt bao gồm một phần **Ngày & giờ hiện tại** chuyên biệt khi biết
múi giờ của người dùng. Để giữ prompt ổn định cho cache, hiện nó chỉ bao gồm
**múi giờ** (không có đồng hồ động hoặc định dạng thời gian).

Dùng `session_status` khi agent cần thời gian hiện tại; thẻ trạng thái
bao gồm một dòng timestamp. Cùng công cụ đó có thể tùy chọn đặt override model cho mỗi phiên
(`model=default` xóa override đó).

Cấu hình bằng:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Ngày & giờ](/vi/date-time) để biết đầy đủ chi tiết hành vi.

## Skills

Khi có Skills đủ điều kiện, OpenClaw chèn một **danh sách Skills khả dụng** nhỏ gọn
(`formatSkillsForPrompt`) bao gồm **đường dẫn tệp** cho từng skill. Prompt
hướng dẫn model dùng `read` để tải SKILL.md tại vị trí đã liệt kê
(workspace, được quản lý, hoặc bundled). Nếu không có skill nào đủ điều kiện, phần
Skills bị bỏ qua.

Điều kiện đủ bao gồm cổng metadata skill, kiểm tra môi trường/config runtime,
và allowlist skill agent hiệu lực khi `agents.defaults.skills` hoặc
`agents.list[].skills` được cấu hình.

Skills đi kèm plugin chỉ đủ điều kiện khi plugin sở hữu chúng được bật.
Điều này cho phép các plugin công cụ cung cấp hướng dẫn vận hành sâu hơn mà không nhúng tất cả
hướng dẫn đó trực tiếp vào từng mô tả công cụ.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Điều này giữ prompt cơ sở nhỏ gọn trong khi vẫn cho phép sử dụng skill có mục tiêu.

Ngân sách danh sách Skills thuộc về hệ thống con Skills:

- Mặc định toàn cục: `skills.limits.maxSkillsPromptChars`
- Ghi đè theo từng agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Các đoạn trích thời gian chạy có giới hạn dùng một bề mặt khác:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Sự tách biệt đó giữ việc định cỡ Skills riêng với việc định cỡ đọc/chèn trong thời gian chạy, chẳng hạn như `memory_get`, kết quả công cụ trực tiếp và các lần làm mới AGENTS.md sau Compaction.

## Tài liệu

Prompt hệ thống bao gồm một phần **Tài liệu**. Khi có tài liệu cục bộ, phần này trỏ đến thư mục tài liệu OpenClaw cục bộ (`docs/` trong bản Git checkout hoặc tài liệu trong gói npm đi kèm). Nếu không có tài liệu cục bộ, nó dùng dự phòng [https://docs.openclaw.ai](https://docs.openclaw.ai).

Phần này cũng bao gồm vị trí nguồn của OpenClaw. Các bản Git checkout hiển thị thư mục gốc nguồn cục bộ để agent có thể kiểm tra mã trực tiếp. Các bản cài đặt gói bao gồm URL nguồn GitHub và yêu cầu agent xem lại nguồn ở đó bất cứ khi nào tài liệu không đầy đủ hoặc đã lỗi thời. Prompt cũng ghi chú bản sao tài liệu công khai, Discord cộng đồng và ClawHub ([https://clawhub.ai](https://clawhub.ai)) để khám phá Skills. Nó yêu cầu mô hình tham khảo tài liệu trước đối với hành vi, lệnh, cấu hình hoặc kiến trúc của OpenClaw, và tự chạy `openclaw status` khi có thể (chỉ hỏi người dùng khi không có quyền truy cập). Riêng với cấu hình, nó hướng agent đến hành động công cụ `gateway` là `config.schema.lookup` để có tài liệu và ràng buộc chính xác ở cấp trường, sau đó đến `docs/gateway/configuration.md` và `docs/gateway/configuration-reference.md` để có hướng dẫn rộng hơn.

## Liên quan

- [Thời gian chạy của agent](/vi/concepts/agent)
- [Không gian làm việc của agent](/vi/concepts/agent-workspace)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
