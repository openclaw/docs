---
read_when:
    - Bạn muốn sử dụng Ollama cho web_search
    - Bạn muốn một nhà cung cấp web_search không cần khóa
    - Bạn muốn sử dụng Ollama Web Search được lưu trữ với OLLAMA_API_KEY
    - Bạn cần hướng dẫn thiết lập Ollama Web Search
summary: Tìm kiếm web Ollama qua máy chủ Ollama cục bộ hoặc API Ollama được lưu trữ
title: Tìm kiếm web Ollama
x-i18n:
    generated_at: "2026-06-27T18:17:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw hỗ trợ **Ollama Web Search** như một nhà cung cấp `web_search` được tích hợp sẵn. Nó
sử dụng API tìm kiếm web của Ollama và trả về kết quả có cấu trúc gồm tiêu đề, URL,
và đoạn trích.

Đối với Ollama cục bộ hoặc tự lưu trữ, thiết lập này mặc định không cần khóa API.
Nó yêu cầu:

- một máy chủ Ollama mà OpenClaw có thể truy cập được
- `ollama signin`

Đối với tìm kiếm lưu trữ trực tiếp, hãy đặt URL cơ sở của nhà cung cấp Ollama thành `https://ollama.com`
và cung cấp một `OLLAMA_API_KEY` thật.

## Thiết lập

<Steps>
  <Step title="Khởi động Ollama">
    Đảm bảo Ollama đã được cài đặt và đang chạy.
  </Step>
  <Step title="Đăng nhập">
    Chạy:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Chọn Ollama Web Search">
    Chạy:

    ```bash
    openclaw configure --section web
    ```

    Sau đó chọn **Ollama Web Search** làm nhà cung cấp.

  </Step>
</Steps>

Nếu bạn đã dùng Ollama cho các mô hình, Ollama Web Search sẽ tái sử dụng cùng
máy chủ đã cấu hình.

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

Ghi đè máy chủ Ollama tùy chọn:

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

Nếu bạn đã cấu hình Ollama làm nhà cung cấp mô hình, nhà cung cấp tìm kiếm web có thể
tái sử dụng máy chủ đó thay thế:

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

Nhà cung cấp mô hình Ollama sử dụng `baseUrl` làm khóa chuẩn. Nhà cung cấp tìm kiếm web cũng chấp nhận `baseURL` trên `models.providers.ollama` để tương thích với các ví dụ cấu hình kiểu OpenAI SDK.

Nếu không đặt URL cơ sở Ollama rõ ràng, OpenClaw sử dụng `http://127.0.0.1:11434`.

Nếu máy chủ Ollama của bạn yêu cầu xác thực bearer, OpenClaw tái sử dụng
`models.providers.ollama.apiKey` (hoặc xác thực nhà cung cấp tương ứng được hỗ trợ bằng biến môi trường)
cho các yêu cầu tới máy chủ đã cấu hình đó.

Ollama Web Search lưu trữ trực tiếp:

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

## Ghi chú

- Không cần trường khóa API riêng cho tìm kiếm web đối với nhà cung cấp này.
- Nếu máy chủ Ollama được bảo vệ bằng xác thực, OpenClaw tái sử dụng khóa API
  thông thường của nhà cung cấp Ollama khi có.
- Nếu `baseUrl` là `https://ollama.com`, OpenClaw gọi trực tiếp
  `https://ollama.com/api/web_search` và gửi khóa API Ollama đã cấu hình
  dưới dạng xác thực bearer.
- Nếu máy chủ đã cấu hình không cung cấp tìm kiếm web và `OLLAMA_API_KEY` được đặt,
  OpenClaw có thể quay về `https://ollama.com/api/web_search` mà không gửi
  khóa biến môi trường đó tới máy chủ cục bộ.
- OpenClaw cảnh báo trong quá trình thiết lập nếu không truy cập được Ollama hoặc chưa đăng nhập, nhưng
  không chặn việc chọn.
- OpenClaw không tự động chọn Ollama Web Search khi chưa cấu hình nhà cung cấp
  có thông tin xác thực với độ ưu tiên cao hơn; hãy chọn rõ ràng bằng
  `tools.web.search.provider: "ollama"`.
- Các máy chủ daemon Ollama cục bộ sử dụng điểm cuối proxy cục bộ
  `/api/experimental/web_search`, nơi ký và chuyển tiếp tới Ollama Cloud.
- Các máy chủ `https://ollama.com` sử dụng trực tiếp điểm cuối lưu trữ công khai
  `/api/web_search` với xác thực bằng khóa API bearer.

## Liên quan

- [Tổng quan về Tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Ollama](/vi/providers/ollama) -- thiết lập mô hình Ollama và các chế độ cloud/cục bộ
