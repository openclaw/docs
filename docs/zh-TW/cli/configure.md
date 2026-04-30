---
read_when:
    - 您想以互動方式調整憑證、裝置或代理預設值
summary: '`openclaw configure` 的 CLI 參考資料（互動式設定提示）'
title: 設定
x-i18n:
    generated_at: "2026-04-30T02:52:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

用於設定憑證、裝置與代理預設值的互動式提示。

<Note>
**模型**區段包含 `agents.defaults.models` 允許清單的多選項目（會顯示在 `/model` 和模型選擇器中的內容）。依供應商範圍設定的選項，會將所選模型合併到既有允許清單，而不是取代設定中已存在的其他無關供應商。從 configure 重新執行供應商驗證時，會保留現有的 `agents.defaults.model.primary`。當你刻意想變更預設模型時，請使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

當 configure 從供應商驗證選項開始時，預設模型與允許清單選擇器會自動優先使用該供應商。對於 Volcengine 和 BytePlus 等成對供應商，相同的偏好也會符合其編碼方案變體（`volcengine-plan/*`、`byteplus-plan/*`）。如果偏好的供應商篩選器會產生空清單，configure 會改用未篩選的目錄，而不是顯示空白選擇器。

<Tip>
不帶子命令的 `openclaw config` 會開啟相同的精靈。使用 `openclaw config get|set|unset` 進行非互動式編輯。
</Tip>

對於網頁搜尋，`openclaw configure --section web` 可讓你選擇供應商
並設定其憑證。有些供應商也會顯示供應商專屬的
後續提示：

- **Grok** 可以使用相同的 `XAI_API_KEY` 提供選用的 `x_search` 設定，並
  讓你選擇 `x_search` 模型。
- **Kimi** 可以詢問 Moonshot API 區域（`api.moonshot.ai` 與
  `api.moonshot.cn`）以及預設的 Kimi 網頁搜尋模型。

相關：

- Gateway 設定參考：[Configuration](/zh-TW/gateway/configuration)
- Config CLI：[Config](/zh-TW/cli/config)

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

- 選擇 Gateway 執行位置一律會更新 `gateway.mode`。如果這就是你需要的全部內容，可以選擇「繼續」而不選其他區段。
- 以頻道為導向的服務（Slack/Discord/Matrix/Microsoft Teams）會在設定期間提示輸入頻道/聊天室允許清單。你可以輸入名稱或 ID；精靈會在可行情況下將名稱解析為 ID。
- 如果你執行 daemon 安裝步驟，權杖驗證需要權杖，且 `gateway.auth.token` 由 SecretRef 管理，configure 會驗證 SecretRef，但不會將解析後的明文權杖值保存到 supervisor 服務環境中繼資料。
- 如果權杖驗證需要權杖，而設定的權杖 SecretRef 無法解析，configure 會阻止 daemon 安裝，並提供可執行的修復指引。
- 如果已同時設定 `gateway.auth.token` 和 `gateway.auth.password`，且未設定 `gateway.auth.mode`，configure 會阻止 daemon 安裝，直到明確設定模式為止。

## 範例

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Configuration](/zh-TW/gateway/configuration)
