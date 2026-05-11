---
read_when:
    - 你想了解 OpenClaw OAuth 的端對端流程
    - 你遇到權杖失效／登出問題
    - 你想要 Claude CLI 或 OAuth 身分驗證流程
    - 您想要多個帳戶或設定檔路由
summary: OpenClaw 中的 OAuth：權杖交換、儲存與多帳戶模式
title: OAuth
x-i18n:
    generated_at: "2026-05-11T20:27:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a7382fbcbe7e6034057da66a2dd8685df6d9345c36eeb8261eb12440d00a402
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 透過 OAuth 支援提供該功能的供應商使用「訂閱驗證」
（尤其是 **OpenAI Codex (ChatGPT OAuth)**）。對於 Anthropic，目前實務上的區分是：

- **Anthropic API 金鑰**：一般 Anthropic API 計費
- **Anthropic Claude CLI / OpenClaw 內的訂閱驗證**：Anthropic 工作人員
  告訴我們，現在再次允許這種用法

OpenAI Codex OAuth 明確支援在 OpenClaw 這類外部工具中使用。本頁說明：

在生產環境使用 Anthropic 時，API 金鑰驗證是較安全的建議路徑。

- OAuth **權杖交換** 的運作方式（PKCE）
- 權杖 **儲存** 位置（以及原因）
- 如何處理 **多個帳戶**（設定檔 + 每個工作階段覆寫）

OpenClaw 也支援 **供應商 Plugin**，它們可提供自己的 OAuth 或 API 金鑰
流程。透過以下方式執行：

```bash
openclaw models auth login --provider <id>
```

## 權杖匯入點（存在原因）

OAuth 供應商通常會在登入/重新整理流程中產生 **新的重新整理權杖**。有些供應商（或 OAuth 用戶端）可能會在同一位使用者/應用程式發出新的重新整理權杖時，讓較舊的重新整理權杖失效。

實務症狀：

- 你透過 OpenClaw _以及_ Claude Code / Codex CLI 登入 → 其中一個之後會隨機「被登出」

為了降低這種情況，OpenClaw 會將 `auth-profiles.json` 視為 **權杖匯入點**：

- 執行階段從 **單一位置** 讀取憑證
- 我們可以保留多個設定檔，並以確定性方式進行路由
- 外部 CLI 重用是供應商特定的：Codex CLI 可以啟動一個空的
  `openai-codex:default` 設定檔，但一旦 OpenClaw 有本機 OAuth 設定檔，
  本機重新整理權杖就是權威來源；其他整合可以維持由外部管理，
  並重新讀取其 CLI 驗證存放區
- 已知已設定供應商集合的狀態與啟動路徑，會將外部 CLI 探索限制在該集合，
  因此單一供應商設定不會探查無關的 CLI 登入存放區

## 儲存（權杖位置）

密鑰會儲存在代理驗證存放區中：

- 驗證設定檔（OAuth + API 金鑰 + 選用的值層級參照）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版相容性檔案：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （發現靜態 `api_key` 項目時會將其清除）

僅供舊版匯入的檔案（仍支援，但不是主要存放區）：

- `~/.openclaw/credentials/oauth.json`（首次使用時匯入至 `auth-profiles.json`）

