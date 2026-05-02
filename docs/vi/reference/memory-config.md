---
read_when:
    - Bạn muốn cấu hình các nhà cung cấp tìm kiếm bộ nhớ hoặc mô hình nhúng
    - Bạn muốn thiết lập phần phụ trợ QMD
    - Bạn muốn tinh chỉnh tìm kiếm lai, MMR hoặc độ suy giảm theo thời gian
    - Bạn muốn bật tính năng lập chỉ mục bộ nhớ đa phương thức
sidebarTitle: Memory config
summary: Tất cả các tùy chọn cấu hình cho tìm kiếm bộ nhớ, nhà cung cấp embedding, QMD, tìm kiếm lai và lập chỉ mục đa phương thức
title: Tài liệu tham chiếu cấu hình bộ nhớ
x-i18n:
    generated_at: "2026-05-02T10:52:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11c4723b536338a777ec45673ca3c1a8c26834d6875dd4eb96617a570a55c5f5
    source_path: reference/memory-config.md
    workflow: 16
---

Trang này liệt kê mọi tùy chọn cấu hình cho tìm kiếm bộ nhớ OpenClaw. Để xem phần tổng quan khái niệm, hãy xem:

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
    Quy trình tìm kiếm và tinh chỉnh.
  </Card>
  <Card title="Active memory" href="/vi/concepts/active-memory">
    Tác nhân phụ bộ nhớ cho các phiên tương tác.
  </Card>
</CardGroup>

Tất cả cài đặt tìm kiếm bộ nhớ nằm dưới `agents.defaults.memorySearch` trong `openclaw.json` trừ khi có ghi chú khác.

<Note>
Nếu bạn đang tìm công tắc bật/tắt tính năng **active memory** và cấu hình tác nhân phụ, phần đó nằm dưới `plugins.entries.active-memory` thay vì `memorySearch`.

Active memory sử dụng mô hình hai cổng:

1. Plugin phải được bật và nhắm đến id tác nhân hiện tại
2. Yêu cầu phải là một phiên trò chuyện tương tác liên tục đủ điều kiện

Xem [Active Memory](/vi/concepts/active-memory) để biết mô hình kích hoạt, cấu hình do plugin sở hữu, lưu giữ bản ghi hội thoại, và mẫu triển khai an toàn.
</Note>

---

## Chọn nhà cung cấp

