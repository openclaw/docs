---
read_when:
    - Cấu hình chính sách `tools.*`, danh sách cho phép hoặc các tính năng thử nghiệm
    - Đăng ký nhà cung cấp tùy chỉnh hoặc ghi đè URL cơ sở
    - Thiết lập các điểm cuối tự lưu trữ tương thích với OpenAI
sidebarTitle: Tools and custom providers
summary: Cấu hình công cụ (chính sách, tùy chọn thử nghiệm, công cụ do nhà cung cấp hỗ trợ) và thiết lập nhà cung cấp/URL cơ sở tùy chỉnh
title: Cấu hình — công cụ và nhà cung cấp tùy chỉnh
x-i18n:
    generated_at: "2026-07-12T07:54:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

Các khóa cấu hình `tools.*` và thiết lập nhà cung cấp tùy chỉnh / URL cơ sở. Đối với tác tử, kênh và các khóa cấu hình cấp cao nhất khác, hãy xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Công cụ

### Hồ sơ công cụ

`tools.profile` thiết lập danh sách cho phép cơ sở trước `tools.allow`/`tools.deny`:

<Note>
Quy trình thiết lập ban đầu cục bộ mặc định đặt cấu hình cục bộ mới thành `tools.profile: "coding"` khi chưa được thiết lập (các hồ sơ được chỉ định rõ hiện có vẫn được giữ nguyên).
</Note>

| Hồ sơ      | Bao gồm                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Chỉ `session_status`                                                                                                                                                                                                        |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Không hạn chế (giống như chưa thiết lập)                                                                                                                                                                                               |

`coding` và `messaging` cũng ngầm cho phép `bundle-mcp` (các máy chủ MCP đã cấu hình).

### Nhóm công cụ

| Nhóm               | Công cụ                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` được chấp nhận làm bí danh cho `exec`)                                                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | Tất cả công cụ tích hợp sẵn ở trên ngoại trừ `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (không bao gồm công cụ plugin)                                 |
| `group:plugins`    | Các công cụ thuộc quyền sở hữu của những plugin đã tải, bao gồm các máy chủ MCP đã cấu hình được cung cấp qua `bundle-mcp`                                                          |

`spawn_task` cho phép tác tử lập trình đề xuất công việc tiếp nối cần được xác nhận mà không khởi chạy công việc đó. Giao diện điều khiển hiển thị tiêu đề và phần tóm tắt dưới dạng một thẻ có thể thao tác; TUI dựa trên Gateway hiển thị lời nhắc tương tác tương đương. Việc chấp nhận một trong hai sẽ tạo một phiên cây làm việc được quản lý mới và gửi toàn bộ lời nhắc đến đó trong khi lượt hiện tại tiếp tục. `dismiss_task` rút lại một đề xuất vẫn đang chờ xử lý bằng `task_id` tạm thời do `spawn_task` trả về.

Các công cụ này chỉ được cung cấp khi bề mặt của người vận hành khởi tạo có thể nhận và xử lý các sự kiện đề xuất tác vụ của Gateway. Các phiên kênh và phiên TUI cục bộ/nhúng không nhận được chúng; các phương thức vận chuyển kênh cần một thao tác tác vụ có kiểu và khả chuyển trước khi có thể cung cấp luồng này một cách an toàn. Các đề xuất chỉ tồn tại cục bộ trong tiến trình và biến mất khi Gateway khởi động lại. Cả hai công cụ vẫn nằm trong hồ sơ `coding` và `group:sessions`, vì vậy chính sách `tools.allow` và `tools.deny` thông thường sẽ tự động cấu hình chúng khi bề mặt hỗ trợ.

### Công cụ MCP và plugin trong chính sách công cụ hộp cát

Các máy chủ MCP đã cấu hình được cung cấp dưới dạng công cụ thuộc quyền sở hữu của plugin với mã định danh plugin `bundle-mcp`. Các hồ sơ công cụ thông thường có thể cho phép chúng, nhưng `tools.sandbox.tools` là một cổng kiểm soát bổ sung cho các phiên trong hộp cát. Nếu chế độ hộp cát là `"all"` hoặc `"non-main"`, hãy thêm một trong các mục sau vào danh sách cho phép công cụ hộp cát khi cần hiển thị công cụ MCP/plugin:

- `bundle-mcp` cho các máy chủ MCP do OpenClaw quản lý từ `mcp.servers`
- mã định danh plugin cho một plugin gốc cụ thể
- `group:plugins` cho tất cả công cụ thuộc quyền sở hữu của plugin đã tải
- tên công cụ chính xác của máy chủ MCP hoặc mẫu glob máy chủ như `outlook__send_mail` hoặc `outlook__*` khi bạn chỉ muốn một máy chủ

