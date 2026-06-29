---
read_when:
    - 你想要設定記憶搜尋提供者或嵌入模型
    - 你想要設定 QMD 後端
    - 你想要調整混合搜尋、MMR 或時間衰減
    - 你想啟用多模態記憶索引
sidebarTitle: Memory config
summary: 記憶搜尋、嵌入提供者、QMD、混合搜尋與多模態索引的所有設定選項
title: 記憶體設定參考
x-i18n:
    generated_at: "2026-06-28T22:33:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de7d1c23cd415293001ef59ae2572cd7bfe9a88c70c1e4cf138ee60664ff0ac2
    source_path: reference/memory-config.md
    workflow: 16
---

本頁列出 OpenClaw 記憶搜尋的每一個組態旋鈕。概念總覽請參閱：

<CardGroup cols={2}>
  <Card title="記憶總覽" href="/zh-TW/concepts/memory">
    記憶的運作方式。
  </Card>
  <Card title="內建引擎" href="/zh-TW/concepts/memory-builtin">
    預設 SQLite 後端。
  </Card>
  <Card title="QMD 引擎" href="/zh-TW/concepts/memory-qmd">
    本機優先的附屬服務。
  </Card>
  <Card title="記憶搜尋" href="/zh-TW/concepts/memory-search">
    搜尋管線與調校。
  </Card>
  <Card title="主動記憶" href="/zh-TW/concepts/active-memory">
    互動式工作階段的記憶子代理。
  </Card>
</CardGroup>

除非另有註明，所有記憶搜尋設定都位於 `openclaw.json` 的 `agents.defaults.memorySearch` 底下。

<Note>
如果你要找的是 **主動記憶** 功能切換與子代理組態，它位於 `plugins.entries.active-memory` 底下，而不是 `memorySearch`。

主動記憶使用雙閘門模型：

1. 外掛必須啟用，且目標為目前的代理 id
2. 請求必須是符合資格的互動式持久聊天工作階段

請參閱 [主動記憶](/zh-TW/concepts/active-memory)，了解啟用模型、外掛擁有的組態、逐字稿持久化，以及安全推出模式。
</Note>

---

## 提供者選擇

