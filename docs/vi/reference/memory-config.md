---
read_when:
    - Bạn muốn cấu hình nhà cung cấp tìm kiếm bộ nhớ hoặc mô hình embedding
    - Bạn muốn thiết lập backend QMD
    - Bạn muốn tinh chỉnh tìm kiếm lai, MMR hoặc suy giảm theo thời gian
    - Bạn muốn bật lập chỉ mục bộ nhớ đa phương thức
sidebarTitle: Memory config
summary: Tất cả các tùy chọn cấu hình cho tìm kiếm bộ nhớ, nhà cung cấp embedding, QMD, tìm kiếm lai và lập chỉ mục đa phương thức
title: Tham chiếu cấu hình bộ nhớ
x-i18n:
    generated_at: "2026-06-28T22:33:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de7d1c23cd415293001ef59ae2572cd7bfe9a88c70c1e4cf138ee60664ff0ac2
    source_path: reference/memory-config.md
    workflow: 16
---

Trang này liệt kê mọi nút cấu hình cho tìm kiếm bộ nhớ của OpenClaw. Để xem tổng quan khái niệm, hãy xem:

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
    Sub-agent bộ nhớ cho phiên tương tác.
  </Card>
</CardGroup>

Tất cả thiết lập tìm kiếm bộ nhớ nằm dưới `agents.defaults.memorySearch` trong `openclaw.json` trừ khi có ghi chú khác.

<Note>
Nếu bạn đang tìm công tắc bật/tắt tính năng **Active Memory** và cấu hình sub-agent, phần đó nằm dưới `plugins.entries.active-memory` thay vì `memorySearch`.

Active Memory dùng mô hình hai cổng:

1. plugin phải được bật và nhắm đến id agent hiện tại
2. yêu cầu phải là một phiên chat liên tục, tương tác đủ điều kiện

Xem [Active Memory](/vi/concepts/active-memory) để biết mô hình kích hoạt, cấu hình do plugin sở hữu, lưu giữ bản chép lời và mẫu triển khai an toàn.
</Note>

---

## Chọn provider

| Khóa       | Kiểu      | Mặc định               | Mô tả                                                                                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`             | ID adapter embedding như `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible`, hoặc `voyage`; cũng có thể là `models.providers.<id>` đã cấu hình có `api` trỏ tới adapter embedding bộ nhớ hoặc API mô hình tương thích OpenAI |
| `model`    | `string`  | mặc định của provider  | Tên mô hình embedding                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`               | ID adapter dự phòng khi adapter chính thất bại                                                                                                                                                                                                                                               |
| `enabled`  | `boolean` | `true`                 | Bật hoặc tắt tìm kiếm bộ nhớ                                                                                                                                                                                                                                                                 |

Khi không đặt `provider`, OpenClaw dùng embedding của OpenAI. Đặt `provider`
rõ ràng để dùng Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, mô hình GGUF cục bộ hoặc endpoint `/v1/embeddings` tương thích OpenAI.
Cấu hình cũ vẫn ghi `provider: "auto"` sẽ được phân giải thành `openai`.

<Warning>
Việc thay đổi provider embedding, mô hình, thiết lập provider, nguồn, phạm vi,
chia đoạn hoặc tokenizer có thể làm chỉ mục vector SQLite hiện có không tương thích.
OpenClaw tạm dừng tìm kiếm vector và báo cảnh báo danh tính chỉ mục thay vì
tự động embedding lại mọi thứ. Hãy xây dựng lại khi bạn sẵn sàng bằng
`openclaw memory status --index --agent <id>` hoặc
`openclaw memory index --force --agent <id>`.
</Warning>

Khi chưa đặt `provider`, có `provider: "auto"` cũ, hoặc
`provider: "none"` chủ ý chọn chế độ chỉ FTS, truy hồi bộ nhớ vẫn có thể
dùng xếp hạng FTS từ vựng khi embedding không khả dụng.

