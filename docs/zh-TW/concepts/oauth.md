---
read_when:
    - 你想要端到端了解 OpenClaw OAuth
    - 你遇到權杖失效／登出問題
    - 你想要 Claude 命令列介面或 OAuth 驗證流程
    - 你需要多個帳戶或設定檔路由
summary: OpenClaw 中的 OAuth：權杖交換、儲存與多帳號模式
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:22:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 透過 OAuth 支援提供者的「訂閱驗證」
（尤其是 **OpenAI Codex (ChatGPT OAuth)**）。對 Anthropic 來說，實務上的區分
現在是：

- **Anthropic API 金鑰**：一般 Anthropic API 計費
- **OpenClaw 內的 Anthropic Claude 命令列介面 / 訂閱驗證**：Anthropic 工作人員
  告訴我們，此用法已再次允許

OpenAI Codex OAuth 明確支援用於 OpenClaw 等外部工具。

OpenClaw 會把 OpenAI API 金鑰驗證與 ChatGPT/Codex OAuth 都儲存在
標準提供者 ID `openai` 底下。較舊的 `openai-codex:*` profile ID 和
`auth.order.openai-codex` 項目是由 `openclaw doctor --fix` 修復的舊狀態；新的設定
請使用 `openai:*` profile ID 和 `auth.order.openai`。

在生產環境使用 Anthropic 時，API 金鑰驗證是較安全的建議路徑。

本頁說明：

- OAuth **權杖交換** 的運作方式（PKCE）
- 權杖 **儲存** 位置（以及原因）
- 如何處理 **多個帳戶**（profiles + 每個工作階段覆寫）

OpenClaw 也支援 **提供者外掛**，可隨附自己的 OAuth 或 API 金鑰
流程。透過以下方式執行：

```bash
openclaw models auth login --provider <id>
```

## 權杖匯入點（存在原因）

OAuth 提供者通常會在登入/重新整理流程中鑄造 **新的重新整理權杖**。某些提供者（或 OAuth 用戶端）可能會在同一個使用者/應用程式核發新權杖時，使較舊的重新整理權杖失效。

實務症狀：

- 你透過 OpenClaw _以及_ Claude Code / Codex CLI 登入 → 其中一個稍後會隨機「登出」

為降低這種情況，OpenClaw 會將 `auth-profiles.json` 視為 **權杖匯入點**：

- 執行階段從 **單一位置** 讀取憑證
- 我們可以保留多個 profiles，並以可預測方式路由它們
- 外部命令列介面重用取決於提供者：Codex CLI 可以啟動一個空的
  `openai:default` profile，但一旦 OpenClaw 有本機 OAuth profile，
  本機重新整理權杖就是標準來源。如果該本機重新整理權杖遭拒，
  OpenClaw 會回報受管理的 profile 以便重新驗證，而不是使用
  Codex CLI 權杖材料作為同層執行階段後援。其他整合可以
  維持外部管理，並重新讀取其命令列介面驗證存放區
- 已知道設定提供者集合的狀態與啟動路徑，會將
  外部命令列介面探索範圍限制在該集合內，因此單一提供者設定
  不會探測無關的命令列介面登入存放區

## 儲存（權杖所在位置）

機密會儲存在代理驗證存放區中：

- 驗證 profiles（OAuth + API 金鑰 + 選用的值層級 refs）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版相容性檔案：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （發現靜態 `api_key` 項目時會將其清除）

僅供舊版匯入的檔案（仍支援，但不是主要存放區）：

- `~/.openclaw/credentials/oauth.json`（首次使用時匯入 `auth-profiles.json`）

