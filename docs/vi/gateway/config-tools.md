---
read_when:
    - Định cấu hình chính sách `tools.*`, danh sách cho phép hoặc các tính năng thử nghiệm
    - Đăng ký nhà cung cấp tùy chỉnh hoặc ghi đè các URL cơ sở
    - Thiết lập các điểm cuối tự lưu trữ tương thích với OpenAI
sidebarTitle: Tools and custom providers
summary: Cấu hình công cụ (chính sách, công tắc thử nghiệm, công cụ được nhà cung cấp hỗ trợ) và thiết lập nhà cung cấp/URL cơ sở tùy chỉnh
title: Cấu hình — công cụ và nhà cung cấp tùy chỉnh
x-i18n:
    generated_at: "2026-05-03T21:31:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75a39342f40e9c329a7c61855e805ec43532cbdb89fbe801acc26830fd63b4da
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` khóa cấu hình và thiết lập nhà cung cấp / base-URL tùy chỉnh. Đối với agents, kênh và các khóa cấu hình cấp cao nhất khác, xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Công cụ

### Hồ sơ công cụ

`tools.profile` đặt danh sách cho phép cơ sở trước `tools.allow`/`tools.deny`:

<Note>
Quy trình onboarding cục bộ mặc định các cấu hình cục bộ mới thành `tools.profile: "coding"` khi chưa đặt (các hồ sơ tường minh hiện có được giữ nguyên).
</Note>

| Hồ sơ       | Bao gồm                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | Chỉ `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Không hạn chế (giống như chưa đặt)                                                                                              |

### Nhóm công cụ

| Nhóm               | Công cụ                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` được chấp nhận làm bí danh cho `exec`)                                      |
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
| `group:openclaw`   | Tất cả công cụ tích hợp sẵn (không bao gồm Plugin nhà cung cấp)                                                         |

### `tools.allow` / `tools.deny`

Chính sách cho phép/từ chối công cụ toàn cục (từ chối được ưu tiên). Không phân biệt chữ hoa chữ thường, hỗ trợ ký tự đại diện `*`. Được áp dụng ngay cả khi Docker sandbox tắt.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` và `apply_patch` là các id công cụ riêng biệt. `allow: ["write"]` cũng bật `apply_patch` cho các mô hình tương thích, nhưng `deny: ["write"]` không từ chối `apply_patch`. Để chặn mọi thay đổi tệp, hãy từ chối `group:fs` hoặc liệt kê rõ từng công cụ có khả năng thay đổi:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
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

- Ghi đè theo agent (`agents.list[].tools.elevated`) chỉ có thể hạn chế thêm.
- `/elevated on|off|ask|full` lưu trạng thái theo từng phiên; chỉ thị nội tuyến áp dụng cho một tin nhắn.
- `exec` nâng cao bỏ qua sandboxing và dùng đường dẫn thoát đã cấu hình (`gateway` theo mặc định, hoặc `node` khi đích exec là `node`).

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