Các provider không cục bộ được chỉ định rõ ràng sẽ đóng khi lỗi. Nếu bạn đặt `memorySearch.provider` thành
một provider cụ thể dựa trên từ xa như OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio, hoặc provider tùy chỉnh
tương thích OpenAI, và provider đó không khả dụng lúc chạy, `memory_search`
trả về kết quả không khả dụng thay vì âm thầm dùng truy hồi chỉ FTS. Hãy sửa
cấu hình provider/xác thực, chuyển sang provider có thể truy cập, hoặc đặt
`provider: "none"` nếu bạn muốn truy hồi chỉ FTS có chủ ý.

### ID provider tùy chỉnh

`memorySearch.provider` có thể trỏ tới mục `models.providers.<id>` tùy chỉnh cho các adapter provider riêng cho bộ nhớ như `ollama`, hoặc cho API mô hình tương thích OpenAI như `openai-responses` / `openai-completions`. OpenClaw phân giải chủ sở hữu `api` của provider đó cho adapter embedding trong khi vẫn giữ id provider tùy chỉnh cho endpoint, xác thực và xử lý tiền tố mô hình. Điều này cho phép thiết lập nhiều GPU hoặc nhiều máy chủ dành riêng embedding bộ nhớ cho một endpoint cục bộ cụ thể:

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

| Provider       | Biến môi trường                                  | Khóa cấu hình                       |
| -------------- | ------------------------------------------------ | ----------------------------------- |
| Bedrock        | Chuỗi thông tin xác thực AWS                     | Không cần khóa API                  |
| DeepInfra      | `DEEPINFRA_API_KEY`                              | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Hồ sơ xác thực qua đăng nhập thiết bị |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (phần giữ chỗ)                  | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth chỉ bao phủ chat/completions và không đáp ứng yêu cầu embedding.
</Note>

---

## Cấu hình endpoint từ xa

Dùng `provider: "openai-compatible"` cho máy chủ `/v1/embeddings` tương thích OpenAI
chung không nên kế thừa thông tin xác thực chat OpenAI toàn cục.

<ParamField path="remote.baseUrl" type="string">
  URL cơ sở API tùy chỉnh.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Ghi đè khóa API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Header HTTP bổ sung (được hợp nhất với mặc định của provider).
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

## Cấu hình riêng theo provider

