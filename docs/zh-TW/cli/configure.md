---
read_when:
    - 你想以互動方式調整認證資訊、裝置或代理程式預設值
summary: '`openclaw configure` 的命令列介面參考（互動式設定提示）'
title: 設定
x-i18n:
    generated_at: "2026-07-19T13:38:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5980d06e75a5df9e5269d0ef78431f730d6f5fd050dca74784ef3426fb0433d8
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

針對現有設定進行特定變更的互動式提示：認證資訊、裝置、代理程式預設值、閘道、頻道、外掛、Skills，以及健康狀態檢查。

若要進行完整引導式首次執行流程，請使用 `openclaw onboard` 或 `openclaw setup`；若只需基準設定／工作區，請使用 `openclaw setup --baseline`；若只需設定頻道帳號，請使用 `openclaw channels add`。

<Tip>
不含子命令的 `openclaw config` 會開啟相同的精靈。若要進行非互動式編輯，請使用 `openclaw config get|set|unset`。
</Tip>

## 選項

`--section <section>`：可重複使用的區段篩選器。可用區段：

`workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

選取 `gateway`、`daemon` 或 `health`（或在不含 `--section` 的情況下執行完整精靈）時，系統會提示閘道的執行位置，並更新 `gateway.mode`。略過這三者的區段篩選器會直接進入所要求的設定，不會顯示閘道模式提示。選擇遠端閘道模式會寫入遠端設定並立即結束；它不會執行僅限本機的步驟，例如安裝外掛。

<Note>
`openclaw configure` 需要互動式終端機（stdin 和 stdout 都必須是 TTY）。若無互動式終端機，它會列印對等的非互動式 `openclaw config get|set|patch|validate` 命令並以錯誤結束，而不會只執行部分流程。
</Note>

## 模型區段

<Note>
**模型**包含明確 `agents.defaults.modelPolicy.allow` 清單的多選項目（即 `/model` 和模型選擇器中顯示的內容）。限定於供應商的設定選項會將所選模型合併至現有清單，而不會取代設定中既有的其他不相關供應商。各模型的別名與參數仍位於 `agents.defaults.models` 下；這些項目本身不會限制模型覆寫。

從 configure 重新執行供應商驗證時，會保留現有的 `agents.defaults.model.primary`，即使供應商的驗證步驟傳回的設定修補包含其自行建議的預設模型也是如此。新增供應商或為供應商重新驗證，會讓其模型可供使用，但不會接管你目前的主要模型。若要刻意變更預設模型，請使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

當 configure 從供應商驗證選項啟動時，預設模型與模型原則選擇器會自動優先顯示該供應商。對於 Volcengine 和 BytePlus 等配對供應商，相同的偏好也會比對其程式設計方案變體（`volcengine-plan/*`、`byteplus-plan/*`）。如果偏好供應商篩選器會產生空白清單，configure 會改用未篩選的目錄，而不會顯示空白選擇器。

## 網頁區段

`openclaw configure --section web` 會選擇網頁搜尋供應商並設定其認證資訊。部分供應商會顯示供應商專屬的後續選項：

- **Grok** 可提供選用的 `x_search` 設定，並使用相同的 xAI OAuth 設定檔或 API 金鑰，也可讓你選擇 `x_search` 模型。
- **Kimi** 可詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設的 Kimi 網頁搜尋模型。

## 其他注意事項

- 寫入本機設定後，當所選設定路徑需要時，configure 會安裝已選取且可下載的外掛。遠端閘道設定不會安裝本機外掛套件。
- 以頻道為主的服務（Slack／Discord／Matrix／Microsoft Teams）會在設定期間提示輸入頻道／聊天室允許清單。你可以輸入名稱或 ID；精靈會盡可能將名稱解析為 ID。
- 如果執行常駐程式安裝步驟，權杖驗證需要權杖。如果 `gateway.auth.token` 由 SecretRef 管理，configure 會驗證 SecretRef，但不會將解析出的明文權杖值持久儲存至監督程式服務的環境中繼資料；如果 SecretRef 無法解析，configure 會阻止安裝常駐程式，並提供可採取行動的修正指引。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已設定，而 `gateway.auth.mode` 未設定，configure 會阻止安裝常駐程式，直到你明確設定模式為止。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
- 設定命令列介面：[設定](/zh-TW/cli/config)
