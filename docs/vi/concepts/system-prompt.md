---
read_when:
    - Chỉnh sửa văn bản lời nhắc hệ thống, danh sách công cụ hoặc các phần thời gian/Heartbeat
    - Thay đổi hành vi khởi tạo không gian làm việc hoặc chèn Skills
summary: Prompt hệ thống OpenClaw chứa những gì và được lắp ráp như thế nào
title: Lời nhắc hệ thống
x-i18n:
    generated_at: "2026-05-02T22:17:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b8761a8722bb328b937e0832774be7b4e99602ae032c9a255f26843237c110c
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw xây dựng một prompt hệ thống tùy chỉnh cho mỗi lần chạy tác nhân. Prompt này do **OpenClaw sở hữu** và không sử dụng prompt mặc định của pi-coding-agent.

Prompt được OpenClaw lắp ráp và chèn vào từng lần chạy tác nhân.

Các Plugin nhà cung cấp có thể đóng góp hướng dẫn prompt có nhận biết bộ nhớ đệm mà không thay thế
toàn bộ prompt do OpenClaw sở hữu. Runtime của nhà cung cấp có thể:

- thay thế một tập nhỏ các phần lõi có tên (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- chèn một **tiền tố ổn định** phía trên ranh giới bộ nhớ đệm prompt
- chèn một **hậu tố động** phía dưới ranh giới bộ nhớ đệm prompt

Sử dụng các đóng góp do nhà cung cấp sở hữu để tinh chỉnh riêng cho từng họ mô hình. Giữ cơ chế đột biến prompt
`before_prompt_build` cũ để tương thích hoặc cho các thay đổi prompt thật sự mang tính toàn cục,
không phải hành vi nhà cung cấp thông thường.

Lớp phủ họ OpenAI GPT-5 giữ quy tắc thực thi lõi gọn nhẹ và bổ sung
hướng dẫn riêng theo mô hình cho việc khóa persona, đầu ra ngắn gọn, kỷ luật dùng công cụ,
tra cứu song song, độ bao phủ sản phẩm bàn giao, xác minh, thiếu ngữ cảnh, và
vệ sinh công cụ terminal.

## Cấu trúc

Prompt được cố ý giữ gọn và dùng các phần cố định:

- **Công cụ**: lời nhắc về nguồn sự thật cho structured-tool cùng hướng dẫn sử dụng công cụ runtime.
- **Thiên hướng thực thi**: hướng dẫn theo sát gọn nhẹ: hành động ngay trong lượt với
  các yêu cầu có thể thực hiện, tiếp tục cho đến khi xong hoặc bị chặn, phục hồi sau kết quả công cụ
  yếu, kiểm tra trực tiếp trạng thái có thể thay đổi, và xác minh trước khi hoàn tất.
- **An toàn**: lời nhắc rào chắn ngắn để tránh hành vi tìm kiếm quyền lực hoặc vượt qua giám sát.
- **Skills** (khi có): cho mô hình biết cách tải hướng dẫn Skills theo nhu cầu.
- **Tự cập nhật OpenClaw**: cách kiểm tra cấu hình an toàn bằng
  `config.schema.lookup`, vá cấu hình bằng `config.patch`, thay thế toàn bộ
  cấu hình bằng `config.apply`, và chỉ chạy `update.run` khi có yêu cầu rõ ràng từ người dùng.
  Công cụ `gateway` chỉ dành cho chủ sở hữu cũng từ chối ghi lại
  `tools.exec.ask` / `tools.exec.security`, bao gồm các bí danh cũ `tools.bash.*`
  được chuẩn hóa về các đường dẫn exec được bảo vệ đó.
- **Không gian làm việc**: thư mục làm việc (`agents.defaults.workspace`).
- **Tài liệu**: đường dẫn cục bộ đến tài liệu OpenClaw (repo hoặc gói npm) và khi nào nên đọc.
- **Tệp không gian làm việc (được chèn)**: cho biết các tệp bootstrap được đưa vào bên dưới.
- **Sandbox** (khi bật): cho biết runtime sandbox, đường dẫn sandbox, và liệu có exec nâng quyền hay không.
- **Ngày & giờ hiện tại**: thời gian theo cục bộ người dùng, múi giờ, và định dạng thời gian.
- **Thẻ trả lời**: cú pháp thẻ trả lời tùy chọn cho các nhà cung cấp được hỗ trợ.
- **Heartbeats**: prompt Heartbeat và hành vi xác nhận, khi Heartbeat được bật cho tác nhân mặc định.
- **Runtime**: máy chủ, OS, node, mô hình, gốc repo (khi phát hiện), mức suy nghĩ (một dòng).
- **Suy luận**: mức hiển thị hiện tại + gợi ý bật/tắt /reasoning.

OpenClaw giữ nội dung ổn định lớn, bao gồm **Ngữ cảnh dự án**, phía trên
ranh giới bộ nhớ đệm prompt nội bộ. Các phần kênh/phiên dễ thay đổi như
hướng dẫn nhúng Control UI, **Nhắn tin**, **Giọng nói**, **Ngữ cảnh trò chuyện nhóm**,
**Phản ứng**, **Heartbeats**, và **Runtime** được nối thêm phía dưới ranh giới đó
để các backend cục bộ có bộ nhớ đệm tiền tố có thể tái sử dụng tiền tố không gian làm việc ổn định
qua các lượt kênh. Tương tự, mô tả công cụ nên tránh nhúng tên kênh hiện tại
khi schema được chấp nhận đã mang chi tiết runtime đó.

Phần Công cụ cũng bao gồm hướng dẫn runtime cho công việc chạy lâu:

- dùng cron cho theo dõi trong tương lai (`check back later`, lời nhắc, công việc định kỳ)
  thay vì vòng lặp sleep bằng `exec`, mẹo trì hoãn `yieldMs`, hoặc thăm dò `process`
  lặp lại
- dùng `exec` / `process` chỉ cho các lệnh bắt đầu ngay và tiếp tục chạy
  nền
- khi đánh thức hoàn tất tự động được bật, khởi động lệnh một lần và dựa vào
  đường dẫn đánh thức dựa trên push khi nó phát ra đầu ra hoặc thất bại
- dùng `process` cho log, trạng thái, đầu vào, hoặc can thiệp khi bạn cần
  kiểm tra một lệnh đang chạy
- nếu tác vụ lớn hơn, ưu tiên `sessions_spawn`; hoàn tất của tác nhân phụ là
  dựa trên push và tự động thông báo lại cho người yêu cầu
- không thăm dò `subagents list` / `sessions_list` trong vòng lặp chỉ để chờ
  hoàn tất

Khi công cụ thử nghiệm `update_plan` được bật, Công cụ cũng yêu cầu
mô hình chỉ dùng nó cho công việc nhiều bước không tầm thường, giữ đúng một bước
`in_progress`, và tránh lặp lại toàn bộ kế hoạch sau mỗi lần cập nhật.

Các rào chắn an toàn trong prompt hệ thống mang tính khuyến nghị. Chúng định hướng hành vi mô hình nhưng không thực thi chính sách. Dùng chính sách công cụ, phê duyệt exec, sandboxing, và danh sách cho phép theo kênh để thực thi cứng; theo thiết kế, người vận hành có thể tắt các cơ chế này.

Trên các kênh có thẻ/nút phê duyệt gốc, prompt runtime hiện yêu cầu
tác nhân ưu tiên dựa vào UI phê duyệt gốc đó. Nó chỉ nên bao gồm lệnh
`/approve` thủ công khi kết quả công cụ nói rằng phê duyệt qua chat không khả dụng hoặc
phê duyệt thủ công là con đường duy nhất.

## Chế độ prompt

OpenClaw có thể render prompt hệ thống nhỏ hơn cho tác nhân phụ. Runtime đặt
`promptMode` cho mỗi lần chạy (không phải cấu hình hướng tới người dùng):

- `full` (mặc định): bao gồm tất cả các phần ở trên.
- `minimal`: dùng cho tác nhân phụ; bỏ qua **Skills**, **Truy hồi bộ nhớ**, **Tự cập nhật OpenClaw**,
  **Bí danh mô hình**, **Danh tính người dùng**, **Thẻ trả lời**,
  **Nhắn tin**, **Trả lời im lặng**, và **Heartbeats**. Công cụ, **An toàn**,
  Không gian làm việc, Sandbox, Ngày & giờ hiện tại (khi biết), Runtime, và ngữ cảnh
  được chèn vẫn có sẵn.
- `none`: chỉ trả về dòng danh tính cơ sở.

Khi `promptMode=minimal`, các prompt được chèn thêm được gắn nhãn **Ngữ cảnh tác nhân phụ**
thay vì **Ngữ cảnh trò chuyện nhóm**.

Đối với các lần chạy tự động trả lời theo kênh, OpenClaw có thể bỏ qua phần **Trả lời im lặng**
chung khi ngữ cảnh chat trực tiếp/nhóm đã bao gồm hành vi `NO_REPLY`
riêng theo cuộc trò chuyện đã được giải quyết. Điều này tránh lặp lại cơ chế token
trong cả prompt hệ thống toàn cục và ngữ cảnh kênh.

## Ảnh chụp prompt

OpenClaw giữ các ảnh chụp prompt happy-path đã commit cho runtime Codex/message-tool
trong `test/fixtures/agents/prompt-snapshots/happy-path/`. Chúng render
các tham số luồng/lượt app-server được chọn cùng một ngăn xếp lớp prompt gắn với mô hình
được tái dựng cho các lượt Telegram trực tiếp, nhóm Discord, và Heartbeat. Ngăn xếp đó
bao gồm một fixture prompt mô hình Codex `gpt-5.5` được ghim, tạo từ hình dạng catalog/bộ nhớ đệm
mô hình của Codex, văn bản developer về quyền happy-path của Codex,
hướng dẫn developer OpenClaw, đầu vào lượt người dùng, và tham chiếu tới các
đặc tả công cụ động.

Làm mới fixture prompt mô hình Codex đã ghim bằng
`pnpm prompt:snapshots:sync-codex-model`. Theo mặc định, script tìm
bộ nhớ đệm runtime của Codex tại `$CODEX_HOME/models_cache.json`, rồi
`~/.codex/models_cache.json`, và chỉ sau đó mới fallback sang quy ước checkout Codex
của maintainer tại `~/code/codex/codex-rs/models-manager/models.json`. Nếu
không có nguồn nào trong số đó tồn tại, lệnh thoát mà không thay đổi fixture
đã commit. Truyền `--catalog <path>` để làm mới từ một tệp `models_cache.json`
hoặc `models.json` cụ thể.

Các ảnh chụp này vẫn không phải bản ghi yêu cầu OpenAI thô từng byte một. Codex
có thể thêm ngữ cảnh không gian làm việc do runtime sở hữu như `AGENTS.md`, ngữ cảnh
môi trường, ký ức, hướng dẫn app/Plugin, và hướng dẫn chế độ cộng tác trong tương lai
bên trong runtime Codex sau khi OpenClaw gửi tham số luồng và lượt.

Tạo lại chúng bằng `pnpm prompt:snapshots:gen` và xác minh drift bằng
`pnpm prompt:snapshots:check`. CI chạy kiểm tra drift trong shard ranh giới
bổ sung để các thay đổi prompt và cập nhật ảnh chụp luôn gắn với cùng một
PR.

## Chèn bootstrap không gian làm việc

Các tệp bootstrap được cắt gọn và nối thêm dưới **Ngữ cảnh dự án** để mô hình thấy ngữ cảnh danh tính và hồ sơ mà không cần đọc rõ ràng:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên không gian làm việc hoàn toàn mới)
- `MEMORY.md` khi có

