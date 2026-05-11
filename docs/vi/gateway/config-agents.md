---
read_when:
    - Tinh chỉnh mặc định của tác tử (mô hình, suy luận, không gian làm việc, Heartbeat, phương tiện, Skills)
    - Cấu hình định tuyến và liên kết đa tác nhân
    - Điều chỉnh phiên, quá trình gửi tin nhắn và hành vi của chế độ trò chuyện
summary: Mặc định của tác nhân, định tuyến đa tác nhân, phiên, tin nhắn và cấu hình trò chuyện
title: Cấu hình — các tác tử
x-i18n:
    generated_at: "2026-05-11T20:29:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbc8f9ff61cb1780dc038c71e3b2f2dd2d5d9fe6582ddf76d44a7dba21d13908
    source_path: gateway/config-agents.md
    workflow: 16
---

Các khóa cấu hình theo phạm vi tác nhân trong `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` và `talk.*`. Đối với kênh, công cụ, runtime Gateway và các khóa
cấp cao nhất khác, xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Mặc định cho tác nhân

### `agents.defaults.workspace`

Mặc định: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Gốc kho lưu trữ tùy chọn được hiển thị trong dòng Runtime của system prompt. Nếu không đặt, OpenClaw tự động phát hiện bằng cách đi ngược lên từ workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Danh sách cho phép Skills mặc định tùy chọn cho các tác nhân không đặt
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

- Bỏ qua `agents.defaults.skills` để mặc định không giới hạn Skills.
- Bỏ qua `agents.list[].skills` để kế thừa các giá trị mặc định.
- Đặt `agents.list[].skills: []` để không có Skills.
- Danh sách `agents.list[].skills` không rỗng là tập cuối cùng cho tác nhân đó; nó
  không hợp nhất với các giá trị mặc định.

### `agents.defaults.skipBootstrap`

Tắt việc tự động tạo các tệp bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Bỏ qua việc tạo các tệp workspace tùy chọn đã chọn trong khi vẫn ghi các tệp bootstrap bắt buộc. Giá trị hợp lệ: `SOUL.md`, `USER.md`, `HEARTBEAT.md` và `IDENTITY.md`.

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

- `"continuation-skip"`: các lượt tiếp tục an toàn (sau một phản hồi assistant đã hoàn tất) bỏ qua việc chèn lại bootstrap workspace, giúp giảm kích thước prompt. Các lượt Heartbeat và các lần thử lại sau Compaction vẫn xây dựng lại ngữ cảnh.
- `"never"`: tắt bootstrap workspace và chèn tệp ngữ cảnh ở mọi lượt. Chỉ dùng tùy chọn này cho các tác nhân tự quản lý hoàn toàn vòng đời prompt của chúng (các engine ngữ cảnh tùy chỉnh, runtime native tự xây dựng ngữ cảnh riêng, hoặc các quy trình chuyên biệt không cần bootstrap). Các lượt Heartbeat và khôi phục sau Compaction cũng bỏ qua việc chèn.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Số ký tự tối đa cho mỗi tệp bootstrap workspace trước khi cắt bớt. Mặc định: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tổng số ký tự tối đa được chèn trên tất cả tệp bootstrap workspace. Mặc định: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kiểm soát thông báo trong system prompt mà tác nhân nhìn thấy khi ngữ cảnh bootstrap bị cắt bớt.
Mặc định: `"once"`.

- `"off"`: không bao giờ chèn văn bản thông báo cắt bớt vào system prompt.
- `"once"`: chèn thông báo ngắn gọn một lần cho mỗi chữ ký cắt bớt duy nhất (khuyến nghị).
- `"always"`: chèn thông báo ngắn gọn trong mọi lần chạy khi có cắt bớt.

Số đếm raw/đã chèn chi tiết và các trường tinh chỉnh cấu hình vẫn nằm trong chẩn đoán như
báo cáo ngữ cảnh/trạng thái và log; ngữ cảnh người dùng/runtime WebChat thông thường chỉ
nhận thông báo khôi phục ngắn gọn.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bản đồ quyền sở hữu ngân sách ngữ cảnh

OpenClaw có nhiều ngân sách prompt/ngữ cảnh dung lượng lớn, và chúng được
cố ý tách theo phân hệ thay vì cùng đi qua một núm điều khiển chung.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  chèn bootstrap workspace thông thường.
- `agents.defaults.startupContext.*`:
  phần mở đầu một lần cho lần chạy model khi đặt lại/khởi động, bao gồm các tệp
  `memory/*.md` hằng ngày gần đây. Các lệnh chat trần `/new` và `/reset` được
  xác nhận mà không gọi model.
- `skills.limits.*`:
  danh sách Skills rút gọn được chèn vào system prompt.
- `agents.defaults.contextLimits.*`:
  các đoạn trích runtime có giới hạn và các khối do runtime sở hữu được chèn vào.
- `memory.qmd.limits.*`:
  đoạn trích tìm kiếm bộ nhớ đã lập chỉ mục và kích thước chèn.

Chỉ dùng ghi đè tương ứng theo từng tác nhân khi một tác nhân cần ngân sách khác:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kiểm soát phần mở đầu khởi động lượt đầu được chèn vào các lần chạy model khi đặt lại/khởi động.
Các lệnh chat trần `/new` và `/reset` xác nhận việc đặt lại mà không gọi
model, vì vậy chúng không tải phần mở đầu này.

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

Giá trị mặc định dùng chung cho các bề mặt ngữ cảnh runtime có giới hạn.

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

- `memoryGetMaxChars`: giới hạn đoạn trích `memory_get` mặc định trước khi thêm
  siêu dữ liệu cắt bớt và thông báo tiếp tục.
- `memoryGetDefaultLines`: cửa sổ dòng `memory_get` mặc định khi bỏ qua `lines`.
- `toolResultMaxChars`: giới hạn kết quả công cụ trực tiếp được dùng cho kết quả được lưu bền vững và
  khôi phục tràn.
- `postCompactionMaxChars`: giới hạn đoạn trích AGENTS.md được dùng trong quá trình
  chèn làm mới sau Compaction.

#### `agents.list[].contextLimits`

Ghi đè theo từng tác nhân cho các núm `contextLimits` dùng chung. Các trường bị bỏ qua kế thừa
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
không ảnh hưởng đến việc đọc các tệp `SKILL.md` khi cần.

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

Ghi đè theo từng tác nhân cho ngân sách prompt Skills.

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

Giá trị thấp hơn thường giảm mức sử dụng vision-token và kích thước payload yêu cầu cho các lần chạy có nhiều ảnh chụp màn hình.
Giá trị cao hơn giữ lại nhiều chi tiết hình ảnh hơn.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Múi giờ cho ngữ cảnh system prompt (không phải dấu thời gian tin nhắn). Dự phòng về múi giờ của host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Định dạng thời gian trong system prompt. Mặc định: `auto` (tùy chọn hệ điều hành).

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
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
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
  - Dạng đối tượng đặt mô hình chính cùng các mô hình chuyển đổi dự phòng có thứ tự.
