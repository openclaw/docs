---
read_when:
    - macOS UI 없이 Node 페어링 승인 구현하기
    - 원격 Node를 승인하기 위한 CLI 흐름 추가
    - 노드 관리를 통한 Gateway 프로토콜 확장
summary: 'Node 기능 승인: 기기 페어링 후 Node가 명령 실행 기능을 노출하는 방식'
title: Node 페어링
x-i18n:
    generated_at: "2026-07-16T12:41:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

Node 페어링에는 두 계층이 있으며, 둘 다 Gateway의 SQLite 상태 데이터베이스에 있는 페어링된 기기 레코드에 저장됩니다.

- **기기 페어링**(역할 `node`)은 `connect` 핸드셰이크를 제한합니다. 아래의
  [신뢰할 수 있는 CIDR 기기 자동 승인](#trusted-cidr-device-auto-approval)과
  [채널 페어링](/ko/channels/pairing)을 참조하십시오.
- **Node 기능 승인**(`node.pair.*`)은 연결된 Node가 노출할 수 있는
  선언된 기능/명령을 제한합니다. Gateway가 신뢰할 수 있는 정보의 원천이며,
  UI(macOS 앱, Control UI)는 대기 중인 요청을 승인하거나 거부하는
  프런트엔드입니다.

이전의 독립형 Node 페어링 저장소(Node별 토큰이 있는 `nodes/paired.json`,
2026년 1월에 연결 경로에서 폐기됨)는 제거되었습니다. Gateway는 시작할 때
남아 있는 모든 행을 기기 레코드에 한 번 통합하고 레거시 파일을
`.migrated` 접미사로 보관합니다. 레거시 TCP 브리지 지원은
제거되었습니다.

## 기능 승인 작동 방식

1. Node가 Gateway WS에 연결합니다(기기 페어링이 이 단계를 제한합니다).
2. Gateway는 선언된 기능/명령 표면을 승인된 표면과 비교합니다.
   새 표면 또는 확장된 표면은 기기 레코드에 **대기 중인 요청**을 저장하고
   `node.pair.requested`을 내보냅니다.
3. 요청을 승인하거나 거부합니다(CLI 또는 UI).
4. 승인될 때까지 Node 명령은 필터링된 상태로 유지됩니다. 승인되면
   일반 명령 정책에 따라 선언된 표면이 노출됩니다.

대기 중인 요청은 **Node가 마지막으로 재시도한 후 5분이 지나면**
자동으로 만료됩니다. 지속적으로 재연결하는 Node는 시도할 때마다 새 요청과
승인 프롬프트를 생성하는 대신 하나의 대기 중인 요청을 활성 상태로 유지합니다.

## CLI 워크플로(헤드리스 환경에 적합)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`은 페어링/연결된 Node와 해당 기능을 표시합니다.

## API 표면(Gateway 프로토콜)

이벤트:

- `node.pair.requested` - 새로운 대기 중인 요청이 생성될 때 내보냅니다.
- `node.pair.resolved` - 요청이 승인, 거부 또는 만료될 때
  내보냅니다.

메서드:

- `node.pair.list` - 대기 중이거나 페어링된 Node를 나열합니다(`operator.pairing`).
- `node.pair.approve` - 대기 중인 요청을 승인합니다.
- `node.pair.reject` - 대기 중인 요청을 거부합니다.
- `node.pair.remove` - 페어링된 Node를 제거합니다. 페어링된 기기 저장소에서
  기기의 `node` 역할을 취소하고, 이와 함께 승인된 Node 표면을 삭제하며,
  해당 기기의 Node 역할 세션을 무효화하고 연결을 해제합니다. **혼합 역할**
  기기(예: `operator`도 보유한 기기)는 행을 유지하고
  `node` 역할만 잃으며, Node 전용 기기 행은 삭제됩니다. 권한 부여:
  `operator.pairing`은 운영자가 아닌 Node 행을 제거할 수 있습니다. 혼합 역할 기기에서
  **자체** Node 역할을 취소하는 기기 토큰 호출자에게는 추가로
  `operator.admin`이 필요합니다.
- `node.rename` - 페어링된 Node에서 운영자에게 표시되는 이름을 변경합니다.

2026.7에서 제거됨: `node.pair.request` 및 `node.pair.verify`. 대기 중인
요청은 Node 연결 중 Gateway 자체에서 생성되며, 이 메서드들이 제공하던
독립형 Node별 토큰은 더 이상 존재하지 않습니다. Node 인증에는
기기 페어링 토큰을 사용합니다.

참고:

- 변경되지 않은 표면으로 재연결하면 대기 중인 요청을 재사용합니다. 반복
  요청은 저장된 Node 메타데이터와 운영자에게 표시되는 최신 허용 목록의
  선언된 명령 스냅샷을 갱신합니다.
- 운영자 범위 수준과 승인 시점 검사는
  [운영자 범위](/ko/gateway/operator-scopes)에 요약되어 있습니다.
- `node.pair.approve`은 추가 승인 범위를 적용하기 위해 대기 중인 요청의
  선언된 명령을 사용합니다.
  - 명령이 없는 요청: `operator.pairing`
  - 일반 명령 요청: `operator.pairing` + `operator.write`
  - `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` 또는
    `system.execApprovals.get/set`이 포함된 관리자 민감 요청: `operator.pairing` + `operator.admin`

<Warning>
Node 페어링 승인은 신뢰할 수 있는 기능 표면을 기록합니다. Node별 실시간 Node 명령 표면을 고정하지는 **않습니다**.

- 실시간 Node 명령은 Node가 연결 시 선언한 내용에서 가져오며,
  Gateway의 전역 Node 명령 정책(`gateway.nodes.allowCommands` 및
  `denyCommands`)으로 필터링됩니다.
- Node별 `system.run` 허용 및 확인 정책은 페어링 레코드가 아니라
  `exec.approvals.node.*`의 Node에 있습니다.

</Warning>

## Node 명령 제한(2026.3.31 이상)

<Warning>
**호환성을 깨는 변경 사항:** `2026.3.31`부터 Node 페어링이 승인될 때까지 Node 명령이 비활성화됩니다. 이제 선언된 Node 명령을 노출하는 데 기기 페어링만으로는 충분하지 않습니다.
</Warning>

Node가 처음 연결되면 페어링이 자동으로 요청됩니다.
해당 요청이 승인될 때까지 그 Node에서 대기 중인 모든 Node 명령이
필터링되어 실행되지 않습니다. 페어링이 승인되면 일반 명령 정책에 따라
Node가 선언한 명령을 사용할 수 있게 됩니다.

이는 다음을 의미합니다.

- 이전에 명령을 노출하기 위해 기기 페어링에만 의존하던 Node는
  이제 Node 페어링도 완료해야 합니다.
- 페어링 승인 전에 대기열에 추가된 명령은 연기되지 않고 삭제됩니다.

## Node 이벤트 신뢰 경계(2026.3.31 이상)

<Warning>
**호환성을 깨는 변경 사항:** 이제 Node에서 시작된 실행은 축소된 신뢰 표면 내에서만 유지됩니다.
</Warning>

Node에서 시작된 요약 및 관련 세션 이벤트는 의도된 신뢰 표면으로
제한됩니다. 이전에 더 광범위한 호스트 또는 세션 도구 액세스에 의존했던
알림 기반 또는 Node 트리거 흐름은 조정이 필요할 수 있습니다.
이 강화 조치는 Node 이벤트가 Node의 신뢰 경계에서 허용하는 범위를 넘어
호스트 수준 도구 액세스로 권한을 확대하지 못하게 합니다.

지속적인 Node 존재 상태 업데이트도 동일한 ID 경계를 따릅니다.
`node.presence.alive` 이벤트는 인증된 Node 기기 세션에서만 허용되며,
기기/Node ID가 이미 페어링된 경우에만 페어링 메타데이터를 업데이트합니다.
자체 선언한 `client.id` 값만으로는 마지막 확인 상태를 기록할 수 없습니다.

## SSH로 검증된 기기 자동 승인(기본값)

Gateway가 **SSH를 통해 시스템 소유권을 증명**할 수 있으면 비공개/CGNAT 주소에서
처음 수행되는 `role: node` 기기 페어링이 자동 승인됩니다. Gateway는
페어링 호스트(`BatchMode`, `StrictHostKeyChecking=yes`)에 역방향으로 연결하고,
그곳에서 `openclaw node identity --json`을 실행한 후 원격 기기 ID와 공개 키가 대기 중인
요청과 정확히 일치할 때만 승인합니다. 키 일치가 이를 안전하게 만듭니다.
도달 가능성만으로는 절대 승인하지 않으므로 NAT 공동 사용 기기, 공유 호스트의
다른 사용자 및 LAN 스푸핑은 모두 일반 프롬프트로 전환됩니다.

기본적으로 활성화되어 있습니다. 실행되기 위한 요구 사항은 다음과 같습니다.

- Gateway 프로세스 사용자(또는 `sshVerify.user`)가 Node 호스트에
  비대화형으로 SSH 접속할 수 있어야 하며(키/에이전트, Tailscale SSH도 사용 가능),
  호스트 키가 이미 신뢰되어 있어야 합니다.
- `openclaw`이 비대화형 `sh -lc`을 위해 원격 `PATH`에서 확인됩니다.
- 연결 IP는 직접 연결된(프록시되지 않고 루프백이 아닌) 비공개, ULA,
  링크 로컬 또는 CGNAT 주소이거나, 설정된 경우 `sshVerify.cidrs`과 일치해야 합니다.
- 신뢰할 수 있는 CIDR 승인과 동일한 자격 기준을 적용합니다. 범위가 없는
  신규 Node 페어링만 해당하며, 업그레이드, 브라우저, Control UI 및 WebChat에는
  항상 프롬프트가 표시됩니다.

검사가 실행되는 동안 Node 클라이언트에는 수동 승인을 기다리며 일시 중지하는 대신
계속 재시도하도록 지시합니다(`wait_then_retry`). 검사가 실패하면 다음 시도는
일반 프롬프트 흐름으로 전환됩니다. 실패한 대상에는 짧은 대기 시간
(키 불일치 후 5분)이 적용됩니다.

승인된 기기는 `approvedVia: "ssh-verified"`을 기록하며 처음 선언한 기능 표면도 같은 단계에서
승인됩니다. 키 일치는 해당 Node가 운영자가 소유한 시스템에서 운영자의 계정으로
실행됨을 이미 증명하며, 이는 수동 기능 승인이 확인하는 것과 동일합니다.
이후 표면 업그레이드에는 여전히 프롬프트가 표시됩니다.

강화하거나 비활성화하려면 다음과 같이 설정하십시오.

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // 완전히 비활성화:
        sshVerify: false,
        // ...또는 검사 범위/설정 조정:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## 자동 승인(macOS 앱)

다음 조건을 충족하면 macOS 앱이 Node 기능 요청의 **자동 승인**을
시도할 수 있습니다.

- 요청이 `silent`으로 표시되어 있고(기기 페어링이 비대화형으로 승인된 경우
  Gateway는 첫 번째 기능 표면을 자동 승인 대상으로 표시합니다),
- 앱이 동일한 사용자를 사용하여 Gateway 호스트에 대한 SSH 연결을
  검증할 수 있어야 합니다.

자동 승인이 실패하면 일반 Approve/Reject 프롬프트로 전환됩니다.

## 신뢰할 수 있는 CIDR 기기 자동 승인

`role: node`의 WS 기기 페어링은 기본적으로 수동으로 유지됩니다. Gateway가 이미
네트워크 경로를 신뢰하는 비공개 Node 네트워크의 경우 운영자는 명시적인 CIDR 또는
정확한 IP를 사용하여 옵트인할 수 있습니다.

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

보안 경계:

- `gateway.nodes.pairing.autoApproveCidrs`이 설정되지 않으면 비활성화됩니다.
- LAN 또는 비공개 네트워크 전체에 적용되는 자동 승인 모드는 없습니다. 위의
  SSH 검증 자동 승인에는 네트워크 위치만이 아니라 암호화된 기기 키 일치가
  필요합니다.
- 요청된 범위가 없는 신규 `role: node` 기기 페어링 요청만
  해당됩니다.
- 운영자, 브라우저, Control UI 및 WebChat 클라이언트는 수동으로 유지됩니다.
- 역할, 범위, 메타데이터 및 공개 키 업그레이드는 수동으로 유지됩니다.
- 동일 호스트의 루프백 신뢰 프록시 헤더 경로는 로컬 호출자가 스푸핑할 수
  있으므로 해당되지 않습니다.

## 자동 페어링 대체 정리

비대화형 승인은 페어링된 기기 행에 출처를 기록합니다.
동일 호스트 로컬 정책 승인은 `silent`, 신뢰할 수 있는 CIDR Node 승인은
`trusted-cidr`, SSH 검증 Node 승인은 `ssh-verified`으로 기록합니다. 상태 디렉터리가
임시인 클라이언트(임시 홈, 컨테이너, 실행별 샌드박스)는 실행할 때마다 새로운 기기
키 쌍을 발급하며, 실행할 때마다 완전히 새로운 기기로 자동 재페어링됩니다. 정리하지
않으면 페어링 목록에 실행마다 오래된 행이 하나씩 늘어납니다.

Gateway가 **로컬** 기기 페어링을 자동으로 승인하면 동일한 클라이언트 클러스터에
속하며(`clientId`, `clientMode` 및 표시 이름이 일치함) 현재 연결되어 있지
않은 이전 `silent` 승인 레코드를 폐기합니다. 로컬 클라이언트는 Gateway
호스트 자체에서 실행되므로 클러스터 키가 다른 시스템과 일치할 수 없습니다.
폐기된 행의 토큰은 즉시 무효화되며, 일치하는 모든 레거시 Node 페어링 항목이
삭제되고 `node.pair.resolved` 제거 이벤트가 브로드캐스트됩니다.

경계:

- 최신 승인이 동일 호스트의 로컬 승인(`silent`)인 레코드만
  트리거와 대상이 될 수 있습니다. 신뢰할 수 있는 CIDR 및 SSH로 검증된 페어링은
  표시 메타데이터가 머신 ID가 아닌 호스트 간에 이루어지므로
  자동으로 제거되지 않습니다. 이러한 페어링에는 Control UI 정리 기능 또는
  `openclaw nodes remove`을 사용하십시오.
- 소유자가 승인한 페어링과 QR/설정 코드(부트스트랩) 페어링은 자동으로
  제거되지 않습니다. 출처 정보가 존재하기 전에 승인된 레코드는 같은 기기 ID가
  나중에 자동으로 다시 승인되더라도 계속 보호됩니다.
- 현재 연결된 기기는 건너뛰므로, 별도의 상태 디렉터리를 사용하는
  동시 로컬 세션은 활성 상태인 동안 토큰을 유지합니다. 최근 1분 이내에 승인된
  레코드도 건너뛰므로, 동시에 진행되는 페어링 핸드셰이크가 연결 등록 전에
  서로를 폐기할 수 없습니다.
- 영향을 받는 클라이언트는 설계상 로컬이므로 다음 연결 시
  자동으로 다시 페어링됩니다.

## 메타데이터 업그레이드 자동 승인

이미 페어링된 기기가 민감하지 않은 메타데이터 변경 사항(예: 표시 이름 또는
클라이언트 플랫폼 힌트)만 포함하여 다시 연결되면 OpenClaw는 이를
`metadata-upgrade`로 처리합니다. 자동 승인의 적용 범위는 제한적입니다. 로컬 또는
공유 자격 증명을 보유하고 있음을 이미 증명한 신뢰할 수 있는 비브라우저 로컬
재연결에만 적용되며, OS 버전 메타데이터가 변경된 후 동일 호스트의 네이티브 앱이
다시 연결되는 경우도 포함됩니다. 브라우저/Control UI 클라이언트와 원격
클라이언트에는 여전히 명시적 재승인 절차가 적용됩니다. 범위 업그레이드(읽기에서
쓰기/관리자로 변경)와 공개 키 변경은 메타데이터 업그레이드 자동 승인 대상이
**아닙니다**. 이러한 변경은 명시적 재승인 요청으로 유지됩니다.

## QR 페어링 도우미

`/pair qr`은 모바일 및 브라우저 클라이언트가 직접 스캔할 수 있도록
페어링 페이로드를 구조화된 미디어로 렌더링합니다.

기기를 삭제하면 해당 기기 ID에 대해 오래된 대기 중 페어링 요청도 정리되므로,
해지 후 `nodes pending`에 고립된 행이 표시되지 않습니다.

## 로컬 여부와 전달된 헤더

Gateway 페어링은 원시 소켓과 업스트림 프록시 증거가 모두 일치하는 경우에만
연결을 루프백으로 처리합니다. 요청이 루프백으로 들어오지만
`Forwarded`, `X-Forwarded-*` 중 하나 또는 `X-Real-IP` 헤더 증거를
포함하는 경우, 해당 전달 헤더 증거로 인해 루프백 로컬 연결이라는 판단은
무효화되며 페어링 경로는 요청을 동일 호스트 연결로 자동 처리하는 대신 명시적
승인을 요구합니다. 운영자 인증에 적용되는 동등한 규칙은
[신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하십시오.

## 저장소(로컬, 비공개)

페어링 상태는 Gateway 상태 디렉터리(기본값 `~/.openclaw`) 아래의 공유
SQLite 상태 데이터베이스에 있는 페어링된 기기 레코드에 저장됩니다.

- `~/.openclaw/state/openclaw.sqlite`(기기 인증이 있는 페어링된 기기,
  승인된 Node 표면, 대기 중인 표면 요청, 대기 중인 기기 페어링 요청 및
  부트스트랩 토큰)

`OPENCLAW_STATE_DIR`을 재정의하면 데이터베이스도 함께 이동합니다. JSON 저장소를
사용하던 릴리스에서 업그레이드된 Gateway는 시작 시 이를 가져오고
`devices/*.json.migrated` 및 `nodes/*.json.migrated` 아카이브를 남깁니다.

보안 참고 사항:

- 기기 토큰은 비밀 정보이므로 상태 데이터베이스를 민감한 정보로 취급하십시오.
- 기기 토큰 순환에는 `openclaw devices rotate` /
  `device.token.rotate`을 사용합니다.

## 전송 동작

- 전송 계층은 **상태 비저장**이며 구성원 정보를 저장하지 않습니다.
- Gateway가 오프라인이거나 페어링이 비활성화된 경우 Node는 페어링할 수 없습니다.
- 원격 모드에서는 원격 Gateway의 저장소를 대상으로 페어링이 이루어집니다.

## 관련 항목

- [채널 페어링](/ko/channels/pairing)
- [Node CLI](/ko/cli/nodes)
- [기기 CLI](/ko/cli/devices)
