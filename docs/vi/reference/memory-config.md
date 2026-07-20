---
read_when:
    - Bạn muốn cấu hình nhà cung cấp tìm kiếm bộ nhớ hoặc mô hình embedding
    - Bạn muốn thiết lập backend QMD
    - Bạn muốn bật tìm kiếm kết hợp, MMR hoặc suy giảm theo thời gian
    - Bạn muốn bật tính năng lập chỉ mục bộ nhớ đa phương thức
sidebarTitle: Memory config
summary: Nhà cung cấp tìm kiếm bộ nhớ, chế độ truy xuất, QMD và lập chỉ mục đa phương thức
title: Tài liệu tham khảo về cấu hình bộ nhớ
x-i18n:
    generated_at: "2026-07-20T04:48:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 11d9e7e5feed39280a4210cfb9cc245422949d3559fcad4450028943b4dc907f
    source_path: reference/memory-config.md
    workflow: 16
---

Trang này liệt kê mọi tùy chọn cấu hình cho tìm kiếm bộ nhớ của OpenClaw. Để xem tổng quan về khái niệm, hãy xem:

<CardGroup cols={2}>
  <Card title="Tổng quan về bộ nhớ" href="/vi/concepts/memory">
    Cách bộ nhớ hoạt động.
  </Card>
  <Card title="Công cụ tích hợp sẵn" href="/vi/concepts/memory-builtin">
    Backend SQLite mặc định.
  </Card>
  <Card title="Công cụ QMD" href="/vi/concepts/memory-qmd">
    Sidecar ưu tiên cục bộ.
  </Card>
  <Card title="Tìm kiếm bộ nhớ" href="/vi/concepts/memory-search">
    Pipeline tìm kiếm và tinh chỉnh.
  </Card>
  <Card title="Active Memory" href="/vi/concepts/active-memory">
    Tác nhân phụ bộ nhớ cho các phiên tương tác.
  </Card>
</CardGroup>

Mọi cài đặt tìm kiếm bộ nhớ đều nằm trong `agents.defaults.memorySearch` tại `openclaw.json` (hoặc một giá trị ghi đè `agents.list[].memorySearch` theo từng tác nhân), trừ khi có ghi chú khác.

<Note>
Đối với quy trình làm việc được đề xuất cho tác nhân cá nhân, hãy sử dụng
`memorySearch.rememberAcrossConversations`. Các điều khiển nâng cao về đích nhắm,
mô hình, prompt và độ trễ của Active Memory nằm trong `plugins.entries.active-memory`.

Xem [Active Memory](/vi/concepts/active-memory) để biết cả hai cách kích hoạt,
cơ chế lưu bền bản chép lời và hướng dẫn triển khai an toàn.
</Note>

---

## Ghi nhớ giữa các cuộc trò chuyện

| Khóa                           | Kiểu      | Mặc định                                                    | Mô tả                                                                    |
| ----------------------------- | --------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `rememberAcrossConversations` | `boolean` | Bật cho bản cài đặt cá nhân; tắt khi đã cấu hình cô lập DM | Sử dụng ngữ cảnh liên quan từ các cuộc trò chuyện riêng tư được nhận diện khác của tác nhân này. |

