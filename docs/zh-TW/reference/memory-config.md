---
read_when:
    - 您想設定記憶搜尋提供者或嵌入模型
    - 您想設定 QMD 後端
    - 你想要微調混合搜尋、MMR 或時間衰減
    - 您想要啟用多模態記憶索引
sidebarTitle: Memory config
summary: 記憶搜尋、嵌入提供者、QMD、混合搜尋和多模態索引的所有設定選項
title: 記憶設定參考
x-i18n:
    generated_at: "2026-04-30T03:37:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

此頁列出 OpenClaw 記憶搜尋的所有設定選項。如需概念概覽，請參閱：

<CardGroup cols={2}>
  <Card title="記憶概覽" href="/zh-TW/concepts/memory">
    記憶的運作方式。
  </Card>
  <Card title="內建引擎" href="/zh-TW/concepts/memory-builtin">
    預設 SQLite 後端。
  </Card>
  <Card title="QMD 引擎" href="/zh-TW/concepts/memory-qmd">
    本地優先的 sidecar。
  </Card>
  <Card title="記憶搜尋" href="/zh-TW/concepts/memory-search">
    搜尋管線與調校。
  </Card>
  <Card title="Active memory" href="/zh-TW/concepts/active-memory">
    互動式工作階段的記憶子代理。
  </Card>
</CardGroup>

除非另有註明，所有記憶搜尋設定都位於 `openclaw.json` 的 `agents.defaults.memorySearch` 之下。

<Note>
如果你正在尋找 **active memory** 功能切換與子代理設定，它位於 `plugins.entries.active-memory` 之下，而不是 `memorySearch`。

Active memory 使用雙閘門模型：

1. Plugin 必須啟用並鎖定目前的代理 ID
2. 請求必須是符合資格的互動式持久聊天工作階段

請參閱 [Active Memory](/zh-TW/concepts/active-memory)，了解啟用模型、Plugin 擁有的設定、轉錄保存，以及安全推出模式。
</Note>

---

## 提供者選擇

| 鍵        | 類型      | 預設值          | 說明                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | 自動偵測    | 嵌入介面卡 ID，例如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai` 或 `voyage`；也可以是已設定的 `models.providers.<id>`，其 `api` 指向其中一個介面卡 |
| `model`    | `string`  | 提供者預設值 | 嵌入模型名稱                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`         | 主要項目失敗時使用的備援介面卡 ID                                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`           | 啟用或停用記憶搜尋                                                                                                                                                                                                    |

### 自動偵測順序

當未設定 `provider` 時，OpenClaw 會選擇第一個可用項目：

<Steps>
  <Step title="local">
    如果已設定 `memorySearch.local.modelPath` 且檔案存在，則選取。
  </Step>
  <Step title="github-copilot">
    如果可解析 GitHub Copilot 權杖（環境變數或驗證設定檔），則選取。
  </Step>
  <Step title="openai">
    如果可解析 OpenAI 金鑰，則選取。
  </Step>
  <Step title="gemini">
    如果可解析 Gemini 金鑰，則選取。
  </Step>
  <Step title="voyage">
    如果可解析 Voyage 金鑰，則選取。
  </Step>
  <Step title="mistral">
    如果可解析 Mistral 金鑰，則選取。
  </Step>
  <Step title="deepinfra">
    如果可解析 DeepInfra 金鑰，則選取。
  </Step>
  <Step title="bedrock">
    如果 AWS SDK 憑證鏈可解析（執行個體角色、存取金鑰、設定檔、SSO、Web 身分或共用設定），則選取。
  </Step>
</Steps>

支援 `ollama`，但不會自動偵測（請明確設定）。

### 自訂提供者 ID

`memorySearch.provider` 可以指向自訂的 `models.providers.<id>` 項目。OpenClaw 會解析該提供者的 `api` 擁有者作為嵌入介面卡，同時保留自訂提供者 ID，用於端點、驗證與模型前綴處理。這可讓多 GPU 或多主機設定將記憶嵌入專用於特定本地端點：

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
| Ollama         | `OLLAMA_API_KEY`（佔位符）                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth 僅涵蓋聊天/補全，不滿足嵌入請求。
</Note>

---

## 遠端端點設定

用於自訂 OpenAI 相容端點或覆寫提供者預設值：

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

## 提供者特定設定

<AccordionGroup>
  <Accordion title="Gemini">
    | 鍵                    | 類型     | 預設值                | 說明                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | 也支援 `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | 用於 Embedding 2：768、1536 或 3072        |

    <Warning>
    變更模型或 `outputDimensionality` 會觸發自動完整重新索引。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 相容輸入類型">
    OpenAI 相容嵌入端點可選擇使用提供者特定的 `input_type` 請求欄位。這對於需要為查詢與文件嵌入使用不同標籤的非對稱嵌入模型很有用。

    | 鍵                 | 類型     | 預設值 | 說明                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | 未設定   | 查詢與文件嵌入共用的 `input_type`   |
    | `queryInputType`    | `string` | 未設定   | 查詢時的 `input_type`；覆寫 `inputType`          |
    | `documentInputType` | `string` | 未設定   | 索引/文件 `input_type`；覆寫 `inputType`      |

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

    變更這些值會影響提供者批次索引的嵌入快取識別；當上游模型對標籤採取不同處理時，應接著重新索引記憶。

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock 使用 AWS SDK 預設憑證鏈，不需要 API 金鑰。如果 OpenClaw 在 EC2 上執行，且具備啟用 Bedrock 的執行個體角色，只需設定提供者與模型：

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
    | `outputDimensionality` | `number` | 模型預設值                  | 用於 Titan V2：256、512 或 1024 |

    **支援的模型**（包含系列偵測與維度預設值）：

    | 模型 ID                                   | 提供者   | 預設維度 | 可設定維度    |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256、512、1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256、384、1024、3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    帶有吞吐量後綴的變體（例如 `amazon.titan-embed-text-v1:2:8k`）會繼承基礎模型的設定。

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

    若採用最低權限，請將 `InvokeModel` 範圍限制於特定模型：

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="本機 (GGUF + node-llama-cpp)">
    | 鍵                    | 類型               | 預設值                 | 說明                                                                                                                                                                                                                                                                                                                  |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自動下載               | GGUF 模型檔案的路徑                                                                                                                                                                                                                                                                                                  |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 預設值  | 已下載模型的快取目錄                                                                                                                                                                                                                                                                                                  |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入內容的上下文視窗大小。4096 可涵蓋一般區塊（128–512 個 token），同時限制非權重 VRAM。在資源受限的主機上可降低至 1024–2048。`"auto"` 會使用模型訓練時的最大值，不建議用於 8B+ 模型（Qwen3-Embedding-8B：40 960 個 token → 約 32 GB VRAM，相較於 4096 時約 8.8 GB）。 |

    預設模型：`embeddinggemma-300m-qat-Q8_0.gguf`（約 0.6 GB，自動下載）。需要原生建置：先執行 `pnpm approve-builds`，再執行 `pnpm rebuild node-llama-cpp`。

    使用獨立 CLI 來驗證 Gateway 使用的同一個提供者路徑：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    如果 `provider` 是 `auto`，只有在 `local.modelPath` 指向現有本機檔案時，才會選取 `local`。`hf:` 與 HTTP(S) 模型參照仍可透過 `provider: "local"` 明確使用，但在模型可於磁碟上使用之前，它們不會讓 `auto` 選取本機。

  </Accordion>
