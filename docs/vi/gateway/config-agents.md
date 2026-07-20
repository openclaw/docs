---
read_when:
    - Tinh chỉnh các giá trị mặc định của tác tử (mô hình, tư duy, không gian làm việc, Heartbeat, phương tiện, Skills)
    - Cấu hình định tuyến và liên kết đa tác tử
    - Điều chỉnh hành vi của phiên, phân phối tin nhắn và chế độ trò chuyện
summary: Cấu hình mặc định của agent, định tuyến đa agent, phiên, tin nhắn và trò chuyện
title: Cấu hình — tác nhân
x-i18n:
    generated_at: "2026-07-20T14:38:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b42bd47b953d5e970a125df8250f76ae70891fc5bd12fee3120f03365b5af597
    source_path: gateway/config-agents.md
    workflow: 16
---

Các khóa cấu hình theo phạm vi agent trong `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` và `talk.*`. Đối với các kênh, công cụ, môi trường chạy Gateway và các
khóa cấp cao nhất khác, hãy xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference).

## Giá trị mặc định của agent

### `agents.defaults.workspace`

Mặc định: `OPENCLAW_WORKSPACE_DIR` khi được đặt, nếu không thì là `~/.openclaw/workspace` (hoặc `~/.openclaw/workspace-<profile>` khi `OPENCLAW_PROFILE` được đặt thành một hồ sơ không mặc định).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Giá trị `agents.defaults.workspace` được chỉ định rõ ràng có độ ưu tiên cao hơn
`OPENCLAW_WORKSPACE_DIR`. Sử dụng biến môi trường để trỏ các agent mặc định
đến một không gian làm việc được gắn kết khi bạn không muốn ghi đường dẫn đó vào cấu hình.

### `agents.defaults.repoRoot`