Các mẫu glob máy chủ sử dụng tiền tố máy chủ MCP an toàn với nhà cung cấp, không nhất thiết là khóa `mcp.servers` thô. Các ký tự không thuộc `[A-Za-z0-9_-]` sẽ trở thành `-`, các tên không bắt đầu bằng chữ cái sẽ được thêm tiền tố `mcp-`, còn các tiền tố dài hoặc trùng lặp có thể bị cắt ngắn hoặc thêm hậu tố; ví dụ, `mcp.servers["Outlook Graph"]` sử dụng mẫu glob như `outlook-graph__*`.

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

Nếu không có mục ở lớp hộp cát đó, máy chủ MCP vẫn có thể tải thành công trong khi các công cụ của nó bị lọc trước yêu cầu gửi đến nhà cung cấp. Sử dụng `openclaw doctor` để phát hiện cấu hình dạng này cho các máy chủ do OpenClaw quản lý trong `mcp.servers`. Các máy chủ MCP được tải từ tệp kê khai plugin đi kèm hoặc tệp `.mcp.json` của Claude sử dụng cùng cổng kiểm soát hộp cát, nhưng chẩn đoán này chưa liệt kê các nguồn đó; hãy sử dụng cùng các mục trong danh sách cho phép nếu công cụ của chúng biến mất trong các lượt chạy trong hộp cát.

### `tools.codeMode`

`tools.codeMode` bật bề mặt chế độ mã chung của OpenClaw. Khi được bật
cho một lượt chạy có công cụ, các công cụ OpenClaw thông thường được chuyển ra sau cầu nối danh mục `tools.*`
trong hộp cát, còn các công cụ MCP khả dụng qua không gian tên `MCP`
được tạo. Mô hình thường nhìn thấy `exec` và `wait`; các công cụ như `computer`
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

Các khai báo MCP được cung cấp qua bề mặt tệp API ảo chỉ đọc trong
chế độ mã. Mã khách có thể gọi `API.list("mcp")` và
`API.read("mcp/<server>.d.ts")` để kiểm tra các chữ ký theo kiểu TypeScript trước khi
gọi `MCP.<server>.<tool>()`. Xem [Chế độ mã](/vi/reference/code-mode) để biết
hợp đồng thời gian chạy, các giới hạn và các bước gỡ lỗi.

### `tools.allow` / `tools.deny`

Chính sách cho phép/từ chối công cụ toàn cục (từ chối được ưu tiên). Không phân biệt chữ hoa chữ thường, hỗ trợ ký tự đại diện `*`. Được áp dụng ngay cả khi sandbox Docker bị tắt.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` và `apply_patch` là các mã định danh công cụ riêng biệt. `allow: ["write"]` cũng bật `apply_patch` cho các mô hình tương thích, nhưng `deny: ["write"]` không từ chối `apply_patch`. Để chặn mọi thao tác sửa đổi tệp, hãy từ chối `group:fs` hoặc liệt kê rõ từng công cụ có khả năng sửa đổi:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
Không thể đồng thời đặt `allow` và `alsoAllow` trong cùng một phạm vi (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) — quá trình xác thực cấu hình sẽ từ chối trường hợp này. Hãy hợp nhất các mục `alsoAllow` vào `allow`, hoặc bỏ `allow` và thay vào đó sử dụng `profile` + `alsoAllow`.
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

Hạn chế công cụ đối với một danh tính người yêu cầu cụ thể. Đây là lớp phòng vệ chiều sâu bổ sung cho cơ chế kiểm soát truy cập kênh; giá trị người gửi phải đến từ bộ điều hợp kênh, không phải từ nội dung tin nhắn.

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

Các khóa sử dụng tiền tố tường minh: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` hoặc `"*"`. Mã định danh kênh là mã định danh OpenClaw chuẩn; các bí danh như `teams` được chuẩn hóa thành `msteams`. Các khóa cũ không có tiền tố chỉ được chấp nhận dưới dạng `id:`. Thứ tự khớp là kênh+mã định danh, mã định danh, e164, tên người dùng, tên, rồi đến ký tự đại diện.

Cấu hình `agents.list[].tools.toolsBySender` theo từng tác nhân sẽ ghi đè kết quả khớp người gửi toàn cục khi khớp, ngay cả với chính sách rỗng `{}`.

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