</AccordionGroup>

### 內嵌嵌入逾時

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆寫記憶索引期間內嵌嵌入批次的逾時時間。

未設定時會使用提供者預設值：本機/自行託管提供者（例如 `local`、`ollama` 和 `lmstudio`）為 600 秒，託管提供者為 120 秒。當本機受 CPU 限制的嵌入批次運作正常但速度較慢時，請增加此值。
</ParamField>

---

## 混合搜尋設定

全部位於 `memorySearch.query.hybrid` 下：

| 鍵                    | 類型      | 預設值 | 說明                            |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | 啟用混合 BM25 + 向量搜尋 |
| `vectorWeight`        | `number`  | `0.7`   | 向量分數的權重（0-1）     |
| `textWeight`          | `number`  | `0.3`   | BM25 分數的權重（0-1）       |
| `candidateMultiplier` | `number`  | `4`     | 候選池大小倍數     |

<Tabs>
  <Tab title="MMR（多樣性）">
    | 鍵            | 類型      | 預設值 | 說明                              |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | 啟用 MMR 重新排序                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多樣性，1 = 最大相關性 |
  </Tab>
  <Tab title="時間衰減（新近度）">
    | 鍵                           | 類型      | 預設值 | 說明                    |
    | ---------------------------- | --------- | ------- | ------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 啟用新近度加權      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | 分數每 N 天減半 |

    長青檔案（`MEMORY.md`、`memory/` 中未標日期的檔案）永遠不會衰減。

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

| 鍵           | 類型       | 說明                                      |
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

路徑可以是絕對路徑，也可以是相對於工作區的路徑。系統會遞迴掃描目錄中的 `.md` 檔案。符號連結處理取決於作用中的後端：內建引擎會忽略符號連結，而 QMD 則遵循底層 QMD 掃描器行為。

