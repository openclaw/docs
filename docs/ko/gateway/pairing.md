---
read_when:
    - macOS UI 없이 Node pairing 승인 구현하기
    - 원격 Node 승인을 위한 CLI 흐름 추가하기
    - Node 관리로 Gateway 프로토콜 확장하기
summary: iOS 및 기타 원격 Node용 Gateway 소유 Node pairing(옵션 B)
title: Gateway 소유 Pairing
x-i18n:
    generated_at: "2026-04-23T14:03:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f644f2dd9a79140156646a78df2a83f0940e3db8160cb083453e43c108eacf3a
    source_path: gateway/pairing.md
    workflow: 15
---

# Gateway 소유 pairing(옵션 B)

Gateway 소유 pairing에서는 **Gateway**가 어떤 Node의 참여를 허용할지에 대한 단일 출처입니다.
UI(macOS 앱, 향후 클라이언트)는 보류 중인 요청을 승인하거나 거부하는 프런트엔드일 뿐입니다.

**중요:** WS Node는 `connect` 중 **장치 pairing**(role `node`)을 사용합니다.
`node.pair.*`는 별도의 pairing 저장소이며 WS 핸드셰이크를 제어하지 않습니다.
명시적으로 `node.pair.*`를 호출하는 클라이언트만 이 흐름을 사용합니다.

## 개념

- **보류 중인 요청**: Node가 참여를 요청했으며 승인이 필요합니다.
- **pairing된 Node**: 승인되었고 인증 토큰이 발급된 Node입니다.
- **전송 계층**: Gateway WS 엔드포인트는 요청을 전달하지만 멤버십을 결정하지는 않습니다. (레거시 TCP 브리지 지원은 제거되었습니다.)

## pairing 동작 방식

1. Node가 Gateway WS에 연결하고 pairing을 요청합니다.
2. Gateway가 **보류 중인 요청**을 저장하고 `node.pair.requested`를 발생시킵니다.
3. 요청을 승인하거나 거부합니다(CLI 또는 UI).
4. 승인 시 Gateway가 **새 토큰**을 발급합니다(재-pair 시 토큰은 회전됨).
5. Node는 해당 토큰으로 다시 연결하고 이제 “pairing됨” 상태가 됩니다.

보류 중인 요청은 **5분** 후 자동으로 만료됩니다.

## CLI 워크플로우(headless 친화적)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`는 pairing된/연결된 Node와 해당 capability를 보여줍니다.

## API 표면(Gateway 프로토콜)

이벤트:

- `node.pair.requested` — 새 보류 요청이 생성될 때 발생합니다.
- `node.pair.resolved` — 요청이 승인/거부/만료될 때 발생합니다.

메서드:

- `node.pair.request` — 보류 요청을 생성하거나 재사용합니다.
- `node.pair.list` — 보류 중 + pairing된 Node를 나열합니다(`operator.pairing`).
- `node.pair.approve` — 보류 요청을 승인합니다(토큰 발급).
- `node.pair.reject` — 보류 요청을 거부합니다.
- `node.pair.verify` — `{ nodeId, token }`를 검증합니다.

참고:

- `node.pair.request`는 Node별로 idem-potent합니다. 반복 호출은 같은 보류 요청을 반환합니다.
- 같은 보류 Node에 대한 반복 요청은 운영자 가시성을 위해 저장된 Node 메타데이터와 최신 allowlist 선언 명령 스냅샷도 새로 고칩니다.
- 승인은 **항상** 새 토큰을 생성합니다. `node.pair.request`에서는 절대 토큰이 반환되지 않습니다.
- 요청에는 자동 승인 흐름을 위한 힌트로 `silent: true`를 포함할 수 있습니다.
- `node.pair.approve`는 추가 승인 범위를 적용하기 위해 보류 요청의 선언 명령을 사용합니다:
  - 명령 없는 요청: `operator.pairing`
  - exec가 아닌 명령 요청: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 요청:
    `operator.pairing` + `operator.admin`

중요:

- Node pairing은 신뢰/ID 흐름과 토큰 발급입니다.
- 이는 live Node 명령 표면을 Node별로 고정하지 **않습니다**.
- live Node 명령은 Gateway의 전역 Node 명령 정책(`gateway.nodes.allowCommands` /
  `denyCommands`)이 적용된 뒤 Node가 connect 시 선언하는 내용에서 옵니다.
- Node별 `system.run` allow/ask 정책은 pairing 레코드가 아니라
  Node의 `exec.approvals.node.*`에 있습니다.

## Node 명령 게이팅(2026.3.31+)

