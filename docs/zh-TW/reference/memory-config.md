---
read_when:
    - 你想要設定記憶搜尋提供者或嵌入模型
    - 你想要設定 QMD 後端
    - 你想要啟用混合搜尋、MMR 或時間衰減
    - 你想要啟用多模態記憶索引功能
sidebarTitle: Memory config
summary: 記憶搜尋提供者、檢索模式、QMD 與多模態索引
title: 記憶設定參考資料
x-i18n:
    generated_at: "2026-07-20T00:58:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 11d9e7e5feed39280a4210cfb9cc245422949d3559fcad4450028943b4dc907f
    source_path: reference/memory-config.md
    workflow: 16
---

此頁列出 OpenClaw 記憶搜尋的所有設定選項。如需概念總覽，請參閱：

<CardGroup cols={2}>
  <Card title="記憶總覽" href="/zh-TW/concepts/memory">
    記憶的運作方式。
  </Card>
  <Card title="內建引擎" href="/zh-TW/concepts/memory-builtin">
    預設 SQLite 後端。
  </Card>
  <Card title="QMD 引擎" href="/zh-TW/concepts/memory-qmd">
    本機優先的輔助程序。
  </Card>
  <Card title="記憶搜尋" href="/zh-TW/concepts/memory-search">
    搜尋流水線與調校。
  </Card>
  <Card title="主動記憶" href="/zh-TW/concepts/active-memory">
    用於互動式工作階段的記憶子代理程式。
  </Card>
</CardGroup>

除非另有註明，所有記憶搜尋設定都位於 `agents.defaults.memorySearch` 的 `openclaw.json`（或每個代理程式的 `agents.list[].memorySearch` 覆寫）之下。

<Note>
針對建議的個人代理程式工作流程，請使用
`memorySearch.rememberAcrossConversations`。進階的主動記憶目標設定、
模型、提示詞及延遲控制項位於 `plugins.entries.active-memory` 之下。

如需兩種啟用路徑、逐字稿持久化及安全推出指南，請參閱[主動記憶](/zh-TW/concepts/active-memory)。
</Note>

---

## 跨對話記憶

| 鍵                            | 類型      | 預設值                                                     | 說明                                                                           |
| ----------------------------- | --------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `rememberAcrossConversations` | `boolean` | 個人安裝時開啟；設定 DM 隔離時關閉 | 使用此代理程式其他已識別私人對話中的相關情境。 |

