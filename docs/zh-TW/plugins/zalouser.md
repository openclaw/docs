---
read_when:
    - 你想要在 OpenClaw 中支援 Zalo Personal（非官方）
    - 你正在設定或開發 zalouser 外掛
summary: Zalo Personal 外掛：QR 登入 + 透過原生 zca-js 傳送訊息（外掛安裝 + 頻道設定 + 工具）
title: Zalo Personal 外掛
x-i18n:
    generated_at: "2026-07-05T11:35:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

透過使用原生 `zca-js` 自動化一般 Zalo 使用者帳號的外掛，為 OpenClaw 提供 Zalo Personal 支援。不需要外部 `zca`/`openzca` 命令列介面二進位檔。

<Warning>
非官方自動化可能導致帳號停權或封鎖。請自行承擔風險。
</Warning>

## 命名

頻道 ID 是 `zalouser`，以明確表示這會自動化**個人 Zalo 使用者帳號**（非官方）。獨立的 `zalo` 頻道 ID 是官方、內建的 Zalo Bot/網路鉤子整合 - 請參閱 [Zalo](/zh-TW/channels/zalo)。

## 執行位置

此外掛會在**閘道程序內**執行。若是遠端閘道，請在該主機上安裝/設定，然後重新啟動閘道。

## 安裝

### 從 npm

```bash
openclaw plugins install @openclaw/zalouser
```

使用裸套件可跟隨目前的官方發行標籤；只有在需要可重現安裝時，才固定精確版本。之後請重新啟動閘道。

### 從本機資料夾（開發）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

之後請重新啟動閘道。

## 設定

頻道設定位於 `channels.zalouser` 下（不是 `plugins.entries.*`）：

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

請參閱 [Zalo Personal 頻道設定](/zh-TW/channels/zalouser)，了解 DM/群組存取控制、多帳號設定、環境變數與疑難排解。

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

## 代理工具

工具名稱：`zalouser`

動作：`send`、`image`、`link`、`friends`、`groups`、`me`、`status`

頻道訊息動作（不是代理工具）也支援用於訊息反應的 `react`。

## 相關

- [Zalo Personal 頻道設定](/zh-TW/channels/zalouser)
- [Zalo（官方 Bot/網路鉤子頻道）](/zh-TW/channels/zalo)
- [建置外掛](/zh-TW/plugins/building-plugins)
- [ClawHub](/clawhub)
