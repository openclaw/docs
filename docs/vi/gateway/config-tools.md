---
read_when:
    - Định cấu hình chính sách `tools.*`, danh sách cho phép hoặc tính năng thử nghiệm
    - Đăng ký nhà cung cấp tùy chỉnh hoặc ghi đè URL cơ sở
    - Thiết lập các điểm cuối tự lưu trữ tương thích với OpenAI
sidebarTitle: Tools and custom providers
summary: Cấu hình công cụ (chính sách, các công tắc thử nghiệm, công cụ được hỗ trợ bởi nhà cung cấp) và thiết lập nhà cung cấp/URL cơ sở tùy chỉnh
title: Cấu hình — công cụ và nhà cung cấp tùy chỉnh
x-i18n:
    generated_at: "2026-04-29T22:41:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1790c92ecaf822c837326d8e22e9d72cc44e5d4cc0bcc00c154ba5160975002a
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` khóa cấu hình và thiết lập nhà cung cấp tùy chỉnh / URL cơ sở. Đối với tác nhân, kênh và các khóa cấu hình cấp cao nhất khác, xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Công cụ

### Hồ sơ công cụ

`tools.profile` đặt một danh sách cho phép cơ sở trước `tools.allow`/`tools.deny`:

<Note>
Quy trình thiết lập cục bộ mặc định các cấu hình cục bộ mới thành `tools.profile: "coding"` khi chưa đặt (các hồ sơ rõ ràng hiện có được giữ nguyên).
</Note>

| Hồ sơ       | Bao gồm                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `minimal`   | Chỉ `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Không hạn chế (giống như chưa đặt)                                                                                             |

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
| `group:openclaw`   | Tất cả công cụ tích hợp sẵn (không bao gồm Plugin của nhà cung cấp)                                                      |

### `tools.allow` / `tools.deny`

Chính sách cho phép/từ chối công cụ toàn cục (từ chối thắng). Không phân biệt chữ hoa chữ thường, hỗ trợ ký tự đại diện `*`. Được áp dụng ngay cả khi Docker sandbox tắt.

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

Kiểm soát quyền truy cập `exec` nâng cao bên ngoài sandbox:

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

- Ghi đè theo từng tác nhân (`agents.list[].tools.elevated`) chỉ có thể hạn chế thêm.
- `/elevated on|off|ask|full` lưu trạng thái theo từng phiên; chỉ thị nội tuyến áp dụng cho một tin nhắn.
- `exec` nâng cao bỏ qua sandbox và dùng đường dẫn thoát đã cấu hình (`gateway` theo mặc định, hoặc `node` khi mục tiêu exec là `node`).

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

Các kiểm tra an toàn vòng lặp công cụ **bị tắt theo mặc định**. Đặt `enabled: true` để kích hoạt phát hiện. Có thể định nghĩa thiết lập toàn cục trong `tools.loopDetection` và ghi đè theo từng tác nhân tại `agents.list[].tools.loopDetection`.

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
  Ngưỡng dừng cứng cho bất kỳ lượt chạy không có tiến triển nào.
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

