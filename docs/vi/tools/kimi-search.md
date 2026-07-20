---
read_when:
    - Bạn muốn sử dụng Kimi cho web_search
    - Bạn cần có KIMI_API_KEY hoặc MOONSHOT_API_KEY
summary: Tìm kiếm web Kimi qua tìm kiếm web Moonshot
title: Tìm kiếm Kimi
x-i18n:
    generated_at: "2026-07-20T04:32:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 65e5f8c9f3b607dbcc3256c51a6a083864e31f65ed2a751d2d500abeb35ba844
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi là nhà cung cấp `web_search` được hỗ trợ bởi tính năng tìm kiếm web gốc của Moonshot. Moonshot
tổng hợp một câu trả lời kèm trích dẫn nội tuyến, tương tự các nhà cung cấp
phản hồi có căn cứ của Gemini và Grok, thay vì trả về danh sách kết quả được xếp hạng.

## Thiết lập

<Steps>
  <Step title="Tạo khóa">
    Lấy khóa API từ [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Lưu trữ khóa">
    Đặt `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY` trong môi trường Gateway (đối với bản
    cài đặt gateway, hãy thêm vào `~/.openclaw/.env`), hoặc cấu hình qua:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Việc chọn **Kimi** trong `openclaw onboard` hoặc `openclaw configure --section web`
cũng sẽ yêu cầu:

- khu vực API Moonshot: `https://api.moonshot.ai/v1` hoặc `https://api.moonshot.cn/v1`
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

`tools.web.search.provider` được tự động phát hiện từ các khóa API hiện có khi bị bỏ qua;
hãy đặt rõ thành `kimi` nếu đã cấu hình nhiều thông tin xác thực tìm kiếm.

Cấu hình các giá trị `apiKey`, `baseUrl` và `model` dành riêng cho Kimi trong
`plugins.entries.moonshot.config.webSearch`.

Giá trị mặc định: `baseUrl` mặc định là `https://api.moonshot.ai/v1` khi bị bỏ qua, `model`
mặc định là `kimi-k2.6`.

Nếu lưu lượng trò chuyện sử dụng máy chủ tại Trung Quốc (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), `web_search` của Kimi sẽ tự động dùng lại máy chủ đó
khi `baseUrl` riêng chưa được đặt, để các khóa `.cn` không vô tình truy cập
điểm cuối quốc tế (điểm cuối này trả về HTTP 401 cho các khóa đó). Hãy đặt rõ
`baseUrl` của Kimi để ghi đè cơ chế kế thừa này.

## Yêu cầu về căn cứ

OpenClaw chỉ trả về kết quả `web_search` của Kimi sau khi phản hồi của Moonshot
bao gồm bằng chứng căn cứ từ tìm kiếm web gốc, chẳng hạn như bản phát lại lệnh gọi công cụ
`$web_search`, `search_results` hoặc URL trích dẫn. Nếu Kimi trả lời trực tiếp mà không có
căn cứ (ví dụ: "Tôi không thể duyệt internet"), OpenClaw sẽ trả về lỗi
`kimi_web_search_ungrounded` thay vì coi văn bản đó là kết quả tìm kiếm.
Hãy thử lại truy vấn, chuyển sang nhà cung cấp có cấu trúc như Brave, hoặc sử dụng
`web_fetch` / công cụ trình duyệt khi bạn đã có URL đích.

## Tham số công cụ

| Tham số                                                       | Được hỗ trợ                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | Có                                                                                                                      |
| `count`                                                         | Được chấp nhận để tương thích giữa các nhà cung cấp nhưng bị bỏ qua: Kimi luôn trả về một câu trả lời tổng hợp, không phải danh sách N kết quả |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Không                                                                                                                       |

## Liên quan

- [Tổng quan về Tìm kiếm web](/vi/tools/web) - tất cả nhà cung cấp và tính năng tự động phát hiện
- [Moonshot AI](/vi/providers/moonshot) - tài liệu về mô hình Moonshot + nhà cung cấp Kimi Coding
- [Tìm kiếm Gemini](/vi/tools/gemini-search) - câu trả lời do AI tổng hợp thông qua căn cứ của Google
- [Tìm kiếm Grok](/vi/tools/grok-search) - câu trả lời do AI tổng hợp thông qua căn cứ của xAI