Hãy cấu hình theo từng tác nhân khi chỉ một tác nhân cá nhân đáng tin cậy được phép sử dụng
khả năng truy hồi bản chép lời xuyên cuộc trò chuyện:

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        memorySearch: {
          rememberAcrossConversations: true,
        },
      },
    ],
  },
}
```

Giá trị tuân theo cơ chế kế thừa `agents.defaults.memorySearch` thông thường với một
giá trị ghi đè theo từng tác nhân. Khi chưa đặt, giá trị này chỉ mặc định bật nếu
`session.dmScope` toàn cục chưa được đặt hoặc là `"main"` và không liên kết nào có giá trị ghi đè
`session.dmScope`. Mọi cấu hình cô lập DM đều khiến giá trị này mặc định tắt. Giá trị `true` hoặc
`false` được đặt rõ ràng luôn được ưu tiên. Việc bật tính năng này ngụ ý lập chỉ mục bản chép lời phiên và
thêm `sessions` vào các nguồn bộ nhớ đã phân giải của tác nhân. Với QMD, tính năng này cũng
bật xuất phiên của tác nhân đó; chế độ này không yêu cầu cài đặt
`memory.qmd.sessions.enabled` riêng.

Nhà cung cấp bộ nhớ tích hợp sẵn của OpenClaw hỗ trợ đường dẫn được bảo vệ này với cả
backend tích hợp sẵn và QMD. Các nhà cung cấp bộ nhớ thay thế vẫn có thể tiếp tục sử dụng
hook truy hồi riêng và các công cụ Active Memory nâng cao, nhưng cài đặt này sẽ bị bỏ qua
trừ khi nhà cung cấp hiện tại hỗ trợ truy hồi bản chép lời riêng tư được bảo vệ.
`openclaw doctor` báo cáo nhà cung cấp không được hỗ trợ hoặc danh sách Active Memory
`toolsAllow` được đặt rõ ràng nhưng không bao gồm `memory_search`.

Ranh giới truy xuất hẹp hơn so với tìm kiếm phiên thông thường:

- chỉ các cuộc trò chuyện riêng tư được nhận diện của cùng tác nhân mới đủ điều kiện
- cuộc trò chuyện đang được trả lời bị loại trừ
- các nhóm và kênh bị loại khỏi cả nguồn lẫn đích
- các loại cuộc trò chuyện không xác định sẽ từ chối theo nguyên tắc an toàn
- khả năng truy hồi trong sandbox không thể sử dụng quyền đặc biệt xuyên cuộc trò chuyện

Cài đặt này không thay đổi `tools.sessions.visibility`, khóa phiên,
cơ chế lưu trữ bản chép lời, định tuyến phân phối hoặc quyền của `sessions_list`,
`sessions_history` và `sessions_send`. Active Memory thực hiện một lượt
truy xuất chỉ đọc có giới hạn; việc truy xuất không khả dụng hoặc hết thời gian không chặn
phản hồi.

---

## Lựa chọn nhà cung cấp

| Khóa        | Kiểu      | Mặc định          | Mô tả                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | Bật hoặc tắt tìm kiếm bộ nhớ                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | ID bộ điều hợp embedding như `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` hoặc `voyage`; cũng có thể là một `models.providers.<id>` đã cấu hình, trong đó `api` trỏ đến bộ điều hợp embedding bộ nhớ hoặc API mô hình tương thích với OpenAI |
| `model`    | `string`  | mặc định của nhà cung cấp | Tên mô hình embedding                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | ID bộ điều hợp dự phòng khi bộ điều hợp chính gặp lỗi                                                                                                                                                                                                                                                  |

Khi `provider` chưa được đặt, OpenClaw sử dụng embedding của OpenAI. Hãy đặt `provider`
một cách rõ ràng để sử dụng Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, mô hình GGUF cục bộ hoặc endpoint `/v1/embeddings` tương thích với OpenAI.
Các cấu hình cũ vẫn ghi `provider: "auto"` sẽ được phân giải thành `openai`.

<Warning>
Việc thay đổi nhà cung cấp embedding, mô hình, cài đặt nhà cung cấp, nguồn, phạm vi,
cách chia đoạn hoặc tokenizer có thể khiến chỉ mục vector SQLite hiện có không tương thích.
OpenClaw tạm dừng tìm kiếm vector và báo cáo cảnh báo về danh tính chỉ mục thay vì
tự động tạo lại embedding cho mọi thứ. Hãy xây dựng lại khi bạn sẵn sàng bằng
`openclaw memory status --index --agent <id>` hoặc
`openclaw memory index --force --agent <id>`.
</Warning>

Khi `provider` chưa được đặt, `provider: "auto"` cũ vẫn tồn tại hoặc
`provider: "none"` chủ ý chọn chế độ chỉ dùng FTS, việc truy hồi bộ nhớ vẫn có thể
sử dụng xếp hạng FTS từ vựng khi embedding không khả dụng.

Các nhà cung cấp không cục bộ được chỉ định rõ ràng sẽ từ chối theo nguyên tắc an toàn. Nếu bạn đặt `memorySearch.provider` thành
một nhà cung cấp cụ thể dựa trên dịch vụ từ xa như Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage hoặc một nhà cung cấp tùy chỉnh
tương thích với OpenAI, và nhà cung cấp đó không khả dụng khi chạy, `memory_search`
sẽ trả về kết quả không khả dụng thay vì âm thầm sử dụng truy hồi chỉ bằng FTS. Hãy sửa
cấu hình nhà cung cấp/xác thực, chuyển sang một nhà cung cấp có thể truy cập hoặc đặt
`provider: "none"` nếu bạn chủ ý muốn truy hồi chỉ bằng FTS.

### ID nhà cung cấp tùy chỉnh

`memorySearch.provider` có thể trỏ đến một mục `models.providers.<id>` tùy chỉnh dành cho các bộ điều hợp nhà cung cấp dành riêng cho bộ nhớ như `ollama`, hoặc cho các API mô hình tương thích với OpenAI như `openai-responses` / `openai-completions`. OpenClaw phân giải chủ sở hữu `api` của nhà cung cấp đó cho bộ điều hợp embedding, đồng thời giữ nguyên ID nhà cung cấp tùy chỉnh để xử lý endpoint, xác thực và tiền tố mô hình. Điều này cho phép các thiết lập nhiều GPU hoặc nhiều máy chủ dành riêng embedding bộ nhớ cho một endpoint cục bộ cụ thể:

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

Embedding từ xa yêu cầu khóa API. Thay vào đó, Bedrock sử dụng chuỗi thông tin xác thực mặc định của AWS SDK (vai trò phiên bản, SSO, khóa truy cập hoặc khóa API Bedrock).

| Nhà cung cấp       | Biến môi trường                                             | Khóa cấu hình                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | Chuỗi thông tin xác thực AWS hoặc `AWS_BEARER_TOKEN_BEDROCK` | Không cần khóa API                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Hồ sơ xác thực qua đăng nhập thiết bị       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (phần giữ chỗ)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth chỉ áp dụng cho trò chuyện/hoàn thành và không đáp ứng các yêu cầu embedding.
</Note>

---

## Cấu hình endpoint từ xa

Sử dụng `provider: "openai-compatible"` cho một máy chủ `/v1/embeddings` chung tương thích với OpenAI
không được kế thừa thông tin xác thực trò chuyện OpenAI toàn cục.

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
    | Khóa                    | Kiểu     | Mặc định                | Mô tả                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Cũng hỗ trợ `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Đối với Embedding 2: 768, 1536 hoặc 3072        |

    <Warning>
    Việc thay đổi mô hình hoặc `outputDimensionality` sẽ thay đổi danh tính chỉ mục. OpenClaw
    tạm dừng tìm kiếm vector cho đến khi bạn xây dựng lại chỉ mục bộ nhớ một cách rõ ràng.
    </Warning>

  </Accordion>
  <Accordion title="Kiểu đầu vào tương thích với OpenAI">
    Các endpoint embedding tương thích với OpenAI có thể chủ động sử dụng các trường yêu cầu `input_type` dành riêng cho nhà cung cấp. Điều này hữu ích cho các mô hình embedding bất đối xứng yêu cầu nhãn khác nhau cho embedding truy vấn và tài liệu.

    | Khóa                 | Kiểu     | Mặc định | Mô tả                                             |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | chưa đặt   | `input_type` dùng chung cho embedding truy vấn và tài liệu   |
    | `queryInputType`    | `string` | chưa đặt   | `input_type` tại thời điểm truy vấn; ghi đè `inputType`          |
    | `documentInputType` | `string` | chưa đặt   | `input_type` của chỉ mục/tài liệu; ghi đè `inputType`      |

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

    Việc thay đổi các giá trị này ảnh hưởng đến định danh bộ nhớ đệm embedding cho quá trình lập chỉ mục hàng loạt của nhà cung cấp và sau đó cần lập lại chỉ mục bộ nhớ nếu mô hình thượng nguồn xử lý các nhãn theo cách khác nhau.

  </Accordion>
  <Accordion title="Bedrock">
    ### Cấu hình embedding Bedrock

    Bedrock sử dụng chuỗi thông tin xác thực mặc định của AWS SDK cùng với token mang được OpenClaw kiểm tra, vì vậy không có khóa API nào được lưu trong cấu hình. Nếu OpenClaw chạy trên EC2 với vai trò phiên bản đã bật Bedrock, chỉ cần đặt nhà cung cấp và mô hình:

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

    | Khóa                    | Kiểu     | Mặc định                        | Mô tả                     |
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | ID mô hình embedding Bedrock bất kỳ  |
    | `outputDimensionality` | `number` | mặc định của mô hình                  | Với Titan V2: 256, 512 hoặc 1024 |

    **Các mô hình được hỗ trợ** (có tính năng phát hiện họ mô hình và kích thước mặc định):

    | ID mô hình                                   | Nhà cung cấp   | Kích thước mặc định | Kích thước có thể cấu hình          |
    | ------------------------------------------- | ---------- | ------------- | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                          |

    Các biến thể có hậu tố thông lượng (ví dụ: `amazon.titan-embed-text-v1:2:8k`) và ID hồ sơ suy luận có tiền tố vùng (ví dụ: `us.amazon.titan-embed-text-v2:0`) kế thừa cấu hình của mô hình cơ sở.

    **Vùng:** được phân giải theo thứ tự sau: giá trị ghi đè `memorySearch.remote.baseUrl`, cấu hình `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION`, rồi đến giá trị mặc định là `us-east-1`.

    **Xác thực:** Trước tiên, OpenClaw kiểm tra `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` hoặc `AWS_BEARER_TOKEN_BEDROCK`, sau đó chuyển sang chuỗi nhà cung cấp thông tin xác thực mặc định tiêu chuẩn của AWS SDK:

    1. Biến môi trường (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), trừ khi `AWS_PROFILE` cũng được đặt
    2. SSO (chỉ khi các trường SSO được cấu hình)
    3. Tệp thông tin xác thực và cấu hình dùng chung (`fromIni`, bao gồm `AWS_PROFILE`)
    4. Quy trình thông tin xác thực (`credential_process` trong tệp cấu hình AWS)
    5. Thông tin xác thực bằng token danh tính web
    6. Thông tin xác thực siêu dữ liệu phiên bản ECS hoặc EC2

    **Quyền IAM:** vai trò hoặc người dùng IAM cần:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Để áp dụng đặc quyền tối thiểu, hãy giới hạn phạm vi `InvokeModel` ở mô hình cụ thể:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Cục bộ (GGUF + llama.cpp)">
    | Khóa                   | Kiểu               | Mặc định                | Mô tả                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | tự động tải xuống        | Đường dẫn đến tệp mô hình GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | mặc định của node-llama-cpp | Thư mục bộ nhớ đệm cho các mô hình đã tải xuống                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Kích thước cửa sổ ngữ cảnh cho ngữ cảnh embedding. 4096 đáp ứng các phân đoạn thông thường (128-512 token) đồng thời giới hạn VRAM không dành cho trọng số. Giảm xuống 1024-2048 trên các máy chủ hạn chế tài nguyên. `"auto"` sử dụng mức tối đa đã huấn luyện của mô hình -- không khuyến nghị cho các mô hình 8B+ (Qwen3-Embedding-8B: tối đa 40 960 token có thể đẩy mức sử dụng VRAM lên ~32 GB). |

    Trước tiên, hãy cài đặt nhà cung cấp llama.cpp chính thức: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Mô hình mặc định: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, tự động tải xuống). Các bản checkout mã nguồn vẫn yêu cầu phê duyệt bản dựng gốc: `pnpm approve-builds` rồi `pnpm rebuild node-llama-cpp`.

    Sử dụng CLI độc lập để xác minh cùng đường dẫn nhà cung cấp mà Gateway sử dụng:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Các giá trị `local.contextSize` dạng số cũng cung cấp thông tin cho cơ chế tự động bố trí lớp GPU của node-llama-cpp để trọng số mô hình và ngữ cảnh embedding được yêu cầu được bố trí phù hợp cùng nhau. `openclaw memory status --deep` báo cáo backend llama.cpp, thiết bị, mức giảm tải, ngữ cảnh được yêu cầu và thông tin bộ nhớ có dấu thời gian đã biết gần nhất sau khi runtime đã tải; trạng thái thụ động không tải mô hình.

    Đặt `provider: "local"` một cách rõ ràng cho embedding GGUF cục bộ. `hf:` và các tham chiếu mô hình HTTP(S) được hỗ trợ cho cấu hình cục bộ rõ ràng (thông qua cơ chế phân giải mô hình của node-llama-cpp), nhưng chúng không thay đổi nhà cung cấp mặc định.

  </Accordion>
