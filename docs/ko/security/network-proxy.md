---
read_when:
    - SSRF 및 DNS 리바인딩 공격에 대한 심층 방어를 원합니다
    - OpenClaw 런타임 트래픽을 위한 외부 정방향 프록시 구성
summary: 운영자가 관리하는 필터링 프록시를 통해 OpenClaw 런타임의 HTTP 및 WebSocket 트래픽을 라우팅하는 방법
title: 네트워크 프록시
x-i18n:
    generated_at: "2026-07-12T15:46:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw은 런타임 HTTP 및 WebSocket 트래픽을 운영자가 관리하는 정방향 프록시를 통해 라우팅할 수 있습니다. 이는 선택적인 심층 방어 수단으로, 중앙 집중식 송신 제어, 강화된 SSRF 보호, 네트워크 경계에서의 목적지 감사 가능성을 제공합니다. 프록시는 DNS 확인 후 업스트림 연결을 열기 직전에 연결 시점의 목적지를 평가하므로, DNS 리바인딩 공격이 애플리케이션 수준의 이전 DNS 검사와 실제 아웃바운드 연결 사이에서 이용하는 간극도 줄입니다. 또한 단일 프록시 정책을 사용하면 운영자는 OpenClaw을 다시 빌드하지 않고도 한 곳에서 목적지 규칙, 네트워크 분할, 속도 제한 또는 아웃바운드 허용 목록을 적용할 수 있습니다.

OpenClaw은 프록시를 제공, 다운로드, 시작, 구성 또는 인증하지 않습니다. 환경에 적합한 프록시 기술은 사용자가 실행하며, OpenClaw은 자체 HTTP 및 WebSocket 클라이언트를 해당 프록시를 통해 라우팅합니다.

## 구성

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

`proxy.enabled: true`를 구성에 유지하면서 환경을 통해 URL을 설정할 수도 있습니다.

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl`이 `OPENCLAW_PROXY_URL`보다 우선합니다. `proxy.enabled`가 `true`이지만 유효한 URL을 확인할 수 없으면 보호 대상 명령은 직접 네트워크 액세스로 대체하지 않고 시작에 실패합니다.

| 키                   | 유형                                 | 기본값         | 참고                                                                                                                                          |
| -------------------- | ------------------------------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | 불리언                               | 설정되지 않음  | 라우팅을 활성화하려면 `true`여야 합니다.                                                                                                      |
| `proxy.proxyUrl`     | 문자열                               | 설정되지 않음  | `http://` 또는 `https://` 정방향 프록시 URL입니다. URL에 포함된 자격 증명은 민감한 정보로 취급되며 스냅샷/로그에서 마스킹됩니다.                |
| `proxy.tls.caFile`   | 문자열                               | 설정되지 않음  | 비공개 CA가 서명한 `https://` 프록시 엔드포인트를 검증하기 위한 CA 번들입니다.                                                                |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only` | 루프백 우회 동작을 제어합니다. 아래를 참조하십시오.                                                                                           |

관리형 Gateway 서비스에서는 포그라운드 환경 변수에 의존하지 말고 재설치 후에도 유지되도록 URL을 구성에 저장하십시오.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

`OPENCLAW_PROXY_URL` 환경 변수 대체 값은 포그라운드 실행에 가장 적합합니다. 설치된 서비스에서 사용하려면 서비스의 영구 환경(`$OPENCLAW_STATE_DIR/.env`, 기본값 `~/.openclaw/.env`)에 넣은 다음, launchd/systemd/Scheduled Tasks가 이를 가져오도록 재설치하십시오.

### 비공개 CA를 사용하는 HTTPS 프록시 엔드포인트

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile`은 프록시 엔드포인트 자체의 TLS 인증서를 검증합니다. 이는 목적지 MITM 신뢰 설정이나 클라이언트 인증서가 아니며 프록시의 목적지 정책을 대신하지도 않습니다. 전체 Node 프로세스가 시작 시점부터 추가 CA를 신뢰해야 하는 경우에만 `NODE_EXTRA_CA_CERTS`를 대신 사용하십시오(예: 모든 HTTPS 목적지 인증서에 다시 서명하는 엔터프라이즈 TLS 검사 시스템). 이 변수는 프로세스 전역에 적용되며 Node가 시작되기 전에 설정해야 하므로, OpenClaw은 `proxy.tls.caFile`처럼 실행 중간에 이를 적용할 수 없습니다. HTTPS 프록시 엔드포인트를 신뢰하려면 `proxy.tls.caFile`을 사용하는 것이 좋습니다. 전체 프로세스가 아니라 관리형 프록시 라우팅에만 범위가 한정됩니다.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## 라우팅 작동 방식