| Khóa       | Kiểu      | Mặc định              | Mô tả                                                                                                                                                                                                                              |
| ---------- | --------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | tự động phát hiện     | ID bộ chuyển đổi embedding như `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, hoặc `voyage`; cũng có thể là một `models.providers.<id>` đã cấu hình có `api` trỏ đến một trong các bộ chuyển đổi đó |
| `model`    | `string`  | mặc định nhà cung cấp | Tên mô hình embedding                                                                                                                                                                                                              |
| `fallback` | `string`  | `"none"`              | ID bộ chuyển đổi dự phòng khi bộ chính thất bại                                                                                                                                                                                    |
| `enabled`  | `boolean` | `true`                | Bật hoặc tắt tìm kiếm bộ nhớ                                                                                                                                                                                                       |

### Thứ tự tự động phát hiện

Khi `provider` chưa được đặt, OpenClaw chọn mục khả dụng đầu tiên:

<Steps>
  <Step title="local">
    Được chọn nếu `memorySearch.local.modelPath` đã được cấu hình và tệp tồn tại.
  </Step>
  <Step title="github-copilot">
    Được chọn nếu có thể phân giải token GitHub Copilot (biến môi trường hoặc hồ sơ xác thực).
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
    Được chọn nếu chuỗi thông tin xác thực AWS SDK phân giải được (vai trò instance, khóa truy cập, hồ sơ, SSO, danh tính web, hoặc cấu hình dùng chung).
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

Embedding từ xa yêu cầu khóa API. Thay vào đó, Bedrock sử dụng chuỗi thông tin xác thực mặc định của AWS SDK (vai trò instance, SSO, khóa truy cập).

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
OAuth Codex chỉ áp dụng cho chat/completions và không đáp ứng các yêu cầu embedding.
</Note>

---

## Cấu hình endpoint từ xa

Dành cho các endpoint tương thích OpenAI tùy chỉnh hoặc ghi đè mặc định của nhà cung cấp:

<ParamField path="remote.baseUrl" type="string">
  URL cơ sở API tùy chỉnh.
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
    | `outputDimensionality` | `number` | `3072`                 | Với Embedding 2: 768, 1536, hoặc 3072      |

    <Warning>
    Việc thay đổi mô hình hoặc `outputDimensionality` sẽ kích hoạt tự động lập chỉ mục lại toàn bộ.
    </Warning>

  </Accordion>
  <Accordion title="Kiểu đầu vào tương thích OpenAI">
    Các endpoint embedding tương thích OpenAI có thể chọn dùng các trường yêu cầu `input_type` dành riêng cho nhà cung cấp. Điều này hữu ích cho các mô hình embedding bất đối xứng yêu cầu nhãn khác nhau cho embedding truy vấn và tài liệu.

    | Khóa                | Kiểu     | Mặc định | Mô tả                                                     |
    | ------------------- | -------- | -------- | --------------------------------------------------------- |
    | `inputType`         | `string` | chưa đặt | `input_type` dùng chung cho embedding truy vấn và tài liệu |
    | `queryInputType`    | `string` | chưa đặt | `input_type` tại thời điểm truy vấn; ghi đè `inputType`    |
    | `documentInputType` | `string` | chưa đặt | `input_type` chỉ mục/tài liệu; ghi đè `inputType`          |

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

    Việc thay đổi các giá trị này ảnh hưởng đến danh tính cache embedding cho lập chỉ mục hàng loạt của nhà cung cấp và nên được theo sau bằng việc lập chỉ mục lại bộ nhớ khi mô hình thượng nguồn xử lý các nhãn khác nhau.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock sử dụng chuỗi thông tin xác thực mặc định của AWS SDK — không cần khóa API. Nếu OpenClaw chạy trên EC2 với vai trò instance đã bật Bedrock, chỉ cần đặt nhà cung cấp và mô hình:

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

    | Khóa                   | Kiểu     | Mặc định                       | Mô tả                         |
    | ---------------------- | -------- | ------------------------------ | ----------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Bất kỳ ID mô hình embedding Bedrock nào |
    | `outputDimensionality` | `number` | mặc định mô hình               | Với Titan V2: 256, 512, hoặc 1024 |

    **Mô hình được hỗ trợ** (có phát hiện họ mô hình và mặc định chiều):

    | ID mô hình                                  | Nhà cung cấp | Chiều mặc định | Chiều có thể cấu hình |
    | ------------------------------------------ | ------------ | -------------- | --------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon       | 1024           | 256, 512, 1024        |
    | `amazon.titan-embed-text-v1`               | Amazon       | 1536           | --                    |
    | `amazon.titan-embed-g1-text-02`            | Amazon       | 1536           | --                    |
    | `amazon.titan-embed-image-v1`              | Amazon       | 1024           | --                    |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon       | 1024           | 256, 384, 1024, 3072  |
    | `cohere.embed-english-v3`                  | Cohere       | 1024           | --                    |
    | `cohere.embed-multilingual-v3`             | Cohere       | 1024           | --                    |
    | `cohere.embed-v4:0`                        | Cohere       | 1536           | 256-1536              |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs   | 512            | --                    |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs   | 1024           | --                    |

    Các biến thể có hậu tố thông lượng (ví dụ: `amazon.titan-embed-text-v1:2:8k`) kế thừa cấu hình của mô hình cơ sở.

    **Xác thực:** Xác thực Bedrock sử dụng thứ tự phân giải thông tin xác thực tiêu chuẩn của AWS SDK:

    1. Biến môi trường (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache token SSO
    3. Thông tin xác thực token danh tính web
    4. Tệp thông tin xác thực và cấu hình dùng chung
    5. Thông tin xác thực metadata ECS hoặc EC2

    Khu vực được phân giải từ `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` của nhà cung cấp `amazon-bedrock`, hoặc mặc định là `us-east-1`.

    **Quyền IAM:** vai trò hoặc người dùng IAM cần:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Để áp dụng đặc quyền tối thiểu, hãy giới hạn phạm vi `InvokeModel` cho mô hình cụ thể:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Khóa                  | Loại               | Mặc định               | Mô tả                                                                                                                                                                                                                                                                                                                |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | tự động tải xuống      | Đường dẫn đến tệp mô hình GGUF                                                                                                                                                                                                                                                                                       |
    | `local.modelCacheDir` | `string`           | mặc định node-llama-cpp | Thư mục bộ nhớ đệm cho các mô hình đã tải xuống                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Kích thước cửa sổ ngữ cảnh cho ngữ cảnh embedding. 4096 bao phủ các đoạn điển hình (128-512 token) trong khi giới hạn VRAM không phải trọng số. Giảm xuống 1024-2048 trên các máy chủ hạn chế tài nguyên. `"auto"` sử dụng mức tối đa đã huấn luyện của mô hình — không khuyến nghị cho mô hình 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM so với ~8.8 GB ở 4096). |

    Mô hình mặc định: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, tự động tải xuống). Các checkout từ mã nguồn vẫn yêu cầu phê duyệt build native: `pnpm approve-builds` rồi `pnpm rebuild node-llama-cpp`.

    Dùng CLI độc lập để xác minh cùng đường dẫn nhà cung cấp mà Gateway sử dụng:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Nếu `provider` là `auto`, `local` chỉ được chọn khi `local.modelPath` trỏ đến một tệp cục bộ hiện có. Các tham chiếu mô hình `hf:` và HTTP(S) vẫn có thể được dùng rõ ràng với `provider: "local"`, nhưng chúng không khiến `auto` chọn local trước khi mô hình có sẵn trên ổ đĩa.

  </Accordion>
</AccordionGroup>

### Thời gian chờ embedding nội tuyến

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Ghi đè thời gian chờ cho các lô embedding nội tuyến trong quá trình lập chỉ mục bộ nhớ.

Nếu không đặt, sẽ dùng mặc định của nhà cung cấp: 600 giây cho các nhà cung cấp cục bộ/tự lưu trữ như `local`, `ollama` và `lmstudio`, và 120 giây cho các nhà cung cấp được lưu trữ. Tăng giá trị này khi các lô embedding chạy trên CPU cục bộ vẫn ổn định nhưng chậm.
</ParamField>

---

## Cấu hình tìm kiếm lai

Tất cả nằm dưới `memorySearch.query.hybrid`:

| Khóa                  | Loại      | Mặc định | Mô tả                                |
| --------------------- | --------- | -------- | ------------------------------------ |
| `enabled`             | `boolean` | `true`   | Bật tìm kiếm lai BM25 + vector       |
| `vectorWeight`        | `number`  | `0.7`    | Trọng số cho điểm vector (0-1)       |
| `textWeight`          | `number`  | `0.3`    | Trọng số cho điểm BM25 (0-1)         |
| `candidateMultiplier` | `number`  | `4`      | Hệ số nhân kích thước nhóm ứng viên  |

<Tabs>
  <Tab title="MMR (diversity)">
    | Khóa          | Loại      | Mặc định | Mô tả                                  |
    | ------------- | --------- | -------- | -------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`  | Bật xếp hạng lại bằng MMR              |
    | `mmr.lambda`  | `number`  | `0.7`    | 0 = đa dạng tối đa, 1 = liên quan tối đa |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | Khóa                         | Loại      | Mặc định | Mô tả                            |
    | ---------------------------- | --------- | -------- | -------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`  | Bật tăng điểm theo độ gần đây    |
    | `temporalDecay.halfLifeDays` | `number`  | `30`     | Điểm giảm một nửa sau mỗi N ngày |

    Các tệp thường trực (`MEMORY.md`, các tệp không ghi ngày trong `memory/`) không bao giờ bị giảm điểm theo thời gian.

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

Đường dẫn có thể là tuyệt đối hoặc tương đối với workspace. Các thư mục được quét đệ quy để tìm tệp `.md`. Cách xử lý symlink phụ thuộc vào backend đang hoạt động: công cụ tích hợp bỏ qua symlink, còn QMD tuân theo hành vi của trình quét QMD bên dưới.

Đối với tìm kiếm bản ghi hội thoại giữa các agent trong phạm vi agent, hãy dùng `agents.list[].memorySearch.qmd.extraCollections` thay vì `memory.qmd.paths`. Các bộ sưu tập bổ sung đó có cùng cấu trúc `{ path, name, pattern? }`, nhưng được gộp theo từng agent và có thể giữ nguyên các tên chia sẻ rõ ràng khi đường dẫn trỏ ra ngoài workspace hiện tại. Nếu cùng một đường dẫn đã phân giải xuất hiện trong cả `memory.qmd.paths` và `memorySearch.qmd.extraCollections`, QMD giữ mục đầu tiên và bỏ qua mục trùng lặp.

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

| Khóa               | Kiểu      | Mặc định | Mô tả                                  |
| ------------------ | --------- | -------- | -------------------------------------- |
| `cache.enabled`    | `boolean` | `false`  | Lưu embedding của đoạn vào SQLite      |
| `cache.maxEntries` | `number`  | `50000`  | Số embedding tối đa được lưu trong bộ nhớ đệm |

Ngăn việc embedding lại văn bản không đổi trong khi lập chỉ mục lại hoặc cập nhật bản ghi phiên.

---

## Lập chỉ mục theo lô

| Khóa                          | Kiểu      | Mặc định | Mô tả                         |
| ----------------------------- | --------- | -------- | ----------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`      | Embedding nội tuyến song song |
| `remote.batch.enabled`        | `boolean` | `false`  | Bật API embedding theo lô     |
| `remote.batch.concurrency`    | `number`  | `2`      | Tác vụ theo lô song song      |
| `remote.batch.wait`           | `boolean` | `true`   | Chờ hoàn tất theo lô          |
| `remote.batch.pollIntervalMs` | `number`  | --       | Khoảng thời gian thăm dò      |
| `remote.batch.timeoutMinutes` | `number`  | --       | Thời gian chờ theo lô         |

