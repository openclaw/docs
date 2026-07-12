---
read_when:
    - ID 인식 프록시 뒤에서 OpenClaw 실행하기
    - OpenClaw 앞단에 OAuth를 사용하는 Pomerium, Caddy 또는 nginx 설정하기
    - 리버스 프록시 설정에서 WebSocket 1008 인증되지 않음 오류 해결하기
    - HSTS 및 기타 HTTP 보안 강화 헤더를 설정할 위치 결정
sidebarTitle: Trusted proxy auth
summary: Gateway 인증을 신뢰할 수 있는 리버스 프록시(Pomerium, Caddy, nginx + OAuth)에 위임하기
title: 신뢰할 수 있는 프록시 인증
x-i18n:
    generated_at: "2026-07-12T00:51:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**보안에 민감한 기능입니다.** 이 모드는 인증을 전적으로 리버스 프록시에 위임합니다. 잘못 구성하면 Gateway가 무단 접근에 노출될 수 있습니다. 활성화하기 전에 이 페이지를 주의 깊게 읽으세요.
</Warning>

## 사용해야 하는 경우

- OpenClaw를 **ID 인식 프록시**(Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + 전달 인증) 뒤에서 실행하는 경우.
- 프록시가 모든 인증을 처리하고 헤더를 통해 사용자 ID를 전달하는 경우.
- 프록시가 Gateway에 접근할 수 있는 유일한 경로인 Kubernetes 또는 컨테이너 환경을 사용하는 경우.
- 브라우저가 WS 페이로드로 토큰을 전달할 수 없어 WebSocket `1008 unauthorized` 오류가 발생하는 경우.

## 사용하면 안 되는 경우

- 프록시가 사용자를 인증하지 않는 경우(단순한 TLS 종단점 또는 로드 밸런서인 경우).
- 프록시를 우회하여 Gateway에 접근할 수 있는 경로가 하나라도 있는 경우(방화벽 허점, 내부 네트워크 접근).
- 프록시가 전달된 헤더를 올바르게 제거하거나 덮어쓰는지 확실하지 않은 경우.
- 개인용 단일 사용자 접근만 필요한 경우(대신 Tailscale Serve + local loopback 사용을 고려하세요).

## 작동 방식

