---
read_when:
    - Bạn muốn cấu hình các nhà cung cấp tìm kiếm bộ nhớ hoặc các mô hình embedding
    - Bạn muốn thiết lập backend QMD
    - Bạn muốn tinh chỉnh tìm kiếm kết hợp, MMR hoặc cơ chế suy giảm theo thời gian
    - Bạn muốn bật tính năng lập chỉ mục bộ nhớ đa phương thức
sidebarTitle: Memory config
summary: Tất cả tùy chọn cấu hình cho tìm kiếm bộ nhớ, nhà cung cấp embedding, QMD, tìm kiếm kết hợp và lập chỉ mục đa phương thức
title: Tham chiếu cấu hình bộ nhớ
x-i18n:
    generated_at: "2026-07-19T06:00:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3c4419674b5e42381b51791d12fc6a3cc81512e23384c00d8e984a4e8ec49097
    source_path: reference/memory-config.md
    workflow: 16
---

Trang này liệt kê mọi tùy chọn cấu hình cho tính năng tìm kiếm bộ nhớ của OpenClaw. Để xem tổng quan về khái niệm, hãy tham khảo:

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
    Tác tử con bộ nhớ dành cho các phiên tương tác.
  </Card>
</CardGroup>

Mọi cài đặt tìm kiếm bộ nhớ đều nằm trong `agents.defaults.memorySearch` trong `openclaw.json` (hoặc phần ghi đè `agents.list[].memorySearch` theo từng tác tử), trừ khi có ghi chú khác.

<Note>
Đối với quy trình làm việc được đề xuất cho tác tử cá nhân, hãy dùng
`memorySearch.rememberAcrossConversations`. Các tùy chọn nâng cao về định hướng, mô hình, prompt và độ trễ của Active Memory nằm trong `plugins.entries.active-memory`.

Hãy xem [Active Memory](/vi/concepts/active-memory) để biết cả hai phương thức kích hoạt,
cách duy trì bản ghi hội thoại và hướng dẫn triển khai an toàn.
</Note>

---

## Ghi nhớ giữa các cuộc hội thoại

| Khóa                           | Kiểu      | Mặc định                                                    | Mô tả                                                                    |
| ----------------------------- | --------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `rememberAcrossConversations` | `boolean` | Bật cho bản cài đặt cá nhân; tắt khi đã cấu hình cô lập DM | Sử dụng ngữ cảnh liên quan từ các cuộc hội thoại riêng tư đã được nhận diện khác của tác tử này. |

Hãy cấu hình theo từng tác tử khi chỉ tác tử cá nhân đáng tin cậy được phép sử dụng
khả năng truy hồi bản ghi hội thoại xuyên cuộc hội thoại:

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

Giá trị tuân theo cơ chế kế thừa `agents.defaults.memorySearch` thông thường với phần
ghi đè theo từng tác tử. Khi chưa đặt, theo mặc định nó chỉ bật nếu
`session.dmScope` toàn cục chưa được đặt hoặc là `"main"` và không có liên kết nào có phần
ghi đè `session.dmScope`. Mọi cấu hình cô lập DM đều mặc định tắt tính năng này. Giá trị `true` hoặc
`false` được đặt rõ ràng luôn được ưu tiên. Việc bật tính năng này đồng nghĩa với lập chỉ mục bản ghi phiên và
thêm `sessions` vào các nguồn bộ nhớ đã phân giải của tác tử. Với QMD, nó cũng
bật tính năng xuất phiên của tác tử đó; chế độ này không yêu cầu cài đặt
`memory.qmd.sessions.enabled` riêng.

Nhà cung cấp bộ nhớ tích hợp sẵn của OpenClaw hỗ trợ đường dẫn được bảo vệ này với cả
backend tích hợp sẵn lẫn QMD. Các nhà cung cấp bộ nhớ thay thế vẫn có thể sử dụng
hook truy hồi riêng và các công cụ Active Memory nâng cao, nhưng cài đặt này sẽ bị bỏ qua
trừ khi nhà cung cấp hiện tại hỗ trợ truy hồi bản ghi hội thoại riêng tư được bảo vệ.
`openclaw doctor` báo cáo nhà cung cấp không được hỗ trợ hoặc danh sách Active Memory
`toolsAllow` được đặt rõ ràng nhưng bỏ qua `memory_search`.

Ranh giới truy xuất hẹp hơn phạm vi tìm kiếm phiên nói chung:

