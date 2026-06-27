---
read_when:
    - Bạn muốn cấu hình nhà cung cấp tìm kiếm bộ nhớ hoặc mô hình embedding
    - Bạn muốn thiết lập phần phụ trợ QMD
    - Bạn muốn tinh chỉnh tìm kiếm lai, MMR hoặc suy giảm theo thời gian
    - Bạn muốn bật tính năng lập chỉ mục bộ nhớ đa phương thức
sidebarTitle: Memory config
summary: Tất cả các nút điều chỉnh cấu hình cho tìm kiếm bộ nhớ, nhà cung cấp embedding, QMD, tìm kiếm lai và lập chỉ mục đa phương thức
title: Tham khảo cấu hình bộ nhớ
x-i18n:
    generated_at: "2026-06-27T18:08:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

Trang này liệt kê mọi tùy chọn cấu hình cho tìm kiếm bộ nhớ của OpenClaw. Để xem tổng quan khái niệm, hãy xem:

<CardGroup cols={2}>
  <Card title="Tổng quan bộ nhớ" href="/vi/concepts/memory">
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

Tất cả thiết lập tìm kiếm bộ nhớ nằm dưới `agents.defaults.memorySearch` trong `openclaw.json`, trừ khi có ghi chú khác.

<Note>
Nếu bạn đang tìm công tắc bật/tắt tính năng **Active Memory** và cấu hình tác nhân phụ, phần đó nằm dưới `plugins.entries.active-memory` thay vì `memorySearch`.

Active Memory dùng mô hình hai cổng:

1. Plugin phải được bật và nhắm đến id tác nhân hiện tại
2. yêu cầu phải là một phiên trò chuyện liên tục, tương tác và đủ điều kiện

Xem [Active Memory](/vi/concepts/active-memory) để biết mô hình kích hoạt, cấu hình do Plugin sở hữu, lưu giữ bản ghi hội thoại và mẫu triển khai an toàn.
</Note>

---

## Chọn nhà cung cấp

