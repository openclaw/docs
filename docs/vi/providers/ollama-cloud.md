---
read_when:
    - Bạn muốn sử dụng các mô hình Ollama được lưu trữ mà không cần máy chủ Ollama cục bộ
    - Bạn cần id, khóa hoặc điểm cuối của nhà cung cấp ollama-cloud
summary: Sử dụng Ollama Cloud trực tiếp với OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T18:04:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud là API mô hình được lưu trữ của Ollama. Nó cho phép OpenClaw gọi trực tiếp
các mô hình do Ollama lưu trữ, mà không cần cài đặt máy chủ Ollama cục bộ hoặc đăng nhập ứng dụng
Ollama cục bộ vào chế độ đám mây. Sử dụng id nhà cung cấp `ollama-cloud` và tham chiếu mô hình như
`ollama-cloud/kimi-k2.6`.

Trang này dành cho định tuyến chỉ dùng đám mây trực tiếp. Nhà cung cấp dùng kiểu gốc
`/api/chat` của Ollama, không phải tuyến `/v1` tương thích với OpenAI. OpenClaw đăng ký nó
dưới dạng một id nhà cung cấp riêng để thông tin xác thực chỉ dùng đám mây, khám phá danh mục trực tiếp và
lựa chọn mô hình không bị trộn lẫn với máy chủ `ollama` cục bộ.

Dùng trang này khi bạn muốn định tuyến chỉ dùng đám mây. Với Ollama cục bộ, định tuyến kết hợp
đám mây cộng cục bộ, embeddings, và chi tiết máy chủ tùy chỉnh, xem
[Ollama](/vi/providers/ollama).

## Thiết lập

Tạo khóa API Ollama Cloud tại [ollama.com/settings/keys](https://ollama.com/settings/keys), sau đó chạy:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Hoặc đặt:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## Mặc định

- Nhà cung cấp: `ollama-cloud`
- URL cơ sở: `https://ollama.com`
- Biến môi trường: `OLLAMA_API_KEY`
- Kiểu API: `/api/chat` gốc của Ollama
- Mô hình ví dụ: `ollama-cloud/kimi-k2.6`

## Khi nào nên chọn Ollama Cloud

- Bạn muốn các mô hình Ollama được lưu trữ mà không cần chạy `ollama serve` cục bộ.
- Bạn muốn cùng dạng API trò chuyện gốc của Ollama mà OpenClaw dùng cho Ollama
  cục bộ, nhưng trỏ tới `https://ollama.com`.
- Bạn muốn một đường dẫn đám mây đơn giản cho các mô hình đã có trong danh mục được lưu trữ
  của Ollama.
- Bạn không cần kéo mô hình cục bộ, kiểm soát GPU cục bộ, hoặc suy luận chỉ trong LAN.

Thay vào đó, dùng [Ollama](/vi/providers/ollama) khi bạn muốn định tuyến chỉ cục bộ hoặc
đám mây cộng cục bộ thông qua máy chủ Ollama đã đăng nhập. Dùng một nhà cung cấp
tương thích với OpenAI khi bạn cần ngữ nghĩa `/v1/chat/completions`
hoặc các tính năng kiểu OpenAI dành riêng cho nhà cung cấp.

## Mô hình

OpenClaw khám phá các mô hình Ollama Cloud từ danh mục được lưu trữ trực tiếp. Các id được lưu trữ
thường có sẵn bao gồm:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

Dùng một id mô hình từ danh mục được lưu trữ hiện tại của bạn:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Id mô hình là id trong danh mục đám mây, không phải tên kéo cục bộ. Nếu một tên mô hình hoạt động trong
máy chủ Ollama cục bộ nhưng không có trong danh mục được lưu trữ, hãy dùng nhà cung cấp `ollama`
với máy chủ cục bộ đó thay thế.

## Kiểm thử trực tiếp

Đối với kiểm thử khói bằng khóa API Ollama Cloud, trỏ kiểm thử trực tiếp Ollama tới
điểm cuối được lưu trữ và chọn một mô hình từ danh mục hiện tại của bạn:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Kiểm thử khói trên đám mây chạy văn bản, luồng gốc và tìm kiếm web. Nó bỏ qua embeddings theo
mặc định cho `https://ollama.com` vì khóa API Ollama Cloud có thể không ủy quyền
`/api/embed`.

## Khắc phục sự cố

- Lỗi `Set OLLAMA_API_KEY`: cung cấp một khóa API đám mây thật. Dấu đánh dấu
  `ollama-local` cục bộ chỉ dành cho máy chủ Ollama cục bộ hoặc riêng tư.
- Lỗi mô hình không xác định: chạy `openclaw models list --provider ollama-cloud` và
  sao chép chính xác id mô hình được lưu trữ.
- Sự cố gọi công cụ hoặc JSON thô trên máy chủ Ollama tùy chỉnh: kiểm tra xem bạn có đang
  vô tình dùng URL `/v1` tương thích với OpenAI hay không. Các tuyến Ollama nên dùng
  URL cơ sở gốc không có hậu tố `/v1`.

## Liên quan

- [Ollama](/vi/providers/ollama)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Tất cả nhà cung cấp](/vi/providers/index)
