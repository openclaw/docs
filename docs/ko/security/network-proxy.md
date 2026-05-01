---
read_when:
    - SSRF 및 DNS 리바인딩 공격에 대한 심층 방어가 필요합니다
    - OpenClaw 런타임 트래픽을 위한 외부 포워드 프록시 구성
summary: OpenClaw 런타임 HTTP 및 WebSocket 트래픽을 운영자 관리 필터링 프록시를 통해 라우팅하는 방법
title: 네트워크 프록시
x-i18n:
    generated_at: "2026-05-01T06:27:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9207d349e4410e38631ae7665be19b536e4a4128a4e80dd095e802804dfd66a3
    source_path: security/network-proxy.md
    workflow: 16
---

# 네트워크 프록시

OpenClaw는 런타임 HTTP 및 WebSocket 트래픽을 운영자가 관리하는 포워드 프록시를 통해 라우팅할 수 있습니다. 이는 중앙 집중식 송신 제어, 더 강력한 SSRF 보호, 더 나은 네트워크 감사 가능성을 원하는 배포를 위한 선택적 심층 방어입니다.

OpenClaw는 프록시를 제공하거나, 다운로드하거나, 시작하거나, 구성하거나, 인증하지 않습니다. 환경에 맞는 프록시 기술을 직접 실행하면, OpenClaw는 일반적인 프로세스 로컬 HTTP 및 WebSocket 클라이언트를 해당 프록시를 통해 라우팅합니다.

## 프록시를 사용하는 이유

프록시는 운영자에게 송신 HTTP 및 WebSocket 트래픽을 위한 단일 네트워크 제어 지점을 제공합니다. 이는 SSRF 강화 외에도 유용할 수 있습니다.

- 중앙 정책: 모든 애플리케이션 HTTP 호출 지점이 네트워크 규칙을 올바르게 적용하도록 의존하는 대신 하나의 송신 정책을 유지합니다.
- 연결 시점 검사: DNS 해석 후, 프록시가 업스트림 연결을 열기 직전에 대상을 평가합니다.
- DNS 리바인딩 방어: 애플리케이션 수준 DNS 검사와 실제 송신 연결 사이의 간격을 줄입니다.
- 더 넓은 JavaScript 적용 범위: 일반 `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch 및 유사한 클라이언트를 동일한 경로로 라우팅합니다.
- 감사 가능성: 송신 경계에서 허용 및 거부된 대상을 기록합니다.
- 운영 제어: OpenClaw를 다시 빌드하지 않고 대상 규칙, 네트워크 세분화, 속도 제한 또는 송신 허용 목록을 적용합니다.

프록시 라우팅은 일반 HTTP 및 WebSocket 송신을 위한 프로세스 수준 가드레일입니다. 운영자가 지원되는 JavaScript HTTP 클라이언트를 자체 필터링 프록시를 통해 라우팅하는 실패 시 차단 경로를 제공하지만, OS 수준 네트워크 샌드박스는 아니며 OpenClaw가 프록시의 대상 정책을 인증하게 만들지도 않습니다.

## OpenClaw가 트래픽을 라우팅하는 방식

`proxy.enabled=true`이고 프록시 URL이 구성된 경우, `openclaw gateway run`, `openclaw node run`, `openclaw agent --local` 같은 보호된 런타임 프로세스는 일반 HTTP 및 WebSocket 송신을 구성된 프록시를 통해 라우팅합니다.

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

공개 계약은 이를 구현하는 데 사용되는 내부 Node 훅이 아니라 라우팅 동작입니다. OpenClaw Gateway 제어 평면 WebSocket 클라이언트는 Gateway URL이 `localhost` 또는 `127.0.0.1`이나 `[::1]` 같은 리터럴 loopback IP를 사용할 때 local loopback Gateway RPC 트래픽에 대해 좁은 직접 경로를 사용합니다. 이 제어 평면 경로는 운영자 프록시가 loopback 대상을 차단하더라도 loopback Gateway에 도달할 수 있어야 합니다. 일반 런타임 HTTP 및 WebSocket 요청은 계속 구성된 프록시를 사용합니다.

내부적으로 OpenClaw는 이 기능을 위해 두 가지 프로세스 수준 라우팅 훅을 사용합니다.

- Undici 디스패처 라우팅은 `fetch`, undici 기반 클라이언트, 자체 undici 디스패처를 제공하는 전송을 처리합니다.
- `global-agent` 라우팅은 `http.request`, `https.request`, `http.get`, `https.get` 위에 계층화된 많은 라이브러리를 포함해 Node 코어 `node:http` 및 `node:https` 호출자를 처리합니다. 관리형 프록시 모드는 명시적인 Node HTTP 에이전트가 실수로 운영자 프록시를 우회하지 않도록 해당 전역 에이전트를 강제합니다.

일부 plugins는 프로세스 수준 라우팅이 있더라도 명시적인 프록시 배선이 필요한 사용자 지정 전송을 소유합니다. 예를 들어 Telegram의 Bot API 전송은 자체 HTTP/1 undici 디스패처를 사용하므로 해당 소유자별 전송 경로에서 프로세스 프록시 환경과 관리형 `OPENCLAW_PROXY_URL` 대체값을 따릅니다.

프록시 URL 자체는 `http://`를 사용해야 합니다. HTTPS 대상은 여전히 HTTP `CONNECT`를 통해 프록시에서 지원됩니다. 이는 OpenClaw가 `http://127.0.0.1:3128` 같은 일반 HTTP 포워드 프록시 리스너를 기대한다는 뜻일 뿐입니다.