Định cấu hình khả năng hiểu phương tiện gửi đến (hình ảnh/âm thanh/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
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
  <Accordion title="Media model entry fields">
    **Mục nhập nhà cung cấp** (`type: "provider"` hoặc bị lược bỏ):

    - `provider`: id nhà cung cấp API (`openai`, `anthropic`, `google`/`gemini`, `groq`, v.v.)
    - `model`: ghi đè id mô hình
    - `profile` / `preferredProfile`: lựa chọn hồ sơ `auth-profiles.json`

    **Mục nhập CLI** (`type: "cli"`):

    - `command`: tệp thực thi cần chạy
    - `args`: đối số theo mẫu (hỗ trợ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, v.v.; `openclaw doctor --fix` di chuyển các placeholder `{input}` đã ngừng dùng sang `{{MediaPath}}`)

    **Trường chung:**

    - `capabilities`: danh sách tùy chọn (`image`, `audio`, `video`). Mặc định: `openai`/`anthropic`/`minimax` → hình ảnh, `google` → hình ảnh+âm thanh+video, `groq` → âm thanh.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: ghi đè theo từng mục nhập.
    - `tools.media.image.timeoutSeconds` và các mục nhập `timeoutSeconds` tương ứng của mô hình hình ảnh cũng được áp dụng khi tác tử gọi công cụ `image` rõ ràng.
    - Lỗi sẽ chuyển sang mục nhập tiếp theo.

    Xác thực nhà cung cấp tuân theo thứ tự tiêu chuẩn: `auth-profiles.json` → biến môi trường → `models.providers.*.apiKey`.

    **Trường hoàn tất bất đồng bộ:**

    - `asyncCompletion.directSend`: khi là `true`, các tác vụ bất đồng bộ `music_generate` và `video_generate` đã hoàn tất sẽ thử gửi trực tiếp tới kênh trước. Mặc định: `false` (đường dẫn cũ đánh thức phiên người yêu cầu/phân phối qua mô hình).

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

Mặc định: `tree` (phiên hiện tại + các phiên do nó sinh ra, chẳng hạn như tác tử phụ).

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
  <Accordion title="Visibility scopes">
    - `self`: chỉ khóa phiên hiện tại.
    - `tree`: phiên hiện tại + các phiên do phiên hiện tại sinh ra (tác tử phụ).
    - `agent`: bất kỳ phiên nào thuộc về id tác tử hiện tại (có thể bao gồm người dùng khác nếu bạn chạy các phiên theo từng người gửi dưới cùng một id tác tử).
    - `all`: bất kỳ phiên nào. Nhắm mục tiêu xuyên tác tử vẫn yêu cầu `tools.agentToAgent`.
    - Kẹp sandbox: khi phiên hiện tại đang ở trong sandbox và `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, mức hiển thị bị ép thành `tree` ngay cả khi `tools.sessions.visibility="all"`.

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
  <Accordion title="Attachment notes">
    - Tệp đính kèm chỉ được hỗ trợ cho `runtime: "subagent"`. Runtime ACP từ chối chúng.
    - Tệp được hiện thực hóa vào không gian làm việc con tại `.openclaw/attachments/<uuid>/` cùng với `.manifest.json`.
    - Nội dung tệp đính kèm được tự động biên tập khỏi phần lưu bền transcript.
    - Đầu vào Base64 được xác thực bằng kiểm tra bảng chữ cái/phần đệm nghiêm ngặt và chặn kích thước trước khi giải mã.
    - Quyền tệp là `0700` cho thư mục và `0600` cho tệp.
    - Dọn dẹp tuân theo chính sách `cleanup`: `delete` luôn xóa tệp đính kèm; `keep` chỉ giữ lại chúng khi `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Cờ công cụ tích hợp thử nghiệm. Mặc định tắt trừ khi áp dụng quy tắc tự động bật GPT-5 tác tử nghiêm ngặt.

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
- Mặc định: `false` trừ khi `agents.defaults.embeddedPi.executionContract` (hoặc ghi đè theo từng agent) được đặt thành `"strict-agentic"` cho một lần chạy thuộc họ GPT-5 của OpenAI hoặc OpenAI Codex. Đặt `true` để buộc bật công cụ ngoài phạm vi đó, hoặc `false` để giữ tắt ngay cả với các lần chạy GPT-5 strict-agentic.
- Khi bật, system prompt cũng thêm hướng dẫn sử dụng để model chỉ dùng công cụ này cho công việc đáng kể và giữ tối đa một bước ở trạng thái `in_progress`.

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

- `model`: model mặc định cho các sub-agent được sinh ra. Nếu bỏ qua, sub-agent kế thừa model của bên gọi.
- `allowAgents`: allowlist mặc định gồm các id agent đích cho `sessions_spawn` khi agent yêu cầu không đặt `subagents.allowAgents` riêng (`["*"]` = bất kỳ; mặc định: chỉ cùng agent).
- `runTimeoutSeconds`: thời gian chờ mặc định (giây) cho `sessions_spawn` khi lời gọi công cụ bỏ qua `runTimeoutSeconds`. `0` nghĩa là không có thời gian chờ.
- Chính sách công cụ theo từng subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Nhà cung cấp tùy chỉnh và URL cơ sở

OpenClaw dùng danh mục model tích hợp. Thêm nhà cung cấp tùy chỉnh qua `models.providers` trong cấu hình hoặc `~/.openclaw/agents/<agentId>/agent/models.json`.

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
  <Accordion title="Xác thực và thứ tự ưu tiên khi hợp nhất">
    - Dùng `authHeader: true` + `headers` cho các nhu cầu xác thực tùy chỉnh.
    - Ghi đè gốc cấu hình agent bằng `OPENCLAW_AGENT_DIR` (hoặc `PI_CODING_AGENT_DIR`, một bí danh biến môi trường cũ).
    - Thứ tự ưu tiên hợp nhất cho các ID nhà cung cấp khớp nhau:
      - Các giá trị `baseUrl` không rỗng trong `models.json` của agent được ưu tiên.
      - Các giá trị `apiKey` không rỗng trong agent chỉ được ưu tiên khi nhà cung cấp đó không do SecretRef quản lý trong ngữ cảnh cấu hình/auth-profile hiện tại.
      - Các giá trị `apiKey` của nhà cung cấp do SecretRef quản lý được làm mới từ marker nguồn (`ENV_VAR_NAME` cho tham chiếu env, `secretref-managed` cho tham chiếu file/exec) thay vì lưu trữ secret đã phân giải.
      - Các giá trị header của nhà cung cấp do SecretRef quản lý được làm mới từ marker nguồn (`secretref-env:ENV_VAR_NAME` cho tham chiếu env, `secretref-managed` cho tham chiếu file/exec).
      - `apiKey`/`baseUrl` của agent rỗng hoặc thiếu sẽ quay về `models.providers` trong cấu hình.
      - `contextWindow`/`maxTokens` của model khớp nhau dùng giá trị cao hơn giữa cấu hình rõ ràng và giá trị danh mục ngầm định.
      - `contextTokens` của model khớp nhau giữ nguyên giới hạn runtime rõ ràng khi có; dùng nó để giới hạn ngữ cảnh hiệu dụng mà không thay đổi metadata model gốc.
      - Dùng `models.mode: "replace"` khi bạn muốn cấu hình ghi lại hoàn toàn `models.json`.
      - Việc lưu marker lấy nguồn làm chuẩn: marker được ghi từ snapshot cấu hình nguồn đang hoạt động (trước phân giải), không phải từ các giá trị secret runtime đã phân giải.

  </Accordion>
</AccordionGroup>

### Chi tiết trường của nhà cung cấp

<AccordionGroup>
  <Accordion title="Danh mục cấp cao nhất">
    - `models.mode`: hành vi danh mục nhà cung cấp (`merge` hoặc `replace`).
    - `models.providers`: bản đồ nhà cung cấp tùy chỉnh, khóa theo id nhà cung cấp.
      - Chỉnh sửa an toàn: dùng `openclaw config set models.providers.<id> '<json>' --strict-json --merge` hoặc `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` cho các cập nhật bổ sung. `config set` từ chối các thay thế phá hủy trừ khi bạn truyền `--replace`.

  </Accordion>
  <Accordion title="Kết nối và xác thực nhà cung cấp">
    - `models.providers.*.api`: bộ chuyển đổi yêu cầu (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, v.v.). Với backend `/v1/chat/completions` tự host như MLX, vLLM, SGLang và hầu hết máy chủ cục bộ tương thích OpenAI, dùng `openai-completions`. Nhà cung cấp tùy chỉnh có `baseUrl` nhưng không có `api` mặc định dùng `openai-completions`; chỉ đặt `openai-responses` khi backend hỗ trợ `/v1/responses`.
    - `models.providers.*.apiKey`: thông tin xác thực nhà cung cấp (ưu tiên SecretRef/thay thế env).
    - `models.providers.*.auth`: chiến lược xác thực (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: cửa sổ ngữ cảnh gốc mặc định cho các model dưới nhà cung cấp này khi mục model không đặt `contextWindow`.
    - `models.providers.*.contextTokens`: giới hạn ngữ cảnh runtime hiệu dụng mặc định cho các model dưới nhà cung cấp này khi mục model không đặt `contextTokens`.
    - `models.providers.*.maxTokens`: giới hạn output-token mặc định cho các model dưới nhà cung cấp này khi mục model không đặt `maxTokens`.
    - `models.providers.*.timeoutSeconds`: thời gian chờ tùy chọn cho mỗi nhà cung cấp đối với yêu cầu HTTP model, tính bằng giây, bao gồm kết nối, header, body và xử lý hủy toàn bộ yêu cầu.
    - `models.providers.*.injectNumCtxForOpenAICompat`: với Ollama + `openai-completions`, chèn `options.num_ctx` vào yêu cầu (mặc định: `true`).
    - `models.providers.*.authHeader`: buộc truyền thông tin xác thực trong header `Authorization` khi cần.
    - `models.providers.*.baseUrl`: URL cơ sở của API upstream.
    - `models.providers.*.headers`: header tĩnh bổ sung cho định tuyến proxy/tenant.

  </Accordion>
  <Accordion title="Ghi đè truyền tải yêu cầu">
    `models.providers.*.request`: ghi đè truyền tải cho yêu cầu HTTP đến nhà cung cấp model.

    - `request.headers`: header bổ sung (hợp nhất với mặc định của nhà cung cấp). Giá trị chấp nhận SecretRef.
    - `request.auth`: ghi đè chiến lược xác thực. Chế độ: `"provider-default"` (dùng xác thực tích hợp của nhà cung cấp), `"authorization-bearer"` (với `token`), `"header"` (với `headerName`, `value`, tùy chọn `prefix`).
    - `request.proxy`: ghi đè HTTP proxy. Chế độ: `"env-proxy"` (dùng biến môi trường `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (với `url`). Cả hai chế độ đều chấp nhận một đối tượng con `tls` tùy chọn.
    - `request.tls`: ghi đè TLS cho kết nối trực tiếp. Trường: `ca`, `cert`, `key`, `passphrase` (tất cả chấp nhận SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: khi `true`, cho phép HTTPS đến `baseUrl` khi DNS phân giải thành private, CGNAT hoặc các dải tương tự, thông qua bộ bảo vệ fetch HTTP của nhà cung cấp (operator chọn tham gia cho các endpoint tự host tương thích OpenAI đáng tin cậy). URL stream của nhà cung cấp model qua loopback như `localhost`, `127.0.0.1` và `[::1]` được tự động cho phép trừ khi tùy chọn này được đặt rõ ràng thành `false`; máy chủ LAN, tailnet và DNS riêng vẫn cần chọn tham gia. WebSocket dùng cùng `request` cho header/TLS nhưng không dùng cổng SSRF fetch đó. Mặc định `false`.

  </Accordion>
  <Accordion title="Mục danh mục model">
    - `models.providers.*.models`: các mục danh mục model rõ ràng của nhà cung cấp.
    - `models.providers.*.models.*.input`: phương thức đầu vào của model. Dùng `["text"]` cho model chỉ văn bản và `["text", "image"]` cho model hình ảnh/vision gốc. Tệp đính kèm hình ảnh chỉ được đưa vào lượt agent khi model được chọn được đánh dấu là hỗ trợ hình ảnh.
    - `models.providers.*.models.*.contextWindow`: metadata cửa sổ ngữ cảnh gốc của model. Trường này ghi đè `contextWindow` cấp nhà cung cấp cho model đó.
    - `models.providers.*.models.*.contextTokens`: giới hạn ngữ cảnh runtime tùy chọn. Trường này ghi đè `contextTokens` cấp nhà cung cấp; dùng khi bạn muốn ngân sách ngữ cảnh hiệu dụng nhỏ hơn `contextWindow` gốc của model; `openclaw models list` hiển thị cả hai giá trị khi chúng khác nhau.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: gợi ý tương thích tùy chọn. Với `api: "openai-completions"` có `baseUrl` không rỗng và không phải gốc (host không phải `api.openai.com`), OpenClaw buộc giá trị này thành `false` ở runtime. `baseUrl` rỗng/bị bỏ qua giữ hành vi OpenAI mặc định.
    - `models.providers.*.models.*.compat.requiresStringContent`: gợi ý tương thích tùy chọn cho endpoint chat tương thích OpenAI chỉ nhận chuỗi. Khi `true`, OpenClaw làm phẳng các mảng `messages[].content` chỉ gồm văn bản thuần thành chuỗi đơn giản trước khi gửi yêu cầu.

  </Accordion>
  <Accordion title="Khám phá Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: gốc cài đặt tự động khám phá Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: bật/tắt khám phá ngầm định.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: vùng AWS để khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: bộ lọc provider-id tùy chọn cho khám phá có mục tiêu.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: khoảng thăm dò để làm mới khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: cửa sổ ngữ cảnh dự phòng cho các model được khám phá.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: số token đầu ra tối đa dự phòng cho các model được khám phá.

  </Accordion>
</AccordionGroup>

Onboarding nhà cung cấp tùy chỉnh ở chế độ tương tác suy luận đầu vào hình ảnh cho các ID model vision phổ biến như GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V và GLM-4V, đồng thời bỏ qua câu hỏi bổ sung cho các họ đã biết là chỉ văn bản. ID model không xác định vẫn sẽ hỏi về hỗ trợ hình ảnh. Onboarding không tương tác dùng cùng suy luận; truyền `--custom-image-input` để buộc metadata hỗ trợ hình ảnh hoặc `--custom-text-input` để buộc metadata chỉ văn bản.

### Ví dụ về nhà cung cấp

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin nhà cung cấp `cerebras` đi kèm có thể cấu hình phần này qua `openclaw onboard --auth-choice cerebras-api-key`. Chỉ dùng cấu hình nhà cung cấp rõ ràng khi ghi đè mặc định.

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
    Xem [Mô hình cục bộ](/vi/gateway/local-models). Tóm tắt: chạy một mô hình cục bộ lớn qua API Responses của LM Studio trên phần cứng mạnh; giữ các mô hình được lưu trữ hợp nhất để dự phòng.
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

    Đặt `MINIMAX_API_KEY`. Lối tắt: `openclaw onboard --auth-choice minimax-global-api` hoặc `openclaw onboard --auth-choice minimax-cn-api`. Danh mục mô hình mặc định chỉ dùng M2.7. Trên đường dẫn truyền phát tương thích Anthropic, OpenClaw tắt chế độ suy nghĩ của MiniMax theo mặc định trừ khi bạn tự đặt `thinking` rõ ràng. `/fast on` hoặc `params.fastMode: true` viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.

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

    Các endpoint Moonshot gốc quảng bá khả năng tương thích usage khi truyền phát trên transport `openai-completions` dùng chung, và OpenClaw xác định điều đó dựa trên năng lực của endpoint thay vì chỉ dựa vào id provider tích hợp sẵn.

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

    URL cơ sở nên bỏ `/v1` (máy khách Anthropic sẽ thêm phần đó). Lối tắt: `openclaw onboard --auth-choice synthetic-api-key`.

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
    - Với endpoint chung, hãy định nghĩa một provider tùy chỉnh với phần ghi đè URL cơ sở.

  </Accordion>
</AccordionGroup>

---

## Liên quan

- [Cấu hình — agents](/vi/gateway/config-agents)
- [Cấu hình — channels](/vi/gateway/config-channels)
- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — các khóa cấp cao nhất khác
- [Công cụ và plugins](/vi/tools)
