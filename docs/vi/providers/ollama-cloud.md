---
read_when:
    - Bạn muốn sử dụng các mô hình Ollama được lưu trữ mà không cần máy chủ Ollama cục bộ
    - Bạn cần ID, khóa hoặc điểm cuối của nhà cung cấp ollama-cloud
summary: Sử dụng trực tiếp Ollama Cloud với OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T08:21:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud là API mô hình được lưu trữ của Ollama. Nhà cung cấp `ollama-cloud` gọi trực tiếp API này tại `https://ollama.com` qua API `/api/chat` gốc của Ollama, không cần máy chủ Ollama cục bộ và không cần ứng dụng Ollama cục bộ đăng nhập ở chế độ đám mây. Hãy sử dụng các tham chiếu mô hình như `ollama-cloud/kimi-k2.6`.

OpenClaw đăng ký `ollama-cloud` làm mã định danh nhà cung cấp riêng để thông tin xác thực chỉ dành cho đám mây, tính năng khám phá danh mục trực tiếp và việc lựa chọn mô hình không bị trộn lẫn với máy chủ `ollama` cục bộ. Để biết thông tin về Ollama cục bộ, định tuyến kết hợp đám mây và cục bộ, embedding cũng như chi tiết máy chủ tùy chỉnh, hãy xem [Ollama](/vi/providers/ollama).

## Thiết lập

Tạo khóa API Ollama Cloud tại [ollama.com/settings/keys](https://ollama.com/settings/keys), sau đó chạy:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Hoặc đặt:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

Quy trình thiết lập ban đầu không tương tác chấp nhận trực tiếp khóa:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

Quy trình thiết lập ban đầu đặt mô hình mặc định thành `ollama-cloud/kimi-k2.5:cloud`.

## Giá trị mặc định

- Nhà cung cấp: `ollama-cloud`
- URL cơ sở: `https://ollama.com`
- Biến môi trường: `OLLAMA_API_KEY`
- Kiểu API: `/api/chat` gốc của Ollama
- Mô hình mặc định khi thiết lập ban đầu: `ollama-cloud/kimi-k2.5:cloud`

## Khi nào nên chọn Ollama Cloud

- Bạn muốn sử dụng các mô hình Ollama được lưu trữ mà không cần chạy `ollama serve` cục bộ.
- Bạn muốn sử dụng cùng cấu trúc API trò chuyện gốc của Ollama mà OpenClaw dùng cho Ollama cục bộ, nhưng trỏ đến `https://ollama.com`.
- Bạn muốn một phương thức đám mây đơn giản dành cho các mô hình đã có trong danh mục được lưu trữ của Ollama.
- Bạn không cần tải mô hình xuống cục bộ, kiểm soát GPU cục bộ hoặc suy luận chỉ trong mạng LAN.

Thay vào đó, hãy sử dụng [Ollama](/vi/providers/ollama) khi bạn muốn định tuyến chỉ cục bộ hoặc kết hợp đám mây và cục bộ thông qua một máy chủ Ollama đã đăng nhập. Hãy sử dụng nhà cung cấp tương thích với OpenAI khi bạn cần ngữ nghĩa `/v1/chat/completions` hoặc các tính năng theo phong cách OpenAI dành riêng cho nhà cung cấp.

## Mô hình

Nhà cung cấp yêu cầu khóa API; nếu không có khóa, nhà cung cấp sẽ không hoạt động. Khi có khóa, OpenClaw khám phá trực tiếp các mô hình Ollama Cloud từ danh mục được lưu trữ:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Các mã định danh được lưu trữ trong danh mục trực tiếp bao gồm `deepseek-v4-flash`, `glm-5`, `gpt-oss:20b`, `kimi-k2.6` và `minimax-m2.7`. Khi tính năng khám phá trực tiếp không trả về kết quả nào, OpenClaw dùng các mục đi kèm `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud` và `glm-5.2:cloud` làm phương án dự phòng.

Mã định danh mô hình là mã định danh trong danh mục đám mây, không phải tên dùng để tải xuống cục bộ. Nếu tên mô hình hoạt động trên máy chủ Ollama cục bộ nhưng không có trong danh mục được lưu trữ, hãy sử dụng nhà cung cấp `ollama` với máy chủ cục bộ đó.

## Kiểm thử trực tiếp

Đối với các kiểm thử nhanh bằng khóa API Ollama Cloud, hãy trỏ kiểm thử trực tiếp của Ollama đến điểm cuối được lưu trữ và chọn một mô hình từ danh mục hiện tại của bạn:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Kiểm thử nhanh trên đám mây chạy văn bản, luồng gốc và tìm kiếm trên web; đặt `OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` để bỏ qua tìm kiếm trên web. Theo mặc định, kiểm thử bỏ qua embedding đối với `https://ollama.com` vì khóa API Ollama Cloud có thể không cấp quyền truy cập `/api/embed`; buộc chạy kiểm thử embedding bằng `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Khắc phục sự cố

- Lỗi `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: cung cấp khóa API đám mây thực. Dấu hiệu `ollama-local` chỉ dành cho máy chủ Ollama cục bộ hoặc riêng tư.
- Lỗi mô hình không xác định: chạy `openclaw models list --provider ollama-cloud` và sao chép chính xác mã định danh mô hình được lưu trữ.
- Sự cố gọi công cụ hoặc JSON thô trên máy chủ Ollama tùy chỉnh: kiểm tra xem bạn có vô tình sử dụng URL `/v1` tương thích với OpenAI hay không. Các tuyến Ollama phải sử dụng URL cơ sở gốc không có hậu tố `/v1`.

## Nội dung liên quan

- [Ollama](/vi/providers/ollama)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Tất cả nhà cung cấp](/vi/providers/index)
