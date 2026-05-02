---
read_when:
    - Bạn muốn hiểu OpenClaw cung cấp những công cụ nào
    - Bạn cần cấu hình, cho phép hoặc từ chối các công cụ
    - Bạn đang lựa chọn giữa các công cụ tích hợp sẵn, Skills và Plugin
summary: 'Tổng quan về công cụ và Plugin của OpenClaw: tác nhân có thể làm gì và cách mở rộng tác nhân'
title: Công cụ và Plugin
x-i18n:
    generated_at: "2026-05-02T20:58:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 892eb520c14c13e4f55c80aa17ccd2578cc803796844c15cd71674cb2a0a8adf
    source_path: tools/index.md
    workflow: 16
---

Mọi việc agent thực hiện ngoài việc tạo văn bản đều diễn ra thông qua **công cụ**.
Công cụ là cách agent đọc tệp, chạy lệnh, duyệt web, gửi
tin nhắn và tương tác với thiết bị.

## Công cụ, Skills và plugin

OpenClaw có ba lớp hoạt động cùng nhau:

<Steps>
  <Step title="Công cụ là thứ agent gọi">
    Công cụ là một hàm có kiểu mà agent có thể gọi (ví dụ: `exec`, `browser`,
    `web_search`, `message`). OpenClaw cung cấp một tập hợp **công cụ tích hợp sẵn** và
    plugin có thể đăng ký thêm công cụ.

    Agent thấy công cụ dưới dạng các định nghĩa hàm có cấu trúc được gửi đến model API.

  </Step>

  <Step title="Skills dạy agent khi nào và bằng cách nào">
    Skill là một tệp markdown (`SKILL.md`) được chèn vào system prompt.
    Skills cung cấp cho agent ngữ cảnh, ràng buộc và hướng dẫn từng bước để
    sử dụng công cụ hiệu quả. Skills nằm trong workspace của bạn, trong các thư mục dùng chung,
    hoặc được đóng gói bên trong plugin.

    [Tài liệu tham khảo về Skills](/vi/tools/skills) | [Tạo Skills](/vi/tools/creating-skills)

  </Step>

  <Step title="Plugin đóng gói mọi thứ lại với nhau">
    Plugin là một gói có thể đăng ký bất kỳ tổ hợp năng lực nào:
    kênh, nhà cung cấp model, công cụ, Skills, lời nói, phiên âm thời gian thực,
    giọng nói thời gian thực, hiểu phương tiện, tạo ảnh, tạo video,
    web fetch, web search và hơn thế nữa. Một số plugin là **core** (được phát hành cùng
    OpenClaw), số khác là **external** (được cộng đồng phát hành trên npm).

    [Cài đặt và cấu hình plugin](/vi/tools/plugin) | [Tự xây dựng](/vi/plugins/building-plugins)

  </Step>
</Steps>

## Công cụ tích hợp sẵn

Các công cụ này được phát hành cùng OpenClaw và có sẵn mà không cần cài đặt bất kỳ plugin nào:

| Công cụ                                    | Chức năng                                                             | Trang                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Chạy lệnh shell, quản lý tiến trình nền                               | [Exec](/vi/tools/exec), [Phê duyệt Exec](/vi/tools/exec-approvals) |
| `code_execution`                           | Chạy phân tích Python từ xa trong sandbox                             | [Code Execution](/vi/tools/code-execution)                      |
| `browser`                                  | Điều khiển trình duyệt Chromium (điều hướng, nhấp, chụp màn hình)     | [Browser](/vi/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Tìm kiếm web, tìm kiếm bài đăng X, lấy nội dung trang                 | [Web](/vi/tools/web), [Web Fetch](/vi/tools/web-fetch)             |
| `read` / `write` / `edit`                  | I/O tệp trong workspace                                               |                                                              |
| `apply_patch`                              | Bản vá tệp nhiều hunk                                                 | [Apply Patch](/vi/tools/apply-patch)                            |
| `message`                                  | Gửi tin nhắn qua tất cả các kênh                                      | [Agent Send](/vi/tools/agent-send)                              |
| `canvas`                                   | Điều khiển node Canvas (trình bày, đánh giá, snapshot)                |                                                              |
| `nodes`                                    | Khám phá và nhắm mục tiêu các thiết bị đã ghép nối                    |                                                              |
| `cron` / `gateway`                         | Quản lý tác vụ theo lịch; kiểm tra, vá, khởi động lại hoặc cập nhật gateway |                                                              |
| `image` / `image_generate`                 | Phân tích hoặc tạo ảnh                                                | [Tạo ảnh](/vi/tools/image-generation)                           |
| `music_generate`                           | Tạo bản nhạc                                                          | [Tạo nhạc](/vi/tools/music-generation)                          |
| `video_generate`                           | Tạo video                                                             | [Tạo video](/vi/tools/video-generation)                         |
| `tts`                                      | Chuyển văn bản thành giọng nói một lần                                | [TTS](/vi/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Quản lý phiên, trạng thái và điều phối sub-agent                      | [Sub-agent](/vi/tools/subagents)                                |
| `session_status`                           | Phản hồi đọc nhẹ kiểu `/status` và ghi đè model cho phiên             | [Công cụ phiên](/vi/concepts/session-tool)                      |

Đối với công việc về ảnh, dùng `image` để phân tích và `image_generate` để tạo hoặc chỉnh sửa. Nếu bạn nhắm đến `openai/*`, `google/*`, `fal/*` hoặc một nhà cung cấp ảnh không mặc định khác, hãy cấu hình khóa auth/API của nhà cung cấp đó trước.

Đối với công việc về nhạc, dùng `music_generate`. Nếu bạn nhắm đến `google/*`, `minimax/*` hoặc một nhà cung cấp nhạc không mặc định khác, hãy cấu hình khóa auth/API của nhà cung cấp đó trước.

Đối với công việc về video, dùng `video_generate`. Nếu bạn nhắm đến `qwen/*` hoặc một nhà cung cấp video không mặc định khác, hãy cấu hình khóa auth/API của nhà cung cấp đó trước.

Đối với tạo âm thanh theo workflow, dùng `music_generate` khi một plugin như
ComfyUI đăng ký công cụ này. Điều này tách biệt với `tts`, vốn là chuyển văn bản thành giọng nói.

`session_status` là công cụ trạng thái/phản hồi đọc nhẹ trong nhóm phiên.
Nó trả lời các câu hỏi kiểu `/status` về phiên hiện tại và có thể
tùy chọn đặt ghi đè model cho từng phiên; `model=default` xóa
ghi đè đó. Giống như `/status`, nó có thể điền bù các bộ đếm token/cache thưa thớt và
nhãn model runtime đang hoạt động từ mục usage transcript mới nhất.

`gateway` là công cụ runtime chỉ dành cho owner cho các thao tác gateway:

- `config.schema.lookup` cho một cây con cấu hình theo phạm vi đường dẫn trước khi chỉnh sửa
- `config.get` cho snapshot cấu hình hiện tại + hash
- `config.patch` cho cập nhật cấu hình một phần kèm khởi động lại
- `config.apply` chỉ dành cho thay thế toàn bộ cấu hình
- `update.run` cho tự cập nhật rõ ràng + khởi động lại

Đối với thay đổi một phần, ưu tiên `config.schema.lookup` rồi `config.patch`. Chỉ dùng
`config.apply` khi bạn cố ý thay thế toàn bộ cấu hình.
Để xem tài liệu cấu hình rộng hơn, đọc [Cấu hình](/vi/gateway/configuration) và
[Tài liệu tham khảo cấu hình](/vi/gateway/configuration-reference).
Công cụ này cũng từ chối thay đổi `tools.exec.ask` hoặc `tools.exec.security`;
các alias cũ `tools.bash.*` được chuẩn hóa về cùng các đường dẫn exec được bảo vệ.

### Công cụ do plugin cung cấp

Plugin có thể đăng ký thêm công cụ. Một số ví dụ:

- [Diffs](/vi/tools/diffs) — trình xem và trình kết xuất diff
- [LLM Task](/vi/tools/llm-task) — bước LLM chỉ JSON cho đầu ra có cấu trúc
- [Lobster](/vi/tools/lobster) — runtime workflow có kiểu với phê duyệt có thể tiếp tục
- [Tạo nhạc](/vi/tools/music-generation) — công cụ `music_generate` dùng chung với các nhà cung cấp dựa trên workflow
- [OpenProse](/vi/prose) — điều phối workflow ưu tiên markdown
- [Tokenjuice](/vi/tools/tokenjuice) — thu gọn kết quả công cụ `exec` và `bash` nhiễu

Công cụ plugin vẫn được tạo bằng `api.registerTool(...)` và được khai báo trong
danh sách `contracts.tools` của manifest plugin. OpenClaw ghi lại
mô tả công cụ đã xác thực trong quá trình khám phá và cache theo nguồn plugin và contract, để
lập kế hoạch công cụ về sau có thể bỏ qua việc tải runtime plugin. Việc thực thi công cụ vẫn tải
plugin sở hữu và gọi implementation đã đăng ký đang hoạt động.

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

OpenClaw mặc định từ chối khi một allowlist rõ ràng không phân giải thành công cụ nào có thể gọi.
Ví dụ, `tools.allow: ["query_db"]` chỉ hoạt động nếu một plugin đã tải thực sự
đăng ký `query_db`. Nếu không có công cụ tích hợp sẵn, plugin hoặc công cụ MCP đóng gói nào khớp với
allowlist, lần chạy dừng trước lệnh gọi model thay vì tiếp tục dưới dạng
lần chạy chỉ văn bản có thể tạo ảo giác về kết quả công cụ.

### Hồ sơ công cụ

`tools.profile` đặt allowlist cơ sở trước khi áp dụng `allow`/`deny`.
Ghi đè theo agent: `agents.list[].tools.profile`.

| Hồ sơ       | Bao gồm                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Baseline không giới hạn cho quyền truy cập command/control rộng hơn; giống như để trống `tools.profile`                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Chỉ `session_status`                                                                                                                              |

<Note>
`tools.profile: "messaging"` được cố ý giữ hẹp cho các agent tập trung vào kênh.
Nó loại bỏ các công cụ command/control rộng hơn như filesystem, runtime,
browser, canvas, nodes, cron và điều khiển gateway. Dùng `tools.profile: "full"`
làm baseline không giới hạn cho quyền truy cập command/control rộng hơn, rồi thu hẹp
quyền truy cập bằng `tools.allow` / `tools.deny` khi cần.
</Note>

`coding` bao gồm các công cụ web nhẹ (`web_search`, `web_fetch`, `x_search`)
nhưng không bao gồm công cụ điều khiển trình duyệt đầy đủ. Tự động hóa trình duyệt có thể điều khiển
các phiên thật và hồ sơ đã đăng nhập, vì vậy hãy thêm rõ ràng bằng
`tools.alsoAllow: ["browser"]` hoặc theo từng agent
`agents.list[].tools.alsoAllow: ["browser"]`.

<Note>
Cấu hình `tools.exec` hoặc `tools.fs` dưới một hồ sơ hạn chế (`messaging`, `minimal`) không tự động mở rộng allowlist của hồ sơ đó. Thêm các mục `tools.alsoAllow` rõ ràng (ví dụ `["exec", "process"]` cho exec, hoặc `["read", "write", "edit"]` cho fs) khi bạn muốn một hồ sơ hạn chế sử dụng các phần đã cấu hình đó. OpenClaw ghi cảnh báo khởi động khi có một phần cấu hình nhưng không có quyền cấp `alsoAllow` tương ứng.
</Note>

Các hồ sơ `coding` và `messaging` cũng cho phép các công cụ bundle MCP đã cấu hình
dưới khóa plugin `bundle-mcp`. Thêm `tools.deny: ["bundle-mcp"]` khi bạn
muốn một hồ sơ giữ các built-in bình thường của nó nhưng ẩn toàn bộ công cụ MCP đã cấu hình.
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

`sessions_history` trả về một khung xem truy hồi có giới hạn và đã lọc an toàn. Nó loại bỏ
các thẻ suy nghĩ, khung dựng `<relevant-memories>`, payload XML lệnh gọi công cụ dạng văn bản thuần
(bao gồm `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` và các khối lệnh gọi công cụ bị cắt ngắn),
khung dựng lệnh gọi công cụ đã hạ cấp, các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ,
và XML lệnh gọi công cụ MiniMax sai định dạng khỏi văn bản của trợ lý, sau đó áp dụng
biên tập ẩn/cắt ngắn và các placeholder có thể có cho hàng quá lớn thay vì hoạt động
như một bản kết xuất bản ghi thô.

### Hạn chế theo từng nhà cung cấp

Sử dụng `tools.byProvider` để hạn chế công cụ cho các nhà cung cấp cụ thể mà không
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