</AccordionGroup>

### Thời gian chờ embedding nội tuyến

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Ghi đè thời gian chờ cho các lô embedding nội tuyến trong quá trình lập chỉ mục bộ nhớ.

Khi chưa đặt, hệ thống sử dụng giá trị mặc định của nhà cung cấp: 600 giây đối với các nhà cung cấp cục bộ/tự lưu trữ như `local`, `ollama` và `lmstudio`, và 120 giây đối với các nhà cung cấp được lưu trữ. Tăng giá trị này khi các lô embedding cục bộ phụ thuộc CPU hoạt động bình thường nhưng chậm.
</ParamField>

---

## Hành vi lập chỉ mục

Tất cả nằm trong `memorySearch.sync`, trừ khi có ghi chú khác:

| Khóa                            | Kiểu      | Mặc định | Mô tả                                                           |
| ------------------------------ | --------- | ------- | --------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | Đồng bộ chỉ mục bộ nhớ khi phiên bắt đầu                           |
| `onSearch`                     | `boolean` | `true`  | Đồng bộ trì hoãn khi tìm kiếm sau khi phát hiện thay đổi nội dung                 |
| `watch`                        | `boolean` | `true`  | Theo dõi các tệp bộ nhớ (chokidar) và lên lịch lập lại chỉ mục khi có thay đổi         |
| `sessions.postCompactionForce` | `boolean` | `true`  | Buộc lập lại chỉ mục phiên sau khi bản chép lời được cập nhật do Compaction kích hoạt |

