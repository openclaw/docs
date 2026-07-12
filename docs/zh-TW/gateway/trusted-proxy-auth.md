---
read_when:
    - 在具身分感知功能的代理伺服器後方執行 OpenClaw
    - 在 OpenClaw 前端設定採用 OAuth 的 Pomerium、Caddy 或 nginx
    - 修正反向代理設定中的 WebSocket 1008 未授權錯誤
    - 決定要在哪裡設定 HSTS 與其他 HTTP 強化標頭
sidebarTitle: Trusted proxy auth
summary: 將閘道驗證委派給受信任的反向代理伺服器（Pomerium、Caddy、nginx + OAuth）
title: 受信任的代理伺服器驗證
x-i18n:
    generated_at: "2026-07-11T21:25:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**安全性敏感功能。** 此模式會將驗證完全委派給您的反向代理。設定錯誤可能使您的閘道遭到未經授權的存取。啟用前請仔細閱讀本頁。
</Warning>

## 適用時機

- 您在**具身分識別能力的代理**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）後方執行 OpenClaw。
- 您的代理會處理所有驗證，並透過標頭傳遞使用者身分。
- 您位於 Kubernetes 或容器環境中，且只能透過代理連線至閘道。
- 您遇到 WebSocket `1008 unauthorized` 錯誤，因為瀏覽器無法在 WS 承載資料中傳遞權杖。

## 不適用時機

- 您的代理不會驗證使用者（僅作為 TLS 終止點或負載平衡器）。
- 有任何可繞過代理存取閘道的路徑（防火牆漏洞、內部網路存取）。
- 您不確定代理是否會正確移除或覆寫轉送標頭。
- 您只需要個人單一使用者存取（請考慮改用 Tailscale Serve + local loopback）。

## 運作方式

