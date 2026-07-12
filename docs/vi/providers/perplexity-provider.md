---
read_when:
    - Bạn muốn cấu hình Perplexity làm nhà cung cấp tìm kiếm trên web
    - Bạn cần khóa API Perplexity hoặc thiết lập proxy OpenRouter
summary: Thiết lập nhà cung cấp tìm kiếm web Perplexity (khóa API, chế độ tìm kiếm, bộ lọc)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T08:22:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity đăng ký một nhà cung cấp `web_search` với hai phương thức truyền tải: API Tìm kiếm Perplexity gốc (kết quả có cấu trúc kèm bộ lọc) và tính năng hoàn tất trò chuyện Perplexity Sonar, trực tiếp hoặc qua OpenRouter (câu trả lời do AI tổng hợp kèm trích dẫn).

<Note>
Trang này trình bày cách thiết lập **nhà cung cấp** Perplexity. Đối với **công cụ** Perplexity (cách tác nhân sử dụng công cụ này), hãy xem [Tìm kiếm Perplexity](/vi/tools/perplexity-search).
</Note>

| Thuộc tính       | Giá trị                                                                  |
| ---------------- | ------------------------------------------------------------------------ |
| Loại             | Nhà cung cấp tìm kiếm web (không phải nhà cung cấp mô hình)              |
| Xác thực         | `PERPLEXITY_API_KEY` (gốc) hoặc `OPENROUTER_API_KEY` (qua OpenRouter)    |
| Đường dẫn cấu hình | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| Ghi đè           | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`         |
| Lấy khóa         | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)     |

## Cài đặt Plugin

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Bắt đầu

<Steps>
  <Step title="Đặt khóa API">
    ```bash
    openclaw configure --section web
    ```

    Hoặc đặt khóa trực tiếp:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Khóa được xuất dưới dạng `PERPLEXITY_API_KEY` hoặc `OPENROUTER_API_KEY` trong
    môi trường Gateway cũng hoạt động.

  </Step>
  <Step title="Bắt đầu tìm kiếm">
    `web_search` tự động phát hiện Perplexity khi khóa của dịch vụ này là thông
    tin xác thực tìm kiếm khả dụng; không cần thiết lập thêm. Để chỉ định rõ nhà cung cấp:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## Chế độ tìm kiếm

Plugin xác định phương thức truyền tải theo thứ tự sau:

1. Đã đặt `webSearch.baseUrl` hoặc `webSearch.model`: luôn định tuyến qua tính năng hoàn tất trò chuyện Sonar đến điểm cuối đó, bất kể loại khóa.
2. Nếu không, nguồn khóa quyết định điểm cuối: tiền tố của khóa đã cấu hình chọn phương thức truyền tải (cấu hình được ưu tiên hơn biến môi trường); khóa môi trường sử dụng trực tiếp điểm cuối tương ứng.

| Tiền tố khóa | Phương thức truyền tải                                      | Tính năng                                           |
| ------------ | ----------------------------------------------------------- | --------------------------------------------------- |
| `pplx-`      | API Tìm kiếm Perplexity gốc (`https://api.perplexity.ai`)   | Kết quả có cấu trúc, bộ lọc miền/ngôn ngữ/ngày      |
| `sk-or-`     | OpenRouter (`https://openrouter.ai/api/v1`), mô hình Sonar  | Câu trả lời do AI tổng hợp kèm trích dẫn            |

Khóa đã cấu hình có bất kỳ tiền tố nào khác cũng sử dụng API Tìm kiếm gốc. Đường
dẫn hoàn tất trò chuyện mặc định sử dụng mô hình `perplexity/sonar-pro`; ghi đè
bằng `plugins.entries.perplexity.config.webSearch.model`.

## Lọc bằng API gốc

| Bộ lọc                              | Mô tả                                                                 | Phương thức truyền tải |
| ----------------------------------- | --------------------------------------------------------------------- | ---------------------- |
| `count`                             | Số kết quả mỗi lần tìm kiếm, 1–10 (mặc định là 5)                     | Chỉ API gốc            |
| `freshness`                         | Khoảng thời gian gần đây: `day`, `week`, `month`, `year`              | Cả hai                 |
| `country`                           | Mã quốc gia gồm 2 chữ cái (`us`, `de`, `jp`)                          | Chỉ API gốc            |
| `language`                          | Mã ngôn ngữ ISO 639-1 (`en`, `fr`, `zh`)                              | Chỉ API gốc            |
| `date_after` / `date_before`        | Khoảng ngày xuất bản theo định dạng `YYYY-MM-DD`                       | Chỉ API gốc            |
| `domain_filter`                     | Tối đa 20 miền; danh sách cho phép hoặc danh sách từ chối có tiền tố `-`, không bao giờ kết hợp | Chỉ API gốc |
| `max_tokens` / `max_tokens_per_page` | Ngân sách nội dung cho tất cả kết quả / mỗi trang                     | Chỉ API gốc            |

Các bộ lọc chỉ dành cho API gốc trả về lỗi mô tả rõ ràng trên đường dẫn hoàn tất
trò chuyện. Không thể kết hợp `freshness` với `date_after`/`date_before`.

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Biến môi trường cho tiến trình daemon">
    <Warning>
    Khóa chỉ được xuất trong shell tương tác sẽ không hiển thị với daemon Gateway
    của launchd/systemd, trừ khi môi trường đó được nhập rõ ràng. Đặt khóa trong
    `~/.openclaw/.env` hoặc qua `env.shellEnv` để tiến trình Gateway có thể đọc
    khóa. Xem [Biến môi trường](/vi/help/environment) để biết đầy đủ thứ tự ưu tiên.
    </Warning>
  </Accordion>

  <Accordion title="Thiết lập proxy OpenRouter">
    Để định tuyến các lượt tìm kiếm Perplexity qua OpenRouter, hãy đặt
    `OPENROUTER_API_KEY` (tiền tố `sk-or-`) thay cho khóa Perplexity gốc.
    OpenClaw phát hiện khóa và tự động chuyển sang phương thức truyền tải Sonar.
    Cách này hữu ích nếu bạn đã thiết lập thanh toán OpenRouter và muốn hợp nhất
    các nhà cung cấp tại đó.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Công cụ tìm kiếm Perplexity" href="/vi/tools/perplexity-search" icon="magnifying-glass">
    Cách tác nhân gọi tìm kiếm Perplexity và diễn giải kết quả.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Tham chiếu cấu hình đầy đủ, bao gồm các mục Plugin.
  </Card>
</CardGroup>