- Cấu hình ghi đè theo từng tác nhân (`agents.list[].tools.elevated`) chỉ có thể hạn chế thêm.
- `/elevated on|off|ask|full` lưu trạng thái theo từng phiên; các chỉ thị nội tuyến chỉ áp dụng cho một tin nhắn.
- `exec` nâng cao bỏ qua sandbox và sử dụng đường thoát đã cấu hình (`gateway` theo mặc định, hoặc `node` khi đích thực thi là `node`).

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

Các giá trị hiển thị là mặc định, ngoại trừ `applyPatch.allowModels` (mặc định là rỗng/chưa đặt, nghĩa là mọi mô hình tương thích đều có thể sử dụng `apply_patch`). `approvalRunningNoticeMs` phát thông báo đang chạy khi lệnh thực thi có yêu cầu phê duyệt chạy lâu; `0` sẽ tắt tính năng này.

### `tools.loopDetection`

Các bước kiểm tra an toàn vòng lặp công cụ **bị tắt theo mặc định**. Đặt `enabled: true` để kích hoạt tính năng phát hiện. Có thể định nghĩa cài đặt trên toàn cục trong `tools.loopDetection` và ghi đè theo từng tác nhân tại `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Số lượng tối đa lệnh gọi công cụ trong lịch sử được giữ lại để phân tích vòng lặp.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Ngưỡng cảnh báo đối với mẫu lặp lại không có tiến triển.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Chặn các lệnh gọi lặp lại đến cùng một tên công cụ không khả dụng/không xác định sau số lần thất bại này.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Ngưỡng lặp lại cao hơn để chặn các vòng lặp nghiêm trọng.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Ngưỡng dừng cứng đối với mọi chuỗi thực thi không có tiến triển.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Cảnh báo khi lặp lại các lệnh gọi có cùng công cụ/cùng đối số.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Cảnh báo/chặn đối với các công cụ thăm dò đã biết (`process.poll`, `command_status`, v.v.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Cảnh báo/chặn đối với các mẫu cặp luân phiên không có tiến triển.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Số lần thử sau khi tự động Compaction mà cơ chế bảo vệ vẫn được kích hoạt; sẽ hủy nếu agent lặp lại cùng một bộ (công cụ, đối số, kết quả) trong khoảng này.
</ParamField>

<Warning>
Nếu `warningThreshold >= criticalThreshold` hoặc `criticalThreshold >= globalCircuitBreakerThreshold`, quá trình xác thực sẽ thất bại.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
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

Các giá trị được hiển thị là giá trị mặc định, ngoại trừ `provider` và `userAgent`. `maxResponseBytes` bị giới hạn trong khoảng 32000–10000000; `maxChars` bị giới hạn ở `maxCharsCap` (tăng `maxCharsCap` để cho phép phản hồi lớn hơn).

### `tools.media`

Cấu hình khả năng hiểu nội dung phương tiện đầu vào (hình ảnh/âm thanh/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
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

`concurrency` (mặc định `2`), `audio.maxBytes` (mặc định 20 MB) và `video.maxBytes` (mặc định 50 MB) được hiển thị với giá trị mặc định; `image.maxBytes` mặc định là 10 MB. Thời gian chờ yêu cầu mặc định theo từng khả năng: hình ảnh/âm thanh là `60` giây, video là `120` giây.

<AccordionGroup>
  <Accordion title="Các trường của mục nhập mô hình phương tiện">
    **Mục nhập nhà cung cấp** (`type: "provider"` hoặc bỏ qua):

    - `provider`: mã định danh nhà cung cấp API (`openai`, `anthropic`, `google`/`gemini`, `groq`, v.v.)
    - `model`: ghi đè mã định danh mô hình
    - `profile` / `preferredProfile`: lựa chọn hồ sơ trong `auth-profiles.json`

    **Mục nhập CLI** (`type: "cli"`):

    - `command`: tệp thực thi cần chạy
    - `args`: các đối số theo mẫu (hỗ trợ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, v.v.; `openclaw doctor --fix` di chuyển các phần giữ chỗ `{input}` đã lỗi thời sang `{{MediaPath}}`)

    **Các trường chung:**

    - `capabilities`: danh sách tùy chọn (`image`, `audio`, `video`). Mỗi Plugin nhà cung cấp khai báo tập khả năng mặc định riêng; ví dụ, nhà cung cấp `openai` đi kèm mặc định hỗ trợ hình ảnh+âm thanh, `anthropic`/`minimax` hỗ trợ hình ảnh, `google` hỗ trợ hình ảnh+âm thanh+video và `groq` hỗ trợ âm thanh.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: các giá trị ghi đè theo từng mục nhập.
    - `tools.media.image.timeoutSeconds` và các mục `timeoutSeconds` tương ứng của mô hình hình ảnh cũng áp dụng khi agent gọi trực tiếp công cụ `image`. Đối với khả năng hiểu hình ảnh, thời gian chờ này áp dụng cho chính yêu cầu và không bị giảm bởi công việc chuẩn bị trước đó.
    - Khi xảy ra lỗi, hệ thống chuyển sang mục nhập tiếp theo.

    Việc xác thực nhà cung cấp tuân theo thứ tự tiêu chuẩn: `auth-profiles.json` → biến môi trường → `models.providers.*.apiKey`.

    **Các trường hoàn tất bất đồng bộ:**

    - `asyncCompletion.directSend`: cờ tương thích đã lỗi thời. Các tác vụ phương tiện bất đồng bộ đã hoàn tất vẫn được điều phối qua phiên của bên yêu cầu để agent nhận kết quả, quyết định cách thông báo cho người dùng và sử dụng công cụ tin nhắn khi nguồn yêu cầu gửi trực tiếp.

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

Kiểm soát những phiên nào có thể được các công cụ phiên (`sessions_list`, `sessions_history`, `sessions_send`) nhắm đến.

Mặc định: `tree` (phiên hiện tại + các phiên do phiên này tạo ra, chẳng hạn như các agent con).

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
    - `tree`: phiên hiện tại + các phiên do phiên hiện tại tạo ra (các agent con).
    - `agent`: bất kỳ phiên nào thuộc mã định danh agent hiện tại (có thể bao gồm người dùng khác nếu bạn chạy phiên riêng theo người gửi dưới cùng một mã định danh agent).
    - `all`: bất kỳ phiên nào. Việc nhắm đến agent khác vẫn yêu cầu `tools.agentToAgent`.
    - Giới hạn của sandbox: khi phiên hiện tại chạy trong sandbox và `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (giá trị mặc định), phạm vi hiển thị bị buộc thành `tree` ngay cả khi `tools.sessions.visibility="all"`.
    - Khi không phải `all`, `sessions_list` bao gồm một trường `visibility` thu gọn
      mô tả chế độ có hiệu lực và cảnh báo rằng một số phiên có thể bị
      bỏ qua nếu nằm ngoài phạm vi hiện tại.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Kiểm soát khả năng hỗ trợ tệp đính kèm nội tuyến cho `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Lưu ý về tệp đính kèm">
    - Tệp đính kèm yêu cầu `enabled: true`.
    - Tệp đính kèm của agent con được tạo thành tệp trong không gian làm việc con tại `.openclaw/attachments/<uuid>/` cùng với tệp `.manifest.json`.
    - Tệp đính kèm ACP chỉ hỗ trợ hình ảnh và được chuyển tiếp nội tuyến đến môi trường thực thi ACP sau khi đáp ứng các giới hạn về số lượng tệp, số byte trên mỗi tệp và tổng số byte.
    - Nội dung tệp đính kèm tự động được biên tập ẩn khỏi dữ liệu bản ghi hội thoại được lưu trữ.
    - Dữ liệu đầu vào Base64 được xác thực nghiêm ngặt về bảng ký tự/phần đệm và có cơ chế bảo vệ kích thước trước khi giải mã.
    - Quyền tệp đính kèm của agent con là `0700` cho thư mục và `0600` cho tệp.
    - Việc dọn dẹp agent con tuân theo chính sách `cleanup`: `delete` luôn xóa tệp đính kèm; `keep` chỉ giữ lại chúng khi `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Các cờ công cụ tích hợp thử nghiệm. Mặc định tắt trừ khi áp dụng quy tắc tự động bật GPT-5 ở chế độ agent nghiêm ngặt.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: bật công cụ có cấu trúc `update_plan` để theo dõi công việc nhiều bước không đơn giản.
