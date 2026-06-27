---
read_when:
    - 你想要端對端了解 OpenClaw OAuth
    - 你遇到權杖失效／登出問題
    - 你想要 Claude 命令列介面或 OAuth 驗證流程
    - 你想要多個帳號或設定檔路由
summary: OpenClaw 中的 OAuth：權杖交換、儲存與多帳戶模式
title: OAuth
x-i18n:
    generated_at: "2026-06-27T19:13:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 透過 OAuth 支援提供此功能的供應商使用「訂閱驗證」
（特別是 **OpenAI Codex（ChatGPT OAuth）**）。對 Anthropic 來說，實務上的區分
現在是：

- **Anthropic API 金鑰**：一般 Anthropic API 計費
- **OpenClaw 內的 Anthropic Claude 命令列介面 / 訂閱驗證**：Anthropic 員工
  告訴我們，這種用法已再次被允許

OpenAI Codex OAuth 明確支援用於 OpenClaw 這類外部工具。

OpenClaw 會將 OpenAI API 金鑰驗證和 ChatGPT/Codex OAuth 都儲存在
標準供應商 ID `openai` 之下。較舊的 `openai-codex:*` 設定檔 ID 和
`auth.order.openai-codex` 項目是舊版狀態，會由
`openclaw doctor --fix` 修復；新設定請使用 `openai:*` 設定檔 ID 和 `auth.order.openai`。

對於正式環境中的 Anthropic，API 金鑰驗證是較安全的建議路徑。

本頁說明：

- OAuth **權杖交換** 的運作方式（PKCE）
- 權杖 **儲存** 的位置（以及原因）
- 如何處理 **多個帳號**（設定檔 + 每個工作階段的覆寫）

OpenClaw 也支援 **供應商外掛**，可隨附自己的 OAuth 或 API 金鑰
流程。透過以下方式執行：

```bash
openclaw models auth login --provider <id>
```

## 權杖匯集池（存在原因）

OAuth 供應商通常會在登入/重新整理流程中鑄造 **新的重新整理權杖**。有些供應商（或 OAuth 用戶端）會在同一使用者/應用程式發出新權杖時，讓較舊的重新整理權杖失效。

實際症狀：

- 你透過 OpenClaw _以及_ Claude Code / Codex 命令列介面登入 → 其中一個稍後會隨機「被登出」

為了降低這種情況，OpenClaw 將 `auth-profiles.json` 視為 **權杖匯集池**：

- 執行階段從 **單一位置** 讀取認證
- 我們可以保留多個設定檔，並以確定性的方式路由它們
- 外部命令列介面的重用取決於供應商：Codex 命令列介面可以啟動空的
  `openai:default` 設定檔，但一旦 OpenClaw 有本機 OAuth 設定檔，
  本機重新整理權杖就是標準來源。如果該本機重新整理權杖遭拒，
  OpenClaw 可以將可用的同帳號 Codex 命令列介面權杖作為僅限執行階段的
  備援；其他整合則可維持由外部管理，並重新讀取其
  命令列介面驗證儲存區
- 已經知道已設定供應商集合的狀態和啟動路徑，會將
  外部命令列介面探索範圍限制在該集合，因此單一供應商設定不會
  探測不相關的命令列介面登入儲存區

## 儲存（權杖所在位置）

密鑰儲存在代理驗證儲存區中：

- 驗證設定檔（OAuth + API 金鑰 + 選用的值層級參照）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版相容檔案：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （發現靜態 `api_key` 項目時會將其清除）

僅供舊版匯入的檔案（仍受支援，但不是主要儲存區）：

- `~/.openclaw/credentials/oauth.json`（首次使用時匯入到 `auth-profiles.json`）

