---
read_when:
    - macOS UI 없이 Node pairing 승인 구현하기
    - 원격 nodes 승인을 위한 CLI 흐름 추가하기
    - Node 관리 기능으로 gateway 프로토콜 확장하기
summary: iOS 및 기타 원격 nodes를 위한 Gateway 소유 Node pairing (옵션 B)
title: Gateway 소유 pairing
x-i18n:
    generated_at: "2026-04-26T11:30:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 436391f7576b7285733eb4a8283b73d7b4c52f22b227dd915c09313cfec776bd
    source_path: gateway/pairing.md
    workflow: 15
---

Gateway 소유 pairing에서는 **Gateway**가 어떤 nodes의 참여를 허용할지에 대한 단일 진실 공급원입니다.
UI(macOS 앱, 미래의 클라이언트)는 보류 중인 요청을 승인하거나 거부하는
프런트엔드일 뿐입니다.

**중요:** WS nodes는 `connect` 중에 **device pairing**(역할 `node`)을 사용합니다.
`node.pair.*`는 별도의 pairing 저장소이며 WS 핸드셰이크를 제어하지 않습니다.
명시적으로 `node.pair.*`를 호출하는 클라이언트만 이 흐름을 사용합니다.

## 개념

- **보류 중인 요청**: 참여를 요청한 node로, 승인이 필요합니다.
- **pairing된 node**: 승인을 받아 인증 토큰이 발급된 node입니다.
- **전송**: Gateway WS 엔드포인트는 요청을 전달하지만
  멤버십은 결정하지 않습니다. (레거시 TCP bridge 지원은 제거되었습니다.)

## pairing 동작 방식

1. node가 Gateway WS에 연결하고 pairing을 요청합니다.
2. Gateway가 **보류 중인 요청**을 저장하고 `node.pair.requested`를 발생시킵니다.
3. 요청을 승인하거나 거부합니다(CLI 또는 UI).
4. 승인되면 Gateway가 **새 토큰**을 발급합니다(pairing을 다시 하면 토큰이 회전됨).
5. node가 해당 토큰으로 다시 연결하면 이제 “pairing됨” 상태가 됩니다.

보류 중인 요청은 **5분** 후 자동으로 만료됩니다.

## CLI 워크플로(headless 친화적)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`는 pairing된/연결된 nodes와 해당 capabilities를 보여줍니다.

## API 표면 (gateway 프로토콜)

이벤트:

- `node.pair.requested` — 새 보류 요청이 생성될 때 발생합니다.
- `node.pair.resolved` — 요청이 승인/거부/만료될 때 발생합니다.

메서드:

- `node.pair.request` — 보류 요청을 생성하거나 재사용합니다.
- `node.pair.list` — 보류 중 + pairing된 nodes를 나열합니다 (`operator.pairing`).
- `node.pair.approve` — 보류 요청을 승인합니다 (토큰 발급).
- `node.pair.reject` — 보류 요청을 거부합니다.
- `node.pair.verify` — `{ nodeId, token }`을 검증합니다.

참고:

- `node.pair.request`는 node별로 멱등적입니다. 반복 호출 시 동일한
  보류 요청을 반환합니다.
- 같은 보류 node에 대한 반복 요청은 저장된 node
  메타데이터와 operator 가시성을 위한 최신 allowlist 선언 명령 스냅샷도 갱신합니다.
- 승인은 **항상** 새 토큰을 생성합니다. `node.pair.request`에서
  토큰이 반환되는 일은 없습니다.
- 요청에는 자동 승인 흐름을 위한 힌트로 `silent: true`가 포함될 수 있습니다.
- `node.pair.approve`는 추가 승인 범위를 강제하기 위해
  보류 요청의 선언된 명령을 사용합니다:
  - 명령 없는 요청: `operator.pairing`
  - exec이 아닌 명령 요청: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 요청:
    `operator.pairing` + `operator.admin`

중요:

- Node pairing은 신뢰/ID 흐름과 토큰 발급입니다.
- 노드별 라이브 node 명령 표면을 고정하지는 **않습니다**.
- 라이브 node 명령은
  gateway의 전역 node 명령 정책(`gateway.nodes.allowCommands` /
  `denyCommands`)이 적용된 후 node가 연결 시 선언하는 내용에서 옵니다.
- 노드별 `system.run` 허용/질문 정책은 pairing 레코드가 아니라
  node의 `exec.approvals.node.*`에 있습니다.

## Node 명령 게이팅 (2026.3.31+)

<Warning>
**호환성이 깨지는 변경:** `2026.3.31`부터는 node pairing이 승인될 때까지 node 명령이 비활성화됩니다. device pairing만으로는 더 이상 선언된 node 명령이 노출되지 않습니다.
</Warning>

node가 처음 연결되면 pairing이 자동으로 요청됩니다. pairing 요청이 승인될 때까지 해당 node의 모든 보류 중인 node 명령은 필터링되어 실행되지 않습니다. pairing 승인을 통해 신뢰가 확립되면 node가 선언한 명령은 일반 명령 정책의 적용을 받아 사용 가능해집니다.

이 의미는 다음과 같습니다.

