---
read_when:
    - macOS/iOS에서 Bonjour 검색 문제 디버깅하기
    - mDNS 서비스 유형, TXT 레코드 또는 검색 UX 변경하기
summary: Bonjour/mDNS 검색 + 디버깅(Gateway 비콘, 클라이언트 및 일반적인 실패 모드)
title: Bonjour 검색
x-i18n:
    generated_at: "2026-04-26T11:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# Bonjour / mDNS 검색

OpenClaw는 활성 Gateway(WebSocket 엔드포인트)를 검색하기 위해 Bonjour(mDNS / DNS‑SD)를 사용합니다.
멀티캐스트 `local.` 검색은 **LAN 전용 편의 기능**입니다. 번들된 `bonjour`
Plugin이 LAN 광고를 담당하며 기본적으로 활성화되어 있습니다. 네트워크 간 검색을 위해서는
동일한 비콘을 구성된 광역 DNS-SD 도메인을 통해 게시할 수도 있습니다.
검색은 여전히 최선형(best-effort)이며 SSH 또는 Tailnet 기반 연결을 **대체하지 않습니다**.

## Tailscale을 통한 광역 Bonjour(Unicast DNS-SD)

Node와 gateway가 서로 다른 네트워크에 있으면 멀티캐스트 mDNS는 경계를 넘지 못합니다.
이 경우 **unicast DNS‑SD**
("광역 Bonjour")로 전환하여 동일한 검색 UX를 Tailscale 위에서 유지할 수 있습니다.

상위 수준 단계:

1. gateway 호스트에서 DNS 서버를 실행합니다(Tailnet을 통해 도달 가능해야 함).
2. 전용 zone 아래에 `_openclaw-gw._tcp`용 DNS‑SD 레코드를 게시합니다
   (예: `openclaw.internal.`).
3. 선택한 도메인이 해당
   DNS 서버를 통해 해석되도록 Tailscale **split DNS**를 구성합니다(iOS 포함 클라이언트 대상).

OpenClaw는 어떤 검색 도메인이든 지원합니다. `openclaw.internal.`은 예시일 뿐입니다.
iOS/Android Node는 `local.`과 구성된 광역 도메인을 모두 검색합니다.