Có sẵn cho `openai`, `gemini` và `voyage`. Theo lô của OpenAI thường nhanh nhất và rẻ nhất cho các lần backfill lớn.

`remote.nonBatchConcurrency` kiểm soát các lệnh gọi embedding nội tuyến được dùng bởi nhà cung cấp cục bộ/tự lưu trữ và nhà cung cấp được lưu trữ khi API theo lô của nhà cung cấp chưa hoạt động. Ollama mặc định là `1` cho lập chỉ mục không theo lô để tránh làm quá tải các máy chủ cục bộ nhỏ hơn; đặt giá trị cao hơn trên các máy lớn hơn.

Cấu hình này tách biệt với `sync.embeddingBatchTimeoutSeconds`, vốn kiểm soát thời gian chờ cho các lệnh gọi embedding nội tuyến.

---

## Tìm kiếm bộ nhớ phiên (thử nghiệm)

Lập chỉ mục bản ghi phiên và hiển thị chúng qua `memory_search`:

| Khóa                          | Kiểu       | Mặc định     | Mô tả                                  |
| ----------------------------- | ---------- | ------------ | -------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Bật lập chỉ mục phiên                  |
| `sources`                     | `string[]` | `["memory"]` | Thêm `"sessions"` để bao gồm bản ghi   |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Ngưỡng byte để lập chỉ mục lại         |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Ngưỡng tin nhắn để lập chỉ mục lại     |

