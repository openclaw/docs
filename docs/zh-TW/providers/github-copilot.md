---
read_when:
    - 你想要使用 GitHub Copilot 作為模型提供者
    - 你需要 `openclaw models auth login-github-copilot` 流程
    - 你正在內建 Copilot 供應器、Copilot SDK 測試框架與 Copilot Proxy 之間做選擇
summary: 從 OpenClaw 登入 GitHub Copilot，可使用裝置流程或非互動式權杖匯入
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-05T11:36:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8af0ed48af8586da0e2bd922e3a674b73c57fdaf25ae5a3a7988e38a467cab7f
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot 是 GitHub 的 AI 程式碼助理。它會依據你的 GitHub 帳戶與方案提供 Copilot
模型存取權。OpenClaw 可以用三種不同方式將 Copilot 作為模型提供者或代理執行階段。

## 在 OpenClaw 中使用 Copilot 的三種方式

<Tabs>
  <Tab title="內建提供者 (github-copilot)">
    使用原生裝置登入流程取得 GitHub 權杖，接著在 OpenClaw 執行時將其交換為
    Copilot API 權杖。這是**預設**且最簡單的路徑，因為它不需要 VS Code。

    <Steps>
      <Step title="執行登入命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系統會提示你造訪一個 URL 並輸入一次性代碼。請保持終端機開啟直到完成。
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

  <Tab title="Copilot SDK 操作框架外掛 (copilot)">
    當你希望 GitHub 的 Copilot 命令列介面與 SDK 為選定的
    `github-copilot/*` 模型掌管底層代理迴圈時，請安裝外部 `@openclaw/copilot` 外掛。

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    接著讓模型或提供者選擇加入該執行階段：

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

    當你想要原生 Copilot 命令列介面工作階段、由 SDK 管理的執行緒狀態，以及由 Copilot
    掌管那些代理回合的壓縮時，請選擇此方式。若沒有明確選擇加入 `agentRuntime`，
    `github-copilot/*` 模型會繼續使用內建提供者。完整執行階段合約請參閱
    [Copilot SDK 操作框架](/zh-TW/plugins/copilot)。

  </Tab>

  <Tab title="Copilot Proxy 外掛 (copilot-proxy)">
    使用 **Copilot Proxy** VS Code 擴充功能作為本機橋接。OpenClaw 會與
    Proxy 的 `/v1` 端點通訊（預設為 `http://localhost:3000/v1`），並使用你設定的模型清單。

    `copilot-proxy` 外掛隨 OpenClaw 一起出貨，且預設啟用。
    使用下列命令設定基礎 URL 與模型 ID：

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    當你已在 VS Code 中執行 Copilot Proxy，或需要透過它路由時，請選擇此方式。
    VS Code 擴充功能必須保持執行。
    </Note>

  </Tab>
</Tabs>

## 選用旗標

| 命令                                                                   | 旗標            | 說明                                               |
| ---------------------------------------------------------------------- | --------------- | -------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | 不提示即覆寫現有驗證設定檔                       |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | 同時套用該提供者建議的預設模型                   |

```bash
# Skip the re-login confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非互動式入門設定

裝置登入流程需要互動式 TTY。若要進行無頭設定，請使用 `openclaw onboard --non-interactive`
匯入現有的 GitHub OAuth 存取權杖：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

你也可以省略 `--auth-choice`；傳入 `--github-copilot-token` 會推斷使用 GitHub Copilot
提供者驗證選項。若省略該旗標，入門設定會依序回退到 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`，
再到 `GITHUB_TOKEN`。若設定了 `COPILOT_GITHUB_TOKEN`，可使用 `--secret-input-mode ref`
儲存由環境支援的 `tokenRef`，而不是在 `auth-profiles.json` 中儲存純文字。

