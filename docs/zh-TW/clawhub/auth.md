---
read_when:
    - 登入 ClawHub
    - 使用 ClawHub 命令列介面
    - 偵錯 401 錯誤
summary: ClawHub 登入、API 權杖、命令列介面登入、權杖儲存與撤銷。
x-i18n:
    generated_at: "2026-07-06T21:46:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# 驗證

ClawHub 使用 GitHub 進行網頁登入。命令列介面使用透過該已登入帳戶建立的 ClawHub API 權杖。

## 網頁登入

使用 GitHub 在 [clawhub.ai](https://clawhub.ai) 登入。

已刪除、遭停權或已停用的帳戶無法完成一般 ClawHub 登入。如果登入後讓你回到登出狀態，你的帳戶可能未處於良好狀態。如果你的帳戶遭停權或停用，且你認為這是錯誤，請使用 [ClawHub 申訴表單](https://appeals.openclaw.ai/)。

## 命令列介面登入

預設的命令列介面登入流程會開啟你的瀏覽器：

```bash
clawhub login
clawhub whoami
```

流程如下：

1. 命令列介面會在 `127.0.0.1` 啟動暫時的回呼伺服器。
2. 你的瀏覽器會開啟 ClawHub 登入頁面。
3. GitHub 登入後，ClawHub 會建立 API 權杖。
4. 瀏覽器會重新導向回本機回呼。
5. 命令列介面會將權杖儲存在你的 ClawHub 設定檔中。

如果你的瀏覽器因防火牆、VPN 或 Proxy 規則而無法連到本機回呼，請使用無頭權杖流程。

## 無頭登入

在 ClawHub 網頁使用者介面中建立權杖，然後將它傳給命令列介面：

```bash
clawhub login --token clh_...
```

伺服器、CI 工作或僅終端機環境請使用此流程。

對於可在其他地方開啟瀏覽器的遠端 Shell，請執行：

```bash
clawhub login --device
```

命令列介面會列印一次性代碼，並在你於 `https://clawhub.ai/cli/device` 授權時等待。

## 權杖儲存

預設設定路徑：

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`

使用以下方式覆寫路徑：

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

使用以下方式列印已儲存的權杖以供 CI 設定：

```bash
clawhub token
```

## 撤銷

你可以在 ClawHub 網頁使用者介面中撤銷 API 權杖。

已撤銷、無效或缺少的權杖會回傳 `401 Unauthorized`。請使用 `clawhub login` 重新登入，或使用 `clawhub login --token` 提供新的權杖。

已刪除、遭停權或已停用的帳戶無法繼續使用現有 API 權杖。如果你的帳戶遭停權或停用，且你認為這是錯誤，請使用 [ClawHub 申訴表單](https://appeals.openclaw.ai/)。