<Steps>
  <Step title="프록시가 사용자를 인증">
    리버스 프록시가 사용자 인증(OAuth, OIDC, SAML 등)을 수행합니다.
  </Step>
  <Step title="프록시가 ID 헤더를 추가">
    프록시가 인증된 사용자 ID가 포함된 헤더를 추가합니다(예: `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway가 신뢰할 수 있는 출처를 확인">
    OpenClaw는 요청이 **신뢰할 수 있는 프록시 IP**(`gateway.trustedProxies`)에서 왔으며 Gateway 자체의 loopback 또는 로컬 인터페이스 주소에서 오지 않았는지 확인합니다.
  </Step>
  <Step title="Gateway가 ID를 추출">
    OpenClaw는 필수 헤더를 읽은 다음 구성된 헤더에서 사용자 ID를 읽습니다.
  </Step>
  <Step title="권한 부여">
    모든 검사를 통과하고 사용자가 `allowUsers`(설정된 경우) 검사를 통과하면 요청에 권한이 부여됩니다.
  </Step>
</Steps>

## 구성

```json5
{
  gateway: {
    // 신뢰할 수 있는 프록시 인증에서는 기본적으로 프록시의 출발지 IP가 loopback이 아니어야 합니다
    bind: "lan",

    // 중요: 여기에 프록시의 IP만 추가하세요
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // 인증된 사용자 ID가 포함된 헤더(필수)
        userHeader: "x-forwarded-user",

        // 선택 사항: 반드시 존재해야 하는 헤더(프록시 확인)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // 선택 사항: 특정 사용자로 제한(비어 있음 = 모두 허용)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // 선택 사항: 명시적으로 동의한 후 동일 호스트의 loopback 프록시 허용
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**평가 순서에 따른 런타임 규칙**

1. 요청의 출발지 IP가 `gateway.trustedProxies`와 일치해야 하며(CIDR 인식), 일치하지 않으면 거부됩니다(`trusted_proxy_untrusted_source`).
2. Loopback 출발지 요청(`127.0.0.1`, `::1`)은 `gateway.auth.trustedProxy.allowLoopback = true`이고 loopback 주소도 `trustedProxies`에 포함되어 있지 않으면 거부됩니다(`trusted_proxy_loopback_source`). 이 검사는 헤더 검사 전에 실행되므로 필수 헤더도 누락된 경우라도 loopback 출발지는 이 사유로 실패합니다.
3. Gateway 호스트 자체의 로컬 네트워크 인터페이스 주소 중 하나와 일치하는 비-loopback 출발지는 스푸핑 방지 조치로 거부됩니다(`trusted_proxy_local_interface_source`). 인터페이스 검색 자체가 실패하는 경우에도 요청이 거부됩니다(`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders`와 `userHeader`가 존재해야 하며 비어 있지 않아야 합니다.
5. `allowUsers`가 비어 있지 않은 경우 추출된 사용자를 포함해야 합니다.

**전달 헤더 증거는 로컬 직접 폴백의 loopback 지역성보다 우선합니다.** 요청이 loopback으로 도착하지만 `Forwarded`, 임의의 `X-Forwarded-*` 또는 `X-Real-IP` 헤더를 포함하는 경우, 신뢰할 수 있는 프록시 인증에서는 여전히 loopback으로 실패하더라도 해당 증거로 인해 로컬 직접 비밀번호 폴백 및 기기 ID 게이팅 대상에서 제외됩니다.

`allowLoopback`은 Gateway 호스트의 로컬 프로세스를 리버스 프록시와 동일한 수준으로 신뢰합니다. Gateway가 여전히 원격 직접 접근으로부터 방화벽으로 차단되어 있고 로컬 프록시가 클라이언트가 제공한 ID 헤더를 제거하거나 덮어쓰는 경우에만 활성화하세요.

리버스 프록시를 통하지 않는 내부 Gateway 클라이언트는 신뢰할 수 있는 프록시 ID 헤더가 아니라 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 사용해야 합니다. 비-loopback Control UI 배포에는 여전히 명시적인 `gateway.controlUi.allowedOrigins`가 필요합니다.
</Warning>

### 구성 참조

<ParamField path="gateway.trustedProxies" type="string[]" required>
  신뢰할 프록시 IP 주소(또는 CIDR)의 배열입니다. 다른 IP에서 온 요청은 거부됩니다.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  반드시 `"trusted-proxy"`여야 합니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  인증된 사용자 ID가 포함된 헤더 이름입니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  요청을 신뢰하기 위해 반드시 존재해야 하는 추가 헤더입니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  사용자 ID 허용 목록입니다. 비어 있으면 인증된 모든 사용자를 허용합니다.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  동일 호스트의 loopback 리버스 프록시에 대한 선택적 지원입니다.
</ParamField>

<Warning>
로컬 리버스 프록시가 의도한 신뢰 경계인 경우에만 `allowLoopback`을 활성화하세요. Gateway에 연결할 수 있는 모든 로컬 프로세스가 프록시 ID 헤더 전송을 시도할 수 있으므로 Gateway 직접 접근은 호스트 내부로 제한하고, `x-forwarded-proto`와 같이 프록시가 소유하는 헤더 또는 프록시가 지원하는 경우 서명된 어설션 헤더를 요구하세요.
</Warning>

## Control UI 페어링 동작

`gateway.auth.mode = "trusted-proxy"`가 활성화되어 있고 요청이 신뢰할 수 있는 프록시 검사를 통과하면 Control UI WebSocket 세션은 기기 페어링 ID 없이 연결할 수 있습니다.

범위 관련 영향:

- 기기 없는 Control UI WebSocket 세션은 연결되지만 기본적으로 운영자 범위를 받지 않습니다. OpenClaw는 승인 및 페어링된 기기/토큰에 바인딩되지 않은 세션이 권한을 자체 선언하지 못하도록 요청된 범위 목록을 `[]`로 초기화합니다.
- WebSocket 연결에 성공한 후 메서드가 `missing scope`로 실패하면 브라우저가 기기 ID를 생성하고 페어링을 완료할 수 있도록 HTTPS를 사용하세요. [Control UI의 안전하지 않은 HTTP](/ko/web/control-ui#insecure-http)를 참조하세요.
- 비상시에만 사용: `gateway.controlUi.dangerouslyDisableDeviceAuth=true`는 기기 ID가 없어도 요청된 범위를 유지합니다. 이는 보안을 심각하게 약화하므로 신속하게 되돌리세요. [Control UI의 안전하지 않은 HTTP](/ko/web/control-ui#insecure-http)를 참조하세요.

리버스 프록시 범위 제한: 프록시가 Control UI WebSocket 업그레이드 요청에 `x-openclaw-scopes`를 보내면 OpenClaw는 세션 범위를 요청된 범위와 선언된 범위의 교집합으로 제한합니다. 이 헤더는 범위를 부여하지 않으며 세션이 보유할 수 있는 범위만 좁힙니다.

영향:

- 이 모드에서는 페어링이 더 이상 Control UI 접근의 기본 게이트가 아닙니다.
- 리버스 프록시 인증 정책과 `allowUsers`가 실질적인 접근 제어 수단이 됩니다.
- Gateway 인그레스는 신뢰할 수 있는 프록시 IP로만 제한하세요(`gateway.trustedProxies` + 방화벽).

사용자 지정 WebSocket 클라이언트는 Control UI 세션이 아닙니다. `gateway.controlUi.dangerouslyDisableDeviceAuth`는 임의의 `client.mode: "backend"` 또는 CLI 형태의 클라이언트에 범위를 부여하지 않습니다. 사용자 지정 자동화는 기기 ID/페어링, 예약된 직접 로컬 `client.id: "gateway-client"` 백엔드 도우미 경로 또는 HTTP 요청/응답 인터페이스가 더 적합한 경우 [관리자 HTTP RPC Plugin](/ko/plugins/admin-http-rpc)을 사용해야 합니다.

## 운영자 범위 헤더

신뢰할 수 있는 프록시 인증은 ID를 포함하는 HTTP 모드이므로 호출자는 HTTP API 요청에 `x-openclaw-scopes`를 사용하여 운영자 범위를 선택적으로 선언할 수 있습니다.

참고: WebSocket 범위는 Gateway 프로토콜 핸드셰이크와 기기 ID 바인딩에 의해 결정됩니다. Control UI WebSocket 업그레이드 요청에서 `x-openclaw-scopes`는 협상된 세션 범위의 상한일 뿐 범위를 부여하지 않습니다. [Control UI 페어링 동작](#control-ui-pairing-behavior)을 참조하세요.

예:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

동작:

- 헤더가 있으면 OpenClaw는 선언된 범위 집합을 적용합니다.
- 헤더가 있지만 비어 있으면 요청은 운영자 범위가 **없음**을 선언합니다.
- 헤더가 없으면 일반적인 ID 포함 HTTP API는 표준 운영자 기본 범위 집합(`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`)으로 폴백합니다.
- Gateway 인증 **Plugin HTTP 경로**는 기본적으로 더 제한적입니다. `x-openclaw-scopes`가 없으면 런타임 범위는 `operator.write`로만 폴백합니다.
- 브라우저 출처 HTTP 요청은 신뢰할 수 있는 프록시 인증에 성공한 후에도 `gateway.controlUi.allowedOrigins`(또는 의도적으로 설정한 Host 헤더 폴백 모드)를 통과해야 합니다.

실용적인 규칙: 신뢰할 수 있는 프록시 요청을 기본값보다 제한하려는 경우 또는 Gateway 인증 Plugin 경로에 쓰기 범위보다 강한 권한이 필요한 경우 `x-openclaw-scopes`를 명시적으로 전송하세요.

## TLS 종단과 HSTS

TLS 종단 지점을 하나만 사용하고 그곳에서 HSTS를 적용하세요.

<Tabs>
  <Tab title="프록시 TLS 종단(권장)">
    리버스 프록시가 `https://control.example.com`의 HTTPS를 처리하는 경우 해당 도메인에 대해 프록시에서 `Strict-Transport-Security`를 설정하세요.

    - 인터넷에 노출되는 배포에 적합합니다.
    - 인증서와 HTTP 보안 강화 정책을 한곳에서 관리합니다.
    - OpenClaw는 프록시 뒤에서 loopback HTTP로 유지할 수 있습니다.

    헤더 값 예:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS 종단">
    OpenClaw 자체에서 HTTPS를 직접 제공하는 경우(TLS 종단 프록시 없음) 다음과 같이 설정하세요.

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

    `strictTransportSecurity`는 문자열 헤더 값을 허용하며, 명시적으로 비활성화하려면 `false`를 사용할 수 있습니다.

  </Tab>
</Tabs>

### 출시 적용 지침

- 트래픽을 검증하는 동안에는 먼저 짧은 최대 기간(예: `max-age=300`)으로 시작하세요.
- 충분히 확신한 후에만 장기 값(예: `max-age=31536000`)으로 늘리세요.
- 모든 하위 도메인이 HTTPS를 사용할 준비가 된 경우에만 `includeSubDomains`를 추가하세요.
- 전체 도메인 집합에 대한 사전 로드 요구 사항을 의도적으로 충족하는 경우에만 사전 로드를 사용하세요.
- loopback 전용 로컬 개발에는 HSTS가 도움이 되지 않습니다.

## 프록시 설정 예

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium은 `x-pomerium-claim-email`(또는 다른 클레임 헤더)에 ID를 전달하고 `x-pomerium-jwt-assertion`에 JWT를 전달합니다.

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

    Pomerium 구성 조각:

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
  <Accordion title="OAuth를 사용하는 Caddy">
    `caddy-security` Plugin을 사용하는 Caddy는 사용자를 인증하고 ID 헤더를 전달할 수 있습니다.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/사이드카 프록시 IP
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
    oauth2-proxy는 사용자를 인증하고 `x-auth-request-email`에 신원 정보를 전달합니다.

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
  <Accordion title="전달 인증을 사용하는 Traefik">
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

공유 토큰(`gateway.auth.token` 또는 `OPENCLAW_GATEWAY_TOKEN`)도 구성되어 있으면 Gateway 시작 시 신뢰 프록시 인증을 거부합니다. 공유 토큰을 사용하면 동일 호스트 호출자가 이 모드에서 강제하려는 프록시 검증 신원과 완전히 다른 경로로 인증할 수 있으므로 두 방식은 상호 배타적입니다.

시작 시 `gateway auth mode is trusted-proxy, but a shared token is also configured`와 같은 오류가 발생하면 다음 중 하나를 수행하세요.

- 신뢰 프록시 모드를 사용할 때 공유 토큰을 제거하거나
- 토큰 기반 인증을 사용하려는 경우 `gateway.auth.mode`를 `"token"`으로 변경합니다.

local loopback 신뢰 프록시 신원 헤더도 실패 시 차단됩니다. 동일 호스트 호출자는 프록시 사용자로 자동 인증되지 않습니다. 프록시를 우회하는 내부 OpenClaw 호출자는 대신 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`로 인증할 수 있습니다. 신뢰 프록시 모드에서는 토큰 대체 인증을 의도적으로 지원하지 않습니다.

## 보안 체크리스트

신뢰 프록시 인증을 활성화하기 전에 다음을 확인하세요.

- [ ] **프록시가 유일한 경로임**: Gateway 포트는 프록시를 제외한 모든 대상에 대해 방화벽으로 차단되어 있습니다.
- [ ] **trustedProxies가 최소 범위임**: 전체 서브넷이 아니라 실제 프록시 IP만 포함합니다.
- [ ] **local loopback 프록시 소스를 의도적으로 사용함**: 동일 호스트 프록시를 위해 `gateway.auth.trustedProxy.allowLoopback`을 명시적으로 활성화하지 않으면 local loopback 소스 요청의 신뢰 프록시 인증은 실패 시 차단됩니다.
- [ ] **프록시가 헤더를 제거함**: 프록시는 클라이언트의 `x-forwarded-*` 헤더에 값을 추가하지 않고 덮어씁니다.
- [ ] **TLS 종료**: 프록시가 TLS를 처리하며 사용자는 HTTPS로 연결합니다.
- [ ] **allowedOrigins가 명시적임**: local loopback이 아닌 Control UI는 명시적인 `gateway.controlUi.allowedOrigins`를 사용합니다.
- [ ] **allowUsers가 설정됨**(권장): 인증된 모든 사용자를 허용하지 않고 알려진 사용자로 제한합니다.
- [ ] **혼합 토큰 구성이 없음**: `gateway.auth.token`과 `gateway.auth.mode: "trusted-proxy"`를 함께 설정하지 마세요.
- [ ] **로컬 비밀번호 대체 인증이 비공개임**: 내부 직접 호출자를 위해 `gateway.auth.password`를 구성하는 경우, 프록시를 거치지 않는 원격 클라이언트가 Gateway 포트에 직접 접근할 수 없도록 방화벽으로 차단하세요.

## 보안 감사

`openclaw security audit`는 신뢰 프록시 인증을 **심각** 심각도의 발견 사항으로 표시합니다. 이는 의도된 동작이며, 보안을 프록시 설정에 위임하고 있음을 상기시키기 위한 것입니다.

감사에서는 다음을 확인합니다.

- 기본 `gateway.trusted_proxy_auth` 경고/심각 알림.
- `trustedProxies` 구성 누락.
- `userHeader` 구성 누락.
- 비어 있는 `allowUsers`(인증된 모든 사용자 허용).
- 동일 호스트 프록시 소스에 대해 활성화된 `allowLoopback`.

Control UI가 노출될 때는 신뢰 프록시와 별개인 발견 사항도 적용됩니다. 여기에는 와일드카드이거나 누락된 `gateway.controlUi.allowedOrigins`와 Host 헤더 출처 대체 동작이 포함됩니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    요청이 `gateway.trustedProxies`의 IP에서 오지 않았습니다. 다음을 확인하세요.

    - 프록시 IP가 올바릅니까? (Docker 컨테이너 IP는 변경될 수 있습니다.)
    - 프록시 앞에 로드 밸런서가 있습니까?
    - 실제 IP를 확인하려면 `docker inspect` 또는 `kubectl get pods -o wide`를 사용하세요.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw가 local loopback 소스의 신뢰 프록시 요청을 거부했습니다.

    다음을 확인하세요.

    - 프록시가 `127.0.0.1` / `::1`에서 연결하고 있습니까?
    - 동일 호스트의 local loopback 역방향 프록시에서 신뢰 프록시 인증을 사용하려고 합니까?

    해결 방법:

    - 프록시를 통하지 않는 내부 동일 호스트 클라이언트에는 토큰/비밀번호 인증을 사용하는 것이 좋습니다. 또는
    - local loopback이 아닌 신뢰할 수 있는 프록시 주소를 통해 라우팅하고 해당 IP를 `gateway.trustedProxies`에 유지합니다. 또는
    - 의도적으로 동일 호스트 역방향 프록시를 사용하는 경우 `gateway.auth.trustedProxy.allowLoopback = true`를 설정하고, local loopback 주소를 `gateway.trustedProxies`에 유지하며, 프록시가 신원 헤더를 제거하거나 덮어쓰는지 확인합니다.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    요청의 소스 IP가 프록시가 아니라 Gateway 호스트 자체의 local loopback이 아닌 네트워크 인터페이스 주소 중 하나와 일치했습니다. 이는 tailnet 또는 Docker 브리지 네트워크에서 동일 호스트 트래픽을 위조하는 것을 방지하기 위한 보호 장치입니다. `..._check_failed`는 인터페이스 검색 자체에서 오류가 발생했음을 의미하므로 OpenClaw는 실패 시 차단합니다.

    다음을 확인하세요.

    - Gateway 호스트 자체의 프로세스가 프록시를 우회하여 신원 헤더를 직접 전송하고 있습니까?
    - 프록시가 Gateway와 동일한 네트워크 네임스페이스에서 실행되며 로컬 인터페이스에도 표시되는 IP를 사용합니까?

    해결 방법: Gateway 호스트에도 로컬로 바인딩된 주소가 아닌 주소를 통해 프록시 트래픽을 라우팅하거나, 실제 동일 호스트 프록시 설정에만 `allowLoopback`을 사용하세요.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    사용자 헤더가 비어 있거나 누락되었습니다. 다음을 확인하세요.

    - 프록시가 신원 헤더를 전달하도록 구성되어 있습니까?
    - 헤더 이름이 올바릅니까? (대소문자는 구분하지 않지만 철자는 정확해야 합니다.)
    - 사용자가 실제로 프록시에서 인증되었습니까?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    필수 헤더가 없습니다. 다음을 확인하세요.

    - 해당 특정 헤더에 대한 프록시 구성.
    - 체인의 어딘가에서 헤더가 제거되고 있는지 여부.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    사용자가 인증되었지만 `allowUsers`에 없습니다. 사용자를 추가하거나 허용 목록을 제거하세요.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode`는 `"trusted-proxy"`이지만 `gateway.trustedProxies`가 비어 있거나 `gateway.auth.trustedProxy` 자체가 누락되었습니다. 둘 다 설정될 때까지 모든 요청이 거부됩니다.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    신뢰 프록시 인증은 성공했지만 브라우저의 `Origin` 헤더가 Control UI 출처 검사를 통과하지 못했습니다.

    다음을 확인하세요.

    - `gateway.controlUi.allowedOrigins`에 정확한 브라우저 출처가 포함되어 있습니다.
    - 모든 출처 허용 동작을 의도하지 않는 한 와일드카드 출처에 의존하지 않습니다.
    - Host 헤더 대체 모드를 의도적으로 사용하는 경우 `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`가 의도적으로 설정되어 있습니다.

  </Accordion>
  <Accordion title="연결은 성공하지만 메서드에서 범위 누락을 보고함">
    WebSocket은 연결되지만 `chat.history`, `sessions.list` 또는
    `models.list`가 `missing scope: operator.read` 오류로 실패합니다.

    일반적인 원인:

    - 기기 없는 Control UI 세션: 신뢰 프록시 인증은 기기 신원 없이 WebSocket 연결을 허용할 수 있지만, OpenClaw는 설계상 기기 없는 세션의 범위를 제거합니다.
    - 사용자 지정 백엔드 클라이언트: `gateway.controlUi.dangerouslyDisableDeviceAuth`는 Control UI 범위에만 적용되며 임의의 백엔드 또는 CLI 형태 WebSocket 클라이언트에 범위를 부여하지 않습니다.
    - 지나치게 제한적인 `x-openclaw-scopes`: 프록시가 Control UI WebSocket 업그레이드 요청에 이 헤더를 주입하면 세션 범위가 해당 집합으로 제한됩니다. 헤더 값이 비어 있으면 범위가 부여되지 않습니다.

    해결 방법:

    - Control UI의 경우 브라우저가 기기 신원을 생성하고 페어링을 완료할 수 있도록 HTTPS를 사용하세요.
    - 사용자 지정 자동화에는 기기 신원/페어링, 예약된 직접 로컬 `gateway-client` 백엔드 도우미 경로 또는 [관리자 HTTP RPC](/ko/plugins/admin-http-rpc)를 사용하세요.
    - `gateway.controlUi.dangerouslyDisableDeviceAuth: true`는 Control UI의 임시 비상 접근 경로로만 사용하세요.

  </Accordion>
  <Accordion title="WebSocket이 계속 실패함">
    프록시가 다음을 충족하는지 확인하세요.

    - WebSocket 업그레이드(`Upgrade: websocket`, `Connection: upgrade`)를 지원합니다.
    - HTTP뿐만 아니라 WebSocket 업그레이드 요청에도 신원 헤더를 전달합니다.
    - WebSocket 연결에 별도의 인증 경로를 사용하지 않습니다.

  </Accordion>
</AccordionGroup>

## 토큰 인증에서 마이그레이션

<Steps>
  <Step title="프록시 구성">
    사용자를 인증하고 헤더를 전달하도록 프록시를 구성합니다.
  </Step>
  <Step title="프록시를 독립적으로 테스트">
    프록시 설정을 독립적으로 테스트합니다(헤더를 포함한 curl).
  </Step>
  <Step title="OpenClaw 구성 업데이트">
    신뢰 프록시 인증을 사용하도록 OpenClaw 구성을 업데이트합니다.
  </Step>
  <Step title="Gateway 다시 시작">
    Gateway를 다시 시작합니다.
  </Step>
  <Step title="WebSocket 테스트">
    Control UI에서 WebSocket 연결을 테스트합니다.
  </Step>
  <Step title="감사">
    `openclaw security audit`를 실행하고 발견 사항을 검토합니다.
  </Step>
</Steps>

## 관련 항목

- [구성](/ko/gateway/configuration) — 구성 참조
- [운영자 범위](/ko/gateway/operator-scopes) — 역할, 범위 및 승인 검사
- [원격 접근](/ko/gateway/remote) — 기타 원격 접근 패턴
- [보안](/ko/gateway/security) — 전체 보안 가이드
- [Tailscale](/ko/gateway/tailscale) — tailnet 전용 접근을 위한 더 간단한 대안
