---
read_when:
    - 你想要在 OpenClaw 中使用 Anthropic 模型
summary: 在 OpenClaw 中透過 API 金鑰或 Claude 命令列介面使用 Anthropic Claude
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T19:51:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic 建構 **Claude** 模型系列。OpenClaw 支援兩種驗證路徑：

- **API 金鑰** — 直接存取 Anthropic API，依用量計費（`anthropic/*` 模型）
- **Claude 命令列介面** — 重用同一主機上既有的 Claude Code 登入

<Warning>
OpenClaw 的 Claude 命令列介面後端會以非互動式列印模式執行已安裝的 Claude Code 命令列介面。Anthropic 目前的 Claude Code 文件將 `claude -p` 描述為 Agent SDK／程式化用途。自 2026 年 6 月 15 日起，Anthropic 表示訂閱方案的 `claude -p` 用量不再消耗一般 Claude 方案額度；它會先使用獨立的每月 Agent SDK 點數，然後在已啟用用量點數時，依標準 API 費率消耗用量點數。

互動式 Claude Code 仍會消耗已登入 Claude 方案的額度。API 金鑰驗證仍是直接的隨用隨付 API 計費。對於長期執行的閘道主機、共用自動化，以及可預測的正式環境支出，請使用 Anthropic API 金鑰。

Anthropic 目前的公開文件：

