---
read_when:
    - SSRF 및 DNS 리바인딩 공격에 대한 심층 방어가 필요합니다
    - OpenClaw 런타임 트래픽을 위한 외부 포워드 프록시 구성
summary: OpenClaw 런타임 HTTP 및 WebSocket 트래픽을 운영자 관리 필터링 프록시를 통해 라우팅하는 방법
title: 네트워크 프록시
x-i18n:
    generated_at: "2026-06-27T18:09:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw은 운영자가 관리하는 포워드 프록시를 통해 런타임 HTTP 및 WebSocket 트래픽을 라우팅할 수 있습니다. 이는 중앙 집중식 이그레스 제어, 더 강력한 SSRF 보호, 더 나은 네트워크 감사 가능성을 원하는 배포를 위한 선택적 심층 방어입니다.

OpenClaw은 프록시를 제공, 다운로드, 시작, 구성 또는 인증하지 않습니다. 환경에 맞는 프록시 기술을 직접 실행하면, OpenClaw이 일반적인 프로세스 로컬 HTTP 및 WebSocket 클라이언트를 그 프록시를 통해 라우팅합니다.

## 프록시를 사용하는 이유

프록시는 운영자에게 아웃바운드 HTTP 및 WebSocket 트래픽을 위한 단일 네트워크 제어 지점을 제공합니다. 이는 SSRF 강화 외의 경우에도 유용할 수 있습니다.

- 중앙 정책: 모든 애플리케이션 HTTP 호출 지점이 네트워크 규칙을 올바르게 적용하도록 의존하는 대신, 하나의 이그레스 정책을 유지합니다.
- 연결 시점 검사: DNS 확인 이후, 프록시가 업스트림 연결을 열기 직전에 대상을 평가합니다.
- DNS 리바인딩 방어: 애플리케이션 수준 DNS 검사와 실제 아웃바운드 연결 사이의 간격을 줄입니다.
- 더 넓은 JavaScript 적용 범위: 일반 `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch 및 유사한 클라이언트를 같은 경로로 라우팅합니다.
- 감사 가능성: 이그레스 경계에서 허용 및 거부된 대상을 기록합니다.
- 운영 제어: OpenClaw을 다시 빌드하지 않고 대상 규칙, 네트워크 세분화, 속도 제한 또는 아웃바운드 허용 목록을 적용합니다.

프록시 라우팅은 일반 HTTP 및 WebSocket 이그레스에 대한 프로세스 수준 가드레일입니다. 운영자가 지원되는 JavaScript HTTP 클라이언트를 자체 필터링 프록시를 통해 라우팅할 수 있는 실패 시 폐쇄 경로를 제공하지만, OS 수준 네트워크 샌드박스는 아니며 OpenClaw이 프록시의 대상 정책을 인증하게 만들지도 않습니다.

## OpenClaw이 트래픽을 라우팅하는 방식

`proxy.enabled=true`이고 프록시 URL이 구성된 경우, `openclaw gateway run`, `openclaw node run`, `openclaw agent --local` 같은 보호되는 런타임 프로세스는 일반 HTTP 및 WebSocket 이그레스를 구성된 프록시를 통해 라우팅합니다.

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

공개 계약은 내부 구현에 사용되는 Node 후크가 아니라 라우팅 동작입니다. OpenClaw Gateway 제어 평면 WebSocket 클라이언트는 Gateway URL이 `localhost` 또는 `127.0.0.1`이나 `[::1]` 같은 리터럴 루프백 IP를 사용할 때 local loopback Gateway RPC 트래픽에 대해 좁은 직접 경로를 사용합니다. 해당 제어 평면 경로는 운영자 프록시가 루프백 대상을 차단하더라도 루프백 Gateway에 도달할 수 있어야 합니다. 일반 런타임 HTTP 및 WebSocket 요청은 계속 구성된 프록시를 사용합니다.

내부적으로 OpenClaw은 이 기능을 위한 프로세스 수준 라우팅 런타임으로 Proxyline을 설치합니다. Proxyline은 `fetch`, undici 기반 클라이언트, Node 코어 `node:http` / `node:https` 호출자, 일반적인 WebSocket 클라이언트 및 헬퍼가 생성한 CONNECT 터널을 포함합니다. 관리형 프록시 모드는 호출자가 제공한 Node HTTP 에이전트를 대체하므로 명시적 에이전트가 실수로 운영자 프록시를 우회하지 않습니다.

일부 Plugin은 프로세스 수준 라우팅이 있더라도 명시적 프록시 배선이 필요한 사용자 지정 전송을 소유합니다. 예를 들어 Telegram의 Bot API 전송은 자체 HTTP/1 undici 디스패처를 사용하므로 해당 소유자별 전송 경로에서 프로세스 프록시 환경과 관리형 `OPENCLAW_PROXY_URL` 폴백을 따릅니다.

프록시 URL 자체는 `http://` 또는 `https://`를 사용할 수 있습니다. 이러한 스킴은 OpenClaw에서 프록시 엔드포인트까지의 연결을 설명합니다.