Tất cả các tệp này được **chèn vào cửa sổ ngữ cảnh** ở mọi lượt trừ khi
có cổng riêng theo tệp được áp dụng. `HEARTBEAT.md` bị bỏ qua trong các lần chạy thông thường khi
Heartbeat bị tắt cho tác nhân mặc định hoặc
`agents.defaults.heartbeat.includeSystemPromptSection` là false. Giữ các tệp được chèn
ngắn gọn — đặc biệt là `MEMORY.md`, tệp có thể tăng dần theo thời gian và dẫn đến
mức sử dụng ngữ cảnh cao ngoài dự kiến và Compaction thường xuyên hơn.

<Note>
Các tệp hằng ngày `memory/*.md` **không** thuộc Ngữ cảnh dự án bootstrap thông thường. Trong các lượt bình thường, chúng được truy cập theo nhu cầu qua các công cụ `memory_search` và `memory_get`, nên chúng không tính vào cửa sổ ngữ cảnh trừ khi mô hình đọc chúng một cách rõ ràng. Các lượt `/new` và `/reset` trần là ngoại lệ: runtime có thể thêm trước ký ức hằng ngày gần đây dưới dạng một khối ngữ cảnh khởi động dùng một lần cho lượt đầu tiên đó.
</Note>

Các tệp lớn bị cắt với một marker. Kích thước tối đa cho mỗi tệp được kiểm soát bởi
`agents.defaults.bootstrapMaxChars` (mặc định: 12000). Tổng nội dung bootstrap được chèn
trên các tệp bị giới hạn bởi `agents.defaults.bootstrapTotalMaxChars`
(mặc định: 60000). Các tệp thiếu sẽ chèn một marker ngắn báo thiếu tệp. Khi xảy ra cắt ngắn,
OpenClaw có thể chèn một khối cảnh báo trong Ngữ cảnh dự án; kiểm soát việc này bằng
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
mặc định: `once`).