프록시가 활성화되어 있는 동안 OpenClaw는 `no_proxy`, `NO_PROXY`, `GLOBAL_AGENT_NO_PROXY`를 지웁니다. 이러한 우회 목록은 대상 기반이므로, 여기에 `localhost` 또는 `127.0.0.1`을 남겨 두면 고위험 SSRF 대상이 필터링 프록시를 건너뛸 수 있습니다.

종료 시 OpenClaw는 이전 프록시 환경을 복원하고 캐시된 프로세스 라우팅 상태를 재설정합니다.

## 관련 프록시 용어

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw 런타임 송신을 위한 송신 포워드 프록시 라우팅입니다. 이 페이지는 해당 기능을 문서화합니다.
- `gateway.auth.mode: "trusted-proxy"`: Gateway 액세스를 위한 인바운드 ID 인식 리버스 프록시 인증입니다. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하세요.
- `openclaw proxy`: 개발 및 지원을 위한 로컬 디버그 프록시와 캡처 검사기입니다. [openclaw proxy](/ko/cli/proxy)를 참조하세요.
- 채널 또는 제공자별 프록시 설정: 특정 전송을 위한 소유자별 재정의입니다. 목표가 런타임 전체의 중앙 송신 제어라면 관리형 네트워크 프록시를 선호하세요.

## 구성

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

