---
read_when:
    - Bạn muốn hiểu OpenClaw cung cấp những công cụ nào
    - Bạn cần cấu hình, cho phép hoặc từ chối các công cụ
    - Bạn đang quyết định giữa công cụ tích hợp sẵn, Skills và plugins
summary: 'Tổng quan về các công cụ và Plugin của OpenClaw: tác tử có thể làm gì và cách mở rộng tác tử'
title: Công cụ và plugin
x-i18n:
    generated_at: "2026-05-03T21:37:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f776639ec2a90d8c02418c4b2c62ae7534ea535f626bc1172f1301c32c6f0
    source_path: tools/index.md
    workflow: 16
---

Mọi việc agent thực hiện ngoài tạo văn bản đều diễn ra thông qua **công cụ**.
Công cụ là cách agent đọc tệp, chạy lệnh, duyệt web, gửi
tin nhắn và tương tác với thiết bị.

## Công cụ, Skills và Plugin

OpenClaw có ba lớp hoạt động cùng nhau:

<Steps>
  <Step title="Công cụ là thứ agent gọi">
    Công cụ là một hàm có kiểu mà agent có thể gọi (ví dụ: `exec`, `browser`,
    `web_search`, `message`). OpenClaw cung cấp một tập hợp **công cụ tích hợp sẵn** và
    Plugin có thể đăng ký thêm các công cụ khác.

    Agent nhìn thấy công cụ dưới dạng các định nghĩa hàm có cấu trúc được gửi đến model API.

  </Step>

  <Step title="Skills dạy agent khi nào và bằng cách nào">
    Skill là một tệp markdown (`SKILL.md`) được chèn vào system prompt.
    Skills cung cấp cho agent ngữ cảnh, ràng buộc và hướng dẫn từng bước để
    sử dụng công cụ hiệu quả. Skills nằm trong workspace của bạn, trong các thư mục dùng chung,
    hoặc được đóng gói bên trong Plugin.

    [Tham chiếu Skills](/vi/tools/skills) | [Tạo Skills](/vi/tools/creating-skills)

  </Step>

  <Step title="Plugin đóng gói mọi thứ lại với nhau">
    Plugin là một gói có thể đăng ký bất kỳ tổ hợp năng lực nào:
    kênh, nhà cung cấp mô hình, công cụ, Skills, giọng nói, phiên âm realtime,
    thoại realtime, hiểu media, tạo ảnh, tạo video,
    web fetch, web search và nhiều hơn nữa. Một số Plugin là **lõi** (được phân phối cùng
    OpenClaw), các Plugin khác là **bên ngoài** (được cộng đồng xuất bản trên npm).

    [Cài đặt và cấu hình Plugin](/vi/tools/plugin) | [Tự xây dựng Plugin của bạn](/vi/plugins/building-plugins)

  </Step>
</Steps>

## Công cụ tích hợp sẵn

Các công cụ này được phân phối cùng OpenClaw và có sẵn mà không cần cài đặt bất kỳ Plugin nào:

