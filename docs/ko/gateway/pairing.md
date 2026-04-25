---
read_when:
    - macOS UI 없이 Node 페어링 승인 구현하기
    - 원격 Node 승인을 위한 CLI 흐름 추가하기
    - Node 관리로 Gateway 프로토콜 확장하기
summary: iOS 및 기타 원격 Node용 Gateway 소유 Node 페어링(옵션 B)
title: Gateway 소유 페어링
x-i18n:
    generated_at: "2026-04-25T06:02:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b512fbf97e7557a1f467732f1b68d8c1b8183695e436b3f87b4c4aca1478cb5
    source_path: gateway/pairing.md
    workflow: 15
---

Gateway 소유 페어링에서는 어떤 Node가 참여할 수 있는지에 대한 단일 진실 공급원이 **Gateway**입니다. UI(macOS 앱, 미래의 클라이언트)는 보류 중인 요청을 승인하거나 거부하는 프런트엔드일 뿐입니다.

**중요:** WS Node는 `connect` 중에 **장치 페어링**(`role: node`)을 사용합니다. `node.pair.*`는 별도의 페어링 저장소이며 WS 핸드셰이크를 제어하지 않습니다. 이 흐름은 명시적으로 `node.pair.*`를 호출하는 클라이언트만 사용합니다.

## 개념

- **보류 중인 요청**: Node가 참여를 요청했으며 승인이 필요합니다.
- **페어링된 Node**: 승인되어 인증 토큰이 발급된 Node입니다.
- **전송 계층**: Gateway WS 엔드포인트는 요청을 전달하지만 멤버십을 결정하지는 않습니다. (레거시 TCP 브리지 지원은 제거되었습니다.)

## 페어링 작동 방식

1. Node가 Gateway WS에 연결하고 페어링을 요청합니다.
2. Gateway는 **보류 중인 요청**을 저장하고 `node.pair.requested`를 발생시킵니다.
3. 요청을 승인하거나 거부합니다(CLI 또는 UI).
4. 승인 시 Gateway는 **새 토큰**을 발급합니다(재페어링 시 토큰은 순환됨).
5. Node는 해당 토큰을 사용해 다시 연결하며 이제 “페어링됨” 상태가 됩니다.

보류 중인 요청은 **5분** 후 자동으로 만료됩니다.

## CLI 워크플로(헤드리스 친화적)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status`는 페어링되었거나 연결된 Node와 해당 기능을 보여줍니다.

## API 표면(Gateway 프로토콜)

이벤트:

- `node.pair.requested` — 새 보류 요청이 생성될 때 발생합니다.
- `node.pair.resolved` — 요청이 승인/거부/만료될 때 발생합니다.

메서드:

- `node.pair.request` — 보류 요청을 생성하거나 재사용합니다.
- `node.pair.list` — 보류 중인 Node + 페어링된 Node를 나열합니다(`operator.pairing`).
- `node.pair.approve` — 보류 요청을 승인합니다(토큰 발급).
- `node.pair.reject` — 보류 요청을 거부합니다.
- `node.pair.verify` — `{ nodeId, token }`를 검증합니다.

참고:

- `node.pair.request`는 Node별로 멱등적입니다. 반복 호출 시 같은 보류 요청을 반환합니다.
- 같은 보류 Node에 대한 반복 요청은 운영자 가시성을 위해 저장된 Node 메타데이터와 최신 허용 목록 기반 선언 명령 스냅샷도 새로 고칩니다.
- 승인 시에는 **항상** 새 토큰이 생성됩니다. `node.pair.request`에서는 토큰이 반환되지 않습니다.
- 요청에는 자동 승인 흐름을 위한 힌트로 `silent: true`를 포함할 수 있습니다.
- `node.pair.approve`는 보류 요청의 선언 명령을 사용해 추가 승인 범위를 강제합니다:
  - 명령 없는 요청: `operator.pairing`
  - exec가 아닌 명령 요청: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 요청:
    `operator.pairing` + `operator.admin`

중요:

- Node 페어링은 신뢰/ID 흐름이며 토큰 발급을 포함합니다.
- 이것이 Node별 실시간 명령 표면을 고정하는 것은 **아닙니다**.
- 실시간 Node 명령은 Gateway의 전역 Node 명령 정책(`gateway.nodes.allowCommands` /
  `denyCommands`)이 적용된 후, Node가 연결 시 선언한 내용에서 옵니다.
- Node별 `system.run` 허용/질문 정책은 페어링 기록이 아니라
  `exec.approvals.node.*` 아래 Node 측에 존재합니다.

## Node 명령 게이팅(2026.3.31+)

<Warning>
**호환성 깨짐 변경:** `2026.3.31`부터 Node 페어링이 승인되기 전까지 Node 명령은 비활성화됩니다. 장치 페어링만으로는 더 이상 선언된 Node 명령이 노출되지 않습니다.
</Warning>

Node가 처음 연결되면 페어링이 자동으로 요청됩니다. 이 페어링 요청이 승인되기 전까지 해당 Node의 모든 보류 중 Node 명령은 필터링되며 실행되지 않습니다. 페어링 승인을 통해 신뢰가 확립되면, Node가 선언한 명령은 일반 명령 정책의 적용을 받으면서 사용 가능해집니다.