若只有受信任的個人代理程式應使用跨對話逐字稿回想功能，請為個別代理程式進行設定：

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        memorySearch: {
          rememberAcrossConversations: true,
        },
      },
    ],
  },
}
```

此值遵循一般的 `agents.defaults.memorySearch` 繼承規則，並可由每個代理程式覆寫。若未設定，僅當全域
`session.dmScope` 未設定或為 `"main"`，且沒有任何繫結具有 `session.dmScope`
覆寫時，才會預設開啟。任何已設定的 DM 隔離都會使其預設關閉。明確設定的 `true` 或
`false` 一律優先。啟用此功能即表示啟用工作階段逐字稿索引，並將
`sessions` 新增至代理程式解析後的記憶來源。搭配 QMD 時，也會啟用該代理程式的工作階段匯出；此模式不需要另行設定
`memory.qmd.sessions.enabled`。

OpenClaw 的內建記憶提供者透過內建與 QMD 後端支援此受保護路徑。替代記憶提供者仍可使用自身的回想鉤點與進階主動記憶工具，但除非目前提供者支援受保護的私人逐字稿回想，否則會略過此設定。
`openclaw doctor` 會回報不受支援的提供者，或明確的主動記憶
`toolsAllow` 清單未包含 `memory_search`。

擷取邊界比一般工作階段搜尋更窄：

- 只有同一代理程式已識別的私人對話符合資格
- 正在回覆的對話會被排除
- 群組與頻道均不會作為來源或目的地
- 未知的對話類型會採取失敗關閉
- 沙箱化回想無法使用特殊的跨對話授權

此設定不會變更 `tools.sessions.visibility`、工作階段金鑰、
逐字稿儲存、傳遞路由，或 `sessions_list`、
`sessions_history` 與 `sessions_send` 的權限。主動記憶會執行有界的唯讀擷取流程；擷取無法使用或逾時並不會阻止回覆。

---

## 提供者選擇

| 鍵         | 類型      | 預設值           | 說明                                                                                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | 啟用或停用記憶搜尋                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | 嵌入配接器 ID，例如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`openai-compatible` 或 `voyage`；也可以是已設定的 `models.providers.<id>`，其 `api` 指向記憶嵌入配接器或 OpenAI 相容模型 API |
| `model`    | `string`  | 提供者預設值 | 嵌入模型名稱                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | 主要配接器失敗時使用的備援配接器 ID                                                                                                                                                                                                                                                  |

未設定 `provider` 時，OpenClaw 會使用 OpenAI 嵌入。若要使用 Bedrock、DeepInfra、Gemini、GitHub Copilot、Mistral、Ollama、
Voyage、本機 GGUF 模型或 OpenAI 相容的 `/v1/embeddings` 端點，請明確設定 `provider`。
仍使用 `provider: "auto"` 的舊版設定會解析為 `openai`。

<Warning>
變更嵌入提供者、模型、提供者設定、來源、範圍、分塊方式或分詞器，可能使現有的 SQLite 向量索引不相容。
OpenClaw 會暫停向量搜尋並回報索引身分警告，而不會自動重新嵌入所有內容。準備就緒後，請使用
`openclaw memory status --index --agent <id>` 或
`openclaw memory index --force --agent <id>` 重建。
</Warning>

當 `provider` 未設定、存在舊版 `provider: "auto"`，或
`provider: "none"` 刻意選擇僅限 FTS 模式時，即使嵌入無法使用，記憶回想仍可使用詞彙 FTS 排序。

明確指定的非本機提供者會採取失敗關閉。如果將 `memorySearch.provider` 設定為
具體的遠端後端提供者，例如 Bedrock、DeepInfra、Gemini、GitHub
Copilot、LM Studio、Mistral、Ollama、OpenAI、Voyage 或 OpenAI 相容的
自訂提供者，而該提供者在執行階段無法使用，`memory_search`
會回傳無法使用的結果，而不會無提示地改用僅限 FTS 的回想。請修正
提供者／驗證設定、切換至可連線的提供者；若要刻意使用僅限 FTS 的回想，則設定
`provider: "none"`。

### 自訂提供者 ID

`memorySearch.provider` 可指向自訂的 `models.providers.<id>` 項目，以供 `ollama` 等記憶專用提供者配接器使用，或供 `openai-responses`／`openai-completions` 等 OpenAI 相容模型 API 使用。OpenClaw 會解析該提供者的 `api` 擁有者以取得嵌入配接器，同時保留自訂提供者 ID，用於端點、驗證與模型前綴處理。如此一來，多 GPU 或多主機設定即可將記憶嵌入專門交由特定本機端點處理：

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

遠端嵌入需要 API 金鑰。Bedrock 則使用 AWS SDK 預設認證資訊鏈（執行個體角色、SSO、存取金鑰或 Bedrock API 金鑰）。

| 提供者         | 環境變數                                            | 設定鍵                              |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 認證資訊鏈，或 `AWS_BEARER_TOKEN_BEDROCK` | 不需要 API 金鑰                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN`  | 透過裝置登入取得驗證設定檔       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（預留值）                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth 僅涵蓋聊天／補全，不適用於嵌入要求。
</Note>

---

## 遠端端點設定

若使用不應繼承全域 OpenAI 聊天認證資訊的通用 OpenAI 相容
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

## 提供者專屬設定

