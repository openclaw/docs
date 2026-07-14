---
read_when:
    - 你想要設定記憶搜尋提供者或嵌入模型
    - 你想要設定 QMD 後端
    - 你想要調整混合搜尋、MMR 或時間衰減機制
    - 你想要啟用多模態記憶索引建立
sidebarTitle: Memory config
summary: 記憶搜尋、嵌入提供者、QMD、混合搜尋與多模態索引的所有設定選項
title: 記憶設定參考資料
x-i18n:
    generated_at: "2026-07-14T13:59:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 1947d6d654de85059ef777a3a6387f6db5b76c8d688fbb539a063162d323c1f6
    source_path: reference/memory-config.md
    workflow: 16
---

此頁列出 OpenClaw 記憶搜尋的所有設定選項。若要瞭解概念概述，請參閱：

<CardGroup cols={2}>
  <Card title="記憶概述" href="/zh-TW/concepts/memory">
    記憶的運作方式。
  </Card>
  <Card title="內建引擎" href="/zh-TW/concepts/memory-builtin">
    預設的 SQLite 後端。
  </Card>
  <Card title="QMD 引擎" href="/zh-TW/concepts/memory-qmd">
    本機優先的輔助程序。
  </Card>
  <Card title="記憶搜尋" href="/zh-TW/concepts/memory-search">
    搜尋管線與調校。
  </Card>
  <Card title="主動記憶" href="/zh-TW/concepts/active-memory">
    用於互動式工作階段的記憶子代理程式。
  </Card>
</CardGroup>

除非另有註明，所有記憶搜尋設定都位於 `agents.defaults.memorySearch` 的 `openclaw.json` 中（或每個代理程式的 `agents.list[].memorySearch` 覆寫設定）。

<Note>
如果你要尋找的是**主動記憶**功能開關與子代理程式設定，它位於 `plugins.entries.active-memory`，而不是 `memorySearch`。

主動記憶採用雙閘門模型：

1. 外掛必須已啟用，且目標為目前的代理程式 ID
2. 要求必須來自符合資格的互動式持久聊天工作階段

如需瞭解啟用模型、外掛擁有的設定、逐字稿持久化與安全推出模式，請參閱[主動記憶](/zh-TW/concepts/active-memory)。
</Note>

---

## 提供者選擇

| 鍵         | 類型      | 預設值           | 說明                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | 啟用或停用記憶搜尋                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | 嵌入配接器 ID，例如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`openai-compatible` 或 `voyage`；也可以是已設定的 `models.providers.<id>`，其 `api` 指向記憶嵌入配接器或 OpenAI 相容模型 API |
| `model`    | `string`  | 提供者預設值 | 嵌入模型名稱                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | 主要配接器失敗時使用的備援配接器 ID                                                                                                                                                                                                                                                  |

未設定 `provider` 時，OpenClaw 會使用 OpenAI 嵌入。若要使用 Bedrock、DeepInfra、Gemini、GitHub Copilot、Mistral、Ollama、
Voyage、本機 GGUF 模型或 OpenAI 相容的 `/v1/embeddings` 端點，請明確設定 `provider`。
仍使用 `provider: "auto"` 的舊版設定會解析為 `openai`。

<Warning>
變更嵌入提供者、模型、提供者設定、來源、範圍、
分塊或權杖化工具，可能會使現有的 SQLite 向量索引不相容。
OpenClaw 會暫停向量搜尋並回報索引身分警告，而不會
自動重新嵌入所有內容。準備好後，請使用
`openclaw memory status --index --agent <id>` 或
`openclaw memory index --force --agent <id>` 重建。
</Warning>

當未設定 `provider`、存在舊版 `provider: "auto"`，或
`provider: "none"` 刻意選取僅限 FTS 模式時，即使嵌入無法使用，
記憶召回仍可使用詞彙式 FTS 排名。

明確指定的非本機提供者會採取關閉式失敗。如果你將 `memorySearch.provider` 設為
具體的遠端提供者，例如 Bedrock、DeepInfra、Gemini、GitHub
Copilot、LM Studio、Mistral、Ollama、OpenAI、Voyage 或 OpenAI 相容的
自訂提供者，而該提供者在執行階段無法使用，`memory_search`
會傳回不可用結果，而不會默默改用僅限 FTS 的召回。請修正
提供者／驗證設定、切換至可連線的提供者，或設定
`provider: "none"` 以刻意使用僅限 FTS 的召回。

