---
read_when:
    - 你想設定記憶搜尋提供者或嵌入模型
    - 你想要設定 QMD 後端
    - 你想要調校混合搜尋、MMR 或時間衰減
    - 你想要啟用多模態記憶索引功能
sidebarTitle: Memory config
summary: 記憶搜尋、嵌入提供者、QMD、混合搜尋與多模態索引的所有設定選項
title: 記憶設定參考資料
x-i18n:
    generated_at: "2026-07-12T14:48:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
    source_path: reference/memory-config.md
    workflow: 16
---

此頁面列出 OpenClaw 記憶搜尋的所有設定選項。如需概念性概覽，請參閱：

<CardGroup cols={2}>
  <Card title="記憶概覽" href="/zh-TW/concepts/memory">
    記憶的運作方式。
  </Card>
  <Card title="內建引擎" href="/zh-TW/concepts/memory-builtin">
    預設 SQLite 後端。
  </Card>
  <Card title="QMD 引擎" href="/zh-TW/concepts/memory-qmd">
    本機優先的附屬程序。
  </Card>
  <Card title="記憶搜尋" href="/zh-TW/concepts/memory-search">
    搜尋管線與調校。
  </Card>
  <Card title="主動記憶" href="/zh-TW/concepts/active-memory">
    供互動式工作階段使用的記憶子代理程式。
  </Card>
</CardGroup>

除非另有註明，所有記憶搜尋設定都位於 `openclaw.json` 的 `agents.defaults.memorySearch` 下（或每個代理程式的 `agents.list[].memorySearch` 覆寫設定）。

<Note>
如果你要尋找的是**主動記憶**功能的切換開關與子代理程式設定，它位於 `plugins.entries.active-memory` 下，而不是 `memorySearch`。

主動記憶採用雙閘門模型：

1. 外掛必須已啟用，且以目前的代理程式 ID 為目標
2. 請求必須是符合條件的互動式持久聊天工作階段

如需啟用模型、外掛所擁有的設定、對話記錄持久化及安全推出模式，請參閱[主動記憶](/zh-TW/concepts/active-memory)。
</Note>

---

## 提供者選擇

| 鍵         | 類型      | 預設值           | 說明                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | 啟用或停用記憶搜尋                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | 嵌入轉接器 ID，例如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`openai-compatible` 或 `voyage`；也可以是已設定的 `models.providers.<id>`，其 `api` 指向記憶嵌入轉接器或 OpenAI 相容模型 API |
| `model`    | `string`  | 提供者預設值 | 嵌入模型名稱                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | 主要轉接器失敗時使用的備援轉接器 ID                                                                                                                                                                                                                                                  |

未設定 `provider` 時，OpenClaw 會使用 OpenAI 嵌入。若要使用 Bedrock、DeepInfra、Gemini、GitHub Copilot、Mistral、Ollama、Voyage、本機 GGUF 模型或 OpenAI 相容的 `/v1/embeddings` 端點，請明確設定 `provider`。仍使用 `provider: "auto"` 的舊版設定會解析為 `openai`。

<Warning>
變更嵌入提供者、模型、提供者設定、來源、範圍、分塊方式或 tokenizer，可能會使現有的 SQLite 向量索引不相容。OpenClaw 會暫停向量搜尋並回報索引身分警告，而不會自動重新嵌入所有內容。準備就緒後，請使用 `openclaw memory status --index --agent <id>` 或 `openclaw memory index --force --agent <id>` 重建索引。
</Warning>

當未設定 `provider`、存在舊版 `provider: "auto"`，或使用 `provider: "none"` 刻意選擇僅使用 FTS 的模式時，即使嵌入無法使用，記憶召回仍可使用詞彙 FTS 排名。

明確指定的非本機提供者會採取失敗即關閉策略。如果你將 `memorySearch.provider` 設為具體的遠端提供者，例如 Bedrock、DeepInfra、Gemini、GitHub Copilot、LM Studio、Mistral、Ollama、OpenAI、Voyage 或 OpenAI 相容的自訂提供者，而該提供者在執行階段無法使用，`memory_search` 會傳回無法使用的結果，而不會悄悄改用僅使用 FTS 的召回。請修正提供者／驗證設定、切換至可連線的提供者，或在需要刻意僅使用 FTS 召回時設定 `provider: "none"`。

