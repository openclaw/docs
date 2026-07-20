---
read_when:
    - 在身分感知 Proxy 後方執行 OpenClaw
    - 在 OpenClaw 前方設定使用 OAuth 的 Pomerium、Caddy 或 nginx
    - 修正反向代理設定中的 WebSocket 1008 未授權錯誤
    - 決定要在哪裡設定 HSTS 與其他 HTTP 強化標頭
sidebarTitle: Trusted proxy auth
summary: 將閘道驗證委派給受信任的反向代理伺服器（Pomerium、Caddy、nginx + OAuth）
title: 受信任的代理伺服器驗證
x-i18n:
    generated_at: "2026-07-20T00:53:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 849824b53e518391d1a81f8a9a17320df3f42749f37d0c49b0e8b662f82b27cb
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**安全性敏感功能。** 此模式會將驗證完全委派給反向代理。設定錯誤可能會讓你的閘道遭到未經授權的存取。啟用前請仔細閱讀本頁。
</Warning>

## 適用情況

- 你在**具身分感知能力的代理伺服器**（Pomerium、Caddy + OAuth、nginx + oauth2-proxy、Traefik + forward auth）後方執行 OpenClaw。
- 你的代理伺服器會處理所有驗證，並透過標頭傳遞使用者身分。
- 你位於 Kubernetes 或容器環境中，且代理伺服器是通往閘道的唯一路徑。
- 你遇到 WebSocket `1008 unauthorized` 錯誤，因為瀏覽器無法在 WS 承載資料中傳遞權杖。

## 不適用情況

- 你的代理伺服器不會驗證使用者（僅作為 TLS 終端或負載平衡器）。
- 存在任何可繞過代理伺服器而連至閘道的路徑（防火牆漏洞、內部網路存取）。
- 你不確定代理伺服器是否會正確移除或覆寫轉送標頭。
- 你只需要個人單一使用者存取（請考慮改用 Tailscale Serve + 回送介面）。

## 運作方式

<Steps>
  <Step title="代理伺服器驗證使用者">
    你的反向代理會驗證使用者（OAuth、OIDC、SAML 等）。
  </Step>
  <Step title="代理伺服器新增身分標頭">
    代理伺服器會新增包含已驗證使用者身分的標頭（例如 `x-forwarded-user: nick@example.com`）。
  </Step>
  <Step title="閘道驗證可信任來源">
    OpenClaw 會檢查要求是否來自**可信任的代理 IP**（`gateway.trustedProxies`），且來源不是閘道自身的回送位址或本機介面位址。
  </Step>
  <Step title="閘道擷取身分">
    OpenClaw 會讀取必要標頭，接著從設定的標頭讀取使用者身分。
  </Step>
  <Step title="授權">
    若所有檢查皆通過，且使用者通過 `allowUsers`（如有設定），要求即獲授權。
  </Step>
</Steps>

## 設定

