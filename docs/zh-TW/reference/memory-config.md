---
read_when:
    - 您想要設定記憶搜尋提供者或嵌入模型
    - 您想要設定 QMD 後端
    - 您想調整混合搜尋、MMR 或時間衰減
    - 你想啟用多模態記憶索引
sidebarTitle: Memory config
summary: 記憶搜尋、嵌入提供者、QMD、混合搜尋與多模態索引的所有設定選項
title: 記憶設定參考
x-i18n:
    generated_at: "2026-04-30T16:29:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58b75751a19afb883fd7646cf5f71859f95bac468b2bfd8cc79db12ae892f70f
    source_path: reference/memory-config.md
    workflow: 16
---

此頁列出 OpenClaw 記憶體搜尋的每個設定旋鈕。如需概念概覽，請參閱：

<CardGroup cols={2}>
  <Card title="Memory overview" href="/zh-TW/concepts/memory">
    記憶體如何運作。
  </Card>
  <Card title="Builtin engine" href="/zh-TW/concepts/memory-builtin">
    預設 SQLite 後端。
  </Card>
  <Card title="QMD engine" href="/zh-TW/concepts/memory-qmd">
    本地優先的 sidecar。
  </Card>
  <Card title="Memory search" href="/zh-TW/concepts/memory-search">
    搜尋管線與調校。
  </Card>
  <Card title="Active memory" href="/zh-TW/concepts/active-memory">
    互動式工作階段的記憶體子代理程式。
  </Card>
</CardGroup>

除非另有說明，所有記憶體搜尋設定都位於 `openclaw.json` 的 `agents.defaults.memorySearch` 底下。

<Note>
如果你要找的是 **Active Memory** 功能切換與子代理程式設定，它位於 `plugins.entries.active-memory` 底下，而不是 `memorySearch`。

Active Memory 使用雙閘門模型：

1. Plugin 必須已啟用，且目標為目前的代理程式 ID
2. 請求必須是符合資格的互動式持久聊天工作階段

請參閱 [Active Memory](/zh-TW/concepts/active-memory)，了解啟用模型、Plugin 擁有的設定、逐字稿持久化，以及安全推出模式。
</Note>

---

## 提供者選擇