| Khóa       | Kiểu      | Mặc định                 | Mô tả                                                                                                                                                                                                                                                                                    |
| ---------- | --------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`               | ID bộ chuyển đổi embedding như `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible`, hoặc `voyage`; cũng có thể là một `models.providers.<id>` đã cấu hình có `api` trỏ đến bộ chuyển đổi embedding bộ nhớ hoặc API mô hình tương thích OpenAI |
| `model`    | `string`  | mặc định của nhà cung cấp | Tên mô hình embedding                                                                                                                                                                                                                                                                    |
| `fallback` | `string`  | `"none"`                 | ID bộ chuyển đổi dự phòng khi bộ chuyển đổi chính thất bại                                                                                                                                                                                                                               |
| `enabled`  | `boolean` | `true`                   | Bật hoặc tắt tìm kiếm bộ nhớ                                                                                                                                                                                                                                                             |

Khi `provider` chưa được đặt, OpenClaw dùng embedding của OpenAI. Đặt `provider`
rõ ràng để dùng Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, mô hình GGUF cục bộ, hoặc endpoint `/v1/embeddings` tương thích OpenAI.
Các cấu hình cũ vẫn ghi `provider: "auto"` sẽ được phân giải thành `openai`.

<Warning>
Việc thay đổi nhà cung cấp embedding, mô hình, thiết lập nhà cung cấp, nguồn, phạm vi,
chia đoạn, hoặc tokenizer có thể khiến chỉ mục vector SQLite hiện có không tương thích.
OpenClaw tạm dừng tìm kiếm vector và báo cảnh báo định danh chỉ mục thay vì
tự động tạo lại embedding cho mọi thứ. Hãy xây dựng lại khi bạn đã sẵn sàng bằng
`openclaw memory status --index --agent <id>` hoặc
`openclaw memory index --force --agent <id>`.
</Warning>

Khi `provider` chưa đặt, có `provider: "auto"` cũ, hoặc
`provider: "none"` cố ý chọn chế độ chỉ dùng FTS, truy hồi bộ nhớ vẫn có thể
dùng xếp hạng FTS theo từ vựng khi embedding không khả dụng.

Các nhà cung cấp phi cục bộ được đặt rõ ràng sẽ thất bại đóng. Nếu bạn đặt `memorySearch.provider` thành
một nhà cung cấp cụ thể có backend từ xa như OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio, hoặc một nhà cung cấp tùy chỉnh
tương thích OpenAI, và nhà cung cấp đó không khả dụng khi chạy, `memory_search`
sẽ trả về kết quả không khả dụng thay vì âm thầm dùng truy hồi chỉ FTS. Hãy sửa
cấu hình nhà cung cấp/xác thực, chuyển sang nhà cung cấp có thể truy cập, hoặc đặt
`provider: "none"` nếu bạn muốn chủ động truy hồi chỉ FTS.

### ID nhà cung cấp tùy chỉnh

`memorySearch.provider` có thể trỏ đến một mục `models.providers.<id>` tùy chỉnh cho các bộ chuyển đổi nhà cung cấp chuyên cho bộ nhớ như `ollama`, hoặc cho API mô hình tương thích OpenAI như `openai-responses` / `openai-completions`. OpenClaw phân giải chủ sở hữu `api` của nhà cung cấp đó cho bộ chuyển đổi embedding, đồng thời giữ nguyên id nhà cung cấp tùy chỉnh để xử lý endpoint, xác thực và tiền tố mô hình. Điều này cho phép các thiết lập nhiều GPU hoặc nhiều máy chủ dành riêng embedding bộ nhớ cho một endpoint cục bộ cụ thể:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
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

Embedding từ xa yêu cầu khóa API. Thay vào đó, Bedrock dùng chuỗi thông tin xác thực mặc định của AWS SDK (vai trò instance, SSO, khóa truy cập).

| Nhà cung cấp | Biến môi trường                                  | Khóa cấu hình                       |
| ------------ | ------------------------------------------------ | ----------------------------------- |
| Bedrock      | Chuỗi thông tin xác thực AWS                     | Không cần khóa API                  |
| DeepInfra    | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey` |
| Gemini       | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Hồ sơ xác thực qua đăng nhập thiết bị |
| Mistral      | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey`   |
| Ollama       | `OLLAMA_API_KEY` (placeholder)                   | --                                  |
| OpenAI       | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`    |
| Voyage       | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth chỉ bao phủ chat/completions và không đáp ứng các yêu cầu embedding.
</Note>

---

## Cấu hình endpoint từ xa

Dùng `provider: "openai-compatible"` cho một máy chủ `/v1/embeddings`
tương thích OpenAI dạng chung không nên kế thừa thông tin xác thực trò chuyện OpenAI toàn cục.

<ParamField path="remote.baseUrl" type="string">
  URL cơ sở API tùy chỉnh.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Ghi đè khóa API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Header HTTP bổ sung (được gộp với mặc định của nhà cung cấp).
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

## Cấu hình theo từng nhà cung cấp

