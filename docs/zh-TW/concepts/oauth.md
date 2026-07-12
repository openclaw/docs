---
read_when:
    - 您想完整瞭解 OpenClaw OAuth 的端對端流程
    - 你遇到權杖失效／登出問題
    - 您想使用 Claude 命令列介面或 OAuth 驗證流程
    - 您想要使用多個帳號或設定檔路由
summary: OpenClaw 中的 OAuth：權杖交換、儲存與多帳號模式
title: OAuth
x-i18n:
    generated_at: "2026-07-11T21:19:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw 支援提供 OAuth（「訂閱驗證」）的供應商，
尤其是 **OpenAI Codex（ChatGPT OAuth）** 與 **Anthropic Claude 命令列介面重用**。
對 Anthropic 而言，實際區分如下：

- **Anthropic API 金鑰**：一般 Anthropic API 計費。
- **OpenClaw 內的 Anthropic Claude 命令列介面／訂閱驗證**：Anthropic 員工
  告知我們此用法已再次獲准，因此除非 Anthropic
  發布新政策，OpenClaw 會將此整合中的 Claude 命令列介面重用與
  `claude -p` 用法視為獲准使用。若在正式環境使用 Anthropic，API 金鑰驗證仍是
  較安全的建議途徑。

OpenClaw 將 OpenAI API 金鑰驗證與 ChatGPT/Codex OAuth 都儲存在
標準供應商 ID `openai` 下。較舊的 `openai-codex:*` 設定檔 ID 與
`auth.order.openai-codex` 項目是由 `openclaw doctor --fix`
修復的舊版狀態；新設定請使用 `openai:*` 設定檔 ID 與
`auth.order.openai`。

本頁涵蓋：

- OAuth **權杖交換**的運作方式（PKCE）
- 權杖的**儲存位置**（以及原因）
- 如何處理**多個帳號**（設定檔＋每個工作階段的覆寫）

附帶自有 OAuth 或 API 金鑰流程的供應商外掛會透過
相同進入點執行：

```bash
openclaw models auth login --provider <id>
```

## 權杖匯集處（為何需要它）

OAuth 供應商通常會在每次登入／重新整理時核發新的重新整理權杖。
部分供應商會在為同一使用者／應用程式核發新權杖時，
使先前的重新整理權杖失效。實際症狀是：同時透過 OpenClaw
_以及_ Claude Code／Codex 命令列介面登入後，其中一方稍後會無預警地被登出。

為了減少這種情況，OpenClaw 將驗證設定檔儲存區視為**權杖匯集處**：

- 執行階段會從每個代理程式的單一位置讀取憑證
- 多個設定檔可並存，並以確定性方式路由
- 外部命令列介面重用因供應商而異：一旦 OpenClaw 擁有某供應商的本機 OAuth
  設定檔，本機重新整理權杖即為標準來源。若該本機
  重新整理權杖遭拒，OpenClaw 會回報該設定檔需要
  重新驗證，而不會改用外部命令列介面的權杖資料。
  Codex 命令列介面啟動匯入的範圍更窄：它只能在 OpenClaw 尚未擁有該
  供應商的 OAuth 前，為空白的 `openai:default` 類型設定檔提供初始資料；
  此後，由 OpenClaw 管理的重新整理結果會持續作為標準來源
- 狀態／啟動路徑會將外部命令列介面探索範圍限制在
  已設定的供應商集合，因此在單一供應商設定中，
  不會探查不相關的命令列介面登入儲存區

## 儲存空間（權杖存放位置）

密鑰按代理程式分別存放，並以邏輯名稱 `auth-profiles.json` 作為索引（
底層儲存區是代理程式的 SQLite 資料庫；保留此 JSON 名稱是為了
相容性與工具顯示）：

- 驗證設定檔（OAuth＋API 金鑰＋可選的值層級參照）：
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 舊版相容性檔案：`~/.openclaw/agents/<agentId>/agent/auth.json`
  （發現靜態 `api_key` 項目時會將其清除）

僅供舊版匯入的檔案（仍受支援，但不是主要儲存區）：

- `~/.openclaw/credentials/oauth.json`（首次使用時匯入驗證設定檔儲存區）

