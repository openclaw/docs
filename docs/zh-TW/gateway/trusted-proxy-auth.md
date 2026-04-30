---
read_when:
    - 在身分感知代理後方執行 OpenClaw
    - 在 OpenClaw 前方設定 Pomerium、Caddy 或 nginx 搭配 OAuth
    - 修正反向代理設定中的 WebSocket 1008 未授權錯誤
    - 決定在哪裡設定 HSTS 與其他 HTTP 安全強化標頭
sidebarTitle: Trusted proxy auth
summary: 將 Gateway 身分驗證委派給受信任的反向代理 (Pomerium, Caddy, nginx + OAuth)
title: 受信任的代理驗證
x-i18n:
    generated_at: "2026-04-30T03:10:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**安全敏感功能。** 此模式會將驗證完全委派給你的反向代理。設定錯誤可能會讓你的 Gateway 暴露於未授權存取。啟用前請仔細閱讀本頁。
</Warning>

## 何時使用

在以下情況使用 `trusted-proxy` 驗證模式：

- 你在**具備身分識別能力的代理**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）後方執行 OpenClaw。
- 你的代理會處理所有驗證，並透過標頭傳遞使用者身分。
- 你處於 Kubernetes 或容器環境，且代理是通往 Gateway 的唯一路徑。
- 你遇到 WebSocket `1008 unauthorized` 錯誤，因為瀏覽器無法在 WS payload 中傳遞 token。

## 何時不要使用

- 如果你的代理不會驗證使用者（只是 TLS 終止器或負載平衡器）。
- 如果有任何路徑可繞過代理存取 Gateway（防火牆漏洞、內部網路存取）。
- 如果你不確定代理是否正確移除或覆寫轉送標頭。
- 如果你只需要個人單一使用者存取（可考慮使用 Tailscale Serve + loopback 以簡化設定）。

## 運作方式

<Steps>
  <Step title="代理驗證使用者">
    你的反向代理會驗證使用者（OAuth、OIDC、SAML 等）。
  </Step>
  <Step title="代理加入身分標頭">
    代理會加入包含已驗證使用者身分的標頭（例如 `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="Gateway 驗證信任來源">
    OpenClaw 會檢查請求是否來自**受信任的代理 IP**（於 `gateway.trustedProxies` 中設定）。
  </Step>
  <Step title="Gateway 擷取身分">
    OpenClaw 會從設定的標頭擷取使用者身分。
  </Step>
  <Step title="授權">
    如果所有檢查都通過，請求就會獲得授權。
  </Step>
</Steps>

## Control UI 配對行為

當 `gateway.auth.mode = "trusted-proxy"` 啟用且請求通過 trusted-proxy 檢查時，Control UI WebSocket 工作階段可以在沒有裝置配對身分的情況下連線。

影響：

- 在此模式中，配對不再是 Control UI 存取的主要閘門。
- 你的反向代理驗證政策與 `allowUsers` 會成為實際的存取控制。
- 僅讓 Gateway 入口鎖定為受信任的代理 IP（`gateway.trustedProxies` + 防火牆）。

## 設定

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**重要執行階段規則**

- Trusted-proxy 驗證預設會拒絕 loopback 來源請求（`127.0.0.1`、`::1`、loopback CIDR）。
- same-host loopback 反向代理**不會**滿足 trusted-proxy 驗證，除非你明確設定 `gateway.auth.trustedProxy.allowLoopback = true`，並將 loopback 位址加入 `gateway.trustedProxies`。
- `allowLoopback` 會將 Gateway 主機上的本機程序信任到與反向代理相同的程度。只有在 Gateway 仍透過防火牆阻擋直接遠端存取，且本機代理會移除或覆寫用戶端提供的身分標頭時，才啟用它。
- 未經過反向代理的內部 Gateway 用戶端應使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，而不是 trusted-proxy 身分標頭。
- 非 loopback 的 Control UI 部署仍需要明確設定 `gateway.controlUi.allowedOrigins`。
- **轉送標頭證據會覆寫 local direct fallback 的 loopback 本地性。** 如果請求抵達 loopback，但帶有指向非本機來源的 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 標頭，該證據會使 local-direct password fallback 與裝置身分閘門失效。使用 `allowLoopback: true` 時，trusted-proxy 驗證仍可將請求作為 same-host proxy 請求接受，同時 `requiredHeaders` 與 `allowUsers` 仍會繼續套用。

</Warning>

### 設定參考

<ParamField path="gateway.trustedProxies" type="string[]" required>
  要信任的代理 IP 位址陣列。來自其他 IP 的請求會被拒絕。
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  必須是 `"trusted-proxy"`。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  包含已驗證使用者身分的標頭名稱。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  請求要被信任時必須存在的其他標頭。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  使用者身分允許清單。空白表示允許所有已驗證使用者。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  選擇啟用對 same-host loopback 反向代理的支援。預設為 `false`。
</ParamField>

<Warning>
只有在本機反向代理是預期的信任邊界時，才啟用 `allowLoopback`。任何能連線到 Gateway 的本機程序都可以嘗試傳送代理身分標頭，因此請將直接 Gateway 存取限制為主機私有，並要求由代理擁有的標頭，例如 `x-forwarded-proto`，或在你的代理支援時使用簽署斷言標頭。
</Warning>

## TLS 終止與 HSTS

使用單一 TLS 終止點，並在該處套用 HSTS。

<Tabs>
  <Tab title="代理 TLS 終止（建議）">
    當你的反向代理為 `https://control.example.com` 處理 HTTPS 時，請在代理上為該網域設定 `Strict-Transport-Security`。

    - 適合面向網際網路的部署。
    - 將憑證與 HTTP 強化政策集中在同一處。
    - OpenClaw 可以留在代理後方的 loopback HTTP。

    範例標頭值：

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS 終止">
    如果 OpenClaw 本身直接提供 HTTPS（沒有 TLS 終止代理），請設定：

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` 接受字串標頭值，或使用 `false` 明確停用。

  </Tab>
</Tabs>

### 推出指引

- 驗證流量時，先從較短的 max age 開始（例如 `max-age=300`）。
- 只有在信心足夠高後，才提高到長效值（例如 `max-age=31536000`）。
- 只有在每個子網域都已準備好 HTTPS 時，才加入 `includeSubDomains`。
- 只有在你有意為完整網域集合滿足 preload 要求時，才使用 preload。
- 僅限 loopback 的本機開發不會受益於 HSTS。

## 代理設定範例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium 會在 `x-pomerium-claim-email`（或其他 claim 標頭）中傳遞身分，並在 `x-pomerium-jwt-assertion` 中傳遞 JWT。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    Pomerium 設定片段：

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="使用 OAuth 的 Caddy">
    搭配 `caddy-security` Plugin 的 Caddy 可以驗證使用者並傳遞身分標頭。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Caddyfile 片段：

    ```
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    oauth2-proxy 會驗證使用者，並在 `x-auth-request-email` 中傳遞身分。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    nginx 設定片段：

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="使用 forward auth 的 Traefik">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 混合 token 設定

