---
read_when:
    - 你想要以互動方式調整憑證、裝置或代理程式預設值
summary: '`openclaw configure` 的命令列介面參考（互動式設定提示）'
title: 設定
x-i18n:
    generated_at: "2026-07-11T21:13:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

透過互動式提示，針對現有設定進行特定變更：憑證、裝置、代理程式預設值、閘道、頻道、外掛、Skills 與健康狀態檢查。

完整的首次執行引導流程請使用 `openclaw onboard` 或 `openclaw setup`；若只需建立基準設定／工作區，請使用 `openclaw setup --baseline`；若只需設定頻道帳號，請使用 `openclaw channels add`。

<Tip>
未指定子命令的 `openclaw config` 會開啟相同的精靈。若要進行非互動式編輯，請使用 `openclaw config get|set|unset`。
</Tip>

## 選項

`--section <section>`：可重複指定的區段篩選器。可用區段如下：

`workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

選取 `gateway`、`daemon` 或 `health`（或未指定 `--section` 而執行完整精靈）時，系統會提示閘道的執行位置，並更新 `gateway.mode`。若區段篩選器略過這三個區段，則會直接進入要求的設定流程，不顯示閘道模式提示。選擇遠端閘道模式後，系統會寫入遠端設定並立即結束；不會執行外掛安裝等僅限本機的步驟。

<Note>
`openclaw configure` 需要互動式終端機（標準輸入與標準輸出都必須是 TTY）。若無互動式終端機，它會列印功能相當的非互動式 `openclaw config get|set|patch|validate` 命令並回報錯誤後結束，而不會只執行部分流程。
</Note>

## 模型區段

<Note>
**模型**包含 `agents.defaults.models` 允許清單的多選項目（決定 `/model` 與模型選擇器中顯示的內容）。限定供應商範圍的設定選項會將所選模型合併至現有允許清單，而不會取代設定中已有的其他無關供應商。

從設定流程重新執行供應商驗證時，即使供應商的驗證步驟回傳包含其自訂建議預設模型的設定修補，也會保留現有的 `agents.defaults.model.primary`。新增供應商或重新驗證供應商會讓其模型可供使用，但不會取代目前的主要模型。若要刻意變更預設模型，請使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

當設定流程從供應商驗證選項開始時，預設模型與允許清單選擇器會自動優先顯示該供應商。對於 Volcengine 和 BytePlus 等成對供應商，相同的偏好也會比對其程式設計方案變體（`volcengine-plan/*`、`byteplus-plan/*`）。若偏好供應商篩選器會產生空白清單，設定流程會改用未篩選的目錄，而不會顯示空白選擇器。

## 網頁區段

`openclaw configure --section web` 會選取網頁搜尋供應商並設定其憑證。部分供應商會顯示供應商專屬的後續選項：

- **Grok** 可使用相同的 xAI OAuth 設定檔或 API 金鑰提供選用的 `x_search` 設定，並讓你選擇 `x_search` 模型。
- **Kimi** 可詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設的 Kimi 網頁搜尋模型。

## 其他注意事項

- 寫入本機設定後，若所選設定路徑需要可下載的外掛，設定流程會安裝選取的外掛。遠端閘道設定不會安裝本機外掛套件。
- 以頻道為導向的服務（Slack／Discord／Matrix／Microsoft Teams）會在設定期間提示輸入頻道／聊天室允許清單。你可以輸入名稱或 ID；精靈會在可能的情況下將名稱解析為 ID。
- 若執行常駐程式安裝步驟，權杖驗證必須提供權杖。若 `gateway.auth.token` 由 SecretRef 管理，設定流程會驗證 SecretRef，但不會將解析後的明文權杖值保存至監督程式服務的環境中繼資料；若 SecretRef 無法解析，設定流程會阻止安裝常駐程式，並提供可採取行動的修正指引。
- 若已同時設定 `gateway.auth.token` 與 `gateway.auth.password`，但未設定 `gateway.auth.mode`，設定流程會阻止安裝常駐程式，直到你明確設定模式為止。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
- 設定命令列介面：[設定](/zh-TW/cli/config)
