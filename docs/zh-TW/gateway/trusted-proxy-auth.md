---
read_when:
    - 在身分感知代理後方執行 OpenClaw
    - 在 OpenClaw 前方設定搭配 OAuth 的 Pomerium、Caddy 或 nginx
    - 修正反向代理設定中的 WebSocket 1008 未授權錯誤
    - 決定要在哪裡設定 HSTS 和其他 HTTP 強化標頭
sidebarTitle: Trusted proxy auth
summary: 將閘道身分驗證委派給受信任的反向代理（Pomerium、Caddy、nginx + OAuth）
title: 受信任的代理驗證
x-i18n:
    generated_at: "2026-06-27T19:23:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**安全性敏感功能。** 此模式會將驗證完全委派給你的反向代理。設定錯誤可能會讓你的閘道暴露給未授權存取。啟用前請仔細閱讀本頁。
</Warning>

## 使用時機

在以下情況使用 `trusted-proxy` 驗證模式：

- 你在**具備身分感知能力的代理**後方執行 OpenClaw（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）。
- 你的代理處理所有驗證，並透過標頭傳遞使用者身分。
- 你位於 Kubernetes 或容器環境中，且代理是通往閘道的唯一路徑。
- 你遇到 WebSocket `1008 unauthorized` 錯誤，因為瀏覽器無法在 WS 承載中傳遞權杖。

## 不應使用的時機

- 如果你的代理不會驗證使用者（只是 TLS 終止器或負載平衡器）。
- 如果存在任何可繞過代理通往閘道的路徑（防火牆漏洞、內部網路存取）。
- 如果你不確定代理是否會正確移除/覆寫轉送標頭。
- 如果你只需要個人單一使用者存取（可考慮使用 Tailscale Serve + loopback，設定較簡單）。

## 運作方式

