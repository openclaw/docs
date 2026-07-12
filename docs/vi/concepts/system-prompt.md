---
read_when:
    - Chỉnh sửa văn bản lời nhắc hệ thống, danh sách công cụ hoặc các phần thời gian/Heartbeat
    - Thay đổi hành vi khởi tạo không gian làm việc hoặc chèn Skills
summary: Nội dung của lời nhắc hệ thống OpenClaw và cách lời nhắc này được tạo thành
title: Lời nhắc hệ thống
x-i18n:
    generated_at: "2026-07-12T07:56:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1aabd41b5d4b51ed139d47b506017322c240bb1002bae901886d5f7991c0dc5e
    source_path: concepts/system-prompt.md
    workflow: 16
---

OpenClaw tự xây dựng lời nhắc hệ thống cho mỗi lần tác tử chạy; không có lời nhắc mặc định khi chạy.

Quá trình lắp ghép có ba lớp:

- `buildAgentSystemPrompt` kết xuất lời nhắc từ các đầu vào tường minh. Hàm này vẫn là một trình kết xuất thuần túy và không đọc trực tiếp cấu hình toàn cục.
- `resolveAgentSystemPromptConfig` phân giải các tùy chọn lời nhắc dựa trên cấu hình (hiển thị chủ sở hữu, gợi ý TTS, bí danh mô hình, chế độ trích dẫn bộ nhớ, chế độ ủy quyền cho tác tử con) cho một tác tử cụ thể.
- Các bộ điều hợp khi chạy (nhúng, CLI, bản xem trước lệnh/xuất, Compaction) thu thập dữ kiện trực tiếp (công cụ, trạng thái sandbox, khả năng của kênh, tệp ngữ cảnh, phần đóng góp lời nhắc từ nhà cung cấp) và gọi lớp giao diện lời nhắc đã cấu hình.

Cách này giúp các bề mặt lời nhắc được xuất/gỡ lỗi nhất quán với các lượt chạy trực tiếp mà không biến mọi chi tiết khi chạy thành một trình dựng nguyên khối.

Các Plugin nhà cung cấp có thể đóng góp hướng dẫn có nhận biết bộ nhớ đệm mà không thay thế lời nhắc do OpenClaw sở hữu. Môi trường chạy của nhà cung cấp có thể:

- thay thế một trong ba phần lõi có tên: `interaction_style`, `tool_call_style`, `execution_bias`
- chèn một **tiền tố ổn định** phía trên ranh giới bộ nhớ đệm lời nhắc
- chèn một **hậu tố động** phía dưới ranh giới bộ nhớ đệm lời nhắc

Hãy dùng phần đóng góp do nhà cung cấp sở hữu để tinh chỉnh riêng cho từng họ mô hình. Chỉ dành hook `before_prompt_build` cũ cho khả năng tương thích hoặc các thay đổi lời nhắc thực sự mang tính toàn cục.

Lớp phủ đi kèm dành cho họ OpenAI/Codex GPT-5 (`resolveGpt5SystemPromptContribution`) sử dụng cơ chế này: một hợp đồng hành vi `stablePrefix` (chính sách thực thi, kỷ luật sử dụng công cụ, hợp đồng đầu ra, hợp đồng hoàn tất) cùng với tùy chọn ghi đè `interaction_style` để có giọng điệu thân thiện hơn. Lớp phủ này áp dụng cho mọi mã định danh mô hình `gpt-5*` được định tuyến qua các Plugin OpenAI hoặc Codex, do `agents.defaults.promptOverlays.gpt5.personality` kiểm soát (`"friendly"`/`"on"` hoặc `"off"`).

## Cấu trúc

Lời nhắc ngắn gọn, gồm các phần cố định:

