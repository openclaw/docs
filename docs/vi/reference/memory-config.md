---
read_when:
    - Bạn muốn cấu hình các nhà cung cấp tìm kiếm bộ nhớ hoặc các mô hình nhúng
    - Bạn muốn thiết lập backend QMD
    - Bạn muốn tinh chỉnh tìm kiếm kết hợp, MMR hoặc suy giảm theo thời gian
    - Bạn muốn bật tính năng lập chỉ mục bộ nhớ đa phương thức
sidebarTitle: Memory config
summary: Tất cả các tùy chọn cấu hình cho tìm kiếm bộ nhớ, nhà cung cấp embedding, QMD, tìm kiếm lai và lập chỉ mục đa phương thức
title: Tham chiếu cấu hình bộ nhớ
x-i18n:
    generated_at: "2026-04-29T23:11:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

Trang này liệt kê mọi núm cấu hình cho tìm kiếm bộ nhớ OpenClaw. Để xem tổng quan khái niệm, hãy xem:

<CardGroup cols={2}>
  <Card title="Memory overview" href="/vi/concepts/memory">
    Cách bộ nhớ hoạt động.
  </Card>
  <Card title="Builtin engine" href="/vi/concepts/memory-builtin">
    Backend SQLite mặc định.
  </Card>
  <Card title="QMD engine" href="/vi/concepts/memory-qmd">
    Sidecar ưu tiên cục bộ.
  </Card>
  <Card title="Memory search" href="/vi/concepts/memory-search">
    Quy trình tìm kiếm và tinh chỉnh.
  </Card>
  <Card title="Active memory" href="/vi/concepts/active-memory">
    Tác nhân phụ bộ nhớ cho các phiên tương tác.
  </Card>
</CardGroup>

Tất cả cài đặt tìm kiếm bộ nhớ nằm dưới `agents.defaults.memorySearch` trong `openclaw.json` trừ khi có ghi chú khác.

<Note>
Nếu bạn đang tìm công tắc tính năng **Active Memory** và cấu hình tác nhân phụ, phần đó nằm dưới `plugins.entries.active-memory` thay vì `memorySearch`.

Active Memory dùng mô hình hai cổng:

1. plugin phải được bật và nhắm đến id tác nhân hiện tại
2. yêu cầu phải là một phiên trò chuyện liên tục tương tác đủ điều kiện

Xem [Active Memory](/vi/concepts/active-memory) để biết mô hình kích hoạt, cấu hình do plugin sở hữu, lưu bền bản ghi hội thoại và mẫu triển khai an toàn.
</Note>

---

## Chọn nhà cung cấp

| Khóa       | Kiểu      | Mặc định           | Mô tả                                                                                                                                                                                                                              |
| ---------- | --------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | tự động phát hiện  | ID bộ chuyển đổi embedding như `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` hoặc `voyage`; cũng có thể là một `models.providers.<id>` đã cấu hình có `api` trỏ đến một trong các bộ chuyển đổi đó |
| `model`    | `string`  | mặc định nhà cung cấp | Tên mô hình embedding                                                                                                                                                                                                              |
| `fallback` | `string`  | `"none"`           | ID bộ chuyển đổi dự phòng khi bộ chính thất bại                                                                                                                                                                                    |
| `enabled`  | `boolean` | `true`             | Bật hoặc tắt tìm kiếm bộ nhớ                                                                                                                                                                                                       |

### Thứ tự tự động phát hiện

Khi chưa đặt `provider`, OpenClaw chọn tùy chọn khả dụng đầu tiên:

<Steps>
  <Step title="local">
    Được chọn nếu `memorySearch.local.modelPath` được cấu hình và tệp tồn tại.
  </Step>
  <Step title="github-copilot">
    Được chọn nếu có thể phân giải token GitHub Copilot (biến env hoặc hồ sơ xác thực).
  </Step>
  <Step title="openai">
    Được chọn nếu có thể phân giải khóa OpenAI.
  </Step>
  <Step title="gemini">
    Được chọn nếu có thể phân giải khóa Gemini.
  </Step>
  <Step title="voyage">
    Được chọn nếu có thể phân giải khóa Voyage.
  </Step>
  <Step title="mistral">
    Được chọn nếu có thể phân giải khóa Mistral.
  </Step>
  <Step title="deepinfra">
    Được chọn nếu có thể phân giải khóa DeepInfra.
  </Step>
  <Step title="bedrock">
    Được chọn nếu chuỗi thông tin xác thực AWS SDK phân giải được (vai trò instance, khóa truy cập, hồ sơ, SSO, web identity hoặc cấu hình dùng chung).
  </Step>
</Steps>

`ollama` được hỗ trợ nhưng không được tự động phát hiện (hãy đặt rõ ràng).

### ID nhà cung cấp tùy chỉnh

`memorySearch.provider` có thể trỏ đến một mục `models.providers.<id>` tùy chỉnh. OpenClaw phân giải chủ sở hữu `api` của nhà cung cấp đó cho bộ chuyển đổi embedding trong khi vẫn giữ ID nhà cung cấp tùy chỉnh để xử lý endpoint, xác thực và tiền tố mô hình. Điều này cho phép các thiết lập nhiều GPU hoặc nhiều máy chủ dành riêng embedding bộ nhớ cho một endpoint cục bộ cụ thể:

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

Embedding từ xa yêu cầu khóa API. Thay vào đó Bedrock dùng chuỗi thông tin xác thực mặc định của AWS SDK (vai trò instance, SSO, khóa truy cập).

| Nhà cung cấp | Biến env                                           | Khóa cấu hình                       |
| ------------ | -------------------------------------------------- | ----------------------------------- |
| Bedrock      | Chuỗi thông tin xác thực AWS                       | Không cần khóa API                  |
| DeepInfra    | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini       | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Hồ sơ xác thực qua đăng nhập thiết bị |
| Mistral      | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama       | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI       | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage       | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth chỉ bao phủ chat/completions và không đáp ứng các yêu cầu embedding.
</Note>

---

## Cấu hình endpoint từ xa

Cho các endpoint tương thích OpenAI tùy chỉnh hoặc để ghi đè mặc định của nhà cung cấp:

<ParamField path="remote.baseUrl" type="string">
  URL gốc API tùy chỉnh.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Ghi đè khóa API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Header HTTP bổ sung (được hợp nhất với mặc định của nhà cung cấp).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
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

## Cấu hình theo nhà cung cấp