<AccordionGroup>
  <Accordion title="Gemini">
    | 鍵                     | 類型     | 預設值                 | 說明                                      |
    | ---------------------- | -------- | ---------------------- | ----------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | 也支援 `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | 適用於 Embedding 2：768、1536 或 3072        |

    <Warning>
    變更模型或 `outputDimensionality` 會改變索引身分。OpenClaw
    會暫停向量搜尋，直到你明確重建記憶索引。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 相容輸入類型">
    OpenAI 相容嵌入端點可選擇使用提供者專屬的 `input_type` 要求欄位。這適用於需要為查詢嵌入與文件嵌入使用不同標籤的非對稱嵌入模型。

    | 鍵                  | 類型     | 預設值 | 說明                                                     |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | 未設定  | 查詢與文件嵌入共用的 `input_type`                 |
    | `queryInputType`    | `string` | 未設定  | 查詢時的 `input_type`；覆寫 `inputType`    |
    | `documentInputType` | `string` | 未設定  | 索引／文件的 `input_type`；覆寫 `inputType` |

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

    變更這些值會影響提供者批次索引的嵌入快取識別資訊；若上游模型會以不同方式處理這些標籤，變更後應重新建立記憶索引。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 嵌入設定

    Bedrock 使用 AWS SDK 預設認證資訊鏈，以及經 OpenClaw 檢查的持有人權杖，因此不會在設定中儲存 API 金鑰。若 OpenClaw 在具備 Bedrock 權限之執行個體角色的 EC2 上執行，只需設定提供者與模型：

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

    | 鍵                     | 類型     | 預設值                          | 說明                         |
    | ---------------------- | -------- | ------------------------------- | ---------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任何 Bedrock 嵌入模型 ID     |
    | `outputDimensionality` | `number` | 模型預設值                      | Titan V2：256、512 或 1024   |

    **支援的模型**（包含系列偵測與預設維度）：

    | 模型 ID                                     | 提供者     | 預設維度 | 可設定維度                     |
    | ------------------------------------------- | ---------- | -------- | ------------------------------ |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024     | 256, 512, 1024                 |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536     | --                              |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536     | --                              |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024     | --                              |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024     | 256, 384, 1024, 3072           |
    | `cohere.embed-english-v3`                  | Cohere     | 1024     | --                              |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024     | --                              |
    | `cohere.embed-v4:0`                        | Cohere     | 1536     | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512      | --                              |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024     | --                              |

    帶有輸送量後綴的變體（例如 `amazon.titan-embed-text-v1:2:8k`）和帶有區域前綴的推論設定檔 ID（例如 `us.amazon.titan-embed-text-v2:0`）會繼承基礎模型的設定。

    **區域：**依下列順序解析：`memorySearch.remote.baseUrl` 覆寫值、`models.providers.amazon-bedrock.baseUrl` 設定、`AWS_REGION`、`AWS_DEFAULT_REGION`，最後使用預設值 `us-east-1`。

    **驗證：**OpenClaw 會先檢查 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 或 `AWS_BEARER_TOKEN_BEDROCK`，接著再依序使用標準 AWS SDK 預設認證資訊提供者鏈：

    1. 環境變數（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`），除非同時設定了 `AWS_PROFILE`
    2. SSO（僅限已設定 SSO 欄位時）
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

    若要遵循最小權限原則，請將 `InvokeModel` 範圍限制為特定模型：

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="本機（GGUF + llama.cpp）">
    | 鍵                    | 類型               | 預設值                 | 說明                                                                                                                                                                                                                                                                                                                |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自動下載               | GGUF 模型檔案的路徑                                                                                                                                                                                                                                                                                                |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 預設值  | 已下載模型的快取目錄                                                                                                                                                                                                                                                                                               |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入內容的內容窗口大小。4096 可涵蓋一般區塊（128-512 個權杖），同時限制非權重 VRAM。資源受限的主機可降低至 1024-2048。`"auto"` 會使用模型訓練時的最大值——不建議用於 8B 以上的模型（Qwen3-Embedding-8B：最高 40 960 個權杖可能使 VRAM 用量達到約 32 GB）。 |

    請先安裝官方 llama.cpp 提供者：`openclaw plugins install @openclaw/llama-cpp-provider`。
    預設模型：`embeddinggemma-300m-qat-Q8_0.gguf`（約 0.6 GB，自動下載）。原始碼簽出仍需要核准原生建置：先執行 `pnpm approve-builds`，再執行 `pnpm rebuild node-llama-cpp`。

    使用獨立命令列介面驗證與閘道相同的提供者路徑：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    數值型 `local.contextSize` 值也會提供給 node-llama-cpp 的自動 GPU 層配置，使模型權重和要求的嵌入內容能一併容納。執行階段載入後，`openclaw memory status --deep` 會回報最近已知的 llama.cpp 後端、裝置、卸載、要求的內容大小，以及附時間戳記的記憶體資訊；被動狀態查詢不會載入模型。

    對本機 GGUF 嵌入，請明確設定 `provider: "local"`。明確的本機設定支援 `hf:` 與 HTTP(S) 模型參照（透過 node-llama-cpp 的模型解析），但不會變更預設提供者。

  </Accordion>
