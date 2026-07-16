---
read_when:
    - Tinh chỉnh các giá trị mặc định của tác tử (mô hình, suy luận, không gian làm việc, Heartbeat, phương tiện, Skills)
    - Cấu hình định tuyến và liên kết đa tác tử
    - Điều chỉnh hành vi của phiên, chuyển phát tin nhắn và chế độ trò chuyện
summary: Cấu hình mặc định của tác tử, định tuyến đa tác tử, phiên, tin nhắn và trò chuyện
title: Cấu hình — tác tử
x-i18n:
    generated_at: "2026-07-16T14:22:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

Các khóa cấu hình theo phạm vi tác nhân nằm dưới `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` và `talk.*`. Đối với các kênh, công cụ, runtime Gateway và các khóa
cấp cao nhất khác, xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Giá trị mặc định của tác nhân

### `agents.defaults.workspace`

Mặc định: `OPENCLAW_WORKSPACE_DIR` khi được đặt, nếu không thì là `~/.openclaw/workspace` (hoặc `~/.openclaw/workspace-<profile>` khi `OPENCLAW_PROFILE` được đặt thành một hồ sơ không mặc định).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Giá trị `agents.defaults.workspace` được đặt rõ ràng sẽ được ưu tiên hơn
`OPENCLAW_WORKSPACE_DIR`. Sử dụng biến môi trường để trỏ các tác nhân mặc định
đến một không gian làm việc được gắn kết khi bạn không muốn ghi đường dẫn đó vào cấu hình.

### `agents.defaults.repoRoot`