<AccordionGroup>
  <Accordion title="Gemini">
    | Khóa                   | Kiểu     | Mặc định              | Mô tả                                      |
    | ---------------------- | -------- | --------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Cũng hỗ trợ `gemini-embedding-2-preview`  |
    | `outputDimensionality` | `number` | `3072`                | Với Embedding 2: 768, 1536, hoặc 3072      |

    <Warning>
    Việc thay đổi mô hình hoặc `outputDimensionality` sẽ thay đổi định danh chỉ mục. OpenClaw
    tạm dừng tìm kiếm vector cho đến khi bạn xây dựng lại chỉ mục bộ nhớ một cách rõ ràng.
    </Warning>

  </Accordion>
  <Accordion title="Kiểu đầu vào tương thích OpenAI">
    Các endpoint embedding tương thích OpenAI có thể chọn dùng các trường yêu cầu `input_type` dành riêng cho nhà cung cấp. Điều này hữu ích cho các mô hình embedding bất đối xứng yêu cầu nhãn khác nhau cho embedding truy vấn và tài liệu.

    | Khóa                | Kiểu     | Mặc định  | Mô tả                                                     |
    | ------------------- | -------- | --------- | --------------------------------------------------------- |
    | `inputType`         | `string` | chưa đặt  | `input_type` dùng chung cho embedding truy vấn và tài liệu |
    | `queryInputType`    | `string` | chưa đặt  | `input_type` khi truy vấn; ghi đè `inputType`             |
    | `documentInputType` | `string` | chưa đặt  | `input_type` cho chỉ mục/tài liệu; ghi đè `inputType`     |

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

    Việc thay đổi các giá trị này ảnh hưởng đến định danh bộ nhớ đệm embedding cho lập chỉ mục theo lô của nhà cung cấp và nên được theo sau bằng việc lập chỉ mục lại bộ nhớ khi mô hình upstream xử lý các nhãn khác nhau.

  </Accordion>
  <Accordion title="Bedrock">
    ### Cấu hình embedding Bedrock

    Bedrock dùng chuỗi thông tin xác thực mặc định của AWS SDK — không cần khóa API. Nếu OpenClaw chạy trên EC2 với vai trò instance đã bật Bedrock, chỉ cần đặt nhà cung cấp và mô hình:

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

    | Khóa                   | Kiểu     | Mặc định                     | Mô tả                                 |
    | ---------------------- | -------- | ---------------------------- | ------------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Bất kỳ ID mô hình embedding Bedrock nào |
    | `outputDimensionality` | `number` | mặc định của mô hình         | Với Titan V2: 256, 512, hoặc 1024     |

    **Mô hình được hỗ trợ** (với phát hiện họ và mặc định kích thước):

    | ID mô hình                                 | Nhà cung cấp | Kích thước mặc định | Kích thước có thể cấu hình |
    | ------------------------------------------ | ------------ | ------------------- | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon       | 1024                | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon       | 1536                | --                         |
    | `amazon.titan-embed-g1-text-02`            | Amazon       | 1536                | --                         |
    | `amazon.titan-embed-image-v1`              | Amazon       | 1024                | --                         |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon       | 1024                | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere       | 1024                | --                         |
    | `cohere.embed-multilingual-v3`             | Cohere       | 1024                | --                         |
    | `cohere.embed-v4:0`                        | Cohere       | 1536                | 256-1536                   |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs   | 512                 | --                         |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs   | 1024                | --                         |

    Các biến thể có hậu tố thông lượng (ví dụ: `amazon.titan-embed-text-v1:2:8k`) kế thừa cấu hình của mô hình cơ sở.

    **Xác thực:** Xác thực Bedrock dùng thứ tự phân giải thông tin xác thực tiêu chuẩn của AWS SDK:

    1. Biến môi trường (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Bộ nhớ đệm token SSO
    3. Thông tin xác thực token danh tính web
    4. Tệp thông tin xác thực và cấu hình dùng chung
    5. Thông tin xác thực siêu dữ liệu ECS hoặc EC2

    Vùng được phân giải từ `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` của nhà cung cấp `amazon-bedrock`, hoặc mặc định là `us-east-1`.

    **Quyền IAM:** vai trò hoặc người dùng IAM cần:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Để áp dụng đặc quyền tối thiểu, giới hạn phạm vi `InvokeModel` vào mô hình cụ thể:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | Khóa                  | Kiểu               | Mặc định               | Mô tả                                                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | tự động tải xuống      | Đường dẫn đến tệp mô hình GGUF                                                                                                                                                                                                                                                                                                                        |
    | `local.modelCacheDir` | `string`           | mặc định node-llama-cpp | Thư mục bộ nhớ đệm cho các mô hình đã tải xuống                                                                                                                                                                                                                                                                                                       |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Kích thước cửa sổ ngữ cảnh cho ngữ cảnh embedding. 4096 bao phủ các đoạn điển hình (128–512 token) trong khi giới hạn VRAM không thuộc trọng số. Giảm xuống 1024–2048 trên máy chủ hạn chế tài nguyên. `"auto"` dùng mức tối đa đã huấn luyện của mô hình — không khuyến nghị cho mô hình 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM so với ~8.8 GB ở 4096). |

    Trước tiên hãy cài đặt nhà cung cấp llama.cpp chính thức: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Mô hình mặc định: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, tự động tải xuống). Các checkout mã nguồn vẫn yêu cầu phê duyệt bản dựng native: `pnpm approve-builds` rồi `pnpm rebuild node-llama-cpp`.

    Dùng CLI độc lập để xác minh cùng đường dẫn nhà cung cấp mà Gateway dùng:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Đặt `provider: "local"` rõ ràng cho embedding GGUF cục bộ. Tham chiếu mô hình `hf:` và HTTP(S) được hỗ trợ cho cấu hình cục bộ rõ ràng, nhưng chúng không thay đổi nhà cung cấp mặc định.

  </Accordion>