### 自訂提供者 ID

`memorySearch.provider` 可以指向自訂的 `models.providers.<id>` 項目，用於 `ollama` 等記憶專用提供者轉接器，或 `openai-responses`／`openai-completions` 等 OpenAI 相容模型 API。OpenClaw 會解析該提供者的 `api` 擁有者以取得嵌入轉接器，同時保留自訂提供者 ID，以處理端點、驗證與模型前綴。如此一來，多 GPU 或多主機設定便可將記憶嵌入專門交由特定本機端點處理：

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

### API 金鑰解析

遠端嵌入需要 API 金鑰。Bedrock 則改用 AWS SDK 預設認證資訊鏈（執行個體角色、SSO、存取金鑰或 Bedrock API 金鑰）。

| 提供者       | 環境變數                                             | 設定鍵                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 認證資訊鏈，或 `AWS_BEARER_TOKEN_BEDROCK` | 不需要 API 金鑰                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN`  | 透過裝置登入的驗證設定檔       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（預留值）                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth 僅涵蓋聊天／補全，無法滿足嵌入請求。
</Note>

---

## 遠端端點設定

若要使用不應繼承全域 OpenAI 聊天認證資訊的通用 OpenAI 相容 `/v1/embeddings` 伺服器，請使用 `provider: "openai-compatible"`。

<ParamField path="remote.baseUrl" type="string">
  自訂 API 基底 URL。
</ParamField>
<ParamField path="remote.apiKey" type="string">
  覆寫 API 金鑰。
</ParamField>
<ParamField path="remote.headers" type="object">
  額外的 HTTP 標頭（與提供者預設值合併）。
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

## 提供者專屬設定

<AccordionGroup>
  <Accordion title="Gemini">
    | 鍵                     | 類型     | 預設值                 | 說明                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | 也支援 `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | 適用於 Embedding 2：768、1536 或 3072        |

    <Warning>
    變更模型或 `outputDimensionality` 會改變索引身分。OpenClaw 會暫停向量搜尋，直到你明確重建記憶索引。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 相容輸入類型">
    OpenAI 相容的嵌入端點可以選擇使用提供者專屬的 `input_type` 請求欄位。這對需要為查詢嵌入與文件嵌入使用不同標籤的非對稱嵌入模型很有用。

    | 鍵                  | 類型     | 預設值 | 說明                                             |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | 未設定   | 查詢與文件嵌入共用的 `input_type`   |
    | `queryInputType`    | `string` | 未設定   | 查詢時的 `input_type`；覆寫 `inputType`          |
    | `documentInputType` | `string` | 未設定   | 索引／文件的 `input_type`；覆寫 `inputType`      |

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

    變更這些值會影響提供者批次索引的嵌入快取身分；當上游模型對這些標籤採取不同處理方式時，應於變更後重新建立記憶索引。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 嵌入設定

    Bedrock 使用 AWS SDK 預設認證資訊鏈，以及經 OpenClaw 檢查的持有人權杖，因此不會在設定中儲存 API 金鑰。如果 OpenClaw 在具備 Bedrock 權限之執行個體角色的 EC2 上執行，只需設定提供者與模型：

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

    | 鍵                     | 類型     | 預設值                          | 說明                            |
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任何 Bedrock 嵌入模型 ID  |
    | `outputDimensionality` | `number` | 模型預設值                     | 適用於 Titan V2：256、512 或 1024 |

    **支援的模型**（包含系列偵測與維度預設值）：

    | 模型 ID                                      | 提供者     | 預設維度 | 可設定維度                     |
    | ------------------------------------------- | ---------- | -------- | ------------------------------ |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024     | 256, 512, 1024                 |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536     | --                             |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536     | --                             |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024     | --                             |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024     | 256, 384, 1024, 3072           |
    | `cohere.embed-english-v3`                  | Cohere     | 1024     | --                             |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024     | --                             |
    | `cohere.embed-v4:0`                        | Cohere     | 1536     | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512      | --                             |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024     | --                             |

    帶有輸送量後綴的變體（例如 `amazon.titan-embed-text-v1:2:8k`）和帶有區域前綴的推論設定檔 ID（例如 `us.amazon.titan-embed-text-v2:0`）會繼承基礎模型的設定。

    **區域：**依下列順序解析：`memorySearch.remote.baseUrl` 覆寫值、`models.providers.amazon-bedrock.baseUrl` 設定、`AWS_REGION`、`AWS_DEFAULT_REGION`，最後使用預設值 `us-east-1`。

    **驗證：**OpenClaw 會先檢查 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 或 `AWS_BEARER_TOKEN_BEDROCK`，接著退回使用標準 AWS SDK 預設認證資訊提供者鏈：

    1. 環境變數（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`），除非同時設定了 `AWS_PROFILE`
    2. SSO（僅在已設定 SSO 欄位時）
    3. 共用認證資訊與設定檔（`fromIni`，包含 `AWS_PROFILE`）
    4. 認證資訊程序（AWS 設定檔中的 `credential_process`）
    5. Web 身分權杖認證資訊
    6. ECS 或 EC2 執行個體中繼資料認證資訊

    **IAM 權限：**IAM 角色或使用者需要：

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    為遵循最低權限原則，請將 `InvokeModel` 的範圍限定於特定模型：

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="本機（GGUF + llama.cpp）">
    | 鍵                    | 類型               | 預設值                 | 說明                                                                                                                                                                                                                                                                                                                                              |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自動下載               | GGUF 模型檔案的路徑                                                                                                                                                                                                                                                                                                                               |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 預設值  | 已下載模型的快取目錄                                                                                                                                                                                                                                                                                                                              |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入內容上下文的上下文視窗大小。4096 可涵蓋一般區塊（128-512 個權杖），同時限制非權重 VRAM 的使用量。在資源受限的主機上可降低至 1024-2048。`"auto"` 會使用模型訓練時的最大值——不建議用於 8B 以上的模型（Qwen3-Embedding-8B：最高 40 960 個權杖可能使 VRAM 使用量增至約 32 GB）。 |

    請先安裝官方 llama.cpp 提供者：`openclaw plugins install @openclaw/llama-cpp-provider`。
    預設模型：`embeddinggemma-300m-qat-Q8_0.gguf`（約 0.6 GB，會自動下載）。原始碼簽出仍需要核准原生建置：先執行 `pnpm approve-builds`，再執行 `pnpm rebuild node-llama-cpp`。

    使用獨立命令列介面驗證與閘道相同的提供者路徑：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    數值型 `local.contextSize` 值也會提供給 node-llama-cpp 的自動 GPU 層配置，以便同時容納模型權重與要求的嵌入內容上下文。執行階段載入後，`openclaw memory status --deep` 會回報最後已知的 llama.cpp 後端、裝置、卸載、要求的上下文，以及帶有時間戳記的記憶體資訊；被動狀態檢查不會載入模型。

    若要使用本機 GGUF 嵌入，請明確設定 `provider: "local"`。明確的本機設定支援 `hf:` 和 HTTP(S) 模型參照（透過 node-llama-cpp 的模型解析），但不會變更預設提供者。

  </Accordion>
</AccordionGroup>

### 行內嵌入逾時

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆寫記憶索引期間行內嵌入批次的逾時時間。

未設定時會使用提供者預設值：`local`、`ollama` 和 `lmstudio` 等本機／自託管提供者為 600 秒，託管提供者則為 120 秒。當受本機 CPU 限制的嵌入批次運作正常但速度緩慢時，請增加此值。
</ParamField>

---

## 索引行為

除非另有註明，以下項目皆位於 `memorySearch.sync` 下：

| 鍵                             | 類型      | 預設值 | 說明                                                   |
| ------------------------------ | --------- | ------ | ------------------------------------------------------ |
| `onSessionStart`               | `boolean` | `true` | 工作階段開始時同步記憶索引                             |
| `onSearch`                     | `boolean` | `true` | 偵測到內容變更後，在搜尋時延遲同步                     |
| `watch`                        | `boolean` | `true` | 監看記憶檔案（chokidar），並在變更時排程重新建立索引   |
| `watchDebounceMs`              | `number`  | `1500` | 合併快速檔案監看事件的防彈跳時間範圍                   |
| `intervalMinutes`              | `number`  | `0`    | 定期重新建立索引的間隔分鐘數（`0` 表示停用）           |
| `sessions.postCompactionForce` | `boolean` | `true` | 在壓縮觸發逐字稿更新後，強制重新建立工作階段索引       |

<ParamField path="chunking.tokens" type="number">
  在嵌入前分割記憶來源時使用的權杖區塊大小（預設：400）。
</ParamField>
<ParamField path="chunking.overlap" type="number">
  相鄰區塊之間的權杖重疊量，用於保留分割邊界附近的上下文（預設：80）。
</ParamField>

<Note>
變更 `chunking.tokens` 或 `chunking.overlap` 會改變區塊邊界，並使現有的索引識別失效（請參閱「供應商選擇」下方的警告）。
</Note>

---

## 混合搜尋設定

以下項目皆位於 `memorySearch.query`：

| 鍵           | 類型      | 預設值 | 說明                                         |
| ------------ | --------- | ------ | -------------------------------------------- |
| `maxResults` | `number`  | `6`    | 注入前傳回的記憶命中項目數上限               |
| `minScore`   | `number`  | `0.35` | 納入命中項目的最低相關性分數                 |

以下項目則位於 `memorySearch.query.hybrid`：

| 鍵                    | 類型      | 預設值 | 說明                              |
| --------------------- | --------- | ------ | --------------------------------- |
| `enabled`             | `boolean` | `true` | 啟用 BM25 + 向量混合搜尋          |
| `vectorWeight`        | `number`  | `0.7`  | 向量分數的權重（0-1）             |
| `textWeight`          | `number`  | `0.3`  | BM25 分數的權重（0-1）            |
| `candidateMultiplier` | `number`  | `4`    | 候選集大小的倍數                  |

<Tabs>
  <Tab title="MMR（多樣性）">
    | 鍵            | 類型      | 預設值  | 說明                                  |
    | ------------- | --------- | ------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | 啟用 MMR 重新排序                     |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多樣性，1 = 最大相關性        |
  </Tab>
  <Tab title="時間衰減（新近性）">
    | 鍵                           | 類型      | 預設值  | 說明                       |
    | ---------------------------- | --------- | ------- | -------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 啟用新近性加權             |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | 分數每 N 天減半             |

    常駐檔案（`MEMORY.md`、`memory/` 中不含日期的檔案）永不衰減。

  </Tab>
</Tabs>

### 完整範例

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

## 額外記憶路徑

| 鍵           | 類型       | 說明                         |
| ------------ | ---------- | ---------------------------- |
| `extraPaths` | `string[]` | 要建立索引的額外目錄或檔案   |

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

路徑可以是絕對路徑或相對於工作區的路徑。系統會遞迴掃描目錄中的 `.md` 檔案。符號連結的處理方式取決於使用中的後端：內建引擎會略過符號連結，而 QMD 則遵循其底層 QMD 掃描器的行為。

若要進行代理程式範圍的跨代理程式逐字稿搜尋，請使用 `agents.list[].memorySearch.qmd.extraCollections`，而非 `memory.qmd.paths`。這些額外集合使用相同的 `{ path, name, pattern? }` 結構，但會依代理程式合併；當路徑指向目前工作區以外的位置時，也能保留明確指定的共用名稱。若同一個解析後的路徑同時出現在 `memory.qmd.paths` 與 `memorySearch.qmd.extraCollections` 中，QMD 會保留第一個項目並略過重複項目。

---

## 多模態記憶（Gemini）

使用 Gemini Embedding 2，將圖片和音訊與 Markdown 一併建立索引：

| 鍵                        | 類型       | 預設值     | 說明                                     |
| ------------------------- | ---------- | ---------- | ---------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 啟用多模態索引                           |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]`    |
| `multimodal.maxFileBytes` | `number`   | `10485760` | 建立索引時允許的檔案大小上限（10 MiB）   |

