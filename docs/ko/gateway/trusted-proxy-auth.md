---
read_when:
    - ID 인식 프록시 뒤에서 OpenClaw 실행하기
    - OAuth를 사용해 OpenClaw 앞단에 Pomerium, Caddy 또는 nginx 설정하기
    - 리버스 프록시 구성에서 WebSocket 1008 권한 없음 오류 해결
    - HSTS 및 기타 HTTP 강화 헤더를 설정할 위치 결정
sidebarTitle: Trusted proxy auth
summary: Gateway 인증을 신뢰할 수 있는 리버스 프록시(Pomerium, Caddy, nginx + OAuth)에 위임
title: 신뢰할 수 있는 프록시 인증
x-i18n:
    generated_at: "2026-04-30T06:34:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**보안에 민감한 기능입니다.** 이 모드는 인증을 전적으로 리버스 프록시에 위임합니다. 구성이 잘못되면 Gateway가 무단 접근에 노출될 수 있습니다. 활성화하기 전에 이 페이지를 주의 깊게 읽으세요.
</Warning>

## 사용해야 하는 경우

다음과 같은 경우 `trusted-proxy` 인증 모드를 사용하세요.

- OpenClaw를 **ID 인식 프록시** 뒤에서 실행하는 경우(Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- 프록시가 모든 인증을 처리하고 헤더를 통해 사용자 ID를 전달하는 경우.
- 프록시만 Gateway로 접근할 수 있는 Kubernetes 또는 컨테이너 환경에 있는 경우.
- 브라우저가 WS 페이로드에 토큰을 전달할 수 없어 WebSocket `1008 unauthorized` 오류가 발생하는 경우.

## 사용하면 안 되는 경우

- 프록시가 사용자를 인증하지 않는 경우(단순 TLS 종료 지점 또는 로드 밸런서).
- 프록시를 우회해 Gateway에 도달할 수 있는 경로가 있는 경우(방화벽 구멍, 내부 네트워크 접근).
- 프록시가 전달된 헤더를 올바르게 제거하거나 덮어쓰는지 확실하지 않은 경우.
- 개인 단일 사용자 접근만 필요한 경우(더 간단한 설정으로 Tailscale Serve + loopback을 고려하세요).

## 작동 방식

<Steps>
  <Step title="프록시가 사용자를 인증합니다">
    리버스 프록시가 사용자를 인증합니다(OAuth, OIDC, SAML 등).
  </Step>
  <Step title="프록시가 ID 헤더를 추가합니다">
    프록시는 인증된 사용자 ID가 포함된 헤더를 추가합니다(예: `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway가 신뢰할 수 있는 출처를 확인합니다">
    OpenClaw는 요청이 **신뢰할 수 있는 프록시 IP**(`gateway.trustedProxies`에 구성됨)에서 왔는지 확인합니다.
  </Step>
  <Step title="Gateway가 ID를 추출합니다">
    OpenClaw는 구성된 헤더에서 사용자 ID를 추출합니다.
  </Step>
  <Step title="승인합니다">
    모든 검사가 통과하면 요청이 승인됩니다.
  </Step>
</Steps>

## Control UI 페어링 동작

`gateway.auth.mode = "trusted-proxy"`가 활성화되어 있고 요청이 trusted-proxy 검사를 통과하면, Control UI WebSocket 세션은 기기 페어링 ID 없이 연결할 수 있습니다.

영향:

- 이 모드에서는 페어링이 더 이상 Control UI 접근의 기본 관문이 아닙니다.
- 리버스 프록시 인증 정책과 `allowUsers`가 실질적인 접근 제어가 됩니다.
- Gateway 인그레스는 신뢰할 수 있는 프록시 IP로만 잠그세요(`gateway.trustedProxies` + 방화벽).

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

- Trusted-proxy 인증은 기본적으로 loopback 출처 요청(`127.0.0.1`, `::1`, loopback CIDR)을 거부합니다.
- 동일 호스트 loopback 리버스 프록시는 `gateway.auth.trustedProxy.allowLoopback = true`를 명시적으로 설정하고 loopback 주소를 `gateway.trustedProxies`에 포함하지 않는 한 trusted-proxy 인증을 충족하지 않습니다.
- `allowLoopback`은 Gateway 호스트의 로컬 프로세스를 리버스 프록시와 같은 수준으로 신뢰합니다. Gateway가 여전히 직접 원격 접근으로부터 방화벽으로 보호되고, 로컬 프록시가 클라이언트 제공 ID 헤더를 제거하거나 덮어쓸 때만 활성화하세요.
- 리버스 프록시를 거치지 않는 내부 Gateway 클라이언트는 trusted-proxy ID 헤더가 아니라 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 사용해야 합니다.
- 비 loopback Control UI 배포에는 여전히 명시적인 `gateway.controlUi.allowedOrigins`가 필요합니다.
- **전달된 헤더 증거는 로컬 직접 폴백에서 loopback 로컬성을 우선합니다.** 요청이 loopback으로 도착하더라도 비로컬 출처를 가리키는 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 헤더를 포함하면, 해당 증거로 인해 로컬 직접 비밀번호 폴백과 기기 ID 게이팅이 무효화됩니다. `allowLoopback: true`인 경우 trusted-proxy 인증은 여전히 동일 호스트 프록시 요청으로 수락할 수 있으며, `requiredHeaders`와 `allowUsers`는 계속 적용됩니다.

</Warning>

### 구성 참조

<ParamField path="gateway.trustedProxies" type="string[]" required>
  신뢰할 프록시 IP 주소의 배열입니다. 다른 IP의 요청은 거부됩니다.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  반드시 `"trusted-proxy"`여야 합니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  인증된 사용자 ID가 포함된 헤더 이름입니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  요청을 신뢰하기 위해 반드시 있어야 하는 추가 헤더입니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  사용자 ID 허용 목록입니다. 비어 있으면 인증된 모든 사용자를 허용합니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  동일 호스트 loopback 리버스 프록시에 대한 옵트인 지원입니다. 기본값은 `false`입니다.
</ParamField>

<Warning>
로컬 리버스 프록시가 의도한 신뢰 경계일 때만 `allowLoopback`을 활성화하세요. Gateway에 연결할 수 있는 모든 로컬 프로세스는 프록시 ID 헤더 전송을 시도할 수 있으므로, 직접 Gateway 접근은 호스트에만 비공개로 유지하고 `x-forwarded-proto` 같은 프록시 소유 헤더나 프록시가 지원하는 경우 서명된 어설션 헤더를 요구하세요.
</Warning>

## TLS 종료와 HSTS

TLS 종료 지점은 하나만 사용하고 그곳에 HSTS를 적용하세요.

<Tabs>
  <Tab title="프록시 TLS 종료(권장)">
    리버스 프록시가 `https://control.example.com`의 HTTPS를 처리하는 경우, 해당 도메인에 대해 프록시에서 `Strict-Transport-Security`를 설정하세요.

    - 인터넷에 노출된 배포에 적합합니다.
    - 인증서와 HTTP 강화 정책을 한곳에 유지합니다.
    - OpenClaw는 프록시 뒤의 loopback HTTP에 머물 수 있습니다.

    예시 헤더 값:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS 종료">
    OpenClaw 자체가 HTTPS를 직접 제공하는 경우(TLS를 종료하는 프록시 없음), 다음을 설정하세요.

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

    `strictTransportSecurity`는 문자열 헤더 값 또는 명시적으로 비활성화하기 위한 `false`를 허용합니다.

  </Tab>
</Tabs>

### 롤아웃 지침

- 트래픽을 검증하는 동안 먼저 짧은 max age로 시작하세요(예: `max-age=300`).
- 신뢰도가 높아진 후에만 장기 값으로 늘리세요(예: `max-age=31536000`).
- 모든 하위 도메인이 HTTPS 준비가 된 경우에만 `includeSubDomains`를 추가하세요.
- 전체 도메인 집합에 대해 preload 요구 사항을 의도적으로 충족하는 경우에만 preload를 사용하세요.
- loopback 전용 로컬 개발은 HSTS의 이점을 얻지 못합니다.

## 프록시 설정 예시

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium은 `x-pomerium-claim-email`(또는 다른 클레임 헤더)에 ID를 전달하고 `x-pomerium-jwt-assertion`에 JWT를 전달합니다.

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
  <Accordion title="OAuth가 포함된 Caddy">
    `caddy-security` Plugin을 사용하는 Caddy는 사용자를 인증하고 ID 헤더를 전달할 수 있습니다.

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
  <Accordion title="forward auth가 포함된 Traefik">
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

OpenClaw는 `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)과 `trusted-proxy` 모드가 동시에 활성화된 모호한 구성을 거부합니다. 혼합 토큰 구성은 loopback 요청이 잘못된 인증 경로에서 조용히 인증되게 할 수 있습니다.

시작 시 `mixed_trusted_proxy_token` 오류가 표시되면:

- trusted-proxy 모드를 사용할 때 공유 토큰을 제거하거나,
- 토큰 기반 인증을 의도한 경우 `gateway.auth.mode`를 `"token"`으로 전환하세요.

Loopback trusted-proxy ID 헤더는 여전히 실패 시 닫힌 상태가 됩니다. 동일 호스트 호출자는 프록시 사용자로 조용히 인증되지 않습니다. 프록시를 우회하는 내부 OpenClaw 호출자는 대신 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`로 인증할 수 있습니다. 토큰 폴백은 trusted-proxy 모드에서 의도적으로 지원되지 않습니다.

## 운영자 범위 헤더

Trusted-proxy 인증은 **ID를 포함하는** HTTP 모드이므로, 호출자는 선택적으로 `x-openclaw-scopes`로 운영자 범위를 선언할 수 있습니다.

예시:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

동작:

- 헤더가 있으면 OpenClaw는 선언된 범위 집합을 따릅니다.
- 헤더가 있지만 비어 있으면 요청은 운영자 범위가 **없음**을 선언합니다.
- 헤더가 없으면 일반 ID 포함 HTTP API는 표준 운영자 기본 범위 집합으로 폴백합니다.
- Gateway 인증 **Plugin HTTP 라우트**는 기본적으로 더 좁습니다. `x-openclaw-scopes`가 없으면 런타임 범위는 `operator.write`로 폴백합니다.
- 브라우저 출처 HTTP 요청은 trusted-proxy 인증이 성공한 후에도 여전히 `gateway.controlUi.allowedOrigins`(또는 의도적인 Host 헤더 폴백 모드)를 통과해야 합니다.

실무 규칙: trusted-proxy 요청을 기본값보다 더 좁게 만들고 싶거나, Gateway 인증 Plugin 라우트에 쓰기 범위보다 강한 것이 필요할 때 `x-openclaw-scopes`를 명시적으로 보내세요.

## 보안 체크리스트

trusted-proxy 인증을 활성화하기 전에 다음을 확인하세요.

- [ ] **프록시가 유일한 경로임**: Gateway 포트가 프록시를 제외한 모든 곳에서 방화벽으로 차단되어 있습니다.
- [ ] **trustedProxies가 최소화되어 있음**: 전체 서브넷이 아니라 실제 프록시 IP만 포함합니다.
- [ ] **루프백 프록시 소스가 의도적임**: 동일 호스트 프록시에 대해 `gateway.auth.trustedProxy.allowLoopback`이 명시적으로 활성화되지 않는 한, trusted-proxy 인증은 루프백 소스 요청을 안전하게 거부합니다.
- [ ] **프록시가 헤더를 제거함**: 프록시가 클라이언트의 `x-forwarded-*` 헤더를 추가하지 않고 덮어씁니다.
- [ ] **TLS 종료**: 프록시가 TLS를 처리하며, 사용자는 HTTPS를 통해 연결합니다.
- [ ] **allowedOrigins가 명시적임**: 루프백이 아닌 Control UI는 명시적인 `gateway.controlUi.allowedOrigins`를 사용합니다.
- [ ] **allowUsers가 설정되어 있음**(권장): 인증된 모든 사용자를 허용하지 말고 알려진 사용자로 제한합니다.
- [ ] **혼합 토큰 구성이 없음**: `gateway.auth.token`과 `gateway.auth.mode: "trusted-proxy"`를 둘 다 설정하지 마세요.
- [ ] **로컬 비밀번호 폴백이 비공개임**: 내부 직접 호출자를 위해 `gateway.auth.password`를 구성하는 경우, 프록시가 아닌 원격 클라이언트가 직접 접근할 수 없도록 Gateway 포트를 방화벽으로 차단하세요.

## 보안 감사

`openclaw security audit`는 trusted-proxy 인증을 **critical** 심각도 결과로 표시합니다. 이는 의도된 동작입니다. 프록시 설정에 보안을 위임하고 있음을 상기시키기 위한 것입니다.

감사는 다음을 확인합니다.

- 기본 `gateway.trusted_proxy_auth` 경고/critical 알림
- `trustedProxies` 구성 누락
- `userHeader` 구성 누락
- 비어 있는 `allowUsers`(인증된 모든 사용자 허용)
- 동일 호스트 프록시 소스에 대해 활성화된 `allowLoopback`
- 노출된 Control UI 표면의 와일드카드 또는 누락된 브라우저 출처 정책

## 문제 해결

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    요청이 `gateway.trustedProxies`의 IP에서 오지 않았습니다. 다음을 확인하세요.

    - 프록시 IP가 올바른가요? (Docker 컨테이너 IP는 변경될 수 있습니다.)
    - 프록시 앞에 로드 밸런서가 있나요?
    - 실제 IP를 찾으려면 `docker inspect` 또는 `kubectl get pods -o wide`를 사용하세요.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw가 루프백 소스 trusted-proxy 요청을 거부했습니다.

    확인 사항:

    - 프록시가 `127.0.0.1` / `::1`에서 연결하고 있나요?
    - 동일 호스트 루프백 리버스 프록시와 함께 trusted-proxy 인증을 사용하려고 하나요?

    해결 방법:

    - 프록시를 거치지 않는 내부 동일 호스트 클라이언트에는 토큰/비밀번호 인증을 선호하거나
    - 루프백이 아닌 신뢰할 수 있는 프록시 주소를 통해 라우팅하고 해당 IP를 `gateway.trustedProxies`에 유지하거나
    - 의도적인 동일 호스트 리버스 프록시의 경우 `gateway.auth.trustedProxy.allowLoopback = true`를 설정하고, 루프백 주소를 `gateway.trustedProxies`에 유지하며, 프록시가 ID 헤더를 제거하거나 덮어쓰는지 확인하세요.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    사용자 헤더가 비어 있거나 누락되었습니다. 다음을 확인하세요.

    - 프록시가 ID 헤더를 전달하도록 구성되어 있나요?
    - 헤더 이름이 올바른가요? (대소문자는 구분하지 않지만 철자는 중요합니다.)
    - 사용자가 실제로 프록시에서 인증되었나요?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    필수 헤더가 없었습니다. 다음을 확인하세요.

    - 해당 특정 헤더에 대한 프록시 구성.
    - 체인의 어딘가에서 헤더가 제거되고 있는지 여부.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    사용자는 인증되었지만 `allowUsers`에 없습니다. 사용자를 추가하거나 허용 목록을 제거하세요.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy 인증은 성공했지만, 브라우저 `Origin` 헤더가 Control UI 출처 검사를 통과하지 못했습니다.

    확인 사항:

    - `gateway.controlUi.allowedOrigins`에 정확한 브라우저 출처가 포함되어 있습니다.
    - 모든 항목 허용 동작을 의도적으로 원하는 경우가 아니라면 와일드카드 출처에 의존하지 않습니다.
    - Host 헤더 폴백 모드를 의도적으로 사용하는 경우 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`가 의도적으로 설정되어 있습니다.

  </Accordion>
  <Accordion title="WebSocket still failing">
    프록시가 다음을 충족하는지 확인하세요.

    - WebSocket 업그레이드(`Upgrade: websocket`, `Connection: upgrade`)를 지원합니다.
    - HTTP뿐만 아니라 WebSocket 업그레이드 요청에서도 ID 헤더를 전달합니다.
    - WebSocket 연결에 별도의 인증 경로가 없습니다.

  </Accordion>
</AccordionGroup>

## 토큰 인증에서 마이그레이션

토큰 인증에서 trusted-proxy로 이동하는 경우:

<Steps>
  <Step title="Configure the proxy">
    사용자를 인증하고 헤더를 전달하도록 프록시를 구성하세요.
  </Step>
  <Step title="Test the proxy independently">
    프록시 설정을 독립적으로 테스트하세요(헤더를 포함한 curl).
  </Step>
  <Step title="Update OpenClaw config">
    trusted-proxy 인증으로 OpenClaw 구성을 업데이트하세요.
  </Step>
  <Step title="Restart the Gateway">
    Gateway를 다시 시작하세요.
  </Step>
  <Step title="Test WebSocket">
    Control UI에서 WebSocket 연결을 테스트하세요.
  </Step>
  <Step title="Audit">
    `openclaw security audit`를 실행하고 결과를 검토하세요.
  </Step>
</Steps>

## 관련 항목

- [구성](/ko/gateway/configuration) — 구성 참조
- [원격 액세스](/ko/gateway/remote) — 기타 원격 액세스 패턴
- [보안](/ko/gateway/security) — 전체 보안 가이드
- [Tailscale](/ko/gateway/tailscale) — tailnet 전용 액세스를 위한 더 간단한 대안