<AccordionGroup>
  <Accordion title="Gemini">
    | Khóa                   | Kiểu     | Mặc định              | Mô tả                                      |
    | ---------------------- | -------- | --------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Cũng hỗ trợ `gemini-embedding-2-preview`  |
    | `outputDimensionality` | `number` | `3072`                | Với Embedding 2: 768, 1536 hoặc 3072       |

    <Warning>
    Thay đổi mô hình hoặc `outputDimensionality` sẽ thay đổi danh tính chỉ mục. OpenClaw
    tạm dừng tìm kiếm vector cho đến khi bạn xây dựng lại chỉ mục bộ nhớ một cách rõ ràng.
    </Warning>

  </Accordion>
  <Accordion title="Kiểu đầu vào tương thích OpenAI">
    Các endpoint embedding tương thích OpenAI có thể chọn dùng trường yêu cầu `input_type` riêng theo provider. Điều này hữu ích cho các mô hình embedding bất đối xứng yêu cầu nhãn khác nhau cho embedding truy vấn và tài liệu.

    | Khóa                | Kiểu     | Mặc định  | Mô tả                                                  |
    | ------------------- | -------- | --------- | ------------------------------------------------------ |
    | `inputType`         | `string` | chưa đặt  | `input_type` dùng chung cho embedding truy vấn và tài liệu |
    | `queryInputType`    | `string` | chưa đặt  | `input_type` tại thời điểm truy vấn; ghi đè `inputType` |
    | `documentInputType` | `string` | chưa đặt  | `input_type` của chỉ mục/tài liệu; ghi đè `inputType`  |

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

    Việc thay đổi các giá trị này ảnh hưởng đến danh tính bộ nhớ đệm embedding cho lập chỉ mục theo lô của provider và nên được theo sau bằng việc lập chỉ mục lại bộ nhớ khi mô hình upstream xử lý các nhãn khác nhau.

  </Accordion>
  <Accordion title="Bedrock">
    ### Cấu hình embedding Bedrock

    Bedrock dùng chuỗi thông tin xác thực mặc định của AWS SDK — không cần khóa API. Nếu OpenClaw chạy trên EC2 với vai trò instance đã bật Bedrock, chỉ cần đặt provider và mô hình:

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

    | Khóa                   | Kiểu     | Mặc định                      | Mô tả                           |
    | ---------------------- | -------- | ----------------------------- | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Bất kỳ ID mô hình embedding Bedrock nào |
    | `outputDimensionality` | `number` | mặc định của mô hình          | Với Titan V2: 256, 512 hoặc 1024 |

    **Mô hình được hỗ trợ** (với phát hiện họ và mặc định kích thước):

    | ID mô hình                                 | Nhà cung cấp | Số chiều mặc định | Số chiều có thể cấu hình |
    | ------------------------------------------ | ------------ | ----------------- | ------------------------ |
    | `amazon.titan-embed-text-v2:0`             | Amazon       | 1024              | 256, 512, 1024           |
    | `amazon.titan-embed-text-v1`               | Amazon       | 1536              | --                       |
    | `amazon.titan-embed-g1-text-02`            | Amazon       | 1536              | --                       |
    | `amazon.titan-embed-image-v1`              | Amazon       | 1024              | --                       |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon       | 1024              | 256, 384, 1024, 3072     |
    | `cohere.embed-english-v3`                  | Cohere       | 1024              | --                       |
    | `cohere.embed-multilingual-v3`             | Cohere       | 1024              | --                       |
    | `cohere.embed-v4:0`                        | Cohere       | 1536              | 256-1536                 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs   | 512               | --                       |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs   | 1024              | --                       |

    Các biến thể có hậu tố thông lượng (ví dụ: `amazon.titan-embed-text-v1:2:8k`) kế thừa cấu hình của mô hình cơ sở.

    **Xác thực:** xác thực Bedrock dùng thứ tự phân giải thông tin xác thực tiêu chuẩn của AWS SDK:

    1. Biến môi trường (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Bộ nhớ đệm token SSO
    3. Thông tin xác thực bằng token danh tính web
    4. Tệp thông tin xác thực và cấu hình dùng chung
    5. Thông tin xác thực metadata ECS hoặc EC2

    Vùng được phân giải từ `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` của provider `amazon-bedrock`, hoặc mặc định là `us-east-1`.

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
  <Accordion title="Cục bộ (GGUF + llama.cpp)">
    | Khóa                  | Kiểu               | Mặc định              | Mô tả                                                                                                                                                                                                                                                                                                                                                |
    | --------------------- | ------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | tự động tải xuống     | Đường dẫn đến tệp mô hình GGUF                                                                                                                                                                                                                                                                                                                       |
    | `local.modelCacheDir` | `string`           | mặc định node-llama-cpp | Thư mục bộ nhớ đệm cho các mô hình đã tải xuống                                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                | Kích thước cửa sổ ngữ cảnh cho ngữ cảnh embedding. 4096 bao phủ các đoạn điển hình (128–512 token) trong khi giới hạn VRAM không phải trọng số. Giảm xuống 1024–2048 trên các máy chủ bị hạn chế. `"auto"` dùng mức tối đa đã huấn luyện của mô hình — không khuyến nghị cho mô hình 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM so với ~8.8 GB ở 4096). |

    Cài đặt provider llama.cpp chính thức trước: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Mô hình mặc định: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, tự động tải xuống). Các checkout mã nguồn vẫn yêu cầu phê duyệt bản dựng native: `pnpm approve-builds` rồi `pnpm rebuild node-llama-cpp`.

    Dùng CLI độc lập để xác minh cùng đường dẫn provider mà Gateway sử dụng:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Đặt `provider: "local"` một cách rõ ràng cho embeddings GGUF cục bộ. Tham chiếu mô hình `hf:` và HTTP(S) được hỗ trợ cho cấu hình cục bộ rõ ràng, nhưng chúng không thay đổi nhà cung cấp mặc định.

  </Accordion>
</AccordionGroup>

### Thời gian chờ embedding nội tuyến

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Ghi đè thời gian chờ cho các lô embedding nội tuyến trong quá trình lập chỉ mục bộ nhớ.

