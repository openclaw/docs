---
read_when:
    - Bạn muốn hiểu những tính năng nào có thể gọi các API trả phí
    - Bạn cần kiểm tra các khóa, chi phí và khả năng theo dõi mức sử dụng
    - Bạn đang giải thích việc báo cáo chi phí của `/status` hoặc `/usage`
summary: Kiểm tra những thành phần có thể phát sinh chi phí, các khóa được sử dụng và cách xem mức sử dụng
title: Mức sử dụng API và chi phí
x-i18n:
    generated_at: "2026-07-12T08:20:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

Bản đồ các tính năng của OpenClaw có thể gọi API của nhà cung cấp trả phí, nơi mỗi tính năng đọc thông tin xác thực và nơi chi phí phát sinh được hiển thị.

## Nơi hiển thị chi phí

**`/status`** (ảnh chụp nhanh theo phiên)

- Hiển thị mô hình của phiên hiện tại, mức sử dụng ngữ cảnh và số token của phản hồi gần nhất.
- Thêm **chi phí ước tính** cho phản hồi gần nhất khi OpenClaw có siêu dữ liệu sử dụng và giá cục bộ cho mô hình đang hoạt động, bao gồm các nhà cung cấp không dùng khóa API có định giá rõ ràng như các mô hình Bedrock `aws-sdk`.
- Nếu ảnh chụp nhanh của phiên trực tiếp có ít dữ liệu, `/status` khôi phục các bộ đếm token/bộ nhớ đệm và nhãn mô hình đang hoạt động từ mục sử dụng mới nhất trong bản chép lại. Các giá trị trực tiếp khác 0 hiện có được ưu tiên hơn dữ liệu bản chép lại; tổng trong bản chép lại có kích thước tương ứng với lời nhắc vẫn có thể được ưu tiên khi tổng đã lưu bị thiếu hoặc nhỏ hơn.

**`/usage`** (chân trang theo tin nhắn)

- `/usage full` nối thêm chân trang sử dụng vào mọi phản hồi, bao gồm **chi phí ước tính** khi giá cục bộ được cấu hình và có siêu dữ liệu sử dụng.
- `/usage tokens` chỉ hiển thị token. Các thời gian chạy OAuth/token kiểu thuê bao và CLI chỉ hiển thị token, trừ khi chúng cung cấp siêu dữ liệu sử dụng tương thích cùng với giá cục bộ rõ ràng.
- `/usage cost` in bản tóm tắt chi phí cục bộ; `/usage off` tắt chân trang.
- Lưu ý về Gemini CLI: cả đầu ra `stream-json` và `json` cũ đều chứa dữ liệu sử dụng trong `stats`. OpenClaw chuẩn hóa `stats.cached` thành `cacheRead` và suy ra số token đầu vào từ `stats.input_tokens - stats.cached` khi cần.

**Giao diện điều khiển → Mức sử dụng** (phân tích trên nhiều phiên)

- Hiển thị tổng số token và chi phí ước tính được suy ra từ bản chép lại trong khoảng ngày đã chọn, với phân tích chi tiết theo nhà cung cấp, mô hình, tác nhân, kênh và loại token.
- So sánh các khoảng thời gian theo lịch ngắn hơn kết thúc vào ngày cuối của khoảng đã chọn. Các ngày bị thiếu được tính là ngày theo lịch có mức sử dụng bằng 0; chúng không bị bỏ qua để tạo khoảng thời gian dày đặc hơn.
- Gắn nhãn trực tiếp cho thang đo biểu đồ hằng ngày. Huy hiệu `√` cho biết phép nén căn bậc hai đang giúp các ngày có mức sử dụng thấp vẫn hiển thị rõ.
- Các tổng này mô tả lịch sử phiên cục bộ hiện có, không phải hóa đơn của nhà cung cấp hay sổ cái thanh toán trọn đời. Giao diện cảnh báo khi một số mục bị thiếu thông tin giá.

**Khoảng sử dụng CLI** (hạn mức nhà cung cấp, không phải chi phí theo tin nhắn)

- `openclaw status --usage` và `openclaw channels list` hiển thị **khoảng sử dụng** của nhà cung cấp dưới dạng `X% left`.
- Các nhà cung cấp khoảng sử dụng hiện tại: Anthropic, ClawRouter, DeepSeek, GitHub Copilot, Gemini CLI, MiniMax, OpenAI (bao gồm xác thực OAuth/token của ChatGPT/Codex), Xiaomi và z.ai. Xem [CLI mô hình](/vi/cli/models) và [CLI kênh](/vi/cli/channels) để biết danh sách đầy đủ các nhà cung cấp/cờ.
- Các trường thô `usage_percent` / `usagePercent` của MiniMax báo cáo hạn mức còn lại, vì vậy OpenClaw đảo ngược chúng; các trường dựa trên số lượng được ưu tiên khi có. Nếu phản hồi chứa mảng `model_remains`, OpenClaw chọn mục mô hình trò chuyện, suy ra nhãn khoảng thời gian từ dấu thời gian khi cần và đưa tên mô hình vào nhãn gói.
- Thông tin xác thực sử dụng đến từ các hook dành riêng cho nhà cung cấp khi có; nếu không, OpenClaw chuyển sang đối chiếu thông tin xác thực OAuth/khóa API từ hồ sơ xác thực, biến môi trường hoặc cấu hình.

