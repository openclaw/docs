---
read_when:
    - ID 인식 프록시 뒤에서 OpenClaw 실행하기
    - OpenClaw 앞단에 OAuth와 함께 Pomerium, Caddy 또는 nginx 설정하기
    - 리버스 프록시 설정에서 WebSocket 1008 unauthorized 오류 수정하기
    - HSTS 및 기타 HTTP 강화 헤더를 어디에 설정할지 결정하기
summary: 신뢰할 수 있는 리버스 프록시(Pomerium, Caddy, nginx + OAuth)에 Gateway 인증 위임
title: 신뢰할 수 있는 프록시 인증
x-i18n:
    generated_at: "2026-04-23T14:03:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# 신뢰할 수 있는 프록시 인증

> ⚠️ **보안에 민감한 기능입니다.** 이 모드는 인증을 전적으로 리버스 프록시에 위임합니다. 잘못 구성하면 Gateway가 무단 접근에 노출될 수 있습니다. 활성화하기 전에 이 페이지를 주의 깊게 읽으세요.

## 사용 시점

다음 경우 `trusted-proxy` 인증 모드를 사용하세요:

- OpenClaw을 **ID 인식 프록시**(Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth) 뒤에서 실행하는 경우
- 프록시가 모든 인증을 처리하고 헤더를 통해 사용자 식별자를 전달하는 경우
- 프록시가 Gateway로 가는 유일한 경로인 Kubernetes 또는 컨테이너 환경인 경우
- 브라우저가 WS payload에 토큰을 전달할 수 없어서 WebSocket `1008 unauthorized` 오류가 발생하는 경우

## 사용하지 말아야 할 시점

- 프록시가 사용자를 인증하지 않는 경우(TLS 종료기 또는 로드 밸런서만 해당)
- 프록시를 우회해서 Gateway로 갈 수 있는 경로가 하나라도 있는 경우(방화벽 구멍, 내부 네트워크 접근)
- 프록시가 전달된 헤더를 올바르게 제거/덮어쓰는지 확신할 수 없는 경우
- 개인 단일 사용자 액세스만 필요하다면(더 단순한 설정을 위해 Tailscale Serve + loopback 고려)

## 동작 방식

1. 리버스 프록시가 사용자를 인증합니다(OAuth, OIDC, SAML 등)
2. 프록시가 인증된 사용자 식별자가 담긴 헤더를 추가합니다(예: `x-forwarded-user: nick@example.com`)
3. OpenClaw은 요청이 **신뢰할 수 있는 프록시 IP**에서 왔는지 확인합니다(`gateway.trustedProxies`에 구성됨)
4. OpenClaw은 구성된 헤더에서 사용자 식별자를 추출합니다
5. 모든 확인이 통과되면 요청이 인증됩니다

## Control UI 페어링 동작

`gateway.auth.mode = "trusted-proxy"`가 활성화되어 있고 요청이
trusted-proxy 검사를 통과하면, Control UI WebSocket 세션은 장치
페어링 식별자 없이도 연결할 수 있습니다.

영향:

- 이 모드에서는 페어링이 더 이상 Control UI 액세스의 기본 게이트가 아닙니다.
- 리버스 프록시 인증 정책과 `allowUsers`가 실질적인 액세스 제어가 됩니다.
- gateway 인그레스를 신뢰할 수 있는 프록시 IP로만 잠그세요(`gateway.trustedProxies` + 방화벽).

## 구성

