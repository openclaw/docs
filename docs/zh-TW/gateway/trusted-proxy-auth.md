---
read_when:
    - 透過身分感知代理執行 OpenClaw
    - 在 OpenClaw 前方設定搭配 OAuth 的 Pomerium、Caddy 或 nginx
    - 修正反向代理設定中的 WebSocket 1008 未授權錯誤
    - 決定要在哪裡設定 HSTS 和其他 HTTP 強化標頭
sidebarTitle: Trusted proxy auth
summary: 將閘道驗證委派給受信任的反向代理（Pomerium、Caddy、nginx + OAuth）
title: 受信任的代理驗證
x-i18n:
    generated_at: "2026-07-05T11:24:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**安全性敏感功能。** 此模式會將驗證完全委派給你的反向代理。設定錯誤可能會讓你的閘道暴露於未授權存取。啟用前請仔細閱讀本頁。
</Warning>

## 使用時機

- 你在**具身分感知能力的代理**後方執行 OpenClaw（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）。
- 你的代理處理所有驗證，並透過標頭傳遞使用者身分。
- 你位於 Kubernetes 或容器環境中，且代理是通往閘道的唯一路徑。
- 你遇到 WebSocket `1008 unauthorized` 錯誤，因為瀏覽器無法在 WS 承載中傳遞權杖。

## 不應使用的時機

- 你的代理不會驗證使用者（只是 TLS 終止器或負載平衡器）。
- 有任何可繞過代理抵達閘道的路徑（防火牆漏洞、內部網路存取）。
- 你不確定代理是否正確移除／覆寫轉送標頭。
- 你只需要個人單一使用者存取（請改考慮 Tailscale Serve + loopback）。

## 運作方式

