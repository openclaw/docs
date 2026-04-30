---
read_when:
    - macOS/iOS에서 Bonjour 검색 문제 디버깅
    - mDNS 서비스 유형, TXT 레코드 또는 검색 UX 변경
summary: Bonjour/mDNS 탐색 및 디버깅(Gateway 비컨, 클라이언트 및 일반적인 실패 모드)
title: Bonjour 탐색
x-i18n:
    generated_at: "2026-04-30T06:29:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Bonjour / mDNS 검색

OpenClaw는 Bonjour(mDNS / DNS‑SD)를 사용해 활성 Gateway(WebSocket 엔드포인트)를 검색합니다.
멀티캐스트 `local.` 탐색은 **LAN 전용 편의 기능**입니다. 번들된 `bonjour`
Plugin이 LAN 광고를 담당하며 기본적으로 활성화되어 있습니다. 네트워크 간 검색의 경우,
동일한 비컨을 구성된 광역 DNS-SD 도메인을 통해 게시할 수도 있습니다.
검색은 여전히 최선 노력 방식이며 SSH 또는 Tailnet 기반 연결을 대체하지 **않습니다**.

## Tailscale을 통한 광역 Bonjour(Unicast DNS-SD)

노드와 Gateway가 서로 다른 네트워크에 있으면 멀티캐스트 mDNS는 경계를 넘지 않습니다.
Tailscale을 통해 **unicast DNS‑SD**("Wide‑Area Bonjour")로 전환하면 동일한 검색 UX를 유지할 수 있습니다.

상위 단계:

1. Gateway 호스트에서 DNS 서버를 실행합니다(Tailnet을 통해 접근 가능).
2. 전용 존 아래에 `_openclaw-gw._tcp`의 DNS‑SD 레코드를 게시합니다
   (예: `openclaw.internal.`).
3. Tailscale **분할 DNS**를 구성해 선택한 도메인이 클라이언트(iOS 포함)에서 해당 DNS 서버를 통해 확인되도록 합니다.

OpenClaw는 모든 검색 도메인을 지원하며, `openclaw.internal.`은 예시일 뿐입니다.
iOS/Android 노드는 `local.`과 구성된 광역 도메인을 모두 탐색합니다.