</AccordionGroup>

### Thời gian chờ embedding nội tuyến

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Ghi đè thời gian chờ cho các lô embedding nội tuyến trong quá trình lập chỉ mục bộ nhớ.

Khi chưa đặt, dùng mặc định của nhà cung cấp: 600 giây cho các nhà cung cấp cục bộ/tự lưu trữ như `local`, `ollama` và `lmstudio`, và 120 giây cho các nhà cung cấp được lưu trữ. Tăng giá trị này khi các lô embedding chạy bằng CPU cục bộ vẫn khỏe nhưng chậm.
</ParamField>

---

## Cấu hình tìm kiếm kết hợp

Tất cả nằm dưới `memorySearch.query.hybrid`:

| Khóa                  | Kiểu      | Mặc định | Mô tả                                  |
| --------------------- | --------- | -------- | -------------------------------------- |
| `enabled`             | `boolean` | `true`   | Bật tìm kiếm kết hợp BM25 + vector     |
| `vectorWeight`        | `number`  | `0.7`    | Trọng số cho điểm vector (0-1)         |
| `textWeight`          | `number`  | `0.3`    | Trọng số cho điểm BM25 (0-1)           |
| `candidateMultiplier` | `number`  | `4`      | Hệ số nhân kích thước nhóm ứng viên    |

<Tabs>
  <Tab title="MMR (diversity)">
    | Khóa          | Kiểu      | Mặc định | Mô tả                                     |
    | ------------- | --------- | -------- | ----------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`  | Bật xếp hạng lại bằng MMR                 |
    | `mmr.lambda`  | `number`  | `0.7`    | 0 = đa dạng tối đa, 1 = liên quan tối đa |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | Khóa                         | Kiểu      | Mặc định | Mô tả                            |
    | ---------------------------- | --------- | -------- | -------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`  | Bật tăng điểm theo độ mới        |
    | `temporalDecay.halfLifeDays` | `number`  | `30`     | Điểm giảm một nửa sau mỗi N ngày |

    Các tệp thường xanh (`MEMORY.md`, các tệp không ghi ngày trong `memory/`) không bao giờ bị giảm điểm theo thời gian.

  </Tab>
</Tabs>

### Ví dụ đầy đủ

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
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

| Khóa         | Loại       | Mô tả                                      |
| ------------ | ---------- | ------------------------------------------ |
| `extraPaths` | `string[]` | Thư mục hoặc tệp bổ sung để lập chỉ mục    |

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

Đường dẫn có thể là tuyệt đối hoặc tương đối với workspace. Các thư mục được quét đệ quy để tìm tệp `.md`. Cách xử lý symlink phụ thuộc vào backend đang hoạt động: engine tích hợp bỏ qua symlink, còn QMD tuân theo hành vi của trình quét QMD bên dưới.

Để tìm kiếm transcript liên agent theo phạm vi agent, hãy dùng `agents.list[].memorySearch.qmd.extraCollections` thay vì `memory.qmd.paths`. Các collection bổ sung đó tuân theo cùng dạng `{ path, name, pattern? }`, nhưng chúng được hợp nhất theo từng agent và có thể giữ nguyên tên chia sẻ tường minh khi đường dẫn trỏ ra ngoài workspace hiện tại. Nếu cùng một đường dẫn đã phân giải xuất hiện trong cả `memory.qmd.paths` và `memorySearch.qmd.extraCollections`, QMD giữ mục đầu tiên và bỏ qua mục trùng lặp.

---

## Bộ nhớ đa phương thức (Gemini)

Lập chỉ mục hình ảnh và âm thanh cùng với Markdown bằng Gemini Embedding 2:

