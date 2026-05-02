---
read_when:
    - 你想以互動方式調整憑證、裝置或代理程式預設值
summary: CLI 參考：`openclaw configure`（互動式設定提示）
title: 設定
x-i18n:
    generated_at: "2026-05-02T02:45:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

用於設定憑證、裝置與代理程式預設值的互動式提示。

<Note>
**模型**區段包含 `agents.defaults.models` 允許清單的多選項目（會顯示在 `/model` 與模型選擇器中的項目）。供應商範圍的設定選擇會將其選取的模型合併到現有允許清單，而不是取代設定中已有的不相關供應商。

從設定重新執行供應商驗證時，會保留現有的 `agents.defaults.model.primary`，即使該供應商的驗證步驟傳回包含其建議預設模型的設定修補也一樣。這表示新增或重新驗證 xAI、OpenRouter 或其他供應商時，應該會讓新模型可用，而不會接管目前的主要模型。當你有意變更預設模型時，請使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

當設定從供應商驗證選擇開始時，預設模型與允許清單選擇器會自動優先使用該供應商。對於 Volcengine 與 BytePlus 等成對供應商，同一個偏好也會符合它們的 coding-plan 變體（`volcengine-plan/*`、`byteplus-plan/*`）。如果偏好供應商篩選會產生空清單，設定會改為回退到未篩選的目錄，而不是顯示空白選擇器。

<Tip>
沒有子命令的 `openclaw config` 會開啟相同的精靈。使用 `openclaw config get|set|unset` 進行非互動式編輯。
</Tip>

針對網頁搜尋，`openclaw configure --section web` 可讓你選擇供應商並設定其憑證。部分供應商也會顯示供應商特定的後續提示：

- **Grok** 可以使用相同的 `XAI_API_KEY` 提供選用的 `x_search` 設定，並讓你挑選 `x_search` 模型。
- **Kimi** 可以詢問 Moonshot API 區域（`api.moonshot.ai` 或 `api.moonshot.cn`）以及預設的 Kimi 網頁搜尋模型。

相關：

- Gateway 設定參考：[設定](/zh-TW/gateway/configuration)
- 設定 CLI：[設定](/zh-TW/cli/config)

## 選項

- `--section <section>`：可重複的區段篩選器

可用區段：

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

注意事項：

- 選擇 Gateway 執行位置時，一律會更新 `gateway.mode`。如果這就是你所需要的全部內容，可以在不選其他區段的情況下選取「繼續」。
- 寫入本機設定後，當選取的設定路徑需要時，設定會安裝選取的可下載 Plugin。遠端 Gateway 設定不會安裝本機 Plugin 套件。
- 以頻道為導向的服務（Slack/Discord/Matrix/Microsoft Teams）會在設定期間提示輸入頻道/聊天室允許清單。你可以輸入名稱或 ID；精靈會在可行時將名稱解析為 ID。
- 如果你執行 daemon 安裝步驟、權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，設定會驗證 SecretRef，但不會將解析出的純文字權杖值持久化到 supervisor 服務環境中繼資料。
- 如果權杖驗證需要權杖，而已設定的權杖 SecretRef 無法解析，設定會封鎖 daemon 安裝，並提供可執行的修復指引。
- 如果同時設定了 `gateway.auth.token` 與 `gateway.auth.password`，且未設定 `gateway.auth.mode`，設定會封鎖 daemon 安裝，直到明確設定模式為止。

## 範例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
