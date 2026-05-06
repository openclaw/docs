---
read_when:
    - Bạn muốn biết những tính năng nào có thể gọi các API trả phí
    - Bạn cần rà soát các khóa, chi phí và khả năng hiển thị mức sử dụng
    - Bạn đang giải thích báo cáo chi phí của /status hoặc /usage
summary: Kiểm tra những gì có thể phát sinh chi phí, khóa nào được sử dụng và cách xem mức sử dụng
title: Mức sử dụng và chi phí API
x-i18n:
    generated_at: "2026-05-06T09:28:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Tài liệu này liệt kê **các tính năng có thể gọi khóa API** và nơi chi phí của chúng xuất hiện. Tài liệu tập trung vào
các tính năng OpenClaw có thể tạo ra mức sử dụng nhà cung cấp hoặc các lệnh gọi API trả phí.

## Nơi chi phí xuất hiện (trò chuyện + CLI)

**Ảnh chụp chi phí theo phiên**

- `/status` hiển thị mô hình phiên hiện tại, mức sử dụng ngữ cảnh và token của phản hồi gần nhất.
- Nếu mô hình dùng **xác thực bằng khóa API**, `/status` cũng hiển thị **chi phí ước tính** cho phản hồi gần nhất.
- Nếu siêu dữ liệu phiên trực tiếp còn ít, `/status` có thể khôi phục bộ đếm token/bộ nhớ đệm
  và nhãn mô hình runtime đang hoạt động từ mục mức sử dụng transcript mới nhất.
  Các giá trị trực tiếp khác 0 hiện có vẫn được ưu tiên, và tổng transcript
  có kích thước tương đương prompt có thể thắng khi tổng đã lưu bị thiếu hoặc nhỏ hơn.

**Chân trang chi phí theo tin nhắn**

- `/usage full` thêm chân trang mức sử dụng vào mọi phản hồi, bao gồm **chi phí ước tính** (chỉ khóa API).
- `/usage tokens` chỉ hiển thị token; các luồng OAuth/token kiểu đăng ký và CLI ẩn chi phí bằng đô la.
- Ghi chú Gemini CLI: khi CLI trả về đầu ra JSON, OpenClaw đọc mức sử dụng từ
  `stats`, chuẩn hóa `stats.cached` thành `cacheRead`, và suy ra token đầu vào
  từ `stats.input_tokens - stats.cached` khi cần.

Ghi chú Anthropic: nhân viên Anthropic đã cho chúng tôi biết rằng mức sử dụng Claude CLI kiểu OpenClaw
được cho phép trở lại, vì vậy OpenClaw xem việc tái sử dụng Claude CLI và mức sử dụng `claude -p`
là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới.
Anthropic vẫn không cung cấp ước tính đô la theo từng tin nhắn mà OpenClaw có thể
hiển thị trong `/usage full`.

**Cửa sổ mức sử dụng CLI (hạn mức nhà cung cấp)**

- `openclaw status --usage` và `openclaw channels list` hiển thị **cửa sổ mức sử dụng** của nhà cung cấp
  (ảnh chụp hạn mức, không phải chi phí theo tin nhắn).
- Đầu ra cho người dùng được chuẩn hóa thành `X% left` trên các nhà cung cấp.
- Các nhà cung cấp cửa sổ mức sử dụng hiện tại: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi và z.ai.
- Ghi chú MiniMax: các trường thô `usage_percent` / `usagePercent` của họ nghĩa là hạn mức còn lại,
  vì vậy OpenClaw đảo ngược chúng trước khi hiển thị. Các trường dựa trên số lượng vẫn được ưu tiên
  khi có. Nếu nhà cung cấp trả về `model_remains`, OpenClaw ưu tiên mục mô hình trò chuyện,
  suy ra nhãn cửa sổ từ dấu thời gian khi cần, và
  đưa tên mô hình vào nhãn gói.
- Xác thực mức sử dụng cho các cửa sổ hạn mức đó đến từ các hook dành riêng cho nhà cung cấp khi
  có sẵn; nếu không, OpenClaw quay về dùng thông tin đăng nhập OAuth/khóa API khớp
  từ hồ sơ xác thực, env hoặc cấu hình.

Xem [Mức sử dụng token & chi phí](/vi/reference/token-use) để biết chi tiết và ví dụ.

## Cách khóa được phát hiện

OpenClaw có thể lấy thông tin đăng nhập từ:

