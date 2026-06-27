---
read_when:
    - 你想要設定記憶搜尋提供者或嵌入模型
    - 您想設定 QMD 後端
    - 你想要調整混合搜尋、MMR 或時間衰減
    - 您想啟用多模態記憶索引
sidebarTitle: Memory config
summary: 記憶搜尋、嵌入提供者、QMD、混合搜尋與多模態索引的所有設定選項
title: 記憶設定參考
x-i18n:
    generated_at: "2026-06-27T19:59:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

此頁列出 OpenClaw 記憶搜尋的每一個設定旋鈕。如需概念概覽，請參閱：

<CardGroup cols={2}>
  <Card title="記憶概覽" href="/zh-TW/concepts/memory">
    記憶的運作方式。
  </Card>
  <Card title="內建引擎" href="/zh-TW/concepts/memory-builtin">
    預設 SQLite 後端。
  </Card>
  <Card title="QMD 引擎" href="/zh-TW/concepts/memory-qmd">
    本機優先的 sidecar。
  </Card>
  <Card title="記憶搜尋" href="/zh-TW/concepts/memory-search">
    搜尋管線與調校。
  </Card>
  <Card title="主動記憶" href="/zh-TW/concepts/active-memory">
    互動式工作階段的記憶子代理。
  </Card>
</CardGroup>

除非另有註明，所有記憶搜尋設定都位於 `openclaw.json` 的 `agents.defaults.memorySearch` 下。

<Note>
如果你要找的是**主動記憶**功能開關與子代理設定，它位於 `plugins.entries.active-memory` 下，而不是 `memorySearch`。

主動記憶使用雙閘門模型：

1. 外掛必須已啟用，且目標為目前的代理 ID
2. 請求必須是符合資格的互動式持久聊天工作階段

請參閱[主動記憶](/zh-TW/concepts/active-memory)，了解啟用模型、外掛擁有的設定、逐字稿持久化，以及安全推出模式。
</Note>

---

## 供應者選擇

