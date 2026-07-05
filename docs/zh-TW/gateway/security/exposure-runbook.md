---
read_when:
    - 透過區域網路、tailnet、Tailscale Serve、Funnel 或反向代理公開閘道
    - 允許真實訊息使用者之前審查部署
    - 回復有風險的遠端存取或 DM 設定
sidebarTitle: Exposure runbook
summary: 將 OpenClaw 閘道暴露到 loopback 之外前的預檢與復原檢查清單
title: 閘道暴露執行手冊
x-i18n:
    generated_at: "2026-07-05T11:24:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
只有在你能說明誰可以連到閘道、他們如何通過驗證、他們可以觸發哪些代理，以及那些代理可以使用哪些工具之後，才公開閘道。若有疑慮，請回到僅限 loopback 的存取並重新執行稽核。
</Warning>

本 runbook 會將更廣泛的[安全性](/zh-TW/gateway/security)指引轉換成遠端存取與訊息曝露的操作員檢查清單。

## 選擇曝露模式

優先採用能滿足工作流程的最窄模式。

| 模式                       | 建議使用時機                                    | 必要控制措施                                                                                                                    |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Loopback + SSH tunnel      | 個人使用、管理員存取、偵錯                      | 保持 `gateway.bind: "loopback"` 並建立 `127.0.0.1:18789` tunnel                                                                  |
| Loopback + Tailscale Serve | 個人 tailnet 存取控制介面/WebSocket             | 保持閘道僅限 loopback；Tailscale 身分標頭只驗證控制介面 WebSocket 表面，不驗證其他 auth 路徑                                   |
| Tailnet/LAN bind           | 具已知裝置的專用私人網路                        | 閘道 auth、防火牆 allowlist、沒有公開 port-forward                                                                               |
| 受信任反向代理             | 組織 SSO/OIDC 位於閘道前方                      | `trusted-proxy` auth、嚴格的 `trustedProxies`、標頭覆寫/剝除規則、明確允許的使用者                                             |
| 公開網際網路               | 少見的高風險部署                                | 具身分感知的 proxy、TLS、速率限制、嚴格 allowlist、沙盒化非 main 工作階段                                                       |

避免直接將公開連接埠轉送到閘道。如果需要公開存取，請在其前方放置具身分感知的 proxy，並讓該 proxy 成為通往閘道的唯一網路路徑。

## 預檢盤點

在變更 bind、proxy、Tailscale 或 channel policy 之前記錄以下項目：

- 閘道主機、OS 使用者與狀態目錄（預設 `~/.openclaw`）。
- 閘道 URL 與 bind 模式（`gateway.bind`；預設連接埠 `18789`）。
- Auth 模式、token/password 來源，或受信任 proxy 身分來源。
- 每個已啟用 channel，以及它是否接受 DM、群組或 webhooks。
- 非本機傳送者可觸及的代理。
- 每個可觸及代理的工具 profile、sandbox mode 與 elevated tool policy。
- 這些代理可使用的外部憑證。
- `~/.openclaw/openclaw.json` 與憑證的備份位置。

如果超過一個人可以傳訊息給 bot，請將此視為共用的委派工具權限，而不是每位使用者各自的主機隔離。

## 基準檢查

在開放存取前執行：

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

先解決 critical findings。只有在部署有意如此且已記錄時，才接受 warnings。請參閱[安全性稽核檢查](/zh-TW/gateway/security/audit-checks)，了解每個 `checkId` 的含義及其修復 key。

若要進行遠端命令列介面驗證，請明確傳入憑證：

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

不要假設本機 config 憑證會套用到明確指定的遠端 URL。

## 最小安全基準

將此形態作為曝露部署的起點：

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

一次只放寬一項控制：先新增特定 channel allowlist，再啟用可寫入工具；或先啟用反向代理，再接受遠端控制介面流量。

`tools.exec.security: "deny"` 會封鎖所有 exec 呼叫，包括無害的診斷。如果需要診斷或低風險命令，只有在選定符合你的威脅模型的特定傳送者、代理、命令與核准模式後，才放寬此設定。

