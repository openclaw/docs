---
read_when:
    - 您想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中透過 API 金鑰或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:23:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 建構 **Claude** 模型家族。OpenClaw 支援兩種驗證路徑：

- **API 金鑰** — 直接存取 Anthropic API，並依用量計費（`anthropic/*` 模型）
- **Claude CLI** — 在同一台主機上重用既有的 Claude CLI 登入

<Warning>
Anthropic 工作人員告訴我們，OpenClaw 這類 Claude CLI 使用方式已再次被允許，因此
OpenClaw 會將 Claude CLI 重用與 `claude -p` 使用視為已獲認可，除非
Anthropic 發布新政策。

對於長期運作的 Gateway 主機，Anthropic API 金鑰仍然是最清楚且
最可預測的正式環境路徑。

Anthropic 目前的公開文件：

- [Claude Code CLI 參考](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK 概覽](https://platform.claude.com/docs/en/agent-sdk/overview)
- [搭配你的 Pro 或 Max 方案使用 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [搭配你的 Team 或 Enterprise 方案使用 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## 開始使用

<Tabs>
  <Tab title="API 金鑰">
    **最適合：** 標準 API 存取與依用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
        在 [Anthropic Console](https://console.anthropic.com/) 中建立 API 金鑰。
      </Step>
      <Step title="執行導覽設定">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        或直接傳入金鑰：

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### 設定範例

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **最適合：** 不使用獨立 API 金鑰，重用既有的 Claude CLI 登入。

    <Steps>
      <Step title="確認已安裝 Claude CLI 並已登入">
        使用以下指令確認：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="執行導覽設定">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw 會偵測並重用既有的 Claude CLI 認證。
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 後端的設定與執行階段細節位於 [CLI 後端](/zh-TW/gateway/cli-backends)。
    </Note>

    ### 設定範例

    建議使用正式的 Anthropic 模型參照，再加上 CLI 執行階段覆寫：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    舊版 `claude-cli/claude-opus-4-7` 模型參照仍可為了
    相容性而運作，但新的設定應將供應商/模型選擇維持為
    `anthropic/*`，並將執行後端放在 `agentRuntime.id`。

    <Tip>
    如果你想要最清楚的計費路徑，請改用 Anthropic API 金鑰。OpenClaw 也支援來自 [OpenAI Codex](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、[MiniMax](/zh-TW/providers/minimax) 與 [Z.AI / GLM](/zh-TW/providers/glm) 的訂閱式選項。
    </Tip>

  </Tab>
</Tabs>

## 思考預設值（Claude 4.6）

當未設定明確的思考層級時，Claude 4.6 模型在 OpenClaw 中預設使用 `adaptive` 思考。

可透過每則訊息的 `/think:<level>` 或在模型參數中覆寫：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
相關 Anthropic 文件：
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 提示快取

OpenClaw 支援 Anthropic 的提示快取功能，用於 API 金鑰驗證。

| 值                  | 快取期間 | 說明                                   |
| ------------------- | -------- | -------------------------------------- |
| `"short"`（預設）   | 5 分鐘   | 針對 API 金鑰驗證自動套用             |
| `"long"`            | 1 小時   | 延長快取                               |
| `"none"`            | 不快取   | 停用提示快取                           |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="每個代理的快取覆寫">
    使用模型層級參數作為基準，然後透過 `agents.list[].params` 覆寫特定代理：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    設定合併順序：

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`（符合 `id`，依金鑰覆寫）

    這可讓同一模型上的某個代理保留長效快取，同時讓另一個代理針對突發性/低重用流量停用快取。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事項">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在已設定時接受 `cacheRetention` 透傳。
    - 非 Anthropic 的 Bedrock 模型會在執行階段被強制設為 `cacheRetention: "none"`。
    - 當未設定明確值時，API 金鑰智慧預設值也會為 Bedrock 上的 Claude 參照填入 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 進階設定

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共用 `/fast` 切換支援直接 Anthropic 流量（API 金鑰與連到 `api.anthropic.com` 的 OAuth）。

    | 指令 | 對應至 |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - 只會注入到直接 `api.anthropic.com` 請求。代理路由會讓 `service_tier` 保持不變。
    - 明確的 `serviceTier` 或 `service_tier` 參數會在兩者皆設定時覆寫 `/fast`。
    - 在沒有 Priority Tier 容量的帳戶上，`service_tier: "auto"` 可能解析為 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒體理解（圖片與 PDF）">
    內建的 Anthropic Plugin 會註冊圖片與 PDF 理解。OpenClaw
    會從已設定的 Anthropic 驗證自動解析媒體能力，不需要
    額外設定。

    | 屬性 | 值 |
    | --------------- | --------------------- |
    | 預設模型 | `claude-opus-4-7`     |
    | 支援的輸入 | 圖片、PDF 文件 |

    當圖片或 PDF 附加到對話時，OpenClaw 會自動
    透過 Anthropic 媒體理解供應商路由它。

  </Accordion>

  <Accordion title="1M 脈絡視窗（beta）">
    Anthropic 的 1M 脈絡視窗受到 beta 門檻控管。請針對每個模型啟用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw 會在請求上將此對應為 `anthropic-beta: context-1m-2025-08-07`。

    `params.context1m: true` 也會套用到 Claude CLI 後端
    （`claude-cli/*`）中符合資格的 Opus 與 Sonnet 模型，將那些 CLI 工作階段的執行階段
    脈絡視窗擴展到與直接 API 行為相符。

    <Warning>
    需要你的 Anthropic 認證具備長脈絡存取權。舊版權杖驗證（`sk-ant-oat-*`）會被 1M 脈絡請求拒絕，OpenClaw 會記錄警告並退回標準脈絡視窗。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M 脈絡">
    `anthropic/claude-opus-4.7` 與其 `claude-cli` 變體預設具有 1M 脈絡
    視窗，不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="401 錯誤 / 權杖突然無效">
    Anthropic 權杖驗證會過期，也可能遭撤銷。對於新的設定，請改用 Anthropic API 金鑰。
  </Accordion>

  <Accordion title='找不到供應商 "anthropic" 的 API 金鑰'>
    Anthropic 驗證是**每個代理各自設定**，新的代理不會繼承主要代理的金鑰。請為該代理重新執行導覽設定（或在 Gateway 主機上設定 API 金鑰），然後使用 `openclaw models status` 確認。
  </Accordion>

  <Accordion title='找不到設定檔 "anthropic:default" 的認證'>
    執行 `openclaw models status` 以查看目前使用中的驗證設定檔。重新執行導覽設定，或為該設定檔路徑設定 API 金鑰。
  </Accordion>

  <Accordion title="沒有可用的驗證設定檔（全部都在冷卻中）">
    查看 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷卻可能是以模型為範圍，因此同層的 Anthropic 模型可能仍可使用。新增另一個 Anthropic 設定檔，或等待冷卻結束。
  </Accordion>
</AccordionGroup>

<Note>
更多說明：[疑難排解](/zh-TW/help/troubleshooting) 與 [常見問題](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="CLI 後端" href="/zh-TW/gateway/cli-backends" icon="terminal">
    Claude CLI 後端設定與執行階段細節。
  </Card>
  <Card title="提示快取" href="/zh-TW/reference/prompt-caching" icon="database">
    提示快取如何跨供應商運作。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證細節與認證重用規則。
  </Card>
</CardGroup>