<Warning>
Lập chỉ mục phiên là tùy chọn bật và chạy bất đồng bộ. Kết quả có thể hơi cũ. Nhật ký phiên nằm trên đĩa, vì vậy hãy xem quyền truy cập hệ thống tệp là ranh giới tin cậy.
</Warning>

---

## Tăng tốc vector SQLite (sqlite-vec)

| Khóa                         | Kiểu      | Mặc định | Mô tả                                |
| ---------------------------- | --------- | -------- | ------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`   | Dùng sqlite-vec cho truy vấn vector  |
| `store.vector.extensionPath` | `string`  | đi kèm   | Ghi đè đường dẫn sqlite-vec          |

Khi sqlite-vec không khả dụng, OpenClaw tự động chuyển sang độ tương đồng cosine trong tiến trình.

---

## Lưu trữ chỉ mục

| Khóa                  | Kiểu     | Mặc định                              | Mô tả                                            |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Vị trí chỉ mục (hỗ trợ token `{agentId}`)        |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Bộ tách từ FTS5 (`unicode61` hoặc `trigram`)     |

---

## Cấu hình backend QMD

Đặt `memory.backend = "qmd"` để bật. Tất cả thiết lập QMD nằm dưới `memory.qmd`:

| Khóa                     | Kiểu      | Mặc định | Mô tả                                                                                  |
| ------------------------ | --------- | -------- | -------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Đường dẫn tệp thực thi QMD; đặt đường dẫn tuyệt đối khi `PATH` dịch vụ khác shell của bạn |
| `searchMode`             | `string`  | `search` | Lệnh tìm kiếm: `search`, `vsearch`, `query`                                             |
| `includeDefaultMemory`   | `boolean` | `true`   | Tự động lập chỉ mục `MEMORY.md` + `memory/**/*.md`                                      |
| `paths[]`                | `array`   | --       | Đường dẫn bổ sung: `{ name, path, pattern? }`                                           |
| `sessions.enabled`       | `boolean` | `false`  | Lập chỉ mục bản ghi phiên                                                              |
| `sessions.retentionDays` | `number`  | --       | Thời gian lưu giữ bản ghi                                                              |
| `sessions.exportDir`     | `string`  | --       | Thư mục xuất                                                                            |

`searchMode: "search"` chỉ dùng từ vựng/BM25. OpenClaw không chạy kiểm tra sẵn sàng vectơ ngữ nghĩa hoặc bảo trì embedding QMD cho chế độ đó, kể cả trong `memory status --deep`; `vsearch` và `query` tiếp tục yêu cầu QMD vector readiness và embeddings.

OpenClaw ưu tiên collection QMD hiện tại và dạng truy vấn MCP hiện tại, nhưng vẫn giữ cho các bản phát hành QMD cũ hoạt động bằng cách thử các cờ mẫu collection tương thích và tên công cụ MCP cũ hơn khi cần. Khi QMD thông báo hỗ trợ nhiều bộ lọc collection, các collection cùng nguồn được tìm kiếm bằng một tiến trình QMD; các bản dựng QMD cũ hơn tiếp tục dùng đường dẫn tương thích theo từng collection. Cùng nguồn nghĩa là các collection bộ nhớ bền vững được nhóm lại với nhau, trong khi các collection bản ghi phiên vẫn là một nhóm riêng để đa dạng hóa nguồn vẫn có cả hai đầu vào.

<Note>
Ghi đè mô hình QMD nằm ở phía QMD, không nằm trong cấu hình OpenClaw. Nếu bạn cần ghi đè toàn cục các mô hình của QMD, hãy đặt các biến môi trường như `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` và `QMD_GENERATE_MODEL` trong môi trường runtime Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Lịch cập nhật">
    | Khóa                      | Kiểu      | Mặc định | Mô tả                                  |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Khoảng thời gian làm mới              |
    | `update.debounceMs`       | `number`  | `15000` | Debounce thay đổi tệp                 |
    | `update.onBoot`           | `boolean` | `true`  | Làm mới khi trình quản lý QMD chạy lâu mở; cũng kiểm soát làm mới khi khởi động theo cơ chế chọn tham gia |
    | `update.startup`          | `string`  | `off`   | Làm mới tùy chọn khi Gateway khởi động: `off`, `idle` hoặc `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Độ trễ trước khi chạy làm mới `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | Chặn việc mở trình quản lý cho đến khi lần làm mới ban đầu hoàn tất |
    | `update.embedInterval`    | `string`  | --      | Nhịp embed riêng                      |
    | `update.commandTimeoutMs` | `number`  | --      | Thời gian chờ cho các lệnh QMD        |
    | `update.updateTimeoutMs`  | `number`  | --      | Thời gian chờ cho các thao tác cập nhật QMD |
    | `update.embedTimeoutMs`   | `number`  | --      | Thời gian chờ cho các thao tác embed QMD |
  </Accordion>
  <Accordion title="Giới hạn">
    | Khóa                      | Kiểu     | Mặc định | Mô tả                      |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Số kết quả tìm kiếm tối đa |
    | `limits.maxSnippetChars`  | `number` | --      | Giới hạn độ dài đoạn trích |
    | `limits.maxInjectedChars` | `number` | --      | Giới hạn tổng số ký tự được chèn |
    | `limits.timeoutMs`        | `number` | `4000`  | Thời gian chờ tìm kiếm     |
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

    Mặc định đi kèm cho phép các phiên trực tiếp và kênh, trong khi vẫn từ chối nhóm.

    Mặc định chỉ dành cho DM. `match.keyPrefix` khớp với khóa phiên đã chuẩn hóa; `match.rawKeyPrefix` khớp với khóa thô bao gồm `agent:<id>:`.

  </Accordion>
  <Accordion title="Trích dẫn">
    `memory.citations` áp dụng cho tất cả backend:

    | Giá trị          | Hành vi                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (mặc định) | Bao gồm footer `Source: <path#line>` trong đoạn trích |
    | `on`             | Luôn bao gồm footer                                |
    | `off`            | Bỏ footer (đường dẫn vẫn được chuyển nội bộ cho agent) |

  </Accordion>
