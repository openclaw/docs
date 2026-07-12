---
read_when:
    - Bạn muốn sử dụng Exa cho web_search
    - Bạn cần có `EXA_API_KEY`
    - Bạn muốn tìm kiếm bằng mạng nơ-ron hoặc trích xuất nội dung
summary: Tìm kiếm Exa AI -- tìm kiếm ngữ nghĩa và từ khóa kèm trích xuất nội dung
title: Tìm kiếm Exa
x-i18n:
    generated_at: "2026-07-12T08:23:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) là nhà cung cấp `web_search` với các chế độ tìm kiếm
nơ-ron, từ khóa và kết hợp, cùng khả năng trích xuất nội dung tích hợp sẵn
(phần nổi bật, văn bản, bản tóm tắt).

## Cài đặt Plugin

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## Lấy khóa API

<Steps>
  <Step title="Tạo tài khoản">
    Đăng ký tại [exa.ai](https://exa.ai/) và tạo khóa API từ bảng điều khiển
    của bạn.
  </Step>
  <Step title="Lưu khóa">
    Đặt `EXA_API_KEY` trong môi trường Gateway hoặc cấu hình bằng:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Cấu hình

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // không bắt buộc nếu đã đặt EXA_API_KEY
            baseUrl: "https://api.exa.ai", // không bắt buộc; OpenClaw nối thêm /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Phương án thay thế bằng biến môi trường:** đặt `EXA_API_KEY` trong môi trường Gateway. Đối với
bản cài đặt Gateway, hãy đặt biến này trong `~/.openclaw/.env`. Xem
[Biến môi trường](/vi/help/faq#env-vars-and-env-loading).

## Ghi đè URL cơ sở

Đặt `plugins.entries.exa.config.webSearch.baseUrl` để định tuyến các yêu cầu
tìm kiếm Exa qua một proxy tương thích hoặc điểm cuối thay thế. OpenClaw
chuẩn hóa các máy chủ không có giao thức bằng cách thêm `https://` vào đầu và nối thêm `/search`, trừ khi
đường dẫn đã kết thúc bằng phần này. Điểm cuối đã phân giải là một phần của khóa bộ nhớ đệm
tìm kiếm, vì vậy kết quả từ các điểm cuối khác nhau không bao giờ được dùng chung.

## Tham số công cụ

<ParamField path="query" type="string" required>
Truy vấn tìm kiếm.
</ParamField>

<ParamField path="count" type="number" default="5">
Số kết quả trả về (1-100, tùy thuộc vào giới hạn của loại tìm kiếm Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Chế độ tìm kiếm.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Bộ lọc thời gian. Không thể kết hợp với `date_after`/`date_before`.
</ParamField>

<ParamField path="date_after" type="string">
Các kết quả sau ngày này (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Các kết quả trước ngày này (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Các tùy chọn trích xuất nội dung (xem bên dưới).
</ParamField>

### Trích xuất nội dung

Truyền một đối tượng `contents` để kiểm soát nội dung được trích xuất trong kết quả:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // toàn bộ văn bản của trang
    highlights: { numSentences: 3 }, // các câu chính
    summary: true, // bản tóm tắt bằng AI
  },
});
```

| Tùy chọn nội dung | Kiểu                                                                  | Mô tả                    |
| ----------------- | --------------------------------------------------------------------- | ------------------------ |
| `text`            | `boolean \| { maxCharacters }`                                        | Trích xuất toàn bộ văn bản của trang |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Trích xuất các câu chính |
| `summary`         | `boolean \| { query }`                                                | Bản tóm tắt do AI tạo    |

Nếu bỏ qua `contents`, Exa mặc định sử dụng `{ highlights: true }` để kết quả
bao gồm các đoạn trích chứa câu chính. Phần mô tả kết quả được lấy lần lượt từ phần nổi bật,
sau đó là bản tóm tắt, rồi toàn bộ văn bản -- tùy nội dung nào khả dụng trước. Kết quả
cũng giữ nguyên các trường `highlightScores` và `summary` thô từ phản hồi API Exa
khi có.

### Chế độ tìm kiếm

| Chế độ           | Mô tả                                      |
| ---------------- | ------------------------------------------ |
| `auto`           | Exa chọn chế độ tốt nhất (mặc định)        |
| `neural`         | Tìm kiếm theo ngữ nghĩa/ý nghĩa            |
| `fast`           | Tìm kiếm nhanh theo từ khóa                 |
| `deep`           | Tìm kiếm sâu và toàn diện                   |
| `deep-reasoning` | Tìm kiếm sâu có suy luận                    |
| `instant`        | Kết quả nhanh nhất                          |

## Lưu ý

- `count` chấp nhận tối đa 100, tùy thuộc vào giới hạn của loại tìm kiếm Exa.
- Theo mặc định, kết quả được lưu vào bộ nhớ đệm trong 15 phút. Cấu hình các tùy chọn dùng chung
  `tools.web.search.cacheTtlMinutes` (phút) và
  `tools.web.search.timeoutSeconds` (mặc định 30 giây) để thay đổi thời gian lưu vào bộ nhớ đệm và
  thời gian chờ yêu cầu cho tất cả nhà cung cấp `web_search`, bao gồm Exa.

## Liên quan

- [Tổng quan về tìm kiếm trên web](/vi/tools/web) -- tất cả nhà cung cấp và khả năng tự động phát hiện
- [Brave Search](/vi/tools/brave-search) -- kết quả có cấu trúc với bộ lọc quốc gia/ngôn ngữ
- [Perplexity Search](/vi/tools/perplexity-search) -- kết quả có cấu trúc với bộ lọc miền
