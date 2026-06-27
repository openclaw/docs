---
read_when:
    - ID 인식 프록시 뒤에서 OpenClaw 실행하기
    - OpenClaw 앞에 OAuth를 사용하는 Pomerium, Caddy 또는 nginx 설정하기
    - 리버스 프록시 설정에서 WebSocket 1008 인증되지 않음 오류 해결하기
    - HSTS 및 기타 HTTP 강화 헤더를 설정할 위치 결정
sidebarTitle: Trusted proxy auth
summary: 신뢰할 수 있는 리버스 프록시(Pomerium, Caddy, nginx + OAuth)에 Gateway 인증을 위임
title: 신뢰할 수 있는 프록시 인증
x-i18n:
    generated_at: "2026-06-27T17:33:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**보안에 민감한 기능입니다.** 이 모드는 인증을 전적으로 리버스 프록시에 위임합니다. 잘못 구성하면 Gateway가 무단 접근에 노출될 수 있습니다. 활성화하기 전에 이 페이지를 주의 깊게 읽으세요.
</Warning>

## 사용해야 하는 경우

다음과 같은 경우 `trusted-proxy` 인증 모드를 사용하세요.

- OpenClaw를 **신원 인식 프록시**(Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth) 뒤에서 실행합니다.
- 프록시가 모든 인증을 처리하고 헤더를 통해 사용자 신원을 전달합니다.
- 프록시가 Gateway로 가는 유일한 경로인 Kubernetes 또는 컨테이너 환경에 있습니다.
- 브라우저가 WS 페이로드에서 토큰을 전달할 수 없어 WebSocket `1008 unauthorized` 오류가 발생합니다.

## 사용하지 말아야 하는 경우

- 프록시가 사용자를 인증하지 않는 경우(단순 TLS 종료 지점 또는 로드 밸런서).
- 프록시를 우회해 Gateway로 가는 경로가 하나라도 있는 경우(방화벽 허점, 내부 네트워크 접근).
- 프록시가 전달된 헤더를 올바르게 제거하거나 덮어쓰는지 확실하지 않은 경우.
- 개인 단일 사용자 접근만 필요한 경우(더 간단한 설정을 위해 Tailscale Serve + 루프백을 고려하세요).

## 작동 방식

