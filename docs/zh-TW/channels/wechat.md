---
read_when:
    - 您想將 OpenClaw 連接到微信
    - 你正在安裝或疑難排解 openclaw-weixin 頻道外掛
    - 你需要了解外部通道外掛如何與閘道並行執行
summary: 透過外部 openclaw-weixin 外掛設定微信通道
title: 微信
x-i18n:
    generated_at: "2026-07-05T11:05:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw 透過騰訊的外部
`@tencent-weixin/openclaw-weixin` 頻道外掛連接到 WeChat。

狀態：外部外掛，由騰訊微信團隊維護。支援直接聊天與
媒體。外掛能力中繼資料未宣告支援群組聊天
（它只宣告直接聊天）。

## 命名

- **WeChat** 是這些文件中的使用者可見名稱。
- **微信** 是騰訊套件與外掛 id 使用的名稱。
- `openclaw-weixin` 是 OpenClaw 頻道 id（`weixin` 和 `wechat` 可作為別名）。
- `@tencent-weixin/openclaw-weixin` 是 npm 套件。

請在命令列介面命令與設定路徑中使用 `openclaw-weixin`。

## 運作方式

WeChat 程式碼不在 OpenClaw 核心 repo 中。OpenClaw 提供
通用頻道外掛合約，而外部外掛提供
WeChat 專用執行階段：

1. `openclaw plugins install` 會安裝 `@tencent-weixin/openclaw-weixin`。
2. 閘道會探索外掛 manifest 並載入外掛進入點。
3. 外掛會註冊頻道 id `openclaw-weixin`。
4. `openclaw channels login --channel openclaw-weixin` 會啟動 QR 登入。
5. 外掛會將帳號憑證儲存在 OpenClaw 狀態目錄下
   （預設為 `~/.openclaw`）。
6. 閘道啟動時，外掛會為每個已設定帳號啟動其微信監控程式。
7. 傳入的 WeChat 訊息會透過頻道合約標準化，路由到
   所選的 OpenClaw agent，並透過外掛的傳出路徑送回。

這種分離很重要：OpenClaw 核心保持與頻道無關。WeChat 登入、
騰訊 iLink API 呼叫、媒體上傳/下載、context tokens，以及帳號
監控都由外部外掛負責。

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

安裝後重新啟動閘道：

```bash
openclaw gateway restart
```

## 登入

在執行閘道的同一台機器上執行 QR 登入：

```bash
openclaw channels login --channel openclaw-weixin
```

使用手機上的 WeChat 掃描 QR code 並確認登入。掃描成功後，外掛會在本機儲存
帳號 token。

若要新增另一個 WeChat 帳號，請再次執行相同登入命令。若有多個
帳號，請依帳號、頻道與傳送者隔離直接訊息工作階段：

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## 存取控制

直接訊息會使用頻道
外掛的一般 OpenClaw 配對與允許清單模型。

核准新的傳送者：

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

完整的存取控制模型請參閱[配對](/zh-TW/channels/pairing)。

## 相容性

外掛會在啟動時檢查主機 OpenClaw 版本。

| 外掛系列 | OpenClaw 版本                                                  | npm 標籤 |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12`（目前 2.4.6；早期 2.x 接受 `>=2026.3.22`） | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

如果外掛回報你的 OpenClaw 版本太舊，請更新
OpenClaw，或安裝舊版外掛系列：

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar 處理程序

WeChat 外掛在監控
騰訊 iLink API 時，可以在閘道旁執行輔助工作。在 issue #68451 中，該輔助路徑暴露了 OpenClaw
通用過期閘道清理中的一個 bug：子處理程序可能嘗試清理父
閘道處理程序，導致在 systemd 等 process managers 下發生重新啟動迴圈。

目前的 OpenClaw 啟動清理會排除目前處理程序及其祖先，
因此頻道輔助程式無法殺掉啟動它的閘道。此修正是
通用修正；它不是核心中的 WeChat 專用路徑。

## 疑難排解

檢查安裝與狀態：

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

如果頻道顯示為已安裝但無法連線，請確認外掛已
啟用並重新啟動：

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

如果啟用 WeChat 後閘道反覆重新啟動，請同時更新 OpenClaw 和
外掛：

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

如果啟動時回報已安裝的外掛套件 `requires compiled runtime
output for TypeScript entry`，表示 npm 套件發布時缺少 OpenClaw 所需的已編譯
JavaScript 執行階段檔案。請在外掛
發布者推出已修正的套件後更新/重新安裝，或暫時停用/解除安裝外掛。

暫時停用：

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## 相關文件

- 頻道概覽：[聊天頻道](/zh-TW/channels)
- 配對：[配對](/zh-TW/channels/pairing)
- 頻道路由：[頻道路由](/zh-TW/channels/channel-routing)
- 外掛架構：[外掛架構](/zh-TW/plugins/architecture)
- 頻道外掛 SDK：[頻道外掛 SDK](/zh-TW/plugins/sdk-channel-plugins)
- 外部套件：[@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
