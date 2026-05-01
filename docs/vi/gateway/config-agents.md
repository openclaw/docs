---
read_when:
    - Tinh chỉnh các giá trị mặc định của tác tử (mô hình, suy luận, không gian làm việc, Heartbeat, phương tiện, Skills)
    - Cấu hình định tuyến và liên kết đa tác nhân
    - Điều chỉnh phiên, cách gửi tin nhắn và hành vi chế độ trò chuyện
summary: Mặc định của tác tử, định tuyến đa tác tử, phiên, tin nhắn và cấu hình trò chuyện
title: Cấu hình — tác nhân
x-i18n:
    generated_at: "2026-05-01T10:48:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 12a3c0c4a79d6753c7cebdb366e3a0272571841f3eaa0e08ded21fe54f485ca8
    source_path: gateway/config-agents.md
    workflow: 16
---

Các khóa cấu hình theo phạm vi agent trong `agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, và `talk.*`. Đối với kênh, công cụ, Gateway runtime, và các khóa
cấp cao khác, xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Mặc định của agent

### `agents.defaults.workspace`

Mặc định: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Gốc kho lưu trữ tùy chọn được hiển thị trong dòng Runtime của system prompt. Nếu chưa đặt, OpenClaw tự động phát hiện bằng cách đi ngược lên từ workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Danh sách cho phép Skills mặc định tùy chọn cho các agent không đặt
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Bỏ qua `agents.defaults.skills` để mặc định không hạn chế Skills.
- Bỏ qua `agents.list[].skills` để kế thừa mặc định.
- Đặt `agents.list[].skills: []` để không có Skills.
- Danh sách `agents.list[].skills` không rỗng là tập cuối cùng cho agent đó; nó
  không hợp nhất với mặc định.

### `agents.defaults.skipBootstrap`

Tắt việc tự động tạo các tệp bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Bỏ qua việc tạo các tệp workspace tùy chọn đã chọn trong khi vẫn ghi các tệp bootstrap bắt buộc. Giá trị hợp lệ: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, và `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

Kiểm soát thời điểm các tệp bootstrap workspace được chèn vào system prompt. Mặc định: `"always"`.

- `"continuation-skip"`: các lượt tiếp tục an toàn (sau phản hồi assistant đã hoàn tất) bỏ qua việc chèn lại bootstrap workspace, giảm kích thước prompt. Các lần chạy Heartbeat và thử lại sau Compaction vẫn xây dựng lại ngữ cảnh.
- `"never"`: tắt bootstrap workspace và việc chèn tệp ngữ cảnh ở mọi lượt. Chỉ dùng tùy chọn này cho các agent tự quản lý hoàn toàn vòng đời prompt của mình (công cụ ngữ cảnh tùy chỉnh, runtime gốc tự xây dựng ngữ cảnh riêng, hoặc quy trình chuyên biệt không cần bootstrap). Các lượt Heartbeat và khôi phục sau Compaction cũng bỏ qua việc chèn.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Số ký tự tối đa trên mỗi tệp bootstrap workspace trước khi cắt bớt. Mặc định: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tổng số ký tự tối đa được chèn trên toàn bộ các tệp bootstrap workspace. Mặc định: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kiểm soát văn bản cảnh báo hiển thị cho agent khi ngữ cảnh bootstrap bị cắt bớt.
Mặc định: `"once"`.

- `"off"`: không bao giờ chèn văn bản cảnh báo vào system prompt.
- `"once"`: chèn cảnh báo một lần cho mỗi chữ ký cắt bớt duy nhất (khuyến nghị).
- `"always"`: chèn cảnh báo ở mọi lần chạy khi có cắt bớt.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bản đồ sở hữu ngân sách ngữ cảnh

OpenClaw có nhiều ngân sách prompt/ngữ cảnh dung lượng lớn, và chúng được
cố ý tách theo phân hệ thay vì tất cả đi qua một núm điều khiển chung.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  chèn bootstrap workspace thông thường.
- `agents.defaults.startupContext.*`:
  phần mở đầu một lần cho lần chạy mô hình khi đặt lại/khởi động, bao gồm các tệp
  `memory/*.md` hằng ngày gần đây. Các lệnh chat trần `/new` và `/reset` được
  xác nhận mà không gọi mô hình.
- `skills.limits.*`:
  danh sách Skills rút gọn được chèn vào system prompt.
- `agents.defaults.contextLimits.*`:
  các trích đoạn runtime có giới hạn và các khối do runtime sở hữu được chèn.
- `memory.qmd.limits.*`:
  kích thước đoạn trích tìm kiếm bộ nhớ đã lập chỉ mục và phần chèn.

Chỉ dùng phần ghi đè theo từng agent tương ứng khi một agent cần ngân sách khác:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kiểm soát phần mở đầu khởi động lượt đầu được chèn vào các lần chạy mô hình khi đặt lại/khởi động.
Các lệnh chat trần `/new` và `/reset` xác nhận việc đặt lại mà không gọi
mô hình, nên chúng không tải phần mở đầu này.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Mặc định dùng chung cho các bề mặt ngữ cảnh runtime có giới hạn.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: giới hạn trích đoạn `memory_get` mặc định trước khi thêm
  siêu dữ liệu cắt bớt và thông báo tiếp tục.
- `memoryGetDefaultLines`: cửa sổ dòng `memory_get` mặc định khi bỏ qua `lines`.
- `toolResultMaxChars`: giới hạn kết quả công cụ trực tiếp dùng cho kết quả đã lưu và
  khôi phục khi tràn.
- `postCompactionMaxChars`: giới hạn trích đoạn AGENTS.md dùng trong quá trình chèn
  làm mới sau Compaction.

#### `agents.list[].contextLimits`

Ghi đè theo từng agent cho các núm điều khiển `contextLimits` dùng chung. Các trường bị bỏ qua kế thừa
từ `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Giới hạn toàn cục cho danh sách Skills rút gọn được chèn vào system prompt. Điều này
không ảnh hưởng đến việc đọc các tệp `SKILL.md` theo yêu cầu.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Ghi đè theo từng agent cho ngân sách prompt Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Kích thước pixel tối đa cho cạnh dài nhất của ảnh trong các khối ảnh transcript/công cụ trước khi gọi provider.
Mặc định: `1200`.

Giá trị thấp hơn thường giảm mức sử dụng vision-token và kích thước payload yêu cầu cho các lần chạy nhiều ảnh chụp màn hình.
Giá trị cao hơn giữ lại nhiều chi tiết hình ảnh hơn.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Múi giờ cho ngữ cảnh system prompt (không phải dấu thời gian tin nhắn). Quay về múi giờ của host nếu không có.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Định dạng thời gian trong system prompt. Mặc định: `auto` (tùy chọn của hệ điều hành).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Dạng chuỗi chỉ đặt mô hình chính.
  - Dạng đối tượng đặt mô hình chính cộng với các mô hình chuyển đổi dự phòng theo thứ tự.
- `imageModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được đường dẫn công cụ `image` dùng làm cấu hình mô hình thị giác.
  - Cũng được dùng làm định tuyến dự phòng khi mô hình được chọn/mặc định không thể nhận đầu vào hình ảnh.
  - Ưu tiên các tham chiếu `provider/model` rõ ràng. ID trần được chấp nhận để tương thích; nếu một ID trần khớp duy nhất với một mục đã cấu hình có khả năng xử lý hình ảnh trong `models.providers.*.models`, OpenClaw sẽ gắn nó với provider đó. Các khớp đã cấu hình không rõ ràng yêu cầu tiền tố provider rõ ràng.