- `imageModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được đường dẫn công cụ `image` dùng làm cấu hình mô hình thị giác.
  - Cũng được dùng làm định tuyến dự phòng khi mô hình đã chọn/mặc định không thể nhận đầu vào hình ảnh.
  - Ưu tiên tham chiếu `provider/model` rõ ràng. ID trần được chấp nhận để tương thích; nếu một ID trần khớp duy nhất với một mục hỗ trợ hình ảnh đã cấu hình trong `models.providers.*.models`, OpenClaw sẽ gán nó cho nhà cung cấp đó. Các khớp đã cấu hình nhưng mơ hồ yêu cầu tiền tố nhà cung cấp rõ ràng.
- `imageGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được năng lực tạo hình ảnh dùng chung và mọi bề mặt công cụ/Plugin trong tương lai tạo hình ảnh sử dụng.
  - Giá trị thường dùng: `google/gemini-3.1-flash-image-preview` cho tạo hình ảnh Gemini gốc, `fal/fal-ai/flux/dev` cho fal, `openai/gpt-image-2` cho OpenAI Images, hoặc `openai/gpt-image-1.5` cho đầu ra PNG/WebP OpenAI nền trong suốt.
  - Nếu bạn chọn trực tiếp một nhà cung cấp/mô hình, hãy cấu hình cả xác thực nhà cung cấp tương ứng (ví dụ `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` cho `google/*`, `OPENAI_API_KEY` hoặc OpenAI Codex OAuth cho `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` cho `fal/*`).
  - Nếu bỏ qua, `image_generate` vẫn có thể suy ra mặc định nhà cung cấp dựa trên xác thực. Nó thử nhà cung cấp mặc định hiện tại trước, rồi đến các nhà cung cấp tạo hình ảnh đã đăng ký còn lại theo thứ tự ID nhà cung cấp.
- `musicGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được năng lực tạo nhạc dùng chung và công cụ tích hợp `music_generate` sử dụng.
  - Giá trị thường dùng: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, hoặc `minimax/music-2.6`.
  - Nếu bỏ qua, `music_generate` vẫn có thể suy ra mặc định nhà cung cấp dựa trên xác thực. Nó thử nhà cung cấp mặc định hiện tại trước, rồi đến các nhà cung cấp tạo nhạc đã đăng ký còn lại theo thứ tự ID nhà cung cấp.
  - Nếu bạn chọn trực tiếp một nhà cung cấp/mô hình, hãy cấu hình cả xác thực/khóa API nhà cung cấp tương ứng.
- `videoGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được năng lực tạo video dùng chung và công cụ tích hợp `video_generate` sử dụng.
  - Giá trị thường dùng: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, hoặc `qwen/wan2.7-r2v`.
  - Nếu bỏ qua, `video_generate` vẫn có thể suy ra mặc định nhà cung cấp dựa trên xác thực. Nó thử nhà cung cấp mặc định hiện tại trước, rồi đến các nhà cung cấp tạo video đã đăng ký còn lại theo thứ tự ID nhà cung cấp.
  - Nếu bạn chọn trực tiếp một nhà cung cấp/mô hình, hãy cấu hình cả xác thực/khóa API nhà cung cấp tương ứng.
  - Nhà cung cấp tạo video Qwen đi kèm hỗ trợ tối đa 1 video đầu ra, 1 hình ảnh đầu vào, 4 video đầu vào, thời lượng 10 giây, và các tùy chọn cấp nhà cung cấp `size`, `aspectRatio`, `resolution`, `audio`, và `watermark`.
