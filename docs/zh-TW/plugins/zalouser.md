---
read_when:
    - 您希望 OpenClaw 支援 Zalo Personal（非官方）
    - 你正在設定或開發 zalouser 外掛
summary: Zalo Personal 外掛：透過原生 zca-js 進行 QR 碼登入與傳訊（外掛安裝 + 頻道設定 + 工具）
title: Zalo Personal 外掛
x-i18n:
    generated_at: "2026-07-11T21:40:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

透過使用原生 `zca-js` 的外掛，讓 OpenClaw 支援 Zalo Personal，以自動操作一般 Zalo 使用者帳號。不需要外部 `zca`/`openzca` 命令列介面二進位檔。

<Warning>
非官方自動化可能導致帳號遭停權或封鎖。使用風險請自行承擔。
</Warning>

## 命名

頻道 ID 為 `zalouser`，以明確表示這會自動操作**個人 Zalo 使用者帳號**（非官方）。另一個 `zalo` 頻道 ID 則是官方內建的 Zalo Bot/網路鉤子整合，請參閱 [Zalo](/zh-TW/channels/zalo)。

## 執行位置

此外掛在**閘道程序內**執行。若使用遠端閘道，請在該主機上安裝並設定此外掛，然後重新啟動閘道。

## 安裝

### 從 npm 安裝

```bash
openclaw plugins install @openclaw/zalouser
```

使用不含版本的套件名稱即可跟隨目前的官方發行標籤；只有在需要可重現的安裝時，才固定使用確切版本。完成後請重新啟動閘道。

### 從本機資料夾安裝（開發）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

完成後請重新啟動閘道。

## 設定

頻道設定位於 `channels.zalouser`（而非 `plugins.entries.*`）：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

如需了解私訊/群組存取控制、多帳號設定、環境變數及疑難排解，請參閱 [Zalo Personal 頻道設定](/zh-TW/channels/zalouser)。

## 命令列介面

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## 代理程式工具

工具名稱：`zalouser`

操作：`send`、`image`、`link`、`friends`、`groups`、`me`、`status`

頻道訊息操作（非代理程式工具）也支援使用 `react` 新增訊息表情回應。

## 相關內容

- [Zalo Personal 頻道設定](/zh-TW/channels/zalouser)
- [Zalo（官方 Bot/網路鉤子頻道）](/zh-TW/channels/zalo)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [ClawHub](/clawhub)
