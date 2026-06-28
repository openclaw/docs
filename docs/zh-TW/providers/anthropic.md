---
read_when:
    - 你想在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中透過 API 金鑰或 Claude 命令列介面使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 建構 **Claude** 模型家族。OpenClaw 支援兩種驗證路徑：

- **API 金鑰** — 直接存取 Anthropic API，依用量計費（`anthropic/*` 模型）
- **Claude 命令列介面** — 重用同一主機上現有的 Claude Code 登入

<Warning>
OpenClaw 的 Claude 命令列介面後端會以非互動列印模式執行已安裝的 Claude Code 命令列介面。Anthropic 目前的 Claude Code 文件將 `claude -p` 描述為 Agent SDK／程式化用途。Anthropic 於 2026 年 6 月 15 日的支援更新暫停了先前宣布的 Agent SDK 計費變更。目前 Anthropic 表示 Claude Agent SDK、`claude -p` 和第三方應用程式使用量仍會計入訂閱方案的用量限制。先前宣布的每月 Agent SDK 額度在 Anthropic 修訂該方案期間不可用。

互動式 Claude Code 仍會計入已登入 Claude 方案的限制。API 金鑰驗證則維持直接的隨用隨付 API 計費。對於長期執行的閘道主機、共享自動化，以及可預測的正式環境支出，請使用 Anthropic API 金鑰。

在依賴訂閱計費行為之前，請查看 Anthropic 目前的支援文章：

