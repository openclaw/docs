---
read_when:
    - 稽核為何通道入口重構新增了過多程式碼
    - 將路由、命令、事件、啟用或存取群組政策從隨附 Plugin 移至核心
    - 審查通道入口輔助程式是否確實刪除隨附 Plugin 程式碼
sidebarTitle: Ingress core deletion
summary: 刪除優先計畫，用於將重複的通道傳入黏合邏輯移入核心。
title: 入口核心刪除計畫
x-i18n:
    generated_at: "2026-05-10T19:49:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# 傳入核心刪減計畫

傳入重構若增加數千行淨程式碼，就不是健康的狀態。只有當內建 Plugin 生產程式碼變少，且舊版第三方 SDK 相容性被隔離到 SDK/核心 shim 時，核心集中化才算成立。

理想的執行期形態：

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

內建 Plugin 不應將傳入轉譯回本機 `AccessResult`、`GroupAccessDecision`、`CommandAuthDecision`、`DmCommandAccess` 或 `{ allowed, reasonCode }` 形態，除非該型別是公開的 Plugin API。

## 預算

以與 `origin/main` 的 PR 合併基底為準量測，包含未追蹤檔案。

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

只刪除註解不算清理。上一輪預算盤點過於寬鬆，因為它包含還原的 QQBot 說明註解；本文只追蹤可執行程式碼、文件與測試程式碼的移動。

每一波清理後重新量測：

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## 診斷

第一輪加入了共享傳入核心，接著又在旁邊留下太多 Plugin 本機授權邏輯：

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

這重複了模型。核心生產程式碼增加約 3,376 行，而內建 Plugin 生產程式碼少了 1,240 行。這比第一輪好，但仍未進入最低預算內。修正方向仍然以刪除優先：

- 刪除只重新命名傳入欄位的 Plugin DTO
- 刪除只斷言包裝器形態的測試
- 只有在同一個修補同時刪除內建 Plugin 程式碼時，才加入核心 helper
- 舊版 SDK 相容性只留在 SDK/核心 shim 中
- 包裝器刪除暴露穩定形態後，重新打包核心

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

此分支尚未進入最低預算。其餘與審查相關的工作，應先刪除重複的授權流程、turn 腳手架或包裝器測試，再加入另一個核心抽象。

## 目前程式碼檢視

健康的核心接縫已存在於 `src/channels/message-access/runtime.ts`：它負責身分 adapter、有效允許清單、配對儲存讀取、路由描述器、命令/事件預設、存取群組，以及最終解析出的 `ResolvedChannelMessageIngress` 投影。

剩餘成長主要是疊在該接縫上的 Plugin 膠水：

- `extensions/telegram/src/ingress.ts` 將核心決策包裝成 Telegram 專用的命令/事件 helper，然後呼叫端仍傳入預先計算好的正規化允許清單與擁有者清單。
- `extensions/discord/src/monitor/dm-command-auth.ts`、`extensions/feishu/src/policy.ts`、`extensions/googlechat/src/monitor-access.ts` 與 `extensions/matrix/src/matrix/monitor/access-state.ts` 仍在傳入旁邊保留本機政策 DTO 或舊版決策名稱。
- `extensions/signal/src/monitor/access-policy.ts` 正確地將 Signal 身分正規化與配對回覆留在本機，但仍有一個應該摺疊成直接消費傳入的包裝器接縫。
- `extensions/nextcloud-talk/src/inbound.ts`、`extensions/irc/src/inbound.ts`、`extensions/qa-channel/src/inbound.ts`、`extensions/zalo/src/monitor.ts` 與 `extensions/zalouser/src/monitor.ts` 仍重複路由/envelope/turn 組裝，可移到傳入核心之外的共享 turn helper。

結論：只有在同一個修補中刪除這些 Plugin 包裝層時，將更多程式碼移入核心才有用。加入另一個抽象卻保留包裝器回傳，會重複同樣錯誤。

## 邊界

核心負責通用政策：

- 允許清單正規化與比對
- 存取群組展開與診斷
- 配對儲存 DM 允許清單讀取
- 路由、傳送者、命令、事件與啟用閘門
- 准入對應：派送、丟棄、略過、觀察、配對
- 已遮蔽狀態、決策、診斷與 SDK 相容性投影
- 可重用的通用描述器，用於身分、路由、命令、事件、啟用與結果

Plugin 負責傳輸事實與副作用：

- webhook/socket/request 真實性
- 平台身分擷取與 API 查詢
- 頻道專用政策預設
- 配對挑戰傳送、回覆、確認、反應、輸入中、媒體、歷史、設定、doctor、狀態、日誌與面向使用者的文案

核心必須保持與頻道無關：`src/channels/message-access` 中不得有 Discord、Slack、Telegram、Matrix、room、guild、space、API client 或 Plugin 專用預設。

## 驗收規則

每個新的核心 helper 都必須立即刪除內建 Plugin 生產程式碼。

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

遇到以下情況時停止並重新設計：

- Plugin 生產 LOC 增加
- 測試成長快於生產程式碼縮減
- 內建熱路徑回傳只重新命名 `ResolvedChannelMessageIngress` 的 DTO
- 核心 helper 需要頻道 id、平台物件、API client 或頻道專用預設

## 工作套件

1. 凍結預算。
   將 LOC 放入 PR，保持 deprecated-ingress lint 綠燈，並在清理 commit 中包含前/後 LOC。

