---
read_when:
    - Bạn muốn sử dụng MiniMax cho web_search
    - Bạn cần khóa MiniMax Token Plan hoặc mã thông báo OAuth
    - Bạn muốn hướng dẫn về máy chủ tìm kiếm CN/toàn cầu của MiniMax
summary: Tìm kiếm MiniMax thông qua API tìm kiếm Token Plan
title: Tìm kiếm MiniMax
x-i18n:
    generated_at: "2026-05-02T10:55:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw hỗ trợ MiniMax làm nhà cung cấp `web_search` thông qua API tìm kiếm MiniMax
Token Plan. API này trả về các kết quả tìm kiếm có cấu trúc gồm tiêu đề, URL,
đoạn trích và truy vấn liên quan.

## Lấy thông tin xác thực Token Plan

<Steps>
  <Step title="Tạo khóa">
    Tạo hoặc sao chép khóa MiniMax Token Plan từ
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    Các thiết lập OAuth có thể dùng lại `MINIMAX_OAUTH_TOKEN`.
  </Step>
  <Step title="Lưu khóa">
    Đặt `MINIMAX_CODE_PLAN_KEY` trong môi trường Gateway, hoặc cấu hình qua:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw cũng chấp nhận `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` và
`MINIMAX_API_KEY` làm bí danh biến môi trường. `MINIMAX_API_KEY` nên trỏ tới
thông tin xác thực Token Plan đã bật tìm kiếm; các khóa API mô hình MiniMax
thông thường có thể không được điểm cuối tìm kiếm Token Plan chấp nhận.

## Cấu hình

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
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

**Phương án môi trường thay thế:** đặt `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` hoặc `MINIMAX_API_KEY` trong môi trường Gateway.
Đối với bản cài đặt Gateway, hãy đặt biến đó trong `~/.openclaw/.env`.

## Chọn khu vực

MiniMax Search sử dụng các điểm cuối sau:

- Toàn cầu: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Nếu `plugins.entries.minimax.config.webSearch.region` chưa được đặt, OpenClaw phân giải
khu vực theo thứ tự sau:

1. `tools.web.search.minimax.region` / `webSearch.region` do plugin sở hữu
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Điều đó có nghĩa là quá trình thiết lập CN hoặc `MINIMAX_API_HOST=https://api.minimaxi.com/...`
sẽ tự động giữ MiniMax Search trên máy chủ CN.

Ngay cả khi bạn đã xác thực MiniMax qua đường dẫn OAuth `minimax-portal`,
tìm kiếm web vẫn được đăng ký với id nhà cung cấp là `minimax`; URL cơ sở của nhà cung cấp OAuth
được dùng làm gợi ý khu vực để chọn máy chủ CN/toàn cầu, và `MINIMAX_OAUTH_TOKEN`
có thể đáp ứng thông tin xác thực bearer của MiniMax Search.

## Tham số được hỗ trợ

MiniMax Search hỗ trợ:

- `query`
- `count` (OpenClaw cắt danh sách kết quả trả về theo số lượng được yêu cầu)

Hiện chưa hỗ trợ các bộ lọc riêng theo nhà cung cấp.

## Liên quan

- [Tổng quan Tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [MiniMax](/vi/providers/minimax) -- thiết lập mô hình, hình ảnh, giọng nói và xác thực
