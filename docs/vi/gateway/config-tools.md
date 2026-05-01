---
read_when:
    - Cấu hình chính sách `tools.*`, danh sách cho phép hoặc các tính năng thử nghiệm
    - Đăng ký nhà cung cấp tùy chỉnh hoặc ghi đè URL cơ sở
    - Thiết lập các điểm cuối tự lưu trữ tương thích với OpenAI
sidebarTitle: Tools and custom providers
summary: Cấu hình công cụ (chính sách, nút bật/tắt thử nghiệm, công cụ do nhà cung cấp hỗ trợ) và thiết lập nhà cung cấp/base-URL tùy chỉnh
title: Cấu hình — công cụ và nhà cung cấp tùy chỉnh
x-i18n:
    generated_at: "2026-05-01T10:48:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 97e6bd8c762f6f7a9985b99ec016dde22c8ea8adc925778b11c2ae5103b887a8
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` các khóa cấu hình và thiết lập nhà cung cấp tùy chỉnh / URL cơ sở. Đối với agent, kênh và các khóa cấu hình cấp cao nhất khác, xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Công cụ

### Hồ sơ công cụ

`tools.profile` đặt danh sách cho phép cơ sở trước `tools.allow`/`tools.deny`:

<Note>
Quy trình thiết lập cục bộ mặc định cấu hình cục bộ mới thành `tools.profile: "coding"` khi chưa đặt (các hồ sơ tường minh hiện có được giữ nguyên).
</Note>

| Hồ sơ       | Bao gồm                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Chỉ `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Không hạn chế (giống như không đặt)                                                                                                  |

### Nhóm công cụ