| 鍵        | 類型      | 預設值          | 說明                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`       | 嵌入配接器 ID，例如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`openai-compatible` 或 `voyage`；也可以是已設定的 `models.providers.<id>`，其 `api` 指向記憶嵌入配接器或 OpenAI 相容模型 API |
| `model`    | `string`  | 供應者預設值 | 嵌入模型名稱                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | 主要項目失敗時使用的後援配接器 ID                                                                                                                                                                                                                                                  |
| `enabled`  | `boolean` | `true`           | 啟用或停用記憶搜尋                                                                                                                                                                                                                                                             |

未設定 `provider` 時，OpenClaw 會使用 OpenAI 嵌入。明確設定 `provider`
即可使用 Gemini、Voyage、Mistral、DeepInfra、Bedrock、GitHub Copilot、
Ollama、本機 GGUF 模型，或 OpenAI 相容的 `/v1/embeddings` 端點。
仍寫著 `provider: "auto"` 的舊版設定會解析為 `openai`。

<Warning>
變更嵌入供應者、模型、供應者設定、來源、範圍、
分塊或 tokenizer，可能會讓既有 SQLite 向量索引不相容。
OpenClaw 會暫停向量搜尋並回報索引身分警告，而不是
自動重新嵌入所有內容。準備好時，請使用
`openclaw memory status --index --agent <id>` 或
`openclaw memory index --force --agent <id>` 重建。
</Warning>

當 `provider` 未設定、存在舊版 `provider: "auto"`，或
`provider: "none"` 刻意選擇僅 FTS 模式時，即使嵌入不可用，記憶召回仍可
使用詞彙 FTS 排名。

明確的非本機供應者會採用封閉失敗。如果你將 `memorySearch.provider` 設為
具體的遠端後端供應者，例如 OpenAI、Gemini、Voyage、Mistral、
Bedrock、GitHub Copilot、DeepInfra、Ollama、LM Studio，或 OpenAI 相容的
自訂供應者，而該供應者在執行階段不可用，`memory_search`
會回傳不可用結果，而不是默默使用僅 FTS 召回。請修正
供應者/驗證設定、切換到可連線的供應者，或在你想刻意使用僅 FTS 召回時設定
`provider: "none"`。

### 自訂供應者 ID

`memorySearch.provider` 可以指向自訂的 `models.providers.<id>` 項目，用於記憶專用的供應者配接器，例如 `ollama`，或用於 OpenAI 相容模型 API，例如 `openai-responses` / `openai-completions`。OpenClaw 會解析該供應者的 `api` 擁有者作為嵌入配接器，同時保留自訂供應者 ID 來處理端點、驗證與模型前綴。這讓多 GPU 或多主機設定可以將記憶嵌入指定給特定本機端點：

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

遠端嵌入需要 API 金鑰。Bedrock 則使用 AWS SDK 預設憑證鏈（執行個體角色、SSO、存取金鑰）。

| 供應者       | 環境變數                                            | 設定鍵                          |
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
Codex OAuth 只涵蓋聊天/補全，無法滿足嵌入請求。
</Note>

---

## 遠端端點設定

對於不應繼承全域 OpenAI 聊天憑證的一般 OpenAI 相容
`/v1/embeddings` 伺服器，請使用 `provider: "openai-compatible"`。

<ParamField path="remote.baseUrl" type="string">
  自訂 API 基底 URL。
</ParamField>
<ParamField path="remote.apiKey" type="string">
  覆寫 API 金鑰。
</ParamField>
<ParamField path="remote.headers" type="object">
  額外 HTTP 標頭（與供應者預設值合併）。
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

## 供應者專屬設定

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
    OpenAI 相容嵌入端點可以選擇加入供應者專屬的 `input_type` 請求欄位。這對需要為查詢和文件嵌入使用不同標籤的非對稱嵌入模型很有用。

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

    變更這些值會影響供應者批次索引的嵌入快取身分；當上游模型以不同方式處理這些標籤時，後續應重新建立記憶索引。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 嵌入設定

    Bedrock 使用 AWS SDK 預設憑證鏈，不需要 API 金鑰。如果 OpenClaw 在 EC2 上執行，且其執行個體角色已啟用 Bedrock，只要設定供應者和模型即可：

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

    帶有吞吐量後綴的變體（例如 `amazon.titan-embed-text-v1:2:8k`）會繼承基礎模型的設定。

    **驗證：**Bedrock 驗證使用標準 AWS SDK 憑證解析順序：

    1. 環境變數（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
    2. SSO 權杖快取
    3. 網路身分權杖憑證
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

    若要採用最低權限，請將 `InvokeModel` 範圍限定到特定模型：

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="本機（GGUF + llama.cpp）">
    | 鍵                    | 類型               | 預設值                 | 說明                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自動下載               | GGUF 模型檔案的路徑                                                                                                                                                                                                                                                                                           |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 預設值  | 已下載模型的快取目錄                                                                                                                                                                                                                                                                                          |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入內容的上下文視窗大小。4096 可涵蓋典型區塊（128–512 個權杖），同時限制非權重 VRAM。在資源受限的主機上可降低到 1024–2048。`"auto"` 會使用模型訓練時的最大值 — 不建議用於 8B+ 模型（Qwen3-Embedding-8B：40 960 個權杖 → 約 32 GB VRAM，而 4096 約為 8.8 GB）。 |

    請先安裝官方 llama.cpp 提供者：`openclaw plugins install @openclaw/llama-cpp-provider`。
    預設模型：`embeddinggemma-300m-qat-Q8_0.gguf`（約 0.6 GB，自動下載）。原始碼 checkout 仍需要原生建置核准：先執行 `pnpm approve-builds`，再執行 `pnpm rebuild node-llama-cpp`。

    使用獨立命令列介面來驗證閘道使用的相同提供者路徑：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    若要使用本機 GGUF 嵌入，請明確設定 `provider: "local"`。明確的本機設定支援 `hf:` 和 HTTP(S) 模型參照，但它們不會變更預設提供者。

  </Accordion>
</AccordionGroup>

### 內嵌嵌入逾時

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆寫記憶索引期間內嵌嵌入批次的逾時。

未設定時會使用提供者預設值：對 `local`、`ollama` 和 `lmstudio` 等本機/自架提供者為 600 秒，對託管提供者為 120 秒。當本機受 CPU 限制的嵌入批次狀態正常但速度較慢時，請增加此值。
</ParamField>

---

## 混合搜尋設定

全部位於 `memorySearch.query.hybrid` 底下：

| 鍵                    | 類型      | 預設值 | 說明                            |
| --------------------- | --------- | ------- | -------------------------------- |
| `enabled`             | `boolean` | `true`  | 啟用混合 BM25 + 向量搜尋        |
| `vectorWeight`        | `number`  | `0.7`   | 向量分數的權重（0-1）           |
| `textWeight`          | `number`  | `0.3`   | BM25 分數的權重（0-1）          |
| `candidateMultiplier` | `number`  | `4`     | 候選集大小倍數                  |

<Tabs>
  <Tab title="MMR（多樣性）">
    | 鍵            | 類型      | 預設值  | 說明                              |
    | ------------- | --------- | ------- | --------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | 啟用 MMR 重新排序                 |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多樣性，1 = 最大相關性    |
  </Tab>
  <Tab title="時間衰減（新近度）">
    | 鍵                           | 類型      | 預設值 | 說明                 |
    | ---------------------------- | --------- | ------- | -------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 啟用新近度加權       |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | 每 N 天分數減半      |

    常青檔案（`MEMORY.md`、`memory/` 中未標日期的檔案）永遠不會衰減。

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
| `extraPaths` | `string[]` | 要索引的其他目錄或檔案 |

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

路徑可以是絕對路徑或相對於工作區的路徑。目錄會遞迴掃描 `.md` 檔案。符號連結處理取決於作用中的後端：內建引擎會忽略符號連結，而 QMD 則遵循底層 QMD 掃描器的行為。

對於代理程式範圍的跨代理程式轉錄搜尋，請使用 `agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。這些額外集合遵循相同的 `{ path, name, pattern? }` 形狀，但它們會依每個代理程式合併，且當路徑指向目前工作區之外時，可以保留明確的共用名稱。如果相同的解析後路徑同時出現在 `memory.qmd.paths` 和 `memorySearch.qmd.extraCollections` 中，QMD 會保留第一個項目並略過重複項目。