<Steps>
  <Step title="Proxy authenticates the user">
    리버스 프록시가 사용자를 인증합니다(OAuth, OIDC, SAML 등).
  </Step>
  <Step title="Proxy adds an identity header">
    프록시가 인증된 사용자 신원이 포함된 헤더를 추가합니다(예: `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw는 요청이 **신뢰할 수 있는 프록시 IP**(`gateway.trustedProxies`에 구성됨)에서 왔는지 확인합니다.
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw는 구성된 헤더에서 사용자 신원을 추출합니다.
  </Step>
  <Step title="Authorize">
    모든 검사가 통과하면 요청이 승인됩니다.
  </Step>
</Steps>

## Control UI 페어링 동작

`gateway.auth.mode = "trusted-proxy"`가 활성화되어 있고 요청이 trusted-proxy 검사를 통과하면, Control UI WebSocket 세션은 기기 페어링 신원 없이 연결할 수 있습니다.

범위 관련 영향:

- 기기 없는 Control UI WebSocket 세션은 연결되지만 기본적으로 운영자 범위를 받지 않습니다. OpenClaw는 요청된 범위 목록을 `[]`로 비워, 승인된 페어링 기기/토큰에 바인딩되지 않은 세션이 권한을 자체 선언할 수 없도록 합니다.
- WebSocket 연결이 성공한 뒤 메서드가 `missing scope`로 실패하면, 브라우저가 기기 신원을 생성하고 페어링을 완료할 수 있도록 HTTPS를 사용하세요. [Control UI 안전하지 않은 HTTP](/ko/web/control-ui#insecure-http)를 참조하세요.
- 비상용으로만 사용: `gateway.controlUi.dangerouslyDisableDeviceAuth=true`는 기기 신원이 없어도 요청된 범위를 유지합니다. 이는 심각한 보안 다운그레이드이므로 빠르게 되돌리세요. [Control UI 안전하지 않은 HTTP](/ko/web/control-ui#insecure-http)를 참조하세요.

리버스 프록시 범위 제한:

- 프록시가 Control UI WebSocket 업그레이드 요청에 `x-openclaw-scopes`를 보내면, OpenClaw는 세션 범위를 요청된 범위와 선언된 범위의 교집합으로 제한합니다. 이 헤더는 범위를 부여하지 않으며, 세션이 가질 수 있는 범위를 좁히기만 합니다.

영향:

- 이 모드에서는 페어링이 더 이상 Control UI 접근의 기본 게이트가 아닙니다.
- 리버스 프록시 인증 정책과 `allowUsers`가 실질적인 접근 제어가 됩니다.
- Gateway 인그레스는 신뢰할 수 있는 프록시 IP로만 잠그세요(`gateway.trustedProxies` + 방화벽).

커스텀 WebSocket 클라이언트는 Control UI 세션이 아닙니다. `gateway.controlUi.dangerouslyDisableDeviceAuth`는 임의의 `client.mode: "backend"` 또는 CLI 형태 클라이언트에 범위를 부여하지 않습니다. 커스텀 자동화는 기기 신원/페어링, 예약된 직접 local `client.id: "gateway-client"` 백엔드 헬퍼 경로, 또는 HTTP 요청/응답 표면이 더 적합한 경우 [admin HTTP RPC Plugin](/ko/plugins/admin-http-rpc)을 사용해야 합니다.

## 구성

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
**중요한 런타임 규칙**

- Trusted-proxy 인증은 기본적으로 루프백 소스 요청(`127.0.0.1`, `::1`, 루프백 CIDR)을 거부합니다.
- 동일 호스트 루프백 리버스 프록시는 `gateway.auth.trustedProxy.allowLoopback = true`를 명시적으로 설정하고 루프백 주소를 `gateway.trustedProxies`에 포함하지 않는 한 trusted-proxy 인증을 충족하지 않습니다.
- `allowLoopback`은 Gateway 호스트의 로컬 프로세스를 리버스 프록시와 같은 수준으로 신뢰합니다. Gateway가 직접 원격 접근으로부터 여전히 방화벽으로 보호되고, 로컬 프록시가 클라이언트가 제공한 신원 헤더를 제거하거나 덮어쓰는 경우에만 활성화하세요.
- 리버스 프록시를 거치지 않는 내부 Gateway 클라이언트는 trusted-proxy 신원 헤더가 아니라 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 사용해야 합니다.
- 루프백이 아닌 Control UI 배포에는 여전히 명시적인 `gateway.controlUi.allowedOrigins`가 필요합니다.
- **전달된 헤더 증거는 local 직접 폴백에서 루프백 지역성을 재정의합니다.** 요청이 루프백으로 도착하더라도 `Forwarded`, 임의의 `X-Forwarded-*`, 또는 `X-Real-IP` 헤더 증거를 포함하면, 그 증거는 local-direct 비밀번호 폴백 및 기기 신원 게이팅 자격을 박탈합니다. `allowLoopback: true`를 사용하면 trusted-proxy 인증이 동일 호스트 프록시 요청으로 해당 요청을 계속 수락할 수 있으며, `requiredHeaders`와 `allowUsers`는 계속 적용됩니다.

</Warning>

### 구성 참조

<ParamField path="gateway.trustedProxies" type="string[]" required>
  신뢰할 프록시 IP 주소 배열입니다. 다른 IP에서 온 요청은 거부됩니다.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  반드시 `"trusted-proxy"`여야 합니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  인증된 사용자 신원이 포함된 헤더 이름입니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  요청을 신뢰하기 위해 반드시 존재해야 하는 추가 헤더입니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  사용자 신원 허용 목록입니다. 비어 있으면 인증된 모든 사용자를 허용합니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  동일 호스트 루프백 리버스 프록시에 대한 명시적 지원입니다. 기본값은 `false`입니다.
</ParamField>

<Warning>
로컬 리버스 프록시가 의도된 신뢰 경계인 경우에만 `allowLoopback`을 활성화하세요. Gateway에 연결할 수 있는 모든 로컬 프로세스가 프록시 신원 헤더를 보내려고 시도할 수 있으므로, 직접 Gateway 접근은 호스트 내부로 비공개로 유지하고 `x-forwarded-proto` 같은 프록시 소유 헤더 또는 프록시가 지원하는 경우 서명된 assertion 헤더를 요구하세요.
</Warning>

## TLS 종료와 HSTS

TLS 종료 지점은 하나만 사용하고 그곳에 HSTS를 적용하세요.

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    리버스 프록시가 `https://control.example.com`의 HTTPS를 처리하는 경우, 해당 도메인에 대해 프록시에서 `Strict-Transport-Security`를 설정하세요.

    - 인터넷에 노출된 배포에 적합합니다.
    - 인증서와 HTTP 강화 정책을 한곳에 유지합니다.
    - OpenClaw는 프록시 뒤에서 루프백 HTTP로 유지될 수 있습니다.

    예시 헤더 값:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    OpenClaw 자체가 HTTPS를 직접 제공하는 경우(TLS 종료 프록시 없음), 다음을 설정하세요.

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

    `strictTransportSecurity`는 문자열 헤더 값을 받거나, 명시적으로 비활성화하려면 `false`를 받습니다.

  </Tab>
</Tabs>

### 롤아웃 지침

- 트래픽을 검증하는 동안 먼저 짧은 최대 기간(예: `max-age=300`)으로 시작하세요.
- 신뢰도가 높아진 뒤에만 장기 값(예: `max-age=31536000`)으로 늘리세요.
- 모든 하위 도메인이 HTTPS 준비가 된 경우에만 `includeSubDomains`를 추가하세요.
- 전체 도메인 집합에 대한 preload 요구 사항을 의도적으로 충족하는 경우에만 preload를 사용하세요.
- 루프백 전용 로컬 개발은 HSTS의 이점을 얻지 않습니다.

## 프록시 설정 예시

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium은 `x-pomerium-claim-email`(또는 다른 claim 헤더)에 신원을 전달하고 `x-pomerium-jwt-assertion`에 JWT를 전달합니다.

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

    Pomerium 구성 스니펫:

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
    `caddy-security` Plugin을 사용하는 Caddy는 사용자를 인증하고 신원 헤더를 전달할 수 있습니다.

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

    Caddyfile 스니펫:

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
    oauth2-proxy는 사용자를 인증하고 `x-auth-request-email`에 신원을 전달합니다.

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

    nginx 구성 스니펫:

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

## 혼합 토큰 구성

OpenClaw는 `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)과 `trusted-proxy` 모드가 동시에 활성화된 모호한 구성을 거부합니다. 혼합 토큰 구성은 루프백 요청이 잘못된 인증 경로에서 조용히 인증되게 만들 수 있습니다.

시작 시 `mixed_trusted_proxy_token` 오류가 표시되면:

- trusted-proxy 모드를 사용할 때 공유 토큰을 제거하거나,
- 토큰 기반 인증을 의도한 경우 `gateway.auth.mode`를 `"token"`으로 전환하세요.

Loopback 신뢰 프록시 ID 헤더는 여전히 실패 시 닫힘으로 동작합니다. 같은 호스트 호출자는 프록시 사용자로 조용히 인증되지 않습니다. 프록시를 우회하는 내부 OpenClaw 호출자는 대신 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`로 인증할 수 있습니다. 신뢰 프록시 모드에서는 토큰 폴백이 의도적으로 지원되지 않습니다.

## 운영자 범위 헤더

신뢰 프록시 인증은 **ID를 포함하는** HTTP 모드이므로, 호출자는 HTTP API 요청에서 `x-openclaw-scopes`로 운영자 범위를 선택적으로 선언할 수 있습니다.

참고: WebSocket 범위는 Gateway 프로토콜 핸드셰이크와 디바이스 ID 바인딩으로 결정됩니다. Control UI WebSocket 업그레이드 요청에서 `x-openclaw-scopes`는 협상된 세션 범위에 대한 상한일 뿐, 권한 부여가 아닙니다. 신뢰 프록시에서의 WebSocket 범위 동작은 [Control UI 페어링 동작](#control-ui-pairing-behavior)을 참조하세요.

예시:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

동작:

- 헤더가 있으면 OpenClaw는 선언된 범위 집합을 적용합니다.
- 헤더가 있지만 비어 있으면 요청은 운영자 범위를 **없음**으로 선언합니다.
- 헤더가 없으면 일반 ID 포함 HTTP API는 표준 운영자 기본 범위 집합으로 폴백합니다.
- Gateway 인증 **Plugin HTTP 라우트**는 기본적으로 더 좁습니다. `x-openclaw-scopes`가 없으면 런타임 범위는 `operator.write`로 폴백합니다.
- 브라우저 원본 HTTP 요청은 신뢰 프록시 인증이 성공한 뒤에도 `gateway.controlUi.allowedOrigins` 또는 의도적인 Host 헤더 폴백 모드를 통과해야 합니다.
- Control UI WebSocket 세션의 경우, 업그레이드 요청에 `x-openclaw-scopes`가 있으면 범위 상한으로 동작합니다. 빈 값은 범위 없음으로 처리됩니다.

실무 규칙: 신뢰 프록시 요청을 기본값보다 더 좁게 만들고 싶거나, Gateway 인증 Plugin 라우트에 쓰기 범위보다 강한 권한이 필요할 때는 `x-openclaw-scopes`를 명시적으로 보내세요.

## 보안 체크리스트

신뢰 프록시 인증을 활성화하기 전에 확인하세요.

- [ ] **프록시가 유일한 경로임**: Gateway 포트는 프록시를 제외한 모든 곳에서 방화벽으로 차단되어 있습니다.
- [ ] **trustedProxies가 최소화되어 있음**: 전체 서브넷이 아니라 실제 프록시 IP만 포함합니다.
- [ ] **Loopback 프록시 소스가 의도적임**: 같은 호스트 프록시에 대해 `gateway.auth.trustedProxy.allowLoopback`을 명시적으로 활성화하지 않는 한, Loopback 소스 요청의 신뢰 프록시 인증은 실패 시 닫힘으로 동작합니다.
- [ ] **프록시가 헤더를 제거함**: 프록시는 클라이언트의 `x-forwarded-*` 헤더를 덧붙이지 않고 덮어씁니다.
- [ ] **TLS 종료**: 프록시가 TLS를 처리하며, 사용자는 HTTPS로 연결합니다.
- [ ] **allowedOrigins가 명시적임**: 비 Loopback Control UI는 명시적인 `gateway.controlUi.allowedOrigins`를 사용합니다.
- [ ] **allowUsers가 설정되어 있음**(권장): 인증된 누구나 허용하는 대신 알려진 사용자로 제한합니다.
- [ ] **혼합 토큰 설정 없음**: `gateway.auth.token`과 `gateway.auth.mode: "trusted-proxy"`를 함께 설정하지 않습니다.
- [ ] **로컬 비밀번호 폴백은 비공개임**: 내부 직접 호출자용으로 `gateway.auth.password`를 구성하는 경우, 프록시가 아닌 원격 클라이언트가 직접 접근할 수 없도록 Gateway 포트를 방화벽으로 차단하세요.

## 보안 감사

`openclaw security audit`는 신뢰 프록시 인증을 **critical** 심각도의 발견 사항으로 표시합니다. 이는 의도된 동작입니다. 보안을 프록시 설정에 위임하고 있음을 상기시키기 위한 것입니다.

감사는 다음을 확인합니다.

- 기본 `gateway.trusted_proxy_auth` 경고/critical 알림
- 누락된 `trustedProxies` 설정
- 누락된 `userHeader` 설정
- 빈 `allowUsers`(인증된 모든 사용자 허용)
- 같은 호스트 프록시 소스에 대해 활성화된 `allowLoopback`
- 노출된 Control UI 표면의 와일드카드 또는 누락된 브라우저 원본 정책

## 문제 해결

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    요청이 `gateway.trustedProxies`에 있는 IP에서 오지 않았습니다. 확인하세요.

    - 프록시 IP가 올바른가요? (Docker 컨테이너 IP는 변경될 수 있습니다.)
    - 프록시 앞에 로드 밸런서가 있나요?
    - 실제 IP를 찾으려면 `docker inspect` 또는 `kubectl get pods -o wide`를 사용하세요.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw가 Loopback 소스 신뢰 프록시 요청을 거부했습니다.

    확인하세요.

    - 프록시가 `127.0.0.1` / `::1`에서 연결하나요?
    - 같은 호스트 Loopback 리버스 프록시로 신뢰 프록시 인증을 사용하려고 하나요?

    수정:

    - 프록시를 거치지 않는 내부 같은 호스트 클라이언트에는 토큰/비밀번호 인증을 선호하거나,
    - 비 Loopback 신뢰 프록시 주소를 통해 라우팅하고 해당 IP를 `gateway.trustedProxies`에 유지하거나,
    - 의도적인 같은 호스트 리버스 프록시의 경우 `gateway.auth.trustedProxy.allowLoopback = true`를 설정하고, Loopback 주소를 `gateway.trustedProxies`에 유지하며, 프록시가 ID 헤더를 제거하거나 덮어쓰는지 확인하세요.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    사용자 헤더가 비어 있거나 누락되었습니다. 확인하세요.

    - 프록시가 ID 헤더를 전달하도록 구성되어 있나요?
    - 헤더 이름이 올바른가요? (대소문자는 구분하지 않지만 철자는 중요합니다.)
    - 사용자가 실제로 프록시에서 인증되었나요?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    필수 헤더가 없었습니다. 확인하세요.

    - 해당 특정 헤더에 대한 프록시 설정.
    - 체인의 어딘가에서 헤더가 제거되고 있는지 여부.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    사용자는 인증되었지만 `allowUsers`에 없습니다. 사용자를 추가하거나 허용 목록을 제거하세요.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    신뢰 프록시 인증은 성공했지만 브라우저 `Origin` 헤더가 Control UI 원본 검사를 통과하지 못했습니다.

    확인하세요.

    - `gateway.controlUi.allowedOrigins`에 정확한 브라우저 원본이 포함되어 있습니다.
    - 전체 허용 동작을 의도적으로 원하는 경우가 아니라면 와일드카드 원본에 의존하지 않습니다.
    - Host 헤더 폴백 모드를 의도적으로 사용하는 경우 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`가 의도적으로 설정되어 있습니다.

  </Accordion>
  <Accordion title="연결은 성공하지만 메서드에서 범위 누락을 보고함">
    WebSocket은 연결되지만 `chat.history`, `sessions.list` 또는
    `models.list`가 `missing scope: operator.read`로 실패합니다.

    일반적인 원인:

    - 디바이스 없는 Control UI 세션: 신뢰 프록시 인증은 디바이스 ID 없이 WebSocket 연결을 허용할 수 있지만, OpenClaw는 설계상 디바이스 없는 세션의 범위를 제거합니다.
    - 사용자 지정 백엔드 클라이언트: `gateway.controlUi.dangerouslyDisableDeviceAuth`는 Control UI 범위에 한정되며 임의의 백엔드 또는 CLI 형태 WebSocket 클라이언트에 범위를 부여하지 않습니다.
    - 지나치게 좁은 `x-openclaw-scopes`: 프록시가 Control UI WebSocket 업그레이드 요청에 이 헤더를 주입하면 세션 범위가 해당 집합으로 제한됩니다. 빈 헤더 값은 범위 없음으로 처리됩니다.

    수정:

    - Control UI의 경우 브라우저가 디바이스 ID를 생성하고 페어링을 완료할 수 있도록 HTTPS를 사용하세요.
    - 사용자 지정 자동화의 경우 디바이스 ID/페어링, 예약된 직접 로컬 `gateway-client` 백엔드 헬퍼 경로 또는 [admin HTTP RPC](/ko/plugins/admin-http-rpc)를 사용하세요.
    - `gateway.controlUi.dangerouslyDisableDeviceAuth: true`는 임시 Control UI 비상 경로로만 사용하세요.

  </Accordion>
  <Accordion title="WebSocket이 여전히 실패함">
    프록시가 다음을 충족하는지 확인하세요.

    - WebSocket 업그레이드(`Upgrade: websocket`, `Connection: upgrade`)를 지원합니다.
    - HTTP뿐만 아니라 WebSocket 업그레이드 요청에도 ID 헤더를 전달합니다.
    - WebSocket 연결에 별도의 인증 경로가 없습니다.

  </Accordion>
</AccordionGroup>

## 토큰 인증에서 마이그레이션

토큰 인증에서 신뢰 프록시로 이동하는 경우:

<Steps>
  <Step title="프록시 구성">
    사용자를 인증하고 헤더를 전달하도록 프록시를 구성합니다.
  </Step>
  <Step title="프록시를 독립적으로 테스트">
    프록시 설정을 독립적으로 테스트합니다(헤더를 포함한 curl).
  </Step>
  <Step title="OpenClaw 설정 업데이트">
    신뢰 프록시 인증으로 OpenClaw 설정을 업데이트합니다.
  </Step>
  <Step title="Gateway 재시작">
    Gateway를 재시작합니다.
  </Step>
  <Step title="WebSocket 테스트">
    Control UI에서 WebSocket 연결을 테스트합니다.
  </Step>
  <Step title="감사">
    `openclaw security audit`를 실행하고 발견 사항을 검토합니다.
  </Step>
</Steps>

## 관련 항목

- [설정](/ko/gateway/configuration) — 설정 참조
- [원격 접근](/ko/gateway/remote) — 기타 원격 접근 패턴
- [보안](/ko/gateway/security) — 전체 보안 가이드
- [Tailscale](/ko/gateway/tailscale) — tailnet 전용 접근을 위한 더 간단한 대안
