---
read_when:
    - Cấu hình chính sách `tools.*`, danh sách cho phép hoặc tính năng thử nghiệm
    - Đăng ký nhà cung cấp tùy chỉnh hoặc ghi đè URL cơ sở
    - Thiết lập các endpoint tự lưu trữ tương thích với OpenAI
sidebarTitle: Tools and custom providers
summary: Cấu hình công cụ (chính sách, nút bật/tắt thử nghiệm, công cụ được nhà cung cấp hỗ trợ) và thiết lập nhà cung cấp/URL cơ sở tùy chỉnh
title: Cấu hình — công cụ và nhà cung cấp tùy chỉnh
x-i18n:
    generated_at: "2026-06-27T17:28:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

Các khóa cấu hình `tools.*` và thiết lập nhà cung cấp / base-URL tùy chỉnh. Đối với tác tử, kênh và các khóa cấu hình cấp cao khác, xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Công cụ

### Hồ sơ công cụ

`tools.profile` đặt danh sách cho phép cơ sở trước `tools.allow`/`tools.deny`:

<Note>
Onboarding cục bộ mặc định cấu hình cục bộ mới thành `tools.profile: "coding"` khi chưa đặt (các hồ sơ rõ ràng hiện có được giữ nguyên).
</Note>

| Hồ sơ       | Bao gồm                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Chỉ `session_status`                                                                                                                              |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | Không hạn chế (giống như chưa đặt)                                                                                                                |

### Nhóm công cụ

| Nhóm               | Công cụ                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` được chấp nhận làm bí danh cho `exec`)                                      |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Tất cả công cụ tích hợp sẵn (không bao gồm Plugin nhà cung cấp)                                                         |
| `group:plugins`    | Công cụ do Plugin đã tải sở hữu, bao gồm máy chủ MCP đã cấu hình được hiển thị qua `bundle-mcp`                         |

### Công cụ MCP và Plugin trong chính sách công cụ sandbox

Các máy chủ MCP đã cấu hình được hiển thị dưới dạng công cụ do Plugin sở hữu trong id Plugin `bundle-mcp`. Hồ sơ công cụ thông thường có thể cho phép chúng, nhưng `tools.sandbox.tools` là một cổng bổ sung cho các phiên sandbox. Nếu chế độ sandbox là `"all"` hoặc `"non-main"`, hãy đưa một trong các mục này vào danh sách cho phép công cụ sandbox khi công cụ MCP/Plugin cần hiển thị:

- `bundle-mcp` cho máy chủ MCP do OpenClaw quản lý từ `mcp.servers`
- id Plugin cho một Plugin gốc cụ thể
- `group:plugins` cho tất cả công cụ do Plugin đã tải sở hữu
- tên công cụ máy chủ MCP chính xác hoặc glob máy chủ như `outlook__send_mail` hoặc `outlook__*` khi bạn chỉ muốn một máy chủ

Glob máy chủ dùng tiền tố máy chủ MCP an toàn cho nhà cung cấp, không nhất thiết là khóa `mcp.servers` thô. Các ký tự không phải `[A-Za-z0-9_-]` trở thành `-`, tên không bắt đầu bằng chữ cái sẽ có tiền tố `mcp-`, và tiền tố dài hoặc trùng lặp có thể bị cắt ngắn hoặc thêm hậu tố; ví dụ, `mcp.servers["Outlook Graph"]` dùng một glob như `outlook-graph__*`.

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

Nếu không có mục ở lớp sandbox đó, máy chủ MCP vẫn có thể tải thành công trong khi công cụ của nó bị lọc trước yêu cầu nhà cung cấp. Dùng `openclaw doctor` để phát hiện dạng này cho máy chủ do OpenClaw quản lý trong `mcp.servers`. Máy chủ MCP được tải từ manifest Plugin đi kèm hoặc Claude `.mcp.json` dùng cùng cổng sandbox, nhưng chẩn đoán này chưa liệt kê các nguồn đó; dùng cùng các mục danh sách cho phép nếu công cụ của chúng biến mất trong các lượt sandbox.

### `tools.codeMode`

`tools.codeMode` bật bề mặt chế độ code OpenClaw chung. Khi được bật
cho một lượt chạy có công cụ, mô hình chỉ thấy `exec` và `wait`; các công cụ
OpenClaw thông thường chuyển ra sau cầu nối danh mục `tools.*` trong sandbox,
và công cụ MCP khả dụng qua namespace `MCP` được tạo.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Cú pháp rút gọn cũng được chấp nhận:

```json5
{
  tools: { codeMode: true },
}
```

Khai báo MCP được hiển thị qua bề mặt tệp API ảo chỉ đọc trong
chế độ code. Mã khách có thể gọi `API.list("mcp")` và
`API.read("mcp/<server>.d.ts")` để kiểm tra chữ ký kiểu TypeScript trước khi
gọi `MCP.<server>.<tool>()`. Xem [Chế độ code](/vi/reference/code-mode) để biết
hợp đồng runtime, giới hạn và các bước gỡ lỗi.

### `tools.allow` / `tools.deny`

Chính sách cho phép/từ chối công cụ toàn cục (từ chối được ưu tiên). Không phân biệt chữ hoa/thường, hỗ trợ ký tự đại diện `*`. Được áp dụng ngay cả khi sandbox Docker tắt.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` và `apply_patch` là các id công cụ riêng biệt. `allow: ["write"]` cũng bật `apply_patch` cho các mô hình tương thích, nhưng `deny: ["write"]` không từ chối `apply_patch`. Để chặn mọi thay đổi tệp, hãy từ chối `group:fs` hoặc liệt kê rõ từng công cụ có thể thay đổi:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Hạn chế thêm công cụ cho nhà cung cấp hoặc mô hình cụ thể. Thứ tự: hồ sơ cơ sở → hồ sơ nhà cung cấp → cho phép/từ chối.

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