`proxy.enabled: true`이고 URL이 유효하면 보호 대상 런타임 프로세스(`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`)는 일반 HTTP 및 WebSocket 송신 트래픽을 프록시를 통해 라우팅합니다.

```text
OpenClaw 프로세스
  fetch, node:http, node:https, WebSocket 클라이언트  -> 운영자 프록시 -> 목적지
```

내부적으로 OpenClaw은 [Proxyline](https://github.com/openclaw/proxyline)을 프로세스 수준 라우팅 런타임으로 설치합니다. 이 런타임은 `fetch`, undici 기반 클라이언트, `node:http`/`node:https`, 일반적인 WebSocket 클라이언트 및 도우미가 생성한 `CONNECT` 터널을 처리하며, 호출자가 제공한 Node HTTP 에이전트를 대체하므로 명시적 에이전트(`axios`, `got`, `node-fetch` 및 이와 유사한 Node 에이전트 기반 클라이언트 포함)가 프록시를 조용히 우회할 수 없습니다.

프록시 URL 스킴은 OpenClaw에서 프록시까지의 홉을 나타내며 최종 목적지까지의 홉을 나타내지 않습니다.

- `http://proxy.example:3128` — 프록시까지 일반 TCP를 사용합니다. OpenClaw은 HTTPS 목적지용 `CONNECT`를 포함한 HTTP 프록시 요청을 전송합니다.
- `https://proxy.example:8443` — OpenClaw은 프록시 자체에 TLS 연결을 열고 프록시 인증서를 검증한 다음, 해당 세션 내에서 HTTP 프록시 요청을 전송합니다.

목적지 TLS는 프록시 엔드포인트 TLS와 독립적입니다. HTTPS 목적지의 경우 OpenClaw은 항상 프록시에 `CONNECT` 터널을 요청하고 해당 터널을 통해 목적지 TLS를 시작합니다.

프록시가 활성화된 동안 OpenClaw은 `no_proxy`/`NO_PROXY`를 지웁니다. 이러한 우회 목록은 목적지 기반이므로 `localhost` 또는 `127.0.0.1`을 그대로 두면 SSRF 대상이 프록시를 완전히 건너뛸 수 있습니다. 종료 시 OpenClaw은 이전 프록시 환경을 복원하고 캐시된 라우팅 상태를 재설정합니다.

일부 Plugin은 프로세스 수준 라우팅이 활성화된 경우에도 별도의 프록시 연결 설정이 필요한 사용자 지정 전송 방식을 소유합니다. Telegram의 Bot API 클라이언트는 자체 HTTP/1 undici 디스패처를 사용하며 프로세스 프록시 환경과 `OPENCLAW_PROXY_URL` 대체 값을 별도로 따릅니다.

### Gateway 루프백 모드

로컬 Gateway 제어 영역 클라이언트는 일반적으로 `ws://127.0.0.1:18789`와 같은 루프백 WebSocket에 연결합니다. `proxy.loopbackMode`는 이 트래픽이 관리형 프록시를 우회할지 제어합니다.

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy 또는 block
```

| 모드                     | 동작                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway-only` (기본값) | OpenClaw은 활성 Gateway 루프백 권한을 직접 연결 예외로 등록하므로 로컬 Gateway WebSocket 트래픽은 프록시 없이 연결됩니다. 예외가 정확히 구성된 호스트/포트를 대상으로 하므로 사용자 지정 루프백 포트도 작동합니다. 번들 브라우저 Plugin은 OpenClaw이 실행한 관리형 브라우저의 정확한 로컬 CDP 준비 URL 및 DevTools WebSocket URL에 대해 같은 종류의 예외를 등록합니다. 번들 Ollama 메모리 임베딩 공급자는 정확히 구성된 호스트 로컬 루프백 임베딩 출처에 대해 범위가 더 좁고 보호되는 직접 경로를 사용합니다. |
| `proxy`                  | 루프백 예외가 등록되지 않으며 Gateway 및 Ollama 루프백 트래픽이 프록시를 통과합니다. 원격 프록시는 OpenClaw 호스트의 루프백 서비스로 다시 라우팅할 수 있어야 합니다(예: 연결 가능한 호스트 이름, IP 또는 터널 사용). 일반적인 원격 프록시는 `127.0.0.1`/`localhost`를 OpenClaw 호스트가 아니라 프록시 자체를 기준으로 확인합니다.                                                                                                                                                                                                                                                               |
| `block`                  | OpenClaw은 소켓을 열기 전에 Gateway 루프백 제어 영역 연결과 보호되는 Ollama 루프백 임베딩 연결을 거부합니다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

Gateway 제어 영역 우회는 `localhost` 및 리터럴 루프백 IP URL로 제한됩니다. `ws://127.0.0.1:18789`, `ws://[::1]:18789` 또는 `ws://localhost:18789`를 사용하십시오. 다른 호스트 이름은 일반 트래픽처럼 라우팅됩니다.

### 컨테이너

`openclaw --container ...` 명령의 경우 `OPENCLAW_PROXY_URL`이 설정되어 있으면 OpenClaw은 이를 컨테이너 대상 하위 CLI로 전달합니다. URL은 컨테이너 내부에서 연결할 수 있어야 합니다. 컨테이너 안의 `127.0.0.1`은 호스트가 아니라 컨테이너 자체를 가리킵니다. 이 검사를 명시적으로 재정의하도록 `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1`을 설정하지 않는 한, OpenClaw은 컨테이너 대상 명령에서 루프백 프록시 URL을 거부합니다.

## 관련 프록시 용어

- `proxy.enabled` / `proxy.proxyUrl` — 런타임 송신 트래픽을 위한 아웃바운드 정방향 프록시 라우팅입니다. 이 페이지에서 설명합니다.
- `gateway.auth.mode: "trusted-proxy"` — Gateway 액세스를 위한 인바운드 ID 인식 역방향 프록시 인증입니다. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하십시오.
- `openclaw proxy` — 개발 및 지원을 위한 로컬 디버그 프록시 및 캡처 검사기입니다. [openclaw proxy](/ko/cli/proxy)를 참조하십시오.
- `tools.web.fetch.useTrustedEnvProxy` — 기본적으로 엄격한 DNS 고정 및 호스트 이름 정책을 유지하면서 운영자가 제어하는 HTTP(S) 환경 프록시가 DNS를 확인하도록 `web_fetch`에서 선택적으로 활성화하는 설정입니다. [웹 가져오기](/ko/tools/web-fetch#trusted-env-proxy)를 참조하십시오.
- 채널 또는 공급자별 프록시 설정 — 단일 전송 방식에 대한 소유자별 재정의입니다. 런타임 전체의 중앙 집중식 송신 제어에는 관리형 네트워크 프록시를 사용하는 것이 좋습니다.

## 프록시 검증

프록시의 목적지 정책이 실제 보안 경계입니다. OpenClaw은 프록시가 올바른 대상을 차단하는지 검증할 수 없습니다. 다음과 같이 구성하십시오.

- 루프백 또는 비공개 신뢰 인터페이스에만 바인딩하고 OpenClaw 프로세스/호스트/컨테이너/서비스 계정에서만 연결할 수 있도록 하십시오.
- 일반 HTTP 및 HTTPS `CONNECT` 터널 모두에서 목적지를 자체적으로 확인하고, DNS 확인 후 연결 시점에 IP를 기준으로 차단하십시오.
- 루프백, 비공개, 링크 로컬, 메타데이터, 멀티캐스트, 예약 및 문서용 범위에 대한 목적지 기반 우회를 거부하십시오.
- DNS 확인 경로를 완전히 신뢰하지 않는 한 호스트 이름 허용 목록을 사용하지 마십시오.
- 목적지, 결정, 상태 및 사유를 기록하되 요청 본문, 인증 헤더, 쿠키 또는 기타 비밀은 절대 기록하지 마십시오.
- 정책을 버전 관리하고 변경 사항을 보안에 민감한 것으로 취급하여 검토하십시오.

OpenClaw을 실행하는 동일한 호스트/컨테이너/서비스 계정에서 검증하십시오.

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

비공개 CA를 사용하는 HTTPS 프록시 엔드포인트의 경우:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| 플래그                     | 용도                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| `--proxy-url <url>`      | 구성/환경을 확인하는 대신 이 URL을 검증합니다.                   |
| `--proxy-ca-file <path>` | HTTPS 프록시 엔드포인트용 CA 번들입니다.                               |
| `--allowed-url <url>`    | 성공해야 하는 대상입니다(반복 지정 가능).                        |
| `--denied-url <url>`     | 차단되어야 하는 대상입니다(반복 지정 가능).                     |
| `--apns-reachable`       | 프록시가 샌드박스 APNs 직접 HTTP/2 프로브를 터널링할 수 있는지도 확인합니다. |
| `--apns-authority <url>` | `--apns-reachable`로 프로브하는 APNs 권한을 재정의합니다.          |
| `--timeout-ms <ms>`      | 요청별 제한 시간입니다.                                                 |
| `--json`                 | 기계 판독 가능 출력입니다.                                             |

`proxy.enabled`가 `true`가 아니고 `--proxy-url`도 지정하지 않으면, 명령은 검증하는 대신 구성 문제를 보고합니다. 구성을 변경하기 전에 일회성 사전 점검을 수행하려면 `--proxy-url`을 전달하십시오.

`--allowed-url`/`--denied-url`을 지정하지 않으면 기본 검사는 다음과 같습니다. `https://example.com/`은 성공해야 하며, 프록시가 접근해서는 안 되는 임시 루프백 카나리 서버는 차단되어야 합니다. 루프백 검사는 전송 실패가 발생하거나 카나리의 실행별 토큰이 없는 비-2xx 응답을 받으면 통과합니다. 토큰이 없는 2xx 응답(카나리가 아닌 다른 대상에서 발생한 예기치 않은 성공)이면 실패하며, 특히 일치하는 토큰을 포함한 응답은 프록시가 거부해야 할 루프백 대상을 실제로 전달했음을 증명하므로 실패합니다. 사용자 지정 `--denied-url` 대상에는 이러한 카나리 토큰이 없으므로 실패 폐쇄 방식으로 동작합니다. 모든 HTTP 응답은 접근 가능(실패)으로 간주하며, 전송 오류는 차단이 입증된 것으로 간주하지 않고 결론을 내릴 수 없는 상태로 보고합니다. 이는 OpenClaw가 프록시에서 접근 가능한 원본을 거부한 것인지, 아니면 다른 문제가 발생한 것인지 확인할 수 없기 때문입니다. `--apns-reachable`은 의도적으로 유효하지 않은 제공자 토큰을 전송하므로, `403 InvalidProviderToken` 응답은 터널이 Apple에 도달했다는 증거로 간주됩니다. 검증에 하나라도 실패하면 명령은 `1`로 종료됩니다. 프록시 URL 자격 증명은 텍스트와 JSON 출력 모두에서 마스킹됩니다.

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
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

수동 `curl` 검사(공개 요청은 성공해야 하며 루프백 및 메타데이터 요청은 프록시 자체에서 차단되어야 합니다. `curl`만으로는 `openclaw proxy validate`의 내장 카나리처럼 프록시의 거부와 접근 불가능한 원본을 구분할 수 없습니다):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## 권장 차단 대상

모든 포워드 프록시, 방화벽 또는 송신 정책에 적용할 초기 거부 목록입니다. OpenClaw 자체의 SSRF 분류기는 `src/infra/net/ssrf.ts` 및 `packages/net-policy/src/ip.ts`에 있습니다(`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, RFC 2544 벤치마크 접두사, NAT64/6to4/Teredo/ISATAP/IPv4 매핑 형식의 내장 IPv4 처리). 이는 유용한 참고 자료이지만, OpenClaw는 외부 프록시에 이러한 규칙을 내보내거나 적용하지 않습니다.

| 범위 또는 호스트                                                                        | 차단 이유                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | IPv4 루프백                                     |
| `::1/128`                                                                            | IPv6 루프백                                     |
| `0.0.0.0/8`, `::/128`                                                                | 미지정/현재 네트워크 주소              |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | RFC 1918 사설 네트워크                         |
| `169.254.0.0/16`, `fe80::/10`                                                        | 일반적인 클라우드 메타데이터 경로를 포함한 링크 로컬 |
| `169.254.169.254`, `metadata.google.internal`                                        | 클라우드 메타데이터 서비스                           |
| `100.64.0.0/10`                                                                      | 통신사급 NAT 공유 주소 공간            |
| `198.18.0.0/15`, `2001:2::/48`                                                       | 벤치마킹 범위                               |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | 특수 용도 및 문서화 범위              |
| `224.0.0.0/4`, `ff00::/8`                                                            | 멀티캐스트                                         |
| `240.0.0.0/4`                                                                        | 예약된 IPv4                                     |
| `fc00::/7`, `fec0::/10`                                                              | IPv6 로컬/사설 범위                         |
| `100::/64`, `2001:20::/28`                                                           | IPv6 폐기 및 ORCHIDv2 범위                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | IPv4가 내장된 NAT64 접두사                 |
| `2002::/16`, `2001::/32`                                                             | IPv4가 내장된 6to4 및 Teredo                |
| `::/96`, `::ffff:0:0/96`                                                             | IPv4 호환 및 IPv4 매핑 IPv6              |

클라우드 제공자 또는 네트워크 플랫폼에서 문서화한 추가 메타데이터 호스트나 예약 범위를 추가하십시오.

## 제한 사항

| 영역                                                      | 관리형 프록시 상태                                                                                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, 일반적인 WebSocket 클라이언트 | 구성된 경우 관리형 프록시 훅을 통해 라우팅됩니다.                                                                                                      |
| APNs 직접 HTTP/2                                           | APNs 관리형 `CONNECT` 도우미를 통해 라우팅됩니다.                                                                                                        |
| Gateway 제어 영역 루프백                               | 정확히 구성된 로컬 루프백 Gateway URL에만 직접 연결됩니다.                                                                                         |
| 디버그 프록시 업스트림 전달                              | 로컬 진단용으로 명시적으로 활성화하지 않는 한 관리형 프록시 모드가 활성화된 동안 비활성화됩니다.                                                             |
| IRC                                                          | 원시 TCP/TLS이며 관리형 HTTP 프록시 모드에서 프록시되지 않습니다. 배포 환경에서 모든 송신이 포워드 프록시를 통과해야 한다면 `channels.irc.enabled: false`를 설정하십시오. |
| 기타 원시 `net`, `tls` 또는 `http2` 클라이언트 호출              | 적용하기 전에 원시 소켓 가드가 분류해야 합니다.                                                                                               |

- 이는 JavaScript HTTP/WebSocket 클라이언트에 대한 프로세스 수준의 적용 범위이며, OS 수준의 네트워크 샌드박스가 아닙니다.
- 원시 `net`, `tls`, `http2` 소켓, 네이티브 애드온 및 OpenClaw 이외의 자식 프로세스는 프록시 환경 변수를 상속하고 준수하지 않는 한 Node 수준 라우팅을 우회할 수 있습니다. 포크된 OpenClaw 자식 CLI는 관리형 프록시 URL과 `proxy.loopbackMode` 상태를 상속합니다.
- 사용자 로컬 WebUI와 로컬 모델 서버에는 일반적인 로컬 네트워크 우회가 적용되지 않습니다. 필요한 경우 운영자 프록시 정책의 허용 목록에 추가하십시오. 예외는 번들 Ollama 메모리 임베딩 제공자의 보호된 직접 경로로, 구성된 `baseUrl`의 정확한 호스트 로컬 루프백 원본으로 범위가 제한됩니다. LAN, tailnet, 사설 네트워크 및 공개 Ollama 호스트는 여전히 관리형 프록시를 사용합니다.
- 관리형 프록시 모드가 활성화되어 있는 동안 로컬 디버그 프록시의 직접 업스트림 전달(프록시 요청 및 `CONNECT` 터널용)은 기본적으로 비활성화됩니다. 승인된 로컬 진단에만 활성화하십시오.
- OpenClaw는 프록시 정책을 검사, 테스트 또는 인증하지 않습니다. 프록시 정책 변경은 보안에 민감한 운영 변경으로 취급하십시오.