### 自訂提供者 ID

`memorySearch.provider` 可以指向自訂的 `models.providers.<id>` 項目，用於記憶專用提供者配接器（例如 `ollama`），或用於 OpenAI 相容模型 API（例如 `openai-responses` / `openai-completions`）。OpenClaw 會解析該提供者的 `api` 擁有者以取得嵌入配接器，同時保留自訂提供者 ID，以處理端點、驗證與模型前綴。這可讓多 GPU 或多主機設定將記憶嵌入交由特定的本機端點處理：

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

| 提供者         | 環境變數                                             | 設定鍵                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 認證資訊鏈或 `AWS_BEARER_TOKEN_BEDROCK` | 不需要 API 金鑰                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN`  | 透過裝置登入取得驗證設定檔       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（預留位置）                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth 僅涵蓋聊天／補全，無法滿足嵌入要求。
</Note>

---

## 遠端端點設定

對於不應繼承全域 OpenAI 聊天認證資訊的通用 OpenAI 相容
`/v1/embeddings` 伺服器，請使用 `provider: "openai-compatible"`。

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

## 提供者特定設定

<AccordionGroup>
  <Accordion title="Gemini">
    | 鍵                     | 類型     | 預設值                 | 說明                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | 也支援 `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | 適用於 Embedding 2：768、1536 或 3072        |

    <Warning>
    變更模型或 `outputDimensionality` 會改變索引身分。OpenClaw
    會暫停向量搜尋，直到你明確重建記憶索引。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 相容輸入類型">
    OpenAI 相容嵌入端點可選擇加入提供者特定的 `input_type` 要求欄位。這適用於需要為查詢與文件嵌入使用不同標籤的非對稱嵌入模型。

    | 鍵                  | 類型     | 預設值 | 說明                                                   |
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

    如果上游模型以不同方式處理這些標籤，變更這些值會影響提供者批次索引的嵌入快取身分，之後應重新建立記憶索引。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 嵌入設定

    Bedrock 使用 AWS SDK 預設認證資訊鏈，以及經 OpenClaw 檢查的持有人權杖，因此設定中不會儲存 API 金鑰。如果 OpenClaw 在具備 Bedrock 功能之執行個體角色的 EC2 上執行，只需設定提供者與模型：

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

    | 鍵                     | 類型     | 預設值                         | 說明                            |
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任何 Bedrock 嵌入模型 ID        |
    | `outputDimensionality` | `number` | 模型預設值                    | 適用於 Titan V2：256、512 或 1024 |

    **支援的模型**（包含系列偵測與維度預設值）：

    | 模型 ID                                   | 提供者   | 預設維度 | 可設定維度          |
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

    帶有輸送量後綴的變體（例如 `amazon.titan-embed-text-v1:2:8k`）和帶有區域前綴的推論設定檔 ID（例如 `us.amazon.titan-embed-text-v2:0`）會繼承基礎模型的設定。

    **區域：**依下列順序解析：`memorySearch.remote.baseUrl` 覆寫、`models.providers.amazon-bedrock.baseUrl` 設定、`AWS_REGION`、`AWS_DEFAULT_REGION`，最後使用預設值 `us-east-1`。

    **驗證：**OpenClaw 會先檢查 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 或 `AWS_BEARER_TOKEN_BEDROCK`，然後依序使用標準 AWS SDK 預設認證資訊提供者鏈：

    1. 環境變數（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`），除非也設定了 `AWS_PROFILE`
    2. SSO（僅限已設定 SSO 欄位時）
    3. 共用認證資訊與設定檔（`fromIni`，包括 `AWS_PROFILE`）
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

    若要遵循最小權限原則，請將 `InvokeModel` 範圍限制為特定模型：

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="本機（GGUF + llama.cpp）">
    | 鍵                   | 類型               | 預設值                | 說明                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自動下載        | GGUF 模型檔案的路徑                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 預設值 | 已下載模型的快取目錄                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入內容脈絡的內容脈絡視窗大小。4096 可涵蓋一般區塊（128-512 個權杖），同時限制權重以外的 VRAM 用量。在資源受限的主機上請降至 1024-2048。`"auto"` 會使用模型訓練時的最大值，不建議用於 8B+ 模型（Qwen3-Embedding-8B：最高 40 960 個權杖可能使 VRAM 用量升至約 32 GB）。 |

    請先安裝官方 llama.cpp 提供者：`openclaw plugins install @openclaw/llama-cpp-provider`。
    預設模型：`embeddinggemma-300m-qat-Q8_0.gguf`（約 0.6 GB，自動下載）。原始碼簽出版本仍需核准原生建置：先執行 `pnpm approve-builds`，再執行 `pnpm rebuild node-llama-cpp`。

    使用獨立命令列介面，驗證與閘道相同的提供者路徑：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    數值型 `local.contextSize` 值也會提供給 node-llama-cpp 的自動 GPU 層配置，使模型權重與要求的嵌入內容脈絡能一併容納。`openclaw memory status --deep` 會在執行階段載入後，回報最近已知的 llama.cpp 後端、裝置、卸載、要求的內容脈絡，以及含時間戳記的記憶體資訊；被動狀態檢查不會載入模型。

    若要使用本機 GGUF 嵌入，請明確設定 `provider: "local"`。明確的本機設定支援 `hf:` 和 HTTP(S) 模型參照（透過 node-llama-cpp 的模型解析），但不會變更預設提供者。

  </Accordion>
</AccordionGroup>

### 行內嵌入逾時

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆寫記憶索引期間行內嵌入批次的逾時時間。

未設定時會使用提供者預設值：`local`、`ollama` 和 `lmstudio` 等本機／自行託管提供者為 600 秒，託管提供者為 120 秒。若本機受 CPU 限制的嵌入批次運作正常但速度較慢，請增加此值。
</ParamField>

---

## 索引行為

除非另有註明，所有設定皆位於 `memorySearch.sync` 下：

| 鍵                            | 類型      | 預設值 | 說明                                                           |
| ------------------------------ | --------- | ------- | --------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | 工作階段啟動時同步記憶索引                           |
| `onSearch`                     | `boolean` | `true`  | 偵測到內容變更後，在搜尋時延遲同步                 |
| `watch`                        | `boolean` | `true`  | 監看記憶檔案（chokidar），並在變更時排程重新建立索引         |
| `watchDebounceMs`              | `number`  | `1500`  | 合併短時間內大量檔案監看事件的防彈跳時間窗                |
| `intervalMinutes`              | `number`  | `0`     | 以分鐘為單位的週期性重新建立索引間隔（`0` 會停用）                   |
| `sessions.postCompactionForce` | `boolean` | `true`  | 在壓縮觸發逐字稿更新後，強制重新建立工作階段索引 |

<ParamField path="chunking.tokens" type="number">
  在嵌入前分割記憶來源時使用的區塊大小，以權杖為單位（預設值：400）。
</ParamField>
<ParamField path="chunking.overlap" type="number">
  相鄰區塊之間的權杖重疊量，用於保留分割邊界附近的內容脈絡（預設值：80）。
</ParamField>

<Note>
變更 `chunking.tokens` 或 `chunking.overlap` 會改變區塊邊界，並使現有索引識別失效（請參閱「提供者選擇」下的警告）。
</Note>

---

## 混合搜尋設定

所有設定皆位於 `memorySearch.query` 下：

| 鍵          | 類型     | 預設值 | 說明                               |
| ------------ | -------- | ------- | ----------------------------------------- |
| `maxResults` | `number` | `6`     | 插入前傳回的記憶命中項目上限 |
| `minScore`   | `number` | `0.35`  | 納入命中項目的最低相關性分數  |

以及 `memorySearch.query.hybrid` 下：

| 鍵                   | 類型      | 預設值 | 說明                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | 啟用 BM25 + 向量混合搜尋 |
| `vectorWeight`        | `number`  | `0.7`   | 向量分數的權重（0-1）     |
| `textWeight`          | `number`  | `0.3`   | BM25 分數的權重（0-1）       |
| `candidateMultiplier` | `number`  | `4`     | 候選集大小乘數     |

<Tabs>
  <Tab title="MMR（多樣性）">
    | 鍵           | 類型      | 預設值 | 說明                          |
    | ------------- | --------- | ------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | 啟用 MMR 重新排序                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多樣性，1 = 最大相關性 |
  </Tab>
  <Tab title="時間衰減（時效性）">
    | 鍵                          | 類型      | 預設值 | 說明               |
    | ---------------------------- | --------- | ------- | -------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 啟用時效性加權      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | 分數每 N 天減半 |

    常青檔案（`MEMORY.md`、`memory/` 中未標註日期的檔案）永不衰減。

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

路徑可以是絕對路徑或相對於工作區的路徑。系統會遞迴掃描目錄中的 `.md` 檔案。符號連結處理方式取決於目前使用的後端：內建引擎會略過符號連結，而 QMD 則遵循底層 QMD 掃描器的行為。

若要進行限定於代理程式範圍的跨代理程式逐字稿搜尋，請使用 `agents.list[].memorySearch.qmd.extraCollections`，而非 `memory.qmd.paths`。這些額外集合遵循相同的 `{ path, name, pattern? }` 結構，但會依代理程式合併；當路徑指向目前工作區之外時，還可保留明確的共用名稱。若 `memory.qmd.paths` 和 `memorySearch.qmd.extraCollections` 中出現相同的已解析路徑，QMD 會保留第一個項目並略過重複項目。

---

## 多模態記憶（Gemini）

使用 Gemini Embedding 2 為影像、音訊與 Markdown 一併建立索引：

| 鍵                       | 類型       | 預設值    | 說明                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 啟用多模態索引             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | 索引的檔案大小上限（10 MiB）    |

<Note>
僅適用於 `extraPaths` 中的檔案。預設記憶根目錄仍僅支援 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必須為 `"none"`。
</Note>

支援的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（圖片）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音訊）。

---

## 嵌入快取

| 鍵                | 類型      | 預設值 | 說明                                  |
| ------------------ | --------- | ------- | -------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | 在 SQLite 中快取區塊嵌入             |
| `cache.maxEntries` | `number`  | 未設定   | 快取嵌入數量的盡力上限 |

避免在重新建立索引或更新逐字稿時，再次嵌入未變更的文字。將 `maxEntries` 保持未設定可使用無上限快取；當磁碟成長比重新建立索引的最高速度更重要時，請設定此值。設定後，一旦快取超過限制，會優先刪除最舊的項目（依最後更新時間排序）。

---

## 批次索引

| 鍵                           | 類型      | 預設值 | 說明                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 平行內嵌嵌入 |
| `remote.batch.enabled`        | `boolean` | `false` | 啟用批次嵌入 API |
| `remote.batch.concurrency`    | `number`  | `2`     | 平行批次工作        |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批次完成  |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | 輪詢間隔              |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | 批次逾時              |

適用於 `gemini`、`openai` 和 `voyage`。對大型回填作業而言，OpenAI 批次通常速度最快且成本最低。

`remote.nonBatchConcurrency` 控制本機／自行託管提供者，以及未啟用提供者批次 API 時的託管提供者所使用的內嵌嵌入呼叫。Ollama 的非批次索引預設為 `1`，以免較小型的本機主機負荷過重；在較大型的機器上可設定更高的值。

這與 `sync.embeddingBatchTimeoutSeconds` 不同，後者控制內嵌嵌入呼叫的逾時時間。

---

## 工作階段記憶搜尋（實驗性）

為工作階段逐字稿建立索引，並透過 `memory_search` 顯示：

| 鍵                           | 類型       | 預設值      | 說明                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 啟用工作階段索引                 |
| `sources`                     | `string[]` | `["memory"]` | 加入 `"sessions"` 以納入逐字稿 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 觸發重新建立索引的位元組門檻              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 觸發重新建立索引的訊息數門檻           |

<Warning>
工作階段索引須自行選擇啟用，並以非同步方式執行。結果可能略有延遲。工作階段記錄儲存在磁碟上，因此應將檔案系統存取視為信任邊界。
</Warning>

工作階段逐字稿的命中結果也遵循
[`tools.sessions.visibility`](/zh-TW/gateway/config-tools#toolssessions)。預設的
`tree` 可見性只會公開目前工作階段及其建立的工作階段。若要從其他
工作階段（例如私訊）回想由閘道分派、屬於同一代理程式但不相關的工作階段，
請有意將可見性擴大為 `agent`（只有在同時需要跨代理程式回想，
且代理程式間政策允許時，才使用 `all`）。

下方範例將這些設定放在 `agents.defaults` 下。如果只有一個
代理程式應為工作階段逐字稿建立索引並進行搜尋，也可以在每個代理程式的覆寫設定中
套用等效的 `memorySearch` 設定。

若要讓同一代理程式從閘道回想私訊：

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

使用 QMD 時，`agents.defaults.memorySearch.experimental.sessionMemory` 和
`sources: ["sessions"]` 本身不會將逐字稿匯出至 QMD。還必須設定
`memory.qmd.sessions.enabled: true`。

---

## SQLite 向量加速（sqlite-vec）

| 鍵                          | 類型      | 預設值 | 說明                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | 使用 sqlite-vec 執行向量查詢 |
| `store.vector.extensionPath` | `string`  | 內附 | 覆寫 sqlite-vec 路徑          |

當 sqlite-vec 無法使用時，OpenClaw 會自動改用程序內餘弦相似度。

---

## 索引儲存空間

內建記憶索引位於每個代理程式的 OpenClaw SQLite 資料庫中：
`agents/<agentId>/agent/openclaw-agent.sqlite`。

| 鍵                   | 類型     | 預設值     | 說明                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5 詞元分析器（`unicode61` 或 `trigram`） |

---

## QMD 後端設定

設定 `memory.backend = "qmd"` 以啟用。所有 QMD 設定都位於 `memory.qmd` 下：

| 鍵                      | 類型      | 預設值  | 說明                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 執行檔路徑；當服務的 `PATH` 與你的 shell 不同時，請設定絕對路徑 |
| `searchMode`             | `string`  | `search` | 搜尋命令：`search`、`vsearch`、`query`                                          |
| `rerank`                 | `boolean` | --       | 搭配 `searchMode: "query"` 和 QMD 2.1+ 時設為 `false`，以略過 QMD 重新排序          |
| `includeDefaultMemory`   | `boolean` | `true`   | 自動為 `MEMORY.md` + `memory/**/*.md` 建立索引                                             |
| `paths[]`                | `array`   | --       | 額外路徑：`{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | 將工作階段逐字稿匯出至 QMD                                                   |
| `sessions.retentionDays` | `number`  | --       | 逐字稿保留期限                                                                  |
| `sessions.exportDir`     | `string`  | --       | 匯出目錄                                                                      |

`searchMode: "search"` 僅使用詞彙／BM25。OpenClaw 不會針對該模式執行語意向量就緒探測或 QMD 嵌入維護，包括在 `memory status --deep` 期間；`vsearch` 和 `query` 仍需要 QMD 向量就緒及嵌入。

`rerank: false` 只會變更 QMD 的 `query` 模式，且需要 QMD 2.1 或更新版本。在直接命令列介面模式中，OpenClaw 會傳遞 `--no-rerank`；在由 mcporter 支援的 MCP 模式中，則會將 `rerank: false` 傳遞至 QMD 的統一查詢工具。保持未設定即可使用 QMD 的預設查詢重新排序行為。

OpenClaw 偏好目前的 QMD 集合與 MCP 查詢格式，但會在需要時嘗試相容的集合模式旗標和較舊的 MCP 工具名稱，讓較舊版本的 QMD 仍可運作。當 QMD 宣告支援多個集合篩選條件時，會以單一 QMD 程序搜尋相同來源的集合；較舊的 QMD 組建則會維持每個集合各自處理的相容路徑。「相同來源」表示持久記憶集合（預設記憶檔案及自訂路徑）會歸為一組，而工作階段逐字稿集合會維持為另一個獨立群組，讓來源多樣化仍能同時取得兩種輸入。

<Note>
QMD 模型覆寫設定保留在 QMD 端，而不在 OpenClaw 設定中。如果需要全域覆寫 QMD 的模型，請在閘道執行階段環境中設定 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL` 等環境變數。
</Note>

### mcporter 整合

全部位於 `memory.qmd.mcporter` 下。透過長時間執行的 `mcporter` MCP 常駐程式路由 QMD 搜尋，而不是每次查詢都產生 `qmd`，以降低較大型模型的冷啟動負擔。

| 鍵           | 類型      | 預設值 | 說明                                                            |
| ------------- | --------- | ------- | ---------------------------------------------------------------------- |
| `enabled`     | `boolean` | `false` | 透過 mcporter 路由 QMD 呼叫，而不是每次要求都產生 `qmd` |
| `serverName`  | `string`  | `qmd`   | 使用 `lifecycle: keep-alive` 執行 `qmd mcp` 的 mcporter 伺服器名稱  |
| `startDaemon` | `boolean` | `true`  | 當 `enabled` 為 true 時，自動啟動 mcporter 常駐程式         |

需要安裝 `mcporter` 並將其加入 PATH，還需要已設定可執行 `qmd mcp` 的 mcporter 伺服器。若是較簡單的本機設定，且可接受每次查詢產生程序的成本，請維持停用。

<AccordionGroup>
  <Accordion title="更新排程">
    | 鍵                        | 類型      | 預設值 | 說明                                     |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | 重新整理間隔                             |
    | `update.debounceMs`       | `number`  | `15000` | 對檔案變更進行防彈跳處理                 |
    | `update.onBoot`           | `boolean` | `true`  | 長期執行的 QMD 管理員開啟時重新整理；設為 false 可略過啟動時的立即更新 |
    | `update.startup`          | `string`  | `off`   | 選用的閘道啟動時 QMD 初始化：`off`、`idle` 或 `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | 執行 `startup: "idle"` 重新整理前的延遲 |
    | `update.waitForBootSync`  | `boolean` | `false` | 阻止管理員開啟，直到初始重新整理完成 |
    | `update.embedInterval`    | `string`  | `60m`   | 獨立的嵌入排程週期                       |
    | `update.commandTimeoutMs` | `number`  | `30000` | QMD 維護命令（集合清單／新增）的逾時時間 |
    | `update.updateTimeoutMs`  | `number`  | `120000` | 每個 `qmd update` 週期的逾時時間   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | 每個 `qmd embed` 週期的逾時時間    |
  </Accordion>
  <Accordion title="限制">
    | 鍵                        | 類型     | 預設值 | 說明                           |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | 搜尋結果數量上限               |
    | `limits.maxSnippetChars`  | `number` | `450`   | 限制片段長度                   |
    | `limits.maxInjectedChars` | `number` | `2200`  | 限制注入的字元總數             |
    | `limits.timeoutMs`        | `number` | `4000`  | 使用 QMD 後端搜尋期間的 QMD 命令逾時時間，包括 `memory_search`；設定、同步、內建備援及補充工作仍使用預設工具期限 |
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

    隨附的預設值僅允許私人訊息／直接訊息，並拒絕群組及其他頻道類型。`match.keyPrefix` 會比對正規化後的工作階段鍵；`match.rawKeyPrefix` 會比對包含 `agent:<id>:` 的原始鍵。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 適用於所有後端：

    | 值                        | 行為                                               |
    | ------------------ | ------------------------------------------------------ |
    | `auto`（預設） | 在片段中包含 `Source: <path#line>` 頁尾              |
    | `on`             | 一律包含頁尾                                       |
    | `off`            | 省略頁尾（路徑仍會在內部傳遞給代理）               |

  </Accordion>
</AccordionGroup>

啟用閘道啟動時的 QMD 初始化後，OpenClaw 只會為符合資格的代理啟動 QMD。如果 `update.onBoot` 為 true，且未設定間隔／嵌入維護，啟動時會使用一次性管理員執行開機重新整理，完成後將其關閉。如果設定了更新或嵌入間隔，啟動時會開啟長期執行的 QMD 管理員，讓其管理監看器與間隔計時器；`update.onBoot: false` 只會略過開機時的立即重新整理。

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

夢境整理是在 `plugins.entries.memory-core.config.dreaming` 下設定，而不是在 `agents.defaults.memorySearch` 下設定。

夢境整理會以單一排程掃描執行，並將內部的淺層／深層／REM 階段視為實作細節。

如需概念行為與斜線命令，請參閱[夢境整理](/zh-TW/concepts/dreaming)。

### 使用者設定

| 鍵                                     | 類型      | 預設值        | 說明                                                                                                                             |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | 完全啟用或停用夢境整理                                                                                                           |
| `frequency`                            | `string`  | `0 3 * * *`   | 完整夢境整理掃描的選用 Cron 執行週期                                                                                             |
| `model`                                | `string`  | 預設模型      | 選用的 Dream Diary 子代理模型覆寫                                                                                                |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | 從每個提升至 `MEMORY.md` 的短期回想片段保留的估算權杖數上限；來源中繼資料仍然可見 |

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
- 當設定的模型無法使用時，Dream Diary 會使用工作階段的預設模型重試一次。信任或允許清單失敗會記錄至日誌，且不會在未告知的情況下重試。
- 淺層／深層／REM 階段的策略與臨界值屬於內部行為，而非面向使用者的設定。

</Note>

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference)
- [記憶概覽](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