<Note>
僅適用於 `extraPaths` 中的檔案。預設記憶根目錄仍僅支援 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必須為 `"none"`。
</Note>

支援的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（圖片）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音訊）。

---

## 嵌入快取

| 鍵                 | 類型      | 預設值  | 說明                             |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | 在 SQLite 中快取區塊嵌入         |
| `cache.maxEntries` | `number`  | 未設定  | 快取嵌入數量的盡力而為上限       |

在重新建立索引或更新逐字稿時，避免對未變更的文字重新產生嵌入。若要使用無上限快取，請讓 `maxEntries` 保持未設定；當磁碟空間成長比重新建立索引的最高速度更重要時，請設定此值。設定後，一旦快取超過限制，系統會優先清除最舊的項目（依最後更新時間排序）。

---

## 批次索引

| 鍵                            | 類型      | 預設值  | 說明                     |
| ----------------------------- | --------- | ------- | ------------------------ |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 平行處理行內嵌入         |
| `remote.batch.enabled`        | `boolean` | `false` | 啟用批次嵌入 API         |
| `remote.batch.concurrency`    | `number`  | `2`     | 平行批次工作             |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批次完成             |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | 輪詢間隔                 |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | 批次逾時時間             |

適用於 `gemini`、`openai` 和 `voyage`。對於大量回填，OpenAI 批次通常速度最快且成本最低。

