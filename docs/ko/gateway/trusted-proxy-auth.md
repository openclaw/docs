---
read_when:
    - ID 인식 프록시 뒤에서 OpenClaw 실행하기
    - OpenClaw 앞단에 OAuth와 함께 Pomerium, Caddy, 또는 nginx 설정하기
    - 리버스 프록시 설정에서 WebSocket 1008 unauthorized 오류 해결하기
    - HSTS 및 기타 HTTP 보안 강화 헤더를 어디에 설정할지 결정하기
sidebarTitle: Trusted proxy auth
summary: 신뢰된 리버스 프록시(Pomerium, Caddy, nginx + OAuth)에 Gateway 인증 위임하기
title: Trusted proxy 인증
x-i18n:
    generated_at: "2026-04-26T11:31:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**보안에 민감한 기능입니다.** 이 모드는 인증을 전적으로 리버스 프록시에 위임합니다. 잘못 구성하면 승인되지 않은 접근에 Gateway가 노출될 수 있습니다. 활성화하기 전에 이 페이지를 주의 깊게 읽으세요.
</Warning>

## 사용 시점

다음과 같은 경우 `trusted-proxy` 인증 모드를 사용하세요.

- OpenClaw를 **ID 인식 프록시**(Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth) 뒤에서 실행하는 경우
- 프록시가 모든 인증을 처리하고 사용자 ID를 헤더로 전달하는 경우
- 프록시가 Gateway로 가는 유일한 경로인 Kubernetes 또는 컨테이너 환경에 있는 경우
- 브라우저가 WS 페이로드에 토큰을 전달할 수 없어 WebSocket `1008 unauthorized` 오류가 발생하는 경우

## 사용하면 안 되는 경우

- 프록시가 사용자를 인증하지 않는 경우(단순 TLS 종료기 또는 로드 밸런서)
- 프록시를 우회해 Gateway로 가는 경로가 하나라도 있는 경우(방화벽 구멍, 내부 네트워크 접근)
- 프록시가 전달된 헤더를 올바르게 제거/덮어쓰는지 확실하지 않은 경우
- 단일 사용자 개인 접근만 필요한 경우(Tailscale Serve + loopback이 더 간단할 수 있음)

## 동작 방식