| 鍵        | 類型      | 預設值          | 說明                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | 自動偵測    | 嵌入轉接器 ID，例如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai` 或 `voyage`；也可以是已設定的 `models.providers.<id>`，其 `api` 指向其中一個轉接器 |
| `model`    | `string`  | 提供者預設值 | 嵌入模型名稱                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`         | 主要提供者失敗時使用的備援轉接器 ID                                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`           | 啟用或停用記憶體搜尋                                                                                                                                                                                                    |

### 自動偵測順序

未設定 `provider` 時，OpenClaw 會選擇第一個可用項目：

<Steps>
  <Step title="local">
    如果已設定 `memorySearch.local.modelPath` 且檔案存在，則會選取。
  </Step>
  <Step title="github-copilot">
    如果可解析 GitHub Copilot 權杖（環境變數或驗證設定檔），則會選取。
  </Step>
  <Step title="openai">
    如果可解析 OpenAI 金鑰，則會選取。
  </Step>
  <Step title="gemini">
    如果可解析 Gemini 金鑰，則會選取。
  </Step>
  <Step title="voyage">
    如果可解析 Voyage 金鑰，則會選取。
  </Step>
  <Step title="mistral">
    如果可解析 Mistral 金鑰，則會選取。
  </Step>
  <Step title="deepinfra">
    如果可解析 DeepInfra 金鑰，則會選取。
  </Step>
  <Step title="bedrock">
    如果 AWS SDK 憑證鏈可解析（執行個體角色、存取金鑰、設定檔、SSO、Web 身分或共用設定），則會選取。
  </Step>
</Steps>

支援 `ollama`，但不會自動偵測（請明確設定）。

### 自訂提供者 ID

`memorySearch.provider` 可以指向自訂的 `models.providers.<id>` 項目。OpenClaw 會解析該提供者的 `api` 擁有者作為嵌入轉接器，同時保留自訂提供者 ID 以處理端點、驗證與模型前綴。這可讓多 GPU 或多主機設定將記憶體嵌入專門指派給特定本機端點：

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

遠端嵌入需要 API 金鑰。Bedrock 則改用 AWS SDK 預設憑證鏈（執行個體角色、SSO、存取金鑰）。

| 提供者       | 環境變數                                            | 設定鍵                          |
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
Codex OAuth 僅涵蓋聊天/補全，不滿足嵌入請求。
</Note>

---

## 遠端端點設定

針對自訂 OpenAI 相容端點或覆寫提供者預設值：

<ParamField path="remote.baseUrl" type="string">
  自訂 API 基底 URL。
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

## 提供者專屬設定

<AccordionGroup>
  <Accordion title="Gemini">
    | 鍵                    | 類型     | 預設值                | 說明                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | 也支援 `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | 針對 Embedding 2：768、1536 或 3072        |

    <Warning>
    變更模型或 `outputDimensionality` 會觸發自動完整重新索引。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    OpenAI 相容的嵌入端點可以選擇加入提供者專屬的 `input_type` 請求欄位。這對需要針對查詢與文件嵌入使用不同標籤的非對稱嵌入模型很有用。

    | 鍵                 | 類型     | 預設值 | 說明                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | 未設定   | 查詢與文件嵌入共用的 `input_type`   |
    | `queryInputType`    | `string` | 未設定   | 查詢時的 `input_type`；覆寫 `inputType`          |
    | `documentInputType` | `string` | 未設定   | 索引/文件的 `input_type`；覆寫 `inputType`      |

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

    變更這些值會影響提供者批次索引的嵌入快取身分；如果上游模型會以不同方式處理標籤，之後應重新索引記憶體。

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock 使用 AWS SDK 預設憑證鏈，不需要 API 金鑰。如果 OpenClaw 在具有 Bedrock 啟用執行個體角色的 EC2 上執行，只要設定提供者與模型即可：

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
    | `outputDimensionality` | `number` | 模型預設值                  | 針對 Titan V2：256、512 或 1024 |

    **支援的模型**（包含系列偵測與維度預設值）：

    | 模型 ID                                   | 提供者   | 預設維度 | 可設定維度    |
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

    具有輸送量後綴的變體（例如 `amazon.titan-embed-text-v1:2:8k`）會繼承基礎模型的設定。

    **驗證：**Bedrock 驗證使用標準 AWS SDK 憑證解析順序：

    1. 環境變數（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
    2. SSO 權杖快取
    3. Web 身分權杖憑證
    4. 共用憑證與設定檔
    5. ECS 或 EC2 中繼資料憑證

    區域會從 `AWS_REGION`、`AWS_DEFAULT_REGION`、`amazon-bedrock` 提供者 `baseUrl` 解析，或預設為 `us-east-1`。

    **IAM 權限：**IAM 角色或使用者需要：

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    若要使用最低權限，請將 `InvokeModel` 範圍限制為特定模型：

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="本機（GGUF + node-llama-cpp）">
    | 鍵                    | 類型               | 預設值                    | 說明                                                                                                                                                                                                                                                                                                               |
    | --------------------- | ------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | 自動下載                  | GGUF 模型檔案的路徑                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 預設值     | 下載模型的快取目錄                                                                                                                                                                                                                                                                                               |
    | `local.contextSize`   | `number \| "auto"` | `4096`                    | 嵌入內容的脈絡視窗大小。4096 可涵蓋一般區塊（128–512 個權杖），同時限制非權重 VRAM。受限主機上可降低到 1024–2048。`"auto"` 會使用模型訓練時的最大值，不建議用於 8B+ 模型（Qwen3-Embedding-8B：40,960 個權杖 → 約 32 GB VRAM，相較於 4096 時約 8.8 GB）。 |

    預設模型：`embeddinggemma-300m-qat-Q8_0.gguf`（約 0.6 GB，自動下載）。封裝安裝在設定 `provider: "local"` 時，會透過受管理的 Plugin 執行階段相依套件修復原生 `node-llama-cpp` 執行階段。原始碼簽出仍需要原生建置核准：先執行 `pnpm approve-builds`，再執行 `pnpm rebuild node-llama-cpp`。

    使用獨立 CLI 驗證 Gateway 使用的同一個提供者路徑：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    如果 `provider` 是 `auto`，只有在 `local.modelPath` 指向現有本機檔案時，才會選取 `local`。`hf:` 和 HTTP(S) 模型參照仍可搭配 `provider: "local"` 明確使用，但在模型可於磁碟上取得之前，它們不會讓 `auto` 選取本機。

  </Accordion>