`remote.nonBatchConcurrency` 控制本機／自行託管供應商使用的行內嵌入呼叫，以及未啟用供應商批次 API 時託管供應商使用的行內嵌入呼叫。Ollama 的非批次索引預設值為 `1`，以避免讓較小型的本機主機負荷過重；在較大型的機器上可設定較高的值。

這與 `sync.embeddingBatchTimeoutSeconds` 不同，後者控制行內嵌入呼叫的逾時時間。

---

## 工作階段記憶搜尋（實驗性）

為工作階段逐字稿建立索引，並透過 `memory_search` 顯示結果：

| 鍵                            | 類型       | 預設值       | 說明                              |
| ----------------------------- | ---------- | ------------ | --------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 啟用工作階段索引                  |
| `sources`                     | `string[]` | `["memory"]` | 加入 `"sessions"` 以包含逐字稿    |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 觸發重新建立索引的位元組門檻      |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 觸發重新建立索引的訊息數門檻      |

<Warning>
工作階段索引需選擇啟用，且會非同步執行。結果可能略有延遲。工作階段記錄儲存在磁碟上，因此請將檔案系統存取視為信任邊界。
</Warning>

工作階段逐字稿的搜尋結果也遵循
[`tools.sessions.visibility`](/zh-TW/gateway/config-tools#toolssessions)。預設的
`tree` 可見性只會公開目前的工作階段及其衍生的工作階段。若要從不同的
工作階段（例如私訊）回想由閘道分派、屬於同一代理程式但不相關的工作階段，
請刻意將可見性放寬為 `agent`（只有在也需要跨代理程式回想，且代理程式間
政策允許時，才使用 `all`）。

以下範例將這些設定放在 `agents.defaults` 之下。若只有一個代理程式應為
工作階段逐字稿建立索引並進行搜尋，你也可以在個別代理程式覆寫中套用
同等的 `memorySearch` 設定。

若要在同一代理程式中從閘道回想到私訊：

<Tabs>
  <Tab title="內建後端">
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
  <Tab title="QMD 後端">
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

使用 QMD 時，僅設定 `agents.defaults.memorySearch.experimental.sessionMemory` 和
`sources: ["sessions"]` 不會將逐字稿匯出至 QMD。還必須設定
`memory.qmd.sessions.enabled: true`。

---

  ## SQLite 向量加速（sqlite-vec）

  | 鍵                           | 類型      | 預設值  | 說明                         |
  | ---------------------------- | --------- | ------- | ---------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`  | 使用 sqlite-vec 進行向量查詢 |
  | `store.vector.extensionPath` | `string`  | 內建    | 覆寫 sqlite-vec 路徑          |

  當 sqlite-vec 無法使用時，OpenClaw 會自動改用程序內餘弦相似度。

  ---

  ## 索引儲存

  內建記憶索引位於每個代理程式的 OpenClaw SQLite 資料庫中：
  `agents/<agentId>/agent/openclaw-agent.sqlite`。

  | 鍵                    | 類型     | 預設值      | 說明                                      |
  | --------------------- | -------- | ----------- | ----------------------------------------- |
  | `store.fts.tokenizer` | `string` | `unicode61` | FTS5 權杖化器（`unicode61` 或 `trigram`） |

  ---

  ## QMD 後端設定

  設定 `memory.backend = "qmd"` 即可啟用。所有 QMD 設定均位於 `memory.qmd` 下：

  | 鍵                       | 類型      | 預設值   | 說明                                                                                   |
  | ------------------------ | --------- | -------- | -------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`    | QMD 可執行檔路徑；當服務的 `PATH` 與你的殼層不同時，請設定絕對路徑                       |
  | `searchMode`             | `string`  | `search` | 搜尋命令：`search`、`vsearch`、`query`                                                 |
  | `rerank`                 | `boolean` | --       | 搭配 `searchMode: "query"` 與 QMD 2.1+ 設為 `false`，即可略過 QMD 重新排序              |
  | `includeDefaultMemory`   | `boolean` | `true`   | 自動為 `MEMORY.md` + `memory/**/*.md` 建立索引                                         |
  | `paths[]`                | `array`   | --       | 額外路徑：`{ name, path, pattern? }`                                                    |
  | `sessions.enabled`       | `boolean` | `false`  | 將工作階段轉錄內容匯出至 QMD                                                           |
  | `sessions.retentionDays` | `number`  | --       | 轉錄內容保留天數                                                                       |
  | `sessions.exportDir`     | `string`  | --       | 匯出目錄                                                                               |

  `searchMode: "search"` 僅使用詞彙／BM25。OpenClaw 在此模式下不會執行語意向量就緒探測或 QMD 嵌入維護，包括執行 `memory status --deep` 時；`vsearch` 和 `query` 仍需要 QMD 向量就緒並具備嵌入。

  `rerank: false` 僅會變更 QMD `query` 模式，且需要 QMD 2.1 或更新版本。在直接命令列介面模式下，OpenClaw 會傳遞 `--no-rerank`；在由 mcporter 支援的 MCP 模式下，則會將 `rerank: false` 傳遞給 QMD 的統一查詢工具。若要使用 QMD 預設的查詢重新排序行為，請不要設定此項。

  OpenClaw 優先使用目前的 QMD 集合與 MCP 查詢格式，但會在需要時嘗試相容的集合模式旗標和較舊的 MCP 工具名稱，以維持舊版 QMD 的運作。當 QMD 宣告支援多個集合篩選條件時，會使用單一 QMD 程序搜尋相同來源的集合；較舊的 QMD 組建版本則繼續使用逐集合的相容路徑。相同來源表示持久記憶集合（預設記憶檔案加上自訂路徑）會群組在一起，而工作階段轉錄內容集合仍維持為獨立群組，讓來源多樣化仍可同時使用這兩種輸入。

  <Note>
  QMD 模型覆寫項目保留在 QMD 端，不屬於 OpenClaw 設定。如果需要全域覆寫 QMD 的模型，請在閘道執行階段環境中設定 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL` 等環境變數。
  </Note>

  ### mcporter 整合

  全部位於 `memory.qmd.mcporter` 下。透過長時間執行的 `mcporter` MCP 常駐程式路由 QMD 搜尋，而不是每次查詢都產生 `qmd` 程序，藉此降低較大型模型的冷啟動負擔。

  | 鍵            | 類型      | 預設值  | 說明                                                                          |
  | ------------- | --------- | ------- | ----------------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false` | 透過 mcporter 路由 QMD 呼叫，而不是每次請求都產生 `qmd` 程序                  |
  | `serverName`  | `string`  | `qmd`   | 以 `lifecycle: keep-alive` 執行 `qmd mcp` 的 mcporter 伺服器名稱               |
  | `startDaemon` | `boolean` | `true`  | 當 `enabled` 為 true 時，自動啟動 mcporter 常駐程式                            |

  需要安裝 `mcporter` 並使其位於 PATH 中，且須設定執行 `qmd mcp` 的 mcporter 伺服器。對於可接受每次查詢產生程序成本的簡易本機設定，請保持停用。

  <AccordionGroup>
  <Accordion title="更新排程">
    | 鍵                        | 類型      | 預設值   | 說明                                                                         |
    | ------------------------- | --------- | -------- | ---------------------------------------------------------------------------- |
    | `update.interval`         | `string`  | `5m`     | 重新整理間隔                                                                 |
    | `update.debounceMs`       | `number`  | `15000`  | 對檔案變更進行防彈跳處理                                                     |
    | `update.onBoot`           | `boolean` | `true`   | 長時間執行的 QMD 管理器開啟時重新整理；設為 false 可略過啟動時的立即更新     |
    | `update.startup`          | `string`  | `off`    | 選用的閘道啟動 QMD 初始化：`off`、`idle` 或 `immediate`                       |
    | `update.startupDelayMs`   | `number`  | `120000` | 執行 `startup: "idle"` 重新整理前的延遲                                      |
    | `update.waitForBootSync`  | `boolean` | `false`  | 阻擋管理器開啟，直到初始重新整理完成                                         |
    | `update.embedInterval`    | `string`  | `60m`    | 獨立的嵌入執行週期                                                           |
    | `update.commandTimeoutMs` | `number`  | `30000`  | QMD 維護命令（集合列出／新增）的逾時時間                                     |
    | `update.updateTimeoutMs`  | `number`  | `120000` | 每個 `qmd update` 週期的逾時時間                                              |
    | `update.embedTimeoutMs`   | `number`  | `120000` | 每個 `qmd embed` 週期的逾時時間                                               |
  </Accordion>
  <Accordion title="限制">
    | 鍵                        | 類型     | 預設值 | 說明                 |
    | ------------------------- | -------- | ------ | -------------------- |
    | `limits.maxResults`       | `number` | `4`    | 搜尋結果上限         |
    | `limits.maxSnippetChars`  | `number` | `450`  | 限制摘要字元長度     |
    | `limits.maxInjectedChars` | `number` | `2200` | 限制注入字元總數     |
    | `limits.timeoutMs`        | `number` | `4000` | 搜尋逾時時間         |
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

    隨附的預設值僅允許 DM／直接訊息，並拒絕群組和其他頻道類型。`match.keyPrefix` 會比對正規化的工作階段鍵；`match.rawKeyPrefix` 會比對包含 `agent:<id>:` 的原始鍵。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 適用於所有後端：

    | 值               | 行為                                                     |
    | ------------------ | ------------------------------------------------------ |
    | `auto`（預設）   | 在片段中包含 `Source: <path#line>` 頁尾                  |
    | `on`             | 一律包含頁尾                                             |
    | `off`            | 省略頁尾（路徑仍會在內部傳遞給代理程式）                 |

  </Accordion>
</AccordionGroup>

啟用閘道啟動時的 QMD 初始化後，OpenClaw 只會為符合資格的代理程式啟動 QMD。若 `update.onBoot` 為 true，且未設定間隔／嵌入維護，啟動時會使用一次性管理器執行開機重新整理，然後將其關閉。若已設定更新或嵌入間隔，啟動時會開啟長期運作的 QMD 管理器，讓它管理監看器和間隔計時器；`update.onBoot: false` 只會略過立即執行的開機重新整理。

### 完整 QMD 範例

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

## 夢境整理

夢境整理是在 `plugins.entries.memory-core.config.dreaming` 下設定，而不是在 `agents.defaults.memorySearch` 下。

夢境整理會以單次排程掃描方式執行，並將內部的淺層／深層／REM 階段作為實作細節。

如需瞭解概念行為與斜線命令，請參閱[夢境整理](/zh-TW/concepts/dreaming)。

### 使用者設定

| 鍵                                     | 類型      | 預設值        | 說明                                                                                                                           |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | 完全啟用或停用夢境整理                                                                                                         |
| `frequency`                            | `string`  | `0 3 * * *`   | 完整夢境整理掃描的選用排程頻率                                                                                                 |
| `model`                                | `string`  | 預設模型      | 選用的夢境日記子代理程式模型覆寫                                                                                               |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | 從每個提升至 `MEMORY.md` 的短期回憶片段中保留的預估 token 數上限；來源中繼資料仍保持可見                                        |

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
- `dreaming.model` 使用現有的外掛子代理程式信任閘門；請先設定 `plugins.entries.memory-core.subagent.allowModelOverride: true`，再啟用此功能。
- 當設定的模型無法使用時，夢境日記會使用工作階段預設模型重試一次。信任或允許清單失敗會記錄至日誌，且不會在未告知的情況下重試。
- 淺層／深層／REM 階段的政策與門檻屬於內部行為，而非面向使用者的設定。

</Note>

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference)
- [記憶概覽](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