<AccordionGroup>
  <Accordion title="需要互動式 TTY">
    裝置登入流程需要互動式 TTY。請直接在終端機中執行，不要在非互動式指令碼或 CI 管線中執行。
  </Accordion>

  <Accordion title="模型可用性取決於你的方案">
    Copilot 模型可用性取決於你的 GitHub 方案。若模型被拒絕，請嘗試其他 ID
    （例如 `github-copilot/gpt-5.5`）。目前的模型清單請參閱 GitHub 的
    [各 Copilot 方案支援的模型](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)。
  </Accordion>

  <Accordion title="從 Copilot API 即時重新整理目錄">
    一旦裝置登入（或環境變數）驗證路徑已解析出 GitHub 權杖，OpenClaw 會依需求從
    `${baseUrl}/models`（VS Code Copilot 使用的相同端點）重新整理模型目錄，讓執行階段能追蹤
    每個帳戶的權益與準確的上下文視窗，而不需要變更資訊清單。新發布的 Copilot 模型無須
    OpenClaw 升級即可顯示，且上下文視窗會反映實際的每模型限制
    （例如 gpt-5.x 系列為 400k，內部 `claude-opus-*-1m` 變體為 1M）。

    當停用探索、使用者沒有 GitHub 驗證設定檔、權杖交換失敗，或 `/models` HTTPS 呼叫出錯時，
    隨附的靜態目錄會作為可見的後援。若要選擇退出並完全依賴靜態資訊清單目錄
    （離線／氣隙情境）：

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

  <Accordion title="傳輸選擇">
    Claude 模型 ID 會自動使用 Anthropic Messages 傳輸。
    Gemini 模型使用 OpenAI Chat Completions 傳輸；GPT 與 o-series
    模型維持使用 OpenAI Responses 傳輸。OpenClaw 會根據模型參照選擇正確的傳輸。
  </Accordion>

  <Accordion title="請求相容性">
    OpenClaw 會在 Copilot 傳輸上傳送 Copilot IDE 風格的請求標頭
    （VS Code 編輯器／外掛版本與 `vscode-chat` 整合 ID），
    將工具結果後續回合標記為由代理發起，並在回合帶有圖片輸入時設定 Copilot vision 標頭。
  </Accordion>

  <Accordion title="環境變數解析順序">
    OpenClaw 會依下列優先順序從環境變數解析 Copilot 驗證：

    | 優先順序 | 變數                  | 備註                             |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最高優先順序，Copilot 專用      |
    | 2        | `GH_TOKEN`            | GitHub 命令列介面權杖（後援）   |
    | 3        | `GITHUB_TOKEN`        | 標準 GitHub 權杖（最低）        |

    當設定多個變數時，OpenClaw 會使用優先順序最高的那一個。
    裝置登入流程（`openclaw models auth login-github-copilot`）會將其權杖儲存在驗證設定檔儲存區，
    並優先於所有環境變數。
  </Accordion>

  <Accordion title="權杖儲存">
    登入會將 GitHub 權杖儲存在驗證設定檔儲存區（設定檔 ID
    `github-copilot:github`），並在 OpenClaw 執行時將其交換為短效 Copilot API
    權杖。你不需要手動管理該權杖。
  </Accordion>
</AccordionGroup>

## 記憶搜尋嵌入

GitHub Copilot 也可以作為[記憶搜尋](/zh-TW/concepts/memory-search)的嵌入提供者。
若你有 Copilot 訂閱且已登入，OpenClaw 可以使用它進行嵌入，而不需要另外的 API 金鑰。

### 設定

明確設定 `memorySearch.provider` 以使用 GitHub Copilot 嵌入。若 GitHub 權杖可用，
OpenClaw 會從 Copilot API 探索可用的嵌入模型，並自動挑選最佳模型。

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 運作方式

1. OpenClaw 解析你的 GitHub 權杖（來自環境變數或驗證設定檔）。
2. 將其交換為短效 Copilot API 權杖。
3. 查詢 Copilot `/models` 端點以探索可用的嵌入模型。
4. 挑選最佳模型（偏好順序：`text-embedding-3-small`、
   `text-embedding-3-large`、`text-embedding-ada-002`）。
5. 將嵌入請求傳送到 Copilot `/embeddings` 端點。

模型可用性取決於你的 GitHub 方案。若沒有可用的嵌入模型，
OpenClaw 會略過 Copilot 並嘗試下一個提供者。

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資料與憑證重用規則。
  </Card>
</CardGroup>
