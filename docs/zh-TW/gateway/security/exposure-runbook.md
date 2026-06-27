---
read_when:
    - 透過區域網路、tailnet、Tailscale Serve、Funnel 或反向代理公開閘道
    - 允許真實訊息使用者前審查部署
    - 復原有風險的遠端存取或私訊設定
sidebarTitle: Exposure runbook
summary: 將 OpenClaw 閘道公開到迴路介面之外前的預檢與回復檢查清單
title: 閘道暴露執行手冊
x-i18n:
    generated_at: "2026-06-27T19:22:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
只有在你能說明誰可以連上閘道、他們如何通過驗證、他們可以觸發哪些代理，以及這些代理可以使用哪些工具之後，才公開閘道。若有疑慮，請回到僅限 loopback 的存取方式，並重新執行稽核。
</Warning>

本 Runbook 將更廣泛的[安全性](/zh-TW/gateway/security)指南轉換為遠端存取與訊息暴露的操作員檢查清單。

## 選擇暴露模式

優先採用能滿足工作流程的最窄模式。

| 模式                       | 建議使用時機                                    | 必要控制                                                                                            |
| -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Loopback + SSH tunnel      | 個人使用、管理員存取、偵錯                      | 保持 `gateway.bind: "loopback"` 並透過 tunnel `127.0.0.1:18789`                                     |
| Loopback + Tailscale Serve | 個人 tailnet 存取 Control UI/WebSocket          | 保持閘道僅限 loopback；僅在支援的介面上依賴 Tailscale 身分標頭                                     |
| Tailnet/LAN bind           | 具有已知裝置的專用私人網路                      | 閘道驗證、防火牆允許清單、無公開連接埠轉發                                                        |
| Trusted reverse proxy      | 組織 SSO/OIDC 位於閘道前方                      | `trusted-proxy` 驗證、嚴格的 `trustedProxies`、標頭覆寫/剝除規則、明確允許的使用者                 |
| Public internet            | 少見的高風險部署                                | 身分感知 Proxy、TLS、速率限制、嚴格允許清單、沙盒化的非 main 工作階段                              |

避免將公開連接埠直接轉發到閘道。如果需要公開存取，請在前方放置身分感知 Proxy，並讓該 Proxy 成為通往閘道的唯一網路路徑。

## 預先檢查清冊

在變更 bind、Proxy、Tailscale 或 channel 政策之前，記錄下列資訊：

- 閘道主機、OS 使用者和狀態目錄。
- 閘道 URL 和 bind 模式。
- 驗證模式、token/password 來源，或受信任 Proxy 身分來源。
- 所有已啟用的 channel，以及它們是否接受 DM、群組或網路鉤子。
- 可由非本機傳送者觸及的代理。
- 每個可觸及代理的工具設定檔、沙盒模式和提升權限工具政策。
- 這些代理可用的外部憑證。
- `~/.openclaw/openclaw.json` 和憑證的備份位置。

如果不只一個人可以傳訊息給 bot，請將這視為共享委派工具權限，而不是逐使用者主機隔離。

## 基準檢查

開放存取前先執行這些命令：

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

先解決 critical 發現項目。warning 只有在對該部署有意為之且已記錄時，才可能可以接受。

對於遠端命令列介面驗證，請明確傳入憑證：

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

不要假設本機設定憑證會套用到明確指定的遠端 URL。

## 最低安全基準

將此形狀作為暴露部署的起點：

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

接著一次放寬一項控制。例如，在啟用可寫入工具之前，先新增特定 channel 允許清單；或是在接受遠端 Control UI 流量之前，先啟用反向 Proxy。

嚴格的 `exec.security: "deny"` 基準會封鎖所有 exec 呼叫，包括無害的診斷。如果需要診斷或低風險命令，只有在選好符合威脅模型的特定傳送者、代理、命令和核准模式後，才放寬此設定。

## DM 與群組暴露