- `imageGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được năng lực tạo hình ảnh dùng chung và mọi bề mặt công cụ/Plugin trong tương lai tạo hình ảnh sử dụng.
  - Giá trị thường dùng: `google/gemini-3.1-flash-image-preview` cho tạo hình ảnh Gemini gốc, `fal/fal-ai/flux/dev` cho fal, `openai/gpt-image-2` cho OpenAI Images, hoặc `openai/gpt-image-1.5` cho đầu ra OpenAI PNG/WebP có nền trong suốt.
  - Nếu bạn chọn trực tiếp một provider/model, cũng hãy cấu hình xác thực provider tương ứng (ví dụ `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` cho `google/*`, `OPENAI_API_KEY` hoặc OpenAI Codex OAuth cho `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` cho `fal/*`).
  - Nếu bị bỏ qua, `image_generate` vẫn có thể suy luận mặc định provider được hỗ trợ bằng xác thực. Nó thử provider mặc định hiện tại trước, rồi đến các provider tạo hình ảnh đã đăng ký còn lại theo thứ tự ID provider.
- `musicGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được năng lực tạo nhạc dùng chung và công cụ tích hợp sẵn `music_generate` sử dụng.
  - Giá trị thường dùng: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, hoặc `minimax/music-2.6`.
  - Nếu bị bỏ qua, `music_generate` vẫn có thể suy luận mặc định provider được hỗ trợ bằng xác thực. Nó thử provider mặc định hiện tại trước, rồi đến các provider tạo nhạc đã đăng ký còn lại theo thứ tự ID provider.
  - Nếu bạn chọn trực tiếp một provider/model, cũng hãy cấu hình khóa xác thực/API của provider tương ứng.
- `videoGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được năng lực tạo video dùng chung và công cụ tích hợp sẵn `video_generate` sử dụng.
  - Giá trị thường dùng: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, hoặc `qwen/wan2.7-r2v`.
  - Nếu bị bỏ qua, `video_generate` vẫn có thể suy luận mặc định provider được hỗ trợ bằng xác thực. Nó thử provider mặc định hiện tại trước, rồi đến các provider tạo video đã đăng ký còn lại theo thứ tự ID provider.
  - Nếu bạn chọn trực tiếp một provider/model, cũng hãy cấu hình khóa xác thực/API của provider tương ứng.
  - Provider tạo video Qwen đi kèm hỗ trợ tối đa 1 video đầu ra, 1 hình ảnh đầu vào, 4 video đầu vào, thời lượng 10 giây, và các tùy chọn cấp provider `size`, `aspectRatio`, `resolution`, `audio`, và `watermark`.
- `pdfModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được công cụ `pdf` dùng để định tuyến mô hình.
  - Nếu bị bỏ qua, công cụ PDF dự phòng sang `imageModel`, rồi sang mô hình phiên/mặc định đã phân giải.
- `pdfMaxBytesMb`: giới hạn kích thước PDF mặc định cho công cụ `pdf` khi `maxBytesMb` không được truyền tại thời điểm gọi.
- `pdfMaxPages`: số trang tối đa mặc định được chế độ dự phòng trích xuất trong công cụ `pdf` xem xét.
- `verboseDefault`: mức verbose mặc định cho agent. Giá trị: `"off"`, `"on"`, `"full"`. Mặc định: `"off"`.
- `reasoningDefault`: khả năng hiển thị reasoning mặc định cho agent. Giá trị: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` theo từng agent ghi đè mặc định này. Mặc định reasoning đã cấu hình chỉ được áp dụng cho chủ sở hữu, người gửi được ủy quyền, hoặc ngữ cảnh Gateway quản trị viên vận hành khi không đặt ghi đè reasoning theo tin nhắn hoặc phiên.
- `elevatedDefault`: mức đầu ra nâng cao mặc định cho agent. Giá trị: `"off"`, `"on"`, `"ask"`, `"full"`. Mặc định: `"on"`.
- `model.primary`: định dạng `provider/model` (ví dụ `openai/gpt-5.5` cho quyền truy cập bằng khóa API hoặc `openai-codex/gpt-5.5` cho Codex OAuth). Nếu bạn bỏ qua provider, OpenClaw thử alias trước, rồi đến một khớp provider đã cấu hình duy nhất cho đúng ID mô hình đó, và chỉ sau đó mới dự phòng về provider mặc định đã cấu hình (hành vi tương thích đã lỗi thời, vì vậy hãy ưu tiên `provider/model` rõ ràng). Nếu provider đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw dự phòng về provider/model đã cấu hình đầu tiên thay vì hiển thị mặc định provider đã bị xóa và lỗi thời.
- `models`: danh mục mô hình đã cấu hình và allowlist cho `/model`. Mỗi mục có thể bao gồm `alias` (phím tắt) và `params` (dành riêng cho provider, ví dụ `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Chỉnh sửa an toàn: dùng `openclaw config set agents.defaults.models '<json>' --strict-json --merge` để thêm mục. `config set` từ chối các thay thế có thể xóa mục allowlist hiện có trừ khi bạn truyền `--replace`.
  - Các luồng cấu hình/onboarding theo phạm vi provider hợp nhất các mô hình provider đã chọn vào bản đồ này và giữ nguyên các provider không liên quan đã được cấu hình.
  - Với các mô hình OpenAI Responses trực tiếp, Compaction phía máy chủ được bật tự động. Dùng `params.responsesServerCompaction: false` để ngừng chèn `context_management`, hoặc `params.responsesCompactThreshold` để ghi đè ngưỡng. Xem [Compaction phía máy chủ của OpenAI](/vi/providers/openai#server-side-compaction-responses-api).
- `params`: tham số provider mặc định toàn cục được áp dụng cho mọi mô hình. Đặt tại `agents.defaults.params` (ví dụ `{ cacheRetention: "long" }`).
- Thứ tự ưu tiên hợp nhất `params` (cấu hình): `agents.defaults.params` (cơ sở toàn cục) bị ghi đè bởi `agents.defaults.models["provider/model"].params` (theo từng mô hình), rồi `agents.list[].params` (khớp ID agent) ghi đè theo khóa. Xem [Prompt Caching](/vi/reference/prompt-caching) để biết chi tiết.
- `params.extra_body`/`params.extraBody`: JSON truyền qua nâng cao được hợp nhất vào thân yêu cầu `api: "openai-completions"` cho proxy tương thích OpenAI. Nếu nó xung đột với các khóa yêu cầu được tạo, phần thân bổ sung sẽ thắng; các tuyến completions không gốc vẫn loại bỏ `store` chỉ dành cho OpenAI sau đó.
- `params.chat_template_kwargs`: đối số chat-template tương thích vLLM/OpenAI được hợp nhất vào thân yêu cầu `api: "openai-completions"` cấp cao nhất. Với `vllm/nemotron-3-*` khi tắt thinking, Plugin vLLM đi kèm tự động gửi `enable_thinking: false` và `force_nonempty_content: true`; `chat_template_kwargs` rõ ràng ghi đè các mặc định được tạo, và `extra_body.chat_template_kwargs` vẫn có quyền ưu tiên cuối cùng. Với các điều khiển thinking của vLLM Qwen, đặt `params.qwenThinkingFormat` thành `"chat-template"` hoặc `"top-level"` trên mục mô hình đó.
- `compat.supportedReasoningEfforts`: danh sách mức nỗ lực reasoning tương thích OpenAI theo từng mô hình. Bao gồm `"xhigh"` cho các endpoint tùy chỉnh thật sự chấp nhận nó; khi đó OpenClaw hiển thị `/think xhigh` trong menu lệnh, hàng phiên Gateway, xác thực bản vá phiên, xác thực CLI agent, và xác thực `llm-task` cho provider/model đã cấu hình đó. Dùng `compat.reasoningEffortMap` khi backend cần một giá trị riêng theo provider cho một mức chuẩn.
- `params.preserveThinking`: tùy chọn chỉ dành cho Z.AI để giữ nguyên thinking. Khi được bật và thinking đang bật, OpenClaw gửi `thinking.clear_thinking: false` và phát lại `reasoning_content` trước đó; xem [thinking và thinking được giữ nguyên của Z.AI](/vi/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: chính sách runtime agent cấp thấp mặc định. ID bị bỏ qua mặc định là OpenClaw Pi. Dùng `id: "pi"` để buộc harness PI tích hợp sẵn, `id: "auto"` để cho các harness Plugin đã đăng ký nhận các mô hình được hỗ trợ, một ID harness đã đăng ký như `id: "codex"`, hoặc một alias backend CLI được hỗ trợ như `id: "claude-cli"`. Đặt `fallback: "none"` để tắt dự phòng PI tự động. Các runtime Plugin rõ ràng như `codex` mặc định đóng khi lỗi trừ khi bạn đặt `fallback: "pi"` trong cùng phạm vi ghi đè. Giữ tham chiếu mô hình chuẩn là `provider/model`; chọn Codex, Claude CLI, Gemini CLI, và các backend thực thi khác thông qua cấu hình runtime thay vì tiền tố provider runtime cũ. Xem [runtime agent](/vi/concepts/agent-runtimes) để biết điều này khác với lựa chọn provider/model như thế nào.
- Các trình ghi cấu hình thay đổi các trường này (ví dụ `/models set`, `/models set-image`, và các lệnh thêm/xóa dự phòng) lưu dạng đối tượng chuẩn và giữ nguyên danh sách dự phòng hiện có khi có thể.
- `maxConcurrent`: số lượt chạy agent song song tối đa trên các phiên (mỗi phiên vẫn được tuần tự hóa). Mặc định: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` kiểm soát trình thực thi cấp thấp nào chạy các lượt agent. Hầu hết
triển khai nên giữ runtime OpenClaw Pi mặc định. Dùng nó khi một Plugin đáng tin cậy
cung cấp harness gốc, chẳng hạn harness app-server Codex đi kèm,
hoặc khi bạn muốn một backend CLI được hỗ trợ như Claude CLI. Để nắm mô hình
tư duy, xem [runtime agent](/vi/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, ID harness Plugin đã đăng ký, hoặc alias backend CLI được hỗ trợ. Plugin Codex đi kèm đăng ký `codex`; Plugin Anthropic đi kèm cung cấp backend CLI `claude-cli`.
- `fallback`: `"pi"` hoặc `"none"`. Trong `id: "auto"`, fallback bị bỏ qua mặc định là `"pi"` để cấu hình cũ có thể tiếp tục dùng PI khi không có harness Plugin nào nhận một lượt chạy. Trong chế độ runtime Plugin rõ ràng, chẳng hạn `id: "codex"`, fallback bị bỏ qua mặc định là `"none"` để harness bị thiếu sẽ lỗi thay vì âm thầm dùng PI. Ghi đè runtime không kế thừa fallback từ phạm vi rộng hơn; đặt `fallback: "pi"` cùng với runtime rõ ràng khi bạn chủ ý muốn dự phòng tương thích đó. Lỗi của harness Plugin đã chọn luôn được hiển thị trực tiếp.
- Ghi đè môi trường: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` ghi đè `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` ghi đè fallback cho tiến trình đó.
- Với các triển khai chỉ dùng Codex, đặt `model: "openai/gpt-5.5"` và `agentRuntime.id: "codex"`. Bạn cũng có thể đặt rõ `agentRuntime.fallback: "none"` để dễ đọc; đây là mặc định cho các runtime Plugin rõ ràng.
- Với các triển khai Claude CLI, ưu tiên `model: "anthropic/claude-opus-4-7"` cộng với `agentRuntime.id: "claude-cli"`. Các tham chiếu mô hình cũ `claude-cli/claude-opus-4-7` vẫn hoạt động để tương thích, nhưng cấu hình mới nên giữ lựa chọn provider/model theo chuẩn và đặt backend thực thi trong `agentRuntime.id`.
- Các khóa chính sách runtime cũ hơn được `openclaw doctor --fix` viết lại thành `agentRuntime`.
- Lựa chọn harness được ghim theo ID phiên sau lượt chạy nhúng đầu tiên. Thay đổi cấu hình/env ảnh hưởng đến phiên mới hoặc phiên được đặt lại, không ảnh hưởng đến bản ghi hội thoại hiện có. Các phiên cũ có lịch sử bản ghi nhưng không có ghim được ghi nhận được xem là đã ghim PI. `/status` báo cáo runtime hiệu dụng, ví dụ `Runtime: OpenClaw Pi Default` hoặc `Runtime: OpenAI Codex`.
- Điều này chỉ kiểm soát thực thi lượt agent văn bản. Tạo phương tiện, thị giác, PDF, nhạc, video, và TTS vẫn dùng các thiết lập provider/model của chúng.

**Viết tắt alias tích hợp sẵn** (chỉ áp dụng khi mô hình nằm trong `agents.defaults.models`):

| Bí danh             | Mô hình                                    |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` hoặc `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Các bí danh bạn đã cấu hình luôn được ưu tiên hơn giá trị mặc định.

Các mô hình Z.AI GLM-4.x tự động bật chế độ suy luận trừ khi bạn đặt `--thinking off` hoặc tự định nghĩa `agents.defaults.models["zai/<model>"].params.thinking`.
Các mô hình Z.AI bật `tool_stream` theo mặc định để truyền phát lệnh gọi công cụ. Đặt `agents.defaults.models["zai/<model>"].params.tool_stream` thành `false` để tắt tính năng này.
Các mô hình Anthropic Claude 4.6 mặc định dùng suy luận `adaptive` khi không đặt mức suy luận rõ ràng.

### `agents.defaults.cliBackends`

Các backend CLI tùy chọn cho những lần chạy dự phòng chỉ dùng văn bản (không có lệnh gọi công cụ). Hữu ích làm phương án dự phòng khi nhà cung cấp API bị lỗi.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Các backend CLI ưu tiên văn bản; công cụ luôn bị tắt.
- Hỗ trợ phiên khi `sessionArg` được đặt.
- Hỗ trợ truyền qua hình ảnh khi `imageArg` chấp nhận đường dẫn tệp.

### `agents.defaults.systemPromptOverride`

Thay thế toàn bộ system prompt do OpenClaw lắp ráp bằng một chuỗi cố định. Đặt ở cấp mặc định (`agents.defaults.systemPromptOverride`) hoặc theo từng agent (`agents.list[].systemPromptOverride`). Giá trị theo agent được ưu tiên; giá trị rỗng hoặc chỉ gồm khoảng trắng sẽ bị bỏ qua. Hữu ích cho các thử nghiệm prompt có kiểm soát.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Các lớp phủ prompt độc lập với nhà cung cấp, được áp dụng theo họ mô hình. ID mô hình thuộc họ GPT-5 nhận hợp đồng hành vi dùng chung trên các nhà cung cấp; `personality` chỉ kiểm soát lớp phong cách tương tác thân thiện.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (mặc định) và `"on"` bật lớp phong cách tương tác thân thiện.
- `"off"` chỉ tắt lớp thân thiện; hợp đồng hành vi GPT-5 được gắn thẻ vẫn được bật.
- `plugins.entries.openai.config.personality` cũ vẫn được đọc khi cài đặt dùng chung này chưa được đặt.

### `agents.defaults.heartbeat`

Các lần chạy Heartbeat định kỳ.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: chuỗi thời lượng (ms/s/m/h). Mặc định: `30m` (xác thực bằng khóa API) hoặc `1h` (xác thực OAuth). Đặt thành `0m` để tắt.
- `includeSystemPromptSection`: khi là false, bỏ qua phần Heartbeat khỏi system prompt và bỏ qua việc chèn `HEARTBEAT.md` vào ngữ cảnh bootstrap. Mặc định: `true`.
- `suppressToolErrorWarnings`: khi là true, ẩn các payload cảnh báo lỗi công cụ trong các lần chạy Heartbeat.
- `timeoutSeconds`: thời gian tối đa tính bằng giây cho phép một lượt agent Heartbeat chạy trước khi bị hủy. Để trống để dùng `agents.defaults.timeoutSeconds`.
- `directPolicy`: chính sách gửi trực tiếp/DM. `allow` (mặc định) cho phép gửi đến mục tiêu trực tiếp. `block` chặn gửi đến mục tiêu trực tiếp và phát ra `reason=dm-blocked`.
- `lightContext`: khi là true, các lần chạy Heartbeat dùng ngữ cảnh bootstrap nhẹ và chỉ giữ `HEARTBEAT.md` từ các tệp bootstrap của workspace.
- `isolatedSession`: khi là true, mỗi Heartbeat chạy trong một phiên mới không có lịch sử hội thoại trước đó. Cùng mẫu cô lập như cron `sessionTarget: "isolated"`. Giảm chi phí token cho mỗi Heartbeat từ khoảng 100K xuống khoảng 2-5K token.
- `skipWhenBusy`: khi là true, các lần chạy Heartbeat sẽ trì hoãn trên các luồng bận bổ sung: công việc subagent hoặc lệnh lồng nhau. Các luồng Cron luôn trì hoãn Heartbeat, ngay cả khi không có cờ này.
- Theo agent: đặt `agents.list[].heartbeat`. Khi bất kỳ agent nào định nghĩa `heartbeat`, **chỉ các agent đó** chạy Heartbeat.
- Heartbeat chạy các lượt agent đầy đủ — khoảng thời gian ngắn hơn sẽ tiêu tốn nhiều token hơn.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` hoặc `safeguard` (tóm tắt theo đoạn cho lịch sử dài). Xem [Compaction](/vi/concepts/compaction).
- `provider`: ID của một Plugin nhà cung cấp Compaction đã đăng ký. Khi được đặt, `summarize()` của nhà cung cấp được gọi thay cho tóm tắt LLM tích hợp. Khi lỗi, sẽ quay về cơ chế tích hợp. Đặt một nhà cung cấp sẽ buộc `mode: "safeguard"`. Xem [Compaction](/vi/concepts/compaction).
- `timeoutSeconds`: số giây tối đa cho phép một thao tác Compaction đơn lẻ chạy trước khi OpenClaw hủy. Mặc định: `900`.
- `keepRecentTokens`: ngân sách điểm cắt Pi để giữ nguyên văn phần đuôi bản ghi gần nhất. `/compact` thủ công tuân theo giá trị này khi được đặt rõ ràng; nếu không, Compaction thủ công là một điểm checkpoint cứng.
- `identifierPolicy`: `strict` (mặc định), `off`, hoặc `custom`. `strict` thêm hướng dẫn tích hợp về giữ lại định danh mờ ở đầu trong quá trình tóm tắt Compaction.
- `identifierInstructions`: văn bản tùy chỉnh tùy chọn về bảo toàn định danh, dùng khi `identifierPolicy=custom`.
- `qualityGuard`: các kiểm tra thử lại khi đầu ra không đúng định dạng cho các bản tóm tắt safeguard. Được bật theo mặc định trong chế độ safeguard; đặt `enabled: false` để bỏ qua kiểm tra.
- `midTurnPrecheck`: kiểm tra áp lực vòng lặp công cụ Pi tùy chọn. Khi `enabled: true`, OpenClaw kiểm tra áp lực ngữ cảnh sau khi kết quả công cụ được thêm vào và trước lệnh gọi mô hình tiếp theo. Nếu ngữ cảnh không còn vừa, OpenClaw hủy lần thử hiện tại trước khi gửi prompt và tái sử dụng đường dẫn khôi phục precheck hiện có để cắt ngắn kết quả công cụ hoặc Compaction rồi thử lại. Hoạt động với cả hai chế độ Compaction `default` và `safeguard`. Mặc định: tắt.
- `postCompactionSections`: tên các phần H2/H3 trong AGENTS.md tùy chọn để chèn lại sau Compaction. Mặc định là `["Session Startup", "Red Lines"]`; đặt `[]` để tắt chèn lại. Khi chưa đặt hoặc được đặt rõ ràng thành cặp mặc định đó, các tiêu đề `Every Session`/`Safety` cũ hơn cũng được chấp nhận làm dự phòng kế thừa.
- `model`: ghi đè `provider/model-id` tùy chọn chỉ cho tóm tắt Compaction. Dùng tùy chọn này khi phiên chính cần giữ một mô hình nhưng bản tóm tắt Compaction cần chạy trên mô hình khác; khi chưa đặt, Compaction dùng mô hình chính của phiên.
- `maxActiveTranscriptBytes`: ngưỡng byte tùy chọn (`number` hoặc chuỗi như `"20mb"`) kích hoạt Compaction cục bộ thông thường trước một lần chạy khi JSONL đang hoạt động vượt quá ngưỡng. Yêu cầu `truncateAfterCompaction` để Compaction thành công có thể xoay sang bản ghi kế tiếp nhỏ hơn. Tắt khi chưa đặt hoặc bằng `0`.
- `notifyUser`: khi là `true`, gửi thông báo ngắn cho người dùng khi Compaction bắt đầu và khi hoàn tất (ví dụ: "Compacting context..." và "Compaction complete"). Tắt theo mặc định để giữ Compaction im lặng.
- `memoryFlush`: lượt agentic im lặng trước auto-compaction để lưu trữ ký ức bền vững. Đặt `model` thành một provider/model chính xác như `ollama/qwen3:8b` khi lượt dọn dẹp này cần ở trên mô hình cục bộ; ghi đè này không kế thừa chuỗi dự phòng của phiên đang hoạt động. Bỏ qua khi workspace ở chế độ chỉ đọc.

### `agents.defaults.contextPruning`

Cắt tỉa **kết quả công cụ cũ** khỏi ngữ cảnh trong bộ nhớ trước khi gửi đến LLM. **Không** sửa đổi lịch sử phiên trên đĩa.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="hành vi chế độ cache-ttl">

- `mode: "cache-ttl"` bật các lượt cắt tỉa.
- `ttl` kiểm soát tần suất cắt tỉa có thể chạy lại (sau lần chạm cache gần nhất).
- Việc cắt tỉa trước tiên soft-trim các kết quả công cụ quá lớn, rồi hard-clear các kết quả công cụ cũ hơn nếu cần.

**Soft-trim** giữ phần đầu + phần cuối và chèn `...` vào giữa.

**Hard-clear** thay thế toàn bộ kết quả công cụ bằng placeholder.

Ghi chú:

- Các khối hình ảnh không bao giờ bị cắt ngắn/xóa.
- Tỷ lệ dựa trên ký tự (xấp xỉ), không phải số token chính xác.
- Nếu có ít hơn `keepLastAssistants` thông điệp assistant, việc cắt tỉa sẽ bị bỏ qua.

</Accordion>

Xem [Cắt tỉa phiên](/vi/concepts/session-pruning) để biết chi tiết hành vi.

### Phát trực tuyến khối

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Các kênh không phải Telegram yêu cầu đặt rõ `*.blockStreaming: true` để bật trả lời theo khối.
- Ghi đè theo kênh: `channels.<channel>.blockStreamingCoalesce` (và các biến thể theo từng tài khoản). Signal/Slack/Discord/Google Chat mặc định `minChars: 1500`.
- `humanDelay`: khoảng tạm dừng ngẫu nhiên giữa các trả lời theo khối. `natural` = 800–2500ms. Ghi đè theo từng agent: `agents.list[].humanDelay`.

Xem [Truyền phát](/vi/concepts/streaming) để biết chi tiết về hành vi và chia đoạn.

### Chỉ báo đang nhập

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Mặc định: `instant` cho trò chuyện trực tiếp/nhắc đến, `message` cho trò chuyện nhóm không nhắc đến.
- Ghi đè theo phiên: `session.typingMode`, `session.typingIntervalSeconds`.

Xem [Chỉ báo đang nhập](/vi/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Cô lập sandbox tùy chọn cho agent nhúng. Xem [Cô lập sandbox](/vi/gateway/sandboxing) để đọc hướng dẫn đầy đủ.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox details">

**Backend:**

- `docker`: runtime Docker cục bộ (mặc định)
- `ssh`: runtime từ xa chung dựa trên SSH
- `openshell`: runtime OpenShell

Khi chọn `backend: "openshell"`, các thiết lập dành riêng cho runtime chuyển sang
`plugins.entries.openshell.config`.

**Cấu hình backend SSH:**

- `target`: đích SSH ở dạng `user@host[:port]`
- `command`: lệnh máy khách SSH (mặc định: `ssh`)
- `workspaceRoot`: thư mục gốc từ xa tuyệt đối dùng cho workspace theo từng phạm vi
- `identityFile` / `certificateFile` / `knownHostsFile`: các tệp cục bộ hiện có được truyền cho OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: nội dung nội tuyến hoặc SecretRef mà OpenClaw hiện thực hóa thành tệp tạm thời khi chạy
- `strictHostKeyChecking` / `updateHostKeys`: các nút chỉnh chính sách host-key của OpenSSH

**Thứ tự ưu tiên xác thực SSH:**

- `identityData` được ưu tiên hơn `identityFile`
- `certificateData` được ưu tiên hơn `certificateFile`
- `knownHostsData` được ưu tiên hơn `knownHostsFile`
- Các giá trị `*Data` dựa trên SecretRef được phân giải từ ảnh chụp runtime bí mật đang hoạt động trước khi phiên sandbox bắt đầu

**Hành vi backend SSH:**

- khởi tạo workspace từ xa một lần sau khi tạo hoặc tạo lại
- sau đó giữ workspace SSH từ xa làm bản chuẩn
- định tuyến `exec`, công cụ tệp và đường dẫn phương tiện qua SSH
- không tự động đồng bộ thay đổi từ xa trở lại host
- không hỗ trợ container trình duyệt sandbox

**Quyền truy cập workspace:**

- `none`: workspace sandbox theo từng phạm vi dưới `~/.openclaw/sandboxes`
- `ro`: workspace sandbox tại `/workspace`, workspace agent được mount chỉ đọc tại `/agent`
- `rw`: workspace agent được mount đọc/ghi tại `/workspace`

**Phạm vi:**

- `session`: container + workspace theo từng phiên
- `agent`: một container + workspace cho mỗi agent (mặc định)
- `shared`: container và workspace dùng chung (không cô lập giữa các phiên)

**Cấu hình Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Chế độ OpenShell:**

- `mirror`: khởi tạo từ xa từ cục bộ trước khi exec, đồng bộ ngược lại sau khi exec; workspace cục bộ vẫn là bản chuẩn
- `remote`: khởi tạo từ xa một lần khi sandbox được tạo, sau đó giữ workspace từ xa làm bản chuẩn

Ở chế độ `remote`, các chỉnh sửa cục bộ trên host được thực hiện bên ngoài OpenClaw sẽ không tự động được đồng bộ vào sandbox sau bước khởi tạo.
Transport là SSH vào sandbox OpenShell, nhưng Plugin sở hữu vòng đời sandbox và đồng bộ mirror tùy chọn.

**`setupCommand`** chạy một lần sau khi tạo container (qua `sh -lc`). Cần mạng đi ra, root có thể ghi, người dùng root.

**Container mặc định là `network: "none"`** — đặt thành `"bridge"` (hoặc một mạng bridge tùy chỉnh) nếu agent cần quyền truy cập ra ngoài.
`"host"` bị chặn. `"container:<id>"` bị chặn theo mặc định trừ khi bạn đặt rõ
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (phá kính khẩn cấp).

**Tệp đính kèm đầu vào** được đưa vào `media/inbound/*` trong workspace đang hoạt động.

**`docker.binds`** mount thêm các thư mục host; binds toàn cục và theo từng agent được hợp nhất.

**Trình duyệt sandbox** (`sandbox.browser.enabled`): Chromium + CDP trong container. URL noVNC được chèn vào prompt hệ thống. Không yêu cầu `browser.enabled` trong `openclaw.json`.
Quyền truy cập quan sát noVNC dùng xác thực VNC theo mặc định và OpenClaw phát hành một URL token ngắn hạn (thay vì để lộ mật khẩu trong URL dùng chung).

- `allowHostControl: false` (mặc định) chặn các phiên sandbox nhắm tới trình duyệt host.
- `network` mặc định là `openclaw-sandbox-browser` (mạng bridge chuyên dụng). Chỉ đặt thành `bridge` khi bạn rõ ràng muốn kết nối bridge toàn cục.
- `cdpSourceRange` tùy chọn giới hạn đầu vào CDP ở mép container theo một dải CIDR (ví dụ `172.21.0.1/32`).
- `sandbox.browser.binds` chỉ mount thêm các thư mục host vào container trình duyệt sandbox. Khi được đặt (bao gồm `[]`), nó thay thế `docker.binds` cho container trình duyệt.
- Mặc định khởi chạy được định nghĩa trong `scripts/sandbox-browser-entrypoint.sh` và được tinh chỉnh cho host container:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (được bật mặc định)
  - `--disable-3d-apis`, `--disable-software-rasterizer` và `--disable-gpu` được
    bật mặc định và có thể tắt bằng
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu việc dùng WebGL/3D yêu cầu.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` bật lại tiện ích mở rộng nếu workflow của bạn
    phụ thuộc vào chúng.
  - `--renderer-process-limit=2` có thể thay đổi bằng
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; đặt `0` để dùng giới hạn quy trình
    mặc định của Chromium.
  - cộng thêm `--no-sandbox` khi `noSandbox` được bật.
  - Mặc định là baseline của image container; dùng image trình duyệt tùy chỉnh với
    entrypoint tùy chỉnh để thay đổi mặc định container.

</Accordion>

Cô lập sandbox trình duyệt và `sandbox.docker.binds` chỉ dành cho Docker.

Xây dựng image:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (ghi đè theo từng agent)

Dùng `agents.list[].tts` để cấp cho agent nhà cung cấp TTS, giọng, mô hình,
phong cách hoặc chế độ tự động TTS riêng. Khối agent được deep-merge lên trên
`messages.tts` toàn cục, nên thông tin xác thực dùng chung có thể nằm ở một nơi trong khi từng
agent chỉ ghi đè các trường giọng hoặc nhà cung cấp mà chúng cần. Ghi đè của agent đang hoạt động
áp dụng cho trả lời nói tự động, `/tts audio`, `/tts status` và
công cụ agent `tts`. Xem [Chuyển văn bản thành giọng nói](/vi/tools/tts#per-agent-voice-overrides)
để biết ví dụ nhà cung cấp và thứ tự ưu tiên.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: id tác tử ổn định (bắt buộc).
- `default`: khi đặt nhiều mục, mục đầu tiên sẽ thắng (ghi cảnh báo vào nhật ký). Nếu không đặt mục nào, mục đầu tiên trong danh sách là mặc định.
- `model`: dạng chuỗi đặt một mô hình chính nghiêm ngặt theo tác tử và không có phương án dự phòng mô hình; dạng đối tượng `{ primary }` cũng nghiêm ngặt trừ khi bạn thêm `fallbacks`. Dùng `{ primary, fallbacks: [...] }` để cho tác tử đó dùng dự phòng, hoặc `{ primary, fallbacks: [] }` để thể hiện rõ hành vi nghiêm ngặt. Các công việc Cron chỉ ghi đè `primary` vẫn kế thừa các phương án dự phòng mặc định trừ khi bạn đặt `fallbacks: []`.
- `params`: tham số luồng theo tác tử được hợp nhất lên trên mục mô hình đã chọn trong `agents.defaults.models`. Dùng mục này cho các ghi đè riêng theo tác tử như `cacheRetention`, `temperature` hoặc `maxTokens` mà không cần sao chép toàn bộ danh mục mô hình.
- `tts`: ghi đè chuyển văn bản thành giọng nói tùy chọn theo tác tử. Khối này hợp nhất sâu lên trên `messages.tts`, vì vậy hãy giữ thông tin xác thực nhà cung cấp dùng chung và chính sách dự phòng trong `messages.tts`, rồi chỉ đặt các giá trị riêng theo chân dung như nhà cung cấp, giọng, mô hình, phong cách hoặc chế độ tự động tại đây.
- `skills`: danh sách cho phép kỹ năng tùy chọn theo tác tử. Nếu bỏ qua, tác tử kế thừa `agents.defaults.skills` khi được đặt; một danh sách tường minh thay thế mặc định thay vì hợp nhất, và `[]` nghĩa là không có Skills.
- `thinkingDefault`: cấp độ suy nghĩ mặc định tùy chọn theo tác tử (`off | minimal | low | medium | high | xhigh | adaptive | max`). Ghi đè `agents.defaults.thinkingDefault` cho tác tử này khi không đặt ghi đè theo tin nhắn hoặc phiên. Hồ sơ nhà cung cấp/mô hình đã chọn kiểm soát các giá trị hợp lệ; với Google Gemini, `adaptive` giữ suy nghĩ động do nhà cung cấp sở hữu (`thinkingLevel` bị bỏ qua trên Gemini 3/3.1, `thinkingBudget: -1` trên Gemini 2.5).
- `reasoningDefault`: mức hiển thị suy luận mặc định tùy chọn theo tác tử (`on | off | stream`). Ghi đè `agents.defaults.reasoningDefault` cho tác tử này khi không đặt ghi đè suy luận theo tin nhắn hoặc phiên.
- `fastModeDefault`: mặc định tùy chọn theo tác tử cho chế độ nhanh (`true | false`). Áp dụng khi không đặt ghi đè chế độ nhanh theo tin nhắn hoặc phiên.
- `agentRuntime`: ghi đè tùy chọn theo tác tử cho chính sách runtime cấp thấp. Dùng `{ id: "codex" }` để biến một tác tử chỉ dùng Codex trong khi các tác tử khác giữ phương án dự phòng Pi mặc định ở chế độ `auto`.
- `runtime`: mô tả runtime tùy chọn theo tác tử. Dùng `type: "acp"` với mặc định `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) khi tác tử nên mặc định dùng các phiên harness ACP.
- `identity.avatar`: đường dẫn tương đối với workspace, URL `http(s)` hoặc URI `data:`.
- `identity` suy ra các giá trị mặc định: `ackReaction` từ `emoji`, `mentionPatterns` từ `name`/`emoji`.
- `subagents.allowAgents`: danh sách cho phép các id tác tử cho mục tiêu `sessions_spawn.agentId` tường minh (`["*"]` = bất kỳ; mặc định: chỉ cùng tác tử). Bao gồm id của bên yêu cầu khi các lệnh gọi `agentId` tự nhắm mục tiêu nên được cho phép.
- Rào bảo vệ kế thừa sandbox: nếu phiên của bên yêu cầu đang ở trong sandbox, `sessions_spawn` sẽ từ chối các mục tiêu chạy không có sandbox.
- `subagents.requireAgentId`: khi là true, chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ tường minh; mặc định: false).

---

## Định tuyến đa tác tử

Chạy nhiều tác tử cô lập bên trong một Gateway. Xem [Đa tác tử](/vi/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Trường khớp liên kết

- `type` (tùy chọn): `route` cho định tuyến thông thường (thiếu type sẽ mặc định là route), `acp` cho các liên kết cuộc trò chuyện ACP liên tục.
- `match.channel` (bắt buộc)
- `match.accountId` (tùy chọn; `*` = bất kỳ tài khoản nào; bỏ qua = tài khoản mặc định)
- `match.peer` (tùy chọn; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (tùy chọn; dành riêng cho kênh)
- `acp` (tùy chọn; chỉ dành cho `type: "acp"`): `{ mode, label, cwd, backend }`

**Thứ tự khớp xác định:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (chính xác, không có peer/guild/team)
5. `match.accountId: "*"` (toàn kênh)
6. Tác tử mặc định

Trong mỗi tầng, mục `bindings` khớp đầu tiên sẽ thắng.

Với các mục `type: "acp"`, OpenClaw phân giải theo danh tính cuộc trò chuyện chính xác (`match.channel` + tài khoản + `match.peer.id`) và không dùng thứ tự tầng liên kết định tuyến ở trên.

### Hồ sơ truy cập theo tác tử

<Accordion title="Full access (no sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Read-only tools + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="No filesystem access (messaging only)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Xem [Sandbox & công cụ đa tác tử](/vi/tools/multi-agent-sandbox-tools) để biết chi tiết về thứ tự ưu tiên.

---

## Phiên

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Session field details">

- **`scope`**: chiến lược nhóm phiên cơ sở cho ngữ cảnh trò chuyện nhóm.
  - `per-sender` (mặc định): mỗi người gửi có một phiên biệt lập trong một ngữ cảnh kênh.
  - `global`: tất cả người tham gia trong một ngữ cảnh kênh dùng chung một phiên duy nhất (chỉ dùng khi có chủ đích dùng chung ngữ cảnh).
- **`dmScope`**: cách nhóm DM.
  - `main`: tất cả DM dùng chung phiên chính.
  - `per-peer`: tách biệt theo id người gửi trên các kênh.
  - `per-channel-peer`: tách biệt theo kênh + người gửi (được khuyến nghị cho hộp thư đến nhiều người dùng).
  - `per-account-channel-peer`: tách biệt theo tài khoản + kênh + người gửi (được khuyến nghị cho nhiều tài khoản).
- **`identityLinks`**: ánh xạ các id chuẩn tắc tới các peer có tiền tố nhà cung cấp để chia sẻ phiên giữa các kênh. Các lệnh ghép nối như `/dock_discord` dùng cùng ánh xạ này để chuyển tuyến trả lời của phiên đang hoạt động sang một peer kênh đã liên kết khác; xem [Ghép nối kênh](/vi/concepts/channel-docking).
- **`reset`**: chính sách đặt lại chính. `daily` đặt lại vào giờ địa phương `atHour`; `idle` đặt lại sau `idleMinutes`. Khi cấu hình cả hai, điều kiện nào hết hạn trước sẽ thắng. Độ mới của đặt lại hằng ngày dùng `sessionStartedAt` của hàng phiên; độ mới của đặt lại khi rảnh dùng `lastInteractionAt`. Các lần ghi nền/sự kiện hệ thống như Heartbeat, đánh thức Cron, thông báo thực thi và sổ sách Gateway có thể cập nhật `updatedAt`, nhưng chúng không giữ cho các phiên hằng ngày/khi rảnh còn mới.
- **`resetByType`**: ghi đè theo từng loại (`direct`, `group`, `thread`). `dm` kế thừa được chấp nhận làm bí danh cho `direct`.
- **`parentForkMaxTokens`**: `totalTokens` tối đa của phiên cha được cho phép khi tạo phiên luồng được fork (mặc định `100000`).
  - Nếu `totalTokens` của phiên cha cao hơn giá trị này, OpenClaw sẽ bắt đầu một phiên luồng mới thay vì kế thừa lịch sử bản ghi hội thoại của phiên cha.
  - Đặt `0` để tắt cơ chế bảo vệ này và luôn cho phép fork từ phiên cha.
- **`mainKey`**: trường kế thừa. Runtime luôn dùng `"main"` cho nhóm trò chuyện trực tiếp chính.
- **`agentToAgent.maxPingPongTurns`**: số lượt trả lời qua lại tối đa giữa các tác nhân trong các trao đổi tác nhân-với-tác nhân (số nguyên, phạm vi: `0`–`5`). `0` tắt chuỗi ping-pong.
- **`sendPolicy`**: khớp theo `channel`, `chatType` (`direct|group|channel`, với bí danh kế thừa `dm`), `keyPrefix`, hoặc `rawKeyPrefix`. Lệnh từ chối đầu tiên sẽ thắng.
- **`maintenance`**: điều khiển dọn dẹp kho phiên + lưu giữ.
  - `mode`: `warn` chỉ phát cảnh báo; `enforce` áp dụng dọn dẹp.
  - `pruneAfter`: ngưỡng tuổi cho các mục cũ (mặc định `30d`).
  - `maxEntries`: số mục tối đa trong `sessions.json` (mặc định `500`). Runtime ghi dọn dẹp theo lô với một vùng đệm mực nước cao nhỏ cho các giới hạn cỡ sản xuất; `openclaw sessions cleanup --enforce` áp dụng giới hạn ngay lập tức.
  - `rotateBytes`: đã ngừng dùng và bị bỏ qua; `openclaw doctor --fix` xóa nó khỏi các cấu hình cũ.
  - `resetArchiveRetention`: thời gian lưu giữ cho kho lưu trữ bản ghi hội thoại `*.reset.<timestamp>`. Mặc định là `pruneAfter`; đặt `false` để tắt.
  - `maxDiskBytes`: ngân sách đĩa tùy chọn cho thư mục phiên. Ở chế độ `warn`, nó ghi cảnh báo; ở chế độ `enforce`, nó xóa các tạo tác/phiên cũ nhất trước.
  - `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp theo ngân sách. Mặc định là `80%` của `maxDiskBytes`.
- **`threadBindings`**: mặc định toàn cục cho các tính năng phiên gắn với luồng.
  - `enabled`: công tắc mặc định chính (nhà cung cấp có thể ghi đè; Discord dùng `channels.discord.threadBindings.enabled`)
  - `idleHours`: tự động bỏ tập trung theo mặc định sau khi không hoạt động, tính bằng giờ (`0` tắt; nhà cung cấp có thể ghi đè)
  - `maxAgeHours`: tuổi tối đa cứng theo mặc định, tính bằng giờ (`0` tắt; nhà cung cấp có thể ghi đè)

</Accordion>

---

## Tin nhắn

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Tiền tố phản hồi

Ghi đè theo kênh/tài khoản: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Phân giải (mục cụ thể nhất thắng): tài khoản → kênh → toàn cục. `""` tắt và dừng chuỗi kế thừa. `"auto"` suy ra `[{identity.name}]`.

**Biến mẫu:**

| Biến              | Mô tả                   | Ví dụ                       |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Tên mô hình ngắn        | `claude-opus-4-6`           |
| `{modelFull}`     | Mã định danh mô hình đầy đủ | `anthropic/claude-opus-4-6` |
| `{provider}`      | Tên nhà cung cấp        | `anthropic`                 |
| `{thinkingLevel}` | Mức suy nghĩ hiện tại   | `high`, `low`, `off`        |
| `{identity.name}` | Tên định danh tác nhân  | (giống như `"auto"`)        |

Biến không phân biệt chữ hoa chữ thường. `{think}` là bí danh cho `{thinkingLevel}`.

### Phản ứng xác nhận

- Mặc định là `identity.emoji` của tác nhân đang hoạt động, nếu không thì `"👀"`. Đặt `""` để tắt.
- Ghi đè theo kênh: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Thứ tự phân giải: tài khoản → kênh → `messages.ackReaction` → dự phòng theo danh tính.
- Phạm vi: `group-mentions` (mặc định), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: xóa phản ứng xác nhận sau khi trả lời trên các kênh có hỗ trợ phản ứng như Slack, Discord, Telegram, WhatsApp và BlueBubbles.
- `messages.statusReactions.enabled`: bật phản ứng trạng thái vòng đời trên Slack, Discord và Telegram.
  Trên Slack và Discord, khi không đặt, phản ứng trạng thái vẫn được bật khi phản ứng xác nhận đang hoạt động.
  Trên Telegram, đặt rõ thành `true` để bật phản ứng trạng thái vòng đời.

### Khử dội tin nhắn đến

Gộp các tin nhắn chỉ có văn bản được gửi nhanh từ cùng một người gửi vào một lượt tác nhân duy nhất. Phương tiện/tệp đính kèm sẽ được xả ngay lập tức. Các lệnh điều khiển bỏ qua cơ chế khử dội.

### TTS (văn bản thành giọng nói)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` kiểm soát chế độ tự động TTS mặc định: `off`, `always`, `inbound`, hoặc `tagged`. `/tts on|off` có thể ghi đè tùy chọn cục bộ, và `/tts status` hiển thị trạng thái có hiệu lực.
- `summaryModel` ghi đè `agents.defaults.model.primary` cho phần tóm tắt tự động.
- `modelOverrides` được bật theo mặc định; `modelOverrides.allowProvider` mặc định là `false` (chọn tham gia).
- Khóa API dự phòng sang `ELEVENLABS_API_KEY`/`XI_API_KEY` và `OPENAI_API_KEY`.
- Các nhà cung cấp giọng nói đi kèm thuộc sở hữu của plugin. Nếu `plugins.allow` được đặt, hãy bao gồm từng plugin nhà cung cấp TTS mà bạn muốn sử dụng, ví dụ `microsoft` cho Edge TTS. ID nhà cung cấp cũ `edge` được chấp nhận làm bí danh cho `microsoft`.
- `providers.openai.baseUrl` ghi đè điểm cuối OpenAI TTS. Thứ tự phân giải là cấu hình, rồi `OPENAI_TTS_BASE_URL`, rồi `https://api.openai.com/v1`.
- Khi `providers.openai.baseUrl` trỏ đến một điểm cuối không phải OpenAI, OpenClaw coi đó là máy chủ TTS tương thích với OpenAI và nới lỏng việc xác thực mô hình/giọng nói.

---

## Đàm thoại

Mặc định cho chế độ Đàm thoại (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` phải khớp với một khóa trong `talk.providers` khi nhiều nhà cung cấp Đàm thoại được cấu hình.
- Các khóa Đàm thoại phẳng cũ (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) chỉ dùng để tương thích và được tự động di chuyển vào `talk.providers.<provider>`.
- ID giọng nói dự phòng sang `ELEVENLABS_VOICE_ID` hoặc `SAG_VOICE_ID`.
- `providers.*.apiKey` chấp nhận chuỗi văn bản thuần hoặc đối tượng SecretRef.
- Dự phòng `ELEVENLABS_API_KEY` chỉ áp dụng khi chưa cấu hình khóa API Đàm thoại.
- `providers.*.voiceAliases` cho phép các chỉ thị Đàm thoại dùng tên thân thiện.
- `providers.mlx.modelId` chọn kho Hugging Face được trình trợ giúp MLX cục bộ trên macOS sử dụng. Nếu bỏ qua, macOS dùng `mlx-community/Soprano-80M-bf16`.
- Phát lại MLX trên macOS chạy qua trình trợ giúp `openclaw-mlx-tts` đi kèm khi có, hoặc một tệp thực thi trên `PATH`; `OPENCLAW_MLX_TTS_BIN` ghi đè đường dẫn trình trợ giúp để phát triển.
- `speechLocale` đặt ID ngôn ngữ BCP 47 được nhận dạng giọng nói Đàm thoại trên iOS/macOS sử dụng. Để trống để dùng mặc định của thiết bị.
- `silenceTimeoutMs` kiểm soát thời gian chế độ Đàm thoại chờ sau khi người dùng im lặng trước khi gửi bản chép lời. Không đặt giá trị sẽ giữ khoảng tạm dừng mặc định của nền tảng (`700 ms trên macOS và Android, 900 ms trên iOS`).

---

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — tất cả các khóa cấu hình khác
- [Cấu hình](/vi/gateway/configuration) — các tác vụ phổ biến và thiết lập nhanh
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