의미:

- 이전에 장치 페어링만으로 명령을 노출하던 Node는 이제 Node 페어링도 완료해야 합니다.
- 페어링 승인 전에 대기열에 들어간 명령은 보류되지 않고 삭제됩니다.

## Node 이벤트 신뢰 경계(2026.3.31+)

<Warning>
**호환성 깨짐 변경:** 이제 Node에서 시작된 실행은 축소된 신뢰 표면에 머뭅니다.
</Warning>

Node에서 시작된 요약과 관련 세션 이벤트는 의도된 신뢰 표면으로 제한됩니다. 이전에 더 넓은 호스트 또는 세션 도구 액세스에 의존하던 알림 기반 또는 Node 트리거 흐름은 조정이 필요할 수 있습니다. 이 강화 조치는 Node 이벤트가 Node의 신뢰 경계를 넘어 호스트 수준 도구 액세스로 권한 상승하지 못하도록 보장합니다.

## 자동 승인(macOS 앱)

macOS 앱은 다음 조건에서 선택적으로 **무음 승인**을 시도할 수 있습니다:

- 요청이 `silent`로 표시되어 있고
- 앱이 같은 사용자를 사용해 Gateway 호스트로의 SSH 연결을 검증할 수 있는 경우

무음 승인이 실패하면 일반적인 “승인/거부” 프롬프트로 대체됩니다.

## 신뢰된 CIDR 장치 자동 승인

`role: node`에 대한 WS 장치 페어링은 기본적으로 여전히 수동입니다. Gateway가 이미 네트워크 경로를 신뢰하는 사설
Node 네트워크의 경우, 운영자는 명시적 CIDR 또는 정확한 IP로 선택적으로 설정할 수 있습니다:

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
- 포괄적인 LAN 또는 사설 네트워크 자동 승인 모드는 존재하지 않습니다.
- 요청 범위가 없는 새로운 `role: node` 장치 페어링만 대상이 됩니다.
- 운영자, 브라우저, Control UI, WebChat 클라이언트는 계속 수동입니다.
- 역할, 범위, 메타데이터, 공개 키 업그레이드는 계속 수동입니다.
- 동일 호스트 loopback trusted-proxy 헤더 경로는 로컬 호출자가 위조할 수 있으므로 대상이 아닙니다.

## 메타데이터 업그레이드 자동 승인

이미 페어링된 장치가 비민감 메타데이터 변경만 가지고 다시 연결하는 경우(예: 표시 이름 또는 클라이언트 플랫폼 힌트), OpenClaw는 이를 `metadata-upgrade`로 처리합니다. 무음 자동 승인은 좁은 범위로 적용됩니다. 이는 loopback을 통해 공유 토큰 또는 비밀번호 소유를 이미 증명한, 신뢰된 로컬 CLI/도우미 재연결에만 적용됩니다. 브라우저/Control UI 클라이언트와 원격 클라이언트는 계속 명시적 재승인 흐름을 사용합니다. 범위 업그레이드(read에서 write/admin으로)와 공개 키 변경은 메타데이터 업그레이드 자동 승인의 대상이 **아닙니다**. 이들은 계속 명시적 재승인 요청으로 처리됩니다.

## QR 페어링 도우미

`/pair qr`는 페어링 페이로드를 구조화된 미디어로 렌더링하므로 모바일 및 브라우저 클라이언트가 직접 스캔할 수 있습니다.

장치를 삭제하면 해당 장치 id에 대한 오래된 보류 페어링 요청도 함께 정리되므로 `nodes pending`에 revoke 후 고아 행이 표시되지 않습니다.

## 로컬성 및 전달 헤더

Gateway 페어링은 원시 소켓과 업스트림 프록시 증거가 모두 일치할 때만 연결을 loopback으로 취급합니다. 요청이 loopback으로 들어오더라도 비로컬 출처를 가리키는 `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` 헤더가 있으면, 해당 전달 헤더 증거는 loopback 로컬성 주장을 무효화합니다. 이 경우 페어링 경로는 요청을 동일 호스트 연결로 무음 처리하지 않고 명시적 승인을 요구합니다. 운영자 인증에 대한 동일 규칙은 [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth)를 참고하세요.

## 저장소(로컬, 비공개)

페어링 상태는 Gateway 상태 디렉터리(기본값 `~/.openclaw`) 아래에 저장됩니다:

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

`OPENCLAW_STATE_DIR`를 재정의하면 `nodes/` 폴더도 함께 이동합니다.

보안 참고:

- 토큰은 비밀 값이므로 `paired.json`은 민감 정보로 취급하세요.
- 토큰을 순환하려면 재승인(또는 Node 항목 삭제)이 필요합니다.

## 전송 계층 동작

- 전송 계층은 **무상태**이며 멤버십을 저장하지 않습니다.
- Gateway가 오프라인이거나 페어링이 비활성화되어 있으면 Node는 페어링할 수 없습니다.
- Gateway가 원격 모드인 경우에도 페어링은 원격 Gateway의 저장소를 기준으로 이루어집니다.

## 관련 항목

- [채널 페어링](/ko/channels/pairing)
- [Nodes](/ko/nodes)
- [장치 CLI](/ko/cli/devices)
