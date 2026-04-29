---
read_when:
    - Bạn muốn sử dụng MiniMax cho web_search
    - Bạn cần một khóa MiniMax Coding Plan
    - Bạn muốn hướng dẫn về máy chủ tìm kiếm CN/toàn cầu của MiniMax
summary: Tìm kiếm MiniMax qua API tìm kiếm của Coding Plan
title: Tìm kiếm MiniMax
x-i18n:
    generated_at: "2026-04-29T23:20:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw hỗ trợ MiniMax làm nhà cung cấp `web_search` thông qua API tìm kiếm MiniMax
Coding Plan. API này trả về kết quả tìm kiếm có cấu trúc với tiêu đề, URL,
đoạn trích và truy vấn liên quan.

## Lấy khóa Coding Plan

<Steps>
  <Step title="Tạo khóa">
    Tạo hoặc sao chép khóa MiniMax Coding Plan từ
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Lưu khóa">
    Đặt `MINIMAX_CODE_PLAN_KEY` trong môi trường Gateway, hoặc cấu hình qua:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw cũng chấp nhận `MINIMAX_CODING_API_KEY` làm bí danh env. `MINIMAX_API_KEY`
vẫn được đọc làm phương án tương thích dự phòng khi khóa này đã trỏ đến token coding-plan.

## Cấu hình

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if MINIMAX_CODE_PLAN_KEY is set
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

**Phương án môi trường thay thế:** đặt `MINIMAX_CODE_PLAN_KEY` trong môi trường Gateway.
Với bản cài đặt gateway, đặt khóa này trong `~/.openclaw/.env`.

## Chọn khu vực

MiniMax Search sử dụng các endpoint này:

- Toàn cầu: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Nếu `plugins.entries.minimax.config.webSearch.region` chưa được đặt, OpenClaw phân giải
khu vực theo thứ tự này:

1. `tools.web.search.minimax.region` / `webSearch.region` do plugin sở hữu
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Điều đó có nghĩa là quy trình onboarding CN hoặc `MINIMAX_API_HOST=https://api.minimaxi.com/...`
cũng tự động giữ MiniMax Search trên máy chủ CN.

Ngay cả khi bạn đã xác thực MiniMax qua đường dẫn OAuth `minimax-portal`,
tìm kiếm web vẫn được đăng ký với id nhà cung cấp `minimax`; URL cơ sở của nhà cung cấp OAuth
chỉ được dùng làm gợi ý khu vực để chọn máy chủ CN/toàn cầu.

## Tham số được hỗ trợ

MiniMax Search hỗ trợ:

- `query`
- `count` (OpenClaw cắt danh sách kết quả trả về theo số lượng được yêu cầu)

Bộ lọc riêng của nhà cung cấp hiện chưa được hỗ trợ.

## Liên quan

- [Tổng quan về Tìm kiếm Web](/vi/tools/web) -- tất cả nhà cung cấp và tính năng tự động phát hiện
- [MiniMax](/vi/providers/minimax) -- thiết lập mô hình, hình ảnh, giọng nói và xác thực