<Warning>
**호환성 깨짐 변경:** `2026.3.31`부터는 Node pairing이 승인되기 전까지 Node 명령이 비활성화됩니다. 장치 pairing만으로는 더 이상 선언된 Node 명령을 노출하기에 충분하지 않습니다.
</Warning>

Node가 처음 연결되면 pairing이 자동으로 요청됩니다. pairing 요청이 승인될 때까지 해당 Node의 모든 보류 중인 Node 명령은 필터링되며 실행되지 않습니다. pairing 승인으로 신뢰가 확립되면 Node가 선언한 명령을 일반 명령 정책에 따라 사용할 수 있게 됩니다.

즉, 다음을 의미합니다:

- 이전에 장치 pairing만으로 명령을 노출하던 Node는 이제 Node pairing을 완료해야 합니다.
- pairing 승인 전에 대기열에 있던 명령은 연기되지 않고 삭제됩니다.

## Node 이벤트 신뢰 경계(2026.3.31+)

<Warning>
**호환성 깨짐 변경:** 이제 Node에서 시작된 실행은 축소된 신뢰 표면에 머뭅니다.
</Warning>

Node에서 시작된 요약 및 관련 session 이벤트는 의도된 신뢰 표면으로 제한됩니다. 이전에 더 넓은 호스트 또는 session tool 접근에 의존하던 알림 기반 또는 Node 트리거 흐름은 조정이 필요할 수 있습니다. 이 강화는 Node 이벤트가 Node의 신뢰 경계가 허용하는 범위를 넘어 호스트 수준 tool 접근으로 상승할 수 없도록 보장합니다.

## 자동 승인(macOS 앱)

macOS 앱은 선택적으로 다음 조건에서 **silent 승인**을 시도할 수 있습니다:

- 요청이 `silent`로 표시되어 있고
- 앱이 같은 사용자를 사용해 Gateway 호스트에 대한 SSH 연결을 검증할 수 있는 경우

silent 승인이 실패하면 일반 “승인/거부” 프롬프트로 대체됩니다.

## 메타데이터 업그레이드 자동 승인

이미 pairing된 장치가 민감하지 않은 메타데이터 변경만 가지고 다시 연결되면
(예: 표시 이름 또는 클라이언트 플랫폼 힌트), OpenClaw는 이를
`metadata-upgrade`로 취급합니다. silent 자동 승인은 범위가 좁습니다. 이는
이미 loopback을 통해 공유 토큰 또는 비밀번호의 소유를 증명한 신뢰된 로컬 CLI/helper 재연결에만 적용됩니다.
브라우저/Control UI 클라이언트와 원격 클라이언트는 계속 명시적인 재승인 흐름을 사용합니다.
범위 업그레이드(read에서 write/admin으로)와 공개 키 변경은 **메타데이터 업그레이드**
자동 승인의 대상이 아닙니다. 이들은 계속 명시적인 재승인 요청으로 남습니다.

## QR pairing 도우미

`/pair qr`는 pairing payload를 구조화된 미디어로 렌더링하므로 모바일과
브라우저 클라이언트가 이를 직접 스캔할 수 있습니다.

장치를 삭제하면 해당 장치 ID에 대한 오래된 보류 pairing 요청도 함께 정리되므로,
취소 후 `nodes pending`에 고아 행이 표시되지 않습니다.

## 로컬리티와 전달 헤더

Gateway pairing은 원시 소켓과 업스트림 프록시 증거가 모두 일치할 때만
연결을 loopback으로 취급합니다. 요청이 loopback으로 도착했더라도
비로컬 출처를 가리키는 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 헤더를
포함하고 있으면, 그 전달 헤더 증거는 loopback 로컬리티 주장 자격을 박탈합니다.
이 경우 pairing 경로는 요청을 동일 호스트 연결로 조용히 취급하는 대신
명시적인 승인을 요구합니다.
운영자 인증의 동등한 규칙은 [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth)를 참조하세요.

## 저장소(로컬, 비공개)

pairing 상태는 Gateway 상태 디렉터리(기본값 `~/.openclaw`) 아래에 저장됩니다:

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR`를 재정의하면 `nodes/` 폴더도 함께 이동합니다.

보안 참고:

- 토큰은 비밀이므로 `paired.json`은 민감하게 취급하세요.
- 토큰을 회전하려면 재승인(또는 Node 항목 삭제)이 필요합니다.

## 전송 동작

- 전송 계층은 **stateless**입니다. 멤버십을 저장하지 않습니다.
- Gateway가 오프라인이거나 pairing이 비활성화되어 있으면 Node는 pairing할 수 없습니다.
- Gateway가 원격 모드인 경우에도 pairing은 원격 Gateway의 저장소를 기준으로 수행됩니다.
