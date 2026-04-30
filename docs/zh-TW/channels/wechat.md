---
read_when:
    - 您想要將 OpenClaw 連接到 WeChat 或 Weixin
    - 您正在安裝或排解 openclaw-weixin 頻道 Plugin 的問題
    - 你需要了解外部頻道 Plugin 如何與 Gateway 並行執行
summary: 透過外部 openclaw-weixin Plugin 設定 WeChat 通道
title: WeChat
x-i18n:
    generated_at: "2026-04-30T02:50:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw 透過 Tencent 的外部
`@tencent-weixin/openclaw-weixin` 頻道 Plugin 連接 WeChat。

狀態：外部 Plugin。支援直接聊天與媒體。目前 Plugin 能力中繼資料未宣告支援群組聊天。

## 命名

- **WeChat** 是這些文件中面向使用者的名稱。
- **Weixin** 是 Tencent 套件與 Plugin id 使用的名稱。
- `openclaw-weixin` 是 OpenClaw 頻道 id。
- `@tencent-weixin/openclaw-weixin` 是 npm 套件。

在 CLI 指令與設定路徑中使用 `openclaw-weixin`。

## 運作方式

WeChat 程式碼不在 OpenClaw 核心 repo 中。OpenClaw 提供通用頻道 Plugin 合約，而外部 Plugin 提供 WeChat 專用 runtime：

1. `openclaw plugins install` 安裝 `@tencent-weixin/openclaw-weixin`。
2. Gateway 探索 Plugin manifest 並載入 Plugin entrypoint。
3. Plugin 註冊頻道 id `openclaw-weixin`。
4. `openclaw channels login --channel openclaw-weixin` 啟動 QR 登入。
5. Plugin 將帳號憑證儲存在 OpenClaw 狀態目錄下。
6. Gateway 啟動時，Plugin 會為每個已設定帳號啟動其 Weixin 監控器。
7. 傳入的 WeChat 訊息會透過頻道合約標準化、路由到選取的 OpenClaw agent，並透過 Plugin 輸出路徑送回。

這種分離很重要：OpenClaw 核心應保持頻道無關。WeChat 登入、Tencent iLink API 呼叫、媒體上傳/下載、context tokens，以及帳號監控都由外部 Plugin 擁有。

## 安裝

快速安裝：

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

手動安裝：

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

安裝後重新啟動 Gateway：

```bash
openclaw gateway restart
```

## 登入

在執行 Gateway 的同一台機器上執行 QR 登入：

```bash
openclaw channels login --channel openclaw-weixin
```

使用手機上的 WeChat 掃描 QR code 並確認登入。成功掃描後，Plugin 會在本機儲存帳號 token。

若要新增另一個 WeChat 帳號，請再次執行相同的登入指令。若有多個帳號，請依帳號、頻道與傳送者隔離直接訊息工作階段：

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## 存取控制

直接訊息會使用頻道 Plugin 的一般 OpenClaw pairing 與 allowlist 模型。

核准新的傳送者：

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

完整的存取控制模型請參閱 [Pairing](/zh-TW/channels/pairing)。

## 相容性

Plugin 會在啟動時檢查主機的 OpenClaw 版本。

| Plugin 線 | OpenClaw 版本           | npm tag  |
| ----------- | ----------------------- | -------- |
| `2.x`       | `>=2026.3.22`           | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

如果 Plugin 回報你的 OpenClaw 版本太舊，請更新 OpenClaw，或安裝舊版 Plugin 線：

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar process

WeChat Plugin 在監控 Tencent iLink API 時，可以在 Gateway 旁執行輔助工作。在 issue #68451 中，該輔助路徑暴露了 OpenClaw 通用過時 Gateway 清理中的一個錯誤：子行程可能會嘗試清理父 Gateway 行程，導致在 systemd 等 process manager 下出現重新啟動迴圈。

目前 OpenClaw 啟動清理會排除目前行程及其祖先，因此頻道輔助程式不得終止啟動它的 Gateway。此修正是通用的；它不是核心中的 WeChat 專用路徑。

## 疑難排解

檢查安裝與狀態：

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

如果頻道顯示已安裝但沒有連線，請確認 Plugin 已啟用並重新啟動：

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

如果啟用 WeChat 後 Gateway 反覆重新啟動，請同時更新 OpenClaw 與 Plugin：

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

暫時停用：

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## 相關文件

- 頻道概覽：[Chat Channels](/zh-TW/channels)
- Pairing：[Pairing](/zh-TW/channels/pairing)
- 頻道路由：[Channel Routing](/zh-TW/channels/channel-routing)
- Plugin 架構：[Plugin Architecture](/zh-TW/plugins/architecture)
- 頻道 Plugin SDK：[Channel Plugin SDK](/zh-TW/plugins/sdk-channel-plugins)
- 外部套件：[@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
