---
read_when:
    - macOS UI 없이 Node 페어링 승인 구현하기
    - 원격 노드 승인을 위한 CLI 흐름 추가
    - Node 관리로 Gateway 프로토콜 확장
summary: iOS 및 기타 원격 노드용 Gateway 소유 노드 페어링(옵션 B)
title: Gateway 소유 페어링
x-i18n:
    generated_at: "2026-04-30T06:32:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

Gateway가 소유한 페어링에서는 어떤 노드가 참여할 수 있는지에 대한 신뢰할 수 있는 기준이 **Gateway**입니다. UI(macOS 앱, 향후 클라이언트)는 대기 중인 요청을 승인하거나 거부하는 프런트엔드일 뿐입니다.

**중요:** WS 노드는 `connect` 중에 **기기 페어링**(역할 `node`)을 사용합니다.
`node.pair.*`는 별도의 페어링 저장소이며 WS 핸드셰이크를 제어하지 **않습니다**.
명시적으로 `node.pair.*`를 호출하는 클라이언트만 이 흐름을 사용합니다.

## 개념

- **대기 중인 요청**: 노드가 참여를 요청했으며 승인이 필요합니다.
- **페어링된 노드**: 발급된 인증 토큰이 있는 승인된 노드입니다.
- **전송**: Gateway WS 엔드포인트는 요청을 전달하지만 멤버십을 결정하지는 않습니다. (레거시 TCP 브리지 지원은 제거되었습니다.)

## 페어링 작동 방식

1. 노드가 Gateway WS에 연결하고 페어링을 요청합니다.
2. Gateway가 **대기 중인 요청**을 저장하고 `node.pair.requested`를 내보냅니다.
3. 요청을 승인하거나 거부합니다(CLI 또는 UI).
4. 승인 시 Gateway가 **새 토큰**을 발급합니다(다시 페어링하면 토큰이 교체됩니다).
5. 노드가 토큰을 사용해 다시 연결하며 이제 “페어링됨” 상태가 됩니다.

대기 중인 요청은 **5분** 후 자동으로 만료됩니다.

## CLI 워크플로(헤드리스 친화적)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`는 페어링/연결된 노드와 해당 기능을 표시합니다.

## API 표면(Gateway 프로토콜)

이벤트:

- `node.pair.requested` — 새 대기 중인 요청이 생성될 때 내보냅니다.
- `node.pair.resolved` — 요청이 승인/거부/만료될 때 내보냅니다.

메서드:

- `node.pair.request` — 대기 중인 요청을 만들거나 재사용합니다.
- `node.pair.list` — 대기 중 + 페어링된 노드를 나열합니다(`operator.pairing`).
- `node.pair.approve` — 대기 중인 요청을 승인합니다(토큰 발급).
- `node.pair.reject` — 대기 중인 요청을 거부합니다.
- `node.pair.remove` — 오래된 페어링된 노드 항목을 제거합니다.
- `node.pair.verify` — `{ nodeId, token }`을 검증합니다.

참고:

- `node.pair.request`는 노드별로 멱등적입니다. 반복 호출은 동일한 대기 중인 요청을 반환합니다.
- 동일한 대기 중인 노드에 대한 반복 요청은 저장된 노드 메타데이터와 운영자 가시성을 위한 최신 허용 목록 선언 명령 스냅샷도 새로 고칩니다.
- 승인은 **항상** 새 토큰을 생성하며, `node.pair.request`에서는 어떤 토큰도 반환되지 않습니다.
- 요청에는 자동 승인 흐름을 위한 힌트로 `silent: true`를 포함할 수 있습니다.
- `node.pair.approve`는 대기 중인 요청의 선언된 명령을 사용해 추가 승인 범위를 적용합니다.
  - 명령이 없는 요청: `operator.pairing`
  - exec가 아닌 명령 요청: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 요청:
    `operator.pairing` + `operator.admin`

<Warning>
노드 페어링은 신뢰 및 ID 흐름과 토큰 발급입니다. 노드별 실시간 노드 명령 표면을 고정하지는 **않습니다**.

- 실시간 노드 명령은 Gateway의 전역 노드 명령 정책(`gateway.nodes.allowCommands` 및 `denyCommands`)이 적용된 후 노드가 연결 시 선언하는 내용에서 옵니다.
- 노드별 `system.run` 허용 및 확인 정책은 페어링 레코드가 아니라 노드의 `exec.approvals.node.*`에 있습니다.

</Warning>

## 노드 명령 게이팅(2026.3.31+)

<Warning>
**호환성이 깨지는 변경:** `2026.3.31`부터 노드 페어링이 승인될 때까지 노드 명령이 비활성화됩니다. 기기 페어링만으로는 더 이상 선언된 노드 명령을 노출하기에 충분하지 않습니다.
</Warning>

노드가 처음 연결되면 페어링이 자동으로 요청됩니다. 페어링 요청이 승인될 때까지 해당 노드의 모든 대기 중인 노드 명령은 필터링되며 실행되지 않습니다. 페어링 승인을 통해 신뢰가 설정되면 노드가 선언한 명령을 일반 명령 정책에 따라 사용할 수 있습니다.

이는 다음을 의미합니다.

- 이전에 명령 노출을 위해 기기 페어링만 사용하던 노드는 이제 노드 페어링을 완료해야 합니다.
- 페어링 승인 전에 대기열에 들어간 명령은 지연되지 않고 삭제됩니다.

## 노드 이벤트 신뢰 경계(2026.3.31+)