</AccordionGroup>

### 內嵌嵌入逾時

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆寫記憶索引期間內嵌嵌入批次的逾時時間。

未設定時會使用提供者預設值：本機/自託管提供者（例如 `local`、`ollama` 和 `lmstudio`）為 600 秒，託管提供者為 120 秒。當本機 CPU 受限的嵌入批次正常但速度較慢時，請增加此值。
</ParamField>

---

## 混合搜尋設定

全部位於 `memorySearch.query.hybrid` 之下：

| 鍵                    | 類型      | 預設值 | 說明                       |
| --------------------- | --------- | ------ | -------------------------- |
| `enabled`             | `boolean` | `true` | 啟用混合 BM25 + 向量搜尋   |
| `vectorWeight`        | `number`  | `0.7`  | 向量分數權重（0-1）        |
| `textWeight`          | `number`  | `0.3`  | BM25 分數權重（0-1）       |
| `candidateMultiplier` | `number`  | `4`    | 候選池大小倍率             |

<Tabs>
  <Tab title="MMR（多樣性）">
    | 鍵            | 類型      | 預設值  | 說明                             |
    | ------------- | --------- | ------- | -------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | 啟用 MMR 重新排序                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多樣性，1 = 最大相關性   |
  </Tab>
  <Tab title="時間衰減（近期性）">
    | 鍵                           | 類型      | 預設值 | 說明                |
    | ---------------------------- | --------- | ------ | ------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 啟用近期性提升      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | 每 N 天分數減半     |

    常青檔案（`MEMORY.md`、`memory/` 中未標日期的檔案）永不衰減。

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

| 鍵           | 類型       | 說明                         |
| ------------ | ---------- | ---------------------------- |
| `extraPaths` | `string[]` | 要建立索引的其他目錄或檔案   |

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

路徑可以是絕對路徑或相對於工作區的路徑。目錄會以遞迴方式掃描 `.md` 檔案。符號連結處理方式取決於使用中的後端：內建引擎會忽略符號連結，而 QMD 會遵循底層 QMD 掃描器行為。

