---
read_when:
    - 您想要使用 GitHub Copilot 作為模型供應商
    - 你需要 `openclaw models auth login-github-copilot` 流程
summary: 從 OpenClaw 使用裝置流程或非互動式權杖匯入登入 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-05-10T19:48:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32268f86bc3e9d4f4d09d105c78c0fc9527aaebd8251865899711e86b25391e5
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot 是 GitHub 的 AI 程式碼助理。它會依據你的 GitHub 帳戶與方案提供 Copilot
模型存取權。OpenClaw 可以用兩種不同方式將 Copilot 作為模型
provider。

## 在 OpenClaw 中使用 Copilot 的兩種方式

<Tabs>
  <Tab title="內建 provider（github-copilot）">
    使用原生裝置登入流程取得 GitHub token，然後在 OpenClaw 執行時將它交換成
    Copilot API token。這是**預設**且最簡單的路徑，因為它不需要 VS Code。

    <Steps>
      <Step title="執行登入命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系統會提示你造訪一個 URL 並輸入一次性代碼。請保持
        terminal 開啟，直到流程完成。
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

  <Tab title="Copilot Proxy Plugin（copilot-proxy）">
    使用 **Copilot Proxy** VS Code 擴充功能作為本機橋接。OpenClaw 會與
    Proxy 的 `/v1` endpoint 通訊，並使用你在其中設定的模型清單。

    <Note>
    當你已經在 VS Code 中執行 Copilot Proxy，或需要透過它路由時，請選擇此方式。
    你必須啟用 Plugin，並保持 VS Code 擴充功能執行中。
    </Note>

  </Tab>
</Tabs>

## 選用旗標

| 旗標            | 說明                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | 略過確認提示                        |
| `--set-default` | 同時套用 provider 建議的預設模型 |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非互動式 onboarding

如果你已經有可供 Copilot 使用的 GitHub OAuth access token，可以在
headless setup 期間透過 `openclaw onboard --non-interactive` 匯入它：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

你也可以省略 `--auth-choice`；傳入 `--github-copilot-token` 會推斷為
GitHub Copilot provider auth choice。如果省略此旗標，onboarding 會依序
fallback 到 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`，再到 `GITHUB_TOKEN`。搭配已設定的
`COPILOT_GITHUB_TOKEN` 使用 `--secret-input-mode ref`，可儲存由環境變數支援的
`tokenRef`，而不是在 `auth-profiles.json` 中儲存明文。

<AccordionGroup>
  <Accordion title="需要互動式 TTY">
    裝置登入流程需要互動式 TTY。請直接在
    terminal 中執行，不要在非互動式 script 或 CI pipeline 中執行。
  </Accordion>

  <Accordion title="模型可用性取決於你的方案">
    Copilot 模型可用性取決於你的 GitHub 方案。如果模型被
    拒絕，請嘗試另一個 ID（例如 `github-copilot/gpt-4.1`）。
  </Accordion>

  <Accordion title="從 Copilot API 即時重新整理 catalog">
    一旦裝置登入（或 env-var）auth 路徑解析出 GitHub token，
    OpenClaw 就會依需求從 `${baseUrl}/models`
    （與 VS Code Copilot 使用的相同 endpoint）重新整理模型 catalog，因此 runtime 會追蹤
    每個帳戶的 entitlement 和準確的 context window，而不需要 manifest
    churn。新發布的 Copilot 模型無須 OpenClaw
    升級即可顯示，context window 也會反映真實的每模型限制
    （例如 gpt-5.x 系列為 400k，內部
    `claude-opus-*-1m` variants 為 1M）。

    當 discovery 停用、使用者沒有 GitHub auth profile、token-exchange
    失敗，或 `/models` HTTPS 呼叫出錯時，bundled static catalog 會維持作為可見 fallback。
    若要選擇退出並完全依賴 static manifest catalog
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
    Claude 模型 ID 會自動使用 Anthropic Messages transport。GPT、
    o-series 與 Gemini 模型會保留 OpenAI Responses transport。OpenClaw
    會根據 model ref 選擇正確的 transport。
  </Accordion>

  <Accordion title="請求相容性">
    OpenClaw 會在 Copilot transports 上傳送 Copilot IDE 風格的 request headers，
    包含內建 compaction、tool-result 與 image follow-up turns。除非
    已針對 Copilot 的 API 驗證該行為，否則它不會為 Copilot
    啟用 provider-level Responses continuation。
  </Accordion>

  <Accordion title="環境變數解析順序">
    OpenClaw 會依下列優先順序從環境變數解析 Copilot auth：

    | 優先順序 | 變數              | 備註                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最高優先順序，Copilot 專用 |
    | 2        | `GH_TOKEN`            | GitHub CLI token（fallback）      |
    | 3        | `GITHUB_TOKEN`        | 標準 GitHub token（最低）   |

    當設定多個變數時，OpenClaw 會使用最高優先順序的那一個。
    裝置登入流程（`openclaw models auth login-github-copilot`）會將
    其 token 儲存在 auth profile store 中，並優先於所有環境
    變數。

  </Accordion>

  <Accordion title="Token 儲存">
    登入會在 auth profile store 中儲存 GitHub token，並在
    OpenClaw 執行時將它交換成 Copilot API token。你不需要手動管理
    token。
  </Accordion>
</AccordionGroup>

<Warning>
裝置登入命令需要互動式 TTY。當你需要 headless setup 時，請使用非互動式
onboarding。
</Warning>

## 記憶體搜尋 embedding

GitHub Copilot 也可以作為
[memory search](/zh-TW/concepts/memory-search) 的 embedding provider。如果你有 Copilot 訂閱且
已登入，OpenClaw 可以在不需要額外 API key 的情況下使用它進行 embedding。

### 自動偵測

當 `memorySearch.provider` 為 `"auto"`（預設值）時，GitHub Copilot 會以
優先順序 15 被嘗試 -- 在本機 embedding 之後，但在 OpenAI 與其他付費
provider 之前。如果有可用的 GitHub token，OpenClaw 會從 Copilot API 探索可用的
embedding 模型，並自動選擇最佳模型。

### 明確設定

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

1. OpenClaw 解析你的 GitHub token（來自 env vars 或 auth profile）。
2. 將它交換成短效 Copilot API token。
3. 查詢 Copilot `/models` endpoint 以探索可用的 embedding 模型。
4. 選擇最佳模型（偏好 `text-embedding-3-small`）。
5. 將 embedding requests 傳送到 Copilot `/embeddings` endpoint。

模型可用性取決於你的 GitHub 方案。如果沒有可用的 embedding 模型，
OpenClaw 會略過 Copilot 並嘗試下一個 provider。

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇 providers、model refs 與 failover 行為。
  </Card>
  <Card title="OAuth 與 auth" href="/zh-TW/gateway/authentication" icon="key">
    Auth 詳細資訊與 credential reuse 規則。
  </Card>
</CardGroup>