| Công cụ                                    | Chức năng                                                              | Trang                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Chạy lệnh shell, quản lý tiến trình nền                               | [Exec](/vi/tools/exec), [Phê duyệt Exec](/vi/tools/exec-approvals) |
| `code_execution`                           | Chạy phân tích Python từ xa trong sandbox                             | [Thực thi mã](/vi/tools/code-execution)                         |
| `browser`                                  | Điều khiển trình duyệt Chromium (điều hướng, nhấp, chụp màn hình)     | [Trình duyệt](/vi/tools/browser)                                |
| `web_search` / `x_search` / `web_fetch`    | Tìm kiếm web, tìm kiếm bài đăng X, lấy nội dung trang                 | [Web](/vi/tools/web), [Web Fetch](/vi/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O tệp trong workspace                                               |                                                              |
| `apply_patch`                              | Bản vá tệp nhiều hunk                                                 | [Apply Patch](/vi/tools/apply-patch)                            |
| `message`                                  | Gửi tin nhắn trên tất cả các kênh                                     | [Agent Send](/vi/tools/agent-send)                              |
| `canvas`                                   | Điều khiển node Canvas (present, eval, snapshot)                      |                                                              |
| `nodes`                                    | Khám phá và nhắm mục tiêu các thiết bị đã ghép đôi                    |                                                              |
| `cron` / `gateway`                         | Quản lý tác vụ đã lên lịch; kiểm tra, vá, khởi động lại hoặc cập nhật gateway |                                                              |
| `image` / `image_generate`                 | Phân tích hoặc tạo ảnh                                                | [Tạo ảnh](/vi/tools/image-generation)                           |
| `music_generate`                           | Tạo bản nhạc                                                          | [Tạo nhạc](/vi/tools/music-generation)                          |
| `video_generate`                           | Tạo video                                                             | [Tạo video](/vi/tools/video-generation)                         |
| `tts`                                      | Chuyển văn bản thành giọng nói một lần                                | [TTS](/vi/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Quản lý phiên, trạng thái và điều phối sub-agent                      | [Sub-agent](/vi/tools/subagents)                                |
| `session_status`                           | Phản hồi đọc lại kiểu `/status` nhẹ và ghi đè mô hình theo phiên      | [Công cụ phiên](/vi/concepts/session-tool)                      |

Đối với công việc về ảnh, dùng `image` để phân tích và `image_generate` để tạo hoặc chỉnh sửa. Nếu bạn nhắm tới `openai/*`, `google/*`, `fal/*`, hoặc một nhà cung cấp ảnh không mặc định khác, hãy cấu hình auth/API key của nhà cung cấp đó trước.

Đối với công việc về nhạc, dùng `music_generate`. Nếu bạn nhắm tới `google/*`, `minimax/*`, hoặc một nhà cung cấp nhạc không mặc định khác, hãy cấu hình auth/API key của nhà cung cấp đó trước.

Đối với công việc về video, dùng `video_generate`. Nếu bạn nhắm tới `qwen/*` hoặc một nhà cung cấp video không mặc định khác, hãy cấu hình auth/API key của nhà cung cấp đó trước.

Đối với tạo âm thanh theo workflow, dùng `music_generate` khi một Plugin như
ComfyUI đăng ký nó. Phần này tách biệt với `tts`, vốn là chuyển văn bản thành giọng nói.

`session_status` là công cụ trạng thái/đọc lại nhẹ trong nhóm phiên.
Nó trả lời các câu hỏi kiểu `/status` về phiên hiện tại và có thể
tùy chọn đặt ghi đè mô hình theo phiên; `model=default` xóa
ghi đè đó. Giống `/status`, nó có thể điền bổ sung các bộ đếm token/cache thưa thớt và
nhãn mô hình runtime đang hoạt động từ mục sử dụng transcript mới nhất.

`gateway` là công cụ runtime chỉ dành cho owner để vận hành gateway:

- `config.schema.lookup` cho một cây con cấu hình theo phạm vi đường dẫn trước khi chỉnh sửa
- `config.get` cho snapshot cấu hình hiện tại + hash
- `config.patch` cho cập nhật cấu hình một phần kèm khởi động lại
- `config.apply` chỉ dành cho thay thế toàn bộ cấu hình
- `update.run` cho tự cập nhật rõ ràng + khởi động lại

Đối với thay đổi một phần, ưu tiên `config.schema.lookup` rồi `config.patch`. Chỉ dùng
`config.apply` khi bạn cố ý thay thế toàn bộ cấu hình.
Để xem tài liệu cấu hình rộng hơn, đọc [Cấu hình](/vi/gateway/configuration) và
[Tham chiếu cấu hình](/vi/gateway/configuration-reference).
Công cụ này cũng từ chối thay đổi `tools.exec.ask` hoặc `tools.exec.security`;
các bí danh cũ `tools.bash.*` được chuẩn hóa về cùng các đường dẫn exec được bảo vệ.

### Công cụ do Plugin cung cấp

Plugin có thể đăng ký thêm công cụ. Một số ví dụ:

- [Diffs](/vi/tools/diffs) — trình xem và renderer diff
- [LLM Task](/vi/tools/llm-task) — bước LLM chỉ JSON cho đầu ra có cấu trúc
- [Lobster](/vi/tools/lobster) — runtime workflow có kiểu với phê duyệt có thể tiếp tục
- [Tạo nhạc](/vi/tools/music-generation) — công cụ `music_generate` dùng chung với các nhà cung cấp dựa trên workflow
- [OpenProse](/vi/prose) — điều phối workflow ưu tiên markdown
- [Tokenjuice](/vi/tools/tokenjuice) — thu gọn kết quả công cụ `exec` và `bash` nhiễu

Công cụ Plugin vẫn được viết bằng `api.registerTool(...)` và được khai báo trong
danh sách `contracts.tools` của manifest Plugin. OpenClaw ghi lại
descriptor công cụ đã xác thực trong quá trình khám phá và cache nó theo nguồn Plugin và contract, để
việc lập kế hoạch công cụ sau này có thể bỏ qua tải runtime Plugin. Thực thi công cụ vẫn tải
Plugin sở hữu và gọi implementation đã đăng ký trực tiếp.

## Cấu hình công cụ

### Danh sách cho phép và từ chối

Kiểm soát công cụ nào agent có thể gọi qua `tools.allow` / `tools.deny` trong
config. Từ chối luôn thắng cho phép.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

OpenClaw đóng theo hướng an toàn khi allowlist rõ ràng không phân giải được công cụ có thể gọi nào.
Ví dụ, `tools.allow: ["query_db"]` chỉ hoạt động nếu một Plugin đã tải thực sự
đăng ký `query_db`. Nếu không có công cụ tích hợp sẵn, Plugin, hoặc công cụ MCP đi kèm nào khớp với
allowlist, lượt chạy dừng trước model call thay vì tiếp tục như một
lượt chạy chỉ văn bản có thể hallucinate kết quả công cụ.

### Hồ sơ công cụ

`tools.profile` đặt allowlist cơ sở trước khi áp dụng `allow`/`deny`.
Ghi đè theo agent: `agents.list[].tools.profile`.

| Hồ sơ       | Nội dung bao gồm                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Tất cả công cụ lõi và công cụ Plugin tùy chọn; baseline không hạn chế cho quyền truy cập command/control rộng hơn                                |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Chỉ `session_status`                                                                                                                              |

<Note>
`tools.profile: "messaging"` được cố ý giữ hẹp cho các
agent tập trung vào kênh. Nó bỏ qua các công cụ command/control rộng hơn như filesystem, runtime,
browser, canvas, nodes, cron và điều khiển gateway. Dùng `tools.profile: "full"`
làm baseline không hạn chế cho quyền truy cập command/control rộng hơn, sau đó thu hẹp
quyền truy cập bằng `tools.allow` / `tools.deny` khi cần.
</Note>

`coding` bao gồm các công cụ web nhẹ (`web_search`, `web_fetch`, `x_search`)
nhưng không bao gồm công cụ điều khiển trình duyệt đầy đủ. Tự động hóa trình duyệt có thể điều khiển
các phiên thật và profile đã đăng nhập, vì vậy hãy thêm rõ ràng bằng
`tools.alsoAllow: ["browser"]` hoặc theo từng agent
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Cấu hình `tools.exec` hoặc `tools.fs` dưới một hồ sơ hạn chế (`messaging`, `minimal`) không ngầm mở rộng allowlist của hồ sơ. Thêm các mục `tools.alsoAllow` rõ ràng (ví dụ `["exec", "process"]` cho exec, hoặc `["read", "write", "edit"]` cho fs) khi bạn muốn một hồ sơ hạn chế sử dụng các phần đã cấu hình đó. OpenClaw ghi cảnh báo khởi động khi có một phần config nhưng không có cấp quyền `alsoAllow` tương ứng.
</Note>

Các hồ sơ `coding` và `messaging` cũng cho phép các công cụ bundle MCP đã cấu hình
dưới khóa Plugin `bundle-mcp`. Thêm `tools.deny: ["bundle-mcp"]` khi bạn
muốn một hồ sơ giữ các công cụ tích hợp sẵn bình thường nhưng ẩn tất cả công cụ MCP đã cấu hình.
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

Dùng các dạng viết tắt `group:*` trong danh sách allow/deny:

| Nhóm               | Công cụ                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` được chấp nhận làm bí danh cho `exec`)                              |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Tất cả công cụ OpenClaw tích hợp sẵn (không bao gồm công cụ Plugin)                                       |

`sessions_history` trả về một chế độ xem truy hồi có giới hạn và được lọc an toàn. Nó loại bỏ
các thẻ suy luận, khung `<relevant-memories>`, payload XML gọi công cụ dạng văn bản thuần
(bao gồm `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn),
khung gọi công cụ đã hạ cấp, token điều khiển mô hình ASCII/toàn độ rộng bị rò rỉ,
và XML gọi công cụ MiniMax sai định dạng khỏi văn bản của trợ lý, sau đó áp dụng
biên tập che giấu/cắt ngắn và có thể dùng placeholder cho hàng quá lớn thay vì hoạt động
như một bản đổ bản ghi thô.

### Hạn chế theo từng nhà cung cấp

Dùng `tools.byProvider` để hạn chế công cụ cho các nhà cung cấp cụ thể mà không
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