<AccordionGroup>
  <Accordion title="Gemini">
    | Khóa                   | Kiểu     | Mặc định               | Mô tả                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Cũng hỗ trợ `gemini-embedding-2-preview`   |
    | `outputDimensionality` | `number` | `3072`                 | Với Embedding 2: 768, 1536 hoặc 3072       |

    <Warning>
    Việc thay đổi mô hình hoặc `outputDimensionality` kích hoạt lập chỉ mục lại toàn bộ tự động.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    Các endpoint embedding tương thích OpenAI có thể chọn dùng các trường yêu cầu `input_type` theo nhà cung cấp. Điều này hữu ích cho các mô hình embedding bất đối xứng yêu cầu nhãn khác nhau cho embedding truy vấn và tài liệu.

    | Khóa                | Kiểu     | Mặc định     | Mô tả                                                       |
    | ------------------- | -------- | ------------ | ----------------------------------------------------------- |
    | `inputType`         | `string` | chưa đặt     | `input_type` dùng chung cho embedding truy vấn và tài liệu  |
    | `queryInputType`    | `string` | chưa đặt     | `input_type` tại thời điểm truy vấn; ghi đè `inputType`     |
    | `documentInputType` | `string` | chưa đặt     | `input_type` lập chỉ mục/tài liệu; ghi đè `inputType`       |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Việc thay đổi các giá trị này ảnh hưởng đến định danh cache embedding cho lập chỉ mục theo lô của nhà cung cấp và nên được theo sau bằng việc lập chỉ mục lại bộ nhớ khi mô hình upstream xử lý các nhãn khác nhau.

  </Accordion>
  <Accordion title="Bedrock">
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

    | Khóa                   | Kiểu     | Mặc định                       | Mô tả                           |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Bất kỳ ID mô hình embedding Bedrock nào |
    | `outputDimensionality` | `number` | mặc định mô hình               | Với Titan V2: 256, 512 hoặc 1024 |

    **Mô hình được hỗ trợ** (kèm phát hiện dòng và mặc định số chiều):

    | ID mô hình                                  | Nhà cung cấp | Số chiều mặc định | Số chiều có thể cấu hình |
    | ------------------------------------------- | ------------ | ----------------- | ------------------------ |
    | `amazon.titan-embed-text-v2:0`              | Amazon       | 1024              | 256, 512, 1024           |
    | `amazon.titan-embed-text-v1`                | Amazon       | 1536              | --                       |
    | `amazon.titan-embed-g1-text-02`             | Amazon       | 1536              | --                       |
    | `amazon.titan-embed-image-v1`               | Amazon       | 1024              | --                       |
    | `amazon.nova-2-multimodal-embeddings-v1:0`  | Amazon       | 1024              | 256, 384, 1024, 3072     |
    | `cohere.embed-english-v3`                   | Cohere       | 1024              | --                       |
    | `cohere.embed-multilingual-v3`              | Cohere       | 1024              | --                       |
    | `cohere.embed-v4:0`                         | Cohere       | 1536              | 256-1536                 |
    | `twelvelabs.marengo-embed-3-0-v1:0`         | TwelveLabs   | 512               | --                       |
    | `twelvelabs.marengo-embed-2-7-v1:0`         | TwelveLabs   | 1024              | --                       |

    Các biến thể có hậu tố thông lượng (ví dụ: `amazon.titan-embed-text-v1:2:8k`) kế thừa cấu hình của mô hình cơ sở.

    **Xác thực:** xác thực Bedrock dùng thứ tự phân giải thông tin xác thực AWS SDK tiêu chuẩn:

    1. Biến môi trường (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache token SSO
    3. Thông tin xác thực token web identity
    4. Tệp thông tin xác thực và cấu hình dùng chung
    5. Thông tin xác thực metadata ECS hoặc EC2

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
  <Accordion title="Cục bộ (GGUF + node-llama-cpp)">
    | Khóa                  | Kiểu               | Mặc định               | Mô tả                                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | tự động tải xuống      | Đường dẫn đến tệp mô hình GGUF                                                                                                                                                                                                                                                                                                       |
    | `local.modelCacheDir` | `string`           | mặc định node-llama-cpp | Thư mục bộ nhớ đệm cho các mô hình đã tải xuống                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Kích thước cửa sổ ngữ cảnh cho ngữ cảnh embedding. 4096 bao phủ các đoạn điển hình (128–512 token) đồng thời giới hạn VRAM ngoài trọng số. Giảm xuống 1024–2048 trên các máy chủ hạn chế tài nguyên. `"auto"` dùng mức tối đa đã huấn luyện của mô hình — không khuyến nghị cho các mô hình 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM so với ~8.8 GB ở 4096). |

    Mô hình mặc định: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, tự động tải xuống). Yêu cầu bản dựng native: `pnpm approve-builds` rồi `pnpm rebuild node-llama-cpp`.

    Dùng CLI độc lập để xác minh cùng đường dẫn provider mà Gateway sử dụng:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Nếu `provider` là `auto`, `local` chỉ được chọn khi `local.modelPath` trỏ đến một tệp cục bộ hiện có. Các tham chiếu mô hình `hf:` và HTTP(S) vẫn có thể được dùng rõ ràng với `provider: "local"`, nhưng chúng không khiến `auto` chọn cục bộ trước khi mô hình có sẵn trên đĩa.

  </Accordion>