<Warning>
**호환성이 깨지는 변경:** 이제 노드에서 시작된 실행은 축소된 신뢰 표면에 머뭅니다.
</Warning>

노드에서 시작된 요약과 관련 세션 이벤트는 의도한 신뢰 표면으로 제한됩니다. 이전에 더 넓은 호스트 또는 세션 도구 접근에 의존하던 알림 기반 또는 노드 트리거 흐름은 조정이 필요할 수 있습니다. 이 강화는 노드 이벤트가 노드의 신뢰 경계가 허용하는 범위를 넘어 호스트 수준 도구 접근으로 상승하지 못하도록 보장합니다.

지속적인 노드 존재 상태 업데이트도 동일한 ID 경계를 따릅니다. `node.presence.alive` 이벤트는 인증된 노드 기기 세션에서만 허용되며, 기기/노드 ID가 이미 페어링된 경우에만 페어링 메타데이터를 업데이트합니다. 자체 선언된 `client.id` 값만으로는 마지막 확인 상태를 쓸 수 없습니다.

## 자동 승인(macOS 앱)

macOS 앱은 다음 조건에서 선택적으로 **무음 승인**을 시도할 수 있습니다.

- 요청이 `silent`로 표시되어 있고,
- 앱이 동일한 사용자를 사용해 Gateway 호스트로의 SSH 연결을 검증할 수 있는 경우.

무음 승인이 실패하면 일반 “승인/거부” 프롬프트로 대체됩니다.

## 신뢰할 수 있는 CIDR 기기 자동 승인

`role: node`에 대한 WS 기기 페어링은 기본적으로 수동입니다. Gateway가 이미 네트워크 경로를 신뢰하는 비공개 노드 네트워크에서는 운영자가 명시적인 CIDR 또는 정확한 IP로 옵트인할 수 있습니다.

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

- `gateway.nodes.pairing.autoApproveCidrs`가 설정되지 않은 경우 비활성화됩니다.
- 포괄적인 LAN 또는 비공개 네트워크 자동 승인 모드는 없습니다.
- 요청된 범위가 없는 새로운 `role: node` 기기 페어링만 대상이 됩니다.
- 운영자, 브라우저, Control UI, WebChat 클라이언트는 계속 수동입니다.
- 역할, 범위, 메타데이터, 공개 키 업그레이드는 계속 수동입니다.
- 동일 호스트 loopback 신뢰 프록시 헤더 경로는 로컬 호출자가 해당 경로를 스푸핑할 수 있으므로 대상이 아닙니다.

## 메타데이터 업그레이드 자동 승인

이미 페어링된 기기가 민감하지 않은 메타데이터 변경(예: 표시 이름 또는 클라이언트 플랫폼 힌트)만으로 다시 연결되면 OpenClaw는 이를 `metadata-upgrade`로 처리합니다. 무음 자동 승인은 좁게 적용됩니다. 이는 로컬 또는 공유 자격 증명 소유를 이미 증명한 신뢰할 수 있는 비브라우저 로컬 재연결에만 적용되며, OS 버전 메타데이터 변경 후 동일 호스트 네이티브 앱 재연결도 포함됩니다. 브라우저/Control UI 클라이언트와 원격 클라이언트는 여전히 명시적 재승인 흐름을 사용합니다. 범위 업그레이드(읽기에서 쓰기/admin으로)와 공개 키 변경은 메타데이터 업그레이드 자동 승인 대상이 **아닙니다**. 이는 명시적 재승인 요청으로 유지됩니다.

## QR 페어링 도우미

`/pair qr`은 모바일 및 브라우저 클라이언트가 직접 스캔할 수 있도록 페어링 페이로드를 구조화된 미디어로 렌더링합니다.

기기를 삭제하면 해당 기기 ID에 대한 오래된 대기 중인 페어링 요청도 함께 정리되므로, 취소 후 `nodes pending`에 고아 행이 표시되지 않습니다.

## 지역성 및 전달된 헤더

Gateway 페어링은 원시 소켓과 모든 업스트림 프록시 증거가 모두 동의할 때만 연결을 loopback으로 간주합니다. 요청이 loopback으로 도착했지만 로컬이 아닌 출처를 가리키는 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 헤더를 포함하는 경우, 해당 전달 헤더 증거는 loopback 지역성 주장을 무효화합니다. 그러면 페어링 경로는 요청을 동일 호스트 연결로 조용히 처리하는 대신 명시적 승인을 요구합니다. 운영자 인증에 대한 동등한 규칙은 [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하세요.

## 저장소(로컬, 비공개)

페어링 상태는 Gateway 상태 디렉터리(기본값 `~/.openclaw`) 아래에 저장됩니다.

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR`을 재정의하면 `nodes/` 폴더도 함께 이동합니다.

보안 참고:

- 토큰은 비밀입니다. `paired.json`을 민감한 파일로 취급하세요.
- 토큰을 교체하려면 재승인(또는 노드 항목 삭제)이 필요합니다.

## 전송 동작

- 전송은 **상태를 저장하지 않습니다**. 멤버십을 저장하지 않습니다.
- Gateway가 오프라인이거나 페어링이 비활성화된 경우 노드는 페어링할 수 없습니다.
- Gateway가 원격 모드인 경우에도 페어링은 원격 Gateway의 저장소를 대상으로 이루어집니다.

## 관련 항목

- [채널 페어링](/ko/channels/pairing)
- [노드](/ko/nodes)
- [기기 CLI](/ko/cli/devices)