若要進行代理範圍的跨代理逐字稿搜尋，請使用 `agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。這些額外集合遵循相同的 `{ path, name, pattern? }` 形狀，但會依每個代理合併，且當路徑指向目前工作區之外時，可以保留明確的共用名稱。如果相同的解析後路徑同時出現在 `memory.qmd.paths` 和 `memorySearch.qmd.extraCollections` 中，QMD 會保留第一個項目並略過重複項目。

---

## 多模態記憶（Gemini）

使用 Gemini Embedding 2 將圖片和音訊與 Markdown 一起建立索引：

| 鍵                        | 類型       | 預設值     | 說明                                   |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 啟用多模態索引                         |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | 建立索引的最大檔案大小                 |

<Note>
僅適用於 `extraPaths` 中的檔案。預設記憶根目錄仍只限 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必須為 `"none"`。
</Note>

支援格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（圖片）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音訊）。

---

## 嵌入快取

| 鍵                 | 類型      | 預設值  | 說明                         |
| ------------------ | --------- | ------- | ---------------------------- |
| `cache.enabled`    | `boolean` | `false` | 在 SQLite 中快取區塊嵌入     |
| `cache.maxEntries` | `number`  | `50000` | 最大快取嵌入數量             |

防止在重新建立索引或逐字稿更新期間，對未變更的文字重新建立嵌入。

---

## 批次索引

| 鍵                            | 類型      | 預設值  | 說明             |
| ----------------------------- | --------- | ------- | ---------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 平行內嵌嵌入     |
| `remote.batch.enabled`        | `boolean` | `false` | 啟用批次嵌入 API |
| `remote.batch.concurrency`    | `number`  | `2`     | 平行批次工作     |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批次完成     |
| `remote.batch.pollIntervalMs` | `number`  | --      | 輪詢間隔         |
| `remote.batch.timeoutMinutes` | `number`  | --      | 批次逾時         |

可用於 `openai`、`gemini` 和 `voyage`。OpenAI 批次通常是大型回填最快且最便宜的選項。

`remote.nonBatchConcurrency` 控制本機/自託管提供者，以及未啟用提供者批次 API 時託管提供者所使用的內嵌嵌入呼叫。Ollama 對非批次索引預設為 `1`，以避免壓垮較小的本機主機；在較大型機器上可設定更高的值。

這與 `sync.embeddingBatchTimeoutSeconds` 分開，後者控制內嵌嵌入呼叫的逾時時間。

---

## 工作階段記憶搜尋（實驗性）

建立工作階段逐字稿索引，並透過 `memory_search` 顯示：

| 鍵                            | 類型       | 預設值       | 說明                           |
| ----------------------------- | ---------- | ------------ | ------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 啟用工作階段索引               |
| `sources`                     | `string[]` | `["memory"]` | 加入 `"sessions"` 以包含逐字稿 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 重新索引的位元組閾值           |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 重新索引的訊息閾值             |

<Warning>
工作階段索引為選擇加入，並以非同步方式執行。結果可能稍微過時。工作階段記錄位於磁碟上，因此請將檔案系統存取視為信任邊界。
</Warning>

---

## SQLite 向量加速（sqlite-vec）

| 鍵                           | 類型      | 預設值 | 說明                         |
| ---------------------------- | --------- | ------ | ---------------------------- |
| `store.vector.enabled`       | `boolean` | `true` | 使用 sqlite-vec 進行向量查詢 |
| `store.vector.extensionPath` | `string`  | 隨附   | 覆寫 sqlite-vec 路徑         |

當 sqlite-vec 無法使用時，OpenClaw 會自動退回到程序內餘弦相似度。

---

## 索引儲存

| 鍵                    | 類型     | 預設值                                | 說明                                  |
| --------------------- | -------- | ------------------------------------- | ------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | 索引位置（支援 `{agentId}` 權杖）     |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 tokenizer（`unicode61` 或 `trigram`） |

---

## QMD 後端設定

設定 `memory.backend = "qmd"` 以啟用。所有 QMD 設定位於 `memory.qmd` 之下：

| 鍵                       | 類型      | 預設值   | 說明                                                                                  |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 可執行檔路徑；當服務的 `PATH` 與你的 shell 不同時，請設定絕對路徑 |
| `searchMode`             | `string`  | `search` | 搜尋命令：`search`、`vsearch`、`query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | 自動索引 `MEMORY.md` + `memory/**/*.md`                                             |
| `paths[]`                | `array`   | --       | 額外路徑：`{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | 索引工作階段逐字稿                                                             |
| `sessions.retentionDays` | `number`  | --       | 逐字稿保留期間                                                                  |
| `sessions.exportDir`     | `string`  | --       | 匯出目錄                                                                      |

`searchMode: "search"` 僅使用詞彙/BM25。OpenClaw 不會為該模式執行語意向量就緒探測或 QMD 嵌入維護，包括在 `memory status --deep` 期間；`vsearch` 和 `query` 仍然需要 QMD 向量就緒狀態與嵌入。

OpenClaw 偏好目前的 QMD 集合與 MCP 查詢形狀，但會在需要時嘗試相容的集合模式旗標與較舊的 MCP 工具名稱，以維持較舊 QMD 版本可用。當 QMD 宣告支援多個集合篩選器時，會使用一個 QMD 程序搜尋同來源集合；較舊的 QMD 建置會保留逐集合相容路徑。同來源表示持久記憶集合會分組在一起，而工作階段逐字稿集合會保留為獨立群組，因此來源多樣化仍同時具備兩種輸入。

<Note>
QMD 模型覆寫保留在 QMD 端，而不是 OpenClaw 設定。如果你需要全域覆寫 QMD 的模型，請在 Gateway 執行階段環境中設定環境變數，例如 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL`。
</Note>