구성에서 `proxy.enabled=true`를 유지하면서 환경을 통해 URL을 제공할 수도 있습니다.

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`은 `OPENCLAW_PROXY_URL`보다 우선합니다.

`enabled=true`이지만 유효한 프록시 URL이 구성되지 않은 경우, 보호된 명령은 직접 네트워크 액세스로 대체되는 대신 시작에 실패합니다.

`openclaw gateway start`로 시작되는 관리형 Gateway 서비스의 경우 URL을 구성에 저장하는 것을 권장합니다.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

환경 대체값은 포그라운드 실행에 가장 적합합니다. 설치된 서비스와 함께 사용하는 경우 `OPENCLAW_PROXY_URL`을 `$OPENCLAW_STATE_DIR/.env` 또는 `~/.openclaw/.env` 같은 서비스의 지속 환경에 넣은 다음, launchd, systemd 또는 Scheduled Tasks가 해당 값으로 Gateway를 시작하도록 서비스를 다시 설치하세요.

`openclaw --container ...` 명령의 경우, OpenClaw는 `OPENCLAW_PROXY_URL`이 설정되어 있으면 컨테이너 대상 하위 CLI로 이를 전달합니다. URL은 컨테이너 내부에서 도달할 수 있어야 합니다. `127.0.0.1`은 호스트가 아니라 컨테이너 자체를 가리킵니다. 명시적으로 해당 안전 검사를 재정의하지 않는 한, OpenClaw는 컨테이너 대상 명령에서 loopback 프록시 URL을 거부합니다.

## 프록시 요구 사항

프록시 정책이 보안 경계입니다. OpenClaw는 프록시가 올바른 대상을 차단하는지 확인할 수 없습니다.

프록시를 다음과 같이 구성하세요.

- loopback 또는 비공개 신뢰 인터페이스에만 바인딩합니다.
- OpenClaw 프로세스, 호스트, 컨테이너 또는 서비스 계정만 사용할 수 있도록 액세스를 제한합니다.
- 대상을 자체적으로 해석하고 DNS 해석 후 대상 IP를 차단합니다.
- 일반 HTTP 요청과 HTTPS `CONNECT` 터널 모두에 대해 연결 시점에 정책을 적용합니다.
- loopback, 비공개, 링크 로컬, 메타데이터, 멀티캐스트, 예약 또는 문서화 범위에 대한 대상 기반 우회를 거부합니다.
- DNS 해석 경로를 완전히 신뢰하지 않는 한 호스트 이름 허용 목록을 피합니다.
- 요청 본문, 인증 헤더, 쿠키 또는 기타 비밀을 기록하지 않고 대상, 결정, 상태, 이유를 기록합니다.
- 프록시 정책을 버전 관리에 두고 보안에 민감한 구성처럼 변경 사항을 검토합니다.

## 권장 차단 대상

모든 포워드 프록시, 방화벽 또는 송신 정책의 시작점으로 이 거부 목록을 사용하세요.

OpenClaw 애플리케이션 수준 분류기 로직은 `src/infra/net/ssrf.ts` 및 `src/shared/net/ip.ts`에 있습니다. 관련 패리티 훅은 `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX`, 그리고 NAT64, 6to4, Teredo, ISATAP, IPv4 매핑 형식에 대한 내장 IPv4 센티널 처리입니다. 이러한 파일은 외부 프록시 정책을 유지 관리할 때 유용한 참조이지만, OpenClaw는 해당 규칙을 사용자의 프록시에 자동으로 내보내거나 적용하지 않습니다.

| 범위 또는 호스트                                                                    | 차단 이유                                            |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 loopback                                        |
| `::1/128`                                                                            | IPv6 loopback                                        |
| `0.0.0.0/8`, `::/128`                                                                | 지정되지 않은 주소 및 이 네트워크 주소              |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 비공개 네트워크                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | 링크 로컬 주소 및 일반적인 클라우드 메타데이터 경로 |
| `169.254.169.254`, `metadata.google.internal`                                        | 클라우드 메타데이터 서비스                          |
| `100.64.0.0/10`                                                                      | 통신사급 NAT 공유 주소 공간                         |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 벤치마킹 범위                                       |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 특수 용도 및 문서화 범위                            |
| `224.0.0.0/4`, `ff00::/8`                                                            | 멀티캐스트                                          |
| `240.0.0.0/4`                                                                        | 예약된 IPv4                                         |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 로컬/비공개 범위                               |
| `100::/64`, `2001:20::/28`                                                           | IPv6 폐기 및 ORCHIDv2 범위                          |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | 내장 IPv4가 있는 NAT64 접두사                       |
| `2002::/16`, `2001::/32`                                                             | 내장 IPv4가 있는 6to4 및 Teredo                     |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 호환 및 IPv4 매핑 IPv6                         |

클라우드 제공자 또는 네트워크 플랫폼이 추가 메타데이터 호스트나 예약 범위를 문서화하는 경우, 그것들도 추가하세요.

## 검증

OpenClaw를 실행하는 동일한 호스트, 컨테이너 또는 서비스 계정에서 프록시를 검증하세요.

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

기본적으로 사용자 지정 대상이 제공되지 않으면 명령은 `https://example.com/`이 성공하는지 확인하고, 프록시가 도달해서는 안 되는 임시 loopback 카나리아를 시작합니다. 기본 거부 검사는 프록시가 2xx가 아닌 거부 응답을 반환하거나 전송 실패로 카나리아를 차단하면 통과합니다. 성공 응답이 카나리아에 도달하면 실패합니다. 프록시가 활성화 및 구성되어 있지 않으면 검증은 구성 문제를 보고합니다. 구성을 변경하기 전 일회성 사전 점검에는 `--proxy-url`을 사용하세요. 배포별 기대치를 테스트하려면 `--allowed-url` 및 `--denied-url`을 사용하세요. 사용자 지정 거부 대상은 실패 시 차단 방식입니다. 어떤 HTTP 응답이든 대상이 프록시를 통해 도달 가능했다는 의미이며, OpenClaw가 프록시가 도달 가능한 원본을 차단했음을 증명할 수 없으므로 모든 전송 오류는 결론 불가로 보고됩니다. 검증 실패 시 명령은 코드 1로 종료됩니다.

