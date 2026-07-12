---
read_when:
    - Bạn muốn cấu hình các nhà cung cấp tìm kiếm bộ nhớ hoặc các mô hình embedding
    - Bạn muốn thiết lập backend QMD
    - Bạn muốn tinh chỉnh tìm kiếm lai, MMR hoặc cơ chế suy giảm theo thời gian
    - Bạn muốn bật tính năng lập chỉ mục bộ nhớ đa phương thức
sidebarTitle: Memory config
summary: Tất cả tùy chọn cấu hình cho tìm kiếm bộ nhớ, nhà cung cấp embedding, QMD, tìm kiếm kết hợp và lập chỉ mục đa phương thức
title: Tham chiếu cấu hình bộ nhớ
x-i18n:
    generated_at: "2026-07-12T08:23:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
    source_path: reference/memory-config.md
    workflow: 16
---

Trang này liệt kê mọi tùy chọn cấu hình cho chức năng tìm kiếm bộ nhớ của OpenClaw. Để xem tổng quan về khái niệm, hãy tham khảo:

<CardGroup cols={2}>
  <Card title="Tổng quan về bộ nhớ" href="/vi/concepts/memory">
    Cách bộ nhớ hoạt động.
  </Card>
  <Card title="Công cụ tích hợp sẵn" href="/vi/concepts/memory-builtin">
    Phần phụ trợ SQLite mặc định.
  </Card>
  <Card title="Công cụ QMD" href="/vi/concepts/memory-qmd">
    Tiến trình phụ ưu tiên cục bộ.
  </Card>
  <Card title="Tìm kiếm bộ nhớ" href="/vi/concepts/memory-search">
    Quy trình tìm kiếm và tinh chỉnh.
  </Card>
  <Card title="Active Memory" href="/vi/concepts/active-memory">
    Tác tử phụ bộ nhớ cho các phiên tương tác.
  </Card>
</CardGroup>

Tất cả cài đặt tìm kiếm bộ nhớ đều nằm trong `agents.defaults.memorySearch` của `openclaw.json` (hoặc phần ghi đè `agents.list[].memorySearch` cho từng tác tử), trừ khi có ghi chú khác.

<Note>
Nếu bạn đang tìm nút bật/tắt tính năng **Active Memory** và cấu hình tác tử phụ, chúng nằm trong `plugins.entries.active-memory` thay vì `memorySearch`.

Active Memory sử dụng mô hình hai cổng:

1. Plugin phải được bật và nhắm đến mã định danh tác tử hiện tại
2. yêu cầu phải là một phiên trò chuyện tương tác lâu dài đủ điều kiện

Hãy xem [Active Memory](/vi/concepts/active-memory) để biết mô hình kích hoạt, cấu hình do Plugin sở hữu, khả năng lưu giữ bản chép lời và quy trình triển khai an toàn.
</Note>

---

## Lựa chọn nhà cung cấp