Xem [Mức sử dụng token và chi phí](/vi/reference/token-use) để biết các ví dụ chi tiết.

<Note>
Anthropic đã xác nhận rằng việc tái sử dụng Claude CLI (bao gồm `claude -p`) là một mô hình tích hợp được chấp thuận, trừ khi họ công bố chính sách mới. Anthropic không cung cấp ước tính số tiền theo từng tin nhắn, vì vậy `/usage full` không thể hiển thị chi phí cho việc sử dụng Claude CLI.
</Note>

## Cách tìm khóa

- **Hồ sơ xác thực**: theo từng tác nhân, được lưu trong `auth-profiles.json`.
- **Biến môi trường**: ví dụ `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`.
- **Cấu hình**: `models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`, `plugins.entries.firecrawl.config.webFetch.apiKey`, `agents.defaults.memorySearch.*`, `talk.providers.*.apiKey`.
- **Skills**: `skills.entries.<name>.apiKey`, có thể xuất khóa sang môi trường tiến trình của Skills.

## Các tính năng có thể sử dụng khóa và phát sinh chi phí

### Phản hồi mô hình cốt lõi (trò chuyện + công cụ)

Mọi phản hồi hoặc lệnh gọi công cụ đều chạy trên nhà cung cấp mô hình hiện tại. Đây là nguồn sử dụng và chi phí chính, bao gồm các gói lưu trữ kiểu thuê bao tính phí bên ngoài giao diện cục bộ của OpenClaw: OpenAI Codex, Alibaba Cloud Model Studio Coding Plan, MiniMax Coding Plan, Z.AI/GLM Coding Plan và quy trình đăng nhập Claude của Anthropic khi bật Extra Usage.

Xem [Mô hình](/vi/providers/models) để biết cấu hình giá và [Mức sử dụng token và chi phí](/vi/reference/token-use) để biết cách hiển thị.

### Hiểu nội dung phương tiện (âm thanh/hình ảnh/video)

Phương tiện đầu vào có thể được tóm tắt hoặc phiên âm thông qua API của nhà cung cấp trước khi quy trình phản hồi chạy. Khả năng hỗ trợ nhà cung cấp được đăng ký theo từng Plugin và thay đổi khi có thêm Plugin; xem [Hiểu nội dung phương tiện](/vi/nodes/media-understanding) để biết danh sách và cấu hình hiện tại.

### Tạo hình ảnh và video

`image_generate` và `video_generate` định tuyến đến bất kỳ nhà cung cấp đã cấu hình nào hiện có. Tính năng tạo hình ảnh có thể suy ra nhà cung cấp mặc định có hỗ trợ xác thực khi chưa đặt `agents.defaults.imageGenerationModel`; tính năng tạo video yêu cầu đặt rõ ràng `agents.defaults.videoGenerationModel` (ví dụ `qwen/wan2.6-t2v`).

Xem [Tạo hình ảnh](/vi/tools/image-generation) và [Tạo video](/vi/tools/video-generation) để biết danh sách nhà cung cấp hiện tại.

### Nhúng bộ nhớ và tìm kiếm ngữ nghĩa

Tìm kiếm bộ nhớ ngữ nghĩa sử dụng API nhúng khi `agents.defaults.memorySearch.provider` chỉ định một bộ điều hợp từ xa (ví dụ `openai`, `gemini`, `voyage`, `mistral`, `deepinfra`, `github-copilot`, `amazon-bedrock`). `memorySearch.provider = "lmstudio"` hoặc `"ollama"` chạy trên máy chủ cục bộ/tự lưu trữ và thường không phát sinh phí dịch vụ lưu trữ. `memorySearch.provider = "local"` giữ mọi thứ trên thiết bị mà không sử dụng API. Có thể dùng nhà cung cấp `memorySearch.fallback` tùy chọn để xử lý lỗi nhúng cục bộ.

Xem [Bộ nhớ](/vi/concepts/memory).

### Công cụ tìm kiếm web

