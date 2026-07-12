---
read_when:
    - macOS/iOS에서 Bonjour 검색 문제 디버깅하기
    - mDNS 서비스 유형, TXT 레코드 또는 검색 UX 변경
summary: Bonjour/mDNS 검색 및 디버깅(Gateway 비콘, 클라이언트, 일반적인 장애 유형)
title: Bonjour 검색
x-i18n:
    generated_at: "2026-07-12T00:44:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0526c9e20dd02d143ae7aa4c8e1e6830763763e95c9a74c4d73332c5e5e155e
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw는 Bonjour(mDNS/DNS-SD)를 사용하여 활성 Gateway(WebSocket 엔드포인트)를 검색할 수 있습니다. 멀티캐스트 `local.` 탐색은 **LAN 전용 편의 기능**입니다. 번들 `bonjour` Plugin이 LAN 광고를 담당하며 macOS 호스트에서는 자동으로 시작되고 Linux, Windows 및 컨테이너화된 Gateway 배포에서는 명시적으로 활성화해야 합니다. 동일한 비콘을 구성된 광역 DNS-SD 도메인을 통해 게시하여 네트워크 간 검색에도 사용할 수 있습니다. 검색은 최선형 방식으로 동작하며 SSH 또는 Tailnet 기반 연결을 **대체하지 않습니다**.

## Tailscale을 통한 광역 Bonjour(유니캐스트 DNS-SD)

Node와 Gateway가 서로 다른 네트워크에 있으면 멀티캐스트 mDNS는 경계를 넘을 수 없습니다. Tailscale에서 **유니캐스트 DNS-SD**("광역 Bonjour")로 전환하여 동일한 검색 사용자 경험을 유지할 수 있습니다.

1. Tailnet을 통해 접근할 수 있는 DNS 서버를 Gateway 호스트에서 실행합니다.
2. 전용 영역(예: `openclaw.internal.`) 아래에 `_openclaw-gw._tcp`의 DNS-SD 레코드를 게시합니다.
3. iOS를 포함한 클라이언트에서 선택한 도메인이 해당 DNS 서버를 통해 확인되도록 Tailscale **분할 DNS**를 구성합니다.

위의 `openclaw.internal.`은 예시일 뿐이며, OpenClaw는 모든 검색 도메인을 지원합니다. iOS/Android Node는 `local.`과 구성된 광역 도메인을 모두 탐색합니다.

### Gateway 구성

```json5
{
  gateway: { bind: "tailnet" }, // Tailnet 전용(권장)
  discovery: { wideArea: { enabled: true, domain: "openclaw.internal" } },
}
```

`discovery.wideArea.domain`이 설정되지 않은 경우 `OPENCLAW_WIDE_AREA_DOMAIN` 환경 변수를 대체 값으로 사용할 수도 있습니다.

### 일회성 DNS 서버 설정(Gateway 호스트, macOS 전용)

```bash
openclaw dns setup --apply
```

이 명령은 macOS 전용이며 Homebrew와 실행 중인 Tailscale 연결이 필요합니다. CoreDNS(`brew install coredns`)를 설치하고 다음과 같이 구성합니다.

- Gateway의 Tailscale 인터페이스에서만 포트 53을 수신
- `~/.openclaw/dns/<domain>.db`에서 선택한 도메인(예: `openclaw.internal.`) 제공

아무것도 설치하지 않고 계획(도메인, 영역 파일 경로, 감지된 Tailnet IP, 권장 구성)을 미리 보려면 먼저 `--apply` 없이 실행합니다.

Tailnet에 연결된 머신에서 검증합니다.

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 설정

Tailscale 관리 콘솔에서 다음을 수행합니다.

- Gateway의 Tailnet IP(UDP/TCP 53)를 가리키는 네임서버를 추가합니다.
- 검색 도메인이 해당 네임서버를 사용하도록 분할 DNS를 추가합니다.

클라이언트가 Tailnet DNS를 수락하면 iOS Node와 CLI 검색에서 멀티캐스트 없이 검색 도메인의 `_openclaw-gw._tcp`를 탐색할 수 있습니다.

### Gateway 리스너 보안

Gateway WS 포트(기본값 `18789`)는 기본적으로 local loopback에 바인딩됩니다. LAN/Tailnet 접근을 허용하려면 명시적으로 바인딩하고 인증을 활성화된 상태로 유지하십시오. Tailnet 전용 설정에서는 `~/.openclaw/openclaw.json`에 `gateway.bind: "tailnet"`을 설정하고 Gateway 또는 macOS 메뉴 막대 앱을 다시 시작합니다.

## 광고 대상

Gateway만 `_openclaw-gw._tcp`를 광고합니다. LAN 멀티캐스트 광고는 활성화된 경우 번들 `bonjour` Plugin이 담당하며, 광역 DNS-SD 게시는 계속 Gateway가 담당합니다.

