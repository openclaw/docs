---
read_when:
    - 審查通道入口重構為何新增了過多程式碼
    - 將路由、命令、事件、啟用或存取群組政策從隨附 Plugin 移入核心
    - 檢查通道入口輔助程式是否確實刪除隨附的 Plugin 程式碼
sidebarTitle: Ingress core deletion
summary: 將重複的通道入口銜接邏輯移入核心的刪除優先計畫。
title: 入口核心刪除計畫
x-i18n:
    generated_at: "2026-05-12T00:59:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Ingress 核心刪除計畫

當 ingress 重構增加數千行淨新增時，狀態並不健康。只有在內建 Plugin 生產程式碼變得更小，且舊版第三方 SDK 相容性被隔離到 SDK/核心 shim 時，核心集中化才算成立。

期望的執行階段形狀：

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

內建 Plugins 不應將 ingress 轉回本機 `AccessResult`、`GroupAccessDecision`、`CommandAuthDecision`、`DmCommandAccess` 或 `{ allowed, reasonCode }` 形狀，除非該型別是公開的 Plugin API。

## 預算

以與 `origin/main` 的 PR merge-base 為基準衡量，包含未追蹤檔案。

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

最低剩餘清理量：

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

只刪除註解不算清理。前一次預算處理過於寬鬆，因為納入了還原的 QQBot 說明註解；本文件只追蹤可執行程式碼、文件與測試程式碼的移動。

每一波清理後重新衡量：

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## 診斷

第一輪先加入共享 ingress kernel，接著在其旁邊留下過多 Plugin 本機授權邏輯：

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

這重複了模型。核心生產程式碼約增加 3,376 行，而內建 Plugin 生產程式碼減少 1,240 行。這比第一輪好，但尚未進入最低預算範圍。修正仍應以刪除優先：

- 刪除只重新命名 ingress 欄位的 Plugin DTO
- 刪除只斷言包裝器形狀的測試
- 只有在同一個修補同時刪除內建 Plugin 程式碼時，才新增核心輔助工具
- 將舊版 SDK 相容性只保留在 SDK/核心 shim
- 包裝器刪除暴露穩定形狀後，重新打包核心

## 熱點

仍需要縮減的正向內建生產檔案：

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

此分支尚未進入最低預算範圍。剩餘與審查相關的工作，應先刪除重複的授權流程、回合鷹架或包裝器測試，再新增另一個核心抽象。

## 目前程式碼閱讀

健康的核心接縫已存在於 `src/channels/message-access/runtime.ts`：它擁有身分配接器、有效 allowlists、pairing-store 讀取、route 描述子、command/event presets、存取群組，以及最終解析出的 `ResolvedChannelMessageIngress` 投影。

剩餘成長主要是疊在該接縫上的 Plugin glue：

- `extensions/telegram/src/ingress.ts` 將核心決策包裝成 Telegram 專用 command/event 輔助工具，接著呼叫端仍傳入預先計算的正規化 allowlists 與 owner 清單。
- `extensions/discord/src/monitor/dm-command-auth.ts`、`extensions/feishu/src/policy.ts`、`extensions/googlechat/src/monitor-access.ts` 與 `extensions/matrix/src/matrix/monitor/access-state.ts` 仍在 ingress 旁保留本機 policy DTO 或 legacy decision 名稱。
- `extensions/signal/src/monitor/access-policy.ts` 正確地將 Signal 身分正規化與 pairing 回覆保留在本機，但仍有一層包裝器接縫，應摺疊為直接消費 ingress。
- `extensions/nextcloud-talk/src/inbound.ts`、`extensions/irc/src/inbound.ts`、`extensions/qa-channel/src/inbound.ts`、`extensions/zalo/src/monitor.ts` 與 `extensions/zalouser/src/monitor.ts` 仍重複 route/envelope/turn 組裝，可移到 ingress kernel 外的共享 turn helpers。

結論：只有在同一個修補中刪除這些 Plugin 包裝器層時，將更多程式碼移入核心才有用。新增另一個抽象但保留包裝器回傳，會重複同樣錯誤。

## 邊界

核心擁有通用政策：

- allowlist 正規化與比對
- 存取群組展開與診斷
- pairing-store DM allowlist 讀取
- route、sender、command、event 與 activation gates
- admission 映射：dispatch、drop、skip、observe、pairing
- 已遮蔽狀態、決策、診斷與 SDK 相容性投影
- 可重用的通用描述子，用於身分、route、command、event、activation 與 outcomes

Plugins 擁有傳輸事實與副作用：

- webhook/socket/request 真實性
- 平台身分擷取與 API 查詢
- channel 專用政策預設值
- pairing 挑戰傳送、回覆、acks、reactions、typing、media、history、setup、doctor、status、logs 與面向使用者的文案

核心必須保持 channel-agnostic：`src/channels/message-access` 中不得有 Discord、Slack、Telegram、Matrix、room、guild、space、API client 或 Plugin 專用預設值。

## 驗收規則

每個新的核心輔助工具都必須立即刪除內建 Plugin 生產程式碼。

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

如果發生以下情況，請停止並重新設計：

- Plugin 生產 LOC 增加
- 測試成長比生產程式碼縮減更快
- 內建 hot path 回傳只重新命名 `ResolvedChannelMessageIngress` 的 DTO
- 核心輔助工具需要 channel id、平台物件、API client 或 channel 專用預設值

## 工作套件

1. 凍結預算。
   將 LOC 放入 PR，保持 deprecated-ingress lint 綠燈，並在清理提交中包含前後 LOC。