| 鍵        | 類型      | 預設值          | 說明                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | 嵌入配接器 ID，例如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`openai-compatible` 或 `voyage`；也可以是已設定的 `models.providers.<id>`，其 `api` 指向記憶嵌入配接器或與 OpenAI 相容的模型 API |
| `model`    | `string`  | 提供者預設值 | 嵌入模型名稱                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | 主要提供者失敗時的後援配接器 ID                                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`           | 啟用或停用記憶搜尋                                                                                                                                                                                                                                                             |

未設定 `provider` 時，OpenClaw 會使用 OpenAI embeddings。請明確設定 `provider`
以使用 Gemini、Voyage、Mistral、DeepInfra、Bedrock、GitHub Copilot、
Ollama、本機 GGUF 模型，或與 OpenAI 相容的 `/v1/embeddings` 端點。
仍寫著 `provider: "auto"` 的舊版組態會解析為 `openai`。

<Warning>
變更嵌入提供者、模型、提供者設定、來源、範圍、
分塊或 tokenizer，可能會讓既有 SQLite 向量索引不相容。
OpenClaw 會暫停向量搜尋並回報索引身分警告，而不是
自動重新嵌入所有內容。準備好時，請使用
`openclaw memory status --index --agent <id>` 或
`openclaw memory index --force --agent <id>` 重建。
</Warning>

當 `provider` 未設定、存在舊版 `provider: "auto"`，或
`provider: "none"` 有意選擇僅 FTS 模式時，若 embeddings 無法使用，記憶回想仍可
使用詞彙 FTS 排名。

明確的非本機提供者會封閉式失敗。如果你將 `memorySearch.provider` 設為
具體的遠端後端提供者，例如 OpenAI、Gemini、Voyage、Mistral、
Bedrock、GitHub Copilot、DeepInfra、Ollama、LM Studio，或與 OpenAI 相容的
自訂提供者，而該提供者在執行階段無法使用，`memory_search`
會回傳不可用結果，而不是默默使用僅 FTS 回想。請修正
提供者/驗證組態、切換到可連線的提供者，或在你想要刻意使用僅 FTS 回想時設定
`provider: "none"`。

### 自訂提供者 id

`memorySearch.provider` 可以指向自訂 `models.providers.<id>` 項目，用於記憶專用提供者配接器，例如 `ollama`，或用於與 OpenAI 相容的模型 API，例如 `openai-responses` / `openai-completions`。OpenClaw 會為嵌入配接器解析該提供者的 `api` 擁有者，同時保留自訂提供者 id，以處理端點、驗證與模型前綴。這讓多 GPU 或多主機設定能將記憶 embeddings 專門指派給特定本機端點：

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

### API 金鑰解析

遠端 embeddings 需要 API 金鑰。Bedrock 則改用 AWS SDK 預設憑證鏈（執行個體角色、SSO、存取金鑰）。

| 提供者       | 環境變數                                            | 組態鍵                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 憑證鏈                               | 不需要 API 金鑰                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | 透過裝置登入的驗證設定檔       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（預留位置）                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth 只涵蓋聊天/補全，不滿足嵌入請求。
</Note>

---

## 遠端端點組態

對於不應繼承全域 OpenAI 聊天憑證的通用 OpenAI 相容
`/v1/embeddings` 伺服器，請使用 `provider: "openai-compatible"`。

<ParamField path="remote.baseUrl" type="string">
  自訂 API 基礎 URL。
</ParamField>
<ParamField path="remote.apiKey" type="string">
  覆寫 API 金鑰。
</ParamField>
<ParamField path="remote.headers" type="object">
  額外 HTTP 標頭（與提供者預設值合併）。
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

## 提供者專屬組態

<AccordionGroup>
  <Accordion title="Gemini">
    | 鍵                    | 類型     | 預設值                | 說明                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | 也支援 `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | 適用於 Embedding 2：768、1536 或 3072        |

    <Warning>
    變更模型或 `outputDimensionality` 會改變索引身分。OpenClaw
    會暫停向量搜尋，直到你明確重建記憶索引。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 相容輸入類型">
    OpenAI 相容的嵌入端點可以選擇加入提供者專屬的 `input_type` 請求欄位。這對於需要查詢與文件 embeddings 使用不同標籤的非對稱嵌入模型很有用。

    | 鍵                 | 類型     | 預設值 | 說明                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | 未設定   | 查詢與文件 embeddings 共用的 `input_type`   |
    | `queryInputType`    | `string` | 未設定   | 查詢時的 `input_type`；覆寫 `inputType`          |
    | `documentInputType` | `string` | 未設定   | 索引/文件 `input_type`；覆寫 `inputType`      |

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

    變更這些值會影響提供者批次索引的嵌入快取身分；當上游模型以不同方式處理標籤時，後續應重新索引記憶。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 嵌入組態

    Bedrock 使用 AWS SDK 預設憑證鏈，不需要 API 金鑰。如果 OpenClaw 在具備 Bedrock 啟用執行個體角色的 EC2 上執行，只要設定提供者與模型：

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

    | 鍵                    | 類型     | 預設值                        | 說明                     |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任何 Bedrock 嵌入模型 ID  |
    | `outputDimensionality` | `number` | 模型預設值                  | 適用於 Titan V2：256、512 或 1024 |

    **支援的模型**（含系列偵測與維度預設值）：

    | 模型 ID                                   | 提供者     | 預設維度 | 可設定維度           |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    帶有輸送量後綴的變體（例如 `amazon.titan-embed-text-v1:2:8k`）會繼承基礎模型的設定。

    **驗證：** Bedrock 驗證使用標準 AWS SDK 憑證解析順序：

    1. 環境變數（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
    2. SSO 權杖快取
    3. Web 身分權杖憑證
    4. 共用憑證與設定檔
    5. ECS 或 EC2 中繼資料憑證

    區域會從 `AWS_REGION`、`AWS_DEFAULT_REGION`、`amazon-bedrock` 提供者 `baseUrl` 解析，或預設為 `us-east-1`。

    **IAM 權限：** IAM 角色或使用者需要：

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    為了最小權限，請將 `InvokeModel` 範圍限定為特定模型：

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + llama.cpp)">
    | 鍵                    | 類型               | 預設值                 | 說明                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自動下載               | GGUF 模型檔案的路徑                                                                                                                                                                                                                                                                                                  |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 預設值  | 已下載模型的快取目錄                                                                                                                                                                                                                                                                                                |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入內容的上下文視窗大小。4096 可涵蓋典型區塊（128–512 個權杖），同時限制非權重 VRAM。受限主機可降低到 1024–2048。`"auto"` 會使用模型訓練時的最大值，不建議用於 8B+ 模型（Qwen3-Embedding-8B：40 960 個權杖 → 約 32 GB VRAM，相較於 4096 時約 8.8 GB）。 |

    先安裝官方 llama.cpp 提供者：`openclaw plugins install @openclaw/llama-cpp-provider`。
    預設模型：`embeddinggemma-300m-qat-Q8_0.gguf`（約 0.6 GB，自動下載）。原始碼 checkout 仍需要原生建置核准：先執行 `pnpm approve-builds`，再執行 `pnpm rebuild node-llama-cpp`。

    使用獨立命令列介面驗證閘道使用的相同提供者路徑：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    請為本機 GGUF 嵌入明確設定 `provider: "local"`。明確的本機設定支援 `hf:` 和 HTTP(S) 模型參照，但它們不會變更預設提供者。

  </Accordion>