---

## Cấu hình tìm kiếm kết hợp

Tất cả nằm trong `memorySearch.query`:

| Khóa          | Kiểu     | Mặc định | Mô tả                               |
| ------------ | -------- | ------- | ----------------------------------------- |
| `maxResults` | `number` | `6`     | Số kết quả khớp bộ nhớ tối đa được trả về trước khi chèn |
| `minScore`   | `number` | `0.35`  | Điểm liên quan tối thiểu để đưa một kết quả khớp vào  |

Và trong `memorySearch.query.hybrid`:

| Khóa       | Kiểu      | Mặc định | Mô tả                        |
| --------- | --------- | ------- | ---------------------------------- |
| `enabled` | `boolean` | `true`  | Bật tìm kiếm kết hợp BM25 + vectơ |

<Tabs>
  <Tab title="MMR (đa dạng)">
    | Khóa           | Kiểu      | Mặc định | Mô tả           |
    | ------------- | --------- | ------- | --------------------- |
    | `mmr.enabled` | `boolean` | `false` | Bật xếp hạng lại bằng MMR |
  </Tab>
  <Tab title="Suy giảm theo thời gian (độ mới)">
    | Khóa                     | Kiểu      | Mặc định | Mô tả          |
    | ----------------------- | --------- | ------- | -------------------- |
    | `temporalDecay.enabled` | `boolean` | `false` | Bật tăng hạng theo độ mới |

    Các tệp thường xanh (`MEMORY.md`, các tệp không ghi ngày tháng trong `memory/`) không bao giờ bị suy giảm.

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
            mmr: { enabled: true },
            temporalDecay: { enabled: true },
          },
        },
      },
    },
  },
}
```

---

## Đường dẫn bộ nhớ bổ sung

| Khóa          | Kiểu       | Mô tả                              |
| ------------ | ---------- | ---------------------------------------- |
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

Đường dẫn có thể là tuyệt đối hoặc tương đối với không gian làm việc. Các thư mục được quét đệ quy để tìm tệp `.md`. Cách xử lý liên kết tượng trưng phụ thuộc vào backend đang hoạt động: công cụ tích hợp bỏ qua liên kết tượng trưng, còn QMD tuân theo hành vi của trình quét QMD nền tảng.

Đối với tìm kiếm bản ghi hội thoại giữa các agent trong phạm vi agent, hãy dùng `agents.list[].memorySearch.qmd.extraCollections` thay cho `memory.qmd.paths`. Các bộ sưu tập bổ sung đó tuân theo cùng cấu trúc `{ path, name, pattern? }`, nhưng được hợp nhất theo từng agent và có thể giữ nguyên tên dùng chung được chỉ định rõ khi đường dẫn trỏ ra ngoài workspace hiện tại. Nếu cùng một đường dẫn đã phân giải xuất hiện trong cả `memory.qmd.paths` và `memorySearch.qmd.extraCollections`, QMD giữ mục đầu tiên và bỏ qua mục trùng lặp.

---

## Bộ nhớ đa phương thức (Gemini)

Lập chỉ mục hình ảnh và âm thanh cùng với Markdown bằng Gemini Embedding 2:

| Khóa                       | Kiểu       | Mặc định    | Mô tả                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Bật lập chỉ mục đa phương thức             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, hoặc `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | Kích thước tệp tối đa để lập chỉ mục (10 MiB)    |