### Gateway 구성(권장)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet 전용(권장)
  discovery: { wideArea: { enabled: true } }, // 광역 DNS-SD 게시 활성화
}
```

### 일회성 DNS 서버 설정(Gateway 호스트)

```bash
openclaw dns setup --apply
```

이 명령은 CoreDNS를 설치하고 다음과 같이 구성합니다.

- Gateway의 Tailscale 인터페이스에서만 포트 53 수신
- 선택한 도메인(예: `openclaw.internal.`)을 `~/.openclaw/dns/<domain>.db`에서 제공

Tailnet에 연결된 머신에서 검증합니다.

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 설정

Tailscale 관리 콘솔에서:

- Gateway의 tailnet IP(UDP/TCP 53)를 가리키는 네임서버를 추가합니다.
- 검색 도메인이 해당 네임서버를 사용하도록 분할 DNS를 추가합니다.

클라이언트가 tailnet DNS를 수락하면 iOS 노드와 CLI 검색은 멀티캐스트 없이도 검색 도메인에서
`_openclaw-gw._tcp`를 탐색할 수 있습니다.

### Gateway 리스너 보안(권장)

Gateway WS 포트(기본값 `18789`)는 기본적으로 루프백에 바인딩됩니다. LAN/tailnet
접근을 위해서는 명시적으로 바인딩하고 인증을 활성화된 상태로 유지하세요.

tailnet 전용 설정의 경우:

- `~/.openclaw/openclaw.json`에서 `gateway.bind: "tailnet"`을 설정합니다.
- Gateway를 재시작합니다(또는 macOS 메뉴 막대 앱을 재시작합니다).

## 광고하는 대상

Gateway만 `_openclaw-gw._tcp`를 광고합니다. LAN 멀티캐스트 광고는 번들된 `bonjour` Plugin이 제공하며,
광역 DNS-SD 게시는 Gateway가 계속 담당합니다.

## 서비스 유형

- `_openclaw-gw._tcp` — Gateway 전송 비컨(macOS/iOS/Android 노드에서 사용).

## TXT 키(비밀이 아닌 힌트)

Gateway는 UI 흐름을 편리하게 만들기 위해 작은 비밀이 아닌 힌트를 광고합니다.

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (TLS가 활성화된 경우에만)
- `gatewayTlsSha256=<sha256>` (TLS가 활성화되어 있고 지문을 사용할 수 있는 경우에만)
- `canvasPort=<port>` (캔버스 호스트가 활성화된 경우에만; 현재는 `gatewayPort`와 동일)
- `transport=gateway`
- `tailnetDns=<magicdns>` (mDNS 전체 모드에서만, Tailnet을 사용할 수 있을 때 선택적 힌트)
- `sshPort=<port>` (mDNS 전체 모드에서만; 광역 DNS-SD에서는 생략될 수 있음)
- `cliPath=<path>` (mDNS 전체 모드에서만; 광역 DNS-SD에서도 원격 설치 힌트로 기록)

보안 참고 사항:

- Bonjour/mDNS TXT 레코드는 **인증되지 않습니다**. 클라이언트는 TXT를 권위 있는 라우팅 정보로 취급해서는 안 됩니다.
- 클라이언트는 확인된 서비스 엔드포인트(SRV + A/AAAA)를 사용해 라우팅해야 합니다. `lanHost`, `tailnetDns`, `gatewayPort`, `gatewayTlsSha256`는 힌트로만 취급하세요.
- SSH 자동 대상 지정도 TXT 전용 힌트가 아니라 확인된 서비스 호스트를 사용해야 합니다.
- TLS 핀ning은 광고된 `gatewayTlsSha256`가 이전에 저장된 핀을 덮어쓰도록 허용해서는 절대 안 됩니다.
- iOS/Android 노드는 검색 기반 직접 연결을 **TLS 전용**으로 취급하고, 최초 지문을 신뢰하기 전에 명시적인 사용자 확인을 요구해야 합니다.

## macOS에서 디버깅

유용한 기본 제공 도구:

- 인스턴스 탐색:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 인스턴스 하나 확인(`<instance>` 교체):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

탐색은 되지만 확인이 실패한다면, 대개 LAN 정책 또는 mDNS 확인자 문제입니다.

## Gateway 로그에서 디버깅

Gateway는 롤링 로그 파일을 기록합니다(시작 시
`gateway log file: ...`로 출력). 특히 다음과 같은 `bonjour:` 줄을 확인하세요.

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour는 유효한 DNS 레이블인 경우 광고되는 `.local` 호스트에 시스템 호스트 이름을 사용합니다.
시스템 호스트 이름에 공백, 밑줄 또는 다른 유효하지 않은 DNS 레이블 문자가 포함되어 있으면 OpenClaw는 `openclaw.local`로 폴백합니다.
명시적인 호스트 레이블이 필요하면 Gateway를 시작하기 전에
`OPENCLAW_MDNS_HOSTNAME=<name>`을 설정하세요.

## iOS 노드에서 디버깅

iOS 노드는 `NWBrowser`를 사용해 `_openclaw-gw._tcp`를 검색합니다.

로그를 캡처하려면:

- 설정 → Gateway → 고급 → **검색 디버그 로그**
- 설정 → Gateway → 고급 → **검색 로그** → 재현 → **복사**

로그에는 브라우저 상태 전환과 결과 집합 변경 사항이 포함됩니다.

## Bonjour를 비활성화해야 하는 경우

Bonjour는 LAN 멀티캐스트 광고를 사용할 수 없거나 해로운 경우에만 비활성화하세요.
일반적인 사례는 Docker 브리지 네트워킹, WSL 뒤에서 실행되는 Gateway 또는
mDNS 멀티캐스트를 드롭하는 네트워크 정책입니다. 이러한 환경에서도 Gateway는
게시된 URL, SSH, Tailnet 또는 광역 DNS-SD를 통해 접근할 수 있지만,
LAN 자동 검색은 신뢰할 수 없습니다.

문제가 배포 범위에 한정되어 있다면 기존 환경 재정의를 선호하세요.

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

이 설정은 Plugin 구성을 변경하지 않고 LAN 멀티캐스트 광고를 비활성화합니다.
환경에서 설정이 사라지면 함께 사라지므로 Docker 이미지, 서비스 파일, 실행 스크립트, 일회성
디버깅에 안전합니다.

해당 OpenClaw 구성에서 번들된 LAN 검색 Plugin을 의도적으로 끄고 싶을 때만 Plugin 구성을 사용하세요.

```bash
openclaw plugins disable bonjour
```

## Docker 주의 사항

번들된 Bonjour Plugin은 `OPENCLAW_DISABLE_BONJOUR`가 설정되지 않은 상태에서 컨테이너가 감지되면
LAN 멀티캐스트 광고를 자동으로 비활성화합니다. Docker 브리지 네트워크는 일반적으로
컨테이너와 LAN 사이에서 mDNS 멀티캐스트(`224.0.0.251:5353`)를 전달하지 않으므로,
컨테이너에서 광고해도 검색이 동작하는 경우는 드뭅니다.

중요한 주의 사항:

- Bonjour를 비활성화해도 Gateway는 중지되지 않습니다. LAN 멀티캐스트 광고만 중지합니다.
- Bonjour를 비활성화해도 `gateway.bind`는 변경되지 않습니다. Docker는 게시된 호스트 포트가 동작할 수 있도록 여전히
  `OPENCLAW_GATEWAY_BIND=lan`을 기본값으로 사용합니다.
- Bonjour를 비활성화해도 광역 DNS-SD는 비활성화되지 않습니다. Gateway와 노드가 같은 LAN에 있지 않으면 광역 검색
  또는 Tailnet을 사용하세요.
- 동일한 `OPENCLAW_CONFIG_DIR`를 Docker 밖에서 재사용해도 컨테이너 자동 비활성화 정책은 지속되지 않습니다.
- 호스트 네트워킹, macvlan 또는 mDNS 멀티캐스트가 통과하는 것으로 알려진 다른 네트워크에서만
  `OPENCLAW_DISABLE_BONJOUR=0`을 설정하세요. 강제로 비활성화하려면 `1`로 설정합니다.

## 비활성화된 Bonjour 문제 해결

Docker 설정 후 노드가 더 이상 Gateway를 자동 검색하지 못하는 경우:

1. Gateway가 자동, 강제 켜짐 또는 강제 꺼짐 모드 중 무엇으로 실행 중인지 확인합니다.

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Gateway 자체가 게시된 포트를 통해 접근 가능한지 확인합니다.

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour가 비활성화된 경우 직접 대상을 사용합니다.
   - Control UI 또는 로컬 도구: `http://127.0.0.1:18789`
   - LAN 클라이언트: `http://<gateway-host>:18789`
   - 네트워크 간 클라이언트: Tailnet MagicDNS, Tailnet IP, SSH 터널 또는
     광역 DNS-SD

