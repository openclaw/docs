---
read_when:
    - Bạn muốn sử dụng Kimi cho web_search
    - Bạn cần có `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY`
summary: Tìm kiếm web Kimi thông qua tìm kiếm web Moonshot
title: Tìm kiếm Kimi
x-i18n:
    generated_at: "2026-07-12T08:30:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi là nhà cung cấp `web_search` sử dụng tính năng tìm kiếm web gốc của Moonshot. Thay vì trả về danh sách kết quả được xếp hạng, Moonshot tổng hợp một câu trả lời kèm trích dẫn nội tuyến, tương tự các nhà cung cấp câu trả lời có căn cứ của Gemini và Grok.

## Thiết lập

<Steps>
  <Step title="Tạo khóa">
    Lấy khóa API từ [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Lưu khóa">
    Đặt `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY` trong môi trường Gateway (đối với bản cài đặt Gateway, hãy thêm biến này vào `~/.openclaw/.env`), hoặc cấu hình bằng:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Việc chọn **Kimi** trong `openclaw onboard` hoặc `openclaw configure --section web` cũng sẽ yêu cầu nhập:

- khu vực API của Moonshot: `https://api.moonshot.ai/v1` hoặc `https://api.moonshot.cn/v1`
- mô hình tìm kiếm web (mặc định là `kimi-k2.6`)

## Cấu hình

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // không bắt buộc nếu đã đặt KIMI_API_KEY hoặc MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Khi bỏ qua `tools.web.search.provider`, hệ thống sẽ tự động phát hiện giá trị này dựa trên các khóa API hiện có; hãy đặt rõ thành `kimi` nếu đã cấu hình thông tin xác thực cho nhiều dịch vụ tìm kiếm.

Dạng có phạm vi tương đương trong `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`) cũng hoạt động; cả hai cấu trúc đều được hợp nhất thành cùng một cấu hình đã phân giải.

Giá trị mặc định: khi bỏ qua, `baseUrl` mặc định là `https://api.moonshot.ai/v1` và `model` mặc định là `kimi-k2.6`.

Nếu lưu lượng trò chuyện sử dụng máy chủ tại Trung Quốc (`models.providers.moonshot.baseUrl`: `https://api.moonshot.cn/v1`), `web_search` của Kimi sẽ tự động sử dụng lại máy chủ đó khi chưa đặt `baseUrl` riêng. Nhờ vậy, các khóa `.cn` không vô tình được gửi đến điểm cuối quốc tế (nơi trả về HTTP 401 đối với những khóa này). Hãy đặt rõ `baseUrl` cho Kimi để ghi đè cơ chế kế thừa này.

## Yêu cầu về căn cứ

OpenClaw chỉ trả về kết quả `web_search` của Kimi sau khi phản hồi của Moonshot chứa bằng chứng làm căn cứ từ tìm kiếm web gốc, chẳng hạn như bản phát lại lệnh gọi công cụ `$web_search`, `search_results` hoặc các URL trích dẫn. Nếu Kimi trả lời trực tiếp mà không có căn cứ (ví dụ: “Tôi không thể duyệt internet”), OpenClaw sẽ trả về lỗi `kimi_web_search_ungrounded` thay vì coi văn bản đó là kết quả tìm kiếm. Hãy thử lại truy vấn, chuyển sang nhà cung cấp có cấu trúc như Brave hoặc sử dụng `web_fetch` / công cụ trình duyệt khi bạn đã có URL đích.

## Tham số công cụ

| Tham số                                                        | Hỗ trợ                                                                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `query`                                                        | Có                                                                                                                               |
| `count`                                                        | Được chấp nhận để tương thích giữa các nhà cung cấp nhưng bị bỏ qua: Kimi luôn trả về một câu trả lời tổng hợp, không phải danh sách N kết quả |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Không                                                                                                                             |

## Liên quan

- [Tổng quan về tìm kiếm web](/vi/tools/web) - tất cả nhà cung cấp và tính năng tự động phát hiện
- [Moonshot AI](/vi/providers/moonshot) - tài liệu về mô hình Moonshot và nhà cung cấp Kimi Coding
- [Tìm kiếm Gemini](/vi/tools/gemini-search) - câu trả lời do AI tổng hợp với căn cứ từ Google
- [Tìm kiếm Grok](/vi/tools/grok-search) - câu trả lời do AI tổng hợp với căn cứ từ xAI