```json5
{
  gateway: {
    // 可信任代理驗證預設要求代理的來源 IP 不是回送位址
    bind: "lan",

    // 重要：此處只能新增代理伺服器的 IP
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 包含已驗證使用者身分的標頭（必要）
        userHeader: "x-forwarded-user",

        // 選用：必須存在的標頭（代理伺服器驗證）
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 選用：限制為特定使用者（空白 = 全部允許）
        allowUsers: ["nick@example.com", "admin@company.org"],

        // 選用：明確選擇啟用後，允許同一主機上的回送代理
        allowLoopback: false,

        // 選用：允許已驗證的代理使用者註冊新的瀏覽器裝置
        deviceAutoApprove: {
          enabled: false,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

<Warning>
**執行階段規則，依評估順序排列**

1. 要求的來源 IP 必須符合 `gateway.trustedProxies`（支援 CIDR），否則會遭拒絕（`trusted_proxy_untrusted_source`）。
2. 除非 `gateway.auth.trustedProxy.allowLoopback = true`，且回送位址也位於 `trustedProxies` 中，否則會拒絕回送來源要求（`127.0.0.1`、`::1`）（`trusted_proxy_loopback_source`）。此檢查會在標頭檢查前執行，因此即使必要標頭也有所缺漏，回送來源仍會以此方式失敗。
3. 若非回送來源符合閘道主機自身的其中一個本機網路介面位址，系統會將其視為偽造並加以拒絕（`trusted_proxy_local_interface_source`）。如果介面探索本身失敗，要求也會遭拒絕（`trusted_proxy_local_interface_check_failed`）。
4. `requiredHeaders` 和 `userHeader` 必須存在且不得為空白。
5. 若 `allowUsers` 非空白，則必須包含擷取出的使用者。

**針對本機直接備援，轉送標頭證據優先於回送位址的本機性。** 如果要求從回送位址送達，但帶有 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 標頭，這項證據會使其不符合本機直接密碼備援及裝置身分管制的資格，即使其仍會因為是回送來源而無法通過可信任代理驗證。

`allowLoopback` 對閘道主機上本機程序的信任程度與反向代理相同。只有在閘道仍受到防火牆保護而無法從遠端直接存取，且本機代理會移除或覆寫用戶端提供的身分標頭時，才可啟用。

不會經過反向代理的內部閘道用戶端應使用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`，而非可信任代理身分標頭。非回送介面的 Control UI 部署仍需明確設定 `gateway.controlUi.allowedOrigins`。
</Warning>

### 設定參考

<ParamField path="gateway.trustedProxies" type="string[]" required>
  要信任的代理伺服器 IP 位址（或 CIDR）陣列。來自其他 IP 的要求會遭拒絕。
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  必須是 `"trusted-proxy"`。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  包含已驗證使用者身分的標頭名稱。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  要求必須存在，該要求才會受信任的其他標頭。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  使用者身分允許清單。空白表示允許所有已驗證的使用者。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  選擇啟用同一主機上的回送反向代理支援。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.enabled" type="boolean" default="false">
  在可信任代理驗證後，自動核准新的 Control UI 和 WebChat 裝置身分。
</ParamField>
<ParamField path="gateway.auth.trustedProxy.deviceAutoApprove.scopes" type="string[]" default='["operator.read", "operator.write", "operator.approvals"]'>
  授予自動核准瀏覽器裝置的最大範圍。明確列出 `operator.admin` 會讓每位經代理驗證的使用者都能要求自動取得完整管理員裝置授權、讓未指定範圍的要求自動取得完整管理員權限，並觸發「嚴重」等級的 `gateway.trusted_proxy_device_auto_approve_admin` 安全稽核發現及閘道啟動警告。
</ParamField>

<Warning>
只有在本機反向代理是預期的信任邊界時，才可啟用 `allowLoopback`。任何能連線至閘道的本機程序都可以嘗試傳送代理身分標頭，因此請將閘道直接存取限制為主機私有，並要求代理擁有的標頭，例如 `x-forwarded-proto`；若代理支援，也可要求已簽署的聲明標頭。
</Warning>

## 自動核准裝置

可信任代理驗證可選擇使用代理身分作為新瀏覽器裝置的核准邊界：

```json5
{
  gateway: {
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
        allowUsers: ["operator@example.com"],
        deviceAutoApprove: {
          enabled: true,
          scopes: ["operator.read", "operator.write", "operator.approvals"],
        },
      },
    },
  },
}
```

預設值為 `enabled: false`。啟用後，會套用以下所有規則：

