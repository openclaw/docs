---
read_when:
    - 你想要以互動方式調整憑證、裝置或代理預設值
summary: '`openclaw configure` 的命令列介面參考（互動式設定提示）'
title: 設定
x-i18n:
    generated_at: "2026-06-27T19:04:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

用於對現有設定進行目標變更的互動式提示：憑證、裝置、代理程式預設值、閘道、通道、外掛、Skills，以及健康檢查。

完整的首次執行引導流程請使用 `openclaw onboard`，僅需基準設定/工作區時請使用 `openclaw setup`，只需要設定通道帳戶時請使用 `openclaw channels add`。

<Note>
**模型**區段包含 `agents.defaults.models` 允許清單的多選項目（會顯示在 `/model` 與模型選擇器中的內容）。提供者範圍的設定選項會將其選取的模型合併到現有允許清單中，而不是取代設定中既有的不相關提供者。

從 configure 重新執行提供者驗證時，會保留現有的 `agents.defaults.model.primary`，即使提供者的驗證步驟傳回包含其自身建議預設模型的設定修補也是如此。這表示新增或重新驗證 xAI、OpenRouter 或其他提供者時，應該會讓新模型可用，而不會取代你目前的主要模型。當你有意變更預設模型時，請使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

當 configure 從提供者驗證選項啟動時，預設模型與允許清單選擇器會自動偏好該提供者。對於 Volcengine 和 BytePlus 等成對提供者，同一偏好也會比對其 coding-plan 變體（`volcengine-plan/*`、`byteplus-plan/*`）。如果偏好的提供者篩選器會產生空清單，configure 會改為退回未篩選的目錄，而不是顯示空白選擇器。

<Tip>
不帶子命令的 `openclaw config` 會開啟相同的精靈。非互動式編輯請使用 `openclaw config get|set|unset`。
</Tip>

對於網頁搜尋，`openclaw configure --section web` 可讓你選擇提供者
並設定其憑證。某些提供者也會顯示提供者特定的
後續提示：

- **Grok** 可以提供選用的 `x_search` 設定，使用相同的 xAI OAuth 設定檔
  或 API 金鑰，並讓你選擇 `x_search` 模型。
- **Kimi** 可以詢問 Moonshot API 區域（`api.moonshot.ai` 或
  `api.moonshot.cn`）以及預設的 Kimi 網頁搜尋模型。

相關：

- 閘道設定參考：[設定](/zh-TW/gateway/configuration)
- 設定命令列介面：[設定](/zh-TW/cli/config)

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

- 完整精靈與閘道相關區段會詢問閘道執行的位置，並更新 `gateway.mode`。未包含 `gateway`、`daemon` 或 `health` 的區段篩選器會直接進入要求的設定。
- 寫入本機設定後，當所選設定路徑需要時，configure 會安裝選取的可下載外掛。遠端閘道設定不會安裝本機外掛套件。
- 以通道為導向的服務（Slack/Discord/Matrix/Microsoft Teams）會在設定期間提示輸入通道/聊天室允許清單。你可以輸入名稱或 ID；精靈會在可能時將名稱解析為 ID。
- 如果你執行 daemon 安裝步驟，權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，configure 會驗證 SecretRef，但不會將解析後的純文字權杖值保存到 supervisor 服務環境中繼資料。
- 如果權杖驗證需要權杖且設定的權杖 SecretRef 未解析，configure 會阻止 daemon 安裝，並提供可操作的修復指引。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，configure 會阻止 daemon 安裝，直到明確設定 mode。

## 範例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 相關

- [命令列介面參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
