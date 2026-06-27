---
read_when:
    - Bạn muốn hiểu những tính năng nào có thể gọi các API trả phí
    - Bạn cần kiểm tra khóa, chi phí và khả năng hiển thị mức sử dụng
    - Bạn đang giải thích báo cáo chi phí của /status hoặc /usage
summary: Kiểm tra những gì có thể tiêu tiền, những khóa nào được dùng và cách xem mức sử dụng
title: Cách sử dụng API và chi phí
x-i18n:
    generated_at: "2026-06-27T18:07:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Tài liệu này liệt kê **các tính năng có thể gọi khóa API** và nơi chi phí của chúng xuất hiện. Tài liệu tập trung vào
các tính năng OpenClaw có thể tạo mức sử dụng nhà cung cấp hoặc các lệnh gọi API trả phí.

## Nơi chi phí xuất hiện (chat + CLI)

**Ảnh chụp chi phí theo phiên**

- `/status` hiển thị mô hình của phiên hiện tại, mức sử dụng ngữ cảnh và token của phản hồi gần nhất.
- Nếu OpenClaw có siêu dữ liệu sử dụng và giá cục bộ cho mô hình đang hoạt động,
  `/status` cũng hiển thị **chi phí ước tính** cho phản hồi gần nhất. Điều này có thể bao gồm
  các nhà cung cấp không dùng khóa API nhưng có giá rõ ràng, chẳng hạn như các mô hình Bedrock `aws-sdk`.
- Nếu siêu dữ liệu phiên trực tiếp còn thưa, `/status` có thể khôi phục các bộ đếm token/cache
  và nhãn mô hình runtime đang hoạt động từ mục sử dụng transcript mới nhất.
  Các giá trị trực tiếp khác 0 hiện có vẫn được ưu tiên, và tổng transcript có kích thước theo prompt
  có thể thắng khi tổng đã lưu bị thiếu hoặc nhỏ hơn.

**Chân trang chi phí theo tin nhắn**

- `/usage full` thêm chân trang sử dụng vào mọi phản hồi, bao gồm **chi phí ước tính**
  khi giá cục bộ được cấu hình cho mô hình đang hoạt động và có siêu dữ liệu sử dụng.
- `/usage tokens` chỉ hiển thị token; các luồng OAuth/token và CLI kiểu thuê bao
  vẫn chỉ hiển thị token trừ khi runtime đó cung cấp siêu dữ liệu sử dụng tương thích
  và đã cấu hình giá cục bộ rõ ràng.
- Ghi chú Gemini CLI: đầu ra `stream-json` mặc định và các ghi đè JSON cũ
  đều đọc mức sử dụng từ `stats`, chuẩn hóa `stats.cached` thành `cacheRead`, và
  suy ra token đầu vào từ `stats.input_tokens - stats.cached` khi cần.

Ghi chú Anthropic: nhân viên Anthropic đã nói với chúng tôi rằng việc sử dụng Claude CLI kiểu OpenClaw
được cho phép trở lại, vì vậy OpenClaw coi việc tái sử dụng Claude CLI và sử dụng `claude -p` là
được chấp thuận cho tích hợp này, trừ khi Anthropic công bố chính sách mới.
Anthropic vẫn không cung cấp ước tính đô la theo từng tin nhắn mà OpenClaw có thể
hiển thị trong `/usage full`.

**Cửa sổ sử dụng CLI (hạn mức nhà cung cấp)**

- `openclaw status --usage` và `openclaw channels list` hiển thị **cửa sổ sử dụng** của nhà cung cấp
  (ảnh chụp hạn mức, không phải chi phí theo tin nhắn).
- Đầu ra cho người dùng được chuẩn hóa thành `X% left` trên các nhà cung cấp.
- Các nhà cung cấp cửa sổ sử dụng hiện tại: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi và z.ai.
- Ghi chú MiniMax: các trường thô `usage_percent` / `usagePercent` của nó có nghĩa là hạn mức
  còn lại, vì vậy OpenClaw đảo ngược chúng trước khi hiển thị. Các trường dựa trên số lượng vẫn thắng
  khi có mặt. Nếu nhà cung cấp trả về `model_remains`, OpenClaw ưu tiên mục mô hình chat,
  suy ra nhãn cửa sổ từ dấu thời gian khi cần, và
  đưa tên mô hình vào nhãn gói.