## 서비스 유형

- `_openclaw-gw._tcp` - macOS/iOS/Android Node에서 사용하는 Gateway 전송 비콘입니다.

## TXT 키(비밀이 아닌 힌트)

| 키                            | 존재 조건                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `role=gateway`                | 항상 존재합니다.                                                               |
| `displayName=<friendly name>` | 항상 존재합니다.                                                               |
| `lanHost=<hostname>.local`    | 항상 존재합니다.                                                               |
| `gatewayPort=<port>`          | 항상 존재합니다(Gateway WS + HTTP).                                            |
| `transport=gateway`           | 항상 존재합니다.                                                               |
| `gatewayTls=1`                | TLS가 활성화된 경우에만 존재합니다.                                             |
| `gatewayTlsSha256=<sha256>`   | TLS가 활성화되고 지문을 사용할 수 있는 경우에만 존재합니다.                    |
| `gatewayDirectReachable=1`    | Gateway에 직접 접근할 수 있는 경우에만 존재합니다(릴레이/프록시 경로 전용 제외). |
| `canvasPort=<port>`           | 캔버스 호스트가 활성화된 경우에만 존재하며, 현재는 `gatewayPort`와 같습니다.   |
| `tailnetDns=<magicdns>`       | mDNS 전체 모드에서만 존재하며, Tailnet을 사용할 수 있을 때 제공되는 선택적 힌트입니다. |
| `sshPort=<port>`              | 전체 모드에서만 존재하며 최소 및 꺼짐 모드에서는 생략됩니다.                   |
| `cliPath=<path>`              | 전체 모드에서만 존재하며 최소 및 꺼짐 모드에서는 생략됩니다.                   |

보안 참고 사항:

- Bonjour/mDNS TXT 레코드는 **인증되지 않습니다**. 클라이언트는 TXT를 신뢰할 수 있는 라우팅 정보로 취급해서는 안 됩니다.
- 클라이언트는 확인된 서비스 엔드포인트(SRV + A/AAAA)를 사용하여 라우팅해야 합니다. `lanHost`, `tailnetDns`, `gatewayPort`, `gatewayTlsSha256`는 힌트로만 취급하십시오.
- SSH 자동 대상 지정도 TXT 전용 힌트가 아닌 확인된 서비스 호스트를 사용해야 합니다.
- TLS 고정 시 광고된 `gatewayTlsSha256`가 이전에 저장된 고정 값을 재정의하도록 허용해서는 안 됩니다.
- iOS/Android Node는 검색 기반 직접 연결을 **TLS 전용**으로 취급하고 최초 지문을 신뢰하기 전에 사용자의 명시적 확인을 요구해야 합니다.

## macOS에서 디버깅

기본 제공 도구:

```bash
# 인스턴스 탐색
dns-sd -B _openclaw-gw._tcp local.

# 인스턴스 하나 확인(<instance> 교체)
dns-sd -L "<instance>" _openclaw-gw._tcp local.
```

탐색은 작동하지만 확인이 실패한다면 일반적으로 LAN 정책 또는 mDNS 확인자 문제입니다.

## Gateway 로그에서 디버깅

Gateway는 순환 로그 파일을 기록합니다(시작 시 `gateway log file: ...` 형식으로 출력됨). 특히 다음과 같은 `bonjour:` 줄을 확인하십시오.

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

워치독은 활성 `probing`, `announcing` 및 최근 충돌로 인한 이름 변경을 진행 중 상태로 취급합니다. 서비스가 끝내 `announced` 상태에 도달하지 못하면 OpenClaw는 광고자를 다시 생성하며, 실패가 반복되면 무한히 재광고하는 대신 해당 Gateway 프로세스에서 Bonjour를 비활성화합니다.

Bonjour는 시스템 호스트 이름이 유효한 DNS 레이블이면 광고되는 `.local` 호스트에 해당 이름을 사용합니다. 시스템 호스트 이름에 공백, 밑줄 또는 기타 유효하지 않은 DNS 레이블 문자가 포함되어 있으면 OpenClaw는 `openclaw.local`을 사용합니다. 명시적인 호스트 레이블이 필요한 경우 Gateway를 시작하기 전에 `OPENCLAW_MDNS_HOSTNAME=<name>`을 설정하십시오.

## iOS Node에서 디버깅

iOS Node는 `NWBrowser`를 사용하여 `_openclaw-gw._tcp`를 검색합니다.

로그를 수집하려면 Settings -> Gateway -> Advanced -> **Discovery Debug Logs**로 이동한 다음 Settings -> Gateway -> Advanced -> **Discovery Logs** -> 재현 -> **Copy** 순서로 진행합니다. 로그에는 브라우저 상태 전환과 결과 집합 변경 사항이 포함됩니다.