</AccordionGroup>

### 行內嵌入逾時

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆寫記憶索引期間行內嵌入批次的逾時時間。

未設定時會使用提供者預設值：本機/自架提供者（例如 `local`、`ollama` 和 `lmstudio`）為 600 秒，託管提供者為 120 秒。當本機受 CPU 限制的嵌入批次正常但較慢時，請增加此值。
</ParamField>

---

## 混合搜尋設定

全部位於 `memorySearch.query.hybrid` 之下：

| 鍵                    | 類型      | 預設值  | 說明                              |
| --------------------- | --------- | ------- | --------------------------------- |
| `enabled`             | `boolean` | `true`  | 啟用混合 BM25 + 向量搜尋         |
| `vectorWeight`        | `number`  | `0.7`   | 向量分數權重（0-1）              |
| `textWeight`          | `number`  | `0.3`   | BM25 分數權重（0-1）             |
| `candidateMultiplier` | `number`  | `4`     | 候選集大小倍數                   |

<Tabs>
  <Tab title="MMR (diversity)">
    | 鍵            | 類型      | 預設值  | 說明                                 |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | 啟用 MMR 重新排序                   |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多樣性，1 = 最大相關性      |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | 鍵                           | 類型      | 預設值 | 說明                       |
    | ---------------------------- | --------- | ------ | -------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 啟用近期性加權            |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | 每 N 天分數減半           |

    常青檔案（`MEMORY.md`、`memory/` 中無日期的檔案）永不衰減。

  </Tab>
</Tabs>

### 完整範例

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

## 其他記憶路徑

| 鍵          | 類型       | 說明                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | 要建立索引的其他目錄或檔案 |

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

路徑可以是絕對路徑，也可以是相對於工作區的路徑。目錄會以遞迴方式掃描 `.md` 檔案。符號連結處理取決於啟用中的後端：內建引擎會忽略符號連結，而 QMD 則遵循底層 QMD 掃描器的行為。