### Gateway config(권장)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet 전용(권장)
  discovery: { wideArea: { enabled: true } }, // 광역 DNS-SD 게시 활성화
}
```

### 1회성 DNS 서버 설정(gateway 호스트)

```bash
openclaw dns setup --apply
```

이 명령은 CoreDNS를 설치하고 다음과 같이 구성합니다.

- gateway의 Tailscale 인터페이스에서만 포트 53 리슨
- `~/.openclaw/dns/<domain>.db`에서 선택한 도메인(예: `openclaw.internal.`) 제공

Tailnet에 연결된 시스템에서 검증:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 설정

Tailscale 관리자 콘솔에서:

- gateway의 tailnet IP(UDP/TCP 53)를 가리키는 nameserver를 추가합니다.
- 검색 도메인이 해당 nameserver를 사용하도록 split DNS를 추가합니다.

클라이언트가 tailnet DNS를 수락하면 iOS Node와 CLI 검색은 멀티캐스트 없이도
검색 도메인의 `_openclaw-gw._tcp`를 찾아볼 수 있습니다.

### Gateway 리스너 보안(권장)

Gateway WS 포트(기본값 `18789`)는 기본적으로 loopback에 바인드됩니다. LAN/tailnet
액세스에는 명시적으로 바인드하고 인증을 활성화된 상태로 유지하세요.

tailnet 전용 설정의 경우:

- `~/.openclaw/openclaw.json`에서 `gateway.bind: "tailnet"`을 설정합니다.
- Gateway를 재시작합니다(또는 macOS 메뉴 막대 앱을 재시작합니다).

## 무엇이 광고되는가

`_openclaw-gw._tcp`를 광고하는 것은 Gateway뿐입니다. LAN 멀티캐스트 광고는
번들된 `bonjour` Plugin이 제공하며, 광역 DNS-SD 게시 상태는 여전히
Gateway가 소유합니다.

## 서비스 유형

- `_openclaw-gw._tcp` — gateway 전송 비콘(macOS/iOS/Android Node에서 사용)

## TXT 키(비밀이 아닌 힌트)

Gateway는 UI 흐름을 편리하게 만들기 위해 작은 비밀이 아닌 힌트를 광고합니다.

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (TLS가 활성화된 경우에만)
- `gatewayTlsSha256=<sha256>` (TLS가 활성화되어 있고 fingerprint를 사용할 수 있는 경우에만)
- `canvasPort=<port>` (canvas 호스트가 활성화된 경우에만, 현재는 `gatewayPort`와 동일)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mDNS full 모드에서만, Tailnet을 사용할 수 있을 때의 선택적 힌트)
- `sshPort=<port>` (mDNS full 모드에서만, 광역 DNS-SD에서는 생략될 수 있음)
- `cliPath=<path>` (mDNS full 모드에서만, 광역 DNS-SD에서도 원격 설치 힌트로 계속 기록됨)

보안 참고:

- Bonjour/mDNS TXT 레코드는 **인증되지 않습니다**. 클라이언트는 TXT를 권위 있는 라우팅 정보로 취급해서는 안 됩니다.
- 클라이언트는 해석된 서비스 엔드포인트(SRV + A/AAAA)를 사용해 라우팅해야 합니다. `lanHost`, `tailnetDns`, `gatewayPort`, `gatewayTlsSha256`는 힌트로만 취급하세요.
- SSH 자동 타기팅도 마찬가지로 TXT 전용 힌트가 아니라 해석된 서비스 호스트를 사용해야 합니다.
- TLS pinning은 광고된 `gatewayTlsSha256`가 이전에 저장된 pin을 덮어쓰도록 절대 허용해서는 안 됩니다.
- iOS/Android Node는 검색 기반 직접 연결을 **TLS 전용**으로 취급해야 하며, 처음 보는 fingerprint를 신뢰하기 전에 반드시 명시적인 사용자 확인을 요구해야 합니다.

## macOS에서 디버깅

유용한 내장 도구:

- 인스턴스 검색:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 특정 인스턴스 해석(`<instance>` 교체):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

검색은 되는데 해석이 실패한다면, 보통 LAN 정책 또는
mDNS resolver 문제를 겪고 있는 것입니다.

## Gateway 로그에서 디버깅

Gateway는 롤링 로그 파일을 기록합니다(시작 시
`gateway log file: ...`로 출력됨). 특히 다음과 같은 `bonjour:` 줄을 찾으세요.

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## iOS Node에서 디버깅

iOS Node는 `NWBrowser`를 사용해 `_openclaw-gw._tcp`를 검색합니다.

로그 캡처 방법:

- 설정 → Gateway → 고급 → **검색 디버그 로그**
- 설정 → Gateway → 고급 → **검색 로그** → 재현 → **복사**

로그에는 브라우저 상태 전환과 결과 집합 변경 사항이 포함됩니다.

## Bonjour를 비활성화해야 하는 경우

Bonjour는 LAN 멀티캐스트 광고를 사용할 수 없거나 해로운 경우에만 비활성화하세요.
일반적인 사례는 Docker 브리지 네트워킹, WSL 뒤에서 실행되는 Gateway, 또는
mDNS 멀티캐스트를 차단하는 네트워크 정책입니다. 이런 환경에서는 Gateway에
게시된 URL, SSH, Tailnet 또는 광역 DNS-SD를 통해 여전히 도달할 수 있지만,
LAN 자동 검색은 신뢰할 수 없습니다.

문제가 배포 범위에 한정되어 있다면 기존 env override를 우선 사용하세요.

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

이 설정은 Plugin 구성을 변경하지 않고 LAN 멀티캐스트 광고를 비활성화합니다.
환경이 제거되면 설정도 사라지므로 Docker 이미지, 서비스 파일, 실행 스크립트, 일회성
디버깅에 안전합니다.

특정 OpenClaw config에서
번들된 LAN 검색 Plugin을 의도적으로 끄고 싶을 때만 Plugin 구성을 사용하세요.

```bash
openclaw plugins disable bonjour
```

## Docker 관련 주의사항

번들된 Docker Compose는 기본적으로 Gateway 서비스에 대해
`OPENCLAW_DISABLE_BONJOUR=1`을 설정합니다. Docker 브리지 네트워크는 일반적으로
컨테이너와 LAN 사이에서 mDNS 멀티캐스트
(`224.0.0.251:5353`)를 전달하지 않으므로, Bonjour를 켜 둔 채로 두면 검색은 동작하지 않으면서
반복적인 ciao `probing` 또는 `announcing` 실패만 발생할 수 있습니다.

중요한 주의사항:

- Bonjour를 비활성화해도 Gateway는 중지되지 않습니다. LAN 멀티캐스트
  광고만 중지합니다.
- Bonjour를 비활성화해도 `gateway.bind`는 변경되지 않습니다. Docker는 여전히
  기본적으로 `OPENCLAW_GATEWAY_BIND=lan`을 사용하므로 게시된 호스트 포트는 계속 동작할 수 있습니다.
- Bonjour를 비활성화해도 광역 DNS-SD는 비활성화되지 않습니다. Gateway와 Node가 같은 LAN에 없으면
  광역 검색 또는 Tailnet을 사용하세요.
- 동일한 `OPENCLAW_CONFIG_DIR`을 Docker 외부에서 재사용하더라도
  환경에 `OPENCLAW_DISABLE_BONJOUR`가 계속 설정되어 있지 않으면 Compose 기본값은 상속되지 않습니다.
- `OPENCLAW_DISABLE_BONJOUR=0`은 호스트 네트워킹, macvlan 또는
  mDNS 멀티캐스트가 통과하는 것이 확인된 다른 네트워크에서만 설정하세요.

## Bonjour 비활성화 문제 해결

Docker 설정 후 Node가 더 이상 Gateway를 자동 검색하지 못하는 경우:

1. Gateway가 의도적으로 LAN 광고를 억제하고 있는지 확인합니다.

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 게시된 포트를 통해 Gateway 자체에 도달 가능한지 확인합니다.

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour가 비활성화된 경우 직접 대상을 사용합니다.
   - Control UI 또는 로컬 도구: `http://127.0.0.1:18789`
   - LAN 클라이언트: `http://<gateway-host>:18789`
   - 네트워크 간 클라이언트: Tailnet MagicDNS, Tailnet IP, SSH 터널 또는
     광역 DNS-SD