OpenClaw 會拒絕同時啟用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）與 `trusted-proxy` 模式的模糊設定。混合 token 設定可能導致 loopback 請求在錯誤的驗證路徑上悄悄通過驗證。

如果你在啟動時看到 `mixed_trusted_proxy_token` 錯誤：

- 使用 trusted-proxy 模式時，移除共享 token，或
- 如果你打算使用 token 型驗證，將 `gateway.auth.mode` 切換為 `"token"`。

Loopback trusted-proxy 身分標頭仍會失敗關閉：same-host 呼叫者不會被悄悄驗證為代理使用者。繞過代理的內部 OpenClaw 呼叫者可以改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 驗證。Token fallback 在 trusted-proxy 模式中仍刻意不支援。

## 操作者範圍標頭

Trusted-proxy 驗證是一種**帶有身分**的 HTTP 模式，因此呼叫者可以選擇使用 `x-openclaw-scopes` 宣告操作者範圍。

範例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行為：

- 當標頭存在時，OpenClaw 會採用宣告的 scope 集合。
- 當標頭存在但為空時，請求宣告**沒有**操作者範圍。
- 當標頭不存在時，一般帶有身分的 HTTP API 會回退到標準操作者預設 scope 集合。
- Gateway 驗證的 **Plugin HTTP 路由**預設較窄：當 `x-openclaw-scopes` 不存在時，其執行階段 scope 會回退到 `operator.write`。
- 來自瀏覽器來源的 HTTP 請求，即使 trusted-proxy 驗證成功，仍必須通過 `gateway.controlUi.allowedOrigins`（或刻意使用 Host-header fallback 模式）。

實務規則：當你希望 trusted-proxy 請求比預設值更窄，或 gateway-auth Plugin 路由需要比 write scope 更強的權限時，請明確傳送 `x-openclaw-scopes`。

## 安全檢查清單

啟用 trusted-proxy 驗證前，請確認：

- [ ] **Proxy 是唯一路徑**：除了你的 Proxy 之外，Gateway 連接埠已對所有來源封鎖。
- [ ] **trustedProxies 最小化**：只包含你的實際 Proxy IP，而不是整個子網路。
- [ ] **Loopback Proxy 來源是刻意設定**：除非為同主機 Proxy 明確啟用 `gateway.auth.trustedProxy.allowLoopback`，否則 trusted-proxy 驗證會對 loopback 來源請求安全失敗。
- [ ] **Proxy 會移除標頭**：你的 Proxy 會覆寫（而不是附加）來自用戶端的 `x-forwarded-*` 標頭。
- [ ] **TLS 終止**：你的 Proxy 會處理 TLS；使用者透過 HTTPS 連線。
- [ ] **allowedOrigins 是明確的**：非 loopback 控制 UI 使用明確的 `gateway.controlUi.allowedOrigins`。
- [ ] **allowUsers 已設定**（建議）：限制為已知使用者，而不是允許任何已驗證的人。
- [ ] **沒有混用 Token 設定**：不要同時設定 `gateway.auth.token` 和 `gateway.auth.mode: "trusted-proxy"`。
- [ ] **本機密碼備援保持私密**：如果你為內部直接呼叫者設定 `gateway.auth.password`，請保持 Gateway 連接埠受防火牆保護，讓非 Proxy 的遠端用戶端無法直接連到它。