- [Claude Code 命令列介面參考](https://code.claude.com/docs/en/cli-usage)
- [搭配你的 Claude 方案使用 Claude Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [搭配你的 Pro 或 Max 方案使用 Claude Code](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [搭配你的 Team 或 Enterprise 方案使用 Claude Code](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [管理 Claude Code 成本](https://code.claude.com/docs/en/costs)

</Warning>

## 開始使用

<Tabs>
  <Tab title="API 金鑰">
    **最適合：** 標準 API 存取與依用量計費。

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
    **最適合：** 重用既有 Claude 命令列介面登入，而不需要另外的 API 金鑰。

    <Steps>
      <Step title="確認 Claude 命令列介面已安裝並已登入">
        使用以下指令確認：

        ```bash
        claude --version
        ```
      </Step>
      <Step title="執行初始設定">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw 會偵測並重用既有的 Claude 命令列介面憑證。
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude 命令列介面後端的設定與執行階段細節位於[命令列介面後端](/zh-TW/gateway/cli-backends)。
    </Note>

    <Warning>
    Claude 命令列介面重用預期 OpenClaw 程序會在與 Claude 命令列介面登入相同的主機上執行。Docker 安裝可以保留容器 home，並在其中登入 Claude Code；請參閱 [Docker 中的 Claude 命令列介面後端](/zh-TW/install/docker#claude-cli-backend-in-docker)。其他容器安裝（例如 [Podman](/zh-TW/install/podman)）不會在設定或執行階段掛載主機的 `~/.claude`；請在其中使用 Anthropic API 金鑰，或選擇具有 OpenClaw 管理 OAuth 的提供者，例如 [OpenAI Codex](/zh-TW/providers/openai)。
    </Warning>

    ### 設定範例

    偏好使用標準 Anthropic 模型參照，並加上命令列介面執行階段覆寫：

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

    舊版 `claude-cli/claude-opus-4-7` 模型參照仍可用於相容性，但新的設定應將提供者／模型選擇保留為 `anthropic/*`，並將執行後端放在提供者／模型執行階段策略中。

    ### 計費與 `claude -p`

    OpenClaw 會針對 Claude 命令列介面執行使用 Claude Code 的非互動式 `claude -p` 路徑。Anthropic 目前將該路徑視為 Agent SDK／程式化用途：

    - 在 2026 年 6 月 15 日以前，訂閱方案處理會遵循 Anthropic 對已登入帳戶目前有效的 Claude Code 規則。
    - 自 2026 年 6 月 15 日起，訂閱方案的 `claude -p` 用量會先消耗使用者每月 Agent SDK 點數，接著在已啟用用量點數時，依標準 API 費率消耗用量點數。
    - Console／API 金鑰登入使用隨用隨付 API 計費，且不會收到訂閱的 Agent SDK 點數。

    Anthropic 可以在沒有 OpenClaw 版本發布的情況下變更 Claude Code 計費與速率限制行為。當計費可預測性很重要時，請檢查 `claude auth status`、`/status`，以及 Anthropic 連結的文件。

    <Tip>
    對於共用的正式環境自動化，請使用 Anthropic API 金鑰，而不是 Claude 命令列介面。OpenClaw 也支援來自 [OpenAI Codex](/zh-TW/providers/openai)、[Qwen Cloud](/zh-TW/providers/qwen)、[MiniMax](/zh-TW/providers/minimax)，以及 [Z.AI / GLM](/zh-TW/providers/zai) 的訂閱式選項。
    </Tip>

  </Tab>
</Tabs>

## 思考預設值（Claude Fable 5、4.8 與 4.6）

`anthropic/claude-fable-5` 一律使用自適應思考，且預設為 `high` effort。由於 Anthropic 不允許停用此模型的思考，`/think off` 與 `/think minimal` 會使用 `low` effort。OpenClaw 也會在 Fable 5 請求中省略自訂 temperature 值。

Claude Opus 4.8 在 OpenClaw 中預設會關閉思考。當你使用 `/think high|xhigh|max` 明確啟用自適應思考時，OpenClaw 會傳送 Anthropic 的 Opus 4.8 effort 值；Claude 4.6 模型預設為 `adaptive`。

使用 `/think:<level>` 或在模型參數中針對每則訊息覆寫：

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

OpenClaw 支援 Anthropic 的提示快取功能，用於 API 金鑰驗證。

| 值                  | 快取期間 | 說明                               |
| ------------------- | -------- | ---------------------------------- |
| `"short"`（預設）   | 5 分鐘   | 會自動套用於 API 金鑰驗證          |
| `"long"`            | 1 小時   | 延長快取                           |
| `"none"`            | 不快取   | 停用提示快取                       |

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
    2. `agents.list[].params`（符合 `id`，依金鑰覆寫）

    這讓一個代理程式可以保留長效快取，同時讓同一模型上的另一個代理程式針對突發／低重用流量停用快取。

  </Accordion>

  <Accordion title="Bedrock Claude 注意事項">
    - Bedrock 上的 Anthropic Claude 模型（`amazon-bedrock/*anthropic.claude*`）在設定時接受 `cacheRetention` 直接傳遞。
    - 非 Anthropic 的 Bedrock 模型會在執行階段被強制設為 `cacheRetention: "none"`。
    - API 金鑰智慧預設值也會在未設定明確值時，為 Claude-on-Bedrock 參照植入 `cacheRetention: "short"`。

  </Accordion>
</AccordionGroup>

## 進階設定

<AccordionGroup>
  <Accordion title="快速模式">
    OpenClaw 的共用 `/fast` 切換支援直接 Anthropic 流量（API 金鑰與對 `api.anthropic.com` 的 OAuth）。

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
    - 僅注入於直接 `api.anthropic.com` 請求。代理路由會讓 `service_tier` 保持不變。
    - 明確的 `serviceTier` 或 `service_tier` 參數會在兩者都設定時覆寫 `/fast`。
    - 在沒有 Priority Tier 容量的帳戶上，`service_tier: "auto"` 可能會解析為 `standard`。

    </Note>

  </Accordion>

  <Accordion title="媒體理解（圖片與 PDF）">
    內建的 Anthropic 外掛會註冊圖片與 PDF 理解。OpenClaw 會根據已設定的 Anthropic 驗證自動解析媒體能力，不需要額外設定。

    | 屬性          | 值                    |
    | ------------- | --------------------- |
    | 預設模型      | `claude-opus-4-8`     |
    | 支援的輸入    | 圖片、PDF 文件        |

    當圖片或 PDF 附加至對話時，OpenClaw 會自動透過 Anthropic 媒體理解提供者路由它。

  </Accordion>

  <Accordion title="1M 內容視窗">
    Anthropic 的 1M 內容視窗可用於具備 GA 能力的 Claude 4.x 模型，例如 Opus 4.8、Opus 4.7、Opus 4.6 與 Sonnet 4.6。OpenClaw 會自動將這些模型的大小設為 1M：

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

    較舊的設定可以保留 `params.context1m: true`，但 OpenClaw 不再傳送已退役的 `context-1m-2025-08-07` beta 標頭。較舊 `anthropicBeta` 設定項目中的該值會在請求標頭解析期間被忽略，而不支援的較舊 Claude 模型會保留其一般內容視窗。

    `params.context1m: true` 也會套用至 Claude 命令列介面後端（`claude-cli/*`），用於符合資格、具備 GA 能力的 Opus 與 Sonnet 模型，保留這些命令列介面工作階段的執行階段內容視窗，使其符合直接 API 行為。

    <Warning>
    需要你的 Anthropic 憑證具有長內容存取權。OAuth／訂閱權杖驗證會保留其必要的 Anthropic beta 標頭，但若已退役的 1M beta 標頭仍留在較舊設定中，OpenClaw 會將其移除。
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 內容">
    `anthropic/claude-opus-4-8` 及其 `claude-cli` 變體預設具有 1M 內容視窗，不需要 `params.context1m: true`。
  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="401 錯誤／權杖突然無效">
    Anthropic 權杖驗證會過期，也可能被撤銷。對於新的設定，請改用 Anthropic API 金鑰。
  </Accordion>

  <Accordion title='找不到供應商「anthropic」的 API 金鑰'>
    Anthropic 驗證是**每個代理程式各自設定**，新的代理程式不會繼承主要代理程式的金鑰。請為該代理程式重新執行入門設定（或在閘道主機上設定 API 金鑰），然後用 `openclaw models status` 驗證。
  </Accordion>

  <Accordion title='找不到設定檔「anthropic:default」的憑證'>
    執行 `openclaw models status` 以查看目前作用中的驗證設定檔。重新執行入門設定，或為該設定檔路徑設定 API 金鑰。
  </Accordion>

  <Accordion title="沒有可用的驗證設定檔（全部都在冷卻中）">
    查看 `openclaw models status --json` 中的 `auth.unusableProfiles`。Anthropic 速率限制冷卻可能限定於模型範圍，因此同屬 Anthropic 的另一個模型可能仍可使用。請新增另一個 Anthropic 設定檔，或等待冷卻結束。
  </Accordion>
</AccordionGroup>

<Note>
更多說明：[疑難排解](/zh-TW/help/troubleshooting) 和 [常見問題](/zh-TW/help/faq)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="命令列介面後端" href="/zh-TW/gateway/cli-backends" icon="terminal">
    Claude 命令列介面後端設定與執行階段詳細資訊。
  </Card>
  <Card title="提示快取" href="/zh-TW/reference/prompt-caching" icon="database">
    提示快取如何跨供應商運作。
  </Card>
  <Card title="OAuth 與驗證" href="/zh-TW/gateway/authentication" icon="key">
    驗證詳細資訊與憑證重用規則。
  </Card>
</CardGroup>