| Khóa                      | Loại       | Mặc định   | Mô tả                                  |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Bật lập chỉ mục đa phương thức         |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, hoặc `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Kích thước tệp tối đa để lập chỉ mục   |

<Note>
Chỉ áp dụng cho các tệp trong `extraPaths`. Các gốc bộ nhớ mặc định vẫn chỉ dùng Markdown. Yêu cầu `gemini-embedding-2-preview`. `fallback` phải là `"none"`.
</Note>

Định dạng được hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (hình ảnh); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (âm thanh).

---

## Bộ nhớ đệm embedding

| Khóa               | Loại      | Mặc định | Mô tả                              |
| ------------------ | --------- | ------- | ---------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | Lưu embedding của chunk trong SQLite |
| `cache.maxEntries` | `number`  | `50000` | Số embedding được lưu tối đa       |

Ngăn việc tạo lại embedding cho văn bản không đổi trong quá trình lập chỉ mục lại hoặc cập nhật transcript.

---

## Lập chỉ mục theo lô

| Khóa                          | Loại      | Mặc định | Mô tả                         |
| ----------------------------- | --------- | ------- | ----------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Embedding inline song song    |
| `remote.batch.enabled`        | `boolean` | `false` | Bật API embedding theo lô     |
| `remote.batch.concurrency`    | `number`  | `2`     | Tác vụ theo lô song song      |
| `remote.batch.wait`           | `boolean` | `true`  | Chờ hoàn tất lô               |
| `remote.batch.pollIntervalMs` | `number`  | --      | Khoảng thời gian thăm dò      |
| `remote.batch.timeoutMinutes` | `number`  | --      | Thời gian chờ tối đa của lô   |

Có sẵn cho `openai`, `gemini`, và `voyage`. Lô OpenAI thường nhanh nhất và rẻ nhất cho các lần backfill lớn.

`remote.nonBatchConcurrency` kiểm soát các lệnh gọi embedding inline được dùng bởi provider cục bộ/tự lưu trữ và provider được lưu trữ khi API theo lô của provider không hoạt động. Ollama mặc định là `1` cho lập chỉ mục không theo lô để tránh gây quá tải cho các host cục bộ nhỏ hơn; đặt giá trị cao hơn trên máy lớn hơn.

Thiết lập này tách biệt với `sync.embeddingBatchTimeoutSeconds`, vốn kiểm soát thời gian chờ cho các lệnh gọi embedding inline.

---

## Tìm kiếm bộ nhớ phiên (thử nghiệm)

Lập chỉ mục transcript phiên và hiển thị chúng qua `memory_search`:

| Khóa                          | Loại       | Mặc định     | Mô tả                                   |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Bật lập chỉ mục phiên                   |
| `sources`                     | `string[]` | `["memory"]` | Thêm `"sessions"` để bao gồm transcript |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ngưỡng byte để lập chỉ mục lại          |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ngưỡng tin nhắn để lập chỉ mục lại      |

<Warning>
Lập chỉ mục phiên là tùy chọn bật và chạy bất đồng bộ. Kết quả có thể hơi cũ. Nhật ký phiên nằm trên đĩa, vì vậy hãy xem quyền truy cập hệ thống tệp là ranh giới tin cậy.
</Warning>

---

## Tăng tốc vector SQLite (sqlite-vec)

| Khóa                         | Kiểu      | Mặc định | Mô tả                                  |
| ---------------------------- | --------- | -------- | -------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`   | Dùng sqlite-vec cho truy vấn vector    |
| `store.vector.extensionPath` | `string`  | tích hợp | Ghi đè đường dẫn sqlite-vec            |

Khi sqlite-vec không khả dụng, OpenClaw tự động chuyển sang dùng độ tương đồng cosine trong tiến trình.

---

## Lưu trữ chỉ mục

Các chỉ mục bộ nhớ tích hợp nằm trong cơ sở dữ liệu OpenClaw SQLite của từng agent tại
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Khóa                  | Kiểu     | Mặc định   | Mô tả                                     |
| --------------------- | -------- | ---------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | Bộ tách từ FTS5 (`unicode61` hoặc `trigram`) |

---

## Cấu hình backend QMD

Đặt `memory.backend = "qmd"` để bật. Tất cả thiết lập QMD nằm trong `memory.qmd`:

