---
read_when:
    - Bạn muốn hiểu OpenClaw cung cấp những công cụ nào
    - Bạn cần cấu hình, cho phép hoặc từ chối các công cụ
    - Bạn đang quyết định giữa các công cụ tích hợp sẵn, Skills và Plugin
summary: 'Tổng quan về công cụ và Plugin của OpenClaw: tác nhân có thể làm gì và cách mở rộng tác nhân'
title: Công cụ và Plugin
x-i18n:
    generated_at: "2026-05-07T13:25:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: e001a51222a1b838ded2498bcedc6bd95dbc0a8912850ad7de21e28b25c50790
    source_path: tools/index.md
    workflow: 16
---

Mọi việc tác nhân thực hiện ngoài việc tạo văn bản đều diễn ra thông qua **công cụ**.
Công cụ là cách tác nhân đọc tệp, chạy lệnh, duyệt web, gửi
tin nhắn và tương tác với thiết bị.

## Công cụ, Skills và plugin

OpenClaw có ba lớp hoạt động cùng nhau:

<Steps>
  <Step title="Công cụ là thứ tác nhân gọi">
    Công cụ là một hàm có kiểu mà tác nhân có thể gọi (ví dụ: `exec`, `browser`,
    `web_search`, `message`). OpenClaw cung cấp một tập hợp **công cụ tích hợp sẵn** và
    các plugin có thể đăng ký thêm công cụ.

    Tác nhân thấy công cụ dưới dạng các định nghĩa hàm có cấu trúc được gửi tới API mô hình.

  </Step>

  <Step title="Skills dạy tác nhân khi nào và bằng cách nào">
    Skill là một tệp markdown (`SKILL.md`) được chèn vào system prompt.
    Skills cung cấp cho tác nhân ngữ cảnh, ràng buộc và hướng dẫn từng bước để
    sử dụng công cụ hiệu quả. Skills nằm trong workspace của bạn, trong các thư mục dùng chung,
    hoặc được đóng gói bên trong plugin.

    [Tham chiếu Skills](/vi/tools/skills) | [Tạo Skills](/vi/tools/creating-skills)

  </Step>

  <Step title="Plugin đóng gói mọi thứ lại với nhau">
    Plugin là một gói có thể đăng ký bất kỳ tổ hợp năng lực nào:
    kênh, nhà cung cấp mô hình, công cụ, Skills, giọng nói, phiên âm realtime,
    thoại realtime, hiểu phương tiện, tạo ảnh, tạo video,
    tải web, tìm kiếm web, v.v. Một số plugin là **core** (được phân phối cùng
    OpenClaw), các plugin khác là **bên ngoài** (được cộng đồng phát hành trên npm).

    [Cài đặt và cấu hình plugin](/vi/tools/plugin) | [Tự xây dựng](/vi/plugins/building-plugins)

  </Step>
</Steps>

## Công cụ tích hợp sẵn

Các công cụ này được phân phối cùng OpenClaw và có sẵn mà không cần cài đặt plugin nào:

| Công cụ                                    | Chức năng                                                              | Trang                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Chạy lệnh shell, quản lý tiến trình nền                               | [Exec](/vi/tools/exec), [Phê duyệt Exec](/vi/tools/exec-approvals) |
| `code_execution`                           | Chạy phân tích Python từ xa trong sandbox                             | [Thực thi mã](/vi/tools/code-execution)                         |
| `browser`                                  | Điều khiển trình duyệt Chromium (điều hướng, nhấp, chụp màn hình)     | [Trình duyệt](/vi/tools/browser)                                |
| `web_search` / `x_search` / `web_fetch`    | Tìm kiếm web, tìm kiếm bài đăng X, tải nội dung trang                 | [Web](/vi/tools/web), [Tải Web](/vi/tools/web-fetch)               |
| `read` / `write` / `edit`                  | I/O tệp trong workspace                                               |                                                              |
| `apply_patch`                              | Bản vá tệp nhiều hunk                                                 | [Áp dụng bản vá](/vi/tools/apply-patch)                         |
| `message`                                  | Gửi tin nhắn qua tất cả các kênh                                      | [Tác nhân gửi](/vi/tools/agent-send)                            |
| `nodes`                                    | Khám phá và nhắm mục tiêu các thiết bị đã ghép đôi                    |                                                              |
| `cron` / `gateway`                         | Quản lý tác vụ đã lên lịch; kiểm tra, vá, khởi động lại hoặc cập nhật gateway |                                                              |
| `image` / `image_generate`                 | Phân tích hoặc tạo ảnh                                                | [Tạo ảnh](/vi/tools/image-generation)                           |
| `music_generate`                           | Tạo bản nhạc                                                          | [Tạo nhạc](/vi/tools/music-generation)                          |
| `video_generate`                           | Tạo video                                                            | [Tạo video](/vi/tools/video-generation)                         |
| `tts`                                      | Chuyển văn bản thành giọng nói một lần                                | [TTS](/vi/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Quản lý phiên, trạng thái và điều phối tác nhân phụ                   | [Tác nhân phụ](/vi/tools/subagents)                             |
| `session_status`                           | Đọc lại nhẹ kiểu `/status` và ghi đè mô hình phiên                    | [Công cụ phiên](/vi/concepts/session-tool)                      |

Với công việc về ảnh, dùng `image` để phân tích và `image_generate` để tạo hoặc chỉnh sửa. Nếu bạn nhắm tới `openai/*`, `google/*`, `fal/*`, hoặc một nhà cung cấp ảnh không mặc định khác, hãy cấu hình auth/API key của nhà cung cấp đó trước.

Với công việc về nhạc, dùng `music_generate`. Nếu bạn nhắm tới `google/*`, `minimax/*`, hoặc một nhà cung cấp nhạc không mặc định khác, hãy cấu hình auth/API key của nhà cung cấp đó trước.

Với công việc về video, dùng `video_generate`. Nếu bạn nhắm tới `qwen/*` hoặc một nhà cung cấp video không mặc định khác, hãy cấu hình auth/API key của nhà cung cấp đó trước.

Để tạo âm thanh theo workflow, dùng `music_generate` khi một plugin như
ComfyUI đăng ký nó. Công cụ này tách biệt với `tts`, tức chuyển văn bản thành giọng nói.

`session_status` là công cụ trạng thái/đọc lại nhẹ trong nhóm phiên.
Nó trả lời các câu hỏi kiểu `/status` về phiên hiện tại và có thể
tùy chọn đặt một ghi đè mô hình theo từng phiên; `model=default` xóa
ghi đè đó. Giống như `/status`, nó có thể điền bù các bộ đếm token/cache thưa thớt và
nhãn mô hình runtime đang hoạt động từ mục sử dụng transcript mới nhất.

`gateway` là công cụ runtime chỉ dành cho chủ sở hữu cho các thao tác gateway:

- `config.schema.lookup` cho một cây con cấu hình theo phạm vi đường dẫn trước khi chỉnh sửa
- `config.get` cho snapshot cấu hình hiện tại + hash
- `config.patch` cho cập nhật cấu hình một phần kèm khởi động lại
- `config.apply` chỉ dành cho thay thế toàn bộ cấu hình
- `update.run` cho tự cập nhật rõ ràng + khởi động lại

Với thay đổi một phần, ưu tiên `config.schema.lookup` rồi `config.patch`. Chỉ dùng
`config.apply` khi bạn chủ ý thay thế toàn bộ cấu hình.
Để xem tài liệu cấu hình rộng hơn, hãy đọc [Cấu hình](/vi/gateway/configuration) và
[Tham chiếu cấu hình](/vi/gateway/configuration-reference).
Công cụ này cũng từ chối thay đổi `tools.exec.ask` hoặc `tools.exec.security`;
các bí danh cũ `tools.bash.*` được chuẩn hóa về cùng các đường dẫn exec được bảo vệ.

### Công cụ do plugin cung cấp

Plugin có thể đăng ký thêm công cụ. Một số ví dụ:

- [Canvas](/vi/plugins/reference/canvas) — plugin tích hợp thử nghiệm để điều khiển node Canvas và kết xuất A2UI
- [Diffs](/vi/tools/diffs) — trình xem và trình kết xuất diff
- [LLM Task](/vi/tools/llm-task) — bước LLM chỉ JSON cho đầu ra có cấu trúc
- [Lobster](/vi/tools/lobster) — runtime workflow có kiểu với phê duyệt có thể tiếp tục
- [Tạo nhạc](/vi/tools/music-generation) — công cụ `music_generate` dùng chung với các nhà cung cấp dựa trên workflow
- [OpenProse](/vi/prose) — điều phối workflow ưu tiên markdown
- [Tokenjuice](/vi/tools/tokenjuice) — thu gọn kết quả công cụ `exec` và `bash` nhiều nhiễu

Công cụ plugin vẫn được viết bằng `api.registerTool(...)` và khai báo trong
danh sách `contracts.tools` của manifest plugin. OpenClaw thu thập
mô tả công cụ đã xác thực trong quá trình khám phá và lưu vào bộ nhớ đệm theo nguồn plugin và hợp đồng, để
việc lập kế hoạch công cụ sau đó có thể bỏ qua việc tải runtime plugin. Việc thực thi công cụ vẫn tải
plugin sở hữu và gọi triển khai đã đăng ký trực tiếp.

## Cấu hình công cụ

### Danh sách cho phép và từ chối

Kiểm soát công cụ nào tác nhân có thể gọi thông qua `tools.allow` / `tools.deny` trong
cấu hình. Từ chối luôn thắng cho phép.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw đóng theo hướng an toàn khi một allowlist rõ ràng không phân giải được công cụ có thể gọi nào.
Ví dụ, `tools.allow: ["query_db"]` chỉ hoạt động nếu một plugin đã tải thực sự
đăng ký `query_db`. Nếu không có công cụ tích hợp sẵn, plugin hoặc công cụ MCP đóng gói nào khớp với
allowlist, lượt chạy sẽ dừng trước lệnh gọi mô hình thay vì tiếp tục như một
lượt chạy chỉ văn bản có thể bịa ra kết quả công cụ.

### Hồ sơ công cụ

`tools.profile` đặt allowlist cơ sở trước khi áp dụng `allow`/`deny`.
Ghi đè theo từng tác nhân: `agents.list[].tools.profile`.

| Hồ sơ       | Bao gồm                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tất cả công cụ core và công cụ plugin tùy chọn; đường cơ sở không hạn chế cho truy cập lệnh/điều khiển rộng hơn                                  |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Chỉ `session_status`                                                                                                                              |

<Note>
`tools.profile: "messaging"` được chủ ý giới hạn hẹp cho các tác nhân tập trung vào kênh.
Nó bỏ qua các công cụ lệnh/điều khiển rộng hơn như hệ thống tệp, runtime,
trình duyệt, canvas, nodes, cron và điều khiển gateway. Dùng `tools.profile: "full"`
làm đường cơ sở không hạn chế cho truy cập lệnh/điều khiển rộng hơn, rồi thu hẹp
truy cập bằng `tools.allow` / `tools.deny` khi cần.
</Note>

`coding` bao gồm các công cụ web nhẹ (`web_search`, `web_fetch`, `x_search`)
nhưng không bao gồm công cụ điều khiển trình duyệt đầy đủ. Tự động hóa trình duyệt có thể điều khiển các
phiên thật và hồ sơ đã đăng nhập, vì vậy hãy thêm nó rõ ràng bằng
`tools.alsoAllow: ["browser"]` hoặc theo từng tác nhân
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Cấu hình `tools.exec` hoặc `tools.fs` dưới một hồ sơ hạn chế (`messaging`, `minimal`) không ngầm mở rộng allowlist của hồ sơ. Thêm các mục `tools.alsoAllow` rõ ràng (ví dụ `["exec", "process"]` cho exec, hoặc `["read", "write", "edit"]` cho fs) khi bạn muốn một hồ sơ hạn chế sử dụng các phần đã cấu hình đó. OpenClaw ghi cảnh báo khởi động khi một phần cấu hình tồn tại mà không có cấp quyền `alsoAllow` khớp.
</Note>

Các hồ sơ `coding` và `messaging` cũng cho phép công cụ MCP đóng gói đã cấu hình
dưới khóa plugin `bundle-mcp`. Thêm `tools.deny: ["bundle-mcp"]` khi bạn
muốn một hồ sơ giữ các công cụ tích hợp sẵn bình thường nhưng ẩn mọi công cụ MCP đã cấu hình.
Hồ sơ `minimal` không bao gồm công cụ MCP đóng gói.

Ví dụ (bề mặt công cụ rộng nhất theo mặc định):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Nhóm công cụ

Dùng các dạng viết tắt `group:*` trong danh sách cho phép/từ chối:

| Nhóm               | Công cụ                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` được chấp nhận làm bí danh cho `exec`)                              |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas khi Plugin Canvas đi kèm được bật                                                         |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tất cả công cụ OpenClaw tích hợp sẵn (không bao gồm công cụ Plugin)                                       |

`sessions_history` trả về một chế độ xem nhớ lại có giới hạn và đã được lọc an toàn. Nó loại bỏ
thẻ tư duy, khung `<relevant-memories>`, tải trọng XML lệnh gọi công cụ dạng văn bản thuần
(bao gồm `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, và các khối lệnh gọi công cụ bị cắt ngắn),
khung lệnh gọi công cụ bị hạ cấp, token điều khiển mô hình ASCII/toàn chiều bị rò rỉ,
và XML lệnh gọi công cụ MiniMax sai định dạng khỏi văn bản của assistant, sau đó áp dụng
ẩn thông tin/cắt ngắn và các placeholder khả dĩ cho hàng quá khổ thay vì hoạt động
như một bản đổ transcript thô.

### Các hạn chế dành riêng cho nhà cung cấp

Dùng `tools.byProvider` để hạn chế công cụ cho các nhà cung cấp cụ thể mà không
thay đổi giá trị mặc định toàn cục:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