</AccordionGroup>

### 行內嵌入逾時

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆寫建立記憶索引時行內嵌入批次的逾時時間。

未設定時使用提供者預設值：`local`、`ollama` 和 `lmstudio` 等本機／自行託管提供者為 600 秒，託管提供者則為 120 秒。若受限於本機 CPU 的嵌入批次運作正常但速度緩慢，請增加此值。
</ParamField>

---

## 索引行為

除非另有註明，以下全部位於 `memorySearch.sync`：

| 鍵                             | 類型      | 預設值 | 說明                                             |
| ------------------------------ | --------- | ------ | ------------------------------------------------ |
| `onSessionStart`               | `boolean` | `true`  | 工作階段開始時同步記憶索引                       |
| `onSearch`                     | `boolean` | `true`  | 偵測到內容變更後，在搜尋時延遲同步               |
| `watch`                        | `boolean` | `true`  | 監看記憶檔案（chokidar），並在變更時排程重新索引 |
| `sessions.postCompactionForce` | `boolean` | `true`  | 壓縮所觸發的逐字稿更新後，強制重新索引工作階段   |

---

## 混合搜尋設定

以下全部位於 `memorySearch.query`：

| 鍵           | 類型     | 預設值 | 說明                                   |
| ------------ | -------- | ------ | -------------------------------------- |
| `maxResults` | `number` | `6`     | 注入前傳回的記憶結果數量上限           |
| `minScore`   | `number` | `0.35`  | 納入搜尋結果所需的最低相關性分數       |

以下位於 `memorySearch.query.hybrid`：

| 鍵        | 類型      | 預設值 | 說明                          |
| --------- | --------- | ------ | ----------------------------- |
| `enabled` | `boolean` | `true`  | 啟用混合 BM25 + 向量搜尋      |

<Tabs>
  <Tab title="MMR（多樣性）">
    | 鍵            | 類型      | 預設值 | 說明              |
    | ------------- | --------- | ------ | ----------------- |
    | `mmr.enabled` | `boolean` | `false` | 啟用 MMR 重新排序 |
  </Tab>
  <Tab title="時間衰減（近期性）">
    | 鍵                      | 類型      | 預設值 | 說明               |
    | ----------------------- | --------- | ------ | ------------------ |
    | `temporalDecay.enabled` | `boolean` | `false` | 啟用近期性加權     |

    常青檔案（`MEMORY.md`、`memory/` 中未標註日期的檔案）永遠不會衰減。

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
            mmr: { enabled: true },
            temporalDecay: { enabled: true },
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

路徑可以是絕對路徑或相對於工作區的路徑。系統會以遞迴方式掃描目錄中的 `.md` 檔案。符號連結的處理方式取決於使用中的後端：內建引擎會略過符號連結，而 QMD 則遵循底層 QMD 掃描器的行為。

若要進行代理程式範圍的跨代理程式逐字稿搜尋，請使用 `agents.list[].memorySearch.qmd.extraCollections`，而非 `memory.qmd.paths`。這些額外集合採用相同的 `{ path, name, pattern? }` 結構，但會依代理程式合併；當路徑指向目前工作區之外時，還能保留明確的共用名稱。若同一個解析後的路徑同時出現在 `memory.qmd.paths` 與 `memorySearch.qmd.extraCollections` 中，QMD 會保留第一個項目並略過重複項目。

---

## 多模態記憶（Gemini）

使用 Gemini Embedding 2 將影像和音訊與 Markdown 一併建立索引：