- Mặc định: `false`, trừ khi `agents.defaults.embeddedAgent.executionContract` (hoặc giá trị ghi đè theo từng agent) được đặt thành `"strict-agentic"` cho một lượt chạy của nhà cung cấp `openai` với mã định danh mô hình thuộc họ GPT-5 (điều này cũng bao gồm các lượt chạy OpenAI Codex CLI vì cơ chế xác thực/định tuyến mô hình của Codex nằm trong nhà cung cấp `openai`). Đặt thành `true` để buộc bật công cụ ngoài phạm vi đó hoặc `false` để tiếp tục tắt ngay cả với các lượt chạy GPT-5 ở chế độ agent nghiêm ngặt.
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

- `model`: mô hình mặc định cho các agent con được tạo. Nếu bỏ qua, các agent con kế thừa mô hình của bên gọi.
- `allowAgents`: danh sách cho phép mặc định gồm các mã định danh agent đích đã cấu hình dành cho `sessions_spawn` khi agent yêu cầu không thiết lập `subagents.allowAgents` riêng (`["*"]` = bất kỳ đích đã cấu hình nào; mặc định: chỉ cùng agent). Các mục cũ có cấu hình agent đã bị xóa sẽ bị `sessions_spawn` từ chối và bị loại khỏi `agents_list`; chạy `openclaw doctor --fix` để dọn dẹp chúng.
- `maxConcurrent`: số lượt chạy agent con đồng thời tối đa. Mặc định: `8`.
- `runTimeoutSeconds`: thời gian chờ (giây) cho `sessions_spawn` khi bên gọi không truyền giá trị ghi đè riêng. Mặc định: `0` (không có thời gian chờ); giá trị `900` hiển thị ở trên là một giá trị thường được chủ động chọn, không phải giá trị mặc định tích hợp.
- `announceTimeoutMs`: thời gian chờ cho mỗi lần gọi (mili giây) đối với các lần thử gửi thông báo `agent` của Gateway. Mặc định: `120000`. Các lần thử lại tạm thời có thể khiến tổng thời gian chờ thông báo dài hơn một khoảng thời gian chờ đã cấu hình.
- `archiveAfterMinutes`: số phút sau khi phiên agent con hoàn tất trước khi được tự động lưu trữ. Mặc định: `60`; `0` tắt tự động lưu trữ.
- Chính sách công cụ theo từng agent con: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Nhà cung cấp tùy chỉnh và URL cơ sở