| Khóa       | Kiểu      | Mặc định                | Mô tả                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | --------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`                  | Bật hoặc tắt chức năng tìm kiếm bộ nhớ                                                                                                                                                                                                                                                                                                                           |
| `provider` | `string`  | `"openai"`              | Mã định danh bộ điều hợp nhúng như `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` hoặc `voyage`; cũng có thể là `models.providers.<id>` đã cấu hình với `api` trỏ đến bộ điều hợp nhúng bộ nhớ hoặc API mô hình tương thích với OpenAI |
| `model`    | `string`  | mặc định của nhà cung cấp | Tên mô hình nhúng                                                                                                                                                                                                                                                                                                                                                |
| `fallback` | `string`  | `"none"`                | Mã định danh bộ điều hợp dự phòng khi bộ điều hợp chính gặp lỗi                                                                                                                                                                                                                                                                                                  |

Khi chưa đặt `provider`, OpenClaw sử dụng tính năng nhúng của OpenAI. Hãy đặt rõ `provider`
để sử dụng Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, mô hình GGUF cục bộ hoặc điểm cuối `/v1/embeddings` tương thích với OpenAI.
Các cấu hình cũ vẫn có `provider: "auto"` sẽ được phân giải thành `openai`.

<Warning>
Việc thay đổi nhà cung cấp nhúng, mô hình, cài đặt nhà cung cấp, nguồn, phạm vi,
cách chia đoạn hoặc bộ tách từ có thể khiến chỉ mục vectơ SQLite hiện có không tương thích.
OpenClaw tạm dừng tìm kiếm vectơ và báo cảnh báo về danh tính chỉ mục thay vì
tự động nhúng lại mọi thứ. Khi đã sẵn sàng, hãy xây dựng lại bằng
`openclaw memory status --index --agent <id>` hoặc
`openclaw memory index --force --agent <id>`.
</Warning>

Khi `provider` chưa được đặt, có cấu hình cũ `provider: "auto"` hoặc
`provider: "none"` được dùng để chủ ý chọn chế độ chỉ dùng FTS, việc truy hồi bộ nhớ vẫn có thể
sử dụng xếp hạng FTS theo từ vựng khi tính năng nhúng không khả dụng.

Các nhà cung cấp không cục bộ được chỉ định rõ sẽ đóng khi gặp lỗi. Nếu bạn đặt `memorySearch.provider` thành
một nhà cung cấp cụ thể dựa trên dịch vụ từ xa như Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage hoặc một nhà cung cấp tùy chỉnh
tương thích với OpenAI và nhà cung cấp đó không khả dụng trong thời gian chạy, `memory_search`
sẽ trả về kết quả không khả dụng thay vì âm thầm sử dụng truy hồi chỉ bằng FTS. Hãy sửa
cấu hình nhà cung cấp/xác thực, chuyển sang một nhà cung cấp có thể truy cập hoặc đặt
`provider: "none"` nếu bạn chủ ý muốn truy hồi chỉ bằng FTS.

### Mã định danh nhà cung cấp tùy chỉnh

`memorySearch.provider` có thể trỏ đến một mục `models.providers.<id>` tùy chỉnh dành cho các bộ điều hợp nhà cung cấp chuyên biệt cho bộ nhớ như `ollama`, hoặc dành cho các API mô hình tương thích với OpenAI như `openai-responses` / `openai-completions`. OpenClaw phân giải bên sở hữu `api` của nhà cung cấp đó cho bộ điều hợp nhúng, đồng thời giữ nguyên mã định danh nhà cung cấp tùy chỉnh để xử lý điểm cuối, xác thực và tiền tố mô hình. Điều này cho phép các thiết lập nhiều GPU hoặc nhiều máy chủ dành riêng việc nhúng bộ nhớ cho một điểm cuối cục bộ cụ thể:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### Phân giải khóa API

Tính năng nhúng từ xa yêu cầu khóa API. Thay vào đó, Bedrock sử dụng chuỗi thông tin xác thực mặc định của AWS SDK (vai trò phiên bản máy, SSO, khóa truy cập hoặc khóa API Bedrock).

| Nhà cung cấp  | Biến môi trường                                     | Khóa cấu hình                        |
| ------------- | --------------------------------------------------- | ------------------------------------ |
| Bedrock       | Chuỗi thông tin xác thực AWS hoặc `AWS_BEARER_TOKEN_BEDROCK` | Không cần khóa API          |
| DeepInfra     | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey`  |
| Gemini        | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`     |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Hồ sơ xác thực qua đăng nhập thiết bị |
| Mistral       | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`    |
| Ollama        | `OLLAMA_API_KEY` (giá trị giữ chỗ)                  | --                                   |
| OpenAI        | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`     |
| Voyage        | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`     |

<Note>
OAuth của Codex chỉ áp dụng cho trò chuyện/hoàn thành và không đáp ứng các yêu cầu nhúng.
</Note>

---

## Cấu hình điểm cuối từ xa

Sử dụng `provider: "openai-compatible"` cho máy chủ `/v1/embeddings`
tương thích chung với OpenAI nhưng không được kế thừa thông tin xác thực trò chuyện OpenAI toàn cục.

<ParamField path="remote.baseUrl" type="string">
  URL cơ sở API tùy chỉnh.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Ghi đè khóa API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Các tiêu đề HTTP bổ sung (được hợp nhất với giá trị mặc định của nhà cung cấp).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Cấu hình dành riêng cho nhà cung cấp