若要進行以代理程式為範圍的跨代理程式逐字稿搜尋，請使用 `agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。這些額外集合遵循相同的 `{ path, name, pattern? }` 形狀，但會按代理程式合併，且當路徑指向目前工作區外部時，可以保留明確的共享名稱。如果同一個解析後的路徑同時出現在 `memory.qmd.paths` 和 `memorySearch.qmd.extraCollections` 中，QMD 會保留第一個項目並略過重複項目。

---

## 多模態記憶（Gemini）

使用 Gemini Embedding 2 將圖片和音訊與 Markdown 一起建立索引：

| 鍵                       | 類型       | 預設值    | 說明                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 啟用多模態索引             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | 建立索引的最大檔案大小             |

<Note>
僅適用於 `extraPaths` 中的檔案。預設記憶根目錄仍然只支援 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必須是 `"none"`。
</Note>

支援的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（圖片）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音訊）。

---

## 嵌入快取

| 鍵                | 類型      | 預設值 | 說明                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | 在 SQLite 中快取區塊嵌入 |
| `cache.maxEntries` | `number`  | `50000` | 最大快取嵌入數            |

避免在重新建立索引或逐字稿更新期間，對未變更的文字重新產生嵌入。

---

## 批次索引

| 鍵                           | 類型      | 預設值 | 說明                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 平行內嵌嵌入 |
| `remote.batch.enabled`        | `boolean` | `false` | 啟用批次嵌入 API |
| `remote.batch.concurrency`    | `number`  | `2`     | 平行批次作業        |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批次完成  |
| `remote.batch.pollIntervalMs` | `number`  | --      | 輪詢間隔              |
| `remote.batch.timeoutMinutes` | `number`  | --      | 批次逾時              |

適用於 `openai`、`gemini` 和 `voyage`。OpenAI 批次通常是大型回填最快且成本最低的選項。

`remote.nonBatchConcurrency` 控制本機/自行託管提供者，以及在提供者批次 API 未啟用時由託管提供者使用的內嵌嵌入呼叫。Ollama 的非批次索引預設為 `1`，以避免讓較小的本機主機負載過高；在較大的機器上可設定較高的值。

這與 `sync.embeddingBatchTimeoutSeconds` 分開，後者控制內嵌嵌入呼叫的逾時。

---

## 工作階段記憶搜尋（實驗性）

為工作階段逐字稿建立索引，並透過 `memory_search` 顯示：

| 鍵                           | 類型       | 預設值      | 說明                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 啟用工作階段索引                 |
| `sources`                     | `string[]` | `["memory"]` | 加入 `"sessions"` 以納入逐字稿 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 重新建立索引的位元組閾值              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 重新建立索引的訊息閾值           |

<Warning>
工作階段索引需要選擇啟用，並且會非同步執行。結果可能會稍微過時。工作階段記錄存放在磁碟上，因此請將檔案系統存取視為信任邊界。
</Warning>

工作階段逐字稿命中也會遵守
[`tools.sessions.visibility`](/zh-TW/gateway/config-tools#toolssessions)。預設的
`tree` 可見性只會公開目前工作階段及其衍生的工作階段。若要從不同
工作階段（例如私人訊息）召回不相關、同一代理且由閘道分派的工作階段，請有意將可見性擴大為 `agent`（或只有在也需要跨代理召回且代理對代理政策允許時才使用 `all`）。

下列範例會將這些設定放在 `agents.defaults` 下。當只有單一代理應索引並搜尋工作階段逐字稿時，你也可以在每個代理的覆寫中套用等效的 `memorySearch` 設定。

用於同一代理從閘道到私人訊息的召回：

<Tabs>
  <Tab title="Builtin backend">
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
  <Tab title="QMD backend">
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

使用 QMD 時，`agents.defaults.memorySearch.experimental.sessionMemory` 和
`sources: ["sessions"]` 本身不會將逐字稿匯出到 QMD。也請設定
`memory.qmd.sessions.enabled: true`。

---

## SQLite 向量加速（sqlite-vec）

| 鍵                           | 類型      | 預設值 | 說明                              |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | 使用 sqlite-vec 進行向量查詢      |
| `store.vector.extensionPath` | `string`  | bundled | 覆寫 sqlite-vec 路徑              |

當 sqlite-vec 無法使用時，OpenClaw 會自動退回到程序內餘弦相似度。

---

## 索引儲存

內建記憶索引位於每個代理的 OpenClaw SQLite 資料庫：
`agents/<agentId>/agent/openclaw-agent.sqlite`。

| 鍵                    | 類型     | 預設值      | 說明                                      |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5 權杖化工具（`unicode61` 或 `trigram`） |

---

## QMD 後端設定

設定 `memory.backend = "qmd"` 以啟用。所有 QMD 設定都位於 `memory.qmd` 下：

| 鍵                       | 類型      | 預設值   | 說明                                                                                  |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 可執行檔路徑；當服務的 `PATH` 與你的 shell 不同時，請設定絕對路徑 |
| `searchMode`             | `string`  | `search` | 搜尋命令：`search`、`vsearch`、`query`                                                 |
| `rerank`                 | `boolean` | --       | 搭配 `searchMode: "query"` 和 QMD 2.1+ 設為 `false`，以略過 QMD 重新排序              |
| `includeDefaultMemory`   | `boolean` | `true`   | 自動索引 `MEMORY.md` + `memory/**/*.md`                                                |
| `paths[]`                | `array`   | --       | 額外路徑：`{ name, path, pattern? }`                                                   |
| `sessions.enabled`       | `boolean` | `false`  | 將工作階段逐字稿匯出到 QMD                                                            |
| `sessions.retentionDays` | `number`  | --       | 逐字稿保留期限                                                                        |
| `sessions.exportDir`     | `string`  | --       | 匯出目錄                                                                              |

`searchMode: "search"` 僅使用詞彙/BM25。OpenClaw 不會針對該模式執行語意向量就緒度探測或 QMD 嵌入維護，包括在 `memory status --deep` 期間；`vsearch` 和 `query` 仍然需要 QMD 向量就緒度和嵌入。

`rerank: false` 只會變更 QMD `query` 模式，且需要 QMD 2.1 或更新版本。在直接命令列介面模式中，OpenClaw 會傳遞 `--no-rerank`；在 mcporter 支援的 MCP 模式中，它會將 `rerank: false` 傳遞給 QMD 的統一查詢工具。保持未設定即可使用 QMD 預設的查詢重新排序行為。

OpenClaw 偏好目前的 QMD 集合和 MCP 查詢形狀，但會在需要時嘗試相容的集合模式旗標和較舊的 MCP 工具名稱，以維持較舊 QMD 版本可用。當 QMD 宣告支援多個集合篩選器時，會使用單一 QMD 程序搜尋同來源集合；較舊的 QMD 建置版本則保留每集合相容路徑。同來源表示持久記憶集合會群組在一起，而工作階段逐字稿集合會維持為獨立群組，因此來源多樣化仍同時具備兩種輸入。

<Note>
QMD 模型覆寫保留在 QMD 端，而不是 OpenClaw 設定中。如果你需要全域覆寫 QMD 的模型，請在閘道執行階段環境中設定環境變數，例如 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL`。
</Note>