## 安全性稽核

`openclaw security audit` 會將 trusted-proxy 驗證標記為 **critical** 嚴重性發現。這是刻意設計的，提醒你正在把安全性委派給你的 Proxy 設定。

稽核會檢查：

- 基礎 `gateway.trusted_proxy_auth` 警告/critical 提醒
- 缺少 `trustedProxies` 設定
- 缺少 `userHeader` 設定
- 空的 `allowUsers`（允許任何已驗證使用者）
- 為同主機 Proxy 來源啟用的 `allowLoopback`
- 暴露的控制 UI 表面上有萬用字元或缺少瀏覽器來源政策

## 疑難排解

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    請求不是來自 `gateway.trustedProxies` 中的 IP。請檢查：

    - Proxy IP 正確嗎？（Docker 容器 IP 可能會變更。）
    - 你的 Proxy 前方是否有負載平衡器？
    - 使用 `docker inspect` 或 `kubectl get pods -o wide` 找出實際 IP。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw 拒絕了一個 loopback 來源的 trusted-proxy 請求。

    檢查：

    - Proxy 是否從 `127.0.0.1` / `::1` 連線？
    - 你是否嘗試搭配同主機 loopback 反向 Proxy 使用 trusted-proxy 驗證？

    修正：

    - 對於不經過 Proxy 的內部同主機用戶端，優先使用 Token/密碼驗證，或
    - 透過非 loopback 的受信任 Proxy 位址路由，並將該 IP 保留在 `gateway.trustedProxies` 中，或
    - 對於刻意設定的同主機反向 Proxy，設定 `gateway.auth.trustedProxy.allowLoopback = true`，將 loopback 位址保留在 `gateway.trustedProxies` 中，並確認 Proxy 會移除或覆寫身分標頭。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    使用者標頭是空的或不存在。請檢查：

    - 你的 Proxy 是否設定為傳遞身分標頭？
    - 標頭名稱正確嗎？（不區分大小寫，但拼字很重要）
    - 使用者是否真的已在 Proxy 驗證？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    必要標頭不存在。請檢查：

    - 你的 Proxy 對這些特定標頭的設定。
    - 標頭是否在鏈中的某處被移除。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    使用者已驗證，但不在 `allowUsers` 中。請新增該使用者，或移除允許清單。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    trusted-proxy 驗證成功，但瀏覽器 `Origin` 標頭未通過控制 UI 來源檢查。

    檢查：

    - `gateway.controlUi.allowedOrigins` 包含確切的瀏覽器來源。
    - 除非你刻意想要允許全部行為，否則不要依賴萬用字元來源。
    - 如果你刻意使用 Host 標頭備援模式，請確認已刻意設定 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`。

  </Accordion>
  <Accordion title="WebSocket still failing">
    確認你的 Proxy：

    - 支援 WebSocket 升級（`Upgrade: websocket`、`Connection: upgrade`）。
    - 會在 WebSocket 升級請求上傳遞身分標頭（不只是 HTTP）。
    - 沒有為 WebSocket 連線設定獨立的驗證路徑。

  </Accordion>
</AccordionGroup>

## 從 Token 驗證遷移

如果你要從 Token 驗證移轉到 trusted-proxy：

<Steps>
  <Step title="Configure the proxy">
    設定你的 Proxy 以驗證使用者並傳遞標頭。
  </Step>
  <Step title="Test the proxy independently">
    獨立測試 Proxy 設定（使用帶有標頭的 curl）。
  </Step>
  <Step title="Update OpenClaw config">
    使用 trusted-proxy 驗證更新 OpenClaw 設定。
  </Step>
  <Step title="Restart the Gateway">
    重新啟動 Gateway。
  </Step>
  <Step title="Test WebSocket">
    從控制 UI 測試 WebSocket 連線。
  </Step>
  <Step title="Audit">
    執行 `openclaw security audit` 並檢閱發現。
  </Step>
</Steps>

## 相關

- [設定](/zh-TW/gateway/configuration) — 設定參考
- [遠端存取](/zh-TW/gateway/remote) — 其他遠端存取模式
- [安全性](/zh-TW/gateway/security) — 完整安全性指南
- [Tailscale](/zh-TW/gateway/tailscale) — 對於僅限 tailnet 存取的更簡單替代方案