```json5
{
  gateway: {
    // trusted-proxy 인증은 loopback이 아닌 신뢰할 수 있는 프록시 소스에서 오는 요청을 기대합니다
    bind: "lan",

    // 중요: 여기에 프록시의 IP만 추가하세요
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 인증된 사용자 식별자가 담긴 헤더(필수)
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

중요한 런타임 규칙:

- trusted-proxy 인증은 loopback 소스 요청(`127.0.0.1`, `::1`, loopback CIDR)을 거부합니다.
- 동일 호스트 loopback 리버스 프록시는 **trusted-proxy 인증 요건을 충족하지 않습니다**.
- 동일 호스트 loopback 프록시 설정에서는 대신 token/password 인증을 사용하거나, OpenClaw이 검증할 수 있는 loopback이 아닌 신뢰할 수 있는 프록시 주소를 통해 라우팅하세요.
- loopback이 아닌 Control UI 배포에는 여전히 명시적인 `gateway.controlUi.allowedOrigins`가 필요합니다.
- **전달된 헤더 증거는 loopback 로컬성을 덮어씁니다.** 요청이 loopback으로 도착하더라도 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 헤더가 비로컬 원본을 가리키면, 그 증거는 loopback 로컬성 주장을 무효화합니다. 해당 요청은 페어링, trusted-proxy 인증, Control UI 장치 식별자 게이팅에서 원격 요청으로 취급됩니다. 이렇게 하면 동일 호스트 loopback 프록시가 전달된 헤더 식별자를 세탁해 trusted-proxy 인증에 사용하는 것을 막을 수 있습니다.

### 구성 참조

| 필드                                       | 필수 여부 | 설명                                                                 |
| ------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | 예      | 신뢰할 프록시 IP 주소 배열. 다른 IP에서 오는 요청은 거부됩니다. |
| `gateway.auth.mode`                         | 예      | 반드시 `"trusted-proxy"`여야 합니다                                                   |
| `gateway.auth.trustedProxy.userHeader`      | 예      | 인증된 사용자 식별자가 담긴 헤더 이름                      |
| `gateway.auth.trustedProxy.requiredHeaders` | 아니요       | 요청이 신뢰되기 위해 반드시 존재해야 하는 추가 헤더       |
| `gateway.auth.trustedProxy.allowUsers`      | 아니요       | 사용자 식별자 허용 목록. 비어 있으면 모든 인증된 사용자를 허용합니다.    |

## TLS 종료 및 HSTS

TLS 종료 지점은 하나만 두고, HSTS는 그 지점에 적용하세요.

### 권장 패턴: 프록시 TLS 종료

리버스 프록시가 `https://control.example.com`에 대한 HTTPS를 처리한다면,
해당 도메인의 `Strict-Transport-Security`는 프록시에서 설정하세요.

- 인터넷에 노출되는 배포에 적합합니다.
- 인증서와 HTTP 강화 정책을 한 곳에서 관리할 수 있습니다.
- OpenClaw은 프록시 뒤에서 loopback HTTP로 유지할 수 있습니다.

예시 헤더 값:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Gateway TLS 종료

OpenClaw 자체가 HTTPS를 직접 제공하는 경우(TLS 종료 프록시 없음), 다음을 설정하세요:

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

### 롤아웃 가이드

- 먼저 짧은 max age(예: `max-age=300`)로 시작해 트래픽을 검증하세요.
- 충분한 확신이 생긴 뒤에만 긴 값(예: `max-age=31536000`)으로 늘리세요.
- 모든 서브도메인이 HTTPS 준비가 되어 있을 때만 `includeSubDomains`를 추가하세요.
- 전체 도메인 집합이 preload 요구 사항을 의도적으로 충족할 때만 preload를 사용하세요.
- loopback 전용 로컬 개발에는 HSTS가 도움이 되지 않습니다.

## 프록시 설정 예시

### Pomerium

Pomerium은 `x-pomerium-claim-email`(또는 다른 claim 헤더)과 `x-pomerium-jwt-assertion`의 JWT로 식별자를 전달합니다.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomerium의 IP
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

### OAuth가 있는 Caddy

`caddy-security` Plugin이 있는 Caddy는 사용자를 인증하고 식별자 헤더를 전달할 수 있습니다.

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

### nginx + oauth2-proxy

oauth2-proxy는 사용자를 인증하고 `x-auth-request-email`로 식별자를 전달합니다.

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