4. Docker에서 `OPENCLAW_DISABLE_BONJOUR=0`으로
   Bonjour를 의도적으로 활성화했다면, 호스트에서 멀티캐스트를 테스트합니다.

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   검색 결과가 비어 있거나 Gateway 로그에 반복적인 ciao watchdog
   취소가 표시되면 `OPENCLAW_DISABLE_BONJOUR=1`로 되돌리고 직접 경로나
   Tailnet 경로를 사용하세요.

## 일반적인 실패 모드

- **Bonjour는 네트워크를 넘지 못함**: Tailnet 또는 SSH를 사용하세요.
- **멀티캐스트 차단됨**: 일부 Wi‑Fi 네트워크는 mDNS를 비활성화합니다.
- **광고기가 probing/announcing 상태에 멈춤**: 멀티캐스트가 차단된 호스트,
  컨테이너 브리지, WSL 또는 인터페이스 변동으로 인해 ciao 광고기가
  비광고 상태에 머물 수 있습니다. OpenClaw는 몇 차례 재시도한 뒤
  광고기를 무한 재시작하는 대신 현재 Gateway 프로세스에서 Bonjour를 비활성화합니다.
- **Docker 브리지 네트워킹**: 번들된 Docker Compose는 기본적으로
  `OPENCLAW_DISABLE_BONJOUR=1`로 Bonjour를 비활성화합니다. 호스트,
  macvlan 또는 다른 mDNS 지원 네트워크에서만 `0`으로 설정하세요.
- **절전 / 인터페이스 변동**: macOS는 일시적으로 mDNS 결과를 잃을 수 있습니다. 다시 시도하세요.
- **검색은 되는데 해석이 실패함**: 시스템 이름은 단순하게 유지하세요(이모지나
  문장부호 피하기). 그런 다음 Gateway를 재시작하세요. 서비스 인스턴스 이름은
  호스트 이름에서 파생되므로 지나치게 복잡한 이름은 일부 resolver를 혼란스럽게 할 수 있습니다.

## 이스케이프된 인스턴스 이름(`\032`)

Bonjour/DNS‑SD는 종종 서비스 인스턴스 이름의 바이트를 10진수 `\DDD`
시퀀스로 이스케이프합니다(예: 공백은 `\032`).

- 이는 프로토콜 수준에서 정상적인 동작입니다.
- UI는 표시용으로 디코딩해야 합니다(iOS는 `BonjourEscapes.decode` 사용).

## 비활성화 / 구성

- `openclaw plugins disable bonjour`는 번들된 Plugin을 비활성화하여 LAN 멀티캐스트 광고를 끕니다.
- `openclaw plugins enable bonjour`는 기본 LAN 검색 Plugin을 복원합니다.
- `OPENCLAW_DISABLE_BONJOUR=1`은 Plugin 구성을 변경하지 않고 LAN 멀티캐스트 광고를 비활성화합니다. 허용되는 truthy 값은 `1`, `true`, `yes`, `on`입니다(레거시: `OPENCLAW_DISABLE_BONJOUR`).
- Docker Compose는 브리지 네트워킹에서 기본적으로 `OPENCLAW_DISABLE_BONJOUR=1`을 설정합니다. mDNS 멀티캐스트를 사용할 수 있을 때만 `OPENCLAW_DISABLE_BONJOUR=0`으로 override하세요.
- `~/.openclaw/openclaw.json`의 `gateway.bind`는 Gateway 바인드 모드를 제어합니다.
- `OPENCLAW_SSH_PORT`는 `sshPort`가 광고될 때 SSH 포트를 override합니다(레거시: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS`는 mDNS full 모드가 활성화되었을 때 TXT에 MagicDNS 힌트를 게시합니다(레거시: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH`는 광고되는 CLI 경로를 override합니다(레거시: `OPENCLAW_CLI_PATH`).

## 관련 문서

- 검색 정책 및 전송 선택: [검색](/ko/gateway/discovery)
- Node 페어링 + 승인: [Gateway 페어링](/ko/gateway/pairing)
