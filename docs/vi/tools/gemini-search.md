---
read_when:
    - Bạn muốn sử dụng Gemini cho web_search
    - Bạn cần `GEMINI_API_KEY` hoặc `models.providers.google.apiKey`
    - Bạn muốn sử dụng tính năng định căn cứ bằng Google Search
summary: Tìm kiếm trên web bằng Gemini với nền tảng Google Search
title: Tìm kiếm Gemini
x-i18n:
    generated_at: "2026-07-12T08:26:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw hỗ trợ các mô hình Gemini với tính năng
[đối chiếu Google Search](https://ai.google.dev/gemini-api/docs/grounding) tích hợp sẵn,
trả về các câu trả lời do AI tổng hợp, được hỗ trợ bởi kết quả Google Search trực tiếp
kèm trích dẫn.

## Lấy khóa API

<Steps>
  <Step title="Tạo khóa">
    Truy cập [Google AI Studio](https://aistudio.google.com/apikey) và tạo một
    khóa API.
  </Step>
  <Step title="Lưu khóa">
    Đặt `GEMINI_API_KEY` trong môi trường Gateway, sử dụng lại
    `models.providers.google.apiKey`, hoặc cấu hình một khóa tìm kiếm web chuyên dụng bằng:

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
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // không bắt buộc nếu đã đặt GEMINI_API_KEY hoặc models.providers.google.apiKey
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // không bắt buộc; dùng models.providers.google.baseUrl làm phương án dự phòng
            model: "gemini-2.5-flash", // mặc định
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**Thứ tự ưu tiên thông tin xác thực:** Tìm kiếm web Gemini sử dụng
`plugins.entries.google.config.webSearch.apiKey` trước tiên, sau đó là `GEMINI_API_KEY`,
rồi đến `models.providers.google.apiKey`. Đối với URL cơ sở,
`plugins.entries.google.config.webSearch.baseUrl` chuyên dụng được ưu tiên hơn
`models.providers.google.baseUrl`.

Đối với bản cài đặt Gateway, hãy đặt các khóa môi trường trong `~/.openclaw/.env`.

## Cách hoạt động

Không giống các nhà cung cấp tìm kiếm truyền thống trả về danh sách liên kết và đoạn trích,
Gemini sử dụng tính năng đối chiếu Google Search để tạo các câu trả lời do AI tổng hợp
kèm trích dẫn nội tuyến. Kết quả bao gồm cả câu trả lời tổng hợp và các URL nguồn.

- URL trích dẫn từ tính năng đối chiếu của Gemini được tự động phân giải từ URL
  chuyển hướng của Google thành URL trực tiếp thông qua yêu cầu HEAD đi qua đường dẫn
  truy xuất có cơ chế bảo vệ SSRF của OpenClaw (theo dõi chuyển hướng, xác thực http/https).
- Quá trình phân giải chuyển hướng sử dụng các giá trị mặc định SSRF nghiêm ngặt, vì vậy
  các chuyển hướng đến đích riêng tư/nội bộ sẽ bị chặn.

## Tham số được hỗ trợ

Tìm kiếm Gemini hỗ trợ `query`, `freshness`, `date_after` và `date_before`.

`count` được chấp nhận để tương thích với `web_search` dùng chung, nhưng tính năng đối chiếu
của Gemini vẫn trả về một câu trả lời tổng hợp kèm trích dẫn thay vì danh sách
N kết quả.

`freshness` chấp nhận `day`, `week`, `month`, `year` và các dạng viết tắt dùng chung
`pd`, `pw`, `pm` và `py`. `day`/`pd` thêm chỉ dẫn về độ mới vào truy vấn Gemini
thay vì áp dụng khoảng thời gian cố định 24 giờ. `week`, `month`, `year` và các khoảng
`date_after`/`date_before` tường minh sẽ thiết lập `timeRangeFilter` của tính năng
đối chiếu Google Search trong Gemini. `country`, `language` và `domain_filter` không được hỗ trợ.

## Lựa chọn mô hình

Mô hình mặc định là `gemini-2.5-flash` (nhanh và tiết kiệm chi phí). Có thể sử dụng
bất kỳ mô hình Gemini nào hỗ trợ tính năng đối chiếu thông qua
`plugins.entries.google.config.webSearch.model`.

## Ghi đè URL cơ sở

Đặt `plugins.entries.google.config.webSearch.baseUrl` khi tìm kiếm web Gemini
phải được định tuyến qua proxy của đơn vị vận hành hoặc điểm cuối tùy chỉnh tương thích với Gemini.
Nếu giá trị này chưa được đặt, tìm kiếm web Gemini sẽ sử dụng lại
`models.providers.google.baseUrl`. Giá trị thuần
`https://generativelanguage.googleapis.com` được chuẩn hóa thành
`https://generativelanguage.googleapis.com/v1beta`; các đường dẫn proxy tùy chỉnh được giữ nguyên
như đã cung cấp sau khi loại bỏ dấu gạch chéo ở cuối.

## Liên quan

- [Tổng quan về tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tính năng tự động phát hiện
- [Brave Search](/vi/tools/brave-search) -- kết quả có cấu trúc kèm đoạn trích
- [Perplexity Search](/vi/tools/perplexity-search) -- kết quả có cấu trúc + trích xuất nội dung
