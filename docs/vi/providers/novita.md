---
read_when:
    - Bạn muốn chạy OpenClaw với các mô hình NovitaAI
    - Bạn cần mã định danh, khóa hoặc điểm cuối của nhà cung cấp Novita
summary: Sử dụng API tương thích với OpenAI của NovitaAI cùng OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T08:18:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI là nhà cung cấp hạ tầng AI được lưu trữ với API tương thích OpenAI.
Nhà cung cấp này được tích hợp sẵn trong OpenClaw (không cần cài đặt Plugin riêng), vì vậy
thông tin xác thực được xử lý qua luồng xác thực mô hình thông thường và tham chiếu mô hình có dạng
`novita/deepseek/deepseek-v3-0324`.

## Thiết lập

Tạo khóa API tại [novita.ai/settings/key-management](https://novita.ai/settings/key-management), sau đó chạy:

```bash
openclaw onboard --auth-choice novita-api-key
```

Hoặc đặt:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## Giá trị mặc định

| Thiết lập          | Giá trị                            |
| ------------------ | ---------------------------------- |
| ID nhà cung cấp    | `novita`                           |
| Bí danh            | `novita-ai`, `novitaai`            |
| URL cơ sở          | `https://api.novita.ai/openai/v1`  |
| Biến môi trường    | `NOVITA_API_KEY`                   |
| Mô hình mặc định   | `novita/deepseek/deepseek-v3-0324` |

## Danh mục mô hình tích hợp sẵn

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

Đây là điểm khởi đầu, không phải danh mục được cập nhật trực tiếp. Tài khoản, khu vực hoặc
dịch vụ hiện tại của Novita có thể thêm, xóa hoặc hạn chế các tuyến. Hãy kiểm tra trước khi
đặt một giá trị mặc định dùng lâu dài:

```bash
openclaw models list --provider novita
```

## Khi nào nên chọn Novita

- Truy cập các mô hình trọng số mở được lưu trữ qua API tương thích OpenAI.
- Sử dụng các tuyến thuộc dòng DeepSeek, Kimi, MiniMax, GLM hoặc Qwen thông qua một tài khoản
  nhà cung cấp duy nhất.
- Có thêm một phương án dự phòng được lưu trữ bên cạnh DeepInfra, GMI, OpenRouter hoặc các
  API trực tiếp của nhà cung cấp.
- Lưu trữ mô hình phía nhà cung cấp thay vì tự duy trì hạ tầng LM Studio, Ollama,
  SGLang hoặc vLLM.

Chọn nhà cung cấp trực tiếp từ hãng khi bạn cần các tham số yêu cầu
gốc của hãng hoặc hợp đồng hỗ trợ. Chọn nhà cung cấp cục bộ khi mô hình phải
chạy trên phần cứng hoặc trong ranh giới mạng của riêng bạn.

## Khắc phục sự cố

- `401`/`403`: xác minh khóa trên trang quản lý khóa của Novita và chạy lại
  `openclaw onboard --auth-choice novita-api-key` nếu hồ sơ đã lưu
  không còn cập nhật.
- Lỗi không xác định được mô hình: sử dụng chính xác `novita/<route-id>` do
  `openclaw models list --provider novita` trả về.
- Tuyến chậm hoặc gặp lỗi: thử một tuyến mô hình Novita khác hoặc đặt Novita làm
  nhà cung cấp dự phòng cho các khối lượng công việc có thể chấp nhận sự khác biệt
  riêng theo nhà cung cấp.

## Liên quan

- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Danh mục nhà cung cấp](/vi/providers/index)