Messaging channel 是不受信任的輸入介面。在允許 DM 或群組之前：

- 優先使用 `dmPolicy: "pairing"` 或嚴格的 `allowFrom` 清單。
- 避免使用 `dmPolicy: "open"`，除非每位傳送者都受信任。
- 不要將 `"*"` 允許清單與廣泛工具存取搭配使用。
- 除非聊天室受到嚴格控管，否則群組中必須要求提及。
- 當多個人可以 DM bot 時，使用 `session.dmScope: "per-channel-peer"`。
- 將共享 channel 路由到工具最少且沒有個人憑證的代理。

Pairing 會核准傳送者觸發 bot。這不會讓該傳送者成為獨立的主機安全邊界。

## 反向 Proxy 檢查

對於身分感知 Proxy：

- Proxy 必須先驗證使用者，再轉送到閘道。
- 必須透過防火牆或網路政策封鎖對閘道連接埠的直接存取。
- `gateway.trustedProxies` 必須只包含 Proxy 來源 IP。
- Proxy 必須剝除或覆寫用戶端提供的身分與轉送標頭。
- 當 Proxy 服務多個受眾時，`gateway.auth.trustedProxy.allowUsers` 應列出預期使用者。
- 同主機 loopback Proxy 模式只有在本機程序受信任且 Proxy 擁有身分標頭時，才應使用 `allowLoopback`。

Proxy 變更後執行 `openclaw security audit --deep`。受信任 Proxy 發現項目刻意保持高訊號，因為 Proxy 會成為驗證邊界。

## 工具與沙盒審查

在將代理暴露給遠端傳送者之前：

- 確認哪些工作階段在主機上執行，哪些在沙盒中執行。
- 拒絕主機 exec，或要求核准。
- 除非特定受信任傳送者需要，否則保持提升權限工具停用。
- 對開放或半開放 messaging 介面，避免使用 browser、canvas、node、cron、gateway 和 session-spawn 工具。
- 保持 bind mount 範圍狹窄，並避免憑證、home、Docker socket 和系統路徑。
- 對實質不同的信任邊界使用獨立閘道、OS 使用者或主機。

如果遠端使用者並非完全受信任，隔離必須來自獨立部署，而不僅是提示或工作階段標籤。

## 變更後驗證

每次暴露變更後：

1. 重新執行 `openclaw security audit --deep`。
2. 測試成功的已授權連線。
3. 測試未授權的傳送者或瀏覽器工作階段遭拒。
4. 確認記錄會遮蔽祕密。
5. 確認 DM/群組路由只會到達預期代理。
6. 確認高影響工具會要求核准或被拒絕。
7. 記錄已接受的殘餘 warning。

在理解目前變更之前，不要進行下一個暴露變更。

## 復原計畫

如果閘道可能暴露過度：

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

1. 停止公開轉送、Tailscale Funnel 或反向 Proxy 路由。
2. 輪替閘道 token/password 和受影響的整合憑證。
3. 從允許清單移除 `"*"` 和非預期傳送者。
4. 審查近期稽核記錄、執行歷史、工具呼叫和設定變更。
5. 重新執行 `openclaw security audit --deep`。
6. 使用滿足工作流程的最窄模式重新啟用存取。

## 審查檢查清單

- 閘道保持僅限 loopback，除非有已記錄的理由。
- 非 loopback 存取具備驗證、防火牆控管，且沒有公開直接路由。
- 受信任 Proxy 部署具有嚴格的 Proxy IP 與標頭控制。
- DM 預設使用 pairing 或允許清單，而不是開放存取。
- 群組要求提及或明確允許清單。
- 共享 channel 不會觸及個人憑證。
- 非 main 工作階段在沙盒模式下執行。
- 主機 exec 和提升權限工具會被拒絕或需要核准。
- 記錄會遮蔽祕密。
- critical 稽核發現項目已解決。
- 復原步驟已測試並記錄。