| Nhóm               | Công cụ                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` được chấp nhận làm bí danh cho `exec`)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Tất cả công cụ tích hợp sẵn (không bao gồm Plugin nhà cung cấp)                                                                          |

### `tools.allow` / `tools.deny`

Chính sách cho phép/từ chối công cụ toàn cục (từ chối được ưu tiên). Không phân biệt chữ hoa chữ thường, hỗ trợ ký tự đại diện `*`. Được áp dụng ngay cả khi Docker sandbox tắt.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Hạn chế thêm công cụ cho các nhà cung cấp hoặc mô hình cụ thể. Thứ tự: hồ sơ cơ sở → hồ sơ nhà cung cấp → cho phép/từ chối.

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

### `tools.elevated`

Kiểm soát quyền truy cập `exec` nâng quyền bên ngoài sandbox:

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

- Ghi đè theo từng agent (`agents.list[].tools.elevated`) chỉ có thể hạn chế thêm.
- `/elevated on|off|ask|full` lưu trạng thái theo từng phiên; chỉ thị nội tuyến áp dụng cho một tin nhắn.
- `exec` nâng quyền bỏ qua sandbox và dùng đường dẫn thoát đã cấu hình (`gateway` theo mặc định, hoặc `node` khi mục tiêu exec là `node`).

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
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Các kiểm tra an toàn vòng lặp công cụ **bị tắt theo mặc định**. Đặt `enabled: true` để kích hoạt phát hiện. Có thể định nghĩa thiết lập toàn cục trong `tools.loopDetection` và ghi đè theo từng agent tại `agents.list[].tools.loopDetection`.

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
  Ngưỡng mẫu lặp lại không có tiến triển để cảnh báo.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Ngưỡng lặp lại cao hơn để chặn các vòng lặp nghiêm trọng.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Ngưỡng dừng cứng cho mọi lần chạy không có tiến triển.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Cảnh báo khi lặp lại các lệnh gọi cùng công cụ/cùng tham số.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Cảnh báo/chặn trên các công cụ thăm dò đã biết (`process.poll`, `command_status`, v.v.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Cảnh báo/chặn trên các mẫu cặp luân phiên không có tiến triển.
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
        apiKey: "brave_api_key", // hoặc biến môi trường BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // tùy chọn; bỏ qua để tự động phát hiện
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
        directSend: false, // opt-in: send finished async video directly to the channel
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
  <Accordion title="Các trường của mục nhập mô hình phương tiện">
    **Mục nhập nhà cung cấp** (`type: "provider"` hoặc bỏ qua):

    - `provider`: id nhà cung cấp API (`openai`, `anthropic`, `google`/`gemini`, `groq`, v.v.)
    - `model`: ghi đè id mô hình
    - `profile` / `preferredProfile`: lựa chọn hồ sơ `auth-profiles.json`

    **Mục nhập CLI** (`type: "cli"`):

    - `command`: tệp thực thi cần chạy
    - `args`: đối số theo mẫu (hỗ trợ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, v.v.; `openclaw doctor --fix` di chuyển các placeholder `{input}` đã lỗi thời sang `{{MediaPath}}`)

    **Trường chung:**

    - `capabilities`: danh sách tùy chọn (`image`, `audio`, `video`). Mặc định: `openai`/`anthropic`/`minimax` → hình ảnh, `google` → hình ảnh+âm thanh+video, `groq` → âm thanh.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: ghi đè theo từng mục nhập.
    - `tools.media.image.timeoutSeconds` và các mục nhập `timeoutSeconds` của mô hình hình ảnh tương ứng cũng áp dụng khi agent gọi công cụ `image` rõ ràng.
    - Lỗi sẽ chuyển dự phòng sang mục nhập tiếp theo.

    Xác thực nhà cung cấp tuân theo thứ tự chuẩn: `auth-profiles.json` → biến môi trường → `models.providers.*.apiKey`.

    **Trường hoàn tất bất đồng bộ:**

    - `asyncCompletion.directSend`: khi là `true`, các tác vụ phương tiện bất đồng bộ đã hoàn tất có hỗ trợ chuyển phát hoàn tất trực tiếp sẽ thử chuyển phát trực tiếp qua kênh trước. Mặc định: `false` (đường dẫn đánh thức phiên của người yêu cầu/chuyển phát qua mô hình). Hiện tại điều này áp dụng cho `video_generate` bất đồng bộ; các lần hoàn tất `music_generate` bất đồng bộ vẫn qua trung gian phiên của người yêu cầu ngay cả khi tùy chọn này được bật.

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

Kiểm soát những phiên nào có thể được nhắm mục tiêu bằng các công cụ phiên (`sessions_list`, `sessions_history`, `sessions_send`).

Mặc định: `tree` (phiên hiện tại + các phiên do phiên đó tạo ra, chẳng hạn như subagent).

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
    - `tree`: phiên hiện tại + các phiên do phiên hiện tại tạo ra (subagent).
    - `agent`: bất kỳ phiên nào thuộc về id agent hiện tại (có thể bao gồm người dùng khác nếu bạn chạy các phiên theo từng người gửi dưới cùng một id agent).
    - `all`: bất kỳ phiên nào. Việc nhắm mục tiêu liên agent vẫn yêu cầu `tools.agentToAgent`.
    - Kẹp sandbox: khi phiên hiện tại nằm trong sandbox và `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, khả năng hiển thị bị ép thành `tree` ngay cả khi `tools.sessions.visibility="all"`.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Kiểm soát hỗ trợ tệp đính kèm nội tuyến cho `sessions_spawn`.

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
  <Accordion title="Ghi chú về tệp đính kèm">
    - Tệp đính kèm chỉ được hỗ trợ cho `runtime: "subagent"`. Runtime ACP từ chối chúng.
    - Tệp được hiện thực hóa vào workspace con tại `.openclaw/attachments/<uuid>/` cùng với `.manifest.json`.
    - Nội dung tệp đính kèm được tự động biên tập khỏi phần lưu transcript.
    - Đầu vào Base64 được xác thực bằng kiểm tra bảng chữ cái/phần đệm nghiêm ngặt và cơ chế bảo vệ kích thước trước khi giải mã.
    - Quyền tệp là `0700` cho thư mục và `0600` cho tệp.
    - Việc dọn dẹp tuân theo chính sách `cleanup`: `delete` luôn xóa tệp đính kèm; `keep` chỉ giữ lại chúng khi `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Các cờ công cụ tích hợp thử nghiệm. Mặc định tắt trừ khi áp dụng quy tắc tự động bật GPT-5 agentic nghiêm ngặt.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: bật công cụ `update_plan` có cấu trúc để theo dõi công việc nhiều bước không tầm thường.
- Mặc định: `false` trừ khi `agents.defaults.embeddedPi.executionContract` (hoặc một ghi đè theo từng tác nhân) được đặt thành `"strict-agentic"` cho một lần chạy OpenAI hoặc OpenAI Codex thuộc họ GPT-5. Đặt `true` để buộc bật công cụ ngoài phạm vi đó, hoặc `false` để giữ tắt ngay cả với các lần chạy GPT-5 strict-agentic.
- Khi được bật, lời nhắc hệ thống cũng thêm hướng dẫn sử dụng để mô hình chỉ dùng công cụ này cho công việc đáng kể và giữ tối đa một bước `in_progress`.

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: mô hình mặc định cho các tác nhân con được tạo. Nếu bị bỏ qua, tác nhân con kế thừa mô hình của bên gọi.
- `allowAgents`: danh sách cho phép mặc định gồm các ID tác nhân đích cho `sessions_spawn` khi tác nhân yêu cầu không đặt `subagents.allowAgents` riêng (`["*"]` = bất kỳ; mặc định: chỉ cùng tác nhân).
- `runTimeoutSeconds`: thời gian chờ mặc định (giây) cho `sessions_spawn` khi lệnh gọi công cụ bỏ qua `runTimeoutSeconds`. `0` nghĩa là không có thời gian chờ.
- Chính sách công cụ theo từng tác nhân con: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Nhà cung cấp tùy chỉnh và URL cơ sở

OpenClaw dùng danh mục mô hình tích hợp. Thêm nhà cung cấp tùy chỉnh qua `models.providers` trong cấu hình hoặc `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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
  <Accordion title="Auth and merge precedence">
    - Dùng `authHeader: true` + `headers` cho nhu cầu xác thực tùy chỉnh.
    - Ghi đè gốc cấu hình tác nhân bằng `OPENCLAW_AGENT_DIR` (hoặc `PI_CODING_AGENT_DIR`, một bí danh biến môi trường cũ).
    - Thứ tự ưu tiên hợp nhất cho các ID nhà cung cấp khớp nhau:
      - Các giá trị `baseUrl` không rỗng trong `models.json` của tác nhân sẽ thắng.
      - Các giá trị `apiKey` không rỗng của tác nhân chỉ thắng khi nhà cung cấp đó không được SecretRef quản lý trong ngữ cảnh cấu hình/auth-profile hiện tại.
      - Các giá trị `apiKey` của nhà cung cấp do SecretRef quản lý được làm mới từ dấu mốc nguồn (`ENV_VAR_NAME` cho tham chiếu env, `secretref-managed` cho tham chiếu file/exec) thay vì lưu bí mật đã phân giải.
      - Các giá trị header của nhà cung cấp do SecretRef quản lý được làm mới từ dấu mốc nguồn (`secretref-env:ENV_VAR_NAME` cho tham chiếu env, `secretref-managed` cho tham chiếu file/exec).
      - `apiKey`/`baseUrl` rỗng hoặc thiếu của tác nhân sẽ quay về `models.providers` trong cấu hình.
      - `contextWindow`/`maxTokens` của mô hình khớp dùng giá trị cao hơn giữa cấu hình tường minh và giá trị danh mục ngầm định.
      - `contextTokens` của mô hình khớp giữ nguyên giới hạn runtime tường minh khi có; dùng nó để giới hạn ngữ cảnh hiệu dụng mà không thay đổi siêu dữ liệu mô hình gốc.
      - Dùng `models.mode: "replace"` khi bạn muốn cấu hình viết lại hoàn toàn `models.json`.
      - Việc lưu dấu mốc lấy nguồn làm thẩm quyền: dấu mốc được ghi từ ảnh chụp cấu hình nguồn đang hoạt động (trước khi phân giải), không phải từ các giá trị bí mật runtime đã phân giải.

  </Accordion>