<AccordionGroup>
  <Accordion title="Gemini">
    | Khóa                   | Kiểu     | Mặc định               | Mô tả                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Cũng hỗ trợ `gemini-embedding-2-preview`   |
    | `outputDimensionality` | `number` | `3072`                 | Đối với Embedding 2: 768, 1536 hoặc 3072   |

    <Warning>
    Việc thay đổi mô hình hoặc `outputDimensionality` sẽ thay đổi danh tính chỉ mục. OpenClaw
    tạm dừng tìm kiếm vectơ cho đến khi bạn chủ động xây dựng lại chỉ mục bộ nhớ.
    </Warning>

  </Accordion>
  <Accordion title="Kiểu đầu vào tương thích với OpenAI">
    Các điểm cuối nhúng tương thích với OpenAI có thể chọn sử dụng các trường yêu cầu `input_type` dành riêng cho nhà cung cấp. Điều này hữu ích cho các mô hình nhúng bất đối xứng yêu cầu nhãn khác nhau cho phần nhúng truy vấn và tài liệu.

    | Khóa                | Kiểu     | Mặc định  | Mô tả                                                          |
    | ------------------- | -------- | --------- | -------------------------------------------------------------- |
    | `inputType`         | `string` | chưa đặt  | `input_type` dùng chung cho phần nhúng truy vấn và tài liệu     |
    | `queryInputType`    | `string` | chưa đặt  | `input_type` tại thời điểm truy vấn; ghi đè `inputType`         |
    | `documentInputType` | `string` | chưa đặt  | `input_type` cho chỉ mục/tài liệu; ghi đè `inputType`           |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Việc thay đổi các giá trị này ảnh hưởng đến danh tính bộ nhớ đệm nhúng khi lập chỉ mục theo lô của nhà cung cấp và cần được tiếp nối bằng việc lập lại chỉ mục bộ nhớ nếu mô hình thượng nguồn xử lý các nhãn theo cách khác nhau.

  </Accordion>
  <Accordion title="Bedrock">
    ### Cấu hình nhúng Bedrock

    Bedrock sử dụng chuỗi thông tin xác thực mặc định của AWS SDK cùng với mã thông báo mang do OpenClaw kiểm tra, vì vậy không có khóa API nào được lưu trong cấu hình. Nếu OpenClaw chạy trên EC2 với một vai trò phiên bản máy đã bật Bedrock, chỉ cần đặt nhà cung cấp và mô hình:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | Khóa                   | Kiểu     | Mặc định                       | Mô tả                               |
    | ---------------------- | -------- | ------------------------------ | ----------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Mã định danh mô hình nhúng Bedrock bất kỳ |
    | `outputDimensionality` | `number` | mặc định của mô hình           | Đối với Titan V2: 256, 512 hoặc 1024 |

    **Các mô hình được hỗ trợ** (có tính năng phát hiện họ mô hình và giá trị kích thước mặc định):

    | ID mô hình                                   | Nhà cung cấp | Số chiều mặc định | Số chiều có thể cấu hình     |
    | ------------------------------------------- | ------------ | ----------------- | ---------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon       | 1024              | 256, 512, 1024               |
    | `amazon.titan-embed-text-v1`               | Amazon       | 1536              | --                           |
    | `amazon.titan-embed-g1-text-02`            | Amazon       | 1536              | --                           |
    | `amazon.titan-embed-image-v1`              | Amazon       | 1024              | --                           |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon       | 1024              | 256, 384, 1024, 3072         |
    | `cohere.embed-english-v3`                  | Cohere       | 1024              | --                           |
    | `cohere.embed-multilingual-v3`             | Cohere       | 1024              | --                           |
    | `cohere.embed-v4:0`                        | Cohere       | 1536              | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs   | 512               | --                           |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs   | 1024              | --                           |

    Các biến thể có hậu tố thông lượng (ví dụ: `amazon.titan-embed-text-v1:2:8k`) và ID hồ sơ suy luận có tiền tố vùng (ví dụ: `us.amazon.titan-embed-text-v2:0`) kế thừa cấu hình của mô hình cơ sở.

    **Vùng:** được xác định theo thứ tự sau: giá trị ghi đè `memorySearch.remote.baseUrl`, cấu hình `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION`, sau đó là giá trị mặc định `us-east-1`.

    **Xác thực:** trước tiên OpenClaw kiểm tra `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` hoặc `AWS_BEARER_TOKEN_BEDROCK`, sau đó chuyển sang chuỗi nhà cung cấp thông tin xác thực mặc định tiêu chuẩn của AWS SDK:

    1. Biến môi trường (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), trừ khi `AWS_PROFILE` cũng được đặt
    2. SSO (chỉ khi các trường SSO được cấu hình)
    3. Tệp thông tin xác thực và cấu hình dùng chung (`fromIni`, bao gồm `AWS_PROFILE`)
    4. Tiến trình thông tin xác thực (`credential_process` trong tệp cấu hình AWS)
    5. Thông tin xác thực bằng mã thông báo danh tính web
    6. Thông tin xác thực từ siêu dữ liệu phiên bản ECS hoặc EC2

    **Quyền IAM:** vai trò hoặc người dùng IAM cần:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Để áp dụng đặc quyền tối thiểu, giới hạn phạm vi `InvokeModel` cho mô hình cụ thể:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Cục bộ (GGUF + llama.cpp)">
    | Khóa                  | Kiểu               | Mặc định                 | Mô tả                                                                                                                                                                                                                                                                                                                        |
    | --------------------- | ------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | tự động tải xuống        | Đường dẫn đến tệp mô hình GGUF                                                                                                                                                                                                                                                                                               |
    | `local.modelCacheDir` | `string`           | mặc định của node-llama-cpp | Thư mục bộ nhớ đệm cho các mô hình đã tải xuống                                                                                                                                                                                                                                                                              |
    | `local.contextSize`   | `number \| "auto"` | `4096`                   | Kích thước cửa sổ ngữ cảnh cho ngữ cảnh nhúng. 4096 đáp ứng các đoạn điển hình (128-512 token) đồng thời giới hạn VRAM không dùng cho trọng số. Giảm xuống 1024-2048 trên các máy chủ bị hạn chế tài nguyên. `"auto"` sử dụng mức tối đa mà mô hình được huấn luyện -- không khuyến nghị cho các mô hình từ 8B trở lên (Qwen3-Embedding-8B: tối đa 40 960 token có thể đẩy mức sử dụng VRAM lên khoảng 32 GB). |

    Trước tiên, hãy cài đặt nhà cung cấp llama.cpp chính thức: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Mô hình mặc định: `embeddinggemma-300m-qat-Q8_0.gguf` (khoảng 0,6 GB, được tự động tải xuống). Các bản sao mã nguồn vẫn yêu cầu phê duyệt bản dựng gốc: `pnpm approve-builds`, sau đó chạy `pnpm rebuild node-llama-cpp`.

    Sử dụng CLI độc lập để xác minh cùng đường dẫn nhà cung cấp mà Gateway sử dụng:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Các giá trị số của `local.contextSize` cũng cung cấp thông tin cho cơ chế tự động bố trí lớp GPU của node-llama-cpp, để trọng số mô hình và ngữ cảnh nhúng được yêu cầu được bố trí phù hợp cùng nhau. Sau khi môi trường chạy đã tải xong, `openclaw memory status --deep` báo cáo backend llama.cpp, thiết bị, trạng thái giảm tải, ngữ cảnh được yêu cầu và thông tin bộ nhớ có dấu thời gian đã biết gần nhất; trạng thái thụ động không tải mô hình.

    Đặt rõ ràng `provider: "local"` cho các embedding GGUF cục bộ. Tham chiếu mô hình `hf:` và HTTP(S) được hỗ trợ cho cấu hình cục bộ tường minh (thông qua cơ chế phân giải mô hình của node-llama-cpp), nhưng chúng không thay đổi nhà cung cấp mặc định.

  </Accordion>
