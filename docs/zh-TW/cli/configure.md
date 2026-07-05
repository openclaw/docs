---
read_when:
    - 你想要以互動方式調整憑證、裝置或代理程式預設值
summary: '`openclaw configure` 的命令列介面參考（互動式設定提示）'
title: 設定
x-i18n:
    generated_at: "2026-07-05T11:10:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

互動式提示，用於對現有設定進行目標式變更：憑證、裝置、代理預設值、閘道、頻道、外掛、Skills，以及健康檢查。

完整的首次執行引導流程請使用 `openclaw onboard` 或 `openclaw setup`，只建立基準設定/工作區請使用 `openclaw setup --baseline`，而只需要設定頻道帳號時請使用 `openclaw channels add`。

<Tip>
不帶子命令的 `openclaw config` 會開啟相同的精靈。非互動式編輯請使用 `openclaw config get|set|unset`。
</Tip>

## 選項

`--section <section>`：可重複的區段篩選器。可用區段：

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

選取 `gateway`、`daemon` 或 `health`（或不帶 `--section` 執行完整精靈）時，會提示閘道在哪裡執行，並更新 `gateway.mode`。略過這三者的區段篩選器會直接進入要求的設定，不會出現閘道模式提示。選擇遠端閘道模式會寫入遠端設定並立即結束；它不會執行僅限本機的步驟，例如安裝外掛。

<Note>
`openclaw configure` 需要互動式終端機（stdin 和 stdout 都必須是 TTY）。若沒有互動式終端機，它會列印等效的非互動式 `openclaw config get|set|patch|validate` 命令，然後以錯誤結束，而不是只執行一部分。
</Note>

## 模型區段

<Note>
**模型**包含 `agents.defaults.models` 允許清單的多選項（會顯示在 `/model` 和模型選擇器中）。供應商範圍的設定選項會將其選取的模型合併到現有允許清單，而不是取代設定中已存在的其他不相關供應商。

從 configure 重新執行供應商驗證時，會保留現有的 `agents.defaults.model.primary`，即使供應商的驗證步驟傳回的設定修補包含它自己建議的預設模型也一樣。新增或重新驗證供應商會讓其模型可用，但不會接管你目前的主要模型。若要刻意變更預設模型，請使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

當 configure 從供應商驗證選項開始時，預設模型和允許清單選擇器會自動優先使用該供應商。對於 Volcengine 和 BytePlus 等成對供應商，相同偏好也會匹配其 coding-plan 變體（`volcengine-plan/*`、`byteplus-plan/*`）。如果偏好供應商篩選器會產生空清單，configure 會改為回退到未篩選的目錄，而不是顯示空白選擇器。

## 網頁區段

`openclaw configure --section web` 會選擇網頁搜尋供應商並設定其憑證。部分供應商會顯示供應商專屬的後續選項：

- **Grok** 可以使用相同的 xAI OAuth 設定檔或 API key 提供選用的 `x_search` 設定，並讓你選擇 `x_search` 模型。
- **Kimi** 可以詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設的 Kimi 網頁搜尋模型。

## 其他注意事項

- 本機設定寫入後，當所選設定路徑需要時，configure 會安裝選取的可下載外掛。遠端閘道設定不會安裝本機外掛套件。
- 以頻道為導向的服務（Slack/Discord/Matrix/Microsoft Teams）會在設定期間提示輸入頻道/聊天室允許清單。你可以輸入名稱或 ID；精靈會在可能時將名稱解析為 ID。
- 如果你執行常駐程式安裝步驟，權杖驗證需要權杖。如果 `gateway.auth.token` 由 SecretRef 管理，configure 會驗證 SecretRef，但不會將解析出的純文字權杖值持久化到 supervisor 服務環境中繼資料；如果 SecretRef 無法解析，configure 會封鎖常駐程式安裝，並提供可執行的修復指引。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，configure 會封鎖常駐程式安裝，直到你明確設定該模式。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
- 設定命令列介面：[設定](/zh-TW/cli/config)
