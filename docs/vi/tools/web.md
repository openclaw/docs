---
read_when:
    - Bạn muốn bật hoặc cấu hình web_search
    - Bạn muốn bật hoặc cấu hình x_search
    - Bạn cần chọn một nhà cung cấp tìm kiếm
    - Bạn muốn hiểu về tính năng phát hiện tự động và cơ chế dự phòng của nhà cung cấp
sidebarTitle: Web Search
summary: web_search, x_search, và web_fetch -- tìm kiếm trên web, tìm kiếm bài đăng X, hoặc truy xuất nội dung trang
title: Tìm kiếm trên web
x-i18n:
    generated_at: "2026-05-07T13:26:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84de67b51f02e3b901bfa55017ae8e88de49295dfe6ed1103a45f034e073c087
    source_path: tools/web.md
    workflow: 16
---

Công cụ `web_search` tìm kiếm trên web bằng nhà cung cấp bạn đã cấu hình và
trả về kết quả. Kết quả được lưu vào bộ nhớ đệm theo truy vấn trong 15 phút (có thể cấu hình).

OpenClaw cũng bao gồm `x_search` cho bài đăng trên X (trước đây là Twitter) và
`web_fetch` để tìm nạp URL gọn nhẹ. Trong giai đoạn này, `web_fetch` vẫn chạy
cục bộ trong khi `web_search` và `x_search` có thể dùng xAI Responses bên dưới.

<Info>
  `web_search` là một công cụ HTTP gọn nhẹ, không phải tự động hóa trình duyệt. Với
  các trang nhiều JS hoặc cần đăng nhập, hãy dùng [Trình duyệt web](/vi/tools/browser). Để
  tìm nạp một URL cụ thể, hãy dùng [Web Fetch](/vi/tools/web-fetch).
</Info>

## Bắt đầu nhanh

<Steps>
  <Step title="Choose a provider">
    Chọn một nhà cung cấp và hoàn tất mọi bước thiết lập bắt buộc. Một số nhà cung cấp
    không cần khóa, trong khi những nhà cung cấp khác dùng khóa API. Xem các trang nhà cung cấp bên dưới để biết
    chi tiết.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Thao tác này lưu nhà cung cấp và mọi thông tin xác thực cần thiết. Bạn cũng có thể đặt một biến môi trường
    (ví dụ `BRAVE_API_KEY`) và bỏ qua bước này đối với các nhà cung cấp dựa trên API.
  </Step>
  <Step title="Use it">
    Tác tử giờ có thể gọi `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Đối với bài đăng trên X, dùng:

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
    Tìm kiếm neural + từ khóa với trích xuất nội dung (điểm nổi bật, văn bản, tóm tắt).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/vi/tools/firecrawl">
    Kết quả có cấu trúc. Phù hợp nhất khi ghép với `firecrawl_search` và `firecrawl_scrape` để trích xuất sâu.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/vi/tools/gemini-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua nền tảng Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/vi/tools/grok-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua nền tảng web xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/vi/tools/kimi-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua tìm kiếm web Moonshot; các phương án dự phòng trò chuyện không có căn cứ sẽ thất bại rõ ràng.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/vi/tools/minimax-search">
    Kết quả có cấu trúc thông qua API tìm kiếm MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/vi/tools/ollama-search">
    Tìm kiếm thông qua máy chủ Ollama cục bộ đã đăng nhập hoặc API Ollama được lưu trữ.
  </Card>
  <Card title="Perplexity" icon="search" href="/vi/tools/perplexity-search">
    Kết quả có cấu trúc với điều khiển trích xuất nội dung và lọc miền.
  </Card>
  <Card title="SearXNG" icon="server" href="/vi/tools/searxng-search">
    Siêu tìm kiếm tự lưu trữ. Không cần khóa API. Tổng hợp Google, Bing, DuckDuckGo và nhiều nguồn khác.
  </Card>
  <Card title="Tavily" icon="globe" href="/vi/tools/tavily">
    Kết quả có cấu trúc với độ sâu tìm kiếm, lọc chủ đề và `tavily_extract` để trích xuất URL.
  </Card>
</CardGroup>

### So sánh nhà cung cấp

| Nhà cung cấp                              | Kiểu kết quả                                                   | Bộ lọc                                          | Khóa API                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/vi/tools/brave-search)              | Đoạn trích có cấu trúc                                         | Quốc gia, ngôn ngữ, thời gian, chế độ `llm-context` | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/vi/tools/duckduckgo-search)    | Đoạn trích có cấu trúc                                         | --                                               | Không có (không cần khóa)                                                               |
| [Exa](/vi/tools/exa-search)                  | Có cấu trúc + đã trích xuất                                    | Chế độ neural/từ khóa, ngày, trích xuất nội dung | `EXA_API_KEY`                                                                           |
| [Firecrawl](/vi/tools/firecrawl)             | Đoạn trích có cấu trúc                                         | Thông qua công cụ `firecrawl_search`             | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/vi/tools/gemini-search)            | Do AI tổng hợp + trích dẫn                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/vi/tools/grok-search)                | Do AI tổng hợp + trích dẫn                                     | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/vi/tools/kimi-search)                | Do AI tổng hợp + trích dẫn; thất bại với phương án dự phòng trò chuyện không có căn cứ | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/vi/tools/minimax-search)   | Đoạn trích có cấu trúc                                         | Khu vực (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/vi/tools/ollama-search) | Đoạn trích có cấu trúc                                         | --                                               | Không có đối với máy chủ cục bộ đã đăng nhập; `OLLAMA_API_KEY` cho tìm kiếm trực tiếp `https://ollama.com` |
| [Perplexity](/vi/tools/perplexity-search)    | Đoạn trích có cấu trúc                                         | Quốc gia, ngôn ngữ, thời gian, miền, giới hạn nội dung | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/vi/tools/searxng-search)          | Đoạn trích có cấu trúc                                         | Danh mục, ngôn ngữ                               | Không có (tự lưu trữ)                                                                    |
| [Tavily](/vi/tools/tavily)                   | Đoạn trích có cấu trúc                                         | Thông qua công cụ `tavily_search`                | `TAVILY_API_KEY`                                                                        |

