---
read_when:
    - Điều chỉnh mặc định của tác tử (mô hình, suy nghĩ, workspace, heartbeat, phương tiện, skills)
    - Cấu hình định tuyến và liên kết đa tác nhân
    - Điều chỉnh phiên, việc gửi tin nhắn và hành vi của chế độ trò chuyện
summary: Mặc định của agent, định tuyến đa agent, phiên, tin nhắn và cấu hình trò chuyện
title: Cấu hình — tác tử
x-i18n:
    generated_at: "2026-06-27T17:27:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

Các khóa cấu hình theo phạm vi agent dưới `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` và `talk.*`. Đối với kênh, công cụ, runtime Gateway và các khóa
cấp cao khác, xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Mặc định của agent

### `agents.defaults.workspace`

Mặc định: `OPENCLAW_WORKSPACE_DIR` khi được đặt, nếu không thì dùng `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Giá trị `agents.defaults.workspace` rõ ràng sẽ được ưu tiên hơn
`OPENCLAW_WORKSPACE_DIR`. Dùng biến môi trường để trỏ các agent mặc định
tới một workspace đã gắn kết khi bạn không muốn ghi đường dẫn đó vào cấu hình.

### `agents.defaults.repoRoot`

Root repository tùy chọn hiển thị trong dòng Runtime của system prompt. Nếu chưa đặt, OpenClaw tự động phát hiện bằng cách đi ngược lên từ workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Danh sách cho phép skill mặc định tùy chọn cho các agent không đặt
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

- Bỏ qua `agents.defaults.skills` để mặc định không giới hạn skills.
- Bỏ qua `agents.list[].skills` để kế thừa mặc định.
- Đặt `agents.list[].skills: []` để không có skills.
- Danh sách `agents.list[].skills` không rỗng là tập cuối cùng cho agent đó; nó
  không hợp nhất với mặc định.

### `agents.defaults.skipBootstrap`

Tắt tự động tạo các tệp bootstrap workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

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

- `"continuation-skip"`: các lượt tiếp nối an toàn (sau một phản hồi assistant đã hoàn tất) bỏ qua việc chèn lại bootstrap workspace, giúp giảm kích thước prompt. Các lần chạy Heartbeat và thử lại sau Compaction vẫn xây dựng lại context.
- `"never"`: tắt bootstrap workspace và chèn tệp context ở mọi lượt. Chỉ dùng tùy chọn này cho các agent hoàn toàn tự sở hữu vòng đời prompt của chúng (engine context tùy chỉnh, runtime native tự xây dựng context riêng, hoặc workflow chuyên biệt không cần bootstrap). Các lượt Heartbeat và phục hồi sau Compaction cũng bỏ qua việc chèn.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Ghi đè theo agent: `agents.list[].contextInjection`. Các giá trị bị bỏ qua kế thừa
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Số ký tự tối đa cho mỗi tệp bootstrap workspace trước khi cắt ngắn. Mặc định: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Ghi đè theo agent: `agents.list[].bootstrapMaxChars`. Các giá trị bị bỏ qua kế thừa
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Tổng số ký tự tối đa được chèn trên tất cả tệp bootstrap workspace. Mặc định: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Ghi đè theo agent: `agents.list[].bootstrapTotalMaxChars`. Các giá trị bị bỏ qua
kế thừa `agents.defaults.bootstrapTotalMaxChars`.

### Ghi đè hồ sơ bootstrap theo agent

Dùng ghi đè hồ sơ bootstrap theo agent khi một agent cần hành vi chèn prompt
khác với mặc định dùng chung. Các trường bị bỏ qua kế thừa từ
`agents.defaults`.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kiểm soát thông báo system prompt hiển thị cho agent khi context bootstrap bị cắt ngắn.
Mặc định: `"always"`.

- `"off"`: không bao giờ chèn văn bản thông báo cắt ngắn vào system prompt.
- `"once"`: chèn một thông báo ngắn gọn một lần cho mỗi chữ ký cắt ngắn duy nhất.
- `"always"`: chèn một thông báo ngắn gọn ở mọi lần chạy khi có cắt ngắn (khuyến nghị).

Số đếm raw/đã chèn chi tiết và các trường tinh chỉnh cấu hình vẫn nằm trong chẩn đoán như
báo cáo context/trạng thái và nhật ký; context người dùng/runtime WebChat thường lệ chỉ
nhận thông báo phục hồi ngắn gọn.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Bản đồ sở hữu ngân sách context

OpenClaw có nhiều ngân sách prompt/context dung lượng lớn, và chúng được
chủ ý tách theo subsystem thay vì tất cả đi qua một núm điều khiển chung.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  chèn bootstrap workspace thông thường.
- `agents.defaults.startupContext.*`:
  phần mở đầu một lần cho lần chạy model khi reset/khởi động, bao gồm các tệp
  `memory/*.md` hằng ngày gần đây. Các lệnh chat trần `/new` và `/reset` được
  xác nhận mà không gọi model.
- `skills.limits.*`:
  danh sách skills rút gọn được chèn vào system prompt.
- `agents.defaults.contextLimits.*`:
  các trích đoạn runtime có giới hạn và các khối do runtime sở hữu được chèn.
- `memory.qmd.limits.*`:
  kích thước đoạn trích tìm kiếm bộ nhớ đã lập chỉ mục và phần chèn.

Chỉ dùng ghi đè theo agent tương ứng khi một agent cần ngân sách khác:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kiểm soát phần mở đầu khởi động lượt đầu được chèn vào các lần chạy model khi reset/khởi động.
Các lệnh chat trần `/new` và `/reset` xác nhận reset mà không gọi
model, nên chúng không tải phần mở đầu này.

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

Mặc định dùng chung cho các bề mặt context runtime có giới hạn.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: giới hạn trích đoạn `memory_get` mặc định trước khi metadata
  cắt ngắn và thông báo tiếp nối được thêm vào.
- `memoryGetDefaultLines`: cửa sổ dòng `memory_get` mặc định khi `lines` bị
  bỏ qua.
- `toolResultMaxChars`: trần kết quả công cụ live nâng cao được dùng cho kết quả
  được lưu bền và phục hồi tràn. Để chưa đặt để dùng giới hạn tự động cho model-context:
  `16000` ký tự dưới 100K token, `32000` ký tự ở 100K+ token, và `64000`
  ký tự ở 200K+ token. Các giá trị rõ ràng lên tới `1000000` được chấp nhận cho
  model context dài, nhưng giới hạn hiệu lực vẫn bị giới hạn ở khoảng 30% của
  cửa sổ context model. `openclaw doctor --deep` in ra giới hạn hiệu lực,
  và doctor chỉ cảnh báo khi một ghi đè rõ ràng đã lỗi thời hoặc không có tác dụng.
- `postCompactionMaxChars`: giới hạn trích đoạn AGENTS.md dùng trong quá trình chèn
  làm mới sau Compaction.

#### `agents.list[].contextLimits`

Ghi đè theo agent cho các núm `contextLimits` dùng chung. Các trường bị bỏ qua kế thừa
từ `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Giới hạn toàn cục cho danh sách skills rút gọn được chèn vào system prompt. Điều này
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

Ghi đè theo agent cho ngân sách prompt skills.

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

Giá trị thấp hơn thường giảm mức dùng vision-token và kích thước payload yêu cầu cho các lần chạy nhiều ảnh chụp màn hình.
Giá trị cao hơn giữ lại nhiều chi tiết thị giác hơn.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Tùy chọn nén/chi tiết của image-tool cho ảnh được tải từ đường dẫn tệp, URL và tham chiếu media.
Mặc định: `auto`.

OpenClaw điều chỉnh thang resize theo model ảnh đã chọn. Ví dụ, Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL và các model vision Llama 4 được host có thể dùng ảnh lớn hơn các đường vision chi tiết cao cũ/mặc định, trong khi các lượt nhiều ảnh được nén mạnh hơn ở chế độ `auto` để kiểm soát chi phí token và độ trễ.

Giá trị:

- `auto`: điều chỉnh theo giới hạn model và số lượng ảnh.
- `efficient`: ưu tiên ảnh nhỏ hơn để giảm mức dùng token và byte.
- `balanced`: dùng thang trung dung tiêu chuẩn.
- `high`: giữ lại nhiều chi tiết hơn cho ảnh chụp màn hình, sơ đồ và ảnh tài liệu.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Múi giờ cho context system prompt (không phải timestamp của tin nhắn). Dự phòng về múi giờ của host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Định dạng thời gian trong system prompt. Mặc định: `auto` (tùy chọn OS).

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
  - Dạng chuỗi chỉ đặt model chính.
  - Dạng đối tượng đặt model chính cùng các model chuyển đổi dự phòng theo thứ tự.
- `imageModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được đường dẫn công cụ `image` dùng làm cấu hình model thị giác.
  - Cũng được dùng làm định tuyến dự phòng khi model được chọn/mặc định không thể nhận đầu vào hình ảnh.
  - Ưu tiên tham chiếu `provider/model` tường minh. ID trần được chấp nhận để tương thích; nếu một ID trần khớp duy nhất với một mục đã cấu hình có khả năng xử lý hình ảnh trong `models.providers.*.models`, OpenClaw gắn nó với provider đó. Các kết quả khớp đã cấu hình nhưng mơ hồ yêu cầu tiền tố provider tường minh.
- `imageGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được khả năng tạo hình ảnh dùng chung và mọi bề mặt công cụ/plugin trong tương lai có tạo hình ảnh sử dụng.
  - Giá trị điển hình: `google/gemini-3.1-flash-image-preview` cho tạo hình ảnh Gemini gốc, `fal/fal-ai/flux/dev` cho fal, `openai/gpt-image-2` cho OpenAI Images, hoặc `openai/gpt-image-1.5` cho đầu ra PNG/WebP nền trong suốt của OpenAI.
  - Nếu bạn chọn trực tiếp một provider/model, hãy cấu hình cả xác thực provider tương ứng (ví dụ `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` cho `google/*`, `OPENAI_API_KEY` hoặc OpenAI Codex OAuth cho `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` cho `fal/*`).
  - Nếu bỏ qua, `image_generate` vẫn có thể suy ra mặc định provider có xác thực hỗ trợ. Nó thử provider mặc định hiện tại trước, rồi đến các provider tạo hình ảnh đã đăng ký còn lại theo thứ tự ID provider.
- `musicGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được khả năng tạo nhạc dùng chung và công cụ tích hợp sẵn `music_generate` sử dụng.
  - Giá trị điển hình: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview`, hoặc `minimax/music-2.6`.
  - Nếu bỏ qua, `music_generate` vẫn có thể suy ra mặc định provider có xác thực hỗ trợ. Nó thử provider mặc định hiện tại trước, rồi đến các provider tạo nhạc đã đăng ký còn lại theo thứ tự ID provider.
  - Nếu bạn chọn trực tiếp một provider/model, hãy cấu hình cả khóa xác thực/API của provider tương ứng.
- `videoGenerationModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được khả năng tạo video dùng chung và công cụ tích hợp sẵn `video_generate` sử dụng.
  - Giá trị điển hình: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash`, hoặc `qwen/wan2.7-r2v`.
  - Nếu bỏ qua, `video_generate` vẫn có thể suy ra mặc định provider có xác thực hỗ trợ. Nó thử provider mặc định hiện tại trước, rồi đến các provider tạo video đã đăng ký còn lại theo thứ tự ID provider.
  - Nếu bạn chọn trực tiếp một provider/model, hãy cấu hình cả khóa xác thực/API của provider tương ứng.
  - Plugin tạo video Qwen chính thức hỗ trợ tối đa 1 video đầu ra, 1 hình ảnh đầu vào, 4 video đầu vào, thời lượng 10 giây, và các tùy chọn cấp provider `size`, `aspectRatio`, `resolution`, `audio`, và `watermark`.
- `pdfModel`: chấp nhận một chuỗi (`"provider/model"`) hoặc một đối tượng (`{ primary, fallbacks }`).
  - Được công cụ `pdf` dùng để định tuyến model.
  - Nếu bỏ qua, công cụ PDF sẽ quay về `imageModel`, rồi đến model phiên/mặc định đã phân giải.
- `pdfMaxBytesMb`: giới hạn kích thước PDF mặc định cho công cụ `pdf` khi `maxBytesMb` không được truyền lúc gọi.
- `pdfMaxPages`: số trang tối đa mặc định được xem xét bởi chế độ dự phòng trích xuất trong công cụ `pdf`.
- `verboseDefault`: mức chi tiết mặc định cho agent. Giá trị: `"off"`, `"on"`, `"full"`. Mặc định: `"off"`.
- `toolProgressDetail`: chế độ chi tiết cho tóm tắt công cụ `/verbose` và các dòng công cụ bản nháp tiến độ. Giá trị: `"explain"` (mặc định, nhãn ngắn gọn cho người đọc) hoặc `"raw"` (thêm lệnh/chi tiết thô khi có). `agents.list[].toolProgressDetail` theo từng agent ghi đè mặc định này.
- `reasoningDefault`: khả năng hiển thị reasoning mặc định cho agent. Giá trị: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` theo từng agent ghi đè mặc định này. Mặc định reasoning đã cấu hình chỉ được áp dụng cho chủ sở hữu, người gửi được ủy quyền, hoặc ngữ cảnh Gateway operator-admin khi chưa đặt ghi đè reasoning theo tin nhắn hoặc phiên.
- `elevatedDefault`: mức đầu ra nâng cao mặc định cho agent. Giá trị: `"off"`, `"on"`, `"ask"`, `"full"`. Mặc định: `"on"`.
- `model.primary`: định dạng `provider/model` (ví dụ `openai/gpt-5.5` cho quyền truy cập bằng khóa API OpenAI hoặc Codex OAuth). Nếu bạn bỏ qua provider, OpenClaw thử alias trước, rồi một kết quả khớp provider đã cấu hình duy nhất cho đúng ID model đó, và chỉ sau đó mới quay về provider mặc định đã cấu hình (hành vi tương thích đã lỗi thời, vì vậy hãy ưu tiên `provider/model` tường minh). Nếu provider đó không còn cung cấp model mặc định đã cấu hình, OpenClaw quay về provider/model đã cấu hình đầu tiên thay vì hiển thị một mặc định provider đã bị xóa và lỗi thời.
- `models`: danh mục model đã cấu hình và danh sách cho phép cho `/model`. Mỗi mục có thể bao gồm `alias` (lối tắt) và `params` (riêng cho provider, ví dụ `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, định tuyến `provider` của OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Dùng các mục `provider/*` như `"openai/*": {}` hoặc `"vllm/*": {}` để hiển thị tất cả model được phát hiện cho các provider đã chọn mà không cần liệt kê thủ công từng ID model.
  - Thêm `agentRuntime` vào một mục `provider/*` khi mọi model được phát hiện động cho provider đó nên dùng cùng runtime. Chính sách runtime `provider/model` chính xác vẫn thắng wildcard.
  - Chỉnh sửa an toàn: dùng `openclaw config set agents.defaults.models '<json>' --strict-json --merge` để thêm mục. `config set` từ chối các thay thế sẽ xóa mục danh sách cho phép hiện có trừ khi bạn truyền `--replace`.
  - Các luồng configure/onboarding theo phạm vi provider hợp nhất những model provider đã chọn vào map này và giữ nguyên các provider không liên quan đã được cấu hình.
  - Đối với model OpenAI Responses trực tiếp, Compaction phía máy chủ được bật tự động. Dùng `params.responsesServerCompaction: false` để dừng chèn `context_management`, hoặc `params.responsesCompactThreshold` để ghi đè ngưỡng. Xem [Compaction phía máy chủ của OpenAI](/vi/providers/openai#server-side-compaction-responses-api).
- `params`: tham số provider mặc định toàn cục áp dụng cho tất cả model. Đặt tại `agents.defaults.params` (ví dụ `{ cacheRetention: "long" }`).
- Thứ tự ưu tiên hợp nhất `params` (cấu hình): `agents.defaults.params` (nền toàn cục) bị ghi đè bởi `agents.defaults.models["provider/model"].params` (theo model), rồi `agents.list[].params` (ID agent khớp) ghi đè theo khóa. Xem [Prompt Caching](/vi/reference/prompt-caching) để biết chi tiết.
- `models.providers.openrouter.params.provider`: chính sách định tuyến provider mặc định trên toàn OpenRouter. OpenClaw chuyển tiếp chính sách này vào đối tượng `provider` của yêu cầu OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` theo model và tham số agent ghi đè theo khóa. Xem [Định tuyến provider OpenRouter](/vi/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON truyền qua nâng cao được hợp nhất vào thân yêu cầu `api: "openai-completions"` cho các proxy tương thích OpenAI. Nếu nó xung đột với các khóa yêu cầu được tạo, phần thân bổ sung thắng; các tuyến completions không gốc vẫn loại bỏ `store` chỉ dành cho OpenAI sau đó.
- `params.chat_template_kwargs`: đối số mẫu chat tương thích vLLM/OpenAI được hợp nhất vào thân yêu cầu cấp cao nhất `api: "openai-completions"`. Với `vllm/nemotron-3-*` khi tắt thinking, Plugin vLLM đi kèm tự động gửi `enable_thinking: false` và `force_nonempty_content: true`; `chat_template_kwargs` tường minh ghi đè mặc định được tạo, và `extra_body.chat_template_kwargs` vẫn có độ ưu tiên cuối cùng. Các model thinking Qwen và Nemotron vLLM đã cấu hình hiển thị lựa chọn nhị phân `/think` (`off`, `on`) thay vì thang mức effort nhiều cấp.
- `compat.thinkingFormat`: kiểu payload thinking tương thích OpenAI. Dùng `"together"` cho `reasoning.enabled` kiểu Together, `"qwen"` cho `enable_thinking` cấp cao nhất kiểu Qwen, hoặc `"qwen-chat-template"` cho `chat_template_kwargs.enable_thinking` trên các backend họ Qwen hỗ trợ kwargs mẫu chat cấp yêu cầu, chẳng hạn vLLM. OpenClaw ánh xạ thinking đã tắt thành `false` và thinking đã bật thành `true`, đồng thời các model Qwen vLLM đã cấu hình hiển thị lựa chọn nhị phân `/think` cho các định dạng này.
- `compat.supportedReasoningEfforts`: danh sách effort reasoning tương thích OpenAI theo từng model. Bao gồm `"xhigh"` cho các endpoint tùy chỉnh thực sự chấp nhận nó; khi đó OpenClaw hiển thị `/think xhigh` trong menu lệnh, hàng phiên Gateway, xác thực bản vá phiên, xác thực CLI agent, và xác thực `llm-task` cho provider/model đã cấu hình đó. Dùng `compat.reasoningEffortMap` khi backend muốn một giá trị riêng cho provider đối với một mức chuẩn.
- `params.preserveThinking`: tùy chọn bật riêng cho Z.AI để giữ lại thinking. Khi bật và thinking đang bật, OpenClaw gửi `thinking.clear_thinking: false` và phát lại `reasoning_content` trước đó; xem [Thinking và thinking được giữ lại của Z.AI](/vi/providers/zai#thinking-and-preserved-thinking).
- `localService`: trình quản lý tiến trình tùy chọn cấp provider cho các máy chủ model cục bộ/tự host. Khi model được chọn thuộc provider đó, OpenClaw thăm dò `healthUrl` (hoặc `baseUrl + "/models"`), khởi động `command` với `args` nếu endpoint đang tắt, chờ tối đa `readyTimeoutMs`, rồi gửi yêu cầu model. `command` phải là đường dẫn tuyệt đối. `idleStopMs: 0` giữ tiến trình sống cho đến khi OpenClaw thoát; giá trị dương dừng tiến trình do OpenClaw sinh ra sau bấy nhiêu mili giây nhàn rỗi. Xem [Dịch vụ model cục bộ](/vi/gateway/local-model-services).
- Chính sách runtime thuộc về provider hoặc model, không thuộc `agents.defaults`. Dùng `models.providers.<provider>.agentRuntime` cho quy tắc toàn provider hoặc `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` cho quy tắc theo model. Model agent OpenAI trên provider OpenAI chính thức chọn Codex theo mặc định.
- Các trình ghi cấu hình thay đổi những trường này (ví dụ `/models set`, `/models set-image`, và lệnh thêm/xóa dự phòng) lưu dạng đối tượng chuẩn và giữ lại danh sách dự phòng hiện có khi có thể.
- `maxConcurrent`: số lần chạy agent song song tối đa trên các phiên (mỗi phiên vẫn được tuần tự hóa). Mặc định: 4.

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
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, một id harness Plugin đã đăng ký, hoặc một bí danh backend CLI được hỗ trợ. Plugin Codex đi kèm đăng ký `codex`; Plugin Anthropic đi kèm cung cấp backend CLI `claude-cli`.
- `id: "auto"` cho phép các harness Plugin đã đăng ký nhận các lượt được hỗ trợ và dùng OpenClaw khi không harness nào khớp. Một runtime Plugin tường minh như `id: "codex"` yêu cầu harness đó và sẽ đóng an toàn nếu nó không khả dụng hoặc thất bại.
- `id: "pi"` chỉ được chấp nhận như một bí danh không còn khuyến nghị cho `openclaw` để giữ các cấu hình đã phát hành từ v2026.5.22 trở về trước. Cấu hình mới nên dùng `openclaw`.
- Thứ tự ưu tiên runtime là chính sách mô hình chính xác trước (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]`, hoặc `models.providers.<provider>.models[]`), rồi `agents.list[]` / `agents.defaults.models["provider/*"]`, rồi chính sách toàn provider tại `models.providers.<provider>.agentRuntime`.
- Các khóa runtime toàn agent là di sản. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, ghim runtime phiên, và `OPENCLAW_AGENT_RUNTIME` bị bỏ qua khi chọn runtime. Chạy `openclaw doctor --fix` để xóa các giá trị cũ.
- Các mô hình agent OpenAI dùng harness Codex theo mặc định; provider/model `agentRuntime.id: "codex"` vẫn hợp lệ khi bạn muốn khai báo tường minh.
- Với các triển khai Claude CLI, ưu tiên `model: "anthropic/claude-opus-4-8"` cộng với `agentRuntime.id: "claude-cli"` theo phạm vi mô hình. Các tham chiếu mô hình di sản `claude-cli/claude-opus-4-7` vẫn hoạt động để tương thích, nhưng cấu hình mới nên giữ lựa chọn provider/model ở dạng chuẩn và đặt backend thực thi trong chính sách runtime provider/model.
- Phần này chỉ kiểm soát thực thi lượt agent văn bản. Tạo media, vision, PDF, nhạc, video, và TTS vẫn dùng các thiết lập provider/model của chúng.

**Cách viết tắt bí danh tích hợp sẵn** (chỉ áp dụng khi mô hình nằm trong `agents.defaults.models`):

| Bí danh             | Mô hình                         |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Các bí danh bạn cấu hình luôn được ưu tiên hơn mặc định.

Các mô hình Z.AI GLM-4.x tự động bật chế độ suy nghĩ trừ khi bạn đặt `--thinking off` hoặc tự định nghĩa `agents.defaults.models["zai/<model>"].params.thinking`.
Các mô hình Z.AI bật `tool_stream` theo mặc định để phát trực tuyến lời gọi công cụ. Đặt `agents.defaults.models["zai/<model>"].params.tool_stream` thành `false` để tắt.
Anthropic Claude Opus 4.8 giữ chế độ suy nghĩ tắt theo mặc định trong OpenClaw; khi suy nghĩ thích ứng được bật tường minh, mặc định mức nỗ lực do provider sở hữu của Anthropic là `high`. Các mô hình Claude 4.6 mặc định là `adaptive` khi không đặt mức suy nghĩ tường minh.

### `agents.defaults.cliBackends`

Backend CLI tùy chọn cho các lần chạy dự phòng chỉ văn bản (không có lời gọi công cụ). Hữu ích làm phương án dự phòng khi các provider API thất bại.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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

- Backend CLI ưu tiên văn bản; công cụ luôn bị tắt.
- Phiên được hỗ trợ khi `sessionArg` được đặt.
- Truyền ảnh qua được hỗ trợ khi `imageArg` chấp nhận đường dẫn tệp.
- `reseedFromRawTranscriptWhenUncompacted: true` cho phép một backend khôi phục an toàn
  các phiên đã bị vô hiệu từ phần đuôi transcript OpenClaw thô có giới hạn trước khi
  bản tóm tắt Compaction đầu tiên tồn tại. Thay đổi hồ sơ xác thực hoặc kỷ nguyên thông tin xác thực
  vẫn không bao giờ gieo lại từ thô.

### `agents.defaults.promptOverlays`

Các lớp phủ prompt độc lập với provider được áp dụng theo họ mô hình trên các bề mặt prompt do OpenClaw lắp ráp. Các id mô hình họ GPT-5 nhận hợp đồng hành vi dùng chung trên các tuyến OpenClaw/provider; `personality` chỉ kiểm soát lớp phong cách tương tác thân thiện. Các tuyến app-server Codex gốc giữ hướng dẫn nền/mô hình do Codex sở hữu thay vì lớp phủ GPT-5 này của OpenClaw, và OpenClaw tắt personality tích hợp của Codex cho các luồng gốc.

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
- `plugins.entries.openai.config.personality` di sản vẫn được đọc khi thiết lập dùng chung này chưa được đặt.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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

- `every`: chuỗi thời lượng (ms/s/m/h). Mặc định: `30m` (xác thực khóa API) hoặc `1h` (xác thực OAuth). Đặt thành `0m` để tắt.
- `includeSystemPromptSection`: khi false, bỏ qua phần Heartbeat khỏi system prompt và bỏ qua việc chèn `HEARTBEAT.md` vào ngữ cảnh bootstrap. Mặc định: `true`.
- `suppressToolErrorWarnings`: khi true, chặn các payload cảnh báo lỗi công cụ trong các lần chạy Heartbeat.
- `timeoutSeconds`: thời gian tối đa tính bằng giây được phép cho một lượt agent Heartbeat trước khi bị hủy. Để trống để dùng `agents.defaults.timeoutSeconds` khi được đặt, nếu không thì dùng nhịp Heartbeat với giới hạn 600 giây.
- `directPolicy`: chính sách gửi trực tiếp/DM. `allow` (mặc định) cho phép gửi tới mục tiêu trực tiếp. `block` chặn gửi tới mục tiêu trực tiếp và phát ra `reason=dm-blocked`.
- `lightContext`: khi true, các lần chạy Heartbeat dùng ngữ cảnh bootstrap nhẹ và chỉ giữ `HEARTBEAT.md` từ các tệp bootstrap của workspace.
- `isolatedSession`: khi true, mỗi Heartbeat chạy trong một phiên mới không có lịch sử hội thoại trước đó. Cùng mẫu cô lập như cron `sessionTarget: "isolated"`. Giảm chi phí token cho mỗi Heartbeat từ khoảng 100K xuống khoảng 2-5K token.
- `skipWhenBusy`: khi true, các lần chạy Heartbeat hoãn trên các lane bận bổ sung của agent đó: subagent theo khóa phiên của chính nó hoặc công việc lệnh lồng nhau. Các lane Cron luôn hoãn Heartbeat, ngay cả khi không có cờ này.
- Theo từng agent: đặt `agents.list[].heartbeat`. Khi bất kỳ agent nào định nghĩa `heartbeat`, **chỉ các agent đó** chạy Heartbeat.
- Heartbeat chạy đầy đủ các lượt agent — khoảng cách ngắn hơn sẽ tiêu tốn nhiều token hơn.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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
- `provider`: id của một Plugin nhà cung cấp compaction đã đăng ký. Khi được đặt, `summarize()` của nhà cung cấp sẽ được gọi thay cho tính năng tóm tắt LLM tích hợp sẵn. Sẽ quay về tích hợp sẵn khi lỗi. Việc đặt nhà cung cấp sẽ buộc `mode: "safeguard"`. Xem [Compaction](/vi/concepts/compaction).
- `timeoutSeconds`: số giây tối đa cho phép đối với một thao tác compaction đơn lẻ trước khi OpenClaw hủy thao tác đó. Mặc định: `180`.
- `keepRecentTokens`: ngân sách điểm cắt của tác nhân để giữ nguyên văn phần đuôi bản ghi gần nhất. `/compact` thủ công tôn trọng giá trị này khi được đặt rõ ràng; nếu không, compaction thủ công là một điểm kiểm tra cứng.
- `identifierPolicy`: `strict` (mặc định), `off`, hoặc `custom`. `strict` thêm hướng dẫn tích hợp sẵn về việc giữ lại định danh mờ vào đầu quá trình tóm tắt compaction.
- `identifierInstructions`: văn bản tùy chỉnh tùy chọn để bảo toàn định danh, dùng khi `identifierPolicy=custom`.
- `qualityGuard`: các kiểm tra thử lại khi đầu ra sai định dạng cho bản tóm tắt safeguard. Được bật mặc định trong chế độ safeguard; đặt `enabled: false` để bỏ qua kiểm tra.
- `midTurnPrecheck`: kiểm tra áp lực vòng lặp công cụ tùy chọn. Khi `enabled: true`, OpenClaw kiểm tra áp lực ngữ cảnh sau khi kết quả công cụ được thêm vào và trước lệnh gọi mô hình tiếp theo. Nếu ngữ cảnh không còn vừa, nó hủy lần thử hiện tại trước khi gửi prompt và dùng lại đường khôi phục precheck hiện có để cắt ngắn kết quả công cụ hoặc compact rồi thử lại. Hoạt động với cả hai chế độ compaction `default` và `safeguard`. Mặc định: tắt.
- `postCompactionSections`: tên mục H2/H3 tùy chọn trong AGENTS.md để chèn lại sau compaction. Việc chèn lại bị tắt khi không đặt hoặc đặt thành `[]`. Đặt rõ ràng `["Session Startup", "Red Lines"]` sẽ bật cặp đó và giữ nguyên fallback cũ `Every Session`/`Safety`. Chỉ bật tùy chọn này khi ngữ cảnh bổ sung đáng với rủi ro trùng lặp hướng dẫn dự án đã được ghi lại trong bản tóm tắt compaction.
- `model`: `provider/model-id` tùy chọn hoặc alias trần từ `agents.defaults.models` chỉ dùng cho tóm tắt compaction. Alias trần được phân giải trước khi điều phối; các ID mô hình dạng literal đã cấu hình vẫn được ưu tiên khi trùng. Dùng tùy chọn này khi phiên chính cần giữ một mô hình nhưng bản tóm tắt compaction nên chạy trên mô hình khác; khi không đặt, compaction dùng mô hình chính của phiên.
- `maxActiveTranscriptBytes`: ngưỡng byte tùy chọn (`number` hoặc chuỗi như `"20mb"`) kích hoạt compaction cục bộ thông thường trước một lần chạy khi JSONL đang hoạt động vượt quá ngưỡng. Yêu cầu `truncateAfterCompaction` để compaction thành công có thể xoay sang bản ghi kế nhiệm nhỏ hơn. Bị tắt khi không đặt hoặc `0`.
- `notifyUser`: khi `true`, gửi thông báo ngắn cho người dùng khi compaction bắt đầu và khi hoàn tất (ví dụ: "Compacting context..." và "Compaction complete"). Mặc định tắt để giữ compaction im lặng.
- `memoryFlush`: lượt tác nhân im lặng trước auto-compaction để lưu ký ức bền vững. Đặt `model` thành nhà cung cấp/mô hình chính xác như `ollama/qwen3:8b` khi lượt dọn dẹp này cần ở trên một mô hình cục bộ; phần ghi đè không kế thừa chuỗi fallback của phiên đang hoạt động. Bỏ qua khi workspace ở chế độ chỉ đọc.

### `agents.defaults.runRetries`

Ranh giới vòng lặp thử lại của vòng chạy ngoài cho runtime tác nhân nhúng nhằm ngăn vòng lặp thực thi vô hạn trong quá trình khôi phục lỗi. Lưu ý rằng thiết lập này hiện chỉ áp dụng cho runtime tác nhân nhúng, không áp dụng cho runtime ACP hoặc CLI.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: số vòng lặp thử lại cơ sở cho vòng chạy ngoài. Mặc định: `24`.
- `perProfile`: số vòng lặp thử lại bổ sung được cấp cho mỗi ứng viên hồ sơ fallback. Mặc định: `8`.
- `min`: giới hạn tuyệt đối tối thiểu cho số vòng lặp thử lại. Mặc định: `32`.
- `max`: giới hạn tuyệt đối tối đa cho số vòng lặp thử lại để ngăn thực thi mất kiểm soát. Mặc định: `160`.

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

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` bật các lượt cắt tỉa.
- `ttl` kiểm soát tần suất cắt tỉa có thể chạy lại (sau lần chạm cache cuối cùng).
- Cắt tỉa trước tiên cắt mềm các kết quả công cụ quá lớn, sau đó xóa cứng các kết quả công cụ cũ hơn nếu cần.
- `softTrimRatio` và `hardClearRatio` chấp nhận các giá trị từ `0.0` đến `1.0`; kiểm tra hợp lệ cấu hình sẽ từ chối các giá trị nằm ngoài phạm vi đó.

**Cắt mềm** giữ phần đầu + phần cuối và chèn `...` ở giữa.

**Xóa cứng** thay toàn bộ kết quả công cụ bằng placeholder.

Ghi chú:

- Các khối hình ảnh không bao giờ bị cắt/xóa.
- Tỷ lệ dựa trên ký tự (xấp xỉ), không phải số token chính xác.
- Nếu có ít hơn `keepLastAssistants` thông điệp assistant, quá trình cắt tỉa sẽ bị bỏ qua.

</Accordion>

Xem [Cắt tỉa phiên](/vi/concepts/session-pruning) để biết chi tiết hành vi.

### Phát trực tuyến theo khối

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

- Các kênh không phải Telegram cần `*.blockStreaming: true` rõ ràng để bật phản hồi theo khối.
- Ghi đè theo kênh: `channels.<channel>.blockStreamingCoalesce` (và các biến thể theo tài khoản). Signal/Slack/Discord/Google Chat mặc định `minChars: 1500`.
- `humanDelay`: khoảng dừng ngẫu nhiên giữa các phản hồi theo khối. `natural` = 800–2500ms. Ghi đè theo tác nhân: `agents.list[].humanDelay`.

Xem [Streaming](/vi/concepts/streaming) để biết chi tiết hành vi + chia đoạn.

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

- Mặc định: `instant` cho cuộc trò chuyện trực tiếp/lượt nhắc tên, `message` cho trò chuyện nhóm không nhắc tên.
- Ghi đè theo phiên: `session.typingMode`, `session.typingIntervalSeconds`.

Xem [Chỉ báo đang nhập](/vi/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing tùy chọn cho tác nhân nhúng. Xem [Sandboxing](/vi/gateway/sandboxing) để đọc hướng dẫn đầy đủ.

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

**Phần nền:**

- `docker`: runtime Docker cục bộ (mặc định)
- `ssh`: runtime từ xa chung được hỗ trợ bởi SSH
- `openshell`: runtime OpenShell

Khi chọn `backend: "openshell"`, các thiết lập dành riêng cho runtime chuyển sang
`plugins.entries.openshell.config`.

**Cấu hình phần nền SSH:**

- `target`: đích SSH ở dạng `user@host[:port]`
- `command`: lệnh máy khách SSH (mặc định: `ssh`)
- `workspaceRoot`: gốc từ xa tuyệt đối dùng cho workspace theo từng phạm vi
- `identityFile` / `certificateFile` / `knownHostsFile`: các tệp cục bộ hiện có được truyền cho OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: nội dung inline hoặc SecretRefs mà OpenClaw vật chất hóa thành tệp tạm trong runtime
- `strictHostKeyChecking` / `updateHostKeys`: các núm chính sách host-key của OpenSSH

**Thứ tự ưu tiên xác thực SSH:**

- `identityData` thắng `identityFile`
- `certificateData` thắng `certificateFile`
- `knownHostsData` thắng `knownHostsFile`
- Các giá trị `*Data` được hỗ trợ bởi SecretRef được phân giải từ snapshot runtime secrets đang hoạt động trước khi phiên sandbox bắt đầu

**Hành vi phần nền SSH:**

- khởi tạo workspace từ xa một lần sau khi tạo hoặc tạo lại
- sau đó giữ workspace SSH từ xa là nguồn chuẩn
- định tuyến `exec`, công cụ tệp và đường dẫn phương tiện qua SSH
- không tự động đồng bộ các thay đổi từ xa trở lại máy chủ
- không hỗ trợ container trình duyệt sandbox

**Quyền truy cập workspace:**

- `none`: workspace sandbox theo từng phạm vi dưới `~/.openclaw/sandboxes`
- `ro`: workspace sandbox tại `/workspace`, workspace của tác nhân được mount chỉ đọc tại `/agent`
- `rw`: workspace của tác nhân được mount đọc/ghi tại `/workspace`

**Phạm vi:**

- `session`: container + workspace theo từng phiên
- `agent`: một container + workspace cho mỗi tác nhân (mặc định)
- `shared`: container và workspace dùng chung (không có cô lập giữa các phiên)

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

- `mirror`: khởi tạo từ cục bộ sang từ xa trước khi thực thi, đồng bộ ngược lại sau khi thực thi; workspace cục bộ vẫn là chuẩn
- `remote`: khởi tạo từ xa một lần khi sandbox được tạo, sau đó giữ workspace từ xa làm chuẩn

Ở chế độ `remote`, các chỉnh sửa cục bộ trên máy chủ được thực hiện bên ngoài OpenClaw sẽ không được tự động đồng bộ vào sandbox sau bước khởi tạo.
Transport là SSH vào sandbox OpenShell, nhưng Plugin sở hữu vòng đời sandbox và đồng bộ mirror tùy chọn.

**`setupCommand`** chạy một lần sau khi tạo container (qua `sh -lc`). Cần truy cập mạng ra ngoài, root có thể ghi, người dùng root.

**Container mặc định là `network: "none"`** — đặt thành `"bridge"` (hoặc mạng bridge tùy chỉnh) nếu tác nhân cần truy cập ra ngoài.
`"host"` bị chặn. `"container:<id>"` bị chặn theo mặc định trừ khi bạn đặt rõ
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (phá kính khẩn cấp).
Các lượt Codex app-server trong một sandbox OpenClaw đang hoạt động dùng cùng thiết lập truy cập ra ngoài này cho quyền truy cập mạng code-mode gốc của chúng.

**Tệp đính kèm gửi vào** được đặt vào `media/inbound/*` trong workspace đang hoạt động.

**`docker.binds`** gắn thêm các thư mục máy chủ; bind toàn cục và theo từng tác nhân được hợp nhất.

**Trình duyệt trong sandbox** (`sandbox.browser.enabled`): Chromium + CDP trong một container. URL noVNC được chèn vào system prompt. Không yêu cầu `browser.enabled` trong `openclaw.json`.
Quyền truy cập quan sát noVNC dùng xác thực VNC theo mặc định và OpenClaw phát hành một URL token ngắn hạn (thay vì để lộ mật khẩu trong URL dùng chung).

- `allowHostControl: false` (mặc định) chặn các phiên sandbox nhắm tới trình duyệt máy chủ.
- `network` mặc định là `openclaw-sandbox-browser` (mạng bridge chuyên dụng). Chỉ đặt thành `bridge` khi bạn chủ động muốn kết nối bridge toàn cục.
- `cdpSourceRange` tùy chọn giới hạn ingress CDP ở biên container vào một dải CIDR (ví dụ `172.21.0.1/32`).
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` bật lại tiện ích mở rộng nếu workflow của bạn
    phụ thuộc vào chúng.
  - `--renderer-process-limit=2` có thể được thay đổi bằng
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; đặt `0` để dùng giới hạn tiến trình
    mặc định của Chromium.
  - cộng thêm `--no-sandbox` khi `noSandbox` được bật.
  - Mặc định là đường cơ sở của image container; dùng image trình duyệt tùy chỉnh với
    entrypoint tùy chỉnh để thay đổi mặc định container.

</Accordion>

Sandbox trình duyệt và `sandbox.docker.binds` chỉ hỗ trợ Docker.

Xây dựng image (từ một bản checkout nguồn):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

Đối với cài đặt npm không có bản checkout nguồn, xem [Sandboxing § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` nội tuyến.

### `agents.list` (ghi đè theo từng tác nhân)

Dùng `agents.list[].tts` để cấp cho một tác nhân nhà cung cấp TTS, giọng nói, model,
kiểu, hoặc chế độ auto-TTS riêng. Khối tác nhân deep-merge lên trên
`messages.tts` toàn cục, vì vậy thông tin xác thực dùng chung có thể ở một nơi trong khi từng
tác nhân chỉ ghi đè các trường giọng nói hoặc nhà cung cấp mà chúng cần. Ghi đè của tác nhân đang hoạt động
áp dụng cho phản hồi nói tự động, `/tts audio`, `/tts status`, và
công cụ tác nhân `tts`. Xem [Text-to-speech](/vi/tools/tts#per-agent-voice-overrides)
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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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
- `default`: khi đặt nhiều mục, mục đầu tiên thắng (ghi cảnh báo). Nếu không đặt mục nào, mục đầu tiên trong danh sách là mặc định.
- `model`: dạng chuỗi đặt primary nghiêm ngặt theo từng tác nhân và không có fallback model; dạng đối tượng `{ primary }` cũng nghiêm ngặt trừ khi bạn thêm `fallbacks`. Dùng `{ primary, fallbacks: [...] }` để cho tác nhân đó tham gia fallback, hoặc `{ primary, fallbacks: [] }` để làm rõ hành vi nghiêm ngặt. Các Cron job chỉ ghi đè `primary` vẫn kế thừa fallback mặc định trừ khi bạn đặt `fallbacks: []`.
- `params`: tham số stream theo từng tác nhân được hợp nhất lên trên mục model đã chọn trong `agents.defaults.models`. Dùng mục này cho các ghi đè riêng của tác nhân như `cacheRetention`, `temperature`, hoặc `maxTokens` mà không cần nhân bản toàn bộ catalog model.
- `tts`: ghi đè text-to-speech tùy chọn theo từng tác nhân. Khối này deep-merge lên trên `messages.tts`, vì vậy hãy giữ thông tin xác thực nhà cung cấp dùng chung và chính sách fallback trong `messages.tts`, rồi chỉ đặt các giá trị theo persona như nhà cung cấp, giọng nói, model, kiểu, hoặc chế độ tự động tại đây.
- `skills`: allowlist kỹ năng tùy chọn theo từng tác nhân. Nếu bỏ qua, tác nhân kế thừa `agents.defaults.skills` khi được đặt; một danh sách rõ ràng thay thế mặc định thay vì hợp nhất, và `[]` nghĩa là không có Skills.
- `thinkingDefault`: mức thinking mặc định tùy chọn theo từng tác nhân (`off | minimal | low | medium | high | xhigh | adaptive | max`). Ghi đè `agents.defaults.thinkingDefault` cho tác nhân này khi không có ghi đè theo tin nhắn hoặc phiên. Hồ sơ nhà cung cấp/model đã chọn kiểm soát giá trị nào hợp lệ; với Google Gemini, `adaptive` giữ thinking động do nhà cung cấp sở hữu (`thinkingLevel` bị bỏ qua trên Gemini 3/3.1, `thinkingBudget: -1` trên Gemini 2.5).
- `reasoningDefault`: hiển thị reasoning mặc định tùy chọn theo từng tác nhân (`on | off | stream`). Ghi đè `agents.defaults.reasoningDefault` cho tác nhân này khi không có ghi đè reasoning theo tin nhắn hoặc phiên.
- `fastModeDefault`: mặc định tùy chọn theo từng tác nhân cho fast mode (`"auto" | true | false`). Áp dụng khi không có ghi đè fast-mode theo tin nhắn hoặc phiên.
- `models`: ghi đè catalog model/runtime tùy chọn theo từng tác nhân, được khóa bằng id `provider/model` đầy đủ. Dùng `models["provider/model"].agentRuntime` cho các ngoại lệ runtime theo từng tác nhân.
- `runtime`: mô tả runtime tùy chọn theo từng tác nhân. Dùng `type: "acp"` với mặc định `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) khi tác nhân nên mặc định dùng các phiên ACP harness.
- `identity.avatar`: đường dẫn tương đối với workspace, URL `http(s)`, hoặc URI `data:`.
- Các tệp hình ảnh `identity.avatar` cục bộ tương đối với workspace bị giới hạn 2 MB. URL `http(s)` và URI `data:` không được kiểm tra bằng giới hạn kích thước tệp cục bộ.
- `identity` suy ra mặc định: `ackReaction` từ `emoji`, `mentionPatterns` từ `name`/`emoji`.
- `subagents.allowAgents`: allowlist các id tác nhân đã cấu hình cho đích `sessions_spawn.agentId` rõ ràng (`["*"]` = bất kỳ đích đã cấu hình nào; mặc định: chỉ cùng tác nhân). Bao gồm id của bên yêu cầu khi các lệnh gọi `agentId` tự nhắm mục tiêu nên được cho phép. Các mục cũ có cấu hình tác nhân đã bị xóa sẽ bị `sessions_spawn` từ chối và bị bỏ qua khỏi `agents_list`; chạy `openclaw doctor --fix` để dọn dẹp chúng, hoặc thêm một mục `agents.list[]` tối thiểu nếu đích đó vẫn nên có thể spawn trong khi kế thừa mặc định.
- Chốt kế thừa sandbox: nếu phiên bên yêu cầu đang ở trong sandbox, `sessions_spawn` từ chối các đích sẽ chạy không sandbox.
- `subagents.requireAgentId`: khi đúng, chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng; mặc định: false).

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

### Trường khớp binding

- `type` (tùy chọn): `route` cho định tuyến bình thường (thiếu type mặc định là route), `acp` cho binding cuộc hội thoại ACP bền vững.
- `match.channel` (bắt buộc)
- `match.accountId` (tùy chọn; `*` = bất kỳ tài khoản nào; bỏ qua = tài khoản mặc định)
- `match.peer` (tùy chọn; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (tùy chọn; theo từng kênh)
- `acp` (tùy chọn; chỉ cho `type: "acp"`): `{ mode, label, cwd, backend }`

**Thứ tự khớp tất định:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (chính xác, không peer/guild/team)
5. `match.accountId: "*"` (toàn kênh)
6. Tác nhân mặc định

Trong mỗi tầng, mục `bindings` khớp đầu tiên thắng.

Đối với các mục `type: "acp"`, OpenClaw phân giải theo danh tính cuộc hội thoại chính xác (`match.channel` + tài khoản + `match.peer.id`) và không dùng thứ tự tầng binding định tuyến ở trên.

### Hồ sơ truy cập theo từng tác nhân

<Accordion title="Quyền truy cập đầy đủ (không sandbox)">

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

Xem [Sandbox đa tác nhân & Công cụ](/vi/tools/multi-agent-sandbox-tools) để biết chi tiết về thứ tự ưu tiên.

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
      mode: "enforce", // enforce (default) | warn
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
  - `per-sender` (mặc định): mỗi người gửi có một phiên tách biệt trong ngữ cảnh kênh.
  - `global`: tất cả người tham gia trong một ngữ cảnh kênh dùng chung một phiên duy nhất (chỉ dùng khi chủ đích là dùng chung ngữ cảnh).
- **`dmScope`**: cách nhóm DM.
  - `main`: tất cả DM dùng chung phiên chính.
  - `per-peer`: tách biệt theo id người gửi trên các kênh.
  - `per-channel-peer`: tách biệt theo kênh + người gửi (khuyến nghị cho hộp thư đến nhiều người dùng).
  - `per-account-channel-peer`: tách biệt theo tài khoản + kênh + người gửi (khuyến nghị cho nhiều tài khoản).
- **`identityLinks`**: ánh xạ id chuẩn sang các peer có tiền tố nhà cung cấp để chia sẻ phiên giữa các kênh. Các lệnh ghim như `/dock_discord` dùng cùng ánh xạ để chuyển tuyến trả lời của phiên đang hoạt động sang một peer kênh đã liên kết khác; xem [Ghim kênh](/vi/concepts/channel-docking).
- **`reset`**: chính sách đặt lại chính. `daily` đặt lại vào giờ địa phương `atHour`; `idle` đặt lại sau `idleMinutes`. Khi cấu hình cả hai, điều kiện nào hết hạn trước sẽ thắng. Độ mới của đặt lại hằng ngày dùng `sessionStartedAt` của hàng phiên; độ mới của đặt lại nhàn rỗi dùng `lastInteractionAt`. Các lần ghi nền/sự kiện hệ thống như Heartbeat, đánh thức Cron, thông báo exec và sổ sách Gateway có thể cập nhật `updatedAt`, nhưng chúng không giữ cho phiên hằng ngày/nhàn rỗi còn mới.
- **`resetByType`**: ghi đè theo từng loại (`direct`, `group`, `thread`). `dm` cũ được chấp nhận làm bí danh cho `direct`.
- **`mainKey`**: trường cũ. Runtime luôn dùng `"main"` cho bucket trò chuyện trực tiếp chính.
- **`agentToAgent.maxPingPongTurns`**: số lượt trả lời qua lại tối đa giữa các tác nhân trong trao đổi tác nhân-với-tác nhân (số nguyên, phạm vi: `0`-`20`, mặc định: `5`). `0` tắt chuỗi ping-pong.
- **`sendPolicy`**: khớp theo `channel`, `chatType` (`direct|group|channel`, với bí danh cũ `dm`), `keyPrefix`, hoặc `rawKeyPrefix`. Lệnh từ chối đầu tiên sẽ thắng.
- **`maintenance`**: điều khiển dọn dẹp + lưu giữ kho phiên.
  - `mode`: `enforce` áp dụng dọn dẹp và là mặc định; `warn` chỉ phát cảnh báo.
  - `pruneAfter`: ngưỡng tuổi cho mục lỗi thời (mặc định `30d`).
  - `maxEntries`: số mục tối đa trong `sessions.json` (mặc định `500`). Runtime ghi dọn dẹp theo lô với một vùng đệm high-water nhỏ cho các giới hạn quy mô sản xuất; `openclaw sessions cleanup --enforce` áp dụng giới hạn ngay lập tức.
  - Các phiên thăm dò chạy mô hình Gateway ngắn hạn dùng thời gian lưu giữ cố định `24h`, nhưng dọn dẹp được chặn theo áp lực: nó chỉ xóa các hàng thăm dò chạy mô hình nghiêm ngặt đã lỗi thời khi đạt áp lực bảo trì/giới hạn mục phiên. Chỉ các khóa thăm dò tường minh nghiêm ngặt khớp `agent:*:explicit:model-run-<uuid>` mới đủ điều kiện; các phiên trực tiếp, nhóm, luồng, Cron, hook, Heartbeat, ACP và tác nhân phụ bình thường không kế thừa thời gian lưu giữ 24 giờ này. Khi dọn dẹp chạy mô hình chạy, nó chạy trước bước dọn dẹp mục lỗi thời `pruneAfter` rộng hơn và giới hạn `maxEntries`.
  - `rotateBytes`: đã ngừng dùng và bị bỏ qua; `openclaw doctor --fix` xóa nó khỏi cấu hình cũ.
  - `resetArchiveRetention`: thời gian lưu giữ cho kho lưu trữ bản ghi `*.reset.<timestamp>`. Mặc định là `pruneAfter`; đặt `false` để tắt.
  - `maxDiskBytes`: ngân sách đĩa tùy chọn cho thư mục phiên. Ở chế độ `warn`, nó ghi cảnh báo; ở chế độ `enforce`, nó xóa hiện vật/phiên cũ nhất trước.
  - `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp ngân sách. Mặc định là `80%` của `maxDiskBytes`.
- **`threadBindings`**: mặc định toàn cục cho các tính năng phiên gắn với luồng.
  - `enabled`: công tắc mặc định chính (nhà cung cấp có thể ghi đè; Discord dùng `channels.discord.threadBindings.enabled`)
  - `idleHours`: tự động bỏ tập trung mặc định sau thời gian không hoạt động tính bằng giờ (`0` tắt; nhà cung cấp có thể ghi đè)
  - `maxAgeHours`: tuổi tối đa cứng mặc định tính bằng giờ (`0` tắt; nhà cung cấp có thể ghi đè)
  - `spawnSessions`: cổng mặc định để tạo phiên công việc gắn với luồng từ `sessions_spawn` và các phiên sinh luồng ACP. Mặc định là `true` khi liên kết luồng được bật; nhà cung cấp/tài khoản có thể ghi đè.
  - `defaultSpawnContext`: ngữ cảnh tác nhân phụ gốc mặc định cho các phiên sinh gắn với luồng (`"fork"` hoặc `"isolated"`). Mặc định là `"fork"`.

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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

Ghi đè theo từng kênh/tài khoản: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Cách phân giải (cụ thể nhất thắng): tài khoản → kênh → toàn cục. `""` tắt và dừng chuỗi kế thừa. `"auto"` suy ra `[{identity.name}]`.

**Biến mẫu:**

| Biến              | Mô tả                 | Ví dụ                       |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | Tên mô hình ngắn      | `claude-opus-4-6`           |
| `{modelFull}`     | Mã định danh mô hình đầy đủ | `anthropic/claude-opus-4-6` |
| `{provider}`      | Tên nhà cung cấp      | `anthropic`                 |
| `{thinkingLevel}` | Mức suy luận hiện tại | `high`, `low`, `off`        |
| `{identity.name}` | Tên định danh tác nhân | (giống như `"auto"`)        |

Biến không phân biệt chữ hoa chữ thường. `{think}` là bí danh cho `{thinkingLevel}`.

### Phản ứng xác nhận

- Mặc định là `identity.emoji` của tác nhân đang hoạt động, nếu không thì là `"👀"`. Đặt `""` để tắt.
- Ghi đè theo từng kênh: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Thứ tự phân giải: tài khoản → kênh → `messages.ackReaction` → dự phòng định danh.
- Phạm vi: `group-mentions` (mặc định), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: xóa xác nhận sau khi trả lời trên các kênh hỗ trợ phản ứng như Slack, Discord, Telegram, WhatsApp và iMessage.
- `messages.statusReactions.enabled`: bật phản ứng trạng thái vòng đời trên Slack, Discord, Telegram và WhatsApp.
  Trên Slack và Discord, nếu không đặt thì vẫn bật phản ứng trạng thái khi phản ứng xác nhận đang hoạt động.
  Trên Telegram và WhatsApp, hãy đặt rõ ràng thành `true` để bật phản ứng trạng thái vòng đời.
- `messages.statusReactions.emojis`: ghi đè các khóa emoji vòng đời:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` và `stallHard`.
  Telegram chỉ cho phép một tập phản ứng cố định, vì vậy emoji đã cấu hình nhưng không được hỗ trợ sẽ dự phòng
  về biến thể trạng thái được hỗ trợ gần nhất cho cuộc trò chuyện đó.

### Chống dội đầu vào

Gộp các tin nhắn chỉ có văn bản được gửi nhanh từ cùng một người gửi thành một lượt tác nhân duy nhất. Phương tiện/tệp đính kèm sẽ xả ngay lập tức. Lệnh điều khiển bỏ qua chống dội.

### TTS (văn bản thành giọng nói)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` kiểm soát chế độ tự động TTS mặc định: `off`, `always`, `inbound`, hoặc `tagged`. `/tts on|off` có thể ghi đè tùy chọn cục bộ, và `/tts status` hiển thị trạng thái có hiệu lực.
- `summaryModel` ghi đè `agents.defaults.model.primary` cho tự động tóm tắt.
- `modelOverrides` được bật theo mặc định; `modelOverrides.allowProvider` mặc định là `false` (chọn tham gia).
- Khóa API dùng dự phòng `ELEVENLABS_API_KEY`/`XI_API_KEY` và `OPENAI_API_KEY`.
- Các nhà cung cấp giọng nói đi kèm do Plugin sở hữu. Nếu `plugins.allow` được đặt, hãy bao gồm từng Plugin nhà cung cấp TTS mà bạn muốn dùng, ví dụ `microsoft` cho Edge TTS. Id nhà cung cấp kế thừa `edge` được chấp nhận làm bí danh cho `microsoft`.
- `providers.openai.baseUrl` ghi đè điểm cuối OpenAI TTS. Thứ tự phân giải là cấu hình, rồi `OPENAI_TTS_BASE_URL`, rồi `https://api.openai.com/v1`.
- Khi `providers.openai.baseUrl` trỏ đến một điểm cuối không phải OpenAI, OpenClaw xem đó là máy chủ TTS tương thích OpenAI và nới lỏng xác thực mô hình/giọng nói.

---

## Nói chuyện

Mặc định cho chế độ Nói chuyện (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
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
          speakerVoice: "cedar",
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

- `talk.provider` phải khớp với một khóa trong `talk.providers` khi nhiều nhà cung cấp Nói chuyện được cấu hình.
- Các khóa Nói chuyện phẳng kế thừa (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) chỉ dùng cho tương thích. Chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu vào `talk.providers.<provider>`.
- Id giọng nói dùng dự phòng `ELEVENLABS_VOICE_ID` hoặc `SAG_VOICE_ID`.
- `providers.*.apiKey` chấp nhận chuỗi văn bản thuần hoặc đối tượng SecretRef.
- Dự phòng `ELEVENLABS_API_KEY` chỉ áp dụng khi không có khóa API Nói chuyện nào được cấu hình.
- `providers.*.voiceAliases` cho phép chỉ thị Nói chuyện dùng tên thân thiện.
- `providers.mlx.modelId` chọn repo Hugging Face được trình trợ giúp MLX cục bộ trên macOS sử dụng. Nếu bỏ qua, macOS dùng `mlx-community/Soprano-80M-bf16`.
- Phát lại MLX trên macOS chạy qua trình trợ giúp `openclaw-mlx-tts` đi kèm khi có, hoặc một tệp thực thi trên `PATH`; `OPENCLAW_MLX_TTS_BIN` ghi đè đường dẫn trình trợ giúp cho phát triển.
- `consultThinkingLevel` kiểm soát mức suy nghĩ cho lượt chạy tác tử OpenClaw đầy đủ phía sau các lệnh gọi Control UI Talk thời gian thực `openclaw_agent_consult`. Để trống để giữ nguyên hành vi phiên/mô hình bình thường.
- `consultFastMode` đặt ghi đè chế độ nhanh một lần cho các lượt tham vấn Control UI Talk thời gian thực mà không thay đổi thiết lập chế độ nhanh bình thường của phiên.
- `speechLocale` đặt id ngôn ngữ BCP 47 được nhận dạng giọng nói Talk trên iOS/macOS sử dụng. Để trống để dùng mặc định của thiết bị.
- `silenceTimeoutMs` kiểm soát thời gian chế độ Talk chờ sau khi người dùng im lặng trước khi gửi bản chép lời. Không đặt sẽ giữ khoảng tạm dừng mặc định của nền tảng (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` nối thêm chỉ dẫn hệ thống hướng tới nhà cung cấp vào prompt thời gian thực tích hợp sẵn của OpenClaw, để có thể cấu hình phong cách giọng nói mà không mất hướng dẫn `openclaw_agent_consult` mặc định.
- `realtime.consultRouting` kiểm soát dự phòng chuyển tiếp Gateway khi nhà cung cấp thời gian thực tạo bản chép lời cuối cùng của người dùng mà không có `openclaw_agent_consult`: `provider-direct` giữ nguyên phản hồi trực tiếp của nhà cung cấp, còn `force-agent-consult` định tuyến yêu cầu đã hoàn tất qua OpenClaw.

---

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — tất cả các khóa cấu hình khác
- [Cấu hình](/vi/gateway/configuration) — các tác vụ thường gặp và thiết lập nhanh
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