<Note>
Chỉ áp dụng cho các tệp trong `extraPaths`. Các thư mục gốc bộ nhớ mặc định vẫn chỉ hỗ trợ Markdown. Yêu cầu `gemini-embedding-2-preview`. `fallback` phải là `"none"`.
</Note>

Các định dạng được hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (hình ảnh); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (âm thanh).

---

## Bộ nhớ đệm embedding

| Khóa             | Kiểu      | Mặc định | Mô tả                      |
| --------------- | --------- | ------- | -------------------------------- |
| `cache.enabled` | `boolean` | `true`  | Lưu embedding của các đoạn vào bộ nhớ đệm trong SQLite |

Ngăn việc tạo lại embedding cho văn bản không thay đổi khi lập lại chỉ mục hoặc cập nhật bản ghi hội thoại.

---

## Lập chỉ mục theo lô

| Khóa                           | Kiểu      | Mặc định | Mô tả                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Các embedding nội tuyến song song |
| `remote.batch.enabled`        | `boolean` | `false` | Bật API embedding theo lô |
| `remote.batch.concurrency`    | `number`  | `2`     | Các tác vụ theo lô song song        |
| `remote.batch.wait`           | `boolean` | `true`  | Chờ lô hoàn tất  |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | Khoảng thời gian thăm dò              |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | Thời gian chờ của lô              |

Khả dụng cho `gemini`, `openai` và `voyage`. Tác vụ theo lô của OpenAI thường nhanh nhất và tiết kiệm chi phí nhất khi điền bù dữ liệu quy mô lớn.

`remote.nonBatchConcurrency` kiểm soát các lệnh gọi embedding nội tuyến được dùng bởi nhà cung cấp cục bộ/tự lưu trữ và nhà cung cấp được lưu trữ khi API theo lô của nhà cung cấp không hoạt động. Ollama mặc định dùng `1` cho việc lập chỉ mục không theo lô để tránh gây quá tải cho các máy chủ cục bộ nhỏ hơn; hãy đặt giá trị cao hơn trên các máy lớn hơn.