- 이전에 device pairing만으로 명령을 노출하던 nodes는 이제 node pairing을 완료해야 합니다.
- pairing 승인 전에 대기열에 들어간 명령은 지연되지 않고 삭제됩니다.

## Node 이벤트 신뢰 경계 (2026.3.31+)

<Warning>
**호환성이 깨지는 변경:** node에서 시작된 실행은 이제 축소된 신뢰 표면에 머뭅니다.
</Warning>

node에서 시작된 요약과 관련 세션 이벤트는 의도된 신뢰 표면으로 제한됩니다. 이전에 더 넓은 호스트 또는 세션 도구 접근에 의존하던 알림 기반 또는 node 트리거 흐름은 조정이 필요할 수 있습니다. 이 강화는 node 이벤트가 node의 신뢰 경계를 넘어 호스트 수준 도구 접근으로 권한 상승할 수 없도록 보장합니다.

## 자동 승인 (macOS 앱)

macOS 앱은 선택적으로 다음 조건에서 **조용한 승인**을 시도할 수 있습니다.

- 요청이 `silent`로 표시되어 있고,
- 앱이 동일한 사용자로 gateway 호스트에 대한 SSH 연결을 검증할 수 있는 경우.

조용한 승인이 실패하면 일반적인 “Approve/Reject” 프롬프트로 fallback합니다.

## Trusted-CIDR device 자동 승인

`role: node`에 대한 WS device pairing은 기본적으로 여전히 수동입니다. private
node 네트워크에서 Gateway가 이미 네트워크 경로를 신뢰하는 경우, 운영자는
명시적인 CIDR 또는 정확한 IP로 옵트인할 수 있습니다.

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

- `gateway.nodes.pairing.autoApproveCidrs`가 설정되지 않으면 비활성화됩니다.
- 일반적인 LAN 또는 private-network 자동 승인 모드는 존재하지 않습니다.
- 요청된 범위가 없는 새로운 `role: node` device pairing만 대상이 됩니다.
- operator, browser, Control UI, WebChat 클라이언트는 계속 수동입니다.
- 역할, 범위, 메타데이터, 공개 키 업그레이드는 계속 수동입니다.
- 동일 호스트 loopback trusted-proxy 헤더 경로는
  로컬 호출자가 스푸핑할 수 있으므로 대상이 아닙니다.

## 메타데이터 업그레이드 자동 승인

이미 pairing된 device가 민감하지 않은 메타데이터 변경만으로 다시 연결되는 경우
(예: 표시 이름 또는 클라이언트 플랫폼 힌트), OpenClaw는
이를 `metadata-upgrade`로 취급합니다. 조용한 자동 승인은 좁게 적용됩니다. 이미 로컬
또는 공유 자격 증명 소유를 증명한 신뢰된 비브라우저 로컬 재연결에만 적용되며,
OS 버전 메타데이터 변경 후의 동일 호스트 네이티브 앱 재연결도 포함합니다. Browser/Control UI 클라이언트와 원격 클라이언트는 여전히 명시적 재승인 흐름을 사용합니다. 범위 업그레이드(read에서 write/admin으로)와 공개 키 변경은 메타데이터 업그레이드 자동 승인의 대상이 **아닙니다** — 계속 명시적 재승인 요청으로 남습니다.

## QR pairing 헬퍼

`/pair qr`는 모바일 및
브라우저 클라이언트가 직접 스캔할 수 있도록 pairing payload를 구조화된 미디어로 렌더링합니다.

device를 삭제하면 해당 device id의 오래된 보류 pairing 요청도 함께 정리되므로,
취소 후 `nodes pending`에 고아 행이 표시되지 않습니다.

## 지역성 및 전달 헤더

Gateway pairing은 원시 소켓과 모든 업스트림 프록시 증거가
둘 다 일치할 때만 연결을 loopback으로 취급합니다. 요청이 loopback으로 들어오지만
`X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 헤더가
비로컬 origin을 가리키면, 그 전달 헤더 증거는 loopback 지역성 주장을 무효화합니다.
그 경우 pairing 경로는 요청을 동일 호스트 연결로 조용히 취급하는 대신
명시적 승인을 요구합니다.
operator 인증의 동등한 규칙은 [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth)를 참조하세요.

## 저장소 (로컬, 비공개)

pairing 상태는 Gateway state 디렉터리 아래에 저장됩니다(기본값 `~/.openclaw`).

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR`를 override하면 `nodes/` 폴더도 함께 이동합니다.

보안 참고:

- 토큰은 비밀 정보입니다. `paired.json`은 민감한 파일로 취급하세요.
- 토큰을 회전하려면 재승인(또는 node 항목 삭제)이 필요합니다.

## 전송 동작

- 전송은 **무상태**이며 멤버십을 저장하지 않습니다.
- Gateway가 오프라인이거나 pairing이 비활성화되면 nodes는 pairing할 수 없습니다.
- Gateway가 원격 모드여도 pairing은 계속 원격 Gateway의 저장소를 기준으로 이루어집니다.

## 관련 항목

- [Channel pairing](/ko/channels/pairing)
- [Nodes](/ko/nodes)
- [Devices CLI](/ko/cli/devices)
