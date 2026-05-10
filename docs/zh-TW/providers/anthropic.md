---
read_when:
    - 您想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中透過 API 金鑰或 Claude CLI 使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-05-10T19:47:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c36764f1adb7585389d241303e9c61c1fe2fa49fefdfb28c314abbafa646b273
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 建構 **Claude** 模型系列。OpenClaw 支援兩種驗證路徑：

- **API 金鑰** — 直接存取 Anthropic API，並依用量計費（`anthropic/*` 模型）
- **Claude CLI** — 在同一台主機上重用既有的 Claude CLI 登入

<Warning>
Anthropic 工作人員告訴我們，OpenClaw 風格的 Claude CLI 使用方式已再次被允許，因此
OpenClaw 會將 Claude CLI 重用和 `claude -p` 使用方式視為已獲准，除非
Anthropic 發布新政策。

對於長期運作的 Gateway 主機，Anthropic API 金鑰仍然是最清楚且
最可預測的正式環境路徑。

Anthropic 目前的公開文件：

- [Claude Code CLI 參考](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK 概觀](https://platform.claude.com/docs/en/agent-sdk/overview)
- [搭配 Pro 或 Max 方案使用 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [搭配 Team 或 Enterprise 方案使用 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## 開始使用

<Tabs>
  <Tab title="API 金鑰">
    **最適合：**標準 API 存取與依用量計費。

    <Steps>
      <Step title="取得你的 API 金鑰">
        在 [Anthropic Console](https://console.anthropic.com/) 建立 API 金鑰。
      </Step>
      <Step title="執行初始設定">
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
    **最適合：**不使用額外 API 金鑰，重用既有的 Claude CLI 登入。

    <Steps>
      <Step title="確認 Claude CLI 已安裝且已登入">
        使用以下指令驗證：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw 會偵測並重用既有的 Claude CLI 憑證。
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 後端的設定與執行階段詳細資訊位於 [CLI 後端](/zh-TW/gateway/cli-backends)。
    </Note>

    ### 設定範例

    偏好使用標準 Anthropic 模型 ref，加上 CLI 執行階段覆寫：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          models: {
            "anthropic/claude-opus-4-7": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    舊版 `claude-cli/claude-opus-4-7` 模型 refs 仍可用於
    相容性，但新的設定應將提供者/模型選擇維持為
    `anthropic/*`，並將執行後端放在提供者/模型執行階段政策中。

    <Tip>
    如果你想要最清楚的計費路徑，請改用 Anthropic API 金鑰。OpenClaw 也支援來自 [OpenAI Codex](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、[MiniMax](/zh-TW/providers/minimax) 和 [Z.AI / GLM](/zh-TW/providers/glm) 的訂閱式選項。
    </Tip>

  </Tab>
</Tabs>

## 思考預設值（Claude 4.6）

在 OpenClaw 中，Claude 4.6 模型在未設定明確思考層級時，預設使用 `adaptive` 思考。

使用 `/think:<level>` 逐訊息覆寫，或在模型參數中設定：

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
| `"none"`            | 無快取   | 停用提示快取                           |

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
  <Accordion title="每個代理程式的快取覆寫">
    使用模型層級參數作為基準，然後透過 `agents.list[].params` 覆寫特定代理程式：

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
    2. `agents.list[].params`（符合的 `id`，依鍵覆寫）

    這讓一個代理程式可保留長效快取，同時另一個使用相同模型的代理程式可針對突發/低重用流量停用快取。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事項">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在設定後接受 `cacheRetention` 直通。
    - 非 Anthropic 的 Bedrock 模型會在執行階段被強制設為 `cacheRetention: "none"`。
    - API 金鑰智慧預設值也會在未設定明確值時，為 Claude-on-Bedrock refs 預植 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 進階設定

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共用 `/fast` 切換支援直接 Anthropic 流量（API 金鑰和 OAuth 至 `api.anthropic.com`）。

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
    - 只會注入到直接 `api.anthropic.com` 請求。Proxy 路徑會讓 `service_tier` 保持不變。
    - 明確的 `serviceTier` 或 `service_tier` 參數會在兩者皆設定時覆寫 `/fast`。
    - 對於沒有 Priority Tier 容量的帳戶，`service_tier: "auto"` 可能會解析為 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒體理解（圖片和 PDF）">
    隨附的 Anthropic plugin 會註冊圖片和 PDF 理解。OpenClaw
    會從已設定的 Anthropic 驗證自動解析媒體能力，不需要
    額外設定。

    | 屬性            | 值                    |
    | --------------- | --------------------- |
    | 預設模型        | `claude-opus-4-7`     |
    | 支援的輸入      | 圖片、PDF 文件        |

    當圖片或 PDF 附加到對話時，OpenClaw 會自動
    透過 Anthropic 媒體理解提供者進行路由。

  </Accordion>

  <Accordion title="1M 上下文視窗（beta）">
    Anthropic 的 1M 上下文視窗受 beta 閘門控制。逐模型啟用：

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

    `params.context1m: true` 也會套用至符合資格的 Opus 和 Sonnet 模型的 Claude CLI 後端
    （`claude-cli/*`），將這些 CLI 工作階段的執行階段
    上下文視窗擴展為與直接 API 行為相同。

    <Warning>
    需要你的 Anthropic 憑證具備長上下文存取權。舊版權杖驗證（`sk-ant-oat-*`）會被 1M 上下文請求拒絕，OpenClaw 會記錄警告並退回標準上下文視窗。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M 上下文">
    `anthropic/claude-opus-4.7` 及其 `claude-cli` 變體預設具備 1M 上下文
    視窗，不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="401 錯誤 / 權杖突然無效">
    Anthropic 權杖驗證會過期且可能被撤銷。對於新的設定，請改用 Anthropic API 金鑰。
  </Accordion>

  <Accordion title='找不到提供者 "anthropic" 的 API 金鑰'>
    Anthropic 驗證是**每個代理程式各自設定**，新的代理程式不會繼承主要代理程式的金鑰。請為該代理程式重新執行初始設定（或在 Gateway 主機上設定 API 金鑰），然後使用 `openclaw models status` 驗證。
  </Accordion>

  <Accordion title='找不到設定檔 "anthropic:default" 的憑證'>
    執行 `openclaw models status` 查看目前作用中的驗證設定檔。重新執行初始設定，或為該設定檔路徑設定 API 金鑰。
  </Accordion>

  <Accordion title="沒有可用的驗證設定檔（全部都在冷卻中）">
    檢查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷卻可能以模型為範圍，因此同屬 Anthropic 的另一個模型可能仍可使用。新增另一個 Anthropic 設定檔或等待冷卻。
  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting) 和 [FAQ](/zh-TW/help/faq)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型 refs 和容錯移轉行為。
  </Card>
  <Card title="CLI 後端" href="/zh-TW/gateway/cli-backends" icon="terminal">
    Claude CLI 後端設定與執行階段詳細資訊。
  </Card>
  <Card title="提示快取" href="/zh-TW/reference/prompt-caching" icon="database">
    提示快取如何跨提供者運作。
  </Card>
  <Card title="OAuth 和驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與憑證重用規則。
  </Card>
</CardGroup>