자동화에는 `--json`을 사용하세요. JSON 출력에는 전체 결과, 유효한 프록시 구성 소스, 구성 오류, 각 대상 검사가 포함됩니다. 프록시 URL 자격 증명은 텍스트 및 JSON 출력에서 수정 처리됩니다.

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    }
  ]
}
```

`curl`로 수동 검증할 수도 있습니다:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

공개 요청은 성공해야 합니다. 루프백 및 메타데이터 요청은 프록시에 의해 차단되어야 합니다. `openclaw proxy validate`의 경우 기본 제공 루프백 카나리아는 프록시 거부와 도달 가능한 원본을 구분할 수 있습니다. 사용자 지정 `--denied-url` 검사는 해당 카나리아가 없으므로, 프록시가 배포별 거부 신호를 노출하고 이를 별도로 검증할 수 있는 경우가 아니라면 HTTP 응답과 모호한 전송 실패를 모두 검증 실패로 간주하세요.

그런 다음 OpenClaw 프록시 라우팅을 활성화하세요:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

또는 다음을 설정하세요:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## 제한 사항

- 프록시는 프로세스 로컬 JavaScript HTTP 및 WebSocket 클라이언트에 대한 적용 범위를 개선하지만, OS 수준 네트워크 샌드박스는 아닙니다.
- Raw `net`, `tls`, `http2` 소켓, 네이티브 애드온, 자식 프로세스는 프록시 환경 변수를 상속하고 준수하지 않는 한 Node 수준 프록시 라우팅을 우회할 수 있습니다.
- 사용자 로컬 WebUI와 로컬 모델 서버는 필요한 경우 운영자 프록시 정책의 허용 목록에 추가해야 합니다. OpenClaw는 이를 위한 일반적인 로컬 네트워크 우회를 노출하지 않습니다.
- Gateway 제어 플레인 프록시 우회는 의도적으로 `localhost`와 리터럴 루프백 IP URL로 제한됩니다. 로컬 직접 Gateway 제어 플레인 연결에는 `ws://127.0.0.1:18789`, `ws://[::1]:18789` 또는 `ws://localhost:18789`를 사용하세요. 다른 호스트 이름은 일반적인 호스트 이름 기반 트래픽처럼 라우팅됩니다.
- OpenClaw는 프록시 정책을 검사, 테스트 또는 인증하지 않습니다.
- 프록시 정책 변경은 보안에 민감한 운영 변경으로 취급하세요.