Các Plugin nhà cung cấp công bố những hàng danh mục mô hình riêng. Thêm nhà cung cấp tùy chỉnh thông qua `models.providers` trong cấu hình hoặc `~/.openclaw/agents/<agentId>/agent/models.json`.

Việc cấu hình `baseUrl` cho nhà cung cấp tùy chỉnh/cục bộ cũng là quyết định tin cậy mạng có phạm vi hẹp đối với các yêu cầu HTTP của mô hình: OpenClaw cho phép chính xác nguồn gốc `scheme://host:port` đó đi qua đường dẫn tìm nạp được bảo vệ mà không cần thêm tùy chọn cấu hình riêng hoặc tin cậy các nguồn gốc riêng tư khác.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
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
  <Accordion title="Xác thực và thứ tự ưu tiên khi hợp nhất">
    - Sử dụng `authHeader: true` + `headers` cho các nhu cầu xác thực tùy chỉnh.
    - Ghi đè thư mục gốc cấu hình tác nhân bằng `OPENCLAW_AGENT_DIR`.
    - Thứ tự ưu tiên khi hợp nhất đối với các ID nhà cung cấp trùng khớp:
      - Các giá trị `baseUrl` không rỗng trong `models.json` của tác nhân được ưu tiên.
      - Các giá trị `apiKey` không rỗng của tác nhân chỉ được ưu tiên khi nhà cung cấp đó không do SecretRef quản lý trong ngữ cảnh cấu hình/hồ sơ xác thực hiện tại.
      - Các giá trị `apiKey` của nhà cung cấp do SecretRef quản lý được làm mới từ dấu mốc nguồn (`ENV_VAR_NAME` cho tham chiếu biến môi trường, `secretref-managed` cho tham chiếu tệp/lệnh thực thi) thay vì lưu lâu dài các bí mật đã được phân giải.
      - Các giá trị tiêu đề của nhà cung cấp do SecretRef quản lý được làm mới từ dấu mốc nguồn (`secretref-env:ENV_VAR_NAME` cho tham chiếu biến môi trường, `secretref-managed` cho tham chiếu tệp/lệnh thực thi).
      - `apiKey`/`baseUrl` của tác nhân bị thiếu hoặc rỗng sẽ dự phòng về `models.providers` trong cấu hình.
      - Với `contextWindow`/`maxTokens` của mô hình trùng khớp: giá trị cấu hình tường minh được ưu tiên khi có mặt và hợp lệ (một số hữu hạn dương); nếu không, giá trị danh mục ngầm định/được tạo sẽ được sử dụng.
      - `contextTokens` của mô hình trùng khớp tuân theo cùng quy tắc ưu tiên giá trị tường minh, nếu không thì dùng giá trị ngầm định; hãy sử dụng trường này để giới hạn ngữ cảnh hiệu dụng mà không thay đổi siêu dữ liệu gốc của mô hình.
      - Các danh mục của Plugin nhà cung cấp được lưu dưới dạng các phân mảnh danh mục được tạo và thuộc quyền sở hữu của Plugin trong trạng thái Plugin của tác nhân.
      - Sử dụng `models.mode: "replace"` khi bạn muốn cấu hình ghi lại hoàn toàn `models.json` và bỏ qua việc hợp nhất các phân mảnh danh mục thuộc quyền sở hữu của Plugin.
      - Việc lưu dấu mốc lấy nguồn làm căn cứ có thẩm quyền: các dấu mốc được ghi từ ảnh chụp nhanh cấu hình nguồn đang hoạt động (trước khi phân giải), không phải từ các giá trị bí mật đã được phân giải khi chạy.

  </Accordion>
