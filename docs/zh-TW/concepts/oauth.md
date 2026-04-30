---
read_when:
    - 你想完整了解 OpenClaw OAuth 的端到端流程
    - 你遇到權杖失效／登出問題
    - 你想使用 Claude CLI 或 OAuth 驗證流程
    - 你想使用多個帳戶或設定檔路由
summary: OpenClaw 中的 OAuth：權杖交換、儲存與多帳號模式
title: OAuth
x-i18n:
    generated_at: "2026-04-30T03:01:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 支援透過 OAuth 進行「訂閱驗證」，適用於提供此功能的供應商
（特別是 **OpenAI Codex (ChatGPT OAuth)**）。對 Anthropic 而言，實務上的區分
現在是：

- **Anthropic API 金鑰**：一般 Anthropic API 計費
- **OpenClaw 內的 Anthropic Claude CLI／訂閱驗證**：Anthropic 員工
  告訴我們，這種用法已再次允許

OpenAI Codex OAuth 明確支援在 OpenClaw 這類外部工具中使用。此頁說明：

在正式環境使用 Anthropic 時，API 金鑰驗證是較安全的建議路徑。

- OAuth **權杖交換** 如何運作（PKCE）
- 權杖**儲存**在哪裡（以及原因）
- 如何處理**多個帳戶**（設定檔 + 各工作階段覆寫）

OpenClaw 也支援隨附自身 OAuth 或 API 金鑰流程的**供應商 Plugin**。
透過以下方式執行：

```bash
openclaw models auth login --provider <id>
```

## 權杖匯集處（它存在的原因）

OAuth 供應商通常會在登入／重新整理流程期間簽發**新的重新整理權杖**。某些供應商（或 OAuth 用戶端）可能會在同一使用者／應用程式簽發新權杖時，讓較舊的重新整理權杖失效。

實務症狀：

- 你透過 OpenClaw _以及_ Claude Code / Codex CLI 登入 → 其中一個稍後會隨機「被登出」

為了減少這種情況，OpenClaw 將 `auth-profiles.json` 視為**權杖匯集處**：

- 執行階段從**單一位置**讀取憑證
- 我們可以保留多個設定檔，並以確定性方式路由它們
- 外部 CLI 重用是供應商特定的：Codex CLI 可以啟動空的
  `openai-codex:default` 設定檔，但一旦 OpenClaw 擁有本機 OAuth 設定檔，
  本機重新整理權杖就是標準來源；其他整合仍可維持
  外部管理，並重新讀取其 CLI 驗證存放區
- 已知已設定供應商集合範圍的狀態與啟動路徑，會將
  外部 CLI 探索限制在該集合內，因此單一供應商設定不會
  探測不相關的 CLI 登入存放區

## 儲存（權杖存放位置）

機密會儲存在代理程式驗證存放區中：

- 驗證設定檔（OAuth + API 金鑰 + 選用的值層級參照）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版相容性檔案：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （探索到靜態 `api_key` 項目時會將其清除）

僅用於舊版匯入的檔案（仍受支援，但不是主要存放區）：

- `~/.openclaw/credentials/oauth.json`（首次使用時匯入 `auth-profiles.json`）

