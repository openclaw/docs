---
read_when:
    - 您想以互動方式調整憑證、裝置或代理程式預設值
summary: CLI 參考：`openclaw configure`（互動式設定提示）
title: 設定
x-i18n:
    generated_at: "2026-05-10T19:27:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba5320fefb856c208405511619fc1a4314e3f5e3990f221e987a03d692189fb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

針對現有設定進行目標變更的互動式提示：認證資訊、裝置、代理預設值、Gateway、頻道、Plugin、Skills，以及健康檢查。

使用 `openclaw onboard` 進行完整引導式首次執行流程，使用 `openclaw setup` 僅建立基準設定/工作區，當你只需要設定頻道帳號時，使用 `openclaw channels add`。

<Note>
**模型** 區段包含 `agents.defaults.models` 允許清單的多選項目（會顯示在 `/model` 和模型選擇器中的內容）。提供者範圍的設定選擇會將所選模型合併到現有允許清單，而不是取代設定中已存在的不相關提供者。

從 configure 重新執行提供者驗證會保留現有的 `agents.defaults.model.primary`，即使提供者的驗證步驟傳回包含其自身建議預設模型的設定修補也一樣。這表示新增或重新驗證 xAI、OpenRouter 或其他提供者時，應會讓新模型可用，而不會接管你目前的主要模型。當你有意變更預設模型時，請使用 `openclaw models auth login --provider <id> --set-default` 或 `openclaw models set <model>`。
</Note>

當 configure 從提供者驗證選項開始時，預設模型與允許清單選擇器會自動偏好該提供者。對於 Volcengine 和 BytePlus 這類成對提供者，相同偏好也會比對其 coding-plan 變體（`volcengine-plan/*`、`byteplus-plan/*`）。如果偏好的提供者篩選器會產生空清單，configure 會退回未篩選的目錄，而不是顯示空白選擇器。

<Tip>
不帶子命令的 `openclaw config` 會開啟相同精靈。使用 `openclaw config get|set|unset` 進行非互動式編輯。
</Tip>

對於網頁搜尋，`openclaw configure --section web` 可讓你選擇提供者並設定其認證資訊。某些提供者也會顯示提供者專屬的後續提示：

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

- 選擇 Gateway 執行位置時，一律會更新 `gateway.mode`。如果這就是你需要的全部內容，你可以選擇「繼續」，而不選擇其他區段。
- 在寫入本機設定後，當所選設定路徑需要時，configure 會安裝所選的可下載 Plugin。遠端 Gateway 設定不會安裝本機 Plugin 套件。
- 以頻道為導向的服務（Slack/Discord/Matrix/Microsoft Teams）會在設定期間提示輸入頻道/房間允許清單。你可以輸入名稱或 ID；精靈會盡可能將名稱解析為 ID。
- 如果你執行 daemon 安裝步驟，token 驗證需要 token，且 `gateway.auth.token` 由 SecretRef 管理，configure 會驗證 SecretRef，但不會將解析後的純文字 token 值持久保存到 supervisor 服務環境中繼資料。
- 如果 token 驗證需要 token，且已設定的 token SecretRef 無法解析，configure 會阻止 daemon 安裝，並提供可操作的修復指引。
- 如果同時設定了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未設定，configure 會阻止 daemon 安裝，直到明確設定 mode 為止。

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
