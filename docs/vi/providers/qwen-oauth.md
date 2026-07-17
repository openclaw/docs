---
read_when:
    - Bạn muốn cấu hình mã định danh nhà cung cấp qwen-oauth
    - Trước đây, bạn đã sử dụng thông tin xác thực OAuth của Qwen Portal
    - Bạn cần endpoint Qwen Portal hoặc hướng dẫn di chuyển
summary: Sử dụng mã định danh nhà cung cấp Qwen Portal với OpenClaw
title: OAuth / Cổng thông tin Qwen
x-i18n:
    generated_at: "2026-07-12T08:22:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` là mã định danh nhà cung cấp Qwen Portal, được Plugin Qwen
(`@openclaw/qwen-provider`) đăng ký. Nhà cung cấp này nhắm đến điểm cuối Qwen Portal tại
`https://portal.qwen.ai/v1` và duy trì khả năng truy cập các cấu hình Qwen OAuth / portal cũ
thông qua một mã định danh nhà cung cấp riêng biệt, tách khỏi nhà cung cấp `qwen`
chuẩn.

Chọn `qwen-oauth` nếu bạn đã có token Qwen Portal hoạt động, đang
di chuyển một quy trình Qwen OAuth hoặc Qwen CLI cũ, hoặc cần kiểm thử riêng
điểm cuối Qwen Portal. Đối với cấu hình mới, nên dùng
[Qwen](/vi/providers/qwen) với điểm cuối ModelStudio Tiêu chuẩn: tùy chọn này hỗ trợ
cấu hình khóa API mới, nhiều lựa chọn điểm cuối hơn, hình thức trả theo mức sử dụng Tiêu chuẩn, Gói Coding
và toàn bộ danh mục Plugin Qwen.

## Thiết lập

Cài đặt Plugin Qwen nếu bạn chưa cài:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

Cung cấp token portal của bạn thông qua quy trình hướng dẫn ban đầu:

```bash
openclaw onboard --auth-choice qwen-oauth
```

Các lần chạy không tương tác đọc token từ `--qwen-oauth-token <token>`, hoặc đặt:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

Quy trình hướng dẫn ban đầu lưu token trong một hồ sơ xác thực `qwen-oauth`, khởi tạo
danh mục mô hình portal và đặt `qwen-oauth/qwen3.5-plus` làm mô hình mặc định khi
chưa có mô hình nào được cấu hình.

## Giá trị mặc định

- Nhà cung cấp: `qwen-oauth`
- Bí danh: `qwen-portal`, `qwen-cli`
- URL cơ sở: `https://portal.qwen.ai/v1`
- Biến môi trường: `QWEN_API_KEY`
- Kiểu API: tương thích với OpenAI
- Mô hình mặc định: `qwen-oauth/qwen3.5-plus`

## Điểm khác biệt so với Qwen

OpenClaw có hai mã định danh nhà cung cấp dành cho Qwen:

| Nhà cung cấp | Nhóm điểm cuối                                            | Phù hợp nhất cho                                                                          |
| ------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `qwen`       | Các điểm cuối Qwen Cloud / Alibaba DashScope và Gói Coding | Cấu hình khóa API mới, hình thức trả theo mức sử dụng Tiêu chuẩn, Gói Coding, các tính năng DashScope đa phương thức |
| `qwen-oauth` | Điểm cuối Qwen Portal tại `portal.qwen.ai/v1`             | Token Qwen Portal hiện có và các cấu hình Qwen OAuth / CLI cũ                             |

Cả hai nhà cung cấp đều sử dụng cấu trúc yêu cầu tương thích với OpenAI, nhưng là các bề mặt
xác thực riêng biệt. Không nên coi token được lưu cho `qwen-oauth` là khóa DashScope
hoặc ModelStudio; thay vào đó, khóa DashScope mới nên sử dụng nhà cung cấp `qwen`
chuẩn.

## Mô hình

Plugin Qwen khởi tạo danh mục tĩnh này cho điểm cuối Qwen Portal. Tất cả
mục đều có đầu ra tối đa 65.536 token; khả dụng hay không phụ thuộc vào tài khoản
và token Qwen Portal hiện tại.

| Tham chiếu mô hình                 | Đầu vào       | Ngữ cảnh  | Ghi chú          |
| ---------------------------------- | ------------- | ---------- | ---------------- |
| `qwen-oauth/qwen3.5-plus`          | văn bản, hình ảnh | 1.000.000 | Mô hình mặc định |
| `qwen-oauth/qwen3.6-plus`          | văn bản, hình ảnh | 1.000.000 |                  |
| `qwen-oauth/qwen3-max-2026-01-23`  | văn bản       | 262.144    |                  |
| `qwen-oauth/qwen3-coder-next`      | văn bản       | 262.144    |                  |
| `qwen-oauth/qwen3-coder-plus`      | văn bản       | 1.000.000  |                  |
| `qwen-oauth/MiniMax-M2.5`          | văn bản       | 1.000.000  | Suy luận          |
| `qwen-oauth/glm-5`                 | văn bản       | 202.752    |                  |
| `qwen-oauth/glm-4.7`               | văn bản       | 202.752    |                  |
| `qwen-oauth/kimi-k2.5`             | văn bản, hình ảnh | 262.144 |                  |

Nếu tài khoản của bạn sử dụng khóa API ModelStudio / DashScope, hãy cấu hình
nhà cung cấp `qwen` chuẩn:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## Di chuyển

Các hồ sơ OAuth Qwen Portal cũ không thể làm mới; `openclaw doctor` sẽ
gắn cờ chúng. Nếu một hồ sơ portal ngừng hoạt động, hãy chạy lại quy trình hướng dẫn ban đầu với token hiện tại
hoặc chuyển sang nhà cung cấp Qwen Tiêu chuẩn:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

ModelStudio toàn cầu Tiêu chuẩn sử dụng:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Khắc phục sự cố

- Lỗi làm mới OAuth Portal: các hồ sơ OAuth Qwen Portal cũ không thể
  làm mới. Hãy chạy lại quy trình hướng dẫn ban đầu với token hiện tại.
- Lỗi sai điểm cuối: xác nhận tham chiếu mô hình bắt đầu bằng `qwen-oauth/` khi
  sử dụng token portal. Chỉ sử dụng tham chiếu `qwen/` cho nhà cung cấp Qwen chuẩn.
- Nhầm lẫn về `QWEN_API_KEY`: cả hai trang Qwen đều đề cập đến biến môi trường này, nhưng quy trình hướng dẫn ban đầu
  lưu thông tin xác thực dưới mã định danh nhà cung cấp đã chọn. Nên sử dụng quy trình hướng dẫn ban đầu khi bạn
  duy trì cả `qwen` và `qwen-oauth` trên cùng một máy.

## Liên quan

- [Qwen](/vi/providers/qwen)
- [Alibaba Model Studio](/vi/providers/alibaba)
- [Nhà cung cấp mô hình](/vi/concepts/model-providers)
- [Tất cả nhà cung cấp](/vi/providers/index)