2. 刪除薄 DTO 接縫。
   以直接讀取 `ResolvedChannelMessageIngress`、`senderAccess`、`commandAccess`、`routeAccess` 或 `ingress` 取代 Plugin 本機包裝器回傳。從 QQBot、Telegram、Slack、Discord、Signal、Feishu、Matrix、iMessage 與 Tlon 開始。刪除包裝器形態測試；保留行為測試。

3. 只在伴隨刪除時加入結果分類。
   通用分類器可以公開 `dispatch`、`pairing-required`、`skip-activation`、`drop-command`、`drop-route`、`drop-sender` 與 `drop-ingress`。它必須從決策圖推導，而不是從原因字串推導，且同一個修補至少要遷移三個 Plugin。

4. 只在伴隨刪除時加入路由描述器 builder。
   只有在能立即縮減路由密集 Plugin 時，才可接受通用路由目標與路由傳送者 helper：Google Chat、IRC、Microsoft Teams、Nextcloud Talk、Mattermost、Slack、Zalo 與 Zalo Personal。

5. 只在伴隨刪除時加入命令/事件預設。
   集中化文字命令、原生命令、callback 與 origin-subject 形態。命令消費者在未執行命令閘門時，必須預設為未授權；事件不得開始配對。

6. 只在移除樣板時加入身分預設。
   當原始值只進入 adapter 輸入，且已遮蔽狀態保留不透明 id/計數時，允許 stable-id、stable-id-plus-aliases、phone/e164 與 multi-identifier helper。

7. 共享已授權 turn 組裝。
   在傳入核心之外，移除 QA Channel、IRC、Nextcloud Talk、Zalo 與 Zalo Personal 中重複的路由/envelope/context/reply 腳手架。核心可負責路由/session/envelope/dispatch 排序；Plugin 保留傳送與頻道專用 context。

8. 隔離相容性。
   已棄用的 SDK helper 保持原始碼相容，但內建熱路徑不得匯入已棄用的傳入或命令授權 facade。相容性測試應使用假的第三方 Plugin，而不是內建 Plugin 內部實作。

9. 重新打包核心。
   包裝器刪除後，摺疊單次使用模組、移除未使用 export、將相容性投影移出熱路徑，並保留針對身分、路由、命令/事件、啟用、存取群組與相容性 shim 的聚焦測試。

## 刪除波次

依序執行。每一波都必須降低內建生產 LOC。

1. 包裝器摺疊，預期 Plugin delta：-400 到 -600。
   以直接讀取 `ResolvedChannelMessageIngress` 取代 Plugin 本機 `resolveXAccess`、`resolveXCommandAccess` 與 `accessFromIngress` 結果型別。首要目標：Discord DM 命令授權、Feishu 政策、Matrix 存取狀態、Telegram 傳入、Signal 存取政策、QQBot SDK adapter。

2. 共享結果 helper，預期 Plugin delta：-200 到 -350。
   只有在它能刪除至少三個 Plugin 中重複的 `shouldBlockControlCommand`、配對、啟用略過、路由封鎖與傳送者封鎖階梯時，才加入一個通用分類器。

3. 路由描述器 builder，預期 Plugin delta：-200 到 -350。
   將重複的路由目標與路由傳送者描述器組裝移入核心 helper。首要目標：Google Chat、IRC、Microsoft Teams、Nextcloud Talk、Mattermost、Slack、Zalo、Zalo Personal。

4. Turn 組裝共享，預期 Plugin delta：-250 到 -450。
   對簡單 inbound Plugin 使用共用的路由/session/envelope/dispatch 排序。首要目標：QA Channel、IRC、Nextcloud Talk、Zalo、Zalo Personal。

5. 核心重新打包，預期核心 delta：-300 到 -700。
   Plugin 直接消費執行期投影後，刪除單次使用模組，將小檔案合併回 `runtime.ts` 或聚焦的同層檔案，並讓 SDK 相容性檔案與內建熱路徑保持分離。

6. 測試修剪，預期測試 delta：-300 到 -600。
   刪除只斷言已移除包裝器形態的測試。保留命令拒絕、群組 fallback、origin-subject 比對、啟用略過、存取群組、配對與遮蔽的行為測試。

這些波次後預期的最低落地形態：

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## 請勿移動

不要移動平台設定預設值、設定體驗、doctor/fix 文案、API 查詢、
Slack 擁有者存在檢查、Matrix 別名/驗證處理、Telegram
callback 解析、命令語法解析、原生命令註冊、反應
payload 解析、配對回覆、命令回覆、確認回應、輸入狀態、媒體、歷史記錄，
或日誌。

## 驗證

目標本機迴圈：

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

一旦 LOC 趨勢進入預算內，使用 Testbox 取得廣泛變更閘門/完整套件證明。

每個工作項目記錄：

- 依類別列出的變更前/後 LOC
- 已刪除的 Plugin wrapper
- 新增的核心輔助工具 LOC，如有
- 已執行的目標測試
- 剩餘熱點清單

## 退出條件

- bundled 生產環境匯入不使用已棄用的 channel-access 或 command-auth facade
- 相容性程式碼隔離在 SDK/核心介面
- bundled Plugins 直接使用 ingress projection 或 generic outcome
- Plugin 生產環境 LOC 相對於 `origin/main` 至少淨減少 1,500
- 核心生產環境 LOC <= +1,500，或任何超出部分已抵消，且總量維持
  <= +2,000
- 代表性測試涵蓋修訂遮罩、路由、命令/事件、啟用、
  access-group，以及通道特定 fallback 行為
