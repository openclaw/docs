---
read_when:
    - Bạn muốn chạy OpenClaw với các mô hình GMI Cloud
    - Bạn cần mã định danh nhà cung cấp, khóa hoặc điểm cuối GMI
summary: Sử dụng API tương thích với OpenAI của GMI Cloud cùng OpenClaw
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-12T08:15:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud là một nền tảng suy luận được lưu trữ dành cho các mô hình tiên tiến và mô hình trọng số mở
thông qua API tương thích với OpenAI. Trong OpenClaw, đây là Plugin nhà cung cấp bên ngoài chính thức:
chỉ cần cài đặt một lần, lưu thông tin xác thực qua cơ chế xác thực mô hình thông thường và sử dụng
tham chiếu mô hình như `gmi/google/gemini-3.1-flash-lite`.

Hãy dùng GMI khi bạn muốn sử dụng một khóa API cho nhiều họ mô hình được lưu trữ, bao gồm
các tuyến Anthropic, DeepSeek, Google, Moonshot, OpenAI và Z.AI được cung cấp trong
danh mục của GMI. GMI có thể hoạt động như nhà cung cấp phụ để dự phòng mô hình, để so sánh
các tuyến được lưu trữ giữa nhiều nhà cung cấp, hoặc khi GMI cung cấp một mô hình trước
nhà cung cấp chính của bạn. OpenClaw quản lý mã định danh nhà cung cấp, hồ sơ xác thực, bí danh,
dữ liệu khởi tạo danh mục mô hình và URL cơ sở; GMI quản lý tình trạng khả dụng thực tế của mô hình,
việc tính phí, giới hạn tốc độ và mọi chính sách định tuyến phía nhà cung cấp.

| Thuộc tính                | Giá trị                                  |
| ------------------------- | ---------------------------------------- |
| Mã định danh nhà cung cấp | `gmi` (bí danh: `gmi-cloud`, `gmicloud`) |
| Gói                       | `@openclaw/gmi-provider`                 |
| Biến môi trường xác thực  | `GMI_API_KEY`                            |
| API                       | Tương thích với OpenAI (`openai-completions`) |
| URL cơ sở                 | `https://api.gmi-serving.com/v1`         |
| Mô hình mặc định          | `gmi/google/gemini-3.1-flash-lite`       |

## Thiết lập

Cài đặt Plugin, khởi động lại Gateway, sau đó tạo khóa API trong GMI Cloud
(`https://www.gmicloud.ai/`):

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

Sau đó chạy:

```bash
openclaw onboard --auth-choice gmi-api-key
```

Các quy trình thiết lập không tương tác có thể truyền `--gmi-api-key <key>`, hoặc đặt:

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## Khi nào nên chọn GMI

- Bạn muốn một điểm cuối tương thích với OpenAI được lưu trữ thay vì máy chủ mô hình cục bộ.
- Bạn muốn thử nhiều họ mô hình thương mại và trọng số mở thông qua một
  tài khoản nhà cung cấp duy nhất.
- Bạn muốn một nhà cung cấp dự phòng có cơ chế định tuyến nguồn khác với DeepInfra,
  OpenRouter, Together hoặc API trực tiếp của nhà cung cấp.
- Bạn cần mã định danh mô hình, mức giá hoặc tùy chọn kiểm soát tài khoản dành riêng cho GMI.

Thay vào đó, hãy chọn nhà cung cấp trực tiếp của hãng khi bạn cần các tính năng gốc của hãng
mà GMI không cung cấp thông qua tuyến tương thích với OpenAI. Hãy chọn nhà cung cấp cục bộ
như LM Studio, Ollama, SGLang hoặc vLLM khi tính cục bộ của dữ liệu hoặc khả năng kiểm soát
GPU cục bộ quan trọng hơn sự tiện lợi của dịch vụ lưu trữ.

## Mô hình

Danh mục Plugin khởi tạo các mã định danh tuyến GMI Cloud thường có sẵn:

| Tham chiếu mô hình                 | Đầu vào         | Ngữ cảnh  | Đầu ra tối đa |
| ---------------------------------- | --------------- | ---------- | ------------ |
| `gmi/anthropic/claude-sonnet-4.6`  | văn bản + hình ảnh | 200,000   | 64,000       |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | văn bản         | 163,840    | 65,536       |
| `gmi/google/gemini-3.1-flash-lite` | văn bản + hình ảnh | 1,048,576 | 65,536       |
| `gmi/moonshotai/Kimi-K2.5`         | văn bản + hình ảnh | 262,144   | 65,536       |
| `gmi/openai/gpt-5.4`               | văn bản + hình ảnh | 400,000   | 128,000      |
| `gmi/zai-org/GLM-5.1-FP8`          | văn bản         | 202,752    | 65,536       |

Danh mục chỉ là dữ liệu khởi tạo, không phải cam kết rằng mọi tài khoản đều có thể gọi mọi mô hình
vào mọi thời điểm. Liệt kê các mô hình mà nhà cung cấp đã cấu hình báo cáo trong môi trường của bạn:

```bash
openclaw models list --provider gmi
```

## Khắc phục sự cố

- `401` hoặc `403`: kiểm tra xem `GMI_API_KEY` đã được đặt cho tiến trình đang chạy
  OpenClaw hay chưa, hoặc chạy lại quy trình thiết lập ban đầu để lưu khóa vào hồ sơ xác thực của nhà cung cấp.
- Lỗi không xác định được mô hình: xác nhận mô hình tồn tại trong tài khoản GMI của bạn và sử dụng
  tham chiếu đầy đủ `gmi/<route-id>` được hiển thị bởi `openclaw models list --provider gmi`.
- Lỗi nhà cung cấp không liên tục: thử một tuyến GMI khác hoặc cấu hình GMI làm
  phương án dự phòng thay vì nhà cung cấp mô hình chính duy nhất.

## Liên quan

- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Tất cả nhà cung cấp](/vi/providers/index)