上述所有項目也都遵循 `$OPENCLAW_STATE_DIR`（狀態目錄覆寫）。完整參考：[/gateway/configuration](/zh-TW/gateway/configuration-reference#auth-storage)

關於靜態機密參照與執行階段快照啟用行為，請參閱[機密管理](/zh-TW/gateway/secrets)。

當次要代理程式沒有本機驗證設定檔時，OpenClaw 會使用從預設／主要代理程式存放區的讀取穿透繼承。它不會在讀取時複製主要
代理程式的 `auth-profiles.json`。OAuth 重新整理權杖特別
敏感：一般複製流程預設會略過它們，因為某些供應商會在使用後輪替
或讓重新整理權杖失效。當代理程式需要獨立帳戶時，請為該
代理程式設定個別 OAuth 登入。

## Anthropic 舊版權杖相容性

<Warning>
Anthropic 的公開 Claude Code 文件表示直接使用 Claude Code 仍在
Claude 訂閱限制內，而 Anthropic 員工告訴我們，OpenClaw 風格的 Claude
CLI 使用已再次允許。因此，除非 Anthropic
發布新政策，OpenClaw 會將 Claude CLI 重用和
`claude -p` 使用視為此整合受允許的方式。

關於 Anthropic 目前的直接 Claude Code 方案文件，請參閱[將 Claude Code
搭配你的 Pro 或 Max
方案使用](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
以及[將 Claude Code 搭配你的 Team 或 Enterprise
方案使用](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他訂閱式選項，請參閱 [OpenAI
Codex](/zh-TW/providers/openai)、[Qwen Cloud Coding
Plan](/zh-TW/providers/qwen)、[MiniMax Coding Plan](/zh-TW/providers/minimax)
以及 [Z.AI / GLM Coding Plan](/zh-TW/providers/glm)。
</Warning>

OpenClaw 也將 Anthropic setup-token 暴露為受支援的權杖驗證路徑，但現在會在可用時優先使用 Claude CLI 重用與 `claude -p`。

## Anthropic Claude CLI 遷移

OpenClaw 再次支援 Anthropic Claude CLI 重用。如果你已在主機上有本機
Claude 登入，onboarding/configure 可以直接重用它。

## OAuth 交換（登入如何運作）

OpenClaw 的互動式登入流程實作於 `@mariozechner/pi-ai`，並接入精靈／命令。

### Anthropic setup-token

流程形態：

1. 從 OpenClaw 啟動 Anthropic setup-token 或 paste-token
2. OpenClaw 將產生的 Anthropic 憑證儲存在驗證設定檔中
3. 模型選取維持在 `anthropic/...`
4. 現有 Anthropic 驗證設定檔仍可用於復原／排序控制

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth 明確支援在 Codex CLI 外部使用，包括 OpenClaw 工作流程。

流程形態（PKCE）：

1. 產生 PKCE 驗證器／挑戰 + 隨機 `state`
2. 開啟 `https://auth.openai.com/oauth/authorize?...`
3. 嘗試在 `http://127.0.0.1:1455/auth/callback` 擷取回呼
4. 如果回呼無法綁定（或你在遠端／無頭環境），貼上重新導向 URL／代碼
5. 在 `https://auth.openai.com/oauth/token` 交換
6. 從存取權杖擷取 `accountId`，並儲存 `{ access, refresh, expires, accountId }`

精靈路徑是 `openclaw onboard` → 驗證選項 `openai-codex`。

## 重新整理 + 到期

設定檔會儲存 `expires` 時間戳記。

在執行階段：

- 如果 `expires` 是未來時間 → 使用儲存的存取權杖
- 如果已到期 → 重新整理（在檔案鎖下）並覆寫儲存的憑證
- 如果次要代理程式讀取繼承自主要代理程式的 OAuth 設定檔，重新整理
  會寫回主要代理程式存放區，而不是將重新整理權杖複製到
  次要代理程式存放區
- 例外：某些外部 CLI 憑證仍維持外部管理；OpenClaw
  會重新讀取那些 CLI 驗證存放區，而不是耗用複製的重新整理權杖。
  Codex CLI 啟動刻意較窄：它會播種空的
  `openai-codex:default` 設定檔，接著由 OpenClaw 擁有的重新整理會讓本機
  設定檔保持為標準來源。

重新整理流程是自動的；你通常不需要手動管理權杖。

## 多個帳戶（設定檔）+ 路由

兩種模式：

### 1) 偏好方式：分開的代理程式

如果你希望「個人」和「工作」永遠不要互相影響，請使用隔離的代理程式（分開的工作階段 + 憑證 + 工作區）：

```bash
openclaw agents add work
openclaw agents add personal
```

接著為每個代理程式設定驗證（精靈），並將聊天路由到正確的代理程式。

### 2) 進階：一個代理程式中的多個設定檔

`auth-profiles.json` 支援同一供應商的多個設定檔 ID。

選擇要使用的設定檔：

- 透過設定排序全域指定（`auth.order`）
- 透過 `/model ...@<profileId>` 針對每個工作階段指定

範例（工作階段覆寫）：

- `/model Opus@anthropic:work`

如何查看有哪些設定檔 ID：

- `openclaw channels list --json`（顯示 `auth[]`）

相關文件：

- [模型容錯移轉](/zh-TW/concepts/model-failover)（輪替 + 冷卻規則）
- [斜線命令](/zh-TW/tools/slash-commands)（命令介面）

## 相關

- [驗證](/zh-TW/gateway/authentication) — 模型供應商驗證概覽
- [機密](/zh-TW/gateway/secrets) — 憑證儲存與 SecretRef
- [設定參考](/zh-TW/gateway/configuration-reference#auth-storage) — 驗證設定鍵