## Bonjour를 활성화해야 하는 경우

로컬 앱과 인근 iOS/Android Node가 동일 LAN 검색에 일반적으로 의존하므로, macOS 호스트에서 빈 구성으로 Gateway를 시작하면 Bonjour가 자동으로 시작됩니다.

Linux, Windows 또는 기타 macOS가 아닌 호스트에서 동일 LAN 자동 검색이 유용한 경우 명시적으로 활성화합니다.

```bash
openclaw plugins enable bonjour
```

활성화된 경우 Bonjour는 `discovery.mdns.mode`를 사용하여 게시할 TXT 메타데이터의 양을 결정합니다. 동일한 모드는 광역 DNS-SD 레코드의 선택적 TXT 힌트도 제어합니다. 모드는 다음과 같습니다.

| 모드                | 동작                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` (기본값)  | 핵심 TXT 키만 사용하며 `sshPort`, `cliPath`, `tailnetDns`를 생략합니다.                                                                                        |
| `full`              | `sshPort`, `cliPath`, `tailnetDns`를 추가합니다. 클라이언트에 해당 힌트가 필요할 때 사용합니다.                                                                 |
| `off`               | Plugin 활성화 상태를 변경하지 않고 LAN 멀티캐스트를 억제합니다. `discovery.wideArea.enabled`가 true이면 광역 DNS-SD에서 최소 비콘을 계속 게시할 수 있습니다. |

## Bonjour를 비활성화해야 하는 경우

LAN 멀티캐스트 광고가 불필요하거나 사용할 수 없거나 문제를 일으키는 경우 Bonjour를 비활성화된 상태로 두십시오. macOS가 아닌 서버, Docker 브리지 네트워킹, WSL 또는 mDNS 멀티캐스트를 차단하는 네트워크 정책이 일반적인 사례입니다. Gateway는 게시된 URL, SSH, Tailnet 또는 광역 DNS-SD를 통해 계속 접근할 수 있으며 LAN 자동 검색만 불안정해집니다.

배포 범위의 문제에는 환경 변수 재정의를 사용합니다(Docker 이미지, 서비스 파일, 실행 스크립트 및 일회성 디버깅에 안전하며 환경이 사라지면 함께 사라짐).

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

해당 OpenClaw 구성에서 번들 LAN 검색 Plugin을 의도적으로 끄려면 Plugin 구성을 사용합니다.

```bash
openclaw plugins disable bonjour
```

## Docker 주의 사항

번들 Bonjour Plugin은 `OPENCLAW_DISABLE_BONJOUR`가 설정되지 않은 상태에서 컨테이너가 감지되면 LAN 멀티캐스트 광고를 자동으로 비활성화합니다. Docker 브리지 네트워크는 일반적으로 컨테이너와 LAN 사이에서 mDNS 멀티캐스트(`224.0.0.251:5353`)를 전달하지 않으므로, 컨테이너에서 광고하더라도 검색이 작동하는 경우는 드뭅니다.

주의 사항:

- Bonjour는 macOS 호스트에서 자동 시작되며 다른 환경에서는 명시적으로 활성화해야 합니다. 비활성화된 상태로 두어도 Gateway는 중지되지 않으며 LAN 멀티캐스트 광고만 건너뜁니다.
- Bonjour를 비활성화해도 `gateway.bind`는 변경되지 않습니다. Docker는 계속 기본값인 `OPENCLAW_GATEWAY_BIND=lan`을 사용하므로 게시된 호스트 포트가 작동합니다.
- Bonjour를 비활성화해도 광역 DNS-SD는 비활성화되지 않습니다. Gateway와 Node가 동일한 LAN에 있지 않으면 광역 검색 또는 Tailnet을 사용하십시오.
- Docker 외부에서 동일한 `OPENCLAW_CONFIG_DIR`을 다시 사용해도 컨테이너 자동 비활성화 정책은 유지되지 않습니다.
- mDNS 멀티캐스트가 통과하는 것으로 확인된 호스트 네트워킹, macvlan 또는 기타 네트워크에서만 `OPENCLAW_DISABLE_BONJOUR=0`을 설정하십시오. 강제로 비활성화하려면 `1`로 설정합니다.

## 비활성화된 Bonjour 문제 해결

Docker 설정 후 Node가 더 이상 Gateway를 자동 검색하지 못하는 경우:

1. Gateway가 자동, 강제 활성화 또는 강제 비활성화 모드 중 어느 모드로 실행되는지 확인합니다.

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 게시된 포트를 통해 Gateway 자체에 접근할 수 있는지 확인합니다.

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Bonjour가 비활성화된 경우 직접 대상을 사용합니다.
   - Control UI 또는 로컬 도구: `http://127.0.0.1:18789`
   - LAN 클라이언트: `http://<gateway-host>:18789`
   - 네트워크 간 클라이언트: Tailnet MagicDNS, Tailnet IP, SSH 터널 또는 광역 DNS-SD