<Steps>
  <Step title="代理驗證使用者">
    你的反向代理會驗證使用者（OAuth、OIDC、SAML 等）。
  </Step>
  <Step title="代理加入身分標頭">
    代理會加入含有已驗證使用者身分的標頭（例如 `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="閘道驗證受信任來源">
    OpenClaw 會檢查請求是否來自**受信任代理 IP**（`gateway.trustedProxies`），且不是閘道本身的 loopback 或本機介面位址。
  </Step>
  <Step title="閘道擷取身分">
    OpenClaw 會讀取必要標頭，接著從設定的標頭讀取使用者身分。
  </Step>
  <Step title="授權">
    如果所有檢查都通過，且使用者通過 `allowUsers`（設定時），請求就會被授權。
  </Step>
</Steps>

## 設定

```json5
{
  gateway: {
    // Trusted-proxy auth expects the proxy's source IP to be non-loopback by default
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
**執行階段規則，依評估順序**

1. 請求的來源 IP 必須符合 `gateway.trustedProxies`（支援 CIDR），否則會被拒絕（`trusted_proxy_untrusted_source`）。
2. loopback 來源請求（`127.0.0.1`、`::1`）會被拒絕，除非 `gateway.auth.trustedProxy.allowLoopback = true`，且該 loopback 位址也在 `trustedProxies` 中（`trusted_proxy_loopback_source`）。這項檢查會在標頭檢查前執行，因此即使必要標頭也缺失，loopback 來源仍會以此方式失敗。
3. 符合閘道主機自身某個本機網路介面位址的非 loopback 來源，會作為防偽裝保護而被拒絕（`trusted_proxy_local_interface_source`）。如果介面探索本身失敗，請求也會被拒絕（`trusted_proxy_local_interface_check_failed`）。
4. `requiredHeaders` 和 `userHeader` 必須存在且非空白。
5. `allowUsers` 若非空，必須包含擷取出的使用者。

**轉送標頭證據會覆寫 local-direct fallback 的 loopback 本地性。** 如果請求抵達 loopback，但帶有 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 標頭，該證據會使其不符合 local-direct 密碼 fallback 和裝置身分閘控的資格，即使它仍會因 loopback 而無法通過 trusted-proxy 驗證。

`allowLoopback` 會以與反向代理相同的程度信任閘道主機上的本機程序。只有在閘道仍受防火牆保護、無法被遠端直接存取，且本機代理會移除或覆寫用戶端提供的身分標頭時，才啟用它。

不經過反向代理的內部閘道用戶端應使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，而不是 trusted-proxy 身分標頭。非 loopback 的 Control UI 部署仍需要明確的 `gateway.controlUi.allowedOrigins`。
</Warning>

### 設定參考

<ParamField path="gateway.trustedProxies" type="string[]" required>
  要信任的代理 IP 位址（或 CIDR）陣列。來自其他 IP 的請求會被拒絕。
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
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  對同主機 loopback 反向代理的明確啟用支援。
</ParamField>

<Warning>
只有當本機反向代理是預期的信任邊界時，才啟用 `allowLoopback`。任何可連線到閘道的本機程序都能嘗試傳送代理身分標頭，因此請將直接閘道存取限制為主機私有，並要求代理擁有的標頭，例如 `x-forwarded-proto`，或在你的代理支援時使用簽署的斷言標頭。
</Warning>

## Control UI 配對行為

當 `gateway.auth.mode = "trusted-proxy"` 啟用且請求通過 trusted-proxy 檢查時，Control UI WebSocket 工作階段可在沒有裝置配對身分的情況下連線。

範圍影響：

- 無裝置的 Control UI WebSocket 工作階段可以連線，但預設不會收到任何操作員範圍。OpenClaw 會將要求的範圍清單清空為 `[]`，因此未繫結到已核准配對裝置／權杖的工作階段無法自行宣告權限。
- 如果 WebSocket 成功連線後方法因 `missing scope` 失敗，請使用 HTTPS，讓瀏覽器可以產生裝置身分並完成配對。請參閱 [Control UI 不安全 HTTP](/zh-TW/web/control-ui#insecure-http)。
- 只限緊急破窗：`gateway.controlUi.dangerouslyDisableDeviceAuth=true` 會在沒有裝置身分時仍保留要求的範圍。這是嚴重的安全性降級；請快速還原。請參閱 [Control UI 不安全 HTTP](/zh-TW/web/control-ui#insecure-http)。

反向代理範圍上限：如果你的代理在 Control UI WebSocket 升級請求上傳送 `x-openclaw-scopes`，OpenClaw 會將工作階段範圍限制為要求範圍與宣告範圍的交集。此標頭不會授予範圍；它只會縮小工作階段可持有的範圍。

影響：

- 在此模式中，配對不再是 Control UI 存取的主要閘門。
- 你的反向代理驗證政策與 `allowUsers` 會成為有效的存取控制。
- 保持閘道入口只鎖定受信任代理 IP（`gateway.trustedProxies` + 防火牆）。

自訂 WebSocket 用戶端不是 Control UI 工作階段。`gateway.controlUi.dangerouslyDisableDeviceAuth` 不會將範圍授予任意 `client.mode: "backend"` 或形似命令列介面的用戶端。自訂自動化應使用裝置身分／配對、保留的 direct-local `client.id: "gateway-client"` 後端輔助路徑，或在 HTTP 請求／回應介面更適合時使用 [admin HTTP RPC 外掛](/zh-TW/plugins/admin-http-rpc)。

## 操作員範圍標頭

Trusted-proxy 驗證是一種**承載身分**的 HTTP 模式，因此呼叫端可選擇在 HTTP API 請求上以 `x-openclaw-scopes` 宣告操作員範圍。

注意：WebSocket 範圍由閘道協定握手與裝置身分繫結決定。在 Control UI WebSocket 升級請求上，`x-openclaw-scopes` 只是對協商後工作階段範圍的上限，而不是授予。請參閱 [Control UI 配對行為](#control-ui-pairing-behavior)。

範例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行為：

- 當標頭存在時，OpenClaw 會採用宣告的範圍集合。
- 當標頭存在但為空時，請求會宣告**沒有**操作員範圍。
- 當標頭不存在時，標準承載身分的 HTTP API 會 fallback 到標準操作員預設範圍集合（`operator.admin`、`operator.read`、`operator.write`、`operator.approvals`、`operator.pairing`、`operator.talk.secrets`）。
- 閘道驗證的**外掛 HTTP 路由**預設更窄：當 `x-openclaw-scopes` 不存在時，其執行階段範圍只會 fallback 到 `operator.write`。
- 即使 trusted-proxy 驗證成功，瀏覽器來源的 HTTP 請求仍必須通過 `gateway.controlUi.allowedOrigins`（或刻意使用的 Host 標頭 fallback 模式）。

實務規則：當你想讓 trusted-proxy 請求比預設更窄，或當 gateway-auth 外掛路由需要比寫入範圍更強的權限時，請明確傳送 `x-openclaw-scopes`。

## TLS 終止與 HSTS

使用一個 TLS 終止點，並在該處套用 HSTS。

<Tabs>
  <Tab title="代理 TLS 終止（建議）">
    當你的反向代理為 `https://control.example.com` 處理 HTTPS 時，請在該網域的代理上設定 `Strict-Transport-Security`。

    - 適合面向網際網路的部署。
    - 將憑證與 HTTP 強化政策保留在同一處。
    - OpenClaw 可在代理後方保持使用 loopback HTTP。

    標頭值範例：

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="閘道 TLS 終止">
    如果 OpenClaw 本身直接提供 HTTPS（沒有終止 TLS 的代理），請設定：

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

    `strictTransportSecurity` 接受字串標頭值，或以 `false` 明確停用。

  </Tab>
</Tabs>

### 推出指引

- 驗證流量時，先從較短的 max age 開始（例如 `max-age=300`）。
- 只有在信心很高後，才增加到長效值（例如 `max-age=31536000`）。
- 只有在每個子網域都已準備好 HTTPS 時，才加入 `includeSubDomains`。
- 只有在你刻意滿足完整網域集合的 preload 要求時，才使用 preload。
- 只使用 loopback 的本機開發無法受益於 HSTS。

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
  <Accordion title="搭配 OAuth 的 Caddy">
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

    ```caddy
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

如果也設定了共享權杖（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_TOKEN`），閘道啟動會拒絕 trusted-proxy 驗證。兩者互斥，因為共享權杖會讓同主機呼叫端透過完全不同於此模式要強制使用的代理驗證身分路徑來驗證。

如果啟動失敗並出現類似 `gateway auth mode is trusted-proxy, but a shared token is also configured` 的錯誤：

- 使用 trusted-proxy 模式時移除共享權杖，或
- 如果你打算使用權杖式驗證，請將 `gateway.auth.mode` 切換為 `"token"`。

local loopback trusted-proxy 身分標頭仍會以失敗關閉處理：同主機呼叫端不會被靜默驗證為代理使用者。繞過代理的 OpenClaw 內部呼叫端可以改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 驗證。權杖後援在 trusted-proxy 模式中仍有意不支援。

## 安全檢查清單

啟用 trusted-proxy 驗證前，請確認：

- [ ] **代理是唯一路徑**：閘道連接埠已由防火牆封鎖，只有你的代理可以存取。
- [ ] **trustedProxies 最小化**：只包含實際代理 IP，不要包含整個子網路。
- [ ] **local loopback 代理來源是有意設定**：除非為同主機代理明確啟用 `gateway.auth.trustedProxy.allowLoopback`，否則 trusted-proxy 驗證會對 local loopback 來源請求以失敗關閉處理。
- [ ] **代理會移除標頭**：你的代理會覆寫（而不是附加）來自用戶端的 `x-forwarded-*` 標頭。
- [ ] **TLS 終止**：你的代理處理 TLS；使用者透過 HTTPS 連線。
- [ ] **allowedOrigins 是明確的**：非 local loopback 控制 UI 使用明確的 `gateway.controlUi.allowedOrigins`。
- [ ] **已設定 allowUsers**（建議）：限制為已知使用者，而不是允許任何已驗證者。
- [ ] **沒有混合權杖設定**：不要同時設定 `gateway.auth.token` 和 `gateway.auth.mode: "trusted-proxy"`。
- [ ] **本機密碼後援是私有的**：如果你為內部直接呼叫端設定 `gateway.auth.password`，請保持閘道連接埠受防火牆保護，讓非代理的遠端用戶端無法直接連上。

## 安全稽核

`openclaw security audit` 會將 trusted-proxy 驗證標記為 **嚴重** 層級發現。這是有意為之；它是在提醒你正在把安全性委派給你的代理設定。

稽核會檢查：

- 基本 `gateway.trusted_proxy_auth` 警告／嚴重提醒。
- 缺少 `trustedProxies` 設定。
- 缺少 `userHeader` 設定。
- 空的 `allowUsers`（允許任何已驗證使用者）。
- 為同主機代理來源啟用了 `allowLoopback`。

每當控制 UI 對外暴露時，也會套用個別的非 trusted-proxy 專屬發現：萬用字元或缺少 `gateway.controlUi.allowedOrigins`，以及 Host 標頭來源後援。

## 疑難排解

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    請求不是來自 `gateway.trustedProxies` 中的 IP。請檢查：

    - 代理 IP 是否正確？（Docker 容器 IP 可能會變更。）
    - 你的代理前面是否有負載平衡器？
    - 使用 `docker inspect` 或 `kubectl get pods -o wide` 找出實際 IP。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw 拒絕了 local loopback 來源的 trusted-proxy 請求。

    請檢查：

    - 代理是否從 `127.0.0.1` / `::1` 連線？
    - 你是否嘗試搭配同主機 local loopback 反向代理使用 trusted-proxy 驗證？

    修正方式：

    - 對於未經由代理的內部同主機用戶端，優先使用權杖／密碼驗證，或
    - 透過非 local loopback 的受信任代理位址路由，並將該 IP 保留在 `gateway.trustedProxies` 中，或
    - 對於有意設定的同主機反向代理，設定 `gateway.auth.trustedProxy.allowLoopback = true`，將 local loopback 位址保留在 `gateway.trustedProxies` 中，並確認代理會移除或覆寫身分標頭。

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    請求來源 IP 符合閘道主機自身的其中一個非 local loopback 網路介面位址（不是代理），這是防止 tailnet 或 Docker bridge 網路上偽造同主機流量的保護機制。`..._check_failed` 表示介面探索本身發生錯誤，因此 OpenClaw 會以失敗關閉處理。

    請檢查：

    - 閘道主機上的程序是否正在繞過代理，直接傳送身分標頭？
    - 代理是否與閘道在相同網路命名空間中執行，且其 IP 也顯示為本機介面？

    修正方式：透過不會同時綁定在閘道主機本機上的位址路由代理流量，或只在真正的同主機代理設定中使用 `allowLoopback`。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    使用者標頭為空或缺失。請檢查：

    - 你的代理是否已設定為傳遞身分標頭？
    - 標頭名稱是否正確？（不區分大小寫，但拼字很重要）
    - 使用者是否真的已在代理完成驗證？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    缺少必要標頭。請檢查：

    - 你的代理對這些特定標頭的設定。
    - 標頭是否在鏈路中的某處被移除。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    使用者已驗證，但不在 `allowUsers` 中。請加入該使用者或移除允許清單。
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` 是 `"trusted-proxy"`，但 `gateway.trustedProxies` 為空，或 `gateway.auth.trustedProxy` 本身缺失。在兩者都設定之前，所有請求都會被拒絕。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy 驗證成功，但瀏覽器 `Origin` 標頭未通過控制 UI 來源檢查。

    請檢查：

    - `gateway.controlUi.allowedOrigins` 包含確切的瀏覽器來源。
    - 除非你有意允許全部行為，否則不要依賴萬用字元來源。
    - 如果你有意使用 Host 標頭後援模式，請確認已刻意設定 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`。

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket 已連線，但 `chat.history`、`sessions.list` 或
    `models.list` 失敗並顯示 `missing scope: operator.read`。

    常見原因：

    - 無裝置的控制 UI 工作階段：trusted-proxy 驗證可以在沒有裝置身分的情況下允許 WebSocket 連線，但 OpenClaw 依設計會清除無裝置工作階段的作用域。
    - 自訂後端用戶端：`gateway.controlUi.dangerouslyDisableDeviceAuth` 的範圍限定於控制 UI，且不會授予任意後端或命令列介面形狀的 WebSocket 用戶端作用域。
    - 過度狹窄的 `x-openclaw-scopes`：如果你的代理在控制 UI WebSocket 升級請求上注入此標頭，工作階段作用域會被限制為該集合。空的標頭值會導致沒有任何作用域。

    修正方式：

    - 對於控制 UI，使用 HTTPS，讓瀏覽器可以產生裝置身分並完成配對。
    - 對於自訂自動化，使用裝置身分／配對、保留的直接本機 `gateway-client` 後端輔助路徑，或 [admin HTTP RPC](/zh-TW/plugins/admin-http-rpc)。
    - 只將 `gateway.controlUi.dangerouslyDisableDeviceAuth: true` 作為暫時的控制 UI 緊急通道。

  </Accordion>
  <Accordion title="WebSocket still failing">
    確認你的代理：

    - 支援 WebSocket 升級（`Upgrade: websocket`、`Connection: upgrade`）。
    - 在 WebSocket 升級請求上傳遞身分標頭（不只是 HTTP）。
    - 沒有為 WebSocket 連線使用不同的驗證路徑。

  </Accordion>
</AccordionGroup>

## 從權杖驗證遷移

<Steps>
  <Step title="Configure the proxy">
    設定你的代理以驗證使用者並傳遞標頭。
  </Step>
  <Step title="Test the proxy independently">
    獨立測試代理設定（帶標頭的 curl）。
  </Step>
  <Step title="Update OpenClaw config">
    更新 OpenClaw 設定以使用 trusted-proxy 驗證。
  </Step>
  <Step title="Restart the Gateway">
    重新啟動閘道。
  </Step>
  <Step title="Test WebSocket">
    從控制 UI 測試 WebSocket 連線。
  </Step>
  <Step title="Audit">
    執行 `openclaw security audit` 並檢視發現。
  </Step>
</Steps>

## 相關

- [設定](/zh-TW/gateway/configuration) — 設定參考
- [操作員作用域](/zh-TW/gateway/operator-scopes) — 角色、作用域與核准檢查
- [遠端存取](/zh-TW/gateway/remote) — 其他遠端存取模式
- [安全性](/zh-TW/gateway/security) — 完整安全指南
- [Tailscale](/zh-TW/gateway/tailscale) — 僅限 tailnet 存取的更簡單替代方案