</AccordionGroup>

### Chi tiết trường của nhà cung cấp

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: hành vi danh mục nhà cung cấp (`merge` hoặc `replace`).
    - `models.providers`: bản đồ nhà cung cấp tùy chỉnh được lập khóa theo ID nhà cung cấp.
      - Chỉnh sửa an toàn: dùng `openclaw config set models.providers.<id> '<json>' --strict-json --merge` hoặc `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` cho các cập nhật bổ sung. `config set` từ chối các thay thế phá hủy trừ khi bạn truyền `--replace`.

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: bộ chuyển đổi yêu cầu (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, v.v.). Với backend `/v1/chat/completions` tự lưu trữ như MLX, vLLM, SGLang và hầu hết máy chủ cục bộ tương thích OpenAI, dùng `openai-completions`. Nhà cung cấp tùy chỉnh có `baseUrl` nhưng không có `api` mặc định là `openai-completions`; chỉ đặt `openai-responses` khi backend hỗ trợ `/v1/responses`.
    - `models.providers.*.apiKey`: thông tin xác thực nhà cung cấp (ưu tiên SecretRef/thay thế env).
    - `models.providers.*.auth`: chiến lược xác thực (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: cửa sổ ngữ cảnh gốc mặc định cho các mô hình dưới nhà cung cấp này khi mục mô hình không đặt `contextWindow`.
    - `models.providers.*.contextTokens`: giới hạn ngữ cảnh runtime hiệu dụng mặc định cho các mô hình dưới nhà cung cấp này khi mục mô hình không đặt `contextTokens`.
    - `models.providers.*.maxTokens`: giới hạn token đầu ra mặc định cho các mô hình dưới nhà cung cấp này khi mục mô hình không đặt `maxTokens`.
    - `models.providers.*.timeoutSeconds`: thời gian chờ yêu cầu HTTP mô hình tùy chọn theo từng nhà cung cấp, tính bằng giây, bao gồm xử lý kết nối, header, body và hủy toàn bộ yêu cầu.
    - `models.providers.*.injectNumCtxForOpenAICompat`: với Ollama + `openai-completions`, chèn `options.num_ctx` vào yêu cầu (mặc định: `true`).
    - `models.providers.*.authHeader`: buộc truyền thông tin xác thực trong header `Authorization` khi cần.
    - `models.providers.*.baseUrl`: URL cơ sở của API upstream.
    - `models.providers.*.headers`: header tĩnh bổ sung cho định tuyến proxy/tenant.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: ghi đè tầng vận chuyển cho các yêu cầu HTTP tới nhà cung cấp mô hình.

    - `request.headers`: header bổ sung (được hợp nhất với mặc định của nhà cung cấp). Giá trị chấp nhận SecretRef.
    - `request.auth`: ghi đè chiến lược xác thực. Chế độ: `"provider-default"` (dùng xác thực tích hợp của nhà cung cấp), `"authorization-bearer"` (với `token`), `"header"` (với `headerName`, `value`, `prefix` tùy chọn).
    - `request.proxy`: ghi đè proxy HTTP. Chế độ: `"env-proxy"` (dùng biến môi trường `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (với `url`). Cả hai chế độ chấp nhận một đối tượng con `tls` tùy chọn.
    - `request.tls`: ghi đè TLS cho kết nối trực tiếp. Trường: `ca`, `cert`, `key`, `passphrase` (tất cả chấp nhận SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: khi là `true`, cho phép HTTPS tới `baseUrl` khi DNS phân giải thành các dải riêng tư, CGNAT hoặc tương tự, thông qua bộ bảo vệ fetch HTTP của nhà cung cấp (operator chủ động bật cho endpoint tự lưu trữ đáng tin cậy tương thích OpenAI). Các URL luồng nhà cung cấp mô hình local loopback như `localhost`, `127.0.0.1` và `[::1]` được tự động cho phép trừ khi mục này được đặt tường minh thành `false`; máy chủ LAN, tailnet và DNS riêng vẫn yêu cầu chủ động bật. WebSocket dùng cùng `request` cho header/TLS nhưng không dùng cổng SSRF fetch đó. Mặc định `false`.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: các mục danh mục mô hình tường minh của nhà cung cấp.
    - `models.providers.*.models.*.input`: phương thức đầu vào của mô hình. Dùng `["text"]` cho mô hình chỉ văn bản và `["text", "image"]` cho mô hình hình ảnh/thị giác gốc. Tệp đính kèm hình ảnh chỉ được chèn vào lượt tác nhân khi mô hình được chọn được đánh dấu là hỗ trợ hình ảnh.
    - `models.providers.*.models.*.contextWindow`: siêu dữ liệu cửa sổ ngữ cảnh gốc của mô hình. Mục này ghi đè `contextWindow` cấp nhà cung cấp cho mô hình đó.
    - `models.providers.*.models.*.contextTokens`: giới hạn ngữ cảnh runtime tùy chọn. Mục này ghi đè `contextTokens` cấp nhà cung cấp; dùng nó khi bạn muốn ngân sách ngữ cảnh hiệu dụng nhỏ hơn `contextWindow` gốc của mô hình; `openclaw models list` hiển thị cả hai giá trị khi chúng khác nhau.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: gợi ý tương thích tùy chọn. Với `api: "openai-completions"` có `baseUrl` không rỗng và không phải gốc (host không phải `api.openai.com`), OpenClaw buộc giá trị này thành `false` lúc runtime. `baseUrl` rỗng/bị bỏ qua giữ hành vi OpenAI mặc định.
    - `models.providers.*.models.*.compat.requiresStringContent`: gợi ý tương thích tùy chọn cho các endpoint chat tương thích OpenAI chỉ nhận chuỗi. Khi là `true`, OpenClaw làm phẳng các mảng `messages[].content` thuần văn bản thành chuỗi thường trước khi gửi yêu cầu.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: gốc cài đặt tự động khám phá Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: bật/tắt khám phá ngầm định.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: vùng AWS cho khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: bộ lọc ID nhà cung cấp tùy chọn cho khám phá có mục tiêu.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: khoảng thăm dò để làm mới khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: cửa sổ ngữ cảnh dự phòng cho các mô hình được khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: số token đầu ra tối đa dự phòng cho các mô hình được khám phá.

  </Accordion>
</AccordionGroup>

Quy trình onboard nhà cung cấp tùy chỉnh ở chế độ tương tác suy luận đầu vào hình ảnh cho các ID mô hình thị giác phổ biến như GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V và GLM-4V, đồng thời bỏ qua câu hỏi bổ sung cho các họ đã biết là chỉ văn bản. ID mô hình không xác định vẫn hỏi về hỗ trợ hình ảnh. Onboard không tương tác dùng cùng cơ chế suy luận; truyền `--custom-image-input` để buộc siêu dữ liệu hỗ trợ hình ảnh hoặc `--custom-text-input` để buộc siêu dữ liệu chỉ văn bản.

### Ví dụ về nhà cung cấp

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin nhà cung cấp `cerebras` đi kèm có thể cấu hình mục này qua `openclaw onboard --auth-choice cerebras-api-key`. Chỉ dùng cấu hình nhà cung cấp tường minh khi ghi đè mặc định.

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
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Tương thích Anthropic, nhà cung cấp tích hợp. Lối tắt: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Mô hình cục bộ (LM Studio)">
    Xem [Mô hình cục bộ](/vi/gateway/local-models). Tóm tắt: chạy một mô hình cục bộ lớn qua LM Studio Responses API trên phần cứng mạnh; giữ các mô hình lưu trữ trên dịch vụ được hợp nhất để dự phòng.
  </Accordion>
  <Accordion title="MiniMax M2.7 (trực tiếp)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
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
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Đặt `MINIMAX_API_KEY`. Lối tắt: `openclaw onboard --auth-choice minimax-global-api` hoặc `openclaw onboard --auth-choice minimax-cn-api`. Danh mục mô hình mặc định chỉ dùng M2.7. Trên đường truyền phát trực tuyến tương thích Anthropic, OpenClaw tắt chế độ suy luận của MiniMax theo mặc định trừ khi bạn tự đặt `thinking` một cách rõ ràng. `/fast on` hoặc `params.fastMode: true` viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.

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

    Với điểm cuối Trung Quốc: `baseUrl: "https://api.moonshot.cn/v1"` hoặc `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Các điểm cuối Moonshot gốc công bố khả năng tương thích với mức sử dụng khi phát trực tuyến trên transport `openai-completions` dùng chung, và OpenClaw dựa vào khả năng của điểm cuối thay vì chỉ dựa vào id nhà cung cấp tích hợp sẵn.

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

    Đặt `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`). Dùng tham chiếu `opencode/...` cho danh mục Zen hoặc tham chiếu `opencode-go/...` cho danh mục Go. Lối tắt: `openclaw onboard --auth-choice opencode-zen` hoặc `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (tương thích Anthropic)">
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

    URL cơ sở nên bỏ `/v1` (máy khách Anthropic sẽ thêm phần này). Lối tắt: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Đặt `ZAI_API_KEY`. `z.ai/*` và `z-ai/*` được chấp nhận làm bí danh. Lối tắt: `openclaw onboard --auth-choice zai-api-key`.

    - Điểm cuối chung: `https://api.z.ai/api/paas/v4`
    - Điểm cuối lập trình (mặc định): `https://api.z.ai/api/coding/paas/v4`
    - Với điểm cuối chung, hãy định nghĩa một nhà cung cấp tùy chỉnh bằng cách ghi đè URL cơ sở.

  </Accordion>
</AccordionGroup>

---

## Liên quan

- [Cấu hình — agents](/vi/gateway/config-agents)
- [Cấu hình — channels](/vi/gateway/config-channels)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — các khóa cấp cao khác
- [Công cụ và plugins](/vi/tools)