以上也都遵循 `$OPENCLAW_STATE_DIR`（狀態目錄覆寫）。完整參考：[/gateway/configuration](/zh-TW/gateway/configuration-reference#auth-storage)

如需靜態密鑰參照與執行階段快照啟用行為，請參閱 [密鑰管理](/zh-TW/gateway/secrets)。

當次要代理沒有本機驗證設定檔時，OpenClaw 會從預設/主要代理存放區使用讀穿式繼承。它不會在讀取時複製主要代理的 `auth-profiles.json`。OAuth 重新整理權杖特別敏感：一般複製流程預設會略過它們，因為有些供應商會在使用後輪替或讓重新整理權杖失效。當代理需要獨立帳戶時，請為該代理設定單獨的 OAuth 登入。

## Anthropic 舊版權杖相容性

<Warning>
Anthropic 的公開 Claude Code 文件表示，直接使用 Claude Code 仍會計入
Claude 訂閱限制，而 Anthropic 工作人員告訴我們，OpenClaw 這類 Claude
CLI 用法現在再次允許。因此，除非 Anthropic 發布新政策，OpenClaw 會將此整合中的 Claude CLI 重用與
`claude -p` 用法視為已獲准。

如需 Anthropic 目前的直接 Claude Code 方案文件，請參閱 [搭配 Pro 或 Max
方案使用 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
和 [搭配 Team 或 Enterprise
方案使用 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他訂閱式選項，請參閱 [OpenAI
Codex](/zh-TW/providers/openai)、[Qwen Cloud Coding
Plan](/zh-TW/providers/qwen)、[MiniMax Coding Plan](/zh-TW/providers/minimax)
以及 [Z.AI / GLM Coding Plan](/zh-TW/providers/glm)。
</Warning>

OpenClaw 也將 Anthropic setup-token 暴露為受支援的權杖驗證路徑，但現在可用時會優先使用 Claude CLI 重用和 `claude -p`。

## Anthropic Claude CLI 遷移

OpenClaw 再次支援 Anthropic Claude CLI 重用。如果主機上已經有本機
Claude 登入，onboarding/configure 可以直接重用它。

## OAuth 交換（登入運作方式）

OpenClaw 的互動式登入流程實作在 `@earendil-works/pi-ai` 中，並接入精靈/命令。

### Anthropic setup-token

流程形態：

1. 從 OpenClaw 啟動 Anthropic setup-token 或貼上權杖
2. OpenClaw 將產生的 Anthropic 憑證儲存在驗證設定檔中
3. 模型選擇維持在 `anthropic/...`
4. 既有的 Anthropic 驗證設定檔仍可用於回復/順序控制

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth 明確支援在 Codex CLI 之外使用，包括 OpenClaw 工作流程。

流程形態（PKCE）：

1. 產生 PKCE verifier/challenge + 隨機 `state`
2. 開啟 `https://auth.openai.com/oauth/authorize?...`
3. 嘗試在 `http://127.0.0.1:1455/auth/callback` 擷取回呼
4. 如果無法綁定回呼（或你在遠端/無頭環境），貼上重新導向 URL/程式碼
5. 在 `https://auth.openai.com/oauth/token` 交換
6. 從存取權杖擷取 `accountId`，並儲存 `{ access, refresh, expires, accountId }`

精靈路徑是 `openclaw onboard` → 驗證選擇 `openai-codex`。

## 重新整理 + 到期

設定檔會儲存 `expires` 時間戳記。

執行階段：

- 如果 `expires` 是未來時間 → 使用已儲存的存取權杖
- 如果已到期 → 重新整理（在檔案鎖下）並覆寫已儲存的憑證
- 如果次要代理讀取繼承自主要代理的 OAuth 設定檔，重新整理會寫回主要代理存放區，
  而不是將重新整理權杖複製到次要代理存放區
- 例外：有些外部 CLI 憑證仍由外部管理；OpenClaw 會重新讀取那些 CLI 驗證存放區，
  而不是消耗複製出的重新整理權杖。
  Codex CLI 啟動刻意較窄：它會建立一個空的
  `openai-codex:default` 設定檔，之後由 OpenClaw 擁有的重新整理會讓本機
  設定檔維持為權威來源。

重新整理流程是自動的；通常不需要手動管理權杖。

## 多個帳戶（設定檔）+ 路由

兩種模式：

### 1) 建議：分開的代理

如果你希望「個人」和「工作」永不互相影響，請使用隔離的代理（獨立工作階段 + 憑證 + 工作區）：

```bash
openclaw agents add work
openclaw agents add personal
```

然後為每個代理設定驗證（精靈），並將聊天路由到正確的代理。

### 2) 進階：單一代理中的多個設定檔

`auth-profiles.json` 支援同一供應商有多個設定檔 ID。

選擇要使用哪個設定檔：

- 透過設定排序（`auth.order`）全域設定
- 透過 `/model ...@<profileId>` 針對每個工作階段設定

範例（工作階段覆寫）：

- `/model Opus@anthropic:work`

如何查看有哪些設定檔 ID：

- `openclaw channels list --json`（顯示 `auth[]`）

相關文件：

- [模型容錯移轉](/zh-TW/concepts/model-failover)（輪替 + 冷卻規則）
- [斜線命令](/zh-TW/tools/slash-commands)（命令介面）

## 相關

- [驗證](/zh-TW/gateway/authentication) - 模型供應商驗證概覽
- [密鑰](/zh-TW/gateway/secrets) - 憑證儲存與 SecretRef
- [設定參考](/zh-TW/gateway/configuration-reference#auth-storage) - 驗證設定鍵