| 鍵                       | 類型       | 預設值    | 說明                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 啟用多模態索引             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | 建立索引的檔案大小上限（10 MiB）    |

<Note>
僅適用於 `extraPaths` 中的檔案。預設記憶根目錄仍僅支援 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必須為 `"none"`。
</Note>

支援的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（影像）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音訊）。

---

## 嵌入快取

| 鍵             | 類型      | 預設值 | 說明                      |
| --------------- | --------- | ------- | -------------------------------- |
| `cache.enabled` | `boolean` | `true`  | 在 SQLite 中快取區塊嵌入 |

避免在重新建立索引或更新逐字稿時，對未變更的文字重新產生嵌入。

---

## 批次索引

| 鍵                           | 類型      | 預設值 | 說明                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 平行行內嵌入 |
| `remote.batch.enabled`        | `boolean` | `false` | 啟用批次嵌入 API |
| `remote.batch.concurrency`    | `number`  | `2`     | 平行批次工作        |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批次完成  |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | 輪詢間隔              |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | 批次逾時              |

適用於 `gemini`、`openai` 和 `voyage`。對於大量回填，OpenAI 批次處理通常最快且成本最低。

`remote.nonBatchConcurrency` 控制本機／自行託管提供者使用的行內嵌入呼叫，以及在提供者批次 API 未啟用時由託管提供者使用的行內嵌入呼叫。Ollama 對非批次索引的預設值為 `1`，以免使較小型的本機主機負荷過重；在較大型的機器上可設定較高的值。

這與 `sync.embeddingBatchTimeoutSeconds` 不同；後者控制行內嵌入呼叫的逾時時間。

---

## 工作階段記憶搜尋（實驗性）

為工作階段逐字稿建立索引，並透過 `memory_search` 顯示：

| 鍵                           | 類型       | 預設值      | 說明                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 啟用工作階段索引                 |
| `sources`                     | `string[]` | `["memory"]` | 新增 `"sessions"` 以包含逐字稿 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 重新建立索引的位元組門檻              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 重新建立索引的訊息門檻           |

<Warning>
工作階段索引是選用功能，且會以非同步方式執行。結果可能會稍微過時。工作階段記錄儲存在磁碟上，因此應將檔案系統存取視為信任邊界。
</Warning>