Thiết lập này tách biệt với `sync.embeddingBatchTimeoutSeconds`, thiết lập kiểm soát thời gian chờ cho các lệnh gọi embedding nội tuyến.

---

## Tìm kiếm bộ nhớ phiên (thử nghiệm)

Lập chỉ mục bản ghi hội thoại phiên và hiển thị chúng qua `memory_search`:

| Khóa                           | Kiểu       | Mặc định      | Mô tả                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Bật lập chỉ mục phiên                 |
| `sources`                     | `string[]` | `["memory"]` | Thêm `"sessions"` để bao gồm bản ghi hội thoại |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ngưỡng byte để lập lại chỉ mục              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ngưỡng tin nhắn để lập lại chỉ mục           |

<Warning>
Lập chỉ mục phiên là tính năng phải chủ động bật và chạy bất đồng bộ. Kết quả có thể hơi lỗi thời. Nhật ký phiên nằm trên đĩa, vì vậy hãy coi quyền truy cập hệ thống tệp là ranh giới tin cậy.
</Warning>

Tìm kiếm bản ghi hội thoại phiên thông thường do mô hình gọi tuân theo
[`tools.sessions.visibility`](/vi/gateway/config-tools#toolssessions). Phạm vi hiển thị
`tree` mặc định cho phép truy cập phiên hiện tại, các phiên do phiên đó tạo ra và
các phiên nhóm của cùng agent được theo dõi thông qua nhận biết nhóm ngầm định. Các
phiên không liên quan khác yêu cầu phạm vi hiển thị `agent` (hoặc `all` chỉ khi cũng
cần truy hồi giữa các agent và chính sách agent-với-agent cho phép).

`rememberAcrossConversations` không mở rộng thiết lập đó. Nó cung cấp một
quyền riêng biệt chỉ dành cho thời gian chạy, giới hạn ở các bản ghi hội thoại riêng tư của cùng agent
trong lượt Active Memory có giới hạn.

Các ví dụ bên dưới đặt những thiết lập này trong `agents.defaults`. Bạn cũng có thể
áp dụng các thiết lập `memorySearch` tương đương trong phần ghi đè theo từng agent khi chỉ một
agent cần lập chỉ mục và tìm kiếm bản ghi hội thoại phiên.

Để truy hồi từ gateway đến DM trong cùng agent:

<Tabs>
  <Tab title="Backend tích hợp sẵn">
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
  <Tab title="Backend QMD">
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

Khi dùng QMD, bản thân `agents.defaults.memorySearch.experimental.sessionMemory` và
`sources: ["sessions"]` không xuất bản ghi hội thoại vào QMD. Hãy đặt cả
`memory.qmd.sessions.enabled: true`. Thiết lập cấp cao hơn
`rememberAcrossConversations: true` là ngoại lệ: nó ngầm bật việc
xuất phiên QMD bắt buộc cho agent đó. Các bản xuất ngầm định vẫn ở chế độ riêng tư:
chúng luôn dùng vị trí xuất nội bộ mặc định (cấu hình
`sessions.exportDir` chỉ áp dụng cho các bản xuất tường minh), chỉ được tìm kiếm
trong quá trình truy hồi giữa các cuộc hội thoại của agent đó, và `memory_get`
thông thường không thể đọc chúng. Việc đặt tường minh
`memory.qmd.sessions.enabled: true` giữ nguyên hành vi hiện có và biến
các bản ghi hội thoại đã xuất thành một phần của kho ngữ liệu bộ nhớ thông thường.

---

## Tăng tốc vectơ SQLite (sqlite-vec)

| Khóa                          | Kiểu      | Mặc định | Mô tả                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Dùng sqlite-vec cho truy vấn vectơ |
| `store.vector.extensionPath` | `string`  | đi kèm | Ghi đè đường dẫn sqlite-vec          |

Khi sqlite-vec không khả dụng, OpenClaw tự động chuyển sang độ tương đồng cosine trong tiến trình.

---

## Lưu trữ chỉ mục

Các chỉ mục bộ nhớ tích hợp sẵn nằm trong cơ sở dữ liệu SQLite của OpenClaw dành cho từng agent tại
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Khóa                   | Kiểu     | Mặc định     | Mô tả                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | Bộ tách từ FTS5 (`unicode61` hoặc `trigram`) |

---

## Cấu hình backend QMD

Đặt `memory.backend = "qmd"` để bật. Tất cả thiết lập QMD nằm trong `memory.qmd`:

| Khóa                      | Kiểu      | Mặc định  | Mô tả                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Đường dẫn tệp thực thi QMD; đặt đường dẫn tuyệt đối khi `PATH` của dịch vụ khác với shell của bạn |
| `searchMode`             | `string`  | `search` | Lệnh tìm kiếm: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --       | Đặt thành `false` với `searchMode: "query"` và QMD 2.1+ để bỏ qua việc xếp hạng lại của QMD          |
| `includeDefaultMemory`   | `boolean` | `true`   | Tự động lập chỉ mục `MEMORY.md` + `memory/**/*.md`                                             |
| `paths[]`                | `array`   | --       | Đường dẫn bổ sung: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | Xuất bản ghi hội thoại phiên vào QMD                                                   |
| `sessions.retentionDays` | `number`  | --       | Thời gian lưu giữ bản ghi hội thoại                                                                  |
| `sessions.exportDir`     | `string`  | --       | Thư mục xuất                                                                      |

`searchMode: "search"` chỉ dùng tìm kiếm từ vựng/BM25. OpenClaw không chạy các bước thăm dò mức sẵn sàng của vectơ ngữ nghĩa hoặc bảo trì embedding QMD cho chế độ đó, kể cả trong `memory status --deep`; `vsearch` và `query` vẫn yêu cầu QMD sẵn sàng xử lý vectơ và có embedding.

`rerank: false` chỉ thay đổi chế độ `query` của QMD và yêu cầu QMD 2.1 trở lên. Trong chế độ CLI trực tiếp, OpenClaw truyền `--no-rerank`; trong chế độ MCP dựa trên mcporter, OpenClaw truyền `rerank: false` cho công cụ truy vấn hợp nhất của QMD. Để trống thiết lập này để sử dụng hành vi xếp hạng lại truy vấn mặc định của QMD.

OpenClaw ưu tiên các cấu trúc truy vấn MCP và bộ sưu tập QMD hiện tại, nhưng vẫn duy trì khả năng hoạt động của các bản phát hành QMD cũ bằng cách thử các cờ mẫu bộ sưu tập tương thích và tên công cụ MCP cũ hơn khi cần. Khi QMD công bố hỗ trợ nhiều bộ lọc bộ sưu tập, các bộ sưu tập cùng nguồn được tìm kiếm bằng một tiến trình QMD; các bản dựng QMD cũ hơn tiếp tục dùng đường dẫn tương thích theo từng bộ sưu tập. Cùng nguồn nghĩa là các bộ sưu tập bộ nhớ bền vững (các tệp bộ nhớ mặc định cùng với đường dẫn tùy chỉnh) được nhóm lại, trong khi các bộ sưu tập bản ghi hội thoại phiên vẫn là một nhóm riêng để quá trình đa dạng hóa nguồn vẫn có cả hai đầu vào.

<Note>
Các thiết lập ghi đè mô hình QMD nằm ở phía QMD, không nằm trong cấu hình OpenClaw. Nếu cần ghi đè mô hình của QMD trên toàn hệ thống, hãy đặt các biến môi trường như `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` và `QMD_GENERATE_MODEL` trong môi trường thời gian chạy của gateway.
</Note>

### Tích hợp mcporter

Tất cả nằm trong `memory.qmd.mcporter`. Định tuyến các tìm kiếm QMD qua daemon MCP `mcporter` hoạt động lâu dài thay vì khởi chạy `qmd` cho mỗi truy vấn, giúp giảm chi phí khởi động nguội đối với các mô hình lớn hơn.

| Khóa           | Kiểu      | Mặc định | Mô tả                                                            |
| ------------- | --------- | ------- | ---------------------------------------------------------------------- |
| `enabled`     | `boolean` | `false` | Định tuyến các lệnh gọi QMD qua mcporter thay vì khởi chạy `qmd` cho mỗi yêu cầu |
| `serverName`  | `string`  | `qmd`   | Tên máy chủ mcporter chạy `qmd mcp` với `lifecycle: keep-alive`  |
| `startDaemon` | `boolean` | `true`  | Tự động khởi động daemon mcporter khi `enabled` là true         |

Yêu cầu đã cài đặt `mcporter` và có trong PATH, cùng với một máy chủ mcporter được cấu hình để chạy `qmd mcp`. Giữ trạng thái tắt cho các thiết lập cục bộ đơn giản hơn, nơi chi phí khởi chạy tiến trình cho mỗi truy vấn là chấp nhận được.

<AccordionGroup>
  <Accordion title="Lịch cập nhật">
    | Khóa                       | Kiểu      | Mặc định | Mô tả                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Khoảng thời gian làm mới                      |
    | `update.debounceMs`       | `number`  | `15000` | Chống dội các thay đổi tệp                 |
    | `update.onBoot`           | `boolean` | `true`  | Làm mới khi trình quản lý QMD dài hạn mở; đặt thành false để bỏ qua lần cập nhật ngay khi khởi động |
    | `update.startup`          | `string`  | `off`   | Khởi tạo QMD tùy chọn khi Gateway khởi động: `off`, `idle` hoặc `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Độ trễ trước khi lần làm mới `startup: "idle"` chạy |
    | `update.waitForBootSync`  | `boolean` | `false` | Chặn việc mở trình quản lý cho đến khi lần làm mới ban đầu hoàn tất |
    | `update.embedInterval`    | `string`  | `60m`   | Nhịp tạo embedding riêng                |
    | `update.commandTimeoutMs` | `number`  | `30000` | Thời gian chờ cho các lệnh bảo trì QMD (liệt kê/thêm bộ sưu tập) |
    | `update.updateTimeoutMs`  | `number`  | `120000` | Thời gian chờ cho mỗi chu kỳ `qmd update`   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | Thời gian chờ cho mỗi chu kỳ `qmd embed`    |
  </Accordion>
  <Accordion title="Giới hạn">
    | Khóa                       | Kiểu     | Mặc định | Mô tả                |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | Số kết quả tìm kiếm tối đa         |
    | `limits.maxSnippetChars`  | `number` | `450`   | Giới hạn độ dài đoạn trích       |
    | `limits.maxInjectedChars` | `number` | `2200`  | Giới hạn tổng số ký tự được chèn |
    | `limits.timeoutMs`        | `number` | `4000`  | Thời gian chờ lệnh QMD trong quá trình tìm kiếm dựa trên QMD, bao gồm `memory_search`; công việc thiết lập, đồng bộ, dự phòng tích hợp sẵn và bổ sung vẫn giữ thời hạn mặc định của công cụ |
  </Accordion>
  <Accordion title="Phạm vi">
    Kiểm soát những phiên nào có thể nhận kết quả tìm kiếm QMD. Có cùng schema với [`session.sendPolicy`](/vi/gateway/config-agents#session):

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

    Mặc định được phát hành chỉ dành cho DM/trực tiếp, từ chối các nhóm và loại kênh khác. `match.keyPrefix` khớp với khóa phiên đã chuẩn hóa; `match.rawKeyPrefix` khớp với khóa thô bao gồm `agent:<id>:`.

  </Accordion>
  <Accordion title="Trích dẫn">
    `memory.citations` áp dụng cho mọi backend:

    | Giá trị            | Hành vi                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (mặc định) | Bao gồm phần chân trang `Source: <path#line>` trong các đoạn trích    |
    | `on`             | Luôn bao gồm phần chân trang                               |
    | `off`            | Bỏ phần chân trang (đường dẫn vẫn được truyền nội bộ cho tác tử) |

  </Accordion>
</AccordionGroup>

Khi bật khởi tạo QMD lúc Gateway khởi động, OpenClaw chỉ khởi động QMD cho các tác tử đủ điều kiện. Nếu `update.onBoot` là true và không cấu hình bảo trì theo khoảng thời gian/tạo embedding, quá trình khởi động sẽ dùng trình quản lý dùng một lần để làm mới khi khởi động rồi đóng lại. Nếu cấu hình khoảng thời gian cập nhật hoặc tạo embedding, quá trình khởi động sẽ mở trình quản lý QMD dài hạn để trình này quản lý bộ theo dõi và các bộ hẹn giờ theo khoảng thời gian; `update.onBoot: false` chỉ bỏ qua lần làm mới ngay khi khởi động.

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

Dreaming chạy dưới dạng một lượt quét theo lịch duy nhất và sử dụng các giai đoạn nhẹ/sâu/REM nội bộ như một chi tiết triển khai.

Để tìm hiểu hành vi khái niệm và các lệnh gạch chéo, hãy xem [Dreaming](/vi/concepts/dreaming).

### Cài đặt người dùng

| Khóa                                    | Kiểu      | Mặc định       | Mô tả                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Bật hoặc tắt hoàn toàn Dreaming                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Nhịp Cron tùy chọn cho lượt quét Dreaming đầy đủ                                                                                |
| `model`                                | `string`  | mô hình mặc định | Ghi đè mô hình tác tử phụ Dream Diary tùy chọn                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Số token ước tính tối đa được giữ lại từ mỗi đoạn trích hồi tưởng ngắn hạn được đưa vào `MEMORY.md`; siêu dữ liệu nguồn gốc vẫn hiển thị |

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
- Dreaming ghi đầu ra tường thuật mà con người có thể đọc vào `DREAMS.md` (hoặc `dreams.md` hiện có).
- `dreaming.model` sử dụng cổng tin cậy tác tử phụ hiện có của Plugin; hãy đặt `plugins.entries.memory-core.subagent.allowModelOverride: true` trước khi bật.
- Dream Diary thử lại một lần bằng mô hình mặc định của phiên khi mô hình đã cấu hình không khả dụng. Các lỗi về độ tin cậy hoặc danh sách cho phép được ghi nhật ký và không được âm thầm thử lại.
- Chính sách và ngưỡng của các giai đoạn nhẹ/sâu/REM là hành vi nội bộ, không phải cấu hình dành cho người dùng.

</Note>

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