## Tự động phát hiện

## Tìm kiếm web OpenAI gốc

Các mô hình OpenAI Responses trực tiếp tự động dùng công cụ `web_search` được OpenAI lưu trữ khi tìm kiếm web của OpenClaw được bật và không ghim nhà cung cấp được quản lý nào. Đây là hành vi do nhà cung cấp sở hữu trong Plugin OpenAI đi kèm và chỉ áp dụng cho lưu lượng API OpenAI gốc, không áp dụng cho URL cơ sở proxy tương thích OpenAI hoặc tuyến Azure. Đặt `tools.web.search.provider` thành một nhà cung cấp khác như `brave` để giữ công cụ `web_search` được quản lý cho các mô hình OpenAI, hoặc đặt `tools.web.search.enabled: false` để tắt cả tìm kiếm được quản lý và tìm kiếm OpenAI gốc.

## Tìm kiếm web Codex gốc

Các mô hình hỗ trợ Codex có thể tùy chọn dùng công cụ `web_search` Responses gốc của nhà cung cấp thay cho hàm `web_search` được OpenClaw quản lý.

- Cấu hình trong `tools.web.search.openaiCodex`
- Chỉ kích hoạt cho các mô hình hỗ trợ Codex (`openai-codex/*` hoặc nhà cung cấp dùng `api: "openai-codex-responses"`)
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

## An toàn mạng

Các lệnh gọi nhà cung cấp `web_search` được quản lý dùng đường dẫn fetch được bảo vệ của OpenClaw. Đối với
máy chủ API nhà cung cấp đáng tin cậy, OpenClaw cho phép các câu trả lời DNS fake-IP của Surge, Clash và sing-box
trong `198.18.0.0/15` và `fc00::/7` chỉ cho tên máy chủ nhà cung cấp đó.
Các đích riêng tư, loopback, link-local và metadata khác vẫn bị chặn.

