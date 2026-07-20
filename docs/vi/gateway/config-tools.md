---
read_when:
    - Cấu hình chính sách `tools.*`, danh sách cho phép hoặc các tính năng thử nghiệm
    - Đăng ký nhà cung cấp tùy chỉnh hoặc ghi đè URL cơ sở
    - Thiết lập các endpoint tự lưu trữ tương thích với OpenAI
sidebarTitle: Tools and custom providers
summary: Cấu hình công cụ (chính sách, tùy chọn bật/tắt thử nghiệm, công cụ do nhà cung cấp hỗ trợ) và thiết lập nhà cung cấp/URL cơ sở tùy chỉnh
title: Cấu hình — công cụ và nhà cung cấp tùy chỉnh
x-i18n:
    generated_at: "2026-07-20T04:39:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 690d3c0bf9a1a542c6989c74f0bc15c7e52798892436aa8bd710d22b00fcf015
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` các khóa cấu hình và thiết lập nhà cung cấp tùy chỉnh / URL cơ sở. Đối với tác tử, kênh và các khóa cấu hình cấp cao nhất khác, xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Công cụ

### Hồ sơ công cụ

`tools.profile` thiết lập danh sách cho phép cơ sở trước `tools.allow`/`tools.deny`:

<Note>
Quy trình tích hợp ban đầu cục bộ mặc định đặt các cấu hình cục bộ mới thành `tools.profile: "coding"` khi chưa được thiết lập (các hồ sơ được chỉ định rõ hiện có vẫn được giữ nguyên).
</Note>

| Hồ sơ     | Bao gồm                                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Chỉ `session_status`                                                                                                                                                                                                                                   |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate`                |
| `messaging` | `group:messaging`, `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `ask_user` |
| `full`      | Không hạn chế (giống như chưa thiết lập)                                                                                                                                                                                                                          |

`coding` và `messaging` cũng ngầm cho phép `bundle-mcp` (các máy chủ MCP đã cấu hình).

### Nhóm công cụ

| Nhóm              | Công cụ                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` được chấp nhận làm bí danh cho `exec`)                                                                                                                                                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                                                 |
| `group:sessions`   | `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                                                  |
| `group:ui`         | `browser`, `screen`, `terminal`, `canvas`, `show_widget`                                                                                                                                                                                               |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                                                 |
| `group:messaging`  | `message`                                                                                                                                                                                                                                              |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                                                    |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`                                                                                                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                                                   |
| `group:openclaw`   | Tất cả công cụ tích hợp sẵn ở trên, ngoại trừ `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (không bao gồm công cụ Plugin)                                                                                                                                  |
| `group:plugins`    | Các công cụ thuộc sở hữu của những Plugin đã tải, bao gồm các máy chủ MCP đã cấu hình được cung cấp thông qua `bundle-mcp`                                                                                                                                                           |

`spawn_task` cho phép một tác tử lập trình đề xuất công việc tiếp theo cần xác nhận mà không khởi động công việc đó. Giao diện điều khiển hiển thị tiêu đề và phần tóm tắt dưới dạng một thẻ có thể thao tác; TUI được Gateway hỗ trợ hiển thị một lời nhắc tương tác tương đương. Việc chấp nhận một trong hai sẽ tạo một phiên cây làm việc được quản lý mới và gửi toàn bộ lời nhắc đến đó trong khi lượt hiện tại tiếp tục. `dismiss_task` rút lại một đề xuất vẫn đang chờ xử lý bằng `task_id` tạm thời được trả về từ `spawn_task`.

Các công cụ chỉ được cung cấp khi bề mặt vận hành khởi tạo có thể nhận và xử lý các sự kiện đề xuất tác vụ của Gateway. Các phiên kênh và phiên TUI cục bộ/nhúng không nhận được chúng; các phương thức truyền tải kênh cần một thao tác tác vụ có kiểu và có tính di động trước khi có thể cung cấp luồng này một cách an toàn. Các đề xuất chỉ tồn tại cục bộ trong tiến trình và biến mất khi Gateway khởi động lại. Cả hai công cụ vẫn nằm trong hồ sơ `coding` và `group:sessions`, vì vậy chính sách `tools.allow` và `tools.deny` thông thường sẽ tự động cấu hình chúng khi bề mặt hỗ trợ.

### Công cụ MCP và Plugin trong chính sách công cụ hộp cát

Các máy chủ MCP đã cấu hình được cung cấp dưới dạng công cụ thuộc sở hữu của Plugin trong id Plugin `bundle-mcp`. Các hồ sơ công cụ thông thường có thể cho phép chúng, nhưng `tools.sandbox.tools` là một cổng bổ sung cho các phiên trong hộp cát. Nếu chế độ hộp cát là `"all"` hoặc `"non-main"`, hãy đưa một trong các mục sau vào danh sách cho phép công cụ hộp cát khi cần hiển thị công cụ MCP/Plugin:

- `bundle-mcp` cho các máy chủ MCP do OpenClaw quản lý từ `mcp.servers`
- id Plugin cho một Plugin gốc cụ thể
- `group:plugins` cho tất cả công cụ thuộc sở hữu của Plugin đã tải
- tên chính xác của công cụ máy chủ MCP hoặc mẫu glob máy chủ như `outlook__send_mail` hoặc `outlook__*` khi bạn chỉ muốn một máy chủ

Mẫu glob máy chủ sử dụng tiền tố máy chủ MCP an toàn cho nhà cung cấp, không nhất thiết là khóa `mcp.servers` thô. Các ký tự không phải `[A-Za-z0-9_-]` trở thành `-`, các tên không bắt đầu bằng chữ cái nhận tiền tố `mcp-`, còn các tiền tố dài hoặc trùng lặp có thể bị cắt ngắn hoặc thêm hậu tố; ví dụ, `mcp.servers["Outlook Graph"]` sử dụng một mẫu glob như `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Nếu không có mục ở lớp hộp cát đó, máy chủ MCP vẫn có thể tải thành công trong khi các công cụ của nó bị lọc trước yêu cầu gửi đến nhà cung cấp. Sử dụng `openclaw doctor` để phát hiện trường hợp này cho các máy chủ do OpenClaw quản lý trong `mcp.servers`. Các máy chủ MCP được tải từ tệp kê khai Plugin đi kèm hoặc Claude `.mcp.json` sử dụng cùng cổng hộp cát, nhưng chẩn đoán này chưa liệt kê các nguồn đó; hãy sử dụng các mục danh sách cho phép tương tự nếu công cụ của chúng biến mất trong các lượt chạy trong hộp cát.

