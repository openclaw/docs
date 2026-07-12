---
read_when:
    - 你想要將 OpenClaw 連接至微信
    - 您正在安裝或疑難排解 openclaw-weixin 頻道外掛
    - 你需要瞭解外部頻道外掛如何與閘道並行運作
summary: 透過外部 openclaw-weixin 外掛設定微信頻道
title: 微信
x-i18n:
    generated_at: "2026-07-11T21:10:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw 透過騰訊的外部頻道外掛
`@tencent-weixin/openclaw-weixin` 連接微信。

狀態：外部外掛，由騰訊微信團隊維護。支援直接聊天和媒體。外掛能力中繼資料未標示支援群組聊天（僅宣告直接聊天）。

## 命名

- **微信** 是這些文件中面向使用者的名稱。
- **微信** 是騰訊套件及外掛 ID 使用的名稱。
- `openclaw-weixin` 是 OpenClaw 頻道 ID（`weixin` 和 `wechat` 可作為別名）。
- `@tencent-weixin/openclaw-weixin` 是 npm 套件。

請在命令列介面命令和設定路徑中使用 `openclaw-weixin`。

## 運作方式

微信程式碼不在 OpenClaw 核心儲存庫中。OpenClaw 提供通用頻道外掛合約，外部外掛則提供微信專用執行階段：

1. `openclaw plugins install` 會安裝 `@tencent-weixin/openclaw-weixin`。
2. 閘道會探索外掛資訊清單並載入外掛進入點。
3. 外掛會註冊頻道 ID `openclaw-weixin`。
4. `openclaw channels login --channel openclaw-weixin` 會啟動 QR 碼登入。
5. 外掛會將帳戶憑證儲存在 OpenClaw 狀態目錄下（預設為 `~/.openclaw`）。
6. 閘道啟動時，外掛會為每個已設定的帳戶啟動微信監控器。
7. 傳入的微信訊息會透過頻道合約正規化、路由至所選的 OpenClaw 代理，並透過外掛的傳出路徑回傳。

這種分離很重要：OpenClaw 核心可維持與頻道無關。微信登入、騰訊 iLink API 呼叫、媒體上傳／下載、內容脈絡權杖及帳戶監控，均由外部外掛負責。

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

在執行閘道的同一台機器上執行 QR 碼登入：

```bash
openclaw channels login --channel openclaw-weixin
```

使用手機上的微信掃描 QR 碼並確認登入。成功掃描後，外掛會將帳戶權杖儲存在本機。

若要新增另一個微信帳戶，請再次執行相同的登入命令。使用多個帳戶時，請依帳戶、頻道及傳送者隔離直接訊息工作階段：

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## 存取控制

直接訊息使用 OpenClaw 對頻道外掛的一般配對與允許清單模型。

核准新的傳送者：

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

如需完整的存取控制模型，請參閱[配對](/zh-TW/channels/pairing)。

## 相容性

外掛會在啟動時檢查主機的 OpenClaw 版本。

| 外掛版本系列 | OpenClaw 版本                                                  | npm 標籤  |
| ------------ | -------------------------------------------------------------- | --------- |
| `2.x`        | `>=2026.5.12`（目前為 2.4.6；早期 2.x 接受 `>=2026.3.22`）     | `latest`  |
| `1.x`        | `>=2026.1.0 <2026.3.22`                                       | `legacy`  |

如果外掛回報您的 OpenClaw 版本過舊，請更新 OpenClaw，或安裝舊版外掛系列：

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## 輔助程序

微信外掛在監控騰訊 iLink API 時，可在閘道旁執行輔助工作。在議題 #68451 中，這條輔助路徑暴露了 OpenClaw 通用過期閘道清理機制中的錯誤：子程序可能嘗試清理父閘道程序，導致在 systemd 等程序管理器下陷入重新啟動迴圈。

目前的 OpenClaw 啟動清理會排除目前程序及其祖先程序，因此頻道輔助程序無法終止啟動它的閘道。此修正具有通用性，並非核心中的微信專用路徑。

## 疑難排解

檢查安裝和狀態：

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

如果頻道顯示為已安裝但無法連線，請確認外掛已啟用，然後重新啟動：

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

如果啟用微信後閘道反覆重新啟動，請同時更新 OpenClaw 和外掛：

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

如果啟動時回報已安裝的外掛套件 `requires compiled runtime
output for TypeScript entry`，表示發布的 npm 套件未包含 OpenClaw 所需的已編譯 JavaScript 執行階段檔案。請在外掛發布者推出修正套件後更新／重新安裝，或暫時停用／解除安裝該外掛。

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