- **Hồ sơ xác thực** (theo từng agent, được lưu trong `auth-profiles.json`).
- **Biến môi trường** (ví dụ `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Cấu hình** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) có thể xuất khóa sang env của tiến trình skill.

## Các tính năng có thể tiêu khóa

### 1) Phản hồi mô hình lõi (trò chuyện + công cụ)

Mỗi phản hồi hoặc lệnh gọi công cụ sử dụng **nhà cung cấp mô hình hiện tại** (OpenAI, Anthropic, v.v.). Đây là
nguồn chính của mức sử dụng và chi phí.

Điều này cũng bao gồm các nhà cung cấp lưu trữ kiểu đăng ký vẫn tính phí bên ngoài
giao diện cục bộ của OpenClaw, chẳng hạn như **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, và
đường dẫn đăng nhập Claude của OpenClaw qua Anthropic khi bật **Extra Usage**.

Xem [Mô hình](/vi/providers/models) để biết cấu hình giá và [Mức sử dụng token & chi phí](/vi/reference/token-use) để biết cách hiển thị.

### 2) Hiểu phương tiện (âm thanh/hình ảnh/video)

Phương tiện đầu vào có thể được tóm tắt/phiên âm trước khi phản hồi chạy. Việc này dùng API mô hình/nhà cung cấp.

- Âm thanh: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Hình ảnh: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Xem [Hiểu phương tiện](/vi/nodes/media-understanding).

### 3) Tạo hình ảnh và video

Các khả năng tạo dùng chung cũng có thể tiêu khóa nhà cung cấp:

- Tạo hình ảnh: OpenAI / Google / DeepInfra / fal / MiniMax
- Tạo video: DeepInfra / Qwen

Tạo hình ảnh có thể suy ra mặc định nhà cung cấp có xác thực hỗ trợ khi
`agents.defaults.imageGenerationModel` chưa được đặt. Tạo video hiện
yêu cầu `agents.defaults.videoGenerationModel` rõ ràng, chẳng hạn như
`qwen/wan2.6-t2v`.

Xem [Tạo hình ảnh](/vi/tools/image-generation), [Qwen Cloud](/vi/providers/qwen),
và [Mô hình](/vi/concepts/models).

### 4) Nhúng bộ nhớ + tìm kiếm ngữ nghĩa

Tìm kiếm bộ nhớ ngữ nghĩa dùng **API embedding** khi được cấu hình cho nhà cung cấp từ xa:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "deepinfra"` → embedding DeepInfra
- `memorySearch.provider = "lmstudio"` → embedding LM Studio (cục bộ/tự lưu trữ)
- `memorySearch.provider = "ollama"` → embedding Ollama (cục bộ/tự lưu trữ; thường không có tính phí API lưu trữ)
- Tùy chọn dự phòng sang nhà cung cấp từ xa nếu embedding cục bộ thất bại

Bạn có thể giữ cục bộ bằng `memorySearch.provider = "local"` (không sử dụng API).

Xem [Bộ nhớ](/vi/concepts/memory).

### 5) Công cụ tìm kiếm web

`web_search` có thể phát sinh phí sử dụng tùy vào nhà cung cấp của bạn:

- **Brave Search API**: `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` hoặc `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` hoặc `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, hoặc `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, hoặc `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: không cần khóa cho máy chủ Ollama cục bộ đã đăng nhập và có thể truy cập; tìm kiếm trực tiếp qua `https://ollama.com` dùng `OLLAMA_API_KEY`, và máy chủ được bảo vệ bằng xác thực có thể tái sử dụng xác thực bearer của nhà cung cấp Ollama thông thường
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, hoặc `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` hoặc `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: dự phòng không cần khóa (không tính phí API, nhưng không chính thức và dựa trên HTML)
- **SearXNG**: `SEARXNG_BASE_URL` hoặc `plugins.entries.searxng.config.webSearch.baseUrl` (không cần khóa/tự lưu trữ; không tính phí API lưu trữ)

Các đường dẫn nhà cung cấp `tools.web.search.*` cũ vẫn được tải qua shim tương thích tạm thời, nhưng chúng không còn là bề mặt cấu hình được khuyến nghị.

**Tín dụng miễn phí Brave Search:** Mỗi gói Brave bao gồm \$5/tháng tín dụng miễn phí
được gia hạn. Gói Search có giá \$5 cho mỗi 1.000 yêu cầu, vì vậy khoản tín dụng bao phủ
1.000 yêu cầu/tháng miễn phí. Đặt giới hạn mức sử dụng của bạn trong bảng điều khiển Brave
để tránh khoản phí ngoài dự kiến.

Xem [Công cụ web](/vi/tools/web).

### 5) Công cụ tải web (Firecrawl)

`web_fetch` có thể gọi **Firecrawl** khi có khóa API:

- `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webFetch.apiKey`

Nếu Firecrawl chưa được cấu hình, công cụ sẽ quay về dùng fetch trực tiếp cộng với Plugin `web-readability` đi kèm (không có API trả phí). Tắt `plugins.entries.web-readability.enabled` để bỏ qua trích xuất Readability cục bộ.

Xem [Công cụ web](/vi/tools/web).

### 6) Ảnh chụp mức sử dụng nhà cung cấp (trạng thái/sức khỏe)

Một số lệnh trạng thái gọi **endpoint mức sử dụng của nhà cung cấp** để hiển thị cửa sổ hạn mức hoặc sức khỏe xác thực.
Đây thường là các lệnh gọi lưu lượng thấp nhưng vẫn chạm tới API của nhà cung cấp:

- `openclaw status --usage`
- `openclaw models status --json`

Xem [CLI mô hình](/vi/cli/models).

### 7) Tóm tắt biện pháp bảo vệ Compaction

Biện pháp bảo vệ Compaction có thể tóm tắt lịch sử phiên bằng **mô hình hiện tại**, điều này
gọi API nhà cung cấp khi chạy.

Xem [Quản lý phiên + Compaction](/vi/reference/session-management-compaction).

### 8) Quét / thăm dò mô hình

`openclaw models scan` có thể thăm dò các mô hình OpenRouter và dùng `OPENROUTER_API_KEY` khi
bật thăm dò.

Xem [CLI mô hình](/vi/cli/models).

### 9) Talk (giọng nói)

Chế độ Talk có thể gọi **ElevenLabs** khi được cấu hình:

- `ELEVENLABS_API_KEY` hoặc `talk.providers.elevenlabs.apiKey`

Xem [Chế độ Talk](/vi/nodes/talk).

### 10) Skills (API bên thứ ba)

Skills có thể lưu `apiKey` trong `skills.entries.<name>.apiKey`. Nếu một skill dùng khóa đó cho
API bên ngoài, nó có thể phát sinh chi phí theo nhà cung cấp của skill.

Xem [Skills](/vi/tools/skills).

## Liên quan

- [Mức sử dụng token và chi phí](/vi/reference/token-use)
- [Lưu bộ nhớ đệm prompt](/vi/reference/prompt-caching)
- [Theo dõi mức sử dụng](/vi/concepts/usage-tracking)