對於以代理程式為範圍的跨代理程式記錄搜尋，請使用 `agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。這些額外集合遵循相同的 `{ path, name, pattern? }` 形狀，但會依代理程式合併，並且在路徑指向目前工作區之外時，可以保留明確的共用名稱。如果相同的已解析路徑同時出現在 `memory.qmd.paths` 和 `memorySearch.qmd.extraCollections` 中，QMD 會保留第一個項目並略過重複項目。

---

## 多模態記憶（Gemini）

使用 Gemini Embedding 2 將圖片與音訊連同 Markdown 一起建立索引：

| 鍵                        | 類型       | 預設值     | 說明                                 |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 啟用多模態索引             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | 建立索引的最大檔案大小             |

<Note>
僅適用於 `extraPaths` 中的檔案。預設記憶根目錄仍然僅限 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必須是 `"none"`。
</Note>

支援的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（影像）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音訊）。

---

## 嵌入快取

| 鍵                 | 類型      | 預設值  | 描述                         |
| ------------------ | --------- | ------- | ---------------------------- |
| `cache.enabled`    | `boolean` | `false` | 在 SQLite 中快取區塊嵌入    |
| `cache.maxEntries` | `number`  | `50000` | 最大快取嵌入數               |

避免在重新索引或逐字稿更新期間重新嵌入未變更的文字。

---

## 批次索引

| 鍵                            | 類型      | 預設值 | 描述               |
| ----------------------------- | --------- | ------ | ------------------ |
| `remote.nonBatchConcurrency`  | `number`  | `4`    | 平行內嵌嵌入       |
| `remote.batch.enabled`        | `boolean` | `false` | 啟用批次嵌入 API  |
| `remote.batch.concurrency`    | `number`  | `2`    | 平行批次作業       |
| `remote.batch.wait`           | `boolean` | `true` | 等待批次完成       |
| `remote.batch.pollIntervalMs` | `number`  | --     | 輪詢間隔           |
| `remote.batch.timeoutMinutes` | `number`  | --     | 批次逾時           |

適用於 `openai`、`gemini` 和 `voyage`。對於大型回填，OpenAI 批次通常最快且成本最低。

`remote.nonBatchConcurrency` 控制本機/自託管提供者使用的內嵌嵌入呼叫，以及提供者批次 API 未啟用時託管提供者使用的內嵌嵌入呼叫。Ollama 的非批次索引預設為 `1`，以避免讓較小的本機主機負載過重；在較大的機器上可設定較高的值。

這與 `sync.embeddingBatchTimeoutSeconds` 分開，後者控制內嵌嵌入呼叫的逾時。

---

## 工作階段記憶搜尋（實驗性）

索引工作階段逐字稿，並透過 `memory_search` 顯示：

| 鍵                            | 類型       | 預設值       | 描述                         |
| ----------------------------- | ---------- | ------------ | ---------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 啟用工作階段索引             |
| `sources`                     | `string[]` | `["memory"]` | 加入 `"sessions"` 以包含逐字稿 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 重新索引的位元組閾值         |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 重新索引的訊息閾值           |

<Warning>
工作階段索引為選用，且會非同步執行。結果可能稍微過時。工作階段記錄位於磁碟上，因此請將檔案系統存取視為信任邊界。
</Warning>

---

## SQLite 向量加速（sqlite-vec）

| 鍵                           | 類型      | 預設值 | 描述                         |
| ---------------------------- | --------- | ------ | ---------------------------- |
| `store.vector.enabled`       | `boolean` | `true` | 使用 sqlite-vec 進行向量查詢 |
| `store.vector.extensionPath` | `string`  | 隨附   | 覆寫 sqlite-vec 路徑         |

當 sqlite-vec 無法使用時，OpenClaw 會自動退回使用程序內餘弦相似度。

---

## 索引儲存

| 鍵                    | 類型     | 預設值                                | 描述                                   |
| --------------------- | -------- | ------------------------------------- | -------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | 索引位置（支援 `{agentId}` 權杖）      |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 tokenizer（`unicode61` 或 `trigram`） |

---

## QMD 後端設定

設定 `memory.backend = "qmd"` 以啟用。所有 QMD 設定都位於 `memory.qmd` 下：

| 鍵                       | 類型      | 預設值   | 描述                                                                               |
| ------------------------ | --------- | -------- | ---------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 可執行檔路徑；當服務 `PATH` 與你的 shell 不同時，請設定絕對路徑              |
| `searchMode`             | `string`  | `search` | 搜尋命令：`search`、`vsearch`、`query`                                             |
| `includeDefaultMemory`   | `boolean` | `true`   | 自動索引 `MEMORY.md` + `memory/**/*.md`                                            |
| `paths[]`                | `array`   | --       | 額外路徑：`{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | 索引工作階段逐字稿                                                                 |
| `sessions.retentionDays` | `number`  | --       | 逐字稿保留                                                                         |
| `sessions.exportDir`     | `string`  | --       | 匯出目錄                                                                           |

`searchMode: "search"` 僅使用詞彙/BM25。OpenClaw 不會針對該模式執行語意向量就緒探測或 QMD 嵌入維護，包括在 `memory status --deep` 期間；`vsearch` 和 `query` 仍然需要 QMD 向量就緒狀態與嵌入。

OpenClaw 偏好目前的 QMD collection 與 MCP 查詢形狀，但會在需要時嘗試相容的 collection pattern 旗標和較舊的 MCP tool 名稱，以維持較舊 QMD 版本可用。當 QMD 宣告支援多個 collection filters 時，同來源 collections 會以單一 QMD process 搜尋；較舊的 QMD build 則保留逐 collection 的相容路徑。同來源表示 durable memory collections 會分在同一組，而 session transcript collections 仍會保留為獨立群組，因此 source diversification 仍同時具備兩種輸入。

<Note>
QMD model overrides 保留在 QMD 端，而不是 OpenClaw config。如果你需要全域覆寫 QMD 的 models，請在 Gateway runtime environment 中設定環境變數，例如 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL`。
</Note>

<AccordionGroup>
  <Accordion title="更新排程">
    | Key                       | Type      | Default | Description                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | 重新整理間隔                      |
    | `update.debounceMs`       | `number`  | `15000` | 對檔案變更進行 debounce                 |
    | `update.onBoot`           | `boolean` | `true`  | 在 long-lived QMD manager 開啟時重新整理；也會管控選擇啟用的 startup refresh |
    | `update.startup`          | `string`  | `off`   | 選用的 gateway-start refresh：`off`、`idle` 或 `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | 執行 `startup: "idle"` refresh 前的延遲 |
    | `update.waitForBootSync`  | `boolean` | `false` | 阻擋 manager 開啟，直到其初始重新整理完成 |
    | `update.embedInterval`    | `string`  | --      | 獨立的 embed cadence                |
    | `update.commandTimeoutMs` | `number`  | --      | QMD commands 的逾時              |
    | `update.updateTimeoutMs`  | `number`  | --      | QMD update operations 的逾時     |
    | `update.embedTimeoutMs`   | `number`  | --      | QMD embed operations 的逾時      |
  </Accordion>
  <Accordion title="限制">
    | Key                       | Type     | Default | Description                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | 搜尋結果上限         |
    | `limits.maxSnippetChars`  | `number` | --      | 限制 snippet 長度       |
    | `limits.maxInjectedChars` | `number` | --      | 限制注入字元總數 |
    | `limits.timeoutMs`        | `number` | `4000`  | 搜尋逾時             |
  </Accordion>
  <Accordion title="範圍">
    控制哪些 sessions 可以接收 QMD 搜尋結果。Schema 與 [`session.sendPolicy`](/zh-TW/gateway/config-agents#session) 相同：

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

    隨附的預設值允許 direct 和 channel sessions，同時仍拒絕 groups。

    預設為僅 DM。`match.keyPrefix` 會比對標準化後的 session key；`match.rawKeyPrefix` 會比對包含 `agent:<id>:` 的 raw key。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 適用於所有 backends：

    | Value            | Behavior                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto`（預設） | 在 snippets 中包含 `Source: <path#line>` footer    |
    | `on`             | 一律包含 footer                               |
    | `off`            | 省略 footer（path 仍會在內部傳給 agent） |

  </Accordion>
</AccordionGroup>

QMD boot refreshes 會在 Gateway startup 期間使用一次性的 subprocess 路徑。當 memory search 開啟以供互動使用時，long-lived QMD manager 仍負責一般的 file watcher 與 interval timers。

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

Dreaming 設定於 `plugins.entries.memory-core.config.dreaming`，而不是 `agents.defaults.memorySearch`。

Dreaming 會作為單一排程 sweep 執行，並將內部 light/deep/REM phases 作為實作細節使用。

概念行為與 slash commands，請參閱 [Dreaming](/zh-TW/concepts/dreaming)。

### 使用者設定

| Key         | Type      | Default       | Description                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | 完全啟用或停用 dreaming               |
| `frequency` | `string`  | `0 3 * * *`   | 完整 dreaming sweep 的選用 cron cadence |
| `model`     | `string`  | default model | 選用的 Dream Diary subagent model override      |

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
- Dreaming 會將人類可讀的敘事輸出寫入 `DREAMS.md`（或現有的 `dreams.md`）。
- `dreaming.model` 會使用現有的 plugin subagent trust gate；請先設定 `plugins.entries.memory-core.subagent.allowModelOverride: true` 再啟用。
- 當設定的 model 無法使用時，Dream Diary 會使用 session default model 重試一次。Trust 或 allowlist 失敗會被記錄，且不會靜默重試。
- light/deep/REM phase policy 與 thresholds 是內部行為，不是面向使用者的 config。

</Note>

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference)
- [記憶概觀](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