</AccordionGroup>

### Thời gian chờ embedding nội tuyến

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Ghi đè thời gian chờ cho các lô embedding nội tuyến trong quá trình lập chỉ mục bộ nhớ.

Khi không đặt, hệ thống sử dụng giá trị mặc định của nhà cung cấp: 600 giây đối với các nhà cung cấp cục bộ/tự lưu trữ như `local`, `ollama` và `lmstudio`, và 120 giây đối với các nhà cung cấp được lưu trữ. Hãy tăng giá trị này khi các lô embedding cục bộ phụ thuộc vào CPU vẫn hoạt động bình thường nhưng chậm.
</ParamField>

---

## Hành vi lập chỉ mục

Tất cả đều thuộc `memorySearch.sync`, trừ khi có ghi chú khác:

| Khóa                           | Kiểu      | Mặc định | Mô tả                                                                                  |
| ------------------------------ | --------- | -------- | -------------------------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`   | Đồng bộ chỉ mục bộ nhớ khi một phiên bắt đầu                                           |
| `onSearch`                     | `boolean` | `true`   | Đồng bộ trì hoãn khi tìm kiếm sau khi phát hiện nội dung thay đổi                      |
| `watch`                        | `boolean` | `true`   | Theo dõi các tệp bộ nhớ (chokidar) và lên lịch lập lại chỉ mục khi có thay đổi          |
| `watchDebounceMs`              | `number`  | `1500`   | Khoảng trì hoãn để hợp nhất các sự kiện theo dõi tệp diễn ra liên tiếp nhanh chóng     |
| `intervalMinutes`              | `number`  | `0`      | Khoảng thời gian lập lại chỉ mục định kỳ tính bằng phút (`0` để tắt)                   |
| `sessions.postCompactionForce` | `boolean` | `true`   | Buộc lập lại chỉ mục phiên sau khi Compaction kích hoạt cập nhật bản ghi hội thoại     |

<ParamField path="chunking.tokens" type="number">
  Kích thước đoạn tính theo token được dùng khi chia nguồn bộ nhớ trước khi nhúng (mặc định: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Số token chồng lấn giữa các đoạn liền kề để giữ nguyên ngữ cảnh gần ranh giới phân chia (mặc định: 80).
</ParamField>

<Note>
Việc thay đổi `chunking.tokens` hoặc `chunking.overlap` sẽ làm thay đổi ranh giới đoạn và vô hiệu hóa định danh chỉ mục hiện có (xem phần Cảnh báo trong mục Lựa chọn nhà cung cấp).
</Note>

---

## Cấu hình tìm kiếm kết hợp

Tất cả đều nằm trong `memorySearch.query`:

| Khóa         | Kiểu     | Mặc định | Mô tả                                               |
| ------------ | -------- | -------- | --------------------------------------------------- |
| `maxResults` | `number` | `6`      | Số kết quả bộ nhớ tối đa được trả về trước khi chèn |
| `minScore`   | `number` | `0.35`   | Điểm liên quan tối thiểu để đưa kết quả vào          |

Và trong `memorySearch.query.hybrid`:

| Khóa                  | Kiểu      | Mặc định | Mô tả                                      |
| --------------------- | --------- | -------- | ------------------------------------------ |
| `enabled`             | `boolean` | `true`   | Bật tìm kiếm kết hợp BM25 + vectơ          |
| `vectorWeight`        | `number`  | `0.7`    | Trọng số cho điểm vectơ (0-1)              |
| `textWeight`          | `number`  | `0.3`    | Trọng số cho điểm BM25 (0-1)               |
| `candidateMultiplier` | `number`  | `4`      | Hệ số nhân kích thước tập ứng viên         |

<Tabs>
  <Tab title="MMR (đa dạng)">
    | Khóa          | Kiểu      | Mặc định | Mô tả                                        |
    | ------------- | --------- | -------- | -------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`  | Bật xếp hạng lại bằng MMR                    |
    | `mmr.lambda`  | `number`  | `0.7`    | 0 = đa dạng tối đa, 1 = liên quan tối đa     |
  </Tab>
  <Tab title="Suy giảm theo thời gian (độ mới)">
    | Khóa                         | Kiểu      | Mặc định | Mô tả                              |
    | ---------------------------- | --------- | -------- | ---------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`  | Bật tăng điểm theo độ mới          |
    | `temporalDecay.halfLifeDays` | `number`  | `30`     | Điểm giảm một nửa sau mỗi N ngày   |

    Các tệp thường xanh (`MEMORY.md`, các tệp không ghi ngày trong `memory/`) không bao giờ bị suy giảm.

  </Tab>
</Tabs>

### Ví dụ đầy đủ

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Đường dẫn bộ nhớ bổ sung

| Khóa         | Kiểu       | Mô tả                                      |
| ------------ | ---------- | ------------------------------------------ |
| `extraPaths` | `string[]` | Các thư mục hoặc tệp bổ sung cần lập chỉ mục |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Đường dẫn có thể là tuyệt đối hoặc tương đối với không gian làm việc. Các thư mục được quét đệ quy để tìm tệp `.md`. Cách xử lý liên kết tượng trưng phụ thuộc vào phần phụ trợ đang hoạt động: công cụ tích hợp sẵn bỏ qua liên kết tượng trưng, còn QMD tuân theo hành vi của trình quét QMD nền tảng.

Để tìm kiếm bản chép lời giữa các tác nhân trong phạm vi tác nhân, hãy dùng `agents.list[].memorySearch.qmd.extraCollections` thay cho `memory.qmd.paths`. Các bộ sưu tập bổ sung đó có cùng cấu trúc `{ path, name, pattern? }`, nhưng được hợp nhất theo từng tác nhân và có thể giữ nguyên tên dùng chung được chỉ định rõ khi đường dẫn trỏ ra ngoài không gian làm việc hiện tại. Nếu cùng một đường dẫn đã phân giải xuất hiện trong cả `memory.qmd.paths` và `memorySearch.qmd.extraCollections`, QMD giữ mục đầu tiên và bỏ qua mục trùng lặp.

---

## Bộ nhớ đa phương thức (Gemini)

Lập chỉ mục hình ảnh và âm thanh cùng với Markdown bằng Gemini Embedding 2:

| Khóa                      | Kiểu       | Mặc định   | Mô tả                                           |
| ------------------------- | ---------- | ---------- | ----------------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Bật lập chỉ mục đa phương thức                  |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` hoặc `["all"]`         |
| `multimodal.maxFileBytes` | `number`   | `10485760` | Kích thước tệp tối đa để lập chỉ mục (10 MiB)   |