- [Claude Code 命令列介面參考](https://code.claude.com/docs/en/cli-usage)
- [搭配你的 Claude 方案使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [搭配你的 Pro 或 Max 方案使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [搭配你的 Team 或 Enterprise 方案使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 成本](https://code.claude.com/docs/en/costs)

</Warning>

## 開始使用

<Tabs>
  <Tab title="API 金鑰">
    **最適合：**標準 API 存取和依用量計費。

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
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude 命令列介面">
    **最適合：**在不使用獨立 API 金鑰的情況下，重用現有 Claude 命令列介面登入。

    <Steps>
      <Step title="確認 Claude 命令列介面已安裝並已登入">
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

        OpenClaw 會偵測並重用現有的 Claude 命令列介面憑證。
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude 命令列介面後端的設定和執行階段詳細資訊位於[命令列介面後端](/zh-TW/gateway/cli-backends)。
    </Note>

    <Warning>
    重用 Claude 命令列介面時，OpenClaw 程序應在與 Claude 命令列介面登入相同的主機上執行。Docker 安裝可以保留容器家目錄，並在其中登入 Claude Code；請參閱 [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。其他容器安裝方式，例如 [Podman](/zh-TW/install/podman)，不會將主機的 `~/.claude` 掛載到設定或執行階段；請在其中使用 Anthropic API 金鑰，或選擇具備 OpenClaw 管理 OAuth 的提供者，例如 [OpenAI Codex](/zh-TW/providers/openai)。
    </Warning>

    ### 設定範例

    偏好使用標準 Anthropic 模型參照，再加上命令列介面執行階段覆寫：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    舊版 `claude-cli/claude-opus-4-7` 模型參照仍可為了相容性運作，但新的設定應將提供者／模型選擇維持為 `anthropic/*`，並把執行後端放在提供者／模型執行階段政策中。

    ### 計費與 `claude -p`

    OpenClaw 使用 Claude Code 的非互動式 `claude -p` 路徑來執行 Claude 命令列介面。Anthropic 目前將該路徑視為 Agent SDK／程式化用途：

    - Anthropic 於 2026 年 6 月 15 日的支援更新暫停了先前宣布的獨立 Agent SDK 額度方案。
    - 目前，訂閱方案中的 Claude Agent SDK、`claude -p` 和第三方應用程式使用量仍會計入已登入訂閱的用量限制。
    - 先前宣布的每月 Agent SDK 額度在 Anthropic 修訂該方案期間不可用。
    - Console／API 金鑰登入使用隨用隨付 API 計費，且不會取得訂閱的 Agent SDK 額度。

    如需暫停通知，請參閱 Anthropic 的 [Agent SDK 方案文章](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)，並參閱 Claude Code 方案文章以了解 [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) 和 [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) 的訂閱行為。

    Anthropic 可以在不發布 OpenClaw 版本的情況下變更 Claude Code 計費和速率限制行為。當計費可預測性很重要時，請檢查 `claude auth status`、`/status`，以及 Anthropic 連結的文件。

    <Tip>
    對於共享正式環境自動化，請使用 Anthropic API 金鑰，而不是 Claude 命令列介面。OpenClaw 也支援來自 [OpenAI Codex](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、[MiniMax](/zh-TW/providers/minimax) 和 [Z.AI / GLM](/zh-TW/providers/zai) 的訂閱式選項。
    </Tip>

  </Tab>
</Tabs>

## 思考預設值（Claude Fable 5、4.8 和 4.6）

`anthropic/claude-fable-5` 一律使用自適應思考，並預設為 `high` 強度。由於 Anthropic 不允許停用此模型的思考功能，`/think off` 和 `/think minimal` 會使用 `low` 強度。OpenClaw 也會在 Fable 5 請求中省略自訂 temperature 值。

Claude Opus 4.8 在 OpenClaw 中預設保持關閉思考。當你使用 `/think high|xhigh|max` 明確啟用自適應思考時，OpenClaw 會傳送 Anthropic 的 Opus 4.8 強度值；Claude 4.6 模型預設為 `adaptive`。

可使用 `/think:<level>` 針對每則訊息覆寫，或在模型參數中覆寫：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
相關 Anthropic 文件：
- [自適應思考](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [延伸思考](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 提示快取

OpenClaw 支援 Anthropic 的提示快取功能，適用於 API 金鑰驗證。

| 值                  | 快取期間 | 說明                                   |
| ------------------- | -------- | -------------------------------------- |
| `"short"`（預設）   | 5 分鐘   | 會自動套用於 API 金鑰驗證             |
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
  <Accordion title="個別代理的快取覆寫">
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
    2. `agents.list[].params`（符合 `id`，依鍵覆寫）

    這可讓一個代理保留長效快取，而同一模型上的另一個代理可針對突發性／低重用流量停用快取。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事項">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在已設定時會接受 `cacheRetention` 透傳。
    - 非 Anthropic 的 Bedrock 模型會在執行階段被強制設為 `cacheRetention: "none"`。
    - 在未設定明確值時，API 金鑰智慧預設值也會為 Bedrock 上的 Claude 參照預填 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 進階設定

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共享 `/fast` 切換支援直接 Anthropic 流量（API 金鑰和連到 `api.anthropic.com` 的 OAuth）。

    | 指令 | 對應到 |
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
    - 只會注入至直接 `api.anthropic.com` 請求。代理路由會保留 `service_tier` 不變。
    - 明確的 `serviceTier` 或 `service_tier` 參數會在兩者都設定時覆寫 `/fast`。
    - 對於沒有 Priority Tier 容量的帳戶，`service_tier: "auto"` 可能會解析為 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒體理解（圖片和 PDF）">
    內建的 Anthropic 外掛會註冊圖片和 PDF 理解。OpenClaw 會根據已設定的 Anthropic 驗證自動解析媒體能力，不需要額外設定。

    | 屬性        | 值                    |
    | --------------- | --------------------- |
    | 預設模型   | `claude-opus-4-8`     |
    | 支援的輸入 | 圖片、PDF 文件        |

    當圖片或 PDF 附加到對話時，OpenClaw 會自動透過 Anthropic 媒體理解提供者進行路由。

  </Accordion>

  <Accordion title="1M 上下文視窗">
    Anthropic 的 1M 上下文視窗可用於支援 GA 的 Claude 4.x 模型，例如 Opus 4.8、Opus 4.7、Opus 4.6 和 Sonnet 4.6。OpenClaw 會自動將這些模型大小設為 1M：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    較舊的設定可以保留 `params.context1m: true`，但 OpenClaw 不再傳送已退役的 `context-1m-2025-08-07` beta 標頭。較舊 `anthropicBeta` 設定項目中的該值會在請求標頭解析期間被忽略，而不支援的較舊 Claude 模型會維持其一般上下文視窗。

    `params.context1m: true` 也會套用到 Claude 命令列介面後端（`claude-cli/*`），適用於符合資格且支援 GA 的 Opus 和 Sonnet 模型，保留這些命令列介面工作階段的執行階段上下文視窗，使其與直接 API 行為一致。

    <Warning>
    需要你的 Anthropic 憑證具備長上下文存取權。OAuth／訂閱權杖驗證會保留其必要的 Anthropic beta 標頭，但如果已退役的 1M beta 標頭仍存在於較舊設定中，OpenClaw 會將其移除。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 上下文">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 變體預設具有 1M 上下文
    視窗，不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="401 錯誤 / 權杖突然無效">
    Anthropic 權杖驗證會過期，且可被撤銷。對於新的設定，請改用 Anthropic API 金鑰。
  </Accordion>

  <Accordion title='找不到提供者 "anthropic" 的 API 金鑰'>
    Anthropic 驗證是**每個代理各自獨立**，新的代理不會繼承主代理的金鑰。請重新為該代理執行 onboarding（或在閘道主機上設定 API 金鑰），然後使用 `openclaw models status` 驗證。
  </Accordion>

  <Accordion title='找不到設定檔 "anthropic:default" 的憑證'>
    執行 `openclaw models status` 以查看目前啟用的驗證設定檔。重新執行 onboarding，或為該設定檔路徑設定 API 金鑰。
  </Accordion>

  <Accordion title="沒有可用的驗證設定檔（全部都在冷卻中）">
    檢查 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷卻可能限定於模型範圍，因此同層的 Anthropic 模型可能仍可使用。新增另一個 Anthropic 設定檔，或等待冷卻結束。
  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting) 和 [常見問題](/zh-TW/help/faq)。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照及容錯移轉行為。
  </Card>
  <Card title="命令列介面後端" href="/zh-TW/gateway/cli-backends" icon="terminal">
    Claude 命令列介面後端設定與執行階段詳細資料。
  </Card>
  <Card title="提示快取" href="/zh-TW/reference/prompt-caching" icon="database">
    提示快取在各提供者之間的運作方式。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資料與憑證重用規則。
  </Card>
</CardGroup>
