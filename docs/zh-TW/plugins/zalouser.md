---
read_when:
    - 你希望 OpenClaw 支援 Zalo Personal（非官方）
    - 您正在設定或開發 zalouser Plugin
summary: Zalo Personal Plugin：QR 登入 + 透過原生 zca-js 傳送訊息（Plugin 安裝 + 通道設定 + 工具）
title: Zalo 個人 Plugin
x-i18n:
    generated_at: "2026-04-30T03:28:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

透過 Plugin 為 OpenClaw 提供 Zalo Personal 支援，使用原生 `zca-js` 自動化一般 Zalo 使用者帳號。

<Warning>
非官方自動化可能導致帳號停權或封鎖。使用風險自負。
</Warning>

## 命名

通道 ID 是 `zalouser`，以明確表示這會自動化一個**個人 Zalo 使用者帳號**（非官方）。我們保留 `zalo` 給未來可能的官方 Zalo API 整合。

## 執行位置

此 Plugin 會在 **Gateway 程序內**執行。

如果你使用遠端 Gateway，請在**執行 Gateway 的機器**上安裝/設定它，然後重新啟動 Gateway。

不需要外部 `zca`/`openzca` CLI 二進位檔。

## 安裝

### 選項 A：從 npm 安裝

```bash
openclaw plugins install @openclaw/zalouser
```

如果 npm 回報 OpenClaw 擁有的套件已被標示為 deprecated，該套件版本來自較舊的外部套件發行線；請使用目前已封裝的 OpenClaw 組建，或在較新的 npm 套件發布前使用本機資料夾路徑。

之後重新啟動 Gateway。

### 選項 B：從本機資料夾安裝（開發）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

之後重新啟動 Gateway。

## 設定

通道設定位於 `channels.zalouser` 之下（不是 `plugins.entries.*`）：

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

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Agent 工具

工具名稱：`zalouser`

動作：`send`、`image`、`link`、`friends`、`groups`、`me`、`status`

通道訊息動作也支援用於訊息反應的 `react`。

## 相關內容

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [社群 Plugin](/zh-TW/plugins/community)