</AccordionGroup>

### Thời gian chờ embedding nội tuyến

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Ghi đè thời gian chờ cho các lô embedding nội tuyến trong quá trình lập chỉ mục bộ nhớ.

Khi chưa đặt, dùng mặc định của provider: 600 giây cho provider cục bộ/tự lưu trữ như `local`, `ollama`, và `lmstudio`, và 120 giây cho provider được lưu trữ. Tăng giá trị này khi các lô embedding phụ thuộc CPU cục bộ vẫn khỏe mạnh nhưng chậm.
</ParamField>

---

## Cấu hình tìm kiếm kết hợp

Tất cả nằm dưới `memorySearch.query.hybrid`:

| Khóa                  | Kiểu      | Mặc định | Mô tả                                  |
| --------------------- | --------- | ------- | -------------------------------------- |
| `enabled`             | `boolean` | `true`  | Bật tìm kiếm kết hợp BM25 + vector     |
| `vectorWeight`        | `number`  | `0.7`   | Trọng số cho điểm vector (0-1)         |
| `textWeight`          | `number`  | `0.3`   | Trọng số cho điểm BM25 (0-1)           |
| `candidateMultiplier` | `number`  | `4`     | Hệ số nhân kích thước nhóm ứng viên    |

<Tabs>
  <Tab title="MMR (đa dạng)">
    | Khóa          | Kiểu      | Mặc định | Mô tả                                     |
    | ------------- | --------- | ------- | ----------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | Bật xếp hạng lại bằng MMR                 |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = đa dạng tối đa, 1 = liên quan tối đa  |
  </Tab>
  <Tab title="Suy giảm theo thời gian (độ mới)">
    | Khóa                         | Kiểu      | Mặc định | Mô tả                         |
    | ---------------------------- | --------- | ------- | ----------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | Bật tăng cường theo độ mới    |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | Điểm giảm một nửa sau mỗi N ngày |

    Các tệp thường trực (`MEMORY.md`, các tệp không có ngày trong `memory/`) không bao giờ bị suy giảm.

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

| Khóa         | Kiểu       | Mô tả                                         |
| ------------ | ---------- | --------------------------------------------- |
| `extraPaths` | `string[]` | Các thư mục hoặc tệp bổ sung để lập chỉ mục   |

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

Đường dẫn có thể là tuyệt đối hoặc tương đối với workspace. Các thư mục được quét đệ quy để tìm tệp `.md`. Cách xử lý symlink phụ thuộc vào backend đang hoạt động: engine tích hợp bỏ qua symlink, trong khi QMD tuân theo hành vi của trình quét QMD bên dưới.

Để tìm kiếm transcript xuyên agent theo phạm vi agent, dùng `agents.list[].memorySearch.qmd.extraCollections` thay vì `memory.qmd.paths`. Các bộ sưu tập bổ sung đó tuân theo cùng dạng `{ path, name, pattern? }`, nhưng chúng được hợp nhất theo từng agent và có thể giữ các tên chia sẻ rõ ràng khi đường dẫn trỏ ra ngoài workspace hiện tại. Nếu cùng một đường dẫn đã phân giải xuất hiện trong cả `memory.qmd.paths` và `memorySearch.qmd.extraCollections`, QMD giữ mục đầu tiên và bỏ qua bản trùng lặp.

---

## Bộ nhớ đa phương thức (Gemini)

Lập chỉ mục hình ảnh và âm thanh cùng với Markdown bằng Gemini Embedding 2:

| Khóa                      | Kiểu       | Mặc định   | Mô tả                                |
| ------------------------- | ---------- | ---------- | ------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | Bật lập chỉ mục đa phương thức       |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]`, hoặc `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Kích thước tệp tối đa để lập chỉ mục |