一般由模型叫用的工作階段逐字稿搜尋會遵循
[`tools.sessions.visibility`](/zh-TW/gateway/config-tools#toolssessions)。預設的
`tree` 可見性會公開目前工作階段、由其建立的工作階段，以及
透過環境群組感知所監看、屬於同一代理程式的群組工作階段。其他
不相關的工作階段需要 `agent` 可見性（只有在同時需要跨代理程式
回憶，且代理程式對代理程式原則允許時，才使用 `all`）。

`rememberAcrossConversations` 不會擴大該設定。它提供
另一項僅限執行階段的授權，僅允許在有界的主動記憶階段中存取
同一代理程式的私人逐字稿。

以下範例將這些設定放在 `agents.defaults` 之下。當只有一個
代理程式應為工作階段逐字稿建立索引並進行搜尋時，也可以在該代理程式的覆寫設定中
套用等效的 `memorySearch` 設定。

若要進行同一代理程式從閘道到私訊的回憶：

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
`memory.qmd.sessions.enabled: true`。較高階的
`rememberAcrossConversations: true` 設定例外：它會隱含啟用該代理程式
所需的 QMD 工作階段匯出。隱含匯出會維持私密：
一律使用預設的內部匯出位置（設定的
`sessions.exportDir` 僅套用於明確匯出）、僅在該代理程式進行跨對話回憶時
搜尋，而且一般的 `memory_get`
無法讀取。明確設定
`memory.qmd.sessions.enabled: true` 會維持現有行為，並使
匯出的逐字稿成為一般記憶語料庫的一部分。

---

## SQLite 向量加速（sqlite-vec）

| 鍵                          | 類型      | 預設值 | 說明                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | 使用 sqlite-vec 執行向量查詢 |
| `store.vector.extensionPath` | `string`  | 隨附 | 覆寫 sqlite-vec 路徑          |

當 sqlite-vec 無法使用時，OpenClaw 會自動退回使用程序內餘弦相似度。

---

## 索引儲存空間

內建記憶索引位於各代理程式的 OpenClaw SQLite 資料庫中，位置為
`agents/<agentId>/agent/openclaw-agent.sqlite`。

| 鍵                   | 類型     | 預設值     | 說明                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5 斷詞器（`unicode61` 或 `trigram`） |

---

## QMD 後端設定

將 `memory.backend = "qmd"` 設定為啟用。所有 QMD 設定都位於 `memory.qmd` 之下：

| 鍵                      | 類型      | 預設值  | 說明                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 可執行檔路徑；當服務的 `PATH` 與你的殼層不同時，請設定絕對路徑 |
| `searchMode`             | `string`  | `search` | 搜尋命令：`search`、`vsearch`、`query`                                          |
| `rerank`                 | `boolean` | --       | 搭配 `searchMode: "query"` 和 QMD 2.1+ 設為 `false`，以略過 QMD 重新排序          |
| `includeDefaultMemory`   | `boolean` | `true`   | 自動為 `MEMORY.md` + `memory/**/*.md` 建立索引                                             |
| `paths[]`                | `array`   | --       | 額外路徑：`{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | 將工作階段逐字稿匯出至 QMD                                                   |
| `sessions.retentionDays` | `number`  | --       | 逐字稿保留期限                                                                  |
| `sessions.exportDir`     | `string`  | --       | 匯出目錄                                                                      |

`searchMode: "search"` 僅使用詞彙／BM25。OpenClaw 不會針對該模式執行語意向量就緒探測或 QMD 嵌入維護，包括在 `memory status --deep` 期間；`vsearch` 和 `query` 仍需要 QMD 向量就緒且已產生嵌入。

`rerank: false` 只會變更 QMD 的 `query` 模式，且需要 QMD 2.1 或更新版本。在直接命令列介面模式中，OpenClaw 會傳遞 `--no-rerank`；在 mcporter 支援的 MCP 模式中，則會將 `rerank: false` 傳遞給 QMD 的統一查詢工具。若不設定，則使用 QMD 的預設查詢重新排序行為。

OpenClaw 優先使用目前的 QMD 集合與 MCP 查詢結構，但為了讓舊版 QMD 繼續運作，必要時會嘗試相容的集合模式旗標和較舊的 MCP 工具名稱。當 QMD 宣告支援多個集合篩選器時，會以單一 QMD 程序搜尋同來源集合；較舊的 QMD 組建版本則繼續使用逐集合相容路徑。同來源是指將持久記憶集合（預設記憶檔案加上自訂路徑）分組在一起，而工作階段逐字稿集合仍維持為獨立群組，讓來源多樣化仍能同時取得兩種輸入。

<Note>
QMD 模型覆寫設定保留在 QMD 端，而非 OpenClaw 設定中。若需要全域覆寫 QMD 的模型，請在閘道執行階段環境中設定 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL` 等環境變數。
</Note>

### mcporter 整合

全部位於 `memory.qmd.mcporter` 之下。將 QMD 搜尋導向長期執行的 `mcporter` MCP 常駐程式，而不是每次查詢都建立 `qmd`，以降低大型模型的冷啟動負擔。

| 鍵           | 類型      | 預設值 | 說明                                                            |
| ------------- | --------- | ------- | ---------------------------------------------------------------------- |
| `enabled`     | `boolean` | `false` | 將 QMD 呼叫導向 mcporter，而不是每次要求都建立 `qmd` |
| `serverName`  | `string`  | `qmd`   | 使用 `lifecycle: keep-alive` 執行 `qmd mcp` 的 mcporter 伺服器名稱  |
| `startDaemon` | `boolean` | `true`  | 當 `enabled` 為 true 時，自動啟動 mcporter 常駐程式         |

需要安裝 `mcporter` 並將其加入 PATH，且必須設定一個執行 `qmd mcp` 的 mcporter 伺服器。對於可接受每次查詢建立程序成本的簡易本機設定，請維持停用。

<AccordionGroup>
  <Accordion title="更新排程">
    | 鍵                       | 類型      | 預設值 | 說明                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | 重新整理間隔                      |
    | `update.debounceMs`       | `number`  | `15000` | 對檔案變更進行防彈跳處理                 |
    | `update.onBoot`           | `boolean` | `true`  | 長期執行的 QMD 管理器開啟時重新整理；設為 false 可略過啟動時的立即更新 |
    | `update.startup`          | `string`  | `off`   | 選用的閘道啟動時 QMD 初始化：`off`、`idle` 或 `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | 執行 `startup: "idle"` 重新整理前的延遲 |
    | `update.waitForBootSync`  | `boolean` | `false` | 阻止管理器開啟，直到其初始重新整理完成 |
    | `update.embedInterval`    | `string`  | `60m`   | 獨立的嵌入週期                |
    | `update.commandTimeoutMs` | `number`  | `30000` | QMD 維護命令（集合清單／新增）的逾時時間 |
    | `update.updateTimeoutMs`  | `number`  | `120000` | 每個 `qmd update` 週期的逾時時間   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | 每個 `qmd embed` 週期的逾時時間    |
  </Accordion>
  <Accordion title="限制">
    | 鍵                       | 類型     | 預設值 | 說明                |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | 搜尋結果數量上限         |
    | `limits.maxSnippetChars`  | `number` | `450`   | 限制片段長度       |
    | `limits.maxInjectedChars` | `number` | `2200`  | 限制注入字元總數 |
    | `limits.timeoutMs`        | `number` | `4000`  | 由 QMD 支援的搜尋期間，QMD 命令的逾時時間，包括 `memory_search`；設定、同步、內建備援及補充工作仍使用預設工具期限 |
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

    隨附的預設值僅允許 DM／直接訊息，並拒絕群組及其他頻道類型。`match.keyPrefix` 會比對正規化的工作階段鍵；`match.rawKeyPrefix` 會比對包含 `agent:<id>:` 的原始鍵。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 適用於所有後端：

    | 值            | 行為                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto`（預設值） | 在片段中包含 `Source: <path#line>` 頁尾    |
    | `on`             | 一律包含頁尾                               |
    | `off`            | 省略頁尾（路徑仍會在內部傳遞給代理程式） |

  </Accordion>
</AccordionGroup>

啟用閘道啟動時的 QMD 初始化後，OpenClaw 只會為符合資格的代理程式啟動 QMD。若 `update.onBoot` 為 true，且未設定間隔／嵌入維護，啟動時會使用一次性管理器執行啟動重新整理，完成後將其關閉。若已設定更新或嵌入間隔，啟動時會開啟長期執行的 QMD 管理器，讓它管理監看器和間隔計時器；`update.onBoot: false` 只會略過啟動時的立即重新整理。

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

夢境整理應在 `plugins.entries.memory-core.config.dreaming` 下設定，而不是在 `agents.defaults.memorySearch` 下設定。

夢境整理會以單次排程掃描執行，並將內部的淺層／深層／REM 階段視為實作細節。

如需概念行為和斜線命令，請參閱[夢境整理](/zh-TW/concepts/dreaming)。

### 使用者設定

| 鍵                                    | 類型      | 預設值       | 說明                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | 完全啟用或停用夢境整理                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | 完整夢境整理掃描的選用排程週期                                                                                |
| `model`                                | `string`  | 預設模型 | 選用的 Dream Diary 子代理程式模型覆寫                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | 從每個提升至 `MEMORY.md` 的短期回憶片段中保留的估計權杖數上限；來源中繼資料仍然可見 |

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
- `dreaming.model` 使用現有的外掛子代理程式信任閘門；啟用前請先設定 `plugins.entries.memory-core.subagent.allowModelOverride: true`。
- 當設定的模型無法使用時，Dream Diary 會改用工作階段預設模型重試一次。信任或允許清單失敗會記錄至日誌，不會在不告知的情況下重試。
- 淺層／深層／REM 階段政策及閾值屬於內部行為，不是面向使用者的設定。

</Note>

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference)
- [記憶體概觀](/zh-TW/concepts/memory)
- [記憶體搜尋](/zh-TW/concepts/memory-search)