- chỉ các cuộc hội thoại riêng tư đã được nhận diện của cùng tác tử mới đủ điều kiện
- cuộc hội thoại đang được trả lời bị loại trừ
- các nhóm và kênh bị loại trừ khỏi cả nguồn lẫn đích
- các loại cuộc hội thoại không xác định sẽ bị từ chối theo nguyên tắc đóng an toàn
- khả năng truy hồi trong sandbox không thể sử dụng quyền đặc biệt xuyên cuộc hội thoại

Cài đặt này không thay đổi `tools.sessions.visibility`, khóa phiên,
bộ nhớ bản ghi hội thoại, định tuyến phân phối hoặc quyền của `sessions_list`,
`sessions_history` và `sessions_send`. Active Memory thực hiện một lượt
truy xuất chỉ đọc có giới hạn; việc truy xuất không khả dụng hoặc hết thời gian chờ không chặn
phản hồi.

---

## Lựa chọn nhà cung cấp

| Khóa        | Kiểu      | Mặc định          | Mô tả                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | Bật hoặc tắt tìm kiếm bộ nhớ                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | ID bộ điều hợp embedding như `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` hoặc `voyage`; cũng có thể là `models.providers.<id>` đã cấu hình với `api` trỏ đến bộ điều hợp embedding bộ nhớ hoặc API mô hình tương thích với OpenAI |
| `model`    | `string`  | mặc định của nhà cung cấp | Tên mô hình embedding                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | ID bộ điều hợp dự phòng khi bộ điều hợp chính gặp lỗi                                                                                                                                                                                                                                                  |

Khi chưa đặt `provider`, OpenClaw sử dụng embedding của OpenAI. Hãy đặt rõ ràng `provider`
để sử dụng Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, mô hình GGUF cục bộ hoặc endpoint `/v1/embeddings` tương thích với OpenAI.
Các cấu hình cũ vẫn dùng `provider: "auto"` sẽ được phân giải thành `openai`.

<Warning>
Việc thay đổi nhà cung cấp embedding, mô hình, cài đặt nhà cung cấp, nguồn, phạm vi,
cách chia đoạn hoặc tokenizer có thể khiến chỉ mục vectơ SQLite hiện có không tương thích.
OpenClaw tạm dừng tìm kiếm vectơ và báo cảnh báo về danh tính chỉ mục thay vì
tự động tạo lại embedding cho toàn bộ dữ liệu. Khi sẵn sàng, hãy xây dựng lại bằng
`openclaw memory status --index --agent <id>` hoặc
`openclaw memory index --force --agent <id>`.
</Warning>

Khi chưa đặt `provider`, có `provider: "auto"` cũ hoặc
`provider: "none"` chủ ý chọn chế độ chỉ FTS, khả năng truy hồi bộ nhớ vẫn có thể
sử dụng xếp hạng FTS từ vựng khi embedding không khả dụng.

Các nhà cung cấp không cục bộ được chỉ định rõ ràng sẽ từ chối theo nguyên tắc đóng an toàn. Nếu bạn đặt `memorySearch.provider` thành
một nhà cung cấp cụ thể dựa trên dịch vụ từ xa như Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage hoặc một nhà cung cấp tùy chỉnh
tương thích với OpenAI và nhà cung cấp đó không khả dụng khi chạy, `memory_search`
sẽ trả về kết quả không khả dụng thay vì ngầm sử dụng khả năng truy hồi chỉ FTS. Hãy sửa
cấu hình nhà cung cấp/xác thực, chuyển sang nhà cung cấp có thể truy cập hoặc đặt
`provider: "none"` nếu bạn chủ ý muốn truy hồi chỉ FTS.

### ID nhà cung cấp tùy chỉnh

`memorySearch.provider` có thể trỏ đến một mục `models.providers.<id>` tùy chỉnh dành cho các bộ điều hợp nhà cung cấp chuyên biệt cho bộ nhớ như `ollama`, hoặc dành cho các API mô hình tương thích với OpenAI như `openai-responses` / `openai-completions`. OpenClaw phân giải chủ sở hữu `api` của nhà cung cấp đó cho bộ điều hợp embedding, đồng thời giữ nguyên ID nhà cung cấp tùy chỉnh để xử lý endpoint, xác thực và tiền tố mô hình. Điều này cho phép các thiết lập nhiều GPU hoặc nhiều máy chủ dành riêng embedding bộ nhớ cho một endpoint cục bộ cụ thể:

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
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Hồ sơ xác thực thông qua đăng nhập thiết bị       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (giá trị giữ chỗ)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
OAuth của Codex chỉ áp dụng cho trò chuyện/hoàn thành và không đáp ứng các yêu cầu embedding.
</Note>