---

## 多模態記憶（Gemini）

使用 Gemini Embedding 2 將圖片與音訊連同 Markdown 一起索引：

| 鍵                       | 類型       | 預設值    | 說明                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 啟用多模態索引             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | 索引的最大檔案大小             |

<Note>
僅適用於 `extraPaths` 中的檔案。預設記憶根目錄仍僅限 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必須為 `"none"`。
</Note>

支援的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（圖片）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音訊）。

---

## 嵌入快取

| 鍵                | 類型      | 預設值 | 說明                      |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | 在 SQLite 中快取區塊嵌入 |
| `cache.maxEntries` | `number`  | `50000` | 最大快取嵌入數量            |

防止在重新索引或轉錄更新期間，對未變更的文字重新嵌入。

---

## 批次索引

| 鍵                           | 類型      | 預設值 | 說明                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 平行行內嵌入 |
| `remote.batch.enabled`        | `boolean` | `false` | 啟用批次嵌入 API |
| `remote.batch.concurrency`    | `number`  | `2`     | 平行批次工作        |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批次完成  |
| `remote.batch.pollIntervalMs` | `number`  | --      | 輪詢間隔              |
| `remote.batch.timeoutMinutes` | `number`  | --      | 批次逾時              |

適用於 `openai`、`gemini` 和 `voyage`。對大型回填而言，OpenAI 批次通常最快且成本最低。