- `pdfModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được công cụ `pdf` dùng để định tuyến mô hình.
  - Nếu bỏ qua, công cụ PDF dự phòng về `imageModel`, rồi đến mô hình phiên/mặc định đã phân giải.
- `pdfMaxBytesMb`: giới hạn kích thước PDF mặc định cho công cụ `pdf` khi `maxBytesMb` không được truyền tại thời điểm gọi.
- `pdfMaxPages`: số trang tối đa mặc định được chế độ dự phòng trích xuất trong công cụ `pdf` xem xét.
- `verboseDefault`: mức chi tiết mặc định cho tác tử. Giá trị: `"off"`, `"on"`, `"full"`. Mặc định: `"off"`.
- `toolProgressDetail`: chế độ chi tiết cho tóm tắt công cụ `/verbose` và các dòng công cụ bản nháp tiến độ. Giá trị: `"explain"` (mặc định, nhãn ngắn gọn cho người đọc) hoặc `"raw"` (thêm lệnh/chi tiết thô khi có). `agents.list[].toolProgressDetail` theo từng tác tử ghi đè mặc định này.
- `reasoningDefault`: mức hiển thị suy luận mặc định cho tác tử. Giá trị: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` theo từng tác tử ghi đè mặc định này. Các mặc định suy luận đã cấu hình chỉ được áp dụng cho chủ sở hữu, người gửi được ủy quyền, hoặc ngữ cảnh Gateway của quản trị viên vận hành khi không có ghi đè suy luận theo từng tin nhắn hoặc phiên.
- `elevatedDefault`: mức đầu ra nâng cao mặc định cho tác tử. Giá trị: `"off"`, `"on"`, `"ask"`, `"full"`. Mặc định: `"on"`.
- `model.primary`: định dạng `provider/model` (ví dụ `openai/gpt-5.5` cho quyền truy cập bằng khóa API OpenAI hoặc Codex OAuth). Nếu bạn bỏ qua nhà cung cấp, OpenClaw thử bí danh trước, rồi đến một khớp nhà cung cấp đã cấu hình duy nhất cho đúng ID mô hình đó, và chỉ sau đó mới dự phòng về nhà cung cấp mặc định đã cấu hình (hành vi tương thích đã lỗi thời, nên hãy ưu tiên `provider/model` rõ ràng). Nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw dự phòng về nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị mặc định nhà cung cấp cũ đã bị gỡ.
- `models`: danh mục mô hình đã cấu hình và danh sách cho phép cho `/model`. Mỗi mục có thể bao gồm `alias` (lối tắt) và `params` (theo nhà cung cấp, ví dụ `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Dùng các mục `provider/*` như `"openai-codex/*": {}` hoặc `"vllm/*": {}` để hiển thị mọi mô hình được phát hiện cho các nhà cung cấp đã chọn mà không phải liệt kê thủ công từng ID mô hình.
  - Chỉnh sửa an toàn: dùng `openclaw config set agents.defaults.models '<json>' --strict-json --merge` để thêm mục. `config set` từ chối các thay thế sẽ xóa mục danh sách cho phép hiện có trừ khi bạn truyền `--replace`.
  - Các luồng cấu hình/onboarding theo phạm vi nhà cung cấp hợp nhất các mô hình nhà cung cấp đã chọn vào bản đồ này và giữ nguyên các nhà cung cấp không liên quan đã được cấu hình.
  - Với các mô hình OpenAI Responses trực tiếp, Compaction phía máy chủ được bật tự động. Dùng `params.responsesServerCompaction: false` để ngừng chèn `context_management`, hoặc `params.responsesCompactThreshold` để ghi đè ngưỡng. Xem [Compaction phía máy chủ OpenAI](/vi/providers/openai#server-side-compaction-responses-api).
- `params`: tham số nhà cung cấp mặc định toàn cục áp dụng cho mọi mô hình. Đặt tại `agents.defaults.params` (ví dụ `{ cacheRetention: "long" }`).
- Thứ tự ưu tiên hợp nhất `params` (cấu hình): `agents.defaults.params` (nền toàn cục) bị ghi đè bởi `agents.defaults.models["provider/model"].params` (theo mô hình), rồi `agents.list[].params` (khớp ID tác tử) ghi đè theo khóa. Xem [Prompt Caching](/vi/reference/prompt-caching) để biết chi tiết.
- `params.extra_body`/`params.extraBody`: JSON truyền qua nâng cao được hợp nhất vào thân yêu cầu `api: "openai-completions"` cho các proxy tương thích OpenAI. Nếu nó xung đột với các khóa yêu cầu được tạo, thân bổ sung sẽ thắng; các tuyến completions không gốc vẫn loại bỏ `store` chỉ dành cho OpenAI sau đó.
- `params.chat_template_kwargs`: đối số mẫu chat tương thích vLLM/OpenAI được hợp nhất vào thân yêu cầu `api: "openai-completions"` cấp cao nhất. Với `vllm/nemotron-3-*` khi tắt thinking, Plugin vLLM đi kèm tự động gửi `enable_thinking: false` và `force_nonempty_content: true`; `chat_template_kwargs` rõ ràng ghi đè mặc định được tạo, và `extra_body.chat_template_kwargs` vẫn có độ ưu tiên cuối cùng. Với điều khiển thinking Qwen trên vLLM, đặt `params.qwenThinkingFormat` thành `"chat-template"` hoặc `"top-level"` trên mục mô hình đó.
- `compat.thinkingFormat`: kiểu tải trọng thinking tương thích OpenAI. Dùng `"qwen"` cho `enable_thinking` cấp cao nhất kiểu Qwen, hoặc `"qwen-chat-template"` cho `chat_template_kwargs.enable_thinking` trên các backend họ Qwen hỗ trợ kwargs mẫu chat cấp yêu cầu, chẳng hạn vLLM. OpenClaw ánh xạ thinking bị tắt thành `false` và thinking được bật thành `true`.
- `compat.supportedReasoningEfforts`: danh sách mức nỗ lực suy luận tương thích OpenAI theo mô hình. Bao gồm `"xhigh"` cho các endpoint tùy chỉnh thực sự chấp nhận giá trị đó; khi đó OpenClaw hiển thị `/think xhigh` trong menu lệnh, hàng phiên Gateway, xác thực bản vá phiên, xác thực CLI tác tử, và xác thực `llm-task` cho nhà cung cấp/mô hình đã cấu hình đó. Dùng `compat.reasoningEffortMap` khi backend muốn một giá trị riêng theo nhà cung cấp cho một mức chuẩn.
- `params.preserveThinking`: tùy chọn bật riêng cho Z.AI để giữ nguyên thinking. Khi được bật và thinking đang bật, OpenClaw gửi `thinking.clear_thinking: false` và phát lại `reasoning_content` trước đó; xem [thinking và thinking được giữ nguyên của Z.AI](/vi/providers/zai#thinking-and-preserved-thinking).
- `localService`: trình quản lý tiến trình tùy chọn cấp nhà cung cấp cho máy chủ mô hình cục bộ/tự lưu trữ. Khi mô hình đã chọn thuộc nhà cung cấp đó, OpenClaw thăm dò `healthUrl` (hoặc `baseUrl + "/models"`), khởi động `command` với `args` nếu endpoint ngừng hoạt động, chờ tối đa `readyTimeoutMs`, rồi gửi yêu cầu mô hình. `command` phải là một đường dẫn tuyệt đối. `idleStopMs: 0` giữ tiến trình chạy cho đến khi OpenClaw thoát; một giá trị dương sẽ dừng tiến trình do OpenClaw tạo sau số mili giây nhàn rỗi đó. Xem [Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services).
- Chính sách runtime thuộc về nhà cung cấp hoặc mô hình, không thuộc `agents.defaults`. Dùng `models.providers.<provider>.agentRuntime` cho quy tắc toàn nhà cung cấp hoặc `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` cho quy tắc theo mô hình. Các mô hình tác tử OpenAI trên nhà cung cấp OpenAI chính thức chọn Codex theo mặc định.
- Trình ghi cấu hình thay đổi các trường này (ví dụ các lệnh `/models set`, `/models set-image`, và thêm/xóa dự phòng) lưu dạng đối tượng chuẩn và giữ lại danh sách dự phòng hiện có khi có thể.
- `maxConcurrent`: số lượt chạy tác tử song song tối đa giữa các phiên (mỗi phiên vẫn được tuần tự hóa). Mặc định: 4.

### Chính sách runtime

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, ID harness Plugin đã đăng ký, hoặc bí danh backend CLI được hỗ trợ. Plugin Codex đi kèm đăng ký `codex`; Plugin Anthropic đi kèm cung cấp backend CLI `claude-cli`.
- `id: "auto"` cho phép các harness Plugin đã đăng ký nhận các lượt được hỗ trợ và dùng PI khi không có harness nào khớp. Một runtime Plugin rõ ràng như `id: "codex"` yêu cầu harness đó và đóng lỗi nếu nó không khả dụng hoặc thất bại.
- Khóa runtime toàn tác tử là di sản. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, ghim runtime phiên, và `OPENCLAW_AGENT_RUNTIME` bị bỏ qua trong lựa chọn runtime. Chạy `openclaw doctor --fix` để xóa các giá trị cũ.
- Các mô hình tác tử OpenAI dùng harness Codex theo mặc định; `agentRuntime.id: "codex"` theo nhà cung cấp/mô hình vẫn hợp lệ khi bạn muốn biểu thị rõ điều đó.
- Với triển khai Claude CLI, ưu tiên `model: "anthropic/claude-opus-4-7"` cùng `agentRuntime.id: "claude-cli"` theo phạm vi mô hình. Tham chiếu mô hình `claude-cli/claude-opus-4-7` cũ vẫn hoạt động để tương thích, nhưng cấu hình mới nên giữ lựa chọn nhà cung cấp/mô hình ở dạng chuẩn và đặt backend thực thi trong chính sách runtime nhà cung cấp/mô hình.
- Điều này chỉ kiểm soát thực thi lượt tác tử văn bản. Tạo phương tiện, thị giác, PDF, nhạc, video, và TTS vẫn dùng các thiết lập nhà cung cấp/mô hình tương ứng.

**Lối tắt bí danh tích hợp** (chỉ áp dụng khi mô hình nằm trong `agents.defaults.models`):

| Bí danh             | Mô hình                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Các bí danh bạn đã cấu hình luôn được ưu tiên hơn mặc định.

Các mô hình Z.AI GLM-4.x tự động bật chế độ suy luận trừ khi bạn đặt `--thinking off` hoặc tự định nghĩa `agents.defaults.models["zai/<model>"].params.thinking`.
Các mô hình Z.AI bật `tool_stream` theo mặc định để truyền trực tuyến lệnh gọi công cụ. Đặt `agents.defaults.models["zai/<model>"].params.tool_stream` thành `false` để tắt.
Các mô hình Anthropic Claude 4.6 mặc định dùng suy luận `adaptive` khi không đặt mức suy luận rõ ràng.

### `agents.defaults.cliBackends`

Các backend CLI tùy chọn cho các lượt chạy dự phòng chỉ dùng văn bản (không có lệnh gọi công cụ). Hữu ích làm phương án dự phòng khi nhà cung cấp API gặp lỗi.

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
- Hỗ trợ chuyển tiếp hình ảnh khi `imageArg` chấp nhận đường dẫn tệp.
- `reseedFromRawTranscriptWhenUncompacted: true` cho phép backend khôi phục các phiên đã bị vô hiệu hóa một cách an toàn
  từ phần đuôi transcript OpenClaw thô có giới hạn trước khi bản tóm tắt compaction
  đầu tiên tồn tại. Các thay đổi hồ sơ xác thực hoặc credential-epoch
  vẫn không bao giờ raw-reseed.

### `agents.defaults.systemPromptOverride`

Thay toàn bộ system prompt do OpenClaw lắp ráp bằng một chuỗi cố định. Đặt ở cấp mặc định (`agents.defaults.systemPromptOverride`) hoặc theo từng agent (`agents.list[].systemPromptOverride`). Giá trị theo agent được ưu tiên; giá trị rỗng hoặc chỉ gồm khoảng trắng bị bỏ qua. Hữu ích cho các thử nghiệm prompt có kiểm soát.

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

Các lớp phủ prompt độc lập với nhà cung cấp được áp dụng theo họ mô hình. ID mô hình họ GPT-5 nhận hợp đồng hành vi dùng chung trên các nhà cung cấp; `personality` chỉ kiểm soát lớp phong cách tương tác thân thiện.

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
- `plugins.entries.openai.config.personality` cũ vẫn được đọc khi thiết lập dùng chung này chưa được đặt.

### `agents.defaults.heartbeat`

Các lượt chạy Heartbeat định kỳ.

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
- `includeSystemPromptSection`: khi là false, bỏ phần Heartbeat khỏi system prompt và bỏ qua việc chèn `HEARTBEAT.md` vào ngữ cảnh bootstrap. Mặc định: `true`.
- `suppressToolErrorWarnings`: khi là true, chặn các payload cảnh báo lỗi công cụ trong các lượt chạy Heartbeat.
- `timeoutSeconds`: thời gian tối đa tính bằng giây cho phép đối với một lượt agent Heartbeat trước khi bị hủy. Để trống để dùng `agents.defaults.timeoutSeconds`.
- `directPolicy`: chính sách gửi trực tiếp/DM. `allow` (mặc định) cho phép gửi tới mục tiêu trực tiếp. `block` chặn việc gửi tới mục tiêu trực tiếp và phát ra `reason=dm-blocked`.
- `lightContext`: khi là true, các lượt chạy Heartbeat dùng ngữ cảnh bootstrap nhẹ và chỉ giữ `HEARTBEAT.md` từ các tệp bootstrap của workspace.
- `isolatedSession`: khi là true, mỗi Heartbeat chạy trong một phiên mới không có lịch sử hội thoại trước đó. Cùng mẫu cô lập với cron `sessionTarget: "isolated"`. Giảm chi phí token mỗi Heartbeat từ khoảng 100K xuống khoảng 2-5K token.
- `skipWhenBusy`: khi là true, các lượt chạy Heartbeat sẽ trì hoãn trên các làn bận bổ sung: công việc subagent hoặc lệnh lồng nhau. Các làn Cron luôn trì hoãn Heartbeat, ngay cả khi không có cờ này.
- Theo agent: đặt `agents.list[].heartbeat`. Khi bất kỳ agent nào định nghĩa `heartbeat`, **chỉ các agent đó** chạy Heartbeat.
- Heartbeat chạy các lượt agent đầy đủ — khoảng thời gian ngắn hơn tiêu tốn nhiều token hơn.

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

- `mode`: `default` hoặc `safeguard` (tóm tắt theo khối cho lịch sử dài). Xem [Compaction](/vi/concepts/compaction).
- `provider`: ID của một Plugin nhà cung cấp Compaction đã đăng ký. Khi được đặt, `summarize()` của nhà cung cấp được gọi thay vì tóm tắt LLM tích hợp. Quay về tích hợp nếu lỗi. Việc đặt nhà cung cấp buộc `mode: "safeguard"`. Xem [Compaction](/vi/concepts/compaction).
- `timeoutSeconds`: số giây tối đa cho phép đối với một thao tác Compaction trước khi OpenClaw hủy nó. Mặc định: `900`.
- `keepRecentTokens`: ngân sách điểm cắt Pi để giữ nguyên văn phần đuôi transcript gần đây nhất. `/compact` thủ công tôn trọng giá trị này khi được đặt rõ ràng; nếu không, Compaction thủ công là một checkpoint cứng.
- `identifierPolicy`: `strict` (mặc định), `off`, hoặc `custom`. `strict` thêm hướng dẫn giữ lại định danh mờ tích hợp ở đầu trong quá trình tóm tắt Compaction.
- `identifierInstructions`: văn bản tùy chỉnh tùy chọn để bảo toàn định danh, dùng khi `identifierPolicy=custom`.
- `qualityGuard`: các kiểm tra thử lại khi đầu ra sai định dạng cho tóm tắt safeguard. Được bật theo mặc định ở chế độ safeguard; đặt `enabled: false` để bỏ qua kiểm toán.
- `midTurnPrecheck`: kiểm tra áp lực tool-loop Pi tùy chọn. Khi `enabled: true`, OpenClaw kiểm tra áp lực ngữ cảnh sau khi kết quả công cụ được nối thêm và trước lệnh gọi mô hình tiếp theo. Nếu ngữ cảnh không còn vừa, nó hủy lần thử hiện tại trước khi gửi prompt và dùng lại đường dẫn khôi phục precheck hiện có để cắt ngắn kết quả công cụ hoặc compact rồi thử lại. Hoạt động với cả chế độ Compaction `default` và `safeguard`. Mặc định: tắt.
- `postCompactionSections`: tên phần H2/H3 AGENTS.md tùy chọn để chèn lại sau Compaction. Mặc định là `["Session Startup", "Red Lines"]`; đặt `[]` để tắt chèn lại. Khi chưa đặt hoặc được đặt rõ ràng thành cặp mặc định đó, các tiêu đề cũ `Every Session`/`Safety` cũng được chấp nhận như fallback kế thừa.
- `model`: ghi đè `provider/model-id` tùy chọn chỉ dành cho tóm tắt Compaction. Dùng khi phiên chính cần giữ một mô hình nhưng tóm tắt Compaction cần chạy trên mô hình khác; khi chưa đặt, Compaction dùng mô hình chính của phiên.
- `maxActiveTranscriptBytes`: ngưỡng byte tùy chọn (`number` hoặc chuỗi như `"20mb"`) kích hoạt Compaction cục bộ thông thường trước một lượt chạy khi JSONL đang hoạt động vượt quá ngưỡng. Yêu cầu `truncateAfterCompaction` để Compaction thành công có thể xoay sang transcript kế tiếp nhỏ hơn. Bị tắt khi chưa đặt hoặc bằng `0`.
- `notifyUser`: khi là `true`, gửi thông báo ngắn cho người dùng khi Compaction bắt đầu và khi hoàn tất (ví dụ: "Compacting context..." và "Compaction complete"). Tắt theo mặc định để giữ Compaction im lặng.
- `memoryFlush`: lượt agentic im lặng trước auto-compaction để lưu trữ ký ức bền vững. Đặt `model` thành một nhà cung cấp/mô hình chính xác như `ollama/qwen3:8b` khi lượt housekeeping này nên ở trên mô hình cục bộ; ghi đè này không kế thừa chuỗi fallback của phiên đang hoạt động. Bị bỏ qua khi workspace ở chế độ chỉ đọc.

### `agents.defaults.contextPruning`

Lược bỏ **kết quả công cụ cũ** khỏi ngữ cảnh trong bộ nhớ trước khi gửi tới LLM. **Không** sửa lịch sử phiên trên đĩa.

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

- `mode: "cache-ttl"` bật các lượt lược bỏ.
- `ttl` kiểm soát tần suất lược bỏ có thể chạy lại (sau lần chạm cache gần nhất).
- Quá trình lược bỏ trước tiên soft-trim các kết quả công cụ quá lớn, rồi hard-clear các kết quả công cụ cũ hơn nếu cần.

**Soft-trim** giữ phần đầu + phần cuối và chèn `...` ở giữa.

**Hard-clear** thay toàn bộ kết quả công cụ bằng placeholder.

Ghi chú:

- Các khối hình ảnh không bao giờ bị cắt/clear.
- Tỷ lệ dựa trên ký tự (xấp xỉ), không phải số token chính xác.
- Nếu có ít hơn `keepLastAssistants` thông điệp assistant, quá trình lược bỏ bị bỏ qua.

</Accordion>

Xem [Session Pruning](/vi/concepts/session-pruning) để biết chi tiết hành vi.

### Truyền trực tuyến khối

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

- Các kênh không phải Telegram cần đặt rõ `*.blockStreaming: true` để bật phản hồi theo khối.
- Ghi đè theo kênh: `channels.<channel>.blockStreamingCoalesce` (và các biến thể theo tài khoản). Signal/Slack/Discord/Google Chat mặc định `minChars: 1500`.
- `humanDelay`: khoảng dừng ngẫu nhiên giữa các phản hồi theo khối. `natural` = 800–2500ms. Ghi đè theo agent: `agents.list[].humanDelay`.

Xem [Streaming](/vi/concepts/streaming) để biết hành vi và chi tiết chia đoạn.

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

- Mặc định: `instant` cho trò chuyện trực tiếp/lượt nhắc tên, `message` cho trò chuyện nhóm không nhắc tên.
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

<Accordion title="Chi tiết sandbox">

**Nền chạy:**

- `docker`: môi trường chạy Docker cục bộ (mặc định)
- `ssh`: môi trường chạy từ xa chung dựa trên SSH
- `openshell`: môi trường chạy OpenShell

Khi chọn `backend: "openshell"`, các thiết lập dành riêng cho môi trường chạy chuyển sang
`plugins.entries.openshell.config`.

**Cấu hình nền chạy SSH:**

- `target`: đích SSH ở dạng `user@host[:port]`
- `command`: lệnh máy khách SSH (mặc định: `ssh`)
- `workspaceRoot`: thư mục gốc từ xa tuyệt đối dùng cho workspace theo từng phạm vi
- `identityFile` / `certificateFile` / `knownHostsFile`: các tệp cục bộ hiện có được truyền cho OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: nội dung nội tuyến hoặc SecretRef mà OpenClaw hiện thực hóa thành tệp tạm khi chạy
- `strictHostKeyChecking` / `updateHostKeys`: các nút chỉnh chính sách khóa máy chủ của OpenSSH

**Thứ tự ưu tiên xác thực SSH:**

- `identityData` được ưu tiên hơn `identityFile`
- `certificateData` được ưu tiên hơn `certificateFile`
- `knownHostsData` được ưu tiên hơn `knownHostsFile`
- Các giá trị `*Data` dựa trên SecretRef được phân giải từ ảnh chụp runtime bí mật đang hoạt động trước khi phiên sandbox bắt đầu

**Hành vi nền chạy SSH:**

- khởi tạo workspace từ xa một lần sau khi tạo hoặc tạo lại
- sau đó giữ workspace SSH từ xa làm bản chuẩn
- định tuyến `exec`, công cụ tệp và đường dẫn phương tiện qua SSH
- không tự động đồng bộ thay đổi từ xa trở lại máy chủ
- không hỗ trợ container trình duyệt sandbox

**Quyền truy cập workspace:**

- `none`: workspace sandbox theo phạm vi nằm dưới `~/.openclaw/sandboxes`
- `ro`: workspace sandbox tại `/workspace`, workspace agent được gắn chỉ đọc tại `/agent`
- `rw`: workspace agent được gắn đọc/ghi tại `/workspace`

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

- `mirror`: khởi tạo từ xa từ cục bộ trước khi exec, đồng bộ lại sau khi exec; workspace cục bộ vẫn là bản chuẩn
- `remote`: khởi tạo từ xa một lần khi sandbox được tạo, sau đó giữ workspace từ xa làm bản chuẩn

Ở chế độ `remote`, các chỉnh sửa cục bộ trên máy chủ được thực hiện bên ngoài OpenClaw sẽ không tự động đồng bộ vào sandbox sau bước khởi tạo.
Transport là SSH vào sandbox OpenShell, nhưng Plugin sở hữu vòng đời sandbox và đồng bộ mirror tùy chọn.

**`setupCommand`** chạy một lần sau khi tạo container (qua `sh -lc`). Cần truy cập mạng ra ngoài, root có thể ghi và người dùng root.

**Container mặc định là `network: "none"`** — đặt thành `"bridge"` (hoặc mạng bridge tùy chỉnh) nếu agent cần truy cập ra ngoài.
`"host"` bị chặn. `"container:<id>"` bị chặn theo mặc định trừ khi bạn đặt rõ
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (phá vỡ kiểm soát trong trường hợp khẩn cấp).

**Tệp đính kèm gửi vào** được đưa vào `media/inbound/*` trong workspace đang hoạt động.

**`docker.binds`** gắn thêm các thư mục máy chủ; các bind toàn cục và theo agent được hợp nhất.

**Trình duyệt trong sandbox** (`sandbox.browser.enabled`): Chromium + CDP trong container. URL noVNC được đưa vào system prompt. Không yêu cầu `browser.enabled` trong `openclaw.json`.
Quyền truy cập quan sát noVNC dùng xác thực VNC theo mặc định và OpenClaw phát ra URL token ngắn hạn (thay vì để lộ mật khẩu trong URL dùng chung).

- `allowHostControl: false` (mặc định) chặn các phiên sandbox nhắm tới trình duyệt máy chủ.
- `network` mặc định là `openclaw-sandbox-browser` (mạng bridge chuyên dụng). Chỉ đặt thành `bridge` khi bạn rõ ràng muốn kết nối bridge toàn cục.
- `cdpSourceRange` tùy chọn giới hạn lưu lượng CDP đi vào tại rìa container theo dải CIDR (ví dụ `172.21.0.1/32`).
- `sandbox.browser.binds` chỉ gắn thêm các thư mục máy chủ vào container trình duyệt sandbox. Khi được đặt (bao gồm `[]`), nó thay thế `docker.binds` cho container trình duyệt.
- Mặc định khởi chạy được định nghĩa trong `scripts/sandbox-browser-entrypoint.sh` và được tinh chỉnh cho máy chủ container:
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
  - `--disable-extensions` (bật theo mặc định)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, và `--disable-gpu` được
    bật theo mặc định và có thể tắt bằng
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu việc dùng WebGL/3D yêu cầu.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` bật lại extension nếu quy trình của bạn
    phụ thuộc vào chúng.
  - `--renderer-process-limit=2` có thể thay đổi bằng
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; đặt `0` để dùng giới hạn tiến trình
    mặc định của Chromium.
  - cộng thêm `--no-sandbox` khi bật `noSandbox`.
  - Mặc định là baseline của image container; dùng image trình duyệt tùy chỉnh với entrypoint tùy chỉnh để thay đổi mặc định container.

</Accordion>

Cô lập sandbox cho trình duyệt và `sandbox.docker.binds` chỉ dành cho Docker.

Build image (từ bản checkout nguồn):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Với cài đặt npm không có bản checkout nguồn, xem [Cô lập sandbox § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) để lấy các lệnh `docker build` nội tuyến.

### `agents.list` (ghi đè theo agent)

Dùng `agents.list[].tts` để cấp cho agent nhà cung cấp TTS, giọng nói, mô hình,
phong cách hoặc chế độ TTS tự động riêng. Khối agent được deep-merge lên trên
`messages.tts` toàn cục, nên thông tin xác thực dùng chung có thể ở một nơi trong khi từng
agent chỉ ghi đè các trường giọng nói hoặc nhà cung cấp mà chúng cần. Ghi đè của agent đang hoạt động
áp dụng cho phản hồi nói tự động, `/tts audio`, `/tts status`, và
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

- `id`: mã định danh tác nhân ổn định (bắt buộc).
- `default`: khi đặt nhiều mục, mục đầu tiên sẽ thắng (ghi nhật ký cảnh báo). Nếu không đặt mục nào, mục đầu tiên trong danh sách là mặc định.
- `model`: dạng chuỗi đặt một mô hình chính nghiêm ngặt cho từng tác nhân, không có mô hình dự phòng; dạng đối tượng `{ primary }` cũng nghiêm ngặt trừ khi bạn thêm `fallbacks`. Dùng `{ primary, fallbacks: [...] }` để cho tác nhân đó dùng dự phòng, hoặc `{ primary, fallbacks: [] }` để làm rõ hành vi nghiêm ngặt. Các Cron job chỉ ghi đè `primary` vẫn kế thừa dự phòng mặc định trừ khi bạn đặt `fallbacks: []`.
- `params`: tham số luồng cho từng tác nhân, được hợp nhất đè lên mục mô hình đã chọn trong `agents.defaults.models`. Dùng mục này cho các ghi đè riêng theo tác nhân như `cacheRetention`, `temperature`, hoặc `maxTokens` mà không cần sao chép toàn bộ danh mục mô hình.
- `tts`: ghi đè văn bản thành giọng nói tùy chọn cho từng tác nhân. Khối này hợp nhất sâu đè lên `messages.tts`, vì vậy hãy giữ thông tin xác thực nhà cung cấp dùng chung và chính sách dự phòng trong `messages.tts`, rồi chỉ đặt các giá trị riêng theo persona như nhà cung cấp, giọng nói, mô hình, phong cách, hoặc chế độ tự động ở đây.
- `skills`: danh sách cho phép skill tùy chọn cho từng tác nhân. Nếu bỏ qua, tác nhân kế thừa `agents.defaults.skills` khi được đặt; danh sách rõ ràng sẽ thay thế mặc định thay vì hợp nhất, và `[]` nghĩa là không có skill.
- `thinkingDefault`: mức suy nghĩ mặc định tùy chọn cho từng tác nhân (`off | minimal | low | medium | high | xhigh | adaptive | max`). Ghi đè `agents.defaults.thinkingDefault` cho tác nhân này khi không đặt ghi đè theo tin nhắn hoặc phiên. Hồ sơ nhà cung cấp/mô hình đã chọn kiểm soát những giá trị nào hợp lệ; với Google Gemini, `adaptive` giữ cơ chế suy nghĩ động do nhà cung cấp sở hữu (`thinkingLevel` bị bỏ qua trên Gemini 3/3.1, `thinkingBudget: -1` trên Gemini 2.5).
- `reasoningDefault`: khả năng hiển thị reasoning mặc định tùy chọn cho từng tác nhân (`on | off | stream`). Ghi đè `agents.defaults.reasoningDefault` cho tác nhân này khi không đặt ghi đè reasoning theo tin nhắn hoặc phiên.
- `fastModeDefault`: mặc định tùy chọn cho từng tác nhân đối với chế độ nhanh (`true | false`). Áp dụng khi không đặt ghi đè chế độ nhanh theo tin nhắn hoặc phiên.
- `models`: ghi đè danh mục mô hình/runtime tùy chọn cho từng tác nhân, được khóa theo mã định danh `provider/model` đầy đủ. Dùng `models["provider/model"].agentRuntime` cho các ngoại lệ runtime theo từng tác nhân.
- `runtime`: bộ mô tả runtime tùy chọn cho từng tác nhân. Dùng `type: "acp"` với các mặc định `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) khi tác nhân nên mặc định dùng các phiên ACP harness.
- `identity.avatar`: đường dẫn tương đối với workspace, URL `http(s)`, hoặc URI `data:`.
- `identity` suy ra các mặc định: `ackReaction` từ `emoji`, `mentionPatterns` từ `name`/`emoji`.
- `subagents.allowAgents`: danh sách cho phép các mã định danh tác nhân cho đích `sessions_spawn.agentId` rõ ràng (`["*"]` = bất kỳ; mặc định: chỉ cùng tác nhân). Bao gồm mã định danh của bên yêu cầu khi cần cho phép các lệnh gọi `agentId` tự nhắm mục tiêu.
- Bộ bảo vệ kế thừa sandbox: nếu phiên của bên yêu cầu đang bị sandbox, `sessions_spawn` từ chối các đích sẽ chạy không bị sandbox.
- `subagents.requireAgentId`: khi là true, chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng; mặc định: false).

---

## Định tuyến đa tác nhân

Chạy nhiều tác nhân cô lập bên trong một Gateway. Xem [Multi-Agent](/vi/concepts/multi-agent).

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

### Các trường khớp binding

- `type` (tùy chọn): `route` cho định tuyến thông thường (thiếu type mặc định là route), `acp` cho binding hội thoại ACP bền vững.
- `match.channel` (bắt buộc)
- `match.accountId` (tùy chọn; `*` = bất kỳ tài khoản nào; bỏ qua = tài khoản mặc định)
- `match.peer` (tùy chọn; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (tùy chọn; theo từng kênh)
- `acp` (tùy chọn; chỉ dành cho `type: "acp"`): `{ mode, label, cwd, backend }`

**Thứ tự khớp xác định:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (chính xác, không có peer/guild/team)
5. `match.accountId: "*"` (toàn kênh)
6. Tác nhân mặc định

Trong mỗi tầng, mục `bindings` khớp đầu tiên sẽ thắng.

Đối với các mục `type: "acp"`, OpenClaw phân giải theo danh tính hội thoại chính xác (`match.channel` + tài khoản + `match.peer.id`) và không dùng thứ tự tầng binding định tuyến ở trên.

### Hồ sơ truy cập theo từng tác nhân

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

Xem [Multi-Agent Sandbox & Tools](/vi/tools/multi-agent-sandbox-tools) để biết chi tiết về thứ tự ưu tiên.

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
  - `per-sender` (mặc định): mỗi người gửi có một phiên tách biệt trong ngữ cảnh kênh.
  - `global`: tất cả người tham gia trong một ngữ cảnh kênh dùng chung một phiên duy nhất (chỉ dùng khi chủ đích là ngữ cảnh dùng chung).
- **`dmScope`**: cách nhóm tin nhắn trực tiếp.
  - `main`: tất cả tin nhắn trực tiếp dùng chung phiên chính.
  - `per-peer`: tách biệt theo id người gửi trên các kênh.
  - `per-channel-peer`: tách biệt theo kênh + người gửi (khuyến nghị cho hộp thư nhiều người dùng).
  - `per-account-channel-peer`: tách biệt theo tài khoản + kênh + người gửi (khuyến nghị cho nhiều tài khoản).
- **`identityLinks`**: ánh xạ các id chính tắc tới các peer có tiền tố nhà cung cấp để chia sẻ phiên liên kênh. Các lệnh dock như `/dock_discord` dùng cùng ánh xạ để chuyển tuyến trả lời của phiên đang hoạt động sang peer kênh đã liên kết khác; xem [Docking kênh](/vi/concepts/channel-docking).
- **`reset`**: chính sách đặt lại chính. `daily` đặt lại vào giờ địa phương `atHour`; `idle` đặt lại sau `idleMinutes`. Khi cấu hình cả hai, mục nào hết hạn trước sẽ thắng. Độ mới đặt lại hằng ngày dùng `sessionStartedAt` của hàng phiên; độ mới đặt lại khi nhàn rỗi dùng `lastInteractionAt`. Các lần ghi nền/sự kiện hệ thống như Heartbeat, đánh thức Cron, thông báo exec và ghi sổ Gateway có thể cập nhật `updatedAt`, nhưng chúng không giữ cho phiên hằng ngày/nhàn rỗi còn mới.
- **`resetByType`**: ghi đè theo từng loại (`direct`, `group`, `thread`). `dm` cũ được chấp nhận làm bí danh cho `direct`.
- **`mainKey`**: trường cũ. Runtime luôn dùng `"main"` cho bucket trò chuyện trực tiếp chính.
- **`agentToAgent.maxPingPongTurns`**: số lượt trả lời qua lại tối đa giữa các tác nhân trong trao đổi tác nhân-với-tác nhân (số nguyên, phạm vi: `0`-`20`, mặc định: `5`). `0` tắt chuỗi ping-pong.
- **`sendPolicy`**: khớp theo `channel`, `chatType` (`direct|group|channel`, với bí danh cũ `dm`), `keyPrefix`, hoặc `rawKeyPrefix`. Lệnh từ chối đầu tiên sẽ thắng.
- **`maintenance`**: dọn dẹp kho phiên + điều khiển lưu giữ.
  - `mode`: `warn` chỉ phát cảnh báo; `enforce` áp dụng dọn dẹp.
  - `pruneAfter`: ngưỡng tuổi cho các mục cũ (mặc định `30d`).
  - `maxEntries`: số mục tối đa trong `sessions.json` (mặc định `500`). Runtime ghi dọn dẹp theo lô với một vùng đệm ngưỡng cao nhỏ cho các giới hạn cỡ sản xuất; `openclaw sessions cleanup --enforce` áp dụng giới hạn ngay lập tức.
  - `rotateBytes`: đã ngừng dùng và bị bỏ qua; `openclaw doctor --fix` xóa nó khỏi cấu hình cũ.
  - `resetArchiveRetention`: thời gian lưu giữ cho kho lưu trữ transcript `*.reset.<timestamp>`. Mặc định là `pruneAfter`; đặt `false` để tắt.
  - `maxDiskBytes`: ngân sách đĩa tùy chọn cho thư mục phiên. Ở chế độ `warn`, nó ghi cảnh báo; ở chế độ `enforce`, nó xóa các artifact/phiên cũ nhất trước.
  - `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp ngân sách. Mặc định là `80%` của `maxDiskBytes`.
- **`threadBindings`**: mặc định toàn cục cho các tính năng phiên gắn với luồng.
  - `enabled`: công tắc mặc định chính (nhà cung cấp có thể ghi đè; Discord dùng `channels.discord.threadBindings.enabled`)
  - `idleHours`: mặc định tự động bỏ tiêu điểm khi không hoạt động, tính bằng giờ (`0` tắt; nhà cung cấp có thể ghi đè)
  - `maxAgeHours`: mặc định tuổi tối đa cứng, tính bằng giờ (`0` tắt; nhà cung cấp có thể ghi đè)
  - `spawnSessions`: cổng mặc định để tạo phiên làm việc gắn với luồng từ `sessions_spawn` và các lần sinh luồng ACP. Mặc định là `true` khi bật ràng buộc luồng; nhà cung cấp/tài khoản có thể ghi đè.
  - `defaultSpawnContext`: ngữ cảnh subagent gốc mặc định cho các lần sinh gắn với luồng (`"fork"` hoặc `"isolated"`). Mặc định là `"fork"`.

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

Thứ tự phân giải (mục cụ thể nhất thắng): tài khoản → kênh → toàn cục. `""` tắt và dừng cascade. `"auto"` suy ra `[{identity.name}]`.

**Biến mẫu:**

| Biến              | Mô tả                  | Ví dụ                       |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Tên mô hình ngắn       | `claude-opus-4-6`           |
| `{modelFull}`     | Định danh mô hình đầy đủ | `anthropic/claude-opus-4-6` |
| `{provider}`      | Tên nhà cung cấp       | `anthropic`                 |
| `{thinkingLevel}` | Mức suy nghĩ hiện tại  | `high`, `low`, `off`        |
| `{identity.name}` | Tên danh tính tác nhân | (giống `"auto"`)            |

Biến không phân biệt chữ hoa/thường. `{think}` là bí danh cho `{thinkingLevel}`.

### Phản ứng xác nhận

- Mặc định là `identity.emoji` của tác nhân đang hoạt động, nếu không thì `"👀"`. Đặt `""` để tắt.
- Ghi đè theo kênh: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Thứ tự phân giải: tài khoản → kênh → `messages.ackReaction` → dự phòng danh tính.
- Phạm vi: `group-mentions` (mặc định), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: xóa phản ứng xác nhận sau khi trả lời trên các kênh hỗ trợ phản ứng như Slack, Discord, Telegram, WhatsApp và iMessage.
- `messages.statusReactions.enabled`: bật phản ứng trạng thái vòng đời trên Slack, Discord và Telegram.
  Trên Slack và Discord, khi chưa đặt thì phản ứng trạng thái vẫn bật khi phản ứng xác nhận đang hoạt động.
  Trên Telegram, hãy đặt rõ thành `true` để bật phản ứng trạng thái vòng đời.

### Chống dội đầu vào

Gộp các tin nhắn chỉ có văn bản được gửi nhanh từ cùng một người gửi vào một lượt tác nhân duy nhất. Phương tiện/tệp đính kèm sẽ flush ngay lập tức. Lệnh điều khiển bỏ qua chống dội.

### TTS (chuyển văn bản thành giọng nói)

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

- `auto` điều khiển chế độ tự động TTS mặc định: `off`, `always`, `inbound`, hoặc `tagged`. `/tts on|off` có thể ghi đè tùy chọn cục bộ, và `/tts status` hiển thị trạng thái hiệu lực.
- `summaryModel` ghi đè `agents.defaults.model.primary` cho tóm tắt tự động.
- `modelOverrides` được bật theo mặc định; `modelOverrides.allowProvider` mặc định là `false` (chọn tham gia).
- Khóa API dự phòng về `ELEVENLABS_API_KEY`/`XI_API_KEY` và `OPENAI_API_KEY`.
- Các nhà cung cấp giọng nói đóng gói thuộc sở hữu Plugin. Nếu đặt `plugins.allow`, hãy bao gồm từng Plugin nhà cung cấp TTS bạn muốn dùng, ví dụ `microsoft` cho Edge TTS. Id nhà cung cấp cũ `edge` được chấp nhận làm bí danh cho `microsoft`.
- `providers.openai.baseUrl` ghi đè endpoint OpenAI TTS. Thứ tự phân giải là cấu hình, sau đó `OPENAI_TTS_BASE_URL`, rồi `https://api.openai.com/v1`.
- Khi `providers.openai.baseUrl` trỏ tới endpoint không phải OpenAI, OpenClaw coi nó là máy chủ TTS tương thích OpenAI và nới lỏng xác thực mô hình/giọng nói.

---

## Talk

Mặc định cho chế độ Talk (macOS/iOS/Android).

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
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` phải khớp với một khóa trong `talk.providers` khi cấu hình nhiều nhà cung cấp Talk.
- Các khóa Talk phẳng cũ (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) chỉ để tương thích. Chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu vào `talk.providers.<provider>`.
- Voice ID dự phòng về `ELEVENLABS_VOICE_ID` hoặc `SAG_VOICE_ID`.
- `providers.*.apiKey` chấp nhận chuỗi văn bản thuần hoặc đối tượng SecretRef.
- Dự phòng `ELEVENLABS_API_KEY` chỉ áp dụng khi chưa cấu hình khóa API Talk.
- `providers.*.voiceAliases` cho phép chỉ thị Talk dùng tên thân thiện.
- `providers.mlx.modelId` chọn repo Hugging Face được helper MLX cục bộ trên macOS sử dụng. Nếu bỏ qua, macOS dùng `mlx-community/Soprano-80M-bf16`.
- Phát lại MLX trên macOS chạy qua helper `openclaw-mlx-tts` đóng gói khi có, hoặc một tệp thực thi trên `PATH`; `OPENCLAW_MLX_TTS_BIN` ghi đè đường dẫn helper cho phát triển.
- `consultThinkingLevel` điều khiển mức suy nghĩ cho toàn bộ lần chạy tác nhân OpenClaw phía sau các lệnh gọi Control UI Talk realtime `openclaw_agent_consult`. Để trống để giữ nguyên hành vi phiên/mô hình bình thường.
- `consultFastMode` đặt ghi đè chế độ nhanh một lần cho các lần consult Control UI Talk realtime mà không thay đổi thiết lập chế độ nhanh bình thường của phiên.
- `speechLocale` đặt id locale BCP 47 dùng cho nhận dạng giọng nói Talk trên iOS/macOS. Để trống để dùng mặc định của thiết bị.
- `silenceTimeoutMs` điều khiển thời gian chế độ Talk chờ sau khi người dùng im lặng trước khi gửi transcript. Khi chưa đặt, cửa sổ tạm dừng mặc định của nền tảng được giữ nguyên (`700 ms trên macOS và Android, 900 ms trên iOS`).
- `realtime.instructions` nối thêm hướng dẫn hệ thống dành cho nhà cung cấp vào prompt realtime tích hợp của OpenClaw, để có thể cấu hình phong cách giọng nói mà không mất hướng dẫn mặc định `openclaw_agent_consult`.

---

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — tất cả khóa cấu hình khác
- [Cấu hình](/vi/gateway/configuration) — tác vụ phổ biến và thiết lập nhanh
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