---

## Cấu hình endpoint từ xa

Sử dụng `provider: "openai-compatible"` cho máy chủ `/v1/embeddings`
tương thích với OpenAI nói chung mà không được kế thừa thông tin xác thực trò chuyện OpenAI toàn cục.

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
    tạm dừng tìm kiếm vectơ cho đến khi bạn xây dựng lại chỉ mục bộ nhớ một cách rõ ràng.
    </Warning>

  </Accordion>
  <Accordion title="Các kiểu đầu vào tương thích với OpenAI">
    Các endpoint embedding tương thích với OpenAI có thể chọn sử dụng các trường yêu cầu `input_type` dành riêng cho nhà cung cấp. Điều này hữu ích cho các mô hình embedding bất đối xứng yêu cầu nhãn khác nhau cho embedding truy vấn và tài liệu.

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

    Việc thay đổi các giá trị này ảnh hưởng đến danh tính bộ nhớ đệm embedding cho quá trình lập chỉ mục hàng loạt của nhà cung cấp và sau đó cần lập chỉ mục lại bộ nhớ nếu mô hình thượng nguồn xử lý các nhãn theo cách khác nhau.

  </Accordion>
  <Accordion title="Bedrock">
    ### Cấu hình embedding Bedrock

    Bedrock sử dụng chuỗi thông tin xác thực mặc định của AWS SDK cùng với token mang được OpenClaw kiểm tra, vì vậy không có khóa API nào được lưu trong cấu hình. Nếu OpenClaw chạy trên EC2 với vai trò phiên bản hỗ trợ Bedrock, chỉ cần đặt nhà cung cấp và mô hình:

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
    | `outputDimensionality` | `number` | mặc định của mô hình                  | Đối với Titan V2: 256, 512 hoặc 1024 |

    **Các mô hình được hỗ trợ** (có phát hiện họ mô hình và kích thước mặc định):

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

    **Vùng:** được phân giải theo thứ tự sau: giá trị ghi đè `memorySearch.remote.baseUrl`, cấu hình `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION`, rồi đến giá trị mặc định `us-east-1`.

    **Xác thực:** OpenClaw trước tiên kiểm tra `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` hoặc `AWS_BEARER_TOKEN_BEDROCK`, sau đó chuyển sang chuỗi nhà cung cấp thông tin xác thực mặc định tiêu chuẩn của AWS SDK:

    1. Biến môi trường (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), trừ khi `AWS_PROFILE` cũng được đặt
    2. SSO (chỉ khi các trường SSO được cấu hình)
    3. Thông tin xác thực dùng chung và các tệp cấu hình (`fromIni`, bao gồm `AWS_PROFILE`)
    4. Quy trình thông tin xác thực (`credential_process` trong tệp cấu hình AWS)
    5. Thông tin xác thực token danh tính web
    6. Thông tin xác thực siêu dữ liệu phiên bản ECS hoặc EC2

    **Quyền IAM:** vai trò hoặc người dùng IAM cần:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Để áp dụng đặc quyền tối thiểu, giới hạn `InvokeModel` ở mô hình cụ thể:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Cục bộ (GGUF + llama.cpp)">
    | Khóa                   | Kiểu               | Mặc định                | Mô tả                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | tự động tải xuống        | Đường dẫn đến tệp mô hình GGUF                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | mặc định của node-llama-cpp | Thư mục bộ nhớ đệm cho các mô hình đã tải xuống                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Kích thước cửa sổ ngữ cảnh cho ngữ cảnh embedding. 4096 đáp ứng các đoạn điển hình (128-512 token) đồng thời giới hạn VRAM không dành cho trọng số. Giảm xuống 1024-2048 trên các máy chủ hạn chế tài nguyên. `"auto"` sử dụng mức tối đa mà mô hình được huấn luyện -- không khuyến nghị cho các mô hình 8B+ (Qwen3-Embedding-8B: tối đa 40 960 token có thể đẩy mức sử dụng VRAM lên ~32 GB). |

    Trước tiên, hãy cài đặt nhà cung cấp llama.cpp chính thức: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Mô hình mặc định: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, được tự động tải xuống). Các bản checkout mã nguồn vẫn yêu cầu phê duyệt bản dựng gốc: `pnpm approve-builds` rồi `pnpm rebuild node-llama-cpp`.

    Sử dụng CLI độc lập để xác minh cùng đường dẫn nhà cung cấp mà Gateway sử dụng:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Các giá trị số `local.contextSize` cũng cung cấp thông tin cho việc bố trí lớp GPU tự động của node-llama-cpp, để trọng số mô hình và ngữ cảnh embedding được yêu cầu có thể cùng vừa với tài nguyên. `openclaw memory status --deep` báo cáo backend llama.cpp, thiết bị, mức chuyển tải, ngữ cảnh được yêu cầu và các thông tin bộ nhớ có dấu thời gian được biết gần nhất sau khi runtime đã tải; trạng thái thụ động không tải mô hình.

    Đặt `provider: "local"` rõ ràng cho embedding GGUF cục bộ. `hf:` và các tham chiếu mô hình HTTP(S) được hỗ trợ cho cấu hình cục bộ rõ ràng (thông qua cơ chế phân giải mô hình của node-llama-cpp), nhưng chúng không thay đổi nhà cung cấp mặc định.

  </Accordion>
