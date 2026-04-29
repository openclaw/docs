---
read_when:
    - Bạn muốn bật hoặc cấu hình web_search
    - Bạn muốn bật hoặc cấu hình x_search
    - Bạn cần chọn nhà cung cấp tìm kiếm
    - Bạn muốn tìm hiểu về tự động phát hiện và phương án dự phòng của nhà cung cấp
sidebarTitle: Web Search
summary: web_search, x_search, và web_fetch -- tìm kiếm trên web, tìm kiếm bài đăng trên X hoặc truy xuất nội dung trang
title: Tìm kiếm trên web
x-i18n:
    generated_at: "2026-04-29T23:22:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 16
---

Công cụ `web_search` tìm kiếm trên web bằng nhà cung cấp đã cấu hình của bạn và
trả về kết quả. Kết quả được lưu vào bộ nhớ đệm theo truy vấn trong 15 phút (có thể cấu hình).

OpenClaw cũng bao gồm `x_search` cho các bài đăng X (trước đây là Twitter) và
`web_fetch` để tìm nạp URL nhẹ. Trong giai đoạn này, `web_fetch` vẫn chạy
cục bộ trong khi `web_search` và `x_search` có thể dùng xAI Responses ở bên dưới.

<Info>
  `web_search` là một công cụ HTTP nhẹ, không phải tự động hóa trình duyệt. Với
  các trang dùng nhiều JS hoặc yêu cầu đăng nhập, hãy dùng [Trình duyệt Web](/vi/tools/browser). Để
  tìm nạp một URL cụ thể, hãy dùng [Tìm nạp Web](/vi/tools/web-fetch).
</Info>

## Bắt đầu nhanh

<Steps>
  <Step title="Chọn một nhà cung cấp">
    Chọn một nhà cung cấp và hoàn tất mọi thiết lập bắt buộc. Một số nhà cung cấp
    không cần khóa, trong khi những nhà cung cấp khác dùng khóa API. Xem các trang nhà cung cấp bên dưới để biết
    chi tiết.
  </Step>
  <Step title="Cấu hình">
    ```bash
    openclaw configure --section web
    ```
    Lệnh này lưu nhà cung cấp và mọi thông tin xác thực cần thiết. Bạn cũng có thể đặt một biến môi trường
    (ví dụ `BRAVE_API_KEY`) và bỏ qua bước này với các nhà cung cấp
    dựa trên API.
  </Step>
  <Step title="Sử dụng">
    Agent hiện có thể gọi `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Với bài đăng X, hãy dùng:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Chọn nhà cung cấp

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/vi/tools/brave-search">
    Kết quả có cấu trúc kèm đoạn trích. Hỗ trợ chế độ `llm-context`, bộ lọc quốc gia/ngôn ngữ. Có bậc miễn phí.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/vi/tools/duckduckgo-search">
    Phương án dự phòng không cần khóa. Không cần khóa API. Tích hợp không chính thức dựa trên HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/vi/tools/exa-search">
    Tìm kiếm neural + từ khóa với trích xuất nội dung (phần nổi bật, văn bản, tóm tắt).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/vi/tools/firecrawl">
    Kết quả có cấu trúc. Tốt nhất khi kết hợp với `firecrawl_search` và `firecrawl_scrape` để trích xuất sâu.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/vi/tools/gemini-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua Google Search grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/vi/tools/grok-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua xAI web grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/vi/tools/kimi-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua tìm kiếm web Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/vi/tools/minimax-search">
    Kết quả có cấu trúc thông qua API tìm kiếm MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/vi/tools/ollama-search">
    Tìm kiếm thông qua máy chủ Ollama cục bộ đã đăng nhập hoặc API Ollama được lưu trữ.
  </Card>
  <Card title="Perplexity" icon="search" href="/vi/tools/perplexity-search">
    Kết quả có cấu trúc với các điều khiển trích xuất nội dung và lọc miền.
  </Card>
  <Card title="SearXNG" icon="server" href="/vi/tools/searxng-search">
    Siêu tìm kiếm tự lưu trữ. Không cần khóa API. Tổng hợp Google, Bing, DuckDuckGo và nhiều dịch vụ khác.
  </Card>
  <Card title="Tavily" icon="globe" href="/vi/tools/tavily">
    Kết quả có cấu trúc với độ sâu tìm kiếm, lọc chủ đề và `tavily_extract` để trích xuất URL.
  </Card>
</CardGroup>

### So sánh nhà cung cấp

| Nhà cung cấp                              | Kiểu kết quả               | Bộ lọc                                           | Khóa API                                                                                 |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/vi/tools/brave-search)              | Đoạn trích có cấu trúc     | Quốc gia, ngôn ngữ, thời gian, chế độ `llm-context` | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/vi/tools/duckduckgo-search)    | Đoạn trích có cấu trúc     | --                                               | Không có (không cần khóa)                                                               |
| [Exa](/vi/tools/exa-search)                  | Có cấu trúc + đã trích xuất | Chế độ neural/từ khóa, ngày, trích xuất nội dung | `EXA_API_KEY`                                                                           |
| [Firecrawl](/vi/tools/firecrawl)             | Đoạn trích có cấu trúc     | Thông qua công cụ `firecrawl_search`             | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/vi/tools/gemini-search)            | AI tổng hợp + trích dẫn    | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/vi/tools/grok-search)                | AI tổng hợp + trích dẫn    | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/vi/tools/kimi-search)                | AI tổng hợp + trích dẫn    | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/vi/tools/minimax-search)   | Đoạn trích có cấu trúc     | Khu vực (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/vi/tools/ollama-search) | Đoạn trích có cấu trúc     | --                                               | Không có cho máy chủ cục bộ đã đăng nhập; `OLLAMA_API_KEY` cho tìm kiếm trực tiếp `https://ollama.com` |
| [Perplexity](/vi/tools/perplexity-search)    | Đoạn trích có cấu trúc     | Quốc gia, ngôn ngữ, thời gian, miền, giới hạn nội dung | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/vi/tools/searxng-search)          | Đoạn trích có cấu trúc     | Danh mục, ngôn ngữ                               | Không có (tự lưu trữ)                                                                   |
| [Tavily](/vi/tools/tavily)                   | Đoạn trích có cấu trúc     | Thông qua công cụ `tavily_search`                | `TAVILY_API_KEY`                                                                        |