Cho phép tự động này không áp dụng cho các URL `web_fetch` tùy ý. Đối với
`web_fetch`, chỉ bật rõ ràng `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` và
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` khi proxy đáng tin cậy của bạn
sở hữu các dải tổng hợp đó.

## Thiết lập tìm kiếm web

Danh sách nhà cung cấp trong tài liệu và các luồng thiết lập được sắp xếp theo thứ tự bảng chữ cái. Tự động phát hiện giữ một
thứ tự ưu tiên riêng.

Nếu không đặt `provider`, OpenClaw kiểm tra các nhà cung cấp theo thứ tự này và dùng
nhà cung cấp đầu tiên đã sẵn sàng:

Trước tiên là các nhà cung cấp dựa trên API:

1. **Brave** -- `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey` (thứ tự 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` hoặc `plugins.entries.minimax.config.webSearch.apiKey` (thứ tự 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, hoặc `models.providers.google.apiKey` (thứ tự 20)
4. **Grok** -- `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey` (thứ tự 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` hoặc `plugins.entries.moonshot.config.webSearch.apiKey` (thứ tự 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` hoặc `plugins.entries.perplexity.config.webSearch.apiKey` (thứ tự 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webSearch.apiKey` (thứ tự 60)
8. **Exa** -- `EXA_API_KEY` hoặc `plugins.entries.exa.config.webSearch.apiKey`; tùy chọn `plugins.entries.exa.config.webSearch.baseUrl` ghi đè endpoint Exa (thứ tự 65)
9. **Tavily** -- `TAVILY_API_KEY` hoặc `plugins.entries.tavily.config.webSearch.apiKey` (thứ tự 70)

Sau đó là các phương án dự phòng không cần khóa:

10. **DuckDuckGo** -- phương án dự phòng HTML không cần khóa, không cần tài khoản hoặc khóa API (thứ tự 100)
11. **Ollama Web Search** -- phương án dự phòng không cần khóa thông qua máy chủ Ollama cục bộ đã cấu hình của bạn khi có thể truy cập và đã đăng nhập bằng `ollama signin`; có thể tái sử dụng xác thực bearer của nhà cung cấp Ollama khi máy chủ cần, và có thể gọi tìm kiếm trực tiếp `https://ollama.com` khi được cấu hình với `OLLAMA_API_KEY` (thứ tự 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` hoặc `plugins.entries.searxng.config.webSearch.baseUrl` (thứ tự 200)

Nếu không phát hiện được nhà cung cấp nào, hệ thống dự phòng sang Brave (bạn sẽ nhận lỗi thiếu khóa
nhắc bạn cấu hình một khóa).

<Note>
  Tất cả trường khóa nhà cung cấp đều hỗ trợ đối tượng SecretRef. SecretRef theo phạm vi Plugin
  trong `plugins.entries.<plugin>.config.webSearch.apiKey` được phân giải cho
  các nhà cung cấp tìm kiếm web dựa trên API đi kèm, bao gồm Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity và Tavily,
  dù nhà cung cấp được chọn rõ ràng qua `tools.web.search.provider` hay
  được chọn thông qua tự động phát hiện. Ở chế độ tự động phát hiện, OpenClaw chỉ phân giải
  khóa nhà cung cấp đã chọn -- SecretRef không được chọn vẫn không hoạt động, nên bạn có thể
  giữ nhiều nhà cung cấp được cấu hình mà không mất chi phí phân giải cho
  những nhà cung cấp bạn không dùng.
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
`plugins.entries.<plugin>.config.webSearch.*`. Gemini cũng có thể dùng lại
`models.providers.google.apiKey` và `models.providers.google.baseUrl` làm phương án dự phòng
có mức ưu tiên thấp hơn sau cấu hình tìm kiếm web riêng của nó và `GEMINI_API_KEY`. Xem
các trang nhà cung cấp để biết ví dụ.

`tools.web.search.provider` được xác thực theo các id nhà cung cấp tìm kiếm web
được khai báo bởi manifest Plugin đi kèm và đã cài đặt. Lỗi chính tả như `"brvae"`
sẽ làm xác thực cấu hình thất bại thay vì âm thầm quay về tự động phát hiện. Nếu một
nhà cung cấp đã cấu hình chỉ có bằng chứng Plugin cũ, chẳng hạn một khối
`plugins.entries.<plugin>` còn sót lại sau khi gỡ cài đặt Plugin bên thứ ba,
OpenClaw vẫn giữ quá trình khởi động ổn định và báo cảnh báo để bạn có thể cài đặt lại
Plugin hoặc chạy `openclaw doctor --fix` để dọn cấu hình cũ.

Việc chọn nhà cung cấp dự phòng cho `web_fetch` là riêng biệt:

- chọn bằng `tools.web.fetch.provider`
- hoặc bỏ qua trường đó và để OpenClaw tự động phát hiện nhà cung cấp tìm nạp web
  sẵn sàng đầu tiên từ các thông tin xác thực có sẵn
- `web_fetch` không chạy trong sandbox có thể dùng các nhà cung cấp Plugin đã cài đặt có khai báo
  `contracts.webFetchProviders`; các lần tìm nạp trong sandbox chỉ dùng nhà cung cấp đi kèm
- hiện nay nhà cung cấp tìm nạp web đi kèm là Firecrawl, được cấu hình trong
  `plugins.entries.firecrawl.config.webFetch.*`

Khi bạn chọn **Kimi** trong `openclaw onboard` hoặc
`openclaw configure --section web`, OpenClaw cũng có thể hỏi:

- khu vực API Moonshot (`https://api.moonshot.ai/v1` hoặc `https://api.moonshot.cn/v1`)
- mô hình tìm kiếm web Kimi mặc định (mặc định là `kimi-k2.6`)

Đối với `x_search`, hãy cấu hình `plugins.entries.xai.config.xSearch.*`. Nó dùng cùng
phương án dự phòng `XAI_API_KEY` như tìm kiếm web Grok.
Cấu hình cũ `tools.web.x_search.*` được tự động di chuyển bởi `openclaw doctor --fix`.
Khi bạn chọn Grok trong `openclaw onboard` hoặc `openclaw configure --section web`,
OpenClaw cũng có thể cung cấp thiết lập `x_search` tùy chọn với cùng khóa.
Đây là một bước tiếp theo riêng trong nhánh Grok, không phải một lựa chọn nhà cung cấp
tìm kiếm web cấp cao riêng. Nếu bạn chọn nhà cung cấp khác, OpenClaw sẽ không
hiển thị lời nhắc `x_search`.

### Lưu khóa API

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

    Đối với bản cài đặt gateway, hãy đặt biến đó trong `~/.openclaw/.env`.
    Xem [Biến môi trường](/vi/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Tham số công cụ

| Tham số               | Mô tả                                                  |
| --------------------- | ------------------------------------------------------ |
| `query`               | Truy vấn tìm kiếm (bắt buộc)                           |
| `count`               | Số kết quả cần trả về (1-10, mặc định: 5)              |
| `country`             | Mã quốc gia ISO gồm 2 chữ cái (ví dụ: "US", "DE")      |
| `language`            | Mã ngôn ngữ ISO 639-1 (ví dụ: "en", "de")              |
| `search_lang`         | Mã ngôn ngữ tìm kiếm (chỉ Brave)                       |
| `freshness`           | Bộ lọc thời gian: `day`, `week`, `month`, hoặc `year`  |
| `date_after`          | Kết quả sau ngày này (YYYY-MM-DD)                      |
| `date_before`         | Kết quả trước ngày này (YYYY-MM-DD)                    |
| `ui_lang`             | Mã ngôn ngữ giao diện người dùng (chỉ Brave)           |
| `domain_filter`       | Mảng danh sách cho phép/từ chối miền (chỉ Perplexity)  |
| `max_tokens`          | Tổng ngân sách nội dung, mặc định 25000 (chỉ Perplexity) |
| `max_tokens_per_page` | Giới hạn token trên mỗi trang, mặc định 2048 (chỉ Perplexity) |

<Warning>
  Không phải mọi tham số đều hoạt động với mọi nhà cung cấp. Chế độ `llm-context` của Brave
  từ chối `ui_lang`; `date_before` cũng cần `date_after` vì các khoảng
  độ mới tùy chỉnh của Brave yêu cầu cả ngày bắt đầu và ngày kết thúc.
  Gemini, Grok và Kimi trả về một câu trả lời tổng hợp kèm trích dẫn. Chúng
  chấp nhận `count` để tương thích với công cụ dùng chung, nhưng tham số đó không thay đổi
  dạng câu trả lời có căn cứ. Gemini hỗ trợ `freshness`, `date_after` và
  `date_before` bằng cách chuyển chúng thành các khoảng thời gian grounding của Google Search.
  Perplexity hoạt động tương tự khi bạn dùng đường dẫn tương thích Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` hoặc `OPENROUTER_API_KEY`).
  SearXNG chỉ chấp nhận `http://` cho máy chủ mạng riêng đáng tin cậy hoặc máy chủ local loopback;
  các endpoint SearXNG công khai phải dùng `https://`.
  Firecrawl và Tavily chỉ hỗ trợ `query` và `count` thông qua `web_search`
  -- hãy dùng các công cụ chuyên dụng của chúng cho tùy chọn nâng cao.
</Warning>

## x_search

`x_search` truy vấn các bài đăng X (trước đây là Twitter) bằng xAI và trả về
câu trả lời do AI tổng hợp kèm trích dẫn. Nó chấp nhận truy vấn ngôn ngữ tự nhiên và
các bộ lọc có cấu trúc tùy chọn. OpenClaw chỉ bật công cụ `x_search` xAI tích hợp
trên yêu cầu phục vụ lời gọi công cụ này.

<Note>
  xAI ghi nhận `x_search` là hỗ trợ tìm kiếm từ khóa, tìm kiếm ngữ nghĩa, tìm kiếm người dùng
  và tìm nạp luồng. Đối với thống kê tương tác theo từng bài đăng như repost,
  trả lời, đánh dấu, hoặc lượt xem, nên dùng tra cứu nhắm mục tiêu cho URL bài đăng chính xác
  hoặc ID trạng thái. Tìm kiếm từ khóa rộng có thể tìm đúng bài đăng nhưng trả về
  siêu dữ liệu theo bài đăng kém đầy đủ hơn. Một mẫu tốt là: trước tiên định vị bài đăng, sau đó
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
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` đăng lên `<baseUrl>/responses` khi
`plugins.entries.xai.config.xSearch.baseUrl` được đặt. Nếu trường đó bị bỏ qua,
nó quay về `plugins.entries.xai.config.webSearch.baseUrl`, rồi
`tools.web.search.grok.baseUrl` cũ, và cuối cùng là endpoint xAI công khai.

### Tham số x_search

| Tham số                      | Mô tả                                                   |
| ---------------------------- | ------------------------------------------------------- |
| `query`                      | Truy vấn tìm kiếm (bắt buộc)                            |
| `allowed_x_handles`          | Giới hạn kết quả vào các handle X cụ thể                |
| `excluded_x_handles`         | Loại trừ các handle X cụ thể                            |
| `from_date`                  | Chỉ bao gồm bài đăng vào hoặc sau ngày này (YYYY-MM-DD) |
| `to_date`                    | Chỉ bao gồm bài đăng vào hoặc trước ngày này (YYYY-MM-DD) |
| `enable_image_understanding` | Cho phép xAI kiểm tra hình ảnh đính kèm các bài đăng khớp |
| `enable_video_understanding` | Cho phép xAI kiểm tra video đính kèm các bài đăng khớp  |

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

- [Tìm nạp web](/vi/tools/web-fetch) -- tìm nạp một URL và trích xuất nội dung dễ đọc
- [Trình duyệt web](/vi/tools/browser) -- tự động hóa trình duyệt đầy đủ cho các trang dùng nhiều JS
- [Tìm kiếm Grok](/vi/tools/grok-search) -- Grok làm nhà cung cấp `web_search`
- [Tìm kiếm web Ollama](/vi/tools/ollama-search) -- tìm kiếm web không cần khóa thông qua máy chủ Ollama của bạn
