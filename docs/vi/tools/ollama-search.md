---
read_when:
    - Bạn muốn sử dụng Ollama cho web_search
    - Bạn muốn một nhà cung cấp `web_search` không cần khóa API
    - Bạn muốn sử dụng Ollama Web Search được lưu trữ với OLLAMA_API_KEY
    - Bạn cần hướng dẫn thiết lập Ollama Web Search
summary: Tìm kiếm web bằng Ollama qua máy chủ Ollama cục bộ hoặc API Ollama được lưu trữ
title: Tìm kiếm web bằng Ollama
x-i18n:
    generated_at: "2026-07-12T08:25:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw hỗ trợ **Ollama Web Search** dưới dạng nhà cung cấp `web_search` tích hợp sẵn,
trả về tiêu đề, URL và đoạn trích từ API tìm kiếm web của Ollama.

Theo mặc định, Ollama cục bộ/tự lưu trữ không cần khóa API; hệ thống yêu cầu
máy chủ Ollama có thể truy cập được cùng với `ollama signin`. Tìm kiếm trực tiếp
trên dịch vụ lưu trữ (không dùng Ollama cục bộ) yêu cầu
`baseUrl: "https://ollama.com"` và `OLLAMA_API_KEY` hợp lệ.

## Thiết lập

<Steps>
  <Step title="Khởi động Ollama">
    Đảm bảo Ollama đã được cài đặt và đang chạy.
  </Step>
  <Step title="Đăng nhập">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Chọn Ollama Web Search">
    ```bash
    openclaw configure --section web
    ```

    Chọn **Ollama Web Search** làm nhà cung cấp.

  </Step>
</Steps>

Nếu bạn đã sử dụng Ollama cho các mô hình, Ollama Web Search sẽ dùng lại máy chủ
đã được cấu hình đó.

<Note>
  OpenClaw không bao giờ tự động chọn Ollama Web Search thay cho nhà cung cấp
  dùng thông tin xác thực có mức ưu tiên cao hơn; bạn phải chọn rõ ràng bằng
  `tools.web.search.provider: "ollama"`.
</Note>

## Cấu hình

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Tùy chọn ghi đè máy chủ, chỉ áp dụng cho tìm kiếm web:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

Hoặc dùng lại máy chủ đã được cấu hình cho nhà cung cấp mô hình Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

`models.providers.ollama.baseUrl` là khóa chuẩn; nhà cung cấp tìm kiếm web
cũng chấp nhận `baseURL` tại đó để tương thích với các ví dụ cấu hình theo kiểu
OpenAI SDK. Nếu không thiết lập gì, OpenClaw mặc định sử dụng
`http://127.0.0.1:11434`.

Ollama Web Search được lưu trữ trực tiếp (không dùng Ollama cục bộ):

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Xác thực và định tuyến yêu cầu

- Không có trường khóa API dành riêng cho tìm kiếm web; nhà cung cấp dùng lại
  `models.providers.ollama.apiKey` (hoặc thông tin xác thực của nhà cung cấp tương ứng
  được cấp qua biến môi trường) khi máy chủ đã cấu hình được bảo vệ bằng xác thực.
- Thứ tự phân giải máy chủ: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl` (hoặc `baseURL`) → `http://127.0.0.1:11434`.
- Nếu máy chủ đã phân giải là `https://ollama.com`, OpenClaw gọi trực tiếp
  `https://ollama.com/api/web_search` với khóa API dùng làm thông tin xác thực
  bearer.
- Nếu không, trước tiên OpenClaw gọi điểm cuối proxy cục bộ
  `/api/experimental/web_search` (điểm cuối này ký và chuyển tiếp đến Ollama
  Cloud), sau đó chuyển sang `/api/web_search` trên cùng máy chủ nếu lần gọi đầu
  thất bại. Nếu cả hai đều thất bại và `OLLAMA_API_KEY` đã được đặt, hệ thống thử
  lại một lần với `https://ollama.com/api/web_search` bằng khóa đó — mà không gửi
  khóa đến máy chủ cục bộ.
- OpenClaw cảnh báo trong quá trình thiết lập nếu không thể truy cập Ollama hoặc
  chưa đăng nhập, nhưng không ngăn việc chọn nhà cung cấp.

## Liên quan

- [Tổng quan về tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tính năng tự động phát hiện
- [Ollama](/vi/providers/ollama) -- thiết lập mô hình Ollama và các chế độ đám mây/cục bộ
