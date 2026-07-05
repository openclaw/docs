---
read_when:
    - 你想了解 OpenClaw OAuth 的端對端流程
    - 你遇到權杖失效／登出問題
    - 你想要 Claude 命令列介面或 OAuth 驗證流程
    - 你想要多個帳號或設定檔路由
summary: OpenClaw 中的 OAuth：權杖交換、儲存與多帳號模式
title: OAuth
x-i18n:
    generated_at: "2026-07-05T11:16:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 支援提供者所提供的 OAuth（「訂閱驗證」），
尤其是 **OpenAI Codex（ChatGPT OAuth）** 和 **Anthropic Claude 命令列介面重用**。
對 Anthropic 而言，實務上的區分是：

- **Anthropic API 金鑰**：一般 Anthropic API 計費。
- **OpenClaw 內的 Anthropic Claude 命令列介面／訂閱驗證**：Anthropic 員工
  告訴我們這種用法再次被允許，因此 OpenClaw 會將 Claude 命令列介面重用和
  `claude -p` 用法視為此整合的受允許用法，除非 Anthropic
  發布新政策。Anthropic 在生產環境中仍建議使用 API 金鑰驗證，
  這是較安全的路徑。

OpenClaw 會將 OpenAI API 金鑰驗證和 ChatGPT/Codex OAuth 都儲存在
正式提供者 ID `openai` 之下。較舊的 `openai-codex:*` 設定檔 ID 和
`auth.order.openai-codex` 項目是由 `openclaw doctor --fix`
修復的舊版狀態；新設定請使用 `openai:*` 設定檔 ID 和 `auth.order.openai`。

本頁涵蓋：

- OAuth **權杖交換**如何運作（PKCE）
- 權杖**儲存**在哪裡（以及原因）
- 如何處理**多個帳號**（設定檔 + 個別工作階段覆寫）

隨附自己的 OAuth 或 API 金鑰流程的提供者外掛會透過相同進入點執行：

```bash
openclaw models auth login --provider <id>
```

## 權杖匯集點（存在原因）

OAuth 提供者通常會在每次登入／重新整理時鑄造新的重新整理權杖。
有些提供者會在為同一使用者／應用程式發出新的重新整理權杖時，
使先前的重新整理權杖失效。實際症狀是：同時透過 OpenClaw _以及_
Claude Code / Codex 命令列介面登入，之後其中一個會隨機被登出。

為了降低這種情況，OpenClaw 將驗證設定檔儲存區視為**權杖匯集點**：

- 執行階段會從每個代理的一個位置讀取憑證
- 多個設定檔可以共存並以可預測方式路由
- 外部命令列介面重用是提供者特定的：一旦 OpenClaw 擁有某提供者的本機 OAuth
  設定檔，本機重新整理權杖就是正式來源。如果該本機重新整理權杖遭拒，
  OpenClaw 會回報該設定檔需要重新驗證，而不是退回使用外部命令列介面權杖材料。
  Codex 命令列介面啟動更狹窄：它只能在 OpenClaw 尚未擁有該提供者的 OAuth
  之前，為空的 `openai:default` 風格設定檔播種；之後，OpenClaw 擁有的重新整理會維持正式來源
- 狀態／啟動路徑會將外部命令列介面探索範圍限制在已設定的提供者集合，
  因此單一提供者設定不會探查無關的命令列介面登入儲存區

## 儲存（權杖所在位置）

密鑰依代理儲存，並以邏輯名稱 `auth-profiles.json` 作為鍵（底層儲存區是代理的 SQLite 資料庫；JSON 名稱保留用於相容性和工具顯示）：

- 驗證設定檔（OAuth + API 金鑰 + 選用的值層級參照）：
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版相容性檔案：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （發現靜態 `api_key` 項目時會將其清除）

僅限舊版匯入的檔案（仍受支援，但不是主要儲存區）：

- `~/.openclaw/credentials/oauth.json`（首次使用時匯入驗證設定檔儲存區）