Các phiên tác nhân phụ chỉ chèn `AGENTS.md` và `TOOLS.md` (các tệp bootstrap khác
được lọc ra để giữ ngữ cảnh tác nhân phụ nhỏ).

Các hook nội bộ có thể chặn bước này qua `agent:bootstrap` để đột biến hoặc thay thế
các tệp bootstrap được chèn (ví dụ hoán đổi `SOUL.md` bằng một persona thay thế).

Nếu bạn muốn làm cho tác nhân nghe ít chung chung hơn, hãy bắt đầu với
[Hướng dẫn tính cách SOUL.md](/vi/concepts/soul).

Để kiểm tra mỗi tệp được chèn đóng góp bao nhiêu (thô so với đã chèn, cắt ngắn, cộng với chi phí schema công cụ), dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Xử lý thời gian

Prompt hệ thống bao gồm một phần **Ngày & giờ hiện tại** chuyên biệt khi
biết múi giờ của người dùng. Để giữ prompt ổn định với bộ nhớ đệm, hiện nó chỉ bao gồm
**múi giờ** (không có đồng hồ động hoặc định dạng thời gian).

Dùng `session_status` khi tác nhân cần thời gian hiện tại; thẻ trạng thái
bao gồm một dòng dấu thời gian. Cùng công cụ đó có thể tùy chọn đặt ghi đè mô hình theo từng phiên
(`model=default` xóa ghi đè đó).