- **Công cụ**: lời nhắc rằng nguồn chân lý là công cụ có cấu trúc, cùng hướng dẫn sử dụng công cụ khi chạy. Khi công cụ thử nghiệm `update_plan` được bật (`tools.experimental.planTool`), phần mô tả riêng của công cụ bổ sung: chỉ dùng cho công việc nhiều bước không đơn giản, luôn có tối đa một bước ở trạng thái `in_progress`, và bỏ qua công cụ này đối với công việc một bước đơn giản.
- **Thiên hướng thực thi**: hành động ngay trong lượt đối với các yêu cầu có thể thực hiện, tiếp tục cho đến khi hoàn tất hoặc bị chặn, khắc phục kết quả công cụ kém, kiểm tra trực tiếp trạng thái có thể thay đổi và xác minh trước khi hoàn tất.
- **An toàn**: lời nhắc ngắn về giới hạn nhằm tránh hành vi tìm kiếm quyền lực hoặc vượt qua sự giám sát.
- **Skills** (khi có): cho mô hình biết cách tải hướng dẫn Skills theo yêu cầu.
- **Điều khiển OpenClaw**: ưu tiên công cụ `gateway` cho công việc cấu hình/khởi động lại; không tự đặt ra các lệnh CLI.
- **Tự cập nhật OpenClaw**: kiểm tra cấu hình an toàn bằng `config.schema.lookup`, vá bằng `config.patch`, thay thế toàn bộ cấu hình bằng `config.apply`, và chỉ chạy `update.run` khi người dùng yêu cầu rõ ràng. Công cụ `gateway` dành cho tác tử từ chối ghi lại `tools.exec.ask` / `tools.exec.security`, bao gồm các bí danh `tools.bash.*` cũ được chuẩn hóa thành những đường dẫn được bảo vệ đó.
- **Không gian làm việc**: thư mục làm việc (`agents.defaults.workspace`).
- **Tài liệu**: đường dẫn tài liệu/mã nguồn cục bộ và thời điểm cần đọc chúng.
- **Tệp không gian làm việc (được chèn)**: ghi chú rằng các tệp khởi tạo được đưa vào bên dưới.
- **Sandbox** (khi được bật): môi trường chạy trong sandbox, các đường dẫn sandbox, khả năng thực thi nâng quyền.
- **Ngày và giờ hiện tại**: chỉ múi giờ (ổn định với bộ nhớ đệm; đồng hồ trực tiếp đến từ `session_status`).
- **Chỉ thị đầu ra của trợ lý**: cú pháp ngắn gọn cho tệp đính kèm, ghi chú thoại và thẻ trả lời.
- **Heartbeat**: lời nhắc Heartbeat và hành vi xác nhận, khi Heartbeat được bật cho tác tử mặc định.
- **Môi trường chạy**: máy chủ, hệ điều hành, Node, mô hình, thư mục gốc kho mã (khi phát hiện được), mức độ suy nghĩ (một dòng).
- **Lập luận**: mức hiển thị hiện tại cùng gợi ý chuyển đổi `/reasoning`.

Nội dung ổn định có dung lượng lớn (bao gồm **Ngữ cảnh dự án**) nằm phía trên ranh giới bộ nhớ đệm lời nhắc nội bộ. Các phần thay đổi theo từng lượt (hướng dẫn nhúng giao diện điều khiển, **Nhắn tin**, **Giọng nói**, **Ngữ cảnh trò chuyện nhóm**, **Phản ứng**, **Heartbeat**, **Môi trường chạy**) được nối thêm phía dưới ranh giới đó để các hệ thống phụ trợ cục bộ có bộ nhớ đệm tiền tố có thể tái sử dụng tiền tố không gian làm việc ổn định qua các lượt trên kênh. Phần mô tả công cụ nên tránh nhúng tên kênh hiện tại khi lược đồ được chấp nhận đã mang chi tiết khi chạy đó.

Phần Công cụ cũng chứa hướng dẫn dành cho công việc chạy lâu:

- dùng cron cho việc theo dõi trong tương lai (`check back later`, lời nhắc, công việc định kỳ) thay vì vòng lặp ngủ bằng `exec`, thủ thuật trì hoãn `yieldMs` hoặc liên tục thăm dò `process`
- chỉ dùng `exec` / `process` cho các lệnh bắt đầu ngay và tiếp tục chạy trong nền
- khi tính năng đánh thức tự động lúc hoàn tất được bật, chỉ khởi động lệnh một lần và dựa vào đường dẫn đánh thức dựa trên cơ chế đẩy
- dùng `process` cho nhật ký, trạng thái, đầu vào hoặc can thiệp vào một lệnh đang chạy
- đối với tác vụ lớn hơn, ưu tiên `sessions_spawn`; việc hoàn tất của tác tử con dựa trên cơ chế đẩy và tự động thông báo lại cho người yêu cầu
- không thăm dò `subagents list` / `sessions_list` theo vòng lặp chỉ để chờ hoàn tất