| Khóa                     | Kiểu      | Mặc định | Mô tả                                                                                  |
| ------------------------ | --------- | -------- | -------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Đường dẫn tệp thực thi QMD; đặt đường dẫn tuyệt đối khi `PATH` của dịch vụ khác shell của bạn |
| `searchMode`             | `string`  | `search` | Lệnh tìm kiếm: `search`, `vsearch`, `query`                                             |
| `rerank`                 | `boolean` | --       | Đặt thành `false` với `searchMode: "query"` và QMD 2.1+ để bỏ qua việc xếp hạng lại của QMD |
| `includeDefaultMemory`   | `boolean` | `true`   | Tự động lập chỉ mục `MEMORY.md` + `memory/**/*.md`                                      |
| `paths[]`                | `array`   | --       | Đường dẫn bổ sung: `{ name, path, pattern? }`                                           |
| `sessions.enabled`       | `boolean` | `false`  | Lập chỉ mục bản ghi phiên                                                               |
| `sessions.retentionDays` | `number`  | --       | Thời gian lưu giữ bản ghi                                                               |
| `sessions.exportDir`     | `string`  | --       | Thư mục xuất                                                                            |

`searchMode: "search"` chỉ dùng từ vựng/BM25. OpenClaw không chạy các phép kiểm tra mức sẵn sàng vector ngữ nghĩa hoặc bảo trì embedding QMD cho chế độ đó, kể cả trong `memory status --deep`; `vsearch` và `query` vẫn tiếp tục yêu cầu mức sẵn sàng vector và embedding của QMD.

`rerank: false` chỉ thay đổi chế độ `query` của QMD và yêu cầu QMD 2.1 trở lên. Ở chế độ CLI trực tiếp, OpenClaw truyền `--no-rerank`; ở chế độ MCP dựa trên mcporter, nó truyền `rerank: false` cho công cụ truy vấn hợp nhất của QMD. Để trống để dùng hành vi xếp hạng lại truy vấn mặc định của QMD.

OpenClaw ưu tiên các dạng collection và truy vấn MCP hiện tại của QMD, nhưng vẫn giữ cho các bản phát hành QMD cũ hoạt động bằng cách thử các cờ mẫu collection tương thích và tên công cụ MCP cũ hơn khi cần. Khi QMD thông báo hỗ trợ nhiều bộ lọc collection, các collection cùng nguồn được tìm kiếm bằng một tiến trình QMD; các bản dựng QMD cũ vẫn giữ đường dẫn tương thích theo từng collection. Cùng nguồn nghĩa là các collection bộ nhớ bền vững được nhóm lại với nhau, còn collection bản ghi phiên vẫn là một nhóm riêng để đa dạng hóa nguồn vẫn có cả hai đầu vào.

