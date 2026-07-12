---
read_when:
    - Bạn muốn tạo embedding tìm kiếm bộ nhớ từ một mô hình GGUF cục bộ
    - Bạn đang cấu hình memorySearch.provider = "local"
    - Bạn cần Plugin OpenClaw sở hữu môi trường thực thi node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Cài đặt nhà cung cấp llama.cpp chính thức cho embedding bộ nhớ GGUF cục bộ
title: Nhà cung cấp llama.cpp
x-i18n:
    generated_at: "2026-07-12T08:11:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` là plugin nhà cung cấp bên ngoài chính thức dành cho embedding GGUF
cục bộ. Plugin này đăng ký mã định danh nhà cung cấp embedding `local` và sở hữu
phần phụ thuộc thời gian chạy `node-llama-cpp` được `memorySearch.provider: "local"` sử dụng.

Hãy cài đặt plugin trước khi sử dụng embedding bộ nhớ cục bộ:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Gói npm `openclaw` chính không bao gồm `node-llama-cpp`. Việc giữ phần phụ thuộc
native trong plugin này giúp ngăn các bản cập nhật npm OpenClaw thông thường
xóa thời gian chạy được cài đặt thủ công bên trong thư mục gói OpenClaw.

## Cấu hình

Đặt `memorySearch.provider` thành `local`:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

`local.modelPath` mặc định là URI `hf:` được hiển thị ở trên (`embeddinggemma-300m-qat-Q8_0.gguf`).
Hãy trỏ giá trị này đến một URI `hf:` khác hoặc tệp `.gguf` cục bộ để sử dụng
mô hình khác. `local.modelCacheDir` ghi đè vị trí lưu bộ nhớ đệm của các mô hình
đã tải xuống (mặc định: `~/.node-llama-cpp/models`), còn `local.contextSize` chấp nhận
một số nguyên hoặc `"auto"`.

Khi `local.contextSize` là một giá trị số, nhà cung cấp cũng chuyển yêu cầu đó
cho cơ chế tự động bố trí lớp trên GPU của node-llama-cpp. Điều này cho phép node-llama-cpp
bố trí mô hình và ngữ cảnh embedding cùng nhau trong khi vẫn duy trì các bước
kiểm tra an toàn bộ nhớ. Với `"auto"`, node-llama-cpp giữ nguyên cơ chế bố trí tự động thông thường.

## Thời gian chạy native

Sử dụng Node 24 để quá trình cài đặt native diễn ra thuận lợi nhất. Các bản sao
mã nguồn sử dụng pnpm có thể cần phê duyệt và xây dựng lại phần phụ thuộc native:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Chẩn đoán thời gian chạy

Chạy `openclaw memory status --deep` sau khi nhà cung cấp đã được tải để kiểm tra
phần phụ trợ và bản dựng đã chọn, tên thiết bị, các lớp được chuyển tải sang GPU,
kích thước ngữ cảnh được yêu cầu và ảnh chụp nhanh VRAM hoặc bộ nhớ hợp nhất được
quan sát gần nhất. Các giá trị VRAM bao gồm dấu thời gian quan sát vì thao tác đọc
trạng thái thụ động không tải lại mô hình hoặc thăm dò thiết bị.

Các thông tin được ghi nhận gần nhất này cũng có thể xuất hiện trong `openclaw doctor`
khi Gateway đang chạy đã sử dụng nhà cung cấp cục bộ. Lệnh trạng thái hoặc lệnh
doctor thông thường không tải mô hình chỉ để thu thập dữ liệu chẩn đoán.

## Khắc phục sự cố

Nếu thiếu `node-llama-cpp` hoặc không thể tải phần phụ thuộc này, OpenClaw báo lỗi
kèm theo hướng dẫn:

1. Cài đặt plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Sử dụng Node 24 cho các lượt cài đặt/cập nhật native.
3. Từ bản sao mã nguồn pnpm: chạy `pnpm approve-builds`, sau đó chạy `pnpm rebuild node-llama-cpp`.

Để sử dụng embedding cục bộ dễ dàng hơn mà không cần bước xây dựng native, hãy đặt
`memorySearch.provider` thành một nhà cung cấp embedding từ xa như `lmstudio`,
`ollama`, `openai` hoặc `voyage`.
