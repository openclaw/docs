---
read_when:
    - 你想要使用 GitHub Copilot 作為模型提供者
    - 你需要 `openclaw models auth login-github-copilot` 流程
    - 你正在內建 Copilot 供應商、Copilot SDK 測試框架與 Copilot Proxy 之間做選擇
summary: 使用裝置流程或非互動式權杖匯入，從 OpenClaw 登入 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T19:54:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot 是 GitHub 的 AI 程式碼助理。它會依你的 GitHub 帳戶與方案提供 Copilot
模型存取權。OpenClaw 可以用三種不同方式，將 Copilot 作為模型
提供者或代理程式執行環境。

## 在 OpenClaw 中使用 Copilot 的三種方式

<Tabs>
  <Tab title="內建提供者 (github-copilot)">
    使用原生 device-login 流程取得 GitHub 權杖，然後在 OpenClaw 執行時將它交換為
    Copilot API 權杖。這是**預設**且最簡單的路徑，
    因為它不需要 VS Code。

    <Steps>
      <Step title="執行登入命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系統會提示你造訪一個 URL 並輸入一次性代碼。請保持
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
    當你想讓 GitHub 的 Copilot 命令列介面與 SDK
    為所選的 `github-copilot/*` 模型掌管底層代理程式迴圈時，請安裝外部
    `@openclaw/copilot` 外掛。

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    然後讓模型或提供者選用該執行環境：

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

    當你希望這些代理程式回合使用原生 Copilot 命令列介面工作階段、由 SDK 管理的執行緒
    狀態，以及由 Copilot 掌管的壓縮時，請選擇此方式。完整的執行環境合約請參閱
    [Copilot SDK 控制框架](/zh-TW/plugins/copilot)。

  </Tab>

  <Tab title="Copilot Proxy 外掛 (copilot-proxy)">
    使用 **Copilot Proxy** VS Code 擴充功能作為本機橋接器。OpenClaw 會與
    proxy 的 `/v1` 端點通訊，並使用你在其中設定的模型清單。

    <Note>
    當你已經在 VS Code 中執行 Copilot Proxy，或需要透過它進行路由時，請選擇此方式。
    你必須啟用外掛，並保持 VS Code 擴充功能執行中。
    </Note>

  </Tab>
</Tabs>

## 選用旗標

| 旗標            | 說明                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | 略過確認提示                        |
| `--set-default` | 同時套用提供者建議的預設模型 |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非互動式導入

如果你已有可供 Copilot 使用的 GitHub OAuth 存取權杖，請在
無頭設定期間使用 `openclaw onboard --non-interactive` 匯入它：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

你也可以省略 `--auth-choice`；傳入 `--github-copilot-token` 會推斷為
GitHub Copilot 提供者驗證選項。如果省略該旗標，導入會依序回退到
`COPILOT_GITHUB_TOKEN`、`GH_TOKEN`，再到 `GITHUB_TOKEN`。設定
`COPILOT_GITHUB_TOKEN` 時，請搭配 `--secret-input-mode ref`，以儲存由環境支援的
`tokenRef`，而不是在 `auth-profiles.json` 中儲存明文。

<AccordionGroup>
  <Accordion title="需要互動式 TTY">
    device-login 流程需要互動式 TTY。請直接在
    終端機中執行，不要放在非互動式腳本或 CI 管線中。
  </Accordion>

  <Accordion title="模型可用性取決於你的方案">
    Copilot 模型可用性取決於你的 GitHub 方案。如果某個模型被
    拒絕，請嘗試另一個 ID（例如 `github-copilot/gpt-5.5`）。目前的模型清單請參閱
    GitHub 的[各 Copilot 方案支援模型](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)。
  </Accordion>

  <Accordion title="從 Copilot API 即時重新整理目錄">
    一旦 device-login（或 env-var）驗證路徑解析出 GitHub 權杖，
    OpenClaw 會依需求從 `${baseUrl}/models`
    （與 VS Code Copilot 使用的相同端點）重新整理模型目錄，讓執行環境追蹤
    每個帳戶的權益與準確的脈絡視窗，而不需要頻繁變更 manifest。
    新發布的 Copilot 模型不需要 OpenClaw
    升級即可顯示，且脈絡視窗會反映真實的逐模型限制
    （例如 gpt-5.x 系列為 400k，內部
    `claude-opus-*-1m` 變體為 1M）。

    當 discovery 停用、使用者沒有 GitHub 驗證設定檔、權杖交換
    失敗，或 `/models` HTTPS 呼叫出錯時，隨附的靜態目錄會作為可見的 fallback。
    若要選擇退出並完全依賴靜態 manifest 目錄
    （離線 / air-gapped 情境）：

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
    Claude 模型 ID 會自動使用 Anthropic Messages 傳輸。GPT、
    o-series 與 Gemini 模型會保留 OpenAI Responses 傳輸。OpenClaw
    會根據模型參照選取正確的傳輸。
  </Accordion>

  <Accordion title="請求相容性">
    OpenClaw 會在 Copilot 傳輸上傳送 Copilot IDE 風格的請求標頭，
    包含內建壓縮、工具結果與圖片後續回合。除非該行為已通過
    Copilot API 驗證，否則它不會為 Copilot 啟用提供者層級的 Responses continuation。
  </Accordion>

  <Accordion title="環境變數解析順序">
    OpenClaw 會依以下優先順序從環境變數解析 Copilot 驗證：

    | 優先順序 | 變數              | 備註                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最高優先順序，Copilot 專用 |
    | 2        | `GH_TOKEN`            | GitHub 命令列介面權杖（fallback）      |
    | 3        | `GITHUB_TOKEN`        | 標準 GitHub 權杖（最低）   |

    當設定多個變數時，OpenClaw 會使用優先順序最高的那一個。
    device-login 流程（`openclaw models auth login-github-copilot`）會將
    其權杖儲存在驗證設定檔儲存區，且優先於所有環境
    變數。

  </Accordion>

  <Accordion title="權杖儲存">
    登入會將 GitHub 權杖儲存在驗證設定檔儲存區，並在 OpenClaw 執行時將它
    交換為 Copilot API 權杖。你不需要手動管理
    權杖。
  </Accordion>
</AccordionGroup>

<Warning>
device-login 命令需要互動式 TTY。需要無頭設定時，請使用非互動式
導入。
</Warning>

## 記憶搜尋嵌入

GitHub Copilot 也可以作為
[記憶搜尋](/zh-TW/concepts/memory-search)的嵌入提供者。如果你有 Copilot 訂閱並且
已登入，OpenClaw 可以在不需要另外 API 金鑰的情況下使用它產生嵌入。

### 設定

明確設定 `memorySearch.provider` 以使用 GitHub Copilot 嵌入。如果
GitHub 權杖可用，OpenClaw 會從 Copilot API 探索可用的嵌入模型，
並自動選擇最佳模型。

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

1. OpenClaw 解析你的 GitHub 權杖（來自 env vars 或驗證設定檔）。
2. 將它交換為短效 Copilot API 權杖。
3. 查詢 Copilot `/models` 端點以探索可用的嵌入模型。
4. 選擇最佳模型（偏好 `text-embedding-3-small`）。
5. 將嵌入請求傳送到 Copilot `/embeddings` 端點。

模型可用性取決於你的 GitHub 方案。如果沒有可用的嵌入模型，
OpenClaw 會略過 Copilot 並嘗試下一個提供者。

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與 failover 行為。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與憑證重用規則。
  </Card>
</CardGroup>