Hạn chế công cụ cho một danh tính người yêu cầu cụ thể. Đây là phòng vệ nhiều lớp bên trên kiểm soát truy cập kênh; giá trị người gửi phải đến từ adapter kênh, không phải văn bản tin nhắn.

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

Khóa dùng tiền tố rõ ràng: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, hoặc `"*"`. Id kênh là id OpenClaw chuẩn; bí danh như `teams` được chuẩn hóa thành `msteams`. Khóa cũ không có tiền tố chỉ được chấp nhận như `id:`. Thứ tự khớp là channel+id, id, e164, username, name, rồi ký tự đại diện.

`agents.list[].tools.toolsBySender` theo từng tác tử ghi đè kết quả khớp người gửi toàn cục khi nó khớp, ngay cả với chính sách `{}` trống.

### `tools.elevated`

Kiểm soát quyền truy cập exec nâng cao bên ngoài sandbox:

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

- Ghi đè theo từng tác tử (`agents.list[].tools.elevated`) chỉ có thể hạn chế thêm.
- `/elevated on|off|ask|full` lưu trạng thái theo từng phiên; chỉ thị nội tuyến áp dụng cho một tin nhắn.
- `exec` nâng cao bỏ qua sandbox và dùng đường thoát đã cấu hình (`gateway` theo mặc định, hoặc `node` khi mục tiêu exec là `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Kiểm tra an toàn vòng lặp công cụ **bị tắt theo mặc định**. Đặt `enabled: true` để kích hoạt phát hiện. Cài đặt có thể được định nghĩa toàn cục trong `tools.loopDetection` và ghi đè theo từng tác tử tại `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Lịch sử lệnh gọi công cụ tối đa được giữ lại để phân tích vòng lặp.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Ngưỡng mẫu lặp không tiến triển để cảnh báo.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Ngưỡng lặp cao hơn để chặn các vòng lặp nghiêm trọng.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Ngưỡng dừng cứng cho bất kỳ lượt chạy không tiến triển nào.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Cảnh báo khi có các lệnh gọi cùng công cụ/cùng đối số lặp lại.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Cảnh báo/chặn trên các công cụ thăm dò đã biết (`process.poll`, `command_status`, v.v.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Cảnh báo/chặn trên các mẫu cặp không tiến triển luân phiên.
</ParamField>

<Warning>
Nếu `warningThreshold >= criticalThreshold` hoặc `criticalThreshold >= globalCircuitBreakerThreshold`, xác thực sẽ thất bại.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
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

### `tools.media`

Cấu hình khả năng hiểu phương tiện đầu vào (hình ảnh/âm thanh/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // không dùng nữa: hoàn thành vẫn do agent trung gian xử lý
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

<AccordionGroup>
  <Accordion title="Các trường mục nhập mô hình phương tiện">
    **Mục nhập nhà cung cấp** (`type: "provider"` hoặc bỏ qua):

    - `provider`: id nhà cung cấp API (`openai`, `anthropic`, `google`/`gemini`, `groq`, v.v.)
    - `model`: ghi đè id mô hình
    - `profile` / `preferredProfile`: lựa chọn hồ sơ `auth-profiles.json`

    **Mục nhập CLI** (`type: "cli"`):

    - `command`: tệp thực thi cần chạy
    - `args`: đối số theo mẫu (hỗ trợ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, v.v.; `openclaw doctor --fix` di chuyển các placeholder `{input}` đã không dùng nữa sang `{{MediaPath}}`)

    **Các trường chung:**

    - `capabilities`: danh sách tùy chọn (`image`, `audio`, `video`). Mặc định: `openai`/`anthropic`/`minimax` → hình ảnh, `google` → hình ảnh+âm thanh+video, `groq` → âm thanh.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: ghi đè theo từng mục nhập.
    - `tools.media.image.timeoutSeconds` và các mục nhập `timeoutSeconds` của mô hình hình ảnh tương ứng cũng áp dụng khi agent gọi công cụ `image` tường minh. Với hiểu hình ảnh, thời gian chờ này áp dụng cho chính yêu cầu và không bị giảm bởi công việc chuẩn bị trước đó.
    - Lỗi sẽ chuyển dự phòng sang mục nhập tiếp theo.

    Xác thực nhà cung cấp tuân theo thứ tự chuẩn: `auth-profiles.json` → biến môi trường → `models.providers.*.apiKey`.

    **Các trường hoàn thành bất đồng bộ:**

    - `asyncCompletion.directSend`: cờ tương thích đã không dùng nữa. Các tác vụ phương tiện bất đồng bộ đã hoàn thành vẫn được trung gian qua phiên của bên yêu cầu để agent nhận kết quả, quyết định cách thông báo cho người dùng và dùng công cụ tin nhắn khi việc phân phối nguồn yêu cầu.

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

Kiểm soát những phiên nào có thể được nhắm tới bởi các công cụ phiên (`sessions_list`, `sessions_history`, `sessions_send`).

Mặc định: `tree` (phiên hiện tại + các phiên do nó sinh ra, chẳng hạn như subagent).

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
    - `tree`: phiên hiện tại + các phiên do phiên hiện tại sinh ra (subagent).
    - `agent`: bất kỳ phiên nào thuộc về id agent hiện tại (có thể bao gồm người dùng khác nếu bạn chạy phiên theo từng người gửi dưới cùng một id agent).
    - `all`: bất kỳ phiên nào. Nhắm mục tiêu giữa các agent vẫn yêu cầu `tools.agentToAgent`.
    - Kẹp sandbox: khi phiên hiện tại bị sandbox và `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, độ hiển thị bị buộc thành `tree` ngay cả khi `tools.sessions.visibility="all"`.
    - Khi không phải `all`, `sessions_list` bao gồm trường `visibility` gọn
      mô tả chế độ hiệu lực và cảnh báo rằng một số phiên có thể bị
      bỏ qua ngoài phạm vi hiện tại.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Kiểm soát hỗ trợ tệp đính kèm nội tuyến cho `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // chọn bật: đặt true để cho phép tệp đính kèm nội tuyến
        maxTotalBytes: 5242880, // tổng 5 MB trên tất cả tệp
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB mỗi tệp
        retainOnSessionKeep: false, // giữ tệp đính kèm khi cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ghi chú về tệp đính kèm">
    - Tệp đính kèm yêu cầu `enabled: true`.
    - Tệp đính kèm của subagent được hiện thực hóa vào không gian làm việc con tại `.openclaw/attachments/<uuid>/` với `.manifest.json`.
    - Tệp đính kèm ACP chỉ dành cho hình ảnh và được chuyển tiếp nội tuyến tới runtime ACP sau khi vượt qua cùng các giới hạn về số lượng tệp, byte trên mỗi tệp và tổng byte.
    - Nội dung tệp đính kèm tự động được biên tập khỏi lưu trữ transcript.
    - Đầu vào Base64 được xác thực bằng kiểm tra bảng chữ cái/phần đệm nghiêm ngặt và bộ bảo vệ kích thước trước giải mã.
    - Quyền tệp đính kèm của subagent là `0700` cho thư mục và `0600` cho tệp.
    - Dọn dẹp subagent tuân theo chính sách `cleanup`: `delete` luôn xóa tệp đính kèm; `keep` chỉ giữ chúng khi `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Các cờ công cụ tích hợp thử nghiệm. Mặc định tắt trừ khi áp dụng quy tắc tự động bật GPT-5 strict-agentic.

```json5
{
  tools: {
    experimental: {
      planTool: true, // bật update_plan thử nghiệm
    },
  },
}
```

- `planTool`: bật công cụ `update_plan` có cấu trúc để theo dõi công việc nhiều bước không tầm thường.
- Mặc định: `false` trừ khi `agents.defaults.embeddedAgent.executionContract` (hoặc ghi đè theo từng agent) được đặt thành `"strict-agentic"` cho lượt chạy họ GPT-5 của OpenAI hoặc OpenAI Codex. Đặt `true` để buộc bật công cụ ngoài phạm vi đó, hoặc `false` để giữ tắt ngay cả với lượt chạy GPT-5 strict-agentic.
- Khi được bật, prompt hệ thống cũng thêm hướng dẫn sử dụng để mô hình chỉ dùng nó cho công việc đáng kể và giữ tối đa một bước `in_progress`.

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

- `model`: mô hình mặc định cho các sub-agent được sinh ra. Nếu bỏ qua, sub-agent kế thừa mô hình của bên gọi.
- `allowAgents`: danh sách cho phép mặc định gồm các id agent mục tiêu đã cấu hình cho `sessions_spawn` khi agent yêu cầu không đặt `subagents.allowAgents` riêng (`["*"]` = bất kỳ mục tiêu đã cấu hình nào; mặc định: chỉ cùng agent). Các mục lỗi thời có cấu hình agent đã bị xóa sẽ bị `sessions_spawn` từ chối và bị bỏ qua khỏi `agents_list`; chạy `openclaw doctor --fix` để dọn dẹp chúng.
- `runTimeoutSeconds`: thời gian chờ mặc định (giây) cho `sessions_spawn`. `0` nghĩa là không có thời gian chờ.
- `announceTimeoutMs`: thời gian chờ theo từng lệnh gọi (mili giây) cho các nỗ lực phân phối thông báo `agent` của Gateway. Mặc định: `120000`. Các lần thử lại tạm thời có thể khiến tổng thời gian chờ thông báo dài hơn một thời gian chờ đã cấu hình.
- Chính sách công cụ theo từng subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Nhà cung cấp tùy chỉnh và URL cơ sở

Plugin nhà cung cấp xuất bản các hàng danh mục mô hình riêng. Thêm nhà cung cấp tùy chỉnh qua `models.providers` trong cấu hình hoặc `~/.openclaw/agents/<agentId>/agent/models.json`.

Cấu hình `baseUrl` cho nhà cung cấp tùy chỉnh/cục bộ cũng là quyết định tin cậy mạng hẹp cho các yêu cầu HTTP mô hình: OpenClaw cho phép chính xác origin `scheme://host:port` đó đi qua đường fetch được bảo vệ, không thêm tùy chọn cấu hình riêng hay tin cậy các origin riêng tư khác.

```json5
{
  models: {
    mode: "merge", // merge (mặc định) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
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
    - Dùng `authHeader: true` + `headers` cho nhu cầu xác thực tùy chỉnh.
    - Ghi đè gốc cấu hình agent bằng `OPENCLAW_AGENT_DIR`.
    - Thứ tự ưu tiên hợp nhất cho ID nhà cung cấp khớp:
      - Các giá trị `baseUrl` trong `models.json` của agent không rỗng thắng.
      - Các giá trị `apiKey` của agent không rỗng chỉ thắng khi nhà cung cấp đó không được SecretRef quản lý trong ngữ cảnh cấu hình/hồ sơ xác thực hiện tại.
      - Các giá trị `apiKey` của nhà cung cấp do SecretRef quản lý được làm mới từ dấu nguồn (`ENV_VAR_NAME` cho tham chiếu env, `secretref-managed` cho tham chiếu file/exec) thay vì lưu bí mật đã phân giải.
      - Các giá trị header của nhà cung cấp do SecretRef quản lý được làm mới từ dấu nguồn (`secretref-env:ENV_VAR_NAME` cho tham chiếu env, `secretref-managed` cho tham chiếu file/exec).
      - `apiKey`/`baseUrl` của agent rỗng hoặc thiếu sẽ quay về `models.providers` trong cấu hình.
      - `contextWindow`/`maxTokens` của mô hình khớp dùng giá trị cao hơn giữa cấu hình tường minh và giá trị danh mục ngầm định.
      - `contextTokens` của mô hình khớp bảo toàn giới hạn runtime tường minh khi có; dùng nó để giới hạn ngữ cảnh hiệu lực mà không thay đổi siêu dữ liệu mô hình gốc.
      - Danh mục Plugin nhà cung cấp được lưu dưới dạng các mảnh danh mục được tạo do plugin sở hữu trong trạng thái plugin của agent.
      - Dùng `models.mode: "replace"` khi bạn muốn cấu hình ghi lại hoàn toàn `models.json` và các mảnh danh mục plugin đang hoạt động.
      - Tính bền vững của dấu là theo nguồn có thẩm quyền: dấu được ghi từ snapshot cấu hình nguồn đang hoạt động (trước phân giải), không phải từ giá trị bí mật runtime đã phân giải.

  </Accordion>
</AccordionGroup>

### Chi tiết trường nhà cung cấp

<AccordionGroup>
  <Accordion title="Danh mục cấp cao nhất">
    - `models.mode`: hành vi danh mục nhà cung cấp (`merge` hoặc `replace`).
    - `models.providers`: bản đồ nhà cung cấp tùy chỉnh được khóa theo id nhà cung cấp.
      - Chỉnh sửa an toàn: dùng `openclaw config set models.providers.<id> '<json>' --strict-json --merge` hoặc `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` để cập nhật bổ sung. `config set` từ chối các thay thế phá hủy trừ khi bạn truyền `--replace`.

  </Accordion>
  <Accordion title="Kết nối nhà cung cấp và xác thực">
    - `models.providers.*.api`: bộ điều hợp yêu cầu (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, v.v.). Với các backend `/v1/chat/completions` tự lưu trữ như MLX, vLLM, SGLang và hầu hết máy chủ cục bộ tương thích OpenAI, hãy dùng `openai-completions`. Nhà cung cấp tùy chỉnh có `baseUrl` nhưng không có `api` sẽ mặc định là `openai-completions`; chỉ đặt `openai-responses` khi backend hỗ trợ `/v1/responses`.
    - `models.providers.*.apiKey`: thông tin xác thực của nhà cung cấp (ưu tiên thay thế SecretRef/env).
    - `models.providers.*.auth`: chiến lược xác thực (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: cửa sổ ngữ cảnh gốc mặc định cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `contextWindow`.
    - `models.providers.*.contextTokens`: giới hạn ngữ cảnh runtime hiệu dụng mặc định cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `contextTokens`.
    - `models.providers.*.maxTokens`: giới hạn token đầu ra mặc định cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `maxTokens`.
    - `models.providers.*.timeoutSeconds`: thời gian chờ yêu cầu HTTP mô hình tùy chọn theo từng nhà cung cấp, tính bằng giây, bao gồm kết nối, header, body và xử lý hủy toàn bộ yêu cầu.
    - `models.providers.*.injectNumCtxForOpenAICompat`: với Ollama + `openai-completions`, chèn `options.num_ctx` vào yêu cầu (mặc định: `true`).
    - `models.providers.*.authHeader`: ép truyền thông tin xác thực trong header `Authorization` khi cần.
    - `models.providers.*.baseUrl`: URL gốc của API upstream.
    - `models.providers.*.headers`: header tĩnh bổ sung cho định tuyến proxy/tenant.

  </Accordion>
  <Accordion title="Ghi đè truyền tải yêu cầu">
    `models.providers.*.request`: ghi đè truyền tải cho các yêu cầu HTTP của nhà cung cấp mô hình.

    - `request.headers`: header bổ sung (được hợp nhất với mặc định của nhà cung cấp). Giá trị chấp nhận SecretRef.
    - `request.auth`: ghi đè chiến lược xác thực. Chế độ: `"provider-default"` (dùng xác thực tích hợp của nhà cung cấp), `"authorization-bearer"` (với `token`), `"header"` (với `headerName`, `value`, `prefix` tùy chọn).
    - `request.proxy`: ghi đè proxy HTTP. Chế độ: `"env-proxy"` (dùng biến môi trường `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (với `url`). Cả hai chế độ đều chấp nhận đối tượng con `tls` tùy chọn.
    - `request.tls`: ghi đè TLS cho kết nối trực tiếp. Trường: `ca`, `cert`, `key`, `passphrase` (tất cả chấp nhận SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: khi là `true`, cho phép yêu cầu HTTP của nhà cung cấp mô hình đến các dải riêng tư, CGNAT hoặc tương tự đi qua bộ bảo vệ fetch HTTP của nhà cung cấp. URL gốc của nhà cung cấp tùy chỉnh/cục bộ đã tin cậy origin được cấu hình chính xác, ngoại trừ origin metadata/link-local, vẫn bị chặn nếu không bật rõ ràng. Đặt thành `false` để từ chối tin cậy exact-origin. WebSocket dùng cùng `request` cho header/TLS nhưng không dùng cổng SSRF fetch đó. Mặc định là `false`.

  </Accordion>
  <Accordion title="Mục danh mục mô hình">
    - `models.providers.*.models`: các mục danh mục mô hình rõ ràng của nhà cung cấp.
    - `models.providers.*.models.*.input`: phương thức đầu vào của mô hình. Dùng `["text"]` cho mô hình chỉ văn bản và `["text", "image"]` cho mô hình hình ảnh/thị giác gốc. Tệp đính kèm hình ảnh chỉ được chèn vào lượt agent khi mô hình được chọn được đánh dấu là có khả năng xử lý hình ảnh.
    - `models.providers.*.models.*.contextWindow`: metadata cửa sổ ngữ cảnh gốc của mô hình. Giá trị này ghi đè `contextWindow` cấp nhà cung cấp cho mô hình đó.
    - `models.providers.*.models.*.contextTokens`: giới hạn ngữ cảnh runtime tùy chọn. Giá trị này ghi đè `contextTokens` cấp nhà cung cấp; dùng khi bạn muốn ngân sách ngữ cảnh hiệu dụng nhỏ hơn `contextWindow` gốc của mô hình; `openclaw models list` hiển thị cả hai giá trị khi chúng khác nhau.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: gợi ý tương thích tùy chọn. Với `api: "openai-completions"` cùng `baseUrl` không rỗng và không phải gốc (host không phải `api.openai.com`), OpenClaw ép giá trị này thành `false` ở runtime. `baseUrl` rỗng/bị bỏ qua giữ hành vi OpenAI mặc định.
    - `models.providers.*.models.*.compat.requiresStringContent`: gợi ý tương thích tùy chọn cho các endpoint chat tương thích OpenAI chỉ nhận chuỗi. Khi là `true`, OpenClaw làm phẳng các mảng `messages[].content` chỉ chứa văn bản thuần thành chuỗi thường trước khi gửi yêu cầu.
    - `models.providers.*.models.*.compat.strictMessageKeys`: gợi ý tương thích tùy chọn cho các endpoint chat tương thích OpenAI nghiêm ngặt. Khi là `true`, OpenClaw rút gọn các đối tượng tin nhắn Chat Completions gửi đi chỉ còn `role` và `content` trước khi gửi yêu cầu.
    - `models.providers.*.models.*.compat.thinkingFormat`: gợi ý payload thinking tùy chọn. Dùng `"together"` cho `reasoning.enabled` kiểu Together, `"qwen"` cho `enable_thinking` cấp cao nhất, hoặc `"qwen-chat-template"` cho `chat_template_kwargs.enable_thinking` trên các máy chủ tương thích OpenAI thuộc họ Qwen có hỗ trợ kwargs chat-template ở cấp yêu cầu, chẳng hạn vLLM. Các mô hình Qwen vLLM đã cấu hình hiển thị lựa chọn nhị phân `/think` (`off`, `on`) cho các định dạng này.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: gợi ý tương thích tùy chọn cho backend Chat Completions kiểu DeepSeek yêu cầu các tin nhắn assistant trước đó giữ `reasoning_content` khi phát lại. Khi là `true`, OpenClaw giữ nguyên trường đó trên các tin nhắn assistant gửi đi. Dùng khi nối một proxy tùy chỉnh tương thích DeepSeek từ chối yêu cầu sau khi reasoning bị loại bỏ. Mặc định là `false`.

  </Accordion>
  <Accordion title="Khám phá Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: gốc cài đặt tự động khám phá Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: bật/tắt khám phá ngầm định.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: vùng AWS dùng cho khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: bộ lọc provider-id tùy chọn cho khám phá có mục tiêu.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: khoảng thời gian thăm dò để làm mới khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: cửa sổ ngữ cảnh dự phòng cho các mô hình được khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: số token đầu ra tối đa dự phòng cho các mô hình được khám phá.

  </Accordion>
</AccordionGroup>

Onboarding nhà cung cấp tùy chỉnh tương tác suy ra đầu vào hình ảnh cho các ID mô hình thị giác phổ biến như GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V và GLM-4V, đồng thời bỏ qua câu hỏi bổ sung cho các họ đã biết là chỉ văn bản. ID mô hình không xác định vẫn sẽ hỏi về hỗ trợ hình ảnh. Onboarding không tương tác dùng cùng cơ chế suy luận; truyền `--custom-image-input` để ép metadata có khả năng xử lý hình ảnh hoặc `--custom-text-input` để ép metadata chỉ văn bản.

### Ví dụ về nhà cung cấp

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin nhà cung cấp `cerebras` bên ngoài chính thức có thể cấu hình việc này qua `openclaw onboard --auth-choice cerebras-api-key`. Chỉ dùng cấu hình nhà cung cấp rõ ràng khi ghi đè mặc định.

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

    Dùng `cerebras/zai-glm-4.7` cho Cerebras; `zai/glm-4.7` cho Z.AI trực tiếp.

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

    Tương thích Anthropic, nhà cung cấp tích hợp sẵn. Lối tắt: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Mô hình cục bộ (LM Studio)">
    Xem [Mô hình cục bộ](/vi/gateway/local-models). Tóm tắt: chạy một mô hình cục bộ lớn qua LM Studio Responses API trên phần cứng mạnh; giữ các mô hình được lưu trữ hợp nhất để dự phòng.
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

    Đặt `MINIMAX_API_KEY`. Lối tắt: `openclaw onboard --auth-choice minimax-global-api` hoặc `openclaw onboard --auth-choice minimax-cn-api`. Danh mục mô hình mặc định là M3 và cũng bao gồm các biến thể M2.7. Trên đường dẫn streaming tương thích Anthropic, OpenClaw tắt thinking của MiniMax M2.x theo mặc định trừ khi bạn tự đặt `thinking` rõ ràng; MiniMax-M3 (và M3.x) vẫn dùng đường dẫn thinking bị bỏ qua/thích ứng của nhà cung cấp theo mặc định. `/fast on` hoặc `params.fastMode: true` ghi lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.

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

    Với endpoint Trung Quốc: `baseUrl: "https://api.moonshot.cn/v1"` hoặc `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Các endpoint Moonshot gốc quảng bá khả năng tương thích usage streaming trên truyền tải `openai-completions` dùng chung, và OpenClaw dựa vào khả năng của endpoint thay vì chỉ dựa vào ID nhà cung cấp tích hợp sẵn.

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

    Đặt `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`). Dùng ref `opencode/...` cho danh mục Zen hoặc ref `opencode-go/...` cho danh mục Go. Lối tắt: `openclaw onboard --auth-choice opencode-zen` hoặc `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
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

    URL cơ sở nên bỏ qua `/v1` (máy khách Anthropic sẽ tự thêm). Lối tắt: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Đặt `ZAI_API_KEY`. Tham chiếu mô hình dùng ID nhà cung cấp chính tắc `zai/*`. Lối tắt: `openclaw onboard --auth-choice zai-api-key`.

    - Điểm cuối chung: `https://api.z.ai/api/paas/v4`
    - Điểm cuối lập trình (mặc định): `https://api.z.ai/api/coding/paas/v4`
    - Với điểm cuối chung, hãy định nghĩa một nhà cung cấp tùy chỉnh với ghi đè URL cơ sở.

  </Accordion>
</AccordionGroup>

---

## Liên quan

- [Cấu hình — tác nhân](/vi/gateway/config-agents)
- [Cấu hình — kênh](/vi/gateway/config-channels)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — các khóa cấp cao khác
- [Công cụ và plugin](/vi/tools)