- Xác thực mức sử dụng cho các cửa sổ hạn mức đó đến từ các hook riêng của nhà cung cấp khi
  có sẵn; nếu không, OpenClaw quay về khớp thông tin đăng nhập OAuth/khóa API
  từ hồ sơ xác thực, env hoặc cấu hình.

Xem [Mức sử dụng token & chi phí](/vi/reference/token-use) để biết chi tiết và ví dụ.

## Cách phát hiện khóa

OpenClaw có thể nhận thông tin đăng nhập từ:

- **Hồ sơ xác thực** (theo từng agent, lưu trong `auth-profiles.json`).
- **Biến môi trường** (ví dụ `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Cấu hình** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`) có thể xuất khóa vào env của tiến trình skill.

## Các tính năng có thể tiêu khóa

### 1) Phản hồi mô hình lõi (chat + công cụ)

Mọi phản hồi hoặc lệnh gọi công cụ đều dùng **nhà cung cấp mô hình hiện tại** (OpenAI, Anthropic, v.v.). Đây là
nguồn chính của mức sử dụng và chi phí.

Điều này cũng bao gồm các nhà cung cấp lưu trữ kiểu thuê bao vẫn tính phí bên ngoài
UI cục bộ của OpenClaw, chẳng hạn như **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan**, và
đường dẫn đăng nhập Claude của OpenClaw qua Anthropic khi bật **Extra Usage**.

Xem [Mô hình](/vi/providers/models) để biết cấu hình giá và [Mức sử dụng token & chi phí](/vi/reference/token-use) để biết cách hiển thị.

### 2) Hiểu phương tiện (âm thanh/hình ảnh/video)

Phương tiện đầu vào có thể được tóm tắt/chuyển lời nói thành văn bản trước khi phản hồi chạy. Điều này sử dụng API mô hình/nhà cung cấp.

- Âm thanh: OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral.
- Hình ảnh: OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Xem [Hiểu phương tiện](/vi/nodes/media-understanding).

### 3) Tạo hình ảnh và video

Các năng lực tạo nội dung dùng chung cũng có thể tiêu khóa nhà cung cấp:

- Tạo hình ảnh: OpenAI / Google / DeepInfra / fal / MiniMax
- Tạo video: DeepInfra / Qwen

Tạo hình ảnh có thể suy ra mặc định nhà cung cấp được hỗ trợ bằng xác thực khi
`agents.defaults.imageGenerationModel` chưa được đặt. Tạo video hiện
yêu cầu `agents.defaults.videoGenerationModel` rõ ràng, chẳng hạn như
`qwen/wan2.6-t2v`.

Xem [Tạo hình ảnh](/vi/tools/image-generation), [Qwen Cloud](/vi/providers/qwen),
và [Mô hình](/vi/concepts/models).

### 4) Embedding bộ nhớ + tìm kiếm ngữ nghĩa

Tìm kiếm bộ nhớ ngữ nghĩa sử dụng **API embedding** khi được cấu hình cho nhà cung cấp từ xa:

- `memorySearch.provider = "openai"` → embedding OpenAI
- `memorySearch.provider = "gemini"` → embedding Gemini
- `memorySearch.provider = "voyage"` → embedding Voyage
- `memorySearch.provider = "mistral"` → embedding Mistral
- `memorySearch.provider = "deepinfra"` → embedding DeepInfra
- `memorySearch.provider = "lmstudio"` → embedding LM Studio (cục bộ/tự lưu trữ)
- `memorySearch.provider = "ollama"` → embedding Ollama (cục bộ/tự lưu trữ; thường không có tính phí API lưu trữ)
- Fallback tùy chọn sang nhà cung cấp từ xa nếu embedding cục bộ thất bại

Bạn có thể giữ nó cục bộ với `memorySearch.provider = "local"` (không sử dụng API).

Xem [Bộ nhớ](/vi/concepts/memory).

### 5) Công cụ tìm kiếm web

`web_search` có thể phát sinh phí sử dụng tùy theo nhà cung cấp của bạn:

- **Brave Search API**: `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` hoặc `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` hoặc `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: hồ sơ OAuth xAI, `XAI_API_KEY`, hoặc `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY`, hoặc `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY`, hoặc `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: không cần khóa đối với một máy chủ Ollama cục bộ đã đăng nhập và có thể truy cập; tìm kiếm trực tiếp `https://ollama.com` dùng `OLLAMA_API_KEY`, và các máy chủ được bảo vệ bằng xác thực có thể tái sử dụng xác thực bearer của nhà cung cấp Ollama thông thường
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY`, hoặc `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` hoặc `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: nhà cung cấp không cần khóa khi được chọn rõ ràng (không tính phí API, nhưng không chính thức và dựa trên HTML)
- **SearXNG**: `SEARXNG_BASE_URL` hoặc `plugins.entries.searxng.config.webSearch.baseUrl` (không cần khóa/tự lưu trữ; không tính phí API lưu trữ)

Các đường dẫn nhà cung cấp `tools.web.search.*` cũ vẫn tải qua shim tương thích tạm thời, nhưng chúng không còn là bề mặt cấu hình được khuyến nghị.

**Tín dụng miễn phí của Brave Search:** Mỗi gói Brave bao gồm \$5/tháng tín dụng miễn phí
được gia hạn. Gói Search có giá \$5 cho mỗi 1.000 yêu cầu, vì vậy tín dụng này bao phủ
1.000 yêu cầu/tháng miễn phí. Đặt giới hạn sử dụng của bạn trong bảng điều khiển Brave
để tránh phát sinh phí ngoài dự kiến.

Xem [Công cụ web](/vi/tools/web).

### 5) Công cụ fetch web (Firecrawl)

`web_fetch` có thể gọi **Firecrawl** với quyền truy cập khởi đầu không cần khóa. Thêm khóa API
để có giới hạn cao hơn:

- `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webFetch.apiKey`

Nếu Firecrawl chưa được cấu hình, công cụ quay về fetch trực tiếp cộng với plugin `web-readability` đi kèm (không có API trả phí). Tắt `plugins.entries.web-readability.enabled` để bỏ qua trích xuất Readability cục bộ.

Xem [Công cụ web](/vi/tools/web).

### 6) Ảnh chụp mức sử dụng nhà cung cấp (trạng thái/sức khỏe)

Một số lệnh trạng thái gọi **điểm cuối mức sử dụng của nhà cung cấp** để hiển thị cửa sổ hạn mức hoặc sức khỏe xác thực.
Đây thường là các lệnh gọi khối lượng thấp nhưng vẫn chạm tới API nhà cung cấp:

- `openclaw status --usage`
- `openclaw models status --json`

Xem [CLI mô hình](/vi/cli/models).

### 7) Tóm tắt bảo vệ Compaction

Bảo vệ Compaction có thể tóm tắt lịch sử phiên bằng **mô hình hiện tại**, việc này
gọi API nhà cung cấp khi chạy.

Xem [Quản lý phiên + Compaction](/vi/reference/session-management-compaction).

### 8) Quét / thăm dò mô hình

`openclaw models scan` có thể thăm dò các mô hình OpenRouter và dùng `OPENROUTER_API_KEY` khi
bật thăm dò.

Xem [CLI mô hình](/vi/cli/models).

### 9) Talk (lời nói)

Chế độ Talk có thể gọi **ElevenLabs** khi được cấu hình:

- `ELEVENLABS_API_KEY` hoặc `talk.providers.elevenlabs.apiKey`

Xem [Chế độ Talk](/vi/nodes/talk).

### 10) Skills (API bên thứ ba)

Skills có thể lưu `apiKey` trong `skills.entries.<name>.apiKey`. Nếu một skill dùng khóa đó cho API bên ngoài,
nó có thể phát sinh chi phí theo nhà cung cấp của skill.

Xem [Skills](/vi/tools/skills).

## Liên quan

- [Mức sử dụng token và chi phí](/vi/reference/token-use)
- [Bộ nhớ đệm prompt](/vi/reference/prompt-caching)
- [Theo dõi mức sử dụng](/vi/concepts/usage-tracking)