### `tools.codeMode`

`tools.codeMode` bật bề mặt chế độ mã chung của OpenClaw. Khi được bật
cho một lượt chạy có công cụ, các công cụ OpenClaw thông thường được chuyển ra sau cầu nối danh mục `tools.*`
trong hộp cát, và các công cụ MCP khả dụng thông qua không gian tên `MCP`
được tạo. Mô hình thường thấy `exec` và `wait`; các công cụ như `computer`
có kết quả có cấu trúc không thể đi qua cầu nối chỉ hỗ trợ JSON vẫn được cung cấp trực tiếp.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Dạng viết tắt cũng được chấp nhận:

```json5
{
  tools: { codeMode: true },
}
```

Các khai báo MCP được cung cấp thông qua bề mặt tệp API ảo chỉ đọc trong
chế độ mã. Mã khách có thể gọi `API.list("mcp")` và
`API.read("mcp/<server>.d.ts")` để kiểm tra các chữ ký theo phong cách TypeScript trước khi
gọi `MCP.<server>.<tool>()`. Xem [Chế độ mã](/vi/tools/code-mode) để biết
hợp đồng thời gian chạy, các giới hạn và các bước gỡ lỗi.

### `tools.allow` / `tools.deny`

Chính sách cho phép/từ chối công cụ toàn cục (từ chối được ưu tiên). Không phân biệt chữ hoa chữ thường, hỗ trợ ký tự đại diện `*`. Được áp dụng ngay cả khi hộp cát Docker bị tắt.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` và `apply_patch` là các id công cụ riêng biệt. `allow: ["write"]` cũng bật `apply_patch` cho các mô hình tương thích, nhưng `deny: ["write"]` không từ chối `apply_patch`. Để chặn mọi thao tác sửa đổi tệp, hãy từ chối `group:fs` hoặc liệt kê rõ từng công cụ sửa đổi:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` và `alsoAllow` không thể cùng được thiết lập trong một phạm vi (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) — quá trình xác thực cấu hình sẽ từ chối. Hợp nhất các mục `alsoAllow` vào `allow`, hoặc loại bỏ `allow` và thay vào đó sử dụng `profile` + `alsoAllow`.
</Note>

### `tools.byProvider`

Hạn chế thêm các công cụ cho những nhà cung cấp hoặc mô hình cụ thể. Thứ tự: hồ sơ cơ sở → hồ sơ nhà cung cấp → cho phép/từ chối.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