以上全部也都遵循 `$OPENCLAW_STATE_DIR`（狀態目錄覆寫）。完整參考：[/gateway/configuration-reference#auth-storage](/zh-TW/gateway/configuration-reference#auth-storage)

如需靜態密鑰參照和執行階段快照啟用行為，請參閱[密鑰管理](/zh-TW/gateway/secrets)。

當次要代理沒有本機驗證設定檔時，OpenClaw 會從預設／主要代理儲存區使用讀取穿透繼承；
它不會在讀取時複製主要代理的儲存區。OAuth 重新整理權杖尤其敏感：
一般複製流程預設會略過它們，因為有些提供者會在使用後輪替或使重新整理權杖失效。
當代理需要獨立帳號時，請為該代理設定個別的 OAuth 登入。

## Anthropic Claude 命令列介面重用

OpenClaw 支援 Anthropic Claude 命令列介面重用和 `claude -p` 作為受允許的
驗證路徑。如果主機上已有本機 Claude 登入，
onboarding/configure 可以直接重用它。Anthropic setup-token 仍然
可作為受支援的權杖驗證路徑，但 OpenClaw 會在可用時偏好 Claude 命令列介面
重用。

<Warning>
Anthropic 的公開 Claude Code 文件表示，直接使用 Claude Code 仍會維持在
Claude 訂閱限制內，且 Anthropic 員工告訴我們 OpenClaw 風格的 Claude
命令列介面用法再次被允許。因此 OpenClaw 會將 Claude 命令列介面重用和
`claude -p` 用法視為此整合的受允許用法，除非 Anthropic
發布新政策。

如需 Anthropic 目前的直接 Claude Code 方案文件，請參閱[搭配 Pro 或 Max
方案使用 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
和[搭配 Team 或 Enterprise
方案使用 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

如果你想在 OpenClaw 中使用其他訂閱風格的選項，請參閱 [OpenAI
Codex](/zh-TW/providers/openai)、[Qwen Cloud Coding
Plan](/zh-TW/providers/qwen)、[MiniMax Coding Plan](/zh-TW/providers/minimax)
和 [Z.AI / GLM Coding Plan](/zh-TW/providers/zai)。
</Warning>

## OAuth 交換（登入如何運作）

OpenClaw 的互動式登入流程實作於 `openclaw/plugin-sdk/llm.ts`，並接入精靈／命令。

### Anthropic setup-token

流程形狀：

1. 從 OpenClaw 啟動 Anthropic setup-token 或 paste-token
2. OpenClaw 將產生的 Anthropic 憑證儲存在驗證設定檔中
3. 模型選擇維持在 `anthropic/...`
4. 現有 Anthropic 驗證設定檔仍可用於回復／順序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明確支援在 Codex 命令列介面之外使用，包括 OpenClaw 工作流程。

登入命令使用正式 OpenAI 提供者 ID：

```bash
openclaw models auth login --provider openai
```

在同一個代理中有多個 ChatGPT/Codex OAuth 帳號時，請使用 `--profile-id openai:<name>`。
不要對新設定檔使用 `openai-codex:<name>`。Doctor 會將該較舊前綴遷移到
不會衝突的 `openai:*` 設定檔 ID；修復後請先執行
`openclaw models auth list --provider openai`，再將設定檔 ID 複製到
`auth.order` 或 `/model ...@<profileId>`。

流程形狀（PKCE）：

1. 產生 PKCE verifier/challenge 和隨機 `state`
2. 開啟 `https://auth.openai.com/oauth/authorize?...`（範圍
   `openid profile email offline_access`）
3. 嘗試在 `http://localhost:1455/auth/callback` 擷取回呼（
   回呼主機預設為 `localhost`，且只接受 loopback 主機；
   可用 `OPENCLAW_OAUTH_CALLBACK_HOST` 覆寫）
4. 如果你能在回呼抵達前貼上代碼（或你是在遠端／無介面環境，且回呼無法繫結），
   請改貼重新導向 URL／代碼 - 手動貼上會與瀏覽器回呼競速，先完成者勝出
5. 在 `https://auth.openai.com/oauth/token` 交換代碼
6. 從存取權杖擷取 `accountId`，並儲存 `{ access, refresh, expires, accountId }`

精靈路徑是 `openclaw onboard` → 驗證選項 `openai`。

## 重新整理 + 到期

設定檔會儲存 `expires` 時間戳。執行階段中：

- 如果 `expires` 在未來，使用已儲存的存取權杖
- 如果已到期，重新整理（在檔案鎖下）並覆寫已儲存的憑證
- 如果次要代理讀取繼承的主要代理 OAuth 設定檔，
  重新整理會寫回主要代理儲存區，而不是將重新整理權杖複製到次要代理儲存區
- 外部管理的命令列介面憑證（Claude 命令列介面、狹窄的 Codex 命令列介面啟動；
  請參閱[權杖匯集點](#the-token-sink-why-it-exists)）會重新讀取，而不是花費複製的重新整理權杖。
  如果受管理的重新整理失敗，OpenClaw 會回報受影響的設定檔需要重新驗證，
  而不是回傳外部命令列介面權杖材料。

重新整理流程是自動的；你通常不需要手動管理權杖。

## 多個帳號（設定檔）+ 路由

兩種模式：

### 1) 偏好方式：分開代理

如果你希望「個人」和「工作」永不互動，請使用隔離代理（分開的工作階段 + 憑證 + 工作區）：

```bash
openclaw agents add work
openclaw agents add personal
```

接著依代理設定驗證（精靈），並將聊天路由到正確代理。

### 2) 進階：同一代理中的多個設定檔

驗證設定檔儲存區支援同一提供者的多個設定檔 ID。
選擇要使用哪一個：

- 透過設定排序全域指定（`auth.order`）
- 透過 `/model ...@<profileId>` 逐工作階段指定

範例（工作階段覆寫）：

- `/model Opus@anthropic:work`

使用以下命令列出現有設定檔 ID：

```bash
openclaw models auth list --provider <id>
```

相關文件：

- [模型容錯移轉](/zh-TW/concepts/model-failover)（輪替 + 冷卻規則）
- [斜線命令](/zh-TW/tools/slash-commands)（命令介面）

## 相關

- [驗證](/zh-TW/gateway/authentication) - 模型提供者驗證概觀
- [密鑰](/zh-TW/gateway/secrets) - 憑證儲存和 SecretRef
- [設定參考](/zh-TW/gateway/configuration-reference#auth-storage) - 驗證設定鍵
