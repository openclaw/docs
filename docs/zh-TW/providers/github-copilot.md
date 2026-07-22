---
read_when:
    - 你想使用 GitHub Copilot 作為模型供應商
    - 你需要 `openclaw models auth login-github-copilot` 流程
    - 你正在內建 Copilot 提供者、Copilot SDK 控制框架與 Copilot Proxy 之間進行選擇
summary: 使用裝置流程或非互動式權杖匯入，從 OpenClaw 登入 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-22T10:44:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e839e6c72e7e7cb106a2f98c62c4994b4f3d6f34a2e76b549f2f6ccfdac91fe6
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot 是 GitHub 的 AI 程式設計助理。它可讓你的 GitHub 帳戶和方案存取 Copilot
模型。OpenClaw 可以透過三種不同方式，將 Copilot 用作模型
供應商或代理程式執行階段。

## 在 OpenClaw 中使用 Copilot 的三種方式

<Tabs>
  <Tab title="內建供應商 (github-copilot)">
    使用原生裝置登入流程取得 GitHub 權杖，然後在 OpenClaw 執行時將其交換為
    Copilot API 權杖。這是**預設**且最簡單的方式，
    因為不需要 VS Code。

    <Steps>
      <Step title="執行登入命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系統會提示你造訪 URL 並輸入一次性代碼。請保持
        終端機開啟，直到流程完成。
      </Step>
      <Step title="設定預設模型">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        或在設定中：

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

  <Tab title="Copilot SDK 控制框架外掛 (copilot)">
    若要讓 GitHub 的 Copilot 命令列介面和 SDK 負責所選
    `github-copilot/*` 模型的底層代理程式迴圈，請安裝外部 `@openclaw/copilot` 外掛。

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    接著選擇讓某個模型或供應商使用該執行階段：

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

    若你希望這些代理程式回合使用原生 Copilot 命令列介面工作階段、由 SDK 管理的執行緒
    狀態，以及由 Copilot 負責的壓縮，請選擇此方式。若未明確選擇加入
    `agentRuntime`，`github-copilot/*` 模型會繼續使用
    內建供應商。完整的執行階段合約請參閱 [Copilot SDK 控制框架](/zh-TW/plugins/copilot)。

  </Tab>

  <Tab title="Copilot Proxy 外掛 (copilot-proxy)">
    使用 **Copilot Proxy** VS Code 擴充功能作為本機橋接器。OpenClaw 會與
    Proxy 的 `/v1` 端點（預設為 `http://localhost:3000/v1`）通訊，並使用你
    設定的模型清單。

    `copilot-proxy` 外掛隨 OpenClaw 提供，且預設為啟用。
    使用以下命令設定基底 URL 和模型 ID：

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    如果你已在 VS Code 中執行 Copilot Proxy，或需要透過它進行路由，請選擇此方式。
    VS Code 擴充功能必須持續執行。
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise（資料落地）

如果你的組織使用具備資料落地功能的 GitHub Enterprise 租用戶（例如
`your-org.ghe.com` 這類 `*.ghe.com` 主機），Copilot 會位於租用戶本機
端點，而不是公用的 `github.com`。OpenClaw 將此功能提供為
第一級驗證選項，因此你不需要手動編輯 URL。

<Steps>
  <Step title="選擇 Enterprise 驗證選項">
    在初始設定或 `openclaw models auth` 中，選擇
    **GitHub Copilot (Enterprise / data residency)**。系統會提示你輸入
    Enterprise 網域（例如 `your-org.ghe.com`），接著會針對該租用戶
    執行裝置登入。

    僅輸入租用戶根網域（`your-org.ghe.com`）。不接受
    `api.your-org.ghe.com` 或 `copilot-api.your-org.ghe.com` 等衍生服務主機；
    OpenClaw 會自動從租用戶根網域推導這些端點。

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="將網域保存至設定">
    所選主機會儲存在供應商參數下，讓後續權杖重新整理
    與補全請求自動以該租用戶為目標：

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

裝置流程、權杖交換和補全分別解析至
`https://your-org.ghe.com/login/device/code`、
`https://api.your-org.ghe.com/copilot_internal/v2/token` 和
`https://copilot-api.your-org.ghe.com`。資料落地權杖帶有
租用戶標記且沒有 Proxy 提示，因此補全基底 URL 會改用
租用戶 Copilot 主機，而非公用端點。

<Note>
切換網域一律會重新執行裝置登入。如果你已儲存
Copilot 權杖並選擇不同的網域（公用 `github.com` ↔ `*.ghe.com`
租用戶，或從一個租用戶切換至另一個租用戶），OpenClaw 不會重複使用現有權杖，
而會強制執行全新登入，確保權杖的作用域與要寫入
設定的網域一致。針對*相同*網域重新執行登入時，仍會提供重複使用目前
權杖的選項。切換回公用 `github.com` 時，會清除已保存的
`githubDomain`，讓設定恢復為預設值。
</Note>

<Note>
`COPILOT_GITHUB_DOMAIN` 環境變數會覆寫所有解析 Copilot 網域之路徑所解析出的網域，
包括 Enterprise 裝置登入
（`--method device-enterprise`）、獨立的
`openclaw models auth login-github-copilot` 捷徑、權杖重新整理、嵌入
和補全。若是完全無介面或 CI 設定，請將其設為你的 `*.ghe.com` 主機。
若要使用公用 `github.com`，請不要設定此變數（且不要加入設定參數）。
登入流程會保存簽發權杖時使用的網域（針對公用 `github.com` 登入時則會
將其清除），因此即使取消設定環境變數，路由仍會保持正確。
</Note>