Nếu không đặt, hệ thống dùng mặc định của nhà cung cấp: 600 giây cho các nhà cung cấp cục bộ/tự lưu trữ như `local`, `ollama` và `lmstudio`, và 120 giây cho các nhà cung cấp được lưu trữ. Tăng giá trị này khi các lô embedding chạy bằng CPU cục bộ vẫn hoạt động tốt nhưng chậm.
</ParamField>

---

## Cấu hình tìm kiếm lai

Tất cả nằm dưới `memorySearch.query.hybrid`:

| Khóa                  | Kiểu      | Mặc định | Mô tả                              |
| --------------------- | --------- | -------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`   | Bật tìm kiếm lai BM25 + vector     |
| `vectorWeight`        | `number`  | `0.7`    | Trọng số cho điểm vector (0-1)     |
| `textWeight`          | `number`  | `0.3`    | Trọng số cho điểm BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`      | Hệ số nhân kích thước nhóm ứng viên |

<Tabs>
  <Tab title="MMR (diversity)">
    | Khóa          | Kiểu      | Mặc định | Mô tả                                   |
    | ------------- | --------- | -------- | --------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`  | Bật sắp xếp lại bằng MMR                |
    | `mmr.lambda`  | `number`  | `0.7`    | 0 = đa dạng tối đa, 1 = liên quan tối đa |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | Khóa                         | Kiểu      | Mặc định | Mô tả                              |
    | ---------------------------- | --------- | -------- | ---------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`  | Bật tăng cường theo độ mới         |
    | `temporalDecay.halfLifeDays` | `number`  | `30`     | Điểm giảm một nửa sau mỗi N ngày   |

    Các tệp luôn có giá trị (`MEMORY.md`, các tệp không có ngày trong `memory/`) không bao giờ bị suy giảm.

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

| Khóa         | Kiểu       | Mô tả                                          |
| ------------ | ---------- | ---------------------------------------------- |
| `extraPaths` | `string[]` | Thư mục hoặc tệp bổ sung để lập chỉ mục        |

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

Đường dẫn có thể là tuyệt đối hoặc tương đối với workspace. Các thư mục được quét đệ quy để tìm tệp `.md`. Cách xử lý symlink phụ thuộc vào backend đang hoạt động: công cụ tích hợp bỏ qua symlink, trong khi QMD tuân theo hành vi của bộ quét QMD bên dưới.

Để tìm kiếm transcript liên agent trong phạm vi agent, hãy dùng `agents.list[].memorySearch.qmd.extraCollections` thay vì `memory.qmd.paths`. Những collection bổ sung đó dùng cùng dạng `{ path, name, pattern? }`, nhưng được hợp nhất theo từng agent và có thể giữ tên chia sẻ tường minh khi đường dẫn trỏ ra ngoài workspace hiện tại. Nếu cùng một đường dẫn đã phân giải xuất hiện trong cả `memory.qmd.paths` và `memorySearch.qmd.extraCollections`, QMD giữ mục đầu tiên và bỏ qua bản trùng lặp.

---

## Bộ nhớ đa phương thức (Gemini)

Lập chỉ mục hình ảnh và âm thanh cùng với Markdown bằng Gemini Embedding 2:

| Khóa                      | Kiểu       | Mặc định   | Mô tả                                  |
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

| Khóa               | Kiểu      | Mặc định | Mô tả                                      |
| ------------------ | --------- | ------- | ------------------------------------------ |
| `cache.enabled`    | `boolean` | `true`  | Lưu embedding của chunk vào SQLite         |
| `cache.maxEntries` | `number`  | `50000` | Số embedding được lưu đệm tối đa           |

Ngăn việc tạo lại embedding cho văn bản không đổi trong khi lập chỉ mục lại hoặc cập nhật transcript.

---

## Lập chỉ mục theo lô