以上全部也都遵循 `$OPENCLAW_STATE_DIR`（狀態目錄覆寫）。完整參考：[/gateway/configuration](/zh-TW/gateway/configuration-reference#auth-storage)

如需靜態密鑰參照和執行階段快照啟用行為，請參閱 [密鑰管理](/zh-TW/gateway/secrets)。

當次要代理沒有本機驗證設定檔時，OpenClaw 會使用從預設/主要代理儲存區的讀穿
繼承。它不會在讀取時複製主要
代理的 `auth-profiles.json`。OAuth 重新整理權杖尤其
敏感：一般複製流程預設會略過它們，因為有些供應商會在使用後輪替
或讓重新整理權杖失效。當某個
代理需要獨立帳號時，請為它設定單獨的 OAuth 登入。

## Anthropic 舊版權杖相容性

<Warning>
Anthropic 的公開 Claude Code 文件表示，直接使用 Claude Code 仍受
Claude 訂閱限制約束，而 Anthropic 員工告訴我們，OpenClaw 風格的 Claude
命令列介面用法已再次被允許。因此，除非 Anthropic
發布新政策，OpenClaw 會將 Claude 命令列介面重用和
`claude -p` 用法視為此整合中受認可的用法。

如需 Anthropic 目前的直接 Claude Code 方案文件，請參閱 [將 Claude Code
搭配你的 Pro 或 Max
方案使用](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
以及 [將 Claude Code 搭配你的 Team 或 Enterprise
方案使用](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他訂閱風格選項，請參閱 [OpenAI
Codex](/zh-TW/providers/openai)、[Qwen Cloud Coding
Plan](/zh-TW/providers/qwen)、[MiniMax Coding Plan](/zh-TW/providers/minimax)
以及 [Z.AI / GLM Coding Plan](/zh-TW/providers/zai)。
</Warning>

OpenClaw 也將 Anthropic setup-token 作為受支援的權杖驗證路徑公開，但現在會在可用時優先使用 Claude 命令列介面重用和 `claude -p`。

## Anthropic Claude 命令列介面遷移

OpenClaw 再次支援 Anthropic Claude 命令列介面重用。如果你已經在主機上有本機
Claude 登入，onboarding/configure 可以直接重用它。

## OAuth 交換（登入運作方式）

OpenClaw 的互動式登入流程實作於 `openclaw/plugin-sdk/llm`，並接入精靈/命令。

### Anthropic setup-token

流程形狀：

1. 從 OpenClaw 啟動 Anthropic setup-token 或 paste-token
2. OpenClaw 將產生的 Anthropic 認證儲存在驗證設定檔中
3. 模型選擇維持在 `anthropic/...`
4. 既有 Anthropic 驗證設定檔仍可用於回復/順序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明確支援用於 Codex 命令列介面之外，包括 OpenClaw 工作流程。

登入命令仍使用標準 OpenAI 供應商 ID：

```bash
openclaw models auth login --provider openai
```

若要在同一個代理中使用多個 ChatGPT/Codex OAuth 帳號，請使用
`--profile-id openai:<name>`。不要將 `openai-codex:<name>` 用於新的設定檔。Doctor 會將
該較舊前綴遷移到不衝突的 `openai:*` 設定檔 ID；修復後請先執行
`openclaw models auth list --provider openai`，再將
設定檔 ID 複製到 `auth.order` 或 `/model ...@<profileId>`。

流程形狀（PKCE）：

1. 產生 PKCE 驗證器/挑戰 + 隨機 `state`
2. 開啟 `https://auth.openai.com/oauth/authorize?...`
3. 嘗試在 `http://127.0.0.1:1455/auth/callback` 擷取回呼
4. 如果回呼無法繫結（或你在遠端/無頭環境），貼上重新導向 URL/程式碼
5. 在 `https://auth.openai.com/oauth/token` 交換
6. 從存取權杖擷取 `accountId`，並儲存 `{ access, refresh, expires, accountId }`

精靈路徑是 `openclaw onboard` → 驗證選項 `openai`。

## 重新整理 + 到期

設定檔會儲存 `expires` 時間戳記。

在執行階段：

- 如果 `expires` 在未來 → 使用已儲存的存取權杖
- 如果已到期 → 重新整理（在檔案鎖下）並覆寫已儲存的認證
- 如果次要代理讀取繼承的主要代理 OAuth 設定檔，重新整理
  會寫回主要代理儲存區，而不是將重新整理權杖複製到
  次要代理儲存區
- 例外：有些外部命令列介面認證會維持由外部管理；OpenClaw
  會重新讀取那些命令列介面驗證儲存區，而不是消耗複製的重新整理權杖。
  Codex 命令列介面啟動刻意較窄：它會種下一個空的
  `openai:default` 設定檔，接著由 OpenClaw 擁有的重新整理會讓本機
  設定檔維持為標準來源。如果本機 Codex 重新整理失敗，而 Codex 命令列介面有
  同一帳號的可用權杖，OpenClaw 可能會將該權杖用於目前的
  執行階段請求，而不寫回 `auth-profiles.json`。

重新整理流程是自動的；你通常不需要手動管理權杖。

## 多個帳號（設定檔）+ 路由

兩種模式：

### 1) 建議：分開代理

如果你希望「個人」和「工作」永不互動，請使用隔離的代理（分開的工作階段 + 認證 + 工作區）：

```bash
openclaw agents add work
openclaw agents add personal
```

接著為每個代理設定驗證（精靈），並將聊天路由到正確的代理。

### 2) 進階：在一個代理中使用多個設定檔

`auth-profiles.json` 支援同一供應商的多個設定檔 ID。

選擇要使用哪個設定檔：

- 透過設定順序全域指定（`auth.order`）
- 透過 `/model ...@<profileId>` 逐工作階段指定

範例（工作階段覆寫）：

- `/model Opus@anthropic:work`

如何查看有哪些設定檔 ID：

- `openclaw channels list --json`（顯示 `auth[]`）

相關文件：

- [模型容錯移轉](/zh-TW/concepts/model-failover)（輪替 + 冷卻規則）
- [斜線命令](/zh-TW/tools/slash-commands)（命令介面）

## 相關

- [驗證](/zh-TW/gateway/authentication) - 模型供應商驗證概覽
- [密鑰](/zh-TW/gateway/secrets) - 認證儲存與 SecretRef
- [設定參考](/zh-TW/gateway/configuration-reference#auth-storage) - 驗證設定鍵