<AccordionGroup>
  <Accordion title="更新排程">
    | 鍵                        | 類型      | 預設值  | 說明                                  |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | 重新整理間隔                          |
    | `update.debounceMs`       | `number`  | `15000` | 防抖檔案變更                          |
    | `update.onBoot`           | `boolean` | `true`  | 長時間執行的 QMD 管理器開啟時重新整理；設為 false 可略過立即啟動更新 |
    | `update.startup`          | `string`  | `off`   | 選用的閘道啟動 QMD 初始化：`off`、`idle` 或 `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` 重新整理執行前的延遲 |
    | `update.waitForBootSync`  | `boolean` | `false` | 阻擋管理器開啟，直到其初始重新整理完成 |
    | `update.embedInterval`    | `string`  | --      | 獨立的嵌入節奏                        |
    | `update.commandTimeoutMs` | `number`  | --      | QMD 命令逾時                          |
    | `update.updateTimeoutMs`  | `number`  | --      | QMD 更新操作逾時                      |
    | `update.embedTimeoutMs`   | `number`  | --      | QMD 嵌入操作逾時                      |
  </Accordion>
  <Accordion title="限制">
    | 鍵                        | 類型     | 預設值 | 說明                     |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | 搜尋結果數上限             |
    | `limits.maxSnippetChars`  | `number` | --      | 限制片段長度               |
    | `limits.maxInjectedChars` | `number` | --      | 限制注入字元總數           |
    | `limits.timeoutMs`        | `number` | `4000`  | 搜尋逾時                   |
  </Accordion>
  <Accordion title="範圍">
    控制哪些工作階段可以接收 QMD 搜尋結果。結構描述與 [`session.sendPolicy`](/zh-TW/gateway/config-agents#session) 相同：

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

    隨附的預設值允許直接和頻道工作階段，同時仍拒絕群組。

    預設值僅限 DM。`match.keyPrefix` 會比對正規化的工作階段鍵；`match.rawKeyPrefix` 會比對包含 `agent:<id>:` 的原始鍵。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 適用於所有後端：

    | 值               | 行為                                                |
    | ---------------- | --------------------------------------------------- |
    | `auto` (default) | 在片段中包含 `Source: <path#line>` 頁尾             |
    | `on`             | 一律包含頁尾                                        |
    | `off`            | 省略頁尾（路徑仍會在內部傳給代理）                 |

  </Accordion>
</AccordionGroup>

啟用閘道啟動 QMD 初始化時，OpenClaw 只會為符合資格的代理啟動 QMD。如果 `update.onBoot` 為 true，且未設定間隔/嵌入維護，啟動會使用一次性管理器進行啟動重新整理，然後將其關閉。如果設定了更新或嵌入間隔，啟動會開啟長時間執行的 QMD 管理器，讓它負責監看器和間隔計時器；`update.onBoot: false` 只會略過立即啟動重新整理。

### 完整 QMD 範例

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

## 夢境整理

夢境整理是在 `plugins.entries.memory-core.config.dreaming` 下設定，而不是在 `agents.defaults.memorySearch` 下。

夢境整理會作為一次排程掃描執行，並將內部的淺層/深層/REM 階段作為實作細節。

如需概念行為和斜線命令，請參閱[夢境整理](/zh-TW/concepts/dreaming)。

### 使用者設定

| 鍵                                     | 類型      | 預設值       | 說明                                                                                                                             |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | 完全啟用或停用夢境整理                                                                                                           |
| `frequency`                            | `string`  | `0 3 * * *`   | 完整夢境整理掃描的選用排程節奏                                                                                                   |
| `model`                                | `string`  | 預設模型      | 選用的夢境日誌子代理模型覆寫                                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | 從每個提升至 `MEMORY.md` 的短期回憶片段中保留的最大估計權杖數；來源中繼資料仍會顯示 |

### 範例

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
- 夢境整理會將機器狀態寫入 `memory/.dreams/`。
- 夢境整理會將人類可讀的敘事輸出寫入 `DREAMS.md`（或現有的 `dreams.md`）。
- `dreaming.model` 使用現有的外掛子代理信任閘門；啟用前請先設定 `plugins.entries.memory-core.subagent.allowModelOverride: true`。
- 設定的模型不可用時，夢境日誌會使用工作階段預設模型重試一次。信任或允許清單失敗會被記錄，且不會靜默重試。
- 淺層/深層/REM 階段政策和閾值是內部行為，不是使用者可見的設定。

</Note>

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [記憶概覽](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