以上各項也都遵循 `$OPENCLAW_STATE_DIR`（狀態目錄覆寫）。完整參考：[/gateway/configuration-reference#auth-storage](/zh-TW/gateway/configuration-reference#auth-storage)

關於靜態密鑰參照與執行階段快照啟用行為，請參閱[密鑰管理](/zh-TW/gateway/secrets)。

當次要代理程式沒有本機驗證設定檔時，OpenClaw 會從預設／主要代理程式儲存區
使用直讀式繼承；讀取時不會複製主要代理程式的儲存區。OAuth 重新整理權杖
尤其敏感：一般複製流程預設會略過它們，因為部分供應商會在使用後輪替
或使重新整理權杖失效。代理程式需要獨立帳號時，請為其設定個別的 OAuth 登入。

## Anthropic Claude 命令列介面重用

OpenClaw 支援 Anthropic Claude 命令列介面重用，並將 `claude -p` 視為獲准的
驗證途徑。如果主機上已有本機 Claude 登入，
新手引導／設定可直接重用。Anthropic 設定權杖仍可作為受支援的權杖驗證途徑，
但 OpenClaw 會在 Claude 命令列介面重用可用時優先採用它。

<Warning>
Anthropic 的 Claude Code 公開文件指出，直接使用 Claude Code 仍受
Claude 訂閱限制約束，而 Anthropic 員工告知我們，OpenClaw 類型的 Claude
命令列介面用法已再次獲准。因此，除非 Anthropic
發布新政策，OpenClaw 會將此整合中的 Claude 命令列介面重用與
`claude -p` 用法視為獲准使用。

如需 Anthropic 目前的 Claude Code 直接使用方案文件，請參閱[搭配 Pro 或 Max
方案使用 Claude Code](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
及[搭配 Team 或 Enterprise
方案使用 Claude Code](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)。

若要在 OpenClaw 中使用其他訂閱類型選項，請參閱 [OpenAI
Codex](/zh-TW/providers/openai)、[Qwen 雲端程式設計
方案](/zh-TW/providers/qwen)、[MiniMax 程式設計方案](/zh-TW/providers/minimax)
及 [Z.AI／GLM 程式設計方案](/zh-TW/providers/zai)。
</Warning>

## OAuth 交換（登入的運作方式）

OpenClaw 的互動式登入流程實作於 `openclaw/plugin-sdk/llm.ts`，並連接至精靈／命令。

### Anthropic 設定權杖

流程結構：

1. 從 OpenClaw 啟動 Anthropic 設定權杖流程或貼上權杖流程
2. OpenClaw 將產生的 Anthropic 憑證儲存於驗證設定檔
3. 模型選擇維持使用 `anthropic/...`
4. 現有的 Anthropic 驗證設定檔仍可用於復原／順序控制

### OpenAI Codex（ChatGPT OAuth）

OpenAI Codex OAuth 明確支援在 Codex 命令列介面以外使用，包括 OpenClaw 工作流程。

登入命令使用標準 OpenAI 供應商 ID：

```bash
openclaw models auth login --provider openai
```

若要在單一代理程式中使用多個 ChatGPT/Codex OAuth 帳號，請使用
`--profile-id openai:<name>`。新設定檔請勿使用 `openai-codex:<name>`。
Doctor 會將該舊前綴遷移至不會衝突的 `openai:*` 設定檔 ID；修復後，請先執行
`openclaw models auth list --provider openai`，再將設定檔 ID
複製至 `auth.order` 或 `/model ...@<profileId>`。

流程結構（PKCE）：

1. 產生 PKCE 驗證器／挑戰及隨機 `state`
2. 開啟 `https://auth.openai.com/oauth/authorize?...`（範圍為
   `openid profile email offline_access`）
3. 嘗試在 `http://localhost:1455/auth/callback` 擷取回呼（
   回呼主機預設為 `localhost`，且僅接受迴路主機；
   可用 `OPENCLAW_OAUTH_CALLBACK_HOST` 覆寫）
4. 如果你能在回呼抵達前貼上代碼（或你處於
   遠端／無頭環境且回呼無法繫結），請改為貼上重新導向 URL／代碼
   ——手動貼上會與瀏覽器回呼競速，先完成者勝出
5. 在 `https://auth.openai.com/oauth/token` 交換代碼
6. 從存取權杖擷取 `accountId`，並儲存 `{ access, refresh, expires, accountId }`

精靈路徑為 `openclaw onboard` → 驗證選項 `openai`。

## 重新整理與到期

設定檔會儲存 `expires` 時間戳記。執行階段會：

- 若 `expires` 是未來時間，使用已儲存的存取權杖
- 若已到期，則重新整理（在檔案鎖定下進行）並覆寫已儲存的憑證
- 若次要代理程式讀取繼承自主要代理程式的 OAuth 設定檔，
  重新整理結果會寫回主要代理程式儲存區，而不會將重新整理
  權杖複製至次要代理程式儲存區
- 外部管理的命令列介面憑證（Claude 命令列介面、範圍受限的 Codex 命令列介面啟動匯入；
  請參閱[權杖匯集處](#the-token-sink-why-it-exists)）會重新讀取，而不是
  消耗複製的重新整理權杖。若受管理的重新整理失敗，OpenClaw
  會回報受影響的設定檔需要重新驗證，而不會傳回
  外部命令列介面的權杖資料。

重新整理流程會自動執行；你通常不需要手動管理權杖。

## 多個帳號（設定檔）與路由

有兩種模式：

### 1) 建議：分開的代理程式

若要讓「個人」與「工作」永不互相影響，請使用隔離的代理程式（各自擁有工作階段、憑證與工作區）：

```bash
openclaw agents add work
openclaw agents add personal
```

接著為每個代理程式設定驗證（透過精靈），並將聊天路由至正確的代理程式。

### 2) 進階：單一代理程式中的多個設定檔

驗證設定檔儲存區支援同一供應商的多個設定檔 ID。
可透過以下方式選擇要使用的設定檔：

- 透過設定順序在全域指定（`auth.order`）
- 透過 `/model ...@<profileId>` 按工作階段指定

範例（工作階段覆寫）：

- `/model Opus@anthropic:work`

使用以下命令列出現有設定檔 ID：

```bash
openclaw models auth list --provider <id>
```

相關文件：

- [模型容錯移轉](/zh-TW/concepts/model-failover)（輪替＋冷卻規則）
- [斜線命令](/zh-TW/tools/slash-commands)（命令介面）

## 相關內容

- [驗證](/zh-TW/gateway/authentication)－模型供應商驗證概覽
- [密鑰](/zh-TW/gateway/secrets)－憑證儲存與 SecretRef
- [設定參考](/zh-TW/gateway/configuration-reference#auth-storage)－驗證設定鍵
