---
read_when:
    - Bạn muốn sử dụng MiniMax cho web_search
    - Bạn cần khóa MiniMax Token Plan hoặc token OAuth
    - Bạn muốn hướng dẫn về máy chủ tìm kiếm MiniMax tại Trung Quốc/toàn cầu
summary: Tìm kiếm MiniMax qua API tìm kiếm của gói Token
title: Tìm kiếm MiniMax
x-i18n:
    generated_at: "2026-07-12T08:25:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw hỗ trợ MiniMax làm nhà cung cấp `web_search` thông qua API tìm kiếm MiniMax
Token Plan. API này trả về kết quả tìm kiếm có cấu trúc gồm tiêu đề, URL,
đoạn trích và các truy vấn liên quan.

## Lấy thông tin xác thực Token Plan

<Steps>
  <Step title="Tạo khóa">
    Tạo hoặc sao chép khóa MiniMax Token Plan từ
    [Nền tảng MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    Các thiết lập OAuth có thể dùng lại `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Lưu khóa">
    Đặt `MINIMAX_CODE_PLAN_KEY` trong môi trường Gateway hoặc cấu hình qua:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw cũng chấp nhận `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` và
`MINIMAX_API_KEY` làm bí danh biến môi trường, được kiểm tra theo thứ tự đó sau
`MINIMAX_CODE_PLAN_KEY`. `MINIMAX_API_KEY` phải trỏ đến thông tin xác thực
Token Plan đã bật tính năng tìm kiếm; các khóa API mô hình MiniMax thông thường có thể không được
điểm cuối tìm kiếm Token Plan chấp nhận.

## Cấu hình

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // không bắt buộc nếu đã đặt biến môi trường MiniMax Token Plan
            region: "global", // hoặc "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Phương án dùng môi trường:** đặt `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` hoặc `MINIMAX_API_KEY` trong môi trường Gateway.
Đối với bản cài đặt Gateway, hãy đặt biến này trong `~/.openclaw/.env`.

## Chọn khu vực

MiniMax Search sử dụng các điểm cuối sau:

- Toàn cầu: `https://api.minimax.io/v1/coding_plan/search`
- Trung Quốc: `https://api.minimaxi.com/v1/coding_plan/search`

Nếu chưa đặt `plugins.entries.minimax.config.webSearch.region`, OpenClaw sẽ xác định
khu vực theo thứ tự sau:

1. `tools.web.search.minimax.region` / `webSearch.region` do Plugin sở hữu
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Điều đó có nghĩa là quy trình thiết lập ban đầu cho khu vực Trung Quốc hoặc
`MINIMAX_API_HOST=https://api.minimaxi.com/...` cũng sẽ tự động duy trì MiniMax Search
trên máy chủ Trung Quốc.

Ngay cả khi bạn đã xác thực MiniMax qua đường dẫn OAuth `minimax-portal`,
tìm kiếm web vẫn đăng ký với mã định danh nhà cung cấp `minimax`; URL cơ sở của nhà cung cấp OAuth
được dùng làm gợi ý khu vực để chọn máy chủ Trung Quốc/toàn cầu, và `MINIMAX_OAUTH_TOKEN`
có thể đáp ứng thông tin xác thực bearer của MiniMax Search.

## Các tham số được hỗ trợ

| Tham số | Kiểu    | Ràng buộc       | Mô tả                                                                        |
| ------- | ------- | --------------- | ---------------------------------------------------------------------------- |
| `query` | chuỗi   | bắt buộc        | Chuỗi truy vấn tìm kiếm.                                                      |
| `count` | số nguyên | 1-10, mặc định 5 | Số lượng kết quả cần trả về. OpenClaw cắt ngắn danh sách trả về theo kích thước này. |

Hiện chưa hỗ trợ các bộ lọc dành riêng cho nhà cung cấp.

## Liên quan

- [Tổng quan về tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tính năng tự động phát hiện
- [MiniMax](/vi/providers/minimax) -- thiết lập mô hình, hình ảnh, giọng nói và xác thực
