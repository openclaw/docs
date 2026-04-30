---
read_when:
    - 你想使用 GitHub Copilot 作為模型提供者
    - 你需要 `openclaw models auth login-github-copilot` 流程
summary: 使用裝置流程或非互動式權杖匯入，從 OpenClaw 登入 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T03:30:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot 是 GitHub 的 AI 程式碼助理。它會依據你的 GitHub 帳戶與方案，提供 Copilot 模型存取權。OpenClaw 可以用兩種不同方式將 Copilot 作為模型提供者。

## 在 OpenClaw 中使用 Copilot 的兩種方式

<Tabs>
  <Tab title="內建提供者 (github-copilot)">
    使用原生裝置登入流程取得 GitHub 權杖，然後在 OpenClaw 執行時將它交換為
    Copilot API 權杖。這是**預設**且最簡單的路徑，因為它不需要 VS Code。

    <Steps>
      <Step title="執行登入命令">
        ```bash
        openclaw models auth login-github-copilot
        ```

        系統會提示你造訪一個 URL 並輸入一次性代碼。請保持終端機開啟，直到流程完成。
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

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    使用 **Copilot Proxy** VS Code 擴充功能作為本機橋接。OpenClaw 會連到 Proxy 的 `/v1` 端點，並使用你在那裡設定的模型清單。

    <Note>
    如果你已經在 VS Code 中執行 Copilot Proxy，或需要透過它轉送，請選擇此方式。你必須啟用該 Plugin，並保持 VS Code 擴充功能執行中。
    </Note>

  </Tab>
</Tabs>

## 選用旗標

| 旗標            | 說明                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | 略過確認提示                        |
| `--set-default` | 同時套用該提供者建議的預設模型 |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## 非互動式導引

如果你已經有 Copilot 的 GitHub OAuth 存取權杖，可以在無介面設定期間使用 `openclaw onboard --non-interactive` 匯入它：

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

你也可以省略 `--auth-choice`；傳入 `--github-copilot-token` 會推斷使用 GitHub Copilot 提供者身分驗證選項。如果省略該旗標，導引會依序退回使用 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`，然後是 `GITHUB_TOKEN`。搭配已設定的 `COPILOT_GITHUB_TOKEN` 使用 `--secret-input-mode ref`，可儲存由環境變數支援的 `tokenRef`，而不是在 `auth-profiles.json` 中儲存明文。

<AccordionGroup>
  <Accordion title="需要互動式 TTY">
    裝置登入流程需要互動式 TTY。請直接在終端機中執行，不要在非互動式指令碼或 CI 管線中執行。
  </Accordion>

  <Accordion title="模型可用性取決於你的方案">
    Copilot 模型可用性取決於你的 GitHub 方案。如果某個模型遭拒，請嘗試其他 ID（例如 `github-copilot/gpt-4.1`）。
  </Accordion>

  <Accordion title="傳輸選擇">
    Claude 模型 ID 會自動使用 Anthropic Messages 傳輸。GPT、o-series 和 Gemini 模型會維持使用 OpenAI Responses 傳輸。OpenClaw 會根據模型參照選擇正確的傳輸。
  </Accordion>

  <Accordion title="請求相容性">
    OpenClaw 會在 Copilot 傳輸上傳送 Copilot IDE 風格的請求標頭，包括內建 Compaction、工具結果和影像後續回合。除非已針對 Copilot 的 API 驗證該行為，否則它不會為 Copilot 啟用提供者層級的 Responses 接續。
  </Accordion>

  <Accordion title="環境變數解析順序">
    OpenClaw 會依下列優先順序從環境變數解析 Copilot 身分驗證：

    | 優先順序 | 變數              | 備註                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 最高優先順序，Copilot 專用 |
    | 2        | `GH_TOKEN`            | GitHub CLI 權杖（備用）      |
    | 3        | `GITHUB_TOKEN`        | 標準 GitHub 權杖（最低）   |

    設定多個變數時，OpenClaw 會使用優先順序最高的一個。裝置登入流程（`openclaw models auth login-github-copilot`）會將其權杖儲存在身分驗證設定檔存放區中，並優先於所有環境變數。

  </Accordion>

  <Accordion title="權杖儲存">
    登入會在身分驗證設定檔存放區中儲存 GitHub 權杖，並在 OpenClaw 執行時將它交換為 Copilot API 權杖。你不需要手動管理該權杖。
  </Accordion>
</AccordionGroup>

<Warning>
裝置登入命令需要互動式 TTY。需要無介面設定時，請使用非互動式導引。
</Warning>

## 記憶搜尋嵌入

GitHub Copilot 也可以作為 [memory search](/zh-TW/concepts/memory-search) 的嵌入提供者。如果你有 Copilot 訂閱且已登入，OpenClaw 就可以使用它產生嵌入，不需要另外的 API 金鑰。

### 自動偵測

當 `memorySearch.provider` 是 `"auto"`（預設值）時，系統會以優先順序 15 嘗試 GitHub Copilot，也就是在本機嵌入之後、OpenAI 和其他付費提供者之前。如果 GitHub 權杖可用，OpenClaw 會從 Copilot API 探索可用的嵌入模型，並自動挑選最佳模型。

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

1. OpenClaw 會解析你的 GitHub 權杖（來自環境變數或身分驗證設定檔）。
2. 將它交換為短效 Copilot API 權杖。
3. 查詢 Copilot `/models` 端點，以探索可用的嵌入模型。
4. 挑選最佳模型（偏好 `text-embedding-3-small`）。
5. 將嵌入請求傳送到 Copilot `/embeddings` 端點。

模型可用性取決於你的 GitHub 方案。如果沒有可用的嵌入模型，OpenClaw 會略過 Copilot 並嘗試下一個提供者。

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="OAuth 與身分驗證" href="/zh-TW/gateway/authentication" icon="key">
    身分驗證詳細資料和憑證重用規則。
  </Card>
</CardGroup>