</AccordionGroup>

### Thời gian chờ embedding nội tuyến

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Ghi đè thời gian chờ cho các lô embedding nội tuyến trong quá trình lập chỉ mục bộ nhớ.

Khi chưa đặt, sử dụng giá trị mặc định của nhà cung cấp: 600 giây đối với các nhà cung cấp cục bộ/tự lưu trữ như `local`, `ollama` và `lmstudio`, và 120 giây đối với các nhà cung cấp được lưu trữ. Tăng giá trị này khi các lô embedding cục bộ bị giới hạn bởi CPU vẫn hoạt động bình thường nhưng chậm.
</ParamField>

---

## Hành vi lập chỉ mục

Tất cả nằm trong `memorySearch.sync`, trừ khi có ghi chú khác:

| Khóa                            | Kiểu      | Mặc định | Mô tả                                                           |
| ------------------------------ | --------- | ------- | --------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | Đồng bộ chỉ mục bộ nhớ khi một phiên bắt đầu                           |
| `onSearch`                     | `boolean` | `true`  | Đồng bộ trì hoãn khi tìm kiếm sau khi phát hiện thay đổi nội dung                 |
| `watch`                        | `boolean` | `true`  | Theo dõi các tệp bộ nhớ (chokidar) và lên lịch lập chỉ mục lại khi có thay đổi         |
| `watchDebounceMs`              | `number`  | `1500`  | Khoảng chống dội để hợp nhất các sự kiện theo dõi tệp diễn ra nhanh                |
| `intervalMinutes`              | `number`  | `0`     | Khoảng thời gian lập chỉ mục lại định kỳ tính bằng phút (`0` sẽ vô hiệu hóa)                   |
| `sessions.postCompactionForce` | `boolean` | `true`  | Buộc lập chỉ mục lại phiên sau các bản cập nhật bản chép lời do Compaction kích hoạt |