<Steps>
  <Step title="代理驗證使用者">
    你的反向代理會驗證使用者（OAuth、OIDC、SAML 等）。
  </Step>
  <Step title="代理加入身分標頭">
    代理會加入帶有已驗證使用者身分的標頭（例如 `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="閘道驗證信任來源">
    OpenClaw 會檢查請求是否來自**受信任的代理 IP**（在 `gateway.trustedProxies` 中設定）。
  </Step>
  <Step title="閘道擷取身分">
    OpenClaw 會從設定的標頭中擷取使用者身分。
  </Step>
  <Step title="授權">
    如果所有檢查都通過，請求就會獲得授權。
  </Step>
</Steps>

## Control UI 配對行為

當 `gateway.auth.mode = "trusted-proxy"` 啟用，且請求通過 trusted-proxy 檢查時，Control UI WebSocket 工作階段可以在沒有裝置配對身分的情況下連線。

範圍影響：

- 無裝置的 Control UI WebSocket 工作階段可以連線，但預設不會收到任何操作員範圍。OpenClaw 會將請求的範圍清單清除為 `[]`，因此未繫結到已核准配對裝置/權杖的工作階段無法自行宣告權限。
- 如果 WebSocket 成功連線後，方法因 `missing scope` 失敗，請使用 HTTPS，讓瀏覽器能產生裝置身分並完成配對。請參閱 [Control UI 不安全 HTTP](/zh-TW/web/control-ui#insecure-http)。
- 僅限緊急破窗：`gateway.controlUi.dangerouslyDisableDeviceAuth=true` 會即使沒有裝置身分也保留請求的範圍。這是嚴重的安全性降級；請盡快復原。請參閱 [Control UI 不安全 HTTP](/zh-TW/web/control-ui#insecure-http)。

反向代理範圍上限：

- 如果你的代理在 Control UI WebSocket 升級請求上傳送 `x-openclaw-scopes`，OpenClaw 會將工作階段範圍限制為請求範圍與宣告範圍的交集。此標頭不會授予範圍；它只會縮小工作階段可持有的範圍。

影響：

- 在此模式中，配對不再是 Control UI 存取的主要關卡。
- 你的反向代理驗證政策與 `allowUsers` 會成為實際的存取控制。
- 僅讓受信任代理 IP 能進入閘道入口（`gateway.trustedProxies` + 防火牆）。

自訂 WebSocket 用戶端不是 Control UI 工作階段。`gateway.controlUi.dangerouslyDisableDeviceAuth` 不會將範圍授予任意 `client.mode: "backend"` 或命令列介面形式的用戶端。自訂自動化應使用裝置身分/配對、保留的直接本機 `client.id: "gateway-client"` 後端輔助路徑，或在 HTTP 請求/回應介面更適合時使用 [admin HTTP RPC 外掛](/zh-TW/plugins/admin-http-rpc)。

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

- Trusted-proxy 驗證預設會拒絕來自 loopback 來源的請求（`127.0.0.1`、`::1`、loopback CIDR）。
- 同主機 loopback 反向代理不會滿足 trusted-proxy 驗證，除非你明確設定 `gateway.auth.trustedProxy.allowLoopback = true`，並在 `gateway.trustedProxies` 中包含 loopback 位址。
- `allowLoopback` 會將閘道主機上的本機程序信任到與反向代理相同的程度。只有在閘道仍透過防火牆隔離直接遠端存取，且本機代理會移除或覆寫用戶端提供的身分標頭時，才啟用它。
- 不經過反向代理的內部閘道用戶端應使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，而不是 trusted-proxy 身分標頭。
- 非 loopback Control UI 部署仍需要明確的 `gateway.controlUi.allowedOrigins`。
- **轉送標頭證據會覆寫本機直接後援的 loopback 本地性。** 如果請求抵達 loopback 但帶有 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 標頭證據，該證據會使本機直接密碼後援與裝置身分閘控失效。使用 `allowLoopback: true` 時，trusted-proxy 驗證仍可將該請求視為同主機代理請求接受，同時 `requiredHeaders` 與 `allowUsers` 仍會套用。

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
  請求要被信任時必須存在的額外標頭。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  使用者身分允許清單。空值表示允許所有已驗證使用者。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  選擇性支援同主機 loopback 反向代理。預設為 `false`。
</ParamField>

<Warning>
只有在本機反向代理是預期的信任邊界時，才啟用 `allowLoopback`。任何可連線到閘道的本機程序都能嘗試傳送代理身分標頭，因此請將直接閘道存取保持為主機私有，並要求代理擁有的標頭，例如 `x-forwarded-proto`，或在你的代理支援時使用簽署斷言標頭。
</Warning>

## TLS 終止與 HSTS

使用單一 TLS 終止點，並在該處套用 HSTS。

<Tabs>
  <Tab title="代理 TLS 終止（建議）">
    當你的反向代理為 `https://control.example.com` 處理 HTTPS 時，請在該網域的代理上設定 `Strict-Transport-Security`。

    - 適合面向網際網路的部署。
    - 將憑證與 HTTP 強化政策保留在同一處。
    - OpenClaw 可在代理後方維持使用 loopback HTTP。

    範例標頭值：

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="閘道 TLS 終止">
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

- 驗證流量時，先從較短的最大存留時間開始（例如 `max-age=300`）。
- 只有在信心很高之後，才增加到長期值（例如 `max-age=31536000`）。
- 只有在每個子網域都已準備好使用 HTTPS 時，才加入 `includeSubDomains`。
- 只有在你刻意滿足完整網域集合的預載要求時，才使用 preload。
- 僅限 loopback 的本機開發不會受益於 HSTS。

## 代理設定範例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium 會在 `x-pomerium-claim-email`（或其他宣告標頭）中傳遞身分，並在 `x-pomerium-jwt-assertion` 中傳遞 JWT。

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
  <Accordion title="Caddy with OAuth">
    搭配 `caddy-security` 外掛的 Caddy 可以驗證使用者並傳遞身分標頭。

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
  <Accordion title="Traefik with forward auth">
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

## 混合權杖設定

OpenClaw 會拒絕同時啟用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）與 `trusted-proxy` 模式的模稜兩可設定。混合權杖設定可能導致 loopback 請求在錯誤的驗證路徑上默默通過驗證。

如果啟動時看到 `mixed_trusted_proxy_token` 錯誤：

- 使用 trusted-proxy 模式時移除共用權杖，或
- 如果你打算使用權杖式驗證，請將 `gateway.auth.mode` 切換為 `"token"`。