</AccordionGroup>

### Chi tiết trường nhà cung cấp

<AccordionGroup>
  <Accordion title="Danh mục cấp cao nhất">
    - `models.mode`: hành vi của danh mục nhà cung cấp (`merge` hoặc `replace`).
    - `models.providers`: ánh xạ nhà cung cấp tùy chỉnh được lập khóa theo ID nhà cung cấp.
      - Chỉnh sửa an toàn: sử dụng `openclaw config set models.providers.<id> '<json>' --strict-json --merge` hoặc `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` để cập nhật theo kiểu bổ sung. `config set` từ chối các thao tác thay thế có tính phá hủy trừ khi bạn truyền `--replace`.

  </Accordion>
  <Accordion title="Kết nối và xác thực nhà cung cấp">
    - `models.providers.*.api`: bộ điều hợp yêu cầu (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). Đối với các phần phụ trợ `/v1/chat/completions` tự lưu trữ như MLX, vLLM, SGLang và hầu hết máy chủ cục bộ tương thích OpenAI, hãy sử dụng `openai-completions`. Nhà cung cấp tùy chỉnh có `baseUrl` nhưng không có `api` mặc định sử dụng `openai-completions`; chỉ đặt `openai-responses` khi phần phụ trợ hỗ trợ `/v1/responses`.
    - `models.providers.*.apiKey`: thông tin xác thực của nhà cung cấp (ưu tiên thay thế bằng SecretRef/biến môi trường).
    - `models.providers.*.auth`: chiến lược xác thực (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: cửa sổ ngữ cảnh gốc mặc định cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `contextWindow`.
    - `models.providers.*.contextTokens`: giới hạn ngữ cảnh hiệu dụng mặc định khi chạy cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `contextTokens`.
    - `models.providers.*.maxTokens`: giới hạn token đầu ra mặc định cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `maxTokens`.
    - `models.providers.*.timeoutSeconds`: thời gian chờ yêu cầu HTTP mô hình tùy chọn cho từng nhà cung cấp, tính bằng giây, bao gồm xử lý kết nối, tiêu đề, nội dung và hủy toàn bộ yêu cầu.
    - `models.providers.*.injectNumCtxForOpenAICompat`: đối với Ollama + `openai-completions`, chèn `options.num_ctx` vào yêu cầu (mặc định: `true`).
    - `models.providers.*.authHeader`: bắt buộc truyền thông tin xác thực trong tiêu đề `Authorization` khi cần.
    - `models.providers.*.baseUrl`: URL cơ sở của API thượng nguồn.
    - `models.providers.*.headers`: các tiêu đề tĩnh bổ sung để định tuyến qua proxy/đối tượng thuê.

  </Accordion>
  <Accordion title="Ghi đè phương thức truyền yêu cầu">
    `models.providers.*.request`: các thiết lập ghi đè phương thức truyền cho yêu cầu HTTP đến nhà cung cấp mô hình.

    - `request.headers`: các tiêu đề bổ sung (được hợp nhất với giá trị mặc định của nhà cung cấp). Giá trị chấp nhận SecretRef.
    - `request.auth`: ghi đè chiến lược xác thực. Các chế độ: `"provider-default"` (sử dụng xác thực tích hợp của nhà cung cấp), `"authorization-bearer"` (với `token`), `"header"` (với `headerName`, `value`, `prefix` tùy chọn).
    - `request.proxy`: ghi đè proxy HTTP. Các chế độ: `"env-proxy"` (sử dụng biến môi trường `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (với `url`). Cả hai chế độ đều chấp nhận đối tượng con `tls` tùy chọn.
    - `request.tls`: ghi đè TLS cho kết nối trực tiếp. Các trường: `ca`, `cert`, `key`, `passphrase` (tất cả đều chấp nhận SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: khi là `true`, cho phép yêu cầu HTTP đến nhà cung cấp mô hình truy cập các dải mạng riêng, CGNAT hoặc tương tự thông qua lớp bảo vệ truy xuất HTTP của nhà cung cấp. URL cơ sở của nhà cung cấp tùy chỉnh/cục bộ đã tin cậy chính xác nguồn gốc được cấu hình, ngoại trừ nguồn gốc siêu dữ liệu/liên kết cục bộ vẫn bị chặn nếu không có lựa chọn tham gia tường minh. Đặt thành `false` để không sử dụng cơ chế tin cậy nguồn gốc chính xác. WebSocket sử dụng cùng `request` cho tiêu đề/TLS nhưng không sử dụng cổng kiểm soát SSRF khi truy xuất đó. Mặc định là `false`.

  </Accordion>
  <Accordion title="Các mục danh mục mô hình">
    - `models.providers.*.models`: các mục danh mục mô hình tường minh của nhà cung cấp.
    - `models.providers.*.models.*.input`: các phương thức đầu vào của mô hình. Sử dụng `["text"]` cho mô hình chỉ xử lý văn bản và `["text", "image"]` cho mô hình hình ảnh/thị giác gốc. Tệp đính kèm hình ảnh chỉ được chèn vào lượt của tác nhân khi mô hình đã chọn được đánh dấu là có khả năng xử lý hình ảnh.
    - `models.providers.*.models.*.contextWindow`: siêu dữ liệu cửa sổ ngữ cảnh gốc của mô hình. Giá trị này ghi đè `contextWindow` cấp nhà cung cấp cho mô hình đó.
    - `models.providers.*.models.*.contextTokens`: giới hạn ngữ cảnh tùy chọn khi chạy. Giá trị này ghi đè `contextTokens` cấp nhà cung cấp; sử dụng khi bạn muốn ngân sách ngữ cảnh hiệu dụng nhỏ hơn `contextWindow` gốc của mô hình; `openclaw models list` hiển thị cả hai giá trị khi chúng khác nhau.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: gợi ý tương thích tùy chọn. Với `api: "openai-completions"` cùng `baseUrl` không rỗng và không phải bản địa (máy chủ không phải `api.openai.com`), OpenClaw buộc giá trị này thành `false` khi chạy. `baseUrl` rỗng/bị lược bỏ giữ nguyên hành vi mặc định của OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: gợi ý tương thích tùy chọn cho các điểm cuối trò chuyện tương thích OpenAI chỉ chấp nhận chuỗi. Khi là `true`, OpenClaw làm phẳng các mảng `messages[].content` chỉ chứa văn bản thành chuỗi thuần trước khi gửi yêu cầu.
    - `models.providers.*.models.*.compat.strictMessageKeys`: gợi ý tương thích tùy chọn cho các điểm cuối trò chuyện tương thích OpenAI nghiêm ngặt. Khi là `true`, OpenClaw rút gọn các đối tượng thông điệp Chat Completions gửi đi chỉ còn `role` và `content` trước khi gửi yêu cầu.
    - `models.providers.*.models.*.compat.thinkingFormat`: gợi ý tùy chọn về tải trọng suy luận. Sử dụng `"together"` cho `reasoning.enabled` kiểu Together, `"qwen"` cho `enable_thinking` cấp cao nhất hoặc `"qwen-chat-template"` cho `chat_template_kwargs.enable_thinking` trên các máy chủ tương thích OpenAI thuộc họ Qwen có hỗ trợ các đối số từ khóa mẫu trò chuyện ở cấp yêu cầu, chẳng hạn như vLLM. Các mô hình Qwen trên vLLM đã cấu hình cung cấp lựa chọn nhị phân `/think` (`off`, `on`) cho các định dạng này.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: gợi ý tương thích tùy chọn cho các phần phụ trợ Chat Completions kiểu DeepSeek yêu cầu thông điệp trợ lý trước đó giữ lại `reasoning_content` khi phát lại. Khi là `true`, OpenClaw giữ nguyên trường đó trong các thông điệp trợ lý gửi đi. Sử dụng tùy chọn này khi kết nối proxy tùy chỉnh tương thích DeepSeek vốn từ chối yêu cầu sau khi nội dung suy luận bị loại bỏ. Mặc định là `false`.

  </Accordion>
  <Accordion title="Khám phá Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: thư mục gốc thiết lập tự động khám phá Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: bật/tắt khám phá ngầm định.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: khu vực AWS dùng để khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: bộ lọc ID nhà cung cấp tùy chọn để khám phá có mục tiêu.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: khoảng thời gian thăm dò để làm mới kết quả khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: cửa sổ ngữ cảnh dự phòng cho các mô hình được khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: số token đầu ra tối đa dự phòng cho các mô hình được khám phá.

  </Accordion>
</AccordionGroup>

Quá trình hướng dẫn thiết lập nhà cung cấp tùy chỉnh ở chế độ tương tác suy luận đầu vào hình ảnh cho các mẫu ID mô hình thị giác đã biết, bao gồm GPT-4o/GPT-4.1/GPT-5+, các họ suy luận `o1`/`o3`/`o4`, Claude, Gemini, mọi ID có hậu tố `-vl` (Qwen-VL và tương tự), cùng các họ có tên như LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V và GLM-4V; quá trình này bỏ qua câu hỏi bổ sung đối với các họ được biết là chỉ xử lý văn bản (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama và các ID Qwen thuần không có hậu tố vl/vision). Các ID mô hình không xác định vẫn được hỏi về khả năng hỗ trợ hình ảnh. Quá trình hướng dẫn thiết lập không tương tác sử dụng cùng cơ chế suy luận; truyền `--custom-image-input` để bắt buộc siêu dữ liệu có khả năng xử lý hình ảnh hoặc `--custom-text-input` để bắt buộc siêu dữ liệu chỉ xử lý văn bản.

### Ví dụ về nhà cung cấp

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin nhà cung cấp `cerebras` bên ngoài chính thức có thể cấu hình mục này thông qua `openclaw onboard --auth-choice cerebras-api-key`. Chỉ sử dụng cấu hình nhà cung cấp tường minh khi ghi đè các giá trị mặc định.

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
  <Accordion title="Lập trình với Kimi">
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

    Tương thích Anthropic, là nhà cung cấp tích hợp sẵn. Lối tắt: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Mô hình cục bộ (LM Studio)">
    Xem [Mô hình cục bộ](/vi/gateway/local-models). Tóm lại: chạy một mô hình cục bộ lớn qua LM Studio Responses API trên phần cứng mạnh; vẫn hợp nhất các mô hình được lưu trữ để dự phòng.
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

    Đặt `MINIMAX_API_KEY`. Lệnh tắt: `openclaw onboard --auth-choice minimax-global-api` hoặc `openclaw onboard --auth-choice minimax-cn-api`. Danh mục mô hình mặc định dùng M3 và cũng bao gồm các biến thể M2.7. Trên luồng phát trực tuyến tương thích với Anthropic, OpenClaw mặc định vô hiệu hóa chế độ suy luận của MiniMax M2.x, trừ khi bạn tự đặt rõ ràng `thinking`; MiniMax-M3 (và M3.x) mặc định vẫn sử dụng cơ chế suy luận thích ứng hoặc không truyền tham số của nhà cung cấp. `/fast on` hoặc `params.fastMode: true` chuyển `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.

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

    Các điểm cuối Moonshot gốc công bố khả năng tương thích với thông tin mức sử dụng khi phát trực tuyến trên phương thức truyền tải `openai-completions` dùng chung, và OpenClaw kích hoạt tính năng này dựa trên khả năng của điểm cuối thay vì chỉ dựa vào mã định danh nhà cung cấp tích hợp sẵn.

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

    Đặt `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`). Dùng tham chiếu `opencode/...` cho danh mục Zen hoặc tham chiếu `opencode-go/...` cho danh mục Go. Lệnh tắt: `openclaw onboard --auth-choice opencode-zen` hoặc `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (tương thích với Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
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
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    URL cơ sở không nên chứa `/v1` (trình khách Anthropic sẽ tự nối thêm). Lệnh tắt: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Đặt `ZAI_API_KEY`. Tham chiếu mô hình sử dụng mã định danh nhà cung cấp chuẩn `zai/*`. Lệnh tắt: `openclaw onboard --auth-choice zai-api-key`.

    - Điểm cuối chung: `https://api.z.ai/api/paas/v4`
    - Điểm cuối lập trình: `https://api.z.ai/api/coding/paas/v4`
    - Lựa chọn xác thực `zai-api-key` mặc định sẽ kiểm tra khóa của bạn và tự động phát hiện khóa đó thuộc điểm cuối nào (nếu không thể xác định chắc chắn, hệ thống sẽ chuyển sang lời nhắc và mặc định chọn Toàn cầu). Các lựa chọn xác thực chuyên biệt cho CN và Coding-Plan cũng có sẵn để bạn chọn rõ ràng.
    - Đối với điểm cuối chung, hãy định nghĩa một nhà cung cấp tùy chỉnh với URL cơ sở được ghi đè.

  </Accordion>
</AccordionGroup>

---

## Liên quan

- [Cấu hình — tác nhân](/vi/gateway/config-agents)
- [Cấu hình — kênh](/vi/gateway/config-channels)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — các khóa cấp cao nhất khác
- [Công cụ và plugin](/vi/tools)
