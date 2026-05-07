---
read_when:
    - Tinh chỉnh các mặc định của tác tử (mô hình, suy luận, không gian làm việc, Heartbeat, phương tiện, Skills)
    - Cấu hình định tuyến và liên kết đa tác nhân
    - Điều chỉnh phiên, cách gửi tin nhắn và hành vi chế độ trò chuyện
summary: Mặc định của tác nhân, định tuyến đa tác nhân, phiên, tin nhắn và cấu hình trò chuyện
title: Cấu hình — tác nhân
x-i18n:
    generated_at: "2026-05-07T13:16:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 287b832cda451900ff184546ee38313e1304ffc9bb52bacae6b1f457c64f4c08
    source_path: gateway/config-agents.md
    workflow: 16
---

Các khóa cấu hình theo phạm vi tác tử dưới `agents.*`, `multiAgent.*`, `session.*`,
`messages.*`, và `talk.*`. Với kênh, công cụ, runtime Gateway, và các khóa
cấp cao nhất khác, xem [Tài liệu tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Mặc định của tác tử

### `agents.defaults.workspace`

Mặc định: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Gốc kho lưu trữ tùy chọn được hiển thị trong dòng Runtime của lời nhắc hệ thống. Nếu không đặt, OpenClaw tự động phát hiện bằng cách đi ngược lên từ không gian làm việc.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Danh sách cho phép Skills mặc định tùy chọn cho các tác tử không đặt
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
- Bỏ qua `agents.list[].skills` để kế thừa các giá trị mặc định.
- Đặt `agents.list[].skills: []` để không có Skills.
- Danh sách `agents.list[].skills` không rỗng là tập cuối cùng cho tác tử đó; nó
  không hợp nhất với các giá trị mặc định.

### `agents.defaults.skipBootstrap`

Tắt tự động tạo các tệp khởi tạo không gian làm việc (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Bỏ qua việc tạo các tệp không gian làm việc tùy chọn đã chọn trong khi vẫn ghi các tệp khởi tạo bắt buộc. Giá trị hợp lệ: `SOUL.md`, `USER.md`, `HEARTBEAT.md`, và `IDENTITY.md`.

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

Kiểm soát thời điểm các tệp khởi tạo không gian làm việc được chèn vào lời nhắc hệ thống. Mặc định: `"always"`.

- `"continuation-skip"`: các lượt tiếp tục an toàn (sau một phản hồi trợ lý đã hoàn tất) bỏ qua việc chèn lại khởi tạo không gian làm việc, giảm kích thước lời nhắc. Các lượt chạy Heartbeat và thử lại sau Compaction vẫn dựng lại ngữ cảnh.
- `"never"`: tắt khởi tạo không gian làm việc và chèn tệp ngữ cảnh trong mọi lượt. Chỉ dùng tùy chọn này cho các tác tử hoàn toàn tự quản lý vòng đời lời nhắc của chúng (engine ngữ cảnh tùy chỉnh, runtime gốc tự xây dựng ngữ cảnh riêng, hoặc quy trình chuyên biệt không dùng bootstrap). Các lượt Heartbeat và khôi phục Compaction cũng bỏ qua việc chèn.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Số ký tự tối đa cho mỗi tệp khởi tạo không gian làm việc trước khi cắt ngắn. Mặc định: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tổng số ký tự tối đa được chèn trên tất cả các tệp khởi tạo không gian làm việc. Mặc định: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kiểm soát thông báo trong lời nhắc hệ thống mà tác tử nhìn thấy khi ngữ cảnh khởi tạo bị cắt ngắn.
Mặc định: `"once"`.

- `"off"`: không bao giờ chèn văn bản thông báo cắt ngắn vào lời nhắc hệ thống.
- `"once"`: chèn thông báo ngắn gọn một lần cho mỗi chữ ký cắt ngắn duy nhất (khuyến nghị).
- `"always"`: chèn thông báo ngắn gọn trong mỗi lần chạy khi có cắt ngắn.

Số đếm thô/đã chèn chi tiết và các trường tinh chỉnh cấu hình vẫn nằm trong chẩn đoán như báo cáo ngữ cảnh/trạng thái và nhật ký; ngữ cảnh người dùng/runtime WebChat thông thường chỉ nhận thông báo khôi phục ngắn gọn.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bản đồ quyền sở hữu ngân sách ngữ cảnh

OpenClaw có nhiều ngân sách lời nhắc/ngữ cảnh dung lượng lớn, và chúng được
cố ý tách theo hệ thống con thay vì tất cả đi qua một núm điều khiển chung.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  chèn khởi tạo không gian làm việc thông thường.
- `agents.defaults.startupContext.*`:
  phần mở đầu chạy mô hình một lần khi đặt lại/khởi động, bao gồm các tệp
  `memory/*.md` hằng ngày gần đây. Các lệnh trò chuyện trần `/new` và `/reset`
  được xác nhận mà không gọi mô hình.
- `skills.limits.*`:
  danh sách Skills rút gọn được chèn vào lời nhắc hệ thống.
- `agents.defaults.contextLimits.*`:
  các đoạn trích runtime có giới hạn và các khối do runtime sở hữu được chèn.
- `memory.qmd.limits.*`:
  đoạn trích tìm kiếm bộ nhớ đã lập chỉ mục và kích thước chèn.

Chỉ dùng ghi đè theo tác tử tương ứng khi một tác tử cần ngân sách khác:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kiểm soát phần mở đầu khởi động lượt đầu được chèn vào các lần chạy mô hình đặt lại/khởi động.
Các lệnh trò chuyện trần `/new` và `/reset` xác nhận việc đặt lại mà không gọi
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

Các giá trị mặc định dùng chung cho các bề mặt ngữ cảnh runtime có giới hạn.

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

- `memoryGetMaxChars`: giới hạn đoạn trích `memory_get` mặc định trước khi siêu dữ liệu cắt ngắn
  và thông báo tiếp tục được thêm vào.
- `memoryGetDefaultLines`: cửa sổ dòng `memory_get` mặc định khi `lines` bị
  bỏ qua.
- `toolResultMaxChars`: giới hạn kết quả công cụ trực tiếp dùng cho kết quả đã lưu và
  khôi phục tràn.
- `postCompactionMaxChars`: giới hạn đoạn trích AGENTS.md dùng trong quá trình chèn làm mới
  sau Compaction.

#### `agents.list[].contextLimits`

Ghi đè theo tác tử cho các núm `contextLimits` dùng chung. Các trường bị bỏ qua kế thừa
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

Giới hạn toàn cục cho danh sách Skills rút gọn được chèn vào lời nhắc hệ thống. Điều này
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

Ghi đè theo tác tử cho ngân sách lời nhắc Skills.

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

Kích thước pixel tối đa cho cạnh dài nhất của ảnh trong các khối ảnh transcript/công cụ trước khi gọi nhà cung cấp.
Mặc định: `1200`.

Giá trị thấp hơn thường giảm mức dùng token thị giác và kích thước payload yêu cầu cho các lần chạy nhiều ảnh chụp màn hình.
Giá trị cao hơn giữ lại nhiều chi tiết hình ảnh hơn.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Múi giờ cho ngữ cảnh lời nhắc hệ thống (không phải dấu thời gian tin nhắn). Dự phòng về múi giờ máy chủ.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Định dạng thời gian trong lời nhắc hệ thống. Mặc định: `auto` (tùy chọn hệ điều hành).

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
      },
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
  - Cũng được dùng làm định tuyến dự phòng khi mô hình được chọn/mặc định không thể nhận đầu vào hình ảnh.
  - Ưu tiên tham chiếu `provider/model` rõ ràng. ID trần được chấp nhận để tương thích; nếu một ID trần khớp duy nhất với một mục có khả năng xử lý hình ảnh đã cấu hình trong `models.providers.*.models`, OpenClaw sẽ gán nó cho nhà cung cấp đó. Các kết quả khớp đã cấu hình nhưng mơ hồ yêu cầu tiền tố nhà cung cấp rõ ràng.
- `imageGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được dùng bởi khả năng tạo hình ảnh dùng chung và mọi bề mặt công cụ/plugin trong tương lai tạo ra hình ảnh.
  - Giá trị thường dùng: `google/gemini-3.1-flash-image-preview` cho tạo hình ảnh Gemini gốc, `fal/fal-ai/flux/dev` cho fal, `openai/gpt-image-2` cho OpenAI Images, hoặc `openai/gpt-image-1.5` cho đầu ra OpenAI PNG/WebP nền trong suốt.
  - Nếu bạn chọn trực tiếp một nhà cung cấp/mô hình, cũng hãy cấu hình xác thực nhà cung cấp tương ứng (ví dụ `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` cho `google/*`, `OPENAI_API_KEY` hoặc OpenAI Codex OAuth cho `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` cho `fal/*`).
  - Nếu bỏ qua, `image_generate` vẫn có thể suy luận mặc định nhà cung cấp dựa trên xác thực. Nó thử nhà cung cấp mặc định hiện tại trước, sau đó đến các nhà cung cấp tạo hình ảnh đã đăng ký còn lại theo thứ tự provider-id.
- `musicGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được dùng bởi khả năng tạo nhạc dùng chung và công cụ tích hợp sẵn `music_generate`.
  - Giá trị thường dùng: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, hoặc `minimax/music-2.6`.
  - Nếu bỏ qua, `music_generate` vẫn có thể suy luận mặc định nhà cung cấp dựa trên xác thực. Nó thử nhà cung cấp mặc định hiện tại trước, sau đó đến các nhà cung cấp tạo nhạc đã đăng ký còn lại theo thứ tự provider-id.
  - Nếu bạn chọn trực tiếp một nhà cung cấp/mô hình, cũng hãy cấu hình xác thực/khóa API của nhà cung cấp tương ứng.
- `videoGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được dùng bởi khả năng tạo video dùng chung và công cụ tích hợp sẵn `video_generate`.
  - Giá trị thường dùng: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, hoặc `qwen/wan2.7-r2v`.
  - Nếu bỏ qua, `video_generate` vẫn có thể suy luận mặc định nhà cung cấp dựa trên xác thực. Nó thử nhà cung cấp mặc định hiện tại trước, sau đó đến các nhà cung cấp tạo video đã đăng ký còn lại theo thứ tự provider-id.
  - Nếu bạn chọn trực tiếp một nhà cung cấp/mô hình, cũng hãy cấu hình xác thực/khóa API của nhà cung cấp tương ứng.
  - Nhà cung cấp tạo video Qwen đi kèm hỗ trợ tối đa 1 video đầu ra, 1 hình ảnh đầu vào, 4 video đầu vào, thời lượng 10 giây, và các tùy chọn cấp nhà cung cấp `size`, `aspectRatio`, `resolution`, `audio`, và `watermark`.
- `pdfModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được công cụ `pdf` dùng để định tuyến mô hình.
  - Nếu bỏ qua, công cụ PDF sẽ dự phòng sang `imageModel`, rồi đến mô hình phiên/mặc định đã phân giải.
- `pdfMaxBytesMb`: giới hạn kích thước PDF mặc định cho công cụ `pdf` khi `maxBytesMb` không được truyền tại thời điểm gọi.
- `pdfMaxPages`: số trang tối đa mặc định được chế độ dự phòng trích xuất trong công cụ `pdf` xét đến.
- `verboseDefault`: mức chi tiết mặc định cho tác nhân. Giá trị: `"off"`, `"on"`, `"full"`. Mặc định: `"off"`.
- `toolProgressDetail`: chế độ chi tiết cho tóm tắt công cụ `/verbose` và các dòng công cụ nháp tiến trình. Giá trị: `"explain"` (mặc định, nhãn ngắn gọn cho người dùng) hoặc `"raw"` (đính kèm lệnh/chi tiết thô khi có). `agents.list[].toolProgressDetail` theo từng tác nhân ghi đè mặc định này.
- `reasoningDefault`: khả năng hiển thị suy luận mặc định cho tác nhân. Giá trị: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` theo từng tác nhân ghi đè mặc định này. Mặc định suy luận đã cấu hình chỉ được áp dụng cho chủ sở hữu, người gửi được ủy quyền, hoặc ngữ cảnh Gateway quản trị viên vận hành khi không đặt ghi đè suy luận theo tin nhắn hoặc phiên.
- `elevatedDefault`: mức đầu ra nâng cao mặc định cho tác nhân. Giá trị: `"off"`, `"on"`, `"ask"`, `"full"`. Mặc định: `"on"`.
- `model.primary`: định dạng `provider/model` (ví dụ `openai/gpt-5.5` cho khóa API OpenAI hoặc truy cập Codex OAuth). Nếu bạn bỏ qua nhà cung cấp, OpenClaw sẽ thử alias trước, rồi đến một kết quả khớp nhà cung cấp đã cấu hình duy nhất cho đúng model id đó, và chỉ sau đó mới dự phòng về nhà cung cấp mặc định đã cấu hình (hành vi tương thích đã lỗi thời, vì vậy hãy ưu tiên `provider/model` rõ ràng). Nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw sẽ dự phòng về nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị mặc định nhà cung cấp đã bị xóa và lỗi thời.
- `models`: danh mục mô hình đã cấu hình và danh sách cho phép cho `/model`. Mỗi mục có thể bao gồm `alias` (lối tắt) và `params` (riêng theo nhà cung cấp, ví dụ `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Chỉnh sửa an toàn: dùng `openclaw config set agents.defaults.models '<json>' --strict-json --merge` để thêm mục. `config set` từ chối các thay thế sẽ xóa mục danh sách cho phép hiện có, trừ khi bạn truyền `--replace`.
  - Các luồng cấu hình/onboarding theo phạm vi nhà cung cấp sẽ hợp nhất các mô hình nhà cung cấp đã chọn vào bản đồ này và giữ nguyên các nhà cung cấp không liên quan đã được cấu hình.
  - Với các mô hình OpenAI Responses trực tiếp, Compaction phía máy chủ được bật tự động. Dùng `params.responsesServerCompaction: false` để ngừng chèn `context_management`, hoặc `params.responsesCompactThreshold` để ghi đè ngưỡng. Xem [Compaction phía máy chủ OpenAI](/vi/providers/openai#server-side-compaction-responses-api).
- `params`: tham số nhà cung cấp mặc định toàn cục áp dụng cho tất cả mô hình. Đặt tại `agents.defaults.params` (ví dụ `{ cacheRetention: "long" }`).
- Thứ tự ưu tiên hợp nhất `params` (cấu hình): `agents.defaults.params` (nền toàn cục) bị ghi đè bởi `agents.defaults.models["provider/model"].params` (theo mô hình), rồi `agents.list[].params` (khớp id tác nhân) ghi đè theo khóa. Xem [Prompt Caching](/vi/reference/prompt-caching) để biết chi tiết.
- `params.extra_body`/`params.extraBody`: JSON truyền qua nâng cao được hợp nhất vào thân yêu cầu `api: "openai-completions"` cho proxy tương thích OpenAI. Nếu nó va chạm với các khóa yêu cầu được tạo, phần thân bổ sung sẽ thắng; các tuyến completions không phải gốc vẫn loại bỏ `store` chỉ dành cho OpenAI sau đó.
- `params.chat_template_kwargs`: đối số mẫu chat tương thích vLLM/OpenAI được hợp nhất vào thân yêu cầu `api: "openai-completions"` cấp cao nhất. Với `vllm/nemotron-3-*` khi tắt thinking, plugin vLLM đi kèm tự động gửi `enable_thinking: false` và `force_nonempty_content: true`; `chat_template_kwargs` rõ ràng ghi đè các mặc định được tạo, và `extra_body.chat_template_kwargs` vẫn có quyền ưu tiên cuối cùng. Với điều khiển thinking của vLLM Qwen, đặt `params.qwenThinkingFormat` thành `"chat-template"` hoặc `"top-level"` trên mục mô hình đó.
- `compat.supportedReasoningEfforts`: danh sách nỗ lực suy luận tương thích OpenAI theo mô hình. Bao gồm `"xhigh"` cho các endpoint tùy chỉnh thực sự chấp nhận nó; khi đó OpenClaw hiển thị `/think xhigh` trong menu lệnh, các hàng phiên Gateway, xác thực bản vá phiên, xác thực CLI tác nhân, và xác thực `llm-task` cho nhà cung cấp/mô hình đã cấu hình đó. Dùng `compat.reasoningEffortMap` khi backend muốn một giá trị riêng theo nhà cung cấp cho một mức chuẩn.
- `params.preserveThinking`: tùy chọn chỉ dành cho Z.AI để giữ lại thinking. Khi bật và thinking đang bật, OpenClaw gửi `thinking.clear_thinking: false` và phát lại `reasoning_content` trước đó; xem [thinking và thinking được giữ lại của Z.AI](/vi/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: chính sách runtime tác nhân cấp thấp mặc định. id bị bỏ qua mặc định là OpenClaw Pi. Dùng `id: "pi"` để ép harness PI tích hợp sẵn, `id: "auto"` để cho phép các harness plugin đã đăng ký nhận các mô hình được hỗ trợ và dùng PI khi không có harness nào khớp, một id harness đã đăng ký như `id: "codex"` để yêu cầu harness đó, hoặc một alias backend CLI được hỗ trợ như `id: "claude-cli"`. Runtime plugin rõ ràng sẽ đóng kín khi harness không có sẵn hoặc thất bại. Giữ tham chiếu mô hình chuẩn ở dạng `provider/model`; chọn Codex, Claude CLI, Gemini CLI, và các backend thực thi khác thông qua cấu hình runtime thay vì các tiền tố nhà cung cấp runtime cũ. Xem [Runtime tác nhân](/vi/concepts/agent-runtimes) để biết điểm khác biệt với lựa chọn nhà cung cấp/mô hình.
- Trình ghi cấu hình thay đổi các trường này (ví dụ `/models set`, `/models set-image`, và các lệnh thêm/xóa dự phòng) lưu dạng đối tượng chuẩn và giữ lại danh sách dự phòng hiện có khi có thể.
- `maxConcurrent`: số lượt chạy tác nhân song song tối đa trên các phiên (mỗi phiên vẫn được tuần tự hóa). Mặc định: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` kiểm soát trình thực thi cấp thấp nào chạy các lượt tác nhân. Hầu hết
triển khai nên giữ runtime OpenClaw Pi mặc định. Dùng nó khi một
plugin đáng tin cậy cung cấp harness gốc, chẳng hạn harness app-server Codex đi kèm,
hoặc khi bạn muốn một backend CLI được hỗ trợ như Claude CLI. Để có mô hình tư duy,
xem [Runtime tác nhân](/vi/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, một id harness plugin đã đăng ký, hoặc một alias backend CLI được hỗ trợ. Plugin Codex đi kèm đăng ký `codex`; plugin Anthropic đi kèm cung cấp backend CLI `claude-cli`.
- `id: "auto"` cho phép các harness plugin đã đăng ký nhận các lượt được hỗ trợ và dùng PI khi không có harness nào khớp. Một runtime plugin rõ ràng như `id: "codex"` yêu cầu harness đó và đóng kín nếu nó không có sẵn hoặc thất bại.
- Ghi đè môi trường: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` ghi đè `id` cho tiến trình đó.
- Các mô hình tác nhân OpenAI dùng harness Codex theo mặc định; `agentRuntime.id: "codex"` vẫn hợp lệ khi bạn muốn nêu rõ điều đó.
- Với triển khai Claude CLI, ưu tiên `model: "anthropic/claude-opus-4-7"` cộng với `agentRuntime.id: "claude-cli"`. Tham chiếu mô hình cũ `claude-cli/claude-opus-4-7` vẫn hoạt động để tương thích, nhưng cấu hình mới nên giữ lựa chọn nhà cung cấp/mô hình ở dạng chuẩn và đặt backend thực thi trong `agentRuntime.id`.
- Các khóa chính sách runtime cũ được `openclaw doctor --fix` viết lại thành `agentRuntime`.
- Lựa chọn harness được ghim theo id phiên sau lượt chạy nhúng đầu tiên. Thay đổi cấu hình/env ảnh hưởng đến phiên mới hoặc phiên đặt lại, không ảnh hưởng transcript hiện có. Các phiên OpenAI cũ có lịch sử transcript nhưng không có ghim đã ghi sẽ dùng Codex; các ghim OpenAI PI lỗi thời có thể được sửa bằng `openclaw doctor --fix`. `/status` báo cáo runtime hiệu lực, ví dụ `Runtime: OpenClaw Pi Default` hoặc `Runtime: OpenAI Codex`.
- Điều này chỉ kiểm soát thực thi lượt tác nhân văn bản. Tạo media, thị giác, PDF, nhạc, video, và TTS vẫn dùng cài đặt nhà cung cấp/mô hình của chúng.

**Lối tắt alias tích hợp sẵn** (chỉ áp dụng khi mô hình nằm trong `agents.defaults.models`):

| Alias               | Mô hình                                |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Các alias bạn cấu hình luôn được ưu tiên hơn mặc định.

Các mô hình Z.AI GLM-4.x tự động bật chế độ suy nghĩ trừ khi bạn đặt `--thinking off` hoặc tự định nghĩa `agents.defaults.models["zai/<model>"].params.thinking`.
Các mô hình Z.AI mặc định bật `tool_stream` cho phát luồng lời gọi công cụ. Đặt `agents.defaults.models["zai/<model>"].params.tool_stream` thành `false` để tắt tính năng này.
Các mô hình Anthropic Claude 4.6 mặc định dùng suy nghĩ `adaptive` khi không đặt mức suy nghĩ rõ ràng.

### `agents.defaults.cliBackends`

Các backend CLI tùy chọn cho các lần chạy dự phòng chỉ dùng văn bản (không có lời gọi công cụ). Hữu ích làm phương án dự phòng khi nhà cung cấp API gặp lỗi.

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
- Hỗ trợ truyền hình ảnh xuyên suốt khi `imageArg` chấp nhận đường dẫn tệp.

### `agents.defaults.systemPromptOverride`

Thay toàn bộ system prompt do OpenClaw lắp ráp bằng một chuỗi cố định. Đặt ở cấp mặc định (`agents.defaults.systemPromptOverride`) hoặc theo từng agent (`agents.list[].systemPromptOverride`). Giá trị theo agent được ưu tiên; giá trị rỗng hoặc chỉ gồm khoảng trắng sẽ bị bỏ qua. Hữu ích cho các thử nghiệm prompt có kiểm soát.

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

Các lớp phủ prompt độc lập với nhà cung cấp được áp dụng theo họ mô hình. ID mô hình thuộc họ GPT-5 nhận hợp đồng hành vi dùng chung trên nhiều nhà cung cấp; `personality` chỉ điều khiển lớp phong cách tương tác thân thiện.

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
- `timeoutSeconds`: thời gian tối đa tính bằng giây được phép cho một lượt agent Heartbeat trước khi bị hủy. Để trống để dùng `agents.defaults.timeoutSeconds`.
- `directPolicy`: chính sách gửi trực tiếp/DM. `allow` (mặc định) cho phép gửi tới mục tiêu trực tiếp. `block` chặn gửi tới mục tiêu trực tiếp và phát ra `reason=dm-blocked`.
- `lightContext`: khi là true, các lần chạy Heartbeat dùng ngữ cảnh bootstrap nhẹ và chỉ giữ `HEARTBEAT.md` từ các tệp bootstrap của workspace.
- `isolatedSession`: khi là true, mỗi Heartbeat chạy trong một phiên mới không có lịch sử hội thoại trước đó. Cùng mẫu cô lập như cron `sessionTarget: "isolated"`. Giảm chi phí token cho mỗi Heartbeat từ khoảng 100K xuống khoảng 2-5K token.
- `skipWhenBusy`: khi là true, các lần chạy Heartbeat sẽ hoãn trên các làn bận bổ sung: công việc subagent hoặc lệnh lồng nhau. Các làn Cron luôn hoãn Heartbeat, ngay cả khi không có cờ này.
- Theo agent: đặt `agents.list[].heartbeat`. Khi bất kỳ agent nào định nghĩa `heartbeat`, **chỉ các agent đó** chạy Heartbeat.
- Heartbeat chạy các lượt agent đầy đủ — khoảng cách ngắn hơn tiêu tốn nhiều token hơn.

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

- `mode`: `default` hoặc `safeguard` (tóm tắt theo từng đoạn cho lịch sử dài). Xem [Compaction](/vi/concepts/compaction).
- `provider`: ID của một Plugin cung cấp compaction đã đăng ký. Khi được đặt, `summarize()` của nhà cung cấp được gọi thay vì tóm tắt LLM tích hợp. Nếu thất bại sẽ quay về tích hợp. Đặt nhà cung cấp sẽ buộc `mode: "safeguard"`. Xem [Compaction](/vi/concepts/compaction).
- `timeoutSeconds`: số giây tối đa được phép cho một thao tác compaction trước khi OpenClaw hủy thao tác đó. Mặc định: `900`.
- `keepRecentTokens`: ngân sách điểm cắt Pi để giữ nguyên văn phần đuôi transcript gần nhất. `/compact` thủ công tôn trọng giá trị này khi được đặt rõ ràng; nếu không, compaction thủ công là một checkpoint cứng.
- `identifierPolicy`: `strict` (mặc định), `off`, hoặc `custom`. `strict` thêm hướng dẫn tích hợp về giữ lại định danh mờ trong quá trình tóm tắt compaction.
- `identifierInstructions`: văn bản tùy chỉnh tùy chọn để bảo toàn định danh, dùng khi `identifierPolicy=custom`.
- `qualityGuard`: kiểm tra thử lại khi đầu ra sai định dạng cho các bản tóm tắt safeguard. Được bật mặc định trong chế độ safeguard; đặt `enabled: false` để bỏ qua kiểm toán.
- `midTurnPrecheck`: kiểm tra áp lực vòng lặp công cụ Pi tùy chọn. Khi `enabled: true`, OpenClaw kiểm tra áp lực ngữ cảnh sau khi kết quả công cụ được thêm vào và trước lời gọi mô hình tiếp theo. Nếu ngữ cảnh không còn vừa, OpenClaw hủy lần thử hiện tại trước khi gửi prompt và tái sử dụng đường khôi phục precheck hiện có để cắt bớt kết quả công cụ hoặc compaction rồi thử lại. Hoạt động với cả hai chế độ compaction `default` và `safeguard`. Mặc định: tắt.
- `postCompactionSections`: tên phần H2/H3 tùy chọn trong AGENTS.md để chèn lại sau compaction. Mặc định là `["Session Startup", "Red Lines"]`; đặt `[]` để tắt chèn lại. Khi chưa đặt hoặc được đặt rõ ràng thành cặp mặc định đó, các tiêu đề `Every Session`/`Safety` cũ cũng được chấp nhận làm phương án dự phòng kế thừa.
- `model`: ghi đè `provider/model-id` tùy chọn chỉ cho tóm tắt compaction. Dùng tùy chọn này khi phiên chính nên giữ một mô hình nhưng bản tóm tắt compaction nên chạy trên mô hình khác; khi chưa đặt, compaction dùng mô hình chính của phiên.
- `maxActiveTranscriptBytes`: ngưỡng byte tùy chọn (`number` hoặc chuỗi như `"20mb"`) kích hoạt compaction cục bộ thông thường trước một lần chạy khi JSONL đang hoạt động vượt quá ngưỡng. Yêu cầu `truncateAfterCompaction` để compaction thành công có thể xoay sang transcript kế tiếp nhỏ hơn. Bị tắt khi chưa đặt hoặc bằng `0`.
- `notifyUser`: khi là `true`, gửi thông báo ngắn cho người dùng khi compaction bắt đầu và khi hoàn tất (ví dụ: "Compacting context..." và "Compaction complete"). Mặc định tắt để giữ compaction im lặng.
- `memoryFlush`: lượt agentic im lặng trước auto-compaction để lưu trữ ký ức bền vững. Đặt `model` thành một nhà cung cấp/mô hình chính xác như `ollama/qwen3:8b` khi lượt dọn dẹp này nên ở trên mô hình cục bộ; ghi đè này không kế thừa chuỗi dự phòng của phiên đang hoạt động. Bỏ qua khi workspace ở chế độ chỉ đọc.

### `agents.defaults.contextPruning`

Cắt tỉa **kết quả công cụ cũ** khỏi ngữ cảnh trong bộ nhớ trước khi gửi tới LLM. **Không** sửa đổi lịch sử phiên trên đĩa.

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
- Cắt tỉa trước tiên cắt mềm các kết quả công cụ quá lớn, rồi xóa cứng các kết quả công cụ cũ hơn nếu cần.

**Cắt mềm** giữ phần đầu + phần cuối và chèn `...` ở giữa.

**Xóa cứng** thay toàn bộ kết quả công cụ bằng placeholder.

Ghi chú:

- Các khối hình ảnh không bao giờ bị cắt/xóa.
- Tỷ lệ dựa trên ký tự (xấp xỉ), không phải số token chính xác.
- Nếu có ít hơn `keepLastAssistants` thông điệp assistant, việc cắt tỉa sẽ bị bỏ qua.

</Accordion>

Xem [Cắt Tỉa Phiên](/vi/concepts/session-pruning) để biết chi tiết hành vi.

### Phát luồng khối

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

- Các kênh không phải Telegram cần `*.blockStreaming: true` rõ ràng để bật trả lời theo khối.
- Ghi đè theo kênh: `channels.<channel>.blockStreamingCoalesce` (và các biến thể theo từng tài khoản). Signal/Slack/Discord/Google Chat mặc định `minChars: 1500`.
- `humanDelay`: khoảng dừng ngẫu nhiên giữa các trả lời theo khối. `natural` = 800–2500ms. Ghi đè theo agent: `agents.list[].humanDelay`.

Xem [Phát Luồng](/vi/concepts/streaming) để biết hành vi và chi tiết chia đoạn.

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

- Mặc định: `instant` cho cuộc trò chuyện trực tiếp/lượt nhắc đến, `message` cho cuộc trò chuyện nhóm không nhắc đến.
- Ghi đè theo phiên: `session.typingMode`, `session.typingIntervalSeconds`.

Xem [Chỉ báo nhập liệu](/vi/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Cách ly tùy chọn cho agent nhúng. Xem [Cách ly bằng sandbox](/vi/gateway/sandboxing) để đọc hướng dẫn đầy đủ.

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

**Phần nền:**

- `docker`: môi trường chạy Docker cục bộ (mặc định)
- `ssh`: môi trường chạy từ xa chung dựa trên SSH
- `openshell`: môi trường chạy OpenShell

Khi chọn `backend: "openshell"`, các thiết lập riêng cho môi trường chạy sẽ chuyển sang
`plugins.entries.openshell.config`.

**Cấu hình phần nền SSH:**

- `target`: đích SSH ở dạng `user@host[:port]`
- `command`: lệnh máy khách SSH (mặc định: `ssh`)
- `workspaceRoot`: gốc từ xa tuyệt đối dùng cho workspace theo từng phạm vi
- `identityFile` / `certificateFile` / `knownHostsFile`: các tệp cục bộ hiện có được truyền cho OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: nội dung nội tuyến hoặc SecretRefs mà OpenClaw hiện thực hóa thành tệp tạm tại thời điểm chạy
- `strictHostKeyChecking` / `updateHostKeys`: các núm điều chỉnh chính sách khóa máy chủ OpenSSH

**Thứ tự ưu tiên xác thực SSH:**

- `identityData` ưu tiên hơn `identityFile`
- `certificateData` ưu tiên hơn `certificateFile`
- `knownHostsData` ưu tiên hơn `knownHostsFile`
- Các giá trị `*Data` dựa trên SecretRef được phân giải từ ảnh chụp môi trường chạy bí mật đang hoạt động trước khi phiên sandbox bắt đầu

**Hành vi phần nền SSH:**

- gieo workspace từ xa một lần sau khi tạo hoặc tạo lại
- sau đó giữ workspace SSH từ xa làm nguồn chuẩn
- định tuyến `exec`, công cụ tệp và đường dẫn phương tiện qua SSH
- không tự động đồng bộ thay đổi từ xa trở lại máy chủ
- không hỗ trợ container trình duyệt sandbox

**Quyền truy cập workspace:**

- `none`: workspace sandbox theo từng phạm vi dưới `~/.openclaw/sandboxes`
- `ro`: workspace sandbox tại `/workspace`, workspace của agent được gắn chỉ đọc tại `/agent`
- `rw`: workspace của agent được gắn đọc/ghi tại `/workspace`

**Phạm vi:**

- `session`: container + workspace theo từng phiên
- `agent`: một container + workspace cho mỗi agent (mặc định)
- `shared`: container và workspace dùng chung (không cách ly giữa các phiên)

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

- `mirror`: gieo từ xa từ cục bộ trước khi exec, đồng bộ lại sau khi exec; workspace cục bộ vẫn là nguồn chuẩn
- `remote`: gieo từ xa một lần khi sandbox được tạo, sau đó giữ workspace từ xa làm nguồn chuẩn

Ở chế độ `remote`, các chỉnh sửa cục bộ trên máy chủ được thực hiện bên ngoài OpenClaw không được tự động đồng bộ vào sandbox sau bước gieo.
Vận chuyển là SSH vào sandbox OpenShell, nhưng Plugin sở hữu vòng đời sandbox và đồng bộ mirror tùy chọn.

**`setupCommand`** chạy một lần sau khi tạo container (qua `sh -lc`). Cần lưu lượng mạng đi ra, root ghi được, người dùng root.

**Container mặc định dùng `network: "none"`** — đặt thành `"bridge"` (hoặc một mạng bridge tùy chỉnh) nếu agent cần truy cập ra ngoài.
`"host"` bị chặn. `"container:<id>"` mặc định bị chặn trừ khi bạn đặt rõ
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (phá kính khi khẩn cấp).

**Tệp đính kèm đến** được đưa vào `media/inbound/*` trong workspace đang hoạt động.

**`docker.binds`** gắn thêm các thư mục máy chủ; các bind toàn cục và theo agent được hợp nhất.

**Trình duyệt sandbox** (`sandbox.browser.enabled`): Chromium + CDP trong một container. URL noVNC được chèn vào prompt hệ thống. Không yêu cầu `browser.enabled` trong `openclaw.json`.
Quyền truy cập quan sát noVNC mặc định dùng xác thực VNC và OpenClaw phát ra URL token ngắn hạn (thay vì để lộ mật khẩu trong URL dùng chung).

- `allowHostControl: false` (mặc định) chặn các phiên sandbox nhắm đến trình duyệt máy chủ.
- `network` mặc định là `openclaw-sandbox-browser` (mạng bridge chuyên dụng). Chỉ đặt thành `bridge` khi bạn thật sự muốn kết nối bridge toàn cục.
- `cdpSourceRange` tùy chọn giới hạn truy cập CDP vào ở rìa container theo dải CIDR (ví dụ `172.21.0.1/32`).
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
  - `--disable-extensions` (mặc định bật)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, và `--disable-gpu`
    mặc định được bật và có thể tắt bằng
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu việc dùng WebGL/3D yêu cầu.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` bật lại phần mở rộng nếu quy trình làm việc của bạn
    phụ thuộc vào chúng.
  - `--renderer-process-limit=2` có thể thay đổi bằng
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; đặt `0` để dùng giới hạn tiến trình
    mặc định của Chromium.
  - cộng thêm `--no-sandbox` khi bật `noSandbox`.
  - Mặc định là đường cơ sở của ảnh container; dùng ảnh trình duyệt tùy chỉnh với entrypoint tùy chỉnh
    để thay đổi mặc định container.

</Accordion>

Cách ly trình duyệt và `sandbox.docker.binds` chỉ dành cho Docker.

Dựng ảnh (từ một checkout nguồn):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Đối với cài đặt npm không có checkout nguồn, xem [Cách ly bằng sandbox § Ảnh và thiết lập](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` nội tuyến.

### `agents.list` (ghi đè theo agent)

Dùng `agents.list[].tts` để cấp cho agent nhà cung cấp TTS, giọng nói, model,
phong cách hoặc chế độ TTS tự động riêng. Khối agent được hợp nhất sâu lên trên
`messages.tts` toàn cục, nên thông tin xác thực dùng chung có thể nằm ở một nơi trong khi từng
agent chỉ ghi đè các trường giọng nói hoặc nhà cung cấp mà chúng cần. Ghi đè của agent đang hoạt động
áp dụng cho trả lời bằng giọng nói tự động, `/tts audio`, `/tts status`, và
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
        agentRuntime: { id: "auto" },
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

- `id`: id tác nhân ổn định (bắt buộc).
- `default`: khi thiết lập nhiều mục, mục đầu tiên được ưu tiên (ghi cảnh báo). Nếu không thiết lập mục nào, mục đầu tiên trong danh sách là mặc định.
- `model`: dạng chuỗi đặt primary nghiêm ngặt theo từng tác nhân, không có model fallback; dạng đối tượng `{ primary }` cũng nghiêm ngặt trừ khi bạn thêm `fallbacks`. Dùng `{ primary, fallbacks: [...] }` để bật fallback cho tác nhân đó, hoặc `{ primary, fallbacks: [] }` để thể hiện rõ hành vi nghiêm ngặt. Các Cron job chỉ ghi đè `primary` vẫn kế thừa fallback mặc định trừ khi bạn đặt `fallbacks: []`.
- `params`: tham số stream theo từng tác nhân được hợp nhất đè lên mục model đã chọn trong `agents.defaults.models`. Dùng mục này cho các ghi đè riêng của tác nhân như `cacheRetention`, `temperature`, hoặc `maxTokens` mà không cần lặp lại toàn bộ danh mục model.
- `tts`: ghi đè chuyển văn bản thành giọng nói tùy chọn theo từng tác nhân. Khối này deep-merge đè lên `messages.tts`, vì vậy hãy giữ thông tin xác thực nhà cung cấp dùng chung và chính sách fallback trong `messages.tts`, rồi chỉ đặt các giá trị riêng theo persona như nhà cung cấp, giọng, model, kiểu, hoặc chế độ tự động tại đây.
- `skills`: allowlist Skills tùy chọn theo từng tác nhân. Nếu bỏ qua, tác nhân kế thừa `agents.defaults.skills` khi được đặt; danh sách tường minh sẽ thay thế mặc định thay vì hợp nhất, và `[]` nghĩa là không có Skills.
- `thinkingDefault`: mức suy nghĩ mặc định tùy chọn theo từng tác nhân (`off | minimal | low | medium | high | xhigh | adaptive | max`). Ghi đè `agents.defaults.thinkingDefault` cho tác nhân này khi không có ghi đè theo từng tin nhắn hoặc phiên. Hồ sơ nhà cung cấp/model đã chọn kiểm soát những giá trị nào hợp lệ; với Google Gemini, `adaptive` giữ cơ chế suy nghĩ động do nhà cung cấp sở hữu (`thinkingLevel` bị bỏ qua trên Gemini 3/3.1, `thinkingBudget: -1` trên Gemini 2.5).
- `reasoningDefault`: khả năng hiển thị suy luận mặc định tùy chọn theo từng tác nhân (`on | off | stream`). Ghi đè `agents.defaults.reasoningDefault` cho tác nhân này khi không có ghi đè suy luận theo từng tin nhắn hoặc phiên.
- `fastModeDefault`: mặc định tùy chọn theo từng tác nhân cho chế độ nhanh (`true | false`). Áp dụng khi không có ghi đè chế độ nhanh theo từng tin nhắn hoặc phiên.
- `agentRuntime`: ghi đè chính sách runtime cấp thấp tùy chọn theo từng tác nhân. Dùng `{ id: "codex" }` để chỉ định một tác nhân chỉ dùng Codex, trong khi các tác nhân khác vẫn giữ PI fallback mặc định ở chế độ `auto`.
- `runtime`: mô tả runtime tùy chọn theo từng tác nhân. Dùng `type: "acp"` với các mặc định `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) khi tác nhân nên mặc định dùng các phiên harness ACP.
- `identity.avatar`: đường dẫn tương đối theo workspace, URL `http(s)`, hoặc URI `data:`.
- `identity` suy ra các mặc định: `ackReaction` từ `emoji`, `mentionPatterns` từ `name`/`emoji`.
- `subagents.allowAgents`: allowlist id tác nhân cho các đích `sessions_spawn.agentId` tường minh (`["*"]` = bất kỳ; mặc định: chỉ cùng tác nhân). Bao gồm id của bên yêu cầu khi các lệnh gọi `agentId` tự trỏ nên được cho phép.
- Chốt bảo vệ kế thừa sandbox: nếu phiên của bên yêu cầu đang bị sandbox, `sessions_spawn` từ chối các đích sẽ chạy không sandbox.
- `subagents.requireAgentId`: khi true, chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ tường minh; mặc định: false).

---

## Định tuyến đa tác nhân

Chạy nhiều tác nhân biệt lập trong một Gateway. Xem [Đa tác nhân](/vi/concepts/multi-agent).

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

### Trường khớp binding

- `type` (tùy chọn): `route` cho định tuyến thông thường (thiếu type mặc định là route), `acp` cho các binding hội thoại ACP bền vững.
- `match.channel` (bắt buộc)
- `match.accountId` (tùy chọn; `*` = tài khoản bất kỳ; bỏ qua = tài khoản mặc định)
- `match.peer` (tùy chọn; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (tùy chọn; riêng theo kênh)
- `acp` (tùy chọn; chỉ cho `type: "acp"`): `{ mode, label, cwd, backend }`

**Thứ tự khớp xác định:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (chính xác, không có peer/guild/team)
5. `match.accountId: "*"` (toàn kênh)
6. Tác nhân mặc định

Trong mỗi tầng, mục `bindings` khớp đầu tiên được ưu tiên.

Với các mục `type: "acp"`, OpenClaw phân giải theo danh tính hội thoại chính xác (`match.channel` + tài khoản + `match.peer.id`) và không dùng thứ tự tầng route binding ở trên.

### Hồ sơ truy cập theo từng tác nhân

<Accordion title="Toàn quyền truy cập (không sandbox)">

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

<Accordion title="Công cụ chỉ đọc + workspace">

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

<Accordion title="Không có quyền truy cập hệ thống tệp (chỉ nhắn tin)">

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

Xem [Sandbox đa tác tử & công cụ](/vi/tools/multi-agent-sandbox-tools) để biết chi tiết về thứ tự ưu tiên.

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

<Accordion title="Chi tiết trường phiên">

- **`scope`**: chiến lược nhóm phiên cơ sở cho ngữ cảnh trò chuyện nhóm.
  - `per-sender` (mặc định): mỗi người gửi có một phiên biệt lập trong ngữ cảnh kênh.
  - `global`: tất cả người tham gia trong một ngữ cảnh kênh dùng chung một phiên duy nhất (chỉ dùng khi có chủ đích dùng chung ngữ cảnh).
- **`dmScope`**: cách nhóm tin nhắn trực tiếp.
  - `main`: tất cả tin nhắn trực tiếp dùng chung phiên chính.
  - `per-peer`: biệt lập theo id người gửi trên các kênh.
  - `per-channel-peer`: biệt lập theo kênh + người gửi (khuyến nghị cho hộp thư đến nhiều người dùng).
  - `per-account-channel-peer`: biệt lập theo tài khoản + kênh + người gửi (khuyến nghị cho nhiều tài khoản).
- **`identityLinks`**: ánh xạ id chuẩn sang các peer có tiền tố nhà cung cấp để chia sẻ phiên liên kênh. Các lệnh dock như `/dock_discord` dùng cùng ánh xạ để chuyển tuyến trả lời của phiên đang hoạt động sang một peer kênh đã liên kết khác; xem [Gắn kênh](/vi/concepts/channel-docking).
- **`reset`**: chính sách đặt lại chính. `daily` đặt lại vào giờ địa phương `atHour`; `idle` đặt lại sau `idleMinutes`. Khi cấu hình cả hai, chính sách hết hạn trước sẽ thắng. Độ mới của đặt lại hằng ngày dùng `sessionStartedAt` của hàng phiên; độ mới của đặt lại nhàn rỗi dùng `lastInteractionAt`. Các lần ghi nền/sự kiện hệ thống như Heartbeat, lần đánh thức Cron, thông báo exec và ghi sổ Gateway có thể cập nhật `updatedAt`, nhưng chúng không giữ cho phiên hằng ngày/nhàn rỗi còn mới.
- **`resetByType`**: ghi đè theo từng loại (`direct`, `group`, `thread`). `dm` cũ được chấp nhận làm bí danh cho `direct`.
- **`mainKey`**: trường cũ. Runtime luôn dùng `"main"` cho bucket trò chuyện trực tiếp chính.
- **`agentToAgent.maxPingPongTurns`**: số lượt trả lời qua lại tối đa giữa các agent trong trao đổi agent-với-agent (số nguyên, phạm vi: `0`–`5`). `0` tắt chuỗi ping-pong.
- **`sendPolicy`**: khớp theo `channel`, `chatType` (`direct|group|channel`, với bí danh cũ `dm`), `keyPrefix`, hoặc `rawKeyPrefix`. Quy tắc từ chối đầu tiên sẽ thắng.
- **`maintenance`**: điều khiển dọn dẹp + lưu giữ kho phiên.
  - `mode`: `warn` chỉ phát cảnh báo; `enforce` áp dụng dọn dẹp.
  - `pruneAfter`: ngưỡng tuổi cho các mục cũ (mặc định `30d`).
  - `maxEntries`: số mục tối đa trong `sessions.json` (mặc định `500`). Runtime ghi dọn dẹp theo lô với một bộ đệm high-water nhỏ cho các giới hạn cỡ production; `openclaw sessions cleanup --enforce` áp dụng giới hạn ngay lập tức.
  - `rotateBytes`: đã ngừng dùng và bị bỏ qua; `openclaw doctor --fix` xóa trường này khỏi cấu hình cũ.
  - `resetArchiveRetention`: thời gian lưu giữ cho kho lưu trữ transcript `*.reset.<timestamp>`. Mặc định là `pruneAfter`; đặt `false` để tắt.
  - `maxDiskBytes`: ngân sách đĩa tùy chọn cho thư mục phiên. Ở chế độ `warn`, nó ghi cảnh báo; ở chế độ `enforce`, nó xóa các tạo tác/phiên cũ nhất trước.
  - `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp theo ngân sách. Mặc định là `80%` của `maxDiskBytes`.
- **`threadBindings`**: mặc định toàn cục cho các tính năng phiên gắn với luồng.
  - `enabled`: công tắc mặc định tổng (nhà cung cấp có thể ghi đè; Discord dùng `channels.discord.threadBindings.enabled`)
  - `idleHours`: thời gian không hoạt động mặc định tính bằng giờ trước khi tự động bỏ tập trung (`0` tắt; nhà cung cấp có thể ghi đè)
  - `maxAgeHours`: tuổi tối đa cứng mặc định tính bằng giờ (`0` tắt; nhà cung cấp có thể ghi đè)
  - `spawnSessions`: cổng mặc định để tạo phiên làm việc gắn với luồng từ `sessions_spawn` và các lần spawn luồng ACP. Mặc định là `true` khi liên kết luồng được bật; nhà cung cấp/tài khoản có thể ghi đè.
  - `defaultSpawnContext`: ngữ cảnh subagent native mặc định cho các lần spawn gắn với luồng (`"fork"` hoặc `"isolated"`). Mặc định là `"fork"`.

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

Thứ tự phân giải (cụ thể nhất thắng): tài khoản → kênh → toàn cục. `""` tắt và dừng lan truyền. `"auto"` suy ra `[{identity.name}]`.

**Biến mẫu:**

| Biến              | Mô tả                   | Ví dụ                       |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Tên mẫu ngắn            | `claude-opus-4-6`           |
| `{modelFull}`     | Mã định danh mẫu đầy đủ | `anthropic/claude-opus-4-6` |
| `{provider}`      | Tên nhà cung cấp        | `anthropic`                 |
| `{thinkingLevel}` | Mức suy nghĩ hiện tại   | `high`, `low`, `off`        |
| `{identity.name}` | Tên định danh tác nhân  | (giống như `"auto"`)        |

Biến không phân biệt chữ hoa chữ thường. `{think}` là bí danh của `{thinkingLevel}`.

### Phản ứng xác nhận

- Mặc định là `identity.emoji` của tác nhân đang hoạt động, nếu không thì là `"👀"`. Đặt `""` để tắt.
- Ghi đè theo kênh: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Thứ tự phân giải: tài khoản → kênh → `messages.ackReaction` → dự phòng theo định danh.
- Phạm vi: `group-mentions` (mặc định), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: xóa xác nhận sau khi trả lời trên các kênh hỗ trợ phản ứng như Slack, Discord, Telegram, WhatsApp và BlueBubbles.
- `messages.statusReactions.enabled`: bật phản ứng trạng thái vòng đời trên Slack, Discord và Telegram.
  Trên Slack và Discord, khi chưa đặt thì phản ứng trạng thái vẫn được bật khi phản ứng xác nhận đang hoạt động.
  Trên Telegram, hãy đặt rõ thành `true` để bật phản ứng trạng thái vòng đời.

### Chống dồn tin nhắn đến

Gộp các tin nhắn chỉ gồm văn bản được gửi nhanh từ cùng một người gửi vào một lượt tác nhân duy nhất. Phương tiện/tệp đính kèm sẽ xả ngay lập tức. Lệnh điều khiển bỏ qua chống dồn.

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

- `auto` điều khiển chế độ auto-TTS mặc định: `off`, `always`, `inbound`, hoặc `tagged`. `/tts on|off` có thể ghi đè tùy chọn cục bộ, và `/tts status` hiển thị trạng thái hiệu lực.
- `summaryModel` ghi đè `agents.defaults.model.primary` cho tóm tắt tự động.
- `modelOverrides` được bật theo mặc định; `modelOverrides.allowProvider` mặc định là `false` (phải chọn tham gia).
- Khóa API dự phòng sang `ELEVENLABS_API_KEY`/`XI_API_KEY` và `OPENAI_API_KEY`.
- Các nhà cung cấp giọng nói đi kèm thuộc sở hữu Plugin. Nếu đã đặt `plugins.allow`, hãy bao gồm từng Plugin nhà cung cấp TTS bạn muốn dùng, ví dụ `microsoft` cho Edge TTS. Mã định danh nhà cung cấp cũ `edge` được chấp nhận làm bí danh cho `microsoft`.
- `providers.openai.baseUrl` ghi đè điểm cuối OpenAI TTS. Thứ tự phân giải là cấu hình, sau đó `OPENAI_TTS_BASE_URL`, rồi `https://api.openai.com/v1`.
- Khi `providers.openai.baseUrl` trỏ đến một điểm cuối không phải OpenAI, OpenClaw coi đó là máy chủ TTS tương thích OpenAI và nới lỏng kiểm tra hợp lệ mẫu/giọng nói.

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` phải khớp với một khóa trong `talk.providers` khi cấu hình nhiều nhà cung cấp Talk.
- Các khóa Talk phẳng cũ (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) chỉ dành cho tương thích. Chạy `openclaw doctor --fix` để viết lại cấu hình đã lưu vào `talk.providers.<provider>`.
- Voice ID dự phòng sang `ELEVENLABS_VOICE_ID` hoặc `SAG_VOICE_ID`.
- `providers.*.apiKey` chấp nhận chuỗi văn bản thuần hoặc đối tượng SecretRef.
- Dự phòng `ELEVENLABS_API_KEY` chỉ áp dụng khi chưa cấu hình khóa API Talk.
- `providers.*.voiceAliases` cho phép chỉ thị Talk dùng tên thân thiện.
- `providers.mlx.modelId` chọn kho Hugging Face được trình trợ giúp MLX cục bộ trên macOS dùng. Nếu bỏ qua, macOS dùng `mlx-community/Soprano-80M-bf16`.
- Phát lại MLX trên macOS chạy qua trình trợ giúp `openclaw-mlx-tts` đi kèm khi có, hoặc một tệp thực thi trên `PATH`; `OPENCLAW_MLX_TTS_BIN` ghi đè đường dẫn trình trợ giúp để phát triển.
- `speechLocale` đặt mã ngôn ngữ BCP 47 được nhận dạng giọng nói Talk trên iOS/macOS dùng. Bỏ đặt để dùng mặc định của thiết bị.
- `silenceTimeoutMs` điều khiển thời gian chế độ Talk chờ sau khi người dùng im lặng trước khi gửi bản chép lời. Khi chưa đặt, cửa sổ tạm dừng mặc định của nền tảng được giữ nguyên (`700 ms trên macOS và Android, 900 ms trên iOS`).

---

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — tất cả khóa cấu hình khác
- [Cấu hình](/vi/gateway/configuration) — tác vụ thường gặp và thiết lập nhanh
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