Cấu hình bằng:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Ngày & giờ](/vi/date-time) để biết đầy đủ chi tiết hành vi.

## Skills

Khi có Skills đủ điều kiện, OpenClaw chèn một **danh sách Skills khả dụng** gọn nhẹ
(`formatSkillsForPrompt`) bao gồm **đường dẫn tệp** cho từng Skills. Prompt
hướng dẫn mô hình dùng `read` để tải SKILL.md tại vị trí được liệt kê
(không gian làm việc, được quản lý, hoặc đi kèm). Nếu không có Skills nào đủ điều kiện, phần
Skills bị bỏ qua.

Điều kiện đủ bao gồm các cổng siêu dữ liệu Skills, kiểm tra môi trường/cấu hình runtime,
và danh sách cho phép Skills hiệu lực của tác nhân khi `agents.defaults.skills` hoặc
`agents.list[].skills` được cấu hình.

Skills đi kèm Plugin chỉ đủ điều kiện khi Plugin sở hữu chúng được bật.
Điều này cho phép các Plugin công cụ cung cấp hướng dẫn vận hành sâu hơn mà không nhúng toàn bộ
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

Điều này giữ prompt cơ sở nhỏ trong khi vẫn cho phép sử dụng Skills có mục tiêu.

Ngân sách danh sách Skills do hệ thống Skills sở hữu:

- Mặc định toàn cục: `skills.limits.maxSkillsPromptChars`
- Ghi đè theo tác nhân: `agents.list[].skillsLimits.maxSkillsPromptChars`

Các đoạn trích runtime giới hạn chung dùng một bề mặt khác:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Sự tách biệt đó giữ kích thước Skills tách khỏi kích thước đọc/chèn runtime như
`memory_get`, kết quả công cụ trực tiếp, và làm mới AGENTS.md sau Compaction.

## Tài liệu

Lời nhắc hệ thống bao gồm một phần **Tài liệu**. Khi tài liệu cục bộ có sẵn, phần này
trỏ đến thư mục tài liệu OpenClaw cục bộ (`docs/` trong một bản Git checkout hoặc tài liệu
gói npm đi kèm). Nếu tài liệu cục bộ không có sẵn, phần này sẽ chuyển sang
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Phần tương tự cũng bao gồm vị trí mã nguồn OpenClaw. Các bản Git checkout cung cấp thư mục gốc
mã nguồn cục bộ để tác nhân có thể kiểm tra mã trực tiếp. Các bản cài đặt gói bao gồm URL
mã nguồn GitHub và yêu cầu tác nhân xem xét mã nguồn ở đó bất cứ khi nào tài liệu chưa đầy đủ hoặc
đã lỗi thời. Lời nhắc cũng ghi chú bản sao tài liệu công khai, Discord cộng đồng và ClawHub
([https://clawhub.ai](https://clawhub.ai)) để khám phá skills. Nó yêu cầu mô hình
tham khảo tài liệu trước đối với hành vi, lệnh, cấu hình hoặc kiến trúc của OpenClaw, và tự
chạy `openclaw status` khi có thể (chỉ hỏi người dùng khi không có quyền truy cập).
Riêng với cấu hình, nó hướng tác nhân đến hành động công cụ `gateway`
`config.schema.lookup` để có tài liệu và ràng buộc chính xác ở cấp trường, rồi đến
`docs/gateway/configuration.md` và `docs/gateway/configuration-reference.md`
để xem hướng dẫn rộng hơn.

## Liên quan

- [Thời gian chạy tác nhân](/vi/concepts/agent)
- [Không gian làm việc của tác nhân](/vi/concepts/agent-workspace)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