| Khóa                          | Kiểu      | Mặc định | Mô tả                             |
| ----------------------------- | --------- | ------- | --------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | Embedding nội tuyến song song     |
| `remote.batch.enabled`        | `boolean` | `false` | Bật API embedding theo lô         |
| `remote.batch.concurrency`    | `number`  | `2`     | Tác vụ theo lô song song          |
| `remote.batch.wait`           | `boolean` | `true`  | Chờ lô hoàn tất                   |
| `remote.batch.pollIntervalMs` | `number`  | --      | Khoảng thời gian thăm dò          |
| `remote.batch.timeoutMinutes` | `number`  | --      | Thời gian chờ tối đa của lô       |

Có sẵn cho `openai`, `gemini` và `voyage`. Lô OpenAI thường nhanh nhất và rẻ nhất cho các lần backfill lớn.

`remote.nonBatchConcurrency` kiểm soát các lệnh gọi embedding nội tuyến do provider cục bộ/tự host và provider được host sử dụng khi API theo lô của provider không hoạt động. Ollama mặc định là `1` cho lập chỉ mục không theo lô để tránh làm quá tải các máy cục bộ nhỏ hơn; đặt giá trị cao hơn trên các máy lớn hơn.

Thiết lập này tách biệt với `sync.embeddingBatchTimeoutSeconds`, vốn kiểm soát thời gian chờ tối đa cho các lệnh gọi embedding nội tuyến.

---

## Tìm kiếm bộ nhớ phiên (thử nghiệm)

Lập chỉ mục transcript phiên và hiển thị chúng qua `memory_search`:

| Khóa                          | Kiểu       | Mặc định     | Mô tả                                       |
| ----------------------------- | ---------- | ------------ | ------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Bật lập chỉ mục phiên                       |
| `sources`                     | `string[]` | `["memory"]` | Thêm `"sessions"` để bao gồm transcript     |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ngưỡng byte để lập chỉ mục lại              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ngưỡng tin nhắn để lập chỉ mục lại          |

<Warning>
Lập chỉ mục phiên là tùy chọn tham gia và chạy bất đồng bộ. Kết quả có thể hơi cũ. Nhật ký phiên nằm trên đĩa, vì vậy hãy xem quyền truy cập hệ thống tệp là ranh giới tin cậy.
</Warning>

