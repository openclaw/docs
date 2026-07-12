---
read_when:
    - 你想要使用 GitHub Copilot 作為模型供應商
    - 你需要 `openclaw models auth login-github-copilot` 流程
    - 您正在內建 Copilot 提供者、Copilot SDK 控制框架與 Copilot Proxy 之間進行選擇
summary: 使用裝置流程或非互動式權杖匯入，從 OpenClaw 登入 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-11T21:42:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot 是 GitHub 的 AI 程式設計助理。它可讓你的 GitHub 帳戶與方案存取 Copilot
模型。OpenClaw 能以三種不同方式將 Copilot 用作模型
供應商或代理程式執行階段。

## 在 OpenClaw 中使用 Copilot 的三種方式

<Tabs>
  <Tab title="內建供應商（github-copilot）">
    使用原生裝置登入流程取得 GitHub 權杖，接著在 OpenClaw 執行時，
    將其交換為 Copilot API 權杖。這是**預設**且最簡單的方式，
    因為不需要 VS Code。

    <Steps>
      <Step title="執行登入命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系統會提示你造訪一個 URL 並輸入一次性代碼。在流程完成前，
        請保持終端機開啟。
      </Step>
      <Step title="設定預設模型">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        或在設定中指定：

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot SDK 控制框架外掛（copilot）">
    如果你希望由 GitHub 的 Copilot 命令列介面與 SDK 負責所選
    `github-copilot/*` 模型的底層代理程式迴圈，請安裝外部
    `@openclaw/copilot` 外掛。

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    接著選擇讓模型或供應商使用該執行階段：

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    如果你希望這些代理程式回合使用原生 Copilot 命令列介面工作階段、
    由 SDK 管理的執行緒狀態，以及由 Copilot 負責的壓縮，請選擇此方式。
    若未明確透過 `agentRuntime` 啟用，`github-copilot/*` 模型仍會使用
    內建供應商。完整的執行階段契約請參閱
    [Copilot SDK 控制框架](/zh-TW/plugins/copilot)。

  </Tab>

  <Tab title="Copilot Proxy 外掛（copilot-proxy）">
    使用 **Copilot Proxy** VS Code 擴充功能作為本機橋接器。OpenClaw 會連線至
    Proxy 的 `/v1` 端點（預設為 `http://localhost:3000/v1`），並使用你
    設定的模型清單。

    `copilot-proxy` 外掛隨 OpenClaw 提供，且預設啟用。
    使用以下命令設定基底 URL 與模型 ID：

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    如果你已在 VS Code 中執行 Copilot Proxy，或需要透過它進行路由，
    請選擇此方式。VS Code 擴充功能必須持續執行。
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise（資料落地）

如果你的組織使用具備資料落地功能的 GitHub Enterprise 租戶（例如
`your-org.ghe.com` 這類 `*.ghe.com` 主機），Copilot 會位於租戶本機
端點，而非公用 `github.com`。OpenClaw 將此功能公開為
第一級驗證選項，因此你不需要手動編輯 URL。

<Steps>
  <Step title="選擇 Enterprise 驗證選項">
    在新手引導或 `openclaw models auth` 中，選擇
    **GitHub Copilot（Enterprise／資料落地）**。系統會提示你輸入
    Enterprise 網域（例如 `your-org.ghe.com`），接著針對該租戶
    執行裝置登入。

    請只輸入租戶根網域（`your-org.ghe.com`）。不接受
    `api.your-org.ghe.com` 或 `copilot-api.your-org.ghe.com` 等衍生服務主機；
    OpenClaw 會自動從租戶根網域衍生這些端點。

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="將網域保存至設定">
    所選主機會儲存在供應商參數下，讓後續的權杖重新整理與補全
    自動以該租戶為目標：

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

裝置流程、權杖交換及補全會分別解析至
`https://your-org.ghe.com/login/device/code`、
`https://api.your-org.ghe.com/copilot_internal/v2/token` 與
`https://copilot-api.your-org.ghe.com`。資料落地權杖帶有
租戶標記且不含 Proxy 提示，因此補全的基底 URL 會回退至
租戶的 Copilot 主機，而非公用端點。

<Note>
切換網域一律會重新執行裝置登入。如果你已有儲存的
Copilot 權杖，並選擇不同的網域（在公用 `github.com` 與 `*.ghe.com`
租戶之間切換，或從一個租戶切換至另一個租戶），OpenClaw 不會重複使用現有權杖，
而會強制重新登入，以確保權杖的範圍符合即將寫入設定的網域。
針對*相同*網域重新登入時，仍會詢問是否要重複使用目前的
權杖。切換回公用 `github.com` 時，會清除保存的
`githubDomain`，使設定恢復為預設值。
</Note>

<Note>
`COPILOT_GITHUB_DOMAIN` 環境變數會覆寫所有解析 Copilot 路徑時所使用的網域，
包括 Enterprise 裝置登入（`--method device-enterprise`）、獨立的
`openclaw models auth login-github-copilot` 捷徑、權杖重新整理、嵌入，
以及補全。若要進行完全無人值守或 CI 設定，請將它設為你的
`*.ghe.com` 主機。若要使用公用 `github.com`，請勿設定此變數
（且不要加入設定參數）。登入流程會保存簽發權杖時所使用的網域
（針對公用 `github.com` 登入時則會清除網域），因此即使之後取消設定
環境變數，路由仍會保持正確。
</Note>

## 選用旗標

| 命令                                                                   | 旗標            | 說明                                     |
| ---------------------------------------------------------------------- | --------------- | ---------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | 不經提示即覆寫現有驗證設定檔             |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | 同時套用供應商建議的預設模型             |

