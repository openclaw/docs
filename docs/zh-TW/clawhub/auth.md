---
read_when:
    - 登入 ClawHub
    - 使用 ClawHub CLI
    - 偵錯 401 錯誤
summary: ClawHub 登入、API 權杖、CLI 登入、權杖儲存與撤銷。
x-i18n:
    generated_at: "2026-05-13T05:32:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# 身分驗證

ClawHub 使用 GitHub 進行網頁登入。CLI 使用透過該已登入帳戶建立的 ClawHub API 權杖。

## 網頁登入

使用 GitHub 在 [clawhub.ai](https://clawhub.ai) 登入。

已刪除、遭封鎖或停用的帳戶無法完成一般 ClawHub 登入。如果登入後又回到登出狀態，你的帳戶可能並非正常狀態。

## CLI 登入

預設的 CLI 登入流程會開啟你的瀏覽器：

```bash
clawhub login
clawhub whoami
```

會發生的事：

1. CLI 會在 `127.0.0.1` 啟動暫時的回呼伺服器。
2. 你的瀏覽器會開啟 ClawHub 登入頁面。
3. 完成 GitHub 登入後，ClawHub 會建立 API 權杖。
4. 瀏覽器會重新導向回本機回呼。
5. CLI 會將權杖儲存在你的 ClawHub 設定檔中。

如果你的瀏覽器因為防火牆、VPN 或 Proxy 規則而無法連線到本機回呼，請使用無介面權杖流程。

## 無介面登入

在 ClawHub 網頁 UI 建立權杖，然後將它傳給 CLI：

```bash
clawhub login --token clh_...
```

針對伺服器、CI 作業或僅有終端機的環境，請使用此流程。

對於可在其他地方開啟瀏覽器的遠端 shell，請執行：

```bash
clawhub login --device
```

CLI 會列印一次性代碼，並在你於 `https://clawhub.ai/cli/device` 授權時等待。

## 權杖儲存

預設設定路徑：

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`

使用以下方式覆寫路徑：

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## 撤銷

你可以在 ClawHub 網頁 UI 中撤銷 API 權杖。

已撤銷、無效或缺少權杖時會回傳 `401 Unauthorized`。請使用 `clawhub login` 重新登入，或使用 `clawhub login --token` 提供新的權杖。

已刪除、遭封鎖或停用的帳戶無法繼續使用既有 API 權杖。