`agents.defaults.subagents.delegationMode` (mặc định `"suggest"`) có thể tăng cường điều này. `"prefer"` bổ sung một phần **Ủy quyền cho tác tử con** chuyên biệt, yêu cầu tác tử chính hoạt động như một điều phối viên phản hồi nhanh và chuyển mọi việc phức tạp hơn một câu trả lời trực tiếp qua `sessions_spawn`. Điều này chỉ nằm trong lời nhắc; chính sách công cụ vẫn kiểm soát việc `sessions_spawn` có khả dụng hay không.

Các giới hạn an toàn trong lời nhắc hệ thống chỉ mang tính tư vấn, không phải cưỡng chế. Hãy dùng chính sách công cụ, phê duyệt thực thi, sandbox và danh sách kênh được phép để cưỡng chế nghiêm ngặt; theo thiết kế, người vận hành có thể tắt các giới hạn trong lời nhắc.

Trên các kênh có thẻ/nút phê duyệt gốc, lời nhắc yêu cầu tác tử ưu tiên dựa vào giao diện đó và chỉ đưa vào lệnh `/approve` thủ công khi kết quả công cụ cho biết phê duyệt qua trò chuyện không khả dụng hoặc phê duyệt thủ công là con đường duy nhất.

## Chế độ lời nhắc

OpenClaw kết xuất lời nhắc hệ thống nhỏ hơn cho tác tử con. Môi trường chạy đặt một `promptMode` cho mỗi lượt chạy (không phải cấu hình dành cho người dùng):

- `full` (mặc định): tất cả các phần nêu trên.
- `minimal`: dùng cho tác tử con; bỏ qua phần lời nhắc bộ nhớ (được đóng gói dưới tên **Truy hồi bộ nhớ**), **Tự cập nhật OpenClaw**, **Bí danh mô hình**, **Danh tính người dùng**, **Chỉ thị đầu ra của trợ lý**, **Nhắn tin**, **Phản hồi im lặng** và **Heartbeat**. Phần Công cụ, **An toàn**, **Skills** (khi được cung cấp), Không gian làm việc, Sandbox, Ngày và giờ hiện tại (khi biết), Môi trường chạy và ngữ cảnh được chèn vẫn khả dụng.
- `none`: chỉ trả về dòng danh tính cơ sở.

Trong `promptMode=minimal`, các lời nhắc bổ sung được chèn mang nhãn **Ngữ cảnh tác tử con** thay vì **Ngữ cảnh trò chuyện nhóm**.

Đối với các lượt tự động trả lời trên kênh, OpenClaw bỏ phần **Phản hồi im lặng** chung khi ngữ cảnh trực tiếp, nhóm hoặc chỉ dùng công cụ tin nhắn đã sở hữu hợp đồng phản hồi hiển thị. Chỉ chế độ nhóm/kênh tự động cũ mới hiển thị `NO_REPLY`; trò chuyện trực tiếp và phản hồi chỉ dùng công cụ tin nhắn bỏ qua hướng dẫn về mã thông báo im lặng.

## Ảnh chụp nhanh lời nhắc

OpenClaw lưu các ảnh chụp nhanh lời nhắc đã cam kết cho luồng chuẩn của môi trường chạy Codex tại `test/fixtures/agents/prompt-snapshots/codex-runtime-happy-path/`. Chúng kết xuất các tham số luồng/lượt đã chọn của máy chủ ứng dụng cùng với ngăn xếp lớp lời nhắc hướng tới mô hình được tái dựng cho các lượt Telegram trực tiếp, nhóm Discord và Heartbeat: một tệp mẫu lời nhắc mô hình Codex `gpt-5.5` được ghim, văn bản dành cho nhà phát triển về quyền của luồng chuẩn Codex, hướng dẫn dành cho nhà phát triển của OpenClaw, hướng dẫn chế độ cộng tác theo phạm vi lượt khi OpenClaw cung cấp, đầu vào lượt của người dùng và tham chiếu đến các đặc tả công cụ động.

Làm mới tệp mẫu lời nhắc mô hình Codex được ghim bằng `pnpm prompt:snapshots:sync-codex-model`. Theo mặc định, lệnh này tìm `$CODEX_HOME/models_cache.json`, sau đó `~/.codex/models_cache.json`, rồi quy ước bản kiểm xuất dành cho người bảo trì `~/code/codex/codex-rs/models-manager/models.json`; nếu không có tệp nào, lệnh sẽ thoát mà không thay đổi tệp mẫu đã cam kết. Truyền `--catalog <path>` để làm mới từ một tệp `models_cache.json` hoặc `models.json` cụ thể.