<Note>
Chỉ áp dụng cho các tệp trong `extraPaths`. Các gốc bộ nhớ mặc định vẫn chỉ dùng Markdown. Yêu cầu `gemini-embedding-2-preview`. `fallback` phải là `"none"`.
</Note>

Định dạng được hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (hình ảnh); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (âm thanh).

---

## Bộ nhớ đệm vector nhúng

| Khóa               | Kiểu      | Mặc định | Mô tả                                           |
| ------------------ | --------- | -------- | ----------------------------------------------- |
| `cache.enabled`    | `boolean` | `false`  | Lưu vector nhúng của đoạn vào bộ nhớ đệm trong SQLite |
| `cache.maxEntries` | `number`  | `50000`  | Số vector nhúng được lưu đệm tối đa             |

Ngăn việc nhúng lại văn bản không thay đổi trong quá trình lập chỉ mục lại hoặc cập nhật bản ghi phiên.

---

## Lập chỉ mục theo lô

| Khóa                          | Kiểu      | Mặc định | Mô tả                         |
| ----------------------------- | --------- | -------- | ----------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`      | Nhúng nội tuyến song song     |
| `remote.batch.enabled`        | `boolean` | `false`  | Bật API nhúng theo lô         |
| `remote.batch.concurrency`    | `number`  | `2`      | Tác vụ theo lô song song      |
| `remote.batch.wait`           | `boolean` | `true`   | Chờ hoàn tất lô               |
| `remote.batch.pollIntervalMs` | `number`  | --       | Khoảng thời gian thăm dò      |
| `remote.batch.timeoutMinutes` | `number`  | --       | Thời gian chờ tối đa của lô   |

Khả dụng cho `openai`, `gemini` và `voyage`. Lô OpenAI thường nhanh nhất và rẻ nhất cho các lần bổ sung dữ liệu lớn.

`remote.nonBatchConcurrency` kiểm soát các lệnh gọi nhúng nội tuyến được dùng bởi nhà cung cấp cục bộ/tự lưu trữ và nhà cung cấp được lưu trữ khi API theo lô của nhà cung cấp không hoạt động. Ollama mặc định là `1` cho lập chỉ mục không theo lô để tránh làm quá tải các máy chủ cục bộ nhỏ hơn; đặt giá trị cao hơn trên các máy lớn hơn.

Thiết lập này tách biệt với `sync.embeddingBatchTimeoutSeconds`, vốn kiểm soát thời gian chờ cho các lệnh gọi nhúng nội tuyến.

---

## Tìm kiếm bộ nhớ phiên (thử nghiệm)

Lập chỉ mục bản ghi phiên và hiển thị chúng qua `memory_search`:

| Khóa                          | Kiểu       | Mặc định     | Mô tả                                      |
| ----------------------------- | ---------- | ------------ | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Bật lập chỉ mục phiên                      |
| `sources`                     | `string[]` | `["memory"]` | Thêm `"sessions"` để bao gồm bản ghi       |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ngưỡng byte để lập chỉ mục lại             |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ngưỡng tin nhắn để lập chỉ mục lại         |

<Warning>
Lập chỉ mục phiên là tùy chọn tham gia và chạy bất đồng bộ. Kết quả có thể hơi cũ. Nhật ký phiên nằm trên đĩa, vì vậy hãy xem quyền truy cập hệ thống tệp là ranh giới tin cậy.
</Warning>

---

## Tăng tốc vector SQLite (sqlite-vec)

| Khóa                         | Kiểu      | Mặc định | Mô tả                              |
| ---------------------------- | --------- | -------- | ---------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`   | Dùng sqlite-vec cho truy vấn vector |
| `store.vector.extensionPath` | `string`  | đi kèm   | Ghi đè đường dẫn sqlite-vec        |