Thư mục gốc kho lưu trữ tùy chọn được hiển thị trong dòng Runtime của lời nhắc hệ thống. Nếu không được đặt, OpenClaw tự động phát hiện bằng cách duyệt ngược lên từ không gian làm việc.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Danh sách cho phép Skills mặc định tùy chọn dành cho các tác nhân không đặt
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // kế thừa github, weather
      { id: "docs", skills: ["docs-search"] }, // thay thế giá trị mặc định
      { id: "locked-down", skills: [] }, // không có Skills
    ],
  },
}
```

- Bỏ qua `agents.defaults.skills` để mặc định không hạn chế Skills.
- Bỏ qua `agents.list[].skills` để kế thừa các giá trị mặc định.
- Đặt `agents.list[].skills: []` để không có Skills.
- Danh sách `agents.list[].skills` không rỗng là tập hợp cuối cùng cho tác nhân đó; danh sách này
  không hợp nhất với các giá trị mặc định.

### `agents.defaults.skipBootstrap`

Tắt việc tự động tạo các tệp bootstrap của không gian làm việc (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Bỏ qua việc tạo các tệp không gian làm việc tùy chọn đã chọn trong khi vẫn ghi các tệp bootstrap bắt buộc (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Các giá trị hợp lệ: `SOUL.md`, `USER.md`, `HEARTBEAT.md` và `IDENTITY.md`.

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

Kiểm soát thời điểm các tệp bootstrap của không gian làm việc được chèn vào lời nhắc hệ thống. Mặc định: `"always"`.

- `"continuation-skip"`: các lượt tiếp tục an toàn (sau một phản hồi đã hoàn tất của trợ lý) bỏ qua việc chèn lại bootstrap của không gian làm việc, giúp giảm kích thước lời nhắc. Các lần chạy Heartbeat và lần thử lại sau Compaction vẫn dựng lại ngữ cảnh.
- `"never"`: tắt việc chèn bootstrap của không gian làm việc và tệp ngữ cảnh ở mọi lượt. Chỉ sử dụng tùy chọn này cho các tác nhân hoàn toàn sở hữu vòng đời lời nhắc của mình (công cụ ngữ cảnh tùy chỉnh, runtime gốc tự xây dựng ngữ cảnh hoặc quy trình chuyên biệt không dùng bootstrap). Các lượt Heartbeat và khôi phục sau Compaction cũng bỏ qua việc chèn.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Ghi đè theo tác nhân: `agents.list[].contextInjection`. Các giá trị bị bỏ qua sẽ kế thừa
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Số ký tự tối đa cho mỗi tệp bootstrap của không gian làm việc trước khi bị cắt ngắn. Mặc định: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Ghi đè theo tác nhân: `agents.list[].bootstrapMaxChars`. Các giá trị bị bỏ qua sẽ kế thừa
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Tổng số ký tự tối đa được chèn từ tất cả các tệp bootstrap của không gian làm việc. Mặc định: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Ghi đè theo tác nhân: `agents.list[].bootstrapTotalMaxChars`. Các giá trị bị bỏ qua
sẽ kế thừa `agents.defaults.bootstrapTotalMaxChars`.

### Ghi đè hồ sơ bootstrap theo tác nhân

Sử dụng ghi đè hồ sơ bootstrap theo tác nhân khi một tác nhân cần hành vi chèn
lời nhắc khác với các giá trị mặc định dùng chung. Các trường bị bỏ qua sẽ kế thừa từ
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

Kiểm soát thông báo trong lời nhắc hệ thống mà tác nhân nhìn thấy khi ngữ cảnh bootstrap bị cắt ngắn.
Mặc định: `"always"`.

- `"off"`: không bao giờ chèn văn bản thông báo cắt ngắn vào lời nhắc hệ thống.
- `"once"`: chèn một thông báo ngắn gọn một lần cho mỗi chữ ký cắt ngắn duy nhất.
- `"always"`: chèn một thông báo ngắn gọn trong mỗi lần chạy khi có cắt ngắn (khuyến nghị).

Số lượng thô/đã chèn chi tiết và các trường tinh chỉnh cấu hình vẫn nằm trong dữ liệu chẩn đoán như
báo cáo ngữ cảnh/trạng thái và nhật ký; ngữ cảnh người dùng/runtime WebChat thông thường chỉ
nhận được thông báo khôi phục ngắn gọn.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Bản đồ quyền sở hữu ngân sách ngữ cảnh

OpenClaw có nhiều ngân sách lời nhắc/ngữ cảnh dung lượng lớn và chúng được
chủ ý phân chia theo hệ thống con thay vì tất cả đều đi qua một núm điều khiển
chung.

| Ngân sách                                                         | Phạm vi                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Việc chèn bootstrap không gian làm việc thông thường                                                                                                                            |
| `agents.defaults.startupContext.*`                             | Phần mở đầu một lần cho lần chạy mô hình khi đặt lại/khởi động, bao gồm các tệp `memory/*.md` hằng ngày gần đây. Các lệnh trò chuyện thuần `/new` và `/reset` được xác nhận mà không gọi mô hình |
| `skills.limits.*`                                              | Danh sách Skills thu gọn được chèn vào lời nhắc hệ thống                                                                                                         |
| `agents.defaults.contextLimits.*`                              | Các đoạn trích runtime có giới hạn và các khối do runtime sở hữu được chèn                                                                                                      |
| `memory.qmd.limits.*`                                          | Định cỡ đoạn trích tìm kiếm bộ nhớ đã lập chỉ mục và phần chèn                                                                                                              |

Các ghi đè tương ứng theo tác nhân:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kiểm soát phần mở đầu khởi động ở lượt đầu tiên được chèn vào các lần chạy mô hình khi đặt lại/khởi động.
Các lệnh trò chuyện thuần `/new` và `/reset` xác nhận việc đặt lại mà không gọi
mô hình, vì vậy chúng không tải phần mở đầu này.

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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: giới hạn đoạn trích `memory_get` mặc định trước khi thêm
  siêu dữ liệu cắt ngắn và thông báo tiếp tục.
- `memoryGetDefaultLines`: cửa sổ dòng `memory_get` mặc định khi `lines`
  bị bỏ qua.
- `toolResultMaxChars`: trần kết quả công cụ trực tiếp nâng cao dùng cho các kết quả
  được lưu bền vững và khôi phục khi tràn. Để không đặt nhằm dùng giới hạn tự động theo ngữ cảnh mô hình:
  `16000` ký tự dưới 100K token, `32000` ký tự ở mức 100K+ token và `64000`
  ký tự ở mức 200K+ token. Các giá trị được đặt rõ ràng lên đến `1000000` được chấp nhận cho
  các mô hình ngữ cảnh dài, nhưng giới hạn hiệu dụng vẫn bị giới hạn ở khoảng 30% cửa sổ
  ngữ cảnh của mô hình. `openclaw doctor --deep` in ra giới hạn hiệu dụng
  và doctor chỉ cảnh báo khi một giá trị ghi đè rõ ràng đã lỗi thời hoặc không có tác dụng.
- `postCompactionMaxChars`: giới hạn đoạn trích AGENTS.md được dùng trong quá trình chèn
  làm mới sau Compaction.

#### `agents.list[].contextLimits`

Ghi đè theo tác nhân cho các núm điều khiển `contextLimits` dùng chung. Các trường bị bỏ qua sẽ kế thừa
từ `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // trần nâng cao cho tác nhân này
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Giới hạn toàn cục cho danh sách Skills thu gọn được chèn vào lời nhắc hệ thống. Điều này
không ảnh hưởng đến việc đọc các tệp `SKILL.md` theo yêu cầu.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Ghi đè theo tác nhân cho ngân sách lời nhắc Skills.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Kích thước pixel tối đa cho cạnh ảnh dài nhất trong các khối ảnh của bản chép lời/công cụ trước khi gọi nhà cung cấp.
Mặc định: `1200`.

Các giá trị thấp hơn thường làm giảm mức sử dụng token thị giác và kích thước tải trọng yêu cầu đối với các lần chạy có nhiều ảnh chụp màn hình.
Các giá trị cao hơn giữ lại nhiều chi tiết hình ảnh hơn.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Tùy chọn nén/chi tiết của công cụ hình ảnh cho các hình ảnh được tải từ đường dẫn tệp, URL và tham chiếu phương tiện.
Mặc định: `auto`.

OpenClaw điều chỉnh thang thay đổi kích thước theo mô hình hình ảnh đã chọn. Ví dụ: Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL và các mô hình thị giác Llama 4 được lưu trữ có thể sử dụng hình ảnh lớn hơn so với các luồng thị giác chi tiết cao cũ/mặc định, trong khi các lượt có nhiều hình ảnh được nén mạnh hơn ở chế độ `auto` để kiểm soát chi phí token và độ trễ.

Các giá trị:

- `auto`: thích ứng với giới hạn mô hình và số lượng hình ảnh.
- `efficient`: ưu tiên hình ảnh nhỏ hơn để giảm mức sử dụng token và byte.
- `balanced`: sử dụng thang trung dung tiêu chuẩn.
- `high`: giữ lại nhiều chi tiết hơn cho ảnh chụp màn hình, sơ đồ và hình ảnh tài liệu.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Múi giờ cho ngữ cảnh lời nhắc hệ thống (không phải dấu thời gian của tin nhắn). Dùng múi giờ của máy chủ làm phương án dự phòng.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Định dạng thời gian trong lời nhắc hệ thống. Mặc định: `auto` (tùy chọn của hệ điều hành).

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
      utilityModel: "openai/gpt-5.4-mini",
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
      params: { cacheRetention: "long" }, // tham số nhà cung cấp mặc định toàn cục
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: chấp nhận chuỗi (`"provider/model"`) hoặc đối tượng (`{ primary, fallbacks }`).
  - Dạng chuỗi chỉ đặt mô hình chính.
  - Dạng đối tượng đặt mô hình chính cùng các mô hình chuyển đổi dự phòng theo thứ tự.
- `utilityModel`: tham chiếu hoặc bí danh `provider/model` tùy chọn cho các tác vụ nội bộ ngắn. Hiện tại, nó hỗ trợ tiêu đề phiên Control UI được tạo tự động, tiêu đề chủ đề tin nhắn riêng trên Telegram, tiêu đề luồng tự động trên Discord và [phần tường thuật bản nháp tiến trình](/vi/concepts/progress-drafts#narrated-status). Khi không được đặt, OpenClaw suy ra mô hình nhỏ mặc định do nhà cung cấp chính khai báo nếu có (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); nếu không, các tác vụ tiêu đề sẽ dự phòng về mô hình chính của tác tử và phần tường thuật vẫn tắt. Đặt `utilityModel: ""` để tắt hoàn toàn việc định tuyến tiện ích. `agents.list[].utilityModel` ghi đè giá trị mặc định (giá trị trống theo từng tác tử sẽ tắt tính năng này cho tác tử đó), còn giá trị ghi đè mô hình dành riêng cho thao tác sẽ được ưu tiên hơn cả hai. Các tác vụ tiện ích thực hiện những lệnh gọi mô hình riêng biệt và gửi nội dung dành riêng cho tác vụ đến nhà cung cấp mô hình đã chọn. Việc tạo tiêu đề bảng điều khiển gửi tối đa 1,000 ký tự đầu tiên của tin nhắn đầu tiên không phải lệnh; phần tường thuật gửi yêu cầu đến cùng các bản tóm tắt công cụ ngắn gọn đã được che thông tin nhạy cảm. Chọn nhà cung cấp phù hợp với yêu cầu về chi phí và xử lý dữ liệu.
- `imageModel`: chấp nhận chuỗi (`"provider/model"`) hoặc đối tượng (`{ primary, fallbacks }`).
  - Được đường dẫn công cụ `image` sử dụng làm cấu hình mô hình thị giác khi mô hình đang hoạt động không thể tiếp nhận hình ảnh. Thay vào đó, các mô hình có khả năng thị giác gốc nhận trực tiếp các byte hình ảnh đã tải.
  - Cũng được dùng làm định tuyến dự phòng khi mô hình đã chọn/mặc định không thể tiếp nhận đầu vào hình ảnh.
  - Ưu tiên các tham chiếu `provider/model` tường minh. ID thuần được chấp nhận để tương thích; nếu một ID thuần khớp duy nhất với một mục có khả năng xử lý hình ảnh đã cấu hình trong `models.providers.*.models`, OpenClaw sẽ thêm định danh nhà cung cấp cho ID đó. Các kết quả khớp cấu hình không rõ ràng yêu cầu tiền tố nhà cung cấp tường minh.
- `imageGenerationModel`: chấp nhận chuỗi (`"provider/model"`) hoặc đối tượng (`{ primary, fallbacks }`).
  - Được dùng bởi khả năng tạo hình ảnh dùng chung và mọi bề mặt công cụ/Plugin trong tương lai có chức năng tạo hình ảnh.
  - Các giá trị thường dùng: `google/gemini-3.1-flash-image-preview` để tạo hình ảnh Gemini gốc, `fal/fal-ai/flux/dev` cho fal, `openai/gpt-image-2` cho OpenAI Images hoặc `openai/gpt-image-1.5` cho đầu ra PNG/WebP OpenAI có nền trong suốt.
  - Nếu chọn trực tiếp nhà cung cấp/mô hình, hãy cấu hình cả thông tin xác thực tương ứng của nhà cung cấp (ví dụ: `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` cho `google/*`, `OPENAI_API_KEY` hoặc OAuth OpenAI Codex cho `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` cho `fal/*`).
  - Nếu bỏ qua, `image_generate` vẫn có thể suy ra nhà cung cấp mặc định được hỗ trợ bằng thông tin xác thực. Trước tiên, nó thử nhà cung cấp mặc định hiện tại, sau đó thử các nhà cung cấp tạo hình ảnh còn lại đã đăng ký theo thứ tự ID nhà cung cấp.
- `musicGenerationModel`: chấp nhận chuỗi (`"provider/model"`) hoặc đối tượng (`{ primary, fallbacks }`).
  - Được dùng bởi khả năng tạo nhạc dùng chung và công cụ `music_generate` tích hợp sẵn.
  - Các giá trị thường dùng: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` hoặc `minimax/music-2.6`.
  - Nếu bỏ qua, `music_generate` vẫn có thể suy ra nhà cung cấp mặc định được hỗ trợ bằng thông tin xác thực. Trước tiên, nó thử nhà cung cấp mặc định hiện tại, sau đó thử các nhà cung cấp tạo nhạc còn lại đã đăng ký theo thứ tự ID nhà cung cấp.
  - Nếu chọn trực tiếp nhà cung cấp/mô hình, hãy cấu hình cả thông tin xác thực/khóa API tương ứng của nhà cung cấp.
- `videoGenerationModel`: chấp nhận chuỗi (`"provider/model"`) hoặc đối tượng (`{ primary, fallbacks }`).
  - Được dùng bởi khả năng tạo video dùng chung và công cụ `video_generate` tích hợp sẵn.
  - Các giá trị thường dùng: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` hoặc `qwen/wan2.7-r2v`.
  - Nếu bỏ qua, `video_generate` vẫn có thể suy ra nhà cung cấp mặc định được hỗ trợ bằng thông tin xác thực. Trước tiên, nó thử nhà cung cấp mặc định hiện tại, sau đó thử các nhà cung cấp tạo video còn lại đã đăng ký theo thứ tự ID nhà cung cấp.
  - Nếu chọn trực tiếp nhà cung cấp/mô hình, hãy cấu hình cả thông tin xác thực/khóa API tương ứng của nhà cung cấp.
  - Plugin tạo video Qwen chính thức hỗ trợ tối đa 1 video đầu ra, 1 hình ảnh đầu vào, 4 video đầu vào, thời lượng 10 giây cùng các tùy chọn `size`, `aspectRatio`, `resolution`, `audio` và `watermark` ở cấp nhà cung cấp.
- `pdfModel`: chấp nhận chuỗi (`"provider/model"`) hoặc đối tượng (`{ primary, fallbacks }`).
  - Được công cụ `pdf` sử dụng để định tuyến mô hình.
  - Nếu bỏ qua, công cụ PDF sẽ dự phòng về `imageModel`, sau đó đến mô hình phiên/mặc định đã phân giải.
- `pdfMaxBytesMb`: giới hạn kích thước PDF mặc định cho công cụ `pdf` khi `maxBytesMb` không được truyền tại thời điểm gọi.
- `pdfMaxPages`: số trang tối đa mặc định được xem xét trong chế độ trích xuất dự phòng của công cụ `pdf`.
- `verboseDefault`: mức độ chi tiết mặc định cho tác tử. Các giá trị: `"off"`, `"on"`, `"full"`. Mặc định: `"off"`.
- `toolProgressDetail`: chế độ chi tiết cho phần tóm tắt công cụ `/verbose` và các dòng công cụ trong bản nháp tiến trình. Các giá trị: `"explain"` (mặc định, nhãn ngắn gọn dễ hiểu) hoặc `"raw"` (nối thêm lệnh/chi tiết thô khi có). `agents.list[].toolProgressDetail` theo từng tác tử ghi đè giá trị mặc định này.
- `reasoningDefault`: khả năng hiển thị suy luận mặc định cho tác tử. Các giá trị: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` theo từng tác tử ghi đè giá trị mặc định này. Các giá trị suy luận mặc định đã cấu hình chỉ được áp dụng cho chủ sở hữu, người gửi được ủy quyền hoặc ngữ cảnh Gateway của quản trị viên vận hành khi chưa đặt giá trị ghi đè suy luận theo tin nhắn hoặc phiên.
- `elevatedDefault`: mức đầu ra nâng cao mặc định cho tác tử. Các giá trị: `"off"`, `"on"`, `"ask"`, `"full"`. Mặc định: `"on"`.
- `model.primary`: định dạng `provider/model` (ví dụ: `openai/gpt-5.6-sol` cho quyền truy cập OAuth Codex). Nếu bỏ qua nhà cung cấp, trước tiên OpenClaw thử một bí danh, sau đó tìm một kết quả khớp duy nhất trong các nhà cung cấp đã cấu hình cho đúng ID mô hình đó và chỉ sau đó mới dự phòng về nhà cung cấp mặc định đã cấu hình (hành vi tương thích đã lỗi thời, vì vậy nên ưu tiên `provider/model` tường minh). Nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw sẽ dự phòng về nhà cung cấp/mô hình đầu tiên đã cấu hình thay vì báo lỗi về giá trị mặc định của nhà cung cấp đã bị loại bỏ và không còn hợp lệ.
- `models`: danh mục mô hình và danh sách cho phép đã cấu hình cho `/model`. Mỗi mục có thể bao gồm `alias` (lối tắt) và `params` (dành riêng cho nhà cung cấp, ví dụ: `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, định tuyến `provider` của OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Sử dụng các mục `provider/*` như `"openai/*": {}` hoặc `"vllm/*": {}` để hiển thị tất cả mô hình được phát hiện cho các nhà cung cấp đã chọn mà không cần liệt kê thủ công từng ID mô hình.
  - Thêm `agentRuntime` vào một mục `provider/*` khi mọi mô hình được phát hiện động của nhà cung cấp đó cần sử dụng cùng một runtime. Chính sách runtime `provider/model` khớp chính xác vẫn được ưu tiên hơn ký tự đại diện.
  - Chỉnh sửa an toàn: sử dụng `openclaw config set agents.defaults.models '<json>' --strict-json --merge` để thêm mục. `config set` từ chối các thao tác thay thế có thể xóa những mục hiện có trong danh sách cho phép, trừ khi truyền `--replace`.
  - Các luồng cấu hình/tiếp nhận ban đầu theo phạm vi nhà cung cấp hợp nhất những mô hình nhà cung cấp đã chọn vào bản đồ này và giữ nguyên các nhà cung cấp không liên quan đã được cấu hình.
  - Đối với các mô hình OpenAI Responses trực tiếp, Compaction phía máy chủ được bật tự động. Sử dụng `params.responsesServerCompaction: false` để ngừng chèn `context_management` hoặc `params.responsesCompactThreshold` để ghi đè ngưỡng. Xem [Compaction phía máy chủ của OpenAI](/vi/providers/openai#advanced-configuration).
- `params`: các tham số nhà cung cấp mặc định toàn cục được áp dụng cho tất cả mô hình. Đặt tại `agents.defaults.params` (ví dụ: `{ cacheRetention: "long" }`).
- Thứ tự ưu tiên hợp nhất `params` (cấu hình): `agents.defaults.params` (cơ sở toàn cục) bị `agents.defaults.models["provider/model"].params` (theo từng mô hình) ghi đè, sau đó `agents.list[].params` (khớp ID tác tử) ghi đè theo khóa. Xem [Bộ nhớ đệm lời nhắc](/vi/reference/prompt-caching) để biết chi tiết.
- `models.providers.openrouter.params.provider`: chính sách định tuyến nhà cung cấp mặc định trên toàn OpenRouter. OpenClaw chuyển tiếp chính sách này đến đối tượng `provider` trong yêu cầu của OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` theo từng mô hình và các tham số tác tử ghi đè theo khóa. Xem [định tuyến nhà cung cấp OpenRouter](/vi/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON truyền thẳng nâng cao được hợp nhất vào nội dung yêu cầu `api: "openai-completions"` cho các proxy tương thích với OpenAI. Nếu xung đột với các khóa yêu cầu được tạo, nội dung bổ sung sẽ được ưu tiên; sau đó, các tuyến hoàn thành không phải tuyến gốc vẫn loại bỏ `store` chỉ dành cho OpenAI.
- `params.chat_template_kwargs`: các đối số mẫu trò chuyện tương thích với vLLM/OpenAI được hợp nhất vào nội dung yêu cầu `api: "openai-completions"` cấp cao nhất. Đối với `vllm/nemotron-3-*` khi tắt chế độ suy nghĩ, Plugin vLLM đi kèm tự động gửi `enable_thinking: false` và `force_nonempty_content: true`; `chat_template_kwargs` tường minh ghi đè các giá trị mặc định được tạo và `extra_body.chat_template_kwargs` vẫn có mức ưu tiên cuối cùng. Các mô hình suy nghĩ Qwen và Nemotron trên vLLM đã cấu hình cung cấp lựa chọn `/think` dạng nhị phân (`off`, `on`) thay cho thang mức nỗ lực nhiều cấp.
- `compat.thinkingFormat`: kiểu tải trọng suy nghĩ tương thích với OpenAI. Sử dụng `"together"` cho `reasoning.enabled` kiểu Together, `"qwen"` cho `enable_thinking` cấp cao nhất kiểu Qwen hoặc `"qwen-chat-template"` cho `chat_template_kwargs.enable_thinking` trên các backend thuộc họ Qwen hỗ trợ đối số từ khóa mẫu trò chuyện ở cấp yêu cầu, chẳng hạn như vLLM. OpenClaw ánh xạ trạng thái tắt suy nghĩ thành `false` và bật suy nghĩ thành `true`; các mô hình Qwen trên vLLM đã cấu hình cung cấp lựa chọn `/think` dạng nhị phân cho các định dạng này.
- `compat.supportedReasoningEfforts`: danh sách mức nỗ lực suy luận tương thích với OpenAI theo từng mô hình. Bao gồm `"xhigh"` cho các điểm cuối tùy chỉnh thực sự chấp nhận giá trị đó; khi ấy, OpenClaw cung cấp `/think xhigh` trong menu lệnh, các hàng phiên Gateway, quy trình xác thực bản vá phiên, xác thực CLI của tác tử và xác thực `llm-task` cho nhà cung cấp/mô hình đã cấu hình đó. Sử dụng `compat.reasoningEffortMap` khi backend yêu cầu giá trị dành riêng cho nhà cung cấp tương ứng với một mức chuẩn hóa.
- `params.preserveThinking`: tùy chọn chỉ dành cho Z.AI để bật chế độ giữ nguyên suy nghĩ. Khi được bật và chế độ suy nghĩ đang hoạt động, OpenClaw gửi `thinking.clear_thinking: false` và phát lại `reasoning_content` trước đó; xem [chế độ suy nghĩ và giữ nguyên suy nghĩ của Z.AI](/vi/providers/zai#advanced-configuration).
- `localService`: trình quản lý tiến trình tùy chọn ở cấp nhà cung cấp dành cho các máy chủ mô hình cục bộ/tự lưu trữ. Khi mô hình đã chọn thuộc nhà cung cấp đó, OpenClaw thăm dò `healthUrl` (hoặc `baseUrl + "/models"`), khởi động `command` với `args` nếu điểm cuối ngừng hoạt động, chờ tối đa `readyTimeoutMs`, rồi gửi yêu cầu mô hình. `command` phải là đường dẫn tuyệt đối. `idleStopMs: 0` giữ tiến trình hoạt động cho đến khi OpenClaw thoát; giá trị dương sẽ dừng tiến trình do OpenClaw khởi chạy sau số mili giây không hoạt động tương ứng. Xem [Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services).
- Chính sách runtime thuộc về nhà cung cấp hoặc mô hình, không phải `agents.defaults`. Sử dụng `models.providers.<provider>.agentRuntime` cho các quy tắc áp dụng trên toàn nhà cung cấp hoặc `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` cho các quy tắc dành riêng cho mô hình. Chỉ riêng tiền tố nhà cung cấp/mô hình không bao giờ chọn harness. Khi runtime chưa được đặt hoặc là `auto`, OpenAI chỉ có thể ngầm chọn Codex cho một tuyến HTTPS chính thức chính xác của Platform Responses hoặc ChatGPT Responses mà không có ghi đè yêu cầu do người dùng tạo. Xem [runtime tác nhân ngầm định của OpenAI](/vi/providers/openai#implicit-agent-runtime).
- Các trình ghi cấu hình sửa đổi những trường này (ví dụ: `/models set`, `/models set-image` và các lệnh thêm/xóa dự phòng) sẽ lưu dạng đối tượng chuẩn tắc và bảo toàn các danh sách dự phòng hiện có khi có thể.
- `maxConcurrent`: số lượt chạy tác nhân song song tối đa giữa các phiên (mỗi phiên vẫn được tuần tự hóa). Mặc định: `4`.

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, một id harness plugin đã đăng ký hoặc một bí danh backend CLI được hỗ trợ. Plugin Codex đi kèm đăng ký `codex`; plugin Anthropic đi kèm cung cấp backend CLI `claude-cli`.
- `id: "auto"` cho phép các harness plugin đã đăng ký tiếp nhận những tuyến hiệu dụng khai báo hoặc đáp ứng hợp đồng hỗ trợ của chúng theo cách khác, đồng thời sử dụng OpenClaw khi không có harness nào khớp. Một runtime plugin tường minh như `id: "codex"` yêu cầu harness đó và một tuyến hiệu dụng tương thích; nó đóng khi lỗi nếu một trong hai không khả dụng hoặc nếu quá trình thực thi thất bại.
- `id: "pi"` chỉ được chấp nhận dưới dạng bí danh không còn được khuyến nghị cho `openclaw` nhằm duy trì các cấu hình đã phát hành từ v2026.5.22 trở về trước. Cấu hình mới nên sử dụng `openclaw`.
- Thứ tự ưu tiên runtime là chính sách mô hình chính xác trước tiên (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` hoặc `models.providers.<provider>.models[]`), sau đó là `agents.list[]` / `agents.defaults.models["provider/*"]`, rồi đến chính sách áp dụng cho toàn bộ nhà cung cấp tại `models.providers.<provider>.agentRuntime`.
- Các khóa runtime cho toàn bộ agent là dạng cũ. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, các ghim runtime của phiên và `OPENCLAW_AGENT_RUNTIME` bị quá trình lựa chọn runtime bỏ qua. Chạy `openclaw doctor --fix` để loại bỏ các giá trị lỗi thời.
- Các tuyến OpenAI Responses/ChatGPT HTTPS chính thức, chính xác và đủ điều kiện, không có giá trị ghi đè yêu cầu do tác giả đặt, có thể ngầm sử dụng harness Codex. `agentRuntime.id: "codex"` ở cấp nhà cung cấp/mô hình khiến Codex trở thành yêu cầu đóng khi lỗi, nhưng không làm cho một tuyến không tương thích trở nên tương thích.
- Đối với các bản triển khai Claude CLI, nên dùng `model: "anthropic/claude-opus-4-8"` cùng với `agentRuntime.id: "claude-cli"` có phạm vi theo mô hình. Các tham chiếu `claude-cli/<model>` cũ vẫn hoạt động để duy trì khả năng tương thích, nhưng cấu hình mới nên giữ cách lựa chọn nhà cung cấp/mô hình ở dạng chuẩn tắc và đặt backend thực thi trong chính sách runtime của nhà cung cấp/mô hình.
- Thiết lập này chỉ kiểm soát việc thực thi lượt agent văn bản. Việc tạo nội dung đa phương tiện, thị giác, PDF, nhạc, video và TTS vẫn sử dụng các thiết lập nhà cung cấp/mô hình tương ứng.

**Dạng viết tắt của bí danh tích hợp sẵn** (chỉ áp dụng khi mô hình nằm trong `agents.defaults.models`):

| Bí danh             | Mô hình                         |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Các bí danh do bạn cấu hình luôn được ưu tiên hơn giá trị mặc định.

Các mô hình Z.AI GLM-4.x tự động bật chế độ suy nghĩ trừ khi bạn đặt `--thinking off` hoặc tự định nghĩa `agents.defaults.models["zai/<model>"].params.thinking`.
Các mô hình Z.AI mặc định bật `tool_stream` để truyền phát lệnh gọi công cụ. Đặt `agents.defaults.models["zai/<model>"].params.tool_stream` thành `false` để tắt tính năng này.
Anthropic Claude Opus 4.8 mặc định tắt suy nghĩ trong OpenClaw; khi suy nghĩ thích ứng được bật tường minh, mức nỗ lực mặc định do nhà cung cấp Anthropic sở hữu là `high`. Các mô hình Claude 4.6 mặc định sử dụng `adaptive` khi không đặt tường minh mức suy nghĩ.

### `agents.defaults.cliBackends`

Các backend CLI tùy chọn dành cho những lượt chạy dự phòng chỉ có văn bản (không gọi công cụ). Hữu ích làm phương án dự phòng khi các nhà cung cấp API gặp lỗi.

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
          // Hoặc sử dụng systemPromptFileArg khi CLI chấp nhận cờ tệp lời nhắc.
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
- Phiên được hỗ trợ khi `sessionArg` được đặt.
- Hỗ trợ chuyển tiếp hình ảnh khi `imageArg` chấp nhận đường dẫn tệp.
- `reseedFromRawTranscriptWhenUncompacted: true` cho phép một backend khôi phục an toàn
  các phiên bị vô hiệu hóa từ phần đuôi bản ghi thô OpenClaw có giới hạn trước khi
  bản tóm tắt Compaction đầu tiên tồn tại. Các thay đổi về hồ sơ xác thực hoặc kỷ nguyên thông tin xác thực
  vẫn tuyệt đối không khởi tạo lại từ dữ liệu thô.

### `agents.defaults.promptOverlays`

Các lớp phủ lời nhắc độc lập với nhà cung cấp được áp dụng theo họ mô hình trên những bề mặt lời nhắc do OpenClaw tổng hợp. Các id mô hình thuộc họ GPT-5 nhận hợp đồng hành vi dùng chung trên các tuyến OpenClaw/nhà cung cấp; `personality` chỉ kiểm soát lớp phong cách tương tác thân thiện. Các tuyến máy chủ ứng dụng Codex gốc giữ nguyên chỉ dẫn cơ sở/mô hình do Codex sở hữu thay vì lớp phủ GPT-5 này của OpenClaw, đồng thời OpenClaw tắt tính cách tích hợp sẵn của Codex cho các luồng gốc.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // thân thiện | bật | tắt
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
        every: "30m", // 0m sẽ tắt
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // mặc định: true; false sẽ bỏ phần Heartbeat khỏi lời nhắc hệ thống
        lightContext: false, // mặc định: false; true chỉ giữ HEARTBEAT.md từ các tệp khởi tạo không gian làm việc
        isolatedSession: false, // mặc định: false; true chạy mỗi Heartbeat trong một phiên mới (không có lịch sử hội thoại)
        skipWhenBusy: false, // mặc định: false; true cũng chờ các luồng subagent/lồng nhau của agent này
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (mặc định) | block
        target: "none", // mặc định: none | tùy chọn: last | whatsapp | telegram | discord | ...
        prompt: "Đọc HEARTBEAT.md nếu tệp tồn tại...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: chuỗi thời lượng (ms/s/m/h). Mặc định: `30m` (xác thực bằng khóa API) hoặc `1h` (xác thực OAuth). Đặt thành `0m` để tắt.
- `includeSystemPromptSection`: khi là false, bỏ phần Heartbeat khỏi lời nhắc hệ thống và bỏ qua việc chèn `HEARTBEAT.md` vào ngữ cảnh khởi tạo. Mặc định: `true`.
- `suppressToolErrorWarnings`: khi là true, chặn các tải trọng cảnh báo lỗi công cụ trong các lượt chạy Heartbeat.
- `timeoutSeconds`: thời gian tối đa tính bằng giây được phép cho một lượt agent Heartbeat trước khi bị hủy. Để trống để sử dụng `agents.defaults.timeoutSeconds` khi giá trị này được đặt; nếu không, dùng chu kỳ Heartbeat với giới hạn tối đa 600 giây.
- `directPolicy`: chính sách phân phối trực tiếp/DM. `allow` (mặc định) cho phép phân phối đến đích trực tiếp. `block` chặn phân phối đến đích trực tiếp và phát `reason=dm-blocked`.
- `lightContext`: khi là true, các lượt chạy Heartbeat sử dụng ngữ cảnh khởi tạo gọn nhẹ và chỉ giữ `HEARTBEAT.md` từ các tệp khởi tạo không gian làm việc.
- `isolatedSession`: khi là true, mỗi Heartbeat chạy trong một phiên mới, không có lịch sử hội thoại trước đó. Cùng kiểu cô lập với Cron `sessionTarget: "isolated"`. Giảm chi phí token cho mỗi Heartbeat từ ~100K xuống ~2-5K token.
- `skipWhenBusy`: khi là true, các lượt chạy Heartbeat sẽ trì hoãn khi agent đó có thêm các luồng bận: công việc subagent được định danh theo khóa phiên hoặc công việc lệnh lồng nhau của chính nó. Các luồng Cron luôn trì hoãn Heartbeat, ngay cả khi không có cờ này.
- Theo từng agent: đặt `agents.list[].heartbeat`. Khi bất kỳ agent nào định nghĩa `heartbeat`, **chỉ những agent đó** chạy Heartbeat.
- Heartbeat chạy toàn bộ lượt agent — khoảng thời gian ngắn hơn tiêu tốn nhiều token hơn.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id của một plugin nhà cung cấp Compaction đã đăng ký (tùy chọn)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Giữ nguyên chính xác các ID triển khai, ID phiếu và cặp máy_chủ:cổng.", // được sử dụng khi identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // kiểm tra áp lực vòng lặp công cụ tùy chọn
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // chọn dùng việc chèn lại các phần AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // giá trị ghi đè mô hình chỉ dành cho Compaction, tùy chọn
        truncateAfterCompaction: true, // chuyển sang JSONL kế nhiệm nhỏ hơn sau Compaction
        maxActiveTranscriptBytes: "20mb", // trình kích hoạt Compaction cục bộ trước khi chạy, tùy chọn
        notifyUser: true, // thông báo khi Compaction bắt đầu/hoàn tất và khi việc xả bộ nhớ suy giảm (mặc định: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // giá trị ghi đè mô hình chỉ dành cho việc xả bộ nhớ, tùy chọn
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "Phiên sắp thực hiện Compaction. Hãy lưu các ký ức lâu dài ngay bây giờ.",
          prompt: "Ghi mọi ghi chú cần lưu lâu dài vào memory/YYYY-MM-DD.md; trả lời bằng chính xác token im lặng NO_REPLY nếu không có gì cần lưu.",
        },
      },
    },
  },
}
```

- `mode`: `default` hoặc `safeguard` (tóm tắt theo từng phần cho lịch sử dài). Xem [Compaction](/vi/concepts/compaction).
- `provider`: id của Plugin nhà cung cấp Compaction đã đăng ký. Khi được đặt, `summarize()` của nhà cung cấp được gọi thay cho việc tóm tắt bằng LLM tích hợp sẵn. Quay về cơ chế tích hợp sẵn khi xảy ra lỗi. Việc đặt nhà cung cấp sẽ buộc sử dụng `mode: "safeguard"`. Xem [Compaction](/vi/concepts/compaction).
- `timeoutSeconds`: số giây tối đa được phép cho một thao tác Compaction trước khi OpenClaw hủy thao tác đó. Mặc định: `180`.
- `reserveTokens`: phần dung lượng token dự phòng được giữ lại cho đầu ra của mô hình và các kết quả công cụ trong tương lai sau Compaction. Khi biết cửa sổ ngữ cảnh của mô hình, OpenClaw giới hạn mức dự phòng hiệu dụng để nó không thể chiếm hết ngân sách lời nhắc.
- `reserveTokensFloor`: mức dự phòng tối thiểu do runtime nhúng thực thi. Đặt `0` để tắt mức sàn. Mức sàn vẫn chịu giới hạn của cửa sổ ngữ cảnh đang hoạt động.
- `keepRecentTokens`: ngân sách điểm cắt của agent để giữ nguyên văn phần cuối bản ghi gần đây nhất. `/compact` thủ công tuân theo giá trị này khi được đặt rõ ràng; nếu không, Compaction thủ công là một điểm kiểm tra bắt buộc.
- `recentTurnsPreserve`: số lượt người dùng/trợ lý gần đây nhất được giữ nguyên văn bên ngoài phần tóm tắt bảo vệ. Mặc định: `3`.
- `maxHistoryShare`: tỷ lệ tối đa của tổng ngân sách ngữ cảnh được phép dành cho lịch sử giữ lại sau Compaction (phạm vi `0.1`-`0.9`).
- `identifierPolicy`: `strict` (mặc định), `off` hoặc `custom`. `strict` thêm hướng dẫn tích hợp sẵn về việc giữ lại mã định danh không rõ nghĩa vào đầu nội dung khi tóm tắt Compaction.
- `identifierInstructions`: văn bản tùy chỉnh không bắt buộc để bảo toàn mã định danh, được dùng khi `identifierPolicy=custom`.
- `qualityGuard`: các bước kiểm tra thử lại khi đầu ra không đúng định dạng đối với bản tóm tắt bảo vệ. Được bật theo mặc định ở chế độ bảo vệ; đặt `enabled: false` để bỏ qua việc kiểm tra.
- `midTurnPrecheck`: bước kiểm tra áp lực vòng lặp công cụ không bắt buộc. Khi `enabled: true`, OpenClaw kiểm tra áp lực ngữ cảnh sau khi nối thêm kết quả công cụ và trước lần gọi mô hình tiếp theo. Nếu ngữ cảnh không còn vừa, hệ thống hủy lần thử hiện tại trước khi gửi lời nhắc và tái sử dụng đường dẫn khôi phục kiểm tra trước hiện có để cắt bớt kết quả công cụ hoặc thực hiện Compaction rồi thử lại. Hoạt động với cả chế độ Compaction `default` và `safeguard`. Mặc định: tắt.
- `postIndexSync`: chế độ lập chỉ mục lại bộ nhớ phiên sau Compaction. Mặc định: `"async"`. Dùng `"await"` để có độ mới cao nhất, `"async"` để giảm độ trễ Compaction hoặc chỉ dùng `"off"` khi việc đồng bộ bộ nhớ phiên được xử lý ở nơi khác.
- `postCompactionSections`: tên các phần H2/H3 không bắt buộc trong AGENTS.md để chèn lại sau Compaction. Tính năng chèn lại bị tắt khi không được đặt hoặc được đặt thành `[]`. Việc đặt rõ ràng `["Session Startup", "Red Lines"]` sẽ bật cặp đó và giữ nguyên cơ chế dự phòng `Every Session`/`Safety` cũ. Chỉ bật tính năng này khi ngữ cảnh bổ sung đáng để chấp nhận nguy cơ lặp lại hướng dẫn dự án đã được ghi trong bản tóm tắt Compaction.
- `model`: `provider/model-id` không bắt buộc hoặc bí danh thuần từ `agents.defaults.models`, chỉ dành cho việc tóm tắt Compaction. Bí danh thuần được phân giải trước khi điều phối; id mô hình dạng ký tự được cấu hình sẽ được ưu tiên khi xảy ra xung đột. Dùng tùy chọn này khi phiên chính cần tiếp tục dùng một mô hình nhưng bản tóm tắt Compaction cần chạy trên mô hình khác; khi không được đặt, Compaction sử dụng mô hình chính của phiên.
- `truncateAfterCompaction`: luân chuyển bản ghi phiên đang hoạt động sau Compaction để các lượt trong tương lai chỉ tải bản tóm tắt và phần cuối chưa được tóm tắt, trong khi toàn bộ bản ghi trước đó vẫn được lưu trữ. Ngăn bản ghi đang hoạt động tăng trưởng không giới hạn trong các phiên chạy lâu. Mặc định: `false`.
- `maxActiveTranscriptBytes`: ngưỡng byte không bắt buộc (`number` hoặc chuỗi như `"20mb"`) kích hoạt Compaction cục bộ thông thường trước một lần chạy khi lịch sử bản ghi vượt quá ngưỡng. Yêu cầu `truncateAfterCompaction` để Compaction thành công có thể luân chuyển sang một bản ghi kế tiếp nhỏ hơn. Bị tắt khi không được đặt hoặc là `0`.
- `notifyUser`: khi `true`, gửi thông báo ngắn về việc bảo trì ngữ cảnh cho người dùng: khi Compaction bắt đầu và hoàn tất (ví dụ: "Đang thu gọn ngữ cảnh..." và "Đã hoàn tất Compaction"), cũng như khi quá trình xả bộ nhớ trước Compaction đã hết khả năng thử lại nên phản hồi tiếp tục ở trạng thái suy giảm (ví dụ: "Bảo trì bộ nhớ tạm thời thất bại; đang tiếp tục phản hồi cho bạn."). Mặc định bị tắt để không hiển thị các thông báo này.
- `memoryFlush`: lượt xử lý ngầm của agent trước Compaction tự động để lưu các bộ nhớ lâu dài. Đặt `model` thành nhà cung cấp/mô hình chính xác như `ollama/qwen3:8b` khi lượt bảo trì này cần tiếp tục dùng mô hình cục bộ; giá trị ghi đè không kế thừa chuỗi dự phòng của phiên đang hoạt động. `forceFlushTranscriptBytes` buộc xả khi kích thước bản ghi đạt ngưỡng ngay cả khi bộ đếm token đã cũ. Bị bỏ qua khi không gian làm việc ở chế độ chỉ đọc.

### `agents.defaults.runRetries`

Ranh giới số lần lặp thử lại của vòng lặp chạy bên ngoài dành cho runtime agent nhúng, nhằm ngăn các vòng lặp thực thi vô hạn trong quá trình khôi phục lỗi. Cài đặt này chỉ áp dụng cho runtime agent nhúng, không áp dụng cho runtime ACP hoặc CLI.

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
        runRetries: { max: 50 }, // giá trị ghi đè không bắt buộc cho từng agent
      },
    ],
  },
}
```

- `base`: số lần lặp thử lại cơ sở cho vòng lặp chạy bên ngoài. Mặc định: `24`.
- `perProfile`: số lần lặp thử lại bổ sung được cấp cho mỗi ứng viên hồ sơ dự phòng. Mặc định: `8`.
- `min`: giới hạn tuyệt đối tối thiểu cho số lần lặp thử lại. Mặc định: `32`.
- `max`: giới hạn tuyệt đối tối đa cho số lần lặp thử lại nhằm ngăn thực thi mất kiểm soát. Mặc định: `160`.

### `agents.defaults.contextPruning`

Loại bỏ **kết quả công cụ cũ** khỏi ngữ cảnh trong bộ nhớ trước khi gửi đến LLM. **Không** sửa đổi lịch sử phiên trên đĩa. Mặc định bị tắt; đặt `mode: "cache-ttl"` để bật.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (mặc định) | cache-ttl
        ttl: "1h", // thời lượng (ms/s/m/h), đơn vị mặc định: phút; mặc định: 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Nội dung kết quả công cụ cũ đã được xóa]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Hành vi của chế độ cache-ttl">

- `mode: "cache-ttl"` bật các lượt loại bỏ.
- `ttl` kiểm soát tần suất có thể chạy lại quá trình loại bỏ (sau lần truy cập bộ nhớ đệm gần nhất). Mặc định: `5m`.
- Quá trình loại bỏ trước tiên cắt bớt mềm các kết quả công cụ quá lớn, sau đó xóa cứng các kết quả công cụ cũ hơn nếu cần.
- `softTrimRatio` và `hardClearRatio` chấp nhận các giá trị từ `0.0` đến `1.0`; quá trình xác thực cấu hình từ chối các giá trị ngoài phạm vi đó.

**Cắt bớt mềm** giữ lại phần đầu + phần cuối và chèn `...` vào giữa.

**Xóa cứng** thay thế toàn bộ kết quả công cụ bằng văn bản giữ chỗ.

Lưu ý:

- Các khối hình ảnh không bao giờ bị cắt bớt/xóa.
- Các tỷ lệ dựa trên số ký tự (xấp xỉ), không phải số lượng token chính xác.
- Nếu có ít hơn `keepLastAssistants` thông báo của trợ lý, quá trình loại bỏ sẽ bị bỏ qua.

</Accordion>

Xem [Loại bỏ dữ liệu phiên](/vi/concepts/session-pruning) để biết chi tiết về hành vi.

### Phát trực tuyến theo khối

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (mặc định) | natural | custom (dùng minMs/maxMs)
    },
  },
}
```

- Các kênh không phải Telegram yêu cầu `*.streaming.block.enabled: true` rõ ràng để bật phản hồi theo khối. QQ Bot là ngoại lệ: nó không có các khóa `streaming.block` và phát trực tuyến phản hồi theo khối trừ khi `channels.qqbot.streaming.mode` là `"off"`.
- Giá trị ghi đè theo kênh: `channels.<channel>.streaming.block.coalesce` (và các biến thể theo tài khoản). Discord, Google Chat, Mattermost, MS Teams, Signal và Slack mặc định là `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: ranh giới phân đoạn ưu tiên (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: khoảng tạm dừng ngẫu nhiên giữa các phản hồi theo khối. Mặc định: `off`. `natural` = 800-2500ms. `custom` sử dụng `minMs`/`maxMs` (quay về phạm vi tự nhiên đối với mọi giới hạn chưa được đặt). Giá trị ghi đè theo agent: `agents.list[].humanDelay`.

Xem [Phát trực tuyến](/vi/concepts/streaming) để biết chi tiết về hành vi + phân đoạn.

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

- Mặc định: `instant` cho cuộc trò chuyện trực tiếp/lượt đề cập, `message` cho cuộc trò chuyện nhóm không có lượt đề cập.
- Mặc định của `typingIntervalSeconds`: `6`.
- Giá trị ghi đè theo phiên: `session.typingMode`, `session.typingIntervalSeconds`.

Xem [Chỉ báo đang nhập](/vi/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Cơ chế sandbox không bắt buộc cho agent nhúng. Xem [Cơ chế sandbox](/vi/gateway/sandboxing) để đọc hướng dẫn đầy đủ.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (mặc định) | non-main | all
        backend: "docker", // docker (mặc định) | ssh | openshell
        scope: "agent", // session | agent (mặc định) | shared
        workspaceAccess: "none", // none (mặc định) | ro | rw
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
          gpus: "all",
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
          // Cũng hỗ trợ SecretRefs / nội dung nội tuyến:
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

Các giá trị mặc định hiển thị ở trên (`off`/`docker`/`agent`/`none`/ảnh `bookworm-slim`/mạng `none`/v.v.) là các giá trị mặc định thực tế của OpenClaw, không chỉ là giá trị minh họa.

<Accordion title="Chi tiết sandbox">

**Backend:**

- `docker`: môi trường chạy Docker cục bộ (mặc định)
- `ssh`: môi trường chạy từ xa chung dựa trên SSH
- `openshell`: môi trường chạy OpenShell

Khi chọn `backend: "openshell"`, các cài đặt dành riêng cho môi trường chạy sẽ chuyển sang
`plugins.entries.openshell.config`.

**Cấu hình backend SSH:**

- `target`: đích SSH ở dạng `user@host[:port]`
- `command`: lệnh máy khách SSH (mặc định: `ssh`)
- `workspaceRoot`: thư mục gốc tuyệt đối từ xa dùng cho không gian làm việc theo từng phạm vi (mặc định: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: các tệp cục bộ hiện có được truyền cho OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: nội dung nội tuyến hoặc SecretRefs mà OpenClaw hiện thực hóa thành các tệp tạm trong lúc chạy
- `strictHostKeyChecking` / `updateHostKeys`: các tùy chọn chính sách khóa máy chủ của OpenSSH (cả hai mặc định là `true`)

**Thứ tự ưu tiên xác thực SSH:**

- `identityData` được ưu tiên hơn `identityFile`
- `certificateData` được ưu tiên hơn `certificateFile`
- `knownHostsData` được ưu tiên hơn `knownHostsFile`
- Các giá trị `*Data` dựa trên SecretRef được phân giải từ ảnh chụp nhanh môi trường chạy bí mật đang hoạt động trước khi phiên sandbox bắt đầu

**Hành vi của backend SSH:**

- khởi tạo không gian làm việc từ xa một lần sau khi tạo hoặc tạo lại
- sau đó giữ không gian làm việc SSH từ xa làm bản chuẩn
- định tuyến `exec`, các công cụ tệp và đường dẫn phương tiện qua SSH
- không tự động đồng bộ các thay đổi từ xa trở lại máy chủ
- không hỗ trợ các container trình duyệt sandbox

**Quyền truy cập không gian làm việc:**

- `none`: không gian làm việc sandbox theo từng phạm vi trong `~/.openclaw/sandboxes` (mặc định)
- `ro`: không gian làm việc sandbox tại `/workspace`, không gian làm việc của tác nhân được gắn chỉ đọc tại `/agent`
- `rw`: không gian làm việc của tác nhân được gắn đọc/ghi tại `/workspace`

**Phạm vi:**

- `session`: container + không gian làm việc cho mỗi phiên
- `agent`: một container + không gian làm việc cho mỗi tác nhân (mặc định)
- `shared`: container và không gian làm việc dùng chung (không cách ly giữa các phiên)

**Cấu hình Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (mặc định) | remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // tùy chọn
          gatewayEndpoint: "https://lab.example", // tùy chọn
          policy: "strict", // mã định danh chính sách OpenShell tùy chọn
          providers: ["openai"], // tùy chọn
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Chế độ OpenShell:**

- `mirror`: khởi tạo máy từ xa từ máy cục bộ trước khi thực thi, đồng bộ trở lại sau khi thực thi; không gian làm việc cục bộ vẫn là bản chuẩn
- `remote`: khởi tạo máy từ xa một lần khi sandbox được tạo, sau đó giữ không gian làm việc từ xa làm bản chuẩn

Ở chế độ `remote`, các chỉnh sửa cục bộ trên máy chủ được thực hiện bên ngoài OpenClaw sẽ không tự động được đồng bộ vào sandbox sau bước khởi tạo.
Việc truyền tải sử dụng SSH vào sandbox OpenShell, nhưng Plugin sở hữu vòng đời sandbox và tính năng đồng bộ bản sao tùy chọn.

**`setupCommand`** chạy một lần sau khi tạo container (thông qua `sh -lc`). Yêu cầu truy cập mạng ra ngoài, thư mục gốc có thể ghi và người dùng root.

**Container mặc định dùng `network: "none"`** — đặt thành `"bridge"` (hoặc một mạng cầu nối tùy chỉnh) nếu tác nhân cần truy cập ra ngoài.
`"host"` bị chặn. `"container:<id>"` bị chặn theo mặc định, trừ khi bạn đặt rõ ràng
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (phá kính trong tình huống khẩn cấp).
Các lượt của máy chủ ứng dụng Codex trong một sandbox OpenClaw đang hoạt động sử dụng cùng cài đặt truy cập ra ngoài này cho quyền truy cập mạng ở chế độ mã gốc của chúng.

**Tệp đính kèm đến** được đưa tạm vào `media/inbound/*` trong không gian làm việc đang hoạt động.

**`docker.binds`** gắn thêm các thư mục máy chủ; các liên kết toàn cục và theo từng tác nhân được hợp nhất.

**Trình duyệt sandbox** (`sandbox.browser.enabled`, mặc định `false`): Chromium + CDP trong một container. URL noVNC được chèn vào lời nhắc hệ thống. Không yêu cầu `browser.enabled` trong `openclaw.json`.
Quyền truy cập quan sát noVNC mặc định sử dụng xác thực VNC và OpenClaw phát hành một URL mã thông báo tồn tại trong thời gian ngắn (thay vì để lộ mật khẩu trong URL dùng chung).

- `allowHostControl: false` (mặc định) ngăn các phiên sandbox nhắm đến trình duyệt trên máy chủ.
- `network` mặc định là `openclaw-sandbox-browser` (mạng cầu nối chuyên dụng). Chỉ đặt thành `bridge` khi bạn chủ ý muốn kết nối cầu nối toàn cục. `"host"` cũng bị chặn tại đây.
- `cdpSourceRange` có thể giới hạn lưu lượng CDP đi vào tại biên container trong một dải CIDR (ví dụ `172.21.0.1/32`).
- `sandbox.browser.binds` chỉ gắn thêm các thư mục máy chủ vào container trình duyệt sandbox. Khi được đặt (bao gồm `[]`), giá trị này thay thế `docker.binds` cho container trình duyệt.
- Chromium của container trình duyệt sandbox luôn khởi chạy với `--no-sandbox --disable-setuid-sandbox` (container không có các thành phần nguyên thủy của nhân hệ điều hành mà sandbox riêng của Chrome cần); không có tùy chọn cấu hình để thay đổi điều này.
- Các giá trị mặc định khi khởi chạy được định nghĩa trong `scripts/sandbox-browser-entrypoint.sh` và được tinh chỉnh cho máy chủ container:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu` và `--disable-software-rasterizer`
    được bật theo mặc định và có thể bị tắt bằng
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu việc sử dụng WebGL/3D yêu cầu.
  - `--disable-extensions` (được bật theo mặc định); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    bật lại các tiện ích mở rộng nếu quy trình làm việc của bạn phụ thuộc vào chúng.
  - `--renderer-process-limit=2` theo mặc định; thay đổi bằng
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, đặt `0` để sử dụng
    giới hạn tiến trình mặc định của Chromium.
  - `--headless=new` chỉ khi `headless` được bật.
  - Các giá trị mặc định là đường cơ sở của ảnh container; hãy sử dụng ảnh trình duyệt tùy chỉnh với
    điểm vào tùy chỉnh để thay đổi các giá trị mặc định của container.

</Accordion>

Sandbox trình duyệt và `sandbox.docker.binds` chỉ dành cho Docker.

Tạo ảnh (từ bản sao mã nguồn đã checkout):

```bash
scripts/sandbox-setup.sh           # ảnh sandbox chính
scripts/sandbox-browser-setup.sh   # ảnh trình duyệt tùy chọn
```

Đối với cài đặt npm không có bản sao mã nguồn đã checkout, hãy xem [Sandboxing § Ảnh và thiết lập](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` nội tuyến.

### `agents.list` (ghi đè theo từng tác nhân)

Sử dụng `agents.list[].tts` để cung cấp cho một tác nhân nhà cung cấp TTS, giọng nói, mô hình,
phong cách hoặc chế độ TTS tự động riêng. Khối tác nhân được hợp nhất sâu lên trên
`messages.tts` toàn cục, vì vậy thông tin xác thực dùng chung có thể được giữ ở một nơi trong khi từng
tác nhân chỉ ghi đè các trường giọng nói hoặc nhà cung cấp mà chúng cần. Phần ghi đè của tác nhân đang hoạt động
áp dụng cho các phản hồi nói tự động, `/tts audio`, `/tts status` và
công cụ tác nhân `tts`. Xem [Chuyển văn bản thành giọng nói](/vi/tools/tts#per-agent-voice-overrides)
để biết ví dụ về nhà cung cấp và thứ tự ưu tiên.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Tác nhân chính",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // hoặc { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // ghi đè mức suy nghĩ theo từng tác nhân
        reasoningDefault: "on", // ghi đè khả năng hiển thị suy luận theo từng tác nhân
        fastModeDefault: false, // ghi đè chế độ nhanh theo từng tác nhân
        params: { cacheRetention: "none" }, // ghi đè các tham số defaults.models tương ứng theo khóa
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // thay thế agents.defaults.skills khi được đặt
        identity: {
          name: "Samantha",
          theme: "chú lười hữu ích",
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
            mode: "persistent", // persistent | oneshot
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
- `default`: khi đặt nhiều mục, mục đầu tiên được ưu tiên (có ghi cảnh báo vào nhật ký). Nếu không đặt mục nào, phần tử đầu tiên trong danh sách là mặc định.
- `model`: dạng chuỗi đặt mô hình chính nghiêm ngặt cho từng tác nhân mà không có mô hình dự phòng; dạng đối tượng `{ primary }` cũng nghiêm ngặt trừ khi thêm `fallbacks`. Dùng `{ primary, fallbacks: [...] }` để cho phép tác nhân đó sử dụng mô hình dự phòng, hoặc `{ primary, fallbacks: [] }` để chỉ định rõ hành vi nghiêm ngặt. Các tác vụ Cron chỉ ghi đè `primary` vẫn kế thừa các mô hình dự phòng mặc định, trừ khi đặt `fallbacks: []`.
- `utilityModel`: ghi đè tùy chọn theo từng tác nhân dành cho các tác vụ nội bộ ngắn, chẳng hạn như tiêu đề phiên và luồng được tạo. Dự phòng lần lượt về `agents.defaults.utilityModel`, mô hình nhỏ mặc định do nhà cung cấp chính khai báo, rồi mô hình chính của tác nhân này. Chuỗi rỗng sẽ vô hiệu hóa định tuyến tiện ích cho tác nhân này.
- `params`: các tham số luồng theo từng tác nhân được hợp nhất lên mục mô hình đã chọn trong `agents.defaults.models`. Dùng mục này cho các ghi đè dành riêng cho tác nhân như `cacheRetention`, `temperature` hoặc `maxTokens` mà không cần sao chép toàn bộ danh mục mô hình.
- `tts`: các ghi đè chuyển văn bản thành giọng nói tùy chọn theo từng tác nhân. Khối này được hợp nhất sâu lên `messages.tts`, vì vậy hãy giữ thông tin xác thực dùng chung của nhà cung cấp và chính sách dự phòng trong `messages.tts`, đồng thời chỉ đặt tại đây các giá trị dành riêng cho nhân dạng như nhà cung cấp, giọng nói, mô hình, phong cách hoặc chế độ tự động.
- `skills`: danh sách cho phép Skills tùy chọn theo từng tác nhân. Nếu bỏ qua, tác nhân sẽ kế thừa `agents.defaults.skills` khi mục này được đặt; danh sách được chỉ định rõ sẽ thay thế các giá trị mặc định thay vì hợp nhất, và `[]` có nghĩa là không có Skills.
- `thinkingDefault`: mức suy nghĩ mặc định tùy chọn theo từng tác nhân (`off | minimal | low | medium | high | xhigh | adaptive | max`). Ghi đè `agents.defaults.thinkingDefault` cho tác nhân này khi không có ghi đè theo tin nhắn hoặc phiên. Hồ sơ nhà cung cấp/mô hình đã chọn kiểm soát những giá trị hợp lệ; đối với Google Gemini, `adaptive` duy trì cơ chế suy nghĩ động do nhà cung cấp quản lý (`thinkingLevel` bị bỏ qua trên Gemini 3/3.1, `thinkingBudget: -1` trên Gemini 2.5).
- `reasoningDefault`: khả năng hiển thị suy luận mặc định tùy chọn theo từng tác nhân (`on | off | stream`). Ghi đè `agents.defaults.reasoningDefault` cho tác nhân này khi không có ghi đè suy luận theo tin nhắn hoặc phiên.
- `fastModeDefault`: giá trị mặc định tùy chọn theo từng tác nhân cho chế độ nhanh (`"auto" | true | false`). Áp dụng khi không có ghi đè chế độ nhanh theo tin nhắn hoặc phiên.
- `models`: các ghi đè danh mục mô hình/runtime tùy chọn theo từng tác nhân, được định danh bằng các mã `provider/model` đầy đủ. Dùng `models["provider/model"].agentRuntime` cho các ngoại lệ runtime theo từng tác nhân.
- `runtime`: bộ mô tả runtime tùy chọn theo từng tác nhân. Dùng `type: "acp"` với các giá trị mặc định `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) khi tác nhân nên mặc định sử dụng các phiên bộ khung ACP.
- `identity.avatar`: đường dẫn tương đối với không gian làm việc, URL `http(s)` hoặc URI `data:`.
- Các tệp hình ảnh `identity.avatar` cục bộ có đường dẫn tương đối với không gian làm việc bị giới hạn ở 2 MB. URL `http(s)` và URI `data:` không được kiểm tra theo giới hạn kích thước tệp cục bộ.
- `identity` suy ra các giá trị mặc định: `ackReaction` từ `emoji`, `mentionPatterns` từ `name`/`emoji`.
- `subagents.allowAgents`: danh sách cho phép gồm các mã định danh tác nhân đã cấu hình cho các đích `sessions_spawn.agentId` được chỉ định rõ (`["*"]` = mọi đích đã cấu hình; mặc định: chỉ cùng tác nhân). Bao gồm mã định danh của bên yêu cầu khi cần cho phép các lệnh gọi `agentId` tự nhắm đến chính mình. Các mục cũ có cấu hình tác nhân đã bị xóa sẽ bị `sessions_spawn` từ chối và bị loại khỏi `agents_list`; chạy `openclaw doctor --fix` để dọn dẹp chúng, hoặc thêm một mục `agents.list[]` tối thiểu nếu đích đó vẫn cần có thể được tạo trong khi kế thừa các giá trị mặc định.
- Cơ chế bảo vệ kế thừa sandbox: nếu phiên của bên yêu cầu chạy trong sandbox, `sessions_spawn` sẽ từ chối các đích chạy ngoài sandbox.
- `subagents.requireAgentId`: khi là true, chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ rõ ràng; mặc định: false).
- `subagents.maxConcurrent`: số lượt chạy tác nhân con đồng thời tối đa trong quá trình thực thi tác nhân phụ. Mặc định: `8`.
- `subagents.maxChildrenPerAgent`: số tác nhân con đang hoạt động tối đa mà một phiên tác nhân có thể tạo. Mặc định: `5`.
- `subagents.maxSpawnDepth`: độ sâu lồng tối đa khi tạo tác nhân phụ (`1`-`5`). Mặc định: `1` (không lồng).
- `subagents.archiveAfterMinutes`: khoảng thời gian trước khi trạng thái tác nhân phụ đã hoàn tất được lưu trữ. Mặc định: `60`.

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

### Các trường khớp liên kết

- `type` (tùy chọn): `route` cho định tuyến thông thường (thiếu loại thì mặc định là route), `acp` cho các liên kết hội thoại ACP liên tục.
- `match.channel` (bắt buộc)
- `match.accountId` (tùy chọn; `*` = mọi tài khoản; bỏ qua = tài khoản mặc định)
- `match.peer` (tùy chọn; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (tùy chọn; dành riêng cho kênh)
- `acp` (tùy chọn; chỉ dành cho `type: "acp"`): `{ mode, label, cwd, backend }`

**Thứ tự khớp xác định:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (chính xác, không có peer/guild/team)
5. `match.accountId: "*"` (trên toàn kênh)
6. Tác nhân mặc định

Trong mỗi cấp, mục `bindings` khớp đầu tiên được ưu tiên.

Đối với các mục `type: "acp"`, OpenClaw phân giải theo danh tính hội thoại chính xác (`match.channel` + tài khoản + `match.peer.id`) và không sử dụng thứ tự cấp liên kết định tuyến ở trên.

### Hồ sơ truy cập theo từng tác nhân

<Accordion title="Toàn quyền truy cập (không có sandbox)">

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

<Accordion title="Công cụ chỉ đọc + không gian làm việc">

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

<Accordion title="Không truy cập hệ thống tệp (chỉ nhắn tin)">

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

Xem [Sandbox và công cụ đa tác nhân](/vi/tools/multi-agent-sandbox-tools) để biết chi tiết về thứ tự ưu tiên.

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (mặc định) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // khoảng thời gian hoặc false
      maxDiskBytes: "500mb", // hạn mức cứng tùy chọn
      highWaterBytes: "400mb", // mục tiêu dọn dẹp tùy chọn
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // tự động bỏ tập trung sau thời gian không hoạt động mặc định, tính bằng giờ (`0` để vô hiệu hóa)
      maxAgeHours: 0, // tuổi tối đa bắt buộc mặc định, tính bằng giờ (`0` để vô hiệu hóa)
    },
    mainKey: "main", // cũ (runtime luôn dùng "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Chi tiết các trường phiên">

- **`scope`**: chiến lược nhóm phiên cơ sở cho ngữ cảnh trò chuyện nhóm.
  - `per-sender` (mặc định): mỗi người gửi có một phiên riêng biệt trong ngữ cảnh kênh.
  - `global`: tất cả người tham gia trong ngữ cảnh kênh dùng chung một phiên (chỉ sử dụng khi chủ đích là dùng chung ngữ cảnh).
- **`dmScope`**: cách nhóm tin nhắn trực tiếp.
  - `main`: tất cả tin nhắn trực tiếp dùng chung phiên chính.
  - `per-peer`: tách biệt theo mã định danh người gửi trên các kênh.
  - `per-channel-peer`: tách biệt theo từng kênh + người gửi (khuyến nghị cho hộp thư đến nhiều người dùng).
  - `per-account-channel-peer`: tách biệt theo từng tài khoản + kênh + người gửi (khuyến nghị khi dùng nhiều tài khoản).
- **`identityLinks`**: ánh xạ các mã định danh chuẩn sang các đối tác có tiền tố nhà cung cấp để chia sẻ phiên giữa các kênh. Các lệnh neo kênh như `/dock_discord` sử dụng cùng ánh xạ để chuyển tuyến trả lời của phiên đang hoạt động sang một đối tác kênh khác đã liên kết; xem [Neo kênh](/vi/concepts/channel-docking).
- **`reset`**: chính sách đặt lại chính. `daily` đặt lại lúc `atHour` theo giờ địa phương; `idle` đặt lại sau `idleMinutes`. Khi cấu hình cả hai, điều kiện hết hạn trước sẽ được áp dụng. Độ mới cho việc đặt lại hằng ngày sử dụng `sessionStartedAt` của hàng phiên; độ mới cho việc đặt lại khi không hoạt động sử dụng `lastInteractionAt`. Các lượt ghi sự kiện nền/hệ thống như Heartbeat, đánh thức Cron, thông báo thực thi và hoạt động ghi sổ của Gateway có thể cập nhật `updatedAt`, nhưng chúng không duy trì độ mới của phiên hằng ngày/không hoạt động.
- **`resetByType`**: ghi đè theo từng loại (`direct`, `group`, `thread`). `dm` cũ được chấp nhận làm bí danh cho `direct`.
- **`resetByChannel`**: ghi đè việc đặt lại theo từng kênh, với khóa là mã định danh nhà cung cấp/kênh. Khi kênh của phiên có mục khớp, mục đó sẽ hoàn toàn được ưu tiên hơn `resetByType`/`reset` cho phiên ấy. Chỉ sử dụng khi một kênh cần hành vi đặt lại khác với chính sách cấp loại.
- **`mainKey`**: trường cũ. Runtime luôn sử dụng `"main"` cho nhóm trò chuyện trực tiếp chính.
- **`agentToAgent.maxPingPongTurns`**: số lượt trả lời qua lại tối đa giữa các agent trong quá trình trao đổi giữa các agent (số nguyên, phạm vi: `0`-`20`, mặc định: `5`). `0` vô hiệu hóa chuỗi trao đổi qua lại.
- **`sendPolicy`**: khớp theo `channel`, `chatType` (`direct|group|channel`, với bí danh cũ `dm`), `keyPrefix` hoặc `rawKeyPrefix`. Quy tắc từ chối đầu tiên được ưu tiên.
- **`maintenance`**: các tùy chọn kiểm soát dọn dẹp + lưu giữ kho phiên.
  - `mode`: `enforce` áp dụng việc dọn dẹp và là giá trị mặc định; `warn` chỉ phát cảnh báo.
  - `pruneAfter`: ngưỡng tuổi cho các mục cũ (mặc định `30d`).
  - `maxEntries`: số lượng mục phiên SQLite tối đa (mặc định `500`). Các lượt ghi của runtime thực hiện dọn dẹp theo lô với một vùng đệm ngưỡng cao nhỏ dành cho các giới hạn ở quy mô sản xuất; `openclaw sessions cleanup --enforce` áp dụng giới hạn ngay lập tức.
  - Các phiên thăm dò lượt chạy mô hình Gateway tồn tại trong thời gian ngắn sử dụng thời hạn lưu giữ cố định `24h`, nhưng việc dọn dẹp phụ thuộc vào áp lực: nó chỉ xóa các hàng thăm dò lượt chạy mô hình nghiêm ngặt đã cũ khi đạt đến áp lực bảo trì/giới hạn mục phiên. Chỉ các khóa thăm dò rõ ràng, nghiêm ngặt khớp với `agent:*:explicit:model-run-<uuid>` mới đủ điều kiện; các phiên trực tiếp, nhóm, luồng, Cron, hook, Heartbeat, ACP và agent phụ thông thường không kế thừa thời hạn lưu giữ 24 giờ này. Khi việc dọn dẹp lượt chạy mô hình diễn ra, nó được thực hiện trước việc dọn dẹp mục cũ `pruneAfter` rộng hơn và giới hạn `maxEntries`.
  - `rotateBytes` cũ bị lược đồ hiện tại từ chối; `openclaw doctor --fix` xóa trường này khỏi các cấu hình cũ hơn.
  - `resetArchiveRetention`: lưu giữ dựa trên tuổi đối với các kho lưu trữ bản chép lời đã đặt lại/xóa. Theo mặc định, các kho lưu trữ được giữ lại cho đến khi bị loại bỏ do ngân sách ổ đĩa; đặt một khoảng thời gian để chọn xóa theo thời gian thực hoặc đặt `false` để vô hiệu hóa rõ ràng.
  - `maxDiskBytes`: ngân sách ổ đĩa tùy chọn cho thư mục phiên. Trong chế độ `warn`, hệ thống ghi cảnh báo vào nhật ký; trong chế độ `enforce`, hệ thống xóa các thành phần tạo tác/phiên cũ nhất trước.
  - `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp ngân sách. Mặc định là `80%` của `maxDiskBytes`.
- **`writeLock`**: tùy chọn kiểm soát khóa ghi bản chép lời phiên. Chỉ điều chỉnh khi công việc chuẩn bị bản chép lời, dọn dẹp, Compaction hoặc sao chiếu hợp lệ tranh chấp lâu hơn các chính sách mặc định.
  - `acquireTimeoutMs`: số mili giây chờ trong khi giành khóa trước khi báo cáo phiên đang bận. Mặc định: `60000`; ghi đè bằng biến môi trường `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: số mili giây trước khi một khóa hiện có được coi là cũ và được thu hồi. Mặc định: `1800000`; ghi đè bằng biến môi trường `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: số mili giây mà một khóa đang được giữ trong tiến trình có thể tiếp tục được giữ trước khi bộ giám sát giải phóng khóa đó. Mặc định: `300000`; ghi đè bằng biến môi trường `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: giá trị mặc định toàn cục cho các tính năng phiên gắn với luồng.
  - `enabled`: công tắc mặc định chính (các nhà cung cấp có thể ghi đè; Discord sử dụng `channels.discord.threadBindings.enabled`)
  - `idleHours`: thời gian mặc định tính bằng giờ để tự động bỏ lấy nét sau khi không hoạt động (`0` vô hiệu hóa; các nhà cung cấp có thể ghi đè)
  - `maxAgeHours`: tuổi tối đa cứng mặc định tính bằng giờ (`0` vô hiệu hóa; các nhà cung cấp có thể ghi đè)
  - `spawnSessions`: cổng mặc định để tạo phiên công việc gắn với luồng từ `sessions_spawn` và các lượt tạo luồng ACP. Mặc định là `true` khi liên kết luồng được bật; các nhà cung cấp/tài khoản có thể ghi đè.
  - `defaultSpawnContext`: ngữ cảnh agent phụ gốc mặc định cho các lượt tạo gắn với luồng (`"fork"` hoặc `"isolated"`). Mặc định là `"fork"`.

</Accordion>

---

## Tin nhắn

```json5
{
  messages: {
    responsePrefix: "🦞", // hoặc "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (mặc định) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (mặc định)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 sẽ vô hiệu hóa
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

Thứ tự phân giải (giá trị cụ thể nhất được ưu tiên): tài khoản → kênh → toàn cục. `""` vô hiệu hóa và dừng chuỗi phân giải. `"auto"` suy ra `[{identity.name}]`.

**Biến mẫu:**

| Biến          | Mô tả            | Ví dụ                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Tên mô hình ngắn       | `claude-opus-4-6`           |
| `{modelFull}`     | Mã định danh đầy đủ của mô hình  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Tên nhà cung cấp          | `anthropic`                 |
| `{thinkingLevel}` | Mức suy luận hiện tại | `high`, `low`, `off`        |
| `{identity.name}` | Tên danh tính agent    | (giống `"auto"`)          |

Các biến không phân biệt chữ hoa chữ thường. `{think}` là bí danh của `{thinkingLevel}`.

### Phản ứng xác nhận

- Mặc định là `identity.emoji` của agent đang hoạt động, nếu không thì là `"👀"`. Đặt `""` để vô hiệu hóa.
- Ghi đè theo từng kênh: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Thứ tự phân giải: tài khoản → kênh → `messages.ackReaction` → giá trị dự phòng của danh tính.
- Phạm vi: `group-mentions` (mặc định), `group-all`, `direct`, `all` hoặc `off`/`none` (vô hiệu hóa hoàn toàn phản ứng xác nhận).
- `removeAckAfterReply`: xóa phản ứng xác nhận sau khi trả lời trên các kênh hỗ trợ phản ứng như Slack, Discord, Signal, Telegram, WhatsApp và iMessage.
- `messages.statusReactions.enabled`: bật phản ứng trạng thái vòng đời trên Slack, Discord, Signal, Telegram và WhatsApp.
  Trên Discord, khi không đặt giá trị, phản ứng trạng thái vẫn được bật nếu phản ứng xác nhận đang hoạt động.
  Trên Slack, Signal, Telegram và WhatsApp, hãy đặt rõ ràng thành `true` để bật phản ứng trạng thái vòng đời.
  Theo mặc định, Slack sử dụng trạng thái luồng trợ lý gốc và luân phiên các thông báo đang tải để hiển thị tiến trình, đồng thời giữ nguyên phản ứng xác nhận đã cấu hình.
- `messages.statusReactions.emojis`: ghi đè các khóa emoji vòng đời:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` và `stallHard`.
  Telegram chỉ cho phép một tập hợp phản ứng cố định, vì vậy emoji đã cấu hình nhưng không được hỗ trợ sẽ chuyển về
  biến thể trạng thái được hỗ trợ gần nhất cho cuộc trò chuyện đó.

### Hàng đợi

- `mode`: chiến lược hàng đợi cho các tin nhắn đến trong khi một lượt chạy phiên đang hoạt động. Mặc định: `"steer"`.
  - `steer`: đưa lời nhắc mới vào lượt chạy đang hoạt động.
  - `followup`: chạy lời nhắc mới sau khi lượt chạy đang hoạt động kết thúc.
  - `collect`: gộp các tin nhắn tương thích và chạy chúng cùng nhau sau.
  - `interrupt`: hủy lượt chạy đang hoạt động trước khi bắt đầu lời nhắc mới nhất.
- `debounceMs`: độ trễ trước khi gửi một tin nhắn đã xếp hàng/điều hướng. Mặc định: `500`.
- `cap`: số tin nhắn tối đa trong hàng đợi trước khi chính sách loại bỏ được áp dụng. Mặc định: `20`.
- `drop`: chiến lược khi vượt quá giới hạn. `"summarize"` (mặc định) loại bỏ các mục cũ nhất nhưng giữ lại bản tóm tắt ngắn gọn; `"old"` loại bỏ các mục cũ nhất mà không có bản tóm tắt; `"new"` từ chối mục mới nhất.
- `byChannel`: ghi đè `mode` theo từng kênh, với khóa là mã định danh nhà cung cấp.
- `debounceMsByChannel`: ghi đè `debounceMs` theo từng kênh, với khóa là mã định danh nhà cung cấp.

### Chống dội tin nhắn đến

Gộp các tin nhắn nhanh chỉ có văn bản từ cùng một người gửi vào một lượt agent duy nhất. Phương tiện/tệp đính kèm sẽ kích hoạt ngay lập tức. Các lệnh điều khiển bỏ qua cơ chế chống dội. `debounceMs` mặc định: `2000`.

### Các khóa tin nhắn khác

- `messages.messagePrefix`: văn bản tiền tố được thêm vào trước tin nhắn người dùng đến trước khi chúng tới runtime của agent. Chỉ nên dùng hạn chế cho các dấu mốc ngữ cảnh kênh.
- `messages.visibleReplies`: kiểm soát các phản hồi nguồn hiển thị trong cuộc trò chuyện trực tiếp, nhóm và kênh (`"message_tool"` yêu cầu `message(action=send)` để có đầu ra hiển thị; `"automatic"` đăng các phản hồi thông thường như trước).
- `messages.usageTemplate` / `messages.responseUsage`: mẫu chân trang `/usage` tùy chỉnh và chế độ sử dụng mặc định cho mỗi phản hồi (`off | tokens | full`, cùng bí danh cũ `on` cho `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: các trình kích hoạt đề cập trong tin nhắn nhóm và kích thước cửa sổ lịch sử.
- `messages.suppressToolErrors`: khi là `true`, ẩn các cảnh báo lỗi công cụ `⚠️` hiển thị cho người dùng (agent vẫn thấy lỗi trong ngữ cảnh và có thể thử lại). Mặc định: `false`.

### TTS (chuyển văn bản thành giọng nói)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (mặc định) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` kiểm soát chế độ TTS tự động mặc định: `off`, `always`, `inbound` hoặc `tagged`. `/tts on|off` có thể ghi đè tùy chọn cục bộ và `/tts status` hiển thị trạng thái có hiệu lực.
- `summaryModel` ghi đè `agents.defaults.model.primary` cho tính năng tự động tóm tắt.
- `modelOverrides` được bật theo mặc định (`enabled !== false`); `modelOverrides.allowProvider` yêu cầu chủ động bật.
- Khóa API dự phòng sang `ELEVENLABS_API_KEY`/`XI_API_KEY` và `OPENAI_API_KEY`.
- Các nhà cung cấp giọng nói đi kèm thuộc quyền sở hữu của plugin. Nếu `plugins.allow` được đặt, hãy bao gồm từng plugin nhà cung cấp TTS mà bạn muốn sử dụng, ví dụ `microsoft` cho Edge TTS. ID nhà cung cấp cũ `edge` được chấp nhận làm bí danh cho `microsoft`.
- `providers.openai.baseUrl` ghi đè điểm cuối TTS của OpenAI. Thứ tự phân giải là cấu hình, sau đó `OPENAI_TTS_BASE_URL`, rồi `https://api.openai.com/v1`.
- Khi `providers.openai.baseUrl` trỏ đến một điểm cuối không phải OpenAI, OpenClaw coi đó là máy chủ TTS tương thích với OpenAI và nới lỏng việc xác thực mô hình/giọng nói.

---

## Trò chuyện

Các giá trị mặc định cho chế độ Trò chuyện (macOS/iOS/Android và Control UI trên trình duyệt).

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Nói với giọng điệu ấm áp và giữ câu trả lời ngắn gọn.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` phải khớp với một khóa trong `talk.providers` khi nhiều nhà cung cấp Trò chuyện được cấu hình.
- Các khóa Trò chuyện phẳng cũ (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) chỉ dành cho khả năng tương thích. Chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu thành `talk.providers.<provider>`.
- ID giọng nói dự phòng sang `ELEVENLABS_VOICE_ID` hoặc `SAG_VOICE_ID` (hành vi của ứng dụng Trò chuyện trên macOS).
- `providers.*.apiKey` chấp nhận chuỗi văn bản thuần hoặc đối tượng SecretRef.
- Cơ chế dự phòng `ELEVENLABS_API_KEY` chỉ áp dụng khi không có khóa API Trò chuyện nào được cấu hình.
- `providers.*.voiceAliases` cho phép các chỉ thị Trò chuyện sử dụng tên thân thiện.
- `providers.mlx.modelId` chọn kho lưu trữ Hugging Face được trình trợ giúp MLX cục bộ trên macOS sử dụng. Nếu bỏ qua, macOS sử dụng `mlx-community/Soprano-80M-bf16`.
- Việc phát MLX trên macOS chạy qua trình trợ giúp `openclaw-mlx-tts` đi kèm khi có, hoặc một tệp thực thi trên `PATH`; `OPENCLAW_MLX_TTS_BIN` ghi đè đường dẫn trình trợ giúp cho mục đích phát triển.
- `consultThinkingLevel` kiểm soát mức độ suy nghĩ cho toàn bộ lượt chạy tác nhân OpenClaw phía sau các lệnh gọi `openclaw_agent_consult` thời gian thực của Trò chuyện trong Control UI. Để trống nhằm giữ nguyên hành vi phiên/mô hình thông thường.
- `consultFastMode` đặt một giá trị ghi đè chế độ nhanh dùng một lần cho các lượt tham vấn thời gian thực của Trò chuyện trong Control UI mà không thay đổi cài đặt chế độ nhanh thông thường của phiên.
- `speechLocale` đặt ID miền địa phương BCP 47 được tính năng nhận dạng giọng nói Trò chuyện trên iOS/macOS sử dụng. Để trống để dùng giá trị mặc định của thiết bị.
- `silenceTimeoutMs` kiểm soát khoảng thời gian chế độ Trò chuyện chờ sau khi người dùng im lặng trước khi gửi bản chép lời. Để trống sẽ giữ nguyên khoảng tạm dừng mặc định của nền tảng (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` nối thêm các chỉ dẫn hệ thống dành cho nhà cung cấp vào lời nhắc thời gian thực tích hợp sẵn của OpenClaw, nhờ đó có thể cấu hình phong cách giọng nói mà không làm mất hướng dẫn `openclaw_agent_consult` mặc định.
- `realtime.vadThreshold` đặt ngưỡng hoạt động giọng nói của nhà cung cấp từ `0` (nhạy nhất) đến `1` (ít nhạy nhất). Để trống sẽ giữ nguyên giá trị mặc định của nhà cung cấp.
- `realtime.silenceDurationMs` đặt khoảng im lặng là số nguyên dương trước khi nhà cung cấp xác nhận một lượt người dùng thời gian thực. Để trống sẽ giữ nguyên giá trị mặc định của nhà cung cấp.
- `realtime.prefixPaddingMs` đặt lượng âm thanh là số nguyên không âm được giữ lại trước khi giọng nói được phát hiện bắt đầu. Để trống sẽ giữ nguyên giá trị mặc định của nhà cung cấp.
- `realtime.reasoningEffort` đặt mức suy luận dành riêng cho nhà cung cấp đối với các phiên thời gian thực. Để trống sẽ giữ nguyên giá trị mặc định của nhà cung cấp.
- `realtime.consultRouting`: `"provider-direct"` (mặc định) giữ nguyên phản hồi trực tiếp của nhà cung cấp khi nhà cung cấp thời gian thực tạo ra bản chép lời cuối cùng của người dùng mà không có `openclaw_agent_consult`. Thay vào đó, `"force-agent-consult"` định tuyến yêu cầu đã hoàn tất qua OpenClaw.

---

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — tất cả các khóa cấu hình khác
- [Cấu hình](/vi/gateway/configuration) — các tác vụ phổ biến và thiết lập nhanh
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