Các ảnh chụp nhanh này không phải bản chụp yêu cầu OpenAI thô giống từng byte. Codex có thể bổ sung ngữ cảnh không gian làm việc do môi trường chạy sở hữu (`AGENTS.md`, ngữ cảnh môi trường, bộ nhớ, hướng dẫn ứng dụng/Plugin, hướng dẫn chế độ cộng tác Default tích hợp sẵn) sau khi OpenClaw gửi các tham số luồng và lượt.

Tạo lại bằng `pnpm prompt:snapshots:gen`; xác minh độ lệch bằng `pnpm prompt:snapshots:check`. CI chạy kiểm tra độ lệch cùng các phân đoạn ranh giới bổ sung, vì vậy thay đổi lời nhắc và cập nhật ảnh chụp nhanh được đưa vào cùng một PR.

## Chèn nội dung khởi tạo không gian làm việc

Các tệp khởi tạo được phân giải từ không gian làm việc đang hoạt động và định tuyến tới bề mặt lời nhắc phù hợp với vòng đời của chúng:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (chỉ trên không gian làm việc hoàn toàn mới)
- `MEMORY.md` khi có

Trên bộ khung Codex gốc, OpenClaw tránh lặp lại các tệp không gian làm việc ổn định trong mỗi lượt người dùng. Codex tải `AGENTS.md` thông qua cơ chế khám phá tài liệu dự án riêng. `TOOLS.md` được chuyển tiếp dưới dạng hướng dẫn dành cho nhà phát triển Codex được kế thừa. `SOUL.md`, `IDENTITY.md` và `USER.md` được chuyển tiếp dưới dạng hướng dẫn cộng tác dành cho nhà phát triển theo phạm vi lượt để các tác tử con Codex gốc không kế thừa chúng. Nội dung `HEARTBEAT.md` không được chèn trực tiếp; các lượt Heartbeat nhận một ghi chú chế độ cộng tác trỏ đến tệp khi tệp tồn tại và không rỗng. Nội dung `MEMORY.md` cũng không được dán vào mọi lượt Codex gốc: khi các công cụ bộ nhớ khả dụng cho không gian làm việc, các lượt Codex nhận một ghi chú ngắn về bộ nhớ không gian làm việc, hướng mô hình tới `memory_search` hoặc `memory_get`. Nếu công cụ bị tắt, tìm kiếm bộ nhớ không khả dụng hoặc không gian làm việc đang hoạt động khác với không gian làm việc bộ nhớ của tác tử, `MEMORY.md` sẽ dùng lại đường dẫn ngữ cảnh lượt có giới hạn thông thường. `BOOTSTRAP.md` giữ vai trò ngữ cảnh lượt thông thường.

Trên các bộ khung không phải Codex, các tệp khởi tạo được kết hợp vào lời nhắc OpenClaw theo các điều kiện hiện có. `HEARTBEAT.md` bị bỏ qua trong các lượt chạy thông thường khi Heartbeat bị tắt cho tác tử mặc định hoặc `agents.defaults.heartbeat.includeSystemPromptSection` là false. Hãy giữ các tệp được chèn ngắn gọn, đặc biệt là `MEMORY.md` không thuộc Codex: tệp này nên là bản tóm tắt dài hạn đã được tuyển chọn, còn ghi chú chi tiết hằng ngày nằm trong `memory/*.md` để có thể truy xuất theo yêu cầu qua `memory_search` / `memory_get`. Các tệp `MEMORY.md` không thuộc Codex quá lớn làm tăng mức sử dụng lời nhắc và có thể chỉ được chèn một phần theo các giới hạn tệp khởi tạo bên dưới.

<Note>
Các tệp hằng ngày `memory/*.md` **không** thuộc Ngữ cảnh dự án khởi tạo thông thường. Trong các lượt thông thường, chúng được truy cập theo yêu cầu qua `memory_search` / `memory_get`, vì vậy không chiếm cửa sổ ngữ cảnh trừ khi mô hình đọc chúng một cách rõ ràng. Các lượt chỉ có `/new` và `/reset` là ngoại lệ: môi trường chạy có thể thêm trước bộ nhớ hằng ngày gần đây dưới dạng khối ngữ cảnh khởi động dùng một lần cho lượt đầu tiên đó.
</Note>