### Forward Auth가 있는 Traefik

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

## 혼합 토큰 구성

OpenClaw은 `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)과 `trusted-proxy` 모드가 동시에 활성화된 모호한 구성을 거부합니다. 혼합 토큰 구성은 loopback 요청이 잘못된 인증 경로에서 조용히 인증되게 만들 수 있습니다.

시작 시 `mixed_trusted_proxy_token` 오류가 보이면:

- trusted-proxy 모드를 사용하는 경우 공유 토큰을 제거하거나
- 토큰 기반 인증을 의도한 것이라면 `gateway.auth.mode`를 `"token"`으로 전환하세요.

loopback trusted-proxy 인증도 fail closed 됩니다. 동일 호스트 호출자는
조용히 인증되는 대신, 신뢰할 수 있는 프록시를 통해 구성된 식별자 헤더를 제공해야 합니다.

## 운영자 스코프 헤더

trusted-proxy 인증은 **식별자를 담는** HTTP 모드이므로, 호출자는
선택적으로 `x-openclaw-scopes`로 운영자 스코프를 선언할 수 있습니다.

예시:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

동작:

- 헤더가 존재하면 OpenClaw은 선언된 스코프 집합을 따릅니다.
- 헤더가 존재하지만 비어 있으면 요청은 **운영자 스코프가 없음**을 선언합니다.
- 헤더가 없으면 일반 식별자 포함 HTTP API는 표준 운영자 기본 스코프 집합으로 대체됩니다.
- Gateway 인증 **plugin HTTP route**는 기본값이 더 좁습니다. `x-openclaw-scopes`가 없으면 런타임 스코프는 `operator.write`로 대체됩니다.
- 브라우저 원본 HTTP 요청은 trusted-proxy 인증이 성공한 뒤에도 여전히 `gateway.controlUi.allowedOrigins`(또는 의도적인 Host 헤더 대체 모드)를 통과해야 합니다.

실무 규칙:

- trusted-proxy 요청을 기본값보다 더 좁게 만들고 싶거나,
  gateway 인증 plugin route에 write 스코프보다 강한 것이 필요할 때는
  `x-openclaw-scopes`를 명시적으로 보내세요.

## 보안 체크리스트

trusted-proxy 인증을 활성화하기 전에 다음을 확인하세요:

- [ ] **프록시가 유일한 경로**: Gateway 포트는 프록시를 제외한 모든 곳에서 방화벽으로 차단됨
- [ ] **trustedProxies는 최소화**: 전체 서브넷이 아니라 실제 프록시 IP만 포함
- [ ] **loopback 프록시 소스 없음**: trusted-proxy 인증은 loopback 소스 요청에서 fail closed 됨
- [ ] **프록시가 헤더 제거**: 프록시는 클라이언트의 `x-forwarded-*` 헤더를 덧붙이는 대신 덮어씀
- [ ] **TLS 종료**: 프록시가 TLS를 처리하고 사용자는 HTTPS로 연결
- [ ] **allowedOrigins는 명시적**: loopback이 아닌 Control UI는 명시적인 `gateway.controlUi.allowedOrigins` 사용
- [ ] **allowUsers 설정됨**(권장): 인증된 누구나 허용하지 말고 알려진 사용자로 제한
- [ ] **혼합 토큰 구성 없음**: `gateway.auth.token`과 `gateway.auth.mode: "trusted-proxy"`를 동시에 설정하지 않음

## 보안 감사

`openclaw security audit`는 trusted-proxy 인증을 **critical** 심각도의 항목으로 표시합니다. 이것은 의도된 동작으로, 보안을 프록시 구성에 위임하고 있음을 상기시키기 위한 것입니다.

감사 항목:

- 기본 `gateway.trusted_proxy_auth` 경고/critical 알림
- `trustedProxies` 구성 누락
- `userHeader` 구성 누락
- 비어 있는 `allowUsers`(인증된 모든 사용자 허용)
- 노출된 Control UI 표면에서의 와일드카드 또는 누락된 browser-origin 정책

## 문제 해결

### "trusted_proxy_untrusted_source"

요청이 `gateway.trustedProxies`에 있는 IP에서 오지 않았습니다. 다음을 확인하세요:

- 프록시 IP가 올바른가요?(Docker 컨테이너 IP는 바뀔 수 있음)
- 프록시 앞에 로드 밸런서가 있나요?
- 실제 IP를 찾으려면 `docker inspect` 또는 `kubectl get pods -o wide`를 사용하세요

### "trusted_proxy_loopback_source"

OpenClaw이 loopback 소스 trusted-proxy 요청을 거부했습니다.

다음을 확인하세요:

- 프록시가 `127.0.0.1` / `::1`에서 연결하고 있나요?
- 동일 호스트 loopback 리버스 프록시로 trusted-proxy 인증을 사용하려고 하나요?

수정 방법:

- 동일 호스트 loopback 프록시 설정에서는 token/password 인증을 사용하거나
- loopback이 아닌 신뢰할 수 있는 프록시 주소를 통해 라우팅하고 해당 IP를 `gateway.trustedProxies`에 유지하세요.

### "trusted_proxy_user_missing"

사용자 헤더가 비어 있거나 누락되었습니다. 다음을 확인하세요:

- 프록시가 식별자 헤더를 전달하도록 구성되어 있나요?
- 헤더 이름이 올바른가요?(대소문자는 무시되지만 철자는 중요함)
- 사용자가 실제로 프록시에서 인증되었나요?

### "trusted*proxy_missing_header*\*"

필수 헤더가 존재하지 않았습니다. 다음을 확인하세요:

- 해당 헤더에 대한 프록시 구성
- 체인 중간 어디선가 헤더가 제거되고 있지 않은지

### "trusted_proxy_user_not_allowed"

사용자는 인증되었지만 `allowUsers`에 없습니다. 해당 사용자를 추가하거나 허용 목록을 제거하세요.

### "trusted_proxy_origin_not_allowed"

trusted-proxy 인증은 성공했지만 브라우저 `Origin` 헤더가 Control UI origin 검사를 통과하지 못했습니다.

다음을 확인하세요:

- `gateway.controlUi.allowedOrigins`에 정확한 브라우저 origin이 포함되어 있는지
- 의도적으로 전체 허용 동작을 원하지 않는 한 와일드카드 origin에 의존하지 않는지
- 의도적으로 Host 헤더 대체 모드를 사용하는 경우 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`가 명시적으로 설정되어 있는지