<Note>
Chỉ áp dụng cho các tệp trong `extraPaths`. Các thư mục gốc bộ nhớ mặc định vẫn chỉ hỗ trợ Markdown. Yêu cầu `gemini-embedding-2-preview`. `fallback` phải là `"none"`.
</Note>

Các định dạng được hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (hình ảnh); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (âm thanh).

---

## Bộ nhớ đệm embedding

| Khóa               | Kiểu      | Mặc định     | Mô tả                                            |
| ------------------ | --------- | ------------ | ------------------------------------------------ |
| `cache.enabled`    | `boolean` | `true`       | Lưu embedding của các phân đoạn vào SQLite       |
| `cache.maxEntries` | `number`  | chưa thiết lập | Giới hạn trên theo nỗ lực tối đa cho embedding được lưu đệm |

Ngăn việc tạo lại embedding cho văn bản không thay đổi trong quá trình lập chỉ mục lại hoặc cập nhật bản chép lời. Để `maxEntries` ở trạng thái chưa thiết lập nếu muốn bộ nhớ đệm không giới hạn; hãy thiết lập giá trị này khi mức tăng dung lượng ổ đĩa quan trọng hơn tốc độ lập chỉ mục lại tối đa. Khi được thiết lập, các mục cũ nhất (theo thời gian cập nhật gần nhất) sẽ bị loại bỏ trước khi bộ nhớ đệm vượt quá giới hạn.

---

## Lập chỉ mục theo lô