Các tệp lớn bị cắt ngắn kèm một dấu mốc:

| Giới hạn                                     | Khóa cấu hình                                      | Mặc định |
| -------------------------------------------- | -------------------------------------------------- | -------- |
| Số ký tự tối đa cho mỗi tệp                  | `agents.defaults.bootstrapMaxChars`                | 20000    |
| Tổng số ký tự trên tất cả các tệp            | `agents.defaults.bootstrapTotalMaxChars`           | 60000    |
| Cảnh báo cắt ngắn (`off`\|`once`\|`always`)  | `agents.defaults.bootstrapPromptTruncationWarning` | `always` |

Các tệp bị thiếu sẽ chèn một dấu mốc ngắn cho biết tệp không tồn tại. Số lượng thô/được chèn chi tiết vẫn nằm trong dữ liệu chẩn đoán như `/context`, `/status`, doctor và nhật ký.

Đối với tệp bộ nhớ, việc cắt ngắn không làm mất dữ liệu: tệp vẫn nguyên vẹn trên đĩa. Trên Codex gốc, `MEMORY.md` được đọc theo yêu cầu thông qua các công cụ bộ nhớ khi khả dụng, nếu không sẽ dùng ngữ cảnh lời nhắc dự phòng có giới hạn. Trên các bộ khung khác, mô hình chỉ thấy bản sao được chèn đã rút gọn cho đến khi trực tiếp đọc hoặc tìm kiếm bộ nhớ. Nếu `MEMORY.md` liên tục bị cắt ngắn, hãy cô đọng tệp thành một bản tóm tắt bền vững ngắn hơn, chuyển lịch sử chi tiết vào `memory/*.md` hoặc chủ động tăng các giới hạn khởi tạo.

Các phiên tác tử phụ chỉ chèn `AGENTS.md` và `TOOLS.md` (các tệp khởi động khác bị lọc bỏ để giữ ngữ cảnh của tác tử phụ ở mức nhỏ).

Các hook nội bộ có thể chặn bước này thông qua sự kiện `agent:bootstrap` để sửa đổi hoặc thay thế các tệp khởi động được chèn (ví dụ: thay `SOUL.md` bằng một tính cách khác).

Để giọng văn bớt chung chung, hãy bắt đầu với [Hướng dẫn tính cách SOUL.md](/vi/concepts/soul).

Để kiểm tra mức đóng góp của từng tệp được chèn (dữ liệu thô so với dữ liệu được chèn, việc cắt bớt, chi phí bổ sung của lược đồ công cụ), hãy dùng `/context list` hoặc `/context detail`. Xem [Ngữ cảnh](/vi/concepts/context).

## Xử lý thời gian

Phần **Ngày & giờ hiện tại** chỉ xuất hiện khi biết múi giờ của người dùng và chỉ bao gồm **múi giờ** (không có đồng hồ động hoặc định dạng thời gian) để giữ bộ nhớ đệm lời nhắc ổn định.

Dùng `session_status` khi tác tử cần thời gian hiện tại; thẻ trạng thái của công cụ này có một dòng dấu thời gian. Công cụ này cũng có thể tùy chọn đặt phần ghi đè mô hình theo từng phiên (`model=default` sẽ xóa phần ghi đè).

Cấu hình bằng:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Xem [Múi giờ](/vi/concepts/timezone) và [Ngày & giờ](/vi/date-time) để biết đầy đủ chi tiết về hành vi.

## Skills

Khi có các Skills đủ điều kiện, OpenClaw chèn một danh sách `<available_skills>` rút gọn (`formatSkillsForPrompt`) kèm **đường dẫn tệp** và dấu `<version>sha256:...</version>` được suy ra từ nội dung cho từng Skills. Lời nhắc hướng dẫn mô hình dùng `read` để tải SKILL.md tại vị trí được liệt kê (trong không gian làm việc, được quản lý hoặc đi kèm) và đọc lại một Skills khi `<version>` của nó khác với lượt trước. Nếu không có Skills nào đủ điều kiện, phần Skills sẽ bị lược bỏ.