迴送受信任代理身分標頭仍會以失敗關閉方式處理：同主機呼叫者不會被靜默驗證為代理使用者。繞過代理的內部 OpenClaw 呼叫者可改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 進行驗證。在受信任代理模式中，仍刻意不支援權杖備援。

## 操作者範圍標頭

受信任代理驗證是一種**挾帶身分**的 HTTP 模式，因此呼叫者可選擇在 HTTP API 要求中使用 `x-openclaw-scopes` 宣告操作者範圍。

注意：WebSocket 範圍由閘道協定握手與裝置身分綁定決定。在控制介面 WebSocket 升級要求上，`x-openclaw-scopes` 只是協商後工作階段範圍的上限，而不是授權。若要了解受信任代理的 WebSocket 範圍行為，請參閱[控制介面配對行為](#control-ui-pairing-behavior)。

範例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行為：

- 標頭存在時，OpenClaw 會採用宣告的範圍集合。
- 標頭存在但為空時，該要求會宣告**沒有**操作者範圍。
- 標頭不存在時，一般挾帶身分的 HTTP API 會回退到標準操作者預設範圍集合。
- 閘道驗證**外掛 HTTP 路由**預設較窄：當 `x-openclaw-scopes` 不存在時，其執行階段範圍會回退到 `operator.write`。
- 瀏覽器來源的 HTTP 要求即使在受信任代理驗證成功後，仍必須通過 `gateway.controlUi.allowedOrigins`（或刻意啟用的 Host 標頭備援模式）。
- 對於控制介面 WebSocket 工作階段，若升級要求上存在 `x-openclaw-scopes`，它就是範圍上限。空值會產生沒有範圍的結果。

實務規則：當你希望受信任代理要求比預設值更窄，或當閘道驗證外掛路由需要比寫入範圍更強的權限時，請明確傳送 `x-openclaw-scopes`。

## 安全檢查清單

啟用受信任代理驗證前，請確認：

- [ ] **代理是唯一路徑**：閘道連接埠已由防火牆隔離，除了你的代理外，其他來源皆無法存取。
- [ ] **trustedProxies 最小化**：只包含實際代理 IP，而不是整個子網路。
- [ ] **迴送代理來源是刻意設定的**：除非為同主機代理明確啟用 `gateway.auth.trustedProxy.allowLoopback`，否則迴送來源要求的受信任代理驗證會以失敗關閉方式處理。
- [ ] **代理會移除標頭**：你的代理會覆寫（不是附加）來自用戶端的 `x-forwarded-*` 標頭。
- [ ] **TLS 終止**：你的代理負責處理 TLS；使用者透過 HTTPS 連線。
- [ ] **allowedOrigins 是明確的**：非迴送控制介面使用明確的 `gateway.controlUi.allowedOrigins`。
- [ ] **已設定 allowUsers**（建議）：限制為已知使用者，而不是允許任何已驗證者。
- [ ] **沒有混用權杖設定**：不要同時設定 `gateway.auth.token` 和 `gateway.auth.mode: "trusted-proxy"`。
- [ ] **本機密碼備援是私有的**：如果你為內部直接呼叫者設定 `gateway.auth.password`，請讓閘道連接埠保持受防火牆隔離，避免非代理遠端用戶端可直接存取。

## 安全稽核

`openclaw security audit` 會以**重大**嚴重性發現標記受信任代理驗證。這是刻意設計的，提醒你已將安全性委派給代理設定。

稽核會檢查：

- 基礎 `gateway.trusted_proxy_auth` 警告／重大提醒
- 缺少 `trustedProxies` 設定
- 缺少 `userHeader` 設定
- 空的 `allowUsers`（允許任何已驗證使用者）
- 為同主機代理來源啟用 `allowLoopback`
- 暴露的控制介面表面使用萬用字元或缺少瀏覽器來源政策

## 疑難排解

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    要求不是來自 `gateway.trustedProxies` 中的 IP。請檢查：

    - 代理 IP 是否正確？（Docker 容器 IP 可能會變動。）
    - 你的代理前方是否有負載平衡器？
    - 使用 `docker inspect` 或 `kubectl get pods -o wide` 找出實際 IP。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw 拒絕了迴送來源的受信任代理要求。

    請檢查：

    - 代理是否從 `127.0.0.1` / `::1` 連線？
    - 你是否嘗試搭配同主機迴送反向代理使用受信任代理驗證？

    修正方式：

    - 針對未通過代理的內部同主機用戶端，優先使用權杖／密碼驗證，或
    - 透過非迴送的受信任代理位址路由，並將該 IP 保留在 `gateway.trustedProxies` 中，或
    - 若是刻意設定的同主機反向代理，請設定 `gateway.auth.trustedProxy.allowLoopback = true`，將迴送位址保留在 `gateway.trustedProxies` 中，並確保代理會移除或覆寫身分標頭。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    使用者標頭為空或缺少。請檢查：

    - 你的代理是否已設定為傳遞身分標頭？
    - 標頭名稱是否正確？（不分大小寫，但拼字很重要）
    - 使用者是否已在代理端實際完成驗證？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    缺少必要標頭。請檢查：

    - 這些特定標頭的代理設定。
    - 標頭是否在鏈路中的某處被移除。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    使用者已驗證，但不在 `allowUsers` 中。請加入該使用者或移除允許清單。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    受信任代理驗證已成功，但瀏覽器 `Origin` 標頭未通過控制介面來源檢查。

    請檢查：

    - `gateway.controlUi.allowedOrigins` 包含確切的瀏覽器來源。
    - 除非你刻意想要允許全部行為，否則不要依賴萬用字元來源。
    - 如果你刻意使用 Host 標頭備援模式，請確認已刻意設定 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`。

  </Accordion>
  <Accordion title="連線成功但方法回報缺少範圍">
    WebSocket 已連線，但 `chat.history`、`sessions.list` 或
    `models.list` 因 `missing scope: operator.read` 而失敗。

    常見原因：

    - 無裝置的控制介面工作階段：受信任代理驗證可以在沒有裝置身分的情況下允許 WebSocket 連線，但 OpenClaw 依設計會清除無裝置工作階段上的範圍。
    - 自訂後端用戶端：`gateway.controlUi.dangerouslyDisableDeviceAuth` 作用範圍限於控制介面，不會將範圍授予任意後端或命令列介面形態的 WebSocket 用戶端。
    - 過度狹窄的 `x-openclaw-scopes`：如果你的代理在控制介面 WebSocket 升級要求上注入此標頭，工作階段範圍會被限制在該集合內。空標頭值會產生沒有範圍的結果。

    修正方式：

    - 對於控制介面，使用 HTTPS，讓瀏覽器能產生裝置身分並完成配對。
    - 對於自訂自動化，使用裝置身分／配對、保留的直接本機 `gateway-client` 後端輔助路徑，或[管理員 HTTP RPC](/zh-TW/plugins/admin-http-rpc)。
    - 只將 `gateway.controlUi.dangerouslyDisableDeviceAuth: true` 作為臨時控制介面緊急解鎖路徑。

  </Accordion>
  <Accordion title="WebSocket 仍然失敗">
    請確認你的代理：

    - 支援 WebSocket 升級（`Upgrade: websocket`、`Connection: upgrade`）。
    - 在 WebSocket 升級要求上傳遞身分標頭（不只是 HTTP）。
    - 沒有為 WebSocket 連線使用獨立的驗證路徑。

  </Accordion>
</AccordionGroup>

## 從權杖驗證遷移

如果你要從權杖驗證移至受信任代理：

<Steps>
  <Step title="設定代理">
    設定你的代理以驗證使用者並傳遞標頭。
  </Step>
  <Step title="獨立測試代理">
    獨立測試代理設定（使用帶標頭的 curl）。
  </Step>
  <Step title="更新 OpenClaw 設定">
    使用受信任代理驗證更新 OpenClaw 設定。
  </Step>
  <Step title="重新啟動閘道">
    重新啟動閘道。
  </Step>
  <Step title="測試 WebSocket">
    從控制介面測試 WebSocket 連線。
  </Step>
  <Step title="稽核">
    執行 `openclaw security audit` 並檢閱發現。
  </Step>
</Steps>

## 相關

- [設定](/zh-TW/gateway/configuration) — 設定參考
- [遠端存取](/zh-TW/gateway/remote) — 其他遠端存取模式
- [安全性](/zh-TW/gateway/security) — 完整安全性指南
- [Tailscale](/zh-TW/gateway/tailscale) — 僅限 tailnet 存取的較簡單替代方案