`remote.nonBatchConcurrency` 控制本機／自託管提供者使用的行內嵌入呼叫，以及託管提供者在提供者批次 API 未啟用時使用的行內嵌入呼叫。Ollama 的非批次索引預設為 `1`，以避免讓較小的本機主機負載過重；在較大型機器上可設定較高的值。

這與 `sync.embeddingBatchTimeoutSeconds` 分開，後者控制行內嵌入呼叫的逾時。

---

## 工作階段記憶搜尋（實驗性）

索引工作階段轉錄，並透過 `memory_search` 顯示它們：

| 鍵                           | 類型       | 預設值      | 說明                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 啟用工作階段索引                 |
| `sources`                     | `string[]` | `["memory"]` | 加入 `"sessions"` 以包含轉錄 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 重新索引的位元組閾值              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 重新索引的訊息閾值           |

<Warning>
工作階段索引為選擇啟用，且會非同步執行。結果可能稍微過時。工作階段記錄位於磁碟上，因此請將檔案系統存取視為信任邊界。
</Warning>

---

## SQLite 向量加速（sqlite-vec）

| 鍵                           | 類型      | 預設值 | 說明                              |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | 使用 sqlite-vec 進行向量查詢 |
| `store.vector.extensionPath` | `string`  | 隨附 | 覆寫 sqlite-vec 路徑          |

當 sqlite-vec 無法使用時，OpenClaw 會自動退回到程序內的餘弦相似度。

---

## 索引儲存

內建記憶索引位於每個代理的 OpenClaw SQLite 資料庫：
`agents/<agentId>/agent/openclaw-agent.sqlite`。

| 鍵                    | 類型     | 預設值      | 說明                                      |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5 tokenizer（`unicode61` 或 `trigram`） |

---

## QMD 後端設定

設定 `memory.backend = "qmd"` 以啟用。所有 QMD 設定都位於 `memory.qmd` 底下：

| 鍵                       | 類型      | 預設值   | 說明                                                                                  |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 執行檔路徑；當服務的 `PATH` 與你的 shell 不同時，請設定絕對路徑 |
| `searchMode`             | `string`  | `search` | 搜尋命令：`search`、`vsearch`、`query`                                          |
| `rerank`                 | `boolean` | --       | 搭配 `searchMode: "query"` 和 QMD 2.1+ 設為 `false`，以略過 QMD 重新排序          |
| `includeDefaultMemory`   | `boolean` | `true`   | 自動索引 `MEMORY.md` + `memory/**/*.md`                                             |
| `paths[]`                | `array`   | --       | 額外路徑：`{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | 索引工作階段逐字稿                                                             |
| `sessions.retentionDays` | `number`  | --       | 逐字稿保留期限                                                                  |
| `sessions.exportDir`     | `string`  | --       | 匯出目錄                                                                      |

`searchMode: "search"` 僅使用詞彙/BM25。OpenClaw 不會針對該模式執行語意向量就緒探測或 QMD embedding 維護，包括在 `memory status --deep` 期間；`vsearch` 和 `query` 仍會要求 QMD 向量就緒和 embeddings。

`rerank: false` 只會變更 QMD `query` 模式，並且需要 QMD 2.1 或更新版本。在直接命令列介面模式中，OpenClaw 會傳遞 `--no-rerank`；在 mcporter 支援的 MCP 模式中，則會將 `rerank: false` 傳給 QMD 的統一查詢工具。若要使用 QMD 預設的查詢重新排序行為，請保持未設定。

OpenClaw 偏好目前的 QMD collection 和 MCP 查詢形狀，但會在需要時嘗試相容的 collection pattern 旗標和較舊的 MCP 工具名稱，以維持舊版 QMD release 可用。當 QMD 宣告支援多個 collection 篩選器時，同來源 collection 會使用單一 QMD 程序搜尋；較舊的 QMD build 會保留逐 collection 的相容路徑。同來源表示 durable memory collection 會分組在一起，而工作階段逐字稿 collection 會保留為另一個獨立群組，因此來源多樣化仍同時具備兩種輸入。

<Note>
QMD 模型覆寫會留在 QMD 端，而不是 OpenClaw 設定。如果你需要全域覆寫 QMD 的模型，請在閘道執行階段環境中設定環境變數，例如 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL`。
</Note>