Các lượt Codex gốc nhận danh sách này dưới dạng chỉ dẫn dành cho nhà phát triển về cộng tác trong phạm vi lượt, thay vì dữ liệu đầu vào của người dùng theo từng lượt, ngoại trừ các lượt cron nhẹ giữ nguyên chính xác lời nhắc đã lập lịch. Các bộ khung khác giữ nguyên phần lời nhắc thông thường.

Vị trí có thể trỏ đến một Skills lồng nhau, chẳng hạn như `skills/personal/foo/SKILL.md`. Việc lồng nhau chỉ nhằm mục đích tổ chức; lời nhắc sử dụng tên Skills phẳng từ phần frontmatter của `SKILL.md`.

Điều kiện đủ bao gồm các cổng siêu dữ liệu của Skills, kiểm tra môi trường/cấu hình thời gian chạy và danh sách cho phép Skills hiệu dụng của tác tử khi `agents.defaults.skills` hoặc `agents.list[].skills` được cấu hình. Các Skills đi kèm Plugin chỉ đủ điều kiện khi Plugin sở hữu chúng được bật, cho phép các Plugin công cụ cung cấp hướng dẫn vận hành chuyên sâu hơn mà không cần nhúng toàn bộ hướng dẫn đó vào mọi mô tả công cụ.

```xml
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
    <version>sha256:...</version>
  </skill>
</available_skills>
```

Cách này giữ lời nhắc cơ sở ở mức nhỏ trong khi vẫn cho phép sử dụng Skills có mục tiêu. Việc định cỡ do hệ thống con Skills quản lý, tách biệt với việc định cỡ đọc/chèn chung của thời gian chạy:

| Phạm vi   | Ngân sách lời nhắc Skills                         | Ngân sách đoạn trích thời gian chạy |
| --------- | ------------------------------------------------- | ----------------------------------- |
| Toàn cục  | `skills.limits.maxSkillsPromptChars`              | `agents.defaults.contextLimits.*`   |
| Theo tác tử | `agents.list[].skillsLimits.maxSkillsPromptChars` | `agents.list[].contextLimits.*`     |

Ngân sách đoạn trích thời gian chạy bao gồm `memory_get`, kết quả công cụ trực tiếp và các lần làm mới `AGENTS.md` sau Compaction.

## Tài liệu

Phần **Tài liệu** trỏ đến tài liệu cục bộ khi có sẵn (`docs/` trong bản sao làm việc Git hoặc tài liệu của gói npm đi kèm), nếu không sẽ dùng [https://docs.openclaw.ai](https://docs.openclaw.ai). Phần này cũng liệt kê vị trí mã nguồn OpenClaw: các bản sao làm việc Git hiển thị thư mục gốc mã nguồn cục bộ, còn các bản cài đặt từ gói nhận URL mã nguồn GitHub kèm hướng dẫn xem xét mã nguồn tại đó khi tài liệu không đầy đủ hoặc đã lỗi thời.

Lời nhắc xác định tài liệu là nguồn có thẩm quyền về kiến thức nội tại của OpenClaw trước khi mô hình hiểu cách OpenClaw hoạt động (bộ nhớ/ghi chú hằng ngày, phiên, công cụ, Gateway, cấu hình, lệnh, ngữ cảnh dự án), đồng thời yêu cầu mô hình xem `AGENTS.md`, ngữ cảnh dự án, ghi chú không gian làm việc/hồ sơ/bộ nhớ và `memory_search` là ngữ cảnh chỉ dẫn hoặc bộ nhớ người dùng thay vì kiến thức về thiết kế/triển khai OpenClaw. Nếu tài liệu không đề cập hoặc đã lỗi thời, mô hình phải nói rõ và kiểm tra mã nguồn. Lời nhắc cũng yêu cầu mô hình tự chạy `openclaw status` khi có thể và chỉ hỏi người dùng khi không có quyền truy cập.

Riêng đối với cấu hình, lời nhắc hướng dẫn tác tử dùng thao tác `config.schema.lookup` của công cụ `gateway` để xem tài liệu và các ràng buộc chính xác ở cấp trường, sau đó tham khảo `docs/gateway/configuration.md` và `docs/gateway/configuration-reference.md` để biết hướng dẫn tổng quát hơn.

## Liên quan

- [Thời gian chạy của tác tử](/vi/concepts/agent)
- [Không gian làm việc của tác tử](/vi/concepts/agent-workspace)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
