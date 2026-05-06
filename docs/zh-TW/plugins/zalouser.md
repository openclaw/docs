---
read_when:
    - 您希望 OpenClaw 支援 Zalo Personal（非官方）
    - 你正在設定或開發 zalouser Plugin
summary: Zalo Personal Plugin：透過原生 zca-js 進行 QR 登入與訊息傳送（Plugin 安裝 + 頻道設定 + 工具）
title: Zalo 個人 Plugin
x-i18n:
    generated_at: "2026-05-06T18:00:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

透過 Plugin 為 OpenClaw 提供 Zalo Personal 支援，使用原生 `zca-js` 自動化一般 Zalo 使用者帳號。

<Warning>
非官方自動化可能導致帳號停權或封鎖。使用風險自行承擔。
</Warning>

## 命名

Channel id 是 `zalouser`，明確表示這會自動化**個人 Zalo 使用者帳號**（非官方）。我們保留 `zalo` 給未來可能的官方 Zalo API 整合使用。

## 執行位置

此 Plugin 會在 **Gateway 程序內**執行。

如果你使用遠端 Gateway，請在**執行 Gateway 的機器**上安裝／設定，然後重新啟動 Gateway。

不需要外部 `zca`/`openzca` CLI 二進位檔。

## 安裝

### 選項 A：從 npm 安裝

```bash
openclaw plugins install @openclaw/zalouser
```

使用裸套件名稱可跟隨目前的官方發布標籤。只有在需要可重現安裝時，才固定精確版本。

之後重新啟動 Gateway。

### 選項 B：從本機資料夾安裝（開發）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

之後重新啟動 Gateway。

## 設定

Channel 設定位於 `channels.zalouser`（不是 `plugins.entries.*`）之下：

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

Channel 訊息動作也支援 `react` 以進行訊息反應。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [社群 Plugin](/zh-TW/plugins/community)