<AccordionGroup>
  <Accordion title="更新排程">
    | 鍵                        | 類型      | 預設值 | 說明                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | 重新整理間隔                      |
    | `update.debounceMs`       | `number`  | `15000` | 檔案變更防彈跳                 |
    | `update.onBoot`           | `boolean` | `true`  | 當長駐 QMD 管理器開啟時重新整理；也會控管選擇啟用的啟動重新整理 |
    | `update.startup`          | `string`  | `off`   | 選用的 Gateway 啟動重新整理：`off`、`idle` 或 `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | 執行 `startup: "idle"` 重新整理前的延遲 |
    | `update.waitForBootSync`  | `boolean` | `false` | 阻擋管理器開啟，直到其初始重新整理完成 |
    | `update.embedInterval`    | `string`  | --      | 獨立的嵌入節奏                |
    | `update.commandTimeoutMs` | `number`  | --      | QMD 命令的逾時              |
    | `update.updateTimeoutMs`  | `number`  | --      | QMD 更新操作的逾時     |
    | `update.embedTimeoutMs`   | `number`  | --      | QMD 嵌入操作的逾時      |
  </Accordion>
  <Accordion title="限制">
    | 鍵                        | 類型     | 預設值 | 說明                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | 搜尋結果上限         |
    | `limits.maxSnippetChars`  | `number` | --      | 限制片段長度       |
    | `limits.maxInjectedChars` | `number` | --      | 限制注入字元總數 |
    | `limits.timeoutMs`        | `number` | `4000`  | 搜尋逾時             |
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

    隨附的預設值允許直接與頻道工作階段，同時仍拒絕群組。

    預設值僅限 DM。`match.keyPrefix` 會比對正規化後的工作階段鍵；`match.rawKeyPrefix` 會比對包含 `agent:<id>:` 的原始鍵。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 適用於所有後端：

    | 值               | 行為                                                |
    | ---------------- | --------------------------------------------------- |
    | `auto`（預設） | 在片段中包含 `Source: <path#line>` 頁尾    |
    | `on`             | 一律包含頁尾                               |
    | `off`            | 省略頁尾（路徑仍會在內部傳遞給代理） |

  </Accordion>
</AccordionGroup>

QMD 開機重新整理會在 Gateway 啟動期間使用一次性子程序路徑。當記憶搜尋開啟供互動使用時，長駐 QMD 管理器仍負責一般檔案監看器與間隔計時器。

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

## Dreaming

Dreaming 設定在 `plugins.entries.memory-core.config.dreaming` 下，而不是 `agents.defaults.memorySearch` 下。

Dreaming 會作為一個排程掃描執行，並將內部的 light/deep/REM 階段作為實作細節使用。

關於概念行為與斜線命令，請參閱 [Dreaming](/zh-TW/concepts/dreaming)。

### 使用者設定

| 鍵          | 類型      | 預設值        | 說明                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | 完全啟用或停用 Dreaming               |
| `frequency` | `string`  | `0 3 * * *`   | 完整 Dreaming 掃描的選用 cron 節奏 |
| `model`     | `string`  | 預設模型 | 選用的 Dream Diary 子代理模型覆寫      |

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
- Dreaming 會將機器狀態寫入 `memory/.dreams/`。
- Dreaming 會將人類可讀的敘事輸出寫入 `DREAMS.md`（或既有的 `dreams.md`）。
- `dreaming.model` 使用既有的 Plugin 子代理信任閘門；請先設定 `plugins.entries.memory-core.subagent.allowModelOverride: true` 再啟用它。
- 當設定的模型無法使用時，Dream Diary 會使用工作階段預設模型重試一次。信任或允許清單失敗會被記錄，且不會靜默重試。
- light/deep/REM 階段政策與閾值是內部行為，不是使用者可見的設定。

</Note>

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [記憶概觀](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