以上所有項目也都遵循 `$OPENCLAW_STATE_DIR`（狀態目錄覆寫）。完整參考：[/gateway/configuration](/zh-TW/gateway/configuration-reference#auth-storage)

如需靜態機密 refs 與執行階段快照啟用行為，請參閱 [機密管理](/zh-TW/gateway/secrets)。

當次要代理沒有本機驗證 profile 時，OpenClaw 會從預設/主要代理存放區使用讀穿式
繼承。它不會在讀取時複製主要代理的 `auth-profiles.json`。OAuth 重新整理權杖
特別敏感：一般複製流程預設會略過它們，因為某些提供者會在使用後輪替
或使重新整理權杖失效。當代理需要獨立帳戶時，請為該代理設定個別的 OAuth 登入。

## Anthropic 舊版權杖相容性

<Warning>
Anthropic 的公開 Claude Code 文件表示，直接使用 Claude Code 會維持在
Claude 訂閱限制內，而 Anthropic 工作人員告訴我們，OpenClaw 風格的 Claude
命令列介面用法已再次允許。因此，除非 Anthropic
發布新政策，OpenClaw 會將 Claude 命令列介面重用與
`claude -p` 用法視為此整合允許的用法。

如需 Anthropic 目前的直接 Claude Code 方案文件，請參閱 [搭配 Pro 或 Max
方案使用 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
以及 [搭配 Team 或 Enterprise
方案使用 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他訂閱式選項，請參閱 [OpenAI
Codex](/zh-TW/providers/openai)、[Qwen Cloud Coding
Plan](/zh-TW/providers/qwen)、[MiniMax Coding Plan](/zh-TW/providers/minimax)
以及 [Z.AI / GLM Coding Plan](/zh-TW/providers/zai)。
</Warning>

OpenClaw 也將 Anthropic setup-token 暴露為受支援的權杖驗證路徑，但現在可用時會優先使用 Claude 命令列介面重用與 `claude -p`。

## Anthropic Claude 命令列介面遷移

OpenClaw 再次支援 Anthropic Claude 命令列介面重用。如果主機上已有本機
Claude 登入，onboarding/configure 可以直接重用它。

## OAuth 交換（登入如何運作）

OpenClaw 的互動式登入流程實作於 `openclaw/plugin-sdk/llm`，並接入精靈/命令。

### Anthropic setup-token

流程形狀：

1. 從 OpenClaw 啟動 Anthropic setup-token 或 paste-token
2. OpenClaw 將產生的 Anthropic 憑證儲存在驗證 profile 中
3. 模型選擇維持在 `anthropic/...`
4. 現有 Anthropic 驗證 profiles 仍可用於回復/順序控制

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth 明確支援在 Codex CLI 之外使用，包括 OpenClaw 工作流程。

登入命令仍使用標準 OpenAI 提供者 ID：

```bash
openclaw models auth login --provider openai
```

若要在同一個代理中使用多個 ChatGPT/Codex OAuth 帳戶，請使用
`--profile-id openai:<name>`。新的 profiles 不要使用 `openai-codex:<name>`。
Doctor 會將該較舊前綴遷移為不衝突的 `openai:*` profile ID；修復後，請先執行
`openclaw models auth list --provider openai`，再將 profile ID 複製到
`auth.order` 或 `/model ...@<profileId>`。

流程形狀（PKCE）：

1. 產生 PKCE verifier/challenge + 隨機 `state`
2. 開啟 `https://auth.openai.com/oauth/authorize?...`
3. 嘗試在 `http://127.0.0.1:1455/auth/callback` 擷取 callback
4. 如果 callback 無法繫結（或你在遠端/無頭環境），貼上重新導向 URL/code
5. 在 `https://auth.openai.com/oauth/token` 交換
6. 從存取權杖擷取 `accountId`，並儲存 `{ access, refresh, expires, accountId }`

精靈路徑是 `openclaw onboard` → 驗證選擇 `openai`。

## 重新整理 + 到期

Profiles 會儲存 `expires` 時間戳。

在執行階段：

- 如果 `expires` 是未來時間 → 使用儲存的存取權杖
- 如果已到期 → 重新整理（在檔案鎖下）並覆寫儲存的憑證
- 如果次要代理讀取繼承的主要代理 OAuth profile，重新整理會寫回
  主要代理存放區，而不是把重新整理權杖複製到次要代理存放區
- 例外：某些外部命令列介面憑證會維持外部管理；OpenClaw
  會重新讀取那些命令列介面驗證存放區，而不是花費複製的重新整理權杖。
  Codex CLI 啟動刻意較窄：只有在 OpenClaw
  擁有該提供者的 OAuth 之前，它才能植入空的
  `openai:default` 或明確要求的 OpenAI profile。之後，OpenClaw 擁有的重新整理
  會讓本機 profiles 維持標準來源，探索也不會在任何同層
  位置加入 Codex CLI 驗證。如果受管理的重新整理失敗，OpenClaw 會回報受影響的 profile 以便
  重新驗證，而不是回傳外部命令列介面權杖材料。

重新整理流程是自動的；你通常不需要手動管理權杖。

## 多個帳戶（profiles）+ 路由

兩種模式：

### 1) 建議：分開的代理

如果你希望「個人」和「工作」永遠不要互動，請使用隔離的代理（分開的工作階段 + 憑證 + 工作區）：

```bash
openclaw agents add work
openclaw agents add personal
```

然後逐代理設定驗證（精靈），並將聊天路由到正確的代理。

### 2) 進階：單一代理中的多個 profiles

`auth-profiles.json` 支援同一提供者使用多個 profile ID。

選擇要使用哪個 profile：

- 透過設定排序全域指定（`auth.order`）
- 透過 `/model ...@<profileId>` 逐工作階段指定

範例（工作階段覆寫）：

- `/model Opus@anthropic:work`

如何查看有哪些 profile ID：

- `openclaw channels list --json`（顯示 `auth[]`）

相關文件：

- [模型容錯移轉](/zh-TW/concepts/model-failover)（輪替 + 冷卻規則）
- [斜線命令](/zh-TW/tools/slash-commands)（命令介面）

## 相關

- [驗證](/zh-TW/gateway/authentication) - 模型提供者驗證概覽
- [機密](/zh-TW/gateway/secrets) - 憑證儲存與 SecretRef
- [設定參考](/zh-TW/gateway/configuration-reference#auth-storage) - 驗證設定鍵