| Khóa                          | Kiểu      | Mặc định | Mô tả                              |
| ----------------------------- | --------- | -------- | ---------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`      | Các embedding trực tiếp song song  |
| `remote.batch.enabled`        | `boolean` | `false`  | Bật API embedding theo lô           |
| `remote.batch.concurrency`    | `number`  | `2`      | Các tác vụ theo lô song song        |
| `remote.batch.wait`           | `boolean` | `true`   | Chờ hoàn tất lô                     |
| `remote.batch.pollIntervalMs` | `number`  | `2000`   | Khoảng thời gian thăm dò            |
| `remote.batch.timeoutMinutes` | `number`  | `60`     | Thời gian chờ tối đa của lô         |

Khả dụng cho `gemini`, `openai` và `voyage`. Chế độ theo lô của OpenAI thường nhanh nhất và rẻ nhất khi bổ sung lượng lớn dữ liệu cũ.

`remote.nonBatchConcurrency` kiểm soát các lệnh gọi embedding trực tiếp được dùng bởi các nhà cung cấp cục bộ/tự lưu trữ và các nhà cung cấp được lưu trữ khi API theo lô của nhà cung cấp không hoạt động. Ollama mặc định là `1` đối với việc lập chỉ mục không theo lô để tránh làm quá tải các máy chủ cục bộ nhỏ hơn; hãy đặt giá trị cao hơn trên các máy có cấu hình mạnh hơn.

Thiết lập này tách biệt với `sync.embeddingBatchTimeoutSeconds`, vốn kiểm soát thời gian chờ tối đa cho các lệnh gọi embedding trực tiếp.

---

## Tìm kiếm bộ nhớ phiên (thử nghiệm)

Lập chỉ mục bản chép lời phiên và cung cấp chúng qua `memory_search`:

| Khóa                          | Kiểu       | Mặc định      | Mô tả                                              |
| ----------------------------- | ---------- | ------------- | -------------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`       | Bật lập chỉ mục phiên                              |
| `sources`                     | `string[]` | `["memory"]`  | Thêm `"sessions"` để bao gồm bản chép lời          |
| `sync.sessions.deltaBytes`    | `number`   | `100000`      | Ngưỡng byte để lập chỉ mục lại                     |
| `sync.sessions.deltaMessages` | `number`   | `50`          | Ngưỡng số tin nhắn để lập chỉ mục lại              |

<Warning>
Việc lập chỉ mục phiên phải được chủ động bật và chạy bất đồng bộ. Kết quả có thể hơi lỗi thời. Nhật ký phiên nằm trên ổ đĩa, vì vậy hãy coi quyền truy cập hệ thống tệp là ranh giới tin cậy.
</Warning>