Bản ghi phiên khớp cũng tuân theo
[`tools.sessions.visibility`](/vi/gateway/config-tools#toolssessions). Mặc định
khả năng hiển thị `tree` chỉ để lộ phiên hiện tại và các phiên do phiên đó sinh ra. Để
gọi lại một phiên không liên quan của cùng một agent do Gateway điều phối từ một
phiên khác, chẳng hạn như DM, hãy chủ đích mở rộng khả năng hiển thị thành `agent` (hoặc `all` chỉ
khi cũng cần gọi lại giữa các agent và chính sách agent-với-agent cho phép).

Các ví dụ bên dưới đặt những thiết lập này trong `agents.defaults`. Bạn cũng có thể
áp dụng các thiết lập `memorySearch` tương đương trong phần ghi đè theo từng agent khi chỉ một
agent cần lập chỉ mục và tìm kiếm bản ghi phiên.

Để gọi lại từ gateway sang DM cùng agent:

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

Khi dùng QMD, `agents.defaults.memorySearch.experimental.sessionMemory` và
`sources: ["sessions"]` tự chúng không xuất bản ghi vào QMD. Đồng thời hãy đặt
`memory.qmd.sessions.enabled: true`.

---

## Tăng tốc vector SQLite (sqlite-vec)

| Khóa                         | Kiểu      | Mặc định | Mô tả                                  |
| ---------------------------- | --------- | -------- | -------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`   | Dùng sqlite-vec cho truy vấn vector    |
| `store.vector.extensionPath` | `string`  | bundled  | Ghi đè đường dẫn sqlite-vec            |

Khi sqlite-vec không khả dụng, OpenClaw tự động chuyển về tính độ tương đồng cosin trong tiến trình.

---

## Lưu trữ chỉ mục

Các chỉ mục bộ nhớ tích hợp nằm trong cơ sở dữ liệu SQLite OpenClaw của từng agent tại
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Khóa                  | Kiểu     | Mặc định    | Mô tả                                      |
| --------------------- | -------- | ----------- | ------------------------------------------ |
| `store.fts.tokenizer` | `string` | `unicode61` | Bộ tách token FTS5 (`unicode61` hoặc `trigram`) |

---

## Cấu hình backend QMD

Đặt `memory.backend = "qmd"` để bật. Tất cả thiết lập QMD nằm trong `memory.qmd`:

| Khóa                     | Kiểu      | Mặc định | Mô tả                                                                                     |
| ------------------------ | --------- | -------- | ----------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Đường dẫn tệp thực thi QMD; đặt đường dẫn tuyệt đối khi `PATH` của dịch vụ khác với shell của bạn |
| `searchMode`             | `string`  | `search` | Lệnh tìm kiếm: `search`, `vsearch`, `query`                                                |
| `rerank`                 | `boolean` | --       | Đặt thành `false` với `searchMode: "query"` và QMD 2.1+ để bỏ qua việc QMD rerank          |
| `includeDefaultMemory`   | `boolean` | `true`   | Tự động lập chỉ mục `MEMORY.md` + `memory/**/*.md`                                        |
| `paths[]`                | `array`   | --       | Đường dẫn bổ sung: `{ name, path, pattern? }`                                              |
| `sessions.enabled`       | `boolean` | `false`  | Xuất bản ghi phiên vào QMD                                                                |
| `sessions.retentionDays` | `number`  | --       | Thời gian lưu giữ bản ghi                                                                 |
| `sessions.exportDir`     | `string`  | --       | Thư mục xuất                                                                               |

`searchMode: "search"` chỉ là lexical/BM25. OpenClaw không chạy các bước kiểm tra mức sẵn sàng vector ngữ nghĩa hoặc bảo trì embedding QMD cho chế độ đó, kể cả trong `memory status --deep`; `vsearch` và `query` tiếp tục yêu cầu QMD sẵn sàng vector và có embedding.

`rerank: false` chỉ thay đổi chế độ `query` của QMD và yêu cầu QMD 2.1 trở lên. Ở chế độ CLI trực tiếp, OpenClaw truyền `--no-rerank`; ở chế độ MCP dựa trên mcporter, OpenClaw truyền `rerank: false` cho công cụ truy vấn hợp nhất của QMD. Để trống để dùng hành vi reranking truy vấn mặc định của QMD.

OpenClaw ưu tiên các dạng collection và truy vấn MCP hiện tại của QMD, nhưng vẫn giữ các bản phát hành QMD cũ hoạt động bằng cách thử các cờ mẫu collection tương thích và tên công cụ MCP cũ hơn khi cần. Khi QMD thông báo hỗ trợ nhiều bộ lọc collection, các collection cùng nguồn được tìm kiếm bằng một tiến trình QMD; các bản dựng QMD cũ hơn giữ đường dẫn tương thích theo từng collection. Cùng nguồn nghĩa là các collection bộ nhớ bền vững được nhóm lại với nhau, còn các collection bản ghi phiên vẫn là một nhóm riêng để việc đa dạng hóa nguồn vẫn có cả hai đầu vào.

<Note>
Các phần ghi đè mô hình QMD nằm phía QMD, không nằm trong cấu hình OpenClaw. Nếu cần ghi đè mô hình của QMD trên toàn cục, hãy đặt các biến môi trường như `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` và `QMD_GENERATE_MODEL` trong môi trường chạy Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Update schedule">
    | Khóa                      | Kiểu      | Mặc định | Mô tả                                  |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Khoảng thời gian làm mới              |
    | `update.debounceMs`       | `number`  | `15000` | Chống dội các thay đổi tệp            |
    | `update.onBoot`           | `boolean` | `true`  | Làm mới khi trình quản lý QMD tồn tại lâu dài mở; đặt false để bỏ qua cập nhật khởi động ngay lập tức |
    | `update.startup`          | `string`  | `off`   | Khởi tạo QMD tùy chọn khi Gateway khởi động: `off`, `idle`, hoặc `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Độ trễ trước khi chạy làm mới `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | Chặn việc mở trình quản lý cho đến khi lần làm mới ban đầu hoàn tất |
    | `update.embedInterval`    | `string`  | --      | Nhịp embed riêng                      |
    | `update.commandTimeoutMs` | `number`  | --      | Thời gian chờ cho các lệnh QMD        |
    | `update.updateTimeoutMs`  | `number`  | --      | Thời gian chờ cho các thao tác cập nhật QMD |
    | `update.embedTimeoutMs`   | `number`  | --      | Thời gian chờ cho các thao tác embed QMD |
  </Accordion>
  <Accordion title="Limits">
    | Khóa                      | Kiểu     | Mặc định | Mô tả                       |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Số kết quả tìm kiếm tối đa |
    | `limits.maxSnippetChars`  | `number` | --      | Giới hạn độ dài đoạn trích |
    | `limits.maxInjectedChars` | `number` | --      | Giới hạn tổng số ký tự được chèn |
    | `limits.timeoutMs`        | `number` | `4000`  | Thời gian chờ tìm kiếm     |
  </Accordion>
  <Accordion title="Scope">
    Kiểm soát những phiên nào có thể nhận kết quả tìm kiếm QMD. Cùng schema như [`session.sendPolicy`](/vi/gateway/config-agents#session):

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

    Mặc định được phát hành cho phép các phiên trực tiếp và kênh, trong khi vẫn từ chối nhóm.

    Mặc định là chỉ DM. `match.keyPrefix` khớp với khóa phiên đã chuẩn hóa; `match.rawKeyPrefix` khớp với khóa thô bao gồm `agent:<id>:`.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations` áp dụng cho mọi backend:

    | Giá trị          | Hành vi                                             |
    | ---------------- | --------------------------------------------------- |
    | `auto` (mặc định) | Bao gồm footer `Source: <path#line>` trong các đoạn trích |
    | `on`             | Luôn bao gồm footer                                 |
    | `off`            | Bỏ qua footer (đường dẫn vẫn được truyền nội bộ cho agent) |

  </Accordion>
</AccordionGroup>

Khi bật khởi tạo QMD lúc Gateway khởi động, OpenClaw chỉ khởi động QMD cho các agent đủ điều kiện. Nếu `update.onBoot` là true và không có bảo trì interval/embed nào được cấu hình, quá trình khởi động dùng một trình quản lý dùng một lần cho lần làm mới khởi động rồi đóng nó. Nếu cấu hình interval cập nhật hoặc embed, quá trình khởi động mở trình quản lý QMD tồn tại lâu dài để nó có thể sở hữu watcher và bộ hẹn giờ interval; `update.onBoot: false` chỉ bỏ qua lần làm mới khởi động ngay lập tức.

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

Dreaming chạy như một lần quét theo lịch và dùng các pha light/deep/REM nội bộ như một chi tiết triển khai.

Để biết hành vi khái niệm và các lệnh slash, xem [Dreaming](/vi/concepts/dreaming).

### Cài đặt người dùng

| Khóa                                   | Kiểu      | Mặc định      | Mô tả                                                                                                                           |
| -------------------------------------- | --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Bật hoặc tắt hoàn toàn dreaming                                                                                                 |
| `frequency`                            | `string`  | `0 3 * * *`   | Nhịp Cron tùy chọn cho toàn bộ lần quét dreaming                                                                                |
| `model`                                | `string`  | model mặc định | Ghi đè model subagent Dream Diary tùy chọn                                                                                      |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | Số token ước tính tối đa được giữ từ mỗi đoạn trích hồi tưởng ngắn hạn được đưa vào `MEMORY.md`; siêu dữ liệu nguồn gốc vẫn hiển thị |

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
- `dreaming.model` dùng cổng tin cậy subagent Plugin hiện có; đặt `plugins.entries.memory-core.subagent.allowModelOverride: true` trước khi bật.
- Dream Diary thử lại một lần với model mặc định của phiên khi model đã cấu hình không khả dụng. Lỗi tin cậy hoặc allowlist được ghi log và không được âm thầm thử lại.
- Chính sách và ngưỡng pha light/deep/REM là hành vi nội bộ, không phải cấu hình hướng tới người dùng.

</Note>

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
