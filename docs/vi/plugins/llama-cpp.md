---
read_when:
    - Bạn muốn suy luận văn bản cục bộ mà không cần khóa API hoặc máy chủ mô hình
    - Bạn muốn tạo embedding tìm kiếm bộ nhớ từ một mô hình GGUF cục bộ
    - Bạn đang cấu hình memorySearch.provider = "local"
    - Bạn cần Plugin OpenClaw sở hữu runtime node-llama-cpp
sidebarTitle: llama.cpp Provider
summary: Chạy suy luận văn bản GGUF cục bộ và tạo embedding bộ nhớ trong OpenClaw bằng llama.cpp
title: Nhà cung cấp llama.cpp
x-i18n:
    generated_at: "2026-07-19T05:52:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8af1118ae65741519f81520e6c1c961e208e8dc2c9e1b250979c3758b8fe7c83
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` là plugin nhà cung cấp bên ngoài chính thức dành cho suy luận văn bản và embedding GGUF cục bộ trong cùng tiến trình. Plugin này đăng ký nhà cung cấp văn bản `llama-cpp`, nhà cung cấp embedding `local`, đồng thời sở hữu runtime gốc `node-llama-cpp`.

Hãy cài đặt plugin này trước khi sử dụng suy luận cục bộ hoặc embedding bộ nhớ cục bộ:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Gói npm `openclaw` chính không bao gồm `node-llama-cpp`. Việc giữ phần phụ thuộc gốc trong plugin này giúp ngăn các bản cập nhật npm OpenClaw thông thường xóa runtime được cài đặt thủ công bên trong thư mục gói OpenClaw.

## Suy luận văn bản cục bộ

Chọn **Mô hình cục bộ (llama.cpp)** trong quá trình thiết lập ban đầu tương tác. OpenClaw sẽ hỏi trước khi tải xuống mô hình mặc định:

`hf:bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`

Tệp Qwen3 4B Instruct 2507 Q4_K_M có dung lượng khoảng 2.5 GB. Hãy dự trù khoảng 3 GB RAM cho trọng số mô hình, cộng thêm ngữ cảnh và chi phí runtime của OpenClaw. Ngữ cảnh mặc định được tự động định cỡ với giới hạn 8,192 token để vẫn khả dụng trên các máy có 8 GB bộ nhớ. Chỉ cấu hình ngữ cảnh lớn hơn khi máy có đủ bộ nhớ.

Quá trình kiểm tra khám phá khi thiết lập ban đầu chỉ đọc dữ liệu. Quá trình này chỉ tự động đề xuất llama.cpp khi tệp GGUF mặc định hoặc đã cấu hình có sẵn trong bộ nhớ đệm mô hình; quá trình khám phá không bao giờ tải xuống tệp. Ollama và LM Studio vẫn là các lựa chọn dịch vụ cục bộ riêng biệt và duy trì luồng khám phá riêng. Chọn llama.cpp theo cách thủ công là cách kích hoạt lời nhắc tải xuống mô hình mặc định.

Nhà cung cấp sử dụng mẫu trò chuyện nhúng của mô hình GGUF và khả năng gọi hàm gốc của node-llama-cpp. Văn bản được truyền phát theo từng token. Các lệnh gọi công cụ được trả về OpenClaw để thực thi thay vì chạy bên trong node-llama-cpp.

### Sử dụng mô hình GGUF khác

Thêm một mô hình vào `models.providers.llama-cpp`. Đặt đường dẫn cục bộ hoặc URI tệp `hf:` đầy đủ trong `params.modelPath`:

```json5
{
  models: {
    mode: "merge",
    providers: {
      "llama-cpp": {
        baseUrl: "local://llama-cpp",
        api: "openai-completions",
        params: {
          modelCacheDir: "~/.node-llama-cpp/models",
        },
        models: [
          {
            id: "my-local-model",
            name: "My local GGUF",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 2048,
            params: {
              modelPath: "~/Models/my-model.Q4_K_M.gguf",
              contextSize: 8192,
            },
            compat: { supportsTools: true },
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "llama-cpp/my-local-model" },
    },
  },
}
```

Quá trình suy luận không bao giờ ngầm tải xuống mô hình bị thiếu. Đối với URI `hf:` tùy chỉnh, trước tiên hãy tải GGUF vào `modelCacheDir`. Quá trình khám phá sử dụng trình phân giải bộ nhớ đệm chỉ đọc riêng của node-llama-cpp, bao gồm cách đặt tên kho lưu trữ, nhánh và tệp phân tách.

## Cấu hình embedding bộ nhớ

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

`local.modelPath` mặc định sử dụng URI `hf:` được hiển thị ở trên (`embeddinggemma-300m-qat-Q8_0.gguf`). Hãy trỏ thuộc tính này đến một URI `hf:` khác hoặc một tệp `.gguf` cục bộ để sử dụng mô hình khác. `local.modelCacheDir` ghi đè vị trí lưu các mô hình đã tải xuống vào bộ nhớ đệm (mặc định: `~/.node-llama-cpp/models`), còn `local.contextSize` chấp nhận một số nguyên hoặc `"auto"`.

Khi `local.contextSize` là giá trị số, nhà cung cấp cũng chuyển yêu cầu đó cho cơ chế bố trí lớp GPU tự động của node-llama-cpp. Điều này cho phép node-llama-cpp bố trí mô hình và ngữ cảnh embedding cùng nhau trong khi vẫn duy trì các bước kiểm tra an toàn bộ nhớ. Với `"auto"`, node-llama-cpp duy trì cơ chế bố trí tự động thông thường.

## Runtime gốc

Sử dụng Node 24 để có quy trình cài đặt phần phụ thuộc gốc thuận lợi nhất. Các bản sao mã nguồn sử dụng pnpm có thể cần phê duyệt và xây dựng lại phần phụ thuộc gốc:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## Chẩn đoán runtime bộ nhớ

Chạy `openclaw memory status --deep` sau khi nhà cung cấp đã tải để kiểm tra backend và bản dựng đã chọn, tên thiết bị, các lớp được chuyển sang GPU, kích thước ngữ cảnh được yêu cầu và ảnh chụp nhanh VRAM hoặc bộ nhớ hợp nhất được quan sát gần nhất. Các giá trị VRAM bao gồm dấu thời gian quan sát vì thao tác đọc trạng thái thụ động không tải lại mô hình hoặc thăm dò thiết bị.

Các thông tin đã biết gần nhất tương tự có thể xuất hiện trong `openclaw doctor` khi Gateway đang chạy đã sử dụng nhà cung cấp cục bộ. Lệnh trạng thái hoặc doctor thông thường không tải mô hình chỉ để thu thập dữ liệu chẩn đoán.

## Khắc phục sự cố

Nếu `node-llama-cpp` bị thiếu hoặc không tải được, OpenClaw sẽ báo cáo lỗi cùng với:

1. Cài đặt plugin: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. Sử dụng Node 24 cho các thao tác cài đặt/cập nhật phần phụ thuộc gốc.
3. Từ bản sao mã nguồn pnpm: `pnpm approve-builds`, sau đó là `pnpm rebuild node-llama-cpp`.

Để suy luận cục bộ mà không cần phần phụ thuộc gốc trong cùng tiến trình, hãy sử dụng nhà cung cấp Ollama hoặc LM Studio. Để sử dụng embedding cục bộ thuận tiện hơn, hãy đặt `memorySearch.provider` thành một nhà cung cấp embedding từ xa như `lmstudio`, `ollama`, `openai` hoặc `voyage`.