## 選用旗標

| 命令                                                                    | 旗標            | 說明                                         |
| ---------------------------------------------------------------------- | --------------- | -------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | 不提示並覆寫現有的驗證設定檔                 |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | 同時套用供應商建議的預設模型                 |

```bash
# 略過重新登入確認
openclaw models auth login-github-copilot --yes

# 一次完成登入並設定預設模型
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非互動式初始設定

裝置登入流程需要互動式 TTY。若要進行無介面設定，請使用 `openclaw onboard --non-interactive`
匯入現有的 GitHub OAuth 存取權杖：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

你也可以省略 `--auth-choice`；傳入 `--github-copilot-token` 時，系統會推斷
GitHub Copilot 供應商驗證選項。如果省略該旗標，初始設定會依序改用
`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`，再使用 `GITHUB_TOKEN`。若要儲存
由環境變數支援的 `tokenRef`，而非在 `auth-profiles.json` 中以純文字儲存，
請搭配已設定的 `COPILOT_GITHUB_TOKEN` 使用 `--secret-input-mode ref`。

<AccordionGroup>
  <Accordion title="需要互動式 TTY">
    裝置登入流程需要互動式 TTY。請直接在
    終端機中執行，而不要在非互動式指令碼或 CI 流水線中執行。
  </Accordion>

  <Accordion title="模型可用性取決於你的方案">
    Copilot 模型的可用性取決於你的 GitHub 方案。如果模型
    遭到拒絕，請嘗試其他 ID（例如 `github-copilot/gpt-5.5`）。目前的模型清單請參閱
    GitHub 的[各 Copilot 方案支援的模型](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)。
  </Accordion>

  <Accordion title="從 Copilot API 即時重新整理目錄">
    裝置登入（或環境變數）驗證路徑解析出 GitHub 權杖後，
    OpenClaw 會視需要從 `${baseUrl}/models`
    （與 VS Code Copilot 使用相同的端點）重新整理模型目錄，讓執行階段能追蹤
    每個帳戶的使用權限和準確的上下文視窗，且不需要反覆變更資訊清單。
    新發布的 Copilot 模型不需升級 OpenClaw 即可顯示，
    且上下文視窗會反映每個模型的實際限制
    （例如 gpt-5.x 系列為 400k，內部
    `claude-opus-*-1m` 變體為 1M）。

    當探索功能停用、使用者沒有 GitHub 驗證設定檔、權杖交換
    失敗，或 `/models` HTTPS 呼叫發生錯誤時，隨附的靜態目錄仍會作為
    可見的備援。若要選擇退出並完全依賴靜態資訊清單目錄
    （離線／實體隔離情境）：

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
    Gemini 模型會使用 OpenAI Chat Completions 傳輸方式；GPT 和 o 系列
    模型則繼續使用 OpenAI Responses 傳輸方式。OpenClaw 會根據
    模型參照選擇正確的傳輸方式。
  </Accordion>

  <Accordion title="請求相容性">
    OpenClaw 會在 Copilot 傳輸方式上傳送 Copilot IDE 風格的請求標頭
    （VS Code 編輯器／外掛版本和 `vscode-chat` 整合 ID），
    將工具結果的後續回合標記為由代理程式發起，並在回合包含圖片輸入時設定 Copilot
    視覺標頭。
  </Accordion>

  <Accordion title="環境變數解析順序">
    OpenClaw 依照下列優先順序，從環境變數解析 Copilot 驗證：

    | 優先順序 | 變數                  | 備註                              |
    | -------- | --------------------- | --------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最高優先順序，Copilot 專用        |
    | 2        | `GH_TOKEN`            | GitHub 命令列介面權杖（備援）     |
    | 3        | `GITHUB_TOKEN`        | 標準 GitHub 權杖（最低優先順序）  |

    設定多個變數時，OpenClaw 會使用優先順序最高的變數。
    裝置登入流程（`openclaw models auth login-github-copilot`）會將
    權杖儲存在驗證設定檔存放區，且其優先順序高於所有環境
    變數。

  </Accordion>

  <Accordion title="權杖儲存">
    登入流程會將 GitHub 權杖儲存在驗證設定檔存放區（設定檔 ID
    `github-copilot:github`），並在 OpenClaw 執行時，將其交換為短期 Copilot API
    權杖。你不需要手動管理權杖。
  </Accordion>
</AccordionGroup>

## 記憶搜尋嵌入

GitHub Copilot 也可作為
[記憶搜尋](/zh-TW/concepts/memory-search)的嵌入供應商。如果你訂閱了 Copilot 且
已登入，OpenClaw 可以使用它產生嵌入，而不需要另外的 API 金鑰。

### 設定

明確將 `memory.search.provider` 設為使用 GitHub Copilot 嵌入。如果
GitHub 權杖可用，OpenClaw 會從 Copilot API 探索可用的嵌入模型，
並自動選擇最佳模型。

```json5
{
  memory: {
    search: {
      provider: "github-copilot",
      // 選用：覆寫自動探索的模型
      model: "text-embedding-3-small",
    },
  },
}
```

### 運作方式

1. OpenClaw 會解析你的 GitHub 權杖（來自環境變數或驗證設定檔）。
2. 將其交換為短期 Copilot API 權杖。
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
    驗證詳細資訊與認證資訊重複使用規則。
  </Card>
</CardGroup>