Khi sqlite-vec không khả dụng, OpenClaw tự động chuyển sang độ tương đồng cosin trong tiến trình.

---

## Lưu trữ chỉ mục

| Khóa                  | Kiểu     | Mặc định                              | Mô tả                                         |
| --------------------- | -------- | ------------------------------------- | --------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Vị trí chỉ mục (hỗ trợ mã thông báo `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Bộ tách từ FTS5 (`unicode61` hoặc `trigram`)  |

---

## Cấu hình backend QMD

Đặt `memory.backend = "qmd"` để bật. Tất cả thiết lập QMD nằm dưới `memory.qmd`:

| Khóa                     | Kiểu      | Mặc định | Mô tả                                                                                 |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Đường dẫn tệp thực thi QMD; đặt đường dẫn tuyệt đối khi `PATH` của dịch vụ khác với shell của bạn |
| `searchMode`             | `string`  | `search` | Lệnh tìm kiếm: `search`, `vsearch`, `query`                                           |
| `includeDefaultMemory`   | `boolean` | `true`   | Tự động lập chỉ mục `MEMORY.md` + `memory/**/*.md`                                    |
| `paths[]`                | `array`   | --       | Đường dẫn bổ sung: `{ name, path, pattern? }`                                         |
| `sessions.enabled`       | `boolean` | `false`  | Lập chỉ mục bản ghi phiên                                                             |
| `sessions.retentionDays` | `number`  | --       | Thời gian lưu giữ bản ghi                                                             |
| `sessions.exportDir`     | `string`  | --       | Thư mục xuất                                                                          |

`searchMode: "search"` chỉ dùng lexical/BM25. OpenClaw không chạy các phép kiểm tra sẵn sàng vector ngữ nghĩa hoặc bảo trì embedding QMD cho chế độ đó, kể cả trong `memory status --deep`; `vsearch` và `query` vẫn tiếp tục yêu cầu trạng thái sẵn sàng vector QMD và embeddings.

OpenClaw ưu tiên collection QMD hiện tại và các dạng truy vấn MCP hiện tại, nhưng vẫn giữ khả năng hoạt động với các bản phát hành QMD cũ hơn bằng cách thử các cờ mẫu collection tương thích và tên công cụ MCP cũ hơn khi cần. Khi QMD thông báo hỗ trợ nhiều bộ lọc collection, các collection cùng nguồn được tìm kiếm bằng một tiến trình QMD; các bản dựng QMD cũ hơn giữ đường dẫn tương thích theo từng collection. Cùng nguồn nghĩa là các collection bộ nhớ bền vững được nhóm lại với nhau, còn các collection bản ghi phiên vẫn là một nhóm riêng để việc đa dạng hóa nguồn vẫn có cả hai đầu vào.

<Note>
Các ghi đè mô hình QMD nằm ở phía QMD, không phải cấu hình OpenClaw. Nếu bạn cần ghi đè các mô hình của QMD trên toàn cục, hãy đặt các biến môi trường như `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, và `QMD_GENERATE_MODEL` trong môi trường runtime Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Lịch cập nhật">
    | Khóa                      | Kiểu      | Mặc định | Mô tả                                  |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Khoảng thời gian làm mới              |
    | `update.debounceMs`       | `number`  | `15000` | Debounce thay đổi tệp                 |
    | `update.onBoot`           | `boolean` | `true`  | Làm mới khi trình quản lý QMD chạy dài hạn mở; cũng kiểm soát làm mới khi khởi động theo lựa chọn |
    | `update.startup`          | `string`  | `off`   | Làm mới tùy chọn khi Gateway khởi động: `off`, `idle`, hoặc `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Độ trễ trước khi chạy làm mới `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | Chặn việc mở trình quản lý cho đến khi lần làm mới ban đầu hoàn tất |
    | `update.embedInterval`    | `string`  | --      | Nhịp embedding riêng                  |
    | `update.commandTimeoutMs` | `number`  | --      | Thời gian chờ cho các lệnh QMD        |
    | `update.updateTimeoutMs`  | `number`  | --      | Thời gian chờ cho các thao tác cập nhật QMD |
    | `update.embedTimeoutMs`   | `number`  | --      | Thời gian chờ cho các thao tác embedding QMD |
  </Accordion>
  <Accordion title="Giới hạn">
    | Khóa                      | Kiểu     | Mặc định | Mô tả                         |
    | ------------------------- | -------- | ------- | ----------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Số kết quả tìm kiếm tối đa    |
    | `limits.maxSnippetChars`  | `number` | --      | Giới hạn độ dài đoạn trích    |
    | `limits.maxInjectedChars` | `number` | --      | Giới hạn tổng số ký tự được chèn |
    | `limits.timeoutMs`        | `number` | `4000`  | Thời gian chờ tìm kiếm        |
  </Accordion>
  <Accordion title="Phạm vi">
    Kiểm soát những phiên nào có thể nhận kết quả tìm kiếm QMD. Cùng schema với [`session.sendPolicy`](/vi/gateway/config-agents#session):

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

    Mặc định được phát hành cho phép các phiên trực tiếp và kênh, đồng thời vẫn từ chối nhóm.

    Mặc định chỉ dành cho DM. `match.keyPrefix` khớp với khóa phiên đã chuẩn hóa; `match.rawKeyPrefix` khớp với khóa thô bao gồm `agent:<id>:`.

  </Accordion>
  <Accordion title="Trích dẫn">
    `memory.citations` áp dụng cho tất cả backend:

    | Giá trị          | Hành vi                                             |
    | ---------------- | --------------------------------------------------- |
    | `auto` (mặc định) | Bao gồm footer `Source: <path#line>` trong đoạn trích |
    | `on`             | Luôn bao gồm footer                                 |
    | `off`            | Bỏ qua footer (đường dẫn vẫn được truyền nội bộ cho agent) |

  </Accordion>
</AccordionGroup>

Các lần làm mới khởi động QMD dùng đường dẫn tiến trình con chạy một lần trong lúc Gateway khởi động. Trình quản lý QMD chạy dài hạn vẫn sở hữu trình theo dõi tệp thông thường và các bộ hẹn giờ theo khoảng khi tìm kiếm bộ nhớ được mở để sử dụng tương tác.

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

Dreaming chạy như một lần quét đã lên lịch và sử dụng các pha light/deep/REM nội bộ như một chi tiết triển khai.

Để biết hành vi khái niệm và các lệnh slash, xem [Dreaming](/vi/concepts/dreaming).

### Cài đặt người dùng

| Khóa        | Kiểu      | Mặc định       | Mô tả                                            |
| ----------- | --------- | ------------- | ------------------------------------------------ |
| `enabled`   | `boolean` | `false`       | Bật hoặc tắt hoàn toàn dreaming                  |
| `frequency` | `string`  | `0 3 * * *`   | Nhịp Cron tùy chọn cho toàn bộ lần quét dreaming |
| `model`     | `string`  | mô hình mặc định | Ghi đè mô hình subagent Dream Diary tùy chọn     |

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
- Dreaming ghi đầu ra tường thuật mà con người đọc được vào `DREAMS.md` (hoặc `dreams.md` hiện có).
- `dreaming.model` sử dụng cổng tin cậy subagent hiện có của Plugin; đặt `plugins.entries.memory-core.subagent.allowModelOverride: true` trước khi bật.
- Dream Diary thử lại một lần với mô hình mặc định của phiên khi mô hình đã cấu hình không khả dụng. Các lỗi tin cậy hoặc danh sách cho phép được ghi log và không được âm thầm thử lại.
- Chính sách và ngưỡng pha light/deep/REM là hành vi nội bộ, không phải cấu hình hướng đến người dùng.

</Note>

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