`web_search` có thể phát sinh phí sử dụng tùy thuộc vào nhà cung cấp đã chọn. Mỗi nhà cung cấp đọc khóa trước tiên từ một biến môi trường, sau đó từ `plugins.entries.<id>.config.webSearch.apiKey`:

| Nhà cung cấp           | Biến môi trường                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                                            |
| DuckDuckGo             | không cần khóa; không chính thức, dựa trên HTML, không tính phí                                                                                                                            |
| Exa                    | `EXA_API_KEY`                                                                                                                                                                              |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                                        |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                                           |
| Grok (xAI)             | hồ sơ OAuth xAI hoặc `XAI_API_KEY`                                                                                                                                                         |
| Kimi (Moonshot)        | `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY`                                                                                                                                                     |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` hoặc `MINIMAX_API_KEY`                                                                                            |
| Ollama Web Search      | không cần khóa đối với máy chủ cục bộ có thể truy cập và đã đăng nhập; tìm kiếm trực tiếp qua `https://ollama.com` sử dụng `OLLAMA_API_KEY`; các máy chủ được bảo vệ bằng xác thực tái sử dụng xác thực bearer thông thường của nhà cung cấp Ollama |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                                         |
| Perplexity Search API  | `PERPLEXITY_API_KEY` hoặc `OPENROUTER_API_KEY`                                                                                                                                             |
| SearXNG                | `SEARXNG_BASE_URL`; không cần khóa/tự lưu trữ, không tính phí dịch vụ lưu trữ                                                                                                              |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                                           |

Các đường dẫn cấu hình `tools.web.search.*` cũ vẫn được tải thông qua một lớp tương thích nhưng không còn là bề mặt được khuyến nghị.

**Tín dụng miễn phí của Brave Search**: mỗi gói bao gồm 5 USD tín dụng miễn phí được gia hạn hằng tháng. Gói Search có giá 5 USD cho mỗi 1.000 yêu cầu, vì vậy khoản tín dụng này bao phủ miễn phí 1.000 yêu cầu/tháng. Hãy đặt giới hạn sử dụng trong bảng điều khiển Brave để tránh các khoản phí ngoài dự kiến.

Xem [Công cụ web](/vi/tools/web).

### Công cụ truy xuất web (Firecrawl)

`web_fetch` có thể gọi Firecrawl bằng quyền truy cập khởi đầu không cần khóa; thêm `FIRECRAWL_API_KEY` (hoặc `plugins.entries.firecrawl.config.webFetch.apiKey`) để có hạn mức cao hơn. Nếu Firecrawl chưa được cấu hình, công cụ sẽ chuyển sang truy xuất trực tiếp cùng với Plugin `web-readability` đi kèm (không dùng API trả phí). Tắt `plugins.entries.web-readability.enabled` để bỏ qua việc trích xuất Readability cục bộ.

Xem [Công cụ web](/vi/tools/web).

### Ảnh chụp nhanh mức sử dụng của nhà cung cấp (trạng thái/tình trạng)

`openclaw status --usage` và `openclaw models status --json` gọi các điểm cuối mức sử dụng của nhà cung cấp để hiển thị khoảng hạn mức hoặc tình trạng xác thực. Các lệnh gọi có tần suất thấp nhưng vẫn truy cập API của nhà cung cấp.

Xem [CLI mô hình](/vi/cli/models).

### Tóm tắt bảo vệ Compaction

Cơ chế bảo vệ Compaction có thể tóm tắt lịch sử phiên bằng mô hình hiện tại, qua đó gọi API của nhà cung cấp khi chạy.

Xem [Quản lý phiên và Compaction](/vi/reference/session-management-compaction).

### Quét/thăm dò mô hình

`openclaw models scan` có thể thăm dò các mô hình OpenRouter và sử dụng `OPENROUTER_API_KEY` khi tính năng thăm dò được bật.

Xem [CLI mô hình](/vi/cli/models).

### Trò chuyện bằng giọng nói

Chế độ trò chuyện bằng giọng nói có thể gọi ElevenLabs khi được cấu hình: `ELEVENLABS_API_KEY` hoặc `talk.providers.elevenlabs.apiKey`.

Xem [Chế độ trò chuyện bằng giọng nói](/vi/nodes/talk).

### Skills (API của bên thứ ba)

Skills có thể lưu `apiKey` trong `skills.entries.<name>.apiKey`. Nếu một Skills sử dụng khóa đó với API bên ngoài, chi phí sẽ tuân theo nhà cung cấp của Skills đó.

Xem [Skills](/vi/tools/skills).

## Liên quan

- [Mức sử dụng token và chi phí](/vi/reference/token-use)
- [Bộ nhớ đệm lời nhắc](/vi/reference/prompt-caching)
- [Theo dõi mức sử dụng](/vi/concepts/usage-tracking)