<ParamField path="chunking.tokens" type="number">
  Kích thước đoạn tính theo token được sử dụng khi chia các nguồn bộ nhớ trước khi embedding (mặc định: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Số token chồng lấn giữa các đoạn liền kề để giữ nguyên ngữ cảnh gần ranh giới phân chia (mặc định: 80).
</ParamField>

<Note>
Việc thay đổi `chunking.tokens` hoặc `chunking.overlap` sẽ thay đổi ranh giới đoạn và làm mất hiệu lực danh tính chỉ mục hiện có (xem Cảnh báo trong phần Lựa chọn nhà cung cấp).
</Note>

---

## Cấu hình tìm kiếm kết hợp

Tất cả nằm trong `memorySearch.query`:

| Khóa          | Kiểu     | Mặc định | Mô tả                               |
| ------------ | -------- | ------- | ----------------------------------------- |
| `maxResults` | `number` | `6`     | Số kết quả bộ nhớ tối đa được trả về trước khi chèn |
| `minScore`   | `number` | `0.35`  | Điểm liên quan tối thiểu để đưa một kết quả vào  |

Và trong `memorySearch.query.hybrid`:

| Khóa                   | Kiểu      | Mặc định | Mô tả                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | Bật tìm kiếm kết hợp BM25 + vectơ |
| `vectorWeight`        | `number`  | `0.7`   | Trọng số cho điểm vectơ (0-1)     |
| `textWeight`          | `number`  | `0.3`   | Trọng số cho điểm BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`     | Hệ số nhân kích thước nhóm ứng viên     |

<Tabs>
  <Tab title="MMR (tính đa dạng)">
    | Khóa           | Kiểu      | Mặc định | Mô tả                          |
    | ------------- | --------- | ------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Bật xếp hạng lại bằng MMR                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = đa dạng tối đa, 1 = mức độ liên quan tối đa |
  </Tab>
  <Tab title="Suy giảm theo thời gian (độ mới)">
    | Khóa                          | Kiểu      | Mặc định | Mô tả               |
    | ---------------------------- | --------- | ------- | -------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Bật tăng cường theo độ mới      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Điểm số giảm một nửa sau mỗi N ngày |

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

## Các đường dẫn bộ nhớ bổ sung

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

Để tìm kiếm bản chép lời giữa các tác nhân trong phạm vi tác nhân, hãy dùng `agents.list[].memorySearch.qmd.extraCollections` thay cho `memory.qmd.paths`. Các bộ sưu tập bổ sung đó tuân theo cùng cấu trúc `{ path, name, pattern? }`, nhưng được hợp nhất theo từng tác nhân và có thể giữ nguyên tên dùng chung được chỉ định rõ khi đường dẫn trỏ ra ngoài không gian làm việc hiện tại. Nếu cùng một đường dẫn đã phân giải xuất hiện trong cả `memory.qmd.paths` và `memorySearch.qmd.extraCollections`, QMD giữ mục đầu tiên và bỏ qua mục trùng lặp.

---

## Bộ nhớ đa phương thức (Gemini)

Lập chỉ mục hình ảnh và âm thanh cùng với Markdown bằng Gemini Embedding 2:

| Khóa                       | Kiểu       | Mặc định    | Mô tả                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Bật lập chỉ mục đa phương thức             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` hoặc `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | Kích thước tệp tối đa để lập chỉ mục (10 MiB)    |

<Note>
Chỉ áp dụng cho các tệp trong `extraPaths`. Các thư mục gốc bộ nhớ mặc định vẫn chỉ hỗ trợ Markdown. Yêu cầu `gemini-embedding-2-preview`. `fallback` phải là `"none"`.
</Note>

Các định dạng được hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (hình ảnh); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (âm thanh).

---

## Bộ nhớ đệm embedding

| Khóa                | Kiểu      | Mặc định | Mô tả                                  |
| ------------------ | --------- | ------- | -------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | Lưu embedding của các đoạn vào bộ nhớ đệm trong SQLite             |
| `cache.maxEntries` | `number`  | chưa đặt   | Giới hạn trên theo nỗ lực tối đa cho số embedding được lưu đệm |

Ngăn việc tạo lại embedding cho văn bản không thay đổi trong quá trình lập lại chỉ mục hoặc cập nhật bản chép lời. Để `maxEntries` ở trạng thái chưa đặt nếu muốn bộ nhớ đệm không giới hạn; hãy đặt giá trị khi mức tăng dung lượng ổ đĩa quan trọng hơn tốc độ lập lại chỉ mục cao nhất. Khi được đặt, các mục cũ nhất (theo thời điểm cập nhật gần nhất) sẽ bị loại bỏ trước khi bộ nhớ đệm vượt quá giới hạn.

---

## Lập chỉ mục theo lô

| Khóa                           | Kiểu      | Mặc định | Mô tả                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Embedding nội tuyến song song |
| `remote.batch.enabled`        | `boolean` | `false` | Bật API embedding theo lô |
| `remote.batch.concurrency`    | `number`  | `2`     | Các tác vụ theo lô song song        |
| `remote.batch.wait`           | `boolean` | `true`  | Chờ hoàn tất lô  |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | Khoảng thời gian thăm dò              |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | Thời gian chờ của lô              |

Khả dụng cho `gemini`, `openai` và `voyage`. Chế độ theo lô của OpenAI thường nhanh nhất và rẻ nhất cho các đợt điền dữ liệu lịch sử quy mô lớn.

`remote.nonBatchConcurrency` kiểm soát các lệnh gọi embedding nội tuyến được các nhà cung cấp cục bộ/tự lưu trữ và các nhà cung cấp lưu trữ sử dụng khi API theo lô của nhà cung cấp không hoạt động. Ollama mặc định dùng `1` cho việc lập chỉ mục không theo lô để tránh gây quá tải cho các máy chủ cục bộ nhỏ hơn; hãy đặt giá trị cao hơn trên các máy lớn hơn.

Thiết lập này tách biệt với `sync.embeddingBatchTimeoutSeconds`, vốn kiểm soát thời gian chờ cho các lệnh gọi embedding nội tuyến.

---

## Tìm kiếm bộ nhớ phiên (thử nghiệm)

Lập chỉ mục bản chép lời phiên và cung cấp chúng thông qua `memory_search`:

| Khóa                           | Kiểu       | Mặc định      | Mô tả                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Bật lập chỉ mục phiên                 |
| `sources`                     | `string[]` | `["memory"]` | Thêm `"sessions"` để bao gồm bản chép lời |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ngưỡng byte để lập lại chỉ mục              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ngưỡng tin nhắn để lập lại chỉ mục           |

<Warning>
Việc lập chỉ mục phiên là tùy chọn chủ động và chạy bất đồng bộ. Kết quả có thể hơi lỗi thời. Nhật ký phiên nằm trên ổ đĩa, vì vậy hãy coi quyền truy cập hệ thống tệp là ranh giới tin cậy.
</Warning>

Hoạt động tìm kiếm bản chép lời phiên thông thường do mô hình gọi tuân theo
[`tools.sessions.visibility`](/vi/gateway/config-tools#toolssessions). Chế độ hiển thị
`tree` mặc định cho phép truy cập phiên hiện tại, các phiên do phiên đó tạo ra và
các phiên nhóm của cùng tác nhân được theo dõi thông qua khả năng nhận biết nhóm xung quanh. Các
phiên không liên quan khác yêu cầu chế độ hiển thị `agent` (hoặc `all` chỉ khi
cũng cần truy hồi giữa các tác nhân và chính sách giữa các tác nhân cho phép).

`rememberAcrossConversations` không mở rộng thiết lập đó. Nó cung cấp một
quyền riêng biệt chỉ dành cho thời gian chạy, giới hạn ở các bản chép lời riêng tư
của cùng tác nhân trong lượt Active Memory có giới hạn.

Các ví dụ bên dưới đặt những thiết lập này trong `agents.defaults`. Bạn cũng có thể
áp dụng các thiết lập `memorySearch` tương đương trong phần ghi đè theo từng tác nhân khi chỉ một
tác nhân cần lập chỉ mục và tìm kiếm bản chép lời phiên.

Để truy hồi từ Gateway đến tin nhắn trực tiếp trong cùng tác nhân:

<Tabs>
  <Tab title="Backend tích hợp">
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

Khi dùng QMD, riêng `agents.defaults.memorySearch.experimental.sessionMemory` và
`sources: ["sessions"]` không xuất bản chép lời vào QMD. Hãy đặt thêm
`memory.qmd.sessions.enabled: true`. Thiết lập cấp cao hơn
`rememberAcrossConversations: true` là ngoại lệ: nó ngầm bật thao tác
xuất phiên QMD bắt buộc cho tác nhân đó. Các bản xuất được ngầm bật vẫn là riêng tư:
chúng luôn dùng vị trí xuất nội bộ mặc định (`sessions.exportDir` đã cấu hình
chỉ áp dụng cho các bản xuất tường minh), chỉ được tìm kiếm
trong quá trình truy hồi giữa các cuộc hội thoại của tác nhân đó và `memory_get`
thông thường không thể đọc chúng. `memory.qmd.sessions.enabled: true`
tường minh giữ nguyên hành vi hiện có và đưa các bản chép lời
đã xuất vào kho dữ liệu bộ nhớ thông thường.

---

## Tăng tốc vectơ SQLite (sqlite-vec)

| Khóa                          | Kiểu      | Mặc định | Mô tả                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | Dùng sqlite-vec cho các truy vấn vectơ |
| `store.vector.extensionPath` | `string`  | đi kèm | Ghi đè đường dẫn sqlite-vec          |

Khi sqlite-vec không khả dụng, OpenClaw tự động chuyển sang độ tương đồng cosin trong tiến trình.

---

## Lưu trữ chỉ mục

Các chỉ mục bộ nhớ tích hợp nằm trong cơ sở dữ liệu SQLite OpenClaw của từng tác nhân tại
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Khóa                   | Kiểu     | Mặc định     | Mô tả                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | Bộ tách token FTS5 (`unicode61` hoặc `trigram`) |

---

## Cấu hình backend QMD

Đặt `memory.backend = "qmd"` để bật. Tất cả thiết lập QMD nằm trong `memory.qmd`:

| Khóa                      | Kiểu      | Mặc định  | Mô tả                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Đường dẫn tệp thực thi QMD; đặt đường dẫn tuyệt đối khi `PATH` của dịch vụ khác với shell của bạn |
| `searchMode`             | `string`  | `search` | Lệnh tìm kiếm: `search`, `vsearch`, `query`                                          |
| `rerank`                 | `boolean` | --       | Đặt thành `false` cùng với `searchMode: "query"` và QMD 2.1+ để bỏ qua việc xếp hạng lại của QMD          |
| `includeDefaultMemory`   | `boolean` | `true`   | Tự động lập chỉ mục `MEMORY.md` + `memory/**/*.md`                                             |
| `paths[]`                | `array`   | --       | Các đường dẫn bổ sung: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | Xuất bản chép lời phiên vào QMD                                                   |
| `sessions.retentionDays` | `number`  | --       | Thời gian lưu giữ bản chép lời                                                                  |
| `sessions.exportDir`     | `string`  | --       | Thư mục xuất                                                                      |

`searchMode: "search"` chỉ dùng tìm kiếm từ vựng/BM25. OpenClaw không chạy các phép kiểm tra mức sẵn sàng của vectơ ngữ nghĩa hoặc bảo trì embedding QMD cho chế độ đó, kể cả trong `memory status --deep`; `vsearch` và `query` vẫn yêu cầu mức sẵn sàng của vectơ và embedding QMD.

`rerank: false` chỉ thay đổi chế độ QMD `query` và yêu cầu QMD 2.1 trở lên. Trong chế độ CLI trực tiếp, OpenClaw truyền `--no-rerank`; trong chế độ MCP dựa trên mcporter, OpenClaw truyền `rerank: false` cho công cụ truy vấn hợp nhất của QMD. Không đặt giá trị để sử dụng hành vi xếp hạng lại truy vấn mặc định của QMD.

OpenClaw ưu tiên các dạng tập hợp và truy vấn MCP hiện tại của QMD, nhưng vẫn duy trì khả năng hoạt động của các bản phát hành QMD cũ hơn bằng cách thử các cờ mẫu tập hợp tương thích và tên công cụ MCP cũ hơn khi cần. Khi QMD công bố hỗ trợ nhiều bộ lọc tập hợp, các tập hợp cùng nguồn được tìm kiếm bằng một tiến trình QMD; các bản dựng QMD cũ hơn vẫn sử dụng đường dẫn tương thích theo từng tập hợp. Cùng nguồn nghĩa là các tập hợp bộ nhớ bền vững (các tệp bộ nhớ mặc định cùng với đường dẫn tùy chỉnh) được nhóm lại với nhau, trong khi các tập hợp bản chép lại phiên vẫn là một nhóm riêng để việc đa dạng hóa nguồn tiếp tục có cả hai đầu vào.

<Note>
Các giá trị ghi đè mô hình QMD được đặt ở phía QMD, không phải trong cấu hình OpenClaw. Nếu cần ghi đè các mô hình của QMD trên toàn cục, hãy đặt các biến môi trường như `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` và `QMD_GENERATE_MODEL` trong môi trường thời gian chạy của Gateway.
</Note>

### Tích hợp mcporter

Tất cả đều nằm trong `memory.qmd.mcporter`. Định tuyến các lượt tìm kiếm QMD qua một daemon MCP `mcporter` chạy lâu dài thay vì khởi tạo `qmd` cho mỗi truy vấn, qua đó giảm chi phí khởi động nguội đối với các mô hình lớn hơn.

| Khóa           | Kiểu      | Mặc định | Mô tả                                                            |
| ------------- | --------- | ------- | ---------------------------------------------------------------------- |
| `enabled`     | `boolean` | `false` | Định tuyến các lệnh gọi QMD qua mcporter thay vì khởi tạo `qmd` cho mỗi yêu cầu |
| `serverName`  | `string`  | `qmd`   | Tên máy chủ mcporter chạy `qmd mcp` với `lifecycle: keep-alive`  |
| `startDaemon` | `boolean` | `true`  | Tự động khởi động daemon mcporter khi `enabled` là true         |

Yêu cầu đã cài đặt `mcporter` và có trong PATH, cùng với một máy chủ mcporter đã cấu hình để chạy `qmd mcp`. Giữ trạng thái tắt cho các thiết lập cục bộ đơn giản hơn, nơi chi phí khởi tạo tiến trình cho mỗi truy vấn ở mức chấp nhận được.

<AccordionGroup>
  <Accordion title="Lịch cập nhật">
    | Khóa                       | Kiểu      | Mặc định | Mô tả                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Khoảng thời gian làm mới                      |
    | `update.debounceMs`       | `number`  | `15000` | Chống dội các thay đổi tệp                 |
    | `update.onBoot`           | `boolean` | `true`  | Làm mới khi trình quản lý QMD chạy lâu dài mở; đặt thành false để bỏ qua lần cập nhật ngay khi khởi động |
    | `update.startup`          | `string`  | `off`   | Khởi tạo QMD tùy chọn khi Gateway khởi động: `off`, `idle` hoặc `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Độ trễ trước khi lần làm mới `startup: "idle"` chạy |
    | `update.waitForBootSync`  | `boolean` | `false` | Chặn việc mở trình quản lý cho đến khi lần làm mới ban đầu hoàn tất |
    | `update.embedInterval`    | `string`  | `60m`   | Nhịp nhúng riêng biệt                |
    | `update.commandTimeoutMs` | `number`  | `30000` | Thời gian chờ cho các lệnh bảo trì QMD (liệt kê/thêm tập hợp) |
    | `update.updateTimeoutMs`  | `number`  | `120000` | Thời gian chờ cho mỗi chu kỳ `qmd update`   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | Thời gian chờ cho mỗi chu kỳ `qmd embed`    |
  </Accordion>
  <Accordion title="Giới hạn">
    | Khóa                       | Kiểu     | Mặc định | Mô tả                |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | Số kết quả tìm kiếm tối đa         |
    | `limits.maxSnippetChars`  | `number` | `450`   | Giới hạn độ dài đoạn trích       |
    | `limits.maxInjectedChars` | `number` | `2200`  | Giới hạn tổng số ký tự được chèn |
    | `limits.timeoutMs`        | `number` | `4000`  | Thời gian chờ lệnh QMD trong quá trình tìm kiếm dựa trên QMD, bao gồm `memory_search`; việc thiết lập, đồng bộ hóa, dự phòng tích hợp sẵn và công việc bổ sung vẫn dùng thời hạn mặc định của công cụ |
  </Accordion>
  <Accordion title="Phạm vi">
    Kiểm soát những phiên nào có thể nhận kết quả tìm kiếm QMD. Cùng lược đồ với [`session.sendPolicy`](/vi/gateway/config-agents#session):

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

    Giá trị mặc định được phát hành chỉ cho phép DM/trực tiếp, từ chối nhóm và các loại kênh khác. `match.keyPrefix` khớp với khóa phiên đã chuẩn hóa; `match.rawKeyPrefix` khớp với khóa thô, bao gồm `agent:<id>:`.

  </Accordion>
  <Accordion title="Trích dẫn">
    `memory.citations` áp dụng cho tất cả backend:

    | Giá trị            | Hành vi                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (mặc định) | Bao gồm chân trang `Source: <path#line>` trong các đoạn trích    |
    | `on`             | Luôn bao gồm chân trang                               |
    | `off`            | Bỏ chân trang (đường dẫn vẫn được truyền nội bộ cho tác tử) |

  </Accordion>
</AccordionGroup>

Khi bật khởi tạo QMD lúc Gateway khởi động, OpenClaw chỉ khởi động QMD cho các tác tử đủ điều kiện. Nếu `update.onBoot` là true và không cấu hình bảo trì theo khoảng thời gian/nhúng, quá trình khởi động sẽ sử dụng trình quản lý một lần cho lần làm mới khi khởi động rồi đóng trình quản lý đó. Nếu đã cấu hình khoảng thời gian cập nhật hoặc nhúng, quá trình khởi động sẽ mở trình quản lý QMD chạy lâu dài để trình này có thể sở hữu trình theo dõi và các bộ hẹn giờ theo khoảng thời gian; `update.onBoot: false` chỉ bỏ qua lần làm mới ngay khi khởi động.

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

Để biết hành vi khái niệm và các lệnh gạch chéo, hãy xem [Dreaming](/vi/concepts/dreaming).

### Cài đặt người dùng

| Khóa                                    | Kiểu      | Mặc định       | Mô tả                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Bật hoặc tắt hoàn toàn Dreaming                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | Nhịp cron tùy chọn cho lượt quét Dreaming đầy đủ                                                                                |
| `model`                                | `string`  | mô hình mặc định | Ghi đè mô hình tác tử con Dream Diary tùy chọn                                                                                     |
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
- Dreaming ghi đầu ra tường thuật mà con người có thể đọc được vào `DREAMS.md` (hoặc `dreams.md` hiện có).
- `dreaming.model` sử dụng cổng tin cậy tác tử con hiện có của Plugin; hãy đặt `plugins.entries.memory-core.subagent.allowModelOverride: true` trước khi bật tính năng này.
- Dream Diary thử lại một lần bằng mô hình mặc định của phiên khi mô hình đã cấu hình không khả dụng. Các lỗi về độ tin cậy hoặc danh sách cho phép được ghi nhật ký và không được âm thầm thử lại.
- Chính sách và ngưỡng của các giai đoạn nhẹ/sâu/REM là hành vi nội bộ, không phải cấu hình dành cho người dùng.

</Note>

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