<AccordionGroup>
  <Accordion title="更新排程">
    | 鍵                        | 類型      | 預設值 | 說明                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | 重新整理間隔                      |
    | `update.debounceMs`       | `number`  | `15000` | 對檔案變更進行 debounce                 |
    | `update.onBoot`           | `boolean` | `true`  | 長駐 QMD 管理器開啟時重新整理；設為 false 可略過立即的開機更新 |
    | `update.startup`          | `string`  | `off`   | 選用的閘道啟動時 QMD 初始化：`off`、`idle` 或 `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | 在 `startup: "idle"` 重新整理執行前延遲 |
    | `update.waitForBootSync`  | `boolean` | `false` | 阻擋管理器開啟，直到初始重新整理完成 |
    | `update.embedInterval`    | `string`  | --      | 獨立的 embed 節奏                |
    | `update.commandTimeoutMs` | `number`  | --      | QMD 命令的逾時              |
    | `update.updateTimeoutMs`  | `number`  | --      | QMD 更新操作的逾時     |
    | `update.embedTimeoutMs`   | `number`  | --      | QMD embed 操作的逾時      |
  </Accordion>
  <Accordion title="限制">
    | 鍵                        | 類型     | 預設值 | 說明                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | 搜尋結果上限         |
    | `limits.maxSnippetChars`  | `number` | --      | 限制 snippet 長度       |
    | `limits.maxInjectedChars` | `number` | --      | 限制總注入字元數 |
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

    隨附的預設值允許 direct 和 channel 工作階段，同時仍拒絕 groups。

    預設僅限 DM。`match.keyPrefix` 會比對正規化後的工作階段 key；`match.rawKeyPrefix` 會比對包含 `agent:<id>:` 的原始 key。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 適用於所有後端：

    | 值               | 行為                                                |
    | ---------------- | --------------------------------------------------- |
    | `auto`（預設） | 在 snippets 中包含 `Source: <path#line>` footer    |
    | `on`             | 一律包含 footer                               |
    | `off`            | 省略 footer（路徑仍會在內部傳給代理） |

  </Accordion>
</AccordionGroup>

啟用閘道啟動時 QMD 初始化後，OpenClaw 只會為符合資格的代理啟動 QMD。如果 `update.onBoot` 為 true，且未設定 interval/embed 維護，啟動時會使用一次性管理器進行開機重新整理，然後關閉它。如果設定了 update 或 embed interval，啟動時會開啟長駐 QMD 管理器，讓它擁有 watcher 和 interval timers；`update.onBoot: false` 只會略過立即的開機重新整理。

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

夢境整理是在 `plugins.entries.memory-core.config.dreaming` 底下設定，而不是在 `agents.defaults.memorySearch` 底下。

夢境整理會以一次排程 sweep 執行，並使用內部 light/deep/REM 階段作為實作細節。

如需概念行為和 slash commands，請參閱[夢境整理](/zh-TW/concepts/dreaming)。

### 使用者設定

| 鍵                                     | 類型      | 預設值        | 說明                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | 完整啟用或停用夢境整理                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | 完整夢境整理 sweep 的選用 cron 節奏                                                                                |
| `model`                                | `string`  | 預設模型 | 選用的 Dream Diary 子代理模型覆寫                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | 從每個提升到 `MEMORY.md` 的短期 recall snippet 中保留的最大估計 tokens；來源 metadata 仍保持可見 |

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
- `dreaming.model` 使用現有外掛子代理信任閘門；啟用前請先設定 `plugins.entries.memory-core.subagent.allowModelOverride: true`。
- 當設定的模型無法使用時，Dream Diary 會使用工作階段預設模型重試一次。信任或 allowlist 失敗會記錄下來，且不會靜默重試。
- light/deep/REM 階段政策和閾值屬於內部行為，不是面向使用者的設定。

</Note>

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference)
- [記憶概覽](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
