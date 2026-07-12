---
read_when:
    - 透過區域網路、tailnet、Tailscale Serve、Funnel 或反向代理公開閘道
    - 在允許真實訊息使用者使用前審查部署狀態
    - 回復有風險的遠端存取或私訊設定
sidebarTitle: Exposure runbook
summary: 將 OpenClaw 閘道暴露至 local loopback 以外範圍前的預檢與復原檢查清單
title: 閘道公開操作手冊
x-i18n:
    generated_at: "2026-07-11T21:23:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
只有在你能說明誰可以連線、他們如何通過驗證、他們可以觸發哪些代理程式，以及這些代理程式可以使用哪些工具之後，才可公開閘道。如有疑慮，請恢復為僅限 local loopback 存取，並重新執行稽核。
</Warning>

本操作手冊將較廣泛的[安全性](/zh-TW/gateway/security)指南轉化為遠端存取與訊息傳遞暴露面的管理者檢查清單。

## 選擇暴露模式

優先採用能滿足工作流程的最嚴格限制模式。

| 模式                       | 建議使用情境                                    | 必要控制措施                                                                                                                  |
| -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Loopback + SSH 通道        | 個人使用、管理存取、偵錯                        | 保持 `gateway.bind: "loopback"`，並以通道連接 `127.0.0.1:18789`                                                               |
| Loopback + Tailscale Serve | 透過個人 tailnet 存取控制介面/WebSocket         | 保持閘道僅限 loopback；Tailscale 身分標頭僅驗證控制介面的 WebSocket 暴露面，不驗證其他驗證路徑                                |
| Tailnet/LAN 繫結           | 使用已知裝置的專用私人網路                      | 閘道驗證、防火牆允許清單、不得公開連接埠轉送                                                                                  |
| 受信任的反向代理           | 在閘道前方使用組織的 SSO/OIDC                   | `trusted-proxy` 驗證、嚴格的 `trustedProxies`、標頭覆寫/移除規則、明確允許的使用者                                            |
| 公開網際網路               | 少見的高風險部署                                | 可感知身分的代理、TLS、速率限制、嚴格允許清單、將非主要工作階段置於沙箱中                                                    |

避免將連接埠直接公開轉送至閘道。如果必須提供公開存取，請在其前方放置可感知身分的代理，並讓該代理成為前往閘道的唯一網路路徑。

## 變更前盤點

變更繫結、代理、Tailscale 或頻道原則前，請記錄以下項目：

- 閘道主機、作業系統使用者及狀態目錄（預設為 `~/.openclaw`）。
- 閘道 URL 與繫結模式（`gateway.bind`；預設連接埠為 `18789`）。
- 驗證模式、權杖/密碼來源，或受信任代理的身分來源。
- 每個已啟用的頻道，以及其是否接受私訊、群組訊息或網路鉤子。
- 非本機傳送者可觸及的代理程式。
- 每個可觸及代理程式的工具設定檔、沙箱模式及提高權限工具原則。
- 這些代理程式可用的外部憑證。
- `~/.openclaw/openclaw.json` 與憑證的備份位置。

如果有超過一人可以傳訊息給機器人，請將其視為共用的委派工具權限，而非每位使用者各自隔離的主機。

## 基準檢查

開放存取前請執行：

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

請先解決嚴重發現。只有在部署時刻意接受並已記錄的情況下，才可接受警告。請參閱[安全性稽核檢查](/zh-TW/gateway/security/audit-checks)，以瞭解每個 `checkId` 的含義及其修正鍵。

進行遠端命令列介面驗證時，請明確傳入憑證：

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

請勿假設本機設定中的憑證適用於明確指定的遠端 URL。

## 最低安全基準

請以此設定形式作為公開部署的起點：

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

每次只放寬一項控制措施：先為特定頻道新增允許清單，再啟用可寫入工具；或先啟用反向代理，再接受遠端控制介面流量。

`tools.exec.security: "deny"` 會封鎖所有 exec 呼叫，包括無害的診斷。如果需要診斷或低風險命令，只有在選定符合威脅模型的特定傳送者、代理程式、命令及核准模式後，才可放寬此設定。

