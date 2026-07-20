---
read_when:
    - Bạn muốn sử dụng MiniMax cho web_search
    - Bạn cần khóa MiniMax Token Plan hoặc token OAuth
    - Bạn cần hướng dẫn về máy chủ tìm kiếm MiniMax CN/toàn cầu
summary: Tìm kiếm MiniMax qua API tìm kiếm của Token Plan
title: Tìm kiếm MiniMax
x-i18n:
    generated_at: "2026-07-20T04:44:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb851614bbe43f011e07fe3e80d5390f1ba515f3e00ba749c91999617ad2d1e2
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
    Thiết lập OAuth có thể sử dụng lại `MINIMAX_OAUTH_TOKEN`.
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
Token Plan đã bật tính năng tìm kiếm; endpoint tìm kiếm Token Plan có thể không chấp nhận
các khóa API mô hình MiniMax thông thường.

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

**Phương án dùng biến môi trường:** đặt `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` hoặc `MINIMAX_API_KEY` trong môi trường Gateway.
Đối với bản cài đặt gateway, hãy đặt biến đó trong `~/.openclaw/.env`.

## Chọn khu vực

MiniMax Search sử dụng các endpoint sau:

- Toàn cầu: `https://api.minimax.io/v1/coding_plan/search`
- Trung Quốc: `https://api.minimaxi.com/v1/coding_plan/search`

Nếu chưa đặt `plugins.entries.minimax.config.webSearch.region`, OpenClaw xác định
khu vực theo thứ tự sau:

1. `webSearch.region` do Plugin sở hữu
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Điều đó có nghĩa là quy trình thiết lập ban đầu cho Trung Quốc hoặc `MINIMAX_API_HOST=https://api.minimaxi.com/...`
cũng tự động duy trì MiniMax Search trên máy chủ Trung Quốc.

Ngay cả khi đã xác thực MiniMax qua đường dẫn OAuth `minimax-portal`,
tìm kiếm web vẫn được đăng ký với ID nhà cung cấp `minimax`; URL cơ sở của nhà cung cấp OAuth
được dùng làm gợi ý khu vực để chọn máy chủ Trung Quốc/toàn cầu, và `MINIMAX_OAUTH_TOKEN`
có thể đáp ứng thông tin xác thực bearer cho MiniMax Search.

## Tham số được hỗ trợ

| Tham số | Kiểu    | Ràng buộc     | Mô tả                                                                 |
| --------- | ------- | --------------- | --------------------------------------------------------------------------- |
| `query`   | chuỗi  | bắt buộc        | Chuỗi truy vấn tìm kiếm.                                                        |
| `count`   | số nguyên | 1-10, mặc định 5 | Số lượng kết quả cần trả về. OpenClaw cắt danh sách trả về theo kích thước này. |

Hiện chưa hỗ trợ các bộ lọc dành riêng cho nhà cung cấp.

## Liên quan

- [Tổng quan về tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tính năng tự động phát hiện
- [MiniMax](/vi/providers/minimax) -- thiết lập mô hình, hình ảnh, giọng nói và xác thực