4. Docker에서 Bonjour Plugin을 의도적으로 활성화하고 `OPENCLAW_DISABLE_BONJOUR=0`으로 광고를 강제했다면 호스트에서 멀티캐스트를 테스트합니다.

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   탐색 결과가 비어 있거나 Gateway 로그에 ciao 워치독 취소가 반복해서 표시되면 `OPENCLAW_DISABLE_BONJOUR=1`로 복원하고 직접 경로나 Tailnet 경로를 사용하십시오.

## 일반적인 실패 모드

- **Bonjour는 네트워크를 넘어 작동하지 않습니다**: Tailnet 또는 SSH를 사용하세요.
- **멀티캐스트 차단됨**: 일부 Wi-Fi 네트워크는 mDNS를 비활성화합니다.
- **광고자가 탐색/알림 상태에서 멈춤**: 멀티캐스트가 차단된 호스트, 컨테이너 브리지, WSL 또는 인터페이스 변동으로 인해 ciao 광고자가 알림 미완료 상태로 남을 수 있습니다. OpenClaw는 몇 차례 재시도한 후 광고자를 계속 다시 시작하는 대신 현재 Gateway 프로세스에서 Bonjour를 비활성화합니다.
- **Docker 브리지 네트워킹**: 감지된 컨테이너에서는 Bonjour가 자동으로 비활성화됩니다. 호스트, macvlan 또는 다른 mDNS 지원 네트워크에서만 `OPENCLAW_DISABLE_BONJOUR=0`을 설정하세요.
- **절전/인터페이스 변동**: macOS에서 mDNS 결과가 일시적으로 사라질 수 있으므로 다시 시도하세요.
- **탐색은 작동하지만 확인은 실패함**: 머신 이름을 단순하게 유지하고(이모지나 문장 부호 사용 금지) Gateway를 다시 시작하세요. 서비스 인스턴스 이름은 호스트 이름에서 파생되므로 지나치게 복잡한 이름은 일부 리졸버에 혼란을 줄 수 있습니다.

## 이스케이프된 인스턴스 이름 (`\032`)

Bonjour/DNS-SD는 서비스 인스턴스 이름의 바이트를 10진수 `\DDD` 시퀀스로 이스케이프하는 경우가 많습니다(공백은 `\032`가 됨). 이는 프로토콜 수준에서 정상적인 동작이며, UI에서는 표시를 위해 디코딩해야 합니다(iOS는 `BonjourEscapes.decode` 사용).

## 활성화 / 비활성화 / 구성

| 설정                                                 | 효과                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `openclaw plugins enable bonjour`                    | 기본적으로 활성화되지 않은 호스트에서 번들 LAN 검색 Plugin을 활성화합니다.               |
| `openclaw plugins disable bonjour`                   | 번들 Plugin을 비활성화하여 LAN 멀티캐스트 광고를 비활성화합니다.                         |
| `OPENCLAW_DISABLE_BONJOUR=1` (또는 `true`/`yes`/`on`)  | Plugin 구성을 변경하지 않고 LAN 멀티캐스트 광고를 비활성화합니다.                        |
| `OPENCLAW_DISABLE_BONJOUR=0` (또는 `false`/`no`/`off`) | 감지된 컨테이너 내부를 포함해 LAN 멀티캐스트 광고를 강제로 활성화합니다.                 |
| `discovery.mdns.mode`                                | `off` \| `minimal`(기본값) \| `full` — 위의 모드를 참조하세요.                          |
| `gateway.bind`                                       | `~/.openclaw/openclaw.json`에서 Gateway 바인드 모드를 제어합니다.                        |
| `OPENCLAW_SSH_PORT`                                  | `sshPort`가 광고될 때 SSH 포트를 재정의합니다(`full` 모드).                              |
| `OPENCLAW_TAILNET_DNS`                               | mDNS `full` 모드가 활성화되면 TXT에 MagicDNS 힌트를 게시합니다.                          |
| `OPENCLAW_CLI_PATH`                                  | 광고되는 CLI 경로를 재정의합니다(`full` 모드).                                           |

macOS 호스트에서는 기본적으로 번들 LAN 검색 Plugin이 자동으로 시작됩니다. Bonjour Plugin이 활성화되어 있고 `OPENCLAW_DISABLE_BONJOUR`가 설정되지 않은 경우, Bonjour는 일반 호스트에서 광고하며 감지된 컨테이너(Docker, Fly.io 머신 및 일반적인 컨테이너 런타임) 내부에서는 자동으로 비활성화됩니다.

## 관련 문서

- 검색 정책 및 전송 방식 선택: [검색](/ko/gateway/discovery)
- Node 페어링 및 승인: [Gateway 페어링](/ko/gateway/pairing)