Thư mục gốc của kho lưu trữ tùy chọn được hiển thị trong dòng Runtime của lời nhắc hệ thống. Nếu không được đặt, OpenClaw tự động phát hiện bằng cách duyệt ngược lên từ không gian làm việc.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Danh sách cho phép Skills mặc định tùy chọn dành cho các agent không đặt
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // kế thừa github, weather
      { id: "docs", skills: ["docs-search"] }, // thay thế các giá trị mặc định
      { id: "locked-down", skills: [] }, // không có Skills
    ],
  },
}
```

- Bỏ qua `agents.defaults.skills` để mặc định không giới hạn Skills.
- Bỏ qua `agents.list[].skills` để kế thừa các giá trị mặc định.
- Đặt `agents.list[].skills: []` để không có Skills.
- Danh sách `agents.list[].skills` không rỗng là tập hợp cuối cùng cho agent đó; danh sách này
  không hợp nhất với các giá trị mặc định.

### `agents.defaults.skipBootstrap`

Vô hiệu hóa việc tự động tạo các tệp khởi tạo không gian làm việc (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Bỏ qua việc tạo các tệp không gian làm việc tùy chọn đã chọn trong khi vẫn ghi các tệp khởi tạo bắt buộc (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Các giá trị hợp lệ: `SOUL.md`, `USER.md`, `HEARTBEAT.md` và `IDENTITY.md`.

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

- `"continuation-skip"`: các lượt tiếp tục an toàn (sau một phản hồi hoàn tất của trợ lý) bỏ qua việc chèn lại phần khởi tạo không gian làm việc, giúp giảm kích thước lời nhắc. Các lần chạy Heartbeat và lần thử lại sau Compaction vẫn xây dựng lại ngữ cảnh.
- `"never"`: vô hiệu hóa việc chèn phần khởi tạo không gian làm việc và tệp ngữ cảnh ở mọi lượt. Chỉ sử dụng tùy chọn này cho các agent hoàn toàn sở hữu vòng đời lời nhắc của mình (công cụ ngữ cảnh tùy chỉnh, môi trường chạy gốc tự xây dựng ngữ cảnh hoặc quy trình chuyên biệt không cần khởi tạo). Các lượt Heartbeat và khôi phục sau Compaction cũng bỏ qua việc chèn.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Ghi đè theo từng agent: `agents.list[].contextInjection`. Các giá trị bị bỏ qua sẽ kế thừa
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Số ký tự tối đa trên mỗi tệp khởi tạo không gian làm việc trước khi bị cắt ngắn. Mặc định: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Ghi đè theo từng agent: `agents.list[].bootstrapMaxChars`. Các giá trị bị bỏ qua sẽ kế thừa
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Tổng số ký tự tối đa được chèn từ tất cả các tệp khởi tạo không gian làm việc. Mặc định: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Ghi đè theo từng agent: `agents.list[].bootstrapTotalMaxChars`. Các giá trị bị bỏ qua
sẽ kế thừa `agents.defaults.bootstrapTotalMaxChars`.

### Ghi đè hồ sơ khởi tạo theo từng agent

Sử dụng ghi đè hồ sơ khởi tạo theo từng agent khi một agent cần hành vi chèn
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

Kiểm soát thông báo trong lời nhắc hệ thống mà agent có thể thấy khi ngữ cảnh khởi tạo bị cắt ngắn.
Mặc định: `"always"`.

- `"off"`: không bao giờ chèn văn bản thông báo cắt ngắn vào lời nhắc hệ thống.
- `"once"`: chèn một thông báo ngắn gọn một lần cho mỗi chữ ký cắt ngắn duy nhất.
- `"always"`: chèn một thông báo ngắn gọn ở mọi lần chạy khi có nội dung bị cắt ngắn (khuyến nghị).

Số lượng thô/đã chèn chi tiết và các trường điều chỉnh cấu hình vẫn nằm trong dữ liệu chẩn đoán như
báo cáo ngữ cảnh/trạng thái và nhật ký; ngữ cảnh người dùng/môi trường chạy WebChat thông thường chỉ
nhận được thông báo khôi phục ngắn gọn.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Bản đồ quyền sở hữu ngân sách ngữ cảnh

OpenClaw có nhiều ngân sách lời nhắc/ngữ cảnh dung lượng lớn và chúng được
chủ ý phân chia theo hệ thống con thay vì tất cả cùng đi qua một
tùy chọn chung.

| Ngân sách                                                         | Phạm vi                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Việc chèn phần khởi tạo không gian làm việc thông thường                                                                                                                            |
| `agents.defaults.startupContext.*`                             | Phần mở đầu một lần cho lần chạy mô hình khi đặt lại/khởi động, bao gồm các tệp `memory/*.md` hằng ngày gần đây. Các lệnh trò chuyện thuần `/new` và `/reset` được xác nhận mà không gọi mô hình |
| `skills.limits.*`                                              | Danh sách Skills rút gọn được chèn vào lời nhắc hệ thống                                                                                                         |
| `agents.defaults.contextLimits.*`                              | Các đoạn trích môi trường chạy có giới hạn và các khối do môi trường chạy sở hữu được chèn                                                                                                      |
| `memory.qmd.limits.*`                                          | Định cỡ đoạn trích và phần chèn tìm kiếm bộ nhớ đã lập chỉ mục                                                                                                              |

Các ghi đè tương ứng theo từng agent:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kiểm soát phần mở đầu khởi động ở lượt đầu được chèn vào các lần chạy mô hình khi đặt lại/khởi động.
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

Các giá trị mặc định dùng chung cho các bề mặt ngữ cảnh môi trường chạy có giới hạn.

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
- `memoryGetDefaultLines`: cửa sổ dòng `memory_get` mặc định khi `lines` bị
  bỏ qua.
- `toolResultMaxChars`: ngưỡng tối đa nâng cao cho kết quả công cụ trực tiếp, dùng cho các kết quả
  được lưu bền vững và khôi phục khi tràn. Để không đặt nhằm sử dụng giới hạn tự động theo ngữ cảnh mô hình:
  `16000` ký tự dưới 100K token, `32000` ký tự ở mức 100K+ token và `64000`
  ký tự ở mức 200K+ token. Các giá trị được chỉ định rõ ràng lên đến `1000000` được chấp nhận cho
  các mô hình ngữ cảnh dài, nhưng giới hạn hiệu dụng vẫn bị giới hạn ở khoảng 30% cửa sổ
  ngữ cảnh mô hình. `openclaw doctor --deep` in ra giới hạn hiệu dụng,
  và doctor chỉ cảnh báo khi một ghi đè rõ ràng đã lỗi thời hoặc không có tác dụng.
- `postCompactionMaxChars`: giới hạn đoạn trích AGENTS.md được sử dụng trong quá trình chèn
  làm mới sau Compaction.

#### `agents.list[].contextLimits`

Ghi đè theo từng agent cho các tùy chọn `contextLimits` dùng chung. Các trường bị bỏ qua sẽ kế thừa
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
          toolResultMaxChars: 8000, // ngưỡng tối đa nâng cao cho agent này
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
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Ghi đè theo từng agent cho ngân sách lời nhắc Skills.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Kích thước pixel tối đa cho cạnh dài nhất của hình ảnh trong các khối hình ảnh bản ghi/công cụ trước khi gọi nhà cung cấp.
Mặc định: `1200`.

Giá trị thấp hơn thường giảm mức sử dụng token thị giác và kích thước tải trọng yêu cầu cho các lần chạy có nhiều ảnh chụp màn hình.
Giá trị cao hơn giữ lại nhiều chi tiết hình ảnh hơn.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Tùy chọn nén/chi tiết của công cụ hình ảnh dành cho hình ảnh được tải từ đường dẫn tệp, URL và tham chiếu phương tiện.
Mặc định: `auto`.

OpenClaw điều chỉnh thang thay đổi kích thước theo mô hình hình ảnh đã chọn. Ví dụ: Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL và các mô hình thị giác Llama 4 được lưu trữ có thể sử dụng hình ảnh lớn hơn so với các luồng thị giác chi tiết cao cũ/mặc định, trong khi các lượt có nhiều hình ảnh được nén mạnh hơn ở chế độ `auto` để kiểm soát chi phí token và độ trễ.

Các giá trị:

- `auto`: điều chỉnh theo giới hạn mô hình và số lượng hình ảnh.
- `efficient`: ưu tiên hình ảnh nhỏ hơn để giảm mức sử dụng token và byte.
- `balanced`: sử dụng thang cân bằng tiêu chuẩn.
- `high`: giữ lại nhiều chi tiết hơn cho ảnh chụp màn hình, sơ đồ và hình ảnh tài liệu.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Múi giờ cho ngữ cảnh lời nhắc hệ thống (không phải dấu thời gian của tin nhắn). Dùng múi giờ của máy chủ nếu không có.

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
        fallbacks: ["google/gemini-3.1-flash-image"],
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
- `utilityModel`: tham chiếu hoặc bí danh `provider/model` tùy chọn dành cho các tác vụ nội bộ ngắn. Hiện tại, mục này hỗ trợ tiêu đề phiên Control UI được tạo tự động, tiêu đề chủ đề tin nhắn trực tiếp Telegram, tiêu đề luồng tự động của Discord và [phần tường thuật bản nháp tiến trình](/vi/concepts/progress-drafts#narrated-status). Khi không được đặt, OpenClaw suy ra mô hình nhỏ mặc định do nhà cung cấp chính khai báo nếu có (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); nếu không, các tác vụ tiêu đề sử dụng mô hình chính của tác nhân và tính năng tường thuật vẫn tắt. Nếu một mô hình tiện ích riêng biệt không thể chuẩn bị hoặc hoàn thành tiêu đề được tạo, OpenClaw thử lại tiêu đề đó một lần bằng mô hình chính. Đối với tiêu đề bảng điều khiển, việc tự động suy ra mô hình tiện ích và phương án dự phòng thông thường sử dụng nhà cung cấp và hồ sơ xác thực có hiệu lực của phiên; mô hình tiện ích được chỉ định rõ ràng vẫn giữ nguyên nhà cung cấp/phương thức xác thực đã cấu hình. Đặt `utilityModel: ""` để bỏ qua tuyến tiện ích thay thế; quá trình tạo tiêu đề bảng điều khiển vẫn tiếp tục trực tiếp với mô hình phiên thông thường. `agents.list[].utilityModel` ghi đè giá trị mặc định, còn cấu hình ghi đè mô hình dành riêng cho thao tác sẽ được ưu tiên hơn cả hai. Các tác vụ tiện ích thực hiện các lệnh gọi mô hình riêng và gửi nội dung dành riêng cho tác vụ đến nhà cung cấp mô hình đã chọn. Quá trình tạo tiêu đề bảng điều khiển gửi tối đa 1,000 ký tự đầu tiên của tin nhắn đầu tiên không phải lệnh; tính năng tường thuật gửi yêu cầu đầu vào cùng các bản tóm tắt công cụ ngắn gọn đã được che thông tin nhạy cảm. Hãy chọn nhà cung cấp phù hợp với yêu cầu về chi phí và xử lý dữ liệu của bạn.
- `imageModel`: chấp nhận chuỗi (`"provider/model"`) hoặc đối tượng (`{ primary, fallbacks }`).
  - Được đường dẫn công cụ `image` sử dụng làm cấu hình mô hình thị giác khi mô hình đang hoạt động không thể nhận hình ảnh. Thay vào đó, các mô hình có khả năng thị giác gốc nhận trực tiếp các byte hình ảnh đã tải.
  - Đồng thời được dùng làm tuyến dự phòng khi mô hình đã chọn/mặc định không thể nhận đầu vào hình ảnh.
  - Ưu tiên các tham chiếu `provider/model` rõ ràng. ID thuần được chấp nhận để tương thích; nếu một ID thuần khớp duy nhất với một mục đã cấu hình có khả năng xử lý hình ảnh trong `models.providers.*.models`, OpenClaw sẽ bổ sung nhà cung cấp cho ID đó. Các kết quả khớp mơ hồ trong cấu hình yêu cầu tiền tố nhà cung cấp rõ ràng.
- `imageGenerationModel`: chấp nhận chuỗi (`"provider/model"`) hoặc đối tượng (`{ primary, fallbacks }`).
  - Được dùng bởi khả năng tạo hình ảnh dùng chung và mọi bề mặt công cụ/plugin tạo hình ảnh trong tương lai.
  - Các giá trị thường dùng: `google/gemini-3.1-flash-image` để tạo hình ảnh Gemini nguyên bản, `fal/fal-ai/flux/dev` cho fal, `openai/gpt-image-2` cho OpenAI Images hoặc `openai/gpt-image-1.5` cho đầu ra PNG/WebP OpenAI có nền trong suốt.
  - Nếu chọn trực tiếp một nhà cung cấp/mô hình, hãy cấu hình cả phương thức xác thực tương ứng của nhà cung cấp (ví dụ: `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY` cho `google/*`, `OPENAI_API_KEY` hoặc OAuth OpenAI Codex cho `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` cho `fal/*`).
  - Nếu bị bỏ qua, `image_generate` vẫn có thể suy ra giá trị mặc định của nhà cung cấp có cấu hình xác thực. Trước tiên, mục này thử nhà cung cấp mặc định hiện tại, sau đó thử các nhà cung cấp tạo hình ảnh đã đăng ký còn lại theo thứ tự ID nhà cung cấp.
- `musicGenerationModel`: chấp nhận chuỗi (`"provider/model"`) hoặc đối tượng (`{ primary, fallbacks }`).
  - Được dùng bởi khả năng tạo nhạc dùng chung và công cụ `music_generate` tích hợp sẵn.
  - Các giá trị thường dùng: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` hoặc `minimax/music-2.6`.
  - Nếu bị bỏ qua, `music_generate` vẫn có thể suy ra giá trị mặc định của nhà cung cấp có cấu hình xác thực. Trước tiên, mục này thử nhà cung cấp mặc định hiện tại, sau đó thử các nhà cung cấp tạo nhạc đã đăng ký còn lại theo thứ tự ID nhà cung cấp.
  - Nếu chọn trực tiếp một nhà cung cấp/mô hình, hãy cấu hình cả phương thức xác thực/khóa API tương ứng của nhà cung cấp.
- `videoGenerationModel`: chấp nhận chuỗi (`"provider/model"`) hoặc đối tượng (`{ primary, fallbacks }`).
  - Được dùng bởi khả năng tạo video dùng chung và công cụ `video_generate` tích hợp sẵn.
  - Các giá trị thường dùng: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` hoặc `qwen/wan2.7-r2v`.
  - Nếu bị bỏ qua, `video_generate` vẫn có thể suy ra giá trị mặc định của nhà cung cấp có cấu hình xác thực. Trước tiên, mục này thử nhà cung cấp mặc định hiện tại, sau đó thử các nhà cung cấp tạo video đã đăng ký còn lại theo thứ tự ID nhà cung cấp.
  - Nếu chọn trực tiếp một nhà cung cấp/mô hình, hãy cấu hình cả phương thức xác thực/khóa API tương ứng của nhà cung cấp.
  - Plugin tạo video Qwen chính thức hỗ trợ tối đa 1 video đầu ra, 1 hình ảnh đầu vào, 4 video đầu vào, thời lượng 10 giây cùng các tùy chọn cấp nhà cung cấp `size`, `aspectRatio`, `resolution`, `audio` và `watermark`.
- `pdfModel`: chấp nhận chuỗi (`"provider/model"`) hoặc đối tượng (`{ primary, fallbacks }`).
  - Được công cụ `pdf` dùng để định tuyến mô hình.
  - Nếu bị bỏ qua, công cụ PDF chuyển sang `imageModel`, sau đó chuyển sang mô hình phiên/mặc định đã phân giải.
- `pdfMaxBytesMb`: giới hạn kích thước PDF mặc định cho công cụ `pdf` khi `maxBytesMb` không được truyền vào lúc gọi.
- `pdfMaxPages`: số trang tối đa mặc định được xem xét trong chế độ dự phòng trích xuất của công cụ `pdf`.
- `verboseDefault`: mức độ chi tiết mặc định cho tác nhân. Các giá trị: `"off"`, `"on"`, `"full"`. Mặc định: `"off"`.
- `toolProgressDetail`: chế độ chi tiết cho các bản tóm tắt công cụ `/verbose` và các dòng công cụ trong bản nháp tiến trình. Các giá trị: `"explain"` (mặc định, nhãn ngắn gọn dễ đọc) hoặc `"raw"` (nối thêm lệnh/chi tiết thô khi có). `agents.list[].toolProgressDetail` theo từng tác nhân ghi đè giá trị mặc định này.
- `reasoningDefault`: mức hiển thị suy luận mặc định cho tác nhân. Các giá trị: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` theo từng tác nhân ghi đè giá trị mặc định này. Các giá trị mặc định về suy luận đã cấu hình chỉ được áp dụng cho chủ sở hữu, người gửi được ủy quyền hoặc ngữ cảnh Gateway của quản trị viên vận hành khi chưa đặt cấu hình ghi đè suy luận theo tin nhắn hoặc phiên.
- `elevatedDefault`: mức đầu ra nâng cao mặc định cho tác nhân. Các giá trị: `"off"`, `"on"`, `"ask"`, `"full"`. Mặc định: `"on"`.
- `model.primary`: định dạng `provider/model` (ví dụ: `openai/gpt-5.6-sol` để truy cập bằng OAuth Codex). Nếu bạn bỏ qua nhà cung cấp, OpenClaw sẽ thử bí danh trước, sau đó tìm kết quả khớp duy nhất trong các nhà cung cấp đã cấu hình cho đúng ID mô hình đó và chỉ khi đó mới chuyển sang nhà cung cấp mặc định đã cấu hình (hành vi tương thích đã lỗi thời, vì vậy nên ưu tiên `provider/model` rõ ràng). Nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw sẽ chuyển sang nhà cung cấp/mô hình đầu tiên đã cấu hình thay vì báo lỗi giá trị mặc định cũ của nhà cung cấp đã bị xóa.
- `models`: các bí danh đã cấu hình và cài đặt theo từng mô hình. Mỗi mục có thể bao gồm `alias` (lối tắt) và `params` (dành riêng cho nhà cung cấp, ví dụ: `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, định tuyến `provider` của OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`). Việc thêm mục không hạn chế khả năng ghi đè mô hình.
  - Sử dụng các mục `provider/*` như `"openai/*": {}` hoặc `"vllm/*": {}` để hiển thị mọi mô hình được phát hiện của các nhà cung cấp đã chọn mà không cần liệt kê thủ công từng ID mô hình.
  - Thêm `agentRuntime` vào một mục `provider/*` khi mọi mô hình được phát hiện động của nhà cung cấp đó phải sử dụng cùng một runtime. Chính sách runtime `provider/model` khớp chính xác vẫn được ưu tiên hơn ký tự đại diện.
  - Chỉnh sửa siêu dữ liệu an toàn: sử dụng `openclaw config set agents.defaults.models '<json>' --strict-json --merge` để thêm mục. `config set` từ chối các thao tác thay thế sẽ xóa mục hiện có, trừ khi bạn truyền `--replace`.
- `modelPolicy.allow`: danh sách cho phép ghi đè rõ ràng. Chấp nhận bí danh, tham chiếu `provider/model` chính xác và ký tự đại diện tiền tố ở cuối như `openai/*` hoặc `clawrouter/anthropic/*`. Bỏ qua mục này hoặc sử dụng `[]` để cho phép mọi mô hình. `agents.list[].modelPolicy.allow` thay thế chính sách mặc định cho tác nhân đó; một danh sách trống được chỉ định rõ ràng sẽ cho phép tác nhân đó sử dụng mọi mô hình.
  - Các luồng cấu hình/thiết lập ban đầu theo phạm vi nhà cung cấp hợp nhất các mô hình của nhà cung cấp đã chọn vào ánh xạ này và giữ nguyên các nhà cung cấp không liên quan đã được cấu hình.
  - Đối với các mô hình OpenAI Responses trực tiếp, Compaction phía máy chủ được bật tự động. Sử dụng `params.responsesServerCompaction: false` để ngừng chèn `context_management` hoặc `params.responsesCompactThreshold` để ghi đè ngưỡng. Xem [Compaction phía máy chủ của OpenAI](/vi/providers/openai#advanced-configuration).
- `params`: các tham số mặc định toàn cục của nhà cung cấp được áp dụng cho mọi mô hình. Đặt tại `agents.defaults.params` (ví dụ: `{ cacheRetention: "long" }`).
- Thứ tự ưu tiên hợp nhất `params` (cấu hình): `agents.defaults.params` (cơ sở toàn cục) bị `agents.defaults.models["provider/model"].params` (theo từng mô hình) ghi đè, sau đó `agents.list[].params` (ID tác nhân khớp) ghi đè theo khóa. Xem [Bộ nhớ đệm lời nhắc](/vi/reference/prompt-caching) để biết chi tiết.
- `models.providers.openrouter.params.provider`: chính sách định tuyến nhà cung cấp mặc định trên toàn OpenRouter. OpenClaw chuyển tiếp mục này đến đối tượng `provider` trong yêu cầu của OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` theo từng mô hình và các tham số tác nhân ghi đè theo khóa. Xem [định tuyến nhà cung cấp OpenRouter](/vi/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: JSON chuyển tiếp nâng cao được hợp nhất vào nội dung yêu cầu `api: "openai-completions"` dành cho các proxy tương thích với OpenAI. Nếu xung đột với các khóa yêu cầu được tạo, nội dung bổ sung được ưu tiên; sau đó, các tuyến hoàn thành không phải tuyến gốc vẫn loại bỏ `store` chỉ dành cho OpenAI.
- `params.chat_template_kwargs`: các đối số mẫu trò chuyện tương thích với vLLM/OpenAI được hợp nhất vào nội dung yêu cầu `api: "openai-completions"` cấp cao nhất. Đối với `vllm/nemotron-3-*` khi tắt suy luận, plugin vLLM đi kèm tự động gửi `enable_thinking: false` và `force_nonempty_content: true`; `chat_template_kwargs` được chỉ định rõ ràng ghi đè các giá trị mặc định được tạo và `extra_body.chat_template_kwargs` vẫn có mức ưu tiên cuối cùng. Các mô hình suy luận Qwen và Nemotron của vLLM đã cấu hình cung cấp các lựa chọn `/think` nhị phân (`off`, `on`) thay vì thang mức độ nỗ lực nhiều cấp.
- `compat.thinkingFormat`: kiểu tải trọng suy luận tương thích với OpenAI. Sử dụng `"together"` cho `reasoning.enabled` kiểu Together, `"qwen"` cho `enable_thinking` cấp cao nhất kiểu Qwen hoặc `"qwen-chat-template"` cho `chat_template_kwargs.enable_thinking` trên các backend thuộc họ Qwen hỗ trợ các đối số từ khóa mẫu trò chuyện ở cấp yêu cầu, chẳng hạn như vLLM. OpenClaw ánh xạ trạng thái tắt suy luận thành `false` và bật suy luận thành `true`; các mô hình Qwen của vLLM đã cấu hình cung cấp các lựa chọn `/think` nhị phân cho những định dạng này.
- `compat.supportedReasoningEfforts`: danh sách mức độ nỗ lực suy luận tương thích với OpenAI theo từng mô hình. Bao gồm `"xhigh"` cho các điểm cuối tùy chỉnh thực sự chấp nhận giá trị này; sau đó OpenClaw hiển thị `/think xhigh` trong các menu lệnh, hàng phiên Gateway, quy trình xác thực bản vá phiên, xác thực CLI tác nhân và xác thực `llm-task` cho nhà cung cấp/mô hình đã cấu hình đó. Sử dụng `compat.reasoningEffortMap` khi backend yêu cầu một giá trị dành riêng cho nhà cung cấp tương ứng với một cấp chuẩn.
- `params.preserveThinking`: tùy chọn chỉ dành cho Z.AI để bật tính năng duy trì suy luận. Khi được bật và chế độ suy luận đang bật, OpenClaw gửi `thinking.clear_thinking: false` và phát lại `reasoning_content` trước đó; xem [suy luận và tính năng duy trì suy luận của Z.AI](/vi/providers/zai#advanced-configuration).
- `localService`: trình quản lý tiến trình tùy chọn ở cấp nhà cung cấp dành cho các máy chủ mô hình cục bộ/tự lưu trữ. Khi mô hình được chọn thuộc nhà cung cấp đó, OpenClaw thăm dò `healthUrl` (hoặc `baseUrl + "/models"`), khởi động `command` với `args` nếu điểm cuối không hoạt động, chờ tối đa `readyTimeoutMs`, rồi gửi yêu cầu mô hình. `command` phải là một đường dẫn tuyệt đối. `idleStopMs: 0` duy trì tiến trình cho đến khi OpenClaw thoát; giá trị dương sẽ dừng tiến trình do OpenClaw khởi chạy sau số mili giây không hoạt động tương ứng. Xem [Dịch vụ mô hình cục bộ](/vi/gateway/local-model-services).
- Chính sách runtime thuộc về nhà cung cấp hoặc mô hình, không phải `agents.defaults`. Sử dụng `models.providers.<provider>.agentRuntime` cho các quy tắc áp dụng trên toàn nhà cung cấp hoặc `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` cho các quy tắc dành riêng cho mô hình. Chỉ riêng tiền tố nhà cung cấp/mô hình không bao giờ chọn một harness. Khi runtime chưa được đặt hoặc là `auto`, OpenAI chỉ có thể ngầm chọn Codex cho một tuyến Platform Responses HTTPS chính thức hoặc ChatGPT Responses khớp chính xác và không có tùy chỉnh yêu cầu do người dùng tạo. Xem [Runtime agent ngầm định của OpenAI](/vi/providers/openai#implicit-agent-runtime).
- Các trình ghi cấu hình sửa đổi những trường này (ví dụ: `/models set`, `/models set-image` và các lệnh thêm/xóa phương án dự phòng) sẽ lưu ở dạng đối tượng chuẩn tắc và giữ nguyên các danh sách phương án dự phòng hiện có khi có thể.
- `maxConcurrent`: số lượt chạy agent song song tối đa trên các phiên (mỗi phiên vẫn được tuần tự hóa). Mặc định: `4`.

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

- `id`: `"auto"`, `"openclaw"`, một id harness Plugin đã đăng ký hoặc một bí danh backend CLI được hỗ trợ. Plugin Codex đi kèm đăng ký `codex`; Plugin Anthropic đi kèm cung cấp backend CLI `claude-cli`.
- `id: "auto"` cho phép các harness Plugin đã đăng ký tiếp nhận những route hiệu lực khai báo hoặc đáp ứng hợp đồng hỗ trợ của chúng theo cách khác, và sử dụng OpenClaw khi không có harness nào khớp. Một runtime Plugin tường minh như `id: "codex"` yêu cầu harness đó và một route hiệu lực tương thích; nó từ chối hoạt động nếu một trong hai không khả dụng hoặc nếu việc thực thi thất bại.
- `id: "pi"` chỉ được chấp nhận dưới dạng bí danh không còn được khuyến nghị cho `openclaw` nhằm duy trì các cấu hình đã phát hành từ v2026.5.22 trở về trước. Cấu hình mới nên dùng `openclaw`.
- Thứ tự ưu tiên runtime trước hết là chính sách model khớp chính xác (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` hoặc `models.providers.<provider>.models[]`), sau đó là `agents.list[]` / `agents.defaults.models["provider/*"]`, rồi đến chính sách áp dụng cho toàn provider tại `models.providers.<provider>.agentRuntime`.
- Các khóa runtime áp dụng cho toàn bộ agent là dạng cũ. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, các ghim runtime của phiên và `OPENCLAW_AGENT_RUNTIME` bị quá trình chọn runtime bỏ qua. Chạy `openclaw doctor --fix` để xóa các giá trị lỗi thời.
- Các route OpenAI Responses/ChatGPT HTTPS chính thức, khớp chính xác, đủ điều kiện và không có giá trị ghi đè yêu cầu do người dùng định nghĩa có thể ngầm sử dụng harness Codex. `agentRuntime.id: "codex"` của provider/model biến Codex thành yêu cầu từ chối hoạt động khi không đáp ứng, nhưng không làm cho một route không tương thích trở nên tương thích.
- Đối với các triển khai Claude CLI, nên dùng `model: "anthropic/claude-opus-4-8"` cùng với `agentRuntime.id: "claude-cli"` có phạm vi theo model. Các tham chiếu `claude-cli/<model>` cũ vẫn hoạt động để tương thích, nhưng cấu hình mới nên giữ lựa chọn provider/model ở dạng chuẩn và đặt backend thực thi trong chính sách runtime của provider/model.
- Thiết lập này chỉ kiểm soát việc thực thi lượt agent dạng văn bản. Tạo nội dung đa phương tiện, thị giác, PDF, âm nhạc, video và TTS vẫn sử dụng các thiết lập provider/model tương ứng.

**Dạng viết tắt của bí danh tích hợp sẵn** (chỉ áp dụng khi model nằm trong `agents.defaults.models`):

| Bí danh             | Model                           |
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

Các model Z.AI GLM-4.x tự động bật chế độ suy nghĩ, trừ khi bạn đặt `--thinking off` hoặc tự định nghĩa `agents.defaults.models["zai/<model>"].params.thinking`.
Các model Z.AI bật `tool_stream` theo mặc định để truyền trực tuyến lệnh gọi công cụ. Đặt `agents.defaults.models["zai/<model>"].params.tool_stream` thành `false` để tắt tính năng này.
Anthropic Claude Opus 4.8 mặc định tắt suy nghĩ trong OpenClaw; khi suy nghĩ thích ứng được bật tường minh, giá trị mặc định về mức nỗ lực do provider Anthropic sở hữu là `high`. Các model Claude 4.6 mặc định dùng `adaptive` khi không đặt mức suy nghĩ tường minh.

### `agents.defaults.cliBackends`

Các backend CLI tùy chọn dành cho những lần chạy dự phòng chỉ có văn bản (không gọi công cụ). Hữu ích làm phương án dự phòng khi các provider API gặp lỗi.

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
          // Hoặc dùng systemPromptFileArg khi CLI chấp nhận cờ tệp prompt.
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
  các phiên đã bị vô hiệu hóa từ phần đuôi có giới hạn của bản chép lời OpenClaw thô trước khi
  bản tóm tắt Compaction đầu tiên tồn tại. Thay đổi hồ sơ xác thực hoặc kỷ nguyên thông tin xác thực
  vẫn không bao giờ tái khởi tạo từ dữ liệu thô.

### `agents.defaults.promptOverlays`

Các lớp phủ prompt độc lập với provider, được áp dụng theo họ model trên các bề mặt prompt do OpenClaw tập hợp. Các id model thuộc họ GPT-5 nhận hợp đồng hành vi dùng chung trên các route OpenClaw/provider; `personality` chỉ kiểm soát lớp phong cách tương tác thân thiện. Các route app-server Codex gốc giữ lại hướng dẫn cơ sở/model do Codex sở hữu thay vì lớp phủ GPT-5 này của OpenClaw, và OpenClaw tắt tính cách tích hợp sẵn của Codex cho các luồng gốc.

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

Các lần chạy Heartbeat định kỳ.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m sẽ tắt
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // mặc định: true; false sẽ bỏ phần Heartbeat khỏi prompt hệ thống
        lightContext: false, // mặc định: false; true chỉ giữ HEARTBEAT.md trong các tệp khởi tạo không gian làm việc
        isolatedSession: false, // mặc định: false; true chạy mỗi heartbeat trong một phiên mới (không có lịch sử hội thoại)
        skipWhenBusy: false, // mặc định: false; true cũng chờ các làn subagent/lồng nhau của agent này
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
- `includeSystemPromptSection`: khi là false, bỏ phần Heartbeat khỏi prompt hệ thống và bỏ qua việc chèn `HEARTBEAT.md` vào ngữ cảnh khởi tạo. Mặc định: `true`.
- `suppressToolErrorWarnings`: khi là true, ẩn các payload cảnh báo lỗi công cụ trong những lần chạy Heartbeat.
- `timeoutSeconds`: thời gian tối đa tính bằng giây được phép cho một lượt agent Heartbeat trước khi lượt đó bị hủy. Để trống để dùng `agents.defaults.timeoutSeconds` khi giá trị này được đặt; nếu không, dùng nhịp Heartbeat với giới hạn tối đa 600 giây.
- `directPolicy`: chính sách gửi trực tiếp/DM. `allow` (mặc định) cho phép gửi tới đích trực tiếp. `block` chặn gửi tới đích trực tiếp và phát ra `reason=dm-blocked`.
- `lightContext`: khi là true, các lần chạy Heartbeat sử dụng ngữ cảnh khởi tạo gọn nhẹ và chỉ giữ `HEARTBEAT.md` trong các tệp khởi tạo không gian làm việc.
- `isolatedSession`: khi là true, mỗi Heartbeat chạy trong một phiên mới, không có lịch sử hội thoại trước đó. Cùng mẫu cô lập với Cron `sessionTarget: "isolated"`. Giảm chi phí token cho mỗi Heartbeat từ ~100K xuống ~2-5K token.
- `skipWhenBusy`: khi là true, các lần chạy Heartbeat sẽ trì hoãn khi agent đó có thêm các làn đang bận: công việc subagent được phân theo khóa phiên hoặc công việc lệnh lồng nhau của chính agent đó. Các làn Cron luôn trì hoãn Heartbeat, ngay cả khi không có cờ này.
- Theo từng agent: đặt `agents.list[].heartbeat`. Khi có bất kỳ agent nào định nghĩa `heartbeat`, **chỉ những agent đó** chạy Heartbeat.
- Heartbeat chạy toàn bộ lượt agent — khoảng thời gian ngắn hơn tiêu tốn nhiều token hơn.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id của Plugin provider Compaction đã đăng ký (tùy chọn)
        thinkingLevel: "low", // giá trị ghi đè suy nghĩ tùy chọn chỉ dành cho Compaction
        timeoutSeconds: 180,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Giữ nguyên chính xác các ID triển khai, ID phiếu và cặp host:port.", // dùng khi identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // kiểm tra áp lực vòng lặp công cụ tùy chọn
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // chủ động chọn chèn lại các phần AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // giá trị ghi đè model tùy chọn chỉ dành cho Compaction
        truncateAfterCompaction: true, // luân chuyển sang JSONL kế tiếp nhỏ hơn sau Compaction
        maxActiveTranscriptBytes: "20mb", // trình kích hoạt Compaction cục bộ trước khi chạy, tùy chọn
        notifyUser: true, // thông báo khi Compaction bắt đầu/hoàn tất và khi việc xả bộ nhớ bị suy giảm (mặc định: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // giá trị ghi đè model tùy chọn chỉ dành cho việc xả bộ nhớ
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "Phiên sắp được Compaction. Hãy lưu trữ các ký ức lâu dài ngay.",
          prompt: "Ghi mọi ghi chú cần lưu lâu dài vào memory/YYYY-MM-DD.md; phản hồi bằng đúng token im lặng NO_REPLY nếu không có gì cần lưu.",
        },
      },
    },
  },
}
```

- `mode`: `default` hoặc `safeguard` (tóm tắt theo từng phần cho lịch sử dài). Xem [Compaction](/vi/concepts/compaction).
- `provider`: id của Plugin nhà cung cấp Compaction đã đăng ký. Khi được đặt, `summarize()` của nhà cung cấp sẽ được gọi thay cho tính năng tóm tắt LLM tích hợp. Chuyển về cơ chế tích hợp khi xảy ra lỗi. Việc đặt nhà cung cấp sẽ bắt buộc sử dụng `mode: "safeguard"`. Xem [Compaction](/vi/concepts/compaction).
- `thinkingLevel`: mức suy luận tùy chọn chỉ được dùng cho các bản tóm tắt Compaction OpenClaw nhúng (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` hoặc `ultra`). Giá trị này ghi đè mức suy luận hiện tại của phiên và bị giới hạn theo mô hình/môi trường chạy Compaction đã chọn. Để trống để kế thừa mức của phiên. Compaction app-server Codex gốc bỏ qua thiết lập này vì yêu cầu compact gốc không hỗ trợ ghi đè mức suy luận theo từng thao tác; OpenClaw ghi cảnh báo khi thiết lập này được cấu hình.
- `timeoutSeconds`: số giây tối đa cho phép đối với một thao tác Compaction trước khi OpenClaw hủy thao tác đó. Mặc định: `180`.
- `keepRecentTokens`: ngân sách điểm cắt của tác tử để giữ nguyên văn phần cuối bản ghi gần đây nhất. `/compact` thủ công tuân theo giá trị này khi được đặt rõ ràng; nếu không, Compaction thủ công là một điểm kiểm tra cứng.
- `recentTurnsPreserve`: số lượt người dùng/trợ lý gần đây nhất được giữ nguyên văn bên ngoài phần tóm tắt bảo vệ. Mặc định: `3`.
- `identifierPolicy`: `strict` (mặc định), `off` hoặc `custom`. `strict` thêm hướng dẫn tích hợp về việc giữ lại các mã định danh không rõ nghĩa vào đầu quá trình tóm tắt Compaction.
- `identifierInstructions`: văn bản tùy chỉnh không bắt buộc để bảo toàn mã định danh, được dùng khi `identifierPolicy=custom`.
- `qualityGuard`: các kiểm tra thử lại khi đầu ra không đúng định dạng đối với bản tóm tắt bảo vệ. Được bật mặc định trong chế độ bảo vệ; đặt `enabled: false` để bỏ qua bước kiểm tra.
- `midTurnPrecheck`: kiểm tra áp lực vòng lặp công cụ tùy chọn. Khi `enabled: true`, OpenClaw kiểm tra áp lực ngữ cảnh sau khi kết quả công cụ được thêm vào và trước lần gọi mô hình tiếp theo. Nếu ngữ cảnh không còn vừa, hệ thống hủy lần thử hiện tại trước khi gửi prompt và tái sử dụng đường dẫn khôi phục kiểm tra trước hiện có để cắt bớt kết quả công cụ hoặc thực hiện Compaction rồi thử lại. Hoạt động với cả chế độ Compaction `default` và `safeguard`. Mặc định: tắt.
- `postIndexSync`: chế độ lập chỉ mục lại bộ nhớ phiên sau Compaction. Mặc định: `"async"`. Dùng `"await"` để có độ mới cao nhất, `"async"` để giảm độ trễ Compaction hoặc chỉ dùng `"off"` khi việc đồng bộ bộ nhớ phiên được xử lý ở nơi khác.
- `postCompactionSections`: tên các phần H2/H3 tùy chọn trong AGENTS.md để chèn lại sau Compaction. Tính năng chèn lại bị tắt khi không đặt hoặc được đặt thành `[]`. Việc đặt rõ ràng `["Session Startup", "Red Lines"]` sẽ bật cặp đó và giữ nguyên cơ chế dự phòng `Every Session`/`Safety` cũ. Chỉ bật tính năng này khi ngữ cảnh bổ sung đáng để chấp nhận rủi ro lặp lại hướng dẫn dự án đã được ghi nhận trong bản tóm tắt Compaction.
- `model`: `provider/model-id` tùy chọn hoặc bí danh thuần từ `agents.defaults.models`, chỉ dành cho việc tóm tắt Compaction. Bí danh thuần được phân giải trước khi điều phối; id mô hình dạng literal đã cấu hình được ưu tiên khi xảy ra xung đột. Dùng tùy chọn này khi phiên chính cần giữ nguyên một mô hình nhưng bản tóm tắt Compaction cần chạy trên mô hình khác; khi không đặt, Compaction sử dụng mô hình chính của phiên.
- `truncateAfterCompaction`: xoay vòng bản ghi phiên đang hoạt động sau Compaction để các lượt sau chỉ tải bản tóm tắt và phần cuối chưa được tóm tắt, trong khi toàn bộ bản ghi trước đó vẫn được lưu trữ. Ngăn bản ghi phiên đang hoạt động tăng trưởng không giới hạn trong các phiên chạy dài. Mặc định: `false`.
- `maxActiveTranscriptBytes`: ngưỡng byte tùy chọn (`number` hoặc các chuỗi như `"20mb"`) kích hoạt Compaction cục bộ thông thường trước một lượt chạy khi lịch sử bản ghi vượt quá ngưỡng. Yêu cầu `truncateAfterCompaction` để Compaction thành công có thể xoay vòng sang một bản ghi kế nhiệm nhỏ hơn. Bị tắt khi không đặt hoặc là `0`.
- `notifyUser`: khi `true`, gửi thông báo ngắn về việc duy trì ngữ cảnh cho người dùng: khi Compaction bắt đầu và hoàn tất (ví dụ: "Đang Compaction ngữ cảnh..." và "Compaction hoàn tất"), cũng như khi thao tác xả bộ nhớ trước Compaction đã dùng hết khả năng thử lại nên phản hồi tiếp tục ở trạng thái suy giảm (ví dụ: "Việc duy trì bộ nhớ tạm thời thất bại; đang tiếp tục phản hồi cho bạn."). Mặc định bị tắt để các thông báo này không xuất hiện.
- `memoryFlush`: lượt tác tử chạy im lặng trước khi tự động Compaction để lưu trữ bộ nhớ bền vững. Đặt `model` thành một nhà cung cấp/mô hình chính xác như `ollama/qwen3:8b` khi lượt dọn dẹp này cần tiếp tục dùng mô hình cục bộ; giá trị ghi đè không kế thừa chuỗi dự phòng của phiên đang hoạt động. `forceFlushTranscriptBytes` bắt buộc xả khi kích thước bản ghi đạt ngưỡng ngay cả khi bộ đếm token đã lỗi thời. Bị bỏ qua khi không gian làm việc ở chế độ chỉ đọc.

### `agents.defaults.contextPruning`

Loại bỏ **kết quả công cụ cũ** khỏi ngữ cảnh trong bộ nhớ trước khi gửi đến LLM. **Không** sửa đổi lịch sử phiên trên đĩa. Mặc định bị tắt; đặt `mode: "cache-ttl"` để bật.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // tắt (mặc định) | cache-ttl
      },
    },
  },
}
```

<Accordion title="Hành vi của chế độ cache-ttl">

- `mode: "cache-ttl"` bật các lượt loại bỏ.
- Quá trình loại bỏ trước tiên cắt mềm các kết quả công cụ quá lớn, sau đó xóa cứng các kết quả công cụ cũ hơn nếu cần.

**Cắt mềm** giữ lại phần đầu + phần cuối và chèn `...` vào giữa.

**Xóa cứng** thay thế toàn bộ kết quả công cụ bằng phần giữ chỗ.

Lưu ý:

- Các khối hình ảnh không bao giờ bị cắt/xóa.
- Tỷ lệ dựa trên ký tự (xấp xỉ), không phải số lượng token chính xác.
- Các tin nhắn trợ lý gần đây nhất được giữ lại.

</Accordion>

Xem [Loại bỏ dữ liệu phiên](/vi/concepts/session-pruning) để biết chi tiết về hành vi.

### Phát trực tiếp theo khối

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (default) | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Các kênh không phải Telegram yêu cầu đặt rõ ràng `*.streaming.block.enabled: true` để bật phản hồi theo khối. QQ Bot là ngoại lệ: kênh này không có khóa `streaming.block` và phát trực tiếp phản hồi theo khối trừ khi `channels.qqbot.streaming.mode` là `"off"`.
- Giá trị ghi đè theo kênh: `channels.<channel>.streaming.block.coalesce` (và các biến thể theo tài khoản). Discord, Google Chat, Mattermost, MS Teams, Signal và Slack mặc định là `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: ranh giới phân đoạn ưu tiên (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: khoảng dừng ngẫu nhiên giữa các phản hồi theo khối. Mặc định: `off`. `natural` = 800-2500ms. `custom` sử dụng `minMs`/`maxMs` (chuyển về khoảng tự nhiên đối với bất kỳ giới hạn nào chưa được đặt). Ghi đè theo tác tử: `agents.list[].humanDelay`.

Xem [Phát trực tiếp](/vi/concepts/streaming) để biết chi tiết về hành vi + phân đoạn.

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
- Mặc định của `typingIntervalSeconds`: `6`.
- Ghi đè theo phiên: `session.typingMode`.

Xem [Chỉ báo đang nhập](/vi/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Cơ chế hộp cát tùy chọn cho tác tử nhúng. Xem [Cơ chế hộp cát](/vi/gateway/sandboxing) để biết hướng dẫn đầy đủ.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (default) | non-main | all
        backend: "docker", // docker (default) | ssh | openshell
        scope: "agent", // session | agent (default) | shared
        workspaceAccess: "none", // none (default) | ro | rw
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

Các giá trị mặc định hiển thị ở trên (`off`/`docker`/`agent`/`none`/hình ảnh `bookworm-slim`/mạng `none`/v.v.) là các giá trị mặc định thực tế của OpenClaw, không chỉ là giá trị minh họa.

<Accordion title="Chi tiết về hộp cát">

**Phần phụ trợ:**

- `docker`: môi trường chạy Docker cục bộ (mặc định)
- `ssh`: môi trường chạy từ xa chung dựa trên SSH
- `openshell`: môi trường chạy OpenShell

Khi chọn `backend: "openshell"`, các thiết lập dành riêng cho môi trường chạy sẽ chuyển sang
`plugins.entries.openshell.config`.

**Cấu hình phần phụ trợ SSH:**

- `target`: đích SSH ở dạng `user@host[:port]`
- `command`: lệnh máy khách SSH (mặc định: `ssh`)
- `workspaceRoot`: thư mục gốc tuyệt đối trên máy từ xa dùng cho các không gian làm việc theo phạm vi (mặc định: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: các tệp cục bộ hiện có được truyền cho OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: nội dung nội tuyến hoặc SecretRef mà OpenClaw hiện thực hóa thành tệp tạm trong thời gian chạy
- `strictHostKeyChecking` / `updateHostKeys`: các tùy chọn chính sách khóa máy chủ OpenSSH (cả hai mặc định là `true`)

**Thứ tự ưu tiên xác thực SSH:**

- `identityData` được ưu tiên hơn `identityFile`
- `certificateData` được ưu tiên hơn `certificateFile`
- `knownHostsData` được ưu tiên hơn `knownHostsFile`
- Các giá trị `*Data` dựa trên SecretRef được phân giải từ ảnh chụp nhanh môi trường bí mật đang hoạt động trước khi phiên sandbox bắt đầu

**Hành vi của backend SSH:**

- khởi tạo không gian làm việc từ xa một lần sau khi tạo hoặc tạo lại
- sau đó duy trì không gian làm việc SSH từ xa làm bản chuẩn
- định tuyến `exec`, các công cụ tệp và đường dẫn phương tiện qua SSH
- không tự động đồng bộ các thay đổi từ xa trở lại máy chủ
- không hỗ trợ container trình duyệt sandbox

**Quyền truy cập không gian làm việc:**

- `none`: không gian làm việc sandbox theo phạm vi bên dưới `~/.openclaw/sandboxes` (mặc định)
- `ro`: không gian làm việc sandbox tại `/workspace`, không gian làm việc của tác nhân được gắn chỉ đọc tại `/agent`
- `rw`: không gian làm việc của tác nhân được gắn đọc/ghi tại `/workspace`

**Phạm vi:**

- `session`: container + không gian làm việc cho mỗi phiên
- `agent`: một container + không gian làm việc cho mỗi tác nhân (mặc định)
- `shared`: container và không gian làm việc dùng chung (không cô lập giữa các phiên)

**Cấu hình Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // phản chiếu (mặc định) | từ xa
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // tùy chọn
          gatewayEndpoint: "https://lab.example", // tùy chọn
          policy: "strict", // mã chính sách OpenShell tùy chọn
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
- `remote`: khởi tạo máy từ xa một lần khi sandbox được tạo, sau đó duy trì không gian làm việc từ xa làm bản chuẩn

Ở chế độ `remote`, các chỉnh sửa cục bộ trên máy chủ được thực hiện bên ngoài OpenClaw không tự động đồng bộ vào sandbox sau bước khởi tạo.
Phương thức truyền tải là SSH vào sandbox OpenShell, nhưng Plugin quản lý vòng đời sandbox và việc đồng bộ phản chiếu tùy chọn.

**`setupCommand`** chạy một lần sau khi tạo container (qua `sh -lc`). Yêu cầu quyền truy cập mạng ra ngoài, thư mục gốc có thể ghi và người dùng root.

**Container mặc định dùng `network: "none"`** — đặt thành `"bridge"` (hoặc một mạng cầu nối tùy chỉnh) nếu tác nhân cần truy cập ra ngoài.
`"host"` bị chặn. `"container:<id>"` bị chặn theo mặc định trừ khi bạn đặt rõ ràng
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (phương án khẩn cấp).
Các lượt app-server Codex trong một sandbox OpenClaw đang hoạt động sử dụng cùng cài đặt truy cập ra ngoài này cho quyền truy cập mạng gốc ở chế độ mã.

**Tệp đính kèm đến** được đưa vào `media/inbound/*` trong không gian làm việc đang hoạt động.

**`docker.binds`** gắn thêm các thư mục máy chủ; các liên kết toàn cục và theo tác nhân được hợp nhất.

**Trình duyệt sandbox** (`sandbox.browser.enabled`, mặc định `false`): Chromium + CDP trong một container. URL noVNC được chèn vào lời nhắc hệ thống. Không yêu cầu `browser.enabled` trong `openclaw.json`.
Quyền truy cập quan sát qua noVNC mặc định sử dụng xác thực VNC và OpenClaw phát hành URL token có thời hạn ngắn (thay vì để lộ mật khẩu trong URL dùng chung).

- `allowHostControl: false` (mặc định) ngăn các phiên sandbox nhắm đến trình duyệt trên máy chủ.
- `network` mặc định là `openclaw-sandbox-browser` (mạng cầu nối chuyên dụng). Chỉ đặt thành `bridge` khi bạn chủ ý muốn kết nối cầu nối toàn cục. `"host"` cũng bị chặn tại đây.
- `cdpSourceRange` có thể giới hạn lưu lượng CDP đến tại biên container theo một dải CIDR (ví dụ `172.21.0.1/32`).
- `sandbox.browser.binds` chỉ gắn thêm các thư mục máy chủ vào container trình duyệt sandbox. Khi được đặt (bao gồm `[]`), giá trị này thay thế `docker.binds` cho container trình duyệt.
- Chromium của container trình duyệt sandbox luôn khởi chạy với `--no-sandbox --disable-setuid-sandbox` (container không có các cơ chế nguyên thủy của kernel mà sandbox riêng của Chrome cần); không có tùy chọn cấu hình để thay đổi điều này.
- Các giá trị mặc định khi khởi chạy được định nghĩa trong `scripts/sandbox-browser-entrypoint.sh` và tinh chỉnh cho máy chủ container:
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
  - `--disable-3d-apis`, `--disable-gpu` và `--disable-software-rasterizer` được
    bật theo mặc định và có thể tắt bằng
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` nếu việc sử dụng WebGL/3D yêu cầu.
  - `--disable-extensions` (được bật theo mặc định); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    bật lại các tiện ích mở rộng nếu quy trình làm việc của bạn phụ thuộc vào chúng.
  - `--renderer-process-limit=2` theo mặc định; thay đổi bằng
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, đặt `0` để sử dụng giới hạn
    tiến trình mặc định của Chromium.
  - `--headless=new` chỉ khi `headless` được bật.
  - Các giá trị mặc định là đường cơ sở của ảnh container; hãy dùng ảnh trình duyệt tùy chỉnh với
    điểm vào tùy chỉnh để thay đổi các giá trị mặc định của container.

</Accordion>

Sandbox trình duyệt và `sandbox.docker.binds` chỉ hỗ trợ Docker.

Xây dựng ảnh (từ bản checkout mã nguồn):

```bash
scripts/sandbox-setup.sh           # ảnh sandbox chính
scripts/sandbox-browser-setup.sh   # ảnh trình duyệt tùy chọn
```

Đối với cài đặt npm không có bản checkout mã nguồn, hãy xem [Sandbox § Ảnh và thiết lập](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` nội tuyến.

### `agents.list` (ghi đè theo tác nhân)

Sử dụng `agents.list[].tts` để cung cấp cho tác nhân nhà cung cấp TTS, giọng nói, mô hình,
phong cách hoặc chế độ TTS tự động riêng. Khối tác nhân được hợp nhất sâu trên cấu hình toàn cục
`messages.tts`, vì vậy thông tin xác thực dùng chung có thể nằm ở một nơi trong khi từng
tác nhân chỉ ghi đè các trường giọng nói hoặc nhà cung cấp cần thiết. Cấu hình ghi đè của tác nhân
đang hoạt động áp dụng cho các phản hồi nói tự động, `/tts audio`, `/tts status` và
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
        thinkingDefault: "high", // ghi đè mức suy nghĩ theo tác nhân
        reasoningDefault: "on", // ghi đè khả năng hiển thị lập luận theo tác nhân
        fastModeDefault: false, // ghi đè chế độ nhanh theo tác nhân
        params: { cacheRetention: "none" }, // ghi đè các tham số defaults.models khớp theo khóa
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // thay thế agents.defaults.skills khi được đặt
        identity: {
          name: "Samantha",
          theme: "con lười hữu ích",
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
            mode: "persistent", // lâu dài | một lần
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

- `id`: mã định danh tác tử ổn định (bắt buộc).
- `default`: khi đặt nhiều mục, mục đầu tiên được ưu tiên (có ghi cảnh báo vào nhật ký). Nếu không đặt mục nào, mục đầu tiên trong danh sách là mặc định.
- `model`: dạng chuỗi đặt mô hình chính nghiêm ngặt cho từng tác tử mà không có mô hình dự phòng; dạng đối tượng `{ primary }` cũng nghiêm ngặt trừ khi bạn thêm `fallbacks`. Dùng `{ primary, fallbacks: [...] }` để cho phép tác tử đó sử dụng dự phòng, hoặc `{ primary, fallbacks: [] }` để chỉ rõ hành vi nghiêm ngặt. Các tác vụ Cron chỉ ghi đè `primary` vẫn kế thừa các phương án dự phòng mặc định trừ khi bạn đặt `fallbacks: []`.
- `utilityModel`: tùy chọn ghi đè theo từng tác tử cho các tác vụ nội bộ ngắn, chẳng hạn như tạo tiêu đề phiên và luồng. Dự phòng về `agents.defaults.utilityModel`, sau đó đến mô hình nhỏ mặc định được khai báo của nhà cung cấp phiên có hiệu lực. Tiêu đề bảng điều khiển thử lại một lần bằng mô hình phiên thông thường có hiệu lực. Chuỗi trống sẽ bỏ qua tuyến tiện ích thay thế cho tác tử này mà không vô hiệu hóa việc tạo tiêu đề bảng điều khiển.
- `params`: các tham số luồng theo từng tác tử được hợp nhất đè lên mục mô hình đã chọn trong `agents.defaults.models`. Dùng mục này cho các ghi đè dành riêng cho tác tử như `cacheRetention`, `temperature` hoặc `maxTokens` mà không cần sao chép toàn bộ danh mục mô hình.
- `tts`: tùy chọn ghi đè chuyển văn bản thành giọng nói theo từng tác tử. Khối này được hợp nhất sâu đè lên `messages.tts`, vì vậy hãy giữ thông tin xác thực dùng chung của nhà cung cấp và chính sách dự phòng trong `messages.tts`, đồng thời chỉ đặt tại đây các giá trị dành riêng cho nhân dạng như nhà cung cấp, giọng nói, mô hình, phong cách hoặc chế độ tự động.
- `skills`: danh sách cho phép Skills tùy chọn theo từng tác tử. Nếu bỏ qua, tác tử kế thừa `agents.defaults.skills` khi mục này được đặt; danh sách được chỉ định rõ sẽ thay thế các giá trị mặc định thay vì hợp nhất, và `[]` có nghĩa là không có Skills nào.
- `thinkingDefault`: mức suy nghĩ mặc định tùy chọn theo từng tác tử (`off | minimal | low | medium | high | xhigh | adaptive | max`). Ghi đè `agents.defaults.thinkingDefault` cho tác tử này khi không đặt ghi đè theo tin nhắn hoặc phiên. Hồ sơ nhà cung cấp/mô hình đã chọn kiểm soát các giá trị hợp lệ; đối với Google Gemini, `adaptive` giữ cơ chế suy nghĩ động do nhà cung cấp quản lý (`thinkingLevel` bị bỏ qua trên Gemini 3/3.1, `thinkingBudget: -1` trên Gemini 2.5).
- `reasoningDefault`: chế độ hiển thị lập luận mặc định tùy chọn theo từng tác tử (`on | off | stream`). Ghi đè `agents.defaults.reasoningDefault` cho tác tử này khi không đặt ghi đè lập luận theo tin nhắn hoặc phiên.
- `fastModeDefault`: giá trị mặc định tùy chọn theo từng tác tử cho chế độ nhanh (`"auto" | true | false`). Áp dụng khi không đặt ghi đè chế độ nhanh theo tin nhắn hoặc phiên.
- `models`: tùy chọn ghi đè danh mục mô hình/môi trường chạy theo từng tác tử, với khóa là các mã định danh `provider/model` đầy đủ. Dùng `models["provider/model"].agentRuntime` cho các ngoại lệ môi trường chạy theo từng tác tử.
- `runtime`: bộ mô tả môi trường chạy tùy chọn theo từng tác tử. Dùng `type: "acp"` với các giá trị mặc định `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) khi tác tử nên mặc định sử dụng các phiên bộ khung ACP.
- `identity.avatar`: đường dẫn tương đối với không gian làm việc, URL `http(s)` hoặc URI `data:`.
- Các tệp hình ảnh `identity.avatar` cục bộ có đường dẫn tương đối với không gian làm việc bị giới hạn ở 2 MB. URL `http(s)` và URI `data:` không được kiểm tra theo giới hạn kích thước tệp cục bộ.
- `identity` suy ra các giá trị mặc định: `ackReaction` từ `emoji`, `mentionPatterns` từ `name`/`emoji`.
- `subagents.allowAgents`: danh sách cho phép các mã định danh tác tử đã cấu hình cho các đích `sessions_spawn.agentId` được chỉ định rõ (`["*"]` = bất kỳ đích đã cấu hình nào; mặc định: chỉ cùng tác tử). Bao gồm mã định danh của bên yêu cầu khi cần cho phép các lệnh gọi `agentId` tự nhắm đến chính mình. Các mục cũ có cấu hình tác tử đã bị xóa sẽ bị `sessions_spawn` từ chối và bị loại khỏi `agents_list`; chạy `openclaw doctor --fix` để dọn dẹp chúng, hoặc thêm một mục `agents.list[]` tối thiểu nếu đích đó vẫn cần có thể được tạo trong khi kế thừa các giá trị mặc định.
- Cơ chế bảo vệ kế thừa sandbox: nếu phiên yêu cầu đang ở trong sandbox, `sessions_spawn` sẽ từ chối các đích có thể chạy ngoài sandbox.
- `subagents.requireAgentId`: khi là true, chặn các lệnh gọi `sessions_spawn` bỏ qua `agentId` (buộc chọn hồ sơ một cách rõ ràng; mặc định: false).
- `subagents.maxConcurrent`: số lượt chạy tác tử con đồng thời tối đa trong quá trình thực thi tác tử phụ. Mặc định: `8`.
- `subagents.maxChildrenPerAgent`: số tác tử con đang hoạt động tối đa mà một phiên tác tử có thể tạo. Mặc định: `5`.
- `subagents.maxSpawnDepth`: độ sâu lồng tối đa khi tạo tác tử phụ (`1`-`5`). Mặc định: `1` (không lồng).
- `subagents.archiveAfterMinutes`: khoảng thời gian trước khi trạng thái tác tử phụ đã hoàn tất được lưu trữ. Mặc định: `60`.

---

## Định tuyến đa tác tử

Chạy nhiều tác tử cô lập trong một Gateway. Xem [Đa tác tử](/vi/concepts/multi-agent).

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

- `type` (tùy chọn): `route` cho định tuyến thông thường (thiếu loại sẽ mặc định là tuyến), `acp` cho các liên kết cuộc hội thoại ACP lâu dài.
- `match.channel` (bắt buộc)
- `match.accountId` (tùy chọn; `*` = bất kỳ tài khoản nào; bỏ qua = tài khoản mặc định)
- `match.peer` (tùy chọn; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (tùy chọn; dành riêng cho kênh)
- `acp` (tùy chọn; chỉ dành cho `type: "acp"`): `{ mode, label, cwd, backend }`

**Thứ tự khớp xác định:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (khớp chính xác, không có đối tác/guild/nhóm)
5. `match.accountId: "*"` (trên toàn kênh)
6. Tác tử mặc định

Trong mỗi tầng, mục `bindings` khớp đầu tiên được ưu tiên.

Đối với các mục `type: "acp"`, OpenClaw phân giải theo danh tính cuộc hội thoại chính xác (`match.channel` + tài khoản + `match.peer.id`) và không sử dụng thứ tự tầng liên kết định tuyến ở trên.

### Hồ sơ truy cập theo từng tác tử

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

Xem [Sandbox và công cụ đa tác tử](/vi/tools/multi-agent-sandbox-tools) để biết chi tiết về thứ tự ưu tiên.

---

## Phiên

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // chính | theo từng đối tác | theo từng kênh-đối tác | theo từng tài khoản-kênh-đối tác
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // hằng ngày | khi không hoạt động
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
      mode: "enforce", // thực thi (mặc định) | cảnh báo
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // khoảng thời gian hoặc false
      maxDiskBytes: "500mb", // ngân sách cứng tùy chọn
      highWaterBytes: "400mb", // mục tiêu dọn dẹp tùy chọn
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // tự động bỏ tập trung sau thời gian không hoạt động mặc định tính bằng giờ (`0` để vô hiệu hóa)
      maxAgeHours: 0, // tuổi tối đa tuyệt đối mặc định tính bằng giờ (`0` để vô hiệu hóa)
    },
    mainKey: "main", // cũ (môi trường chạy luôn sử dụng "main")
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
  - `global`: tất cả người tham gia trong ngữ cảnh kênh dùng chung một phiên (chỉ sử dụng khi chủ đích là chia sẻ ngữ cảnh).
- **`dmScope`**: cách nhóm các tin nhắn trực tiếp.
  - `main`: tất cả tin nhắn trực tiếp dùng chung phiên chính.
  - `per-peer`: tách biệt theo id người gửi trên các kênh.
  - `per-channel-peer`: tách biệt theo kênh + người gửi (khuyến nghị cho hộp thư đến nhiều người dùng).
  - `per-account-channel-peer`: tách biệt theo tài khoản + kênh + người gửi (khuyến nghị khi có nhiều tài khoản).
- **`identityLinks`**: ánh xạ các id chuẩn sang các peer có tiền tố nhà cung cấp để chia sẻ phiên giữa các kênh. Các lệnh ghép kênh như `/dock_discord` sử dụng cùng ánh xạ để chuyển tuyến trả lời của phiên đang hoạt động sang một peer kênh khác đã liên kết; xem [Ghép kênh](/vi/concepts/channel-docking).
- **`reset`**: chính sách đặt lại chính. `none` vô hiệu hóa việc đặt lại tự động và là giá trị mặc định; thay vào đó, Compaction giới hạn ngữ cảnh đang hoạt động. `daily` đặt lại vào `atHour` theo giờ địa phương; `idle` đặt lại sau `idleMinutes`. Khi cấu hình cả hai, điều kiện nào hết hạn trước sẽ được áp dụng. `/new` và `/reset` vẫn khả dụng trong mọi chế độ. Độ mới cho việc đặt lại hằng ngày sử dụng `sessionStartedAt` của hàng phiên; độ mới cho việc đặt lại khi không hoạt động sử dụng `lastInteractionAt`. Các thao tác ghi của sự kiện nền/hệ thống như Heartbeat, đánh thức Cron, thông báo thực thi và ghi sổ Gateway có thể cập nhật `updatedAt`, nhưng chúng không duy trì độ mới cho các phiên hằng ngày/khi không hoạt động.
- **`resetByType`**: ghi đè theo từng loại (`direct`, `group`, `thread`). `dm` cũ được chấp nhận làm bí danh cho `direct`.
- **`resetByChannel`**: ghi đè việc đặt lại theo từng kênh, với khóa là id nhà cung cấp/kênh. Khi kênh của phiên có mục khớp, mục đó hoàn toàn được ưu tiên hơn `resetByType`/`reset` đối với phiên đó. Chỉ sử dụng khi một kênh cần hành vi đặt lại khác với chính sách cấp loại.
- **`mainKey`**: trường cũ. Runtime luôn sử dụng `"main"` cho nhóm trò chuyện trực tiếp chính.
- **`sendPolicy`**: khớp theo `channel`, `chatType` (`direct|group|channel`, với bí danh cũ `dm`), `keyPrefix` hoặc `rawKeyPrefix`. Quy tắc từ chối đầu tiên được ưu tiên.
- **`maintenance`**: các tùy chọn kiểm soát dọn dẹp + lưu giữ kho phiên.
  - `mode`: `enforce` thực hiện dọn dẹp và là giá trị mặc định; `warn` chỉ phát cảnh báo.
  - `pruneAfter`: ngưỡng tuổi cho các mục cũ không còn hoạt động (mặc định `30d`).
  - `maxEntries`: số lượng mục phiên SQLite tối đa (mặc định `500`). Runtime ghi hoạt động dọn dẹp theo lô với một vùng đệm ngưỡng cao nhỏ cho các giới hạn ở quy mô môi trường vận hành; `openclaw sessions cleanup --enforce` áp dụng giới hạn ngay lập tức.
  - Các phiên thăm dò lượt chạy mô hình Gateway ngắn hạn sử dụng thời gian lưu giữ cố định `24h`, nhưng việc dọn dẹp phụ thuộc vào áp lực: nó chỉ loại bỏ các hàng thăm dò lượt chạy mô hình nghiêm ngặt đã cũ khi hoạt động bảo trì mục phiên/áp lực giới hạn đạt ngưỡng. Chỉ các khóa thăm dò tường minh nghiêm ngặt khớp với `agent:*:explicit:model-run-<uuid>` mới đủ điều kiện; các phiên trực tiếp, nhóm, luồng, Cron, hook, Heartbeat, ACP và tác tử phụ thông thường không kế thừa thời gian lưu giữ 24h này. Khi hoạt động dọn dẹp lượt chạy mô hình diễn ra, nó chạy trước việc dọn dẹp mục cũ `pruneAfter` rộng hơn và giới hạn `maxEntries`.
  - `rotateBytes` cũ bị schema hiện tại từ chối; `openclaw doctor --fix` loại bỏ nó khỏi các cấu hình cũ hơn.
  - `resetArchiveRetention`: thời gian lưu giữ dựa trên tuổi cho các bản lưu trữ bản chép lời đã đặt lại/xóa. Theo mặc định, các bản lưu trữ được giữ lại cho đến khi bị loại bỏ do ngân sách ổ đĩa; đặt một khoảng thời gian để bật xóa theo thời gian thực, hoặc `false` để vô hiệu hóa rõ ràng.
  - `maxDiskBytes`: ngân sách ổ đĩa tùy chọn cho thư mục phiên. Trong chế độ `warn`, hệ thống ghi cảnh báo vào nhật ký; trong chế độ `enforce`, hệ thống loại bỏ các thành phần lạ/phiên cũ nhất trước.
  - `highWaterBytes`: mục tiêu tùy chọn sau khi dọn dẹp theo ngân sách. Mặc định là `80%` của `maxDiskBytes`.
- **`threadBindings`**: các giá trị mặc định toàn cục cho tính năng phiên liên kết với luồng.
  - `enabled`: công tắc mặc định chính (nhà cung cấp có thể ghi đè; Discord sử dụng `channels.discord.threadBindings.enabled`)
  - `idleHours`: thời gian tự động bỏ tập trung mặc định khi không hoạt động, tính bằng giờ (`0` vô hiệu hóa; nhà cung cấp có thể ghi đè)
  - `maxAgeHours`: tuổi tối đa tuyệt đối mặc định, tính bằng giờ (`0` vô hiệu hóa; nhà cung cấp có thể ghi đè)
  - `spawnSessions`: điều kiện mặc định để tạo phiên công việc liên kết với luồng từ `sessions_spawn` và các lần tạo luồng ACP. Mặc định là `true` khi liên kết luồng được bật; nhà cung cấp/tài khoản có thể ghi đè.
  - `defaultSpawnContext`: ngữ cảnh tác tử phụ gốc mặc định cho các lần tạo liên kết với luồng (`"fork"` hoặc `"isolated"`). Mặc định là `"fork"`.

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
      debounceMs: 2000, // 0 vô hiệu hóa
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

Thứ tự phân giải (mục cụ thể nhất được ưu tiên): tài khoản → kênh → toàn cục. `""` vô hiệu hóa và dừng chuỗi kế thừa. `"auto"` dẫn xuất `[{identity.name}]`.

**Biến mẫu:**

| Biến              | Mô tả                   | Ví dụ                       |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Tên mô hình ngắn        | `claude-opus-4-6`           |
| `{modelFull}`     | Định danh mô hình đầy đủ | `anthropic/claude-opus-4-6` |
| `{provider}`      | Tên nhà cung cấp        | `anthropic`                 |
| `{thinkingLevel}` | Cấp độ suy luận hiện tại | `high`, `low`, `off`        |
| `{identity.name}` | Tên định danh tác tử    | (giống `"auto"`)          |

Các biến không phân biệt chữ hoa chữ thường. `{think}` là bí danh của `{thinkingLevel}`.

### Phản ứng xác nhận

- Mặc định là `identity.emoji` của tác tử đang hoạt động, nếu không có thì là `"👀"`. Đặt `""` để vô hiệu hóa.
- Ghi đè theo từng kênh: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Thứ tự phân giải: tài khoản → kênh → `messages.ackReaction` → giá trị dự phòng từ định danh.
- Phạm vi: `group-mentions` (mặc định), `group-all`, `direct`, `all` hoặc `off`/`none` (vô hiệu hóa hoàn toàn các phản ứng xác nhận).
- `removeAckAfterReply`: xóa phản ứng xác nhận sau khi trả lời trên các kênh hỗ trợ phản ứng như Slack, Discord, Signal, Telegram, WhatsApp và iMessage.
- `messages.statusReactions.enabled`: bật phản ứng trạng thái vòng đời trên Slack, Discord, Signal, Telegram và WhatsApp.
  Trên Discord, khi không đặt giá trị, các phản ứng trạng thái vẫn được bật nếu phản ứng xác nhận đang hoạt động.
  Trên Slack, Signal, Telegram và WhatsApp, hãy đặt rõ thành `true` để bật phản ứng trạng thái vòng đời.
  Theo mặc định, Slack sử dụng trạng thái luồng trợ lý gốc và các thông báo tải luân phiên để biểu thị tiến trình, đồng thời giữ nguyên phản ứng xác nhận đã cấu hình.
- `messages.statusReactions.emojis`: ghi đè các khóa emoji vòng đời:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` và `stallHard`.
  Telegram chỉ cho phép một tập hợp phản ứng cố định, vì vậy emoji đã cấu hình nhưng không được hỗ trợ sẽ chuyển sang
  biến thể trạng thái được hỗ trợ gần nhất cho cuộc trò chuyện đó.

### Hàng đợi

- `mode`: chiến lược hàng đợi cho các tin nhắn đến trong khi một lượt chạy phiên đang hoạt động. Mặc định: `"steer"`.
  - `steer`: chèn lời nhắc mới vào lượt chạy đang hoạt động.
  - `followup`: chạy lời nhắc mới sau khi lượt chạy đang hoạt động hoàn tất.
  - `collect`: gom nhóm các tin nhắn tương thích và chạy cùng nhau sau đó.
  - `interrupt`: hủy lượt chạy đang hoạt động trước khi bắt đầu lời nhắc mới nhất.
- `debounceMs`: độ trễ trước khi gửi một tin nhắn đã xếp hàng/điều hướng. Mặc định: `500`.
- `cap`: số lượng tin nhắn tối đa trong hàng đợi trước khi áp dụng chính sách loại bỏ. Mặc định: `20`.
- `drop`: chiến lược khi vượt quá giới hạn. `"summarize"` (mặc định) loại bỏ các mục cũ nhất nhưng giữ lại bản tóm tắt cô đọng; `"old"` loại bỏ các mục cũ nhất mà không có bản tóm tắt; `"new"` từ chối mục mới nhất.
- `byChannel`: ghi đè `mode` theo từng kênh, với khóa là id nhà cung cấp.
- `debounceMsByChannel`: ghi đè `debounceMs` theo từng kênh, với khóa là id nhà cung cấp.

### Chống dội tin nhắn đến

Gom các tin nhắn nhanh chỉ chứa văn bản từ cùng một người gửi thành một lượt tác tử duy nhất. Nội dung đa phương tiện/tệp đính kèm được đẩy ngay lập tức. Các lệnh điều khiển bỏ qua cơ chế chống dội. `debounceMs` mặc định: `2000`.

### Các khóa tin nhắn khác

- `channels.whatsapp.messagePrefix`: tiền tố chỉ dành cho WhatsApp, được thêm vào trước tin nhắn người dùng gửi đến trước khi tin nhắn tới runtime tác tử.
- `messages.visibleReplies`: kiểm soát các phản hồi nguồn hiển thị trong cuộc trò chuyện trực tiếp, nhóm và kênh (`"message_tool"` yêu cầu `message(action=send)` để có đầu ra hiển thị; `"automatic"` đăng phản hồi thông thường như trước).
- `messages.usageTemplate` / `messages.responseUsage`: mẫu chân trang `/usage` tùy chỉnh và chế độ sử dụng mặc định cho từng phản hồi (`off | tokens | full`, cùng bí danh cũ `on` cho `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: điều kiện kích hoạt đề cập trong tin nhắn nhóm và kích thước cửa sổ lịch sử.
- `messages.suppressToolErrors`: khi là `true`, ẩn các cảnh báo lỗi công cụ `⚠️` hiển thị cho người dùng (tác tử vẫn thấy lỗi trong ngữ cảnh và có thể thử lại). Mặc định: `false`.

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
- `summaryModel` ghi đè `agents.defaults.model.primary` đối với tính năng tự động tóm tắt.
- `modelOverrides` được bật theo mặc định (`enabled !== false`); `modelOverrides.allowProvider` yêu cầu chủ động bật.
- Khóa API dự phòng về `ELEVENLABS_API_KEY`/`XI_API_KEY` và `OPENAI_API_KEY`.
- Các nhà cung cấp giọng nói đi kèm thuộc quyền sở hữu của plugin. Nếu `plugins.allow` được đặt, hãy bao gồm từng plugin nhà cung cấp TTS muốn sử dụng, chẳng hạn như `microsoft` cho Edge TTS. ID nhà cung cấp cũ `edge` được chấp nhận làm bí danh cho `microsoft`.
- `providers.openai.baseUrl` ghi đè điểm cuối TTS của OpenAI. Thứ tự phân giải là cấu hình, sau đó là `OPENAI_TTS_BASE_URL`, rồi đến `https://api.openai.com/v1`.
- Khi `providers.openai.baseUrl` trỏ đến một điểm cuối không phải OpenAI, OpenClaw coi đó là máy chủ TTS tương thích với OpenAI và nới lỏng việc xác thực mô hình/giọng nói.

---

## Talk

Các giá trị mặc định cho chế độ Talk (macOS/iOS/Android và Control UI trên trình duyệt).

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
      instructions: "Nói với giọng ấm áp và trả lời ngắn gọn.",
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

- `talk.provider` phải khớp với một khóa trong `talk.providers` khi cấu hình nhiều nhà cung cấp Talk.
- Các khóa Talk phẳng cũ (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) chỉ dành cho khả năng tương thích. Chạy `openclaw doctor --fix` để ghi lại cấu hình đã lưu thành `talk.providers.<provider>`.
- ID giọng nói dự phòng về `ELEVENLABS_VOICE_ID` hoặc `SAG_VOICE_ID` (hành vi của ứng dụng Talk trên macOS).
- `providers.*.apiKey` chấp nhận chuỗi văn bản thuần hoặc đối tượng SecretRef.
- Cơ chế dự phòng `ELEVENLABS_API_KEY` chỉ áp dụng khi chưa cấu hình khóa API Talk.
- `providers.*.voiceAliases` cho phép các chỉ thị Talk sử dụng tên thân thiện.
- `providers.mlx.modelId` chọn kho lưu trữ Hugging Face mà trình trợ giúp MLX cục bộ trên macOS sử dụng. Nếu bỏ qua, macOS sử dụng `mlx-community/Soprano-80M-bf16`.
- Việc phát MLX trên macOS chạy qua trình trợ giúp `openclaw-mlx-tts` đi kèm khi có, hoặc một tệp thực thi trên `PATH`; `OPENCLAW_MLX_TTS_BIN` ghi đè đường dẫn trình trợ giúp để phục vụ phát triển.
- `consultThinkingLevel` kiểm soát mức độ suy nghĩ cho toàn bộ lượt chạy tác tử OpenClaw đứng sau các lệnh gọi `openclaw_agent_consult` theo thời gian thực của Talk trong Control UI. Để trống nhằm duy trì hành vi phiên/mô hình thông thường.
- `consultFastMode` đặt một ghi đè chế độ nhanh dùng một lần cho các lượt tham vấn theo thời gian thực của Talk trong Control UI mà không thay đổi thiết lập chế độ nhanh thông thường của phiên.
- `speechLocale` đặt ID ngôn ngữ BCP 47 được Android, iOS và macOS sử dụng để nhận dạng giọng nói Talk. Android cũng sử dụng thành phần ngôn ngữ của ID này để định hướng việc phiên âm đầu vào theo thời gian thực. Để trống nhằm sử dụng giá trị mặc định của thiết bị.
- `silenceTimeoutMs` kiểm soát khoảng thời gian chế độ Talk chờ sau khi người dùng im lặng trước khi gửi bản phiên âm. Để trống sẽ giữ khoảng tạm dừng mặc định của nền tảng (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` nối thêm các chỉ dẫn hệ thống dành cho nhà cung cấp vào lời nhắc thời gian thực tích hợp sẵn của OpenClaw, nhờ đó có thể cấu hình phong cách giọng nói mà không làm mất hướng dẫn `openclaw_agent_consult` mặc định.
- `realtime.vadThreshold` đặt ngưỡng hoạt động giọng nói của nhà cung cấp từ `0` (nhạy nhất) đến `1` (ít nhạy nhất). Để trống sẽ giữ giá trị mặc định của nhà cung cấp.
- `realtime.silenceDurationMs` đặt khoảng im lặng là số nguyên dương trước khi nhà cung cấp xác nhận một lượt người dùng theo thời gian thực. Để trống sẽ giữ giá trị mặc định của nhà cung cấp.
- `realtime.prefixPaddingMs` đặt lượng âm thanh là số nguyên không âm được giữ lại trước khi bắt đầu phát hiện lời nói. Để trống sẽ giữ giá trị mặc định của nhà cung cấp.
- `realtime.reasoningEffort` đặt mức suy luận dành riêng cho nhà cung cấp đối với các phiên theo thời gian thực. Để trống sẽ giữ giá trị mặc định của nhà cung cấp.
- `realtime.consultRouting`: `"provider-direct"` (mặc định) giữ nguyên câu trả lời trực tiếp từ nhà cung cấp khi nhà cung cấp thời gian thực tạo bản phiên âm cuối cùng của người dùng mà không có `openclaw_agent_consult`. Thay vào đó, `"force-agent-consult"` định tuyến yêu cầu đã hoàn tất qua OpenClaw.

---

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference) — tất cả các khóa cấu hình khác
- [Cấu hình](/vi/gateway/configuration) — các tác vụ phổ biến và thiết lập nhanh
- [Ví dụ cấu hình](/vi/gateway/configuration-examples)