4. Docker에서 `OPENCLAW_DISABLE_BONJOUR=0`으로 Bonjour를 의도적으로 활성화했다면
   호스트에서 멀티캐스트를 테스트합니다.

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   탐색 결과가 비어 있거나 Gateway 로그에 반복적인 ciao watchdog
   취소가 표시되면 `OPENCLAW_DISABLE_BONJOUR=1`로 되돌리고 직접 경로 또는
   Tailnet 경로를 사용하세요.

## 일반적인 실패 모드

- **Bonjour는 네트워크를 넘지 않습니다**: Tailnet 또는 SSH를 사용하세요.
- **멀티캐스트 차단됨**: 일부 Wi‑Fi 네트워크는 mDNS를 비활성화합니다.
- **광고자가 probing/announcing 상태에서 멈춤**: 멀티캐스트가 차단된 호스트,
  컨테이너 브리지, WSL 또는 인터페이스 변동은 ciao 광고자를
  발표되지 않은 상태로 남길 수 있습니다. OpenClaw는 몇 차례 재시도한 뒤 광고자를 영원히 재시작하는 대신 현재 Gateway 프로세스에서 Bonjour를 비활성화합니다.
- **Docker 브리지 네트워킹**: 감지된 컨테이너에서는 Bonjour가 자동으로 비활성화됩니다.
  호스트, macvlan 또는 다른 mDNS 지원 네트워크에서만
  `OPENCLAW_DISABLE_BONJOUR=0`을 설정하세요.
- **절전 / 인터페이스 변동**: macOS가 mDNS 결과를 일시적으로 누락할 수 있습니다. 다시 시도하세요.
- **탐색은 되지만 확인이 실패함**: 머신 이름을 단순하게 유지하고(이모지나 구두점 피하기)
  Gateway를 재시작하세요. 서비스 인스턴스 이름은 호스트 이름에서 파생되므로,
  지나치게 복잡한 이름은 일부 확인자를 혼란스럽게 할 수 있습니다.

## 이스케이프된 인스턴스 이름(`\032`)

Bonjour/DNS‑SD는 서비스 인스턴스 이름의 바이트를 십진수 `\DDD`
시퀀스로 이스케이프하는 경우가 많습니다(예: 공백은 `\032`가 됨).

- 이는 프로토콜 수준에서 정상입니다.
- UI는 표시용으로 디코드해야 합니다(iOS는 `BonjourEscapes.decode` 사용).

## 비활성화 / 구성

- `openclaw plugins disable bonjour`는 번들된 Plugin을 비활성화하여 LAN 멀티캐스트 광고를 비활성화합니다.
- `openclaw plugins enable bonjour`는 기본 LAN 검색 Plugin을 복원합니다.
- `OPENCLAW_DISABLE_BONJOUR=1`은 Plugin 구성을 변경하지 않고 LAN 멀티캐스트 광고를 비활성화합니다. 허용되는 참 값은 `1`, `true`, `yes`, `on`입니다(레거시: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0`은 감지된 컨테이너 내부를 포함해 LAN 멀티캐스트 광고를 강제로 켭니다. 허용되는 거짓 값은 `0`, `false`, `no`, `off`입니다.
- `OPENCLAW_DISABLE_BONJOUR`가 설정되지 않은 경우 Bonjour는 일반 호스트에서 광고하고 감지된 컨테이너 내부에서는 자동으로 비활성화됩니다.
- `~/.openclaw/openclaw.json`의 `gateway.bind`는 Gateway 바인드 모드를 제어합니다.
- `OPENCLAW_SSH_PORT`는 `sshPort`가 광고될 때 SSH 포트를 재정의합니다(레거시: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS`는 mDNS 전체 모드가 활성화된 경우 TXT에 MagicDNS 힌트를 게시합니다(레거시: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH`는 광고되는 CLI 경로를 재정의합니다(레거시: `OPENCLAW_CLI_PATH`).

## 관련 문서

- 검색 정책 및 전송 선택: [검색](/ko/gateway/discovery)
- 노드 페어링 + 승인: [Gateway 페어링](/ko/gateway/pairing)