<Steps>
  <Step title="代理驗證使用者">
    您的反向代理會驗證使用者（OAuth、OIDC、SAML 等）。
  </Step>
  <Step title="代理加入身分標頭">
    代理會加入包含已驗證使用者身分的標頭（例如 `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="閘道驗證受信任的來源">
    OpenClaw 會檢查要求是否來自**受信任的代理 IP**（`gateway.trustedProxies`），並確認其不是閘道本身的回送位址或本機介面位址。
  </Step>
  <Step title="閘道擷取身分">
    OpenClaw 會先讀取必要標頭，再從設定的標頭中讀取使用者身分。
  </Step>
  <Step title="授權">
    若所有檢查皆通過，且使用者也通過 `allowUsers`（如有設定），則會授權此要求。
  </Step>
</Steps>

## 設定

```json5
{
  gateway: {
    // 受信任代理驗證預設要求代理的來源 IP 不是回送位址
    bind: "lan",

    // 重要：此處只能加入代理的 IP
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 包含已驗證使用者身分的標頭（必要）
        userHeader: "x-forwarded-user",

        // 選用：必須存在的標頭（代理驗證）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 選用：限制為特定使用者（空白 = 全部允許）
        allowUsers: ["nick@example.com", "admin@company.org"],

        // 選用：明確選擇啟用後，允許同一主機上的回送代理
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**執行階段規則（依評估順序）**

1. 要求的來源 IP 必須符合 `gateway.trustedProxies`（支援 CIDR），否則會遭到拒絕（`trusted_proxy_untrusted_source`）。
2. 除非 `gateway.auth.trustedProxy.allowLoopback = true` 且該回送位址也在 `trustedProxies` 中，否則來自回送位址（`127.0.0.1`、`::1`）的要求會遭到拒絕（`trusted_proxy_loopback_source`）。此檢查會在標頭檢查之前執行，因此即使必要標頭也缺失，回送來源仍會以此原因失敗。
3. 若非回送來源符合閘道主機本身的其中一個本機網路介面位址，則會將其視為防偽冒保護而拒絕（`trusted_proxy_local_interface_source`）。若介面探索本身失敗，要求也會遭到拒絕（`trusted_proxy_local_interface_check_failed`）。
4. `requiredHeaders` 和 `userHeader` 必須存在且不可為空白。
5. 若 `allowUsers` 不為空，則必須包含擷取出的使用者。

**對於本機直接連線的後備機制，轉送標頭證據優先於回送位址的本機性。** 若要求透過回送位址抵達，但帶有 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 標頭，這項證據會使其不符合本機直接密碼後備機制和裝置身分閘控的資格，即使它仍會因來源為回送位址而無法通過受信任代理驗證。

`allowLoopback` 對閘道主機上本機程序的信任程度，與對反向代理相同。只有在閘道仍受防火牆保護而無法從遠端直接存取，且本機代理會移除或覆寫用戶端提供的身分標頭時，才可啟用此選項。

不會經過反向代理的內部閘道用戶端應使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，而非受信任代理身分標頭。非回送位址的控制介面部署仍需明確設定 `gateway.controlUi.allowedOrigins`。
</Warning>

### 設定參考

<ParamField path="gateway.trustedProxies" type="string[]" required>
  要信任的代理 IP 位址（或 CIDR）陣列。來自其他 IP 的要求會遭到拒絕。
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  必須為 `"trusted-proxy"`。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  包含已驗證使用者身分的標頭名稱。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  必須存在才能信任要求的其他標頭。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  使用者身分允許清單。空白表示允許所有已驗證的使用者。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  選擇啟用同一主機上的回送反向代理支援。
</ParamField>

<Warning>
只有在本機反向代理是預期的信任邊界時，才可啟用 `allowLoopback`。任何可連線至閘道的本機程序都能嘗試傳送代理身分標頭，因此請將閘道的直接存取限制在主機內，並要求由代理掌控的標頭（例如 `x-forwarded-proto`），或在代理支援的情況下使用已簽署的聲明標頭。
</Warning>

## 控制介面配對行為

啟用 `gateway.auth.mode = "trusted-proxy"` 且要求通過受信任代理檢查時，控制介面的 WebSocket 工作階段無需裝置配對身分即可連線。

範圍影響：

- 無裝置的控制介面 WebSocket 工作階段可以連線，但預設不會取得任何操作員範圍。OpenClaw 會將要求的範圍清單清除為 `[]`，因此未繫結至已核准配對裝置／權杖的工作階段無法自行宣告權限。
- 若 WebSocket 成功連線後，方法因 `missing scope` 而失敗，請使用 HTTPS，讓瀏覽器能產生裝置身分並完成配對。請參閱[控制介面的不安全 HTTP](/zh-TW/web/control-ui#insecure-http)。
- 僅供緊急使用：即使沒有裝置身分，`gateway.controlUi.dangerouslyDisableDeviceAuth=true` 仍會保留要求的範圍。這會嚴重降低安全性；請儘快還原。請參閱[控制介面的不安全 HTTP](/zh-TW/web/control-ui#insecure-http)。

反向代理範圍上限：若代理在控制介面的 WebSocket 升級要求中傳送 `x-openclaw-scopes`，OpenClaw 會將工作階段範圍限制為要求範圍與宣告範圍的交集。此標頭不會授予範圍，只會縮減工作階段可持有的範圍。

影響：

- 在此模式下，配對不再是控制介面存取的主要閘門。
- 您的反向代理驗證政策和 `allowUsers` 會成為實際的存取控制。
- 僅允許受信任的代理 IP 進入閘道（`gateway.trustedProxies` + 防火牆）。

自訂 WebSocket 用戶端不是控制介面工作階段。`gateway.controlUi.dangerouslyDisableDeviceAuth` 不會將範圍授予任意 `client.mode: "backend"` 或命令列介面形式的用戶端。自訂自動化應使用裝置身分／配對、保留的本機直接 `client.id: "gateway-client"` 後端輔助路徑，或在 HTTP 要求／回應介面更合適時使用[管理 HTTP RPC 外掛](/zh-TW/plugins/admin-http-rpc)。

## 操作員範圍標頭

受信任代理驗證是**帶有身分資訊**的 HTTP 模式，因此呼叫端可選擇在 HTTP API 要求中使用 `x-openclaw-scopes` 宣告操作員範圍。

注意：WebSocket 範圍由閘道通訊協定握手與裝置身分繫結決定。在控制介面的 WebSocket 升級要求中，`x-openclaw-scopes` 只會限制協商後的工作階段範圍，而不會授予範圍。請參閱[控制介面配對行為](#control-ui-pairing-behavior)。

範例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行為：

- 若標頭存在，OpenClaw 會採用宣告的範圍集合。
- 若標頭存在但為空，則要求宣告**沒有**操作員範圍。
- 若標頭不存在，一般帶有身分資訊的 HTTP API 會後備至標準操作員預設範圍集合（`operator.admin`、`operator.read`、`operator.write`、`operator.approvals`、`operator.pairing`、`operator.talk.secrets`）。
- 閘道驗證**外掛 HTTP 路由**的預設範圍較窄：若 `x-openclaw-scopes` 不存在，其執行階段範圍只會後備至 `operator.write`。
- 即使受信任代理驗證成功，瀏覽器來源的 HTTP 要求仍須通過 `gateway.controlUi.allowedOrigins`（或刻意啟用的 Host 標頭後備模式）。

實務規則：若您希望受信任代理要求的權限比預設值更窄，或閘道驗證外掛路由需要比寫入範圍更高的權限，請明確傳送 `x-openclaw-scopes`。

## TLS 終止與 HSTS

使用單一 TLS 終止點，並在該處套用 HSTS。

<Tabs>
  <Tab title="代理 TLS 終止（建議）">
    若反向代理為 `https://control.example.com` 處理 HTTPS，請在代理上為該網域設定 `Strict-Transport-Security`。

    - 適合面向網際網路的部署。
    - 將憑證與 HTTP 強化政策集中在一處。
    - OpenClaw 可在代理後方繼續使用回送位址 HTTP。

    標頭值範例：

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="閘道 TLS 終止">
    若由 OpenClaw 本身直接提供 HTTPS（沒有終止 TLS 的代理），請設定：

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

    `strictTransportSecurity` 接受字串標頭值，也可設為 `false` 以明確停用。

  </Tab>
</Tabs>

### 推出指南

- 驗證流量時，先從較短的最長期限開始（例如 `max-age=300`）。
- 只有在具有高度信心後，才增加為長期值（例如 `max-age=31536000`）。
- 只有在每個子網域都已準備好使用 HTTPS 時，才加入 `includeSubDomains`。
- 只有在刻意符合完整網域集合的預載要求時，才使用預載。
- 僅使用回送位址的本機開發無法從 HSTS 獲益。

## 代理設定範例

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium 會在 `x-pomerium-claim-email`（或其他宣告標頭）中傳遞身分，並在 `x-pomerium-jwt-assertion` 中傳遞 JWT。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium 的 IP
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
    搭配 `caddy-security` 外掛的 Caddy 可驗證使用者並傳遞身分標頭。

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/附屬代理伺服器 IP
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
    oauth2-proxy 會驗證使用者身分，並透過 `x-auth-request-email` 傳遞身分資訊。

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
  <Accordion title="搭配轉送驗證的 Traefik">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik 容器 IP
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

如果同時設定了共用權杖（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_TOKEN`），閘道啟動時會拒絕受信任代理驗證。兩者互斥，因為共用權杖會讓同一主機上的呼叫端透過與此模式要強制執行的代理驗證身分完全不同的路徑完成驗證。

如果啟動失敗並顯示類似 `gateway auth mode is trusted-proxy, but a shared token is also configured` 的錯誤：

- 使用受信任代理模式時移除共用權杖，或
- 如果你要使用權杖式驗證，請將 `gateway.auth.mode` 切換為 `"token"`。

來自迴送位址的受信任代理身分標頭仍會採取封閉式失敗：同一主機上的呼叫端不會被默默驗證為代理使用者。繞過代理的 OpenClaw 內部呼叫端可改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 進行驗證。受信任代理模式刻意不支援權杖備援。

## 安全性檢查清單

啟用受信任代理驗證前，請確認：

- [ ] **代理是唯一路徑**：閘道連接埠透過防火牆封鎖所有來源，僅允許你的代理存取。
- [ ] **trustedProxies 維持最小範圍**：僅包含實際代理 IP，不要包含整個子網路。
- [ ] **刻意使用迴送代理來源**：除非針對同一主機上的代理明確啟用 `gateway.auth.trustedProxy.allowLoopback`，否則受信任代理驗證會拒絕來自迴送來源的請求。
- [ ] **代理會移除標頭**：你的代理會覆寫（而非附加）用戶端傳來的 `x-forwarded-*` 標頭。
- [ ] **TLS 終止**：你的代理負責處理 TLS；使用者透過 HTTPS 連線。
- [ ] **明確設定 allowedOrigins**：非迴送位址的控制介面使用明確的 `gateway.controlUi.allowedOrigins`。
- [ ] **已設定 allowUsers**（建議）：限制為已知使用者，而非允許任何已驗證的使用者。
- [ ] **沒有混合權杖設定**：不要同時設定 `gateway.auth.token` 與 `gateway.auth.mode: "trusted-proxy"`。
- [ ] **本機密碼備援保持私密**：如果你為內部直接呼叫端設定 `gateway.auth.password`，請使用防火牆封鎖閘道連接埠，避免非代理的遠端用戶端直接存取。

## 安全性稽核

`openclaw security audit` 會將受信任代理驗證標記為**嚴重**等級的問題。這是刻意的設計，用來提醒你已將安全性委派給代理設定。

稽核會檢查：

- 基本的 `gateway.trusted_proxy_auth` 警告／嚴重提醒。
- 缺少 `trustedProxies` 設定。
- 缺少 `userHeader` 設定。
- `allowUsers` 為空（允許任何已驗證的使用者）。
- 已為同一主機上的代理來源啟用 `allowLoopback`。

只要控制介面對外公開，其他與受信任代理無關的個別問題也同樣適用：`gateway.controlUi.allowedOrigins` 使用萬用字元或未設定，以及 Host 標頭來源備援。

## 疑難排解

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    請求並非來自 `gateway.trustedProxies` 中的 IP。請檢查：

    - 代理 IP 是否正確？（Docker 容器 IP 可能會變更。）
    - 你的代理前方是否有負載平衡器？
    - 使用 `docker inspect` 或 `kubectl get pods -o wide` 查詢實際 IP。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw 拒絕了來自迴送來源的受信任代理請求。

    請檢查：

    - 代理是否從 `127.0.0.1` / `::1` 連線？
    - 你是否嘗試將受信任代理驗證與同一主機上的迴送反向代理搭配使用？

    修正方式：

    - 對於未經代理的同一主機內部用戶端，優先使用權杖／密碼驗證，或
    - 透過非迴送的受信任代理位址路由，並將該 IP 保留在 `gateway.trustedProxies` 中，或
    - 若是刻意設定同一主機上的反向代理，請設定 `gateway.auth.trustedProxy.allowLoopback = true`、將迴送位址保留在 `gateway.trustedProxies` 中，並確保代理會移除或覆寫身分標頭。

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    請求的來源 IP 與閘道主機本身其中一個非迴送網路介面位址相符（而非代理），這項防護可避免 tailnet 或 Docker 橋接網路上偽造的同一主機流量。`..._check_failed` 表示介面探索本身發生錯誤，因此 OpenClaw 會採取封閉式失敗。

    請檢查：

    - 閘道主機本身的某個程序是否繞過代理，直接傳送身分標頭？
    - 代理是否與閘道在相同的網路命名空間中執行，且其 IP 也顯示為本機介面？

    修正方式：將代理流量路由至未同時繫結於閘道主機本機的位址，或僅在真正的同一主機代理設定中使用 `allowLoopback`。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    使用者標頭為空或不存在。請檢查：

    - 你的代理是否已設定為傳遞身分標頭？
    - 標頭名稱是否正確？（不區分大小寫，但拼字必須正確）
    - 使用者是否確實已在代理端完成驗證？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    缺少必要標頭。請檢查：

    - 代理中這些特定標頭的設定。
    - 標頭是否在傳遞鏈中的某處遭到移除。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    使用者已通過驗證，但不在 `allowUsers` 中。請將其加入，或移除允許清單。
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` 為 `"trusted-proxy"`，但 `gateway.trustedProxies` 是空的，或缺少 `gateway.auth.trustedProxy` 本身。在兩者都完成設定前，所有請求都會遭到拒絕。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    受信任代理驗證成功，但瀏覽器的 `Origin` 標頭未通過控制介面的來源檢查。

    請檢查：

    - `gateway.controlUi.allowedOrigins` 是否包含確切的瀏覽器來源。
    - 除非你刻意要允許所有來源，否則不要依賴萬用字元來源。
    - 如果你刻意使用 Host 標頭備援模式，請確認已特意設定 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`。

  </Accordion>
  <Accordion title="連線成功，但方法回報缺少範圍">
    WebSocket 已連線，但 `chat.history`、`sessions.list` 或
    `models.list` 因 `missing scope: operator.read` 而失敗。

    常見原因：

    - 沒有裝置身分的控制介面工作階段：受信任代理驗證可在沒有裝置身分的情況下允許 WebSocket 連線，但 OpenClaw 按設計會清除無裝置身分工作階段的範圍。
    - 自訂後端用戶端：`gateway.controlUi.dangerouslyDisableDeviceAuth` 僅適用於控制介面，不會向任意後端或命令列介面型態的 WebSocket 用戶端授予範圍。
    - `x-openclaw-scopes` 過於狹窄：如果你的代理在控制介面 WebSocket 升級請求中注入此標頭，工作階段範圍就會受限於該集合。空白標頭值代表沒有任何範圍。

    修正方式：

    - 對控制介面使用 HTTPS，讓瀏覽器能產生裝置身分並完成配對。
    - 對於自訂自動化，請使用裝置身分／配對、保留的直接本機 `gateway-client` 後端輔助程式路徑，或[管理員 HTTP RPC](/zh-TW/plugins/admin-http-rpc)。
    - 僅將 `gateway.controlUi.dangerouslyDisableDeviceAuth: true` 作為控制介面的暫時緊急繞過方式。

  </Accordion>
  <Accordion title="WebSocket 仍然失敗">
    請確認你的代理：

    - 支援 WebSocket 升級（`Upgrade: websocket`、`Connection: upgrade`）。
    - 在 WebSocket 升級請求中傳遞身分標頭（不僅是 HTTP）。
    - 沒有為 WebSocket 連線使用另一條驗證路徑。

  </Accordion>
</AccordionGroup>

## 從權杖驗證遷移

<Steps>
  <Step title="設定代理">
    設定代理以驗證使用者身分並傳遞標頭。
  </Step>
  <Step title="獨立測試代理">
    獨立測試代理設定（使用帶有標頭的 curl）。
  </Step>
  <Step title="更新 OpenClaw 設定">
    將 OpenClaw 設定更新為使用受信任代理驗證。
  </Step>
  <Step title="重新啟動閘道">
    重新啟動閘道。
  </Step>
  <Step title="測試 WebSocket">
    從控制介面測試 WebSocket 連線。
  </Step>
  <Step title="稽核">
    執行 `openclaw security audit` 並檢閱發現的問題。
  </Step>
</Steps>

## 相關內容

- [設定](/zh-TW/gateway/configuration) — 設定參考
- [操作員範圍](/zh-TW/gateway/operator-scopes) — 角色、範圍與核准檢查
- [遠端存取](/zh-TW/gateway/remote) — 其他遠端存取模式
- [安全性](/zh-TW/gateway/security) — 完整的安全性指南
- [Tailscale](/zh-TW/gateway/tailscale) — 僅限 tailnet 存取的更簡單替代方案
