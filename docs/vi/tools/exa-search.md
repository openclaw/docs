---
read_when:
    - Bạn muốn sử dụng Exa cho web_search
    - Bạn cần có EXA_API_KEY
    - Bạn muốn tìm kiếm bằng mạng nơ-ron hoặc trích xuất nội dung
summary: Tìm kiếm Exa AI -- tìm kiếm bằng mạng nơ-ron và từ khóa với trích xuất nội dung
title: Tìm kiếm Exa
x-i18n:
    generated_at: "2026-04-29T23:18:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw hỗ trợ [Exa AI](https://exa.ai/) làm nhà cung cấp `web_search`. Exa
cung cấp các chế độ tìm kiếm neural, từ khóa và kết hợp với tính năng trích xuất
nội dung tích hợp sẵn (đoạn nổi bật, văn bản, tóm tắt).

## Lấy khóa API

<Steps>
  <Step title="Tạo tài khoản">
    Đăng ký tại [exa.ai](https://exa.ai/) và tạo khóa API từ bảng điều khiển của
    bạn.
  </Step>
  <Step title="Lưu khóa">
    Đặt `EXA_API_KEY` trong môi trường Gateway, hoặc cấu hình qua:

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
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

**Phương án môi trường thay thế:** đặt `EXA_API_KEY` trong môi trường Gateway.
Đối với bản cài đặt gateway, hãy đặt khóa này trong `~/.openclaw/.env`.

## Tham số công cụ

<ParamField path="query" type="string" required>
Truy vấn tìm kiếm.
</ParamField>

<ParamField path="count" type="number">
Số kết quả cần trả về (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Chế độ tìm kiếm.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Bộ lọc thời gian.
</ParamField>

<ParamField path="date_after" type="string">
Kết quả sau ngày này (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Kết quả trước ngày này (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Tùy chọn trích xuất nội dung (xem bên dưới).
</ParamField>

### Trích xuất nội dung

Exa có thể trả về nội dung đã trích xuất cùng với kết quả tìm kiếm. Truyền một
đối tượng `contents` để bật:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| Tùy chọn nội dung | Kiểu                                                                  | Mô tả                              |
| ----------------- | --------------------------------------------------------------------- | ---------------------------------- |
| `text`            | `boolean \| { maxCharacters }`                                        | Trích xuất toàn bộ văn bản trang   |
| `highlights`      | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Trích xuất các câu chính           |
| `summary`         | `boolean \| { query }`                                                | Tóm tắt do AI tạo                  |

### Chế độ tìm kiếm

| Chế độ           | Mô tả                                      |
| ---------------- | ------------------------------------------ |
| `auto`           | Exa chọn chế độ tốt nhất (mặc định)        |
| `neural`         | Tìm kiếm ngữ nghĩa/dựa trên ý nghĩa        |
| `fast`           | Tìm kiếm từ khóa nhanh                     |
| `deep`           | Tìm kiếm sâu kỹ lưỡng                      |
| `deep-reasoning` | Tìm kiếm sâu có suy luận                   |
| `instant`        | Kết quả nhanh nhất                         |

## Ghi chú

- Nếu không cung cấp tùy chọn `contents`, Exa mặc định dùng `{ highlights: true }`
  để kết quả bao gồm các đoạn trích câu chính
- Kết quả giữ lại các trường `highlightScores` và `summary` từ phản hồi API của
  Exa khi có
- Mô tả kết quả được lấy từ đoạn nổi bật trước, rồi đến tóm tắt, rồi đến toàn bộ
  văn bản — tùy nội dung nào có sẵn
- Không thể kết hợp `freshness` và `date_after`/`date_before` — hãy dùng một chế
  độ lọc thời gian
- Có thể trả về tối đa 100 kết quả cho mỗi truy vấn (tùy thuộc vào giới hạn loại
  tìm kiếm của Exa)
- Kết quả được lưu vào bộ nhớ đệm trong 15 phút theo mặc định (có thể cấu hình qua
  `cacheTtlMinutes`)
- Exa là một tích hợp API chính thức với phản hồi JSON có cấu trúc

## Liên quan

- [Tổng quan Tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Brave Search](/vi/tools/brave-search) -- kết quả có cấu trúc với bộ lọc quốc gia/ngôn ngữ
- [Perplexity Search](/vi/tools/perplexity-search) -- kết quả có cấu trúc với lọc theo miền