<Steps>
  <Step title="프록시가 사용자를 인증">
    리버스 프록시가 사용자 인증을 수행합니다(OAuth, OIDC, SAML 등).
  </Step>
  <Step title="프록시가 ID 헤더 추가">
    프록시는 인증된 사용자 ID가 담긴 헤더를 추가합니다(예: `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway가 신뢰된 소스 확인">
    OpenClaw는 요청이 **신뢰된 프록시 IP**(`gateway.trustedProxies`에 구성됨)에서 왔는지 확인합니다.
  </Step>
  <Step title="Gateway가 ID 추출">
    OpenClaw는 구성된 헤더에서 사용자 ID를 추출합니다.
  </Step>
  <Step title="승인">
    모든 조건이 확인되면 요청이 승인됩니다.
  </Step>
</Steps>

## Control UI 페어링 동작

`gateway.auth.mode = "trusted-proxy"`가 활성화되어 있고 요청이 trusted-proxy 검사를 통과하면, Control UI WebSocket 세션은 기기 페어링 ID 없이 연결할 수 있습니다.

영향:

- 이 모드에서는 페어링이 더 이상 Control UI 접근의 기본 게이트가 아닙니다.
- 리버스 프록시 인증 정책과 `allowUsers`가 실질적인 접근 제어가 됩니다.
- Gateway ingress는 반드시 신뢰된 프록시 IP만 허용하도록 잠가 두세요(`gateway.trustedProxies` + 방화벽).

## 구성

```json5
{
  gateway: {
    // Trusted-proxy 인증은 비-loopback 신뢰 프록시 소스의 요청을 기대합니다
    bind: "lan",

    // 중요: 여기에 프록시의 IP만 추가하세요
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 인증된 사용자 ID를 담는 헤더(필수)
        userHeader: "x-forwarded-user",

        // 선택 사항: 반드시 존재해야 하는 헤더(프록시 검증)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 선택 사항: 특정 사용자로 제한(비어 있으면 모두 허용)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**중요한 런타임 규칙**

- Trusted-proxy 인증은 loopback 소스 요청(`127.0.0.1`, `::1`, loopback CIDR)을 거부합니다.
- 같은 호스트의 loopback 리버스 프록시는 trusted-proxy 인증 조건을 충족하지 않습니다.
- 같은 호스트의 loopback 프록시 설정에서는 대신 token/password 인증을 사용하거나, OpenClaw가 검증할 수 있는 비-loopback 신뢰 프록시 주소를 통해 라우팅하세요.
- 비-loopback Control UI 배포에는 여전히 명시적인 `gateway.controlUi.allowedOrigins`가 필요합니다.
- **전달된 헤더 증거는 loopback 로컬성보다 우선합니다.** 요청이 loopback으로 들어왔더라도 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 헤더가 비로컬 origin을 가리키면, 그 증거는 loopback 로컬성 주장을 무효화합니다. 요청은 페어링, trusted-proxy 인증, Control UI 기기 ID 게이팅에서 원격 요청으로 취급됩니다. 이는 같은 호스트의 loopback 프록시가 전달 헤더 ID를 세탁해 trusted-proxy 인증에 사용하는 것을 막습니다.
</Warning>

### 구성 참조

<ParamField path="gateway.trustedProxies" type="string[]" required>
  신뢰할 프록시 IP 주소 배열입니다. 다른 IP에서 온 요청은 거부됩니다.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  반드시 `"trusted-proxy"`여야 합니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  인증된 사용자 ID를 담는 헤더 이름입니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  요청이 신뢰되기 위해 반드시 존재해야 하는 추가 헤더입니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  사용자 ID 허용 목록입니다. 비어 있으면 인증된 모든 사용자를 허용합니다.
</ParamField>

## TLS 종료와 HSTS

TLS 종료 지점은 하나만 두고, HSTS는 그곳에 적용하세요.

<Tabs>
  <Tab title="프록시 TLS 종료(권장)">
    리버스 프록시가 `https://control.example.com`에 대한 HTTPS를 처리하는 경우, 해당 도메인에 대해 프록시에서 `Strict-Transport-Security`를 설정하세요.

    - 인터넷에 노출되는 배포에 적합합니다.
    - 인증서와 HTTP 보안 강화 정책을 한 곳에서 관리할 수 있습니다.
    - OpenClaw는 프록시 뒤에서 loopback HTTP로 유지할 수 있습니다.

    헤더 값 예시:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS 종료">
    OpenClaw 자체가 직접 HTTPS를 제공하는 경우(TLS 종료 프록시 없음), 다음을 설정하세요.

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

    `strictTransportSecurity`는 문자열 헤더 값을 받거나, 명시적으로 비활성화하려면 `false`를 받을 수 있습니다.

  </Tab>
</Tabs>

### 배포 가이드

- 트래픽을 검증하는 동안에는 먼저 짧은 max age(예: `max-age=300`)로 시작하세요.
- 충분한 확신이 생긴 후에만 긴 값(예: `max-age=31536000`)으로 늘리세요.
- 모든 하위 도메인이 HTTPS 준비가 된 경우에만 `includeSubDomains`를 추가하세요.
- 전체 도메인 집합이 preload 요구사항을 충족하도록 의도한 경우에만 preload를 사용하세요.
- loopback 전용 로컬 개발에는 HSTS의 이점이 없습니다.

## 프록시 설정 예시

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium은 `x-pomerium-claim-email`(또는 다른 claim 헤더)과 `x-pomerium-jwt-assertion`의 JWT로 ID를 전달합니다.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium IP
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

    Pomerium config 예시:

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
  <Accordion title="OAuth와 함께 사용하는 Caddy">
    `caddy-security` Plugin이 포함된 Caddy는 사용자를 인증하고 ID 헤더를 전달할 수 있습니다.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar 프록시 IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Caddyfile 예시:

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
    oauth2-proxy는 사용자를 인증하고 `x-auth-request-email`에 ID를 전달합니다.

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

    nginx config 예시:

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
  <Accordion title="forward auth와 함께 사용하는 Traefik">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik 컨테이너 IP
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

## 혼합 토큰 구성

OpenClaw는 `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)과 `trusted-proxy` 모드가 동시에 활성화된 모호한 구성을 거부합니다. 혼합 토큰 구성은 loopback 요청이 잘못된 인증 경로에서 조용히 인증되게 할 수 있습니다.

시작 시 `mixed_trusted_proxy_token` 오류가 보이면 다음 중 하나를 수행하세요.

- trusted-proxy 모드를 사용할 때는 공유 토큰을 제거하거나
- 토큰 기반 인증을 의도한 경우 `gateway.auth.mode`를 `"token"`으로 전환합니다.

loopback trusted-proxy 인증도 fail closed합니다. 같은 호스트 호출자는 조용히 인증되는 대신, 신뢰된 프록시를 통해 구성된 ID 헤더를 제공해야 합니다.

## 운영자 범위 헤더

Trusted-proxy 인증은 **ID를 담는** HTTP 모드이므로, 호출자는 선택적으로 `x-openclaw-scopes`로 operator 범위를 선언할 수 있습니다.

예시:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

동작:

- 헤더가 있으면 OpenClaw는 선언된 범위 집합을 따릅니다.
- 헤더가 있지만 비어 있으면 요청은 **operator 범위가 없음**을 선언합니다.
- 헤더가 없으면, 일반적인 ID 포함 HTTP API는 표준 operator 기본 범위 집합으로 대체됩니다.
- Gateway 인증 **Plugin HTTP 경로**는 기본적으로 더 좁습니다. `x-openclaw-scopes`가 없으면 그 런타임 범위는 `operator.write`로 대체됩니다.
- 브라우저 origin HTTP 요청은 trusted-proxy 인증이 성공한 뒤에도 여전히 `gateway.controlUi.allowedOrigins`(또는 의도적인 Host-header fallback 모드)를 통과해야 합니다.

실용적인 규칙: trusted-proxy 요청을 기본값보다 더 좁게 만들고 싶을 때, 또는 gateway-auth Plugin 경로에 write 범위보다 더 강한 권한이 필요할 때는 `x-openclaw-scopes`를 명시적으로 보내세요.

## 보안 체크리스트

trusted-proxy 인증을 활성화하기 전에 다음을 확인하세요.

- [ ] **프록시가 유일한 경로인지**: Gateway 포트가 프록시 외 모든 곳에서 방화벽으로 차단되어 있음
- [ ] **trustedProxies가 최소인지**: 전체 서브넷이 아니라 실제 프록시 IP만 포함
- [ ] **loopback 프록시 소스가 없는지**: trusted-proxy 인증은 loopback 소스 요청에 대해 fail closed함
- [ ] **프록시가 헤더를 제거하는지**: 프록시가 클라이언트의 `x-forwarded-*` 헤더를 추가하는 것이 아니라 덮어씀
- [ ] **TLS 종료가 되는지**: 프록시가 TLS를 처리하고 사용자는 HTTPS로 연결함
- [ ] **allowedOrigins가 명시적인지**: 비-loopback Control UI는 명시적인 `gateway.controlUi.allowedOrigins`를 사용함
- [ ] **allowUsers가 설정되었는지**(권장): 인증된 누구나 허용하지 말고 알려진 사용자로 제한
- [ ] **혼합 토큰 구성이 없는지**: `gateway.auth.token`과 `gateway.auth.mode: "trusted-proxy"`를 동시에 설정하지 않음

## 보안 audit

`openclaw security audit`는 trusted-proxy 인증에 대해 **critical** 심각도의 발견 항목을 표시합니다. 이는 의도된 동작으로, 보안을 프록시 설정에 위임하고 있음을 상기시키기 위한 것입니다.

audit가 확인하는 항목:

- 기본 `gateway.trusted_proxy_auth` 경고/critical 알림
- 누락된 `trustedProxies` 구성
- 누락된 `userHeader` 구성
- 비어 있는 `allowUsers`(인증된 모든 사용자 허용)
- 노출된 Control UI 표면에서 와일드카드 또는 누락된 브라우저 origin 정책

## 문제 해결

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    요청이 `gateway.trustedProxies`에 있는 IP에서 오지 않았습니다. 다음을 확인하세요.

    - 프록시 IP가 올바른가요? (Docker 컨테이너 IP는 바뀔 수 있습니다.)
    - 프록시 앞에 로드 밸런서가 있나요?
    - 실제 IP를 찾으려면 `docker inspect` 또는 `kubectl get pods -o wide`를 사용하세요.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw가 loopback 소스 trusted-proxy 요청을 거부했습니다.

    다음을 확인하세요.

    - 프록시가 `127.0.0.1` / `::1`에서 연결하고 있나요?
    - 같은 호스트의 loopback 리버스 프록시에서 trusted-proxy 인증을 사용하려고 하나요?

    해결 방법:

    - 같은 호스트의 loopback 프록시 설정에는 token/password 인증을 사용하거나
    - 비-loopback trusted proxy 주소를 통해 라우팅하고, 해당 IP를 `gateway.trustedProxies`에 유지하세요.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    사용자 헤더가 비어 있거나 누락되었습니다. 다음을 확인하세요.

    - 프록시가 ID 헤더를 전달하도록 구성되어 있나요?
    - 헤더 이름이 올바른가요? (대소문자는 구분하지 않지만 철자는 중요합니다)
    - 사용자가 실제로 프록시에서 인증되었나요?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    필수 헤더가 존재하지 않았습니다. 다음을 확인하세요.

    - 해당 특정 헤더에 대한 프록시 구성
    - 체인 어딘가에서 헤더가 제거되고 있지는 않은지

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    사용자는 인증되었지만 `allowUsers`에 없습니다. 사용자를 추가하거나 허용 목록을 제거하세요.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy 인증은 성공했지만 브라우저 `Origin` 헤더가 Control UI origin 검사를 통과하지 못했습니다.

    다음을 확인하세요.

    - `gateway.controlUi.allowedOrigins`에 정확한 브라우저 origin이 포함되어 있는지
    - 의도적으로 전체 허용 동작을 원하지 않는 한 와일드카드 origin에 의존하지 않는지
    - Host-header fallback 모드를 의도적으로 사용하는 경우, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`가 의도적으로 설정되어 있는지

  </Accordion>
  <Accordion title="WebSocket이 여전히 실패함">
    프록시가 다음을 충족하는지 확인하세요.

    - WebSocket 업그레이드 지원(`Upgrade: websocket`, `Connection: upgrade`)
    - WebSocket 업그레이드 요청에도 ID 헤더를 전달함(HTTP에만 전달하는 것이 아님)
    - WebSocket 연결에 대해 별도의 인증 경로를 두지 않음

  </Accordion>
</AccordionGroup>

## token 인증에서 마이그레이션

token 인증에서 trusted-proxy로 이동하는 경우:

<Steps>
  <Step title="프록시 구성">
    프록시가 사용자를 인증하고 헤더를 전달하도록 구성하세요.
  </Step>
  <Step title="프록시를 독립적으로 테스트">
    프록시 설정을 독립적으로 테스트하세요(헤더를 포함한 curl).
  </Step>
  <Step title="OpenClaw config 업데이트">
    OpenClaw config를 trusted-proxy 인증으로 업데이트하세요.
  </Step>
  <Step title="Gateway 재시작">
    Gateway를 재시작하세요.
  </Step>
  <Step title="WebSocket 테스트">
    Control UI에서 WebSocket 연결을 테스트하세요.
  </Step>
  <Step title="감사">
    `openclaw security audit`를 실행하고 결과를 검토하세요.
  </Step>
</Steps>

## 관련 항목

- [Configuration](/ko/gateway/configuration) — config 참조
- [Remote access](/ko/gateway/remote) — 다른 원격 접근 패턴
- [Security](/ko/gateway/security) — 전체 보안 가이드
- [Tailscale](/ko/gateway/tailscale) — tailnet 전용 접근을 위한 더 간단한 대안