Giới hạn công cụ cho một danh tính người yêu cầu cụ thể. Đây là lớp phòng vệ chuyên sâu bổ sung cho cơ chế kiểm soát quyền truy cập kênh; các giá trị người gửi phải đến từ bộ điều hợp kênh, không phải từ nội dung tin nhắn.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Các khóa sử dụng tiền tố tường minh: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` hoặc `"*"`. ID kênh là ID OpenClaw chuẩn; các bí danh như `teams` được chuẩn hóa thành `msteams`. Các khóa cũ không có tiền tố chỉ được chấp nhận dưới dạng `id:`. Thứ tự khớp là kênh+id, id, e164, tên người dùng, tên, rồi ký tự đại diện.

Thiết lập `agents.list[].tools.toolsBySender` theo từng tác nhân sẽ ghi đè kết quả khớp người gửi toàn cục khi khớp, ngay cả với chính sách `{}` trống.

### `tools.elevated`

Kiểm soát quyền truy cập thực thi nâng cao bên ngoài sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Thiết lập ghi đè theo từng tác nhân (`agents.list[].tools.elevated`) chỉ có thể hạn chế thêm.
- `/elevated on|off|ask|full` lưu trạng thái theo từng phiên; các chỉ thị nội tuyến áp dụng cho một tin nhắn duy nhất.
- `exec` nâng cao bỏ qua sandbox và sử dụng đường dẫn thoát đã cấu hình (mặc định là `gateway`, hoặc `node` khi đích thực thi là `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

Các giá trị hiển thị là mặc định, ngoại trừ `applyPatch.allowModels` (mặc định trống/chưa đặt, nghĩa là mọi mô hình tương thích đều có thể sử dụng `apply_patch`). `approvalRunningNoticeMs` phát thông báo đang chạy khi tác vụ thực thi dựa trên phê duyệt kéo dài; `0` sẽ tắt thông báo này.

### `tools.loopDetection`

Các bước kiểm tra an toàn cho vòng lặp công cụ **bị tắt theo mặc định**. Đặt `enabled: true` để kích hoạt phát hiện. Có thể xác định thiết lập trên toàn cục trong `tools.loopDetection` và ghi đè theo từng tác nhân tại `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
    },
  },
}
```

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // hoặc biến môi trường BRAVE_API_KEY (nhà cung cấp Brave)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // tùy chọn; bỏ qua để tự động phát hiện
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

Các giá trị hiển thị là mặc định, ngoại trừ `provider` và `userAgent`. `maxResponseBytes` được giới hạn trong khoảng 32000–10000000; `maxChars` được giới hạn ở `maxCharsCap` (tăng `maxCharsCap` để cho phép phản hồi lớn hơn).

### `tools.media`