2. 刪除薄 DTO 接縫。
   將 Plugin 本機包裝器回傳替換為直接使用 `ResolvedChannelMessageIngress`、`senderAccess`、`commandAccess`、`routeAccess` 或 `ingress`。從 QQBot、Telegram、Slack、Discord、Signal、Feishu、Matrix、iMessage 與 Tlon 開始。刪除包裝器形狀測試；保留行為測試。

3. 只有搭配刪除時才新增 outcome classification。
   通用 classifier 可暴露 `dispatch`、`pairing-required`、`skip-activation`、`drop-command`、`drop-route`、`drop-sender` 與 `drop-ingress`。它必須從決策圖推導，而不是從 reason strings 推導，並在同一個修補中遷移至少三個 Plugins。

4. 只有搭配刪除時才新增 route 描述子建構器。
   只有在能立即縮減 route-heavy Plugins 時，通用 route target 與 route sender 輔助工具才可接受：Google Chat、IRC、Microsoft Teams、Nextcloud Talk、Mattermost、Slack、Zalo 與 Zalo Personal。

5. 只有搭配刪除時才新增 command/event presets。
   集中化 text-command、native-command、callback 與 origin-subject 形狀。當沒有執行 command gate 時，command consumers 必須預設為未授權；events 不得啟動 pairing。

6. 只在能移除樣板時才新增 identity presets。
   stable-id、stable-id-plus-aliases、phone/e164 與 multi-identifier 輔助工具可在 raw values 只進入 adapter input，且已遮蔽狀態保留 opaque ids/counts 時使用。

7. 共享已授權 turn 組裝。
   在 ingress kernel 外，從 QA Channel、IRC、Nextcloud Talk、Zalo 與 Zalo Personal 移除重複的 route/envelope/context/reply 鷹架。核心可擁有 route/session/envelope/dispatch sequencing；Plugins 保留 delivery 與 channel 專用 context。

8. 隔離相容性。
   Deprecated SDK helpers 保持 source-compatible，但內建 hot paths 不得匯入 deprecated ingress 或 command-auth facades。相容性測試應使用假的第三方 Plugins，而非內建 Plugin internals。

9. 重新打包核心。
   包裝器刪除後，摺疊一次性模組、移除未使用 exports、將相容性投影移出 hot paths，並保留聚焦於身分、route、command/event、activation、存取群組與相容性 shims 的測試。

## 刪除波次

依序執行。每一波都必須降低內建生產 LOC。

1. 包裝器摺疊，預期 Plugin delta：-400 到 -600。
   將 Plugin 本機 `resolveXAccess`、`resolveXCommandAccess` 與 `accessFromIngress` 結果型別替換為直接讀取 `ResolvedChannelMessageIngress`。第一批目標：Discord DM command auth、Feishu policy、Matrix access state、Telegram ingress、Signal access policy、QQBot SDK adapter。

2. 共享 outcome helpers，預期 Plugin delta：-200 到 -350。
   只有在能跨至少三個 Plugins 刪除重複的 `shouldBlockControlCommand`、pairing、activation skip、route block 與 sender block ladders 時，才新增一個通用 classifier。

3. Route 描述子建構器，預期 Plugin delta：-200 到 -350。
   將重複的 route target 與 route sender 描述子組裝移入核心輔助工具。第一批目標：Google Chat、IRC、Microsoft Teams、Nextcloud Talk、Mattermost、Slack、Zalo、Zalo Personal。

4. Turn 組裝共享，預期 Plugin delta：-250 到 -450。
   對簡單 inbound Plugins 使用共通 route/session/envelope/dispatch sequencing。第一批目標：QA Channel、IRC、Nextcloud Talk、Zalo、Zalo Personal。

5. 核心重新打包，預期核心 delta：-300 到 -700。
   Plugins 直接消費 runtime projections 後，刪除一次性模組、將小檔案合併回 `runtime.ts` 或聚焦的 sibling，並讓 SDK 相容性檔案與內建 hot paths 分離。

6. 測試修剪，預期測試 delta：-300 到 -600。
   刪除只斷言已移除包裝器形狀的測試。保留 command denial、group fallback、origin-subject matching、activation skip、存取群組、pairing 與 redaction 的行為測試。

這些波次後的預期最低落地形狀：

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## 不要移動

不要移動平台設定預設值、設定 UX、doctor/fix 文案、API 查找、
Slack 擁有者在線狀態檢查、Matrix 別名/驗證處理、Telegram
回呼解析、命令語法解析、原生命令註冊、反應
payload 解析、配對回覆、命令回覆、確認回覆、輸入狀態、媒體、歷史記錄
或日誌。

## 驗證

目標式本機循環：

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

一旦 LOC 趨勢在預算內，請使用 Testbox 提供廣泛變更 gates/完整套件證明。

每個工作套件記錄：

- 依類別區分的前後 LOC
- 已刪除的 Plugin 包裝器
- 新核心輔助程式 LOC（如有）
- 已執行的目標式測試
- 剩餘熱點清單

## 退出標準

- bundled production 匯入沒有已棄用的 channel-access 或 command-auth facade
- 相容性程式碼隔離於 SDK/核心接縫
- bundled plugins 直接使用 ingress projections 或通用 outcomes
- Plugin production LOC 相對於 `origin/main` 至少淨減少 1,500
- core production LOC 為 `<= +1,500`，或任何超出部分已補足，同時總量
  維持 `<= +2,000`
- 代表性測試涵蓋修訂、route、command/event、activation、
  access-group，以及 channel-specific fallback 行為
