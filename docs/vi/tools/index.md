---
read_when:
    - Bạn muốn hiểu OpenClaw cung cấp những công cụ nào
    - Bạn cần cấu hình, cho phép hoặc từ chối các công cụ
    - Bạn đang lựa chọn giữa các công cụ tích hợp sẵn, Skills và Plugin
summary: 'Tổng quan về công cụ và Plugin của OpenClaw: tác tử có thể làm gì và cách mở rộng tác tử'
title: Công cụ và Plugin
x-i18n:
    generated_at: "2026-05-06T09:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 894f6dc7e840f3153e95696a63c470a200886af7d3dc8399e87446cf0fb1b027
    source_path: tools/index.md
    workflow: 16
---

Mọi việc agent thực hiện ngoài việc tạo văn bản đều diễn ra thông qua **công cụ**.
Công cụ là cách agent đọc tệp, chạy lệnh, duyệt web, gửi
tin nhắn và tương tác với thiết bị.

## Công cụ, Skills và Plugin

OpenClaw có ba lớp phối hợp với nhau:

<Steps>
  <Step title="Công cụ là thứ agent gọi">
    Công cụ là một hàm có kiểu mà agent có thể gọi (ví dụ: `exec`, `browser`,
    `web_search`, `message`). OpenClaw cung cấp một tập hợp **công cụ tích hợp sẵn** và
    Plugin có thể đăng ký thêm các công cụ khác.

    Agent xem công cụ như các định nghĩa hàm có cấu trúc được gửi đến API mô hình.

  </Step>

  <Step title="Skills dạy agent khi nào và như thế nào">
    Skill là một tệp markdown (`SKILL.md`) được chèn vào system prompt.
    Skills cung cấp cho agent ngữ cảnh, ràng buộc và hướng dẫn từng bước để
    sử dụng công cụ hiệu quả. Skills nằm trong workspace của bạn, trong các thư mục dùng chung,
    hoặc được đóng gói bên trong Plugin.

    [Tham chiếu Skills](/vi/tools/skills) | [Tạo Skills](/vi/tools/creating-skills)

  </Step>

  <Step title="Plugin đóng gói mọi thứ lại với nhau">
    Plugin là một gói có thể đăng ký bất kỳ tổ hợp năng lực nào:
    kênh, nhà cung cấp mô hình, công cụ, Skills, giọng nói, phiên âm thời gian thực,
    thoại thời gian thực, hiểu phương tiện, tạo hình ảnh, tạo video,
    lấy dữ liệu web, tìm kiếm web và nhiều hơn nữa. Một số Plugin là **lõi** (được phát hành cùng
    OpenClaw), các Plugin khác là **bên ngoài** (được cộng đồng xuất bản trên npm).

    [Cài đặt và cấu hình Plugin](/vi/tools/plugin) | [Tự xây dựng Plugin của bạn](/vi/plugins/building-plugins)

  </Step>
</Steps>

## Công cụ tích hợp sẵn

Các công cụ này được phát hành cùng OpenClaw và có sẵn mà không cần cài đặt Plugin nào:

| Công cụ                                    | Chức năng                                                              | Trang                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Chạy lệnh shell, quản lý tiến trình nền                               | [Exec](/vi/tools/exec), [Phê duyệt Exec](/vi/tools/exec-approvals) |
| `code_execution`                           | Chạy phân tích Python từ xa trong sandbox                             | [Thực thi mã](/vi/tools/code-execution)                         |
| `browser`                                  | Điều khiển trình duyệt Chromium (điều hướng, nhấp, chụp màn hình)     | [Trình duyệt](/vi/tools/browser)                                |
| `web_search` / `x_search` / `web_fetch`    | Tìm kiếm web, tìm kiếm bài đăng X, lấy nội dung trang                 | [Web](/vi/tools/web), [Lấy dữ liệu Web](/vi/tools/web-fetch)       |
| `read` / `write` / `edit`                  | I/O tệp trong workspace                                               |                                                              |
| `apply_patch`                              | Bản vá tệp nhiều hunk                                                 | [Áp dụng bản vá](/vi/tools/apply-patch)                         |
| `message`                                  | Gửi tin nhắn trên mọi kênh                                            | [Agent gửi](/vi/tools/agent-send)                               |
| `canvas`                                   | Điều khiển Canvas node (trình bày, đánh giá, chụp snapshot)           |                                                              |
| `nodes`                                    | Phát hiện và nhắm mục tiêu các thiết bị đã ghép nối                   |                                                              |
| `cron` / `gateway`                         | Quản lý công việc đã lên lịch; kiểm tra, vá, khởi động lại hoặc cập nhật gateway |                                                              |
| `image` / `image_generate`                 | Phân tích hoặc tạo hình ảnh                                           | [Tạo hình ảnh](/vi/tools/image-generation)                      |
| `music_generate`                           | Tạo bản nhạc                                                          | [Tạo nhạc](/vi/tools/music-generation)                          |
| `video_generate`                           | Tạo video                                                             | [Tạo video](/vi/tools/video-generation)                         |
| `tts`                                      | Chuyển văn bản thành giọng nói một lần                                | [TTS](/vi/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Quản lý phiên, trạng thái và điều phối sub-agent                      | [Sub-agent](/vi/tools/subagents)                                |
| `session_status`                           | Đọc lại nhẹ kiểu `/status` và ghi đè mô hình phiên                    | [Công cụ phiên](/vi/concepts/session-tool)                      |

Đối với tác vụ hình ảnh, dùng `image` để phân tích và `image_generate` để tạo hoặc chỉnh sửa. Nếu bạn nhắm tới `openai/*`, `google/*`, `fal/*`, hoặc một nhà cung cấp hình ảnh không mặc định khác, hãy cấu hình khóa xác thực/API của nhà cung cấp đó trước.

Đối với tác vụ âm nhạc, dùng `music_generate`. Nếu bạn nhắm tới `google/*`, `minimax/*`, hoặc một nhà cung cấp âm nhạc không mặc định khác, hãy cấu hình khóa xác thực/API của nhà cung cấp đó trước.

Đối với tác vụ video, dùng `video_generate`. Nếu bạn nhắm tới `qwen/*` hoặc một nhà cung cấp video không mặc định khác, hãy cấu hình khóa xác thực/API của nhà cung cấp đó trước.

Đối với tạo âm thanh theo workflow, dùng `music_generate` khi một Plugin như
ComfyUI đăng ký công cụ này. Công cụ này tách biệt với `tts`, vốn là chuyển văn bản thành giọng nói.

`session_status` là công cụ trạng thái/đọc lại nhẹ trong nhóm phiên.
Nó trả lời các câu hỏi kiểu `/status` về phiên hiện tại và có thể
tùy chọn đặt ghi đè mô hình cho từng phiên; `model=default` xóa
ghi đè đó. Giống như `/status`, nó có thể điền ngược các bộ đếm token/cache thưa và
nhãn mô hình runtime đang hoạt động từ mục usage transcript mới nhất.

`gateway` là công cụ runtime chỉ dành cho chủ sở hữu cho các thao tác gateway:

- `config.schema.lookup` cho một cây con cấu hình theo phạm vi đường dẫn trước khi chỉnh sửa
- `config.get` cho snapshot cấu hình hiện tại + hash
- `config.patch` cho cập nhật cấu hình một phần kèm khởi động lại
- `config.apply` chỉ dành cho thay thế toàn bộ cấu hình
- `update.run` cho tự cập nhật + khởi động lại rõ ràng

Đối với thay đổi một phần, ưu tiên `config.schema.lookup` rồi `config.patch`. Chỉ dùng
`config.apply` khi bạn cố ý thay thế toàn bộ cấu hình.
Để xem tài liệu cấu hình rộng hơn, đọc [Cấu hình](/vi/gateway/configuration) và
[Tham chiếu cấu hình](/vi/gateway/configuration-reference).
Công cụ này cũng từ chối thay đổi `tools.exec.ask` hoặc `tools.exec.security`;
các alias cũ `tools.bash.*` được chuẩn hóa về cùng các đường dẫn exec được bảo vệ.

### Công cụ do Plugin cung cấp

Plugin có thể đăng ký thêm công cụ. Một số ví dụ:

- [Diff](/vi/tools/diffs) — trình xem và trình render diff
- [Tác vụ LLM](/vi/tools/llm-task) — bước LLM chỉ xuất JSON cho đầu ra có cấu trúc
- [Lobster](/vi/tools/lobster) — runtime workflow có kiểu với phê duyệt có thể tiếp tục
- [Tạo nhạc](/vi/tools/music-generation) — công cụ `music_generate` dùng chung với các nhà cung cấp dựa trên workflow
- [OpenProse](/vi/prose) — điều phối workflow ưu tiên markdown
- [Tokenjuice](/vi/tools/tokenjuice) — thu gọn kết quả công cụ `exec` và `bash` nhiễu

Công cụ Plugin vẫn được tạo bằng `api.registerTool(...)` và khai báo trong
danh sách `contracts.tools` của manifest Plugin. OpenClaw ghi lại
mô tả công cụ đã xác thực trong quá trình phát hiện và lưu cache theo nguồn Plugin và contract, để
việc lập kế hoạch công cụ sau này có thể bỏ qua việc tải runtime Plugin. Thực thi công cụ vẫn tải
Plugin sở hữu và gọi implementation đã đăng ký trực tiếp.

## Cấu hình công cụ

### Danh sách cho phép và từ chối

Kiểm soát công cụ nào agent có thể gọi thông qua `tools.allow` / `tools.deny` trong
config. Từ chối luôn thắng cho phép.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw mặc định đóng khi một allowlist rõ ràng không phân giải được công cụ nào có thể gọi.
Ví dụ, `tools.allow: ["query_db"]` chỉ hoạt động nếu một Plugin đã tải thực sự
đăng ký `query_db`. Nếu không có công cụ tích hợp sẵn, Plugin hoặc công cụ MCP đóng gói nào khớp với
allowlist, lần chạy dừng trước lệnh gọi mô hình thay vì tiếp tục như một
lần chạy chỉ văn bản có thể bịa ra kết quả công cụ.

### Hồ sơ công cụ

`tools.profile` đặt allowlist cơ sở trước khi áp dụng `allow`/`deny`.
Ghi đè theo từng agent: `agents.list[].tools.profile`.

| Hồ sơ       | Nội dung bao gồm                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tất cả công cụ lõi và công cụ Plugin tùy chọn; đường cơ sở không hạn chế cho quyền truy cập lệnh/điều khiển rộng hơn                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Chỉ `session_status`                                                                                                                              |

<Note>
`tools.profile: "messaging"` được cố ý giới hạn hẹp cho các agent tập trung vào kênh.
Nó bỏ qua các công cụ lệnh/điều khiển rộng hơn như hệ thống tệp, runtime,
trình duyệt, canvas, nodes, cron và điều khiển gateway. Dùng `tools.profile: "full"`
làm đường cơ sở không hạn chế cho quyền truy cập lệnh/điều khiển rộng hơn, rồi thu hẹp
quyền truy cập bằng `tools.allow` / `tools.deny` khi cần.
</Note>

`coding` bao gồm các công cụ web nhẹ (`web_search`, `web_fetch`, `x_search`)
nhưng không bao gồm công cụ điều khiển trình duyệt đầy đủ. Tự động hóa trình duyệt có thể điều khiển
các phiên thật và hồ sơ đã đăng nhập, vì vậy hãy thêm rõ ràng bằng
`tools.alsoAllow: ["browser"]` hoặc theo từng agent
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Việc cấu hình `tools.exec` hoặc `tools.fs` dưới một hồ sơ hạn chế (`messaging`, `minimal`) không ngầm mở rộng allowlist của hồ sơ đó. Thêm các mục `tools.alsoAllow` rõ ràng (ví dụ `["exec", "process"]` cho exec, hoặc `["read", "write", "edit"]` cho fs) khi bạn muốn một hồ sơ hạn chế dùng các phần đã cấu hình đó. OpenClaw ghi một cảnh báo khởi động khi một phần cấu hình hiện diện mà không có quyền `alsoAllow` khớp.
</Note>

Các hồ sơ `coding` và `messaging` cũng cho phép các công cụ bundle MCP đã cấu hình
dưới khóa Plugin `bundle-mcp`. Thêm `tools.deny: ["bundle-mcp"]` khi bạn
muốn một hồ sơ giữ các công cụ tích hợp sẵn thông thường nhưng ẩn tất cả công cụ MCP đã cấu hình.
Hồ sơ `minimal` không bao gồm công cụ bundle MCP.

Ví dụ (bề mặt công cụ rộng nhất theo mặc định):

```json5
{
  tools: {
    profile: "full",
  },
}
```

### Nhóm công cụ

Dùng cách viết tắt `group:*` trong danh sách cho phép/từ chối:

| Nhóm               | Công cụ                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` được chấp nhận làm bí danh cho `exec`)                              |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | heartbeat_respond, cron, gateway                                                                          |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list, update_plan                                                                                  |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tất cả công cụ OpenClaw tích hợp sẵn (không bao gồm công cụ Plugin)                                       |

`sessions_history` trả về một chế độ xem truy hồi có giới hạn và được lọc an toàn. Nó loại bỏ
các thẻ suy nghĩ, khung dựng `<relevant-memories>`, payload XML lời gọi công cụ dạng văn bản thuần
(bao gồm `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` và các khối lời gọi công cụ bị cắt ngắn),
khung dựng lời gọi công cụ đã hạ cấp, các token điều khiển mô hình ASCII/toàn độ rộng bị rò rỉ,
và XML lời gọi công cụ MiniMax sai định dạng khỏi văn bản của trợ lý, sau đó áp dụng
biên tập che giấu/cắt ngắn và các placeholder có thể có cho hàng quá khổ thay vì hoạt động
như một bản đổ transcript thô.

### Hạn chế theo nhà cung cấp

Dùng `tools.byProvider` để giới hạn công cụ cho các nhà cung cấp cụ thể mà không
thay đổi mặc định toàn cục:

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