## 私訊與群組暴露面

訊息傳遞頻道是不受信任的輸入介面。允許私訊或群組訊息前：

- 優先使用 `dmPolicy: "pairing"` 或嚴格的 `allowFrom` 清單，而非 `dmPolicy: "open"`。
- 請勿將 `"*"` 允許清單與廣泛的工具存取權限搭配使用。
- 除非聊天室受到嚴格管控，否則群組中應要求提及機器人。
- 當有多人可以私訊機器人時，請設定 `session.dmScope: "per-channel-peer"`（多帳號頻道則使用 `"per-account-channel-peer"`），以免私訊工作階段共用上下文。
- 將共用頻道路由至僅具最低限度工具且無個人憑證的代理程式。

配對僅核准傳送者觸發機器人，並不會讓該傳送者成為獨立的主機安全邊界。

## 反向代理檢查

對於可感知身分的代理：

- 代理必須先驗證使用者，才能將流量轉送至閘道。
- 防火牆或網路原則必須封鎖對閘道連接埠的直接存取。
- `gateway.trustedProxies` 必須只列出代理來源 IP。
- 代理必須移除或覆寫用戶端提供的身分與轉送標頭。
- 當代理服務多個受眾時，請設定 `gateway.auth.trustedProxy.allowUsers`。
- 只有在同一主機上的代理、信任本機程序且由代理掌控身分標頭時，才可使用 `gateway.auth.trustedProxy.allowLoopback`。

變更代理後，請執行 `openclaw security audit --deep`。受信任代理的發現具有高度參考價值，因為代理會成為驗證邊界。

## 工具與沙箱審查

將代理程式暴露給遠端傳送者前：

- 確認哪些工作階段在主機上執行，哪些在沙箱中執行。
- 拒絕主機上的 exec，或要求核准。
- 除非特定且受信任的傳送者需要，否則保持停用提高權限工具。
- 對開放或半開放的訊息傳遞介面，避免使用瀏覽器、畫布、節點、排程、閘道及建立工作階段工具。
- 將繫結掛載範圍維持在最小限度；避免掛載憑證、家目錄、Docker 通訊端及系統路徑。
- 對實質上不同的信任邊界，使用不同的閘道、作業系統使用者或主機。

如果無法完全信任遠端使用者，隔離必須透過不同的部署來實現，而不能僅依賴提示詞或工作階段標籤。

## 變更後驗證

每次變更暴露設定後：

1. 重新執行 `openclaw security audit --deep`。
2. 確認已授權的連線可成功建立。
3. 確認未獲授權的傳送者或瀏覽器工作階段遭到拒絕。
4. 確認記錄會遮蔽機密資訊。
5. 確認私訊/群組路由只會到達預期的代理程式。
6. 確認高影響力工具會要求核准或遭到拒絕。
7. 記錄已接受的剩餘警告。

在瞭解目前變更前，請勿繼續進行下一項暴露設定變更。

## 復原計畫

如果閘道可能過度暴露：

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

接著：

1. 停止公開轉送、Tailscale Funnel 或反向代理路由。
2. 輪替閘道權杖/密碼及受影響的整合憑證。
3. 從允許清單中移除 `"*"` 與非預期的傳送者。
4. 審查最近的稽核記錄、執行歷程、工具呼叫及設定變更。
5. 重新執行 `openclaw security audit --deep`。
6. 使用能滿足工作流程的最嚴格限制模式重新啟用存取。

## 審查檢查清單

- 除非有已記錄的理由，否則閘道維持僅限 loopback。
- 非 loopback 存取具備驗證、防火牆保護，且沒有公開的直接路徑。
- 受信任代理部署具備嚴格的代理 IP 與標頭控制措施。
- 私訊預設使用配對或允許清單，而非開放存取。
- 群組要求提及機器人或使用明確的允許清單。
- 共用頻道無法觸及個人憑證。
- 非主要工作階段在沙箱模式中執行。
- 主機 exec 與提高權限工具遭到拒絕或受核准機制控管。
- 記錄會遮蔽機密資訊。
- 嚴重稽核發現均已解決。
- 復原步驟已測試並記錄。