Các kết quả khớp từ bản chép lời phiên cũng tuân theo
[`tools.sessions.visibility`](/vi/gateway/config-tools#toolssessions). Chế độ hiển thị mặc định
`tree` chỉ cho phép truy cập phiên hiện tại và các phiên do phiên đó tạo ra. Để
truy xuất một phiên không liên quan của cùng tác nhân, được Gateway điều phối từ một
phiên khác, chẳng hạn như tin nhắn trực tiếp, hãy chủ động mở rộng chế độ hiển thị thành `agent` (hoặc chỉ dùng `all`
khi cũng cần truy xuất giữa các tác nhân và chính sách giữa tác nhân với tác nhân cho phép).

Các ví dụ bên dưới đặt những thiết lập này trong `agents.defaults`. Bạn cũng có thể
áp dụng các thiết lập `memorySearch` tương đương trong phần ghi đè theo từng tác nhân khi chỉ một
tác nhân cần lập chỉ mục và tìm kiếm bản chép lời phiên.

Để truy xuất từ Gateway sang tin nhắn trực tiếp trong cùng tác nhân:

<Tabs>
  <Tab title="Phần phụ trợ tích hợp sẵn">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="Phần phụ trợ QMD">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

Khi sử dụng QMD, riêng `agents.defaults.memorySearch.experimental.sessionMemory` và
`sources: ["sessions"]` không xuất bản chép lời vào QMD. Đồng thời hãy đặt
`memory.qmd.sessions.enabled: true`.

---

  ## Tăng tốc vectơ SQLite (sqlite-vec)

  | Khóa                         | Kiểu      | Mặc định | Mô tả                                  |
  | ---------------------------- | --------- | -------- | -------------------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`   | Sử dụng sqlite-vec cho truy vấn vectơ  |
  | `store.vector.extensionPath` | `string`  | đi kèm   | Ghi đè đường dẫn sqlite-vec             |

  Khi sqlite-vec không khả dụng, OpenClaw tự động chuyển sang sử dụng độ tương đồng cosin trong tiến trình.

  ---

  ## Lưu trữ chỉ mục

  Các chỉ mục bộ nhớ tích hợp nằm trong cơ sở dữ liệu SQLite OpenClaw của từng tác nhân tại
  `agents/<agentId>/agent/openclaw-agent.sqlite`.

  | Khóa                  | Kiểu     | Mặc định   | Mô tả                                      |
  | --------------------- | -------- | ---------- | ------------------------------------------ |
  | `store.fts.tokenizer` | `string` | `unicode61` | Bộ tách từ FTS5 (`unicode61` hoặc `trigram`) |

  ---

  ## Cấu hình backend QMD

  Đặt `memory.backend = "qmd"` để bật. Tất cả cài đặt QMD nằm trong `memory.qmd`:

  | Khóa                     | Kiểu      | Mặc định | Mô tả                                                                                                   |
  | ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`    | Đường dẫn tệp thực thi QMD; đặt đường dẫn tuyệt đối khi `PATH` của dịch vụ khác với shell của bạn       |
  | `searchMode`             | `string`  | `search` | Lệnh tìm kiếm: `search`, `vsearch`, `query`                                                             |
  | `rerank`                 | `boolean` | --       | Đặt thành `false` với `searchMode: "query"` và QMD 2.1+ để bỏ qua việc xếp hạng lại của QMD             |
  | `includeDefaultMemory`   | `boolean` | `true`   | Tự động lập chỉ mục `MEMORY.md` + `memory/**/*.md`                                                      |
  | `paths[]`                | `array`   | --       | Các đường dẫn bổ sung: `{ name, path, pattern? }`                                                       |
  | `sessions.enabled`       | `boolean` | `false`  | Xuất bản ghi phiên vào QMD                                                                               |
  | `sessions.retentionDays` | `number`  | --       | Thời gian lưu giữ bản ghi                                                                                |
  | `sessions.exportDir`     | `string`  | --       | Thư mục xuất                                                                                             |

  `searchMode: "search"` chỉ sử dụng tìm kiếm từ vựng/BM25. OpenClaw không chạy các phép kiểm tra mức độ sẵn sàng của vectơ ngữ nghĩa hoặc bảo trì embedding QMD cho chế độ đó, kể cả trong `memory status --deep`; `vsearch` và `query` vẫn yêu cầu vectơ QMD sẵn sàng và có embedding.

  `rerank: false` chỉ thay đổi chế độ `query` của QMD và yêu cầu QMD 2.1 trở lên. Trong chế độ CLI trực tiếp, OpenClaw truyền `--no-rerank`; trong chế độ MCP dựa trên mcporter, OpenClaw truyền `rerank: false` đến công cụ truy vấn hợp nhất của QMD. Không đặt giá trị này để sử dụng hành vi xếp hạng lại truy vấn mặc định của QMD.

  OpenClaw ưu tiên các dạng truy vấn MCP và bộ sưu tập QMD hiện tại, nhưng vẫn duy trì khả năng hoạt động với các bản phát hành QMD cũ hơn bằng cách thử các cờ mẫu bộ sưu tập tương thích và tên công cụ MCP cũ hơn khi cần. Khi QMD thông báo hỗ trợ nhiều bộ lọc bộ sưu tập, các bộ sưu tập cùng nguồn được tìm kiếm bằng một tiến trình QMD; các bản dựng QMD cũ hơn tiếp tục dùng đường dẫn tương thích riêng cho từng bộ sưu tập. Cùng nguồn có nghĩa là các bộ sưu tập bộ nhớ bền vững (các tệp bộ nhớ mặc định cùng với đường dẫn tùy chỉnh) được nhóm lại với nhau, trong khi các bộ sưu tập bản ghi phiên vẫn là một nhóm riêng để việc đa dạng hóa nguồn vẫn có cả hai đầu vào.

  <Note>
  Các ghi đè mô hình QMD nằm ở phía QMD, không nằm trong cấu hình OpenClaw. Nếu cần ghi đè toàn cục các mô hình của QMD, hãy đặt các biến môi trường như `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` và `QMD_GENERATE_MODEL` trong môi trường thời gian chạy của Gateway.
  </Note>

  ### Tích hợp mcporter

  Tất cả nằm trong `memory.qmd.mcporter`. Định tuyến các lượt tìm kiếm QMD qua một trình nền MCP `mcporter` chạy lâu dài thay vì tạo `qmd` cho mỗi truy vấn, giúp giảm chi phí khởi động nguội đối với các mô hình lớn hơn.

  | Khóa          | Kiểu      | Mặc định | Mô tả                                                                            |
  | ------------- | --------- | -------- | -------------------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false`  | Định tuyến các lệnh gọi QMD qua mcporter thay vì tạo `qmd` cho mỗi yêu cầu       |
  | `serverName`  | `string`  | `qmd`    | Tên máy chủ mcporter chạy `qmd mcp` với `lifecycle: keep-alive`                  |
  | `startDaemon` | `boolean` | `true`   | Tự động khởi động trình nền mcporter khi `enabled` là true                       |

  Yêu cầu cài đặt `mcporter` và có trong PATH, cùng với một máy chủ mcporter đã cấu hình để chạy `qmd mcp`. Giữ trạng thái tắt đối với các thiết lập cục bộ đơn giản hơn, nơi chi phí tạo tiến trình cho từng truy vấn ở mức chấp nhận được.

  <AccordionGroup>
  <Accordion title="Lịch cập nhật">
    | Khóa                      | Kiểu      | Mặc định | Mô tả                                                                                                 |
    | ------------------------- | --------- | -------- | ----------------------------------------------------------------------------------------------------- |
    | `update.interval`         | `string`  | `5m`     | Khoảng thời gian làm mới                                                                              |
    | `update.debounceMs`       | `number`  | `15000`  | Chống dội các thay đổi tệp                                                                            |
    | `update.onBoot`           | `boolean` | `true`   | Làm mới khi trình quản lý QMD chạy lâu dài mở; đặt thành false để bỏ qua lần cập nhật ngay khi khởi động |
    | `update.startup`          | `string`  | `off`    | Khởi tạo QMD tùy chọn khi Gateway khởi động: `off`, `idle` hoặc `immediate`                            |
    | `update.startupDelayMs`   | `number`  | `120000` | Độ trễ trước khi lần làm mới `startup: "idle"` chạy                                                    |
    | `update.waitForBootSync`  | `boolean` | `false`  | Chặn việc mở trình quản lý cho đến khi lần làm mới ban đầu hoàn tất                                   |
    | `update.embedInterval`    | `string`  | `60m`    | Nhịp tạo embedding riêng                                                                              |
    | `update.commandTimeoutMs` | `number`  | `30000`  | Thời gian chờ cho các lệnh bảo trì QMD (liệt kê/thêm bộ sưu tập)                                      |
    | `update.updateTimeoutMs`  | `number`  | `120000` | Thời gian chờ cho mỗi chu kỳ `qmd update`                                                             |
    | `update.embedTimeoutMs`   | `number`  | `120000` | Thời gian chờ cho mỗi chu kỳ `qmd embed`                                                              |
  </Accordion>
  <Accordion title="Giới hạn">
    | Khóa                      | Kiểu     | Mặc định | Mô tả                                |
    | ------------------------- | -------- | -------- | ------------------------------------ |
    | `limits.maxResults`       | `number` | `4`      | Số kết quả tìm kiếm tối đa           |
    | `limits.maxSnippetChars`  | `number` | `450`    | Giới hạn độ dài đoạn trích           |
    | `limits.maxInjectedChars` | `number` | `2200`   | Giới hạn tổng số ký tự được chèn     |
    | `limits.timeoutMs`        | `number` | `4000`   | Thời gian chờ tìm kiếm               |
  </Accordion>
  <Accordion title="Phạm vi">
    Kiểm soát những phiên nào có thể nhận kết quả tìm kiếm QMD. Có cùng lược đồ với [`session.sendPolicy`](/vi/gateway/config-agents#session):

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    Giá trị mặc định được phân phối chỉ cho phép tin nhắn trực tiếp/trò chuyện trực tiếp, từ chối các nhóm và những loại kênh khác. `match.keyPrefix` khớp với khóa phiên đã chuẩn hóa; `match.rawKeyPrefix` khớp với khóa thô bao gồm `agent:<id>:`.

  </Accordion>
  <Accordion title="Trích dẫn">
    `memory.citations` áp dụng cho tất cả các backend:

    | Giá trị          | Hành vi                                                       |
    | ------------------ | -------------------------------------------------------------- |
    | `auto` (mặc định) | Bao gồm phần chân trang `Source: <path#line>` trong các đoạn trích |
    | `on`             | Luôn bao gồm phần chân trang                                   |
    | `off`            | Bỏ phần chân trang (đường dẫn vẫn được truyền nội bộ cho tác tử) |

  </Accordion>
</AccordionGroup>

Khi tính năng khởi tạo QMD lúc Gateway khởi động được bật, OpenClaw chỉ khởi động QMD cho các tác tử đủ điều kiện. Nếu `update.onBoot` là true và không cấu hình bảo trì theo khoảng thời gian/nhúng, quá trình khởi động sử dụng một trình quản lý chạy một lần để làm mới khi khởi động rồi đóng trình quản lý đó. Nếu cấu hình khoảng thời gian cập nhật hoặc nhúng, quá trình khởi động sẽ mở trình quản lý QMD dài hạn để quản lý trình theo dõi và các bộ hẹn giờ theo khoảng thời gian; `update.onBoot: false` chỉ bỏ qua lần làm mới ngay khi khởi động.

### Ví dụ QMD đầy đủ

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming được cấu hình trong `plugins.entries.memory-core.config.dreaming`, không phải trong `agents.defaults.memorySearch`.

Dreaming chạy dưới dạng một lượt quét theo lịch duy nhất và sử dụng các giai đoạn nội bộ nhẹ/sâu/REM như một chi tiết triển khai.

Để tìm hiểu hành vi khái niệm và các lệnh gạch chéo, hãy xem [Dreaming](/vi/concepts/dreaming).

### Cài đặt người dùng

| Khóa                                   | Kiểu      | Mặc định      | Mô tả                                                                                                                                       |
| -------------------------------------- | --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Bật hoặc tắt hoàn toàn Dreaming                                                                                                             |
| `frequency`                            | `string`  | `0 3 * * *`   | Nhịp Cron tùy chọn cho toàn bộ lượt quét Dreaming                                                                                           |
| `model`                                | `string`  | mô hình mặc định | Tùy chọn ghi đè mô hình tác tử phụ Dream Diary                                                                                              |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Số token ước tính tối đa được giữ lại từ mỗi đoạn trích truy hồi ngắn hạn được đưa vào `MEMORY.md`; siêu dữ liệu nguồn gốc vẫn hiển thị |

### Ví dụ

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming ghi trạng thái máy vào `memory/.dreams/`.
- Dreaming ghi đầu ra tường thuật mà con người có thể đọc vào `DREAMS.md` (hoặc tệp `dreams.md` hiện có).
- `dreaming.model` sử dụng cổng tin cậy tác tử phụ hiện có của plugin; hãy đặt `plugins.entries.memory-core.subagent.allowModelOverride: true` trước khi bật.
- Dream Diary thử lại một lần bằng mô hình mặc định của phiên khi mô hình đã cấu hình không khả dụng. Các lỗi về độ tin cậy hoặc danh sách cho phép được ghi nhật ký và không được âm thầm thử lại.
- Chính sách và các ngưỡng của giai đoạn nhẹ/sâu/REM là hành vi nội bộ, không phải cấu hình dành cho người dùng.

</Note>

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
