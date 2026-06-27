---
read_when:
    - Bạn muốn tạo embedding tìm kiếm bộ nhớ từ một mô hình GGUF cục bộ
    - Bạn đang cấu hình memorySearch.provider = "local"
    - Bạn cần Plugin OpenClaw sở hữu runtime node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Cài đặt nhà cung cấp llama.cpp chính thức cho embedding bộ nhớ GGUF cục bộ
title: Nhà cung cấp llama.cpp
x-i18n:
    generated_at: "2026-06-27T17:47:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` là plugin nhà cung cấp bên ngoài chính thức cho embedding GGUF cục bộ.
Nó sở hữu phụ thuộc runtime `node-llama-cpp` được dùng bởi
`memorySearch.provider: "local"`.

Cài đặt trước khi dùng embedding bộ nhớ cục bộ:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Gói npm `openclaw` chính không bao gồm `node-llama-cpp`. Việc giữ phụ thuộc
native trong plugin này giúp các bản cập nhật npm OpenClaw thông thường không
xóa runtime đã cài thủ công bên trong thư mục gói OpenClaw.

## Cấu hình

Đặt nhà cung cấp tìm kiếm bộ nhớ thành `local`:

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

Mô hình mặc định là `embeddinggemma-300m-qat-Q8_0.gguf`. Bạn cũng có thể trỏ
`local.modelPath` tới một tệp `.gguf` cục bộ.

## Runtime native

Dùng Node 24 để có đường dẫn cài đặt native mượt nhất. Các checkout mã nguồn dùng pnpm
có thể cần phê duyệt và xây dựng lại phụ thuộc native:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

Để dùng embedding cục bộ ít ma sát hơn, hãy dùng nhà cung cấp dịch vụ cục bộ như
Ollama hoặc LM Studio thay thế.