Cấu hình khả năng hiểu nội dung đa phương tiện đầu vào (hình ảnh/âm thanh/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

`concurrency` (mặc định `2`), `audio.maxBytes` (mặc định 20 MB) và `video.maxBytes` (mặc định 50 MB) được hiển thị theo giá trị mặc định; `image.maxBytes` mặc định là 10 MB. Thời gian chờ yêu cầu mặc định theo từng khả năng: hình ảnh/âm thanh `60` giây, video `120` giây.

<AccordionGroup>
  <Accordion title="Các trường của mục nhập mô hình đa phương tiện">
    **Mục nhập nhà cung cấp** (`type: "provider"` hoặc bỏ qua):

    - `provider`: ID nhà cung cấp API (`openai`, `anthropic`, `google`/`gemini`, `groq`, v.v.)
    - `model`: ghi đè ID mô hình
    - `profile` / `preferredProfile`: lựa chọn hồ sơ `auth-profiles.json`

    **Mục nhập CLI** (`type: "cli"`):

    - `command`: tệp thực thi cần chạy
    - `args`: các đối số theo mẫu (hỗ trợ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, v.v.; `openclaw doctor --fix` di chuyển các phần giữ chỗ `{input}` đã lỗi thời sang `{{MediaPath}}`)

    **Các trường chung:**

    - `capabilities`: danh sách tùy chọn (`image`, `audio`, `video`). Mỗi Plugin nhà cung cấp khai báo tập khả năng mặc định riêng; ví dụ, nhà cung cấp `openai` đi kèm mặc định hỗ trợ hình ảnh+âm thanh, `anthropic`/`minimax` hỗ trợ hình ảnh, `google` hỗ trợ hình ảnh+âm thanh+video và `groq` hỗ trợ âm thanh.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: các thiết lập ghi đè theo từng mục nhập.
    - `tools.media.image.timeoutSeconds` và các mục nhập `timeoutSeconds` tương ứng của mô hình hình ảnh cũng áp dụng khi tác nhân gọi công cụ `image` tường minh. Đối với khả năng hiểu hình ảnh, thời gian chờ này áp dụng cho chính yêu cầu và không bị giảm bởi công việc chuẩn bị trước đó.
    - Khi xảy ra lỗi, hệ thống chuyển sang mục nhập tiếp theo.

    Xác thực nhà cung cấp tuân theo thứ tự tiêu chuẩn: `auth-profiles.json` → biến môi trường → `models.providers.*.apiKey`.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Kiểm soát các phiên mà công cụ phiên có thể nhắm tới (`sessions_list`, `sessions_history`, `sessions_send`).

Mặc định: `tree` (phiên hiện tại + các phiên do phiên đó tạo ra, chẳng hạn như tác nhân phụ, cùng các phiên nhóm được theo dõi ngầm của cùng tác nhân).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Phạm vi hiển thị">
    - `self`: chỉ khóa phiên hiện tại.
    - `tree`: phiên hiện tại + các phiên do phiên hiện tại tạo ra (tác nhân phụ). Đối với thao tác đọc, phạm vi này cũng bao gồm các phiên nhóm của cùng tác nhân mà phiên hiện tại theo dõi thông qua nhận thức nhóm ngầm.
    - `agent`: mọi phiên thuộc ID tác nhân hiện tại (có thể bao gồm người dùng khác nếu bạn chạy các phiên theo từng người gửi dưới cùng một ID tác nhân).
    - `all`: mọi phiên. Việc nhắm tới tác nhân khác vẫn yêu cầu `tools.agentToAgent`.
    - Giới hạn sandbox: khi phiên hiện tại nằm trong sandbox và `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (mặc định), phạm vi hiển thị bị buộc thành `tree` ngay cả khi `tools.sessions.visibility="all"`.
    - Khi không phải `all`, `sessions_list` bao gồm trường `visibility` rút gọn
      mô tả chế độ có hiệu lực và cảnh báo rằng một số phiên có thể bị
      bỏ qua nếu nằm ngoài phạm vi hiện tại.

  </Accordion>
</AccordionGroup>

Với `session.dmScope: "main"` mặc định, hoạt động của con người trong một nhóm khiến phiên nhóm của cùng tác nhân đó
hiển thị ngầm đối với phiên chính của tác nhân. Trong thiết lập nhiều người dùng, `"main"` cũng dùng chung
một phiên tin nhắn trực tiếp giữa các người dùng, vì vậy mỗi người dùng được định tuyến tới đó có thể đọc từ các nhóm được theo dõi ngầm,
bao gồm thông qua `memory_search` của bộ nhớ phiên. Sử dụng `dmScope` theo từng đối tác để cô lập tin nhắn trực tiếp, hoặc đặt
`tools.sessions.visibility: "self"` để từ chối đọc các phiên được theo dõi ngầm.

### `tools.sessions_spawn`

Kiểm soát khả năng hỗ trợ tệp đính kèm nội tuyến cho `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // phải chủ động bật: đặt thành true để cho phép đính kèm tệp nội tuyến
        maxTotalBytes: 5242880, // tổng cộng 5 MB trên tất cả các tệp
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB cho mỗi tệp
        retainOnSessionKeep: false, // giữ tệp đính kèm khi cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Lưu ý về tệp đính kèm">
    - Tệp đính kèm yêu cầu `enabled: true`.
    - Tệp đính kèm của tác nhân phụ được hiện thực hóa vào không gian làm việc con tại `.openclaw/attachments/<uuid>/` cùng với `.manifest.json`.
    - Tệp đính kèm ACP chỉ hỗ trợ hình ảnh và được chuyển tiếp nội tuyến đến môi trường chạy ACP sau khi đáp ứng cùng các giới hạn về số lượng tệp, số byte trên mỗi tệp và tổng số byte.
    - Nội dung tệp đính kèm tự động được ẩn khỏi dữ liệu bản ghi hội thoại lưu trữ lâu dài.
    - Đầu vào Base64 được xác thực bằng các bước kiểm tra nghiêm ngặt về bảng chữ cái/phần đệm và cơ chế bảo vệ kích thước trước khi giải mã.
    - Quyền tệp đính kèm của tác nhân phụ là `0700` cho thư mục và `0600` cho tệp.
    - Việc dọn dẹp tác nhân phụ tuân theo chính sách `cleanup`: `delete` luôn xóa tệp đính kèm; `keep` chỉ giữ chúng khi `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Các cờ công cụ tích hợp thử nghiệm. Mặc định tắt, trừ khi áp dụng quy tắc tự động bật GPT-5 theo chế độ tác nhân nghiêm ngặt.

```json5
{
  tools: {
    experimental: {
      planTool: true, // bật update_plan thử nghiệm
    },
  },
}
```

- `planTool`: bật công cụ `update_plan` có cấu trúc để theo dõi công việc nhiều bước không đơn giản.
- Mặc định: `false`, trừ khi `agents.defaults.embeddedAgent.executionContract` (hoặc thiết lập ghi đè theo từng tác nhân) được đặt thành `"strict-agentic"` cho một lần chạy của nhà cung cấp `openai` với ID mô hình thuộc họ GPT-5 (điều này cũng bao gồm các lần chạy OpenAI Codex CLI, vì việc định tuyến xác thực/mô hình Codex nằm dưới nhà cung cấp `openai`). Đặt `true` để buộc bật công cụ ngoài phạm vi đó, hoặc `false` để tiếp tục tắt công cụ ngay cả với các lần chạy GPT-5 theo chế độ tác nhân nghiêm ngặt.
- Khi được bật, lời nhắc hệ thống cũng bổ sung hướng dẫn sử dụng để mô hình chỉ dùng công cụ này cho công việc đáng kể và duy trì tối đa một bước ở trạng thái `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: mô hình mặc định cho các sub-agent được tạo. Nếu bỏ qua, các sub-agent kế thừa mô hình của bên gọi.
- `allowAgents`: danh sách cho phép mặc định gồm các id agent đích đã cấu hình cho `sessions_spawn` khi agent yêu cầu không đặt `subagents.allowAgents` riêng (`["*"]` = mọi đích đã cấu hình; mặc định: chỉ cùng agent). Các mục lỗi thời có cấu hình agent đã bị xóa sẽ bị `sessions_spawn` từ chối và không xuất hiện trong `agents_list`; chạy `openclaw doctor --fix` để dọn dẹp chúng.
- `maxConcurrent`: số lượt chạy sub-agent đồng thời tối đa. Mặc định: `8`.
- `runTimeoutSeconds`: thời gian chờ (giây) cho `sessions_spawn` khi bên gọi không truyền giá trị ghi đè riêng. Mặc định: `0` (không có thời gian chờ); `900` hiển thị ở trên là một giá trị thường được chủ động chọn, không phải mặc định tích hợp sẵn.
- `announceTimeoutMs`: thời gian chờ cho mỗi lần gọi (mili giây) đối với các lần thử gửi thông báo `agent` của Gateway. Mặc định: `120000`. Các lần thử lại tạm thời có thể khiến tổng thời gian chờ thông báo dài hơn một khoảng thời gian chờ đã cấu hình.
- `archiveAfterMinutes`: số phút kể từ khi một phiên sub-agent hoàn tất cho đến khi phiên đó được tự động lưu trữ. Mặc định: `60`; `0` vô hiệu hóa tự động lưu trữ.
- Chính sách công cụ cho từng sub-agent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Nhà cung cấp tùy chỉnh và URL cơ sở

Các Plugin nhà cung cấp công bố các hàng danh mục mô hình riêng. Thêm nhà cung cấp tùy chỉnh qua `models.providers` trong cấu hình hoặc `~/.openclaw/agents/<agentId>/agent/models.json`.

Việc cấu hình `baseUrl` của một nhà cung cấp tùy chỉnh/cục bộ cũng là quyết định tin cậy mạng có phạm vi hẹp cho các yêu cầu HTTP của mô hình: OpenClaw cho phép chính xác nguồn `scheme://host:port` đó đi qua đường dẫn tìm nạp được bảo vệ mà không cần thêm tùy chọn cấu hình riêng hoặc tin cậy các nguồn riêng tư khác.

```json5
{
  models: {
    mode: "merge", // hợp nhất (mặc định) | thay thế
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | v.v.
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Xác thực và thứ tự ưu tiên hợp nhất">
    - Sử dụng `authHeader: true` + `headers` cho các nhu cầu xác thực tùy chỉnh.
    - Ghi đè thư mục gốc cấu hình agent bằng `OPENCLAW_AGENT_DIR`.
    - Thứ tự ưu tiên hợp nhất cho các ID nhà cung cấp trùng khớp:
      - Các giá trị `baseUrl` trong `models.json` của agent nếu không rỗng sẽ được ưu tiên.
      - Các giá trị `apiKey` của agent nếu không rỗng chỉ được ưu tiên khi nhà cung cấp đó không do SecretRef quản lý trong ngữ cảnh cấu hình/hồ sơ xác thực hiện tại.
      - Các giá trị `apiKey` của nhà cung cấp do SecretRef quản lý được làm mới từ các dấu mốc nguồn (`ENV_VAR_NAME` cho tham chiếu môi trường, `secretref-managed` cho tham chiếu tệp/thực thi) thay vì lưu trữ lâu dài các bí mật đã phân giải.
      - Các giá trị tiêu đề của nhà cung cấp do SecretRef quản lý được làm mới từ các dấu mốc nguồn (`secretref-env:ENV_VAR_NAME` cho tham chiếu môi trường, `secretref-managed` cho tham chiếu tệp/thực thi).
      - `apiKey`/`baseUrl` của agent nếu rỗng hoặc thiếu sẽ dùng dự phòng `models.providers` trong cấu hình.
      - `contextWindow`/`maxTokens` của mô hình trùng khớp: giá trị cấu hình tường minh được ưu tiên khi tồn tại và hợp lệ (một số hữu hạn dương); nếu không, giá trị danh mục ngầm định/được tạo sẽ được sử dụng.
      - `contextTokens` của mô hình trùng khớp tuân theo cùng quy tắc ưu tiên giá trị tường minh, nếu không thì dùng giá trị ngầm định; sử dụng giá trị này để giới hạn ngữ cảnh hiệu dụng mà không thay đổi siêu dữ liệu mô hình gốc.
      - Danh mục của Plugin nhà cung cấp được lưu dưới dạng các phân đoạn danh mục được tạo và thuộc sở hữu của Plugin trong trạng thái Plugin của agent.
      - Sử dụng `models.mode: "replace"` khi muốn cấu hình ghi lại hoàn toàn `models.json` và bỏ qua việc hợp nhất các phân đoạn danh mục thuộc sở hữu của Plugin.
      - Việc lưu dấu mốc lấy nguồn làm căn cứ: các dấu mốc được ghi từ ảnh chụp cấu hình nguồn đang hoạt động (trước khi phân giải), không phải từ các giá trị bí mật thời gian chạy đã phân giải.

  </Accordion>
</AccordionGroup>

### Chi tiết trường nhà cung cấp

<AccordionGroup>
  <Accordion title="Danh mục cấp cao nhất">
    - `models.mode`: hành vi danh mục nhà cung cấp (`merge` hoặc `replace`).
    - `models.providers`: ánh xạ nhà cung cấp tùy chỉnh được lập khóa theo id nhà cung cấp.
      - Chỉnh sửa an toàn: sử dụng `openclaw config set models.providers.<id> '<json>' --strict-json --merge` hoặc `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` để cập nhật theo kiểu bổ sung. `config set` từ chối các thao tác thay thế mang tính phá hủy trừ khi bạn truyền `--replace`.

  </Accordion>
  <Accordion title="Kết nối và xác thực nhà cung cấp">
    - `models.providers.*.api`: bộ điều hợp yêu cầu (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Đối với các backend `/v1/chat/completions` tự lưu trữ như MLX, vLLM, SGLang và hầu hết máy chủ cục bộ tương thích với OpenAI, hãy sử dụng `openai-completions`. Nhà cung cấp tùy chỉnh có `baseUrl` nhưng không có `api` mặc định dùng `openai-completions`; chỉ đặt `openai-responses` khi backend hỗ trợ `/v1/responses`.
    - `models.providers.*.apiKey`: thông tin xác thực của nhà cung cấp (ưu tiên thay thế bằng SecretRef/biến môi trường).
    - `models.providers.*.auth`: chiến lược xác thực (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: cửa sổ ngữ cảnh gốc mặc định cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `contextWindow`.
    - `models.providers.*.contextTokens`: giới hạn ngữ cảnh thời gian chạy hiệu dụng mặc định cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `contextTokens`.
    - `models.providers.*.maxTokens`: giới hạn token đầu ra mặc định cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `maxTokens`.
    - `models.providers.*.timeoutSeconds`: thời gian chờ tùy chọn tính bằng giây cho yêu cầu HTTP mô hình theo từng nhà cung cấp, bao gồm xử lý kết nối, tiêu đề, nội dung và hủy toàn bộ yêu cầu.
    - `models.providers.*.injectNumCtxForOpenAICompat`: đối với Ollama + `openai-completions`, chèn `options.num_ctx` vào yêu cầu (mặc định: `true`).
    - `models.providers.*.authHeader`: buộc truyền thông tin xác thực trong tiêu đề `Authorization` khi được yêu cầu.
    - `models.providers.*.baseUrl`: URL cơ sở của API thượng nguồn.
    - `models.providers.*.headers`: các tiêu đề tĩnh bổ sung để định tuyến proxy/đối tượng thuê.

  </Accordion>
  <Accordion title="Ghi đè phương thức truyền yêu cầu">
    `models.providers.*.request`: các giá trị ghi đè phương thức truyền cho yêu cầu HTTP đến nhà cung cấp mô hình.

    - `request.headers`: các tiêu đề bổ sung (được hợp nhất với giá trị mặc định của nhà cung cấp). Các giá trị chấp nhận SecretRef.
    - `request.auth`: ghi đè chiến lược xác thực. Chế độ: `"provider-default"` (sử dụng cơ chế xác thực tích hợp của nhà cung cấp), `"authorization-bearer"` (với `token`), `"header"` (với `headerName`, `value`, `prefix` tùy chọn).
    - `request.proxy`: ghi đè proxy HTTP. Chế độ: `"env-proxy"` (sử dụng các biến môi trường `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (với `url`). Cả hai chế độ đều chấp nhận một đối tượng con `tls` tùy chọn.
    - `request.tls`: ghi đè TLS cho kết nối trực tiếp. Các trường: `ca`, `cert`, `key`, `passphrase` (tất cả đều chấp nhận SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: khi `true`, cho phép các yêu cầu HTTP đến nhà cung cấp mô hình truy cập các dải địa chỉ riêng tư, CGNAT hoặc tương tự qua cơ chế bảo vệ tìm nạp HTTP của nhà cung cấp. URL cơ sở của nhà cung cấp tùy chỉnh/cục bộ đã tin cậy chính xác nguồn được cấu hình, ngoại trừ các nguồn siêu dữ liệu/liên kết cục bộ vẫn bị chặn nếu không chủ động cho phép rõ ràng. Đặt giá trị này thành `false` để từ chối cơ chế tin cậy nguồn chính xác. WebSocket sử dụng cùng `request` cho tiêu đề/TLS nhưng không sử dụng cổng kiểm soát SSRF tìm nạp đó. Mặc định `false`.

  </Accordion>
  <Accordion title="Các mục danh mục mô hình">
    - `models.providers.*.models`: các mục danh mục mô hình tường minh của nhà cung cấp.
    - `models.providers.*.models.*.input`: các phương thức đầu vào của mô hình. Sử dụng `["text"]` cho mô hình chỉ hỗ trợ văn bản và `["text", "image"]` cho mô hình hỗ trợ hình ảnh/thị giác gốc. Tệp đính kèm hình ảnh chỉ được chèn vào lượt của agent khi mô hình được chọn được đánh dấu là có khả năng xử lý hình ảnh.
    - `models.providers.*.models.*.contextWindow`: siêu dữ liệu cửa sổ ngữ cảnh gốc của mô hình. Giá trị này ghi đè `contextWindow` cấp nhà cung cấp cho mô hình đó.
    - `models.providers.*.models.*.contextTokens`: giới hạn ngữ cảnh thời gian chạy tùy chọn. Giá trị này ghi đè `contextTokens` cấp nhà cung cấp; sử dụng khi muốn ngân sách ngữ cảnh hiệu dụng nhỏ hơn `contextWindow` gốc của mô hình; `openclaw models list` hiển thị cả hai giá trị khi chúng khác nhau.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: gợi ý tương thích tùy chọn. Đối với `api: "openai-completions"` có `baseUrl` không rỗng và không phải gốc (máy chủ không phải `api.openai.com`), OpenClaw buộc giá trị này thành `false` trong thời gian chạy. `baseUrl` rỗng/bị bỏ qua sẽ giữ hành vi OpenAI mặc định.
    - `models.providers.*.models.*.compat.requiresStringContent`: gợi ý tương thích tùy chọn cho các điểm cuối trò chuyện tương thích với OpenAI chỉ hỗ trợ chuỗi. Khi `true`, OpenClaw làm phẳng các mảng `messages[].content` chỉ chứa văn bản thành chuỗi thuần trước khi gửi yêu cầu.
    - `models.providers.*.models.*.compat.strictMessageKeys`: gợi ý tương thích tùy chọn cho các điểm cuối trò chuyện tương thích nghiêm ngặt với OpenAI. Khi `true`, OpenClaw rút gọn các đối tượng tin nhắn Chat Completions gửi đi còn `role` và `content` trước khi gửi yêu cầu.
    - `models.providers.*.models.*.compat.thinkingFormat`: gợi ý tải trọng suy luận tùy chọn. Sử dụng `"together"` cho `reasoning.enabled` theo kiểu Together, `"qwen"` cho `enable_thinking` cấp cao nhất hoặc `"qwen-chat-template"` cho `chat_template_kwargs.enable_thinking` trên các máy chủ tương thích với OpenAI thuộc họ Qwen có hỗ trợ tham số từ khóa mẫu trò chuyện ở cấp yêu cầu, chẳng hạn như vLLM. Các mô hình Qwen vLLM đã cấu hình cung cấp các lựa chọn `/think` nhị phân (`off`, `on`) cho các định dạng này.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: gợi ý tương thích tùy chọn cho các backend Chat Completions theo kiểu DeepSeek yêu cầu tin nhắn trước đó của trợ lý giữ lại `reasoning_content` khi phát lại. Khi `true`, OpenClaw giữ nguyên trường đó trên các tin nhắn trợ lý gửi đi. Sử dụng tùy chọn này khi kết nối proxy tùy chỉnh tương thích với DeepSeek từ chối yêu cầu sau khi dữ liệu suy luận bị loại bỏ. Mặc định `false`.

  </Accordion>
  <Accordion title="Khám phá Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: thư mục gốc cài đặt tự động khám phá Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: bật/tắt khám phá ngầm định.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: khu vực AWS dùng để khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: bộ lọc id nhà cung cấp tùy chọn để khám phá có mục tiêu.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: khoảng thời gian thăm dò để làm mới hoạt động khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: cửa sổ ngữ cảnh dự phòng cho các mô hình được khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: số token đầu ra tối đa dự phòng cho các mô hình được khám phá.

  </Accordion>
</AccordionGroup>

Quy trình thiết lập nhà cung cấp tùy chỉnh tương tác suy luận khả năng nhập hình ảnh cho các mẫu ID mô hình thị giác đã biết, bao gồm GPT-4o/GPT-4.1/GPT-5+, các họ suy luận `o1`/`o3`/`o4`, Claude, Gemini, mọi ID có hậu tố `-vl` (Qwen-VL và các ID tương tự), cùng các họ có tên như LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V và GLM-4V; quy trình này bỏ qua câu hỏi bổ sung đối với các họ đã biết là chỉ hỗ trợ văn bản (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama và các ID Qwen thuần không có hậu tố vl/vision). Các ID mô hình không xác định vẫn sẽ được hỏi về khả năng hỗ trợ hình ảnh. Quy trình thiết lập không tương tác sử dụng cùng cơ chế suy luận; truyền `--custom-image-input` để buộc dùng siêu dữ liệu hỗ trợ hình ảnh hoặc `--custom-text-input` để buộc dùng siêu dữ liệu chỉ hỗ trợ văn bản.

### Ví dụ về nhà cung cấp

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin nhà cung cấp bên ngoài chính thức `cerebras` có thể cấu hình nội dung này qua `openclaw onboard --auth-choice cerebras-api-key`. Chỉ sử dụng cấu hình nhà cung cấp tường minh khi ghi đè các giá trị mặc định.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Sử dụng `cerebras/zai-glm-4.7` cho Cerebras; `zai/glm-4.7` để kết nối trực tiếp với Z.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Nhà cung cấp tích hợp sẵn, tương thích với Anthropic. Lối tắt: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Mô hình cục bộ (LM Studio)">
    Xem [Mô hình cục bộ](/vi/gateway/local-models). Tóm lại: chạy một mô hình cục bộ lớn qua LM Studio Responses API trên phần cứng mạnh; giữ các mô hình được lưu trữ từ xa ở chế độ hợp nhất để dự phòng.
  </Accordion>
  <Accordion title="MiniMax M3 (trực tiếp)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Đặt `MINIMAX_API_KEY`. Lối tắt: `openclaw onboard --auth-choice minimax-global-api` hoặc `openclaw onboard --auth-choice minimax-cn-api`. Danh mục mô hình mặc định sử dụng M3 và cũng bao gồm các biến thể M2.7. Trên đường truyền phát trực tuyến tương thích với Anthropic, OpenClaw mặc định vô hiệu hóa chế độ suy nghĩ của MiniMax M2.x, trừ khi bạn tự đặt rõ ràng `thinking`; MiniMax-M3 (và M3.x) mặc định vẫn sử dụng đường dẫn suy nghĩ thích ứng/bỏ trống của nhà cung cấp. `/fast on` hoặc `params.fastMode: true` ghi lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Đối với điểm cuối tại Trung Quốc: `baseUrl: "https://api.moonshot.cn/v1"` hoặc `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Các điểm cuối Moonshot gốc công bố khả năng tương thích với dữ liệu sử dụng khi truyền phát trên phương thức truyền tải `openai-completions` dùng chung, và OpenClaw xác định điều này dựa trên khả năng của điểm cuối thay vì chỉ dựa trên ID nhà cung cấp tích hợp sẵn.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Đặt `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`). Sử dụng các tham chiếu `opencode/...` cho danh mục Zen hoặc các tham chiếu `opencode-go/...` cho danh mục Go. Lối tắt: `openclaw onboard --auth-choice opencode-zen` hoặc `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (tương thích với Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    URL cơ sở không nên chứa `/v1` (máy khách Anthropic sẽ tự nối thêm). Lối tắt: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Đặt `ZAI_API_KEY`. Các tham chiếu mô hình sử dụng ID nhà cung cấp chuẩn `zai/*`. Lối tắt: `openclaw onboard --auth-choice zai-api-key`.

    - Điểm cuối chung: `https://api.z.ai/api/paas/v4`
    - Điểm cuối lập trình: `https://api.z.ai/api/coding/paas/v4`
    - Lựa chọn xác thực `zai-api-key` mặc định sẽ thăm dò khóa của bạn và tự động phát hiện khóa đó thuộc điểm cuối nào (nếu không thể xác định chắc chắn, hệ thống sẽ chuyển sang lời nhắc và mặc định chọn Global). Các lựa chọn xác thực CN và Coding-Plan chuyên biệt cũng có sẵn để chọn rõ ràng.
    - Đối với điểm cuối chung, hãy định nghĩa một nhà cung cấp tùy chỉnh với URL cơ sở được ghi đè.

  </Accordion>
</AccordionGroup>

---

## Liên quan

- [Cấu hình — tác nhân](/vi/gateway/config-agents)
- [Cấu hình — kênh](/vi/gateway/config-channels)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — các khóa cấp cao nhất khác
- [Công cụ và plugin](/vi/tools)