1. WebSocket 必須已透過 `trusted-proxy` 方法完成驗證，具有非空白的使用者身分，且設定允許清單時，該身分必須通過 `allowUsers`。權杖、密碼、Tailscale 及未驗證連線絕不會使用此原則。
2. 只有新的 Control UI 或 WebChat 瀏覽器裝置可自動核准。任何現有裝置的要求（包括範圍升級）都會維持待處理狀態，等待透過 `openclaw devices approve <requestId>` 手動核准。
3. 裝置會以角色 `operator` 獲得核准。若連線要求包含範圍，授權內容為要求範圍與 `deviceAutoApprove.scopes` 的精確交集。若要求省略範圍，則授予設定的清單；若省略該清單，預設為 `operator.read`、`operator.write` 和 `operator.approvals`。若連線中有 [`x-openclaw-scopes`](#control-ui-pairing-behavior) 代理標頭，產生的授權會進一步受到該標頭限制，因此代理縮減使用者範圍時，限制的不只是工作階段，也包括**持續性**裝置授權；標頭存在但內容為空白時，不會授予任何範圍。即使用戶端省略自己的範圍清單，此限制仍然適用。
4. 只有在 `deviceAutoApprove.scopes` 中明確列出時，才允許 `operator.admin`。列出後，每位經代理驗證的使用者都能在新瀏覽器裝置上要求並自動取得完整管理員權限；未指定範圍的要求會自動取得完整管理員權限。`openclaw security audit` 會回報「嚴重」等級的 `gateway.trusted_proxy_device_auto_approve_admin` 發現，且閘道會在啟動時記錄一次警告。在每個身分各自的角色可用之前，建議改用 `openclaw devices approve` 或 `openclaw devices rotate` 手動核准管理員權限。

<Warning>
啟用此選項會將新瀏覽器裝置的註冊完全委派給反向代理身分。遭入侵的代理帳號可以註冊具備所有已設定範圍的持續性裝置。列出 `operator.admin` 會使該裝置在未經手動核准的情況下成為完整管理員。請確保只有透過代理才能連至閘道、要求使用強式代理驗證、覆寫身分標頭，並使用範圍受限的 `allowUsers` 清單。
</Warning>

## Control UI 配對行為

啟用 `gateway.auth.mode = "trusted-proxy"` 且要求通過可信任代理檢查時，Control UI WebSocket 工作階段可在沒有裝置配對身分的情況下連線。

範圍影響：

- 沒有裝置身分的 Control UI WebSocket 工作階段可以連線，但預設不會取得任何操作者範圍。OpenClaw 會將要求的範圍清單清除為 `[]`，避免未綁定至已核准配對裝置／權杖的工作階段自行宣告權限。
- 若 WebSocket 成功連線後，方法因 `missing scope` 而失敗，請使用 HTTPS，讓瀏覽器可產生裝置身分並完成配對。請參閱 [Control UI 的不安全 HTTP](/zh-TW/web/control-ui#insecure-http)。
- 僅限緊急處置：即使沒有裝置身分，`gateway.controlUi.dangerouslyDisableDeviceAuth=true` 仍會保留要求的範圍。這會嚴重降低安全性；請儘速還原。請參閱 [Control UI 的不安全 HTTP](/zh-TW/web/control-ui#insecure-http)。

反向代理範圍上限：如果代理伺服器在 Control UI WebSocket 升級要求中傳送 `x-openclaw-scopes`，OpenClaw 會將工作階段範圍限制為要求範圍與宣告範圍的交集。此標頭不會授予範圍，只會縮減工作階段可持有的範圍。當 `deviceAutoApprove.enabled` 為 true 時，相同的上限也會套用至由[自動核准裝置](#automatic-device-approval)寫入的持續性裝置授權，因此自動核准的裝置所持範圍絕不會超過代理宣告的範圍。

影響：

- 配對不再是無裝置身分 Control UI 存取的主要關卡。當 `deviceAutoApprove.enabled` 為 true 時，代理身分也會成為新瀏覽器裝置註冊的核准關卡。
- 你的反向代理驗證原則與 `allowUsers` 會成為實際的存取控制。
- 請將閘道輸入流量限制為僅允許可信任的代理 IP（`gateway.trustedProxies` + 防火牆）。

自訂 WebSocket 用戶端並非 Control UI 工作階段。`gateway.controlUi.dangerouslyDisableDeviceAuth` 不會向任意 `client.mode: "backend"` 或命令列介面形式的用戶端授予範圍。自訂自動化應使用裝置身分／配對、保留的本機直接 `client.id: "gateway-client"` 後端輔助程式路徑，或在 HTTP 要求／回應介面更合適時使用[管理員 HTTP RPC 外掛](/zh-TW/plugins/admin-http-rpc)。

## 操作者範圍標頭

受信任的 Proxy 驗證是一種**帶有身分資訊**的 HTTP 模式，因此呼叫者可選擇在 HTTP API 請求中使用 `x-openclaw-scopes` 宣告操作者範圍。

注意：WebSocket 範圍由閘道通訊協定交握與裝置身分綁定決定。在 Control UI WebSocket 升級請求中，`x-openclaw-scopes` 僅是協商工作階段範圍的上限，而不是授權。請參閱 [Control UI 配對行為](#control-ui-pairing-behavior)。

範例：

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

行為：

- 當標頭存在時，OpenClaw 會採用所宣告的範圍集合。
- 當標頭存在但為空時，該請求宣告**沒有**操作者範圍。
- 當標頭不存在時，一般帶有身分資訊的 HTTP API 會退回使用標準操作者預設範圍集合（`operator.admin`、`operator.read`、`operator.write`、`operator.approvals`、`operator.pairing`、`operator.talk.secrets`）。
- 閘道驗證的**外掛 HTTP 路由**預設範圍較窄：當 `x-openclaw-scopes` 不存在時，其執行階段範圍僅退回使用 `operator.write`。
- 即使受信任的 Proxy 驗證成功，來自瀏覽器來源的 HTTP 請求仍須通過 `gateway.controlUi.allowedOrigins`（或刻意啟用的 Host 標頭備援模式）。

實用規則：若要讓受信任的 Proxy 請求範圍比預設值更窄，或閘道驗證的外掛路由需要比寫入範圍更強的權限，請明確傳送 `x-openclaw-scopes`。

## TLS 終止與 HSTS

請使用單一 TLS 終止點，並在該處套用 HSTS。

<Tabs>
  <Tab title="Proxy TLS 終止（建議）">
    當反向 Proxy 為 `https://control.example.com` 處理 HTTPS 時，請在 Proxy 上為該網域設定 `Strict-Transport-Security`。

    - 適合面向網際網路的部署。
    - 將憑證與 HTTP 強化政策集中在一處。
    - OpenClaw 可在 Proxy 後方繼續使用迴路 HTTP。

    標頭值範例：

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="閘道 TLS 終止">
    如果 OpenClaw 本身直接提供 HTTPS（沒有終止 TLS 的 Proxy），請設定：

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

- 驗證流量期間，請先從較短的最大存續時間開始（例如 `max-age=300`）。
- 只有在具有高度信心後，才增加為長期值（例如 `max-age=31536000`）。
- 只有在每個子網域都已支援 HTTPS 時，才加入 `includeSubDomains`。
- 只有在刻意滿足完整網域集合的預載要求時，才使用預載。
- 僅使用迴路的本機開發無法從 HSTS 獲益。

## Proxy 設定範例

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
        trustedProxies: ["10.0.0.1"], // Caddy/Sidecar Proxy IP
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

若同時設定共用權杖（`gateway.auth.token` 或 `OPENCLAW_GATEWAY_TOKEN`），閘道啟動時會拒絕受信任的 Proxy 驗證。兩者互斥，因為共用權杖會讓同一主機上的呼叫者透過與此模式預期強制執行的 Proxy 驗證身分完全不同的路徑進行驗證。

如果啟動失敗並顯示類似 `gateway auth mode is trusted-proxy, but a shared token is also configured` 的錯誤：

- 使用受信任的 Proxy 模式時，請移除共用權杖，或
- 如果你要使用權杖式驗證，請將 `gateway.auth.mode` 切換為 `"token"`。

迴路上的受信任 Proxy 身分標頭仍會採取失敗關閉：同一主機上的呼叫者不會被默認驗證為 Proxy 使用者。略過 Proxy 的 OpenClaw 內部呼叫者可改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` 進行驗證。在受信任的 Proxy 模式下，權杖備援仍刻意不受支援。

## 安全性檢查清單

啟用受信任的 Proxy 驗證前，請確認：

- [ ] **Proxy 是唯一路徑**：閘道連接埠的防火牆只允許你的 Proxy 存取。
- [ ] **trustedProxies 維持最小範圍**：只包含你的實際 Proxy IP，而非整個子網路。
- [ ] **刻意使用迴路 Proxy 來源**：除非為同一主機的 Proxy 明確啟用 `gateway.auth.trustedProxy.allowLoopback`，否則來自迴路來源的請求會使受信任的 Proxy 驗證採取失敗關閉。
- [ ] **Proxy 會移除標頭**：你的 Proxy 會覆寫（而非附加）來自用戶端的 `x-forwarded-*` 標頭。
- [ ] **TLS 終止**：你的 Proxy 會處理 TLS；使用者透過 HTTPS 連線。
- [ ] **明確設定 allowedOrigins**：非迴路的 Control UI 使用明確的 `gateway.controlUi.allowedOrigins`。
- [ ] **已設定 allowUsers**（建議）：僅允許已知使用者，而非允許任何已驗證的使用者。
- [ ] **沒有混合權杖設定**：不要同時設定 `gateway.auth.token` 與 `gateway.auth.mode: "trusted-proxy"`。
- [ ] **本機密碼備援保持私密**：如果你為內部直接呼叫者設定 `gateway.auth.password`，請使用防火牆保護閘道連接埠，避免未經 Proxy 的遠端用戶端直接存取。
- [ ] **刻意啟用裝置自動核准**：如果 `deviceAutoApprove.enabled` 為 true，請將反向 Proxy 帳戶安全性視為裝置註冊邊界，並讓授予的範圍清單保持非管理員且最小化。

## 安全性稽核

`openclaw security audit` 會以**重大**嚴重性發現標記受信任的 Proxy 驗證。這是刻意設計；用以提醒你已將安全性委派給 Proxy 設定。

稽核會檢查：

- 基本 `gateway.trusted_proxy_auth` 警告／重大提醒。
- 缺少 `trustedProxies` 設定。
- 缺少 `userHeader` 設定。
- 空白的 `allowUsers`（允許任何已驗證的使用者）。
- 已為同一主機的 Proxy 來源啟用 `allowLoopback`。
- 已啟用瀏覽器裝置自動核准（將新裝置配對委派給 Proxy 身分）。

只要 Control UI 對外公開，其他與受信任 Proxy 無關的個別發現也同樣適用：萬用字元或缺少 `gateway.controlUi.allowedOrigins`，以及 Host 標頭來源備援。

## 疑難排解

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    請求並非來自 `gateway.trustedProxies` 中的 IP。請檢查：

    - Proxy IP 是否正確？（Docker 容器 IP 可能會變更。）
    - 你的 Proxy 前方是否有負載平衡器？
    - 使用 `docker inspect` 或 `kubectl get pods -o wide` 找出實際 IP。

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw 拒絕了來自迴路來源的受信任 Proxy 請求。

    請檢查：

    - Proxy 是否從 `127.0.0.1` / `::1` 連線？
    - 你是否嘗試搭配同一主機上的迴路反向 Proxy 使用受信任的 Proxy 驗證？

    修正方式：

    - 對於未經 Proxy 的內部同主機用戶端，優先使用權杖／密碼驗證，或
    - 透過非迴路的受信任 Proxy 位址路由，並將該 IP 保留在 `gateway.trustedProxies` 中，或
    - 若刻意使用同一主機上的反向 Proxy，請設定 `gateway.auth.trustedProxy.allowLoopback = true`、將迴路位址保留在 `gateway.trustedProxies` 中，並確保 Proxy 會移除或覆寫身分標頭。

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    請求的來源 IP 符合閘道主機本身的其中一個非迴路網路介面位址（而非 Proxy）；這項防護可避免在 Tailnet 或 Docker 橋接網路上偽造同一主機流量。`..._check_failed` 表示介面探索本身發生錯誤，因此 OpenClaw 會採取失敗關閉。

    請檢查：

    - 閘道主機本身是否有程序略過 Proxy，直接傳送身分標頭？
    - Proxy 是否與閘道在相同的網路命名空間中執行，且其 IP 也顯示為本機介面？

    修正方式：透過並未同時繫結至閘道主機本機的位址路由 Proxy 流量，或僅針對真正的同一主機 Proxy 設定使用 `allowLoopback`。

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    使用者標頭為空或不存在。請檢查：

    - 你的 Proxy 是否已設定為傳遞身分標頭？
    - 標頭名稱是否正確？（不區分大小寫，但拼字必須正確）
    - 使用者是否確實已在 Proxy 完成驗證？

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    必要標頭不存在。請檢查：

    - 這些特定標頭的 Proxy 設定。
    - 標頭是否在傳遞鏈中的某處遭到移除。

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    使用者已通過驗證，但不在 `allowUsers` 中。請將其加入，或移除允許清單。
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` 為 `"trusted-proxy"`，但 `gateway.trustedProxies` 是空的，或缺少 `gateway.auth.trustedProxy` 本身。在兩者皆設定完成前，所有要求都會遭到拒絕。
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    受信任 Proxy 驗證成功，但瀏覽器的 `Origin` 標頭未通過 Control UI 的來源檢查。

    請檢查：

    - `gateway.controlUi.allowedOrigins` 包含確切的瀏覽器來源。
    - 除非你刻意需要允許全部的行為，否則請勿依賴萬用字元來源。
    - 如果你刻意使用 Host 標頭後援模式，請確認 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` 是經過審慎考量後設定的。

  </Accordion>
  <Accordion title="連線成功，但方法回報缺少範圍">
    WebSocket 已連線，但 `chat.history`、`sessions.list` 或
    `models.list` 因 `missing scope: operator.read` 而失敗。

    常見原因：

    - 沒有裝置身分的 Control UI 工作階段：受信任 Proxy 驗證可以在沒有裝置身分的情況下允許 WebSocket 連線，但 OpenClaw 依設計會清除沒有裝置身分之工作階段的範圍。
    - 自訂後端用戶端：`gateway.controlUi.dangerouslyDisableDeviceAuth` 僅適用於 Control UI，且不會將範圍授予任意後端或命令列介面形式的 WebSocket 用戶端。
    - 過度限縮的 `x-openclaw-scopes`：如果 Proxy 在 Control UI 的 WebSocket 升級要求中注入此標頭，工作階段範圍將受限於該集合。空白標頭值不會產生任何範圍。

    修正方式：

    - 對於 Control UI，請使用 HTTPS，讓瀏覽器可以產生裝置身分並完成配對。
    - 對於自訂自動化，請使用裝置身分／配對、保留的直接本機 `gateway-client` 後端輔助程式路徑，或[管理員 HTTP RPC](/zh-TW/plugins/admin-http-rpc)。
    - 僅將 `gateway.controlUi.dangerouslyDisableDeviceAuth: true` 作為暫時的 Control UI 緊急存取途徑。

  </Accordion>
  <Accordion title="WebSocket 仍然失敗">
    請確定你的 Proxy：

    - 支援 WebSocket 升級（`Upgrade: websocket`、`Connection: upgrade`）。
    - 在 WebSocket 升級要求中傳遞身分標頭（而非僅在 HTTP 中傳遞）。
    - 沒有為 WebSocket 連線使用獨立的驗證路徑。

  </Accordion>
</AccordionGroup>

## 從權杖驗證遷移

<Steps>
  <Step title="設定 Proxy">
    設定 Proxy 以驗證使用者並傳遞標頭。
  </Step>
  <Step title="獨立測試 Proxy">
    獨立測試 Proxy 設定（使用帶有標頭的 curl）。
  </Step>
  <Step title="更新 OpenClaw 設定">
    使用受信任 Proxy 驗證更新 OpenClaw 設定。
  </Step>
  <Step title="重新啟動閘道">
    重新啟動閘道。
  </Step>
  <Step title="測試 WebSocket">
    從 Control UI 測試 WebSocket 連線。
  </Step>
  <Step title="稽核">
    執行 `openclaw security audit` 並檢閱結果。
  </Step>
</Steps>

## 相關內容

- [設定](/zh-TW/gateway/configuration) — 設定參考
- [操作員範圍](/zh-TW/gateway/operator-scopes) — 角色、範圍與核准檢查
- [遠端存取](/zh-TW/gateway/remote) — 其他遠端存取模式
- [安全性](/zh-TW/gateway/security) — 完整安全性指南
- [Tailscale](/zh-TW/gateway/tailscale) — 僅限 tailnet 存取的更簡單替代方案