- `http://proxy.example:3128`: OpenClaw은 포워드 프록시에 일반 TCP 연결을 열고, HTTPS 대상에 대한 `CONNECT`를 포함한 HTTP 프록시 요청을 보냅니다.
- `https://proxy.example:8443`: OpenClaw은 프록시 엔드포인트에 TLS를 열고, 프록시 인증서를 검증한 다음, 해당 TLS 세션 안에서 HTTP 프록시 요청을 보냅니다.

대상 HTTPS는 프록시 엔드포인트 TLS와 별개입니다. HTTPS 대상의 경우에도 OpenClaw은 프록시에 HTTP `CONNECT` 터널을 요청한 다음, 해당 터널을 통해 대상 TLS를 시작합니다.

프록시가 활성화된 동안 OpenClaw은 `no_proxy`와 `NO_PROXY`를 지웁니다. 이러한 우회 목록은 대상 기반이므로, 여기에 `localhost` 또는 `127.0.0.1`을 남겨 두면 고위험 SSRF 대상이 필터링 프록시를 건너뛸 수 있습니다.

종료 시 OpenClaw은 이전 프록시 환경을 복원하고 캐시된 프로세스 라우팅 상태를 재설정합니다.

## 관련 프록시 용어

- `proxy.enabled` / `proxy.proxyUrl`: OpenClaw 런타임 이그레스를 위한 아웃바운드 포워드 프록시 라우팅입니다. 이 페이지는 해당 기능을 문서화합니다.
- `gateway.auth.mode: "trusted-proxy"`: Gateway 액세스를 위한 인바운드 ID 인식 리버스 프록시 인증입니다. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하세요.
- `openclaw proxy`: 개발 및 지원을 위한 로컬 디버그 프록시 및 캡처 검사기입니다. [openclaw proxy](/ko/cli/proxy)를 참조하세요.
- `tools.web.fetch.useTrustedEnvProxy`: 기본 엄격 DNS 고정 및 호스트 이름 정책을 유지하면서 운영자 제어 HTTP(S) 환경 프록시가 DNS를 확인하도록 `web_fetch`에 옵트인합니다. [웹 fetch](/ko/tools/web-fetch#trusted-env-proxy)를 참조하세요.
- 채널 또는 제공자별 프록시 설정: 특정 전송에 대한 소유자별 오버라이드입니다. 목표가 런타임 전반의 중앙 이그레스 제어라면 관리형 네트워크 프록시를 선호하세요.

## 구성

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

비공개 프록시 CA가 있는 HTTPS 프록시 엔드포인트의 경우:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

구성에서 `proxy.enabled=true`를 유지하면서 환경을 통해 URL을 제공할 수도 있습니다.

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`은 `OPENCLAW_PROXY_URL`보다 우선합니다.

### Gateway Loopback Mode

로컬 Gateway 제어 평면 클라이언트는 보통 `ws://127.0.0.1:18789` 같은 루프백 WebSocket에 연결합니다. 관리형 프록시가 활성화된 동안 루프백 관리형 프록시 예외가 어떻게 동작할지 선택하려면 `proxy.loopbackMode`를 사용하세요.

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only`(기본값): OpenClaw은 로컬 Gateway WebSocket 트래픽이 직접 연결될 수 있도록 Proxyline의 관리형 우회 정책에 Gateway 루프백 권한을 등록합니다. 활성 Gateway URL의 호스트와 포트가 등록되므로 사용자 지정 루프백 Gateway 포트가 동작합니다. 번들 브라우저 Plugin은 OpenClaw이 시작한 관리형 브라우저에 대해 정확한 로컬 CDP 준비 상태 및 DevTools WebSocket 엔드포인트도 등록할 수 있으며, 번들 Ollama 메모리 임베딩 제공자는 정확히 구성된 호스트 로컬 루프백 임베딩 원점에 대해 자체적으로 더 좁은 보호된 직접 경로를 사용할 수 있습니다.
- `proxy`: OpenClaw은 Gateway 또는 Ollama 루프백 우회를 등록하지 않으므로 해당 루프백 트래픽이 관리형 프록시를 통해 전송됩니다. 프록시가 원격인 경우 OpenClaw 호스트의 루프백 서비스에 대해, 프록시에서 도달 가능한 호스트 이름, IP 또는 터널에 매핑하는 것과 같은 특수 라우팅을 제공해야 합니다. 표준 원격 프록시는 `127.0.0.1` 및 `localhost`를 OpenClaw 호스트가 아니라 프록시 호스트에서 확인합니다.
- `block`: OpenClaw은 소켓을 열기 전에 Gateway 루프백 제어 평면 연결과 보호된 Ollama 호스트 로컬 임베딩 루프백 연결을 거부합니다.

`enabled=true`이지만 유효한 프록시 URL이 구성되지 않은 경우, 보호되는 명령은 직접 네트워크 액세스로 폴백하지 않고 시작에 실패합니다.

`openclaw gateway start`로 시작되는 관리형 Gateway 서비스의 경우 URL을 구성에 저장하는 방식을 선호하세요.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

환경 폴백은 포그라운드 실행에 가장 적합합니다. 설치된 서비스에서 이를 사용하는 경우 `$OPENCLAW_STATE_DIR/.env` 또는 `~/.openclaw/.env` 같은 서비스의 지속 환경에 `OPENCLAW_PROXY_URL`을 넣은 다음, launchd, systemd 또는 예약된 작업이 해당 값으로 Gateway를 시작하도록 서비스를 다시 설치하세요.

`openclaw --container ...` 명령의 경우, OpenClaw은 설정되어 있을 때 `OPENCLAW_PROXY_URL`을 컨테이너 대상 자식 CLI로 전달합니다. URL은 컨테이너 내부에서 도달 가능해야 합니다. `127.0.0.1`은 호스트가 아니라 컨테이너 자체를 가리킵니다. OpenClaw은 명시적으로 해당 안전 검사를 오버라이드하지 않는 한 컨테이너 대상 명령에 대해 루프백 프록시 URL을 거부합니다.

## 프록시 요구 사항

프록시 정책이 보안 경계입니다. OpenClaw은 프록시가 올바른 대상을 차단하는지 검증할 수 없습니다.

프록시를 다음과 같이 구성하세요.

- 루프백 또는 비공개 신뢰 인터페이스에만 바인딩합니다.
- OpenClaw 프로세스, 호스트, 컨테이너 또는 서비스 계정만 사용할 수 있도록 액세스를 제한합니다.
- 대상 자체를 확인하고 DNS 확인 후 대상 IP를 차단합니다.
- 일반 HTTP 요청과 HTTPS `CONNECT` 터널 모두에 대해 연결 시점에 정책을 적용합니다.
- 루프백, 비공개, 링크 로컬, 메타데이터, 멀티캐스트, 예약 또는 문서화 범위에 대한 대상 기반 우회를 거부합니다.
- DNS 확인 경로를 완전히 신뢰하지 않는 한 호스트 이름 허용 목록을 피합니다.
- 요청 본문, 권한 부여 헤더, 쿠키 또는 기타 비밀을 기록하지 않고 대상, 결정, 상태 및 이유를 기록합니다.
- 프록시 정책을 버전 관리에 두고 보안에 민감한 구성처럼 변경 사항을 검토합니다.

## 권장 차단 대상

이 거부 목록을 모든 포워드 프록시, 방화벽 또는 이그레스 정책의 시작점으로 사용하세요.

OpenClaw 애플리케이션 수준 분류기 로직은 `src/infra/net/ssrf.ts` 및 `packages/net-policy/src/ip.ts`에 있습니다. 관련 동등성 후크는 `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX`, 그리고 NAT64, 6to4, Teredo, ISATAP 및 IPv4 매핑 형식에 대한 내장 IPv4 센티널 처리입니다. 이러한 파일은 외부 프록시 정책을 유지 관리할 때 유용한 참고 자료이지만, OpenClaw은 해당 규칙을 프록시로 자동 내보내거나 적용하지 않습니다.

| 범위 또는 호스트                                                                        | 차단해야 하는 이유                                         |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 루프백                                        |
| `::1/128`                                                                            | IPv6 루프백                                        |
| `0.0.0.0/8`, `::/128`                                                                | 지정되지 않은 주소와 이 네트워크 주소               |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC1918 사설 네트워크                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | 링크-로컬 주소와 일반적인 클라우드 메타데이터 경로 |
| `169.254.169.254`, `metadata.google.internal`                                        | 클라우드 메타데이터 서비스                              |
| `100.64.0.0/10`                                                                      | 통신사용 NAT 공유 주소 공간               |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 벤치마킹 범위                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 특수 용도 및 문서화 범위                 |
| `224.0.0.0/4`, `ff00::/8`                                                            | 멀티캐스트                                            |
| `240.0.0.0/4`                                                                        | 예약된 IPv4                                        |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 로컬/사설 범위                            |
| `100::/64`, `2001:20::/28`                                                           | IPv6 폐기 및 ORCHIDv2 범위                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | IPv4가 포함된 NAT64 접두사                    |
| `2002::/16`, `2001::/32`                                                             | IPv4가 포함된 6to4 및 Teredo                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 호환 및 IPv4 매핑 IPv6                 |

클라우드 공급자나 네트워크 플랫폼이 추가 메타데이터 호스트 또는 예약 범위를 문서화한 경우, 해당 항목도 추가하세요.

## 검증

OpenClaw를 실행하는 동일한 호스트, 컨테이너 또는 서비스 계정에서 프록시를 검증하세요.

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

사설 CA로 서명된 HTTPS 프록시 엔드포인트의 경우:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

기본적으로 사용자 지정 대상이 제공되지 않으면, 명령은 `https://example.com/`이 성공하는지 확인하고 프록시가 도달해서는 안 되는 임시 루프백 카나리를 시작합니다. 기본 거부 검사는 프록시가 2xx가 아닌 거부 응답을 반환하거나 전송 실패로 카나리를 차단하면 통과하며, 성공 응답이 카나리에 도달하면 실패합니다. 프록시가 활성화 및 구성되어 있지 않으면 검증은 구성 문제를 보고합니다. 구성을 변경하기 전 일회성 사전 점검에는 `--proxy-url`을 사용하세요. 배포별 기대 동작을 테스트하려면 `--allowed-url` 및 `--denied-url`을 사용하세요. 프록시를 통해 direct APNs HTTP/2 전송이 CONNECT 터널을 열고 샌드박스 APNs 응답을 받을 수 있는지도 확인하려면 `--apns-reachable`을 추가하세요. 이 프로브는 의도적으로 잘못된 공급자 토큰을 사용하므로 `403 InvalidProviderToken`이 예상되며 도달 가능으로 계산됩니다. 사용자 지정 거부 대상은 fail-closed 방식입니다. 모든 HTTP 응답은 대상이 프록시를 통해 도달 가능했다는 뜻이며, 모든 전송 오류는 OpenClaw가 프록시가 도달 가능한 원본을 차단했음을 증명할 수 없기 때문에 결론 불가로 보고됩니다. 검증 실패 시 명령은 코드 1로 종료됩니다.

자동화에는 `--json`을 사용하세요. JSON 출력에는 전체 결과, 유효한 프록시 구성 소스, 구성 오류, 각 대상 검사가 포함됩니다. 프록시 URL 자격 증명은 텍스트 및 JSON 출력에서 마스킹됩니다.

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
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

`curl`로 수동 검증할 수도 있습니다.

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

공개 요청은 성공해야 합니다. 루프백 및 메타데이터 요청은 프록시에 의해 차단되어야 합니다. `openclaw proxy validate`의 경우 내장 루프백 카나리가 프록시 거부와 도달 가능한 원본을 구분할 수 있습니다. 사용자 지정 `--denied-url` 검사에는 해당 카나리가 없으므로, 프록시가 별도로 검증할 수 있는 배포별 거부 신호를 노출하지 않는 한 HTTP 응답과 모호한 전송 실패를 모두 검증 실패로 취급하세요.

## 프록시 CA 신뢰

프록시 엔드포인트 자체가 사설 CA로 서명된 인증서를 사용하는 경우 관리형 `proxy.tls.caFile`을 사용하세요.

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

해당 CA는 프록시 엔드포인트의 TLS 검증에 사용됩니다. 대상 MITM 신뢰 설정, 클라이언트 인증서, 또는 프록시의 대상 정책 대체물이 아닙니다.

프로세스의 모든 HTTPS 클라이언트에 대해 엔터프라이즈 TLS 검사 시스템이 대상 인증서를 재서명하는 경우처럼, 전체 Node 프로세스가 프로세스 시작 시점부터 추가 CA를 신뢰해야 할 때만 `NODE_EXTRA_CA_CERTS`를 사용하세요. `NODE_EXTRA_CA_CERTS`는 프로세스 전역이며 Node가 시작되기 전에 있어야 합니다. HTTPS 프록시 엔드포인트 신뢰에는 관리형 프록시 라우팅으로 범위가 제한되는 `proxy.tls.caFile`을 선호하세요.

그런 다음 OpenClaw 프록시 라우팅을 활성화하세요.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

또는 다음을 설정하세요.

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## 제한 사항

- 프록시는 프로세스 로컬 JavaScript HTTP 및 WebSocket 클라이언트의 적용 범위를 개선하지만, OS 수준 네트워크 샌드박스는 아닙니다.
- Gateway 루프백 제어 평면 트래픽은 기본적으로 `proxy.loopbackMode: "gateway-only"`를 통해 직접 로컬 우회를 사용합니다. OpenClaw는 Proxyline의 관리형 우회 정책에 활성 Gateway 루프백 authority를 등록하여 이 우회를 구현합니다. 운영자는 Gateway 루프백 트래픽을 관리형 프록시로 보내려면 `proxy.loopbackMode: "proxy"`를, 루프백 Gateway 연결을 거부하려면 `proxy.loopbackMode: "block"`을 설정할 수 있습니다. 원격 프록시 주의 사항은 [Gateway 루프백 모드](#gateway-loopback-mode)를 참조하세요.
- 원시 `net`, `tls`, `http2` 소켓, 네이티브 애드온, OpenClaw가 아닌 자식 프로세스는 프록시 환경 변수를 상속하고 준수하지 않는 한 Node 수준 프록시 라우팅을 우회할 수 있습니다. fork된 OpenClaw 자식 CLI는 관리형 프록시 URL과 `proxy.loopbackMode` 상태를 상속합니다.
- IRC는 운영자 관리형 전달 프록시 라우팅 밖에 있는 원시 TCP/TLS 채널입니다. 모든 이그레스가 해당 전달 프록시를 거쳐야 하는 배포에서는 direct IRC 이그레스가 명시적으로 승인되지 않은 한 `channels.irc.enabled=false`를 설정하세요.
- 로컬 디버그 프록시는 진단 도구이며, 관리형 프록시 모드가 활성화된 동안에는 프록시 요청 및 CONNECT 터널에 대한 direct upstream 전달이 기본적으로 비활성화됩니다. 승인된 로컬 진단에만 direct 전달을 활성화하세요.
- 사용자 로컬 WebUI와 로컬 모델 서버는 필요할 때 운영자 프록시 정책에서 허용 목록에 추가해야 합니다. OpenClaw는 이들을 위한 일반적인 로컬 네트워크 우회를 노출하지 않습니다. 번들 Ollama 메모리 임베딩 공급자는 더 좁습니다. 관리형 프록시가 호스트 루프백에 도달할 수 없을 때도 호스트 로컬 임베딩이 계속 작동하도록, 구성된 `baseUrl`에서 파생된 정확한 호스트 로컬 루프백 임베딩 원본에 대해서만 보호된 direct 경로를 사용할 수 있습니다. LAN, tailnet, 사설 네트워크, 공개 Ollama 임베딩 호스트는 여전히 관리형 프록시 경로를 사용합니다. `proxy.loopbackMode: "proxy"`는 이 Ollama 루프백 트래픽을 관리형 프록시로 보내고, `proxy.loopbackMode: "block"`은 연결을 열기 전에 이를 거부합니다.
- Gateway 제어 평면 프록시 우회는 의도적으로 `localhost`와 리터럴 루프백 IP URL로 제한됩니다. 로컬 direct Gateway 제어 평면 연결에는 `ws://127.0.0.1:18789`, `ws://[::1]:18789`, 또는 `ws://localhost:18789`를 사용하세요. 다른 호스트 이름은 일반적인 호스트 이름 기반 트래픽처럼 라우팅됩니다.
- OpenClaw는 프록시 정책을 검사, 테스트 또는 인증하지 않습니다.
- 프록시 정책 변경은 보안에 민감한 운영 변경으로 취급하세요.

| 표면                                                      | 관리형 프록시 상태                                                                               |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, 일반 WebSocket 클라이언트 | 구성된 경우 관리형 프록시 훅을 통해 라우팅됩니다.                                                |
| APNs direct HTTP/2                                           | APNs 관리형 CONNECT helper를 통해 라우팅됩니다.                                                    |
| Gateway 제어 평면 루프백                               | 구성된 로컬 루프백 Gateway URL에 대해서만 direct입니다.                                         |
| 디버그 프록시 upstream 전달                              | 로컬 진단을 위해 명시적으로 활성화하지 않는 한 관리형 프록시 모드가 활성화된 동안 비활성화됩니다.       |
| IRC                                                          | 원시 TCP/TLS이며, 관리형 HTTP 프록시 모드로 프록시되지 않습니다. direct IRC 이그레스가 승인되지 않은 한 비활성화하세요. |
| 기타 원시 `net`, `tls`, 또는 `http2` 클라이언트 호출              | 병합 전에 원시 소켓 guard로 분류해야 합니다.                                         |