## DM 與群組曝露

訊息 channel 是不受信任的輸入表面。在允許 DM 或群組之前：

- 優先使用 `dmPolicy: "pairing"` 或嚴格的 `allowFrom` 清單，而不是 `dmPolicy: "open"`。
- 不要將 `"*"` allowlist 與寬鬆工具存取結合使用。
- 在群組中要求 mention，除非該聊天室受到嚴格控制。
- 當多個人可以 DM bot 時，設定 `session.dmScope: "per-channel-peer"`（多帳號 channel 則使用 `"per-account-channel-peer"`），讓 DM 工作階段不會共享 context。
- 將共用 channel 路由到工具最少且沒有個人憑證的代理。

Pairing 會核准傳送者觸發 bot。它不會讓該傳送者成為獨立的主機安全邊界。

## 反向代理檢查

對於具身分感知的 proxy：

- proxy 必須先驗證使用者，才轉送到閘道。
- 防火牆或網路 policy 必須封鎖對閘道連接埠的直接存取。
- `gateway.trustedProxies` 必須只列出 proxy 來源 IP。
- proxy 必須剝除或覆寫由 client 提供的身分與轉送標頭。
- 當 proxy 服務多個受眾時，設定 `gateway.auth.trustedProxy.allowUsers`。
- 只有在同主機 proxy、且本機程序受信任並由 proxy 擁有身分標頭時，才使用 `gateway.auth.trustedProxy.allowLoopback`。

在 proxy 變更後執行 `openclaw security audit --deep`。Trusted-proxy findings 具有高訊號，因為 proxy 會成為驗證邊界。

## 工具與沙盒審查

在向遠端傳送者曝露代理之前：

- 確認哪些工作階段在 host 上執行，哪些在 sandbox 中執行。
- 拒絕 host exec，或要求核准。
- 除非特定且受信任的傳送者需要，否則保持 elevated tools 停用。
- 對開放或半開放的訊息表面，避免 browser、canvas、node、cron、gateway 和 session-spawn 工具。
- 保持 bind mounts 狹窄；避免 credential、home、Docker socket 與 system paths。
- 對實質不同的信任邊界，使用獨立閘道、OS 使用者或主機。

如果遠端使用者並非完全受信任，隔離必須來自獨立部署，而不只是 prompts 或 session labels。

## 變更後驗證

每次曝露變更後：

1. 重新執行 `openclaw security audit --deep`。
2. 確認授權連線可成功連上。
3. 確認未授權傳送者或瀏覽器工作階段會被拒絕。
4. 確認 logs 會遮蔽 secrets。
5. 確認 DM/group routing 只會抵達預期代理。
6. 確認高影響工具會要求核准或遭拒絕。
7. 記錄已接受的殘餘 warnings。

在了解目前變更之前，不要繼續下一項曝露變更。

## 復原計畫

如果閘道可能過度曝露：

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

然後：

1. 停止公開 forwarding、Tailscale Funnel 或反向代理 routes。
2. 輪替閘道 tokens/passwords 與受影響的 integration credentials。
3. 從 allowlists 移除 `"*"` 與非預期的傳送者。
4. 檢閱最近的 audit logs、run history、tool calls 與 config changes。
5. 重新執行 `openclaw security audit --deep`。
6. 使用能滿足工作流程的最窄模式重新啟用存取。

## 審查檢查清單

- 除非有已記錄的理由，否則閘道保持僅限 loopback。
- 非 loopback 存取具備 auth、防火牆，且沒有公開直接路徑。
- Trusted-proxy 部署具有嚴格的 proxy IP 與標頭控制。
- DM 使用 pairing 或 allowlists，而不是預設開放存取。
- 群組要求 mentions 或明確 allowlists。
- 共用 channel 不會觸及個人憑證。
- 非 main 工作階段以 sandbox mode 執行。
- Host exec 與 elevated tools 會被拒絕或經由核准閘控。
- Logs 會遮蔽 secrets。
- Critical audit findings 已解決。
- Rollback steps 已測試並記錄。