### WebSocket이 여전히 실패하는 경우

프록시가 다음 조건을 만족하는지 확인하세요:

- WebSocket 업그레이드 지원(`Upgrade: websocket`, `Connection: upgrade`)
- WebSocket 업그레이드 요청에도 식별자 헤더 전달(HTTP에만 전달하면 안 됨)
- WebSocket 연결에 별도의 인증 경로를 두지 않음

## 토큰 인증에서 마이그레이션

token 인증에서 trusted-proxy로 이동하는 경우:

1. 프록시가 사용자를 인증하고 헤더를 전달하도록 구성합니다
2. 프록시 설정을 독립적으로 테스트합니다(헤더를 포함한 curl)
3. trusted-proxy 인증으로 OpenClaw 구성을 업데이트합니다
4. Gateway를 재시작합니다
5. Control UI에서 WebSocket 연결을 테스트합니다
6. `openclaw security audit`를 실행하고 결과를 검토합니다

## 관련 문서

- [보안](/ko/gateway/security) — 전체 보안 가이드
- [구성](/ko/gateway/configuration) — 구성 참조
- [원격 액세스](/ko/gateway/remote) — 다른 원격 액세스 패턴
- [Tailscale](/ko/gateway/tailscale) — tailnet 전용 액세스를 위한 더 단순한 대안