## Tự động phát hiện

## Tìm kiếm web OpenAI gốc

Các mô hình OpenAI Responses trực tiếp tự động dùng công cụ `web_search` được lưu trữ của OpenAI khi tìm kiếm web của OpenClaw được bật và không ghim nhà cung cấp được quản lý nào. Đây là hành vi do nhà cung cấp sở hữu trong Plugin OpenAI đi kèm và chỉ áp dụng cho lưu lượng API OpenAI gốc, không áp dụng cho URL cơ sở proxy tương thích OpenAI hoặc tuyến Azure. Đặt `tools.web.search.provider` thành nhà cung cấp khác như `brave` để giữ công cụ `web_search` được quản lý cho các mô hình OpenAI, hoặc đặt `tools.web.search.enabled: false` để tắt cả tìm kiếm được quản lý và tìm kiếm OpenAI gốc.

## Tìm kiếm web Codex gốc

Các mô hình hỗ trợ Codex có thể tùy chọn dùng công cụ `web_search` Responses gốc của nhà cung cấp thay cho hàm `web_search` được quản lý của OpenClaw.

- Cấu hình trong `tools.web.search.openaiCodex`
- Chỉ kích hoạt cho các mô hình hỗ trợ Codex (`openai-codex/*` hoặc các nhà cung cấp dùng `api: "openai-codex-responses"`)
- `web_search` được quản lý vẫn áp dụng cho các mô hình không phải Codex
- `mode: "cached"` là thiết lập mặc định và được khuyến nghị
- `tools.web.search.enabled: false` tắt cả tìm kiếm được quản lý và tìm kiếm gốc

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Nếu tìm kiếm Codex gốc được bật nhưng mô hình hiện tại không hỗ trợ Codex, OpenClaw giữ hành vi `web_search` được quản lý thông thường.

## Thiết lập tìm kiếm web

Danh sách nhà cung cấp trong tài liệu và luồng thiết lập được sắp xếp theo bảng chữ cái. Tự động phát hiện giữ một
thứ tự ưu tiên riêng.

Nếu chưa đặt `provider`, OpenClaw kiểm tra các nhà cung cấp theo thứ tự này và dùng
nhà cung cấp đầu tiên đã sẵn sàng:

Các nhà cung cấp dựa trên API trước:

1. **Brave** -- `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey` (thứ tự 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` hoặc `plugins.entries.minimax.config.webSearch.apiKey` (thứ tự 15)
3. **Gemini** -- `GEMINI_API_KEY` hoặc `plugins.entries.google.config.webSearch.apiKey` (thứ tự 20)
4. **Grok** -- `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey` (thứ tự 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` hoặc `plugins.entries.moonshot.config.webSearch.apiKey` (thứ tự 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` hoặc `plugins.entries.perplexity.config.webSearch.apiKey` (thứ tự 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webSearch.apiKey` (thứ tự 60)
8. **Exa** -- `EXA_API_KEY` hoặc `plugins.entries.exa.config.webSearch.apiKey` (thứ tự 65)
9. **Tavily** -- `TAVILY_API_KEY` hoặc `plugins.entries.tavily.config.webSearch.apiKey` (thứ tự 70)

Sau đó là các phương án dự phòng không cần khóa:

10. **DuckDuckGo** -- phương án dự phòng HTML không cần khóa, không cần tài khoản hoặc khóa API (thứ tự 100)
11. **Ollama Web Search** -- phương án dự phòng không cần khóa thông qua máy chủ Ollama cục bộ đã cấu hình của bạn khi máy chủ có thể truy cập và đã đăng nhập bằng `ollama signin`; có thể tái sử dụng xác thực bearer của nhà cung cấp Ollama khi máy chủ cần, và có thể gọi tìm kiếm trực tiếp `https://ollama.com` khi được cấu hình với `OLLAMA_API_KEY` (thứ tự 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` hoặc `plugins.entries.searxng.config.webSearch.baseUrl` (thứ tự 200)

Nếu không phát hiện được nhà cung cấp nào, hệ thống quay về Brave (bạn sẽ nhận được lỗi thiếu khóa
nhắc bạn cấu hình một khóa).

<Note>
  Tất cả trường khóa nhà cung cấp đều hỗ trợ đối tượng SecretRef. SecretRef phạm vi Plugin
  trong `plugins.entries.<plugin>.config.webSearch.apiKey` được phân giải cho các
  nhà cung cấp tìm kiếm web dựa trên API đi kèm, bao gồm Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity và Tavily,
  dù nhà cung cấp được chọn rõ ràng qua `tools.web.search.provider` hay
  được chọn thông qua tự động phát hiện. Ở chế độ tự động phát hiện, OpenClaw chỉ phân giải khóa của
  nhà cung cấp đã chọn -- các SecretRef không được chọn vẫn không hoạt động, vì vậy bạn có thể
  cấu hình nhiều nhà cung cấp mà không phải trả chi phí phân giải cho những
  nhà cung cấp bạn không dùng.
</Note>

## Cấu hình

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Cấu hình dành riêng cho nhà cung cấp (khóa API, URL cơ sở, chế độ) nằm trong
`plugins.entries.<plugin>.config.webSearch.*`. Xem các trang nhà cung cấp để biết
ví dụ.

Việc chọn nhà cung cấp dự phòng cho `web_fetch` là riêng biệt:

- chọn bằng `tools.web.fetch.provider`
- hoặc bỏ qua trường đó và để OpenClaw tự động phát hiện nhà cung cấp web-fetch
  sẵn sàng đầu tiên từ thông tin xác thực có sẵn
- hiện nay nhà cung cấp web-fetch đi kèm là Firecrawl, được cấu hình trong
  `plugins.entries.firecrawl.config.webFetch.*`

Khi bạn chọn **Kimi** trong `openclaw onboard` hoặc
`openclaw configure --section web`, OpenClaw cũng có thể hỏi:

- khu vực API Moonshot (`https://api.moonshot.ai/v1` hoặc `https://api.moonshot.cn/v1`)
- mô hình tìm kiếm web Kimi mặc định (mặc định là `kimi-k2.6`)

Đối với `x_search`, hãy cấu hình `plugins.entries.xai.config.xSearch.*`. Nó dùng cùng phương án dự phòng `XAI_API_KEY` như tìm kiếm web Grok.
Cấu hình cũ `tools.web.x_search.*` được `openclaw doctor --fix` tự động di chuyển.
Khi bạn chọn Grok trong `openclaw onboard` hoặc `openclaw configure --section web`,
OpenClaw cũng có thể đề xuất thiết lập `x_search` tùy chọn với cùng khóa.
Đây là một bước tiếp theo riêng trong luồng Grok, không phải một lựa chọn nhà cung cấp
tìm kiếm web cấp cao nhất riêng biệt. Nếu bạn chọn nhà cung cấp khác, OpenClaw sẽ không
hiển thị lời nhắc `x_search`.

### Lưu trữ khóa API

<Tabs>
  <Tab title="Tệp cấu hình">
    Chạy `openclaw configure --section web` hoặc đặt khóa trực tiếp:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Biến môi trường">
    Đặt biến môi trường của nhà cung cấp trong môi trường tiến trình Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Đối với bản cài đặt Gateway, hãy đặt nó trong `~/.openclaw/.env`.
    Xem [Biến môi trường](/vi/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Tham số công cụ

| Tham số               | Mô tả                                                    |
| --------------------- | -------------------------------------------------------- |
| `query`               | Truy vấn tìm kiếm (bắt buộc)                             |
| `count`               | Số kết quả trả về (1-10, mặc định: 5)                    |
| `country`             | Mã quốc gia ISO gồm 2 chữ cái (ví dụ: "US", "DE")        |
| `language`            | Mã ngôn ngữ ISO 639-1 (ví dụ: "en", "de")               |
| `search_lang`         | Mã ngôn ngữ tìm kiếm (chỉ Brave)                         |
| `freshness`           | Bộ lọc thời gian: `day`, `week`, `month`, hoặc `year`    |
| `date_after`          | Kết quả sau ngày này (YYYY-MM-DD)                        |
| `date_before`         | Kết quả trước ngày này (YYYY-MM-DD)                      |
| `ui_lang`             | Mã ngôn ngữ UI (chỉ Brave)                               |
| `domain_filter`       | Mảng danh sách cho phép/từ chối miền (chỉ Perplexity)    |
| `max_tokens`          | Ngân sách nội dung tổng, mặc định 25000 (chỉ Perplexity) |
| `max_tokens_per_page` | Giới hạn token mỗi trang, mặc định 2048 (chỉ Perplexity) |

<Warning>
  Không phải tất cả tham số đều hoạt động với mọi nhà cung cấp. Chế độ `llm-context`
  của Brave từ chối `ui_lang`, `freshness`, `date_after`, và `date_before`.
  Gemini, Grok, và Kimi trả về một câu trả lời tổng hợp kèm trích dẫn. Chúng
  chấp nhận `count` để tương thích với công cụ dùng chung, nhưng tham số này không
  thay đổi dạng câu trả lời có căn cứ.
  Perplexity hoạt động theo cách tương tự khi bạn dùng đường dẫn tương thích
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` hoặc `OPENROUTER_API_KEY`).
  SearXNG chỉ chấp nhận `http://` cho các máy chủ mạng riêng hoặc loopback đáng tin cậy;
  các endpoint SearXNG công khai phải dùng `https://`.
  Firecrawl và Tavily chỉ hỗ trợ `query` và `count` thông qua `web_search`
  -- hãy dùng các công cụ chuyên dụng của chúng cho tùy chọn nâng cao.
</Warning>

## x_search

`x_search` truy vấn bài đăng X (trước đây là Twitter) bằng xAI và trả về
câu trả lời do AI tổng hợp kèm trích dẫn. Nó chấp nhận truy vấn ngôn ngữ tự nhiên và
các bộ lọc có cấu trúc tùy chọn. OpenClaw chỉ bật công cụ `x_search` xAI tích hợp
trên yêu cầu phục vụ lệnh gọi công cụ này.

<Note>
  xAI ghi tài liệu rằng `x_search` hỗ trợ tìm kiếm từ khóa, tìm kiếm ngữ nghĩa, tìm kiếm người dùng,
  và lấy chuỗi thảo luận. Với thống kê tương tác theo từng bài đăng như đăng lại,
  trả lời, dấu trang, hoặc lượt xem, nên dùng tra cứu có mục tiêu cho đúng URL bài đăng
  hoặc ID trạng thái. Tìm kiếm từ khóa rộng có thể tìm được bài đăng đúng nhưng trả về
  siêu dữ liệu theo từng bài đăng kém đầy đủ hơn. Một mẫu tốt là: định vị bài đăng trước, rồi
  chạy truy vấn `x_search` thứ hai tập trung vào đúng bài đăng đó.
</Note>

### Cấu hình x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### Tham số x_search

| Tham số                      | Mô tả                                                       |
| ---------------------------- | ----------------------------------------------------------- |
| `query`                      | Truy vấn tìm kiếm (bắt buộc)                                |
| `allowed_x_handles`          | Giới hạn kết quả vào các handle X cụ thể                    |
| `excluded_x_handles`         | Loại trừ các handle X cụ thể                                |
| `from_date`                  | Chỉ bao gồm bài đăng vào hoặc sau ngày này (YYYY-MM-DD)     |
| `to_date`                    | Chỉ bao gồm bài đăng vào hoặc trước ngày này (YYYY-MM-DD)   |
| `enable_image_understanding` | Cho phép xAI kiểm tra hình ảnh đính kèm bài đăng khớp       |
| `enable_video_understanding` | Cho phép xAI kiểm tra video đính kèm bài đăng khớp          |

### Ví dụ x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Ví dụ

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Hồ sơ công cụ

Nếu bạn dùng hồ sơ công cụ hoặc danh sách cho phép, hãy thêm `web_search`, `x_search`, hoặc `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Liên quan

- [Web Fetch](/vi/tools/web-fetch) -- tìm nạp URL và trích xuất nội dung dễ đọc
- [Web Browser](/vi/tools/browser) -- tự động hóa trình duyệt đầy đủ cho các trang dùng nhiều JS
- [Grok Search](/vi/tools/grok-search) -- Grok làm nhà cung cấp `web_search`
- [Ollama Web Search](/vi/tools/ollama-search) -- tìm kiếm web không cần khóa thông qua máy chủ Ollama của bạn