Các kiểm tra an toàn vòng lặp công cụ **bị tắt theo mặc định**. Đặt `enabled: true` để kích hoạt phát hiện. Có thể định nghĩa thiết lập ở cấp toàn cục trong `tools.loopDetection` và ghi đè theo từng agent tại `agents.list[].tools.loopDetection`.

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
  Ngưỡng dừng cứng cho mọi lượt chạy không có tiến triển.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Cảnh báo khi lặp lại các lệnh gọi cùng công cụ/cùng đối số.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Cảnh báo/chặn trên các công cụ thăm dò đã biết (`process.poll`, `command_status`, v.v.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Cảnh báo/chặn trên các mẫu cặp luân phiên không có tiến triển.
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
  <Accordion title="Các trường mục nhập mô hình phương tiện">
    **Mục nhập nhà cung cấp** (`type: "provider"` hoặc bị bỏ qua):

    - `provider`: id nhà cung cấp API (`openai`, `anthropic`, `google`/`gemini`, `groq`, v.v.)
    - `model`: ghi đè id mô hình
    - `profile` / `preferredProfile`: lựa chọn hồ sơ `auth-profiles.json`

    **Mục nhập CLI** (`type: "cli"`):

    - `command`: tệp thực thi để chạy
    - `args`: đối số theo mẫu (hỗ trợ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, v.v.; `openclaw doctor --fix` di chuyển các placeholder `{input}` đã lỗi thời sang `{{MediaPath}}`)

    **Các trường chung:**

    - `capabilities`: danh sách tùy chọn (`image`, `audio`, `video`). Mặc định: `openai`/`anthropic`/`minimax` → hình ảnh, `google` → hình ảnh+âm thanh+video, `groq` → âm thanh.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: ghi đè theo từng mục nhập.
    - `tools.media.image.timeoutSeconds` và các mục `timeoutSeconds` của mô hình hình ảnh tương ứng cũng áp dụng khi agent gọi công cụ `image` rõ ràng.
    - Lỗi sẽ chuyển dự phòng sang mục nhập tiếp theo.

    Xác thực nhà cung cấp tuân theo thứ tự tiêu chuẩn: `auth-profiles.json` → biến môi trường → `models.providers.*.apiKey`.

    **Các trường hoàn tất bất đồng bộ:**

    - `asyncCompletion.directSend`: khi là `true`, các tác vụ phương tiện bất đồng bộ đã hoàn tất có hỗ trợ gửi hoàn tất trực tiếp sẽ thử gửi trực tiếp qua kênh trước. Mặc định: `false` (đường dẫn đánh thức phiên người yêu cầu/gửi qua mô hình). Hiện tại điều này áp dụng cho `video_generate` bất đồng bộ; các lần hoàn tất `music_generate` bất đồng bộ vẫn được trung gian qua phiên người yêu cầu ngay cả khi tùy chọn này được bật.

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

Kiểm soát những phiên nào có thể được nhắm mục tiêu bởi các công cụ phiên (`sessions_list`, `sessions_history`, `sessions_send`).

Mặc định: `tree` (phiên hiện tại + các phiên do nó tạo ra, chẳng hạn như subagent).

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
    - `agent`: bất kỳ phiên nào thuộc về id agent hiện tại (có thể bao gồm người dùng khác nếu bạn chạy phiên theo từng người gửi dưới cùng một id agent).
    - `all`: bất kỳ phiên nào. Việc nhắm mục tiêu liên agent vẫn yêu cầu `tools.agentToAgent`.
    - Kẹp sandbox: khi phiên hiện tại nằm trong sandbox và `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, khả năng hiển thị bị buộc thành `tree` ngay cả khi `tools.sessions.visibility="all"`.

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
    - Tệp đính kèm chỉ được hỗ trợ cho `runtime: "subagent"`. Runtime ACP sẽ từ chối chúng.
    - Các tệp được hiện thực hóa vào workspace con tại `.openclaw/attachments/<uuid>/` cùng với một `.manifest.json`.
    - Nội dung tệp đính kèm được tự động biên tập khỏi phần lưu giữ bản ghi hội thoại.
    - Đầu vào Base64 được xác thực bằng các kiểm tra nghiêm ngặt về bảng ký tự/phần đệm và một chốt chặn kích thước trước khi giải mã.
    - Quyền tệp là `0700` cho thư mục và `0600` cho tệp.
    - Việc dọn dẹp tuân theo chính sách `cleanup`: `delete` luôn xóa tệp đính kèm; `keep` chỉ giữ lại chúng khi `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Các cờ công cụ tích hợp thử nghiệm. Mặc định tắt trừ khi áp dụng quy tắc tự động bật GPT-5 strict-agentic.

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
- Mặc định: `false` trừ khi `agents.defaults.embeddedPi.executionContract` (hoặc ghi đè theo từng agent) được đặt thành `"strict-agentic"` cho một lượt chạy OpenAI hoặc OpenAI Codex thuộc họ GPT-5. Đặt `true` để buộc bật công cụ ngoài phạm vi đó, hoặc `false` để giữ công cụ tắt ngay cả với các lượt chạy GPT-5 strict-agentic.
- Khi được bật, system prompt cũng thêm hướng dẫn sử dụng để mô hình chỉ dùng công cụ này cho công việc đáng kể và giữ tối đa một bước `in_progress`.

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

- `model`: mô hình mặc định cho các sub-agent được tạo. Nếu bỏ qua, sub-agent kế thừa mô hình của bên gọi.
- `allowAgents`: danh sách cho phép mặc định gồm các id agent đích cho `sessions_spawn` khi agent yêu cầu không tự đặt `subagents.allowAgents` của nó (`["*"]` = bất kỳ; mặc định: chỉ cùng agent).
- `runTimeoutSeconds`: thời gian chờ mặc định (giây) cho `sessions_spawn` khi lệnh gọi công cụ bỏ qua `runTimeoutSeconds`. `0` nghĩa là không có thời gian chờ.
- Chính sách công cụ theo từng subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Nhà cung cấp tùy chỉnh và URL cơ sở

OpenClaw dùng catalog mô hình tích hợp. Thêm nhà cung cấp tùy chỉnh qua `models.providers` trong cấu hình hoặc `~/.openclaw/agents/<agentId>/agent/models.json`.

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
  <Accordion title="Xác thực và thứ tự ưu tiên hợp nhất">
    - Dùng `authHeader: true` + `headers` cho các nhu cầu xác thực tùy chỉnh.
    - Ghi đè gốc cấu hình agent bằng `OPENCLAW_AGENT_DIR` (hoặc `PI_CODING_AGENT_DIR`, một alias biến môi trường kế thừa).
    - Thứ tự ưu tiên hợp nhất cho các ID nhà cung cấp khớp nhau:
      - Giá trị `baseUrl` không rỗng trong `models.json` của agent thắng.
      - Giá trị `apiKey` không rỗng trong agent chỉ thắng khi nhà cung cấp đó không được SecretRef quản lý trong ngữ cảnh cấu hình/auth-profile hiện tại.
      - Giá trị `apiKey` của nhà cung cấp do SecretRef quản lý được làm mới từ marker nguồn (`ENV_VAR_NAME` cho tham chiếu env, `secretref-managed` cho tham chiếu file/exec) thay vì lưu giữ secret đã phân giải.
      - Giá trị header của nhà cung cấp do SecretRef quản lý được làm mới từ marker nguồn (`secretref-env:ENV_VAR_NAME` cho tham chiếu env, `secretref-managed` cho tham chiếu file/exec).
      - `apiKey`/`baseUrl` của agent rỗng hoặc thiếu sẽ quay về `models.providers` trong cấu hình.
      - `contextWindow`/`maxTokens` của mô hình khớp dùng giá trị cao hơn giữa cấu hình tường minh và giá trị catalog ngầm định.
      - `contextTokens` của mô hình khớp giữ nguyên giới hạn runtime tường minh khi có; dùng nó để giới hạn ngữ cảnh hiệu dụng mà không thay đổi siêu dữ liệu mô hình gốc.
      - Dùng `models.mode: "replace"` khi bạn muốn cấu hình ghi lại hoàn toàn `models.json`.
      - Việc lưu giữ marker lấy nguồn làm thẩm quyền: marker được ghi từ snapshot cấu hình nguồn đang hoạt động (trước phân giải), không phải từ giá trị secret runtime đã phân giải.

  </Accordion>
</AccordionGroup>

### Chi tiết trường nhà cung cấp

<AccordionGroup>
  <Accordion title="Catalog cấp cao nhất">
    - `models.mode`: hành vi catalog nhà cung cấp (`merge` hoặc `replace`).
    - `models.providers`: bản đồ nhà cung cấp tùy chỉnh được khóa theo id nhà cung cấp.
      - Chỉnh sửa an toàn: dùng `openclaw config set models.providers.<id> '<json>' --strict-json --merge` hoặc `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` cho các cập nhật bổ sung. `config set` từ chối thay thế phá hủy trừ khi bạn truyền `--replace`.

  </Accordion>
  <Accordion title="Kết nối và xác thực nhà cung cấp">
    - `models.providers.*.api`: adapter yêu cầu (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, v.v.). Với các backend `/v1/chat/completions` tự host như MLX, vLLM, SGLang và hầu hết máy chủ cục bộ tương thích OpenAI, dùng `openai-completions`. Một nhà cung cấp tùy chỉnh có `baseUrl` nhưng không có `api` mặc định là `openai-completions`; chỉ đặt `openai-responses` khi backend hỗ trợ `/v1/responses`.
    - `models.providers.*.apiKey`: thông tin xác thực nhà cung cấp (ưu tiên SecretRef/thay thế env).
    - `models.providers.*.auth`: chiến lược xác thực (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: cửa sổ ngữ cảnh gốc mặc định cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `contextWindow`.
    - `models.providers.*.contextTokens`: giới hạn ngữ cảnh runtime hiệu dụng mặc định cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `contextTokens`.
    - `models.providers.*.maxTokens`: giới hạn token đầu ra mặc định cho các mô hình thuộc nhà cung cấp này khi mục mô hình không đặt `maxTokens`.
    - `models.providers.*.timeoutSeconds`: thời gian chờ tùy chọn theo từng nhà cung cấp cho yêu cầu HTTP mô hình, tính bằng giây, bao gồm kết nối, header, body và xử lý hủy toàn bộ yêu cầu.
    - `models.providers.*.injectNumCtxForOpenAICompat`: với Ollama + `openai-completions`, chèn `options.num_ctx` vào yêu cầu (mặc định: `true`).
    - `models.providers.*.authHeader`: buộc vận chuyển thông tin xác thực trong header `Authorization` khi cần.
    - `models.providers.*.baseUrl`: URL cơ sở API upstream.
    - `models.providers.*.headers`: header tĩnh bổ sung cho định tuyến proxy/tenant.

  </Accordion>
  <Accordion title="Ghi đè truyền tải yêu cầu">
    `models.providers.*.request`: ghi đè truyền tải cho yêu cầu HTTP tới nhà cung cấp mô hình.

    - `request.headers`: header bổ sung (được hợp nhất với mặc định của nhà cung cấp). Giá trị chấp nhận SecretRef.
    - `request.auth`: ghi đè chiến lược xác thực. Chế độ: `"provider-default"` (dùng xác thực tích hợp của nhà cung cấp), `"authorization-bearer"` (với `token`), `"header"` (với `headerName`, `value`, `prefix` tùy chọn).
    - `request.proxy`: ghi đè HTTP proxy. Chế độ: `"env-proxy"` (dùng biến môi trường `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (với `url`). Cả hai chế độ chấp nhận một đối tượng con `tls` tùy chọn.
    - `request.tls`: ghi đè TLS cho kết nối trực tiếp. Các trường: `ca`, `cert`, `key`, `passphrase` (tất cả chấp nhận SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: khi `true`, cho phép HTTPS tới `baseUrl` khi DNS phân giải tới dải riêng tư, CGNAT hoặc tương tự, thông qua chốt chặn fetch HTTP của nhà cung cấp (operator chủ động bật cho các endpoint tương thích OpenAI tự host đáng tin cậy). URL stream của nhà cung cấp mô hình dạng loopback như `localhost`, `127.0.0.1` và `[::1]` được tự động cho phép trừ khi giá trị này được đặt tường minh thành `false`; host LAN, tailnet và DNS riêng vẫn cần chủ động bật. WebSocket dùng cùng `request` cho header/TLS nhưng không dùng cổng SSRF fetch đó. Mặc định `false`.

  </Accordion>
  <Accordion title="Mục catalog mô hình">
    - `models.providers.*.models`: các mục catalog mô hình tường minh của nhà cung cấp.
    - `models.providers.*.models.*.input`: phương thức đầu vào của mô hình. Dùng `["text"]` cho mô hình chỉ văn bản và `["text", "image"]` cho mô hình image/vision gốc. Tệp đính kèm hình ảnh chỉ được chèn vào lượt agent khi mô hình được chọn được đánh dấu là có khả năng xử lý hình ảnh.
    - `models.providers.*.models.*.contextWindow`: siêu dữ liệu cửa sổ ngữ cảnh gốc của mô hình. Giá trị này ghi đè `contextWindow` cấp nhà cung cấp cho mô hình đó.
    - `models.providers.*.models.*.contextTokens`: giới hạn ngữ cảnh runtime tùy chọn. Giá trị này ghi đè `contextTokens` cấp nhà cung cấp; dùng nó khi bạn muốn ngân sách ngữ cảnh hiệu dụng nhỏ hơn `contextWindow` gốc của mô hình; `openclaw models list` hiển thị cả hai giá trị khi chúng khác nhau.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: gợi ý tương thích tùy chọn. Với `api: "openai-completions"` có `baseUrl` không rỗng và không phải gốc (host không phải `api.openai.com`), OpenClaw buộc giá trị này thành `false` tại runtime. `baseUrl` rỗng/bị bỏ qua giữ hành vi OpenAI mặc định.
    - `models.providers.*.models.*.compat.requiresStringContent`: gợi ý tương thích tùy chọn cho các endpoint chat tương thích OpenAI chỉ hỗ trợ chuỗi. Khi `true`, OpenClaw làm phẳng các mảng `messages[].content` chỉ gồm văn bản thuần thành chuỗi đơn giản trước khi gửi yêu cầu.

  </Accordion>
  <Accordion title="Khám phá Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: gốc thiết lập tự động khám phá Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: bật/tắt khám phá ngầm định.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: vùng AWS để khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: bộ lọc id nhà cung cấp tùy chọn cho khám phá có mục tiêu.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: khoảng thăm dò để làm mới khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: cửa sổ ngữ cảnh dự phòng cho các mô hình được khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: số token đầu ra tối đa dự phòng cho các mô hình được khám phá.

  </Accordion>
</AccordionGroup>

Onboarding nhà cung cấp tùy chỉnh tương tác suy luận đầu vào hình ảnh cho các ID mô hình vision phổ biến như GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V và GLM-4V, đồng thời bỏ qua câu hỏi bổ sung cho các họ chỉ văn bản đã biết. ID mô hình không xác định vẫn nhắc hỏi về hỗ trợ hình ảnh. Onboarding không tương tác dùng cùng suy luận; truyền `--custom-image-input` để buộc siêu dữ liệu có khả năng xử lý hình ảnh hoặc `--custom-text-input` để buộc siêu dữ liệu chỉ văn bản.

### Ví dụ về nhà cung cấp

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin nhà cung cấp `cerebras` đi kèm có thể cấu hình phần này qua `openclaw onboard --auth-choice cerebras-api-key`. Chỉ dùng cấu hình nhà cung cấp tường minh khi ghi đè mặc định.

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

    Sử dụng `cerebras/zai-glm-4.7` cho Cerebras; `zai/glm-4.7` cho Z.AI trực tiếp.

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

    Tương thích với Anthropic, nhà cung cấp tích hợp sẵn. Lối tắt: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Mô hình cục bộ (LM Studio)">
    Xem [Mô hình cục bộ](/vi/gateway/local-models). Tóm tắt: chạy một mô hình cục bộ lớn qua LM Studio Responses API trên phần cứng mạnh; giữ các mô hình được lưu trữ đã hợp nhất để dự phòng.
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

    Đặt `MINIMAX_API_KEY`. Lối tắt: `openclaw onboard --auth-choice minimax-global-api` hoặc `openclaw onboard --auth-choice minimax-cn-api`. Danh mục mô hình mặc định chỉ có M2.7. Trên đường dẫn phát trực tuyến tương thích Anthropic, OpenClaw tắt khả năng suy nghĩ của MiniMax theo mặc định trừ khi bạn tự đặt rõ `thinking`. `/fast on` hoặc `params.fastMode: true` viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.

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

    Đối với endpoint Trung Quốc: `baseUrl: "https://api.moonshot.cn/v1"` hoặc `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Các endpoint Moonshot gốc công bố khả năng tương thích mức sử dụng phát trực tuyến trên phương thức vận chuyển `openai-completions` dùng chung, và OpenClaw xác định điều đó dựa trên năng lực của endpoint thay vì chỉ dựa vào id nhà cung cấp tích hợp sẵn.

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

    - Endpoint chung: `https://api.z.ai/api/paas/v4`
    - Endpoint lập trình (mặc định): `https://api.z.ai/api/coding/paas/v4`
    - Đối với endpoint chung, hãy định nghĩa một nhà cung cấp tùy chỉnh với phần ghi đè URL cơ sở.

  </Accordion>
</AccordionGroup>

---

## Liên quan

- [Cấu hình — agents](/vi/gateway/config-agents)
- [Cấu hình — channels](/vi/gateway/config-channels)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — các khóa cấp cao nhất khác
- [Công cụ và plugins](/vi/tools)