</AccordionGroup>

Các lần làm mới khi QMD khởi động dùng đường dẫn tiến trình con chạy một lần trong lúc Gateway khởi động. Trình quản lý QMD chạy lâu vẫn sở hữu trình theo dõi tệp thông thường và bộ hẹn giờ theo khoảng khi tìm kiếm bộ nhớ được mở để sử dụng tương tác.

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

Dreaming chạy dưới dạng một lượt quét đã lên lịch và dùng các pha nội bộ nhẹ/sâu/REM như một chi tiết triển khai.

Để biết hành vi khái niệm và lệnh slash, hãy xem [Dreaming](/vi/concepts/dreaming).

### Cài đặt người dùng

| Khóa        | Kiểu      | Mặc định      | Mô tả                                             |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Bật hoặc tắt hoàn toàn Dreaming                   |
| `frequency` | `string`  | `0 3 * * *`   | Nhịp Cron tùy chọn cho toàn bộ lượt quét Dreaming |
| `model`     | `string`  | mô hình mặc định | Ghi đè mô hình subagent Dream Diary tùy chọn   |

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
- `dreaming.model` dùng cổng tin cậy subagent Plugin hiện có; đặt `plugins.entries.memory-core.subagent.allowModelOverride: true` trước khi bật nó.
- Dream Diary thử lại một lần bằng mô hình mặc định của phiên khi mô hình đã cấu hình không khả dụng. Lỗi về tin cậy hoặc danh sách cho phép được ghi log và không được âm thầm thử lại.
- Chính sách pha nhẹ/sâu/REM và các ngưỡng là hành vi nội bộ, không phải cấu hình dành cho người dùng.

</Note>

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/configuration-reference)
- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