```bash
# 略過重新登入確認
openclaw models auth login-github-copilot --yes

# 在一個步驟中登入並設定預設模型
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非互動式新手引導

裝置登入流程需要互動式終端介面。若要進行無介面設定，請使用
`openclaw onboard --non-interactive` 匯入現有的 GitHub OAuth 存取權杖：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

你也可以省略 `--auth-choice`；傳入 `--github-copilot-token` 時，
系統會推斷使用 GitHub Copilot 供應商驗證選項。如果省略該旗標，新手引導會依序
回退至 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`，最後是 `GITHUB_TOKEN`。若要在
`auth-profiles.json` 中儲存由環境變數支援的 `tokenRef`，而非純文字，
請設定 `COPILOT_GITHUB_TOKEN` 並使用 `--secret-input-mode ref`。

<AccordionGroup>
  <Accordion title="需要互動式終端介面">
    裝置登入流程需要互動式終端介面。請直接在終端機中執行，
    不要在非互動式指令碼或 CI 管線中執行。
  </Accordion>

  <Accordion title="模型可用性取決於你的方案">
    Copilot 模型的可用性取決於你的 GitHub 方案。如果模型遭到拒絕，
    請嘗試其他 ID（例如 `github-copilot/gpt-5.5`）。目前的模型清單請參閱
    GitHub 的[各 Copilot 方案支援的模型](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)。
  </Accordion>

  <Accordion title="從 Copilot API 即時重新整理目錄">
    當裝置登入（或環境變數）驗證路徑解析出 GitHub 權杖後，
    OpenClaw 會視需要從 `${baseUrl}/models` 重新整理模型目錄
    （與 VS Code Copilot 使用相同的端點），讓執行階段能追蹤
    各帳戶的使用權限與準確的上下文視窗，而不必頻繁變更資訊清單。
    新發布的 Copilot 模型不需升級 OpenClaw 即可顯示，
    且上下文視窗會反映各模型的實際限制
    （例如 gpt-5.x 系列為 400k，內部
    `claude-opus-*-1m` 變體為 1M）。

    當探索功能停用、使用者沒有 GitHub 驗證設定檔、權杖交換
    失敗，或呼叫 `/models` 的 HTTPS 請求發生錯誤時，隨附的靜態目錄
    仍會作為可見的回退選項。若要停用此功能並完全依賴
    靜態資訊清單目錄（離線／實體隔離情境）：

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="傳輸方式選擇">
    Claude 模型 ID 會自動使用 Anthropic Messages 傳輸方式。
    Gemini 模型使用 OpenAI Chat Completions 傳輸方式；GPT 與 o 系列
    模型則繼續使用 OpenAI Responses 傳輸方式。OpenClaw 會根據
    模型參照選擇正確的傳輸方式。
  </Accordion>

  <Accordion title="請求相容性">
    OpenClaw 會在 Copilot 傳輸方式中傳送 Copilot IDE 樣式的請求標頭
    （VS Code 編輯器／外掛版本及 `vscode-chat` 整合 ID），
    將工具結果的後續回合標示為由代理程式發起，並在回合包含圖片輸入時
    設定 Copilot 視覺標頭。
  </Accordion>

  <Accordion title="環境變數解析順序">
    OpenClaw 會依照以下優先順序，從環境變數解析 Copilot 驗證資訊：

    | 優先順序 | 變數                   | 備註                                  |
    | -------- | ---------------------- | ------------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最高優先順序，Copilot 專用            |
    | 2        | `GH_TOKEN`             | GitHub 命令列介面權杖（回退選項）     |
    | 3        | `GITHUB_TOKEN`         | 標準 GitHub 權杖（最低優先順序）      |

    設定多個變數時，OpenClaw 會使用優先順序最高的變數。
    裝置登入流程（`openclaw models auth login-github-copilot`）會將
    權杖儲存在驗證設定檔儲存區中，且其優先順序高於所有環境
    變數。

  </Accordion>

  <Accordion title="權杖儲存">
    登入流程會將 GitHub 權杖儲存在驗證設定檔儲存區中（設定檔 ID 為
    `github-copilot:github`），並在 OpenClaw 執行時將其交換為短效的
    Copilot API 權杖。你不需要手動管理該權杖。
  </Accordion>
</AccordionGroup>

## 記憶搜尋嵌入

GitHub Copilot 也可作為[記憶搜尋](/zh-TW/concepts/memory-search)的嵌入供應商。
如果你訂閱了 Copilot 且已登入，OpenClaw 無需個別的 API 金鑰
即可使用它產生嵌入。

### 設定

明確將 `memorySearch.provider` 設為 GitHub Copilot，即可使用 GitHub Copilot
嵌入。如果有可用的 GitHub 權杖，OpenClaw 會從 Copilot API
探索可用的嵌入模型，並自動選擇最佳模型。

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // 選用：覆寫自動探索的模型
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 運作方式

1. OpenClaw 解析你的 GitHub 權杖（來自環境變數或驗證設定檔）。
2. 將其交換為短效的 Copilot API 權杖。
3. 查詢 Copilot `/models` 端點，以探索可用的嵌入模型。
4. 選擇最佳模型（偏好順序：`text-embedding-3-small`、
   `text-embedding-3-large`、`text-embedding-ada-002`）。
5. 將嵌入請求傳送至 Copilot `/embeddings` 端點。

模型可用性取決於你的 GitHub 方案。如果沒有可用的嵌入模型，
OpenClaw 會略過 Copilot 並嘗試下一個供應商。

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與憑證重複使用規則。
  </Card>
</CardGroup>