<Note>
Các ghi đè mô hình QMD nằm ở phía QMD, không nằm trong cấu hình OpenClaw. Nếu bạn cần ghi đè các mô hình của QMD trên toàn cục, hãy đặt các biến môi trường như `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, và `QMD_GENERATE_MODEL` trong môi trường runtime của gateway.
</Note>

<AccordionGroup>
  <Accordion title="Update schedule">
    | Khóa                      | Kiểu      | Mặc định | Mô tả                           |
    | ------------------------- | --------- | -------- | -------------------------------- |
    | `update.interval`         | `string`  | `5m`     | Khoảng thời gian làm mới         |
    | `update.debounceMs`       | `number`  | `15000`  | Chống dội thay đổi tệp           |
    | `update.onBoot`           | `boolean` | `true`   | Làm mới khi trình quản lý QMD dài hạn mở; đặt false để bỏ qua lần cập nhật khởi động tức thì |
    | `update.startup`          | `string`  | `off`    | Khởi tạo QMD tùy chọn khi Gateway khởi động: `off`, `idle`, hoặc `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Độ trễ trước khi làm mới `startup: "idle"` chạy |
    | `update.waitForBootSync`  | `boolean` | `false`  | Chặn việc mở trình quản lý cho đến khi lần làm mới ban đầu hoàn tất |
    | `update.embedInterval`    | `string`  | --       | Nhịp embed riêng                 |
    | `update.commandTimeoutMs` | `number`  | --       | Thời gian chờ cho lệnh QMD       |
    | `update.updateTimeoutMs`  | `number`  | --       | Thời gian chờ cho thao tác cập nhật QMD |
    | `update.embedTimeoutMs`   | `number`  | --       | Thời gian chờ cho thao tác embed QMD |
  </Accordion>
  <Accordion title="Limits">
    | Khóa                      | Kiểu     | Mặc định | Mô tả                         |
    | ------------------------- | -------- | -------- | ----------------------------- |
    | `limits.maxResults`       | `number` | `6`      | Số kết quả tìm kiếm tối đa    |
    | `limits.maxSnippetChars`  | `number` | --       | Giới hạn độ dài đoạn trích    |
    | `limits.maxInjectedChars` | `number` | --       | Giới hạn tổng số ký tự được chèn |
    | `limits.timeoutMs`        | `number` | `4000`   | Thời gian chờ tìm kiếm        |
  </Accordion>
  <Accordion title="Scope">
    Kiểm soát phiên nào có thể nhận kết quả tìm kiếm QMD. Cùng schema với [`session.sendPolicy`](/vi/gateway/config-agents#session):

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

    Mặc định được phát hành cho phép phiên trực tiếp và phiên kênh, trong khi vẫn từ chối nhóm.

    Mặc định chỉ dành cho DM. `match.keyPrefix` khớp với khóa phiên đã chuẩn hóa; `match.rawKeyPrefix` khớp với khóa thô bao gồm `agent:<id>:`.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` áp dụng cho tất cả backend:

    | Giá trị          | Hành vi                                             |
    | ---------------- | --------------------------------------------------- |
    | `auto` (mặc định) | Bao gồm chân trang `Source: <path#line>` trong đoạn trích |
    | `on`             | Luôn bao gồm chân trang                             |
    | `off`            | Bỏ qua chân trang (đường dẫn vẫn được truyền nội bộ cho agent) |

  </Accordion>
</AccordionGroup>

Khi khởi tạo QMD lúc Gateway khởi động được bật, OpenClaw chỉ khởi động QMD cho các agent đủ điều kiện. Nếu `update.onBoot` là true và không cấu hình bảo trì interval/embed, quá trình khởi động dùng một trình quản lý một lần cho lần làm mới lúc boot rồi đóng nó. Nếu cấu hình một khoảng cập nhật hoặc embed, quá trình khởi động mở trình quản lý QMD dài hạn để nó có thể sở hữu watcher và bộ hẹn giờ interval; `update.onBoot: false` chỉ bỏ qua lần làm mới khởi động tức thì.

### Ví dụ QMD đầy đủ

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
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

Dreaming chạy như một lượt quét theo lịch duy nhất và dùng các pha light/deep/REM nội bộ như chi tiết triển khai.

Để xem hành vi khái niệm và các lệnh slash, hãy xem [Dreaming](/vi/concepts/dreaming).

### Thiết lập người dùng

| Khóa                                   | Kiểu      | Mặc định       | Mô tả                                                                                                                           |
| -------------------------------------- | --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`        | Bật hoặc tắt hoàn toàn dreaming                                                                                                 |
| `frequency`                            | `string`  | `0 3 * * *`    | Nhịp cron tùy chọn cho toàn bộ lượt quét dreaming                                                                               |
| `model`                                | `string`  | mô hình mặc định | Ghi đè mô hình subagent Dream Diary tùy chọn                                                                                    |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`          | Số token ước tính tối đa giữ lại từ mỗi đoạn trích truy hồi ngắn hạn được đưa vào `MEMORY.md`; siêu dữ liệu nguồn gốc vẫn hiển thị |

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
- Dreaming ghi đầu ra tường thuật dễ đọc cho con người vào `DREAMS.md` (hoặc `dreams.md` hiện có).
- `dreaming.model` dùng cổng tin cậy subagent hiện có của Plugin; đặt `plugins.entries.memory-core.subagent.allowModelOverride: true` trước khi bật.
- Dream Diary thử lại một lần với mô hình mặc định của phiên khi mô hình đã cấu hình không khả dụng. Lỗi tin cậy hoặc allowlist được ghi log và không được âm thầm thử lại.
- Chính sách và ngưỡng pha light/deep/REM là hành vi nội bộ, không phải cấu hình hướng tới người dùng.

</Note>

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
